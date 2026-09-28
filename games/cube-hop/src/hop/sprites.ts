// Pixel-art sprites defined as character grids, pre-rendered to offscreen canvases.
// SpiderBen10's Arcade palette: reds, blues and a yellow accent on navy.

export const PAL = {
  navy: "#0a0f2e",
  deep: "#050818",
  red: "#e3262f",
  blue: "#2456e8",
  lightBlue: "#6ea0ff",
  yellow: "#ffd23f",
  cyan: "#7ff3ff",
  green: "#5fff8a",
  white: "#f2f4ff",
  purple: "#c070ff",
  orange: "#ff9a3a",
  dim: "#6a78b8",
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
 * The arcade's own hero (red helmet, cyan visor, blue suit, yellow diamond), crouched and
 * springing for Cube Hop: "stand" on a cube, "hop" in the air with arms and legs spread.
 */
const HERO_STAND = [
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
  "...BB...BB...",
  "..BB.....BB..",
  ".hh.......hh.",
];
const HERO_HOP = [
  ".....hh......",
  ".....BB......",
  "....KRRRK....",
  "...KRRRRRK...",
  "...KVVVVVK...",
  "h..KRRRRRK..h",
  "B...KRRRK...B",
  ".BBBBRRRBBBB.",
  "....BYYYB....",
  "....BBYBB....",
  "....RRRRR....",
  "....BB.BB....",
  "....BB.BB....",
  "....hh.hh....",
];
const HERO_COLORS = { h: "#e3262f", R: "#e3262f", K: "#05060f", V: "#7ff3ff", B: "#2456e8", Y: "#ffd23f" };
export const HERO_W = 13;
export const HERO_H = 14;

/* Zap-ball: an original bouncing hazard, a red-orange spark ball. */
const BALL = [
  "..oRRo..",
  ".oRRRRo.",
  "oRRwRRRo",
  "RRwRRRRR",
  "RRRRRRRR",
  "oRRRRRRo",
  ".oRRRRo.",
  "..oRRo..",
];
const BALL_COLORS = { R: "#e3262f", o: "#ff9a3a", w: "#ffe0a0" };
export const BALL_W = 8;
export const BALL_H = 8;

/*
 * The Glitch: this game's original chaser, a boxy green static-gremlin with antenna
 * sparks and a zig-zag mouth. It hops toward the hero one cube at a time.
 */
const GLITCH_A = [
  "y.........y",
  ".y.......y.",
  "..ggggggg..",
  ".gGGGGGGGg.",
  ".gGwKGwKGg.",
  ".gGwKGwKGg.",
  ".gGGGGGGGg.",
  ".gGKGKGKGg.",
  ".gGGKGKGGg.",
  "..ggggggg..",
  "..g.....g..",
  ".gg.....gg.",
];
const GLITCH_B = [
  ".y.......y.",
  "y.........y",
  "..ggggggg..",
  ".gGGGGGGGg.",
  ".gGKwGKwGg.",
  ".gGKwGKwGg.",
  ".gGGGGGGGg.",
  ".gGGKGKGGg.",
  ".gGKGKGKGg.",
  "..ggggggg..",
  ".g.......g.",
  "gg.......gg",
];
const GLITCH_COLORS = { g: "#1f9a4a", G: "#5fff8a", K: "#05060f", w: "#f2f4ff", y: "#ffd23f" };
export const GLITCH_W = 11;
export const GLITCH_H = 12;

export interface SpriteSheet {
  heroStand: HTMLCanvasElement;
  heroHop: HTMLCanvasElement;
  ball: HTMLCanvasElement;
  glitch: [HTMLCanvasElement, HTMLCanvasElement];
}

let sheet: SpriteSheet | null = null;
export function getSprites(): SpriteSheet {
  if (!sheet) {
    sheet = {
      heroStand: render({ rows: HERO_STAND, colors: HERO_COLORS }),
      heroHop: render({ rows: HERO_HOP, colors: HERO_COLORS }),
      ball: render({ rows: BALL, colors: BALL_COLORS }),
      glitch: [render({ rows: GLITCH_A, colors: GLITCH_COLORS }), render({ rows: GLITCH_B, colors: GLITCH_COLORS })],
    };
  }
  return sheet;
}

/** Deep-space backdrop with a faint isometric grid and a few stars, drawn once. */
export function makeBackground(w: number, h: number): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const g = c.getContext("2d")!;
  g.fillStyle = PAL.navy;
  g.fillRect(0, 0, w, h);
  g.fillStyle = "#0e1540";
  for (let y = 0; y < h; y += 8) for (let x = (y / 8) % 2 ? 0 : 8; x < w; x += 16) g.fillRect(x, y, 1, 1);
  const hash = (n: number) => {
    const s = Math.sin(n * 127.1) * 43758.5453;
    return s - Math.floor(s);
  };
  for (let i = 0; i < 70; i++) {
    const x = Math.floor(hash(i) * w), y = Math.floor(hash(i + 99) * h);
    g.fillStyle = hash(i + 7) > 0.8 ? PAL.lightBlue : hash(i + 7) > 0.5 ? "#3a4a90" : "#26306a";
    g.fillRect(x, y, 1, 1);
  }
  return c;
}
