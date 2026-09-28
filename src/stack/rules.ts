import type { Grade } from "@/kit/types";
import { ONE, ZERO, add, cmp, div, eq, fmtDec, fmtFrac, isInt, key, mul, q, sub, type Q } from "./rational";
import { plainLabel } from "./font";

/*
 * Grade rules for Sum Stack: what a cell can hold, how a row combines, and the target.
 * Every rule has a finite `domain` of cell values, and targets are only ever chosen when
 * the domain can reach them exactly, so a perfect row is always possible.
 */

export type Op = "+" | "×";
export type Rng = () => number;

export interface CellValue {
  /** Display label with font markup: `{..}` superscript, `[..]` subscript. */
  label: string;
  v: Q;
  /** A WILD power-up cell: becomes whatever its row needs when it lands. */
  wild?: boolean;
}

export interface Rule {
  grade: Grade;
  level: number;
  op: Op;
  target: Q;
  targetLabel: string;
  /** HUD line, e.g. "MAKE 10", "PRODUCT = 24", "SUM = 1". */
  title: string;
  /** Extra HUD lines, e.g. ["x = 3"], ["f(x)=2x+1"], ["FOURTHS"]. */
  context: string[];
  speakText: string;
  standard: string;
  skill: string;
  /** Early readers: draw cell numbers double size. */
  big: boolean;
  /** True when a row total can only grow (all values ≥ 0 with +, ≥ 1 with ×): overshoot is final. */
  monotone: boolean;
  domain: CellValue[];
  /** Formats a row total or a WILD value. */
  fmt: (a: Q) => string;
  /** Min/max parts used when dealing value sets. */
  parts: [number, number];
}

/* ------------------------------ helpers ------------------------------ */

export const rnd = (rng: Rng, a: number, b: number) => a + Math.floor(rng() * (b - a + 1));
export const choose = <T>(rng: Rng, arr: readonly T[]): T => arr[Math.floor(rng() * arr.length)];
export function shuffle<T>(rng: Rng, arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

const cv = (label: string, v: Q): CellValue => ({ label, v });
const intCell = (n: number) => cv(fmtFrac(q(n)), q(n));
const range = (a: number, b: number) => Array.from({ length: b - a + 1 }, (_, i) => a + i);
const signed = (n: number) => (n < 0 ? `−${-n}` : `+${n}`);

export function combine(op: Op, vals: Q[]): Q {
  return vals.reduce((acc, v) => (op === "+" ? add(acc, v) : mul(acc, v)), op === "+" ? ZERO : ONE);
}

/** The single value that would take `agg` exactly to the target, or null. */
export function complement(rule: Pick<Rule, "op" | "target">, agg: Q): Q | null {
  if (rule.op === "+") return sub(rule.target, agg);
  if (agg.n === 0) return null;
  return div(rule.target, agg);
}

const byValueCache = new WeakMap<CellValue[], Map<string, CellValue[]>>();
function byValue(domain: CellValue[]) {
  let m = byValueCache.get(domain);
  if (!m) {
    m = new Map();
    for (const c of domain) {
      const k = key(c.v);
      m.set(k, [...(m.get(k) ?? []), c]);
    }
    byValueCache.set(domain, m);
  }
  return m;
}

/** A domain cell worth exactly `v` (random label if several), or null. */
export function cellFor(rule: Pick<Rule, "domain">, v: Q, rng: Rng = Math.random): CellValue | null {
  const opts = byValue(rule.domain).get(key(v));
  return opts ? choose(rng, opts) : null;
}

/** A set of 2+ domain values that combine exactly to the target. */
export function partition(rule: Rule, rng: Rng = Math.random): CellValue[] {
  const [lo, hi] = rule.parts;
  for (let attempt = 0; attempt < 400; attempt++) {
    const k = rnd(rng, lo, hi);
    const parts = Array.from({ length: k - 1 }, () => choose(rng, rule.domain));
    const need = complement(rule, combine(rule.op, parts.map((p) => p.v)));
    const last = need && cellFor(rule, need, rng);
    if (last) return shuffle(rng, [...parts, last]);
  }
  // Exhaustive fallback over pairs, then triples.
  for (const a of rule.domain) {
    const need = complement(rule, a.v);
    const b = need && cellFor(rule, need, rng);
    if (b) return shuffle(rng, [a, b]);
  }
  for (const a of rule.domain)
    for (const b of rule.domain) {
      const need = complement(rule, combine(rule.op, [a.v, b.v]));
      const c = need && cellFor(rule, need, rng);
      if (c) return shuffle(rng, [a, b, c]);
    }
  throw new Error(`no partition for ${rule.grade} ${rule.title}`);
}

/** Target = combination of k random domain values that passes `ok`. */
function targetFrom(domain: CellValue[], rng: Rng, k: [number, number], ok: (t: Q) => boolean, op: Op = "+"): Q {
  for (let i = 0; i < 500; i++) {
    const parts = Array.from({ length: rnd(rng, k[0], k[1]) }, () => choose(rng, domain).v);
    const t = combine(op, parts);
    if (ok(t)) return t;
  }
  throw new Error("no target");
}

const absLe = (m: number) => (t: Q) => isInt(t) && Math.abs(t.n) <= m;

/* ------------------------------ grades ------------------------------ */

type Base = Omit<Rule, "grade" | "level" | "targetLabel" | "fmt" | "big" | "parts"> & {
  fmt?: (a: Q) => string;
  parts?: [number, number];
};

const DENOM_NAME: Record<number, string> = {
  2: "HALVES", 3: "THIRDS", 4: "FOURTHS", 5: "FIFTHS", 6: "SIXTHS", 8: "EIGHTHS", 10: "TENTHS", 12: "TWELFTHS",
};

function sumTitle(t: Q, fmt: (a: Q) => string) {
  return `SUM = ${fmt(t)}`;
}

function gradeK(L: number, rng: Rng): Base {
  const T = [6, 8, 10][L - 1] ?? choose(rng, [10, 10, 9, 7, 10, 8]);
  const domain = [intCell(0), ...range(1, 5).map(intCell), ...range(1, 5).map(intCell)];
  const ten = T === 10;
  return {
    op: "+", target: q(T), title: `MAKE ${T}`, context: ["ADD THE ROW"],
    speakText: `Make ${T}! Stack the blocks so a row adds up to ${T}.`,
    standard: ten ? "NC.K.OA.4" : "NC.K.OA.3", skill: ten ? "Make 10" : `Break apart ${T}`,
    monotone: true, domain, parts: [2, 3],
  };
}

function grade1(L: number, rng: Rng): Base {
  const T = L === 1 ? rnd(rng, 10, 13) : L === 2 ? rnd(rng, 12, 16) : rnd(rng, 13, 20);
  return {
    op: "+", target: q(T), title: `MAKE ${T}`, context: ["ADD THE ROW"],
    speakText: `Make ${T}! Stack the blocks so a row adds up to ${T}.`,
    standard: "NC.1.OA.6", skill: "Add within 20", monotone: true, domain: range(1, 9).map(intCell), parts: [2, 3],
  };
}

function grade2(L: number, rng: Rng): Base {
  const early = L <= 2;
  const T = early ? 10 * rnd(rng, 4, 8) : rnd(rng, 50, 99);
  const domain = early ? range(1, 8).map((n) => intCell(n * 5)) : range(4, 45).map(intCell);
  return {
    op: "+", target: q(T), title: `MAKE ${T}`, context: [early ? "ADD FIVES, TENS" : "ADD THE ROW"],
    speakText: `Make ${T}! Stack the blocks so a row adds up to ${T}.`,
    standard: "NC.2.NBT.5", skill: "Add within 100", monotone: true, domain, parts: [2, 3],
  };
}

function grade3(L: number, rng: Rng): Base {
  const T =
    L === 1 ? choose(rng, [12, 18, 20]) : L === 2 ? choose(rng, [24, 30, 16, 28]) : choose(rng, [24, 36, 40, 48, 42, 54, 56, 60, 72, 64, 63, 45]);
  const divs = range(2, 9).filter((d) => T % d === 0);
  const domain = [intCell(1), ...divs.flatMap((d) => [intCell(d), intCell(d), intCell(d)])];
  return {
    op: "×", target: q(T), title: `PRODUCT = ${T}`, context: ["MULTIPLY THE ROW"],
    speakText: `Multiply! Make a row whose product is ${T}.`,
    standard: "NC.3.OA.7", skill: "Multiply within 100", monotone: true, domain, parts: [2, 3],
  };
}

function grade4(L: number): Base {
  const d = [4, 3, 6, 8, 5, 10, 12, 2][(L - 1) % 8];
  const T = L <= 3 ? 1 : 2;
  const domain = range(1, T === 2 ? d : d - 1).map((k) => cv(`${k}/${d}`, q(k, d)));
  return {
    op: "+", target: q(T), title: `SUM = ${T}`, context: [DENOM_NAME[d]],
    speakText: `Add ${DENOM_NAME[d].toLowerCase()}. Make a row that adds up to ${T}.`,
    standard: "NC.4.NF.3", skill: "Add fractions (like denominators)", monotone: true, domain, fmt: fmtFrac, parts: [2, 4],
  };
}

const FAMILIES = [[2, 4], [2, 3, 6], [2, 4, 8], [2, 5, 10], [3, 6, 12], [3, 4, 12], [2, 3, 4, 6]];

function grade5(L: number, rng: Rng): Base {
  if (L % 2 === 1) {
    const fam = FAMILIES[((L - 1) / 2) % FAMILIES.length];
    const T = L <= 3 ? 1 : 2;
    const seen = new Set<string>();
    const domain: CellValue[] = [];
    for (const d of fam)
      for (let k = 1; k < d; k++) {
        const v = q(k, d);
        if (v.d !== d || seen.has(key(v))) continue; // lowest terms only
        seen.add(key(v));
        domain.push(cv(`${k}/${d}`, v));
      }
    return {
      op: "+", target: q(T), title: `SUM = ${T}`, context: ["UNLIKE PARTS", fam.map((d) => `1/${d}`).join(" ")],
      speakText: `Add fractions with different denominators. Make a row that adds up to ${T}.`,
      standard: "NC.5.NF.1", skill: "Add fractions (unlike denominators)", monotone: true, domain, fmt: fmtFrac, parts: [2, 4],
    };
  }
  const tenths = range(1, 9).map((k) => q(k, 10));
  const hundredths = [5, 15, 25, 35, 45, 55, 65, 75, 85, 95].map((k) => q(k, 100));
  const vals = L === 2 ? tenths : L === 4 ? [...tenths, ...hundredths] : [...tenths, ...hundredths, q(12, 10), q(15, 10), q(125, 100)];
  const T = L === 2 ? 1 : L === 4 ? 1 : choose(rng, [2, 2, 3]);
  return {
    op: "+", target: q(T), title: `SUM = ${T}`, context: ["DECIMALS"],
    speakText: `Add decimals. Make a row that adds up to ${T}.`,
    standard: "NC.5.NBT.7", skill: "Add decimals", monotone: true, domain: vals.map((v) => cv(fmtDec(v), v)), fmt: fmtDec, parts: [2, 4],
  };
}

function grade6(L: number, rng: Rng): Base {
  if (L % 2 === 1) {
    const vals = [...range(2, 38).map((k) => q(k * 5, 100)), ...range(1, 9).map((k) => q(k * 5 + 1, 10))];
    const T = L === 1 ? 5 : choose(rng, [4, 5, 6, 7]);
    return {
      op: "+", target: q(T), title: `SUM = ${T}`, context: ["DECIMALS"],
      speakText: `Add decimals. Make a row that adds up to ${T}.`,
      standard: "NC.6.NS.3", skill: "Add multi-digit decimals", monotone: true,
      domain: vals.map((v) => cv(fmtDec(v), v)), fmt: fmtDec, parts: [2, 4],
    };
  }
  const T = L === 2 ? rnd(rng, 3, 9) : rnd(rng, -8, 10);
  const domain = range(-9, 9).filter((n) => n !== 0).map(intCell);
  return {
    op: "+", target: q(T), title: sumTitle(q(T), fmtFrac), context: ["+ AND − NUMBERS"],
    speakText: `Positive and negative numbers. Make a row that adds up to ${spoken(T)}.`,
    standard: "NC.6.NS.5", skill: "Positive & negative numbers", monotone: false, domain, parts: [2, 4],
  };
}

function grade7(L: number, rng: Rng): Base {
  if (L % 2 === 1) {
    const T = L === 1 ? 0 : rnd(rng, -10, 10);
    const domain = range(-12, 12).filter((n) => n !== 0).map(intCell);
    return {
      op: "+", target: q(T), title: `SUM = ${fmtFrac(q(T))}`, context: ["INTEGERS"],
      speakText: `Add integers. Make a row that adds up to ${spoken(T)}.`,
      standard: "NC.7.NS.1", skill: "Add integers", monotone: false, domain, parts: [2, 4],
    };
  }
  const fr = [q(1, 2), q(1, 4), q(3, 4), q(3, 2), q(1), q(2)];
  const domain: CellValue[] = [];
  for (const v of fr)
    for (const s of [1, -1]) {
      const sv = mul(v, q(s));
      domain.push(cv(fmtFrac(sv), sv));
      if (v.d !== 1 && v.d !== 3) domain.push(cv(fmtDec(sv), sv)); // same value as a decimal
    }
  const T = choose(rng, [q(0), q(1), q(-1), q(1, 2), q(2), q(-1, 2)]);
  return {
    op: "+", target: T, title: `SUM = ${fmtFrac(T)}`, context: ["RATIONAL NUMBERS"],
    speakText: `Add positive and negative fractions and decimals. Make a row that adds up to ${plainQ(T)}.`,
    standard: "NC.7.NS.1", skill: "Add rational numbers", monotone: false, domain, fmt: fmtFrac, parts: [2, 4],
  };
}

/** Grade 8 expression templates: label (markup) and exact integer value at x. */
export const EXPR8: { label: string; f: (x: number) => number; maxAbsX?: number }[] = [
  { label: "x", f: (x) => x },
  { label: "2x", f: (x) => 2 * x },
  { label: "3x", f: (x) => 3 * x },
  { label: "x+1", f: (x) => x + 1 },
  { label: "x+2", f: (x) => x + 2 },
  { label: "x−1", f: (x) => x - 1 },
  { label: "x−3", f: (x) => x - 3 },
  { label: "2x+1", f: (x) => 2 * x + 1 },
  { label: "−x", f: (x) => -x },
  { label: "5−x", f: (x) => 5 - x },
  { label: "x{2}", f: (x) => x * x },
  { label: "x{2}−1", f: (x) => x * x - 1 },
  { label: "x{0}", f: () => 1 },
  { label: "x{3}", f: (x) => x ** 3, maxAbsX: 3 },
  { label: "2", f: () => 2 },
  { label: "4", f: () => 4 },
];

function grade8(L: number, rng: Rng): Base {
  const x = [2, 3, -1, 4, -2, 3, 5, -3][(L - 1) % 8];
  const domain = EXPR8.filter((e) => !e.maxAbsX || Math.abs(x) <= e.maxAbsX).map((e) => cv(e.label, q(e.f(x))));
  const T = targetFrom(domain, rng, [2, 3], (t) => absLe(30)(t) && t.n !== 0);
  return {
    op: "+", target: T, title: `SUM = ${fmtFrac(T)}`, context: [`x = ${fmtFrac(q(x))}`],
    speakText: `x equals ${spoken(x)}. Make a row that adds up to ${plainQ(T)}.`,
    standard: "NC.8.EE.1", skill: "Evaluate expressions & exponents", monotone: false, domain, parts: [2, 3],
  };
}

/** Linear f for grade 9: returns label and function. */
export function linearF(a: number, b: number): { label: string; f: (x: number) => number } {
  const ax = a === 1 ? "x" : a === -1 ? "−x" : `${fmtFrac(q(a))}x`;
  return { label: `f(x)=${ax}${b === 0 ? "" : signed(b)}`, f: (x) => a * x + b };
}

export const QUAD10: { label: string; f: (x: number) => number }[] = [
  { label: "f(x)=x{2}+1", f: (x) => x * x + 1 },
  { label: "f(x)=x{2}−2", f: (x) => x * x - 2 },
  { label: "f(x)=x{2}−2x", f: (x) => x * x - 2 * x },
  { label: "f(x)=x{2}+x", f: (x) => x * x + x },
  { label: "f(x)=2x{2}−3", f: (x) => 2 * x * x - 3 },
  { label: "f(x)=x{2}−x+1", f: (x) => x * x - x + 1 },
];

function fnCells(f: (x: number) => number, ks: number[]): CellValue[] {
  return ks.map((k) => cv(`f(${fmtFrac(q(k))})`, q(f(k))));
}

function grade9(L: number, rng: Rng): Base {
  const a = [2, 3, -2, 4, -1, 5, -3][(L - 1) % 7];
  const b = L === 1 ? 1 : rnd(rng, -4, 5);
  const fn = linearF(a, b);
  const domain = fnCells(fn.f, range(-3, 4));
  const T = targetFrom(domain, rng, [2, 3], (t) => absLe(30)(t));
  return {
    op: "+", target: T, title: `SUM = ${fmtFrac(T)}`, context: [fn.label],
    speakText: `Use the function f. Make a row that adds up to ${plainQ(T)}.`,
    standard: "NC.M1.F-IF.2", skill: "Evaluate functions", monotone: false, domain, parts: [2, 3],
  };
}

/** Radicals and rational exponents: label, exact value. */
export const ROOTS10: [string, number][] = [
  ["√4", 2], ["√9", 3], ["√16", 4], ["√25", 5], ["√36", 6], ["√49", 7], ["√64", 8], ["√81", 9], ["√100", 10],
  ["{3}√8", 2], ["{3}√27", 3], ["{3}√64", 4], ["4{1/2}", 2], ["9{1/2}", 3], ["8{1/3}", 2], ["27{1/3}", 3], ["8{2/3}", 4],
  ["2{3}", 8], ["3{2}", 9], ["5{0}", 1],
];

function grade10(L: number, rng: Rng): Base {
  if (L % 2 === 1) {
    const fn = QUAD10[((L - 1) / 2) % QUAD10.length];
    const domain = fnCells(fn.f, range(-3, 3));
    const T = targetFrom(domain, rng, [2, 3], (t) => absLe(30)(t));
    return {
      op: "+", target: T, title: `SUM = ${fmtFrac(T)}`, context: [fn.label],
      speakText: `Evaluate the quadratic function f. Make a row that adds up to ${plainQ(T)}.`,
      standard: "NC.M2.F-IF.2", skill: "Evaluate quadratic functions", monotone: false, domain, parts: [2, 3],
    };
  }
  const domain = ROOTS10.map(([l, v]) => cv(l, q(v)));
  const T = targetFrom(domain, rng, [2, 3], (t) => t.n >= 6 && t.n <= 20);
  return {
    op: "+", target: T, title: `SUM = ${fmtFrac(T)}`, context: ["ROOTS, POWERS"],
    speakText: `Roots and powers. Make a row that adds up to ${plainQ(T)}.`,
    standard: "NC.M2.N-RN.2", skill: "Radicals & rational exponents", monotone: true, domain, parts: [2, 3],
  };
}

/** Logarithms: [base, argument] with exact rational value, as label "log[b]a" (common log "logA"). */
export function logCell(base: number, arg: number): CellValue | null {
  // exact value p/r with base^(p/r) = arg, searching small denominators
  for (let r = 1; r <= 4; r++)
    for (let p = -4 * r; p <= 8 * r; p++) {
      if (Math.abs(Math.pow(base, p / r) - arg) < 1e-9 * Math.max(1, arg)) {
        const label = base === 10 ? `log${arg}` : `log[${base}]${arg}`;
        return cv(label, q(p, r));
      }
    }
  return null;
}

function grade11(L: number, rng: Rng): Base {
  const pairs: [number, number][] = [
    [2, 1], [2, 2], [2, 4], [2, 8], [2, 16], [2, 32], [10, 10], [10, 100],
    ...(L >= 2 ? ([[3, 3], [3, 9], [3, 27], [3, 81]] as [number, number][]) : []),
    ...(L >= 3 ? ([[5, 5], [5, 25], [4, 4], [4, 16], [4, 64]] as [number, number][]) : []),
  ];
  const domain = pairs.map(([b, a]) => logCell(b, a)!);
  const T = targetFrom(domain, rng, [2, 3], (t) => isInt(t) && t.n >= 4 && t.n <= 12);
  return {
    op: "+", target: T, title: `SUM = ${fmtFrac(T)}`, context: ["LOGARITHMS"],
    speakText: `Logarithms. Make a row that adds up to ${plainQ(T)}.`,
    standard: "NC.M3.F-LE.4", skill: "Evaluate logarithms", monotone: true, domain, parts: [2, 3],
  };
}

export const EXP12: [string, Q][] = [
  ["2{−1}", q(1, 2)], ["2{−2}", q(1, 4)], ["4{−1}", q(1, 4)], ["3{−1}", q(1, 3)], ["4{1/2}", q(2)], ["8{1/3}", q(2)],
  ["8{2/3}", q(4)], ["9{1/2}", q(3)], ["3{0}", q(1)], ["2{3}", q(8)], ["27{1/3}", q(3)], ["4{3/2}", q(8)],
  ["16{1/4}", q(2)], ["9{−1/2}", q(1, 3)], ["25{1/2}", q(5)], ["4{−1/2}", q(1, 2)],
];

function grade12(L: number, rng: Rng): Base {
  if (L % 2 === 1) {
    const pairs: [number, number][] = [
      [2, 8], [2, 4], [4, 2], [9, 3], [8, 2], [27, 3], [4, 8], [8, 4], [16, 2], [25, 5], [9, 27], [3, 1], [2, 16], [16, 8],
    ];
    const domain = pairs.map(([b, a]) => logCell(b, a)!);
    const T = q(L === 1 ? 2 : choose(rng, [2, 3, 4]));
    return {
      op: "+", target: T, title: `SUM = ${fmtFrac(T)}`, context: ["LOGARITHMS"],
      speakText: `Logarithms with fraction answers. Make a row that adds up to ${plainQ(T)}.`,
      standard: "NC.M3.F-LE.4", skill: "Evaluate logarithms", monotone: true, domain, fmt: fmtFrac, parts: [2, 4],
    };
  }
  const domain = EXP12.map(([l, v]) => cv(l, v));
  const T = q(choose(rng, [4, 5, 6, 8, 10]));
  return {
    op: "+", target: T, title: `SUM = ${fmtFrac(T)}`, context: ["RATIONAL EXPONENTS"],
    speakText: `Negative and fraction exponents. Make a row that adds up to ${plainQ(T)}.`,
    standard: "NC.M2.N-RN.2", skill: "Rational exponents", monotone: true, domain, fmt: fmtFrac, parts: [2, 4],
  };
}

function spoken(n: number) {
  return n < 0 ? `negative ${-n}` : String(n);
}
function plainQ(t: Q) {
  if (t.d === 1) return spoken(t.n);
  return `${t.n < 0 ? "negative " : ""}${Math.abs(t.n)} over ${t.d}`;
}

const BUILDERS: Record<Grade, (L: number, rng: Rng) => Base> = {
  K: gradeK, "1": grade1, "2": grade2, "3": grade3, "4": grade4, "5": grade5, "6": grade6,
  "7": grade7, "8": grade8, "9": grade9, "10": grade10, "11": grade11, "12": grade12,
};

const EARLY: Grade[] = ["K", "1", "2"];

/** The rule for `grade` at `level` (1-based). */
export function ruleFor(grade: Grade, level: number, rng: Rng = Math.random): Rule {
  const b = BUILDERS[grade](level, rng);
  const fmt = b.fmt ?? fmtFrac;
  return {
    ...b,
    grade,
    level,
    fmt,
    targetLabel: fmt(b.target),
    big: EARLY.includes(grade),
    parts: b.parts ?? [2, 3],
  };
}

/** Row status for a list of cell values. */
export function rowStatus(rule: Rule, vals: Q[]): "empty" | "under" | "exact" | "over" {
  if (vals.length === 0) return "empty";
  const agg = combine(rule.op, vals);
  if (eq(agg, rule.target)) return "exact";
  if (!rule.monotone) return "under";
  if (rule.op === "+") return cmp(agg, rule.target) > 0 ? "over" : "under";
  // product with factors ≥ 1: over when bigger, or when it no longer divides the target
  if (cmp(agg, rule.target) > 0) return "over";
  const need = div(rule.target, agg);
  return isInt(need) ? "under" : "over";
}

/** "3+2+5", "2×3×4", "2x − x + 4" written left to right from cell labels. */
export function equationText(rule: Rule, labels: string[], html = false): string {
  const f = html ? plainLabel : (s: string) => s;
  return labels
    .map((l, i) => {
      if (i === 0) return f(l);
      if (rule.op === "×") return `×${f(l)}`;
      return l.startsWith("−") ? `−${f(l.slice(1))}` : `+${f(l)}`;
    })
    .join("");
}

/** Spoken version of a perfect row for early readers. */
export function equationSpeech(rule: Rule, labels: string[]): string {
  const joiner = rule.op === "×" ? " times " : " plus ";
  return `${labels.join(joiner)} equals ${rule.targetLabel}!`;
}

/** Plain text description for the title screen. */
export function exampleText(rule: Rule, rng: Rng = Math.random): string {
  const parts = partition(rule, rng);
  return `${equationText(rule, parts.map((p) => p.label), true)} = ${rule.targetLabel}`;
}
