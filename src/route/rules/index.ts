import type { Grade, Subject } from "@/kit";
import { ELA_RULES } from "./ela";
import { MATH_RULES } from "./math";
import { SCIENCE_RULES } from "./science";
import type { DeliveryRule } from "./types";

export type { DeliveryRule } from "./types";
export { plainLabel } from "../font";

export const ALL_RULES: DeliveryRule[] = [...SCIENCE_RULES, ...MATH_RULES, ...ELA_RULES];

/** Rules for one subject at one grade. */
export function rulesFor(grade: Grade, subject: Subject): DeliveryRule[] {
  return ALL_RULES.filter((r) => r.subject === subject && r.grades.includes(grade));
}

/** Does `label` match the rule? */
export function matches(rule: DeliveryRule, label: string): boolean {
  return rule.yes.includes(label);
}

/** Kid-friendly explanation for delivering to (or skipping) `label`. */
export function explain(rule: DeliveryRule, label: string, plain: (s: string) => string): string {
  const m = matches(rule, label);
  const note = rule.notes?.[label];
  if (note) return note;
  if (rule.why) return rule.why(label, m);
  return (m ? rule.yesWhy : rule.noWhy).split("{x}").join(plain(label));
}
