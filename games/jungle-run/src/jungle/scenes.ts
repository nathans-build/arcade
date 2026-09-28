/*
 * The chain of flip-screen jungle scenes. Pure (no DOM): scripts/check-data.ts generates
 * thousands of scenes for every band and proves each one is traversable with the physics
 * constants in physics.ts.
 *
 * One expedition LEG is 10 scenes:
 *   0 hazard (may hold a ladder to a tunnel that skips scenes 1–2)
 *   1 hazard · 2 hazard · 3 CROSSROADS (map challenge) · 4 hazard · 5 TIMELINE GATE
 *   6 hazard · 7 CROSSROADS · 8 hazard · 9 BASE CAMP (radio checkpoint question)
 */
import {
  CROC_MOUTH, CROC_W, GROUND, HERO_H, HERO_W, LADDER_W, LOG_H, LOG_W, SCORP_H, SCORP_W, SNAKE_H, SNAKE_W, TREASURE_W, W,
  airTime, jumpDist, jumpPeak, type Band, type Phys,
} from "./physics";

export const LEG_LENGTH = 10;
export const CROSSROADS_AT = [3, 7];
export const GATE_AT = 5;
export const CAMP_AT = 9;

export type HazardKind = "meadow" | "logs" | "vine" | "swamp" | "snake" | "scorpion" | "hole" | "ladder";
export type SceneKind = HazardKind | "crossroads" | "gate" | "camp";
export type TreasureKind = "map" | "compass" | "coin" | "flag" | "ballot" | "vase";
export const TREASURE_KINDS: TreasureKind[] = ["map", "compass", "coin", "flag", "ballot", "vase"];

export interface Pit {
  l: number;
  r: number;
  /** "tar" (vine pits), "water" (swamps), "hole" (small jumpable gaps). */
  fill: "tar" | "water" | "hole";
}
export interface Vine {
  px: number;
  py: number;
  len: number;
  /** Swing amplitude in radians. */
  amp: number;
  /** Seconds for a full back-and-forth swing. */
  period: number;
}
export interface Croc {
  /** Left end of the head (the jaw end: crocs face left). */
  x: number;
  /** Seconds offset into the open/close cycle. */
  phase: number;
}
export interface Patrol {
  a: number;
  b: number;
  speed: number;
}
export interface Treasure {
  x: number;
  kind: TreasureKind;
}
export interface Tunnel {
  scorpions: Patrol[];
  treasure: Treasure | null;
  /** Scene index the exit ladder leads up to. */
  exitTo: number;
}

export interface Scene {
  index: number;
  leg: number;
  kind: SceneKind;
  pit: Pit | null;
  vine: Vine | null;
  crocs: Croc[];
  /** Seconds each croc keeps its jaws shut, then open. */
  crocClosed: number;
  crocOpen: number;
  logs: { count: number; speed: number };
  snakes: number[];
  scorpions: Patrol[];
  /** Ladder hole (x of its left edge) down to a tunnel. */
  ladderX: number | null;
  tunnel: Tunnel | null;
  treasure: Treasure | null;
}

/** Deterministic PRNG so a seed reproduces an expedition. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function specialKind(index: number): SceneKind | null {
  const k = index % LEG_LENGTH;
  if (CROSSROADS_AT.includes(k)) return "crossroads";
  if (k === GATE_AT) return "gate";
  if (k === CAMP_AT) return "camp";
  return null;
}

const WEIGHTS: Record<Band, Partial<Record<HazardKind, number>>> = {
  0: { meadow: 2, logs: 2, vine: 2, swamp: 1, snake: 2, hole: 2 },
  1: { meadow: 0.6, logs: 2, vine: 2, swamp: 2, snake: 1, scorpion: 1, hole: 1 },
  2: { meadow: 0.3, logs: 2, vine: 2, swamp: 2, snake: 1, scorpion: 1.2, hole: 1 },
  3: { meadow: 0.2, logs: 2, vine: 2, swamp: 2, snake: 1.2, scorpion: 1.4, hole: 1 },
};

const LOG_SPEED: Record<Band, number> = { 0: 22, 1: 34, 2: 42, 3: 48 };
const SCORP_SPEED: Record<Band, number> = { 0: 14, 1: 22, 2: 28, 3: 34 };
const VINE_PERIOD: Record<Band, number> = { 0: 4.4, 1: 3.7, 2: 3.4, 3: 3.1 };
const PIT_W: Record<Band, [number, number]> = { 0: [78, 88], 1: [88, 98], 2: [94, 104], 3: [98, 108] };
const CROC_TIMES: Record<Band, [number, number]> = { 0: [4.2, 0.9], 1: [2.8, 1.1], 2: [2.4, 1.2], 3: [2.2, 1.3] };
const CROCS: Record<Band, number> = { 0: 2, 1: 2, 2: 3, 3: 3 };
/** The loop logs roll around (they leave on the left and come back on the right). */
export const LOG_LOOP = 380;
export const VINE_PY = 50;
export const VINE_LEN = 80;
/** Logs roll a little faster on each new leg (capped). */
export const logSpeed = (band: Band, leg: number) => LOG_SPEED[band] + Math.min(12, leg * 3);
export const scorpSpeed = (band: Band, leg: number) => SCORP_SPEED[band] + Math.min(8, leg * 2);

/** Gap between croc heads: a full jump from the end of one lands past the next one's jaw. */
export function crocGap(p: Phys): number {
  return Math.round(jumpDist(p) - 22);
}
export function holeWidth(p: Phys): number {
  return Math.min(36, Math.floor(jumpDist(p) - HERO_W - 14));
}

function pickWeighted<T extends string>(w: Partial<Record<T, number>>, rnd: () => number): T {
  const entries = Object.entries(w) as [T, number][];
  let r = rnd() * entries.reduce((a, [, v]) => a + v, 0);
  for (const [k, v] of entries) {
    r -= v;
    if (r <= 0) return k;
  }
  return entries[entries.length - 1][0];
}

function emptyScene(index: number, kind: SceneKind): Scene {
  return {
    index, leg: Math.floor(index / LEG_LENGTH), kind,
    pit: null, vine: null, crocs: [], crocClosed: 3, crocOpen: 1, logs: { count: 0, speed: 0 },
    snakes: [], scorpions: [], ladderX: null, tunnel: null, treasure: null,
  };
}

/** Free spots for a treasure on solid ground, away from pits, ladders and snakes. */
function treasureX(s: Scene, rnd: () => number, lo = 200, hi = 296): number {
  for (let tries = 0; tries < 40; tries++) {
    const x = Math.round(lo + rnd() * (hi - lo));
    if (spotIsClear(s, x)) return x;
  }
  return 296;
}

function spotIsClear(s: Scene, x: number): boolean {
  if (s.pit && x + TREASURE_W > s.pit.l - 14 && x < s.pit.r + 14) return false;
  if (s.ladderX !== null && x + TREASURE_W > s.ladderX - 12 && x < s.ladderX + LADDER_W + 12) return false;
  if (s.snakes.some((sx) => Math.abs(sx - x) < 28)) return false;
  return x >= 16 && x + TREASURE_W <= W - 12;
}

/**
 * Builds scene `index` for a band. `rnd` should be a seeded PRNG so replays match.
 * Scenes are generated one at a time as the explorer reaches them.
 */
export function planScene(index: number, band: Band, p: Phys, rnd: () => number): Scene {
  const special = specialKind(index);
  if (special) return emptyScene(index, special);
  const k = index % LEG_LENGTH;
  const leg = Math.floor(index / LEG_LENGTH);
  let kind: HazardKind;
  if (index === 0) kind = band === 0 ? "meadow" : "logs";
  else if (k === 0 && rnd() < 0.6) kind = "ladder";
  else kind = pickWeighted(WEIGHTS[band], rnd);
  const s = emptyScene(index, kind);
  const treasureChance = kind === "meadow" ? 1 : band === 0 ? 0.8 : 0.7;

  switch (kind) {
    case "logs": {
      const max = band === 0 ? 1 : band === 1 ? 2 : 3;
      s.logs = { count: Math.min(max, 1 + Math.floor(rnd() * max) + (leg > 0 && band > 0 ? 1 : 0)), speed: logSpeed(band, leg) };
      // Keep enough room between logs to land and jump again.
      while (s.logs.count > 1 && LOG_LOOP / s.logs.count < minLogSpacing(p, s.logs.speed)) s.logs.count--;
      break;
    }
    case "vine": {
      const [a, b] = PIT_W[band];
      const w = Math.round(a + rnd() * (b - a));
      const l = Math.round(150 - w / 2 + (rnd() - 0.5) * 20);
      s.pit = { l, r: l + w, fill: "tar" };
      const reach = w / 2 + HERO_W / 2 + 7;
      s.vine = { px: l + w / 2, py: VINE_PY, len: VINE_LEN, amp: Math.asin(Math.min(0.95, reach / VINE_LEN)), period: VINE_PERIOD[band] };
      if (band >= 2 && s.pit.r + 40 < 250) s.scorpions.push({ a: s.pit.r + 40, b: 300, speed: scorpSpeed(band, leg) });
      break;
    }
    case "swamp": {
      const n = CROCS[band];
      const g = crocGap(p);
      const width = g + n * (CROC_W + g);
      const l = Math.round((W - width) / 2);
      s.pit = { l, r: l + width, fill: "water" };
      const [closed, open] = CROC_TIMES[band];
      s.crocClosed = closed;
      s.crocOpen = open;
      for (let i = 0; i < n; i++) s.crocs.push({ x: l + g + i * (CROC_W + g), phase: rnd() * (closed + open) });
      break;
    }
    case "snake": {
      const n = band === 0 ? 1 : band === 1 ? 1 + Math.floor(rnd() * 2) : 2;
      if (n === 1) s.snakes.push(Math.round(140 + rnd() * 60));
      else s.snakes.push(Math.round(96 + rnd() * 30), Math.round(218 + rnd() * 34));
      break;
    }
    case "scorpion": {
      const n = band <= 1 ? 1 : 2;
      if (n === 1) s.scorpions.push({ a: 90, b: 250, speed: scorpSpeed(band, leg) });
      else s.scorpions.push({ a: 60, b: 160, speed: scorpSpeed(band, leg) }, { a: 180, b: 290, speed: scorpSpeed(band, leg) * 0.8 });
      break;
    }
    case "hole": {
      const w = holeWidth(p);
      const l = Math.round(130 + rnd() * 40);
      s.pit = { l, r: l + w, fill: "hole" };
      if (band >= 2) s.snakes.push(Math.min(292, l + w + 70));
      break;
    }
    case "ladder": {
      s.ladderX = 152;
      if (band >= 1) s.snakes.push(Math.round(230 + rnd() * 30));
      s.tunnel = {
        scorpions: [{ a: 60, b: 250, speed: scorpSpeed(band, leg) * 0.9 }],
        treasure: rnd() < 0.7 ? { x: Math.round(200 + rnd() * 40), kind: TREASURE_KINDS[Math.floor(rnd() * TREASURE_KINDS.length)] } : null,
        exitTo: index + 3,
      };
      break;
    }
    case "meadow":
      break;
  }
  if (rnd() < treasureChance) {
    const lo = s.pit ? s.pit.r + 24 : kind === "ladder" ? 186 : 170;
    s.treasure = { x: treasureX(s, rnd, Math.min(lo, 280), 296), kind: TREASURE_KINDS[Math.floor(rnd() * TREASURE_KINDS.length)] };
  }
  return s;
}

/** Front-to-front spacing logs need so the explorer can land between them and jump again. */
export function minLogSpacing(p: Phys, speed: number): number {
  return (p.airRun + speed) * airTime(p) + HERO_W + 16;
}

/* ---------------------------------------------------------------- vine geometry */

export function vineAngle(v: Vine, t: number): number {
  return v.amp * Math.sin((2 * Math.PI * t) / v.period);
}
export function vineTip(v: Vine, angle: number): { x: number; y: number } {
  return { x: v.px + Math.sin(angle) * v.len, y: v.py + Math.cos(angle) * v.len };
}

/** Croc jaws: open for the last `crocOpen` seconds of each cycle. */
export function crocOpenAt(s: Scene, c: Croc, t: number): boolean {
  const cyc = s.crocClosed + s.crocOpen;
  const u = (((t + c.phase) % cyc) + cyc) % cyc;
  return u >= s.crocClosed;
}

/* ---------------------------------------------------------------- traversability */

/**
 * Returns a list of problems (empty = fair). Checks every obstacle against the jump the
 * physics allows, with margins, so no scene ever needs an impossible jump.
 */
export function checkScene(s: Scene, p: Phys): string[] {
  const out: string[] = [];
  const D = jumpDist(p);
  const peak = jumpPeak(p);
  const air = airTime(p);
  const standTop = GROUND - HERO_H;
  const nums: number[] = [D, peak, air, s.crocClosed, s.crocOpen, s.logs.count, s.logs.speed, ...s.snakes];
  if (s.pit) nums.push(s.pit.l, s.pit.r);
  if (s.vine) nums.push(s.vine.px, s.vine.py, s.vine.len, s.vine.amp, s.vine.period);
  for (const c of s.crocs) nums.push(c.x, c.phase);
  for (const sc of s.scorpions) nums.push(sc.a, sc.b, sc.speed);
  if (s.treasure) nums.push(s.treasure.x);
  if (nums.some((n) => !Number.isFinite(n))) out.push("NaN or infinite value");

  // Snakes, scorpions and logs must be jumpable.
  if (s.snakes.length && (D < SNAKE_W + HERO_W + 8 || peak < SNAKE_H + 6)) out.push("snake too big to jump");
  for (const sc of s.scorpions) {
    if (sc.speed >= p.run) out.push("scorpion faster than the explorer");
    if (peak < SCORP_H + 6 || (p.airRun + sc.speed) * air < SCORP_W + HERO_W + 8) out.push("scorpion too big to jump");
    if (sc.b - sc.a < 20) out.push("scorpion patrol too short");
    if (s.pit && sc.b + SCORP_W > s.pit.l - 20 && sc.a < s.pit.r + 20) out.push("scorpion patrols into a pit");
  }
  if (s.logs.count > 0) {
    if (peak < LOG_H + 6) out.push("jump too low for logs");
    if ((p.airRun + s.logs.speed) * air < LOG_W + HERO_W + 8) out.push("logs too wide to jump");
    if (s.logs.count > 1 && LOG_LOOP / s.logs.count < minLogSpacing(p, s.logs.speed) - 1e-9) out.push("logs too close together");
    if (s.pit) out.push("logs in a scene with a pit");
  }
  // Snakes: not in or next to pits (room to land, then jump again), not on top of each other.
  const sorted = [...s.snakes].sort((a, b) => a - b);
  for (let i = 0; i < sorted.length; i++) {
    const x = sorted[i];
    if (x < 40 || x + SNAKE_W > W - 12) out.push(`snake at ${x} too close to the screen edge`);
    if (s.pit && x + SNAKE_W > s.pit.l - HERO_W - 24 && x < s.pit.r + HERO_W + 24) out.push(`snake at ${x} crowds the pit`);
    if (s.ladderX !== null && x + SNAKE_W > s.ladderX - 30 && x < s.ladderX + LADDER_W + 30) out.push("snake crowds the ladder");
    if (i > 0 && x - (sorted[i - 1] + SNAKE_W) < D + HERO_W) out.push("snakes too close to jump one at a time");
  }

  if (s.pit) {
    const w = s.pit.r - s.pit.l;
    if (s.pit.l < 40 || s.pit.r > W - 40) out.push("pit too close to the screen edge (no run-up or landing)");
    if (s.pit.fill === "hole" && D < w + HERO_W + 8) out.push(`hole ${w}px wider than a jump allows`);
    if (s.pit.fill === "tar") {
      const v = s.vine;
      if (!v) out.push("tar pit without a vine");
      else {
        const off = Math.sin(v.amp) * v.len;
        // At each end of its swing the tip must hang over solid ground past the edge,
        // so a standing drop lands safely (and the explorer can grab it from the edge).
        if (v.px - off > s.pit.l - HERO_W / 2 - 2) out.push("vine does not reach the near edge");
        if (v.px + off < s.pit.r + HERO_W / 2 + 2) out.push("vine does not reach the far edge");
        const tipY = v.py + Math.cos(v.amp) * v.len;
        // Hands (top of the hitbox) can reach the tip at the end of the swing during a jump.
        if (tipY < standTop - peak - 4) out.push(`vine tip (y ${tipY.toFixed(1)}) too high to grab`);
        if (tipY > standTop + 6) out.push("vine tip scrapes the ground");
        // Hanging at the bottom of the swing, feet stay above the tar.
        if (v.py + v.len + HERO_H > GROUND + 8) out.push("explorer would dip into the tar while hanging");
        if (v.period < 2 * air + 0.8) out.push("vine swings too fast to time a jump");
      }
    }
    if (s.pit.fill === "water") {
      if (s.crocs.length === 0) out.push("swamp without crocs");
      const plats = [...s.crocs].sort((a, b) => a.x - b.x).map((c) => ({ l: c.x, r: c.x + CROC_W }));
      // Standing on the bank (right edge of hitbox at the water) → first croc; croc → croc; last croc → far bank.
      let from = s.pit.l - HERO_W / 2 - 1;
      for (const pl of plats) {
        const land = from + D;
        if (land < pl.l + CROC_MOUTH + 1 || land > pl.r - 2) out.push(`full jump lands at ${land.toFixed(1)}, not on the safe back of the croc at ${pl.l}`);
        from = pl.r - 2;
      }
      if (from + D < s.pit.r + HERO_W / 2 + 1) out.push("cannot reach the far bank from the last croc");
      if (s.crocClosed < air + 1) out.push("croc jaws shut for too short a time");
    }
  }
  if (s.ladderX !== null && D < LADDER_W + HERO_W + 8) out.push("ladder hole too wide to jump over");

  if (s.treasure) {
    const t = s.treasure;
    if (!spotIsClear(s, t.x)) out.push(`treasure at ${t.x} is not on clear ground`);
  }
  if (s.tunnel) {
    for (const sc of s.tunnel.scorpions) if (sc.speed >= p.run) out.push("tunnel scorpion too fast");
    if (specialKind(s.tunnel.exitTo - 1) || specialKind(s.tunnel.exitTo - 2)) out.push("tunnel skips a crossroads, gate or camp");
  }
  return out;
}
