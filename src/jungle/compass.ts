/*
 * The jungle crossroads: a compass rose (north is up, as on a map) and four exits.
 *   NORTH = the rope ladder climbing up into the canopy
 *   SOUTH = the trapdoor with a ladder going down
 *   WEST  = the trail off the left edge
 *   EAST  = the trail off the right edge
 * Letters A–D are dealt to the exits at random each time, so the answer is never
 * "always press B". Pure (no DOM): the test checks every direction resolves correctly.
 */
import { GROUND, W } from "./physics";

export type Dir = "N" | "E" | "S" | "W";
export const DIRS: Dir[] = ["N", "E", "S", "W"];
export const DIR_NAME: Record<Dir, string> = { N: "NORTH", E: "EAST", S: "SOUTH", W: "WEST" };
/** Screen vector for each direction (y grows downward on screen). */
export const DIR_VEC: Record<Dir, [number, number]> = { N: [0, -1], E: [1, 0], S: [0, 1], W: [-1, 0] };
export const OPPOSITE: Record<Dir, Dir> = { N: "S", S: "N", E: "W", W: "E" };

/** Compass rose centre on the 320×200 screen (a stone plaque hung on the rope ladder). */
export const ROSE = { x: 160, y: 70, r: 20 };

/** x (centre) of the rope ladder up (north) and the trapdoor down (south); both sit under the rose. */
export const CENTER_X = 160;
export const HATCH_W = 16;

/** Where each exit is and how the explorer takes it. */
export const EXITS: Record<Dir, { x: number; y: number; how: string }> = {
  N: { x: CENTER_X, y: 6, how: "climb the rope ladder UP" },
  S: { x: CENTER_X, y: GROUND + 20, how: "go DOWN through the trapdoor" },
  W: { x: 0, y: GROUND - 10, how: "walk off the LEFT edge" },
  E: { x: W, y: GROUND - 10, how: "walk off the RIGHT edge" },
};

/** Sign boards: where each exit's A–D sign stands (left x, top y, width, height). */
export const SIGNS: Record<Dir, { x: number; y: number; w: number; h: number }> = {
  N: { x: 178, y: 14, w: 50, h: 24 },
  S: { x: 178, y: 118, w: 50, h: 24 },
  W: { x: 4, y: 100, w: 50, h: 24 },
  E: { x: 266, y: 100, w: 50, h: 24 },
};
/** Sign text must fit this many pixels wide, on at most two lines. */
export const SIGN_TEXT_W = 46;

/** A random deal of letters: letters[i] is the exit for letter i (A–D). */
export function dealLetters(rnd: () => number = Math.random): Dir[] {
  const d = [...DIRS];
  for (let i = d.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [d[i], d[j]] = [d[j], d[i]];
  }
  return d;
}

/** Which direction an exit really lies in, measured from the compass rose on screen. */
export function exitDirection(d: Dir): Dir {
  const e = EXITS[d];
  const dx = e.x - ROSE.x;
  const dy = e.y - ROSE.y;
  if (Math.abs(dx) > Math.abs(dy)) return dx > 0 ? "E" : "W";
  return dy > 0 ? "S" : "N";
}
