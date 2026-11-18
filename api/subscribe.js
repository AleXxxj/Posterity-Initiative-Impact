// POST /api/subscribe   Body: { email }
// Adds an address to the newsletter list. Subscribing twice is harmless.
const { db, endpoint, isEmail } = require('./_lib');

module.exports = endpoint(async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const body = req.body || {};
  if (body.website) return res.status(200).json({ subscribed: true }); // honeypot: bots fill this
  const email = String(body.email || '').trim().toLowerCase();
  if (!isEmail(email)) return res.status(400).json({ error: 'Please enter a valid email address.' });

  await db('subscribers', { method: 'POST', body: { email }, prefer: 'resolution=ignore-duplicates' });
  return res.status(200).json({ subscribed: true });
});
