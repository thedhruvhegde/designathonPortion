# Cobalt Grid — design system (deck + demo)

Japanese trend-report look: warm cream paper, electric cobalt ink, permanent graph-paper grid.
Two colors only. No radius, no shadows, no gradients.

## Tokens
| token | value |
|---|---|
| paper | #F0EBDE |
| paper-2 | #E6E0CE |
| ink | #1F2BE0 |
| ink-soft | #5560E5 |
| grid | rgba(31,43,224,0.10) |
| ink-faint | rgba(31,43,224,0.18) |
| edge | clamp(36px,3.6vw,80px) |
| edge-inner | clamp(60px,8vw,160px) |
| pad-top / pad-bottom | clamp(76px,8vh,130px) / clamp(100px,10vh,150px) |
| gap lg/md/sm/xs | clamp(28px,3vw,56px) / clamp(20px,2.2vh,36px) / clamp(14px,1.6vh,24px) / clamp(10px,1.2vh,18px) |

## Type (Newsreader 400 only · Hanken Grotesk 400/600 · DM Mono 400)
| token | size | lh | tracking |
|---|---|---|---|
| vbig-numeral | clamp(110px,min(11vw,18vh),240px) | .92 | -.015em |
| display-hero | clamp(100px,min(11vw,18vh),200px) | .92 | -.008em |
| display-closing | clamp(72px,min(8.4vw,14vh),180px) | .96 | -.005em |
| display-chapter | clamp(56px,min(6vw,10vh),130px) | 1 | -.005em |
| display-manifesto | clamp(56px,min(6.4vw,11vh),120px) | 1.05 | -.005em |
| display-quote | clamp(50px,min(5.6vw,9vh),110px) | 1.05 | -.005em |
| headline-index / headline | clamp(48px,min(5vw,8.5vh),100px) / clamp(46px,min(4.8vw,8.2vh),92px) | .95 | |
| ed-callout | clamp(28px,min(2.8vw,4.6vh),50px) | 1.1 | |
| row-headline / table-name | clamp(26px,2vw,40px) / clamp(20px,1.6vw,28px) | | |
| micro-strong / micro / micro-sm (Hanken 600 UPPER) | 13–16 / 12–14 / 11–12px | 1 | .16–.18em |
| body-lede / body-stat / body (Hanken 400) | 15–18 / 15–17 / 14–15px | 1.5 | |
| mono-tag / mono-tick / mono-chrome (DM Mono) | 13–15 / 12–14 / 11–13px | 1 | .04–.08em |

## Components
- **graph-paper-grid**: permanent `.stage::before`, 28–44px cells in `grid`. Never off.
- **hairlines**: 1.5px ink rules at ~2.6vh top and ~2vh bottom, inset by `edge`.
- **pagenum** (bottom-right) and **nav-hint** (bottom-left, 40% opacity), DM Mono, bottom clamp(48px,4.8vh,76px).
- **pixel-glitch**: stair-stepped SVG scanline column, right edge (left on colophon), 16–32vw wide.
- **qr-block**: 8×8 cell mosaic on paper with 4px pad and a 1.5px paper outset. 58–100px.
- **topbar-rule**: headline left + lab-tag right, 1.5px ink bottom border.
- **row-divider**: 1px ink-faint.
- **pixel-stack-bars**: column-reverse stacks of cells (off = grid, on = ink).
- **ledger-row**: grid 76px / .6fr / 1.4fr / .7fr / .5fr; deltas ↑ ↓ —.
- **vstack-label**: DM Mono, writing-mode vertical-rl.
- Slides: 100vw×100vh, `.slide.active`, 280ms opacity fade, arrow/space nav.

## Rules
Do: Newsreader 400 in ink only; tracked uppercase Hanken labels; grid + hairlines on every slide; pixel-stack charts.
Don't: a second hue, bold serif, rounded corners, shadows (except the QR anti-shadow), crowding manifesto/quote/colophon.

Fonts: https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,400..500;1,6..72,400..500&family=Hanken+Grotesk:wght@400..700&family=DM+Mono:wght@400..500&display=swap

The demo product uses the same palette, adapted slightly (interactive states use ink fill with paper text; focus rings 1.5px ink).
