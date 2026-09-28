/*
 * Word Worm challenges: what a worm's segments carry and what to shoot.
 * Pure data + helpers (no DOM), so scripts/check-words.ts can test every grade.
 *
 * Kinds:
 *  - spell: shoot word parts (letters or chunks) in order to spell a word
 *  - build: shoot word parts (roots and affixes) in order to build the word that fits a meaning
 *  - pick:  shoot the one segment that answers the prompt (a letter, a word, a root...)
 *  - fix:   the worm carries a misspelled word; shoot the wrong or extra letter
 */
import type { Grade } from "../kit/types";
import { textWidth } from "./font";

export type Kind = "spell" | "build" | "pick" | "fix";

export interface Challenge {
  id: string;
  grade: Grade;
  kind: Kind;
  /** NC ELA Standard Course of Study code, e.g. "RF.K.4", "L.6.4". */
  standard: string;
  /** Short skill name for the mission report. */
  skill: string;
  /** Banner text. */
  prompt: string;
  /** Read-aloud text (can say more than the banner, e.g. "Spell cat. C, A, T."). */
  say: string;
  /** Labels to shoot, in order. */
  steps: string[];
  /** Other labels carried by the worm (never equal to a step). */
  decoys: string[];
  /** Finished word (spell/build/fix) or the answer (pick). */
  word: string;
  /** fix: the misspelled word the worm carries. */
  shown?: string;
  /** Show the word in the tray from the start (K-1 spelling with a model). */
  showWord: boolean;
  /** Shown when the worm is solved (and after a wrong shot). */
  explain: string;
  /** Why a particular wrong segment is wrong. */
  notes: Record<string, string>;
}

type Draft = Omit<Challenge, "id" | "grade" | "notes" | "showWord"> & {
  notes?: Record<string, string>;
  showWord?: boolean;
};

/* ------------------------------------------------------------------ */
/* Reference tables used to explain wrong shots                         */
/* ------------------------------------------------------------------ */

/** Letter sounds with a keyword, for K-1 letter-sound items. */
export const LETTER_SOUNDS: Record<string, { sound: string; key: string }> = {
  A: { sound: "short a", key: "APPLE" },
  B: { sound: "/b/", key: "BALL" },
  C: { sound: "/k/", key: "CUP" },
  D: { sound: "/d/", key: "DOG" },
  E: { sound: "short e", key: "EGG" },
  F: { sound: "/f/", key: "FISH" },
  G: { sound: "/g/", key: "GOAT" },
  H: { sound: "/h/", key: "HAT" },
  I: { sound: "short i", key: "INCH" },
  J: { sound: "/j/", key: "JAM" },
  K: { sound: "/k/", key: "KITE" },
  L: { sound: "/l/", key: "LEG" },
  M: { sound: "/m/", key: "MOP" },
  N: { sound: "/n/", key: "NET" },
  O: { sound: "short o", key: "OCTOPUS" },
  P: { sound: "/p/", key: "PIG" },
  Q: { sound: "/kw/", key: "QUEEN" },
  R: { sound: "/r/", key: "RED" },
  S: { sound: "/s/", key: "SUN" },
  T: { sound: "/t/", key: "TOP" },
  U: { sound: "short u", key: "UP" },
  V: { sound: "/v/", key: "VAN" },
  W: { sound: "/w/", key: "WEB" },
  X: { sound: "/ks/", key: "BOX" },
  Y: { sound: "/y/", key: "YES" },
  Z: { sound: "/z/", key: "ZIP" },
};

/** Letter teams (digraphs, vowel teams) with a keyword. */
export const TEAM_SOUNDS: Record<string, { sound: string; key: string }> = {
  SH: { sound: "/sh/", key: "SHIP" },
  CH: { sound: "/ch/", key: "CHIN" },
  TH: { sound: "/th/", key: "THUMB" },
  WH: { sound: "/wh/", key: "WHALE" },
  CK: { sound: "/k/", key: "DUCK" },
  NG: { sound: "/ng/", key: "RING" },
  AI: { sound: "long a", key: "RAIN" },
  AY: { sound: "long a", key: "PLAY" },
  EE: { sound: "long e", key: "TREE" },
  OA: { sound: "long o", key: "BOAT" },
  OO: { sound: "/oo/", key: "MOON" },
  OU: { sound: "/ow/", key: "CLOUD" },
  OY: { sound: "/oy/", key: "TOY" },
};

/** Meanings of every root and affix used as a target or decoy (grades 3-12). */
export const PARTS: Record<string, string> = {
  // prefixes
  UN: "not", RE: "again or back", PRE: "before", MIS: "wrongly", DIS: "not or the opposite of",
  SUB: "under", SUPER: "above or beyond", OVER: "too much", TRI: "three", BI: "two", UNI: "one",
  POST: "after", IN: "in, into or not", IM: "not or into", EX: "out", TRANS: "across", CON: "with or together",
  DE: "down or away", INTER: "between", INTRA: "within", CIRCUM: "around", ANTI: "against", PRO: "forward or for",
  SYN: "together or same", SYM: "together or with", A: "not or without", AD: "to or toward", E: "out",
  MONO: "one", MULTI: "many", MICRO: "small", MEGA: "large", AUTO: "self", TELE: "far", SEMI: "half",
  HEMI: "half", META: "change or beyond", EPI: "upon or among", EN: "in", AF: "to or toward", O: "against or away (as in omit)",
  DIA: "through or across", AT: "to or toward", IR: "not", INTRO: "inward", EXTRO: "outward",
  // suffixes
  FUL: "full of", LESS: "without", LY: "in a certain way", ER: "a person who, or more", EST: "most",
  NESS: "the state of being", ING: "doing an action now", ED: "happened in the past", ABLE: "able to be",
  IBLE: "able to be", OR: "a person who", ION: "the act or result of", ISM: "a belief or practice",
  IST: "a person who does or believes", LOGY: "the study of", OLOGY: "the study of", GRAPHY: "writing about",
  ITY: "the state of", IFY: "to make", IC: "relating to", ATE: "to make or do", AL: "relating to",
  OUS: "full of", IOUS: "full of", ANCE: "the state of", ID: "having a quality", ENCE: "the state of",
  ENT: "being or having", ANT: "opposite or against (as in ANTONYM)", ORY: "relating to or a place for",
  IUM: "a thing or place", ARIUM: "a place for", IA: "a condition",
  // roots
  PHOTO: "light", PHOT: "light", GRAPH: "write", PHON: "sound", PHONE: "sound", SCOPE: "see or look",
  PORT: "carry", SPECT: "look", VIS: "see", VID: "see", DICT: "say", AUD: "hear", RUPT: "break",
  STRUCT: "build", JECT: "throw", BIO: "life", GEO: "earth", AQUA: "water", TERR: "earth or land",
  HYDR: "water", HYDRO: "water", ASTR: "star", ASTRO: "star", CHRON: "time", THERM: "heat", THERMO: "heat",
  METER: "measure", PATH: "feeling", PHOBIA: "fear", PHOB: "fear", DEM: "people", DEMO: "people",
  CRAT: "rule", CRACY: "rule or government", LOG: "word or study",
  BENE: "good or well", MAL: "bad", DYS: "bad or difficult", EU: "good", MANU: "hand", PED: "foot",
  VOC: "voice or call", SCRIB: "write", DUC: "lead", CRED: "believe", CORP: "body", CAP: "head",
  THEO: "god", PHIL: "love", MORPH: "form or shape", NYM: "name", ONYM: "name", CHROM: "color",
  PAN: "all", HOMO: "same", HETERO: "different", POLY: "many", VER: "truth", FID: "faith or trust",
  FIN: "end", GRAD: "step", MORT: "death", VIT: "life", VIV: "life", GEN: "birth or kind",
  CIDE: "kill", FLECT: "bend", TRACT: "pull", SOMN: "sleep", LOQU: "speak", SOPH: "wisdom",
  PSEUDO: "false", NEO: "new", PALEO: "old", PROTO: "first", RETRO: "backward", EQU: "equal",
  EQUI: "equal", AMBI: "both", OMNI: "all", CRYPT: "hidden", LUC: "light", NOCT: "night",
  TEMP: "time", LOC: "place", ERR: "wander", PLAC: "please or calm", BELL: "war", PAC: "peace",
  AMBUL: "walk", VERT: "turn", MIT: "send", FLU: "flow", FER: "carry", ACR: "sharp", PSYCH: "mind",
  SON: "sound", VERB: "word", VOR: "eat", VORE: "eat", SOCI: "society or companion", HERBI: "plant",
  CARNI: "meat", AQU: "water", ATMO: "vapor or air", NAUT: "sailor", GRAM: "written",
  DEX: "right hand", PHAN: "show",
};

/** What each homophone or commonly confused word means. */
export const WORD_MEANINGS: Record<string, string> = {
  THEIR: "means it belongs to them", THERE: "means in that place", "THEY'RE": "means they are",
  TO: "means toward", TOO: "means also or very", TWO: "is the number 2",
  YOUR: "means it belongs to you", "YOU'RE": "means you are",
  ITS: "means it belongs to it", "IT'S": "means it is",
  THREW: "is the past of throw", THROUGH: "means in one side and out the other",
  HEAR: "means to listen", HERE: "means this place",
  WROTE: "is the past of write", ROTE: "means learning by repeating",
  AFFECT: "is a verb: to change or influence", AFFECTS: "is a verb: changes or influences",
  EFFECT: "is a noun: a result", EFFECTS: "is a noun: results",
  ACCEPT: "means to receive or agree to", EXCEPT: "means but or leaving out",
  THAN: "compares two things", THEN: "tells when, or what comes next",
  LOSE: "means to misplace or not win", LOOSE: "means not tight",
  LAY: "means to put something down", LIE: "means to rest or recline",
  PRINCIPAL: "is the head of a school, or main", PRINCIPLE: "is a rule or belief",
  QUITE: "means very or completely", QUIET: "means silent", QUIT: "means to stop",
  DESSERT: "is a sweet food after a meal", DESERT: "is dry, sandy land",
};

/* ------------------------------------------------------------------ */
/* Builders                                                            */
/* ------------------------------------------------------------------ */

const words = (s: string) => s.trim().split(/\s+/).filter(Boolean);
const lower = (s: string) => s.toLowerCase();

/** K-1 letter sound: "Shoot the letter that makes the /b/ sound, as in BALL". */
export function letterSound(std: string, letter: string, decoys: string): Draft {
  const info = LETTER_SOUNDS[letter];
  const vowel = info.sound.startsWith("short");
  const shown = vowel ? info.sound.toUpperCase() : info.sound;
  const spoken = vowel ? info.sound : speakSound(letter);
  const d = words(decoys);
  return {
    kind: "pick", standard: std, skill: vowel ? "Short vowel sounds" : "Letter sounds",
    prompt: `Shoot the letter that makes the ${shown} sound, as in ${info.key}`,
    say: `Shoot the letter that makes the ${spoken} sound, as in ${lower(info.key)}.`,
    steps: [letter], decoys: d, word: letter,
    explain: `${info.key} starts with ${letter}. ${letter} makes the ${shown} sound.`,
    notes: Object.fromEntries(d.map((x) => [x, `${x} makes the ${LETTER_SOUNDS[x].sound} sound, as in ${LETTER_SOUNDS[x].key}.`])),
  };
}

/** How to say a consonant sound out loud (text-to-speech friendly). */
function speakSound(letter: string): string {
  const m: Record<string, string> = {
    B: "buh", C: "kuh", D: "duh", F: "fff", G: "guh", H: "huh", J: "juh", K: "kuh", L: "lll", M: "mmm",
    N: "nnn", P: "puh", R: "rrr", S: "sss", T: "tuh", V: "vvv", W: "wuh", Y: "yuh", Z: "zzz",
  };
  return m[letter] ?? letter;
}

/** Grade 1-2 letter teams: "Shoot the letters that make the /sh/ sound in SHIP". */
export function teamSound(std: string, skill: string, team: string, keyword: string, decoys: string, where = "in"): Draft {
  const info = TEAM_SOUNDS[team];
  const d = words(decoys);
  const place = where === "end" ? `at the end of ${keyword}` : `in ${keyword}`;
  return {
    kind: "pick", standard: std, skill,
    prompt: `Shoot the letters that make the ${info.sound} sound ${place}`,
    say: `Shoot the letters that make the ${info.sound.replace(/\//g, "")} sound ${place.replace(keyword, lower(keyword))}.`,
    steps: [team], decoys: d, word: team,
    explain: `${keyword} uses ${team} for the ${info.sound} sound.`,
    notes: Object.fromEntries(d.map((x) => [x, TEAM_SOUNDS[x] ? `${x} makes the ${TEAM_SOUNDS[x].sound} sound, as in ${TEAM_SOUNDS[x].key}.` : `${x} doesn't make that sound here.`])),
  };
}

/** Rhymes: "Shoot the word that rhymes with CAT". */
export function rhyme(std: string, word: string, target: string, decoys: string): Draft {
  const d = words(decoys);
  const end = rimeOf(word);
  return {
    kind: "pick", standard: std, skill: "Rhyming words",
    prompt: `Shoot the word that rhymes with ${word}`,
    say: `Shoot the word that rhymes with ${lower(word)}.`,
    steps: [target], decoys: d, word: target,
    explain: `${word} and ${target} rhyme: they both end with -${end}.`,
    notes: Object.fromEntries(d.map((x) => [x, `${x} doesn't end like ${word}.`])),
  };
}

/** The rime (vowel onward) of a simple word, for rhyme explanations. */
export function rimeOf(word: string): string {
  const m = /[AEIOU].*$/.exec(word);
  return m ? m[0] : word;
}

/**
 * Spell a word in order. `parts` are space separated ("SH I P"). With `clue`, the word is
 * hidden and the clue is shown (grades 2+); without one, the word is shown (K-1).
 * Sight words say so in the prompt.
 */
export function spell(
  std: string,
  skill: string,
  parts: string,
  word: string,
  decoys: string,
  opts: { clue?: string; tip?: string; sight?: boolean; letters?: boolean } = {},
): Draft {
  const steps = words(parts);
  const d = words(decoys);
  const lw = lower(word);
  const spelled = word.split("").join(", ");
  let prompt: string;
  let say: string;
  if (opts.clue) {
    const filled = opts.clue.replace("____", lw);
    prompt = `Spell the missing word: ${opts.clue}`;
    say = opts.clue.includes("____") ? `Spell ${lw}. ${filled}` : `Spell ${lw}: ${opts.clue}.`;
    if (!opts.clue.includes("____")) prompt = `Spell the word that means: ${opts.clue}`;
  } else {
    prompt = opts.sight ? `Spell the sight word ${word}` : `Spell ${word}`;
    say = opts.letters === false ? `Spell ${lw}.` : `Spell ${lw}. ${spelled}.`;
  }
  return {
    kind: "spell", standard: std, skill, prompt, say, steps, decoys: d, word,
    showWord: !opts.clue,
    explain: `${word} is spelled ${steps.join("-")}.${opts.tip ? " " + opts.tip : ""}`,
  };
}

/** Build a word from roots and affixes to match a meaning. */
export function build(std: string, parts: string, word: string, decoys: string, meaning: string): Draft {
  const steps = words(parts);
  const d = words(decoys);
  const gloss = steps.map((p) => (PARTS[p] ? `${p} (${PARTS[p]})` : p)).join(" + ");
  return {
    kind: "build", standard: std, skill: "Build words from roots and affixes",
    prompt: `Build the word that means "${meaning}"`,
    say: `Build the word that means: ${meaning}.`,
    steps, decoys: d, word,
    explain: `${word} = ${gloss}.`,
    notes: Object.fromEntries(d.filter((x) => PARTS[x]).map((x) => [x, `${x} means "${PARTS[x]}".`])),
  };
}

/** Pick the prefix, suffix or root with a meaning. */
export function part(std: string, skill: string, target: string, decoys: string, prompt: string, example: string): Draft {
  const d = words(decoys);
  return {
    kind: "pick", standard: std, skill, prompt, say: `${prompt}.`,
    steps: [target], decoys: d, word: target,
    explain: `${target} means "${PARTS[target]}", as in ${example}.`,
    notes: Object.fromEntries(d.map((x) => [x, `${x} means "${PARTS[x]}".`])),
  };
}

/** Homophones and commonly confused words, in a sentence with a blank. */
export function usage(std: string, skill: string, target: string, decoys: string, sentence: string): Draft {
  const d = words(decoys);
  return {
    kind: "pick", standard: std, skill,
    prompt: `Shoot the right word: ${sentence}`,
    say: `Shoot the right word. ${sentence}`,
    steps: [target], decoys: d, word: target,
    explain: `${sentence.replace(/_+/, target)} ${target} ${WORD_MEANINGS[target]}.`,
    notes: Object.fromEntries(d.map((x) => [x, `${x} ${WORD_MEANINGS[x]}.`])),
  };
}

/** A misspelled word: shoot the wrong or extra letter. */
export function fix(std: string, shown: string, correct: string, tip = ""): Draft {
  const wrong = wrongLetter(shown, correct);
  const others = shown.split("").filter((_, i) => i !== wrong.index);
  return {
    kind: "fix", standard: std, skill: "Fix misspelled words",
    prompt: `Shoot the ${wrong.extra ? "extra" : "wrong"} letter: ${shown}`,
    say: `This word should say ${lower(correct)}. Shoot the letter that doesn't belong.`,
    steps: [wrong.letter], decoys: others, word: correct, shown,
    explain: `The right spelling is ${correct}.${tip ? " " + tip : ""}`,
    notes: Object.fromEntries(others.map((x) => [x, `${x} belongs in ${correct}.`])),
  };
}

/**
 * Where `shown` differs from `correct` by one extra or one wrong letter.
 * Throws if the two words are not one letter apart.
 */
export function wrongLetter(shown: string, correct: string): { index: number; letter: string; extra: boolean } {
  if (shown.length === correct.length + 1) {
    for (let i = 0; i < shown.length; i++) {
      if (shown.slice(0, i) + shown.slice(i + 1) === correct) return { index: i, letter: shown[i], extra: true };
    }
  } else if (shown.length === correct.length) {
    const diffs = [...shown].map((c, i) => (c !== correct[i] ? i : -1)).filter((i) => i >= 0);
    if (diffs.length === 1) return { index: diffs[0], letter: shown[diffs[0]], extra: false };
  }
  throw new Error(`${shown} is not one letter away from ${correct}`);
}

/** Give drafts their grade and ids. */
export function finish(grade: Grade, drafts: Draft[]): Challenge[] {
  return drafts.map((d, i) => ({
    ...d,
    id: `ww-g${grade}-${String(i + 1).padStart(2, "0")}`,
    grade,
    notes: d.notes ?? {},
    showWord: d.showWord ?? false,
  }));
}

/* ------------------------------------------------------------------ */
/* Worm contents                                                       */
/* ------------------------------------------------------------------ */

export type Band = "k2" | "35" | "68" | "hs";

export function bandOf(g: Grade): Band {
  const n = g === "K" ? 0 : Number(g);
  return n <= 2 ? "k2" : n <= 5 ? "35" : n <= 8 ? "68" : "hs";
}

/** Shortest worm per band (decoys are repeated to reach it). */
export const MIN_SEGMENTS: Record<Band, number> = { k2: 6, "35": 7, "68": 8, hs: 8 };
export const MAX_SEGMENTS = 12;
/** Longest padded worm, in logical pixels. */
export const MAX_WORM_PX = 200;

/**
 * Labels for one worm: every step (repeats kept, so "BALL" carries two Ls), every decoy,
 * then repeated decoys up to the band's minimum length. `rand` is injectable for tests.
 */
export function wormLabels(ch: Challenge, band: Band, rand: () => number = Math.random): string[] {
  if (ch.kind === "fix") return ch.shown!.split("");
  const out = [...ch.steps, ...ch.decoys];
  const pool = ch.decoys.length ? ch.decoys : ch.steps;
  // Pad with repeated decoys, but keep long-word worms short enough to wind across the field.
  for (let tries = 0; out.length < MIN_SEGMENTS[band] && tries < 20; tries++) {
    const next = pool[Math.floor(rand() * pool.length)];
    if (wormLength([...out, next]) <= MAX_WORM_PX) out.push(next);
  }
  // Shuffle so the first target is not always the head.
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out.slice(0, Math.max(MAX_SEGMENTS, ch.steps.length));
}

/** Why a wrong segment is wrong, for the banner. */
export function whyWrong(ch: Challenge, shot: string, need: string): string {
  const note = ch.notes[shot];
  switch (ch.kind) {
    case "spell":
      return `Not ${shot}. ${ch.showWord ? `${ch.word} needs ${need} next.` : `The next part is ${need}.`}`;
    case "build":
      return `${note ? note + " " : `Not ${shot}. `}The next part is ${need}.`;
    case "fix":
      return note ?? `${shot} belongs in ${ch.word}.`;
    default:
      return `${note ?? `Not ${shot}.`} ${ch.explain}`;
  }
}

/** Text for the tray: built parts, then blanks (or ghost letters when the word is shown). */
export function trayCells(ch: Challenge, step: number): { text: string; state: "done" | "next" | "todo" | "ghost" }[] {
  if (ch.kind === "fix") {
    const src = step > 0 ? ch.word : ch.shown!;
    return src.split("").map((c) => ({ text: c, state: step > 0 ? "done" : "ghost" }));
  }
  if (ch.kind === "pick") {
    return [{ text: step > 0 ? ch.word : "?", state: step > 0 ? "done" : "next" }];
  }
  return ch.steps.map((p, i) => ({
    text: i < step || ch.showWord ? p : "_".repeat(Math.min(p.length, 4)),
    state: i < step ? "done" : i === step ? "next" : ch.showWord ? "ghost" : "todo",
  }));
}

/* ------------------------------------------------------------------ */
/* Geometry and the pick strip (shared by the engine and the checker)  */
/* ------------------------------------------------------------------ */

/** Height of a worm segment and of a worm row, in logical pixels. */
export const SEG_H = 13;

/** Single letters are drawn at 2x; word parts at 1x. */
export function labelScale(label: string): number {
  return label.length === 1 ? 2 : 1;
}

/** Width of a segment carrying `label`. */
export function segWidth(label: string): number {
  return label.length === 1 ? SEG_H : Math.max(SEG_H, textWidth(label, 1) + 6);
}

/** Length of a whole worm, head to tail, with 1px gaps. */
export function wormLength(labels: string[]): number {
  return labels.reduce((a, l) => a + segWidth(l) + 1, 0);
}

function shuffled<T>(a: T[], rand: () => number): T[] {
  const out = [...a];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * The pick strip: up to four different labels still on the worm, always including the one
 * needed next, so keys 1-4 (and taps) can always reach the right answer.
 */
export function stripFor(labels: string[], need: string, rand: () => number = Math.random): string[] {
  const others = shuffled([...new Set(labels)].filter((l) => l !== need), rand).slice(0, 3);
  return shuffled([need, ...others], rand);
}

/** True when the labels are single letters (the strip is keyed 1-4 only, so A-D never look like answers). */
export function letterMode(labels: string[]): boolean {
  return labels.every((l) => l.length === 1);
}
