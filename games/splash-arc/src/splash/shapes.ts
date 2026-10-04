/*
 * Shape facts for Splash Arc: 2-D shapes as integer vertex lists (so right angles and
 * parallel sides are decided exactly), 3-D solids with their faces/edges/vertices,
 * volumes, surface areas and cross-sections. The question generators and the renderer use
 * these; scripts/check-game.ts recomputes them independently.
 */

export type Pt = [number, number];

// ------------------------------------------------------------------ 2-D shapes

export type Shape2D =
  | "circle"
  | "triangle"
  | "square"
  | "rectangle"
  | "pentagon"
  | "hexagon"
  | "rhombus"
  | "parallelogram"
  | "trapezoid"
  | "rightTrapezoid"
  | "kite";

/** Vertices (counter-clockwise, y up) on an integer grid; a circle has none. */
export const SHAPE_VERTS: Record<Shape2D, Pt[]> = {
  circle: [],
  triangle: [[0, 0], [6, 0], [3, 5]],
  square: [[0, 0], [4, 0], [4, 4], [0, 4]],
  rectangle: [[0, 0], [7, 0], [7, 3], [0, 3]],
  pentagon: [[1, 0], [5, 0], [6, 3], [3, 6], [0, 3]],
  hexagon: [[2, 0], [5, 0], [7, 3], [5, 6], [2, 6], [0, 3]],
  rhombus: [[0, 0], [5, 0], [8, 4], [3, 4]],
  parallelogram: [[0, 0], [5, 0], [7, 3], [2, 3]],
  trapezoid: [[0, 0], [7, 0], [5, 3], [2, 3]],
  rightTrapezoid: [[0, 0], [6, 0], [4, 3], [0, 3]],
  kite: [[3, 0], [6, 4], [3, 6], [0, 4]],
};

export const SHAPE_NAME: Record<Shape2D, string> = {
  circle: "circle",
  triangle: "triangle",
  square: "square",
  rectangle: "rectangle",
  pentagon: "pentagon",
  hexagon: "hexagon",
  rhombus: "rhombus",
  parallelogram: "parallelogram",
  trapezoid: "trapezoid",
  rightTrapezoid: "right trapezoid",
  kite: "kite",
};

const sub = (a: Pt, b: Pt): Pt => [a[0] - b[0], a[1] - b[1]];
const dot = (a: Pt, b: Pt) => a[0] * b[0] + a[1] * b[1];
const cross = (a: Pt, b: Pt) => a[0] * b[1] - a[1] * b[0];

export interface Attrs2D {
  sides: number;
  corners: number;
  rightAngles: number;
  allSidesEqual: boolean;
  parallelPairs: number;
  curved: boolean;
}

export function attrs2D(shape: Shape2D): Attrs2D {
  const v = SHAPE_VERTS[shape];
  if (!v.length) return { sides: 0, corners: 0, rightAngles: 0, allSidesEqual: false, parallelPairs: 0, curved: true };
  const n = v.length;
  const edges = v.map((p, i) => sub(v[(i + 1) % n], p));
  const len2 = edges.map((e) => dot(e, e));
  let right = 0;
  for (let i = 0; i < n; i++) if (dot(edges[i], edges[(i + n - 1) % n]) === 0) right++;
  let par = 0;
  for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) if (cross(edges[i], edges[j]) === 0) par++;
  return { sides: n, corners: n, rightAngles: right, allSidesEqual: len2.every((l) => l === len2[0]), parallelPairs: par, curved: false };
}

/** Shoelace area of a polygon. */
export function polyArea(v: Pt[]): number {
  let s = 0;
  for (let i = 0; i < v.length; i++) s += cross(v[i], v[(i + 1) % v.length]);
  return Math.abs(s) / 2;
}

// ------------------------------------------------------------------ parts (halves, thirds, fourths)

export type Parts = "halves" | "thirds" | "fourths" | "unequal2" | "unequal3" | "unequal4";
export const PARTS_INFO: Record<Parts, { count: number; equal: boolean; name: string }> = {
  halves: { count: 2, equal: true, name: "halves" },
  thirds: { count: 3, equal: true, name: "thirds" },
  fourths: { count: 4, equal: true, name: "fourths" },
  unequal2: { count: 2, equal: false, name: "2 parts that are not equal" },
  unequal3: { count: 3, equal: false, name: "3 parts that are not equal" },
  unequal4: { count: 4, equal: false, name: "4 parts that are not equal" },
};
/** Cut directions for a disc of a given part style: sector boundary angles in degrees (from 12 o'clock, clockwise). */
export const PART_CUTS: Record<Parts, number[]> = {
  halves: [0, 180],
  thirds: [0, 120, 240],
  fourths: [0, 90, 180, 270],
  unequal2: [30, 120], // a 90° slice and a 270° slice
  unequal3: [0, 60, 150],
  unequal4: [0, 40, 100, 200],
};
/** Fraction of the whole for each part (sector sizes / 360). */
export function partSizes(p: Parts): number[] {
  const c = PART_CUTS[p];
  return c.map((a, i) => (((c[(i + 1) % c.length] - a + 360) % 360) || 360) / 360);
}

// ------------------------------------------------------------------ 3-D solids

export type Solid = "cube" | "prism" | "triprism" | "pyramid" | "cylinder" | "cone" | "sphere";

export const SOLID_NAME: Record<Solid, string> = {
  cube: "cube",
  prism: "rectangular prism",
  triprism: "triangular prism",
  pyramid: "square pyramid",
  cylinder: "cylinder",
  cone: "cone",
  sphere: "sphere",
};
/** Kid names for K–2 (the thing in the picture). */
export const SOLID_KID: Record<Solid, string> = {
  cube: "cube crate",
  prism: "box (rectangular prism)",
  triprism: "tent (triangular prism)",
  pyramid: "pyramid",
  cylinder: "cylinder barrel",
  cone: "cone",
  sphere: "sphere ball",
};

export interface SolidFacts {
  /** Flat faces. */
  faces: number;
  /** Straight edges (polyhedra only). */
  edges: number;
  vertices: number;
  curved: boolean;
  rolls: boolean;
  /** True for polyhedra (all faces flat polygons). */
  polyhedron: boolean;
  allSquareFaces: boolean;
  apex: boolean;
}

export const SOLID_FACTS: Record<Solid, SolidFacts> = {
  cube: { faces: 6, edges: 12, vertices: 8, curved: false, rolls: false, polyhedron: true, allSquareFaces: true, apex: false },
  prism: { faces: 6, edges: 12, vertices: 8, curved: false, rolls: false, polyhedron: true, allSquareFaces: false, apex: false },
  triprism: { faces: 5, edges: 9, vertices: 6, curved: false, rolls: false, polyhedron: true, allSquareFaces: false, apex: false },
  pyramid: { faces: 5, edges: 8, vertices: 5, curved: false, rolls: false, polyhedron: true, allSquareFaces: false, apex: true },
  cylinder: { faces: 2, edges: 0, vertices: 0, curved: true, rolls: true, polyhedron: false, allSquareFaces: false, apex: false },
  cone: { faces: 1, edges: 0, vertices: 0, curved: true, rolls: true, polyhedron: false, allSquareFaces: false, apex: true },
  sphere: { faces: 0, edges: 0, vertices: 0, curved: true, rolls: true, polyhedron: false, allSquareFaces: false, apex: false },
};

// ------------------------------------------------------------------ cross-sections

export type Cut = "level" | "upright";
export type Section = "square" | "rectangle" | "triangle" | "circle";
/**
 * Cross-section of a solid sitting on its base. "level" = a flat cut parallel to the base;
 * "upright" = a straight-down cut through the middle (through the apex/axis), parallel to a
 * front face. The triangular prism lies on a rectangular face with its triangles at the ends,
 * so an upright cut parallel to the ends is a triangle. The rectangular prism used here is
 * 6 long × 3 deep × 4 tall (so no cut is a square by accident).
 */
export const SECTION: Record<Solid, Record<Cut, Section>> = {
  cube: { level: "square", upright: "square" },
  prism: { level: "rectangle", upright: "rectangle" },
  triprism: { level: "rectangle", upright: "triangle" },
  pyramid: { level: "square", upright: "triangle" },
  cylinder: { level: "circle", upright: "rectangle" },
  cone: { level: "circle", upright: "triangle" },
  sphere: { level: "circle", upright: "circle" },
};

// ------------------------------------------------------------------ containers & tanks

/** A container target with measurements in units (or metres / cm for older grades). */
export type Tank =
  | { kind: "box"; l: number; w: number; h: number }
  | { kind: "step"; l1: number; h1: number; l2: number; h2: number; w: number }
  | { kind: "tri"; b: number; th: number; len: number }
  | { kind: "cylinder"; r: number; h: number }
  | { kind: "cone"; r: number; h: number }
  | { kind: "sphere"; r: number }
  | { kind: "pyramid"; s: number; h: number };

/** Volume, as a plain number (π factored out for round solids: see `hasPi`). */
export function tankVolume(t: Tank): number {
  switch (t.kind) {
    case "box":
      return t.l * t.w * t.h;
    case "step":
      return t.w * (t.l1 * t.h1 + t.l2 * t.h2);
    case "tri":
      return (t.b * t.th * t.len) / 2;
    case "cylinder":
      return t.r * t.r * t.h;
    case "cone":
      return (t.r * t.r * t.h) / 3;
    case "sphere":
      return (4 * t.r ** 3) / 3;
    case "pyramid":
      return (t.s * t.s * t.h) / 3;
  }
}
export function hasPi(t: Tank): boolean {
  return t.kind === "cylinder" || t.kind === "cone" || t.kind === "sphere";
}
/** Surface area of a box. */
export function boxSurface(l: number, w: number, h: number): number {
  return 2 * (l * w + l * h + w * h);
}

/** "7½", "12", "2¼" style numbers (halves and quarters only). */
export function frac(v: number): string {
  const whole = Math.floor(v + 1e-9);
  const rest = Math.round((v - whole) * 4);
  const tail = ["", "¼", "½", "¾"][rest];
  if (rest === 4) return String(whole + 1);
  return whole === 0 && tail ? tail : `${whole}${tail}`;
}

export function tankDims(t: Tank, u = ""): string {
  const f = (v: number) => `${frac(v)}${u}`;
  switch (t.kind) {
    case "box":
      return `${f(t.l)} × ${f(t.w)} × ${f(t.h)}`;
    case "step":
      return `${t.l1}×${t.w}×${t.h1} + ${t.l2}×${t.w}×${t.h2}`;
    case "tri":
      return `base ${f(t.b)}, height ${f(t.th)}, length ${f(t.len)}`;
    case "cylinder":
      return `r = ${f(t.r)}, h = ${f(t.h)}`;
    case "cone":
      return `r = ${f(t.r)}, h = ${f(t.h)}`;
    case "sphere":
      return `r = ${f(t.r)}`;
    case "pyramid":
      return `base ${f(t.s)} × ${f(t.s)}, h = ${f(t.h)}`;
  }
}

/** Formats a volume: "24", "7½", "36π". */
export function volumeText(t: Tank): string {
  const v = tankVolume(t);
  if (hasPi(t)) return `${frac(v)}π`;
  return frac(v);
}
