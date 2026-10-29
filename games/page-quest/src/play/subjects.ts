/*
 * The library's subject picker and the deck that feeds subject questions into the stories.
 *
 * Like the other production games, the player picks a subject: MIXED (the default) · READING ·
 * MATH · SCIENCE · SOCIAL STUDIES. Story gates written in the books stay reading gates (they test
 * the story). The subject decides:
 *  - QUIZ gates (`? QUIZ : lead-in` in a book): the question is drawn at play time from the kit
 *    bank of the chosen subject at the player's grade (READING uses the ELA bank);
 *  - checkpoint transmissions from Quill.
 * MIXED rotates math → science → ELA → social studies across every subject question in a read.
 * Math is generated fresh at the player's adaptive math level, like Dojo Tower (kit adaptive.ts).
 *
 * This file must not import kit/banks or kit/deck (they use import.meta.glob), so the Node tests
 * can load it: the written banks are passed in as a BankSource.
 */
import { GRADES, isGrade } from "@/kit/grades";
import { markAdaptive, mathGradeFor } from "@/kit/adaptive";
import { mathQuestion } from "@/kit/math";
import { loadProgress, type Progress } from "@/kit/progress";
import type { DealtQuestion, Grade, Question, Subject } from "@/kit/types";

export type PqSubject = "mixed" | "reading" | "math" | "science" | "social";

export const SUBJECT_KEY = "arcade.page-quest.subject";

export const SUBJECT_CHOICES: { id: PqSubject; label: string; note: string }[] = [
  { id: "mixed", label: "MIXED", note: "Math, science, reading & social studies take turns" },
  { id: "reading", label: "READING", note: "Reading & language questions (ELA)" },
  { id: "math", label: "MATH", note: "Math at your level" },
  { id: "science", label: "SCIENCE", note: "Life, Earth & physical science" },
  { id: "social", label: "SOCIAL STUDIES", note: "Civics, history, geography & economics" },
];

/** The order MIXED takes turns in. */
export const MIXED_ROTATION: Subject[] = ["math", "science", "ela", "social"];

/** Short tag for a kit subject (question headers, transmissions). */
export const SUBJECT_TAG: Record<Subject, string> = { math: "MATH", science: "SCIENCE", ela: "READING", social: "SOCIAL STUDIES" };

export function isPqSubject(v: unknown): v is PqSubject {
  return typeof v === "string" && SUBJECT_CHOICES.some((s) => s.id === v);
}

/** The kit subjects a choice draws from, in turn order. */
export function subjectsFor(s: PqSubject): Subject[] {
  if (s === "mixed") return [...MIXED_ROTATION];
  if (s === "reading") return ["ela"];
  return [s];
}

export function subjectLabel(s: PqSubject): string {
  return SUBJECT_CHOICES.find((c) => c.id === s)?.label ?? "MIXED";
}

/*
 * The arcade menu's topic ids that Page Quest can focus on (site/games.js, `focus: true`): each
 * one is a whole subject's quiz mix, so it maps exactly onto one subject choice.
 */
export const TOPIC_SUBJECT: Record<string, PqSubject> = {
  "math-mix": "math",
  "science-mix": "science",
  "social-mix": "social",
  "ela-mix": "reading",
  reading: "reading",
  writing: "reading",
};

/** `?topic=` (menu topic id) or `?subject=` (mixed|reading|ela|math|science|social) → a subject. */
export function subjectFromParams(search: string): PqSubject | null {
  try {
    const q = new URLSearchParams(search);
    const topic = (q.get("topic") ?? "").toLowerCase();
    if (topic && TOPIC_SUBJECT[topic]) return TOPIC_SUBJECT[topic];
    const subj = (q.get("subject") ?? "").toLowerCase();
    if (subj === "ela") return "reading";
    if (isPqSubject(subj)) return subj;
  } catch {
    // no URL (Node)
  }
  return null;
}

export function loadSubject(): PqSubject {
  try {
    const v = localStorage.getItem(SUBJECT_KEY);
    if (isPqSubject(v)) return v;
  } catch {
    // storage unavailable
  }
  return "mixed";
}

export function saveSubject(s: PqSubject): void {
  try {
    localStorage.setItem(SUBJECT_KEY, s);
  } catch {
    // storage unavailable
  }
}

/** First visit: the menu's ?topic= / ?subject= win for this visit, then the saved choice. */
export function initialSubject(search: string): { subject: PqSubject; fromMenu: boolean } {
  const fromUrl = subjectFromParams(search);
  return fromUrl ? { subject: fromUrl, fromMenu: true } : { subject: loadSubject(), fromMenu: false };
}

// ------------------------------------------------------------------ the deck

export type BankSource = (subject: Exclude<Subject, "math">, grade: Grade) => Question[];

function shuffle<T>(arr: T[], rand: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Shuffles a question's four choices, keeping track of the right one. */
export function dealQuestion(q: Question, rand: () => number = Math.random): DealtQuestion {
  const order = shuffle([0, 1, 2, 3], rand);
  return { ...q, choices: order.map((i) => q.choices[i]) as Question["choices"], answer: order.indexOf(q.answer) };
}

/**
 * A subject's written questions for the grade; when the grade has fewer than 8, the nearest
 * grades lend theirs (the kit deck's rule), so a book never runs dry.
 */
export function writtenPool(bank: BankSource, subject: Exclude<Subject, "math">, grade: Grade): Question[] {
  const idx = GRADES.indexOf(grade);
  let pool = bank(subject, grade);
  for (let d = 1; pool.length < 8 && d < GRADES.length; d++) {
    for (const j of [idx - d, idx + d]) if (j >= 0 && j < GRADES.length) pool = pool.concat(bank(subject, GRADES[j]));
  }
  return pool;
}

/**
 * Subject questions for one read: QUIZ gates and checkpoint transmissions draw from it in turn,
 * so in MIXED the subjects take turns across the whole book. Written items don't repeat until the
 * pool is used up and favour standards the player has missed before (kit progress); math is
 * generated at the player's adaptive math level.
 */
export class SubjectDeck {
  readonly subjects: Subject[];
  private turn: number;
  private used = new Set<string>();
  private progress: Progress;

  constructor(
    public readonly grade: Grade,
    public readonly mode: PqSubject,
    private bank: BankSource,
    private opts: { gameId?: string; rand?: () => number; start?: number } = {},
  ) {
    this.subjects = subjectsFor(mode);
    const rand = opts.rand ?? Math.random;
    this.turn = opts.start ?? Math.floor(rand() * this.subjects.length);
    this.progress = loadProgress(opts.gameId ?? "page-quest");
    if (!isGrade(grade)) throw new Error(`SubjectDeck: bad grade ${String(grade)}`);
  }

  /** The kit subject the next draw comes from. */
  peek(): Subject {
    return this.subjects[this.turn % this.subjects.length];
  }

  draw(): DealtQuestion {
    const rand = this.opts.rand ?? Math.random;
    const subject = this.subjects[this.turn++ % this.subjects.length];
    if (subject === "math") return this.math(rand);
    let pool = writtenPool(this.bank, subject, this.grade);
    if (pool.length === 0) return this.math(rand);
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
    let r = rand() * weights.reduce((a, b) => a + b, 0);
    let pick = pool[pool.length - 1];
    for (let i = 0; i < pool.length; i++) {
      r -= weights[i];
      if (r <= 0) {
        pick = pool[i];
        break;
      }
    }
    this.used.add(pick.id);
    return dealQuestion(pick, rand);
  }

  /** A fresh generated math question; with adaptive math on, its grade follows the player's math level. */
  private math(rand: () => number): DealtQuestion {
    const q = mathQuestion(mathGradeFor(this.grade, rand));
    markAdaptive(q, this.grade);
    return dealQuestion(q, rand);
  }
}
