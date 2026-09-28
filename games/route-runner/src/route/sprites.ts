// Pixel-art sprites defined as character grids, pre-rendered to offscreen canvases.
// SpiderBen10's Arcade palette: reds, blues and a yellow accent, on a sunny suburban street.

export const PALETTE = {
  navy: "#0a0f2e",
  red: "#e3262f",
  blue: "#2456e8",
  lightBlue: "#6ea0ff",
  yellow: "#ffd23f",
  cyan: "#7ff3ff",
  green: "#5fff8a",
  white: "#f2f4ff",
  grass: "#2f8f3a",
  grassDark: "#267a31",
  grassLight: "#3aa347",
  hedge: "#1d5e27",
  sidewalk: "#b9bccb",
  sidewalkLine: "#9ea2b5",
  curb: "#e6e8f0",
  road: "#3a3f55",
  roadDark: "#33384d",
  roadLine: "#ffd23f",
  path: "#d9cfae",
  shadow: "rgba(5,6,15,0.35)",
};

type SpriteDef = { rows: string[]; colors: Record<string, string> };

/*
 * The arcade's hero (red helmet, cyan visor stripe, blue suit, yellow diamond) riding a bike
 * up the street, seen from above and behind. Two pedal frames.
 */
const HERO_COLORS: Record<string, string> = {
  K: "#05060f", s: "#c9cedf", h: "#e3262f", R: "#e3262f", r: "#a3141c", V: "#7ff3ff", B: "#2456e8", b: "#16379e", Y: "#ffd23f", P: "#ffd23f", w: "#f2f4ff",
};
const HERO_A = [
  "......KK......",
  "......KK......",
  "......KK......",
  "......ss......",
  "..hhssssssshh.",
  "...B..ss..B...",
  "...B.RRRR.B...",
  "...BRVVVVRB...",
  "....RRRRRR....",
  "...BRRrrRRB...",
  "..BBBBYYBBBB..",
  "..BB.BYYB.BB..",
  "..B..BBBB..B..",
  ".....BwwB.....",
  "....PBwwB.....",
  "....BBssBB....",
  "....B.ss.P....",
  "......KK......",
  "......KK......",
  "......KK......",
  "......KK......",
];
const HERO_B = [
  ...HERO_A.slice(0, 14),
  ".....BwwBP....",
  "....BBssBB....",
  "...P..ss.B....",
  ...HERO_A.slice(17),
];
export const HERO_W = 14;
export const HERO_H = 21;

/** Crashed: bike on its side, hero sprawled. */
const HERO_CRASH = [
  "..............",
  "....Y.....Y...",
  "..............",
  ".KK...RRR.....",
  "KssK.RVVVR....",
  "K..K.RRRRR..Y.",
  ".KK...BBB.....",
  "..ss.BBYBB....",
  "...ssB...B....",
  ".KK.sBB.BB.KK.",
  "KssKssss.ssKssK",
  "K..K......K..K",
  ".KK........KK.",
];

/* A small original "packet" (newspaper roll with a red band). */
const PACKET = [
  ".wwww.",
  "wwwwww",
  "RRRRRR",
  "wwwwww",
  ".wwww.",
];
const BUNDLE = [
  "..wwwwwwww..",
  ".wwwwwwwwww.",
  "RRRRRRRRRRRR",
  "wwwwwwwwwwww",
  "wkwkwkwkwkww",
  "wwwwwwwwwwww",
  "RRRRRRRRRRRR",
  ".wwwwwwwwww.",
];
const PACKET_COLORS = { w: "#f2f4ff", R: "#e3262f", k: "#9ea2b5" };

const CONE = [
  "...oo...",
  "...oo...",
  "..owwo..",
  "..oooo..",
  ".owwwwo.",
  ".oooooo.",
  "kkkkkkkk",
];
const CONE_COLORS = { o: "#ff7a1a", w: "#f2f4ff", k: "#2a2a2a" };

const TIRE_A = [
  "..kkkk..",
  ".kkggkk.",
  "kkg..gkk",
  "kg....gk",
  "kg....gk",
  "kkg..gkk",
  ".kkggkk.",
  "..kkkk..",
];
const TIRE_B = [
  "..kkkk..",
  ".kgkkgk.",
  "kk....kk",
  "kg....gk",
  "kg....gk",
  "kk....kk",
  ".kgkkgk.",
  "..kkkk..",
];
const TIRE_COLORS = { k: "#15151c", g: "#5a5a66" };

const SPRINKLER = [
  ".cc.",
  "cGGc",
  ".GG.",
  "GGGG",
];
const SPRINKLER_COLORS = { c: "#7ff3ff", G: "#8a8f9e" };

/* An original scruffy mutt, seen from above, running. */
const DOG_A = [
  "..e.e.....",
  ".bbbbb....",
  ".bkbkb....",
  "..bbbbbbbt",
  "..bbbbbbb.",
  ".l.l..l.l.",
];
const DOG_B = [
  "..e.e.....",
  ".bbbbb....",
  ".bkbkb....",
  "..bbbbbbb.",
  "..bbbbbbbt",
  "..l.ll.l..",
];
const DOG_COLORS = { b: "#b5763a", e: "#6b3f17", k: "#05060f", l: "#6b3f17", t: "#6b3f17" };

const MAILBOX = [
  "..rrrrr.",
  ".rRRRRRr",
  ".rRRRRRr",
  ".rrrrrrr",
  "....g...",
  "....g...",
  "....g...",
];
const MAILBOX_COLORS = { r: "#a3141c", R: "#e3262f", g: "#5a5a66" };

const TREE = [
  "....gggg....",
  "..gggGGggg..",
  ".ggGGggGGgg.",
  "gggGgggggGgg",
  "ggGGggggGGgg",
  "gggggGGggggg",
  ".ggGggggGgg.",
  "..ggggGggg..",
  "....gggg....",
];
const TREE_COLORS = { g: "#1d6b2a", G: "#2f9a3c" };

const FLOWERS = [
  "y.r.",
  ".G..",
  "r..y",
];
const FLOWER_COLORS = { y: "#ffd23f", r: "#e3262f", G: "#1d5e27" };

const DEFS: Record<string, SpriteDef> = {
  heroA: { rows: HERO_A, colors: HERO_COLORS },
  heroB: { rows: HERO_B, colors: HERO_COLORS },
  heroCrash: { rows: HERO_CRASH, colors: HERO_COLORS },
  packet: { rows: PACKET, colors: PACKET_COLORS },
  bundle: { rows: BUNDLE, colors: PACKET_COLORS },
  cone: { rows: CONE, colors: CONE_COLORS },
  tireA: { rows: TIRE_A, colors: TIRE_COLORS },
  tireB: { rows: TIRE_B, colors: TIRE_COLORS },
  sprinkler: { rows: SPRINKLER, colors: SPRINKLER_COLORS },
  dogA: { rows: DOG_A, colors: DOG_COLORS },
  dogB: { rows: DOG_B, colors: DOG_COLORS },
  mailbox: { rows: MAILBOX, colors: MAILBOX_COLORS },
  tree: { rows: TREE, colors: TREE_COLORS },
  flowers: { rows: FLOWERS, colors: FLOWER_COLORS },
};

export type SpriteName = keyof typeof DEFS;
export type SpriteSheet = Record<SpriteName, HTMLCanvasElement>;

function makeSprite(def: SpriteDef, flip = false): HTMLCanvasElement {
  const w = Math.max(...def.rows.map((r) => r.length));
  const c = document.createElement("canvas");
  c.width = w;
  c.height = def.rows.length;
  const g = c.getContext("2d")!;
  def.rows.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      const col = def.colors[row[x]];
      if (!col) continue;
      g.fillStyle = col;
      g.fillRect(flip ? w - 1 - x : x, y, 1, 1);
    }
  });
  return c;
}

let sheet: (SpriteSheet & { dogAFlip: HTMLCanvasElement; dogBFlip: HTMLCanvasElement }) | null = null;

export function getSprites() {
  if (!sheet) {
    const s = {} as SpriteSheet;
    for (const k of Object.keys(DEFS) as SpriteName[]) s[k] = makeSprite(DEFS[k]);
    sheet = { ...s, dogAFlip: makeSprite(DEFS.dogA, true), dogBFlip: makeSprite(DEFS.dogB, true) };
  }
  return sheet;
}

/** House colour schemes: roof light/dark, wall trim and door. */
export const HOUSE_STYLES = [
  { roof: "#c9343c", roofDark: "#a3141c", trim: "#f2f4ff", door: "#2456e8" },
  { roof: "#3a66e8", roofDark: "#2456e8", trim: "#f2f4ff", door: "#e3262f" },
  { roof: "#8a5a3a", roofDark: "#6b3f24", trim: "#ffd23f", door: "#2456e8" },
  { roof: "#5a6078", roofDark: "#434860", trim: "#f2f4ff", door: "#ffd23f" },
  { roof: "#2f9a8a", roofDark: "#1f7a6b", trim: "#f2f4ff", door: "#e3262f" },
  { roof: "#9a4fb0", roofDark: "#7a3690", trim: "#ffd23f", door: "#f2f4ff" },
];
