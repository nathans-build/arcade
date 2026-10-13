/*
 * Typing math (WPM, accuracy), the pass rule, lesson unlocks and saved progress.
 * Saved under arcade.key-comets.* so the arcade's player switcher carries it per player.
 */
import type { Grade } from "@/kit/types";
import { gradeNumber } from "@/kit/grades";
import { FREE_ID, LESSONS } from "./lessons";
import type { TypingStats } from "./sim";

/** Standard WPM: 5 characters = 1 word. Counts correct characters only (net speed). */
export function wpm(chars: number, ms: number): number {
  if (chars <= 0 || ms <= 0) return 0;
  const minutes = Math.max(ms, 1000) / 60000;
  return Math.round(chars / 5 / minutes);
}

/** Gross WPM counts every key press, right or wrong. */
export function grossWpm(keystrokes: number, ms: number): number {
  return wpm(keystrokes, ms);
}

/** Accuracy %: right key presses out of all key presses (100 when nothing was typed). */
export function accuracy(correct: number, keystrokes: number): number {
  if (keystrokes <= 0) return 100;
  return Math.round((correct / keystrokes) * 100);
}

/** The keys missed most, most-missed first (ties alphabetical). */
export function mostMissed(missed: Record<string, number>, n = 3): { key: string; count: number }[] {
  return Object.entries(missed)
    .filter(([, c]) => c > 0)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, n)
    .map(([key, count]) => ({ key, count }));
}

export const PASS_ACCURACY = 90;
export const PASS_ZAPPED = 0.8;

export interface RoundResult {
  lessonId: string;
  grade: Grade;
  wpm: number;
  gross: number;
  accuracy: number;
  zapped: number;
  total: number;
  /** True when the round ran to the end (the shield held). */
  completed: boolean;
  score: number;
  bestCombo: number;
  missed: { key: string; count: number }[];
  passed: boolean;
}

/** Pass: the shield held, at least 90% accuracy, and at least 80% of the comets zapped. */
export function passes(r: { completed: boolean; accuracy: number; zapped: number; total: number }): boolean {
  return r.completed && r.accuracy >= PASS_ACCURACY && r.total > 0 && r.zapped / r.total >= PASS_ZAPPED;
}

export function makeResult(
  lessonId: string, grade: Grade, stats: TypingStats, s: { zapped: number; total: number; won: boolean; score: number; bestCombo: number },
): RoundResult {
  const acc = accuracy(stats.correct, stats.keystrokes);
  const base = { completed: s.won, accuracy: acc, zapped: s.zapped, total: s.total };
  return {
    lessonId, grade, wpm: wpm(stats.chars, stats.activeMs), gross: grossWpm(stats.keystrokes, stats.activeMs), accuracy: acc,
    zapped: s.zapped, total: s.total, completed: s.won, score: s.score, bestCombo: s.bestCombo, missed: mostMissed(stats.missed),
    passed: passes(base),
  };
}

/* ---------- saved progress ---------- */

export interface Best {
  wpm: number;
  accuracy: number;
  score: number;
}

export interface Saved {
  /** Lesson ids passed at least once. */
  passed: string[];
  /** Personal bests per lesson ("free-<grade>" for free play). */
  bests: Record<string, Best>;
  lastLesson: string;
  /** Show the on-screen keyboard (older kids can hide it). */
  keyboard: boolean;
  /** Lifetime misses per key, for the "practice these keys" tip. */
  missed: Record<string, number>;
}

export const SAVE_KEY = "arcade.key-comets.v1";

export function emptySave(): Saved {
  return { passed: [], bests: {}, lastLesson: LESSONS[0].id, keyboard: true, missed: {} };
}

export function loadSave(): Saved {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (raw) {
      const p = JSON.parse(raw) as Partial<Saved>;
      const e = emptySave();
      return {
        passed: Array.isArray(p.passed) ? p.passed.filter((x) => typeof x === "string") : e.passed,
        bests: p.bests && typeof p.bests === "object" ? p.bests : e.bests,
        lastLesson: typeof p.lastLesson === "string" ? p.lastLesson : e.lastLesson,
        keyboard: typeof p.keyboard === "boolean" ? p.keyboard : e.keyboard,
        missed: p.missed && typeof p.missed === "object" ? p.missed : e.missed,
      };
    }
  } catch {
    // storage unavailable or corrupt
  }
  return emptySave();
}

export function writeSave(s: Saved) {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(s));
  } catch {
    // ignore
  }
}

/** Lesson i is open when it's the first, or the lesson before it has been passed. Free play is always open. */
export function isUnlocked(lessonId: string, passed: readonly string[]): boolean {
  if (lessonId === FREE_ID) return true;
  const i = LESSONS.findIndex((l) => l.id === lessonId);
  if (i <= 0) return i === 0;
  return passed.includes(LESSONS[i - 1].id);
}

export function bestKey(lessonId: string, g: Grade): string {
  return lessonId === FREE_ID ? `free-${g}` : lessonId;
}

/** Records a finished round: unlocks, personal bests, lifetime misses. Returns the new save and what changed. */
export function applyResult(save: Saved, r: RoundResult, missed: Record<string, number>): { save: Saved; unlocked: string | null; newBest: boolean } {
  const next: Saved = { ...save, passed: [...save.passed], bests: { ...save.bests }, missed: { ...save.missed } };
  let unlocked: string | null = null;
  if (r.passed && r.lessonId !== FREE_ID && !next.passed.includes(r.lessonId)) {
    next.passed.push(r.lessonId);
    const i = LESSONS.findIndex((l) => l.id === r.lessonId);
    if (i >= 0 && i + 1 < LESSONS.length) unlocked = LESSONS[i + 1].id;
  }
  const key = bestKey(r.lessonId, r.grade);
  const old = next.bests[key];
  // A best only counts for a finished round with passing accuracy (no mashing for speed).
  let newBest = false;
  if (r.completed && r.accuracy >= PASS_ACCURACY && r.zapped > 0 && (!old || r.wpm > old.wpm || (r.wpm === old.wpm && r.accuracy > old.accuracy))) {
    next.bests[key] = { wpm: r.wpm, accuracy: r.accuracy, score: Math.max(r.score, old?.score ?? 0) };
    newBest = true;
  } else if (old && r.score > old.score) {
    next.bests[key] = { ...old, score: r.score };
  }
  for (const [k, c] of Object.entries(missed)) next.missed[k] = (next.missed[k] ?? 0) + c;
  return { save: next, unlocked, newBest };
}

/** Comet pace (WPM) by grade: slow for K, quicker for high school. First lessons are a bit gentler. */
export function paceFor(g: Grade, lessonId: string): number {
  const n = gradeNumber(g);
  const base = [4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28][n];
  const gentle = lessonId === "home" || lessonId === "shift" || lessonId === "numbers" || lessonId === "punct" ? 0.85 : 1;
  return base * gentle;
}

/** Shield size: bigger for younger players. */
export function shieldFor(g: Grade): number {
  return gradeNumber(g) <= 3 ? 6 : 5;
}

/** K–1 play in Practice mode by default (no shield damage, no losing). */
export function practiceDefault(g: Grade): boolean {
  return gradeNumber(g) <= 1;
}

/** NC standard tags shown on the results screen. */
export function standardsFor(g: Grade, lessonId: string): { code: string; skill: string }[] {
  const n = gradeNumber(g);
  const band = n === 0 ? "K" : n <= 8 ? String(n) : n <= 10 ? "9-10" : "11-12";
  const out = [{ code: `W.${band}.6`, skill: "Use digital tools (keyboarding) to produce writing" }];
  if (lessonId === "shift" || lessonId === "punct" || lessonId === "sentences" || (lessonId === FREE_ID && n >= 2)) {
    out.push({ code: `L.${band}.2`, skill: "Capitalization, punctuation and spelling" });
  }
  if (n <= 1 && lessonId !== "numbers") out.push({ code: `RF.${band}.1`, skill: "Know the letters (print concepts)" });
  return out;
}
