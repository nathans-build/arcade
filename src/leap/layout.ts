import { rowSpan, textWidth } from "./font";

/* Screen layout and difficulty for each grade band. Pure (no DOM) so the checker can use it. */

export const W = 320;
export const H = 200;

export const HOME_H = 26;
export const BANK_H = 14;
export const MEDIAN_H = 12;
export const START_H = 14;
export const TIMER_H = 4;
const LANES_SPACE = H - HOME_H - BANK_H - MEDIAN_H - START_H - TIMER_H; // 130

/** Widest log allowed, and padding around its label. */
export const MAX_LOG_W = 100;
export const LOG_PAD = 6;
export const MIN_LOG_W = 40;

/** Home doorways: four 64px slots with hedges between. */
export const SLOT_W = 64;
export const slotLeft = (i: number) => 8 + i * 80;
export function slotAt(x: number): number {
  for (let i = 0; i < 4; i++) if (x >= slotLeft(i) && x <= slotLeft(i) + SLOT_W) return i;
  return -1;
}

export interface Band {
  name: "k2" | "35" | "68" | "912";
  roadLanes: number;
  riverLanes: number;
  laneH: number;
  homeH: number;
  /** Seconds per attempt. */
  time: number;
  lives: number;
  /** Rule-break forgiveness per round. */
  shields: number;
  /** Speeds in px/s at level 1. */
  road: [number, number];
  river: [number, number];
  /** Vehicles per road lane. */
  cars: [number, number];
  /** Share of river logs that follow the rule. */
  matchShare: number;
  /** Labels may use double-size text. */
  bigText: boolean;
}

export function bandFor(grade: number): Band {
  const mk = (b: Omit<Band, "laneH" | "homeH">): Band => {
    const n = b.roadLanes + b.riverLanes;
    const laneH = Math.floor(LANES_SPACE / n);
    return { ...b, laneH, homeH: HOME_H + (LANES_SPACE - laneH * n) };
  };
  if (grade <= 2)
    return mk({ name: "k2", roadLanes: 2, riverLanes: 3, time: 75, lives: 4, shields: 2, road: [14, 22], river: [8, 12], cars: [2, 2], matchShare: 0.6, bigText: true });
  if (grade <= 5)
    return mk({ name: "35", roadLanes: 3, riverLanes: 3, time: 60, lives: 3, shields: 1, road: [18, 32], river: [10, 15], cars: [2, 3], matchShare: 0.55, bigText: true });
  if (grade <= 8)
    return mk({ name: "68", roadLanes: 4, riverLanes: 3, time: 55, lives: 3, shields: 1, road: [22, 38], river: [11, 17], cars: [2, 3], matchShare: 0.5, bigText: false });
  return mk({ name: "912", roadLanes: 4, riverLanes: 4, time: 55, lives: 3, shields: 1, road: [24, 44], river: [12, 19], cars: [2, 3], matchShare: 0.5, bigText: false });
}

/** Speed multiplier for a level (gentle ramp, capped). */
export function levelSpeed(level: number): number {
  return Math.min(1.6, 1 + 0.07 * (level - 1));
}

/** Label scale for a rule's logs: 2 when every label fits big, else 1. */
export function labelScale(labels: string[], band: Band): 1 | 2 {
  if (!band.bigText) return 1;
  const logH = band.laneH - 4;
  const ok = labels.every((l) => {
    const [lo, hi] = rowSpan(l);
    return textWidth(l, 2) + LOG_PAD * 2 <= MAX_LOG_W && (hi - lo + 1) * 2 <= logH - 3;
  });
  return ok ? 2 : 1;
}

/** Log width for a rule (all logs in the round share it, so gaps stay fair). */
export function logWidth(labels: string[], scale: number): number {
  const w = Math.max(...labels.map((l) => textWidth(l, scale)));
  return Math.max(MIN_LOG_W, w + LOG_PAD * 2);
}

/** True when a label can be drawn on a log for this band. */
export function labelFits(label: string, band: Band): boolean {
  const [lo, hi] = rowSpan(label);
  return textWidth(label, 1) + LOG_PAD * 2 <= MAX_LOG_W && hi - lo + 1 <= band.laneH - 6;
}
