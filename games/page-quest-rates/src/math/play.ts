/*
 * The rules of a math gate (pure, no DOM). Gentle by design:
 *  - a wrong answer never costs a heart or ends the story: Quill names the mistake, you retry;
 *  - HINT gives Quill's nudge, then a worked step (hints used are recorded);
 *  - no timers.
 * Chains (multi-step story problems) ask for the final answer first. Right first try = bonus.
 * A miss breaks the problem into its steps (each its own question, with a "work so far" list);
 * the last step asks for the final answer again.
 */
import { generate } from "./unit3";
import { generateChain } from "./chains";
import { shuffle, type Rng } from "./format";
import type { ChainQ, MathQ, Params, SkillTag } from "./types";

export interface MathSpec {
  gen: string;
  chain: boolean;
  params: Params;
}

export type MathItem = { kind: "single"; spec: MathSpec; q: MathQ } | { kind: "chain"; spec: MathSpec; c: ChainQ };

export interface QResult {
  tag: SkillTag;
  code: string;
  gen: string;
  question: string;
  answer: string;
  firstTry: boolean;
  hints: number;
  attempts: number;
  twoStep: boolean;
}

/** One click on an answer (for the saved attempt log and the CSV/JSON export). */
export interface Attempt {
  tag: SkillTag;
  code: string;
  question: string;
  given: string;
  correctAnswer: string;
  correct: boolean;
  hints: number;
}

export interface MathState {
  item: MathItem;
  phase: "final" | "steps" | "done";
  step: number;
  /** Display position → choice index of the current question. */
  order: number[];
  /** Display positions already tried (wrong) on the current question. */
  tried: number[];
  /** Hint stage shown for the current question (0 none, 1 nudge, 2 worked step). */
  hints: number;
  hintsUsed: number;
  feedback: { text: string; ok: boolean } | null;
  work: { label: string; value: string }[];
  results: QResult[];
  /** The whole gate was right on the first try (null while open). */
  firstTry: boolean | null;
  /** Chain solved first try: bonus points + special clue. */
  bonus: boolean;
}

export function makeItem(spec: MathSpec, rng: Rng = Math.random): MathItem {
  return spec.chain
    ? { kind: "chain", spec, c: generateChain(spec.gen, spec.params, rng) }
    : { kind: "single", spec, q: generate(spec.gen, spec.params, rng) };
}

export function currentQ(s: MathState): MathQ {
  if (s.item.kind === "single") return s.item.q;
  return s.phase === "steps" ? s.item.c.steps[s.step] : s.item.c.final;
}

/** The full question text (a chain step includes the story problem). */
export function questionText(s: MathState): string {
  const q = currentQ(s);
  return s.item.kind === "chain" && s.phase === "steps" ? `${s.item.c.setup} ${q.prompt}` : q.prompt;
}

const fresh = (q: MathQ, rng: Rng) => shuffle(rng, [...q.choices.keys()]);

export function startMath(item: MathItem, rng: Rng = Math.random): MathState {
  const s: MathState = { item, phase: "final", step: 0, order: [], tried: [], hints: 0, hintsUsed: 0, feedback: null, work: [], results: [], firstTry: null, bonus: false };
  return { ...s, order: fresh(currentQ(s), rng) };
}

export function hint(s: MathState): MathState {
  if (s.phase === "done" || s.hints >= 2) return s;
  return { ...s, hints: s.hints + 1, hintsUsed: s.hintsUsed + 1 };
}

export type MathEvent = "ignored" | "wrong" | "breakdown" | "step" | "done";

export function answer(s: MathState, display: number, rng: Rng = Math.random): { s: MathState; event: MathEvent; attempt: Attempt | null } {
  if (s.phase === "done" || s.tried.includes(display)) return { s, event: "ignored", attempt: null };
  const q = currentQ(s);
  const idx = s.order[display];
  const ch = q.choices[idx];
  if (!ch) return { s, event: "ignored", attempt: null };
  const question = questionText(s);
  const attempt: Attempt = { tag: q.tag, code: q.code, question, given: ch.text, correctAnswer: q.answer, correct: ch.correct, hints: s.hints };
  const result = (firstTry: boolean): QResult => ({ tag: q.tag, code: q.code, gen: q.gen, question, answer: q.answer, firstTry, hints: s.hints, attempts: s.tried.length + 1, twoStep: q.steps >= 2 });

  if (ch.correct) {
    const r = result(s.tried.length === 0);
    if (s.item.kind === "single" || s.phase === "final") {
      const bonus = s.item.kind === "chain" && r.firstTry;
      return {
        s: { ...s, phase: "done", results: [...s.results, r], firstTry: r.firstTry, bonus, feedback: { text: bonus ? "✔ Solved in one go! Bonus!" : r.firstTry ? "✔ Correct!" : "✔ You got it!", ok: true } },
        event: "done",
        attempt,
      };
    }
    // a step of a chain
    const steps = s.item.c.steps;
    const work = [...s.work, { label: q.label ?? `Step ${s.step + 1}`, value: q.answer }];
    if (s.step >= steps.length - 1) {
      return { s: { ...s, phase: "done", work, results: [...s.results, r], firstTry: false, feedback: { text: "✔ All steps done. You solved it!", ok: true } }, event: "done", attempt };
    }
    const next = { ...s, step: s.step + 1, work, results: [...s.results, r], tried: [], hints: 0, feedback: { text: `✔ Step ${s.step + 1} done: ${q.answer}`, ok: true } };
    return { s: { ...next, order: fresh(steps[next.step], rng) }, event: "step", attempt };
  }

  // wrong
  if (s.item.kind === "chain" && s.phase === "final") {
    const c = s.item.c;
    const next: MathState = {
      ...s,
      phase: "steps",
      step: 0,
      tried: [],
      hints: 0,
      results: [...s.results, { ...result(false), tag: c.tag, code: c.code }],
      feedback: { text: `${ch.why} Let's break it into steps.`, ok: false },
    };
    return { s: { ...next, order: fresh(c.steps[0], rng) }, event: "breakdown", attempt };
  }
  return { s: { ...s, tried: [...s.tried, display], feedback: { text: ch.why, ok: false } }, event: "wrong", attempt };
}

/** The display index of the correct answer of the current question. */
export function correctDisplay(s: MathState): number {
  const q = currentQ(s);
  return s.order.findIndex((i) => q.choices[i].correct);
}
