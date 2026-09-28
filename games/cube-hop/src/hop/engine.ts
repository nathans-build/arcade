import type { ChipAudio, Grade } from "@/kit";
import { bandOf, rowsFor, specId, type Band, type RoundSpec } from "@/content";
import { forEachPixel, textWidth } from "./font";
import {
  DIRS,
  H,
  W,
  cellXY,
  dirTo,
  findPath,
  geomFor,
  hopDistance,
  key,
  neighbours,
  onPyramid,
  step,
  type Cell,
  type Dir,
  type Geom,
} from "./geom";
import { Round, type Cube, type LandResult, type Option } from "./round";
import { BALL_H, BALL_W, GLITCH_H, GLITCH_W, HERO_H, HERO_W, PAL, getSprites, makeBackground, type SpriteSheet } from "./sprites";

export { W, H };
export const MAX_SHIELD = 3;
const LIVES = 3;
export const ROUNDS_PER_LEVEL = 2;

export interface HudState {
  score: number;
  lives: number;
  shield: number;
  level: number;
  streak: number;
  round: number;
}

/** What the banner shows for the current round. */
export interface RoundView {
  id: string;
  spec: RoundSpec;
  built: string[];
  found: number;
  total: number;
  options: string[];
  msg: { text: string; ok: boolean } | null;
  solved: boolean;
  hint: boolean;
}

export interface EngineCallbacks {
  onHud(h: HudState): void;
  nextRound(): RoundSpec;
  onView(v: RoundView): void;
  /** Something to read aloud (if read-aloud is on). */
  say(text: string, kind: "prompt" | "label" | "wrong" | "clear" | "info"): void;
  onRoundClear(spec: RoundSpec, clean: boolean): void;
  onLevelClear(level: number): void;
  onGameOver(): void;
}

type Mode = "demo" | "play" | "dying" | "roundclear" | "checkpoint" | "over";

interface Mover {
  from: Cell;
  to: Cell | null;
  t: number;
  dur: number;
}
interface Hero extends Mover {
  path: Cell[];
  auto: boolean;
  queued: Dir | null;
  fall: { x: number; y: number; vx: number; vy: number; t: number } | null;
  ride: { pad: Pad; t: number; x0: number; y0: number } | null;
  bump: number;
}
interface Ball extends Mover {
  wait: number;
  drop: number;
}
interface Glitch extends Mover {
  wait: number;
  stun: number;
  frame: number;
}
interface Pad {
  r: number;
  side: -1 | 1;
  used: boolean;
}
interface Particle { x: number; y: number; vx: number; vy: number; life: number; color: string }
interface Floater { text: string; x: number; y: number; t: number; color: string }

/** Tuning per band: early readers get slow, rare hazards and the Glitch only from level 2. */
const TUNING: Record<Band, { hop: number; ballEvery: number; ballHop: number; maxBalls: number; glitchDelay: number; glitchHop: number; glitchFrom: number; grace: number }> = {
  k2: { hop: 0.32, ballEvery: 11, ballHop: 1.25, maxBalls: 1, glitchDelay: 30, glitchHop: 1.6, glitchFrom: 2, grace: 7 },
  "35": { hop: 0.28, ballEvery: 8, ballHop: 1.0, maxBalls: 2, glitchDelay: 18, glitchHop: 1.25, glitchFrom: 1, grace: 5 },
  "68": { hop: 0.26, ballEvery: 7, ballHop: 0.9, maxBalls: 2, glitchDelay: 15, glitchHop: 1.1, glitchFrom: 1, grace: 4.5 },
  hs: { hop: 0.25, ballEvery: 6, ballHop: 0.82, maxBalls: 3, glitchDelay: 13, glitchHop: 1.0, glitchFrom: 1, grace: 4 },
};

const AUTO_HOP = 0.15;
const ARC = 11;

function rand(a: number, b: number) {
  return a + Math.random() * (b - a);
}
const same = (a: Cell | null | undefined, b: Cell | null | undefined) => !!a && !!b && a.r === b.r && a.c === b.c;
/** Where a mover counts as standing: its target once past the middle of a hop. */
const at = (m: Mover): Cell => (m.to && m.t > 0.5 ? m.to : m.from);

export class HopEngine {
  private ctx: CanvasRenderingContext2D;
  private sprites: SpriteSheet;
  private bg: HTMLCanvasElement;
  private raf = 0;
  private last = 0;
  private time = 0;
  private hudKey = "";

  mode: Mode = "demo";
  paused = false;
  grade: Grade = "3";
  band: Band = "35";
  geom: Geom = geomFor(6);
  round: Round | null = null;
  options: Option[] = [];
  private msg: RoundView["msg"] = null;
  private solved = false;

  hero: Hero = this.freshHero();
  balls: Ball[] = [];
  glitch: Glitch | null = null;
  pads: Pad[] = [];
  private particles: Particle[] = [];
  private floaters: Floater[] = [];
  private banner: { text: string; t: number; color: string } | null = null;

  private roundT = 0;
  private ballT = 0;
  private glitchT = 0;
  private modeT = 0;
  invuln = 0;
  private demoT = 0;

  score = 0;
  lives = LIVES;
  shield = MAX_SHIELD;
  level = 1;
  roundNo = 1;
  streak = 0;

  constructor(canvas: HTMLCanvasElement, private audio: ChipAudio, private cb: EngineCallbacks) {
    canvas.width = W;
    canvas.height = H;
    this.ctx = canvas.getContext("2d")!;
    this.ctx.imageSmoothingEnabled = false;
    this.sprites = getSprites();
    this.bg = makeBackground(W, H);
  }

  private freshHero(): Hero {
    return { from: { r: 0, c: 0 }, to: null, t: 0, dur: 0.3, path: [], auto: false, queued: null, fall: null, ride: null, bump: 0 };
  }

  /* ------------------------------ lifecycle ------------------------------ */

  start() {
    this.last = performance.now();
    const loop = (now: number) => {
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

  togglePause(force?: boolean): boolean {
    if (this.mode === "demo" || this.mode === "over") return false;
    this.paused = force ?? !this.paused;
    return this.paused;
  }

  private get tune() {
    return TUNING[this.band];
  }

  private setGrade(g: Grade) {
    this.grade = g;
    this.band = bandOf(g);
    this.geom = geomFor(rowsFor(g));
  }

  /** Attract mode behind the title screen: a round of labels and a hero hopping about. */
  demo(g: Grade, spec?: RoundSpec) {
    this.setGrade(g);
    this.mode = "demo";
    this.paused = false;
    this.hero = this.freshHero();
    this.balls = [];
    this.glitch = null;
    this.round = null;
    if (spec) {
      try {
        this.round = new Round(spec, this.geom);
      } catch {
        this.round = null;
      }
    }
    this.makePads();
  }

  newGame(g: Grade) {
    this.setGrade(g);
    this.score = 0;
    this.lives = LIVES;
    this.shield = MAX_SHIELD;
    this.level = 1;
    this.roundNo = 1;
    this.streak = 0;
    this.paused = false;
    this.startRound();
  }

  private startRound() {
    const spec = this.cb.nextRound();
    this.round = new Round(spec, this.geom);
    this.round.land({ r: 0, c: 0 }); // the hero starts here, so it is lit
    this.hero = this.freshHero();
    this.balls = [];
    this.glitch = null;
    this.makePads();
    this.roundT = 0;
    this.ballT = this.tune.grace + 2;
    this.glitchT = this.tune.glitchDelay * Math.pow(0.92, this.level - 1);
    this.invuln = 1;
    this.mode = "play";
    this.solved = false;
    this.msg = null;
    this.refreshOptions();
    this.flashBanner(spec.kind === "build" ? "BUILD IT!" : `COLOR: ${spec.rule.target}`, PAL.yellow);
    this.emitView();
    this.cb.say(this.sayPrompt(), "prompt");
  }

  /** The prompt, plus (for early readers) the labels on offer. */
  sayPrompt(): string {
    if (!this.round) return "";
    const spec = this.round.spec;
    let s = spec.kind === "build" ? spec.item.prompt : spec.rule.prompt;
    if (bandOf(this.grade) === "k2") s += " " + this.options.map((o, i) => `${i + 1}: ${spoken(o.label)}.`).join(" ");
    return s;
  }

  private makePads() {
    const rows = this.geom.rows;
    const rs = [1, 2, 3].filter((r) => r <= rows - 3);
    const left = rs[Math.floor(Math.random() * rs.length)];
    let right = rs[Math.floor(Math.random() * rs.length)];
    if (rs.length > 1 && right === left) right = rs[(rs.indexOf(left) + 1) % rs.length];
    this.pads = [
      { r: left, side: -1, used: false },
      { r: right, side: 1, used: false },
    ];
  }

  private padCell(p: Pad): Cell {
    return p.side < 0 ? { r: p.r, c: -1 } : { r: p.r, c: p.r + 1 };
  }

  /* ------------------------------ input ------------------------------ */

  private heroBusy(): boolean {
    return !!this.hero.fall || !!this.hero.ride || this.mode !== "play";
  }

  /** Arrow keys / diagonal pad. */
  hop(d: Dir) {
    if (this.mode === "demo") return;
    if (this.paused || this.heroBusy()) return;
    const h = this.hero;
    if (h.auto) {
      h.path = [];
      h.auto = false;
    }
    if (h.to) {
      h.queued = d;
      return;
    }
    this.startHop(d, false);
  }

  /** Keys 1–4 / A–D and the option buttons: auto-hop to that cube along a safe path. */
  pick(i: number) {
    if (this.mode !== "play" || this.paused || this.heroBusy()) return;
    const o = this.options[i];
    if (!o) return;
    const [r, c] = o.key.split(",").map(Number);
    this.goTo({ r, c }, true);
  }

  /** Tap on the canvas: an adjacent cube (or pad) is one hop; a farther cube is an auto-hop. */
  tapAt(x: number, y: number) {
    if (this.mode !== "play" || this.paused || this.heroBusy()) return;
    const g = this.geom;
    const here = this.hero.to ?? this.hero.from;
    // Pads first
    for (const p of this.pads) {
      if (p.used) continue;
      const pc = this.padCell(p);
      const pos = cellXY(g, pc.r, pc.c);
      if (Math.abs(x - pos.x) < 12 && Math.abs(y - pos.y) < 10) {
        const d = dirTo(here, pc);
        if (d) this.hop(d);
        return;
      }
    }
    let best: Cell | null = null;
    let bestD = Infinity;
    for (let r = 0; r < g.rows; r++) {
      for (let c = 0; c <= r; c++) {
        const p = cellXY(g, r, c);
        // Top face (a diamond) plus the label chip area.
        const dx = Math.abs(x - p.x) / (g.w / 2), dy = Math.abs(y - p.y) / (g.th / 2 + 2);
        const d = dx + dy;
        if (d < 1.15 && d < bestD) {
          best = { r, c };
          bestD = d;
        }
      }
    }
    if (!best) return;
    const d = dirTo(here, best);
    if (d && !this.hero.to) this.hop(d);
    else if (!same(best, here)) this.goTo(best, !!this.round?.cubes.get(key(best.r, best.c))?.label);
  }

  private goTo(target: Cell, isPick: boolean) {
    const h = this.hero;
    const from = h.to ?? h.from;
    if (same(from, target)) {
      if (isPick) this.landEffects(target, true);
      return;
    }
    const round = this.round;
    const path =
      findPath(this.geom, from, target, (c) => !round || round.open(c)) ??
      findPath(this.geom, from, target, () => true);
    if (!path) return;
    h.path = path;
    h.auto = true;
    h.queued = null;
    this.pickTarget = isPick ? key(target.r, target.c) : null;
    if (!h.to) this.nextAutoHop();
  }
  private pickTarget: string | null = null;

  private nextAutoHop() {
    const h = this.hero;
    const nxt = h.path.shift();
    if (!nxt) {
      h.auto = false;
      return;
    }
    const d = dirTo(h.from, nxt);
    if (!d) {
      h.path = [];
      h.auto = false;
      return;
    }
    this.startHop(d, true);
  }

  private startHop(d: Dir, auto: boolean) {
    const h = this.hero;
    const to = step(h.from.r, h.from.c, d);
    h.to = to;
    h.t = 0;
    h.dur = auto ? AUTO_HOP : this.tune.hop;
    h.auto = auto;
    this.audio.jump();
  }

  /* ------------------------------ update ------------------------------ */

  private update(dt: number) {
    this.time += dt;
    this.updateFx(dt);
    if (this.mode === "demo") return this.updateDemo(dt);
    if (this.mode === "checkpoint" || this.mode === "over") return;
    if (this.round) for (const c of this.round.cubes.values()) c.flash = Math.max(0, c.flash - dt);

    if (this.mode === "dying") {
      this.modeT -= dt;
      if (this.modeT <= 0) this.respawn();
      return;
    }
    if (this.mode === "roundclear") {
      this.modeT -= dt;
      this.updateHero(dt);
      if (this.modeT <= 0) this.afterRound();
      return;
    }

    this.roundT += dt;
    this.invuln = Math.max(0, this.invuln - dt);
    this.updateHero(dt);
    if (this.mode !== "play") return;
    this.updateHazards(dt);
    this.checkHits();
    this.emitHud();
  }

  private updateDemo(dt: number) {
    const h = this.hero;
    if (h.to) {
      h.t += dt / 0.3;
      if (h.t >= 1) {
        h.from = h.to;
        h.to = null;
        const cube = this.round?.cubes.get(key(h.from.r, h.from.c));
        if (cube && cube.state === "plain") cube.state = "lit";
      }
      return;
    }
    this.demoT -= dt;
    if (this.demoT > 0) return;
    this.demoT = 0.45;
    const opts = neighbours(this.geom, h.from);
    const nxt = opts[Math.floor(Math.random() * opts.length)];
    h.to = nxt;
    h.t = 0;
  }

  private updateHero(dt: number) {
    const h = this.hero;
    h.bump = Math.max(0, h.bump - dt);
    if (h.fall) {
      const f = h.fall;
      f.t += dt;
      f.vy += 420 * dt;
      f.x += f.vx * dt;
      f.y += f.vy * dt;
      if (f.t > 0.9) this.loseLife("fell");
      return;
    }
    if (h.ride) {
      const r = h.ride;
      r.t += dt / 1.3;
      if (r.t >= 1) {
        h.ride = null;
        h.from = { r: 0, c: 0 };
        h.to = null;
        this.invuln = Math.max(this.invuln, 1);
        this.landEffects(h.from, false);
      }
      return;
    }
    if (!h.to) return;
    h.t += dt / h.dur;
    if (h.t < 1) return;
    const to = h.to;
    h.to = null;
    h.t = 0;
    const g = this.geom;
    if (onPyramid(g, to.r, to.c)) {
      h.from = to;
      const lastOfPath = h.auto && h.path.length === 0;
      const isPick = lastOfPath && this.pickTarget === key(to.r, to.c);
      if (!h.auto || lastOfPath) this.landEffects(to, isPick);
      else this.passOver(to);
      if (this.mode !== "play" && this.mode !== "roundclear") return;
      if (h.auto && h.path.length) this.nextAutoHop();
      else {
        h.auto = false;
        if (h.queued) {
          const q = h.queued;
          h.queued = null;
          this.startHop(q, false);
        }
      }
      return;
    }
    // Off the pyramid: a pad, a bump (K–2) or a fall.
    h.path = [];
    h.auto = false;
    h.queued = null;
    const pad = this.pads.find((p) => !p.used && same(this.padCell(p), to));
    if (pad) {
      pad.used = true;
      const pos = cellXY(g, to.r, to.c);
      h.ride = { pad, t: 0, x0: pos.x, y0: pos.y };
      this.audio.levelUp();
      this.floater("ZOOM!", pos.x, pos.y - 16, PAL.cyan);
      this.score += 50;
      if (this.glitch && hopDistance(g, at(this.glitch), h.from) <= 2) {
        const gp = this.moverXY(this.glitch);
        this.burst(gp.x, gp.y - 6, PAL.green, 20);
        this.glitch = null;
        this.glitchT = this.tune.glitchDelay;
        this.score += 500;
        this.floater("GLITCH FOOLED +500", gp.x, gp.y - 20, PAL.green);
      } else if (this.glitch) {
        this.glitch = null;
        this.glitchT = this.tune.glitchDelay / 2;
      }
      return;
    }
    if (this.band === "k2") {
      // Padded edges for early players: wobble back instead of falling.
      h.bump = 0.4;
      this.audio.blip();
      this.floater("EDGE!", cellXY(g, h.from.r, h.from.c).x, cellXY(g, h.from.r, h.from.c).y - 20, PAL.orange);
      this.cb.say("That's the edge. Hop onto a cube.", "info");
      return;
    }
    const a = cellXY(g, h.from.r, h.from.c), b = cellXY(g, to.r, to.c);
    h.fall = { x: b.x, y: b.y, vx: (b.x - a.x) * 1.2, vy: -40, t: 0 };
    this.audio.crash();
  }

  /** An auto-hop passing over a cube: blank cubes still light up; labels are skipped. */
  private passOver(cell: Cell) {
    const cube = this.round?.cubes.get(key(cell.r, cell.c));
    if (cube && cube.state === "plain") {
      cube.state = "lit";
      this.score += 10;
    }
  }

  private landEffects(cell: Cell, isPick: boolean) {
    const round = this.round;
    if (!round || this.mode !== "play") return;
    this.pickTarget = null;
    const res: LandResult = round.land(cell);
    const pos = cellXY(this.geom, cell.r, cell.c);
    switch (res.type) {
      case "lit":
        this.score += 25;
        this.burst(pos.x, pos.y, PAL.yellow, 5);
        break;
      case "none":
        break;
      case "correct": {
        this.streak++;
        const pts = 100 * Math.min(this.streak, 5);
        this.score += pts;
        this.audio.correct();
        this.burst(pos.x, pos.y, PAL.green, 14);
        this.floater(`+${pts}`, pos.x, pos.y - 16, PAL.green);
        this.msg = { text: `✔ ${res.label}`, ok: true };
        this.cb.say(spoken(res.label), "label");
        if (res.complete) this.roundClear();
        else this.refreshOptions();
        break;
      }
      case "notyet":
        if (isPick) round.noteMiss();
        this.streak = 0;
        this.audio.blip();
        this.msg = { text: res.why, ok: false };
        this.floater("NOT YET", pos.x, pos.y - 16, PAL.orange);
        this.cb.say(`${spoken(res.label)}. ${res.why}`, "wrong");
        if (isPick) this.refreshOptions();
        break;
      case "wrong":
        this.streak = 0;
        this.audio.wrong();
        this.burst(pos.x, pos.y, PAL.red, 10);
        if (this.shield > 0) {
          this.shield--;
          this.floater("-1 SHIELD", pos.x, pos.y - 16, PAL.red);
        } else this.floater("✘", pos.x, pos.y - 16, PAL.red);
        this.msg = { text: `✘ ${res.label}: ${res.why}`, ok: false };
        this.cb.say(`${spoken(res.label)}. ${res.why}`, "wrong");
        this.refreshOptions();
        break;
    }
    this.emitView();
    this.emitHud();
  }

  private refreshOptions() {
    this.options = this.round ? this.round.options() : [];
  }

  /** After two misses on one step, the right cube pulses (and the banner says so). */
  get hint(): boolean {
    return !!this.round && this.round.stepWrongs >= 2 && !this.round.complete;
  }

  private roundClear() {
    const round = this.round!;
    this.solved = true;
    this.mode = "roundclear";
    this.modeT = 2.2;
    this.hero.path = [];
    this.hero.auto = false;
    this.hero.queued = null;
    const clean = round.wrongs === 0;
    const bonus = 300 * this.level + (clean ? 200 : 0);
    const full = round.unlit() === 0;
    this.score += bonus + (full ? 1000 : 0) + this.pads.filter((p) => !p.used).length * 100;
    this.audio.levelUp();
    this.flashBanner(full ? `CLEAR! FULL COLOR +1000` : clean ? "PERFECT ROUND!" : "ROUND CLEAR!", PAL.green);
    const spec = round.spec;
    this.msg = { text: spec.kind === "build" ? spec.item.explain : `All the ${spec.rule.target.toLowerCase()} are colored!`, ok: true };
    this.cb.onRoundClear(spec, clean);
    this.cb.say(`${clean ? "Perfect!" : "You got it!"} ${spec.kind === "build" ? spec.item.tokens.map(spoken).join(" ") + ". " + spec.item.explain : ""}`, "clear");
    this.emitView();
  }

  private afterRound() {
    if (this.roundNo < ROUNDS_PER_LEVEL) {
      this.roundNo++;
      this.startRound();
      return;
    }
    this.mode = "checkpoint";
    this.balls = [];
    this.glitch = null;
    this.cb.onLevelClear(this.level);
  }

  resolveCheckpoint(correct: boolean) {
    if (this.mode !== "checkpoint") return;
    if (correct) {
      this.shield = MAX_SHIELD;
      this.score += 500 * this.level;
    } else this.shield = Math.min(MAX_SHIELD, this.shield + 1);
    this.level++;
    this.roundNo = 1;
    this.startRound();
  }

  /* ------------------------------ hazards ------------------------------ */

  private hazardSpeed() {
    return Math.max(0.6, Math.pow(0.93, this.level - 1));
  }

  private updateHazards(dt: number) {
    const t = this.tune;
    const g = this.geom;
    const speed = this.hazardSpeed();
    const heroAt = at(this.hero);

    // Zap-balls
    this.ballT -= dt;
    if (this.ballT <= 0 && this.roundT > t.grace) {
      this.ballT = t.ballEvery * speed * rand(0.8, 1.2);
      if (this.balls.length < t.maxBalls) {
        const c = Math.random() < 0.5 ? 0 : 1;
        this.balls.push({ from: { r: 1, c }, to: null, t: 0, dur: 0.35, wait: 0.5, drop: 1 });
      }
    }
    for (const b of this.balls) {
      if (b.drop > 0) {
        b.drop = Math.max(0, b.drop - dt / 0.5);
        continue;
      }
      if (b.to) {
        b.t += dt / b.dur;
        if (b.t >= 1) {
          b.from = b.to;
          b.to = null;
          b.t = 0;
          b.wait = t.ballHop * speed;
        }
        continue;
      }
      b.wait -= dt;
      if (b.wait <= 0) {
        b.to = step(b.from.r, b.from.c, Math.random() < 0.5 ? "dl" : "dr");
        b.t = 0;
      }
    }
    this.balls = this.balls.filter((b) => b.from.r < g.rows);

    // The Glitch
    if (this.level >= t.glitchFrom) {
      if (!this.glitch) {
        this.glitchT -= dt;
        if (this.glitchT <= 0) this.spawnGlitch(heroAt);
      } else {
        const gl = this.glitch;
        gl.frame += dt;
        if (gl.stun > 0) gl.stun -= dt;
        else if (gl.to) {
          gl.t += dt / gl.dur;
          if (gl.t >= 1) {
            gl.from = gl.to;
            gl.to = null;
            gl.t = 0;
            gl.wait = t.glitchHop * speed;
          }
        } else {
          gl.wait -= dt;
          if (gl.wait <= 0) {
            const target = cellXY(g, heroAt.r, heroAt.c);
            let best: Cell | null = null;
            let bestD = Infinity;
            for (const d of DIRS) {
              const n = step(gl.from.r, gl.from.c, d);
              if (!onPyramid(g, n.r, n.c)) continue;
              const p = cellXY(g, n.r, n.c);
              const dist = Math.hypot(p.x - target.x, p.y - target.y) + Math.random() * 4;
              if (dist < bestD) {
                bestD = dist;
                best = n;
              }
            }
            if (best) {
              gl.to = best;
              gl.t = 0;
              this.audio.blip();
            } else gl.wait = 0.5;
          }
        }
      }
    }
  }

  private spawnGlitch(heroAt: Cell) {
    const g = this.geom;
    const cands: Cell[] = [];
    for (let r = 1; r <= 2; r++) for (let c = 0; c <= r; c++) cands.push({ r, c });
    cands.sort((a, b) => hopDistance(g, b, heroAt) - hopDistance(g, a, heroAt));
    const from = cands[0];
    if (hopDistance(g, from, heroAt) < 2) {
      this.glitchT = 2;
      return;
    }
    this.glitch = { from, to: null, t: 0, dur: 0.3, wait: 1.2, stun: 0, frame: 0 };
    const p = cellXY(g, from.r, from.c);
    this.burst(p.x, p.y - 6, PAL.green, 12);
    this.floater("GLITCH!", p.x, p.y - 20, PAL.green);
  }

  private checkHits() {
    const h = this.hero;
    if (h.fall || h.ride || h.auto || this.invuln > 0) return;
    const heroAt = at(h);
    const hitBall = this.balls.find((b) => b.drop === 0 && same(at(b), heroAt));
    const hitGlitch = this.glitch && this.glitch.stun <= 0 && same(at(this.glitch), heroAt);
    if (!hitBall && !hitGlitch) return;
    const pos = this.heroXY();
    if (this.shield > 0) {
      this.shield--;
      this.invuln = 1.6;
      this.audio.explode();
      this.burst(pos.x, pos.y - 6, PAL.cyan, 16);
      this.floater("SHIELD!", pos.x, pos.y - 22, PAL.cyan);
      if (hitBall) this.balls = this.balls.filter((b) => b !== hitBall);
      if (hitGlitch && this.glitch) this.glitch.stun = 2.5;
      this.emitHud();
      return;
    }
    this.loseLife("hit");
  }

  /** Playtest hook and hazard hits: lose a life. */
  die() {
    if (this.mode === "play") this.loseLife("hit");
  }

  private loseLife(_why: "hit" | "fell") {
    if (this.mode !== "play") return;
    this.lives--;
    this.streak = 0;
    this.audio.crash();
    const p = this.heroXY();
    this.burst(p.x, p.y - 6, PAL.red, 24);
    this.hero.fall = null;
    this.hero.ride = null;
    this.hero.path = [];
    this.hero.auto = false;
    this.mode = "dying";
    this.modeT = 1.5;
    this.balls = [];
    this.glitch = null;
    this.emitHud();
    if (this.lives <= 0) {
      this.mode = "over";
      this.audio.gameOver();
      this.flashBanner("GAME OVER", PAL.red);
      this.cb.onGameOver();
    }
  }

  private respawn() {
    this.mode = "play";
    this.hero = this.freshHero();
    this.invuln = 2;
    this.roundT = 0;
    this.ballT = this.tune.grace;
    this.glitchT = this.tune.glitchDelay / 2;
    this.flashBanner("READY!", PAL.yellow);
    this.refreshOptions();
    this.emitView();
  }

  /* ------------------------------ view / hud ------------------------------ */

  private emitView() {
    const r = this.round;
    if (!r) return;
    this.cb.onView({
      id: specId(r.spec),
      spec: r.spec,
      built: [...r.built],
      found: r.found,
      total: r.total,
      options: this.options.map((o) => o.label),
      msg: this.msg,
      solved: this.solved,
      hint: this.hint,
    });
  }

  private emitHud() {
    const h: HudState = { score: this.score, lives: this.lives, shield: this.shield, level: this.level, streak: this.streak, round: this.roundNo };
    const k = JSON.stringify(h);
    if (k !== this.hudKey) {
      this.hudKey = k;
      this.cb.onHud(h);
    }
  }

  private flashBanner(text: string, color: string) {
    this.banner = { text, t: 1.8, color };
  }

  private floater(text: string, x: number, y: number, color: string) {
    this.floaters.push({ text, x, y, t: 1, color });
  }

  private burst(x: number, y: number, color: string, n: number) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, s = rand(20, 70);
      this.particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 20, life: rand(0.3, 0.7), color });
    }
  }

  private updateFx(dt: number) {
    for (const p of this.particles) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 120 * dt;
      p.life -= dt;
    }
    this.particles = this.particles.filter((p) => p.life > 0);
    for (const f of this.floaters) {
      f.t -= dt;
      f.y -= 14 * dt;
    }
    this.floaters = this.floaters.filter((f) => f.t > 0);
    if (this.banner) {
      this.banner.t -= dt;
      if (this.banner.t <= 0) this.banner = null;
    }
  }

  /* ------------------------------ drawing ------------------------------ */

  private moverXY(m: Mover, arc = ARC): { x: number; y: number } {
    const g = this.geom;
    const a = cellXY(g, m.from.r, m.from.c);
    if (!m.to) return a;
    const b = cellXY(g, m.to.r, m.to.c);
    const t = Math.min(1, m.t);
    // Hops rise first: a quick arc that peaks early when hopping up.
    return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t - Math.sin(Math.PI * t) * arc };
  }

  heroXY(): { x: number; y: number } {
    const h = this.hero;
    if (h.fall) return { x: h.fall.x, y: h.fall.y };
    if (h.ride) {
      const top = cellXY(this.geom, 0, 0);
      const t = h.ride.t;
      const e = t * t * (3 - 2 * t);
      return { x: h.ride.x0 + (top.x - h.ride.x0) * e, y: h.ride.y0 + (top.y - 24 - h.ride.y0) * e - Math.sin(Math.PI * t) * 20 };
    }
    return this.moverXY(h, h.auto ? 6 : ARC);
  }

  private text(s: string, x: number, y: number, color: string, scale = 1, shadow = true) {
    const ctx = this.ctx;
    if (shadow) {
      ctx.fillStyle = "#000";
      forEachPixel(s, (px, py) => ctx.fillRect(Math.round(x) + px * scale + 1, Math.round(y) + py * scale + 1, scale, scale));
    }
    ctx.fillStyle = color;
    forEachPixel(s, (px, py) => ctx.fillRect(Math.round(x) + px * scale, Math.round(y) + py * scale, scale, scale));
  }

  private textC(s: string, cx: number, y: number, color: string, scale = 1) {
    this.text(s, Math.round(cx - textWidth(s, scale) / 2), y, color, scale);
  }

  /** Filled diamond / parallelogram scanlines, so cube edges stay crisp. */
  private cube(cx: number, cy: number, top: string, left: string, right: string) {
    const ctx = this.ctx;
    const g = this.geom;
    const hw = g.w / 2, hh = g.th / 2;
    const x0 = Math.round(cx), y0 = Math.round(cy);
    // top face
    ctx.fillStyle = top;
    for (let dy = -hh; dy < hh; dy++) {
      const half = Math.round(hw * (1 - Math.abs(dy + 0.5) / hh));
      if (half > 0) ctx.fillRect(x0 - half, y0 + dy, half * 2, 1);
    }
    // side faces: each column drops sh pixels below the top face's lower edge
    for (let dx = -hw; dx < hw; dx++) {
      const edge = Math.round(hh * (1 - Math.abs(dx + 0.5) / hw));
      ctx.fillStyle = dx < 0 ? left : right;
      ctx.fillRect(x0 + dx, y0 + edge, 1, g.sh);
    }
    // rim highlight on the top edges
    ctx.fillStyle = "rgba(255,255,255,0.18)";
    for (let dx = -hw; dx < hw; dx++) {
      const edge = Math.round(hh * (1 - Math.abs(dx + 0.5) / hw));
      ctx.fillRect(x0 + dx, y0 - edge, 1, 1);
    }
  }

  private drawCube(cube: Cube) {
    const g = this.geom;
    const p = cellXY(g, cube.r, cube.c);
    const blink = Math.floor(this.time * 6) % 2 === 0;
    const hintOn = this.hint && this.mode === "play" && this.round!.targets().includes(cube);
    let top: string = PAL.blue;
    if (cube.state === "lit") top = PAL.yellow;
    else if (cube.state === "label") top = PAL.lightBlue;
    else if (cube.state === "done") top = PAL.green;
    if (cube.flash > 0 && blink) top = PAL.red;
    if (hintOn && blink) top = PAL.white;
    if (this.mode === "roundclear" && blink && cube.state !== "plain") top = PAL.white;
    this.cube(p.x, p.y, top, "#1a2b86", "#0e1a5c");
    if (!cube.label) return;
    // Label chip
    let scale = g.scale;
    if (textWidth(cube.label, scale) > g.chipMax) scale = 1;
    const tw = textWidth(cube.label, scale);
    const ch = 7 * scale;
    const x = Math.round(p.x - tw / 2), y = Math.round(p.y - ch / 2);
    const ctx = this.ctx;
    const done = cube.state === "done";
    ctx.fillStyle = done ? "#0d3a22" : cube.flash > 0 ? "#3a0d12" : PAL.navy;
    ctx.fillRect(x - 1, y - 1, tw + 2, ch + 2);
    this.text(cube.label, x, y, done ? PAL.green : cube.flash > 0 ? "#ffb0b4" : PAL.white, scale, false);
  }

  draw() {
    const ctx = this.ctx;
    ctx.drawImage(this.bg, 0, 0);
    const g = this.geom;

    // Pyramid
    if (this.round) {
      for (let r = 0; r < g.rows; r++) for (let c = 0; c <= r; c++) this.drawCube(this.round.cubes.get(key(r, c))!);
    } else {
      for (let r = 0; r < g.rows; r++) for (let c = 0; c <= r; c++) {
        const p = cellXY(g, r, c);
        this.cube(p.x, p.y, (r + c) % 3 === 0 ? PAL.lightBlue : PAL.blue, "#1a2b86", "#0e1a5c");
      }
    }

    // Escape pads
    for (const p of this.pads) {
      if (p.used && this.hero.ride?.pad !== p) continue;
      const pc = this.padCell(p);
      let { x, y } = cellXY(g, pc.r, pc.c);
      if (this.hero.ride?.pad === p) {
        const hp = this.heroXY();
        x = hp.x;
        y = hp.y + 2;
      } else y += Math.round(Math.sin(this.time * 3 + p.r) * 1.5);
      const cols = [PAL.red, PAL.yellow, PAL.cyan, PAL.green, PAL.purple];
      const k = Math.floor(this.time * 8);
      for (let i = 0; i < 5; i++) {
        ctx.fillStyle = cols[(i + k) % cols.length];
        const w = [6, 12, 14, 12, 6][i];
        ctx.fillRect(Math.round(x - w / 2), Math.round(y - 2 + i), w, 1);
      }
    }

    // Zap-balls
    for (const b of this.balls) {
      const p = this.moverXY(b, 8);
      const y = b.drop > 0 ? p.y - b.drop * 60 : p.y;
      ctx.drawImage(this.sprites.ball, Math.round(p.x - BALL_W / 2), Math.round(y - BALL_H - 1));
    }

    // Glitch
    if (this.glitch) {
      const gl = this.glitch;
      const p = this.moverXY(gl, 9);
      const spr = this.sprites.glitch[Math.floor(gl.frame * 4) % 2];
      if (gl.stun <= 0 || Math.floor(this.time * 10) % 2) ctx.drawImage(spr, Math.round(p.x - GLITCH_W / 2), Math.round(p.y - GLITCH_H - 1));
    }

    // Hero
    if (this.mode !== "dying" && this.mode !== "over") {
      const h = this.hero;
      const p = this.heroXY();
      const blink = this.invuln > 0 && Math.floor(this.time * 12) % 2 === 0 && !h.ride;
      if (!blink) {
        const air = !!h.to || !!h.fall || !!h.ride;
        const spr = air ? this.sprites.heroHop : this.sprites.heroStand;
        const wob = h.bump > 0 ? Math.round(Math.sin(h.bump * 40) * 2) : 0;
        ctx.drawImage(spr, Math.round(p.x - HERO_W / 2) + wob, Math.round(p.y - HERO_H - 1));
        if (h.auto) {
          ctx.fillStyle = "rgba(127,243,255,0.5)";
          ctx.fillRect(Math.round(p.x - 6), Math.round(p.y - 1), 12, 1);
        }
      }
    }

    // Particles
    for (const p of this.particles) {
      ctx.fillStyle = p.color;
      ctx.fillRect(Math.round(p.x), Math.round(p.y), 1, 1);
    }
    for (const f of this.floaters) this.textC(f.text, f.x, Math.round(f.y), f.color);

    // Top line: what has been built, or the rule and count
    if (this.round && this.mode !== "demo") this.drawTray();
    this.drawLegend();

    if (this.banner) {
      const b = this.banner;
      if (b.t > 0.3 || Math.floor(this.time * 10) % 2) this.textC(b.text, W / 2, 16, b.color, 2);
    }
    if (this.mode === "dying" && this.lives > 0) this.textC("OUCH!", W / 2, 16, PAL.red, 2);
  }

  private drawTray() {
    const r = this.round!;
    const spec = r.spec;
    let s: string;
    if (spec.kind === "build") {
      const rest = Math.max(0, r.total - r.built.length);
      s = [...r.built, ...Array(rest).fill("_")].join(" ");
    } else s = `COLOR ${spec.rule.target} ${r.found}/${r.total}`;
    let w = textWidth(s);
    while (w > W - 8 && s.length > 4) {
      s = ".." + s.slice(-Math.floor(s.length * 0.8));
      w = textWidth(s);
    }
    this.text(s, Math.round(W / 2 - w / 2), 3, spec.kind === "build" ? PAL.white : PAL.yellow);
  }

  /** Arrow keys are diagonal here: a little compass in the corner shows which is which. */
  private drawLegend() {
    const x = 4, y = 14;
    const k = PAL.yellow, d = PAL.dim;
    const pair = (a: string, b: string, px: number, py: number) => {
      this.text(a, px, py, k);
      this.text("=", px + 7, py, d);
      this.text(b, px + 12, py, PAL.lightBlue);
    };
    pair("←", "↖", x, y);
    pair("↑", "↗", x + 22, y);
    pair("↓", "↙", x, y + 8);
    pair("→", "↘", x + 22, y + 8);
  }

}

/** Labels are read without their punctuation marks. */
export function spoken(label: string): string {
  return label.replace(/["“”]/g, "").replace(/[.,;:!?]+$/g, "").replace(/^\(|\)$/g, "");
}
