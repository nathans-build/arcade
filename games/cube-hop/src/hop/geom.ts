/*
 * Pyramid geometry and graph helpers (pure: no DOM), shared by the engine and the checker.
 *
 * Cube (r, c) is row r (0 = top) and column c (0..r). The four hops are diagonal:
 *   ↗ up-right   (r-1, c)      ↖ up-left   (r-1, c-1)
 *   ↘ down-right (r+1, c+1)    ↙ down-left (r+1, c)
 * Off the pyramid, (k, -1) and (k, k+1) are where the side escape pads float.
 */

export const W = 320;
export const H = 200;

export type Dir = "ur" | "dr" | "dl" | "ul";
export const DIRS: Dir[] = ["ur", "dr", "dl", "ul"];

export interface Cell {
  r: number;
  c: number;
}

export interface Geom {
  rows: number;
  /** Cube width (the top face is w wide and th tall; side faces sh tall). */
  w: number;
  th: number;
  sh: number;
  /** Row step: th/2 + sh, so each row's tops tuck under the row above's side faces. */
  dy: number;
  /** y of the top-face centre of the top cube. */
  top: number;
  /** Largest label chip that fits a cube top, and the label scale (2 = big labels for K–2). */
  chipMax: number;
  scale: number;
}

export function geomFor(rows: number): Geom {
  const spec: Record<number, [number, number, number, number]> = {
    5: [52, 26, 16, 2],
    6: [46, 22, 14, 1],
    7: [44, 20, 12, 1],
  };
  const [w, th, sh, scale] = spec[rows] ?? spec[7];
  const dy = th / 2 + sh;
  const top = H - 6 - sh - th / 2 - (rows - 1) * dy;
  return { rows, w, th, sh, dy, top, chipMax: w - 2, scale };
}

export const key = (r: number, c: number) => `${r},${c}`;

export function onPyramid(g: Geom, r: number, c: number): boolean {
  return r >= 0 && r < g.rows && c >= 0 && c <= r;
}

export function step(r: number, c: number, d: Dir): Cell {
  switch (d) {
    case "ur": return { r: r - 1, c };
    case "ul": return { r: r - 1, c: c - 1 };
    case "dr": return { r: r + 1, c: c + 1 };
    case "dl": return { r: r + 1, c };
  }
}

/** Direction from a to an adjacent b, or null. */
export function dirTo(a: Cell, b: Cell): Dir | null {
  for (const d of DIRS) {
    const n = step(a.r, a.c, d);
    if (n.r === b.r && n.c === b.c) return d;
  }
  return null;
}

/** Screen centre of cube (r, c)'s top face (also works off the pyramid, for pads and falls). */
export function cellXY(g: Geom, r: number, c: number): { x: number; y: number } {
  return { x: W / 2 + (c - r / 2) * g.w, y: g.top + r * g.dy };
}

export function allCells(g: Geom): Cell[] {
  const out: Cell[] = [];
  for (let r = 0; r < g.rows; r++) for (let c = 0; c <= r; c++) out.push({ r, c });
  return out;
}

export function neighbours(g: Geom, cell: Cell): Cell[] {
  return DIRS.map((d) => step(cell.r, cell.c, d)).filter((n) => onPyramid(g, n.r, n.c));
}

/**
 * Shortest hop path from `from` to `to` (both on the pyramid) that only passes through cubes
 * where `open(cell)` is true (the target itself is always allowed). Returns the cells after
 * `from`, ending with `to`, or null when there is no such path.
 */
export function findPath(g: Geom, from: Cell, to: Cell, open: (c: Cell) => boolean): Cell[] | null {
  const start = key(from.r, from.c);
  const goal = key(to.r, to.c);
  if (start === goal) return [];
  const prev = new Map<string, string>([[start, ""]]);
  const queue: Cell[] = [from];
  while (queue.length) {
    const cur = queue.shift()!;
    for (const n of neighbours(g, cur)) {
      const k = key(n.r, n.c);
      if (prev.has(k)) continue;
      if (k !== goal && !open(n)) continue;
      prev.set(k, key(cur.r, cur.c));
      if (k === goal) {
        const path: Cell[] = [];
        let at = k;
        while (at !== start) {
          const [r, c] = at.split(",").map(Number);
          path.unshift({ r, c });
          at = prev.get(at)!;
        }
        return path;
      }
      queue.push(n);
    }
  }
  return null;
}

/** Hop distance ignoring obstacles. */
export function hopDistance(g: Geom, a: Cell, b: Cell): number {
  return findPath(g, a, b, () => true)?.length ?? Infinity;
}

/** Pseudo-random generator (mulberry32), so placements can be replayed in tests. */
export function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffle<T>(arr: T[], rand: () => number = Math.random): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Places labels on cubes (never the top cube, where the hero starts and respawns) so that
 * every labelled cube can be reached from the top through blank cubes only. That means an
 * auto-hop from any cube to any label never has to land on another label on the way.
 * `order` labels (build rounds) are kept within a few hops of each other in sequence, so a
 * sentence reads as a trail down the pyramid. Returns null if no layout was found.
 */
export function placeLabels(
  g: Geom,
  labels: string[],
  rand: () => number = Math.random,
  opts: { chainLength?: number } = {},
): Map<string, string> | null {
  const cells = allCells(g).filter((c) => !(c.r === 0 && c.c === 0));
  if (labels.length > cells.length - 3) return null;
  const chain = opts.chainLength ?? 0;
  for (let attempt = 0; attempt < 400; attempt++) {
    const map = new Map<string, string>();
    const free = shuffle(cells, rand);
    let ok = true;
    let prev: Cell = { r: 0, c: 0 };
    for (let i = 0; i < labels.length; i++) {
      let idx = 0;
      if (i < chain) {
        // Sentence words: 2-4 hops from the previous word, spread over the pyramid.
        idx = free.findIndex((c) => {
          const d = hopDistance(g, prev, c);
          return d >= 2 && d <= 4;
        });
        if (idx < 0) idx = 0;
      }
      const cell = free.splice(idx, 1)[0];
      if (!cell) {
        ok = false;
        break;
      }
      map.set(key(cell.r, cell.c), labels[i]);
      if (i < chain) prev = cell;
    }
    if (ok && layoutReachable(g, map)) return map;
  }
  return null;
}

/** Every labelled cube touches the blank region that holds the top cube. */
export function layoutReachable(g: Geom, labelled: Map<string, unknown>): boolean {
  const seen = new Set<string>([key(0, 0)]);
  const queue: Cell[] = [{ r: 0, c: 0 }];
  while (queue.length) {
    const cur = queue.shift()!;
    for (const n of neighbours(g, cur)) {
      const k = key(n.r, n.c);
      if (seen.has(k) || labelled.has(k)) continue;
      seen.add(k);
      queue.push(n);
    }
  }
  for (const k of labelled.keys()) {
    const [r, c] = k.split(",").map(Number);
    if (!neighbours(g, { r, c }).some((n) => seen.has(key(n.r, n.c)))) return false;
  }
  return true;
}
