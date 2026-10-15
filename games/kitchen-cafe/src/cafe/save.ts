import { KITCHEN_COUNT } from "./kitchens";
import { safeStorage } from "./topics";

/*
 * Saved café progress (per browser; the arcade swaps arcade.* keys per player).
 * Kitchens unlock in order: finishing a shift (every order served, whatever the answers)
 * opens the next one. Wrong answers never lock anything again.
 */

export const SAVE_KEY = "arcade.kitchen-cafe.save.v1";

export interface CafeSave {
  /** Highest kitchen the player may open (1-4). */
  unlocked: number;
  /** Best stars per kitchen (index 0 = kitchen 1). */
  best: number[];
  /** Kitchens finished at least once. */
  cleared: boolean[];
}

export function freshSave(): CafeSave {
  return { unlocked: 1, best: Array(KITCHEN_COUNT).fill(0), cleared: Array(KITCHEN_COUNT).fill(false) };
}

export function parseSave(raw: string | null): CafeSave {
  const s = freshSave();
  if (!raw) return s;
  try {
    const v = JSON.parse(raw) as Partial<CafeSave>;
    const u = Number(v.unlocked);
    if (Number.isInteger(u)) s.unlocked = Math.min(KITCHEN_COUNT, Math.max(1, u));
    if (Array.isArray(v.best)) for (let i = 0; i < KITCHEN_COUNT; i++) s.best[i] = Math.max(0, Math.floor(Number(v.best[i]) || 0));
    if (Array.isArray(v.cleared)) for (let i = 0; i < KITCHEN_COUNT; i++) s.cleared[i] = v.cleared[i] === true;
  } catch {
    // corrupt: start fresh
  }
  return s;
}

export function loadSave(store: Pick<Storage, "getItem"> | null = safeStorage()): CafeSave {
  try {
    return parseSave(store?.getItem(SAVE_KEY) ?? null);
  } catch {
    return freshSave();
  }
}

export function writeSave(s: CafeSave, store: Pick<Storage, "setItem"> | null = safeStorage()) {
  try {
    store?.setItem(SAVE_KEY, JSON.stringify(s));
  } catch {
    // ignore
  }
}

export function isUnlocked(s: CafeSave, kitchen: number): boolean {
  return kitchen >= 1 && kitchen <= s.unlocked;
}

/** A finished shift: records the stars and unlocks the next kitchen. Returns the new save. */
export function finishShift(s: CafeSave, kitchen: number, stars: number): CafeSave {
  const next: CafeSave = { unlocked: s.unlocked, best: [...s.best], cleared: [...s.cleared] };
  const i = kitchen - 1;
  if (i < 0 || i >= KITCHEN_COUNT) return next;
  next.best[i] = Math.max(next.best[i], stars);
  next.cleared[i] = true;
  next.unlocked = Math.min(KITCHEN_COUNT, Math.max(next.unlocked, kitchen + 1));
  return next;
}
