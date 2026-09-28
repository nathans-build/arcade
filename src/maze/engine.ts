/*
 * Maze Muncher engine: runs the MazeSim on a requestAnimationFrame loop, draws it on the
 * 320×200 canvas (walls, dots, lettered pellets and their labels, critters, hero, pop-ups)
 * and relays what happens to the React layer. Also plays the title-screen demo.
 */
import type { ChipAudio } from "../kit/audio";
import { QuestionDeck } from "../kit/deck";
import type { DealtQuestion, Grade } from "../kit/types";
import { drawText, LINE_H, measure } from "./font";
import { BADGE, H, PAD, TILE, W, geometry, labelBox, labelLayout, tileCenter, type Geometry, type LabelLayout, type Rect } from "./labels";
import type { Dir, Maze } from "./maze";
import { CRITTERS, ITEM_NAMES, MazeSim, type SimEvent } from "./sim";
import { CRITTER_ART, DIZZY_COLORS, HERO_COLORS, HERO_FRAMES, HERO_PUPILS, ITEM_ART, PUFF, spriteCanvas } from "./sprites";

export { W, H };

export const LETTER_COLORS = ["#e3262f", "#6ea0ff", "#43d664", "#ffd23f"];
const LETTER_INK = ["#ffffff", "#0a0f2e", "#0a0f2e", "#0a0f2e"];

const COL = {
  bg: "#0a0f2e",
  panel: "#060a22",
  wall: "#0f1a5a",
  wallEdge: "#3d6cff",
  wallDot: "#1b2a7a",
  door: "#ff8fc8",
  dot: "#ffe9b0",
  white: "#f2f4ff",
  yellow: "#ffd23f",
  red: "#e3262f",
  green: "#5fff8a",
  cyan: "#6ea0ff",
  dim: "#6a78b8",
};

const PELLET: string[] = ["..###..", ".#####.", "#######", "#######", "#######", ".#####.", "..###.."];

export interface HudState {
  score: number;
  lives: number;
  level: number;
  streak: number;
  mult: number;
  mazeName: string;
  dotsLeft: number;
  dotsTotal: number;
  /** 0–1 of dizzy time left (after a right answer), or of fired-up time (after a wrong one). */
  power: number;
  rage: number;
}

export interface EngineCallbacks {
  onHud: (h: HudState) => void;
  /** A new question for the pellets (playing only). */
  nextQuestion: () => DealtQuestion;
  onQuestion: (q: DealtQuestion) => void;
  onAnswer: (index: number, correct: boolean, q: DealtQuestion) => void;
  onPowerEnd: () => void;
  onMazeStart: (level: number, name: string) => void;
  onMazeClear: (level: number) => void;
  onGameOver: () => void;
}

interface Popup {
  x: number;
  y: number;
  text: string;
  color: string;
  t: number;
}

export class MazeEngine {
  private ctx: CanvasRenderingContext2D;
  sim: MazeSim;
  playing = false;
  paused = false;
  q: DealtQuestion | null = null;
  private demoDeck: QuestionDeck | null = null;
  private labels: { key: string; lays: LabelLayout[]; boxes: Rect[] } | null = null;
  private mazeImg = new Map<string, HTMLCanvasElement>();
  private popups: Popup[] = [];
  private raf = 0;
  private last = 0;
  private time = 0;
  private stateT = 0;
  private lastHud = "";
  private dotTone = 0;
  private answerFlash = 0;

  constructor(canvas: HTMLCanvasElement, private audio: ChipAudio, private cb: EngineCallbacks) {
    canvas.width = W;
    canvas.height = H;
    this.ctx = canvas.getContext("2d")!;
    this.ctx.imageSmoothingEnabled = false;
    this.sim = new MazeSim("3", { demo: true, ask: () => this.dealDemo() });
  }

  start() {
    const loop = (now: number) => {
      const dt = this.last ? (now - this.last) / 1000 : 0;
      this.last = now;
      this.frame(Math.max(0, Math.min(0.05, dt)));
      this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
  }

  stop() {
    cancelAnimationFrame(this.raf);
  }

  /** Title-screen demo: the hero munches on its own. */
  demo(grade: Grade) {
    this.playing = false;
    this.paused = false;
    this.demoDeck = new QuestionDeck(grade, "mixed", { quickOnly: true });
    this.sim = new MazeSim(grade, { demo: true, ask: () => this.dealDemo() });
    this.sim.phaseT = 0.5;
    this.sim.events.length = 0;
    this.popups = [];
  }

  newGame(grade: Grade) {
    this.playing = true;
    this.paused = false;
    this.popups = [];
    this.lastHud = "";
    this.sim = new MazeSim(grade, { ask: () => this.deal() });
    this.drain();
  }

  private deal(): number {
    const q = this.cb.nextQuestion();
    this.q = q;
    this.labels = null;
    this.cb.onQuestion(q);
    return q.answer;
  }

  private dealDemo(): number {
    const q = (this.demoDeck ??= new QuestionDeck("3", "mixed", { quickOnly: true })).draw();
    this.q = q;
    this.labels = null;
    return q.answer;
  }

  setWant(d: Dir) {
    if (!this.playing || this.paused) return;
    this.sim.setWant(d);
  }

  /** Lock in answer i (key, banner tap or pellet tap): counts as eating that pellet. */
  choose(i: number): boolean {
    if (!this.playing || this.paused) return false;
    const ok = this.sim.answer(i, true);
    if (ok) this.drain();
    return ok;
  }

  /** Canvas tap in logical pixels: a pellet or its label picks that answer. */
  tapAt(x: number, y: number): boolean {
    if (!this.playing || this.paused || this.sim.qPhase !== "ask") return false;
    const g = geometry(this.sim.maze);
    const lab = this.labelData(g);
    for (let i = 0; i < 4; i++) {
      if (!this.sim.pelletLive[i]) continue;
      const b = lab?.boxes[i];
      const p = tileCenter(g, this.sim.maze.pellets[i].x, this.sim.maze.pellets[i].y);
      const inBox = b && x >= b.x - 2 && x <= b.x + b.w + 2 && y >= b.y - 2 && y <= b.y + b.h + 2;
      const onPellet = Math.abs(x - p.x) <= 8 && Math.abs(y - p.y) <= 8;
      if (inBox || onPellet) return this.choose(i);
    }
    return false;
  }

  resolveCheckpoint(correct: boolean) {
    this.sim.nextMaze(correct);
    this.drain();
  }

  togglePause(force?: boolean): boolean {
    if (!this.playing) return false;
    this.paused = force ?? !this.paused;
    return this.paused;
  }

  get score() {
    return this.sim.score;
  }

  /* ---------------------------------------------------------------- loop */

  private frame(dt: number) {
    if (!this.paused) {
      this.time += dt;
      this.stateT += dt;
      this.sim.step(dt);
      this.drain();
      this.popups = this.popups.filter((p) => (p.t -= dt) > 0);
      this.answerFlash = Math.max(0, this.answerFlash - dt);
    }
    this.pushHud();
    this.draw();
  }

  private drain() {
    const sim = this.sim;
    const evs = sim.events.splice(0);
    const g = geometry(sim.maze);
    for (const e of evs) this.handle(e, g);
  }

  private handle(e: SimEvent, g: Geometry) {
    const sim = this.sim;
    const a = this.audio;
    const sound = this.playing;
    switch (e.type) {
      case "dot":
        if (sound) {
          this.dotTone ^= 1;
          a.tone(this.dotTone ? 520 : 690, 0.045, "square", 0.1);
        }
        break;
      case "answer":
        this.answerFlash = 0.8;
        if (sound) (e.correct ? a.correct() : a.wrong());
        if (this.playing && this.q) this.cb.onAnswer(e.index, e.correct, this.q);
        break;
      case "eat": {
        const p = tileCenter(g, e.x, e.y);
        this.popups.push({ x: p.x, y: p.y - 6, text: String(e.points), color: COL.cyan, t: 1 });
        if (sound) a.tone(300, 0.25, "square", 0.3, 1400);
        break;
      }
      case "item": {
        const p = tileCenter(g, e.x, e.y);
        this.popups.push({ x: p.x, y: p.y - 6, text: String(e.points), color: COL.yellow, t: 1.2 });
        if (sound) a.checkpoint();
        break;
      }
      case "itemShow":
        break;
      case "death":
        this.stateT = 0;
        if (sound) a.explode();
        break;
      case "powerEnd":
        if (this.playing) this.cb.onPowerEnd();
        break;
      case "cleared":
        if (this.playing) {
          if (sound) a.levelUp();
          this.cb.onMazeClear(sim.level);
        } else sim.nextMaze(false);
        break;
      case "mazeReady":
        this.stateT = 0;
        if (this.playing) this.cb.onMazeStart(e.level, sim.maze.name);
        break;
      case "over":
        if (this.playing) {
          a.gameOver();
          this.cb.onGameOver();
        }
        break;
      case "question":
        break;
    }
  }

  private pushHud() {
    const s = this.sim;
    const t = s.tuning;
    const h: HudState = {
      score: s.score,
      lives: s.lives,
      level: s.level,
      streak: s.streak,
      mult: s.multiplier,
      mazeName: s.maze.name,
      dotsLeft: s.dotsLeft,
      dotsTotal: s.dotsTotal,
      power: s.qPhase === "power" ? Math.max(0, s.qT / t.frightTime) : 0,
      rage: s.qPhase === "rage" ? Math.max(0, s.qT / t.rageTime) : 0,
    };
    h.power = Math.round(h.power * 20) / 20;
    h.rage = Math.round(h.rage * 20) / 20;
    const k = JSON.stringify(h);
    if (k !== this.lastHud) {
      this.lastHud = k;
      if (this.playing) this.cb.onHud(h);
    }
  }

  /* ---------------------------------------------------------------- drawing */

  private labelData(g: Geometry) {
    const q = this.q;
    if (!q) return null;
    const m = this.sim.maze;
    const key = `${q.id}|${m.name}|${q.choices.join("|")}`;
    if (!this.labels || this.labels.key !== key) {
      const scale = this.sim.tuning.labelScale;
      const lays = q.choices.map((c, i) => labelLayout(c, g, m.pellets[i].y, i, scale));
      const boxes = lays.map((l, i) => labelBox(g, m.pellets[i].y, i, l));
      this.labels = { key, lays, boxes };
    }
    return this.labels;
  }

  private mazeImage(m: Maze, g: Geometry): HTMLCanvasElement {
    let c = this.mazeImg.get(m.name);
    if (c) return c;
    c = document.createElement("canvas");
    c.width = g.mazeW;
    c.height = g.mazeH;
    const x = c.getContext("2d")!;
    const wall = (tx: number, ty: number) => ty < 0 || ty >= m.rows || tx < 0 || tx >= m.cols || m.cells[ty][tx] === "#";
    for (let ty = 0; ty < m.rows; ty++) {
      for (let tx = 0; tx < m.cols; tx++) {
        const cell = m.cells[ty][tx];
        const px = tx * TILE;
        const py = ty * TILE;
        if (cell === "#") {
          x.fillStyle = COL.wall;
          x.fillRect(px, py, TILE, TILE);
          if ((tx + ty) % 2 === 0) {
            x.fillStyle = COL.wallDot;
            x.fillRect(px + 3, py + 3, 2, 2);
          }
          x.fillStyle = COL.wallEdge;
          const tunnelEdge = (dx: number) => m.tunnelRows.includes(ty) === false && (tx + dx < 0 || tx + dx >= m.cols);
          if (!wall(tx, ty - 1) && ty - 1 >= 0) x.fillRect(px, py, TILE, 1);
          if (!wall(tx, ty + 1) && ty + 1 < m.rows) x.fillRect(px, py + TILE - 1, TILE, 1);
          if (!wall(tx - 1, ty) && !tunnelEdge(-1)) x.fillRect(px, py, 1, TILE);
          if (!wall(tx + 1, ty) && !tunnelEdge(1)) x.fillRect(px + TILE - 1, py, 1, TILE);
        } else if (cell === "=") {
          x.fillStyle = COL.door;
          x.fillRect(px, py + 3, TILE, 2);
        } else if (cell === "p") {
          x.fillStyle = "#0b1238";
          x.fillRect(px, py, TILE, TILE);
        }
      }
    }
    this.mazeImg.set(m.name, c);
    return c;
  }

  private draw() {
    const ctx = this.ctx;
    const sim = this.sim;
    const m = sim.maze;
    const g = geometry(m);
    ctx.fillStyle = COL.panel;
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = COL.bg;
    ctx.fillRect(g.ox, 0, g.mazeW, H);

    // Maze (flashes when cleared)
    const flashing = sim.phase === "cleared" || sim.phase === "waiting";
    ctx.save();
    if (flashing && Math.floor(this.time * 6) % 2 === 0) ctx.filter = "brightness(2.2) saturate(0.3)";
    ctx.drawImage(this.mazeImage(m, g), g.ox, g.oy);
    ctx.restore();

    // Tunnel mouths
    for (const ty of m.tunnelRows) {
      const y = g.oy + ty * TILE + 2;
      drawText(ctx, "◀", g.ox - 5, y, COL.dim);
      drawText(ctx, "▶", g.ox + g.mazeW + 2, y, COL.dim);
    }

    // Dots
    ctx.fillStyle = COL.dot;
    for (let i = 0; i < sim.dots.length; i++) {
      if (!sim.dots[i]) continue;
      const tx = i % m.cols;
      const ty = Math.floor(i / m.cols);
      ctx.fillRect(g.ox + tx * TILE + 3, g.oy + ty * TILE + 3, 2, 2);
    }

    this.drawPellets(g);
    this.drawLabels(g);

    // Bonus item
    if (sim.item && (sim.item.t > 2 || Math.floor(this.time * 8) % 2 === 0)) {
      const art = ITEM_ART[sim.item.kind];
      const p = tileCenter(g, m.item.x, m.item.y);
      ctx.drawImage(spriteCanvas(`item${sim.item.kind}`, art.grid, art.colors), p.x - 4, p.y - 4);
    }

    // Sprites, clipped to the maze so tunnel wraps look right
    ctx.save();
    ctx.beginPath();
    ctx.rect(g.ox, g.oy, g.mazeW, g.mazeH);
    ctx.clip();
    for (const c of sim.critters) this.drawCritter(g, c.id, c);
    this.drawHero(g);
    ctx.restore();

    // Pop-ups
    for (const p of this.popups) drawText(ctx, p.text, p.x, p.y - (1 - p.t) * 6, p.color, { align: "center", shadow: "#000" });

    // Centre messages (on the item row, below the pen)
    const my = g.oy + m.item.y * TILE + 1;
    const cx = g.ox + g.mazeW / 2;
    if (sim.phase === "ready") {
      if (this.stateT < 2 && sim.level > 0) this.say(`MAZE ${sim.level}: ${m.name}`, cx, g.oy + m.exit.y * TILE + 1, COL.cyan);
      this.say("READY!", cx, my, COL.yellow);
    } else if (sim.phase === "cleared" || sim.phase === "waiting") {
      this.say("MAZE CLEAR!", cx, my, COL.green);
    } else if (sim.phase === "over") {
      this.say("GAME OVER", cx, my, COL.red);
    }
    if (!this.playing) {
      if (Math.floor(this.time * 2) % 2 === 0) this.say("DEMO", cx, g.oy + m.exit.y * TILE + 1, COL.dim);
    }
    if (this.paused) {
      ctx.fillStyle = "rgba(5,8,24,0.55)";
      ctx.fillRect(0, 0, W, H);
      drawText(ctx, "PAUSED", W / 2, H / 2 - 5, COL.yellow, { align: "center", scale: 2, shadow: "#000" });
    }
  }

  /** Centred message on a dark strip so it reads over the maze. */
  private say(text: string, x: number, y: number, color: string) {
    const w = measure(text) + 4;
    this.ctx.fillStyle = "rgba(5,8,24,0.85)";
    this.ctx.fillRect(Math.round(x - w / 2), y - 2, w, 9);
    drawText(this.ctx, text, x, y, color, { align: "center" });
  }

  private drawPellets(g: Geometry) {
    const ctx = this.ctx;
    const sim = this.sim;
    const m = sim.maze;
    for (let i = 0; i < 4; i++) {
      const live = sim.pelletLive[i];
      const reveal = sim.revealIdx === i;
      const picked = sim.pickedIdx === i && this.answerFlash > 0;
      if (!live && !reveal && !picked) continue;
      const p = tileCenter(g, m.pellets[i].x, m.pellets[i].y);
      let col = LETTER_COLORS[i];
      let ink = LETTER_INK[i];
      if (reveal) {
        if (Math.floor(this.time * 5) % 2 === 0) continue;
        col = COL.green;
        ink = "#0a0f2e";
      } else if (picked && !live) {
        col = i === sim.answerIdx ? COL.green : COL.red;
        ink = "#0a0f2e";
      }
      const pulse = live && Math.floor(this.time * 3) % 2 === 0;
      if (pulse) {
        ctx.fillStyle = "rgba(255,255,255,0.35)";
        ctx.fillRect(p.x - 5, p.y - 5, 10, 10);
      }
      ctx.fillStyle = col;
      PELLET.forEach((row, y) => {
        for (let x = 0; x < row.length; x++) if (row[x] === "#") ctx.fillRect(p.x - 3 + x, p.y - 4 + y, 1, 1);
      });
      drawText(ctx, "ABCD"[i], p.x - 1, p.y - 3, ink);
    }
  }

  private drawLabels(g: Geometry) {
    const ctx = this.ctx;
    const sim = this.sim;
    const lab = this.labelData(g);
    const q = this.q;
    const panelMid = (left: boolean) => (left ? g.ox / 2 : g.ox + g.mazeW + g.ox / 2);

    if (sim.qPhase === "power" || sim.qPhase === "gap" || !lab || !q) {
      // No labels: the panels say what's happening.
      if (sim.qPhase === "power") {
        const blink = sim.qT < 2 && Math.floor(this.time * 6) % 2 === 0;
        for (const left of this.answerFlash > 0 ? [] : [true, false]) {
          const x = panelMid(left);
          drawText(ctx, "DIZZY!", x, H / 2 - 16, blink ? COL.white : COL.green, { align: "center", scale: g.panelW > 70 ? 2 : 1 });
          drawText(ctx, "MUNCH", x, H / 2 + 2, COL.white, { align: "center" });
          drawText(ctx, "THEM!", x, H / 2 + 10, COL.white, { align: "center" });
        }
        if (sim.pickedIdx >= 0 && lab && this.answerFlash > 0) this.drawBox(lab, sim.pickedIdx, "right");
      } else if (sim.qPhase === "gap" && this.playing) {
        drawText(ctx, "NEXT", panelMid(true), H / 2 - 8, COL.cyan, { align: "center" });
        drawText(ctx, "QUESTION", panelMid(true), H / 2, COL.cyan, { align: "center" });
        drawText(ctx, "GET SET", panelMid(false), H / 2 - 4, COL.cyan, { align: "center" });
      }
      return;
    }
    if (sim.qPhase === "rage") {
      if (sim.pickedIdx >= 0) this.drawBox(lab, sim.pickedIdx, "wrong");
      if (sim.revealIdx >= 0) this.drawBox(lab, sim.revealIdx, Math.floor(this.time * 4) % 2 === 0 ? "right" : "reveal");
      return;
    }
    for (let i = 0; i < 4; i++) if (sim.pelletLive[i]) this.drawBox(lab, i, "live");
  }

  private drawBox(lab: { lays: LabelLayout[]; boxes: Rect[] }, i: number, state: "live" | "right" | "wrong" | "reveal") {
    const ctx = this.ctx;
    const b = lab.boxes[i];
    const lay = lab.lays[i];
    const left = i % 2 === 0;
    const accent = state === "live" ? LETTER_COLORS[i] : state === "wrong" ? COL.red : COL.green;
    ctx.fillStyle = state === "reveal" ? "#0d3a22" : "#0c1440";
    ctx.fillRect(b.x, b.y, b.w, b.h);
    ctx.fillStyle = accent;
    ctx.fillRect(b.x, i < 2 ? b.y : b.y + b.h - 1, b.w, 1);
    // Badge on the side nearest the maze, with a pointer to the pellet row.
    const bx = left ? b.x + b.w - BADGE - 1 : b.x + 1;
    const by = i < 2 ? b.y + PAD : b.y + b.h - PAD - BADGE;
    ctx.fillStyle = accent;
    ctx.fillRect(bx, by, BADGE, BADGE);
    const mark = state === "wrong" ? "✘" : state === "live" ? "ABCD"[i] : "✔";
    drawText(ctx, mark, bx + BADGE / 2 + 1, by + 1, state === "live" ? LETTER_INK[i] : "#0a0f2e", { align: "center", scale: 2 });
    const key = `KEY ${i + 1}`;
    drawText(ctx, key, left ? bx - 2 : bx + BADGE + 2, by + 4, COL.dim, { align: left ? "right" : "left" });
    // Text lines
    const lh = LINE_H * lay.scale;
    const top = i < 2 ? by + BADGE + PAD : b.y + PAD;
    const color = state === "wrong" ? "#ffb0b4" : state === "live" ? COL.white : COL.green;
    lay.lines.forEach((line, n) => {
      const y = top + n * lh + 2 * lay.scale;
      drawText(ctx, line, left ? b.x + b.w - 1 : b.x + 1, y, color, { align: left ? "right" : "left", scale: lay.scale });
    });
  }

  private spriteAt(g: Geometry, x: number, y: number, img: HTMLCanvasElement, w: number, h: number) {
    const ctx = this.ctx;
    const px = Math.round(g.ox + x * TILE + TILE / 2 - w / 2);
    const py = Math.round(g.oy + y * TILE + TILE / 2 - h / 2);
    ctx.drawImage(img, px, py);
    // Tunnel: also draw the part poking out of the other side.
    if (x < 1) ctx.drawImage(img, px + g.mazeW, py);
    if (x > this.sim.maze.cols - 2) ctx.drawImage(img, px - g.mazeW, py);
  }

  private drawCritter(g: Geometry, kind: number, c: { x: number; y: number; state: string; frightened: boolean; dir: number }) {
    const sim = this.sim;
    if (sim.phase === "dying" && this.stateT > 0.5) return;
    if (c.state === "returning") {
      const img = spriteCanvas("puff", PUFF, { W: "rgba(242,244,255,0.75)", K: "#05060f" });
      this.spriteAt(g, c.x, c.y, img, 8, 5);
      return;
    }
    const art = CRITTER_ART[kind];
    const frame = Math.floor(this.time * 6 + kind) % 2;
    let colors = art.colors;
    let key = `c${kind}-${frame}`;
    if (c.frightened) {
      const flash = sim.qT < 2 && Math.floor(this.time * 6) % 2 === 0;
      const body = flash ? DIZZY_COLORS.flash : DIZZY_COLORS.body;
      colors = Object.fromEntries(Object.entries(art.colors).map(([k, v]) => [k, k === "W" ? DIZZY_COLORS.eye : k === "K" || k === "S" ? v : body]));
      key += flash ? "-f" : "-d";
    } else if (sim.qPhase === "rage") {
      // Fired up: a red glow behind them.
      const p = tileCenter(g, c.x, c.y);
      this.ctx.fillStyle = Math.floor(this.time * 8) % 2 ? "rgba(227,38,47,0.55)" : "rgba(255,138,31,0.45)";
      this.ctx.fillRect(Math.round(p.x - 6), Math.round(p.y - 6), 12, 12);
    }
    let y = c.y;
    if (c.state === "pen") y += Math.sin(this.time * 5 + kind) * 0.25;
    this.spriteAt(g, c.x, y, spriteCanvas(key, art.frames[frame], colors), 10, 10);
  }

  private drawHero(g: Geometry) {
    const ctx = this.ctx;
    const sim = this.sim;
    const h = sim.hero;
    if (sim.phase === "dying") {
      // Pop: the helmet flashes, then scatters into sparks.
      const t = this.stateT;
      const p = tileCenter(g, h.x, h.y);
      if (t < 0.5) {
        if (Math.floor(t * 12) % 2 === 0) this.spriteAt(g, h.x, h.y, spriteCanvas("hero2", HERO_FRAMES[2], HERO_COLORS), 11, 11);
      } else {
        const r = (t - 0.5) * 22;
        ctx.fillStyle = t % 0.2 < 0.1 ? COL.yellow : COL.red;
        for (let k = 0; k < 8; k++) {
          const a = (k / 8) * Math.PI * 2;
          ctx.fillRect(Math.round(p.x + Math.cos(a) * r) - 1, Math.round(p.y + Math.sin(a) * r) - 1, 2, 2);
        }
      }
      return;
    }
    if (sim.phase === "over") return;
    const moving = h.dir >= 0 && sim.phase === "play";
    const f = moving ? [0, 1, 2, 1][Math.floor(this.time * 14) % 4] : 1;
    // Pupils look where the hero is heading.
    const facing = h.facing >= 0 ? h.facing : 1;
    const grid = HERO_FRAMES[f].map((row, y) =>
      [...row].map((c, x) => (HERO_PUPILS[facing].some(([px, py]) => px === x && py === y) ? "K" : c)).join(""),
    );
    this.spriteAt(g, h.x, h.y, spriteCanvas(`hero${f}-${facing}`, grid, HERO_COLORS), 11, 11);
  }
}

/** Names and one-line descriptions for the help screen. */
export const CRITTER_HELP = CRITTERS.map((c) => `${c.name} — ${c.blurb}`);
export const ITEM_LIST = ITEM_NAMES;
