import type { Grade } from "@/kit";

/** The subjects Cube Hop plays (the kit also has social studies, which this game leaves out). */
export type Subject = "ela" | "math" | "science";
export type SubjectMode = Subject | "mixed";

/** A wrong label placed on the pyramid, with the reason shown when the hero lands on it. */
export interface Distractor {
  label: string;
  why: string;
}

/**
 * "Build it" round: hop onto the cubes in order to build a sentence or a true equation.
 * `tokens` is the canonical order; `orders` lists every accepted order (the canonical one
 * first). Written items list extra orders in `alts`; math items compute them.
 */
export interface BuildItem {
  id: string;
  subject: Subject;
  grades: Grade[];
  standard: string;
  skill: string;
  /** What the banner shows (and read-aloud says). */
  prompt: string;
  tokens: string[];
  alts?: string[][];
  distractors: Distractor[];
  /** One or two sentences shown after the round, teaching the point. */
  explain: string;
}

export interface BuiltItem extends BuildItem {
  orders: string[][];
}

/**
 * "Colour the category" round: colour every cube whose label fits the rule.
 * `no` entries may carry a part of speech or kind after a slash ("quickly/adverb") that the
 * reason text uses; the slash part is never shown on a cube.
 */
export interface CategoryRule {
  id: string;
  subject: Subject;
  grades: Grade[];
  standard: string;
  skill: string;
  /** Short rule name for the banner and the canvas, e.g. "NOUNS". */
  target: string;
  prompt: string;
  yes: string[];
  no: string[];
  /** "{x}" is replaced by the label, "{k}" by the kind after the slash. */
  yesWhy: string;
  noWhy: string;
  notes?: Record<string, string>;
  /** Math rules: computes membership from the label itself (the lists are checked against it). */
  test?: (label: string) => boolean;
  /** Math rules: a computed reason, e.g. "3×5 = 15, not 16." */
  why?: (label: string, match: boolean) => string;
}

export interface RuleLabel {
  label: string;
  match: boolean;
  why: string;
}

/** Splits "quickly/adverb" into the label and its kind. */
export function splitKind(entry: string): { label: string; kind: string } {
  const i = entry.lastIndexOf("/");
  if (i <= 0 || i === entry.length - 1 || /\d/.test(entry.slice(i + 1))) return { label: entry, kind: "" };
  return { label: entry.slice(0, i), kind: entry.slice(i + 1) };
}

const article = (k: string) => (/^[aeiou]/i.test(k) ? `an ${k}` : `a ${k}`);

/** Every label of a rule, with whether it matches and the reason to show. */
export function ruleLabels(rule: CategoryRule): RuleLabel[] {
  const fill = (tpl: string, label: string, kind: string) =>
    tpl.replace(/\{x\}/g, label).replace(/\{ak\}/g, article(kind)).replace(/\{k\}/g, kind);
  const out: RuleLabel[] = [];
  for (const [list, match] of [[rule.yes, true], [rule.no, false]] as const) {
    for (const entry of list) {
      const { label, kind } = splitKind(entry);
      const why = rule.notes?.[label] ?? rule.why?.(label, match) ?? fill(match ? rule.yesWhy : rule.noWhy, label, kind);
      out.push({ label, match, why });
    }
  }
  return out;
}
