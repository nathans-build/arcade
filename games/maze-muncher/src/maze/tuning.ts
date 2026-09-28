/*
 * Difficulty by grade band. Speeds are in tiles per second (one tile = 8 logical pixels).
 * K–2 play a smaller maze with 2–3 slow critters and long dizzy spells; difficulty rises
 * by band and a little with every maze cleared.
 */
import { gradeNumber } from "../kit/grades";
import type { Grade } from "../kit/types";
import { BIG_MAZES, SMALL_MAZES, type Maze } from "./maze";

export type Band = 0 | 1 | 2 | 3;

export function bandOf(g: Grade): Band {
  const n = gradeNumber(g);
  return n <= 2 ? 0 : n <= 5 ? 1 : n <= 8 ? 2 : 3;
}

export interface Tuning {
  band: Band;
  /** Critter personalities in play (indexes into CRITTERS), first one starts outside the pen. */
  critters: number[];
  heroSpeed: number;
  critterSpeed: number;
  /** Seconds critters stay dizzy after a right answer. */
  frightTime: number;
  /** Seconds critters stay fired-up after a wrong answer, and their speed-up. */
  rageTime: number;
  rageBoost: number;
  /** Seconds between critters leaving the pen. */
  releaseGap: number;
  /** Scatter / chase cycle lengths (s). */
  scatter: number;
  chase: number;
  /** "READY" pause before a maze starts (s), so the first question can be read. */
  ready: number;
  lives: number;
  /** Label text size next to the pellets (1 or 2); falls back to 1 if a label needs it. */
  labelScale: 1 | 2;
}

const BASE: Record<Band, Omit<Tuning, "critters" | "band">> = {
  0: { heroSpeed: 5.2, critterSpeed: 3.6, frightTime: 10, rageTime: 4, rageBoost: 1.15, releaseGap: 7, scatter: 8, chase: 12, ready: 4, lives: 4, labelScale: 2 },
  1: { heroSpeed: 6.0, critterSpeed: 4.8, frightTime: 8, rageTime: 5, rageBoost: 1.2, releaseGap: 4.5, scatter: 7, chase: 18, ready: 3, lives: 3, labelScale: 1 },
  2: { heroSpeed: 6.5, critterSpeed: 5.5, frightTime: 7, rageTime: 6, rageBoost: 1.22, releaseGap: 3.5, scatter: 6, chase: 20, ready: 2.5, lives: 3, labelScale: 1 },
  3: { heroSpeed: 7.0, critterSpeed: 6.1, frightTime: 6, rageTime: 6, rageBoost: 1.25, releaseGap: 3, scatter: 5, chase: 22, ready: 2.5, lives: 3, labelScale: 1 },
};

/** Tuning for a grade on maze number `level` (1-based). */
export function tuningFor(g: Grade, level = 1): Tuning {
  const band = bandOf(g);
  const b = BASE[band];
  const n = gradeNumber(g);
  const critters = n === 0 ? [0, 3] : band === 0 ? [0, 2, 3] : [0, 1, 2, 3];
  const lv = Math.max(0, level - 1);
  const heroSpeed = Math.min(b.heroSpeed * (1 + 0.02 * lv), b.heroSpeed * 1.12);
  // Critters speed up 4% a maze but always stay a little slower than the hero.
  const critterSpeed = Math.min(b.critterSpeed * (1 + 0.04 * lv), heroSpeed * 0.95);
  return {
    ...b,
    band,
    critters,
    heroSpeed,
    critterSpeed,
    frightTime: Math.max(b.frightTime * 0.6, b.frightTime - 0.5 * lv),
    releaseGap: Math.max(b.releaseGap * 0.6, b.releaseGap - 0.3 * lv),
  };
}

/** The maze for a grade and level: K–2 get the small mazes. */
export function mazeFor(g: Grade, level: number): Maze {
  const list = bandOf(g) === 0 ? SMALL_MAZES : BIG_MAZES;
  return list[(level - 1) % list.length];
}

/** Speed while fired-up after a wrong answer: faster, but never faster than the hero. */
export function rageSpeed(t: Tuning): number {
  return Math.min(t.critterSpeed * t.rageBoost, t.heroSpeed);
}
