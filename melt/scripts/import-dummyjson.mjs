/* Pull a real product catalog from DummyJSON (free, open, no key) and map it to Melt listings.
   Run on your own machine (this needs internet):  node scripts/import-dummyjson.mjs > data/imported.json
   Then set IMPORTED=1, or swap buildCatalog() to read data/imported.json. */
const CATS = { furniture: 'furniture', 'home-decoration': 'decor', 'kitchen-accessories': 'kitchen', laptops: 'electronics', 'mobile-accessories': 'electronics', 'mens-shirts': 'clothing', tops: 'clothing', 'sports-accessories': 'bike', lighting: 'decor' };
const GLYPH = { furniture: 'chair', decor: 'lamp', kitchen: 'kettle', electronics: 'monitor', clothing: 'parka', bike: 'bike' };
const out = [];
for (const [src, cat] of Object.entries(CATS)) {
  const r = await fetch(`https://dummyjson.com/products/category/${src}?limit=12`); if (!r.ok) continue;
  for (const p of (await r.json()).products) out.push({
    name: p.title, category: cat, glyph: GLYPH[cat], image: p.thumbnail,
    p0: Math.max(5, Math.round(p.price * 0.45)),   // used, student-to-student: ~45% of retail
    kg: p.weight ?? 3, ft3: Math.max(0.2, ((p.dimensions?.width ?? 20) * (p.dimensions?.height ?? 20) * (p.dimensions?.depth ?? 20)) / 28317),
    condition: 'Good', blurb: p.description.slice(0, 90),
  });
}
console.log(JSON.stringify(out, null, 2));
console.error(`imported ${out.length} products`);
