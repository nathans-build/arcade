import type { ChipAudio, DealtQuestion } from "@/kit";
import { forEachPixel, hasGlyphs, rowSpan, textWidth } from "./font";
import {
  BANK_H, H, MEDIAN_H, SLOT_W, START_H, TIMER_H, W,
  bandFor, labelScale, levelSpeed, logWidth, slotAt, slotLeft, type Band,
} from "./layout";
import type { Rule, RuleItem } from "./rules";
import { HERO_H, HERO_W, PALETTE, VEHICLE_COLOR_COUNT, getSprites, vehicleSize, type SpriteSheet, type VehicleKind } from "./sprites";

export { W, H };

export type Action = "up" | "down" | "left" | "right";
type RowKind = "start" | "road" | "median" | "river" | "bank" | "home";
type Mode = "demo" | "intro" | "play" | "rescue" | "dying" | "homing" | "wrongHome" | "clear" | "checkpoint" | "over";

export interface LogItem extends RuleItem {
  match: boolean;
}

export interface Obj {
  id: number;
  x: number;
  w: number;
  h: number;
  kind: VehicleKind | "log" | "pads";
  color: number;
  item?: LogItem;
  state: "idle" | "good" | "sinking" | "gone";
  sinkT: number;
}

export interface Row {
  kind: RowKind;
  y: number;
  h: number;
  dir: 1 | -1;
  speed: number;
  track: number;
  objs: Obj[];
}

export interface HudState {
  score: number;
  lives: number;
  level: number;
  shields: number;
  maxShields: number;
  streak: number;
  /** Fraction of the attempt's time left (0-1). */
  time: number;
  target: number | null;
}

export type SlotState = "open" | "wrong" | "right";

export interface EngineCallbacks {
  /** A new level needs a rule for the logs and a question for the homes. */
  requestRound(level: number): { rule: Rule; q: DealtQuestion };
  onRoundStart(level: number, rule: Rule, q: DealtQuestion): void;
  /** The hero landed on a labelled log (`ok` = it follows the rule). */
  onLanding(rule: Rule, item: LogItem, ok: boolean): void;
  /** The hero entered a home. `first` is true for the round's first pick (the one that is recorded). */
  onHome(q: DealtQuestion, choice: number, correct: boolean, first: boolean): void;
  onTarget(choice: number | null): void;
  onMessage(text: string, tone: "good" | "bad" | "info"): void;
  onLevelClear(level: number): void;
  onGameOver(): void;
  onHud(h: HudState): void;
}

const HOP_X = 16;
const HOP_TIME = 0.13;
const LETTERS = "ABCD";

function rand(a: number, b: number) {
  return a + Math.random() * (b - a);
}
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

interface Particle { x: number; y: number; vx: number; vy: number; life: number; color: string }
interface Floater { text: string; x: number; y: number; t: number; color: string }
interface Ring { x: number; y: number; t: number }

export class LeapEngine {
  private ctx: CanvasRenderingContext2D;
  private sprites: SpriteSheet;
  private raf = 0;
  private last = 0;
  private hudTimer = 0;
  private time = 0;
  private textCache = new Map<string, HTMLCanvasElement>();

  mode: Mode = "demo";
  private userPaused = false;
  band: Band = bandFor(3);
  rows: Row[] = [];
  private nextId = 1;

  rule: Rule | null = null;
  q: DealtQuestion | null = null;
  labelScale: 1 | 2 = 1;
  private matchQ: LogItem[] = [];
  private missQ: LogItem[] = [];

  // hero
  heroX = W / 2;
  heroRow = 0;
  hop: { fx: number; fr: number; tx: number; tr: number; t: number } | null = null;
  riding: Obj | null = null;
  private queued: Action | null = null;
  private maxRow = 0;
  timeLeft = 60;

  slots: SlotState[] = ["open", "open", "open", "open"];
  reveal = false;
  answered = false;
  target: number | null = null;
  private homing: { i: number; t: number; fx: number; fy: number } | null = null;

  score = 0;
  lives = 3;
  level = 1;
  shields = 1;
  maxShields = 1;
  streak = 0;
  invuln = 0;
  private bonusShield = false;
  private modeT = 0;
  private bumpCd = 0;

  private particles: Particle[] = [];
  private floaters: Floater[] = [];
  private rings: Ring[] = [];
  private banner: { title: string; sub: string; t: number; color: string } | null = null;

  constructor(canvas: HTMLCanvasElement, private audio: ChipAudio, private cb: EngineCallbacks) {
    canvas.width = W;
    canvas.height = H;
    this.ctx = canvas.getContext("2d")!;
    this.ctx.imageSmoothingEnabled = false;
    this.sprites = getSprites();
  }

  /* ------------------------------------------------------------ lifecycle */

  start() {
    this.last = performance.now();
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - this.last) / 1000);
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

  /** Attract mode behind the title screen: traffic and labelled logs, no hero. */
  demo(grade: number, rule: Rule | null) {
    this.band = bandFor(grade);
    this.mode = "demo";
    this.userPaused = false;
    this.rule = rule;
    this.q = null;
    this.level = 1;
    this.banner = null;
    this.particles = [];
    this.floaters = [];
    this.buildRows();
  }

  newGame(grade: number) {
    this.band = bandFor(grade);
    this.score = 0;
    this.lives = this.band.lives;
    this.level = 1;
    this.streak = 0;
    this.bonusShield = false;
    this.userPaused = false;
    this.particles = [];
    this.floaters = [];
    this.startLevel();
  }

  private startLevel() {
    const { rule, q } = this.cb.requestRound(this.level);
    this.rule = rule;
    this.q = q;
    this.buildRows();
    this.slots = ["open", "open", "open", "open"];
    this.reveal = false;
    this.answered = false;
    this.target = null;
    this.cb.onTarget(null);
    this.maxShields = this.band.shields + (this.bonusShield ? 1 : 0);
    this.shields = this.maxShields;
    this.bonusShield = false;
    this.respawn();
    this.mode = "intro";
    this.modeT = 2.2;
    this.banner = { title: `LEVEL ${this.level}`, sub: rule.text, t: 2.2, color: PALETTE.yellow };
    this.cb.onRoundStart(this.level, rule, q);
    this.pushHud();
  }

  /** After the level's transmission question. */
  resolveCheckpoint(correct: boolean) {
    if (correct) {
      this.score += 250 * this.level;
      this.bonusShield = true;
    }
    this.level++;
    this.startLevel();
  }

  togglePause(force?: boolean): boolean {
    if (this.mode === "demo" || this.mode === "over" || this.mode === "checkpoint") return false;
    this.userPaused = force ?? !this.userPaused;
    return this.userPaused;
  }

  get paused() {
    return this.userPaused;
  }

  /* ------------------------------------------------------------ layout */

  private buildRows() {
    const b = this.band;
    const top: Omit<Row, "y">[] = [];
    const speedMul = levelSpeed(this.level);
    const mk = (kind: RowKind, h: number): Omit<Row, "y"> => ({ kind, h, dir: 1, speed: 0, track: W, objs: [] });
    top.push(mk("home", b.homeH));
    top.push(mk("bank", BANK_H));
    for (let i = 0; i < b.riverLanes; i++) {
      const r = mk("river", b.laneH);
      r.dir = i % 2 === 0 ? -1 : 1;
      r.speed = rand(b.river[0], b.river[1]) * speedMul;
      top.push(r);
    }
    top.push(mk("median", MEDIAN_H));
    const kinds: VehicleKind[] = ["car", "truck", "racer", "scooter", "car", "truck"];
    for (let i = 0; i < b.roadLanes; i++) {
      const r = mk("road", b.laneH);
      r.dir = i % 2 === 0 ? -1 : 1;
      const kind = kinds[(i + this.level) % kinds.length];
      const base = rand(b.road[0], b.road[1]) * speedMul;
      r.speed = kind === "racer" ? base * 1.25 : kind === "truck" ? base * 0.8 : base;
      const vs = b.laneH >= 20 ? 2 : 1;
      const raw = vehicleSize(kind);
      const size = { w: raw.w * vs, h: raw.h * vs };
      const n = Math.round(rand(b.cars[0], b.cars[1] + 0.49));
      r.track = W + 50 + size.w * 2;
      const spacing = r.track / n;
      const off = rand(0, spacing);
      for (let k = 0; k < n; k++) {
        r.objs.push({
          id: this.nextId++, x: off + k * spacing + rand(-8, 8) - 35, w: size.w, h: size.h, kind,
          color: Math.floor(Math.random() * VEHICLE_COLOR_COUNT), state: "idle", sinkT: 0,
        });
      }
      top.push(r);
    }
    top.push(mk("start", START_H));

    let y = 0;
    const rows: Row[] = top.map((r) => {
      const row = { ...r, y };
      y += r.h;
      return row;
    });
    this.rows = rows.reverse();

    // River logs with rule labels.
    const rule = this.rule;
    const labels = rule ? [...rule.matches, ...rule.misses].map((i) => i.label) : ["?"];
    this.labelScale = labelScale(labels, b);
    const logW = logWidth(labels, this.labelScale);
    if (rule) {
      this.matchQ = [];
      this.missQ = [];
    }
    let li = 0;
    for (const row of this.rows) {
      if (row.kind !== "river") continue;
      const gap = this.band.name === "k2" ? 44 : 36;
      row.track = W + logW + 60;
      const n = Math.max(3, Math.floor(row.track / (logW + gap)));
      const spacing = row.track / n;
      const off = rand(0, spacing);
      for (let k = 0; k < n; k++) {
        row.objs.push({
          id: this.nextId++, x: off + k * spacing + rand(-6, 6) - logW, w: logW, h: row.h - 4,
          kind: li % 2 === 0 ? "log" : "pads", color: 0, state: "idle", sinkT: 0,
        });
      }
      for (const o of row.objs) this.assignItem(row, o);
      li++;
    }
  }

  private rowIndex(kind: RowKind): number {
    return this.rows.findIndex((r) => r.kind === kind);
  }

  private rowCenter(i: number): number {
    const r = this.rows[i];
    return r.y + r.h / 2;
  }

  /** Gives a log a label, keeping at least one rule-follower and one rule-breaker in every lane. */
  private assignItem(row: Row, o: Obj) {
    const rule = this.rule;
    if (!rule) return;
    const others = row.objs.filter((x) => x !== o && x.item && x.state !== "gone");
    // Enough rule-followers that a kid never waits long, and always at least one to avoid.
    const matches = others.filter((x) => x.item!.match && x.state !== "sinking").length;
    const hasMiss = others.some((x) => !x.item!.match);
    const needMatches = row.objs.length >= 4 ? 2 : 1;
    let match = Math.random() < this.band.matchShare;
    if (matches < needMatches) match = true;
    else if (!hasMiss && others.length >= row.objs.length - 1) match = false;
    const visible = new Set(this.rows.flatMap((r) => r.objs.map((x) => x.item?.label)));
    const take = (): LogItem => {
      const q = match ? this.matchQ : this.missQ;
      if (q.length === 0) {
        const src = match ? rule.matches : rule.misses;
        q.push(...shuffle(src.map((it) => ({ ...it, match }))));
      }
      return q.shift()!;
    };
    let item = take();
    for (let tries = 0; tries < 4 && visible.has(item.label); tries++) {
      (match ? this.matchQ : this.missQ).push(item);
      item = take();
    }
    o.item = item;
    o.state = "idle";
    o.sinkT = 0;
  }

  /* ------------------------------------------------------------ input */

  press(a: Action) {
    if (this.userPaused) return;
    if (this.mode === "intro") {
      this.mode = "play";
      this.banner = null;
    }
    if (this.mode !== "play") return;
    if (this.hop) {
      this.queued = a;
      return;
    }
    this.startHop(a);
  }

  /** Pick a home (A-D) by key or tap. The hero leaps into it from the bank (right away if already there). */
  select(i: number) {
    if (i < 0 || i > 3 || this.userPaused) return;
    if (!["intro", "play", "rescue", "dying", "wrongHome"].includes(this.mode)) return;
    if (this.slots[i] === "wrong") {
      this.cb.onMessage(`Home ${LETTERS[i]} was already tried. Pick another home.`, "info");
      this.audio.blip();
      return;
    }
    this.target = i;
    this.cb.onTarget(i);
    this.audio.blip();
    if (this.mode === "intro") {
      this.mode = "play";
      this.banner = null;
    }
    if (this.mode === "play" && !this.hop && this.rows[this.heroRow]?.kind === "bank") this.startHoming(i);
    else this.cb.onMessage(`Home ${LETTERS[i]} locked in. Cross to the bank and you'll leap straight in!`, "info");
  }

  /** A tap on the canvas, in logical pixels. Taps on the home row pick that home. */
  tapAt(x: number, y: number) {
    const home = this.rows[this.rows.length - 1];
    if (home && y <= home.y + home.h) {
      const s = slotAt(x);
      if (s >= 0) this.select(s);
    }
  }

  private startHop(a: Action) {
    const row = this.heroRow;
    let tx = this.heroX;
    let tr = row;
    if (a === "left") tx = Math.max(8, this.heroX - HOP_X);
    if (a === "right") tx = Math.min(W - 8, this.heroX + HOP_X);
    if (a === "down") tr = Math.max(0, row - 1);
    if (a === "up") {
      if (this.rows[row + 1]?.kind === "home") {
        const s = slotAt(this.heroX);
        if (s >= 0) this.startHoming(s);
        else if (this.target !== null) this.startHoming(this.target);
        else if (this.bumpCd <= 0) {
          this.bumpCd = 1.2;
          this.audio.blip();
          this.cb.onMessage("That's a hedge! Hop under a doorway, or press A–D to choose a home.", "info");
        }
        return;
      }
      tr = Math.min(this.rows.length - 1, row + 1);
    }
    if (tx === this.heroX && tr === row) return;
    this.hop = { fx: this.heroX, fr: row, tx, tr, t: 0 };
    this.riding = null;
    this.audio.tone(a === "up" ? 520 : 420, 0.06, "square", 0.18, a === "up" ? 780 : 560);
  }

  private startHoming(i: number) {
    if (this.slots[i] === "wrong") {
      this.cb.onMessage(`Home ${LETTERS[i]} was already tried. Pick another home.`, "info");
      return;
    }
    this.hop = null;
    this.riding = null;
    this.homing = { i, t: 0, fx: this.heroX, fy: this.rowCenter(this.heroRow) };
    this.mode = "homing";
    this.audio.shoot();
  }

  /* ------------------------------------------------------------ update */

  private update(dt: number) {
    this.time += dt;
    if (this.userPaused) return;
    this.bumpCd -= dt;
    this.invuln = Math.max(0, this.invuln - dt);

    if (this.mode !== "checkpoint") {
      this.moveLanes(dt);
      this.updateEffects(dt);
    }

    switch (this.mode) {
      case "intro":
        this.modeT -= dt;
        if (this.banner) this.banner.t = this.modeT;
        if (this.modeT <= 0) {
          this.mode = "play";
          this.banner = null;
        }
        break;
      case "play":
        this.updatePlay(dt);
        break;
      case "rescue":
        this.modeT -= dt;
        this.carryHero(dt);
        if (this.modeT <= 0) {
          this.heroRow = this.rowIndex("median");
          this.heroX = Math.max(8, Math.min(W - 8, Math.round(this.heroX)));
          this.riding = null;
          this.invuln = 1;
          this.mode = "play";
        }
        break;
      case "dying":
        this.modeT -= dt;
        if (this.modeT <= 0) {
          if (this.lives <= 0) {
            this.mode = "over";
            this.audio.gameOver();
            this.cb.onGameOver();
          } else {
            this.respawn();
            this.mode = "play";
          }
        }
        break;
      case "homing": {
        const h = this.homing!;
        h.t += dt / 0.45;
        if (h.t >= 1) {
          this.homing = null;
          this.enterHome(h.i);
        }
        break;
      }
      case "wrongHome":
        this.modeT -= dt;
        if (this.modeT <= 0) {
          this.respawn();
          this.mode = "play";
        }
        break;
      case "clear":
        this.modeT -= dt;
        this.sparkle(dt);
        if (this.modeT <= 0) {
          this.mode = "checkpoint";
          this.banner = null;
          this.cb.onLevelClear(this.level);
        }
        break;
      default:
        break;
    }

    this.hudTimer -= dt;
    if (this.hudTimer <= 0) {
      this.hudTimer = 0.1;
      this.pushHud();
    }
  }

  private sparkle(dt: number) {
    if (Math.random() < dt * 30) {
      const i = this.slots.indexOf("right");
      const cx = i >= 0 ? slotLeft(i) + SLOT_W / 2 : W / 2;
      this.particles.push({ x: cx + rand(-24, 24), y: rand(4, 26), vx: rand(-20, 20), vy: rand(-30, 10), life: 0.8, color: [PALETTE.yellow, PALETTE.green, PALETTE.cyan][Math.floor(Math.random() * 3)] });
    }
  }

  private moveLanes(dt: number) {
    for (const row of this.rows) {
      if (row.kind !== "road" && row.kind !== "river") continue;
      for (const o of row.objs) {
        o.x += row.dir * row.speed * dt;
        if (o.state === "sinking") {
          o.sinkT += dt;
          if (o.sinkT > 1.1) o.state = "gone";
        }
        const margin = (row.track - W) / 2;
        let wrapped = false;
        if (row.dir > 0 && o.x > W + margin) {
          o.x -= row.track;
          wrapped = true;
        } else if (row.dir < 0 && o.x + o.w < -margin) {
          o.x += row.track;
          wrapped = true;
        }
        if (wrapped && row.kind === "river") this.assignItem(row, o);
        if (wrapped && row.kind === "road") o.color = Math.floor(Math.random() * VEHICLE_COLOR_COUNT);
      }
    }
  }

  private updatePlay(dt: number) {
    this.timeLeft -= dt;
    if (this.timeLeft <= 0) {
      this.timeLeft = 0;
      this.die("TIME'S UP!", "splat");
      return;
    }
    if (this.hop) {
      this.hop.t += dt / HOP_TIME;
      if (this.hop.t >= 1) {
        this.heroX = this.hop.tx;
        this.heroRow = this.hop.tr;
        this.hop = null;
        this.arrive();
        if (this.mode !== "play") return;
        if (this.queued) {
          const a = this.queued;
          this.queued = null;
          this.startHop(a);
        }
      }
    } else {
      this.carryHero(dt);
      if (this.mode !== "play") return;
    }
    this.checkTraffic();
  }

  /** Logs carry the hero; being carried off-screen is a splash. */
  private carryHero(dt: number) {
    const row = this.rows[this.heroRow];
    if (!this.riding || row.kind !== "river") return;
    this.heroX += row.dir * row.speed * dt;
    if (this.mode === "play" && (this.heroX < 3 || this.heroX > W - 3)) this.die("SWEPT AWAY!", "splash");
  }

  private visualRow(): number {
    if (!this.hop) return this.heroRow;
    return this.hop.t < 0.5 ? this.hop.fr : this.hop.tr;
  }

  private heroXNow(): number {
    if (!this.hop) return this.heroX;
    return this.hop.fx + (this.hop.tx - this.hop.fx) * Math.min(1, this.hop.t);
  }

  private checkTraffic() {
    if (this.invuln > 0) return;
    const row = this.rows[this.visualRow()];
    if (row.kind !== "road") return;
    const x = this.heroXNow();
    for (const o of row.objs) {
      if (x + 4 > o.x + 1 && x - 4 < o.x + o.w - 1) {
        this.die("SPLAT! Watch the traffic.", "splat");
        return;
      }
    }
  }

  private supportAt(row: Row, x: number): Obj | null {
    return row.objs.find((o) => o.state !== "gone" && o.state !== "sinking" && x >= o.x + 1 && x <= o.x + o.w - 1) ?? null;
  }

  private arrive() {
    const row = this.rows[this.heroRow];
    if (this.heroRow > this.maxRow) {
      this.score += 10;
      this.maxRow = this.heroRow;
    }
    if (row.kind !== "river") {
      this.riding = null;
      if (row.kind === "bank" && this.target !== null) this.startHoming(this.target);
      return;
    }
    const o = this.supportAt(row, this.heroX);
    if (!o || !o.item) {
      this.die("SPLASH! Land on a log.", "splash");
      return;
    }
    this.riding = o;
    if (o.state === "good") return;
    const item = o.item;
    const rule = this.rule!;
    if (item.match) {
      o.state = "good";
      this.streak++;
      const pts = 50 * Math.min(this.streak, 5);
      this.score += pts;
      this.floaters.push({ text: `✔ +${pts}`, x: this.heroX, y: row.y, t: 1, color: PALETTE.green });
      this.audio.tone(660, 0.07, "square", 0.25, 990);
      this.cb.onLanding(rule, item, true);
      return;
    }
    // Broke the rule: the log sinks.
    o.state = "sinking";
    o.sinkT = 0;
    this.streak = 0;
    this.audio.wrong();
    this.cb.onLanding(rule, item, false);
    this.rings.push({ x: this.heroX, y: this.rowCenter(this.heroRow), t: 0 });
    if (this.shields > 0) {
      this.shields--;
      this.floaters.push({ text: "SHIELD!", x: this.heroX, y: row.y, t: 1.2, color: PALETTE.cyan });
      this.mode = "rescue";
      this.modeT = 0.9;
    } else {
      this.die("SANK! That log broke the rule.", "splash", true);
    }
  }

  private die(reason: string, kind: "splat" | "splash", quiet = false) {
    this.lives--;
    this.streak = 0;
    this.hop = null;
    this.riding = null;
    this.queued = null;
    this.mode = "dying";
    this.modeT = 1.3;
    const x = this.heroXNow();
    const y = this.rowCenter(this.visualRow());
    if (kind === "splat") {
      this.audio.crash();
      for (let i = 0; i < 22; i++) this.particles.push({ x, y, vx: rand(-60, 60), vy: rand(-60, 40), life: rand(0.4, 0.9), color: [PALETTE.red, PALETTE.yellow, PALETTE.blue][i % 3] });
    } else {
      this.audio.explode();
      this.rings.push({ x, y, t: 0 }, { x, y, t: -0.25 });
      for (let i = 0; i < 14; i++) this.particles.push({ x, y, vx: rand(-40, 40), vy: rand(-70, -20), life: rand(0.4, 0.8), color: i % 2 ? PALETTE.white : PALETTE.waterLight });
    }
    if (!quiet) this.cb.onMessage(reason, "bad");
    this.floaters.push({ text: this.lives > 0 ? "OUCH!" : "GAME OVER", x, y: y - 10, t: 1.2, color: PALETTE.red });
    this.pushHud();
  }

  private respawn() {
    this.heroRow = 0;
    this.heroX = W / 2;
    this.hop = null;
    this.riding = null;
    this.queued = null;
    this.maxRow = 0;
    this.timeLeft = this.band.time;
    this.invuln = 0.6;
  }

  private enterHome(i: number) {
    const q = this.q!;
    const first = !this.answered;
    this.answered = true;
    const correct = i === q.answer;
    this.cb.onHome(q, i, correct, first);
    this.heroX = slotLeft(i) + SLOT_W / 2;
    this.heroRow = this.rows.length - 1;
    if (correct) {
      this.slots[i] = "right";
      const bonus = (first ? 500 : 100) + Math.round(this.timeLeft * 5);
      this.score += bonus;
      this.streak++;
      this.mode = "clear";
      this.modeT = 1.8;
      this.audio.levelUp();
      this.banner = { title: "HOME SAFE!", sub: `+${bonus}`, t: 1.8, color: PALETTE.green };
      this.target = null;
      this.cb.onTarget(null);
    } else {
      this.slots[i] = "wrong";
      this.reveal = true;
      this.target = null;
      this.cb.onTarget(null);
      this.streak = 0;
      this.audio.wrong();
      this.mode = "wrongHome";
      this.modeT = 1.6;
      this.banner = { title: "WRONG HOME!", sub: `HEAD FOR HOME ${LETTERS[q.answer]}`, t: 1.6, color: PALETTE.red };
    }
    this.pushHud();
  }

  private updateEffects(dt: number) {
    for (const p of this.particles) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 80 * dt;
      p.life -= dt;
    }
    this.particles = this.particles.filter((p) => p.life > 0);
    for (const f of this.floaters) {
      f.y -= 14 * dt;
      f.t -= dt;
    }
    this.floaters = this.floaters.filter((f) => f.t > 0);
    for (const r of this.rings) r.t += dt;
    this.rings = this.rings.filter((r) => r.t < 0.9);
    if (this.banner && this.mode !== "intro") {
      this.banner.t -= dt;
      if (this.banner.t <= 0) this.banner = null;
    }
  }

  private pushHud() {
    this.cb.onHud({
      score: this.score,
      lives: this.lives,
      level: this.level,
      shields: this.shields,
      maxShields: this.maxShields,
      streak: this.streak,
      time: this.band.time ? this.timeLeft / this.band.time : 1,
      target: this.target,
    });
  }

  /* ------------------------------------------------------------ drawing */

  private textCanvas(s: string, color: string, scale: number, shadow: string | null): HTMLCanvasElement {
    const key = `${s}|${color}|${scale}|${shadow}`;
    let c = this.textCache.get(key);
    if (c) return c;
    const [lo, hi] = rowSpan(s);
    const w = textWidth(s, scale) + 1;
    const h = (hi - lo + 1) * scale + 1;
    c = document.createElement("canvas");
    c.width = Math.max(1, w);
    c.height = Math.max(1, h);
    const g = c.getContext("2d")!;
    const plot = (dx: number, dy: number, col: string) => {
      g.fillStyle = col;
      forEachPixel(s, (x, y) => g.fillRect(x * scale + dx, (y - lo) * scale + dy, scale, scale));
    };
    if (shadow) plot(1, 1, shadow);
    plot(0, 0, color);
    if (this.textCache.size > 600) this.textCache.clear();
    this.textCache.set(key, c);
    return c;
  }

  /** Draws bitmap text centred on (cx, cy). */
  private text(s: string, cx: number, cy: number, color: string, scale = 1, shadow: string | null = "#05060f") {
    const c = this.textCanvas(s, color, scale, shadow);
    this.ctx.drawImage(c, Math.round(cx - (c.width - 1) / 2), Math.round(cy - (c.height - 1) / 2));
  }

  private draw() {
    const ctx = this.ctx;
    ctx.fillStyle = PALETTE.navy;
    ctx.fillRect(0, 0, W, H);
    for (let i = 0; i < this.rows.length; i++) this.drawRow(this.rows[i]);
    this.drawHome();
    for (const row of this.rows) {
      if (row.kind === "road") for (const o of row.objs) this.drawVehicle(row, o);
    }
    this.drawRings();
    if (this.mode !== "demo") this.drawHero();
    for (const p of this.particles) {
      ctx.fillStyle = p.color;
      ctx.fillRect(Math.round(p.x), Math.round(p.y), 2, 2);
    }
    for (const f of this.floaters) this.text(f.text, f.x, f.y, f.color);
    this.drawTimer();
    if (this.banner) this.drawBanner();
    if (this.userPaused) {
      ctx.fillStyle = "rgba(10,15,46,0.55)";
      ctx.fillRect(0, 0, W, H);
    }
  }

  private drawRow(row: Row) {
    const ctx = this.ctx;
    const { y, h } = row;
    switch (row.kind) {
      case "start":
      case "median": {
        ctx.fillStyle = PALETTE.walk;
        ctx.fillRect(0, y, W, h);
        ctx.fillStyle = PALETTE.walkLine;
        for (let x = 0; x < W; x += 16) ctx.fillRect(x, y, 1, h);
        ctx.fillRect(0, y, W, 1);
        ctx.fillRect(0, y + h - 1, W, 1);
        break;
      }
      case "road": {
        ctx.fillStyle = PALETTE.road;
        ctx.fillRect(0, y, W, h);
        ctx.fillStyle = PALETTE.roadLine;
        for (let x = 0; x < W; x += 16) ctx.fillRect(x, y + h - 1, 8, 1);
        break;
      }
      case "river": {
        ctx.fillStyle = PALETTE.water;
        ctx.fillRect(0, y, W, h);
        ctx.fillStyle = PALETTE.waterDark;
        ctx.fillRect(0, y + h - 1, W, 1);
        ctx.fillStyle = PALETTE.waterLight;
        const shift = (this.time * row.speed * row.dir * 0.5) % 24;
        for (let x = -24; x < W + 24; x += 24) {
          ctx.fillRect(Math.round(x + shift), y + 3, 6, 1);
          ctx.fillRect(Math.round(x + shift + 12), y + h - 5, 5, 1);
        }
        for (const o of row.objs) this.drawLog(row, o);
        break;
      }
      case "bank": {
        ctx.fillStyle = PALETTE.grass;
        ctx.fillRect(0, y, W, h);
        ctx.fillStyle = PALETTE.grassLight;
        for (let x = 3; x < W; x += 11) ctx.fillRect(x, y + 3 + ((x * 7) % 5), 1, 2);
        break;
      }
      case "home":
        break;
    }
  }

  private drawLog(row: Row, o: Obj) {
    if (o.state === "gone") return;
    const ctx = this.ctx;
    const x = Math.round(o.x);
    let y = row.y + 2;
    const h = row.h - 4;
    let alpha = 1;
    if (o.state === "sinking") {
      y += Math.min(h - 2, Math.round(o.sinkT * 8));
      alpha = Math.max(0.15, 1 - o.sinkT);
    }
    ctx.globalAlpha = alpha;
    if (o.kind === "log") {
      ctx.fillStyle = PALETTE.logDark;
      ctx.fillRect(x + 1, y, o.w - 2, h);
      ctx.fillRect(x, y + 1, o.w, h - 2);
      ctx.fillStyle = PALETTE.log;
      ctx.fillRect(x + 1, y + 1, o.w - 2, h - 2);
      ctx.fillStyle = PALETTE.logLight;
      ctx.fillRect(x + 2, y + 1, o.w - 4, 1);
      ctx.fillStyle = PALETTE.logDark;
      for (let k = 8; k < o.w - 6; k += 13) ctx.fillRect(x + k, y + h - 3, 4, 1);
      // ring ends
      ctx.fillStyle = PALETTE.logLight;
      ctx.fillRect(x + 1, y + 2, 2, h - 4);
      ctx.fillRect(x + o.w - 3, y + 2, 2, h - 4);
    } else {
      // A raft of lily pads
      const pad = this.sprites.pad;
      ctx.fillStyle = PALETTE.padDark;
      ctx.fillRect(x + 2, y + 2, o.w - 4, h - 4);
      for (let k = 0; k + 6 < o.w; k += 10) {
        ctx.drawImage(pad, x + k, y + Math.round((h - pad.height) / 2), Math.min(12, o.w - k), pad.height);
      }
      ctx.fillStyle = PALETTE.padDark;
      ctx.fillRect(x + 3, y + 3, o.w - 6, h - 6);
    }
    // Plate behind the label so it always reads
    if (o.item) {
      const good = o.state === "good";
      const sink = o.state === "sinking";
      const plate = good ? "#0d3a22" : sink ? "#3a0d12" : "#1a1030";
      ctx.fillStyle = plate;
      const tw = textWidth(o.item.label, this.labelScale);
      const [lo, hi] = rowSpan(o.item.label);
      const th = (hi - lo + 1) * this.labelScale;
      const pw = Math.min(o.w - 4, tw + 6);
      const ph = Math.min(h - 2, th + 4);
      ctx.fillRect(Math.round(x + o.w / 2 - pw / 2), Math.round(y + h / 2 - ph / 2), pw, ph);
      if (good) {
        ctx.fillStyle = PALETTE.green;
        ctx.fillRect(x, y - 1, o.w, 1);
        ctx.fillRect(x, y + h, o.w, 1);
      }
      this.text(o.item.label, x + o.w / 2, y + h / 2, good ? PALETTE.green : sink ? "#ff9aa0" : PALETTE.white, this.labelScale, null);
    }
    ctx.globalAlpha = 1;
  }

  private drawVehicle(row: Row, o: Obj) {
    const img = this.sprites.vehicles[o.kind as VehicleKind][o.color][row.dir > 0 ? 0 : 1];
    this.ctx.drawImage(img, Math.round(o.x), Math.round(row.y + (row.h - o.h) / 2), o.w, o.h);
  }

  private drawHome() {
    const ctx = this.ctx;
    const row = this.rows[this.rows.length - 1];
    if (!row) return;
    const { y, h } = row;
    // Hedge wall
    ctx.fillStyle = PALETTE.hedge;
    ctx.fillRect(0, y, W, h);
    ctx.fillStyle = PALETTE.hedgeLight;
    for (let x = 0; x < W; x += 6) for (let yy = y + 2; yy < y + h; yy += 5) ctx.fillRect(x + ((yy / 5) % 2) * 3, yy, 2, 1);
    const q = this.q;
    const blink = Math.floor(this.time * 4) % 2 === 0;
    for (let i = 0; i < 4; i++) {
      const sx = slotLeft(i);
      const state = this.slots[i];
      const isTarget = this.target === i;
      const isAnswer = q && this.reveal && i === q.answer && state !== "right";
      // Label strip (answer text)
      ctx.fillStyle = "#08301a";
      ctx.fillRect(sx, y + 1, SLOT_W, 10);
      // Doorway
      const dy = y + 12;
      const dh = h - 13;
      ctx.fillStyle = state === "wrong" ? "#3a0d12" : state === "right" ? "#0d3a22" : PALETTE.navy;
      ctx.fillRect(sx + 6, dy, SLOT_W - 12, dh);
      // Web in the doorway
      ctx.fillStyle = "#1c2a78";
      const cx = sx + SLOT_W / 2;
      ctx.fillRect(cx, dy, 1, dh);
      ctx.fillRect(sx + 6, dy + Math.floor(dh / 2), SLOT_W - 12, 1);
      let frame: string | null = null;
      if (isTarget) frame = blink ? PALETTE.cyan : PALETTE.white;
      if (isAnswer) frame = blink ? PALETTE.green : PALETTE.yellow;
      if (state === "right") frame = PALETTE.green;
      if (state === "wrong") frame = PALETTE.red;
      if (frame) {
        ctx.fillStyle = frame;
        ctx.fillRect(sx + 5, dy - 1, SLOT_W - 10, 1);
        ctx.fillRect(sx + 5, dy - 1, 1, dh + 1);
        ctx.fillRect(sx + SLOT_W - 6, dy - 1, 1, dh + 1);
      }
      // Letter badge
      const letterColor = state === "wrong" ? PALETTE.red : state === "right" ? PALETTE.green : isTarget ? PALETTE.cyan : PALETTE.yellow;
      if (q && state !== "right") this.text(state === "wrong" ? "✘" : LETTERS[i], cx, dy + dh / 2, letterColor, 2);
      // Answer text
      if (q) {
        const choice = q.choices[i];
        const col = state === "wrong" ? "#ff9aa0" : isAnswer || state === "right" ? PALETTE.green : PALETTE.white;
        if (hasGlyphs(choice) && textWidth(choice) <= SLOT_W - 2) this.text(choice, cx, y + 6, col, 1);
        else {
          ctx.fillStyle = col;
          ctx.font = '9px "VT323", ui-monospace, monospace';
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(choice, cx, y + 6.5, SLOT_W - 2);
        }
      }
      if (state === "right") this.drawHeroAt(cx, dy + dh / 2 + 1, false);
    }
  }

  private drawHeroAt(cx: number, cy: number, hopping: boolean) {
    const img = hopping ? this.sprites.heroHop : this.sprites.hero;
    this.ctx.drawImage(img, Math.round(cx - HERO_W / 2), Math.round(cy - HERO_H / 2));
  }

  private drawHero() {
    if (this.mode === "over" || this.mode === "checkpoint" || this.mode === "clear") return;
    if (this.mode === "dying") return;
    if (this.invuln > 0 && Math.floor(this.time * 12) % 2 === 0 && this.mode === "play") return;
    if (this.mode === "homing" && this.homing) {
      const h = this.homing;
      const tx = slotLeft(h.i) + SLOT_W / 2;
      const home = this.rows[this.rows.length - 1];
      const ty = home.y + home.h - 8;
      const t = Math.min(1, h.t);
      const x = h.fx + (tx - h.fx) * t;
      const y = h.fy + (ty - h.fy) * t - Math.sin(Math.PI * t) * 12;
      // web line from the doorway
      this.ctx.fillStyle = PALETTE.white;
      const steps = 12;
      for (let k = 0; k <= steps; k++) this.ctx.fillRect(Math.round(x + ((tx - x) * k) / steps), Math.round(y + ((home.y + 12 - y) * k) / steps), 1, 1);
      this.drawHeroAt(x, y, true);
      return;
    }
    if (this.mode === "wrongHome") return;
    let x = this.heroX;
    let y = this.rowCenter(this.heroRow);
    let hopping = false;
    if (this.hop) {
      const t = Math.min(1, this.hop.t);
      x = this.hop.fx + (this.hop.tx - this.hop.fx) * t;
      y = this.rowCenter(this.hop.fr) + (this.rowCenter(this.hop.tr) - this.rowCenter(this.hop.fr)) * t - Math.sin(Math.PI * t) * 4;
      hopping = true;
    }
    if (this.mode === "rescue") {
      // Hero bounces up on a web line while the log sinks under him.
      y -= Math.sin(Math.min(1, (0.9 - this.modeT) / 0.9) * Math.PI) * 6;
      this.ctx.fillStyle = PALETTE.cyan;
      this.ctx.fillRect(Math.round(x) - 7, Math.round(y) - 8, 14, 1);
      this.ctx.fillRect(Math.round(x) - 7, Math.round(y) + 7, 14, 1);
      hopping = true;
    }
    this.drawHeroAt(x, y, hopping);
  }

  private drawRings() {
    const ctx = this.ctx;
    ctx.fillStyle = PALETTE.white;
    for (const r of this.rings) {
      if (r.t < 0) continue;
      const rad = 3 + r.t * 14;
      for (let a = 0; a < 16; a++) {
        const ang = (a / 16) * Math.PI * 2;
        ctx.fillRect(Math.round(r.x + Math.cos(ang) * rad), Math.round(r.y + Math.sin(ang) * rad * 0.5), 1, 1);
      }
    }
  }

  private drawTimer() {
    const ctx = this.ctx;
    const y = H - TIMER_H;
    ctx.fillStyle = "#05060f";
    ctx.fillRect(0, y, W, TIMER_H);
    if (this.mode === "demo") return;
    const f = this.band.time ? Math.max(0, this.timeLeft / this.band.time) : 1;
    ctx.fillStyle = f > 0.5 ? PALETTE.yellow : f > 0.25 ? "#ff9a3a" : PALETTE.red;
    ctx.fillRect(1, y + 1, Math.round((W - 2) * f), TIMER_H - 2);
  }

  private drawBanner() {
    const b = this.banner!;
    const ctx = this.ctx;
    const early = this.band.name === "k2";
    const subScale = early && textWidth(b.sub, 2) <= W - 24 ? 2 : 1;
    const titleW = textWidth(b.title, 2);
    const subW = textWidth(b.sub, subScale);
    const bw = Math.min(W - 8, Math.max(titleW, subW) + 20);
    const bh = 18 + 8 * subScale + 6;
    const bx = Math.round((W - bw) / 2);
    const by = Math.round(H / 2 - bh / 2 - 10);
    ctx.fillStyle = "rgba(5,6,15,0.85)";
    ctx.fillRect(bx, by, bw, bh);
    ctx.fillStyle = b.color;
    ctx.fillRect(bx, by, bw, 1);
    ctx.fillRect(bx, by + bh - 1, bw, 1);
    ctx.fillRect(bx, by, 1, bh);
    ctx.fillRect(bx + bw - 1, by, 1, bh);
    this.text(b.title, W / 2, by + 9, b.color, 2);
    this.text(b.sub, W / 2, by + 20 + 3 * subScale, PALETTE.white, subScale);
  }
}
