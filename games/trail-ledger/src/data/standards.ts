/*
 * Grade bands and NC Standard Course of Study codes for era questions.
 *
 * - Grade 5 items are authored with grade-5 codes (5.G.1.2, 5.H.1.1 …).
 * - Grades 6–8 items are authored with grade-8 codes (NC and U.S. history). Grades 6 and 7 study
 *   world history in NC, so they see the same grade-8 codes marked "preview" (decision 3, issue #21).
 * - Grades 9–12 items are authored with American History codes (AH.*). Grade 9 (World History)
 *   sees the matching grade-8 standard marked "preview"; grades 10–12 see the AH code.
 * - Grade 12 budgeting math is tagged EPF.MCM.1.1 (see src/sim/trailmath.ts).
 */
import type { Grade } from "@/kit/types";
import { gradeNumber } from "@/kit/grades";
import type { Band, BankItem } from "./types";

export const MIN_GRADE = 5;

export function playable(g: Grade): boolean {
  return gradeNumber(g) >= MIN_GRADE;
}

export function bandOf(g: Grade): Band {
  const n = gradeNumber(g);
  return n <= 5 ? 0 : n <= 8 ? 1 : 2;
}

export const BAND_LABEL: Record<Band, string> = { 0: "Grade 5", 1: "Grades 6–8", 2: "Grades 9–12" };

/** AH strand → grade-8 standard used as a "preview" code for grade 9. */
const AH_TO_8: Record<string, string> = { H: "8.H.1", G: "8.G.1", E: "8.E.1", "C&G": "8.C&G.1", B: "8.B.1" };

export function strandOf(code: string): string {
  const m = code.match(/^(?:AH|\d+)\.(C&G|[A-Z]+)\./);
  return m ? m[1] : "H";
}

export function codeFor(item: Pick<BankItem, "code" | "band">, grade: Grade): { code: string; preview: boolean } {
  const n = gradeNumber(grade);
  if (item.band === 1 && (n === 6 || n === 7)) return { code: item.code, preview: true };
  if (item.band === 2 && n === 9) return { code: AH_TO_8[strandOf(item.code)] ?? "8.H.1", preview: true };
  return { code: item.code, preview: false };
}

/** Allowed code shapes per band (the test checks every bank item). */
export const CODE_RE: Record<Band, RegExp> = {
  0: /^5\.(H|G|E|B|C&G)\.\d(\.\d)?$/,
  1: /^8\.(H|G|E|B|C&G)\.\d(\.\d)?$/,
  2: /^AH\.(H|G|E|B|C&G)\.\d(\.\d)?$/,
};

/** Short names for codes, shown in the report next to the skill. */
export const CODE_NAMES: Record<string, string> = {
  "5.G.1.2": "Movement of people, goods and ideas",
  "5.G.1.3": "Human–environment interaction",
  "5.H.1.1": "Events and turning points",
  "5.H.1.3": "Primary sources and perspectives",
  "5.E.2.2": "Budgets and spending",
  "5.B.1.1": "Groups and identity",
  "8.H.1.1": "Change and continuity",
  "8.H.1.2": "Causes and effects",
  "8.H.1.3": "Multiple perspectives",
  "8.H.1.4": "Primary and secondary sources",
  "8.H.1.5": "Historical decision-making",
  "8.G.1.2": "Movement and migration",
  "8.E.1.1": "Economic decisions",
  "8.B.1.1": "Relationships among groups",
  "8.C&G.1.1": "Rights and freedoms",
  "8.H.1": "NC and U.S. history",
  "8.G.1": "Location and movement",
  "8.E.1": "Economic growth and decline",
  "8.C&G.1": "Rights and government",
  "8.B.1": "Relationships among groups",
  "AH.G.1.1": "Migration and settlement",
  "AH.G.1.3": "Land, place and conflict",
  "AH.H.1": "Turning points in U.S. history",
  "AH.E.1": "Economic opportunity and labor",
  "AH.C&G.1": "Rights, law and justice",
  "AH.B.1": "Identity and community",
};
