/*
 * Level builder: turns a site into a 26×20 tile map with its units (layers and an optional
 * dike), buried gems, boulders, critter tunnels and the level's collection goal.
 * Pure logic (no DOM), so scripts/check-geology.ts can test it for every grade.
 */
import { gradeNumber } from "../kit/grades";
import type { Grade } from "../kit/types";
import {
  GRADE_SITES, GROUND_ROWS, ROCKS, SITES, SPECIMENS, unitLabel,
  type Era, type Rock, type SiteDef, type SpecimenId, type UnitDef,
} from "./geology";

export const TILE = 10;
export const COLS = 26;
export const ROWS = 20;
/** First ground row (rows 0-1 are sky; the hero walks on row 1). */
export const GROUND_TOP = ROWS - GROUND_ROWS;
export const START_COL = 13;
export const START_ROW = 1;

export type Rng = () => number;

export interface Unit {
  index: number;
  def: UnitDef;
  rock: Rock;
  label: string;
  kind: "layer" | "dike";
  /** Inclusive tile rows. */
  top: number;
  bottom: number;
  /** Dike columns (inclusive). */
  cols?: [number, number];
  /** Units the dike cuts through (dike only). */
  cuts?: number[];
}

export interface Gem {
  col: number;
  row: number;
  specimen: SpecimenId;
  unit: number;
  target: boolean;
  state: "buried" | "collected" | "cracked";
}

export interface TunnelSpec {
  cells: [number, number][];
  critter: "bug" | "magmite";
}

export type GoalId =
  | "living" | "fossil" | "crystal" | "sedimentary" | "igneous" | "metamorphic"
  | "fuel" | "ore" | "cenozoic" | "mesozoic" | "paleozoic";

export interface Goal {
  id: GoalId;
  count: number;
  /** HUD text, e.g. "3 FOSSILS". */
  short: string;
  /** Sentence for the banner and read-aloud. */
  text: string;
}

export interface LevelData {
  grade: Grade;
  level: number;
  site: SiteDef;
  units: Unit[];
  /** Unit index per tile (row * COLS + col), -1 for sky. */
  unitAt: Int16Array;
  /** 1 where the tile starts dug out (critter tunnels and the sky rows). */
  dug: Uint8Array;
  gems: Gem[];
  boulders: [number, number][];
  tunnels: TunnelSpec[];
  goal: Goal;
}

export const idx = (col: number, row: number) => row * COLS + col;

export function pickOf<T>(rng: Rng, arr: readonly T[]): T {
  return arr[Math.floor(rng() * arr.length)];
}

export function shuffled<T>(rng: Rng, arr: readonly T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Small deterministic RNG (mulberry32), for tests and repeatable layouts. */
export function seeded(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function siteFor(grade: Grade, level: number): SiteDef {
  const list = GRADE_SITES[grade];
  return SITES[list[(level - 1) % list.length]];
}

/* ------------------------------------------------------------------ goals */

const GOAL_WORDS: Record<GoalId, [string, string]> = {
  living: ["LIVING THINGS", "living things"],
  fossil: ["FOSSILS", "fossils"],
  crystal: ["CRYSTALS", "crystals"],
  sedimentary: ["SEDIMENTARY", "gems from sedimentary rock"],
  igneous: ["IGNEOUS", "gems from igneous rock"],
  metamorphic: ["METAMORPHIC", "gems from metamorphic rock"],
  fuel: ["FOSSIL FUELS", "fossil fuels"],
  ore: ["ORES", "ore minerals"],
  cenozoic: ["CENOZOIC", "Cenozoic fossils"],
  mesozoic: ["MESOZOIC", "Mesozoic fossils"],
  paleozoic: ["PALEOZOIC", "Paleozoic fossils"],
};

export function goalMatches(goal: GoalId, specimen: SpecimenId, unit: Unit): boolean {
  const sp = SPECIMENS[specimen];
  switch (goal) {
    case "living":
    case "fossil":
    case "crystal":
    case "fuel":
    case "ore":
      return sp.kind === goal;
    case "sedimentary":
    case "igneous":
    case "metamorphic":
      return unit.rock.type === goal;
    case "cenozoic":
    case "mesozoic":
    case "paleozoic":
      return sp.kind === "fossil" && unit.def.era === (goal as Era);
  }
}

/** Goals each grade may be given (one is chosen per level from those the site can supply). */
export function goalsForGrade(grade: Grade): GoalId[] {
  const n = gradeNumber(grade);
  if (n === 0) return ["living", "crystal"];
  if (n <= 2) return ["living", "fossil", "crystal"];
  if (n <= 8) return ["sedimentary", "igneous", "metamorphic", "fossil", "crystal"];
  if (n === 9) return ["fuel", "ore", "sedimentary", "igneous", "metamorphic", "crystal"];
  if (n === 10) return ["cenozoic", "mesozoic", "paleozoic", "fossil", "crystal", "sedimentary"];
  return ["fuel", "ore", "mesozoic", "paleozoic", "crystal", "igneous", "sedimentary"];
}

export function goalCount(grade: Grade, level: number): number {
  const n = gradeNumber(grade);
  if (n <= 2) return level === 1 ? 2 : 3;
  return Math.min(5, 3 + Math.floor((level - 1) / 3));
}

function makeGoal(id: GoalId, count: number): Goal {
  const [short, words] = GOAL_WORDS[id];
  return { id, count, short: `${count} ${short}`, text: `Collect ${count} ${words}.` };
}

/* ------------------------------------------------------------------ units */

export function buildUnits(site: SiteDef, rng: Rng): { units: Unit[]; unitAt: Int16Array } {
  const units: Unit[] = [];
  const unitAt = new Int16Array(ROWS * COLS).fill(-1);
  let row = GROUND_TOP;
  site.units.forEach((def, i) => {
    const rock = ROCKS[def.rock];
    units.push({ index: i, def, rock, label: unitLabel(def), kind: "layer", top: row, bottom: row + def.rows - 1 });
    for (let r = row; r < row + def.rows; r++) for (let c = 0; c < COLS; c++) unitAt[idx(c, r)] = i;
    row += def.rows;
  });
  // Duplicate labels (two SHALE layers…) get UPPER / LOWER so every choice is distinct.
  const counts = new Map<string, number>();
  for (const u of units) counts.set(u.label, (counts.get(u.label) ?? 0) + 1);
  for (const [label, n] of counts) {
    if (n < 2) continue;
    const same = units.filter((u) => u.label === label);
    const words = n === 2 ? ["UPPER", "LOWER"] : ["TOP", "MIDDLE", "BOTTOM"];
    same.forEach((u, k) => (u.label = `${label} (${words[Math.min(k, words.length - 1)]})`));
  }
  if (site.dike) {
    const topUnit = site.dike.topMin + Math.floor(rng() * (site.dike.topMax - site.dike.topMin + 1));
    const c0 = 4 + Math.floor(rng() * (COLS - 10));
    const top = units[topUnit].top;
    const di = units.length;
    const cuts = units.filter((u) => u.index >= topUnit).map((u) => u.index);
    units.push({
      index: di, def: { rock: "basalt", rows: ROWS - top, specimens: [] }, rock: ROCKS.basalt, label: "BASALT DIKE",
      kind: "dike", top, bottom: ROWS - 1, cols: [c0, c0 + 1], cuts,
    });
    for (let r = top; r < ROWS; r++) for (let c = c0; c <= c0 + 1; c++) unitAt[idx(c, r)] = di;
  }
  return { units, unitAt };
}

/* ------------------------------------------------------------------ difficulty */

export function critterCount(grade: Grade, level: number): number {
  const n = gradeNumber(grade);
  if (n <= 2) return Math.min(3, 2 + Math.floor((level - 1) / 2));
  if (n <= 5) return Math.min(5, 3 + Math.floor((level - 1) / 2));
  return Math.min(6, 3 + Math.floor(level / 2));
}

export function magmiteCount(grade: Grade, level: number): number {
  const n = gradeNumber(grade);
  if (n <= 2 || level < 2) return 0;
  return level >= 4 ? 2 : 1;
}

/* ------------------------------------------------------------------ build */

function cheb(a: [number, number], b: [number, number]) {
  return Math.max(Math.abs(a[0] - b[0]), Math.abs(a[1] - b[1]));
}

export function buildLevel(grade: Grade, level: number, rng: Rng, prevGoal?: GoalId): LevelData {
  const site = siteFor(grade, level);
  const { units, unitAt } = buildUnits(site, rng);
  const dug = new Uint8Array(ROWS * COLS);
  for (let r = 0; r < GROUND_TOP; r++) for (let c = 0; c < COLS; c++) dug[idx(c, r)] = 1;
  const taken = new Uint8Array(ROWS * COLS); // tunnels, gems, boulders and their no-go margins
  const start: [number, number] = [START_COL, GROUND_TOP];

  /* critter tunnels */
  const tunnels: TunnelSpec[] = [];
  const nCrit = critterCount(grade, level);
  const nMag = magmiteCount(grade, level);
  for (let t = 0; t < nCrit; t++) {
    for (let tries = 0; tries < 200; tries++) {
      const horiz = rng() < 0.6;
      const len = horiz ? 4 + Math.floor(rng() * 3) : 3 + Math.floor(rng() * 3);
      const c0 = 1 + Math.floor(rng() * (COLS - 2 - (horiz ? len : 0)));
      const r0 = GROUND_TOP + 4 + Math.floor(rng() * (ROWS - GROUND_TOP - 5 - (horiz ? 0 : len)));
      const cells: [number, number][] = [];
      for (let k = 0; k < len; k++) cells.push(horiz ? [c0 + k, r0] : [c0, r0 + k]);
      if (cells.some(([c, r]) => c < 0 || c >= COLS || r >= ROWS || r < GROUND_TOP + 3)) continue;
      if (cells.some((p) => cheb(p, start) < 6)) continue;
      if (cells.some(([c, r]) => taken[idx(c, r)])) continue;
      // tunnels never cut a dike (keeps the cross-cutting picture clean)
      if (cells.some(([c, r]) => units[unitAt[idx(c, r)]].kind === "dike")) continue;
      for (const [c, r] of cells) {
        dug[idx(c, r)] = 1;
        for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
          const cc = c + dc, rr = r + dr;
          if (cc >= 0 && cc < COLS && rr >= 0 && rr < ROWS) taken[idx(cc, rr)] = 1;
        }
      }
      tunnels.push({ cells, critter: t < nMag ? "magmite" : "bug" });
      break;
    }
  }

  /* goal */
  const count = goalCount(grade, level);
  const layerUnits = units.filter((u) => u.kind === "layer");
  const pairs = (want: boolean, goal: GoalId) =>
    layerUnits.flatMap((u) => u.def.specimens.filter((s) => goalMatches(goal, s, u) === want).map((s) => ({ u, s })));
  let options = goalsForGrade(grade).filter((g) => pairs(true, g).length > 0);
  if (options.length === 0) options = ["crystal"];
  const fresh = options.filter((g) => g !== prevGoal);
  const goalId = pickOf(rng, fresh.length ? fresh : options);
  const goal = makeGoal(goalId, count);

  /* gems */
  const gems: Gem[] = [];
  const canGem = (c: number, r: number, strict: boolean) =>
    r >= GROUND_TOP && r < ROWS && c >= 0 && c < COLS && !(strict && taken[idx(c, r)]) && !dug[idx(c, r)] &&
    !gems.some((g) => g.col === c && g.row === r) &&
    !(Math.abs(c - START_COL) <= 1 && r <= GROUND_TOP + 1);
  const place = (u: Unit, s: SpecimenId, target: boolean) => {
    for (let tries = 0; tries < 900; tries++) {
      const r = u.top + Math.floor(rng() * (u.bottom - u.top + 1));
      const c = Math.floor(rng() * COLS);
      if (unitAt[idx(c, r)] !== u.index || !canGem(c, r, tries < 600)) continue;
      // keep gems apart; relax the spacing in crowded thin layers
      if (gems.some((g) => cheb([g.col, g.row], [c, r]) < (tries < 300 ? 3 : 2))) continue;
      gems.push({ col: c, row: r, specimen: s, unit: u.index, target, state: "buried" });
      taken[idx(c, r)] = 1;
      return true;
    }
    return false;
  };
  const targets = pairs(true, goalId);
  const others = pairs(false, goalId);
  // spread targets over the matching units in turn, so they are not all in one layer
  const byUnit = shuffled(rng, [...new Set(targets.map((p) => p.u))]);
  for (let k = 0, placed = 0; placed < count + 2 && k < 200; k++) {
    const u = byUnit[k % byUnit.length];
    const s = pickOf(rng, targets.filter((p) => p.u === u).map((p) => p.s));
    if (place(u, s, true)) placed++;
  }
  const nOther = gradeNumber(grade) <= 2 ? 2 : 3;
  for (let k = 0, placed = 0; placed < nOther && others.length && k < 40; k++) {
    const p = pickOf(rng, others);
    if (place(p.u, p.s, false)) placed++;
  }

  /* boulders */
  const boulders: [number, number][] = [];
  const nBoulders = gradeNumber(grade) <= 2 ? 3 : 4 + Math.min(2, Math.floor(level / 2));
  for (let k = 0; boulders.length < nBoulders && k < 400; k++) {
    const c = Math.floor(rng() * COLS);
    const r = GROUND_TOP + 1 + Math.floor(rng() * (ROWS - GROUND_TOP - 4));
    if (taken[idx(c, r)] || dug[idx(c, r)] || dug[idx(c, r + 1)] || gems.some((g) => g.col === c && g.row === r + 1)) continue;
    if (Math.abs(c - START_COL) <= 1) continue;
    if (boulders.some((b) => cheb(b, [c, r]) < 3)) continue;
    boulders.push([c, r]);
    taken[idx(c, r)] = 1;
  }

  return { grade, level, site, units, unitAt, dug, gems, boulders, tunnels, goal };
}

/** Gem specimens still able to meet the goal (for respawning a cracked target). */
export function targetPairs(data: LevelData): { u: Unit; s: SpecimenId }[] {
  return data.units
    .filter((u) => u.kind === "layer")
    .flatMap((u) => u.def.specimens.filter((s) => goalMatches(data.goal.id, s, u)).map((s) => ({ u, s })));
}
