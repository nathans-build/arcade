import type { ChipAudio, Grade } from "@/kit";
import { textWidth } from "./font";
import { PALETTE, SHIP_FRAMES, SHIP_SIZE, makeRock, shipFrames, textSprite } from "./sprites";
import {
  bandOf,
  comboNote,
  labelScale,
  levelRocks,
  makeRule,
  rockRadius,
  splitRock,
  topRock,
  type Band,
  type RockMath,
  type Rule,
} from "./splits";

/* Logical arcade resolution; the canvas is scaled up with nearest-neighbour. */
export const W = 320;
export const H = 200;

export const MAX_SHIELD = 3;
const LIVES = 3;

export type Action = "left" | "right" | "thrust" | "fire";

export interface HudState {
  score: number;
  lives: number;
  shield: number;
  level: number;
  streak: number;
  rule: Rule | null;
}

export interface EngineCallbacks {
  onHud(h: HudState): void;
  /** A level (and its challenge rule) is starting. */
  onLevelStart(level: number, rule: Rule): void;
  /** Level cleared: the engine waits for `resolveCheckpoint`. */
  onLevelClear(level: number): void;
  /** The player shot a splittable rock: did it follow the rule? */
  onRuleShot(rule: Rule, ok: boolean): void;
  onGameOver(): void;
}

interface Rock {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  m: RockMath;
  gen: number;
  fam: number;
  sprite: HTMLCanvasElement;
  label: HTMLCanvasElement;
  hit: number; // flash timer
  bad: number; // red flash after a rule-breaking shot
}
interface Bullet { x: number; y: number; vx: number; vy: number; life: number }
interface Particle { x: number; y: number; vx: number; vy: number; life: number; color: string }
interface Floater { text: string; x: number; y: number; t: number; color: string; scale: number }
interface Family { root: RockMath; alive: number; cores: RockMath[]; broken: boolean }

type Mode = "demo" | "play" | "paused" | "dying" | "clear" | "checkpoint" | "over";

function rand(a: number, b: number) {
  return a + Math.random() * (b - a);
}
function wrap(v: number, max: number, pad = 0) {
  if (v < -pad) return v + max + pad * 2;
  if (v > max + pad) return v - max - pad * 2;
  return v;
}

/** Tuning per grade band: early readers get fewer, slower rocks. */
const TUNING: Record<Band, { rocks: number; speed: number; maxRocks: number }> = {
  k2: { rocks: 2, speed: 11, maxRocks: 4 },
  "35": { rocks: 3, speed: 15, maxRocks: 5 },
  "68": { rocks: 3, speed: 16, maxRocks: 5 },
  hs: { rocks: 3, speed: 14, maxRocks: 5 },
};

export class BlasterEngine {
  private ctx: CanvasRenderingContext2D;
  private raf = 0;
  private last = 0;
  private frame = 0;
  private hudTimer = 0;

  mode: Mode = "demo";
  private userPaused = false;
  private keys = new Set<Action>();
  private fireQueued = false;

  grade: Grade = "4";
  private band: Band = "35";
  private scale = 1;

  // Ship
  private sx = W / 2;
  private sy = H / 2;
  private svx = 0;
  private svy = 0;
  private angle = 0; // 0 = nose up, clockwise
  private invuln = 0;
  private fireCd = 0;
  private dyingT = 0;
  private thrusting = false;

  private rocks: Rock[] = [];
  private bullets: Bullet[] = [];
  private particles: Particle[] = [];
  private floaters: Floater[] = [];
  private families = new Map<number, Family>();
  private nextId = 1;
  private banner: { lines: string[]; t: number; color: string } | null = null;
  private flash: { text: string; t: number; color: string } | null = null;
  private clearT = 0;

  score = 0;
  lives = LIVES;
  shield = MAX_SHIELD;
  level = 1;
  streak = 0;
  rule: Rule | null = null;

  private stars = Array.from({ length: 80 }, () => ({ x: rand(0, W), y: rand(0, H), p: Math.random() }));
  private ships = shipFrames();

  constructor(canvas: HTMLCanvasElement, private audio: ChipAudio, private cb: EngineCallbacks) {
    canvas.width = W;
    canvas.height = H;
    this.ctx = canvas.getContext("2d")!;
    this.ctx.imageSmoothingEnabled = false;
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

  setGrade(g: Grade) {
    this.grade = g;
    this.band = bandOf(g);
    this.scale = labelScale(g);
  }

  /** Attract mode behind the title screen: rocks drift, no ship. */
  demo(g: Grade) {
    this.setGrade(g);
    this.mode = "demo";
    this.rocks = [];
    this.bullets = [];
    this.floaters = [];
    this.families.clear();
    this.banner = null;
    this.flash = null;
    for (let i = 0; i < 5; i++) this.addRock(topRock(g), rand(0, W), rand(0, H), 0, TUNING[this.band].speed);
  }

  newGame(g: Grade) {
    this.setGrade(g);
    this.score = 0;
    this.lives = LIVES;
    this.shield = MAX_SHIELD;
    this.streak = 0;
    this.level = 1;
    this.particles = [];
    this.keys.clear();
    this.userPaused = false;
    this.resetShip();
    this.startLevel();
  }

  setKey(a: Action, down: boolean) {
    if (down) {
      if (a === "fire" && !this.keys.has("fire")) this.fireQueued = true;
      this.keys.add(a);
    } else {
      this.keys.delete(a);
    }
  }

  releaseAllKeys() {
    this.keys.clear();
    this.fireQueued = false;
  }

  /** Player-initiated pause. Returns true if now paused. */
  togglePause(force?: boolean) {
    const want = force ?? !(this.mode === "paused" && this.userPaused);
    if (want && (this.mode === "play" || this.mode === "dying" || this.mode === "clear")) {
      this.pausedFrom = this.mode;
      this.mode = "paused";
      this.userPaused = true;
      this.releaseAllKeys();
    } else if (!want && this.mode === "paused" && this.userPaused) {
      this.mode = this.pausedFrom;
      this.userPaused = false;
      this.last = performance.now();
    }
    return this.mode === "paused" && this.userPaused;
  }
  private pausedFrom: Mode = "play";

  /** Called by the UI after the between-levels transmission is answered. */
  resolveCheckpoint(correct: boolean) {
    if (this.mode !== "checkpoint") return;
    if (correct) {
      this.shield = MAX_SHIELD;
      this.score += 500 * this.level;
    } else {
      this.shield = Math.min(MAX_SHIELD, this.shield + 1);
    }
    this.level++;
    this.releaseAllKeys();
    this.resetShip();
    this.startLevel();
  }

  /* ------------------------------ levels ------------------------------ */

  private resetShip() {
    this.sx = W / 2;
    this.sy = H / 2;
    this.svx = 0;
    this.svy = 0;
    this.angle = 0;
    this.invuln = 2.5;
    this.bullets = [];
  }

  private startLevel() {
    const t = TUNING[this.band];
    const rule = makeRule(this.grade, this.level);
    this.rule = rule;
    this.rocks = [];
    this.floaters = [];
    this.families.clear();
    const count = Math.min(t.maxRocks, t.rocks + Math.floor((this.level - 1) / 2));
    const speed = t.speed * Math.min(1.8, 1 + (this.level - 1) * 0.08);
    for (const m of levelRocks(this.grade, rule, count)) {
      // Spawn along the edges, away from the ship.
      let x = 0;
      let y = 0;
      do {
        x = rand(0, W);
        y = rand(0, H);
      } while (Math.hypot(x - this.sx, y - this.sy) < 80);
      this.addRock(m, x, y, 0, speed);
    }
    this.banner = { lines: [`LEVEL ${this.level}`, rule.short], t: 3, color: PALETTE.yellow };
    this.mode = "play";
    this.cb.onLevelStart(this.level, rule);
    this.emitHud();
  }

  private addRock(m: RockMath, x: number, y: number, gen: number, speed: number, dir?: number, fam?: number): Rock {
    const r = rockRadius(m.label, gen, this.scale);
    const a = dir ?? rand(0, Math.PI * 2);
    const v = speed * rand(0.7, 1.2) * (1 + gen * 0.25);
    const id = this.nextId++;
    const famId = fam ?? id;
    if (fam === undefined) this.families.set(id, { root: m, alive: 1, cores: [], broken: false });
    const rock: Rock = {
      id, x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, r, m, gen, fam: famId,
      sprite: makeRock(r, m.core, id * 0.37 + gen),
      label: textSprite(m.label, m.core ? "#2a1400" : PALETTE.white, this.scale, m.core ? PALETTE.coreHi : "#05081a"),
      hit: 0,
      bad: 0,
    };
    this.rocks.push(rock);
    return rock;
  }

  /* ------------------------------ update ------------------------------ */

  private update(dt: number) {
    this.frame++;
    this.updateParticles(dt);
    if (this.mode === "paused" || this.mode === "over" || this.mode === "checkpoint") return;

    this.moveRocks(dt);
    this.updateFloaters(dt);
    if (this.mode === "demo") return;

    if (this.banner) {
      this.banner.t -= dt;
      if (this.banner.t <= 0) this.banner = null;
    }
    if (this.flash) {
      this.flash.t -= dt;
      if (this.flash.t <= 0) this.flash = null;
    }

    if (this.mode === "dying") {
      this.dyingT -= dt;
      if (this.dyingT <= 0) this.respawn();
      return;
    }

    if (this.mode === "clear") {
      this.clearT -= dt;
      this.updateShip(dt);
      this.updateBullets(dt);
      if (this.clearT <= 0) {
        this.mode = "checkpoint";
        this.releaseAllKeys();
        this.audio.checkpoint();
        this.emitHud();
        this.cb.onLevelClear(this.level);
      }
      return;
    }

    this.updateShip(dt);
    this.updateBullets(dt);
    this.collide();
    this.checkClear();

    this.hudTimer -= dt;
    if (this.hudTimer <= 0) {
      this.hudTimer = 0.15;
      this.emitHud();
    }
  }

  private moveRocks(dt: number) {
    for (const r of this.rocks) {
      r.x = wrap(r.x + r.vx * dt, W, r.r);
      r.y = wrap(r.y + r.vy * dt, H, r.r);
      r.hit = Math.max(0, r.hit - dt);
      r.bad = Math.max(0, r.bad - dt);
    }
  }

  private updateShip(dt: number) {
    const turn = 3.8;
    if (this.keys.has("left")) this.angle -= turn * dt;
    if (this.keys.has("right")) this.angle += turn * dt;
    this.thrusting = this.keys.has("thrust");
    const fx = Math.sin(this.angle);
    const fy = -Math.cos(this.angle);
    if (this.thrusting) {
      this.svx += fx * 130 * dt;
      this.svy += fy * 130 * dt;
      if (this.frame % 3 === 0) {
        this.particles.push({
          x: this.sx - fx * 7, y: this.sy - fy * 7,
          vx: -fx * 40 + rand(-12, 12), vy: -fy * 40 + rand(-12, 12),
          life: rand(0.15, 0.35), color: Math.random() < 0.5 ? PALETTE.yellow : PALETTE.red,
        });
      }
    }
    // Space drag, speed cap
    const drag = Math.pow(0.55, dt);
    this.svx *= drag;
    this.svy *= drag;
    const sp = Math.hypot(this.svx, this.svy);
    const max = 120;
    if (sp > max) {
      this.svx *= max / sp;
      this.svy *= max / sp;
    }
    this.sx = wrap(this.sx + this.svx * dt, W, 4);
    this.sy = wrap(this.sy + this.svy * dt, H, 4);
    this.invuln = Math.max(0, this.invuln - dt);

    this.fireCd -= dt;
    if ((this.fireQueued || this.keys.has("fire")) && this.fireCd <= 0 && this.bullets.length < 5) {
      this.bullets.push({ x: this.sx + fx * 8, y: this.sy + fy * 8, vx: fx * 190 + this.svx * 0.5, vy: fy * 190 + this.svy * 0.5, life: 0.85 });
      this.fireCd = 0.2;
      this.audio.shoot();
    }
    this.fireQueued = false;
  }

  private updateBullets(dt: number) {
    for (const b of this.bullets) {
      b.x = wrap(b.x + b.vx * dt, W);
      b.y = wrap(b.y + b.vy * dt, H);
      b.life -= dt;
    }
    this.bullets = this.bullets.filter((b) => b.life > 0);
  }

  private collide() {
    // Bullets vs rocks
    for (const b of this.bullets) {
      if (b.life <= 0) continue;
      for (const r of this.rocks) {
        if (Math.hypot(b.x - r.x, b.y - r.y) <= r.r) {
          b.life = 0;
          this.shootRock(r);
          break;
        }
      }
    }
    this.bullets = this.bullets.filter((b) => b.life > 0);

    // Ship vs rocks
    if (this.invuln > 0) return;
    for (const r of this.rocks) {
      const d = Math.hypot(this.sx - r.x, this.sy - r.y);
      if (d < r.r + 4) {
        if (this.shield > 0) {
          // The shield absorbs the bump and shoves the two apart.
          this.shield--;
          this.invuln = 1.2;
          const nx = (this.sx - r.x) / Math.max(1, d);
          const ny = (this.sy - r.y) / Math.max(1, d);
          this.svx = nx * 90;
          this.svy = ny * 90;
          r.vx -= nx * 12;
          r.vy -= ny * 12;
          this.burst(this.sx, this.sy, 14, PALETTE.blueLight);
          this.audio.explode();
          this.say(this.shield > 0 ? "SHIELD HIT!" : "SHIELD DOWN!", PALETTE.blueLight);
          this.emitHud();
        } else {
          this.die();
        }
        return;
      }
    }
  }

  private shootRock(r: Rock) {
    const fam = this.families.get(r.fam);
    const rule = this.rule;
    if (r.m.core) {
      // Cores are always safe: pop for a bonus.
      const pts = this.band === "68" ? 75 : 50;
      this.score += pts;
      this.removeRock(r);
      this.burst(r.x, r.y, 18, PALETTE.yellow);
      this.burst(r.x, r.y, 8, "#ffffff");
      this.audio.blip();
      this.audio.tone(1320, 0.08, "square", 0.25);
      this.float(`+${pts}`, r.x, r.y - 3, PALETTE.yellow, 1);
      if (fam) {
        fam.cores.push(r.m);
        fam.alive--;
        this.checkCombo(fam);
      }
      return;
    }

    if (rule) {
      const ok = rule.test(r.m);
      if (ok) {
        this.streak++;
        const pts = 100 * Math.min(this.streak, 5);
        this.score += pts;
        this.float(`+${pts}`, r.x, r.y + r.r + 2, PALETTE.green, 1);
      } else {
        this.streak = 0;
        r.bad = 0.6;
        if (this.shield > 0) this.shield--;
        else this.score = Math.max(0, this.score - 100);
        this.say(`✘ ${rule.why(r.m)}`, PALETTE.red);
        this.audio.wrong();
      }
      this.cb.onRuleShot(rule, ok);
    }

    const split = splitRock(r.m, this.grade, r.gen);
    this.removeRock(r);
    if (!split) {
      // A small K-2 rock: it just pops.
      this.burst(r.x, r.y, 16, PALETTE.rockHi);
      this.audio.explode();
      this.float(r.m.label, r.x, r.y - 4, PALETTE.white, this.scale);
      if (fam) {
        fam.alive--;
        fam.broken = true; // number bonds don't make a combo
      }
      this.emitHud();
      return;
    }

    // Split into the two pieces, flying apart across the shot line.
    const base = Math.atan2(r.vy, r.vx) + Math.PI / 2;
    const speed = TUNING[this.band].speed * Math.min(1.8, 1 + (this.level - 1) * 0.08);
    split.parts.forEach((m, i) => {
      const dir = base + (i === 0 ? 0 : Math.PI) + rand(-0.4, 0.4);
      const off = rockRadius(m.label, r.gen + 1, this.scale) * 0.6;
      const child = this.addRock(m, r.x + Math.cos(dir) * off, r.y + Math.sin(dir) * off, r.gen + 1, speed, dir, r.fam);
      child.hit = 0.25;
    });
    if (fam) fam.alive += 1; // one rock became two
    this.burst(r.x, r.y, 14, PALETTE.rockHi);
    this.audio.explode();
    this.float(split.note, r.x, r.y - r.r - 6 * this.scale - 2, PALETTE.blueLight, this.scale);
    this.emitHud();
  }

  private checkCombo(fam: Family) {
    if (fam.alive > 0 || fam.broken || this.band === "k2") return;
    if (fam.cores.length < 2) return;
    const bonus = (this.band === "68" ? 150 : 100) * fam.cores.length;
    this.score += bonus;
    const note = comboNote(fam.root, fam.cores);
    const scale = textWidth(note, 2) <= W - 16 ? 2 : 1;
    this.float(note, W / 2, 30, PALETTE.yellow, scale, 2.4);
    this.float(`COMBO +${bonus}`, W / 2, 30 + 8 * scale + 2, PALETTE.green, 1, 2.4);
    this.audio.correct();
    this.emitHud();
  }

  private removeRock(r: Rock) {
    this.rocks = this.rocks.filter((x) => x !== r);
  }

  private checkClear() {
    const rule = this.rule;
    if (!rule || this.mode !== "play") return;
    const left = this.rocks.some((r) => r.m.core || rule.test(r.m));
    if (left) return;
    // Only decoys remain: they crumble harmlessly.
    for (const r of this.rocks) {
      this.burst(r.x, r.y, 10, PALETTE.dim);
      const fam = this.families.get(r.fam);
      if (fam) fam.broken = true;
    }
    this.rocks = [];
    const bonus = 250 * this.level;
    this.score += bonus;
    this.banner = { lines: ["SECTOR CLEAR!", `BONUS +${bonus}`], t: 2, color: PALETTE.green };
    this.audio.levelUp();
    this.mode = "clear";
    this.clearT = 1.8;
    this.emitHud();
  }

  private die() {
    this.mode = "dying";
    this.dyingT = 1.8;
    this.lives--;
    this.streak = 0;
    this.burst(this.sx, this.sy, 36, PALETTE.red);
    this.burst(this.sx, this.sy, 24, PALETTE.blueLight);
    this.burst(this.sx, this.sy, 10, PALETTE.yellow);
    this.bullets = [];
    this.audio.crash();
    this.emitHud();
  }

  private respawn() {
    if (this.lives <= 0) {
      this.mode = "over";
      this.audio.stopMusic();
      this.audio.gameOver();
      this.emitHud();
      this.cb.onGameOver();
      return;
    }
    this.resetShip();
    this.shield = Math.max(this.shield, 1);
    // Nudge rocks out of the spawn point.
    for (const r of this.rocks) {
      const d = Math.hypot(r.x - this.sx, r.y - this.sy);
      if (d < 50) {
        const a = Math.atan2(r.y - this.sy, r.x - this.sx);
        r.x = this.sx + Math.cos(a) * 60;
        r.y = this.sy + Math.sin(a) * 60;
      }
    }
    this.releaseAllKeys();
    this.mode = "play";
    this.emitHud();
  }

  private say(text: string, color: string) {
    this.flash = { text, t: 2, color };
  }

  private float(text: string, x: number, y: number, color: string, scale: number, t = 1.3) {
    // Nudge upward past any pop-up text it would overlap.
    const h = 6 * scale + 2;
    const w = textWidth(text, scale);
    for (let pass = 0; pass < 6; pass++) {
      const hit = this.floaters.find(
        (f) => Math.abs(f.y - y) < Math.max(h, 6 * f.scale + 2) && Math.abs(f.x - x) < (w + textWidth(f.text, f.scale)) / 2 + 2,
      );
      if (!hit) break;
      y = hit.y - Math.max(h, 6 * hit.scale + 2);
    }
    y = Math.max(1, y);
    this.floaters.push({ text, x, y, t, color, scale });
    if (this.floaters.length > 10) this.floaters.shift();
  }

  private updateFloaters(dt: number) {
    for (const f of this.floaters) {
      f.t -= dt;
      f.y -= 6 * dt;
    }
    this.floaters = this.floaters.filter((f) => f.t > 0);
  }

  private burst(x: number, y: number, n: number, color: string) {
    for (let i = 0; i < n; i++) {
      const a = rand(0, Math.PI * 2);
      const v = rand(15, 70);
      this.particles.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: rand(0.3, 0.9), color });
    }
  }

  private updateParticles(dt: number) {
    if (this.mode === "paused" || this.mode === "checkpoint") return;
    for (const p of this.particles) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
    }
    this.particles = this.particles.filter((p) => p.life > 0);
  }

  private emitHud() {
    this.cb.onHud({
      score: this.score,
      lives: this.lives,
      shield: this.shield,
      level: this.level,
      streak: this.streak,
      rule: this.rule,
    });
  }

  /* ------------------------------ render ------------------------------ */

  private draw() {
    const g = this.ctx;
    g.fillStyle = PALETTE.space;
    g.fillRect(0, 0, W, H);

    // Stars, slowly drifting
    for (const s of this.stars) {
      const x = Math.floor((s.x + this.frame * 0.02 * s.p) % W);
      const tw = (this.frame + s.p * 200) % 120 < 6;
      g.fillStyle = s.p > 0.8 && !tw ? "#ffffff" : s.p > 0.45 ? "#4a5aa8" : "#27306a";
      g.fillRect(x, Math.floor(s.y), 1, 1);
    }

    // Rocks (drawn at wrapped copies near edges so they slide across)
    for (const r of this.rocks) {
      for (const [ox, oy] of this.wrapOffsets(r.x, r.y, r.r + 2)) this.drawRock(r, r.x + ox, r.y + oy);
    }

    // Bullets
    for (const b of this.bullets) {
      g.fillStyle = this.frame % 4 < 2 ? PALETTE.yellow : "#ffffff";
      g.fillRect(Math.floor(b.x) - 1, Math.floor(b.y) - 1, 2, 2);
    }

    // Ship
    if (this.mode !== "demo" && this.mode !== "dying" && this.mode !== "over") {
      const visible = this.invuln <= 0 || this.frame % 8 < 5;
      if (visible) this.drawShip();
    }

    // Particles
    for (const p of this.particles) {
      g.fillStyle = p.color;
      g.fillRect(Math.floor(p.x), Math.floor(p.y), 1, 1);
    }

    // Floating split notes & combos
    for (const f of this.floaters) {
      if (f.t < 0.3 && this.frame % 4 < 2) continue;
      this.textCentered(f.text, f.x, f.y, f.color, f.scale);
    }

    if (this.mode === "demo") return;

    // Rule-break explanation
    if (this.flash) this.textCentered(this.flash.text, W / 2, H - 14, this.flash.color, 1);

    // Level banner
    if (this.banner) {
      const [a, b] = this.banner.lines;
      const bs = textWidth(b, 2) <= W - 12 ? 2 : 1;
      this.textCentered(a, W / 2, 34, this.banner.color, 2);
      this.textCentered(b, W / 2, 34 + 18, "#ffffff", bs);
    }

    if (this.mode === "dying" && this.lives > 0) this.textCentered("SHIP LOST!", W / 2, 90, PALETTE.red, 2);
    if (this.mode === "over") this.textCentered("GAME OVER", W / 2, 90, PALETTE.red, 2);
  }

  private wrapOffsets(x: number, y: number, r: number): [number, number][] {
    const xs = [0];
    const ys = [0];
    if (x - r < 0) xs.push(W);
    if (x + r > W) xs.push(-W);
    if (y - r < 0) ys.push(H);
    if (y + r > H) ys.push(-H);
    const out: [number, number][] = [];
    for (const ox of xs) for (const oy of ys) out.push([ox, oy]);
    return out;
  }

  private drawRock(r: Rock, x: number, y: number) {
    const g = this.ctx;
    const s = r.sprite;
    const px = Math.round(x - s.width / 2);
    const py = Math.round(y - s.height / 2);
    g.drawImage(s, px, py);
    if (r.bad > 0 && this.frame % 6 < 3) {
      g.globalAlpha = 0.55;
      g.fillStyle = PALETTE.red;
      g.beginPath();
      g.arc(Math.round(x), Math.round(y), r.r, 0, Math.PI * 2);
      g.fill();
      g.globalAlpha = 1;
    } else if (r.hit > 0 && this.frame % 4 < 2) {
      g.globalAlpha = 0.5;
      g.fillStyle = "#ffffff";
      g.beginPath();
      g.arc(Math.round(x), Math.round(y), r.r, 0, Math.PI * 2);
      g.fill();
      g.globalAlpha = 1;
    }
    const l = r.label;
    g.drawImage(l, Math.round(x - l.width / 2), Math.round(y - l.height / 2));
  }

  private drawShip() {
    const g = this.ctx;
    const turns = this.angle / (Math.PI * 2);
    const f = (((Math.round(turns * SHIP_FRAMES) % SHIP_FRAMES) + SHIP_FRAMES) % SHIP_FRAMES);
    const img = this.ships[f];
    const o = (SHIP_SIZE - 1) / 2;
    if (this.thrusting && this.frame % 4 < 2) {
      const fx = Math.sin(this.angle);
      const fy = -Math.cos(this.angle);
      g.fillStyle = PALETTE.yellow;
      g.fillRect(Math.round(this.sx - fx * 8) - 1, Math.round(this.sy - fy * 8) - 1, 2, 2);
      g.fillStyle = PALETTE.red;
      g.fillRect(Math.round(this.sx - fx * 10), Math.round(this.sy - fy * 10), 1, 1);
    }
    g.drawImage(img, Math.round(this.sx - o), Math.round(this.sy - o));
    if (this.invuln > 0 && this.shield > 0 && this.mode === "play") {
      // Shield bubble
      g.strokeStyle = this.frame % 6 < 3 ? PALETTE.blueLight : PALETTE.blue;
      g.beginPath();
      g.arc(Math.round(this.sx) + 0.5, Math.round(this.sy) + 0.5, 10, 0, Math.PI * 2);
      g.stroke();
    }
  }

  /** Pixel text centred on x, kept on screen. */
  private textCentered(s: string, x: number, y: number, color: string, scale: number) {
    const img = textSprite(s, color, scale);
    const px = Math.max(1, Math.min(W - img.width - 1, Math.round(x - img.width / 2)));
    this.ctx.drawImage(img, px, Math.round(y));
  }
}
