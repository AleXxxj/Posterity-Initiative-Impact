// A small in-memory stand-in for Supabase, for local development only.
// It understands just enough of the REST and Auth APIs for this site,
// and forgets everything when it stops. Never deploy this.

const http = require('http');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const PRIMARY_KEYS = { donations: 'reference', subscribers: 'email' };
const tables = { donations: [], expenses: [], opportunities: [], subscribers: [], messages: [] };
const tokens = new Map();

// Local test sign-in. Override with MOCK_ADMIN_EMAIL / MOCK_ADMIN_PASSWORD.
const ADMIN_EMAIL = process.env.MOCK_ADMIN_EMAIL || 'admin@example.test';
const ADMIN_PASSWORD = process.env.MOCK_ADMIN_PASSWORD || 'local-preview-only';

function seed() {
  const file = path.join(__dirname, '..', 'data', 'opportunities.json');
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));
  data.items.forEach(item => tables.opportunities.push({
    id: crypto.randomUUID(),
    title: item.title, organiser: item.organiser, type: item.type, summary: item.summary,
    eligibility: item.eligibility || null, url: item.url, opens: item.opens || null,
    deadline: item.deadline || null, deadline_note: item.deadlineNote || null,
    checked: item.checked, published: true, verified: true, source: null, source_id: null, created_at: new Date().toISOString(),
  }));
}

function send(res, status, body) {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': '*',
    'Access-Control-Allow-Methods': 'GET,POST,PATCH,DELETE,OPTIONS',
  });
  res.end(body === undefined ? '' : JSON.stringify(body));
}

function matches(row, params) {
  for (const [key, value] of params) {
    if (['select', 'order', 'limit', 'on_conflict'].includes(key)) continue;
    if (value.startsWith('eq.') && String(row[key]) !== value.slice(3)) return false;
    if (value.startsWith('lt.') && !(row[key] != null && String(row[key]) < value.slice(3))) return false;
  }
  return true;
}

function handleRest(req, res, url, body) {
  const table = url.pathname.split('/')[3];
  const rows = tables[table];
  if (!rows) return send(res, 404, { message: 'no such table' });
  const prefer = req.headers.prefer || '';
  const wantRows = prefer.includes('return=representation');

  if (req.method === 'GET') {
    let out = rows.filter(r => matches(r, url.searchParams));
    const order = url.searchParams.get('order');
    if (order) {
      const [col, dir] = order.split('.');
      out = out.slice().sort((a, b) => {
        if (a[col] == null) return 1;
        if (b[col] == null) return -1;
        return (dir === 'desc' ? -1 : 1) * String(a[col]).localeCompare(String(b[col]));
      });
    }
    const limit = Number(url.searchParams.get('limit'));
    return send(res, 200, limit ? out.slice(0, limit) : out);
  }

  if (req.method === 'POST') {
    const pk = url.searchParams.get('on_conflict') || PRIMARY_KEYS[table] || 'id';
    const created = [];
    for (const input of Array.isArray(body) ? body : [body]) {
      const row = { created_at: new Date().toISOString(), ...input };
      if (!PRIMARY_KEYS[table] && !row.id) row.id = crypto.randomUUID();
      if (table === 'opportunities' && row.verified === undefined) row.verified = true;
      if (table === 'opportunities' && row.published === undefined) row.published = true;
      const existing = row[pk] == null ? -1 : rows.findIndex(r => r[pk] === row[pk]);
      if (existing >= 0) {
        if (prefer.includes('ignore-duplicates')) continue;
        if (prefer.includes('merge-duplicates')) { rows[existing] = { ...rows[existing], ...row }; created.push(rows[existing]); continue; }
        return send(res, 409, { message: 'duplicate key' });
      }
      rows.push(row);
      created.push(row);
    }
    return send(res, 201, wantRows ? created : undefined);
  }

  if (req.method === 'PATCH') {
    const changed = rows.filter(r => matches(r, url.searchParams));
    changed.forEach(r => Object.assign(r, body));
    return send(res, 200, wantRows ? changed : undefined);
  }

  if (req.method === 'DELETE') {
    tables[table] = rows.filter(r => !matches(r, url.searchParams));
    return send(res, 204);
  }
  return send(res, 405, { message: 'method not allowed' });
}

function handleAuth(req, res, url, body) {
  if (url.pathname === '/auth/v1/token' && req.method === 'POST') {
    if (body && body.email === ADMIN_EMAIL && body.password === ADMIN_PASSWORD) {
      const token = crypto.randomBytes(24).toString('hex');
      tokens.set(token, body.email);
      return send(res, 200, { access_token: token, user: { email: body.email } });
    }
    return send(res, 400, { error: 'invalid_grant' });
  }
  if (url.pathname === '/auth/v1/user') {
    const email = tokens.get((req.headers.authorization || '').replace('Bearer ', ''));
    return email ? send(res, 200, { email }) : send(res, 401, { message: 'invalid token' });
  }
  return send(res, 404, { message: 'not found' });
}

function start(port) {
  seed();
  const server = http.createServer((req, res) => {
    if (req.method === 'OPTIONS') return send(res, 204);
    const url = new URL(req.url, 'http://localhost');
    let raw = '';
    req.on('data', chunk => { raw += chunk; });
    req.on('end', () => {
      let body = null;
      try { body = raw ? JSON.parse(raw) : null; } catch (err) { return send(res, 400, { message: 'bad json' }); }
      if (url.pathname.startsWith('/rest/v1/')) return handleRest(req, res, url, body);
      if (url.pathname.startsWith('/auth/v1/')) return handleAuth(req, res, url, body);
      return send(res, 404, { message: 'not found' });
    });
  });
  return new Promise(resolve => server.listen(port, '127.0.0.1', () => resolve(server)));
}

module.exports = { start, ADMIN_EMAIL };
