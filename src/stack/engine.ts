import type { ChipAudio } from "@/kit/audio";
import type { Grade } from "@/kit/types";
import { ValueBag } from "./bag";
import {
  COLS, ROWS, bestPlacement, dropped, emptyGrid, evaluateRows, fits, lockPiece, minos, removeRows,
  resolveWilds, rotated, rowCells, spawnPiece, stackHeight, type Grid, type Piece,
} from "./board";
import { drawText, measure } from "./font";
import { q } from "./rational";
import { combine, equationSpeech, equationText, ruleFor, rowStatus, type CellValue, type Rule } from "./rules";

/* Logical arcade resolution; the canvas is scaled up with nearest-neighbour. */
export const W = 320;
export const H = 200;

const CW = 22; // cell size
const CH = 14;
const WELL_X = 94;
const WELL_Y = 12;
const TOT_X = WELL_X + COLS * CW + 6;

export const PAL = {
  navy: "#0a0f2e",
  panel: "#070a22",
  web: "#18225c",
  webHi: "#22307a",
  red: "#e3262f",
  blue: "#2456e8",
  sky: "#6ea0ff",
  yellow: "#ffd23f",
  white: "#f2f4ff",
  dim: "#6a78b8",
  green: "#5fff8a",
};

/** Block colours per tetromino: fill, light edge, dark edge, text. */
const KIND_COLORS: [string, string, string, string][] = [
  ["#6ea0ff", "#b8d0ff", "#3a5cb0", PAL.navy], // I
  ["#ffd23f", "#fff0a0", "#b08a10", PAL.navy], // O
  ["#e3262f", "#ff7a80", "#8a1018", "#ffffff"], // T
  ["#2456e8", "#6e90ff", "#10287a", "#ffffff"], // S
  ["#a0183a", "#e0507a", "#5a0820", "#ffffff"], // Z
  ["#d8dcf0", "#ffffff", "#8088b0", PAL.navy], // J
  ["#ff8a3d", "#ffc090", "#a04810", PAL.navy], // L
];

export type Action = "left" | "right" | "soft" | "rotate" | "rotateCcw" | "drop";
export type PowerUp = "blast" | "slow" | "wild";

export interface HudState {
  score: number;
  level: number;
  lines: number;
  goal: number;
  combo: number;
  perfects: number;
}

export interface RowStat {
  skill: string;
  perfect: number;
  full: number;
}

export interface EngineCallbacks {
  onHud(h: HudState): void;
  /** A new rule is in force (game start or new level). */
  onRule(r: Rule): void;
  /** Level goal reached; call `resolveCheckpoint` to continue. */
  onCheckpoint(level: number): void;
  onPerfect(equation: string, speech: string): void;
  onGameOver(): void;
}

type Mode = "demo" | "play" | "paused" | "checkpoint" | "banner" | "over";

interface Popup { text: string; x: number; y: number; t: number; life: number; color: string; scale: number }
interface Particle { x: number; y: number; vx: number; vy: number; life: number; color: string }

const WILD: CellValue = { label: "?", v: q(0), wild: true };
const DAS = 0.16;
const ARR = 0.05;
const LOCK_DELAY = 0.45;

export class StackEngine {
  private ctx: CanvasRenderingContext2D;
  private raf = 0;
  private last = 0;
  private frame = 0;
  private webBg: HTMLCanvasElement;

  mode: Mode = "demo";
  grade: Grade = "K";
  rule: Rule;
  private bag: ValueBag;
  private grid: Grid = emptyGrid();
  private piece: Piece | null = null;
  private next: { kind: number; vals: CellValue[] } | null = null;
  private kindBag: number[] = [];

  private held = new Set<Action>();
  private dasDir: 0 | -1 | 1 = 0;
  private dasT = 0;
  private fallT = 0;
  private lockT = 0;
  private lockResets = 0;
  private clearing: { rows: number[]; perfect: Set<number>; t: number } | null = null;
  private bannerT = 0;
  private overT = 0;
  private demoT = 0;
  private userPaused = false;
  /** Debug/test aid: the placement bot plays for you. */
  autoplay = false;
  private autoT = 0;

  score = 0;
  level = 1;
  lines = 0;
  totalLines = 0;
  combo = 0;
  perfects = 0;
  slowT = 0;
  private wildNext = false;
  rowStats: Record<string, RowStat> = {};

  private popups: Popup[] = [];
  private particles: Particle[] = [];

  constructor(canvas: HTMLCanvasElement, private audio: ChipAudio, private cb: EngineCallbacks) {
    canvas.width = W;
    canvas.height = H;
    this.ctx = canvas.getContext("2d")!;
    this.ctx.imageSmoothingEnabled = false;
    this.webBg = makeWeb(COLS * CW, ROWS * CH);
    this.rule = ruleFor(this.grade, 1);
    this.bag = new ValueBag(this.rule);
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

  get goal() {
    return this.rule.big ? 5 : 6;
  }

  private gravity() {
    const early = this.rule.big;
    const base = early ? 1.05 : 0.8;
    const min = early ? 0.25 : 0.11;
    const g = Math.max(min, base * Math.pow(0.86, this.level - 1));
    return this.slowT > 0 ? g * 1.9 : g;
  }

  private reset(grade: Grade) {
    this.grade = grade;
    this.level = 1;
    this.rule = ruleFor(grade, 1);
    this.bag.setRule(this.rule);
    this.grid = emptyGrid();
    this.piece = null;
    this.next = null;
    this.kindBag = [];
    this.clearing = null;
    this.popups = [];
    this.particles = [];
    this.score = 0;
    this.lines = 0;
    this.totalLines = 0;
    this.combo = 0;
    this.perfects = 0;
    this.slowT = 0;
    this.wildNext = false;
    this.rowStats = {};
    this.held.clear();
    this.dasDir = 0;
    this.fallT = 0;
    this.lockT = 0;
  }

  /** Starts a game; `first` is the level-1 rule already shown on the title screen. */
  newGame(grade: Grade, first?: Rule) {
    this.reset(grade);
    if (first && first.grade === grade && first.level === 1) {
      this.rule = first;
      this.bag.setRule(first);
    }
    this.mode = "banner";
    this.bannerT = 2;
    this.userPaused = false;
    this.cb.onRule(this.rule);
    this.emitHud();
  }

  /** Attract-mode demo for the title screen. */
  demo(grade: Grade, rule?: Rule) {
    this.reset(grade);
    if (rule && rule.grade === grade) {
      this.rule = rule;
      this.bag.setRule(rule);
    }
    this.mode = "demo";
  }

  setKey(a: Action, down: boolean) {
    if (!down) {
      this.held.delete(a);
      if ((a === "left" && this.dasDir === -1) || (a === "right" && this.dasDir === 1)) {
        this.dasDir = this.held.has("left") ? -1 : this.held.has("right") ? 1 : 0;
        this.dasT = 0;
      }
      return;
    }
    if (this.held.has(a)) return; // ignore OS key repeat
    this.held.add(a);
    if (this.mode !== "play" || !this.piece || this.clearing) return;
    if (a === "left" || a === "right") {
      this.dasDir = a === "left" ? -1 : 1;
      this.dasT = 0;
      this.shift(this.dasDir);
    } else if (a === "rotate" || a === "rotateCcw") {
      const t = rotated(this.grid, this.piece, a === "rotate" ? 1 : -1);
      if (t) {
        this.piece = t;
        this.onMoved();
        this.audio.tone(990, 0.04, "square", 0.15);
      }
    } else if (a === "drop") {
      this.hardDrop();
    }
  }

  releaseAllKeys() {
    this.held.clear();
    this.dasDir = 0;
  }

  /** Player-initiated pause. Returns true if now paused. */
  togglePause(force?: boolean) {
    const want = force ?? !(this.mode === "paused" && this.userPaused);
    if (want && (this.mode === "play" || this.mode === "banner")) {
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

  /** Called by the UI after the checkpoint transmission. */
  resolveCheckpoint(correct: boolean, power: PowerUp | null) {
    if (this.mode !== "checkpoint") return;
    if (correct) {
      this.score += 1000 * this.level;
      if (power === "blast") this.blast();
      if (power === "slow") this.slowT = 45;
      if (power === "wild") this.wildNext = true;
    }
    this.level++;
    this.lines = 0;
    this.rule = ruleFor(this.grade, this.level);
    this.bag.setRule(this.rule);
    this.next = null; // re-deal the preview for the new rule
    this.mode = "banner";
    this.bannerT = 2.2;
    this.releaseAllKeys();
    this.audio.levelUp();
    this.cb.onRule(this.rule);
    this.emitHud();
  }

  /** Stack height in rows (for the UI to pick a helpful power-up). */
  get height() {
    return stackHeight(this.grid);
  }

  /* ------------------------------ game logic ------------------------------ */

  private nextKind(): number {
    if (this.kindBag.length === 0) this.kindBag = [0, 1, 2, 3, 4, 5, 6].sort(() => Math.random() - 0.5);
    return this.kindBag.pop()!;
  }

  private dealNext() {
    const vals = this.bag.piece(this.grid);
    if (this.wildNext) {
      vals[Math.floor(Math.random() * vals.length)] = WILD;
      this.wildNext = false;
    }
    this.next = { kind: this.nextKind(), vals };
  }

  private spawn() {
    if (!this.next) this.dealNext();
    const n = this.next!;
    this.piece = spawnPiece(n.kind, n.vals);
    this.dealNext();
    this.fallT = 0;
    this.lockT = 0;
    this.lockResets = 0;
    this.autoT = 0;
    if (!fits(this.grid, this.piece)) this.gameOver();
  }

  private shift(dir: number) {
    if (!this.piece) return false;
    const t = { ...this.piece, x: this.piece.x + dir };
    if (!fits(this.grid, t)) return false;
    this.piece = t;
    this.onMoved();
    return true;
  }

  private onMoved() {
    if (this.piece && !fits(this.grid, { ...this.piece, y: this.piece.y + 1 }) && this.lockResets < 15) {
      this.lockT = 0;
      this.lockResets++;
    }
  }

  private hardDrop() {
    if (!this.piece) return;
    const t = dropped(this.grid, this.piece);
    this.score += 2 * (t.y - this.piece.y);
    this.piece = t;
    this.audio.tone(170, 0.09, "square", 0.3, 60);
    this.lock();
  }

  private lock() {
    const p = this.piece;
    if (!p) return;
    this.piece = null;
    const ok = lockPiece(this.grid, p);
    if (!ok) {
      this.gameOver();
      return;
    }
    resolveWilds(this.grid, this.rule);
    const res = evaluateRows(this.grid, this.rule);
    const rows = [...res.perfect, ...res.full].sort((a, b) => a - b);
    if (rows.length === 0) {
      this.combo = 0;
      this.audio.tone(220, 0.05, "triangle", 0.3);
      this.afterClear();
      return;
    }
    const demo = this.mode === "demo";
    if (res.perfect.length) {
      this.combo++;
      const mult = Math.min(this.combo, 5);
      // one header, then each row's equation underneath (replacing older popups)
      this.popups = [];
      const mid = WELL_X + (COLS * CW) / 2;
      const top = Math.max(WELL_Y + 40, WELL_Y + Math.min(...res.perfect) * CH - 14);
      const n = res.perfect.length;
      const head = n === 1 ? "PERFECT ROW!" : n === 2 ? "DOUBLE PERFECT!" : `${n}× PERFECT!`;
      this.popups.push({ text: head, x: mid, y: top, t: 0, life: 1.7, color: PAL.yellow, scale: 2 });
      res.perfect.forEach((r, i) => {
        const labels = rowCells(this.grid, r).map((c) => c.val.label);
        const eqText = `${equationText(this.rule, labels)} = ${this.rule.targetLabel}`;
        this.popups.push({ text: eqText, x: mid, y: top + 16 + i * 10, t: 0, life: 1.9, color: PAL.white, scale: 1 });
        if (!demo) this.cb.onPerfect(eqText, equationSpeech(this.rule, labels));
      });
      if (mult > 1) this.popups.push({ text: `COMBO ×${mult}`, x: mid, y: top - 18, t: 0, life: 1.5, color: PAL.red, scale: 2 });
      if (!demo) this.score += res.perfect.length * 400 * this.level * mult;
      this.audio.correct();
    } else {
      this.combo = 0;
      this.audio.checkpoint();
    }
    if (!demo) {
      this.score += [0, 100, 300, 500, 800][Math.min(4, res.full.length)] * this.level;
      this.lines += res.full.length + 2 * res.perfect.length;
      this.totalLines += res.full.length + res.perfect.length;
      this.perfects += res.perfect.length;
      const st = (this.rowStats[this.rule.standard] ??= { skill: this.rule.skill, perfect: 0, full: 0 });
      st.perfect += res.perfect.length;
      st.full += res.full.length;
    }
    for (const r of rows) this.burst(r, res.perfect.includes(r));
    this.clearing = { rows, perfect: new Set(res.perfect), t: 0.32 };
    this.emitHud();
  }

  private afterClear() {
    if (this.mode === "play" && this.lines >= this.goal) {
      this.mode = "checkpoint";
      this.releaseAllKeys();
      this.audio.checkpoint();
      this.cb.onCheckpoint(this.level);
      this.emitHud();
      return;
    }
    this.spawn();
    this.emitHud();
  }

  private blast() {
    const rows: number[] = [];
    for (let r = ROWS - 1; r >= 0 && rows.length < 2; r--) if (rowCells(this.grid, r).length) rows.push(r);
    for (const r of rows) this.burst(r, false);
    this.grid = removeRows(this.grid, rows);
    this.audio.explode();
  }

  private gameOver() {
    this.piece = null;
    if (this.mode === "demo") {
      this.grid = emptyGrid();
      return;
    }
    this.mode = "over";
    this.overT = 0;
    this.audio.stopMusic();
    this.audio.gameOver();
    this.emitHud();
    this.cb.onGameOver();
  }

  private burst(r: number, perfect: boolean) {
    const colors = perfect ? [PAL.yellow, PAL.red, PAL.white] : [PAL.sky, PAL.white];
    for (let i = 0; i < (perfect ? 40 : 18); i++) {
      this.particles.push({
        x: WELL_X + Math.random() * COLS * CW,
        y: WELL_Y + r * CH + Math.random() * CH,
        vx: (Math.random() - 0.5) * 120,
        vy: -30 - Math.random() * 80,
        life: 0.5 + Math.random() * 0.6,
        color: colors[i % colors.length],
      });
    }
  }

  private emitHud() {
    this.cb.onHud({ score: this.score, level: this.level, lines: this.lines, goal: this.goal, combo: this.combo, perfects: this.perfects });
  }

  /* ------------------------------ update ------------------------------ */

  private update(dt: number) {
    this.frame++;
    this.popups = this.popups.filter((p) => (p.t += dt) < p.life);
    this.particles = this.particles.filter((p) => {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 180 * dt;
      return (p.life -= dt) > 0;
    });

    if (this.mode === "over") {
      this.overT += dt;
      return;
    }
    if (this.mode === "paused" || this.mode === "checkpoint") return;
    if (this.mode === "banner") {
      this.bannerT -= dt;
      if (this.bannerT <= 0) {
        this.mode = "play";
        if (!this.piece && !this.clearing) this.spawn();
      }
      return;
    }

    if (this.clearing) {
      this.clearing.t -= dt;
      if (this.clearing.t <= 0) {
        this.grid = removeRows(this.grid, this.clearing.rows);
        this.clearing = null;
        this.afterClear();
      }
      return;
    }

    if (this.mode === "demo") {
      this.updateBot(dt, 0.3, 0.04);
      return;
    }

    // play
    if (this.slowT > 0) this.slowT = Math.max(0, this.slowT - dt);
    if (!this.piece) this.spawn();
    if (!this.piece) return;
    if (this.autoplay) {
      this.updateBot(dt, 0.12, 0);
      return;
    }

    if (this.dasDir !== 0) {
      this.dasT += dt;
      while (this.dasT >= DAS + ARR) {
        this.dasT -= ARR;
        this.shift(this.dasDir);
      }
    }

    const soft = this.held.has("soft");
    const interval = soft ? Math.min(0.035, this.gravity()) : this.gravity();
    this.fallT += dt;
    while (this.fallT >= interval && this.piece) {
      this.fallT -= interval;
      const t: Piece = { ...this.piece, y: this.piece.y + 1 };
      if (fits(this.grid, t)) {
        this.piece = t;
        if (soft) this.score += 1;
      } else break;
    }
    if (this.piece && !fits(this.grid, { ...this.piece, y: this.piece.y + 1 })) {
      this.lockT += dt;
      if (this.lockT >= (this.rule.big ? LOCK_DELAY * 1.5 : LOCK_DELAY)) this.lock();
    } else this.lockT = 0;
    if (this.frame % 6 === 0) this.emitHud();
  }

  /** Placement bot: used by the title-screen demo, and by tests via `autoplay`. */
  private updateBot(dt: number, think: number, fallStep: number) {
    if (!this.piece) {
      this.demoT += dt;
      if (this.demoT < 0.15) return;
      this.demoT = 0;
      this.spawn();
      if (!this.piece) return;
    }
    this.autoT += dt;
    if (this.autoT < think) return;
    const p = this.piece!;
    if (this.autoT - dt < think) {
      const mv = bestPlacement(this.grid, p, this.rule);
      if (mv) {
        const t = { ...p, rot: mv.rot, x: mv.x };
        if (fits(this.grid, t)) this.piece = t;
      }
    }
    if (fallStep === 0) {
      this.hardDrop();
      return;
    }
    this.fallT += dt;
    while (this.fallT >= fallStep && this.piece) {
      this.fallT -= fallStep;
      const t: Piece = { ...this.piece, y: this.piece.y + 1 };
      if (fits(this.grid, t)) this.piece = t;
      else {
        this.lock();
        break;
      }
    }
  }

  /* ------------------------------ drawing ------------------------------ */

  private draw() {
    const g = this.ctx;
    g.fillStyle = PAL.panel;
    g.fillRect(0, 0, W, H);

    // well frame: red outer, blue inner
    g.fillStyle = PAL.red;
    g.fillRect(WELL_X - 3, WELL_Y - 3, COLS * CW + 6, ROWS * CH + 6);
    g.fillStyle = PAL.blue;
    g.fillRect(WELL_X - 2, WELL_Y - 2, COLS * CW + 4, ROWS * CH + 4);
    g.drawImage(this.webBg, WELL_X, WELL_Y);

    // settled blocks
    const clearing = this.clearing;
    const flash = clearing ? Math.floor(clearing.t * 20) % 2 === 0 : false;
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const cell = this.grid[r][c];
        if (!cell) continue;
        const x = WELL_X + c * CW;
        const y = WELL_Y + r * CH;
        if (clearing?.rows.includes(r) && flash) {
          g.fillStyle = clearing.perfect.has(r) ? PAL.yellow : PAL.white;
          g.fillRect(x, y, CW, CH);
          continue;
        }
        this.drawCell(x, y, cell.kind, cell.val, this.mode === "over" && ROWS - r <= this.overT * 14);
      }
    }

    // ghost + active piece
    if (this.piece && (this.mode === "play" || this.mode === "demo" || this.mode === "paused")) {
      const ghost = dropped(this.grid, this.piece);
      if (ghost.y !== this.piece.y) {
        g.fillStyle = KIND_COLORS[ghost.kind][0];
        for (const { r, c } of minos(ghost)) {
          if (r < 0) continue;
          const x = WELL_X + c * CW;
          const y = WELL_Y + r * CH;
          g.globalAlpha = 0.45;
          g.fillRect(x, y, CW, 1);
          g.fillRect(x, y + CH - 1, CW, 1);
          g.fillRect(x, y, 1, CH);
          g.fillRect(x + CW - 1, y, 1, CH);
          g.globalAlpha = 1;
        }
      }
      for (const { r, c, i } of minos(this.piece)) {
        if (r < 0) continue;
        this.drawCell(WELL_X + c * CW, WELL_Y + r * CH, this.piece.kind, this.piece.vals[i], false);
      }
    }

    this.drawTotals();
    this.drawPanel();

    for (const p of this.particles) {
      g.fillStyle = p.color;
      g.fillRect(Math.round(p.x), Math.round(p.y), 2, 2);
    }
    for (const p of this.popups) {
      const rise = Math.round(p.t * 10);
      if (p.t > p.life - 0.3 && this.frame % 4 < 2) continue;
      const w = measure(p.text, p.scale);
      const sc = w > W - 8 ? 1 : p.scale;
      const cx = Math.max(4 + measure(p.text, sc) / 2, Math.min(W - 4 - measure(p.text, sc) / 2, p.x));
      const y = Math.max(2, p.y - rise);
      const bw = measure(p.text, sc) + 6;
      g.fillStyle = "rgba(10,15,46,0.85)";
      g.fillRect(Math.round(cx - bw / 2), y - 3, bw, 5 * sc + 6);
      drawText(g, p.text, cx, y, p.color, { scale: sc, align: "center", shadow: "#000", accent: PAL.yellow });
    }

    if (this.mode === "banner") this.drawBanner();
    if (this.mode === "over" && this.overT > 1) {
      const cx = WELL_X + (COLS * CW) / 2;
      g.fillStyle = "rgba(10,15,46,0.85)";
      g.fillRect(WELL_X, WELL_Y + 70, COLS * CW, 34);
      drawText(g, "GAME OVER", cx, WELL_Y + 78, PAL.red, { scale: 2, align: "center", shadow: "#000" });
    }
  }

  private drawCell(x: number, y: number, kind: number, val: CellValue, grey: boolean) {
    const g = this.ctx;
    let [fill, light, dark, text] = KIND_COLORS[kind];
    if (val.wild) {
      const hues = [PAL.red, PAL.yellow, PAL.sky, PAL.white];
      fill = hues[(this.frame >> 3) % hues.length];
      light = "#ffffff";
      dark = PAL.navy;
      text = PAL.navy;
    }
    if (grey) [fill, light, dark, text] = ["#3a4068", "#5a6090", "#20243c", "#9aa0c8"];
    g.fillStyle = fill;
    g.fillRect(x, y, CW, CH);
    g.fillStyle = light;
    g.fillRect(x, y, CW, 1);
    g.fillRect(x, y, 1, CH);
    g.fillStyle = dark;
    g.fillRect(x, y + CH - 1, CW, 1);
    g.fillRect(x + CW - 1, y, 1, CH);
    let scale = this.rule.big ? 2 : 1;
    if (measure(val.label, scale) > CW - 2) scale = 1;
    const w = measure(val.label, scale);
    const shadow = text === "#ffffff" ? PAL.navy : null;
    // sub/superscripts in an accent colour so log₂8 never reads as "log28"
    const accent = grey ? text : text === "#ffffff" ? PAL.yellow : "#c0101c";
    const dy = /\[/.test(val.label) ? -1 : /\{/.test(val.label) ? 1 : 0;
    drawText(g, val.label, Math.round(x + (CW - w) / 2), Math.round(y + (CH - 5 * scale) / 2) + dy, text, { scale, shadow, accent });
  }

  private drawTotals() {
    const g = this.ctx;
    drawText(g, "ROW", TOT_X, 3, PAL.dim);
    drawText(g, this.rule.op === "×" ? "×" : "+", TOT_X + 15, 3, PAL.dim);
    for (let r = 0; r < ROWS; r++) {
      const cells = rowCells(this.grid, r);
      if (!cells.length || this.clearing?.rows.includes(r)) continue;
      const vals = cells.map((c) => c.val.v);
      const status = rowStatus(this.rule, vals);
      const total = this.rule.fmt(combine(this.rule.op, vals));
      const color = status === "over" ? PAL.red : status === "exact" ? PAL.green : this.rule.monotone ? PAL.white : "#ffb070";
      let scale = this.rule.big ? 2 : 1;
      if (measure(total, scale) > W - TOT_X - 2) scale = 1;
      const y = WELL_Y + r * CH + Math.round((CH - 5 * scale) / 2);
      g.fillStyle = color;
      g.fillRect(TOT_X - 4, WELL_Y + r * CH + CH / 2 - 1, 2, 2);
      drawText(g, total, TOT_X, y, color, { scale });
      if (status === "over" && scale === 1 && measure(total) < 36) drawText(g, "OVER", W - 2, y, PAL.red, { align: "right" });
    }
  }

  private drawPanel() {
    const g = this.ctx;
    const rule = this.rule;
    // NEXT preview
    drawText(g, "NEXT", 4, 3, PAL.dim);
    g.fillStyle = PAL.navy;
    g.fillRect(1, 11, 90, 34);
    g.fillStyle = "#1c2660";
    g.fillRect(1, 11, 90, 1);
    g.fillRect(1, 44, 90, 1);
    if (this.next && this.mode !== "over") {
      const p: Piece = { kind: this.next.kind, rot: 0, x: 0, y: 0, vals: this.next.vals };
      const ms = minos(p);
      const minR = Math.min(...ms.map((m) => m.r));
      const maxR = Math.max(...ms.map((m) => m.r));
      const minC = Math.min(...ms.map((m) => m.c));
      const maxC = Math.max(...ms.map((m) => m.c));
      const ox = 2 + Math.round((88 - (maxC - minC + 1) * CW) / 2);
      const oy = 14 + Math.round((28 - (maxR - minR + 1) * CH) / 2);
      for (const m of ms) this.drawCell(ox + (m.c - minC) * CW, oy + (m.r - minR) * CH, p.kind, p.vals[m.i], false);
    }

    // TARGET
    const cx = 46;
    drawText(g, rule.op === "×" ? "PRODUCT" : "TARGET", cx, 51, PAL.dim, { align: "center" });
    let ts = 3;
    while (ts > 1 && measure(rule.targetLabel, ts) > 86) ts--;
    const pulse = this.frame % 60 < 30 ? PAL.yellow : "#ffe890";
    drawText(g, rule.targetLabel, cx, 60, pulse, { scale: ts, align: "center", shadow: PAL.red });
    drawText(g, rule.title, cx, 81, PAL.white, { align: "center" });
    rule.context.forEach((line, i) => {
      drawText(g, line, cx, 92 + i * 10, PAL.sky, { align: "center", accent: PAL.yellow });
    });

    // level + progress
    const ly = 112;
    drawText(g, `LEVEL ${this.level}`, 4, ly, PAL.white);
    drawText(g, `${Math.min(this.lines, this.goal)}/${this.goal}`, 88, ly, PAL.dim, { align: "right" });
    g.fillStyle = "#1c2660";
    g.fillRect(4, ly + 8, 84, 4);
    g.fillStyle = PAL.red;
    g.fillRect(4, ly + 8, Math.round((84 * Math.min(this.lines, this.goal)) / this.goal), 4);
    drawText(g, "TO TRANSMISSION", 4, ly + 15, PAL.dim);

    let y = ly + 28;
    drawText(g, `PERFECT ${this.perfects}`, 4, y, PAL.yellow);
    y += 10;
    if (this.combo > 1) {
      drawText(g, `COMBO ×${Math.min(this.combo, 5)}`, 4, y, this.frame % 20 < 10 ? PAL.red : PAL.yellow);
      y += 10;
    }
    if (this.slowT > 0) {
      drawText(g, `SLOW-MO ${Math.ceil(this.slowT)}`, 4, y, PAL.sky);
      y += 10;
    }
    const wildComing = this.wildNext || this.next?.vals.some((v) => v.wild) || this.piece?.vals.some((v) => v.wild);
    if (wildComing) {
      drawText(g, "WILD ? CELL", 4, y, PAL.green);
      y += 10;
    }
    if (this.mode === "demo") drawText(g, "DEMO", 4, 188, this.frame % 60 < 30 ? PAL.red : PAL.dim);
  }

  private drawBanner() {
    const g = this.ctx;
    const cx = WELL_X + (COLS * CW) / 2;
    const top = WELL_Y + 44;
    g.fillStyle = "rgba(10,15,46,0.9)";
    g.fillRect(WELL_X - 3, top, COLS * CW + 6, 64);
    g.fillStyle = PAL.red;
    g.fillRect(WELL_X - 3, top, COLS * CW + 6, 2);
    g.fillRect(WELL_X - 3, top + 62, COLS * CW + 6, 2);
    drawText(g, `LEVEL ${this.level}`, cx, top + 8, PAL.yellow, { scale: 2, align: "center", shadow: PAL.red });
    const t = this.rule.title;
    drawText(g, t, cx, top + 26, PAL.white, { scale: measure(t, 2) <= COLS * CW - 4 ? 2 : 1, align: "center" });
    this.rule.context.forEach((c, i) => drawText(g, c, cx, top + 44 + i * 9, PAL.sky, { align: "center" }));
  }
}

/* A spider-web pattern for the well background (pixel lines, drawn once). */
function makeWeb(w: number, h: number): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const g = c.getContext("2d")!;
  g.fillStyle = PAL.navy;
  g.fillRect(0, 0, w, h);
  const cx = w / 2;
  const cy = h * 0.38;
  const spokes = 12;
  const pts = (rad: number) =>
    Array.from({ length: spokes }, (_, i) => {
      const a = (i / spokes) * Math.PI * 2 + 0.13;
      return [cx + Math.cos(a) * rad, cy + Math.sin(a) * rad] as [number, number];
    });
  const line = (x0: number, y0: number, x1: number, y1: number, col: string) => {
    g.fillStyle = col;
    const n = Math.ceil(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)));
    for (let i = 0; i <= n; i++) g.fillRect(Math.round(x0 + ((x1 - x0) * i) / n), Math.round(y0 + ((y1 - y0) * i) / n), 1, 1);
  };
  for (const [x, y] of pts(Math.max(w, h))) line(cx, cy, x, y, PAL.web);
  for (let rad = 12; rad < Math.max(w, h); rad += 14) {
    const p = pts(rad);
    for (let i = 0; i < spokes; i++) {
      const [x0, y0] = p[i];
      const [x1, y1] = p[(i + 1) % spokes];
      // sag each strand slightly toward the centre
      const mx = (x0 + x1) / 2 + (cx - (x0 + x1) / 2) * 0.12;
      const my = (y0 + y1) / 2 + (cy - (y0 + y1) / 2) * 0.12;
      line(x0, y0, mx, my, rad % 28 === 12 ? PAL.webHi : PAL.web);
      line(mx, my, x1, y1, rad % 28 === 12 ? PAL.webHi : PAL.web);
    }
  }
  return c;
}
