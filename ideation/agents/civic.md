# Civic / City / Planetary Lens — 3 Concepts

Prompt: *Design something whose value comes from its temporary nature.*
Lens: infrastructure, public space, climate, disaster response, governance, supply chains. These are city-scale and institution-scale proposals, not personal apps.

Avoided overlaps: move-out marketplace, worry journal, AR campus notes, forgetting-curve notes, expiring chats, composting camera roll, seed-paper tickets, expiring permissions, sunset letters, mycelium furniture, seaweed packaging, dining surplus alerts.

---

## Concept 1 — HALFLIFE: a crisis map where every fact has a decay rate

**Pitch:** During a disaster, old information kills people, so HALFLIFE is a public crisis map where each report fades at the physical rate its hazard changes, and only fresh evidence keeps it on the map.

### The idea
After a flood, earthquake or wildfire, a city's common operating picture is built from 911 calls, social posts, sensors and field teams. Today a report stays on the map at full opacity until someone deletes it, and nobody does. "Road closed" pins outlast the water. "Person trapped on roof" pins stay after the rescue. Responders and residents then route around ghosts, or into hazards that look stale.

In HALFLIFE, a report is a probability, not a pin. Each hazard type has its own half-life: a flooded road maybe 6 h, a downed power line 12 h, a gas leak 2 h, a trapped person 45 min (it must be re-confirmed, or it gets escalated and is never silently dropped), a shelter "beds available" count 30 min. Confidence decays continuously. Corroborating reports refresh it, and contradicting reports ("I just drove through") speed the decay. When a report crosses the floor it does not vanish without trace. It **dissolves** into a "last known" ghost layer and then into an anonymised aggregate.

### Why it would be worse if permanent
- A permanent map piles up false positives. Responders lose trust, then stop using it (alert fatigue).
- Permanent location data on vulnerable people (a disabled person home alone, undocumented families at a shelter) is a surveillance risk after the disaster. Expiry is a privacy guarantee.
- Permanence hides *uncertainty*. Fading makes the age of the evidence visible at a glance.

### Math and algorithms
1. **Per-hazard exponential decay with evidence updates (a log-odds Bayesian filter).**
   Let ℓᵢ(t) = log(pᵢ/(1−pᵢ)) be the log-odds that hazard i still exists. Between observations, it relaxes toward the prior ℓ₀ at rate λ_k = ln2 / T½(k):
   dℓᵢ/dt = −λ_k (ℓᵢ − ℓ₀)  ⇒  ℓᵢ(t) = ℓ₀ + (ℓᵢ(t₀) − ℓ₀) e^{−λ_k (t − t₀)}
   On a new report r with source reliability ρ_r:  ℓᵢ ← ℓᵢ + s_r · log(ρ_r/(1−ρ_r)), with s_r = +1 to confirm and −1 to contradict.
2. **Learned half-lives (a survival model).** T½(k) is fitted from past "cleared" timestamps with a Weibull survival model, S(t) = exp(−(t/η)^β), and conditioned on covariates (rain rate, river gauge slope). The decay rate rises when the river gauge is falling. For floods: λ(t) = λ₀ · exp(γ · max(0, −dh/dt)).
3. **Spatial fusion on an H3 hex grid.** Reports diffuse to neighbouring cells with a reaction-diffusion step: ∂p/∂t = D∇²p − λp + S(x,t), solved by explicit finite differences on the hex adjacency graph.
4. **Decay-aware routing.** The cost of edge e is c_e = len_e · (1 + α·p_e(t + τ_e)), where p_e is the *predicted* hazard probability at the moment you would arrive. That is time-dependent A* with a consistent heuristic.
5. **Re-verification scheduling (optimal stopping / value of information).** Drones and field teams are sent to the reports where expected information gain per minute, H(pᵢ)/travel_time, is highest. Entropy H(p) = −p log p − (1−p) log(1−p) peaks while a report is fading. The fading itself creates the work queue.

### Browser demo (single page, Canvas + SVG, simulated city)
1. A city basemap (procedural or OSM tiles cached as an image) with a hex grid and live fading report glyphs. Opacity = p(t).
2. A **time scrubber** (Hour 0 → 72 h) with ×60 playback. You watch the map "breathe" as the flood wave passes.
3. **Hazard half-life panel**: sliders per hazard type, plus a live plot of the decay curve.
4. A **corroborate / contradict** click on any glyph. It visibly jumps in confidence, with the log-odds math shown in a tooltip.
5. **Route A→B**: a static-map route (it detours around ghosts) versus a HALFLIFE route (shorter and safer), showing minutes saved.
6. **Dispatch queue**: drones auto-assigned to the highest-entropy cells, with lines animated on the map.
7. **Ghost layer toggle**: expired reports shown as faint outlines, so the "last known" trail stays visible.
8. **Privacy meter**: a count of personal records alive now versus a permanent-map baseline (a falling curve).
9. **Trust score**: the simulated precision of "map says hazard" against ground truth, for decay and for permanent pins.
10. **QR audience moment**: judges scan and get a phone page with "I'm at hex X: road clear / flooded". Their reports land on the projector map live and start decaying. If nobody re-confirms, the room watches their own reports fade.

### Data model (Postgres + PostGIS / h3-pg)
- `hazard_types(id, name, half_life_s, prior_logodds, weibull_eta, weibull_beta, never_silent bool)`
- `reports(id, hazard_type_id, h3_cell, geom, created_at, source_id, polarity smallint, raw_text, expires_hard_at)`
- `sources(id, kind [sensor|911|social|team|citizen], reliability float, last_calibrated_at)`
- `cell_state(h3_cell, hazard_type_id, logodds, updated_at)` (materialised, updated by trigger and decay job)
- `ghosts(h3_cell, hazard_type_id, last_seen_at, peak_p)` (PII stripped)
- `dispatch_tasks(id, h3_cell, asset_id, info_gain, status, assigned_at)`
- `assets(id, kind [drone|team], geom, available bool)`
- A `pg_cron` job purges PII columns from `reports` after `expires_hard_at`.

### Evidence
- In Hurricane Harvey, researchers found about 5,200 rescue requests among more than 1M tweets. FEMA missed 46% of them, and its post-disaster analysis listed flooded areas as safe. https://www.securitymagazine.com/articles/89430-federal-authorities-missed-nearly-half-of-social-media-distress-calls-during-harvey
- An inaccurate map tweeted during a 2017 California flood reportedly caused an unnecessary mass evacuation (DHS study, reported in The Conversation). https://theconversation.com/good-communication-is-a-key-part-of-disaster-response-119591
- Helene response reporting: outdated footage fed misinformation, and official information "can quickly become outdated". https://www.prdaily.com/the-scoop-misinformation-hurts-helene-response-efforts/

### Future simulation
- **Hour 0:** A river crests. 300 reports arrive in 40 min. The map is red, and the routing engine already discounts reports by source reliability.
- **Day 1:** Water recedes in the east. Those pins fade on their own as gauges fall. Drones go only to the ~20 high-entropy cells instead of re-checking all 300. Ambulance routes are ~15% shorter than on the static map (simulated).
- **Month 1:** Survival fits on that event's "cleared" timestamps update the flood half-life for this city. PII is gone. Only the aggregate ghost layer remains, and it feeds the insurance and recovery planning maps.
- **Year 1:** Three cities share hazard-type priors (federated half-life parameters). Emergency managers rehearse with HALFLIFE in tabletop exercises.
- **Year 5:** HALFLIFE becomes the "freshness layer" standard on top of national common operating pictures, much as CAP (Common Alerting Protocol) is today. Every civic data feed carries a half-life field.
- **Failure future:** A trapped person's report decays before anyone reaches them, because no one re-confirmed it. **Mitigation:** life-safety types are `never_silent`. Decay moves them *up* the dispatch queue and escalates to a human. They can only be cleared by a positive "resolved" event. Decay never deletes them. A second failure: bad actors flood the map with false "clear" reports. **Mitigation:** contradictions are weighted by source reliability, with rate limits per device and per cell.

### Self-scores (1–10)
| # | Parameter | Score |
|---|---|---|
| 1 | Prompt fit | 9 |
| 2 | Originality | 8 |
| 3 | Emotional resonance | 8 |
| 4 | Problem severity | 10 |
| 5 | Evidence base | 7 |
| 6 | User clarity | 8 |
| 7 | Live demo-ability | 9 |
| 8 | Visual wow | 9 |
| 9 | Build feasibility | 7 |
| 10 | Algorithmic/math depth | 9 |
| 11 | Database fit | 9 |
| 12 | Sustainability | 6 |
| 13 | Social impact | 10 |
| 14 | Scalability | 8 |
| 15 | Business model | 6 |
| 16 | Ethical safety | 8 |
| 17 | Story arc | 9 |
| 18 | Interaction novelty | 8 |
| 19 | Differentiation | 8 |
| 20 | Judge memorability | 9 |
| | **Total** | **165 / 200** |

---

## Concept 2 — TRIAL CITY: streets that expire unless the public renews them

**Pitch:** Every street change is a 90-day experiment that dissolves on its own unless residents and data vote to keep it, turning a city's slowest decisions into its fastest learning loop.

### The idea
Cities spend years arguing about a bike lane, a plaza or a bus lane, then build it in concrete and never revisit it. TRIAL CITY makes every intervention a **lease, not a monument**. It is built from modular, reusable kit (planters, paint, bollards, parklets), carries a public countdown, and **reverts by default**. Renewal needs two keys. (a) The causal effect measured by sensors must clear a threshold. (b) A quadratic-voting renewal round among affected residents must pass. The kit then flows to the next trial site. The city becomes a multi-armed bandit run in public.

### Why it would be worse if permanent
- Permanence raises the stakes, so every proposal becomes a political war (status-quo bias, veto points). Expiry lowers the cost of saying "yes, let's try".
- Without a scheduled reversion, nobody measures. The sunset is what forces evaluation.
- Reusable kit beats poured concrete on embodied carbon. Expiry keeps materials circulating across the city.

### Math and algorithms
1. **Thompson sampling over candidate interventions.** For each (site, design) arm a, keep a posterior over effect θ_a (e.g., the change in cyclists per hour, or in safety incidents). Gaussian posterior: θ_a ~ N(μ_a, σ_a²). Each planning cycle, draw θ̃_a and deploy kit to the arms with the highest θ̃_a − cost_a, subject to a kit inventory constraint (a knapsack).
2. **Causal effect estimation: synthetic control / difference-in-differences.**
   Effect τ̂ = (Ȳ_treated,post − Ȳ_treated,pre) − (Ȳ_control,post − Ȳ_control,pre), with control weights w* = argmin_w ‖X₁ − X₀w‖ s.t. w ≥ 0, Σw = 1 (synthetic control from untreated streets).
3. **Sequential testing for early stop or extension.** Use a mixture sequential probability ratio test (always-valid p-values), so a trial can end early when the effect is clearly negative. Λₙ = ∫ Πᵢ f_θ(xᵢ)/f₀(xᵢ) dπ(θ); stop when Λₙ ≥ 1/α.
4. **Quadratic-voting renewal.** Each affected resident gets B voice credits per trial cycle. Casting v votes costs v² credits, so net support = Σᵢ vᵢ. Unspent credits **expire** at cycle end, which stops hoarding and stops one bloc saving up to dominate later.
5. **Kit logistics: min-cost flow.** Moving planters and bollards from expiring sites to new ones is a transportation problem: min Σ c_ij x_ij s.t. Σ_j x_ij = supply_i, Σ_i x_ij = demand_j, x ≥ 0, solved with network simplex or successive shortest paths.

### Browser demo (SVG city grid)
1. A city grid with active trials showing **countdown rings** that shrink each day.
2. A "propose a trial" drag-and-drop: drop a parklet, bike lane or school street onto a block.
3. Simulated sensor feeds: a live sparkline for each trial, comparing treated and synthetic control.
4. **Posterior viewer**: bandit belief bell curves narrowing over time, plus the Thompson draw animation.
5. **Early-stop alarm**: a trial whose SPRT crosses the boundary flashes and dissolves early.
6. **Renewal day**: the quadratic-voting panel. Show the cost curve v² as you add votes.
7. **Kit flow animation**: arrows from expiring sites to new sites, from the min-cost flow solution, with truck-km and CO₂ saved shown.
8. **City learning curve**: cumulative regret, TRIAL CITY bandit versus "build permanently after a 3-year study".
9. **Time-lapse**: a 5-year playback in which the street network morphs and good patterns spread.
10. **QR audience moment**: judges each get 9 voice credits on their phone and vote quadratically on whether to renew a projected plaza. The plaza on screen either solidifies into a permanent material or dissolves back into asphalt in real time.

### Data model
- `sites(id, geom, street_class, baseline_metrics jsonb)`
- `designs(id, name, kit_bom jsonb, cost)`
- `trials(id, site_id, design_id, starts_at, sunset_at, status [active|renewed|reverted|stopped_early], tau_hat, tau_se)`
- `observations(trial_id, sensor_id, ts, metric, value)` (time series, TimescaleDB hypertable)
- `arms_posterior(site_id, design_id, mu, sigma2, updated_at)`
- `residents(id, h3_cell, verified_at)` / `credit_grants(resident_id, cycle_id, credits, expires_at)`
- `votes(resident_id, trial_id, votes int, cost int generated always as (votes*votes))`
- `kit_items(id, type, location_site_id, condition)` / `kit_moves(id, item_id, from_site, to_site, scheduled_at)`

### Evidence
- Kraus & Koch (PNAS 2021): provisional pop-up bike lanes in 106 European cities (736 counters) raised cycling 11–48%, with an estimated $1–7B/yr in health benefits if the habit sticks. https://www.pik-potsdam.de/@@multilingual-selector/0bd5e1fd4670477db683eae4f6aefbb4/en
- The OECD Government at a Glance 2023 found that 21 of 38 OECD countries do not assess whether regulations achieve their objectives in ex post evaluation, which is the gap that forced sunsets close. https://www.oecd.org/en/publications/government-at-a-glance-2023_3d5c5d31-en/full-report/component-27
- Sunset laws alone have a mixed record. They reduce regulatory volume (Sobel & Dove, Mercatus), but "having a sunset clause on the books is not enough" (J. Regulatory Economics 2025). TRIAL CITY's answer is to tie the sunset to measured causal effect and real renewal votes. https://ciceroinstitute.org/blog/new-research-do-sunset-laws-actually-work-the-evidence-is-in/

### Future simulation
- **Hour 0:** The council passes a "default-revert" ordinance. The first 10 trials go live with countdown signage and QR codes on the planters.
- **Day 1:** Sensors stream data. Residents scan the planters to see the live effect, and the first comments and votes arrive.
- **Month 1:** One trial is stopped early (an SPRT showed it raised rat-running). Two are trending toward renewal. Kit from the stopped trial moves overnight to a school street.
- **Year 1:** 60 trials run, 18 are made permanent, and kit is reused 3.4× on average. Time from idea to street drops from ~3 years to ~6 weeks.
- **Year 5:** A shared, open "trial registry" across cities, with priors that transfer (a school street works in city A, so city B starts with a stronger prior). The streetscape becomes a living, versioned document.
- **Failure future:** Trials become a stalling tactic ("we'll trial it forever"), or affluent blocks out-vote others. **Mitigation:** a hard cap of 2 renewals before a mandatory permanent-or-remove decision. Credits are weighted to the affected radius, with equity floors per neighbourhood. Bandit priors include an equity term that guarantees exploration in under-served areas.

### Self-scores (1–10)
| # | Parameter | Score |
|---|---|---|
| 1 | Prompt fit | 9 |
| 2 | Originality | 8 |
| 3 | Emotional resonance | 7 |
| 4 | Problem severity | 7 |
| 5 | Evidence base | 8 |
| 6 | User clarity | 8 |
| 7 | Live demo-ability | 8 |
| 8 | Visual wow | 8 |
| 9 | Build feasibility | 7 |
| 10 | Algorithmic/math depth | 10 |
| 11 | Database fit | 9 |
| 12 | Sustainability | 8 |
| 13 | Social impact | 8 |
| 14 | Scalability | 8 |
| 15 | Business model | 7 |
| 16 | Ethical safety | 7 |
| 17 | Story arc | 8 |
| 18 | Interaction novelty | 9 |
| 19 | Differentiation | 9 |
| 20 | Judge memorability | 8 |
| | **Total** | **161 / 200** |

---

## Concept 3 — EBB: disaster-recovery money that melts if it sits still

**Pitch:** After a disaster, EBB pays relief in a local digital currency that loses value each week it isn't spent, so aid circulates through the town's shops and builders instead of draining away or sitting idle.

### The idea
Post-disaster cash aid often leaks. It is saved (rationally, out of fear), spent at national chains or online, or arrives after local businesses have already closed. A town's recovery depends on **velocity and locality**: the same dollar going from resident to hardware store to local contractor to café. EBB issues relief as a municipal, redeemable-at-par token with **demurrage**: it loses a small percentage per week while idle (Gesell / Wörgl stamp scrip, rebuilt with modern math). It is spendable only at registered local merchants. Merchants can pass it on to local suppliers or wages, or redeem it for national currency at a small fee that decreases with how *local* their own spending is. Demurrage revenue goes into a public rebuilding fund, so nothing is "lost". When the recovery window closes (say 18 months), the currency **retires on its own**. The whole system is meant to disappear.

### Why it would be worse if permanent
- The value is in creating urgency and circulation *during a narrow recovery window*, when the local economic network is most fragile. A permanent local currency adds friction, fragments markets and becomes a political football.
- Without the melt, relief recreates the hoarding that deepens downturns, the classic paradox of thrift.
- Automatic retirement keeps it a recovery tool, with a clear exit and no shadow monetary system.

### Math and algorithms
1. **Demurrage ODE.** A wallet balance between transactions follows dB/dt = −δ(t) B, so B(t) = B₀ e^{−∫δ}. δ(t) is a policy dial that rises when measured velocity falls below target (a PI controller):
   δ(t) = δ₀ + K_p (V* − V(t)) + K_i ∫(V* − V) dt, clipped to [0, δ_max].
2. **Local multiplier as an absorbing Markov chain.** Treat the economy as a graph of node types (households, local retail, local trades, wages, leakage = national chains/savings/redemption). With transient-to-transient matrix Q and transient-to-absorbing matrix R, the fundamental matrix N = (I − Q)⁻¹ gives the expected number of local hops per dollar. Local multiplier M = 1ᵀN e_household. EBB raises M by lowering the leakage probabilities (via locality rules and demurrage pressure).
3. **Quantity theory, locally.** MV = PQ. With money stock M fixed, local nominal activity scales with velocity V, which demurrage directly targets.
4. **Mechanism design for the redemption fee.** Merchant j's redemption fee f_j = f₀ · (1 − L_j), where L_j is the share of j's EBB outflows going to other local nodes over the last 30 days (computed from the transaction graph). This is incentive-compatible against "redeem immediately" free-riding.
5. **Fraud and circular-trade detection.** Find short cycles and wash trading with Tarjan strongly-connected components plus a PageRank-style anomaly score on the transaction graph, since circular trades fake velocity.
6. **Retirement schedule.** A smooth sunset: δ rises along a logistic curve near the end date, δ_end(t) = δ_max / (1 + e^{−k(t − t_end)}), while redemption becomes fee-free, so the stock goes to 0 with no cliff.

### Browser demo (Canvas force-graph of a town economy)
1. **Town graph**: ~200 nodes (households, shops, trades, the city fund, "leakage" sinks), with particles (coins) flowing along edges.
2. **Two-world split screen**: the same aid amount as plain cash versus EBB. You watch cash pile up in savings and drain to national chains, while EBB keeps looping.
3. **Demurrage dial**: δ from 0% to 5%/week. Velocity, multiplier and fund size update live.
4. **Live multiplier readout**: N = (I − Q)⁻¹ recomputed every frame, with the "1 EBB → 3.1 of local activity" counter.
5. **Wallet melt view**: click any household to see its balance curve decaying and the "spend before Friday" nudge.
6. **Merchant locality score** and its fee, with a leaderboard of the most local businesses.
7. **Fraud panel**: inject a wash-trading ring and watch SCC detection flag it.
8. **Rebuild fund**: demurrage proceeds accumulate and fund a visible project (a school roof) that "builds" on screen.
9. **Sunset scrubber**: drag to month 18 and watch the currency retire smoothly to zero.
10. **QR audience moment**: each judge's phone becomes a wallet with 20 EBB that **melts visibly** while they watch. They tap to "spend" at one of the projected local shops. Coins fly into the big-screen town graph, and the room's collective multiplier ticks up.

### Data model
- `wallets(id, owner_type [household|merchant|city], owner_id, balance_numeric, last_settled_at)` (lazy demurrage: the true balance is computed as balance·exp(−∫δ) on read)
- `merchants(id, name, category, h3_cell, verified, locality_score, fee_rate)`
- `transactions(id, from_wallet, to_wallet, amount, ts, kind [grant|purchase|wage|supplier|redeem|demurrage])`
- `policy_params(effective_from, delta, kp, ki, v_target, sunset_at)`
- `velocity_daily(day, money_stock, tx_volume, velocity, multiplier_est)`
- `fund_ledger(id, ts, inflow_demurrage, outflow_project_id, amount)` / `projects(id, name, budget, progress)`
- `fraud_flags(id, scc_id, wallet_ids int[], score, status)`

### Evidence
- NBER (Xing, Zou, Yin, Wang, Li), Alipay coupons in Shaoxing, China. These were *expiring* digital consumption coupons, and they raised weekly spending by about $3 of out-of-pocket spending per $1 of subsidy. https://www.nber.org/papers/w27596.pdf
- Caixin reported a Nanjing study (1 yuan of vouchers → 2.9 yuan of spending) and city claims of up to 10× (Hangzhou), which shows both that the effect is real and that rigorous measurement matters. https://www.caixinglobal.com/2020-05-20/in-depth-who-really-benefits-from-consumption-vouchers-101556620.html
- Wörgl, Austria (1932–33): stamp scrip with 1%/month demurrage. A ~5,500-unit stock reportedly circulated 415 times in 13.5 months (advocacy sources; contested, see the Mises critique). https://tronda.folk.ntnu.no/articles/worgl-money.pdf and https://mises.org/library/free-money-miracle

### Future simulation
- **Hour 0:** A tornado hits a town of 40k. The state loads $10M of EBB into verified household wallets within 48 h, and 600 local merchants onboard via QR.
- **Day 1:** Demurrage is 2%/week. Hardware stores and grocers see immediate flow, and contractors start accepting EBB for deposits.
- **Month 1:** Measured velocity is 4× that of the cash control group. The PI controller lowers δ as velocity overshoots. The demurrage fund passes $250k and is earmarked for the community centre roof.
- **Year 1:** The local multiplier is estimated at ~2.5–3× against ~1.4× for cash. Business survival is tracked against a matched county. The sunset curve begins.
- **Year 5:** EBB is a FEMA- or state-approved "recovery rail". It is pre-built, dormant, and activated per disaster, then retired. Each deployment improves the Q-matrix priors for the next.
- **Failure future:** Demurrage punishes the vulnerable (elderly or offline residents who can't spend fast), or merchants raise prices (local inflation). **Mitigation:** a demurrage-exempt floor for every wallet (the first $300 never melts), card and paper options, carer delegation, and price monitoring with merchant de-listing for gouging. The city absorbs the redemption risk at par, so EBB is never worth less than cash when it is spent.

### Self-scores (1–10)
| # | Parameter | Score |
|---|---|---|
| 1 | Prompt fit | 9 |
| 2 | Originality | 7 |
| 3 | Emotional resonance | 7 |
| 4 | Problem severity | 8 |
| 5 | Evidence base | 8 |
| 6 | User clarity | 7 |
| 7 | Live demo-ability | 9 |
| 8 | Visual wow | 8 |
| 9 | Build feasibility | 8 |
| 10 | Algorithmic/math depth | 9 |
| 11 | Database fit | 10 |
| 12 | Sustainability | 7 |
| 13 | Social impact | 9 |
| 14 | Scalability | 8 |
| 15 | Business model | 8 |
| 16 | Ethical safety | 6 |
| 17 | Story arc | 8 |
| 18 | Interaction novelty | 9 |
| 19 | Differentiation | 8 |
| 20 | Judge memorability | 9 |
| | **Total** | **162 / 200** |

---

## Summary
| Concept | Total |
|---|---|
| HALFLIFE (decaying crisis map) | 165 |
| EBB (melting recovery currency) | 162 |
| TRIAL CITY (expiring streets) | 161 |

Recommendation from this lens: **HALFLIFE** has the strongest mix of severity, visual demo and math. **EBB** has the most striking audience moment (your phone wallet melting in your hand). The two could combine into a "disaster recovery suite" story: information that decays, plus money that decays.
