/* Market state machine: one implementation, run by the Node server (authoritative)
   or in the browser when no server is reachable (offline demo mode). */
import { TEMPERAMENTS, priceAt, claimGauge, galeShapley, needScore, clarkeWright, twoOpt, routeLength, impact, auctionPrice, mulberry32, meltPrice } from './melt.js';
import { buildCatalog, CAMPUS, CLAIMANTS } from '../data/catalog.js';

export const STATUS = { MELTING: 'melting', SOLD: 'sold', KINDNESS: 'kindness', FREE: 'free', CLAIMED: 'claimed', DONATION: 'donation', PICKED: 'picked' };
const KINDNESS_HOURS = 2, FREE_HOURS = 4;

export class Market {
  constructor({ seed = 42, now = 30 } = {}) {
    this.seed = seed; this.now = now; this.items = buildCatalog(seed, now); this.feed = []; this.auction = null;
    this.scores = Object.fromEntries(CLAIMANTS.map((c, i) => [c.id, needScore(c, mulberry32(seed + i))]));
    for (const it of this.items) { it.status = STATUS.MELTING; it.watchers = 0; }
    // replay the market's history up to `now`, so the demo opens mid-week with real outcomes
    const target = this.now; this.now = 0;
    while (this.now < target) this.advance(Math.min(1, target - this.now));
    this.feed.length = Math.min(this.feed.length, 24);
  }
  age(it) { return this.now - it.listedAt; }
  /** live view of one item */
  view(it) {
    const t = this.age(it), { price, heat, s } = priceAt(it, t);
    const seen = it.events.filter((e) => e <= t).length;
    return { ...it, events: undefined, t, s, price: it.status === STATUS.SOLD ? it.soldAt : (it.status === STATUS.MELTING ? price : 0), heat, watchers: seen, hoursLeft: Math.max(0, it.T - t), progress: Math.min(1, t / it.T) };
  }
  list() { return this.items.map((i) => this.view(i)); }
  get(id) { return this.items.find((i) => i.id === id); }
  /** curve samples for charts: base (no heat) vs actual, 0..T */
  curve(id, n = 120) {
    const it = this.get(id), out = [];
    for (let i = 0; i <= n; i++) { const t = (it.T * i) / n; out.push({ t, base: meltPrice(it.p0, it.k, it.T, t), actual: priceAt(it, t).price }); }
    return out;
  }
  gauge(id, value) { const it = this.get(id); return claimGauge(it, this.age(it), value ?? it.p0 * 0.8); }

  /** advance the clock by dh hours; run status transitions; returns events emitted */
  advance(dh) {
    const before = this.now; this.now += dh; const out = [];
    for (const it of this.items) {
      const t = this.age(it);
      const newWatch = it.events.filter((e) => e > before - it.listedAt && e <= t).length;
      if (newWatch) out.push({ type: 'watch', id: it.id, n: newWatch });
      if (it.status === STATUS.MELTING && t >= it.T) { it.status = STATUS.KINDNESS; it.zeroAt = this.now; out.push({ type: 'zero', id: it.id }); }
      if (it.status === STATUS.KINDNESS && this.now - it.zeroAt >= KINDNESS_HOURS) { it.status = STATUS.FREE; out.push({ type: 'free', id: it.id }); }
      if (it.status === STATUS.FREE && this.now - it.zeroAt >= KINDNESS_HOURS + FREE_HOURS) { it.status = STATUS.DONATION; it.outcome = 'donated'; it.soldAt = 0; out.push({ type: 'donation', id: it.id }); }
    }
    // background buyers: a seeded Poisson process, so the market feels alive (rate ∝ hazard)
    const r = mulberry32(Math.floor(this.now * 10) + this.seed);
    for (const it of this.items) if (it.status === STATUS.MELTING && dh > 0) {
      const g = claimGauge(it, this.age(it), it.p0);
      if (r() < 1 - Math.exp(-g.hazard * dh * 0.12)) { this.claim(it.id, 'a student', true); out.push({ type: 'sold', id: it.id, price: it.soldAt }); }
    }
    this.feed.unshift(...out.map((e) => ({ ...e, at: this.now }))); this.feed.length = Math.min(this.feed.length, 60);
    return out;
  }
  watch(id) { const it = this.get(id); it.events.push(this.age(it) - 1e-3); it.events.sort((a, b) => a - b); return this.view(it); }
  claim(id, who = 'you', silent = false) {
    const it = this.get(id); if (![STATUS.MELTING, STATUS.FREE, STATUS.KINDNESS].includes(it.status)) return { ok: false, reason: 'gone' };
    const price = it.status === STATUS.MELTING ? priceAt(it, this.age(it)).price : 0;
    it.status = it.status === STATUS.MELTING ? STATUS.SOLD : STATUS.CLAIMED; it.soldAt = price; it.buyer = who; it.outcome = 'reused';
    if (!silent) this.feed.unshift({ type: 'sold', id, price, at: this.now, who });
    return { ok: true, price };
  }
  addListing({ name, glyph = 'bins', category = 'furniture', p0, kg = 5, ft3 = 2, dorm = 'river', temperament = 'steady', T = 72, k }) {
    const id = 'u' + String(this.items.length + 1).padStart(3, '0');
    const it = { id, name, glyph, category, p0: +p0, kg, ft3, condition: 'Good', blurb: 'Just listed.', dorm, seller: 'You', listedAt: this.now, T, temperament, k: k ?? TEMPERAMENTS[temperament], events: [], status: STATUS.MELTING };
    this.items.unshift(it); this.feed.unshift({ type: 'listed', id, at: this.now }); return this.view(it);
  }

  /** Kindness Window: stable matching over items currently in KINDNESS (or a preview set) */
  kindness(preview = true) {
    let pool = this.items.filter((i) => i.status === STATUS.KINDNESS);
    if (preview && pool.length < 6) pool = [...this.items].filter((i) => i.status === STATUS.MELTING).sort((a, b) => (a.T - this.age(a)) - (b.T - this.age(b))).slice(0, 8);
    const dormXY = Object.fromEntries(CAMPUS.dorms.map((d) => [d.id, d]));
    const claimants = CLAIMANTS.map((c) => ({ ...c, prefs: pool.filter((i) => c.needs.includes(i.category)).sort((a, b) => Math.hypot(dormXY[a.dorm].x - dormXY[c.dorm].x, dormXY[a.dorm].y - dormXY[c.dorm].y) - Math.hypot(dormXY[b.dorm].x - dormXY[c.dorm].x, dormXY[b.dorm].y - dormXY[c.dorm].y)).map((i) => i.id) }));
    const res = galeShapley(claimants, pool, this.scores);
    return { pool: pool.map((i) => this.view(i)), claimants: claimants.map((c) => ({ id: c.id, alias: c.alias, flags: c.flags, needs: c.needs, dorm: c.dorm, score: +this.scores[c.id].toFixed(2), prefs: c.prefs })), ...res };
  }

  /** Donation routing over items headed for donation (or the predicted set) */
  routes(capacity = 120) {
    let pool = this.items.filter((i) => i.status === STATUS.DONATION);
    if (pool.length < 5) pool = this.items.filter((i) => i.status === STATUS.MELTING).map((i) => ({ i, g: claimGauge(i, this.age(i), i.p0) })).sort((a, b) => b.g.lossRisk - a.g.lossRisk).reverse().slice(0, 18).map((x) => x.i);
    const dorm = Object.fromEntries(CAMPUS.dorms.map((d) => [d.id, d]));
    const byDorm = {};
    for (const it of pool) { const d = dorm[it.dorm]; (byDorm[d.id] ||= { id: d.id, name: d.name, x: d.x, y: d.y, load: 0, items: [] }); byDorm[d.id].load += it.ft3; byDorm[d.id].items.push(it.id); }
    const stops = Object.values(byDorm), depot = CAMPUS.depot;
    const naive = routeLength(depot, stops);
    const cw = clarkeWright(depot, stops, capacity);
    const opt = cw.map((r) => twoOpt(depot, r));
    return { depot, stops, naive: { route: stops.map((s) => s.id), length: naive }, savings: cw.map((r) => ({ route: r.map((s) => s.id), length: routeLength(depot, r) })), optimized: opt.map((o) => ({ route: o.route.map((s) => s.id), length: routeLength(depot, o.route), swaps: o.swaps })), capacity };
  }

  impact() {
    const done = this.items.filter((i) => i.outcome);
    const im = impact(done);
    const live = this.items.filter((i) => i.status === STATUS.MELTING).length;
    return { ...im, reused: done.filter((i) => i.outcome === 'reused').length, donated: done.filter((i) => i.outcome === 'donated').length, live, total: this.items.length };
  }

  // ── stage auction (Dutch, 60s) ──
  startAuction(id, durationSec = 60, at = Date.now()) { const it = this.get(id); this.auction = { id, p0: it.p0, name: it.name, glyph: it.glyph, start: at, durationSec, bids: [], winner: null, players: this.auction?.players || {} }; return this.auctionState(at); }
  join(name, at = Date.now()) { if (!this.auction) return null; this.auction.players[name] = at; return this.auctionState(at); }
  bid(name, at = Date.now()) {
    const a = this.auction; if (!a || a.winner) return this.auctionState(at);
    const el = (at - a.start) / 1000, price = auctionPrice(a.p0, el, a.durationSec);
    a.bids.push({ name, at, price }); a.winner = { name, price, at: el };
    return this.auctionState(at);
  }
  auctionState(at = Date.now()) {
    const a = this.auction; if (!a) return null; const el = Math.max(0, (at - a.start) / 1000);
    return { id: a.id, name: a.name, glyph: a.glyph, p0: a.p0, elapsed: el, durationSec: a.durationSec, price: a.winner ? a.winner.price : auctionPrice(a.p0, el, a.durationSec), winner: a.winner, players: Object.keys(a.players).length };
  }
}
export { CAMPUS, CLAIMANTS };
