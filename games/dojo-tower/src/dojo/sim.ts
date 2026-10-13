import { towerPlan, type FloorPlan } from "./bosses";
import { MIXED } from "./focus";
import type { Band } from "./qmake";
import {
  FLOORS,
  METER_MAX,
  STAR_BURST,
  STAR_COOLDOWN,
  STAR_GOAL,
  onThrowerDefeated,
  applyAnswer,
  enemyPoints,
  floorBonus,
  newFight,
  newStreak,
  resolveBossAnswer,
  scrollPoints,
  spendThunder,
  type BossResult,
  type EnemyKind,
  type Fight,
  type Streak,
} from "./rules";

/*
 * Dojo Tower's simulation: the student, the Ink Ninjas, the floor masters and the floor flow.
 * No DOM or canvas here, so scripts/check-rules.ts can play it headlessly. Heights (`y`) are
 * measured up from the floor; `x` is the position along the floor (world pixels, 320 per screen).
 * Odd floors are crossed left to right, even floors right to left, like the classic tower climbs.
 * Ten floors; floors 6-10 bring slightly busier, quicker waves (gentler for K-2).
 * Ink-star burst: poof STAR_GOAL star-throwing ninjas and the student can throw foam ink stars with S
 * for STAR_BURST seconds of running time. They poof ninjas, blobs and incoming stars, never a master.
 */

export const VIEW_W = 320;
export const VIEW_H = 200;
export const GROUND = 178;
export const MAX_ENERGY = 10;
export const START_LIVES = 3;
const ARENA = 210;
const WALK = 72;
const JUMP_V = 240;
const GRAVITY = 720;
const PLAYER_HW = 6;
const PLAYER_H = 28;
const DUCK_H = 17;
const STAR_SPEED = 210;
const STAR_GOAL_N = STAR_GOAL;

export type Mode = "intro" | "run" | "scroll" | "bossIntro" | "boss" | "bossDown" | "dying" | "over" | "won";
export type Press = "jump" | "punch" | "kick" | "thunder" | "star";
export type SoundName =
  | "punch" | "kick" | "hit" | "hurt" | "jump" | "thunder" | "scroll" | "correct" | "wrong" | "block"
  | "bossDown" | "floor" | "over" | "won" | "ready" | "throw" | "deflect" | "bossIn" | "star" | "burst";

export type SimEvent =
  | { type: "sound"; name: SoundName }
  | { type: "poof"; x: number; y: number; ink?: boolean; big?: boolean }
  | { type: "floater"; text: string; x: number; y: number; color: string }
  | { type: "shake"; amt: number }
  | { type: "flash" }
  | { type: "scroll" }
  | { type: "bossStart" }
  | { type: "bossDown" }
  | { type: "floorStart"; floor: number }
  | { type: "lifeLost" }
  | { type: "gameOver" }
  | { type: "towerCleared" }
  | { type: "starBurst" }
  | { type: "burstEnd" };

export interface Attack {
  kind: "punch" | "kick";
  t: number;
  dur: number;
  low: boolean;
  air: boolean;
}

export interface Player {
  x: number;
  y: number;
  vy: number;
  facing: 1 | -1;
  ducking: boolean;
  walking: boolean;
  walkT: number;
  attack: Attack | null;
  invuln: number;
  hurtT: number;
  /** Throwing-arm pose timer (ink stars). */
  throwT: number;
}

export interface Enemy {
  id: number;
  kind: EnemyKind;
  x: number;
  y: number;
  facing: 1 | -1;
  hw: number;
  h: number;
  speed: number;
  t: number;
  stunT: number;
  knock: number;
  throwT: number;
  windup: number;
}

export interface Shot {
  id: number;
  x: number;
  y: number;
  vx: number;
  high: boolean;
}

/** A foam ink star thrown by the student. `y` is its height above the floor. */
export interface InkStar {
  id: number;
  x: number;
  y: number;
  vx: number;
}

export type BossAnimKind = "enter" | "combo" | "thunder" | "block" | "down";
export interface BossAnim {
  kind: BossAnimKind;
  t: number;
  dur: number;
}

export interface Hud {
  score: number;
  lives: number;
  energy: number;
  floor: number;
  meter: number;
  streak: number;
  mode: Mode;
  bossHp: number;
  bossMaxHp: number;
  progress: number;
  /** Star-throwers poofed toward the next ink-star burst (0..STAR_GOAL). */
  stars: number;
  /** Seconds of ink-star burst left (0 = none). */
  burst: number;
}

interface BandCfg {
  len: number;
  spawn: number;
  maxOn: number;
  speed: number;
  shot: number;
  throwEvery: number;
}

const CFG: Record<Band, BandCfg> = {
  k2: { len: 960, spawn: 2.7, maxOn: 2, speed: 30, shot: 62, throwEvery: 2.8 },
  g35: { len: 1120, spawn: 1.9, maxOn: 3, speed: 38, shot: 78, throwEvery: 2.2 },
  g68: { len: 1220, spawn: 1.55, maxOn: 4, speed: 44, shot: 88, throwEvery: 1.9 },
  hs: { len: 1300, spawn: 1.35, maxOn: 5, speed: 48, shot: 96, throwEvery: 1.7 },
};

/** Floors 1-5 play as they always did; each floor above adds a little (less for K-2). */
function extraFloors(floor: number): number {
  return Math.max(0, floor - 5);
}

interface Beat {
  at: number;
  ev: SimEvent[];
}

export class DojoSim {
  readonly band: Band;
  readonly cfg: BandCfg;
  private rng: () => number;
  events: SimEvent[] = [];

  mode: Mode = "intro";
  modeT = 0;
  floor = 1;
  dir: 1 | -1 = 1;
  len: number;
  score = 0;
  lives = START_LIVES;
  energy = MAX_ENERGY;
  streak: Streak = newStreak();
  fight: Fight | null = null;
  lastBoss: BossResult | null = null;
  /** Test hook: no damage from ninjas. */
  invincible = false;
  /** The ten floors: scenery, hall and floor master (MIXED unless a subject was picked). */
  readonly plan: FloorPlan[];
  /** Star-throwers poofed toward the next ink-star burst. */
  starCount = 0;
  /** Seconds of ink-star burst left (counts down only while running the floor). */
  burstT = 0;
  stars: InkStar[] = [];
  private starCD = 0;

  player: Player = this.freshPlayer(0);
  enemies: Enemy[] = [];
  shots: Shot[] = [];
  camX = 0;
  held = { left: false, right: false, down: false };

  bossX = 0;
  bossVisible = false;
  bossAnim: BossAnim | null = null;
  private beats: Beat[] = [];
  private nextId = 1;
  private spawnT = 1.5;
  private scrollsLeft: number[] = [];
  private advance = false;
  private time = 0;

  constructor(band: Band, opts: { rng?: () => number; plan?: FloorPlan[]; floor?: number } = {}) {
    this.band = band;
    this.cfg = CFG[band];
    this.len = this.cfg.len;
    this.rng = opts.rng ?? Math.random;
    this.plan = opts.plan ?? towerPlan(MIXED);
    this.startFloor(Math.max(1, Math.min(FLOORS, opts.floor ?? 1)));
  }

  /** This floor's plan: scenery, hall and floor master. */
  get info(): FloorPlan {
    return this.plan[this.floor - 1];
  }

  /** Ninjas at a time on this floor. */
  get maxOn(): number {
    const x = extraFloors(this.floor);
    return this.cfg.maxOn + (this.band !== "k2" && x >= 2 ? 1 : 0);
  }

  /** Ninja walking speed on this floor. */
  get enemySpeed(): number {
    const x = extraFloors(this.floor);
    return this.cfg.speed + (Math.min(this.floor, 5) - 1) * 3 + x * (this.band === "k2" ? 1 : 2.5);
  }

  /** Seconds between ninjas on this floor (before the random spread). */
  spawnGap(r: number): number {
    const x = extraFloors(this.floor);
    const gap = this.cfg.spawn * (0.75 + r * 0.5) - (Math.min(this.floor, 5) - 1) * 0.08 - x * (this.band === "k2" ? 0.02 : 0.06);
    return Math.max(this.band === "k2" ? 1.4 : 0.6, gap);
  }

  /** Distance travelled along this floor (0 at the start, len at the boss end). */
  progressOf(x: number): number {
    return this.dir > 0 ? x : this.len - x;
  }

  get fightX(): number {
    return this.bossX - this.dir * 92;
  }

  private freshPlayer(x: number): Player {
    return { x, y: 0, vy: 0, facing: 1, ducking: false, walking: false, walkT: 0, attack: null, invuln: 0, hurtT: 0, throwT: 0 };
  }

  private emit(...ev: SimEvent[]) {
    this.events.push(...ev);
  }

  private setMode(m: Mode) {
    this.mode = m;
    this.modeT = 0;
  }

  startFloor(n: number) {
    this.floor = n;
    this.dir = n % 2 === 1 ? 1 : -1;
    this.len = this.cfg.len + (Math.min(n, 5) - 1) * 40 + extraFloors(n) * (this.band === "k2" ? 20 : 40);
    const startX = this.dir > 0 ? 36 : this.len - 36;
    this.player = this.freshPlayer(startX);
    this.player.facing = this.dir;
    this.energy = MAX_ENERGY;
    this.enemies = [];
    this.shots = [];
    this.stars = [];
    this.fight = null;
    this.lastBoss = null;
    this.bossAnim = null;
    this.beats = [];
    this.bossVisible = false;
    this.bossX = this.dir > 0 ? this.len - 52 : 52;
    this.spawnT = 1.6;
    this.advance = false;
    const runLen = this.len - ARENA;
    this.scrollsLeft = [0.28, 0.62].map((f) => f * runLen);
    this.updateCamera(true);
    this.setMode("intro");
    this.emit({ type: "floorStart", floor: n }, { type: "sound", name: "floor" });
  }

  // ------------------------------------------------------------------ input

  press(a: Press) {
    if (this.mode !== "run") return;
    const p = this.player;
    if (a === "jump") {
      if (p.y === 0 && !this.held.down) {
        p.ducking = false;
        p.vy = JUMP_V;
        p.y = 0.01;
        this.emit({ type: "sound", name: "jump" });
      }
      return;
    }
    if (a === "thunder") {
      this.thunder();
      return;
    }
    if (a === "star") {
      this.throwStar();
      return;
    }
    if (p.attack) return;
    const air = p.y > 0;
    p.attack = { kind: a, t: 0, dur: a === "punch" ? 0.22 : 0.3, low: p.ducking && !air, air };
    this.emit({ type: "sound", name: a });
  }

  private thunder() {
    const s = spendThunder(this.streak);
    if (!s) {
      this.emit({ type: "floater", text: `ANSWER ${METER_MAX} IN A ROW!`, x: this.player.x, y: 50, color: "#6ea0ff" });
      return;
    }
    this.streak = s;
    this.emit({ type: "flash" }, { type: "shake", amt: 4 }, { type: "sound", name: "thunder" });
    this.emit({ type: "floater", text: "THUNDER KICK!", x: this.player.x, y: 46, color: "#ffd23f" });
    const visible = this.enemies.filter((e) => e.x > this.camX - 10 && e.x < this.camX + VIEW_W + 10);
    for (const e of visible) this.defeat(e, true);
    this.shots = [];
  }

  /** S: throw a foam ink star along the floor (only during a burst, with a short cooldown). */
  private throwStar() {
    const p = this.player;
    if (this.burstT <= 0) {
      this.emit({ type: "floater", text: `POOF ${this.starGoalLeft()} MORE STAR NINJAS!`, x: p.x, y: 50, color: "#9ae8ff" });
      return;
    }
    if (this.starCD > 0) return;
    this.starCD = STAR_COOLDOWN;
    p.throwT = 0.16;
    const y = p.ducking ? 7 : p.y + 13;
    this.stars.push({ id: this.nextId++, x: p.x + p.facing * 8, y, vx: p.facing * STAR_SPEED });
    this.emit({ type: "sound", name: "star" });
  }

  private starGoalLeft(): number {
    return Math.max(1, STAR_GOAL_N - this.starCount);
  }

  // ------------------------------------------------------------------ answers

  /** The ninja's scroll question was answered (the UI plays the right/wrong sound when it is picked). */
  answerScroll(correct: boolean) {
    if (this.mode !== "scroll") return;
    const { streak, filled } = applyAnswer(this.streak, correct);
    this.streak = streak;
    const p = this.player;
    if (correct) {
      const pts = scrollPoints(true, this.floor);
      this.score += pts;
      this.energy = Math.min(MAX_ENERGY, this.energy + 2);
      this.emit({ type: "floater", text: `+${pts} +ENERGY`, x: p.x, y: 60, color: "#5fff8a" });
      if (filled) this.emit({ type: "floater", text: "THUNDER READY! PRESS T", x: p.x, y: 72, color: "#ffd23f" }, { type: "sound", name: "ready" });
    }
    p.invuln = Math.max(p.invuln, 1);
    this.setMode("run");
  }

  /** A boss question was answered. Returns what happened (null if no boss fight is on). */
  answerBoss(correct: boolean): BossResult | null {
    if (this.mode !== "boss" || !this.fight) return null;
    const r = resolveBossAnswer(this.fight, this.streak, correct, this.floor);
    this.fight = r.fight;
    this.streak = r.streak;
    this.lastBoss = r.result;
    this.score += r.result.points;
    const res = r.result;
    const bx = this.bossX;
    if (!correct) {
      this.startAnim("block", 0.9, [
        { at: 0.18, ev: [{ type: "sound", name: "block" }, { type: "floater", text: "BLOCKED!", x: bx, y: 70, color: "#ff8a8a" }] },
      ]);
      this.emit({ type: "sound", name: "wrong" });
    } else if (res.thunder) {
      this.startAnim("thunder", 1.4, [
        { at: 0.45, ev: [{ type: "flash" }, { type: "shake", amt: 5 }, { type: "sound", name: "thunder" }, { type: "floater", text: "THUNDER KICK!", x: bx, y: 64, color: "#ffd23f" }] },
        { at: 0.7, ev: [{ type: "floater", text: `-${res.damage} HP  +${res.points}`, x: bx, y: 78, color: "#5fff8a" }] },
      ]);
      this.emit({ type: "sound", name: "correct" });
    } else {
      const combo = this.fight.combo;
      this.startAnim("combo", 1.0, [
        { at: 0.3, ev: [{ type: "sound", name: "hit" }, { type: "poof", x: bx, y: 22, ink: true }] },
        { at: 0.45, ev: [{ type: "sound", name: "hit" }, { type: "floater", text: combo > 1 ? `${combo}-HIT COMBO!` : "HIT!", x: bx, y: 64, color: "#ffd23f" }] },
        { at: 0.6, ev: [{ type: "sound", name: "kick" }, { type: "floater", text: `+${res.points}`, x: bx, y: 78, color: "#5fff8a" }] },
      ]);
      this.emit({ type: "sound", name: "correct" });
    }
    return res;
  }

  /** After the boss is beaten and the player has read the last answer: climb on. */
  finishFloor() {
    if (this.fight && this.fight.hp <= 0) this.advance = true;
  }

  private startAnim(kind: BossAnimKind, dur: number, beats: Beat[]) {
    this.bossAnim = { kind, t: 0, dur };
    this.beats = beats;
  }

  // ------------------------------------------------------------------ update

  update(dt: number) {
    this.time += dt;
    this.modeT += dt;
    const p = this.player;
    p.invuln = Math.max(0, p.invuln - dt);
    p.hurtT = Math.max(0, p.hurtT - dt);
    p.throwT = Math.max(0, p.throwT - dt);
    if (this.bossAnim) {
      this.bossAnim.t += dt;
      const due = this.beats.filter((b) => b.at <= this.bossAnim!.t);
      if (due.length) {
        this.beats = this.beats.filter((b) => b.at > this.bossAnim!.t);
        for (const b of due) this.emit(...b.ev);
      }
    }

    switch (this.mode) {
      case "intro":
        if (this.modeT > 2.2) this.setMode("run");
        break;
      case "run":
        this.updateRun(dt);
        break;
      case "scroll":
        break;
      case "bossIntro":
        this.updateBossIntro(dt);
        break;
      case "boss":
        p.x = this.fightX;
        p.facing = this.dir;
        if (this.bossAnim && this.bossAnim.t >= this.bossAnim.dur) {
          this.bossAnim = null;
          if (this.fight && this.fight.hp <= 0) {
            this.setMode("bossDown");
            this.bossAnim = { kind: "down", t: 0, dur: 1.4 };
            this.score += floorBonus(this.energy, this.floor);
            this.emit(
              { type: "sound", name: "bossDown" },
              { type: "poof", x: this.bossX, y: 26, big: true },
              { type: "floater", text: `FLOOR ${this.floor} CLEAR! +${floorBonus(this.energy, this.floor)}`, x: this.bossX - this.dir * 46, y: 50, color: "#ffd23f" },
              { type: "bossDown" },
            );
          }
        }
        break;
      case "bossDown":
        if (this.bossAnim && this.bossAnim.t >= this.bossAnim.dur) {
          this.bossAnim = null;
          this.bossVisible = false;
        }
        if (!this.bossAnim && this.advance) {
          if (this.floor >= FLOORS) {
            this.burstT = 0;
            this.score += this.lives * 1000;
            this.setMode("won");
            this.emit({ type: "sound", name: "won" }, { type: "towerCleared" });
          } else {
            this.startFloor(this.floor + 1);
          }
        }
        break;
      case "dying":
        p.y = Math.max(0, p.y - 60 * dt);
        if (this.modeT > 1.6) {
          this.lives--;
          if (this.lives <= 0) {
            this.setMode("over");
            this.emit({ type: "sound", name: "over" }, { type: "gameOver" });
          } else {
            this.energy = MAX_ENERGY;
            this.enemies = [];
            this.shots = [];
            this.stars = [];
            p.invuln = 2.5;
            p.attack = null;
            p.y = 0;
            p.vy = 0;
            this.setMode("run");
            this.emit({ type: "lifeLost" });
          }
        }
        break;
      default:
        break;
    }
    this.updateCamera(false);
  }

  private updateCamera(snap: boolean) {
    let target: number;
    if (this.mode === "bossIntro" || this.mode === "boss" || this.mode === "bossDown" || this.mode === "won") {
      target = this.dir > 0 ? this.len - VIEW_W : 0;
    } else {
      target = this.player.x - VIEW_W / 2 + this.dir * 50;
    }
    target = Math.max(0, Math.min(this.len - VIEW_W, target));
    this.camX = snap ? target : this.camX + (target - this.camX) * 0.15;
    if (Math.abs(this.camX - target) < 0.5) this.camX = target;
  }

  private playerBox() {
    const p = this.player;
    const h = p.ducking ? DUCK_H : PLAYER_H;
    return { x0: p.x - PLAYER_HW, x1: p.x + PLAYER_HW, y0: p.y, y1: p.y + h };
  }

  /** The attack's hit box while it is active, or null. */
  attackBox(): { x0: number; x1: number; y0: number; y1: number } | null {
    const p = this.player;
    const a = p.attack;
    if (!a) return null;
    const [on, off] = a.kind === "punch" ? [0.03, 0.14] : [0.05, 0.19];
    if (a.t < on || a.t > off) return null;
    const reach = a.kind === "punch" ? 22 : 28;
    let y0: number;
    let y1: number;
    if (a.air) [y0, y1] = a.kind === "punch" ? [p.y + 14, p.y + 24] : [p.y + 2, p.y + 14];
    else if (a.low) [y0, y1] = a.kind === "punch" ? [5, 12] : [0, 7];
    else [y0, y1] = a.kind === "punch" ? [16, 24] : [9, 19];
    const xa = p.x + p.facing * 3;
    const xb = p.x + p.facing * reach;
    return { x0: Math.min(xa, xb), x1: Math.max(xa, xb), y0, y1 };
  }

  private updateRun(dt: number) {
    const p = this.player;

    // Player movement
    const onGround = p.y === 0;
    p.ducking = this.held.down && onGround;
    const busy = !!p.attack && onGround;
    let mv = 0;
    if (this.held.left && !this.held.right) mv = -1;
    if (this.held.right && !this.held.left) mv = 1;
    if (mv !== 0 && !busy) p.facing = mv as 1 | -1;
    p.walking = mv !== 0 && !p.ducking && !busy;
    if (p.walking || (!onGround && mv !== 0)) p.x += mv * WALK * dt;
    if (p.walking) p.walkT += dt;
    if (p.hurtT > 0) p.x -= p.facing * 40 * dt;
    p.x = Math.max(10, Math.min(this.len - 10, p.x));
    if (!onGround) {
      p.vy -= GRAVITY * dt;
      p.y += p.vy * dt;
      if (p.y <= 0) {
        p.y = 0;
        p.vy = 0;
      }
    }
    if (p.attack) {
      p.attack.t += dt;
      if (p.attack.t >= p.attack.dur || (p.attack.air && p.y === 0)) p.attack = null;
    }

    // Spawning
    const prog = this.progressOf(p.x);
    if (prog < this.len - ARENA - 60) {
      this.spawnT -= dt;
      if (this.spawnT <= 0 && this.enemies.filter((e) => e.kind !== "scroll").length < this.maxOn) {
        this.spawn(this.pickKind(), this.rng() < 0.7);
        this.spawnT = this.spawnGap(this.rng());
      }
      if (this.scrollsLeft.length && prog >= this.scrollsLeft[0]) {
        this.scrollsLeft.shift();
        this.spawn("scroll", true);
      }
    }

    // Enemies
    for (const e of this.enemies) this.updateEnemy(e, dt);
    this.enemies = this.enemies.filter((e) => Math.abs(e.x - (this.camX + VIEW_W / 2)) < 360);

    // Shots
    for (const s of this.shots) s.x += s.vx * dt;
    this.shots = this.shots.filter((s) => s.x > this.camX - 20 && s.x < this.camX + VIEW_W + 20);

    // The student's ink stars (burst time only drains while running the floor)
    this.starCD = Math.max(0, this.starCD - dt);
    if (this.burstT > 0) {
      this.burstT = Math.max(0, this.burstT - dt);
      if (this.burstT === 0) this.endBurst();
    }
    this.updateStars(dt);
    if (this.mode !== "run") return;

    // Attacks land
    const ab = this.attackBox();
    if (ab) {
      for (const e of [...this.enemies]) {
        if (overlap(ab, { x0: e.x - e.hw, x1: e.x + e.hw, y0: e.y, y1: e.y + e.h })) this.defeat(e, false);
        if (this.mode !== "run") return;
      }
      for (const s of [...this.shots]) {
        const sy = s.high ? 22 : 4;
        if (overlap(ab, { x0: s.x - 4, x1: s.x + 4, y0: sy - 3, y1: sy + 3 })) {
          this.shots = this.shots.filter((o) => o !== s);
          this.score += 20;
          this.emit({ type: "sound", name: "deflect" }, { type: "poof", x: s.x, y: sy, ink: true });
        }
      }
    }

    // Getting bumped
    const pb = this.playerBox();
    if (p.invuln <= 0 && !this.invincible) {
      for (const e of this.enemies) {
        if (e.stunT > 0) continue;
        if (overlap(pb, { x0: e.x - e.hw + 2, x1: e.x + e.hw - 2, y0: e.y, y1: e.y + e.h - 2 })) {
          e.stunT = 0.8;
          e.knock = (e.x >= p.x ? 1 : -1) * 70;
          this.hurt(e.x >= p.x ? 1 : -1);
          break;
        }
      }
      for (const s of this.shots) {
        const sy = s.high ? 22 : 4;
        if (overlap(pb, { x0: s.x - 3, x1: s.x + 3, y0: sy - 2, y1: sy + 2 })) {
          this.shots = this.shots.filter((o) => o !== s);
          this.emit({ type: "poof", x: s.x, y: sy, ink: true });
          this.hurt(s.vx > 0 ? -1 : 1);
          break;
        }
      }
    }

    // Reaching the floor master
    if (this.mode === "run" && prog >= this.len - ARENA) {
      this.setMode("bossIntro");
      for (const e of this.enemies) this.emit({ type: "poof", x: e.x, y: e.h / 2, ink: true });
      this.enemies = [];
      this.shots = [];
      this.stars = [];
      p.attack = null;
      p.ducking = false;
      this.bossVisible = true;
      this.bossAnim = { kind: "enter", t: 0, dur: 1.4 };
      this.beats = [];
      this.emit({ type: "sound", name: "bossIn" });
    }
  }

  private updateStars(dt: number) {
    for (const st of [...this.stars]) {
      st.x += st.vx * dt;
      const box = { x0: st.x - 4, x1: st.x + 4, y0: st.y - 5, y1: st.y + 5 };
      const hitE = this.enemies.find((e) => overlap(box, { x0: e.x - e.hw, x1: e.x + e.hw, y0: e.y, y1: e.y + e.h }));
      if (hitE) {
        this.stars = this.stars.filter((o) => o !== st);
        this.defeat(hitE, false);
        if (this.mode !== "run") return;
        continue;
      }
      // Foam stars knock any incoming ink star they cross out of the air, high or low.
      const hitS = this.shots.find((s) => Math.abs(s.x - st.x) < 7);
      if (hitS) {
        this.stars = this.stars.filter((o) => o !== st);
        this.shots = this.shots.filter((o) => o !== hitS);
        this.score += 20;
        this.emit({ type: "sound", name: "deflect" }, { type: "poof", x: hitS.x, y: hitS.y, ink: true });
      }
    }
    this.stars = this.stars.filter((s) => s.x > this.camX - 20 && s.x < this.camX + VIEW_W + 20);
  }

  private endBurst() {
    this.burstT = 0;
    this.starCount = 0;
    this.stars = [];
    this.emit({ type: "floater", text: "INK STARS USED UP!", x: this.player.x, y: 52, color: "#9ae8ff" }, { type: "burstEnd" });
  }

  /** `from` is the side the bump came from (+1 = right). */
  private hurt(from: 1 | -1) {
    const p = this.player;
    this.energy = Math.max(0, this.energy - 1);
    p.invuln = 1.1;
    p.hurtT = 0.3;
    p.facing = from;
    p.attack = null;
    this.emit({ type: "sound", name: "hurt" }, { type: "shake", amt: 2 });
    if (this.energy <= 0) {
      p.ducking = false;
      this.setMode("dying");
    }
  }

  private pickKind(): EnemyKind {
    const r = this.rng();
    if (this.floor === 1) return r < 0.8 ? "ninja" : "blob";
    if (this.band === "k2" && this.floor === 2) return r < 0.7 ? "ninja" : "blob";
    // Higher floors send a few more star-throwers (they also fill the ink-star counter).
    if (this.floor >= 6) return this.band === "k2" ? (r < 0.48 ? "ninja" : r < 0.7 ? "blob" : "thrower") : r < 0.42 ? "ninja" : r < 0.62 ? "blob" : "thrower";
    return r < 0.5 ? "ninja" : r < 0.72 ? "blob" : "thrower";
  }

  spawn(kind: EnemyKind, ahead: boolean): Enemy {
    const side = (ahead ? this.dir : -this.dir) as 1 | -1;
    const x = side > 0 ? this.camX + VIEW_W + 12 : this.camX - 12;
    const base = this.enemySpeed;
    const e: Enemy = {
      id: this.nextId++,
      kind,
      x,
      y: 0,
      facing: (side > 0 ? -1 : 1) as 1 | -1,
      hw: kind === "blob" ? 6 : 6,
      h: kind === "blob" ? 9 : 27,
      speed: kind === "blob" ? base * 0.8 : kind === "scroll" ? base * 0.75 : base * (0.9 + this.rng() * 0.25),
      t: this.rng() * 3,
      stunT: 0,
      knock: 0,
      throwT: 1 + this.rng() * 0.6,
      windup: 0,
    };
    this.enemies.push(e);
    return e;
  }

  private updateEnemy(e: Enemy, dt: number) {
    const p = this.player;
    e.t += dt;
    if (e.stunT > 0) {
      e.stunT -= dt;
      e.x += e.knock * dt;
      e.knock *= 0.9;
      return;
    }
    const dx = p.x - e.x;
    e.facing = dx >= 0 ? 1 : -1;
    if (e.kind === "blob") {
      e.y = Math.abs(Math.sin(e.t * 5)) * 5;
      e.x += e.facing * e.speed * dt;
      return;
    }
    if (e.kind === "thrower") {
      const onScreen = e.x > this.camX + 8 && e.x < this.camX + VIEW_W - 8;
      if (Math.abs(dx) > 96 || !onScreen) {
        e.x += e.facing * e.speed * dt;
      } else {
        if (e.windup > 0) {
          e.windup -= dt;
          if (e.windup <= 0) {
            const high = this.band === "k2" ? this.rng() < 0.6 : this.rng() < 0.5;
            this.shots.push({ id: this.nextId++, x: e.x + e.facing * 8, y: high ? 22 : 4, vx: e.facing * this.cfg.shot, high });
            this.emit({ type: "sound", name: "throw" });
            e.throwT = this.cfg.throwEvery * (0.85 + this.rng() * 0.3) * (this.band === "k2" ? 1 : Math.pow(0.97, extraFloors(this.floor)));
          }
        } else {
          e.throwT -= dt;
          if (e.throwT <= 0) e.windup = 0.35;
        }
      }
      return;
    }
    e.x += e.facing * e.speed * dt;
  }

  private defeat(e: Enemy, byThunder: boolean) {
    this.enemies = this.enemies.filter((o) => o !== e);
    const pts = enemyPoints(e.kind) + (byThunder ? 50 : 0);
    this.score += pts;
    this.emit(
      { type: "poof", x: e.x, y: e.h / 2 + e.y, ink: e.kind !== "scroll" },
      { type: "sound", name: "hit" },
      { type: "floater", text: `+${pts}`, x: e.x, y: GROUND - e.h - 14, color: "#f2f4ff" },
    );
    if (e.kind === "thrower") {
      const r = onThrowerDefeated(this.starCount, this.burstT > 0);
      this.starCount = r.count;
      if (r.burst) {
        this.burstT = STAR_BURST;
        this.starCD = 0;
        this.emit(
          { type: "floater", text: "INK STARS! PRESS S", x: this.player.x, y: 40, color: "#ffd23f" },
          { type: "sound", name: "burst" },
          { type: "starBurst" },
        );
      } else if (this.burstT <= 0) {
        this.emit({ type: "floater", text: `STAR ${r.count}/${STAR_GOAL_N}`, x: e.x, y: GROUND - e.h - 24, color: "#9ae8ff" });
      }
    }
    if (e.kind === "scroll" && !byThunder) {
      this.player.attack = null;
      this.player.y = 0;
      this.player.vy = 0;
      this.shots = [];
      this.setMode("scroll");
      this.emit({ type: "sound", name: "scroll" }, { type: "scroll" });
    } else if (e.kind === "scroll") {
      // Thundered scroll-carriers still drop their scroll.
      this.setMode("scroll");
      this.emit({ type: "sound", name: "scroll" }, { type: "scroll" });
    }
  }

  private updateBossIntro(dt: number) {
    const p = this.player;
    const target = this.fightX;
    const d = target - p.x;
    if (Math.abs(d) > 1) {
      p.x += Math.sign(d) * Math.min(Math.abs(d), 90 * dt);
      p.walking = true;
      p.walkT += dt;
      p.facing = Math.sign(d) as 1 | -1;
    } else {
      p.x = target;
      p.walking = false;
      p.facing = this.dir;
    }
    if (p.y > 0) {
      p.vy -= GRAVITY * dt;
      p.y = Math.max(0, p.y + p.vy * dt);
    }
    if (this.bossAnim && this.bossAnim.kind === "enter" && this.bossAnim.t >= this.bossAnim.dur) this.bossAnim = null;
    if (this.modeT > 2.4 && Math.abs(d) <= 1 && !this.bossAnim) {
      this.setMode("boss");
      p.walking = false;
      this.fight = newFight(this.band, this.floor);
      this.emit({ type: "bossStart" });
    }
  }

  /** Where the boss is drawn (it slides in from off screen while entering). */
  bossDrawX(): number {
    if (this.bossAnim?.kind === "enter") {
      const k = Math.min(1, this.bossAnim.t / this.bossAnim.dur);
      return this.bossX + this.dir * (1 - k) * 90;
    }
    return this.bossX;
  }

  hud(): Hud {
    return {
      score: this.score,
      lives: this.lives,
      energy: this.energy,
      floor: this.floor,
      meter: this.streak.meter,
      streak: this.streak.streak,
      mode: this.mode,
      bossHp: this.fight?.hp ?? 0,
      bossMaxHp: this.fight?.maxHp ?? 0,
      progress: Math.max(0, Math.min(1, this.progressOf(this.player.x) / (this.len - ARENA))),
      stars: this.starCount,
      burst: this.burstT,
    };
  }

  /** Test/debug hook: jump to just before the floor master. */
  warpToBoss() {
    if (this.mode !== "run" && this.mode !== "intro") return;
    this.setMode("run");
    this.enemies = [];
    this.shots = [];
    this.scrollsLeft = [];
    this.player.x = this.dir > 0 ? this.len - ARENA - 4 : ARENA + 4;
    this.updateCamera(true);
  }
}

function overlap(a: { x0: number; x1: number; y0: number; y1: number }, b: { x0: number; x1: number; y0: number; y1: number }) {
  return a.x0 < b.x1 && a.x1 > b.x0 && a.y0 < b.y1 && a.y1 > b.y0;
}
