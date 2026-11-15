# Tech stack (proposed; finalized once a concept is chosen)

| Layer | Choice | Why |
|---|---|---|
| Deck | Hand-built HTML on Cobalt Grid (`deck/`, `shared/`) | Pixel-exact to the design spec, embeds the live demo, generates real QR codes |
| Demo front end | Vanilla ES modules + Canvas 2D / WebGL shaders | No build step, fast to iterate during a hackathon, runs anywhere |
| Math kernel | `demo/engine/decay.js` | Half-life, Weibull, logistic, Ebbinghaus, Arrhenius, Laplace differential privacy, optimal stopping |
| Database | Postgres (`db/schema.sql`) on **your** DB, Supabase or Neon | Computed decay, a pg_cron sweep that hard-deletes, realtime for the audience QR moment |
| Realtime | Supabase Realtime, or a WebSocket on an edge function | Phones that scanned the QR appear on the projector live |
| AI (optional) | Groq / OpenRouter (already connected in this session) | Fossil summaries, or classifying what to let decay |
| Hosting | Published Artifact link (works now) and/or GitHub Pages / Vercel | The QR points at the hosted demo |
