/*
 * The lesson path. Each lesson adds a few keys; everything it asks you to type only uses keys
 * learned so far (checked by scripts/check-rules.ts). Content is picked by grade band:
 * K–1 single keys, 2–3 drills + short words, 4–5 words, 6–8 words + short phrases, 9–12 phrases.
 */
import type { Grade } from "@/kit/types";
import { gradeNumber } from "@/kit/grades";
import {
  ALPHABET, QUOTES, SENTENCES_23, SENTENCES_45, SENTENCES_68, SENTENCES_912, SENTENCES_K1, TINY_WORDS, bandOf, freePool,
  type Band, type Item,
} from "./words";

export interface Lesson {
  id: string;
  name: string;
  /** Keys this lesson adds, shown on the lesson card. */
  newKeys: string;
  /** K–1: single keys to type (new keys are picked twice as often). */
  singles: string[];
  /** Fixed drill patterns (never random letters, so no accidental words). */
  drills: string[];
  /** Real words that only use this lesson's keys. */
  words: string[];
  /** Hand-written items per band; when present they replace drills/words for that band. */
  byBand?: Partial<Record<Band, string[]>>;
  /** Grades 6–12 also get phrases made of 2–4 lesson words (letter lessons only). */
  phrases?: boolean;
}

const lower = (s: string) => s.split("");

export const LESSONS: Lesson[] = [
  {
    id: "home",
    name: "Home row",
    newKeys: "asdf jkl;",
    singles: lower("asdfjkl;"),
    drills: ["asdf", "jkl;", "fdsa", ";lkj", "fj", "dk", "sl", "a;", "ff jj", "dd kk", "ss ll", "aa ;;", "fjfj", "dkdk", "a;sl", "jf kd"],
    words: [
      "add", "ads", "all", "ask", "asks", "dad", "dads", "fad", "fall", "falls", "flask", "lad", "lads", "sad", "salad",
      "salads", "alas", "alfalfa", "adds", "flasks",
    ],
    phrases: true,
  },
  {
    id: "ei",
    name: "Home row + E I",
    newKeys: "e i",
    singles: lower("ei"),
    drills: ["ded", "kik", "fef", "jij", "eel", "did", "sea", "ie ei", "de ki", "lid;", "ease", "aid;"],
    words: [
      "see", "seed", "seek", "feel", "feed", "lake", "lakes", "like", "likes", "side", "sides", "slide", "idea", "ideas",
      "ideal", "field", "fields", "desk", "desks", "kid", "kids", "lid", "sail", "sails", "said", "safe", "life", "file",
      "files", "aside", "else", "sled", "leaf", "sea", "seal", "seals", "easel", "kale", "skies", "ski", "skis", "deal",
      "sale", "dial", "disk", "fiddle", "eel", "eels", "ladle", "lilies", "salsa",
    ],
    phrases: true,
  },
  {
    id: "reach",
    name: "R T Y U + G H",
    newKeys: "r t y u g h",
    singles: lower("rtyugh"),
    drills: ["frf", "juj", "ftf", "jyj", "fgf", "jhj", "rt yu", "gh hg", "tr uy", "rug", "hut", "gut"],
    words: [
      "start", "star", "stars", "tree", "true", "rule", "rules", "trust", "study", "yard", "year", "ready", "turtle",
      "after", "there", "they", "their", "that", "the", "this", "right", "light", "high", "guide", "huge", "hug", "hugs",
      "gift", "gifts", "great", "greet", "heart", "earth", "rush", "sugar", "fruit", "grade", "shirt", "teeth",
      "tiger", "kite", "kites", "shark", "starfish", "daisy", "lady", "tray", "giraffe", "jaguar", "turkey", "ladder",
      "guitar", "giggle", "thirty", "eighty", "sky", "father", "sister", "gather", "delight",
    ],
    phrases: true,
  },
  {
    id: "top",
    name: "Top row: Q W O P",
    newKeys: "q w o p",
    singles: lower("qwop"),
    drills: ["aqa", "sws", "lol", ";p;", "qw op", "po wq", "wow", "pop", "top", "row", "quo", "owl"],
    words: [
      "quiet", "quest", "quilt", "water", "wood", "world", "work", "word", "words", "power", "poet", "people",
      "paper", "purple", "pool", "proud", "photo", "polite", "rope", "slow", "flow", "flower", "follow", "tower", "tooth",
      "story", "forest", "wolf", "owl", "otter", "pilot", "pirate", "oyster", "pepper", "potato", "spool", "sport", "swift",
      "whale", "wheel", "wire", "yellow", "tiptoe", "teapot", "sloth", "squid", "squirrel", "quote", "quarter", "equal",
      "opposite", "report", "airport", "hippo", "puppet", "purpose",
    ],
    phrases: true,
  },
  {
    id: "bottom",
    name: "Bottom row: Z X C V B N M",
    newKeys: "z x c v b n m , . /",
    singles: [...lower("zxcvbnm"), ",", "."],
    drills: ["aza", "sxs", "dcd", "fvf", "fbf", "jnj", "jmj", "k,k", "l.l", ";/;", "zx cv", "bn m,", "m, n."],
    words: [
      "zebra", "zoom", "zigzag", "box", "fox", "six", "taxi", "next", "extra", "cave", "van", "vine", "brave", "bubble",
      "bench", "comet", "comets", "moon", "moons", "many", "name", "number", "computer", "keyboard", "rainbow", "cabin",
      "banana", "mix", "maze", "zero", "zone", "jazz", "pizza", "cozy", "lizard", "dozen", "exam", "oxygen", "vacuum",
      "cinnamon", "volcano", "galaxy", "blizzard", "crown", "camel", "and/or", "yes/no", "on/off", "up/down",
    ],
    byBand: {
      "68": ["moon, stars, sun.", "zebra, camel, fox.", "a cozy cabin.", "next, mix it.", "yes/no", "and/or", "comets zoom by."],
      "912": [
        "moons, comets and stars.", "a zebra, a camel, a fox.", "the volcano woke up.", "mix, then bake.",
        "zoom past the galaxy.", "a blizzard came in.", "and/or", "on/off",
      ],
    },
    phrases: true,
  },
  {
    id: "shift",
    name: "Shift + capitals",
    newKeys: "Shift A–Z",
    singles: ALPHABET.map((c) => c.toUpperCase()),
    drills: ["Aa", "Ss", "Dd", "Ff", "Jj", "Kk", "Ll", "Qq", "Pp", "Zz"],
    words: [],
    byBand: {
      k1: ALPHABET.map((c) => c.toUpperCase()),
      "23": [
        "Ada", "Ben", "Cam", "Eli", "Fay", "Gus", "Hope", "Ivy", "Jo", "Kai", "Leo", "Max", "Nia", "Omar", "Pat", "Rex",
        "Sam", "Tia", "Uma", "Val", "Wes", "Yuki", "Zoe", "Ohio", "Utah", "Iowa", "May", "June", "July", "I", "OK",
      ],
      "45": [
        "Raleigh", "Durham", "Boone", "Wilson", "Cary", "Apex", "Texas", "Maine", "Paris", "Tokyo", "Cairo", "Lima", "Rome",
        "March", "April", "Monday", "Friday", "Xavier", "Quinn", "Zara", "NASA", "USA",
      ],
      "68": [
        "Raleigh, NC", "Lake Norman", "Blue Ridge", "Cape Hatteras", "Outer Banks", "New York", "Mount Mitchell",
        "Pacific Ocean", "Ask Ms. Diaz.", "Zara and Quinn", "Monday, May", "NASA and ESA",
      ],
      "912": [
        "The Blue Ridge Parkway", "Cape Hatteras Lighthouse", "Raleigh is in Wake County.", "Mount Mitchell is tall.",
        "The Wright brothers flew at Kitty Hawk.", "Ask Dr. Patel about Mars.", "The Outer Banks, North Carolina",
        "The Pacific Ocean is vast.",
      ],
    },
  },
  {
    id: "numbers",
    name: "Numbers row",
    newKeys: "1 2 3 4 5 6 7 8 9 0",
    singles: lower("1234567890"),
    drills: ["1 2 3", "4 5 6", "7 8 9", "10", "20", "30", "50", "99", "123", "789", "1 0"],
    words: [],
    byBand: {
      k1: lower("1234567890"),
      "23": ["12", "7 cats", "3 dogs", "10 kids", "Bus 42", "Room 9", "5 frogs", "2 suns", "100", "8 legs", "6 eggs"],
      "45": ["24 eggs", "Gate 18", "Page 105", "90 days", "2026", "365 days", "12 months", "60 minutes", "4 seasons", "Route 64"],
      "68": [
        "Room 204, Desk 7", "Route 66", "10 or 12 laps", "The year 1903", "Page 48, line 6", "50 states", "13 colonies",
        "100 meters", "7 continents", "206 bones",
      ],
      "912": [
        "The Wright brothers flew in 1903.", "North Carolina joined in 1789.", "There are 206 bones in an adult.",
        "Light takes 8 minutes to get here.", "A marathon is 26.2 miles long.", "The year has 365 days, or 366.",
        "Water boils at 100 degrees Celsius.", "Read pages 12 to 48 by Friday.",
      ],
    },
  },
  {
    id: "punct",
    name: "Punctuation",
    newKeys: "! ? ' \" : - ( )",
    singles: ["!", "?", "'", "-", ":", "(", ")"],
    drills: ["!", "?", "''", "--", "::", "()", "!?", "a-b", "(a)", "'s"],
    words: [],
    byBand: {
      k1: ["!", "?", "Hi!", "Go!", "Yes?", "No!", "Wow!", "Hop!", "OK?"],
      "23": ["Yes!", "Why?", "I'm", "don't", "can't", "It's", "Wow!", "Hi, Sam!", "Ready?", "Who?", "Let's go!", "We're"],
      "45": [
        "Let's go!", "Who's there?", "It's 3:15.", "well-known", "Ready? Set! Go!", "Don't stop!", "Wait (please)",
        "\"Hi!\" she said.", "sixty-two", "What's next?",
      ],
      "68": [
        "She said, \"Hi!\"", "Wait: what's next?", "Bring (2) pencils.", "a well-known fact", "Don't stop now!",
        "Is it 4:30 yet?", "\"Go!\" yelled Coach.", "We'll see (maybe).",
      ],
      "912": [
        "\"Ready?\" asked the pilot. \"Ready!\"", "Note: the test is at 9:45.", "It's a well-known (and true) fact.",
        "Wait - did you save your file?", "Don't panic; just keep typing!", "Who said, \"Knowledge is power\"?",
      ],
    },
  },
  {
    id: "sentences",
    name: "Full sentences",
    newKeys: "everything!",
    singles: [],
    drills: [],
    words: [],
    byBand: {
      k1: [...TINY_WORDS.filter((w) => w.length <= 3), ...SENTENCES_K1],
      "23": SENTENCES_23,
      "45": SENTENCES_45,
      "68": SENTENCES_68,
      "912": [...SENTENCES_912, ...QUOTES.map((q) => q.text)],
    },
  },
];

export const FREE_ID = "free";

export function lessonById(id: string): Lesson | undefined {
  return LESSONS.find((l) => l.id === id);
}

/** All keys you may type in lesson `i` (cumulative), space included. */
export function lessonKeys(i: number): Set<string> {
  const keys = new Set<string>([" "]);
  const addAll = (s: string) => s.split("").forEach((c) => keys.add(c));
  const steps = ["asdfjkl;", "ei", "rtyugh", "qwop", "zxcvbnm,./", "ABCDEFGHIJKLMNOPQRSTUVWXYZ", "1234567890", "!?'\":-()"];
  for (let j = 0; j <= i && j < steps.length; j++) addAll(steps[j]);
  if (i >= steps.length) {
    // The final lesson: anything on the keyboard.
    addAll("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789,./;'\"!?:-()");
  }
  return keys;
}

export type Rng = () => number;

const pickFrom = <T>(rng: Rng, list: readonly T[]): T => list[Math.floor(rng() * list.length) % list.length];

export function shuffle<T>(list: T[], rng: Rng): T[] {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** How many comets in one round, by band. */
export function roundSize(g: Grade): number {
  const b = bandOf(g);
  return b === "k1" ? 15 : b === "912" ? 10 : b === "68" ? 14 : 15;
}

/** Max characters for a phrase made of lesson words, by band. */
const PHRASE_MAX: Partial<Record<Band, number>> = { "68": 18, "912": 30 };

function phrase(rng: Rng, words: string[], max: number): string {
  const n = 2 + Math.floor(rng() * 3);
  let out = pickFrom(rng, words);
  for (let i = 1; i < n; i++) {
    const w = pickFrom(rng, words);
    if (out.length + 1 + w.length > max) break;
    out += ` ${w}`;
  }
  return out;
}

/** Items earlier lessons taught (for K–1 review keys). */
function reviewSingles(i: number): string[] {
  const out: string[] = [];
  for (let j = 0; j < i; j++) {
    const l = LESSONS[j];
    // Letters only for review; capitals/digits/punctuation stay in their own lessons.
    out.push(...l.singles.filter((c) => /[a-z;]/.test(c)));
  }
  return out;
}

/** The comets for one lesson round. */
export function lessonItems(lessonIndex: number, g: Grade, rng: Rng, count = roundSize(g)): Item[] {
  const lesson = LESSONS[lessonIndex];
  const band = bandOf(g);
  const out: Item[] = [];
  const own = lesson.byBand?.[band];
  const quoteBy = new Map(QUOTES.map((q) => [q.text, q.by]));

  if (own) {
    let bag = shuffle(own, rng);
    while (out.length < count) {
      if (!bag.length) bag = shuffle(own, rng);
      const text = bag.pop()!;
      out.push(quoteBy.has(text) ? { text, by: quoteBy.get(text) } : { text });
    }
    return out;
  }

  if (band === "k1") {
    // New keys twice as likely as review keys; the first few comets are all new keys.
    const pool = [...lesson.singles, ...lesson.singles, ...reviewSingles(lessonIndex)];
    for (let i = 0; i < count; i++) {
      const text = i < 4 ? lesson.singles[i % lesson.singles.length] : pickFrom(rng, pool);
      out.push({ text });
    }
    return shuffleFirstFour(out, rng);
  }

  const shortWords = lesson.words.filter((w) => w.length <= 6);
  for (let i = 0; i < count; i++) {
    const r = rng();
    let text: string;
    if (band === "23") text = r < 0.4 || !shortWords.length ? pickFrom(rng, lesson.drills) : pickFrom(rng, shortWords);
    else if (band === "45") text = r < 0.2 ? pickFrom(rng, lesson.drills) : pickFrom(rng, lesson.words);
    else if (band === "68") text = r < 0.6 || !lesson.phrases ? pickFrom(rng, lesson.words) : phrase(rng, lesson.words, PHRASE_MAX["68"]!);
    else text = r < 0.35 || !lesson.phrases ? pickFrom(rng, lesson.words) : phrase(rng, lesson.words, PHRASE_MAX["912"]!);
    out.push({ text });
  }
  return out;
}

function shuffleFirstFour(items: Item[], rng: Rng): Item[] {
  const head = shuffle(items.slice(0, 4), rng);
  return [...head, ...items.slice(4)];
}

/** Free play: the grade's own word lists. K starts on the home row, then the whole alphabet. */
export function freeItems(g: Grade, rng: Rng, count = roundSize(g)): Item[] {
  const pool = freePool(g);
  if (gradeNumber(g) === 0) {
    const home = ["a", "s", "d", "f", "j", "k", "l"];
    const out: Item[] = [];
    for (let i = 0; i < count; i++) out.push({ text: i < count / 2 ? pickFrom(rng, home) : pickFrom(rng, ALPHABET) });
    return out;
  }
  let bag = shuffle(pool, rng);
  const out: Item[] = [];
  while (out.length < count) {
    if (!bag.length) bag = shuffle(pool, rng);
    out.push(bag.pop()!);
  }
  return out;
}

/** Items for a lesson id (or "free"). */
export function roundItems(lessonId: string, g: Grade, rng: Rng, count?: number): Item[] {
  if (lessonId === FREE_ID) return freeItems(g, rng, count);
  const i = LESSONS.findIndex((l) => l.id === lessonId);
  return lessonItems(i < 0 ? 0 : i, g, rng, count);
}
