/*
 * The circuit board and its solver. Pure TypeScript (the checker runs it under tsx).
 *
 * A board is a grid of cells. A tile connects to its neighbours through its sides (N, E, S, W);
 * two tiles are joined only when both have the facing sides. How the solver works:
 *
 *  1. Continuity: every tile side is a node. Union-find merges the sides that are joined by
 *     something with (practically) no resistance: wires, conductor materials (copper, foil,
 *     steel paper clip, coin), a closed switch, and touching neighbours. Insulators (rubber,
 *     plastic, wood, glass, string, eraser, paper), an open switch and an unscrewed bulb join
 *     nothing, so current can't cross them.
 *  2. Short circuit: if a battery's + and − end up in the same merged node, there is a path
 *     with no load across the battery. That is a short: nothing lights (the current skips the
 *     bulbs and only heats the wire), and the game shows the safety lesson.
 *  3. Currents: otherwise the merged nodes, the loads (bulb, motor/fan, buzzer, resistor) as
 *     resistances and the batteries as ideal voltage sources are solved with modified nodal
 *     analysis (Kirchhoff's current law at every node, a small Gaussian elimination). That gives
 *     every load's current I and power P = I²R, so series bulbs share the voltage and glow
 *     dimmer, parallel bulbs each get the full battery voltage, and V = I × R holds exactly.
 *  4. Breaks: when something is not running, the board marks every open end (a side that
 *     faces an empty or unmatched cell), every insulator and every open switch: that is where
 *     the loop is broken.
 */

export type Dir = 0 | 1 | 2 | 3; // N E S W
export const DIRS: Dir[] = [0, 1, 2, 3];
export const DR = [-1, 0, 1, 0];
export const DC = [0, 1, 0, -1];
export const opp = (d: Dir): Dir => ((d + 2) % 4) as Dir;
export const turn = (d: number, rot: number): Dir => (((d + rot) % 4) + 4) % 4 as Dir;

export type MatId = "copper" | "foil" | "clip" | "coin" | "rubber" | "plastic" | "wood" | "glass" | "string" | "eraser" | "paper";

export interface MaterialInfo {
  id: MatId;
  label: string;
  /** Up to 6 letters, drawn on the tile. */
  short: string;
  conductor: boolean;
  /** Kid-friendly reason, shown after a test. */
  why: string;
  color: string;
}

/** Conductors let electric current through easily; insulators block it. (Checked by npm test.) */
export const MATERIALS: Record<MatId, MaterialInfo> = {
  copper: { id: "copper", label: "Copper wire", short: "COPPER", conductor: true, why: "Copper is a metal. Metals are conductors: electric current flows through them easily.", color: "#e08a3c" },
  foil: { id: "foil", label: "Aluminum foil", short: "FOIL", conductor: true, why: "Aluminum foil is a thin metal, so it conducts electricity.", color: "#c9d3e0" },
  clip: { id: "clip", label: "Steel paper clip", short: "CLIP", conductor: true, why: "A paper clip is steel, a metal, so it conducts electricity.", color: "#9fb3c8" },
  coin: { id: "coin", label: "Metal coin", short: "COIN", conductor: true, why: "Coins are metal, and metals conduct electricity.", color: "#d9a441" },
  rubber: { id: "rubber", label: "Rubber band", short: "RUBBER", conductor: false, why: "Rubber is an insulator: it blocks electric current. That's why wires have rubber or plastic coats.", color: "#d04a6a" },
  plastic: { id: "plastic", label: "Plastic straw", short: "PLASTC", conductor: false, why: "Plastic is an insulator, so current can't get through it.", color: "#4ab0d0" },
  wood: { id: "wood", label: "Wooden stick", short: "WOOD", conductor: false, why: "Dry wood is an insulator: it doesn't let current flow.", color: "#a0703a" },
  glass: { id: "glass", label: "Glass rod", short: "GLASS", conductor: false, why: "Glass is an insulator. It blocks electric current.", color: "#9ee8e0" },
  string: { id: "string", label: "Cotton string", short: "STRING", conductor: false, why: "Dry string is an insulator, so the loop stays broken.", color: "#e8e0c8" },
  eraser: { id: "eraser", label: "Eraser", short: "ERASER", conductor: false, why: "An eraser is made of rubber-like material, an insulator.", color: "#f0a0b0" },
  paper: { id: "paper", label: "Paper strip", short: "PAPER", conductor: false, why: "Dry paper is an insulator: current can't get through.", color: "#f4f4ff" },
};

export type TileKind = "wire" | "battery" | "switch" | "bulb" | "motor" | "buzzer" | "resistor" | "material";
export type WireShape = "straight" | "corner" | "tee" | "cross";

export interface Tile {
  kind: TileKind;
  /** Quarter turns clockwise. */
  rot: number;
  shape?: WireShape;
  /** Battery voltage (V). */
  volts?: number;
  /** Load resistance (Ω). */
  ohms?: number;
  mat?: MatId;
  /** Part of the level: can't be moved, turned or taken. */
  fixed?: boolean;
}

/** Load kinds: things that use the electrical energy. */
export const LOADS: TileKind[] = ["bulb", "motor", "buzzer", "resistor"];
export const isLoad = (t: Tile | null | undefined) => !!t && LOADS.includes(t.kind);

/** Default resistances: a flashlight bulb, a toy motor, a buzzer. */
export const DEFAULT_OHMS: Record<string, number> = { bulb: 3, motor: 3, buzzer: 6, resistor: 3 };
export const CELL_VOLTS = 1.5;

const WIRE_BASE: Record<WireShape, Dir[]> = {
  straight: [3, 1], // W–E at rot 0 (─)
  corner: [0, 1], // N, E at rot 0 (└)
  tee: [3, 0, 1], // W, N, E at rot 0 (┴)
  cross: [0, 1, 2, 3],
};

/** The sides a tile connects through. Two-terminal parts: [first, second] (battery: [−, +]). */
export function sides(t: Tile): Dir[] {
  if (t.kind === "wire") return WIRE_BASE[t.shape ?? "straight"].map((d) => turn(d, t.rot));
  return [turn(3, t.rot), turn(1, t.rot)];
}

/** How many different rotations a tile has (the search in npm test uses this). */
export function rotCount(t: Tile): number {
  if (t.kind === "wire") return t.shape === "cross" ? 1 : t.shape === "straight" ? 2 : 4;
  if (t.kind === "battery") return 4; // polarity matters
  return 2;
}

export function isConductorTile(t: Tile, closed: boolean): boolean {
  if (t.kind === "wire") return true;
  if (t.kind === "material") return MATERIALS[t.mat!].conductor;
  if (t.kind === "switch") return closed;
  return false;
}

export type Grid = (Tile | null)[][];

export interface CellRef {
  r: number;
  c: number;
}
export interface BreakMark extends CellRef {
  /** Open end facing this direction, or null for a blocking part (insulator, open switch). */
  dir: Dir | null;
  why: "gap" | "insulator" | "switch" | "unscrewed";
}

export interface LoadResult extends CellRef {
  kind: TileKind;
  ohms: number;
  current: number;
  voltage: number;
  power: number;
  on: boolean;
  /** 0-1, for drawing the glow (1 = one bulb on one 1.5 V cell or more). */
  bright: number;
}

export interface SolveResult {
  batteries: number;
  short: boolean;
  /** Wire cells carrying the short-circuit current (drawn hot). */
  shortCells: CellRef[];
  loads: LoadResult[];
  allOn: boolean;
  anyOn: boolean;
  breaks: BreakMark[];
  /** Current out of the batteries (A); Infinity on a short. */
  batteryCurrent: number;
  /** Total voltage of the batteries in the circuit. */
  volts: number;
  /** A singular circuit (batteries fighting each other): treated as not working. */
  conflict: boolean;
}

export interface SolveOpts {
  closed: boolean;
  /** Loads taken out ("r,c"): bulbs unscrewed by the player. */
  out?: Set<string>;
}

export const cellKey = (r: number, c: number) => `${r},${c}`;

const MIN_I = 0.05;
const MIN_P = 0.02;
const P_REF = (CELL_VOLTS * CELL_VOLTS) / DEFAULT_OHMS.bulb; // 0.75 W

class UF {
  p: number[];
  constructor(n: number) {
    this.p = Array.from({ length: n }, (_, i) => i);
  }
  find(x: number): number {
    while (this.p[x] !== x) {
      this.p[x] = this.p[this.p[x]];
      x = this.p[x];
    }
    return x;
  }
  union(a: number, b: number) {
    const ra = this.find(a);
    const rb = this.find(b);
    if (ra !== rb) this.p[ra] = rb;
  }
}

/** Solves A x = b by Gaussian elimination with partial pivoting; null if singular. */
export function solveLinear(A: number[][], b: number[]): number[] | null {
  const n = b.length;
  const M = A.map((row, i) => [...row, b[i]]);
  for (let col = 0; col < n; col++) {
    let piv = col;
    for (let r = col + 1; r < n; r++) if (Math.abs(M[r][col]) > Math.abs(M[piv][col])) piv = r;
    if (Math.abs(M[piv][col]) < 1e-12) return null;
    [M[col], M[piv]] = [M[piv], M[col]];
    for (let r = 0; r < n; r++) {
      if (r === col) continue;
      const f = M[r][col] / M[col][col];
      if (f === 0) continue;
      for (let k = col; k <= n; k++) M[r][k] -= f * M[col][k];
    }
  }
  return M.map((row, i) => row[n] / row[i]);
}

/** A load taken out of the circuit (the game lets the player unscrew bulbs; tests take out any load). */
function isOut(t: Tile, r: number, c: number, opts: SolveOpts) {
  return isLoad(t) && !!opts.out?.has(cellKey(r, c));
}

export function solve(grid: Grid, opts: SolveOpts): SolveResult {
  const H = grid.length;
  const W = grid[0]?.length ?? 0;
  const node = (r: number, c: number, d: number) => (r * W + c) * 4 + d;
  const uf = new UF(H * W * 4);
  const breaks: BreakMark[] = [];
  const batteries: { r: number; c: number; neg: number; pos: number; volts: number }[] = [];
  const loads: { r: number; c: number; t: Tile; a: number; b: number; ohms: number }[] = [];

  for (let r = 0; r < H; r++) {
    for (let c = 0; c < W; c++) {
      const t = grid[r][c];
      if (!t) continue;
      const s = sides(t);
      // Joined neighbours.
      for (const d of s) {
        const rr = r + DR[d];
        const cc = c + DC[d];
        const n = rr >= 0 && rr < H && cc >= 0 && cc < W ? grid[rr][cc] : null;
        if (n && sides(n).includes(opp(d))) uf.union(node(r, c, d), node(rr, cc, opp(d)));
        else breaks.push({ r, c, dir: d, why: "gap" });
      }
      if (t.kind === "battery") batteries.push({ r, c, neg: node(r, c, s[0]), pos: node(r, c, s[1]), volts: t.volts ?? CELL_VOLTS });
      else if (isLoad(t)) {
        if (isOut(t, r, c, opts)) breaks.push({ r, c, dir: null, why: "unscrewed" });
        else loads.push({ r, c, t, a: node(r, c, s[0]), b: node(r, c, s[1]), ohms: t.ohms ?? DEFAULT_OHMS[t.kind] });
      } else if (isConductorTile(t, opts.closed)) {
        for (const d of s) uf.union(node(r, c, s[0]), node(r, c, d));
      } else if (t.kind === "material") breaks.push({ r, c, dir: null, why: "insulator" });
      else if (t.kind === "switch") breaks.push({ r, c, dir: null, why: "switch" });
    }
  }

  const base = {
    batteries: batteries.length,
    breaks,
    volts: batteries.reduce((s, b) => s + b.volts, 0),
  };
  const offLoads = (): LoadResult[] =>
    loads.map((l) => ({ r: l.r, c: l.c, kind: l.t.kind, ohms: l.ohms, current: 0, voltage: 0, power: 0, on: false, bright: 0 }));
  // Unscrewed bulbs are reported too (off).
  const outLoads = (): LoadResult[] => {
    const out: LoadResult[] = [];
    for (let r = 0; r < H; r++) for (let c = 0; c < W; c++) {
      const t = grid[r][c];
      if (t && isOut(t, r, c, opts)) out.push({ r, c, kind: t.kind, ohms: t.ohms ?? DEFAULT_OHMS[t.kind], current: 0, voltage: 0, power: 0, on: false, bright: 0 });
    }
    return out;
  };

  // 2. Short circuit.
  const shorted = batteries.filter((b) => uf.find(b.neg) === uf.find(b.pos));
  if (shorted.length) {
    const roots = new Set(shorted.map((b) => uf.find(b.pos)));
    const shortCells: CellRef[] = [];
    for (let r = 0; r < H; r++) for (let c = 0; c < W; c++) {
      const t = grid[r][c];
      if (t && t.kind !== "battery" && isConductorTile(t, opts.closed) && sides(t).some((d) => roots.has(uf.find(node(r, c, d))))) shortCells.push({ r, c });
    }
    return { ...base, short: true, shortCells, loads: [...offLoads(), ...outLoads()], allOn: false, anyOn: false, batteryCurrent: Infinity, conflict: false };
  }
  if (!batteries.length) {
    const ls = [...offLoads(), ...outLoads()];
    return { ...base, short: false, shortCells: [], loads: ls, allOn: false, anyOn: false, batteryCurrent: 0, conflict: false };
  }

  // 3. Modified nodal analysis.
  const ground = uf.find(batteries[0].neg);
  const idx = new Map<number, number>();
  const id = (n: number) => {
    const root = uf.find(n);
    if (root === ground) return -1;
    let i = idx.get(root);
    if (i === undefined) {
      i = idx.size;
      idx.set(root, i);
    }
    return i;
  };
  const loadIdx = loads.map((l) => [id(l.a), id(l.b)] as const);
  const batIdx = batteries.map((b) => [id(b.pos), id(b.neg)] as const);
  const n = idx.size;
  const m = batteries.length;
  const N = n + m;
  const A = Array.from({ length: N }, () => new Array<number>(N).fill(0));
  const z = new Array<number>(N).fill(0);
  for (let i = 0; i < n; i++) A[i][i] += 1e-9; // gmin keeps floating nodes defined
  loads.forEach((l, k) => {
    const g = 1 / l.ohms;
    const [a, b] = loadIdx[k];
    if (a >= 0) A[a][a] += g;
    if (b >= 0) A[b][b] += g;
    if (a >= 0 && b >= 0) {
      A[a][b] -= g;
      A[b][a] -= g;
    }
  });
  batteries.forEach((bt, k) => {
    const [p, q] = batIdx[k];
    const row = n + k;
    if (p >= 0) {
      A[p][row] += 1;
      A[row][p] += 1;
    }
    if (q >= 0) {
      A[q][row] -= 1;
      A[row][q] -= 1;
    }
    z[row] = bt.volts;
  });
  const x = solveLinear(A, z);
  if (!x) {
    return { ...base, short: false, shortCells: [], loads: [...offLoads(), ...outLoads()], allOn: false, anyOn: false, batteryCurrent: 0, conflict: true };
  }
  const V = (i: number) => (i < 0 ? 0 : x[i]);
  const results: LoadResult[] = loads.map((l, k) => {
    const [a, b] = loadIdx[k];
    const voltage = V(a) - V(b);
    const current = voltage / l.ohms;
    const power = current * current * l.ohms;
    const on = Math.abs(current) >= MIN_I && power >= MIN_P;
    return { r: l.r, c: l.c, kind: l.t.kind, ohms: l.ohms, current, voltage, power, on, bright: on ? Math.min(1, power / P_REF) : 0 };
  });
  const batteryCurrent = Math.max(...batteries.map((_, k) => Math.abs(x[n + k])));
  const real = results.filter((l) => l.kind !== "resistor");
  const all = [...results, ...outLoads()];
  // "Everything works": every bulb, motor and buzzer (or, on a board of only resistors, every resistor).
  const nonRes = all.filter((l) => l.kind !== "resistor");
  const counted = nonRes.length ? nonRes : all;
  return {
    ...base,
    short: false,
    shortCells: [],
    loads: all,
    allOn: counted.length > 0 && counted.every((l) => l.on),
    anyOn: (real.length ? real : results).some((l) => l.on),
    batteryCurrent,
    conflict: false,
  };
}

/* ---------------------------------------------------------------- Sparky's path */

export interface PathStep extends CellRef {
  /** Side Sparky comes in through (null at the battery start). */
  from: Dir | null;
  /** Side Sparky leaves through (null at the battery end). */
  to: Dir | null;
}

/**
 * Paths an electron (Sparky) can take: out of a battery's − end, through wires, conductors and
 * loads that carry current, and back into its + end. (Electrons drift from − to + outside the
 * battery; conventional current is drawn the other way.) Up to `max` different loops.
 */
export function sparkyPaths(grid: Grid, res: SolveResult, opts: SolveOpts, max = 6): PathStep[][] {
  if (res.short || !res.anyOn) return [];
  const H = grid.length;
  const W = grid[0].length;
  const lit = new Set(res.loads.filter((l) => l.on || (l.kind === "resistor" && Math.abs(l.current) >= MIN_I)).map((l) => cellKey(l.r, l.c)));
  const found: PathStep[][] = [];
  let budget = 20000;
  for (let br = 0; br < H; br++) for (let bc = 0; bc < W; bc++) {
    const bt = grid[br][bc];
    if (!bt || bt.kind !== "battery") continue;
    const [negD, posD] = sides(bt);
    const visited = new Set<string>([cellKey(br, bc)]);
    const path: PathStep[] = [{ r: br, c: bc, from: null, to: negD }];
    const dfs = (r: number, c: number, from: Dir) => {
      if (found.length >= max || --budget < 0) return;
      const t = grid[r]?.[c];
      if (!t || !sides(t).includes(from)) return;
      if (r === br && c === bc) {
        if (from === posD) found.push([...path, { r, c, from, to: null }]);
        return;
      }
      const key = cellKey(r, c);
      if (visited.has(key)) return;
      let exits: Dir[];
      if (t.kind === "wire") exits = sides(t).filter((d) => d !== from);
      else if (t.kind === "battery") {
        const [n2, p2] = sides(t);
        exits = from === p2 ? [n2] : [];
      } else if (isLoad(t)) exits = lit.has(key) && !isOut(t, r, c, opts) ? sides(t).filter((d) => d !== from) : [];
      else exits = isConductorTile(t, opts.closed) ? sides(t).filter((d) => d !== from) : [];
      visited.add(key);
      for (const d of exits) {
        path.push({ r, c, from, to: d });
        dfs(r + DR[d], c + DC[d], opp(d));
        path.pop();
      }
      visited.delete(key);
    };
    dfs(br + DR[negD], bc + DC[negD], opp(negD));
  }
  return found;
}

/* ---------------------------------------------------------------- formulas (checked by npm test) */

export const seriesR = (rs: number[]) => rs.reduce((s, r) => s + r, 0);
export const parallelR = (rs: number[]) => 1 / rs.reduce((s, r) => s + 1 / r, 0);
export const ohmsCurrent = (v: number, r: number) => v / r;
export const powerVI = (v: number, i: number) => v * i;

/** Rounds to a tidy number for display (up to 2 decimals). */
export function tidy(v: number): string {
  if (!Number.isFinite(v)) return "∞";
  const r = Math.round(v * 100) / 100;
  return String(r);
}
