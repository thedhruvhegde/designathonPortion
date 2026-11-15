/* Hardcoded move-out catalog. Prices are typical used-market prices for student goods.
   Swap in real data with scripts/import-dummyjson.mjs (run on your own machine). */
import { mulberry32, TEMPERAMENTS } from '../engine/melt.js';

export const CAMPUS = {
  name: 'Move-Out Week',
  depot: { id: 'depot', name: 'ReUse Depot', x: 50, y: 92 },
  dorms: [
    { id: 'north', name: 'North Hall', x: 22, y: 14 },
    { id: 'elm', name: 'Elm Court', x: 58, y: 10 },
    { id: 'maple', name: 'Maple Quad', x: 84, y: 24 },
    { id: 'hill', name: 'Hill Tower', x: 12, y: 46 },
    { id: 'river', name: 'Riverside', x: 44, y: 40 },
    { id: 'oak', name: 'Oak House', x: 74, y: 52 },
    { id: 'west', name: 'West Commons', x: 18, y: 76 },
    { id: 'lake', name: 'Lakeview', x: 82, y: 78 },
  ],
};

// [name, glyph, category, p0, kg, ft3, condition, blurb]
const BASE = [
  ['Grey futon, folds flat', 'futon', 'furniture', 80, 30, 28, 'Good', 'Survived two roommates and one movie marathon a week.'],
  ['Mini-fridge 3.1 cu ft', 'fridge', 'appliance', 70, 22, 6, 'Like new', 'Defrosted, cleaned, and still cold. Fits under a lofted bed.'],
  ['IKEA-style desk lamp', 'lamp', 'decor', 14, 1.4, 1, 'Good', 'Warm bulb included. Saw me through orgo.'],
  ['Study desk, oak veneer', 'desk', 'furniture', 65, 24, 14, 'Fair', 'A few scratches and a lot of finished essays.'],
  ['Mesh office chair', 'chair', 'furniture', 45, 12, 9, 'Good', 'Adjustable height, rolls smoothly.'],
  ['Microwave 700W', 'microwave', 'appliance', 35, 10, 2, 'Good', 'Turntable works. Popcorn button is a legend.'],
  ['Area rug 5×7', 'rug', 'decor', 30, 6, 3, 'Good', 'Blue geometric, vacuumed and rolled.'],
  ['Commuter bike 21-speed', 'bike', 'bike', 120, 14, 12, 'Fair', 'New tubes in March. Lock included.'],
  ['Intro Psych textbook', 'books', 'books', 40, 1.8, 0.2, 'Good', 'Minimal highlighting, I promise.'],
  ['27" monitor', 'monitor', 'electronics', 90, 5.5, 2, 'Like new', 'HDMI cable included. One owner.'],
  ['Pothos in ceramic pot', 'plant', 'plant', 12, 2, 0.5, 'Thriving', 'Please water it. It has been through a lot.'],
  ['Full-length mirror', 'mirror', 'decor', 20, 4, 2, 'Good', 'Over-the-door hooks included.'],
  ['5-shelf bookcase', 'shelf', 'furniture', 40, 18, 10, 'Good', 'Holds books, plants and a regrettable number of mugs.'],
  ['Electric kettle', 'kettle', 'kitchen', 15, 1.1, 0.4, 'Good', 'Boils in 3 minutes. Tea not included.'],
  ['Winter parka, M', 'parka', 'clothing', 60, 1.6, 1, 'Like new', 'For the first snow, which arrives sooner than you think.'],
  ['Storage bins (set of 4)', 'bins', 'storage', 18, 3.2, 6, 'Good', 'Stackable, lids included.'],
  ['Twin XL mattress topper', 'topper', 'furniture', 25, 3, 4, 'Good', 'Memory foam, washed cover.'],
  ['Floor lamp, arc', 'lamp', 'decor', 28, 5, 3, 'Good', 'Bends over the couch. Very dramatic.'],
  ['Rice cooker 6-cup', 'kettle', 'kitchen', 20, 2.4, 0.6, 'Like new', 'Makes perfect rice and the occasional oatmeal.'],
  ['Bluetooth speaker', 'speaker', 'electronics', 30, 0.8, 0.2, 'Good', 'Holds a charge about 10 hours.'],
  ['Shoe rack, 4 tier', 'shelf', 'storage', 12, 2.5, 2, 'Good', 'Flat-packs back down.'],
  ['Bean bag chair', 'beanbag', 'furniture', 35, 4, 12, 'Good', 'Exam-season approved.'],
  ['Desk chair, wooden', 'chair', 'furniture', 20, 6, 5, 'Fair', 'Sturdy. Pair it with a cushion.'],
  ['Calculus II textbook', 'books', 'books', 55, 2, 0.2, 'Good', 'The answers in the back are mostly right.'],
  ['Wool sweaters (3)', 'parka', 'clothing', 24, 1.5, 0.8, 'Good', 'Cosy, washed, folded.'],
  ['Mini vacuum', 'vacuum', 'appliance', 30, 3, 1.5, 'Good', 'Bagless, with crevice tool.'],
  ['Fairy lights & hooks', 'lights', 'decor', 8, 0.4, 0.2, 'Good', 'Instant cosy.'],
  ['Laptop stand + keyboard', 'monitor', 'electronics', 35, 1.8, 0.6, 'Like new', 'Ergonomics for the thesis.'],
  ['Cast-iron skillet', 'kettle', 'kitchen', 18, 2.6, 0.3, 'Seasoned', 'Seasoned by four years of grilled cheese.'],
  ['Snake plant', 'plant', 'plant', 15, 3, 0.6, 'Thriving', 'Unkillable. Proven.'],
];

const NAMES = ['Ava', 'Jun', 'Priya', 'Mateo', 'Zainab', 'Liam', 'Sora', 'Noah', 'Amara', 'Kai', 'Elena', 'Omar', 'Mei', 'Theo', 'Ines', 'Dev'];
const TEMPS = Object.keys(TEMPERAMENTS);

/** Build the seeded catalog. `now` is hours since the market opened (default 30h in). */
export function buildCatalog(seed = 42, now = 30) {
  const r = mulberry32(seed), items = [];
  const total = 56;
  for (let i = 0; i < total; i++) {
    const [name, glyph, category, base, kg, ft3, condition, blurb] = BASE[i % BASE.length];
    const variant = i >= BASE.length;
    const p0 = Math.max(5, Math.round(base * (variant ? 0.7 + r() * 0.5 : 1)));
    const dorm = CAMPUS.dorms[Math.floor(r() * CAMPUS.dorms.length)];
    const listedAt = -Math.floor(r() * 10);          // listed 0–10h before market open
    const T = 72 + Math.floor(r() * 4) * 12 - listedAt; // deadline 72–108h after listing (aligned to move-out)
    const temperament = TEMPS[Math.floor(r() * 3)];
    const popularity = r() ** 1.5 * 1.8;               // watchers per hour (Poisson)
    const events = []; let t = 0;
    while (true) { t += -Math.log(1 - r()) / Math.max(0.05, popularity); if (t > T) break; events.push(+t.toFixed(2)); }
    items.push({
      id: 'm' + String(i + 1).padStart(3, '0'), name: variant ? name.replace(/^(\w)/, (m) => m) : name, glyph, category,
      p0, kg, ft3, condition, blurb, dorm: dorm.id, seller: NAMES[Math.floor(r() * NAMES.length)],
      listedAt, T, temperament, k: TEMPERAMENTS[temperament], events, // events at hours since listing (future ones play out as sim time advances)
    });
  }
  return items;
}

/** Claimants in the Kindness Window. Flags are opt-in and private, shown only as an aggregate. */
export const CLAIMANTS = [
  { id: 'c1', alias: 'Student 041', flags: ['intlFreshman', 'pell'], needs: ['furniture', 'kitchen', 'clothing'], dorm: 'north' },
  { id: 'c2', alias: 'Student 117', flags: ['foodInsecure'], needs: ['kitchen', 'appliance'], dorm: 'elm' },
  { id: 'c3', alias: 'Student 203', flags: ['housingInsecure', 'firstGen'], needs: ['furniture', 'storage', 'decor'], dorm: 'hill' },
  { id: 'c4', alias: 'Student 256', flags: [], needs: ['electronics', 'decor'], dorm: 'river' },
  { id: 'c5', alias: 'Student 318', flags: ['pell', 'firstGen'], needs: ['books', 'electronics'], dorm: 'oak' },
  { id: 'c6', alias: 'Student 402', flags: ['intlFreshman'], needs: ['clothing', 'appliance', 'furniture'], dorm: 'west' },
  { id: 'c7', alias: 'Student 477', flags: ['foodInsecure', 'pell'], needs: ['appliance', 'kitchen'], dorm: 'lake' },
  { id: 'c8', alias: 'Student 530', flags: [], needs: ['bike', 'furniture'], dorm: 'maple' },
];
