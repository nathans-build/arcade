import type { Grade } from "../kit/types";

/** Grade bands used for Robo Masters' own question sets and difficulty. */
export type Band = "k2" | "g35" | "g68" | "hs";
export const BANDS: Band[] = ["k2", "g35", "g68", "hs"];

export function bandOf(g: Grade): Band {
  const n = g === "K" ? 0 : Number(g);
  if (n <= 2) return "k2";
  if (n <= 5) return "g35";
  if (n <= 8) return "g68";
  return "hs";
}

export const QUICK_PROMPT = 100;
export const QUICK_CHOICE = 14;
