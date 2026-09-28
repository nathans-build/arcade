// Pixel-art sprites defined as character grids, pre-rendered to offscreen canvases.
// SpiderBen10's Arcade palette: reds, blues and a yellow accent on a navy night sky.

export const PALETTE = {
  sky: "#0a0f2e",
  skyLow: "#111a4a",
  star: "#ffffff",
  starDim: "#6ea0ff",
  moon: "#f4ecc8",
  moonShade: "#cfc39a",
  city: "#141c52",
  cityHi: "#1f2a6e",
  window: "#ffd23f",
  windowDim: "#2a3a8a",
  ground: "#2456e8",
  red: "#e3262f",
  blue: "#2456e8",
  lightBlue: "#6ea0ff",
  yellow: "#ffd23f",
  cyan: "#7ff3ff",
  green: "#5fff8a",
  web: "#eef4ff",
  silk: "#3a4c9a",
};

type SpriteDef = { rows: string[]; colors: Record<string, string> };

/*
 * The arcade's own hero (from the SpiderBen10's Arcade menu): red helmet, cyan visor,
 * blue suit, yellow diamond emblem. One gloved hand is raised: that's where webs fire from.
 */
const HERO_ROWS = [
  "......hh........",
  "......hh........",
  "......BB........",
  "......BB........",
  ".....KRRRK......",
  "....KRRRRRK.....",
  "....KRRRRRK.....",
  "....KVVVVVK.....",
  "....KRRRRRK.....",
  ".....KRRRK......",
  "....BBRRRBB.....",
  "....BBYYYBBB....",
  "....BBBYBB.BB...",
  "....BBBBBB..hh..",
  ".....RRRRR......",
  ".....BBBBB......",
  ".....BB.BB......",
  "....BB...BB.....",
  "...hh.....hh....",
];
/** Second frame: a stride, used while the hero runs left and right. */
const HERO_STEP_ROWS = [
  ...HERO_ROWS.slice(0, 16),
  ".....BB.BB......",
  ".....BB..BB.....",
  "....hh....hh....",
];
const HERO_COLORS = { h: "#e3262f", R: "#e3262f", K: "#05060f", V: "#7ff3ff", B: "#2456e8", Y: "#ffd23f" };
/** Where the raised glove is, relative to the sprite's top-left. */
export const HERO_HAND = { x: 7, y: 0 };
export const HERO_W = 16;
export const HERO_H = 19;

/* Invaders: three original "web bug" species, 12×8, two animation frames each. */
const MOTH_A = [
  "w..........w",
  "ww..e..e..ww",
  "www.bbbb.www",
  "wwwbbbbbbwww",
  ".wwbbbbbbww.",
  "..w.bbbb.w..",
  "....b..b....",
  "...b....b...",
];
const MOTH_B = [
  "............",
  "....e..e....",
  "w...bbbb...w",
  "wwwbbbbbbwww",
  "wwwbbbbbbwww",
  "ww..bbbb..ww",
  "w...b..b...w",
  "....b..b....",
];
const MOTH_COLORS = { w: "#c070ff", b: "#7a2ad0", e: "#ffffff" };

const BUG_A = [
  "...a....a...",
  "....a..a....",
  "...kkkkkk...",
  "..gggkkggg..",
  ".ggyggggygg.",
  ".gggggggggg.",
  "..gggyyggg..",
  ".k.k....k.k.",
];
const BUG_B = [...BUG_A.slice(0, 7), "k..k....k..k"];
const BUG_COLORS = { g: "#3fd35f", y: "#ffd23f", k: "#0f5a24", a: "#9fffb0" };

const JELLY_A = [
  "....cccc....",
  "..cccccccc..",
  ".cceecceecc.",
  ".cccccccccc.",
  "..c.c..c.c..",
  ".c..c..c..c.",
  "c...c..c...c",
  "............",
];
const JELLY_B = [
  "....cccc....",
  "..cccccccc..",
  ".cceecceecc.",
  ".cccccccccc.",
  "..c.c..c.c..",
  "..c.c..c.c..",
  ".c..c..c..c.",
  "............",
];
const JELLY_COLORS = { c: "#ff9a3a", e: "#0a0f2e" };

export const REG_W = 12;
export const REG_H = 8;

/* Answer carriers: bigger invaders that hold a letter A–D in their window. */
const CARRIER_TOP = [
  "........yyyyyy........",
  "......yyyyyyyyyy......",
  "....yyyyyyyyyyyyyy....",
  "..yyyynnnnnnnnnnyyyy..",
  ".yyyynnnnnnnnnnnnyyyy.",
  "yyyynnnnnnnnnnnnnnyyyy",
  "yyynnnnnnnnnnnnnnnnyyy",
  "yyynnnnnnnnnnnnnnnnyyy",
  "yyyynnnnnnnnnnnnnnyyyy",
  ".yyyynnnnnnnnnnnnyyyy.",
  "..yyyyllyyyyyyllyyyy..",
  "....yy..yy..yy..yy....",
  "...yy...yy..yy...yy...",
];
const CARRIER_A = [...CARRIER_TOP, "..yy....y....y....yy.."];
const CARRIER_B = [...CARRIER_TOP, "...yy..yy....yy..yy..."];
export const CARRIER_W = 22;
export const CARRIER_H = 14;
/** Top-left of the 5×7 letter inside the carrier window. */
export const CARRIER_LETTER = { x: 8, y: 3 };

const GLYPHS: Record<string, string[]> = {
  A: [".###.", "#...#", "#...#", "#####", "#...#", "#...#", "#...#"],
  B: ["####.", "#...#", "#...#", "####.", "#...#", "#...#", "####."],
  C: [".###.", "#...#", "#....", "#....", "#....", "#...#", ".###."],
  D: ["####.", "#...#", "#...#", "#...#", "#...#", "#...#", "####."],
  "?": [".###.", "#...#", "....#", "...#.", "..#..", ".....", "..#.."],
};

/** A web "splat" left where an invader is caught. */
const SPLAT = [
  "w....w....w.",
  ".w...w...w..",
  "..wwwwwww...",
  "..w.www.w...",
  "wwwww.wwwww.",
  "..w.www.w...",
  "..wwwwwww...",
  ".w...w...w..",
];

export const CARRIER_COLORS = {
  normal: { y: "#ffd23f", n: "#0a0f2e", l: "#e3262f" },
  normalB: { y: "#ffd23f", n: "#0a0f2e", l: "#ffffff" },
  right: { y: "#5fff8a", n: "#0a3a1e", l: "#ffffff" },
  wrong: { y: "#e3262f", n: "#3a0a10", l: "#ffffff" },
  picked: { y: "#7ff3ff", n: "#0a0f2e", l: "#ffffff" },
};

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

export interface SpriteSheet {
  hero: HTMLCanvasElement;
  heroStep: HTMLCanvasElement;
  /** [species][frame] */
  invaders: HTMLCanvasElement[][];
  carrier: Record<keyof typeof CARRIER_COLORS, HTMLCanvasElement[]>;
  glyphs: Record<string, HTMLCanvasElement>;
  splat: HTMLCanvasElement;
}

let cached: SpriteSheet | null = null;

export function getSprites(): SpriteSheet {
  if (cached) return cached;
  const carrier = {} as SpriteSheet["carrier"];
  for (const k of Object.keys(CARRIER_COLORS) as (keyof typeof CARRIER_COLORS)[]) {
    carrier[k] = [render({ rows: CARRIER_A, colors: CARRIER_COLORS[k] }), render({ rows: CARRIER_B, colors: CARRIER_COLORS[k] })];
  }
  const glyphs: Record<string, HTMLCanvasElement> = {};
  for (const [ch, rows] of Object.entries(GLYPHS)) {
    glyphs[ch] = render({ rows, colors: { "#": "#ffffff" } });
  }
  cached = {
    hero: render({ rows: HERO_ROWS, colors: HERO_COLORS }),
    heroStep: render({ rows: HERO_STEP_ROWS, colors: HERO_COLORS }),
    invaders: [
      [render({ rows: MOTH_A, colors: MOTH_COLORS }), render({ rows: MOTH_B, colors: MOTH_COLORS })],
      [render({ rows: BUG_A, colors: BUG_COLORS }), render({ rows: BUG_B, colors: BUG_COLORS })],
      [render({ rows: JELLY_A, colors: JELLY_COLORS }), render({ rows: JELLY_B, colors: JELLY_COLORS })],
    ],
    carrier,
    glyphs,
    splat: render({ rows: SPLAT, colors: { w: PALETTE.web } }),
  };
  return cached;
}

/*
 * Spider-web bunkers: a classic arch-shaped shield woven from silk. Each pixel is
 * 0 (empty), 1 (silk) or 2 (bright strand); shots and bombs tear holes in it.
 */
export const BUNKER_W = 24;
export const BUNKER_H = 16;

export function makeBunkerMask(): Uint8Array {
  const m = new Uint8Array(BUNKER_W * BUNKER_H);
  const cx = (BUNKER_W - 1) / 2;
  for (let y = 0; y < BUNKER_H; y++) {
    for (let x = 0; x < BUNKER_W; x++) {
      // Rounded top corners
      if (x < 4 && y < 4 - x) continue;
      if (x > BUNKER_W - 5 && y < x - (BUNKER_W - 5)) continue;
      // Arch cut out of the bottom middle
      const ax = Math.abs(x - cx);
      if (y >= 11 && ax < 5) continue;
      if (y === 10 && ax < 4) continue;
      // Web pattern: radial strands from the arch plus concentric rings
      const dx = x - cx;
      const dy = y - 13;
      const r = Math.round(Math.hypot(dx, dy));
      const ang = Math.atan2(dy, dx);
      const spoke = Math.abs(Math.sin(ang * 4)) < 0.16;
      const ring = r % 4 === 0;
      m[y * BUNKER_W + x] = spoke || ring || y === 0 ? 2 : 1;
    }
  }
  return m;
}
