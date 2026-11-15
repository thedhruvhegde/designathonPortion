/* Kindness Window (Gale–Shapley), donation routing (Clarke–Wright + 2-opt), impact dashboard. */
import { market, $, h, money, dur, dormName, toast, MOVE_OUT } from './app.js';
import { NEED_WEIGHTS, EMISSION } from '../engine/melt.js';
import { CAMPUS } from '../engine/market.js';
import { glyph } from './glyphs.js';

const FLAG = { pell: 'Pell', foodInsecure: 'Food-insecure', intlFreshman: 'Int’l freshman', housingInsecure: 'Housing-insecure', firstGen: 'First-gen' };

// ── Kindness Window ───────────────────────────────────────────────────────
export function kindnessView(root) {
  const K = market.kindness(true);
  let step = K.log.length; // show final by default
  root.innerHTML = `
  <div class="topbar"><div><span class="cap">At $0, need comes first</span><h1 class="h-1" style="margin-top:10px">The Kindness <em>Window</em></h1></div><span class="cap-sm">Gale–Shapley stable matching · 2 hours</span></div>
  <div class="two" style="grid-template-columns:1fr 1.6fr;align-items:start">
    <div style="display:flex;flex-direction:column;gap:18px">
      <p style="font-size:18px;max-width:44ch">When something melts to $0, it doesn't go to whoever refreshes fastest. For two hours it's held for students who quietly opted in with a need. Matching is <em>stable</em>: no student and item would both rather be paired with each other.</p>
      <div class="box pad"><span class="cap-sm">Need score</span><p class="eq" style="margin-top:8px">N = Σ wⱼ · flagⱼ + ε</p>
        <div class="ledger" style="margin-top:8px">${Object.entries(NEED_WEIGHTS).map(([k, w]) => `<div class="row"><span class="mono">w=${w}</span><span>${FLAG[k]}</span><span class="cells" style="width:90px;grid-template-columns:repeat(4,1fr)">${[1, 2, 3, 4].map((i) => `<b class="${i <= w ? 'on' : ''}"></b>`).join('')}</span></div>`).join('')}</div>
        <p class="mono dim" style="font-size:11px;margin-top:10px">ε is a seeded lottery tie-break. Flags are private and self-declared. Sellers never see who claimed or why.</p></div>
      <div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn" id="b0">⟲ Restart</button><button class="btn" id="b1">Step →</button><button class="btn solid" id="b2">▶ Play matching</button></div>
      <p class="mono" style="font-size:12px" id="logline"></p>
    </div>
    <div class="box" style="padding:12px"><svg id="bip" class="map" style="border:0" viewBox="0 0 900 640" aria-label="Bipartite matching diagram"></svg></div>
  </div>`;
  const svg = $('#bip', root), cl = K.claimants, items = K.pool.slice(0, 8);
  const cy = (i) => 50 + i * (560 / Math.max(1, cl.length - 1)), iy = (i) => 50 + i * (560 / Math.max(1, items.length - 1));
  function draw() {
    const match = {}; const log = K.log.slice(0, step);
    for (const e of log) { if (e.result === 'held') match[e.item] = e.claimant; if (e.result === 'bumped') match[e.item] = e.claimant; }
    const cur = log.at(-1);
    let s = '';
    // proposals faint
    cl.forEach((c, ci) => c.prefs.filter((p) => items.some((i) => i.id === p)).forEach((p) => { const ii = items.findIndex((i) => i.id === p); s += `<line x1="250" y1="${cy(ci)}" x2="610" y2="${iy(ii)}" stroke="var(--ink)" stroke-opacity=".12" stroke-width="1"/>`; }));
    // matches
    Object.entries(match).forEach(([it, c]) => { const ci = cl.findIndex((x) => x.id === c), ii = items.findIndex((x) => x.id === it); if (ci < 0 || ii < 0) return; s += `<line x1="250" y1="${cy(ci)}" x2="610" y2="${iy(ii)}" stroke="var(--ink)" stroke-width="3"/>`; });
    if (cur) { const ci = cl.findIndex((x) => x.id === cur.claimant), ii = items.findIndex((x) => x.id === cur.item); if (ci >= 0 && ii >= 0) s += `<line x1="250" y1="${cy(ci)}" x2="610" y2="${iy(ii)}" stroke="var(--ink)" stroke-width="2" stroke-dasharray="6 5"/>`; }
    cl.forEach((c, i) => { const y = cy(i), on = Object.values(match).includes(c.id);
      s += `<g transform="translate(20 ${y - 26})"><rect width="230" height="52" fill="${on ? 'var(--ink)' : 'var(--paper)'}" stroke="var(--ink)" stroke-width="1.5"/>
      <text x="12" y="21" font-family="DM Mono" font-size="13" fill="${on ? 'var(--paper)' : 'var(--ink)'}">${c.alias} · N=${c.score}</text>
      <text x="12" y="39" font-family="Hanken Grotesk" font-weight="600" font-size="10" letter-spacing="1.4" fill="${on ? 'var(--paper)' : 'var(--ink)'}">${(c.flags.map((f) => FLAG[f]).join(' · ') || 'NO FLAGS').toUpperCase()}</text></g>`; });
    items.forEach((it, i) => { const y = iy(i), taken = match[it.id];
      s += `<g transform="translate(610 ${y - 26})"><rect width="270" height="52" fill="var(--paper)" stroke="var(--ink)" stroke-width="1.5"/>
      <g transform="translate(6 4) scale(.44)">${glyph(it.glyph).replace(/^<svg[^>]*>|<\/svg>$/g, '')}</g>
      <text x="58" y="22" font-family="Newsreader" font-size="17" fill="var(--ink)">${it.name.split(',')[0].slice(0, 24)}</text>
      <text x="58" y="40" font-family="DM Mono" font-size="11" fill="var(--ink)">${dormName(it.dorm).toUpperCase()} · ${taken ? '→ ' + cl.find((c) => c.id === taken).alias : 'OPEN'}</text></g>`; });
    svg.innerHTML = s;
    $('#logline', root).textContent = cur ? `Step ${cur.step}/${K.log.length}: ${cl.find((c) => c.id === cur.claimant).alias} proposes to ${items.find((i) => i.id === cur.item)?.name.split(',')[0] ?? cur.item} → ${cur.result}${cur.bumped ? ` (bumps ${cl.find((c) => c.id === cur.bumped).alias})` : ''}` : 'Each student proposes to their nearest needed item. Items keep the highest need score.';
  }
  let timer;
  $('#b0', root).onclick = () => { clearInterval(timer); step = 0; draw(); };
  $('#b1', root).onclick = () => { clearInterval(timer); step = Math.min(K.log.length, step + 1); draw(); };
  $('#b2', root).onclick = () => { clearInterval(timer); step = 0; draw(); timer = setInterval(() => { step++; draw(); if (step >= K.log.length) clearInterval(timer); }, 700); };
  draw();
  return { destroy: () => clearInterval(timer) };
}

// ── Routes ────────────────────────────────────────────────────────────────
export function routesView(root) {
  const R = market.routes(120); let mode = 'optimized', anim;
  const S = (v) => v * 8 + 40; // map 0..100 → svg
  root.innerHTML = `
  <div class="topbar"><div><span class="cap">Whatever nobody claims gets a ride</span><h1 class="h-1" style="margin-top:10px">The donation <em>truck</em></h1></div><span class="cap-sm">Clarke–Wright savings · 2-opt · capacity ${R.capacity} ft³</span></div>
  <div class="two" style="grid-template-columns:1.6fr 1fr;align-items:start">
    <div class="box" style="padding:10px"><svg class="map" id="map" viewBox="0 0 880 820" style="border:0" aria-label="Campus pickup routes"></svg></div>
    <div style="display:flex;flex-direction:column;gap:16px">
      <div style="display:flex;gap:6px">${[['naive', '1 · Naive'], ['savings', '2 · Savings'], ['optimized', '3 · 2-opt']].map(([m, l]) => `<button class="btn ${m === mode ? 'on' : ''}" data-m="${m}" style="flex:1">${l}</button>`).join('')}</div>
      <div class="box pad"><span class="cap-sm">Route length</span><div class="num" style="font-size:84px;line-height:.9;margin-top:8px" id="len"></div><p class="mono" style="font-size:12px;margin-top:8px" id="lensub"></p></div>
      <div class="box pad"><p class="eq">S(i,j) = d(0,i) + d(0,j) − d(i,j)</p><p class="dim" style="font-size:13px;margin-top:6px">Merge the stops that save the most driving, while the truck still fits the load.</p>
        <p class="eq" style="margin-top:12px">if d(a,b)+d(c,d) &gt; d(a,c)+d(b,d): reverse(b…c)</p><p class="dim" style="font-size:13px;margin-top:6px">Then untangle every crossing until no swap helps.</p></div>
      <div class="ledger" id="stops"></div>
    </div>
  </div>`;
  const svg = $('#map', root);
  const byId = Object.fromEntries([...R.stops, { ...R.depot }].map((s) => [s.id, s]));
  function draw() {
    const routes = mode === 'naive' ? [R.naive] : R[mode];
    const total = routes.reduce((a, r) => a + r.length, 0);
    let s = '';
    for (let x = 0; x <= 100; x += 5) s += `<line x1="${S(x)}" y1="40" x2="${S(x)}" y2="840" stroke="var(--grid)"/><line x1="40" y1="${S(x)}" x2="840" y2="${S(x)}" stroke="var(--grid)"/>`;
    CAMPUS.dorms.forEach((d) => { const st = byId[d.id]; s += `<g transform="translate(${S(d.x)} ${S(d.y)})"><rect x="-50" y="-22" width="100" height="44" fill="${st ? 'var(--ink)' : 'var(--paper)'}" stroke="var(--ink)" stroke-width="1.5"/>
      <text y="5" text-anchor="middle" font-family="Hanken Grotesk" font-weight="600" font-size="9.5" letter-spacing="1" fill="${st ? 'var(--paper)' : 'var(--ink)'}">${d.name.toUpperCase()}</text>
      ${st ? `<text y="40" text-anchor="middle" font-family="DM Mono" font-size="11" fill="var(--ink)">${st.items.length} items · ${st.load.toFixed(0)} ft³</text>` : ''}</g>`; });
    const D = R.depot; s += `<g transform="translate(${S(D.x)} ${S(D.y)})"><rect x="-58" y="-20" width="116" height="40" fill="var(--paper)" stroke="var(--ink)" stroke-width="3"/><text y="5" text-anchor="middle" font-family="Hanken Grotesk" font-weight="600" font-size="11" letter-spacing="1.4" fill="var(--ink)">REUSE DEPOT</text></g>`;
    routes.forEach((r, ri) => { const pts = [D, ...r.route.map((id) => byId[id]), D].map((p) => `${S(p.x)},${S(p.y)}`).join(' ');
      s += `<polyline id="rt${ri}" points="${pts}" fill="none" stroke="var(--ink)" stroke-width="${mode === 'naive' ? 1.5 : 3}" ${mode === 'naive' ? 'stroke-dasharray="7 6"' : ''} stroke-linejoin="miter"/>`; });
    s += `<g id="truck"><g transform="translate(-22 -22) scale(.44)">${glyph('truck').replace(/^<svg[^>]*>|<\/svg>$/g, '')}</g></g>`;
    svg.innerHTML = s;
    $('#len', root).textContent = total.toFixed(0);
    const saved = 1 - total / R.naive.length;
    $('#lensub', root).textContent = mode === 'naive' ? `${R.stops.length} stops, visited in listing order. Units: map blocks.` : `−${(saved * 100).toFixed(1)}% vs naive · ${routes.length} trip${routes.length > 1 ? 's' : ''}${mode === 'optimized' ? ` · ${routes.reduce((a, r) => a + r.swaps, 0)} 2-opt swaps` : ''}`;
    $('#stops', root).innerHTML = R.stops.map((st, i) => `<div class="row"><span class="mono">S${String(i + 1).padStart(2, '0')}</span><span>${st.name}</span><span class="mono">${st.items.length} · ${st.load.toFixed(0)} ft³</span></div>`).join('');
    // animate truck along first route
    cancelAnimationFrame(anim); const pl = svg.querySelector('#rt0'), truck = svg.querySelector('#truck'); const L = pl.getTotalLength(); const t0 = performance.now();
    const go = (now) => { const f = ((now - t0) / 9000) % 1, p = pl.getPointAtLength(f * L); truck.setAttribute('transform', `translate(${p.x} ${p.y})`); anim = requestAnimationFrame(go); }; anim = requestAnimationFrame(go);
  }
  root.querySelectorAll('[data-m]').forEach((b) => (b.onclick = () => { mode = b.dataset.m; root.querySelectorAll('[data-m]').forEach((x) => x.classList.toggle('on', x === b)); draw(); }));
  draw();
  return { destroy: () => cancelAnimationFrame(anim) };
}

// ── Impact ────────────────────────────────────────────────────────────────
export function impactView(root) {
  root.innerHTML = `
  <div class="topbar"><div><span class="cap">What didn't go in the dumpster</span><h1 class="h-1" style="margin-top:10px">Impact, <em>live</em></h1></div><span class="cap-sm">Updates with the market clock</span></div>
  <div class="hero" style="grid-template-columns:repeat(4,1fr);gap:0;border-top:1.5px solid var(--ink)">
    ${[['kg', 'Kept from landfill', 'kg'], ['co2', 'CO₂e avoided', 'kg · est.'], ['saved', 'Kept in students’ pockets', 'USD vs list'], ['bins', 'Dumpsters not filled', '3 yd³ bins']].map(([k, l, u], i) => `<div style="padding:16px ${i ? '16px' : '0'};${i ? 'border-left:1px solid var(--ink-faint)' : ''}"><span class="cap-sm">${l}</span><div class="num" style="font-size:clamp(48px,5vw,92px);line-height:.95;margin:8px 0" id="i-${k}">0</div><span class="mono dim" style="font-size:11px">${u.toUpperCase()}</span></div>`).join('')}
  </div>
  <div class="two">
    <div class="box pad"><div class="topbar" style="margin-bottom:14px"><span class="cap">Diverted by category</span><span class="mono" style="font-size:11px">KG</span></div><div class="pstack" id="ps"></div></div>
    <div class="box pad" style="display:flex;flex-direction:column;gap:14px">
      <div class="topbar" style="margin-bottom:0"><span class="cap">Where it all went</span><span class="mono" style="font-size:11px" id="outN"></span></div>
      <div id="out"></div>
      <div class="rule-f" style="padding-top:12px"><span class="cap-sm">If one campus ran Melt for one move-out</span>
        <p class="eq" style="margin-top:8px">${'8,000 students × 12 kg left behind × 85% diverted'} ≈ <b>81.6 t</b></p>
        <p class="mono dim" style="font-size:11px;margin-top:6px">Projection with stated assumptions; replace with your campus's audit numbers.</p></div>
    </div>
  </div>`;
  const cats = Object.keys(EMISSION);
  function update() {
    const im = market.impact();
    $('#i-kg', root).textContent = Math.round(im.kg).toLocaleString(); $('#i-co2', root).textContent = Math.round(im.co2).toLocaleString();
    $('#i-saved', root).textContent = '$' + Math.round(im.saved).toLocaleString(); $('#i-bins', root).textContent = im.bins.toFixed(1);
    const max = Math.max(20, ...cats.map((c) => im.byCat[c] || 0));
    $('#ps', root).innerHTML = cats.map((c) => { const v = im.byCat[c] || 0, on = Math.round((v / max) * 14);
      return `<div class="bar"><span class="mono" style="font-size:11px;text-align:center">${v.toFixed(0)}</span><div class="col">${Array.from({ length: 14 }, (_, i) => `<b class="${i < on ? 'on' : ''}"></b>`).join('')}</div><span class="ax mono" style="font-size:10px">${c.slice(0, 5).toUpperCase()}</span></div>`; }).join('');
    const n = { reused: im.reused, donated: im.donated, melting: im.live, dumpster: 0 };
    $('#outN', root).textContent = `${im.total} LISTINGS`;
    $('#out', root).innerHTML = Object.entries(n).map(([k, v]) => `<div style="display:grid;grid-template-columns:110px 1fr 40px;gap:10px;align-items:center;padding:6px 0"><span class="cap-sm">${k}</span>${`<div class="cells" style="height:16px">${Array.from({ length: 28 }, (_, i) => `<b class="${i < Math.round((v / im.total) * 28) ? 'on' : ''}"></b>`).join('')}</div>`}<span class="mono" style="text-align:right">${v}</span></div>`).join('') + `<p class="mono" style="font-size:12px;margin-top:8px">Dumpster: 0. By design, there is no path there.</p>`;
  }
  update();
  return { update };
}
