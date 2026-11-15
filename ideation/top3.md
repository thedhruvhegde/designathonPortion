# Top 3: what you'd actually code

The scores are close (ranks 1–7 sit within about 1 point of each other). See `scorecard.md`. Full write-ups are in `agents/civic.md`, `agents/digital.md` and `futures.md`.

## 1 · EBB: relief money that melts (civic) · 81.2
After a disaster, aid is paid in a local currency that loses value each week it sits unspent, so it moves through local shops instead of sitting idle. The first $300 never melts.
**Features to code**
1. Demurrage wallet: a live balance that melts by dB/dt = −δB, with a protected floor.
2. Town flow graph: merchants as nodes, every payment animated as a particle along an edge (Canvas).
3. Velocity controller: a PI loop that tunes δ to hit a target spending velocity, shown live on a chart.
4. Local multiplier: absorbing Markov chain N = (I−Q)⁻¹, recomputed from the transactions table.
5. Fraud rings: Tarjan SCC highlights wash-trading cycles in red-free cobalt hatching.
6. Merchant fee curve: a lower redemption fee the more of the money is re-spent locally.
7. Sunset: a logistic retirement of the whole currency. Scrub to week 26 and watch it go.
8. **QR moment:** every judge gets a $20 phone wallet that melts while they spend it into the projected town.
9. Cash vs EBB counterfactual, side by side.

## 2 · Half-Life Reach: radioactive virality (digital) · 81.1
"Speech is permanent; reach is radioactive." Unverified posts lose amplification on a half-life. Fast spread shortens it, and diverse independent corroboration lengthens it.
**Features to code**
1. Hawkes cascade simulator on a network of about 2,000 nodes: λ(t) = μ + Σα·e^{−β(t−tᵢ)}.
2. Branching-ratio gauge n_eff = n·2^{−t/T½}, with the critical line at 1.
3. A T½ dial driven by velocity and attester entropy H.
4. Echo-chamber detector: community clusters plus Shannon entropy, so ten attestations from one bubble add almost nothing.
5. Time-decayed personalized PageRank for attester weight, plus an "inject bot farm" button.
6. Feed A/B: today's ranking vs half-life ranking, side by side.
7. LLM claim clustering via Groq (already connected) to merge duplicate rumours.
8. **QR moment:** phones become nodes and reshare a rumour. The presenter flips the protocol on and the cascade dies.

## 3 · Melt: the move-out market where prices melt (campus) · 81.0
Listings melt toward $0. At $0 an item becomes a free claim, and if nobody claims it, a donation pickup. Nothing ends in the dumpster.
**Features to code**
1. Per-listing melt curves (logistic or exponential), live.
2. Demand-adaptive melt: a Bayesian estimate from watchers slows the melt.
3. Buyer timing hint using optimal stopping (the 1/e rule).
4. Donation truck routing: nearest-neighbour plus 2-opt TSP across dorms on a map.
5. Impact dashboard: lbs diverted and CO₂ (EPA WARM factors) as pixel-stack bars.
6. Photo to category and weight estimate (LLM vision).
7. **QR moment:** judges bid on a live melting auction from their phones.

### Note
EBB and Melt share one "melting value" engine. A strong large-scale story is to pilot Melt on campus and scale the same engine to EBB for disaster relief.
