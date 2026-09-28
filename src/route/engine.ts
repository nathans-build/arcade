import type { ChipAudio, DealtQuestion } from "@/kit";
import { drawText, measure } from "./font";
import { explain, type DeliveryRule } from "./rules";
import { plainLabel } from "./font";
import { HERO_H, HERO_W, HOUSE_STYLES, PALETTE, getSprites } from "./sprites";
import { planStreet } from "./street";

/* Logical arcade resolution; the canvas is scaled up with nearest-neighbour. */
export const W = 320;
export const H = 200;

/* Street layout (x, logical pixels). Houses and lawns on the left, road on the right. */
const LAWN_R = 104;
const SIDEWALK_R = 116;
const ROAD_L = 120;
const ROAD_R = 258;
const BIKE_MIN = 110;
const BIKE_MAX = 250;
const CENTER_LINE = 188;
const MAILBOX_X = 92;
const SIGN_X = 3;
const SIGN_W = 98;

/** The hero's centre on screen; the street scrolls down past him. */
const HERO_Y = 150;
/** Distance between houses along the street. */
const SLOT = 64;
/** Where the yard targets stand, ahead of the stopped bike. */
const YARD_TARGET_AHEAD = 92;
export const TARGET_XS = [46, 122, 198, 274];
const TARGET_R = 12;

const LETTERS = "ABCD";

export type Action = "left" | "right" | "up" | "down" | "throw";
export type HouseKind = "delivered" | "cancelled" | "missed" | "skipped";

export interface HudState {
  score: number;
  lives: number;
  street: number;
  packets: number;
  streak: number;
  /** 0 at the start of the street, 1 at the bonus yard. */
  progress: number;
  speed: number;
}

export interface HouseEvent {
  kind: HouseKind;
  rule: DeliveryRule;
  label: string;
  match: boolean;
  points: number;
  explanation: string;
}

export interface StreetTally {
  street: number;
  delivered: number;
  subscribers: number;
  cancelled: number;
  missed: number;
  skipped: number;
  perfect: boolean;
  bonus: number;
}

export interface EngineCallbacks {
  /** A new street begins with this rule. */
  onStreet(rule: DeliveryRule, street: number): void;
  /** The auto-aim target changed (null = no house in reach). */
  onTarget(label: string | null): void;
  onHouse(e: HouseEvent): void;
  /** The bonus yard needs a question. */
  requestQuestion(): DealtQuestion;
  onYard(q: DealtQuestion, tally: StreetTally): void;
  onYardPick(choice: number): void;
  onYardResult(q: DealtQuestion, choice: number, correct: boolean, bonus: number): void;
  onCrash(what: string): void;
  onGameOver(): void;
  onHud(h: HudState): void;
}

export interface GameSettings {
  /** 0 for K, 1-12 otherwise. */
  grade: number;
  firstRule: DeliveryRule;
  nextRule: () => DeliveryRule;
}

type HouseState = "open" | HouseKind;
interface House {
  d: number;
  label: string;
  match: boolean;
  style: number;
  state: HouseState;
  pending: boolean;
  flash: number;
  signScale: number;
}

type ObKind = "cone" | "tire" | "sprinkler" | "dog" | "bundle";
interface Ob {
  kind: ObKind;
  x: number;
  d: number;
  vx: number;
  t: number;
  gone: boolean;
  /** Dogs: sitting in the yard, chasing, or trotting home. */
  dog?: "sit" | "chase" | "home";
  homeX?: number;
  chaseT?: number;
}

interface Packet {
  sx: number;
  sd: number;
  t: number;
  dur: number;
  house?: House;
  target?: number;
}

interface Popup { x: number; d: number; text: string; color: string; t: number }
interface Particle { x: number; d: number; vx: number; vd: number; life: number; color: string }

interface Yard {
  q: DealtQuestion | null;
  picked: number | null;
  result: boolean | null;
  hit: number;
}

function hash(n: number) {
  const s = Math.sin(n * 127.1) * 43758.5453;
  return s - Math.floor(s);
}
const rand = (a: number, b: number) => a + Math.random() * (b - a);
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

/** Grade bands: K–2, 3–5, 6–8, 9–12. */
function band(grade: number) {
  return grade <= 2 ? 0 : grade <= 5 ? 1 : grade <= 8 ? 2 : 3;
}

export class RouteEngine {
  private ctx: CanvasRenderingContext2D;
  private sprites = getSprites();
  private targetSprite: HTMLCanvasElement;
  private raf = 0;
  private last = 0;
  private hudT = 0;
  private time = 0;

  demoMode = true;
  /** Debug/test: steer around hazards, throw at matching houses, never crash. */
  autoplay = false;
  paused = false;
  over = false;
  private keys = new Set<Action>();

  private grade = 4;
  private nextRule: () => DeliveryRule = () => this.rule;
  rule!: DeliveryRule;
  street = 1;
  score = 0;
  lives = 3;
  packets = 10;
  streak = 0;

  /** Distance ridden along the current street. */
  dist = 0;
  private speedMul = 1;
  private bx = 200;
  private lean = 0;
  private pedal = 0;
  private crashT = 0;
  private invuln = 0;
  introT = 0;

  houses: House[] = [];
  private obs: Ob[] = [];
  private packetsInAir: Packet[] = [];
  private popups: Popup[] = [];
  private particles: Particle[] = [];
  private yardD = 1000;
  phase: "ride" | "yard" = "ride";
  yard: Yard = { q: null, picked: null, result: null, hit: 0 };
  private tally: StreetTally = { street: 1, delivered: 0, subscribers: 0, cancelled: 0, missed: 0, skipped: 0, perfect: true, bonus: 0 };
  private lastTarget: House | null = null;

  constructor(canvas: HTMLCanvasElement, private audio: ChipAudio, private cb: EngineCallbacks) {
    canvas.width = W;
    canvas.height = H;
    this.ctx = canvas.getContext("2d")!;
    this.ctx.imageSmoothingEnabled = false;
    this.targetSprite = this.makeTarget();
  }

  /* ------------------------------ lifecycle ------------------------------ */

  start() {
    this.last = performance.now();
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - this.last) / 1000);
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

  /** Attract mode behind the title screen. */
  demo(rule: DeliveryRule) {
    this.demoMode = true;
    this.over = false;
    this.paused = false;
    this.grade = 4;
    this.nextRule = () => rule;
    this.lives = 3;
    this.packets = 99;
    this.street = 1;
    this.beginStreet(rule);
  }

  newGame(s: GameSettings) {
    this.demoMode = false;
    this.over = false;
    this.paused = false;
    this.grade = s.grade;
    this.nextRule = s.nextRule;
    this.score = 0;
    this.lives = 3;
    this.streak = 0;
    this.street = 1;
    this.packets = band(s.grade) === 0 ? 12 : 10;
    this.keys.clear();
    this.beginStreet(s.firstRule);
    this.pushHud();
  }

  /** After the bonus yard: ride the next street with the next rule. */
  nextStreet() {
    if (this.phase !== "yard" || this.yard.result === null) return;
    this.street++;
    this.beginStreet(this.nextRule());
    this.pushHud();
  }

  togglePause(force?: boolean): boolean {
    if (this.demoMode || this.over) return false;
    this.paused = force ?? !this.paused;
    if (this.paused) this.keys.clear();
    return this.paused;
  }

  setKey(a: Action, down: boolean) {
    if (a === "throw") {
      if (down && !this.keys.has("throw")) this.throwAtTarget();
    }
    if (down) this.keys.add(a);
    else this.keys.delete(a);
  }

  releaseAllKeys() {
    this.keys.clear();
  }

  /* ------------------------------ street setup ------------------------------ */

  private settings() {
    const b = band(this.grade);
    const s = this.street - 1;
    return {
      speed: [24, 31, 37, 43][b] + Math.min(14, s * 2.5),
      density: Math.min(1.7, [0.4, 0.7, 0.9, 1.05][b] + s * 0.08),
      dogSpeed: [26, 36, 44, 50][b] + Math.min(12, s * 2),
      tireSpeed: [16, 26, 34, 40][b],
      spray: [16, 24, 28, 30][b],
      houses: [8, 10, 12, 12][b],
    };
  }

  private beginStreet(rule: DeliveryRule) {
    this.rule = rule;
    const st = this.settings();
    const plan = planStreet(rule, st.houses);
    const firstD = 250;
    this.houses = plan.map((p, i) => {
      const full = measure(p.label, 2) <= SIGN_W - 6;
      return {
        d: firstD + i * SLOT,
        label: p.label,
        match: p.match,
        style: Math.floor(hash(this.street * 31 + i * 7) * HOUSE_STYLES.length),
        state: "open" as HouseState,
        pending: false,
        flash: 0,
        signScale: full ? 2 : 1,
      };
    });
    const lastD = firstD + (plan.length - 1) * SLOT;
    this.yardD = lastD + 150;
    this.dist = 0;
    this.speedMul = 1;
    this.bx = 200;
    this.crashT = 0;
    this.invuln = 0;
    this.introT = this.demoMode ? 0 : 2.8;
    this.phase = "ride";
    this.yard = { q: null, picked: null, result: null, hit: 0 };
    this.packetsInAir = [];
    this.popups = [];
    this.particles = [];
    this.lastTarget = null;
    this.tally = {
      street: this.street, delivered: 0, subscribers: plan.filter((p) => p.match).length,
      cancelled: 0, missed: 0, skipped: 0, perfect: true, bonus: 0,
    };
    this.buildObstacles(firstD + 70, lastD + 40, st);
    if (!this.demoMode) this.cb.onStreet(rule, this.street);
    this.cb.onTarget(null);
  }

  private buildObstacles(from: number, to: number, st: ReturnType<RouteEngine["settings"]>) {
    this.obs = [];
    const b = band(this.grade);
    const count = Math.round(((to - from) / 100) * st.density);
    const kinds: ObKind[] = b === 0 ? ["cone", "cone", "tire", "sprinkler", "dog"] : ["cone", "tire", "tire", "sprinkler", "dog", "dog"];
    const ds: number[] = [];
    for (let tries = 0; ds.length < count && tries < 400; tries++) {
      const d = rand(from, to);
      if (ds.every((o) => Math.abs(o - d) > 44)) ds.push(d);
    }
    for (const d of ds) {
      const kind = kinds[Math.floor(Math.random() * kinds.length)];
      if (kind === "cone") this.obs.push({ kind, x: rand(BIKE_MIN + 6, BIKE_MAX - 6), d, vx: 0, t: 0, gone: false });
      else if (kind === "tire") {
        const dir = Math.random() < 0.5 ? -1 : 1;
        this.obs.push({ kind, x: rand(ROAD_L + 10, ROAD_R - 14), d, vx: dir * st.tireSpeed * rand(0.8, 1.2), t: 0, gone: false });
      } else if (kind === "sprinkler") this.obs.push({ kind, x: 107, d, vx: st.spray, t: rand(0, 3), gone: false });
      else this.obs.push({ kind, x: 94, d, vx: 0, t: 0, gone: false, dog: "sit", homeX: 94, chaseT: 0 });
    }
    // Packet bundles to pick up, in the gaps between hazards.
    const nBundles = Math.max(2, Math.round((to - from) / 330));
    for (let i = 0; i < nBundles; i++) {
      let d = from + ((i + 0.5) / nBundles) * (to - from);
      for (let k = 0; k < 20 && this.obs.some((o) => Math.abs(o.d - d) < 22); k++) d += 9;
      this.obs.push({ kind: "bundle", x: rand(ROAD_L + 16, ROAD_R - 20), d, vx: 0, t: 0, gone: false });
    }
  }

  /* ------------------------------ helpers ------------------------------ */

  /** Screen y of a street distance. */
  private sy(d: number) {
    return HERO_Y - (d - this.dist);
  }

  /** Screen y of a house's mailbox (its delivery point). */
  private mailY(h: House) {
    return this.sy(h.d);
  }

  /** Top of a house's lot on screen. */
  private slotTop(h: House) {
    return this.sy(h.d) - 44;
  }

  /** The house the throw key aims at: the open house nearest just ahead of the bike. */
  currentTarget(): House | null {
    if (this.phase !== "ride" || this.crashT > 0) return null;
    let best: House | null = null;
    let bestD = Infinity;
    for (const h of this.houses) {
      if (h.state !== "open" || h.pending) continue;
      const y = this.mailY(h);
      if (y < HERO_Y - 96 || y > HERO_Y + 14) continue;
      const dd = Math.abs(y - (HERO_Y - 34));
      if (dd < bestD) {
        bestD = dd;
        best = h;
      }
    }
    return best;
  }

  /** Throw at the auto-aimed house (throw key or THROW button). */
  throwAtTarget() {
    if (this.demoMode || this.paused || this.over) return false;
    if (this.phase === "yard") return false;
    const h = this.currentTarget();
    if (!h) {
      this.audio.blip();
      return false;
    }
    return this.throwAt(h);
  }

  private throwAt(h: House): boolean {
    if (h.state !== "open" || h.pending || this.crashT > 0) return false;
    if (this.packets <= 0) {
      this.popups.push({ x: this.bx, d: this.dist + 20, text: "NO PACKETS!", color: PALETTE.red, t: 1.2 });
      this.audio.wrong();
      return false;
    }
    if (!this.demoMode) this.packets--;
    h.pending = true;
    const dx = this.bx - (MAILBOX_X + 4);
    this.packetsInAir.push({ sx: this.bx - 4, sd: this.dist + 6, t: 0, dur: 0.28 + Math.abs(dx) / 700, house: h });
    this.audio.shoot();
    this.pushHud();
    return true;
  }

  /** A tap or click on the screen, in logical pixels. */
  tap(x: number, y: number): boolean {
    if (this.demoMode || this.paused || this.over) return false;
    if (this.phase === "yard") {
      const ty = this.sy(this.yardD + YARD_TARGET_AHEAD);
      for (let i = 0; i < 4; i++) {
        if (Math.abs(x - TARGET_XS[i]) <= 22 && y >= ty - 18 && y <= ty + 26) {
          this.selectAnswer(i);
          return true;
        }
      }
      return false;
    }
    if (x > SIDEWALK_R) return false;
    for (const h of this.houses) {
      const top = this.slotTop(h);
      if (y >= top && y < top + SLOT && h.state === "open" && !h.pending && y > 2) {
        return this.throwAt(h);
      }
    }
    return false;
  }

  /** Answer the bonus-yard question (keys 1–4 / A–D, a tap on a target or on the banner). */
  selectAnswer(i: number) {
    if (this.phase !== "yard" || !this.yard.q || this.yard.picked !== null || this.paused) return;
    this.yard.picked = i;
    this.packetsInAir.push({ sx: this.bx - 3, sd: this.dist + 4, t: 0, dur: 0.45, target: i });
    this.audio.shoot();
    this.cb.onYardPick(i);
  }

  /* ------------------------------ update ------------------------------ */

  private update(dt: number) {
    this.time += dt;
    const st = this.settings();
    if (this.introT > 0) this.introT -= dt;

    // Speed: hold up to pedal harder, down to brake; releasing returns to cruising speed.
    const up = this.keys.has("up"), down = this.keys.has("down");
    const targetMul = this.phase === "yard" ? 0 : up && !down ? 1.65 : down && !up ? 0.45 : 1;
    this.speedMul += clamp(targetMul - this.speedMul, -2.2 * dt, 2.2 * dt);

    if (this.crashT > 0) {
      this.crashT -= dt;
      if (this.crashT <= 0) {
        if (this.lives <= 0 && !this.demoMode) {
          this.over = true;
          this.cb.onGameOver();
          return;
        }
        this.invuln = 2;
      }
    } else if (this.phase === "ride") {
      const introSlow = this.introT > 0 ? 0.6 : 1;
      this.dist += st.speed * this.speedMul * introSlow * dt;
      this.pedal += st.speed * this.speedMul * dt;
      // steering
      let steer = 0;
      if (this.autoplay || this.demoMode) steer = this.autoSteer();
      else steer = (this.keys.has("right") ? 1 : 0) - (this.keys.has("left") ? 1 : 0);
      this.lean += (steer - this.lean) * Math.min(1, dt * 10);
      this.bx = clamp(this.bx + steer * 92 * dt, BIKE_MIN, BIKE_MAX);
      if (this.dist >= this.yardD) {
        this.dist = this.yardD;
        this.enterYard();
      }
    }
    if (this.invuln > 0) this.invuln -= dt;

    this.updateObstacles(dt, st);
    this.updateHouses();
    this.updatePackets(dt);

    for (const p of this.popups) p.t -= dt;
    this.popups = this.popups.filter((p) => p.t > 0);
    for (const p of this.particles) {
      p.x += p.vx * dt;
      p.d += p.vd * dt;
      p.life -= dt;
    }
    this.particles = this.particles.filter((p) => p.life > 0);

    if ((this.autoplay || this.demoMode) && this.phase === "ride") {
      const t = this.currentTarget();
      if (t && t.match && this.mailY(t) > HERO_Y - 60) {
        if (this.demoMode) this.throwAt(t);
        else if (this.packets > 0) this.throwAt(t);
      }
    }
    if (this.demoMode && this.phase === "yard") {
      this.yard.hit += dt;
      if (this.yard.hit > 2.5) this.beginStreet(this.rule);
    }

    const tgt = this.currentTarget();
    if (tgt !== this.lastTarget) {
      this.lastTarget = tgt;
      if (!this.demoMode) this.cb.onTarget(tgt ? tgt.label : null);
    }

    this.hudT -= dt;
    if (this.hudT <= 0) {
      this.hudT = 0.1;
      this.pushHud();
    }
  }

  private autoSteer(): number {
    // Look ahead for the nearest hazard in our lane and steer to the clearer side.
    let danger: Ob | null = null;
    for (const o of this.obs) {
      if (o.gone || o.kind === "bundle") continue;
      const ahead = o.d - this.dist;
      if (ahead < -12 || ahead > 70) continue;
      const ox = o.kind === "sprinkler" ? o.x + 4 + o.vx / 2 : o.x;
      const reach = o.kind === "sprinkler" ? o.vx / 2 + 12 : 16;
      if (Math.abs(ox - this.bx) < reach && (!danger || o.d < danger.d)) danger = o;
    }
    if (danger) {
      const ox = danger.kind === "sprinkler" ? 107 : danger.x;
      if (danger.kind === "sprinkler") return 1;
      const goRight = ox < this.bx ? true : ox > this.bx ? false : this.bx < 200;
      if (goRight && this.bx >= BIKE_MAX - 2) return -1;
      if (!goRight && this.bx <= BIKE_MIN + 2) return 1;
      return goRight ? 1 : -1;
    }
    const home = 170;
    return Math.abs(this.bx - home) < 3 ? 0 : this.bx < home ? 0.6 : -0.6;
  }

  private updateObstacles(dt: number, st: ReturnType<RouteEngine["settings"]>) {
    for (const o of this.obs) {
      if (o.gone) continue;
      o.t += dt;
      const y = this.sy(o.d);
      if (o.kind === "tire" && y > -20) {
        o.x += o.vx * dt;
        if (o.x < ROAD_L + 4 || o.x > ROAD_R - 12) {
          o.vx = -o.vx;
          o.x = clamp(o.x, ROAD_L + 4, ROAD_R - 12);
        }
      }
      if (o.kind === "dog") {
        if (o.dog === "sit" && o.chaseT !== -99 && y > HERO_Y - 95 && y < HERO_Y - 25 && this.phase === "ride") {
          o.dog = "chase";
          o.chaseT = 2.6;
          if (!this.demoMode) this.audio.tone(520, 0.08, "square", 0.25, 700);
        }
        if (o.dog === "chase") {
          o.chaseT! -= dt;
          const dir = Math.sign(this.bx - o.x);
          o.vx = dir * st.dogSpeed;
          o.x += o.vx * dt;
          // runs along with the bike for a while, slowly dropping back
          o.d += st.speed * this.speedMul * 0.72 * dt;
          if (o.chaseT! <= 0) o.dog = "home";
        } else if (o.dog === "home") {
          o.vx = -st.dogSpeed * 0.8;
          o.x += o.vx * dt;
          if (o.x <= o.homeX!) {
            o.x = o.homeX!;
            o.dog = "sit";
            o.vx = 0;
            o.chaseT = -99; // do not chase again
          }
        }
      }
      // collisions
      if (this.crashT > 0 || this.phase !== "ride") continue;
      if (Math.abs(y - HERO_Y) > 16) continue;
      if (o.kind === "bundle") {
        if (Math.abs(o.x + 6 - this.bx) < 12 && Math.abs(y + 4 - HERO_Y) < 12) {
          o.gone = true;
          if (!this.demoMode) this.packets = Math.min(20, this.packets + 5);
          this.popups.push({ x: this.bx, d: this.dist + 14, text: "+5 PACKETS", color: PALETTE.yellow, t: 1.1 });
          this.audio.blip();
          this.audio.tone(1200, 0.08, "square", 0.2);
          this.pushHud();
        }
        continue;
      }
      if (this.invuln > 0 || this.autoplay || this.demoMode) continue;
      const hx = 4, hy = 8;
      let hit = false;
      let what = "";
      if (o.kind === "cone") { hit = Math.abs(o.x - this.bx) < hx + 3 && Math.abs(y - HERO_Y) < hy + 3; what = "a traffic cone"; }
      if (o.kind === "tire") { hit = Math.abs(o.x + 4 - this.bx) < hx + 4 && Math.abs(y - HERO_Y) < hy + 4; what = "a rolling tire"; }
      if (o.kind === "dog") { hit = o.dog === "chase" && Math.abs(o.x + 5 - this.bx) < hx + 4 && Math.abs(y - HERO_Y) < hy + 2; what = "a dog"; }
      if (o.kind === "sprinkler") {
        const on = this.sprayOn(o);
        hit = (on && this.bx > o.x && this.bx < o.x + 6 + o.vx && Math.abs(y - HERO_Y) < hy + 2) || (Math.abs(o.x + 2 - this.bx) < hx + 2 && Math.abs(y - HERO_Y) < hy);
        what = "a sprinkler";
      }
      if (hit) this.crash(what);
    }
  }

  private sprayOn(o: Ob) {
    return (o.t % 3) < 1.5;
  }

  private crash(what: string) {
    this.crashT = 1.5;
    this.lives--;
    this.streak = 0;
    this.audio.crash();
    for (let i = 0; i < 14; i++) {
      this.particles.push({ x: this.bx, d: this.dist, vx: rand(-60, 60), vd: rand(-40, 60), life: rand(0.4, 0.9), color: i % 2 ? PALETTE.white : PALETTE.red });
    }
    this.popups.push({ x: this.bx, d: this.dist + 22, text: "CRASH!", color: PALETTE.red, t: 1.4 });
    this.cb.onCrash(what);
    this.pushHud();
  }

  private updateHouses() {
    if (this.phase !== "ride") return;
    for (const h of this.houses) {
      if (h.flash > 0) h.flash -= 0.016;
      if (h.state !== "open" || h.pending) continue;
      if (this.slotTop(h) > H + 2) {
        if (h.match) {
          h.state = "missed";
          this.tally.missed++;
          this.tally.perfect = false;
          this.streak = 0;
          this.popups.push({ x: 60, d: this.dist - 40, text: "MISSED", color: PALETTE.lightBlue, t: 1 });
          if (!this.demoMode) this.cb.onHouse({ kind: "missed", rule: this.rule, label: h.label, match: true, points: 0, explanation: explain(this.rule, h.label, plainLabel) });
        } else {
          h.state = "skipped";
          this.tally.skipped++;
          if (!this.demoMode) {
            this.streak++;
            this.score += 25;
            this.cb.onHouse({ kind: "skipped", rule: this.rule, label: h.label, match: false, points: 25, explanation: explain(this.rule, h.label, plainLabel) });
          }
        }
      }
    }
  }

  private mult() {
    return Math.min(5, 1 + Math.floor(this.streak / 3));
  }

  private updatePackets(dt: number) {
    for (const p of this.packetsInAir) p.t += dt;
    const landed = this.packetsInAir.filter((p) => p.t >= p.dur);
    this.packetsInAir = this.packetsInAir.filter((p) => p.t < p.dur);
    for (const p of landed) {
      if (p.house) this.landOnHouse(p.house);
      else if (p.target !== undefined) this.landOnTarget(p.target);
    }
  }

  private landOnHouse(h: House) {
    h.pending = false;
    h.flash = 1;
    const e = explain(this.rule, h.label, plainLabel);
    const px = MAILBOX_X + 4;
    if (h.match) {
      h.state = "delivered";
      this.tally.delivered++;
      this.streak++;
      const pts = 100 * this.mult();
      if (!this.demoMode) this.score += pts;
      this.audio.correct();
      this.popups.push({ x: px - 30, d: h.d + 14, text: `+${pts}`, color: PALETTE.green, t: 1.2 });
      for (let i = 0; i < 10; i++) this.particles.push({ x: px, d: h.d, vx: rand(-50, 50), vd: rand(-30, 50), life: rand(0.3, 0.7), color: i % 2 ? PALETTE.yellow : PALETTE.green });
      if (!this.demoMode) this.cb.onHouse({ kind: "delivered", rule: this.rule, label: h.label, match: true, points: pts, explanation: e });
    } else {
      h.state = "cancelled";
      this.tally.cancelled++;
      this.tally.perfect = false;
      this.streak = 0;
      this.audio.wrong();
      this.audio.noise(0.25, 0.5);
      this.popups.push({ x: px - 34, d: h.d + 14, text: "CANCELLED!", color: PALETTE.red, t: 1.5 });
      for (let i = 0; i < 8; i++) this.particles.push({ x: px - 30, d: h.d + 8, vx: rand(-40, 40), vd: rand(-20, 40), life: rand(0.3, 0.6), color: PALETTE.cyan });
      if (!this.demoMode) this.cb.onHouse({ kind: "cancelled", rule: this.rule, label: h.label, match: false, points: 0, explanation: e });
    }
    this.pushHud();
  }

  private enterYard() {
    if (this.phase === "yard") return;
    this.phase = "yard";
    this.keys.delete("up");
    // Any open houses still on screen are settled now.
    for (const h of this.houses) {
      if (h.state === "open" && !h.pending) {
        if (h.match) {
          h.state = "missed";
          this.tally.missed++;
          this.tally.perfect = false;
        } else {
          h.state = "skipped";
          this.tally.skipped++;
          if (!this.demoMode) this.score += 25;
        }
      }
    }
    this.cb.onTarget(null);
    if (this.demoMode) return;
    this.tally.bonus = this.tally.perfect ? 1000 : 0;
    this.score += this.tally.bonus;
    if (this.tally.perfect) {
      this.lives = Math.min(5, this.lives + 1);
      this.audio.levelUp();
    } else this.audio.checkpoint();
    const q = this.cb.requestQuestion();
    this.yard = { q, picked: null, result: null, hit: 0 };
    this.cb.onYard(q, { ...this.tally });
    this.pushHud();
  }

  private landOnTarget(i: number) {
    const q = this.yard.q;
    if (!q) return;
    const correct = i === q.answer;
    this.yard.result = correct;
    this.yard.hit = 0;
    const bonus = correct ? 500 * this.mult() : 0;
    if (correct) {
      this.streak++;
      this.score += bonus;
      this.packets = Math.min(20, this.packets + 6);
      this.audio.correct();
      for (let k = 0; k < 18; k++) this.particles.push({ x: TARGET_XS[i], d: this.yardD + YARD_TARGET_AHEAD, vx: rand(-70, 70), vd: rand(-50, 70), life: rand(0.4, 1), color: [PALETTE.yellow, PALETTE.green, PALETTE.red][k % 3] });
    } else {
      this.streak = 0;
      this.packets = Math.min(20, this.packets + 3);
      this.audio.wrong();
    }
    this.cb.onYardResult(q, i, correct, bonus);
    this.pushHud();
  }

  /** Debug/test hook: jump to just before the bonus yard. */
  skipToYard() {
    if (this.phase !== "ride") return;
    this.dist = this.yardD - 20;
    this.introT = 0;
  }

  private pushHud() {
    this.cb.onHud({
      score: this.score,
      lives: this.lives,
      street: this.street,
      packets: this.packets,
      streak: this.streak,
      progress: clamp(this.dist / this.yardD, 0, 1),
      speed: this.speedMul,
    });
  }

  /* ------------------------------ drawing ------------------------------ */

  private makeTarget(): HTMLCanvasElement {
    const c = document.createElement("canvas");
    const s = TARGET_R * 2 + 1;
    c.width = s;
    c.height = s;
    const g = c.getContext("2d")!;
    const rings = [PALETTE.red, PALETTE.white, PALETTE.red, PALETTE.white, PALETTE.red];
    for (let y = 0; y < s; y++) {
      for (let x = 0; x < s; x++) {
        const r = Math.hypot(x - TARGET_R, y - TARGET_R);
        if (r > TARGET_R + 0.3) continue;
        const ring = Math.min(4, Math.floor((TARGET_R + 0.3 - r) / ((TARGET_R + 0.3) / 5)));
        g.fillStyle = r > TARGET_R - 0.9 ? "#05060f" : rings[ring];
        g.fillRect(x, y, 1, 1);
      }
    }
    return c;
  }

  private draw() {
    const g = this.ctx;
    g.fillStyle = PALETTE.grass;
    g.fillRect(0, 0, W, H);
    this.drawStreet(g);
    this.drawHouses(g);
    this.drawYard(g);
    this.drawObstacles(g);
    this.drawHero(g);
    this.drawPackets(g);
    for (const p of this.particles) {
      g.fillStyle = p.color;
      g.fillRect(Math.round(p.x), Math.round(this.sy(p.d)), 2, 2);
    }
    for (const p of this.popups) {
      const rise = (1.5 - p.t) * 10;
      drawText(g, p.text, p.x, this.sy(p.d) - rise, p.color, { align: "center", shadow: "#05060f" });
    }
    this.drawOverlayText(g);
  }

  private drawStreet(g: CanvasRenderingContext2D) {
    // lawn texture
    for (let i = Math.floor((this.dist - 60) / 20); i < (this.dist + 260) / 20; i++) {
      const y = Math.round(this.sy(i * 20));
      g.fillStyle = PALETTE.grassDark;
      g.fillRect(Math.floor(hash(i) * 96), y, 2, 1);
      g.fillRect(Math.floor(hash(i + 50) * 24) + 294, y + 7, 2, 1);
    }
    // sidewalk with joints
    g.fillStyle = PALETTE.sidewalk;
    g.fillRect(LAWN_R, 0, SIDEWALK_R - LAWN_R, H);
    g.fillStyle = PALETTE.sidewalkLine;
    for (let d = Math.floor((this.dist - 60) / 16) * 16; d < this.dist + 220; d += 16) g.fillRect(LAWN_R, Math.round(this.sy(d)), SIDEWALK_R - LAWN_R, 1);
    // curb and road
    g.fillStyle = PALETTE.curb;
    g.fillRect(SIDEWALK_R, 0, ROAD_L - SIDEWALK_R, H);
    g.fillStyle = PALETTE.road;
    g.fillRect(ROAD_L, 0, ROAD_R - ROAD_L, H);
    g.fillStyle = PALETTE.roadDark;
    for (let i = Math.floor((this.dist - 60) / 13); i < (this.dist + 220) / 13; i++) {
      g.fillRect(ROAD_L + Math.floor(hash(i * 3) * (ROAD_R - ROAD_L - 4)), Math.round(this.sy(i * 13)), 3, 1);
    }
    g.fillStyle = PALETTE.roadLine;
    for (let d = Math.floor((this.dist - 60) / 28) * 28; d < this.dist + 220; d += 28) g.fillRect(CENTER_LINE, Math.round(this.sy(d)) - 12, 2, 12);
    // far side: curb, sidewalk, a park strip with trees, flower beds and a picket fence
    g.fillStyle = PALETTE.curb;
    g.fillRect(ROAD_R, 0, 3, H);
    g.fillStyle = PALETTE.sidewalk;
    g.fillRect(ROAD_R + 3, 0, 10, H);
    g.fillStyle = PALETTE.sidewalkLine;
    for (let d = Math.floor((this.dist - 60) / 16) * 16; d < this.dist + 220; d += 16) g.fillRect(ROAD_R + 3, Math.round(this.sy(d)) + 8, 10, 1);
    g.fillStyle = PALETTE.white;
    g.fillRect(ROAD_R + 16, 0, 1, H);
    for (let d = Math.floor((this.dist - 60) / 6) * 6; d < this.dist + 220; d += 6) g.fillRect(ROAD_R + 15, Math.round(this.sy(d)), 3, 2);
    for (let i = Math.floor((this.dist - 80) / 56); i < (this.dist + 260) / 56; i++) {
      const y = Math.round(this.sy(i * 56 + hash(i) * 20));
      if (hash(i + 11) < 0.7) g.drawImage(this.sprites.tree, 280 + Math.floor(hash(i + 3) * 26), y - 5);
      else {
        g.drawImage(this.sprites.flowers, 282 + Math.floor(hash(i + 5) * 20), y);
        g.drawImage(this.sprites.flowers, 290 + Math.floor(hash(i + 6) * 20), y + 4);
      }
    }
  }

  private drawHouses(g: CanvasRenderingContext2D) {
    const target = this.currentTarget();
    // lawn before the first house and the hedge rows
    for (const h of this.houses) {
      const top = Math.round(this.slotTop(h));
      if (top > H || top + SLOT < -2) continue;
      const st = HOUSE_STYLES[h.style];
      // hedge along the lot line
      g.fillStyle = PALETTE.hedge;
      g.fillRect(0, top, LAWN_R, 3);
      g.fillStyle = PALETTE.grassLight;
      for (let x = 2; x < LAWN_R; x += 6) g.fillRect(x, top, 2, 1);
      // flowers
      g.drawImage(this.sprites.flowers, 70 + Math.floor(hash(h.d) * 10), top + 50);
      // house (seen from above): roof halves with a ridge, porch facing the street
      const hx = 6, hy = top + 21, hw = 54, hh = 36;
      g.fillStyle = PALETTE.shadow;
      g.fillRect(hx + 3, hy + 3, hw, hh);
      g.fillStyle = st.roofDark;
      g.fillRect(hx, hy, hw, hh);
      g.fillStyle = st.roof;
      g.fillRect(hx, hy, hw, Math.floor(hh / 2));
      g.fillStyle = "#05060f";
      g.fillRect(hx, hy + Math.floor(hh / 2), hw, 1);
      g.fillStyle = st.trim;
      g.fillRect(hx, hy, hw, 1);
      g.fillRect(hx, hy + hh - 1, hw, 1);
      // roof shingles
      g.fillStyle = "rgba(0,0,0,0.18)";
      for (let r = hy + 3; r < hy + hh - 2; r += 4) if (r !== hy + Math.floor(hh / 2)) g.fillRect(hx + 2, r, hw - 4, 1);
      // chimney
      g.fillStyle = "#6b3f24";
      g.fillRect(hx + 8, hy + 4, 6, 6);
      // porch and door on the street side
      g.fillStyle = st.trim;
      g.fillRect(hx + hw, hy + 12, 6, 14);
      g.fillStyle = st.door;
      g.fillRect(hx + hw, hy + 15, 2, 8);
      // front path to the sidewalk
      g.fillStyle = PALETTE.path;
      g.fillRect(hx + hw + 6, hy + 17, LAWN_R - (hx + hw + 6), 4);
      // mailbox (the delivery point)
      const my = Math.round(this.mailY(h));
      g.drawImage(this.sprites.mailbox, MAILBOX_X, my - 4);
      if (h.state === "delivered") {
        g.fillStyle = PALETTE.yellow;
        g.fillRect(MAILBOX_X + 7, my - 8, 1, 5);
        g.fillRect(MAILBOX_X + 8, my - 8, 3, 2);
        g.drawImage(this.sprites.packet, MAILBOX_X - 4, my + 4);
      }
      if (h.state === "cancelled") {
        // a broken window: sad subscriber
        g.fillStyle = PALETTE.cyan;
        g.fillRect(hx + hw - 16, hy + 26, 8, 6);
        g.fillStyle = "#05060f";
        g.fillRect(hx + hw - 15, hy + 27, 1, 4);
        g.fillRect(hx + hw - 13, hy + 28, 3, 1);
        g.fillRect(hx + hw - 11, hy + 26, 1, 3);
        g.drawImage(this.sprites.packet, hx + hw - 18, hy + 30);
      }
      this.drawSign(g, h, top + 4, h === target);
    }
  }

  private drawSign(g: CanvasRenderingContext2D, h: House, y: number, targeted: boolean) {
    const sh = h.signScale === 2 ? 15 : 11;
    let bg = "#f2f4ff", ink = "#0a0f2e", edge = "#05060f";
    if (h.state === "delivered") { bg = "#0d5a2a"; ink = PALETTE.green; }
    if (h.state === "cancelled") { bg = "#5a0d14"; ink = "#ffb0b4"; }
    if (h.state === "missed" || h.state === "skipped") { bg = "#9aa0b8"; ink = "#3a3f55"; }
    const blink = targeted && Math.floor(this.time * 4) % 2 === 0;
    if (targeted) edge = blink ? PALETTE.yellow : PALETTE.red;
    g.fillStyle = "#6b3f24";
    g.fillRect(SIGN_X + 10, y + sh, 2, 3);
    g.fillRect(SIGN_X + SIGN_W - 12, y + sh, 2, 3);
    g.fillStyle = edge;
    g.fillRect(SIGN_X - 1, y - 1, SIGN_W + 2, sh + 2);
    if (targeted) g.fillRect(SIGN_X - 2, y - 2, SIGN_W + 4, sh + 4);
    g.fillStyle = bg;
    g.fillRect(SIGN_X, y, SIGN_W, sh);
    drawText(g, h.label, SIGN_X + SIGN_W / 2, y + 3, ink, { scale: h.signScale, align: "center" });
    if (h.state === "delivered") drawText(g, "✔", SIGN_X + SIGN_W - 8, y + 3, PALETTE.green);
    if (h.state === "cancelled") drawText(g, "✘", SIGN_X + SIGN_W - 8, y + 3, PALETTE.red);
    if (targeted && h.state === "open") {
      // arrow from the sign toward the bike
      drawText(g, "◀", SIGN_X + SIGN_W + 3, y + (sh - 10) / 2, blink ? PALETTE.yellow : PALETTE.red, { scale: 2, shadow: "#05060f" });
    }
  }

  private drawYard(g: CanvasRenderingContext2D) {
    const top = this.sy(this.yardD + 170);
    const bottom = this.sy(this.yardD - 40);
    if (bottom < 0 || top > H) return;
    g.fillStyle = PALETTE.grassLight;
    g.fillRect(0, Math.round(top), W, Math.round(bottom - top));
    // paved path where the road ends
    g.fillStyle = PALETTE.path;
    g.fillRect(ROAD_L + 40, Math.round(bottom - 60), 90, 60);
    // picket fences
    g.fillStyle = PALETTE.white;
    for (const fy of [top, bottom - 4]) {
      g.fillRect(0, Math.round(fy) + 2, W, 1);
      for (let x = 0; x < W; x += 5) if (fy === top || x < ROAD_L + 38 || x > ROAD_L + 132) g.fillRect(x, Math.round(fy), 2, 5);
    }
    const ty = Math.round(this.sy(this.yardD + YARD_TARGET_AHEAD));
    const bw = measure("BONUS YARD", 2) + 12;
    g.fillStyle = "#05060f";
    g.fillRect(Math.round(W / 2 - bw / 2) - 1, ty - 47, bw + 2, 20);
    g.fillStyle = "#0c1440";
    g.fillRect(Math.round(W / 2 - bw / 2), ty - 46, bw, 18);
    drawText(g, "BONUS YARD", W / 2, ty - 42, PALETTE.yellow, { scale: 2, align: "center" });
    const y = this.yard;
    for (let i = 0; i < 4; i++) {
      const tx = TARGET_XS[i];
      let show = true;
      const isAns = y.q && y.result !== null && i === y.q.answer;
      if (isAns && Math.floor(this.time * 5) % 2 === 0 && !y.result) show = false;
      g.fillStyle = "#6b3f24";
      g.fillRect(tx - 1, ty + TARGET_R, 3, 8);
      if (show) g.drawImage(this.targetSprite, tx - TARGET_R, ty - TARGET_R);
      if (y.picked === i && y.result === false) {
        g.fillStyle = "rgba(10,15,46,0.55)";
        g.fillRect(tx - TARGET_R, ty - TARGET_R, TARGET_R * 2 + 1, TARGET_R * 2 + 1);
      }
      // letter plate
      const plate = isAns ? PALETTE.green : y.picked === i ? PALETTE.cyan : PALETTE.yellow;
      g.fillStyle = "#05060f";
      g.fillRect(tx - 9, ty + TARGET_R + 5, 19, 15);
      g.fillStyle = plate;
      g.fillRect(tx - 8, ty + TARGET_R + 6, 17, 13);
      drawText(g, LETTERS[i], tx + 1, ty + TARGET_R + 9, "#0a0f2e", { scale: 2, align: "center" });
      if (isAns && y.result) drawText(g, "✔", tx, ty - TARGET_R - 10, PALETTE.green, { scale: 2, align: "center", shadow: "#05060f" });
    }
  }

  private drawObstacles(g: CanvasRenderingContext2D) {
    const s = this.sprites;
    for (const o of this.obs) {
      if (o.gone) continue;
      const y = Math.round(this.sy(o.d));
      if (y < -20 || y > H + 20) continue;
      const x = Math.round(o.x);
      g.fillStyle = PALETTE.shadow;
      if (o.kind === "cone") {
        g.fillRect(x - 3, y + 2, 9, 2);
        g.drawImage(s.cone, x - 4, y - 4);
      } else if (o.kind === "tire") {
        g.fillRect(x + 1, y + 3, 8, 2);
        g.drawImage(Math.floor(o.t * 8) % 2 ? s.tireA : s.tireB, x, y - 4);
      } else if (o.kind === "bundle") {
        g.fillRect(x + 1, y + 5, 12, 2);
        g.drawImage(s.bundle, x, y - 3 + (Math.floor(this.time * 3) % 2));
      } else if (o.kind === "sprinkler") {
        g.drawImage(s.sprinkler, x, y - 2);
        if (this.sprayOn(o)) {
          const phase = this.time * 6;
          for (let k = 0; k < 14; k++) {
            const f = ((k * 0.37 + phase) % 1);
            const dx = 4 + f * o.vx;
            const dy = Math.sin(f * Math.PI) * -6 + ((k % 3) - 1) * 3;
            g.fillStyle = k % 2 ? PALETTE.cyan : PALETTE.lightBlue;
            g.fillRect(Math.round(x + dx), Math.round(y + dy), 2, 1);
          }
        } else {
          g.fillStyle = PALETTE.lightBlue;
          g.fillRect(x + 1, y - 4, 1, 1);
        }
      } else if (o.kind === "dog") {
        const run = o.dog !== "sit" && Math.floor(o.t * 10) % 2 === 0;
        const left = o.vx < 0;
        const img = left ? (run ? s.dogBFlip : s.dogAFlip) : run ? s.dogB : s.dogA;
        g.fillRect(x + 1, y + 3, 9, 2);
        g.drawImage(img, x, y - 3);
        if (o.dog === "chase" && Math.floor(this.time * 6) % 2 === 0) drawText(g, "!", x + 4, y - 11, PALETTE.yellow, { shadow: "#05060f" });
      }
    }
  }

  private drawHero(g: CanvasRenderingContext2D) {
    const s = this.sprites;
    const x = Math.round(this.bx - HERO_W / 2);
    const y = Math.round(HERO_Y - HERO_H / 2);
    if (this.crashT > 0) {
      g.drawImage(s.heroCrash, x, y + 4);
      return;
    }
    if (this.invuln > 0 && Math.floor(this.invuln * 10) % 2 === 0) return;
    g.fillStyle = PALETTE.shadow;
    g.fillRect(x + 3, y + 4, HERO_W - 4, HERO_H - 2);
    const frame = Math.floor(this.pedal / 7) % 2 === 0 ? s.heroA : s.heroB;
    g.drawImage(frame, x + Math.round(this.lean), y);
  }

  private drawPackets(g: CanvasRenderingContext2D) {
    for (const p of this.packetsInAir) {
      const k = clamp(p.t / p.dur, 0, 1);
      let tx: number, td: number;
      if (p.house) {
        tx = MAILBOX_X + 2;
        td = p.house.d;
      } else {
        tx = TARGET_XS[p.target!] - 3;
        td = this.yardD + YARD_TARGET_AHEAD;
      }
      const x = p.sx + (tx - p.sx) * k;
      const d = p.sd + (td - p.sd) * k;
      const arc = Math.sin(k * Math.PI) * 14;
      g.fillStyle = PALETTE.shadow;
      g.fillRect(Math.round(x), Math.round(this.sy(d)) + 3, 6, 2);
      g.drawImage(this.sprites.packet, Math.round(x), Math.round(this.sy(d) - arc) - 2);
    }
  }

  private drawOverlayText(g: CanvasRenderingContext2D) {
    if (this.demoMode) return;
    if (this.introT > 0 && this.phase === "ride") {
      const a = Math.min(1, this.introT * 2);
      g.globalAlpha = a;
      const w = 250;
      const x = (W - w) / 2;
      g.fillStyle = "#05060f";
      g.fillRect(x - 2, 40, w + 4, 50);
      g.fillStyle = "#0c1440";
      g.fillRect(x, 42, w, 46);
      g.fillStyle = PALETTE.red;
      g.fillRect(x, 42, w, 2);
      drawText(g, `STREET ${this.street}`, W / 2, 48, PALETTE.yellow, { scale: 2, align: "center", shadow: "#05060f" });
      drawText(g, "DELIVER ONLY TO:", W / 2, 63, PALETTE.lightBlue, { align: "center" });
      const sc = measure(this.rule.target, 2) <= w - 8 ? 2 : 1;
      drawText(g, this.rule.target, W / 2, 73, PALETTE.cyan, { scale: sc, align: "center", shadow: "#05060f" });
      g.globalAlpha = 1;
    }
    // small rule reminder at the top of the road
    if (this.phase === "ride" && this.introT <= 0) {
      const t = this.rule.target;
      const w = measure(t) + 8;
      g.fillStyle = "rgba(5,6,15,0.7)";
      g.fillRect(ROAD_R - w - 2, 2, w, 9);
      drawText(g, t, ROAD_R - w + 2, 4, PALETTE.cyan);
    }
    if (this.crashT > 0 && this.lives <= 0) {
      drawText(g, "LAST BIKE!", W / 2, 90, PALETTE.red, { scale: 2, align: "center", shadow: "#05060f" });
    }
  }
}
