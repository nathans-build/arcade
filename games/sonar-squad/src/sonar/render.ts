/*
 * The 320x200 sonar screen: the big board (the one you are firing at, or your own fleet
 * while the enemy fires), a small board, the aim readout and the enemy fleet status, plus
 * torpedo / splash / explosion / sinking / sonar animations. Draws whatever Scene the game
 * hands it each frame; all in-canvas text uses our own bitmap font.
 */
import { HIT, MISS, SUNK, shipCells, type Coord, type Orient, type Placement, type ShipDef, type ShotMark } from "./core";
import { forEachPixel, textWidth } from "./font";
import { PICTURES, colLabel, isPlane, rowLabel, type Scheme } from "./notation";
import { PAL, heroSprite, pictureIcons, shipSprite } from "./sprites";

export const W = 320;
export const H = 200;

export interface BoardModel {
  own: boolean;
  marks: ShotMark[];
  sonar?: number[];
  ships: { def: ShipDef; place: Placement; sunk: boolean }[];
  /** Spots repaired on this board (sparkle). */
}

export interface Scene {
  mode: "title" | "play" | "cover";
  scheme: Scheme;
  size: number;
  big: BoardModel | null;
  small: BoardModel | null;
  smallTitle: string;
  bigTitle: string;
  cursor: Coord | null;
  cursorKind: "aim" | "place" | "sonar" | null;
  ghost: { def: ShipDef; anchor: Coord; o: Orient; ok: boolean } | null;
  hint: Coord | null;
  aimLabel: string;
  enemyFleet: { def: ShipDef; sunk: boolean }[];
  status: string;
  statusColor: string;
}

export interface Geom {
  x: number;
  y: number;
  pitch: number;
  n: number;
  plane: boolean;
}

export function geomFor(scheme: Scheme, size: number, which: "big" | "small"): Geom {
  const plane = isPlane(scheme);
  if (which === "small") {
    const pitch = size === 11 ? 7 : 8;
    return { x: 316 - size * pitch, y: 12, pitch, n: size, plane };
  }
  if (!plane) return { x: 22, y: 12, pitch: 17, n: size, plane };
  const pitch = size === 11 ? 15 : 17;
  return { x: 20, y: 5, pitch, n: size, plane };
}

/** Centre of spot (r, c) in screen pixels. */
export function centre(g: Geom, r: number, c: number) {
  return { x: g.x + c * g.pitch + g.pitch / 2, y: g.y + r * g.pitch + g.pitch / 2 };
}

/** Which spot is under screen point (x, y), or null. */
export function spotAt(g: Geom, x: number, y: number): Coord | null {
  const c = Math.floor((x - g.x) / g.pitch);
  const r = Math.floor((y - g.y) / g.pitch);
  if (r < 0 || c < 0 || r >= g.n || c >= g.n) return null;
  return { r, c };
}

interface Particle { x: number; y: number; vx: number; vy: number; life: number; max: number; color: string; size: number }
interface Ring { x: number; y: number; t: number; max: number; r: number; color: string }
interface Floater { text: string; x: number; y: number; t: number; color: string; scale: number }
interface Torpedo { x0: number; y0: number; x1: number; y1: number; t: number; dur: number }
interface Sinking { def: ShipDef; place: Placement; which: "big" | "small"; t: number; dur: number }

export class SonarScreen {
  private ctx: CanvasRenderingContext2D;
  private raf = 0;
  private last = 0;
  time = 0;
  speed = 1;
  paused = false;
  private sweep = 0;
  private particles: Particle[] = [];
  private rings: Ring[] = [];
  private floaters: Floater[] = [];
  private torpedoes: Torpedo[] = [];
  private sinking: Sinking[] = [];
  private jamT = 0;
  private flashT = 0;
  private sparkle: { at: Coord; which: "big" | "small"; t: number }[] = [];

  constructor(canvas: HTMLCanvasElement, private scene: () => Scene) {
    canvas.width = W;
    canvas.height = H;
    this.ctx = canvas.getContext("2d")!;
    this.ctx.imageSmoothingEnabled = false;
  }

  start() {
    this.last = performance.now();
    const loop = (now: number) => {
      const dt = Math.max(0, Math.min(0.05, (now - this.last) / 1000));
      this.last = now;
      if (!this.paused) this.update(dt * this.speed);
      try {
        this.draw();
      } catch (e) {
        console.error(e);
      }
      this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
  }

  stop() {
    cancelAnimationFrame(this.raf);
  }

  /** A promise that resolves after `ms` of (sped-up, unpaused) game time. */
  wait(ms: number): Promise<void> {
    return new Promise((res) => {
      let left = ms / 1000;
      const tick = () => {
        if (!this.paused) left -= 0.05 * this.speed;
        if (left <= 0) res();
        else setTimeout(tick, 50);
      };
      setTimeout(tick, 50);
    });
  }

  clearEffects() {
    this.particles = [];
    this.rings = [];
    this.floaters = [];
    this.torpedoes = [];
    this.sinking = [];
    this.jamT = 0;
    this.sparkle = [];
  }

  /* ------------------------------ effects ------------------------------ */

  private geom(which: "big" | "small") {
    const s = this.scene();
    return geomFor(s.scheme, s.size, which);
  }

  floater(text: string, which: "big" | "small", at: Coord, color: string, scale = 1) {
    const p = centre(this.geom(which), at.r, at.c);
    this.floaters.push({ text, x: p.x, y: p.y - 6, t: 0, color, scale });
  }

  async torpedo(which: "big" | "small", at: Coord) {
    const g = this.geom(which);
    const p = centre(g, at.r, at.c);
    const dur = 0.42;
    this.torpedoes.push({ x0: g.x + (g.n * g.pitch) / 2, y0: g.y + g.n * g.pitch + 14, x1: p.x, y1: p.y, t: 0, dur });
    await this.wait(dur * 1000);
  }

  splash(which: "big" | "small", at: Coord) {
    const g = this.geom(which);
    const p = centre(g, at.r, at.c);
    for (let k = 0; k < 3; k++) this.rings.push({ x: p.x, y: p.y, t: -k * 0.12, max: 0.6, r: g.pitch * 0.9, color: k ? PAL.lightBlue : PAL.white });
    for (let k = 0; k < 10; k++) {
      const a = Math.random() * Math.PI * 2;
      const v = 15 + Math.random() * 30;
      this.particles.push({ x: p.x, y: p.y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 25, life: 0, max: 0.5, color: k % 2 ? PAL.white : PAL.lightBlue, size: 1 });
    }
  }

  explode(which: "big" | "small", at: Coord, big = false) {
    const g = this.geom(which);
    const p = centre(g, at.r, at.c);
    this.flashT = 0.12;
    const n = big ? 40 : 22;
    for (let k = 0; k < n; k++) {
      const a = Math.random() * Math.PI * 2;
      const v = 10 + Math.random() * (big ? 60 : 40);
      const cols = [PAL.yellow, PAL.orange, PAL.red, PAL.white];
      this.particles.push({ x: p.x, y: p.y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 0, max: 0.4 + Math.random() * 0.5, color: cols[k % 4], size: k % 5 === 0 ? 2 : 1 });
    }
    this.rings.push({ x: p.x, y: p.y, t: 0, max: 0.35, r: g.pitch * (big ? 1.6 : 1), color: PAL.yellow });
  }

  sink(which: "big" | "small", def: ShipDef, place: Placement) {
    this.sinking.push({ def, place, which, t: 0, dur: 1.4 });
    const g = this.geom(which);
    for (const c of shipCells(place, def.len)) {
      const p = centre(g, c.r, c.c);
      for (let k = 0; k < 4; k++)
        this.particles.push({ x: p.x + (Math.random() - 0.5) * g.pitch, y: p.y, vx: (Math.random() - 0.5) * 6, vy: -8 - Math.random() * 12, life: -Math.random() * 0.8, max: 1.2, color: PAL.cyan, size: 1 });
    }
  }

  ping(which: "big" | "small", at: Coord, contact: boolean) {
    const g = this.geom(which);
    const p = centre(g, at.r, at.c);
    for (let k = 0; k < 3; k++) this.rings.push({ x: p.x, y: p.y, t: -k * 0.25, max: 0.9, r: g.pitch * 1.6, color: contact ? PAL.amber : PAL.green });
  }

  jam() {
    this.jamT = 0.9;
  }

  repairFx(which: "big" | "small", at: Coord) {
    this.sparkle.push({ at, which, t: 0 });
  }

  private update(dt: number) {
    this.time += dt;
    this.sweep = (this.sweep + dt * 1.4) % (Math.PI * 2);
    this.flashT = Math.max(0, this.flashT - dt);
    this.jamT = Math.max(0, this.jamT - dt);
    for (const p of this.particles) {
      p.life += dt;
      if (p.life > 0) {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += 40 * dt;
      }
    }
    this.particles = this.particles.filter((p) => p.life < p.max);
    for (const r of this.rings) r.t += dt;
    this.rings = this.rings.filter((r) => r.t < r.max);
    for (const f of this.floaters) {
      f.t += dt;
      f.y -= 10 * dt;
    }
    this.floaters = this.floaters.filter((f) => f.t < 1.3);
    for (const t of this.torpedoes) t.t += dt;
    this.torpedoes = this.torpedoes.filter((t) => t.t < t.dur);
    for (const s of this.sinking) s.t += dt;
    this.sinking = this.sinking.filter((s) => s.t < s.dur);
    for (const s of this.sparkle) s.t += dt;
    this.sparkle = this.sparkle.filter((s) => s.t < 1.2);
  }

  /* ------------------------------ drawing ------------------------------ */

  private text(s: string, x: number, y: number, color: string, scale = 1, align: "left" | "center" | "right" = "left") {
    const ctx = this.ctx;
    const w = textWidth(s, scale);
    const x0 = Math.round(align === "center" ? x - w / 2 : align === "right" ? x - w : x);
    const y0 = Math.round(y);
    ctx.fillStyle = color;
    forEachPixel(s, (px, py) => ctx.fillRect(x0 + px * scale, y0 + py * scale, scale, scale));
  }

  private shadowText(s: string, x: number, y: number, color: string, scale = 1, align: "left" | "center" | "right" = "left") {
    this.text(s, x + 1, y + 1, "#000", scale, align);
    this.text(s, x, y, color, scale, align);
  }

  private draw() {
    const ctx = this.ctx;
    const s = this.scene();
    ctx.fillStyle = PAL.deep;
    ctx.fillRect(0, 0, W, H);

    if (s.mode === "cover") {
      this.drawCover();
      return;
    }

    const big = geomFor(s.scheme, s.size, "big");
    const small = geomFor(s.scheme, s.size, "small");
    if (s.big) this.drawBoard(s, big, s.big, true);
    if (s.small) this.drawBoard(s, small, s.small, false);
    this.drawPanel(s, small);

    // Effects on top
    for (const t of this.torpedoes) {
      const k = Math.min(1, t.t / t.dur);
      const x = t.x0 + (t.x1 - t.x0) * k;
      const y = t.y0 + (t.y1 - t.y0) * k;
      for (let j = 1; j <= 5; j++) {
        const kk = Math.max(0, k - j * 0.04);
        ctx.fillStyle = j < 3 ? PAL.orange : "rgba(255,255,255,0.4)";
        ctx.fillRect(Math.round(t.x0 + (t.x1 - t.x0) * kk), Math.round(t.y0 + (t.y1 - t.y0) * kk), 1, 1);
      }
      ctx.fillStyle = PAL.yellow;
      ctx.fillRect(Math.round(x) - 1, Math.round(y) - 1, 3, 3);
    }
    for (const sk of this.sinking) {
      const g = sk.which === "big" ? big : small;
      const k = sk.t / sk.dur;
      ctx.globalAlpha = Math.max(0, 1 - k);
      this.drawShip(g, sk.def, sk.place, false, k * g.pitch * 0.5);
      ctx.globalAlpha = 1;
    }
    for (const r of this.rings) {
      if (r.t < 0) continue;
      const k = r.t / r.max;
      ctx.strokeStyle = r.color;
      ctx.globalAlpha = 1 - k;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(Math.round(r.x) + 0.5, Math.round(r.y) + 0.5, Math.max(1, r.r * k), 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
    for (const p of this.particles) {
      if (p.life < 0) continue;
      ctx.globalAlpha = Math.max(0, 1 - p.life / p.max);
      ctx.fillStyle = p.color;
      ctx.fillRect(Math.round(p.x), Math.round(p.y), p.size, p.size);
    }
    ctx.globalAlpha = 1;
    for (const sp of this.sparkle) {
      const g = sp.which === "big" ? big : small;
      const p = centre(g, sp.at.r, sp.at.c);
      const k = sp.t / 1.2;
      ctx.fillStyle = PAL.green;
      for (let j = 0; j < 4; j++) {
        const a = j * (Math.PI / 2) + sp.t * 4;
        ctx.fillRect(Math.round(p.x + Math.cos(a) * g.pitch * 0.5 * (1 - k)), Math.round(p.y + Math.sin(a) * g.pitch * 0.5 * (1 - k)), 2, 2);
      }
    }
    for (const f of this.floaters) {
      const a = f.t < 1 ? 1 : 1 - (f.t - 1) / 0.3;
      ctx.globalAlpha = Math.max(0, a);
      this.shadowText(f.text, Math.max(textWidth(f.text, f.scale) / 2 + 2, Math.min(W - textWidth(f.text, f.scale) / 2 - 2, f.x)), f.y - 3, f.color, f.scale, "center");
      ctx.globalAlpha = 1;
    }
    if (this.jamT > 0 && s.big) {
      // static noise over the big board
      const g = big;
      for (let k = 0; k < 600; k++) {
        ctx.fillStyle = Math.random() < 0.5 ? "#9aa6c8" : "#2a3a6a";
        ctx.fillRect(g.x + Math.floor(Math.random() * g.n * g.pitch), g.y + Math.floor(Math.random() * g.n * g.pitch), 2, 1);
      }
      this.shadowText("SONAR JAMMED!", g.x + (g.n * g.pitch) / 2, g.y + (g.n * g.pitch) / 2 - 6, PAL.red, 2, "center");
    }
    if (this.flashT > 0) {
      ctx.fillStyle = `rgba(255,240,200,${this.flashT * 2})`;
      ctx.fillRect(0, 0, W, H);
    }
  }

  private drawCover() {
    const ctx = this.ctx;
    ctx.fillStyle = "#03081a";
    ctx.fillRect(0, 0, W, H);
    // A big sweeping scope
    const cx = 160;
    const cy = 100;
    ctx.strokeStyle = PAL.grid;
    for (const r of [30, 60, 90]) {
      ctx.beginPath();
      ctx.arc(cx + 0.5, cy + 0.5, r, 0, Math.PI * 2);
      ctx.stroke();
    }
    this.drawSweep(cx, cy, 95);
    this.shadowText("DON'T PEEK!", cx, 40, PAL.yellow, 3, "center");
    ctx.drawImage(heroSprite(), cx - 13, 120, 26, 28);
  }

  private drawSweep(cx: number, cy: number, r: number) {
    const ctx = this.ctx;
    for (let k = 0; k < 14; k++) {
      const a = this.sweep - k * 0.045;
      ctx.strokeStyle = `rgba(95,255,138,${0.32 * (1 - k / 14)})`;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
      ctx.stroke();
    }
  }

  private drawShip(g: Geom, def: ShipDef, place: Placement, wreck: boolean, dy = 0) {
    const ctx = this.ctx;
    const spr = shipSprite(def, g.pitch, wreck);
    const x = g.x + place.c * g.pitch;
    const y = g.y + place.r * g.pitch + Math.round(dy);
    if (place.o === "h") ctx.drawImage(spr, x, y);
    else {
      ctx.save();
      ctx.translate(x + g.pitch, y);
      ctx.rotate(Math.PI / 2);
      ctx.drawImage(spr, 0, 0);
      ctx.restore();
    }
  }

  private drawBoard(s: Scene, g: Geom, b: BoardModel, isBig: boolean) {
    const ctx = this.ctx;
    const span = g.n * g.pitch;
    // Water
    ctx.fillStyle = b.own ? "#06193a" : PAL.sea;
    ctx.fillRect(g.x, g.y, span, span);
    // Grid
    ctx.fillStyle = PAL.grid;
    if (g.plane) {
      for (let k = 0; k < g.n; k++) {
        const p = g.x + k * g.pitch + Math.floor(g.pitch / 2);
        ctx.fillRect(p, g.y, 1, span);
        const q = g.y + k * g.pitch + Math.floor(g.pitch / 2);
        ctx.fillRect(g.x, q, span, 1);
      }
      // Axes: x-axis is y = 0, y-axis is x = 0.
      const r0 = s.scheme === "q4" ? 5 : g.n - 1;
      const c0 = s.scheme === "q4" ? 5 : 0;
      ctx.fillStyle = isBig ? PAL.lightBlue : PAL.gridHi;
      const ax = g.x + c0 * g.pitch + Math.floor(g.pitch / 2);
      const ay = g.y + r0 * g.pitch + Math.floor(g.pitch / 2);
      ctx.fillRect(g.x, ay, span, 1);
      ctx.fillRect(ax, g.y, 1, span);
      if (isBig) {
        // arrowheads and axis names
        ctx.fillRect(g.x + span - 2, ay - 1, 1, 3);
        ctx.fillRect(ax - 1, g.y + 1, 3, 1);
        this.text("x", g.x + span - 4, ay - 8, PAL.lightBlue);
        this.text("y", ax + 3, g.y - 1, PAL.lightBlue);
      }
    } else {
      for (let k = 0; k <= g.n; k++) {
        ctx.fillRect(g.x + k * g.pitch, g.y, 1, span + 1);
        ctx.fillRect(g.x, g.y + k * g.pitch, span + 1, 1);
      }
    }
    // Sonar sweep on the big board
    if (isBig) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(g.x, g.y, span, span);
      ctx.clip();
      this.drawSweep(g.x + span / 2, g.y + span / 2, span * 0.75);
      ctx.restore();
    }
    // Labels
    if (isBig) this.drawLabels(s, g);

    // Hint glow (K-2)
    if (isBig && s.hint && !b.own) {
      const a = 0.18 + 0.12 * Math.sin(this.time * 5);
      ctx.fillStyle = `rgba(127,243,255,${a})`;
      const r0 = Math.max(0, s.hint.r - 1);
      const c0 = Math.max(0, s.hint.c - 1);
      const r1 = Math.min(g.n - 1, s.hint.r + 1);
      const c1 = Math.min(g.n - 1, s.hint.c + 1);
      ctx.fillRect(g.x + c0 * g.pitch, g.y + r0 * g.pitch, (c1 - c0 + 1) * g.pitch, (r1 - r0 + 1) * g.pitch);
    }

    // Sonar marks
    if (b.sonar) {
      for (let i = 0; i < b.sonar.length; i++) {
        const m = b.sonar[i];
        if (!m || b.marks[i]) continue;
        const r = Math.floor(i / g.n);
        const c = i % g.n;
        const p = centre(g, r, c);
        if (m === 1) {
          ctx.fillStyle = "rgba(95,255,138,0.55)";
          ctx.fillRect(Math.round(p.x) - 1, Math.round(p.y) - 1, 2, 2);
        } else {
          const on = Math.sin(this.time * 6) > -0.3;
          ctx.strokeStyle = on ? PAL.amber : "#7a5010";
          ctx.strokeRect(g.x + c * g.pitch + 1.5, g.y + r * g.pitch + 1.5, g.pitch - 3, g.pitch - 3);
        }
      }
    }

    // Ships (own fleet, or enemy ships once sunk)
    for (const sh of b.ships) {
      if (this.sinking.some((k) => k.def.id === sh.def.id && k.which === (isBig ? "big" : "small") && !b.own)) continue;
      this.drawShip(g, sh.def, sh.place, sh.sunk);
    }

    // Shot marks
    for (let i = 0; i < b.marks.length; i++) {
      const m = b.marks[i];
      if (!m) continue;
      const r = Math.floor(i / g.n);
      const c = i % g.n;
      const p = centre(g, r, c);
      const x = Math.round(p.x);
      const y = Math.round(p.y);
      if (m === MISS) {
        ctx.fillStyle = PAL.white;
        if (g.pitch >= 12) {
          ctx.fillRect(x - 2, y - 1, 1, 3);
          ctx.fillRect(x + 2, y - 1, 1, 3);
          ctx.fillRect(x - 1, y - 2, 3, 1);
          ctx.fillRect(x - 1, y + 2, 3, 1);
        } else ctx.fillRect(x - 1, y - 1, 2, 2);
      } else if (m === HIT || m === SUNK) {
        const flick = Math.sin(this.time * 18 + i) > 0;
        const k = g.pitch >= 12 ? 3 : 2;
        ctx.fillStyle = m === SUNK ? "#ff5a5a" : flick ? PAL.orange : PAL.yellow;
        if (m === HIT) ctx.fillRect(x - 1, y - k - 2, 2, 2); // flame tip
        ctx.fillStyle = PAL.red;
        for (let d = -k; d <= k; d++) {
          ctx.fillRect(x + d, y + d, 1, 1);
          ctx.fillRect(x + d, y - d, 1, 1);
          if (g.pitch >= 12) {
            ctx.fillRect(x + d + 1, y + d, 1, 1);
            ctx.fillRect(x + d + 1, y - d, 1, 1);
          }
        }
      }
    }

    // Placement ghost
    if (isBig && s.ghost) {
      ctx.globalAlpha = 0.85;
      this.drawShip(g, s.ghost.def, { id: s.ghost.def.id, r: s.ghost.anchor.r, c: s.ghost.anchor.c, o: s.ghost.o }, false);
      ctx.globalAlpha = 1;
      ctx.strokeStyle = s.ghost.ok ? PAL.green : PAL.red;
      const len = s.ghost.def.len;
      const w = s.ghost.o === "h" ? len : 1;
      const h = s.ghost.o === "h" ? 1 : len;
      ctx.strokeRect(g.x + s.ghost.anchor.c * g.pitch + 0.5, g.y + s.ghost.anchor.r * g.pitch + 0.5, w * g.pitch - 1, h * g.pitch - 1);
    }

    // Cursor
    if (isBig && s.cursor && s.cursorKind && s.cursorKind !== "place") {
      const cur = s.cursor;
      const p = centre(g, cur.r, cur.c);
      const on = Math.floor(this.time * 3) % 2 === 0;
      // Crosshair along the row and column helps read the coordinate.
      ctx.fillStyle = "rgba(255,210,63,0.28)";
      if (g.plane) {
        const r0 = s.scheme === "q4" ? 5 : g.n - 1;
        const c0 = s.scheme === "q4" ? 5 : 0;
        const ax = g.x + c0 * g.pitch + Math.floor(g.pitch / 2);
        const ay = g.y + r0 * g.pitch + Math.floor(g.pitch / 2);
        // from the axes to the point: x along the x-axis, then y straight up/down
        for (let x = Math.min(ax, p.x); x <= Math.max(ax, p.x); x += 2) ctx.fillRect(Math.floor(x), ay - 1, 1, 3);
        for (let y = Math.min(ay, p.y); y <= Math.max(ay, p.y); y += 2) ctx.fillRect(Math.floor(p.x) - 1, Math.floor(y), 3, 1);
      } else {
        ctx.fillRect(g.x, g.y + cur.r * g.pitch + 1, g.n * g.pitch, g.pitch - 1);
        ctx.fillRect(g.x + cur.c * g.pitch + 1, g.y, g.pitch - 1, g.n * g.pitch);
      }
      const rad = s.cursorKind === "sonar" ? 1 : 0;
      const x0 = g.x + Math.max(0, cur.c - rad) * g.pitch;
      const y0 = g.y + Math.max(0, cur.r - rad) * g.pitch;
      const x1 = g.x + (Math.min(g.n - 1, cur.c + rad) + 1) * g.pitch;
      const y1 = g.y + (Math.min(g.n - 1, cur.r + rad) + 1) * g.pitch;
      ctx.fillStyle = s.cursorKind === "sonar" ? PAL.green : on ? PAL.yellow : PAL.white;
      const L = 4;
      for (const [x, y, dx, dy] of [
        [x0, y0, 1, 1],
        [x1 - 1, y0, -1, 1],
        [x0, y1 - 1, 1, -1],
        [x1 - 1, y1 - 1, -1, -1],
      ]) {
        ctx.fillRect(dx > 0 ? x : x - L + 1, y, L, 1);
        ctx.fillRect(x, dy > 0 ? y : y - L + 1, 1, L);
      }
      if (g.plane) {
        ctx.fillStyle = PAL.yellow;
        ctx.fillRect(Math.round(p.x) - 1, Math.round(p.y) - 1, 3, 3);
      }
    }
  }

  private drawLabels(s: Scene, g: Geom) {
    const cur = s.cursor;
    const hiR = cur && s.cursorKind && s.cursorKind !== "place" ? cur.r : -1;
    const hiC = cur && s.cursorKind && s.cursorKind !== "place" ? cur.c : -1;
    const span = g.n * g.pitch;
    if (g.plane) {
      // x labels under the board, y labels to the left (at the grid lines)
      for (let c = 0; c < g.n; c++) {
        const p = centre(g, 0, c);
        this.text(colLabel(s.scheme, c), p.x + 1, g.y + span + 2, c === hiC ? PAL.yellow : PAL.dim, 1, "center");
      }
      for (let r = 0; r < g.n; r++) {
        const p = centre(g, r, 0);
        this.text(rowLabel(s.scheme, r), g.x - 2, p.y - 3, r === hiR ? PAL.yellow : PAL.dim, 1, "right");
      }
      return;
    }
    for (let c = 0; c < g.n; c++) {
      const p = centre(g, 0, c);
      this.text(colLabel(s.scheme, c), p.x + 1, g.y - 8, c === hiC ? PAL.yellow : PAL.dim, 1, "center");
    }
    const icons = s.scheme === "picture" ? pictureIcons() : null;
    for (let r = 0; r < g.n; r++) {
      const p = centre(g, r, 0);
      if (icons) {
        if (r === hiR) {
          this.ctx.fillStyle = "rgba(255,210,63,0.35)";
          this.ctx.fillRect(g.x - 13, g.y + r * g.pitch + 1, 12, g.pitch - 1);
        }
        this.ctx.drawImage(icons[r], g.x - 12, Math.round(p.y) - 4);
      } else this.text(rowLabel(s.scheme, r), g.x - 3, p.y - 3, r === hiR ? PAL.yellow : PAL.dim, 1, "right");
    }
  }

  private drawPanel(s: Scene, small: Geom) {
    const ctx = this.ctx;
    const x = 198;
    // Small board title
    this.text(s.smallTitle, small.x, 3, PAL.dim);
    const y = small.y + small.n * small.pitch + 5;
    // Aim readout
    this.text(s.bigTitle, x, y, PAL.lightBlue);
    if (s.aimLabel) {
      this.text("AIM", x, y + 10, PAL.dim);
      const scale = textWidth(s.aimLabel, 2) <= 316 - x - 16 ? 2 : 1;
      this.shadowText(s.aimLabel, x + 16, y + 9 - (scale === 2 ? 3 : 0), PAL.yellow, scale);
      if (s.scheme === "picture" && s.cursor) {
        const icon = pictureIcons()[s.cursor.r];
        ctx.drawImage(icon, 316 - 10, y + 8);
      }
    }
    // Enemy fleet status
    let yy = y + 24;
    this.text("ENEMY FLEET", x, yy, PAL.dim);
    yy += 9;
    for (const f of s.enemyFleet) {
      const spr = shipSprite(f.def, 6, f.sunk);
      ctx.drawImage(spr, x, yy - 1);
      this.text(f.def.name.toUpperCase(), x + 33, yy, f.sunk ? "#7a3a40" : PAL.white);
      if (f.sunk) {
        ctx.fillStyle = PAL.red;
        ctx.fillRect(x, yy + 2, 30 + textWidth(f.def.name.toUpperCase()) + 3, 1);
      }
      yy += 8;
    }
    // Status line and the captain
    ctx.drawImage(heroSprite(), 303, 184);
    if (s.status) this.text(s.status, x, 190, s.statusColor || PAL.white);
    // PICTURES import used for colour hint in K-2 (row colour bar)
    if (s.scheme === "picture" && s.cursor && s.cursorKind === "aim") {
      ctx.fillStyle = PICTURES[s.cursor.r].color;
      ctx.fillRect(x, y + 20, 14, 1);
    }
  }
}
