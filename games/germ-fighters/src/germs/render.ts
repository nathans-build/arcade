import { moverPos, pulseOn, pulseWarn, SCREEN_H, SCREEN_W, type Level } from "./levels";
import { FINAL_BOSS, POWERS, ROBOTS, type PowerId, type RobotId, type StageTheme } from "./robots";
import { BOOSTS, type BoostId } from "./boosts";
import { BOSS_H, BOSS_W, MAX_ENERGY, PH, POWER_MAX, PW, QUIZ_BOT_H, QUIZ_BOT_W, type Sim } from "./sim";

/*
 * Pixel art, all drawn in code on a 320x200 logical screen (the canvas is 640x400, scaled x2).
 * Every character here is original: Rivet the repair robot, the eight Robo Masters, Lord Static
 * and the glitched mini-bots.
 */

type Ctx = CanvasRenderingContext2D;

export interface Particle { x: number; y: number; vx: number; vy: number; life: number; max: number; color: string; size: number }

function r(ctx: Ctx, x: number, y: number, w: number, h: number, c: string) {
  ctx.fillStyle = c;
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}

/** A chunky pixel "circle" made of rows. */
function disc(ctx: Ctx, cx: number, cy: number, rad: number, c: string) {
  ctx.fillStyle = c;
  for (let dy = -rad; dy <= rad; dy++) {
    const half = Math.round(Math.sqrt(Math.max(0, rad * rad - dy * dy)));
    ctx.fillRect(Math.round(cx - half), Math.round(cy + dy), half * 2, 1);
  }
}

export const HERO_COLORS = { main: "#2ad1c9", dark: "#1a5a9a" };

export function powerColors(p: PowerId | null): { main: string; dark: string } {
  if (!p) return HERO_COLORS;
  return { main: POWERS[p].color, dark: POWERS[p].color2 };
}

// ------------------------------------------------------------------ hero

export interface HeroPose {
  facing: 1 | -1;
  frame: number;
  air: boolean;
  colors: { main: string; dark: string };
  shield?: boolean;
  dash?: boolean;
  glide?: boolean;
  blink?: boolean;
  /** Power-ups: see-through Phase Cloak, Spring Boots, Shield Bubble, Turbo Treads. */
  phase?: boolean;
  spring?: boolean;
  bubble?: boolean;
  turbo?: boolean;
}

/** Rivet, drawn with its hitbox (12x20) at x,y; the sprite is 16x22. */
export function drawHero(ctx: Ctx, x: number, y: number, pose: HeroPose) {
  if (pose.blink) return;
  const { main, dark } = pose.colors;
  ctx.save();
  if (pose.phase) ctx.globalAlpha = 0.45 + 0.1 * Math.sin(pose.frame);
  ctx.translate(Math.round(x + PW / 2), Math.round(y));
  if (pose.facing < 0) ctx.scale(-1, 1);
  const ox = -8;
  if (pose.glide) {
    // A big leaf held overhead.
    r(ctx, ox - 4, -6, 24, 3, "#3fbf4a");
    r(ctx, ox - 2, -8, 20, 2, "#7dff7a");
    r(ctx, ox + 7, -4, 1, 6, "#1e7a3a");
  }
  if (pose.dash) {
    r(ctx, ox - 10, 8, 8, 2, "#ffe066");
    r(ctx, ox - 14, 12, 10, 2, "#ffe06688");
  }
  // legs
  const step = pose.air ? 0 : pose.frame % 2;
  r(ctx, ox + 3, 15, 4, 5 - step, dark);
  r(ctx, ox + 9, 15, 4, 4 + step, dark);
  const boot = pose.spring ? "#3fdf5a" : "#222a44";
  r(ctx, ox + 2, 19 - step, 5, 2, boot);
  r(ctx, ox + 9, 18 + step, 5, 2, boot);
  if (pose.spring) { r(ctx, ox + 3, 21, 3, 1, "#ffd23f"); r(ctx, ox + 10, 21, 3, 1, "#ffd23f"); }
  if (pose.turbo) { r(ctx, ox - 6, 17, 6, 1, "#ffb35e"); r(ctx, ox - 9, 19, 7, 1, "#ffb35e88"); }
  // body
  r(ctx, ox + 3, 8, 10, 8, main);
  r(ctx, ox + 5, 10, 4, 3, "#f2f4ff");
  r(ctx, ox + 6, 11, 2, 1, dark);
  // arm cannon (reboot beam)
  r(ctx, ox + 11, 9, 6, 4, "#9aa4c8");
  r(ctx, ox + 16, 10, 2, 2, "#5ef0ff");
  r(ctx, ox + 1, 9, 3, 5, dark);
  // helmet
  r(ctx, ox + 3, 0, 10, 8, main);
  r(ctx, ox + 2, 2, 12, 5, main);
  r(ctx, ox + 7, -2, 2, 2, dark); // antenna
  r(ctx, ox + 6, -3, 4, 1, "#ffd23f");
  r(ctx, ox + 6, 3, 7, 3, "#0a1030"); // visor
  r(ctx, ox + 10, 4, 2, 1, "#5ef0ff");
  ctx.restore();
  if (pose.bubble) {
    ctx.strokeStyle = "#9ad1ffcc";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(Math.round(x + PW / 2), Math.round(y + PH / 2), 14, 0, Math.PI * 2);
    ctx.stroke();
    r(ctx, x + PW / 2 - 7, y + PH / 2 - 9, 3, 2, "#ffffffcc");
  }
  if (pose.shield) {
    ctx.strokeStyle = "#9ad1ff";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(Math.round(x + PW / 2), Math.round(y + PH / 2), 15, 0, Math.PI * 2);
    ctx.stroke();
    // comma tail
    r(ctx, x + PW / 2 + 10, y + PH / 2 + 8, 3, 3, "#9ad1ff");
    r(ctx, x + PW / 2 + 9, y + PH / 2 + 11, 2, 2, "#9ad1ff");
  }
}

// ------------------------------------------------------------------ Robo Masters

export interface BossPose {
  t: number;
  facing: 1 | -1;
  flash?: boolean;
}

/** Draws a Robo Master (or Lord Static) in its 26x30 box at x,y. */
export function drawRobot(ctx: Ctx, id: RobotId | "static", x: number, y: number, pose: BossPose) {
  ctx.save();
  ctx.translate(Math.round(x + BOSS_W / 2), Math.round(y));
  if (pose.facing > 0) ctx.scale(-1, 1);
  const t = pose.t;
  const blink = Math.floor(t / 40) % 6 === 0;
  const W = (x0: number, y0: number, w: number, h: number, c: string) => r(ctx, x0 - 16, y0 - 4, w, h, c);
  const D = (cx: number, cy: number, rad: number, c: string) => disc(ctx, cx - 16, cy - 4, rad, c);
  switch (id) {
    case "splitz": {
      const L = ROBOTS[0].look;
      W(9, 30, 4, 4, L.trim); W(19, 30, 4, 4, L.trim);
      D(16, 18, 13, "#8a4a22");
      D(16, 18, 11, L.body);
      // slices
      W(15, 7, 2, 23, L.trim); W(5, 17, 23, 2, L.trim);
      W(9, 10, 2, 2, "#c0392b"); W(21, 23, 2, 2, "#c0392b"); W(22, 11, 2, 2, "#c0392b"); W(9, 24, 2, 2, "#c0392b");
      // eyes
      W(9, 13, 5, 4, "#fff"); W(18, 13, 5, 4, "#fff");
      if (!blink) { W(10, 14, 3, 3, L.eye); W(19, 14, 3, 3, L.eye); }
      // pizza-cutter arm
      W(0, 19, 5, 2, "#9aa4c8");
      D(1, 23, 3, "#cfd6ff"); W(0, 22, 2, 2, "#5a6488");
      break;
    }
    case "igneous": {
      const L = ROBOTS[1].look;
      W(6, 28, 7, 6, L.body); W(19, 28, 7, 6, L.body);
      W(24, 22, 8, 4, L.body); // tail
      W(5, 12, 22, 17, L.body);
      W(8, 15, 2, 8, L.trim); W(14, 20, 6, 2, L.trim); W(21, 14, 2, 6, L.trim); // lava cracks
      // head: a little volcano
      W(4, 2, 18, 11, "#4a3a38");
      W(7, 0, 12, 3, "#4a3a38");
      W(9, -1, 8, 2, L.accent);
      if (Math.floor(t / 8) % 2) W(11, -4, 4, 3, L.trim);
      W(6, 5, 4, 3, L.eye); W(13, 5, 4, 3, L.eye);
      if (blink) { W(6, 5, 4, 3, "#4a3a38"); W(13, 5, 4, 3, "#4a3a38"); }
      W(3, 10, 14, 2, "#fff3c4"); // grin
      W(1, 16, 5, 3, L.body); W(0, 18, 3, 3, L.trim); // arm
      break;
    }
    case "syntaxor": {
      const L = ROBOTS[2].look;
      // hover jets
      if (Math.floor(t / 4) % 2) { W(9, 31, 4, 3, "#5ef0ff"); W(19, 31, 4, 3, "#5ef0ff"); }
      W(8, 28, 6, 3, "#22306a"); W(18, 28, 6, 3, "#22306a");
      // book body
      W(5, 13, 22, 16, L.body); W(6, 14, 20, 14, L.trim); W(15, 14, 2, 14, L.body);
      W(8, 17, 6, 1, "#8a94c8"); W(8, 20, 5, 1, "#8a94c8"); W(18, 17, 6, 1, "#8a94c8"); W(18, 20, 6, 1, "#8a94c8");
      // head: a big comma
      D(16, 6, 7, L.accent);
      W(17, 11, 5, 4, L.accent); W(19, 14, 3, 2, L.accent);
      W(11, 4, 10, 3, "#22306a");
      if (!blink) { W(12, 5, 3, 1, L.eye); W(17, 5, 3, 1, L.eye); }
      // quill arm
      W(0, 15, 6, 2, L.body); W(-2, 10, 2, 7, "#f2f4ff"); W(-2, 17, 2, 2, "#1a1a1a");
      break;
    }
    case "meridian": {
      const L = ROBOTS[3].look;
      W(8, 28, 5, 6, "#5a3a1a"); W(19, 28, 5, 6, "#5a3a1a");
      W(6, 15, 20, 14, L.body); W(6, 15, 20, 2, L.trim); W(14, 18, 4, 4, L.trim);
      // globe head
      D(16, 7, 8, L.accent);
      W(10, 3, 5, 4, "#5fd36a"); W(17, 7, 6, 4, "#5fd36a"); W(12, 10, 3, 2, "#5fd36a");
      W(8, 7, 16, 1, "#ffffff55");
      if (!blink) { W(11, 6, 3, 3, "#fff"); W(18, 6, 3, 3, "#fff"); W(12, 7, 1, 1, "#000"); W(19, 7, 1, 1, "#000"); }
      // spinning compass needle antenna
      const sp = Math.floor(t / 6) % 4;
      W(15, -4, 2, 4, L.trim);
      if (sp % 2 === 0) { W(11, -6, 5, 2, "#e3262f"); W(16, -6, 5, 2, "#f2f4ff"); }
      else W(15, -10, 2, 4, "#e3262f");
      W(1, 17, 5, 3, L.body); W(0, 20, 4, 4, L.trim); // map scroll hand
      break;
    }
    case "cumulo": {
      const L = ROBOTS[4].look;
      // rain jets
      if (Math.floor(t / 5) % 2) { W(8, 29, 1, 4, "#6ea0ff"); W(15, 30, 1, 4, "#6ea0ff"); W(22, 29, 1, 4, "#6ea0ff"); }
      D(9, 18, 8, L.trim); D(23, 18, 8, L.trim);
      D(9, 16, 8, L.body); D(23, 16, 8, L.body); D(16, 11, 10, L.body);
      W(4, 22, 24, 5, L.trim);
      // face
      if (!blink) { W(11, 12, 3, 4, L.eye); W(19, 12, 3, 4, L.eye); }
      W(13, 19, 6, 2, L.eye);
      // lightning antenna
      W(15, -2, 3, 3, L.accent); W(17, -5, 3, 3, L.accent); W(15, -8, 3, 3, L.accent);
      break;
    }
    case "polarix": {
      const L = ROBOTS[5].look;
      W(8, 28, 5, 6, "#14143a"); W(19, 28, 5, 6, "#14143a");
      W(6, 12, 20, 17, L.body);
      // number line belt
      W(6, 22, 20, 2, L.accent); for (let i = 0; i < 5; i++) W(7 + i * 4, 21, 1, 4, "#f2f4ff");
      // + and - on the chest
      W(9, 15, 5, 1, "#ff5e5e"); W(11, 13, 1, 5, "#ff5e5e");
      W(18, 15, 5, 1, "#5ec8ff");
      // head
      W(8, 1, 16, 11, L.body); W(8, 1, 16, 2, L.trim);
      if (!blink) { W(10, 5, 4, 3, L.eye); W(18, 5, 4, 3, L.eye); }
      // magnet arms
      W(0, 13, 6, 3, L.body); W(-3, 12, 3, 8, "#e3262f"); W(-3, 18, 3, 2, "#f2f4ff");
      W(26, 13, 4, 3, L.body); W(30, 12, 3, 8, "#2456e8"); W(30, 18, 3, 2, "#f2f4ff");
      break;
    }
    case "chlorophil": {
      const L = ROBOTS[6].look;
      // flowerpot body
      W(7, 18, 18, 3, "#a85a2a"); W(8, 21, 16, 10, L.body); W(9, 31, 14, 3, "#8a4a22");
      W(11, 24, 3, 3, "#fff3c4"); W(18, 24, 3, 3, "#fff3c4");
      if (!blink) { W(12, 25, 1, 1, "#000"); W(19, 25, 1, 1, "#000"); }
      // stem and leaf head
      W(15, 9, 2, 9, L.trim);
      W(6, 10, 9, 4, L.trim); W(17, 7, 9, 4, L.trim); W(8, 9, 5, 1, "#7dff7a"); W(19, 6, 5, 1, "#7dff7a");
      // flower
      D(16, 4, 5, L.accent); D(16, 4, 2, "#ffe066");
      // vine arms
      W(2, 22, 6, 2, L.trim); W(0, 19, 2, 4, L.trim); W(24, 22, 6, 2, L.trim); W(30, 19, 2, 4, L.trim);
      break;
    }
    case "clio": {
      const L = ROBOTS[7].look;
      W(9, 28, 5, 6, L.trim); W(18, 28, 5, 6, L.trim);
      W(6, 14, 20, 15, L.body);
      // pendulum window
      W(12, 16, 8, 11, "#2a1a0a");
      const sw = Math.round(Math.sin(t / 12) * 2);
      W(15 + sw, 17, 2, 6, L.accent); W(14 + sw, 23, 4, 3, "#ffd23f");
      // clock face head
      D(16, 6, 8, L.trim); D(16, 6, 7, L.accent);
      const a = (t / 30) % (Math.PI * 2);
      W(15, 1, 2, 5, "#2a1a0a");
      W(16 + Math.round(Math.cos(a) * 3), 6 + Math.round(Math.sin(a) * 3), 2, 2, "#2a1a0a");
      W(15, 5, 2, 2, "#c0392b");
      // gear shoulders
      D(4, 15, 4, L.trim); D(4, 15, 2, L.body); D(28, 15, 4, L.trim); D(28, 15, 2, L.body);
      break;
    }
    case "static": {
      const L = FINAL_BOSS.look;
      W(6, 28, 7, 6, "#1a1a26"); W(19, 28, 7, 6, "#1a1a26");
      W(4, 18, 24, 11, L.body); W(4, 18, 24, 2, L.accent);
      // cape
      W(1, 18, 3, 14, "#5a1a6a"); W(28, 18, 3, 14, "#5a1a6a");
      // CRT head with static
      W(1, 0, 30, 18, L.trim); W(3, 2, 26, 14, "#101018");
      for (let i = 0; i < 26; i++) {
        const n = (Math.sin(i * 12.9898 + Math.floor(t / 3) * 78.233) * 43758.5453) % 1;
        if (Math.abs(n) > 0.45) W(3 + i, 2 + Math.floor(Math.abs(n) * 13), 1, 1, "#9a9ab0");
      }
      if (!blink) { W(8, 6, 6, 3, L.eye); W(18, 6, 6, 3, L.eye); W(9, 9, 4, 1, L.accent); W(19, 9, 4, 1, L.accent); }
      W(11, 12, 10, 2, L.accent);
      // rabbit-ear antennas
      W(8, -6, 2, 6, L.trim); W(22, -6, 2, 6, L.trim); W(6, -8, 3, 2, L.accent); W(23, -8, 3, 2, L.accent);
      break;
    }
  }
  ctx.restore();
  if (pose.flash) {
    ctx.globalAlpha = 0.6;
    r(ctx, x - 3, y - 4, BOSS_W + 6, BOSS_H + 8, "#ffffff");
    ctx.globalAlpha = 1;
  }
}

// ------------------------------------------------------------------ mini-bots, shots, pickups

function glitchShift(t: number): number {
  return Math.floor(t / 7) % 9 === 0 ? 1 : 0;
}

function drawEnemy(ctx: Ctx, e: Sim["s"]["enemies"][number], wt: number, hazard: string) {
  const x = Math.round(e.x);
  const y = Math.round(e.y);
  const g = glitchShift(wt + e.sx);
  const body = e.flash > 0 ? "#ffffff" : "#c8d0e8";
  const glow = e.flash > 0 ? "#ffffff" : hazard;
  if (g) r(ctx, x + 1, y, e.w, e.h, "#ff3ad155");
  switch (e.kind) {
    case "walker": {
      const step = Math.floor(e.t / 8) % 2;
      r(ctx, x + 1, y + 3, 12, 6, body);
      r(ctx, x + 3, y, 8, 4, body);
      r(ctx, x + (e.dir < 0 ? 3 : 8), y + 1, 3, 2, glow);
      r(ctx, x + 1 + step, y + 9, 2, 3, "#5a6488"); r(ctx, x + 6, y + 9, 2, 3, "#5a6488"); r(ctx, x + 11 - step, y + 9, 2, 3, "#5a6488");
      break;
    }
    case "hopper": {
      r(ctx, x + 2, y, 10, 9, body);
      r(ctx, x + 4, y + 2, 6, 3, "#0a1030"); r(ctx, x + 5, y + 3, 2, 1, glow);
      r(ctx, x + 4, y + 9, 2, 5, "#9aa4c8"); r(ctx, x + 8, y + 9, 2, 5, "#9aa4c8");
      r(ctx, x + 3, y + 11, 8, 1, "#5a6488");
      break;
    }
    case "flyer": {
      const blade = Math.floor(e.t / 3) % 2;
      r(ctx, x + (blade ? 0 : 3), y, blade ? 14 : 8, 1, "#9aa4c8");
      r(ctx, x + 6, y + 1, 2, 2, "#5a6488");
      r(ctx, x + 2, y + 3, 10, 6, body);
      r(ctx, x + 4, y + 5, 6, 2, glow);
      break;
    }
    case "turret": {
      r(ctx, x, y + 9, 14, 5, "#5a6488");
      r(ctx, x + 2, y + 2, 10, 8, body);
      r(ctx, x + 4, y, 6, 2, body);
      r(ctx, x + 5, y + 4, 4, 3, glow);
      break;
    }
  }
}

const SHOT_COLORS: Record<string, string> = {
  beam: "#5ef0ff", zap: "#ff5ec8", lava: "#ff6a2b", pie: "#f4c26b", ink: "#1a1a2a", bolt: "#fff36a",
  plus: "#ff5e5e", minus: "#5ec8ff", vine: "#3fbf4a", gear: "#b8862b", static: "#e0e0ff",
};

function drawShot(ctx: Ctx, sh: Sim["s"]["shots"][number], t: number) {
  const c = SHOT_COLORS[sh.kind] ?? "#ff5ec8";
  const x = sh.x;
  const y = sh.y;
  if (sh.delay > 0) {
    // Telegraph: a flickering marker where it will strike.
    if (Math.floor(t / 4) % 2) {
      if (sh.kind === "bolt") r(ctx, x, y + sh.h - 4, sh.w, 4, "#fff36a");
      else r(ctx, x, y + sh.h - 3, sh.w, 3, "#7a4a1a");
      r(ctx, x + sh.w / 2 - 1, y + sh.h - 8, 2, 3, c);
    }
    return;
  }
  switch (sh.kind) {
    case "beam":
      r(ctx, x, y, sh.w, sh.h, c);
      r(ctx, x + 1, y + 1, sh.w - 2, sh.h - 2, "#ffffff");
      break;
    case "bolt":
      for (let yy = 0; yy < sh.h; yy += 6) r(ctx, x + ((yy / 6) % 2 ? 2 : 4), y + yy, 4, 6, c);
      r(ctx, x - 2, y + sh.h - 3, sh.w + 4, 3, "#ffffff");
      break;
    case "vine":
      r(ctx, x + 6, y, 4, sh.h, c);
      for (let yy = 4; yy < sh.h; yy += 8) { r(ctx, x + 2, y + yy, 4, 2, "#7dff7a"); r(ctx, x + 10, y + yy + 4, 4, 2, "#7dff7a"); }
      r(ctx, x + 5, y - 3, 6, 3, "#b04aff");
      break;
    case "ink":
      disc(ctx, x + 4, y + 3, 3, c);
      r(ctx, x + 5, y + 5, 2, 3, c);
      break;
    case "plus":
    case "minus":
      disc(ctx, x + 4, y + 4, 4, c);
      r(ctx, x + 2, y + 3, 5, 2, "#ffffff");
      if (sh.kind === "plus") r(ctx, x + 3.5, y + 1.5, 2, 5, "#ffffff");
      break;
    case "gear":
      disc(ctx, x + 5, y + 5, 5, c);
      disc(ctx, x + 5, y + 5, 2, "#2a1a0a");
      r(ctx, x + 4, y - 1, 2, 2, c); r(ctx, x + 4, y + 9, 2, 2, c); r(ctx, x - 1, y + 4, 2, 2, c); r(ctx, x + 9, y + 4, 2, 2, c);
      break;
    case "pie":
      r(ctx, x, y + 2, 8, 4, c); r(ctx, x, y, 3, 8, "#8a4a22"); r(ctx, x + 3, y + 3, 2, 2, "#c0392b");
      break;
    case "static":
      for (let i = 0; i < 4; i++) r(ctx, x + ((t + i * 3) % 7), y + ((t * 2 + i * 5) % 7), 2, 2, i % 2 ? c : "#ff3ad1");
      break;
    default:
      disc(ctx, x + sh.w / 2, y + sh.h / 2, sh.w / 2, c);
      r(ctx, x + sh.w / 2 - 1, y + sh.h / 2 - 1, 2, 2, "#ffffff");
  }
}

function drawPickup(ctx: Ctx, kind: string, x: number, y: number, t: number) {
  const bob = Math.round(Math.sin(t / 10) * 1);
  y += bob;
  if (kind === "bolt") {
    r(ctx, x + 2, y, 6, 3, "#cfd6ff"); r(ctx, x + 4, y + 3, 2, 7, "#9aa4c8"); r(ctx, x + 3, y + 1, 4, 1, "#5a6488");
  } else if (kind === "energy") {
    if (Math.floor(t / 12) % 2) r(ctx, x - 1, y - 1, 12, 12, "#ffe06644");
    r(ctx, x + 1, y + 1, 8, 8, "#f2f4ff"); r(ctx, x + 1, y + 5, 8, 4, "#e3262f"); r(ctx, x, y + 4, 10, 1, "#5a6488");
    r(ctx, x + 4, y + 2, 2, 2, "#ffe066");
  } else if (kind === "cell") {
    // A big energy cell: a glowing battery with a bolt.
    r(ctx, x - 2, y - 3, 14, 15, Math.floor(t / 8) % 2 ? "#ffe06655" : "#ffe06622");
    r(ctx, x + 3, y - 2, 4, 2, "#9aa4c8");
    r(ctx, x, y, 10, 11, "#f2f4ff");
    r(ctx, x + 1, y + 1, 8, 9, "#2a2a3a");
    r(ctx, x + 1, y + 4, 8, 6, "#ffd23f");
    r(ctx, x + 5, y + 2, 2, 3, "#ffffff"); r(ctx, x + 3, y + 5, 3, 2, "#ffffff"); r(ctx, x + 4, y + 7, 2, 2, "#ffffff");
  } else if (kind === "boost" || kind.startsWith("boost:")) {
    // A power-up capsule: a rainbow-flashing "?" bubble (or the power-up's own colour once known).
    const id = kind.startsWith("boost:") ? (kind.slice(6) as BoostId) : null;
    const cyc = ["#ff7ad1", "#7dff7a", "#5ef0ff", "#ffb35e", "#c9b8ff", "#9ad1ff"];
    const c = id ? BOOSTS[id].color : cyc[Math.floor(t / 6) % cyc.length];
    disc(ctx, x + 5, y + 5, 7, "#ffffff33");
    disc(ctx, x + 5, y + 5, 5, c);
    disc(ctx, x + 4, y + 4, 2, "#ffffffcc");
    if (id) drawBoostIcon(ctx, id, x, y, 1);
    else { r(ctx, x + 3, y + 2, 4, 1, "#2a1a4a"); r(ctx, x + 6, y + 3, 1, 2, "#2a1a4a"); r(ctx, x + 4, y + 5, 2, 1, "#2a1a4a"); r(ctx, x + 4, y + 7, 2, 1, "#2a1a4a"); }
  } else {
    r(ctx, x + 1, y + 1, 8, 8, "#f2f4ff"); r(ctx, x + 1, y + 5, 8, 4, "#2456e8"); r(ctx, x, y + 4, 10, 1, "#5a6488");
  }
}

export function drawPowerIcon(ctx: Ctx, p: PowerId, x: number, y: number, s = 1) {
  const P = POWERS[p];
  const R = (a: number, b: number, w: number, h: number, c: string) => r(ctx, x + a * s, y + b * s, w * s, h * s, c);
  R(0, 0, 10, 10, P.color2);
  R(1, 1, 8, 8, P.color);
  const ink = P.color2;
  switch (p) {
    case "splitter": R(2, 4, 6, 1, ink); R(4, 2, 1, 6, ink); R(2, 2, 1, 1, ink); R(7, 7, 1, 1, ink); break;
    case "magma": R(3, 6, 4, 2, ink); R(4, 2, 2, 4, ink); R(3, 3, 1, 1, ink); R(6, 3, 1, 1, ink); break;
    case "comma": R(4, 2, 3, 3, ink); R(5, 5, 2, 2, ink); R(4, 7, 2, 1, ink); break;
    case "compass": R(4, 1, 2, 4, "#e3262f"); R(4, 5, 2, 4, ink); break;
    case "cloud": R(2, 4, 6, 3, ink); R(3, 3, 4, 1, ink); R(4, 7, 1, 2, "#6ea0ff"); break;
    case "polarity": R(2, 4, 3, 1, ink); R(3, 3, 1, 3, ink); R(6, 4, 3, 1, ink); break;
    case "leaf": R(3, 2, 4, 6, ink); R(2, 4, 6, 2, ink); R(5, 7, 1, 2, ink); break;
    case "time": R(2, 2, 6, 6, ink); R(3, 3, 4, 4, P.color); R(4, 3, 1, 2, ink); R(4, 5, 2, 1, ink); break;
  }
}

/** A 10x10 power-up icon (Phase Cloak, Spring Boots, Shield Bubble, Turbo Treads, Rapid Beam, Bolt Magnet). */
export function drawBoostIcon(ctx: Ctx, id: BoostId, x: number, y: number, s = 1) {
  const B = BOOSTS[id];
  const R = (a: number, b: number, w: number, h: number, c: string) => r(ctx, x + a * s, y + b * s, w * s, h * s, c);
  R(0, 0, 10, 10, B.color2);
  R(1, 1, 8, 8, B.color);
  const ink = B.color2;
  switch (id) {
    case "phase": R(3, 2, 4, 5, "#ffffff"); R(2, 4, 1, 4, "#ffffff"); R(7, 4, 1, 4, "#ffffff"); R(3, 7, 1, 1, "#ffffff"); R(5, 7, 1, 1, "#ffffff"); R(4, 3, 1, 1, ink); R(6, 3, 1, 1, ink); break;
    case "spring": R(3, 2, 4, 1, ink); R(4, 3, 2, 1, ink); R(3, 4, 4, 1, ink); R(4, 5, 2, 1, ink); R(2, 7, 6, 2, ink); break;
    case "bubble": R(3, 2, 4, 1, ink); R(2, 3, 1, 4, ink); R(7, 3, 1, 4, ink); R(3, 7, 4, 1, ink); R(3, 3, 1, 1, "#ffffff"); break;
    case "turbo": R(2, 3, 5, 1, ink); R(1, 5, 6, 1, ink); R(2, 7, 5, 1, ink); R(7, 3, 1, 5, ink); break;
    case "rapid": R(2, 3, 3, 1, ink); R(5, 3, 3, 1, "#ffffff"); R(2, 6, 3, 1, ink); R(5, 6, 3, 1, "#ffffff"); break;
    case "magnet": R(2, 2, 2, 5, ink); R(6, 2, 2, 5, ink); R(2, 7, 6, 1, ink); R(2, 2, 2, 1, "#ffffff"); R(6, 2, 2, 1, "#ffffff"); break;
  }
}

/** A Quiz Bot: a round, gold-rimmed hover bot carrying a big "?" screen, plugged into its static barrier. */
function drawQuizBot(ctx: Ctx, x: number, y: number, t: number, i: number) {
  const glow = Math.floor(t / 6) % 2;
  disc(ctx, x + QUIZ_BOT_W / 2, y + QUIZ_BOT_H / 2, 14, glow ? "#ffd23f33" : "#c9b8ff33");
  // propeller
  const blade = Math.floor(t / 3) % 2;
  r(ctx, x + (blade ? 1 : 4), y - 3, blade ? 14 : 8, 1, "#f2f4ff");
  r(ctx, x + 7, y - 2, 2, 2, "#ffd23f");
  // body: a TV screen with a gold frame
  r(ctx, x, y, QUIZ_BOT_W, 15, "#ffd23f");
  r(ctx, x + 1, y + 1, QUIZ_BOT_W - 2, 13, "#6a4ad1");
  r(ctx, x + 2, y + 2, QUIZ_BOT_W - 4, 11, glow ? "#2a1a6a" : "#1a1050");
  // "?" on the screen
  const q = "#ffffff";
  r(ctx, x + 6, y + 3, 4, 1, q); r(ctx, x + 10, y + 4, 1, 2, q); r(ctx, x + 5, y + 4, 1, 1, q);
  r(ctx, x + 8, y + 6, 2, 1, q); r(ctx, x + 7, y + 7, 2, 2, q); r(ctx, x + 7, y + 10, 2, 2, q);
  // little arms holding the screen, and a happy light
  r(ctx, x - 3, y + 6, 3, 2, "#9aa4c8"); r(ctx, x + QUIZ_BOT_W, y + 6, 3, 2, "#9aa4c8");
  r(ctx, x + 4, y + 15, 8, 3, "#9aa4c8");
  r(ctx, x + 6, y + 18, 4, 3, i % 2 ? "#5fff8a" : "#ff7ad1");
  // a cable into the barrier
  r(ctx, x + QUIZ_BOT_W, y + 12, 4, 1, "#ffd23f");
}

/** A static barrier: a fizzing wall of glitch that only goes away when its Quiz Bot is rebooted. */
function drawBarrier(ctx: Ctx, x: number, top: number, h: number, t: number, hazard: string) {
  r(ctx, x, top, 12, h, "#1a1050cc");
  for (let yy = top + ((t * 2) % 8); yy < top + h; yy += 8) r(ctx, x + ((yy >> 3) % 3) * 3, yy, 6, 2, (yy >> 3) % 2 ? "#c9b8ff" : hazard);
  r(ctx, x, top, 1, h, "#ffd23f88");
  r(ctx, x + 11, top, 1, h, "#ffd23f88");
}

// ------------------------------------------------------------------ scenery

function drawBackground(ctx: Ctx, th: StageTheme, camX: number, t: number) {
  const g = ctx.createLinearGradient(0, 0, 0, SCREEN_H);
  g.addColorStop(0, th.skyTop);
  g.addColorStop(1, th.skyBottom);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, SCREEN_W, SCREEN_H);
  const par = (f: number, span: number) => -((camX * f) % span);
  const far = th.far;
  switch (th.deco) {
    case "pies": {
      const o = par(0.3, 120);
      for (let i = -1; i < 5; i++) {
        const cx = o + i * 120 + 50;
        disc(ctx, cx, 70, 26, far);
        r(ctx, cx - 1, 44, 2, 52, th.skyBottom);
        r(ctx, cx - 26, 69, 52, 2, th.skyBottom);
      }
      const c = par(0.6, 16);
      r(ctx, 0, 112, SCREEN_W, 3, "#3a1a3a");
      for (let i = -1; i < 22; i++) r(ctx, c + i * 16, 112, 6, 2, "#4a2448");
      break;
    }
    case "caves": {
      const o = par(0.3, 64);
      for (let i = -1; i < 7; i++) {
        const x = o + i * 64;
        ctx.fillStyle = far;
        ctx.beginPath();
        ctx.moveTo(x, 0); ctx.lineTo(x + 32, 0); ctx.lineTo(x + 18, 40 + (i % 3) * 10); ctx.closePath(); ctx.fill();
      }
      const glow = 0.25 + 0.1 * Math.sin(t / 20);
      ctx.globalAlpha = glow;
      r(ctx, 0, 150, SCREEN_W, 50, th.hazard);
      ctx.globalAlpha = 1;
      break;
    }
    case "letters": {
      const o = par(0.3, 80);
      ctx.fillStyle = far;
      ctx.font = "40px 'Press Start 2P', monospace";
      const glyphs = ["A", ",", "?", "!", ";", "B", "“", "."];
      for (let i = -1; i < 6; i++) ctx.fillText(glyphs[(i + 8 + Math.floor(camX * 0.3 / 80)) % 8], o + i * 80, 90);
      break;
    }
    case "cliffs": {
      const o = par(0.2, 160);
      for (let i = -1; i < 4; i++) {
        ctx.fillStyle = far;
        ctx.beginPath();
        const x = o + i * 160;
        ctx.moveTo(x, 150); ctx.lineTo(x + 60, 50); ctx.lineTo(x + 90, 80); ctx.lineTo(x + 120, 40); ctx.lineTo(x + 170, 150); ctx.closePath(); ctx.fill();
        r(ctx, x + 115, 40, 10, 6, "#f2f4ff");
      }
      const c = par(0.1, 200);
      for (let i = -1; i < 3; i++) { r(ctx, c + i * 200 + 20, 24, 40, 8, "#ffffffaa"); r(ctx, c + i * 200 + 30, 18, 20, 6, "#ffffffaa"); }
      break;
    }
    case "storm": {
      const o = par(0.25, 100);
      for (let i = -1; i < 5; i++) { disc(ctx, o + i * 100 + 30, 30, 18, far); disc(ctx, o + i * 100 + 56, 26, 22, far); disc(ctx, o + i * 100 + 80, 32, 16, far); }
      ctx.fillStyle = "#9ab0ff66";
      for (let i = 0; i < 40; i++) {
        const rx = (i * 53 + t * 3) % SCREEN_W;
        const ry = (i * 37 + t * 6) % SCREEN_H;
        ctx.fillRect(rx, ry, 1, 5);
      }
      if (t % 300 < 4) { ctx.globalAlpha = 0.25; r(ctx, 0, 0, SCREEN_W, SCREEN_H, "#ffffff"); ctx.globalAlpha = 1; }
      break;
    }
    case "neon": {
      ctx.strokeStyle = far;
      ctx.lineWidth = 1;
      const o = par(0.5, 32);
      for (let i = -1; i < 12; i++) { ctx.beginPath(); ctx.moveTo(o + i * 32 + 0.5, 100); ctx.lineTo(o + i * 32 + 0.5, 160); ctx.stroke(); }
      for (let j = 0; j < 4; j++) { ctx.beginPath(); ctx.moveTo(0, 100 + j * 20 + 0.5); ctx.lineTo(SCREEN_W, 100 + j * 20 + 0.5); ctx.stroke(); }
      // the number line
      const n = par(0.3, 40);
      r(ctx, 0, 60, SCREEN_W, 2, "#5ef0ff88");
      ctx.fillStyle = "#5ef0ffaa";
      ctx.font = "8px 'Press Start 2P', monospace";
      const first = Math.floor((camX * 0.3) / 40) - 6;
      for (let i = -1; i < 10; i++) {
        r(ctx, n + i * 40, 56, 2, 10, "#5ef0ff88");
        const v = ((((first + i) % 11) + 11) % 11) - 5; // the line runs -5 ... 5 and repeats
        ctx.fillText(String(v), n + i * 40 - (v < 0 ? 8 : 4), 78);
      }
      break;
    }
    case "greenhouse": {
      const o = par(0.3, 48);
      ctx.fillStyle = far;
      for (let i = -1; i < 9; i++) ctx.fillRect(o + i * 48, 0, 3, 150);
      for (let j = 0; j < 4; j++) ctx.fillRect(0, j * 36 + 10, SCREEN_W, 2);
      const l = par(0.5, 70);
      for (let i = -1; i < 6; i++) { r(ctx, l + i * 70 + 10, 110, 14, 6, "#2f8a3a"); r(ctx, l + i * 70 + 22, 104, 10, 5, "#3fbf4a"); }
      break;
    }
    case "gears": {
      const o = par(0.3, 110);
      for (let i = -1; i < 5; i++) {
        const cx = o + i * 110 + 50;
        const cy = 60 + (i % 2) * 30;
        disc(ctx, cx, cy, 24, far);
        disc(ctx, cx, cy, 8, th.skyBottom);
        const a = t / 60 * (i % 2 ? 1 : -1);
        for (let k = 0; k < 8; k++) r(ctx, cx + Math.cos(a + k * 0.785) * 26 - 3, cy + Math.sin(a + k * 0.785) * 26 - 3, 6, 6, far);
      }
      break;
    }
    case "citadel": {
      const o = par(0.25, 90);
      for (let i = -1; i < 6; i++) {
        const x = o + i * 90;
        r(ctx, x + 10, 40 + (i % 3) * 12, 30, 140, far);
        r(ctx, x + 6, 34 + (i % 3) * 12, 38, 8, far);
        for (let w = 0; w < 4; w++) r(ctx, x + 20, 60 + w * 20 + (i % 3) * 12, 10, 8, (t + i * 7 + w * 13) % 40 < 20 ? "#5ef0ff55" : "#ff3ad155");
      }
      break;
    }
  }
}

function drawLevel(ctx: Ctx, L: Level, th: StageTheme, s: Sim["s"], t: number) {
  const camX = s.camX;
  const vis = (x: number, w: number) => x + w >= camX - 4 && x <= camX + SCREEN_W + 4;
  // Solids
  for (const sd of L.solids) {
    if (!vis(sd.x, sd.w)) continue;
    const x = sd.x - camX;
    if (sd.kind === "ground") {
      r(ctx, x, sd.y, sd.w, sd.h, th.ground);
      r(ctx, x, sd.y, sd.w, 3, th.edge);
      r(ctx, x, sd.y + 3, sd.w, 1, "#00000055");
      ctx.fillStyle = "#00000033";
      for (let yy = sd.y + 10; yy < sd.y + sd.h; yy += 10) for (let xx = (yy / 10) % 2 ? 0 : 8; xx < sd.w; xx += 16) ctx.fillRect(Math.round(x + xx), yy, 8, 1);
    } else if (sd.kind === "block") {
      r(ctx, x, sd.y, sd.w, sd.h, th.edge);
      r(ctx, x + 1, sd.y + 1, sd.w - 2, sd.h - 2, th.ground);
      r(ctx, x + 2, sd.y + 2, sd.w - 4, 1, "#ffffff44");
    } else if (sd.kind === "barrier") {
      if (!s.qbDone[sd.qb!]) drawBarrier(ctx, x, 0, sd.y + sd.h, t, th.hazard);
    } else {
      r(ctx, x, sd.y, sd.w, sd.h, "#1a1a2a");
      r(ctx, x, sd.y, 2, sd.h, th.edge);
    }
  }
  // Rest stop: a recharge sign
  if (L.restX && vis(L.restX - 30, 60)) {
    const x = L.restX - camX;
    const cp = L.checkpoints.find((c) => c.x === L.restX);
    const y = cp ? cp.y : 160;
    r(ctx, x + 14, y - 34, 2, 34, "#9aa4c8");
    r(ctx, x + 2, y - 46, 28, 13, "#1a1a2a");
    r(ctx, x + 3, y - 45, 26, 11, "#2a6a3a");
    ctx.fillStyle = "#ffe066";
    ctx.font = "5px 'Press Start 2P', monospace";
    ctx.fillText("REST", x + 6, y - 37);
  }
  // Boss door (and the arena wall once it has closed)
  const doorX = L.arenaX - 16 - camX;
  if (doorX > -20 && doorX < SCREEN_W + 20) {
    const shut = s.locked;
    r(ctx, doorX, L.arenaY - 64, 16, shut ? 64 : 10, "#3a3a4a");
    r(ctx, doorX + 2, L.arenaY - 62, 12, shut ? 60 : 6, th.edge);
    for (let yy = 0; yy < (shut ? 60 : 6); yy += 6) r(ctx, doorX + 2, L.arenaY - 62 + yy, 12, 1, "#00000055");
  }
  // Moving platforms
  for (const m of L.movers) {
    const p = moverPos(m, s.wt);
    if (!vis(p.x, m.w)) continue;
    const x = p.x - camX;
    r(ctx, x, p.y, m.w, m.h, "#2a2a3a");
    r(ctx, x, p.y, m.w, 2, th.edge);
    for (let xx = 4; xx < m.w - 2; xx += 8) r(ctx, x + xx, p.y + 3, 4, 3, "#ffd23f");
    if (m.axis === "y") r(ctx, x + m.w / 2 - 1, 0, 2, p.y, "#00000055");
  }
  // Spikes
  for (const sp of L.spikes) {
    if (!vis(sp.x, sp.w)) continue;
    ctx.fillStyle = th.hazard;
    for (let xx = 0; xx < sp.w; xx += 6) {
      ctx.beginPath();
      ctx.moveTo(sp.x - camX + xx, sp.y + sp.h);
      ctx.lineTo(sp.x - camX + xx + 3, sp.y);
      ctx.lineTo(sp.x - camX + xx + 6, sp.y + sp.h);
      ctx.fill();
    }
  }
  // Timed hazards
  for (const pu of L.pulses) {
    if (!vis(pu.x, pu.w)) continue;
    const x = pu.x - camX;
    r(ctx, x - 3, pu.y + pu.h - 4, pu.w + 6, 4, "#2a2a3a");
    r(ctx, x - 3, pu.y - 4, pu.w + 6, 4, "#2a2a3a");
    if (pulseOn(pu, s.wt)) {
      const fl = Math.floor(t / 2) % 2;
      r(ctx, x, pu.y, pu.w, pu.h, th.hazard);
      r(ctx, x + 3 + fl, pu.y, pu.w - 6, pu.h, "#ffffffaa");
    } else {
      const w = pulseWarn(pu, s.wt);
      if (w > 0 && Math.floor(t / 3) % 2) {
        r(ctx, x + 2, pu.y + pu.h - 10, pu.w - 4, 6, th.hazard);
        r(ctx, x + 2, pu.y, pu.w - 4, 6, th.hazard);
      }
    }
  }
  // Checkpoints
  L.checkpoints.forEach((cp, i) => {
    if (!vis(cp.x, 10)) return;
    const x = cp.x - camX;
    const lit = s.checkpoint >= i;
    r(ctx, x, cp.y - 24, 2, 24, "#9aa4c8");
    r(ctx, x - 2, cp.y - 28, 6, 5, lit ? "#5fff8a" : "#5a6488");
    if (lit && Math.floor(t / 10) % 2) r(ctx, x - 1, cp.y - 27, 4, 3, "#ffffff");
  });
  // Power spot
  const g = L.gate;
  if (g && vis(g.x - 4, 28)) {
    const x = g.x - camX;
    if (!s.capsule) {
      // capsule: a 1-up repair kit
      r(ctx, x + 4, g.y - 14, 12, 12, "#f2f4ff");
      r(ctx, x + 6, g.y - 12, 8, 8, "#2ad1c9");
      r(ctx, x + 9, g.y - 11, 2, 6, "#ffffff"); r(ctx, x + 7, g.y - 9, 6, 2, "#ffffff");
    }
    if (!s.gateOpen) {
      const P = POWERS[g.power];
      const fl = Math.floor(t / 4) % 2;
      for (let xx = 0; xx <= 20; xx += 5) r(ctx, x + xx, g.y - 26, 1, 26, fl ? P.color : P.color2);
      r(ctx, x, g.y - 26, 21, 2, P.color2);
      drawPowerIcon(ctx, g.power, x + 5, g.y - 40);
    }
  }
}

export interface Look {
  theme: StageTheme;
  boss: RobotId | "static";
  bossName: string;
}

/** Draws one frame of the game. */
export function drawGame(ctx: Ctx, sim: Sim, look: Look, particles: Particle[], t: number, banner: { text: string; sub?: string; t: number } | null) {
  const s = sim.s;
  const L = sim.level;
  const th = look.theme;
  drawBackground(ctx, th, s.camX, t);
  drawLevel(ctx, L, th, s, t);
  ctx.save();
  ctx.translate(-Math.round(s.camX), 0);
  for (const e of s.enemies) if (!e.dead && e.x + e.w > s.camX - 4 && e.x < s.camX + SCREEN_W + 4) drawEnemy(ctx, e, s.wt, th.hazard);
  for (const it of s.pickups) if (it.x + 12 > s.camX && it.x < s.camX + SCREEN_W) drawPickup(ctx, it.kind === "boost" && it.boost ? `boost:${it.boost}` : it.kind, it.x, it.y, t);
  // Quiz Bots
  L.quizBots.forEach((_, i) => {
    if (s.qbDone[i]) return;
    const q = sim.quizBotRect(i);
    if (q.x + 30 > s.camX && q.x - 20 < s.camX + SCREEN_W) drawQuizBot(ctx, q.x, q.y, t, i);
  });
  // Boss
  const b = s.boss;
  if (b && s.mode !== "clear") {
    const down = s.mode === "bossDown";
    if (b.warn > 0 && (sim.info.pattern === "dash" || sim.info.pattern === "teleport") && Math.floor(t / 3) % 2) {
      r(ctx, b.x - 2, b.y - 2, BOSS_W + 4, BOSS_H + 4, "#ffffff55");
    }
    const shake = down ? (t % 4) - 2 : 0;
    if (!(down && s.modeT > 120)) {
      drawRobot(ctx, look.boss, b.x + shake, b.y, { t: b.t, facing: s.p.x > b.x ? 1 : -1, flash: b.flinch > 0 && Math.floor(t / 4) % 2 === 0 });
    }
    if (b.shield > 0) {
      ctx.strokeStyle = Math.floor(t / 3) % 2 ? "#ffd23f" : "#ffffff";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(b.x + BOSS_W / 2, b.y + BOSS_H / 2, 22, 0, Math.PI * 2);
      ctx.stroke();
    }
    if (b.stun > 0 && Math.floor(t / 4) % 2) r(ctx, b.x + 4, b.y - 8, 18, 3, "#ff5ec8");
    // Reboot panel lights over its head
    if (s.mode === "boss" && s.fight) {
      const need = s.fight ? Math.max(1, sim.band === "k2" ? 2 : 3) : 3;
      for (let i = 0; i < need; i++) r(ctx, b.x + BOSS_W / 2 - need * 3 + i * 6, b.y - 10, 4, 3, i < b.panel ? "#5fff8a" : "#2a2a3a");
    }
  }
  // Shots
  for (const sh of s.shots) drawShot(ctx, sh, t);
  // Hero
  const p = s.p;
  if (s.mode !== "respawn" && s.mode !== "over") {
    drawHero(ctx, p.x, p.y, {
      facing: p.facing, frame: Math.floor(Math.abs(p.x) / 6), air: !p.onGround,
      colors: powerColors(sim.selectedPower), shield: p.shieldT > 0, dash: p.dashT > 0, glide: p.glideT > 0,
      blink: p.inv > 0 && Math.floor(t / 3) % 2 === 0 && p.shieldT <= 0,
      phase: s.boosts.phase > 0, spring: s.boosts.spring > 0, bubble: s.boosts.bubble > 0, turbo: s.boosts.turbo > 0 && p.vx !== 0,
    });
  }
  // Particles
  for (const pa of particles) {
    ctx.globalAlpha = Math.max(0, pa.life / pa.max);
    r(ctx, pa.x, pa.y, pa.size, pa.size, pa.color);
  }
  ctx.globalAlpha = 1;
  ctx.restore();
  if (s.slowT > 0) {
    ctx.globalAlpha = 0.12;
    r(ctx, 0, 0, SCREEN_W, SCREEN_H, "#e0c27a");
    ctx.globalAlpha = 1;
  }
  drawHud(ctx, sim, look, t);
  if (banner) drawBanner(ctx, banner.text, banner.sub, banner.t);
}

function bar(ctx: Ctx, x: number, y: number, value: number, max: number, color: string, label: string) {
  const segs = 14;
  r(ctx, x - 1, y - 1, 8, segs * 3 + 3, "#000000aa");
  for (let i = 0; i < segs; i++) {
    const on = i < Math.ceil((value / max) * segs);
    r(ctx, x, y + (segs - 1 - i) * 3 + 1, 6, 2, on ? color : "#2a2a3a");
  }
  ctx.fillStyle = "#f2f4ff";
  ctx.font = "5px 'Press Start 2P', monospace";
  ctx.fillText(label, x + 1, y + segs * 3 + 9);
}

function drawHud(ctx: Ctx, sim: Sim, look: Look, t: number) {
  const s = sim.s;
  bar(ctx, 6, 6, Math.max(0, s.energy), MAX_ENERGY, "#ffe066", "E");
  const sel = sim.selectedPower;
  bar(ctx, 17, 6, sel ? s.power : 0, POWER_MAX, sel ? POWERS[sel].color : "#5a6488", "P");
  if (sel) drawPowerIcon(ctx, sel, 28, 6);
  // Power-ups: icon + a shrinking timer bar (blinks in the last 2 s).
  let bx = sel ? 42 : 28;
  for (const id of Object.keys(s.boosts) as BoostId[]) {
    const left = s.boosts[id];
    if (left <= 0) continue;
    if (left < 120 && Math.floor(t / 6) % 2) { bx += 14; continue; }
    drawBoostIcon(ctx, id, bx, 6);
    r(ctx, bx, 18, 10, 2, "#000000aa");
    r(ctx, bx, 18, Math.max(1, Math.round((10 * left) / BOOSTS[id].frames)), 2, BOOSTS[id].color);
    bx += 14;
  }
  // Quiz Bots rebooted in this stage.
  if (L0(sim) > 0 && !s.locked) {
    ctx.font = "5px 'Press Start 2P', monospace";
    const txt = `? ${s.qbDone.filter(Boolean).length}/${L0(sim)}`;
    ctx.fillStyle = "#000000aa";
    ctx.fillRect(SCREEN_W - 40, 5, 36, 9);
    ctx.fillStyle = "#ffd23f";
    ctx.fillText(txt, SCREEN_W - 37, 12);
  }
  if (s.fight && s.boss && (s.mode === "boss" || s.mode === "quiz" || s.mode === "bossIntro" || s.mode === "bossDown")) {
    const f = s.fight;
    const x = SCREEN_W - 14;
    r(ctx, x - 1, 5, 8, f.maxHp * 6 + 3, "#000000aa");
    for (let i = 0; i < f.maxHp; i++) {
      const on = i < f.hp;
      r(ctx, x, 6 + (f.maxHp - 1 - i) * 6 + 1, 6, 4, on ? "#ff5e7a" : "#2a2a3a");
    }
    ctx.fillStyle = "#f2f4ff";
    ctx.font = "5px 'Press Start 2P', monospace";
    const w = ctx.measureText(look.bossName).width;
    ctx.fillText(look.bossName, x - w - 4, 12);
    if (f.weakReady && Math.floor(t / 8) % 2) {
      ctx.fillStyle = "#ffd23f";
      const m = "WEAK SPOT! x2";
      ctx.fillText(m, x - ctx.measureText(m).width - 4, 20);
    }
  }
}

function L0(sim: Sim): number {
  return sim.level.quizBots.length;
}

function drawBanner(ctx: Ctx, text: string, sub: string | undefined, t: number) {
  if (t % 30 > 26 && t < 40) return;
  ctx.font = "6px 'Press Start 2P', monospace";
  const ws = sub ? ctx.measureText(sub).width : 0;
  ctx.font = "10px 'Press Start 2P', monospace";
  const w = ctx.measureText(text).width;
  const bw = Math.min(SCREEN_W - 8, Math.max(w, ws) + 16);
  r(ctx, SCREEN_W / 2 - bw / 2, 70, bw, sub ? 34 : 22, "#000000bb");
  ctx.fillStyle = "#ffd23f";
  ctx.fillText(text, SCREEN_W / 2 - w / 2, 86);
  if (sub) {
    ctx.font = "6px 'Press Start 2P', monospace";
    const w2 = ctx.measureText(sub).width;
    ctx.fillStyle = "#5ef0ff";
    ctx.fillText(sub, SCREEN_W / 2 - w2 / 2, 98);
  }
}

/** A still scene for menus: a stage scrolling slowly, no hero. */
export function drawPreview(ctx: Ctx, sim: Sim, look: Look, t: number) {
  const s = sim.s;
  const span = Math.max(1, sim.level.arenaX - SCREEN_W);
  s.camX = Math.round((Math.sin(t / 900) * 0.5 + 0.5) * span);
  drawBackground(ctx, look.theme, s.camX, t);
  drawLevel(ctx, sim.level, look.theme, s, t);
  ctx.save();
  ctx.translate(-s.camX, 0);
  for (const e of s.enemies) if (!e.dead) drawEnemy(ctx, { ...e, t: t + e.sx }, t + e.sx, look.theme.hazard);
  ctx.restore();
}

export function themeFor(id: RobotId | "fortress"): StageTheme {
  return id === "fortress" ? FINAL_BOSS.stage : ROBOTS.find((x) => x.id === id)!.stage;
}
