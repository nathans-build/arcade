import type { Grade } from "@/kit/types";
import { textWidth } from "./font";

/*
 * Factor Blaster's math: what a rock shows, how it splits when shot, and each level's
 * challenge rule. Pure functions (no DOM), checked by scripts/check-splits.ts.
 *
 *   K-2   number bonds        10 -> 7 + 3              (ones are cores)
 *   3-5   factor pairs        36 -> 4 x 9              (primes are gold cores)
 *   6-8   prime factorization 36 -> 4 x 9 -> 2,2,3,3   (primes are gold cores)
 *   9-12  factoring           x²+5x+6 -> (x+2)(x+3)    (constants, x and linear factors are cores)
 */

export type Band = "k2" | "35" | "68" | "hs";

/** Polynomial with integer coefficients, lowest degree first: [6, 5, 1] is x²+5x+6. */
export type Poly = number[];

export interface RockMath {
  /** What the rock shows. */
  label: string;
  /** Cores can't split: they pop for a bonus and are always safe to shoot. */
  core: boolean;
  /** Integer value (number bands). */
  n: number | null;
  /** Polynomial value (high school). */
  poly: Poly | null;
  /** High school rocks carry their split with them (a factor tree). */
  parts?: [RockMath, RockMath];
}

export interface Split {
  parts: [RockMath, RockMath];
  /** "+" for number bonds, "×" for factor pairs, "" for polynomial factors written side by side. */
  op: "+" | "×" | "";
  /** Worked equation shown where the rock broke, e.g. "36=4×9". */
  note: string;
}

export interface Rule {
  id: string;
  /** Shown in the HUD, e.g. "BLAST MULTIPLES OF 3". */
  text: string;
  /** Short version drawn on the canvas banner (≤ 26 characters). */
  short: string;
  /** Plain words for read-aloud. */
  say: string;
  standard: string;
  skill: string;
  /** True when shooting this (non-core) rock follows the rule. */
  test(m: RockMath): boolean;
  /** Why a shot broke the rule, e.g. "7 IS NOT EVEN". Short enough for the canvas. */
  why(m: RockMath): string;
}

export interface GradeInfo {
  band: Band;
  /** Standard + skill for the splitting itself. */
  standard: string;
  skill: string;
  /** One-line teaser for the title screen. */
  blurb: string;
  /** Example split for the title screen. */
  example: string;
}

/* ----------------------------------------------------------------------------- */

export function rnd(a: number, b: number): number {
  return a + Math.floor(Math.random() * (b - a + 1));
}
function pickOne<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function gradeNum(g: Grade): number {
  return g === "K" ? 0 : Number(g);
}

export function bandOf(g: Grade): Band {
  const n = gradeNum(g);
  if (n <= 2) return "k2";
  if (n <= 5) return "35";
  if (n <= 8) return "68";
  return "hs";
}

export function gradeInfo(g: Grade): GradeInfo {
  const n = gradeNum(g);
  switch (bandOf(g)) {
    case "k2":
      return {
        band: "k2",
        standard: ["NC.K.OA.3", "NC.1.OA.6", "NC.2.OA.2"][n],
        skill: ["Number bonds to 10", "Add & subtract within 20", "Add & subtract within 20"][n],
        blurb: "Rocks split into NUMBER BONDS. Ones just pop!",
        example: n === 0 ? "10 → 7 + 3" : "14 → 10 + 4",
      };
    case "35":
      return {
        band: "35",
        standard: n === 3 ? "NC.3.OA.7" : "NC.4.OA.4",
        skill: n === 3 ? "Multiplication facts" : "Factor pairs, primes & composites",
        blurb: "Rocks split into FACTOR PAIRS. Primes are gold cores!",
        example: "36 → 4 × 9",
      };
    case "68":
      return {
        band: "68",
        standard: "NC.6.NS.4",
        skill: "Prime factorization",
        blurb: "Split rocks all the way to PRIME cores for a combo!",
        example: "36 → 4 × 9 → 2×2×3×3",
      };
    default:
      return {
        band: "hs",
        standard: "NC.M1.A-SSE.3",
        skill: "Factoring quadratic expressions",
        blurb: "Expression rocks split into their FACTORS.",
        example: n >= 11 ? "2x²+7x+3 → (2x+1)(x+3)" : "x²+5x+6 → (x+2)(x+3)",
      };
  }
}

/* ------------------------------ numbers ------------------------------ */

export function isPrime(n: number): boolean {
  if (!Number.isInteger(n) || n < 2) return false;
  for (let d = 2; d * d <= n; d++) if (n % d === 0) return false;
  return true;
}

/** Factor pairs [a, b] with 1 < a ≤ b and a·b = n. */
export function factorPairs(n: number): [number, number][] {
  const out: [number, number][] = [];
  for (let a = 2; a * a <= n; a++) if (n % a === 0) out.push([a, n / a]);
  return out;
}

export function primeFactors(n: number): number[] {
  const out: number[] = [];
  let m = n;
  for (let d = 2; d * d <= m; d++) {
    while (m % d === 0) {
      out.push(d);
      m /= d;
    }
  }
  if (m > 1) out.push(m);
  return out;
}

function gcd(a: number, b: number): number {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) [a, b] = [b, a % b];
  return a;
}

export function numRock(n: number, core: boolean): RockMath {
  return { label: String(n), core, n, poly: null };
}

/** How many times a K-2 rock may still split (big → medium → small, then it pops). */
export const K2_MAX_GEN = 2;

function k2Top(grade: Grade): number {
  const n = gradeNum(grade);
  if (n === 0) return rnd(3, 10);
  if (n === 1) return rnd(5, 15);
  return rnd(8, 20);
}

function numberTop(grade: Grade): number {
  const n = gradeNum(grade);
  if (n === 3) {
    // Multiplication facts within 100.
    return rnd(2, 10) * rnd(2, 10);
  }
  const [lo, hi, minPrimes] =
    n === 4 ? [12, 100, 2] : n === 5 ? [24, 100, 3] : n === 6 ? [12, 100, 3] : n === 7 ? [24, 200, 3] : [48, 360, 4];
  for (;;) {
    const v = rnd(lo, hi);
    if (primeFactors(v).length >= minPrimes) return v;
  }
}

/* ------------------------------ polynomials ------------------------------ */

export function polyMul(a: Poly, b: Poly): Poly {
  const out = new Array(a.length + b.length - 1).fill(0);
  a.forEach((x, i) => b.forEach((y, j) => (out[i + j] += x * y)));
  return trim(out);
}
function trim(p: Poly): Poly {
  const q = [...p];
  while (q.length > 1 && q[q.length - 1] === 0) q.pop();
  return q;
}
export function polyEq(a: Poly, b: Poly): boolean {
  const x = trim(a);
  const y = trim(b);
  return x.length === y.length && x.every((v, i) => v === y[i]);
}
export function polyEval(p: Poly, x: number): number {
  return p.reduce((acc, c, i) => acc + c * x ** i, 0);
}
function degree(p: Poly): number {
  return trim(p).length - 1;
}
function content(p: Poly): number {
  return p.reduce((g, c) => gcd(g, c), 0);
}

const SUP = ["", "", "²", "³"];

/** "x²+5x+6", "2x−1", "x". Linear factors are wrapped in parentheses by `polyRock`. */
export function formatPoly(p: Poly): string {
  const q = trim(p);
  let s = "";
  for (let i = q.length - 1; i >= 0; i--) {
    const c = q[i];
    if (c === 0) continue;
    const neg = c < 0;
    const abs = Math.abs(c);
    const coef = i === 0 ? String(abs) : abs === 1 ? "" : String(abs);
    const term = coef + (i === 0 ? "" : "x" + SUP[i]);
    if (s === "") s = (neg ? "−" : "") + term;
    else s += (neg ? "−" : "+") + term;
  }
  return s || "0";
}

/** A polynomial rock. Constants, monomials and primitive linear factors are cores. */
export function polyRock(p: Poly, parts?: [RockMath, RockMath]): RockMath {
  const d = degree(p);
  const monomial = trim(p).slice(0, -1).every((c) => c === 0);
  const core = !parts;
  const txt = formatPoly(p);
  const label = d === 1 && !monomial && core ? `(${txt})` : txt;
  return { label, core, n: null, poly: trim(p), parts };
}

const lin = (a: number, b: number): Poly => [b, a]; // ax + b

function hsTop(grade: Grade): RockMath {
  const n = gradeNum(grade);
  const nz = (lo: number, hi: number) => {
    for (;;) {
      const v = rnd(lo, hi);
      if (v !== 0) return v;
    }
  };
  const monic = (p: number, q: number) => polyRock(polyMul(lin(1, p), lin(1, q)), [polyRock(lin(1, p)), polyRock(lin(1, q))]);
  const kinds: string[] = ["trinomial", "trinomial", "gcfLinear"];
  if (n >= 10) kinds.push("squares", "perfect", "gcfQuad");
  if (n >= 11) kinds.push("nonMonic", "nonMonic", "cubic");
  const kind = pickOne(kinds);
  switch (kind) {
    case "gcfLinear": {
      // 3x+12 → 3 and (x+4)
      const k = rnd(2, 6);
      const a = nz(-9, 9);
      return polyRock([k * a, k], [polyRock([k]), polyRock(lin(1, a))]);
    }
    case "squares": {
      const a = rnd(1, 9);
      return monic(a, -a);
    }
    case "perfect": {
      const a = nz(-7, 7);
      return monic(a, a);
    }
    case "gcfQuad": {
      // 2x²+10x+12 → 2 and x²+5x+6
      const k = rnd(2, 3);
      const p = nz(-5, 5);
      const q = nz(-5, 5);
      const inner = monic(p, q);
      return polyRock(polyMul([k], inner.poly!), [polyRock([k]), inner]);
    }
    case "nonMonic": {
      // (ax+p)(x+q), a = 2 or 3, gcd(a, p) = 1 so each factor is primitive
      const a = rnd(2, 3);
      let p = nz(-7, 7);
      while (gcd(a, p) !== 1) p = nz(-7, 7);
      const q = nz(-6, 6);
      return polyRock(polyMul(lin(a, p), lin(1, q)), [polyRock(lin(a, p)), polyRock(lin(1, q))]);
    }
    case "cubic": {
      // x³+5x²+6x → x and x²+5x+6
      const p = nz(-5, 5);
      const q = nz(-5, 5);
      const inner = monic(p, q);
      return polyRock(polyMul([0, 1], inner.poly!), [polyRock([0, 1]), inner]);
    }
    default: {
      const p = nz(-7, 7);
      let q = nz(-7, 7);
      while (q === -p) q = nz(-7, 7); // plain trinomials have a middle term
      return monic(p, q);
    }
  }
}

/* ------------------------------ rocks & splits ------------------------------ */

/** A fresh top-level (big) rock for `grade`. */
export function topRock(grade: Grade): RockMath {
  switch (bandOf(grade)) {
    case "k2": {
      const v = k2Top(grade);
      return numRock(v, v === 1);
    }
    case "hs":
      return hsTop(grade);
    default:
      return numRock(numberTop(grade), false);
  }
}

/**
 * What a shot rock breaks into. `gen` is how many splits produced this rock (0 = big rock).
 * Returns null when the rock just pops (a core, or a K-2 rock that's already small).
 */
export function splitRock(m: RockMath, grade: Grade, gen: number): Split | null {
  if (m.core) return null;
  const band = bandOf(grade);
  if (m.poly) {
    if (!m.parts) return null;
    const [a, b] = m.parts;
    return { parts: [a, b], op: "", note: `${m.label}=${joinFactors([a, b])}` };
  }
  const n = m.n!;
  if (band === "k2") {
    if (n <= 1 || gen >= K2_MAX_GEN) return null;
    const g = gradeNum(grade);
    let a: number;
    if (g >= 1 && n > 10 && Math.random() < 0.5) a = 10; // make-a-ten strategy
    else a = rnd(1, n - 1);
    let b = n - a;
    if (a < b && Math.random() < 0.5) [a, b] = [b, a];
    return { parts: [numRock(a, a === 1), numRock(b, b === 1)], op: "+", note: `${n}=${a}+${b}` };
  }
  if (isPrime(n)) return null;
  const pairs = factorPairs(n);
  let [a, b] = pickOne(pairs);
  if (Math.random() < 0.5) [a, b] = [b, a];
  return { parts: [numRock(a, isPrime(a)), numRock(b, isPrime(b))], op: "×", note: `${n}=${a}×${b}` };
}

/** Writes factors side by side: constants first, then x, then linear factors: "2x(x+3)". */
export function joinFactors(fs: RockMath[]): string {
  const rank = (m: RockMath) => (m.poly && degree(m.poly) >= 1 ? (m.label.startsWith("(") ? 2 : 1) : 0);
  const sorted = [...fs].sort((a, b) => rank(a) - rank(b));
  let s = "";
  for (const f of sorted) {
    const lbl = f.label;
    const needsParens = !lbl.startsWith("(") && s !== "" && /[+−]/.test(lbl.slice(1));
    s += needsParens ? `(${lbl})` : lbl;
  }
  return s;
}

/** "36=2×2×3×3" or "2x²+10x+12=2(x+2)(x+3)", once every core of a rock is blasted. */
export function comboNote(root: RockMath, cores: RockMath[]): string {
  if (root.poly) return `${root.label}=${joinFactors(cores)}`;
  const ns = cores.map((c) => c.n!).sort((a, b) => a - b);
  return `${root.label}=${ns.join("×")}`;
}

/* ------------------------------ rock sizes ------------------------------ */

export const MAX_ROCK_R = 26;
/** Minimum radius by generation: big, medium, small. */
const GEN_R = [15, 11, 8];

/** Label scale: early readers get double-size digits. */
export function labelScale(grade: Grade): number {
  return bandOf(grade) === "k2" ? 2 : 1;
}

/** Radius that fits the label inside the rock's body. */
export function rockRadius(label: string, gen: number, scale: number): number {
  const w = textWidth(label, scale);
  const fit = Math.ceil(w / 2) + 3;
  return Math.min(MAX_ROCK_R, Math.max(GEN_R[Math.min(gen, GEN_R.length - 1)], fit));
}

/** True when the label fits inside a rock of radius r (inner body ≈ r − 2). */
export function labelFits(label: string, r: number, scale: number): boolean {
  return textWidth(label, scale) <= 2 * (r - 2) && 6 * scale <= 2 * (r - 2);
}

/* ------------------------------ challenge rules ------------------------------ */

function numRule(
  id: string,
  text: string,
  short: string,
  say: string,
  standard: string,
  skill: string,
  test: (n: number) => boolean,
  why: (n: number) => string,
): Rule {
  return {
    id, text, short, say, standard, skill,
    test: (m) => m.n !== null && test(m.n),
    why: (m) => (m.n !== null ? why(m.n) : "NOT A NUMBER"),
  };
}

/** Factor (x−r) as it reads in a label: r = 3 gives "(x−3)". */
function factorLabel(root: number): string {
  return polyRock(lin(1, -root)).label;
}

/** The challenge for a level. Rules only judge non-core rocks; cores are always safe. */
export function makeRule(grade: Grade, level: number): Rule {
  const g = gradeNum(grade);
  const band = bandOf(grade);
  const std = gradeInfo(grade);

  if (band === "k2") {
    const opts: Rule[] = [];
    if (g === 0) {
      opts.push(
        numRule("gt5", "BLAST NUMBERS BIGGER THAN 5", "BIGGER THAN 5", "Blast numbers bigger than 5.", "NC.K.CC.7", "Compare numbers to 10",
          (n) => n > 5, (n) => `${n} IS NOT BIGGER THAN 5`),
        numRule("le5", "BLAST NUMBERS 5 OR LESS", "5 OR LESS", "Blast numbers that are 5 or less.", "NC.K.CC.7", "Compare numbers to 10",
          (n) => n <= 5, (n) => `${n} IS MORE THAN 5`),
      );
    } else {
      const cut = g === 1 ? 7 : 10;
      opts.push(
        numRule(`gt${cut}`, `BLAST NUMBERS BIGGER THAN ${cut}`, `BIGGER THAN ${cut}`, `Blast numbers bigger than ${cut}.`,
          "NC.1.NBT.3", "Compare numbers", (n) => n > cut, (n) => `${n} IS NOT BIGGER THAN ${cut}`),
      );
      if (g === 2) {
        opts.push(
          numRule("even", "BLAST EVEN NUMBERS", "EVEN NUMBERS", "Blast even numbers.", "NC.2.OA.3", "Odd & even numbers",
            (n) => n % 2 === 0, (n) => `${n} IS ODD, NOT EVEN`),
          numRule("odd", "BLAST ODD NUMBERS", "ODD NUMBERS", "Blast odd numbers.", "NC.2.OA.3", "Odd & even numbers",
            (n) => n % 2 === 1, (n) => `${n} IS EVEN, NOT ODD`),
        );
      } else {
        opts.push(
          numRule("le7", "BLAST NUMBERS 7 OR LESS", "7 OR LESS", "Blast numbers that are 7 or less.", "NC.1.NBT.3", "Compare numbers",
            (n) => n <= 7, (n) => `${n} IS MORE THAN 7`),
        );
      }
    }
    return opts[(level - 1) % opts.length];
  }

  if (band === "35" || band === "68") {
    const ks = band === "35" ? [2, 3, 5, 4, 6] : [3, 2, 5, 6, 4];
    const k = ks[(level - 1) % ks.length];
    const multiples = numRule(
      `mult${k}`, `BLAST MULTIPLES OF ${k}`, `MULTIPLES OF ${k}`, `Blast multiples of ${k}.`,
      band === "35" ? std.standard : "NC.6.NS.4", band === "35" ? "Multiples & factors" : "Factors & multiples",
      (n) => n % k === 0, (n) => `${n} IS NOT A MULTIPLE OF ${k}`,
    );
    if (band === "35") {
      if (level % 3 === 0 && g >= 4) {
        return numRule("even", "BLAST EVEN NUMBERS", "EVEN NUMBERS", "Blast even numbers.", std.standard, "Multiples & factors",
          (n) => n % 2 === 0, (n) => `${n} IS ODD`);
      }
      return multiples;
    }
    // 6-8: alternate multiples, shared factors (GCF) and perfect squares.
    const m = 12;
    const shared = numRule(
      "gcf12", `BLAST NUMBERS THAT SHARE A FACTOR WITH ${m}`, `SHARES A FACTOR WITH ${m}`,
      `Blast numbers that share a factor with ${m}.`, "NC.6.NS.4", "Greatest common factor",
      (n) => gcd(n, m) > 1, (n) => `GCF(${n},${m}) IS 1`,
    );
    const squares = numRule(
      "square", "BLAST PERFECT SQUARES", "PERFECT SQUARES", "Blast perfect squares.", "NC.8.EE.2", "Perfect squares & roots",
      (n) => Number.isInteger(Math.sqrt(n)), (n) => `${n} IS NOT A PERFECT SQUARE`,
    );
    const order = g >= 8 ? [multiples, shared, squares] : [multiples, shared];
    return order[(level - 1) % order.length];
  }

  // High school
  const roots = [-3, -2, 2, 3, -1, 1, -4, 4];
  const r = roots[(level - 1) % roots.length];
  const f = factorLabel(r);
  const factorRule: Rule = {
    id: `factor${r}`,
    text: `ONLY SHOOT ROCKS WITH FACTOR ${f}`,
    short: `FACTOR ${f}`,
    say: `Only shoot rocks with a factor of x ${r < 0 ? "plus" : "minus"} ${Math.abs(r)}.`,
    standard: "NC.M1.A-SSE.3",
    skill: "Factoring quadratic expressions",
    test: (m) => !!m.poly && polyEval(m.poly, r) === 0,
    why: (m) => `${m.label} HAS NO FACTOR ${f}`,
  };
  const zeroRule: Rule = {
    id: `zero${r}`,
    text: `ONLY SHOOT ROCKS THAT ARE 0 WHEN x = ${r < 0 ? "−" : ""}${Math.abs(r)}`,
    short: `0 WHEN x=${r < 0 ? "−" : ""}${Math.abs(r)}`,
    say: `Only shoot rocks that equal zero when x is ${r < 0 ? "negative " : ""}${Math.abs(r)}.`,
    standard: "NC.M1.A-APR.3",
    skill: "Factors and zeros",
    test: (m) => !!m.poly && polyEval(m.poly, r) === 0,
    why: (m) => `AT x=${r < 0 ? "−" : ""}${Math.abs(r)} IT IS ${fmtInt(polyEval(m.poly ?? [0], r))}`,
  };
  const gcfRule: Rule = {
    id: "gcf",
    text: "ONLY SHOOT ROCKS WITH A COMMON FACTOR (GCF)",
    short: "HAS A GCF",
    say: "Only shoot rocks whose terms share a common factor.",
    standard: "NC.M1.A-SSE.3",
    skill: "Factoring out a GCF",
    test: (m) => !!m.poly && (content(m.poly) > 1 || (m.poly[0] === 0 && degree(m.poly) > 1)),
    why: (m) => `${m.label} HAS NO GCF`,
  };
  const order = g >= 10 ? [factorRule, gcfRule, zeroRule] : [factorRule, gcfRule];
  return order[(level - 1) % order.length];
}

function fmtInt(n: number): string {
  return n < 0 ? `−${-n}` : String(n);
}

/**
 * Rocks for a level: `count` big rocks, at least half of them (and never zero) matching
 * the rule so every level can be cleared.
 */
export function levelRocks(grade: Grade, rule: Rule, count: number): RockMath[] {
  const want = Math.max(1, Math.ceil(count / 2));
  const out: RockMath[] = [];
  for (let i = 0; i < count; i++) {
    const needMatch = i < want;
    let m = topRock(grade);
    for (let t = 0; t < 400 && needMatch && !(rule.test(m) && !m.core); t++) m = topRock(grade);
    out.push(m);
  }
  return out;
}
