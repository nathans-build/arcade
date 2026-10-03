/*
 * Sonar Squad rules data: the fleet, boards, placement and shot resolution.
 * Pure TypeScript (no DOM), shared by the game, the computer players and the tests.
 *
 * A board is `size` x `size` spots (10 for K-5, 11 for grade 6+ where the spots are the
 * crossings from -5 to 5). Spots are indexed `r * size + c`, row 0 at the top.
 */

export type Rng = () => number;

export interface Coord {
  r: number;
  c: number;
}
export type Orient = "h" | "v";

export interface ShipDef {
  id: string;
  name: string;
  len: number;
}

/** Our own fleet: five original subs and boats (lengths 5, 4, 3, 3, 2). */
export const FLEET: ShipDef[] = [
  { id: "dragon", name: "Sea Dragon", len: 5 },
  { id: "narwhal", name: "Narwhal", len: 4 },
  { id: "turtle", name: "Sea Turtle Sub", len: 3 },
  { id: "manta", name: "Manta Ray", len: 3 },
  { id: "puffer", name: "Puffer", len: 2 },
];

export interface Placement {
  id: string;
  r: number;
  c: number;
  o: Orient;
}

/** What a player knows about one enemy spot. */
export const UNKNOWN = 0;
export const MISS = 1;
export const HIT = 2;
export const SUNK = 3;
export type ShotMark = 0 | 1 | 2 | 3;

export const idx = (size: number, r: number, c: number) => r * size + c;
export const toCoord = (size: number, i: number): Coord => ({ r: Math.floor(i / size), c: i % size });
export const onBoard = (size: number, r: number, c: number) => r >= 0 && c >= 0 && r < size && c < size;

export function defOf(id: string): ShipDef {
  const d = FLEET.find((s) => s.id === id);
  if (!d) throw new Error(`unknown ship ${id}`);
  return d;
}

export function shipCells(p: Placement, len: number): Coord[] {
  return Array.from({ length: len }, (_, k) => (p.o === "h" ? { r: p.r, c: p.c + k } : { r: p.r + k, c: p.c }));
}

/**
 * Can a ship of `len` go at (r, c) facing `o`? `taken` holds the spots already used.
 * With `noTouch`, it must not touch another ship, even corner to corner.
 */
export function fits(size: number, taken: Set<number>, r: number, c: number, o: Orient, len: number, noTouch = false): boolean {
  for (let k = 0; k < len; k++) {
    const rr = o === "h" ? r : r + k;
    const cc = o === "h" ? c + k : c;
    if (!onBoard(size, rr, cc) || taken.has(idx(size, rr, cc))) return false;
    if (noTouch) {
      for (let dr = -1; dr <= 1; dr++)
        for (let dc = -1; dc <= 1; dc++) {
          const nr = rr + dr;
          const nc = cc + dc;
          if (onBoard(size, nr, nc) && taken.has(idx(size, nr, nc))) return false;
        }
    }
  }
  return true;
}

/** Problems with a full fleet placement (empty list = valid). Overlap and off-board are never allowed. */
export function placementProblems(size: number, placements: Placement[]): string[] {
  const out: string[] = [];
  const taken = new Set<number>();
  const ids = new Set(placements.map((p) => p.id));
  for (const d of FLEET) if (!ids.has(d.id)) out.push(`missing ${d.name}`);
  if (placements.length !== FLEET.length) out.push(`expected ${FLEET.length} ships, got ${placements.length}`);
  for (const p of placements) {
    const d = defOf(p.id);
    if (!fits(size, taken, p.r, p.c, p.o, d.len)) out.push(`${d.name} does not fit`);
    for (const cell of shipCells(p, d.len)) taken.add(idx(size, cell.r, cell.c));
  }
  return out;
}

/** A random legal fleet. The computer and AUTO place ships so that no two touch. */
export function randomFleet(size: number, rng: Rng, noTouch = true): Placement[] {
  for (let attempt = 0; attempt < 200; attempt++) {
    const taken = new Set<number>();
    const out: Placement[] = [];
    let ok = true;
    for (const d of FLEET) {
      let placed = false;
      for (let t = 0; t < 300 && !placed; t++) {
        const o: Orient = rng() < 0.5 ? "h" : "v";
        const r = Math.floor(rng() * size);
        const c = Math.floor(rng() * size);
        if (fits(size, taken, r, c, o, d.len, noTouch)) {
          const p = { id: d.id, r, c, o };
          out.push(p);
          for (const cell of shipCells(p, d.len)) taken.add(idx(size, cell.r, cell.c));
          placed = true;
        }
      }
      if (!placed) {
        ok = false;
        break;
      }
    }
    if (ok) return out;
  }
  throw new Error("could not place fleet");
}

export interface ShipState {
  def: ShipDef;
  place: Placement;
  cells: number[];
  hits: Set<number>;
}

export type ShotResult = "miss" | "hit" | "sunk";

/** One player's hidden fleet. */
export class Fleet {
  ships: ShipState[];
  /** Spot index -> ship index, or -1 for open water. */
  at: number[];

  constructor(public readonly size: number, placements: Placement[]) {
    const problems = placementProblems(size, placements);
    if (problems.length) throw new Error(`bad fleet: ${problems.join("; ")}`);
    this.at = new Array(size * size).fill(-1);
    this.ships = placements.map((p, si) => {
      const def = defOf(p.id);
      const cells = shipCells(p, def.len).map((c) => idx(size, c.r, c.c));
      cells.forEach((i) => (this.at[i] = si));
      return { def, place: p, cells, hits: new Set<number>() };
    });
  }

  isSunk(s: ShipState) {
    return s.hits.size === s.cells.length;
  }

  receive(i: number): { result: ShotResult; ship?: ShipState } {
    const si = this.at[i];
    if (si < 0) return { result: "miss" };
    const ship = this.ships[si];
    ship.hits.add(i);
    return { result: this.isSunk(ship) ? "sunk" : "hit", ship };
  }

  allSunk() {
    return this.ships.every((s) => this.isSunk(s));
  }

  remaining(): number[] {
    return this.ships.filter((s) => !this.isSunk(s)).map((s) => s.def.len);
  }

  /** The square a repair would fix: the latest hit on the most damaged ship still afloat. */
  repairable(): number | null {
    const afloat = this.ships.filter((s) => s.hits.size > 0 && !this.isSunk(s));
    if (!afloat.length) return null;
    afloat.sort((a, b) => b.hits.size - a.hits.size);
    return [...afloat[0].hits].pop() ?? null;
  }

  repair(i: number): boolean {
    const si = this.at[i];
    if (si < 0) return false;
    const ship = this.ships[si];
    if (this.isSunk(ship) || !ship.hits.has(i)) return false;
    ship.hits.delete(i);
    return true;
  }

  /** Ship spots inside the 3x3 area around (r, c) that are not hit yet. */
  sonarCount(r: number, c: number): number {
    let n = 0;
    for (let dr = -1; dr <= 1; dr++)
      for (let dc = -1; dc <= 1; dc++) {
        const rr = r + dr;
        const cc = c + dc;
        if (!onBoard(this.size, rr, cc)) continue;
        const i = idx(this.size, rr, cc);
        const si = this.at[i];
        if (si >= 0 && !this.ships[si].hits.has(i)) n++;
      }
    return n;
  }
}

/** What a shooter may know about the enemy board: its own shot marks and which ship lengths are still afloat. */
export interface TargetView {
  size: number;
  shots: ShotMark[];
  remaining: number[];
}

/** Seeded random numbers (mulberry32) for tests and simulations. */
export function seeded(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
