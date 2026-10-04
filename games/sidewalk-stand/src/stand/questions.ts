/*
 * Sidewalk Stand's own money questions, built from the real numbers of the player's day:
 *   - pay:     at the counter during the rush (make change, count coins, coupons, tax, …)
 *   - plan:    in the morning, about the supplies just bought (grades 3+)
 *   - reflect: in the evening, about the ledger and economics
 * Every question carries its numbers in `calc`; scripts/check-stand.ts recomputes every answer
 * with its own solver (integer cents only). Answers are authored first (answer: 0); the game
 * shuffles the choices with the kit's deal().
 */
import type { Grade, Question } from "@/kit/types";
import { GRADES } from "@/kit/grades";
import { ITEM_NAME, ITEM_PLURAL, gnum, type ItemId, type Scale } from "./config";
import {
  COINS,
  PIECE_NAME,
  PIECE_VALUE,
  billFor,
  countUpText,
  exactPieces,
  money,
  pickR,
  ri,
  sayMoney,
  styleFor,
  type MoneyStyle,
  type PieceId,
  type Rand,
} from "./money";

export interface Line {
  item: ItemId;
  qty: number;
  price: number;
}
export interface Buy {
  name: string;
  /** e.g. "jugs of juice" */
  unit: string;
  packs: number;
  cost: number;
}

export type Calc =
  | { t: "coinId"; coin: PieceId }
  | { t: "coinValue"; coin: PieceId }
  | { t: "count"; pieces: PieceId[] }
  | { t: "symbol"; cents: number }
  | { t: "change"; prices: number[]; paid: number }
  | { t: "total"; prices: number[] }
  | { t: "times"; qty: number; price: number }
  | { t: "pctOff"; base: number; pct: number }
  | { t: "plusPct"; base: number; pct: number }
  | { t: "pctAmt"; base: number; pct: number }
  | { t: "discTax"; base: number; off: number; tax: number }
  | { t: "solveN"; price: number; extra: number; paid: number; change: number }
  | { t: "system"; a: number; b: number; c: number; d: number; t1: number; t2: number; ask: "x" | "y" }
  | { t: "left"; cash: number; prices: number[] }
  | { t: "unit"; cost: number; per: number }
  | { t: "best"; aQty: number; aCost: number; bQty: number; bCost: number; labels: [string, string] }
  | { t: "packs"; per: number; need: number }
  | { t: "interest"; principal: number; rate: number; periods: number }
  | { t: "apr"; principal: number; apr: number }
  | { t: "markup"; cost: number; pct: number }
  | { t: "pctChange"; from: number; to: number }
  | { t: "pctOf"; part: number; whole: number }
  | { t: "slope2"; x1: number; y1: number; x2: number; y2: number }
  | { t: "margin"; price: number; cost: number }
  | { t: "breakEven"; margin: number; fixed: number }
  | { t: "system2"; price: number; cost: number; fixed: number }
  | { t: "evalLin"; m: number; b: number; x: number }
  | { t: "vertexP"; a: number; b: number }
  | { t: "maxRev"; a: number; b: number }
  | { t: "net"; gross: number; bp: number }
  | { t: "wage"; rate: number; hours: number }
  | { t: "ratio"; a: number; b: number }
  | { t: "profit"; revenue: number; cost: number }
  | { t: "concept"; set: ConceptSet; answerIn: "a" | "b" };

/** How the answer is written (tests use it to compare choices by value). */
export type AnswerFmt = "money" | "count" | "pct" | "label" | "ratio" | "pctChange";

export interface SSQuestion extends Question {
  calc: Calc;
  fmt: AnswerFmt;
  style: MoneyStyle;
  /** Coins and bills to draw next to the question. */
  pieces?: PieceId[];
  /** What read-aloud says instead of the printed prompt (for picture questions). */
  say?: string;
  /** Money the stand keeps from this customer (pay questions). */
  revenue?: number;
  kind: "pay" | "plan" | "reflect";
}

// ------------------------------------------------------------- concept lists (economics)

export type ConceptSet = "needsWants" | "goodsServices" | "producerConsumer" | "capitalOther" | "demand" | "budget" | "market" | "oppCost";
/** Two lists per concept: [the "a" list, the "b" list]. No entry is in both (tests check). */
export const CONCEPTS: Record<ConceptSet, [string[], string[]]> = {
  // a = things the cart needs to sell juice; b = wants (nice, not needed)
  needsWants: [
    ["Cups", "Juice", "Ice", "A cart"],
    ["Stickers", "A balloon", "A toy robot", "Glitter", "A party hat"],
  ],
  // a = goods (things you can hold); b = services (work someone does for you)
  goodsServices: [
    ["Juice", "A snack", "A fruit cup", "A paper cup", "An apple"],
    ["A haircut", "Mail delivery", "Dog walking", "A checkup", "Teaching"],
  ],
  producerConsumer: [["You, the seller"], ["The customer", "The jogger", "The robot"]],
  capitalOther: [["Capital"], ["Land", "Labor", "Money only"]],
  demand: [["Law of demand"], ["Law of supply", "Inflation", "A monopoly"]],
  budget: [["A spending plan"], ["A bank loan", "A tax", "A price tag"]],
  market: [["You, the seller"], ["The government", "The weather", "A coin flip"]],
  oppCost: [["The cooler"], ["The sign", "Nothing", "Your cart"]],
};

// ------------------------------------------------------------- builder

let counter = 0;

interface Draft {
  level: Grade;
  standard: string;
  skill: string;
  subject?: "math" | "social";
  prompt: string;
  answer: string;
  wrong: string[];
  explanation: string;
  calc: Calc;
  fmt: AnswerFmt;
  style: MoneyStyle;
  pieces?: PieceId[];
  say?: string;
  revenue?: number;
  kind: SSQuestion["kind"];
}

function build(d: Draft): SSQuestion {
  const choices = [d.answer];
  for (const w of d.wrong) if (choices.length < 4 && w && !choices.includes(w)) choices.push(w);
  if (choices.length < 4) throw new Error(`not enough choices for ${d.prompt}: ${choices.join(" | ")}`);
  const q: SSQuestion = {
    id: `ss-${d.kind}-${d.calc.t}-g${d.level.toLowerCase()}-${++counter}`,
    subject: d.subject ?? "math",
    grade: d.level,
    standard: d.standard,
    skill: d.skill,
    prompt: d.prompt,
    choices: choices as SSQuestion["choices"],
    answer: 0,
    explanation: d.explanation,
    calc: d.calc,
    fmt: d.fmt,
    style: d.style,
    kind: d.kind,
  };
  if (d.pieces) q.pieces = d.pieces;
  if (d.say) q.say = d.say;
  if (d.revenue !== undefined) q.revenue = d.revenue;
  if (q.prompt.length <= 100 && q.choices.every((c) => c.length <= 14)) q.quick = true;
  return q;
}

/** Wrong money amounts: typical slips first, then nearby amounts; all positive whole cents. */
function wrongMoney(v: number, typical: number[], step: number, style: MoneyStyle): string[] {
  const out: number[] = [];
  const ok = (x: number) => Number.isInteger(x) && x > 0 && x !== v && !out.includes(x);
  for (const x of typical) if (out.length < 3 && ok(x)) out.push(x);
  for (let k = 1; out.length < 3 && k < 40; k++) for (const x of [v + k * step, v - k * step]) if (out.length < 3 && ok(x)) out.push(x);
  return out.map((x) => money(x, style));
}
function wrongInts(v: number, typical: number[], fmt: (x: number) => string, min = 1): string[] {
  const out: number[] = [];
  const ok = (x: number) => Number.isInteger(x) && x >= min && x !== v && !out.includes(x);
  for (const x of typical) if (out.length < 3 && ok(x)) out.push(x);
  for (let k = 1; out.length < 3 && k < 40; k++) for (const x of [v + k, v - k]) if (out.length < 3 && ok(x)) out.push(x);
  return out.map(fmt);
}
const pctS = (p: number) => `${p}%`;
const sum = (a: number[]) => a.reduce((x, y) => x + y, 0);
const lineText = (l: Line, style: MoneyStyle) =>
  `${l.qty} ${l.qty === 1 ? ITEM_NAME[l.item] : ITEM_PLURAL[l.item]}${l.qty > 1 ? ` at ${money(l.price, style)}` : ` ${money(l.price, style)}`}`;
const pricesOf = (lines: Line[]) => lines.flatMap((l) => Array.from({ length: l.qty }, () => l.price));

const COIN_LOOK: Record<string, string> = {
  penny: "A penny is the copper-colored coin. It is worth 1¢.",
  nickel: "A nickel is a big, smooth silver coin. It is worth 5¢.",
  dime: "A dime is the smallest silver coin, with ridges on its edge. It is worth 10¢.",
  quarter: "A quarter is the biggest of these silver coins, with ridges on its edge. It is worth 25¢.",
};

function countText(pieces: PieceId[], style: MoneyStyle): string {
  let run = 0;
  const steps = pieces.map((p) => {
    run += PIECE_VALUE[p];
    return money(run, style);
  });
  return `Start with the biggest and count on: ${steps.join(", ")}. That is ${money(run, style)}.`;
}

// ------------------------------------------------------------- PAY (the rush)

export interface PayCtx {
  who: string;
  lines: Line[];
  scale: Scale;
  juicePrice: number;
}

/** A pay question at math level `level` for this customer's order. */
export function payQuestion(level: Grade, ctx: PayCtx, r: Rand): SSQuestion {
  const L = gnum(level);
  const style = styleFor(level);
  const total = sum(pricesOf(ctx.lines));
  const who = ctx.who;
  const base = { level, style, kind: "pay" as const, revenue: total };

  if (L === 0) {
    if (total <= 10 && r() < 0.5) {
      const pieces = Array.from({ length: total }, () => "penny" as PieceId);
      return build({
        ...base,
        standard: "NC.K.CC.5",
        skill: "Count pennies",
        prompt: `${who} pays with pennies. How many cents?`,
        say: `${who} pays with pennies. Count them. How many cents?`,
        answer: money(total, style),
        wrong: wrongInts(total, [total + 1, total - 1, total + 2], (x) => money(x, style)),
        explanation: `Touch each penny as you count: ${Array.from({ length: total }, (_, i) => i + 1).join(", ")}. That is ${total}¢.`,
        calc: { t: "count", pieces },
        fmt: "money",
        pieces,
      });
    }
    const coin: PieceId = (COINS.find((c) => PIECE_VALUE[c] === total) ?? pickR(r, COINS)) as PieceId;
    return build({
      ...base,
      subject: "social",
      standard: "K.E.1",
      skill: "Know your coins",
      prompt: PIECE_VALUE[coin] === total ? `${who} pays with this coin. Which coin is it?` : `${who} starts paying with this coin. Which coin is it?`,
      answer: PIECE_NAME[coin],
      wrong: COINS.filter((c) => c !== coin).map((c) => PIECE_NAME[c]),
      explanation: COIN_LOOK[coin],
      calc: { t: "coinId", coin },
      fmt: "label",
      pieces: [coin],
    });
  }

  if (L === 1) {
    if (total <= 50 && r() < 0.65) {
      const pieces = exactPieces(total, r, 0, 6);
      return build({
        ...base,
        standard: "NC.1.MD.5",
        skill: "Count coins to 50¢",
        prompt: `${who} pays with these coins. How much is it?`,
        say: `${who} pays with these coins. Count them. How much money is it?`,
        answer: money(total, style),
        wrong: wrongMoney(total, [pieces.length, total + 5, total - 5, total + 10], 5, style),
        explanation: countText(pieces, style),
        calc: { t: "count", pieces },
        fmt: "money",
        pieces,
      });
    }
    const coin = pickR(r, COINS);
    return build({
      ...base,
      standard: "NC.1.MD.5",
      skill: "Coin values",
      prompt: PIECE_VALUE[coin] === total ? `${who} pays with this coin. How much is it worth?` : `${who} starts paying with this coin. What is it worth?`,
      answer: money(PIECE_VALUE[coin], style),
      wrong: COINS.filter((c) => c !== coin).map((c) => money(PIECE_VALUE[c], style)),
      explanation: COIN_LOOK[coin],
      calc: { t: "coinValue", coin },
      fmt: "money",
      pieces: [coin],
    });
  }

  if (L === 2) {
    const roll = r();
    if (roll < 0.4 && total <= 195) {
      const pieces = exactPieces(total, r, 100, 7);
      return build({
        ...base,
        standard: "NC.2.MD.8",
        skill: "Count bills and coins",
        prompt: `${who} pays with this money. How much is it?`,
        say: `${who} pays with this money. Count the bills and coins. How much is it?`,
        answer: money(total, style),
        wrong: wrongMoney(total, [total + 10, total - 10, total + 25, total - 25, total + 100], 5, style),
        explanation: countText(pieces, style),
        calc: { t: "count", pieces },
        fmt: "money",
        pieces,
      });
    }
    if (roll < 0.8 && total < 200) {
      const paid = total < 100 ? 100 : 200;
      const ch = paid - total;
      return build({
        ...base,
        standard: "NC.2.MD.8",
        skill: "Change from a dollar",
        prompt: `${who} buys ${ctx.lines.map((l) => lineText(l, style)).join(" + ")} = ${money(total, style)}. Pays ${money(paid, style)}. Change?`,
        answer: money(ch, style),
        wrong: wrongMoney(ch, [ch + 10, ch - 10, total, ch + 5, ch - 5], 5, style),
        explanation: `${countUpText(total, paid, style)} The change is ${money(ch, style)}.`,
        calc: { t: "change", prices: pricesOf(ctx.lines), paid },
        fmt: "money",
        pieces: paid === 100 ? ["bill1"] : ["bill1", "bill1"],
      });
    }
    // $ and ¢ symbols
    const c = total;
    const ans = money(c, style);
    const wrong =
      c < 100
        ? [`$${c}`, `$${Math.floor(c / 10)}.${c % 10}0`, `${(c % 10) * 10 + Math.floor(c / 10) === c ? c + 10 : (c % 10) * 10 + Math.floor(c / 10)}¢`, `${c + 10}¢`]
        : [`$${c}`, money(c * 10, "dollars"), `${c % 100}¢`, money(c + 100, "dollars")];
    return build({
      ...base,
      standard: "NC.2.MD.8",
      skill: "Use $ and ¢",
      prompt: `${who}'s order costs ${sayMoney(c)}. Which shows that amount?`,
      answer: ans,
      wrong,
      explanation:
        c < 100
          ? `Less than a dollar is written with the cents sign: ${ans}. You could also write it $0.${c < 10 ? "0" : ""}${c}.`
          : `A dollar sign goes in front and a dot separates dollars from cents: ${ans}.`,
      calc: { t: "symbol", cents: c },
      fmt: "money",
    });
  }

  if (L === 3) {
    const big = ctx.lines.find((l) => l.qty >= 2 && (l.price % 100 === 0 || l.qty * l.price <= 100));
    if (big && r() < 0.35) {
      const v = big.qty * big.price;
      return build({
        ...base,
        standard: "NC.3.OA.3",
        skill: "Price × quantity",
        prompt: `${who} wants ${big.qty} ${ITEM_PLURAL[big.item]} at ${money(big.price, style)} each. What do they cost?`,
        answer: money(v, style),
        wrong: wrongMoney(v, [v + big.price, v - big.price, big.qty + big.price, big.price * (big.qty + 2)], big.price, style),
        explanation: `${big.qty} groups of ${money(big.price, style)}: ${big.qty} × ${money(big.price, style)} = ${money(v, style)}.`,
        calc: { t: "times", qty: big.qty, price: big.price },
        fmt: "money",
      });
    }
    if (total < 1000) {
      const paid = billFor(total, r, 1000);
      const ch = paid - total;
      return build({
        ...base,
        standard: "NC.3.NBT.2",
        skill: "Make change by counting up",
        prompt: `${who}'s order is ${money(total, style)}. Pays ${money(paid, style)}. Change?`,
        answer: money(ch, style),
        wrong: wrongMoney(ch, [ch + 100, ch - 100, ch + 25, ch - 25, ch + 10], 5, style),
        explanation: `${countUpText(total, paid, style)} The change is ${money(ch, style)}.`,
        calc: { t: "change", prices: [total], paid },
        fmt: "money",
        pieces: paid === 1000 ? ["bill10"] : paid === 500 ? ["bill5"] : paid === 200 ? ["bill1", "bill1"] : ["bill1"],
      });
    }
    const prices = pricesOf(ctx.lines);
    return build({
      ...base,
      standard: "NC.3.NBT.2",
      skill: "Add money amounts",
      prompt: `${who}: ${ctx.lines.map((l) => lineText(l, style)).join(" + ")}. Total?`,
      answer: money(total, style),
      wrong: wrongMoney(total, [total + 100, total - 100, total + 25], 25, style),
      explanation: `Add the prices: ${prices.map((p) => money(p, style)).join(" + ")} = ${money(total, style)}.`,
      calc: { t: "total", prices },
      fmt: "money",
    });
  }

  if (L === 4 || L === 5) {
    const paid = billFor(total, r, 2000);
    const ch = paid - total;
    const many = ctx.lines.some((l) => l.qty > 1);
    const fifth = L === 5;
    const prompt = `${who}: ${ctx.lines.map((l) => lineText(l, style)).join(" + ")}. Pays ${money(paid, style)}. Change?`;
    const steps = ctx.lines.map((l) => (l.qty > 1 ? `${l.qty} × ${money(l.price, style)} = ${money(l.qty * l.price, style)}` : money(l.price, style)));
    return build({
      ...base,
      standard: fifth ? "NC.5.NBT.7" : "NC.4.MD.2",
      skill: fifth ? "Decimal money operations" : "Multi-step money problems",
      prompt,
      answer: money(ch, style),
      wrong: wrongMoney(ch, [paid - (total - (many ? ctx.lines[0].price : 0)), ch + 100, ch - 100, ch + 50, ch - 25, paid - ctx.lines[0].price], 25, style),
      explanation: `Step 1, the total: ${steps.join(" + ")} → ${money(total, style)}. Step 2, the change: ${money(paid, style)} − ${money(total, style)} = ${money(ch, style)}.`,
      calc: { t: "change", prices: pricesOf(ctx.lines), paid },
      fmt: "money",
      pieces: paid === 2000 ? ["bill20"] : paid === 1000 ? ["bill10"] : paid === 500 ? ["bill5"] : undefined,
    });
  }

  if (L === 6) {
    const pcts = [10, 20, 25, 50].filter((p) => (total * p) % 100 === 0);
    const pct = pcts.length ? pickR(r, pcts) : 0;
    if (pct) {
      const off = (total * pct) / 100;
      const pay = total - off;
      return build({
        ...base,
        revenue: pay,
        standard: "NC.6.RP.3",
        skill: "Percent off a price",
        prompt: `${who} has a ${pct}%-off coupon. The order is ${money(total, style)}. What do they pay?`,
        answer: money(pay, style),
        wrong: wrongMoney(pay, [off, total - pct, total + off, pay - off, pay + 25], 25, style),
        explanation: `${pct}% of ${money(total, style)} = ${money(off, style)} off. ${money(total, style)} − ${money(off, style)} = ${money(pay, style)}.`,
        calc: { t: "pctOff", base: total, pct },
        fmt: "money",
      });
    }
  }

  if (L === 6 || L === 7 || (L >= 10 && r() < 0.34)) {
    const roll = r();
    const taxes = [4, 8].filter((p) => (total * p) % 100 === 0);
    if (roll < 0.4 && taxes.length) {
      const pct = pickR(r, taxes);
      const tax = (total * pct) / 100;
      const v = total + tax;
      return build({
        ...base,
        level: "7",
        style: styleFor("7"),
        standard: "NC.7.RP.3",
        skill: "Sales tax",
        prompt: `${who}'s order is ${money(total, style)} plus ${pct}% game tax. What is the total?`,
        answer: money(v, style),
        wrong: wrongMoney(v, [total + pct, total + pct * 10, total + tax * 2, tax], 10, style),
        explanation: `Tax: ${pct}% of ${money(total, style)} = ${money(tax, style)}. Total: ${money(total, style)} + ${money(tax, style)} = ${money(v, style)}. (The tax goes to the town, not your cash box.)`,
        calc: { t: "plusPct", base: total, pct },
        fmt: "money",
      });
    }
    // Discount then tax (multi-step)
    if (roll >= 0.7) for (const off of [20, 10, 25, 50]) {
      const d = total - (total * off) / 100;
      if ((total * off) % 100 !== 0) continue;
      for (const tax of [4, 8, 5, 10]) {
        if ((d * tax) % 100 !== 0) continue;
        const v = d + (d * tax) / 100;
        const wrongOrder = total + (total * tax) / 100;
        return build({
          ...base,
          level: "7",
          style: styleFor("7"),
          revenue: d,
          standard: "NC.7.EE.3",
          skill: "Multi-step percent problems",
          prompt: `${who}: ${money(total, style)} order, ${off}% off, then ${tax}% game tax. Total?`,
          answer: money(v, style),
          wrong: wrongMoney(v, [d, wrongOrder, total - (total * (off - tax)) / 100, v + 25], 10, style),
          explanation: `Discount first: ${money(total, style)} − ${off}% = ${money(d, style)}. Then tax: ${tax}% of ${money(d, style)} = ${money((d * tax) / 100, style)}. Total ${money(v, style)}.`,
          calc: { t: "discTax", base: total, off, tax },
          fmt: "money",
        });
      }
    }
    {
      // Tips (20% always works: every price is a multiple of 5¢).
      const tips = [10, 15, 20].filter((p) => (total * p) % 100 === 0);
      const pct = pickR(r, tips);
      const tip = (total * pct) / 100;
      return build({
        ...base,
        level: "7",
        style: styleFor("7"),
        revenue: total + tip,
        standard: "NC.7.RP.3",
        skill: "Tips",
        prompt: `${who} loves the service and adds a ${pct}% tip to ${money(total, style)}. How big is the tip?`,
        answer: money(tip, style),
        wrong: wrongMoney(tip, [pct, total + tip, pct * 10, tip * 2, Math.round(tip / 2)], 5, style),
        explanation: `${pct}% = ${pct}/100. ${pct}/100 × ${money(total, style)} = ${money(tip, style)}.`,
        calc: { t: "pctAmt", base: total, pct },
        fmt: "money",
      });
    }
  }

  if (L === 8 || (L >= 10 && r() < 0.5)) {
    // Reverse change: solve for how many of the biggest line were bought.
    const main = [...ctx.lines].sort((a, b) => b.qty - a.qty)[0];
    const extra = total - main.qty * main.price;
    const paid = billFor(total, r, 2000);
    const change = paid - total;
    const n = main.qty;
    const s8 = styleFor("8");
    return build({
      ...base,
      level: "8",
      style: s8,
      standard: "NC.8.EE.7",
      skill: "Solve linear equations",
      prompt: `${who} paid ${money(paid, s8)}, got ${money(change, s8)} back: n ${ITEM_PLURAL[main.item]} at ${money(main.price, s8)}${extra ? ` + ${money(extra, s8)} more` : ""}. n = ?`,
      answer: String(n),
      wrong: wrongInts(n, [n + 1, n - 1, n + 2, n + 3], String),
      explanation: `${money(main.price, s8)}n${extra ? ` + ${money(extra, s8)}` : ""} = ${money(paid, s8)} − ${money(change, s8)} = ${money(total, s8)}${extra ? `, so ${money(main.price, s8)}n = ${money(total - extra, s8)}` : ""}. n = ${n}.`,
      calc: { t: "solveN", price: main.price, extra, paid, change },
      fmt: "count",
    });
  }

  // L === 9 (and some 10–12): a system of two orders with the real menu prices.
  const x = ctx.juicePrice;
  const y = ctx.scale.snackPrice;
  const [a, b, c, d] = pickR(r, [
    [2, 1, 1, 2],
    [3, 1, 1, 1],
    [1, 2, 2, 1],
    [2, 3, 1, 1],
    [1, 1, 2, 1],
  ] as const);
  const t1 = a * x + b * y;
  const t2 = c * x + d * y;
  const askY = r() < 0.5;
  const v = askY ? y : x;
  const s9 = styleFor("9");
  const name = (k: number, it: string) => `${k} ${it}${k > 1 ? "s" : ""}`;
  return build({
    ...base,
    level: "9",
    style: s9,
    standard: "NC.M1.A-REI.6",
    skill: "Systems of linear equations",
    prompt: `${who}: ${name(a, "juice")} + ${name(b, "snack")} = ${money(t1, s9)}; ${name(c, "juice")} + ${name(d, "snack")} = ${money(t2, s9)}. 1 ${askY ? "snack" : "juice"}?`,
    answer: money(v, s9),
    wrong: wrongMoney(v, [askY ? x : y, v + 25, v - 25, Math.abs(t1 - t2)], 25, s9),
    explanation: `Let j = juice, s = snack: ${a}j + ${b}s = ${money(t1, s9)} and ${c}j + ${d}s = ${money(t2, s9)}. Solving (elimination) gives j = ${money(x, s9)}, s = ${money(y, s9)}.`,
    calc: { t: "system", a, b, c, d, t1, t2, ask: askY ? "y" : "x" },
    fmt: "money",
  });
}

// ------------------------------------------------------------- PLAN (morning, grades 3+)

export interface PlanCtx {
  scale: Scale;
  cash: number;
  buys: Buy[];
  juicePrice: number;
  /** Supply cost of one juice (cup + juice + ice), whole cents for grades 3+. */
  servingCost: number;
}

export function planQuestion(level: Grade, ctx: PlanCtx, r: Rand): SSQuestion {
  const L = Math.max(3, gnum(level));
  const lv = GRADES[L];
  const style = styleFor(lv);
  const base = { level: lv, style, kind: "plan" as const };
  const s = ctx.scale;
  const buys = ctx.buys.filter((b) => b.packs > 0);
  const jugs: Buy = { name: "Juice", unit: "jugs of juice", packs: 3, cost: s.pack.jugs };
  const ice: Buy = { name: "Ice", unit: "bags of ice", packs: 2, cost: s.pack.ice };

  if (L === 3) {
    const whole = buys.filter((b) => b.packs >= 2 && b.cost % 100 === 0 && b.packs * b.cost <= 10000);
    const b = whole.length ? pickR(r, whole) : jugs;
    const v = b.packs * b.cost;
    const d = b.cost / 100;
    return build({
      ...base,
      standard: "NC.3.OA.3",
      skill: "Multiply to find a cost",
      prompt: `You buy ${b.packs} ${b.unit} at $${d} each. How much do they cost?`,
      answer: money(v, style),
      wrong: wrongMoney(v, [v + b.cost, v - b.cost, (b.packs + d) * 100], 100, style),
      explanation: `${b.packs} × $${d} = $${b.packs * d}. Multiplying is fast adding: ${Array.from({ length: b.packs }, () => `$${d}`).join(" + ")}.`,
      calc: { t: "times", qty: b.packs, price: b.cost },
      fmt: "money",
    });
  }

  if (L === 4) {
    const two = buys.length >= 2 ? buys.slice(0, 2) : [jugs, ice];
    const t = sum(two.map((b) => b.packs * b.cost));
    const paid = t < 2000 ? 2000 : Math.ceil((t + 1) / 1000) * 1000;
    const ch = paid - t;
    return build({
      ...base,
      standard: "NC.4.MD.2",
      skill: "Multi-step money problems",
      prompt: `You buy ${two.map((b) => `${b.packs} ${b.unit} at ${money(b.cost, style)}`).join(" and ")}. You pay with ${money(paid, style)}. Change?`,
      answer: money(ch, style),
      wrong: wrongMoney(ch, [paid - two[0].packs * two[0].cost, ch + two[1].cost, ch - two[1].cost, t], 100, style),
      explanation: `Total: ${two.map((b) => `${b.packs} × ${money(b.cost, style)}`).join(" + ")} = ${money(t, style)}. Change: ${money(paid, style)} − ${money(t, style)} = ${money(ch, style)}.`,
      calc: { t: "change", prices: two.flatMap((b) => Array.from({ length: b.packs }, () => b.cost)), paid },
      fmt: "money",
    });
  }

  if (L === 5) {
    const list = buys.length ? buys : [jugs, ice];
    const cash = Math.max(ctx.cash, sum(list.map((b) => b.packs * b.cost)) + 500);
    const spent = sum(list.map((b) => b.packs * b.cost));
    const v = cash - spent;
    return build({
      ...base,
      standard: "NC.5.NBT.7",
      skill: "Budget with decimals",
      prompt: `You have ${money(cash, style)}. You buy ${list.map((b) => `${b.packs} × ${money(b.cost, style)} (${b.name.toLowerCase()})`).join(", ")}. How much cash is left?`,
      answer: money(v, style),
      wrong: wrongMoney(v, [v + list[0].cost, v - list[0].cost, spent, v + 100], 50, style),
      explanation: `Spent: ${list.map((b) => money(b.packs * b.cost, style)).join(" + ")} = ${money(spent, style)}. Left: ${money(cash, style)} − ${money(spent, style)} = ${money(v, style)}.`,
      calc: { t: "left", cash, prices: list.flatMap((b) => Array.from({ length: b.packs }, () => b.cost)) },
      fmt: "money",
    });
  }

  if (L === 6) {
    const k = ri(r, 0, 3);
    if (k === 0) {
      const v = s.pack.jugs / 10;
      return build({
        ...base,
        standard: "NC.6.RP.3",
        skill: "Unit rate (cost per serving)",
        prompt: `A ${money(s.pack.jugs, style)} jug of juice makes 10 servings. What is the cost per serving?`,
        answer: money(v, style),
        wrong: wrongMoney(v, [v * 10, v + 10, v / 2, v + 5], 5, style),
        explanation: `Unit rate: ${money(s.pack.jugs, style)} ÷ 10 servings = ${money(v, style)} per serving.`,
        calc: { t: "unit", cost: s.pack.jugs, per: 10 },
        fmt: "money",
      });
    }
    if (k === 1) {
      // Best buy: two cup packs with different unit prices.
      const [aQ, aC, bQ, bC] = pickR(r, [
        [10, 150, 25, 350],
        [10, 150, 50, 700],
        [20, 300, 50, 800],
        [10, 120, 30, 330],
      ] as const);
      const la = `${aQ} for ${money(aC, style)}`;
      const lb = `${bQ} for ${money(bC, style)}`;
      const aUnit = aC / aQ;
      const bUnit = bC / bQ;
      const ans = aUnit < bUnit ? la : lb;
      return build({
        ...base,
        standard: "NC.6.RP.3",
        skill: "Best buy (unit price)",
        prompt: `Cups come ${la} or ${lb}. Which is the better buy?`,
        answer: ans,
        wrong: [ans === la ? lb : la, "Same price", "Can't tell"],
        explanation: `Find the price per cup: ${money(aC, style)} ÷ ${aQ} = ${aUnit}¢ and ${money(bC, style)} ÷ ${bQ} = ${bUnit}¢. ${ans} costs less per cup.`,
        calc: { t: "best", aQty: aQ, aCost: aC, bQty: bQ, bCost: bC, labels: [la, lb] },
        fmt: "label",
      });
    }
    if (k === 2) {
      const per = 10;
      const need = pickR(r, [20, 30, 40, 50, 60]);
      const v = need / per;
      return build({
        ...base,
        standard: "NC.6.RP.3",
        skill: "Recipe ratios",
        prompt: `1 jug of juice makes ${per} servings. How many jugs do you need for ${need} juices?`,
        answer: String(v),
        wrong: wrongInts(v, [need, v + 1, v * 2, v - 1], String),
        explanation: `The ratio is 1 jug : ${per} servings. ${need} servings ÷ ${per} = ${v} jugs.`,
        calc: { t: "packs", per, need },
        fmt: "count",
      });
    }
    const cost = s.pack.snacks;
    const pct = pickR(r, [10, 20, 25, 50].filter((p) => (cost * p) % 100 === 0));
    const sale = cost - (cost * pct) / 100;
    return build({
      ...base,
      standard: "NC.6.RP.3",
      skill: "Percent of a quantity",
      prompt: `A box of snacks is ${money(cost, style)}, on sale for ${pct}% off. What is the sale price?`,
      answer: money(sale, style),
      wrong: wrongMoney(sale, [(cost * pct) / 100, cost - pct, cost + (cost * pct) / 100], 25, style),
      explanation: `${pct}% of ${money(cost, style)} = ${money((cost * pct) / 100, style)}. ${money(cost, style)} − ${money((cost * pct) / 100, style)} = ${money(sale, style)}.`,
      calc: { t: "pctOff", base: cost, pct },
      fmt: "money",
    });
  }

  if (L === 7) {
    const k = ri(r, 0, 2);
    if (k === 0) {
      const principal = pickR(r, [1000, 2000, 4000, 5000]);
      const rate = pickR(r, [2, 5, 10]);
      const periods = pickR(r, [2, 3, 4]);
      const v = (principal * rate * periods) / 100;
      return build({
        ...base,
        standard: "NC.7.RP.3",
        skill: "Simple interest",
        prompt: `A family loan for the cart: ${money(principal, style)} at ${rate}% simple interest per week. Interest for ${periods} weeks?`,
        answer: money(v, style),
        wrong: wrongMoney(v, [(principal * rate) / 100, principal + v, (principal * rate * (periods + 1)) / 100, v * 10], 50, style),
        explanation: `Simple interest I = P × r × t = ${money(principal, style)} × ${rate}% × ${periods} = ${money(v, style)}.`,
        calc: { t: "interest", principal, rate, periods },
        fmt: "money",
      });
    }
    if (k === 1) {
      const cost = ctx.servingCost;
      const pcts = [50, 100, 150, 25, 75].filter((p) => (cost * p) % 100 === 0);
      const pct = pickR(r, pcts);
      const v = cost + (cost * pct) / 100;
      return build({
        ...base,
        standard: "NC.7.RP.3",
        skill: "Markup",
        prompt: `One juice costs ${money(cost, style)} in supplies. With a ${pct}% markup, what is the price?`,
        answer: money(v, style),
        wrong: wrongMoney(v, [(cost * pct) / 100, cost + pct, cost * 2 + (cost * pct) / 100], 10, style),
        explanation: `Markup: ${pct}% of ${money(cost, style)} = ${money((cost * pct) / 100, style)}. Price = cost + markup = ${money(v, style)}.`,
        calc: { t: "markup", cost, pct },
        fmt: "money",
      });
    }
    const from = pickR(r, [100, 150, 200, 250]);
    const pct = pickR(r, [20, 50, -20, 10]);
    const to = from + (from * pct) / 100;
    if (!Number.isInteger(to)) return planQuestion("7", ctx, r);
    const label = (p: number) => `${Math.abs(p)}% ${p >= 0 ? "increase" : "decrease"}`;
    const diff = Math.abs(to - from);
    return build({
      ...base,
      standard: "NC.7.RP.3",
      skill: "Percent increase and decrease",
      prompt: `You change the juice price from ${money(from, style)} to ${money(to, style)}. What is the percent change?`,
      answer: label(pct),
      wrong: [label(-pct), label(pct * 2), label(Math.round((diff / to) * 100) === Math.abs(pct) ? pct + 5 : Math.sign(pct) * Math.round((diff / to) * 100)), label(pct + 10)],
      explanation: `Change ÷ original: ${money(diff, style)} ÷ ${money(from, style)} = ${Math.abs(pct)}%. The price went ${pct >= 0 ? "up" : "down"}.`,
      calc: { t: "pctChange", from, to },
      fmt: "pctChange",
    });
  }

  // Grades 8+: functions built from the real price and supply cost.
  const price = ctx.juicePrice > ctx.servingCost ? ctx.juicePrice : s.ref;
  const cost = ctx.servingCost;
  const m = price - cost;
  const k = ri(r, 4, 15);
  const fixed = m * k; // keeps the break-even point a whole number of cups

  if (L === 8) {
    if (r() < 0.5) {
      return build({
        ...base,
        standard: "NC.8.F.4",
        skill: "Slope as a rate (profit per cup)",
        prompt: `Juice sells for ${money(price, style)}; supplies cost ${money(cost, style)} a cup. In P(n) = mn − F, what is m?`,
        answer: money(m, style),
        wrong: wrongMoney(m, [price, cost, price + cost, m + 25], 25, style),
        explanation: `The slope is the profit for each extra cup: ${money(price, style)} − ${money(cost, style)} = ${money(m, style)} per cup.`,
        calc: { t: "margin", price, cost },
        fmt: "money",
      });
    }
    return build({
      ...base,
      standard: "NC.8.EE.7",
      skill: "Break-even point",
      prompt: `Profit P(n) = ${money(m, style)}·n − ${money(fixed, style)}. How many cups to break even (P = 0)?`,
      answer: String(k),
      wrong: wrongInts(k, [k + 1, k - 1, k + 2, Math.round(fixed / price)], String),
      explanation: `Set P = 0: ${money(m, style)}·n = ${money(fixed, style)}, so n = ${money(fixed, style)} ÷ ${money(m, style)} = ${k} cups.`,
      calc: { t: "breakEven", margin: m, fixed },
      fmt: "count",
    });
  }

  if (L === 9) {
    if (r() < 0.5) {
      return build({
        ...base,
        standard: "NC.M1.A-REI.6",
        skill: "Break-even with a system",
        prompt: `Cost C = ${money(cost, style)}n + ${money(fixed, style)}; revenue R = ${money(price, style)}n. For what n is R = C?`,
        answer: String(k),
        wrong: wrongInts(k, [k + 1, k - 1, k + 2, k * 2], String),
        explanation: `Set R = C: ${money(price, style)}n = ${money(cost, style)}n + ${money(fixed, style)} → ${money(m, style)}n = ${money(fixed, style)} → n = ${k}.`,
        calc: { t: "system2", price, cost, fixed },
        fmt: "count",
      });
    }
    const x = k + ri(r, 2, 10);
    const v = m * x - fixed;
    return build({
      ...base,
      standard: "NC.M1.F-IF.2",
      skill: "Evaluate a profit function",
      prompt: `P(n) = ${money(m, style)}n − ${money(fixed, style)}. What is P(${x})?`,
      answer: money(v, style),
      wrong: wrongMoney(v, [m * x, m * x + fixed, v + m, v - m], 25, style),
      explanation: `P(${x}) = ${money(m, style)} × ${x} − ${money(fixed, style)} = ${money(m * x, style)} − ${money(fixed, style)} = ${money(v, style)}.`,
      calc: { t: "evalLin", m, b: -fixed, x },
      fmt: "money",
    });
  }

  if (L === 10 || L === 11) {
    // Demand q = a − b·p (p in dollars). Revenue R = p·q is a parabola with its top at p = a / 2b.
    const [a, b] = pickR(r, [
      [40, 10],
      [30, 10],
      [24, 6],
      [40, 8],
      [60, 20],
      [36, 12],
    ] as const);
    const pStar = (100 * a) / (2 * b);
    if (L === 10) {
      return build({
        ...base,
        standard: "NC.M2.F-IF.8",
        skill: "Maximize revenue (vertex)",
        prompt: `Cups sold q = ${a} − ${b}p (p in dollars). Revenue R = p(${a} − ${b}p). Which price gives the most revenue?`,
        answer: money(pStar, style),
        wrong: wrongMoney(pStar, [(100 * a) / b, pStar + 50, pStar - 50, pStar * 2], 25, style),
        explanation: `R = ${a}p − ${b}p² is a parabola opening down. Its vertex is at p = ${a} ÷ (2 × ${b}) = ${money(pStar, style)}.`,
        calc: { t: "vertexP", a, b },
        fmt: "money",
      });
    }
    const v = (100 * a * a) / (4 * b);
    return build({
      ...base,
      standard: "NC.M3.F-IF.4",
      skill: "Maximum of a revenue function",
      prompt: `Revenue R(p) = p(${a} − ${b}p) dollars at price p. What is the maximum revenue?`,
      answer: money(v, style),
      wrong: wrongMoney(v, [pStar, (100 * a * a) / (2 * b), v / 2, v + 500], 100, style),
      explanation: `The maximum is at the vertex p = ${a}/(2·${b}) = ${money(pStar, style)}, where q = ${a / 2} cups. R = ${money(pStar, style)} × ${a / 2} = ${money(v, style)}.`,
      calc: { t: "maxRev", a, b },
      fmt: "money",
    });
  }

  // Grade 12: Economics and Personal Finance
  const k12 = ri(r, 0, 2);
  if (k12 === 0) {
    const gross = pickR(r, [4000, 6000, 8000, 10000, 12000]);
    const bp = 765;
    const v = gross - (gross * bp) / 10000;
    return build({
      ...base,
      subject: "social",
      standard: "EPF.IE.1.1",
      skill: "Paychecks (FICA)",
      prompt: `You pay yourself ${money(gross, style)} from the cart this week. FICA takes 7.65%. What is your net pay?`,
      answer: money(v, style),
      wrong: wrongMoney(v, [(gross * bp) / 10000, gross - 765, gross - (gross * 765) / 1000], 100, style),
      explanation: `FICA (Social Security + Medicare) = 7.65% of ${money(gross, style)} = ${money((gross * bp) / 10000, style)}. Net = ${money(gross, style)} − ${money((gross * bp) / 10000, style)} = ${money(v, style)}.`,
      calc: { t: "net", gross, bp },
      fmt: "money",
    });
  }
  if (k12 === 1) {
    const principal = pickR(r, [10000, 20000, 30000, 60000]);
    const apr = pickR(r, [6, 12, 18, 24]);
    const v = (principal * apr) / 1200;
    return build({
      ...base,
      subject: "social",
      standard: "EPF.MCM.2.2",
      skill: "Loan interest (APR)",
      prompt: `A ${money(principal, style)} loan for a new cart has a ${apr}% APR. About how much interest for one month?`,
      answer: money(v, style),
      wrong: wrongMoney(v, [(principal * apr) / 100, v * 2, principal / 12, v + 100], 100, style),
      explanation: `Monthly rate = ${apr}% ÷ 12 = ${apr / 12}%. ${apr / 12}% of ${money(principal, style)} = ${money(v, style)}.`,
      calc: { t: "apr", principal, apr },
      fmt: "money",
    });
  }
  const list = buys.length ? buys : [jugs, ice];
  const cash = Math.max(ctx.cash, sum(list.map((b) => b.packs * b.cost)) + 500);
  const spent = sum(list.map((b) => b.packs * b.cost));
  return build({
    ...base,
    subject: "social",
    standard: "EPF.MCM.1.1",
    skill: "Budgeting",
    prompt: `Your cart budget is ${money(cash, style)}. Supplies today: ${list.map((b) => `${b.packs} × ${money(b.cost, style)}`).join(", ")}. What is left in the budget?`,
    answer: money(cash - spent, style),
    wrong: wrongMoney(cash - spent, [spent, cash - spent + list[0].cost, cash - spent - 100], 100, style),
    explanation: `Spent ${money(spent, style)}. Budget left: ${money(cash, style)} − ${money(spent, style)} = ${money(cash - spent, style)}.`,
    calc: { t: "left", cash, prices: list.flatMap((b) => Array.from({ length: b.packs }, () => b.cost)) },
    fmt: "money",
  });
}

// ------------------------------------------------------------- REFLECT (evening)

export interface ReflectCtx {
  scale: Scale;
  revenue: number;
  cost: number;
  sold: Record<ItemId, number>;
  juicePrice: number;
  servingCost: number;
}

function concept(set: ConceptSet, answerIn: "a" | "b", r: Rand) {
  const [A, B] = CONCEPTS[set];
  const right = answerIn === "a" ? A : B;
  const other = answerIn === "a" ? B : A;
  const ans = pickR(r, right);
  const pool = [...other];
  const wrong: string[] = [];
  while (wrong.length < 3 && pool.length) wrong.push(pool.splice(Math.floor(r() * pool.length), 1)[0]);
  return { ans, wrong };
}

export function reflectQuestion(grade: Grade, ctx: ReflectCtx, r: Rand): SSQuestion {
  const L = gnum(grade);
  const style = styleFor(grade);
  const base = { level: grade, style, kind: "reflect" as const };
  const flip = r() < 0.5;
  const R = ctx.revenue;
  const C = ctx.cost;

  if (L === 0) {
    const ansIn = flip ? "a" : "b";
    const { ans, wrong } = concept("needsWants", ansIn, r);
    return build({
      ...base,
      subject: "social",
      standard: "K.E.1.1",
      skill: "Needs and wants",
      prompt: ansIn === "a" ? "Which one does the juice cart NEED?" : "Which one is a WANT, not a need, for the cart?",
      answer: ans,
      wrong,
      explanation: `The cart needs cups, juice and ice to sell juice. ${ansIn === "a" ? ans : "Things like " + ans.toLowerCase()} ${ansIn === "a" ? "is a need." : "are fun, but the cart can work without them, so they are wants."}`,
      calc: { t: "concept", set: "needsWants", answerIn: ansIn },
      fmt: "label",
    });
  }
  if (L === 1) {
    const ansIn = flip ? "a" : "b";
    const { ans, wrong } = concept("goodsServices", ansIn, r);
    return build({
      ...base,
      subject: "social",
      standard: "1.E.1",
      skill: "Goods and services",
      prompt: ansIn === "a" ? "Which one is a GOOD (a thing you can hold)?" : "Juice is a good. Which one is a SERVICE?",
      answer: ans,
      wrong,
      explanation: "Goods are things you can hold, like juice or a snack. Services are jobs people do for you, like delivering mail or walking a dog.",
      calc: { t: "concept", set: "goodsServices", answerIn: ansIn },
      fmt: "label",
    });
  }
  if (L === 2) {
    if (flip) {
      const { ans, wrong } = concept("producerConsumer", "a", r);
      return build({
        ...base,
        subject: "social",
        standard: "2.E.1",
        skill: "Producers and consumers",
        prompt: "At the juice cart, who is the PRODUCER?",
        answer: ans,
        wrong,
        explanation: "A producer makes or sells goods. You make and sell the juice. The people who buy it are consumers.",
        calc: { t: "concept", set: "producerConsumer", answerIn: "a" },
        fmt: "label",
      });
    }
    const [rv, cs] = R > C && R < 1000 ? [R, C] : [85, 60];
    const v = rv - cs;
    return build({
      ...base,
      standard: "NC.2.MD.8",
      skill: "Money word problems",
      prompt: `You took in ${money(rv, style)} and spent ${money(cs, style)} on supplies. How much more did you take in?`,
      answer: money(v, style),
      wrong: wrongMoney(v, [rv + cs, v + 10, v - 10, cs], 5, style),
      explanation: `Subtract: ${money(rv, style)} − ${money(cs, style)} = ${money(v, style)}. That extra money is your profit.`,
      calc: { t: "profit", revenue: rv, cost: cs },
      fmt: "money",
    });
  }
  if (L === 3) {
    if (flip) {
      return build({
        ...base,
        subject: "social",
        standard: "3.E.1",
        skill: "Opportunity cost",
        prompt: "You can buy the sign OR the cooler, not both. You pick the sign. What did you give up?",
        answer: "The cooler",
        wrong: ["The sign", "Nothing", "Your cart"],
        explanation: "The best thing you give up when you choose is the opportunity cost. Choosing the sign means giving up the cooler.",
        calc: { t: "concept", set: "oppCost", answerIn: "a" },
        fmt: "label",
      });
    }
    const [rv, cs] = R > 0 && R < 1000 && C < 1000 && R !== C ? [R, C] : [850, 600];
    const gain = rv >= cs;
    const v = Math.abs(rv - cs);
    return build({
      ...base,
      standard: "NC.3.NBT.2",
      skill: "Profit: revenue − costs",
      prompt: gain
        ? `You took in ${money(rv, style)} and spent ${money(cs, style)}. What was your profit?`
        : `You took in ${money(rv, style)} but spent ${money(cs, style)}. How much more did you spend?`,
      answer: money(v, style),
      wrong: wrongMoney(v, [rv + cs, v + 100, v - 100, v + 10], 25, style),
      explanation: `${money(Math.max(rv, cs), style)} − ${money(Math.min(rv, cs), style)} = ${money(v, style)}. ${gain ? "Revenue minus costs is profit." : "Spending more than you take in is a loss. Leftover supplies can still sell tomorrow!"}`,
      calc: { t: "profit", revenue: Math.max(rv, cs), cost: Math.min(rv, cs) },
      fmt: "money",
    });
  }
  if (L === 4) {
    if (flip) {
      const { ans, wrong } = concept("capitalOther", "a", r);
      return build({
        ...base,
        subject: "social",
        standard: "4.E.1.3",
        skill: "Factors of production",
        prompt: "Your cart, cooler and juice pitcher are tools used to make goods. What factor of production are they?",
        answer: ans,
        wrong,
        explanation: "Capital means tools, machines and buildings used to produce goods and services. Land is natural resources; labor is people's work.",
        calc: { t: "concept", set: "capitalOther", answerIn: "a" },
        fmt: "label",
      });
    }
    const j = ctx.sold.juice || 6;
    const sn = ctx.sold.snack || 2;
    const jp = ctx.juicePrice;
    const sp = ctx.scale.snackPrice;
    const v = j * jp + sn * sp;
    return build({
      ...base,
      standard: "NC.4.MD.2",
      skill: "Multi-step money problems",
      prompt: `You sold ${j} juices at ${money(jp, style)} and ${sn} snacks at ${money(sp, style)}. What was the revenue from them?`,
      answer: money(v, style),
      wrong: wrongMoney(v, [j * jp, (j + sn) * jp, v + sp, v - jp], 25, style),
      explanation: `${j} × ${money(jp, style)} = ${money(j * jp, style)}; ${sn} × ${money(sp, style)} = ${money(sn * sp, style)}. Together: ${money(v, style)}.`,
      calc: { t: "total", prices: [...Array.from({ length: j }, () => jp), ...Array.from({ length: sn }, () => sp)] },
      fmt: "money",
    });
  }
  if (L === 5) {
    if (flip) {
      const { ans, wrong } = concept("budget", "a", r);
      return build({
        ...base,
        subject: "social",
        standard: "5.E.2.2",
        skill: "Budgeting",
        prompt: "Before buying supplies, you list what you will spend and what you will save. What is that list called? It is…",
        answer: ans,
        wrong,
        explanation: "A budget is a spending plan: it shows money coming in, money going out and money saved.",
        calc: { t: "concept", set: "budget", answerIn: "a" },
        fmt: "label",
      });
    }
    const [rv, cs] = R > 0 && R !== C ? [R, C] : [1675, 1240];
    const gain = rv >= cs;
    const v = Math.abs(rv - cs);
    return build({
      ...base,
      standard: "NC.5.NBT.7",
      skill: "Decimal money operations",
      prompt: gain
        ? `Revenue ${money(rv, style)}, costs ${money(cs, style)}. What was today's profit?`
        : `Revenue ${money(rv, style)}, costs ${money(cs, style)}. How big was today's loss?`,
      answer: money(v, style),
      wrong: wrongMoney(v, [rv + cs, v + 100, v - 10, v + 1], 10, style),
      explanation: `Line up the decimal points: ${money(Math.max(rv, cs), style)} − ${money(Math.min(rv, cs), style)} = ${money(v, style)}.`,
      calc: { t: "profit", revenue: Math.max(rv, cs), cost: Math.min(rv, cs) },
      fmt: "money",
    });
  }
  if (L === 6) {
    const j = ctx.sold.juice;
    const sn = ctx.sold.snack;
    if (flip && j > 0 && sn > 0 && j !== sn) {
      const g = gcd(j, sn);
      const ans = `${j / g}:${sn / g}`;
      return build({
        ...base,
        standard: "NC.6.RP.1",
        skill: "Ratios",
        prompt: `You sold ${j} juices and ${sn} snacks. What is the ratio of juices to snacks in simplest form?`,
        answer: ans,
        wrong: [`${sn / g}:${j / g}`, `${j / g + 1}:${sn / g}`, `${j / g}:${sn / g + 1}`, `${j + sn}:${sn}`],
        explanation: `${j}:${sn}. Divide both by ${g}: ${ans}. For every ${j / g} juice${j / g > 1 ? "s" : ""} you sold ${sn / g} snack${sn / g > 1 ? "s" : ""}.`,
        calc: { t: "ratio", a: j, b: sn },
        fmt: "ratio",
      });
    }
    const whole = pickR(r, [2000, 2500, 4000, 5000]);
    const pct = pickR(r, [10, 20, 25, 40, 50]);
    const part = (whole * pct) / 100;
    return build({
      ...base,
      standard: "NC.6.RP.3",
      skill: "Percent of revenue",
      prompt: `A stand takes in ${money(whole, style)} and keeps ${money(part, style)} as profit. Profit is what percent of revenue?`,
      answer: pctS(pct),
      wrong: wrongInts(pct, [pct * 2, 100 - pct, pct + 5, pct / 2], pctS),
      explanation: `${money(part, style)} ÷ ${money(whole, style)} = ${pct}/100 = ${pct}%.`,
      calc: { t: "pctOf", part, whole },
      fmt: "pct",
    });
  }
  if (L === 7) {
    if (flip) {
      const { ans, wrong } = concept("market", "a", r);
      return build({
        ...base,
        subject: "social",
        standard: "7.E.1",
        skill: "Market economies",
        prompt: "In a market economy, who decides the price of the juice at your cart?",
        answer: ans,
        wrong,
        explanation: "In a market economy, sellers set their own prices, and buyers decide whether to buy. That is why your price changes how many people stop.",
        calc: { t: "concept", set: "market", answerIn: "a" },
        fmt: "label",
      });
    }
    const from = pickR(r, [2000, 2500, 4000, 5000]);
    const pct = pickR(r, [10, 20, 25, 50, -10, -20, -25]);
    const to = from + (from * pct) / 100;
    const label = (p: number) => `${Math.abs(p)}% ${p >= 0 ? "increase" : "decrease"}`;
    return build({
      ...base,
      standard: "NC.7.RP.3",
      skill: "Percent increase and decrease",
      prompt: `Revenue went from ${money(from, style)} yesterday to ${money(to, style)} today. What is the percent change?`,
      answer: label(pct),
      wrong: [label(-pct), label(pct * 2), label(pct > 0 ? pct + 5 : pct - 5)],
      explanation: `Change ÷ original = ${money(Math.abs(to - from), style)} ÷ ${money(from, style)} = ${Math.abs(pct)}%, ${pct >= 0 ? "an increase" : "a decrease"}.`,
      calc: { t: "pctChange", from, to },
      fmt: "pctChange",
    });
  }
  if (L === 8) {
    const m = (ctx.juicePrice > ctx.servingCost ? ctx.juicePrice : ctx.scale.ref) - ctx.servingCost;
    const k = ri(r, 5, 12);
    const fixed = m * k;
    if (flip) {
      const x1 = k + 2;
      const x2 = k + 12;
      const y1 = m * x1 - fixed;
      const y2 = m * x2 - fixed;
      return build({
        ...base,
        standard: "NC.8.F.4",
        skill: "Slope from two points",
        prompt: `Your profit graph goes through (${x1} cups, ${money(y1, style)}) and (${x2} cups, ${money(y2, style)}). What is the slope (profit per cup)?`,
        answer: money(m, style),
        wrong: wrongMoney(m, [Math.round((y2 - y1) / 2), y2 - y1, m + 10, Math.round(y2 / x2)], 10, style),
        explanation: `Slope = rise ÷ run = (${money(y2, style)} − ${money(y1, style)}) ÷ (${x2} − ${x1}) = ${money(y2 - y1, style)} ÷ 10 = ${money(m, style)} per cup.`,
        calc: { t: "slope2", x1, y1, x2, y2 },
        fmt: "money",
      });
    }
    return build({
      ...base,
      standard: "NC.8.EE.7",
      skill: "Break-even point",
      prompt: `The graph of P(n) = ${money(m, style)}n − ${money(fixed, style)} crosses the n-axis at the break-even point. What is n there?`,
      answer: String(k),
      wrong: wrongInts(k, [k + 1, k - 1, k + 2], String),
      explanation: `On the n-axis P = 0, so ${money(m, style)}n = ${money(fixed, style)} and n = ${k} cups. Sell more than ${k} cups and the line is above zero: profit!`,
      calc: { t: "breakEven", margin: m, fixed },
      fmt: "count",
    });
  }
  if (L >= 9 && L <= 11) {
    return planQuestion(grade, { scale: ctx.scale, cash: R, buys: [], juicePrice: ctx.juicePrice, servingCost: ctx.servingCost }, r);
  }
  // Grade 12: EPF economics
  if (flip) {
    const { ans, wrong } = concept("demand", "a", r);
    return build({
      ...base,
      subject: "social",
      standard: "EPF.E.1.3",
      skill: "Supply and demand",
      prompt: "When you raise the juice price, fewer people buy. Which idea does this show?",
      answer: ans,
      wrong,
      explanation: "The law of demand: when the price goes up, the quantity people want to buy goes down (other things staying the same).",
      calc: { t: "concept", set: "demand", answerIn: "a" },
      fmt: "label",
    });
  }
  const rate = pickR(r, [1000, 1200, 1500]);
  const hours = pickR(r, [3, 4, 5, 6]);
  const v = rate * hours;
  return build({
    ...base,
    subject: "social",
    standard: "EPF.E.1",
    skill: "Opportunity cost",
    prompt: `You run the cart for ${hours} hours instead of a job paying ${money(rate, style)}/hour. What is the opportunity cost in pay?`,
    answer: money(v, style),
    wrong: wrongMoney(v, [rate, rate * (hours - 1), v / 2, rate + hours * 100], 500, style),
    explanation: `Opportunity cost = the best choice you gave up: ${hours} × ${money(rate, style)} = ${money(v, style)} of wages. The cart is worth it only if it earns more than that.`,
    calc: { t: "wage", rate, hours },
    fmt: "money",
  });
}

function gcd(a: number, b: number): number {
  while (b) [a, b] = [b, a % b];
  return a;
}

/** Pieces as a short spoken list ("2 quarters and 1 dime"). */
export function sayPieces(p: PieceId[]): string {
  const counts = new Map<PieceId, number>();
  p.forEach((x) => counts.set(x, (counts.get(x) ?? 0) + 1));
  return [...counts.entries()]
    .map(([k, n]) => `${n} ${n > 1 ? (k === "penny" ? "pennies" : `${PIECE_NAME[k].toLowerCase()}s`) : PIECE_NAME[k].toLowerCase()}`)
    .join(", ");
}
