/*
 * Quest 1, Quest of the Lost Library: the world map (the original quest, unchanged).
 *
 * The tile legend and the room rules are in quest.ts. Pure data + tiny helpers (no DOM), so
 * scripts/check-rules.ts can load it under tsx.
 */
import { BONUS_BOOK, BOOKS, WING_BOOK } from "./books";
import {
  ENTRANCE, GUARDIAN_HALL, P, worldOf,
  type AreaDef, type DoorDef, type GuardianDef, type ItemDef, type Pal, type Place, type QuestDef, type RoomDef, type RoomDoor,
} from "./quest";

export { COLS, ROWS, DIRS, DELTA, OPPOSITE, gapTiles, sideToward } from "./quest";
export type { Dir, DoorKind, PuzzleKind, DoorDef, Place, RoomDef, AreaDef, GuardianDef, RoomDoor } from "./quest";

export type WingId = "math" | "science" | "story" | "history";
export type AreaId = "hub" | WingId | "reading";
export type ItemId = "boomerang" | "quill" | "magnifier" | "bell";
export type GuardianId = "tallyshell" | "petri" | "inkwhisker" | "kitewing" | "smudge";
/** The book each wing's guardian gives back, the bonus book hidden in each wing, and the final one. */
export type BookId = "math" | "science" | "story" | "history" | "math-bonus" | "science-bonus" | "story-bonus" | "history-bonus" | "reading";

export const WINGS: WingId[] = ["math", "science", "story", "history"];

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

export const ITEMS: Record<ItemId, ItemDef> = {
  boomerang: { id: "boomerang", name: "Bookmark Boomerang", short: "BOOMERANG", wing: "math", power: "boomerang", color: "#e3262f", how: "Press X to throw it. It flies over gaps, hits crystal switches and tidies ink sprites, then comes back." },
  quill: { id: "quill", name: "Grappling Quill", short: "QUILL", wing: "science", power: "grapple", color: "#f2f4ff", how: "Face a brass hook post across a gap and press X. The quill hooks on and pulls you over." },
  magnifier: { id: "magnifier", name: "Magnifier", short: "MAGNIFIER", wing: "story", power: "reveal", color: "#b05cff", how: "Press X to look closely. It shows invisible-ink bridges and secret writing in the room." },
  bell: { id: "bell", name: "Echo Bell", short: "ECHO BELL", wing: "history", power: "echo", color: "#6ea0ff", how: "Press X to ring it. Its echo finds hidden doors behind cracked shelves." },
};

const PAL: Record<AreaId, Pal> = {
  hub: { floorA: "#3f8f3a", floorB: "#3a8636", rug: "#c9a66b", rugEdge: "#a8854f", shelf: "#1f5a2a", shelfDark: "#143d1c", accent: "#ffd23f", building: "#8a7a6a", buildingDark: "#5c4f44" },
  math: { floorA: "#6b3a2a", floorB: "#5e3224", rug: "#a3242c", rugEdge: "#ffd23f", shelf: "#5a2a1a", shelfDark: "#341509", accent: "#e3262f", building: "#a3242c", buildingDark: "#6a141a" },
  science: { floorA: "#2e5a4a", floorB: "#2a5244", rug: "#1f8f55", rugEdge: "#8affc1", shelf: "#23402f", shelfDark: "#132619", accent: "#2fbf71", building: "#1f8f55", buildingDark: "#0f5532" },
  story: { floorA: "#4a2f63", floorB: "#43295a", rug: "#7a3aa8", rugEdge: "#ff8ad8", shelf: "#3a1f4f", shelfDark: "#1f0f2c", accent: "#b05cff", building: "#7a3aa8", buildingDark: "#4a1f6a" },
  history: { floorA: "#6a5232", floorB: "#614a2c", rug: "#2456e8", rugEdge: "#ffd23f", shelf: "#3a2a1a", shelfDark: "#21170c", accent: "#6ea0ff", building: "#2456e8", buildingDark: "#14348c" },
  reading: { floorA: "#6b4a2a", floorB: "#634426", rug: "#b8862a", rugEdge: "#ffe9a0", shelf: "#4a3410", shelfDark: "#2a1d08", accent: "#ffd23f", building: "#b8862a", buildingDark: "#7a5612" },
};
const look = (a: AreaId): AreaDef["look"] => (a === "hub" ? { wall: "hedge", floor: "grass", pal: PAL.hub } : { wall: "shelf", floor: "boards", pal: PAL[a] });

/* ------------------------------------------------------------------------------------ hub */

const HUB: AreaDef = {
  id: "hub", look: look("hub"), name: "Bramblebury Town", short: "TOWN", subject: null, item: null, guardian: null,
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

/* ------------------------------------------------------------------------------ math wing */

const MATH: AreaDef = {
  id: "math", look: look("math"), name: "Math Wing", short: "MATH WING", subject: "math", item: "boomerang", guardian: "tallyshell",
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
  id: "science", look: look("science"), name: "Science Wing", short: "SCIENCE WING", subject: "science", item: "quill", guardian: "petri",
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
  id: "story", look: look("story"), name: "Story Wing", short: "STORY WING", subject: "ela", item: "magnifier", guardian: "inkwhisker",
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
  id: "history", look: look("history"), name: "History & Maps Wing", short: "HISTORY WING", subject: "social", item: "bell", guardian: "kitewing",
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
  id: "reading", look: look("reading"), name: "The Reading Room", short: "READING ROOM", subject: null, item: null, guardian: "smudge",
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
export const WING_BONUS_ROOM: Record<WingId, string> = { math: "m7", science: "s7", story: "e7", history: "g7" };

export const LIBRARY: QuestDef = {
  id: "library",
  title: "The Lost Library",
  tagline: "Restore the four wings of the Grand Lantern Library.",
  story: "The Ink Smudge has knocked every book off the shelves of the Grand Lantern Library! Restore the four wings and find the lost books.",
  saveKey: "arcade.lost-library.save.v1",
  theme: "library",
  hub: "hub",
  final: "reading",
  wings: WINGS,
  areas: AREAS,
  guardians: GUARDIANS,
  items: ITEMS,
  gateFront: GATE_FRONT,
  books: BOOKS,
  wingBook: WING_BOOK,
  bonusBook: BONUS_BOOK,
  finalBook: "reading",
  bonusRoom: WING_BONUS_ROOM,
  pests: { hub: "bunny", wing: "sprite", name: "ink sprite" },
  music: { hub: "town", wings: { math: "math", science: "science", story: "story", history: "history" }, final: "readingRoom" },
  gateColor: {
    "h-math": ["#a3242c", "#6a141a"],
    "h-sci": ["#1f8f55", "#0f5532"],
    "h-story": ["#7a3aa8", "#4a1f6a"],
    "h-hist": ["#2456e8", "#14348c"],
    "h-steps": ["#b0a090", "#7a6a5a"],
  },
  terms: { wing: "wing", wings: "wings", treasure: "book", treasures: "books", shelf: "YOUR BOOKSHELF", found: "A LOST BOOK IS FOUND!", pests: "ink sprites" },
  helper: {
    name: "MADAME FOLIO",
    first: "Pip! Thank goodness. The Ink Smudge knocked every book off our shelves. Each wing's guardian is keeping one safe. Visit the four wings and bring the books home. I filled your hearts!",
    progress: (left) => `Wonderful work! Still to restore: ${left}. I filled your hearts!`,
    all: "All four wings are restored! The Reading Room door on the Library Steps is open. Go north!",
    done: "You found the lost library, Pip! Every book is home. Come back anytime to read.",
    wingNames: { math: "Math (west)", science: "Science (north-west)", story: "Story (north-east)", history: "History & Maps (east)" },
  },
  texts: {
    intro: [
      { title: "MADAME FOLIO", text: "Pip Lampwick! Thank goodness you're here. The Ink Smudge knocked every book off the shelves of the Grand Lantern Library, and ink sprites are everywhere! Each of our four wings has a guardian keeping its book safe." },
    ],
    howTo: "Arrow keys walk. Z swings your feather duster to tidy ink sprites. X uses your item (your lantern lights cold torches). Enter reads signs and talks. Esc shows the map. Answer questions with 1-4 or A-D.",
    faint: "Whoops, too much ink! Madame Folio's tidy-up spell carried you back to the entrance. You kept every key, item and book.",
    sealed: (n, total) => `The Reading Room door has four book-shaped holes. Restore all four wings to open it. (${n} of ${total} restored)`,
    thanks: "Thank you for caring for the library!",
    finalThanks: "Splotch! Thanks for reading with me.",
    crack: "This shelf has a big crack in it. It sounds hollow...",
    decor: "A dusty old globe. It still spins!",
    endingTitle: "THE LOST LIBRARY IS FOUND!",
    endingText: "restored all four wings and the Reading Room.",
    carries: "carries a feather duster and a lantern",
    hubName: "the town",
    finalName: "the Reading Room",
  },
};

const W1 = worldOf(LIBRARY);
export function roomById(id: string): RoomDef {
  return W1.room(id);
}
export function areaOfRoom(id: string): AreaDef {
  return W1.areaOf(id);
}
export function allRooms(): RoomDef[] {
  return W1.allRooms();
}
export function doorsOf(roomId: string): RoomDoor[] {
  return W1.doorsOf(roomId);
}
export function doorById(id: string): DoorDef | undefined {
  return W1.doorById(id);
}
