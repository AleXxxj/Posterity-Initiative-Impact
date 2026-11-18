// ============================================================
// Shared helpers for the API functions.
// Files starting with "_" are not exposed as routes by Vercel.
// ============================================================

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ANON_KEY = process.env.SUPABASE_ANON_KEY;

function isConfigured() {
  return Boolean(SUPABASE_URL && SERVICE_KEY);
}

// Minimal Supabase REST (PostgREST) call using the service role key,
// which bypasses row level security. Never send this key to a browser.
async function db(path, { method = 'GET', body, prefer } = {}) {
  const headers = {
    apikey: SERVICE_KEY,
    Authorization: `Bearer ${SERVICE_KEY}`,
    'Content-Type': 'application/json',
  };
  if (prefer) headers.Prefer = prefer;

  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Database error ${res.status}: ${text.slice(0, 300)}`);
  return text ? JSON.parse(text) : null;
}

// Confirms the caller is a signed-in admin: the browser sends the
// Supabase session token, Supabase tells us whose it is, and we
// check that email against the ADMIN_EMAILS allow-list.
async function getAdmin(req) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!token || !ANON_KEY) return null;

  const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: { apikey: ANON_KEY, Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return null;
  const user = await res.json();

  const allowed = (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map(e => e.trim().toLowerCase())
    .filter(Boolean);
  const email = String(user.email || '').toLowerCase();
  return email && allowed.includes(email) ? { email } : null;
}

function isEmail(value) {
  return typeof value === 'string' && value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

// Trims a text field and caps its length; returns null when empty.
function text(value, max) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim().slice(0, max);
  return trimmed || null;
}

function isDate(value) {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value));
}

function isHttpUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch (err) {
    return false;
  }
}

// Wraps a handler with the checks every endpoint needs.
function endpoint(handler) {
  return async (req, res) => {
    if (!isConfigured()) {
      return res.status(503).json({ error: 'The database is not connected yet.' });
    }
    try {
      return await handler(req, res);
    } catch (err) {
      console.error(`${req.method} ${req.url} failed:`, err);
      return res.status(500).json({ error: 'Something went wrong. Please try again.' });
    }
  };
}

module.exports = { db, getAdmin, isEmail, isDate, isHttpUrl, text, endpoint, ANON_KEY, SUPABASE_URL };
