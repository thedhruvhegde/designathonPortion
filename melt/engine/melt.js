/* Melt engine: pure functions, shared by browser and Node. Equations: see ../MATH.md
   Time unit: hours. Money: dollars. */

// ── 1 · deadline-normalised melt curve ─────────────────────────────────────
export const TEMPERAMENTS = { gentle: 0.01, steady: 0.025, fast: 0.05 };

/** p(s) = p0 · (e^{-ks} − e^{-kT}) / (1 − e^{-kT}); exactly p0 at s=0 and 0 at s=T */
export function meltPrice(p0, k, T, s) {
  if (s <= 0) return p0;
  if (s >= T) return 0;
  if (k < 1e-6) return p0 * (1 - s / T); // linear limit
  const eT = Math.exp(-k * T);
  return p0 * (Math.exp(-k * s) - eT) / (1 - eT);
}
/** dp/ds (negative): the melt speed in $/effective-hour */
export function meltSlope(p0, k, T, s) {
  if (s <= 0 || s >= T) return 0;
  if (k < 1e-6) return -p0 / T;
  return (-k * p0 * Math.exp(-k * s)) / (1 - Math.exp(-k * T));
}

// ── 2 · heat (Hawkes-style) and effective melt time ────────────────────────
export const HEAT = { tau: 6, beta: 0.15, finalWindow: 24 };

/** H(t) = Σ_{t_i<t} e^{-(t - t_i)/τ} */
export function heat(events, t, tau = HEAT.tau) {
  let h = 0;
  for (const ti of events) if (ti < t) h += Math.exp(-(t - ti) / tau);
  return h;
}

/** s*(t): integrate ds/dt = 1/(1+βH), then blend toward wall time in the final window so s*(T)=T */
export function effectiveTime(events, t, T, { tau = HEAT.tau, beta = HEAT.beta, finalWindow = HEAT.finalWindow, dt = 0.25 } = {}) {
  if (t <= 0) return 0;
  const ev = [...events].sort((a, b) => a - b);
  let s = 0, u = 0, h = 0, j = 0;
  const decay = Math.exp(-dt / tau);
  while (u < t) {
    const step = Math.min(dt, t - u);
    h *= step === dt ? decay : Math.exp(-step / tau);
    while (j < ev.length && ev[j] <= u + step) { if (ev[j] > u) h += Math.exp(-(u + step - ev[j]) / tau); j++; }
    s += step / (1 + beta * h);
    u += step;
  }
  const w = Math.min(1, Math.max(0, (t - (T - finalWindow)) / finalWindow)) ** 2;
  return Math.min(T, (1 - w) * s + w * t);
}

/** Full state of a listing at hour t (since listing). */
export function priceAt(listing, t) {
  const { p0, k, T, events = [] } = listing;
  const s = effectiveTime(events, t, T);
  return { s, price: Math.max(0, Math.round(meltPrice(p0, k, T, s) * 100) / 100), heat: heat(events, t) };
}

// ── 3 · Gamma–Poisson demand posterior ─────────────────────────────────────
export const PRIORS = { // α0, β0 (≈ prior arrivals, prior hours)
  furniture: [3, 12], appliance: [4, 10], electronics: [5, 8], decor: [2, 14], kitchen: [2, 12],
  bike: [4, 8], books: [1, 16], clothing: [2, 12], storage: [1, 14], plant: [2, 10],
};
export function demandPosterior(category, n, t) {
  const [a0, b0] = PRIORS[category] || [2, 12];
  const a = a0 + n, b = b0 + t;
  return { alpha: a, beta: b, mean: a / b, sd: Math.sqrt(a) / b };
}

/** Willingness to pay: q(p) = σ(a − b·p/p0) */
export const sigmoid = (x) => 1 / (1 + Math.exp(-x));
export const buyProb = (p, p0, a = 1.2, b = 4.5) => sigmoid(a - (b * p) / p0);

// ── 4 · optimal-stopping claim gauge ───────────────────────────────────────
/** Returns { ratio, claimNow, hazard, savingsIfWait, lossRisk } for a buyer with value v, looking `horizon` hours ahead */
export function claimGauge(listing, t, v, horizon = 6) {
  const { p0, k, T, events = [], category } = listing;
  const { s, price } = priceAt(listing, t);
  const n = events.filter((e) => e <= t).length;
  const lam = demandPosterior(category, n, t).mean;
  const hz = lam * buyProb(price, p0);
  const ds = 1 / (1 + HEAT.beta * heat(events, t));
  const slope = -meltSlope(p0, k, T, s) * ds; // $/h saved by waiting
  const ratio = slope > 1e-9 ? (hz * Math.max(0, v - price)) / slope : Infinity;
  const later = priceAt(listing, Math.min(T, t + horizon)).price;
  // P(lost within horizon) ≈ 1 − exp(−∫h), trapezoid over 12 steps
  let integ = 0; const N = 12;
  for (let i = 0; i < N; i++) {
    const a = t + (horizon * i) / N, b = t + (horizon * (i + 1)) / N;
    const ha = lam * buyProb(priceAt(listing, a).price, p0), hb = lam * buyProb(priceAt(listing, b).price, p0);
    integ += ((ha + hb) / 2) * (b - a);
  }
  return { price, ratio, claimNow: ratio >= 1, hazard: hz, lambda: lam, slope, savingsIfWait: price - later, lossRisk: 1 - Math.exp(-integ) };
}

// ── 5 · Kindness Window: Gale–Shapley (claimant-proposing) ─────────────────
export const NEED_WEIGHTS = { pell: 3, foodInsecure: 3, intlFreshman: 2, housingInsecure: 4, firstGen: 1 };
export function needScore(c, rnd = Math.random) {
  return Object.entries(NEED_WEIGHTS).reduce((a, [f, w]) => a + (c.flags?.includes(f) ? w : 0), 0) + rnd() * 0.5;
}
/**
 * claimants: [{id, prefs:[itemId...]}], items: [{id}], scores: {claimantId: needScore}
 * Returns { match: {itemId: claimantId}, log: [{step, claimant, item, result, bumped}] }
 */
export function galeShapley(claimants, items, scores) {
  const free = claimants.map((c) => c.id), next = Object.fromEntries(claimants.map((c) => [c.id, 0]));
  const prefs = Object.fromEntries(claimants.map((c) => [c.id, c.prefs])), itemIds = new Set(items.map((i) => i.id));
  const match = {}, log = []; let step = 0;
  while (free.length) {
    const c = free.shift(), list = prefs[c];
    if (next[c] >= list.length) continue; // exhausted: unmatched
    const it = list[next[c]++];
    if (!itemIds.has(it)) { free.unshift(c); continue; }
    const holder = match[it];
    if (holder === undefined) { match[it] = c; log.push({ step: ++step, claimant: c, item: it, result: 'held' }); }
    else if (scores[c] > scores[holder]) { match[it] = c; free.push(holder); log.push({ step: ++step, claimant: c, item: it, result: 'bumped', bumped: holder }); }
    else { free.unshift(c); log.push({ step: ++step, claimant: c, item: it, result: 'rejected' }); }
  }
  return { match, log };
}

// ── 6 · donation routing: Clarke–Wright savings + 2-opt ────────────────────
export const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
export function routeLength(depot, route) {
  let d = 0, prev = depot;
  for (const p of route) { d += dist(prev, p); prev = p; }
  return d + dist(prev, depot);
}
/** stops: [{id,x,y,load}] → routes: [[stop...]] */
export function clarkeWright(depot, stops, capacity) {
  let routes = stops.map((s) => [s]);
  const savings = [];
  for (let i = 0; i < stops.length; i++) for (let j = i + 1; j < stops.length; j++)
    savings.push({ i: stops[i], j: stops[j], s: dist(depot, stops[i]) + dist(depot, stops[j]) - dist(stops[i], stops[j]) });
  savings.sort((a, b) => b.s - a.s);
  const load = (r) => r.reduce((a, s) => a + (s.load || 0), 0);
  const find = (s) => routes.find((r) => r.includes(s));
  for (const { i, j } of savings) {
    const ri = find(i), rj = find(j);
    if (ri === rj || load(ri) + load(rj) > capacity) continue;
    let merged = null;
    if (ri[ri.length - 1] === i && rj[0] === j) merged = [...ri, ...rj];
    else if (rj[rj.length - 1] === j && ri[0] === i) merged = [...rj, ...ri];
    else if (ri[0] === i && rj[0] === j) merged = [...ri.slice().reverse(), ...rj];
    else if (ri[ri.length - 1] === i && rj[rj.length - 1] === j) merged = [...ri, ...rj.slice().reverse()];
    if (merged) routes = routes.filter((r) => r !== ri && r !== rj).concat([merged]);
  }
  return routes;
}
/** 2-opt: reverse segments while it shortens the closed tour (depot fixed). Returns {route, swaps} */
export function twoOpt(depot, route) {
  let best = route.slice(), improved = true, swaps = 0;
  while (improved) {
    improved = false;
    const path = [depot, ...best, depot];
    scan: for (let i = 1; i < path.length - 2; i++) for (let j = i + 1; j < path.length - 1; j++) {
      const a = path[i - 1], b = path[i], c = path[j], d = path[j + 1];
      if (dist(a, b) + dist(c, d) > dist(a, c) + dist(b, d) + 1e-9) {
        best = [...best.slice(0, i - 1), ...best.slice(i - 1, j).reverse(), ...best.slice(j)];
        improved = true; swaps++; break scan;
      }
    }
  }
  return { route: best, swaps };
}

// ── 7 · impact accounting ──────────────────────────────────────────────────
/** kg CO2e per kg diverted (landfill + avoided production) — WARM-style estimates, labelled est. in UI */
export const EMISSION = { furniture: 2.1, appliance: 3.4, electronics: 4.6, decor: 1.6, kitchen: 2.4, bike: 3.0, books: 1.1, clothing: 5.5, storage: 2.0, plant: 0.3 };
export function impact(items) {
  let kg = 0, co2 = 0, saved = 0, ft3 = 0; const byCat = {};
  for (const it of items) {
    if (!it.outcome) continue;
    kg += it.kg; co2 += it.kg * (EMISSION[it.category] || 2); ft3 += it.ft3 || 0;
    saved += it.p0 - (it.soldAt ?? 0);
    byCat[it.category] = (byCat[it.category] || 0) + it.kg;
  }
  return { kg, lbs: kg * 2.20462, co2, saved, bins: ft3 / 81, byCat }; // 3 yd³ dumpster = 81 ft³
}

// ── 8 · stage Dutch auction ────────────────────────────────────────────────
export function auctionPrice(p0, elapsedSec, durationSec = 60, k = 0.06) {
  return Math.max(0, Math.round(meltPrice(p0, k, durationSec, elapsedSec) * 100) / 100);
}

// deterministic PRNG for seeded demo data
export function mulberry32(seed) { let a = seed >>> 0; return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
