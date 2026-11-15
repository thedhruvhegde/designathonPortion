import test from 'node:test'; import assert from 'node:assert/strict';
import { fresh, reduce, view, LOT_SECONDS, WALLET } from '../engine/live.js';
test('first tap wins, wallet debits, second tap is too late', () => {
  let s = fresh(), t = 1e12;
  const a = reduce(s, { type: 'join', name: 'Ana' }, t); s = a.state;
  const b = reduce(s, { type: 'join', name: 'Ben' }, t); s = b.state;
  s = reduce(s, { type: 'start' }, t).state;
  const r1 = reduce(s, { type: 'bid', id: b.reply.id }, t + 6000); s = r1.state;
  assert.ok(r1.reply.ok); assert.ok(r1.reply.price < 80);
  assert.equal(s.players[b.reply.id].balance, +(WALLET - r1.reply.price).toFixed(2));
  assert.equal(reduce(s, { type: 'bid', id: a.reply.id }, t + 6010).reply.ok, false);
});
test('unsold lot melts into a donation and counts toward impact', () => {
  let s = fresh(), t = 1e12; s = reduce(s, { type: 'start' }, t).state;
  s = reduce(s, { type: 'noop' }, t + 1500 + LOT_SECONDS * 1000 + 10).state;
  assert.equal(s.lots[0].result.type, 'donated'); assert.ok(view(s, t).impact.kg > 0);
});
test('cannot overspend Melt Bucks', () => {
  let s = fresh(), t = 1e12; const j = reduce(s, { type: 'join', name: 'C' }, t); s = j.state;
  s.players[j.reply.id].balance = 1; s = reduce(s, { type: 'start', index: 2 }, t).state;
  assert.equal(reduce(s, { type: 'bid', id: j.reply.id }, t + 2000).reply.ok, false);
});
