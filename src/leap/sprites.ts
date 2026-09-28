// Pixel-art sprites defined as character grids, pre-rendered to offscreen canvases.
// SpiderBen10's Arcade palette: reds, blues and a yellow accent on navy.

export const PALETTE = {
  navy: "#0a0f2e",
  red: "#e3262f",
  blue: "#2456e8",
  lightBlue: "#6ea0ff",
  yellow: "#ffd23f",
  cyan: "#7ff3ff",
  green: "#5fff8a",
  white: "#f2f4ff",
  road: "#171a3c",
  roadLine: "#3a4288",
  walk: "#2c2f66",
  walkLine: "#3d4290",
  water: "#1b46c4",
  waterDark: "#10318f",
  waterLight: "#4f7cf0",
  grass: "#1d7a36",
  grassLight: "#3fd35f",
  hedge: "#0f5a24",
  hedgeLight: "#2f9a4a",
  log: "#8a5a2b",
  logDark: "#5c3a18",
  logLight: "#b77b3f",
  pad: "#2f9a4a",
  padDark: "#1a6630",
};

type SpriteDef = { rows: string[]; colors: Record<string, string> };

/*
 * The arcade's own hero, shrunk to lane size: red helmet, cyan visor stripe, blue suit,
 * yellow diamond emblem. Frame 1 stands; frame 2 is mid-hop with arms up.
 */
const HERO_STAND = [
  "....KKKK....",
  "...KRRRRK...",
  "..KRRRRRRK..",
  "..KVVVVVVK..",
  "..KRRRRRRK..",
  "...KRRRRK...",
  ".hBBBBBBBBh.",
  "h.BBBYYBBB.h",
  "..BBYYYYBB..",
  "...BBYYBB...",
  "...RRRRRR...",
  "...BB..BB...",
  "..hhh..hhh..",
];
const HERO_HOP = [
  "h...KKKK...h",
  "h..KRRRRK..h",
  ".hKRRRRRRKh.",
  "..KVVVVVVK..",
  "..KRRRRRRK..",
  "...KRRRRK...",
  "..BBBBBBBB..",
  "..BBBYYBBB..",
  "..BBYYYYBB..",
  "...BBYYBB...",
  "...RRRRRR...",
  "..BB....BB..",
  ".hh......hh.",
];
const HERO_COLORS = { h: "#e3262f", R: "#e3262f", K: "#05060f", V: "#7ff3ff", B: "#2456e8", Y: "#ffd23f" };
export const HERO_W = 12;
export const HERO_H = 13;

/* Vehicles face right; the engine flips them for left-moving lanes. C = body colour. */
const CAR = [
  ".....CCCCCC.....",
  "....CwwCwwwC....",
  "...CwwwCwwwwC...",
  ".CCCCCCCCCCCCCC.",
  "CCCCCCCCCCCCCCCy",
  "CCddCCCCCCCddCCC",
  ".CkkkCCCCCCkkkC.",
  "..kkk......kkk..",
];
const RACER = [
  "......CC....",
  "..CCCwwwCC..",
  "CCCCCCCCCCCy",
  "CdCCCCCCCCdC",
  ".kkk....kkk.",
  ".kkk....kkk.",
];
const TRUCK = [
  "SSSSSSSSSSSSSSSSSSSS...CCC..",
  "SSSSSSSSSSSSSSSSSSSS..CwwwC.",
  "SSSSSSSSSSSSSSSSSSSS..CwwwCC",
  "SSSttSSSSSSSSSSSttSS..CCCCCC",
  "SSSSSSSSSSSSSSSSSSSSCCCCCCCy",
  "SSSSSSSSSSSSSSSSSSSSCCCCCCCC",
  "dddddddddddddddddddddddddddd",
  "..kkk..kkk.........kkk.kkk..",
  "..kkk..kkk.........kkk.kkk..",
];
const SCOOTER = [
  "......RR..",
  ".....RVVR.",
  "......RR..",
  "....BBBB..",
  "...BBBBh..",
  ".CCCCCCCC.",
  "kk.CCCC.kk",
  "kk......kk",
];
const VEHICLE_COLORS = [
  { C: "#e3262f", d: "#8a141a" },
  { C: "#ffd23f", d: "#a8841c" },
  { C: "#5fff8a", d: "#1f8a3a" },
  { C: "#c070ff", d: "#6a2aa8" },
  { C: "#ff9a3a", d: "#a85a14" },
  { C: "#7ff3ff", d: "#2a8a9a" },
];
const VEHICLE_COMMON = { w: "#bfe8ff", y: "#fff6b0", k: "#05060f", S: "#dfe4ff", t: "#6ea0ff", R: "#e3262f", V: "#7ff3ff", B: "#2456e8", h: "#e3262f" };

export type VehicleKind = "car" | "racer" | "truck" | "scooter";
const VEHICLE_ROWS: Record<VehicleKind, string[]> = { car: CAR, racer: RACER, truck: TRUCK, scooter: SCOOTER };

/* A lily pad (drawn in a row to make a raft) and a turtle-like pad flower. */
const PAD = [
  "...gggggg...",
  ".gggggggggg.",
  "gggGggggggGg",
  "ggggggg..ggg",
  "gggggggg..gg",
  ".gggGgggggg.",
  "...gggggg...",
];
const PAD_COLORS = { g: "#2f9a4a", G: "#5fff8a" };

function render(def: SpriteDef, flip = false): HTMLCanvasElement {
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
        ctx.fillRect(flip ? w - 1 - x : x, y, 1, 1);
      }
    });
  });
  return c;
}

export interface SpriteSheet {
  hero: HTMLCanvasElement;
  heroHop: HTMLCanvasElement;
  /** [kind][colour][0 = facing right, 1 = facing left] */
  vehicles: Record<VehicleKind, HTMLCanvasElement[][]>;
  pad: HTMLCanvasElement;
}

let cached: SpriteSheet | null = null;

export function getSprites(): SpriteSheet {
  if (cached) return cached;
  const vehicles = {} as SpriteSheet["vehicles"];
  for (const kind of Object.keys(VEHICLE_ROWS) as VehicleKind[]) {
    vehicles[kind] = VEHICLE_COLORS.map((c) => {
      const colors = { ...VEHICLE_COMMON, ...c };
      return [render({ rows: VEHICLE_ROWS[kind], colors }), render({ rows: VEHICLE_ROWS[kind], colors }, true)];
    });
  }
  cached = {
    hero: render({ rows: HERO_STAND, colors: HERO_COLORS }),
    heroHop: render({ rows: HERO_HOP, colors: HERO_COLORS }),
    vehicles,
    pad: render({ rows: PAD, colors: PAD_COLORS }),
  };
  return cached;
}

export function vehicleSize(kind: VehicleKind): { w: number; h: number } {
  const rows = VEHICLE_ROWS[kind];
  return { w: rows[0].length, h: rows.length };
}

export const VEHICLE_COLOR_COUNT = VEHICLE_COLORS.length;
