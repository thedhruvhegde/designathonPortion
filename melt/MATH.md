# Melt: math and algorithms

> **Melt** is a move-out marketplace where every price melts on a public curve toward $0. At $0 the item becomes free for students who need it most. If nobody claims it, a donation truck picks it up. Nothing reaches the dumpster.

Symbols: `p₀` list price · `T` hard deadline (move-out, in hours) · `t` hours since listing · `w(t)` watchers.

---

## 1 · The melt curve: it must reach exactly $0 at the deadline
A plain exponential `p₀e^{−kt}` never reaches zero. We use a **deadline-normalised exponential**:

$$p(t)=p_0\,\frac{e^{-k\,s(t)}-e^{-k\,T}}{1-e^{-k\,T}},\qquad p(0)=p_0,\;p(T)=0$$

- `k` is the *melt temperament*: k→0 gives a straight line, and a large k gives a fast early drop followed by a long cheap tail.
- Sellers choose a temperament (Gentle k=0.01, Steady 0.025, Fast 0.05 per hour). The UI previews the curve live.
- The displayed price is rounded to cents and never increases.

## 2 · Heat: watching slows the melt
Every *watch*, *view* or *bid* is an event `tᵢ`. The item's heat is a self-exciting (Hawkes-style) intensity with memory τ = 6 h:

$$H(t)=\sum_{t_i<t} e^{-(t-t_i)/\tau}$$

Heat bends **effective melt time** `s(t)` instead of wall time. A hot item's clock runs slower:

$$\frac{ds}{dt}=\frac{1}{1+\beta H(t)},\qquad \beta=0.15$$

**Deadline guarantee.** Heat can't freeze an item forever. In the final window `t > T − 24h`, `s` is blended back toward `t`, so `s(T)=T` and the price still reaches $0 on time:

$$s^*(t)=\big(1-\omega(t)\big)\,s(t)+\omega(t)\,t,\qquad \omega(t)=\Big(\tfrac{t-(T-24)}{24}\Big)^{2}_{+}$$

## 3 · Demand learning: a Gamma–Poisson posterior
Watcher arrivals are modelled as Poisson with an unknown rate λ (per hour), with a category prior `Gamma(α₀, β₀)`. After `n` arrivals in `t` hours:

$$\lambda\mid n,t\sim\mathrm{Gamma}(\alpha_0+n,\;\beta_0+t),\qquad \hat\lambda=\frac{\alpha_0+n}{\beta_0+t}$$

Each arrival buys at price `p` with probability `q(p)=σ(a−b·p/p₀)`, a logistic willingness-to-pay. The **hazard that someone else claims first** is:

$$h(t)=\hat\lambda\cdot q\big(p(t)\big)$$

## 4 · "When should I claim?": an optimal-stopping rule
A buyer values the item at `v`. Waiting `dt` saves `−p′(t)dt` but risks losing the item with probability `h(t)dt`. Waiting stops being worth it at the first `t*` where

$$-p'(t^*)\;\le\;h(t^*)\,\big(v-p(t^*)\big)$$

The item page shows a **claim gauge**: the ratio `r(t)=h(v−p)/(−p′)`. When r ≥ 1 the gauge reads **CLAIM NOW**. Otherwise it shows the expected savings from waiting, and the probability of losing the item before then, `1−e^{−∫h}`.

## 5 · The Kindness Window: fair, need-first matching
When an item reaches $0 it enters a 2-hour **Kindness Window**, reserved for students who opted in with need flags (Pell-eligible, food-insecure, international freshmen, students who were housing-insecure). Several items and several claimants are matched with **Gale–Shapley stable matching**:

- Claimants rank items by their own preference: distance first, then the category they need.
- Items rank claimants by a **need score** `N = Σ wⱼ·flagⱼ + ε` (ε is a seeded random lottery tie-break, so it isn't first-come-first-served).
- The result is stable: no claimant–item pair would both rather be matched to each other. Proposals are O(n²).

Items still unmatched after the window go to the open free pool, and then to donation.

## 6 · Donation routing: Clarke–Wright savings + 2-opt
Unclaimed items at time T become pickup stops at their dorms. One truck (capacity `Q` in ft³) starts at the depot (the campus reuse store). This is a capacitated vehicle routing problem:

1. **Clarke–Wright savings:** for every pair of stops, `S(i,j)=d(0,i)+d(0,j)−d(i,j)`. Merge routes in descending order of savings while load ≤ Q.
2. **2-opt:** for each route, reverse a segment `(i..j)` whenever `d(a,b)+d(c,d) > d(a,c)+d(b,d)`. Repeat until no improvement.

The demo animates naive order → savings → 2-opt and shows the distance saved at each step.

## 7 · Impact accounting
For each item with mass `m` (kg) diverted from landfill:

$$\mathrm{CO_2e}=m\cdot(EF_{\text{landfill}}+EF_{\text{avoided production}})$$

The emission factors per category are approximations in the spirit of the US EPA's WARM model; they're labelled "est." in the UI. The dashboard also shows `$ kept in student pockets = Σ(p₀ − p_sold)` and `dumpster bins avoided = Σ volume / 3 yd³`.

## 8 · The live auction (the QR moment)
The stage version is a **Dutch auction**: the same deadline-normalised curve, compressed to 60 seconds. Phones join by QR. The first tap wins. Ties within the same 50 ms bucket are broken by need score, then by lottery.
