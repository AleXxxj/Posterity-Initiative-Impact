// POST /api/contact   Body: { name, email, subject, message }
// Saves a message for the team to read on the admin page.
const { db, endpoint, isEmail, text } = require('./_lib');

module.exports = endpoint(async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const body = req.body || {};
  if (body.website) return res.status(200).json({ sent: true }); // honeypot: bots fill this

  const name = text(body.name, 120);
  const email = String(body.email || '').trim().toLowerCase();
  const message = text(body.message, 4000);
  if (!name) return res.status(400).json({ error: 'Please tell us your name.' });
  if (!isEmail(email)) return res.status(400).json({ error: 'Please enter a valid email address.' });
  if (!message || message.length < 10) return res.status(400).json({ error: 'Please write a short message.' });

  await db('messages', { method: 'POST', body: { name, email, subject: text(body.subject, 200), message } });
  return res.status(200).json({ sent: true });
});
