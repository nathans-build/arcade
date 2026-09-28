// Pixel-art sprites defined as character grids, pre-rendered to offscreen canvases.
// SpiderBen10's Arcade palette: reds, blues and a yellow accent on a navy notebook page.
import { forEachPixel, textWidth } from "./font";

export const PALETTE = {
  page: "#0a0f2e",
  rule: "#131b4c",
  margin: "#3a1030",
  red: "#e3262f",
  blue: "#2456e8",
  lightBlue: "#6ea0ff",
  yellow: "#ffd23f",
  cyan: "#7ff3ff",
  green: "#5fff8a",
  white: "#f2f4ff",
  navy: "#0a0f2e",
  ink: "#1d3fb8",
  inkHi: "#6ea0ff",
  inkDark: "#122a80",
  purple: "#c070ff",
  purpleDark: "#7a2ad0",
  orange: "#ff9a3a",
};

type SpriteDef = { rows: string[]; colors: Record<string, string> };

function render(def: SpriteDef): HTMLCanvasElement {
  const h = def.rows.length;
  const w = Math.max(...def.rows.map((r) => r.length));
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d")!;
  def.rows.forEach((row, y) => {
    [...row].forEach((ch, x) => {
      const col = def.colors[ch];
      if (col) {
        ctx.fillStyle = col;
        ctx.fillRect(x, y, 1, 1);
      }
    });
  });
  return c;
}

/*
 * The arcade's own hero, drawn smaller to fit the garden rows: red helmet, cyan visor,
 * blue suit, yellow diamond. The raised glove is where the ink darts fire from.
 */
const HERO_ROWS = [
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
const HERO_STEP_ROWS = [...HERO_ROWS.slice(0, 11), "....BB.BB....", "...BB...BB...", "..hh.....hh.."];
const HERO_COLORS = { h: "#e3262f", R: "#e3262f", K: "#05060f", V: "#7ff3ff", B: "#2456e8", Y: "#ffd23f" };
export const HERO_W = 13;
export const HERO_H = 14;
/** Where the raised glove is, relative to the sprite's top-left. */
export const HERO_HAND = { x: 5.5, y: 0 };

/* The pest: an original "ink mite" that skitters through the hero's rows. */
const MITE_TOP = [
  "a...........a",
  ".a.........a.",
  "..ppppppppp..",
  ".pPPyPPPyPPp.",
  "pPPPPPPPPPPPp",
  ".pPPPPPPPPPp.",
];
const MITE_A = [...MITE_TOP, "l.l.l...l.l.l", ".l...l.l...l."];
const MITE_B = [...MITE_TOP, ".l...l.l...l.", "l.l.l...l.l.l"];
const MITE_COLORS = { a: PALETTE.orange, p: PALETTE.purpleDark, P: PALETTE.purple, y: PALETTE.yellow, l: PALETTE.orange };
export const MITE_W = 13;
export const MITE_H = 8;

/* Ink blots (the worm's "mushrooms"): three damage stages. */
const BLOT = [
  "...##.#...",
  ".#######..",
  "##hh#####.",
  "#hh######.",
  "##########",
  ".#########",
  "..#######.",
  ".########.",
  "...##d##..",
  "....#.....",
];
export const BLOT_SIZE = 10;

export interface SpriteSheet {
  hero: HTMLCanvasElement;
  heroStep: HTMLCanvasElement;
  mite: HTMLCanvasElement[];
  /** [hp-1]: 1 = nearly gone, 3 = whole */
  blot: HTMLCanvasElement[];
}

let cached: SpriteSheet | null = null;

export function getSprites(): SpriteSheet {
  if (cached) return cached;
  const blotColors = { "#": PALETTE.ink, h: PALETTE.inkHi, d: PALETTE.inkDark };
  // Damage bites rows off the top, like the classic mushrooms.
  const stage = (cut: number) => BLOT.map((row, y) => (y < cut ? ".".repeat(row.length) : row));
  cached = {
    hero: render({ rows: HERO_ROWS, colors: HERO_COLORS }),
    heroStep: render({ rows: HERO_STEP_ROWS, colors: HERO_COLORS }),
    mite: [render({ rows: MITE_A, colors: MITE_COLORS }), render({ rows: MITE_B, colors: MITE_COLORS })],
    blot: [render({ rows: stage(6), colors: blotColors }), render({ rows: stage(3), colors: blotColors }), render({ rows: BLOT, colors: blotColors })],
  };
  return cached;
}

/* Text sprites in the bitmap font, cached by text + colour + scale. */
const textCache = new Map<string, HTMLCanvasElement>();

export function textSprite(text: string, color: string, scale = 1, shadow: string | null = null): HTMLCanvasElement {
  const key = `${text}|${color}|${scale}|${shadow}`;
  const hit = textCache.get(key);
  if (hit) return hit;
  const pad = shadow ? 1 : 0;
  const c = document.createElement("canvas");
  c.width = Math.max(1, textWidth(text, scale) + pad);
  c.height = 5 * scale + pad;
  const ctx = c.getContext("2d")!;
  const plot = (col: string, ox: number, oy: number) => {
    ctx.fillStyle = col;
    forEachPixel(text, (x, y) => ctx.fillRect(x * scale + ox, y * scale + oy, scale, scale));
  };
  if (shadow) plot(shadow, 1, 1);
  plot(color, 0, 0);
  if (textCache.size > 600) textCache.clear();
  textCache.set(key, c);
  return c;
}

/** The notebook-page background: ruled lines on the worm rows and a red margin. */
export function makeBackground(w: number, h: number, top: number, rowH: number, rows: number, pzRow: number): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = PALETTE.page;
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = PALETTE.rule;
  for (let r = 0; r <= rows; r++) ctx.fillRect(0, top + r * rowH, w, 1);
  // Hero zone tint and its boundary
  ctx.fillStyle = "rgba(36, 86, 232, 0.07)";
  ctx.fillRect(0, top + pzRow * rowH, w, h - (top + pzRow * rowH));
  ctx.fillStyle = "#1c2a78";
  for (let x = 0; x < w; x += 4) ctx.fillRect(x, top + pzRow * rowH, 2, 1);
  // Margin line
  ctx.fillStyle = PALETTE.margin;
  ctx.fillRect(6, top, 1, h - top);
  // Top strip for the word tray
  ctx.fillStyle = "#070b24";
  ctx.fillRect(0, 0, w, top - 1);
  ctx.fillStyle = PALETTE.red;
  ctx.fillRect(0, top - 1, w, 1);
  return c;
}
