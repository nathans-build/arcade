import type { ChipAudio, DealtQuestion } from "@/kit";
import {
  BUNKER_H,
  BUNKER_W,
  CARRIER_H,
  CARRIER_LETTER,
  CARRIER_W,
  HERO_H,
  HERO_HAND,
  HERO_W,
  PALETTE,
  REG_H,
  REG_W,
  getSprites,
  makeBunkerMask,
  type SpriteSheet,
} from "./sprites";

/* Logical arcade resolution; the canvas is scaled up with nearest-neighbour. */
export const W = 320;
export const H = 200;

const PLAYER_Y = 178; // top of the hero sprite
const GROUND_Y = 198;
const BUNKER_Y = 146;
const BUNKER_XS = [36, 112, 184, 260];

/* Formation layout (offsets from the formation's top-left). */
const FW = 212;
const COLS = 10;
const COL_W = 20;
const ANSWER_SPACING = 60;
const ANSWER_OY = 10;
const ROW_OY = [30, 44, 58];
/** Height of the choice label drawn (by the UI) above each answer carrier. */
export const LABEL_H = 9;
/** Width reserved for each choice label, in logical pixels. */
export const LABEL_W = 58;

const LETTERS = "ABCD";

export type Action = "left" | "right" | "fire";
export type AnswerResult = "correct" | "wrong" | "invaded";

export interface HudState {
  score: number;
  lives: number;
  level: number;
  streak: number;
  /** 0 = formation at the top, 1 = it has landed. */
  danger: number;
}

/** Where each answer carrier is this frame, so the UI can pin its choice label to it. */
export interface AnswerSlot {
  /** Centre x and the top of the label area, in logical pixels. */
  x: number;
  y: number;
  show: boolean;
  state: "idle" | "picked" | "right" | "wrong";
}

export interface EngineCallbacks {
  /** A new wave needs a question. */
  requestQuestion(): DealtQuestion;
  onWave(q: DealtQuestion, level: number): void;
  /** A homing web was launched at answer `choice`. */
  onPick(choice: number): void;
  /** The wave's question was settled (choice is -1 when the invaders landed first). */
  onAnswer(q: DealtQuestion, choice: number, result: AnswerResult, bonus: number): void;
  onWaveClear(level: number): void;
  onGameOver(): void;
  onHud(h: HudState): void;
  onFrame(slots: AnswerSlot[]): void;
}

export interface GameSettings {
  /** 0 for K, 1-12 otherwise. */
  grade: number;
}

interface Invader {
  species: number; // 0-2 regular, 3 = answer carrier
  ox: number;
  oy: number;
  w: number;
  h: number;
  alive: boolean;
  answer?: number;
  /** Absolute position once a carrier leaves the formation. */
  leaving?: { x: number; y: number };
  /** Countdown to being popped in a wave-clear chain. */
  popT?: number;
}
interface Shot { x: number; y: number; vx: number; vy: number; homing?: number; sx: number; sy: number }
interface Bomb { x: number; y: number; vy: number; t: number }
interface Particle { x: number; y: number; vx: number; vy: number; life: number; color: string }
interface Bunker { x: number; mask: Uint8Array; canvas: HTMLCanvasElement; dirty: boolean }

type Mode = "demo" | "play" | "paused" | "dying" | "clear" | "over";

interface Wave {
  q: DealtQuestion;
  picked: number | null;
  result: AnswerResult | null;
  graceT: number;
  revealT: number;
}

function rand(a: number, b: number) {
  return a + Math.random() * (b - a);
}
function hash(n: number) {
  const s = Math.sin(n * 127.1) * 43758.5453;
  return s - Math.floor(s);
}

const SCORES = [30, 20, 10];

export class InvadersEngine {
  private ctx: CanvasRenderingContext2D;
  private sprites: SpriteSheet;
  private bg: HTMLCanvasElement;
  private raf = 0;
  private last = 0;
  private hudTimer = 0;
  private frame = 0;

  mode: Mode = "demo";
  private userPaused = false;
  private keys = new Set<Action>();

  private grade = 6;
  private px = W / 2 - HERO_W / 2;
  private stride = 0;
  private fireCd = 0;
  private invuln = 0;
  private dyingT = 0;
  private clearT = 0;
  private restartWave = false;

  private fx = 50;
  private fy = 6;
  private dir = 1;
  private stepT = 0;
  private animFrame = 0;
  private marchNote = 0;
  private speedMul = 1;
  private invaders: Invader[] = [];
  private totalRegular = 1;

  private shots: Shot[] = [];
  private bombs: Bomb[] = [];
  private bombCd = 2;
  private particles: Particle[] = [];
  private bunkers: Bunker[] = [];
  private wave: Wave | null = null;
  private banner: { text: string; color: string; t: number } | null = null;

  score = 0;
  lives = 3;
  level = 1;
  streak = 0;

  private stars = Array.from({ length: 60 }, (_, i) => ({ x: hash(i) * W, y: hash(i + 99) * 130, p: hash(i + 7) }));

  constructor(canvas: HTMLCanvasElement, private audio: ChipAudio, private cb: EngineCallbacks) {
    canvas.width = W;
    canvas.height = H;
    this.ctx = canvas.getContext("2d")!;
    this.ctx.imageSmoothingEnabled = false;
    this.sprites = getSprites();
    this.bg = this.makeBackground();
    this.resetBunkers();
    this.buildFormation(true);
  }

  /* ------------------------------ lifecycle ------------------------------ */

  start() {
    this.last = performance.now();
    const loop = (now: number) => {
      const dt = Math.max(0, Math.min(0.05, (now - this.last) / 1000)); // first frame can be slightly negative
      this.last = now;
      this.update(dt);
      this.draw();
      this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
  }

  stop() {
    cancelAnimationFrame(this.raf);
  }

  newGame(settings: GameSettings) {
    this.grade = settings.grade;
    this.mode = "play";
    this.userPaused = false;
    this.score = 0;
    this.lives = 3;
    this.level = 1;
    this.streak = 0;
    this.px = W / 2 - HERO_W / 2;
    this.particles = [];
    this.keys.clear();
    this.startWave();
  }

  /** Attract-mode demo behind the title screen. */
  demo() {
    this.mode = "demo";
    this.userPaused = false;
    this.wave = null;
    this.banner = null;
    this.level = 1;
    this.speedMul = 1;
    this.shots = [];
    this.bombs = [];
    this.resetBunkers();
    this.buildFormation(true);
    this.emitSlots();
  }

  setKey(a: Action, down: boolean) {
    if (down) this.keys.add(a);
    else this.keys.delete(a);
  }

  releaseAllKeys() {
    this.keys.clear();
  }

  /** Player-initiated pause. Returns true if now paused. */
  togglePause(force?: boolean) {
    const want = force ?? !(this.mode === "paused" && this.userPaused);
    if (want && this.mode === "play") {
      this.mode = "paused";
      this.userPaused = true;
      this.releaseAllKeys();
    } else if (!want && this.mode === "paused" && this.userPaused) {
      this.mode = "play";
      this.userPaused = false;
      this.last = performance.now();
    }
    return this.mode === "paused" && this.userPaused;
  }

  /**
   * Fire a homing web at answer carrier `choice` (0-3 = A-D). The hero can't always get
   * under every carrier in time, so this makes every answer reachable. One pick per wave.
   */
  selectAnswer(choice: number) {
    const w = this.wave;
    if (this.mode !== "play" || !w || w.result !== null || w.picked !== null) return false;
    if (!this.carrier(choice)) return false;
    w.picked = choice;
    const hx = this.px + HERO_HAND.x;
    this.shots.push({ x: hx, y: PLAYER_Y - 2, vx: 0, vy: -240, homing: choice, sx: hx, sy: PLAYER_Y });
    this.audio.tone(900, 0.25, "triangle", 0.4, 1800);
    this.cb.onPick(choice);
    return true;
  }

  /* ------------------------------ difficulty ------------------------------ */

  private get early() {
    return this.grade <= 2;
  }

  private baseInterval() {
    const g = this.grade;
    const base = g <= 2 ? 0.55 : g <= 5 ? 0.44 : g <= 8 ? 0.38 : 0.34;
    return base * Math.pow(0.9, Math.min(this.level - 1, 10));
  }

  private stepInterval() {
    const alive = this.invaders.filter((i) => i.alive && i.species < 3).length;
    const frac = alive / this.totalRegular;
    return Math.max(0.035, this.baseInterval() * this.speedMul * (0.25 + 0.75 * frac));
  }

  private bombSpeed() {
    return this.early ? 48 : Math.min(130, 66 + this.level * 6);
  }

  private maxBombs() {
    return this.early ? Math.min(3, 1 + Math.floor(this.level / 3)) : Math.min(5, 2 + Math.floor(this.level / 2));
  }

  private bombInterval() {
    const base = Math.max(0.55, 2.0 - 0.12 * this.level);
    return this.early ? base * 1.7 : base;
  }

  /* ------------------------------ setup ------------------------------ */

  private buildFormation(demo: boolean) {
    const rows = this.early ? 2 : 3;
    this.invaders = [];
    for (let i = 0; i < 4; i++) {
      this.invaders.push({
        species: 3, answer: i, alive: true,
        ox: FW / 2 + (i - 1.5) * ANSWER_SPACING - CARRIER_W / 2, oy: ANSWER_OY, w: CARRIER_W, h: CARRIER_H,
      });
    }
    const span = (COLS - 1) * COL_W + REG_W;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < COLS; c++) {
        this.invaders.push({
          species: rows === 2 ? r + 1 : r, alive: true,
          ox: (FW - span) / 2 + c * COL_W, oy: ROW_OY[r], w: REG_W, h: REG_H,
        });
      }
    }
    this.totalRegular = rows * COLS;
    this.fx = (W - FW) / 2;
    this.fy = demo ? 14 : 6 + Math.min(this.level - 1, 5) * 4;
    this.dir = 1;
    this.stepT = 0.5;
  }

  private resetBunkers() {
    this.bunkers = BUNKER_XS.map((x) => {
      const canvas = document.createElement("canvas");
      canvas.width = BUNKER_W;
      canvas.height = BUNKER_H;
      return { x, mask: makeBunkerMask(), canvas, dirty: true };
    });
  }

  private startWave() {
    const q = this.cb.requestQuestion();
    this.wave = { q, picked: null, result: null, graceT: this.early ? 4 : 2.5, revealT: 0 };
    this.speedMul = 1;
    this.shots = [];
    this.bombs = [];
    this.bombCd = 1;
    this.invuln = Math.max(this.invuln, 1);
    this.resetBunkers();
    this.buildFormation(false);
    this.mode = "play";
    this.banner = { text: `WAVE ${this.level}`, color: PALETTE.yellow, t: 1.6 };
    this.cb.onWave(q, this.level);
    this.emitHud();
  }

  /* ------------------------------ update ------------------------------ */

  private update(dt: number) {
    this.frame++;
    this.updateParticles(dt);
    if (this.banner) {
      this.banner.t -= dt;
      if (this.banner.t <= 0) this.banner = null;
    }

    if (this.mode === "paused" || this.mode === "over") return;

    if (this.mode === "dying") {
      this.dyingT -= dt;
      if (this.dyingT <= 0) this.respawn();
      this.emitSlots();
      return;
    }

    if (this.mode === "clear") {
      this.clearT -= dt;
      this.updatePops(dt);
      this.updateShots(dt);
      this.updateCarriersLeaving(dt);
      if (this.clearT <= 0) {
        this.level++;
        this.audio.levelUp();
        this.startWave();
      }
      this.emitSlots();
      this.tickHud(dt);
      return;
    }

    const demo = this.mode === "demo";

    // Hero movement
    const speed = 95;
    let move = 0;
    if (demo) {
      const target = W / 2 + Math.sin(this.frame / 90) * 110 - HERO_W / 2;
      move = Math.sign(target - this.px) * Math.min(Math.abs(target - this.px), speed * dt);
    } else {
      if (this.keys.has("left")) move -= speed * dt;
      if (this.keys.has("right")) move += speed * dt;
    }
    this.px = Math.max(2, Math.min(W - HERO_W - 2, this.px + move));
    if (move !== 0) this.stride += Math.abs(move);

    // Fire
    this.fireCd -= dt;
    const wantFire = demo ? this.frame % 55 === 0 : this.keys.has("fire");
    if (wantFire && this.fireCd <= 0) this.fire();

    this.invuln = Math.max(0, this.invuln - dt);

    this.march(dt, demo);
    this.updateShots(dt);
    this.updateCarriersLeaving(dt);

    if (demo) {
      const reg = this.invaders.filter((i) => i.alive && i.species < 3);
      if (reg.length === 0 || this.lowestBottom() > 120) {
        this.buildFormation(true);
      }
      return;
    }

    this.dropBombs(dt);
    this.updateBombs(dt);
    this.updateWave(dt);
    if (this.mode !== "play") return;

    // Invasion: the formation reached the hero's row.
    if (this.lowestBottom() >= PLAYER_Y) {
      const w = this.wave;
      if (w && w.result === null) {
        w.result = "invaded";
        this.shots = this.shots.filter((s) => s.homing === undefined);
        this.cb.onAnswer(w.q, -1, "invaded", 0);
      }
      this.restartWave = true;
      this.banner = { text: "INVADED!", color: PALETTE.red, t: 2 };
      this.die();
      return;
    }

    this.emitSlots();
    this.tickHud(dt);
  }

  private tickHud(dt: number) {
    this.hudTimer -= dt;
    if (this.hudTimer <= 0) {
      this.hudTimer = 0.1;
      this.emitHud();
    }
  }

  private fire() {
    const own = this.shots.filter((s) => s.homing === undefined).length;
    if (own >= 2) return;
    const hx = this.px + HERO_HAND.x;
    this.shots.push({ x: hx, y: PLAYER_Y - 4, vx: 0, vy: -230, sx: hx, sy: PLAYER_Y });
    this.fireCd = 0.28;
    if (this.mode !== "demo") this.audio.shoot();
  }

  private pos(inv: Invader) {
    return inv.leaving ?? { x: this.fx + inv.ox, y: this.fy + inv.oy };
  }

  private carrier(i: number) {
    return this.invaders.find((v) => v.species === 3 && v.answer === i && v.alive && !v.leaving);
  }

  private inFormation() {
    return this.invaders.filter((i) => i.alive && !i.leaving);
  }

  private lowestBottom() {
    let b = 0;
    for (const i of this.inFormation()) b = Math.max(b, this.fy + i.oy + i.h);
    return b;
  }

  private march(dt: number, demo: boolean) {
    this.stepT -= dt;
    if (this.stepT > 0) return;
    this.stepT = this.stepInterval();
    const alive = this.inFormation();
    if (alive.length === 0) return;
    const dx = 3;
    let minX = Infinity;
    let maxX = -Infinity;
    for (const i of alive) {
      minX = Math.min(minX, this.fx + i.ox);
      maxX = Math.max(maxX, this.fx + i.ox + i.w);
    }
    if ((this.dir > 0 && maxX + dx > W - 4) || (this.dir < 0 && minX - dx < 4)) {
      this.fy += this.early ? 5 : 7;
      this.dir = -this.dir;
    } else {
      this.fx += dx * this.dir;
    }
    this.animFrame ^= 1;
    if (!demo) {
      const notes = [98, 92, 87, 82];
      this.audio.tone(notes[this.marchNote++ % 4], 0.07, "square", 0.22);
    }
    // Invaders marching through a bunker tear the web away.
    for (const i of alive) {
      const p = this.pos(i);
      if (p.y + i.h < BUNKER_Y) continue;
      for (const b of this.bunkers) this.eraseRect(b, p.x, p.y, i.w, i.h);
    }
  }

  private dropBombs(dt: number) {
    const w = this.wave;
    if (w && w.graceT > 0) {
      w.graceT -= dt;
      return;
    }
    this.bombCd -= dt;
    if (this.bombCd > 0 || this.bombs.length >= this.maxBombs()) return;
    this.bombCd = rand(0.5, 1.5) * this.bombInterval();
    // Bottom-most regular invader in each column can drop a bomb.
    const shooters = new Map<number, Invader>();
    for (const i of this.inFormation()) {
      if (i.species === 3) continue;
      const cur = shooters.get(i.ox);
      if (!cur || i.oy > cur.oy) shooters.set(i.ox, i);
    }
    const list = [...shooters.values()];
    if (list.length === 0) return;
    const hx = this.px + HERO_W / 2;
    let pickI = list[Math.floor(Math.random() * list.length)];
    if (Math.random() < (this.early ? 0.15 : 0.3)) {
      pickI = list.reduce((a, b) => (Math.abs(this.fx + a.ox + 6 - hx) < Math.abs(this.fx + b.ox + 6 - hx) ? a : b));
    }
    const p = this.pos(pickI);
    this.bombs.push({ x: p.x + pickI.w / 2, y: p.y + pickI.h, vy: this.bombSpeed(), t: 0 });
  }

  private updateShots(dt: number) {
    for (const s of this.shots) {
      if (s.homing !== undefined) {
        const c = this.carrier(s.homing);
        if (c) {
          const p = this.pos(c);
          const dx = p.x + c.w / 2 - s.x;
          const dy = p.y + c.h / 2 - s.y;
          const d = Math.max(1, Math.hypot(dx, dy));
          s.vx = (dx / d) * 260;
          s.vy = (dy / d) * 260;
        }
      }
      s.x += s.vx * dt;
      s.y += s.vy * dt;
    }
    for (const s of this.shots) this.shotCollisions(s);
    this.shots = this.shots.filter((s) => s.y > -8 && s.y < H && s.x > -8 && s.x < W + 8);
  }

  private shotCollisions(s: Shot) {
    const w = this.wave;
    if (s.homing !== undefined) {
      const c = this.carrier(s.homing);
      if (!c) {
        s.y = -100;
        // Target gone (e.g. the wave ended); give the pick back if nothing was decided.
        if (w && w.result === null && w.picked === s.homing) w.picked = null;
        return;
      }
      const p = this.pos(c);
      if (s.x >= p.x - 2 && s.x <= p.x + c.w + 2 && s.y >= p.y - 2 && s.y <= p.y + c.h + 2) {
        s.y = -100;
        this.hitCarrier(c);
      }
      return;
    }

    // Bombs
    for (const b of this.bombs) {
      if (Math.abs(s.x - b.x) < 3 && s.y - b.y < 6 && b.y - s.y < 6) {
        b.y = 9999;
        s.y = -100;
        this.burst(s.x, s.y, 5, PALETTE.web);
        this.score += 5;
        return;
      }
    }
    // Bunkers
    for (const b of this.bunkers) {
      for (let yy = 0; yy < 5; yy++) {
        if (this.bunkerAt(b, s.x, s.y + yy)) {
          this.erode(b, s.x, s.y + yy, 2);
          s.y = -100;
          return;
        }
      }
    }
    // Invaders
    for (const inv of this.invaders) {
      if (!inv.alive || inv.popT !== undefined) continue;
      const p = this.pos(inv);
      // Plain webs only catch a carrier through its window (the middle 12 px), which sits
      // right above a column of regular invaders: clear that column first to aim at it.
      const inset = inv.species === 3 ? 5 : 0;
      if (s.x >= p.x + inset && s.x <= p.x + inv.w - inset && s.y <= p.y + inv.h && s.y + 5 >= p.y) {
        if (inv.species === 3) {
          // Carriers only count while the question is open and no homing web is on its way.
          if (this.mode !== "play" || !w || w.result !== null || w.picked !== null || inv.leaving) {
            if (this.mode === "demo") {
              s.y = -100;
              this.burst(s.x, s.y + 2, 4, PALETTE.yellow);
            }
            continue;
          }
          s.y = -100;
          w.picked = inv.answer!;
          this.cb.onPick(inv.answer!);
          this.hitCarrier(inv);
          return;
        }
        s.y = -100;
        inv.alive = false;
        this.pop(inv);
        if (this.mode !== "demo") {
          this.score += SCORES[inv.species];
          this.audio.explode();
        }
        return;
      }
    }
  }

  private hitCarrier(c: Invader) {
    const w = this.wave;
    if (!w || w.result !== null || c.answer === undefined) return;
    const p = this.pos(c);
    if (c.answer === w.q.answer) {
      this.streak++;
      const mult = Math.min(this.streak, 5);
      const bonus = (300 + 100 * this.level) * mult;
      this.score += bonus;
      w.result = "correct";
      c.alive = false;
      this.burst(p.x + c.w / 2, p.y + c.h / 2, 40, PALETTE.green);
      this.burst(p.x + c.w / 2, p.y + c.h / 2, 20, PALETTE.yellow);
      this.audio.correct();
      // Chain-pop the rest of the formation for their points.
      let n = 0;
      for (const inv of this.invaders) {
        if (!inv.alive || inv.leaving) continue;
        if (inv.species === 3) {
          const q = this.pos(inv);
          inv.leaving = { x: q.x, y: q.y };
        } else {
          inv.popT = 0.25 + n++ * 0.04;
        }
      }
      this.bombs = [];
      this.mode = "clear";
      this.clearT = Math.max(2.4, 0.6 + n * 0.04);
      this.banner = { text: mult > 1 ? `CORRECT! ×${mult}` : "CORRECT!", color: PALETTE.green, t: this.clearT };
      this.cb.onAnswer(w.q, c.answer, "correct", bonus);
      this.emitHud();
    } else {
      this.streak = 0;
      w.result = "wrong";
      w.revealT = 3;
      c.alive = false;
      this.burst(p.x + c.w / 2, p.y + c.h / 2, 30, PALETTE.red);
      this.audio.wrong();
      // Formation gets angry: faster march and a drop.
      this.speedMul *= 0.65;
      this.fy += this.early ? 3 : 5;
      this.banner = { text: "WRONG ANSWER!", color: PALETTE.red, t: 1.8 };
      this.cb.onAnswer(w.q, c.answer, "wrong", 0);
      this.emitHud();
    }
  }

  private updateWave(dt: number) {
    const w = this.wave;
    if (!w) return;
    if (w.result === "wrong") {
      if (w.revealT > 0) {
        w.revealT -= dt;
        if (w.revealT <= 0) {
          // The remaining carriers fly off; clear the regular invaders to finish the wave.
          for (const inv of this.invaders) {
            if (inv.species === 3 && inv.alive && !inv.leaving) inv.leaving = this.pos(inv);
          }
        }
      }
      const regLeft = this.invaders.some((i) => i.alive && i.species < 3);
      if (!regLeft && w.revealT <= 0) {
        this.mode = "clear";
        this.clearT = 2;
        this.bombs = [];
        this.banner = { text: "WAVE CLEAR", color: PALETTE.yellow, t: 2 };
        this.cb.onWaveClear(this.level);
      }
    }
  }

  private updateCarriersLeaving(dt: number) {
    for (const inv of this.invaders) {
      if (inv.leaving && inv.alive) {
        inv.leaving.y -= 70 * dt;
        if (inv.leaving.y < -20) inv.alive = false;
      }
    }
  }

  private updatePops(dt: number) {
    for (const inv of this.invaders) {
      if (inv.popT === undefined || !inv.alive) continue;
      inv.popT -= dt;
      if (inv.popT <= 0) {
        inv.alive = false;
        this.score += SCORES[inv.species];
        this.pop(inv);
        if (Math.random() < 0.3) this.audio.blip();
      }
    }
  }

  private pop(inv: Invader) {
    const p = this.pos(inv);
    const colors = ["#c070ff", "#3fd35f", "#ff9a3a"];
    this.burst(p.x + inv.w / 2, p.y + inv.h / 2, 12, colors[inv.species] ?? PALETTE.yellow);
    this.splats.push({ x: p.x, y: p.y, t: 0.3 });
  }

  private splats: { x: number; y: number; t: number }[] = [];

  private updateBombs(dt: number) {
    for (const b of this.bombs) {
      b.y += b.vy * dt;
      b.t += dt;
    }
    for (const b of this.bombs) {
      if (b.y > 9000) continue;
      for (const bk of this.bunkers) {
        if (this.bunkerAt(bk, b.x, b.y + 3)) {
          this.erode(bk, b.x, b.y + 3, 3);
          b.y = 9999;
          break;
        }
      }
      if (b.y > 9000) continue;
      if (b.y >= GROUND_Y - 2) {
        this.burst(b.x, GROUND_Y - 1, 6, PALETTE.lightBlue);
        b.y = 9999;
        continue;
      }
      if (this.invuln <= 0 && b.x >= this.px + 3 && b.x <= this.px + HERO_W - 3 && b.y + 3 >= PLAYER_Y + 4 && b.y <= PLAYER_Y + HERO_H) {
        b.y = 9999;
        this.die();
        return;
      }
    }
    this.bombs = this.bombs.filter((b) => b.y < 9000);
  }

  private die() {
    this.mode = "dying";
    this.dyingT = 1.8;
    this.lives--;
    this.streak = 0;
    this.bombs = [];
    this.burst(this.px + 8, PLAYER_Y + 9, 40, PALETTE.red);
    this.burst(this.px + 8, PLAYER_Y + 9, 25, PALETTE.blue);
    this.burst(this.px + 8, PLAYER_Y + 9, 10, PALETTE.yellow);
    this.audio.crash();
    this.emitHud();
  }

  private respawn() {
    if (this.lives <= 0) {
      this.mode = "over";
      this.wave = null;
      this.emitSlots();
      this.audio.stopMusic();
      this.audio.gameOver();
      this.cb.onGameOver();
      return;
    }
    this.px = W / 2 - HERO_W / 2;
    this.invuln = 2;
    this.releaseAllKeys();
    this.mode = "play";
    if (this.restartWave) {
      this.restartWave = false;
      this.startWave();
    }
    this.emitHud();
  }

  /* ------------------------------ bunkers ------------------------------ */

  private bunkerAt(b: Bunker, x: number, y: number) {
    const bx = Math.floor(x - b.x);
    const by = Math.floor(y - BUNKER_Y);
    if (bx < 0 || by < 0 || bx >= BUNKER_W || by >= BUNKER_H) return false;
    return b.mask[by * BUNKER_W + bx] > 0;
  }

  private erode(b: Bunker, x: number, y: number, r: number) {
    const cx = Math.floor(x - b.x);
    const cy = Math.floor(y - BUNKER_Y);
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        const bx = cx + dx;
        const by = cy + dy;
        if (bx < 0 || by < 0 || bx >= BUNKER_W || by >= BUNKER_H) continue;
        // Ragged edges, like torn silk.
        if (dx * dx + dy * dy > r * r + (Math.random() < 0.5 ? 1 : -1)) continue;
        b.mask[by * BUNKER_W + bx] = 0;
      }
    }
    b.dirty = true;
    this.burst(x, y, 4, PALETTE.web);
  }

  private eraseRect(b: Bunker, x: number, y: number, w: number, h: number) {
    for (let yy = Math.floor(y); yy < y + h; yy++) {
      for (let xx = Math.floor(x); xx < x + w; xx++) {
        const bx = xx - b.x;
        const by = yy - BUNKER_Y;
        if (bx < 0 || by < 0 || bx >= BUNKER_W || by >= BUNKER_H) continue;
        if (b.mask[by * BUNKER_W + bx]) {
          b.mask[by * BUNKER_W + bx] = 0;
          b.dirty = true;
        }
      }
    }
  }

  /* ------------------------------ effects ------------------------------ */

  private burst(x: number, y: number, n: number, color: string) {
    for (let i = 0; i < n; i++) {
      this.particles.push({ x, y, vx: rand(-70, 70), vy: rand(-90, 40), life: rand(0.3, 0.9), color });
    }
  }

  private updateParticles(dt: number) {
    for (const p of this.particles) {
      p.vy += 120 * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
    }
    this.particles = this.particles.filter((p) => p.life > 0 && p.y < H);
    for (const s of this.splats) s.t -= dt;
    this.splats = this.splats.filter((s) => s.t > 0);
  }

  private emitHud() {
    const top = 72;
    const d = (this.lowestBottom() - top) / (PLAYER_Y - top);
    this.cb.onHud({
      score: this.score,
      lives: this.lives,
      level: this.level,
      streak: this.streak,
      danger: Math.max(0, Math.min(1, d)),
    });
  }

  private emitSlots() {
    const w = this.wave;
    const playing = w !== null && (this.mode === "play" || this.mode === "dying" || this.mode === "paused");
    const slots: AnswerSlot[] = [0, 1, 2, 3].map((i) => {
      const c = this.invaders.find((v) => v.species === 3 && v.answer === i && v.alive);
      if (!c || !playing || !w) return { x: 0, y: 0, show: false, state: "idle" };
      const p = this.pos(c);
      let state: AnswerSlot["state"] = "idle";
      if (w.result === "wrong" || w.result === "invaded") state = i === w.q.answer ? "right" : "idle";
      else if (w.picked === i) state = "picked";
      const show = !c.leaving || state === "right";
      return { x: p.x + c.w / 2, y: p.y - LABEL_H - 1, show, state };
    });
    this.cb.onFrame(slots);
  }

  /* ------------------------------ render ------------------------------ */

  private makeBackground() {
    const c = document.createElement("canvas");
    c.width = W;
    c.height = H;
    const g = c.getContext("2d")!;
    // Night sky, a touch lighter near the horizon
    g.fillStyle = PALETTE.sky;
    g.fillRect(0, 0, W, H);
    g.fillStyle = PALETTE.skyLow;
    for (let y = 120; y < H; y += 2) {
      if (y > 150 || y % 4 === 0) g.fillRect(0, y, W, 1);
    }
    // Moon
    const mx = 292;
    const my = 26;
    const r = 11;
    for (let y = -r; y <= r; y++) {
      for (let x = -r; x <= r; x++) {
        if (x * x + y * y > r * r) continue;
        const crater = hash(Math.floor((x + 30) / 3) * 7 + Math.floor((y + 30) / 3) * 13) > 0.8;
        g.fillStyle = crater || x > r * 0.5 + y * 0.3 ? PALETTE.moonShade : PALETTE.moon;
        g.fillRect(mx + x, my + y, 1, 1);
      }
    }
    // City skyline behind the hero
    let x = 0;
    let i = 0;
    while (x < W) {
      const bw = 10 + Math.floor(hash(i + 3) * 18);
      const bh = 14 + Math.floor(hash(i * 3.3 + 1) * 34);
      const top = GROUND_Y - bh;
      g.fillStyle = hash(i + 50) > 0.5 ? PALETTE.city : PALETTE.cityHi;
      g.fillRect(x, top, bw, bh);
      for (let wy = top + 3; wy < GROUND_Y - 3; wy += 4) {
        for (let wx = x + 2; wx < x + bw - 2; wx += 3) {
          const hv = hash(wx * 1.7 + wy * 3.1);
          if (hv > 0.9) {
            g.fillStyle = PALETTE.window;
            g.globalAlpha = 0.45;
            g.fillRect(wx, wy, 1, 1);
            g.globalAlpha = 1;
          } else if (hv > 0.6) {
            g.fillStyle = PALETTE.windowDim;
            g.fillRect(wx, wy, 1, 1);
          }
        }
      }
      if (hash(i + 70) > 0.7) {
        // rooftop antenna
        g.fillStyle = PALETTE.cityHi;
        g.fillRect(x + Math.floor(bw / 2), top - 5, 1, 5);
      }
      x += bw + (hash(i * 7) > 0.7 ? 2 : 0);
      i++;
    }
    // Ground line
    g.fillStyle = PALETTE.blue;
    g.fillRect(0, GROUND_Y, W, 2);
    g.fillStyle = PALETTE.red;
    for (let gx = 0; gx < W; gx += 8) g.fillRect(gx, GROUND_Y, 4, 1);
    return c;
  }

  private draw() {
    const g = this.ctx;
    g.drawImage(this.bg, 0, 0);

    // Twinkling stars
    for (const s of this.stars) {
      const tw = (this.frame + s.p * 200) % 120 < 10;
      g.fillStyle = s.p > 0.7 && !tw ? PALETTE.star : PALETTE.starDim;
      if (s.x > 278 && s.y < 40) continue; // behind the moon
      g.fillRect(Math.floor(s.x), Math.floor(s.y), 1, 1);
    }

    // Bunkers
    for (const b of this.bunkers) {
      if (b.dirty) this.renderBunker(b);
      g.drawImage(b.canvas, b.x, BUNKER_Y);
    }

    // Invaders
    const w = this.wave;
    for (const inv of this.invaders) {
      if (!inv.alive) continue;
      const p = this.pos(inv);
      const x = Math.floor(p.x);
      const y = Math.floor(p.y);
      if (inv.species < 3) {
        g.drawImage(this.sprites.invaders[inv.species][this.animFrame], x, y);
        continue;
      }
      let look: "normal" | "normalB" | "right" | "wrong" | "picked" = this.frame % 40 < 20 ? "normal" : "normalB";
      if (w && (w.result === "wrong" || w.result === "invaded") && inv.answer === w.q.answer) {
        look = this.frame % 12 < 6 ? "right" : "normal";
      } else if (w && w.picked === inv.answer && w.result === null) {
        look = "picked";
      }
      if (this.mode === "demo") look = "normal";
      g.drawImage(this.sprites.carrier[look][this.animFrame], x, y);
      const ch = this.mode === "demo" ? "?" : LETTERS[inv.answer ?? 0];
      g.drawImage(this.sprites.glyphs[ch], x + CARRIER_LETTER.x, y + CARRIER_LETTER.y);
    }

    for (const s of this.splats) g.drawImage(this.sprites.splat, Math.floor(s.x), Math.floor(s.y));

    // Bombs: little zig-zag stingers
    for (const b of this.bombs) {
      const zig = Math.floor(b.t * 12) % 2;
      g.fillStyle = this.frame % 8 < 4 ? PALETTE.red : PALETTE.yellow;
      g.fillRect(Math.floor(b.x) - zig, Math.floor(b.y), 1, 2);
      g.fillRect(Math.floor(b.x) - 1 + zig, Math.floor(b.y) + 2, 1, 2);
      g.fillRect(Math.floor(b.x) - zig, Math.floor(b.y) + 4, 1, 1);
    }

    // Webs
    for (const s of this.shots) {
      const x = Math.floor(s.x);
      const y = Math.floor(s.y);
      if (s.homing !== undefined) {
        // Homing web: a glowing web ball trailing a silk line back to where it was thrown.
        g.strokeStyle = "rgba(238,244,255,0.55)";
        g.lineWidth = 1;
        g.beginPath();
        g.moveTo(s.sx + 0.5, s.sy + 0.5);
        g.lineTo(x + 0.5, y + 0.5);
        g.stroke();
        g.fillStyle = this.frame % 6 < 3 ? PALETTE.cyan : PALETTE.web;
        g.fillRect(x - 2, y - 1, 5, 3);
        g.fillRect(x - 1, y - 2, 3, 5);
        g.fillStyle = PALETTE.yellow;
        g.fillRect(x, y, 1, 1);
      } else {
        g.fillStyle = PALETTE.web;
        g.fillRect(x, y, 1, 5);
        g.fillRect(x - 1, y, 3, 1);
        g.fillStyle = PALETTE.lightBlue;
        g.fillRect(x, y + 5, 1, 2);
      }
    }

    // Hero
    if (this.mode !== "dying" && this.mode !== "over") {
      const visible = this.invuln <= 0 || this.frame % 8 < 5 || this.mode === "demo";
      if (visible) {
        const step = Math.floor(this.stride / 6) % 2 === 1;
        g.drawImage(step ? this.sprites.heroStep : this.sprites.hero, Math.floor(this.px), PLAYER_Y);
      }
    }

    // Particles
    for (const p of this.particles) {
      g.fillStyle = p.color;
      g.fillRect(Math.floor(p.x), Math.floor(p.y), 1, 1);
    }

    // Banner text in the middle of the screen
    if (this.banner && this.mode !== "demo") {
      const t = this.banner;
      this.text(t.text, W / 2 + 1, 121, "#000000", 8, "center");
      this.text(t.text, W / 2, 120, t.color, 8, "center");
    }
    if (this.mode === "over") {
      this.text("GAME OVER", W / 2 + 1, 101, "#000000", 16, "center");
      this.text("GAME OVER", W / 2, 100, PALETTE.red, 16, "center");
    }
  }

  private renderBunker(b: Bunker) {
    const g = b.canvas.getContext("2d")!;
    g.clearRect(0, 0, BUNKER_W, BUNKER_H);
    for (let y = 0; y < BUNKER_H; y++) {
      for (let x = 0; x < BUNKER_W; x++) {
        const v = b.mask[y * BUNKER_W + x];
        if (!v) continue;
        g.fillStyle = v === 2 ? PALETTE.web : PALETTE.silk;
        g.fillRect(x, y, 1, 1);
      }
    }
    b.dirty = false;
  }

  private text(s: string, x: number, y: number, color: string, size: number, align: CanvasTextAlign) {
    const g = this.ctx;
    g.font = `${size}px "Press Start 2P", monospace`;
    g.textAlign = align;
    g.textBaseline = "top";
    g.fillStyle = color;
    g.fillText(s, x, y);
  }
}
