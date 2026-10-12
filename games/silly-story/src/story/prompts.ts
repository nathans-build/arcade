/*
 * What the game asks for each blank, in kid-friendly words, and the NC ELA language standard
 * it practices (NC Standard Course of Study, Language strand).
 */
import type { Grade } from "../kit/types";
import type { Band, Blank, BlankType } from "./types";
import { SIMILES, VOCAB } from "./vocab";

export const NOUN_HINTS: Record<string, { label: string; early: string }> = {
  animal: { label: "an animal", early: "an animal" },
  food: { label: "a food", early: "something to eat" },
  thing: { label: "a thing", early: "a thing" },
  vehicle: { label: "something that goes (a vehicle)", early: "something that goes" },
  person: { label: "a kind of person", early: "a person" },
  place: { label: "a place", early: "a place" },
};

export function bandOf(g: Grade): Band {
  const n = g === "K" ? 0 : Number(g);
  return n <= 2 ? "K-2" : n <= 5 ? "3-5" : n <= 8 ? "6-8" : "9-12";
}

interface TypeInfo {
  /** Big label, e.g. "ADJECTIVE". */
  name: string;
  /** K-2 name. */
  early: string;
  def: string;
  earlyDef: string;
  examples: string[];
}

const INFO: Record<BlankType, TypeInfo> = {
  noun: { name: "NOUN", early: "NAMING WORD", def: "a person, place, animal or thing", earlyDef: "a person, animal, place or thing", examples: ["taco", "dragon", "castle"] },
  "plural-noun": { name: "PLURAL NOUN", early: "MORE THAN ONE", def: "more than one person, place, animal or thing", earlyDef: "more than one thing", examples: ["tacos", "puppies", "mice"] },
  verb: { name: "VERB", early: "ACTION WORD", def: "an action word, something you can do", earlyDef: "something you can do", examples: ["jump", "wiggle", "sing"] },
  "verb-past": { name: "PAST-TENSE VERB", early: "ACTION THAT ALREADY HAPPENED", def: "an action that already happened", earlyDef: "something that already happened", examples: ["jumped", "danced", "swam"] },
  "verb-ing": { name: "VERB ENDING IN -ING", early: "-ING ACTION WORD", def: "an action word ending in -ing", earlyDef: "an action word with -ing", examples: ["dancing", "snoring", "spinning"] },
  adjective: { name: "ADJECTIVE", early: "DESCRIBING WORD", def: "a describing word that tells what something is like", earlyDef: "a word that tells what something is like", examples: ["fuzzy", "huge", "sparkly"] },
  color: { name: "COLOR", early: "COLOR WORD", def: "a color word", earlyDef: "a color", examples: ["purple", "green", "gold"] },
  number: { name: "NUMBER", early: "NUMBER", def: "a number word or numeral", earlyDef: "a number", examples: ["three", "12", "a zillion"] },
  adverb: { name: "ADVERB", early: "HOW WORD", def: "tells HOW something is done (often ends in -ly)", earlyDef: "tells how", examples: ["quickly", "loudly", "sleepily"] },
  "pronoun-subject": { name: "SUBJECT PRONOUN", early: "PRONOUN", def: "takes the place of a name and DOES the action", earlyDef: "a word like he, she or they", examples: ["she", "they", "we"] },
  "pronoun-object": { name: "OBJECT PRONOUN", early: "PRONOUN", def: "takes the place of a name and GETS the action", earlyDef: "a word like him, her or them", examples: ["him", "them", "us"] },
  preposition: { name: "PREPOSITION", early: "WHERE WORD", def: "tells where or when something is", earlyDef: "tells where", examples: ["under", "behind", "across"] },
  comparative: { name: "COMPARATIVE ADJECTIVE", early: "COMPARING WORD", def: "compares TWO things (often ends in -er)", earlyDef: "compares two things", examples: ["bigger", "sillier", "more sparkly"] },
  superlative: { name: "SUPERLATIVE ADJECTIVE", early: "MOST OF ALL WORD", def: "the MOST of all (often ends in -est)", earlyDef: "the most of all", examples: ["biggest", "silliest", "most sparkly"] },
  sound: { name: "SILLY SOUND", early: "SILLY SOUND", def: "a sound effect or exclamation", earlyDef: "a funny sound", examples: ["BOING", "kersplat", "yippee"] },
  simile: { name: "SIMILE", early: "SIMILE", def: "compares two things using LIKE or AS", earlyDef: "compares with like or as", examples: ["like a rocket", "as quiet as snow"] },
  vocab: { name: "PRECISE WORD", early: "PRECISE WORD", def: "the most exact word you can think of", earlyDef: "an exact word", examples: [] },
};

export interface PromptInfo {
  name: string;
  /** "Give me an ADJECTIVE: a describing word, like fuzzy or huge." */
  sentence: string;
  def: string;
  examples: string[];
  hint?: string;
  standard: string;
  skill: string;
}

const an = (w: string) => (/^[AEIOU]/i.test(w) ? "an" : "a");

export function promptFor(b: Blank, grade: Grade): PromptInfo {
  const early = bandOf(grade) === "K-2";
  const t = INFO[b.type];
  let name = early ? t.early : t.name;
  let def = early ? t.earlyDef : t.def;
  let examples = t.examples;
  let hint: string | undefined;
  if ((b.type === "noun" || b.type === "plural-noun") && b.hint && NOUN_HINTS[b.hint]) {
    hint = early ? NOUN_HINTS[b.hint].early : NOUN_HINTS[b.hint].label;
    examples = NOUN_EXAMPLES[b.hint] ?? examples;
    if (b.type === "plural-noun") examples = examples.map((e) => PLURAL_EX[e] ?? `${e}s`);
  }
  if (b.type === "vocab" && b.hint && VOCAB[b.hint]) {
    const v = VOCAB[b.hint];
    name = "PRECISE WORD";
    def = v.prompt;
    examples = [v.words[0]];
  }
  if (b.type === "simile") {
    const s = b.hint ? SIMILES[b.hint] : undefined;
    if (s) hint = s.prompt;
    examples = s ? s.examples.slice(0, 2) : t.examples;
  }
  const exText = examples.length ? `, like ${examples.slice(0, 2).join(" or ")}` : "";
  const sentence =
    b.type === "vocab"
      ? `Give me ${def}, like ${examples[0]}.`
      : `${early ? "Pick" : "Give me"} ${an(name)} ${name}${hint ? ` (${hint})` : ""}: ${def}${exText}.`;
  const std = standardFor(b.type, grade);
  return { name, sentence, def, examples, hint, standard: std.code, skill: std.skill };
}

const NOUN_EXAMPLES: Record<string, string[]> = {
  animal: ["elephant", "penguin", "dragon"],
  food: ["taco", "pizza", "pickle"],
  thing: ["umbrella", "trumpet", "sock"],
  vehicle: ["rocket", "bus", "submarine"],
  person: ["pirate", "chef", "astronaut"],
  place: ["castle", "beach", "library"],
};
const PLURAL_EX: Record<string, string> = { taco: "tacos", pizza: "pizzas", pickle: "pickles", bus: "buses", beach: "beaches", library: "libraries" };

const SKILL: Record<BlankType, string> = {
  noun: "Nouns", "plural-noun": "Plural nouns", verb: "Verbs", "verb-past": "Past-tense verbs", "verb-ing": "Verbs with -ing",
  adjective: "Adjectives", color: "Adjectives (colors)", number: "Number words", adverb: "Adverbs", "pronoun-subject": "Pronouns (subject case)",
  "pronoun-object": "Pronouns (object case)", preposition: "Prepositions", comparative: "Comparative adjectives", superlative: "Superlative adjectives",
  sound: "Interjections", simile: "Similes (figurative language)", vocab: "Precise words & connotation",
};

/**
 * The NC ELA standard a blank practices at a grade. Codes follow the NC Standard Course of Study
 * Language strand (L.K.1b nouns & verbs, L.1.1 parts of speech, L.2.1, L.3.1a functions of parts of
 * speech, L.6.1a pronoun case, L.x.5 figurative language and nuances in word meanings).
 */
export function standardFor(type: BlankType, grade: Grade): { code: string; skill: string } {
  const n = grade === "K" ? 0 : Number(grade);
  const skill = SKILL[type];
  const hs = n >= 11 ? "11-12" : "9-10";
  const pick = (): string => {
    if (type === "simile") return n <= 4 ? "L.4.5a" : n <= 8 ? `L.${n}.5a` : `L.${hs}.5a`;
    if (type === "vocab") return n <= 5 ? "L.5.5c" : n <= 8 ? `L.${n}.5c` : `L.${hs}.5b`;
    switch (n) {
      case 0:
        if (type === "noun" || type === "verb") return "L.K.1b";
        if (type === "plural-noun") return "L.K.1c";
        if (type === "preposition") return "L.K.1e";
        return "L.K.1";
      case 1:
        return ({ noun: "L.1.1b", "plural-noun": "L.1.1c", verb: "L.1.1e", "verb-past": "L.1.1e", "verb-ing": "L.1.1e", adjective: "L.1.1f", color: "L.1.1f",
          comparative: "L.1.1f", superlative: "L.1.1f", "pronoun-subject": "L.1.1d", "pronoun-object": "L.1.1d", preposition: "L.1.1i" } as Partial<Record<BlankType, string>>)[type] ?? "L.1.1";
      case 2:
        return ({ "plural-noun": "L.2.1b", "verb-past": "L.2.1d", adjective: "L.2.1e", color: "L.2.1e", adverb: "L.2.1e", comparative: "L.2.1e", superlative: "L.2.1e" } as Partial<Record<BlankType, string>>)[type] ?? "L.2.1";
      case 3:
        return ({ "plural-noun": "L.3.1b", "verb-past": "L.3.1d", comparative: "L.3.1g", superlative: "L.3.1g", sound: "L.3.1", number: "L.3.1", preposition: "L.3.1" } as Partial<Record<BlankType, string>>)[type] ?? "L.3.1a";
      case 4:
        return ({ "verb-ing": "L.4.1b", preposition: "L.4.1e" } as Partial<Record<BlankType, string>>)[type] ?? "L.4.1";
      case 5:
        return ({ preposition: "L.5.1a", sound: "L.5.1a" } as Partial<Record<BlankType, string>>)[type] ?? "L.5.1";
      case 6:
        return type === "pronoun-subject" || type === "pronoun-object" ? "L.6.1a" : "L.6.1";
      case 7:
      case 8:
        return `L.${n}.1`;
      default:
        return `L.${hs}.1`;
    }
  };
  return { code: pick(), skill };
}

/** Big name for a type, for buttons and the legend. */
export function typeName(t: BlankType, early = false): string {
  return early ? INFO[t].early : INFO[t].name;
}
