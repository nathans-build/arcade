import type { Band } from "./band";
import {
  ARENA_W, FLOOR_BOTTOM, PIT_Y, SCREEN_W, moverPos, pulseOn,
  type Level, type Rect, type Solid, type EnemyKind,
} from "./levels";
import { POWERS, ROBOTS, type PowerId, type Robot, type StageId } from "./robots";
import { applyAnswer, newFight, panelHits, panelTimeout, type AnswerResult, type Fight } from "./rules";

/*
 * The game simulation: pure and headless (no DOM), stepped once per 1/60 s frame, and cheap to
 * clone (the test bot searches ahead with clones). render.ts draws it; engine.ts feeds it input.
 */

export interface Input {
  left: boolean;
  right: boolean;
  /** Held. A jump starts on the frame it is first held. */
  jump: boolean;
  /** Pressed this frame (Z). */
  shoot: boolean;
  /** Pressed this frame (X): use the selected power. */
  power: boolean;
  /** Pressed this frame (C): select the next power. */
  cycle: boolean;
}
export const NO_INPUT: Input = { left: false, right: false, jump: false, shoot: false, power: false, cycle: false };

export const MAX_ENERGY = 20;
export const POWER_MAX = 28;
export const PW = 12;
export const PH = 20;
export const GRAV = 0.3;
export const MAX_FALL = 6;
export const JUMP_V = -5.6;
export const SUPER_JUMP_V = -8;
export const AIR_JUMP_V = -5.4;
export const RUN = 1.5;
export const DASH_SPEED = 4;
export const BEAM_SPEED = 4.5;
export const BOSS_W = 26;
export const BOSS_H = 30;

export function startLives(band: Band): number {
  return band === "k2" ? 5 : 3;
}

/** Energy lost to one bump (K-2 gentler). */
export function bumpDamage(band: Band): number {
  return band === "k2" ? 2 : band === "hs" ? 4 : 3;
}

export type Mode = "play" | "bossIntro" | "boss" | "quiz" | "bossDown" | "clear" | "respawn" | "over";

export interface Player {
  x: number; y: number; vx: number; vy: number;
  onGround: boolean; onMover: number; facing: 1 | -1;
  coyote: number; jumpBuf: number; prevJump: boolean; boost: boolean;
  inv: number; hurtT: number; shieldT: number; dashT: number; glideT: number; airJumped: boolean;
  shootCd: number; safeX: number; safeY: number;
}

export interface Enemy {
  kind: EnemyKind; x: number; y: number; w: number; h: number; vx: number; vy: number;
  hp: number; dead: boolean; t: number; dir: 1 | -1; sx: number; sy: number; flash: number;
}

export interface Shot {
  x: number; y: number; w: number; h: number; vx: number; vy: number; grav: number;
  life: number; from: "hero" | "foe"; kind: string;
  /** Frames before it becomes dangerous (telegraphed attacks). */
  delay: number;
  /** On reaching the floor: "stop" (vanish), "roll" (roll along it) or "stay". */
  floor: "stop" | "roll" | "stay" | "none";
}

export interface Pickup { x: number; y: number; kind: "bolt" | "energy" | "power"; life: number }

export interface Boss {
  x: number; y: number; vx: number; vy: number; t: number; dir: 1 | -1;
  onGround: boolean; flinch: number; stun: number; shield: number;
  panel: number; panelT: number; step: number; phaseT: number;
  warn: number; warnX: number;
}

export interface State {
  t: number;
  /** World clock for movers, hazards and foes (runs slower under Time Brake). */
  wt: number;
  slowT: number;
  mode: Mode;
  modeT: number;
  p: Player;
  energy: number;
  lives: number;
  power: number;
  powers: PowerId[];
  sel: number;
  enemies: Enemy[];
  shots: Shot[];
  pickups: Pickup[];
  boss: Boss | null;
  fight: Fight | null;
  checkpoint: number;
  camX: number;
  locked: boolean;
  gateOpen: boolean;
  capsule: boolean;
  score: number;
  seed: number;
  livesLost: number;
  hurts: number;
}

export type SimEvent =
  | { type: "shoot" } | { type: "jump" } | { type: "hurt" } | { type: "lifeLost" } | { type: "gameOver" }
  | { type: "enemyHit"; x: number; y: number } | { type: "short"; x: number; y: number; kind: EnemyKind }
  | { type: "pickup"; kind: Pickup["kind"] | "capsule" } | { type: "checkpoint"; n: number }
  | { type: "gate" } | { type: "power"; power: PowerId } | { type: "noPower"; reason: "none" | "meter" | "ground" | "air" }
  | { type: "cycle"; power: PowerId } | { type: "bossIntro" } | { type: "bossStart" } | { type: "panelHit" }
  | { type: "question" } | { type: "weak" } | { type: "bossHit"; weakness: boolean } | { type: "blocked" }
  | { type: "bossDown" } | { type: "clear" } | { type: "bossAttack" } | { type: "respawn" } | { type: "pit" };

export interface StageInfo {
  id: StageId;
  robot: Robot | null;
  /** Boss pattern ("teleport" for the fortress). */
  pattern: Robot["pattern"] | "teleport";
  weakness: PowerId | "any";
}

export function stageInfo(id: StageId): StageInfo {
  if (id === "fortress") return { id, robot: null, pattern: "teleport", weakness: "any" };
  const r = ROBOTS.find((x) => x.id === id)!;
  return { id, robot: r, pattern: r.pattern, weakness: r.weakness };
}

const ENEMY_STATS: Record<EnemyKind, { w: number; h: number; hp: number }> = {
  walker: { w: 14, h: 12, hp: 1 },
  hopper: { w: 14, h: 14, hp: 2 },
  flyer: { w: 14, h: 10, hp: 1 },
  turret: { w: 14, h: 14, hp: 3 },
};

function overlap(a: Rect, b: Rect): boolean {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function newEnemy(kind: EnemyKind, x: number, y: number): Enemy {
  const st = ENEMY_STATS[kind];
  return { kind, x, y, w: st.w, h: st.h, vx: 0, vy: 0, hp: st.hp, dead: false, t: 0, dir: -1, sx: x, sy: y, flash: 0 };
}

function cloneState(s: State): State {
  return {
    ...s,
    p: { ...s.p },
    powers: [...s.powers],
    enemies: s.enemies.map((e) => ({ ...e })),
    shots: s.shots.map((x) => ({ ...x })),
    pickups: s.pickups.map((x) => ({ ...x })),
    boss: s.boss ? { ...s.boss } : null,
    fight: s.fight ? { ...s.fight } : null,
  };
}

export class Sim {
  s: State;
  events: SimEvent[] = [];
  readonly info: StageInfo;
  /** Set false in the bot's look-ahead clones to skip event bookkeeping. */
  record = true;

  constructor(readonly level: Level, readonly band: Band, powers: PowerId[] = [], state?: State) {
    this.info = stageInfo(level.id);
    if (state) {
      this.s = state;
      return;
    }
    const st = level.start;
    this.s = {
      t: 0, wt: 0, slowT: 0, mode: "play", modeT: 0,
      p: {
        x: st.x, y: st.y - PH, vx: 0, vy: 0, onGround: false, onMover: -1, facing: 1, coyote: 0, jumpBuf: 0, prevJump: false, boost: false,
        inv: 0, hurtT: 0, shieldT: 0, dashT: 0, glideT: 0, airJumped: false, shootCd: 0, safeX: st.x, safeY: st.y - PH,
      },
      energy: MAX_ENERGY, lives: startLives(this.band), power: POWER_MAX, powers: [...powers], sel: 0,
      enemies: level.enemies.map((e) => newEnemy(e.kind, e.x, e.y)), shots: [], pickups: [], boss: null, fight: null,
      checkpoint: -1, camX: 0, locked: false, gateOpen: false, capsule: false, score: 0, seed: 12345 + level.width, livesLost: 0, hurts: 0,
    };
  }

  clone(): Sim {
    const c = new Sim(this.level, this.band, [], cloneState(this.s));
    c.record = false;
    return c;
  }

  private emit(e: SimEvent) {
    if (this.record) this.events.push(e);
  }

  drain(): SimEvent[] {
    const e = this.events;
    this.events = [];
    return e;
  }

  private rand(): number {
    // mulberry32
    let a = (this.s.seed = (this.s.seed + 0x6d2b79f5) | 0);
    a = Math.imul(a ^ (a >>> 15), a | 1);
    a ^= a + Math.imul(a ^ (a >>> 7), a | 61);
    return ((a ^ (a >>> 14)) >>> 0) / 4294967296;
  }

  get selectedPower(): PowerId | null {
    return this.s.powers[this.s.sel] ?? null;
  }

  /** Arena left wall (only once the door has closed). */
  private arenaWall(): Solid {
    return { x: this.level.arenaX - 16, y: 0, w: 16, h: FLOOR_BOTTOM, kind: "wall" };
  }

  private solidsNear(x: number, w: number): Solid[] {
    const L = this.level;
    const out: Solid[] = [];
    const c0 = Math.max(0, Math.floor(x / 64));
    const c1 = Math.min(L.cols.length - 1, Math.floor((x + w) / 64));
    const seen = new Set<number>();
    for (let c = c0; c <= c1; c++) {
      for (const i of L.cols[c]) {
        if (!seen.has(i)) {
          seen.add(i);
          out.push(L.solids[i]);
        }
      }
    }
    if (this.s.locked) out.push(this.arenaWall());
    return out;
  }

  /** Is there solid ground right under this point? */
  groundAt(x: number, y: number): boolean {
    return this.solidsNear(x, 1).some((s) => x >= s.x && x <= s.x + s.w && y >= s.y && y <= s.y + 4);
  }

  /** Time factor for foes, hazards and platforms (Time Brake). */
  private get k(): number {
    return this.s.slowT > 0 ? 0.4 : 1;
  }

  // ------------------------------------------------------------------ one frame

  step(input: Input) {
    const s = this.s;
    s.t++;
    switch (s.mode) {
      case "quiz":
      case "over":
      case "clear":
        return;
      case "respawn":
        s.modeT++;
        if (s.modeT >= 50) this.respawn();
        return;
      case "bossDown":
        s.modeT++;
        if (s.modeT >= 150) {
          s.mode = "clear";
          s.modeT = 0;
          this.emit({ type: "clear" });
        }
        return;
    }
    const prevWt = s.wt;
    if (s.slowT > 0) s.slowT--;
    s.wt += this.k;

    if (s.mode === "bossIntro") {
      s.modeT++;
      this.updatePlayer(NO_INPUT, prevWt);
      this.updateBossIntro();
      if (s.modeT >= 100) {
        s.mode = "boss";
        s.modeT = 0;
        this.emit({ type: "bossStart" });
      }
      this.updateCamera();
      return;
    }

    if (input.cycle && s.powers.length > 0) {
      s.sel = (s.sel + 1) % s.powers.length;
      this.emit({ type: "cycle", power: s.powers[s.sel] });
    }
    this.updatePlayer(input, prevWt);
    if (s.mode !== "play" && s.mode !== "boss") return; // a life was lost
    if (input.shoot) this.fire();
    if (input.power) this.usePower();
    this.updateEnemies();
    this.updateShots();
    if (s.mode === "boss") this.updateBoss();
    if (s.mode !== "play" && s.mode !== "boss") return;
    this.hazards();
    this.collect();
    if (s.mode === "play") {
      for (let i = s.checkpoint + 1; i < this.level.checkpoints.length; i++) {
        if (s.p.x >= this.level.checkpoints[i].x) {
          s.checkpoint = i;
          this.emit({ type: "checkpoint", n: i + 1 });
        }
      }
      if (s.p.x > this.level.arenaX + 24) this.enterArena();
    }
    this.updateCamera();
  }

  private updateCamera() {
    const s = this.s;
    if (s.locked) {
      s.camX = this.level.arenaX;
      return;
    }
    const target = Math.round(s.p.x + PW / 2 - SCREEN_W * 0.42);
    s.camX = Math.max(0, Math.min(this.level.width - SCREEN_W, target));
  }

  private updatePlayer(input: Input, prevWt: number) {
    const s = this.s;
    const p = s.p;
    const L = this.level;
    // Ride a moving platform.
    if (p.onMover >= 0) {
      const m = L.movers[p.onMover];
      const a = moverPos(m, prevWt);
      const b = moverPos(m, s.wt);
      p.x += b.x - a.x;
      p.y = b.y - PH;
    }
    if (p.inv > 0) p.inv--;
    if (p.shieldT > 0) p.shieldT--;
    if (p.shootCd > 0) p.shootCd--;

    // Horizontal
    if (p.dashT > 0) {
      p.dashT--;
      p.vx = DASH_SPEED * p.facing;
    } else if (p.hurtT > 0) {
      p.hurtT--;
      p.vx = -p.facing * 0.8;
    } else {
      const dir = (input.right ? 1 : 0) - (input.left ? 1 : 0);
      p.vx = dir * RUN;
      if (dir !== 0) p.facing = dir as 1 | -1;
    }

    // Jump (buffered a few frames; a few frames of "coyote time" after leaving a ledge)
    if (input.jump && !p.prevJump) p.jumpBuf = 6;
    else if (p.jumpBuf > 0) p.jumpBuf--;
    p.prevJump = input.jump;
    if (p.jumpBuf > 0 && (p.onGround || p.coyote > 0) && p.hurtT === 0) {
      p.vy = JUMP_V;
      p.onGround = false;
      p.onMover = -1;
      p.coyote = 0;
      p.jumpBuf = 0;
      p.boost = false;
      this.emit({ type: "jump" });
    }
    if (!input.jump && !p.boost && p.vy < -2.2) p.vy = -2.2; // short hop when released early

    // Gravity
    if (p.dashT > 0) p.vy = 0;
    else {
      p.vy = Math.min(MAX_FALL, p.vy + GRAV);
      if (p.glideT > 0) {
        p.glideT--;
        if (p.vy > 0.6) p.vy = 0.6;
      }
    }
    if (p.vy >= 0) p.boost = false;

    // Move X
    p.x += p.vx;
    if (p.x < 0) p.x = 0;
    for (const sd of this.solidsNear(p.x - 2, PW + 4)) {
      if (overlap({ x: p.x, y: p.y, w: PW, h: PH }, sd)) {
        if (p.vx > 0) p.x = sd.x - PW;
        else if (p.vx < 0) p.x = sd.x + sd.w;
        else p.x = p.x + PW / 2 < sd.x + sd.w / 2 ? sd.x - PW : sd.x + sd.w; // pushed (e.g. by a platform)
      }
    }

    // Move Y
    const bottomBefore = p.y + PH;
    p.y += p.vy;
    p.onGround = false;
    p.onMover = -1;
    for (const sd of this.solidsNear(p.x, PW)) {
      if (overlap({ x: p.x, y: p.y, w: PW, h: PH }, sd)) {
        if (p.vy > 0 || bottomBefore <= sd.y + 1) {
          p.y = sd.y - PH;
          p.vy = 0;
          p.onGround = true;
        } else {
          p.y = sd.y + sd.h;
          p.vy = 0;
        }
      }
    }
    if (p.vy >= 0) {
      for (let i = 0; i < L.movers.length; i++) {
        const m = L.movers[i];
        // Standing on the ground, you step onto a lift as it passes your feet (not onto sliding platforms).
        if (p.onGround && m.axis === "x") continue;
        const mp = moverPos(m, s.wt);
        if (p.x + PW > mp.x && p.x < mp.x + m.w && bottomBefore <= mp.y + 2.5 && p.y + PH >= mp.y - (p.onGround ? 0.01 : 0)) {
          p.y = mp.y - PH;
          p.vy = 0;
          p.onGround = true;
          p.onMover = i;
          break;
        }
      }
    }
    if (p.onGround) {
      p.coyote = 5;
      p.airJumped = false;
      p.glideT = 0;
      if (p.onMover < 0) this.noteSafe();
    } else if (p.coyote > 0) p.coyote--;

    if (p.y > PIT_Y) this.fallInPit();
  }

  /** Remembers a safe spot to stand (K-2 pits put the hero back here). */
  private noteSafe() {
    const p = this.s.p;
    const under = this.solidsNear(p.x, PW).find((sd) => p.y + PH === sd.y && p.x + PW > sd.x && p.x < sd.x + sd.w);
    if (!under) return;
    const nearHazard = this.level.spikes.some((r) => Math.abs(r.x + r.w / 2 - (p.x + PW / 2)) < r.w / 2 + 24) ||
      this.level.pulses.some((r) => Math.abs(r.x - p.x) < 40);
    if (nearHazard) return;
    p.safeX = Math.max(under.x + 2, Math.min(under.x + under.w - PW - 2, p.x));
    p.safeY = under.y - PH;
  }

  private fallInPit() {
    const s = this.s;
    this.emit({ type: "pit" });
    if (this.band === "k2") {
      // Gentler for K-2: a pit costs energy and puts you back on the last safe ground.
      s.energy -= 4;
      s.p.x = s.p.safeX;
      s.p.y = s.p.safeY;
      s.p.vx = 0;
      s.p.vy = 0;
      s.p.inv = 60;
      s.p.dashT = 0;
      s.p.glideT = 0;
      this.emit({ type: "hurt" });
      if (s.energy <= 0) this.loseLife();
      return;
    }
    this.loseLife();
  }

  private hurt(dmg: number) {
    const s = this.s;
    const p = s.p;
    if (p.inv > 0 || p.shieldT > 0 || p.dashT > 0 || s.mode === "quiz") return;
    s.energy -= dmg;
    s.hurts++;
    p.inv = 60;
    p.hurtT = 12;
    p.vy = Math.min(p.vy, -2.5);
    p.onMover = -1;
    p.glideT = 0;
    this.emit({ type: "hurt" });
    if (s.energy <= 0) this.loseLife();
  }

  private loseLife() {
    const s = this.s;
    s.lives--;
    s.livesLost++;
    s.energy = 0;
    this.emit({ type: "lifeLost" });
    if (s.lives <= 0) {
      s.mode = "over";
      s.modeT = 0;
      this.emit({ type: "gameOver" });
    } else {
      s.mode = "respawn";
      s.modeT = 0;
    }
  }

  private respawn() {
    const s = this.s;
    const L = this.level;
    const p = s.p;
    let x: number;
    let y: number;
    if (s.locked) {
      x = L.arenaX + 30;
      y = L.arenaY;
    } else if (s.checkpoint >= 0) {
      ({ x, y } = L.checkpoints[s.checkpoint]);
    } else {
      ({ x, y } = L.start);
    }
    Object.assign(p, {
      x, y: y - PH, vx: 0, vy: 0, onGround: false, onMover: -1, facing: 1, coyote: 0, jumpBuf: 0, boost: false,
      inv: 90, hurtT: 0, shieldT: 0, dashT: 0, glideT: 0, airJumped: false, safeX: x, safeY: y - PH,
    });
    s.energy = MAX_ENERGY;
    s.power = Math.max(s.power, POWER_MAX / 2);
    s.shots = [];
    s.slowT = 0;
    // Mini-bots that were not short-circuited go back to their posts.
    s.enemies = s.enemies.map((e) => (e.dead ? e : newEnemy(e.kind, e.sx, e.sy)));
    if (s.locked && s.boss) {
      s.boss.x = L.arenaX + ARENA_W - 60;
      s.boss.y = L.arenaY - BOSS_H;
      s.boss.vx = 0;
      s.boss.vy = 0;
      s.boss.warn = 0;
      s.boss.phaseT = 0;
      s.boss.panelT = 0;
      s.mode = "boss";
    } else s.mode = "play";
    s.modeT = 0;
    this.updateCamera();
    this.emit({ type: "respawn" });
  }

  // ------------------------------------------------------------------ beam and powers

  private heroShots(): number {
    return this.s.shots.filter((x) => x.from === "hero").length;
  }

  private beam(vy = 0) {
    const p = this.s.p;
    this.s.shots.push({
      x: p.facing > 0 ? p.x + PW : p.x - 6, y: p.y + 8, w: 6, h: 4, vx: BEAM_SPEED * p.facing, vy, grav: 0,
      life: 55, from: "hero", kind: "beam", delay: 0, floor: "none",
    });
  }

  private fire() {
    const p = this.s.p;
    if (p.shootCd > 0 || this.heroShots() >= 3) return;
    p.shootCd = 8;
    this.beam();
    this.emit({ type: "shoot" });
  }

  /** X: use the selected power. Returns true if it was used. */
  usePower(): boolean {
    const s = this.s;
    const p = s.p;
    const pw = this.selectedPower;
    if (!pw) {
      this.emit({ type: "noPower", reason: "none" });
      return false;
    }
    const cost = POWERS[pw].cost;
    if (s.power < cost) {
      this.emit({ type: "noPower", reason: "meter" });
      return false;
    }
    switch (pw) {
      case "splitter":
        this.beam(-1.2);
        this.beam(0);
        this.beam(1.2);
        break;
      case "magma":
        if (!p.onGround && p.coyote <= 0) {
          this.emit({ type: "noPower", reason: "ground" });
          return false;
        }
        p.vy = SUPER_JUMP_V;
        p.boost = true;
        p.onGround = false;
        p.onMover = -1;
        p.coyote = 0;
        break;
      case "comma":
        p.shieldT = 240;
        break;
      case "compass":
        p.dashT = 22;
        p.hurtT = 0;
        break;
      case "cloud":
        if (p.onGround || p.airJumped) {
          this.emit({ type: "noPower", reason: "air" });
          return false;
        }
        p.vy = AIR_JUMP_V;
        p.boost = true;
        p.airJumped = true;
        break;
      case "polarity": {
        for (const e of s.enemies) {
          if (!e.dead && e.x + e.w > s.camX - 8 && e.x < s.camX + SCREEN_W + 8) this.damageEnemy(e, 3);
        }
        s.shots = s.shots.filter((x) => x.from === "hero");
        if (s.boss) s.boss.stun = 45;
        break;
      }
      case "leaf":
        if (p.onGround) {
          this.emit({ type: "noPower", reason: "air" });
          return false;
        }
        p.glideT = 160;
        break;
      case "time":
        s.slowT = 300;
        break;
    }
    s.power -= cost;
    this.emit({ type: "power", power: pw });
    const g = this.level.gate;
    if (g && !s.gateOpen && pw === g.power && Math.abs(p.x + PW / 2 - (g.x + 10)) < 80) {
      s.gateOpen = true;
      this.emit({ type: "gate" });
    }
    if (s.mode === "boss" && s.fight && (this.info.weakness === "any" || this.info.weakness === pw) && !s.fight.weakReady) {
      s.fight.weakReady = true;
      this.emit({ type: "weak" });
    }
    return true;
  }

  // ------------------------------------------------------------------ mini-bots

  private damageEnemy(e: Enemy, n: number) {
    const s = this.s;
    e.hp -= n;
    e.flash = 8;
    this.emit({ type: "enemyHit", x: e.x + e.w / 2, y: e.y + e.h / 2 });
    if (e.hp <= 0 && !e.dead) {
      e.dead = true;
      s.score += 100;
      this.emit({ type: "short", x: e.x + e.w / 2, y: e.y + e.h / 2, kind: e.kind });
      const r = this.rand();
      const kind: Pickup["kind"] | null = r < 0.22 ? "energy" : r < 0.42 ? "power" : r < 0.75 ? "bolt" : null;
      if (kind) s.pickups.push({ x: e.x + e.w / 2 - 5, y: e.y + e.h - 10, kind, life: 480 });
    }
  }

  private updateEnemies() {
    const s = this.s;
    const p = s.p;
    const k = this.k;
    const turretEvery = this.band === "k2" ? 210 : this.band === "g35" ? 160 : this.band === "g68" ? 140 : 120;
    const foeSpeed = this.band === "k2" ? 1.1 : this.band === "hs" ? 1.8 : 1.5;
    for (const e of s.enemies) {
      if (e.dead) continue;
      if (e.flash > 0) e.flash--;
      if (Math.abs(e.x - (s.camX + SCREEN_W / 2)) > SCREEN_W / 2 + 80) continue; // asleep off screen
      e.t += k;
      switch (e.kind) {
        case "walker": {
          const sp = (this.band === "k2" ? 0.4 : 0.6) * k;
          e.x += e.dir * sp;
          if (e.x < e.sx - 24) e.dir = 1;
          if (e.x > e.sx + 24) e.dir = -1;
          break;
        }
        case "hopper": {
          if (e.y >= e.sy && e.vy >= 0) {
            e.y = e.sy;
            e.vy = 0;
            e.vx = 0;
            if (e.t % 90 < k) {
              e.vy = -3.6;
              e.vx = (p.x < e.x ? -0.7 : 0.7);
            }
          } else {
            e.vy += 0.2 * k;
          }
          e.x = Math.max(e.sx - 36, Math.min(e.sx + 36, e.x + e.vx * k));
          e.y = Math.min(e.sy, e.y + e.vy * k);
          break;
        }
        case "flyer": {
          const toward = Math.abs(p.x - e.x) < 170 ? Math.sign(p.x - e.x) * 0.45 : 0;
          e.x = Math.max(e.sx - 110, Math.min(e.sx + 110, e.x + toward * k));
          e.y = e.sy + Math.sin(e.t / 28) * 12;
          break;
        }
        case "turret": {
          if (Math.abs(p.x - e.x) < 220 && e.t % turretEvery < k) {
            const dir = p.x < e.x ? -1 : 1;
            s.shots.push({ x: e.x + (dir > 0 ? e.w : -6), y: e.y + 4, w: 6, h: 6, vx: dir * foeSpeed, vy: 0, grav: 0, life: 220, from: "foe", kind: "zap", delay: 0, floor: "none" });
          }
          break;
        }
      }
    }
  }

  // ------------------------------------------------------------------ shots

  private updateShots() {
    const s = this.s;
    const k = this.k;
    const out: Shot[] = [];
    for (const sh of s.shots) {
      const kk = sh.from === "hero" ? 1 : k;
      if (sh.delay > 0) {
        sh.delay -= kk;
        out.push(sh);
        continue;
      }
      sh.life -= kk;
      sh.vy += sh.grav * kk;
      sh.x += sh.vx * kk;
      sh.y += sh.vy * kk;
      if (sh.life <= 0) continue;
      if (sh.from === "hero") {
        let hit = false;
        for (const e of s.enemies) {
          if (!e.dead && overlap(sh, e)) {
            this.damageEnemy(e, 1);
            hit = true;
            break;
          }
        }
        if (!hit && s.boss && s.mode === "boss" && overlap(sh, this.bossRect())) {
          hit = true;
          this.hitBossPanel();
        }
        if (!hit && this.solidsNear(sh.x, sh.w).some((sd) => sd.kind !== "ground" && overlap(sh, sd))) hit = true;
        if (hit) continue;
        if (sh.x < s.camX - 20 || sh.x > s.camX + SCREEN_W + 20) continue;
      } else if (sh.floor !== "none" && s.locked) {
        const fy = this.level.arenaY;
        if (sh.y + sh.h >= fy) {
          if (sh.floor === "stop") continue;
          sh.y = fy - sh.h;
          sh.vy = 0;
          sh.grav = 0;
          if (sh.floor === "roll" && sh.vx === 0) sh.vx = s.p.x < sh.x ? -1.4 : 1.4;
        }
        if (sh.x < this.level.arenaX - 10 || sh.x > this.level.arenaX + ARENA_W + 10) continue;
      }
      out.push(sh);
    }
    s.shots = out;
  }

  // ------------------------------------------------------------------ hazards and pickups

  private hazards() {
    const s = this.s;
    const p = s.p;
    const box = { x: p.x + 1, y: p.y + 1, w: PW - 2, h: PH - 1 };
    const dmg = bumpDamage(this.band);
    // Comma Shield and Compass Dash pop zaps they touch.
    if (p.shieldT > 0 || p.dashT > 0) s.shots = s.shots.filter((sh) => sh.from === "hero" || sh.delay > 0 || !overlap({ x: p.x - 4, y: p.y - 4, w: PW + 8, h: PH + 8 }, sh));
    for (const r of this.level.spikes) if (overlap(box, r)) this.hurt(dmg);
    for (const r of this.level.pulses) if (pulseOn(r, s.wt) && overlap(box, r)) this.hurt(dmg);
    for (const e of s.enemies) if (!e.dead && overlap(box, e)) this.hurt(dmg);
    for (const sh of s.shots) {
      if (sh.from === "foe" && sh.delay <= 0 && overlap(box, sh)) {
        this.hurt(Math.max(1, dmg - 1));
        sh.life = 0;
      }
    }
    s.shots = s.shots.filter((sh) => sh.life > 0);
    const b = s.boss;
    if (b && s.mode === "boss" && b.flinch <= 0 && overlap(box, this.bossRect())) this.hurt(dmg);
  }

  private collect() {
    const s = this.s;
    const p = s.p;
    const box = { x: p.x, y: p.y, w: PW, h: PH };
    s.pickups = s.pickups.filter((it) => {
      it.life--;
      if (it.life <= 0) return false;
      if (!overlap(box, { x: it.x, y: it.y, w: 10, h: 10 })) return true;
      if (it.kind === "energy") s.energy = Math.min(MAX_ENERGY, s.energy + 6);
      else if (it.kind === "power") s.power = Math.min(POWER_MAX, s.power + 8);
      else s.score += 50;
      this.emit({ type: "pickup", kind: it.kind });
      return false;
    });
    const g = this.level.gate;
    if (g && s.gateOpen && !s.capsule && overlap(box, { x: g.x + 4, y: g.y - 16, w: 12, h: 16 })) {
      s.capsule = true;
      s.lives++;
      s.energy = MAX_ENERGY;
      s.power = POWER_MAX;
      s.score += 500;
      this.emit({ type: "pickup", kind: "capsule" });
    }
  }

  // ------------------------------------------------------------------ the boss

  bossRect(): Rect {
    const b = this.s.boss!;
    return { x: b.x, y: b.y, w: BOSS_W, h: BOSS_H };
  }

  private enterArena() {
    const s = this.s;
    const L = this.level;
    s.locked = true;
    s.mode = "bossIntro";
    s.modeT = 0;
    s.shots = [];
    s.boss = {
      x: L.arenaX + ARENA_W - 70, y: -BOSS_H - 10, vx: 0, vy: 0, t: 0, dir: -1, onGround: false, flinch: 0, stun: 0, shield: 0,
      panel: 0, panelT: 0, step: 0, phaseT: 0, warn: 0, warnX: 0,
    };
    s.fight = newFight(this.band, L.id === "fortress");
    this.emit({ type: "bossIntro" });
  }

  private updateBossIntro() {
    const b = this.s.boss!;
    const floor = this.level.arenaY - BOSS_H;
    b.y = Math.min(floor, b.y + 3);
  }

  private hitBossPanel() {
    const s = this.s;
    const b = s.boss!;
    if (b.flinch > 0) return;
    b.panel++;
    this.emit({ type: "panelHit" });
    if (b.panel >= panelHits(this.band)) this.openQuestion();
  }

  private openQuestion() {
    const s = this.s;
    s.mode = "quiz";
    s.modeT = 0;
    s.shots = s.shots.filter((x) => x.from === "hero");
    s.p.dashT = 0;
    this.emit({ type: "question" });
  }

  /** The boss's question was answered. Wrong answers never cost HP, energy or lives. */
  answer(correct: boolean): AnswerResult {
    const s = this.s;
    const b = s.boss!;
    const res = applyAnswer(s.fight!, correct);
    if (correct) {
      b.flinch = 70;
      s.score += 1000 * res.damage;
      this.emit({ type: "bossHit", weakness: res.weakness });
    } else {
      b.shield = 60;
      this.emit({ type: "blocked" });
    }
    b.panel = 0;
    b.panelT = 0;
    return res;
  }

  /** Back to the fight after the answer card (or on to the reboot sparks). */
  resume() {
    const s = this.s;
    if (s.mode !== "quiz") return;
    s.p.inv = Math.max(s.p.inv, 60);
    if (s.fight && s.fight.hp <= 0) {
      s.mode = "bossDown";
      s.modeT = 0;
      s.shots = [];
      s.score += 2000;
      this.emit({ type: "bossDown" });
    } else {
      s.mode = "boss";
      s.modeT = 0;
    }
  }

  private foe(sh: Partial<Shot> & { x: number; y: number }) {
    this.s.shots.push({ w: 8, h: 8, vx: 0, vy: 0, grav: 0, life: 240, from: "foe", kind: "zap", delay: 0, floor: "none", ...sh });
  }

  private updateBoss() {
    const s = this.s;
    const b = s.boss!;
    const L = this.level;
    const p = s.p;
    const k = this.k;
    const ax = L.arenaX;
    const floorY = L.arenaY - BOSS_H;
    const kid = this.band === "k2";
    const slow = kid ? 1.45 : this.band === "g35" ? 1.15 : 1;
    const spd = kid ? 0.7 : this.band === "hs" ? 1.1 : 1;
    if (b.shield > 0) b.shield--;
    b.panelT += 1;
    if (b.panelT >= panelTimeout(this.band)) {
      this.openQuestion();
      return;
    }
    if (b.flinch > 0) {
      b.flinch--;
      return;
    }
    if (b.stun > 0) {
      b.stun--;
      return;
    }
    b.t += k;
    b.phaseT += k;
    const px = p.x + PW / 2;
    const bx = b.x + BOSS_W / 2;
    const toward: 1 | -1 = px < bx ? -1 : 1;
    const gravity = (g: number) => {
      b.vy += g * k;
      b.y += b.vy * k;
      if (b.y >= floorY) {
        b.y = floorY;
        b.vy = 0;
        b.onGround = true;
      } else b.onGround = false;
    };
    const clampX = () => {
      if (b.x < ax + 4) {
        b.x = ax + 4;
        b.dir = 1;
        b.vx = Math.abs(b.vx);
      }
      if (b.x > ax + ARENA_W - BOSS_W - 4) {
        b.x = ax + ARENA_W - BOSS_W - 4;
        b.dir = -1;
        b.vx = -Math.abs(b.vx);
      }
    };
    const every = (n: number) => b.phaseT >= n * slow;
    const attack = () => {
      b.phaseT = 0;
      b.step++;
      this.emit({ type: "bossAttack" });
    };

    switch (this.info.pattern) {
      case "hop": {
        // Igneous Rex: leaps toward you; landing sends two lava blobs rolling both ways.
        const wasAir = !b.onGround;
        if (b.onGround && every(100)) {
          attack();
          b.vy = -5.2;
          b.vx = Math.max(-1.8, Math.min(1.8, (px - bx) / 55));
        }
        if (!b.onGround) b.x += b.vx * k;
        gravity(0.22);
        clampX();
        if (wasAir && b.onGround && b.step > 0) {
          for (const d of [-1, 1]) this.foe({ x: bx - 4 + d * 14, y: L.arenaY - 8, w: 8, h: 8, vx: d * 1.3 * spd, kind: "lava", life: 200 });
        }
        break;
      }
      case "bounce": {
        // Splitz: bounces across the room and tosses pie slices.
        if (b.onGround) {
          b.vy = -4.2;
          b.vx = b.dir * 1.2 * spd;
        }
        b.x += b.vx * k;
        gravity(0.2);
        clampX();
        if (every(130)) {
          attack();
          this.foe({ x: bx - 4, y: b.y + 10, vx: toward * 1.6 * spd, kind: "pie" });
        }
        break;
      }
      case "hover": {
        // Syntaxor: floats side to side and drops falling commas.
        b.y = L.arenaY - 72 + Math.sin(b.t / 40) * 6;
        b.x = ax + 30 + (ARENA_W - BOSS_W - 60) * (0.5 + 0.5 * Math.sin(b.t / 110));
        if (every(95)) {
          attack();
          this.foe({ x: bx - 4, y: b.y + BOSS_H, vy: 1.2 * spd, grav: 0.03, kind: "ink", floor: "stop" });
        }
        break;
      }
      case "dash": {
        // Meridian: waits, flashes, then dashes along the floor; jump over it.
        gravity(0.3);
        if (b.step % 2 === 0) {
          // waiting at a side
          if (every(80)) {
            b.warn = Math.round(40 * slow);
            attack();
          }
          if (b.warn > 0) b.warn--;
        } else {
          if (b.warn > 0) {
            b.warn -= k;
          } else {
            b.x += b.dir * 3 * spd * k;
            const lo = ax + 6;
            const hi = ax + ARENA_W - BOSS_W - 6;
            if ((b.dir < 0 && b.x <= lo) || (b.dir > 0 && b.x >= hi)) {
              b.x = Math.max(lo, Math.min(hi, b.x));
              b.step++;
              b.phaseT = 0;
              b.dir = b.dir < 0 ? 1 : -1;
            }
          }
        }
        break;
      }
      case "zigzag": {
        // Cumulo-Tron: zigzags across the sky and calls down lightning where you stand.
        b.y = L.arenaY - 80 + Math.abs(((b.t / 25) % 2) - 1) * 24;
        b.x = ax + 20 + (ARENA_W - BOSS_W - 40) * (0.5 + 0.5 * Math.sin(b.t / 95));
        if (every(110)) {
          attack();
          const wx = Math.max(ax + 8, Math.min(ax + ARENA_W - 18, px - 5));
          b.warnX = wx;
          b.warn = Math.round(45 * slow);
          this.foe({ x: wx, y: L.arenaY - 150, w: 10, h: 150, kind: "bolt", delay: Math.round(45 * slow), life: 22 });
        }
        if (b.warn > 0) b.warn--;
        break;
      }
      case "arc": {
        // Polarix: strolls and lobs plus/minus orbs in arcs.
        gravity(0.3);
        if (Math.abs(px - bx) > 70) b.x += toward * 0.4 * spd * k;
        clampX();
        if (every(100)) {
          attack();
          const flight = 60;
          this.foe({ x: bx - 4, y: b.y + 4, vx: Math.max(-2.4, Math.min(2.4, (px - bx) / flight)) * spd, vy: -4.2, grav: 0.14, kind: b.step % 2 ? "plus" : "minus", floor: "stop" });
        }
        break;
      }
      case "sprout": {
        // Chloro-Phil: makes thorny vines sprout under you (watch the sprouting dirt), and hops now and then.
        gravity(0.25);
        if (!b.onGround) b.x += b.vx * k;
        clampX();
        if (every(115)) {
          attack();
          if (b.step % 3 === 0 && b.onGround) {
            b.vy = -5;
            b.vx = b.x > ax + ARENA_W / 2 ? -2 : 2;
          } else {
            const wx = Math.max(ax + 8, Math.min(ax + ARENA_W - 24, px - 8));
            b.warnX = wx;
            b.warn = Math.round(45 * slow);
            this.foe({ x: wx, y: L.arenaY - 36, w: 16, h: 36, kind: "vine", delay: Math.round(45 * slow), life: 40 });
          }
        }
        if (b.warn > 0) b.warn--;
        break;
      }
      case "pendulum": {
        // Clockwork Clio: swings like a pendulum and drops gears that roll along the floor.
        const cx = ax + ARENA_W / 2 - BOSS_W / 2;
        const a = Math.sin(b.t / 70);
        b.x = cx + a * 120;
        b.y = L.arenaY - 74 + (1 - Math.cos(b.t / 35)) * 6;
        if (every(105)) {
          attack();
          this.foe({ x: bx - 5, y: b.y + BOSS_H, w: 10, h: 10, vy: 1.5, grav: 0.1, kind: "gear", floor: "roll", life: 300 });
        }
        break;
      }
      case "teleport": {
        // Lord Static: blinks between three spots and fires a three-way static spread.
        const spots = [
          { x: ax + 30, y: floorY },
          { x: ax + ARENA_W - BOSS_W - 30, y: floorY },
          { x: ax + ARENA_W / 2 - BOSS_W / 2, y: L.arenaY - 76 },
        ];
        if (b.warn > 0) {
          b.warn -= k;
          if (b.warn <= 0) {
            const spot = spots[b.step % 3];
            b.x = spot.x;
            b.y = spot.y;
            const dx = px - (b.x + BOSS_W / 2);
            const dy = p.y + PH / 2 - (b.y + BOSS_H / 2);
            const d = Math.max(1, Math.hypot(dx, dy));
            const v = 1.5 * spd;
            for (const ang of [-0.35, 0, 0.35]) {
              const c = Math.cos(ang), sn = Math.sin(ang);
              this.foe({ x: b.x + BOSS_W / 2 - 4, y: b.y + BOSS_H / 2 - 4, vx: ((dx * c - dy * sn) / d) * v, vy: ((dx * sn + dy * c) / d) * v, kind: "static" });
            }
          }
        } else if (every(150)) {
          attack();
          b.warn = Math.round(40 * slow);
        }
        break;
      }
    }
  }

  // ------------------------------------------------------------------ for the UI and tests

  /** Debug/test: jump straight to the boss arena. */
  warpToBoss() {
    const s = this.s;
    s.p.x = this.level.arenaX + 30;
    s.p.y = this.level.arenaY - PH;
    s.p.vx = 0;
    s.p.vy = 0;
    s.checkpoint = this.level.checkpoints.length - 1;
    this.enterArena();
    this.updateCamera();
  }

  /** Debug/test: open the boss's reboot panel now. */
  forceQuestion() {
    if (this.s.mode === "bossIntro") this.s.mode = "boss";
    if (this.s.mode === "boss") this.openQuestion();
  }

  /** Progress through the stage, 0..1. */
  progress(): number {
    return Math.max(0, Math.min(1, this.s.p.x / this.level.arenaX));
  }
}
