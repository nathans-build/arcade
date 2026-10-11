/*
 * Cipher Pursuit's game state and rules, with no DOM or canvas: the renderer draws it and
 * scripts/check-rules.ts drives it headless.
 *
 * World coordinates: `wy` grows up the road; the player's car is at wy = `dist` and is drawn at
 * screen y = PLAYER_Y. The screen is 320 x 200. The road's centre and half-width are a function
 * of wy, so everything ahead is known before it scrolls in.
 *
 * A run: DRIVE (dodge and splat the Smudge Gang) → APPROACH (a coded question; the road widens
 * into 4 lanes with an answer gate over each) → the gate row passes the car → DEBRIEF (the
 * gadget van delivers or drives off; the explanation shows) → DRIVE again. Wrong answers never
 * cost a life: only crashes do, and the approach and debrief stretches have no hazards.
 */
import type { CPQuestion, DriveCtx } from "./questions";

export const W = 320;
export const H = 200;
export const PLAYER_Y = 164;

export const GATE_CX = 160;
export const GATE_HALF = 148;
export const LANE_W = (GATE_HALF * 2) / 4;
export const GATE_LEFT = GATE_CX - GATE_HALF;

/** Which lane (0-3) a car at screen x is in when it passes under the gates. */
export function laneAt(x: number): number {
  return Math.max(0, Math.min(3, Math.floor((x - GATE_LEFT) / LANE_W)));
}
export function laneCenter(i: number): number {
  return GATE_LEFT + LANE_W * (i + 0.5);
}

export type Surface = "city" | "coast" | "water";
export const ZONES: Surface[] = ["city", "coast", "water"];
export const ZONE_NAMES: Record<Surface, string> = { city: "CITY ROAD", coast: "COASTAL ROAD", water: "RIVER RUN" };

export type Phase = "drive" | "approach" | "debrief" | "crash" | "over";
export type Gadget = "shield" | "turbo" | "smoke";
export const GADGET_NAMES: Record<Gadget, string> = { shield: "SHIELD", turbo: "TURBO", smoke: "SMOKE SCREEN" };
export type EnemyKind = "smudge" | "bumper" | "tailer" | "oil" | "log" | "fuel";

export interface Enemy {
  id: number;
  kind: EnemyKind;
  /** Offset from the road centre at its wy. */
  off: number;
  wy: number;
  vy: number;
  w: number;
  h: number;
  state: "live" | "splat";
  t: number;
  boat: boolean;
}

export interface Shot { x: number; wy: number; vy: number; alive: boolean }
export interface Fx { id: number; kind: "goo" | "spark" | "splash" | "smoke"; x: number; wy: number; t: number }
export interface Floater { text: string; x: number; wy: number; t: number; color: string }

export interface Checkpoint {
  n: number;
  announceWy: number;
  rampStart: number;
  gateWy: number;
  q: CPQuestion | null;
  lock: number | null;
  picked: number | null;
  correct: boolean | null;
}

export interface Van { mode: "deliver" | "leave"; t: number; side: 1 | -1; gadget: Gadget | null; given: boolean; x: number }

export interface Input { left: boolean; right: boolean; up: boolean; down: boolean; fire: boolean; targetX: number | null }

export type SimEvent =
  | { type: "announce"; q: CPQuestion; n: number }
  | { type: "lock"; lane: number }
  | { type: "result"; q: CPQuestion; lane: number; correct: boolean; points: number }
  | { type: "gadget"; gadget: Gadget }
  | { type: "splat"; points: number }
  | { type: "crash"; livesLeft: number }
  | { type: "shieldHit" }
  | { type: "bump" }
  | { type: "spin" }
  | { type: "fuel" }
  | { type: "lowFuel" }
  | { type: "fire" }
  | { type: "zone"; surface: Surface; stage: number }
  | { type: "vehicle"; boat: boolean }
  | { type: "extraLife" }
  | { type: "gameover"; score: number };

export interface SimOptions {
  /** 0 for K, 1-12. */
  gradeN: number;
  nextQuestion: (ctx: DriveCtx) => CPQuestion;
  rand?: () => number;
  /** Crashes are ignored (tests and automated playtests). */
  god?: boolean;
}

const MIN_SPEED = 60;
const MAX_SPEED = 140;
const START_SPEED = 100;
const MPH_PER_PX = 0.55;
const RAMP_UP = 220;
const RAMP_DOWN = 260;
const GATE_HOLD = 50;
const ROAD_HALF = 56;
const MAX_LIVES = 5;

const smooth = (t: number) => (t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t));

export class PursuitSim {
  readonly early: boolean;
  private r: () => number;
  private nextQ: (ctx: DriveCtx) => CPQuestion;
  god: boolean;

  phase: Phase = "drive";
  time = 0;
  dist = 0;
  x = GATE_CX;
  speed = START_SPEED;
  ctlSpeed = START_SPEED;
  fuel = 100;
  lives = 3;
  score = 0;
  level = 1;
  cleared = 0;
  correctCount = 0;
  streak = 0;
  splats = 0;
  boat = false;
  /** Index into ZONES of the zone the car is in. */
  zoneIndex = 0;

  shield = false;
  turbo = 0;
  smoke = 0;
  invuln = 0;
  spin = 0;
  crashT = 0;
  private fireCd = 0;
  private bumpCd = 0;
  private spawnT = 2;
  private scoreAcc = 0;
  private nextLife = 10000;
  private lowFuelWarned = false;
  private cruiseMph: number | null = null;
  private ids = 1;

  cp: Checkpoint;
  /** Recent checkpoints whose widened road may still be on screen. */
  ramps: Checkpoint[] = [];
  zones: { from: number; surface: Surface }[] = [{ from: -1e9, surface: "city" }];
  enemies: Enemy[] = [];
  shots: Shot[] = [];
  fx: Fx[] = [];
  floaters: Floater[] = [];
  van: Van | null = null;
  events: SimEvent[] = [];
  input: Input = { left: false, right: false, up: false, down: false, fire: false, targetX: null };

  constructor(opts: SimOptions) {
    this.early = opts.gradeN <= 2;
    this.r = opts.rand ?? Math.random;
    this.nextQ = opts.nextQuestion;
    this.god = !!opts.god;
    this.cp = this.schedule(1);
  }

  /* ------------------------------------------------------------ road */

  get driveLen(): number {
    // Distance of action between checkpoints (about 18-22 seconds at cruising speed).
    return this.early ? 1700 : 2000;
  }

  private schedule(n: number): Checkpoint {
    const announceWy = this.dist + this.driveLen;
    return { n, announceWy, rampStart: announceWy + 175, gateWy: Infinity, q: null, lock: null, picked: null, correct: null };
  }

  /** 0 = normal road, 1 = fully widened 4-lane checkpoint. */
  widen(wy: number): number {
    let f = 0;
    for (const c of [this.cp, ...this.ramps]) {
      if (!Number.isFinite(c.gateWy)) continue;
      if (wy < c.rampStart || wy > c.gateWy + GATE_HOLD + RAMP_DOWN) continue;
      const up = smooth((wy - c.rampStart) / RAMP_UP);
      const down = 1 - smooth((wy - c.gateWy - GATE_HOLD) / RAMP_DOWN);
      f = Math.max(f, Math.min(up, down));
    }
    return f;
  }

  baseCenter(wy: number): number {
    const amp = this.early ? 14 : Math.min(30, 16 + this.level * 3);
    return GATE_CX + amp * Math.sin(wy / 520) + (this.early ? 5 : 10) * Math.sin(wy / 210 + 1.3);
  }

  surfaceAt(wy: number): Surface {
    let s: Surface = "city";
    for (const z of this.zones) if (z.from <= wy) s = z.surface;
    return s;
  }

  roadAt(wy: number): { cx: number; half: number; f: number; surface: Surface } {
    const f = this.widen(wy);
    const surface = this.surfaceAt(wy);
    const baseHalf = (this.early ? ROAD_HALF + 10 : ROAD_HALF) + (surface === "water" ? 8 : 0);
    return { cx: this.baseCenter(wy) * (1 - f) + GATE_CX * f, half: baseHalf * (1 - f) + GATE_HALF * f, f, surface };
  }

  /** Screen y of a world position. */
  sy(wy: number): number {
    return PLAYER_Y - (wy - this.dist);
  }

  get mph(): number {
    if (this.cruiseMph !== null && (this.phase === "approach" || this.phase === "debrief")) return this.cruiseMph;
    return Math.round(this.speed * MPH_PER_PX);
  }

  get stage(): number {
    return Math.floor(this.cleared / 2) + 1;
  }

  /* ------------------------------------------------------------ player actions */

  /** Lock in an answer lane (keys 1-4 / A-D or a tap): the car steers itself there. */
  choose(lane: number): boolean {
    if (this.phase !== "approach" || lane < 0 || lane > 3) return false;
    this.cp.lock = lane;
    this.events.push({ type: "lock", lane });
    return true;
  }

  /** Leave the debrief and drive on to the next stretch. */
  continueDrive(): boolean {
    if (this.phase !== "debrief") return false;
    if (this.van && this.van.mode === "deliver" && !this.van.given) this.giveGadget();
    this.van = null;
    this.phase = "drive";
    this.cruiseMph = null;
    if (this.cleared % 2 === 0) {
      this.zoneIndex = (this.cleared / 2) % ZONES.length;
      this.zones.push({ from: this.dist + 260, surface: ZONES[this.zoneIndex] });
      this.level = Math.min(6, 1 + this.cleared / 2);
      this.events.push({ type: "zone", surface: ZONES[this.zoneIndex], stage: this.stage });
    }
    this.ramps = [this.cp, ...this.ramps].slice(0, 2);
    this.cp = this.schedule(this.cp.n + 1);
    this.spawnT = 1.6;
    return true;
  }

  /** Testing/playtest helper: jump to just before the next checkpoint is announced. */
  skipToCheckpoint() {
    if (this.phase !== "drive") return;
    this.dist = Math.max(this.dist, this.cp.announceWy - 4);
    this.enemies = [];
    this.x = this.roadAt(this.dist).cx;
  }

  /* ------------------------------------------------------------ update */

  update(dt: number) {
    dt = Math.min(dt, 0.05);
    this.time += dt;
    if (this.phase === "over") {
      this.speed = Math.max(0, this.speed - 80 * dt);
      this.dist += this.speed * dt;
      this.ageFx(dt);
      return;
    }
    const inp = this.input;
    const driving = this.phase === "drive";

    if (driving) {
      this.turbo = Math.max(0, this.turbo - dt);
      this.smoke = Math.max(0, this.smoke - dt);
      this.invuln = Math.max(0, this.invuln - dt);
    }
    this.spin = Math.max(0, this.spin - dt);
    this.fireCd -= dt;
    this.bumpCd -= dt;

    // Speed
    let target: number;
    if (this.phase === "drive") {
      if (inp.up) this.ctlSpeed += 90 * dt;
      if (inp.down) this.ctlSpeed -= 90 * dt;
      this.ctlSpeed = Math.max(MIN_SPEED, Math.min(MAX_SPEED, this.ctlSpeed));
      target = this.ctlSpeed;
      if (this.fuel <= 0) target = Math.min(target, MIN_SPEED);
      if (this.turbo > 0) target += 60;
    } else if (this.phase === "approach") {
      target = this.cp.lock !== null || inp.up ? 150 : this.early ? 60 : 70;
    } else if (this.phase === "debrief") {
      target = 80;
    } else {
      target = 0;
    }
    const acc = this.phase === "crash" ? 260 : 150;
    this.speed += Math.max(-acc * dt, Math.min(acc * dt, target - this.speed));
    this.dist += this.speed * dt;
    if (driving) {
      this.scoreAcc += this.speed * dt;
      while (this.scoreAcc >= 10) {
        this.scoreAcc -= 10;
        this.addScore(1);
      }
    }

    // Steering
    if (this.phase !== "crash") {
      const steer = this.early ? 105 : 120;
      if (this.spin > 0) {
        this.x += Math.sin(this.time * 18) * 70 * dt;
      } else {
        const keys = (inp.right ? 1 : 0) - (inp.left ? 1 : 0);
        // Steering by hand cancels a locked-in lane.
        if (keys !== 0 && this.phase === "approach" && this.cp.lock !== null) this.cp.lock = null;
        if (this.phase === "approach" && this.cp.lock !== null) {
          const tx = laneCenter(this.cp.lock);
          this.x += Math.max(-150 * dt, Math.min(150 * dt, tx - this.x));
        } else if (keys !== 0) {
          this.x += keys * steer * dt;
        } else if (inp.targetX !== null) {
          this.x += Math.max(-steer * dt, Math.min(steer * dt, inp.targetX - this.x));
        }
      }
      this.x = Math.max(6, Math.min(W - 6, this.x));
    }

    // Road edges
    const road = this.roadAt(this.dist);
    const lim = road.half - 6;
    if (this.phase !== "crash" && Math.abs(this.x - road.cx) > lim) {
      const hard = this.phase === "drive" && !this.early && road.f < 0.02 && this.invuln <= 0 && !this.god;
      if (hard && !this.shield) {
        this.x = road.cx + Math.sign(this.x - road.cx) * lim;
        this.crash();
      } else {
        if (hard && this.shield) {
          this.shield = false;
          this.invuln = 1;
          this.events.push({ type: "shieldHit" });
        }
        this.x = road.cx + Math.sign(this.x - road.cx) * lim;
        if (this.bumpCd <= 0) {
          this.events.push({ type: "bump" });
          this.bumpCd = 0.6;
        }
      }
    }

    // Boat or car
    const boat = road.surface === "water";
    if (boat !== this.boat) {
      this.boat = boat;
      this.events.push({ type: "vehicle", boat });
      this.fx.push({ id: this.ids++, kind: "splash", x: this.x, wy: this.dist, t: 0 });
    }

    // Fuel
    if (driving) {
      this.fuel = Math.max(0, this.fuel - dt * 1.05 * (this.speed / 100));
      if (this.fuel < 25 && !this.lowFuelWarned) {
        this.lowFuelWarned = true;
        this.events.push({ type: "lowFuel" });
      }
      if (this.fuel >= 25) this.lowFuelWarned = false;
    }

    // Foam blaster
    if (inp.fire && this.fireCd <= 0 && (this.phase === "drive" || this.phase === "debrief")) {
      this.fireCd = 0.28;
      this.shots.push({ x: this.x, wy: this.dist + 10, vy: this.speed + 230, alive: true });
      this.events.push({ type: "fire" });
    }

    // Spawning
    if (driving) {
      this.spawnT -= dt;
      if (this.spawnT <= 0 && this.dist < this.cp.announceWy - 260) {
        this.spawn();
        const base = this.early ? 2.3 : Math.max(0.75, 1.6 - this.level * 0.13);
        this.spawnT = base * (0.7 + this.r() * 0.6);
      }
    }

    this.updateEnemies(dt);
    this.updateShots(dt);
    if (driving) this.collide();

    // Checkpoints
    if (this.phase === "drive" && this.dist >= this.cp.announceWy) this.announce();
    if (this.phase === "approach" && this.dist >= this.cp.gateWy) this.resolve();

    // Crash timer
    if (this.phase === "crash") {
      this.crashT -= dt;
      if (this.crashT <= 0) this.respawn();
    }

    // Van
    if (this.van) {
      const v = this.van;
      v.t += dt;
      if (v.mode === "deliver" && !v.given && v.t >= 1.3) this.giveGadget();
      if (v.mode === "leave" && v.t > 3) this.van = null;
    }

    this.ageFx(dt);
  }

  private ageFx(dt: number) {
    for (const f of this.fx) f.t += dt;
    this.fx = this.fx.filter((f) => f.t < 0.9);
    for (const f of this.floaters) {
      f.t += dt;
      f.wy += 30 * dt + this.speed * dt;
    }
    this.floaters = this.floaters.filter((f) => f.t < 1.2);
  }

  private addScore(p: number) {
    this.score += p;
    if (this.score >= this.nextLife) {
      this.nextLife += 10000;
      if (this.lives < MAX_LIVES) {
        this.lives++;
        this.events.push({ type: "extraLife" });
      }
    }
  }

  private spawn() {
    const r = this.r;
    const water = this.surfaceAt(this.dist + 200) === "water";
    const lowFuel = this.fuel < 40;
    const weights: [EnemyKind, number][] = [
      ["smudge", 5],
      ["bumper", this.early ? 0 : 1 + this.level * 0.4],
      ["tailer", !this.early && this.level >= 2 ? 0.8 + this.level * 0.2 : 0],
      [water ? "log" : "oil", this.early ? 1.2 : 2],
      ["fuel", lowFuel ? 2.4 : 0.6],
    ];
    const total = weights.reduce((s, [, w]) => s + w, 0);
    let x = r() * total;
    let kind: EnemyKind = "smudge";
    for (const [k, w] of weights) {
      x -= w;
      if (x <= 0) {
        kind = k;
        break;
      }
    }
    const wy = kind === "tailer" ? this.dist - 52 : this.dist + PLAYER_Y + 24;
    const road = this.roadAt(wy);
    const size = kind === "oil" ? [16, 9] : kind === "log" ? [22, 6] : kind === "fuel" ? [8, 9] : [10, 15];
    const room = road.half - size[0] / 2 - 6;
    let off = (r() * 2 - 1) * room;
    if (kind === "tailer") {
      const pOff = this.x - this.roadAt(this.dist).cx;
      if (Math.abs(off - pOff) < 22) off = pOff + (pOff > 0 ? -28 : 28);
      off = Math.max(-room, Math.min(room, off));
    }
    let vy = 0;
    if (kind === "smudge" || kind === "bumper") vy = 25 + r() * 30 + this.level * 4;
    if (kind === "tailer") vy = this.speed + 40 + this.level * 4;
    this.enemies.push({ id: this.ids++, kind, off, wy, vy, w: size[0], h: size[1], state: "live", t: 0, boat: water });
  }

  enemyX(e: Enemy): number {
    return this.roadAt(e.wy).cx + e.off;
  }

  private updateEnemies(dt: number) {
    for (const e of this.enemies) {
      e.t += dt;
      if (e.state !== "live") continue;
      e.wy += e.vy * dt;
      if (e.kind === "bumper") {
        const s = this.sy(e.wy);
        if (s > 20 && s < PLAYER_Y - 12) {
          const pOff = this.x - this.roadAt(e.wy).cx;
          e.off += Math.max(-24 * dt, Math.min(24 * dt, pOff - e.off));
        }
      }
      // Smoke screen: the gang loses track and spins into goo.
      if (this.smoke > 0 && e.kind !== "fuel" && e.kind !== "oil" && e.kind !== "log") {
        const dx = this.enemyX(e) - this.x;
        const dy = e.wy - this.dist;
        if (Math.abs(dx) < 34 && Math.abs(dy) < 48) this.splat(e, 50);
      }
    }
    this.enemies = this.enemies.filter((e) => {
      const s = this.sy(e.wy);
      return s < H + 70 && s > -80;
    });
  }

  private updateShots(dt: number) {
    for (const s of this.shots) {
      s.wy += s.vy * dt;
      if (this.sy(s.wy) < -8) s.alive = false;
      if (!s.alive) continue;
      for (const e of this.enemies) {
        if (e.state !== "live" || !(e.kind === "smudge" || e.kind === "bumper" || e.kind === "tailer")) continue;
        if (Math.abs(this.enemyX(e) - s.x) < e.w / 2 + 3 && Math.abs(e.wy - s.wy) < e.h / 2 + 4) {
          s.alive = false;
          this.splat(e, 100);
          break;
        }
      }
    }
    this.shots = this.shots.filter((s) => s.alive);
  }

  private splat(e: Enemy, base: number) {
    e.state = "splat";
    e.vy = 0;
    e.t = 0;
    const pts = base * this.level;
    this.splats++;
    this.addScore(pts);
    const x = this.enemyX(e);
    this.fx.push({ id: this.ids++, kind: "goo", x, wy: e.wy, t: 0 });
    this.floaters.push({ text: `+${pts}`, x, wy: e.wy + 8, t: 0, color: "#5fff8a" });
    this.events.push({ type: "splat", points: pts });
  }

  private collide() {
    for (const e of this.enemies) {
      if (e.state !== "live") continue;
      const ex = this.enemyX(e);
      if (Math.abs(ex - this.x) > (e.w + 8) / 2 - 1 || Math.abs(e.wy - this.dist) > (e.h + 14) / 2 - 2) continue;
      if (e.kind === "fuel") {
        e.state = "splat";
        e.wy = -1e9;
        this.fuel = Math.min(100, this.fuel + 35);
        this.floaters.push({ text: "FUEL +", x: ex, wy: this.dist + 12, t: 0, color: "#ffd23f" });
        this.events.push({ type: "fuel" });
        continue;
      }
      if (e.kind === "oil") {
        if (this.turbo > 0 || this.spin > 0) continue;
        this.spin = 0.9;
        this.events.push({ type: "spin" });
        continue;
      }
      // A car or a floating log.
      if (this.turbo > 0 && e.kind !== "log") {
        this.splat(e, 100);
        continue;
      }
      if (this.invuln > 0 || this.god) {
        if (e.kind !== "log") this.splat(e, 0);
        continue;
      }
      if (this.shield) {
        this.shield = false;
        this.invuln = 1.2;
        if (e.kind !== "log") this.splat(e, 50);
        else e.state = "splat";
        this.events.push({ type: "shieldHit" });
        continue;
      }
      this.crash();
      return;
    }
  }

  private crash() {
    if (this.god) return;
    this.phase = "crash";
    this.crashT = 1.4;
    this.lives--;
    this.streak = 0;
    this.turbo = 0;
    this.smoke = 0;
    this.fx.push({ id: this.ids++, kind: "spark", x: this.x, wy: this.dist, t: 0 });
    this.events.push({ type: "crash", livesLeft: this.lives });
  }

  private respawn() {
    if (this.lives <= 0) {
      this.phase = "over";
      this.events.push({ type: "gameover", score: this.score });
      return;
    }
    this.phase = "drive";
    this.x = this.roadAt(this.dist).cx;
    this.invuln = 2.5;
    this.spin = 0;
    this.speed = Math.max(this.speed, 50);
    this.enemies = this.enemies.filter((e) => e.state !== "live" || Math.abs(e.wy - this.dist) > 140);
    // Coming back right at a checkpoint: give the checkpoint a little room.
    if (this.cp.announceWy - this.dist < 120) this.cp.announceWy = this.dist + 160;
    this.cp.rampStart = this.cp.announceWy + 175;
  }

  private announce() {
    const q = this.nextQ({ mph: this.mph, fuelPct: this.fuel });
    const cp = this.cp;
    cp.q = q;
    const longest = Math.max(...q.choices.map((c) => c.length));
    const read = Math.min(16, Math.max(7, 4 + q.prompt.length / 9 + longest / 4)) + (this.early ? 5 : 0);
    const cruise = this.early ? 60 : 70;
    cp.rampStart = this.dist + 175;
    cp.gateWy = this.dist + Math.max(640, cruise * read);
    this.cruiseMph = q.meta.kind === "drt" ? q.meta.speed : this.mph;
    this.phase = "approach";
    // The gang scatters when a code checkpoint comes up: the approach is hazard-free.
    for (const e of this.enemies) if (e.state === "live") this.fx.push({ id: this.ids++, kind: "smoke", x: this.enemyX(e), wy: e.wy, t: 0 });
    this.enemies = this.enemies.filter((e) => e.state !== "live");
    this.events.push({ type: "announce", q, n: cp.n });
  }

  private resolve() {
    const cp = this.cp;
    const q = cp.q!;
    const lane = laneAt(this.x);
    const correct = lane === q.answer;
    cp.picked = lane;
    cp.correct = correct;
    this.cleared++;
    let points = 0;
    if (correct) {
      this.correctCount++;
      this.streak++;
      points = 500 * this.level + 100 * (this.streak - 1);
      this.addScore(points);
      this.fuel = 100;
      const order: Gadget[] = ["shield", "turbo", "smoke"];
      const gadget = order[(this.correctCount - 1) % 3];
      this.van = { mode: "deliver", t: 0, side: this.x < GATE_CX ? 1 : -1, gadget, given: false, x: this.x };
      this.floaters.push({ text: `+${points}`, x: this.x, wy: this.dist + 20, t: 0, color: "#ffd23f" });
    } else {
      this.streak = 0;
      this.van = { mode: "leave", t: 0, side: 1, gadget: null, given: false, x: laneCenter(q.answer) };
    }
    this.phase = "debrief";
    this.events.push({ type: "result", q, lane, correct, points });
  }

  private giveGadget() {
    const v = this.van;
    if (!v || v.given || !v.gadget) return;
    v.given = true;
    if (v.gadget === "shield") this.shield = true;
    if (v.gadget === "turbo") this.turbo = 6;
    if (v.gadget === "smoke") this.smoke = 7;
    this.events.push({ type: "gadget", gadget: v.gadget });
  }

  drainEvents(): SimEvent[] {
    const e = this.events;
    this.events = [];
    return e;
  }
}
