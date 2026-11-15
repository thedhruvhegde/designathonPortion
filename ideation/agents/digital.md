# Digital / Information / AI-Era Lens: 3 Concepts

Prompt: *design something whose value comes from its temporary nature.*
Lens: protocols, platform layers and standards that billions of people could touch. These are not single apps.

Shared thesis: **the internet's main failure is not forgetting. It keeps everything at full strength forever.** Lies keep their reach forever, cold data keeps full fidelity forever, and dead people keep their logins forever. Each concept below puts a *physics of decay* into one layer of the stack.

| # | Name | Layer | What decays |
|---|------|-------|-------------|
| 1 | **HALF-LIFE** | Social distribution / ranking | Amplification (reach) of unverified and synthetic content |
| 2 | **PATINA** | Storage / cloud | Fidelity of data nobody touches (bits → thumbnails → summary → fossil) |
| 3 | **WAKE** | Identity / digital death | Cryptographic keys to a dead person's digital estate |

---

## Evidence base (shared, real sources)

- False news was **70% more likely to be retweeted** than true news. The study covered ~126,000 cascades fact-checked by 6 organisations, and the gap held after bots were removed. Vosoughi, Roy & Aral, *Science* 359 (2018). https://news.mit.edu/2018/study-twitter-false-news-travels-faster-true-stories-0308 · https://politics.media.mit.edu/papers/Vosoughi_Science.pdf
- About **52% of newly published web articles** were primarily AI-generated as of May 2025 (Graphite, 65k-article sample; AI generation passed human writing in Nov 2024). https://aihub.org/2025/12/31/more-than-half-of-new-articles-on-the-internet-are-being-written-by-ai/
- Data centres used **~415 TWh in 2024 (~1.5% of global electricity)**, a figure projected to more than double to ~945 TWh by 2030. IEA, *Energy and AI* (2025). https://www.iea.org/reports/energy-and-ai/executive-summary
- On average **52% of stored organisational data is "dark"** (value unknown), and another ~33% is redundant, obsolete or trivial. Only ~15% is business-critical. Veritas Global Databerg Report (vendor survey, 2,500 IT pros, 22 countries). https://www.businesswire.com/news/home/20160315005634/en/Veritas-Global-Databerg-Report-Finds-85-Percent · Veritas carbon estimate for dark data: https://veritas.com/news-releases/2020-04-21-veritas-technologies-projects-dark-data-to-waste-up-to-6-4-m-tons-of-carbon-dioxide-this-year
- **38% of webpages that existed in 2013 were gone by 2023**, and 54% of Wikipedia pages cite at least one dead link. The web already decays, but randomly and without meaning. Pew Research (2024). https://www.pewresearch.org/data-labs/2024/05/17/when-online-content-disappears/
- **At least 1.4 billion Facebook users will die before 2100**, and the dead could outnumber the living by about 2070. Öhman & Watson, Oxford Internet Institute, *Big Data & Society* (2019). https://www.eurekalert.org/news-releases/698549 · https://ox.ac.uk/node/1504611
- Google now deletes personal accounts after **2 years of inactivity**. This is a blunt, binary deadline that its users did not design. https://support.google.com/accounts/answer/12418290

---

## Concept 1: HALF-LIFE

**Pitch:** *"Speech is permanent; reach is radioactive." An open ranking protocol where every unverified post's amplification decays with a half-life. Velocity shortens the half-life, and independent corroboration lengthens it, so lies cool down before they catch fire.*

### The idea
Platforms and fediverse servers adopt a **Reach Decay Header** (`Reach-Half-Life: T½; attest=H`), which works like `Cache-Control` for virality. Nothing is deleted or censored. The post stays at its URL forever, and only the platform's *push* (recommendation and reshare boost) decays. Each reshare inherits the parent's remaining reach budget rather than resetting it. To regain reach, a post needs **diverse, independent attestations**: provenance signatures (C2PA), fact-check notes, or corroboration from people in *other* clusters of the social graph. AI-generated content without provenance starts with a shorter T½.

### Why impermanence is the value engine
Under permanent amplification, novelty wins. False news gets a 70% edge per hop, and those edges compound geometrically. A decaying reach budget converts a *supercritical* cascade (branching ratio n > 1, explosive) into a *subcritical* one (n < 1, it fizzles) **unless** truth-signals arrive. The *temporary* nature of reach buys time for verification, so the truth "gets its shoes on". If reach were permanent, the protocol would be just another ranking signal. The decay is what turns a moderation decision into a physical law nobody has to adjudicate post by post.

### Core math
1. **Hawkes self-exciting process** (models cascades):
   λ(t) = μ + Σ_{t_i<t} α · e^{−β(t−t_i)}, branching ratio **n = α/β**. Expected cascade size = 1/(1−n) for n<1 and diverges for n≥1.
2. **Reach half-life modulation**:
   h(t) = 2^{−t / T½}, n_eff(t) = n · h(t)
   **T½ = T₀ · (1 + γ·H_attest) / (1 + v(t)/v\*)**, where v is current share velocity (shares/min) and v\* is a calibration constant.
3. **Attestation diversity = Shannon entropy** over the graph communities (Louvain clusters) that the attesters belong to:
   H_attest = −Σ_k p_k log₂ p_k. Ten attestations from one echo chamber give H≈0 and add almost nothing. Five attestations from five clusters give H≈2.3, and the post cools much more slowly.
4. **Sybil resistance:** an attester's weight is personalised PageRank from a trusted seed set with temporal decay, r = (1−d)·s + d·Mᵀr, and edges are weighted by e^{−λ·age}.
5. **Criticality guarantee:** the protocol picks T₀ so that ∫₀^∞ n·h(t) dt-weighted expected generation size stays below 1 for content with H_attest=0. Unverified cascades are therefore provably subcritical in expectation.

### Browser demo (single page, Canvas force graph, simulated 2,000-node small-world graph)
1. **Twin-world split screen:** the same rumour seeds into "Today's feed" and "Half-Life feed", and the two cascades grow live.
2. **Branching-ratio gauge:** a live n_eff dial turns red above 1 and green below 1, with a big "CRITICAL / COOLING" label.
3. **Half-life slider (T₀)** and **velocity sensitivity slider (v\*)**, which re-run the cascade instantly.
4. **Attest button:** add attestations from chosen clusters. An entropy meter shows why diverse beats numerous.
5. **Sybil attack mode:** spawn 200 bot attesters in one cluster. H barely moves, and the PageRank weight stays near 0.
6. **LLM "Reach Label"** (Groq or OpenRouter): paste any claim to get a provenance and novelty estimate and a suggested starting T½, shown as a nutrition-label card.
7. **Truth-vs-lie race:** a true correction seeded 10 min later. Today's world never catches up, while the Half-Life world lets the correction overtake.
8. **Glow and decay visuals:** each node's glow halves every T½. The "radioactive" palette fades from amber to grey.
9. **QR audience moment:** the audience scans and *becomes nodes*. Each phone gets a rumour card with "Reshare" and "Check" buttons. Reshares show up live on the big screen as edges, and the gauge shows the room's own n_eff. Then the presenter flips on Half-Life, and the room's cascade visibly dies out.

### Data model (Postgres)
- `posts(id, author_id, created_at, provenance_c2pa bool, ai_likelihood float, t_half_base interval)`
- `reshares(id, post_id, parent_reshare_id, user_id, created_at, reach_budget_at_share float)`
- `attestations(id, post_id, attester_id, kind enum[factcheck,source,witness,c2pa], cluster_id, weight float, created_at)`
- `users(id, cluster_id, trust_rank float, trust_rank_updated_at)`
- `clusters(id, label, size)`, rebuilt nightly by Louvain
- `reach_state(post_id pk, n_eff float, h_attest float, velocity float, t_half_current interval, computed_at)`, a materialised view refreshed per minute
- `audience_sessions(id, room_code, phone_hash, node_id, joined_at)` for the demo

### Future simulation
- **Hour 0:** a deepfake clip of a politician drops. Velocity spikes, and T½ shrinks from 6 h to 40 min. The reach gauge reads n_eff 1.8 and falling.
- **Day 1:** the clip is still at its URL and linkable, but push reach has fallen ~97%. Two fact-checks from different clusters land. The *correction* post carries high H_attest and a long T½, so it outlives the lie in feeds.
- **Month 1:** two mid-size Mastodon instances and one news aggregator ship the header. Researchers measure median false-cascade size down ~60% in a pilot (target metric).
- **Year 1:** the W3C community group drafts `Reach-Half-Life`. EU DSA "systemic risk" audits cite decay metrics as a mitigation. Creators learn that evergreen value comes from attestations, not outrage.
- **Year 5:** "reach is radioactive" is a norm. AI slop farms lose their economics because content with no provenance starts with a short half-life and must earn diverse human attestations, which cannot be farmed.
- **Failure future:** governments capture the attester seed set, and "attestation" becomes state approval. Dissidents' true posts decay while propaganda is pre-attested.
  **Mitigation:** seed sets are plural and user-selectable (pick your own trust roots, like Bluesky labelers). The decay curve is public and auditable. Decay applies *symmetrically* to all unattested content regardless of topic. A mandatory "unboosted chronological" view keeps speech reachable by followers. Entropy weighting also penalises any single attester bloc, a state included.

---

## Concept 2: PATINA

**Pitch:** *"Data should age like copper, not like milk." A storage-layer standard where untouched files gracefully lose fidelity, falling from originals to previews to an AI summary to a one-line fossil, and the carbon saved is shown as a living patina.*

### The idea
Today storage is binary: keep forever at full resolution, or delete. Patina adds a **fidelity ladder** to object storage (an S3-compatible lifecycle extension, `x-patina-halflife`). Every object has a *vitality* score that decays with time and is restored by genuine access. As vitality falls, the object descends tiers. A 40 MB RAW photo becomes a 4 MB JPEG, then a 200 KB thumbnail, then an LLM caption plus embedding, then a fossil (hash, date, one line of text, 1 KB). Each rung down is cheaper, cooler (moves to colder storage), and lower-carbon. Owners can **pin** what matters, but pins are scarce and cost a rising price, which forces them to choose.

### Why impermanence is the value engine
If everything stays at full fidelity, nothing gets curated. The 52% of storage that is dark sits at full resolution, burning power and drowning the 15% that matters. Decay *creates the signal*: what survives at high fidelity is, by construction, what someone returned to. The patina, meaning the visible ageing of an archive, becomes a map of what people valued. A permanent archive would be heavier, more carbon-intensive, *and* less meaningful. The fossil layer keeps the *memory that something existed*, which Pew's random link-rot does not.

### Core math
1. **Vitality ODE with access reinforcement** (a forgetting curve for machines):
   dV/dt = −λ·V + κ·a(t)·(1 − V), V∈[0,1], with a(t) = Σ δ(t − t_access) weighted by access quality (an open counts 1, a background sync counts 0.05).
   Closed form between accesses: V(t) = V₀·e^{−λ(t−t₀)}. Half-life T½ = ln2/λ is set per content class.
2. **Tier thresholds:** tier = k when V ∈ [θ_k, θ_{k−1}) for θ = {0.6, 0.3, 0.1, 0.02}.
3. **Rate–distortion choice of each rung:** for a Gaussian source, D(R) = σ²·2^{−2R}. Patina picks the bitrate R_k that minimises **J = D(R) · V + μ · R · c_carbon**, a Lagrangian trade-off between the value-weighted distortion and the carbon cost of bits.
4. **Planet-scale access counting** with an **exponentially-decayed Count-Min Sketch** (forward decay, Cormode et al.): add w = e^{λ·t_i} to the d hash rows, then estimate the decayed count as min_j C[j, h_j(x)] · e^{−λt}. Error ≤ ε·‖w‖₁ with probability 1−δ for width w=⌈e/ε⌉ and depth d=⌈ln 1/δ⌉. This lets billions of objects carry vitality scores in O(1) memory per shard.
5. **Pin pricing (mechanism design):** the price of the m-th pin = p₀·φ^{m}, a convex scarcity curve that makes pins a costly signal of real value. The carbon fee goes to a verified removal fund.
6. **Carbon ledger:** CO₂e/yr = Σ_objects size_GB · e_GB-yr (kWh) · PUE · CI_grid (gCO₂/kWh), shown as a live counter.

### Browser demo (Canvas grid of ~5,000 simulated files plus real uploaded photos)
1. **Time-lapse scrubber:** drag from Day 0 to Year 10 and watch files oxidise from crisp to blurry, then to captions, then to fossils (a copper-to-verdigris colour shift).
2. **Click-to-revive:** opening a file gives a visible pulse, and vitality jumps by κ(1−V).
3. **Upload your own photo:** it degrades live through real JPEG re-encoding at decreasing quality, and the final rung is an LLM caption generated from it.
4. **Half-life dials per content class** (screenshots 30 d, receipts 7 y, family photos 20 y, logs 3 d).
5. **Carbon and cost meter:** "This archive emits X kg CO₂/yr. With Patina it emits Y." A live tree and flight equivalent.
6. **Pin budget:** five pins with rising cost. The demo forces a choice of which memories to protect.
7. **Count-Min Sketch visualiser:** a heat-map of the d×w counter grid updating, plus the error-bound readout.
8. **Fossil record view:** the archive as geological strata, where you can read what existed even after it is gone.
9. **QR audience moment:** everyone uploads one photo from their camera roll into a shared "room archive" wall. In 3 minutes of accelerated time, photos nobody taps fade. The audience taps to keep favourites alive, so the wall becomes a live vote on what the room values, and the final surviving set is revealed.

### Data model (Postgres)
- `objects(id, owner_id, content_class, size_bytes, sha256, created_at, current_tier smallint, vitality float, vitality_updated_at)`
- `tiers(object_id, tier, storage_url, size_bytes, codec, quality, created_at)`, which keeps each rung's lineage
- `access_events(id, object_id, user_id, kind enum[open,share,sync], weight float, at)`, partitioned by month and rolled into a sketch
- `fossils(object_id pk, caption text, embedding vector(384), exif_summary jsonb, fossilised_at)` using pgvector
- `pins(id, object_id, owner_id, price_paid numeric, pinned_at)`
- `class_policies(content_class pk, t_half interval, thresholds float[])`
- `carbon_ledger(owner_id, day, gb_days numeric, kg_co2e numeric)`

### Future simulation
- **Hour 0:** a user turns on Patina for 180 GB of Google Photos. 41% of the files have not been opened in 3 years.
- **Day 1:** nothing visibly changes, and the patina map shows which albums are already cold. The user pins their wedding album.
- **Month 1:** 9,000 burst-shot duplicates and screenshots have fallen to thumbnails. Storage is down 38%, and the user upgrades nothing.
- **Year 1:** an enterprise pilot applies Patina to logs and SharePoint "dark data". Storage falls by about half, with measurable kWh savings reported in its ESG filing.
- **Year 5:** Patina tiers are an S3 lifecycle option. "Full-fidelity forever" becomes a premium, carbon-taxed choice instead of the default. Archives become curated by attention.
- **Failure future:** someone needs a decayed file *legally* (evidence, medical scans), or a grieving parent finds a child's photo reduced to a caption.
  **Mitigation:** legal-hold and sensitive classes are exempt by default. Every downgrade is preceded by a "last look" digest ("these 12 will fade next month"). Fossils keep a hash so originals can be verified if a backup exists. The pre-fossil rung keeps a 1-year "ember" period in cold storage where recovery is free.

---

## Concept 3: WAKE

**Pitch:** *"An open protocol for a graceful digital death." Your accounts, secrets and data are split into cryptographic shares held by people you love. The shares expire unless you keep living, and when you stop, your digital estate unfolds and then dissolves on the schedule you wrote.*

### The idea
WAKE is a standard, an "OAuth for the afterlife", that any platform can implement. While you are alive, a master estate key is split by **Shamir secret sharing** among *k-of-n* guardians (family, a friend, a lawyer, a notary node). The key point is that **shares expire every epoch**. They are *proactively refreshed* by your living heartbeat, so a stolen or hoarded share from last month is useless. When the heartbeats stop, a Bayesian model estimates P(deceased), guardians are asked to confirm, and a **time-lock puzzle** enforces a mandatory grace delay that no one can bypass, not even the platform. Then your *Wake Schedule* runs. Messages go to named people, passwords go to an executor, and the public profile is memorialised for one year. Then a **crypto-shred** destroys the remaining keys, and the data becomes permanently unreadable everywhere at once.

### Why impermanence is the value engine
1. **Expiring shares** are the security model. Permanent shares would make guardians a permanent attack surface, and collusion or theft could "kill" you early. With refresh, an attacker must compromise k guardians *within one epoch*.
2. **Expiring estates** are the dignity model. Permanent data produces 1.4 billion zombie profiles, identity theft of the dead, ad-targeting of the grieving, and unconsented AI "griefbots" trained on everything you ever wrote. WAKE makes ending *the designed final state*, with a ritualised half-life that mirrors how human mourning actually fades.
3. **Expiring delay** (the time-lock) gives the living time to grieve, and mistakes can be caught before anything irreversible happens.

### Core math
1. **Shamir (k, n) sharing** over GF(p): f(x) = s + a₁x + … + a_{k−1}x^{k−1}, share_i = (i, f(i)).
   Reconstruction by Lagrange: **s = Σ_{j∈S} y_j · Π_{m∈S, m≠j} x_m / (x_m − x_j)** (mod p), with |S| = k.
2. **Proactive refresh (expiring shares, Herzberg et al. 1995):** each epoch, generate a random δ(x) with δ(0)=0, then set share_i ← share_i + δ(i). The secret is unchanged and old shares are information-theoretically useless. The heartbeat signs the epoch commitment, and without a heartbeat refresh halts and the "death path" opens.
3. **Bayesian death inference:** silence duration t (no heartbeat across any device).
   P(D | t) = P(t | D)·π / [P(t | D)·π + S_alive(t)·(1 − π)], where S_alive(t) = exp(−(t/η)^κ) is a Weibull survival of "normal silences" fitted per user, and π comes from actuarial mortality by age. Guardian confirmations act as likelihood ratios that multiply the odds.
4. **RSW time-lock puzzle** (Rivest–Shamir–Wagner): the release key K is encrypted under x^{2^T} mod N. Computing it requires T *sequential* squarings, so the grace period (e.g. 30 days) is enforced by mathematics rather than a server's promise. A **VDF** proof (Wesolowski) lets anyone verify the delay was honoured.
5. **Memorial half-life:** profile visibility V(t) = 2^{−t/T_mourn}. Posts gradually narrow from public to friends to named heirs to gone.

### Browser demo (SVG "constellation" of guardians, all crypto in-browser with BigInt)
1. **Write your Wake:** a drag-and-drop schedule (assets × recipients × release time × fate: give, seal, memorialise, shred).
2. **Live Shamir split:** pick k and n, watch the polynomial curve drawn through the shares, and see that any k points rebuild s.
3. **Epoch refresh animation:** shares pulse and change value each "month" while the secret stays fixed. An "old share" stolen by an attacker turns to ash.
4. **Collusion attack mode:** try to reconstruct with k−1 shares, or with shares from mixed epochs, and fail visibly.
5. **Heartbeat stop:** the P(deceased) curve rises with silence, and guardian confirmations step it up.
6. **Time-lock countdown:** a real (scaled) RSW squaring loop runs in a Web Worker with a progress bar. Nothing can skip it.
7. **Wake unfolds:** a timeline playback where letters are delivered, the profile memorial fades on its half-life, and the final crypto-shred dissolves the data into particles.
8. **LLM-assisted "legacy letter"** (optional): turns bullet notes into a farewell message the user edits and approves. There is *no* griefbot, by design.
9. **QR audience moment:** 20 audience phones become guardians of a secret the presenter wrote (e.g. a hidden message on stage). Shares on phones **expire after 60 s unless the presenter's heartbeat refreshes them**. The presenter "goes silent", and the room must get k phones to tap "confirm" before the epoch closes. When they do, the message reconstructs on the big screen. If they are too slow, it is shredded forever.

### Data model (Postgres)
- `principals(id, birth_year, risk_prior float, weibull_eta float, weibull_kappa float, status enum[alive,suspected,confirmed,memorial,shredded])`
- `guardians(id, principal_id, contact_hash, x_index int, pubkey, role)`
- `share_epochs(id, principal_id, epoch int, commitment bytea, refreshed_at, expires_at)`; shares themselves are stored only encrypted to the guardian (`share_envelopes(epoch_id, guardian_id, ciphertext)`)
- `heartbeats(principal_id, device_id, at, signature)`
- `death_signals(id, principal_id, source enum[silence,guardian,registry], likelihood_ratio float, at)`
- `timelocks(id, principal_id, modulus_n bytea, t_squarings bigint, puzzle bytea, vdf_proof bytea, unlock_eta)`
- `wake_schedule(id, principal_id, asset_ref, recipient_id, fate enum[give,seal,memorial,shred], release_after interval, t_half_visibility interval)`
- `shred_log(principal_id, asset_ref, key_destroyed_at, attest_sig)`

### Future simulation
- **Hour 0:** Maya, 34, sets up WAKE in 6 minutes with 3-of-5 guardians: her sister, two friends, her lawyer, and a notary node.
- **Day 1:** her first epoch refresh happens silently. She writes two letters, sealed for her niece's 18th birthday.
- **Month 1:** her phone is lost for 9 days. P(D) rises to 4% and hits no threshold, because her Weibull silence model knows she goes off-grid when hiking.
- **Year 1:** a password manager and a social network adopt the WAKE spec. Insurers offer a discount for having a Wake as part of estate planning.
- **Year 5:** WAKE is a recognised standard, like a digital organ-donor card. Platforms report fewer zombie accounts, and impersonation fraud on dead users' accounts falls.
- **Failure future:** a false-positive death (coma, prison, sabbatical) triggers release, or an abusive family member is a guardian and colludes.
  **Mitigation:** the time-lock grace period can be cancelled only by the principal's own key (a "Lazarus" override). Confirmation requires k guardians from *different* social clusters. Any guardian's attempt to reconstruct alerts the principal. The irreversible shred is staged last and only after the full memorial half-life.

---

## Self-scores (1–10)

Order: prompt fit, originality, emotional resonance, problem severity, evidence base, user clarity, live demo-ability, visual wow, build feasibility (48h, 1–2 people), algorithmic/math depth, database fit, sustainability, social impact, scalability, business model, ethical safety, story arc, interaction novelty, differentiation, judge memorability.

| Concept | Scores | Total /200 |
|---|---|---|
| HALF-LIFE | [9, 8, 8, 10, 9, 8, 9, 9, 7, 9, 8, 5, 10, 9, 6, 6, 8, 9, 8, 9] | **164** |
| WAKE | [9, 8, 10, 8, 7, 8, 8, 8, 7, 10, 8, 6, 8, 7, 7, 8, 10, 9, 8, 9] | **163** |
| PATINA | [9, 8, 7, 8, 8, 7, 8, 9, 8, 8, 9, 10, 6, 9, 7, 7, 8, 7, 8, 8] | **159** |

Notes on the scores:
- **HALF-LIFE** has the highest problem severity and social impact, and its audience-as-cascade moment is very strong. It loses points on ethics (who controls the attesters?) and on business model (platform adoption is a policy fight).
- **WAKE** has the strongest emotional arc and the deepest math (Shamir, proactive refresh, RSW time-lock, Bayesian hazard). The QR "keep the secret alive" moment is novel. Its scale is limited by legal and estate complexity.
- **PATINA** is the most direct sustainability story and the easiest build (JPEG re-encoding plus an ODE plus a Count-Min Sketch). It is visually beautiful but emotionally cooler, unless the demo uses the audience's own photos.

**Recommendation:** HALF-LIFE for impact and judges who care about the AI-era problem. WAKE for emotional memorability. Either could borrow PATINA's "fossil" visual language.
