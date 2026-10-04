/*
 * The resource simulation shared by every expedition. Pure data in, data out (no DOM, no
 * randomness), so tests can check it against an independent reference and bots can play it.
 *
 * One day of travel:
 *   1. speed = round(leg.mpd × pace.speed × morale factor × repair factor), at least 1 mile,
 *      never past the next landmark
 *   2. the party eats party × ration food units; if there is not enough, food drops to 0 and the
 *      party must stop to work or trade (see workStop), which costs days
 *   3. grades 6–12: morale moves by pace + ration; wear builds up and uses spare parts
 *   4. the calendar moves one day; delayed consequences (grades 9–12) that are due arrive
 */
import type { Band, Effect, Expedition, Needs } from "@/data/types";

export interface Res {
  food: number;
  /** cents */
  money: number;
  parts: number;
  morale: number;
  trade: number;
}

export interface Later {
  day: number;
  effect: Effect;
  text: string;
}

export interface SimStats {
  tradeStops: number;
  workStops: number;
  workDays: number;
  foodEaten: number;
  spent: number;
  earned: number;
  delayDays: number;
}

export interface SimState {
  band: Band;
  day: number;
  /** Miles from the start. */
  mile: number;
  /** Current leg (0-based); equals legs.length when the journey is done. */
  leg: number;
  /** Miles done on the current leg. */
  legMile: number;
  res: Res;
  pace: number;
  ration: number;
  wear: number;
  pending: Later[];
  stats: SimStats;
}

export const MORALE_MAX = 100;
export const LOW_MORALE = 25;
export const LOW_MORALE_FACTOR = 0.85;
export const NO_PARTS_FACTOR = 0.85;

export function newSim(exp: Expedition, band: Band): SimState {
  return {
    band,
    day: 0,
    mile: 0,
    leg: 0,
    legMile: 0,
    res: { ...exp.startRes },
    pace: Math.min(1, exp.paces.length - 1),
    ration: Math.min(1, exp.rations.length - 1),
    wear: 0,
    pending: [],
    stats: { tradeStops: 0, workStops: 0, workDays: 0, foodEaten: 0, spent: 0, earned: 0, delayDays: 0 },
  };
}

export function cloneSim(s: SimState): SimState {
  return JSON.parse(JSON.stringify(s)) as SimState;
}

const r1 = (v: number) => Math.round(v * 10) / 10;

/** Miles the party covers in one day right now (before the "not past the landmark" limit). */
export function speedOf(s: SimState, exp: Expedition): number {
  const leg = exp.legs[Math.min(s.leg, exp.legs.length - 1)];
  let f = exp.paces[s.pace].speed;
  if (s.band >= 1 && s.res.morale < LOW_MORALE) f *= LOW_MORALE_FACTOR;
  if (s.band >= 1 && s.res.parts <= 0 && exp.mode === "wagon") f *= NO_PARTS_FACTOR;
  return Math.max(1, Math.round(leg.mpd * f));
}

/** Food the whole party eats in one day at the current ration. */
export function dailyFood(s: SimState, exp: Expedition): number {
  return r1(exp.party * exp.rations[s.ration].perPerson);
}

export function milesToNext(s: SimState, exp: Expedition): number {
  if (s.leg >= exp.legs.length) return 0;
  return exp.legs[s.leg].miles - s.legMile;
}

/** The forecast line: days to the next landmark at this pace, and days the food lasts. */
export function forecast(s: SimState, exp: Expedition): { miles: number; speed: number; days: number; foodDays: number } {
  const miles = milesToNext(s, exp);
  const speed = speedOf(s, exp);
  return { miles, speed, days: Math.ceil(miles / speed), foodDays: Math.floor(s.res.food / dailyFood(s, exp)) };
}

export function canAfford(s: SimState, needs?: Needs): boolean {
  if (!needs) return true;
  return (
    (needs.money ?? 0) <= s.res.money &&
    (needs.trade ?? 0) <= s.res.trade &&
    (needs.parts ?? 0) <= s.res.parts &&
    (needs.food ?? 0) <= s.res.food
  );
}

/** Applies an effect. Resources never go below zero; days and miles only move forward. */
export function applyEffect(s: SimState, exp: Expedition, e: Effect): void {
  if (e.money) {
    if (e.money < 0) s.stats.spent += Math.min(-e.money, s.res.money);
    else s.stats.earned += e.money;
    s.res.money = Math.max(0, s.res.money + e.money);
  }
  if (e.food) s.res.food = Math.max(0, r1(s.res.food + e.food));
  if (e.trade) s.res.trade = Math.max(0, s.res.trade + e.trade);
  if (e.parts) s.res.parts = Math.max(0, s.res.parts + e.parts);
  if (e.morale) s.res.morale = Math.max(0, Math.min(MORALE_MAX, s.res.morale + e.morale));
  if (e.days && e.days > 0) {
    s.day += e.days;
    s.stats.delayDays += e.days;
    // The party still eats while it waits.
    const eat = Math.min(s.res.food, r1(dailyFood(s, exp) * e.days));
    s.res.food = r1(s.res.food - eat);
    s.stats.foodEaten = r1(s.stats.foodEaten + eat);
  }
  if (e.miles && e.miles > 0 && s.leg < exp.legs.length) {
    const m = Math.min(e.miles, milesToNext(s, exp) - 1);
    if (m > 0) {
      s.legMile += m;
      s.mile += m;
    }
  }
}

export interface DayResult {
  miles: number;
  /** The party ran out of food today and must stop to work or trade. */
  outOfFood: boolean;
  /** Reached the landmark at the end of the leg. */
  reached: boolean;
  /** Delayed consequences that arrived today. */
  arrived: Later[];
  /** A spare part was used up today. */
  partUsed: boolean;
}

/** One day on the trail. */
export function travelDay(s: SimState, exp: Expedition): DayResult {
  const res: DayResult = { miles: 0, outOfFood: false, reached: false, arrived: [], partUsed: false };
  if (s.leg >= exp.legs.length) return res;
  const miles = Math.min(speedOf(s, exp), milesToNext(s, exp));
  s.legMile += miles;
  s.mile += miles;
  res.miles = miles;

  const need = dailyFood(s, exp);
  if (s.res.food >= need) {
    s.res.food = r1(s.res.food - need);
    s.stats.foodEaten = r1(s.stats.foodEaten + need);
  } else {
    s.stats.foodEaten = r1(s.stats.foodEaten + s.res.food);
    s.res.food = 0;
    res.outOfFood = true;
  }

  if (s.band >= 1) {
    const pace = exp.paces[s.pace];
    const ration = exp.rations[s.ration];
    s.res.morale = Math.max(0, Math.min(MORALE_MAX, s.res.morale + pace.morale + ration.morale));
    s.wear = r1(s.wear + pace.wear);
    while (s.wear >= 1) {
      s.wear = r1(s.wear - 1);
      if (s.res.parts > 0) {
        s.res.parts -= 1;
        res.partUsed = true;
      }
    }
  }

  s.day += 1;
  res.arrived = takeDue(s, exp);
  if (s.legMile >= exp.legs[s.leg].miles) res.reached = true;
  return res;
}

/** Delayed consequences (grades 9–12) that are due by today, applied in order. */
export function takeDue(s: SimState, exp: Expedition): Later[] {
  const due = s.pending.filter((p) => p.day <= s.day);
  if (!due.length) return due;
  s.pending = s.pending.filter((p) => p.day > s.day);
  for (const d of due) applyEffect(s, exp, d.effect);
  return due;
}

/** Stop to work or trade: costs days, earns money and food. */
export function workStop(s: SimState, exp: Expedition): void {
  const w = exp.work;
  s.stats.workStops += 1;
  s.stats.workDays += w.days;
  s.day += w.days;
  s.res.money += w.money;
  s.stats.earned += w.money;
  s.res.food = r1(s.res.food + w.food);
  if (s.band >= 1) s.res.morale = Math.max(0, Math.min(MORALE_MAX, s.res.morale + 2));
}

/** Out of food but not out of money: stop to buy or trade for food (costs days and money). */
export function canResupply(s: SimState, exp: Expedition): boolean {
  return s.res.money >= exp.resupply.money;
}

export function resupplyStop(s: SimState, exp: Expedition): void {
  const r = exp.resupply;
  s.stats.tradeStops += 1;
  s.day += r.days;
  s.res.money -= r.money;
  s.stats.spent += r.money;
  s.res.food = r1(s.res.food + r.food);
}

/** Moves on to the next leg once the landmark is done. Returns true when the journey is over. */
export function nextLeg(s: SimState, exp: Expedition): boolean {
  s.leg += 1;
  s.legMile = 0;
  return s.leg >= exp.legs.length;
}

/** The fixed cost to leave on the current leg (0 when none). */
export function legCost(s: SimState, exp: Expedition): number {
  return exp.legs[s.leg]?.cost?.money ?? 0;
}

/** Pays the leg cost if possible. False means the party must stop to work first. */
export function payLegCost(s: SimState, exp: Expedition): boolean {
  const c = legCost(s, exp);
  if (c > s.res.money) return false;
  if (c) applyEffect(s, exp, { money: -c });
  return true;
}

export function isLate(s: SimState, exp: Expedition): boolean {
  return s.day > exp.deadline[s.band];
}

/** Calendar date for a day number ("Oct 8, 1753"). */
export function dateOf(exp: Expedition, day: number): { label: string; short: string } {
  const [y, m, d] = exp.start.split("-").map(Number);
  const t = new Date(Date.UTC(y, m - 1, d + day));
  const mon = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][t.getUTCMonth()];
  return { label: `${mon} ${t.getUTCDate()}, ${t.getUTCFullYear()}`, short: `${mon} ${t.getUTCDate()}` };
}

export function dollars(cents: number): string {
  const neg = cents < 0;
  const c = Math.abs(Math.round(cents));
  const s = `$${Math.floor(c / 100).toLocaleString("en-US")}.${String(c % 100).padStart(2, "0")}`;
  return neg ? `−${s}` : s;
}
