// Pixel-art sprites defined as character grids, pre-rendered to offscreen canvases.
// SpiderBen10's Arcade palette: reds, blues and a yellow accent on a navy kitchen at night.
import { forEachPixel, textWidth } from "./font";
import {
  COUNTER_Y, FIELD_W, H, LADDER_HALF, PLATE_CX, PLATE_W, PLATE_X0, PLATE_Y, W, type Layout,
} from "./layout";

export const PALETTE = {
  bg: "#0a0f2e",
  tile: "#0e1540",
  tileLine: "#121b4f",
  red: "#e3262f",
  blue: "#2456e8",
  lightBlue: "#6ea0ff",
  yellow: "#ffd23f",
  cyan: "#7ff3ff",
  green: "#5fff8a",
  white: "#f2f4ff",
  navy: "#0a0f2e",
  steel: "#2456e8",
  steelHi: "#6ea0ff",
  steelDark: "#15307e",
  rivet: "#ffd23f",
  ladder: "#8fa8e8",
  counter: "#39426e",
  counterHi: "#5a6598",
  orange: "#ff9a3a",
  magenta: "#e0479e",
};

/** Slab colours (bun, lettuce, tomato, patty, cheese, onion). Colour never tells the order. */
export const SLAB_COLORS = [
  { face: "#e8b865", hi: "#ffd9a0", lo: "#a8742e" },
  { face: "#7ccf5a", hi: "#b8f59a", lo: "#3f8a2a" },
  { face: "#f0685a", hi: "#ffa89c", lo: "#a8322a" },
  { face: "#c08050", hi: "#e8b088", lo: "#7a4a26" },
  { face: "#ffd23f", hi: "#fff0a0", lo: "#c89a10" },
  { face: "#d8a0f0", hi: "#f4d8ff", lo: "#8a58a8" },
];

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

function flipH(src: HTMLCanvasElement): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = src.width;
  c.height = src.height;
  const g = c.getContext("2d")!;
  g.translate(src.width, 0);
  g.scale(-1, 1);
  g.drawImage(src, 0, 0);
  return c;
}

/*
 * The arcade's own hero in the kitchen: red helmet, cyan visor, blue suit and yellow diamond,
 * plus a white chef's hat and apron. Faces right; the engine flips him for left.
 */
const CHEF_TOP = [
  "....WWWWW....",
  "...WWWWWWW...",
  "...WWWWWWW...",
  "....wwwww....",
  "....KRRRK....",
  "...KRRRRRK...",
  "...KRRVVVV...",
  "...KRRRRRK...",
  "....KRRRK....",
  "..BBWWWWWBB..",
  "..BBWWYWWBh..",
  "..hBWYYYWB...",
  "....WWYWW....",
  "....WWWWW....",
];
const CHEF_A = [...CHEF_TOP, "....BB.BB....", "....BB.BB....", "...hh...hh..."];
const CHEF_B = [...CHEF_TOP, "....BB..BB...", "...BB....B...", "..hh.....hh.."];
/* Climbing: seen from behind, arms up on the rungs. */
const CHEF_CLIMB_A = [
  "....WWWWW....",
  "...WWWWWWW...",
  "...WWWWWWW...",
  "..h.wwwww....",
  "..B.KRRRK.h..",
  "..BKRRRRRKB..",
  "..BKRRRRRKB..",
  "..BKRRRRRKB..",
  "...BKRRRKB...",
  "...BBBBBBB...",
  "...BBBWBBB...",
  "...BBBWBBB...",
  "....BBBBB....",
  "....RRRRR....",
  "....BB.BB....",
  "....BB..B....",
  "...hh...hh...",
];
const CHEF_CLIMB_B = CHEF_CLIMB_A.map((r) => [...r].reverse().join(""));
const CHEF_COLORS = { W: "#f2f4ff", w: "#b8c0e0", R: "#e3262f", h: "#e3262f", K: "#05060f", V: "#7ff3ff", B: "#2456e8", Y: "#ffd23f" };
export const CHEF_W = 13;
export const CHEF_H = 17;

/* Original food critters: a radish, a broccoli and a mushroom. */
const RADISH_TOP = [
  "...g...g...",
  "....ggg....",
  "..gg.g.gg..",
  "....MMM....",
  "..MMMMMMM..",
  ".MMwKMMwKM.",
  ".MMwKMMwKM.",
  ".MMMMMMMMM.",
  ".MMMkkkMMM.",
  "..MMMMMMM..",
  "....MMM....",
];
const BROC_TOP = [
  "..GgG.GgG..",
  ".GgGgGgGgG.",
  ".gGgGgGgGg.",
  "..GgGgGgG..",
  "...lllll...",
  "..lwKlwKl..",
  "..lwKlwKl..",
  "..lllllll..",
  "..llkkkll..",
  "...lllll...",
  "...lllll...",
];
const SHROOM_TOP = [
  "...ooooo...",
  ".ooCooooCo.",
  "ooooooCoooo",
  "oCoooooooCo",
  "ooooooooooo",
  "...ccccc...",
  "..cwKcwKc..",
  "..cwKcwKc..",
  "..ccccccc..",
  "..cckkkcc..",
  "...ccccc...",
];
const LEGS_A = ["...f...f...", "..ff...ff.."];
const LEGS_B = ["....f.f....", "...ff.ff..."];
const CRITTER_COLORS: Record<string, string>[] = [
  { g: "#5fff8a", M: "#e0479e", w: "#ffffff", K: "#05060f", k: "#6a1040", f: "#ffd23f" },
  { G: "#3fae4a", g: "#7fe36a", l: "#9ad86a", w: "#ffffff", K: "#05060f", k: "#2a5a20", f: "#ffd23f" },
  { o: "#d9782e", C: "#fff0c8", c: "#f4e2b8", w: "#ffffff", K: "#05060f", k: "#8a5a2a", f: "#ffd23f" },
];
export const CRITTER_W = 11;
export const CRITTER_H = 13;
export const CRITTER_NAMES = ["RASCAL RADISH", "BRUISER BROC", "SHIFTY SHROOM"];

export interface SpriteSheet {
  /** [frame][dir 0=right 1=left] */
  chef: HTMLCanvasElement[][];
  chefClimb: HTMLCanvasElement[];
  /** [kind][frame] */
  critters: HTMLCanvasElement[][];
  /** Stunned critters: pale versions. */
  stunned: HTMLCanvasElement[];
}

let cached: SpriteSheet | null = null;

export function getSprites(): SpriteSheet {
  if (cached) return cached;
  const a = render({ rows: CHEF_A, colors: CHEF_COLORS });
  const b = render({ rows: CHEF_B, colors: CHEF_COLORS });
  const tops = [RADISH_TOP, BROC_TOP, SHROOM_TOP];
  const critters = tops.map((top, i) => [
    render({ rows: [...top, ...LEGS_A], colors: CRITTER_COLORS[i] }),
    render({ rows: [...top, ...LEGS_B], colors: CRITTER_COLORS[i] }),
  ]);
  const pale = (i: number) => {
    const col: Record<string, string> = {};
    for (const k of Object.keys(CRITTER_COLORS[i])) col[k] = k === "K" ? "#6a78b8" : "#c8d0ff";
    return render({ rows: [...tops[i], ...LEGS_A], colors: col });
  };
  cached = {
    chef: [[a, flipH(a)], [b, flipH(b)]],
    chefClimb: [render({ rows: CHEF_CLIMB_A, colors: CHEF_COLORS }), render({ rows: CHEF_CLIMB_B, colors: CHEF_COLORS })],
    critters,
    stunned: [pale(0), pale(1), pale(2)],
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
  if (textCache.size > 800) textCache.clear();
  textCache.set(key, c);
  return c;
}

/** The kitchen: tiled wall, steel girders with rivets, ladders, the counter and the plate column. */
export function makeBackground(l: Layout, top: number): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const g = c.getContext("2d")!;
  g.fillStyle = PALETTE.bg;
  g.fillRect(0, 0, W, H);
  // Wall tiles
  g.fillStyle = PALETTE.tile;
  for (let y = top + 2; y < COUNTER_Y - 4; y += 12) {
    for (let x = ((y / 12) % 2) * 6; x < FIELD_W; x += 12) g.fillRect(x, y, 11, 11);
  }
  // Plate column ("the pass") with a heat lamp
  g.fillStyle = "#070b24";
  g.fillRect(PLATE_X0 - 2, top, W - PLATE_X0 + 2, H - top);
  g.fillStyle = "#1c2a78";
  g.fillRect(PLATE_X0 - 2, top, 1, H - top);
  g.fillStyle = PALETTE.orange;
  g.fillRect(PLATE_CX - 10, top + 1, 20, 2);
  g.fillStyle = "rgba(255,154,58,0.07)";
  g.beginPath();
  g.moveTo(PLATE_CX - 10, top + 3);
  g.lineTo(PLATE_CX + 10, top + 3);
  g.lineTo(PLATE_X0 + PLATE_W, PLATE_Y);
  g.lineTo(PLATE_X0, PLATE_Y);
  g.fill();

  // Ladders (behind the girders)
  for (const lad of l.ladders) {
    const y0 = l.floorY[lad.top] - 1;
    const y1 = l.floorY[lad.bottom] + 2;
    g.fillStyle = PALETTE.ladder;
    g.fillRect(lad.x - LADDER_HALF, y0, 1, y1 - y0);
    g.fillRect(lad.x + LADDER_HALF - 1, y0, 1, y1 - y0);
    g.fillStyle = "#5c74b8";
    for (let y = y0 + 3; y < y1; y += 4) g.fillRect(lad.x - LADDER_HALF + 1, y, LADDER_HALF * 2 - 2, 1);
  }
  // Girders: 3px steel beam with rivets
  for (const s of l.segments) {
    const y = l.floorY[s.floor];
    const w = s.x1 - s.x0;
    g.fillStyle = PALETTE.steelHi;
    g.fillRect(s.x0, y, w, 1);
    g.fillStyle = PALETTE.steel;
    g.fillRect(s.x0, y + 1, w, 2);
    g.fillStyle = PALETTE.steelDark;
    g.fillRect(s.x0, y + 3, w, 1);
    g.fillStyle = PALETTE.rivet;
    for (let x = s.x0 + 4; x < s.x1 - 2; x += 16) g.fillRect(x, y + 1, 1, 1);
  }
  // Ladder tops poke through the girders so they read as climbable
  g.fillStyle = PALETTE.ladder;
  for (const lad of l.ladders) {
    const y0 = l.floorY[lad.top];
    g.fillRect(lad.x - LADDER_HALF, y0 - 3, 1, 3);
    g.fillRect(lad.x + LADDER_HALF - 1, y0 - 3, 1, 3);
  }
  // Counter (conveyor) along the bottom to the plate
  g.fillStyle = PALETTE.counterHi;
  g.fillRect(0, COUNTER_Y, PLATE_X0 - 2, 1);
  g.fillStyle = PALETTE.counter;
  g.fillRect(0, COUNTER_Y + 1, PLATE_X0 - 2, 4);
  g.fillStyle = "#222a50";
  for (let x = 2; x < PLATE_X0 - 2; x += 6) g.fillRect(x, COUNTER_Y + 2, 2, 2);
  // Plate
  g.fillStyle = "#c8d0ff";
  g.fillRect(PLATE_X0 + 1, PLATE_Y, PLATE_W - 2, 2);
  g.fillStyle = "#f2f4ff";
  g.fillRect(PLATE_X0 + 3, PLATE_Y - 1, PLATE_W - 6, 1);
  g.fillStyle = "#8a94c8";
  g.fillRect(PLATE_X0 + 5, PLATE_Y + 2, PLATE_W - 10, 1);
  // Title strip
  g.fillStyle = "#070b24";
  g.fillRect(0, 0, W, top - 1);
  g.fillStyle = PALETTE.red;
  g.fillRect(0, top - 1, W, 1);
  return c;
}
