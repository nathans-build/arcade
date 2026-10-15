/*
 * Quest of the Lost Library: the world map.
 *
 * Every room is a 20 x 12 grid of 16 px tiles. Rooms sit on a grid inside their area; the doors
 * between neighbouring rooms are listed once per area (DoorDef), so both sides always agree.
 * Door gaps are carved into the border automatically:
 *   north / south: columns 9-10 of row 0 / row 11       west / east: rows 5-6 of column 0 / column 19
 *
 * Tiles (rows):
 *   #  wall (bookshelves in a wing, hedge in town)   W  building wall (a wing gate or the grand library)
 *   .  floor          ,  rug (floor)     =  path (floor)   f  flowers (floor)   E  ink sprite / dust bunny spawn (floor)
 *   B  book crate (pushable block)       S  pressure switch (floor)
 *   T  cold torch (light it with the lantern: face it, press X)   Y  lit wall torch (decoration)
 *   R  crystal switch (hit it with the Bookmark Boomerang)
 *   _  gap (can't walk; the Grappling Quill pulls across to a hook post o)   o  hook post
 *   i  invisible-ink bridge (a gap until the Magnifier reveals it)
 *   ^  ink puddle (costs a heart from grade 3 up; a harmless dry stain for K-2)
 *   K / k  small key (k appears when the room's puzzle is solved)   M / m  wing map (same rule)
 *   C / c  chest (same rule; contents in RoomDef.chest)
 *   N  lectern / sign (Enter reads it)   F  Madame Folio, the head librarian (Enter talks)
 *   G  guardian (2 x 2 tiles; Enter starts the guardian's questions)
 *   P  gate door: warps to RoomDef.warp (a sealed gate opens when all four wings are restored)
 *   t  tree   ~  water   O  globe (decoration)
 *
 * Pure data + tiny helpers (no DOM), so scripts/check-rules.ts can load it under tsx.
 */
import type { Subject } from "../kit/types";

export const COLS = 20;
export const ROWS = 12;

export type Dir = "up" | "down" | "left" | "right";
export const DIRS: Dir[] = ["up", "down", "left", "right"];
export const DELTA: Record<Dir, [number, number]> = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
export const OPPOSITE: Record<Dir, Dir> = { up: "down", down: "up", left: "right", right: "left" };

export type WingId = "math" | "science" | "story" | "history";
export type AreaId = "hub" | WingId | "reading";
export type ItemId = "boomerang" | "quill" | "magnifier" | "bell";
export type DoorKind = "open" | "locked" | "question" | "shutter" | "hidden";
export type PuzzleKind = "blocks" | "torches" | "crystal" | "secret";

export const WINGS: WingId[] = ["math", "science", "story", "history"];

export interface DoorDef {
  /** Unique across the whole game. */
  id: string;
  /** Two rooms of the same area that are grid neighbours. */
  a: string;
  b: string;
  kind: DoorKind;
}

export interface Place {
  area: AreaId;
  room: string;
  x: number;
  y: number;
  facing: Dir;
}

export interface RoomDef {
  id: string;
  name: string;
  /** Column, row on the area grid. */
  at: [number, number];
  rows: string[];
  /** Solving it opens `opens` doors and makes the room's lower-case k / m / c tiles appear. */
  puzzle?: { kind: PuzzleKind; opens?: string[] };
  chest?: "item" | "book" | "key" | "map";
  /** Sign texts, in reading order of the N tiles (left to right, top to bottom). */
  signs?: string[];
  /** Text only the Magnifier shows (a "secret" puzzle room). */
  secret?: string;
  /** Where the room's P tiles lead. */
  warp?: Place;
  /** The P tiles stay shut until all four wings are restored (the Reading Room door). */
  sealed?: boolean;
  /** A side of the room that leads out of the area. */
  exit?: { side: Dir; to: Place };
}

export interface AreaDef {
  id: AreaId;
  name: string;
  /** Short HUD / map label. */
  short: string;
  subject: Subject | null;
  item: ItemId | null;
  /** Where a player starts (and comes back to after running out of hearts). */
  start: Place;
  rooms: RoomDef[];
  doors: DoorDef[];
  guardian: GuardianId | null;
}

export type GuardianId = "tallyshell" | "petri" | "inkwhisker" | "kitewing" | "smudge";

export interface GuardianDef {
  id: GuardianId;
  name: string;
  title: string;
  area: AreaId;
  /** Right answers needed (wrong ones only explain and ask another). */
  need: number;
  intro: string;
  win: string;
}

export const GUARDIANS: Record<GuardianId, GuardianDef> = {
  tallyshell: {
    id: "tallyshell", name: "SIR TALLYSHELL", title: "the Abacus Tortoise", area: "math", need: 3,
    intro: "Ho there, little page-keeper! I am Sir Tallyshell. I guard the Math Book, and I only hand it to someone who can count on their brains. Answer 3 of my questions right!",
    win: "Splendid sums! The Math Book is yours. Take it back to the shelves, and may your answers always add up!",
  },
  petri: {
    id: "petri", name: "PROFESSOR PETRI", title: "the Puffball Scientist", area: "science", need: 3,
    intro: "Ahem! Professor Petri, puffball scientist, at your service. Observe, wonder, then answer! Get 3 of my questions right and the Science Book is yours.",
    win: "A fine experiment! Here is the Science Book. Stay curious, my friend!",
  },
  inkwhisker: {
    id: "inkwhisker", name: "INKWHISKER", title: "the Paper Cat", area: "story", need: 3,
    intro: "Mrrow. I am Inkwhisker, folded from a thousand old pages. Words are my favorite toys. Answer 3 word puzzles right and I'll purr out the Story Book.",
    win: "Purr-fect reading! The Story Book is yours. Every story needs a reader like you.",
  },
  kitewing: {
    id: "kitewing", name: "KITEWING", title: "the Map Dragon", area: "history", need: 3,
    intro: "Whoosh! I am Kitewing, a dragon made of maps and kite string. I have flown over every land in these books. Answer 3 of my questions right to earn the History & Maps Book!",
    win: "You know your way around the world! Take the History & Maps Book home.",
  },
  smudge: {
    id: "smudge", name: "THE INK SMUDGE", title: "the Book Scatterer", area: "reading", need: 4,
    intro: "Splotch! I am the Ink Smudge. I knocked every book off the shelves and spilled ink sprites everywhere... because nobody ever read to ME. Answer 4 questions and maybe I'll tidy up.",
    win: "You... you read every wing back to life. I'm sorry for the mess! I'll be a good little ink blot now and help write new books.",
  },
};

export const ITEMS: Record<ItemId, { name: string; short: string; wing: WingId; how: string }> = {
  boomerang: { name: "Bookmark Boomerang", short: "BOOMERANG", wing: "math", how: "Press X to throw it. It flies over gaps, hits crystal switches and tidies ink sprites, then comes back." },
  quill: { name: "Grappling Quill", short: "QUILL", wing: "science", how: "Face a brass hook post across a gap and press X. The quill hooks on and pulls you over." },
  magnifier: { name: "Magnifier", short: "MAGNIFIER", wing: "story", how: "Press X to look closely. It shows invisible-ink bridges and secret writing in the room." },
  bell: { name: "Echo Bell", short: "ECHO BELL", wing: "history", how: "Press X to ring it. Its echo finds hidden doors behind cracked shelves." },
};

const P = (area: AreaId, room: string, x: number, y: number, facing: Dir): Place => ({ area, room, x, y, facing });

/* ------------------------------------------------------------------------------------ hub */

const HUB: AreaDef = {
  id: "hub", name: "Bramblebury Town", short: "TOWN", subject: null, item: null, guardian: null,
  start: P("hub", "h-square", 9, 8, "up"),
  rooms: [
    {
      id: "h-square", name: "Bramblebury Square", at: [1, 1],
      rows: [
        "####################",
        "#t..f...=..=...f..t#",
        "#.......=..=.......#",
        "#..N....~~~~....F..#",
        "#.......~~~~.......#",
        "#==================#",
        "#==================#",
        "#.f.....=..=.....f.#",
        "#t......=..=......t#",
        "#..f....=..=....f..#",
        "#t...E......E.....t#",
        "####################",
      ],
      signs: ["BRAMBLEBURY SQUARE. The Grand Lantern Library is north. Its four wings are west (Math), north-west (Science), north-east (Story) and east (History & Maps)."],
    },
    {
      id: "h-math", name: "Abacus Orchard", at: [0, 1],
      rows: [
        "####################",
        "#WWWWWWWW....t...t.#",
        "#WWWWWWWW..........#",
        "#WWWPPWWW....t.....#",
        "#..........f.......#",
        "#...N..============#",
        "#......============#",
        "#..t.....t......f..#",
        "#..................#",
        "#.t...f....t....t..#",
        "#..........E.......#",
        "####################",
      ],
      signs: ["MATH WING. Sir Tallyshell keeps the Math Book inside. Walk into the door to go in."],
      warp: P("math", "m1", 9, 10, "up"),
    },
    {
      id: "h-sci", name: "Greenhouse Path", at: [0, 0],
      rows: [
        "####################",
        "#..t..WWWWWWWW..t..#",
        "#.....WWWWWWWW.....#",
        "#..f..WWWPPWWW..f..#",
        "#.........==.......#",
        "#..N......=========#",
        "#.........=========#",
        "#..t......==....t..#",
        "#.........==.......#",
        "#.f.......==...f...#",
        "#.........==.......#",
        "####################",
      ],
      signs: ["SCIENCE WING. Professor Petri studies everything inside. Bring your curiosity!"],
      warp: P("science", "s1", 9, 10, "up"),
    },
    {
      id: "h-steps", name: "Library Steps", at: [1, 0],
      rows: [
        "####################",
        "#WWWWWWWWWWWWWWWWWW#",
        "#WWWWWWWWWWWWWWWWWW#",
        "#WWWWWWWWPPWWWWWWWW#",
        "#Y.......==.......Y#",
        "#==================#",
        "#==================#",
        "#..f.....==.....f..#",
        "#..t..N..==.....t..#",
        "#........==........#",
        "#.f......==......f.#",
        "####################",
      ],
      signs: ["THE READING ROOM. Four book-shaped holes are carved in its door. Restore all four wings to open it."],
      warp: P("reading", "rr", 9, 10, "up"),
      sealed: true,
    },
    {
      id: "h-story", name: "Story Garden", at: [2, 0],
      rows: [
        "####################",
        "#..t..WWWWWWWW..t..#",
        "#.....WWWWWWWW.....#",
        "#..f..WWWPPWWW..f..#",
        "#.........==.......#",
        "#=========.....N...#",
        "#=========.........#",
        "#..t......==....t..#",
        "#.........==.......#",
        "#.f.......==...f...#",
        "#.........==.......#",
        "####################",
      ],
      signs: ["STORY WING. Inkwhisker the paper cat curls up with the Story Book inside."],
      warp: P("story", "e1", 9, 10, "up"),
    },
    {
      id: "h-hist", name: "Old Map Market", at: [2, 1],
      rows: [
        "####################",
        "#.t...t....WWWWWWWW#",
        "#..........WWWWWWWW#",
        "#..f.......WWWPPWWW#",
        "#.............==...#",
        "#===============...#",
        "#===============.N.#",
        "#..t.......f.....t.#",
        "#..................#",
        "#.f...t.....t...f..#",
        "#.....E............#",
        "####################",
      ],
      signs: ["HISTORY & MAPS WING. Kitewing the map dragon guards the History & Maps Book."],
      warp: P("history", "g1", 9, 10, "up"),
    },
  ],
  doors: [
    { id: "hub-sq-math", a: "h-square", b: "h-math", kind: "open" },
    { id: "hub-sq-hist", a: "h-square", b: "h-hist", kind: "open" },
    { id: "hub-sq-steps", a: "h-square", b: "h-steps", kind: "open" },
    { id: "hub-math-sci", a: "h-math", b: "h-sci", kind: "open" },
    { id: "hub-sci-steps", a: "h-sci", b: "h-steps", kind: "open" },
    { id: "hub-steps-story", a: "h-steps", b: "h-story", kind: "open" },
    { id: "hub-story-hist", a: "h-story", b: "h-hist", kind: "open" },
  ],
};

/** Where you stand in town after leaving a wing (just in front of its gate). */
export const GATE_FRONT: Record<WingId | "reading", Place> = {
  math: P("hub", "h-math", 4, 4, "down"),
  science: P("hub", "h-sci", 9, 4, "down"),
  story: P("hub", "h-story", 9, 4, "down"),
  history: P("hub", "h-hist", 14, 4, "down"),
  reading: P("hub", "h-steps", 9, 4, "down"),
};

/* Shared room shapes */
const ENTRANCE = (sign: string): string[] => [
  "####################",
  "#Y................Y#",
  "#..................#",
  sign,
  "#..................#",
  "#..................#",
  "#..................#",
  "#.......,,,,.......#",
  "#.......,,,,.......#",
  "#.......,,,,.......#",
  "#.......,,,,.......#",
  "####################",
];
const GUARDIAN_HALL = [
  "####################",
  "#Y................Y#",
  "#..................#",
  "#........GG........#",
  "#........GG........#",
  "#..................#",
  "#.....,,,,,,,,.....#",
  "#.....,,,,,,,,.....#",
  "#..................#",
  "#Y................Y#",
  "#..................#",
  "####################",
];

/* ------------------------------------------------------------------------------ math wing */

const MATH: AreaDef = {
  id: "math", name: "Math Wing", short: "MATH WING", subject: "math", item: "boomerang", guardian: "tallyshell",
  start: P("math", "m1", 9, 10, "up"),
  rooms: [
    {
      id: "m1", name: "Counting Hall", at: [0, 2],
      rows: ENTRANCE("#...N..............#"),
      signs: ["MATH WING. The east door leads on. Push book crates onto switches, light cold torches with your lantern (X), and tidy ink sprites with your feather duster (Z)."],
      exit: { side: "down", to: GATE_FRONT.math },
    },
    {
      id: "m2", name: "Crate Corner", at: [1, 2],
      rows: [
        "####################",
        "#......#....#......#",
        "#.S....#....#....S.#",
        "#......#....#......#",
        "#...B..........B...#",
        "#..................#",
        "#..................#",
        "#..^...........^...#",
        "#.........k........#",
        "#..................#",
        "#..................#",
        "####################",
      ],
      puzzle: { kind: "blocks" },
      signs: [],
    },
    {
      id: "m4", name: "Map Room", at: [1, 1],
      rows: [
        "####################",
        "#Y................Y#",
        "#..................#",
        "#....,,,,,,,,,,....#",
        "#....,...M....,....#",
        "#....,........,....#",
        "#....,..E.....,....#",
        "#....,,,,,,,,,,....#",
        "#..E...........E...#",
        "#..................#",
        "#..................#",
        "####################",
      ],
    },
    {
      id: "m3", name: "Lantern Study", at: [0, 1],
      rows: [
        "####################",
        "#..................#",
        "#...T........T.....#",
        "#..................#",
        "#.....,,,,,,,,.....#",
        "#.....,......,.....#",
        "#.....,..c...,.....#",
        "#.....,......,.....#",
        "#.....,,,,,,,,.....#",
        "#..N...............#",
        "#..................#",
        "####################",
      ],
      puzzle: { kind: "torches" },
      chest: "item",
      signs: ["Two cold torches. Face one and press X to light it with your lantern. Light both!"],
    },
    {
      id: "m5", name: "Crystal Gallery", at: [0, 0],
      rows: [
        "####################",
        "#..................#",
        "#........R.........#",
        "#__________________#",
        "#__________________#",
        "#..................#",
        "#..................#",
        "#...E..........E...#",
        "#..................#",
        "#..N...............#",
        "#..................#",
        "####################",
      ],
      puzzle: { kind: "crystal", opens: ["m5-m6"] },
      signs: ["A crystal switch sits past the gap. Something that flies out and comes back could reach it..."],
    },
    { id: "m6", name: "Tallyshell's Hall", at: [1, 0], rows: GUARDIAN_HALL },
    {
      id: "m7", name: "Abacus Vault", at: [2, 1],
      rows: [
        "####################",
        "#______............#",
        "#__R___............#",
        "#______............#",
        "#______....E.......#",
        "#..................#",
        "#..................#",
        "#..................#",
        "#.............c....#",
        "#..^...............#",
        "#..................#",
        "####################",
      ],
      puzzle: { kind: "crystal" },
      chest: "book",
    },
  ],
  doors: [
    { id: "m1-m2", a: "m1", b: "m2", kind: "open" },
    { id: "m2-m4", a: "m2", b: "m4", kind: "question" },
    { id: "m4-m3", a: "m4", b: "m3", kind: "locked" },
    { id: "m3-m5", a: "m3", b: "m5", kind: "open" },
    { id: "m5-m6", a: "m5", b: "m6", kind: "shutter" },
    { id: "m4-m7", a: "m4", b: "m7", kind: "open" },
  ],
};

/* --------------------------------------------------------------------------- science wing */

const SCIENCE: AreaDef = {
  id: "science", name: "Science Wing", short: "SCIENCE WING", subject: "science", item: "quill", guardian: "petri",
  start: P("science", "s1", 9, 10, "up"),
  rooms: [
    {
      id: "s1", name: "Specimen Hall", at: [1, 2],
      rows: ENTRANCE("#...N..............#"),
      signs: ["SCIENCE WING. A Question Door blocks the north. Answer it right to open it. A wrong answer just gets you another question!"],
      exit: { side: "down", to: GATE_FRONT.science },
    },
    {
      id: "s2", name: "Lantern Lab", at: [2, 2],
      rows: [
        "####################",
        "#..T.....T.....T...#",
        "#..................#",
        "#..................#",
        "#....###....###....#",
        "#....#........#....#",
        "#....#...m....#....#",
        "#....#........#....#",
        "#....###....###....#",
        "#..^...........^...#",
        "#..................#",
        "####################",
      ],
      puzzle: { kind: "torches" },
    },
    {
      id: "s3", name: "Quill Room", at: [1, 1],
      rows: [
        "####################",
        "#..................#",
        "#..................#",
        "#.....,,,,,,,,.....#",
        "#.....,......,.....#",
        "#.....,..C...,.....#",
        "#.....,......,.....#",
        "#.....,,,,,,,,.....#",
        "#..E...........E...#",
        "#..................#",
        "#..................#",
        "####################",
      ],
      chest: "item",
    },
    {
      id: "s4", name: "Fern Lab", at: [0, 1],
      rows: [
        "####################",
        "#..................#",
        "#.###.......###....#",
        "#.#S#.......#S#....#",
        "#..................#",
        "#..................#",
        "#..B...............#",
        "#...........B......#",
        "#......k...........#",
        "#..................#",
        "#.........E........#",
        "####################",
      ],
      puzzle: { kind: "blocks" },
    },
    {
      id: "s5", name: "Chasm Walk", at: [1, 0],
      rows: [
        "####################",
        "#..___.............#",
        "#..___.............#",
        "#o.___.............#",
        "#..___.............#",
        "#..___......E......#",
        "#..___.............#",
        "#..___.............#",
        "#..___.o...........#",
        "#..___.....N.......#",
        "#..___.............#",
        "####################",
      ],
      signs: ["A deep chasm! See the brass hook post on the far side? A Grappling Quill could pull you across."],
    },
    { id: "s6", name: "Petri's Lab", at: [0, 0], rows: GUARDIAN_HALL },
    {
      id: "s7", name: "Star Dome", at: [2, 1],
      rows: [
        "####################",
        "#.........___......#",
        "#.........___.o....#",
        "#.........___......#",
        "#.........___......#",
        "#.........___...C..#",
        "#.........___......#",
        "#.........___......#",
        "#.......o.___......#",
        "#.........___......#",
        "#.........___......#",
        "####################",
      ],
      chest: "book",
    },
  ],
  doors: [
    { id: "s1-s2", a: "s1", b: "s2", kind: "open" },
    { id: "s1-s3", a: "s1", b: "s3", kind: "question" },
    { id: "s3-s4", a: "s3", b: "s4", kind: "open" },
    { id: "s3-s5", a: "s3", b: "s5", kind: "open" },
    { id: "s5-s6", a: "s5", b: "s6", kind: "locked" },
    { id: "s3-s7", a: "s3", b: "s7", kind: "open" },
  ],
};

/* ----------------------------------------------------------------------------- story wing */

const STORY: AreaDef = {
  id: "story", name: "Story Wing", short: "STORY WING", subject: "ela", item: "magnifier", guardian: "inkwhisker",
  start: P("story", "e1", 9, 10, "up"),
  rooms: [
    {
      id: "e1", name: "Story Hall", at: [1, 2],
      rows: ENTRANCE("#...N..............#"),
      signs: ["STORY WING. Every good story has a beginning, a middle and an end. Yours begins here!"],
      exit: { side: "down", to: GATE_FRONT.story },
    },
    {
      id: "e2", name: "Crate Chapter", at: [0, 2],
      rows: [
        "####################",
        "#..................#",
        "#..S............S..#",
        "#..................#",
        "#.....########.....#",
        "#..................#",
        "#.....B......B.....#",
        "#..................#",
        "#.........k........#",
        "#..^............^..#",
        "#..................#",
        "####################",
      ],
      puzzle: { kind: "blocks" },
    },
    {
      id: "e3", name: "Reading Nook", at: [1, 1],
      rows: [
        "####################",
        "#..................#",
        "#..N...............#",
        "#.....,,,,,,,,.....#",
        "#.....,......,.....#",
        "#.....,..C...,.....#",
        "#.....,......,.....#",
        "#.....,,,,,,,,.....#",
        "#...E..............#",
        "#..................#",
        "#..................#",
        "####################",
      ],
      chest: "item",
      signs: ["Shh! A reading nook. Somebody left a Magnifier in the chest."],
    },
    {
      id: "e4", name: "Map Shelf", at: [2, 1],
      rows: [
        "####################",
        "#..................#",
        "#..T...........T...#",
        "#..................#",
        "#.......,,,,.......#",
        "#.......,m.,.......#",
        "#.......,,,,.......#",
        "#..E...........E...#",
        "#..................#",
        "#....^......^......#",
        "#..................#",
        "####################",
      ],
      puzzle: { kind: "torches" },
    },
    {
      id: "e5", name: "Ink Bridge", at: [2, 0],
      rows: [
        "####################",
        "#..____............#",
        "#..____............#",
        "#..____............#",
        "#..____............#",
        "#..iiii............#",
        "#..____....E.......#",
        "#..____............#",
        "#..____......N.....#",
        "#..____............#",
        "#..____............#",
        "####################",
      ],
      signs: ["Legend says a bridge was written here in invisible ink. Only a Magnifier could read it."],
    },
    { id: "e6", name: "Inkwhisker's Den", at: [1, 0], rows: GUARDIAN_HALL },
    {
      id: "e7", name: "Poetry Corner", at: [0, 0],
      rows: [
        "####################",
        "#..................#",
        "#..N.......N.......#",
        "#..................#",
        "#.....,,,,,,,,.....#",
        "#.....,......,.....#",
        "#.....,..c...,.....#",
        "#.....,,,,,,,,.....#",
        "#..................#",
        "#...E..............#",
        "#..................#",
        "####################",
      ],
      puzzle: { kind: "secret" },
      chest: "book",
      signs: [
        "A poem: \"Shelves of stories, row on row, / every book a place to go.\"",
        "This page looks blank. Maybe the words are too faint to see?",
      ],
      secret: "Invisible ink! It says: \"The poet hid a book in the middle of the rug.\"",
    },
  ],
  doors: [
    { id: "e1-e2", a: "e1", b: "e2", kind: "open" },
    { id: "e1-e3", a: "e1", b: "e3", kind: "question" },
    { id: "e3-e4", a: "e3", b: "e4", kind: "open" },
    { id: "e4-e5", a: "e4", b: "e5", kind: "open" },
    { id: "e5-e6", a: "e5", b: "e6", kind: "locked" },
    { id: "e6-e7", a: "e6", b: "e7", kind: "open" },
  ],
};

/* --------------------------------------------------------------------------- history wing */

const HISTORY: AreaDef = {
  id: "history", name: "History & Maps Wing", short: "HISTORY WING", subject: "social", item: "bell", guardian: "kitewing",
  start: P("history", "g1", 9, 10, "up"),
  rooms: [
    {
      id: "g1", name: "Timeline Hall", at: [1, 2],
      rows: ENTRANCE("#...N..............#"),
      signs: ["HISTORY & MAPS WING. Old walls keep old secrets. Listen closely and you might hear a hidden door."],
      exit: { side: "down", to: GATE_FRONT.history },
    },
    {
      id: "g3", name: "Bell Tower", at: [1, 1],
      rows: [
        "####################",
        "#..................#",
        "#..T...........T...#",
        "#..................#",
        "#.....,,,,,,,,.....#",
        "#.....,......,.....#",
        "#.....,..c...,.....#",
        "#.....,,,,,,,,.....#",
        "#..N...............#",
        "#..................#",
        "#..................#",
        "####################",
      ],
      puzzle: { kind: "torches" },
      chest: "item",
      signs: ["The bell tower is dark and cold. Light the torches and see what appears. Some of these shelves look cracked..."],
    },
    {
      id: "g4", name: "Compass Court", at: [2, 1],
      rows: [
        "####################",
        "#..................#",
        "#........S.........#",
        "#..................#",
        "#..#.....B.....#...#",
        "#..................#",
        "#..................#",
        "#..#........B..#...#",
        "#..................#",
        "#.....k..S.........#",
        "#..................#",
        "####################",
      ],
      puzzle: { kind: "blocks" },
    },
    {
      id: "g5", name: "Echo Hall", at: [1, 0],
      rows: [
        "####################",
        "#..................#",
        "#..M...............#",
        "#..................#",
        "#...^....E....^....#",
        "#..................#",
        "#..................#",
        "#.....,,,,,,,,.....#",
        "#.....,,,,,,,,.....#",
        "#..N...............#",
        "#..................#",
        "####################",
      ],
      signs: ["ECHO HALL. Kitewing's door is to the west. It is locked tight; you'll need a small key."],
    },
    { id: "g6", name: "Kitewing's Roost", at: [0, 0], rows: GUARDIAN_HALL },
    {
      id: "g7", name: "Globe Room", at: [0, 1],
      rows: [
        "####################",
        "#..................#",
        "#...O.........O....#",
        "#..................#",
        "#.......,,,,.......#",
        "#.......,C.,.......#",
        "#.......,,,,.......#",
        "#..E...............#",
        "#..................#",
        "#..N...............#",
        "#..................#",
        "####################",
      ],
      chest: "book",
      signs: ["A secret room full of globes! Nobody has dusted in here for a hundred years."],
    },
  ],
  doors: [
    { id: "g1-g3", a: "g1", b: "g3", kind: "question" },
    { id: "g3-g4", a: "g3", b: "g4", kind: "open" },
    { id: "g3-g5", a: "g3", b: "g5", kind: "hidden" },
    { id: "g3-g7", a: "g3", b: "g7", kind: "hidden" },
    { id: "g5-g6", a: "g5", b: "g6", kind: "locked" },
  ],
};

/* --------------------------------------------------------------------------- reading room */

const READING: AreaDef = {
  id: "reading", name: "The Reading Room", short: "READING ROOM", subject: null, item: null, guardian: "smudge",
  start: P("reading", "rr", 9, 10, "up"),
  rooms: [
    {
      id: "rr", name: "The Reading Room", at: [0, 0],
      rows: [
        "####################",
        "#Y......,,,,......Y#",
        "#.......,,,,.......#",
        "#........GG........#",
        "#........GG........#",
        "#.......,,,,.......#",
        "#...F...,,,,.......#",
        "#.......,,,,.......#",
        "#.......,,,,.......#",
        "#Y......,,,,......Y#",
        "#.......,,,,.......#",
        "####################",
      ],
      exit: { side: "down", to: GATE_FRONT.reading },
    },
  ],
  doors: [],
};

export const AREAS: Record<AreaId, AreaDef> = { hub: HUB, math: MATH, science: SCIENCE, story: STORY, history: HISTORY, reading: READING };
export const AREA_IDS = Object.keys(AREAS) as AreaId[];

/** Each wing's guardian and its room. */
export const GUARDIAN_ROOM: Record<GuardianId, string> = { tallyshell: "m6", petri: "s6", inkwhisker: "e6", kitewing: "g6", smudge: "rr" };

const ROOM_INDEX = new Map<string, { area: AreaDef; room: RoomDef }>();
for (const area of Object.values(AREAS)) for (const room of area.rooms) ROOM_INDEX.set(room.id, { area, room });

export function roomById(id: string): RoomDef {
  const r = ROOM_INDEX.get(id);
  if (!r) throw new Error(`no room ${id}`);
  return r.room;
}
export function areaOfRoom(id: string): AreaDef {
  const r = ROOM_INDEX.get(id);
  if (!r) throw new Error(`no room ${id}`);
  return r.area;
}
export function allRooms(): RoomDef[] {
  return [...ROOM_INDEX.values()].map((r) => r.room);
}

/** The side of room `from` that faces its grid neighbour `to` (null if they don't touch). */
export function sideToward(from: RoomDef, to: RoomDef): Dir | null {
  const dx = to.at[0] - from.at[0];
  const dy = to.at[1] - from.at[1];
  if (dx === 1 && dy === 0) return "right";
  if (dx === -1 && dy === 0) return "left";
  if (dx === 0 && dy === 1) return "down";
  if (dx === 0 && dy === -1) return "up";
  return null;
}

/** The two border tiles of a side's door gap. */
export function gapTiles(side: Dir): [number, number][] {
  switch (side) {
    case "up": return [[9, 0], [10, 0]];
    case "down": return [[9, ROWS - 1], [10, ROWS - 1]];
    case "left": return [[0, 5], [0, 6]];
    case "right": return [[COLS - 1, 5], [COLS - 1, 6]];
  }
}

export interface RoomDoor {
  door: DoorDef;
  side: Dir;
  /** The room on the other side. */
  other: string;
}

const DOORS_OF = new Map<string, RoomDoor[]>();
for (const area of Object.values(AREAS)) {
  for (const d of area.doors) {
    const a = roomById(d.a);
    const b = roomById(d.b);
    const sa = sideToward(a, b);
    const sb = sideToward(b, a);
    if (!sa || !sb) continue; // check-rules reports it
    DOORS_OF.set(d.a, [...(DOORS_OF.get(d.a) ?? []), { door: d, side: sa, other: d.b }]);
    DOORS_OF.set(d.b, [...(DOORS_OF.get(d.b) ?? []), { door: d, side: sb, other: d.a }]);
  }
}

export function doorsOf(roomId: string): RoomDoor[] {
  return DOORS_OF.get(roomId) ?? [];
}

export function doorById(id: string): DoorDef | undefined {
  for (const a of Object.values(AREAS)) for (const d of a.doors) if (d.id === id) return d;
  return undefined;
}

/** The book each wing's guardian gives back, the bonus book hidden in each wing, and the final one. */
export type BookId = "math" | "science" | "story" | "history" | "math-bonus" | "science-bonus" | "story-bonus" | "history-bonus" | "reading";
export const WING_BONUS_ROOM: Record<WingId, string> = { math: "m7", science: "s7", story: "e7", history: "g7" };
