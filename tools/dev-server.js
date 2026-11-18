// Runs the whole site on your own computer: the pages and the API.
//
//   node tools/dev-server.js
//
// Without Supabase settings in the environment it starts a temporary
// in-memory database (tools/mock-supabase.js), so everything works
// offline and nothing real is touched.

const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const PORT = Number(process.env.PORT) || 8787;
const MOCK_PORT = PORT + 1;
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml' };

async function main() {
  let usingMock = false;
  if (!process.env.SUPABASE_URL) {
    usingMock = true;
    const mock = require('./mock-supabase');
    await mock.start(MOCK_PORT);
    process.env.SUPABASE_URL = `http://127.0.0.1:${MOCK_PORT}`;
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'mock-service-key';
    process.env.SUPABASE_ANON_KEY = 'mock-anon-key';
    process.env.ADMIN_EMAILS = mock.ADMIN_EMAIL;
  }
  process.env.SITE_URL = process.env.SITE_URL || `http://localhost:${PORT}`;

  http.createServer((req, res) => {
    const url = new URL(req.url, 'http://localhost');

    if (url.pathname.startsWith('/api/')) {
      const name = url.pathname.slice(5).replace(/[^a-z0-9-]/gi, '');
      const file = path.join(ROOT, 'api', name + '.js');
      if (!name || name.startsWith('_') || !fs.existsSync(file)) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        return res.end('{"error":"Not found"}');
      }
      let raw = '';
      req.on('data', chunk => { raw += chunk; });
      req.on('end', () => {
        // The same request/response helpers Vercel gives a function
        req.query = Object.fromEntries(url.searchParams);
        try { req.body = raw ? JSON.parse(raw) : {}; } catch (err) { req.body = {}; }
        res.status = code => { res.statusCode = code; return res; };
        res.json = data => { res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(data)); return res; };
        Promise.resolve(require(file)(req, res)).catch(err => { console.error(err); res.status(500).json({ error: 'Server error' }); });
      });
      return;
    }

    const safe = path.normalize(decodeURIComponent(url.pathname)).replace(/^(\.\.[/\\])+/, '');
    let file = path.join(ROOT, safe === '/' || safe === path.sep ? 'index.html' : safe);
    if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      return res.end('Not found');
    }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    fs.createReadStream(file).pipe(res);
  }).listen(PORT, '127.0.0.1', () => {
    console.log(`Site running at http://localhost:${PORT}`);
    if (usingMock) console.log('Using a temporary in-memory database. Local sign-in details are in tools/mock-supabase.js.');
  });
}

main();
