/*
 * Maze model: parses a half-drawn layout into a full symmetric grid and answers the
 * questions movement needs (what is open, where does a step lead, which way is shorter).
 * Pure data, no DOM, so the checker can load it.
 */
import { BIG_LAYOUTS, SMALL_LAYOUTS, type LayoutDef } from "./layouts";

/** 0 up, 1 left, 2 down, 3 right; -1 = standing still. */
export type Dir = -1 | 0 | 1 | 2 | 3;
export const DX = [0, -1, 0, 1];
export const DY = [-1, 0, 1, 0];
export const DIRS: Dir[] = [0, 1, 2, 3];
export const opposite = (d: Dir): Dir => (d < 0 ? -1 : (((d + 2) % 4) as Dir));

export interface Tile {
  x: number;
  y: number;
}

/** Who is asking whether a tile is open: the hero, a roaming critter, or one using the pen. */
export type Walker = "hero" | "critter" | "pen";

export interface Maze {
  name: string;
  cols: number;
  rows: number;
  cells: string[];
  /** Tiles that start with a data dot. */
  dots: Tile[];
  /** Answer pellet slots, ordered A (top-left), B (top-right), C (bottom-left), D (bottom-right). */
  pellets: Tile[];
  hero: Tile;
  item: Tile;
  door: Tile;
  /** The open tile just above the door, where critters step out. */
  exit: Tile;
  /** Pen tiles (critters wait here). */
  pen: Tile[];
  tunnelRows: number[];
}

export function mirrorHalf(half: string[]): string[] {
  return half.map((r) => r + [...r.slice(0, -1)].reverse().join(""));
}

export function parseLayout(def: LayoutDef): Maze {
  const cells = mirrorHalf(def.half);
  const rows = cells.length;
  const cols = cells[0].length;
  const dots: Tile[] = [];
  const pellets: Tile[] = [];
  const pen: Tile[] = [];
  let hero: Tile | null = null;
  let item: Tile | null = null;
  let door: Tile | null = null;
  const tunnelRows: number[] = [];
  cells.forEach((row, y) => {
    if (row.length !== cols) throw new Error(`${def.name}: row ${y} is ${row.length} wide, expected ${cols}`);
    if (row[0] !== "#" && row[cols - 1] !== "#") tunnelRows.push(y);
    [...row].forEach((c, x) => {
      if (c === ".") dots.push({ x, y });
      else if (c === "o") pellets.push({ x, y });
      else if (c === "p") pen.push({ x, y });
      else if (c === "H") hero = { x, y };
      else if (c === "F") item = { x, y };
      else if (c === "=") door = { x, y };
    });
  });
  if (!hero || !item || !door) throw new Error(`${def.name}: needs H, F and =`);
  const d = door as Tile;
  pellets.sort((a, b) => a.y - b.y || a.x - b.x);
  return {
    name: def.name,
    cols,
    rows,
    cells,
    dots,
    pellets,
    hero,
    item,
    door: d,
    exit: { x: d.x, y: d.y - 1 },
    pen,
    tunnelRows,
  };
}

export const BIG_MAZES: Maze[] = BIG_LAYOUTS.map(parseLayout);
export const SMALL_MAZES: Maze[] = SMALL_LAYOUTS.map(parseLayout);

/** Column wrapped into the maze on tunnel rows; NaN when the step leaves the maze elsewhere. */
export function wrapX(m: Maze, x: number, y: number): number {
  if (x >= 0 && x < m.cols) return x;
  if (m.tunnelRows.includes(y)) return ((x % m.cols) + m.cols) % m.cols;
  return NaN;
}

export function cellAt(m: Maze, x: number, y: number): string {
  if (y < 0 || y >= m.rows) return "#";
  const wx = wrapX(m, x, y);
  if (Number.isNaN(wx)) return "#";
  return m.cells[y][wx];
}

export function isOpen(m: Maze, x: number, y: number, who: Walker): boolean {
  const c = cellAt(m, x, y);
  if (c === "#") return false;
  if (c === "=" || c === "p") return who === "pen";
  return true;
}

/** The tile one step from (x, y) in direction d, wrapped through tunnels. */
export function stepTile(m: Maze, x: number, y: number, d: Dir): Tile {
  const ny = y + DY[d];
  const nx = wrapX(m, x + DX[d], ny);
  return { x: Number.isNaN(nx) ? x + DX[d] : nx, y: ny };
}

export function canGo(m: Maze, x: number, y: number, d: Dir, who: Walker): boolean {
  if (d < 0) return false;
  const t = stepTile(m, x, y, d);
  return isOpen(m, t.x, t.y, who);
}

export function openDirs(m: Maze, x: number, y: number, who: Walker): Dir[] {
  return DIRS.filter((d) => canGo(m, x, y, d, who));
}

/** Breadth-first distances from a tile (tunnels included). */
export function distancesFrom(m: Maze, from: Tile, who: Walker): number[][] {
  const dist = m.cells.map((r) => [...r].map(() => Infinity));
  dist[from.y][from.x] = 0;
  const q: Tile[] = [from];
  for (let i = 0; i < q.length; i++) {
    const t = q[i];
    for (const d of DIRS) {
      if (!canGo(m, t.x, t.y, d, who)) continue;
      const n = stepTile(m, t.x, t.y, d);
      if (dist[n.y][n.x] === Infinity) {
        dist[n.y][n.x] = dist[t.y][t.x] + 1;
        q.push(n);
      }
    }
  }
  return dist;
}

const distCache = new Map<string, number[][]>();

/** Cached BFS distances to a tile, for critters walking to the pen or out of it. */
export function distancesTo(m: Maze, to: Tile, who: Walker): number[][] {
  const k = `${m.name}|${to.x},${to.y}|${who}`;
  let d = distCache.get(k);
  if (!d) {
    d = distancesFrom(m, to, who);
    distCache.set(k, d);
  }
  return d;
}

/** First step on a shortest path from `from` to `to` (-1 if already there or unreachable). */
export function pathDir(m: Maze, from: Tile, to: Tile, who: Walker): Dir {
  if (from.x === to.x && from.y === to.y) return -1;
  const dist = distancesTo(m, to, who);
  let best: Dir = -1;
  let bestD = dist[from.y]?.[from.x] ?? Infinity;
  for (const d of DIRS) {
    if (!canGo(m, from.x, from.y, d, who)) continue;
    const n = stepTile(m, from.x, from.y, d);
    if (dist[n.y][n.x] < bestD) {
      bestD = dist[n.y][n.x];
      best = d;
    }
  }
  return best;
}

/** Every tile the hero can stand on. */
export function heroTiles(m: Maze): Tile[] {
  const out: Tile[] = [];
  m.cells.forEach((row, y) => [...row].forEach((_, x) => isOpen(m, x, y, "hero") && out.push({ x, y })));
  return out;
}
