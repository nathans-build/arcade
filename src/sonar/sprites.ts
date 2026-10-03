// Pixel art for Sonar Squad, defined in code: picture-row icons (K-2), the five original
// ships, and the arcade's hero as the squad captain. Pre-rendered to offscreen canvases.
import { FLEET, type ShipDef } from "./core";

export const PAL = {
  navy: "#0a0f2e",
  deep: "#04091c",
  sea: "#061a33",
  grid: "#123d6e",
  gridHi: "#2a6aa8",
  scope: "#5fff8a",
  red: "#e3262f",
  blue: "#2456e8",
  lightBlue: "#6ea0ff",
  yellow: "#ffd23f",
  cyan: "#7ff3ff",
  green: "#5fff8a",
  white: "#f2f4ff",
  orange: "#ff9a3a",
  dim: "#6a78b8",
  amber: "#ffb340",
};

function render(rows: string[], colors: Record<string, string>): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = Math.max(...rows.map((r) => r.length));
  c.height = rows.length;
  const ctx = c.getContext("2d")!;
  rows.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      const col = colors[row[x]];
      if (col) {
        ctx.fillStyle = col;
        ctx.fillRect(x, y, 1, 1);
      }
    }
  });
  return c;
}

/* ---- K-2 picture-row icons, 9x8, in the order of PICTURES in notation.ts ---- */
const ICONS: { rows: string[]; colors: Record<string, string> }[] = [
  // Fish
  { rows: [".........", "....oo...", ".o.oooo..", ".ooooko.o", ".oooooooo", ".o.oooo..", "....oo...", "........."], colors: { o: "#ff9a3a", k: "#05060f" } },
  // Crab
  { rows: ["r.......r", "rr.....rr", ".r.k.k.r.", "..rrrrr..", ".rrrrrrr.", "r.rrrrr.r", ".r.r.r.r.", "........."], colors: { r: "#e3262f", k: "#f2f4ff" } },
  // Star(fish)
  { rows: ["....y....", "....y....", "...yyy...", "yyyyyyyyy", ".yyyyyyy.", "..yyyyy..", ".yy...yy.", "yy.....yy"], colors: { y: "#ffd23f" } },
  // Shell
  { rows: [".........", "...ppp...", "..pPpPp..", ".pPpPpPp.", ".pPpPpPp.", "..ppppp..", "...ppp...", "........."], colors: { p: "#ffb0d0", P: "#c0607a" } },
  // Octopus
  { rows: ["...vvv...", "..vvvvv..", "..vkvkv..", "..vvvvv..", ".v.v.v.v.", "v.v.v.v.v", "v.v...v.v", "........."], colors: { v: "#c070ff", k: "#05060f" } },
  // Turtle
  { rows: [".........", "...ggg...", "..gGgGg..", "ggGgGgGgg", "..gGgGg..", ".g.ggg.g.", ".........", "........."], colors: { g: "#5fff8a", G: "#1f8a4a" } },
  // Whale
  { rows: ["..w.w....", "...w.....", ".bbbbb...", "bbbbbbb.b", "bkbbbbbbb", "bbbbbbb.b", ".BBBBB...", "........."], colors: { b: "#6ea0ff", B: "#cfe0ff", k: "#05060f", w: "#7ff3ff" } },
  // Duck
  { rows: [".........", "..yyy....", ".yykyoo..", ".yyyy....", "..yyyyyy.", ".yyyyyyy.", "..yyyyy..", "~~~~~~~~~"], colors: { y: "#fff27a", k: "#05060f", o: "#ff9a3a", "~": "#2456e8" } },
  // Boat
  { rows: ["....w....", "....ww...", "....www..", "....wwww.", "....w....", "rrrrrrrrr", ".rrrrrrr.", "~~~~~~~~~"], colors: { w: "#f2f4ff", r: "#e3262f", "~": "#2456e8" } },
  // Anchor
  { rows: ["...aaa...", "...a.a...", "...aaa...", "..aaaaa..", "....a....", "a...a...a", ".aa.a.aa.", "...aaa..."], colors: { a: "#9aa6c8" } },
];

let iconCache: HTMLCanvasElement[] | null = null;
export function pictureIcons(): HTMLCanvasElement[] {
  if (!iconCache) iconCache = ICONS.map((i) => render(i.rows, i.colors));
  return iconCache;
}

/* ---- The arcade hero (red helmet, cyan visor, blue suit, yellow diamond) as squad captain ---- */
const HERO = [
  ".....hh......",
  ".....BB......",
  "....KRRRK....",
  "...KRRRRRK...",
  "...KVVVVVK...",
  "...KRRRRRK...",
  "....KRRRK....",
  "..BBBRRRBBB..",
  "..BBBYYYBBB..",
  "..hBBBYBBBh..",
  "....RRRRR....",
  "....BB.BB....",
  "....BB.BB....",
  "...hh...hh...",
];
const HERO_COLORS = { h: "#e3262f", R: "#e3262f", K: "#05060f", V: "#7ff3ff", B: "#2456e8", Y: "#ffd23f" };
let heroCache: HTMLCanvasElement | null = null;
export function heroSprite() {
  if (!heroCache) heroCache = render(HERO, HERO_COLORS);
  return heroCache;
}

/* ---- Ships: drawn procedurally at any spot size so they fit both boards ---- */
const SHIP_COLORS: Record<string, { body: string; dark: string; trim: string }> = {
  dragon: { body: "#3fbf6a", dark: "#1f6a3a", trim: "#ffd23f" },
  narwhal: { body: "#9fb4d8", dark: "#4f6390", trim: "#f2f4ff" },
  turtle: { body: "#5fcf9a", dark: "#1f7a4e", trim: "#a0ffcf" },
  manta: { body: "#9a6fe0", dark: "#4f2f8a", trim: "#ffb0f0" },
  puffer: { body: "#ffd23f", dark: "#b07a10", trim: "#ff9a3a" },
};
const WRECK = { body: "#5a2a30", dark: "#2a1018", trim: "#7a3a40" };

const shipCache = new Map<string, HTMLCanvasElement>();

/**
 * A ship facing right, `len` spots long, `p` pixels per spot. `wreck` draws it burnt out.
 * Each design is original: a sea-dragon sub with back spikes, a narwhal sub with a tusk,
 * a turtle sub with a shell dome, a manta ray sub with wings, and a round puffer boat.
 */
export function shipSprite(def: ShipDef, p: number, wreck = false): HTMLCanvasElement {
  const key = `${def.id}-${p}-${wreck}`;
  const hit = shipCache.get(key);
  if (hit) return hit;
  const W = def.len * p;
  const H = p;
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const g = c.getContext("2d")!;
  const col = wreck ? WRECK : SHIP_COLORS[def.id];
  const R = (x: number, y: number, w: number, h: number, color: string) => {
    g.fillStyle = color;
    g.fillRect(Math.round(x), Math.round(y), Math.max(1, Math.round(w)), Math.max(1, Math.round(h)));
  };
  const pad = Math.max(1, Math.round(p * 0.12));
  const t = Math.max(3, Math.round(p * (def.id === "puffer" ? 0.62 : 0.46)));
  const y0 = Math.round((H - t) / 2);
  const x0 = pad;
  const x1 = W - pad;
  // Hull with a tapered bow (right) and rounded stern (left).
  const bow = Math.max(2, Math.round(t * 0.9));
  for (let y = 0; y < t; y++) {
    const edge = Math.abs(y - (t - 1) / 2) / ((t - 1) / 2 || 1); // 0 middle .. 1 edges
    const cutBow = Math.round(bow * edge);
    const cutStern = Math.round(Math.max(0, edge - 0.5) * 2 * Math.max(1, t * 0.3));
    R(x0 + cutStern, y0 + y, x1 - x0 - cutBow - cutStern, 1, y > t * 0.62 ? col.dark : col.body);
  }
  // Propeller at the stern
  R(x0 - Math.min(pad, 1), y0 + t / 2 - 1, Math.max(1, pad), 2, col.dark);
  // Portholes, one per spot
  if (p >= 10) for (let k = 0; k < def.len; k++) R(k * p + p / 2 - 1, y0 + Math.round(t * 0.35), 2, 2, wreck ? "#30101a" : PAL.cyan);
  else for (let k = 0; k < def.len; k++) R(k * p + p / 2, y0 + Math.round(t * 0.4), 1, 1, wreck ? "#30101a" : PAL.cyan);
  const top = y0;
  switch (def.id) {
    case "dragon": {
      // spikes along the back and a yellow eye near the bow
      for (let x = x0 + 3; x < x1 - bow; x += Math.max(3, Math.round(p / 3))) R(x, top - Math.max(1, Math.round(p * 0.12)), Math.max(1, Math.round(p * 0.12)), Math.max(1, Math.round(p * 0.12)), col.trim);
      R(x1 - bow - Math.max(1, p * 0.1), top + 1, Math.max(1, p * 0.12), Math.max(1, p * 0.12), col.trim);
      // conning tower
      R(x0 + p * 1.5, top - Math.max(2, p * 0.22), p * 0.6, Math.max(2, p * 0.22), col.dark);
      break;
    }
    case "narwhal": {
      // the tusk sticks out ahead of the bow
      R(x1 - bow, y0 + t / 2 - 0.5, bow + pad, 1, col.trim);
      R(x0 + p * 1.2, top - Math.max(2, p * 0.2), p * 0.5, Math.max(2, p * 0.2), col.dark);
      for (let x = x0 + 2; x < x1 - bow; x += Math.max(3, Math.round(p * 0.7))) R(x, y0 + t - 2, 1, 1, col.trim);
      break;
    }
    case "turtle": {
      // shell dome with a pattern
      const dw = p * 1.6;
      const dx = W / 2 - dw / 2;
      const dh = Math.max(2, Math.round(p * 0.24));
      R(dx + 1, top - dh, dw - 2, dh, col.dark);
      for (let x = dx + 2; x < dx + dw - 2; x += 3) R(x, top - dh + 1, 1, 1, col.trim);
      break;
    }
    case "manta": {
      // wings from the middle
      const wx = W / 2 - p * 0.6;
      const wl = p * 1.2;
      const wh = Math.max(1, Math.round(p * 0.22));
      R(wx, top - wh, wl, wh, col.body);
      R(wx, y0 + t, wl, wh, col.dark);
      R(wx + wl, top - wh, 1, 1, col.trim);
      break;
    }
    case "puffer": {
      // spikes all round and an eye
      const s = Math.max(1, Math.round(p * 0.1));
      for (let x = x0 + 2; x < x1 - 2; x += Math.max(3, Math.round(p / 3))) {
        R(x, top - s, s, s, col.trim);
        R(x, y0 + t, s, s, col.trim);
      }
      R(x1 - bow - s * 2, top + Math.round(t * 0.25), s + 1, s + 1, "#05060f");
      break;
    }
  }
  if (wreck) {
    // scorch marks
    for (let k = 0; k < def.len; k++) R(k * p + p * 0.3, y0 + t * 0.6, p * 0.3, 1, "#1a0508");
  }
  shipCache.set(key, c);
  return c;
}

export function allShipDefs() {
  return FLEET;
}
