# Melt: the move-out market where prices melt

Every listing's price melts toward $0 on a public curve. At $0, a 2-hour **Kindness Window** gives students with need first claim (Gale–Shapley stable matching). After that the item is free to anyone, then a **donation truck** routes to pick it up (Clarke–Wright + 2-opt). Watching an item adds heat, which slows its melt. Nothing ends in the dumpster.

Math: [`MATH.md`](MATH.md) · Deck: [`../deck/`](../deck/index.html)

## Run locally (no install, Node ≥ 22)
```bash
cd melt && npm start          # → http://localhost:8787
```
| Route | What |
|---|---|
| `/web/#/market` | eBay-style grid. Prices tick down live, with heat, filters and sorting |
| `/web/#/item/m002` | Melt curve (base vs heat-bent), claim gauge (optimal stopping), live math |
| `/web/#/sell` | List an item and preview the three melt temperaments |
| `/web/#/kindness` | Gale–Shapley matching, animated step by step |
| `/web/#/routes` | Naive → savings → 2-opt donation route, with an animated truck |
| `/web/#/impact` | kg diverted, CO₂e, $ kept, dumpsters avoided |
| `/web/#/live` | **Projector:** judges' QR auction, live viewers, leaderboard |
| `/web/#/join` | **Phone:** $150 Melt Bucks wallet, "Catch it" button |

The footer's demo clock speeds up time. **Jump to move-out** shows everything transforming.
To let phones on the same Wi-Fi join, open the projector at `http://<your-laptop-ip>:8787/web/#/live`.

With no backend (static hosting), the live auction runs in **rehearsal mode**: the same logic runs in the browser, with "+5 bot judges".

## Deploy to Vercel (for the real QR moment)
1. Import the repo into Vercel and set **Root Directory = `melt`**. No build command is needed.
2. Storage → add **Upstash Redis** (free). It injects `KV_REST_API_URL` / `KV_REST_API_TOKEN` (or `UPSTASH_REDIS_REST_*`), which `api/live.js` picks up automatically.
3. Optional: set `HOST_KEY=something`, then open the projector at `/web/?key=something#/live` so only you can start lots.
4. Open `https://<app>.vercel.app/web/#/live` on the projector. The QR code points phones at `/web/#/join`.

Bids are race-safe. Each write is a Redis compare-and-set (a Lua `EVAL`), so the first tap wins.

## Backend API (local server)
`GET /api/market/state` · `GET /api/market/items/:id?value=` · `POST /api/market/items/:id/watch` · `POST /api/market/items/:id/claim` · `POST /api/market/items` · `GET /api/market/kindness` · `GET /api/market/routes?capacity=` · `GET /api/market/impact` · `GET /api/market/stream` (SSE) · `POST /api/market/clock` · `GET|POST /api/live`

## Data
- `data/catalog.js`: 56 seeded move-out listings across 8 dorms (hardcoded, deterministic).
- `scripts/import-dummyjson.mjs`: pulls a real product catalog from DummyJSON (open, no key). Run it on your machine, because this sandbox can't reach it.
- `db/schema.sql`: Postgres schema (Supabase, Neon or yours) with a `melt_price()` SQL function and a pg_cron sweep.

## Tests
```bash
npm test     # engine (curve, heat, posterior, gauge, Gale–Shapley, routing) + live auction races
```
