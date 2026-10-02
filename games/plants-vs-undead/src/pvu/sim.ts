/*
 * Plants vs Undead simulation: no DOM, so scripts/check-bank.ts can run whole levels headless.
 *
 * Photosynthesis is the economy. The player gathers sunlight (falling motes), water (soil,
 * Rootknots) and carbon dioxide (air, drifting bubbles, defeated undead, Stoma Guards). Each time
 * the store has one of each, the leaf factory turns them into glucose (the currency) and releases
 * an O₂ bubble. Shade and dusk cut light; Frost Wraiths' cold slows the reaction.
 */
import type { Band, PlantKind } from "@/data/parts";
import {
  CELL_H, CELL_W, COLS, LAWN_X, LAWN_Y, LEVELS, PLANTS, ROWS, UNDEAD,
  availableOn, cellX, cellY, tuningFor, type Tuning, type UndeadKind,
} from "./defs";

export interface Plant {
  id: number;
  kind: PlantKind;
  col: number;
  row: number;
  hp: number;
  maxHp: number;
  /** Seconds until the next action. */
  t: number;
  /** Attack/act animation timer. */
  act: number;
  flash: number;
  age: number;
  phase: number;
}

export interface Undead {
  id: number;
  kind: UndeadKind;
  row: number;
  x: number;
  hp: number;
  maxHp: number;
  speed: number;
  dps: number;
  slowT: number;
  flash: number;
  walk: number;
  eating: boolean;
  summonT: number;
  dead: boolean;
}

export interface Shot {
  kind: "seed" | "leaf";
  row: number;
  x: number;
  x0: number;
  vx: number;
  dmg: number;
  hit: number[];
  t: number;
}

export type MoteKind = "light" | "water" | "co2";

export interface Mote {
  id: number;
  kind: MoteKind;
  x: number;
  y: number;
  vx: number;
  vy: number;
  /** Lands here (falling light) — NaN for drifting bubbles. */
  landY: number;
  life: number;
  value: number;
}

export interface Fx {
  kind: "text" | "o2" | "fly" | "spark" | "cloud" | "burst" | "poof" | "crumb";
  x: number;
  y: number;
  vx: number;
  vy: number;
  t: number;
  life: number;
  text?: string;
  color?: string;
  /** For "fly": which store icon it flies to. */
  icon?: MoteKind | "glucose";
  w?: number;
}

export interface Cart {
  row: number;
  state: "ready" | "rolling" | "gone";
  x: number;
}

export type Phase = "prewave" | "wave" | "hold" | "over";

export type SimEvent =
  | { type: "waveStart"; level: number; wave: number; big: boolean }
  | { type: "waveClear"; level: number; wave: number; lastOfLevel: boolean; final: boolean }
  | { type: "levelStart"; level: number }
  | { type: "heartLost"; row: number }
  | { type: "gameOver" }
  | { type: "boss" }
  | { type: "sound"; name: "shoot" | "hit" | "plant" | "collect" | "glucose" | "cart" | "burst" | "chomp" | "shovel" | "deny" | "defeat" };

export interface Stats {
  glucoseMade: number;
  batches: number;
  o2: number;
  light: number;
  water: number;
  co2: number;
  planted: number;
  defeated: number;
  heartsLost: number;
  wavesCleared: number;
}

interface Spawn {
  t: number;
  kind: UndeadKind;
  row: number;
}

/** Small seeded RNG so headless tests are repeatable. */
function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const STORE_MAX = 9;
const REACT_TIME = 1.1;

export class Sim {
  band: Band = 0;
  tune: Tuning = tuningFor(0);
  rand = rng(1);

  level = 1;
  wave = 1;
  phase: Phase = "prewave";
  phaseT = 0;
  time = 0;

  glucose = 0;
  score = 0;
  hearts = 3;
  store = { light: 0, water: 0, co2: 0 };
  /** Progress (0–1) of the batch being made, or -1 when idle. */
  react = -1;

  plants: Plant[] = [];
  undead: Undead[] = [];
  shots: Shot[] = [];
  motes: Mote[] = [];
  fx: Fx[] = [];
  carts: Cart[] = [];
  queue: Spawn[] = [];
  waveT = 0;
  waveTotal = 0;
  spawned = 0;

  /** Defenders available this level, and which have had their question answered. */
  available: PlantKind[] = [];
  learned = new Set<PlantKind>();
  /** Answered right: the next one of this kind is half price. */
  discount = new Set<PlantKind>();
  cooldown: Partial<Record<PlantKind, number>> = {};

  events: SimEvent[] = [];
  stats: Stats = Sim.emptyStats();
  private nextId = 1;
  private moteT = 0;
  private waterT = 0;
  private co2T = 0;
  private bubbleT = 0;

  static emptyStats(): Stats {
    return { glucoseMade: 0, batches: 0, o2: 0, light: 0, water: 0, co2: 0, planted: 0, defeated: 0, heartsLost: 0, wavesCleared: 0 };
  }

  newGame(band: Band, seed = Math.floor(Math.random() * 1e9)) {
    this.band = band;
    this.tune = tuningFor(band);
    this.rand = rng(seed);
    this.score = 0;
    this.hearts = this.tune.hearts;
    this.stats = Sim.emptyStats();
    this.events = [];
    this.startLevel(1);
  }

  get levelDef() {
    return LEVELS[this.level - 1];
  }

  get lanes() {
    return this.tune.lanes;
  }

  get wavesInLevel() {
    return this.tune.wavesPerLevel;
  }

  startLevel(n: number) {
    this.level = n;
    this.wave = 1;
    this.plants = [];
    this.undead = [];
    this.shots = [];
    this.motes = [];
    this.fx = [];
    this.queue = [];
    this.glucose = this.tune.startGlucose + (n - 1) * 25;
    this.store = { light: 1, water: 2, co2: 2 };
    this.react = -1;
    this.available = availableOn(n);
    this.learned = new Set();
    this.discount = new Set();
    this.cooldown = {};
    this.carts = this.lanes.map((row) => ({ row, state: "ready" as const, x: 16 }));
    this.phase = "prewave";
    this.phaseT = this.tune.firstWait;
    this.moteT = 1.5;
    this.waterT = this.tune.waterEvery;
    this.co2T = this.tune.co2Every;
    this.bubbleT = 6;
    this.events.push({ type: "levelStart", level: n });
  }

  /* ----------------------------------------------------------- light and cold */

  /** Sky light 0–1: the level's light, cut while a Shade is on the lawn. */
  get sky(): number {
    const shades = this.undead.filter((u) => u.kind === "shade" && !u.dead && u.x < 318).length;
    return this.levelDef.light * (shades > 0 ? Math.max(0.25, 0.45 - 0.08 * (shades - 1)) : 1);
  }

  get cold(): boolean {
    return this.undead.some((u) => u.kind === "frostwraith" && !u.dead && u.x < 318);
  }

  chilledRow(row: number): boolean {
    return this.undead.some((u) => u.kind === "frostwraith" && !u.dead && u.row === row && u.x < 318);
  }

  /* ----------------------------------------------------------- planting */

  plantAt(col: number, row: number): Plant | undefined {
    return this.plants.find((p) => p.col === col && p.row === row);
  }

  rowPlayable(row: number) {
    return this.lanes.includes(row);
  }

  priceOf(kind: PlantKind): number {
    const c = PLANTS[kind].cost;
    return this.discount.has(kind) ? Math.floor(c / 2) : c;
  }

  /** Why a plant can't go here, or null if it can. */
  whyNot(kind: PlantKind, col: number, row: number): string | null {
    if (this.phase === "over" || this.phase === "hold") return "WAIT";
    if (!this.available.includes(kind)) return "LOCKED";
    if (col < 0 || col >= COLS || row < 0 || row >= ROWS || !this.rowPlayable(row)) return "NOT HERE";
    if (this.plantAt(col, row)) return "TAKEN";
    if ((this.cooldown[kind] ?? 0) > 0) return "RECHARGING";
    if (this.glucose < this.priceOf(kind)) return "NEED GLUCOSE";
    return null;
  }

  plant(kind: PlantKind, col: number, row: number): boolean {
    if (this.whyNot(kind, col, row)) {
      this.events.push({ type: "sound", name: "deny" });
      return false;
    }
    const price = this.priceOf(kind);
    this.glucose -= price;
    this.discount.delete(kind);
    const def = PLANTS[kind];
    this.plants.push({ id: this.nextId++, kind, col, row, hp: def.hp, maxHp: def.hp, t: def.every * 0.5, act: 0, flash: 0, age: 0, phase: this.rand() * 6 });
    this.cooldown[kind] = def.cooldown;
    this.stats.planted++;
    this.events.push({ type: "sound", name: "plant" });
    this.fx.push({ kind: "poof", x: cellX(col) + 15, y: cellY(row) + 28, vx: 0, vy: 0, t: 0, life: 0.4, color: "#9a6233" });
    return true;
  }

  /** Dig up a plant: half its price comes back as glucose. */
  shovel(col: number, row: number): boolean {
    const i = this.plants.findIndex((p) => p.col === col && p.row === row);
    if (i < 0) return false;
    const p = this.plants[i];
    this.plants.splice(i, 1);
    const back = Math.floor(PLANTS[p.kind].cost / 2);
    this.glucose += back;
    this.events.push({ type: "sound", name: "shovel" });
    this.text(cellX(col) + 15, cellY(row) + 10, `+${back}`, "#ffd23f");
    return true;
  }

  /** Called when the player answers a seed card's question. */
  learn(kind: PlantKind, correct: boolean) {
    this.learned.add(kind);
    if (correct) {
      this.discount.add(kind);
      this.cooldown[kind] = 0;
    } else {
      // A wrong answer costs time: the card has to recharge first.
      this.cooldown[kind] = Math.max(this.cooldown[kind] ?? 0, PLANTS[kind].cooldown + 4);
    }
  }

  /* ----------------------------------------------------------- collecting */

  /** Collect every mote within r of (x, y). Returns how many. */
  collectAt(x: number, y: number, r = 12): number {
    let n = 0;
    for (const m of this.motes) {
      if (m.life <= 0) continue;
      if (Math.abs(m.x - x) <= r && Math.abs(m.y - y) <= r) {
        this.gain(m.kind, m.value, m.x, m.y);
        m.life = 0;
        n++;
      }
    }
    if (n) this.events.push({ type: "sound", name: "collect" });
    return n;
  }

  /** Collect motes inside a lawn cell (keyboard cursor). */
  collectCell(col: number, row: number): number {
    const x0 = cellX(col);
    const y0 = cellY(row);
    let n = 0;
    for (const m of this.motes) {
      if (m.life <= 0) continue;
      if (m.x >= x0 - 3 && m.x <= x0 + CELL_W + 3 && m.y >= y0 - 3 && m.y <= y0 + CELL_H + 3) {
        this.gain(m.kind, m.value, m.x, m.y);
        m.life = 0;
        n++;
      }
    }
    if (n) this.events.push({ type: "sound", name: "collect" });
    return n;
  }

  private gain(kind: MoteKind, value: number, x: number, y: number) {
    this.store[kind] = Math.min(STORE_MAX, this.store[kind] + value);
    this.stats[kind] += value;
    this.fx.push({ kind: "fly", x, y, vx: 0, vy: 0, t: 0, life: 0.5, icon: kind });
  }

  private text(x: number, y: number, text: string, color: string) {
    this.fx.push({ kind: "text", x, y, vx: 0, vy: -14, t: 0, life: 0.9, text, color });
  }

  /* ----------------------------------------------------------- waves */

  private pickKind(): UndeadKind {
    const pool = this.levelDef.pool;
    const entries = Object.entries(pool) as [UndeadKind, number][];
    // K–2 never meet the floaters before level 3 (pools already do this) and see fewer tough ones.
    const total = entries.reduce((a, [, w]) => a + w, 0);
    let r = this.rand() * total;
    for (const [k, w] of entries) {
      r -= w;
      if (r <= 0) return k;
    }
    return entries[0][0];
  }

  buildWave(): Spawn[] {
    const t = this.tune;
    const last = this.wave === t.wavesPerLevel;
    let count = Math.max(2, Math.round((2 + this.level * 1.6 + this.wave * 1.6) * t.countMul));
    if (last) count = Math.round(count * 1.4);
    const gap = Math.max(2.2, 8.5 - this.level * 0.8 - this.wave * 0.6) * (t.band === 0 ? 1.4 : 1);
    const out: Spawn[] = [];
    let time = 2;
    for (let i = 0; i < count; i++) {
      const kind = this.pickKind();
      const row = this.lanes[Math.floor(this.rand() * this.lanes.length)];
      if (kind === "blightbug") {
        for (let k = 0; k < 3; k++) out.push({ t: time + k * 0.6, kind, row });
      } else out.push({ t: time, kind, row });
      // Big waves bunch up in the second half.
      time += last && i > count / 2 ? gap * 0.45 : gap * (0.7 + this.rand() * 0.6);
    }
    if (last && this.levelDef.boss) {
      out.push({ t: Math.max(4, time * 0.35), kind: "weedlich", row: this.lanes[Math.floor(this.lanes.length / 2)] });
    }
    return out.sort((a, b) => a.t - b.t);
  }

  private startWave() {
    this.phase = "wave";
    this.queue = this.buildWave();
    this.waveTotal = this.queue.length;
    this.spawned = 0;
    this.waveT = 0;
    this.events.push({ type: "waveStart", level: this.level, wave: this.wave, big: this.wave === this.tune.wavesPerLevel });
  }

  spawn(kind: UndeadKind, row: number, x = 330): Undead {
    const d = UNDEAD[kind];
    const hpMul = kind === "weedlich" ? 0.6 + 0.4 * this.tune.hpMul : this.tune.hpMul;
    const u: Undead = {
      id: this.nextId++, kind, row, x, hp: Math.round(d.hp * hpMul), maxHp: Math.round(d.hp * hpMul),
      speed: d.speed * this.tune.speedMul * (0.9 + this.rand() * 0.2), dps: d.dps, slowT: 0, flash: 0,
      walk: this.rand() * 2, eating: false, summonT: 7, dead: false,
    };
    this.undead.push(u);
    if (kind === "weedlich") this.events.push({ type: "boss" });
    return u;
  }

  /** Progress of the current wave, 0–1. */
  get waveProgress(): number {
    if (this.phase !== "wave") return this.phase === "hold" ? 1 : 0;
    if (!this.waveTotal) return 0;
    const alive = this.undead.filter((u) => !u.dead).length;
    return Math.max(0, Math.min(1, (this.spawned - alive * 0.5) / this.waveTotal));
  }

  /** After the between-wave checkpoint (or level-clear transmission). */
  resolveHold(correct: boolean) {
    if (this.phase !== "hold") return;
    if (correct) {
      this.glucose += 50;
      const gone = this.carts.find((c) => c.state === "gone");
      if (gone) {
        gone.state = "ready";
        gone.x = 16;
      }
    }
    const last = this.wave >= this.tune.wavesPerLevel;
    if (last) {
      if (this.level >= LEVELS.length) {
        this.phase = "over";
        return;
      }
      this.startLevel(this.level + 1);
      return;
    }
    this.wave++;
    this.phase = "prewave";
    this.phaseT = this.tune.waveWait;
  }

  /* ----------------------------------------------------------- update */

  update(dt: number) {
    if (this.phase === "over" || this.phase === "hold") {
      this.updateFx(dt);
      return;
    }
    this.time += dt;
    for (const k of Object.keys(this.cooldown) as PlantKind[]) this.cooldown[k] = Math.max(0, (this.cooldown[k] ?? 0) - dt);

    if (this.phase === "prewave") {
      this.phaseT -= dt;
      if (this.phaseT <= 0) this.startWave();
    } else {
      this.waveT += dt;
      while (this.queue.length && this.queue[0].t <= this.waveT) {
        const s = this.queue.shift()!;
        this.spawn(s.kind, s.row);
        this.spawned++;
      }
    }

    this.updateResources(dt);
    this.updatePlants(dt);
    this.updateShots(dt);
    this.updateUndead(dt);
    this.updateCarts(dt);
    this.updateMotes(dt);
    this.updateFx(dt);

    if (this.phase === "wave" && this.queue.length === 0 && this.undead.length === 0) {
      this.phase = "hold";
      this.shots = [];
      this.stats.wavesCleared++;
      const lastOfLevel = this.wave >= this.tune.wavesPerLevel;
      this.events.push({ type: "waveClear", level: this.level, wave: this.wave, lastOfLevel, final: lastOfLevel && this.level >= LEVELS.length });
    }
  }

  private updateResources(dt: number) {
    const t = this.tune;
    const sky = this.sky;
    // Sunlight motes fall from the sky — fewer when it is dim.
    this.moteT -= dt * Math.max(0.2, sky);
    if (this.moteT <= 0) {
      this.moteT = t.moteEvery * (0.8 + this.rand() * 0.4);
      const col = Math.floor(this.rand() * COLS);
      const row = this.lanes[Math.floor(this.rand() * this.lanes.length)];
      this.motes.push({
        id: this.nextId++, kind: "light", x: cellX(col) + 8 + this.rand() * 14, y: LAWN_Y - 4, vx: 0, vy: 22,
        landY: cellY(row) + 8 + this.rand() * 18, life: 9, value: 1,
      });
    }
    // Soil water and air CO₂ trickle in on their own.
    this.waterT -= dt;
    if (this.waterT <= 0) {
      this.waterT = t.waterEvery;
      this.gainQuiet("water", 1, 10, 186);
    }
    this.co2T -= dt;
    if (this.co2T <= 0) {
      this.co2T = t.co2Every;
      this.gainQuiet("co2", 1, 10, 30);
    }
    // CO₂ bubbles drift across the lawn from the right.
    this.bubbleT -= dt;
    if (this.bubbleT <= 0) {
      this.bubbleT = 9 + this.rand() * 6;
      const row = this.lanes[Math.floor(this.rand() * this.lanes.length)];
      this.motes.push({ id: this.nextId++, kind: "co2", x: 312, y: cellY(row) + 10 + this.rand() * 12, vx: -9, vy: 0, landY: NaN, life: 14, value: 2 });
    }
    // Photosynthesis: light + water + CO₂ → glucose + O₂. Cold slows it down.
    const s = this.store;
    if (this.react < 0 && s.light >= 1 && s.water >= 1 && s.co2 >= 1) {
      s.light--;
      s.water--;
      s.co2--;
      this.react = 0;
    }
    if (this.react >= 0) {
      this.react += dt / (REACT_TIME * (this.cold ? 2.2 : 1));
      if (this.react >= 1) {
        this.react = -1;
        this.glucose += t.batch;
        this.score += 10;
        this.stats.glucoseMade += t.batch;
        this.stats.batches++;
        this.stats.o2++;
        this.events.push({ type: "sound", name: "glucose" });
        this.fx.push({ kind: "o2", x: 168, y: 14, vx: 4 - this.rand() * 8, vy: -10, t: 0, life: 1.6 });
        this.fx.push({ kind: "fly", x: 168, y: 10, vx: 0, vy: 0, t: 0, life: 0.5, icon: "glucose" });
      }
    }
  }

  private gainQuiet(kind: MoteKind, n: number, x: number, y: number) {
    this.store[kind] = Math.min(STORE_MAX, this.store[kind] + n);
    this.stats[kind] += n;
    this.fx.push({ kind: "fly", x, y, vx: 0, vy: 0, t: 0, life: 0.6, icon: kind });
  }

  /** Stem Pipes next to a plant speed it up (water and sugar delivered faster). */
  boostOf(p: Plant): number {
    let n = 0;
    for (const q of this.plants) {
      if (q.kind !== "stem" || q === p) continue;
      if (Math.abs(q.col - p.col) + Math.abs(q.row - p.row) === 1) n++;
    }
    return 1 + 0.5 * Math.min(2, n);
  }

  private firstUndeadAhead(row: number, x: number, range = 999): Undead | undefined {
    let best: Undead | undefined;
    for (const u of this.undead) {
      if (u.dead || u.row !== row || u.x < x - 4 || u.x > 318 || u.x > x + range) continue;
      if (!best || u.x < best.x) best = u;
    }
    return best;
  }

  private updatePlants(dt: number) {
    const sky = this.sky;
    for (const p of [...this.plants]) {
      p.age += dt;
      p.flash = Math.max(0, p.flash - dt);
      p.act = Math.max(0, p.act - dt);
      const def = PLANTS[p.kind];
      const rate = this.boostOf(p) * (this.chilledRow(p.row) ? 0.6 : 1);
      const cx = cellX(p.col) + 15;
      const cy = cellY(p.row) + 14;
      if (p.kind === "berry") {
        if (p.age < 1.2) continue;
        const near = this.undead.find((u) => !u.dead && u.row === p.row && Math.abs(u.x - cx) < 16);
        if (near) this.burst(p);
        continue;
      }
      if (!def.every) continue;
      p.t -= dt * rate;
      if (p.t > 0) continue;
      switch (p.kind) {
        case "sunleaf":
        case "chloro": {
          p.t = def.every;
          // A leaf (or chloroplast) catches light — less when the sky is dim.
          const n = p.kind === "chloro" ? 2 : 1;
          let got = 0;
          for (let i = 0; i < n; i++) if (this.rand() < sky) got++;
          if (got) {
            p.act = 0.3;
            this.store.light = Math.min(STORE_MAX, this.store.light + got);
            this.stats.light += got;
            this.fx.push({ kind: "fly", x: cx, y: cy - 6, vx: 0, vy: 0, t: 0, life: 0.6, icon: "light" });
          } else this.text(cx, cy - 8, "DIM", "#6a78b8");
          break;
        }
        case "rootknot":
          p.t = def.every;
          p.act = 0.3;
          this.gainQuiet("water", 1, cx, cy + 10);
          break;
        case "stoma":
          p.t = def.every;
          p.act = 0.3;
          this.gainQuiet("co2", 1, cx, cy);
          break;
        case "slinger": {
          if (!this.firstUndeadAhead(p.row, cx)) {
            p.t = 0.2;
            break;
          }
          p.t = def.every;
          p.act = 0.2;
          this.shots.push({ kind: "seed", row: p.row, x: cx + 7, x0: cx + 7, vx: 120, dmg: 20, hit: [], t: 0 });
          this.events.push({ type: "sound", name: "shoot" });
          break;
        }
        case "frond": {
          if (!this.firstUndeadAhead(p.row, cx)) {
            p.t = 0.2;
            break;
          }
          p.t = def.every;
          p.act = 0.2;
          this.shots.push({ kind: "leaf", row: p.row, x: cx + 6, x0: cx + 6, vx: 85, dmg: 16, hit: [], t: 0 });
          this.events.push({ type: "sound", name: "shoot" });
          break;
        }
        case "pollen": {
          const range = CELL_W * 2.5;
          if (!this.firstUndeadAhead(p.row, cx, range)) {
            p.t = 0.2;
            break;
          }
          p.t = def.every;
          p.act = 0.4;
          this.fx.push({ kind: "cloud", x: cx + 6, y: cy - 2, vx: 0, vy: 0, t: 0, life: 1.2, w: range });
          for (const u of this.undead) {
            if (u.dead || u.row !== p.row || u.x < cx - 4 || u.x > cx + range) continue;
            u.slowT = 3;
            this.damage(u, 6);
          }
          break;
        }
        default:
          p.t = 99;
      }
    }
  }

  private burst(p: Plant) {
    const cx = cellX(p.col) + 15;
    for (const u of this.undead) {
      if (u.dead || Math.abs(u.row - p.row) > 1 || Math.abs(u.x - cx) > 42) continue;
      this.damage(u, u.kind === "weedlich" ? 400 : 200);
    }
    this.plants = this.plants.filter((q) => q !== p);
    this.fx.push({ kind: "burst", x: cx, y: cellY(p.row) + 14, vx: 0, vy: 0, t: 0, life: 0.6 });
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      this.fx.push({ kind: "crumb", x: cx, y: cellY(p.row) + 14, vx: Math.cos(a) * 60, vy: Math.sin(a) * 60 - 20, t: 0, life: 0.7, color: "#ffd23f" });
    }
    this.events.push({ type: "sound", name: "burst" });
  }

  damage(u: Undead, n: number) {
    if (u.dead) return;
    u.hp -= n;
    u.flash = 0.12;
    if (u.hp <= 0) this.defeat(u);
  }

  private defeat(u: Undead) {
    u.dead = true;
    const d = UNDEAD[u.kind];
    this.score += d.points;
    this.stats.defeated++;
    const y = cellY(u.row) + 12;
    this.fx.push({ kind: "poof", x: u.x, y: y + 8, vx: 0, vy: 0, t: 0, life: 0.5, color: "#c8c8d8" });
    this.text(u.x, y - 6, `+${d.points}`, "#ffffff");
    // Decomposing undead give back CO₂ — catch the bubble!
    if (u.kind !== "blightbug" || this.rand() < 0.4) {
      this.motes.push({ id: this.nextId++, kind: "co2", x: u.x, y, vx: -3, vy: -5, landY: NaN, life: 8, value: 1 });
    }
    this.events.push({ type: "sound", name: "defeat" });
  }

  private updateShots(dt: number) {
    for (const s of this.shots) {
      s.t += dt;
      s.x += s.vx * dt;
      for (const u of this.undead) {
        if (u.dead || u.row !== s.row || s.hit.includes(u.id)) continue;
        const reach = u.kind === "weedlich" ? 10 : 5;
        if (s.x >= u.x - reach && s.x <= u.x + 8) {
          this.damage(u, s.dmg);
          this.events.push({ type: "sound", name: "hit" });
          s.hit.push(u.id);
          this.fx.push({ kind: "spark", x: s.x, y: cellY(s.row) + 12, vx: 0, vy: 0, t: 0, life: 0.2, color: s.kind === "seed" ? "#e8c088" : "#a8ff7a" });
          if (s.kind === "seed") {
            s.x = 999;
            break;
          }
        }
      }
    }
    this.shots = this.shots.filter((s) => s.x < 330);
  }

  private updateUndead(dt: number) {
    for (const u of this.undead) {
      if (u.dead) continue;
      u.flash = Math.max(0, u.flash - dt);
      u.slowT = Math.max(0, u.slowT - dt);
      const slow = u.slowT > 0 ? 0.5 : 1;
      // Eat the plant in front, if any.
      const front = u.x - (u.kind === "weedlich" ? 10 : 5);
      let target: Plant | undefined;
      for (const p of this.plants) {
        if (p.row !== u.row) continue;
        const pc = cellX(p.col) + 15;
        if (front <= pc + 9 && u.x >= pc - 4) {
          if (!target || p.col > target.col) target = p;
        }
      }
      if (u.kind === "weedlich") {
        u.summonT -= dt;
        if (u.summonT <= 0) {
          u.summonT = 9;
          for (const r of [u.row - 1, u.row + 1]) if (this.rowPlayable(r)) this.spawn("blightbug", r, Math.min(318, u.x + 4));
        }
      }
      u.eating = !!target;
      if (target) {
        u.walk += dt * 3;
        target.hp -= u.dps * slow * dt;
        target.flash = 0.06;
        if (target.kind === "thorn") this.damage(u, 14 * dt);
        if (Math.floor(u.walk * 2) !== Math.floor((u.walk - dt * 3) * 2)) this.events.push({ type: "sound", name: "chomp" });
        if (target.hp <= 0) this.plants = this.plants.filter((p) => p !== target);
      } else {
        u.x -= u.speed * slow * dt;
        u.walk += dt * (u.speed / 6) * slow;
      }
      // The last line: a gnome cart, then the greenhouse.
      if (u.x < LAWN_X - 2) {
        const cart = this.carts.find((c) => c.row === u.row && c.state === "ready");
        if (cart) {
          cart.state = "rolling";
          this.events.push({ type: "sound", name: "cart" });
        }
      }
      if (!u.dead && u.x < 4) {
        u.dead = true;
        this.hearts--;
        this.stats.heartsLost++;
        this.fx.push({ kind: "poof", x: 8, y: cellY(u.row) + 18, vx: 0, vy: 0, t: 0, life: 0.6, color: "#e3262f" });
        this.events.push({ type: "heartLost", row: u.row });
        if (this.hearts <= 0) {
          this.phase = "over";
          this.events.push({ type: "gameOver" });
        }
      }
    }
    this.undead = this.undead.filter((u) => !u.dead);
  }

  private updateCarts(dt: number) {
    for (const c of this.carts) {
      if (c.state !== "rolling") continue;
      c.x += 150 * dt;
      for (const u of this.undead) {
        if (u.dead || u.row !== c.row || Math.abs(u.x - c.x) > 10) continue;
        if (u.kind === "weedlich") {
          this.damage(u, 700);
          u.x += 20;
          c.x = 999;
        } else this.damage(u, 9999);
      }
      if (c.x > 330) c.state = "gone";
    }
  }

  private updateMotes(dt: number) {
    for (const m of this.motes) {
      if (Number.isNaN(m.landY)) {
        // Drifting bubble
        m.x += m.vx * dt;
        m.y += m.vy * dt + Math.sin(this.time * 3 + m.id) * 4 * dt;
        if (m.y < LAWN_Y + 2) m.vy = Math.abs(m.vy);
      } else if (m.y < m.landY) {
        m.y = Math.min(m.landY, m.y + m.vy * dt);
        if (m.y >= m.landY) {
          // Landing on a leaf: the leaf catches the light by itself.
          const col = Math.floor((m.x - LAWN_X) / CELL_W);
          const row = Math.floor((m.y - LAWN_Y) / CELL_H);
          const p = this.plantAt(col, row);
          if (p && (p.kind === "sunleaf" || p.kind === "chloro" || p.kind === "frond" || p.kind === "stoma")) {
            this.gain("light", m.value, m.x, m.y);
            m.life = 0;
            p.act = 0.3;
          }
        }
      }
      m.life -= dt;
      if (m.x < LAWN_X - 6) m.life = 0;
    }
    this.motes = this.motes.filter((m) => m.life > 0);
  }

  private updateFx(dt: number) {
    for (const f of this.fx) {
      f.t += dt;
      f.x += f.vx * dt;
      f.y += f.vy * dt;
      if (f.kind === "crumb") f.vy += 120 * dt;
    }
    this.fx = this.fx.filter((f) => f.t < f.life);
  }

  /* ----------------------------------------------------------- debug helpers (tests) */

  debugClearWave() {
    this.queue = [];
    for (const u of this.undead) this.defeat(u);
    this.undead = [];
  }
}
