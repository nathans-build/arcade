/*
 * Multi-step STORY PROBLEMS ("chains", 2–4 steps): `? MATH chain:receipt who=Ms_Pell : lead-in`.
 * Quill first asks for the FINAL answer. Its wrong choices are the values of the earlier steps
 * (the step-one answer, the before-tax price...), each with feedback that names the step.
 * On a miss the problem breaks into its steps: each step is its own question with its own
 * skill tag, and the last step asks for the final answer again.
 */
import { clock, int, pick, terminates, type Rng } from "./format";
import { TAG_CODE, type ChainQ, type MathQ, type Params, type SkillTag } from "./types";
import {
  Retry, comboText, finish, money, sentences, name, nudges, num, opt, paintCostQ, paintShop, room, roomText, roundCents, twoNames, unitFmt, type Opt,
} from "./unit3";

interface StepSpec {
  tag: SkillTag;
  label: string;
  prompt: string;
  value: number;
  fmt: (x: number) => string;
  unit: string;
  wrong: (Opt | null | false)[];
  hints: [string, string];
  rounding?: boolean;
}

/** Short worked steps ("8 × 3") read better as "Work it out: 8 × 3." */
const worked = (h: [string, string]): [string, string] => [h[0], h[1].length < 24 && !/[.?!]$/.test(h[1]) ? `Work it out: ${h[1]}.` : h[1]];

function step(gen: string, s: StepSpec): MathQ {
  return finish(
    { gen, tag: s.tag, prompt: s.prompt, steps: 1, unit: s.unit, value: s.value, hints: worked(s.hints), facts: {}, label: s.label, rounding: s.rounding },
    s.fmt(s.value),
    s.wrong,
    nudges(s.value, s.fmt, s.unit === "cents"),
  );
}

/** The final question: correct answer + every earlier step's value (named) + extra mistakes. */
function finalQ(gen: string, tag: SkillTag, prompt: string, value: number, fmt: (x: number) => string, unit: string, wrong: (Opt | null | false)[], hints: [string, string], nSteps: number): MathQ {
  return finish({ gen, tag, prompt, steps: nSteps, unit, value, hints, facts: {} }, fmt(value), wrong, nudges(value, fmt, unit === "cents"));
}

/** Does a choice text show this value (money or plain number)? */
export function mentions(text: string, v: number, unit: string): boolean {
  if (unit === "cents") return text.includes(money(v));
  const s = num(v).replace(/[.]/g, "\\.");
  return new RegExp(`(^|[^\\d.,])${s}(?![\\d,]|\\.\\d)`).test(text);
}

function chain(gen: string, tag: SkillTag, setup: string, final: MathQ, steps: MathQ[], clue: string, facts: ChainQ["facts"]): ChainQ {
  // Every earlier step's value must be one of the final answer's wrong choices.
  for (const s of steps.slice(0, -1)) {
    if (typeof s.value !== "number") continue;
    if (!final.choices.some((ch) => !ch.correct && mentions(ch.text, s.value as number, s.unit))) throw new Retry("step value missing from final choices");
  }
  return { gen, tag, code: TAG_CODE[tag], setup: sentences(setup), final, steps, clue: sentences(clue), facts };
}

/** Last step = the final question again, with its own prompt and a worked nudge from the step before. */
function lastStep(final: MathQ, prompt: string, label: string, tag: SkillTag, hints: [string, string]): MathQ {
  return { ...final, prompt, label, tag, code: TAG_CODE[tag], hints: worked(hints), steps: 1 };
}

// ---------------------------------------------------------------------------------------------
// Mall: receipt (subtotal → coupon → after coupon → tax)
// ---------------------------------------------------------------------------------------------
function receipt(rng: Rng, p: Params): ChainQ {
  const gen = "chain:receipt";
  const who = name(p, "who", "the shopper");
  const item = name(p, "item", "scarves");
  const n = int(rng, 2, 5);
  const u = int(rng, 30, 160) * 25;
  const pc = pick(rng, [10, 20, 25, 15, 30]);
  const r = pick(rng, [6, 7, 8, 5]);
  const sub = n * u;
  const disc = roundCents((sub * pc) / 100);
  const after = sub - disc;
  const tax = roundCents((after * r) / 100);
  const total = after + tax;
  const setup = `${who} bought ${n} ${item} at ${money(u)} each, used a ${pc}% off coupon, and paid ${r}% sales tax.`;
  const T: SkillTag = "Discounts, tax, and tips (two-step)";
  const final = finalQ(gen, T, `${setup} What should the receipt total be?`, total, money, "cents", [
    { text: money(sub), why: `That's only step 1, the cost before the coupon and tax. What did ${who} actually pay?` },
    { text: money(disc), why: `That's the coupon savings, not what ${who} paid.` },
    { text: money(after), why: `That's after the coupon but before tax. Add the ${r}% tax.` },
    opt(sub + roundCents((sub * r) / 100), money, "You skipped the coupon."),
  ], ["Four steps: cost of all the items, the coupon savings, the price after the coupon, then add tax.", `${n} × ${money(u)} = ${money(sub)}. Now find ${pc}% of that.`], 4);
  const steps = [
    step(gen, { tag: "Multi-step rate problems", label: "Cost before coupon", prompt: `Step 1: What do ${n} ${item} cost before the coupon?`, value: sub, fmt: money, unit: "cents",
      wrong: [opt(u, money, `That's just one. Multiply by ${n}.`), opt(u + n * 100, money, `Multiply ${money(u)} by ${n}, don't add.`)], hints: ["Same price each: multiply.", `${n} × ${money(u)}`] }),
    step(gen, { tag: "Percent of a number (find the part)", label: "Coupon savings", prompt: `Step 2: How much does the ${pc}% coupon take off ${money(sub)}?${(sub * pc) % 100 ? " (Round to the nearest cent.)" : ""}`, value: disc, fmt: money, unit: "cents", rounding: (sub * pc) % 100 !== 0,
      wrong: [opt(after, money, "That's what's left to pay, not the savings."), opt(pc * 100, money, `That's ${pc} dollars, not ${pc}%.`), opt(roundCents((sub * pc) / 1000), money, "Check the decimal point: 10 times too small.")], hints: [`${pc}% = ${pc}/100.`, `1% of ${money(sub)} is ${num(sub / 10000, 4)} dollars. Times ${pc}.`] }),
    step(gen, { tag: T, label: "After coupon", prompt: `Step 3: What is the price after the ${money(disc)} coupon?`, value: after, fmt: money, unit: "cents",
      wrong: [opt(sub + disc, money, "A coupon makes the price go DOWN."), opt(disc, money, "That's the savings. What's left to pay?")], hints: ["Take the savings off.", `${money(sub)} − ${money(disc)}`] }),
  ];
  steps.push(lastStep(final, `Last step: add ${r}% sales tax to ${money(after)}. What is the receipt total? (Round the tax to the nearest cent.)`, "Receipt total", T, [`Find ${r}% of ${money(after)}, then add it on.`, `Tax = ${money(tax)}. ${money(after)} + ${money(tax)} = ?`]));
  return chain(gen, T, setup, final, steps, `Receipt check: ${n} ${item} with a ${pc}% coupon and ${r}% tax should total ${money(total)}.`, { n, u, pc, r });
}

// ---------------------------------------------------------------------------------------------
// Mall: sale price + tax
// ---------------------------------------------------------------------------------------------
function saleTax(rng: Rng, p: Params): ChainQ {
  const gen = "chain:sale-tax";
  const item = name(p, "item", "skateboard");
  const W = int(rng, 12, 90) * 100 - pick(rng, [0, 0, 1, 5]);
  const P = pick(rng, [10, 15, 20, 25, 30, 40]);
  const r = pick(rng, [6, 7, 8]);
  const disc = roundCents((W * P) / 100);
  const sale = W - disc;
  const tax = roundCents((sale * r) / 100);
  const total = sale + tax;
  const T: SkillTag = "Discounts, tax, and tips (two-step)";
  const setup = `The ${item} has a ${money(W)} tag. Today it is ${P}% off, and there is ${r}% sales tax.`;
  const final = finalQ(gen, T, `${setup} What is the total at the register?`, total, money, "cents", [
    { text: money(disc), why: "That's only step 1, the discount. What does the customer pay?" },
    { text: money(sale), why: `That's the sale price, before tax. Add ${r}% tax.` },
    opt(W + roundCents((W * r) / 100), money, "You added tax but skipped the discount."),
    opt(W - disc + roundCents((W * r) / 100), money, "Tax goes on the SALE price, not the tag price."),
  ], ["Three steps: discount, sale price, then add tax.", `${P}% of ${money(W)} = ${money(disc)}.`], 3);
  const steps = [
    step(gen, { tag: "Percent of a number (find the part)", label: "Discount", prompt: `Step 1: How much is ${P}% of ${money(W)}? (Round to the nearest cent.)`, value: disc, fmt: money, unit: "cents", rounding: true,
      wrong: [opt(sale, money, "That's what's left after the discount."), opt(P * 100, money, `That's ${P} dollars, not ${P}%.`)], hints: [`${P}% = ${P}/100.`, `${money(W)} × ${P} ÷ 100`] }),
    step(gen, { tag: T, label: "Sale price", prompt: `Step 2: What is the sale price?`, value: sale, fmt: money, unit: "cents",
      wrong: [opt(W + disc, money, "A sale makes the price go DOWN."), opt(disc, money, "That's the discount. What's left?")], hints: ["Take the discount off the tag price.", `${money(W)} − ${money(disc)}`] }),
  ];
  steps.push(lastStep(final, `Last step: add ${r}% tax to ${money(sale)}. What is the total? (Round the tax to the nearest cent.)`, "Total with tax", T, [`Find ${r}% of ${money(sale)}.`, `Tax = ${money(tax)}. Add it to ${money(sale)}.`]));
  return chain(gen, T, setup, final, steps, `The ${item}: ${money(W)} tag, ${P}% off, ${r}% tax = ${money(total)}.`, { W, P, r });
}

// ---------------------------------------------------------------------------------------------
// Mall: tip, total, split
// ---------------------------------------------------------------------------------------------
function tipSplit(rng: Rng, p: Params): ChainQ {
  const gen = "chain:tip-split";
  const place = name(p, "place", "the food court");
  const B = int(rng, 1500, 6000);
  const t = pick(rng, [15, 20, 18]);
  const k = pick(rng, [2, 3, 4]);
  const tip = roundCents((B * t) / 100);
  const total = B + tip;
  const share = roundCents(total / k);
  const T: SkillTag = "Discounts, tax, and tips (two-step)";
  const setup = `The bill at ${place} is ${money(B)}. The group leaves a ${t}% tip and splits the total evenly among ${k} friends.`;
  const final = finalQ(gen, T, `${setup} How much does each friend pay? (Round to the nearest cent.)`, share, money, "cents", [
    { text: money(tip), why: "That's only step 1, the tip. What does each friend pay?" },
    { text: money(total), why: `That's the whole bill with the tip. Split it ${k} ways.` },
    opt(roundCents(B / k), money, "You split the bill but forgot the tip."),
  ], ["Three steps: the tip, the total, then split it.", `${t}% of ${money(B)} = ${money(tip)}.`], 3);
  const steps = [
    step(gen, { tag: "Percent of a number (find the part)", label: "Tip", prompt: `Step 1: What is a ${t}% tip on ${money(B)}? (Round to the nearest cent.)`, value: tip, fmt: money, unit: "cents", rounding: true,
      wrong: [opt(t * 100, money, `That's ${t} dollars, not ${t}%.`), opt(B - tip, money, "That's the bill minus the tip.")], hints: [`10% of ${money(B)} is easy: move the decimal.`, `${t}% of ${money(B)} = ${num((B * t) / 10000, 4)} dollars. Round to the cent.`] }),
    step(gen, { tag: T, label: "Total with tip", prompt: "Step 2: What is the total with the tip?", value: total, fmt: money, unit: "cents",
      wrong: [opt(B - tip, money, "A tip is ADDED on."), opt(tip, money, "That's just the tip.")], hints: ["Add the tip to the bill.", `${money(B)} + ${money(tip)}`] }),
  ];
  steps.push(lastStep(final, `Last step: split ${money(total)} among ${k} friends. How much each? (Round to the nearest cent.)`, "Each friend pays", "Multi-step rate problems", ["Equal shares: divide.", `${money(total)} ÷ ${k} = ${num(total / k / 100, 4)}... Round to the cent.`]));
  return chain(gen, T, setup, final, steps, `Each of ${k} friends owes ${money(share)} (bill ${money(B)} + ${t}% tip).`, { B, t, k });
}

// ---------------------------------------------------------------------------------------------
// Mall: bulk bins → better deal → cost → change
// ---------------------------------------------------------------------------------------------
function dealTotal(rng: Rng, p: Params): ChainQ {
  const gen = "chain:deal-total";
  const who = name(p, "who", "the shopper");
  const item = name(p, "item", "trail mix");
  const qA = pick(rng, [8, 10, 12, 16, 20]);
  let qB = pick(rng, [8, 10, 12, 16, 20]);
  while (qB === qA) qB = pick(rng, [8, 10, 12, 16, 20]);
  const uA = int(rng, 10, 60);
  let uB = uA;
  while (uB === uA) uB = int(rng, 10, 60);
  const pA = qA * uA;
  const pB = qB * uB;
  const m = int(rng, 10, 40);
  const ub = Math.min(uA, uB);
  const uw = Math.max(uA, uB);
  const cost = m * ub;
  const bill = [1000, 2000, 5000, 10000].find((b) => b > cost)!;
  const change = bill - cost;
  const T: SkillTag = "Multi-step rate problems";
  const setup = `Bin A sells ${qA} oz of ${item} for ${money(pA)}. Bin B sells ${qB} oz for ${money(pB)}. ${who} buys ${m} oz from the cheaper bin and pays with a ${money(bill)} bill.`;
  const final = finalQ(gen, T, `${setup} How much change should ${who} get?`, change, money, "cents", [
    { text: money(uA), why: "That's Bin A's price for 1 ounce (step 1). Keep going: the cost, then the change." },
    { text: money(uB), why: "That's Bin B's price for 1 ounce (step 2). Keep going: the cost, then the change." },
    { text: money(cost), why: `That's what the ${item} costs. How much change from ${money(bill)}?` },
    opt(bill - m * uw, money, "You used the more expensive bin."),
  ], ["Find the price of 1 ounce in each bin first.", `Bin A: ${money(pA)} ÷ ${qA} = ${money(uA)} per ounce.`], 4);
  const steps = [
    step(gen, { tag: "Comparing speeds and prices", label: "Bin A per ounce", prompt: `Step 1: What does 1 oz cost in Bin A?`, value: uA, fmt: money, unit: "cents",
      wrong: [opt(pA, money, "That's the price of the whole scoop."), opt(Math.round((qA * 10000) / pA), money, "Flipped: that's ounces per dollar. Divide price by ounces.")], hints: ["Divide price by ounces.", `${money(pA)} ÷ ${qA}`] }),
    step(gen, { tag: "Comparing speeds and prices", label: "Bin B per ounce", prompt: `Step 2: What does 1 oz cost in Bin B?`, value: uB, fmt: money, unit: "cents",
      wrong: [opt(pB, money, "That's the price of the whole scoop."), opt(Math.round((qB * 10000) / pB), money, "Flipped: that's ounces per dollar. Divide price by ounces.")], hints: ["Divide price by ounces.", `${money(pB)} ÷ ${qB}`] }),
    step(gen, { tag: T, label: `Cost of ${m} oz`, prompt: `Step 3: ${money(ub)} per ounce is cheaper. What do ${m} oz cost?`, value: cost, fmt: money, unit: "cents",
      wrong: [opt(m * uw, money, "That uses the more expensive bin."), opt(ub, money, `That's 1 ounce. You need ${m}.`)], hints: ["Price per ounce × ounces.", `${m} × ${money(ub)}`] }),
  ];
  steps.push(lastStep(final, `Last step: ${who} pays ${money(bill)} for ${money(cost)} of ${item}. How much change?`, "Change", T, ["Change = what you pay − what it costs.", `${money(bill)} − ${money(cost)}`]));
  return chain(gen, T, setup, final, steps, `Bulk bins: ${m} oz at ${money(ub)}/oz = ${money(cost)}; change from ${money(bill)} = ${money(change)}.`, { qA, qB, pA, pB, m, bill });
}

// ---------------------------------------------------------------------------------------------
// Tower: groups → climb minutes → minutes until sunset → minutes to spare
// ---------------------------------------------------------------------------------------------
function climbTime(rng: Rng, p: Params): ChainQ {
  const gen = "chain:climb-time";
  const team = name(p, "who", "the team");
  const a = pick(rng, [10, 12, 15, 20, 25]);
  const g = int(rng, 10, 40);
  const b = pick(rng, [2, 3, 4, 5]);
  const N = a * g;
  const climb = g * b;
  const spare = int(rng, 1, 12) * 5;
  const W = climb + spare;
  const start = 12 * 60 + int(rng, 1, 4) * 60 + pick(rng, [0, 15, 30]);
  const sunset = start + W;
  const T: SkillTag = "Multi-step rate problems";
  const mins = unitFmt("minutes");
  const setup = `The tower stairs have ${num(N)} steps. ${team[0].toUpperCase() + team.slice(1)} climbs ${a} steps every ${b} minutes. They start at ${clock(start)}, and sunset is at ${clock(sunset)}.`;
  const base100 = Math.floor(sunset / 60) * 100 + (sunset % 60) - (Math.floor(start / 60) * 100 + (start % 60));
  const final = finalQ(gen, T, `${setup} How many minutes before sunset do they reach the top?`, spare, mins, "minutes", [
    { text: mins(g), why: `That's the number of groups of ${a} steps (step 1), not minutes.` },
    { text: mins(climb), why: "That's how long the climb takes. How much time is LEFT before sunset?" },
    { text: mins(W), why: "That's the time from the start until sunset. Subtract the climb." },
    base100 !== W ? opt(base100 - climb, mins, "Clock time isn't base 100: 1 hour = 60 minutes.") : null,
  ], ["Find how long the climb takes, then how long until sunset.", `${num(N)} ÷ ${a} = ${g} groups of steps.`], 4);
  const steps = [
    step(gen, { tag: "Estimating with rates", label: "Groups of steps", prompt: `Step 1: How many groups of ${a} steps are in ${num(N)} steps?`, value: g, fmt: unitFmt("groups"), unit: "groups",
      wrong: [opt(N * a, unitFmt("groups"), "You multiplied. Divide to find how many groups."), opt(N / b, unitFmt("groups"), `Divide by the ${a} steps in a group, not the ${b} minutes.`)], hints: [`How many ${a}s fit in ${num(N)}?`, `${num(N)} ÷ ${a}`] }),
    step(gen, { tag: "Estimating with rates", label: "Climb time", prompt: `Step 2: Each group takes ${b} minutes. How long is the whole climb?`, value: climb, fmt: mins, unit: "minutes",
      wrong: [opt(g, mins, "That's the number of groups."), opt(N * b, mins, `That gives every STEP ${b} minutes. Only each group of ${a} takes ${b} minutes.`)], hints: ["Groups × minutes per group.", `${g} × ${b}`] }),
    step(gen, { tag: "Converting units", label: "Time until sunset", prompt: `Step 3: How many minutes from ${clock(start)} to ${clock(sunset)}?`, value: W, fmt: mins, unit: "minutes",
      wrong: [base100 !== W ? opt(base100, mins, "Clock time isn't base 100: 1 hour = 60 minutes, not 100.") : null, opt(Math.floor(W / 60), mins, "That's the hours. Change hours to minutes: × 60.")], hints: ["Count whole hours first, then the extra minutes.", `${Math.floor(W / 60)} ${Math.floor(W / 60) === 1 ? "hour is" : "hours are"} ${Math.floor(W / 60)} × 60 minutes${W % 60 ? `, plus ${W % 60} more minutes` : ""}.`] }),
  ];
  steps.push(lastStep(final, `Last step: the climb takes ${climb} minutes and sunset is ${W} minutes away. How many minutes to spare?`, "Minutes to spare", T, ["Time until sunset − climb time.", `${W} − ${climb}`]));
  return chain(gen, T, setup, final, steps, `Climb math: ${num(N)} steps at ${a} per ${b} min = ${climb} min, ${spare} min before sunset.`, { a, b, N, start, sunset });
}

// ---------------------------------------------------------------------------------------------
// Desert race: speed → pace → times → gap
// ---------------------------------------------------------------------------------------------
const PACE: [number, number][] = [[4, 15], [5, 12], [6, 10], [7.5, 8], [8, 7.5], [10, 6], [12, 5], [15, 4]];

function racePace(rng: Rng, p: Params): ChainQ {
  const gen = "chain:race-pace";
  const [A, B] = twoNames(rng, p);
  const [sA, pA] = pick(rng, PACE);
  let pB = pick(rng, PACE)[1];
  while (pB === pA) pB = pick(rng, PACE)[1];
  const d = pick(rng, [2, 4, 6, 3, 5]);
  const tA = pA * d;
  const tB = pB * d;
  if (!terminates(tA, 0) || !terminates(tB, 0)) throw new Retry();
  const gap = Math.abs(tA - tB);
  const T: SkillTag = "Multi-step rate problems";
  const mins = unitFmt("minutes");
  const setup = `${A} runs at ${num(sA)} miles per hour. ${B} runs at a pace of ${num(pB)} minutes per mile. The race across the city is ${d} miles.`;
  const final = finalQ(gen, T, `${setup} How many minutes apart do they finish?`, gap, mins, "minutes", [
    { text: mins(pA), why: `That's ${A}'s pace for ONE mile (step 1). The race is ${d} miles.` },
    { text: mins(tA), why: `That's ${A}'s whole race time. Compare it with ${B}'s.` },
    { text: mins(tB), why: `That's ${B}'s whole race time. Compare it with ${A}'s.` },
    opt(Math.abs(pA - pB), mins, `That's the gap for one mile. The race is ${d} miles.`),
  ], ["Get both runners in minutes per mile first.", `${A}: 60 ÷ ${num(sA)} = ${num(pA)} minutes per mile.`], 4);
  const steps = [
    step(gen, { tag: "Speed vs. pace", label: `${A}'s pace`, prompt: `Step 1: ${A} runs ${num(sA)} mph. What is ${A}'s pace in minutes per mile?`, value: pA, fmt: unitFmt("minutes per mile"), unit: "min/mi",
      wrong: [opt(sA, unitFmt("minutes per mile"), "Speed and pace aren't the same number. 60 minutes ÷ miles."), opt(60 * sA, unitFmt("minutes per mile"), `Divide 60 by ${num(sA)}, don't multiply.`)], hints: ["How long does 1 mile take?", `60 ÷ ${num(sA)}`] }),
    step(gen, { tag: "Multi-step rate problems", label: `${A}'s time`, prompt: `Step 2: How long does ${A} take for ${d} miles?`, value: tA, fmt: mins, unit: "minutes",
      wrong: [opt(pA, mins, `That's 1 mile. The race is ${d}.`), opt(pA / d, mins, "Multiply the pace by the miles.")], hints: ["Minutes per mile × miles.", `${num(pA)} × ${d}`] }),
    step(gen, { tag: "Multi-step rate problems", label: `${B}'s time`, prompt: `Step 3: How long does ${B} take for ${d} miles?`, value: tB, fmt: mins, unit: "minutes",
      wrong: [opt(pB, mins, `That's 1 mile. The race is ${d}.`), opt(60 / pB * d, mins, `${num(pB)} is already a pace (minutes per mile). Just multiply by ${d}.`)], hints: ["Minutes per mile × miles.", `${num(pB)} × ${d}`] }),
  ];
  steps.push(lastStep(final, `Last step: ${A} takes ${num(tA)} minutes and ${B} takes ${num(tB)} minutes. How many minutes apart?`, "Finish gap", "Speed vs. pace", ["Subtract the smaller time from the bigger one.", `${num(Math.max(tA, tB))} − ${num(Math.min(tA, tB))}`]));
  return chain(gen, T, setup, final, steps, `Race: ${tA < tB ? A : B} wins the ${d}-mile race by ${num(gap)} minutes.`, { sA, pB, d, A, B });
}

// ---------------------------------------------------------------------------------------------
// Tower: water for the climb (cups/hour → cups → quarts)
// ---------------------------------------------------------------------------------------------
function waterTrip(rng: Rng, p: Params): ChainQ {
  const gen = "chain:water-trip";
  const k = int(rng, 2, 6);
  const c = int(rng, 1, 3);
  const h = int(rng, 2, 8);
  const cups = k * c * h;
  if (cups % 4) throw new Retry();
  const qt = cups / 4;
  const who = name(p, "who", "climbers");
  const T: SkillTag = "Multi-step rate problems";
  const qf = (x: number) => `${num(x)} ${x === 1 ? "quart" : "quarts"}`;
  const cf = (x: number) => `${num(x)} ${x === 1 ? "cup" : "cups"}`;
  const setup = `There are ${k} ${who}. Each one drinks ${c} ${c === 1 ? "cup" : "cups"} of water every hour. The trip takes ${h} hours. (1 quart = 4 cups)`;
  const final = finalQ(gen, T, `${setup} How many quarts of water should they pack?`, qt, qf, "quarts", [
    { text: qf(k * c), why: "That's the cups the whole team drinks in ONE hour (step 1), and it's cups, not quarts." },
    { text: qf(cups), why: "That's the number of CUPS. Quarts are bigger, so the number gets smaller: ÷ 4." },
    opt(cups * 4, qf, "You multiplied by 4. Quarts are bigger than cups, so divide."),
  ], ["How many cups does the whole team drink in one hour?", `${k} × ${c} = ${k * c} cups per hour.`], 3);
  const steps = [
    step(gen, { tag: "Multi-step rate problems", label: "Cups per hour (team)", prompt: `Step 1: How many cups does the whole team drink in 1 hour?`, value: k * c, fmt: cf, unit: "cups",
      wrong: [opt(c, cf, "That's one climber."), opt(k + c, cf, "Multiply, don't add.")], hints: ["Climbers × cups each.", `${k} × ${c}`] }),
    step(gen, { tag: "Multi-step rate problems", label: "Cups for the trip", prompt: `Step 2: How many cups for the whole ${h}-hour trip?`, value: cups, fmt: cf, unit: "cups",
      wrong: [opt(k * c, cf, "That's one hour."), opt(k * c + h, cf, "Multiply by the hours, don't add.")], hints: ["Cups per hour × hours.", `${k * c} × ${h}`] }),
  ];
  steps.push(lastStep(final, `Last step: change ${cups} cups to quarts (1 quart = 4 cups).`, "Quarts", "Converting units", ["Bigger unit → smaller number.", `${cups} ÷ 4`]));
  return chain(gen, T, setup, final, steps, `Water plan: ${k} ${who} × ${c} cups × ${h} hours = ${cups} cups = ${qt} quarts.`, { k, c, h });
}

// ---------------------------------------------------------------------------------------------
// Robots: Paint the Room
// ---------------------------------------------------------------------------------------------
function wallArea(rng: Rng): ChainQ {
  const gen = "chain:wall-area";
  const r = room(rng);
  const T: SkillTag = "Multi-step project (Painting a Room)";
  const sq = unitFmt("sq ft");
  const setup = roomText(r);
  const final = finalQ(gen, T, `${setup} How many square feet of wall will the crew paint?`, r.paint, sq, "sq ft", [
    { text: sq(r.per), why: "That's the perimeter (step 1). It's in feet, not square feet. Multiply by the height." },
    { text: sq(r.walls), why: `That's all four walls. You don't paint the door${r.windows ? " or windows" : ""}: subtract them.` },
    opt(r.L * r.W, sq, "That's the floor, not the walls."),
  ], ["Walls area = perimeter × height. Then take out the door and windows.", `Perimeter = 2 × (${r.L} + ${r.W}) = ${r.per} ft.`], 3);
  const steps = [
    step(gen, { tag: T, label: "Perimeter", prompt: "Step 1: What is the perimeter of the room (all the way around)?", value: r.per, fmt: unitFmt("ft"), unit: "ft",
      wrong: [opt(r.L + r.W, unitFmt("ft"), "That's only two sides. Go all the way around."), opt(r.L * r.W, unitFmt("ft"), "That's the floor area. Add the sides.")], hints: ["Add all four sides.", `${r.L} + ${r.W} + ${r.L} + ${r.W}`] }),
    step(gen, { tag: T, label: "All four walls", prompt: `Step 2: The walls are ${r.H} ft tall. What is the area of all four walls?`, value: r.walls, fmt: sq, unit: "sq ft",
      wrong: [opt(r.per + r.H, sq, "Multiply perimeter × height."), opt((r.L + r.W) * r.H, sq, "That's only two walls.")], hints: ["Unroll the walls into one long rectangle.", `${r.per} × ${r.H}`] }),
  ];
  steps.push(lastStep(final, `Last step: subtract the door (21 sq ft)${r.windows ? ` and ${r.windows === 1 ? "the window (12 sq ft)" : "two windows (12 sq ft each)"}` : ""} from ${r.walls} sq ft.`, "Wall to paint", T, ["Door = 3 × 7. Window = 3 × 4.", `${r.walls} − ${r.open}`]));
  return chain(gen, T, setup, final, steps, `Wall area: ${r.per} ft × ${r.H} ft − ${r.open} = ${r.paint} sq ft to paint.`, { L: r.L, W: r.W, H: r.H, windows: r.windows });
}

function paintGallonsChain(rng: Rng): ChainQ {
  const gen = "chain:paint-gallons";
  const A = int(rng, 20, 60) * 10 + pick(rng, [0, 5]);
  const coats = pick(rng, [2, 2, 3]);
  const c = pick(rng, [250, 400, 200, 500]);
  const total = A * coats;
  const need = total / c;
  if (Number.isInteger(need) || !terminates(need, 2)) throw new Retry();
  const gal = Math.ceil(need);
  const T: SkillTag = "Multi-step project (Painting a Room)";
  const gf = (x: number) => `${num(x)} ${x === 1 ? "gallon" : "gallons"}`;
  const setup = `The crew must cover ${num(A)} sq ft of wall with ${coats} coats. One gallon of paint covers ${c} sq ft. Stores only sell whole gallons.`;
  const final = finalQ(gen, T, `${setup} How many gallons should the crew buy?`, gal, gf, "gallons", [
    { text: gf(total), why: `${num(total)} is the square feet to cover (step 1), not gallons. Divide by ${c}.` },
    { text: gf(need), why: "That's the exact amount (step 2). Stores sell whole gallons: round UP." },
    Math.floor(need) >= 1 ? opt(Math.floor(need), gf, "You rounded down, so the crew would run out. Round UP.") : null,
    opt(Math.ceil(A / c), gf, `That's one coat. The crew needs ${coats}.`),
  ], ["First find the total area for all the coats.", `${num(A)} × ${coats} = ${num(total)} sq ft.`], 3);
  const steps = [
    step(gen, { tag: T, label: "Area for all coats", prompt: `Step 1: How many square feet for ${coats} coats?`, value: total, fmt: unitFmt("sq ft"), unit: "sq ft",
      wrong: [opt(A, unitFmt("sq ft"), "That's one coat."), opt(A + coats, unitFmt("sq ft"), "Multiply by the coats, don't add.")], hints: ["Every coat covers the walls again.", `${num(A)} × ${coats}`] }),
    step(gen, { tag: T, label: "Exact gallons", prompt: `Step 2: One gallon covers ${c} sq ft. Exactly how many gallons is ${num(total)} sq ft?`, value: need, fmt: gf, unit: "gallons",
      wrong: [opt(c / total, gf, `Flipped: divide the area by ${c}, not ${c} by the area.`), opt(total * c, gf, `Divide by ${c}, don't multiply.`)], hints: ["Square feet ÷ square feet per gallon.", `${num(total)} ÷ ${c}`] }),
  ];
  steps.push(lastStep(final, `Last step: you need ${num(need)} gallons. How many whole gallons do you buy?`, "Gallons to buy", T, ["Can you buy part of a gallon? Will you have enough if you round down?", `Round ${num(need)} UP to the next whole number.`]));
  return chain(gen, T, setup, final, steps, `Paint order: ${num(total)} sq ft ÷ ${c} = ${num(need)} → buy ${gal} gallons.`, { A, coats, c });
}

function paintBuy(rng: Rng): ChainQ {
  const gen = "chain:paint-buy";
  const sh = paintShop(rng);
  const r = pick(rng, [6, 7, 8]);
  const pre = sh.best.cost;
  const total = pre + roundCents((pre * r) / 100);
  const trapTotal = sh.trap.cost + roundCents((sh.trap.cost * r) / 100);
  const T: SkillTag = "Multi-step project (Painting a Room)";
  const setup = `The crew needs ${sh.G} gallons. A 1-gallon can costs ${money(sh.a)}. A ${sh.S}-gallon bucket costs ${money(sh.b)}. Sales tax is ${r}%.`;
  const final = finalQ(gen, T, `${setup} What does the cheapest order that holds ENOUGH paint cost with tax?`, total, money, "cents", [
    { text: money(sh.perB), why: "That's the bucket's price per gallon (step 1). Keep going: pick the order, then add tax." },
    { text: money(pre), why: `That's the cheapest order before tax. Add ${r}% tax.` },
    sh.trap.gal < sh.G ? { text: money(trapTotal), why: `That's buckets only, ${sh.trap.gal} gallons: cheap, but NOT enough paint. You need ${sh.G}.` } : null,
    opt(sh.G * sh.a + roundCents((sh.G * sh.a * r) / 100), money, "That's all cans. Buckets are cheaper per gallon."),
  ], ["Find the bucket's price per gallon. Then find the cheapest order with at least enough paint.", `${money(sh.b)} ÷ ${sh.S} = ${money(sh.perB)} per gallon.`], 3);
  const steps = [
    step(gen, { tag: "Comparing speeds and prices", label: "Bucket price per gallon", prompt: `Step 1: What does 1 gallon cost in the ${sh.S}-gallon bucket?`, value: sh.perB, fmt: money, unit: "cents",
      wrong: [opt(sh.b, money, "That's the whole bucket."), opt(sh.a, money, "That's the 1-gallon can.")], hints: ["Price ÷ gallons.", `${money(sh.b)} ÷ ${sh.S}`] }),
    paintCostQ(sh, `Step 2: You need ${sh.G} gallons. Which order is cheapest AND holds enough?`),
  ];
  steps.push(lastStep(final, `Last step: the order costs ${money(pre)}. Add ${r}% sales tax. (Round the tax to the nearest cent.)`, "Total with tax", "Discounts, tax, and tips (two-step)", [`Find ${r}% of ${money(pre)}, then add it.`, `Tax = ${money(roundCents((pre * r) / 100))}. Add it on.`]));
  return chain(gen, T, setup, final, steps, `Paint buy: ${comboText(sh.best, sh.S)} = ${money(pre)}, ${money(total)} with tax.`, { S: sh.S, G: sh.G, a: sh.a, b: sh.b, r });
}

// ---------------------------------------------------------------------------------------------
// Robots bonus: copy machine area
// ---------------------------------------------------------------------------------------------
function copyArea(rng: Rng, p: Params): ChainQ {
  const gen = "chain:copy-area";
  const thing = name(p, "thing", "blueprint");
  const a = int(rng, 2, 12);
  const b = int(rng, 2, 12);
  const P = pick(rng, [150, 200, 300, 50]);
  const f2n = P * P;
  const A = a * b;
  const newA = (A * f2n) / 10000;
  if (!terminates(newA, 2) || a === b) throw new Retry();
  const T: SkillTag = "Bridge: scale factors";
  const sq = unitFmt("sq cm");
  const f2 = f2n / 10000;
  const setup = `The ${thing} is ${a} cm by ${b} cm. The copy machine is set to ${P}%.`;
  const final = finalQ(gen, T, `${setup} What is the area of the copy?`, newA, sq, "sq cm", [
    { text: sq(A), why: "That's the original area (step 1). Now scale it." },
    { text: sq(f2), why: `That's the area scale factor (${num(P / 100)} × ${num(P / 100)}), not an area. Multiply it by ${A}.` },
    opt((A * P) / 100, sq, `Area grows by the factor TWICE: × ${num(P / 100)} × ${num(P / 100)}.`),
  ], ["Find the original area first.", `${a} × ${b} = ${A} sq cm.`], 3);
  const steps = [
    step(gen, { tag: "Multi-step rate problems", label: "Original area", prompt: "Step 1: What is the area of the original?", value: A, fmt: sq, unit: "sq cm",
      wrong: [opt(2 * (a + b), sq, "That's the perimeter."), opt(a + b, sq, "Multiply length × width.")], hints: ["Area = length × width.", `${a} × ${b}`] }),
    step(gen, { tag: T, label: "Area factor", prompt: `Step 2: Lengths grow × ${num(P / 100)}. Area grows by ${num(P / 100)} × ${num(P / 100)}. What is that?`, value: f2, fmt: (x) => `× ${num(x)}`, unit: "factor",
      wrong: [opt(P / 100, (x) => `× ${num(x)}`, "That's the length factor. Area uses it twice."), opt((2 * P) / 100, (x) => `× ${num(x)}`, "Multiply the factor by itself, don't double it.")], hints: ["A factor times itself.", `${num(P / 100)} × ${num(P / 100)}`] }),
  ];
  steps.push(lastStep(final, `Last step: the original is ${A} sq cm and the area factor is × ${num(f2)}. What is the copy's area?`, "Copy area", T, ["Original area × area factor.", `${A} × ${num(f2)}`]));
  return chain(gen, T, setup, final, steps, `Copy machine: ${P}% makes the area × ${num(f2)}: ${A} → ${num(newA)} sq cm.`, { a, b, P });
}

// ---------------------------------------------------------------------------------------------

export interface ChainDef {
  id: string;
  tag: SkillTag;
  params: readonly string[];
  make: (rng: Rng, p: Params) => ChainQ;
}

const c = (id: string, tag: SkillTag, params: readonly string[], make: ChainDef["make"]): ChainDef => ({ id, tag, params, make });

export const CHAINS: Record<string, ChainDef> = Object.fromEntries(
  [
    c("receipt", "Discounts, tax, and tips (two-step)", ["who", "item"], receipt),
    c("sale-tax", "Discounts, tax, and tips (two-step)", ["item"], saleTax),
    c("tip-split", "Discounts, tax, and tips (two-step)", ["place"], tipSplit),
    c("deal-total", "Multi-step rate problems", ["who", "item"], dealTotal),
    c("climb-time", "Multi-step rate problems", ["who"], climbTime),
    c("race-pace", "Multi-step rate problems", ["a", "b"], racePace),
    c("water-trip", "Multi-step rate problems", ["who"], waterTrip),
    c("wall-area", "Multi-step project (Painting a Room)", [], wallArea),
    c("paint-gallons", "Multi-step project (Painting a Room)", [], paintGallonsChain),
    c("paint-buy", "Multi-step project (Painting a Room)", [], paintBuy),
    c("copy-area", "Bridge: scale factors", ["thing"], copyArea),
  ].map((d) => [d.id, d]),
);

export function generateChain(id: string, params: Params, rng: Rng): ChainQ {
  const def = CHAINS[id];
  if (!def) throw new Error(`Unknown chain "${id}"`);
  for (let i = 0; i < 200; i++) {
    try {
      return def.make(rng, params);
    } catch (e) {
      if (!(e instanceof Retry)) throw e;
    }
  }
  throw new Error(`Chain "${id}" could not make a problem`);
}
