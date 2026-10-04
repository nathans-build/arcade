/* Grade bands and everything that scales with them (the plan's grade-adaptation table). */
import { gradeNumber } from "@/kit/grades";
import type { Grade } from "@/kit/types";
import { CASES } from "@/cases";
import type { Band, Bead, Case } from "./types";

export function bandOf(g: Grade): Band {
  const n = gradeNumber(g);
  return n <= 5 ? "b5" : n <= 8 ? "b68" : "b912";
}

/** Reading levels to try, in order, for a band (a missing grade-5 line falls back to the 6-8 one). */
export function levels(b: Band): string[] {
  return b === "b5" ? ["b5", "b68", "b912"] : b === "b68" ? ["b68", "b912", "b5"] : ["b912", "b68", "b5"];
}

export const BAND_RULES: Record<Band, {
  label: string;
  beads: [number, number];
  witnesses: number;
  clueMax: number;
  sourceChecks: number;
  lantern: number;
  map: "named" | "named-era-on-tap" | "dial";
  reweave: "dates" | "centuries" | "hidden";
}> = {
  b5: { label: "Grade 5", beads: [4, 4], witnesses: 2, clueMax: 60, sourceChecks: 0, lantern: 14, map: "named", reweave: "dates" },
  b68: { label: "Grades 6–8", beads: [5, 5], witnesses: 3, clueMax: 100, sourceChecks: 1, lantern: 12, map: "named-era-on-tap", reweave: "centuries" },
  b912: { label: "Grades 9–12", beads: [5, 7], witnesses: 3, clueMax: 140, sourceChecks: 2, lantern: 10, map: "dial", reweave: "hidden" },
};

/** Hours: what each action costs (sensitive beads cost nothing: no clock there). */
export const COST = { witness: 1, deadEnd: 2, refuel: 1 };

/** The minimum grade for the game (K-4 see the "grades 5 and up" screen). */
export const MIN_GRADE = 5;

export function casesFor(g: Grade): Case[] {
  return CASES.filter((c) => c.grades.includes(g === "K" ? "K" : String(gradeNumber(g))));
}

export function beadsFor(c: Case, b: Band): Bead[] {
  return c.beads.filter((x) => x.bands.includes(b));
}
