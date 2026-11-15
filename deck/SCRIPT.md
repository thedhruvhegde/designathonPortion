# Melt: 5-minute pitch script

Deck: `deck/index.html`. Serve the repo root (`python3 -m http.server 8000`) and open `http://localhost:8000/deck/`. For the live demo, run `cd melt && npm start` and use the demo at `/melt/web/`.

**Keys:** → / Space next · ← back · **N** speaker notes · **T** start, pause or show the timer · **R** reset the timer · **O** overview grid (click a slide to jump) · **A** replay this slide's animation · **D** open the demo full screen (on slide 12 it opens the projector view) · **F** full screen.
**Join QR:** add `?join=<public URL of the phone view>` to the deck URL so that judges' phones can reach it. For example, `deck/index.html?join=https://melt.example.app/web/%23/join`. Without it, the QR points to `../melt/web/index.html#/join` on whatever host serves the deck.
**PDF:** open in Chrome, then Print, Save as PDF (each slide prints as one 16:9 page). Or add `?print` to the URL to open the print dialog automatically.

At about 150 words per minute, these are the target times per slide. They add up to **5:00**.

| # | Slide | Target | Ends at |
|---|---|---|---|
| 01 | Cover | 0:07 | 0:07 |
| 02 | Two students, one hallway | 0:20 | 0:27 |
| 03 | The dumpster is on the calendar | 0:18 | 0:45 |
| 04 | The next student arrives with nothing | 0:16 | 1:01 |
| 05 | A permanent listing rots; a melting one moves | 0:16 | 1:17 |
| 06 | Four states, one ending | 0:17 | 1:34 |
| 07 | The melt curve | 0:16 | 1:50 |
| 08 | Watching adds heat | 0:12 | 2:02 |
| 09 | When should I claim? | 0:14 | 2:16 |
| 10 | At $0: fairness, then a truck | 0:16 | 2:32 |
| 11 | Live demo | 0:35 | 3:07 |
| 12 | Take out your phone (live auction) | 1:00 | 4:07 |
| 13 | One campus, one spring | 0:16 | 4:23 |
| 14 | Who pays, and how it scales | 0:16 | 4:39 |
| 15 | Why now, and what we need | 0:12 | 4:51 |
| 16 | An ending that becomes a beginning | 0:09 | 5:00 |

---

### 01 · Cover (0:07)
Hi, we're [Team]. This is **Melt**: a move-out marketplace where every price melts, in public, all the way to zero.

### 02 · The story (0:20)
Meet Maya. She's a composite, but you have met her. An international freshman, she lands in August to an empty room: no lamp, no chair, no pan.
Three months earlier, in May, the students leaving that same hall filled a forty-yard dumpster by the loading dock. Nobody wanted it thrown away; there just wasn't time. Same objects. Wrong time.

### 03 · The waste (0:18)
This isn't an anecdote. The EPA counts twelve million tons of furniture and furnishings in US municipal waste, and about eighty percent of it is landfilled.
At Michigan State, crews hauled two hundred and fifty tons out of residence halls in a single move-out week; forty-four tons were resold. And that's a success story.

### 04 · The need (0:16)
And the need is in the same building. In the Hope Center's latest survey, fifty-nine percent of students face basic-needs insecurity, and forty-one percent are food insecure. The GAO puts it at three point eight million students.
And nearly three hundred thousand new international students arrive each year, many with two suitcases.

### 05 · The insight (0:16)
Here's our insight. A permanent listing rots: it sits at the same price until the dumpster wins. A melting one moves.
From thirty case studies we took four patterns: make the ending a witnessed event, make expiry visible, transform instead of vanishing, and give everyone one shared clock.

### 06 · How it works (0:17)
There are four states. A student lists an item with a hard deadline: their move-out. The price melts on a public curve.
At zero it isn't trash. It enters a two-hour Kindness Window for students with need. Still unclaimed? A donation truck is already routed to pick it up.

### 07 · The melt curve (0:16)
Now the math. A plain exponential never hits zero, so we normalise it to the deadline: the price is exactly p-zero at listing and exactly zero at move-out.
Sellers choose a temperament (gentle, steady or fast) and see the curve before they post.

### 08 · Heat (0:12)
Watching adds heat. Every view or bid is a Hawkes-style event that slows the item's clock.
But heat can't freeze it: in the last twenty-four hours we blend back to wall time, so it still hits zero on time.

### 09 · Claim gauge (0:14)
For buyers, waiting saves money but risks losing the item. We learn demand with a Gamma–Poisson posterior and tell you the moment the risk outweighs the savings.
That crossing is your optimal stop, and the gauge flips to Claim Now.

### 10 · Fairness and routing (0:16)
At zero, fairness takes over. Gale–Shapley matches items to students by need score, with a lottery tie-break so it's not first-come-first-served, and the result is stable.
Whatever's left becomes truck stops: Clarke–Wright savings plus 2-opt cut this route in half.

### 11 · Live demo (0:35)
Let's see it. This is the market: every tile is melting right now.
*[Item]* Here's one listing: its curve, its heat, and the claim gauge telling me to wait.
*[Kindness]* At zero it moves to the Kindness Window, matched live.
*[Routes]* What nobody claims becomes a stop on tonight's route.
*[Impact]* And every outcome adds to the campus ledger: kilograms diverted, CO₂ avoided, dollars kept in student pockets.

### 12 · Live auction (1:00)
Now it's your turn. Scan the code: you're joining a melting auction with a wallet of Melt Bucks. Each lot starts at full price on the same curve you just saw, compressed from a week into seconds.
The first tap wins. If two of you tap within the same fifty milliseconds, need score breaks the tie, then a lottery.
*[Start the auction. Let it run; narrate sparingly.]*
Watch the room: nobody wants to be first, and nobody wants to lose it. That tension is the whole product.
*[Winner]* And that's the point: the ending was an event you all witnessed together.

### 13 · Impact (0:16)
One campus, one spring. These are projections, and the assumptions are on the slide: four thousand residents, a quarter of them listing three items each.
That's about thirty-four tonnes diverted, roughly seventy tonnes of CO₂-equivalent avoided, and about ninety thousand dollars kept in student pockets.

### 14 · Business (0:16)
Who pays? Sustainability offices, who already report diversion publicly and pay for hauling. Residence life, who license Melt into the housing portal. And college towns, who run a citywide Melt Week when leases turn over.
Students never pay to give or to receive.

### 15 · Why now / ask (0:12)
Why now? The need is measured, diversion is reported, and move-out already happens on a known date.
Our ask: one residence hall, one May. Let us melt it.

### 16 · Close (0:09)
Every move-out is an ending. Melt makes it a beginning, for the next student. Thank you.

---

## Sources used on slides
- US EPA, *Facts and Figures about Materials, Waste and Recycling: Durable Goods, Product-Specific Data*. In 2018, furniture and furnishings were 12.1M tons of MSW (4.1%); 80.1% was landfilled (≈9.7M tons), 19.5% was combusted, and less than 0.5% was recycled.
- Bridge Michigan, "Trash to treasure: rethinking waste in Michigan college towns" (2024). In spring 2024, the MSU Surplus Store & Recycling Center picked up about 500,000 lb from residence halls in move-out week, and 44 tons were collected for resale.
- BU Sustainability, "Goodwill, Not Landfill reaches record numbers in 2024" (Jul 18 2024). 226,000 lb were diverted during spring move-out.
- The Hope Center, *2023–2024 Student Basic Needs Survey Report* (Feb 26 2025; 74,350 students, 91 institutions). 59% faced basic-needs insecurity, 41% were food insecure, 48% were housing insecure and 14% experienced homelessness.
- US GAO, GAO-24-107074 (2024; 2020 NPSAS data). 23% of college students, about 3.8M, were food insecure.
- IIE, *Open Doors 2024*. There were 1,126,690 international students in 2023/24, including 298,705 new enrolments.

## Labelled estimates (not sourced facts)
- Maya and the 40-yard dumpster are an **illustrative composite**.
- Slide 13 is a **pilot projection**, and every assumption is shown on the slide. Emission factor: 2.1 kgCO₂e/kg (est.), in the style of WARM, taken from `melt/engine`.
- Slide 14's prices are **pricing hypotheses (est.)**.

---

## PowerPoint version (`deck/Melt.pptx`)

A 17-slide, 16:9 PowerPoint build of this pitch, with speaker notes on every slide (target time and the script). It adds two business slides from `melt/BUSINESS.md` and uses Quince product photos and real screenshots. The live site is https://meltshopping.vercel.app (phones join at `/join`, projector at `/live`).

| # | Slide | Target | Ends at |
|---|---|---|---|
| 01 | Cover: Melt. | 0:10 | 0:10 |
| 02 | Two students, one hallway | 0:18 | 0:28 |
| 03 | The dumpster is on the calendar | 0:16 | 0:44 |
| 04 | The need is in the same building | 0:14 | 0:58 |
| 05 | A permanent listing rots; a melting one moves | 0:14 | 1:12 |
| 06 | Four states, one ending | 0:15 | 1:27 |
| 07 | A market where every tile melts | 0:12 | 1:39 |
| 08 | One item, one public curve | 0:13 | 1:52 |
| 09 | Three temperaments, one deadline | 0:15 | 2:07 |
| 10 | At $0: fairness, then a truck | 0:14 | 2:21 |
| 11 | Who sells, who buys, who pays | 0:20 | 2:41 |
| 12 | How everyone makes money | 0:20 | 3:01 |
| 13 | What one spring diverts | 0:13 | 3:14 |
| 14 | Live demo | 0:25 | 3:39 |
| 15 | Scan to bid (live auction) | 1:00 | 4:39 |
| 16 | Why now, and what we need | 0:11 | 4:50 |
| 17 | An ending that becomes a beginning | 0:10 | 5:00 |

To rebuild after the screenshots change, run `NODE_PATH=<node_modules with pptxgenjs and sharp> node deck/build-pptx.cjs [pptx-skill-dir]`. The script reads `deck/assets/*.png` and `melt/web/img/quince/*.jpg` and resizes them as it builds. The skill directory is optional; it applies the Cobalt theme colours.
