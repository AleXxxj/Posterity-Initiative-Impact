// GET /api/inbox  (admin only)
// Newsletter subscribers and contact messages.
const { db, getAdmin, endpoint } = require('./_lib');

module.exports = endpoint(async (req, res) => {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  if (!(await getAdmin(req))) return res.status(401).json({ error: 'Please sign in.' });

  const [subscribers, messages] = await Promise.all([
    db('subscribers?select=email,created_at&order=created_at.desc&limit=5000'),
    db('messages?select=*&order=created_at.desc&limit=200'),
  ]);
  return res.status(200).json({ subscribers, messages });
});
