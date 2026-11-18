// GET /api/config
// Public settings the admin page needs to sign in with Supabase.
// The anon key is designed to be public; the service key is never sent.
const { ANON_KEY, SUPABASE_URL } = require('./_lib');

module.exports = (req, res) => {
  if (!SUPABASE_URL || !ANON_KEY) {
    return res.status(503).json({ error: 'Sign-in is not set up yet.' });
  }
  res.setHeader('Cache-Control', 'public, max-age=300');
  return res.status(200).json({ supabaseUrl: SUPABASE_URL, supabaseAnonKey: ANON_KEY });
};
