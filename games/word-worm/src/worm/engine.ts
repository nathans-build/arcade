import type { ChipAudio, Grade } from "@/kit";
import {
  SEG_H,
  bandOf,
  labelScale,
  segWidth,
  stripFor,
  trayCells,
  whyWrong,
  wormLabels,
  type Band,
  type Challenge,
} from "./challenges";
import { textWidth } from "./font";
import {
  BLOT_SIZE,
  HERO_H,
  HERO_HAND,
  HERO_W,
  MITE_H,
  MITE_W,
  PALETTE,
  getSprites,
  makeBackground,
  textSprite,
  type SpriteSheet,
} from "./sprites";

/* Logical arcade resolution; the canvas is scaled up with nearest-neighbour. */
export const W = 320;
export const H = 200;

/** Top of the worm field (the word tray sits above it). */
export const TOP = 14;
export const ROW_H = SEG_H;
export const ROWS = 14;
/** First row of the hero's zone at the bottom. */
export const PZ_ROW = 10;
export const PZ_Y = TOP + PZ_ROW * ROW_H;
const FIELD_BOTTOM = TOP + ROWS * ROW_H;
const CELL = BLOT_SIZE;
const COLS = Math.floor(W / CELL);

export const MAX_SHIELD = 3;
const LIVES = 3;

export type Action = "left" | "right" | "up" | "down" | "fire";

export interface HudState {
  score: number;
  lives: number;
  shield: number;
  level: number;
  streak: number;
  /** 0 = worms at the top, 1 = a worm is in the bottom row. */
  danger: number;
  /** 1-based worm number within the level. */
  word: number;
  wordsPerLevel: number;
  /** Parts shot so far in the current challenge. */
  step: number;
}

export interface EngineCallbacks {
  onHud(h: HudState): void;
  /** Next challenge for a new worm. */
  nextChallenge(): Challenge;
  /** A worm has been launched with this challenge and pick strip. */
  onChallenge(ch: Challenge, strip: string[]): void;
  /** The strip (keys 1-4) changed. */
  onStrip(strip: string[]): void;
  /** A segment was shot (by dart or pick): right or wrong, with the reason when wrong. */
  onShot(ch: Challenge, label: string, correct: boolean, why: string): void;
  /** Every part was shot. `clean` = no wrong shots. */
  onSolved(ch: Challenge, clean: boolean): void;
  /** Level cleared: the engine waits for `resolveCheckpoint`. */
  onLevelClear(level: number): void;
  onGameOver(): void;
}

export interface Seg {
  id: number;
  label: string;
  w: number;
  x: number;
  y: number;
  /** Red "wrong" flash; immune while > 0. */
  bad: number;
}
interface TrailPt { x: number; y: number; r: number; dir: number; vdir: number }
export interface Worm {
  segs: Seg[];
  /** Oldest first; the head is the last point. */
  trail: TrailPt[];
  x: number;
  y: number;
  r: number;
  dir: number;
  vdir: number;
}
interface Blot { c: number; r: number; hp: number }
interface Dart { x: number; y: number }
interface Homing { x: number; y: number; target: number; t: number }
interface Particle { x: number; y: number; vx: number; vy: number; life: number; color: string }
interface Floater { text: string; x: number; y: number; t: number; color: string; scale: number }
export interface Pest { x: number; y: number; vx: number; vy: number; t: number }

type Mode = "demo" | "play" | "dying" | "solved" | "checkpoint" | "over";

/** Tuning per grade band: early readers get slower worms, fewer blots and a rarer pest. */
const TUNING: Record<Band, { speed: number; blots: number; pestDelay: number; pestSpeed: number; perLevel: number }> = {
  k2: { speed: 14, blots: 12, pestDelay: 28, pestSpeed: 26, perLevel: 3 },
  "35": { speed: 19, blots: 18, pestDelay: 16, pestSpeed: 38, perLevel: 4 },
  "68": { speed: 23, blots: 22, pestDelay: 12, pestSpeed: 46, perLevel: 4 },
  hs: { speed: 25, blots: 24, pestDelay: 10, pestSpeed: 50, perLevel: 4 },
};

const rowY = (r: number) => TOP + r * ROW_H + ROW_H / 2;
const rowOf = (y: number) => Math.round((y - TOP - ROW_H / 2) / ROW_H);
function rand(a: number, b: number) {
  return a + Math.random() * (b - a);
}

export class WormEngine {
  private ctx: CanvasRenderingContext2D;
  private sprites: SpriteSheet;
  private bg: HTMLCanvasElement;
  private raf = 0;
  private last = 0;
  private frame = 0;
  private hudTimer = 0;
  private hudKey = "";

  mode: Mode = "demo";
  paused = false;
  private keys = new Set<Action>();
  /** A quick tap of FIRE (down and up between frames) still fires once. */
  private fireQueued = 0;

  grade: Grade = "2";
  band: Band = "k2";

  // Hero
  hx = W / 2 - HERO_W / 2;
  hy = FIELD_BOTTOM - HERO_H - 2;
  private stride = 0;
  invuln = 0;
  private dyingT = 0;

  worms: Worm[] = [];
  blots = new Map<number, Blot>();
  private dart: Dart | null = null;
  homing: Homing[] = [];
  pest: Pest | null = null;
  private pestT = 20;
  private particles: Particle[] = [];
  private floaters: Floater[] = [];
  private banner: { lines: string[]; t: number; color: string } | null = null;
  private nextSegId = 1;

  challenge: Challenge | null = null;
  step = 0;
  strip: string[] = [];
  private wrongs = 0;
  private speedMul = 1;
  private shieldCd = 0;
  private solvedT = 0;
  private popT = 0;
  wordNo = 0;

  score = 0;
  lives = LIVES;
  shield = MAX_SHIELD;
  level = 1;
  streak = 0;

  constructor(canvas: HTMLCanvasElement, private audio: ChipAudio, private cb: EngineCallbacks) {
    canvas.width = W;
    canvas.height = H;
    this.ctx = canvas.getContext("2d")!;
    this.ctx.imageSmoothingEnabled = false;
    this.sprites = getSprites();
    this.bg = makeBackground(W, H, TOP, ROW_H, ROWS, PZ_ROW);
  }

  /* ------------------------------ lifecycle ------------------------------ */

  start() {
    this.last = performance.now();
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - this.last) / 1000);
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

  /** Attract mode behind the title screen: a worm of letters winding through the blots. */
  demo(grade: Grade) {
    this.grade = grade;
    this.band = bandOf(grade);
    this.mode = "demo";
    this.paused = false;
    this.challenge = null;
    this.clearActors();
    this.makeBlots(TUNING[this.band].blots);
    const letters = "WORDWORM".split("");
    this.worms = [this.spawnWorm(letters, Math.random() < 0.5)];
  }

  newGame(grade: Grade) {
    this.grade = grade;
    this.band = bandOf(grade);
    this.mode = "play";
    this.paused = false;
    this.score = 0;
    this.lives = LIVES;
    this.shield = MAX_SHIELD;
    this.level = 1;
    this.streak = 0;
    this.wordNo = 0;
    this.hx = W / 2 - HERO_W / 2;
    this.hy = FIELD_BOTTOM - HERO_H - 2;
    this.invuln = 1.5;
    this.clearActors();
    this.makeBlots(TUNING[this.band].blots);
    this.pestT = TUNING[this.band].pestDelay;
    this.showBanner(["LEVEL 1"], PALETTE.yellow, 1.6);
    this.nextWorm();
    this.pushHud(true);
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
      if (a === "fire") this.fireQueued = 0.35;
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
      this.shield = MAX_SHIELD;
      this.score += 500 * this.level;
    } else {
      this.shield = Math.min(MAX_SHIELD, this.shield + 1);
    }
    this.level++;
    this.wordNo = 0;
    this.mode = "play";
    this.makeBlots(Math.min(6, 2 + this.level), false);
    this.showBanner([`LEVEL ${this.level}`], PALETTE.yellow, 1.6);
    this.audio.levelUp();
    this.nextWorm();
    this.pushHud(true);
  }

  /* ------------------------------ answering ------------------------------ */

  /** Keys 1-4 / strip buttons: fire a homing dart at the nearest segment with that label. */
  pick(slot: number): boolean {
    const label = this.strip[slot];
    if (!label || !this.canAnswer()) return false;
    let best: Seg | null = null;
    let bestD = Infinity;
    for (const w of this.worms)
      for (const s of w.segs) {
        if (s.label !== label || this.homing.some((h) => h.target === s.id)) continue;
        const d = Math.hypot(s.x - (this.hx + HERO_W / 2), s.y - this.hy);
        if (d < bestD) {
          bestD = d;
          best = s;
        }
      }
    if (!best) {
      // Every copy is already targeted: aim at one anyway so the key never feels dead.
      for (const w of this.worms) for (const s of w.segs) if (s.label === label) best = s;
    }
    if (!best) return false;
    return this.launchHoming(best);
  }

  /** Tap on the screen (logical coordinates): homing dart at the segment under the finger. */
  tapAt(x: number, y: number): boolean {
    if (!this.canAnswer()) return false;
    let best: Seg | null = null;
    let bestD = Infinity;
    for (const w of this.worms)
      for (const s of w.segs) {
        const dx = Math.max(0, Math.abs(x - s.x) - s.w / 2);
        const dy = Math.max(0, Math.abs(y - s.y) - SEG_H / 2);
        const d = Math.hypot(dx, dy);
        if (d <= 5 && d < bestD) {
          bestD = d;
          best = s;
        }
      }
    return best ? this.launchHoming(best) : false;
  }

  private canAnswer() {
    return this.mode === "play" && !this.paused && !!this.challenge;
  }

  private launchHoming(s: Seg): boolean {
    if (this.homing.length >= 3) return false;
    this.homing.push({ x: this.hx + HERO_HAND.x, y: this.hy + HERO_HAND.y, target: s.id, t: 0 });
    this.audio.shoot();
    return true;
  }

  private findSeg(id: number): { w: Worm; i: number } | null {
    for (const w of this.worms) {
      const i = w.segs.findIndex((s) => s.id === id);
      if (i >= 0) return { w, i };
    }
    return null;
  }

  private hitSegment(w: Worm, i: number) {
    const seg = w.segs[i];
    const ch = this.challenge;
    if (!ch || this.mode !== "play") return;
    if (seg.bad > 0) return; // just flashed red: no double penalty
    const need = ch.steps[this.step];
    if (seg.label === need) this.rightShot(w, i);
    else this.wrongShot(seg, need);
  }

  private rightShot(w: Worm, i: number) {
    const ch = this.challenge!;
    const seg = w.segs[i];
    this.streak++;
    const pts = 50 * Math.min(5, this.streak);
    this.score += pts;
    this.step++;
    this.burst(seg.x, seg.y, [PALETTE.green, PALETTE.white, PALETTE.yellow], 14);
    this.float(`+${pts}`, seg.x, seg.y - 8, PALETTE.green);
    this.audio.blip();
    this.splitAt(w, i);
    // Leave an ink blot where the segment was (never in the hero's zone).
    const c = Math.floor(seg.x / CELL);
    const r = rowOf(seg.y);
    if (r >= 1 && r < PZ_ROW && c >= 0 && c < COLS && Math.abs(seg.y - rowY(r)) < 2) this.blots.set(r * COLS + c, { c, r, hp: 3 });
    this.cb.onShot(ch, seg.label, true, "");
    if (this.step >= ch.steps.length) {
      this.solve();
    } else {
      this.refreshStrip();
    }
    this.pushHud(true);
  }

  private wrongShot(seg: Seg, need: string) {
    const ch = this.challenge!;
    seg.bad = 0.8;
    this.wrongs++;
    this.streak = 0;
    let lost = false;
    if (this.shield > 0 && this.shieldCd <= 0) {
      this.shield--;
      this.shieldCd = 1.2;
      lost = true;
    }
    this.speedMul = Math.min(1.6, this.speedMul * 1.12);
    this.float(lost ? "✘ -SHIELD" : "✘ FASTER", seg.x, seg.y - 8, PALETTE.red);
    this.audio.wrong();
    this.cb.onShot(ch, seg.label, false, whyWrong(ch, seg.label, need));
    this.pushHud(true);
  }

  private solve() {
    const ch = this.challenge!;
    this.mode = "solved";
    this.solvedT = 2.2;
    this.popT = 0.5;
    const bonus = 200 + 100 * this.level + (this.wrongs === 0 ? 200 : 0);
    this.score += bonus;
    this.showBanner([ch.word, `+${bonus}${this.wrongs === 0 ? " PERFECT!" : ""}`], PALETTE.green, 2);
    this.audio.correct();
    this.homing = [];
    this.cb.onSolved(ch, this.wrongs === 0);
  }

  private refreshStrip() {
    const ch = this.challenge;
    if (!ch) return;
    const labels = this.worms.flatMap((w) => w.segs.map((s) => s.label));
    const need = ch.steps[this.step];
    this.strip = need ? stripFor(labels, need) : [];
    this.cb.onStrip(this.strip);
  }

  private nextWorm() {
    const ch = this.cb.nextChallenge();
    this.challenge = ch;
    this.step = 0;
    this.wrongs = 0;
    this.speedMul = 1;
    this.wordNo++;
    this.homing = [];
    this.dart = null;
    this.worms = [this.spawnWorm(wormLabels(ch, this.band), this.wordNo % 2 === 0)];
    const labels = this.worms[0].segs.map((s) => s.label);
    this.strip = stripFor(labels, ch.steps[0]);
    this.cb.onChallenge(ch, this.strip);
  }

  /* ------------------------------ worms ------------------------------ */

  private spawnWorm(labels: string[], fromRight: boolean): Worm {
    const segs: Seg[] = labels.map((label) => ({ id: this.nextSegId++, label, w: segWidth(label), x: 0, y: 0, bad: 0 }));
    const dir = fromRight ? -1 : 1;
    const hw = segs[0].w / 2;
    const x = fromRight ? W + hw : -hw;
    const y = rowY(0);
    const len = segs.reduce((a, s) => a + s.w + 1, 0) + 8;
    const trail: TrailPt[] = [];
    for (let d = Math.ceil(len); d >= 0; d--) trail.push({ x: x - dir * d, y, r: 0, dir, vdir: 1 });
    const w: Worm = { segs, trail, x, y, r: 0, dir, vdir: 1 };
    this.placeSegs(w);
    return w;
  }

  /** Spacing of segment i's centre behind the head. */
  private offsets(w: Worm): number[] {
    const out: number[] = [];
    let d = 0;
    w.segs.forEach((s, i) => {
      if (i > 0) d += (w.segs[i - 1].w + s.w) / 2 + 1;
      out.push(d);
    });
    return out;
  }

  /** Put every segment on the trail, and trim trail points nobody needs. */
  private placeSegs(w: Worm) {
    const offs = this.offsets(w);
    const t = w.trail;
    let si = 0;
    let acc = 0;
    let k = t.length - 1;
    const setSeg = (x: number, y: number) => {
      w.segs[si].x = x;
      w.segs[si].y = y;
      si++;
    };
    while (si < offs.length && offs[si] <= 0) setSeg(t[k].x, t[k].y);
    for (; k > 0 && si < offs.length; k--) {
      const a = t[k];
      const b = t[k - 1];
      const len = Math.hypot(a.x - b.x, a.y - b.y);
      while (si < offs.length && acc + len >= offs[si]) {
        const f = len > 0 ? (offs[si] - acc) / len : 0;
        setSeg(a.x + (b.x - a.x) * f, a.y + (b.y - a.y) * f);
      }
      acc += len;
    }
    // Trail ran out (shouldn't happen): stack the rest at the tail end.
    while (si < offs.length) setSeg(t[0].x, t[0].y);
    // Keep a little spare trail behind the tail.
    const need = (offs[offs.length - 1] ?? 0) + 6;
    let dist = 0;
    for (let j = t.length - 1; j > 0; j--) {
      dist += Math.hypot(t[j].x - t[j - 1].x, t[j].y - t[j - 1].y);
      if (dist > need) {
        if (j - 1 > 0) t.splice(0, j - 1);
        break;
      }
    }
  }

  private pushTrail(w: Worm) {
    w.trail.push({ x: w.x, y: w.y, r: w.r, dir: w.dir, vdir: w.vdir });
  }

  private blotAhead(w: Worm): boolean {
    const hw = w.segs[0].w / 2;
    const px = w.x + w.dir * (hw + 1);
    const c = Math.floor(px / CELL);
    if (c < 0 || c >= COLS) return false;
    return this.blots.has(w.r * COLS + c);
  }

  private startTurn(w: Worm) {
    let nr = w.r + w.vdir;
    if (nr > ROWS - 1) {
      w.vdir = -1;
      nr = w.r - 1;
    } else if (w.vdir < 0 && nr < PZ_ROW) {
      w.vdir = 1;
      nr = w.r + 1;
    }
    w.r = nr;
  }

  private moveWorm(w: Worm, dist: number) {
    let move = dist;
    let guard = 0;
    while (move > 1e-6 && guard++ < 400) {
      const ty = rowY(w.r);
      if (Math.abs(w.y - ty) > 1e-3) {
        const d = Math.min(move, Math.abs(ty - w.y), 1);
        w.y += Math.sign(ty - w.y) * d;
        move -= d;
        if (Math.abs(w.y - ty) <= 1e-3) {
          w.y = ty;
          w.dir = -w.dir;
        }
        this.pushTrail(w);
        continue;
      }
      const hw = w.segs[0].w / 2;
      const front = w.x + w.dir * hw;
      if ((w.dir > 0 && front >= W - 1) || (w.dir < 0 && front <= 1) || this.blotAhead(w)) {
        this.startTurn(w);
        continue;
      }
      const d = Math.min(move, 1);
      w.x += w.dir * d;
      move -= d;
      this.pushTrail(w);
    }
    this.placeSegs(w);
  }

  /** Remove segment i; the segments behind it become a new worm that turns away (classic split). */
  private splitAt(w: Worm, i: number) {
    const rear = w.segs.slice(i + 1);
    const offs = this.offsets(w);
    w.segs = w.segs.slice(0, i);
    if (w.segs.length === 0) this.worms = this.worms.filter((x) => x !== w);
    if (rear.length === 0) return;
    // Find the trail point at the new head's distance.
    const target = offs[i + 1];
    const t = w.trail;
    let acc = 0;
    let k = t.length - 1;
    for (; k > 0; k--) {
      const len = Math.hypot(t[k].x - t[k - 1].x, t[k].y - t[k - 1].y);
      if (acc + len >= target) break;
      acc += len;
    }
    const at = t[Math.max(0, k)];
    const trail = t.slice(0, Math.max(1, k + 1)).map((p) => ({ ...p }));
    const head = rear[0];
    trail.push({ x: head.x, y: head.y, r: at.r, dir: at.dir, vdir: at.vdir });
    const nw: Worm = { segs: rear, trail, x: head.x, y: head.y, r: at.r, dir: at.dir, vdir: at.vdir };
    if (Math.abs(nw.y - rowY(nw.r)) <= 1e-3) {
      nw.y = rowY(nw.r);
      this.startTurn(nw); // it bumps into the new blot and turns, as in the classic
    }
    this.worms.push(nw);
    this.placeSegs(nw);
  }

  /** After the hero is hit, the worm pieces regroup and start again from the top. */
  private regroup() {
    const labels = this.worms.flatMap((w) => w.segs);
    if (!labels.length) return;
    const nw = this.spawnWorm(labels.map((s) => s.label), Math.random() < 0.5);
    nw.segs.forEach((s, i) => (s.id = labels[i].id));
    this.worms = [nw];
    this.homing = [];
    this.dart = null;
  }

  /* ------------------------------ helpers ------------------------------ */

  private clearActors() {
    this.worms = [];
    this.dart = null;
    this.homing = [];
    this.pest = null;
    this.particles = [];
    this.floaters = [];
    this.banner = null;
    this.keys.clear();
  }

  private makeBlots(n: number, reset = true) {
    if (reset) this.blots.clear();
    let tries = 0;
    let added = 0;
    while (added < n && tries++ < 500) {
      const r = 2 + Math.floor(Math.random() * (PZ_ROW - 3));
      const c = 1 + Math.floor(Math.random() * (COLS - 2));
      const key = r * COLS + c;
      if (this.blots.has(key) || this.blots.has(key - 1) || this.blots.has(key + 1)) continue;
      this.blots.set(key, { c, r, hp: 3 });
      added++;
    }
  }

  private showBanner(lines: string[], color: string, t: number) {
    this.banner = { lines, color, t };
  }

  private float(text: string, x: number, y: number, color: string, scale = 1) {
    this.floaters.push({ text, x, y, t: 1.2, color, scale });
  }

  private burst(x: number, y: number, colors: string[], n: number) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = rand(20, 70);
      this.particles.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: rand(0.3, 0.7), color: colors[i % colors.length] });
    }
  }

  private pushHud(force = false) {
    const h: HudState = {
      score: this.score,
      lives: this.lives,
      shield: this.shield,
      level: this.level,
      streak: this.streak,
      danger: this.danger(),
      word: this.wordNo,
      wordsPerLevel: TUNING[this.band].perLevel,
      step: this.step,
    };
    const key = JSON.stringify(h);
    if (force || key !== this.hudKey) {
      this.hudKey = key;
      this.cb.onHud(h);
    }
  }

  private danger(): number {
    let r = 0;
    for (const w of this.worms) r = Math.max(r, w.r);
    return this.worms.length ? r / (ROWS - 1) : 0;
  }

  private heroBox() {
    return { x: this.hx + 3, y: this.hy + 2, w: HERO_W - 6, h: HERO_H - 3 };
  }

  /** Debug/playtest hook: lose a life now. */
  die() {
    this.shield = 0;
    this.invuln = 0;
    this.hitHero();
  }

  private hitHero() {
    if (this.invuln > 0 || this.mode !== "play") return;
    const cx = this.hx + HERO_W / 2;
    const cy = this.hy + HERO_H / 2;
    this.pest = null;
    if (this.shield > 0) {
      this.shield--;
      this.invuln = 2.2;
      this.burst(cx, cy, [PALETTE.cyan, PALETTE.lightBlue], 18);
      this.showBanner(["SHIELD SAVED YOU!"], PALETTE.cyan, 1.4);
      this.audio.explode();
      this.regroup();
      this.pushHud(true);
      return;
    }
    this.lives--;
    this.mode = "dying";
    this.dyingT = 1.6;
    this.streak = 0;
    this.burst(cx, cy, [PALETTE.red, PALETTE.yellow, PALETTE.white, PALETTE.blue], 36);
    this.audio.crash();
    this.pushHud(true);
  }

  /* ------------------------------ update ------------------------------ */

  private update(dt: number) {
    this.frame++;
    const tune = TUNING[this.band];

    // Particles, floaters, banner
    for (const p of this.particles) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 60 * dt;
      p.life -= dt;
    }
    this.particles = this.particles.filter((p) => p.life > 0);
    for (const f of this.floaters) {
      f.t -= dt;
      f.y -= 12 * dt;
    }
    this.floaters = this.floaters.filter((f) => f.t > 0);
    if (this.banner) {
      this.banner.t -= dt;
      if (this.banner.t <= 0) this.banner = null;
    }
    for (const w of this.worms) for (const s of w.segs) if (s.bad > 0) s.bad -= dt;

    if (this.mode === "demo") {
      for (const w of this.worms) this.moveWorm(w, 26 * dt);
      if (this.worms.every((w) => w.r >= ROWS - 1) && Math.random() < 0.002) this.demo(this.grade);
      return;
    }
    if (this.mode === "over" || this.mode === "checkpoint") return;

    if (this.mode === "dying") {
      this.dyingT -= dt;
      if (this.dyingT <= 0) {
        if (this.lives <= 0) {
          this.mode = "over";
          this.audio.gameOver();
          this.cb.onGameOver();
        } else {
          this.mode = "play";
          this.invuln = 2.5;
          this.hx = W / 2 - HERO_W / 2;
          this.hy = FIELD_BOTTOM - HERO_H - 2;
          this.regroup();
        }
        this.pushHud(true);
      }
      return;
    }

    // Hero movement (in play and while a solved worm pops)
    let moving = false;
    if (this.keys.has("left")) {
      this.hx -= 95 * dt;
      moving = true;
    }
    if (this.keys.has("right")) {
      this.hx += 95 * dt;
      moving = true;
    }
    if (this.keys.has("up")) this.hy -= 70 * dt;
    if (this.keys.has("down")) this.hy += 70 * dt;
    this.hx = Math.max(0, Math.min(W - HERO_W, this.hx));
    this.hy = Math.max(PZ_Y + 1, Math.min(FIELD_BOTTOM - HERO_H, this.hy));
    if (moving) this.stride += dt;
    this.invuln = Math.max(0, this.invuln - dt);
    this.shieldCd = Math.max(0, this.shieldCd - dt);

    // Firing: one ink dart on screen at a time, as in the classic.
    if ((this.keys.has("fire") || this.fireQueued > 0) && !this.dart) {
      this.dart = { x: this.hx + HERO_HAND.x, y: this.hy + HERO_HAND.y - 3 };
      this.fireQueued = 0;
      this.audio.shoot();
    }
    this.fireQueued = Math.max(0, this.fireQueued - dt);
    if (this.dart) this.updateDart(dt);
    this.updateHoming(dt);

    if (this.mode === "solved") {
      // Pop the leftover segments one by one, then move on.
      this.solvedT -= dt;
      this.popT -= dt;
      if (this.popT <= 0) {
        this.popT = 0.09;
        const w = this.worms.find((x) => x.segs.length);
        if (w) {
          const s = w.segs.pop()!;
          this.score += 10;
          this.burst(s.x, s.y, [PALETTE.lightBlue, PALETTE.white], 6);
          this.audio.blip();
        }
        this.worms = this.worms.filter((x) => x.segs.length);
      }
      if (this.solvedT <= 0 && this.worms.length === 0) {
        if (this.wordNo >= tune.perLevel) {
          this.mode = "checkpoint";
          this.releaseAllKeys();
          this.audio.checkpoint();
          this.cb.onLevelClear(this.level);
        } else {
          this.mode = "play";
          this.nextWorm();
        }
      }
      this.updatePest(dt, tune);
      this.hudTimer -= dt;
      if (this.hudTimer <= 0) {
        this.hudTimer = 0.15;
        this.pushHud();
      }
      return;
    }

    // Worms
    const levelMul = Math.min(1.5, 1 + 0.07 * (this.level - 1));
    const speed = tune.speed * levelMul * this.speedMul;
    for (const w of this.worms) this.moveWorm(w, speed * dt);

    // Worm touches hero
    const hb = this.heroBox();
    for (const w of this.worms)
      for (const s of w.segs) {
        if (Math.abs(s.x - (hb.x + hb.w / 2)) < (s.w + hb.w) / 2 && Math.abs(s.y - (hb.y + hb.h / 2)) < (SEG_H - 2 + hb.h) / 2) {
          this.hitHero();
          return;
        }
      }

    this.updatePest(dt, tune);

    this.hudTimer -= dt;
    if (this.hudTimer <= 0) {
      this.hudTimer = 0.15;
      this.pushHud();
    }
  }

  private updateDart(dt: number) {
    const d = this.dart!;
    const prevY = d.y;
    d.y -= 300 * dt;
    if (d.y < TOP - 4) {
      this.dart = null;
      return;
    }
    // Segments (swept test so fast darts can't skip a row)
    for (const w of this.worms)
      for (let i = 0; i < w.segs.length; i++) {
        const s = w.segs[i];
        if (Math.abs(d.x - s.x) <= s.w / 2 && d.y <= s.y + SEG_H / 2 && prevY + 4 >= s.y - SEG_H / 2) {
          this.dart = null;
          if (this.mode === "play") this.hitSegment(w, i);
          return;
        }
      }
    // Pest
    const p = this.pest;
    if (p && Math.abs(d.x - p.x) <= MITE_W / 2 && d.y <= p.y + MITE_H / 2 && prevY + 4 >= p.y - MITE_H / 2) {
      const dist = this.hy - p.y;
      const pts = dist < 16 ? 900 : dist < 32 ? 600 : 300;
      this.score += pts;
      this.float(`${pts}`, p.x, p.y - 6, PALETTE.yellow);
      this.burst(p.x, p.y, [PALETTE.purple, PALETTE.orange, PALETTE.yellow], 20);
      this.audio.explode();
      this.pest = null;
      this.dart = null;
      return;
    }
    // Blots
    const c = Math.floor(d.x / CELL);
    const r = rowOf(d.y);
    const b = this.blots.get(r * COLS + c);
    if (b && d.y <= rowY(r) + BLOT_SIZE / 2) {
      b.hp--;
      this.score += 1;
      this.burst(d.x, d.y, [PALETTE.inkHi], 3);
      if (b.hp <= 0) {
        this.blots.delete(r * COLS + c);
        this.score += 4;
      }
      this.dart = null;
    }
  }

  private updateHoming(dt: number) {
    for (const h of this.homing) {
      h.t += dt;
      const found = this.findSeg(h.target);
      if (!found) {
        h.t = 99;
        continue;
      }
      const s = found.w.segs[found.i];
      const dx = s.x - h.x;
      const dy = s.y - h.y;
      const dist = Math.hypot(dx, dy);
      const step = 280 * dt;
      if (dist <= step + 3) {
        h.t = 99;
        if (this.mode === "play") this.hitSegment(found.w, found.i);
        continue;
      }
      h.x += (dx / dist) * step;
      h.y += (dy / dist) * step;
    }
    this.homing = this.homing.filter((h) => h.t < 5);
  }

  private updatePest(dt: number, tune: (typeof TUNING)[Band]) {
    if (!this.pest) {
      if (this.mode !== "play") return;
      this.pestT -= dt;
      if (this.pestT <= 0) {
        const fromLeft = Math.random() < 0.5;
        const sp = tune.pestSpeed * Math.min(1.4, 1 + 0.05 * (this.level - 1));
        this.pest = { x: fromLeft ? -MITE_W : W + MITE_W, y: rand(PZ_Y - 10, FIELD_BOTTOM - 10), vx: (fromLeft ? 1 : -1) * sp * 0.6, vy: sp * (Math.random() < 0.5 ? 1 : -1), t: 0 };
        this.pestT = tune.pestDelay * rand(0.8, 1.3);
      }
      return;
    }
    const p = this.pest;
    p.t += dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    const top = PZ_Y - 14;
    const bottom = FIELD_BOTTOM - MITE_H / 2;
    if (p.y < top) {
      p.y = top;
      p.vy = Math.abs(p.vy);
    }
    if (p.y > bottom) {
      p.y = bottom;
      p.vy = -Math.abs(p.vy);
    }
    if (Math.random() < dt * 0.8) p.vy = -p.vy;
    // It nibbles blots it crosses.
    const key = rowOf(p.y) * COLS + Math.floor(p.x / CELL);
    if (this.blots.has(key) && Math.random() < dt * 2) this.blots.delete(key);
    if (p.x < -MITE_W * 2 || p.x > W + MITE_W * 2) {
      this.pest = null;
      return;
    }
    if (this.mode === "play") {
      const hb = this.heroBox();
      if (Math.abs(p.x - (hb.x + hb.w / 2)) < (MITE_W - 4 + hb.w) / 2 && Math.abs(p.y - (hb.y + hb.h / 2)) < (MITE_H - 2 + hb.h) / 2) this.hitHero();
    }
  }

  /* ------------------------------ draw ------------------------------ */

  private draw() {
    const g = this.ctx;
    g.drawImage(this.bg, 0, 0);

    // Blots
    for (const b of this.blots.values()) g.drawImage(this.sprites.blot[Math.max(0, b.hp - 1)], b.c * CELL, TOP + b.r * ROW_H + 2);

    // Worms (tail first so the head draws on top)
    const locked = new Set(this.homing.map((h) => h.target));
    for (const w of this.worms) {
      for (let i = w.segs.length - 1; i >= 0; i--) this.drawSeg(w.segs[i], i === 0, w.dir, locked.has(w.segs[i].id), i);
    }

    // Pest
    if (this.pest) {
      const spr = this.sprites.mite[Math.floor(this.pest.t * 8) % 2];
      g.drawImage(spr, Math.round(this.pest.x - MITE_W / 2), Math.round(this.pest.y - MITE_H / 2));
    }

    // Hero
    if (this.mode !== "demo" && this.mode !== "dying" && this.mode !== "over") {
      const blink = this.invuln > 0 && Math.floor(this.invuln * 10) % 2 === 0;
      if (!blink) {
        const spr = Math.floor(this.stride * 8) % 2 ? this.sprites.heroStep : this.sprites.hero;
        g.drawImage(spr, Math.round(this.hx), Math.round(this.hy));
        if (this.shield > 0 && this.mode === "play") {
          g.fillStyle = "rgba(127, 243, 255, 0.35)";
          for (let i = 0; i < this.shield; i++) g.fillRect(Math.round(this.hx) + 2 + i * 4, Math.round(this.hy) + HERO_H + 1, 3, 1);
        }
      }
    }

    // Darts
    if (this.dart) {
      g.fillStyle = PALETTE.yellow;
      g.fillRect(Math.round(this.dart.x), Math.round(this.dart.y), 1, 4);
      g.fillStyle = PALETTE.white;
      g.fillRect(Math.round(this.dart.x), Math.round(this.dart.y), 1, 1);
    }
    for (const h of this.homing) {
      g.fillStyle = PALETTE.cyan;
      g.fillRect(Math.round(h.x) - 1, Math.round(h.y) - 1, 3, 3);
      g.fillStyle = PALETTE.white;
      g.fillRect(Math.round(h.x), Math.round(h.y), 1, 1);
    }

    // Particles
    for (const p of this.particles) {
      g.fillStyle = p.color;
      g.fillRect(Math.round(p.x), Math.round(p.y), 1, 1);
    }

    // Floaters
    for (const f of this.floaters) {
      const spr = textSprite(f.text, f.color, f.scale, "#000");
      g.globalAlpha = Math.min(1, f.t * 2);
      g.drawImage(spr, Math.round(Math.max(1, Math.min(W - spr.width - 1, f.x - spr.width / 2))), Math.round(f.y));
      g.globalAlpha = 1;
    }

    this.drawTray();

    // Banner
    if (this.banner) {
      const lines = this.banner.lines;
      const scale = 2;
      const y0 = 70;
      lines.forEach((ln, i) => {
        const sc = i === 0 && textWidth(ln, scale) < W - 20 ? scale : 1;
        const spr = textSprite(ln, i === 0 ? this.banner!.color : PALETTE.yellow, sc, "#000");
        g.drawImage(spr, Math.round((W - spr.width) / 2), y0 + i * 14);
      });
    }

    if (this.mode === "demo") {
      const t = textSprite("WORD WORM", PALETTE.yellow, 2, PALETTE.red);
      g.drawImage(t, Math.round((W - t.width) / 2), 3);
    }
  }

  private drawSeg(s: Seg, head: boolean, dir: number, locked: boolean, i: number) {
    const g = this.ctx;
    const x = Math.round(s.x - s.w / 2);
    const y = Math.round(s.y - SEG_H / 2);
    const w = s.w;
    const h = SEG_H;
    const bad = s.bad > 0 && Math.floor(s.bad * 12) % 2 === 0;
    const body = bad ? PALETTE.red : head ? "#c01c26" : i % 2 ? "#2456e8" : "#2d62f0";
    const hi = bad ? "#ff8088" : head ? "#ff6a70" : PALETTE.lightBlue;
    // Legs
    const phase = Math.floor(this.frame / 8 + i) % 2;
    g.fillStyle = PALETTE.orange;
    g.fillRect(x + 2 + phase, y + h - 1, 1, 1);
    g.fillRect(x + w - 3 - phase, y + h - 1, 1, 1);
    // Body with clipped corners
    g.fillStyle = PALETTE.navy;
    g.fillRect(x, y + 1, w, h - 2);
    g.fillStyle = body;
    g.fillRect(x + 1, y, w - 2, h - 1);
    g.fillRect(x, y + 1, w, h - 3);
    g.fillStyle = hi;
    g.fillRect(x + 2, y, w - 4, 1);
    if (locked) {
      g.strokeStyle = PALETTE.cyan;
      g.lineWidth = 1;
      g.strokeRect(x - 0.5, y - 0.5, w + 1, h);
    }
    // Head: antennae + eyes on the leading side
    if (head) {
      g.fillStyle = PALETTE.yellow;
      const fx = dir > 0 ? x + w - 2 : x + 1;
      g.fillRect(fx, y - 2, 1, 2);
      g.fillRect(fx + (dir > 0 ? -3 : 3), y - 1, 1, 1);
    }
    // Label
    const scale = labelScale(s.label);
    const spr = textSprite(s.label, PALETTE.white, scale, "#05060f");
    g.drawImage(spr, Math.round(s.x - (spr.width - 1) / 2), y + Math.floor((h - spr.height) / 2));
  }

  /** The word being built, drawn in the top strip with the bitmap font. */
  private drawTray() {
    const ch = this.challenge;
    if (!ch || this.mode === "demo") return;
    const g = this.ctx;
    const cells = trayCells(ch, this.mode === "solved" ? ch.steps.length : this.step);
    const text = cells.map((c) => c.text);
    let scale = 2;
    const width = (s: number) => text.reduce((a, t) => a + textWidth(t, s), 0) + (text.length - 1) * 3 * s;
    if (width(2) > W - 90) scale = 1;
    let x = Math.round((W - width(scale)) / 2);
    const y = scale === 2 ? 2 : 4;
    const colors = { done: PALETTE.green, next: PALETTE.yellow, todo: "#6a78b8", ghost: "#9aa6e0" };
    cells.forEach((c, i) => {
      const spr = textSprite(c.text, colors[c.state], scale);
      g.drawImage(spr, x, y);
      if (c.state === "next" && Math.floor(this.frame / 20) % 2 === 0) {
        g.fillStyle = PALETTE.yellow;
        g.fillRect(x, y + 5 * scale + 1, spr.width, 1);
      }
      x += spr.width + (i < cells.length - 1 ? 3 * scale : 0);
    });
    const lv = textSprite(`LV${this.level} ${Math.min(this.wordNo, TUNING[this.band].perLevel)}/${TUNING[this.band].perLevel}`, "#6a78b8", 1);
    g.drawImage(lv, 3, 4);
  }
}
