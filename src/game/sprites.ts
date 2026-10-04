/*
 * Pixel sprites as character grids: the arcade HERO (with an archivist's satchel), Wick the
 * lantern-moth, Knot the yarn-ball gremlin, and witnesses built from a body template plus
 * respectful headwear and clothing per "look". Skin tones are natural and vary by region.
 */
import { place, type PlaceId } from "@/chase/places";

/** The arcade's hero (site/app.js), plus a satchel strap (s) and bag (b). */
export const HERO = [
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
  "....BBYsYBBB....",
  "....BBBYsB.BB...",
  "....BBBBBsbbhh..",
  ".....RRRRRbbb...",
  ".....BBBBB......",
  ".....BB.BB......",
  "....BB...BB.....",
  "...hh.....hh....",
];
export const HERO_COLORS: Record<string, string> = {
  h: "#e3262f", R: "#e3262f", K: "#05060f", V: "#7ff3ff", B: "#2456e8", Y: "#ffd23f", s: "#8a5a2a", b: "#b07a3a",
};

/** Wick, the lantern-moth guide: two wing frames. */
export const WICK = [
  [
    "..w......w..",
    "...w....w...",
    ".MMM.LL.MMM.",
    "MMmMMLLMMmMM",
    "MMMMLYYLMMMM",
    ".MMMLYYLMMM.",
    "..MM.LL.MM..",
    ".....LL.....",
  ],
  [
    "..w......w..",
    "...w....w...",
    "....MLLM....",
    "...MMLLMM...",
    "..MMLYYLMM..",
    "...MLYYLM...",
    "....MLLM....",
    ".....LL.....",
  ],
];
export const WICK_COLORS: Record<string, string> = { w: "#d8c8ff", M: "#a98cff", m: "#ffffff", L: "#c8a040", Y: "#fff6a0" };

/** Knot, a silly yarn-ball gremlin (never evil, never hurt). */
export const KNOT = [
  "....rRRr....",
  "..RRrRRrRR..",
  ".RrRRRRRRrR.",
  ".RRWWRRWWRR.",
  "RrRWKRRWKRrR",
  "RRRRRRRRRRRR",
  "RrRRKRRKRRrR",
  ".RRRRKKRRRR.",
  ".RrRRRRRRrR.",
  "..RRrRRrRR..",
  "....rRRr....",
];
export const KNOT_COLORS: Record<string, string> = { R: "#ff6fb0", r: "#d0407e", W: "#ffffff", K: "#2a0a1e" };

export type Headwear = "wrap" | "cap" | "hood" | "hat" | "hair" | "scarf" | "fur" | "tall" | "straw";

interface Look {
  wear: Headwear;
  hat: string;
  robe: string;
  trim: string;
  prop?: "scroll" | "staff" | "bag" | "book";
}

export const LOOKS: Record<string, Look> = {
  merchant: { wear: "wrap", hat: "#e8e0c8", robe: "#2f6f8f", trim: "#ffd23f", prop: "bag" },
  scholar: { wear: "cap", hat: "#3a2a6a", robe: "#5a3e8a", trim: "#e8e0c8", prop: "book" },
  scribe: { wear: "cap", hat: "#20304a", robe: "#7a6a4a", trim: "#d8c8a0", prop: "scroll" },
  sailor: { wear: "scarf", hat: "#c83a3a", robe: "#2a4a7a", trim: "#e8e8e8" },
  monk: { wear: "hood", hat: "#6a4a2a", robe: "#6a4a2a", trim: "#c8a060" },
  official: { wear: "tall", hat: "#1a1a2a", robe: "#7a1f2a", trim: "#ffd23f", prop: "scroll" },
  pilgrim: { wear: "wrap", hat: "#ffffff", robe: "#d8d0c0", trim: "#8a7a5a", prop: "staff" },
  farmer: { wear: "straw", hat: "#d8b860", robe: "#5a7a3a", trim: "#c8a060" },
  worker: { wear: "cap", hat: "#4a4a4a", robe: "#5a5a6a", trim: "#9a8a6a" },
  elder: { wear: "hair", hat: "#d8d8d8", robe: "#8a5a2a", trim: "#e8c040", prop: "staff" },
  rider: { wear: "fur", hat: "#8a6a3a", robe: "#3a6a5a", trim: "#d8a040" },
  weaver: { wear: "scarf", hat: "#e86a2a", robe: "#c84a6a", trim: "#ffd23f" },
  storyteller: { wear: "wrap", hat: "#e8a03a", robe: "#3a5aa0", trim: "#ffd23f" },
  teacher: { wear: "hair", hat: "#2a1a10", robe: "#2a5a4a", trim: "#e8e0c8", prop: "book" },
  citizen: { wear: "hat", hat: "#2a2a3a", robe: "#4a3a6a", trim: "#d8d8d8" },
  captain: { wear: "hat", hat: "#1a2a4a", robe: "#1f3f6f", trim: "#ffd23f" },
  envoy: { wear: "tall", hat: "#2a3a5a", robe: "#3a7a7a", trim: "#e8e0c8", prop: "scroll" },
};

const HEADS: Record<Headwear, string[]> = {
  wrap: ["...HHHHHH...", "..HHhHHhHH..", "..HSSSSSSH.."],
  cap: ["............", "...HHHHHH...", "..HHSSSSHH.."],
  hood: ["...HHHHHH...", "..HHHHHHHH..", "..HHSSSSHH.."],
  hat: ["...HHHHHH...", "..HHHHHHHH..", ".HHHSSSSHHH."],
  hair: ["....HHHH....", "...HHHHHH...", "...HSSSSH..."],
  scarf: ["............", "...HHHHHH...", "..HHSSSSHH.."],
  fur: ["...HHHHHH...", "..HhHhHhHH..", "..HHSSSSHH.."],
  tall: ["....HHHH....", "....HHHH....", "..HHSSSSHH.."],
  straw: ["....HHHH....", "HHHHHHHHHHHH", "...SSSSSS..."],
};

const BODY = [
  "...SKSSKS...",
  "...SSSSSS...",
  "....SmmS....",
  ".....SS.....",
  "...RRRRRR...",
  "..RRRTTRRR..",
  "..RRRTTRRR..",
  ".SRRRTTRRRS.",
  ".S.RRTTRR.S.",
  "...RRTTRR...",
  "...RRRRRR...",
  "...RRRRRR...",
  "..RRRRRRRR..",
  "..RRRRRRRR..",
  "..RRRRRRRR..",
  "...KK..KK...",
  "...KK..KK...",
];

/** Natural skin tones; picked by where the witness stands. */
const SKIN = {
  eastAsia: ["#f1c9a0", "#e8b98a", "#d9a575"],
  southAsia: ["#b47a4a", "#a0683c", "#8d5524"],
  africa: ["#7a4a2a", "#5c3a21", "#8d5524", "#6a3e22"],
  sahara: ["#a0683c", "#8d5524", "#c08860"],
  mideast: ["#c89a6a", "#b4855a", "#d8aa7a"],
  europe: ["#f3d2b8", "#e8bea0", "#f8dcc8"],
  americas: ["#b07a50", "#9a6a40", "#c08a5a"],
  pacific: ["#c08a5a", "#a87850", "#d8a878"],
};

export function regionOf(id: PlaceId): keyof typeof SKIN {
  const [lon, lat] = place(id).at;
  if (lon < -30) return "americas";
  if (lon > 95 && lat > 20) return "eastAsia";
  if (lon > 95) return "pacific";
  if (lon > 60 && lat < 32) return "southAsia";
  if (lat < 12 && lon > -20 && lon < 52) return "africa";
  if (lat < 30 && lon < 30) return "sahara";
  if (lat < 42 && lon > 25) return "mideast";
  if (lon > 60) return "mideast";
  return "europe";
}

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

export interface WitnessSprite {
  rows: string[];
  colors: Record<string, string>;
}

/** A witness sprite (12x20) for a look, at a place; `talk` opens the mouth. */
export function witnessSprite(look: string, who: string, at: PlaceId, talk = false): WitnessSprite {
  const L = LOOKS[look] ?? LOOKS.citizen;
  const tones = SKIN[regionOf(at)];
  const h = hash(who + at);
  const skin = tones[h % tones.length];
  const rows = [...HEADS[L.wear], ...BODY].map((r) => r);
  if (talk) rows[5] = "....SKKS....";
  if (L.wear === "hair") {
    // short hair at the sides
    rows[3] = "..HSKSSKSH..";
  }
  if (L.prop === "staff") rows.forEach((r, i) => i > 6 && (rows[i] = r.slice(0, 11) + "P"));
  if (L.prop === "scroll") rows[11] = ".SppRTTRR.S.";
  if (L.prop === "book") rows[11] = ".S.RRTTRpppp";
  if (L.prop === "bag") {
    rows[13] = "...RRRRRRbb.";
    rows[14] = "..RRRRRRRbb.";
  }
  return {
    rows,
    colors: {
      H: L.hat,
      h: shade(L.hat),
      S: skin,
      K: "#1a1010",
      m: "#7a3a3a",
      R: L.robe,
      T: L.trim,
      P: "#8a6a3a",
      p: "#f5e6c8",
      b: "#a07040",
    },
  };
}

function shade(hex: string): string {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.max(0, ((n >> 16) & 255) - 40);
  const g = Math.max(0, ((n >> 8) & 255) - 40);
  const b = Math.max(0, (n & 255) - 40);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}
