/*
 * The lab bottle: an 8 × 16 grid of germ blobs and capsule halves, the falling capsule, and the
 * rules (move, rotate with wall kicks, lock, 4-in-a-line matches by MEANING, bonus clusters,
 * gravity and chains). Pure TypeScript, no timing and no DOM: game.ts adds the clock and
 * scripts/check-rules.ts tests it directly.
 */
import type { BonusInfo, Token } from "./content";
import type { Rng } from "./rng";

export const COLS = 8;
export const ROWS = 16;
/** Where a new capsule appears (left half), on the top row. */
export const SPAWN_C = 3;

/** Which neighbour holds the other half of the same capsule (null: a lone half or a germ). */
export type Link = "L" | "R" | "U" | "D" | null;

export interface Tile {
  id: number;
  tok: Token;
  germ: boolean;
  link: Link;
  /** Landed capsule halves glow in their kind's colour (the falling capsule is clear glass). */
  revealed: boolean;
}

export interface Piece {
  /** Anchor: the left half (horizontal) or the bottom half (vertical). */
  r: number;
  c: number;
  vertical: boolean;
  /** Left (horizontal) or bottom (vertical) half. */
  a: Token;
  /** Right (horizontal) or top (vertical) half. */
  b: Token;
}

export type Pos = [number, number];

export interface Group {
  type: "match" | "bonus";
  kind: number;
  cells: Pos[];
  bonus?: BonusInfo;
}

export interface BonusRule {
  sizes: number[];
  check: (tokens: Token[]) => BonusInfo | null;
}

const DIRS: Record<Exclude<Link, null>, Pos> = { L: [0, -1], R: [0, 1], U: [-1, 0], D: [1, 0] };
const OPP: Record<Exclude<Link, null>, Exclude<Link, null>> = { L: "R", R: "L", U: "D", D: "U" };

let nextId = 1;

/** Cells of a piece: [a, b]. */
export function pieceCells(p: Piece): [Pos, Pos] {
  return p.vertical ? [[p.r, p.c], [p.r - 1, p.c]] : [[p.r, p.c], [p.r, p.c + 1]];
}

export class Bottle {
  grid: (Tile | null)[][];

  constructor() {
    this.grid = Array.from({ length: ROWS }, () => Array<Tile | null>(COLS).fill(null));
  }

  static inside(r: number, c: number) {
    return r >= 0 && r < ROWS && c >= 0 && c < COLS;
  }

  at(r: number, c: number): Tile | null {
    return Bottle.inside(r, c) ? this.grid[r][c] : null;
  }

  free(r: number, c: number) {
    return Bottle.inside(r, c) && this.grid[r][c] === null;
  }

  put(r: number, c: number, tok: Token, germ = false, link: Link = null): Tile {
    const t: Tile = { id: nextId++, tok, germ, link, revealed: true };
    this.grid[r][c] = t;
    return t;
  }

  germCount(): number {
    let n = 0;
    for (const row of this.grid) for (const t of row) if (t?.germ) n++;
    return n;
  }

  tiles(): { r: number; c: number; t: Tile }[] {
    const out: { r: number; c: number; t: Tile }[] = [];
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) if (this.grid[r][c]) out.push({ r, c, t: this.grid[r][c]! });
    return out;
  }

  /* ---------------------------------------------------------------- the falling piece */

  fits(p: Piece): boolean {
    return pieceCells(p).every(([r, c]) => this.free(r, c));
  }

  /** A new capsule at the top, or null when the spawn cells are blocked (the bottle is full). */
  spawn(a: Token, b: Token): Piece | null {
    const p: Piece = { r: 0, c: SPAWN_C, vertical: false, a, b };
    return this.fits(p) ? p : null;
  }

  /** Shifted piece if it fits, else null. */
  move(p: Piece, dc: number): Piece | null {
    const q = { ...p, c: p.c + dc };
    return this.fits(q) ? q : null;
  }

  down(p: Piece): Piece | null {
    const q = { ...p, r: p.r + 1 };
    return this.fits(q) ? q : null;
  }

  /**
   * Rotate clockwise (dir 1) or counter-clockwise (dir −1), with wall kicks.
   * Clockwise: horizontal [L R] → vertical with L on top; vertical → horizontal [bottom top].
   * Counter-clockwise is the exact reverse. Kicks: vertical → horizontal slides left one column
   * when the right side is blocked (a wall or a tile); horizontal → vertical tries the right
   * half's column, then one row down (at the very top).
   */
  rotate(p: Piece, dir: 1 | -1): Piece | null {
    let base: Piece;
    if (!p.vertical) {
      base = dir === 1 ? { ...p, vertical: true, a: p.b, b: p.a } : { ...p, vertical: true };
      const kicks: Pos[] = [[0, 0], [0, 1], [1, 0], [1, 1]];
      for (const [dr, dc] of kicks) {
        const q = { ...base, r: base.r + dr, c: base.c + dc };
        if (this.fits(q)) return q;
      }
    } else {
      base = dir === 1 ? { ...p, vertical: false } : { ...p, vertical: false, a: p.b, b: p.a };
      const kicks: Pos[] = [[0, 0], [0, -1]];
      for (const [dr, dc] of kicks) {
        const q = { ...base, r: base.r + dr, c: base.c + dc };
        if (this.fits(q)) return q;
      }
    }
    return null;
  }

  /** Where the piece would land. */
  dropPos(p: Piece): Piece {
    let q = p;
    for (let n = this.down(q); n; n = this.down(q)) q = n;
    return q;
  }

  /** Writes the piece into the grid (linked halves). Returns the two cells. */
  lock(p: Piece): Pos[] {
    const [ca, cb] = pieceCells(p);
    const la: Link = p.vertical ? "U" : "R";
    this.put(ca[0], ca[1], p.a, false, la);
    this.put(cb[0], cb[1], p.b, false, OPP[la]);
    return [ca, cb];
  }

  /* ---------------------------------------------------------------- matches and bonuses */

  /** Runs of 4+ tiles of the same kind (meaning) in a row or column. */
  findMatches(): Group[] {
    const out: Group[] = [];
    const scan = (lines: Pos[][]) => {
      for (const line of lines) {
        let i = 0;
        while (i < line.length) {
          const t = this.at(...line[i]);
          if (!t) {
            i++;
            continue;
          }
          let j = i + 1;
          while (j < line.length && this.at(...line[j])?.tok.kind === t.tok.kind) j++;
          if (j - i >= 4) out.push({ type: "match", kind: t.tok.kind, cells: line.slice(i, j) });
          i = j;
        }
      }
    };
    const rows: Pos[][] = Array.from({ length: ROWS }, (_, r) => Array.from({ length: COLS }, (_, c) => [r, c] as Pos));
    const cols: Pos[][] = Array.from({ length: COLS }, (_, c) => Array.from({ length: ROWS }, (_, r) => [r, c] as Pos));
    scan(rows);
    scan(cols);
    return out;
  }

  /** Connected clusters (4-neighbour) of exactly `size` tiles that include (r, c). */
  clustersFrom(r: number, c: number, size: number): Pos[][] {
    const out: Pos[][] = [];
    const seen = new Set<string>();
    const key = (cells: Pos[]) => cells.map(([a, b]) => a * COLS + b).sort((x, y) => x - y).join(",");
    const grow = (cells: Pos[]) => {
      const k = key(cells);
      if (seen.has(k)) return;
      seen.add(k);
      if (cells.length === size) {
        out.push(cells);
        return;
      }
      for (const [cr, cc] of cells) {
        for (const [dr, dc] of Object.values(DIRS)) {
          const nr = cr + dr;
          const nc = cc + dc;
          if (!this.at(nr, nc) || cells.some(([a, b]) => a === nr && b === nc)) continue;
          grow([...cells, [nr, nc]]);
        }
      }
    };
    if (this.at(r, c)) grow([[r, c]]);
    return out;
  }

  /** True when the cells are exactly the two halves of one capsule (a capsule can't bond with itself). */
  private isOwnPair(cells: Pos[]): boolean {
    if (cells.length !== 2) return false;
    const [[r1, c1], [r2, c2]] = cells;
    const t = this.at(r1, c1);
    if (!t?.link || t.germ) return false;
    const [dr, dc] = DIRS[t.link];
    return r1 + dr === r2 && c1 + dc === c2;
  }

  /** Bonus clusters that include at least one of the `fresh` cells (just landed or just fell). */
  findBonuses(fresh: Pos[], rule: BonusRule | null): Group[] {
    if (!rule) return [];
    const out: Group[] = [];
    const used = new Set<number>();
    const sizes = [...rule.sizes].sort((a, b) => b - a); // bigger molecules first
    for (const [r, c] of fresh) {
      if (!this.at(r, c)) continue;
      for (const size of sizes) {
        for (const cells of this.clustersFrom(r, c, size)) {
          if (cells.some(([a, b]) => used.has(a * COLS + b))) continue;
          if (this.isOwnPair(cells)) continue;
          const info = rule.check(cells.map(([a, b]) => this.at(a, b)!.tok));
          if (!info) continue;
          cells.forEach(([a, b]) => used.add(a * COLS + b));
          out.push({ type: "bonus", kind: -1, cells, bonus: info });
        }
      }
    }
    return out;
  }

  findGroups(fresh: Pos[], rule: BonusRule | null): Group[] {
    return [...this.findMatches(), ...this.findBonuses(fresh, rule)];
  }

  /** Removes the cells; partners of removed halves become lone halves. Returns what was removed. */
  clear(cells: Pos[]): Tile[] {
    const removed: Tile[] = [];
    for (const [r, c] of cells) {
      const t = this.at(r, c);
      if (!t) continue;
      if (t.link) {
        const [dr, dc] = DIRS[t.link];
        const p = this.at(r + dr, c + dc);
        if (p) p.link = null;
      }
      this.grid[r][c] = null;
      removed.push(t);
    }
    return removed;
  }

  /* ---------------------------------------------------------------- gravity */

  /**
   * One gravity step: every unsupported capsule half (or whole capsule) drops one row.
   * Germs never fall. A horizontal capsule falls only if both cells under it are empty.
   * Returns the new positions of everything that moved.
   */
  fallStep(): Pos[] {
    const moved: Pos[] = [];
    const done = new Set<number>();
    for (let r = ROWS - 2; r >= 0; r--) {
      for (let c = 0; c < COLS; c++) {
        const t = this.grid[r][c];
        if (!t || t.germ || done.has(t.id)) continue;
        if (t.link === "U") {
          // bottom of a vertical capsule: falls with its top half
          if (this.free(r + 1, c)) {
            const top = this.grid[r - 1]?.[c] ?? null;
            this.grid[r + 1][c] = t;
            this.grid[r][c] = top;
            if (top) this.grid[r - 1][c] = null;
            moved.push([r + 1, c]);
            if (top) moved.push([r, c]);
            done.add(t.id);
            if (top) done.add(top.id);
          }
        } else if (t.link === "D") {
          // top of a vertical capsule whose bottom didn't fall: stays
          continue;
        } else if (t.link === "R" || t.link === "L") {
          const oc = t.link === "R" ? c + 1 : c - 1;
          const other = this.grid[r][oc];
          if (other && this.free(r + 1, c) && this.free(r + 1, oc)) {
            this.grid[r + 1][c] = t;
            this.grid[r + 1][oc] = other;
            this.grid[r][c] = null;
            this.grid[r][oc] = null;
            moved.push([r + 1, c], [r + 1, oc]);
            done.add(t.id);
            done.add(other.id);
          } else {
            done.add(t.id);
            if (other) done.add(other.id);
          }
        } else if (this.free(r + 1, c)) {
          this.grid[r + 1][c] = t;
          this.grid[r][c] = null;
          moved.push([r + 1, c]);
          done.add(t.id);
        }
      }
    }
    return moved;
  }

  /** Lets everything fall until it rests. Returns every cell that ended up somewhere new. */
  settleFall(): Pos[] {
    const all = new Map<number, Pos>();
    for (let guard = 0; guard < ROWS + 2; guard++) {
      const m = this.fallStep();
      if (!m.length) break;
      for (const p of m) all.set(this.at(...p)!.id, p);
    }
    // positions may have moved again after being recorded: look them up fresh
    const out: Pos[] = [];
    for (const { r, c, t } of this.tiles()) if (all.has(t.id)) out.push([r, c]);
    return out;
  }

  /**
   * Instant resolve (for tests and bots): clear groups, fall, repeat. Returns each chain step's groups.
   */
  resolve(fresh: Pos[], rule: BonusRule | null): Group[][] {
    const steps: Group[][] = [];
    let f = fresh;
    for (let guard = 0; guard < 50; guard++) {
      const groups = this.findGroups(f, rule);
      if (!groups.length) break;
      steps.push(groups);
      this.clear(groups.flatMap((g) => g.cells));
      f = this.settleFall();
    }
    return steps;
  }
}

/* ================================================================== germ placement */

export function germTarget(level: number): number {
  return Math.min(4 + 4 * (level - 1), 44);
}

/** Rows (from the bottom) germs may use: keeps the top of the bottle free. */
export function germRows(level: number): number {
  return Math.min(10, 6 + Math.floor((level - 1) / 3));
}

/** Would a germ of `kind` at (r, c) make 3 of the same kind in a line? (Never start with near-matches.) */
function makesThree(b: Bottle, r: number, c: number, kind: number): boolean {
  const same = (rr: number, cc: number) => b.at(rr, cc)?.tok.kind === kind;
  const line = (dr: number, dc: number) => {
    let n = 1;
    for (let k = 1; same(r + dr * k, c + dc * k); k++) n++;
    for (let k = 1; same(r - dr * k, c - dc * k); k++) n++;
    return n;
  };
  return line(0, 1) >= 3 || line(1, 0) >= 3;
}

/**
 * Fills the lower part of a bottle with germs, kinds taking turns so every kind appears.
 * No germ starts in a line of 3 of its kind.
 */
export function placeGerms(b: Bottle, level: number, kinds: number, germToken: (kind: number, rng: Rng) => Token, rng: Rng): number {
  const target = germTarget(level);
  const top = ROWS - germRows(level);
  let placed = 0;
  for (let i = 0; i < target; i++) {
    let kind = i % kinds;
    let ok = false;
    for (let tries = 0; tries < 300 && !ok; tries++) {
      const r = top + Math.floor(rng() * (ROWS - top));
      const c = Math.floor(rng() * COLS);
      if (!b.free(r, c)) continue;
      for (let k = 0; k < kinds; k++) {
        const kk = (kind + k) % kinds;
        if (!makesThree(b, r, c, kk)) {
          kind = kk;
          b.put(r, c, germToken(kind, rng), true);
          ok = true;
          break;
        }
      }
    }
    if (ok) placed++;
  }
  return placed;
}
