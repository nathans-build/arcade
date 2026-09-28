// Pixel-art sprites defined as character grids, pre-rendered to offscreen canvases.
// All original: the arcade hero dressed as a jungle explorer, swamp snappers, sting-crabs,
// coil snakes, treasures and map-key icons. SpiderBen10 palette plus jungle greens.

export const PALETTE = {
  navy: "#0a0f2e",
  red: "#e3262f",
  blue: "#2456e8",
  lightBlue: "#6ea0ff",
  yellow: "#ffd23f",
  cyan: "#7ff3ff",
  green: "#5fff8a",
  white: "#f2f4ff",
  leafDark: "#0f3b1c",
  leaf: "#1d5e27",
  leafLight: "#2f8f3a",
  leafBright: "#58c24a",
  jungleBack: "#12301f",
  jungleFar: "#16402a",
  trunk: "#5a3a1c",
  trunkDark: "#3d2711",
  path: "#b58a4c",
  pathDark: "#8e6933",
  dirt: "#5b3b1f",
  dirtDark: "#3f2913",
  tar: "#15101a",
  tarShine: "#3a2d4a",
  water: "#1f6f8b",
  waterLight: "#4fb3c9",
  stone: "#8d8a7c",
  stoneDark: "#5f5c52",
  stoneLight: "#b9b5a3",
  rope: "#c9a45c",
};

type Grid = string[];

const HERO_COLORS: Record<string, string> = {
  R: "#e3262f", r: "#a3141c", V: "#7ff3ff", K: "#05060f", B: "#2456e8", b: "#16379e", Y: "#ffd23f", t: "#8e5a2a", s: "#f2c9a0",
};

const HERO_TOP: Grid = [
  "....rRRRr...",
  "...RRRRRRR..",
  "...RRRRRRRr.",
  "...RRRRVVVK.",
  "...RRRRRRRK.",
  ".rrrrrrrrrrr",
  "....BBBBB...",
  "...BBBYBBB..",
  "..BBBYYYBBB.",
  "..B.BBYBBtB.",
  "..B.BBBBBtB.",
  "..R.bbbbb.R.",
  "....BBBBBB..",
];
const HERO_STAND: Grid = [...HERO_TOP, "....BB.BB...", "....BB.BB...", "....BB.BB...", "...KKK.KKK..", "............"];
const HERO_RUN_A: Grid = [...HERO_TOP, "...BBB..BB..", "..BB.....BB.", ".BB.......B.", ".KK.......KK", "............"];
const HERO_RUN_B: Grid = [...HERO_TOP, ".....BBB....", ".....BBB....", ".....BB.....", ".....KKKK...", "............"];
const HERO_JUMP: Grid = [
  "....rRRRr...",
  "...RRRRRRR..",
  "...RRRRRRRr.",
  "...RRRRVVVK.",
  "...RRRRRRRK.",
  ".rrrrrrrrrrr",
  "..R.BBBBB.R.",
  "..B.BBYBB.B.",
  "..BBBYYYBBB.",
  "....BBYBBt..",
  "....BBBBBt..",
  "....bbbbb...",
  "...BBBBBBB..",
  "..BB....BB..",
  ".BB......BB.",
  ".KK......KK.",
  "............",
  "............",
];
/** Facing the camera: climbing ladders and hanging from vines. */
const HERO_CLIMB_A: Grid = [
  "....RRRR....",
  "...RRRRRR...",
  "...RRRRRR...",
  "...VVVVVV...",
  "...RRRRRR...",
  "..rrrrrrrr..",
  ".R.BBBBBB.R.",
  ".B.BBYYBB.B.",
  ".B.BYYYYB.B.",
  "...BBYYBB...",
  "...bbbbbb...",
  "...BB..BB...",
  "...BB..BB...",
  "...BB...BB..",
  "..KKK...KKK.",
  "............",
  "............",
  "............",
];
const HERO_CLIMB_B: Grid = [...HERO_CLIMB_A.slice(0, 11), "...BB..BB...", "...BB..BB...", "..BB...BB...", ".KKK...KKK..", "............", "............", "............"];
/** Tumbling after a fall or a bite. */
const HERO_HURT: Grid = [
  "............",
  "............",
  "............",
  "............",
  "..Y.....Y...",
  "............",
  ".....Y......",
  "...KK.......",
  "..KK.BBB.rR.",
  "..BBBBYBBRRR",
  "..BBBYYYBRVR",
  "..BBBBYBBRRR",
  "..KK.BBB.rR.",
  "...KK.......",
  "............",
  "............",
  "............",
  "............",
];
export const HERO_SPRITE_W = 12;
export const HERO_SPRITE_H = 18;

const SNAKE: Grid = [
  "..........gg..",
  ".........gKgr.",
  ".........gggr.",
  "...gggg...g...",
  ".ggyyyygg.g...",
  "gyggggggyggg..",
  "gyyyyyyyyyyg..",
  ".gggggggggg...",
];
const SNAKE_B: Grid = [
  "..............",
  "..........gg..",
  ".........gKg..",
  "...gggg..gggr.",
  ".ggyyyygg.g...",
  "gyggggggyggg..",
  "gyyyyyyyyyyg..",
  ".gggggggggg...",
];
const SNAKE_COLORS = { g: "#8a3fd1", y: "#ffd23f", K: "#05060f", r: "#e3262f" };

const SCORP_A: Grid = [
  "..........oo..",
  "...........oO.",
  "..........oo..",
  "Oo..ooooooo...",
  "OoooOOOOOOo...",
  "Oo..ooooooo...",
  "...o.o.o.o....",
  "..o.o.o.o.....",
];
const SCORP_B: Grid = [
  "..........oo..",
  "...........oO.",
  "..........oo..",
  ".Oo.ooooooo...",
  "OoooOOOOOOo...",
  ".Oo.ooooooo...",
  "..o.o.o.o.....",
  "...o.o.o.o....",
];
const SCORP_COLORS = { o: "#ff8a3d", O: "#b8431a" };

const TREASURES: Record<string, { rows: Grid; colors: Record<string, string> }> = {
  map: {
    rows: [
      ".tttttttt.",
      "tTTTTTTTTt",
      "tTbTTTTTTt",
      "tTTbbTTRTt",
      "tTTTTbRTTt",
      "tTTTTTRbTt",
      "tTTTTRTTbt",
      "tTTTTTTTTt",
      "tTTTTTTTTt",
      ".tttttttt.",
    ],
    colors: { t: "#8e6933", T: "#f0dca0", b: "#2456e8", R: "#e3262f" },
  },
  compass: {
    rows: [
      "...YYYY...",
      "..YwwwwY..",
      ".YwwwRwwY.",
      "YwwwwRwwwY",
      "YwwwRRwwwY",
      "YwwwKKwwwY",
      "YwwwKwwwwY",
      ".YwwKwwwY.",
      "..YwwwwY..",
      "...YYYY...",
    ],
    colors: { Y: "#ffd23f", w: "#f2f4ff", R: "#e3262f", K: "#05060f" },
  },
  coin: {
    rows: [
      "...YYYY...",
      "..YyyyyY..",
      ".YyyyWyyY.",
      "YyyyWWWyyY",
      "YyWWWWWWyY",
      "YyyWWWWyyY",
      "YyyWyyWyyY",
      ".YyyyyyyY.",
      "..YyyyyY..",
      "...YYYY...",
    ],
    colors: { Y: "#c9971c", y: "#ffd23f", W: "#fff3b0" },
  },
  flag: {
    rows: [
      "KRRRRRRR..",
      "KBBwRRRR..",
      "KBwBwwww..",
      "KBBwRRRR..",
      "KwwwwwwR..",
      "KRRRRRRR..",
      "K.........",
      "K.........",
      "K.........",
      "KK........",
    ],
    colors: { K: "#c9a45c", R: "#e3262f", B: "#2456e8", w: "#f2f4ff" },
  },
  ballot: {
    rows: [
      "...ww.....",
      "...wKw....",
      "...wwKw...",
      "BBBKKKKBBB",
      "BbbbbbbbbB",
      "BbwwbbbbbB",
      "BbwwbYYbbB",
      "BbbbbYYbbB",
      "BbbbbbbbbB",
      "BBBBBBBBBB",
    ],
    colors: { w: "#f2f4ff", K: "#05060f", B: "#16379e", b: "#2456e8", Y: "#ffd23f" },
  },
  vase: {
    rows: [
      "..cccccc..",
      "...cCCc...",
      "...cCCc...",
      "..cCCCCc..",
      ".cYYYYYYc.",
      "cCCKCCKCCc",
      "cCCCCCCCCc",
      ".cYYYYYYc.",
      "..cCCCCc..",
      "...cccc...",
    ],
    colors: { c: "#7a3c1c", C: "#c0662e", Y: "#ffd23f", K: "#05060f" },
  },
};

const ICONS: Record<string, { rows: Grid; colors: Record<string, string> }> = {
  water: { rows: [".........", ".bb...bb.", "b..bbb..b", ".........", ".bb...bb.", "b..bbb..b", "........."], colors: { b: "#6ea0ff" } },
  mountain: { rows: ["....w....", "...www...", "..gwggg..", "..ggggg..", ".ggggggg.", ".ggggggg.", "ggggggggg"], colors: { w: "#f2f4ff", g: "#9a968a" } },
  tree: { rows: ["...ggg...", "..ggggg..", ".ggggggg.", "..ggggg..", ".ggggggg.", "....t....", "....t...."], colors: { g: "#58c24a", t: "#8e5a2a" } },
  house: { rows: ["....r....", "...rrr...", "..rrrrr..", ".rrrrrrr.", "..wwwww..", "..wwKww..", "..wwKww.."], colors: { r: "#e3262f", w: "#f2f4ff", K: "#5a3a1c" } },
  school: { rows: ["....Rr...", "....K....", "..wwwww..", ".wwwwwww.", ".wKwKwKw.", ".wwwwwww.", ".wwwKwww."], colors: { R: "#e3262f", r: "#2456e8", K: "#0a0f2e", w: "#ffd23f" } },
};

function render(rows: Grid, colors: Record<string, string>): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = rows[0].length;
  c.height = rows.length;
  const g = c.getContext("2d")!;
  rows.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      const col = colors[row[x]];
      if (col) {
        g.fillStyle = col;
        g.fillRect(x, y, 1, 1);
      }
    }
  });
  return c;
}

export interface Sprites {
  hero: Record<"stand" | "runA" | "runB" | "jump" | "climbA" | "climbB" | "hurt", HTMLCanvasElement>;
  snake: [HTMLCanvasElement, HTMLCanvasElement];
  scorp: [HTMLCanvasElement, HTMLCanvasElement];
  treasure: Record<string, HTMLCanvasElement>;
  icon: Record<string, HTMLCanvasElement>;
}

let cached: Sprites | null = null;
export function getSprites(): Sprites {
  if (cached) return cached;
  const treasure: Record<string, HTMLCanvasElement> = {};
  for (const [k, v] of Object.entries(TREASURES)) treasure[k] = render(v.rows, v.colors);
  const icon: Record<string, HTMLCanvasElement> = {};
  for (const [k, v] of Object.entries(ICONS)) icon[k] = render(v.rows, v.colors);
  cached = {
    hero: {
      stand: render(HERO_STAND, HERO_COLORS),
      runA: render(HERO_RUN_A, HERO_COLORS),
      runB: render(HERO_RUN_B, HERO_COLORS),
      jump: render(HERO_JUMP, HERO_COLORS),
      climbA: render(HERO_CLIMB_A, HERO_COLORS),
      climbB: render(HERO_CLIMB_B, HERO_COLORS),
      hurt: render(HERO_HURT, HERO_COLORS),
    },
    snake: [render(SNAKE, SNAKE_COLORS), render(SNAKE_B, SNAKE_COLORS)],
    scorp: [render(SCORP_A, SCORP_COLORS), render(SCORP_B, SCORP_COLORS)],
    treasure,
    icon,
  };
  return cached;
}

/** For tests: every grid is rectangular. */
export const ALL_GRIDS: Record<string, Grid> = {
  HERO_STAND, HERO_RUN_A, HERO_RUN_B, HERO_JUMP, HERO_CLIMB_A, HERO_CLIMB_B, HERO_HURT, SNAKE, SNAKE_B, SCORP_A, SCORP_B,
  ...Object.fromEntries(Object.entries(TREASURES).map(([k, v]) => [`TREASURE_${k}`, v.rows])),
  ...Object.fromEntries(Object.entries(ICONS).map(([k, v]) => [`ICON_${k}`, v.rows])),
};
