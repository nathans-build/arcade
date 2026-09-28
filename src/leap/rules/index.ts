import type { Grade, Subject } from "@/kit/types";
import type { SubjectMode } from "@/kit/deck";
import { ELA_RULES } from "./ela";
import { MATH_RULES } from "./math";
import { SCIENCE_RULES } from "./science";
import type { Rule, RuleItem } from "./types";

export type { Rule, RuleItem };

export const ALL_RULES: Rule[] = [...MATH_RULES, ...SCIENCE_RULES, ...ELA_RULES];

export function rulesFor(grade: Grade, subject: Subject): Rule[] {
  return ALL_RULES.filter((r) => r.grade === grade && r.subject === subject);
}

function pick<T>(a: readonly T[]): T {
  return a[Math.floor(Math.random() * a.length)];
}

/**
 * Chooses each round's rule: cycles subjects in mixed mode, never repeats an idea (family)
 * twice in a row, and works through every family before repeating one.
 */
export class RulePicker {
  private subjects: Subject[];
  private turn = Math.floor(Math.random() * 3);
  private usedFamilies = new Set<string>();
  private lastFamily = "";

  constructor(private grade: Grade, mode: SubjectMode) {
    this.subjects = mode === "mixed" ? ["math", "science", "ela"] : [mode];
  }

  next(): Rule {
    const subject = this.subjects[this.turn++ % this.subjects.length];
    const rules = rulesFor(this.grade, subject);
    const families = [...new Set(rules.map((r) => r.family))];
    let fresh = families.filter((f) => !this.usedFamilies.has(f) && f !== this.lastFamily);
    if (fresh.length === 0) {
      families.forEach((f) => this.usedFamilies.delete(f));
      fresh = families.filter((f) => f !== this.lastFamily);
      if (fresh.length === 0) fresh = families;
    }
    const family = pick(fresh);
    this.usedFamilies.add(family);
    this.lastFamily = family;
    return pick(rules.filter((r) => r.family === family));
  }
}
