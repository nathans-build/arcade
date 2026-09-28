/*
 * Physics constants for Jungle Run. Pure data (no DOM) so the scene checker in
 * scripts/check-data.ts can prove every generated scene is traversable.
 */

/** Logical screen size (canvas is scaled with nearest-neighbour). */
export const W = 320;
export const H = 200;
/** y of the ground surface the hero walks on. */
export const GROUND = 150;
/** The hero's hitbox. */
export const HERO_W = 10;
export const HERO_H = 18;

/** Grade bands: 0 = K–2, 1 = 3–5, 2 = 6–8, 3 = 9–12. */
export type Band = 0 | 1 | 2 | 3;
export function bandOf(grade: number): Band {
  return grade <= 2 ? 0 : grade <= 5 ? 1 : grade <= 8 ? 2 : 3;
}

export interface Phys {
  /** px/s² */
  gravity: number;
  /** Take-off speed of a jump, px/s. */
  jumpV: number;
  /** Walking speed, px/s. */
  run: number;
  /** Horizontal speed while in the air (full air control), px/s. */
  airRun: number;
  /** Climbing speed on ladders, px/s. */
  climb: number;
}

const PHYS: Record<Band, Phys> = {
  // K–2: floatier, longer jumps ("wider jumps") and a slower walk.
  0: { gravity: 500, jumpV: 200, run: 62, airRun: 84, climb: 50 },
  1: { gravity: 580, jumpV: 205, run: 70, airRun: 76, climb: 56 },
  2: { gravity: 600, jumpV: 205, run: 72, airRun: 74, climb: 60 },
  3: { gravity: 620, jumpV: 208, run: 74, airRun: 74, climb: 62 },
};

export function physFor(band: Band): Phys {
  return PHYS[band];
}

/** Seconds in the air for a jump from flat ground. */
export function airTime(p: Phys): number {
  return (2 * p.jumpV) / p.gravity;
}
/** Height the hero's feet rise at the top of a jump. */
export function jumpPeak(p: Phys): number {
  return (p.jumpV * p.jumpV) / (2 * p.gravity);
}
/** Horizontal distance covered by a full running jump. */
export function jumpDist(p: Phys): number {
  return p.airRun * airTime(p);
}

/** Critter and object sizes (hitboxes). */
export const LOG_W = 12;
export const LOG_H = 10;
export const SNAKE_W = 14;
export const SNAKE_H = 8;
export const SCORP_W = 14;
export const SCORP_H = 8;
export const CROC_W = 28;
/** Crocs face left (toward the explorer); this much of the head's left end is the jaw. */
export const CROC_MOUTH = 10;
export const LADDER_W = 16;
export const TREASURE_W = 10;
