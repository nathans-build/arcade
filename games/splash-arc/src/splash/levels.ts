/*
 * Level building for Splash Arc. Each grade has a plan of 4–5 levels; each level is a row of
 * buildings or hills (terrain never breaks), the hero's launcher on the left and four targets
 * that need water on rooftops to the right. Layouts are made from a seed and every target is
 * checked to be reachable with whole-number angle and power before the level is used.
 */
import type { Grade } from "@/kit";
import { MAX_POWER, PLANETS, bestPower, runLength, solveAll, type PlanetId, type Rect, type World } from "./physics";
import { hashSeed, makeRng, type Rng } from "./rng";
import { SHAPE_VERTS, polyArea, tankVolume, boxSurface, type Parts, type Pt, type Shape2D, type Solid, type Tank } from "./shapes";

export type Kind = "solid" | "flower" | "paint" | "sign" | "planter" | "tank" | "container" | "area" | "fire" | "bell" | "egg";
export type Theme = "city" | "park" | "dusk" | "mars" | "moon";

export interface AreaShape {
  kind: "rect" | "tri" | "para" | "trap" | "L";
  /** Polygon in units (y up). */
  verts: Pt[];
  /** Labels for the diagram: [text, x, y] in units. */
  labels: [string, number, number][];
  area: number;
}

export interface Target {
  i: number;
  letter: string;
  kind: Kind;
  /** Base centre (px). */
  x: number;
  y: number;
  w: number;
  h: number;
  watered: boolean;
  /** Time since watered (s), for the splash/bloom animation. */
  fx: number;
  solid?: Solid;
  shape?: Shape2D;
  parts?: Parts;
  /** Planter: width × height in units. */
  bed?: [number, number];
  tank?: Tank;
  area?: AreaShape;
  /** Grid coordinates (grid levels only). */
  coord?: [number, number];
}

export interface Grid {
  ox: number;
  oy: number;
  unit: number;
  nx: number;
  ny: number;
}

export interface Level {
  grade: Grade;
  index: number;
  theme: Theme;
  planet: PlanetId;
  /** Sideways wind acceleration, m/s² (0 = calm). */
  wind: number;
  buildings: Rect[];
  launch: { x: number; y: number };
  hero: { x: number; y: number };
  targets: Target[];
  grid?: Grid;
  /** Per target: angle → hitting powers. */
  sol: Map<number, number[]>[];
  title: string;
}

export const GROUND_Y = 192;
export const WIDTH = 320;
export const GRID_UNIT = 16;

interface Plan {
  kinds: Kind[];
  wind: number;
  theme: Theme;
  planet?: PlanetId;
  grid?: boolean;
  title: string;
}

const mixA: Kind[] = ["flower", "flower", "solid", "flower"];
const mixB: Kind[] = ["solid", "flower", "solid", "solid"];
const four = (k: Kind): Kind[] => [k, k, k, k];

export function bandOf(g: Grade): "K2" | "3" | "4" | "5" | "6" | "7" | "8" | "HS" {
  if (g === "K" || g === "1" || g === "2") return "K2";
  const n = Number(g);
  return n >= 9 ? "HS" : (String(n) as "3" | "4" | "5" | "6" | "7" | "8");
}

export function plansFor(g: Grade): Plan[] {
  switch (g) {
    case "K":
      return [
        { kinds: four("solid"), wind: 0, theme: "park", title: "SHAPE PARK" },
        { kinds: four("flower"), wind: 0, theme: "city", title: "FLOWER ROOFS" },
        { kinds: mixA, wind: 0, theme: "dusk", title: "FLAT OR SOLID?" },
        { kinds: mixB, wind: 0.5, theme: "park", title: "WINDY GARDEN" },
      ];
    case "1":
      return [
        { kinds: four("solid"), wind: 0, theme: "park", title: "SHAPE PARK" },
        { kinds: four("paint"), wind: 0, theme: "city", title: "PAINT TARGETS" },
        { kinds: four("flower"), wind: 0, theme: "dusk", title: "FLOWER ROOFS" },
        { kinds: mixA, wind: 0.6, theme: "park", title: "WINDY GARDEN" },
      ];
    case "2":
      return [
        { kinds: four("solid"), wind: 0, theme: "park", title: "SOLID CITY" },
        { kinds: four("flower"), wind: 0, theme: "city", title: "POLYGON FLOWERS" },
        { kinds: four("paint"), wind: 0.5, theme: "dusk", title: "PAINT TARGETS" },
        { kinds: four("solid"), wind: 0.8, theme: "park", title: "WINDY SOLIDS" },
      ];
    case "3":
      return [
        { kinds: four("sign"), wind: 0, theme: "city", title: "QUAD SIGNS" },
        { kinds: four("planter"), wind: 0, theme: "park", title: "ROOF GARDENS" },
        { kinds: four("sign"), wind: 0.8, theme: "dusk", title: "WINDY SIGNS" },
        { kinds: four("planter"), wind: 1.2, theme: "park", title: "GARDEN GUSTS" },
        { kinds: four("sign"), wind: 1.5, theme: "city", title: "STORM SIGNS" },
      ];
    case "4":
      return [
        { kinds: four("fire"), wind: 0, theme: "city", title: "CAMPFIRE ROOFS" },
        { kinds: four("bell"), wind: 0, theme: "dusk", title: "BELL TOWERS" },
        { kinds: four("egg"), wind: 1, theme: "park", title: "SUN-BAKED EGGS" },
        { kinds: four("fire"), wind: 1.5, theme: "city", title: "WINDY FIRES" },
        { kinds: ["bell", "fire", "egg", "bell"], wind: 2, theme: "dusk", title: "GUSTY FINALE" },
      ];
    case "5":
      return [
        { kinds: four("fire"), wind: 0, theme: "city", grid: true, title: "GRID FIRES" },
        { kinds: four("tank"), wind: 0, theme: "park", grid: true, title: "WATER TANKS" },
        { kinds: four("fire"), wind: 1, theme: "dusk", grid: true, title: "WINDY GRID" },
        { kinds: four("tank"), wind: 1.5, theme: "park", grid: true, title: "TANK GUSTS" },
        { kinds: ["fire", "bell", "egg", "fire"], wind: 2, theme: "city", grid: true, title: "GRID FINALE" },
      ];
    case "6":
      return [
        { kinds: four("area"), wind: 0, theme: "city", grid: true, title: "AREA SIGNS" },
        { kinds: four("tank"), wind: 0, theme: "park", grid: true, title: "TANK YARD" },
        { kinds: four("solid"), wind: 0.8, theme: "dusk", grid: true, title: "NET WORKS" },
        { kinds: four("area"), wind: 1.2, theme: "city", grid: true, title: "WINDY AREAS" },
        { kinds: four("tank"), wind: 1.8, theme: "park", grid: true, title: "TANK GUSTS" },
      ];
    case "7":
      return [
        { kinds: four("fire"), wind: 0, theme: "city", title: "ANGLE ALLEY" },
        { kinds: four("tank"), wind: 0, theme: "park", title: "PRISM TANKS" },
        { kinds: four("egg"), wind: 1, theme: "dusk", title: "SUN-BAKED EGGS" },
        { kinds: four("tank"), wind: 1.5, theme: "park", title: "TANK GUSTS" },
        { kinds: four("bell"), wind: 2, theme: "city", title: "STORM BELLS" },
      ];
    case "8":
      return [
        { kinds: four("fire"), wind: 0, theme: "city", title: "TRANSVERSAL TOWN" },
        { kinds: four("container"), wind: 0, theme: "park", title: "ROUND TANKS" },
        { kinds: four("bell"), wind: 1, theme: "dusk", title: "BELL TOWERS" },
        { kinds: four("container"), wind: 1.5, theme: "park", title: "TANK GUSTS" },
        { kinds: four("egg"), wind: 2, theme: "city", title: "STORM EGGS" },
      ];
    default: {
      const planet: PlanetId = g === "12" ? "moon" : "mars";
      return [
        { kinds: four("fire"), wind: 0, theme: "city", title: "TRIG TOWERS" },
        { kinds: four("container"), wind: 0, theme: "park", title: "VOLUME YARD" },
        { kinds: four("bell"), wind: 1.5, theme: "dusk", title: "WINDY BELLS" },
        { kinds: ["egg", "fire", "container", "egg"], wind: 2, theme: "city", title: "STORM FRONT" },
        { kinds: four("fire"), wind: 0, theme: planet, planet, title: `${PLANETS[planet].name} BASE` },
      ];
    }
  }
}

export function levelCount(g: Grade): number {
  return plansFor(g).length;
}

// ------------------------------------------------------------------ target contents

function distinctBy<T>(make: () => T, key: (t: T) => string | number, n: number): T[] {
  for (let tries = 0; tries < 400; tries++) {
    const out: T[] = [];
    const seen = new Set<string | number>();
    for (let k = 0; k < 400 && out.length < n; k++) {
      const t = make();
      const kk = key(t);
      if (!seen.has(kk)) {
        seen.add(kk);
        out.push(t);
      }
    }
    if (out.length === n) return out;
  }
  throw new Error("could not make distinct contents");
}

function solidSet(g: Grade): Solid[] {
  if (g === "K") return ["cube", "cylinder", "cone", "sphere"];
  if (g === "1") return ["cube", "prism", "cylinder", "cone", "sphere"];
  if (g === "2") return ["cube", "prism", "triprism", "pyramid", "cylinder"];
  return ["cube", "prism", "triprism", "pyramid"];
}
function flowerSet(g: Grade): Shape2D[] {
  if (g === "2") return ["triangle", "square", "rectangle", "pentagon", "hexagon", "circle"];
  return ["circle", "triangle", "square", "rectangle", "hexagon"];
}
function partsSet(g: Grade): Parts[] {
  return g === "2" ? ["halves", "thirds", "fourths", "unequal3", "unequal2"] : ["halves", "fourths", "unequal2", "unequal4"];
}
const QUADS: Shape2D[] = ["square", "rectangle", "rhombus", "parallelogram", "trapezoid", "rightTrapezoid", "kite"];

export function makeArea(rng: Rng): AreaShape {
  const kind = rng.pick(["rect", "tri", "tri", "para", "trap", "L"] as const);
  if (kind === "rect") {
    const b = rng.int(2, 7);
    const h = rng.int(2, 5);
    return { kind, verts: [[0, 0], [b, 0], [b, h], [0, h]], labels: [[`${b}`, b / 2, -0.9], [`${h}`, b + 0.7, h / 2]], area: b * h };
  }
  if (kind === "tri") {
    let b = rng.int(2, 8);
    const h = rng.int(2, 6);
    if ((b * h) % 2) b += 1;
    const a = rng.int(0, b);
    return { kind, verts: [[0, 0], [b, 0], [a, h]], labels: [[`${b}`, b / 2, -0.9], [`${h}`, a + 0.6, h / 2]], area: (b * h) / 2 };
  }
  if (kind === "para") {
    const b = rng.int(3, 6);
    const h = rng.int(2, 4);
    const o = rng.int(1, 2);
    return { kind, verts: [[0, 0], [b, 0], [b + o, h], [o, h]], labels: [[`${b}`, b / 2, -0.9], [`${h}`, b + o + 0.6, h / 2]], area: b * h };
  }
  if (kind === "trap") {
    const b2 = rng.int(2, 4);
    const o = rng.int(1, 2);
    const b1 = b2 + o + rng.int(1, 2);
    let h = rng.int(2, 4);
    if (((b1 + b2) * h) % 2) h += 1;
    return {
      kind,
      verts: [[0, 0], [b1, 0], [o + b2, h], [o, h]],
      labels: [[`${b1}`, b1 / 2, -0.9], [`${b2}`, o + b2 / 2, h + 0.5], [`${h}`, b1 + 0.6, h / 2]],
      area: ((b1 + b2) * h) / 2,
    };
  }
  const w1 = rng.int(4, 7);
  const w2 = rng.int(1, w1 - 2);
  const h1 = rng.int(4, 6);
  const h2 = rng.int(1, h1 - 2);
  return {
    kind: "L",
    verts: [[0, 0], [w1, 0], [w1, h2], [w2, h2], [w2, h1], [0, h1]],
    labels: [[`${w1}`, w1 / 2, -0.9], [`${h1}`, -0.8, h1 / 2], [`${w2}`, w2 / 2, h1 + 0.5], [`${h2}`, w1 + 0.6, h2 / 2]],
    area: w1 * h2 + w2 * (h1 - h2),
  };
}

function makeTank(g: Grade, rng: Rng, n: number): Tank {
  if (g === "5") {
    if (rng() < 0.3) {
      const w = rng.int(1, 3);
      return { kind: "step", l1: rng.int(1, 3), h1: rng.int(2, 4), l2: rng.int(1, 3), h2: 1, w };
    }
    return { kind: "box", l: rng.int(2, 5), w: rng.int(1, 4), h: rng.int(1, 4) };
  }
  if (g === "6") {
    // Every other tank has a fractional edge (NC.6.G.2); all are boxes (nets / surface area).
    if (n % 2) return { kind: "box", l: rng.int(2, 5) + 0.5, w: rng.int(1, 3), h: rng.pick([2, 4]) };
    return { kind: "box", l: rng.int(2, 6), w: rng.int(1, 4), h: rng.int(1, 4) };
  }
  // Grade 7: boxes and triangular prisms.
  if (rng() < 0.45) {
    let b = rng.int(2, 6);
    const th = rng.int(2, 5);
    if ((b * th) % 2) b += 1;
    return { kind: "tri", b, th, len: rng.int(2, 6) };
  }
  return { kind: "box", l: rng.int(2, 6), w: rng.int(2, 4), h: rng.int(2, 5) };
}

function makeContainer(g: Grade, rng: Rng): Tank {
  const hs = g !== "8";
  const k = rng.pick(hs ? (["cylinder", "cone", "sphere", "pyramid"] as const) : (["cylinder", "cone", "sphere"] as const));
  if (k === "cylinder") return { kind: k, r: rng.int(1, 5), h: rng.int(2, 9) };
  if (k === "cone") {
    const r = rng.int(1, 6);
    let h = rng.int(2, 9);
    while ((r * r * h) % 3) h++;
    return { kind: k, r, h };
  }
  if (k === "sphere") return { kind: k, r: rng.pick([3, 6]) };
  const s = rng.int(2, 6);
  let h = rng.int(2, 9);
  while ((s * s * h) % 3) h++;
  return { kind: "pyramid", s, h };
}

/** Pixel size of a tank drawing (also its hit box). */
export function tankSize(t: Tank): [number, number] {
  const k = 4;
  switch (t.kind) {
    case "box":
      return [Math.round(t.l * k) + Math.round(t.w * 2) + 1, Math.round(t.h * k) + Math.round(t.w * 2) + 1];
    case "step":
      return [(t.l1 + t.l2) * k + Math.round(t.w * 2) + 1, Math.max(t.h1, t.h2) * k + Math.round(t.w * 2) + 1];
    case "tri":
      return [Math.round(t.len * 2 + t.b * 1.2) + 2, Math.round(t.th * 2.4 + 4)];
    default:
      return [16, 16];
  }
}

function contentsFor(kinds: Kind[], g: Grade, rng: Rng): Partial<Target>[] {
  const out: Partial<Target>[] = kinds.map((kind) => ({ kind }));
  const idx = (k: Kind) => kinds.map((x, i) => (x === k ? i : -1)).filter((i) => i >= 0);
  const solids = rng.shuffle(solidSet(g));
  idx("solid").forEach((i, n) => (out[i].solid = solids[n % solids.length]));
  const flowers = rng.shuffle(flowerSet(g));
  idx("flower").forEach((i, n) => (out[i].shape = flowers[n % flowers.length]));
  const parts = rng.shuffle(partsSet(g));
  idx("paint").forEach((i, n) => (out[i].parts = parts[n % parts.length]));
  const quads = rng.shuffle(QUADS);
  idx("sign").forEach((i, n) => (out[i].shape = quads[n % quads.length]));
  const pl = idx("planter");
  if (pl.length) {
    const beds = distinctBy(() => [rng.int(2, 7), rng.int(1, 5)] as [number, number], (b) => 2 * (b[0] + b[1]), pl.length);
    pl.forEach((i, n) => (out[i].bed = beds[n]));
  }
  const tk = idx("tank");
  if (tk.length) {
    // Volumes distinct and surface areas distinct, so either question has one answer.
    const tanks = distinctBy(() => makeTank(g, rng, rng.int(0, 1)), (t) => tankVolume(t), tk.length);
    const sa = new Set(tanks.map((t) => (t.kind === "box" ? boxSurface(t.l, t.w, t.h) : -1)));
    if (sa.size !== tanks.length && tanks.every((t) => t.kind === "box")) return contentsFor(kinds, g, rng);
    tk.forEach((i, n) => (out[i].tank = tanks[n]));
  }
  const ct = idx("container");
  if (ct.length) {
    const cs = distinctBy(() => makeContainer(g, rng), (t) => `${t.kind === "pyramid" ? "p" : "π"}${tankVolume(t)}`, ct.length);
    ct.forEach((i, n) => (out[i].tank = cs[n]));
  }
  const ar = idx("area");
  if (ar.length) {
    const as = distinctBy(() => makeArea(rng), (a) => a.area, ar.length);
    ar.forEach((i, n) => (out[i].area = as[n]));
  }
  return out;
}

export function targetSize(t: Partial<Target>): [number, number] {
  switch (t.kind) {
    case "fire":
      return [10, 9];
    case "bell":
      return [11, 12];
    case "egg":
      return [9, 12];
    case "flower":
      return [11, 16];
    case "paint":
      return [13, 17];
    case "solid":
      return [16, 16];
    case "sign": {
      const v = SHAPE_VERTS[t.shape!];
      const w = Math.max(...v.map((p) => p[0]));
      const h = Math.max(...v.map((p) => p[1]));
      return [w * 3 + 2, h * 3 + 6];
    }
    case "planter":
      return [t.bed![0] * 2 + 3, t.bed![1] * 2 + 6];
    case "area": {
      const v = t.area!.verts;
      return [Math.max(...v.map((p) => p[0])) * 3 + 2, Math.max(...v.map((p) => p[1])) * 3 + 6];
    }
    case "tank":
    case "container":
      return tankSize(t.tank!);
  }
  return [10, 10];
}

// ------------------------------------------------------------------ layout

export function hitBox(t: Target): Rect {
  return { x: t.x - t.w / 2, y: t.y - t.h, w: t.w, h: t.h };
}

export function worldOf(lv: Level): World {
  return {
    width: WIDTH,
    groundY: GROUND_Y,
    rects: lv.buildings,
    targets: lv.targets.map((t) => (t.watered ? null : hitBox(t))),
  };
}

export function shotBase(lv: Level) {
  return { x0: lv.launch.x, y0: lv.launch.y, planet: lv.planet, wind: lv.wind };
}

const minAngles = (g: Grade) => (bandOf(g) === "K2" ? 2 : 4);

function layout(g: Grade, plan: Plan, rng: Rng): Omit<Level, "sol" | "index" | "title"> | null {
  const k2 = bandOf(g) === "K2";
  const contents = contentsFor(plan.kinds, g, rng);
  const sizes = contents.map(targetSize);
  const buildings: Rect[] = [];
  const launcherRoof = rng.int(k2 ? 122 : 128, k2 ? 140 : 152);
  buildings.push({ x: 4, y: launcherRoof, w: 30, h: GROUND_Y - launcherRoof });
  const targets: Target[] = [];
  let grid: Grid | undefined;
  // K-2 targets sit high, so they stay in view above the question panel.
  const roofRange: [number, number] = k2 ? [72, 112] : [62, 166];
  if (plan.grid) {
    grid = { ox: 0, oy: GROUND_Y, unit: GRID_UNIT, nx: 19, ny: 11 };
    // Columns 7..19 (x = 112..304), at least 3 units apart.
    let cols: number[] = [];
    for (let tries = 0; tries < 200; tries++) {
      cols = [rng.int(7, 9)];
      while (cols.length < 4) cols.push(cols[cols.length - 1] + rng.int(3, 4));
      if (cols[3] <= 19) break;
    }
    if (cols[3] > 19) return null;
    cols.forEach((c, i) => {
      const row = rng.int(4, 8);
      const x = c * GRID_UNIT;
      const y = GROUND_Y - row * GRID_UNIT;
      const bw = Math.max(20, sizes[i][0] + 6);
      buildings.push({ x: x - bw / 2, y, w: bw, h: GROUND_Y - y });
      targets.push({ ...(contents[i] as Target), i, letter: "ABCD"[i], x, y, w: sizes[i][0], h: sizes[i][1], watered: false, fx: 0, coord: [c, row] });
    });
    // A low decor block or two between the launcher and the first target.
    const first = buildings[1].x;
    if (first > 60 && rng() < 0.7) {
      const w = rng.int(12, 20);
      const top = rng.int(140, 176);
      buildings.push({ x: rng.int(40, Math.max(40, first - w - 4)), y: top, w, h: GROUND_Y - top });
    }
  } else {
    let x = 38 + rng.int(0, 8);
    // Decor before the target zone.
    while (x < 96) {
      const w = rng.int(10, 20);
      const top = rng.int(k2 ? 150 : 110, 178);
      buildings.push({ x, y: top, w, h: GROUND_Y - top });
      x += w + rng.int(2, 8);
    }
    x = Math.max(x, 100 + rng.int(0, 10));
    const widths = sizes.map((sz) => Math.max(18, sz[0] + rng.int(4, 8)));
    const spare = WIDTH - 12 - x - widths.reduce((a, b) => a + b, 0);
    if (spare < 12) return null;
    const weights = [0, 1, 2, 3].map(() => 0.4 + rng());
    const wsum = weights.reduce((a, b) => a + b, 0);
    const gaps = weights.map((w) => Math.floor((spare * w) / wsum));
    for (let i = 0; i < 4; i++) {
      const bw = widths[i];
      const top = rng.int(roofRange[0], roofRange[1]);
      buildings.push({ x, y: top, w: bw, h: GROUND_Y - top });
      targets.push({ ...(contents[i] as Target), i, letter: "ABCD"[i], x: Math.round(x + bw / 2), y: top, w: sizes[i][0], h: sizes[i][1], watered: false, fx: 0 });
      x += bw + 2;
      const gap = gaps[i];
      if (gap >= 14 && rng() < 0.75) {
        const w = Math.min(gap - 4, rng.int(8, 16));
        const dtop = rng.int(k2 ? 150 : 116, 180);
        buildings.push({ x: x + Math.floor((gap - 2 - w) / 2), y: dtop, w, h: GROUND_Y - dtop });
      }
      x += gap;
    }
    if (x > WIDTH - 2) return null;
  }
  // K-2: the targets' tops must stay clear of each other (labels sit above them).
  const launch = { x: 27, y: launcherRoof - 14 };
  const hero = { x: 12, y: launcherRoof };
  return { grade: g, theme: plan.theme, planet: plan.planet ?? "earth", wind: 0, buildings, launch, hero, targets, grid };
}

/**
 * Builds level `index` for grade `g`. `seed` varies the layout between games; layouts whose
 * targets can't all be reached (at least a few whole-number angles each) are thrown away.
 */
export function buildLevel(g: Grade, index: number, seed: number): Level {
  const plan = plansFor(g)[index];
  for (let attempt = 0; attempt < 60; attempt++) {
    const rng = makeRng(hashSeed(g, index, seed, attempt));
    const base = layout(g, plan, rng);
    if (!base) continue;
    const wind = plan.wind ? Math.round((plan.wind * (0.6 + 0.4 * rng())) * 10) / 10 * (rng() < 0.5 ? -1 : 1) : 0;
    const lv: Level = { ...base, wind, index, title: plan.title, sol: [] };
    const sol = solveAll(worldOf(lv), shotBase(lv));
    // Every target needs several angles that hit, each with a run of ≥ 2 powers (forgiving).
    const ok = sol.every((m) => [...m.values()].filter((p) => runLength(p) >= 2).length >= minAngles(g));
    if (!ok) continue;
    lv.sol = sol;
    return lv;
  }
  throw new Error(`no solvable layout for grade ${g} level ${index}`);
}

/** Angles that hit target `t` with a run of at least 2 powers (sorted). */
export function goodAngles(lv: Level, t: number): number[] {
  return [...lv.sol[t].entries()].filter(([, p]) => runLength(p) >= 2).map(([a]) => a).sort((a, b) => a - b);
}

/** The safest (angle, power) for a target: the longest power run, preferring mid angles. */
export function bestAim(lv: Level, t: number, angles?: number[]): { angle: number; power: number } {
  let best = { angle: 45, power: 50, score: -1 };
  for (const a of angles ?? goodAngles(lv, t)) {
    const p = lv.sol[t].get(a);
    if (!p) continue;
    const score = runLength(p) * 10 - Math.abs(a - 50) * 0.5;
    if (score > best.score) best = { angle: a, power: bestPower(p), score };
  }
  return { angle: best.angle, power: Math.min(MAX_POWER, best.power) };
}

/** A hitting power for target t at angle a, or null. */
export function powerFor(lv: Level, t: number, a: number): number | null {
  const p = lv.sol[t].get(a);
  return p && p.length ? bestPower(p) : null;
}

export function polyOfTarget(t: Target): Pt[] | null {
  if (t.kind === "sign" || t.kind === "flower") return SHAPE_VERTS[t.shape!];
  if (t.kind === "area") return t.area!.verts;
  if (t.kind === "planter") return [[0, 0], [t.bed![0], 0], [t.bed![0], t.bed![1]], [0, t.bed![1]]];
  return null;
}

export { polyArea };
