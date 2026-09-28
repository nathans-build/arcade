import type { Grade, Subject } from "@/kit/types";

/** One log label. `why` is the short reason shown when the hero lands on it. */
export interface RuleItem {
  label: string;
  why: string;
  /** How read-aloud should say the label, when it differs from the text. */
  say?: string;
}

/**
 * A round's rule: "HOP ON NOUNS". River logs carry `matches` (safe, they score) and
 * `misses` (they sink). Rules in the same `family` are variants of one idea
 * (nouns / verbs / adjectives), so the game can avoid repeating an idea twice in a row.
 */
export interface Rule {
  id: string;
  family: string;
  subject: Subject;
  grade: Grade;
  /** NC Standard Course of Study code, in the kit's style. */
  standard: string;
  /** Short skill name for the mission report. */
  skill: string;
  /** Shown on the rule bar and in-canvas, e.g. "HOP ON NOUNS". */
  text: string;
  /** Read-aloud version of the rule. */
  say: string;
  /** One-line reminder of what the rule means. */
  hint: string;
  matches: RuleItem[];
  misses: RuleItem[];
  /** Set by category rules: the family's categories never share a label. */
  exclusive?: boolean;
}

export type Entry = string | { label: string; why?: string; say?: string };

export interface Category {
  /** With an article, as it reads in a sentence: "a noun", "an adult animal". */
  name: string;
  items: Entry[];
}

export interface Target {
  key: string;
  text: string;
  say: string;
  hint: string;
  /** Overrides the set's standard for this target. */
  standard?: string;
  skill?: string;
}

const label = (e: Entry) => (typeof e === "string" ? e : e.label);

/**
 * Builds rules from a set of categories: each target category becomes a rule whose matches
 * are that category's items and whose misses are every other category's items.
 * Default reasons: "RUN is a verb, not a noun." Items can give their own `why`.
 */
export function catRules(o: {
  family: string;
  subject: Subject;
  grade: Grade;
  standard: string;
  skill: string;
  cats: Record<string, Category>;
  targets: Target[];
}): Rule[] {
  return o.targets.map((t) => {
    const target = o.cats[t.key];
    if (!target) throw new Error(`${o.family}: no category ${t.key}`);
    const matches: RuleItem[] = target.items.map((e) => ({
      label: label(e),
      say: typeof e === "string" ? undefined : e.say,
      why: (typeof e !== "string" && e.why) || `${label(e)} is ${target.name}.`,
    }));
    const misses: RuleItem[] = [];
    for (const [key, cat] of Object.entries(o.cats)) {
      if (key === t.key) continue;
      for (const e of cat.items) {
        misses.push({
          label: label(e),
          say: typeof e === "string" ? undefined : e.say,
          why: (typeof e !== "string" && e.why) || `${label(e)} is ${cat.name}, not ${target.name}.`,
        });
      }
    }
    return {
      id: `${o.family}-${t.key.toLowerCase()}`,
      family: o.family,
      subject: o.subject,
      grade: o.grade,
      standard: t.standard ?? o.standard,
      skill: t.skill ?? o.skill,
      text: t.text,
      say: t.say,
      hint: t.hint,
      matches,
      misses,
      exclusive: true,
    };
  });
}

/** A rule written as two explicit lists (used for math, where the checker recomputes every item). */
export function listRule(o: Omit<Rule, "matches" | "misses" | "family"> & {
  family?: string;
  matches: RuleItem[];
  misses: RuleItem[];
}): Rule {
  return { ...o, family: o.family ?? o.id };
}

/** Builds items from labels with a reason function. */
export function items(labels: string[], why: (label: string) => string, say?: (label: string) => string | undefined): RuleItem[] {
  return labels.map((l) => ({ label: l, why: why(l), say: say?.(l) }));
}
