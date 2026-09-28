// Pixel-art sprites defined as character grids, pre-rendered to offscreen canvases.
// Palette is inspired by early-80s arcade hardware: few colors, hard edges, no anti-aliasing.

export const PALETTE = {
  sky: "#000010",
  star: "#ffffff",
  starDim: "#5a6ad0",
  farMtn: "#2a3fa8",
  farMtnHi: "#6a86ff",
  midHill: "#157a33",
  midHillHi: "#3fd35f",
  dome: "#9aa7c7",
  domeWin: "#ffe25a",
  ground: "#b8732e",
  groundDark: "#7a4518",
  groundHi: "#f0b060",
  crater: "#1a0c04",
  hudCyan: "#5ff5ff",
};

type SpriteDef = { rows: string[]; colors: Record<string, string> };

const ROVER: SpriteDef = {
  rows: [
    "....w...................",
    "....w.......cccc........",
    "....w......cccccc.......",
    "...ppppppppccccccpppp...",
    "..pppppppppppppppppppgg.",
    ".pppppppppppppppppppppgg",
    ".dddddddddddddddddddddd.",
    "..d..d..........d..d....",
  ],
  colors: { w: "#ffffff", c: "#5ff5ff", p: "#e24ae2", d: "#8a1f8a", g: "#c8c8c8" },
};

const WHEEL_A: SpriteDef = {
  rows: [".wwww.", "wgwwgw", "wwkkww", "wwkkww", "wgwwgw", ".wwww."],
  colors: { w: "#e8e8e8", g: "#7a7a7a", k: "#303030" },
};
const WHEEL_B: SpriteDef = {
  rows: [".wwww.", "wwgwww", "wgkkww", "wwkkgw", "wwwgww", ".wwww."],
  colors: { w: "#e8e8e8", g: "#7a7a7a", k: "#303030" },
};

const UFO: SpriteDef = {
  rows: [
    "......cccc......",
    "....cccccccc....",
    "..rrrrrrrrrrrr..",
    "rrryyrryyrryyrrr",
    "..rrrrrrrrrrrr..",
    "....r......r....",
  ],
  colors: { c: "#9ff0ff", r: "#e03a3a", y: "#ffe25a" },
};

const ANSWER_UFO: SpriteDef = {
  rows: [
    "......cccc......",
    "....cccccccc....",
    "..gggggggggggg..",
    "gggyygggyygggyyg",
    "..gggggggggggg..",
    "....g......g....",
  ],
  colors: { c: "#ffffff", g: "#34c86a", y: "#ffe25a" },
};

const ROCK_SMALL: SpriteDef = {
  rows: ["..hhh...", ".hhooo..", "hhoooood", "hooooodd", "ooooodd.", ".oodddd."],
  colors: { h: "#e8c090", o: "#a8703a", d: "#5a3414" },
};

const ROCK_BIG: SpriteDef = {
  rows: [
    "....hhhh....",
    "..hhhoooo...",
    ".hhoooooood.",
    "hhoooooooodd",
    "hooooooooodd",
    "ooooooooodd.",
    "oooooooodddd",
    ".ooooodddddd",
    "..ddddddddd.",
  ],
  colors: { h: "#e8c090", o: "#a8703a", d: "#5a3414" },
};

const FLAG: SpriteDef = {
  rows: [
    "wyyyyyy",
    "wyyyyyy",
    "wyyyyyy",
    "w......",
    "w......",
    "w......",
    "w......",
    "w......",
    "w......",
    "w......",
    "www....",
  ],
  colors: { w: "#ffffff", y: "#ffe25a" },
};

/** Body / shadow pairs for the rover's per-run paint job (the window stays cyan). */
export const ROVER_COLORS = [
  { body: "#e24ae2", dark: "#8a1f8a" }, // arcade magenta
  { body: "#e8453c", dark: "#8a1c16" }, // red
  { body: "#f08a24", dark: "#8a4a10" }, // orange
  { body: "#f0d030", dark: "#8a7010" }, // yellow
  { body: "#6ad03a", dark: "#2f6a14" }, // lime
  { body: "#3a8cf0", dark: "#18407a" }, // blue
  { body: "#9a5af0", dark: "#4a248a" }, // violet
  { body: "#e8e8f0", dark: "#7a7a90" }, // white
];

export function makeRover(body: string, dark: string): HTMLCanvasElement {
  return render({ rows: ROVER.rows, colors: { ...ROVER.colors, p: body, d: dark } });
}

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
  rover: HTMLCanvasElement;
  wheelA: HTMLCanvasElement;
  wheelB: HTMLCanvasElement;
  ufo: HTMLCanvasElement;
  answerUfo: HTMLCanvasElement;
  rockSmall: HTMLCanvasElement;
  rockBig: HTMLCanvasElement;
  flag: HTMLCanvasElement;
}

let cached: SpriteSheet | null = null;

export function getSprites(): SpriteSheet {
  if (!cached) {
    cached = {
      rover: render(ROVER),
      wheelA: render(WHEEL_A),
      wheelB: render(WHEEL_B),
      ufo: render(UFO),
      answerUfo: render(ANSWER_UFO),
      rockSmall: render(ROCK_SMALL),
      rockBig: render(ROCK_BIG),
      flag: render(FLAG),
    };
  }
  return cached;
}
