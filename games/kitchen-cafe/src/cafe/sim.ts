import type { Grade } from "../kit/types";
import { bandOf, gradeN, type CafeQ, type Moment } from "./common";
import { chartQuestion, EXPERIMENTS, experimentQuestion, type Experiment } from "./experiments";
import { kitchenById, STATIONS, STATION_INDEX, type Dish, type Kitchen } from "./kitchens";
import { mathCheck, mathGensFor } from "./math";
import { int, makeRng, pick, shuffle, type Rng } from "./rng";
import { scienceCheck } from "./science";
import { focusPlan, type Focus } from "./topics";

/*
 * One café shift, with no DOM: orders arrive, Chef Bix works the stations, Science Checks and
 * math moments pop up, customers pay. The React layer draws it and feeds it input; the checker
 * plays whole shifts headlessly.
 *
 * Fair, never stressful: wrong answers only skip a bonus star (never a game over, never a lost
 * order); K-2 have no clock and every cooking step comes out perfect on its own.
 */

export type Phase = "arrive" | "cook" | "work" | "ask" | "pay" | "leave" | "done";
export type AskKind = "science" | "math" | "exp" | "chart";

export interface Ask {
  /** Asked when this many steps are finished (steps.length = at checkout). */
  after: number;
  kind: AskKind;
  /** The kitchen change made at that step (science checks ask about it). */
  change?: string;
  moment: Moment;
}

export interface OrderPlan {
  dish: Dish;
  experiment?: Experiment;
  customer: number;
  asks: Ask[];
}

export type SimEvent =
  | { type: "arrive"; order: number }
  | { type: "wrong-station"; want: string }
  | { type: "work-start"; station: number }
  | { type: "work-early" }
  | { type: "step-done"; quality: "perfect" | "ok" | "over"; change?: string }
  | { type: "ask"; q: CafeQ; kind: AskKind }
  | { type: "answer"; correct: boolean }
  | { type: "served"; stars: number; speedy: boolean }
  | { type: "shift-done" };

export interface LogEntry { q: CafeQ; kind: AskKind; picked: number; correct: boolean }

/** Seconds of cooking per step, the zone that counts as perfect, and when food gets overdone. */
export const WORK_TIME = 2.4;
export const ZONE: [number, number] = [0.6, 0.88];
export const OVERDONE = 1.25;
export const ARRIVE_TIME = 1.1;
export const PAY_TIME = 1.2;
export const LEAVE_TIME = 0.9;

export function ordersPerShift(grade: Grade): number {
  return bandOf(grade) === "k2" ? 4 : 5;
}

/** Seconds an order may take (cooking time only, never question time) for the speed star. */
export function parTime(grade: Grade, steps: number): number {
  return bandOf(grade) === "k2" ? Infinity : 6 + 5 * steps;
}

export function noClock(grade: Grade): boolean {
  return bandOf(grade) === "k2";
}

/** Plans the shift's orders and where each question pops up. */
export function planShift(kitchen: Kitchen, grade: Grade, focus: Focus, r: Rng): OrderPlan[] {
  const n = gradeN(grade);
  const plan = focusPlan(focus);
  const count = ordersPerShift(grade);
  const experiments = kitchen.id === 4 && n >= 5;
  const menu = kitchen.dishes.filter((d) => !d.experiment);
  const test = kitchen.dishes.find((d) => d.experiment);
  const expOrder = shuffle(r, EXPERIMENTS);
  const orders: OrderPlan[] = [];
  let last = "";
  for (let i = 0; i < count; i++) {
    const isTest = experiments && test && (i === 1 || i === 3);
    let dish: Dish;
    if (isTest) dish = test!;
    else {
      const choices = menu.filter((d) => d.id !== last);
      dish = pick(r, choices);
    }
    last = dish.id;
    const asks: Ask[] = [];
    const steps = dish.steps.length;
    const changeSteps = dish.steps.map((s, k) => ({ s, k })).filter((x) => x.s.change);
    if (isTest) {
      const e = expOrder[Math.floor(i / 2) % expOrder.length];
      if (plan.science) asks.push({ after: steps, kind: "exp", moment: "oven" });
      if (plan.math) asks.push({ after: steps, kind: "chart", moment: "oven" });
      if (!plan.science && plan.math) asks.push({ after: steps, kind: "math", moment: "pay" });
      orders.push({ dish, experiment: e, customer: int(r, 0, 5), asks });
      continue;
    }
    if (plan.science) {
      const at = changeSteps.length ? changeSteps[changeSteps.length - 1] : null;
      asks.push(at ? { after: at.k + 1, kind: "science", change: at.s.change, moment: at.s.station } : { after: steps, kind: "science", moment: "any" });
      if (!plan.math) {
        // Science-only shifts get a second check at checkout (about the first change, or any).
        const first = changeSteps.length > 1 ? changeSteps[0] : null;
        asks.push({ after: steps, kind: "science", change: first?.s.change, moment: "any" });
      }
    }
    if (plan.math) {
      const gens = mathGensFor(grade).filter((g) => !plan.mathTopics || plan.mathTopics.includes(g.topic));
      const stationFits = dish.steps.map((s, k) => ({ s, k })).filter((x) => gens.some((g) => g.moment === x.s.station));
      const chart = kitchen.id === 4 && n < 5 && (i === 1 || i === 3) && (!plan.mathTopics || plan.mathTopics.includes("numbers"));
      if (chart) asks.push({ after: steps, kind: "chart", moment: "oven" });
      else if (stationFits.length && r() < 0.5) {
        const x = pick(r, stationFits);
        asks.push({ after: x.k + 1, kind: "math", moment: x.s.station });
      } else asks.push({ after: steps, kind: "math", moment: "pay" });
      if (!plan.science) asks.push({ after: steps, kind: "math", moment: chart ? "pay" : "any" });
    }
    asks.sort((a, b) => a.after - b.after);
    orders.push({ dish, customer: int(r, 0, 5), asks });
  }
  return orders;
}

export class CafeSim {
  readonly kitchen: Kitchen;
  readonly orders: OrderPlan[];
  readonly rng: Rng;
  phase: Phase = "arrive";
  phaseT = 0;
  orderIdx = 0;
  step = 0;
  chef = 0;
  /** Smoothly animated chef position (station units). */
  chefX = 0;
  work: { station: number; progress: number } | null = null;
  perfectAll = true;
  orderTime = 0;
  stars = 0;
  orderStars = 0;
  till = 0;
  served = 0;
  question: CafeQ | null = null;
  questionKind: AskKind | null = null;
  answered: { picked: number; correct: boolean } | null = null;
  log: LogEntry[] = [];
  events: SimEvent[] = [];
  /** Message on the ticket rail ("Next: OVEN", "Perfect!"). */
  flash = "";
  flashT = 0;
  private asked = new Set<number>();
  /** Bubbles, steam and sparkles above the station that just finished (render only). */
  lastDone: { station: number; change?: string; t: number } | null = null;

  constructor(readonly grade: Grade, kitchenId: number, readonly focus: Focus, seed: number) {
    this.rng = makeRng(seed);
    this.kitchen = kitchenById(kitchenId);
    this.orders = planShift(this.kitchen, grade, focus, this.rng);
    this.events.push({ type: "arrive", order: 0 });
  }

  get order(): OrderPlan | null {
    return this.orders[this.orderIdx] ?? null;
  }

  get nextStation(): number | null {
    const o = this.order;
    if (!o || this.step >= o.dish.steps.length) return null;
    return STATION_INDEX[o.dish.steps[this.step].station];
  }

  private say(msg: string) {
    this.flash = msg;
    this.flashT = 1.6;
  }

  update(dt: number) {
    this.chefX += (this.chef - this.chefX) * Math.min(1, dt * 14);
    if (this.flashT > 0) this.flashT -= dt;
    if (this.lastDone) {
      this.lastDone.t += dt;
      if (this.lastDone.t > 2.5) this.lastDone = null;
    }
    if (this.phase === "done" || this.phase === "ask") return;
    this.phaseT += dt;
    switch (this.phase) {
      case "arrive":
        if (this.phaseT >= ARRIVE_TIME) this.setPhase("cook");
        break;
      case "cook":
        this.orderTime += dt;
        break;
      case "work": {
        this.orderTime += dt;
        const w = this.work!;
        w.progress += dt / WORK_TIME;
        if (noClock(this.grade) && w.progress >= 1) this.finishStep("perfect");
        else if (w.progress >= OVERDONE) this.finishStep("over");
        break;
      }
      case "pay":
        if (this.phaseT >= PAY_TIME) this.setPhase("leave");
        break;
      case "leave":
        if (this.phaseT >= LEAVE_TIME) this.nextOrder();
        break;
    }
  }

  private setPhase(p: Phase) {
    this.phase = p;
    this.phaseT = 0;
  }

  /** Move the chef one station left (-1) or right (+1). */
  move(d: number) {
    if (this.phase === "work" || this.phase === "ask" || this.phase === "done") return;
    this.chef = Math.max(0, Math.min(STATIONS.length - 1, this.chef + d));
  }

  /** Walk to a station and use it (taps and station buttons). */
  tapStation(i: number) {
    if (this.phase === "work") {
      if (this.work && this.work.station === i) this.use();
      return;
    }
    if (this.phase === "ask" || this.phase === "done") return;
    this.chef = Math.max(0, Math.min(STATIONS.length - 1, i));
    this.use();
  }

  /** Space / Enter / tap: start cooking at this station, or take the food off when it looks done. */
  use() {
    if (this.phase === "work") {
      const p = this.work!.progress;
      if (noClock(this.grade)) {
        this.events.push({ type: "work-early" });
        this.say("Almost ready!");
        return;
      }
      if (p < ZONE[0]) {
        this.events.push({ type: "work-early" });
        this.say("Not ready yet!");
        return;
      }
      this.finishStep(p <= ZONE[1] ? "perfect" : "ok");
      return;
    }
    if (this.phase !== "cook") return;
    const want = this.nextStation;
    if (want === null) return;
    if (this.chef !== want) {
      this.events.push({ type: "wrong-station", want: STATIONS[want].name });
      this.say(`The ticket says: ${STATIONS[want].short}!`);
      return;
    }
    this.work = { station: want, progress: 0 };
    this.setPhase("work");
    this.events.push({ type: "work-start", station: want });
  }

  private finishStep(quality: "perfect" | "ok" | "over") {
    const o = this.order!;
    const st = o.dish.steps[this.step];
    if (quality !== "perfect") this.perfectAll = false;
    this.events.push({ type: "step-done", quality, change: st.change });
    this.say(quality === "perfect" ? "PERFECT!" : quality === "ok" ? "Good!" : "A bit overdone, still tasty!");
    this.lastDone = { station: STATION_INDEX[st.station], change: st.change, t: 0 };
    this.work = null;
    this.step++;
    this.setPhase("cook");
    this.afterStep();
  }

  /** Asks the next question due at this point, or moves on to checkout. */
  private afterStep() {
    const o = this.order!;
    const due = o.asks.findIndex((a, i) => !this.asked.has(i) && a.after <= this.step);
    if (due >= 0) {
      this.asked.add(due);
      const a = o.asks[due];
      const q = this.makeQuestion(a, o);
      if (q) {
        this.question = q;
        this.questionKind = a.kind;
        this.answered = null;
        this.setPhase("ask");
        this.events.push({ type: "ask", q, kind: a.kind });
        return;
      }
      this.afterStep();
      return;
    }
    if (this.step >= o.dish.steps.length) this.serve();
  }

  makeQuestion(a: Ask, o: OrderPlan): CafeQ | null {
    const plan = focusPlan(this.focus);
    const r = this.rng;
    switch (a.kind) {
      case "science":
        return scienceCheck(this.grade, r, a.change, a.moment);
      case "exp":
        return experimentQuestion(o.experiment ?? EXPERIMENTS[0], this.grade, r) ?? scienceCheck(this.grade, r);
      case "chart":
        return chartQuestion(o.experiment ?? pick(r, EXPERIMENTS), this.grade, r) ?? mathCheck(this.grade, r, plan.mathTopics);
      case "math":
        return mathCheck(this.grade, r, plan.mathTopics, a.moment === "any" ? undefined : a.moment);
    }
  }

  /** Pick a choice (0-3). Returns whether it was right; never ends the game. */
  answer(i: number): boolean | null {
    if (this.phase !== "ask" || !this.question || this.answered) return null;
    const correct = i === this.question.answer;
    this.answered = { picked: i, correct };
    this.log.push({ q: this.question, kind: this.questionKind!, picked: i, correct });
    if (correct) {
      this.orderStars++;
      this.stars++;
      if (this.question.subject === "math") this.till += 50;
    }
    this.events.push({ type: "answer", correct });
    return correct;
  }

  /** After reading the explanation: back to the kitchen. */
  resume() {
    if (this.phase !== "ask" || !this.answered) return;
    this.question = null;
    this.questionKind = null;
    this.answered = null;
    this.setPhase("cook");
    this.afterStep();
  }

  private serve() {
    const o = this.order!;
    const speedy = this.orderTime <= parTime(this.grade, o.dish.steps.length);
    let s = 1; // served
    if (speedy) s++;
    if (this.perfectAll) s++;
    this.orderStars += s;
    this.stars += s;
    this.till += o.dish.price;
    this.served++;
    this.events.push({ type: "served", stars: this.orderStars, speedy });
    this.say(`Order up! +${this.orderStars}★`);
    this.setPhase("pay");
  }

  private nextOrder() {
    this.orderIdx++;
    this.step = 0;
    this.perfectAll = true;
    this.orderTime = 0;
    this.orderStars = 0;
    this.asked.clear();
    if (this.orderIdx >= this.orders.length) {
      this.setPhase("done");
      this.events.push({ type: "shift-done" });
      return;
    }
    this.setPhase("arrive");
    this.events.push({ type: "arrive", order: this.orderIdx });
  }

  get score(): number {
    return this.stars * 100 + Math.floor(this.till / 10);
  }

  /** Best possible stars for this shift (3 per order + one per question). */
  get maxStars(): number {
    return this.orders.reduce((a, o) => a + 3 + o.asks.length, 0);
  }

  drainEvents(): SimEvent[] {
    const e = this.events;
    this.events = [];
    return e;
  }
}
