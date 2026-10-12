/*
 * Grammar Coach: what part of speech is a typed word, and does it fit the blank?
 * Uses the built-in word list (words.ts) plus simple morphology:
 *   -s/-es/-ies plurals, -ed/-ied past tense (and doubled consonants: hopped), -ing,
 *   -ly adverbs, -er/-est comparatives and superlatives, and the common irregular forms.
 * Unknown words are always accepted: it's the kid's story.
 */
import {
  ADJECTIVES, ADVERBS, COLORS, CONJUNCTIONS, DETERMINERS, IRREGULAR_COMPARE, IRREGULAR_PAST, IRREGULAR_PLURAL, NOUNS, NUMBER_WORDS,
  OBJECT_PRONOUNS, OTHER_PRONOUNS, PLURAL_ONLY, POSSESSIVE_PRONOUNS, PREPOSITIONS, SAME_PLURAL, SOUNDS, SUBJECT_PRONOUNS, VERBS,
} from "./words";
import type { BlankType } from "./types";
import { VOCAB } from "./vocab";

export type Tag =
  | "noun" | "plural" | "verb" | "past" | "ing" | "verb-s" | "adj" | "comp" | "sup" | "adv"
  | "pron-subj" | "pron-obj" | "pron-poss" | "pron" | "prep" | "num" | "color" | "conj" | "det" | "sound";

const VOWEL = /[aeiou]/;
const isVowel = (c: string) => VOWEL.test(c);

/* ---------------------------------------------------------------- forming words */

const PLURAL_OF: Record<string, string> = Object.fromEntries(Object.entries(IRREGULAR_PLURAL).map(([p, s]) => [s, p]));
const PAST_OF: Record<string, string> = {};
for (const [p, b] of Object.entries(IRREGULAR_PAST)) if (!PAST_OF[b]) PAST_OF[b] = p;
// Prefer the most common past form.
Object.assign(PAST_OF, { be: "was", lie: "lay", dream: "dreamed", burn: "burned", smell: "smelled", spill: "spilled", leap: "leaped", light: "lit" });

/** Short words ending consonant-vowel-consonant double the last letter: hop → hopped, big → bigger. */
function doubles(w: string): boolean {
  if (w.length < 3) return false;
  const [a, b, c] = w.slice(-3);
  if (isVowel(a) || !isVowel(b) || isVowel(c) || "wxy".includes(c)) return false;
  // One vowel group only (hop, stop, flip, big, thin), plus a few stressed-last-syllable words.
  const groups = w.match(/[aeiou]+/g) ?? [];
  return groups.length === 1 || ["admit", "begin", "forget", "regret", "permit", "upset", "occur", "prefer", "patrol", "control"].includes(w);
}

function lastWord(w: string, f: (x: string) => string): string {
  const i = w.lastIndexOf(" ");
  return i < 0 ? f(w) : w.slice(0, i + 1) + f(w.slice(i + 1));
}
function firstWord(w: string, f: (x: string) => string): string {
  const i = w.indexOf(" ");
  return i < 0 ? f(w) : f(w.slice(0, i)) + w.slice(i);
}

export function pluralize(word: string): string {
  return lastWord(word, (w) => {
    const lw = w.toLowerCase();
    if (SAME_PLURAL.has(lw) || PLURAL_ONLY.has(lw) || IRREGULAR_PLURAL[lw]) return w;
    if (PLURAL_OF[lw]) return matchCase(w, PLURAL_OF[lw]);
    if (/(s|x|z|ch|sh)$/.test(lw)) return w + "es";
    if (/[^aeiou]y$/.test(lw)) return w.slice(0, -1) + "ies";
    return w + "s";
  });
}

export function pastTense(verb: string): string {
  return firstWord(verb, (w) => {
    const lw = w.toLowerCase();
    if (PAST_OF[lw]) return matchCase(w, PAST_OF[lw]);
    if (lw.endsWith("e")) return w + "d";
    if (/[^aeiou]y$/.test(lw)) return w.slice(0, -1) + "ied";
    if (doubles(lw)) return w + w.slice(-1) + "ed";
    return w + "ed";
  });
}

export function ingForm(verb: string): string {
  return firstWord(verb, (w) => {
    const lw = w.toLowerCase();
    if (lw === "be") return "being";
    if (lw.endsWith("ie")) return w.slice(0, -2) + "ying";
    if (/[^eoy]e$/.test(lw) && lw.length > 2) return w.slice(0, -1) + "ing";
    if (doubles(lw)) return w + w.slice(-1) + "ing";
    return w + "ing";
  });
}

export function adverbOf(adj: string): string {
  return lastWord(adj, (w) => {
    const lw = w.toLowerCase();
    if (lw === "good") return "well";
    if (lw.endsWith("ly") && !ADJECTIVES.has(lw.slice(0, -2))) return w; // friendly, silly (already end in -ly)
    if (/[^aeiou]y$/.test(lw)) return w.slice(0, -1) + "ily";
    if (/[^aeiou]le$/.test(lw)) return w.slice(0, -1) + "y";
    if (lw.endsWith("ic")) return w + "ally";
    if (lw.endsWith("ll")) return w + "y";
    if (lw.endsWith("ue")) return w.slice(0, -1) + "ly";
    return w + "ly";
  });
}

const COMPARE_OF: Record<string, [string, string]> = { good: ["better", "best"], bad: ["worse", "worst"], far: ["farther", "farthest"], little: ["littler", "littlest"] };

/** Long adjectives use more/most. */
function usesMore(lw: string): boolean {
  const syll = (lw.replace(/([^aeiouy])e$/, "$1").match(/[aeiouy]+/g) ?? []).length;
  if (syll <= 1) return false;
  if (syll === 2 && /(y|le|er|ow)$/.test(lw)) return false; // happy → happier, gentle → gentler, clever → cleverer
  return true;
}

export function comparative(adj: string): string {
  const lw = adj.toLowerCase();
  if (COMPARE_OF[lw]) return COMPARE_OF[lw][0];
  if (adj.includes(" ") || adj.includes("-") || usesMore(lw)) return `more ${adj}`;
  if (lw.endsWith("e")) return adj + "r";
  if (/[^aeiou]y$/.test(lw)) return adj.slice(0, -1) + "ier";
  if (doubles(lw)) return adj + adj.slice(-1) + "er";
  return adj + "er";
}

export function superlative(adj: string): string {
  const lw = adj.toLowerCase();
  if (COMPARE_OF[lw]) return COMPARE_OF[lw][1];
  if (adj.includes(" ") || adj.includes("-") || usesMore(lw)) return `most ${adj}`;
  if (lw.endsWith("e")) return adj + "st";
  if (/[^aeiou]y$/.test(lw)) return adj.slice(0, -1) + "iest";
  if (doubles(lw)) return adj + adj.slice(-1) + "est";
  return adj + "est";
}

function matchCase(src: string, out: string) {
  return src[0] === src[0].toUpperCase() && src[0] !== src[0].toLowerCase() ? out[0].toUpperCase() + out.slice(1) : out;
}

/* ---------------------------------------------------------------- undoing endings */

/** Possible singular forms of a plural-looking word. */
export function singularCandidates(w: string): string[] {
  const out: string[] = [];
  if (IRREGULAR_PLURAL[w]) out.push(IRREGULAR_PLURAL[w]);
  if (w.endsWith("ies") && w.length > 4) out.push(w.slice(0, -3) + "y");
  if (w.endsWith("ves")) out.push(w.slice(0, -3) + "f", w.slice(0, -3) + "fe");
  if (w.endsWith("es") && w.length > 3) out.push(w.slice(0, -2));
  if (w.endsWith("s") && !w.endsWith("ss") && w.length > 2) out.push(w.slice(0, -1));
  return out;
}

export function pastCandidates(w: string): string[] {
  const out: string[] = [];
  if (IRREGULAR_PAST[w]) out.push(IRREGULAR_PAST[w]);
  if (w.endsWith("ied") && w.length > 4) out.push(w.slice(0, -3) + "y");
  if (w.endsWith("ed") && w.length > 3) {
    const stem = w.slice(0, -2);
    out.push(stem, stem + "e");
    if (stem.length > 2 && stem.slice(-1) === stem.slice(-2, -1)) out.push(stem.slice(0, -1));
  }
  return out;
}

export function ingCandidates(w: string): string[] {
  if (!w.endsWith("ing") || w.length < 5) return [];
  const stem = w.slice(0, -3);
  const out = [stem, stem + "e"];
  if (stem.endsWith("y")) out.push(stem.slice(0, -1) + "ie");
  if (stem.length > 2 && stem.slice(-1) === stem.slice(-2, -1)) out.push(stem.slice(0, -1));
  return out;
}

export function adverbCandidates(w: string): string[] {
  if (w === "well") return ["good"];
  if (!w.endsWith("ly") || w.length < 4) return [];
  const out = [w.slice(0, -2)];
  if (w.endsWith("ily")) out.push(w.slice(0, -3) + "y");
  if (w.endsWith("ally")) out.push(w.slice(0, -4));
  if (w.endsWith("bly") || w.endsWith("ply") || w.endsWith("tly") || w.endsWith("dly") || w.endsWith("gly") || w.endsWith("kly") || w.endsWith("zly")) out.push(w.slice(0, -1) + "e");
  if (w.endsWith("lly")) out.push(w.slice(0, -1));
  out.push(w.slice(0, -2) + "e"); // truly → true
  return out;
}

export function compareCandidates(w: string): { base: string; kind: "comp" | "sup" }[] {
  if (IRREGULAR_COMPARE[w]) return [IRREGULAR_COMPARE[w]];
  const out: { base: string; kind: "comp" | "sup" }[] = [];
  for (const [suf, kind] of [["er", "comp"], ["est", "sup"]] as const) {
    if (!w.endsWith(suf) || w.length < suf.length + 2) continue;
    const stem = w.slice(0, -suf.length);
    out.push({ base: stem, kind }, { base: stem + "e", kind });
    if (stem.endsWith("i")) out.push({ base: stem.slice(0, -1) + "y", kind });
    if (stem.length > 2 && stem.slice(-1) === stem.slice(-2, -1)) out.push({ base: stem.slice(0, -1), kind });
  }
  return out;
}

/* ---------------------------------------------------------------- classify */

const NUMERAL = /^\d{1,9}$/;
const isAdjBase = (w: string) => ADJECTIVES.has(w) || COLORS.has(w);

/** Every part of speech a single word (or a short phrase) could be. Empty = unknown word. */
export function classify(raw: string): Set<Tag> {
  const w = raw.trim().toLowerCase().replace(/[’‘]/g, "'").replace(/\s+/g, " ");
  const tags = new Set<Tag>();
  if (!w) return tags;
  classifyOne(w, tags);
  if (w.includes(" ")) {
    const parts = w.split(" ");
    const first = parts[0];
    const rest = parts.slice(1).join(" ");
    const last = parts[parts.length - 1];
    // "more fuzzy", "most fuzzy"
    if ((first === "more" || first === "less") && (isAdjBase(rest) || classifyOneSet(rest).has("adj"))) tags.add("comp");
    if ((first === "most" || first === "least") && (isAdjBase(rest) || classifyOneSet(rest).has("adj"))) tags.add("sup");
    // A phrase is mostly its head word: "hot dog" → noun, "super fuzzy" → adjective, "very quickly" → adverb.
    const lastTags = classifyOneSet(last);
    for (const t of ["noun", "plural", "adj", "adv", "color", "comp", "sup"] as Tag[]) if (lastTags.has(t)) tags.add(t);
    const firstTags = classifyOneSet(first);
    for (const t of ["verb", "past", "ing", "verb-s"] as Tag[]) if (firstTags.has(t)) tags.add(t);
    if (NUMBER_WORDS.has(w)) tags.add("num");
    if (parts.every((p) => NUMBER_WORDS.has(p) || p === "and")) tags.add("num");
  }
  return tags;
}

function classifyOneSet(w: string): Set<Tag> {
  const s = new Set<Tag>();
  classifyOne(w, s);
  return s;
}

function classifyOne(w: string, tags: Set<Tag>) {
  if (NOUNS.has(w)) tags.add("noun");
  if (PLURAL_ONLY.has(w)) tags.add("plural").add("noun");
  if (SAME_PLURAL.has(w)) tags.add("plural").add("noun");
  if (VERBS.has(w)) tags.add("verb");
  if (ADJECTIVES.has(w)) tags.add("adj");
  if (COLORS.has(w)) tags.add("color").add("adj");
  if (ADVERBS.has(w)) tags.add("adv");
  if (NUMBER_WORDS.has(w) || NUMERAL.test(w)) tags.add("num");
  if (SUBJECT_PRONOUNS.has(w)) tags.add("pron-subj").add("pron");
  if (OBJECT_PRONOUNS.has(w)) tags.add("pron-obj").add("pron");
  if (POSSESSIVE_PRONOUNS.has(w)) tags.add("pron-poss").add("pron");
  if (OTHER_PRONOUNS.has(w)) tags.add("pron");
  if (PREPOSITIONS.has(w)) tags.add("prep");
  if (CONJUNCTIONS.has(w)) tags.add("conj");
  if (DETERMINERS.has(w)) tags.add("det");
  if (SOUNDS.has(w) || SOUNDS.has(w.replace(/(.)\1{2,}/g, "$1$1")) || SOUNDS.has(w.replace(/(.)\1+/g, "$1"))) tags.add("sound");

  for (const s of singularCandidates(w)) {
    if (NOUNS.has(s)) tags.add("plural");
    if (VERBS.has(s) && !IRREGULAR_PLURAL[w]) tags.add("verb-s");
  }
  for (const b of pastCandidates(w)) if (VERBS.has(b)) tags.add("past");
  for (const b of ingCandidates(w)) if (VERBS.has(b)) tags.add("ing");
  for (const b of adverbCandidates(w)) if (isAdjBase(b)) tags.add("adv");
  for (const c of compareCandidates(w)) if (isAdjBase(c.base)) tags.add(c.kind);
  if (IRREGULAR_COMPARE[w]) tags.add(IRREGULAR_COMPARE[w].kind);
}

/* ---------------------------------------------------------------- base forms (used by the scene) */

/** The plain form of a word for picture lookups: tacos → taco, danced → dance, quickly → quick, biggest → big. */
export function baseForms(raw: string): string[] {
  const w = raw.trim().toLowerCase();
  const out = [w];
  for (const s of singularCandidates(w)) if (NOUNS.has(s) || VERBS.has(s)) out.push(s);
  for (const b of pastCandidates(w)) if (VERBS.has(b)) out.push(b);
  for (const b of ingCandidates(w)) if (VERBS.has(b)) out.push(b);
  for (const b of adverbCandidates(w)) if (isAdjBase(b)) out.push(b);
  for (const c of compareCandidates(w)) if (isAdjBase(c.base)) out.push(c.base);
  return [...new Set(out)];
}

/* ---------------------------------------------------------------- the coach */

export interface CoachResult {
  /** "ok" fits; "unknown" isn't in the word list (accepted); "hint" looks like a different part of speech. */
  verdict: "ok" | "unknown" | "hint";
  message?: string;
  /** A fixed-up word the kid can tap to use instead (e.g. "taco" → "tacos"). */
  suggestion?: string;
  /** True when a "precise vocabulary" blank got one of the strong words. */
  precise?: boolean;
}

/** Kid-friendly names for what a word looks like. */
function describe(tags: Set<Tag>): string {
  if (tags.has("verb")) return "an ACTION word (a verb): it tells what someone does";
  if (tags.has("past")) return "a PAST-TENSE verb: an action that already happened";
  if (tags.has("ing")) return "an -ING verb";
  if (tags.has("noun")) return "a NAMING word (a noun): a person, place, animal or thing";
  if (tags.has("plural")) return "a PLURAL noun: more than one thing";
  if (tags.has("color")) return "a COLOR word";
  if (tags.has("adj")) return "a DESCRIBING word (an adjective)";
  if (tags.has("comp")) return "a COMPARING word (like bigger)";
  if (tags.has("sup")) return "a MOST-OF-ALL word (like biggest)";
  if (tags.has("adv")) return "an ADVERB: it tells HOW something is done";
  if (tags.has("pron")) return "a PRONOUN: a word that stands in for a name";
  if (tags.has("prep")) return "a PREPOSITION: it tells where or when";
  if (tags.has("num")) return "a NUMBER";
  if (tags.has("conj")) return "a JOINING word (a conjunction), like and or but";
  if (tags.has("det")) return "a little pointing word, like a or the";
  if (tags.has("sound")) return "a SOUND word";
  return "a different kind of word";
}

const WANT: Record<BlankType, string> = {
  noun: "a NAMING word (a noun): a person, place, animal or thing, like taco or castle",
  "plural-noun": "a PLURAL noun: MORE than one thing, like tacos or puppies",
  verb: "an ACTION word (a verb), like jump or wiggle",
  "verb-past": "a PAST-TENSE verb: an action that already happened, like jumped or swam",
  "verb-ing": "a verb ending in -ING, like dancing or snoring",
  adjective: "a DESCRIBING word (an adjective), like fuzzy or huge",
  color: "a COLOR word, like purple or green",
  number: "a NUMBER, like three or 12",
  adverb: "an ADVERB that tells HOW, like quickly or loudly",
  "pronoun-subject": "a SUBJECT pronoun that does the action: I, you, he, she, it, we or they",
  "pronoun-object": "an OBJECT pronoun that gets the action: me, you, him, her, it, us or them",
  preposition: "a PREPOSITION that tells where or when, like under, behind or across",
  comparative: "a COMPARING adjective, like bigger or sillier",
  superlative: "a MOST-OF-ALL adjective, like biggest or silliest",
  sound: "a silly SOUND, like BOING",
  simile: "a SIMILE that compares using LIKE or AS, like “like a rocket”",
  vocab: "a precise word",
};

export function wantText(t: BlankType): string {
  return WANT[t];
}

const SUBJ_FOR: Record<string, string> = { me: "I", him: "he", her: "she", us: "we", them: "they", my: "I", his: "he", our: "we", their: "they", mine: "I" };
const OBJ_FOR: Record<string, string> = { i: "me", he: "him", she: "her", we: "us", they: "them", my: "me", his: "him", our: "us", their: "them" };

/** Does `word` fit a blank of this type? Gentle hints only; the kid may always keep their word. */
export function coach(word: string, type: BlankType, vocabId?: string): CoachResult {
  const w = word.trim().toLowerCase().replace(/\s+/g, " ");
  if (type === "sound") return { verdict: "ok" };
  if (type === "simile") {
    if (/^(like|as)\s+\S/.test(w)) return { verdict: "ok" };
    const tags = classify(w);
    const sug = tags.has("noun") ? `like a ${w}` : tags.has("adj") ? `as ${w} as a rocket` : undefined;
    return {
      verdict: "hint",
      message: `A simile compares two things using LIKE or AS, for example “like a sleepy walrus” or “as fast as a rocket”.`,
      suggestion: sug,
    };
  }
  if (type === "vocab") {
    const v = vocabId ? VOCAB[vocabId] : undefined;
    if (!v) return { verdict: "ok" };
    if (v.words.includes(w)) return { verdict: "ok", precise: true };
    const inner = coach(w, v.pos);
    if (inner.verdict === "hint") return inner;
    return {
      verdict: "hint",
      message: `“${word}” can work, but this blank wants ${v.prompt}. Precise words paint a sharper picture, for example ${v.words.slice(0, 3).join(", ")}.`,
    };
  }
  const tags = classify(w);
  if (tags.size === 0) return { verdict: "unknown" };
  const ok = fits(tags, type);
  if (ok) return { verdict: "ok" };

  let suggestion: string | undefined;
  let extra = "";
  if (type === "plural-noun" && tags.has("noun")) {
    suggestion = pluralize(w);
    extra = ` “${word}” is just one. Make it more than one: “${suggestion}”.`;
  } else if (type === "verb-past" && (tags.has("verb") || tags.has("ing") || tags.has("verb-s"))) {
    const base = tags.has("verb") ? w : baseForms(w).find((b) => VERBS.has(b)) ?? w;
    suggestion = pastTense(base);
    extra = ` To show it already happened, try “${suggestion}”.`;
  } else if (type === "verb-ing" && (tags.has("verb") || tags.has("past") || tags.has("verb-s"))) {
    const base = tags.has("verb") ? w : baseForms(w).find((b) => VERBS.has(b)) ?? w;
    suggestion = ingForm(base);
    extra = ` Add -ing: “${suggestion}”.`;
  } else if (type === "verb" && (tags.has("past") || tags.has("ing") || tags.has("verb-s"))) {
    suggestion = baseForms(w).find((b) => b !== w && VERBS.has(b));
    if (suggestion) extra = ` This sentence needs the plain form: “${suggestion}”.`;
  } else if (type === "adverb" && tags.has("adj")) {
    suggestion = adverbOf(w);
    extra = ` “${word}” describes a thing. To tell HOW, add -ly: “${suggestion}”.`;
  } else if ((type === "adjective" || type === "color") && tags.has("adv")) {
    const base = baseForms(w).find((b) => b !== w && isAdjBase(b));
    if (base && type === "adjective") {
      suggestion = base;
      extra = ` Adverbs describe actions. Drop the -ly: “${base}”.`;
    }
  } else if (type === "comparative" && (tags.has("adj") || tags.has("sup"))) {
    const base = tags.has("adj") ? w : baseForms(w).find((b) => b !== w && isAdjBase(b)) ?? w;
    suggestion = comparative(base);
    extra = ` To compare two things, try “${suggestion}”.`;
  } else if (type === "superlative" && (tags.has("adj") || tags.has("comp"))) {
    const base = tags.has("adj") ? w : baseForms(w).find((b) => b !== w && isAdjBase(b)) ?? w;
    suggestion = superlative(base);
    extra = ` For the most of all, try “${suggestion}”.`;
  } else if (type === "pronoun-subject" && tags.has("pron")) {
    suggestion = SUBJ_FOR[w];
    extra = ` “${word}” is an object or owner word. The one DOING the action needs a subject pronoun${suggestion ? `: “${suggestion}”` : ""}.`;
  } else if (type === "pronoun-object" && tags.has("pron")) {
    suggestion = OBJ_FOR[w];
    extra = ` “${word}” is a subject or owner word. The one GETTING the action needs an object pronoun${suggestion ? `: “${suggestion}”` : ""}.`;
  } else if (type === "color" && tags.has("adj")) {
    extra = ` It's a describing word, but not a color.`;
  }
  return {
    verdict: "hint",
    message: `“${word}” looks like ${describe(tags)}. This blank wants ${WANT[type]}.${extra}`,
    suggestion: suggestion && suggestion !== w ? suggestion : undefined,
  };
}

/** Which word tags fill which blanks. */
export function fits(tags: Set<Tag>, type: BlankType): boolean {
  switch (type) {
    case "noun": return tags.has("noun") || tags.has("plural");
    case "plural-noun": return tags.has("plural");
    case "verb": return tags.has("verb");
    case "verb-past": return tags.has("past");
    case "verb-ing": return tags.has("ing");
    case "adjective": return tags.has("adj") || tags.has("color") || tags.has("comp") || tags.has("sup") || tags.has("ing");
    case "color": return tags.has("color");
    case "number": return tags.has("num");
    case "adverb": return tags.has("adv");
    case "pronoun-subject": return tags.has("pron-subj") || (tags.has("pron") && !tags.has("pron-obj") && !tags.has("pron-poss"));
    case "pronoun-object": return tags.has("pron-obj") || (tags.has("pron") && !tags.has("pron-subj") && !tags.has("pron-poss"));
    case "preposition": return tags.has("prep");
    case "comparative": return tags.has("comp");
    case "superlative": return tags.has("sup");
    case "sound": case "simile": case "vocab": return true;
  }
}

/** A number for a number blank ("three" → 3, "12" → 12), or null. */
export function numberValue(raw: string): number | null {
  const w = raw.trim().toLowerCase().replace(/\s+/g, " ");
  if (NUMERAL.test(w)) return Number(w);
  if (NUMBER_WORDS.has(w)) return NUMBER_WORDS.get(w)!;
  // "twenty two", "twenty-two"
  const parts = w.split(/[\s-]+/).filter((p) => p !== "and");
  if (parts.length > 1 && parts.every((p) => NUMBER_WORDS.has(p))) {
    let total = 0;
    let cur = 0;
    for (const p of parts) {
      const n = NUMBER_WORDS.get(p)!;
      if (n === 100) cur = (cur || 1) * 100;
      else if (n >= 1000) { total += (cur || 1) * n; cur = 0; }
      else cur += n;
    }
    return total + cur;
  }
  return null;
}

export { isAdjBase };
