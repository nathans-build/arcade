import { moverPos, pulseOn, pulseWarn, SCREEN_H, SCREEN_W, type Level } from "./levels";
import { POWERS, RUSH, VIRUSES, ZONES, type PowerId, type StageId, type StageTheme, type VirusId, type ZoneId } from "./roster";
import { BOOSTS, type BoostId } from "./boosts";
import { BOSS_H, BOSS_W, CLUE_H, CLUE_W, MAX_ENERGY, PH, POWER_MAX, PW, type Sim } from "./sim";

/*
 * Pixel art, all drawn in code on a 320x200 logical screen (the canvas is 640x400, scaled x2).
 * Every character is original and cartoony: Cyto the killer T cell, Hana the helper T cell, macrophage
 * pals, the eight stage germs, the six Major Viruses and the little germs. Beaten germs poof into sparkles.
 */

type Ctx = CanvasRenderingContext2D;

export interface Particle { x: number; y: number; vx: number; vy: number; life: number; max: number; color: string; size: number }

/** A macrophage pal that rolls in to gobble a poofed germ's sparkles (drawn for a short time). */
export interface Gobbler { x: number; y: number; t: number; dir: 1 | -1 }

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

/** A pixel ellipse. */
function oval(ctx: Ctx, cx: number, cy: number, rx: number, ry: number, c: string) {
  ctx.fillStyle = c;
  for (let dy = -ry; dy <= ry; dy++) {
    const half = Math.round(rx * Math.sqrt(Math.max(0, 1 - (dy * dy) / (ry * ry))));
    ctx.fillRect(Math.round(cx - half), Math.round(cy + dy), half * 2, 1);
  }
}

/** Two cute eyes (white with pupils) centred at cx, cy. */
function eyes(ctx: Ctx, cx: number, cy: number, gap: number, blink: boolean, look = 1) {
  if (blink) {
    r(ctx, cx - gap - 2, cy, 4, 1, "#1a1a2a");
    r(ctx, cx + gap - 2, cy, 4, 1, "#1a1a2a");
    return;
  }
  r(ctx, cx - gap - 2, cy - 2, 4, 4, "#ffffff");
  r(ctx, cx + gap - 2, cy - 2, 4, 4, "#ffffff");
  r(ctx, cx - gap - 1 + look, cy - 1, 2, 2, "#1a1a2a");
  r(ctx, cx + gap - 1 + look, cy - 1, 2, 2, "#1a1a2a");
}

export const HERO_COLORS = { main: "#a98bff", dark: "#4a2ab8" };

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
  /** Power-ups: see-through membrane phase, Lymph Leap, Vaccine Memory, Fever Boost, Mucus Shield. */
  phase?: boolean;
  leap?: boolean;
  vaccine?: boolean;
  fever?: boolean;
  mucus?: boolean;
}

/** Cyto the killer T cell, drawn with its hitbox (12x20) at x,y. */
export function drawHero(ctx: Ctx, x: number, y: number, pose: HeroPose) {
  if (pose.blink) return;
  const { main, dark } = pose.colors;
  ctx.save();
  if (pose.phase) ctx.globalAlpha = 0.45 + 0.1 * Math.sin(pose.frame);
  ctx.translate(Math.round(x + PW / 2), Math.round(y));
  if (pose.facing < 0) ctx.scale(-1, 1);
  if (pose.glide) {
    // Floating in plasma: a golden droplet umbrella.
    oval(ctx, 0, -4, 11, 3, "#ffe9a8");
    r(ctx, -9, -4, 18, 1, "#c08a1a");
    r(ctx, 0, -2, 1, 6, "#c08a1a");
  }
  if (pose.dash) {
    r(ctx, -18, 8, 8, 2, "#ffe066");
    r(ctx, -22, 12, 10, 2, "#ffe06688");
  }
  // little feet
  const step = pose.air ? 0 : pose.frame % 2;
  const foot = pose.leap ? "#3fdfa0" : dark;
  r(ctx, -5, 17 - step, 4, 3, foot);
  r(ctx, 1, 16 + step, 4, 3, foot);
  if (pose.leap) { r(ctx, -5, 20, 4, 1, "#ffffff"); r(ctx, 1, 20, 4, 1, "#ffffff"); }
  if (pose.fever) { r(ctx, -14, 13, 6, 1, "#ffb35e"); r(ctx, -17, 16, 7, 1, "#ff7a3a88"); }
  // receptor nubs (T cell receptors) around the body
  const nub = "#ffd23f";
  for (const [nx, ny] of [[-8, 4], [-9, 10], [-6, 15], [7, 2], [8, 14], [0, -2], [-4, -1]]) {
    r(ctx, nx, ny, 2, 2, nub);
  }
  // round body
  disc(ctx, 0, 9, 8, dark);
  disc(ctx, 0, 9, 7, main);
  disc(ctx, -2, 6, 3, "#ffffff44");
  // face
  r(ctx, 0, 5, 3, 4, "#ffffff");
  r(ctx, 4, 5, 3, 4, "#ffffff");
  r(ctx, 1, 6, 2, 2, "#1a1a2a");
  r(ctx, 5, 6, 2, 2, "#1a1a2a");
  r(ctx, 2, 11, 4, 1, "#1a1a2a");
  r(ctx, -5, 9, 2, 1, "#ff9ac8");
  // receptor zapper: a wand with a glowing Y tip
  r(ctx, 6, 10, 6, 2, "#9aa4c8");
  r(ctx, 12, 8, 1, 3, "#5ef0ff");
  r(ctx, 14, 8, 1, 3, "#5ef0ff");
  r(ctx, 13, 10, 1, 3, "#5ef0ff");
  ctx.restore();
  const cx = Math.round(x + PW / 2);
  const cy = Math.round(y + PH / 2);
  if (pose.mucus) {
    ctx.globalAlpha = 0.35;
    disc(ctx, cx, cy + 1, 13, "#c8ff5a");
    ctx.globalAlpha = 1;
  }
  if (pose.vaccine) {
    ctx.strokeStyle = "#9ad1ffcc";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(cx, cy, 14, 0, Math.PI * 2);
    ctx.stroke();
    // a tiny memory-cell star
    r(ctx, cx - 9, cy - 10, 3, 1, "#ffffff");
    r(ctx, cx - 8, cy - 11, 1, 3, "#ffffff");
  }
  if (pose.shield) {
    // Platelet Patch: little platelet friends ring the hero.
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 + pose.frame * 0.05;
      oval(ctx, cx + Math.cos(a) * 14, cy + Math.sin(a) * 14, 3, 2, "#ffb0b0");
    }
  }
}

/** Hana the helper T cell (about 16x18), used at rest stops and on screens. */
export function drawHelper(ctx: Ctx, x: number, y: number, t: number) {
  const bob = Math.round(Math.sin(t / 15));
  y += bob;
  r(ctx, x + 4, y + 15, 3, 3, "#1e8a6a");
  r(ctx, x + 10, y + 15, 3, 3, "#1e8a6a");
  disc(ctx, x + 8, y + 9, 8, "#1e8a6a");
  disc(ctx, x + 8, y + 9, 7, "#7dffc8");
  for (const [nx, ny] of [[0, 4], [15, 5], [8, -1], [2, 13]]) r(ctx, x + nx, y + ny, 2, 2, "#ffd23f");
  // glasses and a smile
  r(ctx, x + 3, y + 6, 4, 4, "#1a1a2a");
  r(ctx, x + 9, y + 6, 4, 4, "#1a1a2a");
  r(ctx, x + 4, y + 7, 2, 2, "#ffffff");
  r(ctx, x + 10, y + 7, 2, 2, "#ffffff");
  r(ctx, x + 7, y + 7, 2, 1, "#1a1a2a");
  r(ctx, x + 6, y + 12, 4, 1, "#1a1a2a");
  // clipboard
  r(ctx, x + 14, y + 8, 5, 7, "#c08a1a");
  r(ctx, x + 15, y + 9, 3, 5, "#f2f4ff");
}

/** A macrophage pal: a big friendly blob that gobbles sparkles (opens and closes its mouth). */
export function drawMacrophage(ctx: Ctx, x: number, y: number, t: number, dir: 1 | -1) {
  const open = Math.floor(t / 6) % 2 === 0;
  ctx.save();
  ctx.translate(Math.round(x), Math.round(y));
  if (dir < 0) ctx.scale(-1, 1);
  oval(ctx, 0, 0, 9, 7, "#2a8a9a");
  oval(ctx, 0, 0, 8, 6, "#8ae8f0");
  // pseudopod "arms"
  r(ctx, -11, 2, 3, 2, "#8ae8f0");
  r(ctx, -12, -2, 2, 3, "#8ae8f0");
  r(ctx, 1, -3, 2, 2, "#1a1a2a");
  r(ctx, 5, -3, 2, 2, "#1a1a2a");
  if (open) r(ctx, 3, 1, 6, 4, "#1a3a4a");
  else r(ctx, 3, 2, 5, 1, "#1a3a4a");
  ctx.restore();
}

// ------------------------------------------------------------------ bosses

export interface BossPose {
  t: number;
  facing: 1 | -1;
  flash?: boolean;
}

export type BossKey = ZoneId | VirusId;

function lookOf(id: BossKey) {
  return (ZONES.find((z) => z.id === id) ?? VIRUSES.find((v) => v.id === id))!.look;
}

/** Draws a stage germ or a Major Virus in its 26x30 box at x,y. */
export function drawBoss(ctx: Ctx, id: BossKey, x: number, y: number, pose: BossPose) {
  ctx.save();
  ctx.translate(Math.round(x + BOSS_W / 2), Math.round(y));
  if (pose.facing > 0) ctx.scale(-1, 1);
  const t = pose.t;
  const blink = Math.floor(t / 40) % 6 === 0;
  const L = lookOf(id);
  // Local helpers: (0,0) is the box's top-left shifted to the centre line.
  const W = (x0: number, y0: number, w: number, h: number, c: string) => r(ctx, x0 - 13, y0, w, h, c);
  const D = (cx: number, cy: number, rad: number, c: string) => disc(ctx, cx - 13, cy, rad, c);
  const O = (cx: number, cy: number, rx: number, ry: number, c: string) => oval(ctx, cx - 13, cy, rx, ry, c);
  const E = (cx: number, cy: number, gap = 4) => eyes(ctx, cx - 13, cy, gap, blink, -1);
  const smile = (cx: number, cy: number, w = 6) => { W(cx - w / 2, cy, w, 1, "#1a1a2a"); W(cx - w / 2 - 1, cy - 1, 1, 1, "#1a1a2a"); W(cx + w / 2, cy - 1, 1, 1, "#1a1a2a"); };
  const spikes = (cx: number, cy: number, rad: number, n: number, len: number, c: string, tip: string, spin = 0) => {
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + spin;
      for (let k = 0; k < len; k++) W(cx + Math.cos(a) * (rad + k) - 0.5, cy + Math.sin(a) * (rad + k) - 0.5, 1, 1, c);
      W(cx + Math.cos(a) * (rad + len) - 1, cy + Math.sin(a) * (rad + len) - 1, 2, 2, tip);
    }
  };
  switch (id) {
    case "nose": {
      // Adeno-Bounce: a 20-sided virus ball with long knobbed fibers.
      spikes(13, 15, 10, 8, 4, L.trim, L.accent, 0.2);
      D(13, 15, 10, L.trim);
      D(13, 15, 9, L.body);
      W(7, 9, 12, 1, "#ffffff55"); W(5, 15, 16, 1, "#ffffff33"); W(8, 21, 10, 1, "#ffffff33");
      E(13, 13);
      smile(13, 19);
      break;
    }
    case "throat": {
      // Strep-tacular: a chain of round bacteria, face on the top bead.
      const sw = Math.round(Math.sin(t / 14) * 2);
      for (let i = 3; i >= 0; i--) {
        D(13 + (i % 2 ? sw : -sw), 25 - i * 7, 5, L.trim);
        D(13 + (i % 2 ? sw : -sw), 25 - i * 7, 4, L.body);
      }
      D(13 - sw, 4, 7, L.trim);
      D(13 - sw, 4, 6, L.body);
      E(13 - sw, 3, 3);
      smile(13 - sw, 7, 4);
      break;
    }
    case "lungs": {
      // Pneumo-Pair: two oval bacteria side by side inside a soft capsule.
      O(13, 15, 13, 10, "#ffffff22");
      O(7, 15, 6, 8, L.trim); O(7, 15, 5, 7, L.body);
      O(19, 15, 6, 8, L.trim); O(19, 15, 5, 7, L.body);
      E(7, 13, 2); E(19, 13, 2);
      smile(7, 18, 3); smile(19, 18, 3);
      break;
    }
    case "blood": {
      // Spiro-Swirl: a corkscrew-shaped bacterium.
      for (let i = 0; i < 26; i++) {
        const yy = 15 + Math.sin(i / 3 + t / 6) * 6;
        W(i, yy - 2, 2, 5, L.trim);
        W(i, yy - 1, 2, 3, L.body);
      }
      D(3, 15 + Math.sin(t / 6) * 6, 5, L.body);
      E(3, 14 + Math.sin(t / 6) * 6, 2);
      break;
    }
    case "stomach": {
      // Heli-Copter: a curvy rod bacterium with whip-like tails spinning on top.
      const sp = Math.floor(t / 3) % 2;
      W(sp ? 0 : 5, 1, sp ? 26 : 16, 1, L.trim);
      W(12, 2, 2, 5, L.trim);
      O(13, 16, 10, 8, L.trim);
      O(13, 16, 9, 7, L.body);
      W(5, 12, 4, 1, "#ffffff66");
      E(13, 14);
      smile(13, 19);
      W(22, 22, 4, 1, L.trim); W(25, 23, 2, 2, L.trim);
      break;
    }
    case "gut": {
      // Sally Monella: a rod-shaped bacterium with flagella all around (and a little bow).
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2 + Math.sin(t / 10) * 0.2;
        W(13 + Math.cos(a) * 12, 15 + Math.sin(a) * 15, 2, 2, L.trim);
      }
      O(13, 15, 8, 13, L.trim);
      O(13, 15, 7, 12, L.body);
      E(13, 11, 3);
      smile(13, 16, 4);
      W(10, 1, 3, 3, "#ff5e8a"); W(14, 1, 3, 3, "#ff5e8a"); W(13, 2, 1, 1, "#c0396a");
      break;
    }
    case "skin": {
      // Staph-a-Lot: a grape-like bunch of round bacteria with faces.
      const pts: [number, number][] = [[7, 20], [19, 20], [13, 25], [4, 12], [13, 13], [22, 12], [9, 5], [17, 5]];
      for (const [px, py] of pts) { D(px, py, 5, L.trim); D(px, py, 4, L.body); }
      E(13, 12, 3);
      smile(13, 16, 4);
      for (const [px, py] of [[7, 20], [19, 20], [9, 5], [17, 5]]) { W(px - 1, py - 1, 1, 1, "#1a1a2a"); W(px + 1, py - 1, 1, 1, "#1a1a2a"); }
      break;
    }
    case "mouth": {
      // Mutans Munch: a round bacterium with a big grin, hugging a sugar cube.
      D(13, 15, 11, L.trim);
      D(13, 15, 10, L.body);
      E(13, 11);
      W(7, 17, 12, 4, "#1a1a2a"); W(8, 17, 2, 2, "#ffffff"); W(12, 17, 2, 2, "#ffffff"); W(16, 17, 2, 2, "#ffffff");
      W(0, 22, 7, 7, "#ffffff"); W(1, 23, 5, 5, "#f2f4ff"); W(2, 24, 1, 1, "#c8d0e8");
      break;
    }
    case "rhino": {
      // Rhinovirus: a small faceted ball (a 20-sided shape), green with a bright face.
      D(13, 15, 11, L.trim);
      D(13, 15, 10, L.body);
      for (let i = 0; i < 6; i++) W(6 + (i % 3) * 6, 9 + Math.floor(i / 3) * 10, 4, 1, "#ffffff44");
      W(11, 4, 4, 2, L.accent);
      E(13, 13);
      W(10, 18, 6, 2, "#1a1a2a"); W(11, 19, 4, 1, "#ff9ac8");
      break;
    }
    case "flu": {
      // Influenza: a round virus covered in two kinds of spikes (H and N).
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2 + t / 80;
        const c = i % 2 ? L.trim : L.accent;
        for (let k = 0; k < 4; k++) W(13 + Math.cos(a) * (10 + k), 15 + Math.sin(a) * (10 + k), 1, 1, c);
        W(13 + Math.cos(a) * 14 - 1, 15 + Math.sin(a) * 14 - 1, i % 2 ? 2 : 3, 2, c);
      }
      D(13, 15, 10, L.trim);
      D(13, 15, 9, L.body);
      E(13, 13);
      smile(13, 18);
      break;
    }
    case "noro": {
      // Norovirus: a small round virus with cup-shaped dimples.
      D(13, 15, 10, L.trim);
      D(13, 15, 9, L.body);
      for (const [px, py] of [[7, 9], [19, 9], [5, 17], [21, 17], [13, 24]]) { D(px, py, 2, L.trim); W(px - 1, py - 1, 2, 1, "#ffffff66"); }
      E(13, 13);
      smile(13, 18, 4);
      if (Math.floor(t / 4) % 2) { W(-4, 20, 4, 1, L.accent); W(-6, 14, 5, 1, L.accent); }
      break;
    }
    case "varicella": {
      // Varicella-zoster: an enveloped virus with a ring-shaped core and itchy spots.
      D(13, 15, 12, L.trim);
      D(13, 15, 11, L.body);
      D(13, 15, 6, "#ffe0ea");
      for (const [px, py] of [[4, 10], [22, 9], [5, 21], [21, 22], [13, 4]]) D(px, py, 1, L.accent);
      E(13, 14);
      smile(13, 18, 4);
      break;
    }
    case "measles": {
      // Measles: a fuzzy round virus with short spikes all over.
      spikes(13, 15, 10, 16, 2, L.trim, L.accent, t / 60);
      D(13, 15, 10, L.trim);
      D(13, 15, 9, L.body);
      E(13, 13);
      smile(13, 18);
      break;
    }
    case "corona": {
      // Coronavirus: a round virus with club-shaped spike proteins like a crown.
      for (let i = 0; i < 10; i++) {
        const a = (i / 10) * Math.PI * 2 + t / 90;
        for (let k = 0; k < 3; k++) W(13 + Math.cos(a) * (10 + k), 15 + Math.sin(a) * (10 + k), 1, 1, L.trim);
        D(13 + Math.cos(a) * 14, 15 + Math.sin(a) * 14, 2, L.accent);
      }
      D(13, 15, 10, L.trim);
      D(13, 15, 9, L.body);
      // a little crown on top
      W(9, 2, 9, 2, "#ffd23f"); W(9, 0, 2, 2, "#ffd23f"); W(13, -1, 2, 3, "#ffd23f"); W(16, 0, 2, 2, "#ffd23f");
      E(13, 13);
      smile(13, 18);
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

// ------------------------------------------------------------------ little germs, shots, pickups

/** The four little germ kinds, cartoon style. */
function drawEnemy(ctx: Ctx, e: Sim["s"]["enemies"][number]) {
  const x = Math.round(e.x);
  const y = Math.round(e.y);
  const f = e.flash > 0;
  switch (e.kind) {
    case "rod": {
      // A rod bacterium (bacillus) with a wiggly tail; one about to split shows a pinch in the middle.
      const body = f ? "#ffffff" : e.child ? "#b8f08a" : "#8ae06a";
      const wig = Math.floor(e.t / 6) % 2;
      r(ctx, x + (e.dir < 0 ? 13 : -2), y + 5 + wig, 3, 1, "#3a8a2a");
      oval(ctx, x + 7, y + 6, 7, 5, "#3a8a2a");
      oval(ctx, x + 7, y + 6, 6, 4, body);
      if (!e.split && e.t > 300) r(ctx, x + 7, y + 2, 1, 8, "#3a8a2a");
      const ex = e.dir < 0 ? x + 2 : x + 7;
      r(ctx, ex, y + 4, 2, 2, "#1a1a2a"); r(ctx, ex + 3, y + 4, 2, 2, "#1a1a2a");
      break;
    }
    case "cocci": {
      // Round bacteria (cocci) in a pair, hopping.
      const body = f ? "#ffffff" : "#ffb35e";
      disc(ctx, x + 4, y + 8, 4, "#c0561a"); disc(ctx, x + 4, y + 8, 3, body);
      disc(ctx, x + 10, y + 8, 4, "#c0561a"); disc(ctx, x + 10, y + 8, 3, body);
      r(ctx, x + 3, y + 7, 1, 1, "#1a1a2a"); r(ctx, x + 5, y + 7, 1, 1, "#1a1a2a");
      r(ctx, x + 9, y + 7, 1, 1, "#1a1a2a"); r(ctx, x + 11, y + 7, 1, 1, "#1a1a2a");
      break;
    }
    case "virus": {
      // A floating virus particle with little spikes.
      const body = f ? "#ffffff" : "#ff7ad1";
      const spin = Math.floor(e.t / 8) % 2;
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2 + spin * 0.5;
        r(ctx, x + 7 + Math.cos(a) * 7 - 1, y + 5 + Math.sin(a) * 6 - 1, 2, 2, "#a01a7a");
      }
      disc(ctx, x + 7, y + 5, 5, "#a01a7a");
      disc(ctx, x + 7, y + 5, 4, body);
      r(ctx, x + 5, y + 4, 1, 2, "#1a1a2a"); r(ctx, x + 8, y + 4, 1, 2, "#1a1a2a");
      break;
    }
    case "spiral": {
      // A coiled spiral bacterium that puffs toxin bubbles.
      const body = f ? "#ffffff" : "#9ad1ff";
      for (let i = 0; i < 14; i++) {
        const yy = y + 7 + Math.sin(i / 2 + e.t / 10) * 3;
        r(ctx, x + i, yy - 2, 1, 4, "#2456e8");
        r(ctx, x + i, yy - 1, 1, 2, body);
      }
      r(ctx, x + 2, y + 2, 2, 2, "#1a1a2a"); r(ctx, x + 6, y + 2, 2, 2, "#1a1a2a");
      break;
    }
  }
}

const SHOT_COLORS: Record<string, string> = {
  beam: "#5ef0ff", toxin: "#b8f04a", droplet: "#bdf4ff", bead: "#ff8a5e", gust: "#e8f4ff", acid: "#c8ff5a", crumb: "#d8a86a",
  grape: "#ffd23f", sugar: "#ffffff", sniffle: "#9aff9a", spot: "#ff5e7a", mist: "#ffb0b0", spike: "#d8a8ff",
};

function drawShot(ctx: Ctx, sh: Sim["s"]["shots"][number], t: number, antibody: boolean) {
  const c = SHOT_COLORS[sh.kind] ?? "#ff5ec8";
  const x = sh.x;
  const y = sh.y;
  if (sh.delay > 0) {
    // Telegraph: a flickering warning where it will strike.
    if (Math.floor(t / 4) % 2) {
      r(ctx, x, y + sh.h - 4, sh.w, 4, c);
      r(ctx, x + sh.w / 2 - 1, y + sh.h - 9, 2, 4, "#ffffff");
    }
    return;
  }
  switch (sh.kind) {
    case "beam":
      if (antibody) {
        // B cell help: a Y-shaped antibody.
        r(ctx, x, y + 1, 4, 2, "#ffe066");
        r(ctx, x + 4, y, 2, 1, "#ffe066");
        r(ctx, x + 4, y + 3, 2, 1, "#ffe066");
      } else {
        r(ctx, x, y, sh.w, sh.h, c);
        r(ctx, x + 1, y + 1, sh.w - 2, sh.h - 2, "#ffffff");
      }
      break;
    case "gust":
      // A swirly column of air.
      for (let yy = 0; yy < sh.h; yy += 6) r(ctx, x + ((yy / 6 + Math.floor(t / 3)) % 2 ? 1 : 4), y + yy, 5, 4, (yy / 6) % 2 ? c : "#9ad1ff");
      r(ctx, x - 2, y + sh.h - 3, sh.w + 4, 3, "#ffffff");
      break;
    case "grape":
    case "spot":
      // Bumps that pop up from the floor.
      for (let yy = 4; yy < sh.h; yy += 8) disc(ctx, x + 8 + ((yy / 8) % 2 ? -3 : 3), y + yy, 4, c);
      disc(ctx, x + 8, y + 2, 5, c);
      r(ctx, x + 6, y, 2, 2, "#ffffff");
      break;
    case "acid":
    case "droplet":
    case "sniffle":
      disc(ctx, x + 4, y + 5, 3, c);
      r(ctx, x + 3, y + 1, 2, 2, c);
      r(ctx, x + 3, y + 4, 1, 1, "#ffffff");
      break;
    case "sugar":
      r(ctx, x + 1, y + 1, 7, 7, "#c8d0e8");
      r(ctx, x + 1, y + 1, 6, 6, c);
      r(ctx, x + 2, y + 2, 1, 1, "#c8d0e8");
      break;
    case "mist":
      for (let i = 0; i < 3; i++) disc(ctx, x + 2 + i * 2, y + 4 + (i % 2), 3, i % 2 ? c : "#ffffffaa");
      break;
    case "bead":
    case "crumb":
      disc(ctx, x + 5, y + 5, 5, c);
      r(ctx, x + 3, y + 3, 2, 2, "#ffffffaa");
      break;
    case "spike":
      r(ctx, x + 3, y, 2, 8, c);
      disc(ctx, x + 4, y + 1, 2, "#ff5e5e");
      break;
    case "toxin":
      disc(ctx, x + 3, y + 3, 3, c);
      r(ctx, x + 2, y + 2, 1, 1, "#ffffff");
      break;
    default:
      disc(ctx, x + sh.w / 2, y + sh.h / 2, sh.w / 2, c);
  }
}

/** Pickups: nutrient sparkles, energy drops, energy cells, skill drops and "?" power-up capsules. */
function drawPickup(ctx: Ctx, kind: string, x: number, y: number, t: number, friendly: boolean) {
  const bob = Math.round(Math.sin(t / 10) * 1);
  y += bob;
  if (kind === "nutrient") {
    const tw = Math.floor(t / 8) % 2;
    r(ctx, x + 4, y + 1, 2, 8, "#ffe066");
    r(ctx, x + 1, y + 4, 8, 2, "#ffe066");
    r(ctx, x + 4, y + 4, 2, 2, "#ffffff");
    if (tw) { r(ctx, x + 2, y + 2, 1, 1, "#ffffff"); r(ctx, x + 7, y + 7, 1, 1, "#ffffff"); }
  } else if (kind === "energy") {
    if (friendly) {
      // In the Gut Garden, energy comes from friendly gut bacteria.
      oval(ctx, x + 5, y + 5, 5, 3, "#3a8a2a");
      oval(ctx, x + 5, y + 5, 4, 2, "#9aff9a");
      r(ctx, x + 3, y + 4, 1, 1, "#1a1a2a"); r(ctx, x + 6, y + 4, 1, 1, "#1a1a2a");
      r(ctx, x + 4, y - 2, 1, 1, "#ff5e8a"); r(ctx, x + 6, y - 2, 1, 1, "#ff5e8a"); r(ctx, x + 4, y - 1, 3, 1, "#ff5e8a"); r(ctx, x + 5, y, 1, 1, "#ff5e8a");
    } else {
      if (Math.floor(t / 12) % 2) disc(ctx, x + 5, y + 5, 6, "#ffe06644");
      disc(ctx, x + 5, y + 5, 4, "#ff9a3a");
      r(ctx, x + 4, y + 3, 2, 5, "#ffffff"); r(ctx, x + 3, y + 4, 4, 2, "#ffffff");
    }
  } else if (kind === "cell") {
    // A big energy cell: a glowing golden orb with a plus.
    disc(ctx, x + 5, y + 5, 8, Math.floor(t / 8) % 2 ? "#ffe06655" : "#ffe06622");
    disc(ctx, x + 5, y + 5, 6, "#c08a1a");
    disc(ctx, x + 5, y + 5, 5, "#ffd23f");
    r(ctx, x + 4, y + 2, 2, 7, "#ffffff"); r(ctx, x + 2, y + 4, 7, 2, "#ffffff");
  } else if (kind === "boost" || kind.startsWith("boost:")) {
    const id = kind.startsWith("boost:") ? (kind.slice(6) as BoostId) : null;
    const cyc = ["#ff7ad1", "#9affd8", "#5ef0ff", "#ffb35e", "#ffe066", "#c8ff5a"];
    const c = id ? BOOSTS[id].color : cyc[Math.floor(t / 6) % cyc.length];
    disc(ctx, x + 5, y + 5, 7, "#ffffff33");
    disc(ctx, x + 5, y + 5, 5, c);
    disc(ctx, x + 4, y + 4, 2, "#ffffffcc");
    if (id) drawBoostIcon(ctx, id, x, y, 1);
    else { r(ctx, x + 3, y + 2, 4, 1, "#2a1a4a"); r(ctx, x + 6, y + 3, 1, 2, "#2a1a4a"); r(ctx, x + 4, y + 5, 2, 1, "#2a1a4a"); r(ctx, x + 4, y + 7, 2, 1, "#2a1a4a"); }
  } else {
    // skill drop (refills the skill meter)
    disc(ctx, x + 5, y + 6, 4, "#2456e8");
    r(ctx, x + 4, y + 1, 2, 3, "#2456e8");
    r(ctx, x + 4, y + 5, 1, 2, "#ffffff");
  }
}

export function drawPowerIcon(ctx: Ctx, p: PowerId, x: number, y: number, s = 1) {
  const P = POWERS[p];
  const R = (a: number, b: number, w: number, h: number, c: string) => r(ctx, x + a * s, y + b * s, w * s, h * s, c);
  R(0, 0, 10, 10, P.color2);
  R(1, 1, 8, 8, P.color);
  const ink = P.color2;
  switch (p) {
    case "sneeze": R(2, 3, 2, 4, ink); R(4, 2, 1, 1, ink); R(5, 4, 3, 1, ink); R(5, 6, 3, 1, ink); R(6, 2, 2, 1, ink); break;
    case "cough": R(2, 4, 4, 2, ink); R(6, 3, 2, 1, ink); R(6, 6, 2, 1, ink); R(1, 3, 1, 4, ink); break;
    case "breath": R(2, 4, 6, 2, ink); R(3, 3, 4, 1, ink); R(4, 7, 2, 1, ink); break;
    case "plasma": R(4, 2, 2, 1, ink); R(3, 3, 4, 2, ink); R(2, 5, 6, 2, ink); R(3, 7, 4, 1, ink); break;
    case "acid": R(2, 4, 6, 1, ink); R(4, 2, 1, 6, ink); R(2, 2, 1, 1, ink); R(7, 7, 1, 1, ink); break;
    case "villi": R(2, 3, 1, 5, ink); R(4, 2, 1, 6, ink); R(6, 3, 1, 5, ink); R(1, 7, 8, 1, ink); break;
    case "platelet": R(2, 3, 3, 2, ink); R(5, 5, 3, 2, ink); R(3, 6, 2, 1, ink); break;
    case "saliva": R(4, 2, 2, 1, ink); R(3, 3, 4, 3, ink); R(4, 6, 2, 1, ink); R(2, 7, 1, 1, ink); R(7, 7, 1, 1, ink); break;
  }
}

/** A 10x10 power-up icon. */
export function drawBoostIcon(ctx: Ctx, id: BoostId, x: number, y: number, s = 1) {
  const B = BOOSTS[id];
  const R = (a: number, b: number, w: number, h: number, c: string) => r(ctx, x + a * s, y + b * s, w * s, h * s, c);
  R(0, 0, 10, 10, B.color2);
  R(1, 1, 8, 8, B.color);
  const ink = B.color2;
  switch (id) {
    case "membrane": R(2, 2, 1, 6, ink); R(7, 2, 1, 6, ink); R(4, 4, 2, 2, "#ffffff"); R(3, 4, 1, 2, "#ffffff"); break;
    case "leap": R(3, 2, 4, 1, ink); R(4, 3, 2, 1, ink); R(3, 4, 4, 1, ink); R(4, 5, 2, 1, ink); R(2, 7, 6, 2, ink); break;
    case "vaccine": R(2, 4, 5, 2, ink); R(7, 4, 1, 2, ink); R(1, 4, 1, 2, ink); R(4, 3, 1, 1, "#ffffff"); break;
    case "fever": R(4, 2, 2, 5, ink); R(3, 6, 4, 2, ink); R(4, 3, 1, 3, "#ff5e5e"); break;
    case "antibody": R(4, 5, 2, 3, ink); R(2, 2, 2, 3, ink); R(6, 2, 2, 3, ink); break;
    case "mucus": R(2, 3, 6, 4, ink); R(3, 7, 1, 2, ink); R(6, 7, 1, 1, ink); R(3, 4, 2, 1, "#ffffff"); break;
  }
}

/** An Antigen Clue: a glowing germ with a big "?" that floats in front of its biofilm barrier. */
function drawClue(ctx: Ctx, x: number, y: number, t: number, i: number) {
  const glow = Math.floor(t / 6) % 2;
  disc(ctx, x + CLUE_W / 2, y + CLUE_H / 2, 14, glow ? "#ffd23f33" : "#c9b8ff33");
  // little cilia waving
  for (let k = 0; k < 8; k++) {
    const a = (k / 8) * Math.PI * 2 + t / 20;
    r(ctx, x + 8 + Math.cos(a) * 10 - 1, y + 10 + Math.sin(a) * 10 - 1, 2, 2, "#ffd23f");
  }
  disc(ctx, x + 8, y + 10, 9, "#ffd23f");
  disc(ctx, x + 8, y + 10, 8, glow ? "#8a5ae8" : "#6a4ad1");
  const q = "#ffffff";
  r(ctx, x + 6, y + 4, 4, 1, q); r(ctx, x + 10, y + 5, 1, 2, q); r(ctx, x + 5, y + 5, 1, 1, q);
  r(ctx, x + 8, y + 7, 2, 1, q); r(ctx, x + 7, y + 8, 2, 2, q); r(ctx, x + 7, y + 11, 2, 2, q);
  r(ctx, x + 3, y + 15, 2, 2, "#1a1a2a"); r(ctx, x + 11, y + 15, 2, 2, "#1a1a2a");
  r(ctx, x + 7, y + 17, 2, 1, i % 2 ? "#5fff8a" : "#ff7ad1");
}

/** A biofilm barrier: a sticky, bubbly wall that only goes away when its Antigen Clue is answered. */
function drawBarrier(ctx: Ctx, x: number, top: number, h: number, t: number) {
  r(ctx, x, top, 12, h, "#2a5a3acc");
  for (let yy = top + ((t >> 1) % 10); yy < top + h; yy += 10) {
    disc(ctx, x + 3 + ((yy / 10) % 2 ? 0 : 5), yy, 2, "#9aff9a88");
  }
  r(ctx, x, top, 1, h, "#c8ff5a88");
  r(ctx, x + 11, top, 1, h, "#c8ff5a88");
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
    case "nose": {
      // The nasal tunnel: soft folds with tiny hairs and slow mucus drips.
      const o = par(0.3, 80);
      for (let i = -1; i < 6; i++) {
        oval(ctx, o + i * 80 + 40, 0, 46, 30, far);
        for (let k = 0; k < 6; k++) r(ctx, o + i * 80 + 18 + k * 8, 28 + (k % 2) * 3, 1, 6, "#3a0f2a");
        const drip = (t / 2 + i * 37) % 90;
        r(ctx, o + i * 80 + 60, 26, 3, Math.min(20, drip / 3), "#9aff9a66");
      }
      break;
    }
    case "throat": {
      // Arches of the throat with tonsils on the sides.
      const o = par(0.25, 120);
      for (let i = -1; i < 5; i++) {
        const x = o + i * 120;
        ctx.strokeStyle = far;
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.arc(x + 60, 150, 70, Math.PI, 0);
        ctx.stroke();
        oval(ctx, x + 6, 110, 9, 14, "#c85a6a");
        oval(ctx, x + 114, 110, 9, 14, "#c85a6a");
      }
      break;
    }
    case "lungs": {
      // Alveoli: bubbly clusters that gently grow and shrink as you breathe.
      const breath = 1 + Math.sin(t / 50) * 0.12;
      const o = par(0.3, 90);
      for (let i = -1; i < 6; i++) {
        const cx = o + i * 90 + 45;
        for (const [dx, dy, rr] of [[0, 60, 14], [-16, 74, 11], [16, 74, 11], [-8, 46, 9], [10, 44, 9]]) disc(ctx, cx + dx, dy, Math.round(rr * breath), far);
        r(ctx, cx - 1, 0, 3, 40, far);
      }
      break;
    }
    case "blood": {
      // Red blood cells streaming past.
      for (let i = 0; i < 14; i++) {
        const x = ((i * 47 - t * (1 + (i % 3) * 0.5) - camX * 0.4) % (SCREEN_W + 40) + SCREEN_W + 40) % (SCREEN_W + 40) - 20;
        const y = 20 + ((i * 29) % 110);
        oval(ctx, x, y, 8, 5, far);
        oval(ctx, x, y, 4, 2, "#3a0010");
      }
      break;
    }
    case "stomach": {
      // Stomach folds and a glowing acid lake far below.
      const o = par(0.3, 64);
      ctx.fillStyle = far;
      for (let i = -1; i < 7; i++) {
        ctx.beginPath();
        ctx.moveTo(o + i * 64, 0); ctx.quadraticCurveTo(o + i * 64 + 32, 60, o + i * 64 + 64, 0); ctx.fill();
      }
      const glow = 0.25 + 0.1 * Math.sin(t / 20);
      ctx.globalAlpha = glow;
      r(ctx, 0, 150, SCREEN_W, 50, th.hazard);
      ctx.globalAlpha = 1;
      for (let i = 0; i < 6; i++) disc(ctx, (i * 61 + t) % SCREEN_W, 170 - ((t * 0.7 + i * 23) % 40), 2, "#c8ff5a88");
      break;
    }
    case "gut": {
      // Villi: finger-like bumps, with friendly gut bacteria drifting by.
      const o = par(0.35, 24);
      for (let i = -1; i < 15; i++) {
        const h = 40 + ((i * 7) % 3) * 8;
        oval(ctx, o + i * 24 + 12, 150 - h / 2, 7, h / 2, far);
      }
      for (let i = 0; i < 5; i++) {
        const x = (i * 80 + t * 0.4 - camX * 0.2) % (SCREEN_W + 20);
        oval(ctx, ((x % (SCREEN_W + 20)) + SCREEN_W + 20) % (SCREEN_W + 20) - 10, 30 + i * 14, 5, 2, "#9aff9a88");
      }
      break;
    }
    case "skin": {
      // Skin layers seen up close: rows of cells.
      const o = par(0.3, 20);
      for (let row = 0; row < 6; row++) {
        for (let i = -1; i < 18; i++) {
          r(ctx, o + i * 20 + (row % 2 ? 10 : 0), 20 + row * 18, 18, 16, far);
          disc(ctx, o + i * 20 + (row % 2 ? 10 : 0) + 9, 28 + row * 18, 2, th.skyTop);
        }
      }
      break;
    }
    case "mouth": {
      // Rows of big friendly teeth at the top and bottom.
      const o = par(0.3, 32);
      for (let i = -1; i < 11; i++) {
        r(ctx, o + i * 32 + 2, 0, 28, 26, "#f2f4ff");
        r(ctx, o + i * 32 + 2, 22, 28, 4, "#c8d0e8");
        r(ctx, o + i * 32 + 6, 4, 4, 10, "#ffffff");
      }
      const tg = par(0.5, 120);
      for (let i = -1; i < 4; i++) oval(ctx, tg + i * 120 + 60, 150, 50, 16, far);
      break;
    }
    case "lymph": {
      // The lymph node: bean-shaped chambers and glowing vessels full of immune cells.
      const o = par(0.25, 110);
      for (let i = -1; i < 5; i++) {
        const cx = o + i * 110 + 55;
        oval(ctx, cx, 70, 36, 26, far);
        oval(ctx, cx, 70, 24, 16, th.skyTop);
        for (let k = 0; k < 4; k++) disc(ctx, cx - 12 + k * 8, 70 + ((k + Math.floor(t / 20)) % 2) * 3, 2, (t + k * 9) % 40 < 20 ? "#9affd855" : "#ff7ad155");
        r(ctx, cx + 34, 68, 24, 3, far);
      }
      break;
    }
  }
}

function drawLevel(ctx: Ctx, L: Level, th: StageTheme, s: Sim["s"], t: number) {
  const camX = s.camX;
  const vis = (x: number, w: number) => x + w >= camX - 4 && x <= camX + SCREEN_W + 4;
  const deco = th.deco;
  for (const sd of L.solids) {
    if (!vis(sd.x, sd.w)) continue;
    const x = sd.x - camX;
    if (sd.kind === "ground") {
      // Soft tissue: a smooth top edge and round cell bumps inside.
      r(ctx, x, sd.y, sd.w, sd.h, th.ground);
      r(ctx, x, sd.y, sd.w, 3, th.edge);
      r(ctx, x, sd.y + 3, sd.w, 1, "#00000044");
      ctx.globalAlpha = 0.18;
      for (let yy = sd.y + 12; yy < sd.y + sd.h; yy += 14) {
        for (let xx = ((yy / 14) % 2 ? 4 : 11); xx < sd.w - 4; xx += 14) disc(ctx, x + xx, yy, 3, "#000000");
      }
      ctx.globalAlpha = 1;
    } else if (sd.kind === "block") {
      if (deco === "skin") {
        // Platelet bridges patch the gap.
        oval(ctx, x + sd.w / 2, sd.y + sd.h / 2, sd.w / 2, sd.h / 2, "#c0392b");
        oval(ctx, x + sd.w / 2, sd.y + sd.h / 2 - 1, sd.w / 2 - 1, sd.h / 2 - 2, "#ffb0b0");
        r(ctx, x + sd.w / 2 - 3, sd.y + 3, 2, 2, "#1a1a2a"); r(ctx, x + sd.w / 2 + 2, sd.y + 3, 2, 2, "#1a1a2a");
      } else {
        r(ctx, x, sd.y, sd.w, sd.h, th.edge);
        r(ctx, x + 1, sd.y + 1, sd.w - 2, sd.h - 2, th.ground);
        r(ctx, x + 2, sd.y + 2, sd.w - 4, 1, "#ffffff44");
      }
    } else if (sd.kind === "barrier") {
      if (!s.clueDone[sd.qb!]) drawBarrier(ctx, x, 0, sd.y + sd.h, t);
    } else {
      r(ctx, x, sd.y, sd.w, sd.h, "#2a1a2a");
      r(ctx, x, sd.y, 2, sd.h, th.edge);
    }
  }
  // Rest stop: Hana the helper T cell with a REST sign
  if (L.restX && vis(L.restX - 30, 60)) {
    const x = L.restX - camX;
    const cp = L.checkpoints.find((c) => c.x === L.restX);
    const y = cp ? cp.y : 160;
    r(ctx, x + 14, y - 34, 2, 34, "#9aa4c8");
    r(ctx, x + 2, y - 46, 28, 13, "#1a1a2a");
    r(ctx, x + 3, y - 45, 26, 11, "#1e8a6a");
    ctx.fillStyle = "#ffe066";
    ctx.font = "5px 'Press Start 2P', monospace";
    ctx.fillText("REST", x + 6, y - 37);
    drawHelper(ctx, x + 22, y - 19, t);
  }
  // Boss door: a membrane gate
  const doorX = L.arenaX - 16 - camX;
  if (doorX > -20 && doorX < SCREEN_W + 20) {
    const shut = s.locked;
    r(ctx, doorX, L.arenaY - 64, 16, shut ? 64 : 10, "#3a2a4a");
    r(ctx, doorX + 2, L.arenaY - 62, 12, shut ? 60 : 6, th.edge);
    for (let yy = 0; yy < (shut ? 60 : 6); yy += 6) r(ctx, doorX + 2, L.arenaY - 62 + yy, 12, 1, "#00000055");
  }
  // Moving platforms: red-blood-cell rafts, breathing bubbles, or tissue pads
  for (const m of L.movers) {
    const p = moverPos(m, s.wt);
    if (!vis(p.x, m.w)) continue;
    const x = p.x - camX;
    if (deco === "blood") {
      oval(ctx, x + m.w / 2, p.y + 4, m.w / 2, 5, "#a01a2a");
      oval(ctx, x + m.w / 2, p.y + 4, m.w / 2 - 1, 4, "#e3262f");
      oval(ctx, x + m.w / 2, p.y + 4, m.w / 4, 2, "#a01a2a");
    } else if (deco === "lungs" || deco === "nose") {
      oval(ctx, x + m.w / 2, p.y + 4, m.w / 2, 5, "#ffffff55");
      oval(ctx, x + m.w / 2, p.y + 3, m.w / 2 - 2, 3, "#bdf4ffaa");
      r(ctx, x + 6, p.y + 1, 4, 1, "#ffffff");
    } else {
      r(ctx, x, p.y, m.w, m.h, "#3a2a3a");
      r(ctx, x, p.y, m.w, 2, th.edge);
      for (let xx = 4; xx < m.w - 2; xx += 8) disc(ctx, x + xx + 2, p.y + 5, 1, th.hazard);
    }
    if (m.axis === "y") r(ctx, x + m.w / 2 - 1, 0, 2, p.y, "#00000044");
  }
  // Spike strips (sticky mucus, splinters, acid puddles, sugar crumbs...)
  for (const sp of L.spikes) {
    if (!vis(sp.x, sp.w)) continue;
    ctx.fillStyle = th.hazard;
    if (deco === "stomach" || deco === "nose" || deco === "gut") {
      for (let xx = 0; xx < sp.w; xx += 8) disc(ctx, sp.x - camX + xx + 4, sp.y + sp.h - 2, 4, th.hazard);
      if (Math.floor(t / 10) % 2) r(ctx, sp.x - camX + (t % sp.w), sp.y + 2, 2, 2, "#ffffff");
    } else {
      for (let xx = 0; xx < sp.w; xx += 6) {
        ctx.beginPath();
        ctx.moveTo(sp.x - camX + xx, sp.y + sp.h);
        ctx.lineTo(sp.x - camX + xx + 3, sp.y);
        ctx.lineTo(sp.x - camX + xx + 6, sp.y + sp.h);
        ctx.fill();
      }
    }
  }
  // Timed hazards
  for (const pu of L.pulses) {
    if (!vis(pu.x, pu.w)) continue;
    const x = pu.x - camX;
    r(ctx, x - 3, pu.y + pu.h - 4, pu.w + 6, 4, "#3a2a3a");
    r(ctx, x - 3, pu.y - 4, pu.w + 6, 4, "#3a2a3a");
    if (pulseOn(pu, s.wt)) {
      const fl = Math.floor(t / 2) % 2;
      if (deco === "mouth" || deco === "throat") {
        // chomping teeth / cough blast: a white block slams shut
        r(ctx, x, pu.y, pu.w, pu.h, "#f2f4ff");
        for (let yy = pu.y; yy < pu.y + pu.h; yy += 10) r(ctx, x, yy, pu.w, 1, "#c8d0e8");
      } else {
        r(ctx, x, pu.y, pu.w, pu.h, th.hazard);
        r(ctx, x + 3 + fl, pu.y, pu.w - 6, pu.h, "#ffffffaa");
      }
    } else {
      const w = pulseWarn(pu, s.wt);
      if (w > 0 && Math.floor(t / 3) % 2) {
        r(ctx, x + 2, pu.y + pu.h - 10, pu.w - 4, 6, th.hazard);
        r(ctx, x + 2, pu.y, pu.w - 4, 6, th.hazard);
      }
    }
  }
  // Checkpoints: little flag posts that light up green
  L.checkpoints.forEach((cp, i) => {
    if (!vis(cp.x, 10)) return;
    const x = cp.x - camX;
    const lit = s.checkpoint >= i;
    r(ctx, x, cp.y - 24, 2, 24, "#9aa4c8");
    r(ctx, x + 2, cp.y - 24, 7, 5, lit ? "#5fff8a" : "#5a6488");
    if (lit && Math.floor(t / 10) % 2) r(ctx, x + 3, cp.y - 23, 3, 3, "#ffffff");
  });
  // The infected cell: viruses stuck on a body cell until the right immune skill helps it
  const g = L.gate;
  if (g && vis(g.x - 10, 40)) {
    const x = g.x - camX;
    const P = POWERS[g.power];
    oval(ctx, x + 10, g.y - 12, 13, 12, s.gateOpen ? "#ff9ac8" : "#c0396a");
    oval(ctx, x + 10, g.y - 12, 11, 10, s.gateOpen ? "#ffd0e0" : "#e87a9a");
    disc(ctx, x + 10, g.y - 13, 4, "#a01a5a");
    if (!s.gateOpen) {
      // stuck viruses and a glowing ring in the color of the skill that helps
      for (const [dx, dy] of [[-2, -20], [20, -16], [0, -4], [18, -4]]) {
        disc(ctx, x + dx + 1, g.y + dy, 3, "#ff7ad1");
        r(ctx, x + dx, g.y + dy - 1, 1, 1, "#1a1a2a");
      }
      const fl = Math.floor(t / 4) % 2;
      ctx.strokeStyle = fl ? P.color : P.color2;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(x + 10.5, g.y - 11.5, 16, 0, Math.PI * 2);
      ctx.stroke();
      drawPowerIcon(ctx, g.power, x + 5, g.y - 42);
    } else {
      r(ctx, x + 6, g.y - 15, 2, 2, "#1a1a2a"); r(ctx, x + 12, g.y - 15, 2, 2, "#1a1a2a");
      r(ctx, x + 7, g.y - 10, 6, 1, "#1a1a2a");
    }
    if (s.gateOpen && !s.capsule) {
      // a 1-up heart floats above the thankful cell
      const hy = g.y - 32 + Math.round(Math.sin(t / 10));
      r(ctx, x + 6, hy, 3, 3, "#ff3a5a"); r(ctx, x + 11, hy, 3, 3, "#ff3a5a"); r(ctx, x + 5, hy + 2, 10, 3, "#ff3a5a"); r(ctx, x + 7, hy + 5, 6, 2, "#ff3a5a"); r(ctx, x + 9, hy + 7, 2, 1, "#ff3a5a");
    }
  }
}

export interface Look {
  theme: StageTheme;
  stage: StageId;
}

/** Name of the boss on screen right now. */
export function bossNameOf(key: BossKey): string {
  return (ZONES.find((z) => z.id === key)?.boss ?? VIRUSES.find((v) => v.id === key)!.name);
}

/** Draws one frame of the game. */
export function drawGame(ctx: Ctx, sim: Sim, look: Look, particles: Particle[], gobblers: Gobbler[], t: number, banner: { text: string; sub?: string; t: number } | null) {
  const s = sim.s;
  const L = sim.level;
  const th = look.theme;
  drawBackground(ctx, th, s.camX, t);
  drawLevel(ctx, L, th, s, t);
  ctx.save();
  ctx.translate(-Math.round(s.camX), 0);
  for (const e of s.enemies) if (!e.dead && e.x + e.w > s.camX - 4 && e.x < s.camX + SCREEN_W + 4) drawEnemy(ctx, e);
  for (const it of s.pickups) if (it.x + 12 > s.camX && it.x < s.camX + SCREEN_W) drawPickup(ctx, it.kind === "boost" && it.boost ? `boost:${it.boost}` : it.kind, it.x, it.y, t, th.deco === "gut");
  L.clues.forEach((_, i) => {
    if (s.clueDone[i]) return;
    const q = sim.clueRect(i);
    if (q.x + 30 > s.camX && q.x - 20 < s.camX + SCREEN_W) drawClue(ctx, q.x, q.y, t, i);
  });
  // Boss
  const b = s.boss;
  if (b && s.mode !== "clear") {
    const down = s.mode === "bossDown";
    const pat = sim.pattern;
    if (b.warn > 0 && (pat === "dash" || pat === "teleport") && Math.floor(t / 3) % 2) {
      r(ctx, b.x - 2, b.y - 2, BOSS_W + 4, BOSS_H + 4, "#ffffff55");
    }
    const shake = down ? (t % 4) - 2 : 0;
    if (!(down && s.modeT > 120)) {
      if (down) ctx.globalAlpha = Math.max(0.2, 1 - s.modeT / 140);
      drawBoss(ctx, sim.bossKey, b.x + shake, b.y, { t: b.t, facing: s.p.x > b.x ? 1 : -1, flash: b.flinch > 0 && Math.floor(t / 4) % 2 === 0 });
      ctx.globalAlpha = 1;
    }
    if (b.shield > 0) {
      ctx.strokeStyle = Math.floor(t / 3) % 2 ? "#ffd23f" : "#ffffff";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(b.x + BOSS_W / 2, b.y + BOSS_H / 2, 22, 0, Math.PI * 2);
      ctx.stroke();
    }
    if (b.stun > 0 && Math.floor(t / 4) % 2) r(ctx, b.x + 4, b.y - 8, 18, 3, "#bdf4ff");
    // Antigen panel lights over its head
    if (s.mode === "boss" && s.fight) {
      const need = sim.band === "k2" ? 2 : 3;
      for (let i = 0; i < need; i++) r(ctx, b.x + BOSS_W / 2 - need * 3 + i * 6, b.y - 10, 4, 3, i < b.panel ? "#5fff8a" : "#2a2a3a");
    }
  }
  for (const sh of s.shots) drawShot(ctx, sh, t, s.boosts.antibody > 0);
  const p = s.p;
  if (s.mode !== "respawn" && s.mode !== "over") {
    drawHero(ctx, p.x, p.y, {
      facing: p.facing, frame: Math.floor(Math.abs(p.x) / 6), air: !p.onGround,
      colors: powerColors(sim.selectedPower), shield: p.shieldT > 0, dash: p.dashT > 0, glide: p.glideT > 0,
      blink: p.inv > 0 && Math.floor(t / 3) % 2 === 0 && p.shieldT <= 0,
      phase: s.boosts.membrane > 0, leap: s.boosts.leap > 0, vaccine: s.boosts.vaccine > 0, fever: s.boosts.fever > 0 && p.vx !== 0, mucus: s.boosts.mucus > 0,
    });
  }
  for (const gb of gobblers) drawMacrophage(ctx, gb.x, gb.y, gb.t, gb.dir);
  for (const pa of particles) {
    ctx.globalAlpha = Math.max(0, pa.life / pa.max);
    r(ctx, pa.x, pa.y, pa.size, pa.size, pa.color);
  }
  ctx.globalAlpha = 1;
  ctx.restore();
  if (s.slowT > 0) {
    ctx.globalAlpha = 0.12;
    r(ctx, 0, 0, SCREEN_W, SCREEN_H, "#9ad1ff");
    ctx.globalAlpha = 1;
  }
  drawHud(ctx, sim, t);
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

function drawHud(ctx: Ctx, sim: Sim, t: number) {
  const s = sim.s;
  bar(ctx, 6, 6, Math.max(0, s.energy), MAX_ENERGY, "#ffe066", "E");
  const sel = sim.selectedPower;
  bar(ctx, 17, 6, sel ? s.power : 0, POWER_MAX, sel ? POWERS[sel].color : "#5a6488", "S");
  if (sel) drawPowerIcon(ctx, sel, 28, 6);
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
  const nClues = sim.level.clues.length;
  if (nClues > 0 && !s.locked) {
    ctx.font = "5px 'Press Start 2P', monospace";
    const txt = `? ${s.clueDone.filter(Boolean).length}/${nClues}`;
    ctx.fillStyle = "#000000aa";
    ctx.fillRect(SCREEN_W - 40, 5, 36, 9);
    ctx.fillStyle = "#ffd23f";
    ctx.fillText(txt, SCREEN_W - 37, 12);
  }
  if (s.fight && s.boss && (s.mode === "boss" || s.mode === "quiz" || s.mode === "bossIntro" || s.mode === "bossDown")) {
    const f = s.fight;
    const x = SCREEN_W - 14;
    r(ctx, x - 1, 5, 8, f.maxHp * 6 + 3, "#000000aa");
    for (let i = 0; i < f.maxHp; i++) r(ctx, x, 6 + (f.maxHp - 1 - i) * 6 + 1, 6, 4, i < f.hp ? "#ff5e7a" : "#2a2a3a");
    ctx.fillStyle = "#f2f4ff";
    ctx.font = "5px 'Press Start 2P', monospace";
    const name = bossNameOf(sim.bossKey) + (sim.info.rush ? ` ${s.rushIdx + 1}/${VIRUSES.length}` : "");
    const w = ctx.measureText(name).width;
    r(ctx, x - w - 7, 5, w + 6, 9, "#000000aa");
    ctx.fillStyle = "#f2f4ff";
    ctx.fillText(name, x - w - 4, 12);
    if (f.weakReady && Math.floor(t / 8) % 2) {
      const m = "WEAK SPOT! x2";
      const mw = ctx.measureText(m).width;
      r(ctx, x - mw - 7, 14, mw + 6, 8, "#000000aa");
      ctx.fillStyle = "#ffd23f";
      ctx.fillText(m, x - mw - 4, 20);
    }
  }
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
    ctx.fillStyle = "#9affd8";
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
  for (const e of s.enemies) if (!e.dead) drawEnemy(ctx, { ...e, t: t + e.sx });
  ctx.restore();
}

export function themeFor(id: StageId): StageTheme {
  return id === "rush" ? RUSH.stage : ZONES.find((z) => z.id === id)!.stage;
}
