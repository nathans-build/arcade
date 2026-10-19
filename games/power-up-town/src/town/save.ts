import { BANDS, safeStorage, type Band } from "./common";
import { LEVEL_COUNT } from "./town";

/*
 * Saved town progress (per browser; the arcade swaps arcade.* keys per player). Each grade band
 * has its own street: solving a building's level lights it and opens the next one. Sparky Run
 * stars are kept per building (best). Nothing is ever locked again.
 */

export const SAVE_KEY = "arcade.power-up-town.save.v1";

export interface BandSave {
  solved: boolean[];
  /** Best Sparky Run stars per building (0-3). */
  run: number[];
}
export type TownSave = Record<Band, BandSave>;

export function freshBand(): BandSave {
  return { solved: Array(LEVEL_COUNT).fill(false), run: Array(LEVEL_COUNT).fill(0) };
}

export function freshSave(): TownSave {
  return { k2: freshBand(), g35: freshBand(), g68: freshBand(), hs: freshBand() };
}

export function parseSave(raw: string | null): TownSave {
  const s = freshSave();
  if (!raw) return s;
  try {
    const v = JSON.parse(raw) as Partial<Record<Band, Partial<BandSave>>>;
    for (const b of BANDS) {
      const src = v?.[b];
      if (!src) continue;
      for (let i = 0; i < LEVEL_COUNT; i++) {
        s[b].solved[i] = Array.isArray(src.solved) && src.solved[i] === true;
        const r = Array.isArray(src.run) ? Math.floor(Number(src.run[i]) || 0) : 0;
        s[b].run[i] = Math.max(0, Math.min(3, r));
      }
    }
  } catch {
    // corrupt: start fresh
  }
  return s;
}

export function loadSave(store: Pick<Storage, "getItem"> | null = safeStorage()): TownSave {
  try {
    return parseSave(store?.getItem(SAVE_KEY) ?? null);
  } catch {
    return freshSave();
  }
}

export function writeSave(s: TownSave, store: Pick<Storage, "setItem"> | null = safeStorage()) {
  try {
    store?.setItem(SAVE_KEY, JSON.stringify(s));
  } catch {
    // ignore
  }
}

/** A building's level can be played once the one before it is lit (the first is always open). */
export function isOpen(s: TownSave, band: Band, i: number): boolean {
  if (i < 0 || i >= LEVEL_COUNT) return false;
  return i === 0 || s[band].solved[i - 1] || s[band].solved[i];
}

/** The first building still dark (or the last one when the town is lit). */
export function nextLevel(s: TownSave, band: Band): number {
  const i = s[band].solved.findIndex((x) => !x);
  return i < 0 ? LEVEL_COUNT - 1 : i;
}

export function litCount(s: TownSave, band: Band): number {
  return s[band].solved.filter(Boolean).length;
}

export function townLit(s: TownSave, band: Band): boolean {
  return litCount(s, band) === LEVEL_COUNT;
}

function clone(s: TownSave): TownSave {
  return JSON.parse(JSON.stringify(s)) as TownSave;
}

/** Lights building i. Returns the new save. */
export function solveLevel(s: TownSave, band: Band, i: number): TownSave {
  const n = clone(s);
  if (i >= 0 && i < LEVEL_COUNT) n[band].solved[i] = true;
  return n;
}

export function recordRun(s: TownSave, band: Band, i: number, stars: number): TownSave {
  const n = clone(s);
  if (i >= 0 && i < LEVEL_COUNT) n[band].run[i] = Math.max(n[band].run[i], Math.max(0, Math.min(3, Math.floor(stars))));
  return n;
}
