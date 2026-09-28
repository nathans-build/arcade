/*
 * Level layouts: girders (floors, possibly split by a gap), ladders between floors and the
 * cells where slabs start. Pure data and maths (no DOM), so the checker can test every layout
 * for reachability (every slab can be walked across from the chef's start).
 */

export type Band = "k2" | "35" | "68" | "hs";

/* Logical arcade resolution; the canvas is scaled up with nearest-neighbour. */
export const W = 320;
export const H = 200;

/** Slabs and girders live left of the plate column. */
export const FIELD_W = 256;
export const PLATE_X0 = 259;
export const PLATE_W = W - PLATE_X0 - 2;
export const PLATE_CX = PLATE_X0 + PLATE_W / 2;
/** The serving counter: slabs that fall off the lowest girder slide along it to the plate. */
export const COUNTER_Y = 188;
export const PLATE_Y = 189;
/** Height of a slab on the plate (labels at scale 1). */
export const STACK_SLAB_H = 8;
export const STACK_SLAB_W = PLATE_W - 2;

export interface BandSize {
  floors: number[];
  cols: number;
  slabW: number;
  slabH: number;
  /** Label scale on the girder slabs (K-2 get big labels). */
  labelScale: number;
  steps: [number, number];
}

function colW(cols: number) {
  return FIELD_W / cols;
}

export const SIZES: Record<Band, BandSize> = {
  k2: { floors: [70, 114, 158], cols: 3, slabW: Math.floor(colW(3) - 11), slabH: 12, labelScale: 2, steps: [3, 3] },
  "35": { floors: [58, 92, 126, 160], cols: 4, slabW: Math.floor(colW(4) - 10), slabH: 7, labelScale: 1, steps: [4, 4] },
  "68": { floors: [58, 92, 126, 160], cols: 4, slabW: Math.floor(colW(4) - 10), slabH: 7, labelScale: 1, steps: [4, 5] },
  hs: { floors: [58, 92, 126, 160], cols: 4, slabW: Math.floor(colW(4) - 10), slabH: 7, labelScale: 1, steps: [4, 5] },
};

/** Widest label (in unscaled font pixels) that fits on a girder slab for this band. */
export function maxLabelWidth(band: Band): number {
  const s = SIZES[band];
  return Math.floor((s.slabW - 4) / s.labelScale);
}
/** Widest label on a plate slab (scale 1). */
export const MAX_STACK_LABEL = STACK_SLAB_W - 4;

export function colCenter(band: Band, col: number): number {
  return colW(SIZES[band].cols) * (col + 0.5);
}
/** x of the ladder slot on the boundary between column b-1 and column b. */
export function boundaryX(band: Band, b: number): number {
  return Math.round(colW(SIZES[band].cols) * b);
}

export const LADDER_HALF = 4;
export const GAP_HALF = 4;

export interface Segment {
  floor: number;
  x0: number;
  x1: number;
}
export interface Ladder {
  x: number;
  /** Upper floor index (smaller y) and the floor below it. */
  top: number;
  bottom: number;
}
export interface Cell {
  col: number;
  floor: number;
}
export interface Layout {
  band: Band;
  floorY: number[];
  segments: Segment[];
  ladders: Ladder[];
  cells: Cell[];
  start: { x: number; floor: number };
  spawns: { x: number; floor: number }[];
}

/** Small seeded RNG so layouts reproduce in tests. */
export function rng(seed: number) {
  let s = seed >>> 0 || 1;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 2 ** 32;
  };
}

export function segmentAt(l: Layout, floor: number, x: number): number {
  return l.segments.findIndex((s) => s.floor === floor && x >= s.x0 && x <= s.x1);
}

/** Segment graph: segments are nodes, ladders join the segments they touch at both ends. */
export function ladderEnds(l: Layout, lad: Ladder): [number, number] {
  return [segmentAt(l, lad.top, lad.x), segmentAt(l, lad.bottom, lad.x)];
}

/** Segments reachable from `from` by walking and climbing. */
export function reachable(l: Layout, from: number): Set<number> {
  const seen = new Set<number>([from]);
  const queue = [from];
  while (queue.length) {
    const s = queue.shift()!;
    for (const lad of l.ladders) {
      const [a, b] = ladderEnds(l, lad);
      if (a < 0 || b < 0) continue;
      const n = a === s ? b : b === s ? a : -1;
      if (n >= 0 && !seen.has(n)) {
        seen.add(n);
        queue.push(n);
      }
    }
  }
  return seen;
}

/**
 * First ladder on a shortest path from segment `from` to segment `to` (by number of ladders),
 * or null when already there / unreachable. Used by the critters to chase the chef.
 */
export function nextLadder(l: Layout, from: number, to: number): Ladder | null {
  if (from === to) return null;
  const prev = new Map<number, { seg: number; lad: Ladder }>();
  const seen = new Set<number>([from]);
  const queue = [from];
  while (queue.length) {
    const s = queue.shift()!;
    if (s === to) break;
    for (const lad of l.ladders) {
      const [a, b] = ladderEnds(l, lad);
      if (a < 0 || b < 0) continue;
      const n = a === s ? b : b === s ? a : -1;
      if (n >= 0 && !seen.has(n)) {
        seen.add(n);
        prev.set(n, { seg: s, lad });
        queue.push(n);
      }
    }
  }
  if (!seen.has(to)) return null;
  let cur = to;
  let step = prev.get(cur);
  while (step && step.seg !== from) {
    cur = step.seg;
    step = prev.get(cur);
  }
  return step ? step.lad : null;
}

/** Slab x-range for a cell. */
export function slabSpan(band: Band, col: number): [number, number] {
  const c = colCenter(band, col);
  const w = SIZES[band].slabW;
  return [c - w / 2, c + w / 2];
}

/**
 * Builds a level layout: every girder floor runs the width of the field, except that from level
 * 2 (grades 3-12) one middle floor may have a gap at a column boundary. Ladders sit on column
 * boundaries (never under a slab); extra ladders are added until every segment is reachable.
 */
export function makeLayout(band: Band, nSlabs: number, level: number, seed: number): Layout {
  const r = rng(seed);
  const size = SIZES[band];
  const nF = size.floors.length;
  const nB = size.cols - 1;
  const segments: Segment[] = [];
  const gaps = new Map<number, number>(); // floor -> boundary index with a gap
  // The gap is on the middle boundary, so both halves keep a ladder slot of their own.
  if (band !== "k2" && level >= 2 && r() < 0.7) {
    const f = 1 + Math.floor(r() * (nF - 2));
    gaps.set(f, Math.ceil(nB / 2));
  }
  for (let f = 0; f < nF; f++) {
    const g = gaps.get(f);
    if (g === undefined) segments.push({ floor: f, x0: 0, x1: FIELD_W });
    else {
      const bx = boundaryX(band, g);
      segments.push({ floor: f, x0: 0, x1: bx - GAP_HALF }, { floor: f, x0: bx + GAP_HALF, x1: FIELD_W });
    }
  }
  const ladders: Ladder[] = [];
  const canLadder = (f: number, b: number) => gaps.get(f) !== b && gaps.get(f + 1) !== b;
  for (let f = 0; f < nF - 1; f++) {
    const options: number[] = [];
    for (let b = 1; b <= nB; b++) if (canLadder(f, b)) options.push(b);
    // Shuffle and take 1-2 (K-2: every boundary, so there is always a short way round).
    for (let i = options.length - 1; i > 0; i--) {
      const j = Math.floor(r() * (i + 1));
      [options[i], options[j]] = [options[j], options[i]];
    }
    const take = band === "k2" ? options.length : Math.min(options.length, r() < 0.5 ? 2 : Math.max(2, options.length - 1));
    for (const b of options.slice(0, take)) ladders.push({ x: boundaryX(band, b), top: f, bottom: f + 1 });
  }
  const layout: Layout = {
    band,
    floorY: [...size.floors],
    segments,
    ladders,
    cells: [],
    start: { x: 14, floor: nF - 1 },
    spawns: [
      { x: 8, floor: 0 },
      { x: FIELD_W - 8, floor: 0 },
    ],
  };
  // Repair: add ladders until everything is reachable from the start.
  const startSeg = () => segmentAt(layout, layout.start.floor, layout.start.x);
  for (let guard = 0; guard < 40; guard++) {
    const seen = reachable(layout, startSeg());
    if (seen.size === segments.length) break;
    const missing = segments.findIndex((_, i) => !seen.has(i));
    const s = segments[missing];
    let added = false;
    for (const df of [1, -1]) {
      const f2 = s.floor + df;
      if (f2 < 0 || f2 >= nF || added) continue;
      for (let b = 1; b <= nB && !added; b++) {
        const x = boundaryX(band, b);
        if (x < s.x0 || x > s.x1) continue;
        const top = Math.min(s.floor, f2);
        if (!canLadder(top, b)) continue;
        if (ladders.some((l) => l.x === x && l.top === top)) continue;
        ladders.push({ x, top, bottom: top + 1 });
        added = true;
      }
    }
    if (!added) break;
  }

  // Slab cells: one slab per column first, then extra slabs on free cells of other floors.
  const cells: Cell[] = [];
  const cols = [...Array(size.cols).keys()];
  for (let i = cols.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [cols[i], cols[j]] = [cols[j], cols[i]];
  }
  // K-2 slabs start low (fewer walks); later levels and older grades start higher.
  const pickFloor = () => {
    if (band === "k2") return level <= 1 ? 1 + Math.floor(r() * (nF - 1)) : Math.floor(r() * nF);
    return Math.floor(r() * (nF - (level <= 1 ? 1 : 0)));
  };
  for (let i = 0; i < nSlabs; i++) {
    const col = cols[i % cols.length];
    let floor = pickFloor();
    for (let t = 0; t < nF && cells.some((c) => c.col === col && c.floor === floor); t++) floor = (floor + 1) % nF;
    cells.push({ col, floor });
  }
  layout.cells = cells;
  return layout;
}

/** Floor index a slab resting on `floor` in `col` falls to (the next girder under it), or -1 for the counter. */
export function floorBelow(l: Layout, col: number, floor: number): number {
  const [a, b] = slabSpan(l.band, col);
  for (let f = floor + 1; f < l.floorY.length; f++) {
    if (l.segments.some((s) => s.floor === f && s.x0 <= a && s.x1 >= b)) return f;
  }
  return -1;
}
