import type { ChipAudio, DealtQuestion } from "@/kit";
import { CENTER_X, DIRS, DIR_NAME, HATCH_W, ROSE, SIGNS, SIGN_TEXT_W, dealLetters, type Dir } from "./compass";
import type { MapChallenge, SignIcon } from "./data/maps";
import { dateLabel, dealGate, orderKey, type TimelineEvent, type TimelineSet } from "./data/timelines";
import { drawText, measure, wrapLabel } from "./font";
import {
  CROC_MOUTH, CROC_W, GROUND, H, HERO_H, HERO_W, LADDER_W, LOG_H, LOG_W, SCORP_H, SCORP_W, SNAKE_H, SNAKE_W, TREASURE_W, W,
  bandOf, physFor, type Band, type Phys,
} from "./physics";
import {
  LOG_LOOP, crocOpenAt, mulberry32, planScene, vineAngle, vineTip,
  type Patrol, type Scene, type Treasure, type TreasureKind,
} from "./scenes";
import { HERO_SPRITE_H, HERO_SPRITE_W, PALETTE, getSprites } from "./sprites";

export { W, H };

export type Action = "left" | "right" | "up" | "down" | "jump";

export interface HudState {
  score: number;
  lives: number;
  /** Seconds left on the expedition clock. */
  time: number;
  /** Scenes explored (1-based index of the furthest scene reached). */
  scene: number;
  leg: number;
  treasures: number;
}

export const TREASURE_NAMES: Record<TreasureKind, string> = {
  map: "OLD MAP", compass: "BRASS COMPASS", coin: "OLD COIN", flag: "FLAG", ballot: "BALLOT BOX", vase: "CLAY ARTIFACT",
};

export interface SignView {
  label: string;
  icon?: SignIcon;
}

export type Challenge =
  | { type: "treasure" | "camp"; q: DealtQuestion; treasure: TreasureKind | null; picked: number | null; correct: boolean | null; bonus: number }
  | {
      type: "map";
      ch: MapChallenge;
      /** letters[i] = the exit that letter i (A–D) marks. */
      letters: Dir[];
      signs: Record<Dir, SignView> | null;
      answer: Dir;
      picked: Dir | null;
      correct: boolean | null;
      bonus: number;
    }
  | {
      type: "gate";
      set: TimelineSet;
      /** Events on the tablets, left to right. */
      events: TimelineEvent[];
      /** Tablet indexes in the order they were opened. */
      opened: number[];
      wrong: number | null;
      correct: boolean | null;
      bonus: number;
    };

export interface SceneInfo {
  index: number;
  leg: number;
  kind: Scene["kind"] | "tunnel";
  hint: string;
  treasure: boolean;
}

export interface EngineCallbacks {
  onHud(h: HudState): void;
  onScene(info: SceneInfo): void;
  onChallenge(c: Challenge | null): void;
  requestQuestion(): DealtQuestion;
  requestMap(): MapChallenge;
  requestTimeline(): TimelineSet;
  onHurt(msg: string): void;
  onGameOver(reason: "time" | "lives"): void;
}

export interface GameSettings {
  /** 0 for K, 1–12 otherwise. */
  grade: number;
  seed?: number;
}

type HeroState = "ground" | "air" | "vine" | "dying" | "frozen";
interface Hero {
  x: number;
  y: number;
  vx: number;
  vy: number;
  state: HeroState;
  face: 1 | -1;
  anim: number;
  invuln: number;
  stun: number;
  regrab: number;
  grabSide: number;
  dieT: number;
  dieMsg: string;
}
interface Mover { x: number; dir: 1 | -1; p: Patrol }
interface Popup { x: number; y: number; text: string; color: string; t: number }

export const TABLET_W = 60;
export const TABLET_H = 44;
export const TABLET_TEXT_W = 56;
export const TABLET_XS = [14, 84, 154, 224];
const TABLET_Y = GROUND - TABLET_H;
const GATE_X = 292;
const TUNNEL_EXIT_X = 288;
const CAMP_TRIGGER_X = 150;
const START_TIME: Record<Band, number> = { 0: 420, 1: 360, 2: 330, 3: 300 };
const LIVES: Record<Band, number> = { 0: 5, 1: 4, 2: 3, 3: 3 };

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
function hash(n: number) {
  const s = Math.sin(n * 127.1 + 11.7) * 43758.5453;
  return s - Math.floor(s);
}

export class JungleEngine {
  private ctx: CanvasRenderingContext2D;
  private sprites = getSprites();
  private raf = 0;
  private last = 0;
  private hudT = 0;
  time = 0;

  demoMode = true;
  paused = false;
  over = false;
  private keys = new Set<Action>();
  private jumpQueued = false;
  private upQueued = false;
  private downQueued = false;

  band: Band = 1;
  phys: Phys = physFor(1);
  private seed = 1;
  score = 0;
  lives = 3;
  clock = 360;
  treasures = 0;
  furthest = 0;

  private scenes = new Map<number, Scene>();
  scene!: Scene;
  underground = false;
  private entrySide: "left" | "right" = "left";
  private taken = new Set<string>();
  private done = new Set<number>();
  private logs: number[] = [];
  private movers: Mover[] = [];
  hero: Hero = this.freshHero(20);
  challenge: Challenge | null = null;
  private popups: Popup[] = [];
  private flashT = 0;

  constructor(canvas: HTMLCanvasElement, private audio: ChipAudio, private cb: EngineCallbacks) {
    canvas.width = W;
    canvas.height = H;
    this.ctx = canvas.getContext("2d")!;
    this.ctx.imageSmoothingEnabled = false;
  }

  /* ------------------------------------------------------------------ lifecycle */

  start() {
    this.last = performance.now();
    const loop = (now: number) => {
      const dt = Math.max(0, Math.min(0.05, (now - this.last) / 1000));
      this.last = now;
      if (!this.paused) this.update(dt);
      this.draw();
      this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
  }

  stop() {
    cancelAnimationFrame(this.raf);
  }

  /** Attract mode behind the title screen: a vine scene with nobody in charge. */
  demo() {
    this.demoMode = true;
    this.over = false;
    this.paused = false;
    this.setBand(4);
    this.seed = 7;
    this.scenes.clear();
    this.challenge = null;
    this.enterScene(1, "left");
    this.hero.state = "frozen";
    this.hero.x = 16;
  }

  newGame(s: GameSettings) {
    this.demoMode = false;
    this.over = false;
    this.paused = false;
    this.setBand(s.grade);
    this.seed = s.seed ?? Math.floor(Math.random() * 1e9);
    this.scenes.clear();
    this.taken.clear();
    this.done.clear();
    this.score = 0;
    this.treasures = 0;
    this.lives = LIVES[this.band];
    this.clock = START_TIME[this.band];
    this.furthest = 0;
    this.challenge = null;
    this.popups = [];
    this.keys.clear();
    this.cb.onChallenge(null);
    this.enterScene(0, "left");
    this.pushHud();
  }

  private setBand(grade: number) {
    this.band = bandOf(grade);
    this.phys = physFor(this.band);
  }

  togglePause(force?: boolean): boolean {
    if (this.demoMode || this.over) return false;
    this.paused = force ?? !this.paused;
    if (this.paused) this.keys.clear();
    return this.paused;
  }

  setKey(a: Action, down: boolean) {
    if (down && !this.keys.has(a)) {
      if (a === "jump") this.jumpQueued = true;
      if (a === "up") this.upQueued = true;
      if (a === "down") this.downQueued = true;
    }
    if (down) this.keys.add(a);
    else this.keys.delete(a);
  }

  releaseAllKeys() {
    this.keys.clear();
  }

  /* ------------------------------------------------------------------ scenes */

  private getScene(i: number): Scene {
    let s = this.scenes.get(i);
    if (!s) {
      s = planScene(i, this.band, this.phys, mulberry32(this.seed * 7919 + i * 104729));
      this.scenes.set(i, s);
    }
    return s;
  }

  private freshHero(x: number): Hero {
    return { x, y: GROUND, vx: 0, vy: 0, state: "ground", face: 1, anim: 0, invuln: 0, stun: 0, regrab: 0, grabSide: 0, dieT: 0, dieMsg: "" };
  }

  /** Test/debug hook: jump straight to a scene. */
  goTo(i: number) {
    this.challenge = null;
    this.cb.onChallenge(null);
    this.enterScene(Math.max(0, i), "left");
  }

  private enterScene(i: number, side: "left" | "right") {
    this.scene = this.getScene(i);
    this.underground = false;
    this.entrySide = side;
    const firstVisit = i > this.furthest;
    if (firstVisit && !this.demoMode) {
      this.score += 20;
      this.furthest = i;
    }
    this.hero = this.freshHero(side === "left" ? 4 : W - HERO_W - 4);
    this.hero.face = side === "left" ? 1 : -1;
    this.hero.invuln = 0.8;
    this.resetCritters();
    const s = this.scene;
    if (!this.demoMode && !this.done.has(i)) {
      if (s.kind === "crossroads") {
        this.hero.x = 96;
        this.openMap();
      } else if (s.kind === "gate") {
        this.openGate();
      }
    }
    this.announce();
  }

  private enterTunnel() {
    const s = this.scene;
    if (!s.tunnel) return;
    this.underground = true;
    this.hero = this.freshHero((s.ladderX ?? 152) + 3);
    this.hero.state = "air";
    this.hero.y = 70;
    this.hero.invuln = 1;
    this.resetCritters();
    this.audio.blip();
    this.announce();
  }

  private resetCritters() {
    const s = this.scene;
    this.logs = [];
    if (!this.underground && s.logs.count > 0) {
      const spacing = LOG_LOOP / s.logs.count;
      for (let i = 0; i < s.logs.count; i++) this.logs.push(210 + i * spacing);
    }
    const patrols = this.underground ? s.tunnel?.scorpions ?? [] : s.scorpions;
    this.movers = patrols.map((p, i) => ({ x: i % 2 ? p.a : p.b, dir: i % 2 ? 1 : -1, p }));
  }

  sceneInfo(): SceneInfo {
    const s = this.scene;
    const kind = this.underground ? "tunnel" : s.kind;
    const t = this.currentTreasure();
    const k2 = this.band === 0;
    const hints: Record<SceneInfo["kind"], string> = {
      meadow: "A quiet clearing in the jungle. Walk on to explore!",
      logs: k2 ? "Rolling logs! Press JUMP to hop over each one." : "Rolling logs! JUMP over them. A bump costs time and points.",
      vine: k2
        ? "Tar pit! JUMP to grab the vine. It lets go for you over the far side."
        : "Tar pit! JUMP to grab the swinging vine, then JUMP again to let go over solid ground.",
      swamp: k2
        ? "Swamp snappers! Hop from back to back. They are sleepy, but stay off their jaws!"
        : "Swamp snappers! Hop across their backs. Don't stand on the jaws when they open!",
      snake: k2 ? "A sleepy coil snake. JUMP over it!" : "Coil snakes! JUMP over them. One bite costs a life.",
      scorpion: k2 ? "A slow sting-crab. JUMP over it!" : "Sting-crabs scuttle back and forth. Time your JUMP!",
      hole: "A hole in the trail! Take a running JUMP.",
      ladder: "A ladder down! Press ▼ on the hole for a tunnel shortcut that skips 2 scenes, or JUMP over it.",
      tunnel: "Tunnel shortcut! Reach the ladder on the right and press ▲ to climb out 2 scenes ahead.",
      crossroads: "Jungle crossroads: pick an exit.",
      gate: "Timeline gate: open the tablets from earliest to latest.",
      camp: this.done.has(s.index) ? "Base camp. Walk on to start the next leg!" : "Base camp! Walk to the radio for a message.",
    };
    let hint = hints[kind];
    if (t) hint += " Touch the treasure to open a question!";
    return { index: s.index, leg: s.leg + 1, kind, hint, treasure: !!t };
  }

  private announce() {
    if (!this.demoMode) this.cb.onScene(this.sceneInfo());
  }

  private treasureKey(): string {
    return `${this.scene.index}${this.underground ? "u" : ""}`;
  }

  currentTreasure(): Treasure | null {
    const t = this.underground ? this.scene.tunnel?.treasure ?? null : this.scene.treasure;
    return t && !this.taken.has(this.treasureKey()) ? t : null;
  }

  /* ------------------------------------------------------------------ challenges */

  private openMap() {
    const ch = this.cb.requestMap();
    const letters = dealLetters();
    let signs: Record<Dir, SignView> | null = null;
    let answer: Dir = ch.answer ?? "E";
    if (ch.kind === "sign" && ch.signs) {
      const order = dealLetters(); // random exits for the four signs
      signs = {} as Record<Dir, SignView>;
      order.forEach((d, i) => {
        signs![d] = { label: ch.signs![i], icon: ch.icons?.[i] };
      });
      answer = order[0];
    }
    this.challenge = { type: "map", ch, letters, signs, answer, picked: null, correct: null, bonus: 0 };
    this.audio.checkpoint();
    this.emitChallenge();
  }

  private openGate() {
    const set = this.cb.requestTimeline();
    this.challenge = { type: "gate", set, events: dealGate(set), opened: [], wrong: null, correct: null, bonus: 0 };
    this.audio.checkpoint();
    this.emitChallenge();
  }

  private openQuestion(type: "treasure" | "camp", treasure: TreasureKind | null) {
    const q = this.cb.requestQuestion();
    this.challenge = { type, q, treasure, picked: null, correct: null, bonus: 0 };
    this.keys.clear();
    this.hero.vx = 0;
    this.audio.checkpoint();
    this.emitChallenge();
  }

  private emitChallenge() {
    const c = this.challenge;
    this.cb.onChallenge(c ? (JSON.parse(JSON.stringify(c)) as Challenge) : null);
  }

  /** True while the world is frozen for a question (treasure / camp, or any answered challenge). */
  private frozen(): boolean {
    const c = this.challenge;
    if (!c) return false;
    if (c.type === "treasure" || c.type === "camp") return true;
    return c.correct !== null;
  }

  /** A–D / 1–4, or a tapped answer. */
  answer(i: number) {
    const c = this.challenge;
    if (!c || this.paused || this.over || i < 0 || i > 3) return;
    if (c.type === "map") this.chooseExit(c.letters[i]);
    else if (c.type === "gate") this.openTablet(i);
    else if (c.picked === null) {
      c.picked = i;
      c.correct = i === c.q.answer;
      if (c.correct) {
        c.bonus = c.type === "camp" ? 400 : 250 + 50 * this.scene.leg;
        this.score += c.bonus;
        this.clock += c.type === "camp" ? 30 : 10;
        if (c.type === "treasure") this.treasures++;
        this.audio.correct();
        this.popup(this.hero.x, this.hero.y - 26, `+${c.bonus}`, PALETTE.yellow);
      } else {
        this.audio.wrong();
        if (c.type === "treasure") this.popup(this.hero.x, this.hero.y - 26, "CRUMBLED", PALETTE.red);
      }
      if (c.type === "treasure") this.taken.add(this.treasureKey());
      this.emitChallenge();
      this.pushHud();
    }
  }

  chooseExit(d: Dir) {
    const c = this.challenge;
    if (!c || c.type !== "map" || c.picked !== null) return;
    c.picked = d;
    c.correct = d === c.answer;
    this.hero.state = "frozen";
    this.hero.vx = 0;
    if (c.correct) {
      c.bonus = 300;
      this.score += c.bonus;
      this.clock += 15;
      this.audio.correct();
    } else this.audio.wrong();
    this.emitChallenge();
    this.pushHud();
  }

  openTablet(i: number) {
    const c = this.challenge;
    if (!c || c.type !== "gate" || c.correct !== null || c.opened.includes(i)) return;
    const remaining = c.events.map((e, j) => ({ e, j })).filter(({ j }) => !c.opened.includes(j));
    const earliest = remaining.reduce((a, b) => (orderKey(b.e) < orderKey(a.e) ? b : a));
    if (earliest.j === i) {
      c.opened.push(i);
      this.score += 125;
      c.bonus += 125;
      this.audio.blip();
      if (c.opened.length === 4) {
        c.correct = true;
        this.clock += 20;
        this.audio.correct();
      }
    } else {
      c.wrong = i;
      c.correct = false;
      this.audio.wrong();
    }
    if (c.correct !== null) {
      this.hero.state = "frozen";
      this.hero.vx = 0;
    }
    this.emitChallenge();
    this.pushHud();
  }

  /** Continue after an answered challenge. */
  continue() {
    const c = this.challenge;
    if (!c || this.paused) return;
    const answered = c.type === "gate" ? c.correct !== null : c.type === "map" ? c.picked !== null : c.picked !== null;
    if (!answered) return;
    this.challenge = null;
    this.cb.onChallenge(null);
    if (c.type === "map") {
      this.done.add(this.scene.index);
      this.enterScene(this.scene.index + 1, "left");
    } else if (c.type === "gate" || c.type === "camp") {
      this.done.add(this.scene.index);
      if (this.hero.state === "frozen") this.hero.state = "ground";
      if (c.type === "camp") {
        this.audio.levelUp();
        this.popup(150, 70, `LEG ${this.scene.leg + 1} COMPLETE!`, PALETTE.yellow);
      }
      this.announce();
    } else {
      this.announce();
    }
    this.keys.clear();
    this.pushHud();
  }

  /* ------------------------------------------------------------------ taps */

  /** Tap/click on the canvas at logical (x, y). Returns true when it did something. */
  tap(x: number, y: number): boolean {
    const c = this.challenge;
    if (!c || this.paused) return false;
    if (c.type === "map" && c.picked === null) {
      for (const d of DIRS) {
        const r = SIGNS[d];
        if (x >= r.x - 4 && x <= r.x + r.w + 4 && y >= r.y - 4 && y <= r.y + r.h + 4) {
          this.chooseExit(d);
          return true;
        }
      }
      if (x < 30 && y > 60) return this.chooseExit("W"), true;
      if (x > W - 30 && y > 60) return this.chooseExit("E"), true;
      if (Math.abs(x - CENTER_X) < 14 && y < ROSE.y - ROSE.r) return this.chooseExit("N"), true;
      if (Math.abs(x - CENTER_X) < 14 && y > GROUND - 4) return this.chooseExit("S"), true;
    }
    if (c.type === "gate" && c.correct === null) {
      for (let i = 0; i < 4; i++) {
        const tx = TABLET_XS[i];
        if (x >= tx && x <= tx + TABLET_W && y >= TABLET_Y - 6 && y <= GROUND + 4) {
          this.openTablet(i);
          return true;
        }
      }
    }
    return false;
  }

  /* ------------------------------------------------------------------ update */

  private update(dt: number) {
    this.time += dt;
    this.flashT += dt;
    for (const p of this.popups) p.t -= dt;
    this.popups = this.popups.filter((p) => p.t > 0);
    if (this.over) return;

    const frozen = this.frozen();
    if (!frozen) this.updateCritters(dt);
    if (this.demoMode) return;

    if (!this.challenge && this.hero.state !== "dying") {
      this.clock -= dt;
      if (this.clock <= 0) {
        this.clock = 0;
        this.endGame("time");
        return;
      }
    }
    if (!frozen) this.updateHero(dt);
    this.jumpQueued = this.upQueued = this.downQueued = false;

    this.hudT -= dt;
    if (this.hudT <= 0) {
      this.hudT = 0.2;
      this.pushHud();
    }
  }

  private updateCritters(dt: number) {
    const s = this.scene;
    for (let i = 0; i < this.logs.length; i++) {
      this.logs[i] -= s.logs.speed * dt;
      if (this.logs[i] < -LOG_W - 30) this.logs[i] += LOG_LOOP;
    }
    for (const m of this.movers) {
      m.x += m.dir * m.p.speed * dt;
      if (m.x < m.p.a) { m.x = m.p.a; m.dir = 1; }
      if (m.x > m.p.b) { m.x = m.p.b; m.dir = -1; }
    }
  }

  private supportAt(cx: number): "ground" | "croc" | "pit" | "ladder" | null {
    if (this.underground) return "ground";
    const s = this.scene;
    if (s.pit && cx > s.pit.l && cx < s.pit.r) {
      if (s.pit.fill === "water") for (const c of s.crocs) if (cx >= c.x && cx <= c.x + CROC_W) return "croc";
      return "pit";
    }
    if (s.ladderX !== null && cx > s.ladderX && cx < s.ladderX + LADDER_W) return "ladder";
    return "ground";
  }

  private updateHero(dt: number) {
    const h = this.hero;
    const p = this.phys;
    const s = this.scene;
    if (h.invuln > 0) h.invuln -= dt;
    if (h.regrab > 0) h.regrab -= dt;

    if (h.state === "dying") {
      h.dieT -= dt;
      if (h.dieT <= 0) this.afterDeath();
      return;
    }
    if (h.state === "frozen") return;

    const input = h.stun > 0 ? 0 : (this.keys.has("right") ? 1 : 0) - (this.keys.has("left") ? 1 : 0);
    if (h.stun > 0) h.stun -= dt;
    if (input !== 0) h.face = input > 0 ? 1 : -1;
    const cx = () => h.x + HERO_W / 2;

    if (h.state === "vine") {
      const v = s.vine!;
      const a = vineAngle(v, this.time);
      const tip = vineTip(v, a);
      const prev = vineTip(v, vineAngle(v, this.time - 0.02));
      h.x = tip.x - HERO_W / 2;
      h.y = tip.y - 2 + HERO_H;
      const autoDrop = this.band === 0 && Math.abs(a) > v.amp * 0.97 && Math.sign(a) === -h.grabSide;
      if (this.jumpQueued || this.downQueued || autoDrop) {
        h.state = "air";
        h.vx = autoDrop ? 0 : clamp((tip.x - prev.x) / 0.02, -p.airRun, p.airRun);
        h.vy = autoDrop ? 0 : Math.min(0, (tip.y - prev.y) / 0.02) - 40;
        h.regrab = 0.5;
        this.audio.jump();
      }
      return;
    }

    if (h.state === "ground") {
      h.vx = input * p.run;
      if (h.vx !== 0) h.anim += dt * 10;
      const sup = this.supportAt(cx());
      // South exit at the crossroads / tunnel entrance / tablets / tunnel exit.
      if (this.downQueued) {
        if (sup === "ladder" && s.tunnel) return this.enterTunnel();
        const c = this.challenge;
        if (c?.type === "map" && c.picked === null && Math.abs(cx() - CENTER_X) <= HATCH_W / 2 + 3) return this.chooseExit("S");
      }
      if (this.upQueued) {
        const c = this.challenge;
        if (c?.type === "map" && c.picked === null && Math.abs(cx() - CENTER_X) <= 10) return this.chooseExit("N");
        if (c?.type === "gate" && c.correct === null) {
          const i = TABLET_XS.findIndex((tx) => cx() >= tx && cx() <= tx + TABLET_W);
          if (i >= 0) return this.openTablet(i);
        }
        if (this.underground && Math.abs(cx() - (TUNNEL_EXIT_X + 8)) <= 12 && s.tunnel) {
          this.audio.blip();
          return this.enterScene(s.tunnel.exitTo, "left");
        }
      }
      if (this.jumpQueued) {
        h.state = "air";
        h.vy = -p.jumpV;
        this.audio.jump();
      }
    } else if (h.state === "air") {
      h.vx = input * p.airRun;
      h.vy += p.gravity * dt;
    }

    h.x += h.vx * dt;
    if (h.state === "air") h.y += h.vy * dt;

    // Walls: tunnel ends, gate, first scene's left edge.
    if (this.underground) h.x = clamp(h.x, 10, W - 10 - HERO_W);
    if (!this.underground && s.kind === "gate" && !this.done.has(s.index)) h.x = Math.min(h.x, GATE_X - HERO_W);
    if (s.index === 0 && !this.underground) h.x = Math.max(h.x, 0);

    const sup = this.supportAt(cx());
    if (h.state === "ground" && sup !== "ground" && sup !== "croc") {
      h.state = "air";
      h.vy = 0;
    }
    if (h.state === "air") {
      // Grab the vine.
      if (s.vine && !this.underground && h.regrab <= 0) {
        const tip = vineTip(s.vine, vineAngle(s.vine, this.time));
        const top = h.y - HERO_H;
        if (Math.abs(cx() - tip.x) <= 8 && top >= tip.y - 12 && top <= tip.y + 8) {
          h.state = "vine";
          h.grabSide = Math.sign(cx() - s.vine.px) || -1;
          h.vx = h.vy = 0;
          this.audio.blip();
          return;
        }
      }
      if (h.vy >= 0 && h.y >= GROUND && (sup === "ground" || sup === "croc") && h.y - h.vy * dt <= GROUND + 1) {
        h.y = GROUND;
        h.vy = 0;
        h.state = "ground";
      } else if (h.y > GROUND + 10) {
        if (sup === "ladder" && s.tunnel) return this.enterTunnel();
        // Inside a pit: can't slide out through its walls.
        if (s.pit) h.x = clamp(h.x, s.pit.l - HERO_W / 2 + 1, s.pit.r - HERO_W / 2 - 1);
        if (h.y > GROUND + 18) {
          const what = s.pit?.fill === "water" ? "You fell in the swamp!" : s.pit?.fill === "tar" ? "You sank in the tar pit!" : "You fell down a hole!";
          return this.die(what);
        }
      }
    }

    // Screen edges.
    const c = this.challenge;
    if (!this.underground) {
      if (cx() > W) {
        if (c?.type === "map" && c.picked === null) {
          h.x = W - HERO_W;
          return this.chooseExit("E");
        }
        return this.enterScene(s.index + 1, "left");
      }
      if (cx() < 0) {
        if (c?.type === "map" && c.picked === null) {
          h.x = 0;
          return this.chooseExit("W");
        }
        if (s.index > 0) {
          if (c) {
            this.challenge = null;
            this.cb.onChallenge(null);
          }
          return this.enterScene(s.index - 1, "right");
        }
      }
    }

    // Camp radio.
    if (!this.underground && s.kind === "camp" && !this.done.has(s.index) && !c && cx() >= CAMP_TRIGGER_X) {
      h.vx = 0;
      return this.openQuestion("camp", null);
    }

    this.collide();
  }

  private boxHit(ax: number, aw: number, top: number, bottom: number): boolean {
    const h = this.hero;
    return h.x + 2 < ax + aw && h.x + HERO_W - 2 > ax && h.y - HERO_H + 3 < bottom && h.y > top + 2;
  }

  private collide() {
    const h = this.hero;
    const s = this.scene;
    // Treasure.
    const t = this.currentTreasure();
    if (t && !this.challenge && h.state !== "dying" && this.boxHit(t.x, TREASURE_W, GROUND - 10, GROUND)) {
      return this.openQuestion("treasure", t.kind);
    }
    if (h.invuln > 0) return;
    for (const lx of this.logs) {
      if (this.boxHit(lx, LOG_W, GROUND - LOG_H, GROUND)) return this.bump("A rolling log knocked you back! −2 seconds.");
    }
    if (!this.underground) {
      for (const sx of s.snakes) {
        if (this.boxHit(sx + 1, SNAKE_W - 2, GROUND - SNAKE_H, GROUND)) {
          return this.band === 0 ? this.bump("The sleepy snake nudged you back.") : this.die("A coil snake bit you!");
        }
      }
      if (h.state === "ground" && this.supportAt(h.x + HERO_W / 2) === "croc") {
        const cx = h.x + HERO_W / 2;
        for (const c of s.crocs) {
          if (cx >= c.x && cx <= c.x + CROC_MOUTH + 1 && crocOpenAt(s, c, this.time)) return this.die("A swamp snapper snapped at you!");
        }
      }
    }
    for (const m of this.movers) {
      if (this.boxHit(m.x + 1, SCORP_W - 2, GROUND - SCORP_H, GROUND)) {
        return this.band === 0 ? this.bump("The sting-crab pinched you back.") : this.die("A sting-crab stung you!");
      }
    }
  }

  private bump(msg: string) {
    const h = this.hero;
    h.state = "air";
    h.vy = -120;
    h.stun = 0.45;
    h.invuln = 1.3;
    h.x = clamp(h.x - h.face * 10, 0, W - HERO_W);
    this.clock = Math.max(1, this.clock - 2);
    this.score = Math.max(0, this.score - 25);
    this.audio.wrong();
    this.popup(h.x, h.y - 24, "−2s", PALETTE.red);
    this.cb.onHurt(msg);
    this.pushHud();
  }

  private die(msg: string) {
    const h = this.hero;
    if (h.state === "dying") return;
    h.state = "dying";
    h.dieT = 1.3;
    h.dieMsg = msg;
    h.vx = 0;
    this.audio.crash();
    this.cb.onHurt(msg);
  }

  private afterDeath() {
    this.lives--;
    this.pushHud();
    if (this.lives <= 0) return this.endGame("lives");
    if (this.underground) {
      this.hero = this.freshHero(40);
    } else {
      this.hero = this.freshHero(this.entrySide === "left" ? 4 : W - HERO_W - 4);
      this.hero.face = this.entrySide === "left" ? 1 : -1;
    }
    this.hero.invuln = 1.5;
    this.resetCritters();
  }

  private endGame(reason: "time" | "lives") {
    if (this.over) return;
    this.over = true;
    this.challenge = null;
    this.cb.onChallenge(null);
    this.audio.gameOver();
    this.pushHud();
    this.cb.onGameOver(reason);
  }

  private popup(x: number, y: number, text: string, color: string) {
    this.popups.push({ x, y, text, color, t: 1.4 });
  }

  pushHud() {
    this.cb.onHud({
      score: this.score, lives: this.lives, time: Math.ceil(this.clock), scene: this.furthest + 1,
      leg: Math.floor(this.furthest / 10) + 1, treasures: this.treasures,
    });
  }

  /* ------------------------------------------------------------------ drawing */

  private draw() {
    const g = this.ctx;
    const s = this.scene;
    if (!s) return;
    if (this.underground) this.drawTunnel();
    else this.drawJungle();

    if (!this.underground) {
      if (s.kind === "crossroads") this.drawCrossroads();
      if (s.kind === "gate") this.drawGate();
      if (s.kind === "camp") this.drawCamp();
      this.drawPit();
      this.drawLadderHole();
      for (const sx of s.snakes) g.drawImage(this.sprites.snake[Math.floor(this.time * 2 + sx) % 2], sx, GROUND - SNAKE_H);
      for (const lx of this.logs) this.drawLog(lx);
    }
    for (const m of this.movers) this.drawScorp(m);
    const t = this.currentTreasure();
    if (t) {
      const bob = Math.round(Math.sin(this.time * 4) * 1.5);
      if (Math.floor(this.time * 3) % 2) {
        g.fillStyle = "rgba(255,210,63,0.25)";
        g.fillRect(t.x - 2, GROUND - 13 + bob, TREASURE_W + 4, 13);
      }
      g.drawImage(this.sprites.treasure[t.kind], t.x, GROUND - 10 + bob);
    }
    if (s.vine && !this.underground) this.drawVine();
    this.drawHero();

    for (const p of this.popups) {
      drawText(g, p.text, p.x + 5, p.y - (1.4 - p.t) * 12, p.color, { align: "center", shadow: "#000" });
    }
    const label = this.underground ? `TUNNEL · SCENE ${s.index + 1}` : `LEG ${s.leg + 1} · SCENE ${s.index + 1}`;
    g.fillStyle = "rgba(5,6,15,0.55)";
    g.fillRect(2, 2, measure(label) + 6, 9);
    drawText(g, label, 5, 4, PALETTE.white);
    if (!this.demoMode && this.clock < 30 && !this.over && Math.floor(this.time * 3) % 2) {
      drawText(g, "HURRY!", W - 4, 4, PALETTE.red, { align: "right", shadow: "#000" });
    }
  }

  private drawJungle() {
    const g = this.ctx;
    const s = this.scene;
    const seed = s.index * 13 + 5;
    // Far jungle
    g.fillStyle = PALETTE.jungleBack;
    g.fillRect(0, 0, W, GROUND);
    g.fillStyle = PALETTE.jungleFar;
    for (let i = 0; i < 12; i++) {
      const x = Math.floor(hash(seed + i) * W);
      const w = 14 + Math.floor(hash(seed + i + 40) * 20);
      g.fillRect(x, 40 + Math.floor(hash(seed + i + 80) * 30), w, GROUND);
    }
    // Trunks
    for (let i = 0; i < 5; i++) {
      const x = Math.floor(20 + i * 64 + (hash(seed + i * 3) - 0.5) * 30);
      const w = 8 + Math.floor(hash(seed + i * 7) * 6);
      g.fillStyle = PALETTE.trunkDark;
      g.fillRect(x, 20, w, GROUND - 20);
      g.fillStyle = PALETTE.trunk;
      g.fillRect(x + 1, 20, w - 3, GROUND - 20);
      g.fillStyle = PALETTE.trunkDark;
      for (let y = 30; y < GROUND; y += 11) g.fillRect(x + 2 + ((y / 11) % 2), y, 2, 1);
    }
    // Canopy
    g.fillStyle = PALETTE.leafDark;
    g.fillRect(0, 0, W, 22);
    for (let i = 0; i < 40; i++) {
      const x = Math.floor(hash(seed + i * 5) * W);
      const y = 8 + Math.floor(hash(seed + i * 9) * 26);
      const r = 5 + Math.floor(hash(seed + i * 11) * 7);
      g.fillStyle = i % 3 === 0 ? PALETTE.leafLight : i % 3 === 1 ? PALETTE.leaf : PALETTE.leafDark;
      g.fillRect(x - r, y - r / 2, r * 2, r);
    }
    for (let i = 0; i < 20; i++) {
      g.fillStyle = PALETTE.leafBright;
      g.fillRect(Math.floor(hash(seed + i * 17) * W), 6 + Math.floor(hash(seed + i * 19) * 28), 2, 1);
    }
    // Ground: path and earth below
    g.fillStyle = PALETTE.path;
    g.fillRect(0, GROUND, W, 6);
    g.fillStyle = PALETTE.pathDark;
    for (let x = (seed * 7) % 9; x < W; x += 9) g.fillRect(x, GROUND + 2 + (x % 3), 2, 1);
    g.fillStyle = PALETTE.dirt;
    g.fillRect(0, GROUND + 6, W, H - GROUND - 6);
    g.fillStyle = PALETTE.dirtDark;
    for (let i = 0; i < 30; i++) g.fillRect(Math.floor(hash(seed + i * 23) * W), GROUND + 10 + Math.floor(hash(seed + i * 29) * 36), 3, 1);
    // Grass tufts
    g.fillStyle = PALETTE.leafLight;
    for (let x = (seed * 3) % 23; x < W; x += 23) {
      g.fillRect(x, GROUND - 2, 1, 2);
      g.fillRect(x + 2, GROUND - 3, 1, 3);
      g.fillRect(x + 4, GROUND - 2, 1, 2);
    }
  }

  private drawTunnel() {
    const g = this.ctx;
    g.fillStyle = "#1a1210";
    g.fillRect(0, 0, W, H);
    // Brick walls and ceiling
    for (let y = 0; y < 60; y += 6) {
      for (let x = (y / 6) % 2 ? -8 : 0; x < W; x += 16) {
        g.fillStyle = (x + y) % 32 === 0 ? "#6b4a36" : "#5a3d2c";
        g.fillRect(x + 1, y + 1, 14, 4);
      }
    }
    g.fillStyle = "#2a1c16";
    g.fillRect(0, 60, W, GROUND - 60);
    for (const wx of [0, W - 10]) {
      for (let y = 60; y < GROUND; y += 6) {
        g.fillStyle = "#5a3d2c";
        g.fillRect(wx + 1, y + 1, 8, 4);
      }
    }
    // Torches
    for (const tx of [70, 230]) {
      g.fillStyle = PALETTE.trunk;
      g.fillRect(tx, 82, 2, 10);
      g.fillStyle = Math.floor(this.time * 8) % 2 ? PALETTE.yellow : PALETTE.red;
      g.fillRect(tx - 1, 78, 4, 4);
      g.fillStyle = "rgba(255,170,60,0.05)";
      for (const r of [8, 14, 20]) g.fillRect(tx + 1 - r, 80 - r, r * 2, r * 2);
    }
    g.fillStyle = PALETTE.dirt;
    g.fillRect(0, GROUND, W, H - GROUND);
    g.fillStyle = PALETTE.dirtDark;
    for (let x = 3; x < W; x += 11) g.fillRect(x, GROUND + 3, 4, 1);
    // Entry shaft and exit ladder
    this.drawLadder((this.scene.ladderX ?? 152), 0, 60);
    this.drawLadder(TUNNEL_EXIT_X, 0, GROUND);
    if (Math.floor(this.time * 2) % 2) drawText(g, "▲ EXIT", TUNNEL_EXIT_X + 8, GROUND - 60, PALETTE.yellow, { align: "center", shadow: "#000" });
  }

  private drawLadder(x: number, top: number, bottom: number) {
    const g = this.ctx;
    g.fillStyle = PALETTE.rope;
    g.fillRect(x + 1, top, 2, bottom - top);
    g.fillRect(x + LADDER_W - 3, top, 2, bottom - top);
    for (let y = top + 3; y < bottom; y += 6) g.fillRect(x + 1, y, LADDER_W - 2, 1);
  }

  private drawPit() {
    const s = this.scene;
    if (!s.pit) return;
    const g = this.ctx;
    const { l, r, fill } = s.pit;
    g.fillStyle = PALETTE.dirtDark;
    g.fillRect(l, GROUND, r - l, H - GROUND);
    if (fill === "hole") {
      g.fillStyle = "#05060f";
      g.fillRect(l + 2, GROUND, r - l - 4, 40);
      return;
    }
    const surf = GROUND + 6;
    g.fillStyle = fill === "tar" ? PALETTE.tar : PALETTE.water;
    g.fillRect(l, surf, r - l, 30);
    g.fillStyle = fill === "tar" ? PALETTE.tarShine : PALETTE.waterLight;
    for (let x = l + ((Math.floor(this.time * 6) % 8)); x < r - 3; x += 8) g.fillRect(x, surf + 1, 3, 1);
    if (fill === "tar") {
      const bx = l + 6 + Math.floor(hash(Math.floor(this.time)) * (r - l - 12));
      g.fillRect(bx, surf - 1, 3, 2);
    }
    // Crocs
    for (const c of s.crocs) {
      const open = crocOpenAt(s, c, this.time);
      const y = GROUND - 3;
      g.fillStyle = "#2f7a2a";
      g.fillRect(c.x + CROC_MOUTH, y, CROC_W - CROC_MOUTH, 8);
      g.fillStyle = "#3f9a36";
      for (let x = c.x + CROC_MOUTH + 2; x < c.x + CROC_W - 2; x += 4) g.fillRect(x, y - 1, 2, 1);
      // eyes
      g.fillStyle = "#2f7a2a";
      g.fillRect(c.x + CROC_MOUTH + 1, y - 3, 5, 3);
      g.fillStyle = PALETTE.yellow;
      g.fillRect(c.x + CROC_MOUTH + 2, y - 3, 2, 2);
      if (open) {
        g.fillStyle = "#2f7a2a";
        g.fillRect(c.x, y - 7, CROC_MOUTH + 1, 3); // upper jaw raised
        g.fillRect(c.x + 1, y + 4, CROC_MOUTH, 3);
        g.fillStyle = PALETTE.red;
        g.fillRect(c.x + 1, y - 4, CROC_MOUTH, 8);
        g.fillStyle = PALETTE.white;
        for (let x = c.x + 1; x < c.x + CROC_MOUTH; x += 3) {
          g.fillRect(x, y - 4, 1, 2);
          g.fillRect(x + 1, y + 2, 1, 2);
        }
      } else {
        g.fillStyle = "#2f7a2a";
        g.fillRect(c.x, y + 1, CROC_MOUTH, 6);
        g.fillStyle = PALETTE.white;
        for (let x = c.x + 1; x < c.x + CROC_MOUTH; x += 3) g.fillRect(x, y + 4, 1, 1);
      }
      // Warn when the jaws are about to open.
      const cyc = s.crocClosed + s.crocOpen;
      const u = (((this.time + c.phase) % cyc) + cyc) % cyc;
      if (!open && u > s.crocClosed - 0.6 && Math.floor(this.time * 10) % 2) {
        g.fillStyle = PALETTE.yellow;
        g.fillRect(c.x + 3, y - 8, 2, 4);
        g.fillRect(c.x + 3, y - 3, 2, 1);
      }
    }
  }

  private drawLadderHole() {
    const s = this.scene;
    if (s.ladderX === null) return;
    const g = this.ctx;
    g.fillStyle = "#05060f";
    g.fillRect(s.ladderX, GROUND, LADDER_W, H - GROUND);
    this.drawLadder(s.ladderX, GROUND, H);
    if (Math.floor(this.time * 2) % 2) drawText(g, "▼", s.ladderX + LADDER_W / 2, GROUND - 12, PALETTE.yellow, { align: "center", shadow: "#000" });
  }

  private drawLog(x: number) {
    const g = this.ctx;
    const y = GROUND - LOG_H;
    g.fillStyle = PALETTE.trunkDark;
    g.fillRect(x + 1, y, LOG_W - 2, LOG_H);
    g.fillRect(x, y + 1, LOG_W, LOG_H - 2);
    g.fillStyle = PALETTE.trunk;
    g.fillRect(x + 2, y + 1, LOG_W - 4, LOG_H - 2);
    g.fillStyle = "#c28a4a";
    const f = Math.floor((x * 0.25) % 4 + 4) % 4;
    g.fillRect(x + 4, y + 3, 4, 4);
    g.fillStyle = PALETTE.trunkDark;
    const spokes = [[5, 4], [6, 4], [6, 5], [5, 5]][f];
    g.fillRect(x + spokes[0], y + spokes[1], 1, 1);
  }

  private drawScorp(m: Mover) {
    const g = this.ctx;
    const img = this.sprites.scorp[Math.floor(this.time * 8) % 2];
    const x = Math.round(m.x);
    if (m.dir > 0) {
      g.save();
      g.translate(x + SCORP_W, GROUND - SCORP_H);
      g.scale(-1, 1);
      g.drawImage(img, 0, 0);
      g.restore();
    } else g.drawImage(img, x, GROUND - SCORP_H);
  }

  private drawVine() {
    const g = this.ctx;
    const v = this.scene.vine!;
    const a = vineAngle(v, this.time);
    const tip = vineTip(v, a);
    // branch
    g.fillStyle = PALETTE.trunk;
    g.fillRect(v.px - 24, v.py - 4, 48, 4);
    g.fillStyle = PALETTE.leaf;
    g.fillRect(v.px - 30, v.py - 8, 18, 5);
    g.fillRect(v.px + 12, v.py - 8, 18, 5);
    const steps = 40;
    for (let i = 0; i <= steps; i++) {
      const x = v.px + ((tip.x - v.px) * i) / steps;
      const y = v.py + ((tip.y - v.py) * i) / steps;
      g.fillStyle = i % 7 === 3 ? PALETTE.leafBright : "#6c8a2a";
      g.fillRect(Math.round(x), Math.round(y), i % 7 === 3 ? 3 : 1, 2);
    }
  }

  private drawHero() {
    const g = this.ctx;
    const h = this.hero;
    if (this.demoMode && h.state === "frozen") {
      // Attract mode: the explorer waits by the pit.
    }
    if (h.invuln > 0 && h.state !== "dying" && Math.floor(this.time * 12) % 2 === 0) return;
    const hs = this.sprites.hero;
    let img = hs.stand;
    if (h.state === "dying") img = hs.hurt;
    else if (h.state === "vine") img = hs.climbA;
    else if (h.state === "air") img = hs.jump;
    else if (h.vx !== 0) img = Math.floor(h.anim) % 2 ? hs.runA : hs.runB;
    const x = Math.round(h.x - (HERO_SPRITE_W - HERO_W) / 2);
    let y = Math.round(h.y - HERO_SPRITE_H);
    if (h.state === "dying") y += Math.round((1.3 - h.dieT) * 6);
    if (h.face < 0 && img !== hs.climbA) {
      g.save();
      g.translate(x + HERO_SPRITE_W, y);
      g.scale(-1, 1);
      g.drawImage(img, 0, 0);
      g.restore();
    } else g.drawImage(img, x, y);
  }

  /* ---------------------------------------------------------------- crossroads */

  private drawCrossroads() {
    const g = this.ctx;
    const c = this.challenge?.type === "map" ? this.challenge : null;
    const flashing = c && c.picked !== null && Math.floor(this.flashT * 4) % 2 === 0;
    // Rope ladder up (north), under the rose plaque
    g.fillStyle = PALETTE.trunk;
    g.fillRect(CENTER_X - 30, 18, 60, 4);
    this.drawLadder(CENTER_X - 8, 20, GROUND);
    // Trapdoor (south)
    g.fillStyle = PALETTE.trunkDark;
    g.fillRect(CENTER_X - HATCH_W / 2 - 1, GROUND, HATCH_W + 2, 5);
    g.fillStyle = "#8e5a2a";
    g.fillRect(CENTER_X - HATCH_W / 2, GROUND + 1, HATCH_W, 3);
    g.fillStyle = PALETTE.yellow;
    g.fillRect(CENTER_X - 1, GROUND + 2, 2, 1);
    // Trails off both edges
    g.fillStyle = "#c79a5a";
    g.fillRect(0, GROUND, 26, 3);
    g.fillRect(W - 26, GROUND, 26, 3);
    // Compass rose plaque
    const { x: rx, y: ry, r } = ROSE;
    g.fillStyle = PALETTE.stoneDark;
    g.beginPath();
    g.arc(rx, ry, r + 3, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = PALETTE.stone;
    g.beginPath();
    g.arc(rx, ry, r + 1, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = PALETTE.stoneLight;
    // four points
    const pts: [number, number][] = [[0, -1], [1, 0], [0, 1], [-1, 0]];
    for (const [dx, dy] of pts) {
      g.beginPath();
      g.moveTo(rx + dx * (r - 6), ry + dy * (r - 6));
      g.lineTo(rx + dy * 4, ry - dx * 4);
      g.lineTo(rx - dy * 4, ry + dx * 4);
      g.closePath();
      g.fillStyle = dx === 0 && dy === -1 ? PALETTE.red : PALETTE.navy;
      g.fill();
    }
    g.fillStyle = PALETTE.yellow;
    g.fillRect(rx - 1, ry - 1, 3, 3);
    drawText(g, "N", rx, ry - r + 1, PALETTE.white, { align: "center" });
    drawText(g, "S", rx, ry + r - 6, PALETTE.white, { align: "center" });
    drawText(g, "E", rx + r - 3, ry - 2, PALETTE.white, { align: "center" });
    drawText(g, "W", rx - r + 3, ry - 2, PALETTE.white, { align: "center" });

    // Signs
    for (const d of DIRS) {
      const sg = SIGNS[d];
      const letterIdx = c ? c.letters.indexOf(d) : DIRS.indexOf(d);
      const isAnswer = c && c.correct !== null && c.answer === d;
      const isWrong = c && c.correct === false && c.picked === d;
      // post
      g.fillStyle = PALETTE.trunkDark;
      if (d === "N") g.fillRect(sg.x - 2, sg.y + 8, 4, 3);
      else g.fillRect(sg.x + sg.w / 2 - 1, sg.y + sg.h, 3, GROUND - sg.y - sg.h);
      g.fillStyle = isAnswer && flashing ? PALETTE.green : isWrong ? PALETTE.red : "#8e5a2a";
      g.fillRect(sg.x, sg.y, sg.w, sg.h);
      g.fillStyle = "#c28a4a";
      g.fillRect(sg.x + 1, sg.y + 1, sg.w - 2, sg.h - 2);
      const letter = "ABCD"[letterIdx];
      const arrow = d === "N" ? "▲" : d === "S" ? "▼" : d === "E" ? "▶" : "◀";
      const view = c?.signs?.[d];
      const head = view ? letter : `${letter} ${arrow}`;
      drawText(g, head, sg.x + (view?.icon ? 4 : sg.w / 2), sg.y + 3, PALETTE.navy, { align: view?.icon ? "left" : "center" });
      if (view?.icon) g.drawImage(this.sprites.icon[view.icon], sg.x + 12, sg.y + 1);
      if (view) {
        const lines = wrapLabel(view.label, SIGN_TEXT_W, 2) ?? [view.label];
        lines.forEach((ln, i) => drawText(g, ln, sg.x + sg.w / 2, sg.y + 10 + i * 7, PALETTE.navy, { align: "center" }));
      } else {
        drawText(g, `${DIR_NAME[d][0]} EXIT`, sg.x + sg.w / 2, sg.y + 12, PALETTE.navy, { align: "center" });
      }
    }
  }

  /* ---------------------------------------------------------------- gate */

  private drawGate() {
    const g = this.ctx;
    const c = this.challenge?.type === "gate" ? this.challenge : null;
    const open = this.done.has(this.scene.index) || (c && c.correct !== null);
    // Stone gate on the right
    g.fillStyle = PALETTE.stoneDark;
    g.fillRect(GATE_X - 2, 30, W - GATE_X + 2, 10);
    g.fillRect(GATE_X - 2, 30, 6, GROUND - 30);
    g.fillRect(W - 6, 30, 6, GROUND - 30);
    if (!open) {
      g.fillStyle = PALETTE.stone;
      g.fillRect(GATE_X + 4, 40, W - GATE_X - 10, GROUND - 40);
      g.fillStyle = PALETTE.stoneDark;
      for (let y = 46; y < GROUND; y += 10) g.fillRect(GATE_X + 4, y, W - GATE_X - 10, 1);
      drawText(g, "?", GATE_X + 14, 90, PALETTE.yellow);
    }
    // Tablets
    const events = c?.events;
    const sorted = events ? [...events].sort((a, b) => orderKey(a) - orderKey(b)) : null;
    for (let i = 0; i < 4; i++) {
      const x = TABLET_XS[i];
      const ev = events?.[i];
      const openedAt = c ? c.opened.indexOf(i) : -1;
      const reveal = c && c.correct !== null;
      let edge: string = PALETTE.stoneDark;
      if (openedAt >= 0) edge = PALETTE.green;
      if (c && c.wrong === i) edge = PALETTE.red;
      g.fillStyle = edge;
      g.fillRect(x, TABLET_Y, TABLET_W, TABLET_H);
      g.fillStyle = openedAt >= 0 ? "#b7c9a0" : PALETTE.stoneLight;
      g.fillRect(x + 2, TABLET_Y + 2, TABLET_W - 4, TABLET_H - 4);
      g.fillStyle = PALETTE.stone;
      g.fillRect(x + 2, TABLET_Y + 2, TABLET_W - 4, 8);
      drawText(g, "ABCD"[i], x + 6, TABLET_Y + 4, PALETTE.navy);
      if (!ev || !sorted) continue;
      const rank = sorted.indexOf(ev) + 1;
      if (openedAt >= 0 || reveal) {
        drawText(g, `${rank}. ${dateLabel(ev)}`, x + TABLET_W - 4, TABLET_Y + 4, openedAt >= 0 ? "#0d3a22" : PALETTE.red, { align: "right" });
      }
      const lines = wrapLabel(ev.tablet, TABLET_TEXT_W, 3) ?? [ev.tablet];
      lines.forEach((ln, j) => drawText(g, ln, x + TABLET_W / 2, TABLET_Y + 14 + j * 8, PALETTE.navy, { align: "center" }));
    }
    if (!c && !open) drawText(g, "TIMELINE GATE", 150, 40, PALETTE.yellow, { align: "center", shadow: "#000" });
  }

  /* ---------------------------------------------------------------- camp */

  private drawCamp() {
    const g = this.ctx;
    // Tent
    g.fillStyle = PALETTE.red;
    g.beginPath();
    g.moveTo(40, GROUND);
    g.lineTo(80, GROUND - 40);
    g.lineTo(120, GROUND);
    g.closePath();
    g.fill();
    g.fillStyle = "#a3141c";
    g.beginPath();
    g.moveTo(72, GROUND);
    g.lineTo(80, GROUND - 22);
    g.lineTo(88, GROUND);
    g.closePath();
    g.fill();
    // Flag
    g.fillStyle = PALETTE.rope;
    g.fillRect(80, GROUND - 58, 1, 18);
    g.fillStyle = PALETTE.blue;
    g.fillRect(81, GROUND - 58, 10, 6);
    g.fillStyle = PALETTE.yellow;
    g.fillRect(85, GROUND - 56, 2, 2);
    // Campfire
    g.fillStyle = PALETTE.trunk;
    g.fillRect(126, GROUND - 3, 14, 3);
    g.fillStyle = Math.floor(this.time * 8) % 2 ? PALETTE.yellow : "#ff8a3d";
    g.fillRect(130, GROUND - 9, 6, 6);
    g.fillStyle = PALETTE.red;
    g.fillRect(132, GROUND - 12, 2, 4);
    // Radio on a crate
    g.fillStyle = "#8e5a2a";
    g.fillRect(CAMP_TRIGGER_X + 10, GROUND - 12, 20, 12);
    g.fillStyle = PALETTE.navy;
    g.fillRect(CAMP_TRIGGER_X + 12, GROUND - 22, 16, 10);
    g.fillStyle = PALETTE.cyan;
    g.fillRect(CAMP_TRIGGER_X + 14, GROUND - 20, 6, 4);
    g.fillStyle = PALETTE.red;
    g.fillRect(CAMP_TRIGGER_X + 23, GROUND - 19, 3, 3);
    g.fillStyle = PALETTE.white;
    g.fillRect(CAMP_TRIGGER_X + 26, GROUND - 32, 1, 10);
    if (!this.done.has(this.scene.index) && Math.floor(this.time * 3) % 2) {
      drawText(g, "RADIO!", CAMP_TRIGGER_X + 20, GROUND - 42, PALETTE.yellow, { align: "center", shadow: "#000" });
    }
    drawText(g, "BASE CAMP", 80, 30, PALETTE.yellow, { align: "center", shadow: "#000" });
  }
}
