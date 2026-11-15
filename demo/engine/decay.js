/* Impermanence math kernel — shared by whichever concept wins.
   Every model maps age t (seconds) -> remaining "life" in [0,1]. */
export const LN2 = Math.LN2;

/** Exponential half-life:  N(t) = 2^(-t / t½) */
export const halfLife = (t, th) => Math.pow(2, -t / th);

/** Weibull survival:  S(t) = exp(-(t/λ)^k).  k<1 infant mortality, k=1 memoryless, k>1 wear-out */
export const weibull = (t, lambda, k) => Math.exp(-Math.pow(t / lambda, k));
/** Weibull hazard:  h(t) = (k/λ)(t/λ)^(k-1) */
export const weibullHazard = (t, lambda, k) => (k / lambda) * Math.pow(t / lambda, k - 1);

/** Logistic "melt":  L(t) = 1 / (1 + e^(r(t - t0)))  — a slow start, then a cliff */
export const logistic = (t, r, t0) => 1 / (1 + Math.exp(r * (t - t0)));

/** Ebbinghaus retention with spaced reinforcement:  R = e^(-t/S), and S grows by a factor on each review */
export const retention = (t, S) => Math.exp(-t / S);

/** Arrhenius rate:  k(T) = A·e^(-Ea / (R·T)) — environment-driven decay (T in Kelvin) */
export const arrhenius = (A, Ea, T) => A * Math.exp(-Ea / (8.314 * T));

/** First-order ODE step with time-varying rate:  dN/dt = -k(t)·N  (exact for piecewise-constant k) */
export const stepDecay = (N, k, dt) => N * Math.exp(-k * dt);

/** Laplace mechanism for ε-differential privacy on public counters:  x + Lap(Δ/ε) */
export function laplace(x, sensitivity = 1, eps = 0.5, rnd = Math.random) {
  const u = rnd() - 0.5, b = sensitivity / eps;
  return x - b * Math.sign(u) * Math.log(1 - 2 * Math.abs(u));
}

/** Optimal stopping (secretary rule): observe the first n/e, then take the first that beats them */
export const secretaryCutoff = (n) => Math.round(n / Math.E);

/** Simulation clock: real time × speed, can be scrubbed. Emits 'tick' with { t, dt }. */
export class SimClock extends EventTarget {
  constructor(speed = 60) { super(); this.t = 0; this.speed = speed; this.running = true; this._last = performance.now(); this._loop = this._loop.bind(this); requestAnimationFrame(this._loop); }
  _loop(now) { const real = (now - this._last) / 1000; this._last = now; if (this.running) { const dt = real * this.speed; this.t += dt; this.dispatchEvent(new CustomEvent('tick', { detail: { t: this.t, dt } })); } requestAnimationFrame(this._loop); }
  seek(t) { const dt = t - this.t; this.t = Math.max(0, t); this.dispatchEvent(new CustomEvent('tick', { detail: { t: this.t, dt } })); }
}

export const fmtDuration = (s) => s < 60 ? `${s.toFixed(0)}s` : s < 3600 ? `${(s / 60).toFixed(0)}m` : s < 86400 ? `${(s / 3600).toFixed(1)}h` : `${(s / 86400).toFixed(1)}d`;
