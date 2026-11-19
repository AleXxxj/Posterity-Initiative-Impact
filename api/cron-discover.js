// /api/cron-discover
// Runs once a day (see vercel.json). Adds new opportunities found in
// the source feeds and clears out auto-listed ones that have expired.
// A signed-in admin can also run it from the staff area.
const { db, getAdmin, endpoint } = require('./_lib');
const { discover } = require('./_discover');

const MAX_NEW_PER_RUN = 25;

module.exports = endpoint(async (req, res) => {
  if (req.method !== 'GET' && req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // Vercel Cron sends "Authorization: Bearer <CRON_SECRET>"
  const secret = process.env.CRON_SECRET;
  const fromCron = Boolean(secret) && req.headers.authorization === `Bearer ${secret}`;
  if (!fromCron && !(await getAdmin(req))) return res.status(401).json({ error: 'Not allowed.' });

  const today = new Date().toISOString().slice(0, 10);
  const { rows, report } = await discover(today);

  // Rows whose source link is already in the table are ignored
  let added = [];
  if (rows.length) {
    added = await db('opportunities?on_conflict=source_id', {
      method: 'POST',
      body: rows.slice(0, MAX_NEW_PER_RUN),
      prefer: 'resolution=ignore-duplicates,return=representation',
    }) || [];
  }

  // Auto-listed entries nobody checked are removed two weeks after closing
  const cutoff = new Date(Date.parse(today) - 14 * 86400000).toISOString().slice(0, 10);
  await db(`opportunities?verified=eq.false&deadline=lt.${cutoff}`, { method: 'DELETE' });

  return res.status(200).json({ added: added.length, titles: added.map(r => r.title), report });
});
