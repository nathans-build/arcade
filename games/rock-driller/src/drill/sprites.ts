/* Pixel sprites for Rock Driller, defined in code as character grids. All original art. */
import type { SpriteShape } from "./geology";

export const PAL = {
  red: "#e3262f",
  blue: "#2456e8",
  sky: "#6ea0ff",
  yellow: "#ffd23f",
  navy: "#0a0f2e",
  cyan: "#7ff3ff",
  green: "#5fff8a",
  white: "#f2f4ff",
  black: "#05060f",
};

type Grid = string[];

function build(rows: Grid, colors: Record<string, string>, flip = false): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = rows[0].length;
  c.height = rows.length;
  const g = c.getContext("2d")!;
  rows.forEach((row, y) => {
    for (let i = 0; i < row.length; i++) {
      const col = colors[row[i]];
      if (!col) continue;
      g.fillStyle = col;
      g.fillRect(flip ? row.length - 1 - i : i, y, 1, 1);
    }
  });
  return c;
}

/* The arcade hero, shrunk to 10×10 and holding a foam blaster (facing right). */
const HERO_TOP: Grid = [
  "...RRRR...",
  "..RRRRRR..",
  "..RRVVVVK.",
  "..RRRRRR..",
  "...BBBB...",
  "..BBYBBGG.",
  "..BYYYBGGW",
  "..BBYBB...",
];
const HERO_A: Grid = [...HERO_TOP, "..BB.BB...", ".hh...hh.."];
const HERO_B: Grid = [...HERO_TOP, "...BBB....", "...hhh...."];
const HERO_COLORS = { R: PAL.red, K: PAL.black, V: PAL.cyan, B: PAL.blue, Y: PAL.yellow, h: PAL.red, G: "#9aa4c8", W: PAL.white };

/* Burrowbug: a goggle-eyed green beetle that roams the tunnels. */
const BUG_TOP: Grid = [
  "..g....g..",
  "...gGGg...",
  "..GGGGGG..",
  ".GWWGGWWG.",
  ".GWkGGWkG.",
  ".GGGGGGGG.",
  "GGgGGGGgGG",
  ".GGGGGGGG.",
];
const BUG_A: Grid = [...BUG_TOP, "..G.GG.G..", ".G..G..G.."];
const BUG_B: Grid = [...BUG_TOP, ".G..GG..G.", "..G.G.G..."];
const BUG_COLORS = { G: "#3fbf5f", g: "#1f7a3a", W: "#ffffff", k: PAL.red };

/* Magmite: a hot lava blob that can puff a short flame along a tunnel. */
const MAG_TOP: Grid = [
  "....o.....",
  "...ooo..o.",
  "..oOOOo...",
  ".oOOOOOo..",
  ".oOWkOWko.",
  "oOOOOOOOOo",
  "oOOyyyyOOo",
  "oOOOOOOOOo",
];
const MAG_A: Grid = [...MAG_TOP, ".oOOOOOOo.", "..oo..oo.."];
const MAG_B: Grid = [...MAG_TOP, ".oOOOOOOo.", ".oo....oo."];
const MAG_COLORS = { o: "#b8360f", O: "#ff7a1a", y: PAL.yellow, W: "#ffffff", k: PAL.black };

const EYES: Grid = [
  "..........",
  "..........",
  "..........",
  ".WWW..WWW.",
  ".WkW..WkW.",
  ".WWW..WWW.",
  "..........",
  "..........",
  "..........",
  "..........",
];

const BOULDER: Grid = [
  "..dddddd..",
  ".dLLlLLLd.",
  "dLllLLLLLd",
  "dLlLLLLLLd",
  "dLLLLLdLLd",
  "dLLLLLLLLd",
  "dLLdLLLLld",
  "dLLLLLLLLd",
  ".dLLLLLLd.",
  "..dddddd..",
];
const BOULDER_COLORS = { L: "#9a8f84", l: "#c9c0b4", d: "#4a443e" };

const RIG: Grid = [
  "....y....",
  "...yky...",
  "...y.y...",
  "..y.k.y..",
  "..yk.ky..",
  ".y..k..y.",
  ".yk...ky.",
  "y...k...y",
  "RRRRRRRRR",
  "RkkRRRkkR",
];
const RIG_COLORS = { y: PAL.yellow, k: "#3a3a44", R: PAL.red };

/* Gem shapes (8×8): a = main colour, b = accent, k = dark outline, w = glint. */
const SHAPES: Record<SpriteShape, Grid> = {
  worm: ["........", "........", ".aa.....", "a.ba..aa", "....ab.a", "......b.", "........", "........"],
  grub: ["...aabb.", "..aaabkb", ".aa..bb.", ".aa.....", ".aa...a.", "..aaaaa.", "...aaa..", "........"],
  root: ["...a....", "...a....", "..aba...", ".a.a.a..", "a..a..a.", "..a.b...", ".a...a..", "........"],
  shell: ["........", "...aa...", "..abba..", ".abaaba.", ".aabbaa.", ".abaaba.", "..aaaa..", "........"],
  spiral: ["..aaaa..", ".abbbba.", "abaaaaba", "aba.baba", "abab.aba", "abaaaba.", ".abbba..", "..aaa..."],
  leaf: [".......a", "......ab", "...aaaba", "..aabaa.", ".aabaa..", ".abaa...", "b.aa....", "b......."],
  bone: ["........", "aa....aa", "abaaaaba", ".abbbba.", ".abbbba.", "abaaaaba", "aa....aa", "........"],
  trilobite: ["...aa...", "..abba..", ".abbbba.", "abaabaab", ".abaaba.", "abaabaab", ".abaaba.", "..abba.."],
  tooth: ["aaaaaaaa", "abbbbbba", ".abbbba.", ".abbbba.", "..abba..", "..abba..", "...aa...", "........"],
  stem: ["...aa...", "..abba..", "...aa...", "..abba..", "...aa...", "..abba..", "...aa...", "..abba.."],
  wood: ["........", ".aaaaaa.", "abbbbbba", "abaaaaba", "ababbaba", "abaaaaba", "abbbbbba", ".aaaaaa."],
  crystal: ["...w....", "..waa...", "..aab...", ".waaab..", ".aaabb..", "waaabbb.", ".aaabb..", "..kkk..."],
  flake: ["........", ".aaaaaa.", ".wbbbba.", ".abbbba.", ".abbbbw.", ".aaaaaa.", "........", "........"],
  cube: ["........", "..wwww..", ".waaaab.", ".aaaaab.", ".aaaaab.", ".aaaaab.", "..bbbb..", "........"],
  nugget: ["........", "...aa...", "..awaa..", ".aaaaab.", ".aabaab.", "..abbb..", "...bb...", "........"],
  lump: ["........", "..aaa...", ".aawaa..", "aaaaaab.", "aaawaab.", ".aaaab..", "..bbb...", "........"],
  drop: ["...a....", "...a....", "..aaa...", ".aawaa..", ".aaaaa..", ".aaaab..", "..bbb...", "........"],
  bubble: ["..bbb...", ".b...b..", "b.w...b.", "b.....b.", ".b...bbb", "..bbbb.b", "....b..b", ".....bb."],
  blob: ["........", "..aaaa..", ".awwaab.", ".aaaaab.", ".aaaaab.", "..abbb..", "........", "........"],
};

export interface SpriteSheet {
  hero: HTMLCanvasElement[][]; // [facing right, facing left][frame]
  bug: HTMLCanvasElement[][];
  mag: HTMLCanvasElement[][];
  eyes: HTMLCanvasElement;
  boulder: HTMLCanvasElement;
  rig: HTMLCanvasElement;
}

let sheet: SpriteSheet | null = null;

export function getSprites(): SpriteSheet {
  if (sheet) return sheet;
  const pair = (a: Grid, b: Grid, col: Record<string, string>) => [
    [build(a, col), build(b, col)],
    [build(a, col, true), build(b, col, true)],
  ];
  sheet = {
    hero: pair(HERO_A, HERO_B, HERO_COLORS),
    bug: pair(BUG_A, BUG_B, BUG_COLORS),
    mag: pair(MAG_A, MAG_B, MAG_COLORS),
    eyes: build(EYES, { W: "#ffffff", k: PAL.red }),
    boulder: build(BOULDER, BOULDER_COLORS),
    rig: build(RIG, RIG_COLORS),
  };
  return sheet;
}

const gemCache = new Map<string, HTMLCanvasElement>();

export function gemSprite(shape: SpriteShape, main: string, accent: string): HTMLCanvasElement {
  const k = `${shape}|${main}|${accent}`;
  let c = gemCache.get(k);
  if (!c) {
    c = build(SHAPES[shape], { a: main, b: accent, k: "#1a1208", w: "#ffffff" });
    gemCache.set(k, c);
  }
  return c;
}
