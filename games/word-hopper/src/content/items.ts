/*
 * Word Hopper rounds: five items per round, built fresh from the word lists with random
 * look-alike / sound-alike wrong choices. Every item carries an NC ELA standard code
 * (NC numbering: RF.x.1 print concepts, RF.x.3 phonological awareness, RF.x.4 phonics).
 */
import type { Grade } from "@/kit/types";
import {
  BEGIN_SORT, BUILD_WORDS, DIGRAPH_WORDS, END_SORT, FIRST_LETTER_WORDS, HOMOPHONES, LETTER_NAME, READ_WORDS,
  RHYME_FAMILIES, SIGHT_WORDS, SPARE_TILES, VOWEL_SORT, firstSoundKey, rimeOf, sayLetters, soundsAlike, spellOut,
  type Level,
} from "./words";

export type Activity = "letters" | "builder" | "rhyme" | "sort" | "sight";
export const ACTIVITIES: Activity[] = ["letters", "builder", "rhyme", "sort", "sight"];
export const ROUND_SIZE = 5;

export const ACTIVITY_INFO: Record<Activity, { title: string; say: string }> = {
  letters: { title: "Letter Match", say: "Letter Match!" },
  builder: { title: "Word Builder", say: "Word Builder!" },
  rhyme: { title: "Rhyme Time", say: "Rhyme Time!" },
  sort: { title: "Sound Sort", say: "Sound Sort!" },
  sight: { title: "Sight Words", say: "Sight Words!" },
};

export type Rng = () => number;

export interface Pick {
  kind: "picture" | "letter" | "word";
  value: string;
}

interface Base {
  /** Stable key used to avoid repeats ("rhyme:cat>hat"). */
  key: string;
  activity: Activity;
  level: Level;
  standard: string;
  skill: string;
  /** Shown for grown-ups and readers. */
  prompt: string;
  /** Read aloud. */
  say: string;
  /** Read aloud after a right answer. */
  praise: string;
}

export interface ChoiceItem extends Base {
  type: "choice";
  /** The big thing at the top: a letter or a picture. Null = only the speaker. */
  cue: Pick | null;
  choices: Pick[];
  answer: number;
  /** Read aloud when choice i is tapped and it is wrong ("" for the answer). */
  whyWrong: string[];
}

export interface BuildItem extends Base {
  type: "build";
  word: string;
  units: string[];
  /** How many leading units are already placed (Kindergarten gets the first letter). */
  given: number;
  /** Tiles to choose from: every unit still needed plus spare tiles, shuffled. */
  tiles: string[];
  whyWrong: string;
}

export interface Basket {
  /** Big label on the basket ("Bb", "_t", "short a"). */
  label: string;
  /** Picture on the basket. */
  key: string;
  /** Spoken description ("the letter bee, like ball"). */
  say: string;
}

export interface SortItem extends Base {
  type: "sort";
  baskets: Basket[];
  card: string;
  answer: number;
  whyWrong: string;
}

export type Item = ChoiceItem | BuildItem | SortItem;

export function levelFor(g: Grade): Level {
  if (g === "K") return "K";
  if (g === "1") return "1";
  return "2";
}

export const choiceCount = (level: Level) => (level === "K" ? 3 : 4);

// ---------------------------------------------------------------- helpers

export function shuffle<T>(arr: readonly T[], rng: Rng): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickOne<T>(arr: readonly T[], rng: Rng): T {
  return arr[Math.floor(rng() * arr.length)];
}

/** Pick `n` distinct values from `pool` that pass `ok`, preferring `prefer` first. */
function pickSome<T>(pool: readonly T[], n: number, rng: Rng, ok: (v: T, chosen: T[]) => boolean, prefer: readonly T[] = []): T[] {
  const out: T[] = [];
  for (const v of [...shuffle(prefer, rng), ...shuffle(pool, rng)]) {
    if (out.length >= n) break;
    if (!out.includes(v) && ok(v, out)) out.push(v);
  }
  if (out.length < n) throw new Error(`could not pick ${n} values`);
  return out;
}

/** Place the answer at a random index. */
function deal(answer: Pick, wrong: Pick[], rng: Rng): { choices: Pick[]; answer: number } {
  const choices = shuffle([answer, ...wrong], rng);
  return { choices, answer: choices.indexOf(answer) };
}

/** "bus, dog, or sun" */
function orList(words: string[]): string {
  if (words.length < 2) return words.join("");
  return `${words.slice(0, -1).join(", ")}, or ${words[words.length - 1]}`;
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const NAME = (c: string) => LETTER_NAME[c.toLowerCase()] ?? c;
const homophone = (a: string, b: string) => HOMOPHONES.some((g) => g.includes(a.toLowerCase()) && g.includes(b.toLowerCase()));

const ALPHABET = "abcdefghijklmnopqrstuvwxyz".split("");

/** Lowercase letters children mix up. */
const LOWER_LOOKALIKE: Record<string, string> = {
  b: "dph", d: "bqp", p: "qbd", q: "pgd", m: "nwu", n: "mhu", u: "nvw", w: "mvu", h: "nbk", i: "ljt", l: "ijt",
  j: "ig", t: "fli", f: "tl", g: "qpj", a: "oed", e: "ac", o: "ace", c: "oe", v: "wuy", y: "vgj", s: "zc", z: "sx",
  r: "nm", k: "hx", x: "kz",
};
const UPPER_LOOKALIKE: Record<string, string> = {
  M: "WNH", W: "MVN", N: "MHZ", E: "FBL", F: "EPT", O: "QCD", Q: "OGC", C: "OGD", P: "RBD", R: "PBK", B: "PRD",
  I: "LTJ", L: "ITJ", T: "ILF", U: "VJO", V: "UYW", D: "OBP", G: "COQ", H: "NKA", K: "XHR", X: "KYZ", Y: "VXT",
  Z: "SNX", S: "ZC", A: "HVR", J: "IUL",
};

// ---------------------------------------------------------------- Letter Match

const ALL_FIRST_WORDS = Object.values(FIRST_LETTER_WORDS).flat();

function caseItem(letter: string, upperCue: boolean, level: Level, rng: Rng): ChoiceItem {
  const n = choiceCount(level) - 1;
  const target = upperCue ? letter : letter.toUpperCase();
  const cue = upperCue ? letter.toUpperCase() : letter;
  const look = (upperCue ? LOWER_LOOKALIKE[letter] : UPPER_LOOKALIKE[letter.toUpperCase()]) ?? "";
  const pool = upperCue ? ALPHABET : ALPHABET.map((c) => c.toUpperCase());
  // Capital I and little l are the same stroke in most fonts, so they never meet.
  const twin = cue === "I" ? "l" : cue === "l" ? "I" : null;
  const wrong = pickSome(pool, n, rng, (v) => v.toLowerCase() !== letter && v !== twin, [...look]);
  const dealt = deal({ kind: "letter", value: target }, wrong.map((v) => ({ kind: "letter" as const, value: v })), rng);
  const nm = NAME(letter);
  const big = upperCue ? "big" : "little";
  const small = upperCue ? "little" : "big";
  return {
    type: "choice",
    key: `letters:case-${cue}`,
    activity: "letters",
    level,
    standard: "RF.K.1",
    skill: "Upper- and lowercase letters",
    prompt: `This is ${big} ${cue}. Find the ${small} letter that matches.`,
    say: `This is a ${big} ${nm}. Find the ${small} ${nm}.`,
    praise: `Yes! ${cap(big)} ${nm} and ${small} ${nm} match!`,
    cue: { kind: "letter", value: cue },
    ...dealt,
    whyWrong: dealt.choices.map((c, i) => (i === dealt.answer ? "" : `That is a ${small} ${NAME(c.value)}. Find the ${small} ${nm}.`)),
  };
}

function firstLetterItem(letter: string, word: string, level: Level, rng: Rng): ChoiceItem {
  const n = choiceCount(level) - 1;
  const snd = firstSoundKey(word);
  const wrong = pickSome(ALL_FIRST_WORDS, n, rng, (w, chosen) => firstSoundKey(w) !== snd && w[0] !== letter && chosen.every((c) => c[0] !== w[0]));
  const dealt = deal({ kind: "picture", value: word }, wrong.map((w) => ({ kind: "picture" as const, value: w })), rng);
  const names = dealt.choices.map((c) => c.value);
  return {
    type: "choice",
    key: `letters:first-${word}`,
    activity: "letters",
    level,
    // Single-letter sounds are a Kindergarten phonics standard; grade 1 reviews them.
    standard: "RF.K.4",
    skill: "First letter and its sound",
    prompt: `Which picture starts with ${letter.toUpperCase()}?`,
    say: `Which picture starts with ${sayLetters(letter)}? ${cap(orList(names))}?`,
    praise: `Yes! ${cap(word)} starts with ${sayLetters(letter)}.`,
    cue: { kind: "letter", value: letter.toUpperCase() + letter },
    ...dealt,
    whyWrong: names.map((w, i) => (i === dealt.answer ? "" : `That is ${w}. ${cap(w)} starts with ${sayLetters(w[0])}. Find the one that starts with ${sayLetters(letter)}.`)),
  };
}

function digraphItem(dg: string, word: string, level: Level, rng: Rng): ChoiceItem {
  const n = choiceCount(level) - 1;
  // One wrong picture starts with the digraph's first letter alone (sh → sun), so the h matters.
  const sameFirst = (FIRST_LETTER_WORDS[dg[0]] ?? []).filter((w) => firstSoundKey(w) === w[0] || (dg[0] === "c" && w[0] === "c"));
  const lead = pickSome(sameFirst, 1, rng, () => true);
  const rest = pickSome(ALL_FIRST_WORDS, n - 1, rng, (w) => w[0] !== dg[0] && !lead.includes(w) && firstSoundKey(w) !== firstSoundKey(lead[0]));
  const wrong = [...lead, ...rest];
  const dealt = deal({ kind: "picture", value: word }, wrong.map((w) => ({ kind: "picture" as const, value: w })), rng);
  const names = dealt.choices.map((c) => c.value);
  return {
    type: "choice",
    key: `letters:digraph-${word}`,
    activity: "letters",
    level,
    standard: "RF.1.4",
    skill: "Consonant digraphs (sh, ch, th, wh)",
    prompt: `Which picture starts with ${dg}?`,
    say: `Which picture starts with ${sayLetters(dg)}? ${cap(orList(names))}?`,
    praise: `Yes! ${cap(word)} starts with ${sayLetters(dg)}. Together they make one sound.`,
    cue: { kind: "letter", value: dg },
    ...dealt,
    whyWrong: names.map((w, i) => {
      if (i === dealt.answer) return "";
      if (w[0] === dg[0]) return `That is ${w}. ${cap(w)} starts with ${sayLetters(w[0])}, but not ${sayLetters(dg)}. Try again!`;
      return `That is ${w}. ${cap(w)} starts with ${sayLetters(w[0])}. Find the one that starts with ${sayLetters(dg)}.`;
    }),
  };
}

function readItem(word: string, rng: Rng): ChoiceItem {
  const wrong = READ_WORDS[word];
  const dealt = deal({ kind: "word", value: word }, wrong.map((w) => ({ kind: "word" as const, value: w })), rng);
  return {
    type: "choice",
    key: `letters:read-${word}`,
    activity: "letters",
    level: "2",
    standard: "RF.2.4",
    skill: "Read long-vowel words",
    prompt: "Which word goes with the picture?",
    // The choices are not read aloud: reading them is the skill.
    say: `Find the word ${word}.`,
    praise: `Yes! That word says ${word}.`,
    cue: { kind: "picture", value: word },
    ...dealt,
    whyWrong: dealt.choices.map((c, i) => (i === dealt.answer ? "" : `That word says ${c.value}. Find ${word}.`)),
  };
}

function lettersKeys(level: Level): string[][] {
  if (level === "K") {
    const caseKeys = ALPHABET.flatMap((c) => [`U${c}`, `L${c}`]);
    const pic = Object.entries(FIRST_LETTER_WORDS).flatMap(([l, ws]) => ws.map((w) => `P${l}:${w}`));
    return [caseKeys, pic];
  }
  if (level === "1") {
    const pic = Object.entries(FIRST_LETTER_WORDS).flatMap(([l, ws]) => ws.map((w) => `P${l}:${w}`));
    const dig = Object.entries(DIGRAPH_WORDS).flatMap(([d, ws]) => ws.map((w) => `D${d}:${w}`));
    return [dig, pic];
  }
  return [Object.keys(READ_WORDS).map((w) => `R${w}`)];
}

function lettersItem(code: string, level: Level, rng: Rng): ChoiceItem {
  const t = code[0];
  const rest = code.slice(1);
  if (t === "U" || t === "L") return caseItem(rest, t === "U", level, rng);
  if (t === "P") {
    const [l, w] = rest.split(":");
    return firstLetterItem(l, w, level, rng);
  }
  if (t === "D") {
    const [d, w] = rest.split(":");
    return digraphItem(d, w, level, rng);
  }
  return readItem(rest, rng);
}

// ---------------------------------------------------------------- Word Builder

const BUILD_STANDARD: Record<Level, [string, string]> = {
  K: ["RF.K.4", "Spell short-vowel (CVC) words"],
  "1": ["RF.1.4", "Spell words with digraphs and blends"],
  "2": ["RF.2.4", "Spell silent-e and vowel-team words"],
};

function sayUnit(u: string): string {
  return [...u].map(NAME).join(" ");
}

function buildItem(units: string[], level: Level, rng: Rng): BuildItem {
  const word = units.join("");
  const given = level === "K" ? 1 : 0;
  const nSpare = level === "K" ? 1 : 2;
  const spares = pickSome(SPARE_TILES[level], nSpare, rng, (t) => !units.includes(t));
  const tiles = shuffle([...units.slice(given), ...spares], rng);
  const [standard, skill] = BUILD_STANDARD[level];
  const first = given ? ` The first letter is ${NAME(units[0])}.` : "";
  return {
    type: "build",
    key: `builder:${word}`,
    activity: "builder",
    level,
    standard,
    skill,
    word,
    units,
    given,
    tiles,
    prompt: `Spell the word.`,
    say: `Spell ${word}.${first}`,
    praise: `${cap(spellOut(word))}. ${cap(word)}! You built it!`,
    whyWrong: `Not that one. Listen: ${word}. Try another tile!`,
  };
}

/** What to say when a tile lands in the right slot. */
export function sayTile(u: string): string {
  return sayUnit(u);
}

// ---------------------------------------------------------------- Rhyme Time

const RHYME_STANDARD: Record<Level, [string, string]> = {
  K: ["RF.K.3", "Rhyming words"],
  // Rhyme recognition is a Kindergarten phonological standard in NC; grade 1 reviews it with blends and digraphs.
  "1": ["RF.K.3", "Rhyming words"],
  // Grade 2 rhymes are long-vowel word families that share a silent-e or vowel-team spelling.
  "2": ["RF.2.4", "Long-vowel word families"],
};

/** Words that may be wrong choices in Rhyme Time at this level. */
export function rhymeDistractorPool(level: Level): string[] {
  const all = new Set<string>();
  for (const fams of Object.values(RHYME_FAMILIES)) for (const f of fams) f.forEach((w) => all.add(w));
  if (level === "K") BUILD_WORDS.K.forEach((u) => all.add(u.join("")));
  return [...all];
}

function rhymeItem(target: string, answer: string, level: Level, rng: Rng): ChoiceItem {
  const n = choiceCount(level) - 1;
  const rime = rimeOf(target);
  const pool = rhymeDistractorPool(level);
  const wrong = pickSome(pool, n, rng, (w, chosen) =>
    w !== target && !soundsAlike(rimeOf(w), rime) && chosen.every((c) => !soundsAlike(rimeOf(c), rimeOf(w))),
  );
  const dealt = deal({ kind: "picture", value: answer }, wrong.map((w) => ({ kind: "picture" as const, value: w })), rng);
  const names = dealt.choices.map((c) => c.value);
  const [standard, skill] = RHYME_STANDARD[level];
  return {
    type: "choice",
    key: `rhyme:${target}>${answer}`,
    activity: "rhyme",
    level,
    standard,
    skill,
    prompt: `What rhymes with ${target}?`,
    say: `What rhymes with ${target}? ${cap(orList(names))}?`,
    praise: `Yes! ${cap(target)}, ${answer}. They rhyme!`,
    cue: { kind: "picture", value: target },
    ...dealt,
    whyWrong: names.map((w, i) => (i === dealt.answer ? "" : `${cap(target)}, ${w}. Those don't rhyme. Listen to the end of ${target}. Try again!`)),
  };
}

function rhymeKeys(level: Level): string[] {
  const out: string[] = [];
  for (const fam of RHYME_FAMILIES[level]) for (const a of fam) for (const b of fam) if (a !== b) out.push(`${a}>${b}`);
  return out;
}

// ---------------------------------------------------------------- Sight Words

function sightItem(word: string, level: Level, rng: Rng): ChoiceItem {
  const n = choiceCount(level) - 1;
  const list = SIGHT_WORDS[level];
  const near = list.filter((w) => w !== word && (w[0].toLowerCase() === word[0].toLowerCase() || Math.abs(w.length - word.length) <= 1));
  const wrong = pickSome(list, n, rng, (w, chosen) => w !== word && !homophone(w, word) && chosen.every((c) => !homophone(c, w)), near);
  const dealt = deal({ kind: "word", value: word }, wrong.map((w) => ({ kind: "word" as const, value: w })), rng);
  const std = level === "K" ? "RF.K.4" : level === "1" ? "RF.1.4" : "RF.2.4";
  return {
    type: "choice",
    key: `sight:${word}`,
    activity: "sight",
    level,
    standard: std,
    skill: "Sight words",
    prompt: "Listen... Tap!",
    say: `Find the word: ${word}.`,
    praise: `Yes! That word is ${word}.`,
    cue: null,
    ...dealt,
    whyWrong: dealt.choices.map((c, i) => (i === dealt.answer ? "" : `That word is ${c.value}. Find ${word}.`)),
  };
}

// ---------------------------------------------------------------- Sound Sort

export function sortBaskets(level: Level, rng: Rng): { baskets: Basket[]; pools: string[][]; vowel?: string } {
  if (level === "2") {
    const v = pickOne(Object.keys(VOWEL_SORT), rng);
    const { short, long } = VOWEL_SORT[v];
    return {
      vowel: v,
      baskets: [
        { label: `short ${v}`, key: short[0], say: `short ${NAME(v)}, like ${short[0]}` },
        { label: `long ${v}`, key: long[0], say: `long ${NAME(v)}, like ${long[0]}` },
      ],
      pools: [short.slice(1), long.slice(1)],
    };
  }
  const table = level === "K" ? BEGIN_SORT : END_SORT;
  // Two letters with at least two cards each and five cards between them.
  let [a, b] = shuffle(Object.keys(table), rng);
  for (let tries = 0; tries < 100 && (table[a].length + table[b].length - 2 < ROUND_SIZE || table[a].length < 3 || table[b].length < 3); tries++) {
    [a, b] = shuffle(Object.keys(table), rng);
  }
  const mk = (l: string): Basket =>
    level === "K"
      ? { label: l.toUpperCase() + l, key: table[l][0], say: `${sayLetters(l)}, like ${table[l][0]}` }
      : { label: `_${l}`, key: table[l][0], say: `words that end with ${sayLetters(l)}, like ${table[l][0]}` };
  return { baskets: [mk(a), mk(b)], pools: [table[a].slice(1), table[b].slice(1)] };
}

const SORT_STANDARD: Record<Level, [string, string]> = {
  K: ["RF.K.3", "Beginning sounds"],
  "1": ["RF.1.3", "Ending sounds"],
  "2": ["RF.2.4", "Short and long vowels"],
};

function sortRound(level: Level, rng: Rng, recent: Set<string>): SortItem[] {
  const { baskets, pools, vowel } = sortBaskets(level, rng);
  // Five cards, at least two per basket.
  let c0 = rng() < 0.5 ? 3 : 2;
  c0 = Math.min(c0, pools[0].length);
  let c1 = Math.min(ROUND_SIZE - c0, pools[1].length);
  c0 = ROUND_SIZE - c1;
  const counts = [c0, c1];
  const cards: [string, number][] = [];
  pools.forEach((pool, bi) => {
    const fresh = shuffle(pool, rng).sort((x, y) => Number(recent.has(`sort:${x}`)) - Number(recent.has(`sort:${y}`)));
    fresh.slice(0, counts[bi]).forEach((w) => cards.push([w, bi]));
  });
  const [standard, skill] = SORT_STANDARD[level];
  const intro = `Put each picture in the right basket. This basket is for ${baskets[0].say}. This one is for ${baskets[1].say}.`;
  return shuffle(cards, rng).map(([card, answer], i) => {
    const why =
      level === "K"
        ? `${cap(card)} starts with ${sayLetters(card[0])}. Try the other basket!`
        : level === "1"
          ? `${cap(card)} ends with ${sayLetters(card[card.length - 1])}. Try the other basket!`
          : `${cap(card)} has a ${answer === 0 ? "short" : "long"} ${NAME(vowel!)}. Try the other basket!`;
    return {
      type: "sort" as const,
      key: `sort:${card}`,
      activity: "sort" as const,
      level,
      standard,
      skill,
      prompt: level === "K" ? "Which basket? Listen to the first sound." : level === "1" ? "Which basket? Listen to the last sound." : "Short or long vowel?",
      say: `${i === 0 ? intro + " " : ""}Where does ${card} go?`,
      praise:
        level === "K"
          ? `Yes! ${cap(card)} starts with ${sayLetters(card[0])}.`
          : level === "1"
            ? `Yes! ${cap(card)} ends with ${sayLetters(card[card.length - 1])}.`
            : `Yes! ${cap(card)} has a ${answer === 0 ? "short" : "long"} ${NAME(vowel!)}.`,
      baskets,
      card,
      answer,
      whyWrong: why,
    };
  });
}

// ---------------------------------------------------------------- rounds

/** Every distinct item key an activity can produce at a level (the pool size). */
export function poolKeys(activity: Activity, level: Level): string[] {
  switch (activity) {
    case "letters":
      return lettersKeys(level).flat();
    case "builder":
      return BUILD_WORDS[level].map((u) => u.join(""));
    case "rhyme":
      return rhymeKeys(level);
    case "sight":
      return SIGHT_WORDS[level];
    case "sort":
      if (level === "K") return Object.values(BEGIN_SORT).flatMap((p) => p.slice(1));
      if (level === "1") return Object.values(END_SORT).flatMap((p) => p.slice(1));
      return Object.values(VOWEL_SORT).flatMap((v) => [...v.short.slice(1), ...v.long.slice(1)]);
  }
}

/** Pick `n` codes, least recently seen first, in random order. */
function freshPick(codes: string[], n: number, rng: Rng, recent: Set<string>, keyOf: (c: string) => string): string[] {
  const s = shuffle(codes, rng);
  const fresh = s.filter((c) => !recent.has(keyOf(c)));
  // Seen lately: oldest first (`recent` keeps insertion order, newest last).
  const age = new Map([...recent].map((k, i) => [k, i]));
  const stale = s.filter((c) => recent.has(keyOf(c))).sort((x, y) => age.get(keyOf(x))! - age.get(keyOf(y))!);
  return [...fresh, ...stale].slice(0, n);
}

function letterKeyOf(code: string): string {
  const t = code[0];
  const rest = code.slice(1);
  if (t === "U") return `letters:case-${rest.toUpperCase()}`;
  if (t === "L") return `letters:case-${rest}`;
  if (t === "P") return `letters:first-${rest.split(":")[1]}`;
  if (t === "D") return `letters:digraph-${rest.split(":")[1]}`;
  return `letters:read-${rest}`;
}

/**
 * A round of five items. `recent` holds keys seen lately; they are used last.
 */
export function makeRound(activity: Activity, level: Level, rng: Rng = Math.random, recent: Set<string> = new Set()): Item[] {
  switch (activity) {
    case "letters": {
      const groups = lettersKeys(level);
      if (groups.length === 1) return freshPick(groups[0], ROUND_SIZE, rng, recent, letterKeyOf).map((c) => lettersItem(c, level, rng));
      // K: 2 big/little + 3 first-letter pictures. Grade 1: 3 digraphs + 2 first-letter pictures.
      const [a, b] = level === "K" ? [2, 3] : [3, 2];
      const codes = shuffle([...freshPick(groups[0], a, rng, recent, letterKeyOf), ...freshPick(groups[1], b, rng, recent, letterKeyOf)], rng);
      return codes.map((c) => lettersItem(c, level, rng));
    }
    case "builder": {
      const byWord = new Map(BUILD_WORDS[level].map((u) => [u.join(""), u]));
      return freshPick([...byWord.keys()], ROUND_SIZE, rng, recent, (w) => `builder:${w}`).map((w) => buildItem(byWord.get(w)!, level, rng));
    }
    case "rhyme": {
      // Never the same target twice in a round.
      const codes = freshPick(rhymeKeys(level), 200, rng, recent, (c) => `rhyme:${c}`);
      const used = new Set<string>();
      const out: ChoiceItem[] = [];
      for (const c of codes) {
        const [t, a] = c.split(">");
        if (used.has(t) || used.has(a)) continue;
        used.add(t);
        used.add(a);
        out.push(rhymeItem(t, a, level, rng));
        if (out.length === ROUND_SIZE) break;
      }
      return out;
    }
    case "sight":
      return freshPick(SIGHT_WORDS[level], ROUND_SIZE, rng, recent, (w) => `sight:${w}`).map((w) => sightItem(w, level, rng));
    case "sort":
      return sortRound(level, rng, recent);
  }
}

/** Seeded random numbers (tests and the playtest's ?seed=). */
export function seededRng(seed: number): Rng {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13;
    s >>>= 0;
    s ^= s >>> 17;
    s ^= s << 5;
    s >>>= 0;
    return s / 4294967296;
  };
}
