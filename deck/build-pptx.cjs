// Builds deck/Melt.pptx (16:9, Cobalt Grid) from deck/assets + melt/web/img/quince.
// Usage: NODE_PATH=<dir with pptxgenjs + sharp> node deck/build-pptx.cjs [skillDir]
const path = require("path");
const fs = require("fs");
const os = require("os");
const pptxgen = require("pptxgenjs");
const sharp = require("sharp");

const ROOT = path.resolve(__dirname, "..");
const A = (f) => path.join(ROOT, "deck/assets", f);
const Q = (f) => path.join(ROOT, "melt/web/img/quince", f + ".jpg");
const OUT = path.join(ROOT, "deck/Melt.pptx");
const TMP = fs.mkdtempSync(path.join(process.env.TMPDIR || os.tmpdir(), "melt-img-"));
const SKILL = process.argv[2];

const INK = "1F2BE0", PAPER = "F0EBDE", PAPER2 = "E6E0CE", SOFT = "5560E5", FAINT = "A3A8F0";
const SERIF = "Georgia", SANS = "Arial", MONO = "Courier New";
const SITE = "meltshopping.vercel.app";

const THEME = {
  name: "Cobalt Grid", headFontFace: SERIF, bodyFontFace: SANS,
  colors: { dk1: INK, lt1: PAPER, dk2: INK, lt2: PAPER2, accent1: INK, accent2: SOFT, accent3: FAINT,
    accent4: INK, accent5: SOFT, accent6: FAINT, hlink: INK, folHlink: SOFT },
};

// ---------- image prep (re-read at build time; screenshots may be re-captured) ----------
async function prep(src, name, width, fmt = "jpeg") {
  const out = path.join(TMP, name + (fmt === "png" ? ".png" : ".jpg"));
  let p = sharp(src).resize({ width, withoutEnlargement: true });
  p = fmt === "png" ? p.png({ compressionLevel: 9, palette: true }) : p.flatten({ background: "#" + PAPER }).jpeg({ quality: 84, mozjpeg: true });
  await p.toFile(out);
  return out;
}

// ---------- helpers ----------
const T = (s, o) => s.addText(o.runs || o.text, Object.assign({ isTextBox: true, margin: 0, color: INK, fontFace: SANS, valign: "top" }, o.opts));
function label(s, text, x, y, w, extra = {}) {
  s.addText(text.toUpperCase(), Object.assign({ x, y, w, h: 0.25, isTextBox: true, margin: 0, fontFace: SANS, bold: true, fontSize: 10, charSpacing: 2, color: INK, valign: "top" }, extra));
}
function mono(s, text, x, y, w, h = 0.25, extra = {}) {
  s.addText(text, Object.assign({ x, y, w, h, isTextBox: true, margin: 0, fontFace: MONO, fontSize: 10, color: INK, valign: "top" }, extra));
}
function rule(s, x, y, w, width = 0.75, color = INK) {
  s.addShape("line", { x, y, w, h: 0, line: { color, width } });
}
function vrule(s, x, y, h, width = 0.75) {
  s.addShape("line", { x, y, w: 0, h, line: { color: INK, width } });
}
function box(s, x, y, w, h, fill) {
  s.addShape("rect", { x, y, w, h, fill: fill ? { color: fill } : { type: "none" }, line: { color: INK, width: 1 } });
}
function arrow(s, x1, y1, x2, y2) {
  const o = { x: Math.min(x1, x2), y: Math.min(y1, y2), w: Math.abs(x2 - x1), h: Math.abs(y2 - y1), line: { color: INK, width: 1.25, endArrowType: "triangle" } };
  if (x2 < x1) o.flipH = true;
  if (y2 < y1) o.flipV = true;
  s.addShape("line", o);
}
function source(s, text, y = 6.62, h = 0.36) {
  s.addText(text, { x: 0.5, y, w: 12.33, h, isTextBox: true, margin: 0, fontFace: SANS, fontSize: 10, color: SOFT, valign: "bottom" });
}
// Web screenshot inside a thin browser-chrome frame. Returns bottom y.
function web(s, img, x, y, w, url, ratio = 1.6) {
  const bar = 0.26, h = w / ratio;
  s.addShape("rect", { x, y, w, h: bar, fill: { color: PAPER }, line: { color: INK, width: 1 } });
  for (let i = 0; i < 3; i++) s.addShape("rect", { x: x + 0.1 + i * 0.13, y: y + 0.09, w: 0.08, h: 0.08, fill: { type: "none" }, line: { color: INK, width: 0.75 } });
  s.addText(url, { x: x + 0.6, y: y + 0.03, w: w - 0.8, h: bar - 0.06, isTextBox: true, margin: 0, fontFace: MONO, fontSize: 9, color: INK, valign: "middle", align: "center" });
  s.addImage({ path: img, x, y: y + bar, w, h, altText: url });
  s.addShape("rect", { x, y: y + bar, w, h, fill: { type: "none" }, line: { color: INK, width: 1 } });
  return y + bar + h;
}
// Phone screenshot inside a cobalt-outlined phone frame of total height h. Returns width.
function phone(s, img, x, y, h, alt) {
  const side = 0.09, top = 0.26, bot = 0.24;
  const ih = h - top - bot, iw = ih * (1170 / 2532), w = iw + 2 * side;
  s.addShape("roundRect", { x, y, w, h, rectRadius: 0.22, fill: { color: PAPER }, line: { color: INK, width: 1.5 } });
  s.addShape("rect", { x: x + w / 2 - 0.25, y: y + 0.11, w: 0.5, h: 0.05, fill: { color: INK }, line: { color: INK, width: 0 } });
  s.addImage({ path: img, x: x + side, y: y + top, w: iw, h: ih, altText: alt });
  s.addShape("rect", { x: x + side, y: y + top, w: iw, h: ih, fill: { type: "none" }, line: { color: INK, width: 0.5 } });
  return w;
}
function photo(s, img, x, y, w, h, alt) {
  s.addImage({ path: img, x, y, w, h, sizing: { type: "cover", w, h }, altText: alt });
  s.addShape("rect", { x, y, w, h, fill: { type: "none" }, line: { color: INK, width: 1 } });
}
function bigStat(s, num, x, y, w, size = 60) {
  s.addText(num, { x, y, w, h: size / 72 * 1.05, isTextBox: true, margin: 0, fontFace: SERIF, fontSize: size, color: INK, valign: "bottom" });
}

// ---------- melt curve math (melt/MATH.md §1) ----------
const meltP = (p0, k, T, t) => p0 * (Math.exp(-k * t) - Math.exp(-k * T)) / (1 - Math.exp(-k * T));

(async () => {
  const I = {};
  for (const n of ["web-market-grid", "web-market-hero", "web-item", "web-kindness", "web-routes", "web-impact", "web-live", "web-live-sold", "web-sell"])
    I[n] = await prep(A(n + ".png"), n, 1800);
  for (const n of ["phone-wallet", "phone-bidding", "phone-caught"]) I[n] = await prep(A(n + ".png"), n, 760);
  for (const n of ["qr-join", "qr-site"]) I[n] = await prep(A(n + ".png"), n, 1000, "png");
  const P = {};
  for (const n of ["performance-chenille-curved-back-dining-chair-0", "wool-cashmere-cocoon-coat-0", "chloe-hand-knotted-wool-rug-0",
    "italian-leather-midcentury-sofa-1", "carry-on-suitcase-1", "handwoven-rattan-bed-0"]) P[n] = Q(n);

  const pres = new pptxgen();
  pres.layout = "LAYOUT_WIDE"; // 13.333 x 7.5
  pres.title = "Melt: designathon pitch";
  pres.author = "[Team]";
  pres.theme = { headFontFace: SERIF, bodyFontFace: SANS };

  // Layouts
  const chrome = [
    { line: { x: 0.5, y: 0.42, w: 12.33, h: 0, line: { color: INK, width: 1.25 } } },
    { line: { x: 0.5, y: 7.05, w: 12.33, h: 0, line: { color: INK, width: 1.25 } } },
    { text: { text: "MELT · DESIGNATHON 2026", options: { x: 0.5, y: 7.1, w: 5, h: 0.25, margin: 0, fontFace: MONO, fontSize: 10, color: INK } } },
    { text: { text: SITE, options: { x: 4.67, y: 7.1, w: 4, h: 0.25, margin: 0, fontFace: MONO, fontSize: 10, color: INK, align: "center" } } },
  ];
  pres.defineSlideMaster({
    title: "CONTENT", background: { color: PAPER },
    objects: [...chrome,
      { placeholder: { options: { name: "kicker", type: "body", x: 0.5, y: 0.55, w: 12.33, h: 0.25, margin: 0, fontFace: MONO, fontSize: 11, color: INK, valign: "top" }, text: "" } },
      { placeholder: { options: { name: "title", type: "title", x: 0.5, y: 0.82, w: 12.33, h: 0.8, margin: 0, fontFace: SERIF, fontSize: 36, color: INK, valign: "top", bold: false, align: "left" }, text: "" } },
    ],
    slideNumber: { x: 11.83, y: 7.1, w: 1.0, h: 0.25, margin: 0, fontFace: MONO, fontSize: 10, color: INK, align: "right" },
  });
  pres.defineSlideMaster({
    title: "OPEN", background: { color: PAPER },
    objects: [...chrome,
      { placeholder: { options: { name: "kicker", type: "body", x: 0.5, y: 0.55, w: 12.33, h: 0.25, margin: 0, fontFace: MONO, fontSize: 11, color: INK, valign: "top" }, text: "" } },
    ],
    slideNumber: { x: 11.83, y: 7.1, w: 1.0, h: 0.25, margin: 0, fontFace: MONO, fontSize: 10, color: INK, align: "right" },
  });

  let sec = "";
  const add = (section, master, kicker, title, notes) => {
    if (section !== sec) { pres.addSection({ title: section }); sec = section; }
    const s = pres.addSlide({ masterName: master, sectionTitle: section });
    if (kicker) s.addText(kicker, { placeholder: "kicker" });
    if (title) s.addText(title, { placeholder: "title" });
    s.addNotes(notes);
    return s;
  };

  // ============ 01 COVER ============
  {
    const s = add("Opening", "OPEN", "IMPERMANENCE REPORT · VOL. 01 · MOVE-OUT ISSUE", null,
      "[0:10 · ends 0:10]\nHi, we're [Team]. This is Melt: a move-out marketplace where every price melts, in public, all the way to zero. And nothing reaches the dumpster.");
    T(s, { text: "Melt.", opts: { x: 0.5, y: 1.2, w: 5.6, h: 2.1, fontFace: SERIF, fontSize: 132, valign: "bottom" } });
    T(s, { text: "A move-out market where every price melts to zero, and nothing reaches the dumpster.", opts: { x: 0.5, y: 3.65, w: 5.4, h: 1.3, fontFace: SERIF, fontSize: 24, italic: true } });
    label(s, "Designathon 2026 · [Team]", 0.5, 5.55, 5.4);
    mono(s, SITE, 0.5, 5.9, 5.4, 0.3, { fontSize: 12 });
    const cards = [
      ["performance-chenille-curved-back-dining-chair-0", "LOT 001 · DINING CHAIR", "$105", "$41.20"],
      ["wool-cashmere-cocoon-coat-0", "LOT 002 · WOOL COAT", "$70", "$31.85"],
      ["chloe-hand-knotted-wool-rug-0", "LOT 003 · WOOL RUG", "$126", "$0 → free"],
    ];
    cards.forEach(([img, lab, was, now], i) => {
      const x = 6.45 + i * 2.15, w = 1.95, h = 2.7, y = 1.25;
      photo(s, P[img], x, y, w, h, lab);
      mono(s, lab, x, y + h + 0.12, w, 0.22, { fontSize: 9 });
      s.addText(now, { x, y: y + h + 0.4, w, h: 0.45, isTextBox: true, margin: 0, fontFace: SERIF, fontSize: 24, color: INK, valign: "bottom" });
      mono(s, "was " + was, x, y + h + 0.9, w, 0.22, { fontSize: 10, color: SOFT, strike: "sngStrike" });
      // melt bar
      s.addShape("rect", { x, y: y + h + 1.2, w, h: 0.08, fill: { type: "none" }, line: { color: INK, width: 0.75 } });
      s.addShape("rect", { x, y: y + h + 1.2, w: w * [0.39, 0.45, 0.02][i], h: 0.08, fill: { color: INK }, line: { color: INK, width: 0.75 } });
    });
    mono(s, "Real Quince products, as listed in the Melt demo market. Prices melting live.", 6.45, 5.75, 6.3, 0.25, { fontSize: 9, color: SOFT });
  }

  // ============ 02 STORY ============
  {
    const s = add("The problem", "CONTENT", "01 · THE STORY", "Two students, one hallway",
      "[0:18 · ends 0:28]\nMeet Maya. She's a composite, but you have met her. An international freshman, she lands in August with two suitcases, to an empty room: no lamp, no chair, no pan.\nThree months earlier, in May, the students leaving that same hall filled a forty-yard dumpster by the loading dock. Nobody wanted it thrown away; there just wasn't time. Same objects. Wrong time.");
    mono(s, "ILLUSTRATIVE COMPOSITE · NOT A REAL PERSON", 6.33, 0.55, 6.5, 0.25, { align: "right", fontSize: 11 });
    const cols = [
      ["italian-leather-midcentury-sofa-1", "May · move-out week", "The leaving", "A senior has 72 hours to empty a room. The sofa, the lamp, the rice cooker: into the 40-yard dumpster by the loading dock. Nobody wanted it thrown away. There was no time to find a buyer."],
      ["carry-on-suitcase-1", "August · move-in day", "The arriving", "Maya, an international freshman, lands with two suitcases. Her room has a bed frame and a bare desk. Everything she needs was in that building three months ago, and she will buy it all again, new."],
    ];
    cols.forEach(([img, k, h, b], i) => {
      const x = 0.5 + i * 6.3;
      photo(s, P[img], x, 1.95, 2.4, 3.0, h);
      label(s, k, x + 2.7, 1.95, 3.3);
      T(s, { text: h, opts: { x: x + 2.7, y: 2.3, w: 3.3, h: 0.5, fontFace: SERIF, fontSize: 24 } });
      T(s, { text: b, opts: { x: x + 2.7, y: 2.9, w: 3.3, h: 2.1, fontSize: 14, lineSpacingMultiple: 1.1 } });
    });
    rule(s, 0.5, 5.35, 12.33);
    T(s, { text: "Same objects. Wrong time.", opts: { x: 0.5, y: 5.55, w: 12.33, h: 0.7, fontFace: SERIF, fontSize: 36, italic: true } });
    source(s, "Composite drawn from the move-out and basic-needs data on the next two slides.");
  }

  // ============ 03 WASTE ============
  {
    const s = add("The problem", "CONTENT", "02 · THE PROBLEM · 1 / 2", "The dumpster is on the calendar",
      "[0:16 · ends 0:44]\nThis isn't an anecdote. The EPA counts twelve million tons of furniture and furnishings in US municipal waste, and about eighty percent of it is landfilled.\nAt Michigan State, crews hauled two hundred and fifty tons out of residence halls in a single move-out week; forty-four were resold. And that's a success story.");
    label(s, "US furniture & furnishings in municipal waste, 2018", 0.5, 1.95, 5.6);
    s.addText([{ text: "12.1M", options: { fontSize: 96 } }, { text: " tons", options: { fontSize: 32 } }],
      { x: 0.5, y: 2.25, w: 5.8, h: 1.45, isTextBox: true, margin: 0, fontFace: SERIF, color: INK, valign: "bottom" });
    T(s, { text: "About 80% of it was landfilled, roughly 9.7 million tons. Less than 0.5% was recycled. Move-out is that problem with a date on it.", opts: { x: 0.5, y: 3.95, w: 5.4, h: 1.2, fontSize: 16, lineSpacingMultiple: 1.1 } });
    vrule(s, 6.6, 1.95, 4.4);
    label(s, "One campus · one week · Michigan State, spring 2024", 7.0, 1.95, 5.8);
    s.addChart(pres.charts.BAR, [{ name: "Tons", labels: ["Picked up from residence halls", "Resold via Surplus Store"], values: [250, 44] }], {
      x: 6.9, y: 2.3, w: 5.95, h: 2.4, barDir: "bar", chartColors: [INK], showValue: true, dataLabelPosition: "outEnd", dataLabelFormatCode: '0" t"',
      dataLabelColor: INK, dataLabelFontSize: 14, dataLabelFontFace: "+mn-lt", catAxisLabelColor: INK, catAxisLabelFontSize: 12, catAxisLabelFontFace: "+mn-lt",
      valAxisHidden: true, valGridLine: { style: "none" }, catGridLine: { style: "none" }, catAxisLineColor: INK, showLegend: false, barGapWidthPct: 45,
      valAxisMaxVal: 300, catAxisOrientation: "maxMin", plotArea: { fill: { color: PAPER } }, chartArea: { fill: { color: PAPER } },
    });
    T(s, { text: "And this is a success story: a dedicated crew working one frantic week. BU's volunteer drive diverted 226,000 lb the same spring. The goods exist; the timing fails.", opts: { x: 7.0, y: 4.85, w: 5.8, h: 1.1, fontSize: 14, lineSpacingMultiple: 1.1 } });
    source(s, "Sources · US EPA, Facts & Figures about Materials, Waste and Recycling: Durable Goods, Product-Specific Data (2018 data) · Bridge Michigan, \"Trash to treasure: rethinking waste in Michigan college towns\" (2024), MSU Surplus Store & Recycling Center · BU Sustainability, \"Goodwill, Not Landfill reaches record numbers in 2024\" (Jul 18 2024)");
  }

  // ============ 04 NEED ============
  {
    const s = add("The problem", "CONTENT", "02 · THE PROBLEM · 2 / 2", "The need is in the same building",
      "[0:14 · ends 0:58]\nAnd the need is in the same building. In the Hope Center's latest survey, fifty-nine percent of students face basic-needs insecurity; forty-one percent are food insecure. The GAO puts it at three point eight million students.\nAnd nearly three hundred thousand new international students arrive each year, many with two suitcases.");
    const stats = [
      ["59%", "Basic-needs insecure", "faced food or housing insecurity, or homelessness."],
      ["41%", "Food insecure", "48% were housing insecure; 14% experienced homelessness."],
      ["3.8M", "Students, food insecure", "23% of US college students in 2020 (GAO)."],
      ["298,705", "New international students", "arrived in 2023/24. Many start with two suitcases."],
    ];
    stats.forEach(([n, l, b], i) => {
      const x = 0.5 + (i % 2) * 4.15, y = 1.95 + Math.floor(i / 2) * 2.25;
      rule(s, x, y, 3.85);
      bigStat(s, n, x, y + 0.12, 3.85, 54);
      label(s, l, x, y + 1.05, 3.85);
      T(s, { text: b, opts: { x, y: y + 1.35, w: 3.85, h: 0.6, fontSize: 14 } });
    });
    photo(s, P["handwoven-rattan-bed-0"], 9.15, 1.95, 3.68, 3.5, "A bare room");
    T(s, { text: "Waste and need share a building, and a calendar.", opts: { x: 9.15, y: 5.6, w: 3.68, h: 0.8, fontFace: SERIF, fontSize: 18, italic: true } });
    source(s, "Sources · The Hope Center, 2023–2024 Student Basic Needs Survey Report (Feb 26 2025; 74,350 students, 91 institutions) · US GAO, GAO-24-107074 (2024; 2020 NPSAS data) · IIE, Open Doors 2024 (1,126,690 international students in 2023/24)");
  }

  // ============ 05 INSIGHT ============
  {
    const s = add("The idea", "OPEN", "03 · THE INSIGHT · WHY IMPERMANENCE IS THE VALUE", null,
      "[0:14 · ends 1:12]\nHere's our insight. A permanent listing rots: it sits at the same price until the dumpster wins. A melting one moves.\nFrom thirty case studies we took four patterns: make the ending a witnessed event, make expiry visible, transform instead of vanishing, and give everyone one shared clock.");
    T(s, { text: [{ text: "A permanent listing rots.", options: { breakLine: true } }, { text: "A melting one moves.", options: { italic: true } }], opts: { x: 0.5, y: 1.0, w: 12.33, h: 2.0, fontFace: SERIF, fontSize: 54, valign: "middle" } });
    T(s, { text: "A fixed price waits, unchanged, until the dumpster wins. A price with a visible end makes everyone act, and gives the ending somewhere to go.", opts: { x: 0.5, y: 3.15, w: 8.5, h: 0.8, fontSize: 16 } });
    const pats = [
      ["Sand mandala · Temple burn", "The ending is witnessed", "Every price falls in public, on one shared curve."],
      ["Vaccine vial monitor", "Expiry made visible", "The curve is the label. You can read the time left."],
      ["Seed paper · kintsugi", "Transform, don't vanish", "$0 isn't the end: it becomes a gift, then a donation."],
      ["Wordle · hanami", "A shared clock", "Move-out becomes a campus ritual, not a solitary panic."],
    ];
    pats.forEach(([p, h, b], i) => {
      const x = 0.5 + i * 3.15, w = 2.9;
      rule(s, x, 4.3, w);
      mono(s, "0" + (i + 1) + " · " + p.toUpperCase(), x, 4.45, w, 0.25, { fontSize: 9 });
      T(s, { text: h, opts: { x, y: 4.8, w, h: 0.75, fontFace: SERIF, fontSize: 20 } });
      T(s, { text: b, opts: { x, y: 5.6, w, h: 0.9, fontSize: 14 } });
    });
    source(s, "Patterns drawn from 30 case studies of designed impermanence.");
  }

  // ============ 06 HOW IT WORKS ============
  {
    const s = add("The idea", "CONTENT", "04 · THE PRODUCT · NOTHING REACHES THE DUMPSTER", "Four states, one ending",
      "[0:15 · ends 1:27]\nFour states. A student lists an item with a hard deadline: their move-out. The price melts on a public curve.\nAt zero it isn't trash. It enters a two-hour Kindness Window for students with need. Still unclaimed? A donation truck is already routed to pick it up.");
    const st = [
      ["01", "Listed", "A student lists with a hard deadline: their move-out. They pick a melt temperament and see the curve first.", "$105 · T = move-out"],
      ["02", "Melting", "The price falls on a public curve. Watching adds heat that slows it. A gauge tells buyers when to claim.", "$105 → $0"],
      ["03", "Kindness Window", "At $0 it's held 2 hours for students who opted in with need flags, matched fairly, not first-click.", "$0 · 2 h · need first"],
      ["04", "Donation", "Still unclaimed? It's a stop on tonight's truck route to the campus reuse store. Never the dumpster.", "routed pickup"],
    ];
    st.forEach(([n, h, b, tag], i) => {
      const x = 0.5 + i * 3.15, w = 2.75;
      box(s, x, 2.0, w, 4.3, i === 0 ? null : null);
      bigStat(s, n, x + 0.2, 2.1, w - 0.4, 54);
      T(s, { text: h, opts: { x: x + 0.2, y: 3.05, w: w - 0.4, h: 0.8, fontFace: SERIF, fontSize: 22 } });
      T(s, { text: b, opts: { x: x + 0.2, y: 3.9, w: w - 0.4, h: 1.9, fontSize: 14, lineSpacingMultiple: 1.05 } });
      rule(s, x + 0.2, 5.7, w - 0.4, 0.5);
      mono(s, tag.toUpperCase(), x + 0.2, 5.8, w - 0.4, 0.3);
      if (i < 3) arrow(s, x + w + 0.05, 4.15, x + 3.1, 4.15);
    });
    source(s, "Seller: one listing, no haggling. Buyer: prices only go down. At $0 the item transforms; it never vanishes.");
  }

  // ============ 07 PRODUCT ============
  {
    const s = add("The product", "CONTENT", "05 · THE PRODUCT · WHAT IT LOOKS LIKE", "A market where every tile melts",
      "[0:12 · ends 1:39]\nThis is the real product. It looks like the marketplace students already use, stocked here with real Quince products. The difference: every tile is melting right now, and the bar under each photo is the time left.");
    const items = [
      ["Familiar on purpose", "A Marketplace-style grid with real product photos. Nothing new to learn."],
      ["Every price is live", "Prices fall every second. The bar under each photo is time left to move-out."],
      ["Built for the deadline", "Filter by melting fast, free now, most watched, or pick-up dorm."],
    ];
    items.forEach(([h, b], i) => {
      const y = 1.95 + i * 1.55;
      rule(s, 0.5, y, 4.2);
      T(s, { text: h, opts: { x: 0.5, y: y + 0.15, w: 4.2, h: 0.45, fontFace: SERIF, fontSize: 20 } });
      T(s, { text: b, opts: { x: 0.5, y: y + 0.6, w: 4.2, h: 0.8, fontSize: 14 } });
    });
    web(s, I["web-market-grid"], 5.43, 1.95, 7.4, SITE + "/market");
  }

  // ============ 08 ITEM + CURVE ============
  {
    const s = add("The math", "CONTENT", "06 · THE MATH · 1 / 3 · IT MUST HIT $0 ON TIME", "One item, one public curve",
      "[0:13 · ends 1:52]\nEvery item page shows its curve. A plain exponential never hits zero, so we normalise it to the deadline: the price is exactly p-zero at listing and exactly zero at move-out. You can see the base curve, the actual price with heat, and the claim gauge underneath.");
    web(s, I["web-item"], 0.5, 1.95, 7.3, SITE + "/item");
    const ex = 8.25, ew = 4.58;
    label(s, "Deadline-normalised melt", ex, 1.95, ew);
    const sup = (t) => ({ text: t, options: { superscript: true } });
    s.addText([{ text: "p(t) = p" }, { text: "0", options: { subscript: true } }, { text: " ·" }], { x: ex, y: 2.55, w: 1.75, h: 0.7, isTextBox: true, margin: 0, fontFace: SERIF, fontSize: 22, italic: true, color: INK, valign: "middle" });
    s.addText([{ text: "e" }, sup("−k·s(t)"), { text: " − e" }, sup("−kT")], { x: ex + 1.75, y: 2.3, w: 2.7, h: 0.45, isTextBox: true, margin: 0, fontFace: SERIF, fontSize: 22, italic: true, color: INK, align: "center", valign: "bottom" });
    rule(s, ex + 1.8, 2.9, 2.6, 1);
    s.addText([{ text: "1 − e" }, sup("−kT")], { x: ex + 1.75, y: 2.98, w: 2.7, h: 0.45, isTextBox: true, margin: 0, fontFace: SERIF, fontSize: 22, italic: true, color: INK, align: "center", valign: "top" });
    const defs = [["p(0) = p₀", "full price at listing"], ["p(T) = 0", "exactly $0 at move-out, T hours later"], ["k", "the seller's melt temperament, per hour"], ["s(t)", "effective melt time; heat bends it"]];
    defs.forEach(([a, b], i) => {
      const y = 3.75 + i * 0.5;
      rule(s, ex, y, ew, 0.5);
      s.addText(a, { x: ex, y: y + 0.08, w: 1.3, h: 0.35, isTextBox: true, margin: 0, fontFace: SERIF, italic: true, fontSize: 16, color: INK });
      s.addText(b, { x: ex + 1.35, y: y + 0.1, w: ew - 1.35, h: 0.35, isTextBox: true, margin: 0, fontFace: SANS, fontSize: 13, color: INK });
    });
    T(s, { text: "Sellers pick Gentle (k = 0.01), Steady (0.025) or Fast (0.05) and preview the curve before posting. The displayed price rounds to cents and never increases.", opts: { x: ex, y: 5.85, w: ew, h: 0.8, fontSize: 13 } });
    source(s, "melt/MATH.md §1 · screenshot: live item page, Chloe Hand-Knotted Wool Rug");
  }

  // ============ 09 HEAT + GAUGE (native chart) ============
  {
    const s = add("The math", "CONTENT", "06 · THE MATH · 2 / 3 · HEAT SLOWS THE CLOCK, NEVER STOPS IT", "Three temperaments, one deadline",
      "[0:15 · ends 2:07]\nHere are the three temperaments, computed from the equation for an eighty-dollar lamp over one week. Every one hits zero on time.\nWatching adds Hawkes-style heat that slows the item's clock, but in the last twenty-four hours it blends back to wall time. And buyers get a claim gauge: a Gamma–Poisson demand estimate tells you the moment the risk of losing it outweighs the savings of waiting.");
    const p0 = 80, TT = 168, ts = [];
    for (let t = 0; t <= TT; t += 4) ts.push(t);
    const series = [["Gentle · k = 0.01", 0.01], ["Steady · k = 0.025", 0.025], ["Fast · k = 0.05", 0.05]].map(([n, k]) => ({
      name: n, labels: ts.map((t) => (t % 24 === 0 ? t + "h" : "")), values: ts.map((t) => Math.round(meltP(p0, k, TT, t) * 100) / 100),
    }));
    s.addChart(pres.charts.LINE, series, {
      x: 0.4, y: 1.85, w: 7.5, h: 4.6, chartColors: [FAINT, SOFT, INK], lineSize: 2.5, lineDataSymbol: "none",
      showLegend: true, legendPos: "t", legendColor: INK, legendFontSize: 12, legendFontFace: "+mn-lt",
      catAxisLabelColor: INK, valAxisLabelColor: INK, catAxisLabelFontSize: 11, valAxisLabelFontSize: 11, catAxisLabelFontFace: "+mn-lt", valAxisLabelFontFace: "+mn-lt",
      catAxisLabelFrequency: 6, catAxisLineColor: INK, valAxisLineShow: false, valAxisLabelFormatCode: '"$"0', valAxisMaxVal: 80, valAxisMajorUnit: 20,
      valGridLine: { color: "D6D1C2", size: 0.5 }, catGridLine: { style: "none" },
      showCatAxisTitle: true, catAxisTitle: "Hours since listing (T = 168 h, one week)", catAxisTitleColor: INK, catAxisTitleFontSize: 11, catAxisTitleFontFace: "+mn-lt",
      plotArea: { fill: { color: PAPER } }, chartArea: { fill: { color: PAPER } },
    });
    const ex = 8.3, ew = 4.53;
    const sup = (t) => ({ text: t, options: { superscript: true } });
    const sub = (t) => ({ text: t, options: { subscript: true } });
    label(s, "Heat · watching slows the melt", ex, 1.95, ew);
    s.addText([{ text: "H(t) = Σ e" }, sup("−(t−tᵢ)/τ")], { x: ex, y: 2.25, w: ew, h: 0.42, isTextBox: true, margin: 0, fontFace: SERIF, italic: true, fontSize: 18, color: INK, valign: "middle" });
    s.addText("ds/dt = 1 / (1 + β·H(t))", { x: ex, y: 2.67, w: ew, h: 0.42, isTextBox: true, margin: 0, fontFace: SERIF, italic: true, fontSize: 18, color: INK, valign: "middle" });
    T(s, { text: "Each view, watch or bid is a Hawkes-style event (τ = 6 h, β = 0.15). In the last 24 h s(t) blends back to wall time, so the price still reaches $0 on time.", opts: { x: ex, y: 3.15, w: ew, h: 0.9, fontSize: 13 } });
    rule(s, ex, 4.2, ew);
    label(s, "Claim gauge · optimal stopping", ex, 4.35, ew);
    s.addText([{ text: "−p′(t*) ≤ h(t*) · (v − p(t*))" }], { x: ex, y: 4.65, w: ew, h: 0.45, isTextBox: true, margin: 0, fontFace: SERIF, italic: true, fontSize: 18, color: INK, valign: "middle" });
    s.addText([{ text: "Demand λ ~ Gamma(α" }, sub("0"), { text: "+n, β" }, sub("0"), { text: "+t); hazard h = λ̂·q(p). When waiting saves less per hour than the risk of losing it costs, the gauge flips to CLAIM NOW." }],
      { x: ex, y: 5.2, w: ew, h: 1.2, isTextBox: true, margin: 0, fontFace: SANS, fontSize: 13, color: INK, valign: "top" });
    source(s, "Curves computed from p(t) = p₀(e^(−kt) − e^(−kT)) / (1 − e^(−kT)), p₀ = $80, no heat · melt/MATH.md §1–4");
  }

  // ============ 10 KINDNESS + ROUTES ============
  {
    const s = add("The math", "CONTENT", "06 · THE MATH · 3 / 3 · THE ENDING, ENGINEERED", "At $0: fairness, then a truck",
      "[0:14 · ends 2:21]\nAt zero, fairness takes over. Gale–Shapley matches items to students by need score, with a lottery tie-break so it's not first-come-first-served, and the result is stable.\nWhatever's left becomes truck stops: Clarke–Wright savings plus 2-opt cut the route roughly in half.");
    const cols = [
      [I["web-kindness"], "/kindness", "Kindness Window · Gale–Shapley · 2 h", "Students rank items by distance and category; items rank students by need, N = Σwⱼ·flagⱼ + ε, with a seeded lottery ε. Stable, and never first-click."],
      [I["web-routes"], "/routes", "Donation · Clarke–Wright + 2-opt", "S(i,j) = d(0,i) + d(0,j) − d(i,j), merged by savings while load ≤ Q; 2-opt untangles crossings. Here: −48.5% distance vs naive."],
    ];
    cols.forEach(([img, u, h, b], i) => {
      const x = 0.5 + i * 6.33, w = 6.0;
      const bot = web(s, img, x, 1.95, w, SITE + u);
      label(s, h, x, bot + 0.2, w);
      T(s, { text: b, opts: { x, y: bot + 0.5, w, h: 0.85, fontSize: 13 } });
    });
  }

  // ============ 11 WHO BUYS WHO SELLS ============
  {
    const s = add("The business", "CONTENT", "07 · THE MARKET · TWO SIDES AND A PAYER", "Who sells, who buys, who pays",
      "[0:20 · ends 2:41]\nTwo sides, one clock. Sellers are students who are leaving: seniors, study-abroad, summer leavers, with a fixed deadline, no car and no storage. They get cash earlier, zero effort and a guaranteed exit.\nBuyers are students arriving or staying: freshmen, international students, interns. Prices only go down, and need-flagged students get a free first claim.\nAnd the university pays, because move-out already costs it hauling, tipping fees and overtime.");
    const side = (x, k, h, who, gets) => {
      box(s, x, 1.95, 3.35, 4.55);
      label(s, k, x + 0.2, 2.1, 3.0);
      T(s, { text: h, opts: { x: x + 0.2, y: 2.4, w: 3.0, h: 0.85, fontFace: SERIF, fontSize: 22 } });
      T(s, { text: who, opts: { x: x + 0.2, y: 3.3, w: 3.0, h: 0.9, fontSize: 12, color: SOFT } });
      rule(s, x + 0.2, 4.2, 2.95, 0.5);
      T(s, { text: gets.map((g, i) => ({ text: g, options: { bullet: true, breakLine: i < gets.length - 1 } })), opts: { x: x + 0.2, y: 4.3, w: 3.0, h: 2.1, fontSize: 13, paraSpaceAfter: 4 } });
    };
    side(0.5, "Sellers · leaving", "Students who are moving out", "Seniors, study-abroad and summer leavers, dorm switchers. Fixed deadline, no car, no storage.",
      ["Cash, earlier: an $80 futon sells for $40–60, not $0", "Zero effort: one listing, no haggling", "A guaranteed exit, plus a donation receipt"]);
    side(9.48, "Buyers · arriving", "Students moving in", "Freshmen and transfers, international students, grad students, interns, the local community.",
      ["Prices that only go down", "A room for a fraction of new: a $105 chair in the $40s", "Kindness Window: need-flagged students claim free, first"]);
    // centre column
    const cx = 5.55, cw = 2.23;
    box(s, cx, 1.95, cw, 0.95);
    label(s, "University", cx + 0.15, 2.05, cw - 0.3, { align: "center" });
    T(s, { text: "res-life · sustainability", opts: { x: cx + 0.1, y: 2.4, w: cw - 0.2, h: 0.35, fontSize: 11, align: "center" } });
    box(s, cx, 3.55, cw, 1.1, INK);
    T(s, { text: "Melt", opts: { x: cx, y: 3.55, w: cw, h: 1.1, fontFace: SERIF, fontSize: 40, color: PAPER, align: "center", valign: "middle" } });
    box(s, cx, 5.55, cw, 0.95);
    label(s, "Brands & cities", cx + 0.15, 5.65, cw - 0.3, { align: "center" });
    T(s, { text: "resale credit · Melt Week", opts: { x: cx + 0.1, y: 6.0, w: cw - 0.2, h: 0.35, fontSize: 11, align: "center" } });
    arrow(s, cx + cw / 2, 2.9, cx + cw / 2, 3.55);
    arrow(s, cx + cw / 2, 5.55, cx + cw / 2, 4.65);
    mono(s, "license ~$1.50/bed/yr", cx + cw / 2 + 0.08, 3.08, 2.0, 0.3, { fontSize: 9 });
    mono(s, "per verified resale", cx + cw / 2 + 0.08, 4.95, 2.0, 0.3, { fontSize: 9 });
    // seller <-> melt
    arrow(s, 3.85, 3.8, 5.55, 3.8);
    mono(s, "item, listed free", 3.95, 3.5, 1.55, 0.28, { fontSize: 9 });
    arrow(s, 5.55, 4.4, 3.85, 4.4);
    mono(s, "full sale price", 3.95, 4.47, 1.55, 0.28, { fontSize: 9 });
    // melt <-> buyer
    arrow(s, 7.78, 3.8, 9.48, 3.8);
    mono(s, "item, melted price", 7.88, 3.5, 1.6, 0.28, { fontSize: 9 });
    arrow(s, 9.48, 4.4, 7.78, 4.4);
    mono(s, "price + 8% fee\n$0 on free claims", 7.88, 4.47, 1.6, 0.45, { fontSize: 9 });
    source(s, "Source · melt/BUSINESS.md. Sellers never pay. Free and Kindness claims are always $0.");
  }

  // ============ 12 MONEY ============
  {
    const s = add("The business", "CONTENT", "08 · THE MODEL · PRICING HYPOTHESES (EST.)", "How everyone makes money",
      "[0:20 · ends 3:01]\nFive revenue lines. The campus license, about a dollar fifty a bed, because Melt cuts hauling and tipping fees and gives them diversion data. An eight percent fee on paid sales, zero on free claims. Optional delivery and summer holds. Brands like Quince pay for verified resale. And cities sponsor a Melt Week at lease turnover.\nOne campus, eight thousand beds: about twenty-six thousand dollars a year, and students keep eighty-two thousand that would have gone in the dumpster.");
    const H = (t) => ({ text: t, options: { bold: true, fontFace: SANS, fontSize: 10, color: INK, charSpacing: 1 } });
    const rows = [[H("STREAM"), H("WHO PAYS"), H("PRICE (EST.)")]];
    const data = [
      ["Campus license", "cuts hauling & tipping fees; diversion reporting", "Res-life or sustainability office", "~$1.50 / bed / yr"],
      ["Sale fee", "fair, cheap, on what would be lost", "Buyer, at checkout", "8% of paid sales; $0 on free & Kindness"],
      ["Delivery & hold", "no car, no storage", "Buyer, optional", "$12 delivery · $15 hold to Aug"],
      ["Brand recommerce", "verified second-life data, take-back", "Brands (e.g. Quince)", "per verified resale"],
      ["City Melt Week", "lease turnover dumpster days", "Municipal sanitation", "sponsorship or grant"],
    ];
    data.forEach(([a, why, b, c]) => rows.push([
      { text: [{ text: a, options: { fontFace: SERIF, fontSize: 15, breakLine: true } }, { text: why, options: { fontSize: 10, color: SOFT } }] },
      { text: b, options: { fontSize: 12 } }, { text: c, options: { fontSize: 12 } },
    ]));
    s.addTable(rows, {
      x: 0.5, y: 1.95, w: 7.6, colW: [3.1, 2.2, 2.3], fontFace: SANS, color: INK, fill: { color: PAPER }, valign: "middle",
      border: [{ type: "none" }, { type: "none" }, { pt: 0.75, color: INK }, { type: "none" }], margin: [0.05, 0.08, 0.05, 0],
      rowH: [0.35, 0.78, 0.78, 0.78, 0.78, 0.78],
    });
    const rx = 8.6, rw = 4.23;
    label(s, "One campus, one spring · est.", rx, 1.95, rw);
    s.addText([{ text: "≈ $26k", options: { fontSize: 66 } }], { x: rx, y: 2.2, w: rw, h: 1.05, isTextBox: true, margin: 0, fontFace: SERIF, color: INK, valign: "bottom" });
    T(s, { text: "per campus per year. Marginal cost: hosting, plus a truck day the university already runs.", opts: { x: rx, y: 3.35, w: rw, h: 0.6, fontSize: 13 } });
    s.addChart(pres.charts.BAR, [{ name: "$", labels: ["License", "Delivery & holds", "Sale fees"], values: [12000, 7800, 6600] }], {
      x: rx - 0.1, y: 3.95, w: rw + 0.1, h: 1.55, barDir: "bar", chartColors: [INK], showValue: true, dataLabelPosition: "outEnd", dataLabelFormatCode: '"$"0.0,"k"',
      dataLabelColor: INK, dataLabelFontSize: 11, dataLabelFontFace: "+mn-lt", catAxisLabelColor: INK, catAxisLabelFontSize: 11, catAxisLabelFontFace: "+mn-lt",
      valAxisHidden: true, valGridLine: { style: "none" }, catGridLine: { style: "none" }, catAxisLineColor: INK, showLegend: false, barGapWidthPct: 40,
      valAxisMaxVal: 18500, catAxisOrientation: "maxMin", plotArea: { fill: { color: PAPER } }, chartArea: { fill: { color: PAPER } },
    });
    T(s, { text: "8,000 beds × 25% list × 3 items = 6,000 listings · 55% sell at avg $25 = $82,500 GMV → $6,600 fees · 8,000 × $1.50 = $12,000 · ~600 × $13 ≈ $7,800. Students keep ~$82k; need-flagged students receive the free 20%.", opts: { x: rx, y: 5.55, w: rw, h: 1.0, fontSize: 10, color: SOFT } });
    source(s, "All prices are pricing hypotheses (est.), not contracts · melt/BUSINESS.md");
  }

  // ============ 13 IMPACT ============
  {
    const s = add("The business", "CONTENT", "09 · THE IMPACT · PILOT PROJECTION, NOT MEASURED RESULTS", "What one spring diverts",
      "[0:13 · ends 3:14]\nAnd the impact. These are projections, and the assumptions are on the slide: four thousand residents in the pilot halls, a quarter listing three items each.\nThat's about thirty-four tonnes diverted, roughly seventy tonnes of CO₂-equivalent avoided, and about ninety thousand dollars kept in student pockets.");
    label(s, "Stated assumptions (est.)", 0.5, 1.95, 4.3);
    const asm = [["Residents in pilot halls", "4,000"], ["Share who list", "25%"], ["Items per lister", "3"], ["Mean item mass", "12 kg"], ["Mean list price p₀", "$60"],
      ["Sold · mean sale", "55% · 45% p₀"], ["Kindness / donated / landfill", "20 / 20 / 5%"], ["Emission factor", "2.1 kgCO₂e/kg"]];
    asm.forEach(([a, b], i) => {
      const y = 2.3 + i * 0.47;
      rule(s, 0.5, y, 4.3, 0.5);
      s.addText(a, { x: 0.5, y: y + 0.09, w: 2.8, h: 0.32, isTextBox: true, margin: 0, fontFace: SANS, fontSize: 12, color: INK });
      s.addText(b, { x: 3.2, y: y + 0.09, w: 1.6, h: 0.32, isTextBox: true, margin: 0, fontFace: MONO, fontSize: 12, color: INK, align: "right" });
    });
    const st = [["34,200 kg", "diverted from landfill"], ["72 t", "CO₂e avoided · est."], ["$90,450", "kept in student pockets"]];
    st.forEach(([n, l], i) => {
      const x = [5.4, 8.3, 10.45][i], w = [2.7, 2.0, 2.38][i];
      bigStat(s, n, x, 1.95, w, 28);
      label(s, l, x, 2.45, w, { fontSize: 9 });
    });
    rule(s, 5.4, 2.95, 7.43);
    s.addChart(pres.charts.BAR, [{ name: "kg", labels: ["Sold", "Kindness Window", "Donated", "Landfill"], values: [19800, 7200, 7200, 1800] }], {
      x: 5.3, y: 3.05, w: 7.55, h: 3.1, barDir: "col", chartColors: [INK], showValue: true, dataLabelPosition: "outEnd", dataLabelFormatCode: '#,##0" kg"',
      dataLabelColor: INK, dataLabelFontSize: 12, dataLabelFontFace: "+mn-lt", catAxisLabelColor: INK, catAxisLabelFontSize: 12, catAxisLabelFontFace: "+mn-lt",
      valAxisHidden: true, valGridLine: { style: "none" }, catGridLine: { style: "none" }, catAxisLineColor: INK, showLegend: false, barGapWidthPct: 55,
      valAxisMaxVal: 23000, showTitle: true, title: "Where 3,000 items end up · 95% diverted", titleColor: INK, titleFontSize: 12, titleFontFace: "+mn-lt",
      plotArea: { fill: { color: PAPER } }, chartArea: { fill: { color: PAPER } },
    });
    source(s, "Projection. EF in the spirit of US EPA WARM (landfill + avoided production), est. · $ kept = Σ(p₀ − p_sold) for sold and Kindness items · melt/MATH.md §7");
  }

  // ============ 14 LIVE DEMO ============
  {
    const s = add("Live", "CONTENT", "10 · THE DEMO · RUNNING LIVE, NOT A RECORDING", "Live demo",
      "[0:25 · ends 3:39]\nLet's see it. [Open " + SITE + "] This is the market: every tile is melting right now, real Quince products.\n[Item] Here's one listing: its curve, its heat, and the claim gauge telling me to wait.\n[Kindness] At zero it moves to the Kindness Window, matched live.\n[Routes] What nobody claims becomes a stop on tonight's route.\n[Impact] And every outcome adds to the campus ledger: kilograms diverted, CO₂ avoided, dollars kept in student pockets.\n[Open " + SITE + "/live on the projector for the next slide.]");
    web(s, I["web-live"], 0.5, 1.95, 7.2, SITE + "/live");
    mono(s, "PROJECTOR · THE JUDGES' AUCTION", 0.5, 6.76, 7.2, 0.25);
    const ph = 4.6;
    const w1 = phone(s, I["phone-wallet"], 8.2, 1.95, ph, "Judge's wallet: $150 Melt Bucks");
    phone(s, I["phone-caught"], 8.2 + w1 + 0.3, 1.95, ph, "Caught for $79.12");
    mono(s, "YOUR WALLET · $150", 8.2, 1.95 + ph + 0.1, w1, 0.25, { align: "center", fontSize: 9 });
    mono(s, "CAUGHT · NOTHING WASTED", 8.2 + w1 + 0.3, 1.95 + ph + 0.1, w1, 0.25, { align: "center", fontSize: 9 });
  }

  // ============ 15 SCAN TO BID ============
  {
    const s = add("Live", "OPEN", "11 · YOUR TURN · THE JUDGES' MELTING AUCTION", null,
      "[1:00 · ends 4:39]\nNow it's your turn. Take out your phone and scan the code. You're joining a melting auction with a wallet of a hundred and fifty Melt Bucks. Each lot starts at full price on the same curve you just saw, compressed from a week into seconds.\nThe first tap wins. If two of you tap within the same fifty milliseconds, need score breaks the tie, then a lottery.\n[Start the auction on the projector. Let it run; narrate sparingly.]\nWatch the room: nobody wants to be first, and nobody wants to lose it. That tension is the whole product.\n[Winner] And that's the point: the ending was an event you all witnessed together.");
    const q = 4.7;
    s.addImage({ path: I["qr-join"], x: 0.6, y: 1.0, w: q, h: q, altText: "QR code to " + SITE + "/join" });
    s.addShape("rect", { x: 0.6, y: 1.0, w: q, h: q, fill: { type: "none" }, line: { color: INK, width: 1.5 } });
    s.addText(SITE + "/join", { x: 0.3, y: 5.9, w: q + 0.6, h: 0.45, isTextBox: true, margin: 0, fontFace: MONO, fontSize: 20, bold: true, color: INK, align: "center", valign: "middle" });
    mono(s, "NO APP · NO SIGN-UP", 0.6, 6.45, q, 0.25, { align: "center" });
    T(s, { text: "Scan to bid", opts: { x: 5.9, y: 1.0, w: 4.4, h: 1.0, fontFace: SERIF, fontSize: 48, valign: "middle" } });
    const steps = [["01", "Scan to join. You get a wallet of $150 in Melt Bucks."], ["02", "Each lot starts at list price and melts to $0 in seconds, on the same curve."], ["03", "First tap wins. Ties inside 50 ms go to need score, then lottery. No tap? It goes to a student in need."]];
    steps.forEach(([n, t], i) => {
      const y = 2.35 + i * 1.3;
      rule(s, 5.9, y, 3.9);
      T(s, { text: n, opts: { x: 5.9, y: y + 0.12, w: 0.6, h: 0.5, fontFace: SERIF, fontSize: 26 } });
      T(s, { text: t, opts: { x: 6.55, y: y + 0.15, w: 3.25, h: 1.05, fontSize: 14 } });
    });
    phone(s, I["phone-bidding"], 10.2, 1.0, 5.8, "Judge's phone: CATCH IT button");
  }

  // ============ 16 WHY NOW / ASK ============
  {
    const s = add("The ask", "CONTENT", "12 · THE ASK · PILOT, SPRING 2027 MOVE-OUT", "Why now, and what we need",
      "[0:11 · ends 4:50]\nWhy now? The need is measured, diversion is reported, and move-out already happens on a known date.\nAnd the same engine works anywhere there's a hard deadline and too much stuff.\nOur ask: one residence hall, one May. Let us melt it.");
    const r = [["01", "The need is measured", "Basic-needs surveys now quantify who goes without: 59% in the Hope Center's latest."],
      ["02", "Diversion is reported", "Campuses publish waste numbers and run heroic move-out drives. They need a system, not a scramble."],
      ["03", "The deadline exists", "Move-out is on the calendar every year. T is free infrastructure."]];
    r.forEach(([n, h, b], i) => {
      const y = 1.95 + i * 1.25;
      rule(s, 0.5, y, 6.9);
      T(s, { text: n, opts: { x: 0.5, y: y + 0.15, w: 0.8, h: 0.6, fontFace: SERIF, fontSize: 32 } });
      T(s, { text: h, opts: { x: 1.4, y: y + 0.15, w: 6.0, h: 0.4, fontFace: SERIF, fontSize: 20 } });
      T(s, { text: b, opts: { x: 1.4, y: y + 0.55, w: 6.0, h: 0.6, fontSize: 14 } });
    });
    rule(s, 0.5, 5.7, 6.9);
    label(s, "Same engine, any hard deadline", 0.5, 5.85, 6.9);
    T(s, { text: "1 hall → 1 campus → college-town Melt Week → lease turnovers · office closures · festivals · end-of-season retail", opts: { x: 0.5, y: 6.15, w: 6.9, h: 0.55, fontSize: 13 } });
    box(s, 7.9, 1.95, 4.93, 4.75, INK);
    label(s, "The ask", 8.2, 2.2, 4.3, { color: PAPER });
    T(s, { text: [{ text: "One hall.", options: { breakLine: true } }, { text: "One May." }], opts: { x: 8.2, y: 2.6, w: 4.4, h: 1.9, fontFace: SERIF, fontSize: 54, color: PAPER } });
    T(s, { text: "A residence hall for the spring 2027 move-out, an introduction to the sustainability and basic-needs offices, and the res-life calendar. We'll melt it, and publish every kilogram.", opts: { x: 8.2, y: 4.65, w: 4.35, h: 1.8, fontSize: 14, color: PAPER } });
  }

  // ============ 17 CLOSE ============
  {
    const s = add("The ask", "OPEN", "COLOPHON · MELT · DESIGNATHON 2026", null,
      "[0:10 · ends 5:00]\nEvery move-out is an ending. Melt makes it a beginning, for the next student. Thank you.");
    T(s, { text: [{ text: "An ending that", options: { breakLine: true } }, { text: "becomes a ", options: {} }, { text: "beginning.", options: { italic: true } }], opts: { x: 0.5, y: 1.6, w: 8.2, h: 2.9, fontFace: SERIF, fontSize: 64, valign: "middle" } });
    rule(s, 0.5, 5.0, 7.6);
    label(s, "[Team] · Designathon 2026", 0.5, 5.2, 7.6);
    T(s, { text: "Every move-out is an ending. Melt makes it a beginning, for the next student.", opts: { x: 0.5, y: 5.55, w: 7.6, h: 0.8, fontSize: 16 } });
    s.addImage({ path: I["qr-site"], x: 9.3, y: 1.75, w: 3.3, h: 3.3, altText: "QR code to " + SITE });
    s.addShape("rect", { x: 9.3, y: 1.75, w: 3.3, h: 3.3, fill: { type: "none" }, line: { color: INK, width: 1.5 } });
    mono(s, SITE, 8.95, 5.2, 4.0, 0.35, { align: "center", fontSize: 14 });
    mono(s, "TRY IT · EVERY PRICE IS MELTING NOW", 8.95, 5.6, 4.0, 0.3, { align: "center", fontSize: 9 });
  }

  await pres.writeFile({ fileName: OUT });
  if (SKILL) {
    const { applyTheme } = require(path.join(SKILL, "scripts/apply_theme.js"));
    await applyTheme(OUT, THEME);
  }
  fs.rmSync(TMP, { recursive: true, force: true });
  console.log("wrote", OUT, (fs.statSync(OUT).size / 1024 / 1024).toFixed(2) + " MB");
})().catch((e) => { console.error(e); process.exit(1); });
