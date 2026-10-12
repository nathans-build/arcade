/*
 * Cipher Pursuit's own question generators: driving word problems that use the car's speed
 * and fuel, rates and ratios, linear equations, shift ciphers, and early-reader code words.
 * Every generator returns a kit `Question` (correct answer first, index 0; the source shuffles)
 * with a `meta` record of its inputs, so scripts/check-rules.ts can recompute the answer.
 *
 * Pure TypeScript (no DOM, no Vite), so the checker can run it with tsx.
 */
import type { Grade, Question } from "../kit/types";
import { decode, encode, letterSteps, mod, shiftLetter, CODE_WORDS, EASY_CODE_WORDS, ALPHABET } from "./cipher";

export type Rand = () => number;

/** What the car is doing when a checkpoint question is written. */
export interface DriveCtx {
  /** The car's speed on the speedometer. */
  mph: number;
  /** Fuel left, 0-100 (%). */
  fuelPct: number;
}

export type Meta =
  | { kind: "drt"; speed: number; hours: number; minutes?: number }
  | { kind: "rate"; dist: number; hours: number }
  | { kind: "ratio"; a: number; b: number; given: number }
  | { kind: "pctof"; pct: number; whole: number }
  | { kind: "pctchange"; base: number; pct: number; up: boolean }
  | { kind: "fracrate"; mn: number; md: number; tn: number; td: number }
  | { kind: "mpg"; mpg: number; gal: number }
  | { kind: "slope"; t1: number; d1: number; t2: number; d2: number }
  | { kind: "chase"; gap: number; fast: number; slow: number }
  | { kind: "lineq"; a: number; b: number; c: number }
  | { kind: "lineparam"; m: number; b: number; ask: "speed" | "start" }
  | { kind: "cipher"; mode: "decode" | "encode"; shift: number; input: string }
  | { kind: "cipher-letter"; shift: number; letter: string }
  | { kind: "cipher-shift"; plain: string; coded: string }
  | { kind: "arith"; op: "+" | "-" | "×" | "÷"; a: number; b: number }
  | { kind: "next"; seq: number[]; step: number }
  | { kind: "sight"; target: string; sentence?: string }
  | { kind: "vocab"; word: string }
  | { kind: "kit" };

export type Family =
  | "drt" | "rate" | "ratio" | "pctof" | "pctchange" | "fracrate" | "mpg" | "slope" | "rateTable" | "chase"
  | "lineq" | "lineParam" | "avgRate" | "cipherDecode" | "cipherEncode" | "cipherLetter" | "cipherShift"
  | "addSub" | "countNext" | "sightMatch" | "sightSentence" | "multFact" | "multWord" | "bigMult" | "vocab"
  | "kitMath" | "kitEla";

export interface CPQuestion extends Question {
  family: Family;
  meta: Meta;
}

export interface GenCtx {
  grade: Grade;
  /** 0 for K, 1-12 otherwise. */
  n: number;
  r: Rand;
  drive: DriveCtx;
}

export type Generator = (c: GenCtx) => CPQuestion | null;

/* ------------------------------------------------------------------ helpers */

export const ri = (r: Rand, a: number, b: number) => a + Math.floor(r() * (b - a + 1));
export const pickR = <T,>(r: Rand, arr: readonly T[]): T => arr[Math.floor(r() * arr.length)];

/** Up to 2 decimals, a real minus sign, commas from 10,000. */
export function fmt(n: number): string {
  const v = Math.round(Math.abs(n) * 100) / 100;
  let [int, dec] = String(v).split(".");
  if (v >= 10000) int = int.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return (n < 0 && v !== 0 ? "−" : "") + int + (dec ? `.${dec}` : "");
}

/** Reads a number back out of a choice like "150 miles", "x = −4" or "62.5 mph". */
export function parseNum(s: string): number {
  const m = s.replace(/,/g, "").replace(/−/g, "-").match(/-?\d+(\.\d+)?/);
  return m ? Number(m[0]) : NaN;
}

function gcd(a: number, b: number): number {
  return b === 0 ? Math.abs(a) : gcd(b, a % b);
}
export function frac(n: number, d: number): string {
  const g = gcd(n, d);
  const [a, b] = [n / g, d / g];
  return b === 1 ? String(a) : `${a}/${b}`;
}

const hours = (t: number) => `${fmt(t)} ${t === 1 ? "hour" : "hours"}`;

let counter = 0;

/** Builds the question with the right answer first; null when 4 different choices can't be made. */
function make(
  c: GenCtx,
  family: Family,
  standard: string,
  skill: string,
  prompt: string,
  correct: string,
  wrong: (string | null | undefined)[],
  explanation: string,
  meta: Meta,
  pad?: () => string,
): CPQuestion | null {
  const choices = [correct.trim()];
  const add = (w: string | null | undefined) => {
    const t = w?.trim();
    if (t && choices.length < 4 && !choices.includes(t)) choices.push(t);
  };
  wrong.forEach(add);
  for (let i = 0; choices.length < 4 && pad && i < 40; i++) add(pad());
  if (choices.length < 4) return null;
  return {
    id: `cp-${family}-g${c.grade.toLowerCase()}-${++counter}`,
    subject: family.startsWith("sight") || family === "vocab" ? "ela" : "math",
    grade: c.grade,
    standard,
    skill,
    prompt,
    choices: choices as Question["choices"],
    answer: 0,
    explanation,
    quick: true,
    family,
    meta,
  };
}

/** Nearest allowed value to `v`. */
function snap(v: number, allowed: readonly number[]): number {
  let best = allowed[0];
  for (const a of allowed) if (Math.abs(a - v) < Math.abs(best - v)) best = a;
  return best;
}

/** Speed for a word problem: close to the car's real speed, from a grade-friendly list. */
function carSpeed(c: GenCtx, allowed: readonly number[]): number {
  const s = snap(c.drive.mph, allowed);
  // A little variety so every checkpoint at the same speed isn't the same problem.
  if (c.r() < 0.3) return pickR(c.r, allowed);
  return s;
}

const near = (v: number, unit: string, step: number, r: Rand) => () => `${fmt(Math.max(1, v + step * ri(r, -4, 4)))}${unit}`;

/* ------------------------------------------------------------------ driving math (grades 4-8) */

export const drt: Generator = (c) => {
  const { n, r } = c;
  if (n <= 4) {
    const s = carSpeed(c, [30, 40, 45, 50, 55, 60, 65, 70]);
    const t = ri(r, 2, 5);
    const d = s * t;
    return make(c, "drt", "NC.4.NBT.5", "Speed × time", `You're going ${s} mph. How far do you go in ${t} hours?`, `${d} miles`,
      [`${s * (t + 1)} miles`, `${s * (t - 1)} miles`, `${s + t} miles`],
      `Distance = speed × time. ${s} miles each hour for ${t} hours: ${s} × ${t} = ${d} miles.`,
      { kind: "drt", speed: s, hours: t }, near(d, " miles", 10, r));
  }
  if (n === 7) {
    const s = carSpeed(c, [40, 48, 60, 72, 80]);
    const m = pickR(r, [15, 30, 45, 90]);
    const h = m / 60;
    const d = s * h;
    return make(c, "drt", "NC.7.RP.2", "Distance = rate × time", `You're going ${s} mph. How far do you go in ${m} minutes?`, `${fmt(d)} miles`,
      [`${s * m} miles`, `${fmt(s / h)} miles`, `${fmt(d + s / 4)} miles`],
      `${m} minutes is ${m}/60 = ${fmt(h)} of an hour. Distance = rate × time: ${s} × ${fmt(h)} = ${fmt(d)} miles.`,
      { kind: "drt", speed: s, hours: h, minutes: m }, near(d, " miles", 3, r));
  }
  const s = carSpeed(c, n === 5 ? [30, 40, 50, 60, 70, 80] : [40, 50, 60, 70, 80]);
  const t = pickR(r, n === 5 ? [0.5, 1.5, 2.5, 3.5] : [1.5, 2, 2.5, 3, 4]);
  const d = s * t;
  const std = n === 5 ? "NC.5.NBT.7" : "NC.6.RP.3";
  const skill = n === 5 ? "Decimal × whole number" : "Distance = speed × time";
  return make(c, "drt", std, skill, `You're going ${s} mph. How far do you go in ${hours(t)}?`, `${fmt(d)} miles`,
    [`${fmt(s * Math.floor(t))} miles`, `${fmt(s + t)} miles`, `${fmt(s * (t + 1))} miles`, `${fmt(s / t)} miles`],
    `Distance = speed × time: ${s} × ${fmt(t)} = ${fmt(d)}. In ${hours(t)} you go ${fmt(d)} miles.`,
    { kind: "drt", speed: s, hours: t }, near(d, " miles", 5, r));
};

export const rate: Generator = (c) => {
  const s = pickR(c.r, [30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80]);
  const t = ri(c.r, 2, 5);
  const d = s * t;
  return make(c, "rate", "NC.6.RP.3", "Unit rate (speed)", `You drove ${d} miles in ${t} hours. How many miles per hour is that?`, `${s} mph`,
    [`${d * t} mph`, `${d - t} mph`, `${s + 10} mph`],
    `A unit rate is the amount for 1 hour: ${d} ÷ ${t} = ${s}. That's ${s} miles per hour.`,
    { kind: "rate", dist: d, hours: t }, near(s, " mph", 5, c.r));
};

export const ratio: Generator = (c) => {
  const { r } = c;
  const a = ri(r, 1, 4);
  let b = ri(r, 2, 5);
  if (b === a) b = a + 1;
  const k = ri(r, 2, 5);
  const given = a * k;
  const ans = b * k;
  return make(c, "ratio", "NC.6.RP.3", "Equivalent ratios", `The van brings ${a} shields for every ${b} turbos. ${given} shields means how many turbos?`, `${ans} turbos`,
    [`${given + (b - a)} turbos`, `${ans + b} turbos`, `${given * b} turbos`, `${ans - b} turbos`],
    `${a} shields : ${b} turbos. ${given} shields is ${a} × ${k}, so multiply the turbos by ${k} too: ${b} × ${k} = ${ans}.`,
    { kind: "ratio", a, b, given }, near(ans, " turbos", 1, r));
};

export const pctof: Generator = (c) => {
  const { r } = c;
  const whole = pickR(r, [20, 40]);
  const pct = Math.min(90, Math.max(10, Math.round(c.drive.fuelPct / 5) * 5));
  const v = (whole * pct) / 100;
  return make(c, "pctof", "NC.6.RP.3", "Percent of a quantity", `Your tank holds ${whole} gallons. The fuel gauge reads ${pct}%. How many gallons are left?`, `${fmt(v)} gal`,
    [`${pct} gal`, `${fmt(whole - v)} gal`, `${fmt(v * 2)} gal`, `${fmt(v + 1)} gal`],
    `${pct}% means ${pct} out of 100, so ${pct}% of ${whole} = ${pct / 100} × ${whole} = ${fmt(v)} gallons.`,
    { kind: "pctof", pct, whole }, near(v, " gal", 1, r));
};

export const pctchange: Generator = (c) => {
  const { r } = c;
  const base = pickR(r, [40, 50, 60, 80]);
  const pct = pickR(r, [10, 20, 25, 50]);
  const up = r() < 0.6;
  const change = (base * pct) / 100;
  const ans = up ? base + change : base - change;
  const prompt = up
    ? `You're going ${base} mph. Turbo boosts your speed by ${pct}%. What is your new speed?`
    : `You're going ${base} mph. An oil slick slows you down ${pct}%. What is your new speed?`;
  return make(c, "pctchange", "NC.7.RP.3", "Percent increase and decrease", prompt, `${fmt(ans)} mph`,
    [`${fmt(up ? base + pct : base - pct)} mph`, `${fmt(change)} mph`, `${fmt(up ? base - change : base + change)} mph`],
    `${pct}% of ${base} is ${fmt(change)}. ${up ? "Add" : "Subtract"} it: ${base} ${up ? "+" : "−"} ${fmt(change)} = ${fmt(ans)} mph.`,
    { kind: "pctchange", base, pct, up }, near(ans, " mph", 5, r));
};

const FRAC_RATES: [number, number, number, number][] = [
  [1, 2, 1, 4], [3, 4, 1, 4], [1, 2, 1, 6], [2, 3, 1, 3], [3, 4, 1, 2], [1, 3, 1, 6], [2, 5, 1, 10], [3, 8, 1, 8], [1, 2, 1, 8], [3, 4, 1, 8], [2, 3, 1, 6],
];
export const fracrate: Generator = (c) => {
  const [mn, md, tn, td] = pickR(c.r, FRAC_RATES);
  const rateV = (mn / md) / (tn / td);
  return make(c, "fracrate", "NC.7.RP.1", "Unit rates with fractions", `The boat goes ${mn}/${md} mile in ${tn}/${td} hour. What is its speed in miles per hour?`, `${fmt(rateV)} mph`,
    [`${frac(mn * tn, md * td)} mph`, `${frac(tn * md, td * mn)} mph`, `${fmt(rateV + 1)} mph`, `${fmt(rateV * 2)} mph`],
    `Divide miles by hours: ${mn}/${md} ÷ ${tn}/${td} = ${mn}/${md} × ${td}/${tn} = ${fmt(rateV)}. That's ${fmt(rateV)} miles in 1 hour.`,
    { kind: "fracrate", mn, md, tn, td }, near(rateV, " mph", 1, c.r));
};

export const mpg: Generator = (c) => {
  const m = pickR(c.r, [20, 25, 30, 35, 40]);
  const g = pickR(c.r, [0.5, 1.5, 2.5, 3, 4.5]);
  const d = m * g;
  return make(c, "mpg", "NC.7.RP.2", "Proportional relationships", `Your car gets ${m} miles per gallon. How far can you go on ${fmt(g)} gallons?`, `${fmt(d)} miles`,
    [`${fmt(m + g)} miles`, `${fmt(m / g)} miles`, `${fmt(d + m)} miles`],
    `Miles = miles per gallon × gallons: ${m} × ${fmt(g)} = ${fmt(d)} miles.`,
    { kind: "mpg", mpg: m, gal: g }, near(d, " miles", 5, c.r));
};

export const slope: Generator = (c) => {
  const v = pickR(c.r, [40, 45, 50, 55, 60, 65, 70, 75]);
  const t = ri(c.r, 2, 5);
  const d = v * t;
  return make(c, "slope", "NC.8.EE.5", "Slope as a unit rate", `A distance-time graph (hours, miles) goes from (0, 0) to (${t}, ${d}). What is its slope?`, `${v} mph`,
    [`${d} mph`, `${v + 10} mph`, `${d - v} mph`],
    `Slope = rise ÷ run = ${d} ÷ ${t} = ${v}. On a distance-time graph the slope is the speed: ${v} mph.`,
    { kind: "slope", t1: 0, d1: 0, t2: t, d2: d }, near(v, " mph", 5, c.r));
};

function twoPoints(c: GenCtx) {
  const v = pickR(c.r, [40, 45, 50, 55, 60, 65, 70]);
  const start = pickR(c.r, [10, 20, 30, 40]);
  const t1 = ri(c.r, 1, 3);
  const t2 = t1 + ri(c.r, 1, 3);
  return { v, start, t1, t2, d1: start + v * t1, d2: start + v * t2 };
}

export const rateTable: Generator = (c) => {
  const { v, t1, t2, d1, d2, start } = twoPoints(c);
  return make(c, "rateTable", "NC.8.F.4", "Rate of change", `At hour ${t1} you're at mile ${d1}. At hour ${t2} you're at mile ${d2}. What is the rate of change?`, `${v} mph`,
    [`${d2 - d1} mph`, `${Math.round(d2 / t2)} mph`, `${v + start} mph`, `${Math.round(d1 / t1)} mph`],
    `Rate of change = change in miles ÷ change in hours = (${d2} − ${d1}) ÷ (${t2} − ${t1}) = ${d2 - d1} ÷ ${t2 - t1} = ${v} mph.`,
    { kind: "slope", t1, d1, t2, d2 }, near(v, " mph", 5, c.r));
};

export const avgRate: Generator = (c) => {
  const { v, t1, t2, d1, d2 } = twoPoints(c);
  return make(c, "avgRate", "NC.M1.F-IF.6", "Average rate of change", `At t = ${t1} h you're at ${d1} mi. At t = ${t2} h you're at ${d2} mi. Average speed?`, `${v} mph`,
    [`${Math.round(d2 / t2)} mph`, `${d2 - d1} mph`, `${Math.round(d1 / t1)} mph`],
    `Average rate of change = (${d2} − ${d1}) ÷ (${t2} − ${t1}) = ${d2 - d1} ÷ ${t2 - t1} = ${v} miles per hour.`,
    { kind: "slope", t1, d1, t2, d2 }, near(v, " mph", 5, c.r));
};

export const chase: Generator = (c) => {
  const slow = pickR(c.r, [40, 45, 50, 55]);
  const diff = pickR(c.r, [5, 10, 15, 20]);
  const t = ri(c.r, 1, 4);
  const gap = diff * t;
  const fast = slow + diff;
  return make(c, "chase", "NC.8.EE.7", "Solve linear equations", `A Smudge van is ${gap} miles ahead going ${slow} mph. You go ${fast} mph. Hours to catch it?`, hours(t),
    [hours(t + 1), hours(t * 2), t > 1 ? hours(t - 1) : hours(t + 2), hours(t + 3)],
    `Write ${fast}t = ${slow}t + ${gap}. Subtract ${slow}t: ${diff}t = ${gap}, so t = ${t}. You close the gap ${diff} miles every hour.`,
    { kind: "chase", gap, fast, slow }, () => hours(ri(c.r, 1, 8)));
};

/* ------------------------------------------------------------------ high school algebra */

const signed = (b: number) => (b < 0 ? `− ${fmt(-b)}` : `+ ${fmt(b)}`);

export const lineq: Generator = (c) => {
  const { r } = c;
  const a = ri(r, 2, 9);
  let x = ri(r, -6, 12);
  if (x === 0) x = 3;
  let b = ri(r, -20, 20);
  if (b === 0) b = 7;
  const cc = a * x + b;
  const undo = b > 0 ? `Subtract ${b} from both sides` : `Add ${-b} to both sides`;
  return make(c, "lineq", "NC.M1.A-REI.3", "Solve linear equations", `Crack the lock code: solve ${a}x ${signed(b)} = ${fmt(cc)}`, `x = ${fmt(x)}`,
    [`x = ${fmt((cc + b) / a)}`, `x = ${fmt(x + 1)}`, `x = ${fmt(cc - b)}`, `x = ${fmt(x - 1)}`],
    `${undo}: ${a}x = ${fmt(cc - b)}. Then divide by ${a}: x = ${fmt(x)}.`,
    { kind: "lineq", a, b, c: cc }, () => `x = ${fmt(x + ri(r, -6, 6))}`);
};

export const lineParam: Generator = (c) => {
  const m = pickR(c.r, [45, 50, 55, 60, 65, 70, 75]);
  const b = pickR(c.r, [10, 15, 20, 25, 30, 35, 40]);
  if (c.r() < 0.6) {
    return make(c, "lineParam", "NC.M1.F-LE.5", "Slope as speed", `Your distance is d = ${m}t + ${b} (miles, t in hours). What is your speed?`, `${m} mph`,
      [`${b} mph`, `${m + b} mph`, `${m - b} mph`],
      `In d = mt + b the slope m is the rate of change. Distance grows ${m} miles every hour, so your speed is ${m} mph.`,
      { kind: "lineparam", m, b, ask: "speed" }, near(m, " mph", 5, c.r));
  }
  return make(c, "lineParam", "NC.M1.F-LE.5", "Interpret a linear model", `Your distance is d = ${m}t + ${b} (miles, t in hours). What does ${b} mean?`, "starting miles",
    ["speed", "hours driven", "fuel left"],
    `At t = 0, d = ${b}. So ${b} is where you started: ${b} miles before the clock began. ${m} is the speed.`,
    { kind: "lineparam", m, b, ask: "start" });
};

/* ------------------------------------------------------------------ shift ciphers */

/** Shift cipher items: tagged with NC Math 1 function evaluation (a letter rule applied to inputs). */
const CIPHER_STD = "NC.M1.F-IF.2";

/**
 * Grades 3-8 only meet ciphers in Focus: Secret codes, as easy codes (shift 1-3, short familiar
 * words, A-Z strip on screen), tagged with the grade's patterns / rules standard.
 */
const EASY_CIPHER_STD: Record<number, string> = {
  3: "NC.3.OA.9", 4: "NC.4.OA.5", 5: "NC.5.OA.3", 6: "NC.6.EE.9", 7: "NC.6.EE.9", 8: "NC.8.F.1",
};
const easyCodes = (c: GenCtx) => c.n <= 8;
const cipherStd = (c: GenCtx) => (easyCodes(c) ? EASY_CIPHER_STD[Math.max(3, c.n)] : CIPHER_STD);

function shiftFor(c: GenCtx): number {
  if (c.n <= 4) return ri(c.r, 1, 2);
  if (c.n <= 9) return ri(c.r, 1, 3);
  if (c.n === 10) return ri(c.r, 1, 5);
  return ri(c.r, 2, 9);
}
function codeWord(c: GenCtx): string {
  if (easyCodes(c)) return pickR(c.r, EASY_CODE_WORDS);
  const max = c.n <= 9 ? 5 : 7;
  const pool = CODE_WORDS.filter((w) => w.length >= 3 && w.length <= max);
  return pickR(c.r, pool);
}

export const cipherDecode: Generator = (c) => {
  const k = shiftFor(c);
  const plain = codeWord(c);
  const coded = encode(plain, k);
  return make(c, "cipherDecode", cipherStd(c), "Shift cipher: decode", `Decode the message. Move each letter back ${k}: ${coded}`, plain,
    [decode(coded, k > 1 ? k - 1 : k + 2), decode(coded, k + 1), encode(coded, k)],
    `Move each letter ${k} back in the alphabet: ${letterSteps(coded, plain)}. The message is ${plain}.`,
    { kind: "cipher", mode: "decode", shift: k, input: coded });
};

export const cipherEncode: Generator = (c) => {
  const k = shiftFor(c);
  const plain = codeWord(c);
  const coded = encode(plain, k);
  return make(c, "cipherEncode", cipherStd(c), "Shift cipher: encode", `Code the word. Move each letter forward ${k}: ${plain}`, coded,
    [encode(plain, k > 1 ? k - 1 : k + 2), encode(plain, k + 1), decode(plain, k)],
    `Move each letter ${k} forward, wrapping Z back to A: ${letterSteps(plain, coded)}. The code is ${coded}.`,
    { kind: "cipher", mode: "encode", shift: k, input: plain });
};

export const cipherLetter: Generator = (c) => {
  const easy = easyCodes(c);
  const k = easy ? shiftFor(c) : ri(c.r, 2, 6);
  // Easy codes: grades 3-5 never wrap past Z; 6-8 sometimes do. Harder codes always wrap.
  const letters = easy ? [...ALPHABET].slice(0, c.n <= 5 ? 26 - k : 26) : ["U", "V", "W", "X", "Y", "Z"];
  const letter = pickR(c.r, letters);
  const ans = shiftLetter(letter, k);
  const wraps = ALPHABET.indexOf(letter) + k > 25;
  const steps = [...Array(k)].map((_, i) => shiftLetter(letter, i + 1)).join(", ");
  const rule = wraps || !easy ? `move each letter forward ${k}, wrapping Z to A` : `move each letter forward ${k}`;
  return make(c, "cipherLetter", cipherStd(c), easy && !wraps ? "Shift cipher: one letter" : "Shift cipher: wraparound", `Code rule: ${rule}. What does ${letter} become?`, ans,
    [shiftLetter(letter, k - 1), shiftLetter(letter, k + 1), shiftLetter(letter, -k)],
    easy && !wraps
      ? `Count forward ${k} from ${letter}: ${steps}. So ${letter} becomes ${ans}.`
      : `Count forward ${k} from ${letter}: ${steps}. After Z the alphabet starts again at A, so ${letter} becomes ${ans}.`,
    { kind: "cipher-letter", shift: k, letter });
};

export const cipherShift: Generator = (c) => {
  const k = shiftFor(c);
  const plain = codeWord(c);
  const coded = encode(plain, k);
  const d = mod(ALPHABET.indexOf(coded[0]) - ALPHABET.indexOf(plain[0]), 26);
  return make(c, "cipherShift", cipherStd(c), "Shift cipher: find the key", `${plain} was coded as ${coded}. What was the shift?`, `+${d}`,
    [`+${d + 1}`, d > 1 ? `+${d - 1}` : `+${d + 2}`, `−${d}`],
    `${plain[0]} moved to ${coded[0]}: that's ${d} letters forward. Every letter moves the same amount, so the key is +${d}.`,
    { kind: "cipher-shift", plain, coded });
};

/* ------------------------------------------------------------------ K-5 number work */

export const addSub: Generator = (c) => {
  const { n, r } = c;
  const max = n === 0 ? 10 : n === 1 ? 20 : 100;
  const std = n === 0 ? "NC.K.OA.2" : n === 1 ? "NC.1.OA.1" : "NC.2.OA.1";
  const add = r() < 0.5;
  let a: number;
  let b: number;
  if (add) {
    a = ri(r, n === 2 ? 12 : 1, max - (n === 2 ? 12 : 1));
    b = ri(r, 1, Math.min(n === 2 ? 40 : 9, max - a));
  } else {
    a = ri(r, n === 0 ? 3 : n === 1 ? 8 : 25, max);
    b = ri(r, 1, Math.min(a - 1, n === 2 ? 40 : 9));
  }
  const ans = add ? a + b : a - b;
  const prompt = add
    ? pickR(r, [
        `You splat ${a} Smudge cars, then ${b} more. How many in all?`,
        `The van has ${a} gadgets. It gets ${b} more. How many now?`,
        `You drive ${a} miles, then ${b} more miles. How many miles in all?`,
      ])
    : pickR(r, [
        `You have ${a} foam shots. You use ${b}. How many are left?`,
        `${a} Smudge cars drive up. ${b} drive away. How many are left?`,
        `The tank has ${a} cans of fuel. You use ${b}. How many are left?`,
      ]);
  return make(c, "addSub", std, add ? "Addition word problems" : "Subtraction word problems", prompt, String(ans),
    [String(add ? a - b : a + b), String(ans + 1), String(Math.max(0, ans - 1)), String(ans + 2), String(ans + 10)],
    add ? `Put them together: ${a} + ${b} = ${ans}.` : `Take ${b} away from ${a}: ${a} − ${b} = ${ans}.`,
    { kind: "arith", op: add ? "+" : "-", a, b });
};

export const countNext: Generator = (c) => {
  const { n, r } = c;
  let step = 1;
  let start: number;
  let std: string;
  let lead: string;
  if (n === 0) {
    if (r() < 0.5) {
      start = ri(r, 1, 16);
      std = "NC.K.CC.2";
      lead = "What number comes next?";
    } else {
      step = 10;
      start = 10 * ri(r, 1, 6);
      std = "NC.K.CC.1";
      lead = "Count by 10s. What comes next?";
    }
  } else if (n === 1) {
    start = ri(r, 88, 116);
    std = "NC.1.NBT.1";
    lead = "What number comes next?";
  } else {
    step = pickR(r, [5, 10, 100]);
    start = step === 100 ? 100 * ri(r, 1, 6) : step * ri(r, 2, 15);
    std = "NC.2.NBT.2";
    lead = `Count by ${step}s. What comes next?`;
  }
  const seq = [start, start + step, start + 2 * step];
  const next = start + 3 * step;
  return make(c, "countNext", std, step === 1 ? "Counting forward" : "Skip-counting", `${lead} ${seq.join(", ")}, __`, String(next),
    [String(next + step), String(next + 1 === next + step ? next + 2 : next + 1), String(seq[2]), String(next - 1)],
    `Each number is ${step} more than the one before: ${seq[2]} + ${step} = ${next}.`,
    { kind: "next", seq, step }, () => String(next + step * ri(r, -2, 3) + ri(r, -1, 1)));
};

export const multFact: Generator = (c) => {
  const a = ri(c.r, 2, 9);
  const b = ri(c.r, 2, 10);
  const p = a * b;
  return make(c, "multFact", "NC.3.OA.7", "Multiplication facts", `Code number: ${a} × ${b} = ?`, String(p),
    [String(a * (b + 1)), String((a - 1) * b), String(a + b), String(p + 2)],
    `${a} × ${b} means ${a} groups of ${b}: ${p}. Tip: ${a} × ${b} = ${b} × ${a}.`,
    { kind: "arith", op: "×", a, b }, near(p, "", 1, c.r));
};

export const multWord: Generator = (c) => {
  const { r } = c;
  const a = ri(r, 2, 9);
  const b = ri(r, 2, 9);
  const p = a * b;
  if (r() < 0.65) {
    const prompt = pickR(r, [
      `${a} Smudge cars each leave ${b} goo blobs. How many goo blobs in all?`,
      `The van has ${a} boxes with ${b} gadgets in each. How many gadgets?`,
      `You drive ${b} miles each day for ${a} days. How many miles?`,
    ]);
    return make(c, "multWord", "NC.3.OA.3", "Multiplication word problems", prompt, String(p),
      [String(a + b), String(p + a), String(p - b), String(p + b)],
      `${a} equal groups of ${b}: ${a} × ${b} = ${p}.`, { kind: "arith", op: "×", a, b }, near(p, "", 2, r));
  }
  return make(c, "multWord", "NC.3.OA.3", "Division word problems", `${p} foam shots are shared by ${a} agents equally. How many each?`, String(b),
    [String(p - a), String(b + 1), String(b - 1 > 0 ? b - 1 : b + 2), String(a)],
    `Share ${p} into ${a} equal groups: ${p} ÷ ${a} = ${b}, because ${a} × ${b} = ${p}.`, { kind: "arith", op: "÷", a: p, b: a }, near(b, "", 1, r));
};

export const bigMult: Generator = (c) => {
  const a = pickR(c.r, [115, 125, 140, 175, 205, 230, 245, 312]);
  const b = ri(c.r, 11, 19);
  const p = a * b;
  return make(c, "bigMult", "NC.5.NBT.5", "Multi-digit multiplication", `The van drives ${a} miles a day for ${b} days. How many miles in all?`, fmt(p),
    [fmt(a * (b - 10) + a * 1), fmt(p + a), fmt(a + b), fmt(p - 10)],
    `${a} × ${b} = ${a} × 10 + ${a} × ${b - 10} = ${a * 10} + ${a * (b - 10)} = ${fmt(p)} miles.`,
    { kind: "arith", op: "×", a, b }, () => fmt(p + 10 * ri(c.r, -9, 9)));
};

/* ------------------------------------------------------------------ early reading: code words */

/** Sight words with look-alike words (no sound-alike words, since K-2 hear the prompt read aloud). */
export const SIGHT_SETS: Record<"K" | "1", [string, string, string, string][]> = {
  K: [
    ["the", "then", "they", "she"], ["and", "an", "end", "hand"], ["is", "it", "in", "his"], ["you", "your", "yes", "out"],
    ["look", "book", "lock", "like"], ["play", "pay", "plan", "lay"], ["see", "set", "seed", "bee"], ["can", "cat", "man", "car"],
    ["we", "me", "wet", "he"], ["go", "got", "so", "no"], ["like", "lake", "look", "bike"], ["my", "me", "by", "may"],
    ["come", "came", "cone", "home"], ["big", "bag", "dig", "pig"], ["up", "us", "pup", "cup"], ["down", "dawn", "town", "done"],
    ["jump", "bump", "jam", "just"], ["run", "ran", "sun", "rug"], ["red", "rod", "bed", "rid"], ["little", "lift", "litter", "kettle"],
  ],
  "1": [
    ["said", "sad", "sand", "side"], ["they", "then", "the", "them"], ["was", "saw", "has", "wash"], ["what", "that", "want", "when"],
    ["where", "were", "there", "here"], ["have", "hive", "gave", "had"], ["from", "form", "frog", "for"], ["could", "cold", "cloud", "would"],
    ["when", "then", "what", "went"], ["there", "three", "these", "where"], ["of", "off", "on", "if"], ["some", "same", "come", "home"],
    ["who", "how", "why", "hot"], ["one", "on", "own", "once"], ["put", "but", "pot", "pat"], ["again", "against", "gain", "agent"],
  ],
};

/** Fill-in sentences: only the first word fits the sentence. */
export const SIGHT_SENTENCES: Record<"1" | "2", [string, string, string, string, string][]> = {
  "1": [
    ["The spy ___ a red car.", "has", "of", "them", "from"],
    ["___ is my van.", "This", "Said", "Them", "Of"],
    ["I can ___ the goo.", "see", "said", "they", "from"],
    ["We ___ to the lake.", "went", "they", "from", "of"],
    ["Look ___ that boat!", "at", "is", "he", "said"],
    ["The car is ___ fast!", "so", "of", "the", "said"],
    ["Where ___ the van go?", "did", "is", "of", "an"],
    ["They ___ in the boat.", "are", "of", "has", "she"],
    ["Can you ___ me?", "help", "said", "of", "was"],
    ["I ___ the secret code!", "have", "of", "they", "were"],
    ["___ are you going?", "Where", "Said", "Of", "Has"],
    ["The goo is ___ the road.", "on", "said", "they", "have"],
  ],
  "2": [
    ["The van ___ fast on the bridge.", "goes", "their", "which", "those"],
    ["Turn ___ at the big tree.", "left", "these", "does", "been"],
    ["The agent ___ the secret map.", "found", "those", "very", "would"],
    ["I ___ wear my seat belt.", "always", "those", "which", "these"],
    ["___ cars are fast.", "These", "Does", "Been", "Upon"],
    ["Please ___ the van now.", "call", "very", "been", "its"],
    ["She ___ her name on the map.", "wrote", "many", "first", "these"],
    ["We sat ___ the campfire.", "around", "does", "been", "those"],
    ["___ did the Smudge car stop?", "Why", "Been", "Its", "Very"],
    ["Wash your hands ___ you eat.", "before", "those", "very", "green"],
    ["The boat is ___ fast!", "very", "been", "does", "upon"],
    ["The agent ___ the code first.", "read", "been", "those", "upon"],
    ["Do you know ___ way to go?", "which", "been", "does", "upon"],
    ["___ you help me find the key?", "Would", "Been", "Those", "Upon"],
  ],
};

export const sightMatch: Generator = (c) => {
  const set = pickR(c.r, SIGHT_SETS[c.n === 0 ? "K" : "1"]);
  const [target, ...wrong] = set;
  return make(c, "sightMatch", `RF.${c.n === 0 ? "K" : c.n}.4`, "Sight words", `Find the code word: "${target}"`, target, wrong,
    `The code word is "${target}": ${[...target].join("-")}. Look at every letter, not just the first one!`,
    { kind: "sight", target });
};

export const sightSentence: Generator = (c) => {
  const [sentence, target, ...wrong] = pickR(c.r, SIGHT_SENTENCES[c.n <= 1 ? "1" : "2"]);
  const full = sentence.replace("___", target);
  return make(c, "sightSentence", `RF.${Math.max(1, c.n)}.4`, "Sight words in a sentence", `Fill in the code word: ${sentence}`, target, wrong,
    `"${full}" makes sense, so the code word is "${target}".`,
    { kind: "sight", target, sentence });
};

/* ------------------------------------------------------------------ grades 3-5: context clues */

/** [grade, sentence with the WORD in capitals, WORD, meaning, 3 wrong meanings] */
export const VOCAB: [3 | 4 | 5, string, string, string, string, string, string][] = [
  [3, "The road was so NARROW that only one car could fit.", "NARROW", "not wide", "very long", "bumpy", "crowded"],
  [3, "The agent was FURIOUS when goo hit her car. She stomped and yelled.", "FURIOUS", "very angry", "very happy", "sleepy", "quiet"],
  [3, "The van was so ENORMOUS it blocked both lanes.", "ENORMOUS", "very big", "very small", "very fast", "shiny"],
  [3, "Rain made the road SLICK, so the cars slid around.", "SLICK", "slippery", "dry", "bumpy", "dusty"],
  [3, "The car ZOOMED past the trucks in a flash.", "ZOOMED", "moved fast", "stopped", "moved slowly", "turned back"],
  [3, "The map was TATTERED, full of rips and holes.", "TATTERED", "torn up", "brand new", "folded", "colorful"],
  [3, "The gadget is FRAGILE, so hold it gently or it will break.", "FRAGILE", "easy to break", "very heavy", "very loud", "hard to find"],
  [3, "With no motor, the boat DRIFTED slowly down the river.", "DRIFTED", "floated", "sank", "raced", "flew"],
  [4, "The Smudge cars were RELENTLESS. They never stopped chasing.", "RELENTLESS", "nonstop", "lazy", "friendly", "careful"],
  [4, "Fog hid the road, so the agent drove CAUTIOUSLY.", "CAUTIOUSLY", "carefully", "wildly", "quickly", "loudly"],
  [4, "The message was BAFFLING. Nobody could figure it out.", "BAFFLING", "confusing", "simple", "funny", "boring"],
  [4, "The van was CRAMMED with gadgets, with no room left.", "CRAMMED", "packed full", "empty", "painted", "broken"],
  [4, "The tunnel was so DIM that the agent turned on the headlights.", "DIM", "dark", "bright", "wet", "short"],
  [4, "The foam is HARMLESS. It only makes the cars sticky.", "HARMLESS", "not dangerous", "very sharp", "poisonous", "expensive"],
  [4, "The boat glided over the TRANQUIL lake. The water was calm and still.", "TRANQUIL", "peaceful", "stormy", "frozen", "muddy"],
  [4, "Goo was SCATTERED all over the road in little blobs.", "SCATTERED", "spread out", "cleaned up", "piled up", "frozen"],
  [5, "The agent stayed VIGILANT, checking the mirrors every second.", "VIGILANT", "watchful", "sleepy", "careless", "angry"],
  [5, "The Smudge Gang's plan was FUTILE. Every trick failed.", "FUTILE", "useless", "clever", "secret", "costly"],
  [5, "The road was TREACHEROUS, full of ice and sharp turns.", "TREACHEROUS", "dangerous", "safe", "boring", "crowded"],
  [5, "The radio signal was INTERMITTENT, cutting in and out.", "INTERMITTENT", "on and off", "very loud", "constant", "silent"],
  [5, "The spy gave a CONCISE report, short and to the point.", "CONCISE", "brief", "long", "funny", "confusing"],
  [5, "The agent was RELUCTANT to enter the dark tunnel and slowed down.", "RELUCTANT", "unwilling", "eager", "excited", "lost"],
  [5, "The goo was VISCOUS. It oozed slowly like thick syrup.", "VISCOUS", "thick", "watery", "sparkly", "icy"],
  [5, "Cracking the code was ARDUOUS and took hours of hard work.", "ARDUOUS", "difficult", "easy", "quick", "fun"],
];

export const vocab: Generator = (c) => {
  const g = Math.min(5, Math.max(3, c.n)) as 3 | 4 | 5;
  const [, sentence, word, meaning, ...wrong] = pickR(c.r, VOCAB.filter((v) => v[0] === g));
  return make(c, "vocab", `L.${g}.4`, "Context clues", `${sentence} ${word} means:`, meaning, wrong,
    `Use the clues around the word. "${sentence}" tells you ${word.toLowerCase()} means "${meaning}".`,
    { kind: "vocab", word });
};
