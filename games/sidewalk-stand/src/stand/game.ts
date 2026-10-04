/*
 * Sidewalk Stand engine: the day loop (morning plan → serving rush → evening ledger →
 * upgrades → transmission) with no DOM, so tests can play whole games headless.
 * All money is integer cents.
 */
// Only the node-safe parts of the kit are imported here; the question deck (which loads the
// written banks through Vite) is passed in, so tests can run the engine headless.
import { markAdaptive, mathGradeFor } from "@/kit/adaptive";
import { recordAnswer, submitScore } from "@/kit/progress";
import type { Grade, Question } from "@/kit/types";
import {
  CUSTOMERS,
  CUST_NAME,
  ITEMS,
  ITEM_LABEL,
  ITEM_NAME,
  RECIPE,
  SUPPLIES,
  UPGRADES,
  daysFor,
  gnum,
  itemPrice,
  paceFor,
  scaleFor,
  type CustKind,
  type ItemId,
  type Pace,
  type Scale,
  type SupplyId,
  type UpgradeId,
} from "./config";
import { WEATHER_WORD, demand, forecastFor, hintRange, type DemandParts, type Forecast } from "./demand";
import { hashSeed, money, pickR, rng, sayMoney, styleFor, type Rand } from "./money";
import { payQuestion, planQuestion, reflectQuestion, type Buy, type Line, type SSQuestion } from "./questions";

export const GAME_ID = "sidewalk-stand";

export type Phase = "title" | "plan" | "planQ" | "rush" | "pay" | "ledger" | "upgrade" | "transmission" | "over";
export type Purpose = "pay" | "plan" | "reflect" | "transmission";

export interface Sfx {
  blip(): void;
  correct(): void;
  wrong(): void;
  checkpoint(): void;
  levelUp(): void;
  gameOver(): void;
  shoot(): void;
  jump(): void;
}
export interface Hooks {
  say(text: string): void;
  sayQuestion(q: Question & { say?: string }): void;
  onChange(): void;
}

export interface Customer {
  id: number;
  kind: CustKind;
  lane: number;
  x: number;
  state: "walk" | "wait" | "leave";
  lines: Line[];
  /** Items still wanted, one entry per item. */
  want: ItemId[];
  got: ItemId[];
  patience: number;
  maxPatience: number;
  mood: "ok" | "happy" | "sad";
  bubble: { text: string; t: number } | null;
  bob: number;
  /** Pays with exact money (no change question). */
  exact: boolean;
}
export interface Slide {
  lane: number;
  x: number;
  item: ItemId;
  dir: 1 | -1;
}
export interface QState {
  q: SSQuestion | Question;
  picked: number | null;
  purpose: Purpose;
  /** For a pay question: who is paying. */
  custId?: number;
}
export interface LogEntry {
  standard: string;
  skill: string;
  subject: string;
  correct: boolean;
  purpose: Purpose;
}
export interface DaySummary {
  day: number;
  weather: string;
  temp: number;
  price: number;
  customers: number;
  served: number;
  missed: number;
  soldOut: number;
  tooBusy: number;
  revenue: number;
  costs: number;
  upgrades: number;
  profit: number;
}
export interface Today {
  forecast: Forecast;
  buys: Buy[];
  boughtCost: number;
  revenue: number;
  sold: Record<ItemId, number>;
  served: number;
  missed: number;
  soldOut: number;
  tooBusy: number;
  demand: DemandParts | null;
  melted: number;
  spoiled: number;
  upgradeCost: number;
  startCash: number;
  exact: number;
}

export const LANE_X0 = 60; // where slides start (the counter end at the cart)
export const STOP_X = 84; // where the first customer in a lane stops
export const SLOT_W = 22;
export const LANE_END = 316;
const MAX_IN_LANE = 3;

const emptyStock = (): Record<SupplyId, number> => ({ cups: 0, jugs: 0, ice: 0, fruit: 0, snacks: 0 });
const emptySold = (): Record<ItemId, number> => ({ juice: 0, fruit: 0, snack: 0 });

export class StandGame {
  grade: Grade = "3";
  scale: Scale = scaleFor("3");
  pace: Pace = paceFor("3");
  phase: Phase = "title";
  seed = 1;
  day = 1;
  days = 4;
  cash = 0;
  stock = emptyStock();
  upgrades = new Set<UpgradeId>();
  loan: { principal: number; rate: number; days: number } | null = null;
  freshStarts = 0;
  rescue: "loan" | "fresh" | null = null;

  // morning
  cart: Record<SupplyId, number> = emptyStock();
  priceIdx = 0;
  planRow = 0;
  today: Today = this.blankToday();
  history: DaySummary[] = [];

  // rush
  lanes = 3;
  heroLane = 0;
  held: ItemId = "juice";
  customers: Customer[] = [];
  slides: Slide[] = [];
  orders: { kind: CustKind; lines: Line[]; exact: boolean }[] = [];
  spawned = 0;
  spawnTimer = 0;
  rushTime = 0;
  closing = -1;
  soldOutFlag = false;
  cooldown = 0;
  private nextId = 1;
  private rushRand: Rand = rng(1);
  /** Visual events for the renderer (floating "+$1.50" and so on); it drains this list. */
  events: { lane: number; x: number; text: string; color: string }[] = [];
  /** Seconds the hero shows a serving pose. */
  heroPose = 0;

  // questions and scoring
  q: QState | null = null;
  log: LogEntry[] = [];
  score = 0;
  deck: { draw(): Question } | null = null;
  /** Makes the transmission deck (the kit's QuestionDeck in the browser). */
  makeDeck: (g: Grade) => { draw(): Question } = () => ({ draw: () => { throw new Error("no deck"); } });
  msg: { text: string; tone: "info" | "ok" | "no" } = { text: "", tone: "info" };
  paused = false;
  finalCash = 0;
  loanPaid = 0;
  loanLeft = 0;
  /** Set by tests: pick answers from this instead of Math.random. */
  rand: Rand = Math.random;

  constructor(
    private sfx: Sfx | null = null,
    private hooks: Hooks = { say: () => {}, sayQuestion: () => {}, onChange: () => {} },
    grade: Grade = "3",
  ) {
    this.setGrade(grade);
  }

  private blankToday(): Today {
    return {
      forecast: { weather: "sunny", temp: 80, luck: 1000 },
      buys: [],
      boughtCost: 0,
      revenue: 0,
      sold: emptySold(),
      served: 0,
      missed: 0,
      soldOut: 0,
      tooBusy: 0,
      demand: null,
      melted: 0,
      spoiled: 0,
      upgradeCost: 0,
      startCash: 0,
      exact: 0,
    };
  }

  private changed() {
    this.hooks.onChange();
  }
  private say(t: string) {
    this.hooks.say(t);
  }
  setMsg(text: string, tone: "info" | "ok" | "no" = "info") {
    this.msg = { text, tone };
  }

  get style() {
    return styleFor(this.grade);
  }
  fmt(c: number) {
    return money(c, this.style);
  }
  get juicePrice() {
    return this.scale.priceOptions[this.priceIdx];
  }
  price(item: ItemId) {
    return itemPrice(this.scale, item, this.juicePrice);
  }
  /** Supply cost of one serving of an item (may be a fraction of a cent for K and grade 2 packs). */
  servingCost(item: ItemId): number {
    let c = 0;
    for (const [sid, n] of Object.entries(RECIPE[item]) as [SupplyId, number][]) {
      const def = SUPPLIES.find((s) => s.id === sid)!;
      c += (this.scale.pack[sid] / def.per) * n;
    }
    return c;
  }

  setGrade(g: Grade) {
    this.grade = g;
    this.scale = scaleFor(g);
    this.pace = paceFor(g);
    this.days = daysFor(g);
    this.priceIdx = Math.max(0, this.scale.priceOptions.indexOf(this.scale.ref));
    this.changed();
  }

  // ------------------------------------------------------------------ game flow

  start(seed = Math.floor(Math.random() * 1e9)) {
    this.seed = seed;
    this.day = 1;
    this.cash = this.scale.start;
    this.stock = emptyStock();
    this.upgrades = new Set();
    this.loan = null;
    this.loanPaid = 0;
    this.loanLeft = 0;
    this.freshStarts = 0;
    this.history = [];
    this.log = [];
    this.score = 0;
    this.q = null;
    this.paused = false;
    this.deck = this.makeDeck(this.grade);
    this.priceIdx = Math.max(0, this.scale.priceOptions.indexOf(this.scale.ref));
    this.beginDay();
  }

  private beginDay() {
    this.today = this.blankToday();
    this.today.forecast = forecastFor(this.seed, this.day);
    this.today.startCash = this.cash;
    this.cart = emptyStock();
    this.planRow = 0;
    this.phase = "plan";
    this.q = null;
    const minKit = this.scale.pack.cups + this.scale.pack.jugs + this.scale.pack.ice;
    const juiceOnHand = Math.min(this.stock.cups, this.stock.jugs, this.stock.ice);
    this.rescue = this.cash < minKit && juiceOnHand < 3 ? (gnum(this.grade) >= 7 && !this.loan ? "loan" : "fresh") : null;
    const f = this.today.forecast;
    const [lo, hi] = this.hint();
    this.setMsg(`DAY ${this.day}: ${WEATHER_WORD[f.weather]}, ${f.temp}°F. About ${lo === hi ? lo : `${lo}–${hi}`} customers at the usual price. Buy supplies and set your price.`);
    this.say(
      `Day ${this.day}. The forecast is ${f.weather === "rain" ? "rainy" : f.weather}, ${f.temp} degrees. Expect about ${lo === hi ? lo : `${lo} to ${hi}`} customers. Buy supplies, set your price, then open the stand.`,
    );
    this.changed();
  }

  hint(): [number, number] {
    return hintRange(this.grade, this.scale, this.today.forecast, this.upgrades);
  }

  /** Grades 7+: a family loan with simple interest; younger grades: a fresh start. */
  acceptRescue() {
    if (this.rescue === "loan") {
      const principal = Math.round(this.scale.start / 2 / 100) * 100;
      const left = this.days - this.day + 1;
      this.loan = { principal, rate: 5, days: left };
      this.cash += principal;
      this.setMsg(`Family loan: +${this.fmt(principal)} at 5% simple interest per day for ${left} day${left > 1 ? "s" : ""}. You will pay back ${this.fmt(this.loanOwed())} at the end.`, "ok");
    } else if (this.rescue === "fresh") {
      this.freshStarts++;
      this.cash = Math.max(this.cash, this.scale.start);
      this.setMsg(`Your family gives you a fresh start: your cash is back to ${this.fmt(this.cash)}. Try a different plan today!`, "ok");
    }
    this.today.startCash = this.cash;
    this.rescue = null;
    this.changed();
  }
  declineRescue() {
    this.rescue = null;
    this.changed();
  }
  loanOwed(): number {
    if (!this.loan) return 0;
    return this.loan.principal + (this.loan.principal * this.loan.rate * this.loan.days) / 100;
  }

  // ------------------------------------------------------------------ morning

  cartCost(): number {
    return SUPPLIES.reduce((a, s) => a + this.cart[s.id] * this.scale.pack[s.id], 0);
  }
  canAdd(id: SupplyId): boolean {
    return this.cartCost() + this.scale.pack[id] <= this.cash && this.cart[id] < 9;
  }
  setPack(id: SupplyId, delta: number) {
    if (this.phase !== "plan" || this.rescue) return;
    if (delta > 0 && !this.canAdd(id)) {
      this.setMsg(this.cart[id] >= 9 ? "That is plenty of that one!" : "Not enough cash for another pack.", "no");
      this.changed();
      return;
    }
    this.cart[id] = Math.max(0, this.cart[id] + delta);
    this.sfx?.blip();
    this.changed();
  }
  setPrice(delta: number) {
    if (this.phase !== "plan" || this.rescue) return;
    this.priceIdx = Math.max(0, Math.min(this.scale.priceOptions.length - 1, this.priceIdx + delta));
    this.sfx?.blip();
    this.changed();
  }
  setPriceIdx(i: number) {
    if (this.phase !== "plan" || this.rescue) return;
    this.priceIdx = Math.max(0, Math.min(this.scale.priceOptions.length - 1, i));
    this.changed();
  }
  moveRow(d: number) {
    this.planRow = (this.planRow + d + SUPPLIES.length + 1) % (SUPPLIES.length + 1);
    this.changed();
  }
  adjustRow(d: number) {
    if (this.planRow < SUPPLIES.length) this.setPack(SUPPLIES[this.planRow].id, d);
    else this.setPrice(d);
  }

  /** Servings of an item the stock can still make. */
  canMake(item: ItemId, stock: Record<SupplyId, number> = this.stock): number {
    let n = Infinity;
    for (const [sid, k] of Object.entries(RECIPE[item]) as [SupplyId, number][]) n = Math.min(n, Math.floor(stock[sid] / k));
    return n;
  }

  /** Fills the cart with a sensible plan for the forecast (the "Help me plan" button). */
  helpPlan() {
    if (this.phase !== "plan" || this.rescue) return;
    this.cart = emptyStock();
    const [, hi] = this.hint();
    const perCust = this.scale.maxItems === 1 ? 1 : 1.4;
    const want: Record<ItemId, number> = {
      juice: Math.ceil(hi * perCust * 0.6),
      fruit: Math.ceil(hi * perCust * 0.2),
      snack: Math.ceil(hi * perCust * 0.25),
    };
    const need: Record<SupplyId, number> = {
      cups: want.juice + want.fruit,
      jugs: want.juice,
      ice: want.juice,
      fruit: want.fruit,
      snacks: want.snack,
    };
    // Juice basics first, then the rest, while cash lasts.
    for (const id of ["cups", "jugs", "ice", "snacks", "fruit"] as SupplyId[]) {
      const def = SUPPLIES.find((s) => s.id === id)!;
      const packs = Math.max(0, Math.ceil((need[id] - this.stock[id]) / def.per));
      for (let i = 0; i < packs && this.canAdd(id); i++) this.cart[id]++;
    }
    this.priceIdx = Math.max(0, this.scale.priceOptions.indexOf(this.scale.ref));
    this.setMsg("Here is a plan for today's forecast. Change anything you like, then OPEN THE STAND.", "ok");
    this.sfx?.blip();
    this.changed();
  }

  openStand() {
    if (this.phase !== "plan" || this.rescue) return;
    const cost = this.cartCost();
    if (cost > this.cash) return;
    this.cash -= cost;
    this.today.boughtCost = cost;
    this.today.buys = SUPPLIES.filter((s) => this.cart[s.id] > 0).map((s) => ({
      name: s.name,
      unit: s.id === "jugs" ? "jugs of juice" : s.id === "ice" ? "bags of ice" : s.id === "fruit" ? "bags of fruit" : s.id === "snacks" ? "boxes of snacks" : "packs of cups",
      packs: this.cart[s.id],
      cost: this.scale.pack[s.id],
    }));
    for (const s of SUPPLIES) this.stock[s.id] += this.cart[s.id] * s.per;
    this.today.demand = demand(this.grade, this.scale, this.today.forecast, this.juicePrice, this.upgrades);
    this.buildOrders();
    this.sfx?.checkpoint();
    if (gnum(this.grade) >= 3) {
      const level = mathGradeFor(this.grade, this.rand);
      const q = planQuestion(level, {
        scale: this.scale,
        cash: this.today.startCash,
        buys: this.today.buys,
        juicePrice: this.juicePrice,
        servingCost: this.servingCost("juice"),
      }, rng(hashSeed(this.seed, this.day, 501)));
      this.ask(q, "plan");
      this.phase = "planQ";
      this.setMsg("Quick planning check before the park opens!");
    } else {
      this.startRush();
    }
    this.changed();
  }

  // ------------------------------------------------------------------ questions

  private ask(q: SSQuestion | Question, purpose: Purpose, custId?: number) {
    if (q.subject === "math" && "kind" in q) markAdaptive(q, this.grade);
    const dealt = this.deal(q);
    this.q = { q: dealt, picked: null, purpose, custId };
    this.hooks.sayQuestion(dealt);
  }

  /** Shuffles a question's choices (like the kit's deal), keeping track of the answer. */
  private deal<T extends Question>(q: T): T {
    const order = [0, 1, 2, 3];
    for (let i = 3; i > 0; i--) {
      const j = Math.floor(this.rand() * (i + 1));
      [order[i], order[j]] = [order[j], order[i]];
    }
    return { ...q, choices: order.map((i) => q.choices[i]) as T["choices"], answer: order.indexOf(q.answer) };
  }

  answer(i: number) {
    const s = this.q;
    if (!s || s.picked !== null || i < 0 || i > 3) return;
    if (!(this.phase === "pay" || this.phase === "planQ" || this.phase === "ledger" || this.phase === "transmission")) return;
    s.picked = i;
    const correct = i === s.q.answer;
    recordAnswer(GAME_ID, s.q, correct);
    this.log.push({ standard: s.q.standard, skill: s.q.skill, subject: s.q.subject, correct, purpose: s.purpose });
    const pts = s.purpose === "pay" ? 100 : s.purpose === "transmission" ? 200 : 150;
    if (correct) {
      this.score += pts;
      this.sfx?.correct();
    } else this.sfx?.wrong();

    if (s.purpose === "pay") {
      const c = this.customers.find((x) => x.id === s.custId);
      const name = c ? CUST_NAME[c.kind] : "The customer";
      if (correct) this.setMsg(`${name}: "Thanks!" ✔ ${s.q.choices[s.q.answer]} is right.`, "ok");
      else this.setMsg(`${name}: "That's OK! I think it's ${s.q.choices[s.q.answer]}. Let's check together."`, "no");
      this.say(correct ? "Correct! Thank you!" : `That's OK! The answer is ${s.q.choices[s.q.answer]}. ${s.q.explanation}`);
    } else {
      this.setMsg(correct ? "✔ Correct!" : `✘ The answer is ${"ABCD"[s.q.answer]}: ${s.q.choices[s.q.answer]}.`, correct ? "ok" : "no");
      this.say(correct ? `Correct! ${s.q.explanation}` : `Not quite. The answer is ${s.q.choices[s.q.answer]}. ${s.q.explanation}`);
    }
    this.changed();
  }

  continueQ() {
    const s = this.q;
    if (!s || s.picked === null) return;
    this.q = null;
    switch (s.purpose) {
      case "plan":
        this.startRush();
        break;
      case "pay": {
        const c = this.customers.find((x) => x.id === s.custId);
        const pq = s.q as SSQuestion;
        if (c) this.finishSale(c, pq.revenue ?? this.orderTotal(c.lines), s.picked === s.q.answer ? "Thanks!" : "No problem!");
        this.phase = "rush";
        this.setMsg(this.rushHelp());
        break;
      }
      case "reflect":
        this.phase = "upgrade";
        this.setMsg(this.day < this.days ? "Want an upgrade? Small upgrades help tomorrow. Then go on to the next day." : "Last day done! Upgrades are closed. See your report.");
        this.say(this.day < this.days ? "You can buy one small upgrade, or save your money." : "That was the last day!");
        break;
      case "transmission":
        this.day++;
        this.beginDay();
        break;
    }
    this.changed();
  }

  // ------------------------------------------------------------------ rush

  private buildOrders() {
    const r = rng(hashSeed(this.seed, this.day, 303));
    const d = this.today.demand!;
    const n = d.customers;
    this.today.tooBusy = Math.max(0, Math.round(d.raw) - d.capacity);
    this.orders = [];
    const hot = this.today.forecast.temp >= 85;
    for (let i = 0; i < n; i++) {
      const kind = pickR(r, CUSTOMERS).id;
      const k = this.scale.maxItems === 1 ? 1 : 1 + Math.floor(r() * r() * this.scale.maxItems + (r() < 0.3 ? 1 : 0));
      const items: ItemId[] = [];
      for (let j = 0; j < Math.min(k, this.scale.maxItems); j++) {
        const roll = r();
        items.push(roll < (hot ? 0.65 : 0.55) ? "juice" : roll < (hot ? 0.82 : 0.77) ? "snack" : "fruit");
      }
      this.orders.push({ kind, lines: this.linesFor(items), exact: gnum(this.grade) >= 3 && r() < 0.2 });
    }
  }

  private linesFor(items: ItemId[]): Line[] {
    const lines: Line[] = [];
    for (const it of ITEMS) {
      const qty = items.filter((x) => x === it).length;
      if (qty) lines.push({ item: it, qty, price: this.price(it) });
    }
    // Keep the order within the band's money limit.
    while (lines.length && this.orderTotal(lines) > this.scale.maxOrder) {
      const last = lines[lines.length - 1];
      if (last.qty > 1) last.qty--;
      else if (lines.length > 1) lines.pop();
      else break;
    }
    return lines;
  }

  orderTotal(lines: Line[]): number {
    return lines.reduce((a, l) => a + l.qty * l.price, 0);
  }

  startRush() {
    this.phase = "rush";
    this.lanes = this.upgrades.has("counter") ? 4 : 3;
    this.heroLane = Math.min(this.heroLane, this.lanes - 1);
    this.customers = [];
    this.slides = [];
    this.spawned = 0;
    this.spawnTimer = 0.6;
    this.rushTime = 0;
    this.closing = -1;
    this.soldOutFlag = false;
    this.rushRand = rng(hashSeed(this.seed, this.day, 909));
    this.held = this.canMake("juice") > 0 ? "juice" : this.canMake("snack") > 0 ? "snack" : "fruit";
    this.setMsg(this.rushHelp());
    this.say("The park is open! Move to a customer's lane and serve what they want.");
    if (this.orders.length === 0) {
      this.setMsg("Nobody stopped by today. Try a lower price or wait for better weather.", "no");
      this.closing = 1.5;
    }
    this.changed();
  }

  rushHelp(): string {
    return gnum(this.grade) <= 2
      ? "Tap a lane to serve what the customer wants! Or ↑ ↓ to move, SPACE to serve."
      : "↑ ↓ lane · ← → pick item · SPACE serve. Or tap an item, then tap a lane.";
  }

  /** Remaining items customers in line still need (not counting items already sliding). */
  private reserved(): Record<SupplyId, number> {
    const need = emptyStock();
    for (const c of this.customers) {
      if (c.state === "leave") continue;
      const left = [...c.want];
      for (const g of c.got) left.splice(left.indexOf(g), 1);
      for (const it of left) for (const [sid, k] of Object.entries(RECIPE[it]) as [SupplyId, number][]) need[sid] += k;
    }
    for (const s of this.slides) {
      if (s.dir !== 1) continue;
      for (const [sid, k] of Object.entries(RECIPE[s.item]) as [SupplyId, number][]) need[sid] = Math.max(0, need[sid] - k);
    }
    return need;
  }

  private spawn() {
    const o = this.orders[this.spawned];
    // Fit the order to what is still in stock.
    const res = this.reserved();
    const free = emptyStock();
    for (const s of SUPPLIES) free[s.id] = Math.max(0, this.stock[s.id] - res[s.id]);
    const items: ItemId[] = [];
    const want = o.lines.flatMap((l) => Array.from({ length: l.qty }, () => l.item));
    for (const it of want) {
      const options = [it, ...ITEMS.filter((x) => x !== it)];
      const pickIt = options.find((x) => this.canMake(x, free) > 0);
      if (!pickIt) break;
      for (const [sid, k] of Object.entries(RECIPE[pickIt]) as [SupplyId, number][]) free[sid] -= k;
      items.push(pickIt);
    }
    if (!items.length) {
      // Sold out: everyone still coming finds the stand empty.
      this.soldOutFlag = true;
      this.today.soldOut += this.orders.length - this.spawned;
      this.spawned = this.orders.length;
      this.setMsg("SOLD OUT! Some customers found nothing left. Buy more supplies tomorrow?", "no");
      this.say("Sold out!");
      return;
    }
    const counts = this.laneCounts();
    let best = -1;
    for (let l = 0; l < this.lanes; l++) if (counts[l] < MAX_IN_LANE && (best < 0 || counts[l] < counts[best] || (counts[l] === counts[best] && this.rushRand() < 0.5))) best = l;
    if (best < 0) {
      this.spawnTimer = 0.5;
      return;
    }
    const lines = this.linesFor(items);
    const wantList = lines.flatMap((l) => Array.from({ length: l.qty }, () => l.item));
    this.customers.push({
      id: this.nextId++,
      kind: o.kind,
      lane: best,
      x: 336,
      state: "walk",
      lines,
      want: wantList,
      got: [],
      patience: this.pace.patience,
      maxPatience: this.pace.patience,
      mood: "ok",
      bubble: null,
      bob: this.rushRand() * 6,
      exact: o.exact,
    });
    this.spawned++;
    this.spawnTimer = this.pace.spawnEvery * (0.75 + this.rushRand() * 0.5);
  }

  private laneCounts(): number[] {
    const n = Array.from({ length: this.lanes }, () => 0);
    for (const c of this.customers) if (c.state !== "leave") n[c.lane]++;
    return n;
  }

  /** Front customer of a lane (closest to the cart), or undefined. */
  front(lane: number): Customer | undefined {
    let f: Customer | undefined;
    for (const c of this.customers) if (c.lane === lane && c.state !== "leave" && (!f || c.x < f.x)) f = c;
    return f;
  }

  remaining(c: Customer): ItemId[] {
    const left = [...c.want];
    for (const g of c.got) {
      const i = left.indexOf(g);
      if (i >= 0) left.splice(i, 1);
    }
    return left;
  }

  moveLane(d: number) {
    if (this.phase !== "rush" || this.paused) return;
    this.setLane(this.heroLane + d);
  }
  setLane(l: number) {
    if (this.phase !== "rush" || this.paused) return;
    const nl = Math.max(0, Math.min(this.lanes - 1, l));
    if (nl !== this.heroLane) this.sfx?.blip();
    this.heroLane = nl;
    if (gnum(this.grade) <= 2) {
      // Helper for young players: hold what this lane's customer wants.
      const f = this.front(nl);
      const want = f ? this.remaining(f)[0] : undefined;
      if (want) this.held = want;
    }
    this.changed();
  }
  cycleItem(d: number) {
    if (this.phase !== "rush" || this.paused) return;
    const i = ITEMS.indexOf(this.held);
    this.held = ITEMS[(i + d + ITEMS.length) % ITEMS.length];
    this.sfx?.blip();
    this.changed();
  }
  setItem(it: ItemId) {
    if (this.phase !== "rush" || this.paused) return;
    this.held = it;
    this.changed();
  }
  /** Tap on a lane: move there and serve. */
  tapLane(l: number) {
    if (this.phase !== "rush" || this.paused) return;
    this.setLane(l);
    this.serve();
  }

  serve() {
    if (this.phase !== "rush" || this.paused || this.cooldown > 0) return;
    const it = this.held;
    if (this.canMake(it) <= 0) {
      const missing = (Object.entries(RECIPE[it]) as [SupplyId, number][]).filter(([sid, k]) => this.stock[sid] < k).map(([sid]) => SUPPLIES.find((s) => s.id === sid)!.name.toLowerCase());
      this.setMsg(`Out of ${ITEM_NAME[it]}s: no ${missing.join(" or ")} left. Pick another item.`, "no");
      this.sfx?.wrong();
      this.changed();
      return;
    }
    for (const [sid, k] of Object.entries(RECIPE[it]) as [SupplyId, number][]) this.stock[sid] -= k;
    this.slides.push({ lane: this.heroLane, x: LANE_X0, item: it, dir: 1 });
    this.cooldown = 0.22;
    this.heroPose = 0.25;
    this.sfx?.shoot();
    this.changed();
  }

  private refund(it: ItemId) {
    for (const [sid, k] of Object.entries(RECIPE[it]) as [SupplyId, number][]) this.stock[sid] += k;
  }

  private startPay(c: Customer) {
    const lines = c.lines;
    const total = this.orderTotal(lines);
    if (c.exact) {
      this.today.exact++;
      this.finishSale(c, total, "Exact change!");
      this.setMsg(`${CUST_NAME[c.kind]} paid exactly ${this.fmt(total)}. No change needed!`, "ok");
      return;
    }
    const level = mathGradeFor(this.grade, this.rand);
    const q = payQuestion(level, { who: CUST_NAME[c.kind], lines, scale: this.scale, juicePrice: this.juicePrice }, rng(hashSeed(this.seed, this.day, c.id, 71)));
    this.ask(q, "pay", c.id);
    this.phase = "pay";
    this.sfx?.checkpoint();
    this.setMsg(`${CUST_NAME[c.kind]} is paying. Pick the right answer: 1–4 / A–D or tap.`);
  }

  private finishSale(c: Customer, kept: number, words: string) {
    this.cash += kept;
    this.today.revenue += kept;
    for (const l of c.lines) this.today.sold[l.item] += l.qty;
    this.today.served++;
    this.score += 25;
    c.state = "leave";
    c.mood = "happy";
    c.bubble = { text: words, t: 1.6 };
    this.events.push({ lane: c.lane, x: c.x, text: `+${this.fmt(kept)}`, color: "#5fff8a" });
  }

  /** Advances the rush by dt seconds. */
  step(dtRaw: number) {
    const dt = Math.max(0, Math.min(0.05, dtRaw));
    if (this.paused) return;
    for (const c of this.customers) {
      if (c.bubble) {
        c.bubble.t -= dt;
        if (c.bubble.t <= 0) c.bubble = null;
      }
    }
    if (this.phase !== "rush") return;
    this.rushTime += dt;
    this.cooldown = Math.max(0, this.cooldown - dt);
    this.heroPose = Math.max(0, this.heroPose - dt);

    if (this.closing >= 0) {
      this.closing -= dt;
      if (this.closing < 0) this.endRush();
      return;
    }

    // Spawn
    if (this.spawned < this.orders.length) {
      this.spawnTimer -= dt;
      if (this.spawnTimer <= 0) this.spawn();
    }
    // Rush time limit: after 4 minutes everyone still waiting heads home.
    if (this.rushTime > 240) {
      for (const c of this.customers) if (c.state !== "leave") this.giveUp(c);
      this.today.missed += this.orders.length - this.spawned;
      this.spawned = this.orders.length;
    }

    // Customers walk and wait
    const byLane = new Map<number, Customer[]>();
    for (const c of this.customers) {
      if (c.state === "leave") continue;
      const a = byLane.get(c.lane) ?? [];
      a.push(c);
      byLane.set(c.lane, a);
    }
    for (const [, list] of byLane) {
      list.sort((a, b) => a.id - b.id);
      list.forEach((c, slot) => {
        const target = STOP_X + slot * SLOT_W;
        if (c.x > target + 0.5) {
          c.state = "walk";
          c.x = Math.max(target, c.x - this.pace.walk * dt * (c.x > 300 ? 2 : 1));
        } else {
          c.x = target;
          c.state = "wait";
          c.patience -= dt;
          if (c.patience <= 0) this.giveUp(c);
        }
      });
    }
    for (const c of this.customers) if (c.state === "leave") c.x += this.pace.walk * 2.2 * dt;
    this.customers = this.customers.filter((c) => !(c.state === "leave" && c.x > 340));

    // Slides
    for (const s of this.slides) {
      s.x += this.pace.slide * dt * s.dir;
      if (s.dir === 1) {
        const f = this.front(s.lane);
        if (f && s.x + 5 >= f.x - 5) {
          const left = this.remaining(f);
          if (left.includes(s.item)) {
            f.got.push(s.item);
            s.x = -999;
            this.sfx?.blip();
            if (this.remaining(f).length === 0) {
              this.startPay(f);
              if ((this.phase as Phase) === "pay") break;
            } else f.bubble = { text: "Yum! And...", t: 1 };
          } else {
            s.dir = -1;
            f.bubble = { text: `I wanted ${left.length ? ITEM_NAME[left[0]] : "that"}!`, t: 1.6 };
            this.setMsg(`${CUST_NAME[f.kind]} wanted ${left.length ? ITEM_NAME[left[0]] : "something else"}. The ${ITEM_NAME[s.item]} slides back to you.`, "no");
          }
        } else if (s.x >= LANE_END) s.dir = -1;
      } else if (s.x <= LANE_X0) {
        this.refund(s.item);
        s.x = -999;
      }
    }
    this.slides = this.slides.filter((s) => s.x > -900);

    // Closing time
    if (this.phase === "rush" && this.spawned >= this.orders.length && !this.customers.some((c) => c.state !== "leave") && this.slides.length === 0) {
      this.closing = 1.2;
      this.setMsg(this.soldOutFlag ? "SOLD OUT — closing time!" : "Closing time! Let's count the money.", "ok");
    }
    this.changed();
  }

  private giveUp(c: Customer) {
    c.state = "leave";
    c.mood = "sad";
    c.bubble = { text: "Maybe later!", t: 1.6 };
    this.today.missed++;
    // Items already handed over come back to the shelf.
    for (const g of c.got) this.refund(g);
    c.got = [];
  }

  private endRush() {
    // Overnight: ice melts and fruit spoils, unless you own the cooler.
    if (!this.upgrades.has("cooler")) {
      this.today.melted = this.stock.ice;
      this.today.spoiled = this.stock.fruit;
      this.stock.ice = 0;
      this.stock.fruit = 0;
    }
    this.phase = "ledger";
    const t = this.today;
    const q = reflectQuestion(
      this.grade,
      { scale: this.scale, revenue: t.revenue, cost: t.boughtCost, sold: { ...t.sold }, juicePrice: this.juicePrice, servingCost: this.servingCost("juice") },
      rng(hashSeed(this.seed, this.day, 777)),
    );
    this.ask(q, "reflect");
    const p = t.revenue - t.boughtCost;
    this.setMsg(`Evening ledger: revenue ${this.fmt(t.revenue)} − costs ${this.fmt(t.boughtCost)} = ${p >= 0 ? "profit" : "loss"} ${this.fmt(Math.abs(p))}.`, p >= 0 ? "ok" : "info");
    this.sfx?.levelUp();
    this.changed();
  }

  // ------------------------------------------------------------------ evening

  upgradeCost(id: UpgradeId) {
    return this.scale.upgrade[id];
  }
  buyUpgrade(id: UpgradeId) {
    if (this.phase !== "upgrade" || this.day >= this.days || this.upgrades.has(id)) return;
    const c = this.upgradeCost(id);
    if (c > this.cash) {
      this.setMsg(`The ${UPGRADES.find((u) => u.id === id)!.name.toLowerCase()} costs ${this.fmt(c)}. Save up a little more!`, "no");
      this.sfx?.wrong();
      this.changed();
      return;
    }
    this.cash -= c;
    this.today.upgradeCost += c;
    this.upgrades.add(id);
    this.setMsg(`New upgrade: ${UPGRADES.find((u) => u.id === id)!.name}!`, "ok");
    this.sfx?.levelUp();
    this.changed();
  }

  /** Leaves the upgrade screen: a transmission between days, or the report after the last day. */
  nextFromUpgrade() {
    if (this.phase !== "upgrade") return;
    const t = this.today;
    this.history.push({
      day: this.day,
      weather: WEATHER_WORD[t.forecast.weather],
      temp: t.forecast.temp,
      price: this.juicePrice,
      customers: t.demand?.customers ?? 0,
      served: t.served,
      missed: t.missed,
      soldOut: t.soldOut,
      tooBusy: t.tooBusy,
      revenue: t.revenue,
      costs: t.boughtCost,
      upgrades: t.upgradeCost,
      profit: t.revenue - t.boughtCost,
    });
    if (this.day >= this.days) {
      this.finish();
      return;
    }
    this.phase = "transmission";
    this.ask(this.deck!.draw(), "transmission");
    this.setMsg("◆ TRANSMISSION FROM THE ARCADE — answer to start the next day.");
    this.sfx?.checkpoint();
    this.changed();
  }

  private finish() {
    const owed = this.loanOwed();
    // Pay back what you can; the family never pushes the cart into debt.
    this.loanPaid = Math.min(owed, Math.max(0, this.cash));
    this.loanLeft = owed - this.loanPaid;
    this.cash -= this.loanPaid;
    this.finalCash = this.cash;
    const gain = this.finalCash - this.scale.start;
    this.score += Math.max(0, Math.round((gain / this.scale.ref) * 20));
    submitScore(GAME_ID, this.score);
    this.phase = "over";
    this.setMsg(
      !owed
        ? "Great week at the stand!"
        : this.loanLeft
          ? `You paid back ${this.fmt(this.loanPaid)} of the family loan. Family: "Pay the other ${this.fmt(this.loanLeft)} when you can!"`
          : `You paid back the family loan: ${this.fmt(owed)} (that includes the interest).`,
      "ok",
    );
    this.say(`The week is over. You finished with ${sayMoney(this.finalCash)}. Here is your report.`);
    this.sfx?.gameOver();
    this.changed();
  }

  toTitle() {
    this.phase = "title";
    this.q = null;
    this.customers = [];
    this.slides = [];
    this.changed();
  }

  setPaused(p: boolean) {
    this.paused = p;
    this.changed();
  }

  itemLabel(it: ItemId) {
    return ITEM_LABEL[it];
  }
}
