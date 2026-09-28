import { reachableRows, rowCells, type Grid } from "./board";
import { cellFor, combine, complement, partition, rowStatus, shuffle, type CellValue, type Rng, type Rule } from "./rules";

/*
 * Deals cell values so perfect rows stay within reach:
 *  - values come from a queue refilled with whole "partitions" (sets that combine exactly
 *    to the target), so the right combinations keep arriving;
 *  - often one cell of the next piece is a "fixer": exactly the value an open row near the
 *    top of the stack still needs.
 */
export class ValueBag {
  private queue: CellValue[] = [];

  constructor(public rule: Rule, private rng: Rng = Math.random) {}

  setRule(rule: Rule) {
    this.rule = rule;
    this.queue = [];
  }

  private pull(): CellValue {
    if (this.queue.length === 0) {
      const sets = [partition(this.rule, this.rng), partition(this.rule, this.rng), partition(this.rule, this.rng)];
      this.queue = shuffle(this.rng, sets.flat());
    }
    return this.queue.shift()!;
  }

  /** The value an open, reachable row needs (preferring rows near the stack surface). */
  fixer(grid: Grid): CellValue | null {
    const rows = reachableRows(grid)
      .filter((r) => {
        const cells = rowCells(grid, r);
        return cells.length > 0 && rowStatus(this.rule, cells.map((c) => c.val.v)) === "under";
      })
      .reverse()
      .slice(-3); // the three highest open rows
    for (const r of shuffle(this.rng, rows)) {
      const need = complement(this.rule, combine(this.rule.op, rowCells(grid, r).map((c) => c.val.v)));
      const cell = need && cellFor(this.rule, need, this.rng);
      if (cell) return cell;
    }
    return null;
  }

  /** Values for the next piece (one per block). */
  piece(grid: Grid, n = 4): CellValue[] {
    const vals = Array.from({ length: n }, () => this.pull());
    if (this.rng() < (this.rule.big ? 0.65 : 0.5)) {
      const fix = this.fixer(grid);
      if (fix) vals[Math.floor(this.rng() * n)] = fix;
    }
    return vals;
  }
}
