/*
 * Gameplay numbers: defenders, undead, levels and per-band tuning.
 * Logical screen 320×200. The lawn is 9 columns × 5 rows of 30×35 cells starting at (30, 22).
 */
import type { Band, PlantKind } from "@/data/parts";

export const W = 320;
export const H = 200;
export const LAWN_X = 30;
export const LAWN_Y = 22;
export const CELL_W = 30;
export const CELL_H = 35;
export const COLS = 9;
export const ROWS = 5;

export interface PlantDef {
  kind: PlantKind;
  cost: number;
  hp: number;
  /** Seed-card recharge, seconds. */
  cooldown: number;
  /** Seconds between actions (shots, light, water…); 0 = none. */
  every: number;
  /** Seed-card hotkey (never A–D or 1–4). */
  key: string;
}

export const PLANTS: Record<PlantKind, PlantDef> = {
  sunleaf: { kind: "sunleaf", cost: 50, hp: 70, cooldown: 5, every: 6, key: "Q" },
  slinger: { kind: "slinger", cost: 100, hp: 90, cooldown: 5, every: 1.5, key: "W" },
  rootknot: { kind: "rootknot", cost: 50, hp: 480, cooldown: 14, every: 7, key: "E" },
  thorn: { kind: "thorn", cost: 75, hp: 260, cooldown: 10, every: 0, key: "R" },
  stem: { kind: "stem", cost: 75, hp: 110, cooldown: 8, every: 0, key: "T" },
  pollen: { kind: "pollen", cost: 100, hp: 90, cooldown: 8, every: 3.2, key: "Y" },
  berry: { kind: "berry", cost: 150, hp: 200, cooldown: 22, every: 0, key: "U" },
  frond: { kind: "frond", cost: 150, hp: 90, cooldown: 8, every: 2.2, key: "I" },
  stoma: { kind: "stoma", cost: 50, hp: 70, cooldown: 7, every: 6, key: "O" },
  chloro: { kind: "chloro", cost: 125, hp: 110, cooldown: 14, every: 7, key: "P" },
};

/** Card order in the tray (matches the hotkeys Q W E R T Y U I O P). */
export const TRAY: PlantKind[] = ["sunleaf", "slinger", "rootknot", "thorn", "stem", "pollen", "berry", "frond", "stoma", "chloro"];

export type UndeadKind = "grumbones" | "rotling" | "blightbug" | "frostwraith" | "shade" | "stump" | "weedlich";

export interface UndeadDef {
  kind: UndeadKind;
  name: string;
  blurb: string;
  hp: number;
  /** Pixels per second at band speed 1. */
  speed: number;
  /** Damage per second while munching a plant. */
  dps: number;
  points: number;
  /** Floats (Frost Wraith, Shade): drawn bobbing above the grass. */
  floats?: boolean;
}

export const UNDEAD: Record<UndeadKind, UndeadDef> = {
  grumbones: { kind: "grumbones", name: "Grumbones", blurb: "a grumpy skeleton gardener with a bent rake", hp: 100, speed: 5.5, dps: 18, points: 50 },
  rotling: { kind: "rotling", name: "Rotling", blurb: "a moldy, wobbly blob that hums to itself", hp: 75, speed: 8, dps: 14, points: 40 },
  blightbug: { kind: "blightbug", name: "Blight Bug", blurb: "tiny leaf-munching beetles that come in a swarm", hp: 24, speed: 13, dps: 9, points: 15 },
  frostwraith: { kind: "frostwraith", name: "Frost Wraith", blurb: "a chilly ghost: cold slows photosynthesis!", hp: 120, speed: 5.5, dps: 14, points: 90, floats: true },
  shade: { kind: "shade", name: "Shade", blurb: "a gloomy cloud that dims the sky and blocks light", hp: 140, speed: 4.5, dps: 10, points: 90, floats: true },
  stump: { kind: "stump", name: "Stump Shambler", blurb: "a walking rotten stump, very tough", hp: 360, speed: 4, dps: 24, points: 120 },
  weedlich: { kind: "weedlich", name: "Weed Lich", blurb: "the boss: a giant weed wizard who summons Blight Bugs", hp: 2200, speed: 2.4, dps: 50, points: 1500 },
};

export interface LevelDef {
  name: string;
  /** Sky light, 0–1 (dusk and night cut light, so leaves make less food). */
  light: number;
  /** Defenders that become available on this level (they stay for later levels). */
  unlock: PlantKind[];
  /** Spawn weights for the undead on this level. */
  pool: Partial<Record<UndeadKind, number>>;
  boss?: boolean;
}

export const LEVELS: LevelDef[] = [
  { name: "SUNNY BACKYARD", light: 1, unlock: ["sunleaf", "slinger", "rootknot"], pool: { grumbones: 4, rotling: 1 } },
  { name: "GARDEN AFTERNOON", light: 1, unlock: ["thorn", "stem"], pool: { grumbones: 3, rotling: 3, blightbug: 2 } },
  { name: "TWILIGHT BEDS", light: 0.55, unlock: ["pollen", "berry"], pool: { grumbones: 3, rotling: 2, blightbug: 2, shade: 2 } },
  { name: "FROSTY DAWN", light: 0.8, unlock: ["frond", "stoma"], pool: { grumbones: 2, rotling: 2, blightbug: 2, frostwraith: 3, stump: 1 } },
  { name: "THE WEED LICH", light: 0.9, unlock: ["chloro"], pool: { grumbones: 3, rotling: 2, blightbug: 2, frostwraith: 2, shade: 2, stump: 2 }, boss: true },
];

export interface Tuning {
  band: Band;
  /** Rows the undead use (K–2 play on the middle three). */
  lanes: number[];
  speedMul: number;
  hpMul: number;
  /** Undead per wave = round((base + level*perLevel) * countMul). */
  countMul: number;
  wavesPerLevel: number;
  hearts: number;
  startGlucose: number;
  /** Seconds between falling sunlight motes at full light. */
  moteEvery: number;
  /** Seconds between free water / CO₂ from soil and air. */
  waterEvery: number;
  co2Every: number;
  /** Seconds before the first wave of a level, and between waves. */
  firstWait: number;
  waveWait: number;
  /** Glucose from one photosynthesis batch. */
  batch: number;
}

export function tuningFor(band: Band): Tuning {
  switch (band) {
    case 0:
      return { band, lanes: [1, 2, 3], speedMul: 0.65, hpMul: 0.7, countMul: 0.6, wavesPerLevel: 2, hearts: 5, startGlucose: 150, moteEvery: 3.5, waterEvery: 5, co2Every: 5, firstWait: 22, waveWait: 10, batch: 25 };
    case 1:
      return { band, lanes: [0, 1, 2, 3, 4], speedMul: 0.8, hpMul: 0.85, countMul: 0.85, wavesPerLevel: 3, hearts: 4, startGlucose: 125, moteEvery: 4.5, waterEvery: 6, co2Every: 6, firstWait: 20, waveWait: 9, batch: 25 };
    case 2:
      return { band, lanes: [0, 1, 2, 3, 4], speedMul: 0.95, hpMul: 1, countMul: 1, wavesPerLevel: 3, hearts: 3, startGlucose: 100, moteEvery: 5, waterEvery: 7, co2Every: 7, firstWait: 18, waveWait: 8, batch: 25 };
    default:
      return { band, lanes: [0, 1, 2, 3, 4], speedMul: 1.05, hpMul: 1.15, countMul: 1.15, wavesPerLevel: 3, hearts: 3, startGlucose: 100, moteEvery: 5.5, waterEvery: 7, co2Every: 7, firstWait: 18, waveWait: 8, batch: 25 };
  }
}

/** Defenders available on a level (cumulative). */
export function availableOn(level: number): PlantKind[] {
  const out: PlantKind[] = [];
  for (let i = 0; i < Math.min(level, LEVELS.length); i++) out.push(...LEVELS[i].unlock);
  return out;
}

export function cellX(col: number) {
  return LAWN_X + col * CELL_W;
}
export function cellY(row: number) {
  return LAWN_Y + row * CELL_H;
}
