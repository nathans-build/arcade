/*
 * Math sequences are generated fresh for every level, and every order is computed:
 * value orders sort by the number each label stands for, and step orders (order of
 * operations, solving an equation) are built one step at a time from the previous result.
 */
import type { Grade } from "../kit/types";
import type { Sequence } from "./types";

export type Rand = () => number;

export interface MathKind {
  key: string;
  grades: Grade[];
  make(grade: Grade, r: Rand): Sequence;
}

/* ------------------------------ helpers ------------------------------ */

export const ri = (r: Rand, a: number, b: number) => a + Math.floor(r() * (b - a + 1));
function shuffle<T>(r: Rand, arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
/** A number with a true minus sign. */
export const num = (n: number) => (n < 0 ? `−${fmt(-n)}` : fmt(n));
function fmt(n: number): string {
  return String(Math.round(n * 1e6) / 1e6);
}
const gcd = (a: number, b: number): number => (b === 0 ? Math.abs(a) : gcd(b, a % b));
const SUP: Record<string, string> = { "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴", "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹", "-": "⁻", "−": "⁻" };
export const sup = (n: number) => [...String(n)].map((c) => SUP[c]).join("");
const SUB: Record<string, string> = { "0": "₀", "1": "₁", "2": "₂", "3": "₃", "4": "₄", "5": "₅", "6": "₆", "7": "₇", "8": "₈", "9": "₉" };
const sub = (n: number) => [...String(n)].map((c) => SUB[c]).join("");
/** "+ 5" / "− 5" pieces for building expressions like 3x−5. */
const signed = (n: number) => (n < 0 ? `−${-n}` : `+${n}`);
/** "3x", "x", "−x", "−2x". */
const coefX = (a: number) => (a === 1 ? "x" : a === -1 ? "−x" : `${num(a)}x`);

interface Item {
  label: string;
  value: number;
}

/** Picks `n` items with values at least `gap` apart (relative to the larger value when > 1). */
function pickItems(r: Rand, pool: Item[], n: number, gap = 1e-9): Item[] | null {
  for (let tries = 0; tries < 200; tries++) {
    const out: Item[] = [];
    for (const it of shuffle(r, pool)) {
      if (out.some((o) => o.label === it.label || Math.abs(o.value - it.value) < gap)) continue;
      out.push(it);
      if (out.length === n) return out;
    }
  }
  return null;
}

/** A value-order sequence: the stack is built from least to greatest (or greatest to least). */
function valueSeq(
  o: { key: string; grade: Grade; standard: string; skill: string; title: string; items: Item[]; desc?: boolean; passage?: string; say?: (label: string) => string | undefined; unit?: string },
  r: Rand,
): Sequence {
  const items = [...o.items].sort((a, b) => (o.desc ? b.value - a.value : a.value - b.value));
  const steps = items.map((i) => i.label);
  const values = items.map((i) => i.value);
  const rel = o.desc ? " > " : " < ";
  const say = o.say ? steps.map((s) => o.say!(s) ?? s) : undefined;
  return {
    id: `m-${o.key}-${o.grade}-${Math.floor(r() * 1e9).toString(36)}`,
    subject: "math",
    grades: [o.grade],
    standard: o.standard,
    skill: o.skill,
    title: o.title,
    ends: o.desc ? ["GREATEST", "LEAST"] : ["LEAST", "GREATEST"],
    steps,
    values,
    passage: o.passage,
    say: say && say.some((s, i) => s !== steps[i]) ? say : undefined,
    explain: `${o.desc ? "Greatest to least" : "Least to greatest"}: ${steps.join(rel)}${o.unit ?? ""}.`,
  };
}

/** A step-order sequence (each step uses the one before it). */
function stepSeq(
  o: { key: string; grade: Grade; standard: string; skill: string; title: string; steps: string[]; notes: string[]; passage: string; explain: string },
  r: Rand,
): Sequence {
  return {
    id: `m-${o.key}-${o.grade}-${Math.floor(r() * 1e9).toString(36)}`,
    subject: "math",
    grades: [o.grade],
    standard: o.standard,
    skill: o.skill,
    title: o.title,
    ends: ["FIRST STEP", "LAST STEP"],
    steps: o.steps,
    notes: o.notes,
    passage: o.passage,
    explain: o.explain,
  };
}

const intItems = (vals: number[]): Item[] => vals.map((v) => ({ label: num(v), value: v }));
function distinctInts(r: Rand, n: number, lo: number, hi: number, minGap = 1): number[] {
  for (;;) {
    const out: number[] = [];
    for (let t = 0; t < 400 && out.length < n; t++) {
      const v = ri(r, lo, hi);
      if (out.every((o) => Math.abs(o - v) >= minGap)) out.push(v);
    }
    if (out.length === n) return out;
  }
}
/** How many slabs this grade's stack gets (3 for K-2, 4 for 3-5, 4-5 for 6-12). */
export function stepCount(grade: Grade, r: Rand): number {
  const n = grade === "K" ? 0 : Number(grade);
  if (n <= 2) return 3;
  if (n <= 5) return 4;
  return r() < 0.5 ? 4 : 5;
}

/* ------------------------------ K-2 ------------------------------ */

const countOn: MathKind = {
  key: "count",
  grades: ["K"],
  make: (g, r) => {
    const a = ri(r, 1, 17);
    return valueSeq({ key: "count", grade: g, standard: "NC.K.CC.2", skill: "Count forward", title: `COUNT UP FROM ${a}`, items: intItems([a, a + 1, a + 2]) }, r);
  },
};

const compare10: MathKind = {
  key: "cmp10",
  grades: ["K"],
  make: (g, r) =>
    valueSeq({ key: "cmp10", grade: g, standard: "NC.K.CC.7", skill: "Compare numbers to 10", title: "NUMBERS TO 10", items: intItems(distinctInts(r, 3, 0, 10, 2)) }, r),
};

const teens: MathKind = {
  key: "teens",
  grades: ["K"],
  make: (g, r) => {
    const vals = distinctInts(r, 3, 11, 19, 2);
    const items = vals.map((v, i): Item => ({ label: i === 1 ? String(v) : `10+${v - 10}`, value: v }));
    return valueSeq({ key: "teens", grade: g, standard: "NC.K.NBT.1", skill: "Teen numbers: ten and some ones", title: "TEEN NUMBERS", items, passage: "10+4 is ten and four more: 14." }, r);
  },
};

const sums5: MathKind = {
  key: "sums5",
  grades: ["K"],
  make: (g, r) => {
    const vals = distinctInts(r, 3, 1, 5);
    const items = vals.map((v): Item => {
      const a = v === 1 ? ri(r, 0, 1) : ri(r, 1, v - 1);
      return { label: `${a}+${v - a}`, value: v };
    });
    return valueSeq({ key: "sums5", grade: g, standard: "NC.K.OA.5", skill: "Add within 5", title: "ADD, THEN ORDER", items }, r);
  },
};

const compare100: MathKind = {
  key: "cmp100",
  grades: ["1"],
  make: (g, r) => {
    // Two of the three share a tens digit, so the ones digit matters too.
    let vals: number[];
    do {
      const t = ri(r, 1, 8);
      vals = [t * 10 + ri(r, 0, 4), t * 10 + ri(r, 5, 9), ri(r, 1, 9) * 10 + ri(r, 0, 9)];
    } while (new Set(vals).size < 3);
    return valueSeq(
      { key: "cmp100", grade: g, standard: "NC.1.NBT.3", skill: "Compare two-digit numbers", title: "TWO-DIGIT NUMBERS", items: intItems(vals), desc: r() < 0.25 },
      r,
    );
  },
};

const tensOnes: MathKind = {
  key: "tens",
  grades: ["1"],
  make: (g, r) => {
    const vals = distinctInts(r, 3, 11, 99, 3);
    const forms = shuffle(r, [0, 1, 2]);
    const items = vals.map((v, i): Item => {
      const t = Math.floor(v / 10);
      const o = v % 10;
      const f = forms[i];
      if (f === 1 && o === 0) return { label: `${t} TENS`, value: v };
      if (f === 1) return { label: `${t * 10}+${o}`, value: v };
      if (f === 2) return { label: `${t} TENS ${o}`, value: v };
      return { label: String(v), value: v };
    });
    return valueSeq(
      {
        key: "tens", grade: g, standard: "NC.1.NBT.2", skill: "Tens and ones", title: "TENS AND ONES", items,
        passage: "\"4 TENS 5\" means 4 tens and 5 ones.",
        say: (l) => (/TENS \d/.test(l) ? l.replace(/(\d) TENS (\d)/, "$1 tens and $2 ones").toLowerCase() : l.toLowerCase()),
      },
      r,
    );
  },
};

function addSubItems(r: Rand, n: number, max: number, withSub: boolean): Item[] {
  const vals = distinctInts(r, n, 2, max);
  return vals.map((v) => {
    if (withSub && r() < 0.5) {
      const b = ri(r, 1, 9);
      return { label: `${v + b}−${b}`, value: v };
    }
    const a = ri(r, 1, v - 1);
    return { label: `${a}+${v - a}`, value: v };
  });
}

const sums: MathKind = {
  key: "sums",
  grades: ["1"],
  make: (g, r) => valueSeq({ key: "sums", grade: g, standard: "NC.1.OA.6", skill: "Add within 20", title: "ORDER THE SUMS", items: addSubItems(r, 3, 18, false) }, r),
};

const addSub: MathKind = {
  key: "addsub",
  grades: ["2"],
  make: (g, r) =>
    valueSeq({ key: "addsub", grade: g, standard: "NC.2.OA.2", skill: "Add and subtract within 20", title: "SUMS AND DIFFERENCES", items: addSubItems(r, 3, 19, true) }, r),
};

const threeDigit: MathKind = {
  key: "3dig",
  grades: ["2"],
  make: (g, r) => {
    // Same hundreds digit for two of them (and sometimes a swapped-digits pair like 425 / 452).
    let vals: number[];
    do {
      const h = ri(r, 1, 8);
      const t = ri(r, 1, 9);
      const o = ri(r, 1, 9);
      vals = [h * 100 + t * 10 + o, r() < 0.5 ? h * 100 + o * 10 + t : h * 100 + ri(r, 0, 99), ri(r, 1, 9) * 100 + ri(r, 0, 99)];
    } while (new Set(vals).size < 3);
    return valueSeq(
      { key: "3dig", grade: g, standard: "NC.2.NBT.4", skill: "Compare three-digit numbers", title: "THREE-DIGIT NUMBERS", items: intItems(vals), desc: r() < 0.25 },
      r,
    );
  },
};

const skipCount: MathKind = {
  key: "skip",
  grades: ["2"],
  make: (g, r) => {
    const step = [5, 10, 100][ri(r, 0, 2)];
    const start = step * ri(r, 1, step === 100 ? 7 : 15);
    return valueSeq(
      { key: "skip", grade: g, standard: "NC.2.NBT.2", skill: "Skip-count", title: `SKIP-COUNT BY ${step}S`, items: intItems([start, start + step, start + 2 * step]) },
      r,
    );
  },
};

function clockLabel(mins: number): string {
  const h24 = Math.floor(mins / 60);
  const m = mins % 60;
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${String(m).padStart(2, "0")} ${h24 < 12 ? "AM" : "PM"}`;
}
const clockTimes: MathKind = {
  key: "clock",
  grades: ["2"],
  make: (g, r) => {
    // Times between 6:00 AM and 9:55 PM, 5-minute steps, at least an hour apart.
    const mins = distinctInts(r, 3, 72, 263, 12).map((v) => v * 5);
    const items = mins.map((v) => ({ label: clockLabel(v), value: v }));
    return valueSeq(
      {
        key: "clock", grade: g, standard: "NC.2.MD.7", skill: "Time: a.m. and p.m.", title: "TIMES IN ONE DAY", items,
        passage: "AM is morning. PM is afternoon and night.",
        say: (l) => l.replace(":00", " o'clock").replace("AM", "a.m.").replace("PM", "p.m."),
      },
      r,
    );
  },
};

const coins: MathKind = {
  key: "coins",
  grades: ["2"],
  make: (g, r) => {
    const pool: Item[] = [{ label: "QUARTER", value: 25 }];
    for (let n = 1; n <= 9; n++) {
      pool.push({ label: n === 1 ? "1 DIME" : `${n} DIMES`, value: 10 * n });
      pool.push({ label: n === 1 ? "1 NICKEL" : `${n} NICKELS`, value: 5 * n });
    }
    const items = pickItems(r, pool, 3)!;
    return valueSeq(
      { key: "coins", grade: g, standard: "NC.2.MD.8", skill: "Coin values", title: "WHICH IS WORTH MORE?", items, passage: "Nickel = 5¢, dime = 10¢, quarter = 25¢.", unit: " (in cents)" },
      r,
    );
  },
};

/* ------------------------------ 3-5 ------------------------------ */

function fracItem(n: number, d: number): Item {
  return { label: `${n}/${d}`, value: n / d };
}

const products: MathKind = {
  key: "prod",
  grades: ["3"],
  make: (g, r) => {
    const pool: Item[] = [];
    for (let a = 2; a <= 10; a++) for (let b = 2; b <= 10; b++) pool.push({ label: `${a}×${b}`, value: a * b });
    return valueSeq({ key: "prod", grade: g, standard: "NC.3.OA.7", skill: "Multiplication facts", title: "ORDER THE PRODUCTS", items: pickItems(r, pool, 4, 2)! }, r);
  },
};

const unitFractions: MathKind = {
  key: "unitfr",
  grades: ["3"],
  make: (g, r) => {
    const pool = [2, 3, 4, 6, 8].map((d) => fracItem(1, d));
    return valueSeq(
      { key: "unitfr", grade: g, standard: "NC.3.NF.3", skill: "Compare unit fractions", title: "UNIT FRACTIONS", items: pickItems(r, pool, 4)!, desc: r() < 0.3, passage: "More equal parts means each part is smaller." },
      r,
    );
  },
};

const sameParts: MathKind = {
  key: "samefr",
  grades: ["3"],
  make: (g, r) => {
    let items: Item[];
    let passage: string;
    if (r() < 0.5) {
      const d = r() < 0.5 ? 6 : 8;
      items = distinctInts(r, 4, 1, d - 1).map((n) => fracItem(n, d));
      passage = "Same-size parts: compare how many parts.";
    } else {
      items = [3, 4, 6, 8].map((d) => fracItem(2, d));
      passage = "Same number of parts: bigger parts make a bigger fraction.";
    }
    return valueSeq({ key: "samefr", grade: g, standard: "NC.3.NF.3", skill: "Compare fractions", title: "COMPARE FRACTIONS", items, passage }, r);
  },
};

const bigNumbers: MathKind = {
  key: "bignum",
  grades: ["4"],
  make: (g, r) => {
    const lead = ri(r, 1, 8);
    const base = lead * 10000 + ri(r, 0, 9) * 1000;
    const vals = [base + ri(r, 100, 499), base + ri(r, 500, 999), base + ri(r, 0, 9) * 10, (lead + 1) * 10000 + ri(r, 0, 999)];
    const uniq = [...new Set(vals)];
    while (uniq.length < 4) uniq.push(uniq[uniq.length - 1] + 1001);
    return valueSeq(
      { key: "bignum", grade: g, standard: "NC.4.NBT.2", skill: "Compare multi-digit numbers", title: "BIG NUMBERS", items: intItems(uniq), desc: r() < 0.3 },
      r,
    );
  },
};

const unlikeFractions: MathKind = {
  key: "unlikefr",
  grades: ["4"],
  make: (g, r) => {
    const pool: Item[] = [];
    for (const d of [2, 3, 4, 5, 6, 8, 10, 12]) for (let n = 1; n < d; n++) if (gcd(n, d) === 1) pool.push(fracItem(n, d));
    return valueSeq(
      {
        key: "unlikefr", grade: g, standard: "NC.4.NF.2", skill: "Compare fractions with unlike denominators", title: "ORDER THE FRACTIONS",
        items: pickItems(r, pool, 4, 0.04)!, passage: "Tip: compare each fraction to 1/2, or use common denominators.",
      },
      r,
    );
  },
};

const decimals100: MathKind = {
  key: "dec100",
  grades: ["4"],
  make: (g, r) => {
    const t = ri(r, 1, 7);
    // A tenth and hundredths that start with the same digit, so place value matters.
    const vals = [t * 10, t * 10 + ri(r, 1, 9), ri(r, 1, 9), (t + ri(r, 1, 2)) * 10 + ri(r, 0, 9)];
    const uniq = [...new Set(vals)].filter((v) => v < 100);
    while (uniq.length < 4) uniq.push(99 - uniq.length);
    const items = uniq.map((v) => ({ label: num(v / 100), value: v / 100 }));
    return valueSeq({ key: "dec100", grade: g, standard: "NC.4.NF.7", skill: "Compare decimals", title: "ORDER THE DECIMALS", items, desc: r() < 0.3 }, r);
  },
};

const placeValue: MathKind = {
  key: "place",
  grades: ["4"],
  make: (g, r) => {
    const pool: Item[] = [];
    for (let k = 2; k <= 9; k++) {
      pool.push({ label: `${k} THOUSANDS`, value: k * 1000 });
      pool.push({ label: `${k} HUNDREDS`, value: k * 100 });
    }
    for (const k of [12, 15, 25, 30, 45, 60, 80]) pool.push({ label: `${k} HUNDREDS`, value: k * 100 });
    for (const k of [15, 25, 40, 55, 70, 90, 120, 350]) pool.push({ label: `${k} TENS`, value: k * 10 });
    for (let i = 0; i < 4; i++) {
      const v = ri(r, 3, 95) * 100 + ri(r, 0, 99);
      pool.push({ label: String(v), value: v });
    }
    return valueSeq({ key: "place", grade: g, standard: "NC.4.NBT.1", skill: "Place value", title: "PLACE VALUE", items: pickItems(r, pool, 4, 1)! }, r);
  },
};

const measure: MathKind = {
  key: "measure",
  grades: ["4"],
  make: (g, r) => {
    let pool: Item[];
    let passage: string;
    let unit: string;
    if (r() < 0.5) {
      pool = [];
      for (let n = 1; n <= 4; n++) pool.push({ label: n === 1 ? "1 YARD" : `${n} YARDS`, value: 36 * n });
      for (let n = 1; n <= 9; n++) pool.push({ label: n === 1 ? "1 FOOT" : `${n} FEET`, value: 12 * n });
      for (const n of [10, 20, 30, 40, 50, 60, 80, 100]) pool.push({ label: `${n} INCHES`, value: n });
      passage = "1 foot = 12 inches. 1 yard = 3 feet = 36 inches.";
      unit = "";
    } else {
      pool = [];
      for (let n = 1; n <= 5; n++) pool.push({ label: `${n} M`, value: 100 * n });
      for (const n of [50, 120, 150, 250, 320, 450, 80]) pool.push({ label: `${n} CM`, value: n });
      for (const n of [600, 900, 1500, 3000]) pool.push({ label: `${n} MM`, value: n / 10 });
      passage = "1 m = 100 cm. 1 cm = 10 mm.";
      unit = "";
    }
    return valueSeq(
      { key: "measure", grade: g, standard: "NC.4.MD.1", skill: "Measurement units", title: "SHORTEST TO LONGEST", items: pickItems(r, pool, 4, 1)!, passage, unit },
      r,
    );
  },
};

const decimals1000: MathKind = {
  key: "dec1000",
  grades: ["5"],
  make: (g, r) => {
    const a = ri(r, 1, 8);
    const b = ri(r, 0, 9);
    // e.g. 0.4, 0.45, 0.405, 0.045 — same digits, different places.
    const cand = [a * 100, a * 100 + b * 10 + ri(r, 1, 9), a * 100 + ri(r, 1, 9), a * 10 + b, a * 100 + b * 10, (a + 1) * 100 + ri(r, 0, 99)];
    const uniq = [...new Set(cand)].filter((v) => v > 0 && v < 1000);
    for (let v = a * 100 + 55; uniq.length < 4; v += 7) if (!uniq.includes(v)) uniq.push(v);
    const pick = shuffle(r, uniq).slice(0, 4);
    const items = pick.map((v) => ({ label: num(v / 1000), value: v / 1000 }));
    return valueSeq({ key: "dec1000", grade: g, standard: "NC.5.NBT.3", skill: "Compare decimals to thousandths", title: "ORDER THE DECIMALS", items, desc: r() < 0.3 }, r);
  },
};

/** Order of operations with every step feeding the next, so only one order works. */
function opsChain(r: Rand, level: "5" | "6"): { expr: string; steps: string[]; notes: string[]; answer: number } {
  for (;;) {
    const t = ri(r, 0, level === "5" ? 2 : 3);
    if (t === 0) {
      // [(a + b) × c − d] ÷ e
      const a = ri(r, 2, 9), b = ri(r, 2, 9), c = ri(r, 2, 6), e = ri(r, 2, 5);
      const s1 = a + b, s2 = s1 * c;
      const k = Math.floor(s2 / e) - ri(r, 1, 3);
      const d = s2 - e * k;
      if (d < 1 || d > 20 || k < 2) continue;
      return {
        expr: `[(${a}+${b})×${c}−${d}]÷${e}`,
        steps: [`${a}+${b}=${s1}`, `${s1}×${c}=${s2}`, `${s2}−${d}=${s2 - d}`, `${s2 - d}÷${e}=${k}`],
        notes: ["Parentheses first.", "Then multiply inside the brackets.", "Then subtract inside the brackets.", "Divide last: the brackets are done."],
        answer: k,
      };
    }
    if (t === 1) {
      // a × [b + (c − d)] − e
      const c = ri(r, 5, 12), d = ri(r, 1, c - 1), b = ri(r, 2, 9), a = ri(r, 2, 6);
      const s1 = c - d, s2 = b + s1, s3 = a * s2, e = ri(r, 1, 9);
      if (s3 - e < 0) continue;
      return {
        expr: `${a}×[${b}+(${c}−${d})]−${e}`,
        steps: [`${c}−${d}=${s1}`, `${b}+${s1}=${s2}`, `${a}×${s2}=${s3}`, `${s3}−${e}=${s3 - e}`],
        notes: ["Innermost parentheses first.", "Then finish the brackets.", "Multiply before subtracting.", "Subtract last."],
        answer: s3 - e,
      };
    }
    if (t === 2) {
      // a + b × (c + d) ÷ e
      const c = ri(r, 1, 9), d = ri(r, 1, 9), b = ri(r, 2, 6);
      const s1 = c + d, s2 = b * s1;
      const divs = [2, 3, 4, 5, 6].filter((x) => s2 % x === 0 && s2 / x > 1);
      if (!divs.length) continue;
      const e = divs[ri(r, 0, divs.length - 1)];
      const s3 = s2 / e, a = ri(r, 2, 20);
      return {
        expr: `${a}+${b}×(${c}+${d})÷${e}`,
        steps: [`${c}+${d}=${s1}`, `${b}×${s1}=${s2}`, `${s2}÷${e}=${s3}`, `${a}+${s3}=${a + s3}`],
        notes: ["Parentheses first.", "Multiply and divide from left to right.", "Divide before adding.", "Add last."],
        answer: a + s3,
      };
    }
    // (a + b)² × c − d  (grade 6: exponents)
    const a = ri(r, 1, 5), b = ri(r, 1, 5), c = ri(r, 2, 4);
    const s1 = a + b;
    if (s1 > 9) continue;
    const s2 = s1 * s1, s3 = s2 * c, d = ri(r, 1, 30);
    if (s3 - d < 0) continue;
    return {
      expr: `(${a}+${b})²×${c}−${d}`,
      steps: [`${a}+${b}=${s1}`, `${s1}²=${s2}`, `${s2}×${c}=${s3}`, `${s3}−${d}=${s3 - d}`],
      notes: ["Parentheses first.", "Then the exponent.", "Multiply before subtracting.", "Subtract last."],
      answer: s3 - d,
    };
  }
}

const opsSteps5: MathKind = {
  key: "ops5",
  grades: ["5"],
  make: (g, r) => {
    const o = opsChain(r, "5");
    return stepSeq(
      {
        key: "ops5", grade: g, standard: "NC.5.OA.1", skill: "Order of operations", title: `EVALUATE ${o.expr}`, steps: o.steps, notes: o.notes,
        passage: `Evaluate ${o.expr}. Stack the steps in the order you do them.`,
        explain: `${o.expr} = ${o.answer}. Grouping symbols first (inside out), then × and ÷, then + and −.`,
      },
      r,
    );
  },
};

/* ------------------------------ 6-8 ------------------------------ */

const integers: MathKind = {
  key: "int",
  grades: ["6"],
  make: (g, r) => {
    const n = stepCount(g, r);
    let vals: number[];
    do vals = distinctInts(r, n, -15, 12);
    while (vals.filter((v) => v < 0).length < 2);
    return valueSeq(
      { key: "int", grade: g, standard: "NC.6.NS.7", skill: "Order integers", title: "ORDER THE INTEGERS", items: intItems(vals), desc: r() < 0.3, passage: "On a number line, numbers to the left are less." },
      r,
    );
  },
};

const rationals: MathKind = {
  key: "rat",
  grades: ["6", "7"],
  make: (g, r) => {
    const pool: Item[] = [];
    for (const [n, d] of [[1, 2], [1, 3], [2, 3], [1, 4], [3, 4], [1, 5], [2, 5], [3, 5], [5, 4], [3, 2], [7, 4]]) {
      pool.push(fracItem(n, d), { label: `−${n}/${d}`, value: -n / d });
    }
    for (const v of [0.1, 0.3, 0.45, 0.6, 0.8, 1.2, 1.6, 2.5]) pool.push({ label: num(v), value: v }, { label: num(-v), value: -v });
    return valueSeq(
      { key: "rat", grade: g, standard: g === "7" ? "NC.7.NS.2" : "NC.6.NS.7", skill: "Order rational numbers", title: "ORDER THE RATIONAL NUMBERS", items: pickItems(r, pool, stepCount(g, r), 0.04)! },
      r,
    );
  },
};

const absValues: MathKind = {
  key: "abs",
  grades: ["6"],
  make: (g, r) => {
    const pool: Item[] = [];
    for (let v = 1; v <= 12; v++) pool.push({ label: `|−${v}|`, value: v }, { label: `|${v}|`, value: v }, { label: `−${v}`, value: -v }, { label: String(v), value: v });
    return valueSeq(
      { key: "abs", grade: g, standard: "NC.6.NS.7", skill: "Absolute value", title: "ORDER THE VALUES", items: pickItems(r, pool, stepCount(g, r), 0.5)!, passage: "|−8| means the distance from −8 to 0, which is 8." },
      r,
    );
  },
};

const powers: MathKind = {
  key: "pow",
  grades: ["6"],
  make: (g, r) => {
    const pool: Item[] = [];
    for (let b = 2; b <= 10; b++) for (let e = 2; e <= 5; e++) if (b ** e <= 1000) pool.push({ label: `${b}${sup(e)}`, value: b ** e });
    return valueSeq(
      {
        key: "pow", grade: g, standard: "NC.6.EE.1", skill: "Whole-number exponents", title: "ORDER THE POWERS", items: pickItems(r, pool, stepCount(g, r), 1)!,
        passage: "2⁵ means 2×2×2×2×2 = 32.",
      },
      r,
    );
  },
};

const opsSteps6: MathKind = {
  key: "ops6",
  grades: ["6"],
  make: (g, r) => {
    let o = opsChain(r, "6");
    for (let t = 0; t < 20 && !o.expr.includes("²"); t++) o = opsChain(r, "6");
    return stepSeq(
      {
        key: "ops6", grade: g, standard: "NC.6.EE.2", skill: "Order of operations", title: `EVALUATE ${o.expr}`, steps: o.steps, notes: o.notes,
        passage: `Evaluate ${o.expr}. Stack the steps in the order you do them.`,
        explain: `${o.expr} = ${o.answer}. Grouping symbols, then exponents, then × and ÷, then + and −.`,
      },
      r,
    );
  },
};

const twoStep: MathKind = {
  key: "2step",
  grades: ["7"],
  make: (g, r) => {
    const x = ri(r, -6, 9) || 4;
    const a = ri(r, 2, 6);
    if (r() < 0.5) {
      const b = ri(r, 1, 12) * (r() < 0.3 ? -1 : 1);
      const c = a * x + b;
      const steps = [`${a}x${signed(b)}=${num(c)}`, `${a}x=${num(c - b)}`, `x=${num(x)}`, `${a}(${num(x)})${signed(b)}=${num(c)}`];
      return stepSeq(
        {
          key: "2step", grade: g, standard: "NC.7.EE.4", skill: "Solve two-step equations", title: `SOLVE ${steps[0]}`, steps,
          notes: ["Start from the equation.", b > 0 ? `Subtract ${b} from both sides.` : `Add ${-b} to both sides.`, `Divide both sides by ${a}.`, "Check: put the answer back in."],
          passage: `Solve ${steps[0]}. Stack the steps from the equation to the check.`,
          explain: `${b > 0 ? `Subtract ${b}` : `Add ${-b}`}, then divide by ${a}: x = ${num(x)}. Checking: ${steps[3]}.`,
        },
        r,
      );
    }
    const b = ri(r, 1, 8);
    const c = a * (x + b);
    const steps = [`${a}(x+${b})=${num(c)}`, `x+${b}=${num(c / a)}`, `x=${num(x)}`, `${a}(${num(x)}+${b})=${num(c)}`];
    return stepSeq(
      {
        key: "2step", grade: g, standard: "NC.7.EE.4", skill: "Solve two-step equations", title: `SOLVE ${steps[0]}`, steps,
        notes: ["Start from the equation.", `Divide both sides by ${a}.`, `Subtract ${b} from both sides.`, "Check: put the answer back in."],
        passage: `Solve ${steps[0]}. Stack the steps from the equation to the check.`,
        explain: `Divide by ${a}, then subtract ${b}: x = ${num(x)}. Checking: ${steps[3]}.`,
      },
      r,
    );
  },
};

const fdp: MathKind = {
  key: "fdp",
  grades: ["6", "7"],
  make: (g, r) => {
    const pool: Item[] = [];
    for (const [n, d] of [[1, 2], [1, 4], [3, 4], [1, 5], [2, 5], [3, 5], [4, 5], [1, 3], [2, 3], [1, 8], [3, 8], [7, 10], [9, 10]]) pool.push(fracItem(n, d));
    for (const p of [5, 12, 18, 30, 35, 45, 55, 62, 68, 72, 85, 95]) pool.push({ label: `${p}%`, value: p / 100 });
    for (const v of [0.08, 0.15, 0.28, 0.42, 0.52, 0.58, 0.64, 0.7, 0.78, 0.9]) pool.push({ label: num(v), value: v });
    return valueSeq(
      { key: "fdp", grade: g, standard: "NC.6.RP.3", skill: "Fractions, decimals and percents", title: "FRACTIONS, DECIMALS, PERCENTS", items: pickItems(r, pool, stepCount(g, r), 0.025)!, passage: "Change each to a decimal or percent to compare." },
      r,
    );
  },
};

const sciNotation: MathKind = {
  key: "sci",
  grades: ["8"],
  make: (g, r) => {
    const pool: Item[] = [];
    for (const m of [1.2, 2, 2.5, 3.1, 4, 4.8, 5.5, 6.2, 7, 8.4, 9.1]) {
      for (const e of [-3, -2, 2, 3, 4, 5, 6]) pool.push({ label: `${num(m)}×10${sup(e)}`, value: m * 10 ** e });
    }
    const n = stepCount(g, r);
    // Two items share an exponent so the first factor matters too.
    let items: Item[] | null = null;
    for (let t = 0; t < 100 && !items; t++) {
      const pick = pickItems(r, pool, n, 0)!;
      const exps = pick.map((p) => p.label.slice(p.label.indexOf("10")));
      if (new Set(exps).size < n) items = pick;
    }
    return valueSeq(
      {
        key: "sci", grade: g, standard: "NC.8.EE.3", skill: "Scientific notation", title: "SCIENTIFIC NOTATION", items: items ?? pickItems(r, pool, n)!,
        passage: "Compare the powers of 10 first, then the first factors.",
      },
      r,
    );
  },
};

const irrationals: MathKind = {
  key: "irr",
  grades: ["8"],
  make: (g, r) => {
    const pool: Item[] = [];
    for (const n of [2, 3, 5, 6, 7, 8, 10, 11, 13, 15, 17, 20, 24, 30]) pool.push({ label: `√${n}`, value: Math.sqrt(n) });
    pool.push({ label: "π", value: Math.PI }, { label: "2π", value: 2 * Math.PI });
    for (const v of [1.5, 2.5, 3, 3.3, 3.8, 4.2, 4.6, 5, 5.2]) pool.push({ label: num(v), value: v });
    return valueSeq(
      { key: "irr", grade: g, standard: "NC.8.NS.2", skill: "Compare irrational numbers", title: "ESTIMATE AND ORDER", items: pickItems(r, pool, stepCount(g, r), 0.12)!, passage: "Estimate each root between two whole numbers: √10 is a little more than 3." },
      r,
    );
  },
};

const bothSides: MathKind = {
  key: "both",
  grades: ["8"],
  make: (g, r) => {
    for (;;) {
      const x = ri(r, -5, 8) || 3;
      const c = ri(r, 1, 4);
      const k = ri(r, 2, 4); // a − c
      const a = c + k;
      const b = ri(r, -9, 9) || -3;
      const d = a * x + b - c * x;
      if (d === 0) continue;
      const steps = [`${a}x${signed(b)}=${coefX(c)}${signed(d)}`, `${k}x${signed(b)}=${num(d)}`, `${k}x=${num(d - b)}`, `x=${num(x)}`];
      if (steps.some((s) => s.length > 12)) continue;
      return stepSeq(
        {
          key: "both", grade: g, standard: "NC.8.EE.7", skill: "Variables on both sides", title: `SOLVE ${steps[0]}`, steps,
          notes: ["Start from the equation.", `Subtract ${coefX(c)} from both sides.`, b > 0 ? `Subtract ${b} from both sides.` : `Add ${-b} to both sides.`, `Divide both sides by ${k}.`],
          passage: `Solve ${steps[0]}. Stack the steps from the equation to the answer.`,
          explain: `Get x on one side, then undo the constant, then divide: x = ${num(x)}.`,
        },
        r,
      );
    }
  },
};

/* ------------------------------ 9-12 ------------------------------ */

const multiStep: MathKind = {
  key: "multi",
  grades: ["9", "10"],
  make: (g, r) => {
    for (;;) {
      const x = ri(r, -5, 9) || 2;
      const a = ri(r, 2, 5);
      const b = ri(r, 1, 6);
      const c = ri(r, 1, 12);
      const e = a * b - c;
      if (e === 0) continue;
      const d = a * x + e;
      const steps = [`${a}(x+${b})−${c}=${num(d)}`, `${a}x+${a * b}−${c}=${num(d)}`, `${a}x${signed(e)}=${num(d)}`, `${a}x=${num(d - e)}`, `x=${num(x)}`];
      if (steps.some((s) => s.length > 12)) continue;
      return stepSeq(
        {
          key: "multi", grade: g, standard: "NC.M1.A-REI.1", skill: "Justify steps in solving equations", title: `SOLVE ${steps[0]}`, steps,
          notes: ["Start from the equation.", "Distributive property.", "Combine like terms.", e > 0 ? `Subtract ${e} from both sides.` : `Add ${-e} to both sides.`, `Divide both sides by ${a}.`],
          passage: `Solve ${steps[0]}. Stack each step of the solution.`,
          explain: `Distribute, combine like terms, undo the constant, then divide by ${a}: x = ${num(x)}.`,
        },
        r,
      );
    }
  },
};

const ratExp: MathKind = {
  key: "ratexp",
  grades: ["9", "10"],
  make: (g, r) => {
    const pool: Item[] = [
      { label: "2⁻¹", value: 0.5 }, { label: "2⁻²", value: 0.25 }, { label: "10⁻¹", value: 0.1 }, { label: "5⁰", value: 1 },
      { label: "4^(1/2)", value: 2 }, { label: "27^(1/3)", value: 3 }, { label: "16^(1/2)", value: 4 }, { label: "25^(1/2)", value: 5 },
      { label: "8^(2/3)", value: 4 }, { label: "16^(3/4)", value: 8 }, { label: "9^(3/2)", value: 27 }, { label: "4^(3/2)", value: 8 },
      { label: "32^(1/5)", value: 2 }, { label: "81^(1/4)", value: 3 }, { label: "3²", value: 9 }, { label: "2³", value: 8 },
      { label: "4^(−1/2)", value: 0.5 }, { label: "8^(1/3)", value: 2 }, { label: "100^(1/2)", value: 10 }, { label: "1000^(1/3)", value: 10 },
    ];
    return valueSeq(
      { key: "ratexp", grade: g, standard: g === "9" ? "NC.M1.N-RN.2" : "NC.M2.N-RN.2", skill: "Rational exponents", title: "RATIONAL EXPONENTS", items: pickItems(r, pool, stepCount(g, r), 0.01)!, passage: "a^(1/n) is the nth root of a. a^(m/n) is that root to the mth power. a⁰ = 1." },
      r,
    );
  },
};

const funcValues: MathKind = {
  key: "fvals",
  grades: ["9", "10"],
  make: (g, r) => {
    for (;;) {
      const b = ri(r, -4, 4);
      const c = ri(r, -5, 5);
      const f = (x: number) => x * x + b * x + c;
      const xs = shuffle(r, [-4, -3, -2, -1, 0, 1, 2, 3, 4]);
      const n = stepCount(g, r);
      const items: Item[] = [];
      for (const x of xs) {
        if (items.some((i) => i.value === f(x))) continue;
        items.push({ label: `f(${num(x)})`, value: f(x) });
        if (items.length === n) break;
      }
      if (items.length < n) continue;
      const fx = `x²${b === 0 ? "" : b === 1 ? "+x" : b === -1 ? "−x" : `${signed(b)}x`}${c === 0 ? "" : signed(c)}`;
      return valueSeq(
        { key: "fvals", grade: g, standard: "NC.M1.F-IF.2", skill: "Evaluate functions", title: `f(x)=${fx}`, items, passage: `f(x) = ${fx}. Work out each value, then stack them.`, say: (l) => l.replace("f(", "f of ").replace(")", "") },
        r,
      );
    }
  },
};

const completeSquare: MathKind = {
  key: "csq",
  grades: ["10", "11"],
  make: (g, r) => {
    for (;;) {
      const h = ri(r, -5, 5);
      const m = ri(r, 1, 7);
      if (h === 0) continue;
      const k = m * m - h * h;
      if (k === 0) continue;
      const lin = `x²${signed(2 * h)}x`;
      const r1 = -h + m, r2 = -h - m;
      const steps = [`${lin}=${num(k)}`, `${lin}+${h * h}=${m * m}`, `(x${signed(h)})²=${m * m}`, `x${signed(h)}=±${m}`, `x=${num(r1)} or ${num(r2)}`];
      if (steps.some((s) => s.length > 12)) continue;
      return stepSeq(
        {
          key: "csq", grade: g, standard: "NC.M2.A-REI.4", skill: "Complete the square", title: `SOLVE ${steps[0]}`, steps,
          notes: ["Start from the equation.", `Add (${num(2 * h)}÷2)² = ${h * h} to both sides.`, "Write the left side as a square.", "Take the square root of both sides.", `Solve both: x = ${num(r1)} or x = ${num(r2)}.`],
          passage: `Solve ${steps[0]} by completing the square.`,
          explain: `Add ${h * h} to both sides to make a perfect square, take square roots (±${m}), and solve: x = ${num(r1)} or ${num(r2)}.`,
        },
        r,
      );
    }
  },
};

const expEquation: MathKind = {
  key: "expeq",
  grades: ["11", "12"],
  make: (g, r) => {
    for (;;) {
      const base = [2, 3, 5][ri(r, 0, 2)];
      const n = base === 2 ? ri(r, 3, 6) : base === 3 ? ri(r, 2, 4) : ri(r, 2, 3);
      const a = ri(r, 1, n - 1);
      const x = n - a;
      const N = base ** n;
      const steps = [`${base}^(x+${a})=${N}`, `${base}^(x+${a})=${base}^${n}`, `x+${a}=${n}`, `x=${x}`];
      if (steps.some((s) => s.length > 12)) continue;
      return stepSeq(
        {
          key: "expeq", grade: g, standard: "NC.M3.F-LE.4", skill: "Solve exponential equations", title: `SOLVE ${steps[0]}`, steps,
          notes: ["Start from the equation.", `Write ${N} as a power of ${base}.`, "Same base, so the exponents are equal.", `Subtract ${a}.`],
          passage: `Solve ${steps[0]}. Stack each step.`,
          explain: `${N} = ${base}^${n}, so x + ${a} = ${n} and x = ${x}.`,
        },
        r,
      );
    }
  },
};

const logValues: MathKind = {
  key: "logs",
  grades: ["11", "12"],
  make: (g, r) => {
    const pool: Item[] = [];
    for (const [b, n] of [[2, 8], [2, 32], [2, 64], [3, 9], [3, 81], [3, 27], [5, 25], [5, 1], [4, 64], [7, 7], [2, 2], [10, 1000], [10, 100000]]) {
      pool.push({ label: b === 10 ? `log ${n}` : `log${sub(b)} ${n}`, value: Math.round(Math.log(n) / Math.log(b)) });
    }
    pool.push({ label: "log₂ 0.5", value: -1 }, { label: "log 0.01", value: -2 }, { label: "ln 1", value: 0 });
    return valueSeq(
      {
        key: "logs", grade: g, standard: "NC.M3.F-LE.4", skill: "Evaluate logarithms", title: "ORDER THE LOGARITHMS", items: pickItems(r, pool, stepCount(g, r), 0.5)!,
        passage: "log₂ 8 asks: 2 to what power is 8? (3). \"log\" alone is base 10.",
        say: (l) => l.replace(/log([₀-₉]+) /, (_m, s: string) => `log base ${[...s].map((c) => "₀₁₂₃₄₅₆₇₈₉".indexOf(c)).join("")} of `),
      },
      r,
    );
  },
};

const radicalEq: MathKind = {
  key: "radeq",
  grades: ["11", "12"],
  make: (g, r) => {
    for (;;) {
      const a = ri(r, -6, 9) || 3;
      const b = ri(r, 2, 7);
      const x = b * b - a;
      const steps = [`√(x${signed(a)})=${b}`, `x${signed(a)}=${b * b}`, `x=${num(x)}`, `√${b * b}=${b}`];
      if (steps.some((s) => s.length > 12)) continue;
      return stepSeq(
        {
          key: "radeq", grade: g, standard: "NC.M3.A-REI.2", skill: "Solve radical equations", title: `SOLVE ${steps[0]}`, steps,
          notes: ["Start from the equation.", "Square both sides.", a > 0 ? `Subtract ${a}.` : `Add ${-a}.`, "Check for extraneous solutions."],
          passage: `Solve ${steps[0]}. Stack each step, ending with the check.`,
          explain: `Square both sides, solve (x = ${num(x)}), then check: √(${num(x)}${signed(a)}) = √${b * b} = ${b}, so it is not extraneous.`,
        },
        r,
      );
    }
  },
};

const trigValues: MathKind = {
  key: "trig",
  grades: ["11", "12"],
  make: (g, r) => {
    const pool: Item[] = [];
    const rad = (d: number) => (d * Math.PI) / 180;
    for (const d of [0, 30, 45, 60, 90, 120, 150, 180, 210, 270]) pool.push({ label: `sin ${d}°`, value: Math.round(Math.sin(rad(d)) * 1e6) / 1e6 });
    for (const d of [0, 45, 60, 90, 120, 135, 180]) pool.push({ label: `cos ${d}°`, value: Math.round(Math.cos(rad(d)) * 1e6) / 1e6 });
    return valueSeq(
      { key: "trig", grade: g, standard: "NC.M3.F-TF.2", skill: "Unit-circle values", title: "ORDER THE TRIG VALUES", items: pickItems(r, pool, stepCount(g, r), 0.05)!, passage: "Use the unit circle: sine is the y-value, cosine is the x-value.", say: (l) => l.replace("°", " degrees") },
      r,
    );
  },
};

const radians: MathKind = {
  key: "rad",
  grades: ["11", "12"],
  make: (g, r) => {
    const pool: Item[] = [];
    for (const [n, d] of [[1, 6], [1, 4], [1, 3], [1, 2], [2, 3], [3, 4], [5, 6], [1, 1], [7, 6], [5, 4], [4, 3], [3, 2], [5, 3], [2, 1]]) {
      const label = `${n === 1 ? "" : n}π${d === 1 ? "" : `/${d}`}`;
      pool.push({ label, value: (n / d) * Math.PI });
    }
    for (const v of [1, 2, 3, 4, 5]) pool.push({ label: `${v} rad`, value: v });
    return valueSeq(
      { key: "rad", grade: g, standard: "NC.M3.F-TF.1", skill: "Radian measure", title: "ORDER THE ANGLES", items: pickItems(r, pool, stepCount(g, r), 0.08)!, passage: "π radians = 180°. π is about 3.14.", say: (l) => l.replace("π", " pi ").replace("/", " over ") },
      r,
    );
  },
};

export const MATH_KINDS: MathKind[] = [
  countOn, compare10, teens, sums5, compare100, tensOnes, sums, addSub, threeDigit, skipCount, clockTimes, coins,
  products, unitFractions, sameParts, bigNumbers, unlikeFractions, decimals100, placeValue, measure, decimals1000, opsSteps5,
  integers, rationals, absValues, powers, opsSteps6, twoStep, fdp, sciNotation, irrationals, bothSides,
  multiStep, ratExp, funcValues, completeSquare, expEquation, logValues, radicalEq, trigValues, radians,
];

const ORDER: Grade[] = ["K", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];
const BAND_START: Grade[] = ["K", "3", "6", "9"];

/** Kinds written for this grade. */
export function ownMathKinds(grade: Grade): MathKind[] {
  return MATH_KINDS.filter((k) => k.grades.includes(grade));
}
/** Review kinds: earlier grades in the same band (e.g. grade 5 also reviews grade 3-4 kinds). */
export function reviewMathKinds(grade: Grade): MathKind[] {
  const gi = ORDER.indexOf(grade);
  const start = ORDER.indexOf([...BAND_START].reverse().find((b) => ORDER.indexOf(b) <= gi)!);
  const earlier = ORDER.slice(start, gi);
  return MATH_KINDS.filter((k) => !k.grades.includes(grade) && k.grades.some((kg) => earlier.includes(kg)));
}
