/* Capture deck assets: website + phone screenshots and QR codes (cobalt on cream).
   Needs the local server running:  PORT=8790 node server/server.mjs
   Usage: node scripts/capture-assets.cjs [joinUrl] [siteUrl]   → writes ../deck/assets/*.png */
const { chromium } = require('playwright');
const path = require('path'), fs = require('fs');
const OUT = path.join(__dirname, '../../deck/assets'); fs.mkdirSync(OUT, { recursive: true });
const BASE = 'http://localhost:8790/web/';
const JOIN = process.argv[2] || 'https://meltshopping.vercel.app/join';
const SITE = process.argv[3] || 'https://meltshopping.vercel.app/';

(async () => {
  const b = await chromium.launch();
  // QR codes as crisp PNGs
  const q = await b.newPage({ deviceScaleFactor: 4, viewport: { width: 400, height: 400 } });
  const qrcode = new Function(fs.readFileSync(path.join(__dirname, '../web/vendor/qrcode.js'), 'utf8') + ';return qrcode;')();
  for (const [name, url] of [['qr-join', JOIN], ['qr-site', SITE]]) {
    const c = qrcode(0, 'M'); c.addData(url); c.make(); const n = c.getModuleCount(), m = 4, s = 400 / (n + 2 * m);
    let r = ''; for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (c.isDark(y, x)) r += `<rect x="${(x + m) * s}" y="${(y + m) * s}" width="${s + .3}" height="${s + .3}"/>`;
    await q.setContent(`<body style="margin:0;background:#F0EBDE"><svg width="400" height="400" style="display:block"><rect width="400" height="400" fill="#F0EBDE"/><g fill="#1F2BE0">${r}</g></svg></body>`);
    await q.screenshot({ path: `${OUT}/${name}.png`, clip: { x: 0, y: 0, width: 400, height: 400 } });
  }
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
  const p = await ctx.newPage();
  const shot = async (route, file, opts = {}) => { await p.goto(BASE + '#/' + route); await p.waitForTimeout(opts.wait || 1800); if (opts.scroll) { await p.mouse.wheel(0, opts.scroll); await p.waitForTimeout(800); } await p.screenshot({ path: `${OUT}/${file}.png` }); };
  await shot('market', 'web-market-hero');
  await shot('market', 'web-market-grid', { scroll: 1050 });
  await shot('item/m002', 'web-item');
  await shot('kindness', 'web-kindness');
  await shot('routes', 'web-routes');
  await shot('impact', 'web-impact');
  await shot('sell', 'web-sell');
  // live: projector + phone in the same room
  await p.goto(BASE + '#/live'); await p.waitForTimeout(1200);
  await p.click('#reset'); await p.waitForTimeout(500); await p.click('#bots'); await p.waitForTimeout(800);
  const phone = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
  await phone.goto(BASE + '#/join'); await phone.waitForTimeout(900); await phone.fill('#nm', 'Judge Rivera'); await phone.click('#go'); await phone.waitForTimeout(600);
  await phone.screenshot({ path: `${OUT}/phone-wallet.png` });
  await p.click('#next'); await phone.waitForTimeout(5200);
  await phone.screenshot({ path: `${OUT}/phone-bidding.png` });
  await p.screenshot({ path: `${OUT}/web-live.png` });
  await phone.click('#catch'); await phone.waitForTimeout(900);
  await phone.screenshot({ path: `${OUT}/phone-caught.png` });
  await p.waitForTimeout(700); await p.screenshot({ path: `${OUT}/web-live-sold.png` });
  // mobile market
  const m = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true });
  await m.goto(BASE + '#/market'); await m.waitForTimeout(1800); await m.mouse.wheel(0, 700); await m.waitForTimeout(600); await m.screenshot({ path: `${OUT}/phone-market.png` });
  await b.close(); console.log('assets →', OUT);
})();
