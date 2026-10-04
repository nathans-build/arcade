/*
 * Shot questions: before every throw the player answers one geometry question, and the
 * answer gives or confirms the aim. Four kinds:
 *  - pick:    the four choices are the four targets A-D ("Fill the CYLINDER!", "the tank that
 *             holds 24 cubic units", "the fire at (7, 4)"); choosing one aims at it.
 *  - angle:   the choices are angles; the chosen one becomes the launch angle
 *             ("aim at the supplement of 130°").
 *  - pair:    the choices are (angle, speed) pairs from the projectile equation.
 *  - confirm: the aim is already set and the question checks the geometry behind it.
 *  - power:   K-2 "more or less power?" after a short or long throw.
 * A right answer adds a guide line (part of the real arc). A wrong one shows the explanation
 * and the throw still goes with the player's choice, so nobody gets stuck.
 * Every question carries `meta` with its raw numbers so scripts/check-game.ts can recompute it.
 */
import type { Grade } from "@/kit";
import type { Diagram, Dir } from "./diagram";
import { GROUND_Y, bandOf, bestAim, goodAngles, hitBox, powerFor, shotBase, worldOf, type Level, type Target } from "./levels";
import { PLANETS, S, heightAt, simulate, speedOf, speedText } from "./physics";
import type { Rng } from "./rng";
import {
  PARTS_INFO,
  SECTION,
  SHAPE_NAME,
  SOLID_FACTS,
  SOLID_KID,
  SOLID_NAME,
  attrs2D,
  boxSurface,
  frac,
  hasPi,
  tankVolume,
  volumeText,
  type Cut,
  type Section,
  type Solid,
} from "./shapes";

export type Effect =
  | { type: "pick"; targets: number[] }
  | { type: "angle"; values: number[] }
  | { type: "pair"; values: [number, number][] }
  | { type: "confirm" }
  | { type: "power"; values: number[] };

export interface ShotQ {
  gen: string;
  standard: string;
  skill: string;
  prompt: string;
  choices: string[];
  answer: number;
  explanation: string;
  diagram?: Diagram;
  /** Pictures inside the choice buttons (pick questions). */
  icons?: Diagram[];
  effect: Effect;
  /** The target this throw is meant for. */
  target: number;
  /** Aim set before answering (confirm questions, and all K-2 questions). */
  preset?: { angle?: number; power?: number };
  /** Hide the angle readout while the question is open (it would give the answer away). */
  hideAngle?: boolean;
  meta: Record<string, unknown>;
}

export interface Ctx {
  grade: Grade;
  lv: Level;
  /** Current target (unwatered). */
  target: number;
  rng: Rng;
  /** Where the last throw at this target landed, if it missed. */
  lastMiss: { target: number; side: "short" | "long" } | null;
  power: number;
}

type Draft = Omit<ShotQ, "gen" | "standard" | "skill" | "target"> & { target?: number };

export interface Gen {
  id: string;
  standard: string;
  skill: string;
  grades: Grade[];
  weight?: number;
  make(c: Ctx): Draft | null;
}

const deg = (v: number) => `${v}°`;
const T = (lv: Level, i: number) => lv.targets[i];
const live = (lv: Level) => lv.targets.filter((t) => !t.watered).map((t) => t.i);
const r2d = (r: number) => (r * 180) / Math.PI;
const d2r = (d: number) => (d * Math.PI) / 180;

// ------------------------------------------------------------------ names & pictures

const SOLID_LOOK: Record<Solid, string> = {
  cube: "6 flat square faces",
  prism: "6 flat rectangle faces",
  triprism: "2 triangle faces and 3 rectangle faces",
  pyramid: "a square base and 4 triangle faces that meet at a point",
  cylinder: "2 flat circle faces and a curved side",
  cone: "1 flat circle face and a point on top",
  sphere: "no flat faces: it is round all over",
};

export function targetName(t: Target): string {
  switch (t.kind) {
    case "solid":
      return SOLID_KID[t.solid!];
    case "flower":
      return `${SHAPE_NAME[t.shape!]} flower`;
    case "paint":
      return `${PARTS_INFO[t.parts!].name} target`;
    case "sign":
      return `${SHAPE_NAME[t.shape!]} sign`;
    case "planter":
      return "garden";
    case "tank":
      return "water tank";
    case "container":
      return `${t.tank!.kind} tank`;
    case "area":
      return "garden sign";
    case "fire":
      return "campfire";
    case "bell":
      return "bell";
    case "egg":
      return "dino egg statue";
  }
}

const PAINT_SHORT: Record<string, string> = {
  halves: "halves target",
  thirds: "thirds target",
  fourths: "fourths target",
  unequal2: "uneven 2-part target",
  unequal3: "uneven 3-part target",
  unequal4: "uneven 4-part target",
};

/** Short name for K-2 position questions. */
function shortName(t: Target): string {
  if (t.kind === "solid") return SOLID_NAME[t.solid!];
  if (t.kind === "flower") return `${SHAPE_NAME[t.shape!]} flower`;
  if (t.kind === "paint") return PAINT_SHORT[t.parts!];
  return targetName(t);
}

export function iconOf(t: Target, unit = ""): Diagram {
  switch (t.kind) {
    case "solid":
      return { t: "solid", solid: t.solid! };
    case "flower":
    case "sign":
      return { t: "shape", shape: t.shape! };
    case "paint":
      return { t: "parts", parts: t.parts! };
    case "planter":
      return { t: "bed", w: t.bed![0], h: t.bed![1] };
    case "area":
      return { t: "area", area: t.area! };
    case "tank":
    case "container":
      return { t: "tank", tank: t.tank!, unit, labels: true };
    default:
      return { t: t.kind };
  }
}

// ------------------------------------------------------------------ helpers

/** Four distinct numeric choices: the answer first, then valid distractors, padded with ±steps. */
function numChoices(ans: number, wrong: number[], ok: (v: number) => boolean, step = 5): number[] {
  const vals = [ans];
  for (const w of wrong) if (vals.length < 4 && Number.isFinite(w) && ok(w) && !vals.includes(w)) vals.push(w);
  for (let k = 1; vals.length < 4 && k < 40; k++) {
    for (const w of [ans + k * step, ans - k * step]) if (vals.length < 4 && ok(w) && !vals.includes(w)) vals.push(w);
  }
  return vals;
}
const okAngle = (v: number) => Number.isInteger(v) && v >= 1 && v <= 179;

function angleQ(ans: number, wrong: number[]): { choices: string[]; answer: number; effect: Effect } {
  const vals = numChoices(ans, wrong, okAngle);
  return { choices: vals.map(deg), answer: 0, effect: { type: "angle", values: vals } };
}

function textQ(ans: string, wrong: string[]): { choices: string[]; answer: number; effect: Effect } {
  const c = [ans];
  for (const w of wrong) if (c.length < 4 && !c.includes(w)) c.push(w);
  if (c.length < 4) throw new Error(`not enough choices for ${ans}`);
  return { choices: c, answer: 0, effect: { type: "confirm" } };
}

/** Angles in [lo, hi] that hit target t (with a forgiving run of powers). */
function anglesIn(c: Ctx, lo: number, hi: number, pred: (a: number) => boolean = () => true): number[] {
  return goodAngles(c.lv, c.target).filter((a) => a >= lo && a <= hi && pred(a));
}

const pickQ = (lv: Level) => ({ effect: { type: "pick", targets: [0, 1, 2, 3] } as Effect, choices: lv.targets.map((t) => `Target ${t.letter}`) });

interface Tmpl {
  text: string;
  test: (t: Target) => boolean;
  why: (t: Target) => string;
}
/** A pick question from templates that are true for exactly one target, which must still be dry. */
function pickFrom(c: Ctx, tmpls: Tmpl[], icons = true): Draft | null {
  const ok = tmpls.filter((m) => {
    const yes = c.lv.targets.filter(m.test);
    return yes.length === 1 && !yes[0].watered;
  });
  if (!ok.length) return null;
  const m = c.rng.pick(ok);
  const t = c.lv.targets.find(m.test)!;
  return {
    prompt: m.text,
    ...pickQ(c.lv),
    answer: t.i,
    target: t.i,
    explanation: `Target ${t.letter}: ${m.why(t)}`,
    icons: icons ? c.lv.targets.map((x) => iconOf(x)) : undefined,
    meta: { tmpl: m.text, values: c.lv.targets.map((x) => m.test(x)) },
  };
}

// ------------------------------------------------------------------ K-2

const kName: Gen = {
  id: "k-name",
  standard: "NC.K.G.2",
  skill: "Name 2-D and 3-D shapes",
  grades: ["K", "1"],
  make(c) {
    return pickFrom(
      c,
      c.lv.targets.filter((t) => t.kind === "solid" || t.kind === "flower").map((t) => ({
        text: t.kind === "solid" ? `Fill the ${SOLID_NAME[t.solid!].toUpperCase()}!` : `Water the ${SHAPE_NAME[t.shape!].toUpperCase()} flower!`,
        test: (x: Target) => (t.kind === "solid" ? x.solid === t.solid : x.kind === "flower" && x.shape === t.shape),
        why: (x: Target) => (x.kind === "solid" ? `the ${SOLID_NAME[x.solid!]} has ${SOLID_LOOK[x.solid!]}.` : `that flower is a ${SHAPE_NAME[x.shape!]}.`),
      })),
    );
  },
};

const kFlat: Gen = {
  id: "k-flat",
  standard: "NC.K.G.3",
  skill: "Flat (2-D) or solid (3-D)",
  grades: ["K"],
  weight: 2,
  make(c) {
    return pickFrom(c, [
      { text: "Fill the shape that is SOLID (3-D)!", test: (t) => t.kind === "solid", why: (t) => `the ${SOLID_NAME[t.solid!]} is solid: it is not flat, you could hold it.` },
      { text: "Water the shape that is FLAT (2-D)!", test: (t) => t.kind === "flower", why: (t) => `the ${SHAPE_NAME[t.shape!]} is flat, like a drawing on paper.` },
    ]);
  },
};

const kCompare: Gen = {
  id: "k-compare",
  standard: "NC.K.G.4",
  skill: "Compare shapes (sides, corners, faces)",
  grades: ["K"],
  make(c) {
    return pickFrom(c, [
      { text: "Fill the shape that can ROLL and has NO flat faces!", test: (t) => t.solid === "sphere", why: () => "a sphere is round all over, so it rolls any way." },
      { text: "Fill the shape that can ROLL and has 2 flat faces!", test: (t) => t.solid === "cylinder", why: () => "a cylinder rolls on its curved side and has 2 flat circles." },
      { text: "Fill the shape with a POINT on top and a round flat bottom!", test: (t) => t.solid === "cone", why: () => "a cone has a round flat bottom and a point on top." },
      { text: "Fill the shape with 6 flat SQUARE faces!", test: (t) => t.solid === "cube", why: () => "a cube has 6 square faces. It can't roll." },
      { text: "Water the shape with 3 sides and 3 corners!", test: (t) => t.kind === "flower" && t.shape === "triangle", why: () => "a triangle has 3 sides and 3 corners." },
      { text: "Water the shape with NO corners!", test: (t) => t.kind === "flower" && t.shape === "circle", why: () => "a circle is round: no sides, no corners." },
      { text: "Water the shape with 6 sides!", test: (t) => t.kind === "flower" && t.shape === "hexagon", why: () => "a hexagon has 6 sides and 6 corners." },
      { text: "Water the shape with 4 sides that are all the same length!", test: (t) => t.kind === "flower" && t.shape === "square", why: () => "a square has 4 equal sides." },
    ]);
  },
};

const kPosition: Gen = {
  id: "k-position",
  standard: "NC.K.G.1",
  skill: "Position words",
  grades: ["K", "1", "2"],
  make(c) {
    const ts = c.lv.targets;
    const opts: Tmpl[] = [];
    for (let i = 0; i < 4; i++) {
      if (i < 3) opts.push({ text: `Splash the shape just to the RIGHT of the ${shortName(ts[i])}!`, test: (t) => t.i === i + 1, why: (t) => `the ${shortName(t)} is right next to the ${shortName(ts[i])}, on its right side.` });
      if (i > 0) opts.push({ text: `Splash the shape just to the LEFT of the ${shortName(ts[i])}!`, test: (t) => t.i === i - 1, why: (t) => `the ${shortName(t)} is right next to the ${shortName(ts[i])}, on its left side.` });
    }
    const ys = ts.map((t) => t.y - t.h).sort((a, b) => a - b);
    if (ys[1] - ys[0] >= 8) opts.push({ text: "Splash the shape that is ABOVE all the others (the highest)!", test: (t) => t.y - t.h === ys[0], why: (t) => `the ${shortName(t)} sits higher than the others.` });
    if (ys[3] - ys[2] >= 8) opts.push({ text: "Splash the shape that is BELOW all the others (the lowest)!", test: (t) => t.y - t.h === ys[3], why: (t) => `the ${shortName(t)} sits lower than the others.` });
    const q = pickFrom(c, opts, false);
    if (!q) return null;
    q.diagram = { t: "skyline", items: ts.map((t) => ({ x: t.x, y: t.y - t.h / 2, icon: iconOf(t), label: t.letter })) };
    return q;
  },
};

const g1Attr: Gen = {
  id: "g1-attr",
  standard: "NC.1.G.1",
  skill: "Defining attributes of shapes",
  grades: ["1", "2"],
  weight: 2,
  make(c) {
    return pickFrom(c, [
      { text: "Fill the solid with 6 flat faces that are ALL squares!", test: (t) => t.solid === "cube", why: () => "a cube's 6 faces are all squares." },
      { text: "Fill the solid with 6 flat faces that are NOT all squares!", test: (t) => t.solid === "prism", why: () => "a rectangular prism has 6 rectangle faces." },
      { text: "Fill the solid with 2 flat CIRCLE faces!", test: (t) => t.solid === "cylinder", why: () => "a cylinder has a circle on the top and bottom." },
      { text: "Fill the solid with ONE flat circle face and a point!", test: (t) => t.solid === "cone", why: () => "a cone has one circle face and a point." },
      { text: "Fill the solid with NO flat faces!", test: (t) => t.solid === "sphere", why: () => "a sphere is curved all over." },
      { text: "Water the shape with 3 straight sides and 3 corners!", test: (t) => t.kind === "flower" && t.shape === "triangle", why: () => "a triangle has 3 sides and 3 corners." },
      { text: "Water the shape with 4 square corners and 4 EQUAL sides!", test: (t) => t.kind === "flower" && t.shape === "square", why: () => "a square has 4 square corners and 4 equal sides." },
      { text: "Water the shape with 4 square corners, 2 long sides and 2 short sides!", test: (t) => t.kind === "flower" && t.shape === "rectangle", why: () => "that rectangle has 2 long and 2 short sides." },
      { text: "Water the shape with 6 straight sides!", test: (t) => t.kind === "flower" && t.shape === "hexagon", why: () => "a hexagon has 6 sides." },
      { text: "Water the shape with NO straight sides and NO corners!", test: (t) => t.kind === "flower" && t.shape === "circle", why: () => "a circle has no sides and no corners." },
    ]);
  },
};

const PART_STD: Record<string, string> = { "1": "NC.1.G.3", "2": "NC.2.G.3" };
function partsGen(g: "1" | "2"): Gen {
  return {
    id: `g${g}-parts`,
    standard: PART_STD[g],
    skill: g === "1" ? "Halves and fourths" : "Halves, thirds and fourths",
    grades: [g],
    weight: 3,
    make(c) {
      return pickFrom(c, [
        { text: "Splash the target cut into HALVES (2 equal parts)!", test: (t) => t.parts === "halves", why: () => "it has 2 equal parts: halves." },
        { text: "Splash the target cut into FOURTHS (4 equal parts)!", test: (t) => t.parts === "fourths", why: () => "it has 4 equal parts: fourths (quarters)." },
        { text: "Splash the target cut into THIRDS (3 equal parts)!", test: (t) => t.parts === "thirds", why: () => "it has 3 equal parts: thirds." },
        { text: "Splash the target with 2 parts that are NOT equal!", test: (t) => t.parts === "unequal2", why: () => "its 2 parts are different sizes, so they are not halves." },
        { text: "Splash the target with 4 parts that are NOT equal!", test: (t) => t.parts === "unequal4", why: () => "its 4 parts are different sizes, so they are not fourths." },
        { text: "Splash the target with 3 parts that are NOT equal!", test: (t) => t.parts === "unequal3", why: () => "its 3 parts are different sizes, so they are not thirds." },
      ]);
    },
  };
}

const DIRS: Dir[] = ["right", "up", "left", "down"];
const DIR_TXT: Record<Dir, string> = { right: "→ RIGHT", up: "↑ UP", left: "← LEFT", down: "↓ DOWN" };
/** Turning `kind` from `from` (quarter = clockwise, the way clock hands go). */
export function turnDir(from: Dir, kind: "half" | "quarter" | "full"): Dir {
  const i = DIRS.indexOf(from);
  const steps = kind === "full" ? 0 : kind === "half" ? 2 : 3; // DIRS go counter-clockwise; clockwise = −1 = +3
  return DIRS[(i + steps) % 4];
}
function turnGen(g: "1" | "2"): Gen {
  return {
    id: `g${g}-turn`,
    standard: PART_STD[g],
    skill: "Half and quarter turns",
    grades: [g],
    make(c) {
      const from = c.rng.pick(DIRS);
      const kind = c.rng.pick(g === "1" ? (["half", "full", "half"] as const) : (["half", "quarter", "quarter", "full"] as const));
      const to = turnDir(from, kind);
      const k = kind === "quarter" ? "a QUARTER turn (the way clock hands go)" : kind === "half" ? "a HALF turn" : "a FULL turn";
      const others = DIRS.filter((d) => d !== to).map((d) => DIR_TXT[d]);
      return {
        prompt: `The water arrow points ${from.toUpperCase()}. It makes ${k}. Which way does it point now?`,
        ...textQ(DIR_TXT[to], others),
        explanation:
          kind === "full"
            ? "A full turn goes all the way around, so it points the same way again."
            : kind === "half"
              ? `A half turn is half of the way around, so ${from} becomes ${to}.`
              : `A quarter turn is one fourth of the way around. Clockwise, ${from} becomes ${to}.`,
        diagram: { t: "turn", from, to, kind },
        meta: { from, kind, to },
      };
    },
  };
}

const g2Solid: Gen = {
  id: "g2-solid",
  standard: "NC.2.G.1",
  skill: "Faces, edges and vertices",
  grades: ["2"],
  weight: 3,
  make(c) {
    const tm: Tmpl[] = [];
    for (const n of [5, 6]) tm.push({ text: `Fill the solid with exactly ${n} flat faces!`, test: (t) => t.kind === "solid" && SOLID_FACTS[t.solid!].faces === n, why: (t) => `the ${SOLID_NAME[t.solid!]} has ${n} faces.` });
    for (const n of [5, 6, 8]) tm.push({ text: `Fill the solid with exactly ${n} vertices (corners)!`, test: (t) => t.kind === "solid" && SOLID_FACTS[t.solid!].polyhedron && SOLID_FACTS[t.solid!].vertices === n, why: (t) => `the ${SOLID_NAME[t.solid!]} has ${n} vertices.` });
    for (const n of [8, 9, 12]) tm.push({ text: `Fill the solid with exactly ${n} edges!`, test: (t) => t.kind === "solid" && SOLID_FACTS[t.solid!].polyhedron && SOLID_FACTS[t.solid!].edges === n, why: (t) => `the ${SOLID_NAME[t.solid!]} has ${n} edges.` });
    tm.push({ text: "Fill the CUBE (all faces are squares)!", test: (t) => t.solid === "cube", why: () => "a cube has 6 square faces, 12 edges and 8 vertices." });
    tm.push({ text: "Fill the solid that can roll!", test: (t) => t.kind === "solid" && SOLID_FACTS[t.solid!].rolls, why: (t) => `the ${SOLID_NAME[t.solid!]} has a curved surface, so it rolls.` });
    return pickFrom(c, tm);
  },
};

const g2Poly: Gen = {
  id: "g2-poly",
  standard: "NC.2.G.1",
  skill: "Triangles, quadrilaterals, pentagons, hexagons",
  grades: ["2"],
  weight: 3,
  make(c) {
    const fl = (s: string) => (t: Target) => t.kind === "flower" && t.shape === s;
    return pickFrom(c, [
      { text: "Water the PENTAGON!", test: fl("pentagon"), why: () => "a pentagon has 5 sides and 5 angles." },
      { text: "Water the HEXAGON!", test: fl("hexagon"), why: () => "a hexagon has 6 sides and 6 angles." },
      { text: "Water the TRIANGLE!", test: fl("triangle"), why: () => "a triangle has 3 sides and 3 angles." },
      { text: "Water the QUADRILATERAL (4 sides)!", test: (t) => t.kind === "flower" && attrs2D(t.shape!).sides === 4, why: (t) => `a ${SHAPE_NAME[t.shape!]} has 4 sides, so it is a quadrilateral.` },
      { text: "Water the shape with exactly 5 angles!", test: (t) => t.kind === "flower" && attrs2D(t.shape!).corners === 5, why: () => "the pentagon has 5 angles." },
      { text: "Water the shape with exactly 6 angles!", test: (t) => t.kind === "flower" && attrs2D(t.shape!).corners === 6, why: () => "the hexagon has 6 angles." },
      { text: "Water the shape with exactly 3 angles!", test: (t) => t.kind === "flower" && attrs2D(t.shape!).corners === 3, why: () => "the triangle has 3 angles." },
    ]);
  },
};

/** K-2 only, after a short or long throw at the same target. */
const k2Power: Gen = {
  id: "k2-power",
  standard: "NC.K.MD.2",
  skill: "More or less",
  grades: ["K", "1", "2"],
  weight: 6,
  make(c) {
    const m = c.lastMiss;
    if (!m || m.target !== c.target) return null;
    const t = T(c.lv, c.target);
    const aim = bestAim(c.lv, c.target);
    const short = m.side === "short";
    // MORE → the power that hits; LESS (or the other way) → 12 points the wrong way.
    const right = aim.power;
    const wrongWay = Math.max(10, Math.min(100, short ? c.power - 12 : c.power + 12));
    const choicesTxt = ["MORE power", "LESS power", "The SAME power", "NO power"];
    const vals = short ? [right, wrongWay, c.power, 5] : [wrongWay, right, c.power, 5];
    return {
      prompt: `Your balloon landed ${short ? "SHORT of (before)" : "PAST (after)"} the ${shortName(t)}. What does the next throw need?`,
      choices: choicesTxt,
      answer: short ? 0 : 1,
      effect: { type: "power", values: vals },
      preset: { angle: aim.angle },
      explanation: short ? "It did not go far enough, so throw with MORE power." : "It went too far, so throw with LESS power.",
      diagram: { t: "power", side: m.side },
      meta: { side: m.side },
    };
  },
};

// ------------------------------------------------------------------ grade 3

const g3Quad: Gen = {
  id: "g3-quad",
  standard: "NC.3.G.1",
  skill: "Quadrilaterals and their attributes",
  grades: ["3"],
  weight: 3,
  make(c) {
    const A = (t: Target) => attrs2D(t.shape!);
    const sg = (t: Target) => t.kind === "sign";
    return pickFrom(c, [
      { text: "Splash the sign with 4 right angles AND 4 equal sides!", test: (t) => sg(t) && A(t).rightAngles === 4 && A(t).allSidesEqual, why: () => "a square has 4 right angles and 4 equal sides." },
      { text: "Splash the sign with 4 right angles but sides NOT all equal!", test: (t) => sg(t) && A(t).rightAngles === 4 && !A(t).allSidesEqual, why: () => "a rectangle has 4 right angles; its long and short sides differ." },
      { text: "Splash the sign with 4 equal sides but NO right angles!", test: (t) => sg(t) && A(t).rightAngles === 0 && A(t).allSidesEqual, why: () => "a rhombus has 4 equal sides; its angles are not right angles." },
      { text: "Splash the sign with exactly 2 right angles!", test: (t) => sg(t) && A(t).rightAngles === 2, why: (t) => `the ${SHAPE_NAME[t.shape!]} has exactly 2 right angles.` },
      { text: "Splash the sign with exactly 1 pair of parallel sides!", test: (t) => sg(t) && A(t).parallelPairs === 1, why: (t) => `the ${SHAPE_NAME[t.shape!]} has just one pair of parallel sides.` },
      { text: "Splash the sign with NO parallel sides at all!", test: (t) => sg(t) && A(t).parallelPairs === 0, why: (t) => `the ${SHAPE_NAME[t.shape!]} has no parallel sides.` },
      { text: "Splash the quadrilateral that is a rectangle AND a rhombus!", test: (t) => sg(t) && A(t).rightAngles === 4 && A(t).allSidesEqual, why: () => "a square is both: 4 right angles (rectangle) and 4 equal sides (rhombus)." },
      { text: "Splash the sign with 2 pairs of parallel sides and NO right angles!", test: (t) => sg(t) && A(t).parallelPairs === 2 && A(t).rightAngles === 0, why: (t) => `the ${SHAPE_NAME[t.shape!]} has 2 pairs of parallel sides but no right angles.` },
    ]);
  },
};

const g3Perim: Gen = {
  id: "g3-perim",
  standard: "NC.3.MD.8",
  skill: "Perimeter",
  grades: ["3"],
  weight: 3,
  make(c) {
    const P = (t: Target) => 2 * (t.bed![0] + t.bed![1]);
    const tm: Tmpl[] = [];
    for (const t of c.lv.targets) {
      if (t.kind !== "planter") continue;
      const [w, h] = t.bed!;
      tm.push({ text: `Water the garden with a perimeter of ${P(t)} units!`, test: (x) => x.kind === "planter" && P(x) === P(t), why: () => `${w} + ${h} + ${w} + ${h} = ${P(t)} units around.` });
      tm.push({ text: `A garden has a perimeter of ${P(t)} units. One side is ${w} units. Water it!`, test: (x) => x.kind === "planter" && P(x) === P(t), why: () => `${P(t)} − ${w} − ${w} = ${2 * h}, so the other sides are ${h} units each.` });
    }
    return pickFrom(c, tm);
  },
};

const g3Area: Gen = {
  id: "g3-area",
  standard: "NC.3.MD.7",
  skill: "Area of rectangles",
  grades: ["3"],
  make(c) {
    const A = (t: Target) => t.bed![0] * t.bed![1];
    return pickFrom(
      c,
      c.lv.targets
        .filter((t) => t.kind === "planter")
        .map((t) => ({ text: `Water the garden with an AREA of ${A(t)} square units!`, test: (x: Target) => x.kind === "planter" && A(x) === A(t), why: () => `${t.bed![0]} × ${t.bed![1]} = ${A(t)} square units.` })),
    );
  },
};

const g3Right: Gen = {
  id: "g3-right",
  standard: "NC.3.G.1",
  skill: "Right angles",
  grades: ["3"],
  make(c) {
    const as = anglesIn(c, 20, 70);
    if (!as.length) return null;
    const a = c.rng.pick(as);
    const back = c.rng() < 0.5;
    const shown = back ? 180 - a : a;
    const ans = shown < 90 ? "Smaller than a right angle" : "Bigger than a right angle";
    return {
      prompt: back
        ? "Look at the angle BEHIND your launcher (between it and the ground on the left). Compare it with a right angle (a square corner)."
        : "Look at your launch angle (between the launcher and the ground). Compare it with a right angle (a square corner).",
      ...textQ(ans, ["A right angle", shown < 90 ? "Bigger than a right angle" : "Smaller than a right angle", "A straight line"]),
      preset: { angle: a },
      explanation: `A right angle is a square corner. This angle is ${shown < 90 ? "narrower" : "wider"} than a square corner, so it is ${ans.toLowerCase()}.`,
      diagram: { t: "angle", deg: a, label: back ? "" : "?", back, backLabel: "?", square: true },
      meta: { shown },
    };
  },
};

// ------------------------------------------------------------------ grade 4

const g4Protractor: Gen = {
  id: "g4-protractor",
  standard: "NC.4.MD.6",
  skill: "Measure angles with a protractor",
  grades: ["4"],
  weight: 3,
  make(c) {
    const as = anglesIn(c, 12, 80, (a) => Math.abs(a - 90) > 12);
    if (!as.length) return null;
    const a = c.rng.pick(as);
    return {
      prompt: "Read the protractor: what is the launch angle? (Count from 0° on the ground.)",
      ...angleQ(a, [180 - a, a + 10, a - 10]),
      preset: { angle: a },
      hideAngle: true,
      explanation: `Start at the 0° on the ground line and count up to the launcher: ${a}°. Reading the other scale gives ${180 - a}° by mistake.`,
      diagram: { t: "angle", deg: a, label: deg(a), protractor: true },
      meta: { a },
    };
  },
};

const g4Classify: Gen = {
  id: "g4-classify",
  standard: "NC.4.G.1",
  skill: "Acute, right, obtuse and straight angles",
  grades: ["4"],
  weight: 2,
  make(c) {
    const as = anglesIn(c, 15, 80);
    if (!as.length) return null;
    const a = c.rng.pick(as);
    const back = c.rng() < 0.55;
    const shown = back ? 180 - a : a;
    const kind = shown < 90 ? "Acute" : shown === 90 ? "Right" : shown < 180 ? "Obtuse" : "Straight";
    return {
      prompt: back
        ? `Your launch angle is ${a}°. The angle BEHIND the launcher is ${shown}°. What kind of angle is ${shown}°?`
        : `Your launch angle is ${a}°. What kind of angle is it?`,
      ...textQ(kind, ["Acute", "Right", "Obtuse", "Straight"].filter((k) => k !== kind)),
      preset: { angle: a },
      explanation: `Acute is less than 90°, right is exactly 90°, obtuse is between 90° and 180°, straight is 180°. ${shown}° is ${kind.toLowerCase()}.${back ? ` Together the two angles make a straight line: ${a}° + ${shown}° = 180°.` : ""}`,
      diagram: { t: "angle", deg: a, label: back ? deg(a) : "?", back, backLabel: back ? `${shown}°` : undefined },
      meta: { shown, kind },
    };
  },
};

/** n/d of a full turn with a whole number of degrees, kid-friendly fractions. */
const TURN_FRACS: [number, number][] = [[1, 12], [1, 10], [1, 9], [1, 8], [1, 6], [1, 5], [1, 18], [1, 20], [1, 24], [1, 36], [1, 15]];
const g4Turn: Gen = {
  id: "g4-turn",
  standard: "NC.4.MD.5",
  skill: "Angles as fractions of a turn",
  grades: ["4"],
  weight: 2,
  make(c) {
    const ok = new Set(goodAngles(c.lv, c.target));
    const fr = c.rng.shuffle(TURN_FRACS).find(([n, d]) => ok.has((360 * n) / d));
    if (!fr) return null;
    const [n, d] = fr;
    const a = (360 * n) / d;
    const one = c.rng() < 0.5;
    const wrong = TURN_FRACS.map(([x, y]) => (360 * x) / y).filter((v) => v !== a);
    return {
      prompt: one
        ? `A full turn is 360°. Aim the launcher ${n}/${d} of a full turn up from the ground. How many degrees is that?`
        : `An angle that turns through ${a} one-degree angles measures how many degrees? Aim there!`,
      ...angleQ(a, one ? [c.rng.pick(wrong), 360 / (d - 1) | 0, a + 10] : [a + 1, a - 1, 360 - a]),
      hideAngle: true,
      explanation: one ? `360° ÷ ${d} = ${a}°, so ${n}/${d} of a turn is ${a}°.` : `Each one-degree angle is 1°, so ${a} of them make ${a}°.`,
      diagram: { t: "angle", deg: a, label: one ? `${n}/${d} turn` : `${a} × 1°` },
      meta: { n, d, a, one },
    };
  },
};

const g4Add: Gen = {
  id: "g4-add",
  standard: "NC.4.MD.7",
  skill: "Adding and subtracting angles",
  grades: ["4"],
  weight: 3,
  make(c) {
    const as = anglesIn(c, 20, 80);
    if (!as.length) return null;
    const a = c.rng.pick(as);
    if (c.rng() < 0.5) {
      const x = c.rng.int(5, a - 8);
      const y = a - x;
      return {
        prompt: `The launch angle is made of two angles side by side: ${x}° and ${y}°. Set the launch angle!`,
        ...angleQ(a, [Math.abs(x - y), a + 10, a - 10]),
        hideAngle: true,
        explanation: `Angles side by side add up: ${x}° + ${y}° = ${a}°.`,
        diagram: { t: "two", a: x, b: y, la: deg(x), lb: deg(y), total: "?" },
        meta: { x, y, a },
      };
    }
    const b = 180 - a;
    return {
      prompt: `The ground is a straight angle (180°). The angle behind the launcher is ${b}°. What is the launch angle?`,
      ...angleQ(a, [b - 90, a + 10, 90 - a > 0 ? 90 - a : a - 10]),
      hideAngle: true,
      explanation: `The two angles make a straight angle: 180° − ${b}° = ${a}°.`,
      diagram: { t: "angle", deg: a, label: "?", back: true, backLabel: deg(b) },
      meta: { b, a },
    };
  },
};

const g4Units: Gen = {
  id: "g4-units",
  standard: "NC.4.MD.1",
  skill: "Converting measurements",
  grades: ["4"],
  make(c) {
    const t = T(c.lv, c.target);
    const m = Math.max(10, Math.round((t.x - c.lv.launch.x) / S / 10) * 10);
    const aim = bestAim(c.lv, c.target);
    return {
      prompt: `The ${targetName(t)} is about ${m} meters away. How many centimeters is that?`,
      ...textQ(`${(m * 100).toLocaleString("en-US")} cm`, [`${m * 10} cm`, `${(m * 1000).toLocaleString("en-US")} cm`, `${m + 100} cm`]),
      preset: { angle: aim.angle },
      explanation: `1 meter = 100 centimeters, so ${m} m = ${m} × 100 = ${(m * 100).toLocaleString("en-US")} cm.`,
      meta: { m },
    };
  },
};

// ------------------------------------------------------------------ grade 5

function gridDiagram(lv: Level): Diagram {
  return { t: "grid", nx: 20, ny: 11, points: lv.targets.map((t) => ({ x: t.coord![0], y: t.coord![1], label: t.letter, dim: t.watered })), origin: true };
}

const g5Coord: Gen = {
  id: "g5-coord",
  standard: "NC.5.G.1",
  skill: "Points on the coordinate plane",
  grades: ["5"],
  weight: 3,
  make(c) {
    if (!c.lv.grid) return null;
    const ts = live(c.lv);
    const i = c.rng.pick(ts);
    const t = T(c.lv, i);
    const [x, y] = t.coord!;
    return {
      prompt: `Splash the ${targetName(t)} at (${x}, ${y})!`,
      ...pickQ(c.lv),
      answer: i,
      target: i,
      explanation: `Target ${t.letter}: start at (0, 0), go ${x} across the x-axis, then ${y} up. (${y}, ${x}) would be a different point.`,
      diagram: gridDiagram(c.lv),
      meta: { x, y, coords: c.lv.targets.map((q) => q.coord) },
    };
  },
};

const g5Word: Gen = {
  id: "g5-word",
  standard: "NC.5.G.2",
  skill: "Coordinate word problems",
  grades: ["5"],
  weight: 2,
  make(c) {
    if (!c.lv.grid) return null;
    const i = c.rng.pick(live(c.lv));
    const t = T(c.lv, i);
    const [x, y] = t.coord!;
    return {
      prompt: `On the city map each block is 1 unit. The ${targetName(t)} is ${x} blocks east of the corner (0, 0) and ${y} blocks north. Splash it!`,
      ...pickQ(c.lv),
      answer: i,
      target: i,
      explanation: `East is the x-coordinate and north is the y-coordinate: target ${t.letter} is at (${x}, ${y}).`,
      diagram: gridDiagram(c.lv),
      meta: { x, y, coords: c.lv.targets.map((q) => q.coord) },
    };
  },
};

function volumeTmpls(c: Ctx, unit: string, word: string): Tmpl[] {
  return c.lv.targets
    .filter((t) => t.tank)
    .map((t) => ({
      text: `Fill the tank that holds exactly ${volumeText(t.tank!)} ${word}!`,
      test: (x: Target) => !!x.tank && tankVolume(x.tank) === tankVolume(t.tank!) && hasPi(x.tank) === hasPi(t.tank!),
      why: (x: Target) => volumeWhy(x, unit),
    }));
}
export function volumeWhy(t: Target, unit = ""): string {
  const k = t.tank!;
  const u = unit ? ` ${unit}³` : " cubic units";
  switch (k.kind) {
    case "box":
      return `V = l × w × h = ${frac(k.l)} × ${frac(k.w)} × ${frac(k.h)} = ${frac(tankVolume(k))}${u}.`;
    case "step":
      return `Add the two boxes: ${k.l1}×${k.w}×${k.h1} + ${k.l2}×${k.w}×${k.h2} = ${k.l1 * k.w * k.h1} + ${k.l2 * k.w * k.h2} = ${tankVolume(k)}${u}.`;
    case "tri":
      return `V = (½ × base × height) × length = ½ × ${k.b} × ${k.th} × ${k.len} = ${frac(tankVolume(k))}${u}.`;
    case "cylinder":
      return `V = πr²h = π × ${k.r}² × ${k.h} = ${tankVolume(k)}π${u}.`;
    case "cone":
      return `V = ⅓πr²h = ⅓ × π × ${k.r}² × ${k.h} = ${tankVolume(k)}π${u}.`;
    case "sphere":
      return `V = ⁴⁄₃πr³ = ⁴⁄₃ × π × ${k.r}³ = ${tankVolume(k)}π${u}.`;
    case "pyramid":
      return `V = ⅓ × base area × h = ⅓ × ${k.s}² × ${k.h} = ${tankVolume(k)}${u}.`;
  }
}

const g5Volume: Gen = {
  id: "g5-volume",
  standard: "NC.5.MD.5",
  skill: "Volume of rectangular prisms",
  grades: ["5"],
  weight: 4,
  make(c) {
    const q = pickFrom(c, volumeTmpls(c, "", "cubic units"));
    if (q) q.icons = c.lv.targets.map((t) => ({ t: "tank", tank: t.tank!, labels: true }) as Diagram);
    return q;
  },
};

const g5Cubes: Gen = {
  id: "g5-cubes",
  standard: "NC.5.MD.4",
  skill: "Volume by counting unit cubes",
  grades: ["5"],
  weight: 2,
  make(c) {
    if (!c.lv.targets.every((t) => t.tank && t.tank.kind === "box" && t.tank.l * t.tank.w * t.tank.h <= 36)) return null;
    const q = pickFrom(
      c,
      c.lv.targets.map((t) => ({
        text: `Count the unit cubes: fill the tank made of ${tankVolume(t.tank!)} cubes!`,
        test: (x: Target) => tankVolume(x.tank!) === tankVolume(t.tank!),
        why: (x: Target) => {
          const k = x.tank as { l: number; w: number; h: number };
          return `${k.l} × ${k.w} = ${k.l * k.w} cubes in each layer, and ${k.h} layers: ${k.l * k.w} × ${k.h} = ${tankVolume(x.tank!)} cubes.`;
        },
      })),
    );
    if (q) q.icons = c.lv.targets.map((t) => ({ t: "tank", tank: t.tank!, cubes: true }) as Diagram);
    return q;
  },
};

const g5Units: Gen = {
  id: "g5-units",
  standard: "NC.5.MD.1",
  skill: "Converting metric units",
  grades: ["5"],
  make(c) {
    if (!c.lv.grid) return null;
    const t = T(c.lv, c.target);
    const m = (t.x - c.lv.launch.x) / S;
    const meters = Math.round(m / 5) * 5 * 10; // a map with 10× scale
    const km = meters / 1000;
    const aim = bestAim(c.lv, c.target);
    return {
      prompt: `On a big map the ${targetName(t)} is ${meters.toLocaleString("en-US")} m away. How many kilometers is that?`,
      ...textQ(`${km} km`, [`${meters / 100} km`, `${meters / 10} km`, `${meters / 10000} km`, `${meters.toLocaleString("en-US")} km`]),
      preset: { angle: aim.angle },
      explanation: `1 km = 1,000 m, so ${meters.toLocaleString("en-US")} m ÷ 1,000 = ${km} km.`,
      meta: { meters, km },
    };
  },
};

// ------------------------------------------------------------------ grade 6

const g6Area: Gen = {
  id: "g6-area",
  standard: "NC.6.G.1",
  skill: "Area of triangles and polygons",
  grades: ["6"],
  weight: 4,
  make(c) {
    const how = (t: Target) => {
      const a = t.area!;
      const l = a.labels.map((x) => Number(x[0]));
      switch (a.kind) {
        case "rect":
          return `rectangle: ${l[0]} × ${l[1]} = ${a.area}.`;
        case "tri":
          return `triangle: ½ × base × height = ½ × ${l[0]} × ${l[1]} = ${a.area}.`;
        case "para":
          return `parallelogram: base × height = ${l[0]} × ${l[1]} = ${a.area}.`;
        case "trap":
          return `trapezoid: ½ × (${l[0]} + ${l[1]}) × ${l[2]} = ${a.area}.`;
        case "L":
          return `split it into two rectangles: ${l[0]} × ${l[3]} + ${l[2]} × ${l[1] - l[3]} = ${a.area}.`;
      }
    };
    const q = pickFrom(
      c,
      c.lv.targets
        .filter((t) => t.area)
        .map((t) => ({ text: `Splash the garden sign with an area of ${frac(t.area!.area)} square units!`, test: (x: Target) => !!x.area && x.area.area === t.area!.area, why: how })),
    );
    return q;
  },
};

const g6Corner: Gen = {
  id: "g6-corner",
  standard: "NC.6.G.3",
  skill: "Polygons on the coordinate plane",
  grades: ["6"],
  weight: 2,
  make(c) {
    if (!c.lv.grid) return null;
    const i = c.rng.pick(live(c.lv));
    const t = T(c.lv, i);
    const [cx, by] = t.coord!;
    // Rectangle corners (a, b) (a, d) (c, d) with the 4th corner (c, b) at the target.
    let a = c.rng.int(1, cx - 3);
    let d = c.rng.int(1, 10);
    if (d === by) d = by > 5 ? by - 3 : by + 3;
    if (a === cx) a = cx - 2;
    const corners: [number, number][] = [[a, by], [a, d], [cx, d]];
    return {
      prompt: `A rectangle has corners at (${a}, ${by}), (${a}, ${d}) and (${cx}, ${d}). Its 4th corner has a target on it. Splash it!`,
      ...pickQ(c.lv),
      answer: i,
      target: i,
      explanation: `Opposite sides of a rectangle line up: the 4th corner shares x = ${cx} with (${cx}, ${d}) and y = ${by} with (${a}, ${by}). That's (${cx}, ${by}): target ${t.letter}.`,
      diagram: { ...(gridDiagram(c.lv) as Extract<Diagram, { t: "grid" }>), poly: [...corners, [cx, by]] },
      meta: { a, by, cx, d, coords: c.lv.targets.map((q) => q.coord) },
    };
  },
};

const g6Side: Gen = {
  id: "g6-side",
  standard: "NC.6.G.3",
  skill: "Side lengths from coordinates",
  grades: ["6"],
  make(c) {
    if (!c.lv.grid) return null;
    const t = T(c.lv, c.target);
    const [x, y] = t.coord!;
    const x0 = c.rng.int(0, Math.max(0, x - 4));
    const len = x - x0;
    const aim = bestAim(c.lv, c.target);
    return {
      prompt: `A rope runs from (${x0}, ${y}) to the ${targetName(t)} at (${x}, ${y}). How long is the rope?`,
      ...textQ(`${len} units`, [`${x + x0} units`, `${len + y} units`, `${Math.abs(len - 1) || len + 2} units`]),
      preset: { angle: aim.angle },
      explanation: `Same y-coordinate, so subtract the x-coordinates: ${x} − ${x0} = ${len} units.`,
      diagram: { t: "grid", nx: 20, ny: 11, points: [{ x: x0, y, label: "" }, { x, y, label: t.letter }], poly: [[x0, y], [x, y]] },
      meta: { x0, x, len },
    };
  },
};

const g6Surface: Gen = {
  id: "g6-surface",
  standard: "NC.6.G.4",
  skill: "Nets and surface area",
  grades: ["6"],
  weight: 2,
  make(c) {
    if (!c.lv.targets.every((t) => t.tank?.kind === "box")) return null;
    const SA = (t: Target) => {
      const k = t.tank as { l: number; w: number; h: number };
      return boxSurface(k.l, k.w, k.h);
    };
    const q = pickFrom(
      c,
      c.lv.targets.map((t) => ({
        text: `Unfold the tank into a net: splash the tank whose net covers ${frac(SA(t))} square units!`,
        test: (x: Target) => SA(x) === SA(t),
        why: (x: Target) => {
          const k = x.tank as { l: number; w: number; h: number };
          return `SA = 2(lw + lh + wh) = 2(${frac(k.l * k.w)} + ${frac(k.l * k.h)} + ${frac(k.w * k.h)}) = ${frac(SA(x))} square units.`;
        },
      })),
    );
    if (q) q.diagram = { t: "net", solid: "prism" };
    return q;
  },
};

const g6Net: Gen = {
  id: "g6-net",
  standard: "NC.6.G.4",
  skill: "Nets of prisms and pyramids",
  grades: ["6"],
  weight: 3,
  make(c) {
    const q = pickFrom(
      c,
      c.lv.targets
        .filter((t) => t.kind === "solid")
        .map((t) => ({
          text: "This net folds up into one of the solids. Fill that solid!",
          test: (x: Target) => x.solid === t.solid,
          why: (x: Target) => `the net has ${SOLID_LOOK[x.solid!]}: a ${SOLID_NAME[x.solid!]}.`,
        })),
    );
    if (!q) return null;
    const t = T(c.lv, q.target!);
    q.prompt = "This net folds up into one of the solids. Fill that solid!";
    q.diagram = { t: "net", solid: t.solid! };
    q.meta = { solid: t.solid };
    return q;
  },
};

const g6FracVol: Gen = {
  id: "g6-fracvol",
  standard: "NC.6.G.2",
  skill: "Volume with fractional edges",
  grades: ["6"],
  weight: 3,
  make(c) {
    if (!c.lv.targets.every((t) => t.tank)) return null;
    const q = pickFrom(c, volumeTmpls(c, "", "cubic units"));
    return q;
  },
};

// ------------------------------------------------------------------ grade 7

const g7CompSupp: Gen = {
  id: "g7-compsupp",
  standard: "NC.7.G.5",
  skill: "Complementary and supplementary angles",
  grades: ["7"],
  weight: 3,
  make(c) {
    const as = anglesIn(c, 12, 78);
    if (!as.length) return null;
    const a = c.rng.pick(as);
    const supp = c.rng() < 0.5;
    const given = supp ? 180 - a : 90 - a;
    return {
      prompt: `Aim at the ${supp ? "SUPPLEMENT" : "COMPLEMENT"} of ${given}°.`,
      ...angleQ(a, [supp ? 90 - given : 180 - given, given, a + 10]),
      hideAngle: true,
      explanation: supp
        ? `Supplementary angles add to 180°: 180° − ${given}° = ${a}°.`
        : `Complementary angles add to 90°: 90° − ${given}° = ${a}°.`,
      diagram: supp ? { t: "angle", deg: a, label: "?", back: true, backLabel: deg(given) } : { t: "two", a, b: given, la: "?", lb: deg(given), total: "90°" },
      meta: { supp, given, a },
    };
  },
};

const g7Vertical: Gen = {
  id: "g7-vertical",
  standard: "NC.7.G.5",
  skill: "Vertical and adjacent angles",
  grades: ["7"],
  weight: 2,
  make(c) {
    const as = anglesIn(c, 15, 75);
    if (!as.length) return null;
    const a = c.rng.pick(as);
    const vert = c.rng() < 0.5;
    const given = vert ? a : 180 - a;
    return {
      prompt: vert
        ? `Two straight paths cross. The angle VERTICAL to your launch angle is ${given}°. Set the launch angle!`
        : `Two straight paths cross. An angle ADJACENT to your launch angle (on the same straight line) is ${given}°. Set the launch angle!`,
      ...angleQ(a, [180 - given === a ? given : 180 - given, 90 - a > 0 ? 90 - a : a + 20, a + 10]),
      hideAngle: true,
      explanation: vert ? `Vertical angles are equal: ${a}°.` : `Adjacent angles on a straight line add to 180°: 180° − ${given}° = ${a}°.`,
      diagram: { t: "cross", deg: a, labels: ["?", vert ? "" : `${given}°`, vert ? `${given}°` : "", ""] },
      meta: { vert, given, a },
    };
  },
};

const g7Equation: Gen = {
  id: "g7-equation",
  standard: "NC.7.G.5",
  skill: "Angle equations",
  grades: ["7"],
  weight: 2,
  make(c) {
    const as = anglesIn(c, 15, 75);
    if (!as.length) return null;
    const a = c.rng.pick(as);
    const total = c.rng() < 0.5 && a < 80 ? 90 : 180;
    const k = c.rng.pick([1, 2]);
    const rest = total - a - k * a; // the other angle is (k·x + rest)
    if (rest <= 0 || total - a <= 0) {
      const k1 = 1;
      const r1 = total - 2 * a;
      if (r1 <= 0) return null;
      return eq(a, total, k1, r1);
    }
    return eq(a, total, k, rest);
    function eq(x: number, tot: number, kk: number, r: number): Draft {
      const expr = `${kk === 1 ? "" : kk}x + ${r}`;
      return {
        prompt: `Your launch angle is x°. It and an angle of (${expr})° are adjacent and together make ${tot === 90 ? "a right angle" : "a straight angle"}. Solve for x and aim!`,
        ...angleQ(x, [Math.round((tot + r) / (kk + 1)), tot - r, x + 5]),
        hideAngle: true,
        explanation: `x + ${expr} = ${tot}, so ${kk + 1}x = ${tot - r} and x = ${x}°.`,
        diagram: { t: "two", a: x, b: tot - x, la: "x", lb: `${expr}`, total: `${tot}°` },
        meta: { a: x, tot, k: kk, r },
      };
    }
  },
};

const g7Scale: Gen = {
  id: "g7-scale",
  standard: "NC.7.G.1",
  skill: "Scale drawings",
  grades: ["7"],
  make(c) {
    const t = T(c.lv, c.target);
    const per = c.rng.pick([2, 4, 5, 10]);
    const cm = c.rng.int(8, 30);
    const real = cm * per;
    const aim = bestAim(c.lv, c.target);
    void t;
    return {
      prompt: `On the scale drawing, 1 cm stands for ${per} m. The ${targetName(t)} is ${cm} cm from you on the drawing. How far is it really?`,
      ...textQ(`${real} m`, [`${cm + per} m`, `${Math.round((cm / per) * 10) / 10} m`, `${real * 10} m`]),
      preset: { angle: aim.angle },
      explanation: `Each cm is ${per} m, so ${cm} × ${per} = ${real} m.`,
      diagram: { t: "scale", cm, per, unit: "m" },
      meta: { per, cm, real },
    };
  },
};

const SECTION_TXT: Record<Section, string> = { square: "Square", rectangle: "Rectangle", triangle: "Triangle", circle: "Circle" };
function sectionGen(id: string, standard: string, grades: Grade[], pool: [Solid, Cut][]): Gen {
  return {
    id,
    standard,
    skill: standard.startsWith("NC.7") ? "Cross-sections of solids" : "Cross-sections and solids",
    grades,
    weight: 2,
    make(c) {
      const [solid, cut] = c.rng.pick(pool);
      const sec = SECTION[solid][cut];
      const aim = bestAim(c.lv, c.target);
      return {
        prompt: `Slice a ${SOLID_NAME[solid]} ${cut === "level" ? "flat, parallel to its base" : "straight down through its middle (top to bottom)"}. What shape is the cross-section?`,
        ...textQ(SECTION_TXT[sec], (["Square", "Rectangle", "Triangle", "Circle"] as const).filter((s) => s !== SECTION_TXT[sec])),
        preset: { angle: aim.angle },
        explanation: `The cut face of the ${SOLID_NAME[solid]} is a ${sec}.${cut === "level" ? " A cut parallel to the base has the base's shape." : ""}`,
        diagram: { t: "solid", solid, cut },
        meta: { solid, cut, sec },
      };
    },
  };
}
const SECTION_POOL: [Solid, Cut][] = [
  ["cube", "level"], ["prism", "level"], ["prism", "upright"], ["triprism", "upright"], ["triprism", "level"], ["pyramid", "level"], ["pyramid", "upright"],
  ["cylinder", "level"], ["cylinder", "upright"], ["cone", "level"], ["cone", "upright"], ["sphere", "level"],
];
const g7Section = sectionGen("g7-section", "NC.7.G.3", ["7"], SECTION_POOL);

const g7Volume: Gen = {
  id: "g7-volume",
  standard: "NC.7.G.6",
  skill: "Volume and surface area of prisms",
  grades: ["7"],
  weight: 4,
  make(c) {
    if (!c.lv.targets.every((t) => t.tank)) return null;
    const tm = volumeTmpls(c, "", "cubic units");
    if (c.lv.targets.every((t) => t.tank!.kind === "box")) {
      for (const t of c.lv.targets) {
        const k = t.tank as { l: number; w: number; h: number };
        const sa = boxSurface(k.l, k.w, k.h);
        tm.push({
          text: `Paint covers the outside: splash the tank with a surface area of ${sa} square units!`,
          test: (x: Target) => {
            const q = x.tank as { l: number; w: number; h: number };
            return boxSurface(q.l, q.w, q.h) === sa;
          },
          why: () => `SA = 2(lw + lh + wh) = 2(${k.l * k.w} + ${k.l * k.h} + ${k.w * k.h}) = ${sa}.`,
        });
      }
    }
    return pickFrom(c, tm);
  },
};

// ------------------------------------------------------------------ grade 8

const TRIPLES: [number, number, number][] = [[3, 4, 5], [6, 8, 10], [5, 12, 13], [8, 15, 17], [9, 12, 15], [12, 16, 20], [7, 24, 25], [20, 21, 29], [15, 20, 25]];
const g8Pyth: Gen = {
  id: "g8-pyth",
  standard: "NC.8.G.7",
  skill: "Pythagorean theorem",
  grades: ["8"],
  weight: 3,
  make(c) {
    const t = T(c.lv, c.target);
    const aim = bestAim(c.lv, c.target);
    const triple = c.rng() < 0.6;
    let a: number, b: number, h: string, wrong: string[];
    if (triple) {
      const tr = c.rng.pick(TRIPLES);
      [a, b] = c.rng() < 0.5 ? [tr[0], tr[1]] : [tr[1], tr[0]];
      h = `${tr[2]} m`;
      wrong = [`${a + b} m`, `${a * a + b * b} m`, `${tr[2] + 2} m`, `${tr[2] - 1} m`];
    } else {
      do {
        a = c.rng.int(3, 14);
        b = c.rng.int(3, 14);
      } while (Number.isInteger(Math.hypot(a, b)) || a === b);
      const v = Math.round(Math.hypot(a, b) * 10) / 10;
      h = `${v.toFixed(1)} m`;
      wrong = [`${a + b}.0 m`, `${(Math.round(Math.sqrt(Math.abs(a * a - b * b)) * 10) / 10).toFixed(1)} m`, `${(v + 1.3).toFixed(1)} m`, `${(v - 1.1).toFixed(1)} m`];
    }
    return {
      prompt: `The ${targetName(t)} is ${a} m across and ${b} m up from a lookout. How far is it in a straight line?${triple ? "" : " (nearest tenth)"}`,
      ...textQ(h, wrong),
      preset: { angle: aim.angle },
      explanation: `a² + b² = c²: ${a}² + ${b}² = ${a * a + b * b}, so c = √${a * a + b * b} ${triple ? "=" : "≈"} ${h}.`,
      diagram: { t: "right", run: a, rise: b, lRun: `${a} m`, lRise: `${b} m`, lHyp: "?", lAngle: "" },
      meta: { a, b, triple },
    };
  },
};

const g8Dist: Gen = {
  id: "g8-dist",
  standard: "NC.8.G.8",
  skill: "Distance between points",
  grades: ["8"],
  weight: 2,
  make(c) {
    const aim = bestAim(c.lv, c.target);
    const tr = c.rng.pick(TRIPLES.filter((x) => x[2] <= 20));
    const [x0, y0] = [c.rng.int(0, 4), c.rng.int(0, 3)];
    const [dx, dy] = c.rng() < 0.5 ? [tr[0], tr[1]] : [tr[1], tr[0]];
    return {
      prompt: `On the map you are at (${x0}, ${y0}) and the ${targetName(T(c.lv, c.target))} is at (${x0 + dx}, ${y0 + dy}). How far apart are they?`,
      ...textQ(`${tr[2]} units`, [`${dx + dy} units`, `${dx * dx + dy * dy} units`, `${tr[2] + 3} units`]),
      preset: { angle: aim.angle },
      explanation: `Across ${dx}, up ${dy}: d = √(${dx}² + ${dy}²) = √${dx * dx + dy * dy} = ${tr[2]}.`,
      diagram: { t: "right", run: dx, rise: dy, lRun: `${dx}`, lRise: `${dy}`, lHyp: "?", lAngle: "" },
      meta: { dx, dy },
    };
  },
};

/** Angle at spot `s` (0-3 top, 4-7 bottom: above-right, above-left, below-left, below-right). */
export function spotAngle(alpha: number, s: number): number {
  return s % 2 === 0 ? alpha : 180 - alpha;
}
const SPOT_PAIRS: { name: string; equal: boolean; pairs: [number, number][] }[] = [
  { name: "corresponding", equal: true, pairs: [[0, 4], [1, 5], [2, 6], [3, 7]] },
  { name: "alternate interior", equal: true, pairs: [[2, 4], [3, 5]] },
  { name: "alternate exterior", equal: true, pairs: [[0, 6], [1, 7]] },
  { name: "same-side interior", equal: false, pairs: [[2, 5], [3, 4]] },
];
const g8Parallel: Gen = {
  id: "g8-parallel",
  standard: "NC.8.G.5",
  skill: "Parallel lines and a transversal",
  grades: ["8"],
  weight: 3,
  make(c) {
    const as = anglesIn(c, 15, 80);
    if (!as.length) return null;
    const a = c.rng.pick(as);
    const rel = c.rng.pick(SPOT_PAIRS);
    const pair = c.rng.pick(rel.pairs);
    const [given, launch] = c.rng() < 0.5 ? pair : [pair[1], pair[0]];
    const alpha = launch % 2 === 0 ? a : 180 - a;
    const gv = spotAngle(alpha, given);
    const labels = Array(8).fill("");
    labels[given] = deg(gv);
    labels[launch] = "?";
    return {
      prompt: `Two rails are parallel and a ramp crosses them. The marked angle is ${gv}°. Your launch angle "?" is ${rel.name === "same-side interior" ? "a same-side interior angle" : `the ${rel.name} angle`} to it. Set it!`,
      ...angleQ(a, [rel.equal ? 180 - gv : gv, 90 - a > 0 ? 90 - a : a + 15, a + 10]),
      hideAngle: true,
      explanation: rel.equal ? `${rel.name[0].toUpperCase()}${rel.name.slice(1)} angles are equal: ${a}°.` : `Same-side interior angles add to 180°: 180° − ${gv}° = ${a}°.`,
      diagram: { t: "parallel", alpha, labels },
      meta: { alpha, given, launch, rel: rel.name, a },
    };
  },
};

const g8Triangle: Gen = {
  id: "g8-triangle",
  standard: "NC.8.G.5",
  skill: "Triangle angle sum and exterior angles",
  grades: ["8"],
  weight: 2,
  make(c) {
    const as = anglesIn(c, 20, 75);
    if (!as.length) return null;
    const a = c.rng.pick(as);
    const b = c.rng.int(30, Math.min(110, 160 - a));
    const top = 180 - a - b;
    if (c.rng() < 0.5) {
      return {
        prompt: `The ramp triangle has angles of ${b}° and ${top}°. Your launch angle is the third angle. Set it!`,
        ...angleQ(a, [180 - b, 180 - top, 90 - a > 0 ? 90 - a : a + 10]),
        hideAngle: true,
        explanation: `A triangle's angles add to 180°: 180° − ${b}° − ${top}° = ${a}°.`,
        diagram: { t: "triangle", angles: [a, b, top], labels: ["?", deg(b), deg(top)] },
        meta: { a, b, top, ext: false },
      };
    }
    const ext = 180 - b; // exterior angle at the bottom-right corner = a + top
    return {
      prompt: `In the ramp triangle, the exterior angle at one corner is ${ext}° and the far top angle is ${top}°. Your launch angle is the other far angle. Set it!`,
      ...angleQ(a, [180 - ext, ext - 90 > 0 ? ext - 90 : a + 15, a + 10]),
      hideAngle: true,
      explanation: `An exterior angle equals the two far (remote) angles added: ${ext}° − ${top}° = ${a}°.`,
      diagram: { t: "triangle", angles: [a, b, top], labels: ["?", "", deg(top)], ext: deg(ext) },
      meta: { a, ext, top, isExt: true },
    };
  },
};

const g8Reflect: Gen = {
  id: "g8-reflect",
  standard: "NC.8.G.3",
  skill: "Reflections",
  grades: ["8"],
  weight: 2,
  make(c) {
    const as = anglesIn(c, 15, 75);
    if (!as.length) return null;
    const a = c.rng.pick(as);
    const g = 180 - a;
    return {
      prompt: `A shot leaves at ${g}° (pointing up and LEFT). Reflect it over a vertical wall (the y-axis). What angle is the mirror shot?`,
      ...angleQ(a, [g - 90 > 0 && g - 90 !== a ? g - 90 : a + 20, a + 10, a - 10]),
      hideAngle: true,
      explanation: `Reflecting over the y-axis maps (x, y) to (−x, y): the direction flips left-right, so ${g}° becomes 180° − ${g}° = ${a}°.`,
      diagram: { t: "cross", deg: a, labels: ["?", deg(g), "", ""] },
      meta: { g, a },
    };
  },
};

function gcd(a: number, b: number): number {
  return b ? gcd(b, a % b) : a;
}
const g8Slope: Gen = {
  id: "g8-slope",
  standard: "NC.8.EE.6",
  skill: "Slope of a ramp",
  grades: ["8"],
  make(c) {
    const aim = bestAim(c.lv, c.target);
    const rise = c.rng.int(1, 9);
    let run = c.rng.int(2, 12);
    if (rise === run) run++;
    const g = gcd(rise, run);
    const f = (p: number, q: number) => {
      const k = gcd(p, q);
      return q / k === 1 ? `${p / k}` : `${p / k}/${q / k}`;
    };
    const s = f(rise, run);
    return {
      prompt: `The launch ramp rises ${rise} m over a run of ${run} m. What is its slope?`,
      ...textQ(s, [f(run, rise), f(rise, rise + run), f(rise + 1, run), f(run - rise > 0 ? run - rise : rise + run, run), f(rise, run + 1)]),
      preset: { angle: aim.angle },
      explanation: `Slope = rise ÷ run = ${rise}/${run}${g > 1 ? ` = ${s}` : ""}. Every similar triangle on the ramp gives the same slope.`,
      diagram: { t: "right", run, rise, lRun: `${run} m`, lRise: `${rise} m`, lHyp: "", lAngle: "" },
      meta: { rise, run },
    };
  },
};

function containerTmpls(c: Ctx, unit: string): Tmpl[] {
  return c.lv.targets
    .filter((t) => t.tank)
    .map((t) => ({
      text: `Fill the tank that holds ${volumeText(t.tank!)} ${unit}³!`,
      test: (x: Target) => !!x.tank && tankVolume(x.tank) === tankVolume(t.tank!) && hasPi(x.tank) === hasPi(t.tank!),
      why: (x: Target) => volumeWhy(x, unit),
    }));
}

const g8Volume: Gen = {
  id: "g8-volume",
  standard: "NC.8.G.9",
  skill: "Volume of cylinders, cones and spheres",
  grades: ["8"],
  weight: 5,
  make(c) {
    if (!c.lv.targets.every((t) => t.tank)) return null;
    const q = pickFrom(c, containerTmpls(c, "m"));
    if (q) q.icons = c.lv.targets.map((t) => ({ t: "tank", tank: t.tank!, unit: "m", labels: true }) as Diagram);
    return q;
  },
};

// ------------------------------------------------------------------ high school

const PARAB: [number, number, number][] = [
  // [half-width d, height k, a = k/d² as 1/x]
  [10, 10, 10], [10, 20, 5], [10, 25, 4], [20, 20, 20], [20, 40, 10], [20, 25, 16], [30, 45, 20], [30, 30, 30], [20, 10, 40], [10, 50, 2],
];
const hVertex: Gen = {
  id: "h-vertex",
  standard: "NC.M1.F-IF.4",
  skill: "Key features of a parabola",
  grades: ["9", "10", "11", "12"],
  weight: 3,
  make(c) {
    const [d, k, x] = c.rng.pick(PARAB);
    const p = d + c.rng.pick([0, 5, 10]);
    const ask = c.rng.pick(["max", "land", "vx"] as const);
    const aim = bestAim(c.lv, c.target);
    const f = `h(x) = −(1/${x})(x − ${p})² + ${k}`;
    const ans = ask === "max" ? k : ask === "land" ? p + d : p;
    const wrong = [p, k, p + d, p - d, 2 * d, p + k].filter((v) => v !== ans && v >= 0);
    return {
      prompt: `A practice throw follows ${f}, in meters. ${ask === "max" ? "What is its greatest height?" : ask === "land" ? "How far from you does it land (h = 0, the far zero)?" : "How far across is its highest point?"}`,
      ...textQ(`${ans} m`, wrong.map((v) => `${v} m`)),
      preset: { angle: aim.angle },
      explanation:
        ask === "max"
          ? `In vertex form a(x − h)² + k the vertex is (${p}, ${k}): the greatest height is ${k} m.`
          : ask === "vx"
            ? `The vertex of a(x − h)² + k is at x = h = ${p} m.`
            : `Set h(x) = 0: (x − ${p})² = ${k} × ${x} = ${d * d}, so x − ${p} = ±${d}. The far zero is x = ${p + d} m.`,
      diagram: { t: "parabola", p, d, k, mark: ask === "max" || ask === "vx" ? "vertex" : "land" },
      meta: { d, k, x, p, ask, ans },
    };
  },
};

const ZERO_SET: [number, number][] = [[20, 5], [20, 10], [40, 10], [40, 20], [40, 8], [60, 20], [60, 15], [80, 20], [80, 40], [60, 30]];
const hZeros: Gen = {
  id: "h-zeros",
  standard: "NC.M1.F-IF.7",
  skill: "Zeros and vertex of a quadratic",
  grades: ["9", "10", "11", "12"],
  weight: 2,
  make(c) {
    const [L, m] = c.rng.pick(ZERO_SET.filter(([l, mm]) => (l * l) % (4 * mm) === 0));
    const top = (L * L) / (4 * m);
    const ask = c.rng.pick(["land", "max", "axis"] as const);
    const aim = bestAim(c.lv, c.target);
    const ans = ask === "land" ? L : ask === "max" ? top : L / 2;
    return {
      prompt: `A balloon's path is h(x) = −(1/${m})·x(x − ${L}) meters. ${ask === "land" ? "Where does it land (the other zero)?" : ask === "max" ? "What is its greatest height?" : "Where is its axis of symmetry?"}`,
      ...textQ(ask === "axis" ? `x = ${ans}` : `${ans} m`, (ask === "axis" ? [L, top, m] : [L / 2, top === ans ? L : top, m, L * 2, top * 2]).filter((v) => v !== ans).map((v) => (ask === "axis" ? `x = ${v}` : `${v} m`))),
      preset: { angle: aim.angle },
      explanation: `The zeros are x = 0 and x = ${L}. The vertex is halfway, at x = ${L / 2}, where h = −(1/${m})(${L / 2})(${L / 2} − ${L}) = ${top} m.`,
      diagram: { t: "parabola", p: L / 2, d: L / 2, k: top, mark: ask === "max" || ask === "axis" ? "vertex" : "zeros" },
      meta: { L, m, ask, ans },
    };
  },
};

/** Nearest-degree angle whose trig ratio matches whole-number sides. */
export function trigSides(a: number, fn: "tan" | "sin" | "cos", rng: Rng): [number, number] | null {
  for (const n of rng.shuffle(Array.from({ length: 21 }, (_, i) => i + 6))) {
    const r = d2r(a);
    if (fn === "tan") {
      const rise = Math.round(n * Math.tan(r));
      if (rise >= 2 && rise <= 60 && Math.round(r2d(Math.atan2(rise, n))) === a) return [rise, n];
    } else {
      const hyp = n + 6;
      const side = Math.round(hyp * (fn === "sin" ? Math.sin(r) : Math.cos(r)));
      if (side >= 2 && side < hyp && Math.round(r2d(fn === "sin" ? Math.asin(side / hyp) : Math.acos(side / hyp))) === a) return [side, hyp];
    }
  }
  return null;
}
const hTrig: Gen = {
  id: "h-trig",
  standard: "NC.M2.G-SRT.8",
  skill: "Right-triangle trigonometry",
  grades: ["10", "11", "12"],
  weight: 4,
  make(c) {
    const as = c.rng.shuffle(anglesIn(c, 15, 75));
    const fn = c.rng.pick(["tan", "sin", "cos"] as const);
    for (const a of as) {
      const s = trigSides(a, fn, c.rng);
      if (!s) continue;
      const [p, q] = s;
      const val = (f: (x: number) => number, x: number) => (x <= 1 ? Math.round(r2d(f(x))) : NaN);
      let prompt: string;
      let wrong: number[];
      let expl: string;
      let diagram: Diagram;
      if (fn === "tan") {
        prompt = `The launch ramp rises ${p} m over a run of ${q} m. Aim along the ramp: what angle is it (nearest degree)?`;
        wrong = [Math.round(r2d(Math.atan2(q, p))), val(Math.asin, p / q), a + 3, a - 3];
        expl = `tan θ = opposite/adjacent = ${p}/${q}, so θ = tan⁻¹(${p}/${q}) ≈ ${a}°.`;
        diagram = { t: "right", run: q, rise: p, lRun: `${q} m`, lRise: `${p} m`, lHyp: "", lAngle: "θ" };
      } else if (fn === "sin") {
        prompt = `A ${q} m support pole leans from the launcher; its top is ${p} m above the ground. Aim along it: the angle with the ground (nearest degree)?`;
        wrong = [val(Math.acos, p / q), Math.round(r2d(Math.atan2(p, q))), a + 3, a - 3];
        expl = `sin θ = opposite/hypotenuse = ${p}/${q}, so θ = sin⁻¹(${p}/${q}) ≈ ${a}°.`;
        diagram = { t: "right", run: Math.sqrt(q * q - p * p), rise: p, lRun: "", lRise: `${p} m`, lHyp: `${q} m`, lAngle: "θ" };
      } else {
        prompt = `A ${q} m launch rail reaches ${p} m across the ground from its foot. Aim along it: the angle with the ground (nearest degree)?`;
        wrong = [val(Math.asin, p / q), Math.round(r2d(Math.atan2(p, q))), a + 3, a - 3];
        expl = `cos θ = adjacent/hypotenuse = ${p}/${q}, so θ = cos⁻¹(${p}/${q}) ≈ ${a}°.`;
        diagram = { t: "right", run: p, rise: Math.sqrt(q * q - p * p), lRun: `${p} m`, lRise: "", lHyp: `${q} m`, lAngle: "θ" };
      }
      return { prompt, ...angleQ(a, wrong), hideAngle: true, explanation: expl, diagram, meta: { fn, p, q, a } };
    }
    return null;
  },
};

const hPair: Gen = {
  id: "h-pair",
  standard: "NC.M2.F-IF.4",
  skill: "Projectile model: angle and speed",
  grades: ["10", "11", "12"],
  weight: 4,
  make(c) {
    const lv = c.lv;
    if (lv.wind !== 0) return null;
    const t = T(lv, c.target);
    const g = PLANETS[lv.planet].g;
    const box = hitBox(t);
    const X = Math.round((t.x - lv.launch.x) / S);
    const Y = Math.round((lv.launch.y - (box.y + box.h / 2)) / S);
    const tol = box.h / 2 / S + 1.2;
    const world = worldOf(lv);
    const base = shotBase(lv);
    const misses = (an: number, pw: number) => {
      const r = simulate(world, { ...base, angle: an, power: pw }, { record: false });
      const y = heightAt(X, speedOf(pw, lv.planet), an, g);
      return !(r.end.kind === "target" && r.end.target === t.i) && Math.abs(y - Y) > 2.5 * tol;
    };
    for (const a of c.rng.shuffle(goodAngles(lv, c.target).filter((x) => x >= 20 && x <= 75))) {
      const pw = powerFor(lv, c.target, a);
      if (pw === null) continue;
      const y = heightAt(X, speedOf(pw, lv.planet), a, g);
      if (Math.abs(y - Y) > tol) continue;
      const cands: [number, number][] = c.rng.shuffle([
        [a + 8, pw], [a - 8, pw], [a, pw + 10], [a, pw - 10], [90 - a, pw], [a + 12, pw - 8], [a - 10, pw + 8],
      ] as [number, number][]).filter(([an, p], k, all) => all.findIndex((o) => o[0] === an && o[1] === p) === k && an >= 5 && an <= 85 && p >= 10 && p <= 100 && misses(an, p));
      if (cands.length < 3) continue;
      const vals: [number, number][] = [[a, pw], ...cands.slice(0, 3)];
      const txt = (v: [number, number]) => `${v[0]}°, ${speedText(v[1], lv.planet)} m/s`;
      return {
        prompt: `No wind${lv.planet !== "earth" ? ` on ${PLANETS[lv.planet].name === "MOON" ? "the Moon" : "Mars"}` : ""}: g = ${g} m/s². The ${targetName(t)} is ${X} m across and ${Math.abs(Y)} m ${Y >= 0 ? "up" : "down"} (y = ${Y < 0 ? "−" : ""}${Math.abs(Y)}). Which launch passes through it? y = x·tanθ − g·x²/(2v²cos²θ)`,
        choices: vals.map(txt),
        answer: 0,
        effect: { type: "pair", values: vals },
        hideAngle: true,
        explanation: `Put x = ${X}: ${txt([a, pw])} gives y ≈ ${y < 0 ? "−" : ""}${Math.abs(y).toFixed(1)} m: inside the ${targetName(t)} (about ${Math.abs(Y)} m ${Y >= 0 ? "up" : "down"}). The others pass far too high or too low there.`,
        diagram: { t: "shot", X, Y, angle: a },
        meta: { X, Y, g, tol, vals: vals.map(([an, p]) => [an, speedOf(p, lv.planet)]) },
      };
    }
    return null;
  },
};

const hVolume: Gen = {
  id: "h-volume",
  standard: "NC.M3.G-GMD.3",
  skill: "Volume formulas",
  grades: ["9", "10", "11", "12"],
  weight: 5,
  make(c) {
    if (!c.lv.targets.some((t) => t.tank)) return null;
    const q = pickFrom(c, containerTmpls(c, "m"));
    if (q) q.icons = c.lv.targets.map((t) => (t.tank ? ({ t: "tank", tank: t.tank, unit: "m", labels: true } as Diagram) : iconOf(t)));
    return q;
  },
};

const hCavalieri: Gen = {
  id: "h-cavalieri",
  standard: "NC.M3.G-GMD.1",
  skill: "Cavalieri's principle",
  grades: ["11", "12"],
  make(c) {
    const r = c.rng.int(2, 5);
    const h = c.rng.int(3, 9);
    const aim = bestAim(c.lv, c.target);
    const v = r * r * h;
    return {
      prompt: `A slanted (oblique) water tank is a cylinder with radius ${r} m and height ${h} m. What is its volume?`,
      ...textQ(`${v}π m³`, [`${(v / 3) % 1 ? 2 * r * h : v / 3}π m³`, `${2 * r * h}π m³`, `${2 * v}π m³`, `${r * h}π m³`]),
      preset: { angle: aim.angle },
      explanation: `Cavalieri: every level slice is the same circle (area ${r * r}π) as an upright cylinder's, at the same height, so the volumes match: πr²h = ${v}π m³.`,
      diagram: { t: "cav", r, h },
      meta: { r, h, v },
    };
  },
};

const SPINS: { shape: "rect" | "tri" | "semi"; text: string; ans: string }[] = [
  { shape: "rect", text: "a rectangle around one of its sides", ans: "Cylinder" },
  { shape: "tri", text: "a right triangle around one of its legs", ans: "Cone" },
  { shape: "semi", text: "a half-circle around its straight edge (the diameter)", ans: "Sphere" },
];
const hSpin: Gen = {
  id: "h-spin",
  standard: "NC.M3.G-GMD.4",
  skill: "Solids made by rotating shapes",
  grades: ["11", "12"],
  make(c) {
    const s = c.rng.pick(SPINS);
    const aim = bestAim(c.lv, c.target);
    return {
      prompt: `Spin ${s.text}. What solid does it sweep out?`,
      ...textQ(s.ans, ["Cylinder", "Cone", "Sphere", "Pyramid"].filter((x) => x !== s.ans)),
      preset: { angle: aim.angle },
      explanation: s.ans === "Cylinder" ? "The far side sweeps a circle, making a cylinder." : s.ans === "Cone" ? "The slanted side sweeps from a point out to a circle: a cone." : "Every point is the same distance from the center: a sphere.",
      diagram: { t: "spin", shape: s.shape },
      meta: { shape: s.shape, ans: s.ans },
    };
  },
};
const hSection = sectionGen("h-section", "NC.M3.G-GMD.4", ["11", "12"], SECTION_POOL);

const hDensity: Gen = {
  id: "h-density",
  standard: "NC.M3.G-MG.2",
  skill: "Density in modeling",
  grades: ["11", "12"],
  make(c) {
    const aim = bestAim(c.lv, c.target);
    const l = c.rng.int(1, 4);
    const w = c.rng.int(1, 3);
    const h = c.rng.int(1, 3);
    const v = l * w * h;
    return {
      prompt: `A rooftop tank is ${l} m × ${w} m × ${h} m, full of water (density 1,000 kg/m³). What is the water's mass?`,
      ...textQ(`${(v * 1000).toLocaleString("en-US")} kg`, [`${v} kg`, `${(v * 100).toLocaleString("en-US")} kg`, `${(v * 10000).toLocaleString("en-US")} kg`]),
      preset: { angle: aim.angle },
      explanation: `Volume = ${l} × ${w} × ${h} = ${v} m³; mass = density × volume = 1,000 × ${v} = ${(v * 1000).toLocaleString("en-US")} kg.`,
      meta: { v },
    };
  },
};

// ------------------------------------------------------------------ catalog

export const GENS: Gen[] = [
  kName, kFlat, kCompare, kPosition, g1Attr, partsGen("1"), partsGen("2"), turnGen("1"), turnGen("2"), g2Solid, g2Poly, k2Power,
  g3Quad, g3Perim, g3Area, g3Right,
  g4Protractor, g4Classify, g4Turn, g4Add, g4Units,
  g5Coord, g5Word, g5Volume, g5Cubes, g5Units,
  g6Area, g6Corner, g6Side, g6Surface, g6Net, g6FracVol,
  g7CompSupp, g7Vertical, g7Equation, g7Scale, g7Section, g7Volume,
  g8Pyth, g8Dist, g8Parallel, g8Triangle, g8Reflect, g8Slope, g8Volume,
  hVertex, hZeros, hTrig, hPair, hVolume, hCavalieri, hSpin, hSection, hDensity,
];

export function gensFor(g: Grade): Gen[] {
  return GENS.filter((x) => x.grades.includes(g));
}

/** Shuffle a question's choices (not pick questions: A-D are the targets). */
function shuffleQ(q: ShotQ, rng: Rng): ShotQ {
  if (q.effect.type === "pick") return q;
  const order = rng.shuffle([0, 1, 2, 3]);
  const eff = q.effect;
  const out: ShotQ = { ...q, choices: order.map((i) => q.choices[i]), answer: order.indexOf(q.answer) };
  if (eff.type === "angle") out.effect = { type: "angle", values: order.map((i) => eff.values[i]) };
  if (eff.type === "pair") out.effect = { type: "pair", values: order.map((i) => eff.values[i]) };
  if (eff.type === "power") out.effect = { type: "power", values: order.map((i) => eff.values[i]) };
  return out;
}

/**
 * The next shot question for grade `g`. `avoid` lowers the chance of repeating a generator.
 * K-2 questions pre-set the safest aim (so a right answer plus the full guide line lands it).
 */
export function nextQuestion(c: Ctx, avoid: string[] = []): ShotQ {
  const gens = gensFor(c.grade);
  for (let tries = 0; tries < 30; tries++) {
    const weights = gens.map((x) => (x.weight ?? 1) * (avoid.includes(x.id) ? 0.25 : 1));
    let r = c.rng() * weights.reduce((a, b) => a + b, 0);
    let gen = gens[gens.length - 1];
    for (let i = 0; i < gens.length; i++) {
      r -= weights[i];
      if (r <= 0) {
        gen = gens[i];
        break;
      }
    }
    let d: Draft | null = null;
    try {
      d = gen.make(c);
    } catch {
      d = null;
    }
    if (!d) continue;
    const target = d.target ?? c.target;
    const q: ShotQ = { ...d, gen: gen.id, standard: gen.standard, skill: gen.skill, target };
    if (bandOf(c.grade) === "K2" && q.effect.type !== "power" && q.effect.type !== "pick") {
      const aim = bestAim(c.lv, target);
      q.preset = { angle: aim.angle, power: aim.power };
    }
    return shuffleQ(q, c.rng);
  }
  // Fallback (should not happen): a protractor-style confirm question.
  const aim = bestAim(c.lv, c.target);
  return {
    gen: "fallback",
    standard: "NC.4.MD.6",
    skill: "Measure angles",
    prompt: `Your launcher is set to ${aim.angle}°. Is that angle acute, right or obtuse?`,
    ...textQ("Acute", ["Right", "Obtuse", "Straight"]),
    explanation: `${aim.angle}° is less than 90°, so it is acute.`,
    target: c.target,
    preset: { angle: aim.angle },
    meta: {},
  };
}

export { GROUND_Y };
