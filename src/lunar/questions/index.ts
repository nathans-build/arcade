import { math6 } from "./math6";
import { science6 } from "./science6";
import { ela6 } from "./ela6";
import type { Question, Subject } from "./types";

export type { Question, Subject };
export type SubjectMode = Subject | "mixed";

export const ALL_QUESTIONS: Question[] = [...math6, ...science6, ...ela6];

export const SUBJECT_LABELS: Record<Subject, string> = {
  math: "MATH",
  science: "SCIENCE",
  ela: "ELA",
};

/* ------------------------------------------------------------------ */
/* Persistent progress (per-browser)                                   */
/* ------------------------------------------------------------------ */

export interface StandardStats {
  seen: number;
  correct: number;
}

export interface Progress {
  highScore: number;
  standards: Record<string, StandardStats>;
}

const STORAGE_KEY = "lunarPatrol.progress.v1";

export function loadProgress(): Progress {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Progress;
      return { highScore: parsed.highScore ?? 0, standards: parsed.standards ?? {} };
    }
  } catch {
    // storage unavailable or corrupt — start fresh
  }
  return { highScore: 0, standards: {} };
}

export function saveProgress(progress: Progress) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch {
    // ignore
  }
}

/* ------------------------------------------------------------------ */
/* Deck: picks questions, favoring standards the player struggles with */
/* ------------------------------------------------------------------ */

/** A question whose choices have been shuffled for display. */
export interface DealtQuestion extends Question {
  /** Index into `choices` of the correct answer after shuffling. */
  answer: number;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export class QuestionDeck {
  private pool: Question[];
  private used = new Set<string>();
  private lastSubject: Subject | null = null;

  constructor(mode: SubjectMode, private progress: Progress) {
    this.pool = mode === "mixed" ? ALL_QUESTIONS : ALL_QUESTIONS.filter((q) => q.subject === mode);
  }

  /** Draw a question. `quickOnly` restricts to short items suitable for UFO waves. */
  draw(quickOnly = false): DealtQuestion | null {
    let candidates = this.pool.filter((q) => !this.used.has(q.id) && (!quickOnly || q.quick));
    if (candidates.length === 0) {
      // Recycle the pool once everything has been seen this run.
      for (const q of this.pool) if (!quickOnly || q.quick) this.used.delete(q.id);
      candidates = this.pool.filter((q) => !quickOnly || q.quick);
    }
    if (candidates.length === 0) return null;

    // In mixed mode, rotate subjects so the run doesn't cluster.
    if (this.lastSubject) {
      const other = candidates.filter((q) => q.subject !== this.lastSubject);
      if (other.length > 0 && Math.random() < 0.7) candidates = other;
    }

    // Weight: unseen standards and low-accuracy standards come up more often.
    const weights = candidates.map((q) => {
      const s = this.progress.standards[q.standard];
      if (!s || s.seen === 0) return 2;
      const acc = s.correct / s.seen;
      return 1 + (1 - acc) * 2;
    });
    const total = weights.reduce((a, b) => a + b, 0);
    let r = Math.random() * total;
    let pick = candidates[candidates.length - 1];
    for (let i = 0; i < candidates.length; i++) {
      r -= weights[i];
      if (r <= 0) {
        pick = candidates[i];
        break;
      }
    }

    this.used.add(pick.id);
    this.lastSubject = pick.subject;

    const order = shuffle([0, 1, 2, 3]);
    return {
      ...pick,
      choices: order.map((i) => pick.choices[i]) as Question["choices"],
      answer: order.indexOf(pick.answer),
    };
  }
}
