/*
 * Word Hopper word lists. Every picture word has a sprite in art/sprites.ts
 * (checked by scripts/check-rules.ts).
 */

export type Level = "K" | "1" | "2";

/** Spoken letter names. Browser speech can't say lone phonemes reliably, so we say names. */
export const LETTER_NAME: Record<string, string> = {
  a: "ay", b: "bee", c: "see", d: "dee", e: "ee", f: "eff", g: "gee", h: "aitch", i: "eye", j: "jay",
  k: "kay", l: "ell", m: "em", n: "en", o: "oh", p: "pee", q: "cue", r: "are", s: "ess", t: "tee",
  u: "you", v: "vee", w: "double you", x: "ex", y: "why", z: "zee",
};

/** "the letter bee" / "the letters ess aitch" */
export function sayLetters(unit: string): string {
  const names = [...unit.toLowerCase()].map((c) => LETTER_NAME[c] ?? c).join(" ");
  return unit.length > 1 ? `the letters ${names}` : `the letter ${names}`;
}

/** Spell a word out loud by letter names: "see, ay, tee". */
export function spellOut(word: string): string {
  return [...word.toLowerCase()].map((c) => LETTER_NAME[c] ?? c).join(", ");
}

export const VOWELS = new Set(["a", "e", "i", "o", "u"]);
export const DIGRAPHS = ["sh", "ch", "th", "wh"];

/** Words that begin with a consonant digraph (their first letter alone is not their first sound). */
export function startsWithDigraph(w: string): string | null {
  return DIGRAPHS.find((d) => w.startsWith(d)) ?? null;
}

/** The first sound, as a key: c and k share /k/; digraphs are their own sound. */
export function firstSoundKey(w: string): string {
  const d = startsWithDigraph(w);
  if (d) return d;
  if (w[0] === "c" || w[0] === "k") return "k";
  return w[0];
}

// ---------------------------------------------------------------- Letter Match

/** Pictures used for "starts with the letter …" (no digraph starts; those are grade 1's own items). */
export const FIRST_LETTER_WORDS: Record<string, string[]> = {
  a: ["ant"],
  b: ["bus", "bed", "bat", "bee", "bell", "bike", "boat", "bone", "ball", "box", "bug"],
  c: ["cat", "cup", "cake", "can", "car", "coat", "cone", "cow", "crab", "cube"],
  d: ["dog", "duck", "drum", "dish"],
  e: ["egg"],
  f: ["fan", "fish", "fox", "frog", "feet", "five", "flag"],
  g: ["goat", "gate"],
  h: ["hat", "hen", "hand", "hive"],
  i: ["igloo"],
  j: ["jam", "jet"],
  k: ["kite", "king", "kid"],
  l: ["log", "leaf", "leg", "lamp"],
  m: ["map", "mop", "moon", "mug", "milk"],
  n: ["net", "nut", "nest", "nose", "nail"],
  o: ["octopus"],
  p: ["pig", "pen", "pan", "pot", "pie", "plate"],
  r: ["rug", "rat", "rain", "ring", "rake", "rope", "rose"],
  s: ["sun", "sock", "seal", "snake", "snail", "spoon", "star", "sled"],
  t: ["tree", "top", "tent", "tub", "tie", "train", "truck", "tube"],
  u: ["umbrella"],
  v: ["van"],
  w: ["web"],
  y: ["yoyo"],
};

/** Grade 1: pictures that start with a consonant digraph. */
export const DIGRAPH_WORDS: Record<string, string[]> = {
  sh: ["ship", "shell", "sheep", "shoe"],
  ch: ["chick", "cheese", "chair"],
  th: ["three"],
  wh: ["whale", "wheel"],
};

/** Grade 2: read the word for the picture (long vowels). Three look-alike real words each. */
export const READ_WORDS: Record<string, [string, string, string]> = {
  cake: ["cape", "coke", "cage"],
  kite: ["kit", "bite", "cute"],
  bike: ["bake", "bite", "like"],
  rake: ["rack", "rope", "lake"],
  gate: ["get", "game", "goat"],
  bone: ["bun", "cone", "bean"],
  rope: ["rip", "robe", "ripe"],
  cone: ["can", "cane", "code"],
  cube: ["cub", "cake", "cute"],
  five: ["fine", "fire", "fish"],
  whale: ["while", "wheel", "white"],
  snake: ["snack", "sneak", "smoke"],
  boat: ["bat", "beat", "bait"],
  goat: ["got", "gate", "get"],
  coat: ["cot", "cat", "cart"],
  rain: ["ran", "ruin", "rail"],
  train: ["trap", "trim", "tray"],
  snail: ["snap", "sail", "nail"],
  tree: ["three", "trap", "try"],
  bee: ["bed", "be", "bean"],
  feet: ["fat", "fit", "foot"],
  sheep: ["shop", "ship", "shape"],
  leaf: ["loaf", "life", "leg"],
  seal: ["sell", "sail", "soil"],
  pie: ["pin", "pea", "pet"],
  tie: ["toe", "tip", "ten"],
  spoon: ["spin", "span", "soon"],
  moon: ["moan", "mean", "mine"],
  wheel: ["whale", "well", "when"],
};

// ---------------------------------------------------------------- Word Builder

/** Each word split into the tiles it is built from (digraphs, ck, ll and vowel teams are one tile). */
export const BUILD_WORDS: Record<Level, string[][]> = {
  // Kindergarten: CVC words; the first letter is placed for you.
  K: [
    "cat", "dog", "pig", "fox", "hen", "bug", "bat", "rat", "sun", "hat", "bed", "cup", "map", "bus", "net", "pen",
    "jam", "log", "mop", "box", "fan", "van", "web", "rug", "nut", "can", "pan", "pot", "top", "mug", "jet", "leg",
    "kid", "tub",
  ].map((w) => [...w]),
  // Grade 1: digraphs (sh, ch, ck, ll), blends and short-vowel CVCC words.
  "1": [
    ["sh", "i", "p"], ["f", "i", "sh"], ["d", "i", "sh"], ["sh", "e", "ll"], ["ch", "i", "ck"], ["d", "u", "ck"],
    ["s", "o", "ck"], ["f", "r", "o", "g"], ["c", "r", "a", "b"], ["d", "r", "u", "m"], ["f", "l", "a", "g"],
    ["s", "l", "e", "d"], ["t", "r", "u", "ck"], ["t", "e", "n", "t"], ["h", "a", "n", "d"], ["l", "a", "m", "p"],
    ["n", "e", "s", "t"], ["m", "i", "l", "k"], ["b", "e", "ll"], ["s", "t", "ar"],
  ],
  // Grade 2: silent-e words and vowel teams (ai, ee, ea, oa, ie, oo).
  "2": [
    ["c", "a", "k", "e"], ["k", "i", "t", "e"], ["b", "i", "k", "e"], ["r", "a", "k", "e"], ["g", "a", "t", "e"],
    ["b", "o", "n", "e"], ["r", "o", "p", "e"], ["c", "o", "n", "e"], ["c", "u", "b", "e"], ["f", "i", "v", "e"],
    ["s", "n", "a", "k", "e"], ["wh", "a", "l", "e"], ["b", "oa", "t"], ["g", "oa", "t"], ["c", "oa", "t"],
    ["r", "ai", "n"], ["t", "r", "ai", "n"], ["s", "n", "ai", "l"], ["t", "r", "ee"], ["b", "ee"], ["f", "ee", "t"],
    ["sh", "ee", "p"], ["l", "ea", "f"], ["s", "ea", "l"], ["p", "ie"], ["t", "ie"], ["m", "oo", "n"],
    ["s", "p", "oo", "n"], ["wh", "ee", "l"],
  ],
};

/** Spare letters offered as extra tiles in Word Builder. */
export const SPARE_TILES: Record<Level, string[]> = {
  K: ["a", "e", "i", "o", "u", "b", "d", "m", "s", "t", "p", "g"],
  "1": ["a", "e", "i", "o", "u", "sh", "ch", "th", "ck", "r", "l", "s", "t", "or", "er"],
  "2": ["a", "e", "i", "o", "u", "ai", "ee", "oa", "ea", "ie", "oo"],
};

// ---------------------------------------------------------------- Rhyme Time

/** Rhyming families: every word in a family ends with the same spelling (its rime). */
export const RHYME_FAMILIES: Record<Level, string[][]> = {
  K: [
    ["cat", "hat", "bat", "rat"], ["dog", "log"], ["bug", "rug", "mug"], ["hen", "pen"], ["fox", "box"],
    ["can", "fan", "van", "pan"], ["net", "jet"], ["mop", "top"],
  ],
  "1": [
    ["dog", "log", "frog"], ["bed", "sled"], ["fish", "dish"], ["bell", "shell"], ["duck", "truck"], ["ring", "king"],
    ["star", "car"], ["cat", "hat", "bat"], ["can", "fan", "van"],
  ],
  "2": [
    ["cake", "rake", "snake"], ["bee", "tree", "three"], ["moon", "spoon"], ["goat", "boat", "coat"], ["rain", "train"],
    ["pie", "tie"], ["bone", "cone"], ["five", "hive"], ["nose", "rose"], ["gate", "plate"], ["cube", "tube"],
    ["snail", "nail"],
  ],
};

/** Spellings that sound alike although spelled differently, so they never meet as "not rhyming". */
export const SOUND_ALIKE_RIMES: string[][] = [
  ["ee", "ea", "e"], ["ake", "ache"], ["oat", "ote"], ["ain", "ane"], ["ail", "ale"], ["one", "own", "oan"],
  ["ie", "y", "igh"], ["oon", "une"], ["ar", "are"], ["ox", "ocks"], ["ub", "ubb"], ["eg", "egg"], ["ed", "ead"], ["ell", "el"],
];

/** The rime: from the last vowel group to the end ("cake" → "ake", "tree" → "ee", "frog" → "og"). */
export function rimeOf(w: string): string {
  let i = w.length - 1;
  if (w.endsWith("e") && w.length > 2 && !VOWELS.has(w[w.length - 2])) i = w.length - 2; // silent e: skip it
  while (i >= 0 && !VOWELS.has(w[i])) i--;
  while (i > 0 && VOWELS.has(w[i - 1])) i--;
  return w.slice(Math.max(i, 0));
}

export function soundsAlike(a: string, b: string): boolean {
  if (a === b) return true;
  return SOUND_ALIKE_RIMES.some((g) => g.includes(a) && g.includes(b));
}

// ---------------------------------------------------------------- Sound Sort

/** Kindergarten: beginning sounds. Letter → [key picture on the basket, ...cards]. */
export const BEGIN_SORT: Record<string, string[]> = {
  b: ["ball", "bus", "bed", "bat", "bee", "bell", "bike", "box", "bug"],
  c: ["cat", "cup", "cake", "can", "car", "cow", "coat"],
  d: ["dog", "duck", "drum", "dish"],
  f: ["fish", "fan", "fox", "frog", "feet", "five", "flag"],
  h: ["hat", "hen", "hand"],
  l: ["leaf", "log", "leg", "lamp"],
  m: ["moon", "map", "mop", "mug", "milk"],
  n: ["nest", "net", "nut"],
  p: ["pig", "pen", "pan", "pot", "pie"],
  r: ["rain", "rug", "rat", "ring", "rake", "rope"],
  s: ["sun", "sock", "seal", "snake", "snail", "spoon", "star"],
  t: ["tree", "top", "tent", "tub", "tie", "train", "truck"],
};

/** Grade 1: ending sounds. Letter → [key picture, ...cards]. Only words whose last letter is a sounded consonant. */
export const END_SORT: Record<string, string[]> = {
  t: ["cat", "hat", "bat", "rat", "net", "nut", "pot", "jet", "goat", "boat", "tent", "nest"],
  g: ["dog", "pig", "bug", "log", "rug", "mug", "leg", "frog", "flag"],
  n: ["sun", "hen", "pen", "fan", "van", "can", "pan", "rain", "train", "moon", "spoon"],
  p: ["cup", "map", "mop", "top", "ship", "lamp", "sheep"],
  d: ["bed", "kid", "sled", "hand"],
  b: ["web", "crab", "tub"],
};

/** Grade 2: short or long vowel, per vowel. [short key, ...short cards], [long key, ...long cards]. */
export const VOWEL_SORT: Record<string, { short: string[]; long: string[] }> = {
  a: {
    short: ["cat", "hat", "bat", "map", "can", "fan", "van", "jam", "pan", "crab", "flag", "hand", "lamp"],
    long: ["cake", "rake", "gate", "rain", "train", "snail", "snake", "whale"],
  },
  e: {
    short: ["bed", "hen", "pen", "net", "jet", "web", "leg", "egg", "sled", "tent", "nest", "shell", "bell"],
    long: ["bee", "tree", "feet", "leaf", "seal", "sheep", "wheel", "three"],
  },
  i: {
    short: ["pig", "fish", "ship", "kid", "dish", "chick", "milk"],
    long: ["kite", "bike", "five", "pie", "tie"],
  },
  o: {
    short: ["dog", "log", "fox", "box", "mop", "pot", "top", "sock", "frog"],
    long: ["boat", "goat", "coat", "rope", "bone", "cone"],
  },
};

/** Vowel teams that make a long vowel sound, by vowel. */
export const LONG_TEAMS: Record<string, string[]> = { a: ["ai", "ay"], e: ["ee", "ea"], i: ["ie", "igh"], o: ["oa", "oe", "ow"], u: ["ue"] };

/** Long if the word has a long-vowel team for `v`, or is v + consonant(s) + silent e. */
export function isLongVowel(w: string, v: string): boolean {
  if (LONG_TEAMS[v]?.some((t) => w.includes(t))) return true;
  return new RegExp(`${v}[^aeiou]e$`).test(w);
}

/** Short if `v` is the only vowel letter and there is no silent e. */
export function isShortVowel(w: string, v: string): boolean {
  const vowels = [...w].filter((c) => VOWELS.has(c));
  return vowels.length === 1 && vowels[0] === v && !w.endsWith("e");
}

// ---------------------------------------------------------------- Sight words (Dolch-style)

export const SIGHT_WORDS: Record<Level, string[]> = {
  // Pre-primer ("a" left out: speech often says it as "uh").
  K: [
    "and", "big", "blue", "can", "come", "down", "find", "for", "funny", "go", "help", "here", "I", "in", "is", "it",
    "jump", "little", "look", "make", "me", "my", "not", "one", "play", "red", "run", "said", "see", "the", "three",
    "to", "two", "up", "we", "where", "yellow", "you",
  ],
  // Primer and first grade ("live" and "read" left out: two ways to say them).
  "1": [
    "all", "am", "are", "at", "ate", "be", "black", "brown", "but", "came", "did", "do", "eat", "four", "get", "good",
    "have", "he", "into", "like", "must", "new", "no", "now", "on", "our", "out", "please", "pretty", "ran", "ride",
    "saw", "say", "she", "so", "soon", "that", "there", "they", "this", "too", "under", "want", "was", "well", "went",
    "what", "white", "who", "will", "with", "yes", "after", "again", "any", "ask", "by", "could", "every", "fly",
    "from", "give", "going", "had", "has", "her", "him", "his", "how", "just", "know", "let", "may", "of", "old",
    "once", "open", "over", "put", "round", "some", "stop", "take", "thank", "them", "then", "think", "walk", "were",
    "when",
  ],
  // Second grade.
  "2": [
    "always", "around", "because", "been", "before", "best", "both", "buy", "call", "cold", "does", "don't", "fast",
    "first", "five", "found", "gave", "goes", "green", "its", "made", "many", "off", "or", "pull", "right", "sing",
    "sit", "sleep", "tell", "their", "these", "those", "upon", "us", "use", "very", "wash", "which", "why", "wish",
    "work", "would", "write", "your",
  ],
};

/** Words that sound the same, so they never appear together as choices. */
export const HOMOPHONES: string[][] = [
  ["to", "two", "too"], ["for", "four"], ["no", "know"], ["buy", "by"], ["right", "write"], ["their", "there"],
  ["one", "won"], ["red", "read"], ["new", "knew"], ["its", "it's"], ["be", "bee"], ["see", "sea"], ["ate", "eight"],
];
