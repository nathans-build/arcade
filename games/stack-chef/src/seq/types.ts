import type { Grade, Subject } from "../kit/types";
import type { Band } from "../chef/layout";

export type { Band };
export type SeqSubject = Exclude<Subject, "social">;

/** One level's goal: a stack to build in order, bottom (first) to top (last). */
export interface Sequence {
  id: string;
  subject: SeqSubject;
  /** Grades this sequence is written for (all in one band). */
  grades: Grade[];
  /** NC Standard Course of Study code, e.g. "LS.2.1", "RL.4.3", "NC.6.NS.7". */
  standard: string;
  /** Short skill name for the mission report. */
  skill: string;
  /** What to build, e.g. "BUTTERFLY LIFE CYCLE" (upper case, ≤ 34 characters). */
  title: string;
  /** What the bottom and top of the stack mean, e.g. ["FIRST", "LAST"] or ["LEAST", "GREATEST"]. */
  ends: [string, string];
  /** Slab labels, bottom (first) to top (last). Each ≤ 12 characters, all different. */
  steps: string[];
  /** Context to read: a short original story, an expression, or where a cycle starts. */
  passage?: string;
  /** How to say each label aloud when it differs from the text (e.g. "2⁵" → "2 to the 5th"). */
  say?: string[];
  /** A short note per step, used when a slab arrives too early ("3x = 15: subtract 5 from both sides"). */
  notes?: string[];
  /** For value orders: each step's value (checked to be strictly increasing or decreasing). */
  values?: number[];
  /** Shown and read aloud when the stack is complete. */
  explain: string;
}

export function bandOf(g: Grade): Band {
  const n = g === "K" ? 0 : Number(g);
  if (n <= 2) return "k2";
  if (n <= 5) return "35";
  if (n <= 8) return "68";
  return "hs";
}

export const BAND_GRADES: Record<Band, Grade[]> = {
  k2: ["K", "1", "2"],
  "35": ["3", "4", "5"],
  "68": ["6", "7", "8"],
  hs: ["9", "10", "11", "12"],
};
