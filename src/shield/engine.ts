import type { ChipAudio, Grade } from "@/kit";
import { forEachPixel, textWidth } from "./font";
import { labelScale, makeRound, outcomeNote, type MissileMath, type Outcome, type Round } from "./missions";
import { CITY_H, CITY_W, HERO_H, PALETTE, TURRET_H, TURRET_W, getSprites, type SpriteSheet } from "./sprites";

/* Logical arcade resolution; the canvas is scaled up with nearest-neighbour. */
export const W = 320;
export const H = 200;

const GROUND_Y = 188;
export const LAUNCHER_X = [16, 160, 304];
export const CITY_X = [52, 84, 116, 204, 236, 268];
const LETTERS = "ABCD";

export type Action = "left" | "right" | "up" | "down" | "fire";

export interface Threat {
  letter: string;
  label: string;
  locked: boolean;
}

export interface HudState {
  score: number;
  wave: number;
  cities: number;
  ammo: number[];
  streak: number;
  threats: Threat[];
}

export interface WaveSummary {
  wave: number;
  cities: number;
  ammoLeft: number;
  bonus: number;
  stopped: number;
  wasted: number;
  landed: number;
}

export interface EngineCallbacks {
  onHud(h: HudState): void;
  onWaveStart(round: Round, wave: number): void;
  /** A decision about a missile: `correct` is true for a live one stopped or a decoy left alone. */
  onDecision(round: Round, outcome: Outcome, correct: boolean): void;
  /** Wave over: the UI shows a transmission, then calls resolveCheckpoint(). */
  onWaveEnd(summary: WaveSummary): void;
  onGameOver(): void;
}

interface Missile {
  id: number;
  sx: number;
  sy: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  /** Where it ends: impact point for live ones, burn-up height for decoys. */
  endY: number;
  /** City (0-5) or launcher (10-12) it's aimed at. */
  aim: number;
  math: MissileMath;
  letter: string | null;
  lockedBy: number | null;
  labelW: number;
  alive: boolean;
}

interface Interceptor {
  id: number;
  sx: number;
  sy: number;
  x: number;
  y: number;
  tx: number;
  ty: number;
  homing: number | null;
  speed: number;
}

interface Blast {
  x: number;
  y: number;
  r: number;
  t: number;
  max: number;
  friendly: boolean;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
}

interface Floater {
  text: string;
  x: number;
  y: number;
  t: number;
  color: string;
}

type Mode = "demo" | "play" | "tally" | "checkpoint" | "ending" | "over";

function rand(a: number, b: number) {
  return a + Math.random() * (b - a);
}
function hash(n: number) {
  const s = Math.sin(n * 127.1) * 43758.5453;
  return s - Math.floor(s);
}
function shuffle<T>(a: T[]): T[] {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export class ShieldEngine {
  private ctx: CanvasRenderingContext2D;
  private sprites: SpriteSheet;
  private bg: HTMLCanvasElement;
  private raf = 0;
  private last = 0;
  private hudTimer = 0;
  private frame = 0;
  private textCache = new Map<string, HTMLCanvasElement>();

  mode: Mode = "demo";
  paused = false;
  private keys = new Set<Action>();

  grade: Grade = "5";
  wave = 1;
  score = 0;
  streak = 0;
  round: Round | null = null;

  cities: boolean[] = [true, true, true, true, true, true];
  ammo: number[] = [10, 10, 10];
  launcherUp: boolean[] = [true, true, true];

  missiles: Missile[] = [];
  interceptors: Interceptor[] = [];
  blasts: Blast[] = [];
  private particles: Particle[] = [];
  floaters: Floater[] = [];
  private banner: { lines: { text: string; color: string }[]; t: number } | null = null;

  cx = W / 2;
  cy = 100;
  private nextId = 1;
  private queue: boolean[] = [];
  private spawnT = 0;
  private tallyT = 0;
  private endingT = 0;
  private stats = { stopped: 0, wasted: 0, landed: 0 };
  private demoT = 0;

  private stars = Array.from({ length: 70 }, (_, i) => ({ x: hash(i) * W, y: 12 + hash(i + 99) * 120, p: hash(i + 7) }));

  constructor(canvas: HTMLCanvasElement, private audio: ChipAudio, private cb: EngineCallbacks) {
    canvas.width = W;
    canvas.height = H;
    this.ctx = canvas.getContext("2d")!;
    this.ctx.imageSmoothingEnabled = false;
    this.sprites = getSprites();
    this.bg = this.makeBackground();
  }

  /* ------------------------------ lifecycle ------------------------------ */

  start() {
    this.last = performance.now();
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - this.last) / 1000);
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

  /** Attract mode behind the title screen: labelled missiles fall and get intercepted. */
  demo(grade: Grade) {
    this.grade = grade;
    this.mode = "demo";
    this.paused = false;
    this.wave = 1;
    this.round = makeRound(grade, 1);
    this.cities = this.cities.map(() => true);
    this.launcherUp = [true, true, true];
    this.ammo = [99, 99, 99];
    this.missiles = [];
    this.interceptors = [];
    this.blasts = [];
    this.floaters = [];
    this.banner = null;
    this.demoT = 0.5;
  }

  newGame(grade: Grade) {
    this.grade = grade;
    this.score = 0;
    this.streak = 0;
    this.wave = 1;
    this.paused = false;
    this.cities = this.cities.map(() => true);
    this.particles = [];
    this.keys.clear();
    this.cx = W / 2;
    this.cy = 100;
    this.startWave();
  }

  setKey(a: Action, down: boolean) {
    if (down) this.keys.add(a);
    else this.keys.delete(a);
    if (down && a === "fire") this.fireAt(this.cx, this.cy);
  }

  releaseAllKeys() {
    this.keys.clear();
  }

  /** Player-initiated pause. Returns true if now paused. */
  togglePause(force?: boolean) {
    const want = force ?? !this.paused;
    if (this.mode !== "play" && this.mode !== "tally") return this.paused;
    this.paused = want;
    if (want) this.releaseAllKeys();
    else this.last = performance.now();
    return this.paused;
  }

  /** The transmission between waves was answered. A right answer rebuilds a city. */
  resolveCheckpoint(correct: boolean) {
    if (this.mode !== "checkpoint") return;
    if (correct) {
      const lost = this.cities.map((c, i) => (c ? -1 : i)).filter((i) => i >= 0);
      if (lost.length) {
        this.cities[lost[Math.floor(Math.random() * lost.length)]] = true;
        this.floaters.push({ text: "CITY REBUILT!", x: W / 2, y: 150, t: 2.2, color: PALETTE.green });
      } else {
        this.score += 250;
        this.floaters.push({ text: "+250 BONUS", x: W / 2, y: 150, t: 2.2, color: PALETTE.green });
      }
    }
    this.wave++;
    this.audio.levelUp();
    this.startWave();
  }

  /* ------------------------------ difficulty ------------------------------ */

  private get band(): 0 | 1 | 2 {
    const g = this.grade === "K" ? 0 : Number(this.grade);
    return g <= 2 ? 0 : g <= 8 ? 1 : 2;
  }

  private waveSize() {
    return [Math.min(12, 6 + this.wave), Math.min(16, 8 + this.wave), Math.min(14, 7 + this.wave)][this.band];
  }

  maxAtOnce() {
    const w = this.wave;
    return [w <= 2 ? 2 : 3, Math.min(5, 3 + Math.floor(w / 2)), Math.min(4, 2 + Math.floor((w + 1) / 2))][this.band];
  }

  private spawnInterval() {
    const w = this.wave - 1;
    return [Math.max(4, 6 - 0.3 * w), Math.max(2.2, 4 - 0.25 * w), Math.max(3, 5 - 0.3 * w)][this.band];
  }

  /** Falling speed in logical px/s: slow for K-2, a little faster every wave. */
  missileSpeed() {
    const w = this.wave - 1;
    return [Math.min(10, 6.5 + 0.4 * w), Math.min(14, 8 + 0.6 * w), Math.min(12, 7 + 0.5 * w)][this.band];
  }

  blastRadius() {
    return this.band === 0 ? 18 : 14;
  }

  private ammoPerLauncher() {
    return this.band === 0 ? 12 : 10;
  }

  private get scale() {
    return labelScale(this.grade);
  }

  /** Height of the in-canvas header (target line, plus function definitions). */
  private headerH() {
    return this.round?.context ? 19 : 10;
  }

  private spawnY() {
    return this.headerH() + 8 * this.scale + 6;
  }

  /* ------------------------------ waves ------------------------------ */

  private startWave() {
    const round = makeRound(this.grade, this.wave);
    this.round = round;
    this.mode = "play";
    this.missiles = [];
    this.interceptors = [];
    this.blasts = [];
    this.stats = { stopped: 0, wasted: 0, landed: 0 };
    this.launcherUp = [true, true, true];
    this.ammo = this.launcherUp.map(() => this.ammoPerLauncher());
    const n = this.waveSize();
    const live = Math.ceil(n / 2);
    this.queue = shuffle([...Array(live).fill(true), ...Array(n - live).fill(false)]);
    // Start with a live one so the first missile always matters.
    const first = this.queue.indexOf(true);
    [this.queue[0], this.queue[first]] = [this.queue[first], this.queue[0]];
    this.spawnT = this.band === 0 ? 3.5 : 2.5;
    const head =
      round.mode === "match"
        ? { text: `TARGET ${round.targetText}`, color: PALETTE.yellow }
        : { text: "STOP THE WRONG ANSWERS!", color: PALETTE.red };
    this.banner = { lines: [{ text: `WAVE ${this.wave}`, color: PALETTE.cyan }, head], t: 3 };
    this.cb.onWaveStart(round, this.wave);
    this.emitHud();
  }

  private spawnMissile(demo = false) {
    const round = this.round;
    if (!round) return;
    const danger = demo ? Math.random() < 0.5 : this.queue.shift()!;
    const avoid = new Set(this.missiles.filter((m) => m.alive).map((m) => m.math.label));
    let math = round.next(danger, avoid);
    if (avoid.has(math.label)) math = round.next(!danger, avoid);
    const scale = this.scale;
    const labelW = textWidth(math.label, scale) + 4 * scale;

    // Aim: live missiles at a standing city (sometimes a launcher); decoys anywhere.
    const standing = this.cities.map((c, i) => (c ? i : -1)).filter((i) => i >= 0);
    let aim: number;
    if (math.danger && standing.length) {
      aim = this.band > 0 && Math.random() < 0.2 ? 10 + Math.floor(Math.random() * 3) : standing[Math.floor(Math.random() * standing.length)];
    } else {
      aim = Math.random() < 0.8 ? Math.floor(Math.random() * 6) : 10 + Math.floor(Math.random() * 3);
    }
    const tx = aim >= 10 ? LAUNCHER_X[aim - 10] : CITY_X[aim];
    const ty = aim >= 10 ? GROUND_Y - 10 : GROUND_Y - CITY_H + 3;

    // Start somewhere its label doesn't sit on top of another label.
    const sy = this.spawnY();
    let sx = 0;
    for (let i = 0; i < 20; i++) {
      sx = rand(10 + labelW / 2, W - 10 - labelW / 2);
      const clash = this.missiles.some((m) => m.alive && m.y < sy + 30 && Math.abs(m.x - sx) < (m.labelW + labelW) / 2 + 6);
      if (!clash) break;
    }
    const dx = tx - sx;
    const dy = ty - sy;
    const d = Math.hypot(dx, dy);
    const speed = this.missileSpeed() * rand(0.92, 1.08) * (demo ? 2.5 : 1);
    this.missiles.push({
      id: this.nextId++,
      sx,
      sy,
      x: sx,
      y: sy,
      vx: (dx / d) * speed,
      vy: (dy / d) * speed,
      endY: math.danger ? ty : rand(GROUND_Y - 40, GROUND_Y - 26),
      aim,
      math,
      letter: null,
      lockedBy: null,
      labelW,
      alive: true,
    });
  }

  /* ------------------------------ player actions ------------------------------ */

  /** Launcher that fires at x: the nearest one standing with ammo. */
  private launcherFor(x: number): number {
    let best = -1;
    let bd = Infinity;
    for (let i = 0; i < 3; i++) {
      if (!this.launcherUp[i] || this.ammo[i] <= 0) continue;
      const d = Math.abs(LAUNCHER_X[i] - x);
      if (d < bd) {
        bd = d;
        best = i;
      }
    }
    return best;
  }

  private launch(tx: number, ty: number, homing: number | null): boolean {
    if (this.mode !== "play" && this.mode !== "demo") return false;
    if (this.paused) return false;
    const li = this.launcherFor(tx);
    if (li < 0) {
      if (this.mode === "play") {
        this.audio.tone(140, 0.12, "square", 0.25);
        this.floaters.push({ text: "OUT OF WEBS!", x: W / 2, y: 110, t: 1, color: PALETTE.red });
      }
      return false;
    }
    if (this.mode === "play") this.ammo[li]--;
    const sx = LAUNCHER_X[li];
    const sy = GROUND_Y - 12;
    this.interceptors.push({ id: this.nextId++, sx, sy, x: sx, y: sy, tx, ty, homing, speed: homing ? 240 : 210 });
    if (this.mode === "play") {
      this.audio.shoot();
      this.emitHud();
    }
    return true;
  }

  /** Fire at a point in logical coordinates (crosshair shot). */
  fireAt(x: number, y: number) {
    if (this.mode !== "play" || this.paused) return false;
    const ty = Math.min(y, GROUND_Y - 22);
    return this.launch(Math.max(2, Math.min(W - 2, x)), Math.max(this.headerH(), ty), null);
  }

  /** Auto-target the missile wearing letter `i` (0-3 = A-D). */
  selectThreat(i: number) {
    const m = this.missiles.find((q) => q.alive && q.letter === LETTERS[i]);
    if (!m) return false;
    return this.target(m);
  }

  private target(m: Missile) {
    if (this.mode !== "play" || this.paused || !m.alive) return false;
    if (m.lockedBy !== null && this.interceptors.some((it) => it.id === m.lockedBy)) return false;
    if (!this.launch(m.x, m.y, m.id)) return false;
    m.lockedBy = this.interceptors[this.interceptors.length - 1].id;
    this.audio.tone(900, 0.2, "triangle", 0.35, 1600);
    return true;
  }

  /**
   * A tap or click at a logical point: on (or near) a missile or its label, it auto-targets
   * that missile; anywhere else it fires at the point.
   */
  tap(x: number, y: number) {
    if (this.mode !== "play" || this.paused) return false;
    const s = this.scale;
    let best: Missile | null = null;
    let bd = Infinity;
    for (const m of this.missiles) {
      if (!m.alive) continue;
      const box = this.labelBox(m);
      const inBox = x >= box.x - 3 && x <= box.x + box.w + 3 && y >= box.y - 3 && y <= box.y + box.h + 3 * s;
      const d = Math.hypot(m.x - x, m.y - y);
      if ((inBox || d < 12) && d < bd) {
        best = m;
        bd = inBox ? Math.min(d, 1) : d;
      }
    }
    if (best) return this.target(best);
    this.cx = x;
    this.cy = y;
    return this.fireAt(x, y);
  }

  /** Move the crosshair (mouse hover). */
  aim(x: number, y: number) {
    this.cx = Math.max(2, Math.min(W - 3, x));
    this.cy = Math.max(2, Math.min(GROUND_Y - 22, y));
  }

  /* ------------------------------ update ------------------------------ */

  private update(dt: number) {
    this.frame++;
    this.updateParticles(dt);
    for (const f of this.floaters) {
      f.t -= dt;
      f.y -= 6 * dt;
    }
    this.floaters = this.floaters.filter((f) => f.t > 0);
    if (this.paused || this.mode === "over" || this.mode === "checkpoint") return;
    if (this.banner) {
      this.banner.t -= dt;
      if (this.banner.t <= 0) this.banner = null;
    }

    if (this.mode === "demo") {
      this.demoT -= dt;
      if (this.demoT <= 0 && this.missiles.filter((m) => m.alive).length < 4) {
        this.spawnMissile(true);
        this.demoT = 1.2;
      }
      for (const m of this.missiles) {
        if (m.alive && m.lockedBy === null && m.math.danger && m.y > 90) {
          if (this.launch(m.x, m.y, m.id)) m.lockedBy = this.interceptors[this.interceptors.length - 1].id;
        }
      }
    }

    if (this.mode === "play") {
      // Crosshair keys
      const sp = 120 * dt;
      if (this.keys.has("left")) this.cx -= sp;
      if (this.keys.has("right")) this.cx += sp;
      if (this.keys.has("up")) this.cy -= sp;
      if (this.keys.has("down")) this.cy += sp;
      this.aim(this.cx, this.cy);

      this.spawnT -= dt;
      const alive = this.missiles.filter((m) => m.alive).length;
      if (this.queue.length && this.spawnT <= 0 && alive < this.maxAtOnce()) {
        this.spawnMissile();
        this.spawnT = this.spawnInterval() * rand(0.85, 1.15);
      } else if (this.queue.length && alive === 0 && this.spawnT > 1.2 && !this.banner) {
        this.spawnT = 1.2; // don't leave the sky empty for long
      }
    }

    this.updateMissiles(dt);
    this.updateInterceptors(dt);
    this.updateBlasts(dt);
    if (this.mode === "play" || this.mode === "demo") this.assignLetters();

    if (this.mode === "play") {
      if (!this.cities.some(Boolean)) {
        this.mode = "ending";
        this.endingT = 2.8;
        this.banner = { lines: [{ text: "THE END", color: PALETTE.red }], t: 99 };
        this.audio.stopMusic();
        this.audio.gameOver();
      } else if (!this.queue.length && !this.missiles.some((m) => m.alive) && !this.interceptors.length && !this.blasts.length) {
        this.endWave();
      }
    } else if (this.mode === "tally") {
      this.tallyT -= dt;
      if (this.tallyT <= 0) {
        this.mode = "checkpoint";
        this.cb.onWaveEnd({
          wave: this.wave,
          cities: this.cities.filter(Boolean).length,
          ammoLeft: this.ammo.reduce((a, b) => a + b, 0),
          bonus: 0,
          ...this.stats,
        });
      }
    } else if (this.mode === "ending") {
      this.endingT -= dt;
      if (this.endingT <= 0) {
        this.mode = "over";
        this.cb.onGameOver();
      }
    }
    this.hudTimer -= dt;
    if (this.hudTimer <= 0) {
      this.hudTimer = 0.1;
      this.emitHud();
    }
  }

  private endWave() {
    const cities = this.cities.filter(Boolean).length;
    const ammoLeft = this.ammo.reduce((a, b) => a + b, 0);
    const bonus = cities * 100 + ammoLeft * 5;
    this.score += bonus;
    this.mode = "tally";
    this.tallyT = 3;
    this.audio.checkpoint();
    this.banner = {
      lines: [
        { text: `WAVE ${this.wave} CLEAR`, color: PALETTE.yellow },
        { text: `CITIES SAVED ${cities} × 100`, color: PALETTE.cyan },
        { text: `WEBS LEFT ${ammoLeft} × 5`, color: PALETTE.lightBlue },
        { text: `BONUS ${bonus}`, color: PALETTE.green },
      ],
      t: 3,
    };
    this.emitHud();
  }

  private updateMissiles(dt: number) {
    for (const m of this.missiles) {
      if (!m.alive) continue;
      m.x += m.vx * dt;
      m.y += m.vy * dt;
      if (m.y >= m.endY) this.finishMissile(m);
    }
    this.missiles = this.missiles.filter((m) => m.alive);
  }

  /** A missile reached the end of its path: live ones hit, decoys burn up. */
  private finishMissile(m: Missile) {
    m.alive = false;
    if (this.mode === "demo") {
      this.burst(m.x, m.y, 8, PALETTE.dim);
      return;
    }
    if (this.mode !== "play") return;
    if (m.math.danger) {
      this.blasts.push({ x: m.x, y: m.y, r: 0, t: 0, max: 12, friendly: false });
      this.burst(m.x, m.y, 30, PALETTE.red);
      this.burst(m.x, m.y, 15, PALETTE.yellow);
      if (m.aim >= 10) {
        this.launcherUp[m.aim - 10] = false;
        this.ammo[m.aim - 10] = 0;
      } else {
        this.cities[m.aim] = false;
      }
      this.audio.crash();
      this.streak = 0;
      this.stats.landed++;
      this.note(m, "landed", PALETTE.red);
      this.cb.onDecision(this.round!, "landed", false);
    } else {
      // Harmless decoy: it fizzles out in a shower of sparks.
      this.burst(m.x, m.y, 10, PALETTE.lightBlue);
      this.audio.tone(500, 0.12, "triangle", 0.15, 200);
      this.score += 10;
      this.note(m, "passed", PALETTE.lightBlue);
      this.cb.onDecision(this.round!, "passed", true);
    }
  }

  /** A blast caught a missile. */
  private destroyMissile(m: Missile) {
    m.alive = false;
    this.burst(m.x, m.y, 14, m.math.danger ? PALETTE.yellow : PALETTE.lightBlue);
    if (this.mode !== "play") return;
    if (m.math.danger) {
      this.streak++;
      const mult = Math.min(this.streak, 5);
      this.score += 50 * mult;
      this.stats.stopped++;
      this.audio.explode();
      this.note(m, "stopped", PALETTE.green, mult > 1 ? ` ×${mult}` : "");
      this.cb.onDecision(this.round!, "stopped", true);
    } else {
      this.streak = 0;
      this.score = Math.max(0, this.score - 30);
      this.stats.wasted++;
      this.audio.wrong();
      this.note(m, "wasted", PALETTE.red);
      this.cb.onDecision(this.round!, "wasted", false);
    }
  }

  private note(m: Missile, o: Outcome, color: string, extra = "") {
    const text = outcomeNote(this.round!, m.math, o) + extra;
    let y = Math.max(this.headerH() + 12, Math.min(m.y - 4, GROUND_Y - 40));
    // Don't stack notes on top of each other.
    for (let i = 0; i < 6 && this.floaters.some((f) => Math.abs(f.y - y) < 9); i++) y -= 9;
    this.floaters.push({ text, x: m.x, y, t: o === "passed" ? 2.2 : 3, color });
    if (this.floaters.length > 5) this.floaters.shift();
  }

  private updateInterceptors(dt: number) {
    for (const it of this.interceptors) {
      if (it.homing !== null) {
        const m = this.missiles.find((q) => q.id === it.homing && q.alive);
        if (m) {
          it.tx = m.x;
          it.ty = m.y;
        } else it.homing = null; // target gone: burst where it was heading
      }
      const dx = it.tx - it.x;
      const dy = it.ty - it.y;
      const d = Math.hypot(dx, dy);
      const step = it.speed * dt;
      if (d <= step + 1) {
        it.x = it.tx;
        it.y = it.ty;
        this.blasts.push({ x: it.x, y: it.y, r: 1, t: 0, max: this.blastRadius(), friendly: true });
        if (this.mode === "play") this.audio.noise(0.25, 0.4);
        it.speed = -1; // done
      } else {
        it.x += (dx / d) * step;
        it.y += (dy / d) * step;
      }
    }
    this.interceptors = this.interceptors.filter((it) => it.speed > 0);
  }

  private updateBlasts(dt: number) {
    const GROW = 0.3;
    const HOLD = 0.35;
    const SHRINK = 0.35;
    for (const b of this.blasts) {
      b.t += dt;
      if (b.t < GROW) b.r = b.max * (b.t / GROW);
      else if (b.t < GROW + HOLD) b.r = b.max;
      else b.r = b.max * Math.max(0, 1 - (b.t - GROW - HOLD) / SHRINK);
      if (!b.friendly) continue;
      for (const m of this.missiles) {
        if (m.alive && Math.hypot(m.x - b.x, m.y - b.y) <= b.r + 1.5) this.destroyMissile(m);
      }
    }
    this.blasts = this.blasts.filter((b) => b.t < GROW + HOLD + SHRINK);
  }

  /** Letters A-D go to the (up to) four missiles nearest the ground, and stay with them. */
  private assignLetters() {
    const used = new Set(this.missiles.filter((m) => m.alive && m.letter).map((m) => m.letter!));
    const free = [...LETTERS].filter((l) => !used.has(l));
    if (!free.length) return;
    const cands = this.missiles.filter((m) => m.alive && !m.letter).sort((a, b) => b.y - a.y);
    for (const m of cands) {
      const l = free.shift();
      if (!l) break;
      m.letter = l;
    }
  }

  private emitHud() {
    const threats: Threat[] = this.missiles
      .filter((m) => m.alive && m.letter)
      .map((m) => ({ letter: m.letter!, label: m.math.label, locked: m.lockedBy !== null && this.interceptors.some((i) => i.id === m.lockedBy) }))
      .sort((a, b) => a.letter.localeCompare(b.letter));
    this.cb.onHud({
      score: this.score,
      wave: this.wave,
      cities: this.cities.filter(Boolean).length,
      ammo: [...this.ammo],
      streak: this.streak,
      threats: this.mode === "play" ? threats : [],
    });
  }

  /* ------------------------------ effects ------------------------------ */

  private burst(x: number, y: number, n: number, color: string) {
    for (let i = 0; i < n; i++) {
      this.particles.push({ x, y, vx: rand(-60, 60), vy: rand(-80, 30), life: rand(0.3, 0.9), color });
    }
  }

  private updateParticles(dt: number) {
    if (this.paused) return;
    for (const p of this.particles) {
      p.vy += 100 * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
    }
    this.particles = this.particles.filter((p) => p.life > 0 && p.y < H);
  }

  /* ------------------------------ render ------------------------------ */

  private makeBackground() {
    const c = document.createElement("canvas");
    c.width = W;
    c.height = H;
    const g = c.getContext("2d")!;
    g.fillStyle = PALETTE.sky;
    g.fillRect(0, 0, W, H);
    g.fillStyle = PALETTE.skyLow;
    for (let y = 110; y < GROUND_Y; y += 2) if (y > 150 || y % 4 === 0) g.fillRect(0, y, W, 1);
    // Moon
    const mx = 292;
    const my = 34;
    const r = 10;
    for (let y = -r; y <= r; y++)
      for (let x = -r; x <= r; x++) {
        if (x * x + y * y > r * r) continue;
        const crater = hash(Math.floor((x + 30) / 3) * 7 + Math.floor((y + 30) / 3) * 13) > 0.8;
        g.fillStyle = crater || x > r * 0.5 + y * 0.3 ? PALETTE.moonShade : PALETTE.moon;
        g.fillRect(mx + x, my + y, 1, 1);
      }
    // Far skyline silhouette
    let x = 0;
    let i = 0;
    while (x < W) {
      const bw = 8 + Math.floor(hash(i + 3) * 14);
      const bh = 8 + Math.floor(hash(i * 3.3 + 1) * 22);
      g.fillStyle = PALETTE.farCity;
      g.fillRect(x, GROUND_Y - bh, bw, bh);
      g.fillStyle = "#1b2560";
      for (let wy = GROUND_Y - bh + 3; wy < GROUND_Y - 3; wy += 4)
        for (let wx = x + 2; wx < x + bw - 2; wx += 3) if (hash(wx * 1.7 + wy * 3.1) > 0.75) g.fillRect(wx, wy, 1, 1);
      x += bw;
      i++;
    }
    // Ground and launcher mounds
    g.fillStyle = PALETTE.groundDark;
    g.fillRect(0, GROUND_Y, W, H - GROUND_Y);
    g.fillStyle = PALETTE.ground;
    g.fillRect(0, GROUND_Y, W, 1);
    for (const lx of LAUNCHER_X) {
      for (let row = 0; row < 7; row++) {
        const half = 6 + row * 2;
        g.fillStyle = row === 0 ? PALETTE.ground : PALETTE.groundDark;
        g.fillRect(lx - half, GROUND_Y - 7 + row, half * 2, 1);
      }
    }
    g.fillStyle = PALETTE.red;
    for (let gx = 0; gx < W; gx += 8) g.fillRect(gx, GROUND_Y + 2, 4, 1);
    return c;
  }

  /** Bitmap text as a cached canvas (crisp at any scale, no web fonts needed). */
  private textCanvas(s: string, color: string, scale: number): HTMLCanvasElement {
    const key = `${scale}|${color}|${s}`;
    let c = this.textCache.get(key);
    if (c) return c;
    c = document.createElement("canvas");
    c.width = Math.max(1, textWidth(s, scale));
    c.height = 8 * scale;
    const g = c.getContext("2d")!;
    g.fillStyle = color;
    forEachPixel(s, (x, y) => g.fillRect(x * scale, y * scale, scale, scale));
    if (this.textCache.size > 400) this.textCache.clear();
    this.textCache.set(key, c);
    return c;
  }

  private text(s: string, x: number, y: number, color: string, scale = 1, align: "left" | "center" | "right" = "left", shadow = true) {
    const w = textWidth(s, scale);
    let lx = align === "center" ? x - w / 2 : align === "right" ? x - w : x;
    lx = Math.round(Math.max(1, Math.min(W - 1 - w, lx)));
    if (shadow) this.ctx.drawImage(this.textCanvas(s, "#000000", scale), lx + 1, Math.round(y) + 1);
    this.ctx.drawImage(this.textCanvas(s, color, scale), lx, Math.round(y));
  }

  private labelBox(m: Missile) {
    const s = this.scale;
    const h = 8 * s + 2;
    const w = m.labelW;
    const x = Math.round(Math.max(1, Math.min(W - 1 - w, m.x - w / 2)));
    const y = Math.round(m.y - 3 - h);
    return { x, y, w, h };
  }

  private draw() {
    const g = this.ctx;
    g.drawImage(this.bg, 0, 0);

    for (const s of this.stars) {
      const tw = (this.frame + s.p * 200) % 140 < 10;
      if (s.x > 280 && s.y < 46) continue; // behind the moon
      g.fillStyle = s.p > 0.7 && !tw ? PALETTE.star : PALETTE.starDim;
      g.fillRect(Math.floor(s.x), Math.floor(s.y), 1, 1);
    }

    // Cities
    CITY_X.forEach((x, i) => {
      const spr = this.cities[i] ? this.sprites.cities[i % 2] : this.sprites.rubble;
      g.drawImage(spr, x - CITY_W / 2, GROUND_Y - CITY_H + 1);
    });
    // Launchers and ammo pips
    LAUNCHER_X.forEach((x, i) => {
      g.drawImage(this.launcherUp[i] ? this.sprites.turret : this.sprites.turretDead, x - TURRET_W / 2, GROUND_Y - 7 - TURRET_H + 1);
      if (this.mode === "demo") return;
      const n = Math.min(this.ammo[i], 12);
      for (let k = 0; k < n; k++) {
        g.fillStyle = k % 2 ? PALETTE.cyan : PALETTE.white;
        g.fillRect(x - 11 + (k % 6) * 4, GROUND_Y + 4 + Math.floor(k / 6) * 3, 2, 2);
      }
    });
    // The hero keeps watch by the middle launcher.
    g.drawImage(this.sprites.hero, 134, GROUND_Y - HERO_H);

    // Enemy trails and heads
    for (const m of this.missiles) {
      if (!m.alive) continue;
      g.strokeStyle = "rgba(227,38,47,0.55)";
      g.lineWidth = 1;
      g.beginPath();
      g.moveTo(Math.floor(m.sx) + 0.5, Math.floor(m.sy) + 0.5);
      g.lineTo(Math.floor(m.x) + 0.5, Math.floor(m.y) + 0.5);
      g.stroke();
      g.fillStyle = this.frame % 10 < 5 ? PALETTE.white : PALETTE.yellow;
      g.fillRect(Math.floor(m.x) - 1, Math.floor(m.y) - 1, 3, 3);
    }

    // Interceptor trails
    for (const it of this.interceptors) {
      g.strokeStyle = "rgba(127,243,255,0.7)";
      g.lineWidth = 1;
      g.beginPath();
      g.moveTo(it.sx + 0.5, it.sy + 0.5);
      g.lineTo(Math.floor(it.x) + 0.5, Math.floor(it.y) + 0.5);
      g.stroke();
      g.fillStyle = PALETTE.white;
      g.fillRect(Math.floor(it.x) - 1, Math.floor(it.y) - 1, 2, 2);
      if (it.homing === null) {
        // Target marker (classic X)
        g.fillStyle = PALETTE.cyan;
        const tx = Math.floor(it.tx);
        const ty = Math.floor(it.ty);
        for (const [dx, dy] of [[-2, -2], [-1, -1], [1, 1], [2, 2], [-2, 2], [-1, 1], [1, -1], [2, -2], [0, 0]]) g.fillRect(tx + dx, ty + dy, 1, 1);
      }
    }

    // Blasts: flashing arcade circles
    const cols = [PALETTE.white, PALETTE.yellow, PALETTE.red, PALETTE.lightBlue, PALETTE.cyan];
    for (const b of this.blasts) {
      g.fillStyle = b.friendly ? cols[Math.floor(this.frame / 3) % cols.length] : cols[Math.floor(this.frame / 2) % 3];
      g.beginPath();
      g.arc(b.x, b.y, Math.max(0.5, b.r), 0, Math.PI * 2);
      g.fill();
    }

    // Particles
    for (const p of this.particles) {
      g.fillStyle = p.color;
      g.fillRect(Math.floor(p.x), Math.floor(p.y), 1, 1);
    }

    // Labels on top of everything in the sky
    const s = this.scale;
    for (const m of this.missiles) {
      if (!m.alive) continue;
      const box = this.labelBox(m);
      const locked = m.lockedBy !== null;
      g.fillStyle = "rgba(10,15,46,0.88)";
      g.fillRect(box.x, box.y, box.w, box.h);
      g.fillStyle = locked ? PALETTE.cyan : PALETTE.lightBlue;
      g.fillRect(box.x, box.y, box.w, 1);
      g.fillRect(box.x, box.y + box.h - 1, box.w, 1);
      g.fillRect(box.x, box.y, 1, box.h);
      g.fillRect(box.x + box.w - 1, box.y, 1, box.h);
      g.drawImage(this.textCanvas(m.math.label, PALETTE.white, s), box.x + 2 * s, box.y + 1);
      if (m.letter && this.mode === "play") {
        // Letter badge on the left of the label.
        const bw = 4 * s + 3;
        const bx = box.x - bw + 1 < 0 ? box.x + box.w - 1 : box.x - bw + 1;
        g.fillStyle = locked ? PALETTE.cyan : PALETTE.yellow;
        g.fillRect(bx, box.y, bw, box.h);
        g.drawImage(this.textCanvas(m.letter, PALETTE.navy, s), bx + 2, box.y + 1);
      }
      if (locked) {
        g.fillStyle = PALETTE.cyan;
        const x = Math.floor(m.x);
        const y = Math.floor(m.y);
        g.fillRect(x - 4, y - 4, 2, 1);
        g.fillRect(x + 3, y - 4, 2, 1);
        g.fillRect(x - 4, y + 4, 2, 1);
        g.fillRect(x + 3, y + 4, 2, 1);
      }
    }

    // Crosshair
    if (this.mode === "play" && !this.paused) g.drawImage(this.sprites.crosshair, Math.round(this.cx) - 3, Math.round(this.cy) - 3);

    // Header: target and function definitions
    const r = this.round;
    if (r && this.mode !== "demo") {
      g.fillStyle = "rgba(10,15,46,0.85)";
      g.fillRect(0, 0, W, this.headerH());
      if (r.mode === "match") this.text(`TARGET ${r.targetText}`, 3, 1, PALETTE.yellow, 1, "left");
      else this.text("STOP THE WRONG ANSWERS", 3, 1, PALETTE.red, 1, "left");
      this.text(`WAVE ${this.wave}`, W - 3, 1, PALETTE.cyan, 1, "right");
      if (r.context) this.text(r.context, 3, 10, PALETTE.lightBlue, 1, "left");
    }

    // Notes
    for (const f of this.floaters) {
      if (f.t < 0.4 && this.frame % 4 < 2) continue;
      const w = textWidth(f.text);
      const x = Math.round(Math.max(1, Math.min(W - 1 - w, f.x - w / 2)));
      g.fillStyle = "rgba(5,8,24,0.78)";
      g.fillRect(x - 2, Math.round(f.y) - 1, w + 5, 10);
      this.text(f.text, f.x, f.y, f.color, 1, "center");
    }

    // Banner
    if (this.banner && this.mode !== "demo") {
      const lines = this.banner.lines;
      const big = lines.length <= 2 ? 2 : 1;
      const lh = 8 * big + 4;
      let y = 70 - (lines.length * lh) / 2;
      for (const l of lines) {
        const sc = textWidth(l.text, big) > W - 8 ? 1 : big;
        this.text(l.text, W / 2, y, l.color, sc, "center");
        y += lh;
      }
    }
    if (this.mode === "over") this.text("GAME OVER", W / 2, 80, PALETTE.red, 3, "center");
    if (this.paused) this.text("PAUSED", W / 2, 90, PALETTE.yellow, 3, "center");
  }
}
