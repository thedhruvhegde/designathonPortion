import test from 'node:test'; import assert from 'node:assert/strict';
import * as M from '../engine/melt.js';
const L = { p0: 80, k: 0.05, T: 72, category: 'furniture', events: [] };
test('melt curve hits p0 at 0 and exactly 0 at T, monotone', () => {
  assert.equal(M.meltPrice(80, .05, 72, 0), 80); assert.equal(M.meltPrice(80, .05, 72, 72), 0);
  let prev = 81; for (let s = 0; s <= 72; s += .5) { const p = M.meltPrice(80, .05, 72, s); assert.ok(p <= prev + 1e-9); prev = p; }
});
test('heat slows the melt but deadline still reaches $0', () => {
  const hot = { ...L, events: Array.from({ length: 30 }, (_, i) => i * 1.5) };
  assert.ok(M.priceAt(hot, 30).price > M.priceAt(L, 30).price);
  assert.equal(M.priceAt(hot, 72).price, 0);
});
test('posterior mean moves toward observed rate', () => {
  const p = M.demandPosterior('furniture', 40, 10); assert.ok(p.mean > 1.5 && p.mean < 4); assert.ok(p.mean > 3/12);
});
test('claim gauge returns sane fields', () => {
  const g = M.claimGauge({ ...L, events: [1, 2, 3, 5, 8] }, 20, 70); assert.ok(g.lossRisk >= 0 && g.lossRisk <= 1); assert.ok(g.price < 80);
});
test('gale-shapley is stable', () => {
  const C = [{ id: 'a', prefs: ['x', 'y'] }, { id: 'b', prefs: ['x', 'y'] }, { id: 'c', prefs: ['y', 'x'] }];
  const sc = { a: 1, b: 5, c: 3 }; const { match } = M.galeShapley(C, [{ id: 'x' }, { id: 'y' }], sc);
  assert.equal(match.x, 'b'); assert.equal(match.y, 'c');
});
test('clarke-wright + 2-opt never worse than naive', () => {
  const r = M.mulberry32(7), depot = { x: 50, y: 50 };
  const stops = Array.from({ length: 14 }, (_, i) => ({ id: i, x: r() * 100, y: r() * 100, load: 10 }));
  const naive = M.routeLength(depot, stops);
  const routes = M.clarkeWright(depot, stops, 1e9); assert.equal(routes.length, 1);
  const cw = M.routeLength(depot, routes[0]); const opt = M.twoOpt(depot, routes[0]);
  assert.ok(cw <= naive + 1e-9); assert.ok(M.routeLength(depot, opt.route) <= cw + 1e-9);
  assert.equal(opt.route.length, 14);
});
