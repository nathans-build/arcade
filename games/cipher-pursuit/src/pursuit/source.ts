/*
 * Picks the question for each code checkpoint: this game's own generators (questions.ts) mixed
 * with the kit's generated math and written ELA banks, by grade band. Every question that leaves
 * here is "quick" (prompt ≤ 100 characters, every choice ≤ 14) and fits a lane gate.
 *
 * The kit is reached through `KitHooks`, so the browser can pass the real deck pieces
 * (adaptive math, `bankFor`) and the checker can pass plain functions under tsx.
 */
import type { Grade, Question } from "../kit/types";
import { hasGlyphs, textWidth } from "./font";
import {
  addSub, avgRate, bigMult, chase, cipherDecode, cipherEncode, cipherLetter, cipherShift, countNext, drt, fracrate, lineParam,
  lineq, mpg, multFact, multWord, pctchange, pctof, rate, rateTable, ratio, sightMatch, sightSentence, slope, vocab,
  type CPQuestion, type DriveCtx, type Family, type GenCtx, type Generator, type Rand,
} from "./questions";

export const QUICK_PROMPT = 100;
export const QUICK_CHOICE = 14;
/** Widest label (in font pixels, scale 1) that fits inside a lane gate's sign. */
export const GATE_TEXT_MAX = 66;

export interface KitHooks {
  /** A fresh quick kit math question (the browser uses adaptive math here). */
  math(grade: Grade): Question;
  /** The kit's written ELA questions for a grade (the browser passes `bankFor("ela", grade)`). */
  ela(grade: Grade): Question[];
}

type Entry = [Family, number];

/** Which families each grade band uses, and how often. */
export function familiesFor(n: number): Entry[] {
  if (n === 0) return [["kitMath", 3], ["addSub", 2.5], ["countNext", 1.5], ["sightMatch", 3], ["kitEla", 0.6]];
  if (n === 1) return [["kitMath", 3], ["addSub", 2.5], ["countNext", 1], ["sightMatch", 1.5], ["sightSentence", 1.5], ["kitEla", 0.6]];
  if (n === 2) return [["kitMath", 3], ["addSub", 2.5], ["countNext", 1], ["sightSentence", 3], ["kitEla", 0.6]];
  if (n === 3) return [["multFact", 2], ["multWord", 2], ["kitMath", 2], ["vocab", 2.5], ["kitEla", 1.5]];
  if (n === 4) return [["drt", 2.5], ["multWord", 1], ["kitMath", 2.5], ["vocab", 2.5], ["kitEla", 1.5]];
  if (n === 5) return [["drt", 2], ["bigMult", 1.5], ["kitMath", 2.5], ["vocab", 2.5], ["kitEla", 1.5]];
  if (n === 6) return [["drt", 2], ["rate", 2], ["ratio", 1.5], ["pctof", 2], ["kitMath", 2.5]];
  if (n === 7) return [["drt", 2], ["fracrate", 2], ["pctchange", 2], ["mpg", 1.5], ["kitMath", 2.5]];
  if (n === 8) return [["slope", 2], ["rateTable", 2], ["chase", 2], ["kitMath", 2.5]];
  return [["lineq", 2], ["lineParam", 1.5], ["avgRate", 1.5], ["cipherDecode", 2], ["cipherEncode", 1], ["cipherLetter", 0.7], ["cipherShift", 1], ["kitMath", 2]];
}

export const GENERATORS: Partial<Record<Family, Generator>> = {
  drt, rate, ratio, pctof, pctchange, fracrate, mpg, slope, rateTable, chase, lineq, lineParam, avgRate,
  cipherDecode, cipherEncode, cipherLetter, cipherShift, addSub, countNext, sightMatch, sightSentence, multFact, multWord, bigMult, vocab,
};

/** True when a question can go on the lane gates: quick, and every answer fits a gate sign. */
export function fitsGates(q: Question): boolean {
  return (
    !q.passage &&
    q.prompt.length <= QUICK_PROMPT &&
    q.choices.length === 4 &&
    new Set(q.choices).size === 4 &&
    q.choices.every((ch) => ch.length > 0 && ch.length <= QUICK_CHOICE && hasGlyphs(ch) && textWidth(ch) <= GATE_TEXT_MAX)
  );
}

function shuffle<T>(arr: T[], r: Rand): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Shuffles the four choices, keeping track of the right one. */
export function dealQ<Q extends Question>(q: Q, r: Rand): Q {
  const order = shuffle([0, 1, 2, 3], r);
  return { ...q, choices: order.map((i) => q.choices[i]) as Question["choices"], answer: order.indexOf(q.answer) };
}

function gradeNum(g: Grade): number {
  return g === "K" ? 0 : Number(g);
}

/** ELA bank items that suit a grade's lane gates (phonics for K-2, word meaning for 3-5). */
export function kitElaPool(grade: Grade, all: Question[]): Question[] {
  const n = gradeNum(grade);
  const want = n <= 2 ? [`RF.${grade}.4`] : [`L.${grade}.4`, `L.${grade}.5`];
  return all.filter((q) => q.quick && want.includes(q.standard) && fitsGates(q));
}

export class CodeSource {
  private last: Family | null = null;
  private usedEla = new Set<string>();
  readonly n: number;

  constructor(readonly grade: Grade, private kit: KitHooks, private r: Rand = Math.random) {
    this.n = gradeNum(grade);
  }

  private pickFamily(): Family {
    const entries = familiesFor(this.n).filter(([f]) => f !== this.last || familiesFor(this.n).length < 2);
    const total = entries.reduce((s, [, w]) => s + w, 0);
    let x = this.r() * total;
    for (const [f, w] of entries) {
      x -= w;
      if (x <= 0) return f;
    }
    return entries[entries.length - 1][0];
  }

  /** One family's question (correct answer at index 0), or null if it couldn't make one that fits. */
  make(family: Family, drive: DriveCtx): CPQuestion | null {
    if (family === "kitMath") {
      const q = this.kit.math(this.grade);
      return fitsGates(q) ? { ...q, family, meta: { kind: "kit" } } : null;
    }
    if (family === "kitEla") {
      const pool = kitElaPool(this.grade, this.kit.ela(this.grade));
      let fresh = pool.filter((q) => !this.usedEla.has(q.id));
      if (!fresh.length) {
        this.usedEla.clear();
        fresh = pool;
      }
      if (!fresh.length) return null;
      const q = fresh[Math.floor(this.r() * fresh.length)];
      this.usedEla.add(q.id);
      return { ...q, family, meta: { kind: "kit" } };
    }
    const gen = GENERATORS[family];
    if (!gen) return null;
    const c: GenCtx = { grade: this.grade, n: this.n, r: this.r, drive };
    const q = gen(c);
    return q && fitsGates(q) ? q : null;
  }

  /** The next checkpoint question, choices shuffled. */
  next(drive: DriveCtx): CPQuestion {
    for (let attempt = 0; attempt < 40; attempt++) {
      const family = this.pickFamily();
      const q = this.make(family, drive);
      if (q) {
        this.last = family;
        return dealQ(q, this.r);
      }
    }
    // Practically unreachable: the game's own generators always fit.
    const fallback = this.n <= 2 ? addSub : this.n <= 5 ? multFact : this.n <= 8 ? drt : lineq;
    const q = fallback({ grade: this.grade, n: this.n, r: this.r, drive })!;
    return dealQ(q, this.r);
  }
}
