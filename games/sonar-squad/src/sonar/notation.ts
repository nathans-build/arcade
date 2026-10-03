/*
 * How each grade names a spot on the board. Calling a shot means reading a coordinate.
 *
 *  - K-2 "picture": 10 rows of sea pictures (top to bottom) and columns 1-10: "Crab 4".
 *  - 3-4 "letters": rows A-J (top to bottom) and columns 1-10: "C7".
 *  - 5   "q1": the first quadrant. Spots are grid-line crossings, x and y from 0 to 9: "(3, 7)".
 *  - 6+  "q4": all four quadrants. Crossings from -5 to 5 on both axes (11 x 11): "(3, −2)".
 *
 * Internally a spot is (r, c) with row 0 at the top. Pure (no DOM), so tests can use it.
 */
import { gradeNumber } from "@/kit/grades";
import type { Grade } from "@/kit/types";
import type { Coord } from "./core";

export type Scheme = "picture" | "letters" | "q1" | "q4";

export function schemeFor(g: Grade): Scheme {
  const n = gradeNumber(g);
  return n <= 2 ? "picture" : n <= 4 ? "letters" : n === 5 ? "q1" : "q4";
}

export function boardSize(s: Scheme): number {
  return s === "q4" ? 11 : 10;
}

/** Spots on grid-line crossings (coordinate plane) rather than in squares. */
export const isPlane = (s: Scheme) => s === "q1" || s === "q4";

export const PICTURES = [
  { name: "Fish", color: "#ff9a3a" },
  { name: "Crab", color: "#e3262f" },
  { name: "Star", color: "#ffd23f" },
  { name: "Shell", color: "#ffb0d0" },
  { name: "Octopus", color: "#c070ff" },
  { name: "Turtle", color: "#5fff8a" },
  { name: "Whale", color: "#6ea0ff" },
  { name: "Duck", color: "#fff27a" },
  { name: "Boat", color: "#f2f4ff" },
  { name: "Anchor", color: "#9aa6c8" },
] as const;

export const LETTERS = "ABCDEFGHIJ";

/** Minus sign used in display (a real minus, not a hyphen). */
export const MINUS = "−";
export const num = (n: number) => (n < 0 ? `${MINUS}${-n}` : String(n));
export const pair = (x: number, y: number) => `(${num(x)}, ${num(y)})`;

/** Range of x and y on the plane schemes. */
export function axisRange(s: Scheme): { min: number; max: number } {
  return s === "q4" ? { min: -5, max: 5 } : { min: 0, max: 9 };
}

export function toXY(s: Scheme, p: Coord): { x: number; y: number } {
  if (s === "q4") return { x: p.c - 5, y: 5 - p.r };
  if (s === "q1") return { x: p.c, y: 9 - p.r };
  // Squares: x = column number (1-10), y = row number from the top (1-10).
  return { x: p.c + 1, y: p.r + 1 };
}

export function fromXY(s: Scheme, x: number, y: number): Coord | null {
  let p: Coord;
  if (s === "q4") p = { r: 5 - y, c: x + 5 };
  else if (s === "q1") p = { r: 9 - y, c: x };
  else p = { r: y - 1, c: x - 1 };
  const n = boardSize(s);
  return Number.isInteger(p.r) && Number.isInteger(p.c) && p.r >= 0 && p.c >= 0 && p.r < n && p.c < n ? p : null;
}

export function rowLabel(s: Scheme, r: number): string {
  if (s === "picture") return PICTURES[r].name;
  if (s === "letters") return LETTERS[r];
  return num(s === "q4" ? 5 - r : 9 - r);
}

export function colLabel(s: Scheme, c: number): string {
  if (s === "picture" || s === "letters") return String(c + 1);
  return num(s === "q4" ? c - 5 : c);
}

/** The spot in the grade's own notation: "Crab 4", "C7", "(3, 7)", "(3, −2)". */
export function formatCoord(s: Scheme, p: Coord): string {
  if (s === "picture") return `${PICTURES[p.r].name} ${p.c + 1}`;
  if (s === "letters") return `${LETTERS[p.r]}${p.c + 1}`;
  const { x, y } = toXY(s, p);
  return pair(x, y);
}

/** For read-aloud. */
export function spokenCoord(s: Scheme, p: Coord): string {
  if (s === "picture") return `${PICTURES[p.r].name} row, ${p.c + 1}`;
  if (s === "letters") return `${LETTERS[p.r]} ${p.c + 1}`;
  const { x, y } = toXY(s, p);
  const w = (n: number) => (n < 0 ? `negative ${-n}` : String(n));
  return `${w(x)}, ${w(y)}`;
}

/** Reads a typed coordinate in the grade's notation; null when it is not a spot on this board. */
export function parseCoord(s: Scheme, text: string): Coord | null {
  const t = text.trim().replace(/[−–—]/g, "-");
  if (s === "picture") {
    const m = /^([a-z]+)(?:\s+row)?[\s,]*(\d{1,2})$/i.exec(t);
    if (!m) return null;
    const r = PICTURES.findIndex((p) => p.name.toLowerCase() === m[1].toLowerCase());
    return r < 0 ? null : fromXY(s, Number(m[2]), r + 1);
  }
  if (s === "letters") {
    const m = /^([a-j])\s*(\d{1,2})$/i.exec(t);
    if (!m) return null;
    return fromXY(s, Number(m[2]), LETTERS.indexOf(m[1].toUpperCase()) + 1);
  }
  const m = /^\(?\s*(-?\d{1,2})\s*(?:,\s*|\s+)(-?\d{1,2})\s*\)?$/.exec(t);
  if (!m) return null;
  return fromXY(s, Number(m[1]), Number(m[2]));
}

/** What a kid types or taps to name a spot, for the help text. */
export function notationHelp(s: Scheme): string {
  switch (s) {
    case "picture":
      return "Find the picture row, then count across to the number.";
    case "letters":
      return "Letter row first, then the number column: C7 is row C, column 7.";
    case "q1":
      return "Ordered pair (x, y): go right x, then up y from (0, 0).";
    case "q4":
      return "Ordered pair (x, y): x left/right from the origin, then y up/down. Negatives go left or down.";
  }
}
