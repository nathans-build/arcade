/*
 * NC Standard Course of Study (Social Studies, 2021) codes for what a case practises, by grade.
 * Grade 5 (US history in NC) plays the light cases tagged 5.G.1.2 / 5.G.1.3, as the plan decided.
 * Grade 8 (NC and US history) plays every case as review, tagged with the case's home grade (6 or 7).
 * Grades 9-12 use World History codes (the kit's grade 9 course).
 * See README "Codes to verify".
 */
import { gradeNumber } from "@/kit/grades";
import type { Grade } from "@/kit/types";
import type { Case, SkillId } from "./types";

export const SKILL_NAMES: Record<SkillId, string> = {
  chronology: "Chronology: what came next",
  diffusion: "Diffusion: where and when it moved",
  cause: "Cause and effect: why it moved",
  sourcing: "Sourcing and corroboration",
};

const G5: Record<string, string> = {
  paper: "5.G.1.3", // technology and innovation
  gold: "5.G.1.2", // movement of people and goods
  exchange: "5.G.1.2",
};

const G6: Record<SkillId, string> = { chronology: "6.H.1", diffusion: "6.G.1.2", cause: "6.E.1.1", sourcing: "6.H.1.3" };
const G7: Record<SkillId, string> = { chronology: "7.H.1.1", diffusion: "7.G.1", cause: "7.E.1.2", sourcing: "7.H.1.1" };
const WH: Record<SkillId, string> = { chronology: "WH.H.1.1", diffusion: "WH.G.1.2", cause: "WH.E.1.2", sourcing: "WH.H.1.1" };

/** Every code the game may record (the tests check content against this list). */
export const ALLOWED_CODES = new Set<string>([
  "5.G.1.2", "5.G.1.3",
  ...Object.values(G6), ...Object.values(G7), ...Object.values(WH),
  "7.C&G.1.1", "WH.C&G.1.1", "WH.G.1.1", "7.G.1.1",
]);

/** The NC code for a skill practised in a case, for a player's grade. */
export function codeFor(grade: Grade, c: Case, skill: SkillId): string {
  const n = gradeNumber(grade);
  if (n <= 5) return G5[c.id] ?? "5.G.1.3";
  if (n >= 9) {
    if (skill === "cause" && c.id === "rights") return "WH.C&G.1.1";
    if (skill === "cause" && (c.id === "steam" || c.id === "exchange")) return "WH.G.1.1"; // forced migration, settlement, effects
    return WH[skill];
  }
  const home = n === 6 ? 6 : n === 7 ? 7 : c.grades.includes("7") ? 7 : 6;
  if (home === 6) return G6[skill];
  if (skill === "cause" && c.id === "rights") return "7.C&G.1.1";
  if (skill === "cause" && c.id === "exchange") return "7.G.1.1"; // push-pull, forced migration
  return G7[skill];
}
