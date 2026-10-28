/*
 * Dojo Tower: Rates & Percents — scoring and boss-quiz rules. Pure functions (no DOM), unit-tested by
 * scripts/check-rules.ts.
 *
 * - Every right answer adds 1 to the streak and 1 pip to the Thunder meter (max 3).
 * - A wrong answer resets the streak and empties the meter. It never costs energy or a life.
 * - Boss fight: a right answer lands a combo hit (1 damage). When that answer fills the meter,
 *   the hit becomes a THUNDER KICK (2 damage) and the meter empties. A wrong answer means the
 *   boss blocks: no damage either way. So a boss can only ever lose HP, and the fight always
 *   ends in a win; wrong answers just make it take longer.
 * - COMBO story problems: the final answer right on the first try is a BIG COMBO (power 2: two hits,
 *   plus bonus points). When a combo breaks into steps, each right step is one hit, but the master
 *   "hangs on" at 1 HP until the last step of the chain is answered, so the story always finishes.
 * - On the floors, a full meter can be spent with T (or the ⚡ button) to clear the screen.
 * - Ink stars: poofing STAR_GOAL star-throwing ninjas grants a short burst (STAR_BURST seconds of
 *   running time) of foam ink stars, thrown with S. Only throwers count, and not during a burst;
 *   the counter resets when the burst ends. Ink stars only poof ninjas and blobs on the floors:
 *   floor masters are only ever beaten by answering.
 */

export const METER_MAX = 3;
/** Floors in the full climb (floor 8, the bridge, is a bonus floor of its own). */
export const FLOORS = 7;
/** Bonus points for a COMBO story problem answered right on the first try. */
export const COMBO_BONUS = 1000;
export const STAR_GOAL = 5;
export const STAR_BURST = 8;
export const STAR_COOLDOWN = 0.35;

export interface Streak {
  streak: number;
  best: number;
  meter: number;
}

export interface Fight {
  hp: number;
  maxHp: number;
  /** Right answers in a row in this fight (the combo multiplier). */
  combo: number;
  asked: number;
  right: number;
}

export interface BossResult {
  correct: boolean;
  damage: number;
  thunder: boolean;
  blocked: boolean;
  defeated: boolean;
  points: number;
  /** A BIG COMBO (a story problem solved on the first try). */
  big: boolean;
}

export function newStreak(): Streak {
  return { streak: 0, best: 0, meter: 0 };
}

/** Records an answer anywhere (scroll or boss). Returns the new streak and whether the meter just filled. */
export function applyAnswer(s: Streak, correct: boolean): { streak: Streak; filled: boolean } {
  if (!correct) return { streak: { streak: 0, best: s.best, meter: 0 }, filled: false };
  const streak = s.streak + 1;
  const meter = Math.min(METER_MAX, s.meter + 1);
  return { streak: { streak, best: Math.max(s.best, streak), meter }, filled: meter >= METER_MAX && s.meter < METER_MAX };
}

/** Spends a full meter (floors). Returns null when the meter is not full. */
export function spendThunder(s: Streak): Streak | null {
  return s.meter >= METER_MAX ? { ...s, meter: 0 } : null;
}

/** A star-throwing ninja was poofed: count it toward the ink-star burst (not while one is on). */
export function onThrowerDefeated(count: number, burstOn: boolean): { count: number; burst: boolean } {
  if (burstOn) return { count, burst: false };
  const n = Math.min(STAR_GOAL, count + 1);
  return { count: n, burst: n >= STAR_GOAL };
}

export function newFight(hp: number): Fight {
  return { hp, maxHp: hp, combo: 0, asked: 0, right: 0 };
}

/** One boss question answered. Pure: returns the new fight and streak plus what happened. */
export function resolveBossAnswer(
  fight: Fight,
  s: Streak,
  correct: boolean,
  floor: number,
  opts: { power?: number; holdOn?: boolean } = {},
): { fight: Fight; streak: Streak; result: BossResult } {
  const power = opts.power ?? 1;
  const asked = fight.asked + 1;
  if (!correct) {
    const { streak } = applyAnswer(s, false);
    return {
      fight: { ...fight, asked, combo: 0 },
      streak,
      result: { correct: false, damage: 0, thunder: false, blocked: true, defeated: fight.hp <= 0, points: 0, big: false },
    };
  }
  let { streak } = applyAnswer(s, true);
  const thunder = streak.meter >= METER_MAX;
  if (thunder) streak = { ...streak, meter: 0 };
  const damage = Math.min(fight.hp - (opts.holdOn ? 1 : 0), power + (thunder ? 1 : 0));
  const combo = fight.combo + 1;
  const hp = fight.hp - Math.max(0, damage);
  const big = power > 1;
  const points = 100 * floor * combo + (thunder ? 500 : 0) + (big ? COMBO_BONUS : 0) + (hp <= 0 ? 1000 * floor : 0);
  return {
    fight: { ...fight, hp, combo, asked, right: fight.right + 1 },
    streak,
    result: { correct: true, damage: Math.max(0, damage), thunder, blocked: false, defeated: hp <= 0, points, big },
  };
}

/** Points for answering a ninja's question scroll. */
export function scrollPoints(correct: boolean, floor: number): number {
  return correct ? 250 + 50 * floor : 0;
}

export type EnemyKind = "ninja" | "blob" | "thrower" | "scroll";

export function enemyPoints(kind: EnemyKind): number {
  return kind === "ninja" ? 100 : kind === "blob" ? 150 : kind === "thrower" ? 200 : 300;
}

/** Bonus for clearing a floor with energy left. */
export function floorBonus(energy: number, floor: number): number {
  return energy * 50 + floor * 250;
}
