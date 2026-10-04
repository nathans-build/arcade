/*
 * Browser-only hooks into the arcade kit: adaptive math (mathGradeFor / markAdaptive) and the
 * kit's social-studies deck, mixed into transmissions only where it is on topic:
 * grades 5, 8 and 11 (items matching the expedition's topic) and grade 12 (budgeting, EPF.MCM.1).
 */
import { bankFor, gradeNumber, markAdaptive, mathGradeFor, type Grade, type Question } from "@/kit";
import { EXP_BY_ID } from "@/data/expeditions";
import type { ExpeditionId } from "@/data/types";
import type { QuestionHooks } from "./questions";
import type { TLQuestion } from "./question";

const used = new Set<string>();

function kitPick(grade: Grade, exp: ExpeditionId): TLQuestion | null {
  const n = gradeNumber(grade);
  let pool: Question[] = [];
  if (n === 5 || n === 8 || n === 11) {
    const topic = EXP_BY_ID[exp].topic;
    pool = bankFor("social", grade).filter((q) => topic.test(`${q.prompt} ${q.explanation} ${q.skill}`));
  } else if (n === 12) {
    pool = bankFor("social", grade).filter((q) => q.standard.startsWith("EPF.MCM.1"));
  }
  const fresh = pool.filter((q) => !used.has(q.id));
  if (!fresh.length) return null;
  const q = fresh[Math.floor(Math.random() * fresh.length)];
  used.add(q.id);
  return { ...q, source: "kit" };
}

export const BROWSER_HOOKS: QuestionHooks = {
  mathGrade: (g) => gradeNumber(mathGradeFor(g)),
  onMath: (q, g) => markAdaptive(q, g),
  kitPick,
};
