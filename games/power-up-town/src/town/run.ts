import type { Band } from "./common";

/*
 * Sparky's Run: a scrolling maze bonus. Sparky is an electron, so it can only travel along
 * conductors. Map key:
 *   =  copper path         +  battery (start)       B  the bulb (goal)
 *   #  rubber insulator (wall)                       .  plastic board (insulator, wall)
 *   r  resistor (Sparky slows down)                  c  charge pad (speed boost)
 *   s  switch pad (closes / opens every switch gap)  g  switch gap (only a path while closed)
 *   h  hot wire (too hot to cross until a fan cools it)  f  cooling fan pad (cools every hot wire)
 *   *  spark to collect     P  Superconductor Dash   U  Fuse Shield
 * Every tile Sparky may stand on is a conductor; npm test checks that the bulb can be reached
 * from the battery along conductors only (no power-ups needed).
 */

export const RUN_TILE = 20;

export const RUN_MAPS: { name: string; rows: string[] }[] = [
  {
    name: "Main Street Wires",
    rows: [
      "################################",
      "#+====*======r=====*========*=##",
      "#=##########=#####=#########=###",
      "#=#*=====c===#...#=====*====#=##",
      "#=#=##########...###########=#=#",
      "#=#=====*=====r======c=======#=#",
      "#=##########=#######=#########=#",
      "#===*====r===#.....#====*=====B#",
      "#############.................##",
      "################################",
    ],
  },
  {
    name: "Switchyard",
    rows: [
      "################################",
      "#+===*====s=######====*=====r=##",
      "#=#######=#=#....#=#########==##",
      "#=#*==r===#=g====*=#...#*====g##",
      "#=#=#######=######=#...#=#######",
      "#=#=====c===P=====r=====s=====##",
      "#=#########=######=#######=#####",
      "#====*=====*#....#===*====g===B#",
      "#############....###############",
      "################################",
    ],
  },
  {
    name: "Hot Wire Alley",
    rows: [
      "################################",
      "#+===*===r===h===*====h=====*B##",
      "#=######=###=#######=#=#######=#",
      "#=#....#=#.#=#.....#=#=#.....#=#",
      "#=#....#=#.#=#.....#=#=#.....#=#",
      "#===*===f==c====U===*===r=====##",
      "#=#######=######=#######=#####.#",
      "#==*==r===#....#===*===c=#.....#",
      "##########......############...#",
      "################################",
    ],
  },
  {
    name: "Power Plant Run",
    rows: [
      "################################",
      "#+==*==r==s==h===*===g===c==*=B#",
      "#=#######=#=#=#####=#=#######=##",
      "#=#*====P=#=#=#...#=#=#*===r==##",
      "#=#=#######=#=#...#=#=#=########",
      "#===*==c====f==U==*=g===*=====##",
      "#=##########=#####=#=#########=#",
      "#===r==*=====#...#=r==*==s====##",
      "##############...###############",
      "################################",
    ],
  },
];

export const WALKABLE = new Set(["=", "+", "B", "r", "c", "s", "g", "h", "f", "*", "P", "U"]);
/** Every walkable tile is a conductor (copper path, metal pads, resistor, switch contacts). */
export const CONDUCTOR_TILES = WALKABLE;

export type RDir = 0 | 1 | 2 | 3;
const DR = [-1, 0, 1, 0];
const DC = [0, 1, 0, -1];

export function mapGrid(i: number): string[][] {
  const rows = RUN_MAPS[i % RUN_MAPS.length].rows;
  const w = Math.max(...rows.map((r) => r.length));
  return rows.map((r) => r.padEnd(w, "#").split(""));
}

export function findTile(g: string[][], ch: string): [number, number] {
  for (let r = 0; r < g.length; r++) for (let c = 0; c < g[r].length; c++) if (g[r][c] === ch) return [r, c];
  throw new Error(`no ${ch}`);
}

/** Can Sparky stand on this tile right now? */
export function passable(ch: string | undefined, gatesClosed: boolean, cooled: boolean, shield = 0): boolean {
  if (!ch || !WALKABLE.has(ch)) return false;
  if (ch === "g") return gatesClosed;
  if (ch === "h") return cooled || shield > 0;
  return true;
}

/**
 * Shortest route from the battery to the bulb, with no power-ups, as a list of moves.
 * State = (tile, switch gaps closed?, wires cooled?). null if the bulb can't be reached.
 */
export function routeToBulb(g: string[][]): RDir[] | null {
  const [sr, sc] = findTile(g, "+");
  const key = (r: number, c: number, gc: boolean, co: boolean) => `${r},${c},${gc ? 1 : 0},${co ? 1 : 0}`;
  const prev = new Map<string, { from: string | null; dir: RDir | null }>();
  const q: [number, number, boolean, boolean][] = [[sr, sc, false, false]];
  prev.set(key(sr, sc, false, false), { from: null, dir: null });
  while (q.length) {
    const [r, c, gc, co] = q.shift()!;
    const k = key(r, c, gc, co);
    if (g[r][c] === "B") {
      const dirs: RDir[] = [];
      let cur: string | null = k;
      while (cur) {
        const p: { from: string | null; dir: RDir | null } = prev.get(cur)!;
        if (p.dir !== null) dirs.unshift(p.dir);
        cur = p.from;
      }
      return dirs;
    }
    for (const d of [0, 1, 2, 3] as RDir[]) {
      const nr = r + DR[d];
      const nc = c + DC[d];
      const ch = g[nr]?.[nc];
      if (!passable(ch, gc, co)) continue;
      const ngc = ch === "s" ? !gc : gc;
      const nco = co || ch === "f";
      const nk = key(nr, nc, ngc, nco);
      if (prev.has(nk)) continue;
      prev.set(nk, { from: k, dir: d });
      q.push([nr, nc, ngc, nco]);
    }
  }
  return null;
}

export function runTimer(band: Band): number | null {
  return band === "k2" ? null : band === "g35" ? 70 : band === "g68" ? 60 : 55;
}

export type RunEvent =
  | { type: "spark" }
  | { type: "boost" }
  | { type: "switch"; closed: boolean }
  | { type: "cool" }
  | { type: "hot" }
  | { type: "power"; kind: "dash" | "shield" }
  | { type: "shield-used" }
  | { type: "goal"; stars: number }
  | { type: "timeout"; stars: number };

export class RunSim {
  readonly grid: string[][];
  readonly mapIndex: number;
  readonly band: Band;
  r: number;
  c: number;
  /** 0-1 progress toward the next tile. */
  t = 0;
  dir: RDir | null = null;
  want: RDir | null = null;
  gatesClosed = false;
  cooled = false;
  boost = 0;
  dash = 0;
  shield = 0;
  hotMsg = 0;
  /** Sparky stops briefly on a switch or fan pad (click!), then goes the way the player steers. */
  pause = 0;
  time = 0;
  readonly limit: number | null;
  sparks = 0;
  readonly sparkTotal: number;
  done = false;
  stars = 0;
  private events: RunEvent[] = [];
  /** Tiles already collected ("r,c"). */
  taken = new Set<string>();

  constructor(mapIndex: number, band: Band) {
    this.mapIndex = mapIndex % RUN_MAPS.length;
    this.grid = mapGrid(this.mapIndex);
    this.band = band;
    [this.r, this.c] = findTile(this.grid, "+");
    this.limit = runTimer(band);
    this.sparkTotal = this.grid.flat().filter((ch) => ch === "*").length;
  }

  drainEvents(): RunEvent[] {
    const e = this.events;
    this.events = [];
    return e;
  }

  tileAt(r: number, c: number): string | undefined {
    const ch = this.grid[r]?.[c];
    if (!ch) return undefined;
    if ((ch === "*" || ch === "P" || ch === "U") && this.taken.has(`${r},${c}`)) return "=";
    return ch;
  }

  canGo(d: RDir): boolean {
    return passable(this.tileAt(this.r + DR[d], this.c + DC[d]), this.gatesClosed, this.cooled, this.shield);
  }

  speed(): number {
    const base = this.band === "k2" ? 4 : 5;
    const here = this.tileAt(this.r, this.c);
    const slow = here === "r" && this.dash <= 0 ? 0.4 : 1;
    const fast = this.dash > 0 ? 1.5 : this.boost > 0 ? 1.6 : 1;
    return base * slow * fast;
  }

  /** Steer: Sparky turns this way as soon as it can and keeps going. */
  steer(d: RDir) {
    this.want = d;
    if (this.dir !== null && d === ((this.dir + 2) % 4) && this.t > 0) {
      // Reverse in the middle of a tile.
      this.r += DR[this.dir];
      this.c += DC[this.dir];
      this.t = 1 - this.t;
      this.dir = d;
    }
  }

  update(dt: number) {
    if (this.done) return;
    this.time += dt;
    this.boost = Math.max(0, this.boost - dt);
    this.dash = Math.max(0, this.dash - dt);
    this.hotMsg = Math.max(0, this.hotMsg - dt);
    if (this.limit !== null && this.time >= this.limit) {
      this.done = true;
      this.stars = this.sparks >= this.sparkTotal ? 1 : 0;
      this.events.push({ type: "timeout", stars: this.stars });
      return;
    }
    if (this.pause > 0) {
      this.pause = Math.max(0, this.pause - dt);
      return;
    }
    let move = this.speed() * dt;
    for (let guard = 0; move > 0 && guard < 8 && !this.done; guard++) {
      if (this.t === 0) {
        // At a tile centre: pick a direction.
        if (this.want !== null && this.want !== this.dir && this.tryDir(this.want)) this.dir = this.want;
        else if (this.dir === null || !this.tryDir(this.dir)) {
          if (this.want !== null && this.dir !== this.want && this.tryDir(this.want)) this.dir = this.want;
          else {
            this.dir = this.dir !== null && this.tryDir(this.dir) ? this.dir : null;
            if (this.dir === null) return;
          }
        }
      }
      const step = Math.min(move, 1 - this.t);
      this.t += step;
      move -= step;
      if (this.t >= 1 - 1e-9) {
        this.r += DR[this.dir!];
        this.c += DC[this.dir!];
        this.t = 0;
        this.arrive();
      }
    }
  }

  /** Checks a move; a hot wire blocks Sparky (and says so) unless it's cooled or shielded. */
  private tryDir(d: RDir): boolean {
    const ch = this.tileAt(this.r + DR[d], this.c + DC[d]);
    if (ch === "h" && !this.cooled && this.shield <= 0) {
      if (this.hotMsg <= 0) this.events.push({ type: "hot" });
      this.hotMsg = 1.2;
      return false;
    }
    return this.canGo(d);
  }

  private arrive() {
    const k = `${this.r},${this.c}`;
    const ch = this.tileAt(this.r, this.c);
    switch (ch) {
      case "*":
        this.taken.add(k);
        this.sparks++;
        this.events.push({ type: "spark" });
        break;
      case "c":
        this.boost = 3;
        this.events.push({ type: "boost" });
        break;
      case "s":
        this.gatesClosed = !this.gatesClosed;
        this.events.push({ type: "switch", closed: this.gatesClosed });
        this.pause = 0.4;
        break;
      case "f":
        if (!this.cooled) this.events.push({ type: "cool" });
        this.cooled = true;
        this.pause = 0.4;
        break;
      case "h":
        if (!this.cooled && this.shield > 0) {
          this.shield--;
          this.events.push({ type: "shield-used" });
        }
        break;
      case "P":
        this.taken.add(k);
        this.dash = 6;
        this.events.push({ type: "power", kind: "dash" });
        break;
      case "U":
        this.taken.add(k);
        this.shield++;
        this.events.push({ type: "power", kind: "shield" });
        break;
      case "B": {
        this.done = true;
        const fast = this.limit === null || this.time <= this.limit * 0.6;
        this.stars = 1 + (this.sparks >= this.sparkTotal ? 1 : 0) + (fast ? 1 : 0);
        this.events.push({ type: "goal", stars: this.stars });
        break;
      }
    }
  }

  /** Drawing position in tiles (fractional). */
  pos(): [number, number] {
    if (this.dir === null || this.t === 0) return [this.r, this.c];
    return [this.r + DR[this.dir] * this.t, this.c + DC[this.dir] * this.t];
  }
}
