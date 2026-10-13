/*
 * Original pixel art for Cipher Pursuit, drawn from character maps (no image files).
 * Every vehicle faces up the screen. One character = one pixel; "." is transparent.
 */

export const PAL: Record<string, string> = {
  W: "#f2f4ff", r: "#e3262f", R: "#9e1820", b: "#6ea0ff", B: "#2456e8", k: "#11131f", y: "#ffd23f", Y: "#c99a12",
  g: "#5fff8a", G: "#1e9e4a", p: "#7a2fb8", P: "#b06be8", o: "#ff8a1f", n: "#8a5a2b", N: "#5a3a1b", s: "#8a90a8",
  d: "#2b2f45", c: "#7ff3ff", w: "#c8ccdf", m: "#3b1260",
};

const CAR = [
  "..yWWWWy..",
  ".WWbbbbWW.",
  "kWbbbbbbWk",
  "kWWWrrWWWk",
  ".WWWrrWWW.",
  ".BWWrrWWB.",
  ".BWWrrWWB.",
  ".WWWrrWWW.",
  ".WWWrrWWW.",
  "kWbbbbbbWk",
  "kWWWrrWWWk",
  ".WWWrrWWW.",
  ".WWWWWWWW.",
  ".rWWWWWWr.",
  "..rrrrrr..",
];

const BOAT = [
  ".....WW.....",
  "....WWWW....",
  "...WWrrWW...",
  "...WWrrWW...",
  "..WWWrrWWW..",
  "..WbbbbbbW..",
  "..WbbbbbbW..",
  "..WWWrrWWW..",
  "..BWWrrWWB..",
  "..BWWrrWWB..",
  "..WWWrrWWW..",
  "..WWWrrWWW..",
  "..WWWWWWWW..",
  "..dddddddd..",
  "..c.c..c.c..",
  ".c..c..c..c.",
];

const SMUDGE = [
  "..pppppp..",
  ".pPggggPp.",
  "kpgWkgWkpk",
  "kpggggggpk",
  ".pPgGGgPp.",
  ".pppppppp.",
  ".pbbbbbbp.",
  "kppppppppk",
  "kppPPPPppk",
  ".pppppppp.",
  ".pbbbbbbp.",
  "kppppppppk",
  "kppppppppk",
  ".pppppppp.",
  "..pGggGp..",
];

const BUMPER = [
  "yyyyyyyyyy",
  ".oooooooo.",
  "kogWkgWkok",
  "koggggggok",
  ".oooGGooo.",
  ".obbbbbbo.",
  "kooooooook",
  "kooRRRRook",
  ".oooooooo.",
  ".obbbbbbo.",
  "kooooooook",
  "kooooooook",
  ".oooooooo.",
  "yyyyyyyyyy",
];

const TAILER = [
  "...GGGG...",
  "..GgggggG.",
  ".GgWkgWkG.",
  "kGggggggGk",
  "kGGGkkGGGk",
  ".GgbbbbgG.",
  ".GggggggG.",
  ".GgPggPgG.",
  "kGgPggPgGk",
  "kGGGGGGGGk",
  ".GgbbbbgG.",
  ".GggggggG.",
  ".GGGGGGGG.",
  "..o.oo.o..",
];

const SMUDGE_BOAT = [
  ".....pp.....",
  "....pPPp....",
  "...pggggp...",
  "...gWkgWk...",
  "..pggggggp..",
  "..pPgGGgPp..",
  "..pbbbbbbp..",
  "..pppppppp..",
  "..pPPPPPPp..",
  "..pppppppp..",
  "..pppppppp..",
  "..mmmmmmmm..",
  "..c.c..c.c..",
  ".c..c..c..c.",
];

const GOO = [
  "....gg..g.......",
  "..ggggggg...g...",
  ".gggGGgggggg....",
  "ggGGGGGGgggg..g.",
  ".gggGGGGGggggg..",
  "..ggggGGgggg....",
  ".g..ggggggg..g..",
  "......gg........",
];

const OIL = [
  "....dddddd......",
  "..dddddddddddd..",
  ".ddddcdddPdddddd",
  "dddddddcPPddddd.",
  ".dddddddddcdddd.",
  "..ddddPddddddd..",
  "...dddddddddd...",
  ".....dddddd.....",
];

const LOG = [
  "..nnnnnnnnnnnnnnnnnn..",
  ".NnnnNnnnnnnNnnnnnnnnN",
  "NnnNnnnnnNnnnnnnnNnnnN",
  "NnnnnnnNnnnnnnNnnnnnnN",
  ".NnnnnnnnnnNnnnnnnnnN.",
  "..NNNNNNNNNNNNNNNNNN..",
];

const FUEL = [
  ".kk.....",
  "rrrrrr..",
  "rRRRRRr.",
  "rRyyyRr.",
  "rRyRRRr.",
  "rRyyRRr.",
  "rRyRRRr.",
  "rRRRRRr.",
  ".rrrrr..",
];

const VAN = [
  "..BBBBBBBB..",
  ".BBbbbbbbBB.",
  "kBbbbbbbbbBk",
  "kBBBBBBBBBBk",
  ".BWWWWWWWWB.",
  ".BBBBccBBBB.",
  ".BBBcWWcBBB.",
  ".BBBBccBBBB.",
  ".BWWWWWWWWB.",
  ".BBBByyBBBB.",
  ".BBByyyyBBB.",
  ".BBBByyBBBB.",
  ".BBBBBBBBBB.",
  "kBBBBBBBBBBk",
  "kBBBBBBBBBBk",
  ".BBBBBBBBBB.",
  ".BWWWWWWWWB.",
  ".BBBBBBBBBB.",
  "kBBBBBBBBBBk",
  "kBBBBBBBBBBk",
  ".rBBBBBBBBr.",
  "..BBBBBBBB..",
];

export const SPRITE_MAPS = { CAR, BOAT, SMUDGE, BUMPER, TAILER, SMUDGE_BOAT, GOO, OIL, LOG, FUEL, VAN } as const;
export type SpriteName = keyof typeof SPRITE_MAPS;
export type SpriteSheet = Record<SpriteName, HTMLCanvasElement>;

function build(map: readonly string[]): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = Math.max(...map.map((r) => r.length));
  c.height = map.length;
  const g = c.getContext("2d")!;
  map.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      const col = PAL[row[x]];
      if (col) {
        g.fillStyle = col;
        g.fillRect(x, y, 1, 1);
      }
    }
  });
  return c;
}

let sheet: SpriteSheet | null = null;
export function getSprites(): SpriteSheet {
  if (!sheet) {
    sheet = Object.fromEntries(Object.entries(SPRITE_MAPS).map(([k, m]) => [k, build(m)])) as SpriteSheet;
  }
  return sheet;
}
