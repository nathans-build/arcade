import type { Band } from "./band";
import { ROBOTS, ROBOT_IDS, type PowerId, type RobotId } from "./robots";

/*
 * Boss-fight and save rules, kept pure so tests can check them.
 *
 * A Robo Master can only be rebooted by right answers. Its reboot panel opens after a few beam
 * hits (or by itself after a while), and then it asks a question:
 *   right  -> a big reboot hit (two if the player used the robot's weakness power since the last question)
 *   wrong  -> the robot blocks; it shows the explanation, and NOTHING else changes
 *             (no HP, energy or lives lost). The next panel asks a new question.
 * Lives are only lost to hazards (pits, zaps, bumps).
 */

export interface Fight {
  hp: number;
  maxHp: number;
  /** Set when the weakness power was used since the last question. */
  weakReady: boolean;
  right: number;
  wrong: number;
}

export interface AnswerResult {
  correct: boolean;
  damage: number;
  /** True when this answer used the weakness bonus. */
  weakness: boolean;
  defeated: boolean;
}

/** Boss HP by grade band (K-2 gentler); the fortress boss has more. */
export function bossHp(band: Band, fortress = false): number {
  const base = band === "k2" ? 3 : band === "g35" ? 4 : 5;
  return fortress ? base + 3 : base;
}

/** Beam hits that open a boss's reboot panel (it also opens by itself after PANEL_TIMEOUT frames). */
export function panelHits(band: Band): number {
  return band === "k2" ? 2 : 3;
}
export function panelTimeout(band: Band): number {
  return band === "k2" ? 6 * 60 : 10 * 60;
}

export function newFight(band: Band, fortress = false): Fight {
  const hp = bossHp(band, fortress);
  return { hp, maxHp: hp, weakReady: false, right: 0, wrong: 0 };
}

/** Applies one answer. Wrong answers never change HP (and the sim never takes energy or lives for them). */
export function applyAnswer(f: Fight, correct: boolean): AnswerResult {
  if (!correct) {
    f.wrong++;
    // A blocked answer keeps the weakness bonus waiting for the next right answer.
    return { correct, damage: 0, weakness: false, defeated: f.hp <= 0 };
  }
  const weakness = f.weakReady;
  const damage = weakness ? 2 : 1;
  f.hp = Math.max(0, f.hp - damage);
  f.weakReady = false;
  f.right++;
  return { correct, damage, weakness, defeated: f.hp <= 0 };
}

// ------------------------------------------------------------------ save (password-free)

export const SAVE_KEY = "arcade.robo-masters.save.v1";

export interface SaveData {
  /** Robo Masters rebooted, in the order they were beaten. */
  beaten: RobotId[];
  /** The Static Citadel has been cleared at least once. */
  fortress: boolean;
}

export const EMPTY_SAVE: SaveData = { beaten: [], fortress: false };

export function parseSave(raw: string | null): SaveData {
  if (!raw) return { ...EMPTY_SAVE, beaten: [] };
  try {
    const v = JSON.parse(raw) as Partial<SaveData>;
    const beaten = Array.isArray(v.beaten) ? v.beaten.filter((id, i, a): id is RobotId => (ROBOT_IDS as string[]).includes(id as string) && a.indexOf(id) === i) : [];
    return { beaten, fortress: v.fortress === true && beaten.length === ROBOT_IDS.length };
  } catch {
    return { ...EMPTY_SAVE, beaten: [] };
  }
}

export function loadSave(): SaveData {
  try {
    return parseSave(localStorage.getItem(SAVE_KEY));
  } catch {
    return { ...EMPTY_SAVE, beaten: [] };
  }
}

export function writeSave(s: SaveData) {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(s));
  } catch {
    // storage unavailable
  }
}

/** Records a beaten robot (idempotent) and returns the new save. */
export function markBeaten(s: SaveData, id: RobotId): SaveData {
  const beaten = s.beaten.includes(id) ? s.beaten : [...s.beaten, id];
  return { ...s, beaten };
}

export function markFortress(s: SaveData): SaveData {
  return { ...s, fortress: s.beaten.length === ROBOT_IDS.length ? true : s.fortress };
}

/** Powers the hero has, in the order they were earned. */
export function powersOf(s: SaveData): PowerId[] {
  return s.beaten.map((id) => ROBOTS.find((r) => r.id === id)!.power);
}

export function fortressOpen(s: SaveData): boolean {
  return ROBOT_IDS.every((id) => s.beaten.includes(id));
}
