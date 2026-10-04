import type { Question } from "@/kit/types";
import type { Calc } from "@/sim/trailmath";

/** A question as Trail Ledger asks it: a kit Question plus where it came from. */
export interface TLQuestion extends Question {
  source: "math" | "era" | "kit";
  /** Grades 6, 7 and 9 see grade-8 codes marked "preview". */
  preview?: boolean;
  /** For generated math: the numbers, so tests can recompute the answer. */
  calc?: Calc;
  /** Grade 5: shown after a first wrong answer. */
  hint?: string;
}

/** Fisher–Yates shuffle of the four choices with a supplied random source. */
export function dealWith(q: TLQuestion, rand: () => number): TLQuestion {
  const order = [0, 1, 2, 3];
  for (let i = 3; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  return { ...q, choices: order.map((i) => q.choices[i]) as Question["choices"], answer: order.indexOf(q.answer) };
}

/** Small seeded generator (mulberry32) so a run can be replayed in tests. */
export function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
