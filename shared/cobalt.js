/* Cobalt Grid runtime: generative pixel-glitch, real QR codes as cobalt cells,
   seeded QR mosaics, data-bound pixel-stack charts. Fills the spec's "Known Gaps". */
(function (g) {
  const NS = "http://www.w3.org/2000/svg";
  // mulberry32 — deterministic PRNG so decorations are stable per seed
  function rng(seed) { let a = seed >>> 0; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function hash(s) { let h = 2166136261; for (const c of String(s)) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return h >>> 0; }

  /* Pixel-glitch: stair-stepped column of scanline rectangles.
     data-glitch="seed" data-side="right|left" data-steps="7" data-opacity=".9" */
  function glitch(el) {
    const r = rng(hash(el.dataset.glitch || "cobalt")), steps = +el.dataset.steps || 7;
    const side = el.dataset.side || "right", W = 100, H = 100;
    const svg = document.createElementNS(NS, "svg");
    svg.setAttribute("viewBox", `0 0 ${W} ${H}`); svg.setAttribute("preserveAspectRatio", "none");
    svg.style.cssText = "width:100%;height:100%;display:block;opacity:" + (el.dataset.opacity || 1);
    let y = 0;
    for (let i = 0; i < steps; i++) {
      const h = i === steps - 1 ? H - y : (H / steps) * (0.6 + r() * 0.8);
      const w = W * (0.25 + 0.75 * ((i + 1) / steps)) * (0.85 + r() * 0.3);
      const x = side === "right" ? W - Math.min(w, W) : 0;
      const pitch = 1.6 + r() * 1.6, lw = pitch * (0.35 + r() * 0.25);
      for (let lx = x; lx < x + Math.min(w, W); lx += pitch) {
        const l = document.createElementNS(NS, "rect");
        l.setAttribute("x", lx.toFixed(2)); l.setAttribute("y", y.toFixed(2));
        l.setAttribute("width", lw.toFixed(2)); l.setAttribute("height", Math.min(h, H - y).toFixed(2));
        l.setAttribute("fill", "var(--ink)"); svg.appendChild(l);
      }
      y += h; if (y >= H) break;
    }
    el.replaceChildren(svg);
  }

  /* QR: data-qr="https://..." renders a real, scannable code (needs qrcode-generator);
     data-seed="x" renders the decorative 8×8 mosaic. */
  function qr(el) {
    if (el.dataset.qr && g.qrcode) {
      const q = g.qrcode(0, "M"); q.addData(el.dataset.qr); q.make();
      const n = q.getModuleCount(); el.style.gridTemplateColumns = `repeat(${n},1fr)`; el.style.gridTemplateRows = `repeat(${n},1fr)`;
      const f = document.createDocumentFragment();
      for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) { const i = document.createElement("i"); if (q.isDark(y, x)) i.className = "on"; f.appendChild(i); }
      el.replaceChildren(f); el.setAttribute("role", "img"); el.setAttribute("aria-label", "QR code: " + el.dataset.qr);
      return;
    }
    const r = rng(hash(el.dataset.seed || el.dataset.qr || "qr"));
    el.style.gridTemplateColumns = "repeat(8,1fr)"; el.style.gridTemplateRows = "repeat(8,1fr)";
    const f = document.createDocumentFragment();
    for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) {
      const finder = (x < 3 && y < 3) || (x > 4 && y < 3) || (x < 3 && y > 4);
      const ring = finder && !((x % 5 === 1) && (y % 5 === 1)) ? true : finder ? true : r() > 0.5;
      const i = document.createElement("i"); if (ring) i.className = "on"; f.appendChild(i);
    }
    el.replaceChildren(f);
  }

  /* Pixel-stack: data-values="12,30,..." data-labels="A,B,..." data-cells="12" */
  function pstack(el) {
    const vals = el.dataset.values.split(",").map(Number), labels = (el.dataset.labels || "").split(",");
    const cells = +el.dataset.cells || 12, max = +el.dataset.max || Math.max(...vals);
    el.classList.add("pstack");
    el.replaceChildren(...vals.map((v, i) => {
      const bar = document.createElement("div"); bar.className = "bar";
      const col = document.createElement("div"); col.className = "cells";
      const on = Math.round((v / max) * cells);
      for (let c = 0; c < cells; c++) { const b = document.createElement("b"); if (c < on) b.className = "on"; col.appendChild(b); }
      const ax = document.createElement("div"); ax.className = "axis t-tick"; ax.textContent = labels[i] ?? "";
      const val = document.createElement("div"); val.className = "t-tick"; val.style.textAlign = "center"; val.textContent = v;
      bar.append(val, col, ax); return bar;
    }));
  }

  function hydrate(root = document) {
    root.querySelectorAll("[data-glitch]").forEach(glitch);
    root.querySelectorAll(".qr").forEach(qr);
    root.querySelectorAll("[data-values]").forEach(pstack);
  }
  g.Cobalt = { hydrate, glitch, qr, pstack, rng, hash };
  document.addEventListener("DOMContentLoaded", () => hydrate());
})(window);
