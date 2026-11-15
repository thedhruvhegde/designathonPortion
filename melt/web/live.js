/* Melt Live: projector stage (#/live) and phone wallet (#/join).
   Talks to /api/live (local Node server or Vercel). With no server, falls back to rehearsal mode:
   the same reducer runs in this browser and bot judges join and bid. */
import { $, h, money, toast } from './app.js';
import { reduce, view, fresh, LOT_SECONDS, WALLET } from '../engine/live.js';
import { auctionPrice } from '../engine/melt.js';
import { glyph } from './glyphs.js';
import * as C from './charts.js';

const qs = new URLSearchParams(location.search);
const ROOM = qs.get('room') || 'main', HOST_KEY = qs.get('key') || '';
let offline = null, local = null, offset = 0; // offset = serverNow - Date.now()

async function call(body) {
  if (offline) return localCall(body);
  try {
    const r = await fetch(`./api/live${HOST_KEY ? `?key=${encodeURIComponent(HOST_KEY)}` : ''}`.replace('./api', apiBase()), { method: body ? 'POST' : 'GET', headers: { 'Content-Type': 'application/json' }, body: body ? JSON.stringify({ room: ROOM, ...body }) : undefined });
    if (!r.ok && r.status !== 403) throw new Error(r.status); const j = await r.json(); offline = false;
    if (j.view) offset = j.view.serverNow - Date.now(); return j;
  } catch { offline = true; return localCall(body); }
}
async function poll(spectator) {
  if (offline) return localCall(null);
  try { const r = await fetch(`${apiBase()}/live?room=${ROOM}${spectator ? `&spectator=${spectator}` : ''}`); if (!r.ok) throw 0; const j = await r.json(); offline = false; offset = j.view.serverNow - Date.now(); return j; }
  catch { offline = true; return localCall(null); }
}
const apiBase = () => '/api'; // the live function is always served at the site root
function localCall(body) {
  local ||= fresh(ROOM);
  const { state, reply } = reduce(local, body || { type: 'noop' }, Date.now()); local = state;
  return { view: view(local, Date.now()), reply };
}
const priceNow = (v) => v.lot ? (v.phase === 'running' ? auctionPrice(v.lot.p0, Math.max(0, (Date.now() + offset - v.startAt) / 1000), v.lotSeconds) : v.lot.price) : 0;
const joinUrl = () => qs.get('join') || `${location.origin}${location.pathname}${ROOM !== 'main' ? `?room=${ROOM}` : ''}#/join`;

function qrInto(el, text) {
  const q = window.qrcode(0, 'M'); q.addData(text); q.make(); const n = q.getModuleCount();
  el.style.gridTemplateColumns = `repeat(${n},1fr)`; el.innerHTML = Array.from({ length: n * n }, (_, i) => `<i class="${q.isDark(Math.floor(i / n), i % n) ? 'on' : ''}" style="aspect-ratio:1"></i>`).join('');
}

// ── projector ─────────────────────────────────────────────────────────────
export function liveView(root) {
  const spectator = 'proj-' + Math.random().toString(36).slice(2, 7);
  root.innerHTML = `
  <div class="topbar"><div style="display:flex;align-items:baseline;gap:18px"><h1 class="h-1">Melt <em>Live</em></h1><span class="cap">Judges' auction · prices melt in real time</span></div>
    <span class="cap-sm" id="mode"></span></div>
  <div class="live">
    <div class="stage">
      <div style="display:grid;grid-template-columns:minmax(0,.9fr) minmax(0,1.1fr);border-bottom:1.5px solid var(--ink);flex:1">
        <div style="background:var(--paper-2);display:grid;place-items:center;border-right:1.5px solid var(--ink);position:relative" id="art"></div>
        <div style="padding:22px;display:flex;flex-direction:column;gap:12px">
          <span class="cap" id="lotno">Waiting to start</span>
          <h2 class="h-2" id="lotname">Scan the code. Get $${WALLET} in Melt Bucks.</h2>
          <p style="font-size:16px" id="story"><em>Each lot melts from its list price to $0 in ${LOT_SECONDS} seconds. First tap wins. Spend wisely: you can't buy everything.</em></p>
          <div class="bigprice" id="price" style="margin-top:auto">—</div>
          <span class="mono" style="font-size:13px" id="status"></span>
        </div>
      </div>
      <div class="timerbar"><span id="tbar" style="width:0"></span></div>
      <canvas id="ac" style="width:100%;height:170px;display:block"></canvas>
      <div class="lots" id="lots"></div>
    </div>
    <div class="side">
      <section style="display:grid;grid-template-columns:auto 1fr;gap:18px;align-items:center">
        <div class="qr" id="qr" style="width:clamp(150px,13vw,230px)"></div>
        <div style="display:flex;flex-direction:column;gap:10px"><span class="cap">Scan to bid</span>
          <div style="display:flex;align-items:center;gap:10px"><span class="dot"></span><span class="num" style="font-size:64px;line-height:.9" id="live">0</span></div>
          <span class="mono" style="font-size:11px">LIVE VIEWERS · <span id="players">0</span> JUDGES WITH WALLETS</span>
          <span class="mono dim" style="font-size:10px;word-break:break-all" id="jurl"></span></div>
      </section>
      <section style="display:flex;gap:6px;flex-wrap:wrap" id="host">
        <button class="btn solid" id="next">Start lot 1 →</button><button class="btn" id="bots">+ 5 bot judges</button><button class="btn" id="reset">Reset</button></section>
      <section><div class="topbar" style="margin-bottom:8px"><span class="cap">Leaderboard</span><span class="mono" style="font-size:11px">WON · SAVED · LEFT</span></div><div class="ledger" id="lb"></div></section>
      <section style="flex:1"><span class="cap">Room impact</span><div style="display:grid;grid-template-columns:repeat(3,1fr);margin-top:10px" id="imp"></div>
        <div class="ledger" id="feed" style="margin-top:14px"></div></section>
    </div>
  </div>`;
  qrInto($('#qr', root), joinUrl()); $('#jurl', root).textContent = joinUrl().replace(/^https?:\/\//, '');
  let v = null, raf, pollT, bots = [];
  const host = async (body) => { const j = await call(body); if (j.view) v = j.view; if (j.error) toast('Host key required: add ?key=… to the URL'); paint(); };
  $('#next', root).onclick = () => host({ type: 'start' });
  $('#reset', root).onclick = () => { bots = []; host({ type: 'reset' }); };
  $('#bots', root).onclick = async () => {
    for (const n of ['Ana', 'Ben', 'Chidi', 'Dana', 'Eli'].map((n) => n + ' (bot)')) { const j = await call({ type: 'join', name: n }); bots.push({ id: j.reply.id, greed: .25 + Math.random() * .55 }); v = j.view; }
    toast('5 bot judges joined: rehearse the flow'); paint();
  };
  async function tick() { const j = await poll(spectator); v = j.view; paint();
    // bots bid when the lot has melted past their personal threshold
    if (v.phase === 'running' && v.lot) for (const b of bots) { const frac = 1 - priceNow(v) / v.lot.p0; if (frac > b.greed && Math.random() < .25) { const r = await call({ type: 'bid', id: b.id }); v = r.view; break; } }
    for (const b of bots) call({ type: 'ping', id: b.id });
    pollT = setTimeout(tick, 650); }
  function paint() {
    if (!v) return;
    $('#mode', root).textContent = offline ? 'REHEARSAL MODE · no server, runs in this browser' : 'CONNECTED · shared room ' + ROOM;
    $('#live', root).textContent = v.live; $('#players', root).textContent = v.players;
    const L = v.lot, idx = v.lotIndex;
    $('#next', root).textContent = v.phase === 'done' ? 'Done' : idx < 0 ? 'Start lot 1 →' : v.phase === 'running' ? 'Melting…' : idx + 1 < v.lots.length ? `Next: lot ${idx + 2} →` : 'Finish →';
    $('#next', root).disabled = v.phase === 'running' || v.phase === 'done';
    if (L) {
      if ($('#art', root).dataset.g !== L.id) { $('#art', root).dataset.g = L.id; $('#art', root).innerHTML = L.image ? `<div class="liveimg"><img src="${L.image}" alt=""></div>` : `<div style="width:66%">${glyph(L.glyph, { pitch: 3.4 })}</div>`; }
      $('#lotno', root).textContent = `Lot ${idx + 1} of ${v.lots.length} · list price $${L.p0}`; $('#lotname', root).textContent = L.name; $('#story', root).innerHTML = `<em>${L.story}</em>`;
      const r = L.result;
      $('#status', root).textContent = r?.type === 'sold' ? `SOLD to ${r.to} at ${money(r.price, false)}, ${Math.round((1 - r.price / L.p0) * 100)}% melted, at ${r.atSec}s` : r?.type === 'donated' ? 'Melted to $0 → Kindness Window → donation truck. Not the dumpster.' : (Date.now() + offset < v.startAt ? 'Get ready…' : 'Melting. First tap wins.');
    }
    $('#lots', root).innerHTML = v.lots.map((l, i) => `<div class="${i === idx ? 'cur' : ''}"><div style="display:flex;justify-content:space-between;align-items:center"><span class="mono" style="font-size:11px">LOT ${i + 1}</span><span style="width:34px;height:42px;overflow:hidden">${l.image ? `<img src="${l.image}" alt="" style="width:100%;height:100%;object-fit:cover">` : glyph(l.glyph)}</span></div><span style="font-family:var(--f-display);font-size:16px;line-height:1.1">${l.name.split(',')[0]}</span><span class="mono" style="font-size:11px">${l.result ? (l.result.type === 'sold' ? `SOLD ${money(l.result.price, false)} · ${l.result.to}` : '$0 → DONATED') : `$${l.p0}`}</span></div>`).join('');
    $('#lb', root).innerHTML = v.leaderboard.length ? v.leaderboard.map((p, i) => `<div class="row" style="grid-template-columns:28px 1fr auto"><span class="mono">${i + 1}</span><span>${p.name}</span><span class="mono" style="font-size:12px">${p.won} · $${p.saved.toFixed(0)} · $${p.balance.toFixed(0)}</span></div>`).join('') : `<p class="mono dim" style="font-size:12px;padding:8px 0">No wallets yet. Scan the code.</p>`;
    $('#imp', root).innerHTML = [['kg', Math.round(v.impact.kg), 'kg kept'], ['co2', Math.round(v.impact.co2), 'kg CO₂e'], ['kept', '$' + Math.round(v.impact.kept), 'kept in pockets']].map(([, n, l]) => `<div><div class="num" style="font-size:40px;line-height:1">${n}</div><span class="cap-sm">${l}</span></div>`).join('');
    $('#feed', root).innerHTML = v.feed.slice(0, 5).map((f) => `<div class="row" style="grid-template-columns:64px 1fr"><span class="mono" style="font-size:11px">${new Date(f.at).toLocaleTimeString([], { minute: '2-digit', second: '2-digit' })}</span><span style="font-size:13px">${f.text}</span></div>`).join('');
  }
  function frame() {
    if (v?.lot) {
      const p = priceNow(v), el = Math.max(0, (Date.now() + offset - v.startAt) / 1000);
      $('#price', root).innerHTML = money(p);
      $('#tbar', root).style.width = `${Math.min(100, (v.phase === 'running' ? el / v.lotSeconds : (v.lot.result?.atSec ?? v.lotSeconds) / v.lotSeconds) * 100)}%`;
      C.auctionChart($('#ac', root), { p0: v.lot.p0, elapsed: v.phase === 'running' ? el : (v.lot.result?.atSec ?? v.lotSeconds), duration: v.lotSeconds, priceFn: (s) => auctionPrice(v.lot.p0, s, v.lotSeconds), sold: v.lot.result?.type === 'sold' });
      if (v.phase === 'running' && el > v.lotSeconds + .3 && offline) poll(); // local auto-expire
    }
    raf = requestAnimationFrame(frame);
  }
  tick(); raf = requestAnimationFrame(frame);
  return { destroy() { clearTimeout(pollT); cancelAnimationFrame(raf); } };
}

// ── phone ─────────────────────────────────────────────────────────────────
const DENOMS = [100, 50, 20, 10, 5, 1];
function notes(balance) {
  const out = []; let b = Math.floor(balance);
  for (const d of DENOMS) while (b >= d && out.length < 8) { out.push(d); b -= d; }
  return out;
}
export function joinView(root) {
  let me = JSON.parse(localStorage.getItem('melt-me-' + ROOM) || 'null'), v = null, pollT, raf, busy = false;
  root.innerHTML = `<div class="phone" id="ph"></div>`; const ph = $('#ph', root);
  function lobby() {
    ph.innerHTML = `<span class="cap">Melt Live · judges' wallet</span><h1 class="h-1">Prices melt.<br><em>Catch what you love.</em></h1>
      <p>You'll get <b>$${WALLET} in Melt Bucks</b>. Each lot starts at its list price and melts to $0 in ${LOT_SECONDS} seconds. The first tap wins it. Whatever nobody catches goes to a student in need, then to donation.</p>
      <label class="f"><span class="cap-sm">Your name</span><input id="nm" maxlength="18" placeholder="e.g. Judge Rivera" autocomplete="name"></label>
      <button class="catch" id="go">Get my $${WALLET}</button>`;
    $('#go', ph).onclick = async () => { const name = $('#nm', ph).value.trim() || 'Judge'; const j = await call({ type: 'join', name }); me = j.reply.me; localStorage.setItem('melt-me-' + ROOM, JSON.stringify(me)); v = j.view; wallet(); };
  }
  function wallet() {
    ph.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center"><span class="cap">Hi, ${me.name}</span><span class="mono" style="font-size:11px"><span class="dot"></span> <span id="lv">0</span> LIVE</span></div>
      <div class="notes" id="notes"></div>
      <div style="display:flex;justify-content:space-between;align-items:baseline"><span class="cap-sm">Melt Bucks left</span><span class="num" style="font-size:44px" id="bal"></span></div>
      <div class="box" style="display:grid;grid-template-columns:96px 1fr;gap:12px;padding:12px;align-items:center"><div id="lg" style="background:var(--paper-2)"></div>
        <div><span class="cap-sm" id="ln">Waiting for the host</span><div class="h-3" id="lt" style="margin-top:6px">The first lot starts soon</div></div></div>
      <div class="bigprice" id="pp" style="font-size:96px;text-align:center">—</div>
      <div class="timerbar"><span id="tb" style="width:0"></span></div>
      <button class="catch" id="catch" disabled>Catch it</button>
      <p class="mono" style="font-size:12px;text-align:center" id="msg"></p>
      <div class="ledger" id="won"></div>`;
    $('#catch', ph).onclick = async () => {
      if (busy) return; busy = true; navigator.vibrate?.(30);
      const j = await call({ type: 'bid', id: me.id }); v = j.view; busy = false;
      if (j.reply?.ok) { me = j.reply.me; localStorage.setItem('melt-me-' + ROOM, JSON.stringify(me)); toast(`Caught for ${money(j.reply.price, false)}. Nothing wasted.`); }
      else toast(j.reply?.reason || 'Missed it');
      paint();
    };
    paint();
  }
  function paint() {
    if (!v || !$('#bal', ph)) return;
    const mine = v.leaderboard.find((p) => p.name === me.name); const bal = me.balance;
    $('#bal', ph).textContent = money(bal, false); $('#lv', ph).textContent = v.live;
    $('#notes', ph).innerHTML = notes(bal).reverse().map((d, i, a) => `<div class="note" style="transform:translate(${(a.length - 1 - i) * 6}px, ${(a.length - 1 - i) * 6}px)"><div style="display:flex;flex-direction:column;justify-content:space-between;position:relative;z-index:1"><span class="cap-sm">Melt Bucks · ${v.room}</span><span class="mono" style="font-size:10px">VALID UNTIL IT MELTS · NO.${String(i + 1).padStart(3, '0')}</span></div><span class="denom" style="position:relative;z-index:1">${d}</span></div>`).join('') || `<div class="note"><span class="cap-sm">Wallet empty</span><span class="denom">0</span></div>`;
    const L = v.lot;
    if (L) { if ($('#lg', ph).dataset.g !== L.id) { $('#lg', ph).dataset.g = L.id; $('#lg', ph).innerHTML = L.image ? `<img src="${L.image}" alt="" style="width:100%;aspect-ratio:4/5;object-fit:cover;display:block">` : glyph(L.glyph); }
      $('#ln', ph).textContent = `Lot ${v.lotIndex + 1}/${v.lots.length} · was $${L.p0}`; $('#lt', ph).textContent = L.name; }
    const running = v.phase === 'running' && L && !L.result;
    const p = priceNow(v);
    $('#catch', ph).disabled = !running || p > bal || Date.now() + offset < v.startAt;
    $('#catch', ph).textContent = running ? (p > bal ? `Need ${money(p, false)}` : `Catch it · ${money(p, false)}`) : 'Catch it';
    $('#msg', ph).textContent = v.phase === 'done' ? 'That\'s the show. Everything found a home.' : L?.result?.type === 'sold' ? `SOLD to ${L.result.to} at ${money(L.result.price, false)}` : L?.result?.type === 'donated' ? 'Melted to $0 → donated. Not the dumpster.' : running ? 'Melting… wait for a better price, or catch it now.' : 'Waiting for the next lot';
    $('#won', ph).innerHTML = (me.won || []).map((w) => { const l = v.lots.find((x) => x.id === w.lot); return `<div class="row" style="grid-template-columns:1fr auto"><span>${l?.name.split(',')[0]}</span><span class="mono">${money(w.price, false)} <s class="dim">$${w.p0}</s></span></div>`; }).join('');
  }
  function frame() { if (v?.lot && $('#pp', ph)) { const p = priceNow(v), el = Math.max(0, (Date.now() + offset - v.startAt) / 1000);
      $('#pp', ph).innerHTML = money(v.phase === 'running' ? p : (v.lot.result?.price ?? v.lot.p0)); $('#tb', ph).style.width = `${Math.min(100, (v.phase === 'running' ? el : v.lotSeconds) / v.lotSeconds * 100)}%`;
      const c = $('#catch', ph); if (v.phase === 'running' && !v.lot.result) c.textContent = p > me.balance ? `Need ${money(p, false)}` : `Catch it · ${money(p, false)}`, c.disabled = p > me.balance || el <= 0; }
    raf = requestAnimationFrame(frame); }
  async function tick() { const j = await call(me ? { type: 'ping', id: me.id } : null); v = j.view; if (me && j.reply?.me) { me = j.reply.me; } else if (me && j.reply && j.reply.me === null) { const r = await call({ type: 'join', name: me.name }); me = r.reply.me; localStorage.setItem('melt-me-' + ROOM, JSON.stringify(me)); } paint(); pollT = setTimeout(tick, 600); }
  if (me) wallet(); else lobby();
  tick(); raf = requestAnimationFrame(frame);
  return { destroy() { clearTimeout(pollT); cancelAnimationFrame(raf); } };
}
