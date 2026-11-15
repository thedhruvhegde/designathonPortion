/* Canvas charts in Cobalt: one ink, hairlines, mono ticks. */
const INK = '#1F2BE0', FAINT = 'rgba(31,43,224,.18)', GRID = 'rgba(31,43,224,.10)';
export function setup(c) {
  const d = devicePixelRatio || 1, w = c.clientWidth, h = c.clientHeight;
  if (c.width !== Math.round(w * d) || c.height !== Math.round(h * d)) { c.width = Math.round(w * d); c.height = Math.round(h * d); }
  const x = c.getContext('2d'); x.setTransform(d, 0, 0, d, 0, 0); x.clearRect(0, 0, w, h); return { x, w, h };
}
const mono = (x, size = 11) => { x.font = `400 ${size}px "DM Mono", ui-monospace, monospace`; x.fillStyle = INK; };

/** Melt curve: base (dashed), actual (solid, past), projection (dotted), now marker, final-24h band. */
export function meltChart(c, { curve, T, t, p0, finalWindow = 24, label = true }) {
  const { x, w, h } = setup(c), L = 44, R = 12, Tp = 14, B = 26, W = w - L - R, H = h - Tp - B;
  const X = (v) => L + (v / T) * W, Y = (p) => Tp + H - (p / p0) * H;
  // grid
  x.strokeStyle = GRID; x.lineWidth = 1;
  for (let i = 0; i <= 4; i++) { const y = Tp + (H * i) / 4; x.beginPath(); x.moveTo(L, y); x.lineTo(L + W, y); x.stroke(); }
  // final window hatch
  const fx = X(Math.max(0, T - finalWindow));
  x.save(); x.beginPath(); x.rect(fx, Tp, L + W - fx, H); x.clip(); x.strokeStyle = FAINT;
  for (let k = -H; k < W; k += 7) { x.beginPath(); x.moveTo(fx + k, Tp + H); x.lineTo(fx + k + H, Tp); x.stroke(); } x.restore();
  // axes
  x.strokeStyle = INK; x.lineWidth = 1.5; x.beginPath(); x.moveTo(L, Tp + H); x.lineTo(L + W, Tp + H); x.stroke();
  mono(x); x.textAlign = 'right';
  for (let i = 0; i <= 4; i++) x.fillText('$' + Math.round(p0 * (1 - i / 4)), L - 8, Tp + (H * i) / 4 + 4);
  x.textAlign = 'center';
  for (let i = 0; i <= 6; i++) { const v = (T * i) / 6; x.fillText(Math.round(v) + 'h', X(v), Tp + H + 18); }
  // base curve dashed
  x.setLineDash([4, 4]); x.lineWidth = 1.2; x.globalAlpha = .55; x.beginPath();
  curve.forEach((p, i) => (i ? x.lineTo(X(p.t), Y(p.base)) : x.moveTo(X(p.t), Y(p.base)))); x.stroke();
  x.setLineDash([]); x.globalAlpha = 1;
  // actual: solid past, dotted future
  const past = curve.filter((p) => p.t <= t), fut = curve.filter((p) => p.t >= t);
  x.lineWidth = 2.4; x.beginPath(); past.forEach((p, i) => (i ? x.lineTo(X(p.t), Y(p.actual)) : x.moveTo(X(p.t), Y(p.actual)))); x.stroke();
  x.lineWidth = 1.6; x.setLineDash([1.5, 4]); x.beginPath(); fut.forEach((p, i) => (i ? x.lineTo(X(p.t), Y(p.actual)) : x.moveTo(X(p.t), Y(p.actual)))); x.stroke(); x.setLineDash([]);
  // area under past
  x.save(); x.beginPath(); past.forEach((p, i) => (i ? x.lineTo(X(p.t), Y(p.actual)) : x.moveTo(X(p.t), Y(p.actual)))); if (past.length) { x.lineTo(X(past.at(-1).t), Tp + H); x.lineTo(L, Tp + H); x.closePath(); x.clip();
    x.strokeStyle = INK; x.globalAlpha = .18; x.lineWidth = 1; for (let k = L; k < L + W; k += 4) { x.beginPath(); x.moveTo(k, Tp); x.lineTo(k, Tp + H); x.stroke(); } } x.restore();
  // now marker
  const nx = X(Math.min(t, T)); const np = curve.reduce((a, p) => (Math.abs(p.t - t) < Math.abs(a.t - t) ? p : a), curve[0]);
  x.fillStyle = INK; x.fillRect(nx - .75, Tp, 1.5, H); x.fillRect(nx - 5, Y(np.actual) - 5, 10, 10);
  if (label) { mono(x, 11); x.textAlign = nx > L + W - 90 ? 'right' : 'left'; x.fillText('NOW', nx + (x.textAlign === 'left' ? 8 : -8), Tp + 10);
    x.textAlign = 'right'; x.fillText('FINAL 24H · deadline lock', L + W - 4, Tp + 10); }
}

/** small sparkline of price remaining */
export function spark(c, pts, p0) {
  const { x, w, h } = setup(c); x.strokeStyle = INK; x.lineWidth = 1.5; x.beginPath();
  pts.forEach((p, i) => { const X = (i / (pts.length - 1)) * w, Y = h - 2 - (p / p0) * (h - 4); i ? x.lineTo(X, Y) : x.moveTo(X, Y); }); x.stroke();
}

/** Dutch-auction live curve: full curve faint, melted part solid, current price square */
export function auctionChart(c, { p0, elapsed, duration, priceFn, sold }) {
  const { x, w, h } = setup(c), L = 8, B = 20, W = w - L * 2, H = h - B - 8;
  const X = (s) => L + (s / duration) * W, Y = (p) => 8 + H - (p / p0) * H;
  x.strokeStyle = GRID; for (let i = 0; i <= 8; i++) { x.beginPath(); x.moveTo(X((duration * i) / 8), 8); x.lineTo(X((duration * i) / 8), 8 + H); x.stroke(); }
  x.strokeStyle = INK; x.globalAlpha = .3; x.lineWidth = 1.2; x.setLineDash([3, 4]); x.beginPath();
  for (let s = 0; s <= duration; s += duration / 120) (s ? x.lineTo(X(s), Y(priceFn(s))) : x.moveTo(X(s), Y(priceFn(s)))); x.stroke(); x.setLineDash([]); x.globalAlpha = 1;
  const e = Math.min(elapsed, duration); x.lineWidth = 3; x.beginPath();
  for (let s = 0; s <= e; s += duration / 240) (s ? x.lineTo(X(s), Y(priceFn(s))) : x.moveTo(X(s), Y(priceFn(s)))); x.stroke();
  x.fillStyle = INK; x.fillRect(X(e) - 7, Y(priceFn(e)) - 7, 14, 14);
  if (sold) { x.strokeStyle = INK; x.lineWidth = 1.5; x.strokeRect(X(e) - 13, Y(priceFn(e)) - 13, 26, 26); }
  x.lineWidth = 1.5; x.beginPath(); x.moveTo(L, 8 + H); x.lineTo(L + W, 8 + H); x.stroke();
  mono(x, 11); x.textAlign = 'left'; x.fillText('0s', L, h - 4); x.textAlign = 'right'; x.fillText(duration + 's · $0 → donation', L + W, h - 4);
}
