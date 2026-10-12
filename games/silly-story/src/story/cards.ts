/*
 * Picture word cards (K-5). Each card knows its part of speech. For each blank the game deals
 * three cards that fit and one that doesn't, so the Grammar Coach can explain the difference.
 */
import type { Grade } from "../kit/types";
import { COLOR_HEX } from "../art/mods";
import { SPRITES, type Kind } from "../art/sprites";
import { classify, fits, ingForm, pastTense, pluralize, type Tag } from "./grammar";
import { bandOf, typeName } from "./prompts";
import type { Blank, BlankType } from "./types";
import { SIMILES, VOCAB } from "./vocab";

export type CardPic =
  | { kind: "sprite"; sprite: string; count?: number }
  | { kind: "anim"; anim: string }
  | { kind: "mod"; word: string }
  | { kind: "color"; hex: string }
  | { kind: "count"; n: number }
  | { kind: "text" };

export interface Card {
  word: string;
  cat: BlankType;
  pic: CardPic;
  /** Vocab set this word belongs to, and whether it's the plain "not quite" word. */
  vocab?: string;
  plain?: boolean;
  /** Noun category, for hinted noun blanks. */
  nounKind?: Kind;
}

const words = (s: string) => s.trim().split(/\s+/).map((w) => w.replace(/_/g, " "));

export const VERB_CARDS = words("dance spin jump sleep wobble fly float run slide walk swim sing eat laugh cry sneeze wave shout juggle glow grow hop wiggle snore giggle march tiptoe zoom bounce skate burp");
export const ADJ_CARDS = words("giant tiny sparkly fuzzy upside-down striped spotted shiny invisible spicy frozen stinky happy grumpy sleepy soggy speedy cool fancy royal wobbly loud glowing silly brave smart bubbly");
export const COLOR_CARDS = words("red orange yellow green blue purple pink brown black white gold silver rainbow");
export const NUMBER_CARDS: [string, number][] = [["one", 1], ["two", 2], ["three", 3], ["four", 4], ["five", 5], ["six", 6], ["seven", 7], ["eight", 8], ["nine", 9], ["ten", 10]];
export const ADVERB_CARDS = words("quickly slowly loudly quietly happily sadly wildly sneakily gracefully clumsily proudly angrily sleepily");
export const SUBJECT_CARDS = words("I he she we they");
export const OBJECT_CARDS = words("me him her us them");
export const PREP_CARDS = words("under over behind beside inside on_top_of across around between near through above below");
export const COMPARATIVE_CARDS = words("bigger tinier sillier fuzzier shinier faster louder stinkier happier grumpier sleepier colder");
export const SUPERLATIVE_CARDS = words("biggest tiniest silliest fuzziest shiniest fastest loudest stinkiest happiest grumpiest sleepiest coldest");
export const SOUND_CARDS = words("boing splat kaboom whoosh honk achoo zoink yippee kerplunk ka-pow boop splish");

const ADJ_DEMO = "cat";

function nounCards(): Card[] {
  return SPRITES.filter((s) => !s.hidden).map((s) => ({ word: s.words[0], cat: "noun" as BlankType, pic: { kind: "sprite", sprite: s.id } as CardPic, nounKind: s.kind }));
}

let deckCache: Map<BlankType, Card[]> | null = null;

/** Every card, by category. */
export function allCards(): Map<BlankType, Card[]> {
  if (deckCache) return deckCache;
  const m = new Map<BlankType, Card[]>();
  const nouns = nounCards();
  m.set("noun", nouns);
  m.set("plural-noun", nouns.map((c) => ({ ...c, word: pluralize(c.word), cat: "plural-noun" as BlankType, pic: { ...(c.pic as { kind: "sprite"; sprite: string }), count: 3 } })));
  m.set("verb", VERB_CARDS.map((w) => ({ word: w, cat: "verb", pic: { kind: "anim", anim: w } })));
  m.set("verb-past", VERB_CARDS.map((w) => ({ word: pastTense(w), cat: "verb-past", pic: { kind: "anim", anim: w } })));
  m.set("verb-ing", VERB_CARDS.map((w) => ({ word: ingForm(w), cat: "verb-ing", pic: { kind: "anim", anim: w } })));
  m.set("adjective", ADJ_CARDS.map((w) => ({ word: w, cat: "adjective", pic: { kind: "mod", word: w } })));
  m.set("color", COLOR_CARDS.map((w) => ({ word: w, cat: "color", pic: w === "rainbow" ? { kind: "mod", word: w } : { kind: "color", hex: COLOR_HEX[w] } })));
  m.set("number", NUMBER_CARDS.map(([w, n]) => ({ word: w, cat: "number", pic: { kind: "count", n } })));
  m.set("adverb", ADVERB_CARDS.map((w) => ({ word: w, cat: "adverb", pic: { kind: "text" } })));
  m.set("pronoun-subject", SUBJECT_CARDS.map((w) => ({ word: w, cat: "pronoun-subject", pic: { kind: "text" } })));
  m.set("pronoun-object", OBJECT_CARDS.map((w) => ({ word: w, cat: "pronoun-object", pic: { kind: "text" } })));
  m.set("preposition", PREP_CARDS.map((w) => ({ word: w, cat: "preposition", pic: { kind: "text" } })));
  m.set("comparative", COMPARATIVE_CARDS.map((w) => ({ word: w, cat: "comparative", pic: { kind: "text" } })));
  m.set("superlative", SUPERLATIVE_CARDS.map((w) => ({ word: w, cat: "superlative", pic: { kind: "text" } })));
  m.set("sound", SOUND_CARDS.map((w) => ({ word: w, cat: "sound", pic: { kind: "text" } })));
  const sim: Card[] = [];
  for (const s of Object.values(SIMILES)) for (const e of s.examples) sim.push({ word: e, cat: "simile", pic: { kind: "text" } });
  m.set("simile", sim);
  const voc: Card[] = [];
  for (const [id, v] of Object.entries(VOCAB)) {
    for (const w of v.words) voc.push({ word: w, cat: "vocab", vocab: id, pic: { kind: "text" } });
    voc.push({ word: v.plain, cat: "vocab", vocab: id, plain: true, pic: { kind: "text" } });
  }
  m.set("vocab", voc);
  deckCache = m;
  return m;
}

/** The dictionary tag a card category must have. */
export const CAT_TAG: Partial<Record<BlankType, Tag>> = {
  noun: "noun", "plural-noun": "plural", verb: "verb", "verb-past": "past", "verb-ing": "ing", adjective: "adj", color: "color",
  number: "num", adverb: "adv", "pronoun-subject": "pron-subj", "pronoun-object": "pron-obj", preposition: "prep",
  comparative: "comp", superlative: "sup", sound: "sound",
};

/** Does this card fill this blank? */
export function cardFits(card: Card, b: Blank): boolean {
  if (b.type === "vocab") return card.cat === "vocab" && card.vocab === b.hint && !card.plain;
  if (b.type === "simile") return card.cat === "simile";
  if (card.cat === b.type) return true;
  if (b.type === "adjective" && (card.cat === "color" || card.cat === "comparative" || card.cat === "superlative")) return true;
  if (b.type === "noun" && card.cat === "plural-noun") return true;
  return false;
}

/** Categories whose cards make a good "not this one" for a blank type. */
const CONTRAST: Record<BlankType, BlankType[]> = {
  noun: ["verb", "adjective"], "plural-noun": ["noun"], verb: ["noun", "adjective"], "verb-past": ["verb"], "verb-ing": ["verb-past"],
  adjective: ["verb", "noun"], color: ["adjective"], number: ["color", "noun"], adverb: ["adjective"], "pronoun-subject": ["pronoun-object"],
  "pronoun-object": ["pronoun-subject"], preposition: ["noun", "verb"], comparative: ["superlative"], superlative: ["comparative"],
  sound: [], simile: ["noun"], vocab: [],
};

export function rngFrom(seed: number) {
  let a = seed >>> 0 || 1;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle<T>(arr: T[], rnd: () => number): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const KIND_FOR_HINT: Record<string, Kind[]> = {
  animal: ["animal", "fantasy"], food: ["food"], vehicle: ["vehicle"], thing: ["thing"], person: ["person"], place: ["place"],
};

/** Three cards that fit and (usually) one that doesn't, shuffled. */
export function dealCards(b: Blank, rnd: () => number, avoid: Set<string> = new Set()): Card[] {
  const deck = allCards();
  let good: Card[];
  if (b.type === "vocab") good = (deck.get("vocab") ?? []).filter((c) => c.vocab === b.hint && !c.plain);
  else if (b.type === "simile") good = (deck.get("simile") ?? []).filter((c) => !b.hint || SIMILES[b.hint]?.examples.includes(c.word));
  else good = deck.get(b.type) ?? [];
  if ((b.type === "noun" || b.type === "plural-noun") && b.hint && KIND_FOR_HINT[b.hint]) {
    const kinds = KIND_FOR_HINT[b.hint];
    const narrowed = good.filter((c) => c.nounKind && kinds.includes(c.nounKind));
    if (narrowed.length >= 3) good = narrowed;
  }
  const fresh = good.filter((c) => !avoid.has(c.word));
  const picked = shuffle(fresh.length >= 3 ? fresh : good, rnd).slice(0, 3);
  let bad: Card | undefined;
  if (b.type === "vocab") bad = (deck.get("vocab") ?? []).find((c) => c.vocab === b.hint && c.plain);
  else {
    const want = CAT_TAG[b.type];
    const pool = CONTRAST[b.type].flatMap((cat) => deck.get(cat) ?? []).filter((c) => {
      if (cardFits(c, b)) return false;
      // A good "wrong" card must not ALSO be the right kind of word ("jump" can be a noun too).
      const tags = classify(c.word);
      return want ? !tags.has(want) && !fits(tags, b.type) : true;
    });
    bad = pool.length ? shuffle(pool, rnd)[0] : undefined;
  }
  return shuffle(bad ? [...picked, bad] : picked, rnd);
}

const WHAT: Record<BlankType, string> = {
  noun: "names a person, animal, place or thing", "plural-noun": "names MORE than one thing", verb: "is something you can do",
  "verb-past": "tells about something that already happened", "verb-ing": "is an action word ending in -ing",
  adjective: "tells what something is like", color: "is a color", number: "tells how many", adverb: "tells HOW something is done",
  "pronoun-subject": "stands in for a name and DOES the action", "pronoun-object": "stands in for a name and GETS the action",
  preposition: "tells where", comparative: "compares two things", superlative: "means the MOST of all",
  sound: "is a sound", simile: "compares using LIKE or AS", vocab: "is an exact word",
};
const aAn = (w: string) => (/^[AEIOU]/i.test(w) ? "an" : "a");

/** The Grammar Coach's friendly note when a card doesn't fit. */
export function wrongCardMessage(card: Card, b: Blank, grade: Grade): string {
  const early = bandOf(grade) === "K-2";
  const name = (t: BlankType) => typeName(t, early);
  if (b.type === "vocab") {
    const v = VOCAB[b.hint ?? ""];
    return `“${card.word}” works, but it's a plain word. This blank wants ${v?.prompt ?? "a precise word"}. Pick a more exact one!`;
  }
  const special =
    b.type === "plural-noun" && card.cat === "noun" ? ` “${card.word}” is just one. More than one sounds like “${pluralize(card.word)}”.` :
    b.type === "verb-past" && card.cat === "verb" ? ` “${card.word}” is happening now. Already happened sounds like “${pastTense(card.word)}”.` :
    b.type === "color" && card.cat === "adjective" ? " It's a describing word, but not a color." : "";
  return `“${card.word}” is ${aAn(name(card.cat))} ${name(card.cat)}: it ${WHAT[card.cat]}. ` +
    `This blank needs ${aAn(name(b.type))} ${name(b.type)}: a word that ${WHAT[b.type]}.${special}`;
}

export { ADJ_DEMO };
