/*
 * Original pixel art for Maze Muncher, as character grids (one character per pixel).
 * The hero is the arcade's own helmeted hero, turned into a round "Munch-Bot" head: red
 * helmet, cyan visor, yellow diamond and a chomping jaw. The critters are original:
 * a goo blob, a bat, a crab and a little robot. Bonus items are school supplies.
 */

export type Grid = string[];

/* ---------------------------------------------------------------- hero (11×11) */

const HERO_TOP = [
  "...RRRRR...",
  "..RRRRRRR..",
  ".RRRRYRRRR.",
  ".RRRYYYRRR.",
  "RRRRRYRRRRR",
  "RVVVVVVVVVR",
  "RVVVVVVVVVR",
];

/** Jaw frames: wide open, half, shut. */
export const HERO_FRAMES: Grid[] = [
  [...HERO_TOP, "RRRRRRRRRRR", "RKWKWKWKWKR", ".RKKKKKKKR.", "..RWKWKWR.."],
  [...HERO_TOP, "RRRRRRRRRRR", "RRKWKWKWKRR", ".RRKKKKKRR.", "..RRRRRRR.."],
  [...HERO_TOP, "RRRRRRRRRRR", "RRRRRRRRRRR", ".RRKKKKKRR.", "..RRRRRRR.."],
];

export const HERO_COLORS: Record<string, string> = {
  R: "#e3262f", V: "#7ff3ff", Y: "#ffd23f", K: "#05060f", W: "#ffffff", B: "#2456e8",
};

/** Pupil positions in the visor (x, y) for facing up, left, down, right, and idle. */
export const HERO_PUPILS: [number, number][][] = [
  [[3, 5], [7, 5]],
  [[2, 5], [6, 5]],
  [[3, 6], [7, 6]],
  [[4, 5], [8, 5]],
];

/* ---------------------------------------------------------------- critters (10×10) */

export interface CritterArt {
  frames: [Grid, Grid];
  colors: Record<string, string>;
}

/** GLOOP: a green goo drop that puddles as it slides. */
const GLOOP: CritterArt = {
  frames: [
    [
      "....GG....",
      "...GGGG...",
      "...GGGG...",
      "..GGGGGG..",
      ".GWKGGWKG.",
      ".GWKGGWKG.",
      "GGGGGGGGGG",
      "GGGGMMGGGG",
      "GGGGGGGGGG",
      ".GGGGGGGG.",
    ],
    [
      ".....GG...",
      "....GGGG..",
      "...GGGG...",
      "..GGGGGG..",
      ".GWKGGWKG.",
      ".GWKGGWKG.",
      "GGGGGGGGGG",
      "GGGGMMGGGG",
      "GGGGGGGGGG",
      "GGGGGGGGGG",
    ],
  ],
  colors: { G: "#43d664", W: "#ffffff", K: "#05060f", M: "#136b2a" },
};

/** FLIT: a purple bat that flaps. */
const FLIT: CritterArt = {
  frames: [
    [
      "P........P",
      "PP.P..P.PP",
      "PPPPPPPPPP",
      "PPPWPPWPPP",
      ".PPKPPKPP.",
      "..PPPPPP..",
      "...PWWP...",
      "....PP....",
      "..........",
      "..........",
    ],
    [
      "..........",
      "...P..P...",
      "..PPPPPP..",
      ".PPWPPWPP.",
      "PPPKPPKPPP",
      "PPPPPPPPPP",
      "P..PWWP..P",
      "....PP....",
      "..........",
      "..........",
    ],
  ],
  colors: { P: "#b061ff", W: "#ffffff", K: "#05060f" },
};

/** PINCH: an orange crab, claws up, legs scuttling. */
const PINCH: CritterArt = {
  frames: [
    [
      "OO......OO",
      "O.O....O.O",
      "OO......OO",
      ".O.W..W.O.",
      ".OOKOOKOO.",
      "OOOOOOOOOO",
      ".OOOMMOOO.",
      "O.O.OO.O.O",
      "..........",
      "..........",
    ],
    [
      ".OO....OO.",
      "O..O..O..O",
      ".OO....OO.",
      ".O.W..W.O.",
      ".OOKOOKOO.",
      "OOOOOOOOOO",
      ".OOOMMOOO.",
      ".O.O..O.O.",
      "..........",
      "..........",
    ],
  ],
  colors: { O: "#ff8a1f", W: "#ffffff", K: "#05060f", M: "#8a3a00" },
};

/** BOLT: a cyan robot with a screen face, rolling on treads. */
const BOLT: CritterArt = {
  frames: [
    [
      "....Y.....",
      "....C.....",
      ".CCCCCCCC.",
      ".CSSSSSSC.",
      ".CSWSSWSC.",
      ".CSSSSSSC.",
      ".CCCCCCCC.",
      "..CCCCCC..",
      ".KCKCKCKC.",
      "..........",
    ],
    [
      ".....Y....",
      "....C.....",
      ".CCCCCCCC.",
      ".CSSSSSSC.",
      ".CSWSSWSC.",
      ".CSSSSSSC.",
      ".CCCCCCCC.",
      "..CCCCCC..",
      ".CKCKCKCK.",
      "..........",
    ],
  ],
  colors: { C: "#3fe0e8", S: "#0b2a44", W: "#ffffff", K: "#05060f", Y: "#ffd23f" },
};

/** Indexed like CRITTERS in sim.ts. */
export const CRITTER_ART: CritterArt[] = [GLOOP, FLIT, PINCH, BOLT];

/** Dizzy look (after a right answer): same shape, pale and swirly-eyed. */
export const DIZZY_COLORS = { body: "#8d97e8", flash: "#f2f4ff", eye: "#ffd23f" };

/** Eaten critters float home as a little puff with eyes. */
export const PUFF: Grid = [
  "..WWWW..",
  ".WWWWWW.",
  "WWKWWKWW",
  ".WWWWWW.",
  "..W..W..",
];

/* ---------------------------------------------------------------- bonus items (8×8) */

export const ITEM_ART: { grid: Grid; colors: Record<string, string> }[] = [
  {
    // book
    grid: ["BBBBBBB.", "BWWWWWBB", "BWKKKWBB", "BWWWWWBB", "BWKKKWBB", "BWWWWWBB", "BBBBBBBB", ".BBBBBBB"],
    colors: { B: "#2456e8", W: "#f2f4ff", K: "#6a78b8" },
  },
  {
    // beaker
    grid: [".WWWWW..", "..W.W...", "..W.W...", ".W...W..", ".WGGGW..", "W.GGG.W.", "WGGGGGW.", ".WWWWW.."],
    colors: { W: "#cfe8ff", G: "#43d664" },
  },
  {
    // pencil
    grid: [".......P", "......YP", ".....YY.", "....YY..", "...YY...", "..YY....", ".TT.....", "K......."],
    colors: { Y: "#ffd23f", P: "#ff8fc8", T: "#e8c49a", K: "#05060f" },
  },
  {
    // magnet
    grid: ["WW...WW.", "WW...WW.", "RR...RR.", "RR...RR.", "RR...RR.", "RRR.RRR.", ".RRRRR..", "..RRR..."],
    colors: { R: "#e3262f", W: "#d8dce8" },
  },
  {
    // globe
    grid: ["..BBBB..", ".BGGBBB.", "BGGGBBGB", "BBGBBGGB", "BBBBBGGB", ".BBGBBB.", "..BBBB..", ".KKKKK.."],
    colors: { B: "#2456e8", G: "#43d664", K: "#c8894a" },
  },
  {
    // ruler
    grid: ["........", "YYYYYYYY", "YKYKYKYK", "YKY.YKY.", "YYYYYYYY", "YYYYYYYY", "........", "........"],
    colors: { Y: "#ffd23f", K: "#05060f" },
  },
  {
    // apple
    grid: ["....G...", "...GG...", ".RRRRRR.", "RRWRRRRR", "RWRRRRRR", "RRRRRRRR", ".RRRRRR.", "..RR.RR."],
    colors: { R: "#e3262f", G: "#43d664", W: "#ffb0b4" },
  },
  {
    // trophy
    grid: ["YYYYYYYY", "YYYYYYYY", ".YYYYYY.", "..YYYY..", "...YY...", "...YY...", "..YYYY..", ".KKKKKK."],
    colors: { Y: "#ffd23f", K: "#c8894a" },
  },
];

/* ---------------------------------------------------------------- drawing helpers */

const spriteCache = new Map<string, HTMLCanvasElement>();

/** Renders a grid to a small canvas (cached by key). */
export function spriteCanvas(key: string, grid: Grid, colors: Record<string, string>): HTMLCanvasElement {
  let c = spriteCache.get(key);
  if (c) return c;
  c = document.createElement("canvas");
  c.width = Math.max(...grid.map((r) => r.length));
  c.height = grid.length;
  const g = c.getContext("2d")!;
  grid.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      const col = colors[row[x]];
      if (col) {
        g.fillStyle = col;
        g.fillRect(x, y, 1, 1);
      }
    }
  });
  spriteCache.set(key, c);
  return c;
}
