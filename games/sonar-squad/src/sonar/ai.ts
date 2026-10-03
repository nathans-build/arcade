/*
 * Computer opponents as pure functions of what the shooter can see (a TargetView).
 * Each returns the index of an UNKNOWN spot, so no level can ever fire off the board or
 * twice at the same spot (checked by scripts/check-game.ts).
 *
 *  - Easy: random, never repeats.
 *  - Medium ("hunt and target"): random until a hit, then tries the neighbours of the hit
 *    and follows the line until the ship sinks.
 *  - Hard ("probability map"): counts how many ways each remaining ship could still lie
 *    over every spot and fires at the most likely one.
 */
import { HIT, MISS, SUNK, UNKNOWN, idx, onBoard, type Rng, type TargetView } from "./core";

export type AiLevel = "easy" | "medium" | "hard";
export const AI_LEVELS: AiLevel[] = ["easy", "medium", "hard"];

export function unknownSpots(v: TargetView): number[] {
  const out: number[] = [];
  v.shots.forEach((m, i) => {
    if (m === UNKNOWN) out.push(i);
  });
  return out;
}

function pickRandom(list: number[], rng: Rng): number {
  if (!list.length) throw new Error("no open spots left");
  return list[Math.floor(rng() * list.length)];
}

export function easyShot(v: TargetView, rng: Rng): number {
  return pickRandom(unknownSpots(v), rng);
}

const DIRS: [number, number][] = [
  [0, 1],
  [1, 0],
  [0, -1],
  [-1, 0],
];

/** Open spots at both ends of every straight run of 2+ hits (longest runs first), else around single hits. */
export function targetCandidates(v: TargetView): number[] {
  const { size, shots } = v;
  const isHit = (r: number, c: number) => onBoard(size, r, c) && shots[idx(size, r, c)] === HIT;
  const isOpen = (r: number, c: number) => onBoard(size, r, c) && shots[idx(size, r, c)] === UNKNOWN;
  const lineEnds: { len: number; spots: number[] }[] = [];
  for (let r = 0; r < size; r++)
    for (let c = 0; c < size; c++) {
      if (!isHit(r, c)) continue;
      for (const [dr, dc] of [
        [0, 1],
        [1, 0],
      ]) {
        // Only start a run at its first spot.
        if (isHit(r - dr, c - dc) || !isHit(r + dr, c + dc)) continue;
        let len = 1;
        while (isHit(r + dr * len, c + dc * len)) len++;
        const spots: number[] = [];
        if (isOpen(r - dr, c - dc)) spots.push(idx(size, r - dr, c - dc));
        if (isOpen(r + dr * len, c + dc * len)) spots.push(idx(size, r + dr * len, c + dc * len));
        if (spots.length) lineEnds.push({ len, spots });
      }
    }
  if (lineEnds.length) {
    const best = Math.max(...lineEnds.map((l) => l.len));
    return [...new Set(lineEnds.filter((l) => l.len === best).flatMap((l) => l.spots))];
  }
  const around = new Set<number>();
  for (let r = 0; r < size; r++)
    for (let c = 0; c < size; c++) {
      if (!isHit(r, c)) continue;
      for (const [dr, dc] of DIRS) if (isOpen(r + dr, c + dc)) around.add(idx(size, r + dr, c + dc));
    }
  return [...around];
}

export function mediumShot(v: TargetView, rng: Rng): number {
  const cands = targetCandidates(v);
  return cands.length ? pickRandom(cands, rng) : easyShot(v, rng);
}

/**
 * Placement-count density: for every remaining ship length and every position that avoids
 * misses and sunk ships, add its weight to each open spot it covers. Positions that run
 * through unsunk hits weigh much more, so the map "targets" after a hit.
 */
export function densityMap(v: TargetView): number[] {
  const { size, shots } = v;
  const map = new Array(size * size).fill(0);
  for (const len of v.remaining) {
    for (const o of ["h", "v"] as const) {
      for (let r = 0; r < size; r++)
        for (let c = 0; c < size; c++) {
          const cells: number[] = [];
          let ok = true;
          let hits = 0;
          for (let k = 0; k < len; k++) {
            const rr = o === "h" ? r : r + k;
            const cc = o === "h" ? c + k : c;
            if (!onBoard(size, rr, cc)) {
              ok = false;
              break;
            }
            const i = idx(size, rr, cc);
            const m = shots[i];
            if (m === MISS || m === SUNK) {
              ok = false;
              break;
            }
            if (m === HIT) hits++;
            cells.push(i);
          }
          if (!ok) continue;
          const w = hits ? 1 + 40 * hits : 1;
          for (const i of cells) if (shots[i] === UNKNOWN) map[i] += w;
        }
    }
  }
  return map;
}

export function hardShot(v: TargetView, rng: Rng): number {
  const map = densityMap(v);
  let best = -1;
  let ties: number[] = [];
  v.shots.forEach((m, i) => {
    if (m !== UNKNOWN) return;
    if (map[i] > best) {
      best = map[i];
      ties = [i];
    } else if (map[i] === best) ties.push(i);
  });
  return pickRandom(ties, rng);
}

export function aiShot(level: AiLevel, v: TargetView, rng: Rng): number {
  return level === "easy" ? easyShot(v, rng) : level === "medium" ? mediumShot(v, rng) : hardShot(v, rng);
}
