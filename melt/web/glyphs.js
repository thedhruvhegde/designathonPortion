/* Risograph line glyphs: one-ink cobalt line art on a 100×100 box, plus scanline fills.
   Drawn by hand for Melt; every glyph uses currentColor. */
const S = 'fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="square" stroke-linejoin="miter"';
const H = (id) => `fill="url(#${id})"`;
const G = {
  futon: (h) => `<rect x="12" y="44" width="76" height="22" ${H(h)}/><rect x="12" y="44" width="76" height="22" ${S}/><path d="M12 44 V30 H88 V44 M18 66 V76 M82 66 V76" ${S}/>`,
  fridge: (h) => `<rect x="28" y="14" width="44" height="72" ${H(h)}/><rect x="28" y="14" width="44" height="72" ${S}/><path d="M28 38 H72 M64 22 V32 M64 46 V60" ${S}/>`,
  lamp: (h) => `<path d="M34 18 H66 L74 44 H26 Z" ${H(h)}/><path d="M34 18 H66 L74 44 H26 Z M50 44 V80 M34 84 H66" ${S}/>`,
  desk: (h) => `<rect x="10" y="38" width="80" height="8" ${H(h)}/><path d="M10 38 H90 V46 H10 Z M16 46 V84 M84 46 V84 M60 46 V66 H84 M60 56 H84" ${S}/>`,
  chair: (h) => `<rect x="30" y="16" width="40" height="32" ${H(h)}/><path d="M30 16 H70 V48 H30 Z M26 56 H74 M50 56 V72 M34 84 L50 72 L66 84" ${S}/>`,
  microwave: (h) => `<rect x="12" y="28" width="76" height="46" ${H(h)}/><path d="M12 28 H88 V74 H12 Z M64 28 V74 M72 38 H80 M72 48 H80 M72 58 H80" ${S}/><rect x="20" y="36" width="36" height="30" fill="var(--paper)" ${S}/>`,
  rug: (h) => `<path d="M14 30 H86 V70 H14 Z" ${H(h)}/><path d="M14 30 H86 V70 H14 Z M24 40 L50 60 L76 40 M8 30 V70 M92 30 V70" ${S}/>`,
  bike: (h) => `<circle cx="26" cy="64" r="16" ${S}/><circle cx="74" cy="64" r="16" ${S}/><path d="M26 64 L42 38 H66 L74 64 M42 38 L52 64 L66 38 M38 30 H48 M62 28 H72" ${S}/><circle cx="52" cy="64" r="4" ${H(h)}/>`,
  books: (h) => `<rect x="18" y="20" width="16" height="64" ${H(h)}/><path d="M18 20 H34 V84 H18 Z M34 26 H50 V84 H34 M52 30 L66 27 L78 80 L64 84 Z" ${S}/>`,
  monitor: (h) => `<rect x="12" y="18" width="76" height="46" ${H(h)}/><path d="M12 18 H88 V64 H12 Z M50 64 V78 M32 82 H68" ${S}/>`,
  plant: (h) => `<path d="M32 60 H68 L62 86 H38 Z" ${H(h)}/><path d="M32 60 H68 L62 86 H38 Z M50 60 V36 M50 46 C40 44 30 34 30 22 C42 24 50 32 50 46 M50 40 C58 36 70 34 74 22 C62 22 52 30 50 40" ${S}/>`,
  mirror: (h) => `<rect x="32" y="10" width="36" height="80" ${H(h)}/><path d="M32 10 H68 V90 H32 Z M40 22 L56 38 M40 34 L50 44" ${S}/>`,
  shelf: (h) => `<rect x="24" y="12" width="52" height="76" ${H(h)}/><path d="M24 12 H76 V88 H24 Z M24 27 H76 M24 42 H76 M24 57 H76 M24 72 H76" ${S}/>`,
  kettle: (h) => `<path d="M28 40 H68 L72 82 H24 Z" ${H(h)}/><path d="M28 40 H68 L72 82 H24 Z M40 40 V30 H56 V40 M68 48 C84 48 84 70 70 72 M28 48 L14 40" ${S}/>`,
  parka: (h) => `<path d="M36 16 L22 26 L14 84 H32 V50 V86 H68 V50 V84 H86 L78 26 L64 16 C60 24 40 24 36 16 Z" ${H(h)}/><path d="M36 16 L22 26 L14 84 H32 M68 84 H86 L78 26 L64 16 C60 24 40 24 36 16 M32 46 V86 H68 V46 M50 22 V86" ${S}/>`,
  bins: (h) => `<rect x="16" y="50" width="68" height="34" ${H(h)}/><path d="M16 50 H84 V84 H16 Z M12 44 H88 V50 H12 Z M20 22 H80 V44 M16 18 H84" ${S}/>`,
  topper: (h) => `<path d="M10 52 L30 36 H90 L70 52 Z" ${H(h)}/><path d="M10 52 L30 36 H90 L70 52 Z M10 52 V62 H70 L90 46 V36 M70 52 V62" ${S}/>`,
  speaker: (h) => `<rect x="30" y="16" width="40" height="68" ${H(h)}/><path d="M30 16 H70 V84 H30 Z" ${S}/><circle cx="50" cy="60" r="12" fill="var(--paper)" ${S}/><circle cx="50" cy="32" r="5" fill="var(--paper)" ${S}/>`,
  beanbag: (h) => `<path d="M18 80 C10 54 30 26 52 26 C74 26 92 52 82 80 Z" ${H(h)}/><path d="M18 80 C10 54 30 26 52 26 C74 26 92 52 82 80 Z M30 54 C42 48 58 48 70 54" ${S}/>`,
  vacuum: (h) => `<rect x="44" y="40" width="22" height="32" ${H(h)}/><path d="M44 40 H66 V72 H44 Z M54 40 V12 H62 M40 84 H70 L66 72 H44 Z" ${S}/>`,
  lights: (h) => `<path d="M8 30 C30 52 70 52 92 30" ${S}/>${[18, 34, 50, 66, 82].map((x, i) => `<rect x="${x - 4}" y="${40 + (i % 2) * 6 + (i === 2 ? 4 : 0)}" width="8" height="12" ${H(h)}/><rect x="${x - 4}" y="${40 + (i % 2) * 6 + (i === 2 ? 4 : 0)}" width="8" height="12" ${S}/>`).join('')}`,
  truck: (h) => `<rect x="8" y="30" width="54" height="38" ${H(h)}/><path d="M8 30 H62 V68 H8 Z M62 44 H80 L92 56 V68 H62" ${S}/><circle cx="24" cy="72" r="8" fill="var(--paper)" ${S}/><circle cx="76" cy="72" r="8" fill="var(--paper)" ${S}/>`,
};
let n = 0;
/** glyph(name, {pitch}) → SVG string with its own scanline pattern (vertical lines, like the pixel-glitch) */
export function glyph(name, { pitch = 3.2, label = '' } = {}) {
  const id = 'sl' + (n++);
  const draw = G[name] || G.bins;
  return `<svg viewBox="0 0 100 100" role="img" aria-label="${label || name}" style="color:var(--ink)"><defs><pattern id="${id}" width="${pitch}" height="4" patternUnits="userSpaceOnUse"><rect width="${(pitch * 0.42).toFixed(2)}" height="4" fill="currentColor"/></pattern></defs>${draw(id)}</svg>`;
}
export const GLYPHS = Object.keys(G);
