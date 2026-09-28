import type { Grade, Subject } from "@/kit";

/**
 * A street's delivery rule: every house on the street shows a short label, and the
 * player delivers only to houses whose label matches the rule.
 *
 * Labels are at most 10 characters (not counting font markup: `{..}` superscript,
 * `[..]` subscript) so they fit on a house sign at 320×200.
 */
export interface DeliveryRule {
  id: string;
  subject: Subject;
  /** Grades that ride this street. */
  grades: Grade[];
  /** NC Standard Course of Study code, in the kit's format. */
  standard: string;
  /** Short skill name for the mission report. */
  skill: string;
  /** Big word(s) on the rule sign, e.g. "PRODUCERS". */
  target: string;
  /** Full rule sentence, shown in the banner and read aloud. */
  prompt: string;
  /** Labels that match the rule (≥ 8). */
  yes: string[];
  /** Labels that do not match (≥ 8). */
  no: string[];
  /** Why a matching label matches ("{x}" is replaced with the label). */
  yesWhy: string;
  /** Why a non-matching label does not ("{x}" is replaced with the label). */
  noWhy: string;
  /** Extra teaching notes for particular labels (traps). */
  notes?: Record<string, string>;
  /** Optional computed explanation (math rules): overrides yesWhy/noWhy. */
  why?: (label: string, match: boolean) => string;
  /**
   * Math rules only: the classifier, computed from the label itself.
   * The test script checks every `yes` label passes and every `no` label fails.
   */
  test?: (label: string) => boolean;
}
