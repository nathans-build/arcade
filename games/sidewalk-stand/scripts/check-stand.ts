/*
 * Sidewalk Stand content and simulation checks (run: npm test).
 *  1. Money formatting ($3.25, 75¢) and count-up change steps.
 *  2. Every generated pay / plan / reflect question, at every grade and every adaptive level:
 *     the answer is recomputed here with an independent integer-cents solver, exactly one choice
 *     has that value, choices are distinct, pay questions fit the quick limits, and the NC code
 *     belongs to the question's grade.
 *  3. The demand model is monotonic in price, weather and temperature.
 *  4. Whole games are played headless at every grade with sensible play, with "always pick A",
 *     and with a careless player: every day completes, cash never goes below zero, and the cash
 *     ledger balances to the cent.
 */
import { GRADES } from "../src/kit/grades";
import type { Grade } from "../src/kit/types";
import { ITEMS, SCALES, SUPPLIES, UPGRADES, gnum, scaleFor, type ItemId, type UpgradeId, type Weather } from "../src/stand/config";
import { capacityFor, demand, forecastFor, priceFactor, tempFactor, weatherFactor } from "../src/stand/demand";
import { StandGame } from "../src/stand/game";
import { mathQuestion } from "../src/kit/math";
import {
  COINS,
  PIECE_NAME,
  PIECE_VALUE,
  countUp,
  dollars,
  exactPieces,
  hashSeed,
  money,
  rng,
  sayMoney,
  type PieceId,
} from "../src/stand/money";
import { CONCEPTS, payQuestion, planQuestion, reflectQuestion, type Calc, type Line, type SSQuestion } from "../src/stand/questions";

let failures = 0;
let checks = 0;
const fail = (m: string) => {
  failures++;
  if (failures < 60) console.error("✘ " + m);
};
const ok = (cond: boolean, m: string) => {
  checks++;
  if (!cond) fail(m);
};

// ------------------------------------------------------------------ 1. money formatting
const fmtCases: [number, string, string, string][] = [
  // cents, "cents", "mixed", "dollars"
  [325, "325¢", "$3.25", "$3.25"],
  [75, "75¢", "75¢", "$0.75"],
  [5, "5¢", "5¢", "$0.05"],
  [100, "100¢", "$1.00", "$1.00"],
  [1250, "1250¢", "$12.50", "$12.50"],
  [123456, "123456¢", "$1,234.56", "$1,234.56"],
  [-125, "−125¢", "−$1.25", "−$1.25"],
  [0, "0¢", "0¢", "$0.00"],
];
for (const [c, a, b, d] of fmtCases) {
  ok(money(c, "cents") === a, `money(${c}, cents) = ${money(c, "cents")}, want ${a}`);
  ok(money(c, "mixed") === b, `money(${c}, mixed) = ${money(c, "mixed")}, want ${b}`);
  ok(money(c, "dollars") === d, `money(${c}, dollars) = ${money(c, "dollars")}, want ${d}`);
}
ok(dollars(1999) === "$19.99", "dollars(1999)");
ok(sayMoney(325) === "3 dollars and 25 cents", `sayMoney(325) = ${sayMoney(325)}`);
ok(sayMoney(75) === "75 cents", "sayMoney(75)");
ok(sayMoney(100) === "1 dollar", "sayMoney(100)");
let threw = false;
try {
  money(0.1 + 0.2);
} catch {
  threw = true;
}
ok(threw, "money() must refuse fractional cents");

for (let total = 1; total < 2000; total += 7) {
  for (const paid of [100, 200, 500, 1000, 2000]) {
    if (paid <= total) continue;
    const st = countUp(total, paid);
    const sum = st.reduce((a, [x]) => a + x, 0);
    ok(sum === paid - total, `countUp(${total}, ${paid}) adds to ${sum}`);
    ok(st.length > 0 && st[st.length - 1][1] === paid, `countUp(${total}, ${paid}) ends at the payment`);
    ok(st.every(([x]) => x > 0), `countUp(${total}, ${paid}) has a zero step`);
  }
}
for (let a = 1; a <= 195; a++) {
  const r = rng(a);
  const p = exactPieces(a, r, 100, 8);
  ok(p.reduce((s, x) => s + PIECE_VALUE[x], 0) === a, `exactPieces(${a}) sums wrong`);
}

// ------------------------------------------------------------------ 2. questions
const parseMoney = (s: string): number | null => {
  const neg = s.startsWith("−") || s.startsWith("-");
  const t = s.replace(/^[−-]/, "");
  let m = /^(\d+)¢$/.exec(t);
  if (m) return (neg ? -1 : 1) * Number(m[1]);
  m = /^\$(\d{1,3}(?:,\d{3})*|\d+)(?:\.(\d{2}))?$/.exec(t);
  if (m) return (neg ? -1 : 1) * (Number(m[1].replace(/,/g, "")) * 100 + Number(m[2] ?? 0));
  return null;
};

type Expect = { kind: "num"; v: number } | { kind: "label"; v: string } | { kind: "ratio"; a: number; b: number } | { kind: "set"; right: string[]; wrong: string[] };
const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : a);
const S = (a: number[]) => a.reduce((x, y) => x + y, 0);
const exact = (num: number, den: number, what: string) => {
  if (num % den !== 0) fail(`${what}: ${num}/${den} is not whole`);
  return num / den;
};

/** Independent solver: integer arithmetic only. */
function solve(c: Calc): Expect {
  switch (c.t) {
    case "coinId":
      return { kind: "label", v: PIECE_NAME[c.coin] };
    case "coinValue":
      return { kind: "num", v: { penny: 1, nickel: 5, dime: 10, quarter: 25 }[c.coin as "penny"] };
    case "count":
      return { kind: "num", v: c.pieces.reduce((a, p) => a + ({ penny: 1, nickel: 5, dime: 10, quarter: 25, bill1: 100, bill5: 500, bill10: 1000, bill20: 2000 } as Record<PieceId, number>)[p], 0) };
    case "symbol":
      return { kind: "num", v: c.cents };
    case "change":
      return { kind: "num", v: c.paid - S(c.prices) };
    case "total":
      return { kind: "num", v: S(c.prices) };
    case "times":
      return { kind: "num", v: c.qty * c.price };
    case "pctOff":
      return { kind: "num", v: exact(c.base * (100 - c.pct), 100, "pctOff") };
    case "plusPct":
      return { kind: "num", v: exact(c.base * (100 + c.pct), 100, "plusPct") };
    case "pctAmt":
      return { kind: "num", v: exact(c.base * c.pct, 100, "pctAmt") };
    case "discTax": {
      const d = exact(c.base * (100 - c.off), 100, "disc");
      return { kind: "num", v: exact(d * (100 + c.tax), 100, "tax") };
    }
    case "solveN":
      return { kind: "num", v: exact(c.paid - c.change - c.extra, c.price, "solveN") };
    case "system": {
      // Cramer's rule
      const det = c.a * c.d - c.b * c.c;
      if (det === 0) fail("singular system");
      const x = exact(c.t1 * c.d - c.b * c.t2, det, "system x");
      const y = exact(c.a * c.t2 - c.c * c.t1, det, "system y");
      return { kind: "num", v: c.ask === "x" ? x : y };
    }
    case "left":
      return { kind: "num", v: c.cash - S(c.prices) };
    case "unit":
      return { kind: "num", v: exact(c.cost, c.per, "unit") };
    case "best":
      // compare aCost/aQty vs bCost/bQty by cross-multiplying
      if (c.aCost * c.bQty === c.bCost * c.aQty) fail("best buy tie");
      return { kind: "label", v: c.aCost * c.bQty < c.bCost * c.aQty ? c.labels[0] : c.labels[1] };
    case "packs":
      return { kind: "num", v: Math.ceil(c.need / c.per) };
    case "interest":
      return { kind: "num", v: exact(c.principal * c.rate * c.periods, 100, "interest") };
    case "apr":
      return { kind: "num", v: exact(c.principal * c.apr, 1200, "apr") };
    case "markup":
      return { kind: "num", v: exact(c.cost * (100 + c.pct), 100, "markup") };
    case "pctChange":
      return { kind: "num", v: exact((c.to - c.from) * 100, c.from, "pctChange") };
    case "pctOf":
      return { kind: "num", v: exact(c.part * 100, c.whole, "pctOf") };
    case "slope2":
      return { kind: "num", v: exact(c.y2 - c.y1, c.x2 - c.x1, "slope") };
    case "margin":
      return { kind: "num", v: c.price - c.cost };
    case "breakEven":
      return { kind: "num", v: exact(c.fixed, c.margin, "breakEven") };
    case "system2":
      return { kind: "num", v: exact(c.fixed, c.price - c.cost, "system2") };
    case "evalLin":
      return { kind: "num", v: c.m * c.x + c.b };
    case "vertexP":
      return { kind: "num", v: exact(100 * c.a, 2 * c.b, "vertex") };
    case "maxRev":
      return { kind: "num", v: exact(100 * c.a * c.a, 4 * c.b, "maxRev") };
    case "net":
      return { kind: "num", v: c.gross - exact(c.gross * c.bp, 10000, "fica") };
    case "wage":
      return { kind: "num", v: c.rate * c.hours };
    case "ratio":
      return { kind: "ratio", a: c.a, b: c.b };
    case "profit":
      return { kind: "num", v: c.revenue - c.cost };
    case "concept": {
      const [A, B] = CONCEPTS[c.set];
      return { kind: "set", right: c.answerIn === "a" ? A : B, wrong: c.answerIn === "a" ? B : A };
    }
  }
}

function valueOf(q: SSQuestion, choice: string): number | null {
  switch (q.fmt) {
    case "money":
      return parseMoney(choice);
    case "count":
      return /^\d+$/.test(choice) ? Number(choice) : null;
    case "pct": {
      const m = /^(\d+)%$/.exec(choice);
      return m ? Number(m[1]) : null;
    }
    case "pctChange": {
      const m = /^(\d+)% (increase|decrease)$/.exec(choice);
      return m ? (m[2] === "increase" ? 1 : -1) * Number(m[1]) : null;
    }
    default:
      return null;
  }
}

function codeOk(code: string, g: Grade): boolean {
  const n = gnum(g);
  if (n === 0) return /^(NC\.K\.|K\.)/.test(code);
  if (n <= 8) return new RegExp(`^(NC\\.${n}\\.|${n}\\.)`).test(code);
  return new RegExp(`^(NC\\.M${n - 8}\\.|${["WH", "CL", "AH", "EPF"][n - 9]}\\.)`).test(code);
}

const codesSeen = new Map<string, Set<string>>();
const kindsSeen = new Map<string, number>();

function checkQ(q: SSQuestion, chosen: Grade, where: string) {
  const tag = `[${where} g${chosen} ${q.calc.t} "${q.prompt}"]`;
  ok(q.choices.length === 4 && new Set(q.choices).size === 4, `${tag} needs 4 distinct choices: ${q.choices.join(" | ")}`);
  ok(q.answer === 0, `${tag} answer should be authored first`);
  ok(!/undefined|NaN|Infinity|\[object/.test(q.prompt + q.choices.join("") + q.explanation), `${tag} has a broken value`);
  ok(q.prompt.length <= 200, `${tag} prompt too long (${q.prompt.length})`);
  ok(q.choices.every((c) => c.length <= 24), `${tag} choice too long`);
  ok(q.explanation.length > 10 && q.explanation.length <= 320, `${tag} explanation length ${q.explanation.length}`);
  if (q.kind === "pay") ok(!!q.quick, `${tag} pay questions must be quick (prompt ≤ 100, choices ≤ 14): ${q.prompt.length} / ${q.choices.join("|")}`);
  ok(codeOk(q.standard, q.grade), `${tag} code ${q.standard} is not a grade ${q.grade} code`);
  const cg = gnum(chosen);
  const qg = gnum(q.grade);
  ok(qg <= cg + 2 && (qg >= cg - 2 || (cg >= 10 && qg >= 7)), `${tag} question grade ${q.grade} too far from chosen grade ${chosen}`);
  if (q.pieces) ok(q.pieces.every((p) => p in PIECE_VALUE), `${tag} bad piece`);
  const set = codesSeen.get(q.grade) ?? new Set();
  set.add(`${q.standard} (${q.skill})`);
  codesSeen.set(q.grade, set);
  kindsSeen.set(`${q.kind}:${q.calc.t}`, (kindsSeen.get(`${q.kind}:${q.calc.t}`) ?? 0) + 1);

  const e = solve(q.calc);
  const ans = q.choices[q.answer];
  if (e.kind === "num") {
    const vals = q.choices.map((c) => valueOf(q, c));
    if (q.fmt === "money") ok(ans === money(e.v, q.style), `${tag} answer ${ans} ≠ ${money(e.v, q.style)}`);
    ok(vals[q.answer] === e.v, `${tag} answer value ${vals[q.answer]} ≠ solver ${e.v}`);
    ok(vals.filter((v) => v === e.v).length === 1, `${tag} two choices have the right value: ${q.choices.join(" | ")}`);
    ok(vals.every((v) => v !== null), `${tag} unparseable choice: ${q.choices.join(" | ")}`);
  } else if (e.kind === "label") {
    ok(ans === e.v, `${tag} answer ${ans} ≠ ${e.v}`);
    ok(q.choices.filter((c) => c === e.v).length === 1, `${tag} duplicate right label`);
    if (q.calc.t === "coinId") ok(q.choices.every((c) => COINS.some((k) => PIECE_NAME[k] === c)), `${tag} non-coin choice`);
  } else if (e.kind === "ratio") {
    const g = gcd(e.a, e.b);
    ok(ans === `${e.a / g}:${e.b / g}`, `${tag} ratio answer ${ans}`);
    const same = q.choices.filter((c) => {
      const [x, y] = c.split(":").map(Number);
      return x * e.b === y * e.a;
    });
    ok(same.length === 1, `${tag} more than one equivalent ratio: ${q.choices.join(" | ")}`);
  } else {
    ok(e.right.includes(ans), `${tag} answer ${ans} not in the right list`);
    ok(q.choices.filter((c) => e.right.includes(c)).length === 1, `${tag} two right answers: ${q.choices.join(" | ")}`);
  }
}

// Concept lists never overlap.
for (const [k, [A, B]] of Object.entries(CONCEPTS)) ok(A.every((x) => !B.includes(x)), `concept ${k} lists overlap`);

const levelsFor = (g: Grade): Grade[] => {
  const i = GRADES.indexOf(g);
  return GRADES.slice(Math.max(0, i - 2), Math.min(GRADES.length, i + 3));
};

for (const chosen of GRADES) {
  const sc = scaleFor(chosen);
  for (let seed = 1; seed <= 160; seed++) {
    const r = rng(hashSeed(seed, gnum(chosen), 5));
    const price = sc.priceOptions[seed % sc.priceOptions.length];
    // A random order within the band's limits.
    const items: ItemId[] = [];
    const n = 1 + Math.floor(r() * sc.maxItems);
    for (let i = 0; i < n; i++) items.push(ITEMS[Math.floor(r() * 3)]);
    let lines: Line[] = ITEMS.map((it) => ({ item: it, qty: items.filter((x) => x === it).length, price: it === "juice" ? price : it === "fruit" ? sc.fruitPrice : sc.snackPrice })).filter((l) => l.qty);
    while (lines.reduce((a, l) => a + l.qty * l.price, 0) > sc.maxOrder) {
      const last = lines[lines.length - 1];
      if (last.qty > 1) last.qty--;
      else if (lines.length > 1) lines = lines.slice(0, -1);
      else break;
    }
    for (const level of levelsFor(chosen)) {
      const who = ["Kid", "Mail carrier", "Dog walker", "Robot"][seed % 4];
      const q = payQuestion(level, { who, lines, scale: sc, juicePrice: price }, rng(seed * 31 + gnum(level)));
      checkQ(q, chosen, `pay L${level}`);
      ok(q.revenue !== undefined && q.revenue > 0, `pay question without revenue`);
      if (gnum(chosen) >= 3) {
        const cash = sc.start + (seed % 7) * 100;
        const buys = SUPPLIES.filter((_, i) => (seed >> i) & 1).map((s) => ({ name: s.name, unit: s.name.toLowerCase(), packs: 1 + (seed % 3), cost: sc.pack[s.id] }));
        const pq = planQuestion(level, { scale: sc, cash, buys, juicePrice: price, servingCost: sc.pack.cups / 10 + sc.pack.jugs / 10 + sc.pack.ice / 10 }, rng(seed * 17 + gnum(level)));
        checkQ(pq, chosen, `plan L${level}`);
      }
    }
    const rq = reflectQuestion(
      chosen,
      { scale: sc, revenue: (seed * 37) % 3000, cost: (seed * 23) % 2000, sold: { juice: seed % 9, fruit: seed % 3, snack: (seed * 7) % 5 }, juicePrice: price, servingCost: Math.round(sc.pack.cups / 10 + sc.pack.jugs / 10 + sc.pack.ice / 10) },
      rng(seed * 13),
    );
    checkQ(rq, chosen, "reflect");
  }
}

// ------------------------------------------------------------------ 3. demand model
const none = new Set<UpgradeId>();
const all = new Set<UpgradeId>(UPGRADES.map((u) => u.id));
for (const g of GRADES) {
  const sc = scaleFor(g);
  for (const ups of [none, all]) {
    for (const w of ["sunny", "cloudy", "rain"] as Weather[]) {
      for (let temp = 55; temp <= 95; temp += 5) {
        let last = Infinity;
        for (const p of sc.priceOptions) {
          const d = demand(g, sc, { weather: w, temp, luck: 1000 }, p, ups);
          ok(d.raw <= last + 1e-9, `demand rises with price at grade ${g} ${w} ${temp}°F p=${p}`);
          ok(d.customers <= capacityFor(ups) && d.customers >= 0, "customers outside 0..capacity");
          last = d.raw;
        }
      }
    }
    for (const p of sc.priceOptions) {
      for (let temp = 55; temp <= 95; temp += 5) {
        const s = demand(g, sc, { weather: "sunny", temp, luck: 1000 }, p, ups).raw;
        const c = demand(g, sc, { weather: "cloudy", temp, luck: 1000 }, p, ups).raw;
        const r = demand(g, sc, { weather: "rain", temp, luck: 1000 }, p, ups).raw;
        ok(s >= c - 1e-9 && c >= r - 1e-9, `weather order sunny ≥ cloudy ≥ rain fails at ${g} p=${p} ${temp}°F`);
        const warmer = demand(g, sc, { weather: "cloudy", temp: temp + 5, luck: 1000 }, p, ups).raw;
        ok(warmer >= c - 1e-9, `warmer day brings fewer customers at ${g} p=${p}`);
      }
    }
  }
}
ok(priceFactor(SCALES.elem.ref, SCALES.elem.ref) === 1, "usual price gives factor 1");
ok(priceFactor(SCALES.elem.ref * 2, SCALES.elem.ref) === 0, "double price gives factor 0");
ok(weatherFactor("rain", all) > weatherFactor("rain", none), "umbrella helps on rain");
ok(tempFactor(95, "sunny", all) > tempFactor(95, "sunny", none), "umbrella helps on hot sunny days");
for (let s = 1; s < 50; s++) {
  const a = forecastFor(s, 2);
  const b = forecastFor(s, 2);
  ok(a.weather === b.weather && a.temp === b.temp && a.luck === b.luck, "forecast not deterministic");
  ok(forecastFor(s, 1).weather !== "rain", "day 1 should never be rainy");
}

// ------------------------------------------------------------------ 4. whole games
type Policy = "sensible" | "alwaysA" | "careless";

function play(grade: Grade, seed: number, policy: Policy) {
  const game = new StandGame(null, undefined, grade);
  game.rand = rng(seed * 7 + 1);
  // The kit's QuestionDeck needs Vite (import.meta.glob); generated kit math stands in for it here.
  game.makeDeck = (g) => ({ draw: () => mathQuestion(g) });
  game.start(seed);
  const sc = game.scale;
  let guard = 0;
  let ledgerCash = sc.start;
  let rescues = 0;
  let pays = 0;
  let wrongs = 0;
  const answerQ = () => {
    const q = game.q!;
    const pick = policy === "sensible" ? q.q.answer : 0;
    if (pick !== q.q.answer) wrongs++;
    game.answer(pick);
    if (game.q!.picked === null) fail(`answer not accepted at ${grade}`);
    game.continueQ();
  };
  while (game.phase !== "over" && guard++ < 400000) {
    if (game.cash < 0) {
      fail(`cash below zero at grade ${grade} seed ${seed} (${policy}): ${game.cash}`);
      break;
    }
    switch (game.phase) {
      case "plan":
        if (game.rescue) {
          rescues++;
          const before = game.cash;
          game.acceptRescue();
          ledgerCash += game.cash - before;
        }
        if (policy === "careless") {
          // Buys as much as it can at the highest price.
          game.setPrice(99);
          for (let i = 0; i < 60; i++) for (const s of SUPPLIES) game.setPack(s.id, 1);
        } else game.helpPlan();
        ledgerCash -= game.cartCost();
        game.openStand();
        break;
      case "planQ":
      case "ledger":
      case "transmission":
        answerQ();
        break;
      case "pay":
        pays++;
        answerQ();
        break;
      case "upgrade":
        if (policy === "sensible" && game.day < game.days) {
          const u = UPGRADES.find((x) => !game.upgrades.has(x.id) && game.upgradeCost(x.id) <= game.cash - sc.start / 2);
          if (u) {
            ledgerCash -= game.upgradeCost(u.id);
            game.buyUpgrade(u.id);
          }
        }
        game.nextFromUpgrade();
        break;
      case "rush": {
        if (policy !== "careless") {
          // Serve the closest customer whose next item can be made.
          let target = -1;
          let item: ItemId | null = null;
          let bestX = Infinity;
          const flying = new Set(game.slides.filter((s) => s.dir === 1).map((s) => s.lane));
          for (let l = 0; l < game.lanes; l++) {
            const f = game.front(l);
            if (!f || flying.has(l)) continue;
            const it = game.remaining(f).find((x) => game.canMake(x) > 0);
            if (it && f.x < bestX) {
              bestX = f.x;
              target = l;
              item = it;
            }
          }
          if (target >= 0 && item) {
            game.setLane(target);
            game.setItem(item);
            game.serve();
          }
        }
        game.step(0.05);
        break;
      }
      default:
        fail(`stuck in phase ${game.phase}`);
        guard = 1e9;
    }
  }
  ok(game.phase === "over", `grade ${grade} seed ${seed} (${policy}) did not finish: phase ${game.phase} day ${game.day}`);
  ok(game.history.length === game.days, `grade ${grade} history has ${game.history.length} days`);
  const rev = game.history.reduce((a, d) => a + d.revenue, 0);
  ledgerCash += rev - game.loanPaid;
  ok(ledgerCash === game.finalCash, `grade ${grade} seed ${seed} (${policy}) cash ledger ${ledgerCash} ≠ final ${game.finalCash}`);
  ok(game.finalCash >= 0, `final cash negative at ${grade}`);
  ok(Number.isInteger(game.finalCash) && Number.isInteger(game.score), "non-integer money or score");
  const served = game.history.reduce((a, d) => a + d.served, 0);
  if (policy === "sensible") ok(served > 0, `grade ${grade} seed ${seed}: sensible play served nobody`);
  return { served, pays, rescues, final: game.finalCash, score: game.score, wrongs, start: sc.start, log: game.log.length };
}

const summary: string[] = [];
for (const g of GRADES) {
  const rows: string[] = [];
  let profitDays = 0;
  for (const policy of ["sensible", "alwaysA", "careless"] as Policy[]) {
    for (let seed = 1; seed <= 6; seed++) {
      const r = play(g, seed * 101 + gnum(g), policy);
      if (policy === "sensible" && r.final > r.start) profitDays++;
      if (seed === 1) rows.push(`${policy}: served ${r.served}, pay Qs ${r.pays}, rescues ${r.rescues}, final ${money(r.final, "dollars")}, score ${r.score}`);
    }
  }
  ok(profitDays >= 4, `grade ${g}: sensible play should usually make a profit (${profitDays}/6)`);
  summary.push(`  ${g.padStart(2)}  ${rows.join(" · ")}`);
}

// ------------------------------------------------------------------ report
console.log("Simulated games (seed 1 per policy):");
console.log(summary.join("\n"));
console.log("\nQuestion kinds generated:", [...kindsSeen.entries()].map(([k, n]) => `${k}×${n}`).join(", "));
console.log("\nCodes by question grade:");
for (const g of GRADES) if (codesSeen.has(g)) console.log(`  ${g}: ${[...codesSeen.get(g)!].sort().join("; ")}`);
console.log(`\n${checks} checks, ${failures} failures`);
if (failures) process.exit(1);
