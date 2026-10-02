import { GRADES } from "./grades";
import type { Grade, Question } from "./types";

/*
 * Adaptive math: when it is on, the math level moves up after right answers and down after
 * wrong ones, so generated math questions get harder or easier to fit the player.
 *
 * The level is measured in grades (K = 0 … 12) and starts at the grade chosen in the arcade.
 * It can move at most MAX_SHIFT grades above or below that grade. A level between two grades
 * (say 4.4) mixes questions from both (60% grade 4, 40% grade 5). A right answer adds STEP_UP and
 * a wrong one subtracts STEP_DOWN, which settles where the player gets about 70% right.
 *
 * Everything lives in localStorage on the arcade's origin, so the setting and the level are
 * shared by every game. The level is kept per chosen grade, so changing grade starts fresh.
 */

export const MAX_SHIFT = 2;
export const STEP_UP = 0.2;
export const STEP_DOWN = 0.5;

const ON_KEY = "arcade.adaptiveMath";
const levelKey = (g: Grade) => `arcade.mathLevel.${g}`;

/** Questions this page generated adaptively, mapped to the grade the player chose. */
const baseOf = new Map<string, Grade>();

function idx(g: Grade): number {
  return GRADES.indexOf(g);
}

/** Adaptive math is on unless the player turned it off in the arcade. */
export function isAdaptiveMath(): boolean {
  try {
    return localStorage.getItem(ON_KEY) !== "0";
  } catch {
    return true;
  }
}

export function setAdaptiveMath(on: boolean): void {
  try {
    localStorage.setItem(ON_KEY, on ? "1" : "0");
  } catch {
    // storage unavailable
  }
}

/** Current math level for a chosen grade, in grade units (K = 0). */
export function mathLevel(grade: Grade): number {
  try {
    const raw = localStorage.getItem(levelKey(grade));
    const v = raw === null ? NaN : Number(raw);
    if (Number.isFinite(v)) return clampLevel(grade, v);
  } catch {
    // storage unavailable
  }
  return idx(grade);
}

function clampLevel(grade: Grade, v: number): number {
  const base = idx(grade);
  const lo = Math.max(0, base - MAX_SHIFT);
  const hi = Math.min(GRADES.length - 1, base + MAX_SHIFT);
  return Math.min(hi, Math.max(lo, v));
}

function saveLevel(grade: Grade, v: number): void {
  try {
    localStorage.setItem(levelKey(grade), String(Math.round(v * 100) / 100));
  } catch {
    // storage unavailable
  }
}

export function resetMathLevel(grade: Grade): void {
  try {
    localStorage.removeItem(levelKey(grade));
  } catch {
    // storage unavailable
  }
}

/** Moves the level for a chosen grade after one answer. Returns the new level. */
export function adjustMathLevel(grade: Grade, correct: boolean): number {
  const next = clampLevel(grade, mathLevel(grade) + (correct ? STEP_UP : -STEP_DOWN));
  saveLevel(grade, next);
  return next;
}

/** The grade to generate the next math question from (the chosen grade when adaptive is off). */
export function mathGradeFor(grade: Grade, rand: () => number = Math.random): Grade {
  if (!isAdaptiveMath()) return grade;
  const level = mathLevel(grade);
  const lo = Math.floor(level);
  const g = rand() < level - lo ? lo + 1 : lo;
  return GRADES[Math.min(GRADES.length - 1, g)];
}

/** Remembers that question `q` was generated adaptively for chosen grade `base`. */
export function markAdaptive(q: Question, base: Grade): void {
  baseOf.set(q.id, base);
}

/**
 * Tell adaptive math about an answer. `recordAnswer` calls this; games that save progress
 * their own way should call it too. Only adaptively generated math questions move the level.
 */
export function noteAnswer(q: Question, correct: boolean): void {
  const base = baseOf.get(q.id);
  if (base === undefined || q.subject !== "math" || !isAdaptiveMath()) return;
  baseOf.delete(q.id);
  adjustMathLevel(base, correct);
}
