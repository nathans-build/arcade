import type { Band } from "./band";
import { ROBOTS, type PowerId, type StageId } from "./robots";

/*
 * Stage layouts, built from a short list of segments per stage (pixel units on a 320x200 screen).
 * Every stage: a long side-scrolling run with gaps, moving platforms, lifts, hazards, glitched mini-bots,
 * a checkpoint per section, a mid-stage rest stop, one power spot, three Quiz Bots (each guarding a
 * static barrier) and hidden power-up spots, then the boss arena. K-2 gets narrower gaps, fewer
 * mini-bots and slower hazards and platforms.
 */

export const SCREEN_W = 320;
export const SCREEN_H = 200;
export const GROUND_Y = 160;
/** Below this the hero has fallen into a pit. */
export const PIT_Y = 236;
export const FLOOR_BOTTOM = 260;
export const ARENA_W = SCREEN_W;

export interface Rect { x: number; y: number; w: number; h: number }
export interface Solid extends Rect {
  kind: "ground" | "block" | "wall" | "barrier";
  /** For a barrier: the Quiz Bot whose reboot switches it off. */
  qb?: number;
}
/** A one-way platform moving back and forth (triangle wave) along one axis. */
export interface Mover extends Rect { axis: "x" | "y"; range: number; period: number; phase: number }
/** A timed hazard (geyser, lightning, crusher...): dangerous while on. */
export interface Pulse extends Rect { period: number; on: number; phase: number }
export type EnemyKind = "walker" | "hopper" | "flyer" | "turret";
export interface EnemySpawn { x: number; y: number; kind: EnemyKind }
export interface Checkpoint { x: number; y: number }
/** A power spot: a glitch cage around a bonus capsule that opens only to one power. */
export interface Gate { x: number; y: number; power: PowerId }
/** A Quiz Bot: a special glowing bot holding a question screen, hovering in front of a static barrier. */
export interface QuizBotSpawn { x: number; y: number; barrierX: number }
/** A pickup placed in the level: energy cells at rest stops, bolts, and hidden power-up capsules. */
export interface ItemSpawn { x: number; y: number; kind: "cell" | "energy" | "bolt" | "boost" }

export interface Level {
  id: StageId;
  band: Band;
  width: number;
  start: Checkpoint;
  solids: Solid[];
  movers: Mover[];
  pulses: Pulse[];
  spikes: Rect[];
  enemies: EnemySpawn[];
  checkpoints: Checkpoint[];
  gate: Gate | null;
  quizBots: QuizBotSpawn[];
  items: ItemSpawn[];
  /** High ledges reachable only with a big jump (Spring Boots, Magma Hop...): optional bonus spots. */
  skyLedges: Rect[];
  /** The mid-stage rest stop (a checkpoint with energy cells). */
  restX: number;
  arenaX: number;
  arenaY: number;
  /** Solid column index: solids overlapping each 64px column (for fast collision). */
  cols: number[][];
}

type Seg =
  | ["flat", number, EnemyKind[]?]
  | ["gap", number]
  | ["up", number]
  | ["down", number]
  | ["mover", number]
  | ["lift", number]
  | ["spikes", number]
  | ["pulse", number]
  | ["blocks", number]
  | ["check"]
  | ["gate"]
  /** A Quiz Bot station: flat ground, the Quiz Bot, its barrier, then a checkpoint past it. */
  | ["quiz"]
  /** The mid-stage rest stop: a checkpoint and two energy cells. */
  | ["rest"]
  /** Stepping block up to a high block with a hidden power-up capsule. */
  | ["shelf"]
  /** A high ledge (only a big jump reaches it) with an energy cell and bolts. */
  | ["sky"];

/* Each stage leans on its own idea: pies and movers, geysers over lava, ink stampers and blocks,
 * cliffs and drops, lifts in the storm, zap gates on a neon number line, thorns and vines, gear lifts.
 * Every stage has two halves of three sections each. The first half has the power spot; then comes the
 * mid-stage REST STOP (checkpoint + energy cells), and the second half has the three Quiz Bot stations,
 * a hidden power-up capsule on a shelf and a high "sky ledge" for big jumps. Every section ends at a
 * checkpoint (each Quiz Bot station has one just past its barrier). */
const LAYOUTS: Record<StageId, Seg[]> = {
  splitz: [
    ["flat", 220, ["walker"]], ["gap", 40], ["flat", 120, ["hopper"]], ["mover", 128], ["flat", 150, ["walker", "flyer"]], ["check"],
    ["up", 24], ["flat", 96], ["spikes", 140], ["flat", 120, ["turret"]], ["gap", 44], ["flat", 100], ["check"],
    ["pulse", 2], ["flat", 90], ["gate"], ["flat", 100, ["walker", "walker"]], ["blocks", 3], ["flat", 130, ["flyer"]], ["down", 24], ["flat", 80], ["check"],
    ["rest"],
    ["flat", 90, ["walker"]], ["mover", 128], ["flat", 90, ["hopper"]], ["pulse", 2], ["flat", 60], ["quiz"],
    ["shelf"], ["gap", 40], ["flat", 100, ["flyer"]], ["blocks", 3], ["flat", 80, ["walker"]], ["quiz"],
    ["up", 24], ["sky"], ["mover", 136], ["flat", 100, ["turret", "walker"]], ["spikes", 120], ["flat", 60], ["quiz"], ["down", 24], ["flat", 80], ["check"], ["flat", 60],
  ],
  igneous: [
    ["flat", 200, ["walker"]], ["pulse", 2], ["flat", 80, ["flyer"]], ["blocks", 3], ["flat", 120, ["hopper"]], ["check"],
    ["gap", 40], ["flat", 80], ["gap", 44], ["flat", 120, ["walker", "flyer"]], ["pulse", 3], ["flat", 80], ["check"],
    ["mover", 136], ["flat", 100, ["turret"]], ["gate"], ["flat", 80], ["up", 28], ["flat", 100, ["hopper"]], ["blocks", 2], ["flat", 100], ["check"],
    ["rest"],
    ["flat", 90, ["hopper"]], ["pulse", 3], ["flat", 80, ["flyer"]], ["blocks", 3], ["flat", 60], ["quiz"],
    ["gap", 40], ["flat", 80, ["walker"]], ["sky"], ["pulse", 2], ["flat", 80, ["turret"]], ["quiz"],
    ["down", 28], ["shelf"], ["blocks", 2], ["flat", 90, ["hopper", "flyer"]], ["gap", 44], ["flat", 60], ["quiz"], ["flat", 60],
  ],
  syntaxor: [
    ["flat", 200, ["walker"]], ["blocks", 2], ["flat", 120, ["turret"]], ["spikes", 120], ["flat", 100], ["check"],
    ["up", 30], ["flat", 100, ["flyer"]], ["gap", 44], ["flat", 100], ["pulse", 2], ["flat", 100, ["walker"]], ["check"],
    ["mover", 128], ["flat", 100], ["gate"], ["flat", 90, ["hopper"]], ["down", 30], ["flat", 100, ["turret", "flyer"]], ["blocks", 3], ["flat", 100], ["check"],
    ["rest"],
    ["flat", 90, ["turret"]], ["spikes", 120], ["flat", 80, ["walker"]], ["pulse", 2], ["flat", 60], ["quiz"],
    ["shelf"], ["blocks", 3], ["flat", 90, ["flyer"]], ["up", 30], ["flat", 80, ["hopper"]], ["quiz"],
    ["sky"], ["mover", 128], ["flat", 90, ["walker", "turret"]], ["down", 30], ["spikes", 120], ["flat", 60], ["quiz"], ["flat", 60],
  ],
  meridian: [
    ["flat", 200, ["walker"]], ["up", 28], ["flat", 90], ["up", 28], ["flat", 100, ["hopper"]], ["gap", 44], ["flat", 100], ["check"],
    ["down", 28], ["flat", 100, ["flyer"]], ["mover", 136], ["flat", 100, ["walker"]], ["pulse", 2], ["flat", 90], ["check"],
    ["lift", 72], ["flat", 100, ["turret"]], ["gate"], ["flat", 90], ["gap", 40], ["flat", 80, ["flyer"]], ["down", 44], ["flat", 100, ["walker"]], ["down", 28], ["flat", 100], ["check"],
    ["rest"],
    ["up", 28], ["flat", 90, ["walker"]], ["gap", 44], ["flat", 90, ["flyer"]], ["down", 28], ["flat", 60], ["quiz"],
    ["sky"], ["lift", 56], ["flat", 90, ["turret"]], ["mover", 136], ["flat", 80, ["hopper"]], ["quiz"],
    ["down", 36], ["flat", 90, ["walker"]], ["shelf"], ["pulse", 2], ["flat", 80, ["flyer"]], ["gap", 40], ["flat", 60], ["quiz"], ["flat", 60],
  ],
  cumulo: [
    ["flat", 200, ["flyer"]], ["lift", 64], ["flat", 100, ["walker"]], ["pulse", 2], ["flat", 100], ["check"],
    ["gap", 40], ["flat", 90, ["flyer"]], ["mover", 128], ["flat", 100, ["hopper"]], ["down", 32], ["flat", 100, ["flyer"]], ["check"],
    ["lift", 72], ["flat", 100], ["gate"], ["flat", 90, ["turret"]], ["pulse", 3], ["flat", 80], ["down", 40], ["flat", 100, ["flyer", "walker"]], ["check"],
    ["rest"],
    ["gap", 40], ["flat", 90, ["flyer"]], ["pulse", 3], ["flat", 60, ["walker"]], ["down", 24], ["flat", 60], ["quiz"],
    ["sky"], ["lift", 56], ["flat", 90, ["flyer"]], ["mover", 128], ["flat", 80, ["hopper"]], ["quiz"],
    ["down", 32], ["flat", 90, ["turret"]], ["pulse", 2], ["shelf"], ["gap", 40], ["flat", 80, ["flyer", "walker"]], ["down", 24], ["flat", 60], ["quiz"], ["flat", 60],
  ],
  polarix: [
    ["flat", 200, ["walker"]], ["pulse", 2], ["flat", 100, ["turret"]], ["mover", 128], ["flat", 100], ["check"],
    ["pulse", 3], ["flat", 80, ["hopper"]], ["gap", 44], ["flat", 90], ["mover", 144], ["flat", 100, ["flyer"]], ["check"],
    ["up", 30], ["flat", 100, ["walker"]], ["gate"], ["flat", 90], ["spikes", 120], ["flat", 100, ["turret", "flyer"]], ["down", 30], ["flat", 100], ["check"],
    ["rest"],
    ["flat", 90, ["turret"]], ["pulse", 3], ["flat", 80, ["walker"]], ["mover", 136], ["flat", 60], ["quiz"],
    ["sky"], ["gap", 44], ["flat", 90, ["hopper"]], ["pulse", 2], ["flat", 80, ["flyer"]], ["quiz"],
    ["up", 30], ["shelf"], ["spikes", 120], ["flat", 90, ["walker", "turret"]], ["mover", 128], ["flat", 60], ["quiz"], ["down", 30], ["flat", 60],
  ],
  chlorophil: [
    ["flat", 200, ["hopper"]], ["spikes", 120], ["flat", 100, ["walker"]], ["blocks", 3], ["flat", 100], ["check"],
    ["up", 26], ["flat", 100, ["flyer"]], ["spikes", 140], ["flat", 100], ["pulse", 2], ["flat", 90, ["walker"]], ["check"],
    ["mover", 128], ["flat", 100, ["hopper"]], ["gate"], ["flat", 90], ["gap", 40], ["flat", 100, ["flyer", "turret"]], ["down", 26], ["flat", 100], ["check"],
    ["rest"],
    ["flat", 90, ["walker"]], ["spikes", 140], ["flat", 80, ["hopper"]], ["pulse", 2], ["flat", 60], ["quiz"],
    ["shelf"], ["mover", 128], ["flat", 90, ["flyer"]], ["blocks", 3], ["flat", 60], ["quiz"],
    ["up", 26], ["sky"], ["spikes", 120], ["flat", 90, ["turret", "walker"]], ["gap", 40], ["flat", 60], ["quiz"], ["down", 26], ["flat", 60],
  ],
  clio: [
    ["flat", 200, ["walker"]], ["lift", 64], ["flat", 100, ["turret"]], ["pulse", 2], ["flat", 100], ["check"],
    ["down", 32], ["flat", 100, ["hopper"]], ["mover", 128], ["flat", 100, ["flyer"]], ["pulse", 2], ["flat", 90], ["check"],
    ["lift", 64], ["flat", 100, ["walker"]], ["gate"], ["flat", 90], ["blocks", 3], ["flat", 100, ["flyer", "turret"]], ["down", 32], ["flat", 100], ["check"],
    ["rest"],
    ["flat", 90, ["hopper"]], ["pulse", 2], ["flat", 80, ["walker"]], ["mover", 128], ["flat", 60], ["quiz"],
    ["down", 32], ["sky"], ["blocks", 3], ["flat", 90, ["flyer"]], ["pulse", 2], ["flat", 60], ["quiz"],
    ["lift", 56], ["flat", 90, ["turret"]], ["shelf"], ["mover", 136], ["flat", 80, ["walker", "flyer"]], ["down", 24], ["flat", 60], ["quiz"], ["flat", 60],
  ],
  fortress: [
    ["flat", 200, ["walker"]], ["gap", 44], ["flat", 100, ["turret"]], ["pulse", 2], ["flat", 100], ["mover", 128], ["flat", 100, ["flyer"]], ["check"],
    ["lift", 64], ["flat", 100, ["hopper"]], ["spikes", 120], ["flat", 100, ["walker"]], ["blocks", 3], ["flat", 100], ["check"],
    ["pulse", 3], ["flat", 90, ["flyer", "turret"]], ["down", 32], ["flat", 100], ["mover", 136], ["flat", 100, ["hopper"]], ["gate"], ["flat", 90], ["check"],
    ["up", 28], ["flat", 100, ["walker", "flyer"]], ["gap", 40], ["flat", 100], ["pulse", 2], ["flat", 100, ["turret"]], ["check"],
    ["rest"],
    ["flat", 90, ["walker", "flyer"]], ["pulse", 3], ["flat", 80, ["turret"]], ["mover", 136], ["flat", 60], ["quiz"],
    ["down", 28], ["sky"], ["spikes", 120], ["flat", 90, ["hopper", "walker"]], ["blocks", 3], ["flat", 60], ["quiz"],
    ["shelf"], ["gap", 44], ["flat", 90, ["flyer", "turret"]], ["pulse", 2], ["flat", 60], ["quiz"], ["flat", 60],
  ],
};

export interface Tuning {
  gapScale: number;
  /** Keep every n-th mini-bot (1 = all). */
  enemyEvery: number;
  moverPeriod: number;
  pulsePeriod: number;
  pulseOn: number;
}

export function tuningFor(band: Band): Tuning {
  switch (band) {
    case "k2":
      return { gapScale: 0.72, enemyEvery: 2, moverPeriod: 300, pulsePeriod: 200, pulseOn: 50 };
    case "g35":
      return { gapScale: 0.9, enemyEvery: 1, moverPeriod: 250, pulsePeriod: 170, pulseOn: 55 };
    case "g68":
      return { gapScale: 1, enemyEvery: 1, moverPeriod: 230, pulsePeriod: 160, pulseOn: 60 };
    default:
      return { gapScale: 1, enemyEvery: 1, moverPeriod: 210, pulsePeriod: 150, pulseOn: 60 };
  }
}

/** The power spot in each stage opens to the power the stage's boss is weak to (the fortress: Polarity Pulse). */
export function gatePowerFor(id: StageId): PowerId {
  if (id === "fortress") return "polarity";
  return ROBOTS.find((r) => r.id === id)!.weakness;
}

export function buildLevel(id: StageId, band: Band): Level {
  const tune = tuningFor(band);
  const solids: Solid[] = [];
  const movers: Mover[] = [];
  const pulses: Pulse[] = [];
  const spikes: Rect[] = [];
  const enemies: EnemySpawn[] = [];
  const checkpoints: Checkpoint[] = [];
  let gate: Gate | null = null;
  const quizBots: QuizBotSpawn[] = [];
  const items: ItemSpawn[] = [];
  const skyLedges: Rect[] = [];
  let restX = 0;
  let x = 0;
  let gy = GROUND_Y;
  let enemyCount = 0;
  let pulseCount = 0;
  const ground = (x0: number, w: number, y: number) => solids.push({ x: x0, y, w, h: FLOOR_BOTTOM - y, kind: "ground" });
  const addEnemy = (kind: EnemyKind, ex: number, ey: number) => {
    enemyCount++;
    if (tune.enemyEvery > 1 && enemyCount % tune.enemyEvery === 0) return;
    const y = kind === "flyer" ? ey - 64 : kind === "turret" ? ey - 14 : ey - 12;
    enemies.push({ x: ex, y, kind });
  };
  const gapW = (w: number) => Math.round(w * tune.gapScale);

  for (const seg of LAYOUTS[id]) {
    switch (seg[0]) {
      case "flat": {
        const len = seg[1];
        ground(x, len, gy);
        const kinds = seg[2] ?? [];
        kinds.forEach((k, i) => addEnemy(k, Math.round(x + (len * (i + 1)) / (kinds.length + 1)), gy));
        x += len;
        break;
      }
      case "gap":
        x += gapW(seg[1]);
        break;
      case "up":
        gy -= seg[1];
        break;
      case "down":
        gy += seg[1];
        break;
      case "mover": {
        const w = seg[1];
        const pw = 40;
        movers.push({ x: x + 4, y: gy, w: pw, h: 8, axis: "x", range: w - pw - 8, period: tune.moverPeriod, phase: movers.length * 0.37 });
        x += w;
        break;
      }
      case "lift": {
        // A shaft with a safe floor and a lift beside a tall wall; the ground continues higher up.
        const h = seg[1];
        ground(x, 48, gy);
        movers.push({ x: x + 4, y: gy, w: 40, h: 8, axis: "y", range: -h, period: Math.round(tune.moverPeriod * 0.9), phase: 0 });
        x += 48;
        gy -= h;
        break;
      }
      case "spikes": {
        const len = seg[1];
        ground(x, len, gy);
        spikes.push({ x: x + 8, y: gy - 8, w: len - 16, h: 8 });
        // Stepping blocks over the spikes.
        for (let bx = x + 20; bx + 24 <= x + len - 8; bx += 48) solids.push({ x: bx, y: gy - 44, w: 24, h: 12, kind: "block" });
        x += len;
        break;
      }
      case "pulse": {
        const n = seg[1];
        const len = n * 72 + 24;
        ground(x, len, gy);
        for (let i = 0; i < n; i++) {
          pulses.push({ x: x + 40 + i * 72, y: gy - 80, w: 14, h: 80, period: tune.pulsePeriod, on: tune.pulseOn, phase: (pulseCount++ * 0.31) % 1 });
        }
        x += len;
        break;
      }
      case "blocks": {
        // A pit crossed on floating blocks.
        const n = seg[1];
        const step = gapW(56);
        for (let i = 0; i < n; i++) {
          solids.push({ x: x + 12 + i * step + (step - 32) / 2, y: gy - (i % 2 === 0 ? 16 : 28), w: 32, h: 12, kind: "block" });
        }
        x += n * step + 24;
        break;
      }
      case "check":
        checkpoints.push({ x: x - 40, y: gy });
        break;
      case "gate":
        gate = { x: x - 50, y: gy, power: gatePowerFor(id) };
        break;
      case "quiz": {
        const len = 200;
        ground(x, len, gy);
        const qb = quizBots.length;
        const barrierX = x + 144;
        quizBots.push({ x: barrierX - 14, y: gy - 30, barrierX });
        // A static barrier from the ground to far above the screen: no jump or power gets past it.
        solids.push({ x: barrierX, y: -400, w: 12, h: gy + 400, kind: "barrier", qb });
        checkpoints.push({ x: x + 176, y: gy });
        x += len;
        break;
      }
      case "rest": {
        const len = 160;
        ground(x, len, gy);
        restX = x + 80;
        checkpoints.push({ x: x + 80, y: gy });
        items.push({ x: x + 40, y: gy - 14, kind: "cell" }, { x: x + 116, y: gy - 14, kind: "cell" });
        x += len;
        break;
      }
      case "shelf": {
        const len = 150;
        ground(x, len, gy);
        solids.push({ x: x + 30, y: gy - 32, w: 28, h: 10, kind: "block" });
        solids.push({ x: x + 76, y: gy - 64, w: 34, h: 10, kind: "block" });
        items.push({ x: x + 88, y: gy - 64 - 14, kind: "boost" });
        x += len;
        break;
      }
      case "sky": {
        const len = 150;
        ground(x, len, gy);
        const ledge = { x: x + 50, y: gy - 80, w: 46, h: 10 };
        solids.push({ ...ledge, kind: "block" });
        skyLedges.push(ledge);
        items.push({ x: x + 54, y: ledge.y - 12, kind: "cell" }, { x: x + 68, y: ledge.y - 12, kind: "bolt" }, { x: x + 82, y: ledge.y - 12, kind: "bolt" });
        x += len;
        break;
      }
    }
  }

  // The boss arena: a closed room one screen wide.
  const arenaX = x;
  ground(arenaX, ARENA_W, gy);
  solids.push({ x: arenaX + ARENA_W, y: 0, w: 32, h: FLOOR_BOTTOM, kind: "wall" });
  // Left wall of the arena (only solid once the door has closed; sim handles that).
  const width = arenaX + ARENA_W;

  const cols: number[][] = [];
  const nCols = Math.ceil((width + 64) / 64) + 1;
  for (let c = 0; c < nCols; c++) cols.push([]);
  solids.forEach((s, i) => {
    for (let c = Math.max(0, Math.floor(s.x / 64)); c <= Math.min(nCols - 1, Math.floor((s.x + s.w) / 64)); c++) cols[c].push(i);
  });

  return { id, band, width, start: { x: 40, y: GROUND_Y }, solids, movers, pulses, spikes, enemies, checkpoints, gate, quizBots, items, skyLedges, restX, arenaX, arenaY: gy, cols };
}

/** Triangle wave 0..1..0 over one period. */
export function tri(t: number): number {
  const f = ((t % 1) + 1) % 1;
  return f < 0.5 ? f * 2 : 2 - f * 2;
}

export function moverPos(m: Mover, wt: number): { x: number; y: number } {
  const o = m.range * tri(wt / m.period + m.phase);
  return m.axis === "x" ? { x: m.x + o, y: m.y } : { x: m.x, y: m.y + o };
}

export function pulseOn(p: Pulse, wt: number): boolean {
  const f = ((wt / p.period + p.phase) % 1 + 1) % 1;
  return f < p.on / p.period;
}

/** 0..1 how close a pulse is to switching on (for the warning flicker); 0 when on or far off. */
export function pulseWarn(p: Pulse, wt: number): number {
  const f = ((wt / p.period + p.phase) % 1 + 1) % 1;
  const left = (1 - f) * p.period; // frames until it turns on
  return left < 40 && f >= p.on / p.period ? 1 - left / 40 : 0;
}
