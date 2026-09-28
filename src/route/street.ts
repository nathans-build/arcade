import type { Grade, Subject, SubjectMode } from "@/kit";
import { gradeNumber } from "@/kit/grades";
import { rulesFor, type DeliveryRule } from "./rules";

/* Pure street planning (no DOM), shared by the engine and the check script. */

export interface HousePlan {
  label: string;
  match: boolean;
}

function shuffle<T>(arr: readonly T[], rnd: () => number = Math.random): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Houses per street: fewer for the youngest riders. */
export function housesPerStreet(grade: Grade): number {
  const n = gradeNumber(grade);
  return n <= 2 ? 8 : n <= 5 ? 10 : 12;
}

/**
 * Labels for one street: about half match the rule (never fewer than 3 of each),
 * no label twice, and never three of the same kind in a row.
 */
export function planStreet(rule: DeliveryRule, count: number, rnd: () => number = Math.random): HousePlan[] {
  const nYes = Math.min(rule.yes.length, Math.max(3, Math.round(count * (0.45 + rnd() * 0.15))));
  const nNo = Math.min(rule.no.length, count - nYes);
  const yes = shuffle(rule.yes, rnd).slice(0, nYes).map((label) => ({ label, match: true }));
  const no = shuffle(rule.no, rnd).slice(0, nNo).map((label) => ({ label, match: false }));
  let houses = shuffle([...yes, ...no], rnd);
  for (let tries = 0; tries < 50; tries++) {
    const bad = houses.findIndex((h, i) => i >= 2 && h.match === houses[i - 1].match && h.match === houses[i - 2].match);
    if (bad < 0) break;
    houses = shuffle(houses, rnd);
  }
  return houses;
}

/**
 * Rotates through the rules for a grade and subject mode (science first in mixed mode),
 * shuffling each subject's rules and not repeating one until all have been ridden.
 */
export class RuleRotation {
  private subjects: Subject[];
  private queues = new Map<Subject, DeliveryRule[]>();
  private turn = 0;
  private last: string | null = null;

  constructor(private grade: Grade, mode: SubjectMode) {
    this.subjects = mode === "mixed" ? ["science", "math", "ela"] : [mode];
  }

  next(): DeliveryRule {
    const subject = this.subjects[this.turn++ % this.subjects.length];
    let q = this.queues.get(subject) ?? [];
    if (q.length === 0) {
      const all = rulesFor(this.grade, subject);
      q = shuffle(all);
      if (q.length > 1 && q[0].id === this.last) q.push(q.shift()!);
      this.queues.set(subject, q);
    }
    const r = q.shift()!;
    this.last = r.id;
    return r;
  }
}
