import type { Band } from "./band";
import type { ClueReward } from "./boosts";
import { VIRUS_IDS, ZONES, ZONE_IDS, type PowerId, type VirusId, type ZoneId } from "./roster";

/*
 * Boss-fight and save rules, kept pure so tests can check them.
 *
 * A stage germ (and every Major Virus) is only beaten by right answers. Its antigen panel opens after a
 * few granule hits (or by itself after a while), and then it asks a question:
 *   right  -> a big hit (two if the player used the germ's weak-spot skill since the last question)
 *   wrong  -> the germ blocks; the explanation shows, and NOTHING else changes (no HP, energy or lives lost).
 *             The next panel asks a new question.
 * Lives are only lost to hazards (pits, bumps, shots).
 */

export interface Fight {
  hp: number;
  maxHp: number;
  /** Set when the weak-spot skill was used since the last question. */
  weakReady: boolean;
  right: number;
  wrong: number;
}

export interface AnswerResult {
  correct: boolean;
  damage: number;
  /** True when this answer used the weak-spot bonus. */
  weakness: boolean;
  defeated: boolean;
  /** Antigen Clue answers: what it gave (energy, skill meter, maybe a power-up). */
  reward?: ClueReward;
}

/** Stage germ HP by grade band (K-2 gentler). */
export function bossHp(band: Band): number {
  return band === "k2" ? 3 : band === "g35" ? 4 : 5;
}

/** Major Virus HP in the rush (six in a row, so each is shorter; the last one, Coronavirus, has one more). */
export function virusHp(band: Band, last = false): number {
  const base = band === "k2" ? 2 : band === "hs" ? 4 : 3;
  return last ? base + 1 : base;
}

/** Granule hits that open a boss's antigen panel (it also opens by itself after panelTimeout frames). */
export function panelHits(band: Band): number {
  return band === "k2" ? 2 : 3;
}
export function panelTimeout(band: Band): number {
  return band === "k2" ? 6 * 60 : 10 * 60;
}

export function newFight(hp: number): Fight {
  return { hp, maxHp: hp, weakReady: false, right: 0, wrong: 0 };
}

/** Applies one answer. Wrong answers never change HP (and the sim never takes energy or lives for them). */
export function applyAnswer(f: Fight, correct: boolean): AnswerResult {
  if (!correct) {
    f.wrong++;
    // A blocked answer keeps the weak-spot bonus waiting for the next right answer.
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

export const SAVE_KEY = "arcade.germ-fighters.save.v1";

export interface SaveData {
  /** Stage germs identified, in the order they were beaten. */
  beaten: ZoneId[];
  /** Major Viruses identified at least once (the virus fact cards collected). */
  viruses: VirusId[];
  /** The whole Major Virus rush has been cleared at least once. */
  rush: boolean;
}

export const EMPTY_SAVE: SaveData = { beaten: [], viruses: [], rush: false };

function uniqueOf<T extends string>(v: unknown, ids: readonly T[]): T[] {
  return Array.isArray(v) ? v.filter((id, i, a): id is T => (ids as readonly string[]).includes(id as string) && a.indexOf(id) === i) : [];
}

export function parseSave(raw: string | null): SaveData {
  if (!raw) return { ...EMPTY_SAVE, beaten: [], viruses: [] };
  try {
    const v = JSON.parse(raw) as Partial<SaveData>;
    const beaten = uniqueOf(v.beaten, ZONE_IDS);
    const viruses = uniqueOf(v.viruses, VIRUS_IDS);
    return { beaten, viruses, rush: v.rush === true && beaten.length === ZONE_IDS.length };
  } catch {
    return { ...EMPTY_SAVE, beaten: [], viruses: [] };
  }
}

export function loadSave(): SaveData {
  try {
    return parseSave(localStorage.getItem(SAVE_KEY));
  } catch {
    return { ...EMPTY_SAVE, beaten: [], viruses: [] };
  }
}

export function writeSave(s: SaveData) {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(s));
  } catch {
    // storage unavailable
  }
}

/** Records a beaten stage germ (idempotent) and returns the new save. */
export function markBeaten(s: SaveData, id: ZoneId): SaveData {
  const beaten = s.beaten.includes(id) ? s.beaten : [...s.beaten, id];
  return { ...s, beaten };
}

/** Records an identified Major Virus (its fact card is collected). */
export function markVirus(s: SaveData, id: VirusId): SaveData {
  return s.viruses.includes(id) ? s : { ...s, viruses: [...s.viruses, id] };
}

export function markRush(s: SaveData): SaveData {
  return { ...s, rush: s.beaten.length === ZONE_IDS.length ? true : s.rush };
}

/** Immune skills the hero has, in the order they were earned. */
export function powersOf(s: SaveData): PowerId[] {
  return s.beaten.map((id) => ZONES.find((z) => z.id === id)!.power);
}

/** The Lymph Node (Major Virus rush) opens once all eight stage germs are identified. */
export function rushOpen(s: SaveData): boolean {
  return ZONE_IDS.every((id) => s.beaten.includes(id));
}
