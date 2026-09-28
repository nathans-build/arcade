import type { ChipAudio, Grade } from "@/kit";
import { bandOf, whyWrong, type Sequence } from "@/seq";
import { textWidth } from "./font";
import {
  COUNTER_Y, FIELD_W, H, PLATE_CX, PLATE_X0, PLATE_Y, SIZES, STACK_SLAB_H, STACK_SLAB_W, W,
  colCenter, floorBelow, makeLayout, nextLadder, segmentAt, slabSpan,
  type Band, type Ladder, type Layout,
} from "./layout";
import {
  CHEF_H, CHEF_W, CRITTER_H, CRITTER_W, PALETTE, SLAB_COLORS, getSprites, makeBackground, textSprite, type SpriteSheet,
} from "./sprites";

export { W, H };

/** Height of the goal strip at the top of the screen. */
export const TOP = 12;
export const LIVES = 3;

export type Action = "left" | "right" | "up" | "down" | "fire";

export interface HudState {
  score: number;
  lives: number;
  spice: number;
  maxSpice: number;
  level: number;
  placed: number;
  total: number;
}

export interface StripItem {
  slot: number;
  label: string;
  slabId: number;
}

export interface EngineCallbacks {
  onHud(h: HudState): void;
  /** The sequence for the next level. */
  nextSequence(): Sequence;
  /** A level has started with this sequence. */
  onSequence(seq: Sequence): void;
  /** The pick strip (keys 1-4 / A-D) changed; `open` is false while a slab is on its way. */
  onStrip(strip: StripItem[], open: boolean): void;
  /** A slab reached the plate: stacked (correct) or bounced (with the reason). */
  onDelivered(seq: Sequence, label: string, correct: boolean, why: string): void;
  /** The whole stack is built. `clean` = no slab bounced. */
  onStackDone(seq: Sequence, clean: boolean): void;
  /** Level over: the engine waits for `resolveCheckpoint`. */
  onLevelClear(level: number): void;
  onGameOver(): void;
}

type SlabState = "rest" | "fall" | "express" | "counter" | "slide" | "bounce" | "tostack" | "stacked";

export interface Slab {
  id: number;
  /** Position of this slab's label in the correct order (0 = bottom). */
  idx: number;
  label: string;
  color: number;
  col: number;
  /** Resting floor, or the floor it is falling to (-1 = the counter). */
  floor: number;
  x: number;
  /** Bottom edge. */
  y: number;
  vy: number;
  state: SlabState;
  stepped: boolean[];
  walked: boolean;
  anim: { x0: number; y0: number; x1: number; y1: number; t: number; dur: number; arc: number } | null;
  squashes: number;
}

export interface Critter {
  kind: number;
  x: number;
  y: number;
  floor: number;
  ladder: Ladder | null;
  climbTo: number;
  dir: number;
  speed: number;
  stun: number;
  /** > 0: off the board, respawning. */
  away: number;
  squash: number;
  spawn: number;
  wander: number;
  wanderLadder: Ladder | null;
}

interface Particle { x: number; y: number; vx: number; vy: number; life: number; color: string }
interface Floater { text: string; x: number; y: number; t: number; color: string }
interface Puff { x: number; y: number; dir: number; t: number }

type Mode = "demo" | "play" | "dying" | "done" | "checkpoint" | "over";

/** Tuning per band: K-2 get fewer, slower critters, more spice and a late start. */
const TUNING: Record<Band, { critters: number[]; speed: number; speedUp: number; maxSpeed: number; spice: number; stun: number; delay: number }> = {
  k2: { critters: [1, 1, 2, 2, 2], speed: 13, speedUp: 1, maxSpeed: 20, spice: 5, stun: 4.5, delay: 5 },
  "35": { critters: [2, 2, 3, 3, 3], speed: 19, speedUp: 1.5, maxSpeed: 30, spice: 4, stun: 3.5, delay: 3 },
  "68": { critters: [2, 3, 3, 4, 4], speed: 23, speedUp: 1.5, maxSpeed: 34, spice: 4, stun: 3, delay: 2.5 },
  hs: { critters: [3, 3, 4, 4, 4], speed: 25, speedUp: 1.5, maxSpeed: 36, spice: 4, stun: 3, delay: 2 },
};
const CHEF_SPEED = 50;
const CLIMB_SPEED = 38;
const FALL_G = 420;
const FALL_MAX = 170;
const EXPRESS_SPEED = 230;
const SLIDE_SPEED = 210;
const SPRAY_RANGE = 36;

function rand(a: number, b: number) {
  return a + Math.random() * (b - a);
}

export class ChefEngine {
  private ctx: CanvasRenderingContext2D;
  private sprites: SpriteSheet;
  private bg: HTMLCanvasElement;
  private raf = 0;
  private last = 0;
  private time = 0;
  private hudKey = "";
  private stripKey = "";

  mode: Mode = "demo";
  paused = false;
  private keys = new Set<Action>();
  private fireQueued = 0;

  grade: Grade = "3";
  band: Band = "35";
  layout: Layout;
  seq: Sequence | null = null;

  // Chef
  cx = 14;
  cy = 0;
  cFloor = 0;
  cLadder: Ladder | null = null;
  private face = 1;
  private stride = 0;
  invuln = 0;
  private dyingT = 0;

  slabs: Slab[] = [];
  stack: Slab[] = [];
  critters: Critter[] = [];
  strip: StripItem[] = [];
  private queue: Slab[] = [];
  private particles: Particle[] = [];
  private floaters: Floater[] = [];
  private puffs: Puff[] = [];
  private banner: { lines: string[]; t: number; color: string } | null = null;
  private doneT = 0;
  private critterDelay = 0;
  private spiceCd = 0;
  private nextId = 1;

  score = 0;
  lives = LIVES;
  spice = 0;
  maxSpice = 5;
  level = 1;
  wrongs = 0;

  constructor(canvas: HTMLCanvasElement, private audio: ChipAudio, private cb: EngineCallbacks) {
    canvas.width = W;
    canvas.height = H;
    this.ctx = canvas.getContext("2d")!;
    this.ctx.imageSmoothingEnabled = false;
    this.sprites = getSprites();
    this.layout = makeLayout("35", 4, 1, 1);
    this.bg = makeBackground(this.layout, TOP);
  }

  /* ------------------------------ lifecycle ------------------------------ */

  start() {
    this.last = performance.now();
    const loop = (now: number) => {
      // Clamp the step: the first frame can be slightly negative, and tab switches can be long.
      const dt = Math.max(0, Math.min(0.05, (now - this.last) / 1000));
      this.last = now;
      if (!this.paused) this.update(dt);
      this.draw();
      this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
  }

  stop() {
    cancelAnimationFrame(this.raf);
  }

  /** Attract mode behind the title screen: critters chase the chef round a sample kitchen. */
  demo(grade: Grade) {
    this.grade = grade;
    this.band = bandOf(grade);
    this.mode = "demo";
    this.paused = false;
    this.seq = null;
    const labels = ["STACK", "CHEF", "IN ORDER"];
    this.buildLevel(labels, 2);
    this.critterDelay = 0;
    this.spawnCritters(2);
  }

  newGame(grade: Grade) {
    this.grade = grade;
    this.band = bandOf(grade);
    this.paused = false;
    this.score = 0;
    this.lives = LIVES;
    this.level = 1;
    this.startLevel();
  }

  private startLevel() {
    const seq = this.cb.nextSequence();
    this.seq = seq;
    this.mode = "play";
    this.wrongs = 0;
    const tune = TUNING[this.band];
    this.maxSpice = tune.spice;
    this.spice = Math.max(this.spice, tune.spice);
    if (this.level === 1) this.spice = tune.spice;
    this.buildLevel(seq.steps, this.level);
    this.critterDelay = tune.delay;
    this.spawnCritters(tune.critters[Math.min(this.level - 1, tune.critters.length - 1)]);
    this.invuln = 1.5;
    this.showBanner([`LEVEL ${this.level}`, seq.title], PALETTE.yellow, 2.2);
    this.stripKey = "";
    this.updateStrip();
    this.cb.onSequence(seq);
    this.pushHud(true);
  }

  private buildLevel(labels: string[], level: number) {
    this.layout = makeLayout(this.band, labels.length, level, Math.floor(Math.random() * 1e9));
    this.bg = makeBackground(this.layout, TOP);
    // Shuffle which cell (and colour) each label gets, so position never gives the order away.
    const order = labels.map((_, i) => i).sort(() => Math.random() - 0.5);
    const colors = SLAB_COLORS.map((_, i) => i).sort(() => Math.random() - 0.5);
    this.slabs = this.layout.cells.map((cell, k) => {
      const idx = order[k];
      return {
        id: this.nextId++,
        idx,
        label: labels[idx],
        color: colors[k % colors.length],
        col: cell.col,
        floor: cell.floor,
        x: colCenter(this.band, cell.col),
        y: this.layout.floorY[cell.floor],
        vy: 0,
        state: "rest" as SlabState,
        stepped: [false, false, false, false],
        walked: false,
        anim: null,
        squashes: 0,
      };
    });
    // Slab ids in a random order too (the pick strip lists them by id).
    const ids = this.slabs.map((s) => s.id).sort(() => Math.random() - 0.5);
    this.slabs.forEach((s, i) => (s.id = ids[i]));
    this.stack = [];
    this.queue = [];
    this.particles = [];
    this.floaters = [];
    this.puffs = [];
    this.cFloor = this.layout.start.floor;
    this.cx = this.layout.start.x;
    this.cy = this.layout.floorY[this.cFloor];
    this.cLadder = null;
    this.face = 1;
  }

  private spawnCritters(n: number) {
    const tune = TUNING[this.band];
    const speed = Math.min(tune.maxSpeed, tune.speed + tune.speedUp * (this.level - 1));
    this.critters = [];
    for (let i = 0; i < n; i++) {
      const sp = this.layout.spawns[i % this.layout.spawns.length];
      this.critters.push({
        kind: i % 3,
        x: sp.x,
        y: this.layout.floorY[sp.floor],
        floor: sp.floor,
        ladder: null,
        climbTo: sp.floor,
        dir: sp.x < FIELD_W / 2 ? 1 : -1,
        speed: speed * [1, 0.92, 1.08][i % 3],
        stun: 0,
        away: i * 2.5,
        squash: 0,
        spawn: i % this.layout.spawns.length,
        wander: rand(2, 5),
        wanderLadder: null,
      });
    }
  }

  togglePause(force?: boolean): boolean {
    if (this.mode === "demo" || this.mode === "over" || this.mode === "checkpoint") return this.paused;
    this.paused = force ?? !this.paused;
    if (this.paused) this.releaseAllKeys();
    return this.paused;
  }

  setKey(a: Action, down: boolean) {
    if (down) {
      this.keys.add(a);
      if (a === "fire") this.fireQueued = 0.3;
    } else this.keys.delete(a);
  }

  releaseAllKeys() {
    this.keys.clear();
    this.fireQueued = 0;
  }

  /** Player answered the between-level checkpoint. */
  resolveCheckpoint(correct: boolean) {
    if (this.mode !== "checkpoint") return;
    if (correct) {
      this.score += 500 * this.level;
      this.spice = Math.min(this.maxSpice + 2, this.spice + 2);
    }
    this.level++;
    this.audio.levelUp();
    this.startLevel();
  }

  /* ------------------------------ picking ------------------------------ */

  /** True while a slab is on its way to the plate (picks wait until it lands). */
  get busy(): boolean {
    return this.queue.length > 0 || this.slabs.some((s) => s.state === "express" || s.state === "slide" || s.state === "bounce" || s.state === "tostack");
  }

  canPick(): boolean {
    return this.mode === "play" && !this.paused && !this.busy;
  }

  /** Keys 1-4 / A-D and the strip buttons: drop that slab straight to the plate. */
  pick(slot: number): boolean {
    const item = this.strip[slot];
    if (!item) return false;
    const slab = this.slabs.find((s) => s.id === item.slabId);
    return slab ? this.pickSlab(slab) : false;
  }

  /** Tap a slab on the screen to drop it. */
  tapAt(x: number, y: number): boolean {
    const size = SIZES[this.band];
    for (const s of this.slabs) {
      if (s.state !== "rest") continue;
      if (Math.abs(x - s.x) <= size.slabW / 2 + 3 && y >= s.y - size.slabH - 6 && y <= s.y + 5) return this.pickSlab(s);
    }
    return false;
  }

  private pickSlab(s: Slab): boolean {
    if (!this.canPick() || s.state !== "rest") return false;
    s.state = "express";
    s.floor = -1;
    s.vy = EXPRESS_SPEED;
    s.walked = false;
    this.audio.blip();
    this.updateStrip();
    return true;
  }

  /* ------------------------------ update ------------------------------ */

  private update(dt: number) {
    this.time += dt;
    for (const p of this.particles) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 90 * dt;
      p.life -= dt;
    }
    this.particles = this.particles.filter((p) => p.life > 0);
    for (const f of this.floaters) {
      f.t -= dt;
      f.y -= 10 * dt;
    }
    this.floaters = this.floaters.filter((f) => f.t > 0);
    for (const p of this.puffs) p.t -= dt;
    this.puffs = this.puffs.filter((p) => p.t > 0);
    if (this.banner) {
      this.banner.t -= dt;
      if (this.banner.t <= 0) this.banner = null;
    }

    if (this.mode === "demo") {
      this.demoChef(dt);
      this.updateCritters(dt, false);
      return;
    }
    if (this.mode === "over" || this.mode === "checkpoint") return;

    if (this.mode === "dying") {
      this.dyingT -= dt;
      if (this.dyingT <= 0) {
        this.lives--;
        if (this.lives <= 0) {
          this.mode = "over";
          this.pushHud(true);
          this.audio.gameOver();
          this.cb.onGameOver();
          return;
        }
        this.respawnChef();
      }
      this.updateSlabs(dt);
      return;
    }

    if (this.mode === "done") {
      this.doneT -= dt;
      if (Math.random() < dt * 14) this.sparkle(PLATE_CX + rand(-24, 24), PLATE_Y - this.stack.length * STACK_SLAB_H - rand(0, 12));
      if (this.doneT <= 0) {
        this.mode = "checkpoint";
        this.releaseAllKeys();
        this.cb.onLevelClear(this.level);
      }
      return;
    }

    // play
    this.invuln = Math.max(0, this.invuln - dt);
    this.spiceCd = Math.max(0, this.spiceCd - dt);
    this.moveChef(dt);
    if (this.keys.has("fire") || this.fireQueued > 0) {
      if (this.spiceCd <= 0) this.spray();
      this.fireQueued = 0;
    }
    this.fireQueued = Math.max(0, this.fireQueued - dt);
    this.walkSlabs();
    this.updateSlabs(dt);
    this.critterDelay -= dt;
    this.updateCritters(dt, true);
    this.updateStrip();
    this.pushHud();
  }

  /* ------------------------------ chef ------------------------------ */

  private moveChef(dt: number) {
    const l = this.layout;
    const up = this.keys.has("up");
    const down = this.keys.has("down");
    const left = this.keys.has("left");
    const right = this.keys.has("right");
    if (this.cLadder) {
      const lad = this.cLadder;
      const yt = l.floorY[lad.top];
      const yb = l.floorY[lad.bottom];
      if (up || down) {
        this.cy += (up ? -1 : 1) * CLIMB_SPEED * dt;
        this.stride += dt;
        if (this.cy <= yt) {
          this.cy = yt;
          const next = up ? l.ladders.find((d) => d.x === lad.x && d.bottom === lad.top) : undefined;
          if (next) this.cLadder = next;
          else {
            this.cLadder = null;
            this.cFloor = lad.top;
          }
        } else if (this.cy >= yb) {
          this.cy = yb;
          const next = down ? l.ladders.find((d) => d.x === lad.x && d.top === lad.bottom) : undefined;
          if (next) this.cLadder = next;
          else {
            this.cLadder = null;
            this.cFloor = lad.bottom;
          }
        }
      } else if (left || right) {
        // Step off at either end if close enough.
        if (Math.abs(this.cy - yt) < 4) {
          this.cy = yt;
          this.cFloor = lad.top;
          this.cLadder = null;
        } else if (Math.abs(this.cy - yb) < 4) {
          this.cy = yb;
          this.cFloor = lad.bottom;
          this.cLadder = null;
        }
      }
      return;
    }
    const f = this.cFloor;
    if (up || down) {
      // Find a ladder here (or close by: the chef slides over to it, which is kind to small hands).
      const cands = l.ladders.filter((d) => (up ? d.bottom === f : d.top === f));
      let best: Ladder | null = null;
      for (const d of cands) if (!best || Math.abs(d.x - this.cx) < Math.abs(best.x - this.cx)) best = d;
      if (best && Math.abs(best.x - this.cx) <= 12 && segmentAt(l, f, best.x) === segmentAt(l, f, this.cx)) {
        const dx = best.x - this.cx;
        if (Math.abs(dx) <= 1.5) {
          this.cx = best.x;
          this.cLadder = best;
          this.cy += (up ? -1 : 1) * 0.5;
        } else {
          this.cx += Math.sign(dx) * Math.min(Math.abs(dx), CHEF_SPEED * dt);
          this.face = Math.sign(dx);
          this.stride += dt;
        }
        return;
      }
    }
    if (left || right) {
      const dir = left ? -1 : 1;
      this.face = dir;
      const seg = l.segments[segmentAt(l, f, this.cx)];
      let nx = this.cx + dir * CHEF_SPEED * dt;
      if (seg) nx = Math.max(seg.x0 + 4, Math.min(seg.x1 - 4, nx));
      this.cx = nx;
      this.stride += dt;
    }
  }

  private demoChef(dt: number) {
    const l = this.layout;
    const seg = l.segments[segmentAt(l, this.cFloor, this.cx)];
    this.cx += this.face * CHEF_SPEED * 0.7 * dt;
    this.stride += dt;
    if (seg && (this.cx > seg.x1 - 6 || this.cx < seg.x0 + 6)) this.face = -this.face;
  }

  private respawnChef() {
    this.mode = "play";
    this.cFloor = this.layout.start.floor;
    this.cx = this.layout.start.x;
    this.cy = this.layout.floorY[this.cFloor];
    this.cLadder = null;
    this.invuln = 2.5;
    this.releaseAllKeys();
    this.critters.forEach((c, i) => this.sendAway(c, 1.5 + i * 1.5));
    this.showBanner(["READY!"], PALETTE.yellow, 1.2);
    this.pushHud(true);
  }

  private spray() {
    if (this.spice <= 0) {
      this.floaters.push({ text: "NO SPICE", x: this.cx, y: this.cy - CHEF_H - 6, t: 0.8, color: PALETTE.red });
      this.spiceCd = 0.5;
      return;
    }
    this.spice--;
    this.spiceCd = 0.45;
    const dir = this.face;
    this.puffs.push({ x: this.cx + dir * 8, y: this.cy - 9, dir, t: 0.45 });
    this.audio.shoot();
    const tune = TUNING[this.band];
    let hits = 0;
    for (const c of this.critters) {
      if (c.away > 0 || c.squash > 0) continue;
      const dx = (c.x - this.cx) * dir;
      if (dx >= -4 && dx <= SPRAY_RANGE && Math.abs(c.y - this.cy) < 12) {
        c.stun = tune.stun;
        hits++;
      }
    }
    if (hits) {
      this.score += 100 * hits;
      this.floaters.push({ text: `STUNNED +${100 * hits}`, x: this.cx + dir * 20, y: this.cy - 22, t: 0.9, color: PALETTE.orange });
    }
    this.pushHud(true);
  }

  private die() {
    if (this.mode !== "play" || this.invuln > 0) return;
    this.mode = "dying";
    this.dyingT = 1.6;
    this.releaseAllKeys();
    this.audio.crash();
    for (let i = 0; i < 16; i++) this.particles.push({ x: this.cx, y: this.cy - 8, vx: rand(-60, 60), vy: rand(-90, -20), life: rand(0.4, 0.9), color: i % 2 ? PALETTE.red : PALETTE.white });
    this.showBanner(["OUCH!"], PALETTE.red, 1.4);
  }

  /* ------------------------------ slabs ------------------------------ */

  private walkSlabs() {
    if (this.cLadder) return;
    const w = SIZES[this.band].slabW;
    for (const s of this.slabs) {
      if (s.state !== "rest" || s.floor !== this.cFloor) continue;
      const x0 = s.x - w / 2;
      if (this.cx < x0 || this.cx > x0 + w) continue;
      const k = Math.min(3, Math.floor(((this.cx - x0) / w) * 4));
      if (!s.stepped[k]) {
        s.stepped[k] = true;
        this.audio.tone(300 + k * 60, 0.05, "square", 0.2);
        if (s.stepped.every(Boolean)) this.startFall(s, true);
      }
    }
  }

  private startFall(s: Slab, walked: boolean) {
    const below = floorBelow(this.layout, s.col, s.floor);
    s.floor = below;
    s.state = "fall";
    s.vy = 20;
    s.walked = walked || s.walked;
    s.squashes = 0;
    this.audio.tone(520, 0.12, "triangle", 0.35, 180);
  }

  private updateSlabs(dt: number) {
    const size = SIZES[this.band];
    for (const s of this.slabs) {
      if (s.state === "fall" || s.state === "express") {
        const prev = s.y;
        if (s.state === "fall") s.vy = Math.min(FALL_MAX, s.vy + FALL_G * dt);
        s.y += s.vy * dt;
        const target = s.floor >= 0 ? this.layout.floorY[s.floor] : COUNTER_Y;
        if (s.y >= target) s.y = target;
        this.squashCheck(s, prev, s.y, size.slabW);
        if (s.y >= target) this.land(s);
      } else if (s.state === "bounce" || s.state === "tostack") {
        const a = s.anim!;
        a.t = Math.min(a.dur, a.t + dt);
        const k = a.t / a.dur;
        s.x = a.x0 + (a.x1 - a.x0) * k;
        s.y = a.y0 + (a.y1 - a.y0) * k - Math.sin(Math.PI * k) * a.arc;
        if (a.t >= a.dur) {
          s.anim = null;
          if (s.state === "bounce") {
            s.state = "rest";
            s.stepped = [false, false, false, false];
            s.y = this.layout.floorY[s.floor];
            this.puffAt(s.x, s.y, "#c8d0ff");
          } else {
            s.state = "stacked";
            this.afterStacked(s);
          }
        }
      }
    }
    // The counter: slabs slide to the plate one at a time.
    const head = this.queue[0];
    if (head) {
      if (head.state === "counter") head.state = "slide";
      if (head.state === "slide") {
        head.x = Math.min(PLATE_CX, head.x + SLIDE_SPEED * dt);
        if (head.x >= PLATE_X0 - 4) head.y = Math.max(PLATE_Y - 1 - this.stack.length * STACK_SLAB_H - 10, head.y - 60 * dt);
        if (head.x >= PLATE_CX) {
          this.queue.shift();
          this.judge(head);
        }
      }
    }
  }

  private land(s: Slab) {
    if (s.floor < 0) {
      // Onto the counter: queue for the plate.
      s.state = "counter";
      s.vy = 0;
      this.queue.push(s);
      this.audio.tone(200, 0.08, "square", 0.3);
      this.puffAt(s.x, COUNTER_Y, "#8fa8e8");
      return;
    }
    s.state = "rest";
    s.vy = 0;
    s.stepped = [false, false, false, false];
    this.score += 50;
    this.audio.tone(160, 0.1, "square", 0.35, 90);
    this.puffAt(s.x, s.y, "#8fa8e8");
    // Knock down a slab already resting here (it falls one more girder).
    const other = this.slabs.find((o) => o !== s && o.state === "rest" && o.col === s.col && o.floor === s.floor);
    if (other) this.startFall(other, s.walked);
  }

  private squashCheck(s: Slab, prevY: number, newY: number, w: number) {
    for (const c of this.critters) {
      if (c.away > 0 || c.squash > 0) continue;
      if (Math.abs(c.x - s.x) > w / 2 + 2) continue;
      if (prevY < c.y - 3 && newY > c.y - CRITTER_H + 3) {
        s.squashes++;
        const pts = 500 * 2 ** (s.squashes - 1);
        this.score += pts;
        c.squash = 0.7;
        this.floaters.push({ text: `SQUASH +${pts}`, x: c.x, y: c.y - 16, t: 1.1, color: PALETTE.yellow });
        this.audio.explode();
      }
    }
  }

  private judge(s: Slab) {
    const seq = this.seq;
    if (!seq) return;
    const expected = this.stack.length;
    if (s.idx === expected) {
      s.state = "tostack";
      s.anim = { x0: s.x, y0: s.y, x1: PLATE_CX, y1: PLATE_Y - 1 - expected * STACK_SLAB_H, t: 0, dur: 0.25, arc: 0 };
      this.stack.push(s);
      const pts = s.walked ? 300 : 150;
      this.score += pts;
      this.floaters.push({ text: `+${pts}`, x: PLATE_CX, y: PLATE_Y - expected * STACK_SLAB_H - 14, t: 1, color: PALETTE.green });
      this.audio.checkpoint();
      this.cb.onDelivered(seq, s.label, true, "");
    } else {
      this.wrongs++;
      const why = whyWrong(seq, s.idx, expected);
      const f = this.freeFloor(s.col);
      s.floor = f.floor;
      s.col = f.col;
      s.state = "bounce";
      const x1 = colCenter(this.band, f.col);
      s.anim = { x0: s.x, y0: s.y, x1, y1: this.layout.floorY[f.floor], t: 0, dur: 0.9, arc: 60 };
      this.audio.wrong();
      this.showBanner(["WRONG ORDER!"], PALETTE.red, 1.2);
      this.cb.onDelivered(seq, s.label, false, why);
    }
    this.pushHud(true);
  }

  private afterStacked(s: Slab) {
    this.sparkle(s.x, s.y - 4);
    if (this.seq && this.stack.length === this.seq.steps.length && this.mode === "play") {
      const clean = this.wrongs === 0;
      const bonus = clean ? 1000 * this.level : 250 * this.level;
      this.score += bonus;
      this.mode = "done";
      this.doneT = 2.4;
      this.releaseAllKeys();
      this.audio.correct();
      this.showBanner([clean ? "ORDER UP! PERFECT!" : "ORDER UP!", `BONUS ${bonus}`], PALETTE.yellow, 2.4);
      this.pushHud(true);
      this.cb.onStackDone(this.seq, clean);
    }
  }

  /** Lowest girder with room in this column (or, if full, any column). */
  private freeFloor(col: number): { col: number; floor: number } {
    const nF = this.layout.floorY.length;
    const taken = (c: number, f: number) =>
      this.slabs.some((o) => (o.state === "rest" || o.state === "fall" || o.state === "bounce") && o.col === c && o.floor === f);
    const [a, b] = slabSpan(this.band, col);
    const onGirder = (f: number) => this.layout.segments.some((s) => s.floor === f && s.x0 <= a && s.x1 >= b);
    for (let f = nF - 1; f >= 0; f--) if (!taken(col, f) && onGirder(f)) return { col, floor: f };
    for (let f = nF - 1; f >= 0; f--) for (let c = 0; c < SIZES[this.band].cols; c++) if (!taken(c, f)) return { col: c, floor: f };
    return { col, floor: 0 };
  }

  /* ------------------------------ critters ------------------------------ */

  private sendAway(c: Critter, t: number) {
    c.away = t;
    c.stun = 0;
    c.squash = 0;
    c.ladder = null;
    const sp = this.layout.spawns[c.spawn];
    c.x = sp.x;
    c.floor = sp.floor;
    c.y = this.layout.floorY[sp.floor];
  }

  private updateCritters(dt: number, live: boolean) {
    if (live && this.critterDelay > 0) return;
    const l = this.layout;
    for (const c of this.critters) {
      if (c.squash > 0) {
        c.squash -= dt;
        if (c.squash <= 0) this.sendAway(c, 5);
        continue;
      }
      if (c.away > 0) {
        c.away -= dt;
        if (c.away <= 0 && live && Math.hypot(c.x - this.cx, c.y - this.cy) < 50) c.away = 1;
        continue;
      }
      if (c.stun > 0) {
        c.stun -= dt;
        continue;
      }
      const step = c.speed * dt;
      if (c.ladder) {
        const ty = l.floorY[c.climbTo];
        const dy = ty - c.y;
        if (Math.abs(dy) <= step) {
          c.y = ty;
          c.floor = c.climbTo;
          c.ladder = null;
        } else c.y += Math.sign(dy) * step;
      } else {
        c.wander -= dt;
        const mySeg = segmentAt(l, c.floor, c.x);
        // Where is the chef? (If he is on a ladder, aim for the end nearer this critter's floor.)
        let chefFloor = this.cFloor;
        if (this.cLadder) chefFloor = Math.abs(this.cy - l.floorY[this.cLadder.top]) < Math.abs(this.cy - l.floorY[this.cLadder.bottom]) ? this.cLadder.top : this.cLadder.bottom;
        const chefSeg = segmentAt(l, chefFloor, this.cLadder ? this.cLadder.x : this.cx);
        let targetX = this.cx;
        let climb: Ladder | null = null;
        const wandering = c.wander < 0 && c.wander > -2.5;
        if (c.wander <= -2.5) c.wander = rand(4, 8) * (this.band === "k2" ? 0.7 : 1);
        if (wandering) {
          if (!c.wanderLadder || (c.wanderLadder.top !== c.floor && c.wanderLadder.bottom !== c.floor)) {
            const opts = l.ladders.filter((d) => (d.top === c.floor || d.bottom === c.floor) && segmentAt(l, c.floor, d.x) === mySeg);
            c.wanderLadder = opts[Math.floor(Math.random() * opts.length)] ?? null;
          }
          if (c.wanderLadder) {
            targetX = c.wanderLadder.x;
            climb = c.wanderLadder;
          }
        } else if (mySeg !== chefSeg) {
          const lad = mySeg >= 0 && chefSeg >= 0 ? nextLadder(l, mySeg, chefSeg) : null;
          if (lad) {
            targetX = lad.x;
            climb = lad;
          }
        } else if (this.cLadder && (this.cLadder.top === c.floor || this.cLadder.bottom === c.floor)) {
          targetX = this.cLadder.x;
          if (Math.abs(this.cy - c.y) > 6) climb = this.cLadder;
        }
        const dx = targetX - c.x;
        if (climb && Math.abs(dx) <= step) {
          c.x = climb.x;
          c.ladder = climb;
          c.climbTo = climb.top === c.floor ? climb.bottom : climb.top;
          c.wanderLadder = null;
          if (wandering) c.wander = -3;
        } else if (Math.abs(dx) > 0.5) {
          c.dir = Math.sign(dx);
          c.x += c.dir * Math.min(step, Math.abs(dx));
          const seg = l.segments[mySeg];
          if (seg) c.x = Math.max(seg.x0 + 3, Math.min(seg.x1 - 3, c.x));
        }
      }
      if (live && this.mode === "play" && this.invuln <= 0 && Math.abs(c.x - this.cx) < 8 && Math.abs(c.y - this.cy) < 11) this.die();
    }
  }

  /* ------------------------------ strip / hud ------------------------------ */

  private updateStrip() {
    const rest = this.slabs.filter((s) => s.state === "rest").sort((a, b) => a.id - b.id);
    let items = rest;
    if (rest.length > 4) {
      const need = rest.find((s) => s.idx === this.stack.length);
      items = rest.filter((s) => s !== need).slice(0, need ? 3 : 4);
      if (need) items.push(need);
      items.sort((a, b) => a.id - b.id);
    }
    this.strip = items.map((s, slot) => ({ slot, label: s.label, slabId: s.id }));
    const open = this.canPick();
    const key = `${this.strip.map((s) => s.slabId).join(",")}|${open}`;
    if (key !== this.stripKey) {
      this.stripKey = key;
      this.cb.onStrip(this.strip, open);
    }
  }

  private pushHud(force = false) {
    const h: HudState = {
      score: this.score, lives: this.lives, spice: this.spice, maxSpice: this.maxSpice, level: this.level,
      placed: this.stack.length, total: this.seq?.steps.length ?? 0,
    };
    const key = JSON.stringify(h);
    if (force || key !== this.hudKey) {
      this.hudKey = key;
      this.cb.onHud(h);
    }
  }

  /* ------------------------------ effects ------------------------------ */

  private showBanner(lines: string[], color: string, t: number) {
    this.banner = { lines, color, t };
  }
  private puffAt(x: number, y: number, color: string) {
    for (let i = 0; i < 6; i++) this.particles.push({ x: x + rand(-10, 10), y, vx: rand(-30, 30), vy: rand(-30, -8), life: rand(0.2, 0.4), color });
  }
  private sparkle(x: number, y: number) {
    const cols = [PALETTE.yellow, PALETTE.white, PALETTE.cyan, PALETTE.green];
    for (let i = 0; i < 5; i++) this.particles.push({ x, y, vx: rand(-50, 50), vy: rand(-80, -20), life: rand(0.3, 0.7), color: cols[i % cols.length] });
  }

  /* ------------------------------ draw ------------------------------ */

  private draw() {
    const g = this.ctx;
    g.drawImage(this.bg, 0, 0);
    this.drawGoal(g);
    this.drawStackGuides(g);
    for (const s of this.slabs) if (s.state !== "stacked" && s.state !== "tostack") this.drawSlab(g, s);
    for (const s of this.stack) this.drawStackSlab(g, s);
    for (const c of this.critters) this.drawCritter(g, c);
    this.drawChef(g);
    for (const p of this.puffs) this.drawPuff(g, p);
    for (const p of this.particles) {
      g.fillStyle = p.color;
      g.fillRect(Math.round(p.x), Math.round(p.y), 1, 1);
    }
    for (const f of this.floaters) {
      const spr = textSprite(f.text, f.color, 1, "#000");
      g.drawImage(spr, Math.round(Math.max(1, Math.min(W - spr.width - 1, f.x - spr.width / 2))), Math.round(f.y));
    }
    if (this.banner) {
      const n = this.banner.lines.length;
      const y0 = Math.round(H / 2 - n * 8);
      g.fillStyle = "rgba(5,8,24,0.72)";
      g.fillRect(0, y0 - 5, W, n * 15 + 6);
      this.banner.lines.forEach((ln, i) => {
        const scale = i === 0 && textWidth(ln, 2) < W - 16 ? 2 : 1;
        const spr = textSprite(ln, i === 0 ? this.banner!.color : PALETTE.white, scale, "#000");
        g.drawImage(spr, Math.round((W - spr.width) / 2), y0 + i * 15 + (scale === 1 && i === 0 ? 3 : 0));
      });
    }
    if (this.paused && this.mode === "play") {
      g.fillStyle = "rgba(5,8,24,0.5)";
      g.fillRect(0, 0, W, H);
    }
  }

  private drawGoal(g: CanvasRenderingContext2D) {
    if (!this.seq) {
      const t = textSprite("STACK CHEF · BUILD EVERY ORDER BOTTOM TO TOP", PALETTE.yellow, 1);
      g.drawImage(t, Math.round((W - t.width) / 2), 3);
      return;
    }
    const title = textSprite(this.seq.title, PALETTE.yellow, 1);
    const cap = textSprite(`BOTTOM=${this.seq.ends[0]}`, PALETTE.lightBlue, 1);
    const total = title.width + 8 + cap.width;
    const x = Math.max(3, Math.round((W - total) / 2));
    g.drawImage(title, x, 3);
    g.drawImage(cap, Math.min(W - cap.width - 2, x + title.width + 8), 3);
  }

  private drawStackGuides(g: CanvasRenderingContext2D) {
    const n = this.seq?.steps.length ?? 3;
    // Ghost slots for the rest of the stack; the next one blinks.
    for (let i = this.stack.length; i < n; i++) {
      const y = PLATE_Y - 1 - (i + 1) * STACK_SLAB_H;
      g.fillStyle = i === this.stack.length && Math.floor(this.time * 3) % 2 === 0 ? "#3a4a9a" : "#1c2658";
      const x0 = Math.round(PLATE_CX - STACK_SLAB_W / 2);
      for (let x = x0; x < x0 + STACK_SLAB_W; x += 3) {
        g.fillRect(x, y + 1, 1, 1);
        g.fillRect(x, y + STACK_SLAB_H - 1, 1, 1);
      }
      g.fillRect(x0, y + 1, 1, STACK_SLAB_H - 1);
      g.fillRect(x0 + STACK_SLAB_W - 1, y + 1, 1, STACK_SLAB_H - 1);
      if (i === this.stack.length && this.mode !== "demo") {
        const q = textSprite(String(i + 1), "#6a78b8", 1);
        g.drawImage(q, Math.round(PLATE_CX - q.width / 2), y + 2);
      }
    }
    if (this.seq) {
      const topY = PLATE_Y - 1 - n * STACK_SLAB_H - 8;
      const t = textSprite(this.seq.ends[1], "#6a78b8", 1);
      g.drawImage(t, Math.round(PLATE_CX - t.width / 2), topY);
      const b = textSprite(this.seq.ends[0], "#6a78b8", 1);
      g.drawImage(b, Math.round(PLATE_CX - b.width / 2), PLATE_Y + 5);
    }
  }

  private slabBody(g: CanvasRenderingContext2D, s: Slab, x: number, y: number, w: number, h: number, sag: boolean[] | null) {
    const col = SLAB_COLORS[s.color];
    const segW = w / 4;
    for (let k = 0; k < 4; k++) {
      const sx = Math.round(x + k * segW);
      const ex = Math.round(x + (k + 1) * segW);
      const dy = sag && sag[k] ? 1 : 0;
      g.fillStyle = col.lo;
      g.fillRect(sx, y + dy, ex - sx, h);
      g.fillStyle = sag && sag[k] ? col.lo : col.face;
      g.fillRect(sx, y + dy, ex - sx, h - 1);
      g.fillStyle = col.hi;
      g.fillRect(sx, y + dy, ex - sx, 1);
    }
    // rounded ends
    g.fillStyle = PALETTE.bg;
    g.fillRect(Math.round(x), y, 1, 1);
    g.fillRect(Math.round(x + w) - 1, y, 1, 1);
  }

  private drawSlab(g: CanvasRenderingContext2D, s: Slab) {
    const size = SIZES[this.band];
    const w = size.slabW;
    const h = size.slabH;
    const x = Math.round(s.x - w / 2);
    const y = Math.round(s.y - h);
    this.slabBody(g, s, x, y, w, h, s.state === "rest" ? s.stepped : null);
    let scale = size.labelScale;
    if (textWidth(s.label, scale) > w - 4) scale = 1;
    const t = textSprite(s.label, PALETTE.navy, scale);
    g.drawImage(t, Math.round(s.x - t.width / 2), y + Math.max(1, Math.floor((h - t.height) / 2)));
  }

  private drawStackSlab(g: CanvasRenderingContext2D, s: Slab) {
    const w = STACK_SLAB_W;
    const x = Math.round(s.x - w / 2);
    const y = Math.round(s.y - STACK_SLAB_H);
    this.slabBody(g, s, x, y, w, STACK_SLAB_H, null);
    const t = textSprite(s.label, PALETTE.navy, 1);
    g.drawImage(t, Math.round(s.x - t.width / 2), y + 2);
  }

  private drawCritter(g: CanvasRenderingContext2D, c: Critter) {
    if (c.away > 0) return;
    const x = Math.round(c.x - CRITTER_W / 2);
    if (c.squash > 0) {
      const spr = this.sprites.critters[c.kind][0];
      g.drawImage(spr, x - 2, Math.round(c.y - 3), CRITTER_W + 4, 3);
      return;
    }
    const frame = Math.floor(this.time * 6 + c.spawn) % 2;
    const spr = c.stun > 0 ? this.sprites.stunned[c.kind] : this.sprites.critters[c.kind][frame];
    const y = Math.round(c.y - CRITTER_H);
    if (c.stun > 0 && c.stun < 1 && Math.floor(this.time * 10) % 2 === 0) return;
    g.drawImage(spr, x, y);
    if (c.stun > 0) {
      g.fillStyle = PALETTE.yellow;
      const a = this.time * 6;
      g.fillRect(Math.round(c.x + Math.cos(a) * 5), y - 3 + Math.round(Math.sin(a) * 1.5), 1, 1);
      g.fillRect(Math.round(c.x - Math.cos(a) * 5), y - 3 - Math.round(Math.sin(a) * 1.5), 1, 1);
    }
  }

  private drawChef(g: CanvasRenderingContext2D) {
    if (this.mode === "over" && this.lives <= 0) return;
    if (this.invuln > 0 && this.mode === "play" && Math.floor(this.invuln * 10) % 2 === 0) return;
    const frame = Math.floor(this.stride * 8) % 2;
    let spr: HTMLCanvasElement;
    if (this.cLadder) spr = this.sprites.chefClimb[Math.floor(this.cy / 4) % 2];
    else spr = this.sprites.chef[frame][this.face > 0 ? 0 : 1];
    const x = Math.round(this.cx - CHEF_W / 2);
    const y = Math.round(this.cy - CHEF_H);
    if (this.mode === "dying") {
      // Spin in place.
      g.save();
      g.translate(Math.round(this.cx), Math.round(this.cy - CHEF_H / 2));
      g.rotate(Math.round((1.6 - this.dyingT) * 8) * (Math.PI / 2));
      g.drawImage(spr, -Math.floor(CHEF_W / 2), -Math.floor(CHEF_H / 2));
      g.restore();
      return;
    }
    g.drawImage(spr, x, y);
  }

  private drawPuff(g: CanvasRenderingContext2D, p: Puff) {
    const k = 1 - p.t / 0.45;
    const len = SPRAY_RANGE * k;
    for (let i = 0; i < 14; i++) {
      const d = (i / 14) * len;
      const spread = 1 + d * 0.18;
      const px = p.x + p.dir * d;
      const py = p.y + Math.sin(i * 2.3 + this.time * 20) * spread;
      g.fillStyle = i % 3 === 0 ? PALETTE.red : i % 3 === 1 ? PALETTE.orange : PALETTE.yellow;
      g.fillRect(Math.round(px), Math.round(py), 1, 1);
    }
  }

  /** For playtests: lose a life now. */
  debugDie() {
    this.invuln = 0;
    this.die();
  }
}
