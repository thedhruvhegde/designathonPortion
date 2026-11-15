/* Vercel serverless function: /api/live
   GET  /api/live?room=main&spectator=<id>        → public view (and counts a projector as a live viewer)
   POST /api/live { room, type: join|ping|bid|start|reset, ... } → { view, reply }
   Host actions (start/reset) need ?key=<HOST_KEY> when HOST_KEY is set. */
import { fresh, reduce, view, tick } from '../engine/live.js';
import { pickStore } from './_store.js';

const store = pickStore();
const keyOf = (room) => `melt:live:${String(room || 'main').replace(/[^\w-]/g, '').slice(0, 24)}`;

export async function handleLive({ method, query = {}, body = {} }) {
  const room = body.room || query.room || 'main', key = keyOf(room), now = Date.now();
  if (method === 'GET') {
    let s = (await store.get(key)) || fresh(room);
    const action = query.spectator ? { type: 'ping', spectator: String(query.spectator).slice(0, 24) } : { type: 'noop' };
    // spectator pings + auto-expiry are writes; best-effort (ignore CAS loss on reads)
    const { state } = reduce(s, action, now);
    state.v = (s.v || 0) + 1; await store.cas(key, s.v || 0, state).catch(() => {});
    return { status: 200, json: { view: view(state, now) } };
  }
  if (['start', 'reset'].includes(body.type) && process.env.HOST_KEY && (query.key || body.key) !== process.env.HOST_KEY)
    return { status: 403, json: { error: 'host key required' } };
  for (let attempt = 0; attempt < 6; attempt++) {
    const s = (await store.get(key)) || fresh(room);
    const { state, reply } = reduce(s, body, Date.now());
    state.v = (s.v || 0) + 1;
    if (await store.cas(key, s.v || 0, state)) return { status: 200, json: { view: view(state, Date.now()), reply } };
  }
  return { status: 409, json: { error: 'busy, retry' } };
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
  const out = await handleLive({ method: req.method, query: req.query || {}, body: body || {} });
  res.status(out.status).json(out.json);
}
export { tick };
