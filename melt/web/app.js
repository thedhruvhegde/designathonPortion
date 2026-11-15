/* Melt front end: hash router, local market clock, market / item / sell views.
   Panels (kindness, routes, impact) live in panels.js; the judges' auction in live.js. */
import { Market, STATUS, CAMPUS } from '../engine/market.js';
import { TEMPERAMENTS, meltPrice, demandPosterior, HEAT } from '../engine/melt.js';
import { glyph } from './glyphs.js';
import * as C from './charts.js';
import { kindnessView, routesView, impactView } from './panels.js';
import { liveView, joinView } from './live.js';
import { fetchLiveCatalog, applyCatalog } from './catalog-live.js';

export const MOVE_OUT = 84; // market hour of the hard move-out deadline
export const market = new Market({ seed: 42, now: 30 });
export const sim = { speed: 0.05, running: true }; // sim hours per real second
export const $ = (s, r = document) => r.querySelector(s);
export const h = (html) => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; };
export const money = (p, sup = true) => { const [d, c] = Math.max(0, p).toFixed(2).split('.'); return sup ? `$${d}<sup>.${c}</sup>` : `$${d}.${c}`; };
export const dur = (hrs) => hrs <= 0 ? 'now' : hrs < 1 ? `${Math.round(hrs * 60)}m` : hrs < 48 ? `${Math.floor(hrs)}h ${String(Math.round((hrs % 1) * 60)).padStart(2, '0')}m` : `${(hrs / 24).toFixed(1)}d`;
export const dormName = (id) => CAMPUS.dorms.find((d) => d.id === id)?.name || id;
export function toast(msg) { const t = h(`<div class="toast" role="status">${msg}</div>`); document.body.appendChild(t); setTimeout(() => t.remove(), 2600); }
export const cells = (frac, n = 24) => `<div class="cells">${Array.from({ length: n }, (_, i) => `<b class="${i < Math.round(frac * n) ? 'on' : ''}"></b>`).join('')}</div>`;
const STATUS_LABEL = { melting: 'Melting', sold: 'Sold', kindness: 'Kindness window', free: 'Free', claimed: 'Claimed', donation: 'Donation', picked: 'Donated' };

// ── chrome ────────────────────────────────────────────────────────────────
const NAV = [['market', 'Market'], ['sell', 'Sell'], ['kindness', 'Kindness'], ['routes', 'Routes'], ['impact', 'Impact'], ['live', 'Live ◉']];
function chrome(route) {
  const bare = route === 'join';
  document.body.classList.toggle('bare', bare);
  $('#chrome').innerHTML = bare ? '' : `
  <header class="top">
    <a class="brand" href="#/market"><span class="word">Melt<i>.</i></span><span class="cap-sm dim">Move-out market · prices melt · nothing wasted</span></a>
    <nav class="main">${NAV.map(([k, l]) => `<a class="cap ${route === k || (route === 'item' && k === 'market') ? 'on' : ''}" href="#/${k}">${l}</a>`).join('')}</nav>
    <div class="clockchip"><span class="cap-sm">Move-out in</span><span class="mono" id="moveout" style="font-size:20px">—</span></div>
  </header>
  <div class="ticker" aria-hidden="true"><div class="track" id="ticker"></div></div>`;
  $('#simbar').hidden = bare || route === 'live';
  renderTicker();
}
function renderTicker() {
  const el = $('#ticker'); if (!el) return;
  const items = [...market.feed.filter((e) => e.type !== 'watch'), ...market.feed.filter((e) => e.type === 'watch' && e.n > 1)].slice(0, 14).map((e) => { const it = market.get(e.id); if (!it) return ''; const n = it.name.split(',')[0];
    return { sold: `SOLD · ${n} · ${money(e.price, false)} · ${dormName(it.dorm)}`, zero: `$0 · ${n} enters the Kindness Window`, free: `FREE · ${n} · open to everyone`, donation: `→ DONATION · ${n} · truck scheduled`, watch: `+${e.n} watching · ${n}`, listed: `NEW · ${n} starts melting` }[e.type] || ''; }).filter(Boolean);
  const base = items.length ? items : ['Move-out week is live', 'Every price melts toward $0', 'At $0, students with need claim first', 'Unclaimed → donation truck, never the dumpster'];
  el.innerHTML = [...base, ...base].map((s) => `<span>${s}</span><span>✶</span>`).join('');
}

// ── market (Marketplace layout) ───────────────────────────────────────────
const ui = { cat: 'all', dorm: 'all', sort: 'fastest', q: '', tab: 'browse' };
export const prefs = { riso: (() => { try { return localStorage.getItem('melt-riso') === '1'; } catch { return false; } })() };
const CATS = [['all', 'Browse all', 'bins'], ['furniture', 'Furniture', 'futon'], ['appliance', 'Appliances', 'fridge'], ['electronics', 'Electronics', 'monitor'], ['kitchen', 'Kitchen', 'kettle'], ['decor', 'Home decor', 'lamp'], ['clothing', 'Clothing & shoes', 'parka'], ['bike', 'Sports & bikes', 'bike'], ['books', 'Textbooks', 'books']];
export const art = (v, cls = '') => v.image
  ? `<div class="photo ${prefs.riso ? 'riso' : ''} ${cls}"><img src="${v.image}" alt="${v.name.replace(/"/g, '')}" loading="lazy" referrerpolicy="no-referrer"></div>`
  : `<div class="photo glyphy ${cls}">${glyph(v.glyph, { label: v.name })}</div>`;
export const ago = (hrs) => hrs < 1 ? `${Math.max(1, Math.round(hrs * 60))} minutes ago` : hrs < 24 ? `${Math.round(hrs)} hours ago` : `${Math.round(hrs / 24)} days ago`;
function marketView(root) {
  root.className = 'page fb';
  root.innerHTML = `
  <div class="fbwrap">
    <aside class="side">
      <div class="side-h"><h1 class="h-2">Marketplace</h1><span class="cap-sm dim">Move-out week · prices melt</span></div>
      <input type="search" id="q" placeholder="Search Melt Marketplace" value="${ui.q}" aria-label="Search">
      <nav class="side-nav">
        ${[['browse', 'Browse all', 'bins'], ['fast', 'Melting fast', 'lights'], ['free', 'Free now · Kindness', 'plant'], ['watching', 'Most watched', 'speaker']].map(([k, l, g]) => `<button data-tab="${k}" class="${ui.tab === k ? 'on' : ''}"><span class="ico">${glyph(g)}</span>${l}</button>`).join('')}
      </nav>
      <a class="btn solid" href="#/sell" style="width:100%">+ Create new listing</a>
      <div class="side-sec"><span class="cap-sm">Location</span>
        <select id="dorm" aria-label="Dorm"><option value="all">All of campus · within 1 mi</option>${CAMPUS.dorms.map((d) => `<option value="${d.id}" ${ui.dorm === d.id ? 'selected' : ''}>${d.name}</option>`).join('')}</select></div>
      <div class="side-sec"><span class="cap-sm">Categories</span>
        <nav class="side-nav">${CATS.map(([c, l, g]) => `<button data-cat="${c}" class="${ui.cat === c ? 'on' : ''}"><span class="ico">${glyph(g)}</span>${l}</button>`).join('')}</nav></div>
      <div class="side-sec impact-mini">
        <div><span class="num" id="h-kg">—</span><span class="cap-sm">kg kept from landfill</span></div>
        <div><span class="num" id="h-co2">—</span><span class="cap-sm">kg CO₂e avoided · est.</span></div>
      </div>
    </aside>
    <section class="feed">
      <div class="feed-h">
        <div><h2 class="h-2" id="feedTitle">Today's picks</h2><p class="dim" style="font-size:14px;margin-top:6px">Every price melts toward $0 by move-out. At $0, students in need get first claim, then a donation truck takes the rest.</p></div>
        <div class="feed-ctl">
          <select id="sort" aria-label="Sort">${[['fastest', 'Sort: melting fastest'], ['hot', 'Sort: most watched'], ['cheap', 'Sort: price low → high'], ['ending', 'Sort: free soonest'], ['new', 'Sort: newest']].map(([v, l]) => `<option value="${v}" ${ui.sort === v ? 'selected' : ''}>${l}</option>`).join('')}</select>
          <button class="btn ${prefs.riso ? 'on' : ''}" id="riso" title="Two-color risograph photos">Riso</button>
          <span class="chip ghost" id="src">${market.items[0]?.live ? '● Live catalog · DummyJSON' : 'Seeded catalog'}</span>
        </div>
      </div>
      <div class="fbgrid" id="grid"></div>
    </section>
  </div>`;
  root.querySelectorAll('[data-cat]').forEach((b) => (b.onclick = () => { ui.cat = b.dataset.cat; marketView(root); }));
  root.querySelectorAll('[data-tab]').forEach((b) => (b.onclick = () => { ui.tab = b.dataset.tab; ui.sort = { fast: 'fastest', free: 'ending', watching: 'hot', browse: ui.sort }[ui.tab]; marketView(root); }));
  $('#q', root).oninput = (e) => { ui.q = e.target.value.toLowerCase(); drawGrid(); };
  $('#dorm', root).onchange = (e) => { ui.dorm = e.target.value; drawGrid(); };
  $('#sort', root).onchange = (e) => { ui.sort = e.target.value; drawGrid(); };
  $('#riso', root).onclick = () => { prefs.riso = !prefs.riso; try { localStorage.setItem('melt-riso', prefs.riso ? '1' : '0'); } catch {} marketView(root); };
  $('#feedTitle', root).textContent = { browse: ui.cat === 'all' ? "Today's picks" : CATS.find((c) => c[0] === ui.cat)[1], fast: 'Melting fast', free: 'Free now · Kindness Window', watching: 'Most watched' }[ui.tab];
  const grid = $('#grid', root);
  function drawGrid() {
    let L = market.list().filter((i) => (ui.cat === 'all' || i.category === ui.cat) && (ui.dorm === 'all' || i.dorm === ui.dorm) && (!ui.q || (i.name + ' ' + (i.brand || '')).toLowerCase().includes(ui.q)));
    if (ui.tab === 'free') L = L.filter((i) => ['free', 'kindness'].includes(i.status));
    const live = (i) => i.status === STATUS.MELTING || i.status === STATUS.FREE || i.status === STATUS.KINDNESS;
    const key = { fastest: (i) => -(1 - i.price / i.p0), hot: (i) => -i.heat, cheap: (i) => i.price, ending: (i) => i.hoursLeft, new: (i) => i.t }[ui.sort];
    L.sort((a, b) => (live(b) - live(a)) || key(a) - key(b));
    grid.innerHTML = L.map(card).join('') || `<p class="pad">Nothing here right now. Everything melts eventually, so check back.</p>`;
  }
  drawGrid(); update();
  function update() {
    const im = market.impact();
    $('#h-kg', root).textContent = Math.round(im.kg).toLocaleString(); $('#h-co2', root).textContent = Math.round(im.co2).toLocaleString();
    for (const el of grid.children) {
      const it = market.get(el.dataset.id); if (!it) continue; const v = market.view(it);
      if (el.dataset.status !== v.status) { el.replaceWith(h(card(v))); continue; }
      if (v.status !== STATUS.MELTING) continue;
      el.querySelector('.price').innerHTML = money(v.price);
      el.querySelector('.off').textContent = `−${Math.round((1 - v.price / v.p0) * 100)}%`;
      el.querySelector('.cellsw').innerHTML = cells(v.price / v.p0, 20);
      el.querySelector('.left').textContent = `$0 in ${dur(v.hoursLeft)}`;
      el.querySelector('.heat').textContent = `${v.watchers} watching`;
    }
  }
  return { update };
}
function card(v) {
  const melting = v.status === STATUS.MELTING, pct = Math.round((1 - v.price / v.p0) * 100);
  const badge = { sold: `Sold · ${money(v.soldAt ?? 0, false)}`, claimed: 'Claimed', kindness: 'Kindness window', free: 'Free', donation: 'Donation truck', picked: 'Donated' }[v.status];
  const price = melting ? money(v.price) : ['free', 'kindness'].includes(v.status) ? 'Free' : money(v.soldAt ?? 0);
  return `<a class="fbcard ${!melting && !['free', 'kindness'].includes(v.status) ? 'gone' : ''}" href="#/item/${v.id}" data-id="${v.id}" data-status="${v.status}">
    <div class="pic">${art(v)}${badge ? `<span class="badge">${badge}</span>` : `<span class="badge ghost heat">${v.watchers} watching</span>`}</div>
    <div class="fbbody">
      <div class="priceRow"><span class="price">${price}</span>${melting ? `<span class="was">$${v.p0}</span><span class="off">−${pct}%</span>` : ''}</div>
      <div class="ttl">${v.name}</div>
      <div class="loc">${dormName(v.dorm)} · ${v.seller}</div>
      ${melting ? `<div class="cellsw">${cells(v.price / v.p0, 20)}</div><div class="foot"><span class="left">$0 in ${dur(v.hoursLeft)}</span><span>${v.temperament}</span></div>` : ''}
    </div></a>`;
}

// ── item ──────────────────────────────────────────────────────────────────
function itemView(root, id) {
  const it = market.get(id); if (!it) { root.innerHTML = `<p>That listing already melted away. <a href="#/market">Back to the market</a></p>`; return {}; }
  let value = Math.round(it.p0 * 0.75);
  root.innerHTML = `
  <div class="topbar"><a class="cap" href="#/market">← Market</a><span class="cap-sm">Listing ${it.id.toUpperCase()} · ${dormName(it.dorm)}</span></div>
  <div class="item">
    <div class="left">
      <div class="art">${art(it, 'big')}<div class="tags" style="position:absolute;top:14px;left:14px;right:14px;display:flex;justify-content:space-between"><span class="chip" id="st"></span><span class="chip ghost" id="hw"></span></div></div>
      <div class="item-sec sec" style="padding:20px 22px">
        ${it.images?.length > 1 ? `<div class="thumbs">${it.images.map((src, i) => `<button data-src="${src}" class="${i ? '' : 'on'}"><img src="${src}" alt="" referrerpolicy="no-referrer"></button>`).join('')}</div>` : ''}
        <span class="cap-sm">${it.category}${it.brand ? ' · ' + it.brand : ''} · ${it.temperament} melt</span>
        <h1 class="h-1" style="margin:12px 0 8px">${it.name}</h1>
        <p class="mono" style="font-size:12px">Listed ${ago(Math.max(0.2, market.now - it.listedAt))} in ${dormName(it.dorm)}</p>
        <div class="details"><div><span class="cap-sm">Condition</span><span>${it.condition}</span></div><div><span class="cap-sm">Pick-up</span><span>${dormName(it.dorm)} lobby</span></div>${it.retail ? `<div><span class="cap-sm">Retail new</span><span>$${Math.round(it.retail)}</span></div>` : ''}${it.rating ? `<div><span class="cap-sm">Rating</span><span>${it.rating.toFixed(1)} / 5</span></div>` : ''}</div>
        <p style="font-size:16px;max-width:52ch;margin-top:12px">${it.blurb}</p>
        <div class="seller"><span class="av">${it.seller[0]}</span><div><b>${it.seller}</b><span class="mono dim" style="font-size:11px;display:block;margin-top:4px">Verified student · ${dormName(it.dorm)} · replies in ~1h</span></div><span class="chip ghost">${3 + (it.id.charCodeAt(3) % 9)} items melting</span></div>
        <form class="msg" onsubmit="return false"><span class="cap-sm">Send seller a message</span><div style="display:flex;gap:8px;margin-top:8px"><input value="Hi ${it.seller}, is this still available?" aria-label="Message"><button class="btn solid" type="submit">Send</button></div></form>
      </div>
      <div class="sec" style="padding:0 22px 20px"><div class="kv">
        <div><span class="cap-sm">Weight</span><span class="num">${it.kg}<small class="mono" style="font-size:12px"> kg</small></span></div>
        <div><span class="cap-sm">Volume</span><span class="num">${it.ft3}<small class="mono" style="font-size:12px"> ft³</small></span></div>
        <div><span class="cap-sm">CO₂e if reused</span><span class="num" id="co2"></span></div>
        <div><span class="cap-sm">Dumpster share</span><span class="num">${Math.round(it.ft3 / 81 * 100)}<small class="mono" style="font-size:12px">%</small></span></div></div></div>
      <div class="sec" style="padding:20px 22px;margin-top:auto"><span class="cap-sm">Lifecycle: it ends by transforming</span>
        <div class="lifecycle" id="life" style="margin-top:12px"></div></div>
    </div>
    <div class="right">
      <div class="sec" style="display:flex;justify-content:space-between;align-items:flex-end;gap:16px;flex-wrap:wrap">
        <div><span class="cap-sm">Price right now · was $${it.p0}</span><div class="bigprice" id="bp" style="margin-top:10px"></div></div>
        <div style="display:flex;flex-direction:column;gap:8px;min-width:220px">
          <button class="btn big solid" id="claim"></button>
          <button class="btn" id="watch">◉ Watch (adds heat)</button>
          <span class="mono dim" style="font-size:11px" id="left"></span></div>
      </div>
      <div class="sec"><div style="display:flex;justify-content:space-between;align-items:baseline"><span class="cap">The melt curve</span><span class="mono" style="font-size:11px">— base · ━ actual · ┈ projected · ▨ deadline lock</span></div>
        <canvas class="chart" id="chart" style="margin-top:10px"></canvas></div>
      <div class="sec">
        <div style="display:flex;justify-content:space-between;align-items:baseline;gap:12px"><span class="cap">When should I claim?</span><span class="mono" style="font-size:12px" id="verdict"></span></div>
        <div class="gauge" style="margin:12px 0"><div class="fill" id="gfill"></div><div class="mark"></div><span class="lbl mono" style="font-size:11px" id="gl"></span></div>
        <label class="f"><span class="cap-sm">What's it worth to you? <span class="mono" id="vv"></span></span><input type="range" id="val" min="1" max="${it.p0}" value="${value}"></label>
        <p class="mono dim" style="font-size:12px;margin-top:10px" id="gtext"></p>
      </div>
      <details class="sec math"><summary><span class="cap">Show the math, live</span><span class="pm mono">+</span></summary>
        <div style="display:flex;flex-direction:column;gap:10px;margin-top:14px" id="mathbox"></div></details>
    </div>
  </div>`;
  $('#val', root).oninput = (e) => { value = +e.target.value; update(); };
  root.querySelectorAll('.thumbs button').forEach((b) => (b.onclick = () => { root.querySelector('.photo.big img').src = b.dataset.src; root.querySelectorAll('.thumbs button').forEach((x) => x.classList.toggle('on', x === b)); }));
  root.querySelector('.msg').onsubmit = (e) => { e.preventDefault(); toast(`Sent to ${it.seller}. Remember: the price keeps melting while you chat.`); };
  $('#watch', root).onclick = () => { market.watch(id); const b = $('#watch', root); b.classList.add('flash'); setTimeout(() => b.classList.remove('flash'), 900); toast('You\'re watching. Heat slows the melt for everyone.'); update(true); };
  $('#claim', root).onclick = () => { const r = market.claim(id, 'you'); toast(r.ok ? `Claimed for ${money(r.price, false)}. Pick-up at ${dormName(it.dorm)}.` : 'Too late. Someone caught it.'); update(true); };
  let lastChart = 0;
  function update(force) {
    const v = market.view(it), g = market.gauge(id, value), melting = v.status === STATUS.MELTING;
    $('#bp', root).innerHTML = money(melting ? v.price : (v.soldAt ?? 0));
    $('#st', root).textContent = STATUS_LABEL[v.status]; $('#hw', root).textContent = `◉ ${v.watchers} watching · heat ${v.heat.toFixed(2)}`;
    $('#co2', root).innerHTML = `${(it.kg * ({ furniture: 2.1, appliance: 3.4, electronics: 4.6, decor: 1.6, kitchen: 2.4, bike: 3, books: 1.1, clothing: 5.5, storage: 2, plant: .3 }[it.category] || 2)).toFixed(0)}<small class="mono" style="font-size:12px"> kg</small>`;
    const cb = $('#claim', root); cb.disabled = ![STATUS.MELTING, STATUS.FREE, STATUS.KINDNESS].includes(v.status);
    cb.innerHTML = melting ? `Claim at ${money(v.price, false)}` : v.status === STATUS.FREE ? 'Claim free' : v.status === STATUS.KINDNESS ? 'Kindness window · need-first' : STATUS_LABEL[v.status];
    $('#left', root).textContent = melting ? `Hits $0 in ${dur(v.hoursLeft)} · then 2h Kindness Window` : '';
    $('#vv', root).textContent = `$${value}`;
    const r = Math.min(2, g.ratio === Infinity ? 2 : g.ratio);
    $('#gfill', root).style.width = `${(r / 2) * 100}%`;
    $('#gl', root).textContent = `r = ${g.ratio === Infinity ? '∞' : g.ratio.toFixed(2)}`;
    $('#verdict', root).textContent = !melting ? '—' : g.claimNow ? 'CLAIM NOW ▲' : 'WAIT, IT\'S STILL MELTING ▽';
    $('#gtext', root).textContent = melting ? `Waiting 6h saves ${money(g.savingsIfWait, false)}, but there's a ${Math.round(g.lossRisk * 100)}% chance someone else claims it first. Demand λ̂ = ${g.lambda.toFixed(2)} watchers/h.` : '';
    const life = [['Listed', 'p₀ = $' + it.p0], ['Melting', `k = ${it.k}`], ['$0 · Kindness', 'need-first 2h'], ['Free', 'anyone, 4h'], ['Donation', 'truck pickup']];
    const stage = { melting: 1, sold: 1, kindness: 2, free: 3, claimed: 3, donation: 4, picked: 4 }[v.status];
    $('#life', root).innerHTML = life.map(([a, b], i) => `<div class="${i <= stage ? 'on' : ''} ${i === stage ? 'now' : ''}"><span class="cap-sm">${a}</span><span class="mono" style="font-size:11px">${b}</span></div>`).join('');
    const post = demandPosterior(it.category, v.watchers, v.t);
    $('#mathbox', root).innerHTML = `
      <p class="eq">p(s) = p₀ · (e<sup>−ks</sup> − e<sup>−kT</sup>) / (1 − e<sup>−kT</sup>) = <b>${money(v.price, false)}</b></p>
      <p class="eq">H(t) = Σ e<sup>−(t−tᵢ)/τ</sup> = <b>${v.heat.toFixed(3)}</b> &nbsp; ds/dt = 1/(1+βH) = <b>${(1 / (1 + HEAT.beta * v.heat)).toFixed(3)}</b></p>
      <p class="eq">effective time s = <b>${v.s.toFixed(1)}h</b> vs wall time t = <b>${v.t.toFixed(1)}h</b> → heat bought <b>${(v.t - v.s).toFixed(1)}h</b></p>
      <p class="eq">λ | n,t ~ Gamma(${post.alpha.toFixed(0)}, ${post.beta.toFixed(1)}) → λ̂ = <b>${post.mean.toFixed(3)}</b> ± ${post.sd.toFixed(3)}</p>
      <p class="eq">claim when −p′(t) ≤ h(t)(v − p): <b>${g.slope.toFixed(3)}</b> vs <b>${(g.hazard * Math.max(0, value - v.price)).toFixed(3)}</b></p>`;
    const now = performance.now();
    if (force || now - lastChart > 900) { lastChart = now; C.meltChart($('#chart', root), { curve: market.curve(id, 160), T: it.T, t: v.t, p0: it.p0 }); }
  }
  update(true);
  return { update };
}

// ── sell ──────────────────────────────────────────────────────────────────
function sellView(root) {
  const f = { name: 'Desk lamp, brass', glyph: 'lamp', category: 'decor', p0: 30, temperament: 'steady', T: 72, dorm: 'river', kg: 2, ft3: 1 };
  root.innerHTML = `
  <div class="topbar"><h1 class="h-1">List something. <em>Let it melt.</em></h1><span class="cap">Takes 20 seconds</span></div>
  <div class="two">
    <form class="box pad" id="sf" style="display:flex;flex-direction:column;gap:14px">
      <label class="f"><span class="cap-sm">What is it?</span><input name="name" value="${f.name}" required></label>
      <div class="two" style="gap:12px">
        <label class="f"><span class="cap-sm">Category</span><select name="category">${['furniture', 'appliance', 'electronics', 'kitchen', 'decor', 'clothing', 'bike', 'books', 'storage', 'plant'].map((c) => `<option ${c === f.category ? 'selected' : ''}>${c}</option>`).join('')}</select></label>
        <label class="f"><span class="cap-sm">Looks like</span><select name="glyph">${['lamp', 'futon', 'fridge', 'desk', 'chair', 'microwave', 'rug', 'bike', 'books', 'monitor', 'plant', 'mirror', 'shelf', 'kettle', 'parka', 'bins', 'speaker', 'beanbag', 'vacuum', 'lights'].map((g) => `<option ${g === f.glyph ? 'selected' : ''}>${g}</option>`).join('')}</select></label>
      </div>
      <div class="two" style="gap:12px">
        <label class="f"><span class="cap-sm">Starting price · $<span id="pv">${f.p0}</span></span><input type="range" name="p0" min="5" max="200" value="${f.p0}"></label>
        <label class="f"><span class="cap-sm">Hits $0 in · <span id="tv">${f.T}</span>h</span><input type="range" name="T" min="24" max="120" step="6" value="${f.T}"></label>
      </div>
      <fieldset style="border:0;display:flex;flex-direction:column;gap:8px"><legend class="cap-sm" style="margin-bottom:8px">Melt temperament</legend>
        <div style="display:flex;gap:6px">${Object.keys(TEMPERAMENTS).map((t) => `<button type="button" class="btn ${t === f.temperament ? 'on' : ''}" data-t="${t}" style="flex:1">${t}</button>`).join('')}</div></fieldset>
      <label class="f"><span class="cap-sm">Pick-up dorm</span><select name="dorm">${CAMPUS.dorms.map((d) => `<option value="${d.id}" ${d.id === f.dorm ? 'selected' : ''}>${d.name}</option>`).join('')}</select></label>
      <p class="dim" style="font-size:13px">There's no relisting and no haggling. The curve does the negotiating for you. If nobody buys, a student who needs it gets it free, and then a donation truck takes the rest. <em>You'll never haul it to the dumpster.</em></p>
      <button class="btn big solid" type="submit">Start melting →</button>
    </form>
    <div class="box" style="display:flex;flex-direction:column">
      <div class="art" style="background:var(--paper-2);display:grid;place-items:center;aspect-ratio:16/9;border-bottom:1.5px solid var(--ink)" id="pg"></div>
      <div class="pad"><span class="cap">Preview: three temperaments</span><canvas class="chart" id="pc" style="height:240px;margin-top:10px"></canvas>
      <p class="mono dim" style="font-size:12px" id="pt"></p></div>
    </div>
  </div>`;
  const form = $('#sf', root);
  const draw = () => {
    $('#pg', root).innerHTML = `<div style="width:36%">${glyph(f.glyph)}</div>`; $('#pv', root).textContent = f.p0; $('#tv', root).textContent = f.T;
    const c = $('#pc', root), { x, w, h: H } = C.setup(c);
    Object.entries(TEMPERAMENTS).forEach(([t, k]) => { x.strokeStyle = '#1F2BE0'; x.lineWidth = t === f.temperament ? 3 : 1.2; x.globalAlpha = t === f.temperament ? 1 : .4; x.setLineDash(t === f.temperament ? [] : [3, 4]); x.beginPath();
      for (let i = 0; i <= 100; i++) { const s = (f.T * i) / 100, y = 8 + (H - 16) * (1 - meltPrice(f.p0, k, f.T, s) / f.p0); i ? x.lineTo((w * i) / 100, y) : x.moveTo(0, y); } x.stroke(); });
    x.globalAlpha = 1; x.setLineDash([]);
    const k = TEMPERAMENTS[f.temperament], q = (frac) => { for (let s = 0; s <= f.T; s += .25) if (meltPrice(f.p0, k, f.T, s) <= f.p0 * frac) return s; return f.T; };
    $('#pt', root).textContent = `${f.temperament}: half price after ${q(.5).toFixed(0)}h · quarter price after ${q(.25).toFixed(0)}h · $0 at ${f.T}h, guaranteed.`;
  };
  form.oninput = (e) => { const el = e.target; if (el.name) f[el.name] = el.type === 'range' ? +el.value : el.value; draw(); };
  form.querySelectorAll('[data-t]').forEach((b) => (b.onclick = () => { f.temperament = b.dataset.t; form.querySelectorAll('[data-t]').forEach((x) => x.classList.toggle('on', x === b)); draw(); }));
  form.onsubmit = (e) => { e.preventDefault(); const v = market.addListing({ ...f, name: form.name.value }); toast('Listed. It starts melting now.'); location.hash = `#/item/${v.id}`; };
  draw();
  return {};
}

// ── router + clock ────────────────────────────────────────────────────────
let current = { update() {} };
function route() {
  const [, name = 'market', arg] = (location.hash || '#/market').split('/');
  chrome(name);
  const root = $('#app'); root.innerHTML = ''; root.className = name === 'join' ? '' : 'page';
  const views = { market: marketView, item: (r) => itemView(r, arg), sell: sellView, kindness: kindnessView, routes: routesView, impact: impactView, live: liveView, join: joinView };
  current?.destroy?.(); current = (views[name] || marketView)(root, arg) || {};
  scrollTo(0, 0);
}
addEventListener('hashchange', route);
let last = performance.now(), tickerAt = 0;
function loop(now) {
  const dt = Math.min(1, (now - last) / 1000); last = now;
  if (sim.running) { const ev = market.advance(sim.speed * dt); if (ev.some((e) => e.type !== 'watch')) renderTicker(); }
  if (now - tickerAt > 250) { tickerAt = now; const mo = $('#moveout'); if (mo) mo.textContent = dur(MOVE_OUT - market.now); $('#simclock') && ($('#simclock').textContent = `T+${market.now.toFixed(1)}h`); current.update?.(); }
  requestAnimationFrame(loop);
}
function simbar() {
  const bar = $('#simbar');
  bar.innerHTML = `<button class="btn" id="pp">Pause</button>
    <span class="cap-sm">Demo clock</span>
    ${[['1h / 20s', .05], ['1h / 2s', .5], ['6h / s', 6]].map(([l, s]) => `<button class="btn ${s === sim.speed ? 'on' : ''}" data-s="${s}">${l}</button>`).join('')}
    <span class="grow"></span><span class="mono" id="simclock"></span>
    <button class="btn" id="jump">Jump to move-out →</button>`;
  $('#pp').onclick = (e) => { sim.running = !sim.running; e.target.textContent = sim.running ? 'Pause' : 'Play'; };
  bar.querySelectorAll('[data-s]').forEach((b) => (b.onclick = () => { sim.speed = +b.dataset.s; bar.querySelectorAll('[data-s]').forEach((x) => x.classList.toggle('on', x === b)); }));
  $('#jump').onclick = () => { market.advance(Math.max(0, MOVE_OUT + 3 - market.now)); renderTicker(); route(); toast('Move-out happened. See what transformed, and what was routed to donation.'); };
}
simbar(); route(); requestAnimationFrame(loop);
if (!new URLSearchParams(location.search).has('seeded')) fetchLiveCatalog().then((p) => { if (p.length) { const n = applyCatalog(market, p); renderTicker(); route(); toast(`Live catalog: ${n} real products loaded`); } }).catch(() => {});
