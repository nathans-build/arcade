/*
 * Maze Muncher's game rules, with no DOM: the hero, the four critters, dots, answer pellets,
 * bonus items, scoring and the question cycle inside a maze. The engine draws it and the
 * checker runs it headless for thousands of steps.
 *
 * Question cycle in a maze:  ask (4 lettered pellets out) → power (right: critters dizzy,
 * edible) or rage (wrong: critters fired-up, right pellet revealed) → gap → ask …
 */
import type { Grade } from "../kit/types";
import {
  DX, DY, DIRS, canGo, cellAt, openDirs, opposite, pathDir, stepTile,
  type Dir, type Maze, type Tile, type Walker,
} from "./maze";
import { mazeFor, rageSpeed, tuningFor, type Tuning } from "./tuning";

export type CritterKind = "chase" | "ambush" | "patrol" | "random";

export interface CritterDef {
  name: string;
  kind: CritterKind;
  blurb: string;
}

/** Original critters: each has its own way of hunting. */
export const CRITTERS: CritterDef[] = [
  { name: "GLOOP", kind: "chase", blurb: "a green goo blob that heads straight for you" },
  { name: "FLIT", kind: "ambush", blurb: "a purple bat that swoops to where you're going" },
  { name: "PINCH", kind: "patrol", blurb: "an orange crab that patrols the bottom and pinches if you come close" },
  { name: "BOLT", kind: "random", blurb: "a cyan robot with a scrambled map that turns at random" },
];

export type CState = "pen" | "leaving" | "active" | "returning";

export interface Critter {
  id: number;
  kind: CritterKind;
  x: number;
  y: number;
  dir: Dir;
  state: CState;
  /** Seconds of play before this critter leaves the pen. */
  releaseIn: number;
  frightened: boolean;
  patrol: number;
  /** Home corner for scatter mode. */
  home: Tile;
}

export interface Hero {
  x: number;
  y: number;
  dir: Dir;
  /** The direction the player asked for; taken at the next opening. */
  want: Dir;
  /** Last direction actually moved (for the visor and the ambusher). */
  facing: Dir;
}

export type Phase = "ready" | "play" | "dying" | "cleared" | "waiting" | "over";
export type QPhase = "ask" | "power" | "rage" | "gap";

export type SimEvent =
  | { type: "dot" }
  | { type: "answer"; index: number; correct: boolean; auto: boolean }
  | { type: "question"; answer: number }
  | { type: "powerEnd" }
  | { type: "eat"; x: number; y: number; points: number }
  | { type: "item"; x: number; y: number; points: number; kind: number }
  | { type: "itemShow"; kind: number }
  | { type: "death" }
  | { type: "cleared" }
  | { type: "mazeReady"; level: number }
  | { type: "over" };

export const ITEM_POINTS = [100, 300, 500, 700, 1000, 2000, 3000, 5000];
/** Bonus items (original school-supply art): book, beaker, pencil, magnet, globe, ruler, apple, trophy. */
export const ITEM_NAMES = ["BOOK", "BEAKER", "PENCIL", "MAGNET", "GLOBE", "RULER", "APPLE", "TROPHY"];

const SUBSTEP = 1 / 120;

/** Keeps a column in [-0.5, cols - 0.5): half a tile past either edge you appear at the other. */
function wrapPos(x: number, cols: number): number {
  if (x < -0.5) return x + cols;
  if (x >= cols - 0.5) return x - cols;
  return x;
}
const HIT = 0.62;

export interface SimOptions {
  /** Called when a new question is dealt; returns the index (0–3) of the right answer. */
  ask?: () => number;
  rng?: () => number;
  /** Title-screen demo: the hero steers itself and nothing is lost. */
  demo?: boolean;
}

export class MazeSim {
  grade: Grade;
  level = 1;
  tuning: Tuning;
  maze: Maze;
  dots: Uint8Array = new Uint8Array(0);
  dotsLeft = 0;
  dotsTotal = 0;
  hero: Hero = { x: 0, y: 0, dir: -1, want: -1, facing: 1 };
  critters: Critter[] = [];
  phase: Phase = "ready";
  phaseT = 0;
  qPhase: QPhase = "gap";
  qT = 0;
  /** Which pellets (A–D) are still out. */
  pelletLive = [false, false, false, false];
  answerIdx = 0;
  /** The right pellet, shown after a wrong answer. */
  revealIdx = -1;
  /** Pellet the player picked last (for the flash). */
  pickedIdx = -1;
  score = 0;
  lives = 3;
  streak = 0;
  chain = 0;
  modeT = 0;
  playT = 0;
  item: { kind: number; t: number } | null = null;
  itemsShown = 0;
  events: SimEvent[] = [];
  demo: boolean;
  private rng: () => number;
  private ask: () => number;

  constructor(grade: Grade, opts: SimOptions = {}) {
    this.grade = grade;
    this.rng = opts.rng ?? Math.random;
    this.ask = opts.ask ?? (() => Math.floor(this.rng() * 4));
    this.demo = !!opts.demo;
    this.tuning = tuningFor(grade, 1);
    this.maze = mazeFor(grade, 1);
    this.newGame();
  }

  setAsk(fn: () => number) {
    this.ask = fn;
  }

  newGame() {
    this.score = 0;
    this.streak = 0;
    this.lives = tuningFor(this.grade, 1).lives;
    this.loadMaze(1);
  }

  /** Multiplier for eating critters: the current answer streak, up to ×5. */
  get multiplier(): number {
    return Math.max(1, Math.min(5, this.streak));
  }

  get chaseMode(): boolean {
    const { scatter, chase } = this.tuning;
    return this.modeT % (scatter + chase) >= scatter;
  }

  loadMaze(level: number) {
    this.level = level;
    this.tuning = tuningFor(this.grade, level);
    this.maze = mazeFor(this.grade, level);
    const m = this.maze;
    this.dots = new Uint8Array(m.cols * m.rows);
    for (const d of m.dots) this.dots[d.y * m.cols + d.x] = 1;
    this.dotsLeft = m.dots.length;
    this.dotsTotal = m.dots.length;
    this.item = null;
    this.itemsShown = 0;
    this.modeT = 0;
    this.resetPositions();
    this.phase = "ready";
    this.phaseT = this.tuning.ready;
    this.events.push({ type: "mazeReady", level });
    this.newQuestion();
  }

  /** Hero to the start, critters home; used at a maze start and after losing a life. */
  resetPositions() {
    const m = this.maze;
    this.hero = { x: m.hero.x, y: m.hero.y, dir: -1, want: -1, facing: 1 };
    const penY = m.door.y + 1;
    const slots = [m.door.x, m.door.x - 2, m.door.x + 2];
    this.playT = 0;
    this.critters = this.tuning.critters.map((kind, i) => {
      const k = CRITTERS[kind].kind;
      const outside = i === 0;
      const x = outside ? m.exit.x : slots[(i - 1) % slots.length];
      const home =
        k === "chase" ? { x: m.cols - 2, y: -3 } :
        k === "ambush" ? { x: 1, y: -3 } :
        k === "patrol" ? { x: m.cols - 2, y: m.rows + 2 } : { x: 1, y: m.rows + 2 };
      return {
        id: kind,
        kind: k,
        x,
        y: outside ? m.exit.y : penY,
        dir: outside ? 1 : -1,
        state: outside ? "active" : "pen",
        releaseIn: outside ? 0 : this.tuning.releaseGap * i,
        frightened: false,
        patrol: 0,
        home,
      } satisfies Critter;
    });
  }

  newQuestion() {
    this.answerIdx = this.ask();
    this.pelletLive = [true, true, true, true];
    this.revealIdx = -1;
    this.pickedIdx = -1;
    this.qPhase = "ask";
    this.qT = 0;
    this.events.push({ type: "question", answer: this.answerIdx });
  }

  /** Lock in answer `i` (eating pellet i, pressing its key, or tapping it). */
  answer(i: number, auto = false): boolean {
    if (this.qPhase !== "ask" || !this.pelletLive[i]) return false;
    if (this.phase !== "play" && this.phase !== "ready") return false;
    if (this.phase === "ready") this.phase = "play";
    const correct = i === this.answerIdx;
    this.pelletLive = [false, false, false, false];
    this.pickedIdx = i;
    this.events.push({ type: "answer", index: i, correct, auto });
    if (correct) {
      this.streak++;
      this.score += 50 * this.multiplier;
      this.qPhase = "power";
      this.qT = this.tuning.frightTime;
      this.chain = 0;
      for (const c of this.critters) {
        if (c.state === "returning") continue;
        c.frightened = true;
        if (c.state === "active") c.dir = opposite(c.dir);
      }
    } else {
      this.streak = 0;
      this.qPhase = "rage";
      this.qT = this.tuning.rageTime;
      this.revealIdx = this.answerIdx;
    }
    return true;
  }

  private endPower() {
    for (const c of this.critters) c.frightened = false;
    this.qPhase = "gap";
    this.qT = 1.5;
    this.revealIdx = -1;
    this.events.push({ type: "powerEnd" });
  }

  setWant(d: Dir) {
    this.hero.want = d;
    // Reversing is always instant.
    if (d >= 0 && this.hero.dir >= 0 && d === opposite(this.hero.dir)) this.hero.dir = d;
  }

  step(dt: number) {
    dt = Math.max(0, Math.min(0.05, dt));
    switch (this.phase) {
      case "ready":
        this.phaseT -= dt;
        if (this.phaseT <= 0) this.phase = "play";
        break;
      case "play":
        for (let left = dt; left > 1e-9; left -= SUBSTEP) {
          this.update(Math.min(SUBSTEP, left));
          if (this.phase !== "play") break;
        }
        break;
      case "dying":
        this.phaseT -= dt;
        if (this.phaseT <= 0) this.afterDeath();
        break;
      case "cleared":
        this.phaseT -= dt;
        if (this.phaseT <= 0) {
          this.phase = "waiting";
          this.events.push({ type: "cleared" });
        }
        break;
      default:
        break;
    }
  }

  /** After the checkpoint: the next maze (a bonus life for a right answer). */
  nextMaze(bonus: boolean) {
    if (bonus) {
      this.score += 500 * this.level;
      this.lives = Math.min(6, this.lives + 1);
    }
    this.loadMaze(this.level + 1);
  }

  private afterDeath() {
    if (!this.demo) this.lives--;
    if (this.lives <= 0) {
      this.phase = "over";
      this.events.push({ type: "over" });
      return;
    }
    if (this.qPhase === "power" || this.qPhase === "rage") this.endPower();
    this.resetPositions();
    this.phase = "ready";
    this.phaseT = 1.6;
  }

  private update(dt: number) {
    const t = this.tuning;
    this.playT += dt;
    if (this.qPhase !== "power") this.modeT += dt;
    if (this.qPhase === "power" || this.qPhase === "rage") {
      this.qT -= dt;
      if (this.qT <= 0) this.endPower();
    } else if (this.qPhase === "gap") {
      this.qT -= dt;
      if (this.qT <= 0) this.newQuestion();
    }
    if (this.item) {
      this.item.t -= dt;
      if (this.item.t <= 0) this.item = null;
    }

    if (this.demo && this.hero.dir < 0) this.autopilot(Math.round(this.hero.x), Math.round(this.hero.y));
    this.moveHero(t.heroSpeed * dt);

    for (const c of this.critters) {
      if (c.state === "pen") {
        c.releaseIn -= dt;
        if (c.releaseIn <= 0) c.state = "leaving";
        continue;
      }
      this.moveCritter(c, this.critterSpeed(c) * dt);
    }
    this.collide();
    if (this.phase === "play" && this.dotsLeft === 0) {
      this.phase = "cleared";
      this.phaseT = 2;
      for (const c of this.critters) c.frightened = false;
    }
  }

  critterSpeed(c: Critter): number {
    const t = this.tuning;
    if (c.state === "returning") return 12;
    if (c.state === "leaving") return Math.max(3, t.critterSpeed * 0.7);
    let s = c.frightened ? t.critterSpeed * 0.55 : this.qPhase === "rage" ? rageSpeed(t) : t.critterSpeed;
    if (this.inTunnel(c.x, c.y)) s *= 0.5;
    return s;
  }

  inTunnel(x: number, y: number): boolean {
    const m = this.maze;
    return m.tunnelRows.includes(Math.round(y)) && (x < 5 || x > m.cols - 6);
  }

  /* ---------------------------------------------------------------- movement */

  /**
   * Moves along the current direction, calling `atCenter` at every tile centre reached
   * (which may turn or stop). Positions wrap through tunnels.
   */
  private travel(e: { x: number; y: number; dir: Dir }, dist: number, atCenter: () => void) {
    const m = this.maze;
    let guard = 0;
    while (dist > 1e-9 && guard++ < 50) {
      if (e.dir < 0) {
        atCenter();
        if (e.dir < 0) return;
      }
      const horiz = e.dir === 1 || e.dir === 3;
      const sign = horiz ? DX[e.dir] : DY[e.dir];
      const pos = horiz ? e.x : e.y;
      const next = sign > 0 ? Math.floor(pos + 1e-9) + 1 : Math.ceil(pos - 1e-9) - 1;
      const d = Math.abs(next - pos);
      if (d > dist + 1e-7) {
        if (horiz) e.x = wrapPos(e.x + sign * dist, m.cols);
        else e.y += sign * dist;
        return;
      }
      dist = Math.max(0, dist - d);
      if (horiz) e.x = wrapPos(next, m.cols);
      else e.y = next;
      atCenter();
    }
  }

  private moveHero(dist: number) {
    const h = this.hero;
    const m = this.maze;
    if (h.dir < 0) {
      // Standing still (at a centre): go as soon as the wanted way is open.
      if (h.want >= 0 && canGo(m, Math.round(h.x), Math.round(h.y), h.want, "hero")) h.dir = h.want;
      else return;
    }
    this.travel(h, dist, () => {
      const x = Math.round(h.x);
      const y = Math.round(h.y);
      this.heroArrive(x, y);
      if (this.demo) this.autopilot(x, y);
      if (h.want >= 0 && canGo(m, x, y, h.want, "hero")) h.dir = h.want;
      else if (!canGo(m, x, y, h.dir, "hero")) h.dir = -1;
      if (h.dir >= 0) h.facing = h.dir;
    });
  }

  private heroArrive(x: number, y: number) {
    const m = this.maze;
    const k = y * m.cols + x;
    if (this.dots[k]) {
      this.dots[k] = 0;
      this.dotsLeft--;
      this.score += 10;
      this.events.push({ type: "dot" });
      const eaten = this.dotsTotal - this.dotsLeft;
      const thresholds = [Math.floor(this.dotsTotal * 0.3), Math.floor(this.dotsTotal * 0.7)];
      if (this.itemsShown < 2 && eaten >= thresholds[this.itemsShown]) {
        this.itemsShown++;
        const kind = (this.level - 1) % ITEM_POINTS.length;
        this.item = { kind, t: 9 };
        this.events.push({ type: "itemShow", kind });
      }
    }
    const p = m.pellets.findIndex((t) => t.x === x && t.y === y);
    if (p >= 0 && this.pelletLive[p]) this.answer(p);
    if (this.item && x === m.item.x && y === m.item.y) {
      const points = ITEM_POINTS[this.item.kind];
      this.score += points;
      this.events.push({ type: "item", x, y, points, kind: this.item.kind });
      this.item = null;
    }
  }

  private moveCritter(c: Critter, dist: number) {
    const who: Walker = c.state === "active" ? "critter" : "pen";
    this.travel(c, dist, () => this.critterArrive(c, who));
  }

  private critterArrive(c: Critter, who: Walker) {
    const m = this.maze;
    const x = Math.round(c.x);
    const y = Math.round(c.y);
    if (c.state === "leaving") {
      if (x === m.exit.x && y === m.exit.y) {
        c.state = "active";
        c.dir = this.rng() < 0.5 ? 1 : 3;
      } else {
        c.dir = pathDir(m, { x, y }, m.exit, "pen");
        return;
      }
    } else if (c.state === "returning") {
      const home = { x: m.door.x, y: m.door.y + 1 };
      if (x === home.x && y === home.y) {
        c.state = "leaving";
        c.frightened = false;
        c.dir = pathDir(m, { x, y }, m.exit, "pen");
      } else c.dir = pathDir(m, { x, y }, home, "pen");
      return;
    }
    c.dir = this.chooseDir(c, x, y, who === "pen" ? "critter" : who);
  }

  private chooseDir(c: Critter, x: number, y: number, who: Walker): Dir {
    const m = this.maze;
    const all = openDirs(m, x, y, who);
    if (all.length === 0) return -1;
    let opts = all.filter((d) => d !== opposite(c.dir));
    if (opts.length === 0) opts = all;
    if (opts.length === 1) return opts[0];
    if (c.frightened) return opts[Math.floor(this.rng() * opts.length)];
    if (c.kind === "random" && this.rng() < 0.65) return opts[Math.floor(this.rng() * opts.length)];
    const target = this.targetFor(c);
    let best = opts[0];
    let bestD = Infinity;
    for (const d of DIRS) {
      if (!opts.includes(d)) continue;
      const n = stepTile(m, x, y, d);
      const dd = (n.x - target.x) ** 2 + (n.y - target.y) ** 2;
      if (dd < bestD) {
        bestD = dd;
        best = d;
      }
    }
    return best;
  }

  targetFor(c: Critter): Tile {
    const m = this.maze;
    const h = { x: Math.round(this.hero.x), y: Math.round(this.hero.y) };
    const hunting = this.chaseMode || this.qPhase === "rage";
    if (c.kind === "patrol") {
      const near = (h.x - c.x) ** 2 + (h.y - c.y) ** 2 < 36;
      if (near && hunting) return h;
      const mid = Math.floor(m.rows / 2) + 2;
      const loop = [
        { x: 1, y: m.rows - 2 },
        { x: m.cols - 2, y: m.rows - 2 },
        { x: m.cols - 2, y: mid },
        { x: 1, y: mid },
      ];
      if ((loop[c.patrol].x - c.x) ** 2 + (loop[c.patrol].y - c.y) ** 2 < 9) c.patrol = (c.patrol + 1) % loop.length;
      return loop[c.patrol];
    }
    if (!hunting) return c.home;
    if (c.kind === "ambush") {
      const f = this.hero.facing >= 0 ? this.hero.facing : 1;
      return { x: h.x + DX[f] * 4, y: h.y + DY[f] * 4 };
    }
    return h;
  }

  private collide() {
    const h = this.hero;
    const m = this.maze;
    for (const c of this.critters) {
      if (c.state !== "active") continue;
      let dx = Math.abs(c.x - h.x);
      dx = Math.min(dx, m.cols - dx);
      const dy = Math.abs(c.y - h.y);
      if (dx * dx + dy * dy > HIT * HIT) continue;
      if (c.frightened) {
        const points = 200 * 2 ** Math.min(3, this.chain) * this.multiplier;
        this.chain++;
        this.score += points;
        c.frightened = false;
        c.state = "returning";
        this.events.push({ type: "eat", x: c.x, y: c.y, points });
      } else {
        this.phase = "dying";
        this.phaseT = 1.4;
        this.events.push({ type: "death" });
        return;
      }
    }
  }

  /* ---------------------------------------------------------------- demo / helpers */

  /** Demo hero: heads for the nearest dot, steering around critters that aren't dizzy. */
  private autopilot(sx: number, sy: number) {
    const h = this.hero;
    const m = this.maze;
    const danger = new Uint8Array(m.cols * m.rows);
    for (const c of this.critters) {
      if (c.state !== "active" || c.frightened) continue;
      const cx = Math.round(c.x);
      const cy = Math.round(c.y);
      for (let dy = -2; dy <= 2; dy++)
        for (let dx = -2; dx <= 2; dx++) {
          const x = cx + dx;
          const y = cy + dy;
          if (x >= 0 && y >= 0 && x < m.cols && y < m.rows && Math.abs(dx) + Math.abs(dy) <= 2) danger[y * m.cols + x] = 1;
        }
    }
    const start = sy * m.cols + sx;
    const seen = new Int16Array(m.cols * m.rows).fill(-1);
    const q: number[] = [start];
    seen[start] = 4;
    for (let i = 0; i < q.length; i++) {
      const cx = q[i] % m.cols;
      const cy = Math.floor(q[i] / m.cols);
      if (i > 0 && (this.dots[q[i]] || m.pellets.some((p, j) => this.pelletLive[j] && p.x === cx && p.y === cy))) {
        let k = q[i];
        let first: Dir = -1;
        while (k !== start) {
          const d = seen[k] as Dir;
          first = d;
          const back = stepTile(m, k % m.cols, Math.floor(k / m.cols), opposite(d));
          k = back.y * m.cols + back.x;
        }
        if (first >= 0) h.want = first;
        return;
      }
      for (const d of DIRS) {
        if (!canGo(m, cx, cy, d, "hero")) continue;
        const n = stepTile(m, cx, cy, d);
        const nk = n.y * m.cols + n.x;
        if (seen[nk] !== -1 || (danger[nk] && i > 0)) continue;
        seen[nk] = d;
        q.push(nk);
      }
    }
    // Boxed in: keep moving any open way but backwards.
    const opts = openDirs(m, sx, sy, "hero").filter((d) => d !== opposite(h.dir));
    if (opts.length) h.want = opts[Math.floor(this.rng() * opts.length)];
  }

  /** Tile type under a point (for drawing). */
  cell(x: number, y: number): string {
    return cellAt(this.maze, x, y);
  }

  /** Debug/playtest: eat every dot but one. */
  debugNearlyClear() {
    const m = this.maze;
    let kept = false;
    for (let i = 0; i < this.dots.length; i++) {
      if (!this.dots[i]) continue;
      const x = i % m.cols;
      const y = Math.floor(i / m.cols);
      const nextToHero = Math.abs(x - this.hero.x) + Math.abs(y - this.hero.y) === 1;
      if (!kept && nextToHero) {
        kept = true;
        continue;
      }
      this.dots[i] = 0;
    }
    if (!kept) {
      // Keep the first remaining dot instead.
      const idx = m.dots.map((d) => d.y * m.cols + d.x)[0];
      this.dots[idx] = 1;
    }
    this.dotsLeft = this.dots.reduce((a, b) => a + b, 0);
  }
}
