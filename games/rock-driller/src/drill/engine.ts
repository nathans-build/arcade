/*
 * Rock Driller engine: tile-locked drilling (Dig Dug-style), critters, foam blaster,
 * falling boulders, buried specimen gems (question stations) and field challenges.
 * Draws to a 320×200 canvas: a 260-pixel ground cross-section plus a 60-pixel layer legend.
 */
import type { ChipAudio, Grade } from "@/kit";
import { gradeNumber } from "@/kit";
import { SPECIMENS, TYPE_NAMES, TYPE_TAGS, type Specimen } from "./geology";
import { makeChallenge, type Challenge, type ChallengeKind } from "./challenges";
import { drawText, measure } from "./font";
import { FIELD_W, digRect, digTile, legendLines, paintGround, shade } from "./ground";
import {
  COLS, GROUND_TOP, ROWS, START_COL, START_ROW, TILE, buildLevel, idx, pickOf, targetPairs,
  type Gem, type GoalId, type LevelData, type Unit,
} from "./levels";
import { PAL, gemSprite, getSprites, type SpriteSheet } from "./sprites";

export const W = 320;
export const H = 200;
const LEGEND_X = FIELD_W; // 260

export type Action = "left" | "right" | "up" | "down" | "fire";
type Mode = "demo" | "ready" | "play" | "paused" | "question" | "dying" | "clear" | "checkpoint" | "over";
type Dir = [number, number];

export interface HudState {
  score: number;
  lives: number;
  level: number;
  have: number;
  need: number;
  goal: string;
  site: string;
}

export interface GemInfo {
  specimen: Specimen;
  unit: Unit;
  target: boolean;
  goalId: GoalId;
  /** Sentence about where it was found, e.g. "Found in SHALE, a sedimentary rock." */
  where: string;
}

export interface LevelInfo {
  level: number;
  site: string;
  intro: string;
  goalText: string;
  goalShort: string;
  notToScale: boolean;
}

export interface EngineCallbacks {
  onHud(h: HudState): void;
  onLevel(info: LevelInfo): void;
  onGem(info: GemInfo): void;
  onGemResolved(info: GemInfo, correct: boolean, respawned: boolean): void;
  onChallenge(ch: Challenge): void;
  onChallengeResult(ch: Challenge, choice: number, correct: boolean): void;
  onChallengeDone(): void;
  onLevelClear(level: number): void;
  onGameOver(): void;
}

interface Critter {
  kind: "bug" | "magmite";
  x: number;
  y: number;
  dir: Dir;
  tx: number;
  ty: number;
  moving: boolean;
  state: "walk" | "ghost" | "foam" | "pop" | "crushed";
  foam: number;
  pumpT: number;
  decayT: number;
  ghostT: number;
  ghostDur: number;
  home: [number, number];
  anim: number;
  popT: number;
  charge: number;
  flameT: number;
  flameCd: number;
  flame: [number, number][];
}

interface Boulder {
  col: number;
  row: number;
  y: number;
  state: "rest" | "wobble" | "fall" | "crumble";
  t: number;
  crushed: Critter[];
  hitHero: boolean;
}

interface Particle { x: number; y: number; vx: number; vy: number; life: number; color: string }
interface Popup { x: number; y: number; text: string; t: number; color: string }

const DIRS: Record<"left" | "right" | "up" | "down", Dir> = { left: [-1, 0], right: [1, 0], up: [0, -1], down: [0, 1] };
const CRUSH_SCORES = [500, 1000, 2000, 4000];

export class DrillEngine {
  private ctx: CanvasRenderingContext2D;
  private sprites: SpriteSheet;
  private raf = 0;
  private last = 0;
  private hudTimer = 0;
  private frame = 0;
  private time = 0;

  mode: Mode = "demo";
  private pausedFrom: Mode = "play";
  private keys: Action[] = [];

  grade: Grade = "4";
  private g = 4; // grade number
  data!: LevelData;
  private ground!: HTMLCanvasElement;
  private groundCtx!: CanvasRenderingContext2D;
  private dug!: Uint8Array;

  // hero
  hx = START_COL * TILE;
  hy = START_ROW * TILE;
  private hdir: Dir = [1, 0];
  private hface = 1;
  private hmoving = false;
  private htx = START_COL;
  private hty = START_ROW;
  private hanim = 0;
  private invuln = 0;
  private dyingT = 0;
  private fireCd = 0;
  /** A tap of the fire key between frames still fires. */
  private fireQueued = false;
  private jet: { x1: number; y1: number; x2: number; y2: number; t: number } | null = null;

  critters: Critter[] = [];
  boulders: Boulder[] = [];
  private particles: Particle[] = [];
  private popups: Popup[] = [];
  private banner: { lines: string[]; t: number; color: string } | null = null;
  private stateT = 0;
  private respawnT = 0;
  private crushCount = 0;

  // gems and goal
  have = 0;
  private pendingGem: Gem | null = null;
  private lastGoal: GoalId | undefined;

  // field challenge
  challenge: Challenge | null = null;
  /** Layers whose rock class the player has uncovered (shown in the legend). */
  private revealed = new Set<number>();
  private chResult: { choice: number; correct: boolean; t: number } | null = null;
  private chTimer = 0;
  private chCount = 0;
  private lastKind: ChallengeKind | undefined;

  score = 0;
  lives = 3;
  level = 1;
  /** Test hook: skip critter collisions. */
  godMode = false;

  constructor(canvas: HTMLCanvasElement, private audio: ChipAudio, private cb: EngineCallbacks) {
    canvas.width = W;
    canvas.height = H;
    this.ctx = canvas.getContext("2d")!;
    this.ctx.imageSmoothingEnabled = false;
    this.sprites = getSprites();
  }

  /* ------------------------------ lifecycle ------------------------------ */

  start() {
    this.last = performance.now();
    const loop = (now: number) => {
      const dt = Math.max(0, Math.min(0.05, (now - this.last) / 1000));
      this.last = now;
      this.update(dt);
      this.draw();
      this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
  }

  stop() {
    cancelAnimationFrame(this.raf);
  }

  /** Attract mode behind the title screen: critters roam level 1 of this grade. */
  demo(grade: Grade) {
    this.grade = grade;
    this.g = gradeNumber(grade);
    this.level = 1;
    this.mode = "demo";
    this.challenge = null;
    this.banner = null;
    this.loadLevel();
  }

  newGame(grade: Grade) {
    this.grade = grade;
    this.g = gradeNumber(grade);
    this.score = 0;
    this.lives = 3;
    this.level = 1;
    this.lastGoal = undefined;
    this.lastKind = undefined;
    this.keys = [];
    this.startLevel();
  }

  private loadLevel() {
    this.data = buildLevel(this.grade, this.level, Math.random, this.lastGoal);
    this.lastGoal = this.data.goal.id;
    this.dug = this.data.dug;
    this.ground = paintGround(this.data);
    this.groundCtx = this.ground.getContext("2d")!;
    this.critters = this.data.tunnels.map((t) => {
      const [c, r] = t.cells[Math.floor(t.cells.length / 2)];
      return this.makeCritter(t.critter, c, r);
    });
    this.boulders = this.data.boulders.map(([col, row]) => ({ col, row, y: row * TILE, state: "rest" as const, t: 0, crushed: [], hitHero: false }));
    this.particles = [];
    this.popups = [];
    this.have = 0;
    this.pendingGem = null;
    if (this.challenge) this.cb.onChallengeDone();
    this.challenge = null;
    this.chResult = null;
    this.chCount = 0;
    this.chTimer = 0;
    this.respawnT = 0;
    this.revealed = new Set();
    this.resetHero();
  }

  private makeCritter(kind: Critter["kind"], c: number, r: number): Critter {
    return {
      kind, x: c * TILE, y: r * TILE, dir: [1, 0], tx: c, ty: r, moving: false, state: "walk", foam: 0, pumpT: 0, decayT: 0,
      ghostT: -Math.random() * 3, ghostDur: 0, home: [c, r], anim: Math.random() * 10, popT: 0, charge: 0, flameT: 0,
      flameCd: 2 + Math.random() * 2, flame: [],
    };
  }

  private resetHero() {
    this.hx = START_COL * TILE;
    this.hy = START_ROW * TILE;
    this.htx = START_COL;
    this.hty = START_ROW;
    this.hmoving = false;
    this.hdir = [0, 1];
    this.hface = 1;
    this.jet = null;
  }

  private startLevel() {
    this.loadLevel();
    this.mode = "ready";
    this.stateT = this.early ? 2.6 : 2.0;
    this.invuln = 0;
    const d = this.data;
    this.banner = { lines: [`LEVEL ${this.level}`, d.site.name, `GOAL: ${d.goal.short}`], t: this.stateT, color: PAL.yellow };
    this.cb.onLevel({
      level: this.level, site: d.site.name, intro: d.site.intro, goalText: d.goal.text, goalShort: d.goal.short,
      notToScale: !!d.site.notToScale,
    });
    this.emitHud();
  }

  setKey(a: Action, down: boolean) {
    if (a === "fire" && down && !this.keys.includes("fire")) this.fireQueued = true;
    this.keys = this.keys.filter((k) => k !== a);
    if (down) this.keys.push(a);
  }

  releaseAllKeys() {
    this.keys = [];
    this.fireQueued = false;
  }

  togglePause(force?: boolean) {
    const paused = this.mode === "paused";
    const want = force ?? !paused;
    if (want && !paused && (this.mode === "play" || this.mode === "ready" || this.mode === "dying" || this.mode === "clear")) {
      this.pausedFrom = this.mode;
      this.mode = "paused";
      this.releaseAllKeys();
    } else if (!want && paused) {
      this.mode = this.pausedFrom;
      this.last = performance.now();
    }
    return this.mode === "paused";
  }

  get playing() {
    return this.mode !== "demo" && this.mode !== "over";
  }

  /* ------------------------------ difficulty ------------------------------ */

  private get early() {
    return this.g <= 2;
  }
  private heroSpeed() {
    return 44; // px/s through open tunnel
  }
  private digSpeed(hardness: number) {
    const k = this.early ? 0.1 : 0.16;
    return this.heroSpeed() / (1 + k * hardness);
  }
  private critterSpeed() {
    const base = this.early ? 18 : this.g <= 5 ? 22 : this.g <= 8 ? 25 : 27;
    let s = Math.min(40, base + (this.level - 1) * 1.4);
    if (this.challenge && !this.chResult && this.g <= 5) s *= 0.6;
    return s;
  }
  private chaseChance() {
    return this.early ? 0.45 : this.g <= 5 ? 0.6 : this.g <= 8 ? 0.7 : 0.78;
  }
  private ghostAfter() {
    return this.early ? 14 : Math.max(6, 11 - this.level);
  }
  /** Foam hits beyond this pop a critter (K–2: 2 zaps, others: 3). */
  private popAt() {
    return this.early ? 1 : 2;
  }
  private jetRange() {
    return this.early ? 4 : 3;
  }
  private wobbleTime() {
    return this.early ? 1.3 : 0.8;
  }

  /* ------------------------------ grid helpers ------------------------------ */

  private inGrid(c: number, r: number) {
    return c >= 0 && c < COLS && r >= 0 && r < ROWS;
  }
  private isDug(c: number, r: number) {
    return this.inGrid(c, r) && this.dug[idx(c, r)] === 1;
  }
  private boulderAt(c: number, r: number) {
    return this.boulders.find((b) => (b.state === "rest" || b.state === "wobble") && b.col === c && b.row === r);
  }
  private gemAt(c: number, r: number) {
    return this.data.gems.find((g) => g.state === "buried" && g.col === c && g.row === r);
  }
  private heroTile(): [number, number] {
    return [Math.round(this.hx / TILE), Math.round(this.hy / TILE)];
  }
  private unitAt(c: number, r: number): Unit | undefined {
    return this.data.units[this.data.unitAt[idx(c, r)]];
  }

  /* ------------------------------ player actions ------------------------------ */

  /** Settles the buried gem the hero drilled into. */
  resolveGem(correct: boolean) {
    const gem = this.pendingGem;
    if (!gem || this.mode !== "question") return;
    this.pendingGem = null;
    const info = this.gemInfo(gem);
    let respawned = false;
    const cx = gem.col * TILE + 5, cy = gem.row * TILE + 5;
    this.revealed.add(gem.unit);
    if (correct) {
      gem.state = "collected";
      const pts = gem.target ? 500 : 300;
      this.addScore(pts, cx, cy);
      this.burst(cx, cy, [PAL.yellow, PAL.white, SPECIMENS[gem.specimen].colors[0]], 18);
      if (gem.target) this.have++;
    } else {
      gem.state = "cracked";
      this.burst(cx, cy, ["#6a5a4a", "#9a8a7a"], 10);
      if (gem.target) respawned = this.ensureTargets();
    }
    this.cb.onGemResolved(info, correct, respawned);
    this.mode = "play";
    this.last = performance.now();
    this.emitHud();
    if (this.have >= this.data.goal.count) this.levelClear();
  }

  /** Makes sure enough target gems remain buried to finish the goal. */
  private ensureTargets(): boolean {
    const d = this.data;
    const buried = d.gems.filter((g) => g.target && g.state === "buried").length;
    if (this.have + buried >= d.goal.count) return false;
    const pairs = targetPairs(d);
    const [hc, hr] = this.heroTile();
    for (let tries = 0; tries < 400; tries++) {
      const p = pickOf(Math.random, pairs);
      const r = p.u.top + Math.floor(Math.random() * (p.u.bottom - p.u.top + 1));
      const c = Math.floor(Math.random() * COLS);
      if (d.unitAt[idx(c, r)] !== p.u.index || this.isDug(c, r) || this.boulderAt(c, r) || this.gemAt(c, r)) continue;
      if (Math.abs(c - hc) + Math.abs(r - hr) < 4) continue;
      if (this.challenge?.markers.some(([mc, mr]) => mc === c && mr === r)) continue;
      d.gems.push({ col: c, row: r, specimen: p.s, unit: p.u.index, target: true, state: "buried" });
      this.popups.push({ x: c * TILE + 5, y: r * TILE - 4, text: "NEW GEM!", t: 2.5, color: PAL.yellow });
      return true;
    }
    return false;
  }

  /** Answers the open field challenge (0-3). Returns true if it was accepted. */
  answerChallenge(choice: number) {
    const ch = this.challenge;
    if (!ch || this.chResult || !this.playing || this.mode === "question" || this.mode === "checkpoint") return false;
    const correct = choice === ch.q.answer;
    this.chResult = { choice, correct, t: 4.5 };
    for (const u of ch.units) this.revealed.add(u);
    const [mc, mr] = ch.markers[choice];
    if (correct) {
      this.addScore(1000, mc * TILE + 5, mr * TILE);
      this.burst(mc * TILE + 5, mr * TILE + 5, [PAL.green, PAL.yellow, PAL.white], 16);
    }
    this.cb.onChallengeResult(ch, choice, correct);
    this.chTimer = 0;
    return true;
  }

  /** Continue after the between-level transmission. */
  nextLevel(correct: boolean) {
    if (this.mode !== "checkpoint") return;
    if (correct) {
      this.score += 1000 * this.level;
      if (this.lives < 5) this.lives++;
    }
    this.level++;
    this.audio.levelUp();
    this.startLevel();
  }

  private levelClear() {
    this.mode = "clear";
    this.stateT = 2.2;
    const bonus = 1000 * this.level;
    this.score += bonus;
    this.banner = { lines: ["GOAL COMPLETE!", `BONUS ${bonus}`], t: 2.2, color: PAL.green };
    this.audio.levelUp();
    if (this.challenge && !this.chResult) {
      this.challenge = null;
      this.cb.onChallengeDone();
    }
    this.emitHud();
  }

  private gemInfo(gem: Gem): GemInfo {
    const unit = this.data.units[gem.unit];
    const sp = SPECIMENS[gem.specimen];
    const t = unit.rock.type;
    const kindWord = t === "earth" ? "a layer of Earth" : t === "soil" ? "a soil layer" : t === "sediment" ? "loose sediment" : `a${t === "igneous" ? "n" : ""} ${TYPE_NAMES[t].toLowerCase()} rock`;
    const name = unit.label.replace(/ \(.*\)$/, "");
    const where = this.early ? `Found in the ${name.toLowerCase()} layer.` : `Found in ${name}, ${kindWord}.`;
    return { specimen: sp, unit, target: gem.target, goalId: this.data.goal.id, where };
  }

  /* ------------------------------ update ------------------------------ */

  private update(dt: number) {
    this.frame++;
    this.time += dt;
    this.updateParticles(dt);
    if (this.banner) {
      this.banner.t -= dt;
      if (this.banner.t <= 0) this.banner = null;
    }
    if (this.mode === "paused" || this.mode === "over" || this.mode === "question" || this.mode === "checkpoint") return;

    if (this.mode === "demo") {
      this.updateCritters(dt);
      return;
    }
    if (this.mode === "ready") {
      this.stateT -= dt;
      if (this.stateT <= 0) {
        this.mode = "play";
        this.invuln = 1.5;
      }
      return;
    }
    if (this.mode === "dying") {
      this.dyingT -= dt;
      this.updateBoulders(dt);
      if (this.dyingT <= 0) this.afterDeath();
      return;
    }
    if (this.mode === "clear") {
      this.stateT -= dt;
      if (this.stateT <= 0) {
        this.mode = "checkpoint";
        this.releaseAllKeys();
        this.cb.onLevelClear(this.level);
      }
      return;
    }

    // play
    this.invuln = Math.max(0, this.invuln - dt);
    this.updateHero(dt);
    if (this.mode !== "play") return;
    this.updateCritters(dt);
    this.updateBoulders(dt);
    this.updateChallenge(dt);
    this.updateRespawn(dt);
    this.checkHits();
    this.hudTimer -= dt;
    if (this.hudTimer <= 0) this.emitHud();
  }

  private wantDir(): Dir | null {
    for (let i = this.keys.length - 1; i >= 0; i--) {
      const k = this.keys[i];
      if (k !== "fire") return DIRS[k];
    }
    return null;
  }

  private updateHero(dt: number) {
    const want = this.wantDir();
    this.fireCd -= dt;
    if (this.jet) {
      this.jet.t -= dt;
      if (this.jet.t <= 0) this.jet = null;
    }

    const aligned = !this.hmoving;
    if (aligned) {
      if (want) {
        this.hdir = want;
        if (want[0] !== 0) this.hface = want[0];
        const nc = this.htx + want[0], nr = this.hty + want[1];
        if (this.canEnter(nc, nr)) {
          this.htx = nc;
          this.hty = nr;
          this.hmoving = true;
        }
      }
    } else if (want && want[0] === -this.hdir[0] && want[1] === -this.hdir[1]) {
      // reverse mid-tile
      this.htx -= this.hdir[0];
      this.hty -= this.hdir[1];
      this.hdir = want;
      if (want[0] !== 0) this.hface = want[0];
    }
    if (this.mode !== "play") return;

    if (this.hmoving) {
      const tx = this.htx * TILE, ty = this.hty * TILE;
      const digging = !this.isDug(this.htx, this.hty);
      const hard = digging ? this.unitAt(this.htx, this.hty)?.rock.hardness ?? 1 : 0;
      const speed = digging ? this.digSpeed(hard) : this.heroSpeed();
      const step = speed * dt;
      const dx = tx - this.hx, dy = ty - this.hy;
      const dist = Math.abs(dx) + Math.abs(dy);
      if (dist <= step) {
        this.hx = tx;
        this.hy = ty;
        this.hmoving = false;
        if (!this.isDug(this.htx, this.hty)) {
          this.dug[idx(this.htx, this.hty)] = 1;
          digTile(this.groundCtx, this.data, this.htx, this.hty);
          this.score += 10;
          this.audio.tone(110 + (this.hty % 4) * 20, 0.04, "square", 0.08);
        }
      } else {
        this.hx += Math.sign(dx) * step;
        this.hy += Math.sign(dy) * step;
      }
      this.hanim += step;
      if (this.hy >= GROUND_TOP * TILE - TILE + 1) digRect(this.groundCtx, this.data, this.hx, this.hy, TILE, TILE);
    }

    // foam blaster
    if ((this.fireQueued || this.keys.includes("fire")) && this.fireCd <= 0) {
      this.fireQueued = false;
      this.fireCd = 0.24;
      this.fire();
    }
  }

  /** Can the hero start moving into tile (c, r)? Also triggers gems and challenge markers. */
  private canEnter(c: number, r: number): boolean {
    if (c < 0 || c >= COLS || r < START_ROW || r >= ROWS) return false;
    if (this.boulderAt(c, r)) return false;
    const gem = this.gemAt(c, r);
    if (gem) {
      this.pendingGem = gem;
      this.mode = "question";
      this.releaseAllKeys();
      this.audio.checkpoint();
      this.cb.onGem(this.gemInfo(gem));
      return false;
    }
    const ch = this.challenge;
    if (ch && !this.chResult) {
      const m = ch.markers.findIndex(([mc, mr]) => mc === c && mr === r);
      if (m >= 0) this.answerChallenge(m);
    }
    return true;
  }

  private fire() {
    const [hc, hr] = this.heroTile();
    const [dx, dy] = this.hdir;
    const range = this.jetRange();
    const cx = this.hx + 5, cy = this.hy + 5;
    let hit: Critter | null = null;
    let reach = 0;
    for (let s = 1; s <= range; s++) {
      const c = hc + dx * s, r = hr + dy * s;
      if (!this.isDug(c, r)) break;
      reach = s;
      hit = this.critters.find((k) => (k.state === "walk" || k.state === "foam") &&
        Math.abs(k.x + 5 - (c * TILE + 5)) < 8 && Math.abs(k.y + 5 - (r * TILE + 5)) < 8) ?? null;
      if (hit) break;
    }
    const ex = hit ? hit.x + 5 : cx + dx * (reach * TILE + 4);
    const ey = hit ? hit.y + 5 : cy + dy * (reach * TILE + 4);
    this.jet = { x1: cx + dx * 4, y1: cy + dy * 4, x2: ex, y2: ey, t: 0.14 };
    this.audio.tone(hit ? 700 : 520, 0.07, "triangle", 0.25, hit ? 1100 : 300);
    if (!hit) return;
    hit.state = "foam";
    hit.foam++;
    hit.pumpT = 0;
    hit.decayT = 0;
    if (hit.foam > this.popAt()) {
      hit.state = "pop";
      hit.popT = 0.35;
      const depthBonus = Math.max(0, Math.floor((hit.ty - GROUND_TOP) / 4)) * 100;
      this.addScore(200 + depthBonus, hit.x + 5, hit.y);
      this.burst(hit.x + 5, hit.y + 5, [PAL.cyan, "#ffffff", hit.kind === "bug" ? "#3fbf5f" : "#ff7a1a"], 16);
      this.audio.explode();
    }
  }

  private updateCritters(dt: number) {
    const speed = this.critterSpeed();
    const heroT = this.heroTile();
    let dist: Int16Array | null = null;
    const getDist = () => (dist ??= this.bfs(heroT));
    for (const k of this.critters) {
      k.anim += dt * 6;
      if (k.state === "pop") {
        k.popT -= dt;
        continue;
      }
      if (k.state === "crushed") continue;
      if (k.state === "foam") {
        k.pumpT += dt;
        if (k.pumpT > 1.0) {
          k.decayT += dt;
          if (k.decayT > 0.7) {
            k.decayT = 0;
            k.foam--;
            if (k.foam <= 0) {
              k.foam = 0;
              k.state = "walk";
            }
          }
        }
        continue;
      }
      if (k.flameT > 0) {
        k.flameT -= dt;
        if (k.flameT <= 0) k.flame = [];
        continue;
      }
      if (k.charge > 0) {
        k.charge -= dt;
        if (k.charge <= 0) this.breatheFire(k);
        continue;
      }
      k.flameCd -= dt;
      if (k.state === "ghost") {
        k.ghostDur += dt;
        const tx = this.mode === "demo" ? k.home[0] * TILE : this.hx;
        const ty = Math.max(GROUND_TOP * TILE, this.mode === "demo" ? k.home[1] * TILE : this.hy);
        const dx = tx - k.x, dy = ty - k.y;
        const len = Math.hypot(dx, dy) || 1;
        const gs = speed * 0.55 * dt;
        k.x += (dx / len) * gs;
        k.y += (dy / len) * gs;
        if (dx !== 0) k.dir = [Math.sign(dx), 0];
        const c = Math.round(k.x / TILE), r = Math.round(k.y / TILE);
        if (k.ghostDur > 1.6 && Math.abs(k.x - c * TILE) < 1.2 && Math.abs(k.y - r * TILE) < 1.2 && r >= GROUND_TOP && this.isDug(c, r) && !this.boulderAt(c, r)) {
          k.x = c * TILE;
          k.y = r * TILE;
          k.tx = c;
          k.ty = r;
          k.moving = false;
          k.state = "walk";
          k.ghostT = 0;
        }
        continue;
      }
      // walk
      k.ghostT += dt;
      if (!k.moving) {
        const c = k.tx, r = k.ty;
        // magmite: puff flame along the tunnel at a hero in line
        if (k.kind === "magmite" && k.flameCd <= 0 && this.mode === "play" && heroT[1] === r && Math.abs(heroT[0] - c) <= 3 && heroT[0] !== c) {
          const s = Math.sign(heroT[0] - c);
          let clear = true;
          for (let x = c + s; x !== heroT[0]; x += s) if (!this.isDug(x, r)) clear = false;
          if (clear) {
            k.dir = [s, 0];
            k.charge = this.g <= 5 ? 0.9 : 0.6;
            k.flameCd = 4.5;
            continue;
          }
        }
        const opts: Dir[] = ([[1, 0], [-1, 0], [0, 1], [0, -1]] as Dir[]).filter(([dx, dy]) => {
          const nc = c + dx, nr = r + dy;
          return nr >= GROUND_TOP && this.isDug(nc, nr) && !this.boulderAt(nc, nr);
        });
        const noBack = opts.filter(([dx, dy]) => !(dx === -k.dir[0] && dy === -k.dir[1]));
        let choice: Dir | null = null;
        const chase = this.mode !== "demo" && Math.random() < this.chaseChance();
        if (chase && opts.length) {
          const d = getDist();
          let best = Infinity;
          for (const o of opts) {
            const v = d[idx(c + o[0], r + o[1])];
            if (v >= 0 && v < best) {
              best = v;
              choice = o;
            }
          }
        }
        if (!choice) choice = noBack.length ? pickOf(Math.random, noBack) : opts.length ? opts[0] : null;
        // go ghost (eyes drifting through rock) when cut off from the hero for a while
        if (this.mode !== "demo") {
          const reachable = getDist()[idx(c, r)] >= 0;
          const limit = this.ghostAfter() * (reachable ? 1.6 : 1);
          if (k.ghostT > limit || (!choice && k.ghostT > 2)) {
            k.state = "ghost";
            k.ghostDur = 0;
            continue;
          }
        }
        if (!choice) continue;
        k.dir = choice;
        k.tx = c + choice[0];
        k.ty = r + choice[1];
        k.moving = true;
      }
      const tx = k.tx * TILE, ty = k.ty * TILE;
      const step = speed * dt;
      const dx = tx - k.x, dy = ty - k.y;
      if (Math.abs(dx) + Math.abs(dy) <= step) {
        k.x = tx;
        k.y = ty;
        k.moving = false;
      } else {
        k.x += Math.sign(dx) * step;
        k.y += Math.sign(dy) * step;
      }
    }
    this.critters = this.critters.filter((k) => !(k.state === "pop" && k.popT <= 0));
  }

  private breatheFire(k: Critter) {
    const tiles: [number, number][] = [];
    for (let s = 1; s <= 2; s++) {
      const c = k.tx + k.dir[0] * s, r = k.ty;
      if (!this.isDug(c, r)) break;
      tiles.push([c, r]);
    }
    k.flame = tiles;
    k.flameT = 0.7;
    this.audio.noise(0.25, 0.3);
  }

  /** Distance (in tiles) from the hero through dug tunnels, -1 where unreachable. */
  private bfs(from: [number, number]): Int16Array {
    const d = new Int16Array(ROWS * COLS).fill(-1);
    const [c0, r0] = from;
    if (!this.inGrid(c0, r0)) return d;
    const q: number[] = [idx(c0, r0)];
    d[q[0]] = 0;
    for (let h = 0; h < q.length; h++) {
      const i = q[h];
      const c = i % COLS, r = Math.floor(i / COLS);
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nc = c + dx, nr = r + dy;
        if (!this.isDug(nc, nr) || nr < GROUND_TOP) continue;
        const j = idx(nc, nr);
        if (d[j] >= 0) continue;
        d[j] = d[i] + 1;
        q.push(j);
      }
    }
    return d;
  }

  private updateBoulders(dt: number) {
    const heroOver = (c: number, r: number) =>
      Math.abs(this.hx - c * TILE) < TILE && Math.abs(this.hy - r * TILE) < TILE;
    for (const b of this.boulders) {
      if (b.state === "rest") {
        if (this.isDug(b.col, b.row + 1) && !heroOver(b.col, b.row + 1)) {
          b.state = "wobble";
          b.t = this.wobbleTime();
        }
      } else if (b.state === "wobble") {
        b.t -= dt;
        if (b.t <= 0) {
          b.state = "fall";
          this.dug[idx(b.col, b.row)] = 1;
          digTile(this.groundCtx, this.data, b.col, b.row);
        }
      } else if (b.state === "fall") {
        b.y += (this.early ? 55 : 72) * dt;
        const r = Math.floor(b.y / TILE);
        // crush anything under it
        for (const k of this.critters) {
          if (k.state === "pop" || k.state === "crushed") continue;
          if (Math.abs(k.x - b.col * TILE) < 8 && k.y > b.y - 2 && k.y < b.y + 9) {
            k.state = "crushed";
            b.crushed.push(k);
          }
        }
        for (const k of b.crushed) k.y = b.y + 4;
        if (!b.hitHero && Math.abs(this.hx - b.col * TILE) < 8 && this.hy > b.y - 2 && this.hy < b.y + 9 && this.mode === "play") {
          b.hitHero = true;
          this.die("BOULDER!");
        }
        const below = r + 1;
        if (b.y >= r * TILE && (below >= ROWS || !this.isDug(b.col, below))) {
          b.y = r * TILE;
          b.row = r;
          b.state = "crumble";
          b.t = 0.5;
          this.burst(b.col * TILE + 5, b.y + 8, ["#9a8f84", "#c9c0b4", "#4a443e"], 12);
          this.audio.noise(0.2, 0.4);
          if (b.crushed.length) {
            const pts = CRUSH_SCORES[Math.min(b.crushed.length, 4) - 1];
            this.addScore(pts, b.col * TILE + 5, b.y - 4);
            this.crushCount += b.crushed.length;
          }
        }
      } else if (b.state === "crumble") {
        b.t -= dt;
        if (b.t <= 0) {
          for (const k of b.crushed) {
            k.state = "pop";
            k.popT = 0;
          }
        }
      }
    }
    this.boulders = this.boulders.filter((b) => !(b.state === "crumble" && b.t <= 0));
    this.critters = this.critters.filter((k) => !(k.state === "pop" && k.popT <= 0));
  }

  /** New critters wander in when the level is quiet, so there is always a little danger. */
  private updateRespawn(dt: number) {
    const alive = this.critters.filter((k) => k.state !== "pop" && k.state !== "crushed").length;
    if (alive > 0) {
      this.respawnT = 0;
      return;
    }
    this.respawnT += dt;
    if (this.respawnT < (this.early ? 14 : 8)) return;
    this.respawnT = 0;
    const [hc, hr] = this.heroTile();
    const tun = this.data.tunnels;
    const homes = tun.map((t) => t.cells[0]).filter(([c, r]) => Math.abs(c - hc) + Math.abs(r - hr) > 8);
    const [c, r] = homes.length ? pickOf(Math.random, homes) : [hc < COLS / 2 ? COLS - 2 : 1, ROWS - 2];
    const k = this.makeCritter(this.data.tunnels.some((t) => t.critter === "magmite") ? "magmite" : "bug", c, r);
    k.state = "ghost";
    k.ghostDur = 0;
    this.critters.push(k);
  }

  private updateChallenge(dt: number) {
    if (this.chResult) {
      this.chResult.t -= dt;
      if (this.chResult.t <= 0) {
        this.chResult = null;
        this.challenge = null;
        this.cb.onChallengeDone();
      }
      return;
    }
    if (this.challenge) return;
    if (this.chCount >= 2) return;
    this.chTimer += dt;
    const wait = this.chCount === 0 ? (this.early ? 9 : 7) : 30;
    if (this.chTimer < wait) return;
    const ch = makeChallenge(this.data, Math.random, this.heroTile(), this.lastKind);
    this.chTimer = 0;
    if (!ch) {
      this.chCount = 2;
      return;
    }
    // markers never sit on a buried gem or boulder (already avoided), nor the hero's tile
    this.challenge = ch;
    this.lastKind = ch.kind;
    this.chCount++;
    this.audio.checkpoint();
    this.cb.onChallenge(ch);
  }

  private checkHits() {
    if (this.mode !== "play" || this.invuln > 0 || this.godMode) return;
    for (const k of this.critters) {
      if (k.state === "walk" && Math.abs(k.x - this.hx) < 7 && Math.abs(k.y - this.hy) < 7) {
        this.die("OUCH!");
        return;
      }
      for (const [c, r] of k.flame) {
        if (Math.abs(c * TILE - this.hx) < 8 && Math.abs(r * TILE - this.hy) < 8) {
          this.die("TOO HOT!");
          return;
        }
      }
    }
  }

  private die(text: string) {
    if (this.mode !== "play") return;
    this.mode = "dying";
    this.dyingT = 1.8;
    this.lives--;
    this.releaseAllKeys();
    this.audio.crash();
    this.banner = { lines: [text], t: 1.6, color: PAL.red };
    this.burst(this.hx + 5, this.hy + 5, [PAL.red, PAL.blue, PAL.yellow], 20);
    this.emitHud();
  }

  private afterDeath() {
    if (this.lives <= 0) {
      this.mode = "over";
      this.audio.gameOver();
      this.audio.stopMusic();
      if (this.challenge && !this.chResult) {
        this.challenge = null;
        this.cb.onChallengeDone();
      }
      this.emitHud();
      this.cb.onGameOver();
      return;
    }
    this.resetHero();
    for (const k of this.critters) {
      if (k.state === "pop" || k.state === "crushed") continue;
      k.x = k.home[0] * TILE;
      k.y = k.home[1] * TILE;
      k.tx = k.home[0];
      k.ty = k.home[1];
      k.moving = false;
      k.state = this.isDug(k.home[0], k.home[1]) ? "walk" : "ghost";
      k.foam = 0;
      k.ghostT = -2;
      k.flame = [];
      k.flameT = 0;
      k.charge = 0;
    }
    this.mode = "ready";
    this.stateT = 1.4;
    this.banner = { lines: ["READY!"], t: 1.4, color: PAL.yellow };
  }

  /* ------------------------------ effects ------------------------------ */

  private addScore(pts: number, x: number, y: number) {
    this.score += pts;
    this.popups.push({ x, y, text: String(pts), t: 1.1, color: PAL.yellow });
  }

  private burst(x: number, y: number, colors: string[], n: number) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = 20 + Math.random() * 50;
      this.particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 20, life: 0.5 + Math.random() * 0.4, color: colors[i % colors.length] });
    }
  }

  private updateParticles(dt: number) {
    for (const p of this.particles) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 90 * dt;
      p.life -= dt;
    }
    this.particles = this.particles.filter((p) => p.life > 0);
    for (const p of this.popups) {
      p.t -= dt;
      p.y -= 10 * dt;
    }
    this.popups = this.popups.filter((p) => p.t > 0);
  }

  private emitHud() {
    this.hudTimer = 0.1;
    this.cb.onHud({
      score: this.score, lives: this.lives, level: this.level, have: this.have, need: this.data?.goal.count ?? 0,
      goal: this.data?.goal.short ?? "", site: this.data?.site.name ?? "",
    });
  }

  /* ------------------------------ drawing ------------------------------ */

  private draw() {
    const g = this.ctx;
    g.fillStyle = PAL.navy;
    g.fillRect(0, 0, W, H);
    if (!this.data) return;
    g.drawImage(this.ground, 0, 0);
    this.drawRig(g);
    this.drawGems(g);
    this.drawMarkers(g);
    this.drawBoulders(g);
    this.drawCritters(g);
    if (this.mode !== "demo") this.drawHero(g);
    this.drawJet(g);
    for (const p of this.particles) {
      g.fillStyle = p.color;
      g.fillRect(Math.floor(p.x), Math.floor(p.y), 1, 1);
    }
    for (const p of this.popups) drawText(g, p.text, Math.round(p.x), Math.round(p.y), p.color, { align: "center", shadow: "#000" });
    this.drawLegend(g);
    this.drawBanner(g);
  }

  private drawRig(g: CanvasRenderingContext2D) {
    g.drawImage(this.sprites.rig, START_COL * TILE - 14, START_ROW * TILE);
  }

  private drawGems(g: CanvasRenderingContext2D) {
    const t = this.time;
    for (const gem of this.data.gems) {
      if (gem.state !== "buried") continue;
      const sp = SPECIMENS[gem.specimen];
      const x = gem.col * TILE, y = gem.row * TILE;
      const u = this.data.units[gem.unit];
      g.fillStyle = shade(u.rock.colors[1], 0.55);
      g.fillRect(x + 1, y + 1, 8, 8);
      g.drawImage(gemSprite(sp.shape, sp.colors[0], sp.colors[1]), x + 1, y + 1);
      const ph = (t * 1.3 + gem.col * 0.37 + gem.row * 0.21) % 2.2;
      if (ph < 0.25) {
        g.fillStyle = "#ffffff";
        g.fillRect(x + 7, y, 1, 3);
        g.fillRect(x + 6, y + 1, 3, 1);
      }
    }
  }

  private drawMarkers(g: CanvasRenderingContext2D) {
    const ch = this.challenge;
    if (!ch) return;
    const blink = Math.floor(this.time * 4) % 2 === 0;
    ch.markers.forEach(([c, r], i) => {
      const x = c * TILE, y = r * TILE;
      let col: string = PAL.yellow;
      if (this.chResult) {
        if (i === ch.q.answer) col = blink ? PAL.green : "#ffffff";
        else if (i === this.chResult.choice) col = PAL.red;
        else col = "#6a78b8";
      }
      g.fillStyle = "#000";
      g.fillRect(x, y, 10, 10);
      g.fillStyle = col;
      g.fillRect(x + 1, y + 1, 8, 8);
      drawText(g, String(i + 1), x + 4, y + 3, "#0a0f2e");
      if (!this.chResult && blink) {
        g.fillStyle = PAL.yellow;
        g.fillRect(x - 1, y - 1, 12, 1);
        g.fillRect(x - 1, y + 10, 12, 1);
      }
    });
  }

  private drawBoulders(g: CanvasRenderingContext2D) {
    for (const b of this.boulders) {
      let x = b.col * TILE;
      if (b.state === "wobble") x += Math.floor(this.time * 20) % 2 === 0 ? -1 : 1;
      if (b.state === "crumble") {
        g.globalAlpha = Math.max(0, b.t / 0.5);
        g.drawImage(this.sprites.boulder, x, Math.floor(b.y) + 2, 10, 8);
        g.globalAlpha = 1;
      } else g.drawImage(this.sprites.boulder, x, Math.floor(b.y));
    }
  }

  private drawCritters(g: CanvasRenderingContext2D) {
    for (const k of this.critters) {
      const x = Math.floor(k.x), y = Math.floor(k.y);
      const f = Math.abs(Math.floor(k.anim)) % 2;
      const face = k.dir[0] < 0 ? 1 : 0;
      const sheet = k.kind === "bug" ? this.sprites.bug : this.sprites.mag;
      if (k.state === "ghost") {
        if (Math.floor(this.time * 8) % 2 === 0) g.drawImage(this.sprites.eyes, x, y);
        continue;
      }
      if (k.state === "crushed") {
        g.drawImage(sheet[face][0], x, y + 4, 10, 5);
        continue;
      }
      if (k.state === "pop") continue;
      if (k.charge > 0 && Math.floor(this.time * 16) % 2 === 0) {
        g.globalAlpha = 0.5;
        g.drawImage(sheet[face][f], x, y);
        g.globalAlpha = 1;
      } else g.drawImage(sheet[face][f], x, y);
      if (k.state === "foam") {
        const rad = 4 + k.foam * 2;
        for (let a = 0; a < 16; a++) {
          const t = (a / 16) * Math.PI * 2 + this.time;
          const bx = Math.round(x + 5 + Math.cos(t) * rad), by = Math.round(y + 5 + Math.sin(t) * rad);
          g.fillStyle = a % 3 === 0 ? "#ffffff" : PAL.cyan;
          g.fillRect(bx, by, a % 2 ? 2 : 1, a % 2 ? 2 : 1);
        }
        g.globalAlpha = 0.25;
        g.fillStyle = PAL.cyan;
        g.fillRect(x + 5 - rad + 2, y + 5 - rad + 2, rad * 2 - 4, rad * 2 - 4);
        g.globalAlpha = 1;
      }
      for (const [c, r] of k.flame) {
        const fx = c * TILE, fy = r * TILE;
        for (let i = 0; i < 12; i++) {
          g.fillStyle = i % 3 === 0 ? PAL.yellow : i % 3 === 1 ? "#ff7a1a" : PAL.red;
          g.fillRect(fx + ((i * 7 + this.frame) % 10), fy + 2 + ((i * 3 + this.frame) % 6), 2, 2);
        }
      }
    }
  }

  private drawHero(g: CanvasRenderingContext2D) {
    if (this.mode === "dying") {
      if (Math.floor(this.time * 10) % 2 === 0) return;
    }
    if (this.invuln > 0 && Math.floor(this.time * 12) % 2 === 0) return;
    const face = this.hface < 0 ? 1 : 0;
    const f = Math.abs(Math.floor(this.hanim / 4)) % 2;
    g.drawImage(this.sprites.hero[face][f], Math.round(this.hx), Math.round(this.hy));
    // nozzle points up/down when aiming vertically
    if (this.hdir[1] !== 0) {
      g.fillStyle = "#9aa4c8";
      const nx = Math.round(this.hx) + 4;
      const ny = this.hdir[1] < 0 ? Math.round(this.hy) - 2 : Math.round(this.hy) + 9;
      g.fillRect(nx, ny, 2, 3);
    }
  }

  private drawJet(g: CanvasRenderingContext2D) {
    const j = this.jet;
    if (!j) return;
    const n = Math.max(2, Math.round(Math.hypot(j.x2 - j.x1, j.y2 - j.y1) / 3));
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      const x = j.x1 + (j.x2 - j.x1) * t + (Math.random() - 0.5) * 2;
      const y = j.y1 + (j.y2 - j.y1) * t + (Math.random() - 0.5) * 2;
      g.fillStyle = i % 2 ? PAL.cyan : "#ffffff";
      g.fillRect(Math.round(x) - 1, Math.round(y) - 1, 2, 2);
    }
  }

  /** Right-hand legend: every layer's real name (and its rock class for grades 3–5). */
  private drawLegend(g: CanvasRenderingContext2D) {
    g.fillStyle = "#070b26";
    g.fillRect(LEGEND_X, 0, W - LEGEND_X, H);
    g.fillStyle = "#1c2a78";
    g.fillRect(LEGEND_X, 0, 1, H);
    drawText(g, "LAYERS", LEGEND_X + 30, 3, PAL.sky, { align: "center" });
    if (this.data.site.notToScale) drawText(g, "NOT TO SCALE", LEGEND_X + 30, 11, "#6a78b8", { align: "center" });
    const showTag = this.g >= 3;
    for (const u of this.data.units) {
      if (u.kind !== "layer") continue;
      const y = u.top * TILE;
      const h = (u.bottom - u.top + 1) * TILE;
      g.fillStyle = u.rock.colors[0];
      g.fillRect(LEGEND_X + 2, y + 1, 3, h - 2);
      g.fillStyle = "#1c2a78";
      g.fillRect(LEGEND_X + 1, y, W - LEGEND_X - 1, 1);
      const lines = legendLines(u.label);
      lines.forEach((line, i) => drawText(g, line, LEGEND_X + 7, y + 3 + i * 7, "#f2f4ff"));
      const tagY = y + 4 + lines.length * 7;
      if (showTag && TYPE_TAGS[u.rock.type] && tagY + 5 <= y + h - 1) {
        if (this.revealed.has(u.index)) drawText(g, TYPE_TAGS[u.rock.type], LEGEND_X + 7, tagY, this.tagColor(u));
        else drawText(g, "???", LEGEND_X + 7, tagY, "#3a4680");
      }
    }
    const dike = this.data.units.find((u) => u.kind === "dike");
    if (dike) {
      g.fillStyle = dike.rock.colors[0];
      g.fillRect(LEGEND_X + 2, H - 9, 3, 7);
      drawText(g, "DIKE: BASALT", LEGEND_X + 7, H - 8, "#c8cce0");
    }
    if (this.mode === "demo") return;
    // hero depth marker
    const hy = Math.round(this.hy) + 3;
    g.fillStyle = PAL.red;
    g.fillRect(LEGEND_X + 1, hy, 2, 3);
  }

  private tagColor(u: Unit): string {
    switch (u.rock.type) {
      case "sedimentary": return "#ffd23f";
      case "igneous": return "#ff8a6a";
      case "metamorphic": return "#c8a8ff";
      case "soil": return "#8fdc7a";
      default: return "#9aa4c8";
    }
  }

  private drawBanner(g: CanvasRenderingContext2D) {
    const b = this.banner;
    if (!b) return;
    const lines = b.lines;
    const h = lines.length * 14 + 8;
    const y0 = 70 - h / 2;
    g.fillStyle = "rgba(10,15,46,0.82)";
    g.fillRect(10, y0, FIELD_W - 20, h);
    g.fillStyle = b.color;
    g.fillRect(10, y0, FIELD_W - 20, 1);
    g.fillRect(10, y0 + h - 1, FIELD_W - 20, 1);
    lines.forEach((line, i) => {
      const scale = measure(line, 2) <= FIELD_W - 30 ? 2 : 1;
      drawText(g, line, FIELD_W / 2, y0 + 6 + i * 14 + (scale === 1 ? 3 : 0), i === 0 ? b.color : "#f2f4ff", { scale, align: "center", shadow: "#000" });
    });
  }

  /* ------------------------------ test hooks ------------------------------ */

  /** Moves the hero to a tile (for automated playtests). */
  debugTeleport(c: number, r: number) {
    this.hx = c * TILE;
    this.hy = r * TILE;
    this.htx = c;
    this.hty = r;
    this.hmoving = false;
    if (!this.isDug(c, r)) {
      this.dug[idx(c, r)] = 1;
      digTile(this.groundCtx, this.data, c, r);
    }
  }

  /** Marks the goal complete (for automated playtests). */
  debugFinishGoal() {
    if (this.mode !== "play") return;
    this.have = this.data.goal.count;
    this.levelClear();
  }

  /** Starts a field challenge now (for automated playtests). */
  debugChallenge() {
    if (this.challenge) return;
    this.chCount = 0;
    this.chTimer = 999;
  }
}
