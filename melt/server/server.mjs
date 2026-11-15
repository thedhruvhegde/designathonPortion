/* Melt local backend: zero dependencies (Node ≥ 22).
   - Static app (melt/) at /
   - Market REST + Server-Sent Events at /api/market/*
   - Melt Live judges' auction at /api/live (same handler Vercel runs)
   Run: node server/server.mjs  →  http://localhost:8787  (PORT env to change) */
import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Market } from '../engine/market.js';
import { handleLive } from '../api/live.js';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const PORT = +process.env.PORT || 8787;
const SPEED = +process.env.MELT_SPEED || 0.05; // sim hours per real second (1 h = 20 s)
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.md': 'text/markdown' };

const market = new Market({ seed: 42, now: 30 });
const clients = new Set();
let speed = SPEED;
setInterval(() => {
  const ev = market.advance(speed);
  const msg = `event: tick\ndata: ${JSON.stringify({ now: market.now, events: ev, impact: market.impact() })}\n\n`;
  for (const c of clients) c.write(msg);
}, 1000);

const json = (res, status, obj) => { res.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'Access-Control-Allow-Origin': '*' }); res.end(JSON.stringify(obj)); };
async function body(req) { let b = ''; for await (const c of req) b += c; try { return b ? JSON.parse(b) : {}; } catch { return {}; } }

const routes = [
  ['GET', /^\/api\/market\/state$/, () => ({ now: market.now, speed, items: market.list(), impact: market.impact(), feed: market.feed.slice(0, 20) })],
  ['GET', /^\/api\/market\/items\/(\w+)$/, (m, q) => { const it = market.get(m[1]); return it && { item: market.view(it), curve: market.curve(m[1]), gauge: market.gauge(m[1], q.value ? +q.value : undefined) }; }],
  ['POST', /^\/api\/market\/items\/(\w+)\/watch$/, (m) => market.watch(m[1])],
  ['POST', /^\/api\/market\/items\/(\w+)\/claim$/, (m, q, b) => market.claim(m[1], b.who || 'you')],
  ['POST', /^\/api\/market\/items$/, (m, q, b) => market.addListing(b)],
  ['GET', /^\/api\/market\/kindness$/, () => market.kindness()],
  ['GET', /^\/api\/market\/routes$/, (m, q) => market.routes(q.capacity ? +q.capacity : undefined)],
  ['GET', /^\/api\/market\/impact$/, () => market.impact()],
  ['POST', /^\/api\/market\/clock$/, (m, q, b) => { if (b.speed != null) speed = +b.speed; if (b.advance) market.advance(+b.advance); return { now: market.now, speed }; }],
];

http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x'), q = Object.fromEntries(url.searchParams), path = url.pathname;
  try {
    if (req.method === 'OPTIONS') { res.writeHead(204, { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'content-type', 'Access-Control-Allow-Methods': 'GET,POST' }); return res.end(); }
    if (path === '/api/market/stream') {
      res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-store', Connection: 'keep-alive', 'Access-Control-Allow-Origin': '*' });
      res.write(`event: hello\ndata: ${JSON.stringify({ now: market.now })}\n\n`); clients.add(res); req.on('close', () => clients.delete(res)); return;
    }
    if (path === '/api/live') { const out = await handleLive({ method: req.method, query: q, body: req.method === 'POST' ? await body(req) : {} }); return json(res, out.status, out.json); }
    for (const [method, re, fn] of routes) {
      const m = path.match(re);
      if (m && req.method === method) { const out = await fn(m, q, method === 'POST' ? await body(req) : {}); return out ? json(res, 200, out) : json(res, 404, { error: 'not found' }); }
    }
    if (path.startsWith('/api/')) return json(res, 404, { error: 'no route' });
    // static
    let file = normalize(join(ROOT, path === '/' ? 'web/index.html' : decodeURIComponent(path)));
    if (!file.startsWith(ROOT)) return json(res, 403, { error: 'forbidden' });
    if ((await stat(file).catch(() => null))?.isDirectory()) file = join(file, 'index.html');
    const data = await readFile(file);
    res.writeHead(200, { 'Content-Type': MIME[extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-cache' }); res.end(data);
  } catch (e) { if (e.code === 'ENOENT') return json(res, 404, { error: 'not found' }); console.error(e); json(res, 500, { error: 'server error' }); }
}).listen(PORT, () => console.log(`Melt running → http://localhost:${PORT}  (market speed ${speed} h/s)`));
