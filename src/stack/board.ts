import { cmp, isInt, q, type Q } from "./rational";
import { cellFor, choose, combine, complement, rowStatus, type CellValue, type Rng, type Rule } from "./rules";

/* The well: a 7 × 13 grid of numbered blocks. Pure logic, no drawing. */

export const COLS = 7;
export const ROWS = 13;

export interface Cell {
  val: CellValue;
  kind: number;
}
export type Grid = (Cell | null)[][];

/** Tetrominoes as [row, col] minos inside an n×n box (rotation state 0). */
export const SHAPES: { name: string; n: number; minos: [number, number][] }[] = [
  { name: "I", n: 4, minos: [[1, 0], [1, 1], [1, 2], [1, 3]] },
  { name: "O", n: 2, minos: [[0, 0], [0, 1], [1, 0], [1, 1]] },
  { name: "T", n: 3, minos: [[0, 1], [1, 0], [1, 1], [1, 2]] },
  { name: "S", n: 3, minos: [[0, 1], [0, 2], [1, 0], [1, 1]] },
  { name: "Z", n: 3, minos: [[0, 0], [0, 1], [1, 1], [1, 2]] },
  { name: "J", n: 3, minos: [[0, 0], [1, 0], [1, 1], [1, 2]] },
  { name: "L", n: 3, minos: [[0, 2], [1, 0], [1, 1], [1, 2]] },
];

export interface Piece {
  kind: number;
  rot: number;
  x: number;
  y: number;
  /** One value per mino; values travel with their mino when the piece rotates. */
  vals: CellValue[];
}

export function emptyGrid(): Grid {
  return Array.from({ length: ROWS }, () => Array<Cell | null>(COLS).fill(null));
}

export function cloneGrid(g: Grid): Grid {
  return g.map((r) => [...r]);
}

export function minos(p: Piece): { r: number; c: number; i: number }[] {
  const { n, minos: base } = SHAPES[p.kind];
  return base.map(([r0, c0], i) => {
    let r = r0;
    let c = c0;
    for (let k = 0; k < ((p.rot % 4) + 4) % 4; k++) [r, c] = [c, n - 1 - r];
    return { r: p.y + r, c: p.x + c, i };
  });
}

export function spawnPiece(kind: number, vals: CellValue[]): Piece {
  const n = SHAPES[kind].n;
  return { kind, rot: 0, x: Math.floor((COLS - n) / 2), y: kind === 0 ? -1 : 0, vals };
}

export function fits(g: Grid, p: Piece): boolean {
  return minos(p).every(({ r, c }) => c >= 0 && c < COLS && r < ROWS && (r < 0 || !g[r][c]));
}

const KICKS: [number, number][] = [[0, 0], [-1, 0], [1, 0], [0, -1], [-2, 0], [2, 0], [0, 1]];

export function rotated(g: Grid, p: Piece, dir: 1 | -1): Piece | null {
  for (const [dx, dy] of KICKS) {
    const t = { ...p, rot: (p.rot + dir + 4) % 4, x: p.x + dx, y: p.y + dy };
    if (fits(g, t)) return t;
  }
  return null;
}

export function dropped(g: Grid, p: Piece): Piece {
  let t = p;
  while (fits(g, { ...t, y: t.y + 1 })) t = { ...t, y: t.y + 1 };
  return t;
}

/** Writes the piece into the grid. Returns false if any block locked above the top (game over). */
export function lockPiece(g: Grid, p: Piece): boolean {
  let ok = true;
  for (const { r, c, i } of minos(p)) {
    if (r < 0) ok = false;
    else g[r][c] = { val: p.vals[i], kind: p.kind };
  }
  return ok;
}

export function rowCells(g: Grid, r: number): Cell[] {
  return g[r].filter((c): c is Cell => !!c);
}

/**
 * A WILD cell becomes the value its row needs (the missing addend or factor).
 * With nothing else in its row it takes a random domain value.
 */
export function resolveWilds(g: Grid, rule: Rule, rng: Rng = Math.random) {
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++) {
      const cell = g[r][c];
      if (!cell?.val.wild) continue;
      const others = rowCells(g, r).filter((o) => o !== cell && !o.val.wild);
      let v: Q;
      if (others.length === 0) v = choose(rng, rule.domain).v;
      else {
        const need = complement(rule, combine(rule.op, others.map((o) => o.val.v)));
        const neutral = rule.op === "+" ? q(0) : q(1);
        if (!need) v = neutral;
        else if (rule.op === "×" && (!isInt(need) || need.n < 1)) v = neutral;
        else if (rule.op === "+" && rule.monotone && cmp(need, q(0)) < 0) v = neutral;
        else v = need;
      }
      const label = cellFor(rule, v, rng)?.label ?? rule.fmt(v);
      g[r][c] = { ...cell, val: { label, v, wild: false } };
    }
}

export interface RowResult {
  perfect: number[];
  full: number[];
}

/** Rows that clear: a PERFECT row hits the target exactly (2+ blocks); a FULL row is simply full. */
export function evaluateRows(g: Grid, rule: Rule): RowResult {
  const perfect: number[] = [];
  const full: number[] = [];
  for (let r = 0; r < ROWS; r++) {
    const cells = rowCells(g, r);
    if (cells.length >= 2 && rowStatus(rule, cells.map((c) => c.val.v)) === "exact") perfect.push(r);
    else if (cells.length === COLS) full.push(r);
  }
  return { perfect, full };
}

export function removeRows(g: Grid, rows: number[]): Grid {
  const keep = g.filter((_, r) => !rows.includes(r));
  while (keep.length < ROWS) keep.unshift(Array<Cell | null>(COLS).fill(null));
  return keep;
}

/** Rows with at least one empty cell that a falling block can still reach from above. */
export function reachableRows(g: Grid): number[] {
  const out: number[] = [];
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (g[r][c]) continue;
      let open = true;
      for (let k = 0; k < r; k++) if (g[k][c]) open = false;
      if (open) {
        out.push(r);
        break;
      }
    }
  }
  return out;
}

export function stackHeight(g: Grid): number {
  for (let r = 0; r < ROWS; r++) if (g[r].some(Boolean)) return ROWS - r;
  return 0;
}

/* ------------------------ simple placement bot ------------------------ */
// Used by the attract-mode demo and by the automated tests/playtests.

export function bestPlacement(g: Grid, p: Piece, rule: Rule): { rot: number; x: number } | null {
  let best: { rot: number; x: number; s: number } | null = null;
  for (let rot = 0; rot < 4; rot++) {
    for (let x = -3; x < COLS + 1; x++) {
      const start = { ...p, rot, x, y: p.y };
      if (!fits(g, start)) continue;
      const t = dropped(g, start);
      const sim = cloneGrid(g);
      if (!lockPiece(sim, t)) continue;
      const res = evaluateRows(sim, rule);
      const after = removeRows(sim, [...res.perfect, ...res.full]);
      let holes = 0;
      let agg = 0;
      let bump = 0;
      let over = 0;
      let prevH = -1;
      for (let c = 0; c < COLS; c++) {
        let top = ROWS;
        for (let r = 0; r < ROWS; r++)
          if (after[r][c]) {
            top = r;
            break;
          }
        const h = ROWS - top;
        agg += h;
        if (prevH >= 0) bump += Math.abs(h - prevH);
        prevH = h;
        for (let r = top + 1; r < ROWS; r++) if (!after[r][c]) holes++;
      }
      for (let r = 0; r < ROWS; r++) {
        const cells = rowCells(after, r);
        if (cells.length && rowStatus(rule, cells.map((c) => c.val.v)) === "over") over++;
      }
      const s = res.perfect.length * 60 + res.full.length * 12 - holes * 7 - agg * 0.6 - bump * 0.4 - over * 3 - stackHeight(after) * 1.5;
      if (!best || s > best.s) best = { rot, x, s };
    }
  }
  return best && { rot: best.rot, x: best.x };
}
