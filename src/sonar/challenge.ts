/*
 * Coordinate challenges: now and then the HUD names the spot to fire at in a math way.
 * Firing at the right spot earns bonus points and counts toward the coordinate skill in
 * the report. Pure (no DOM); scripts/check-game.ts re-checks every kind's math.
 *
 * K-4: "Admiral's call": fire at a named spot ("Crab 4", "C7").
 * 5:   name an ordered pair; start at a point and move right/up.
 * 6-7: four-quadrant points; reflections over an axis; units left/right/up/down;
 *      the fourth corner of a rectangle; a point in a quadrant a distance from both axes.
 * 8:   reflections, translations by a rule, 180-degree rotations, rectangle corners.
 * 9-12: midpoints, 90-degree rotations about the origin, reflection over y = x, translations.
 */
import { gradeNumber } from "@/kit/grades";
import type { Grade } from "@/kit/types";
import type { Coord, Rng } from "./core";
import { MINUS, axisRange, formatCoord, fromXY, num, pair, schemeFor, spokenCoord, toXY, type Scheme } from "./notation";

export type ChallengeKind =
  | "call"
  | "move"
  | "reflectX"
  | "reflectY"
  | "shift"
  | "rectangle"
  | "quadrant"
  | "translate"
  | "rotate180"
  | "rotate90"
  | "reflectYX"
  | "midpoint";

export interface Challenge {
  kind: ChallengeKind;
  text: string;
  spoken: string;
  /** The spot to fire at. */
  target: Coord;
  /** x, y of the answer (plane grades) for checking. */
  answer: { x: number; y: number };
  /** The numbers the question was built from (points as [x, y], or moves). */
  given: number[][];
  standard: string;
  skill: string;
  /** Why the answer is right, shown afterwards. */
  explain: string;
}

/** NC standard for reading a plain coordinate at each grade (see README for the uncertain ones). */
export function callStandard(g: Grade): { standard: string; skill: string } {
  const n = gradeNumber(g);
  if (n <= 2) return { standard: "NC.K.G.1", skill: "Find a spot by row and column" };
  if (n === 3) return { standard: "3.G.1", skill: "Map grids: letter-number locations" };
  if (n === 4) return { standard: "4.G.1", skill: "Map grids: letter-number locations" };
  if (n === 5) return { standard: "NC.5.G.1", skill: "Ordered pairs in the first quadrant" };
  return { standard: "NC.6.NS.6", skill: "Points in all four quadrants" };
}

export function kindsFor(g: Grade): ChallengeKind[] {
  const n = gradeNumber(g);
  if (n <= 4) return ["call"];
  if (n === 5) return ["call", "move", "move"];
  if (n <= 7) return ["call", "reflectX", "reflectY", "shift", "rectangle", "quadrant"];
  if (n === 8) return ["reflectX", "reflectY", "translate", "rotate180", "rectangle"];
  return ["midpoint", "rotate90", "reflectYX", "translate", "midpoint"];
}

const STD: Record<Exclude<ChallengeKind, "call">, (n: number) => { standard: string; skill: string }> = {
  move: () => ({ standard: "NC.5.G.1", skill: "Moving on the coordinate grid" }),
  reflectX: (n) => (n >= 8 ? { standard: "NC.8.G.3", skill: "Reflections with coordinates" } : { standard: "NC.6.NS.6", skill: "Reflecting a point over an axis" }),
  reflectY: (n) => (n >= 8 ? { standard: "NC.8.G.3", skill: "Reflections with coordinates" } : { standard: "NC.6.NS.6", skill: "Reflecting a point over an axis" }),
  shift: () => ({ standard: "NC.6.NS.8", skill: "Distance along a grid line" }),
  rectangle: () => ({ standard: "NC.6.G.3", skill: "Polygon corners on the coordinate plane" }),
  quadrant: () => ({ standard: "NC.6.NS.6", skill: "Quadrants and signs of coordinates" }),
  translate: () => ({ standard: "NC.8.G.3", skill: "Translations with coordinates" }),
  rotate180: () => ({ standard: "NC.8.G.3", skill: "Rotations with coordinates" }),
  rotate90: () => ({ standard: "NC.M2.G-CO.2", skill: "Rotations as functions of (x, y)" }),
  reflectYX: () => ({ standard: "NC.M2.G-CO.2", skill: "Reflection over y = x" }),
  midpoint: () => ({ standard: "NC.M1.G-GPE.6", skill: "Midpoint of a segment" }),
};

const ri = (rng: Rng, lo: number, hi: number) => lo + Math.floor(rng() * (hi - lo + 1));
const signWord = (d: number, pos: string, neg: string) => `${Math.abs(d)} unit${Math.abs(d) === 1 ? "" : "s"} ${d >= 0 ? pos : neg}`;
const QUAD = ["I", "II", "III", "IV"];

interface Draft {
  ans: [number, number];
  given: number[][];
  text: string;
  explain: string;
}

/** Builds one challenge of `kind` (null if the random numbers did not fit; the caller retries). */
function draft(kind: ChallengeKind, s: Scheme, rng: Rng): Draft | null {
  const { min, max } = axisRange(s);
  const rp = (): [number, number] => [ri(rng, min, max), ri(rng, min, max)];
  const inR = (v: number) => v >= min && v <= max;
  switch (kind) {
    case "move": {
      const [x, y] = rp();
      const dx = ri(rng, 1, 4);
      const dy = ri(rng, 1, 4);
      const ans: [number, number] = [x + dx, y + dy];
      if (!inR(ans[0]) || !inR(ans[1])) return null;
      return {
        ans, given: [[x, y], [dx, dy]],
        text: `Start at ${pair(x, y)}. Move ${dx} right and ${dy} up. Fire!`,
        explain: `Add ${dx} to x and ${dy} to y: ${pair(x, y)} → ${pair(ans[0], ans[1])}.`,
      };
    }
    case "reflectX": {
      const [x, y] = rp();
      if (y === 0) return null;
      return {
        ans: [x, -y], given: [[x, y]],
        text: `Fire at the reflection of ${pair(x, y)} over the x-axis.`,
        explain: `Over the x-axis, x stays and y changes sign: ${pair(x, y)} → ${pair(x, -y)}.`,
      };
    }
    case "reflectY": {
      const [x, y] = rp();
      if (x === 0) return null;
      return {
        ans: [-x, y], given: [[x, y]],
        text: `Fire at the reflection of ${pair(x, y)} over the y-axis.`,
        explain: `Over the y-axis, y stays and x changes sign: ${pair(x, y)} → ${pair(-x, y)}.`,
      };
    }
    case "shift": {
      const [x, y] = rp();
      const d = ri(rng, 2, 6) * (rng() < 0.5 ? -1 : 1);
      const horiz = rng() < 0.5;
      const ans: [number, number] = horiz ? [x + d, y] : [x, y + d];
      if (!inR(ans[0]) || !inR(ans[1])) return null;
      const move = horiz ? signWord(d, "right", "left") : signWord(d, "up", "down");
      return {
        ans, given: [[x, y], horiz ? [d, 0] : [0, d]],
        text: `Fire at the point ${move} of ${pair(x, y)}.`,
        explain: horiz
          ? `Moving ${d > 0 ? "right" : "left"} changes only x: ${num(x)} ${d > 0 ? "+" : MINUS} ${Math.abs(d)} = ${num(ans[0])}, so ${pair(ans[0], ans[1])}.`
          : `Moving ${d > 0 ? "up" : "down"} changes only y: ${num(y)} ${d > 0 ? "+" : MINUS} ${Math.abs(d)} = ${num(ans[1])}, so ${pair(ans[0], ans[1])}.`,
      };
    }
    case "rectangle": {
      const x1 = ri(rng, min, max);
      const x2 = ri(rng, min, max);
      const y1 = ri(rng, min, max);
      const y2 = ri(rng, min, max);
      if (Math.abs(x1 - x2) < 2 || Math.abs(y1 - y2) < 2) return null;
      // Corners in order around the rectangle: A(x1,y1) B(x2,y1) C(x2,y2) D(x1,y2); D is missing.
      return {
        ans: [x1, y2], given: [[x1, y1], [x2, y1], [x2, y2]],
        text: `A rectangle has corners ${pair(x1, y1)}, ${pair(x2, y1)} and ${pair(x2, y2)}. Fire at the 4th corner.`,
        explain: `The missing corner shares its x with ${pair(x1, y1)} and its y with ${pair(x2, y2)}: ${pair(x1, y2)}.`,
      };
    }
    case "quadrant": {
      const q = ri(rng, 0, 3);
      const d = ri(rng, 1, max);
      const sx = q === 0 || q === 3 ? 1 : -1;
      const sy = q <= 1 ? 1 : -1;
      return {
        ans: [sx * d, sy * d], given: [[q + 1, d]],
        text: `Fire at the point in Quadrant ${QUAD[q]} that is ${d} unit${d === 1 ? "" : "s"} from both axes.`,
        explain: `In Quadrant ${QUAD[q]}, x is ${sx > 0 ? "positive" : "negative"} and y is ${sy > 0 ? "positive" : "negative"}: ${pair(sx * d, sy * d)}.`,
      };
    }
    case "translate": {
      const [x, y] = rp();
      let dx = ri(rng, -4, 4);
      let dy = ri(rng, -4, 4);
      if (dx === 0) dx = 2;
      if (dy === 0) dy = -3;
      const ans: [number, number] = [x + dx, y + dy];
      if (!inR(ans[0]) || !inR(ans[1])) return null;
      const term = (v: string, d: number) => `${v} ${d >= 0 ? "+" : MINUS} ${Math.abs(d)}`;
      return {
        ans, given: [[x, y], [dx, dy]],
        text: `Translate ${pair(x, y)} by the rule (x, y) → (${term("x", dx)}, ${term("y", dy)}). Fire at the image.`,
        explain: `(${num(x)} ${dx >= 0 ? "+" : MINUS} ${Math.abs(dx)}, ${num(y)} ${dy >= 0 ? "+" : MINUS} ${Math.abs(dy)}) = ${pair(ans[0], ans[1])}.`,
      };
    }
    case "rotate180": {
      const [x, y] = rp();
      if (x === 0 && y === 0) return null;
      return {
        ans: [-x, -y], given: [[x, y]],
        text: `Rotate ${pair(x, y)} 180° about the origin. Fire at the image.`,
        explain: `A 180° turn about the origin changes both signs: (x, y) → (${MINUS}x, ${MINUS}y), so ${pair(-x, -y)}.`,
      };
    }
    case "rotate90": {
      const [x, y] = rp();
      if (x === 0 && y === 0) return null;
      return {
        ans: [-y, x], given: [[x, y]],
        text: `Rotate ${pair(x, y)} 90° counterclockwise about the origin. Fire at the image.`,
        explain: `A 90° counterclockwise turn maps (x, y) → (${MINUS}y, x): ${pair(x, y)} → ${pair(-y, x)}.`,
      };
    }
    case "reflectYX": {
      const [x, y] = rp();
      if (x === y) return null;
      return {
        ans: [y, x], given: [[x, y]],
        text: `Reflect ${pair(x, y)} over the line y = x. Fire at the image.`,
        explain: `Reflecting over y = x swaps the coordinates: ${pair(x, y)} → ${pair(y, x)}.`,
      };
    }
    case "midpoint": {
      const [x1, y1] = rp();
      const [x2, y2] = rp();
      if ((x1 + x2) % 2 !== 0 || (y1 + y2) % 2 !== 0 || (x1 === x2 && y1 === y2)) return null;
      const ans: [number, number] = [(x1 + x2) / 2, (y1 + y2) / 2];
      return {
        ans, given: [[x1, y1], [x2, y2]],
        text: `Fire at the midpoint of the segment from ${pair(x1, y1)} to ${pair(x2, y2)}.`,
        explain: `Average the coordinates: ((${num(x1)} + ${num(x2)}) ÷ 2, (${num(y1)} + ${num(y2)}) ÷ 2) = ${pair(ans[0], ans[1])}.`,
      };
    }
    case "call":
      return null;
  }
}

/**
 * A challenge for this grade whose answer is a spot the player has not fired at
 * (`isOpen`), or null if none could be made.
 */
export function makeChallenge(g: Grade, rng: Rng, isOpen: (p: Coord) => boolean, kind?: ChallengeKind): Challenge | null {
  const s = schemeFor(g);
  const n = gradeNumber(g);
  const kinds = kindsFor(g);
  for (let t = 0; t < 200; t++) {
    const k = kind ?? kinds[Math.floor(rng() * kinds.length)];
    if (k === "call") {
      const size = s === "q4" ? 11 : 10;
      const p = { r: Math.floor(rng() * size), c: Math.floor(rng() * size) };
      if (!isOpen(p)) continue;
      const where = formatCoord(s, p);
      const { x, y } = toXY(s, p);
      return {
        kind: "call", target: p, answer: { x, y }, given: [[x, y]], ...callStandard(g),
        text: `Admiral's call: fire at ${where}!`,
        spoken: `Admiral's call: fire at ${spokenCoord(s, p)}!`,
        explain: s === "picture" ? `${where}: the ${where.split(" ")[0]} row, number ${p.c + 1}.` : s === "letters" ? `${where}: row ${where[0]}, column ${p.c + 1}.` : `${where}: x = ${num(x)}, y = ${num(y)}.`,
      };
    }
    const d = draft(k, s, rng);
    if (!d) continue;
    const target = fromXY(s, d.ans[0], d.ans[1]);
    if (!target || !isOpen(target)) continue;
    // Every point named in the question is on the board too.
    if (d.given.length && k !== "quadrant" && !d.given.filter((_, i) => k === "rectangle" || k === "midpoint" || i === 0).every(([x, y]) => fromXY(s, x, y))) continue;
    return {
      kind: k, target, answer: { x: d.ans[0], y: d.ans[1] }, given: d.given, ...STD[k](n),
      text: d.text, spoken: d.text.replace(/→/g, " goes to ").replace(/°/g, " degrees"), explain: d.explain,
    };
  }
  return null;
}
