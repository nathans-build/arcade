/*
 * Trail Ledger's game flow. No DOM: React reads `game` after every `onChange`, the canvas reads
 * it every frame, and tests drive it headless with a bot.
 *
 *   select → intro (museum guide) → outfit (store + money math) → landmark 0 (reading +
 *   questions) → travel legs [events, a forecast math question, work stops] → landmark →
 *   transmission (checkpoint question) → … → arrived → report
 *
 * Steps that interrupt travel are queued; `advance()` runs the next one, or returns to travel.
 * Only the calendar can stop an expedition early ("wintered"): the player retries the leg from
 * the checkpoint saved when it began.
 */
import type { Grade } from "@/kit/types";
import { EXP_BY_ID } from "@/data/expeditions";
import { bandOf } from "@/data/standards";
import type { Band, Choice, Effect, EventCard, Expedition, ExpeditionId, Needs } from "@/data/types";
import {
  applyEffect, canAfford, cloneSim, dailyFood, dateOf, dollars, forecast, isLate, legCost, newSim,
  nextLeg, payLegCost, travelDay, workStop, canResupply, resupplyStop, type SimState,
} from "@/sim/sim";
import type { OutfitCtx } from "@/sim/trailmath";
import { dealWith, rng, type TLQuestion } from "./question";
import { QuestionSource, type QuestionHooks } from "./questions";

export type Phase =
  | "select" | "intro" | "outfit" | "question" | "landmark" | "travel" | "event" | "outcome"
  | "notice" | "fork" | "wintered" | "arrived" | "report";

export type Purpose = "outfit" | "forecast" | "landmark" | "transmission";

export interface Asking {
  q: TLQuestion;
  purpose: Purpose;
  picked: number | null;
  /** Grade 5: a first wrong answer shows a hint and greys out that choice. */
  struck: number[];
  hintShown: boolean;
  done: boolean;
  correct: boolean;
  penalty: string;
  /** Transmission header (letter, wire …). */
  header?: { kind: string; from: string; text: string };
  landmarkIndex?: number;
}

export interface LogEntry {
  standard: string;
  skill: string;
  subject: string;
  source: TLQuestion["source"];
  purpose: Purpose;
  correct: boolean;
  preview: boolean;
}

export interface JournalLine {
  day: number;
  text: string;
}

export interface Shown {
  card: EventCard;
  choices: { c: Choice; i: number; enabled: boolean }[];
}

interface Scheduled {
  mile: number;
  kind: "event" | "forecast";
  card?: EventCard;
}

interface Checkpoint {
  sim: SimState;
  used: string[];
  journal: number;
}

export interface GameHooks extends QuestionHooks {
  onAnswer?: (q: TLQuestion, correct: boolean) => void;
  onChange?: () => void;
  sound?: (s: "correct" | "wrong" | "blip" | "checkpoint" | "arrive" | "late") => void;
  say?: (text: string) => void;
}

export const DAY_SECONDS = 0.5;

/** Strip resources a band doesn't track (grade 5: no parts, morale or trade; 6–8: no trade). */
export function bandEffect(e: Effect, band: Band): Effect {
  const out: Effect = { ...e };
  if (band === 0) {
    delete out.parts;
    delete out.morale;
    delete out.trade;
  } else if (band === 1) delete out.trade;
  return out;
}

export function bandNeeds(n: Needs | undefined, band: Band): Needs | undefined {
  if (!n) return n;
  const out: Needs = { ...n };
  if (band === 0) {
    delete out.parts;
    delete out.trade;
  } else if (band === 1) delete out.trade;
  return out;
}

export function eventsPerLeg(band: Band, leg: number): number {
  return band === 0 ? 1 : band === 1 ? 2 : leg % 2 === 0 ? 3 : 2;
}

export class Game {
  grade: Grade;
  band: Band;
  phase: Phase = "select";
  exp: Expedition | null = null;
  sim!: SimState;
  basket: Record<string, number> = {};
  asking: Asking | null = null;
  shown: Shown | null = null;
  outcome = "";
  notice: { title: string; text: string; tone: "info" | "warn" | "good" } | null = null;
  /** Landmark being visited (index into exp.landmarks). */
  at = 0;
  log: LogEntry[] = [];
  journal: JournalLine[] = [];
  score = 0;
  retries = 0;
  ended = false;
  /** Visual only: how far the travel strip has scrolled. */
  scroll = 0;
  fast = false;
  paused = false;

  private rand: () => number;
  private qs!: QuestionSource;
  private queue: (() => void)[] = [];
  private schedule: Scheduled[] = [];
  private usedEvents = new Set<string>();
  private checkpoints: Checkpoint[] = [];
  private acc = 0;
  private dayPenaltyUsed = false;

  constructor(grade: Grade, private hooks: GameHooks = {}, public seed = Math.floor(Math.random() * 1e9)) {
    this.grade = grade;
    this.band = bandOf(grade);
    this.rand = rng(seed);
  }

  private changed() {
    this.hooks.onChange?.();
  }

  setGrade(g: Grade) {
    this.grade = g;
    this.band = bandOf(g);
    this.toSelect();
  }

  toSelect() {
    this.phase = "select";
    this.exp = null;
    this.asking = null;
    this.shown = null;
    this.notice = null;
    this.queue = [];
    this.changed();
  }

  /* ------------------------------------------------------------------ setup */

  choose(id: ExpeditionId) {
    const exp = EXP_BY_ID[id];
    this.exp = exp;
    this.sim = newSim(exp, this.band);
    this.qs = new QuestionSource(this.grade, id, this.rand, this.hooks);
    this.basket = {};
    for (const it of this.storeItems()) this.basket[it.id] = it.rec[this.band];
    this.log = [];
    this.journal = [];
    this.score = 0;
    this.retries = 0;
    this.ended = false;
    this.usedEvents.clear();
    this.checkpoints = [];
    this.queue = [];
    this.at = 0;
    this.phase = "intro";
    this.hooks.say?.(exp.guide.intro);
    this.changed();
  }

  storeItems() {
    return this.exp ? this.exp.store.filter((s) => (s.minBand ?? 0) <= this.band) : [];
  }

  basketCost(): number {
    return this.storeItems().reduce((s, it) => s + it.price * (this.basket[it.id] ?? 0), 0);
  }

  basketWeight(): number {
    return this.storeItems().reduce((s, it) => s + it.weight * (this.basket[it.id] ?? 0), 0);
  }

  budget(): number {
    return this.exp ? this.exp.budget[this.band] : 0;
  }

  /** Grades 9–12 must respect the wagon's load limit. */
  overweight(): boolean {
    return this.band === 2 && this.basketWeight() > this.exp!.weightLimit;
  }

  canBuy(id: string, delta: number): boolean {
    const it = this.storeItems().find((s) => s.id === id);
    if (!it) return false;
    const q = (this.basket[id] ?? 0) + delta;
    if (q < 0 || q > it.max) return false;
    if (delta > 0 && this.basketCost() + it.price * delta > this.budget()) return false;
    return true;
  }

  buy(id: string, delta: number) {
    if (this.phase !== "outfit" || !this.canBuy(id, delta)) return;
    this.basket[id] = (this.basket[id] ?? 0) + delta;
    this.hooks.sound?.("blip");
    this.changed();
  }

  /** Food in the basket, in days at the normal ration (for the store's hint). */
  basketFoodDays(): number {
    const food = this.storeItems().reduce((s, it) => s + (it.gives.food ?? 0) * (this.basket[it.id] ?? 0), 0);
    return Math.floor(food / dailyFood(this.sim, this.exp!));
  }

  finishOutfit(): boolean {
    if (this.phase !== "outfit" || this.overweight() || this.basketCost() > this.budget()) return false;
    const exp = this.exp!;
    this.sim.res.money = this.budget() - this.basketCost();
    for (const it of this.storeItems()) {
      const n = this.basket[it.id] ?? 0;
      for (let k = 0; k < n; k++) {
        const g = bandEffect(it.gives, this.band);
        if (g.food) this.sim.res.food += g.food;
        if (g.parts) this.sim.res.parts += g.parts;
        if (g.trade) this.sim.res.trade += g.trade;
        if (g.morale) this.sim.res.morale = Math.min(100, this.sim.res.morale + g.morale);
      }
    }
    this.jot(`Outfitted at ${exp.landmarks[0].name}: spent ${dollars(this.basketCost())}, ${dollars(this.sim.res.money)} left.`);
    const ctx: OutfitCtx = {
      items: this.storeItems().map((it) => ({ name: it.name, unit: it.unit, price: it.price, qty: this.basket[it.id] ?? 0 })).filter((l) => l.price > 0),
      budget: this.budget(),
      foodUnit: exp.units.food,
      where: exp.landmarks[0].name,
    };
    this.queue = [() => this.ask(this.qs.outfit(ctx), "outfit"), () => this.visitLandmark(0)];
    this.advance();
    return true;
  }

  begin() {
    if (this.phase !== "intro") return;
    this.phase = "outfit";
    this.changed();
  }

  /* ------------------------------------------------------------------ flow */

  /** Runs the next queued step, or goes back to the trail. */
  advance() {
    this.asking = null;
    this.shown = null;
    this.notice = null;
    const next = this.queue.shift();
    if (next) {
      next();
      this.changed();
      return;
    }
    if (this.ended) return;
    if (this.exp && isLate(this.sim, this.exp)) return this.winter();
    this.phase = "travel";
    this.changed();
  }

  private jot(text: string) {
    this.journal.push({ day: this.sim.day, text });
  }

  dateLabel(day = this.sim.day) {
    return this.exp ? dateOf(this.exp, day).label : "";
  }

  private ask(q: TLQuestion, purpose: Purpose, extra: Partial<Asking> = {}) {
    this.asking = { q: dealWith(q, this.rand), purpose, picked: null, struck: [], hintShown: false, done: false, correct: false, penalty: "", ...extra };
    this.phase = "question";
    const passage = q.passage ? `${q.passage} ` : "";
    this.hooks.say?.(`${extra.header ? `${extra.header.text} ` : ""}${passage}${q.prompt} ${this.asking.q.choices.map((c, i) => `${"ABCD"[i]}: ${c}.`).join(" ")}`);
  }

  answer(i: number) {
    const a = this.asking;
    if (this.phase !== "question" || !a || a.done || i < 0 || i > 3 || a.struck.includes(i)) return;
    const right = i === a.q.answer;
    const first = !a.hintShown;
    a.picked = i;
    if (right) {
      a.done = true;
      a.correct = first;
      if (first) {
        this.score += 100;
        if (this.band >= 1) applyEffect(this.sim, this.exp!, { morale: 2 });
      } else this.score += 40;
      this.hooks.sound?.("correct");
    } else if (this.band === 0 && first) {
      // Grade 5: a hint first, then the answer is shown. No penalties.
      a.hintShown = true;
      a.struck.push(i);
      this.hooks.sound?.("wrong");
    } else {
      a.done = true;
      a.correct = false;
      a.penalty = this.penalize();
      this.hooks.sound?.("wrong");
    }
    if (a.done || a.hintShown) {
      if (first || a.done) {
        if (first) {
          this.log.push({ standard: a.q.standard, skill: a.q.skill, subject: a.q.subject, source: a.q.source, purpose: a.purpose, correct: right, preview: !!a.q.preview });
          this.hooks.onAnswer?.(a.q, right);
        }
      }
    }
    this.changed();
  }

  /** Small penalty for a wrong answer (grades 6–12). Returns the text shown. */
  private penalize(): string {
    if (this.band === 0) return "";
    if (this.band === 1) {
      const food = Math.round(dailyFood(this.sim, this.exp!));
      applyEffect(this.sim, this.exp!, { food: -food });
      return `Penalty: ${food} ${this.exp!.units.food} of food spoiled while you rechecked the Ledger.`;
    }
    const food = Math.round(dailyFood(this.sim, this.exp!));
    if (this.dayPenaltyUsed) {
      applyEffect(this.sim, this.exp!, { food: -food });
      return `Penalty: ${food} ${this.exp!.units.food} of food lost while you rework your numbers.`;
    }
    // At most one lost day per stop or leg, so mistakes hurt without making the trip impossible.
    this.dayPenaltyUsed = true;
    applyEffect(this.sim, this.exp!, { days: 1 });
    return "Penalty: one day lost to the mistake. The calendar is tighter in grades 9–12.";
  }

  /** Continue after a question's feedback. */
  continueQuestion() {
    if (this.phase !== "question" || !this.asking?.done) return;
    this.advance();
  }

  /* ------------------------------------------------------------------ landmarks */

  private visitLandmark(i: number) {
    const exp = this.exp!;
    const lm = exp.landmarks[i];
    this.at = i;
    this.dayPenaltyUsed = false;
    if (i > 0) {
      this.jot(`Reached ${lm.name} (mile ${lm.mile.toLocaleString("en-US")}).`);
      this.hooks.sound?.("checkpoint");
    }
    if (lm.stay) applyEffect(this.sim, exp, { days: lm.stay });
    this.phase = "landmark";
    const p = lm.read[this.band];
    this.hooks.say?.(`${lm.name}. ${p.text}${p.excerpt ? ` ${p.excerpt.quote}` : ""}`);
    const qs = this.qs.landmark(lm.id, i);
    const steps: (() => void)[] = qs.map((q) => () => this.ask(q, "landmark", { landmarkIndex: i }));
    if (i > 0) {
      const t = exp.transmissions[i - 1];
      steps.push(() => this.ask(this.qs.transmission(), "transmission", { header: t }));
    }
    const last = i === exp.landmarks.length - 1;
    if (last) steps.push(() => this.arrive());
    else if (lm.canEnd) steps.push(() => this.openFork());
    else steps.push(() => this.depart());
    this.queue = steps;
    this.changed();
  }

  /** Continue from the landmark reading. */
  continueLandmark() {
    if (this.phase !== "landmark") return;
    this.advance();
  }

  private openFork() {
    this.phase = "fork";
  }

  /** At a landmark where the journey may end: settle here (true) or go on (false). */
  fork(settle: boolean) {
    if (this.phase !== "fork") return;
    if (settle) this.queue = [() => this.arrive()];
    else this.queue = [() => this.depart()];
    this.advance();
  }

  private depart() {
    const exp = this.exp!;
    if (this.at > 0) nextLeg(this.sim, exp);
    // Not enough money for the fare, ferry or toll: stop and work first.
    const steps: (() => void)[] = [];
    let guard = 0;
    while (legCost(this.sim, exp) > this.sim.res.money && guard++ < 20) {
      workStop(this.sim, exp);
      steps.push(this.workNotice(`You need ${dollars(legCost(this.sim, exp))} for the ${exp.legs[this.sim.leg].cost!.label.split(" (")[0].toLowerCase()}.`));
    }
    const cost = exp.legs[this.sim.leg].cost;
    if (cost) {
      payLegCost(this.sim, exp);
      this.jot(`Paid ${dollars(cost.money)}: ${cost.label}.`);
    }
    this.checkpoints.push({ sim: cloneSim(this.sim), used: [...this.usedEvents], journal: this.journal.length });
    this.planLeg();
    this.dayPenaltyUsed = false;
    this.jot(`Set out for ${exp.landmarks[this.sim.leg + 1].name.replace(/\.$/, "")}.`);
    this.queue = steps;
    this.advance();
  }

  private planLeg() {
    const exp = this.exp!;
    const leg = this.sim.leg;
    const miles = exp.legs[leg].miles;
    const pool = exp.events.filter((e) => e.legs.includes(leg) && (e.minBand ?? 0) <= this.band && !this.usedEvents.has(e.id));
    const n = Math.min(eventsPerLeg(this.band, leg), pool.length);
    const picks: EventCard[] = [];
    for (let k = 0; k < n; k++) picks.push(pool.splice(Math.floor(this.rand() * pool.length), 1)[0]);
    this.schedule = picks.map((card, k) => ({ mile: Math.max(1, Math.round((miles * (k + 1)) / (n + 2))), kind: "event" as const, card }));
    this.schedule.push({ mile: Math.max(1, Math.round(miles * ((n + 1) / (n + 2)) - 1)), kind: "forecast" });
    this.schedule.sort((a, b) => a.mile - b.mile);
  }

  /* ------------------------------------------------------------------ travel */

  setPace(i: number) {
    if (!this.exp || i < 0 || i >= this.exp.paces.length) return;
    this.sim.pace = i;
    this.changed();
  }

  setRation(i: number) {
    if (!this.exp || i < 0 || i >= this.exp.rations.length) return;
    this.sim.ration = i;
    this.changed();
  }

  /** Real-time travel: one day every DAY_SECONDS (faster when `fast`). */
  update(dt: number) {
    dt = Math.max(0, Math.min(0.05, dt));
    if (this.paused || this.phase !== "travel") return;
    this.scroll += dt * (this.fast ? 4 : 1);
    this.acc += dt * (this.fast ? 4 : 1);
    if (this.acc >= DAY_SECONDS) {
      this.acc = 0;
      this.step();
    }
  }

  /** One day on the trail (or the next interruption). */
  step() {
    if (this.phase !== "travel" || !this.exp) return;
    const exp = this.exp;
    const s = this.sim;
    // Anything scheduled at or before where we are now?
    const due = this.schedule.find((x) => x.mile <= s.legMile);
    if (due) {
      this.schedule = this.schedule.filter((x) => x !== due);
      if (due.kind === "event") this.openEvent(due.card!);
      else this.askForecast();
      this.changed();
      return;
    }
    const r = travelDay(s, exp);
    const steps: (() => void)[] = [];
    for (const l of r.arrived) {
      this.jot(l.text);
      steps.push(() => this.showNotice("WORD FROM EARLIER", l.text, "info"));
    }
    if (r.outOfFood) {
      const what = `The ${exp.units.food === "meals" ? "meals" : "food"} ran out.`;
      if (canResupply(s, exp)) {
        resupplyStop(s, exp);
        steps.push(this.tradeNotice(what));
      } else {
        workStop(s, exp);
        steps.push(this.workNotice(what));
      }
    }
    if (r.reached) {
      // Events that were scheduled past the end of a short leg still happen.
      for (const x of this.schedule) {
        if (x.kind === "event") steps.push(() => this.openEvent(x.card!));
        else steps.push(() => this.askForecast());
      }
      this.schedule = [];
      if (!isLate(s, exp)) steps.push(() => this.visitLandmark(s.leg + 1));
    }
    if (isLate(s, exp)) {
      this.queue = [];
      this.winter();
      return;
    }
    if (steps.length) {
      this.queue = steps.concat(this.queue);
      this.advance();
    } else this.changed();
  }

  private workNotice(why: string): () => void {
    const exp = this.exp!;
    const w = exp.work;
    const text = `${why} ${w.text} (${w.days} days; +${dollars(w.money)}${w.food ? `, +${w.food} ${exp.units.food}` : ""})`;
    this.jot(`Stopped to work: ${w.label.toLowerCase()} (${w.days} days).`);
    return () => this.showNotice(`STOP TO WORK: ${w.label.toUpperCase()}`, text, "warn");
  }

  private tradeNotice(why: string): () => void {
    const exp = this.exp!;
    const r = exp.resupply;
    const text = `${why} ${r.text} (${r.days} ${r.days === 1 ? "day" : "days"}; −${dollars(r.money)}, +${r.food} ${exp.units.food})`;
    this.jot(`Stopped to ${r.label.toLowerCase()} (${r.days} ${r.days === 1 ? "day" : "days"}, ${dollars(r.money)}).`);
    return () => this.showNotice(`STOP TO TRADE: ${r.label.toUpperCase()}`, text, "warn");
  }

  private showNotice(title: string, text: string, tone: "info" | "warn" | "good") {
    this.notice = { title, text, tone };
    this.phase = "notice";
    this.hooks.say?.(text);
  }

  continueNotice() {
    if (this.phase !== "notice") return;
    this.advance();
  }

  /** Stop to work or trade on purpose (any time on the trail). */
  workNow() {
    if (this.phase !== "travel") return;
    workStop(this.sim, this.exp!);
    this.queue = [this.workNotice("You decide to stop.")];
    this.advance();
  }

  private openEvent(card: EventCard) {
    this.usedEvents.add(card.id);
    const choices = card.choices
      .map((c, i) => ({ c, i }))
      .filter(({ c }) => (c.minBand ?? 0) <= this.band)
      .map(({ c, i }) => ({ c, i, enabled: canAfford(this.sim, bandNeeds(c.needs, this.band)) }));
    this.shown = { card, choices };
    this.phase = "event";
    this.hooks.say?.(`${card.title}. ${card.text} ${choices.map((x, k) => `${k + 1}: ${x.c.label}.`).join(" ")}`);
  }

  /** Pick the k-th shown choice of the current event. */
  decide(k: number) {
    const sh = this.shown;
    if (this.phase !== "event" || !sh) return;
    const pick = sh.choices[k];
    if (!pick || !pick.enabled) return;
    const exp = this.exp!;
    applyEffect(this.sim, exp, bandEffect(pick.c.effect, this.band));
    if (this.band === 2 && pick.c.later) {
      this.sim.pending.push({ day: this.sim.day + pick.c.later.days, effect: pick.c.later.effect, text: pick.c.later.text });
    }
    this.outcome = pick.c.outcome;
    this.jot(`${sh.card.title}: ${pick.c.label.toLowerCase()}. ${pick.c.outcome}`);
    this.phase = "outcome";
    this.hooks.sound?.("blip");
    this.hooks.say?.(pick.c.outcome);
    this.changed();
  }

  continueOutcome() {
    if (this.phase !== "outcome") return;
    this.shown = null;
    this.advance();
  }

  private askForecast() {
    const exp = this.exp!;
    const f = forecast(this.sim, exp);
    const next = exp.landmarks[this.sim.leg + 1];
    this.ask(
      this.qs.forecast({
        place: next.name,
        miles: f.miles,
        speed: f.speed,
        food: Math.floor(this.sim.res.food),
        perDay: dailyFood(this.sim, exp),
        foodUnit: exp.units.food,
        daysLeft: Math.max(1, exp.deadline[this.band] - this.sim.day),
        day: this.sim.day,
        mile: this.sim.mile,
      }),
      "forecast",
    );
  }

  /* ------------------------------------------------------------------ winter & arrival */

  private winter() {
    this.phase = "wintered";
    this.jot(`${this.exp!.lateLabel}: the calendar ran out on ${this.dateLabel()}.`);
    this.hooks.sound?.("late");
    this.hooks.say?.(this.exp!.lateText);
    this.changed();
  }

  /**
   * Fewest days needed to finish from a checkpoint: every remaining leg at the fastest pace,
   * plus the stays at the landmarks still ahead.
   */
  minDaysFrom(cp: SimState): number {
    const exp = this.exp!;
    const fastest = Math.max(...exp.paces.map((p) => p.speed));
    let d = 0;
    for (let l = cp.leg; l < exp.legs.length; l++) {
      const miles = l === cp.leg ? exp.legs[l].miles - cp.legMile : exp.legs[l].miles;
      d += Math.ceil(miles / Math.max(1, Math.round(exp.legs[l].mpd * fastest)));
      d += exp.landmarks[l + 1].stay ?? 0;
    }
    return d;
  }

  /** The checkpoint a retry goes back to: the latest one from which arrival is still possible. */
  retryPoint(): Checkpoint | null {
    const exp = this.exp!;
    for (let k = this.checkpoints.length - 1; k >= 0; k--) {
      const cp = this.checkpoints[k];
      if (cp.sim.day + this.minDaysFrom(cp.sim) <= exp.deadline[this.band]) return cp;
    }
    return this.checkpoints[0] ?? null;
  }

  /** Retry the last leg from the checkpoint saved when it began (or an earlier one if that leg can no longer be finished in time). */
  retry() {
    if (this.phase !== "wintered") return;
    const cp = this.retryPoint();
    if (!cp) return;
    this.checkpoints = this.checkpoints.slice(0, this.checkpoints.indexOf(cp) + 1);
    this.sim = cloneSim(cp.sim);
    this.usedEvents = new Set(cp.used);
    this.journal = this.journal.slice(0, cp.journal);
    this.at = this.sim.leg;
    this.retries++;
    this.jot(`Retried the leg from the checkpoint (${this.dateLabel()}).`);
    this.planLeg();
    this.queue = [];
    this.asking = null;
    this.shown = null;
    this.phase = "travel";
    this.changed();
  }

  private arrive() {
    const exp = this.exp!;
    this.ended = true;
    this.phase = "arrived";
    this.score += 500 + Math.max(0, exp.deadline[this.band] - this.sim.day) * 10;
    this.jot(`Arrived at ${exp.landmarks[this.at].name.replace(/\.$/, "")} on ${this.dateLabel()}.`);
    this.hooks.sound?.("arrive");
    this.hooks.say?.(exp.guide.outro);
  }

  showReport() {
    if (this.phase !== "arrived") return;
    this.phase = "report";
    this.changed();
  }

  /* ------------------------------------------------------------------ report */

  summary() {
    const exp = this.exp!;
    const s = this.sim;
    const days = Math.max(1, s.day);
    return {
      miles: s.mile,
      days: s.day,
      historicalDays: exp.historicalDays,
      foodPerPersonDay: Math.round((s.stats.foodEaten / exp.party / days) * 10) / 10,
      money: s.res.money,
      spent: s.stats.spent + this.basketCost(),
      earned: s.stats.earned,
      workStops: s.stats.workStops,
      workDays: s.stats.workDays,
      retries: this.retries,
      end: exp.landmarks[this.at].name,
    };
  }

  /** Debug/test: jump to arrival at the end of the current leg. */
  debugFinishLeg() {
    if (this.phase !== "travel") return;
    const leg = this.exp!.legs[this.sim.leg];
    const left = leg.miles - this.sim.legMile;
    this.sim.legMile = leg.miles - 1;
    this.sim.mile += left - 1;
    this.schedule = [];
    this.step();
  }
}
