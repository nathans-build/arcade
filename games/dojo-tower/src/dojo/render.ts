import { FLOOR_INFO, type BossId } from "./floors";
import { METER_MAX } from "./rules";
import { DojoSim, GROUND, MAX_ENERGY, VIEW_H, VIEW_W, type Enemy, type SimEvent } from "./sim";

/*
 * Draws Dojo Tower on a 640x400 canvas (the 320x200 game world at 2x). All art is original pixel
 * art made of rectangles, drawn in code: the student in a white gi, cartoon Ink Ninjas, ink blobs
 * and the five floor masters. Defeated ninjas poof into confetti and ink splats.
 */

export const SCALE = 2;
const FONT = '"Press Start 2P", ui-monospace, monospace';

const C = {
  ink: "#2a2350",
  inkHi: "#4a3f86",
  inkDark: "#17122e",
  skin: "#f1c27d",
  skin2: "#c68c53",
  gi: "#f2f4ff",
  giShade: "#b8c0e0",
  hair: "#1b1b2a",
  red: "#e3262f",
  blue: "#2456e8",
  yellow: "#ffd23f",
  green: "#5fff8a",
  cyan: "#6ea0ff",
  white: "#f2f4ff",
  black: "#05060f",
  paper: "#f3e6c4",
  paperDark: "#d9c79c",
  wood: "#5a3a22",
};

const BELTS = ["#f2f4ff", "#ffd23f", "#ff9a3c", "#5fff8a", "#2456e8", "#05060f"];
const CONFETTI = ["#ffd23f", "#e3262f", "#6ea0ff", "#5fff8a", "#ff8ad8", "#f2f4ff"];

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  color: string;
  size: number;
  grav: number;
}
interface Floater {
  text: string;
  x: number;
  y: number;
  t: number;
  color: string;
}

type Rect = (dx: number, dy: number, w: number, h: number, c: string) => void;

/** The open question, drawn on a hanging scroll at the top of the game screen. */
export interface QuestionCard {
  title: string;
  prompt: string;
  choices: readonly string[];
  picked: number | null;
  answer: number;
}

export class Renderer {
  private ctx: CanvasRenderingContext2D;
  private parts: Particle[] = [];
  private floaters: Floater[] = [];
  private shake = 0;
  private flash = 0;
  private time = 0;
  card: QuestionCard | null = null;

  constructor(canvas: HTMLCanvasElement) {
    canvas.width = VIEW_W * SCALE;
    canvas.height = VIEW_H * SCALE;
    this.ctx = canvas.getContext("2d")!;
    this.ctx.imageSmoothingEnabled = false;
  }

  /** Visual side of the simulation's events (sounds and UI callbacks are handled by the engine). */
  onEvent(ev: SimEvent, sim: DojoSim) {
    if (ev.type === "poof") this.poof(ev.x, GROUND - ev.y, !!ev.ink, !!ev.big);
    else if (ev.type === "floater") this.floaters.push({ text: ev.text, x: ev.x, y: ev.y, t: 0, color: ev.color });
    else if (ev.type === "shake") this.shake = Math.max(this.shake, ev.amt);
    else if (ev.type === "flash") this.flash = 1;
    else if (ev.type === "floorStart") {
      this.parts = [];
      this.floaters = [];
    }
    void sim;
  }

  private poof(x: number, y: number, ink: boolean, big: boolean) {
    const n = big ? 70 : 26;
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = (big ? 40 : 25) + Math.random() * (big ? 90 : 55);
      const isInk = ink && i % 3 === 0;
      this.parts.push({
        x, y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp - 30,
        life: 0,
        max: 0.6 + Math.random() * (big ? 1.2 : 0.6),
        color: isInk ? (i % 2 ? C.inkHi : "#6a4fc0") : CONFETTI[i % CONFETTI.length],
        size: isInk ? 3 : 2,
        grav: isInk ? 160 : 90,
      });
    }
    // a little puff cloud
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      this.parts.push({ x, y, vx: Math.cos(a) * 30, vy: Math.sin(a) * 20, life: 0, max: 0.35, color: "#e8e8ff", size: 4, grav: 0 });
    }
  }

  // ------------------------------------------------------------------ frame

  draw(sim: DojoSim, dt: number) {
    const ctx = this.ctx;
    this.time += dt;
    for (const p of this.parts) {
      p.life += dt;
      p.vy += p.grav * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    }
    this.parts = this.parts.filter((p) => p.life < p.max);
    for (const f of this.floaters) f.t += dt;
    this.floaters = this.floaters.filter((f) => f.t < 1.4);
    this.shake = Math.max(0, this.shake - dt * 10);
    this.flash = Math.max(0, this.flash - dt * 3);

    ctx.setTransform(SCALE, 0, 0, SCALE, 0, 0);
    ctx.imageSmoothingEnabled = false;
    const sx = this.shake > 0 ? Math.round((Math.random() - 0.5) * this.shake) : 0;
    const sy = this.shake > 0 ? Math.round((Math.random() - 0.5) * this.shake) : 0;
    ctx.translate(sx, sy);

    const cam = Math.round(sim.camX);
    this.background(sim, cam);

    // world
    ctx.save();
    ctx.translate(-cam, 0);
    this.arenaDoor(sim);
    for (const e of sim.enemies) this.enemy(e, sim);
    for (const s of sim.shots) this.shot(s.x, GROUND - s.y, s.vx);
    if (sim.bossVisible) this.boss(sim);
    this.player(sim);
    if (sim.bossAnim?.kind === "thunder") this.bolt(sim);
    for (const p of this.parts) {
      ctx.globalAlpha = Math.max(0, 1 - p.life / p.max);
      ctx.fillStyle = p.color;
      ctx.fillRect(Math.round(p.x), Math.round(p.y), p.size, p.size);
    }
    ctx.globalAlpha = 1;
    for (const f of this.floaters) {
      ctx.globalAlpha = Math.max(0, 1 - f.t / 1.4);
      this.text(f.text, f.x, f.y - f.t * 14, 6, f.color, "center", true);
    }
    ctx.globalAlpha = 1;
    ctx.restore();

    this.hudBar(sim);
    this.banners(sim);

    if (this.flash > 0) {
      ctx.fillStyle = `rgba(255,250,210,${this.flash * 0.7})`;
      ctx.fillRect(-4, -4, VIEW_W + 8, VIEW_H + 8);
    }
  }

  // ------------------------------------------------------------------ text helpers

  text(s: string, x: number, y: number, size: number, color: string, align: CanvasTextAlign = "left", shadow = false) {
    const ctx = this.ctx;
    ctx.font = `${size}px ${FONT}`;
    ctx.textAlign = align;
    ctx.textBaseline = "top";
    if (shadow) {
      ctx.fillStyle = C.black;
      ctx.fillText(s, x + 1, y + 1);
    }
    ctx.fillStyle = color;
    ctx.fillText(s, x, y);
  }

  private wrap(s: string, maxW: number, size: number): string[] {
    const ctx = this.ctx;
    ctx.font = `${size}px ${FONT}`;
    const words = s.split(" ");
    const lines: string[] = [];
    let cur = "";
    for (const w of words) {
      const t = cur ? `${cur} ${w}` : w;
      if (ctx.measureText(t).width > maxW && cur) {
        lines.push(cur);
        cur = w;
      } else cur = t;
    }
    if (cur) lines.push(cur);
    return lines;
  }

  private bubble(s: string, x: number, y: number, maxW = 150) {
    const ctx = this.ctx;
    const lines = this.wrap(s, maxW - 10, 5);
    ctx.font = `5px ${FONT}`;
    const w = Math.min(maxW, Math.max(...lines.map((l) => ctx.measureText(l).width)) + 10);
    const h = lines.length * 8 + 7;
    const bx = Math.round(Math.max(4, Math.min(VIEW_W - w - 4, x - w / 2)));
    const by = Math.round(y - h);
    ctx.fillStyle = C.black;
    ctx.fillRect(bx + 2, by + 2, w, h);
    ctx.fillStyle = C.white;
    ctx.fillRect(bx, by, w, h);
    ctx.fillStyle = C.white;
    const tx = Math.round(Math.max(bx + 6, Math.min(bx + w - 10, x)));
    ctx.fillRect(tx, by + h, 4, 3);
    ctx.fillRect(tx + 1, by + h + 3, 2, 2);
    lines.forEach((l, i) => this.text(l, bx + 5, by + 5 + i * 8, 5, C.inkDark));
  }

  // ------------------------------------------------------------------ scenery

  private background(sim: DojoSim, cam: number) {
    const ctx = this.ctx;
    const f = FLOOR_INFO[sim.floor - 1];
    const roof = sim.floor === 5;
    if (roof) {
      const g = ctx.createLinearGradient(0, 18, 0, 150);
      g.addColorStop(0, "#070b26");
      g.addColorStop(1, "#3a1f5a");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, VIEW_W, 150);
      for (let i = 0; i < 40; i++) {
        const x = ((i * 97 + 13) % 640) - ((cam * 0.1) % 640);
        const xx = ((x % VIEW_W) + VIEW_W) % VIEW_W;
        const y = 22 + ((i * 53) % 90);
        ctx.fillStyle = i % 7 === 0 ? C.yellow : "#9aa6ff";
        ctx.fillRect(Math.round(xx), y, 1, 1);
      }
      // moon
      ctx.fillStyle = "#fff3c4";
      ctx.fillRect(250, 30, 16, 16);
      ctx.fillRect(248, 33, 20, 10);
      ctx.fillRect(253, 28, 10, 20);
      ctx.fillStyle = "#e8d89a";
      ctx.fillRect(255, 34, 3, 3);
      ctx.fillRect(260, 40, 2, 2);
      // far mountains
      ctx.fillStyle = "#24164a";
      for (let x = -40; x < VIEW_W + 40; x += 4) {
        const wx = x + cam * 0.3;
        const h = 22 + Math.round(14 * Math.sin(wx / 37) + 8 * Math.sin(wx / 13));
        ctx.fillRect(x - ((cam * 0.3) % 4), 150 - h, 4, h);
      }
      // roof railing
      ctx.fillStyle = C.red;
      ctx.fillRect(0, 128, VIEW_W, 3);
      for (let wx = Math.floor(cam / 24) * 24; wx < cam + VIEW_W + 24; wx += 24) {
        ctx.fillRect(Math.round(wx - cam), 128, 3, 22);
      }
      ctx.fillStyle = "#8a1a22";
      ctx.fillRect(0, 140, VIEW_W, 2);
    } else {
      ctx.fillStyle = f.wall;
      ctx.fillRect(0, 0, VIEW_W, 150);
      ctx.fillStyle = f.wallDark;
      ctx.fillRect(0, 18, VIEW_W, 10);
      ctx.fillRect(0, 140, VIEW_W, 10);
      // shoji panels and pillars, scrolling with the floor
      const step = 80;
      for (let wx = Math.floor(cam / step) * step - step; wx < cam + VIEW_W + step; wx += step) {
        const x = Math.round(wx - cam);
        ctx.fillStyle = C.wood;
        ctx.fillRect(x, 28, 8, 112);
        ctx.fillStyle = "#3e2716";
        ctx.fillRect(x + 6, 28, 2, 112);
        const panel = Math.floor(wx / step);
        if (panel % 3 === 1) {
          // hanging scroll with brush strokes (abstract, no real writing)
          ctx.fillStyle = C.wood;
          ctx.fillRect(x + 30, 38, 28, 2);
          ctx.fillStyle = C.paper;
          ctx.fillRect(x + 32, 40, 24, 56);
          ctx.fillStyle = f.trim;
          ctx.fillRect(x + 32, 40, 24, 3);
          ctx.fillStyle = C.inkDark;
          ctx.fillRect(x + 42, 48, 4, 2);
          ctx.fillRect(x + 43, 50, 2, 10);
          ctx.fillRect(x + 38, 56, 12, 2);
          ctx.fillRect(x + 40, 66, 8, 2);
          ctx.fillRect(x + 39, 70, 2, 10);
          ctx.fillRect(x + 47, 70, 2, 10);
          ctx.fillRect(x + 39, 80, 10, 2);
          ctx.fillStyle = C.red;
          ctx.fillRect(x + 46, 86, 5, 5);
          ctx.fillStyle = C.wood;
          ctx.fillRect(x + 30, 96, 28, 2);
        } else {
          // paper screen
          ctx.fillStyle = C.paper;
          ctx.fillRect(x + 14, 44, 60, 84);
          ctx.fillStyle = C.paperDark;
          for (let i = 1; i < 3; i++) ctx.fillRect(x + 14 + i * 20, 44, 2, 84);
          for (let j = 1; j < 4; j++) ctx.fillRect(x + 14, 44 + j * 21, 60, 2);
          ctx.fillStyle = C.wood;
          ctx.fillRect(x + 12, 42, 64, 2);
          ctx.fillRect(x + 12, 128, 64, 2);
          ctx.fillRect(x + 12, 42, 2, 88);
          ctx.fillRect(x + 74, 42, 2, 88);
        }
        // lantern
        if (panel % 2 === 0) {
          const ly = 30 + Math.round(Math.sin(this.time * 2 + panel) * 1);
          ctx.fillStyle = "#2a1a10";
          ctx.fillRect(x + 3, 28, 1, 6);
          ctx.fillStyle = C.red;
          ctx.fillRect(x - 1, ly + 4, 10, 12);
          ctx.fillRect(x - 2, ly + 6, 12, 8);
          ctx.fillStyle = C.yellow;
          ctx.fillRect(x + 1, ly + 7, 6, 6);
          ctx.fillStyle = "#2a1a10";
          ctx.fillRect(x, ly + 3, 8, 1);
          ctx.fillRect(x, ly + 16, 8, 1);
        }
      }
      ctx.fillStyle = f.trim;
      ctx.fillRect(0, 26, VIEW_W, 2);
    }
    // wooden floor
    ctx.fillStyle = f.floor;
    ctx.fillRect(0, 150, VIEW_W, 50);
    ctx.fillStyle = f.floorDark;
    for (let y = 150; y < 200; y += 7) ctx.fillRect(0, y, VIEW_W, 1);
    let row = 0;
    for (let y = 150; y < 200; y += 7, row++) {
      const off = row % 2 ? 24 : 0;
      for (let wx = Math.floor(cam / 48) * 48 - 48; wx < cam + VIEW_W + 48; wx += 48) {
        ctx.fillRect(Math.round(wx + off - cam), y, 1, 7);
      }
    }
    ctx.fillStyle = "rgba(0,0,0,0.25)";
    ctx.fillRect(0, 150, VIEW_W, 3);
  }

  private arenaDoor(sim: DojoSim) {
    const ctx = this.ctx;
    const f = FLOOR_INFO[sim.floor - 1];
    // at the far wall, just behind where the floor master stands
    const x = Math.round(sim.dir > 0 ? sim.len - 46 : 2);
    // gong on a frame behind the floor master
    ctx.fillStyle = C.wood;
    ctx.fillRect(x, 72, 4, 78);
    ctx.fillRect(x + 40, 72, 4, 78);
    ctx.fillRect(x - 4, 68, 52, 5);
    ctx.fillStyle = f.trim;
    ctx.fillRect(x + 8, 82, 28, 28);
    ctx.fillRect(x + 6, 86, 32, 20);
    ctx.fillRect(x + 12, 80, 20, 32);
    ctx.fillStyle = "rgba(0,0,0,0.25)";
    ctx.fillRect(x + 16, 90, 12, 12);
    ctx.fillStyle = "#2a1a10";
    ctx.fillRect(x + 21, 73, 1, 7);
    // floor number banner
    ctx.fillStyle = C.red;
    ctx.fillRect(x + 10, 120, 24, 18);
    this.text(`${sim.floor}F`, x + 22, 125, 6, C.yellow, "center");
  }

  // ------------------------------------------------------------------ fighters

  /** Draws pixel rects relative to feet at (x, feetY), mirrored when facing left. */
  private puppet(x: number, feetY: number, facing: 1 | -1, scale: number, drawFn: (r: Rect) => void) {
    const ctx = this.ctx;
    const bx = Math.round(x);
    const by = Math.round(feetY);
    const r: Rect = (dx, dy, w, h, c) => {
      ctx.fillStyle = c;
      const lx = facing > 0 ? dx : -(dx + w);
      ctx.fillRect(bx + lx * scale, by + dy * scale, w * scale, h * scale);
    };
    drawFn(r);
  }

  private shadow(x: number, w: number) {
    const ctx = this.ctx;
    ctx.fillStyle = "rgba(0,0,0,0.3)";
    ctx.fillRect(Math.round(x - w / 2), GROUND, w, 2);
  }

  private playerPose(sim: DojoSim) {
    const p = sim.player;
    let x = p.x;
    let y = p.y;
    let pose: "stand" | "walk" | "duck" | "punch" | "kick" | "lowpunch" | "lowkick" | "air" | "airkick" | "airpunch" | "hurt" | "down" | "bow" = "stand";
    let frame = Math.floor(p.walkT * 8) % 2;
    const a = sim.bossAnim;
    if (sim.mode === "dying") pose = "down";
    else if (sim.mode === "won") pose = "bow";
    else if (a && (sim.mode === "boss" || sim.mode === "bossDown") && a.kind !== "down") {
      const fx = sim.fightX;
      const k = a.t / a.dur;
      const contact = sim.bossX - sim.dir * (a.kind === "block" ? 26 : 22);
      if (a.kind === "combo") {
        if (k < 0.2) { x = fx + (contact - fx) * (k / 0.2); pose = "walk"; frame = Math.floor(a.t * 16) % 2; }
        else if (k < 0.75) { x = contact; pose = Math.floor(a.t * 9) % 2 ? "punch" : "kick"; }
        else { const q = (k - 0.75) / 0.25; x = contact + (fx - contact) * q; y = Math.sin(q * Math.PI) * 14; pose = "air"; }
      } else if (a.kind === "thunder") {
        const tc = sim.bossX - sim.dir * 30;
        if (k < 0.22) { x = fx + (tc - fx) * (k / 0.22); pose = "walk"; frame = Math.floor(a.t * 16) % 2; }
        else if (k < 0.4) { x = tc; y = ((k - 0.22) / 0.18) * 30; pose = "air"; }
        else if (k < 0.65) { x = tc + sim.dir * ((k - 0.4) / 0.25) * 10; y = 30 - ((k - 0.4) / 0.25) * 14; pose = "airkick"; }
        else { const q = (k - 0.65) / 0.35; x = tc + sim.dir * 10 + (fx - tc - sim.dir * 10) * q; y = 16 * (1 - q) + Math.sin(q * Math.PI) * 10; pose = "air"; }
      } else if (a.kind === "block") {
        if (k < 0.2) { x = fx + (contact - fx) * (k / 0.2); pose = "walk"; frame = Math.floor(a.t * 16) % 2; }
        else if (k < 0.5) { x = contact; pose = "punch"; }
        else { const q = (k - 0.5) / 0.5; x = contact + (fx - contact) * q; y = Math.sin(q * Math.PI) * 8; pose = "hurt"; }
      }
      return { x, y, pose, frame, facing: sim.dir as 1 | -1 };
    } else if (p.hurtT > 0) pose = "hurt";
    else if (p.y > 0) pose = p.attack ? (p.attack.kind === "kick" ? "airkick" : "airpunch") : "air";
    else if (p.attack) pose = p.attack.low ? (p.attack.kind === "kick" ? "lowkick" : "lowpunch") : p.attack.kind;
    else if (p.ducking) pose = "duck";
    else if (p.walking) pose = "walk";
    return { x, y, pose, frame, facing: p.facing };
  }

  private player(sim: DojoSim) {
    const p = sim.player;
    if (sim.mode === "over") return;
    const { x, y, pose, frame, facing } = this.playerPose(sim);
    this.shadow(x, 14);
    if (p.invuln > 0 && sim.mode === "run" && Math.floor(this.time * 14) % 2 === 0) return;
    const belt = BELTS[Math.min(BELTS.length - 1, sim.floor - 1)];
    const tail = Math.floor(this.time * 6) % 2;
    this.puppet(x, GROUND - y, facing, 1, (r) => drawStudent(r, pose, frame, belt, tail));
    if (pose === "down") {
      // dizzy stars
      for (let i = 0; i < 3; i++) {
        const a = this.time * 5 + (i * Math.PI * 2) / 3;
        this.ctx.fillStyle = C.yellow;
        this.ctx.fillRect(Math.round(x + Math.cos(a) * 9), Math.round(GROUND - 12 + Math.sin(a) * 3), 2, 2);
      }
    }
  }

  private enemy(e: Enemy, sim: DojoSim) {
    void sim;
    this.shadow(e.x, e.kind === "blob" ? 12 : 12);
    const wob = e.stunT > 0;
    if (e.kind === "blob") {
      this.puppet(e.x, GROUND - e.y, e.facing, 1, (r) => drawBlob(r, Math.floor(e.t * 4) % 2));
      return;
    }
    const frame = Math.floor(e.t * 7) % 2;
    const band = e.kind === "thrower" ? "#2ad1c9" : e.kind === "scroll" ? C.yellow : "#b04cff";
    this.puppet(e.x, GROUND, e.facing, 1, (r) => drawNinja(r, frame, band, e.kind === "scroll", e.windup > 0, wob));
  }

  private shot(x: number, y: number, vx: number) {
    const ctx = this.ctx;
    const spin = Math.floor(this.time * 12) % 2;
    ctx.fillStyle = "#6a4fc0";
    if (spin) {
      ctx.fillRect(Math.round(x) - 3, Math.round(y) - 1, 6, 2);
      ctx.fillRect(Math.round(x) - 1, Math.round(y) - 3, 2, 6);
    } else {
      ctx.fillRect(Math.round(x) - 2, Math.round(y) - 2, 4, 4);
      ctx.fillStyle = C.inkDark;
      ctx.fillRect(Math.round(x) - 1, Math.round(y) - 1, 2, 2);
    }
    ctx.fillStyle = "rgba(106,79,192,0.4)";
    ctx.fillRect(Math.round(x - Math.sign(vx) * 6) - 1, Math.round(y), 3, 1);
  }

  private boss(sim: DojoSim) {
    const a = sim.bossAnim;
    let x = sim.bossDrawX();
    let pose: BossPose = Math.floor(this.time * 2) % 2 ? "idle" : "idle2";
    if (a) {
      const k = a.t / a.dur;
      if (a.kind === "combo" && k > 0.22 && k < 0.8) { pose = "hit"; x += sim.dir * (Math.floor(a.t * 18) % 2); }
      if (a.kind === "thunder" && k > 0.42 && k < 0.95) { pose = "hit"; x += sim.dir * Math.min(10, (k - 0.42) * 30); }
      if (a.kind === "block" && k > 0.1 && k < 0.65) pose = "block";
      if (a.kind === "down") {
        if (k > 0.25) return;
        pose = "hit";
      }
    }
    if (sim.mode === "bossDown" && !a) return;
    const id = FLOOR_INFO[sim.floor - 1].boss;
    this.shadow(x, 26);
    const facing = (-sim.dir) as 1 | -1;
    const flashWhite = pose === "hit" && Math.floor(this.time * 20) % 2 === 0;
    this.puppet(x, GROUND, facing, 1.5, (r) => drawBoss(r, id, pose, flashWhite));
    if (pose === "block") {
      // shimmering ink shield
      const ctx = this.ctx;
      const sxp = Math.round(x + facing * 22);
      ctx.fillStyle = Math.floor(this.time * 16) % 2 ? C.cyan : C.white;
      for (let i = -5; i <= 5; i++) ctx.fillRect(sxp + Math.round(Math.cos((i / 5) * 1.2) * 4 * facing) - 1, GROUND - 26 + i * 4, 2, 3);
    }
  }

  private bolt(sim: DojoSim) {
    const a = sim.bossAnim!;
    const k = a.t / a.dur;
    if (k < 0.32 || k > 0.62) return;
    const ctx = this.ctx;
    const x0 = sim.bossX - sim.dir * 26;
    ctx.fillStyle = C.yellow;
    let x = x0;
    for (let y = 18; y < GROUND - 30; y += 6) {
      ctx.fillRect(Math.round(x), y, 3, 6);
      x += (Math.floor(y / 6) % 2 ? 4 : -4);
    }
    ctx.fillStyle = C.white;
    ctx.fillRect(Math.round(x0) + 1, 18, 1, 40);
  }

  // ------------------------------------------------------------------ HUD and banners

  private hudBar(sim: DojoSim) {
    const ctx = this.ctx;
    ctx.fillStyle = "rgba(5,8,24,0.92)";
    ctx.fillRect(0, 0, VIEW_W, 17);
    ctx.fillStyle = C.blue;
    ctx.fillRect(0, 17, VIEW_W, 1);
    this.text("ENERGY", 4, 3, 4, C.cyan);
    for (let i = 0; i < MAX_ENERGY; i++) {
      ctx.fillStyle = i < sim.energy ? (sim.energy <= 3 ? C.red : C.green) : "#1c2450";
      ctx.fillRect(4 + i * 5, 9, 4, 5);
    }
    this.text("THUNDER", 62, 3, 4, C.yellow);
    const full = sim.streak.meter >= METER_MAX;
    for (let i = 0; i < METER_MAX; i++) {
      const on = i < sim.streak.meter;
      ctx.fillStyle = on ? (full && Math.floor(this.time * 6) % 2 ? C.white : C.yellow) : "#1c2450";
      // little lightning pip
      const bx = 63 + i * 10;
      ctx.fillRect(bx + 3, 8, 3, 2);
      ctx.fillRect(bx + 2, 10, 3, 2);
      ctx.fillRect(bx + 1, 12, 5, 1);
      ctx.fillRect(bx + 3, 13, 2, 2);
    }
    if (full && sim.mode === "run") this.text("T!", 94, 9, 4, C.white);

    // tower floors
    this.text("FLOOR", 112, 3, 4, C.cyan);
    for (let i = 1; i <= 5; i++) {
      ctx.fillStyle = i < sim.floor ? C.green : i === sim.floor ? C.yellow : "#1c2450";
      ctx.fillRect(112 + (i - 1) * 7, 9, 6, 5);
    }
    if (sim.fight && (sim.mode === "boss" || sim.mode === "bossDown")) {
      const f = FLOOR_INFO[sim.floor - 1];
      this.text(f.bossName, VIEW_W - 4, 3, 4, C.red, "right");
      const n = sim.fight.maxHp;
      const w = 12;
      for (let i = 0; i < n; i++) {
        ctx.fillStyle = i < sim.fight.hp ? C.red : "#3a1020";
        ctx.fillRect(VIEW_W - 4 - (n - i) * (w + 2), 9, w, 5);
      }
    } else {
      // progress toward the floor master
      const prog = sim.hud().progress;
      this.text("MASTER", VIEW_W - 4, 3, 4, C.red, "right");
      ctx.fillStyle = "#1c2450";
      ctx.fillRect(170, 10, 120, 3);
      ctx.fillStyle = C.red;
      ctx.fillRect(170, 10, Math.round(120 * prog), 3);
      ctx.fillStyle = C.white;
      ctx.fillRect(170 + Math.round(120 * prog) - 1, 8, 3, 7);
      ctx.fillStyle = C.red;
      ctx.fillRect(VIEW_W - 26, 8, 7, 7);
    }
  }

  private banners(sim: DojoSim) {
    const ctx = this.ctx;
    const f = FLOOR_INFO[sim.floor - 1];
    if (sim.mode === "intro") {
      const k = Math.min(1, sim.modeT / 0.3);
      ctx.fillStyle = `rgba(5,8,24,${0.75 * k})`;
      ctx.fillRect(0, 50, VIEW_W, 76);
      ctx.fillStyle = f.trim;
      ctx.fillRect(0, 50, VIEW_W, 2);
      ctx.fillRect(0, 124, VIEW_W, 2);
      this.text(`FLOOR ${sim.floor}`, VIEW_W / 2, 60, 12, C.yellow, "center", true);
      this.text(f.hall, VIEW_W / 2, 80, 7, C.white, "center", true);
      this.text(`MASTER: ${f.bossName}`, VIEW_W / 2, 96, 5, C.red, "center", true);
      this.text(sim.dir > 0 ? "GO RIGHT >>" : "<< GO LEFT", VIEW_W / 2, 110, 5, Math.floor(this.time * 3) % 2 ? C.cyan : C.white, "center");
    }
    if (sim.mode === "bossIntro") {
      const bx = sim.bossDrawX();
      this.bubble(f.taunt, bx - sim.camX - sim.dir * 30, GROUND - 58, 170);
      ctx.fillStyle = "rgba(5,8,24,0.8)";
      ctx.fillRect(0, 26, VIEW_W, 20);
      this.text(f.bossName, VIEW_W / 2, 32, 8, C.red, "center", true);
    }
    if (sim.mode === "boss" && !sim.bossAnim) {
      const last = sim.lastBoss;
      const say = last && !last.correct ? f.block : !last ? "Answer right to land a hit!" : last.thunder ? "Ooof! What a kick!" : "Hmph! Lucky shot!";
      this.bubble(say, sim.bossX - sim.camX - sim.dir * 26, GROUND - 58, 150);
      if (!this.card && Math.floor(this.time * 2) % 2) this.text("ANSWER WITH 1-4 OR A-D", VIEW_W / 2, 24, 5, C.yellow, "center", true);
    }
    if (sim.mode === "bossDown") {
      this.bubble(f.bow, sim.bossX - sim.camX - sim.dir * 26, GROUND - 58, 150);
    }
    if (sim.mode === "scroll") {
      ctx.fillStyle = "rgba(5,8,24,0.55)";
      ctx.fillRect(0, 18, VIEW_W, VIEW_H - 18);
      if (!this.card) {
        this.scrollIcon(VIEW_W / 2, 70);
        this.text("QUESTION SCROLL!", VIEW_W / 2, 100, 7, C.yellow, "center", true);
        this.text("ANSWER IT FOR ENERGY", VIEW_W / 2, 114, 5, C.white, "center", true);
      }
    }
    if (this.card && (sim.mode === "boss" || sim.mode === "scroll" || sim.mode === "bossDown")) this.questionCard(this.card);
    if (sim.mode === "dying") this.text("OOF! GET UP!", VIEW_W / 2, 80, 8, C.yellow, "center", true);
    if (sim.mode === "won") {
      this.text("TOWER CLEARED!", VIEW_W / 2, 60, 10, C.yellow, "center", true);
    }
  }

  private fit(s: string, maxW: number, size: number): string {
    const ctx = this.ctx;
    ctx.font = `${size}px ${FONT}`;
    if (ctx.measureText(s).width <= maxW) return s;
    let t = s;
    while (t.length > 1 && ctx.measureText(`${t}..`).width > maxW) t = t.slice(0, -1);
    return `${t.trimEnd()}..`;
  }

  private questionCard(card: QuestionCard) {
    const ctx = this.ctx;
    const x = 10;
    const w = VIEW_W - 20;
    let lines = this.wrap(card.prompt, w - 14, 5);
    if (lines.length > 3) lines = [...lines.slice(0, 2), this.fit(lines.slice(2).join(" "), w - 14, 5)];
    const top = 22;
    const h = 14 + lines.length * 8 + 2 * 13 + 4;
    // paper scroll on two wooden rods
    ctx.fillStyle = "rgba(0,0,0,0.45)";
    ctx.fillRect(x + 3, top + 3, w, h);
    ctx.fillStyle = C.paper;
    ctx.fillRect(x, top, w, h);
    ctx.fillStyle = C.paperDark;
    ctx.fillRect(x, top + h - 2, w, 2);
    ctx.fillStyle = C.wood;
    ctx.fillRect(x - 4, top - 2, w + 8, 3);
    ctx.fillRect(x - 4, top + h - 1, w + 8, 3);
    ctx.fillStyle = C.red;
    ctx.fillRect(x - 6, top - 3, 3, 5);
    ctx.fillRect(x + w + 3, top - 3, 3, 5);
    ctx.fillRect(x - 6, top + h - 2, 3, 5);
    ctx.fillRect(x + w + 3, top + h - 2, 3, 5);
    this.text(card.title, x + 6, top + 4, 4, "#a01a22");
    lines.forEach((l, i) => this.text(l, x + 6, top + 12 + i * 8, 5, C.inkDark));
    const cy = top + 13 + lines.length * 8;
    const cw = (w - 16) / 2;
    card.choices.forEach((c, i) => {
      const bx = Math.round(x + 6 + (i % 2) * (cw + 4));
      const by = Math.round(cy + Math.floor(i / 2) * 13);
      const done = card.picked !== null;
      const right = done && i === card.answer;
      const wrong = done && i === card.picked && i !== card.answer;
      ctx.fillStyle = right ? "#0d3a22" : wrong ? "#3a0d12" : "#111c5a";
      ctx.fillRect(bx, by, Math.floor(cw), 11);
      ctx.fillStyle = right ? C.green : wrong ? C.red : "#2a3a90";
      ctx.fillRect(bx, by + 10, Math.floor(cw), 1);
      this.text("ABCD"[i], bx + 3, by + 3, 5, C.yellow);
      this.text(this.fit(c, cw - 16, 5), bx + 12, by + 3, 5, right ? C.green : wrong ? "#ffb0b4" : C.white);
    });
  }

  private scrollIcon(x: number, y: number) {
    const ctx = this.ctx;
    ctx.fillStyle = C.wood;
    ctx.fillRect(x - 22, y - 12, 44, 4);
    ctx.fillRect(x - 22, y + 10, 44, 4);
    ctx.fillStyle = C.paper;
    ctx.fillRect(x - 18, y - 8, 36, 18);
    ctx.fillStyle = C.red;
    ctx.fillRect(x - 24, y - 12, 3, 4);
    ctx.fillRect(x + 21, y - 12, 3, 4);
    ctx.fillRect(x - 24, y + 10, 3, 4);
    ctx.fillRect(x + 21, y + 10, 3, 4);
    this.text("?", x, y - 4, 10, C.inkDark, "center");
  }
}

// ==================================================================== sprite drawings

type StudentPose = "stand" | "walk" | "duck" | "punch" | "kick" | "lowpunch" | "lowkick" | "air" | "airkick" | "airpunch" | "hurt" | "down" | "bow";

function drawStudent(r: Rect, pose: StudentPose, frame: number, belt: string, tail: number) {
  const { gi, giShade, skin, hair, red } = C;
  const dark = C.inkDark;
  const head = (hx: number, hy: number) => {
    r(hx - 3, hy - 2, 7, 3, hair);
    r(hx - 3, hy, 6, 6, skin);
    r(hx - 3, hy, 2, 3, hair);
    r(hx + 1, hy + 2, 1, 2, dark);
    r(hx - 3, hy + 1, 7, 1, red);
    r(hx - 6, hy + 1 + tail, 3, 1, red);
    r(hx - 8, hy + 2 - tail, 2, 1, red);
  };
  const torso = (tx: number, ty: number, h = 9) => {
    r(tx - 4, ty, 8, h, gi);
    r(tx - 4, ty, 1, h, giShade);
    r(tx, ty, 1, 4, giShade);
    r(tx - 4, ty + h - 2, 8, 2, belt);
    r(tx + 1, ty + h - 1, 2, 3, belt);
  };
  switch (pose) {
    case "duck":
    case "lowpunch":
    case "lowkick": {
      head(0, -17);
      torso(0, -11, 7);
      if (pose === "lowkick") {
        r(-5, -4, 5, 4, gi);
        r(0, -4, 14, 3, gi);
        r(14, -5, 3, 4, skin);
        r(-6, -1, 3, 1, skin);
      } else {
        r(-6, -4, 11, 4, gi);
        r(-7, -1, 3, 1, skin);
        r(4, -1, 3, 1, skin);
      }
      if (pose === "lowpunch") {
        r(3, -9, 9, 2, gi);
        r(12, -10, 3, 3, skin);
      } else {
        r(3, -9, 4, 2, gi);
        r(7, -10, 2, 3, skin);
      }
      r(-5, -10, 2, 5, gi);
      return;
    }
    case "down":
      r(-12, -5, 6, 5, skin);
      r(-12, -6, 6, 2, hair);
      r(-6, -5, 9, 5, gi);
      r(-1, -5, 2, 5, belt);
      r(3, -4, 10, 4, gi);
      r(13, -3, 2, 3, skin);
      return;
    case "bow":
      head(3, -23);
      torso(0, -19, 9);
      r(-4, -10, 3, 9, gi);
      r(1, -10, 3, 9, gi);
      r(2, -16, 3, 6, gi);
      return;
    default:
      break;
  }
  const air = pose === "air" || pose === "airkick" || pose === "airpunch";
  const lean = pose === "kick" || pose === "airkick" ? -1 : pose === "hurt" ? -2 : 0;
  head(lean, -26);
  torso(lean, -20);
  // legs
  if (air) {
    if (pose === "airkick") {
      r(-4, -10, 4, 6, gi);
      r(0, -11, 14, 3, gi);
      r(14, -12, 3, 4, skin);
      r(-5, -5, 3, 2, skin);
    } else {
      r(-4, -10, 8, 5, gi);
      r(-5, -6, 4, 3, gi);
      r(2, -6, 4, 3, gi);
      r(-5, -3, 3, 1, skin);
      r(3, -3, 3, 1, skin);
    }
  } else if (pose === "kick") {
    r(-4, -10, 3, 9, gi);
    r(-5, -1, 4, 1, skin);
    r(0, -16, 13, 3, gi);
    r(13, -17, 3, 4, skin);
  } else if (pose === "walk") {
    if (frame) {
      r(-5, -10, 3, 9, gi);
      r(2, -10, 3, 9, gi);
      r(-6, -1, 4, 1, skin);
      r(2, -1, 4, 1, skin);
    } else {
      r(-3, -10, 3, 9, gi);
      r(0, -10, 3, 9, gi);
      r(-3, -1, 3, 1, skin);
      r(0, -1, 4, 1, skin);
    }
  } else {
    r(-5, -10, 3, 9, gi);
    r(2, -10, 3, 9, gi);
    r(-6, -1, 4, 1, skin);
    r(2, -1, 4, 1, skin);
  }
  // arms
  if (pose === "punch" || pose === "airpunch") {
    r(3 + lean, -19, 9, 2, gi);
    r(12 + lean, -20, 3, 3, skin);
    r(-6 + lean, -19, 2, 5, gi);
  } else if (pose === "hurt") {
    r(-6, -24, 2, 6, gi);
    r(2, -24, 2, 6, gi);
    r(-6, -26, 2, 2, skin);
    r(2, -26, 2, 2, skin);
  } else {
    r(-6 + lean, -19, 2, 6, gi);
    r(-6 + lean, -13, 2, 2, skin);
    r(3 + lean, -18, 4, 2, gi);
    r(7 + lean, -19, 2, 3, skin);
  }
}

function drawNinja(r: Rect, frame: number, band: string, scroll: boolean, windup: boolean, wobble: boolean) {
  const body = C.ink;
  const hi = C.inkHi;
  const lean = wobble ? -2 : 0;
  if (scroll) {
    r(-8 + lean, -24, 4, 12, C.yellow);
    r(-9 + lean, -25, 6, 2, C.red);
    r(-9 + lean, -13, 6, 2, C.red);
  }
  // head (hood) with big friendly eyes
  r(-4 + lean, -27, 8, 7, body);
  r(-3 + lean, -25, 7, 3, C.white);
  r(0 + lean, -24, 1, 2, C.black);
  r(2 + lean, -24, 1, 2, C.black);
  r(-4 + lean, -27, 8, 1, band);
  r(-6 + lean, -27 + frame, 2, 1, band);
  // body
  r(-4 + lean, -20, 8, 10, body);
  r(-4 + lean, -20, 1, 10, hi);
  r(-4 + lean, -12, 8, 1, band);
  // legs
  if (frame) {
    r(-5, -10, 3, 9, body);
    r(2, -10, 3, 9, body);
    r(-6, -1, 4, 1, C.inkDark);
    r(2, -1, 4, 1, C.inkDark);
  } else {
    r(-3, -10, 3, 9, body);
    r(0, -10, 3, 9, body);
    r(-3, -1, 3, 1, C.inkDark);
    r(0, -1, 4, 1, C.inkDark);
  }
  // arms
  if (windup) {
    r(-6 + lean, -28, 2, 9, body);
    r(-7 + lean, -31, 4, 4, "#6a4fc0");
  } else if (wobble) {
    r(-6, -26, 2, 6, body);
    r(4, -26, 2, 6, body);
  } else {
    r(3 + lean, -18, 6, 2, body);
    r(9 + lean, -19, 2, 3, hi);
    r(-6 + lean, -19, 2, 6, body);
  }
  if (wobble) {
    // dizzy swirl
    r(-2, -32, 1, 1, C.yellow);
    r(2, -33, 1, 1, C.yellow);
  }
}

function drawBlob(r: Rect, frame: number) {
  const body = "#3a2a6a";
  r(-4, -9 + frame, 8, 1, body);
  r(-5, -8 + frame, 10, 2, body);
  r(-6, -6 + frame, 12, 6 - frame, body);
  r(-6, -1, 12, 1, body);
  r(-4, -8 + frame, 2, 1, "#7a64c8");
  r(0, -6 + frame, 3, 3, C.white);
  r(3, -6 + frame, 2, 3, C.white);
  r(2, -5 + frame, 1, 2, C.black);
  r(4, -5 + frame, 1, 2, C.black);
  r(-8, -1, 2, 1, body);
  r(6, -1, 2, 1, body);
}

type BossPose = "idle" | "idle2" | "block" | "hit";

function drawBoss(r: Rect, id: BossId, pose: BossPose, flashWhite: boolean) {
  const bob = pose === "idle2" ? 1 : 0;
  const lean = pose === "hit" ? -2 : 0;
  const W = (c: string) => (flashWhite ? C.white : c);
  const eyes = (x: number, y: number, c = C.black) => {
    r(x, y, 1, 2, W(c));
    r(x + 3, y, 1, 2, W(c));
  };
  const guard = (c: string, fist: string) => {
    if (pose === "block") {
      r(1 + lean, -20 + bob, 8, 2, W(c));
      r(1 + lean, -17 + bob, 8, 2, W(c));
      r(8 + lean, -21 + bob, 2, 6, W(fist));
    } else if (pose === "hit") {
      r(-7, -24, 2, 6, W(c));
      r(4, -26, 2, 6, W(c));
    }
  };
  switch (id) {
    case "wordwhirl": {
      // purple robe, hair bun, round glasses, giant quill
      r(-6, -22 + bob, 12, 22 - bob, W("#7b3fc4"));
      r(-7, -6, 14, 6, W("#5e2d99"));
      r(-6, -14 + bob, 12, 2, W(C.yellow));
      r(-3 + lean, -30 + bob, 7, 7, W(C.skin));
      r(-4 + lean, -32 + bob, 9, 3, W("#3b2a1a"));
      r(-2 + lean, -35 + bob, 5, 3, W("#3b2a1a"));
      r(-4 + lean, -30 + bob, 2, 5, W("#3b2a1a"));
      r(-1 + lean, -28 + bob, 6, 1, W(C.cyan));
      eyes(0 + lean, -27 + bob);
      r(1 + lean, -25 + bob, 3, 1, W(C.red));
      if (pose !== "block" && pose !== "hit") {
        r(5, -20 + bob, 4, 2, W("#7b3fc4"));
        r(8, -38 + bob, 1, 36, W("#8a5a2b"));
        r(6, -42 + bob, 4, 10, W(C.white));
        r(7, -45 + bob, 2, 3, W(C.white));
        r(8, -2, 1, 2, W(C.black));
        r(8, -20 + bob, 2, 3, W(C.skin));
      }
      guard("#7b3fc4", C.skin);
      break;
    }
    case "abacus": {
      // big friendly ox in an orange gi, holding an abacus
      r(-5, -11, 4, 11, W("#7a4a22"));
      r(1, -11, 4, 11, W("#7a4a22"));
      r(-6, -1, 5, 1, W("#2a1a10"));
      r(1, -1, 5, 1, W("#2a1a10"));
      r(-8, -26 + bob, 16, 16, W("#ff9a3c"));
      r(-8, -13 + bob, 16, 2, W(C.black));
      r(-1, -26 + bob, 2, 8, W("#d9772a"));
      r(-5 + lean, -33 + bob, 10, 8, W("#8a5a2b"));
      r(-7 + lean, -36 + bob, 2, 4, W("#f3e6c4"));
      r(5 + lean, -36 + bob, 2, 4, W("#f3e6c4"));
      r(-8 + lean, -37 + bob, 2, 2, W("#f3e6c4"));
      r(6 + lean, -37 + bob, 2, 2, W("#f3e6c4"));
      r(1 + lean, -29 + bob, 6, 4, W("#e0b090"));
      r(3 + lean, -28 + bob, 1, 1, W(C.black));
      r(5 + lean, -28 + bob, 1, 1, W(C.black));
      eyes(-1 + lean, -32 + bob);
      if (pose !== "block" && pose !== "hit") {
        r(6, -24 + bob, 12, 13, W("#5a3a22"));
        r(7, -23 + bob, 10, 11, W("#2a1a10"));
        for (let i = 0; i < 4; i++) {
          r(7, -21 + i * 3 + bob, 10, 1, W("#8a5a2b"));
          for (let j = 0; j < 3; j++) r(8 + ((i + j * 3) % 8), -22 + i * 3 + bob, 2, 2, W([C.red, C.yellow, C.cyan, C.green][(i + j) % 4]));
        }
      }
      guard("#ff9a3c", "#8a5a2b");
      break;
    }
    case "gavel": {
      // judge's robe, curly white wig, giant wooden gavel
      r(-6, -22 + bob, 12, 22 - bob, W("#1b1b2a"));
      r(-7, -4, 14, 4, W("#1b1b2a"));
      r(-2, -22 + bob, 4, 4, W(C.white));
      r(-1, -18 + bob, 2, 2, W(C.white));
      r(-3 + lean, -30 + bob, 7, 7, W(C.skin2));
      r(-5 + lean, -33 + bob, 10, 4, W("#e8e8f0"));
      r(-5 + lean, -30 + bob, 2, 8, W("#e8e8f0"));
      r(4 + lean, -30 + bob, 2, 3, W("#e8e8f0"));
      r(-6 + lean, -26 + bob, 2, 3, W("#d0d0dc"));
      eyes(0 + lean, -28 + bob);
      r(0 + lean, -25 + bob, 4, 1, W("#5a2a1a"));
      if (pose !== "block" && pose !== "hit") {
        r(4, -20 + bob, 3, 2, W("#1b1b2a"));
        r(6, -32 + bob, 2, 14, W("#8a5a2b"));
        r(2, -38 + bob, 10, 6, W("#a06a35"));
        r(2, -36 + bob, 10, 1, W(C.yellow));
        r(6, -20 + bob, 2, 3, W(C.skin2));
      }
      guard("#1b1b2a", C.skin2);
      break;
    }
    case "momentum": {
      // lab coat, goggles, wild hair, a swinging pendulum ball
      r(-5, -10, 4, 10, W("#2a3a6a"));
      r(1, -10, 4, 10, W("#2a3a6a"));
      r(-6, -24 + bob, 12, 16, W(C.white));
      r(-6, -24 + bob, 1, 16, W(C.giShade));
      r(-1, -24 + bob, 2, 12, W(C.cyan));
      r(-3 + lean, -31 + bob, 7, 7, W(C.skin));
      for (let i = 0; i < 5; i++) r(-5 + i * 2 + lean, -35 + bob - (i % 2), 2, 4, W("#c0c8d8"));
      r(-3 + lean, -30 + bob, 8, 2, W("#3a3a4a"));
      r(-1 + lean, -30 + bob, 2, 2, W(C.cyan));
      r(3 + lean, -30 + bob, 2, 2, W(C.cyan));
      r(0 + lean, -26 + bob, 4, 1, W("#5a2a1a"));
      if (pose !== "block" && pose !== "hit") {
        const sw = bob ? 2 : -2;
        r(5, -22 + bob, 4, 2, W(C.white));
        r(8, -26 + bob, 2, 4, W(C.skin));
        r(9 + sw / 2, -22 + bob, 1, 10, W("#9aa6ff"));
        r(7 + sw, -12 + bob, 6, 6, W("#c0c8d8"));
        r(8 + sw, -11 + bob, 2, 2, W(C.white));
      }
      guard(C.white, C.skin);
      break;
    }
    case "inkmaster": {
      // tall ink-black master with a red cape and a golden mask, holding a giant brush
      r(-9, -26 + bob, 4, 24, W(C.red));
      r(-10, -4, 5, 3, W("#a01a22"));
      r(-5, -11, 4, 11, W(C.inkDark));
      r(1, -11, 4, 11, W(C.inkDark));
      r(-6, -26 + bob, 12, 16, W(C.ink));
      r(-6, -26 + bob, 1, 16, W(C.inkHi));
      r(-6, -13 + bob, 12, 2, W(C.yellow));
      r(-4 + lean, -34 + bob, 8, 8, W(C.inkDark));
      r(-3 + lean, -32 + bob, 7, 4, W(C.yellow));
      r(-1 + lean, -31 + bob, 2, 1, W(C.black));
      r(2 + lean, -31 + bob, 2, 1, W(C.black));
      r(-4 + lean, -36 + bob, 8, 2, W(C.red));
      if (pose !== "block" && pose !== "hit") {
        r(5, -22 + bob, 4, 2, W(C.ink));
        r(9, -40 + bob, 2, 34, W("#8a5a2b"));
        r(8, -8 + bob, 4, 5, W(C.inkDark));
        r(9, -4 + bob, 2, 2, W("#6a4fc0"));
      }
      guard(C.ink, C.inkDark);
      break;
    }
  }
}
