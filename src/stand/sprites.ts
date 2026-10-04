/*
 * Pixel sprites as character grids ("." = transparent). All original art: the arcade's hero
 * (red helmet, cyan visor stripe, blue suit, yellow diamond) and a park full of customers.
 * Customers face left, toward the cart.
 */
import type { CustKind, ItemId } from "./config";

export type Grid = string[];
export type Palette = Record<string, string>;
export interface Sprite {
  rows: Grid;
  pal: Palette;
}

export const PAL = {
  navy: "#0a0f2e",
  red: "#e3262f",
  blue: "#2456e8",
  sky: "#6ea0ff",
  yellow: "#ffd23f",
  white: "#f2f4ff",
  ink: "#05060f",
  green: "#5fff8a",
  grass: "#2f8f3a",
  grassDark: "#226b2b",
  path: "#c9c6d6",
  pathDark: "#9d99b0",
};

/** The arcade hero (from the arcade menu), with a serving pose. */
export const HERO: Sprite = {
  rows: [
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
  ],
  pal: { h: "#e3262f", R: "#e3262f", K: "#05060f", V: "#7ff3ff", B: "#2456e8", Y: "#ffd23f" },
};
export const HERO_SERVE: Sprite = {
  rows: HERO.rows.map((r, i) => (i === 11 ? "....BBYYYBBBBBhh" : i === 12 ? "....BBBYBB......" : i === 13 ? "....BBBBBB......" : r)),
  pal: HERO.pal,
};

const SKIN = ["#f1c27d", "#c68642", "#8d5524", "#e0ac69"];

/** Shared body shape; each customer recolors and adds details. */
function person(rows: Grid, pal: Palette): Sprite {
  return { rows, pal: { K: PAL.ink, E: PAL.ink, W: PAL.white, ...pal } };
}

export function customerSprite(kind: CustKind, variant: number): Sprite {
  const S = SKIN[variant % SKIN.length];
  switch (kind) {
    case "kid":
      return person(
        [
          "............",
          "............",
          "....CCCC....",
          "...CCCCCC...",
          "..CCCCCCC...",
          "....SSSSH...",
          "...SESSSH...",
          "....SSSS....",
          ".....SS.....",
          "....TTTT....",
          "...TWWWWT...",
          "...SWTTWS...",
          "....TWWT....",
          "....PPPP....",
          "....P..P....",
          "....P..P....",
          "...FF.FF....",
        ],
        { C: "#e3262f", S, H: "#5a3a1a", T: "#ffd23f", P: "#2456e8", F: "#f2f4ff" },
      );
    case "jogger":
      return person(
        [
          "............",
          "....HHHH....",
          "...HHHHHH...",
          "...RRRRRR...",
          "...SSSSSH...",
          "...ESSSSH...",
          "...SSSSS....",
          "....SSS.....",
          "....TTTT....",
          "...TTTTTT...",
          "..S.TTTT.S..",
          "....TTTT....",
          "....PPPP....",
          "....S..S....",
          "...S....S...",
          "..S......S..",
          ".FF......FF.",
        ],
        { H: "#2a1a0a", R: "#5fff8a", S, T: "#e3262f", P: "#0a0f2e", F: "#f2f4ff" },
      );
    case "dogwalker":
      return person(
        [
          "............",
          "....HHHH....",
          "...HHHHHH...",
          "...HSSSSH...",
          "...ESSSSHH..",
          "...SSSSSHH..",
          "....SSSS.H..",
          ".....SS.....",
          "....TTTT....",
          "...TTTTTT...",
          "..LTTTTTTS..",
          ".L..TTTT....",
          "L...PPPP....",
          "L...PP.PP...",
          "L...PP.PP...",
          "L...PP.PP...",
          "L..FFF.FFF..",
        ],
        { H: "#a0522d", S, T: "#6ea0ff", P: "#3a3a5a", F: "#5a3a1a", L: "#ffd23f" },
      );
    case "mail":
      return person(
        [
          "............",
          "....BBBB....",
          "...BBBBBB...",
          "..BBBBBBB...",
          "...SSSSSH...",
          "...ESSSSH...",
          "...SSSSS....",
          ".....SS.....",
          "...TTTTTT...",
          "..TTTTGTTT..",
          "..STTGTTTS..",
          "...GTTTT....",
          "..GGGPPP....",
          "..GGGP.PP...",
          "....PP.PP...",
          "....PP.PP...",
          "...KKK.KKK..",
        ],
        { B: "#2456e8", H: "#1a1a1a", S, T: "#6ea0ff", G: "#8b5a2b", P: "#2456e8" },
      );
    case "grandpa":
      return person(
        [
          "............",
          "............",
          "....HHHH....",
          "...HHHHHH...",
          "...HSSSSH...",
          "...GGSGGS...",
          "...SSSSSS...",
          "...SWWWS....",
          "....TTTT....",
          "...TTTTTT...",
          "..STTTTTTS..",
          "..C.TTTT....",
          "..C.PPPP....",
          "..C.PP.PP...",
          "..C.PP.PP...",
          "..C.PP.PP...",
          "..C.KK.KK...",
        ],
        { H: "#f2f4ff", S, G: "#3a3a3a", T: "#7a4a9a", P: "#6a6a7a", C: "#8b5a2b" },
      );
    case "robot":
      return {
        rows: [
          ".....Y......",
          ".....K......",
          "...GGGGGG...",
          "...GCGGGG...",
          "...GCGGCG...",
          "...GGGGGG...",
          "...GKKKKG...",
          "....GGGG....",
          "..BBBBBBBB..",
          "..BGGYYGGB..",
          ".GBGYRRYGBG.",
          ".G.BGGGGB.G.",
          "...BBBBBB...",
          "....GG.GG...",
          "....GG.GG...",
          "...DDD.DDD..",
          "...DDD.DDD..",
        ],
        pal: { Y: "#ffd23f", K: "#05060f", G: "#b8c0d8", C: "#7ff3ff", B: "#6a7290", R: "#e3262f", D: "#3a405a" },
      };
    case "artist":
      return person(
        [
          "............",
          "....BBB.....",
          "...BBBBBB...",
          "..BBBBBBB...",
          "...HSSSSH...",
          "...ESSSSH...",
          "...SSSSSH...",
          ".....SS.....",
          "...TTTTTT...",
          "..TTyTrTTT..",
          "..STTbTTTS..",
          "...TTTTTT...",
          "...TTTTTT...",
          "....PP.PP...",
          "....PP.PP...",
          "....PP.PP...",
          "...KKK.KKK..",
        ],
        { B: "#e3262f", H: "#1a1a1a", S, T: "#f2f4ff", y: "#ffd23f", r: "#e3262f", b: "#2456e8", P: "#3a3a5a" },
      );
    case "skater":
      return person(
        [
          "............",
          "....GGGG....",
          "...GGGGGG...",
          "...GGGGGG...",
          "...SSSSSH...",
          "...ESSSSH...",
          "...SSSSS....",
          ".....SS.....",
          "....TTTT....",
          "...TTTTTT...",
          "..STTTTTTS..",
          "....TTTT....",
          "....PPPP....",
          "....PP.PP...",
          "....PP.PP...",
          ".DDDDDDDDDD.",
          "..W......W..",
        ],
        { G: "#5fff8a", S, H: "#2a1a0a", T: "#2456e8", P: "#0a0f2e", D: "#e3262f" },
      );
  }
}

/** A small dog that walks beside the dog walker. */
export const DOG: Sprite = {
  rows: [
    "B.........",
    "BBB.......",
    "KBBBBBBBB.",
    ".BBBBBBBBB",
    ".B.B..B.B.",
    ".B.B..B.B.",
  ],
  pal: { B: "#c68642", K: "#05060f" },
};

/** Menu items as they slide down the counter (6×8). */
export const ITEM_SPRITES: Record<ItemId, Sprite> = {
  juice: {
    rows: ["....R.", "...R..", "WWWRWW", "WOOOOW", "WOOOOW", ".WOOW.", ".WOOW.", ".WWWW."],
    pal: { R: "#e3262f", W: "#f2f4ff", O: "#ff9a1f" },
  },
  fruit: {
    rows: ["..G...", ".RGR..", "RRYRBB", "WRRBBW", "WWWWWW", ".WWWW.", ".WWWW.", "......"],
    pal: { G: "#5fff8a", R: "#e3262f", Y: "#ffd23f", B: "#2456e8", W: "#f2f4ff" },
  },
  snack: {
    rows: ["......", "......", "YYYYYY", "YBBBBY", "YBWWBY", "YBBBBY", "YYYYYY", "......"],
    pal: { Y: "#ffd23f", B: "#8b5a2b", W: "#f2f4ff" },
  },
};

export const SUN: Sprite = {
  rows: ["..Y..Y..", "Y.YYYY.Y", ".YYYYYY.", "YYYYYYYY", "YYYYYYYY", ".YYYYYY.", "Y.YYYY.Y", "..Y..Y.."],
  pal: { Y: "#ffd23f" },
};

const cache = new Map<string, HTMLCanvasElement>();

/** Renders a sprite to an offscreen canvas once (optionally mirrored). */
export function spriteCanvas(key: string, s: Sprite, flip = false): HTMLCanvasElement {
  const k = `${key}${flip ? "|f" : ""}`;
  const hit = cache.get(k);
  if (hit) return hit;
  const w = Math.max(...s.rows.map((r) => r.length));
  const c = document.createElement("canvas");
  c.width = w;
  c.height = s.rows.length;
  const x = c.getContext("2d")!;
  s.rows.forEach((row, y) => {
    for (let i = 0; i < row.length; i++) {
      const col = s.pal[row[i]];
      if (col) {
        x.fillStyle = col;
        x.fillRect(flip ? w - 1 - i : i, y, 1, 1);
      }
    }
  });
  cache.set(k, c);
  return c;
}
