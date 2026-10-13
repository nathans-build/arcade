/*
 * Silly Story Studio's original pixel sprites, drawn in code on a 16×16 grid.
 * Each sprite is a list of shape ops; "M", "D" and "L" are its main color (and a darker/lighter
 * shade), so color words can repaint it. Everything gets a dark 1-pixel outline when rasterized.
 */

export type Op =
  | ["r", string, number, number, number, number] // rect x y w h
  | ["e", string, number, number, number, number] // ellipse cx cy rx ry
  | ["p", string, ...number[]] // pixels x,y pairs
  | ["l", string, number, number, number, number] // line
  | ["t", string, number, number, number, number, number, number]; // triangle

export type Kind = "animal" | "food" | "vehicle" | "thing" | "person" | "place" | "fantasy";

export interface SpriteDef {
  id: string;
  /** Words that draw this sprite (singular). The first is the card word. */
  words: string[];
  kind: Kind;
  /** Main color (hex) for M/D/L. */
  main: string;
  ops: Op[];
  /** Lives in the air (drawn higher in a scene). */
  air?: boolean;
  /** Not offered as a picture card (scene-only helper). */
  hidden?: boolean;
}

export const PAL: Record<string, string> = {
  K: "#1b1230", W: "#f4f4ff", w: "#c8c8d8", g: "#8a8aa0", d: "#4a4a5e", R: "#e3262f", r: "#9c1820", O: "#ff8a1f",
  Y: "#ffd23f", y: "#c99a10", G: "#3fbf4f", h: "#1f7a2f", l: "#9be35a", B: "#2456e8", b: "#6ea0ff", c: "#5fe0ff",
  P: "#8b3fd9", p: "#c49bff", k: "#ff8fc8", m: "#ff3fa8", N: "#8a5a2b", n: "#5a3a1a", T: "#d8a86a", t: "#f0d49a",
  S: "#f2c08f", s: "#c98e5e", X: "#000000",
};

/* ---------------------------------------------------------------- helpers for families of sprites */

interface QuadOpts {
  head?: [number, number, number, number];
  ears?: Op[];
  tail?: Op[];
  extra?: Op[];
  legs?: string;
  body?: [number, number, number, number];
  snout?: Op[];
}

/** A four-legged animal facing right. */
function quad(o: QuadOpts = {}): Op[] {
  const [bx, by, brx, bry] = o.body ?? [7, 10, 5, 3];
  const [hx, hy, hrx, hry] = o.head ?? [12, 7, 3, 3];
  const lc = o.legs ?? "D";
  return [
    ...(o.tail ?? []),
    ["r", lc, bx - 4, by + 1, 2, 4], ["r", lc, bx - 1, by + 1, 2, 4], ["r", lc, bx + 2, by + 1, 2, 4], ["r", lc, bx + 4, by + 1, 1, 4],
    ["e", "M", bx, by, brx, bry],
    ...(o.ears ?? []),
    ["e", "M", hx, hy, hrx, hry],
    ...(o.snout ?? []),
    ["p", "K", hx + 1, hy - 1],
    ...(o.extra ?? []),
  ];
}

interface PersonOpts {
  skin?: string;
  hair?: string;
  hat?: Op[];
  extra?: Op[];
  legs?: string;
  long?: boolean; // a robe/dress instead of legs
}

/** A person facing out. Shirt is the main color. */
function person(o: PersonOpts = {}): Op[] {
  const skin = o.skin ?? "S";
  return [
    ...(o.long ? [["t", "M", 8, 7, 3, 15, 13, 15] as Op, ["r", "M", 5, 8, 6, 7] as Op] : [["r", o.legs ?? "d", 6, 12, 2, 4] as Op, ["r", o.legs ?? "d", 8, 12, 2, 4] as Op, ["r", "M", 5, 8, 6, 5] as Op]),
    ["r", "M", 3, 8, 2, 4], ["r", "M", 11, 8, 2, 4], ["p", skin, 3, 12, 12, 12],
    ["e", skin, 8, 4.5, 3, 3.2],
    ["r", o.hair ?? "N", 5, 1, 6, 2], ["p", o.hair ?? "N", 5, 3, 10, 3],
    ["p", "K", 7, 4, 9, 4], ["p", "s", 7, 6, 8, 6, 9, 6],
    ...(o.hat ?? []),
    ...(o.extra ?? []),
  ];
}

const S = (id: string, words: string[], kind: Kind, main: string, ops: Op[], more: Partial<SpriteDef> = {}): SpriteDef => ({ id, words, kind, main, ops, ...more });

/* ---------------------------------------------------------------- the library */

export const SPRITES: SpriteDef[] = [
  // ---- animals
  S("cat", ["cat", "kitten", "kitty"], "animal", "#ff9f43", quad({
    ears: [["t", "M", 10, 5, 11, 2, 12, 5], ["t", "M", 12, 5, 14, 2, 14, 5]],
    tail: [["l", "M", 2, 9, 1, 4], ["l", "M", 3, 9, 2, 4]],
    snout: [["p", "k", 14, 8], ["p", "K", 15, 8]],
  })),
  S("dog", ["dog", "puppy", "pup", "doggy", "hound"], "animal", "#c08040", quad({
    ears: [["r", "D", 10, 5, 2, 5]],
    tail: [["l", "M", 2, 9, 0, 6]],
    snout: [["e", "L", 14, 8, 2, 1.5], ["p", "K", 15, 7]],
  })),
  S("fox", ["fox"], "animal", "#ff7a1f", quad({
    ears: [["t", "M", 10, 5, 11, 1, 12, 5], ["t", "M", 12, 5, 14, 1, 14, 5]],
    tail: [["e", "M", 2, 9, 2.5, 2], ["p", "W", 0, 9, 1, 9, 0, 10]],
    snout: [["t", "W", 12, 9, 15, 8, 12, 7], ["p", "K", 15, 8]],
  })),
  S("lion", ["lion", "lioness"], "animal", "#ffc040", quad({
    ears: [["e", "n", 12, 7, 4.5, 4.5]],
    tail: [["l", "M", 2, 10, 0, 8], ["p", "n", 0, 7, 0, 8]],
    snout: [["e", "L", 14, 8, 1.5, 1.5], ["p", "K", 15, 7]],
  })),
  S("tiger", ["tiger"], "animal", "#ff8a1f", quad({
    ears: [["e", "M", 11, 4, 1, 1], ["e", "M", 14, 4, 1, 1]],
    tail: [["l", "M", 2, 9, 0, 7]],
    extra: [["p", "K", 5, 8, 5, 9, 8, 8, 8, 9, 10, 9, 13, 5, 11, 7, 3, 10], ["p", "W", 13, 8, 14, 8, 14, 9]],
  })),
  S("bear", ["bear", "grizzly", "teddy bear", "teddy"], "animal", "#8a5a2b", quad({
    body: [7, 10, 6, 3.5], head: [12, 6, 3, 3],
    ears: [["e", "M", 10, 3, 1.2, 1.2], ["e", "M", 14, 3, 1.2, 1.2]],
    snout: [["e", "t", 14, 7, 1.5, 1.2], ["p", "K", 15, 6]],
  })),
  S("panda", ["panda"], "animal", "#f4f4ff", quad({
    body: [7, 10, 6, 3.5], head: [12, 6, 3, 3], legs: "K",
    ears: [["e", "K", 10, 3, 1.2, 1.2], ["e", "K", 14, 3, 1.2, 1.2]],
    extra: [["p", "K", 12, 5, 13, 5, 12, 6, 14, 7], ["r", "K", 4, 9, 6, 2]],
  })),
  S("pig", ["pig", "piglet", "hog"], "animal", "#ffa0c0", quad({
    ears: [["t", "D", 10, 5, 11, 3, 12, 5]],
    tail: [["p", "D", 2, 8, 1, 7, 2, 6]],
    snout: [["r", "D", 14, 7, 2, 2], ["p", "K", 15, 7]],
  })),
  S("cow", ["cow", "bull", "calf", "cattle"], "animal", "#f4f4ff", quad({
    legs: "w",
    ears: [["p", "w", 10, 4, 11, 4], ["p", "t", 11, 3, 14, 3]],
    tail: [["l", "M", 2, 9, 1, 12]],
    snout: [["r", "k", 13, 8, 3, 2]],
    extra: [["e", "K", 5, 9, 1.5, 1], ["e", "K", 9, 11, 1.5, 1], ["p", "K", 11, 6]],
  })),
  S("horse", ["horse", "pony", "stallion", "mare"], "animal", "#b07040", quad({
    head: [13, 5, 2.5, 2.5],
    ears: [["r", "M", 11, 5, 2, 5], ["r", "n", 10, 3, 2, 6]],
    tail: [["l", "n", 2, 9, 0, 13], ["l", "n", 1, 9, 0, 12]],
    snout: [["e", "M", 14.5, 6.5, 1.5, 1.5]],
  })),
  S("sheep", ["sheep", "lamb", "ram"], "animal", "#f4f4ff", [
    ["r", "K", 4, 11, 1, 4], ["r", "K", 7, 11, 1, 4], ["r", "K", 10, 11, 1, 4],
    ["e", "M", 5, 9, 3, 3], ["e", "M", 9, 8, 3, 3], ["e", "M", 8, 11, 4, 2], ["e", "M", 4, 11, 2, 2],
    ["e", "d", 13, 8, 2, 2.5], ["p", "W", 13, 7], ["p", "d", 11, 6],
  ]),
  S("unicorn", ["unicorn", "sparklehorn"], "fantasy", "#f4f4ff", quad({
    head: [13, 5, 2.5, 2.5], legs: "w",
    ears: [["r", "M", 11, 5, 2, 5], ["p", "m", 10, 3, 10, 4, 9, 5], ["p", "b", 10, 5, 9, 6, 10, 7], ["p", "Y", 9, 4, 11, 3]],
    tail: [["p", "m", 2, 9, 1, 10, 1, 11], ["p", "b", 2, 10, 2, 11, 0, 12], ["p", "Y", 0, 10, 1, 12]],
    snout: [["e", "M", 14.5, 6.5, 1.5, 1.5], ["p", "Y", 14, 0, 14, 1, 13, 2, 14, 2, 13, 3], ["p", "k", 6, 9]],
  })),
  S("giraffe", ["giraffe"], "animal", "#ffc040", [
    ["r", "D", 3, 11, 1, 5], ["r", "D", 5, 11, 1, 5], ["r", "D", 8, 11, 1, 5], ["r", "D", 10, 11, 1, 5],
    ["e", "M", 6.5, 10, 4.5, 2.5], ["r", "M", 9, 3, 2, 7], ["e", "M", 11.5, 2.5, 2.5, 1.5],
    ["p", "N", 9, 1, 10, 1], ["p", "K", 12, 2], ["p", "N", 4, 9, 7, 10, 9, 9, 10, 5, 9, 7, 5, 11],
  ]),
  S("elephant", ["elephant", "mammoth"], "animal", "#9aa0b8", [
    ["r", "D", 3, 11, 2, 5], ["r", "D", 6, 11, 2, 5], ["r", "D", 9, 11, 2, 5],
    ["e", "M", 7, 9, 5.5, 4], ["e", "M", 12, 7, 3, 3], ["e", "D", 10, 7, 2, 2.5],
    ["r", "M", 14, 8, 2, 6], ["p", "M", 15, 14], ["p", "K", 13, 6], ["p", "W", 13, 9, 14, 10],
  ]),
  S("dinosaur", ["dinosaur", "dino", "t-rex", "trex"], "animal", "#4fbf5f", [
    ["t", "M", 0, 12, 6, 9, 6, 13],
    ["r", "D", 6, 12, 2, 4], ["r", "D", 9, 12, 2, 4],
    ["e", "M", 8, 10, 4, 3.5], ["r", "M", 9, 4, 3, 6], ["e", "M", 12, 4, 3.5, 2.5],
    ["p", "K", 12, 3], ["p", "W", 13, 6, 15, 6], ["p", "D", 12, 9, 13, 10], ["p", "L", 6, 7, 5, 8, 4, 9],
  ]),
  S("dragon", ["dragon", "wyvern"], "fantasy", "#3fbf7f", [
    ["t", "D", 4, 3, 9, 8, 2, 9], ["t", "L", 5, 4, 8, 8, 3, 8],
    ["t", "M", 0, 13, 5, 10, 5, 13],
    ["r", "D", 5, 12, 2, 4], ["r", "D", 9, 12, 2, 4],
    ["e", "M", 8, 11, 4.5, 3], ["r", "M", 10, 5, 2, 6], ["e", "M", 13, 5, 3, 2],
    ["p", "Y", 11, 2, 12, 3], ["p", "K", 13, 4], ["p", "O", 15, 6, 15, 7], ["p", "L", 7, 12, 9, 12, 8, 13],
  ]),
  S("bunny", ["bunny", "rabbit", "hare"], "animal", "#f4f4ff", [
    ["e", "M", 7, 12, 4, 3], ["e", "M", 11, 9, 2.5, 2.5],
    ["r", "M", 9, 2, 1, 6], ["r", "M", 11, 2, 1, 6], ["p", "k", 9, 4, 11, 4, 9, 5, 11, 5],
    ["e", "W", 3, 11, 1.2, 1.2], ["p", "K", 12, 8], ["p", "k", 13, 10], ["r", "D", 9, 14, 3, 2],
  ]),
  S("mouse", ["mouse", "rat", "hamster", "gerbil"], "animal", "#b0b0c0", [
    ["l", "k", 0, 14, 4, 12],
    ["e", "M", 8, 12, 5, 3], ["e", "M", 12, 10, 2.5, 2.5], ["e", "k", 11, 7, 1.5, 1.5], ["e", "k", 13.5, 7.5, 1.2, 1.2],
    ["p", "K", 13, 10], ["p", "k", 15, 11], ["p", "D", 6, 15, 10, 15],
  ]),
  S("monkey", ["monkey", "ape", "chimp", "chimpanzee", "gorilla", "orangutan"], "animal", "#8a5a2b", [
    ["l", "M", 13, 13, 15, 10], ["p", "M", 14, 9],
    ["e", "M", 8, 11, 4, 4], ["e", "t", 8, 12, 2.5, 2.5], ["r", "M", 5, 14, 2, 2], ["r", "M", 9, 14, 2, 2],
    ["e", "M", 3.5, 4.5, 1.5, 1.5], ["e", "M", 12.5, 4.5, 1.5, 1.5], ["e", "M", 8, 4.5, 4, 3.5], ["e", "t", 8, 5.5, 3, 2.2],
    ["p", "K", 7, 4, 9, 4], ["p", "n", 7, 6, 8, 6, 9, 6],
  ]),
  S("penguin", ["penguin"], "animal", "#262640", [
    ["e", "M", 8, 9, 4.5, 6], ["e", "W", 8, 10.5, 3, 4.5], ["p", "K", 7, 5, 9, 5], ["p", "O", 8, 6],
    ["r", "O", 5, 15, 2, 1], ["r", "O", 9, 15, 2, 1], ["p", "M", 3, 10, 13, 10, 3, 11, 13, 11],
  ]),
  S("frog", ["frog", "toad"], "animal", "#4fcf4f", [
    ["e", "M", 8, 11, 6, 4], ["e", "M", 5, 6, 2, 2], ["e", "M", 11, 6, 2, 2], ["p", "W", 5, 6, 11, 6], ["p", "K", 5, 5, 11, 5],
    ["l", "D", 5, 11, 11, 11], ["r", "D", 1, 13, 3, 2], ["r", "D", 12, 13, 3, 2],
  ]),
  S("fish", ["fish", "goldfish", "salmon", "trout", "tuna", "clownfish"], "animal", "#ff8a1f", [
    ["t", "D", 0, 6, 4, 9, 0, 13], ["e", "M", 9, 9, 6, 4], ["p", "W", 12, 8], ["p", "K", 13, 8], ["l", "D", 9, 6, 10, 12], ["p", "L", 6, 7, 7, 8],
  ], { air: false }),
  S("shark", ["shark"], "animal", "#7a8aa8", [
    ["t", "D", 0, 6, 3, 10, 0, 14], ["e", "M", 9, 10, 7, 3], ["t", "M", 7, 7, 9, 3, 11, 7], ["e", "W", 10, 12, 5, 1.2],
    ["p", "K", 13, 9], ["p", "W", 12, 11, 14, 11],
  ]),
  S("whale", ["whale", "dolphin", "orca"], "animal", "#2f6fd8", [
    ["t", "D", 0, 6, 3, 9, 1, 11], ["e", "M", 8, 10, 7, 4.5], ["e", "L", 9, 12, 5, 1.5], ["p", "K", 12, 9], ["p", "c", 9, 2, 8, 3, 10, 3, 9, 4],
  ]),
  S("octopus", ["octopus", "squid"], "animal", "#ff5fa8", [
    ["e", "M", 8, 5, 5, 5], ["r", "M", 3, 9, 1, 5], ["r", "M", 5, 9, 1, 6], ["r", "M", 7, 9, 1, 7], ["r", "M", 9, 9, 1, 7],
    ["r", "M", 11, 9, 1, 6], ["r", "M", 13, 9, 1, 5], ["p", "W", 6, 5, 10, 5], ["p", "K", 6, 6, 10, 6], ["p", "L", 6, 2, 7, 2],
  ]),
  S("snake", ["snake", "cobra", "worm", "serpent"], "animal", "#5fcf3f", [
    ["e", "M", 6, 13, 5, 2], ["e", "M", 9, 11, 4, 2], ["r", "M", 11, 5, 2, 6], ["e", "M", 12.5, 4.5, 2.5, 2],
    ["p", "K", 13, 4], ["p", "R", 15, 5, 15, 6], ["p", "D", 3, 13, 6, 12, 9, 13, 8, 10],
  ]),
  S("bird", ["bird", "parrot", "sparrow", "robin", "crow", "pigeon", "seagull"], "animal", "#3fa8ff", [
    ["e", "M", 7, 9, 4.5, 3.5], ["e", "M", 11, 6, 2.5, 2.5], ["t", "D", 3, 8, 8, 8, 5, 11], ["t", "Y", 13, 5, 15, 6, 13, 7],
    ["p", "K", 11, 5], ["l", "D", 0, 8, 3, 9], ["p", "O", 7, 13, 9, 13],
  ], { air: true }),
  S("owl", ["owl"], "animal", "#9a6a3a", [
    ["e", "M", 8, 9, 5, 6], ["e", "t", 8, 11, 3, 3.5], ["e", "W", 6, 6, 1.8, 1.8], ["e", "W", 10, 6, 1.8, 1.8],
    ["p", "K", 6, 6, 10, 6], ["p", "O", 8, 7, 8, 8], ["t", "M", 3, 4, 5, 1, 6, 4], ["t", "M", 10, 4, 11, 1, 13, 4], ["p", "O", 6, 15, 9, 15],
  ]),
  S("duck", ["duck", "duckling", "goose", "swan"], "animal", "#ffd23f", [
    ["e", "M", 7, 11, 5, 3], ["e", "M", 11, 6, 2.5, 2.5], ["r", "O", 13, 6, 3, 1.5], ["p", "K", 11, 5], ["t", "D", 4, 9, 8, 10, 4, 12], ["t", "M", 1, 8, 3, 10, 2, 11],
  ]),
  S("chicken", ["chicken", "hen", "rooster", "chick", "turkey"], "animal", "#f4f4ff", [
    ["e", "M", 7, 10, 4.5, 3.5], ["e", "M", 10, 6, 2.5, 3], ["p", "R", 10, 2, 11, 2, 10, 3], ["t", "O", 12, 5, 14, 6, 12, 7], ["p", "R", 12, 8],
    ["p", "K", 11, 5], ["t", "w", 2, 7, 4, 10, 2, 11], ["l", "O", 6, 13, 6, 15], ["l", "O", 8, 13, 8, 15],
  ]),
  S("turtle", ["turtle", "tortoise"], "animal", "#4f9f3f", [
    ["r", "l", 3, 12, 2, 3], ["r", "l", 10, 12, 2, 3], ["e", "l", 13, 10, 2, 1.7],
    ["e", "M", 7, 10, 5, 4], ["r", "l", 2, 12, 11, 1], ["p", "D", 5, 8, 9, 8, 7, 10, 5, 11, 9, 11, 7, 7], ["p", "K", 14, 9],
  ]),
  S("crab", ["crab", "lobster"], "animal", "#ff4f3f", [
    ["e", "M", 8, 11, 5, 3], ["e", "M", 2, 6, 2, 2], ["e", "M", 14, 6, 2, 2], ["l", "M", 3, 8, 5, 10], ["l", "M", 13, 8, 11, 10],
    ["p", "W", 2, 5, 14, 5], ["r", "M", 6, 7, 1, 2], ["r", "M", 9, 7, 1, 2], ["p", "K", 6, 7, 9, 7],
    ["l", "D", 3, 14, 5, 13], ["l", "D", 13, 14, 11, 13],
  ]),
  S("butterfly", ["butterfly", "moth"], "animal", "#ff8fc8", [
    ["e", "M", 4.5, 6, 3.5, 4], ["e", "M", 11.5, 6, 3.5, 4], ["e", "D", 5, 12, 2.5, 2.5], ["e", "D", 11, 12, 2.5, 2.5],
    ["p", "Y", 4, 5, 12, 5], ["r", "K", 7, 4, 2, 10], ["p", "K", 6, 2, 10, 2],
  ], { air: true }),
  S("bee", ["bee", "bumblebee", "bug", "ladybug", "beetle", "ant", "insect"], "animal", "#ffd23f", [
    ["e", "w", 6, 4, 2.5, 3], ["e", "w", 10, 4, 2.5, 3], ["e", "M", 8, 10, 5.5, 4], ["r", "K", 6, 6, 2, 8], ["r", "K", 10, 7, 2, 6],
    ["p", "K", 13, 9], ["p", "K", 2, 10],
  ], { air: true }),
  S("snail", ["snail", "slug"], "animal", "#d8a86a", [
    ["r", "t", 1, 13, 14, 3], ["e", "M", 7, 9, 5, 5], ["e", "D", 7, 9, 3, 3], ["e", "M", 7, 9, 1.5, 1.5], ["r", "t", 12, 7, 2, 7],
    ["l", "t", 12, 7, 11, 4], ["l", "t", 13, 7, 14, 4], ["p", "K", 11, 4, 14, 4],
  ]),

  // ---- people
  S("kid", ["kid", "child", "boy", "girl", "friend", "student", "person", "baby", "brother", "sister", "cousin", "classmate"], "person", "#2456e8", person()),
  S("chef", ["chef", "cook", "baker", "lunch lady"], "person", "#f4f4ff", person({
    hair: "N", hat: [["r", "W", 5, 0, 6, 2], ["e", "W", 8, 0, 3.5, 1.5]], extra: [["p", "R", 8, 9, 8, 10]],
  })),
  S("king", ["king", "queen", "prince", "princess", "royal", "emperor"], "person", "#c02040", person({
    hair: "y", long: true, hat: [["r", "Y", 5, 0, 6, 2], ["p", "Y", 5, -1, 8, -1, 10, -1], ["p", "R", 8, 1]], extra: [["r", "W", 5, 8, 6, 1]],
  })),
  S("pirate", ["pirate", "captain", "sailor"], "person", "#e3262f", person({
    hair: "n", hat: [["r", "K", 4, 0, 8, 2], ["e", "K", 8, 0, 3, 1.5], ["p", "W", 8, 0]], extra: [["p", "K", 9, 4, 10, 3], ["r", "W", 5, 9, 6, 1], ["r", "W", 5, 11, 6, 1]],
  })),
  S("wizard", ["wizard", "witch", "sorcerer", "magician", "genie"], "person", "#6b3fd9", person({
    hair: "w", long: true, hat: [["t", "M", 4, 2, 8, -4, 12, 2], ["p", "Y", 8, -1, 7, 1]], extra: [["t", "W", 6, 6, 10, 6, 8, 10], ["l", "N", 13, 4, 13, 15], ["p", "Y", 13, 3]],
  })),
  S("knight", ["knight", "soldier", "guard"], "person", "#a0a8c0", person({
    skin: "S", hat: [["e", "M", 8, 3.5, 3.5, 3.5], ["r", "K", 6, 4, 5, 1], ["p", "R", 8, -1, 8, 0]], legs: "g", extra: [["l", "w", 14, 3, 14, 12], ["r", "Y", 13, 10, 3, 1]],
  })),
  S("astronaut", ["astronaut", "spaceman", "cosmonaut"], "person", "#f4f4ff", person({
    legs: "w", hat: [["e", "M", 8, 4.5, 4, 4], ["e", "b", 8, 4.5, 2.5, 2], ["p", "W", 7, 3]], extra: [["r", "R", 6, 9, 2, 2], ["r", "b", 9, 9, 1, 1]],
  })),
  S("teacher", ["teacher", "principal", "librarian", "coach", "guide", "doctor", "nurse", "scientist", "detective", "judge"], "person", "#3f9f6f", person({
    hair: "n", hat: [["e", "n", 8, 0.5, 2, 1.5]], extra: [["p", "K", 6, 4, 7, 4, 8, 4, 9, 4, 10, 4], ["p", "W", 7, 4, 9, 4], ["r", "W", 7, 8, 2, 2]],
  })),
  S("grandma", ["grandma", "grandpa", "granny", "grandmother", "grandfather", "abuela", "abuelo", "grandparent"], "person", "#ff8fc8", person({
    hair: "w", long: true, hat: [["e", "w", 8, 0.5, 2, 1.5]], extra: [["p", "K", 6, 4, 7, 4, 9, 4, 10, 4], ["l", "N", 13, 9, 14, 15]],
  })),
  S("zookeeper", ["zookeeper", "farmer", "ranger", "explorer"], "person", "#6a8a3a", person({
    hat: [["r", "T", 3, 1, 10, 1], ["e", "T", 8, 0.5, 3, 1.5]], legs: "T",
  }), { hidden: false }),
  S("superhero", ["superhero", "hero", "heroine"], "person", "#2456e8", person({
    hair: "K", extra: [["t", "R", 4, 8, 12, 8, 14, 15], ["r", "M", 5, 8, 6, 5], ["p", "Y", 7, 9, 8, 9, 9, 9, 8, 10], ["r", "K", 6, 4, 5, 1], ["p", "W", 7, 4, 9, 4]],
  })),
  S("ninja", ["ninja"], "person", "#262640", person({
    skin: "S", hair: "M", legs: "M", hat: [["e", "M", 8, 3.5, 3.5, 3.5], ["r", "S", 6, 3, 5, 2], ["p", "K", 7, 4, 9, 4], ["p", "R", 12, 3, 13, 4]],
  })),

  // ---- fantasy & friendly monsters
  S("robot", ["robot", "android", "machine", "bot", "chairbot", "invention", "gadget", "computer"], "fantasy", "#8aa0c8", [
    ["l", "K", 8, 0, 8, 2], ["p", "R", 8, 0],
    ["r", "M", 4, 2, 8, 5], ["r", "c", 5, 3, 2, 2], ["r", "c", 9, 3, 2, 2], ["r", "D", 6, 6, 4, 1],
    ["r", "M", 3, 8, 10, 5], ["r", "Y", 6, 9, 4, 2], ["p", "R", 7, 10], ["p", "G", 9, 10],
    ["r", "D", 1, 8, 2, 4], ["r", "D", 13, 8, 2, 4], ["r", "D", 5, 13, 2, 3], ["r", "D", 9, 13, 2, 3],
  ]),
  S("alien", ["alien", "martian", "space creature", "extraterrestrial"], "fantasy", "#7fe05f", [
    ["l", "M", 5, 1, 6, 3], ["l", "M", 11, 1, 10, 3], ["p", "Y", 5, 1, 11, 1],
    ["e", "M", 8, 6, 5, 4], ["e", "K", 6, 6, 1.5, 2], ["e", "K", 10, 6, 1.5, 2], ["p", "W", 6, 5, 10, 5], ["p", "D", 7, 9, 8, 9, 9, 9],
    ["r", "M", 6, 10, 4, 4], ["r", "M", 4, 11, 2, 1], ["r", "M", 10, 11, 2, 1], ["r", "D", 6, 14, 1, 2], ["r", "D", 9, 14, 1, 2],
  ]),
  S("ghost", ["ghost", "spirit", "phantom"], "fantasy", "#f4f4ff", [
    ["e", "M", 8, 6, 5, 5], ["r", "M", 3, 6, 10, 8], ["p", "M", 3, 14, 5, 14, 7, 15, 8, 15, 10, 14, 12, 14],
    ["e", "K", 6, 6, 1, 1.5], ["e", "K", 10, 6, 1, 1.5], ["e", "k", 8, 10, 1.5, 1], ["p", "k", 4, 8, 12, 8],
  ], { air: true }),
  S("monster", ["monster", "creature", "beast", "goblin", "troll", "ogre", "yeti", "bigfoot"], "fantasy", "#9b4fe0", [
    ["t", "Y", 3, 4, 4, 0, 6, 3], ["t", "Y", 10, 3, 12, 0, 13, 4],
    ["e", "M", 8, 8, 6, 6], ["e", "W", 8, 6, 2.5, 2.5], ["e", "K", 8, 6, 1, 1.2], ["r", "K", 5, 10, 6, 2], ["p", "W", 6, 10, 9, 10],
    ["r", "D", 4, 13, 3, 3], ["r", "D", 9, 13, 3, 3],
  ]),
  S("snowman", ["snowman", "snow person", "snowwoman"], "fantasy", "#f4f4ff", [
    ["e", "M", 8, 12, 5, 4], ["e", "M", 8, 6, 3.5, 3], ["r", "K", 5, 1, 6, 2], ["r", "K", 6, -2, 4, 3], ["r", "R", 6, 0, 4, 1],
    ["p", "K", 7, 5, 9, 5, 8, 11, 8, 13], ["p", "O", 9, 6, 10, 6, 11, 7], ["l", "N", 1, 7, 4, 10], ["l", "N", 15, 7, 12, 10],
  ]),
  S("mermaid", ["mermaid", "merman", "merperson"], "fantasy", "#3fbfa8", [
    ["e", "S", 8, 4, 2.5, 2.5], ["r", "k", 5, 1, 6, 3], ["r", "k", 4, 4, 2, 5], ["p", "K", 7, 4, 9, 4],
    ["r", "S", 6, 7, 4, 3], ["e", "M", 8, 11, 3, 2.5], ["l", "M", 9, 13, 11, 15], ["t", "D", 9, 15, 14, 12, 14, 16],
  ]),

  // ---- foods
  S("taco", ["taco", "burrito", "quesadilla"], "food", "#ffd23f", [
    ["e", "M", 8, 6, 7.5, 9], ["r", "X", 0, 0, 16, 6], ["e", "D", 8, 6, 5.5, 7], ["r", "X", 0, 0, 16, 7], ["e", "M", 8, 6, 4.5, 6], ["r", "X", 0, 0, 16, 8],
    ["e", "l", 8, 6, 6.5, 1.6], ["p", "R", 4, 5, 8, 4, 11, 5], ["p", "n", 3, 6, 6, 6, 10, 6, 13, 6, 5, 7, 11, 7],
  ]),
  S("pizza", ["pizza", "slice"], "food", "#ffd23f", [
    ["t", "T", 1, 3, 15, 3, 8, 15], ["t", "M", 2, 5, 14, 5, 8, 14], ["r", "T", 1, 2, 15, 3],
    ["e", "R", 6, 7, 1.3, 1.3], ["e", "R", 10, 7, 1.3, 1.3], ["e", "R", 8, 10.5, 1.3, 1.3],
  ]),
  S("banana", ["banana", "plantain"], "food", "#ffe03f", [
    ["e", "M", 8, 7, 7, 7], ["e", "X", 8, 4, 7, 6], ["p", "n", 1, 6, 15, 6], ["p", "D", 4, 12, 8, 13, 12, 12], ["p", "L", 5, 11, 9, 12],
  ]),
  S("apple", ["apple", "fruit"], "food", "#e3262f", [
    ["e", "M", 6, 10, 4, 4.5], ["e", "M", 10, 10, 4, 4.5], ["l", "n", 8, 3, 9, 6], ["e", "G", 11, 4, 2, 1], ["p", "L", 4, 8, 5, 7],
  ]),
  S("burger", ["burger", "hamburger", "cheeseburger"], "food", "#d8a86a", [
    ["e", "M", 8, 6, 6.5, 4], ["r", "M", 1, 6, 14, 1], ["r", "l", 1, 7, 14, 2], ["r", "Y", 2, 9, 12, 1], ["r", "n", 1, 10, 14, 2],
    ["r", "M", 2, 12, 12, 3], ["p", "W", 5, 4, 8, 3, 11, 4, 7, 5],
  ]),
  S("hotdog", ["hot dog", "hotdog", "sausage", "corn dog"], "food", "#d8a86a", [
    ["e", "M", 8, 11, 7, 3], ["e", "r", 8, 9, 7.5, 1.6], ["p", "Y", 3, 9, 5, 8, 7, 9, 9, 8, 11, 9, 13, 8],
  ]),
  S("icecream", ["ice cream", "icecream", "sundae", "cone", "gelato", "popsicle"], "food", "#ff8fc8", [
    ["t", "T", 4, 8, 12, 8, 8, 16], ["p", "N", 6, 10, 9, 11, 7, 13], ["e", "M", 8, 6, 4.5, 3.5], ["e", "W", 8, 3, 3, 2.5], ["p", "R", 8, 0],
  ]),
  S("cupcake", ["cupcake", "muffin"], "food", "#ff8fc8", [
    ["t", "B", 3, 9, 13, 9, 11, 16], ["r", "B", 4, 9, 8, 7], ["p", "b", 5, 10, 7, 10, 9, 10, 11, 10, 6, 12, 8, 12, 10, 12],
    ["e", "M", 8, 7, 5.5, 3], ["e", "M", 8, 4.5, 3, 2], ["e", "R", 8, 2, 1.2, 1.2], ["p", "Y", 5, 6, 10, 7, 7, 5],
  ]),
  S("cake", ["cake", "birthday cake", "cheesecake"], "food", "#ff8fc8", [
    ["r", "t", 2, 8, 12, 7], ["r", "M", 2, 7, 12, 2], ["p", "M", 3, 9, 6, 9, 9, 9, 12, 9], ["r", "N", 2, 11, 12, 1],
    ["r", "b", 5, 3, 1, 4], ["r", "Y", 8, 3, 1, 4], ["r", "l", 11, 3, 1, 4], ["p", "O", 5, 2, 8, 2, 11, 2],
  ]),
  S("donut", ["donut", "doughnut"], "food", "#ff8fc8", [
    ["e", "T", 8, 9, 7, 5], ["e", "M", 8, 8.5, 6, 4], ["e", "X", 8, 8.5, 2, 1.2],
    ["p", "Y", 3, 7, 12, 6, 5, 11, 11, 11], ["p", "b", 6, 5, 13, 9], ["p", "G", 4, 10, 9, 5],
  ]),
  S("cookie", ["cookie", "biscuit", "cracker"], "food", "#c08040", [
    ["e", "M", 8, 9, 6.5, 6], ["e", "n", 5, 7, 1, 1], ["e", "n", 10, 6, 1, 1], ["e", "n", 8, 10, 1, 1], ["e", "n", 11, 11, 1, 1], ["e", "n", 5, 12, 1, 1],
  ]),
  S("pancake", ["pancake", "waffle", "flapjack", "crepe"], "food", "#e8b060", [
    ["e", "D", 8, 13, 7, 2], ["e", "M", 8, 12, 7, 2], ["e", "D", 8, 10.5, 7, 2], ["e", "M", 8, 9.5, 7, 2], ["e", "D", 8, 8, 7, 2], ["e", "M", 8, 7, 7, 2],
    ["r", "Y", 6, 5, 4, 2], ["p", "n", 3, 8, 3, 9, 12, 8, 12, 9, 12, 10],
  ]),
  S("carrot", ["carrot", "turnip"], "food", "#ff8a1f", [
    ["t", "M", 4, 4, 12, 4, 8, 16], ["p", "D", 6, 7, 9, 9, 7, 11], ["l", "G", 8, 4, 6, 0], ["l", "G", 8, 4, 10, 0], ["l", "G", 8, 4, 8, 0],
  ]),
  S("broccoli", ["broccoli", "vegetable", "veggie", "cauliflower", "kale"], "food", "#3fbf4f", [
    ["r", "l", 6, 9, 4, 7], ["e", "M", 5, 6, 3, 3], ["e", "M", 11, 6, 3, 3], ["e", "M", 8, 4, 3.5, 3.5], ["p", "D", 4, 6, 9, 3, 12, 7, 7, 6],
  ]),
  S("cheese", ["cheese", "cheddar"], "food", "#ffd23f", [
    ["t", "M", 1, 14, 15, 14, 15, 5], ["r", "M", 1, 14, 15, 2], ["e", "D", 11, 11, 1.2, 1.2], ["e", "D", 7, 13, 1, 1], ["e", "D", 13, 8, 1, 1],
  ]),
  S("watermelon", ["watermelon", "melon"], "food", "#ff4f6f", [
    ["e", "G", 8, 6, 8, 9], ["e", "l", 8, 6, 7, 8], ["e", "M", 8, 6, 6, 7], ["r", "X", 0, 0, 16, 6],
    ["p", "K", 5, 9, 8, 10, 11, 9, 7, 8, 9, 8],
  ]),
  S("pickle", ["pickle", "cucumber", "zucchini"], "food", "#5fae2f", [
    ["e", "M", 8, 9, 3.5, 7], ["p", "D", 7, 4, 9, 6, 7, 8, 9, 10, 7, 12, 9, 14], ["p", "L", 6, 6, 6, 9],
  ]),
  S("spaghetti", ["spaghetti", "noodle", "pasta", "macaroni", "lasagna", "meatball"], "food", "#ffe07f", [
    ["e", "W", 8, 13, 7.5, 2.5], ["e", "M", 8, 10, 6, 3.5], ["l", "D", 3, 10, 7, 8], ["l", "D", 8, 12, 13, 9], ["l", "D", 4, 12, 9, 9],
    ["e", "n", 6, 8, 1.6, 1.6], ["e", "n", 10, 8, 1.6, 1.6], ["e", "R", 8, 10, 1.5, 1],
  ]),
  S("popcorn", ["popcorn"], "food", "#e3262f", [
    ["e", "W", 5, 4, 2, 2], ["e", "Y", 8, 3, 2, 2], ["e", "W", 11, 4, 2, 2], ["e", "W", 8, 5, 2.5, 1.5],
    ["t", "W", 3, 6, 13, 6, 11, 16], ["r", "W", 4, 6, 8, 10], ["r", "M", 4, 6, 2, 10], ["r", "M", 8, 6, 2, 10], ["r", "M", 11, 6, 1, 10],
  ]),
  S("strawberry", ["strawberry", "berry", "raspberry", "blueberry", "cherry"], "food", "#ff3f4f", [
    ["e", "M", 8, 9, 5, 4], ["t", "M", 3, 9, 13, 9, 8, 15], ["p", "Y", 6, 8, 9, 9, 11, 8, 7, 11, 10, 11, 8, 13], ["t", "G", 4, 5, 12, 5, 8, 7], ["l", "h", 8, 5, 8, 2],
  ]),
  S("egg", ["egg", "omelet"], "food", "#f4f4ff", [
    ["e", "M", 8, 11, 7, 4], ["e", "Y", 7, 10, 2.5, 2.5], ["p", "W", 6, 9],
  ]),
  S("sandwich", ["sandwich", "sub", "toast", "bread", "loaf"], "food", "#e8c070", [
    ["t", "M", 1, 14, 15, 14, 8, 3], ["r", "l", 2, 13, 13, 1], ["t", "t", 3, 13, 13, 13, 8, 5], ["p", "R", 6, 12, 10, 12],
  ]),
  S("pie", ["pie", "tart"], "food", "#c08040", [
    ["e", "w", 8, 12, 7.5, 3], ["e", "M", 8, 10.5, 7, 3], ["l", "D", 4, 9, 12, 12], ["l", "D", 4, 12, 12, 9], ["l", "D", 8, 8, 8, 13],
  ]),

  // ---- vehicles
  S("car", ["car", "van", "taxi", "jeep", "camper", "racecar", "camper van", "vehicle", "rover"], "vehicle", "#e3262f", [
    ["r", "M", 1, 8, 14, 5], ["r", "M", 4, 4, 8, 4], ["r", "b", 5, 5, 3, 3], ["r", "b", 9, 5, 2, 3],
    ["e", "K", 4, 13, 2, 2], ["e", "K", 12, 13, 2, 2], ["p", "w", 4, 13, 12, 13], ["p", "Y", 15, 9], ["p", "R", 1, 9],
  ]),
  S("rocket", ["rocket", "spaceship", "rocket ship", "spacecraft", "shuttle"], "vehicle", "#f4f4ff", [
    ["t", "O", 6, 13, 10, 13, 8, 16], ["t", "R", 3, 13, 6, 9, 6, 13], ["t", "R", 13, 13, 10, 9, 10, 13],
    ["r", "M", 6, 4, 4, 9], ["t", "R", 6, 4, 10, 4, 8, 0], ["e", "b", 8, 7, 1.3, 1.3],
  ], { air: true }),
  S("truck", ["truck", "food truck", "fire truck", "dump truck", "tractor"], "vehicle", "#2f8fff", [
    ["r", "M", 0, 3, 10, 10], ["r", "Y", 1, 5, 8, 3], ["r", "W", 1, 4, 8, 1], ["r", "D", 0, 2, 10, 1],
    ["r", "M", 10, 6, 6, 7], ["r", "b", 11, 7, 3, 3], ["r", "K", 0, 11, 16, 1],
    ["e", "K", 3, 13, 2, 2], ["e", "K", 12, 13, 2, 2], ["p", "w", 3, 13, 12, 13], ["p", "Y", 15, 10],
  ]),
  S("bus", ["bus", "school bus", "trolley"], "vehicle", "#ffc020", [
    ["r", "M", 0, 4, 16, 9], ["r", "b", 1, 5, 2, 3], ["r", "b", 4, 5, 2, 3], ["r", "b", 7, 5, 2, 3], ["r", "b", 10, 5, 2, 3], ["r", "b", 13, 5, 2, 4],
    ["r", "K", 0, 10, 16, 1], ["e", "K", 3, 13, 2, 2], ["e", "K", 12, 13, 2, 2], ["p", "w", 3, 13, 12, 13],
  ]),
  S("train", ["train", "locomotive", "subway"], "vehicle", "#2456e8", [
    ["r", "M", 1, 6, 10, 7], ["r", "M", 9, 3, 5, 10], ["r", "b", 10, 4, 3, 3], ["r", "K", 3, 2, 2, 4], ["e", "w", 4, 0.5, 2, 1.2],
    ["e", "K", 3, 13, 2, 2], ["e", "K", 8, 13, 2, 2], ["e", "K", 12, 13, 2, 2], ["r", "Y", 14, 10, 2, 2],
  ]),
  S("boat", ["boat", "ship", "sailboat", "canoe", "raft", "yacht"], "vehicle", "#8a5a2b", [
    ["t", "W", 8, 1, 8, 10, 14, 10], ["t", "w", 7, 3, 7, 10, 3, 10], ["l", "n", 8, 0, 8, 11], ["t", "M", 0, 11, 16, 11, 13, 15], ["r", "M", 2, 11, 12, 4], ["p", "R", 9, 1, 10, 1],
  ]),
  S("airplane", ["airplane", "plane", "jet", "jumbo jet"], "vehicle", "#f4f4ff", [
    ["e", "M", 8, 9, 7, 2], ["t", "w", 6, 9, 10, 9, 6, 15], ["t", "w", 6, 9, 10, 9, 7, 3], ["t", "R", 1, 9, 3, 9, 0, 5],
    ["p", "b", 10, 8, 12, 8, 14, 9],
  ], { air: true }),
  S("bike", ["bike", "bicycle", "tricycle", "scooter", "motorcycle", "unicycle"], "vehicle", "#e3262f", [
    ["e", "K", 3.5, 12, 3, 3], ["e", "X", 3.5, 12, 1.8, 1.8], ["e", "K", 12.5, 12, 3, 3], ["e", "X", 12.5, 12, 1.8, 1.8],
    ["l", "M", 4, 12, 8, 7], ["l", "M", 8, 7, 12, 12], ["l", "M", 8, 7, 11, 7], ["l", "M", 4, 12, 9, 12], ["r", "K", 6, 6, 3, 1], ["l", "M", 12, 12, 11, 5], ["r", "K", 10, 4, 3, 1],
  ]),
  S("submarine", ["submarine", "bathysphere"], "vehicle", "#ffd23f", [
    ["e", "M", 8, 10, 7, 4], ["r", "M", 6, 4, 4, 3], ["l", "K", 8, 1, 8, 4], ["l", "K", 8, 1, 10, 1], ["e", "b", 5, 10, 1.4, 1.4], ["e", "b", 9, 10, 1.4, 1.4], ["e", "b", 13, 10, 1.2, 1.2],
    ["t", "D", 0, 7, 2, 10, 0, 13],
  ]),
  S("ufo", ["ufo", "flying saucer", "saucer"], "vehicle", "#a0a8c0", [
    ["e", "c", 8, 6, 4, 3.5], ["e", "M", 8, 9, 7.5, 2.5], ["p", "Y", 3, 9, 6, 10, 10, 10, 13, 9], ["t", "l", 6, 11, 10, 11, 8, 15],
  ], { air: true }),

  // ---- things
  S("ball", ["ball", "beach ball", "soccer ball", "basketball", "baseball", "football", "marble", "gumball"], "thing", "#e3262f", [
    ["e", "M", 8, 9, 6, 6], ["l", "W", 2, 9, 14, 9], ["l", "W", 8, 3, 8, 15], ["p", "L", 5, 6, 6, 5],
  ]),
  S("balloon", ["balloon", "blimp"], "thing", "#ff3fa8", [
    ["e", "M", 8, 6, 5, 6], ["p", "W", 5, 3, 6, 3, 5, 4], ["t", "M", 7, 12, 9, 12, 8, 13], ["l", "w", 8, 13, 7, 16],
  ], { air: true }),
  S("hat", ["hat", "top hat", "cap", "helmet", "beanie", "sombrero"], "thing", "#262640", [
    ["r", "M", 1, 13, 14, 2], ["r", "M", 4, 4, 8, 9], ["r", "R", 4, 10, 8, 2],
  ]),
  S("shoe", ["shoe", "sneaker", "boot", "slipper", "sandal"], "thing", "#2456e8", [
    ["r", "M", 2, 7, 6, 6], ["e", "M", 9, 11, 6, 2.5], ["r", "W", 1, 13, 15, 2], ["p", "W", 4, 8, 6, 9, 4, 10], ["r", "L", 3, 7, 4, 1],
  ]),
  S("sock", ["sock", "stocking", "mitten", "glove"], "thing", "#e3262f", [
    ["r", "M", 5, 1, 5, 10], ["e", "M", 9, 12, 5, 3], ["r", "W", 5, 1, 5, 2], ["r", "W", 5, 5, 5, 1], ["r", "W", 5, 8, 5, 1],
  ]),
  S("umbrella", ["umbrella", "parasol"], "thing", "#8b3fd9", [
    ["e", "M", 8, 7, 7.5, 6], ["r", "X", 0, 7, 16, 9], ["p", "L", 4, 3, 8, 2, 12, 3], ["l", "n", 8, 7, 8, 14], ["p", "n", 7, 15, 6, 14],
  ]),
  S("book", ["book", "dictionary", "notebook", "diary", "novel", "comic", "homework", "encyclopedia"], "thing", "#2456e8", [
    ["r", "M", 3, 2, 10, 13], ["r", "W", 12, 3, 2, 12], ["r", "D", 3, 2, 2, 13], ["r", "Y", 7, 5, 4, 2],
  ]),
  S("guitar", ["guitar", "banjo", "violin", "ukulele"], "thing", "#c06020", [
    ["e", "M", 6, 11, 4, 4], ["e", "M", 8, 7.5, 3, 3], ["e", "n", 6.5, 10, 1.3, 1.3], ["l", "n", 9, 7, 14, 1], ["r", "K", 13, 0, 3, 2],
  ]),
  S("drum", ["drum", "tambourine", "bongo"], "thing", "#e3262f", [
    ["r", "M", 2, 7, 12, 7], ["e", "W", 8, 7, 6, 2], ["e", "M", 8, 14, 6, 1.5], ["l", "Y", 2, 8, 6, 13], ["l", "Y", 6, 8, 10, 13], ["l", "Y", 10, 8, 14, 13],
    ["l", "N", 3, 1, 7, 6], ["l", "N", 13, 1, 9, 6],
  ]),
  S("trumpet", ["trumpet", "horn", "tuba", "saxophone", "kazoo", "flute", "whistle"], "thing", "#ffd23f", [
    ["r", "M", 1, 7, 10, 2], ["t", "M", 10, 8, 15, 3, 15, 13], ["r", "D", 4, 5, 1, 2], ["r", "D", 6, 5, 1, 2], ["r", "D", 8, 5, 1, 2], ["p", "L", 13, 6, 13, 7],
  ]),
  S("teapot", ["teapot", "kettle", "pot", "mug", "cup", "cocoa"], "thing", "#3fa8ff", [
    ["e", "M", 8, 10, 5, 4.5], ["r", "M", 6, 4, 4, 2], ["e", "D", 8, 3.5, 1, 1], ["l", "M", 12, 9, 15, 6], ["e", "X", 2, 10, 2, 2.5], ["l", "D", 2, 8, 2, 12], ["l", "D", 2, 8, 3, 7], ["l", "D", 2, 12, 3, 13],
  ]),
  S("crown", ["crown", "tiara"], "thing", "#ffd23f", [
    ["r", "M", 2, 9, 12, 5], ["t", "M", 2, 9, 2, 3, 6, 9], ["t", "M", 5, 9, 8, 2, 11, 9], ["t", "M", 10, 9, 14, 3, 14, 9],
    ["e", "R", 8, 11, 1.2, 1.2], ["p", "B", 4, 11, 12, 11], ["p", "W", 2, 3, 8, 2, 14, 3],
  ]),
  S("trophy", ["trophy", "prize", "medal", "award", "cup trophy", "ribbon"], "thing", "#ffd23f", [
    ["e", "M", 8, 4, 5, 4], ["r", "X", 0, 0, 16, 4], ["r", "M", 3, 1, 10, 4], ["l", "M", 2, 2, 1, 5], ["l", "M", 14, 2, 15, 5],
    ["r", "M", 7, 8, 2, 4], ["r", "N", 4, 12, 8, 3], ["p", "W", 5, 2, 5, 3],
  ]),
  S("gift", ["gift", "present", "box", "package", "surprise"], "thing", "#3fbf4f", [
    ["r", "M", 2, 6, 12, 9], ["r", "L", 1, 5, 14, 3], ["r", "R", 7, 5, 2, 10], ["e", "R", 6, 3.5, 2, 1.5], ["e", "R", 10, 3.5, 2, 1.5],
  ]),
  S("star", ["star", "starfish", "comet"], "thing", "#ffd23f", [
    ["t", "M", 8, 0, 11, 8, 5, 8], ["t", "M", 0, 6, 16, 6, 8, 11], ["t", "M", 8, 9, 3, 15, 5, 7], ["t", "M", 8, 9, 13, 15, 11, 7], ["p", "W", 7, 4, 8, 5],
  ], { air: true }),
  S("tree", ["tree", "palm tree", "bush", "plant", "vine"], "place", "#3fbf4f", [
    ["r", "N", 6, 9, 4, 7], ["e", "M", 8, 6, 6.5, 5.5], ["e", "D", 6, 8, 2, 1.5], ["e", "L", 9, 3, 2, 1.5],
  ]),
  S("flower", ["flower", "rose", "daisy", "tulip", "sunflower", "blossom"], "thing", "#ff5fd2", [
    ["l", "G", 8, 8, 8, 16], ["e", "G", 10, 12, 2, 1], ["e", "M", 8, 3, 2, 2], ["e", "M", 5, 6, 2, 2], ["e", "M", 11, 6, 2, 2], ["e", "M", 6, 9, 1.8, 1.8], ["e", "M", 10, 9, 1.8, 1.8], ["e", "Y", 8, 6.5, 2, 2],
  ]),
  S("house", ["house", "home", "cabin", "hut", "cottage", "barn"], "place", "#f0d49a", [
    ["t", "R", 0, 7, 16, 7, 8, 0], ["r", "M", 2, 7, 12, 9], ["r", "N", 7, 10, 3, 6], ["r", "b", 3, 9, 3, 3], ["r", "b", 11, 9, 2, 3],
  ]),
  S("tent", ["tent", "teepee", "campsite"], "place", "#ff8a1f", [
    ["t", "M", 8, 1, 0, 15, 15, 15], ["t", "D", 8, 6, 5, 15, 11, 15], ["l", "n", 8, 0, 8, 2], ["p", "R", 9, 0, 10, 0],
    ["l", "L", 7, 3, 2, 13],
  ]),
  S("castle", ["castle", "palace", "fort", "tower", "kingdom"], "place", "#a0a8c0", [
    ["r", "M", 1, 4, 4, 12], ["r", "M", 11, 4, 4, 12], ["r", "M", 4, 7, 8, 9], ["p", "M", 1, 3, 3, 3, 11, 3, 13, 3, 4, 6, 7, 6, 10, 6],
    ["r", "n", 6, 11, 4, 5], ["e", "n", 8, 11, 2, 1.5], ["r", "K", 2, 6, 1, 2], ["r", "K", 13, 6, 1, 2], ["l", "K", 3, 0, 3, 3], ["r", "R", 4, 0, 2, 1],
  ]),
  S("rock", ["rock", "stone", "boulder", "pebble", "crystal", "gem", "diamond"], "thing", "#8a8aa0", [
    ["e", "M", 8, 11, 7, 5], ["e", "L", 6, 9, 2.5, 1.5], ["p", "D", 10, 13, 12, 12, 4, 13],
  ]),
  S("toothbrush", ["toothbrush", "brush", "hairbrush", "paintbrush", "broom", "mop"], "thing", "#3fa8ff", [
    ["l", "M", 2, 14, 11, 5], ["l", "M", 3, 14, 12, 5], ["r", "W", 11, 1, 4, 3], ["p", "c", 11, 1, 13, 1],
  ]),
  S("kite", ["kite"], "thing", "#e3262f", [
    ["t", "M", 8, 0, 14, 6, 8, 12], ["t", "Y", 8, 0, 2, 6, 8, 12], ["l", "K", 8, 0, 8, 12], ["l", "K", 2, 6, 14, 6],
    ["l", "w", 8, 12, 6, 16], ["p", "b", 7, 13, 7, 14, 6, 15],
  ], { air: true }),
  S("sun", ["sun", "sunshine"], "thing", "#ffd23f", [
    ["e", "M", 8, 8, 4.5, 4.5], ["l", "O", 8, 0, 8, 2], ["l", "O", 8, 14, 8, 16], ["l", "O", 0, 8, 2, 8], ["l", "O", 14, 8, 16, 8],
    ["p", "O", 2, 2, 3, 3, 13, 2, 12, 3, 2, 13, 3, 12, 13, 13, 12, 12], ["p", "K", 6, 7, 10, 7], ["l", "O", 6, 10, 10, 10],
  ], { air: true }),
  S("moon", ["moon", "crescent"], "thing", "#fff0a0", [
    ["e", "M", 8, 8, 6, 6.5], ["e", "X", 11, 6, 5, 5.5], ["p", "D", 5, 9, 6, 12],
  ], { air: true }),
  S("cloud", ["cloud", "fog", "storm cloud"], "thing", "#f4f4ff", [
    ["e", "M", 5, 10, 4, 3], ["e", "M", 10, 8, 4.5, 4], ["e", "M", 13, 11, 3, 2.5], ["r", "M", 3, 11, 12, 3], ["p", "w", 4, 13, 8, 13, 12, 13],
  ], { air: true }),
  S("heart", ["heart", "valentine", "love"], "thing", "#ff3f6f", [
    ["e", "M", 5, 6, 3.5, 3.5], ["e", "M", 11, 6, 3.5, 3.5], ["t", "M", 1.5, 7, 14.5, 7, 8, 15], ["p", "W", 4, 4, 5, 4],
  ]),
  S("rainbow", ["rainbow"], "thing", "#e3262f", [
    ["e", "M", 8, 14, 8, 10], ["e", "O", 8, 14, 7, 9], ["e", "Y", 8, 14, 6, 8], ["e", "G", 8, 14, 5, 7], ["e", "B", 8, 14, 4, 6], ["e", "P", 8, 14, 3, 5],
    ["e", "X", 8, 14, 2, 4], ["r", "X", 0, 14, 16, 2],
  ], { air: true }),
  S("lamp", ["lamp", "lantern", "flashlight", "candle", "light bulb", "lightbulb"], "thing", "#ffd23f", [
    ["t", "M", 4, 7, 12, 7, 8, 1], ["r", "M", 4, 6, 8, 2], ["r", "N", 7, 8, 2, 6], ["r", "N", 4, 14, 8, 2], ["p", "W", 7, 4],
  ]),
  S("chair", ["chair", "couch", "sofa", "throne", "stool", "bench", "beanbag"], "thing", "#8b3fd9", [
    ["r", "M", 3, 1, 3, 15], ["r", "M", 3, 8, 11, 3], ["r", "D", 12, 11, 2, 5], ["r", "D", 4, 11, 2, 5], ["p", "L", 4, 2, 4, 3],
  ]),
  S("bed", ["bed", "pillow", "blanket", "hammock", "sleeping bag"], "thing", "#3fa8ff", [
    ["r", "N", 0, 5, 2, 11], ["r", "N", 14, 9, 2, 7], ["r", "M", 2, 9, 12, 4], ["e", "W", 4.5, 8.5, 2.5, 1.5], ["r", "L", 7, 8, 7, 2],
  ]),
  S("phone", ["phone", "telephone", "tablet", "laptop", "television", "tv", "video game", "radio", "microphone"], "thing", "#262640", [
    ["r", "M", 4, 1, 8, 15], ["r", "c", 5, 2, 6, 11], ["p", "W", 8, 14], ["p", "W", 6, 3, 7, 3],
  ]),
  S("rubberduck", ["rubber duck", "toy", "rubber ducky", "doll", "puppet"], "thing", "#ffd23f", [
    ["e", "M", 7, 11, 6, 4], ["e", "M", 10, 6, 3, 3], ["r", "O", 12, 6, 3, 2], ["p", "K", 10, 5], ["e", "D", 6, 11, 2, 1.5],
  ]),
  S("key", ["key", "lock"], "thing", "#ffd23f", [
    ["e", "M", 4, 8, 3.5, 3.5], ["e", "X", 4, 8, 1.4, 1.4], ["r", "M", 7, 7, 8, 2], ["r", "M", 12, 9, 1, 2], ["r", "M", 14, 9, 1, 3],
  ]),
  S("clock", ["clock", "watch", "alarm clock", "timer"], "thing", "#e3262f", [
    ["e", "M", 8, 9, 6.5, 6.5], ["e", "W", 8, 9, 5, 5], ["l", "K", 8, 9, 8, 5], ["l", "K", 8, 9, 11, 9], ["e", "M", 3, 2.5, 2, 1.5], ["e", "M", 13, 2.5, 2, 1.5],
  ]),
  S("backpack", ["backpack", "bag", "suitcase", "purse", "lunchbox", "basket"], "thing", "#ff8a1f", [
    ["r", "M", 3, 4, 10, 12], ["e", "M", 8, 4, 5, 2.5], ["r", "D", 5, 9, 6, 4], ["l", "D", 6, 1, 10, 1], ["p", "Y", 8, 10],
  ]),
  S("mystery", ["mystery box"], "thing", "#c49bff", [
    ["r", "M", 1, 2, 14, 13], ["r", "D", 1, 13, 14, 2], ["r", "L", 1, 2, 14, 1],
    ["p", "W", 6, 4, 7, 4, 8, 4, 9, 4, 10, 5, 10, 6, 9, 7, 8, 8, 8, 9, 8, 11],
  ], { hidden: true }),
];

/* ---------------------------------------------------------------- lookups */

const BY_ID = new Map(SPRITES.map((s) => [s.id, s]));
const BY_WORD = new Map<string, SpriteDef>();
for (const s of SPRITES) for (const w of s.words) if (!BY_WORD.has(w)) BY_WORD.set(w, s);

export function spriteById(id: string): SpriteDef | undefined {
  return BY_ID.get(id);
}

/** The sprite for a word (exact, then each word of a phrase from the end). */
export function spriteForWord(word: string): SpriteDef | undefined {
  const w = word.toLowerCase().trim();
  if (BY_WORD.has(w)) return BY_WORD.get(w);
  const parts = w.split(/[\s-]+/);
  for (let i = parts.length - 1; i >= 0; i--) if (BY_WORD.has(parts[i])) return BY_WORD.get(parts[i]);
  return undefined;
}

export function allSpriteWords(): string[] {
  return [...BY_WORD.keys()];
}
