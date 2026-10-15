import type { Grade, Question } from "../kit/types";

/** Grade bands the café's content is written for. */
export type Band = "k2" | "g35" | "g68" | "hs";

export function gradeN(g: Grade): number {
  return g === "K" ? 0 : Number(g);
}

export function bandOf(g: Grade): Band {
  const n = gradeN(g);
  return n <= 2 ? "k2" : n <= 5 ? "g35" : n <= 8 ? "g68" : "hs";
}

/** The arcade topic ids this game can focus on (site/games.js window.TOPICS). */
export type TopicId = "physical" | "numbers" | "fractions" | "ratios" | "money";

/** Where in the café a question pops up (decides which station / moment asks it). */
export type Moment = "bowl" | "oven" | "stove" | "freezer" | "board" | "pay" | "any";

/**
 * A café question: a kit Question (correct choice first, shuffled when shown) plus what the
 * checker needs to recompute it: the generator key and its parameters.
 */
export interface Trial { label: string; value: number }
export interface Chart { title: string; unit: string; bars: Trial[] }

export interface CafeQ extends Question {
  /** Bake-Off bar chart shown with the question. */
  chart?: Chart;
  topic: TopicId;
  gen: string;
  params: Record<string, unknown>;
  moment: Moment;
}

export interface Draft {
  prompt: string;
  answer: string;
  wrong: string[];
  explanation: string;
  params: Record<string, unknown>;
}

/** Builds a question with exactly four different choices (answer first), or null if it can't. */
export function build(
  base: { id: string; subject: "math" | "science"; grade: Grade; standard: string; skill: string; topic: TopicId; gen: string; moment: Moment },
  d: Draft,
): CafeQ | null {
  const choices: string[] = [d.answer.trim()];
  for (const w of d.wrong) {
    const t = w.trim();
    if (t && choices.length < 4 && !choices.includes(t)) choices.push(t);
  }
  if (choices.length < 4 || !choices[0]) return null;
  return {
    ...base,
    prompt: d.prompt,
    choices: choices as Question["choices"],
    answer: 0,
    explanation: d.explanation,
    params: d.params,
  };
}

/** Shuffles a question's choices for display, keeping track of the right one. */
export function dealQ<T extends Question>(q: T, r: () => number = Math.random): T {
  const order = [0, 1, 2, 3];
  for (let i = 3; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  return { ...q, choices: order.map((i) => q.choices[i]) as Question["choices"], answer: order.indexOf(q.answer) };
}
