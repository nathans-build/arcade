/*
 * How long a code checkpoint waits for an answer.
 *
 *   RELAXED (default) — the car slows to a gentle cruise, pulls up just before the answer gates and
 *                        waits there until the player answers (key, tap, steering, or ▲ to go).
 *   NORMAL            — a generous countdown scaled by grade, prompt length and question type.
 *   SPEEDY            — about half of NORMAL (close to the game's original pace), with a floor.
 *
 * In NORMAL and SPEEDY the countdown only starts once read-aloud (when it is on) has finished.
 * No DOM here except the saved choice, so scripts/check-rules.ts can test the numbers.
 */
import type { CPQuestion, Family } from "./questions";

export type Timing = "relaxed" | "normal" | "speedy";
export const TIMINGS: { id: Timing; label: string; note: string }[] = [
  { id: "relaxed", label: "RELAXED", note: "Gate waits for you" },
  { id: "normal", label: "NORMAL", note: "Lots of time + timer" },
  { id: "speedy", label: "SPEEDY", note: "Fast, for a challenge" },
];
export const DEFAULT_TIMING: Timing = "relaxed";
export const TIMING_KEY = "arcade.cipher-pursuit.timing";

export function isTiming(v: unknown): v is Timing {
  return v === "relaxed" || v === "normal" || v === "speedy";
}

export function loadTiming(): Timing {
  try {
    const v = localStorage.getItem(TIMING_KEY);
    return isTiming(v) ? v : DEFAULT_TIMING;
  } catch {
    return DEFAULT_TIMING;
  }
}

export function saveTiming(t: Timing) {
  try {
    localStorage.setItem(TIMING_KEY, t);
  } catch {
    // Blocked storage: the choice just isn't remembered.
  }
}

export type QuestionKind = "cipher" | "word" | "fact";

/** Families that need working out (a story problem, a rate, an equation…), beyond recall. */
const WORD: ReadonlySet<Family> = new Set<Family>([
  "drt", "rate", "ratio", "pctof", "pctchange", "fracrate", "mpg", "slope", "rateTable", "chase",
  "lineq", "lineParam", "avgRate", "multWord", "bigMult", "addSub",
]);

export function questionKind(q: Pick<CPQuestion, "family" | "prompt">): QuestionKind {
  if (q.family.startsWith("cipher")) return "cipher";
  if (WORD.has(q.family)) return "word";
  // Kit math: a sentence with numbers in it is a story problem; "7 × 8 = ?" is a fact.
  if (q.family === "kitMath" && q.prompt.length >= 40 && /\d/.test(q.prompt)) return "word";
  return "fact";
}

const words = (s: string) => s.split(/\s+/).filter(Boolean).length;

/** Minimum NORMAL seconds, whatever the prompt: the floors the rules check holds us to. */
export function normalFloor(gradeN: number, kind: QuestionKind): number {
  if (gradeN <= 2) return 30;
  return kind === "fact" ? 15 : 25;
}
/** Minimum SPEEDY seconds. */
export function speedyFloor(gradeN: number, kind: QuestionKind): number {
  if (gradeN <= 2) return 14;
  return kind === "fact" ? 8 : 12;
}

/**
 * Seconds to answer a checkpoint after any read-aloud has finished (Infinity in RELAXED).
 * Reading speed grows with grade; ciphers and story problems add thinking time.
 */
export function answerSeconds(q: Pick<CPQuestion, "family" | "prompt" | "choices">, gradeN: number, timing: Timing): number {
  if (timing === "relaxed") return Infinity;
  const kind = questionKind(q);
  const wps = gradeN <= 2 ? 1.2 : gradeN <= 5 ? 1.8 : gradeN <= 8 ? 2.4 : 2.8;
  const n = words(q.prompt) + q.choices.reduce((s, c) => s + words(c), 0);
  const think = kind === "cipher" ? 14 : kind === "word" ? 12 : 6;
  const normal = Math.min(90, Math.max(normalFloor(gradeN, kind), 4 + n / wps + think));
  const t = timing === "normal" ? normal : Math.max(speedyFloor(gradeN, kind), normal * 0.5);
  return Math.round(t * 2) / 2;
}

/** Rough length of the read-aloud of a checkpoint (prompt + "Lane 1: …" for each choice) at rate 0.9. */
export function speechSeconds(q: Pick<CPQuestion, "prompt" | "choices">): number {
  const n = words(q.prompt) + q.choices.reduce((s, c) => s + 2 + words(c), 0);
  return 1 + n / 2.2;
}
