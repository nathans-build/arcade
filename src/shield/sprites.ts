// Pixel-art sprites defined as character grids, pre-rendered to offscreen canvases.
// SpiderBen10's Arcade palette: reds, blues and a yellow accent on a navy night sky.

export const PALETTE = {
  sky: "#0a0f2e",
  skyLow: "#111a4a",
  star: "#ffffff",
  starDim: "#6ea0ff",
  moon: "#f4ecc8",
  moonShade: "#cfc39a",
  farCity: "#10183f",
  ground: "#2456e8",
  groundDark: "#16307e",
  red: "#e3262f",
  blue: "#2456e8",
  lightBlue: "#6ea0ff",
  yellow: "#ffd23f",
  cyan: "#7ff3ff",
  green: "#5fff8a",
  white: "#f2f4ff",
  navy: "#0a0f2e",
  dim: "#6a78b8",
};

type SpriteDef = { rows: string[]; colors: Record<string, string> };

/* The arcade's own hero: red helmet, cyan visor, blue suit, yellow diamond. One glove raised. */
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
const HERO_COLORS = { h: "#e3262f", R: "#e3262f", K: "#05060f", V: "#7ff3ff", B: "#2456e8", Y: "#ffd23f" };
export const HERO_W = 16;
export const HERO_H = 19;

/* A city block: three towers with lit windows. 16×12. */
const CITY_A = [
  "......rr........",
  "......TT....ss..",
  ".....TTTT...SS..",
  ".....TwTw...SS..",
  "..ss.TTTT..SSSS.",
  "..SS.TwTw..SwSw.",
  ".SSSSTTTT..SSSS.",
  ".SwSwTwTwTTSwSw.",
  ".SSSSTTTTTTSSSS.",
  ".SwSwTwTwTwSwSw.",
  ".SSSSTTTTTTSSSS.",
  "gggggggggggggggg",
];
const CITY_B = [
  "..rr............",
  "..TT........ss..",
  ".TTTT.......SS..",
  ".TwTw..ss..SSSS.",
  ".TTTT..SS..SwSw.",
  ".TwTw.SSSS.SSSS.",
  ".TTTT.SwSw.SwSw.",
  ".TwTwSSSSSSSSSS.",
  ".TTTTSwSwSwSwSw.",
  ".TwTwSSSSSSSSSS.",
  ".TTTTSwSwSwSwSw.",
  "gggggggggggggggg",
];
const CITY_COLORS = { T: "#2456e8", S: "#1a3a9e", w: "#ffd23f", r: "#e3262f", s: "#6ea0ff", g: "#6ea0ff" };
const CITY_COLORS_B = { T: "#1a3a9e", S: "#2456e8", w: "#ffd23f", r: "#e3262f", s: "#6ea0ff", g: "#6ea0ff" };
export const CITY_W = 16;
export const CITY_H = 12;

const RUBBLE = [
  "................",
  "................",
  "................",
  "................",
  "................",
  "................",
  "................",
  "......k.........",
  "..k..kkk...k....",
  ".kkkrkkkk.kkk.k.",
  "kkrkkkkrkkkkrkkk",
  "gggggggggggggggg",
];
const RUBBLE_COLORS = { k: "#2a2f55", r: "#e3262f", g: "#3a4c9a" };

/* Interceptor launcher: a web turret. 12×7. */
const TURRET = [
  "....cccc....",
  "...cBBBBc...",
  "..cBBYYBBc..",
  "..BBBBBBBB..",
  ".RRRRRRRRRR.",
  "RRRRRRRRRRRR",
  "KKKKKKKKKKKK",
];
const TURRET_DEAD = [
  "............",
  "............",
  "............",
  "....k..k....",
  ".kkrkkkkrk..",
  "kkkkkkkkkkkk",
  "KKKKKKKKKKKK",
];
const TURRET_COLORS = { c: "#7ff3ff", B: "#2456e8", Y: "#ffd23f", R: "#e3262f", K: "#16307e", k: "#2a2f55", r: "#e3262f" };
export const TURRET_W = 12;
export const TURRET_H = 7;

export const CROSSHAIR = [
  "...#...",
  "...#...",
  ".......",
  "##...##",
  ".......",
  "...#...",
  "...#...",
];

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
  cities: HTMLCanvasElement[];
  rubble: HTMLCanvasElement;
  turret: HTMLCanvasElement;
  turretDead: HTMLCanvasElement;
  crosshair: HTMLCanvasElement;
  crosshairLock: HTMLCanvasElement;
}

let cached: SpriteSheet | null = null;

export function getSprites(): SpriteSheet {
  if (cached) return cached;
  cached = {
    hero: render({ rows: HERO_ROWS, colors: HERO_COLORS }),
    cities: [render({ rows: CITY_A, colors: CITY_COLORS }), render({ rows: CITY_B, colors: CITY_COLORS_B })],
    rubble: render({ rows: RUBBLE, colors: RUBBLE_COLORS }),
    turret: render({ rows: TURRET, colors: TURRET_COLORS }),
    turretDead: render({ rows: TURRET_DEAD, colors: TURRET_COLORS }),
    crosshair: render({ rows: CROSSHAIR, colors: { "#": PALETTE.yellow } }),
    crosshairLock: render({ rows: CROSSHAIR, colors: { "#": PALETTE.cyan } }),
  };
  return cached;
}
