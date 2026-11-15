/* Live product catalog: real products and photos from DummyJSON (free, open, no key).
   Fetched in the viewer's browser. If it's unreachable, the seeded catalog with line glyphs stays. */
const SOURCES = [
  ['furniture', 'furniture'], ['home-decoration', 'decor'], ['kitchen-accessories', 'kitchen'], ['laptops', 'electronics'],
  ['mobile-accessories', 'electronics'], ['tablets', 'electronics'], ['mens-shirts', 'clothing'], ['tops', 'clothing'],
  ['mens-shoes', 'clothing'], ['womens-bags', 'clothing'], ['sports-accessories', 'bike'], ['sunglasses', 'clothing'],
];
const GLYPH = { furniture: 'chair', decor: 'lamp', kitchen: 'kettle', electronics: 'monitor', clothing: 'parka', bike: 'bike' };
const BIG = /bed|sofa|couch|table|wardrobe|desk|cabinet/i;

/** Local scraped catalog (data/quince.json, built by scripts/scrape-quince.mjs). Preferred: works offline and on Vercel. */
export async function fetchLocalCatalog() {
  const r = await fetch('../data/quince.json', { cache: 'no-cache' }); if (!r.ok) return [];
  return (await r.json()).map((p) => ({ ...p, featured: true }));
}

export async function fetchLiveCatalog(timeoutMs = 5000) {
  const ctl = new AbortController(); const timer = setTimeout(() => ctl.abort(), timeoutMs);
  try {
    const lists = await Promise.all(SOURCES.map(([src, cat]) =>
      fetch(`https://dummyjson.com/products/category/${src}?limit=10&select=title,description,price,brand,rating,weight,dimensions,images,thumbnail,tags`, { signal: ctl.signal })
        .then((r) => (r.ok ? r.json() : { products: [] })).then((j) => j.products.map((p) => ({ ...p, _cat: cat, _src: src }))).catch(() => [])));
    // interleave categories so the grid feels like a real mixed feed
    const out = []; for (let i = 0; i < 10; i++) for (const l of lists) if (l[i]) out.push(l[i]);
    return out.map((p) => {
      const big = p._cat === 'furniture' && BIG.test(p.title);
      const d = p.dimensions || {}, ft3 = ((d.width || 20) * (d.height || 20) * (d.depth || 20)) / 28317;
      return {
        name: p.title, category: p._cat, glyph: big ? 'futon' : GLYPH[p._cat], brand: p.brand || '',
        p0: Math.min(250, Math.max(5, Math.round(p.price * (big ? 0.12 : 0.35)))), retail: p.price,
        kg: Math.max(0.3, +(p.weight || 2)), ft3: +Math.max(0.2, ft3).toFixed(1),
        image: p.thumbnail, images: (p.images || []).slice(0, 4), rating: p.rating,
        blurb: p.description, condition: p.rating > 4.5 ? 'Like new' : p.rating > 3.5 ? 'Good' : 'Fair',
      };
    }).filter((p) => p.image);
  } finally { clearTimeout(timer); }
}

/** Overwrite seeded listings' product fields with real products, keeping their melt dynamics. */
export function applyCatalog(market, products) {
  const n = Math.min(products.length, market.items.length);
  for (let i = 0; i < n; i++) Object.assign(market.items[i], products[i], { live: true });
  return n;
}
