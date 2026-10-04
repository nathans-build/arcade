/*
 * Splash Arc game logic (no DOM). The React layer reads `ui` and `scene` and calls the actions;
 * the canvas loop calls `tick(dt)`.
 */
import { ChipAudio, QuestionDeck, isEarlyReader, recordAnswer, submitScore, type DealtQuestion, type Grade, type Question } from "@/kit";
import { GROUND_Y, bandOf, bestAim, buildLevel, levelCount, shotBase, worldOf, type Level } from "./levels";
import { DT, MAX_ANGLE, MAX_POWER, MIN_ANGLE, MIN_POWER, PLANETS, simulate, type SimResult } from "./physics";
import { nextQuestion, targetName, type ShotQ } from "./questions";
import { makeRng, type Rng } from "./rng";
import type { Particle, Scene } from "./render";

export const GAME_ID = "splash-arc";

export type Phase = "title" | "question" | "aim" | "flight" | "result" | "pass" | "transmission" | "over";
export type PlayMode = "solo" | "pass";

export interface LogEntry {
  cat: "shot" | "trans";
  standard: string;
  skill: string;
  correct: boolean;
}

export interface Seat {
  name: string;
  score: number;
  thrown: number;
  hits: number;
  streak: number;
  bonus: number;
  log: LogEntry[];
}

export interface Hooks {
  say: (text: string) => void;
  sayQuestion: (prompt: string, choices: readonly string[]) => void;
  onChange: () => void;
}

export interface UiState {
  phase: Phase;
  grade: Grade;
  mode: PlayMode;
  seat: number;
  seats: Seat[];
  level: number;
  levels: number;
  balloons: number[];
  msg: { text: string; tone: "info" | "ok" | "no" };
  q: { q: ShotQ; picked: number | null } | null;
  trans: { q: DealtQuestion; picked: number | null } | null;
  angle: number;
  power: number;
  guide: boolean;
  hideAngle: boolean;
  levelTitle: string;
  wind: number;
  planet: string;
  targetsLeft: number;
  /** Text of the result of the last throw (shown during "result"). */
  last: string;
}

/** Points of the guide line shown after a right answer: K-2 see the whole arc. */
export function guideFraction(g: Grade): number {
  const b = bandOf(g);
  return b === "K2" ? 1 : b === "HS" ? 0.45 : 0.6;
}

/** Animation speed (simulated seconds per real second). Moon/Mars throws float slowly, so they play faster. */
function timeScale(g: Grade, lv: Level): number {
  const base = isEarlyReader(g) ? 2.2 : 2.8;
  return base * Math.sqrt(9.8 / PLANETS[lv.planet].g);
}

const blankSeat = (name: string): Seat => ({ name, score: 0, thrown: 0, hits: 0, streak: 0, bonus: 0, log: [] });

export class SplashGame {
  ui: UiState;
  lv: Level | null = null;
  fast = false;
  private deck: QuestionDeck;
  private rng: Rng;
  private runSeed = Math.floor(Math.random() * 1e9);
  private current = 0;
  private lastMiss: { target: number; side: "short" | "long" } | null = null;
  private recent: string[] = [];
  private sim: SimResult | null = null;
  private flightT = 0;
  private resultT = 0;
  private trail: [number, number][] | null = null;
  private guideCache = { key: "", pts: null as [number, number][] | null };
  private particles: Particle[] = [];
  private banner: Scene["banner"] = null;
  private time = 0;
  paused = false;

  constructor(
    private audio: ChipAudio,
    private hooks: Hooks,
    grade: Grade,
  ) {
    this.deck = new QuestionDeck(grade, "math", { gameId: GAME_ID });
    this.rng = makeRng(this.runSeed);
    this.ui = {
      phase: "title",
      grade,
      mode: "solo",
      seat: 0,
      seats: [blankSeat("Player 1")],
      level: 0,
      levels: levelCount(grade),
      balloons: [0],
      msg: { text: "", tone: "info" },
      q: null,
      trans: null,
      angle: 45,
      power: 50,
      guide: false,
      hideAngle: false,
      levelTitle: "",
      wind: 0,
      planet: "EARTH",
      targetsLeft: 4,
      last: "",
    };
  }

  private changed() {
    this.hooks.onChange();
  }

  setGrade(g: Grade) {
    this.ui.grade = g;
    this.ui.levels = levelCount(g);
    this.deck = new QuestionDeck(g, "math", { gameId: GAME_ID });
    this.changed();
  }

  setMode(m: PlayMode) {
    this.ui.mode = m;
    this.changed();
  }

  setPaused(p: boolean) {
    this.paused = p;
  }

  toTitle() {
    this.ui.phase = "title";
    this.lv = null;
    this.changed();
  }

  start() {
    this.runSeed = Math.floor(Math.random() * 1e9);
    this.rng = makeRng(this.runSeed);
    const n = this.ui.mode === "pass" ? 2 : 1;
    this.ui.seats = Array.from({ length: n }, (_, i) => blankSeat(`Player ${i + 1}`));
    this.ui.seat = 0;
    this.ui.level = 0;
    this.ui.levels = levelCount(this.ui.grade);
    this.deck = new QuestionDeck(this.ui.grade, "math", { gameId: GAME_ID });
    this.startLevel(0);
  }

  private balloonsPerLevel(): number {
    const k2 = bandOf(this.ui.grade) === "K2";
    if (this.ui.mode === "pass") return k2 ? 5 : 4;
    return k2 ? 8 : 7;
  }

  private startLevel(i: number) {
    this.ui.level = i;
    this.lv = buildLevel(this.ui.grade, i, this.runSeed);
    this.ui.balloons = this.ui.seats.map(() => this.balloonsPerLevel());
    this.ui.levelTitle = this.lv.title;
    this.ui.wind = this.lv.wind;
    this.ui.planet = PLANETS[this.lv.planet].name;
    this.ui.seat = 0;
    this.trail = null;
    this.lastMiss = null;
    this.banner = { text: `LEVEL ${i + 1}`, sub: this.lv.title + (this.lv.wind ? " · WINDY" : ""), t: this.fast ? 0.3 : 2.2 };
    this.ui.angle = 45;
    this.ui.power = 50;
    this.audio.levelUp();
    if (this.ui.mode === "pass") this.passTo(0);
    else this.newTurn();
  }

  private live(): number[] {
    return this.lv ? this.lv.targets.filter((t) => !t.watered).map((t) => t.i) : [];
  }

  private passTo(seat: number) {
    this.ui.seat = seat;
    this.ui.phase = "pass";
    this.ui.q = null;
    this.ui.msg = { text: `${this.ui.seats[seat].name}: your turn!`, tone: "info" };
    this.changed();
  }

  passReady() {
    if (this.ui.phase === "pass") this.newTurn();
  }

  private newTurn() {
    const lv = this.lv!;
    const live = this.live();
    if (!live.length || this.ui.balloons.every((b) => b <= 0)) return this.endLevel();
    // Stay on a target that was just missed most of the time (so "more/less power" makes sense).
    if (!live.includes(this.current) || !(this.lastMiss && this.lastMiss.target === this.current && this.rng() < 0.7)) {
      this.current = this.rng.pick(live);
    }
    const q = nextQuestion(
      { grade: this.ui.grade, lv, target: this.current, rng: this.rng, lastMiss: this.lastMiss, power: this.ui.power },
      this.recent,
    );
    this.recent = [q.gen, ...this.recent].slice(0, 3);
    this.current = q.target;
    if (q.preset?.angle !== undefined) this.ui.angle = q.preset.angle;
    if (q.preset?.power !== undefined) this.ui.power = q.preset.power;
    this.ui.q = { q, picked: null };
    this.ui.guide = false;
    this.ui.hideAngle = !!q.hideAngle;
    this.ui.phase = "question";
    this.ui.targetsLeft = live.length;
    this.ui.msg = { text: q.effect.type === "pick" ? "Answer to choose your target." : `Target: ${lv.targets[this.current].letter} (the ${targetName(lv.targets[this.current])}). Answer to aim.`, tone: "info" };
    this.hooks.sayQuestion(q.prompt, q.choices);
    this.changed();
  }

  /** Answer the open question (shot or transmission). */
  answer(i: number) {
    if (this.paused) return;
    if (this.ui.phase === "transmission") return this.answerTrans(i);
    const st = this.ui.q;
    if (this.ui.phase !== "question" || !st || st.picked !== null || i < 0 || i > 3) return;
    st.picked = i;
    const q = st.q;
    const right = i === q.answer;
    const seat = this.ui.seats[this.ui.seat];
    seat.log.push({ cat: "shot", standard: q.standard, skill: q.skill, correct: right });
    recordAnswer(GAME_ID, this.asKitQuestion(q), right);
    const lv = this.lv!;
    const k2 = bandOf(this.ui.grade) === "K2";
    const eff = q.effect;
    if (eff.type === "pick") {
      const t = eff.targets[i];
      const aim = bestAim(lv, t);
      this.current = t;
      this.ui.angle = aim.angle;
      if (k2) this.ui.power = aim.power;
    } else if (eff.type === "angle") this.ui.angle = eff.values[i];
    else if (eff.type === "pair") [this.ui.angle, this.ui.power] = eff.values[i];
    else if (eff.type === "power") this.ui.power = eff.values[i];
    this.ui.hideAngle = false;
    if (right) {
      this.audio.correct();
      seat.streak++;
      seat.score += 25;
      this.ui.guide = true;
      let extra = "";
      if (seat.streak % 3 === 0) {
        this.ui.balloons[this.ui.seat]++;
        seat.bonus++;
        extra = " Three in a row: BONUS BALLOON!";
      }
      this.ui.msg = { text: `Correct! Guide line on.${extra}`, tone: "ok" };
      this.hooks.say(`Correct! ${extra}`);
    } else {
      this.audio.wrong();
      seat.streak = 0;
      this.ui.guide = false;
      this.ui.msg = { text: "Not quite. Read why, then throw anyway: you can still adjust your aim.", tone: "no" };
      this.hooks.say(`Not quite. ${q.explanation}`);
    }
    this.changed();
  }

  continueQuestion() {
    if (this.ui.phase === "question" && this.ui.q && this.ui.q.picked !== null) {
      this.ui.phase = "aim";
      const t = this.lv!.targets[this.current];
      this.ui.msg = {
        text: this.ui.guide
          ? `Aim at ${t.letter}: the guide shows the start of your arc. Fine-tune power, then FIRE!`
          : `Aim at ${t.letter}: set the angle and power, then FIRE!`,
        tone: "info",
      };
      this.changed();
    }
  }

  private asKitQuestion(q: ShotQ): Question {
    const c = [...q.choices, "", "", "", ""].slice(0, 4) as Question["choices"];
    return { id: `sa-${q.gen}-${Date.now()}`, subject: "math", grade: this.ui.grade, standard: q.standard, skill: q.skill, prompt: q.prompt, choices: c, answer: q.answer, explanation: q.explanation };
  }

  setAngle(a: number) {
    if (this.ui.phase !== "aim" && !(this.ui.phase === "question" && this.ui.q?.picked !== null)) return;
    this.ui.angle = Math.max(MIN_ANGLE, Math.min(MAX_ANGLE, Math.round(a)));
    this.changed();
  }
  setPower(p: number) {
    if (this.ui.phase !== "aim" && !(this.ui.phase === "question" && this.ui.q?.picked !== null)) return;
    this.ui.power = Math.max(MIN_POWER, Math.min(MAX_POWER, Math.round(p)));
    this.changed();
  }
  nudge(da: number, dp: number) {
    if (this.ui.phase === "question" && this.ui.q?.picked !== null) this.continueQuestion();
    if (this.ui.phase !== "aim") return;
    if (da) this.setAngle(this.ui.angle + da);
    if (dp) this.setPower(this.ui.power + dp);
  }

  fire() {
    if (this.paused) return;
    if (this.ui.phase === "question" && this.ui.q?.picked !== null) this.continueQuestion();
    if (this.ui.phase !== "aim" || !this.lv) return;
    const lv = this.lv;
    this.ui.balloons[this.ui.seat]--;
    this.ui.seats[this.ui.seat].thrown++;
    this.sim = simulate(worldOf(lv), { ...shotBase(lv), angle: this.ui.angle, power: this.ui.power });
    this.flightT = 0;
    this.ui.phase = "flight";
    this.ui.msg = { text: "Splash incoming…", tone: "info" };
    this.audio.shoot();
    this.changed();
  }

  /** The guide line points for the current aim (cached). */
  private guidePts(): [number, number][] | null {
    if (!this.lv || !this.ui.guide) return null;
    const key = `${this.ui.angle}|${this.ui.power}|${this.lv.targets.map((t) => +t.watered).join("")}`;
    if (key !== this.guideCache.key) {
      const r = simulate(worldOf(this.lv), { ...shotBase(this.lv), angle: this.ui.angle, power: this.ui.power });
      const n = Math.max(2, Math.ceil(r.pts.length * guideFraction(this.ui.grade)));
      this.guideCache = { key, pts: r.pts.slice(0, n) };
    }
    return this.guideCache.pts;
  }

  /** Debug/test hook: aim exactly at the current target (used by the automated playtest). */
  debugAim() {
    if (!this.lv) return null;
    const aim = bestAim(this.lv, this.current);
    this.ui.angle = aim.angle;
    this.ui.power = aim.power;
    this.changed();
    return { ...aim, target: this.current };
  }

  /** Debug/test hook: the full predicted flight for the current aim. */
  predict(): SimResult | null {
    return this.lv ? simulate(worldOf(this.lv), { ...shotBase(this.lv), angle: this.ui.angle, power: this.ui.power }) : null;
  }

  private splash(x: number, y: number, hit: boolean) {
    for (let k = 0; k < (hit ? 26 : 14); k++) {
      const a = -Math.PI * (0.1 + 0.8 * this.rng());
      const v = 20 + 40 * this.rng();
      this.particles.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 0.6 + 0.5 * this.rng(), color: k % 3 ? "#4fc3ff" : "#f2f4ff" });
    }
  }

  private land() {
    const lv = this.lv!;
    const r = this.sim!;
    const end = r.end;
    const seat = this.ui.seats[this.ui.seat];
    this.trail = r.pts;
    if (end.kind === "target" && end.target !== undefined) {
      const t = lv.targets[end.target];
      t.watered = true;
      t.fx = 0;
      seat.hits++;
      const pts = 100 + (this.ui.guide ? 0 : 25);
      seat.score += pts;
      this.splash(end.x, end.y, true);
      this.audio.checkpoint();
      const what =
        t.kind === "fire" ? "Fizz! The campfire is out." : t.kind === "bell" ? "Ding! The bell rings." : t.kind === "egg" ? "Ahh! The dino egg cools down." : t.kind === "flower" || t.kind === "planter" ? "The garden blooms!" : t.kind === "tank" || t.kind === "container" ? "The tank fills up!" : "Splash! Painted!";
      this.ui.last = `SPLASH! ${what} +${pts}`;
      this.ui.msg = { text: `${what} +${pts}`, tone: "ok" };
      this.banner = { text: "SPLASH!", t: this.fast ? 0.2 : 1.1 };
      this.hooks.say(what);
      this.lastMiss = null;
    } else {
      this.splash(end.x, Math.min(end.y, GROUND_Y), false);
      this.audio.blip();
      const t = lv.targets[this.current];
      const side = end.kind === "out" ? (end.x < 0 ? "short" : "long") : end.x < t.x - t.w / 2 ? "short" : end.x > t.x + t.w / 2 ? "long" : null;
      this.lastMiss = side ? { target: this.current, side } : null;
      const txt = side === "short" ? "Too short! Try more power or a different angle." : side === "long" ? "Too far! Try less power." : "Missed! Check the angle.";
      this.ui.last = txt;
      this.ui.msg = { text: txt, tone: "no" };
      this.hooks.say(txt);
    }
    this.sim = null;
    this.ui.phase = "result";
    this.resultT = this.fast ? 0.15 : 1.5;
    this.ui.targetsLeft = this.live().length;
    this.changed();
  }

  private afterResult() {
    if (!this.live().length) return this.endLevel();
    if (this.ui.mode === "pass") {
      const other = 1 - this.ui.seat;
      if (this.ui.balloons[other] > 0) return this.passTo(other);
      if (this.ui.balloons[this.ui.seat] > 0) return this.newTurn();
      return this.endLevel();
    }
    this.newTurn();
  }

  private endLevel() {
    const lv = this.lv!;
    const cleared = lv.targets.every((t) => t.watered);
    this.ui.seats.forEach((s, i) => {
      const left = Math.max(0, this.ui.balloons[i]);
      s.score += left * 20 + (cleared ? 100 : 0);
    });
    this.ui.q = null;
    this.ui.trans = { q: this.deck.draw(), picked: null };
    this.ui.phase = "transmission";
    this.ui.msg = { text: cleared ? "Every target watered! Incoming transmission…" : "Out of balloons. Incoming transmission…", tone: cleared ? "ok" : "info" };
    this.audio.checkpoint();
    const tq = this.ui.trans.q;
    this.hooks.sayQuestion(tq.passage ? `${tq.passage} ${tq.prompt}` : tq.prompt, tq.choices);
    this.changed();
  }

  private answerTrans(i: number) {
    const st = this.ui.trans;
    if (!st || st.picked !== null || i < 0 || i > 3) return;
    st.picked = i;
    const right = i === st.q.answer;
    // In pass-and-play the transmission goes to the player whose turn it was.
    const seat = this.ui.seats[this.ui.seat];
    seat.log.push({ cat: "trans", standard: st.q.standard, skill: st.q.skill, correct: right });
    recordAnswer(GAME_ID, st.q, right);
    if (right) {
      seat.score += 50;
      this.audio.correct();
      this.hooks.say("Correct!");
    } else {
      this.audio.wrong();
      this.hooks.say(`Not quite. ${st.q.explanation}`);
    }
    this.changed();
  }

  continueTrans() {
    if (this.ui.phase !== "transmission" || !this.ui.trans || this.ui.trans.picked === null) return;
    this.ui.trans = null;
    if (this.ui.level + 1 < this.ui.levels) this.startLevel(this.ui.level + 1);
    else this.finish();
  }

  /** Ends the game now (also used by tests). */
  finish() {
    this.ui.phase = "over";
    this.ui.q = null;
    this.ui.trans = null;
    const best = Math.max(...this.ui.seats.map((s) => s.score));
    submitScore(GAME_ID, best);
    this.audio.gameOver();
    this.changed();
  }

  // ---------------------------------------------------------------- frame

  tick(dt: number) {
    this.time += dt;
    if (this.banner) {
      this.banner.t -= dt;
      if (this.banner.t <= 0) this.banner = null;
    }
    for (const p of this.particles) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 120 * dt;
      p.life -= dt;
    }
    this.particles = this.particles.filter((p) => p.life > 0);
    if (this.lv) for (const t of this.lv.targets) if (t.watered) t.fx += dt;
    if (this.paused) return;
    if (this.ui.phase === "flight" && this.sim && this.lv) {
      this.flightT += dt * timeScale(this.ui.grade, this.lv) * (this.fast ? 8 : 1);
      if (this.flightT >= this.sim.end.t || Math.floor(this.flightT / DT) >= this.sim.pts.length - 1) this.land();
    } else if (this.ui.phase === "result") {
      this.resultT -= dt;
      if (this.resultT <= 0) this.afterResult();
    }
  }

  scene = (): Scene => {
    const ph = this.ui.phase;
    const aiming = ph === "question" || ph === "aim" || ph === "pass";
    return {
      lv: this.lv,
      angle: this.ui.angle,
      power: this.ui.power,
      showAngle: !this.ui.hideAngle,
      protractor: bandOf(this.ui.grade) === "K2" ? "arrow" : "degrees",
      // No highlight while a "pick" question is open: it would give the answer away.
      current: ph === "transmission" || ph === "over" || (ph === "question" && this.ui.q?.picked === null && this.ui.q.q.effect.type === "pick") ? null : this.current,
      guide: (ph === "aim" || ph === "question") && this.ui.guide ? this.guidePts() : null,
      trail: this.trail,
      flight: ph === "flight" && this.sim ? { pts: this.sim.pts, i: Math.min(this.sim.pts.length - 1, Math.floor(this.flightT / DT)) } : null,
      particles: this.particles,
      banner: this.banner,
      time: this.time,
      aiming: aiming || ph === "flight",
      seat: this.ui.seat,
    };
  };
}
