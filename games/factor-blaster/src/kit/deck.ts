import { bankFor } from "./banks";
import { GRADES } from "./grades";
import { mathQuestion } from "./math";
import { loadProgress, type Progress } from "./progress";
import type { DealtQuestion, Grade, Question, Subject } from "./types";

export type SubjectMode = Subject | "mixed";

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Shuffle a question's choices, keeping track of the right answer. */
export function deal(q: Question): DealtQuestion {
  const order = shuffle([0, 1, 2, 3]);
  return {
    ...q,
    choices: order.map((i) => q.choices[i]) as Question["choices"],
    answer: order.indexOf(q.answer),
  };
}

/**
 * Written bank for a subject at `grade`; if that grade has too few items for the
 * request, borrows from the nearest grades so a game never runs dry.
 */
function writtenPool(subject: Exclude<Subject, "math">, grade: Grade, quickOnly: boolean): Question[] {
  const idx = GRADES.indexOf(grade);
  const fits = (q: Question) => !quickOnly || q.quick;
  let pool = bankFor(subject, grade).filter(fits);
  for (let d = 1; pool.length < 8 && d < GRADES.length; d++) {
    for (const j of [idx - d, idx + d]) {
      if (j >= 0 && j < GRADES.length) pool = pool.concat(bankFor(subject, GRADES[j]).filter(fits));
    }
  }
  return pool;
}

/**
 * Draws questions for a grade and subject mix. Math is generated fresh each time;
 * science and ELA come from the written banks, avoiding repeats until the pool is used
 * up, and favouring standards the player has missed before.
 */
export class QuestionDeck {
  private subjects: Subject[];
  private used = new Set<string>();
  private turn = Math.floor(Math.random() * 3); // mixed decks start on a random subject
  private progress: Progress;

  constructor(
    public readonly grade: Grade,
    mode: SubjectMode | Subject[],
    private opts: { quickOnly?: boolean; gameId?: string } = {},
  ) {
    this.subjects = Array.isArray(mode) ? mode : mode === "mixed" ? ["math", "science", "ela"] : [mode];
    this.progress = loadProgress(opts.gameId ?? "arcade");
  }

  draw(): DealtQuestion {
    const subject = this.subjects[this.turn++ % this.subjects.length];
    if (subject === "math") return deal(mathQuestion(this.grade, { quick: this.opts.quickOnly }));

    let pool = writtenPool(subject, this.grade, !!this.opts.quickOnly);
    if (pool.length === 0) return deal(mathQuestion(this.grade, { quick: this.opts.quickOnly }));
    let fresh = pool.filter((q) => !this.used.has(q.id));
    if (fresh.length === 0) {
      pool.forEach((q) => this.used.delete(q.id));
      fresh = pool;
    }
    pool = fresh;

    const weights = pool.map((q) => {
      const s = this.progress.standards[q.standard];
      if (!s || s.seen === 0) return 2;
      return 1 + (1 - s.correct / s.seen) * 2;
    });
    let r = Math.random() * weights.reduce((a, b) => a + b, 0);
    let pickQ = pool[pool.length - 1];
    for (let i = 0; i < pool.length; i++) {
      r -= weights[i];
      if (r <= 0) {
        pickQ = pool[i];
        break;
      }
    }
    this.used.add(pickQ.id);
    return deal(pickQ);
  }
}
