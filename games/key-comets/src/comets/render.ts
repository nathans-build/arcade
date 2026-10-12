/*
 * Canvas drawing for Key Comets: starfield, the space station and its shield dome,
 * falling comets with their words, the laser, and sparkle explosions. All original art drawn in code.
 */
import { H, STATION_Y as SHIELD_Y, W, type Comet, type CometSim } from "./sim";
import { wrapLines } from "./words";

const PIXEL = '"Press Start 2P", ui-monospace, monospace';
const VT = '"VT323", ui-monospace, monospace';

interface Star { x: number; y: number; s: number; v: number; tw: number }
interface Spark { x: number; y: number; vx: number; vy: number; life: number; max: number; color: string; size: number }
interface Laser { x: number; y: number; life: number }
interface Popup { x: number; y: number; text: string; life: number; color: string }

const SPARK_COLORS = ["#ffd23f", "#5fff8a", "#6ea0ff", "#ff7ad9", "#ffffff", "#ff9f3b"];

export class Renderer {
  private ctx: CanvasRenderingContext2D;
  private stars: Star[] = [];
  private sparks: Spark[] = [];
  private lasers: Laser[] = [];
  private popups: Popup[] = [];
  shake = 0;
  flash = 0;
  /** Big letters for early readers. */
  big = false;

  constructor(canvas: HTMLCanvasElement) {
    this.ctx = canvas.getContext("2d")!;
    for (let i = 0; i < 90; i++) {
      this.stars.push({ x: Math.random() * W, y: Math.random() * H, s: Math.random() < 0.15 ? 2 : 1, v: 0.004 + Math.random() * 0.02, tw: Math.random() * 6 });
    }
  }

  zap(c: Comet, points: number) {
    this.lasers.push({ x: c.x, y: c.y, life: 220 });
    const n = c.kind === "sentence" ? 70 : c.kind === "word" ? 40 : 28;
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = 0.04 + Math.random() * 0.16;
      this.sparks.push({
        x: c.x + (c.kind === "sentence" ? (Math.random() - 0.5) * 200 : 0), y: c.y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
        life: 700, max: 700, color: SPARK_COLORS[i % SPARK_COLORS.length], size: Math.random() < 0.3 ? 3 : 2,
      });
    }
    this.popups.push({ x: c.x, y: c.y - 18, text: `+${points}`, life: 900, color: "#ffd23f" });
  }

  dent(c: Comet) {
    this.shake = 1;
    this.flash = 1;
    for (let i = 0; i < 24; i++) {
      const a = -Math.PI * Math.random();
      const sp = 0.05 + Math.random() * 0.12;
      this.sparks.push({ x: c.x, y: SHIELD_Y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 500, max: 500, color: i % 2 ? "#ff6b6b" : "#ffb13b", size: 2 });
    }
  }

  oops(x: number, y: number) {
    this.popups.push({ x, y, text: "oops", life: 500, color: "#ff8a8f" });
  }

  update(dt: number) {
    for (const s of this.stars) {
      s.y += s.v * dt;
      if (s.y > H) { s.y = 0; s.x = Math.random() * W; }
      s.tw += dt * 0.004;
    }
    for (const p of this.sparks) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 0.00012 * dt;
      p.life -= dt;
    }
    this.sparks = this.sparks.filter((p) => p.life > 0);
    for (const l of this.lasers) l.life -= dt;
    this.lasers = this.lasers.filter((l) => l.life > 0);
    for (const p of this.popups) { p.life -= dt; p.y -= dt * 0.03; }
    this.popups = this.popups.filter((p) => p.life > 0);
    this.shake = Math.max(0, this.shake - dt / 300);
    this.flash = Math.max(0, this.flash - dt / 400);
  }

  draw(sim: CometSim | null, now: number) {
    const g = this.ctx;
    g.save();
    g.imageSmoothingEnabled = false;
    if (this.shake > 0) g.translate((Math.random() - 0.5) * 8 * this.shake, (Math.random() - 0.5) * 6 * this.shake);
    // Space
    const grad = g.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, "#050818");
    grad.addColorStop(1, "#141a52");
    g.fillStyle = grad;
    g.fillRect(-10, -10, W + 20, H + 20);
    for (const s of this.stars) {
      g.globalAlpha = 0.5 + 0.5 * Math.sin(s.tw);
      g.fillStyle = s.s > 1 ? "#ffe9a8" : "#c9d3ff";
      g.fillRect(Math.round(s.x), Math.round(s.y), s.s, s.s);
    }
    g.globalAlpha = 1;
    // A far-off ringed planet
    g.fillStyle = "#3a2a7a";
    g.beginPath();
    g.arc(560, 70, 26, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = "#5a44b0";
    g.fillRect(546, 58, 18, 6);
    g.strokeStyle = "#e3a0ff";
    g.lineWidth = 2;
    g.beginPath();
    g.ellipse(560, 72, 44, 8, -0.25, 0, Math.PI * 2);
    g.stroke();

    this.drawStation(sim, now);

    if (sim) {
      const target = sim.target();
      const locked = new Set(sim.buffer ? sim.candidates().map((c) => c.id) : []);
      // Draw the most urgent comet last so it sits on top.
      const order = [...sim.comets].sort((a, b) => a.y - b.y);
      for (const c of order) this.drawComet(c, locked.has(c.id) ? sim.buffer.length : 0, c === target, sim.practice, now);
    }

    for (const l of this.lasers) {
      const a = l.life / 220;
      g.strokeStyle = `rgba(95,255,138,${a})`;
      g.lineWidth = 4;
      g.beginPath();
      g.moveTo(W / 2, SHIELD_Y + 6);
      g.lineTo(l.x, l.y);
      g.stroke();
      g.strokeStyle = `rgba(255,255,255,${a})`;
      g.lineWidth = 1.5;
      g.stroke();
    }
    for (const p of this.sparks) {
      g.globalAlpha = Math.max(0, p.life / p.max);
      g.fillStyle = p.color;
      const s = p.size;
      // Little four-point sparkle
      g.fillRect(Math.round(p.x) - s, Math.round(p.y), s * 2 + 1, 1);
      g.fillRect(Math.round(p.x), Math.round(p.y) - s, 1, s * 2 + 1);
    }
    g.globalAlpha = 1;
    g.textAlign = "center";
    g.textBaseline = "middle";
    for (const p of this.popups) {
      g.globalAlpha = Math.min(1, p.life / 300);
      g.font = `10px ${PIXEL}`;
      g.fillStyle = p.color;
      g.fillText(p.text, p.x, p.y);
    }
    g.globalAlpha = 1;
    if (this.flash > 0) {
      g.fillStyle = `rgba(255,80,80,${0.25 * this.flash})`;
      g.fillRect(0, 0, W, H);
    }
    g.restore();
  }

  private drawStation(sim: CometSim | null, now: number) {
    const g = this.ctx;
    const max = sim?.shieldMax ?? 5;
    const sh = sim ? sim.shield / max : 1;
    // Moon surface
    g.fillStyle = "#2b2f55";
    g.fillRect(0, SHIELD_Y + 34, W, H - SHIELD_Y);
    g.fillStyle = "#3a3f72";
    for (let x = 0; x < W; x += 46) g.fillRect(x + 8, SHIELD_Y + 44 + ((x / 46) % 3) * 6, 14, 4);
    // Shield dome
    if (sim?.practice) {
      g.strokeStyle = `rgba(95,255,138,${0.35 + 0.15 * Math.sin(now / 300)})`;
    } else {
      const col = sh > 0.6 ? "110,160,255" : sh > 0.3 ? "255,210,63" : "255,90,90";
      g.strokeStyle = `rgba(${col},${0.25 + 0.5 * sh})`;
    }
    g.lineWidth = 3;
    g.beginPath();
    g.ellipse(W / 2, SHIELD_Y + 40, W / 2 + 40, 34, 0, Math.PI, 0);
    g.stroke();
    // Station body
    g.fillStyle = "#c9d3ff";
    g.fillRect(W / 2 - 70, SHIELD_Y + 22, 140, 16);
    g.fillStyle = "#6a78b8";
    g.fillRect(W / 2 - 70, SHIELD_Y + 34, 140, 4);
    g.fillStyle = "#e3262f";
    g.fillRect(W / 2 - 110, SHIELD_Y + 26, 40, 10);
    g.fillRect(W / 2 + 70, SHIELD_Y + 26, 40, 10);
    g.fillStyle = "#2456e8";
    for (let i = 0; i < 4; i++) {
      g.fillRect(W / 2 - 106 + i * 9, SHIELD_Y + 28, 6, 6);
      g.fillRect(W / 2 + 74 + i * 9, SHIELD_Y + 28, 6, 6);
    }
    // Windows
    g.fillStyle = "#ffd23f";
    for (let i = 0; i < 6; i++) if ((Math.floor(now / 700) + i) % 4) g.fillRect(W / 2 - 58 + i * 20, SHIELD_Y + 27, 8, 5);
    // Laser turret
    g.fillStyle = "#f2f4ff";
    g.fillRect(W / 2 - 14, SHIELD_Y + 10, 28, 12);
    g.fillStyle = "#5fff8a";
    g.fillRect(W / 2 - 3, SHIELD_Y, 6, 12);
  }

  private drawComet(c: Comet, typed: number, isTarget: boolean, practice: boolean, now: number) {
    const g = this.ctx;
    const x = Math.round(c.x + Math.sin(c.phase) * 2);
    const y = Math.round(c.y);
    // Tail (comets fall down, so the tail streams up)
    const r = c.kind === "sentence" ? 14 : c.kind === "letter" ? 12 : 10;
    const tail = c.kind === "sentence" ? 60 : 44;
    for (let i = 0; i < 6; i++) {
      g.globalAlpha = 0.5 - i * 0.07;
      g.fillStyle = i % 2 ? "#ff9f3b" : "#ffd23f";
      const w = r * 1.4 - i * 2;
      g.fillRect(x - w / 2, y - r - ((i + 1) * tail) / 6, w, tail / 6);
    }
    g.globalAlpha = 1;
    // Rock
    g.fillStyle = "#8a6a4a";
    g.beginPath();
    g.arc(x, y, r, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = "#b08a5e";
    g.fillRect(x - r / 2, y - r / 2, r / 2, r / 3);
    g.fillStyle = "#5e452f";
    g.fillRect(x + r / 4, y + r / 6, r / 3, r / 3);

    // Label
    let font: string;
    if (c.kind === "letter") font = `${this.big ? 30 : 24}px ${PIXEL}`;
    else if (c.kind === "word" && c.text.length <= 9) font = `${this.big ? 16 : 13}px ${PIXEL}`;
    else font = `${c.kind === "sentence" ? 24 : 26}px ${VT}`;
    g.font = font;
    g.textBaseline = "middle";
    g.textAlign = "left";
    const lines = c.kind === "sentence" ? wrapLines(c.text) : [c.text];
    const cw = g.measureText("M").width;
    const lh = c.kind === "sentence" ? 22 : c.kind === "letter" ? 34 : 22;
    const widest = Math.max(...lines.map((l) => l.trimEnd().length)) * cw;
    const boxW = widest + 16;
    const boxH = lines.length * lh + 6;
    const bx = Math.round(Math.min(W - boxW - 2, Math.max(2, x - boxW / 2)));
    const by = y + r + 4;
    const blink = practice && c.waiting && Math.floor(now / 400) % 2 === 0;
    g.fillStyle = typed > 0 ? "rgba(10,40,20,0.9)" : "rgba(5,8,24,0.82)";
    g.fillRect(bx, by, boxW, boxH);
    g.strokeStyle = typed > 0 ? "#5fff8a" : isTarget ? (blink ? "#ffffff" : "#ffd23f") : "#3a4690";
    g.lineWidth = typed > 0 || isTarget ? 2 : 1;
    g.strokeRect(bx + 0.5, by + 0.5, boxW - 1, boxH - 1);
    let offset = 0;
    lines.forEach((line, li) => {
      const ly = by + 3 + lh * li + lh / 2 + 1;
      for (let i = 0; i < line.length; i++) {
        const gi = offset + i;
        const ch = line[i];
        const cx = bx + 8 + i * cw;
        if (gi < typed) g.fillStyle = "#5fff8a";
        else if (gi === typed && (typed > 0 || isTarget)) {
          g.fillStyle = "#ffd23f";
          g.fillRect(cx, ly + lh / 2 - 4, cw - 1, 2);
        } else g.fillStyle = "#f2f4ff";
        if (ch !== " ") g.fillText(ch, cx, ly);
      }
      offset += line.length;
    });
    // Lock-on reticle
    if (typed > 0) {
      g.strokeStyle = "#5fff8a";
      g.lineWidth = 2;
      const s = r + 6;
      for (const [dx, dy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
        g.beginPath();
        g.moveTo(x + dx * s, y + dy * (s - 5));
        g.lineTo(x + dx * s, y + dy * s);
        g.lineTo(x + dx * (s - 5), y + dy * s);
        g.stroke();
      }
    }
  }
}
