# Human / Health / Education / Materials Lens: Three Concepts

Prompt: *Design something whose value comes from its temporary nature.*
Lens: healthcare, food systems, transient electronics, and bio-materials with a digital layer, at system scale (hospital networks, pharmacy chains, global cold chains).

Avoided overlaps: move-out marketplace, worry journal, AR campus notes, forgetting-curve notes, expiring chats, composting camera roll, seed-paper tickets, expiring permissions, sunset letters, mycelium furniture, seaweed packaging, dining surplus alerts.

---

## Concept 1: HALF-LIFE Rx

**Pitch:** A prescription that decays like the drug itself. Post-surgical opioid supply shrinks along each patient's own recovery curve, and leftover pills get a refund that drops the longer they stay in the cabinet.

### The problem
After surgery, opioids are prescribed as a fixed, permanent quantity: 30 pills sit in a bathroom cabinet indefinitely. The pain is temporary and the supply is not, and that mismatch feeds the diversion pipeline.

### How impermanence is the value engine
- **The entitlement decays.** The prescription is not "30 tablets". It is a release schedule E(t) that shrinks as the patient's estimated pain need falls. A pharmacy-connected time-lock cap (or staged pharmacy pickups) dispenses against it.
- **The refund decays.** Each unused tablet carries a deposit, for example $2 per pill funded by insurer or hospital savings. It is refunded at a kiosk or by mail-back, and the refund follows a Weibull survival curve. Returning a pill early earns most of the deposit. Holding it for months earns almost nothing.
- **The record expires too.** When the episode closes, the patient-level dispensing log is reduced to a de-identified episode summary, so the patient does not carry an "opioid flag" indefinitely.

**Why it would be worse if permanent:** a permanent supply is the problem itself. 67-92% of surgical patients report unused opioids and only 4-30% dispose of them. 41-53% of people who misuse prescription opioids get them from friends or relatives. A fixed refund gives no reason to return pills soon, and the first weeks are when diversion risk is highest.

### Core math
1. **One-compartment oral pharmacokinetics (Bateman equation):** plasma concentration after a dose D:
   `C(t) = (F·D·k_a) / (V·(k_a − k_e)) · (e^{−k_e t} − e^{−k_a t})`
   Multiple doses are superposed: `C_total(t) = Σ_i C(t − t_i)·H(t − t_i)`. The demo shows the patient's concentration against a therapeutic window [C_min, C_max] and flags stacked doses.
2. **Kalman filter on latent pain need.** State `x_t` = true analgesic need, modelled with exponential recovery: `x_{t+1} = a·x_t + w`, where `a = e^{−1/τ_recovery}`. Observations are the daily pain score (NRS 0-10) and doses taken: `z_t = H·x_t + v`. The filter runs the standard predict/update cycle, `K = P H^T (H P H^T + R)^{-1}`. The entitlement is then `E(t) = ceil( Σ_{s=t}^{t+3} x̂_s / dose_size + safety_margin·sqrt(P_t) )`, a 3-day rolling horizon that widens automatically when uncertainty P is high.
3. **CUSUM change detection** on the innovations `z_t − H x̂_t`. It detects when a patient's pain is not falling as expected (a possible complication) and escalates to a clinician instead of tapering. This is the safety valve.
4. **Weibull-decaying refund:** `R(t) = R_0 · exp(−(t/λ)^k)` with k > 1 (for example λ = 21 days, k = 2), so early returns stay near full value and there is a steep cliff after about 3 weeks.
5. **Population layer (survival analysis):** a Kaplan-Meier estimate of "time to last tablet needed" by procedure type sets each cohort's prior τ_recovery. It is re-fit monthly with Cox regression on age and procedure.

### Browser demo (single page; Canvas plus SVG)
1. **Pick a surgery** (knee replacement, C-section, wisdom teeth, appendectomy). This loads Kaplan-Meier priors and shows the default "30 pills" bottle next to the HALF-LIFE bottle.
2. **Live PK curve:** click "take a dose" and watch the Bateman curve rise and fall inside the therapeutic band. Taking doses too close together turns the band red.
3. **Pain slider (daily NRS):** the Kalman estimate and its uncertainty ribbon update, and the entitlement bar shrinks or grows.
4. **Time-scrub slider:** drag across 0-30 days. The animated pill bottle visibly empties and "evaporates" its unreleased capacity.
5. **Complication toggle:** inject a pain plateau. The CUSUM alarm fires, tapering pauses, and a "clinician paged" card appears.
6. **Refund decay meter:** a Weibull curve with a draggable "return now" marker that shows dollars back.
7. **Cabinet view:** a population heatmap of 10,000 simulated patients that compares leftover tablets in the community under the fixed and decaying regimes.
8. **Episode close:** the record is reduced to a de-identified summary row (an animation of fields dissolving).
9. **Audience QR moment:** the audience scans, rates a fictional "Day 4 pain" on their phone, and their votes become the Kalman observations driving the projected entitlement live. The room is the patient.

### Data model (Postgres)
- `patients(id, age_band, risk_score, created_at)`
- `procedures(id, code, name, km_prior_tau_days, km_prior_k)`
- `episodes(id, patient_id, procedure_id, surgery_at, status ENUM(active,escalated,closed), closed_at, purge_after)`
- `pk_params(drug_code, F, ka, ke, V_per_kg, dose_mg)`
- `dose_events(id, episode_id, taken_at, dose_mg, source ENUM(cap,manual))`
- `pain_reports(id, episode_id, reported_at, nrs SMALLINT)`
- `kalman_state(episode_id, t, x_hat, P, innovation, cusum_pos, cusum_neg)`
- `entitlements(episode_id, valid_from, valid_to, tablets_released)`
- `returns(id, episode_id, returned_at, tablets, refund_cents, kiosk_id)`
- `kiosks(id, geo POINT, operator)`
- `episode_summaries(id, procedure_id, age_band, total_mg, days_to_last_dose, tablets_returned)`, the de-identified, permanent residue
- A purge job runs `DELETE ... WHERE purge_after < now()` on raw rows and a nightly Cox refit.

### Evidence
- 67-92% of surgical patients reported unused opioids, 42-71% of all tablets obtained went unused, and only 4-30% disposed of them (Bicket et al., JAMA Surgery 2017): https://hub.jhu.edu/2017/08/02/most-prescription-opioids-unused/ and https://psnet.ahrq.gov/issue/prescription-opioid-analgesics-commonly-unused-after-surgery-systematic-review
- 73-77% of patients did not store opioids in locked containers (same review): https://www.sciencedaily.com/releases/2017/08/170802110541.htm
- 40.8% of adults who misused prescription opioids got them free from friends or relatives (NSDUH 2015 analysis): https://pmc.ncbi.nlm.nih.gov/articles/PMC6830740 , and about 53% obtained misused pain relievers from a friend or relative (NSDUH 2017 summary): https://www.legitscript.com/blog/2018/09/nsduh-report-opioid-abuse/

### Future simulation
- **Hour 0:** the patient leaves day surgery with a 3-day release, a smart cap, and a QR code for pain check-ins. The deposit is shown on the receipt.
- **Day 1:** the first pain reports tighten the Kalman uncertainty, the entitlement is re-issued, and the patient sees the projected taper.
- **Month 1:** the episode closes. On average 60% fewer tablets are left in the home, returned tablets are logged, and the raw record is purged after 30 days.
- **Year 1:** a regional health system pilots it across about 20,000 surgeries. Kaplan-Meier priors per procedure become a public "honest prescribing" table. The insurer funds deposits from reduced overdose and ER costs.
- **Year 5:** state PDMPs accept "decaying prescriptions" as a prescription type. Pharmacies treat return kiosks like bottle-deposit machines, and community leftover supply has measurably fallen.
- **Failure future:** under-treatment. Patients in real pain get throttled by the algorithm, and poorer patients feel coerced by the refund ("selling" their pain relief). **Mitigation:** the CUSUM plateau detector always loosens supply and never tightens it in an alarm. A one-tap "I need more" button is guaranteed within 2 hours by a human clinician. The refund is capped and credited as a pharmacy or health credit, not cash. An equity audit compares taper speed by demographic monthly.

### Self-score (1-10)
| Parameter | Score |
|---|---|
| Prompt fit | 9 |
| Originality | 8 |
| Emotional resonance | 8 |
| Problem severity | 10 |
| Evidence base | 9 |
| User clarity | 8 |
| Live demo-ability | 8 |
| Visual wow | 7 |
| Build feasibility | 8 |
| Algorithmic/math depth | 9 |
| Database fit | 9 |
| Sustainability | 6 |
| Social impact | 10 |
| Scalability | 8 |
| Business model | 7 |
| Ethical safety | 7 |
| Story arc | 9 |
| Interaction novelty | 7 |
| Differentiation | 8 |
| Judge memorability | 8 |
| **Total** | **163 / 200** |

---

## Concept 2: LIVING DATE

**Pitch:** Kill the printed expiry date. Every perishable carries a label that ages with the food: an Arrhenius-kinetic color ink plus a digital twin. Each item's remaining life is honest and fluid, and the chain routes it to whoever can eat it before it ends.

### The problem
Printed dates are permanent guesses. They are deliberately conservative and blind to how the item was actually stored. A yogurt kept at 2 °C and one left on a 25 °C loading dock carry the same date. Consumers treat the static number as law.

### How impermanence is the value engine
- The label's meaning is meant to expire and change. It is a living countdown driven by the item's own thermal history: a printed time-temperature-indicator (TTI) ink whose color shift follows the same kinetics as spoilage. Scanning the label reads its color through the phone camera and syncs with the pallet's logged sensor data.
- Value is created in the final days of an item's life. The system knows each item's true remaining life, so it automatically marks down, re-routes (store → food bank → animal feed → compost) and alerts the household before the end, not after.
- **Why it would be worse if permanent:** a fixed date is either too early (good food binned; about 3 billion lb a year in the US from label confusion alone) or too late (a safety risk after cold-chain abuse). Only a label that changes over time can carry the truth.

### Core math
1. **Arrhenius rate law:** `k(T) = k_ref · exp( −(E_a/R) · (1/T − 1/T_ref) )`. E_a depends on the product (for example about 80 kJ/mol for dairy spoilage, about 100 kJ/mol for fresh fish).
2. **Quality-loss kinetics under a variable temperature history:** first order, `ln(Q(t)/Q_0) = −∫_0^t k(T(τ)) dτ`. Remaining life is `t_rem = (ln(Q(t)/Q_limit)) / k(T_expected)`. The "effective temperature" T_eff collapses a noisy history into one number.
3. **Microbial growth (Baranyi-Roberts model)** for safety-critical items, with a µ_max(T) square-root (Ratkowsky) model: `sqrt(µ_max) = b·(T − T_min)`. The safety limit is the minimum of the quality limit and the microbial limit.
4. **TTI ink calibration:** the ink's color reaction is chosen with E_a,ink ≈ E_a,food, so CIELAB hue maps directly to accumulated `∫k dt`. The phone reads hue, then inverts it to remaining life.
5. **Markdown and routing:** per store, a dynamic-programming markdown solves `V_t(n) = max_p [ p·D(p, t_rem) + V_{t+1}(n − D) ]`. Across a city, surplus near its end is sent through **min-cost flow** (a network-simplex algorithm) from stores to food banks with capacity and time-window constraints, with edge cost = transport + expected spoilage during transit.

### Browser demo
1. **Two identical yogurts** on screen. Drag one through a "cold-chain journey": a temperature-trace editor where you draw the curve with the mouse.
2. **Live Arrhenius integration:** the labels change color in real time (CIELAB interpolation), and remaining-life counters diverge.
3. **Printed-date ghost:** the old static date is overlaid and shows when it is wrong in either direction (wasted-good or unsafe-but-in-date).
4. **E_a explorer:** switch product (milk, salmon, spinach, chicken) and watch the sensitivity change.
5. **Store view:** 200 simulated SKUs as a treemap that shifts from green to red over time. The DP markdown prices appear automatically.
6. **City flow map:** an SVG network of stores and food banks. Hit "route" and the min-cost flow animates particles of food to food banks before expiry.
7. **Household fridge:** scanning (simulated) adds items, and an "eat-first" ranking sorts by t_rem.
8. **Impact counter:** kg saved and CO₂e avoided versus the static-date counterfactual over a simulated month.
9. **Audience QR moment:** each phone becomes a carton. Phone temperature cannot be read, so the audience shakes, holds, or taps "left in a hot car". Each person's carton ages on the big screen, and the room's cartons are routed live by the min-cost flow.

### Data model (Postgres plus TimescaleDB-style hypertable)
- `products(id, sku, category, Ea_j_mol, k_ref, T_ref_k, Q_limit, microbial_model JSONB)`
- `lots(id, product_id, packed_at, initial_quality, ink_batch_id)`
- `items(id, lot_id, label_uid, status ENUM(shelf,sold,donated,composted,eaten,wasted))`
- `temp_readings(lot_id, ts, temp_c)` (hypertable)
- `quality_state(item_id, ts, integral_k, q_est, t_rem_hours, source ENUM(sensor,ink_scan))`
- `ink_scans(id, item_id, ts, L, a, b, inferred_integral_k)`
- `stores(id, geo, type ENUM(retail,foodbank,feed,compost), capacity_kg)`
- `markdowns(item_id, ts, price_cents)`
- `routes(id, solved_at, from_store, to_store, kg, cost, eta)`
- `outcomes(item_id, final_status, kg, counterfactual_static_status)`

### Evidence
- In 2022, 1.05 billion tonnes of food (19%) were wasted, with households responsible for 631 Mt (UNEP Food Waste Index 2024): https://sdg.iisd.org/news/one-fifth-of-all-food-wasted-while-783-million-go-hungry-unep-report/
- Date-label confusion drives about 3 billion lb ($7B) of US consumer food waste a year, and 43% of consumers always or usually discard food near or past the label date (ReFED 2025): https://refed.org/articles/how-confusing-date-food-labels-are-hitting-your-wallet-five-things-to-know-about-food-date-labels-consumer-behavior-and-policy/
- Wageningen trial of the Keep-it dynamic indicator (about 1,500 HelloFresh customers): willingness to eat past the printed date rose from 2% to 20% when the indicator showed 2 days left: https://www.packaginginsights.com/news/on-pack-freshness-indicator-cuts-food-waste-and-is-trusted-by-dutch-consumers-wur-study-finds.html
- Policy tailwind: California date-label reform takes effect July 2026 (same ReFED article).

### Future simulation
- **Hour 0:** a dairy co-op prints TTI ink on one SKU, and pallet loggers stream temperatures.
- **Day 1:** the first loading-dock heat event. Pallet B's labels shift faster, and the store routes it to the front-of-store markdown while pallet A keeps full life.
- **Month 1:** a pilot chain of 10 stores reports fewer write-offs on that SKU, food banks receive scheduled flows instead of random dumps, and shoppers learn to "read the color".
- **Year 1:** the system expands to fresh fish and meat, where safety value is highest. Insurers and regulators accept ink-plus-twin as evidence of cold-chain compliance.
- **Year 5:** static "best before" dates are legally optional in pilot jurisdictions. The ink becomes a commodity, and the routing network is the business.
- **Failure future:** a counterfeit or mis-calibrated ink batch shows "fresh" on spoiled chicken, causing a food-poisoning event and a collapse of trust. **Mitigation:** a hard microbial upper bound that no ink reading can extend, and a "use-by" safety date that can only move earlier, never later. Ink batch QA is enforced through `ink_batch_id` sampling, and consumer scans that disagree with sensor twins are flagged automatically.

### Self-score (1-10)
| Parameter | Score |
|---|---|
| Prompt fit | 8 |
| Originality | 7 |
| Emotional resonance | 6 |
| Problem severity | 9 |
| Evidence base | 9 |
| User clarity | 9 |
| Live demo-ability | 9 |
| Visual wow | 8 |
| Build feasibility | 9 |
| Algorithmic/math depth | 9 |
| Database fit | 9 |
| Sustainability | 10 |
| Social impact | 8 |
| Scalability | 10 |
| Business model | 9 |
| Ethical safety | 9 |
| Story arc | 7 |
| Interaction novelty | 7 |
| Differentiation | 7 |
| Judge memorability | 7 |
| **Total** | **166 / 200** |

---

## Concept 3: VANISH WARD

**Pitch:** A hospital-at-home program built on implants that dissolve. Post-op sensors watch the wound from inside, then dissolve on schedule, and the patient's raw data is deleted on the same dissolution curve. Monitoring ends when healing ends, and so does the surveillance.

### The problem
Post-surgical complications such as surgical-site infection (SSI) appear after discharge, when no one is watching. Today's options are permanent or semi-permanent: wires and drains that must be removed (with their own infection risk), wearables patients abandon, and data that lives on vendor servers indefinitely.

### How impermanence is the value engine
- **Physical transience:** bioresorbable sensors (Mg conductors, Si nanomembranes, PLGA or silk encapsulation) sit at the surgical site and report temperature, pH, and impedance (signs of infection) over NFC or BLE through a bandage relay. The device is engineered to last exactly the high-risk window (about 14-30 days) and then dissolve, so no second surgery or removal visit is needed.
- **Informational transience ("data dissolution"):** each patient's raw data has a TTL tied to the sensor's own physical-dissolution model. As the device fades, raw data is deleted. Only differentially private aggregates remain to improve the hospital's risk models.
- **Why it would be worse if permanent:** a permanent implant needs removal surgery (cost, anesthesia, infection risk) or remains as foreign material. Temporary pacing wires carry infection and dislodgement risk. Permanent data becomes a lifelong health-surveillance liability. The value lies in a window that closes on its own.

### Core math
1. **Reactive-diffusion dissolution of the Mg trace** (as in the Rogers group's transient-electronics models). Hydrolysis is `Mg + 2H₂O → Mg(OH)₂ + H₂`. Water diffuses into the encapsulant and reacts: `∂w/∂t = D ∂²w/∂x² − k·w`. This gives a thickness decay `h(t) ≈ h_0 − (k·w_0·M/ρ) · sqrt(D/k) · tanh(sqrt(k/D)·h_0) · t`, roughly linear after a lag set by the encapsulation. Encapsulation thickness is the design knob that sets functional lifetime t_f.
   Encapsulant degradation is temperature dependent (Arrhenius), so fever accelerates it. The model accounts for this.
2. **Kalman filter with degrading sensor noise:** state = [core-wound temperature, pH, impedance]. The measurement noise covariance grows as the conductor thins: `R(t) = R_0 · (h_0 / h(t))²`. The filter therefore automatically trusts the fading sensor less. It hands off to skin-surface wearables and patient check-ins as the implant dies, giving a smooth "fade-out" of confidence.
3. **Survival analysis for SSI risk:** a Cox proportional-hazards model `h(t|x) = h_0(t)·exp(βᵀx)`. Covariates include the Kalman-filtered signals (time-varying). The baseline hazard is a Weibull `h_0(t) = (k/λ)(t/λ)^{k−1}` peaking around days 5-10, and the alert threshold is on the cumulative hazard.
4. **Optimal device lifetime:** choose the encapsulation so that `P(SSI occurs after t_f) < 1%`, i.e. `t_f = λ·(−ln 0.01)^{1/k}` in the conditional form, which balances biomaterial load against coverage.
5. **Data dissolution with differential privacy:** at dissolution, raw series are deleted. Before deletion, an aggregate update to the hospital's hazard model is released with Gaussian noise: `β̃ = β̂ + N(0, σ²)` where `σ = Δ·sqrt(2 ln(1.25/δ))/ε`. A per-patient privacy budget ε is spent once and then the patient's record no longer exists.

### Browser demo (WebGL or Canvas)
1. **Implant designer:** a slider for encapsulation thickness (PLGA, µm) and Mg trace thickness. A cross-section animation shows water diffusing in and the trace thinning, with the predicted functional lifetime displayed.
2. **Patient timeline:** a 30-day scrubber. A 3D (or 2.5D) wound shows the glowing implant fading as it dissolves.
3. **Live signals with a Kalman fade:** simulated temperature, pH, and impedance traces. The confidence ribbon visibly widens as R(t) grows, and the handoff to the wearable is highlighted.
4. **Infect the patient:** a button injects an SSI at day 7. Signals drift, the Cox hazard gauge climbs, and an alert fires with a "nurse visit dispatched" card.
5. **Fever accelerates dissolution:** toggle fever and watch the Arrhenius term shorten the device's life, while the system re-plans its handoff.
6. **Data dissolution panel:** the database rows for the patient visibly dissolve in step with the device. A DP aggregate "seed" drops into the hospital model and the ε budget meter is shown.
7. **Ward view:** 50 simulated home patients on a map, with each node fading as its implant dissolves. A count of "removal surgeries avoided" accumulates.
8. **Lifetime optimizer:** a Weibull hazard curve with a draggable t_f that shows coverage % against biomaterial mass.
9. **Audience QR moment:** each audience member's phone becomes an implant. A countdown dissolves their phone screen (pixel-erosion shader) while they report "symptoms" with buttons. The big screen shows the whole ward fading, and at the end every participant's data is visibly deleted ("you were monitored, and now you're forgotten").

### Data model (Postgres)
- `patients(id, mrn_hash, age_band, comorbidities JSONB)`
- `surgeries(id, patient_id, procedure_code, performed_at, wound_class)`
- `devices(id, surgery_id, encap_material, encap_um, mg_um, implanted_at, predicted_tf_hours, status ENUM(active,degrading,dissolved))`
- `device_models(material, D, k, Ea, w0)` (dissolution parameters)
- `readings(device_id, ts, temp_c, ph, impedance_ohm, snr)` with `expires_at` defaulting to predicted dissolution + grace period
- `wearable_readings(patient_id, ts, skin_temp_c, hr)`, which also carries `expires_at`
- `filter_state(patient_id, ts, x_hat JSONB, P JSONB, R_scale)`
- `hazard_scores(patient_id, ts, cum_hazard, alert BOOL)`
- `alerts(id, patient_id, ts, type, resolved_by, resolved_at)`
- `dp_contributions(id, cohort, released_at, epsilon, delta, beta_noisy JSONB)`, the only permanent residue
- `dissolution_log(patient_id, purged_at, rows_deleted)` (proof of deletion, no content)
- Postgres `pg_cron` runs the purge where `expires_at < now()`.

### Evidence
- Northwestern and GWU's fully bioresorbable, leadless, battery-free pacemaker dissolves in 5-7 weeks and avoids temporary pacing wires (which stay 3-7 days and carry infection and dislodgement risk) (Nature Biotechnology 2021): https://news.northwestern.edu/stories/2021/06/first-ever-transient-pacemaker-harmlessly-dissolves-in-body
- Transient Si/Mg/silk electronics with dissolution tuned from days to a year (Hwang et al., Science 337:1640, 2012), and a bioresorbable intracranial pressure and temperature sensor (Nature 2016): https://news.illinois.edu/next-up-environmentally-safe-electronics-that-also-vanish-in-the-body/
- In 498,875 operations, the unplanned 30-day readmission rate was 5.7%, and SSI was the leading cause at 19.5% (up to 36.4% after vascular bypass): https://www.healthexec.com/topics/quality/readmission-rates-following-surgeries-us-hospitals

### Future simulation
- **Hour 0:** a colorectal patient is closed with a 21-day sensor beneath the incision, and a bandage relay pairs to their phone. They go home on day 2 instead of day 4.
- **Day 1:** stable signals and a low hazard. The family sees "watching: 20 days left" and a fading-ring icon.
- **Month 1:** a day-6 pH and impedance drift triggers an early outpatient antibiotic, so no readmission is needed. The sensor dissolves on day 22, raw data is purged, and a DP contribution is logged.
- **Year 1:** a hospital-at-home program runs about 2,000 patients. The hazard model improves using DP aggregates only, and removal procedures avoided are published.
- **Year 5:** "dissolving monitoring" becomes a standard bundle for high-SSI-risk surgeries. The data-dissolution standard influences regulators: a "right to be forgotten by your implant".
- **Failure future:** the device dissolves early (fever, acidic infected tissue accelerates hydrolysis) exactly when monitoring matters most, and data deletion destroys evidence needed in a malpractice dispute. **Mitigation:** the Kalman filter's rising R(t) triggers an early handoff to the wearable and a nurse visit whenever predicted life falls below the hazard peak. Encapsulation is chosen at a 1% tail-coverage margin. Raw data deletion is paused automatically ("legal hold" flag) when an alert or adverse event is open, and the patient can opt to keep their own copy.

### Self-score (1-10)
| Parameter | Score |
|---|---|
| Prompt fit | 10 |
| Originality | 9 |
| Emotional resonance | 8 |
| Problem severity | 8 |
| Evidence base | 8 |
| User clarity | 7 |
| Live demo-ability | 8 |
| Visual wow | 9 |
| Build feasibility | 7 |
| Algorithmic/math depth | 10 |
| Database fit | 8 |
| Sustainability | 8 |
| Social impact | 8 |
| Scalability | 7 |
| Business model | 6 |
| Ethical safety | 8 |
| Story arc | 9 |
| Interaction novelty | 9 |
| Differentiation | 9 |
| Judge memorability | 9 |
| **Total** | **165 / 200** |

---

## Summary

| Concept | Total | Strongest at | Weakest at |
|---|---|---|---|
| HALF-LIFE Rx | 163 | Severity, social impact, story | Sustainability, ethics risk (under-treatment) |
| LIVING DATE | 166 | Scalability, sustainability, feasibility, business | Emotional resonance, originality |
| VANISH WARD | 165 | Prompt fit, math depth, wow, memorability | Business model, build complexity |

**Recommendation:** LIVING DATE is the safest to build and score. VANISH WARD is the most direct reading of the prompt and the most memorable on stage (the physical dissolution plus data dissolution pairing gives a strong closing moment). A hybrid pitch is possible: lead with VANISH WARD's narrative, and borrow LIVING DATE's Arrhenius engine, since both share the same kinetics code.
