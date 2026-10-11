import type { Grade, Question, Subject } from "../kit/types";

/** Grade bands used for Dojo Tower's own question sets and difficulty. */
export type Band = "k2" | "g35" | "g68" | "hs";

export const QUICK_PROMPT = 100;
export const QUICK_CHOICE = 14;

export function bandOf(g: Grade): Band {
  const n = g === "K" ? 0 : Number(g);
  if (n <= 2) return "k2";
  if (n <= 5) return "g35";
  if (n <= 8) return "g68";
  return "hs";
}

export function isQuickText(prompt: string, choices: readonly string[]): boolean {
  return prompt.length <= QUICK_PROMPT && choices.every((c) => c.length <= QUICK_CHOICE);
}

/** Builds a Question with the correct choice first; `quick` is computed from the lengths. */
export function makeQ(
  id: string,
  subject: Subject,
  grade: Grade,
  standard: string,
  skill: string,
  prompt: string,
  choices: [string, string, string, string],
  explanation: string,
): Question {
  const q: Question = { id, subject, grade, standard, skill, prompt, choices, answer: 0, explanation };
  if (isQuickText(prompt, choices)) q.quick = true;
  return q;
}
