import type { Grade } from "@/kit/types";
import { evaluate, fmt, near } from "./expr";
import { items, listRule, type Rule, type RuleItem } from "./types";

/*
 * Math rules, K-12, tagged with NC Standard Course of Study for Mathematics codes.
 * Every list is written by hand and then re-checked by scripts/check-rules.ts, which
 * recomputes each label (number properties, the expression evaluator, equation checks).
 */

const say = (l: string) =>
  l
    .replace(/−/g, " minus ")
    .replace(/×/g, " times ")
    .replace(/÷/g, " divided by ")
    .replace(/·/g, " times ")
    .replace(/²/g, " squared")
    .replace(/³/g, " cubed")
    .replace(/√/g, " square root of ")
    .replace(/°/g, " degrees")
    .replace(/π/g, " pi ");

/** Items for "EQUALS n" style rules: the reason shows the value. */
function valueItems(labels: string[], target: number, targetText = fmt(target)): { matches: RuleItem[]; misses: RuleItem[] } {
  const matches: RuleItem[] = [];
  const misses: RuleItem[] = [];
  for (const l of labels) {
    const v = evaluate(l);
    if (near(v, target)) matches.push({ label: l, why: `${l} = ${fmt(v)}.`, say: say(l) });
    else misses.push({ label: l, why: `${l} = ${fmt(v)}, not ${targetText}.`, say: say(l) });
  }
  return { matches, misses };
}

/** Items for "x = a solves it" rules: both sides are evaluated at x = a. */
function solveItems(labels: string[], a: number): { matches: RuleItem[]; misses: RuleItem[] } {
  const matches: RuleItem[] = [];
  const misses: RuleItem[] = [];
  for (const l of labels) {
    const [lhs, rhs] = l.split("=");
    const L = evaluate(lhs, a);
    const R = evaluate(rhs, a);
    const shown = `With x = ${a}: ${fmt(L)} ${near(L, R) ? "=" : "≠"} ${fmt(R)}`;
    if (near(L, R)) matches.push({ label: l, why: `${shown}. It works!`, say: say(l) });
    else misses.push({ label: l, why: `${shown}, so x = ${a} is not a solution.`, say: say(l) });
  }
  return { matches, misses };
}

const WORDS = ["ZERO", "ONE", "TWO", "THREE", "FOUR", "FIVE", "SIX", "SEVEN", "EIGHT", "NINE", "TEN"];
const dots = (n: number) => "●".repeat(n);

/* ------------------------------------------------------------------ K */

function kBigger(): Rule {
  const all: { label: string; n: number; say?: string }[] = [];
  for (let n = 0; n <= 10; n++) all.push({ label: String(n), n });
  for (let n = 0; n <= 10; n++) all.push({ label: WORDS[n], n });
  for (let n = 1; n <= 8; n++) all.push({ label: dots(n), n, say: `${n} dots` });
  const why = (it: { label: string; n: number }, ok: boolean) => {
    const head = /^\d+$/.test(it.label) ? "" : it.label.startsWith("●") ? `${it.n} dots: ` : `${it.label} is ${it.n}. `;
    if (ok) return `${head}${it.n} is bigger than 5.`;
    return it.n === 5 ? `${head}5 is the same as 5, not bigger.` : `${head}${it.n} is smaller than 5.`;
  };
  return listRule({
    id: "k-bigger5",
    subject: "math",
    grade: "K",
    standard: "NC.K.CC.7",
    skill: "Compare numbers",
    text: "HOP ON NUMBERS BIGGER THAN 5",
    say: "Hop only on numbers bigger than 5.",
    hint: "Bigger than 5 means 6, 7, 8, 9, 10…",
    matches: all.filter((i) => i.n > 5).map((i) => ({ label: i.label, say: i.say, why: why(i, true) })),
    misses: all.filter((i) => i.n <= 5).map((i) => ({ label: i.label, say: i.say, why: why(i, false) })),
  });
}

const K_MAKE10 = ["0+10", "1+9", "2+8", "3+7", "4+6", "5+5", "6+4", "7+3", "8+2", "9+1", "10+0",
  "3+5", "4+4", "2+6", "6+3", "5+4", "7+2", "1+8", "2+7", "4+5", "5+3", "6+2"];
const K_EQ5 = ["0+5", "1+4", "2+3", "3+2", "4+1", "5+0", "10−5", "9−4", "8−3", "7−2", "6−1", "5−0",
  "2+2", "3+3", "1+3", "4+2", "9−5", "8−2", "7−3", "6−2", "10−4", "4+4"];

/* ------------------------------------------------------------------ 1 */

const G1_EQ10 = ["4+6", "7+3", "12−2", "15−5", "18−8", "11−1", "5+5", "2+8", "19−9", "13−3", "16−6", "9+1", "14−4",
  "6+5", "13−4", "12−3", "8+3", "17−8", "4+7", "15−6", "3+6", "11−2", "14−5", "9+2"];

function gt(id: string, grade: Grade, standard: string, skill: string, limit: number, labels: number[], hint: string): Rule {
  return listRule({
    id, subject: "math", grade, standard, skill,
    text: `HOP ON NUMBERS BIGGER THAN ${limit}`,
    say: `Hop only on numbers bigger than ${limit}.`,
    hint,
    matches: items(labels.filter((n) => n > limit).map(String), (l) => `${l} is bigger than ${limit}.`),
    misses: items(labels.filter((n) => n <= limit).map(String), (l) =>
      Number(l) === limit ? `${l} is equal to ${limit}, not bigger.` : `${l} is less than ${limit}.`),
  });
}

function hasTens(): Rule {
  const labels = [40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 14, 24, 34, 54, 4, 64, 74, 84, 94, 50, 39];
  const tens = (n: number) => Math.floor(n / 10);
  return listRule({
    id: "g1-4tens", subject: "math", grade: "1", standard: "NC.1.NBT.2", skill: "Tens and ones",
    text: "HOP ON NUMBERS WITH 4 TENS",
    say: "Hop only on numbers that have 4 tens.",
    hint: "4 tens is forty: 40, 41, 42 … 49.",
    matches: items(labels.filter((n) => tens(n) === 4).map(String), (l) => `${l} = 4 tens and ${Number(l) % 10} ones.`),
    misses: items(labels.filter((n) => tens(n) !== 4).map(String), (l) =>
      `${l} = ${tens(Number(l))} ten${tens(Number(l)) === 1 ? "" : "s"} and ${Number(l) % 10} ones.`),
  });
}

/* ------------------------------------------------------------------ 2 */

function parity(even: boolean): Rule {
  const labels = Array.from({ length: 20 }, (_, i) => i + 1);
  const word = even ? "EVEN" : "ODD";
  return listRule({
    id: `g2-${word.toLowerCase()}`, family: "g2-parity", subject: "math", grade: "2", standard: "NC.2.OA.3", skill: "Even and odd",
    text: `HOP ON ${word} NUMBERS`,
    say: `Hop only on ${word.toLowerCase()} numbers.`,
    hint: even ? "Even numbers make pairs: 2, 4, 6, 8, 10…" : "Odd numbers have one left over: 1, 3, 5, 7…",
    matches: items(labels.filter((n) => (n % 2 === 0) === even).map(String), (l) =>
      even ? `${l} = ${Number(l) / 2} + ${Number(l) / 2}. Even!` : `${l} has one left over. Odd!`),
    misses: items(labels.filter((n) => (n % 2 === 0) !== even).map(String), (l) =>
      even ? `${l} is odd: pairs leave one over.` : `${l} = ${Number(l) / 2} + ${Number(l) / 2}, so it is even.`),
  });
}

const G2_EQ15 = ["8+7", "9+6", "7+8", "6+9", "20−5", "18−3", "19−4", "10+5", "17−2", "16−1", "11+4", "13+2",
  "8+6", "9+7", "7+7", "20−6", "18−4", "16−2", "6+8", "9+5", "17−3", "12+2"];

/* ------------------------------------------------------------------ 3 */

const G3_EQ24 = ["4×6", "6×4", "3×8", "8×3", "2×12", "48÷2", "72÷3", "96÷4", "24÷1",
  "4×5", "5×5", "3×7", "6×5", "4×7", "36÷2", "7×3", "60÷3", "2×11", "9×3"];

function roundTo50(): Rule {
  const labels = [45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 44, 55, 40, 60, 38, 57, 64, 35, 42, 65];
  const r = (n: number) => Math.round(n / 10) * 10;
  return listRule({
    id: "g3-round50", subject: "math", grade: "3", standard: "NC.3.NBT.1", skill: "Rounding",
    text: "HOP ON NUMBERS THAT ROUND TO 50",
    say: "Hop only on numbers that round to 50 when you round to the nearest ten.",
    hint: "Nearest ten: 45 to 54 round to 50.",
    matches: items(labels.filter((n) => r(n) === 50).map(String), (l) =>
      Number(l) === 50 ? "50 is already a ten." : `${l} rounds to 50 (${Number(l) % 10 >= 5 ? "5 or more ones: round up" : "less than 5 ones: round down"}).`),
    misses: items(labels.filter((n) => r(n) !== 50).map(String), (l) => `${l} rounds to ${r(Number(l))}, not 50.`),
  });
}

const G3_LT1 = ["1/2", "1/3", "2/3", "1/4", "3/4", "1/6", "5/6", "1/8", "3/8", "7/8",
  "2/2", "3/3", "4/4", "6/6", "8/8", "3/2", "5/4", "7/6", "9/8", "4/3"];

function lessThanOne(): Rule {
  const lt = G3_LT1.filter((l) => evaluate(l) < 1);
  const ge = G3_LT1.filter((l) => evaluate(l) >= 1);
  return listRule({
    id: "g3-less1", subject: "math", grade: "3", standard: "NC.3.NF.3", skill: "Compare fractions to 1",
    text: "HOP ON FRACTIONS LESS THAN 1",
    say: "Hop only on fractions that are less than 1 whole.",
    hint: "Less than 1: the top number is smaller than the bottom.",
    matches: items(lt, (l) => { const [a, b] = l.split("/"); return `${l}: ${a} of ${b} equal parts is less than 1 whole.`; }),
    misses: items(ge, (l) => { const [a, b] = l.split("/"); return a === b ? `${l} = 1 whole, not less than 1.` : `${l}: ${a} parts is more than ${b}, so more than 1 whole.`; }),
  });
}

/* ------------------------------------------------------------------ 4 */

function multiplesOf(k: number): Rule {
  const matches = Array.from({ length: 11 }, (_, i) => k * (i + 2));
  const misses: number[] = [];
  for (const m of matches) {
    for (const d of [1, -1, 2, -2, 3]) {
      const n = m + d;
      if (n > 0 && n % k !== 0 && !misses.includes(n)) {
        misses.push(n);
        break;
      }
    }
  }
  return listRule({
    id: `g4-mult${k}`, family: "g4-multiples", subject: "math", grade: "4", standard: "NC.4.OA.4", skill: "Factors, multiples, and primes",
    text: `HOP ON MULTIPLES OF ${k}`,
    say: `Hop only on multiples of ${k}.`,
    hint: `Multiples of ${k}: ${k}, ${2 * k}, ${3 * k}, ${4 * k}…`,
    matches: items(matches.map(String), (l) => `${l} = ${k} × ${Number(l) / k}.`),
    misses: items(misses.map(String), (l) => {
      const n = Number(l);
      return `${l} = ${k} × ${Math.floor(n / k)} + ${n % k}. Not a multiple of ${k}.`;
    }),
  });
}

function factorsOf(n: number): Rule {
  const fs: number[] = [];
  const non: number[] = [];
  for (let d = 1; d <= n; d++) (n % d === 0 ? fs : non).push(d);
  // Non-factors: prefer the ones kids mix up (near factors), at most 10.
  const picked = non.filter((d) => d > 1).slice(0, 10);
  return listRule({
    id: `g4-factors${n}`, family: "g4-factors", subject: "math", grade: "4", standard: "NC.4.OA.4", skill: "Factors, multiples, and primes",
    text: `HOP ON FACTORS OF ${n}`,
    say: `Hop only on factors of ${n}.`,
    hint: `A factor of ${n} divides it with no remainder.`,
    matches: items(fs.map(String), (l) => `${n} = ${l} × ${n / Number(l)}.`),
    misses: items(picked.map(String), (l) => {
      const d = Number(l);
      return `${n} ÷ ${l} = ${Math.floor(n / d)} R${n % d}. Not a factor.`;
    }),
  });
}

function primes(): Rule {
  const P = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47];
  const C = [1, 4, 6, 9, 15, 21, 25, 27, 33, 35, 39, 49, 51, 57, 91];
  const split = (n: number) => {
    for (let d = 2; d * d <= n; d++) if (n % d === 0) return `${d} × ${n / d}`;
    return "";
  };
  return listRule({
    id: "g4-primes", subject: "math", grade: "4", standard: "NC.4.OA.4", skill: "Factors, multiples, and primes",
    text: "HOP ON PRIME NUMBERS",
    say: "Hop only on prime numbers.",
    hint: "A prime has exactly two factors: 1 and itself.",
    matches: items(P.map(String), (l) => `${l} has only two factors: 1 and ${l}.`),
    misses: items(C.map(String), (l) =>
      l === "1" ? "1 has only one factor, so it is not prime." : `${l} = ${split(Number(l))}, so it is composite.`),
  });
}

const G4_HALF = ["1/2", "2/4", "3/6", "4/8", "5/10", "6/12", "50/100", "7/14", "8/16", "10/20",
  "1/3", "2/3", "3/4", "2/5", "3/5", "4/6", "5/8", "3/8", "5/12", "7/12", "6/10", "40/100"];

function equalHalf(): Rule {
  const m = G4_HALF.filter((l) => near(evaluate(l), 0.5));
  const x = G4_HALF.filter((l) => !near(evaluate(l), 0.5));
  return listRule({
    id: "g4-half", subject: "math", grade: "4", standard: "NC.4.NF.1", skill: "Equivalent fractions",
    text: "HOP ON FRACTIONS EQUAL TO 1/2",
    say: "Hop only on fractions equal to one half.",
    hint: "Equal to 1/2: the top is half of the bottom.",
    matches: items(m, (l) => { const [a, b] = l.split("/"); return `${a} is half of ${b}, so ${l} = 1/2.`; }),
    misses: items(x, (l) => { const [a, b] = l.split("/"); return `${a} is not half of ${b}, so ${l} ≠ 1/2.`; }),
  });
}

/* ------------------------------------------------------------------ 5 */

const G5_DEC = ["0.6", "0.75", "0.51", "0.9", "0.8", "0.502", "0.55", "0.7", "0.99", "0.625",
  "0.49", "0.05", "0.45", "0.099", "0.5", "0.25", "0.405", "0.3", "0.050", "0.499"];

function decimalsOverHalf(): Rule {
  const m = G5_DEC.filter((l) => Number(l) > 0.5);
  const x = G5_DEC.filter((l) => Number(l) <= 0.5);
  const th = (l: string) => `${Math.round(Number(l) * 1000)} thousandths`;
  return listRule({
    id: "g5-over-half", subject: "math", grade: "5", standard: "NC.5.NBT.3", skill: "Compare decimals",
    text: "HOP ON DECIMALS BIGGER THAN 0.5",
    say: "Hop only on decimals bigger than 0.5.",
    hint: "0.5 = 500 thousandths. Compare place by place.",
    matches: items(m, (l) => `${l} = ${th(l)}, more than 500.`),
    misses: items(x, (l) => (Number(l) === 0.5 ? "0.5 is equal to 0.5, not bigger." : `${l} = ${th(l)}, less than 500.`)),
  });
}

const G5_SUM1 = ["1/2+1/2", "1/3+2/3", "1/4+3/4", "2/5+3/5", "1/6+5/6", "3/8+5/8", "1/2+2/4", "1/3+4/6", "1/4+6/8", "3/10+7/10",
  "1/2+1/3", "1/4+1/2", "2/3+2/3", "1/5+3/5", "3/8+3/8", "1/2+3/4", "2/6+1/3", "1/3+1/4", "5/8+1/2", "2/5+1/2"];

const G5_1000 = ["10³", "10×100", "10×10×10", "100×10", "10000÷10", "1×10³", "10⁴÷10", "10⁵÷100", "0.1×10⁴",
  "10²", "10⁴", "100×100", "3×10", "10³÷10", "1000÷10", "10+10+10", "10²×10²", "100+10"];

/* ------------------------------------------------------------------ 6 */

const G6_NEG = ["−3", "−0.5", "−1/2", "−12", "−100", "−7", "−2.5", "−1", "−3/4", "−40",
  "0", "3", "0.5", "1/2", "12", "7", "2.5", "|−8|", "−(−4)", "|−1|"];

function negatives(): Rule {
  const m = G6_NEG.filter((l) => evaluate(l) < 0);
  const x = G6_NEG.filter((l) => evaluate(l) >= 0);
  return listRule({
    id: "g6-negative", subject: "math", grade: "6", standard: "NC.6.NS.5", skill: "Positive and negative numbers",
    text: "HOP ON NUMBERS LESS THAN 0",
    say: "Hop only on numbers less than zero.",
    hint: "Negative numbers sit left of 0 on the number line.",
    matches: items(m, (l) => `${l} is left of 0 on the number line.`, say),
    misses: items(x, (l) => {
      const v = evaluate(l);
      if (l.startsWith("|")) return `${l} = ${fmt(v)}: absolute value is never negative.`;
      if (l.startsWith("−(")) return `${l} = ${fmt(v)}: the opposite of a negative is positive.`;
      return v === 0 ? "0 is neither positive nor negative." : `${l} is positive (right of 0).`;
    }, say),
  });
}

const G6_RATIO = ["2:3", "4:6", "6:9", "8:12", "10:15", "12:18", "20:30", "14:21", "16:24",
  "3:2", "2:4", "4:5", "3:4", "6:8", "5:6", "9:6", "10:12", "3:5", "4:9"];

function ratio23(): Rule {
  const ok = (l: string) => { const [a, b] = l.split(":").map(Number); return a * 3 === b * 2; };
  return listRule({
    id: "g6-ratio23", subject: "math", grade: "6", standard: "NC.6.RP.3", skill: "Equivalent ratios",
    text: "HOP ON RATIOS EQUAL TO 2:3",
    say: "Hop only on ratios equivalent to 2 to 3.",
    hint: "Multiply both parts of 2:3 by the same number.",
    matches: items(G6_RATIO.filter(ok), (l) => { const [a] = l.split(":").map(Number); return `${l} = 2:3 with both parts × ${a / 2}.`; }, (l) => l.replace(":", " to ")),
    misses: items(G6_RATIO.filter((l) => !ok(l)), (l) => `${l} ≠ 2:3 (not the same multiplier on both parts).`, (l) => l.replace(":", " to ")),
  });
}

const G6_X4 = ["x+3=7", "2x=8", "x−1=3", "12÷x=3", "5x=20", "x+6=10", "3x=12", "x÷2=2", "9−x=5", "x²=16",
  "x+4=10", "2x=6", "x−1=5", "3x=15", "x÷2=4", "12÷x=4", "x+9=12", "4x=12", "7−x=2", "x²=8"];

/* ------------------------------------------------------------------ 7 */

const G7_NEG6 = ["−2+(−4)", "−10+4", "3−9", "−3−3", "−8+2", "0−6", "4+(−10)", "−1−5", "6−12", "−15+9",
  "−10+16", "3−(−9)", "−3+3", "−8−2", "6−0", "−1+7", "2−(−4)", "−3+9", "−12+18", "−4−(−10)"];
const G7_NEG12 = ["−3×4", "3×(−4)", "−2×6", "24÷(−2)", "−36÷3", "−1×12", "6×(−2)", "−48÷4", "12÷(−1)", "−6×2",
  "−3×(−4)", "−2×(−6)", "−24÷(−2)", "36÷3", "(−6)×(−2)", "−4×4", "−3×3", "−36÷4", "12÷(−2)", "−1×(−12)"];
const G7_75 = ["3/4", "0.75", "75/100", "6/8", "9/12", "15/20", "0.750", "30/40", "12/16", "75%",
  "7/5", "0.075", "7.5", "3/5", "4/3", "0.57", "57%", "25/100", "7/50", "0.34"];
const G7_X3 = ["2x+1=7", "3x−4=5", "4x+3=15", "5x−5=10", "2x−7=−1", "10−2x=4", "3(x+1)=12", "x/3+2=3", "6x+2=20", "7−x=4",
  "2x+1=9", "3x−4=8", "4x+3=11", "5x−5=15", "2x−7=1", "10−2x=6", "3(x+1)=9", "x/3+2=5", "6x+2=26", "2x+3=6"];

/* ------------------------------------------------------------------ 8 */

const G8_LINEAR = ["y=2x+1", "y=x", "y=3−x", "y=x/2", "y=5", "y=−4x", "y=0.5x+2", "y=7x−3", "y=(x+1)/3", "y=10−2x",
  "y=x²", "y=1/x", "y=2ˣ", "y=x³", "y=√x", "y=x²+1", "y=|x|", "y=3/x", "y=x(x+1)", "y=2x²−1"];

/** True when y = f(x) has a constant rate of change on sample points (where it's defined). */
export function isLinear(label: string): boolean {
  const rhs = label.split("=")[1];
  const xs = [-3, -2, -1, 1, 2, 3, 4, 5];
  const pts = xs.map((x) => [x, evaluate(rhs, x)] as const).filter(([, y]) => Number.isFinite(y));
  const slopes: number[] = [];
  for (let i = 1; i < pts.length; i++) slopes.push((pts[i][1] - pts[i - 1][1]) / (pts[i][0] - pts[i - 1][0]));
  return slopes.every((s) => near(s, slopes[0]));
}

function linear(): Rule {
  return listRule({
    id: "g8-linear", subject: "math", grade: "8", standard: "NC.8.F.3", skill: "Linear and nonlinear functions",
    text: "HOP ON LINEAR FUNCTIONS",
    say: "Hop only on linear functions.",
    hint: "Linear: y = mx + b, a straight line (constant rate).",
    matches: items(G8_LINEAR.filter(isLinear), (l) => `${l} has a constant rate of change: a straight line.`, say),
    misses: items(G8_LINEAR.filter((l) => !isLinear(l)), (l) => `${l} is nonlinear: its rate of change is not constant.`, say),
  });
}

const G8_IRR_M = ["√2", "√3", "√5", "√7", "π", "√10", "√8", "√50", "2π", "√11"];
const G8_IRR_X = ["√4", "√9", "0.5", "1/3", "−7", "√25", "√16", "0.25", "22/7", "√100", "3.14", "√1"];

const G8_CUBES = ["1", "8", "27", "64", "125", "216", "343", "512", "729", "1000",
  "9", "16", "36", "100", "49", "81", "50", "12", "144", "400", "25"];

function cubes(): Rule {
  const root = (n: number) => Math.round(Math.cbrt(n));
  const isCube = (l: string) => root(Number(l)) ** 3 === Number(l);
  return listRule({
    id: "g8-cubes", subject: "math", grade: "8", standard: "NC.8.EE.2", skill: "Square and cube roots",
    text: "HOP ON PERFECT CUBES",
    say: "Hop only on perfect cubes.",
    hint: "A perfect cube is n × n × n: 1, 8, 27, 64…",
    matches: items(G8_CUBES.filter(isCube), (l) => { const r = root(Number(l)); return `${l} = ${r}×${r}×${r} = ${r}³.`; }),
    misses: items(G8_CUBES.filter((l) => !isCube(l)), (l) => {
      const n = Number(l);
      const s = Math.round(Math.sqrt(n));
      const r = Math.floor(Math.cbrt(n) + 1e-9);
      return `${l} is between ${r}³ = ${r ** 3} and ${r + 1}³ = ${(r + 1) ** 3}${s * s === n ? ` (it is ${s}², a square)` : ""}.`;
    }),
  });
}

/* ------------------------------------------------------------------ 9: NC Math 1 */

const M1_EQUIV = ["(x+2)(x+3)", "(x+3)(x+2)", "(3+x)(2+x)", "x²+5x+6", "6+5x+x²", "x²+2x+3x+6", "x(x+5)+6", "5x+x²+6", "x²+6+5x",
  "(x+1)(x+6)", "(x+2)(x−3)", "x²+6x+5", "x²+5x+5", "(x+5)(x+1)", "x²+6", "x(x+6)+5", "(x−2)(x−3)", "x²+5x−6"];

/** Same polynomial as x²+5x+6? (checked at several x values). */
export function sameAsTrinomial(label: string): boolean {
  return [-3, -1, 0, 1, 2, 5, 7].every((x) => near(evaluate(label, x), x * x + 5 * x + 6));
}

const M1_FACTOR = ["x²+5x+6", "x²+3x+2", "x²−4", "x²+2x", "2x+4", "x²+x−2", "x²+4x+4", "x²−x−6", "3x+6", "x²+6x+8",
  "x²+5x+4", "x²−5x+6", "x²+4", "x²−2x", "2x+2", "x²+x−6", "x²+4x+3", "x²−3x+2", "x+3", "x²+7x+6"];

const M1_GROWTH = ["y=2ˣ", "y=3ˣ", "y=1.5ˣ", "y=4(2)ˣ", "y=0.5(3)ˣ", "y=10(1.1)ˣ", "y=(5/4)ˣ", "y=2(1.3)ˣ",
  "y=0.5ˣ", "y=(1/3)ˣ", "y=4(0.9)ˣ", "y=2x", "y=x²", "y=3(0.2)ˣ", "y=0.8ˣ", "y=5(1/2)ˣ", "y=x+10"];

/** Exponential growth: a constant ratio f(x+1)/f(x) that is bigger than 1. */
export function isGrowth(label: string): boolean {
  const rhs = label.split("=")[1];
  const ratios = [0, 1, 2, 3, 4].map((x) => evaluate(rhs, x + 1) / evaluate(rhs, x));
  return ratios.every((r) => near(r, ratios[0])) && ratios[0] > 1;
}

function growth(): Rule {
  return listRule({
    id: "m1-growth", subject: "math", grade: "9", standard: "NC.M1.F-LE.1", skill: "Linear and exponential models",
    text: "HOP ON EXPONENTIAL GROWTH",
    say: "Hop only on exponential growth functions.",
    hint: "y = a·bˣ with a > 0 and b > 1 is growth.",
    matches: items(M1_GROWTH.filter(isGrowth), (l) => `${l}: y is multiplied by the same number (> 1) each step.`),
    misses: items(M1_GROWTH.filter((l) => !isGrowth(l)), (l) => {
      const rhs = l.split("=")[1];
      if (!rhs.includes("ˣ")) return `${l} is not exponential (x is not the exponent).`;
      return `${l} is exponential decay: the base is between 0 and 1.`;
    }),
  });
}

/* ------------------------------------------------------------------ 10: NC Math 2 */

const M2_RAT = ["√2·√2", "√3·√12", "√8÷√2", "(√5)²", "2+√9", "√2−√2", "√50÷√2", "3·√16", "√18÷√2", "(2√3)²",
  "√2+1", "2√3", "√2·√3", "π+1", "3+√5", "√8", "√2÷2", "√6÷√2", "5−√7", "√12"];

/** Rational if the value is p/q for some q ≤ 1000 (the irrational ones here are far from that). */
export function looksRational(v: number): boolean {
  for (let q = 1; q <= 1000; q++) if (Math.abs(v * q - Math.round(v * q)) < 1e-7) return true;
  return false;
}

function rationalResults(rational: boolean): Rule {
  const isR = (l: string) => looksRational(evaluate(l));
  const word = rational ? "RATIONAL" : "IRRATIONAL";
  return listRule({
    id: `m2-${word.toLowerCase()}`, family: "m2-rational", subject: "math", grade: "10", standard: "NC.M2.N-RN.3", skill: "Rational and irrational numbers",
    text: `HOP ON ${word} RESULTS`,
    say: `Hop only on ${word.toLowerCase()} results.`,
    hint: rational ? "Rational = a fraction of integers (√4 = 2 counts)." : "Irrational = never a fraction, like √2 or π.",
    matches: items(M2_RAT.filter((l) => isR(l) === rational), (l) =>
      rational ? `${l} = ${fmt(evaluate(l))}, a rational number.` : `${l} ≈ ${evaluate(l).toFixed(3)}…, irrational.`, say),
    misses: items(M2_RAT.filter((l) => isR(l) !== rational), (l) =>
      rational ? `${l} ≈ ${evaluate(l).toFixed(3)}…, irrational.` : `${l} = ${fmt(evaluate(l))}, a rational number.`, say),
  });
}

const M2_EQ4 = ["16^(1/2)", "8^(2/3)", "64^(1/3)", "2²", "32^(2/5)", "(√2)⁴", "256^(1/4)", "4^1", "(1/4)^(−1)",
  "16^(1/4)", "8^(1/3)", "4^(1/2)", "9^(1/2)", "2³", "64^(1/2)", "27^(2/3)", "4^(3/2)", "(√2)²", "16^(3/4)"];
const M2_X4 = ["x²=16", "x²−16=0", "(x−4)²=0", "x²−4x=0", "x²−5x+4=0", "2x²=32", "x²−3x−4=0", "x²+x=20", "x²=4x",
  "x²=4", "x²+16=0", "(x+4)²=0", "x²+4x=0", "x²−5x−4=0", "x²=8", "(x−2)²=0", "x²−x=6", "3x²=12", "x²+x=12"];

/* ------------------------------------------------------------------ 11: NC Math 3 */

const M3_ROOT1 = ["x³−1", "x²−1", "x²+x−2", "2x−2", "x³−x", "x²−3x+2", "x⁴−1", "x³−2x+1", "x²−2x+1", "5x−5",
  "x²+1", "x+1", "x³+1", "x²−4", "x²+x+1", "x²−2x−3", "x³+x", "x⁴+1", "2x+2", "x²+3x+2"];

function rootAt1(): Rule {
  const p1 = (l: string) => evaluate(l, 1);
  return listRule({
    id: "m3-root1", subject: "math", grade: "11", standard: "NC.M3.A-APR.2", skill: "Remainder theorem",
    text: "HOP ON p(x) WITH p(1) = 0",
    say: "Hop only on polynomials that equal zero when x is 1. Then x minus 1 is a factor.",
    hint: "Plug in x = 1. If p(1) = 0, (x − 1) is a factor.",
    matches: items(M3_ROOT1.filter((l) => near(p1(l), 0)), (l) => `p(1) = 0, so (x − 1) is a factor of ${l}.`, say),
    misses: items(M3_ROOT1.filter((l) => !near(p1(l), 0)), (l) => `p(1) = ${fmt(p1(l))}, not 0.`, say),
  });
}

const M3_EVEN = ["y=x²", "y=|x|", "y=cos x", "y=x⁴", "y=x²+3", "y=−x²", "y=5", "y=x⁴−x²", "y=|x|−2", "y=2x²",
  "y=x³", "y=x", "y=sin x", "y=x+1", "y=2ˣ", "y=x²+x", "y=x³+1", "y=1/x", "y=−x", "y=(x−1)²"];

export function isEven(label: string): boolean {
  const rhs = label.split("=")[1];
  return [0.5, 1, 2, 3].every((x) => near(evaluate(rhs, x), evaluate(rhs, -x)));
}

function evenFns(): Rule {
  return listRule({
    id: "m3-even", subject: "math", grade: "11", standard: "NC.M3.F-BF.3", skill: "Even and odd functions",
    text: "HOP ON EVEN FUNCTIONS",
    say: "Hop only on even functions.",
    hint: "Even: f(−x) = f(x), mirror image across the y-axis.",
    matches: items(M3_EVEN.filter(isEven), (l) => `${l}: f(−x) = f(x), symmetric about the y-axis.`, say),
    misses: items(M3_EVEN.filter((l) => !isEven(l)), (l) => {
      const rhs = l.split("=")[1];
      return `${l}: f(−2) = ${fmt(evaluate(rhs, -2))} but f(2) = ${fmt(evaluate(rhs, 2))}. Not even.`;
    }, say),
  });
}

const M3_LOG3 = ["log₂8", "log₃27", "log 1000", "ln e³", "log₅125", "log₄64", "log₁₀1000", "log₆216", "log₇343",
  "log₂16", "log₃9", "log 100", "ln e", "log₅25", "log₄16", "log₂4", "log 10", "log₉3", "log₈2"];

/* ------------------------------------------------------------------ 12: NC Math 4 */

const M4_LOG2 = ["log₂4", "log₃9", "ln e²", "log 100", "log₅25", "log₄16", "log₇49", "log₉81", "log₆36", "log₁₀100",
  "log₂8", "log 1000", "ln e", "log₃3", "log₂16", "log₄2", "log₅125", "log 10", "log₉3", "log₂32"];

const M4_I = ["i²", "i⁶", "i¹⁰", "i¹⁴", "i¹⁸", "i²²", "−i⁴", "i·i", "(−i)²", "i⁵·i",
  "i⁴", "i⁸", "i", "i³", "i⁵", "i⁷", "i¹²", "−i²", "(i²)²", "i⁹"];

/** The value of a power-of-i label as 1, i, −1 or −i. */
export function powerOfI(label: string): "1" | "i" | "−1" | "−i" {
  const SUPD = "⁰¹²³⁴⁵⁶⁷⁸⁹";
  const supNum = (s: string) => Number([...s].map((c) => SUPD.indexOf(c)).join("") || "1");
  let sign = 1;
  let exp = 0;
  let s = label;
  if (s.startsWith("−") && !s.startsWith("−(")) {
    sign = -1;
    s = s.slice(1);
  }
  for (const f of s.split("·")) {
    let m: RegExpMatchArray | null;
    if ((m = f.match(/^i([⁰-⁹¹²³]*)$/))) exp += supNum(m[1]);
    else if ((m = f.match(/^\(−i\)([⁰-⁹¹²³]+)$/))) {
      const n = supNum(m[1]);
      exp += n;
      if (n % 2) sign = -sign;
    } else if ((m = f.match(/^\(i([⁰-⁹¹²³]+)\)([⁰-⁹¹²³]+)$/))) exp += supNum(m[1]) * supNum(m[2]);
    else throw new Error(`can't read ${label}`);
  }
  const cyc = [1, "i", -1, "-i"] as const;
  let v = cyc[exp % 4];
  if (sign < 0) v = v === 1 ? -1 : v === -1 ? 1 : v === "i" ? "-i" : "i";
  return v === 1 ? "1" : v === -1 ? "−1" : v === "i" ? "i" : "−i";
}

function powersOfI(): Rule {
  return listRule({
    id: "m4-i", subject: "math", grade: "12", standard: "NC.M4.N.1", skill: "Complex numbers",
    text: "HOP ON POWERS EQUAL TO −1",
    say: "Hop only on powers of i that equal negative 1.",
    hint: "i² = −1, i³ = −i, i⁴ = 1, then it repeats.",
    matches: items(M4_I.filter((l) => powerOfI(l) === "−1"), (l) => `${l} = −1.`),
    misses: items(M4_I.filter((l) => powerOfI(l) !== "−1"), (l) => `${l} = ${powerOfI(l)}, not −1.`),
  });
}

const M4_HALF = ["sin 30°", "cos 60°", "sin 150°", "cos 300°", "cos(−60°)", "sin 390°", "cos 420°", "sin(π/6)", "cos(π/3)",
  "sin 60°", "cos 30°", "sin 45°", "tan 45°", "cos 120°", "sin 210°", "cos 90°", "sin 0°", "sin 330°", "cos 240°"];

/* ------------------------------------------------------------------ assemble */

function eqRule(o: { id: string; family?: string; grade: Grade; standard: string; skill: string; target: number; targetText?: string; labels: string[]; text?: string; hint: string }): Rule {
  const t = o.targetText ?? fmt(o.target);
  return listRule({
    id: o.id, family: o.family, subject: "math", grade: o.grade, standard: o.standard, skill: o.skill,
    text: o.text ?? `HOP ON ANSWERS EQUAL TO ${t}`,
    say: `Hop only on the ones that equal ${say(t)}.`,
    hint: o.hint,
    ...valueItems(o.labels, o.target, t),
  });
}

function solveRule(o: { id: string; grade: Grade; standard: string; skill: string; x: number; labels: string[]; hint: string }): Rule {
  return listRule({
    id: o.id, subject: "math", grade: o.grade, standard: o.standard, skill: o.skill,
    text: `HOP ON EQUATIONS SOLVED BY x = ${o.x}`,
    say: `Hop only on equations that x equals ${o.x} makes true.`,
    hint: o.hint,
    ...solveItems(o.labels, o.x),
  });
}

function irrational(): Rule {
  return listRule({
    id: "g8-irrational", subject: "math", grade: "8", standard: "NC.8.NS.1", skill: "Rational and irrational numbers",
    text: "HOP ON IRRATIONAL NUMBERS",
    say: "Hop only on irrational numbers.",
    hint: "Irrational: can't be a fraction, e.g. √2, π.",
    matches: items(G8_IRR_M, (l) => `${l} ≈ ${evaluate(l).toFixed(4)}… never ends or repeats.`, say),
    misses: items(G8_IRR_X, (l) => {
      if (l.startsWith("√")) return `${l} = ${fmt(evaluate(l))}, a whole number, so rational.`;
      if (l === "22/7") return "22/7 is a fraction, so rational (it is close to π, but not π).";
      if (l === "3.14") return "3.14 = 314/100, rational (only close to π).";
      return `${l} can be written as a fraction, so it is rational.`;
    }, say),
  });
}

function factorX2(): Rule {
  const at = (l: string) => evaluate(l, -2);
  return listRule({
    id: "m1-factor", subject: "math", grade: "9", standard: "NC.M1.A-SSE.3", skill: "Factor quadratics",
    text: "HOP ON THOSE WITH FACTOR (x+2)",
    say: "Hop only on expressions that have x plus 2 as a factor.",
    hint: "(x+2) is a factor when the value is 0 at x = −2.",
    matches: items(M1_FACTOR.filter((l) => near(at(l), 0)), (l) => `At x = −2, ${l} = 0, so (x+2) is a factor.`, say),
    misses: items(M1_FACTOR.filter((l) => !near(at(l), 0)), (l) => `At x = −2, ${l} = ${fmt(at(l))}, not 0.`, say),
  });
}

function equivTrinomial(): Rule {
  return listRule({
    id: "m1-equiv", subject: "math", grade: "9", standard: "NC.M1.A-APR.1", skill: "Equivalent polynomial expressions",
    text: "HOP ON THE SAME AS x²+5x+6",
    say: "Hop only on expressions equal to x squared plus 5 x plus 6.",
    hint: "Multiply out and combine like terms to compare.",
    matches: items(M1_EQUIV.filter(sameAsTrinomial), (l) => `${l} multiplies/simplifies to x²+5x+6.`, say),
    misses: items(M1_EQUIV.filter((l) => !sameAsTrinomial(l)), (l) => `At x = 2, ${l} = ${fmt(evaluate(l, 2))}, but x²+5x+6 = 20.`, say),
  });
}

export const MATH_RULES: Rule[] = [
  // K
  kBigger(),
  eqRule({ id: "k-make10", grade: "K", standard: "NC.K.OA.4", skill: "Make 10", target: 10, labels: K_MAKE10,
    text: "HOP ON PAIRS THAT MAKE 10", hint: "Two numbers that add up to 10." }),
  eqRule({ id: "k-eq5", grade: "K", standard: "NC.K.OA.2", skill: "Add and subtract within 10", target: 5, labels: K_EQ5,
    text: "HOP ON WAYS TO MAKE 5", hint: "Add or take away. Does it land on 5?" }),
  // 1
  eqRule({ id: "g1-eq10", grade: "1", standard: "NC.1.OA.6", skill: "Add and subtract within 20", target: 10, labels: G1_EQ10,
    text: "HOP ON FACTS THAT EQUAL 10", hint: "Add or subtract. Is the answer 10?" }),
  gt("g1-gt50", "1", "NC.1.NBT.3", "Compare two-digit numbers", 50,
    [51, 54, 60, 67, 72, 85, 94, 99, 58, 71, 15, 45, 49, 50, 19, 27, 33, 40, 5, 12], "Look at the tens first."),
  hasTens(),
  // 2
  parity(true),
  parity(false),
  gt("g2-gt500", "2", "NC.2.NBT.4", "Compare three-digit numbers", 500,
    [501, 510, 550, 605, 700, 999, 523, 812, 650, 499, 50, 450, 500, 205, 399, 99, 5, 480, 150], "Compare the hundreds first."),
  eqRule({ id: "g2-eq15", grade: "2", standard: "NC.2.OA.2", skill: "Add and subtract within 20", target: 15, labels: G2_EQ15,
    text: "HOP ON FACTS THAT EQUAL 15", hint: "Use a fact you know, like 7 + 8 = 15." }),
  // 3
  eqRule({ id: "g3-eq24", grade: "3", standard: "NC.3.OA.7", skill: "Multiplication and division facts", target: 24, labels: G3_EQ24,
    text: "HOP ON FACTS THAT EQUAL 24", hint: "Multiply or divide. Is it 24?" }),
  roundTo50(),
  lessThanOne(),
  // 4
  ...[3, 4, 6, 7, 8, 9].map(multiplesOf),
  ...[24, 36, 48].map(factorsOf),
  primes(),
  equalHalf(),
  // 5
  decimalsOverHalf(),
  eqRule({ id: "g5-sum1", grade: "5", standard: "NC.5.NF.1", skill: "Add fractions", target: 1, labels: G5_SUM1,
    text: "HOP ON SUMS EQUAL TO 1", hint: "Use common denominators, then add." }),
  eqRule({ id: "g5-1000", grade: "5", standard: "NC.5.NBT.2", skill: "Powers of 10", target: 1000, targetText: "1,000", labels: G5_1000,
    text: "HOP ON ANSWERS EQUAL TO 1,000", hint: "10³ = 10 × 10 × 10 = 1,000." }),
  // 6
  negatives(),
  ratio23(),
  solveRule({ id: "g6-x4", grade: "6", standard: "NC.6.EE.5", skill: "Solutions of equations", x: 4, labels: G6_X4,
    hint: "Put 4 in for x. Are both sides equal?" }),
  // 7
  eqRule({ id: "g7-neg6", grade: "7", standard: "NC.7.NS.1", skill: "Add and subtract integers", target: -6, labels: G7_NEG6,
    hint: "Subtracting = adding the opposite." }),
  eqRule({ id: "g7-neg12", grade: "7", standard: "NC.7.NS.2", skill: "Multiply and divide integers", target: -12, labels: G7_NEG12,
    hint: "Different signs → negative. Same signs → positive." }),
  eqRule({ id: "g7-75", grade: "7", standard: "NC.7.NS.2", skill: "Fractions, decimals, percents", target: 0.75, targetText: "0.75", labels: G7_75,
    text: "HOP ON THE SAME AS 0.75", hint: "0.75 = 3/4 = 75%." }),
  solveRule({ id: "g7-x3", grade: "7", standard: "NC.7.EE.4", skill: "Two-step equations", x: 3, labels: G7_X3,
    hint: "Put 3 in for x. Are both sides equal?" }),
  // 8
  linear(),
  irrational(),
  cubes(),
  // 9 (NC Math 1)
  equivTrinomial(),
  factorX2(),
  growth(),
  // 10 (NC Math 2)
  rationalResults(true),
  rationalResults(false),
  eqRule({ id: "m2-eq4", grade: "10", standard: "NC.M2.N-RN.2", skill: "Rational exponents", target: 4, labels: M2_EQ4,
    hint: "a^(m/n) = (ⁿ√a)^m. Root first, then power." }),
  solveRule({ id: "m2-x4", grade: "10", standard: "NC.M2.A-REI.4", skill: "Solve quadratic equations", x: 4, labels: M2_X4,
    hint: "Put 4 in for x. Are both sides equal?" }),
  // 11 (NC Math 3)
  rootAt1(),
  evenFns(),
  eqRule({ id: "m3-log3", grade: "11", standard: "NC.M3.F-LE.4", skill: "Logarithms", target: 3, labels: M3_LOG3,
    hint: "log base b of x = 3 means b³ = x." }),
  // 12 (NC Math 4)
  eqRule({ id: "m4-log2", grade: "12", standard: "NC.M4.AF.3.1", skill: "Exponential and logarithmic forms", target: 2, labels: M4_LOG2,
    hint: "log base b of x = 2 means b² = x." }),
  powersOfI(),
  eqRule({ id: "m4-half", grade: "12", standard: "NC.M3.F-TF.2", skill: "Unit circle values", target: 0.5, targetText: "1/2", labels: M4_HALF,
    hint: "Use reference angles: sin 30° = cos 60° = 1/2." }),
];
