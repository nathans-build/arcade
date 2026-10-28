import type { Grade } from "../kit/types";

/** Grade bands used by the simulation's difficulty (this edition always plays the grade 6-8 band). */
export type Band = "k2" | "g35" | "g68" | "hs";

export function bandOf(g: Grade): Band {
  const n = g === "K" ? 0 : Number(g);
  if (n <= 2) return "k2";
  if (n <= 5) return "g35";
  if (n <= 8) return "g68";
  return "hs";
}
