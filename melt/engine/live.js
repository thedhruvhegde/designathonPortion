/* Melt Live: the judges' QR auction. A pure reducer over one JSON doc, so it runs the same on
   the local Node server (memory) and on Vercel functions (Upstash Redis). */
import { auctionPrice, EMISSION } from './melt.js';

export const WALLET = 150;          // Melt Bucks per judge
export const LOT_SECONDS = 40;      // each lot melts to $0 in 40 s
export const ONLINE_MS = 8000;      // a viewer counts as live if seen in the last 8 s

export const LOTS = [
  { id: 'L1', name: 'Grey futon, folds flat', glyph: 'futon', category: 'furniture', p0: 80, kg: 30, story: 'Ava, Maple Quad: "It held four years of movie nights."' },
  { id: 'L2', name: 'Mini-fridge 3.1 cu ft', glyph: 'fridge', category: 'appliance', p0: 70, kg: 22, story: 'Jun, Elm Court: "Cleaned and still cold."' },
  { id: 'L3', name: 'Commuter bike, 21-speed', glyph: 'bike', category: 'bike', p0: 120, kg: 14, story: 'Priya, North Hall: "New tubes in March."' },
  { id: 'L4', name: 'Winter parka, M', glyph: 'parka', category: 'clothing', p0: 60, kg: 1.6, story: 'Mateo, Riverside: "For someone\'s first snow."' },
  { id: 'L5', name: '27" monitor', glyph: 'monitor', category: 'electronics', p0: 90, kg: 5.5, story: 'Zainab, Oak House: "My thesis lived on this."' },
];

export function fresh(room = 'main') {
  return { v: 0, room, lots: LOTS.map((l) => ({ ...l, result: null })), lotIndex: -1, phase: 'lobby', startAt: 0, players: {}, spectators: {}, feed: [] };
}

export const lotPrice = (lot, startAt, now) => auctionPrice(lot.p0, (now - startAt) / 1000, LOT_SECONDS, 0.06);

/** derive the public view (computed fields, no secrets) */
export function view(s, now = Date.now()) {
  const lot = s.lots[s.lotIndex] || null;
  const elapsed = lot && s.phase === 'running' ? (now - s.startAt) / 1000 : 0;
  // auto-expire: a lot that melts to $0 unsold transforms into a donation
  const players = Object.values(s.players);
  const live = players.filter((p) => now - p.lastSeen < ONLINE_MS).length + Object.values(s.spectators).filter((t) => now - t < ONLINE_MS).length;
  const sold = s.lots.filter((l) => l.result?.type === 'sold');
  const donated = s.lots.filter((l) => l.result?.type === 'donated');
  const kg = [...sold, ...donated].reduce((a, l) => a + l.kg, 0);
  return {
    room: s.room, phase: s.phase, lotIndex: s.lotIndex, serverNow: now, startAt: s.startAt, lotSeconds: LOT_SECONDS,
    lot: lot && { ...lot, price: s.phase === 'running' ? lotPrice(lot, s.startAt, now) : lot.result?.price ?? lot.p0, elapsed },
    lots: s.lots.map((l) => ({ id: l.id, name: l.name, glyph: l.glyph, p0: l.p0, result: l.result })),
    live, players: players.length,
    leaderboard: players.map((p) => ({ name: p.name, balance: p.balance, won: p.won.length, saved: p.won.reduce((a, w) => a + (w.p0 - w.price), 0) })).sort((a, b) => b.won - a.won || b.saved - a.saved).slice(0, 8),
    feed: s.feed.slice(0, 12),
    impact: { kg, co2: [...sold, ...donated].reduce((a, l) => a + l.kg * (EMISSION[l.category] || 2), 0), kept: sold.reduce((a, l) => a + (l.p0 - l.result.price), 0), landfill: 0 },
  };
}

/** apply an action; returns { state, reply }. `now` is server time in ms. */
export function reduce(s, a, now = Date.now()) {
  s = structuredClone(s);
  const say = (text) => { s.feed.unshift({ at: now, text }); s.feed.length = Math.min(s.feed.length, 40); };
  tick(s, now, say);
  switch (a.type) {
    case 'join': {
      const name = String(a.name || 'Judge').trim().slice(0, 18) || 'Judge';
      const id = a.id && s.players[a.id] ? a.id : 'p' + Math.random().toString(36).slice(2, 9);
      if (!s.players[id]) { s.players[id] = { id, name, balance: WALLET, won: [], lastSeen: now }; say(`${name} joined with $${WALLET} in Melt Bucks`); }
      s.players[id].lastSeen = now;
      return { state: s, reply: { id, me: s.players[id] } };
    }
    case 'ping': {
      if (a.id && s.players[a.id]) s.players[a.id].lastSeen = now;
      if (a.spectator) s.spectators[a.spectator] = now;
      return { state: s, reply: { me: s.players[a.id] || null } };
    }
    case 'start': { // host: start lot i (or next)
      const i = a.index ?? s.lotIndex + 1;
      if (i >= s.lots.length) { s.phase = 'done'; say('The auction is over. Nothing went to the dumpster.'); return { state: s, reply: {} }; }
      s.lotIndex = i; s.phase = 'running'; s.startAt = now + 1500; // 1.5 s countdown
      say(`Lot ${i + 1}: ${s.lots[i].name} starts melting from $${s.lots[i].p0}`);
      return { state: s, reply: {} };
    }
    case 'bid': {
      const p = s.players[a.id]; const lot = s.lots[s.lotIndex];
      if (!p) return { state: s, reply: { ok: false, reason: 'Join first' } };
      p.lastSeen = now;
      if (s.phase !== 'running' || !lot || lot.result) return { state: s, reply: { ok: false, reason: 'Too late. It\'s gone.' } };
      if (now < s.startAt) return { state: s, reply: { ok: false, reason: 'Not melting yet' } };
      const price = lotPrice(lot, s.startAt, now);
      if (price > p.balance) return { state: s, reply: { ok: false, reason: `Not enough Melt Bucks ($${p.balance} left)` } };
      p.balance = +(p.balance - price).toFixed(2); p.won.push({ lot: lot.id, price, p0: lot.p0 });
      lot.result = { type: 'sold', price, to: p.name, atSec: +((now - s.startAt) / 1000).toFixed(2) };
      s.phase = 'sold'; say(`SOLD: ${lot.name} to ${p.name} at $${price.toFixed(2)} (${Math.round((1 - price / lot.p0) * 100)}% melted)`);
      return { state: s, reply: { ok: true, price, me: p } };
    }
    case 'reset': return { state: fresh(s.room), reply: {} };
    default: return { state: s, reply: {} };
  }
}

/** time-driven transitions: an unsold lot that hits $0 transforms into a donation */
export function tick(s, now, say = () => {}) {
  const lot = s.lots[s.lotIndex];
  if (s.phase === 'running' && lot && !lot.result && now - s.startAt >= LOT_SECONDS * 1000) {
    lot.result = { type: 'donated', price: 0 }; s.phase = 'sold';
    say(`${lot.name} melted to $0 and goes to the Kindness Window, then donation. Not the dumpster.`);
  }
  return s;
}
