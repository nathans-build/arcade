import type { Band } from "./band";
import {
  ARENA_W, FLOOR_BOTTOM, PIT_Y, SCREEN_W, moverPos, pulseOn,
  type Level, type Rect, type Solid, type EnemyKind,
} from "./levels";
import { POWERS, VIRUSES, ZONES, type Pattern, type PowerId, type StageId, type VirusId, type ZoneId } from "./roster";
import { applyAnswer, bossHp, newFight, panelHits, panelTimeout, virusHp, type AnswerResult, type Fight } from "./rules";
import {
  BOOSTS, BOOST_IDS, FEVER, LEAP_JUMP_V, MUCUS_REACH, RAPID_COOLDOWN, RAPID_SHOTS, boostFromRoll, clueReward,
  type BoostId, type ClueReward,
} from "./boosts";

/*
 * The game simulation: pure and headless (no DOM), stepped once per 1/60 s frame, and cheap to
 * clone (the test bot searches ahead with clones). render.ts draws it; engine.ts feeds it input.
 * Germs that are zapped poof into harmless sparkles. Rod bacteria left alone split in two (binary fission),
 * like real bacteria. In the Lymph Node the six Major Viruses come one after another in the same arena.
 */

export interface Input {
  left: boolean;
  right: boolean;
  /** Held. A jump starts on the frame it is first held. */
  jump: boolean;
  /** Pressed this frame (Z): the receptor zapper. */
  shoot: boolean;
  /** Pressed this frame (X): use the selected immune skill. */
  power: boolean;
  /** Pressed this frame (C): select the next immune skill. */
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
  /** A rod bacterium that has already split (or one made by a split: it never splits again). */
  split?: boolean;
  child?: boolean;
}

export interface Shot {
  x: number; y: number; w: number; h: number; vx: number; vy: number; grav: number;
  life: number; from: "hero" | "foe"; kind: string;
  /** Frames before it becomes dangerous (telegraphed attacks). */
  delay: number;
  /** On reaching the floor: "stop" (vanish), "roll" (roll along it) or "stay". */
  floor: "stop" | "roll" | "stay" | "none";
}

export interface Pickup {
  x: number; y: number;
  /** cell = a big energy cell (+10); boost = a power-up capsule; nutrient = a score sparkle. */
  kind: "nutrient" | "energy" | "power" | "cell" | "boost";
  life: number;
  /** Fixed power-up for a boost dropped by an Antigen Clue or a germ; hidden capsules roll when grabbed. */
  boost?: BoostId;
}

export const CELL_ENERGY = 10;
export const CLUE_W = 16;
export const CLUE_H = 22;
/** Frames a rod bacterium must be awake (on screen) before it splits in two. */
export function splitFrames(band: Band): number {
  return band === "k2" ? 12 * 60 : 8 * 60;
}

export function noBoosts(): Record<BoostId, number> {
  return { membrane: 0, leap: 0, vaccine: 0, fever: 0, antibody: 0, mucus: 0 };
}

export interface Boss {
  x: number; y: number; vx: number; vy: number; t: number; dir: 1 | -1;
  onGround: boolean; flinch: number; stun: number; shield: number;
  panel: number; panelT: number; step: number; phaseT: number;
  warn: number; warnX: number;
}

export interface State {
  t: number;
  /** World clock for movers, hazards and foes (runs slower under Saliva Slow-Mo). */
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
  /** Frames left on each power-up (0 = off). */
  boosts: Record<BoostId, number>;
  /** Antigen Clues identified (their barriers are gone). */
  clueDone: boolean[];
  /** Which question is open: the boss's antigen panel or an Antigen Clue (its index). */
  ask: "boss" | number;
  cluesAnswered: number;
  cluesRight: number;
  /** An Antigen Clue already gave a power-up in this stage. */
  clueBoost: boolean;
  /** Lymph Node: which Major Virus is up (index into VIRUSES). */
  rushIdx: number;
  /** Lymph Node: Major Viruses identified in this run. */
  rushBeaten: VirusId[];
  /** Rod bacteria that split in two this stage. */
  splits: number;
  /** Germ shots caught by the Mucus Shield. */
  stuck: number;
}

export type SimEvent =
  | { type: "shoot" } | { type: "jump" } | { type: "hurt" } | { type: "lifeLost" } | { type: "gameOver" }
  | { type: "enemyHit"; x: number; y: number } | { type: "short"; x: number; y: number; kind: EnemyKind }
  | { type: "pickup"; kind: Pickup["kind"] | "capsule" } | { type: "checkpoint"; n: number }
  | { type: "gate" } | { type: "power"; power: PowerId } | { type: "noPower"; reason: "none" | "meter" | "ground" | "air" }
  | { type: "cycle"; power: PowerId } | { type: "bossIntro" } | { type: "bossStart" } | { type: "panelHit" }
  | { type: "question" } | { type: "weak" } | { type: "bossHit"; weakness: boolean } | { type: "blocked" }
  | { type: "bossDown" } | { type: "clear" } | { type: "bossAttack" } | { type: "respawn" } | { type: "pit" }
  | { type: "clue"; n: number; x: number; y: number } | { type: "clueDone"; correct: boolean; reward: ClueReward; x: number; y: number }
  | { type: "boost"; boost: BoostId; from: "clue" | "pickup" } | { type: "boostEnd"; boost: BoostId } | { type: "vaccinePop" }
  | { type: "split"; x: number; y: number } | { type: "stuck"; x: number; y: number }
  | { type: "virusDown"; virus: VirusId; next: VirusId | null } | { type: "nextVirus"; virus: VirusId };

export interface StageInfo {
  id: StageId;
  rush: boolean;
  /** The stage germ's weak-spot skill ("any" skill works on a Major Virus). */
  weakness: PowerId | "any";
}

export function stageInfo(id: StageId): StageInfo {
  if (id === "rush") return { id, rush: true, weakness: "any" };
  const z = ZONES.find((x) => x.id === id)!;
  return { id, rush: false, weakness: z.weakness };
}

/** What each boss throws (render.ts draws each kind). */
const SHOT_KIND: Record<ZoneId | VirusId, string> = {
  nose: "droplet", throat: "bead", lungs: "gust", blood: "none", stomach: "acid", gut: "crumb", skin: "grape", mouth: "sugar",
  rhino: "sniffle", flu: "gust", noro: "none", varicella: "spot", measles: "mist", corona: "spike",
};

const ENEMY_STATS: Record<EnemyKind, { w: number; h: number; hp: number }> = {
  rod: { w: 14, h: 12, hp: 1 },
  cocci: { w: 14, h: 14, hp: 2 },
  virus: { w: 14, h: 10, hp: 1 },
  spiral: { w: 14, h: 14, hp: 3 },
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
    boosts: { ...s.boosts },
    clueDone: [...s.clueDone],
    rushBeaten: [...s.rushBeaten],
  };
}

export class Sim {
  s: State;
  events: SimEvent[] = [];
  readonly info: StageInfo;
  /** Set false in the bot's look-ahead clones to skip event bookkeeping. */
  record = true;

  constructor(readonly level: Level, readonly band: Band, powers: PowerId[] = [], state?: State, rushFrom = 0) {
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
      boosts: noBoosts(), clueDone: level.clues.map(() => false), ask: "boss", cluesAnswered: 0, cluesRight: 0, clueBoost: false,
      rushIdx: Math.max(0, Math.min(VIRUSES.length - 1, rushFrom)), rushBeaten: [], splits: 0, stuck: 0,
    };
    this.s.pickups = level.items.map((it) => ({ x: it.x, y: it.y, kind: it.kind, life: Infinity }));
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
          const sd = L.solids[i];
          if (sd.kind === "barrier" && this.s.clueDone[sd.qb!]) continue;
          out.push(sd);
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

  /** Time factor for germs, hazards and platforms (Saliva Slow-Mo). */
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
          if (this.info.rush && s.rushIdx < VIRUSES.length - 1) {
            this.nextVirus();
            return;
          }
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
    for (const id of BOOST_IDS) {
      if (s.boosts[id] > 0 && --s.boosts[id] === 0) this.emit({ type: "boostEnd", boost: id });
    }
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
      p.vx = dir * RUN * (s.boosts.fever > 0 ? FEVER : 1);
      if (dir !== 0) p.facing = dir as 1 | -1;
    }

    // Jump (buffered a few frames; a few frames of "coyote time" after leaving a ledge)
    if (input.jump && !p.prevJump) p.jumpBuf = 6;
    else if (p.jumpBuf > 0) p.jumpBuf--;
    p.prevJump = input.jump;
    if (p.jumpBuf > 0 && (p.onGround || p.coyote > 0) && p.hurtT === 0) {
      p.vy = s.boosts.leap > 0 ? LEAP_JUMP_V : JUMP_V;
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

  /** A bump or shot. `foe` hits (germs, bosses and their shots) pass through Phase Through Membrane. */
  private hurt(dmg: number, foe = false) {
    const s = this.s;
    const p = s.p;
    if (p.inv > 0 || p.shieldT > 0 || p.dashT > 0 || s.mode === "quiz") return;
    if (foe && s.boosts.membrane > 0) return;
    if (s.boosts.vaccine > 0) {
      s.boosts.vaccine = 0;
      p.inv = 60;
      this.emit({ type: "vaccinePop" });
      return;
    }
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
    s.boosts = noBoosts();
    s.energy = MAX_ENERGY;
    s.power = Math.max(s.power, POWER_MAX / 2);
    s.shots = [];
    s.slowT = 0;
    // Germs that were not poofed go back to their spots (bacteria made by splitting go away).
    s.enemies = s.enemies.filter((e) => !e.child || e.dead).map((e) => (e.dead ? e : newEnemy(e.kind, e.sx, e.sy)));
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

  // ------------------------------------------------------------------ receptor zapper and immune skills

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
    const rapid = this.s.boosts.antibody > 0;
    if (p.shootCd > 0 || this.heroShots() >= (rapid ? RAPID_SHOTS : 3)) return;
    p.shootCd = rapid ? RAPID_COOLDOWN : 8;
    this.beam();
    this.emit({ type: "shoot" });
  }

  /** X: use the selected immune skill. Returns true if it was used. */
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
      case "acid":
        this.beam(-1.2);
        this.beam(0);
        this.beam(1.2);
        break;
      case "villi":
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
      case "platelet":
        p.shieldT = 240;
        break;
      case "cough":
        p.dashT = 22;
        p.hurtT = 0;
        break;
      case "breath":
        if (p.onGround || p.airJumped) {
          this.emit({ type: "noPower", reason: "air" });
          return false;
        }
        p.vy = AIR_JUMP_V;
        p.boost = true;
        p.airJumped = true;
        break;
      case "sneeze": {
        for (const e of s.enemies) {
          if (!e.dead && e.x + e.w > s.camX - 8 && e.x < s.camX + SCREEN_W + 8) this.damageEnemy(e, 3);
        }
        s.shots = s.shots.filter((x) => x.from === "hero");
        if (s.boss) s.boss.stun = 45;
        break;
      }
      case "plasma":
        if (p.onGround) {
          this.emit({ type: "noPower", reason: "air" });
          return false;
        }
        p.glideT = 160;
        break;
      case "saliva":
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

  // ------------------------------------------------------------------ germs

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
      // Now and then a germ drops a power-up capsule (a macrophage pal gobbles up the rest).
      const kind: Pickup["kind"] | null = r < 0.05 ? "boost" : r < 0.26 ? "energy" : r < 0.44 ? "power" : r < 0.75 ? "nutrient" : null;
      if (kind) s.pickups.push({ x: e.x + e.w / 2 - 5, y: e.y + e.h - 10, kind, life: kind === "boost" ? 720 : 480, boost: kind === "boost" ? boostFromRoll(this.rand()) : undefined });
    }
  }

  private updateEnemies() {
    const s = this.s;
    const p = s.p;
    const k = this.k;
    const turretEvery = this.band === "k2" ? 210 : this.band === "g35" ? 160 : this.band === "g68" ? 140 : 120;
    const foeSpeed = this.band === "k2" ? 1.1 : this.band === "hs" ? 1.8 : 1.5;
    const born: Enemy[] = [];
    const splitAt = splitFrames(this.band);
    for (const e of s.enemies) {
      if (e.dead) continue;
      if (e.flash > 0) e.flash--;
      if (Math.abs(e.x - (s.camX + SCREEN_W / 2)) > SCREEN_W / 2 + 80) continue; // asleep off screen
      e.t += k;
      switch (e.kind) {
        case "rod": {
          // Binary fission: a rod bacterium left alone long enough splits into two.
          if (!e.split && !e.child && e.t >= splitAt && s.mode === "play") {
            e.split = true;
            const c = newEnemy("rod", e.x, e.y);
            c.sx = e.sx;
            c.sy = e.sy;
            c.child = true;
            c.split = true;
            c.dir = e.dir > 0 ? -1 : 1;
            c.flash = 12;
            born.push(c);
            s.splits++;
            this.emit({ type: "split", x: e.x + e.w / 2, y: e.y + e.h / 2 });
          }
          const sp = (this.band === "k2" ? 0.4 : 0.6) * k;
          e.x += e.dir * sp;
          if (e.x < e.sx - 24) e.dir = 1;
          if (e.x > e.sx + 24) e.dir = -1;
          break;
        }
        case "cocci": {
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
        case "virus": {
          const toward = Math.abs(p.x - e.x) < 170 ? Math.sign(p.x - e.x) * 0.45 : 0;
          e.x = Math.max(e.sx - 110, Math.min(e.sx + 110, e.x + toward * k));
          e.y = e.sy + Math.sin(e.t / 28) * 12;
          break;
        }
        case "spiral": {
          if (Math.abs(p.x - e.x) < 220 && e.t % turretEvery < k) {
            const dir = p.x < e.x ? -1 : 1;
            s.shots.push({ x: e.x + (dir > 0 ? e.w : -6), y: e.y + 4, w: 6, h: 6, vx: dir * foeSpeed, vy: 0, grav: 0, life: 220, from: "foe", kind: "toxin", delay: 0, floor: "none" });
          }
          break;
        }
      }
    }
    if (born.length) s.enemies.push(...born);
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
        if (!hit && s.mode === "play") {
          const qi = this.clueHit(sh);
          if (qi >= 0) {
            this.openClue(qi);
            return;
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
    // Platelet Patch and Cough Dash pop shots they touch.
    if (p.shieldT > 0 || p.dashT > 0) s.shots = s.shots.filter((sh) => sh.from === "hero" || sh.delay > 0 || !overlap({ x: p.x - 4, y: p.y - 4, w: PW + 8, h: PH + 8 }, sh));
    for (const r of this.level.spikes) if (overlap(box, r)) this.hurt(dmg);
    for (const r of this.level.pulses) if (pulseOn(r, s.wt) && overlap(box, r)) this.hurt(dmg);
    for (const e of s.enemies) if (!e.dead && overlap(box, e)) this.hurt(dmg, true);
    // Mucus Shield: germ shots that touch you get stuck in the mucus.
    if (s.boosts.mucus > 0) {
      const reach = { x: p.x - MUCUS_REACH, y: p.y - MUCUS_REACH, w: PW + MUCUS_REACH * 2, h: PH + MUCUS_REACH * 2 };
      s.shots = s.shots.filter((sh) => {
        if (sh.from !== "foe" || sh.delay > 0 || !overlap(reach, sh)) return true;
        s.stuck++;
        this.emit({ type: "stuck", x: sh.x + sh.w / 2, y: sh.y + sh.h / 2 });
        return false;
      });
    }
    // Phase Through Membrane: shots pass right through you.
    if (s.boosts.membrane <= 0) {
      for (const sh of s.shots) {
        if (sh.from === "foe" && sh.delay <= 0 && overlap(box, sh)) {
          this.hurt(Math.max(1, dmg - 1), true);
          sh.life = 0;
        }
      }
      s.shots = s.shots.filter((sh) => sh.life > 0);
    }
    const b = s.boss;
    if (b && s.mode === "boss" && b.flinch <= 0 && overlap(box, this.bossRect())) this.hurt(dmg, true);
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
      else if (it.kind === "cell") s.energy = Math.min(MAX_ENERGY, s.energy + CELL_ENERGY);
      else if (it.kind === "power") s.power = Math.min(POWER_MAX, s.power + 8);
      else if (it.kind === "boost") {
        this.giveBoost(it.boost ?? boostFromRoll(this.rand()), "pickup");
        s.score += 200;
      } else s.score += 50;
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
    s.fight = newFight(this.info.rush ? virusHp(this.band, s.rushIdx === VIRUSES.length - 1) : bossHp(this.band));
    this.emit({ type: "bossIntro" });
  }

  /** Lymph Node: the next Major Virus drops in (energy refilled, a fresh fight). */
  private nextVirus() {
    const s = this.s;
    const L = this.level;
    s.rushIdx++;
    s.mode = "bossIntro";
    s.modeT = 0;
    s.shots = [];
    s.energy = MAX_ENERGY;
    s.power = Math.max(s.power, POWER_MAX / 2);
    s.boss = {
      x: L.arenaX + ARENA_W - 70, y: -BOSS_H - 10, vx: 0, vy: 0, t: 0, dir: -1, onGround: false, flinch: 0, stun: 0, shield: 0,
      panel: 0, panelT: 0, step: 0, phaseT: 0, warn: 0, warnX: 0,
    };
    s.fight = newFight(virusHp(this.band, s.rushIdx === VIRUSES.length - 1));
    this.emit({ type: "nextVirus", virus: VIRUSES[s.rushIdx].id });
    this.emit({ type: "bossIntro" });
  }

  /** Who the boss is right now: the stage germ, or the Major Virus that is up. */
  get bossKey(): ZoneId | VirusId {
    return this.info.rush ? VIRUSES[this.s.rushIdx].id : (this.level.id as ZoneId);
  }

  /** The current boss's movement pattern. */
  get pattern(): Pattern {
    return this.info.rush ? VIRUSES[this.s.rushIdx].pattern : ZONES.find((z) => z.id === this.level.id)!.pattern;
  }

  /** What the current boss throws. */
  private get shotKind(): string {
    return SHOT_KIND[this.bossKey];
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
    s.ask = "boss";
    this.emit({ type: "question" });
  }

  // ------------------------------------------------------------------ Antigen Clues

  /** Where Antigen Clue i floats now (it bobs gently in front of its barrier). */
  clueRect(i: number): Rect {
    const q = this.level.clues[i];
    return { x: q.x, y: q.y + Math.round(Math.sin(this.s.t / 20 + i) * 2), w: CLUE_W, h: CLUE_H };
  }

  private clueHit(sh: Rect): number {
    const s = this.s;
    for (let i = 0; i < this.level.clues.length; i++) {
      if (s.clueDone[i]) continue;
      const q = this.level.clues[i];
      if (q.x > s.camX + SCREEN_W || q.x + CLUE_W < s.camX) continue;
      // The clue glows in front of its barrier: a zap that reaches either one asks its question.
      const r = this.clueRect(i);
      if (overlap(sh, { x: r.x, y: r.y, w: q.barrierX + 12 - r.x, h: r.h })) return i;
    }
    return -1;
  }

  /** A zap reached Antigen Clue i: it shows its question. */
  private openClue(i: number) {
    const s = this.s;
    s.mode = "quiz";
    s.modeT = 0;
    s.ask = i;
    s.shots = [];
    s.p.dashT = 0;
    const q = this.level.clues[i];
    this.emit({ type: "clue", n: i, x: q.x + CLUE_W / 2, y: q.y + CLUE_H / 2 });
  }

  /** Starts (or refreshes: never stacks) a power-up. */
  giveBoost(id: BoostId, from: "clue" | "pickup" = "pickup") {
    this.s.boosts[id] = BOOSTS[id].frames;
    this.emit({ type: "boost", boost: id, from });
  }

  /** Antigen Clue answer: it always poofs (barrier gone); right answers give much more. Nothing is ever taken. */
  private answerClue(correct: boolean): AnswerResult {
    const s = this.s;
    const i = s.ask as number;
    const reward = clueReward(correct, this.band, this.rand(), this.rand(), s.clueBoost);
    s.clueDone[i] = true;
    s.cluesAnswered++;
    if (correct) s.cluesRight++;
    s.energy = Math.min(MAX_ENERGY, s.energy + reward.energy);
    s.power = Math.min(POWER_MAX, s.power + reward.power);
    s.score += correct ? 500 : 100;
    const q = this.level.clues[i];
    this.emit({ type: "clueDone", correct, reward, x: q.x + CLUE_W / 2, y: q.y + CLUE_H / 2 });
    if (reward.boost) {
      s.clueBoost = true;
      this.giveBoost(reward.boost, "clue");
    }
    return { correct, damage: 0, weakness: false, defeated: false, reward };
  }

  /** The open question was answered. Wrong answers never cost HP, energy or lives. */
  answer(correct: boolean): AnswerResult {
    const s = this.s;
    if (s.ask !== "boss") return this.answerClue(correct);
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

  /** Back to the fight after the answer card (or on to the poof sparkles). */
  resume() {
    const s = this.s;
    if (s.mode !== "quiz") return;
    s.p.inv = Math.max(s.p.inv, 60);
    if (s.ask !== "boss") {
      s.ask = "boss";
      s.mode = "play";
      s.modeT = 0;
      return;
    }
    if (s.fight && s.fight.hp <= 0) {
      s.mode = "bossDown";
      s.modeT = 0;
      s.shots = [];
      s.score += 2000;
      this.emit({ type: "bossDown" });
      if (this.info.rush) {
        const v = VIRUSES[s.rushIdx].id;
        if (!s.rushBeaten.includes(v)) s.rushBeaten.push(v);
        this.emit({ type: "virusDown", virus: v, next: VIRUSES[s.rushIdx + 1]?.id ?? null });
      }
    } else {
      s.mode = "boss";
      s.modeT = 0;
    }
  }

  private foe(sh: Partial<Shot> & { x: number; y: number }) {
    this.s.shots.push({ w: 8, h: 8, vx: 0, vy: 0, grav: 0, life: 240, from: "foe", kind: "toxin", delay: 0, floor: "none", ...sh });
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

    const kind = this.shotKind;
    switch (this.pattern) {
      case "hop": {
        // Sally Monella / Rhinovirus: leaps toward you; landing sends two blobs rolling both ways.
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
          for (const d of [-1, 1]) this.foe({ x: bx - 4 + d * 14, y: L.arenaY - 8, w: 8, h: 8, vx: d * 1.3 * spd, kind, life: 200 });
        }
        break;
      }
      case "bounce": {
        // Adeno-Bounce: bounces across the room and tosses droplets.
        if (b.onGround) {
          b.vy = -4.2;
          b.vx = b.dir * 1.2 * spd;
        }
        b.x += b.vx * k;
        gravity(0.2);
        clampX();
        if (every(130)) {
          attack();
          this.foe({ x: bx - 4, y: b.y + 10, vx: toward * 1.6 * spd, kind });
        }
        break;
      }
      case "hover": {
        // Heli-Copter: hovers side to side and drops acid drips.
        b.y = L.arenaY - 72 + Math.sin(b.t / 40) * 6;
        b.x = ax + 30 + (ARENA_W - BOSS_W - 60) * (0.5 + 0.5 * Math.sin(b.t / 110));
        if (every(95)) {
          attack();
          this.foe({ x: bx - 4, y: b.y + BOSS_H, vy: 1.2 * spd, grav: 0.03, kind, floor: "stop" });
        }
        break;
      }
      case "dash": {
        // Spiro-Swirl / Norovirus: waits, flashes, then dashes along the floor; jump over it.
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
        // Pneumo-Pair / Influenza: zigzags in the air and sends a gust column down where you stand.
        b.y = L.arenaY - 80 + Math.abs(((b.t / 25) % 2) - 1) * 24;
        b.x = ax + 20 + (ARENA_W - BOSS_W - 40) * (0.5 + 0.5 * Math.sin(b.t / 95));
        if (every(110)) {
          attack();
          const wx = Math.max(ax + 8, Math.min(ax + ARENA_W - 18, px - 5));
          b.warnX = wx;
          b.warn = Math.round(45 * slow);
          this.foe({ x: wx, y: L.arenaY - 150, w: 10, h: 150, kind, delay: Math.round(45 * slow), life: 22 });
        }
        if (b.warn > 0) b.warn--;
        break;
      }
      case "arc": {
        // Mutans Munch / Measles: strolls and lobs sugar cubes (or mist puffs) in arcs.
        gravity(0.3);
        if (Math.abs(px - bx) > 70) b.x += toward * 0.4 * spd * k;
        clampX();
        if (every(100)) {
          attack();
          const flight = 60;
          this.foe({ x: bx - 4, y: b.y + 4, vx: Math.max(-2.4, Math.min(2.4, (px - bx) / flight)) * spd, vy: -4.2, grav: 0.14, kind, floor: "stop" });
        }
        break;
      }
      case "sprout": {
        // Staph-a-Lot / Varicella: makes bumps pop up under you (watch the warning glow), and hops now and then.
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
            this.foe({ x: wx, y: L.arenaY - 36, w: 16, h: 36, kind, delay: Math.round(45 * slow), life: 40 });
          }
        }
        if (b.warn > 0) b.warn--;
        break;
      }
      case "pendulum": {
        // Strep-tacular: swings like a pendulum and drops chain beads that roll along the floor.
        const cx = ax + ARENA_W / 2 - BOSS_W / 2;
        const a = Math.sin(b.t / 70);
        b.x = cx + a * 120;
        b.y = L.arenaY - 74 + (1 - Math.cos(b.t / 35)) * 6;
        if (every(105)) {
          attack();
          this.foe({ x: bx - 5, y: b.y + BOSS_H, w: 10, h: 10, vy: 1.5, grav: 0.1, kind, floor: "roll", life: 300 });
        }
        break;
      }
      case "teleport": {
        // Coronavirus: blinks between three spots and fires a three-way spike spread.
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
              this.foe({ x: b.x + BOSS_W / 2 - 4, y: b.y + BOSS_H / 2 - 4, vx: ((dx * c - dy * sn) / d) * v, vy: ((dx * sn + dy * c) / d) * v, kind });
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

  /** Debug/test: jump straight to the boss arena (in the Lymph Node, optionally to Major Virus `virus`). */
  warpToBoss(virus?: number) {
    const s = this.s;
    if (this.info.rush && virus !== undefined) s.rushIdx = Math.max(0, Math.min(VIRUSES.length - 1, virus));
    s.p.x = this.level.arenaX + 30;
    s.p.y = this.level.arenaY - PH;
    s.p.vx = 0;
    s.p.vy = 0;
    s.checkpoint = this.level.checkpoints.length - 1;
    this.enterArena();
    this.updateCamera();
  }

  /** Debug/test: open the boss's antigen panel now. */
  forceQuestion() {
    if (this.s.mode === "bossIntro") this.s.mode = "boss";
    if (this.s.mode === "boss") this.openQuestion();
  }

  /** Progress through the stage, 0..1. */
  progress(): number {
    return Math.max(0, Math.min(1, this.s.p.x / this.level.arenaX));
  }
}
