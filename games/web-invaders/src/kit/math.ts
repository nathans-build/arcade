import type { Grade, Question } from "./types";
import { type Draft, type Gen, pick, randInt } from "./math/core";
import { GRADE_1, GRADE_2, GRADE_K } from "./math/early";
import { GRADE_3, GRADE_4, GRADE_5 } from "./math/elem";
import { GRADE_6, GRADE_7, GRADE_8 } from "./math/middle";
import { GRADE_9, GRADE_10, GRADE_11, GRADE_12 } from "./math/high";

/*
 * Procedurally generated math questions for K-12, tagged with North Carolina Standard
 * Course of Study for Mathematics codes (NC.K.CC.5 … NC.8.G.9; NC Math 1-3 as
 * NC.M1.A-REI.3 style; NC Math 4 as NC.M4.AF.2.1 style). Every call returns a fresh
 * question. Generators live in ./math/*.ts, grouped by grade band.
 */

export { randInt, pick };

/** Every generator, by grade. Exposed for tests and tooling. */
export const MATH_GENERATORS: Record<Grade, readonly Gen[]> = {
  K: GRADE_K,
  "1": GRADE_1,
  "2": GRADE_2,
  "3": GRADE_3,
  "4": GRADE_4,
  "5": GRADE_5,
  "6": GRADE_6,
  "7": GRADE_7,
  "8": GRADE_8,
  "9": GRADE_9,
  "10": GRADE_10,
  "11": GRADE_11,
  "12": GRADE_12,
};

const QUICK_PROMPT = 100;
const QUICK_CHOICE = 14;

let counter = 0;

function isQuick(prompt: string, choices: readonly string[]): boolean {
  return prompt.length <= QUICK_PROMPT && choices.every((c) => c.length <= QUICK_CHOICE);
}

/** Turns a generator's draft into a Question, or null if it can't make 4 distinct choices. */
function build(grade: Grade, gen: Gen, d: Draft): Question | null {
  const answer = d.answer.trim();
  if (!answer) return null;
  const choices = [answer];
  const add = (w: string | undefined) => {
    const t = w?.trim();
    if (t && choices.length < 4 && !choices.includes(t)) choices.push(t);
  };
  d.wrong.forEach(add);
  for (let i = 0; choices.length < 4 && d.pad && i < 60; i++) add(d.pad());
  if (choices.length < 4) return null;
  const q: Question = {
    id: `m-g${grade.toLowerCase()}-${gen.key}-${++counter}`,
    subject: "math",
    grade,
    standard: gen.standard,
    skill: gen.skill,
    prompt: d.prompt,
    choices: choices as Question["choices"],
    answer: 0,
    explanation: d.explanation,
  };
  if (isQuick(q.prompt, q.choices)) q.quick = true;
  return q;
}

/** Simple fallback so a game never gets an error (should not normally be reached). */
function fallback(grade: Grade): Question {
  const g = grade === "K" ? 0 : Number(grade);
  const a = randInt(1, 5 + g * 2);
  const b = randInt(1, 5 + g * 2);
  const s = a + b;
  return {
    id: `m-g${grade.toLowerCase()}-add-${++counter}`,
    subject: "math",
    grade,
    standard: grade === "K" ? "NC.K.OA.5" : g === 1 ? "NC.1.OA.6" : "NC.2.OA.2",
    skill: "Addition",
    prompt: `What is ${a} + ${b}?`,
    choices: [String(s), String(s + 1), String(s - 1), String(s + 10)],
    answer: 0,
    explanation: `${a} + ${b} = ${s}.`,
    quick: true,
  };
}

/**
 * A fresh multiple-choice math question for `grade`.
 * With `quick: true` the prompt is ≤ 100 chars and every choice ≤ 14 chars.
 * The correct choice is at `answer` (index 0); decks shuffle choices at runtime.
 */
export function mathQuestion(grade: Grade, opts: { quick?: boolean } = {}): Question {
  const all = MATH_GENERATORS[grade] ?? MATH_GENERATORS["6"];
  const pool = opts.quick ? all.filter((g) => g.quick !== false) : all;
  for (let attempt = 0; attempt < 80; attempt++) {
    const gen = pick(pool);
    let q: Question | null = null;
    try {
      q = build(grade, gen, gen.make(!!opts.quick));
    } catch {
      q = null;
    }
    if (q && (!opts.quick || q.quick)) return q;
  }
  return fallback(grade);
}
