/*
 * Embedded trail math, generated fresh for the player's math grade (adaptive via the kit's
 * mathGradeFor, chosen by the caller). Two moments ask math:
 *   - "outfit": at the store (totals and change → unit rates and percents → budgets with constraints;
 *     grade 12 budgeting is tagged EPF.MCM.1.1)
 *   - "forecast": on the trail (how long the food lasts, days to the next landmark → rates →
 *     d = rt, rates of change and inequalities)
 * Every question carries its numbers in `calc`, and the test suite recomputes every answer
 * with its own solver.
 */
import type { Grade } from "@/kit/types";
import type { TLQuestion } from "@/game/question";
import { dollars } from "./sim";

export type Calc =
  | { t: "sum"; prices: number[]; qty: number[] }
  | { t: "change"; paid: number; prices: number[]; qty: number[] }
  | { t: "lasts"; amount: number; perDay: number }
  | { t: "daysTo"; miles: number; mpd: number }
  | { t: "unitRate"; total: number; qty: number }
  | { t: "percentOf"; pct: number; base: number }
  | { t: "markup"; pct: number; base: number }
  | { t: "proportion"; a: number; b: number; c: number }
  | { t: "slope"; d1: number; m1: number; d2: number; m2: number }
  | { t: "linearAt"; m: number; b: number; x: number }
  | { t: "solveT"; d: number; r: number }
  | { t: "maxUnits"; budget: number; fixed: number; unit: number }
  | { t: "rateNeeded"; miles: number; days: number }
  | { t: "budgetLeft"; income: number; costs: number[] }
  | { t: "budgetShare"; income: number; pct: number };

export type Fmt = "money" | "days" | "mpd" | "miles" | "food" | "count";

export interface OutfitCtx {
  /** Basket lines with quantity > 0. Prices in cents. */
  items: { name: string; unit: string; price: number; qty: number }[];
  budget: number;
  foodUnit: string;
  where: string;
}

export interface ForecastCtx {
  place: string;
  miles: number;
  speed: number;
  food: number;
  perDay: number;
  foodUnit: string;
  daysLeft: number;
  day: number;
  mile: number;
}

type Rand = () => number;
const ri = (rand: Rand, lo: number, hi: number) => lo + Math.floor(rand() * (hi - lo + 1));
const pickR = <T>(rand: Rand, a: readonly T[]): T => a[Math.floor(rand() * a.length)];

export function fmt(v: number, f: Fmt, unit = ""): string {
  switch (f) {
    case "money":
      return dollars(v);
    case "days":
      return v === 1 ? "1 day" : `${v} days`;
    case "mpd":
      return `${v} mi/day`;
    case "miles":
      return `${v.toLocaleString("en-US")} mi`;
    case "food":
      return `${v.toLocaleString("en-US")} ${unit}`;
    case "count":
      return `${v} ${unit}`.trim();
  }
}

/** Three wrong answers: the typical mistakes first, then nearby values. */
function wrongs(v: number, typical: number[], step: number): number[] {
  const out: number[] = [];
  const ok = (x: number) => Number.isFinite(x) && x > 0 && x !== v && !out.includes(x) && Math.round(x) === x;
  for (const x of typical) if (out.length < 3 && ok(x)) out.push(x);
  for (let k = 1; out.length < 3; k++) {
    for (const x of [v + k * step, v - k * step]) if (out.length < 3 && ok(x)) out.push(x);
  }
  return out;
}

interface Draft {
  id: string;
  standard: string;
  skill: string;
  prompt: string;
  value: number;
  typical: number[];
  step: number;
  f: Fmt;
  unit?: string;
  explanation: string;
  calc: Calc;
  subject?: "math" | "social";
}

let counter = 0;

function build(d: Draft, grade: Grade): TLQuestion {
  const w = wrongs(d.value, d.typical, d.step);
  const choices = [d.value, ...w].map((x) => fmt(x, d.f, d.unit)) as [string, string, string, string];
  return {
    id: `tl-${d.id}-${grade}-${++counter}`,
    subject: d.subject ?? "math",
    grade,
    standard: d.standard,
    skill: d.skill,
    prompt: d.prompt,
    choices,
    answer: 0,
    explanation: d.explanation,
    source: "math",
    calc: d.calc,
    hint: hintFor(d.calc),
  };
}

function hintFor(c: Calc): string {
  switch (c.t) {
    case "sum":
      return "Multiply each price by how many you bought, then add.";
    case "change":
      return "Find the total first, then subtract it from what you paid.";
    case "lasts":
      return "Divide the food by what the party eats each day. Only whole days count.";
    case "daysTo":
      return "Divide the miles by the miles per day. A part of a day still counts as a day.";
    case "unitRate":
      return "Divide the total cost by the number of units.";
    case "percentOf":
      return "Change the percent to a fraction of 100, then multiply.";
    case "markup":
      return "Find the percent of the old price, then add it on (or take it off).";
    case "proportion":
      return "Find the amount for one day first, then multiply.";
    case "slope":
      return "Change in miles ÷ change in days.";
    case "linearAt":
      return "Put the number of days in for d.";
    case "solveT":
      return "d = rt, so t = d ÷ r.";
    case "maxUnits":
      return "Subtract the fixed cost, then divide by the cost of one. Round down.";
    case "rateNeeded":
      return "Miles ÷ days, then round up to a whole number.";
    case "budgetLeft":
      return "Add every expense, then subtract from the budget.";
    case "budgetShare":
      return "Multiply the budget by the percent as a decimal.";
  }
}

const dayWord = (n: number) => (n === 1 ? "day" : "days");

/* ------------------------------------------------------------------ outfit (store) */

function outfitLines(ctx: OutfitCtx, rand: Rand, n: number) {
  const pool = ctx.items.filter((i) => i.qty > 0);
  const out: OutfitCtx["items"] = [];
  while (out.length < n && pool.length) out.push(pool.splice(Math.floor(rand() * pool.length), 1)[0]);
  return out;
}

export function outfitMath(g: number, grade: Grade, ctx: OutfitCtx, rand: Rand): TLQuestion {
  // Grade 12 budgeting (Economics & Personal Finance) when the player is in grade 12.
  if (grade === "12") return budget12(grade, ctx, rand);
  if (g <= 3) {
    const a = ri(rand, 12, 58), b = ri(rand, 11, 39);
    const [x, y] = outfitLines(ctx, rand, 2);
    const na = x?.name ?? "A sack of meal", nb = y?.name ?? "a kettle";
    return build({
      id: "sum3", standard: "NC.3.NBT.2", skill: "Add money", f: "money", step: 100,
      prompt: `${na} costs $${a} and ${nb.toLowerCase()} costs $${b}. What do they cost together?`,
      value: (a + b) * 100, typical: [(a + b - 10) * 100, (a + b + 10) * 100, Math.abs(a - b) * 100],
      explanation: `$${a} + $${b} = $${a + b}.`,
      calc: { t: "sum", prices: [a * 100, b * 100], qty: [1, 1] },
    }, grade);
  }
  if (g === 4) {
    const a = ri(rand, 23, 89), b = ri(rand, 14, 67), c = ri(rand, 5, 29);
    const paid = a + b + c < 100 ? 100 : 200;
    const tot = a + b + c;
    return build({
      id: "change4", standard: "NC.4.NBT.4", skill: "Make change", f: "money", step: 100,
      prompt: `At ${ctx.where} you buy things that cost $${a}, $${b} and $${c}. You pay $${paid}. How much change?`,
      value: (paid - tot) * 100, typical: [(paid - tot + 10) * 100, (paid - tot - 10) * 100, tot * 100],
      explanation: `$${a} + $${b} + $${c} = $${tot}. Then $${paid} − $${tot} = $${paid - tot}.`,
      calc: { t: "change", paid: paid * 100, prices: [a * 100, b * 100, c * 100], qty: [1, 1, 1] },
    }, grade);
  }
  if (g === 5) {
    const lines = outfitLines(ctx, rand, 2).map((l) => ({ ...l, qty: Math.min(9, Math.max(1, l.qty)) }));
    while (lines.length < 2) lines.push({ name: "Rope", unit: "coil", price: 125, qty: 2 });
    const tot = lines.reduce((s, l) => s + l.price * l.qty, 0);
    if (rand() < 0.5) {
      return build({
        id: "sum5", standard: "NC.5.NBT.7", skill: "Money totals", f: "money", step: 100,
        prompt: `${lines[0].qty} × ${lines[0].name.toLowerCase()} at ${dollars(lines[0].price)} each and ${lines[1].qty} × ${lines[1].name.toLowerCase()} at ${dollars(lines[1].price)} each. What is the total?`,
        value: tot, typical: [lines[0].price + lines[1].price, tot + 1000, tot - 100],
        explanation: `${lines[0].qty} × ${dollars(lines[0].price)} = ${dollars(lines[0].price * lines[0].qty)} and ${lines[1].qty} × ${dollars(lines[1].price)} = ${dollars(lines[1].price * lines[1].qty)}. Together: ${dollars(tot)}.`,
        calc: { t: "sum", prices: lines.map((l) => l.price), qty: lines.map((l) => l.qty) },
      }, grade);
    }
    const paid = Math.ceil((tot + 1) / 1000) * 1000;
    return build({
      id: "change5", standard: "NC.5.NBT.7", skill: "Make change", f: "money", step: 100,
      prompt: `You buy ${lines[0].qty} × ${lines[0].name.toLowerCase()} at ${dollars(lines[0].price)} and ${lines[1].qty} × ${lines[1].name.toLowerCase()} at ${dollars(lines[1].price)}. You pay ${dollars(paid)}. What is your change?`,
      value: paid - tot, typical: [paid - tot + 100, tot, paid - tot + 10],
      explanation: `Total: ${dollars(tot)}. Change: ${dollars(paid)} − ${dollars(tot)} = ${dollars(paid - tot)}.`,
      calc: { t: "change", paid, prices: lines.map((l) => l.price), qty: lines.map((l) => l.qty) },
    }, grade);
  }
  if (g === 6) {
    if (rand() < 0.5) {
      const unit = ri(rand, 3, 45) * 5, qty = ri(rand, 4, 24), total = unit * qty;
      const what = pickR(rand, ["coffee", "sugar", "salt", "dried apples", "rice"]);
      return build({
        id: "rate6", standard: "NC.6.RP.3", skill: "Unit rate", f: "money", step: 5,
        prompt: `${qty} lb of ${what} costs ${dollars(total)}. What is the price for 1 lb (the unit rate)?`,
        value: unit, typical: [unit * 10, unit + 5, Math.round(total / (qty + 1))],
        explanation: `${dollars(total)} ÷ ${qty} = ${dollars(unit)} per pound.`,
        calc: { t: "unitRate", total, qty },
      }, grade);
    }
    const pct = pickR(rand, [10, 15, 20, 25, 30, 40]);
    const base = Math.round(ctx.budget / 2000) * 2000 || 20000;
    const v = (base * pct) / 100;
    return build({
      id: "pct6", standard: "NC.6.RP.3", skill: "Percent of a number", f: "money", step: 500,
      prompt: `Your budget is ${dollars(base)}. You plan to spend ${pct}% of it on spare parts and tools. How much is that?`,
      value: v, typical: [pct * 100, v * 2, base - v],
      explanation: `${pct}% = ${pct}/100. ${dollars(base)} × ${pct}/100 = ${dollars(v)}.`,
      calc: { t: "percentOf", pct, base },
    }, grade);
  }
  if (g === 7) {
    const up = rand() < 0.6;
    const pct = up ? pickR(rand, [10, 20, 25, 30, 40, 50]) : pickR(rand, [10, 20, 25]);
    const base = ri(rand, 4, 40) * 100;
    const v = base + (base * (up ? pct : -pct)) / 100;
    const what = pickR(rand, ["a sack of flour", "a pair of boots", "an ox yoke", "a water keg", "a lantern"]);
    return build({
      id: up ? "markup7" : "discount7", standard: "NC.7.RP.3", skill: up ? "Percent markup" : "Percent discount", f: "money", step: 100,
      prompt: up
        ? `${what[0].toUpperCase()}${what.slice(1)} costs ${dollars(base)} back home. Far from town the price is ${pct}% higher. What is the new price?`
        : `${what[0].toUpperCase()}${what.slice(1)} costs ${dollars(base)}. The storekeeper takes ${pct}% off for buying early. What do you pay?`,
      value: v, typical: [base + (up ? -1 : 1) * (base * pct) / 100, (base * pct) / 100, base + pct * 100],
      explanation: `${pct}% of ${dollars(base)} is ${dollars((base * pct) / 100)}. ${dollars(base)} ${up ? "+" : "−"} ${dollars((base * pct) / 100)} = ${dollars(v)}.`,
      calc: { t: "markup", pct: up ? pct : -pct, base },
    }, grade);
  }
  if (g === 8) {
    // Linear cost: fixed + per unit.
    const fixed = ri(rand, 2, 12) * 100, per = ri(rand, 3, 15) * 25, x = ri(rand, 4, 20);
    const v = fixed + per * x;
    return build({
      id: "linear8", standard: "NC.8.F.4", skill: "Linear functions", f: "money", step: 100,
      prompt: `A blacksmith charges ${dollars(fixed)} plus ${dollars(per)} per iron part: c = ${(per / 100).toFixed(2)}p + ${(fixed / 100).toFixed(2)}. What do ${x} parts cost?`,
      value: v, typical: [per * x, (fixed + per) * x, fixed * x + per],
      explanation: `c = ${(per / 100).toFixed(2)} × ${x} + ${(fixed / 100).toFixed(2)} = ${dollars(v)}.`,
      calc: { t: "linearAt", m: per, b: fixed, x },
    }, grade);
  }
  // Grades 9–11: budgets with constraints (inequalities).
  const budget = Math.max(1000, Math.round(ctx.budget / 100) * 100);
  const fixed = Math.round((budget * ri(rand, 15, 45)) / 100 / 25) * 25;
  const n = ri(rand, 4, 30);
  const unit = Math.max(5, Math.round((budget - fixed) / (n + 0.4) / 5) * 5);
  const v = Math.floor((budget - fixed) / unit);
  return build({
    id: "ineq", standard: "NC.M1.A-REI.3", skill: "Linear inequalities", f: "count", unit: "sacks", step: 1,
    prompt: `Budget ${dollars(budget)}. You must spend ${dollars(fixed)} on the wagon first; flour is ${dollars(unit)} a sack. Most whole sacks x with ${(unit / 100).toFixed(2)}x + ${(fixed / 100).toFixed(2)} ≤ ${(budget / 100).toFixed(2)}?`,
    value: v, typical: [v + 1, Math.floor(budget / unit), v - 1],
    explanation: `${(unit / 100).toFixed(2)}x ≤ ${((budget - fixed) / 100).toFixed(2)}, so x ≤ ${((budget - fixed) / unit).toFixed(2)}. Round down: ${v} sacks.`,
    calc: { t: "maxUnits", budget, fixed, unit },
  }, grade);
}

function budget12(grade: Grade, ctx: OutfitCtx, rand: Rand): TLQuestion {
  const income = Math.round(ctx.budget / 1000) * 1000 || 40000;
  if (rand() < 0.5) {
    const pct = pickR(rand, [40, 45, 50, 55, 60]);
    const v = (income * pct) / 100;
    return build({
      id: "share12", standard: "EPF.MCM.1.1", skill: "Budgeting", subject: "social", f: "money", step: 1000,
      prompt: `Your outfit budget is ${dollars(income)}. You plan to put ${pct}% of it toward food, your biggest need. How much is that?`,
      value: v, typical: [income - v, (income * (pct - 10)) / 100, pct * 100],
      explanation: `${pct}% of ${dollars(income)} = ${(pct / 100).toFixed(2)} × ${dollars(income)} = ${dollars(v)}. A budget gives the biggest need its share first.`,
      calc: { t: "budgetShare", income, pct },
    }, grade);
  }
  const part = (lo: number, hi: number) => Math.max(25, Math.round((income * ri(rand, lo, hi)) / 100 / 25) * 25);
  const costs = [part(40, 55), part(15, 25), part(5, 12)];
  const left = income - costs.reduce((a, b) => a + b, 0);
  return build({
    id: "left12", standard: "EPF.MCM.1.1", skill: "Budgeting", subject: "social", f: "money", step: 1000,
    prompt: `Budget ${dollars(income)}. Planned costs: food ${dollars(costs[0])}, wagon and team ${dollars(costs[1])}, tools ${dollars(costs[2])}. How much is left for emergencies?`,
    value: left, typical: [left + costs[2], left - 1000, income - costs[0]],
    explanation: `${dollars(costs[0])} + ${dollars(costs[1])} + ${dollars(costs[2])} = ${dollars(income - left)}. ${dollars(income)} − ${dollars(income - left)} = ${dollars(left)} left for emergencies.`,
    calc: { t: "budgetLeft", income, costs },
  }, grade);
}

/* ------------------------------------------------------------------ forecast (trail) */

export function forecastMath(g: number, grade: Grade, ctx: ForecastCtx, rand: Rand): TLQuestion {
  const u = ctx.foodUnit;
  if (g <= 3) {
    const per = ri(rand, 2, 9), k = ri(rand, 2, 9);
    return build({
      id: "lasts3", standard: "NC.3.OA.3", skill: "Division", f: "days", step: 1,
      prompt: `The party eats ${per} ${u} of food a day. You have ${per * k} ${u}. How many days will it last?`,
      value: k, typical: [k + 1, k - 1, per],
      explanation: `${per * k} ÷ ${per} = ${k}, so the food lasts ${k} days.`,
      calc: { t: "lasts", amount: per * k, perDay: per },
    }, grade);
  }
  if (g === 4) {
    const per = ri(rand, 6, 9), k = ri(rand, 11, 40), r = ri(rand, 1, per - 1);
    const amount = per * k + r;
    return build({
      id: "lasts4", standard: "NC.4.NBT.6", skill: "Division with remainders", f: "days", step: 1,
      prompt: `You have ${amount} ${u} of food. The party eats ${per} ${u} a day. For how many full days will it last?`,
      value: k, typical: [k + 1, r, k - 1],
      explanation: `${amount} ÷ ${per} = ${k} R ${r}. The ${r} left over is not a full day, so ${k} full days.`,
      calc: { t: "lasts", amount, perDay: per },
    }, grade);
  }
  if (g === 5) {
    if (rand() < 0.5 && ctx.miles >= 20 && ctx.speed >= 2) {
      const v = Math.ceil(ctx.miles / ctx.speed);
      return build({
        id: "daysTo5", standard: "NC.5.NBT.6", skill: "Division word problems", f: "days", step: 1,
        prompt: `${ctx.place} is ${ctx.miles} miles away. You go about ${ctx.speed} miles a day. How many days until you get there?`,
        value: v, typical: [Math.floor(ctx.miles / ctx.speed) === v ? v + 1 : Math.floor(ctx.miles / ctx.speed), v + 2, ctx.miles - ctx.speed],
        explanation: `${ctx.miles} ÷ ${ctx.speed} = ${(ctx.miles / ctx.speed).toFixed(1)}. Part of a day still counts, so it takes ${v} ${dayWord(v)}.`,
        calc: { t: "daysTo", miles: ctx.miles, mpd: ctx.speed },
      }, grade);
    }
    const per = ri(rand, 12, 45), k = ri(rand, 9, 60), r = ri(rand, 0, per - 1);
    const amount = per * k + r;
    return build({
      id: "lasts5", standard: "NC.5.NBT.6", skill: "Division word problems", f: "days", step: 1,
      prompt: `The wagon carries ${amount.toLocaleString("en-US")} ${u} of food. The party eats ${per} ${u} a day. For how many full days will it last?`,
      value: k, typical: [k + 1, k - 1, k + 10],
      explanation: `${amount} ÷ ${per} = ${k}${r ? ` R ${r}` : ""}. So the food lasts ${k} full days.`,
      calc: { t: "lasts", amount, perDay: per },
    }, grade);
  }
  if (g === 6) {
    const d = ri(rand, 3, 8), mpd = ri(rand, 9, 22), miles = d * mpd;
    const t = ri(rand, 9, 30);
    return build({
      id: "rate6f", standard: "NC.6.RP.3", skill: "Rates", f: "miles", step: mpd,
      prompt: `You went ${miles} miles in ${d} days. At the same rate, how far will you go in ${t} days?`,
      value: mpd * t, typical: [miles + t, mpd * (t - 1), mpd * t + d],
      explanation: `${miles} ÷ ${d} = ${mpd} miles a day. ${mpd} × ${t} = ${mpd * t} miles.`,
      calc: { t: "proportion", a: d, b: miles, c: t },
    }, grade);
  }
  if (g === 7) {
    const a = ri(rand, 2, 6), per = ri(rand, 4, 25) * Math.max(1, Math.round(ctx.perDay / 20)), c = ri(rand, 7, 20);
    return build({
      id: "prop7", standard: "NC.7.RP.2", skill: "Proportional relationships", f: "food", unit: u, step: per,
      prompt: `In ${a} days the party ate ${a * per} ${u}. The amount eaten is proportional to the days. How much will it eat in ${c} days?`,
      value: per * c, typical: [a * per + c, per * (c + 1), a * per * c],
      explanation: `The constant of proportionality is ${a * per} ÷ ${a} = ${per} ${u} per day. ${per} × ${c} = ${per * c} ${u}.`,
      calc: { t: "proportion", a, b: a * per, c },
    }, grade);
  }
  if (g === 8) {
    const r = ri(rand, 9, 21), d1 = ri(rand, 2, 12), dd = ri(rand, 3, 9), m1 = ctx.mile > 50 ? Math.round(ctx.mile / 10) * 10 : ri(rand, 30, 400);
    return build({
      id: "slope8", standard: "NC.8.F.4", skill: "Rate of change", f: "mpd", step: 2,
      prompt: `On day ${d1} the Ledger says mile ${m1}. On day ${d1 + dd} it says mile ${m1 + r * dd}. What is the rate of change in miles per day?`,
      value: r, typical: [r * dd, r + 1, Math.round((m1 + r * dd) / (d1 + dd))],
      explanation: `(${m1 + r * dd} − ${m1}) ÷ (${d1 + dd} − ${d1}) = ${r * dd} ÷ ${dd} = ${r} miles per day.`,
      calc: { t: "slope", d1, m1, d2: d1 + dd, m2: m1 + r * dd },
    }, grade);
  }
  if (g === 9 || g === 10) {
    if (rand() < 0.5) {
      const r = Math.max(8, Math.min(30, ctx.speed || ri(rand, 10, 18))), t = ri(rand, 6, 30);
      return build({
        id: "drt", standard: "NC.M1.A-CED.1", skill: "d = rt", f: "days", step: 1,
        prompt: `Use d = rt. The next stretch is ${r * t} miles and your rate is ${r} miles per day. Solve for t, the days it takes.`,
        value: t, typical: [t + 1, Math.round((r * t) / (r + 2)), t + r],
        explanation: `t = d ÷ r = ${r * t} ÷ ${r} = ${t} days.`,
        calc: { t: "solveT", d: r * t, r },
      }, grade);
    }
    const d1 = ri(rand, 3, 20), dd = ri(rand, 4, 12), r = ri(rand, 8, 19), m1 = ri(rand, 10, 90) * 10;
    return build({
      id: "roc", standard: "NC.M1.F-IF.6", skill: "Average rate of change", f: "mpd", step: 2,
      prompt: `Miles traveled m(d): m(${d1}) = ${m1} and m(${d1 + dd}) = ${m1 + r * dd}. What is the average rate of change over that interval?`,
      value: r, typical: [r * dd, r + 1, Math.round((m1 + r * dd) / (d1 + dd))],
      explanation: `[m(${d1 + dd}) − m(${d1})] ÷ (${d1 + dd} − ${d1}) = ${r * dd} ÷ ${dd} = ${r} miles per day.`,
      calc: { t: "slope", d1, m1, d2: d1 + dd, m2: m1 + r * dd },
    }, grade);
  }
  // Grades 11–12: the calendar as a constraint.
  const days = Math.max(4, Math.min(40, ctx.daysLeft > 4 ? Math.min(ctx.daysLeft, 30) : ri(rand, 8, 25)));
  let miles = ctx.miles > 30 ? ctx.miles : ri(rand, 120, 600);
  if (miles % days === 0) miles += 1;
  const v = Math.ceil(miles / days);
  return build({
    id: "need", standard: "NC.M1.A-REI.3", skill: "Inequalities and rates", f: "mpd", step: 1,
    prompt: `${ctx.place} is ${miles} miles away and you must arrive within ${days} days. What is the smallest whole-number pace r with ${days}r ≥ ${miles}?`,
    value: v, typical: [v - 1, Math.floor(miles / days) + 2 === v ? v + 1 : Math.floor(miles / days) + 2, days],
    explanation: `r ≥ ${miles} ÷ ${days} ≈ ${(miles / days).toFixed(2)}, so the smallest whole pace is ${v} miles per day (${v - 1} would leave you short).`,
    calc: { t: "rateNeeded", miles, days },
  }, grade);
}

/** Numeric value of a generated question's correct answer as shown (used by tests and hints). */
export function parseAnswer(text: string): number {
  const m = text.replace(/,/g, "").match(/-?\$?(\d+(?:\.\d+)?)/);
  if (!m) return NaN;
  return text.includes("$") ? Math.round(Number(m[1]) * 100) : Number(m[1]);
}
