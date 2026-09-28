/*
 * Shared helpers for the math question generators: randomness, exact number
 * formatting (integers, fractions, decimals, powers) and the Draft -> Question builder.
 */

export function randInt(min: number, max: number): number {
  return min + Math.floor(Math.random() * (max - min + 1));
}

export function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function shuffle<T>(arr: readonly T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function chance(p = 0.5): boolean {
  return Math.random() < p;
}

/** A random nonzero integer in [min, max]. */
export function nz(min: number, max: number): number {
  let v = 0;
  while (v === 0) v = randInt(min, max);
  return v;
}

/** `count` distinct random integers from [min, max]. */
export function distinctInts(count: number, min: number, max: number): number[] {
  const s = new Set<number>();
  while (s.size < count) s.add(randInt(min, max));
  return [...s];
}

export const MINUS = "−";
export const PI = "π";

// ---------------------------------------------------------------- integers

/** Integer with a real minus sign and thousands commas (1,234). */
export function n(v: number): string {
  if (!Number.isFinite(v)) throw new Error(`bad number ${v}`);
  const s = String(Math.abs(Math.round(v))).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return v < 0 ? MINUS + s : s;
}

/** Integer without commas (for years, clock pieces, small numbers in text). */
export function ns(v: number): string {
  return v < 0 ? MINUS + String(Math.abs(v)) : String(v);
}

/** A number wrapped in parentheses when negative: 3 × (−4). */
export function paren(v: number): string {
  return v < 0 ? `(${ns(v)})` : ns(v);
}

export function gcd(a: number, b: number): number {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) [a, b] = [b, a % b];
  return a;
}

export function lcm(a: number, b: number): number {
  return Math.abs(a * b) / gcd(a, b);
}

export function isPrime(v: number): boolean {
  if (v < 2) return false;
  for (let i = 2; i * i <= v; i++) if (v % i === 0) return false;
  return true;
}

const SUP: Record<string, string> = {
  "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴",
  "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹", "-": "⁻",
};
const SUB: Record<string, string> = {
  "0": "₀", "1": "₁", "2": "₂", "3": "₃", "4": "₄",
  "5": "₅", "6": "₆", "7": "₇", "8": "₈", "9": "₉",
};

/** Superscript an integer exponent: sup(-3) -> "⁻³". */
export function sup(k: number): string {
  return String(k).split("").map((c) => SUP[c] ?? c).join("");
}

/** Subscript digits (log bases): sub(2) -> "₂". */
export function sub(k: number): string {
  return String(k).split("").map((c) => SUB[c] ?? c).join("");
}

/** Power display: pow("x", 2) -> "x²", pow("3", 1) -> "3". */
export function pow(base: string | number, e: number): string {
  if (e === 1) return String(base);
  return `${base}${sup(e)}`;
}

// ---------------------------------------------------------------- fractions

export interface Frac {
  n: number;
  d: number;
}

export function fr(num: number, den: number): Frac {
  if (den === 0) throw new Error("zero denominator");
  if (den < 0) {
    num = -num;
    den = -den;
  }
  const g = gcd(num, den) || 1;
  return { n: num / g, d: den / g };
}

export function fadd(a: Frac, b: Frac): Frac {
  return fr(a.n * b.d + b.n * a.d, a.d * b.d);
}
export function fsub(a: Frac, b: Frac): Frac {
  return fr(a.n * b.d - b.n * a.d, a.d * b.d);
}
export function fmul(a: Frac, b: Frac): Frac {
  return fr(a.n * b.n, a.d * b.d);
}
export function fdiv(a: Frac, b: Frac): Frac {
  return fr(a.n * b.d, a.d * b.n);
}
export function feq(a: Frac, b: Frac): boolean {
  return a.n * b.d === b.n * a.d;
}

/** Reduced fraction text: "3/4", "−2/5", "3" for whole numbers. */
export function fstr(f: Frac): string {
  const r = fr(f.n, f.d);
  if (r.d === 1) return ns(r.n);
  return `${ns(r.n)}/${r.d}`;
}

/** Fraction text without reducing: raw(6, 8) -> "6/8". */
export function raw(num: number, den: number): string {
  return `${ns(num)}/${den}`;
}

/** Mixed-number text: "1 1/4", "3/4", "2", "−1 1/2". */
export function mixed(f: Frac): string {
  const r = fr(f.n, f.d);
  if (r.d === 1) return ns(r.n);
  const neg = r.n < 0;
  const a = Math.abs(r.n);
  const whole = Math.floor(a / r.d);
  const rest = a % r.d;
  const body = whole ? `${whole} ${rest}/${r.d}` : `${rest}/${r.d}`;
  return neg ? MINUS + body : body;
}

// ---------------------------------------------------------------- decimals

/** Exact decimal text for the scaled integer `m` × 10^−places: dec(345, 2) -> "3.45". */
export function dec(m: number, places: number): string {
  if (!Number.isInteger(m)) throw new Error(`dec needs an integer, got ${m}`);
  if (places <= 0) return n(m * 10 ** -places);
  const neg = m < 0;
  let s = String(Math.abs(m)).padStart(places + 1, "0");
  let whole = s.slice(0, s.length - places);
  let frac = s.slice(s.length - places).replace(/0+$/, "");
  whole = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  s = frac ? `${whole}.${frac}` : whole;
  return neg && s !== "0" ? MINUS + s : s;
}

/** Money from cents: "$3.50", "$12". */
export function money(cents: number): string {
  if (cents % 100 === 0) return `$${n(cents / 100)}`;
  return `$${n(Math.floor(cents / 100))}.${String(cents % 100).padStart(2, "0")}`;
}

// ---------------------------------------------------------------- algebra text

/**
 * A polynomial in `v` from coefficients, highest power first:
 * poly([2, -3, 1]) -> "2x² − 3x + 1".
 */
export function poly(coeffs: number[], v = "x"): string {
  const deg = coeffs.length - 1;
  let out = "";
  coeffs.forEach((c, i) => {
    if (c === 0) return;
    const p = deg - i;
    const abs = Math.abs(c);
    const body = p === 0 ? String(abs) : `${abs === 1 ? "" : abs}${pow(v, p)}`;
    if (out === "") out = (c < 0 ? MINUS : "") + body;
    else out += (c < 0 ? ` ${MINUS} ` : " + ") + body;
  });
  return out || "0";
}

/** m·x + b as text: lin(2, -3) -> "2x − 3". */
export function lin(m: number, b: number, v = "x"): string {
  return poly([m, b], v);
}

/** "x + 3" / "x − 3" (for factors). */
export function xPlus(k: number, v = "x"): string {
  return k === 0 ? v : k < 0 ? `${v} ${MINUS} ${-k}` : `${v} + ${k}`;
}

/** Joins "a" and a signed term: signed(5, -3) -> "5 − 3". */
export function signed(v: number): string {
  return v < 0 ? ` ${MINUS} ${-v}` : ` + ${v}`;
}

/** Simplest radical form of √m: "3√2", "5", "√7". */
export function radical(m: number, coeff = 1): string {
  let out = coeff;
  let inside = m;
  for (let f = 2; f * f <= inside; f++) {
    while (inside % (f * f) === 0) {
      inside /= f * f;
      out *= f;
    }
  }
  if (inside === 1) return ns(out);
  return `${out === 1 ? "" : ns(out)}√${inside}`;
}

/** Coefficient of π as text: piStr(fr(3,2)) -> "3π/2", 1 -> "π". */
export function piStr(f: Frac): string {
  const r = fr(f.n, f.d);
  if (r.n === 0) return "0";
  const sign = r.n < 0 ? MINUS : "";
  const a = Math.abs(r.n);
  const top = `${a === 1 ? "" : a}${PI}`;
  return r.d === 1 ? sign + top : `${sign}${top}/${r.d}`;
}

export function ord(k: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = k % 100;
  return k + (s[(v - 20) % 10] || s[v] || s[0]);
}

export function point(x: number, y: number): string {
  return `(${ns(x)}, ${ns(y)})`;
}

// ---------------------------------------------------------------- drafts

export interface Draft {
  prompt: string;
  answer: string;
  /** Distractor candidates, most plausible first. Duplicates and blanks are dropped. */
  wrong: string[];
  explanation: string;
  /** Makes one more random distractor when `wrong` runs short. */
  pad?: () => string;
}

export interface Gen {
  /** Short id slug, e.g. "nbt5". */
  key: string;
  standard: string;
  skill: string;
  /** False when this generator can never produce a quick item. */
  quick?: boolean;
  make: (quick: boolean) => Draft;
}

/** Numeric distractors near `ans` (never below `min`). */
export function padNum(ans: number, fmt: (v: number) => string = n, min = -Infinity, spread = [1, 2, 3, 10]) {
  return () => {
    const v = ans + pick(spread) * pick([-1, 1]) * (chance(0.2) ? 2 : 1);
    return v >= min ? fmt(v) : fmt(ans + pick(spread));
  };
}

/** Draft fields for a whole-number answer. */
export function nums(
  ans: number,
  wrong: number[],
  opts: { min?: number; fmt?: (v: number) => string; spread?: number[] } = {},
): Pick<Draft, "answer" | "wrong" | "pad"> {
  const fmt = opts.fmt ?? n;
  const min = opts.min ?? -Infinity;
  return {
    answer: fmt(ans),
    wrong: wrong.filter((w) => Number.isFinite(w) && Number.isInteger(w) && w >= min && w !== ans).map(fmt),
    pad: padNum(ans, fmt, min, opts.spread),
  };
}

/** Draft fields for a fraction answer; distractors with an equal value are dropped. */
export function fracs(
  ans: Frac,
  wrong: (Frac | null)[],
  fmt: (f: Frac) => string = fstr,
  opts: { positive?: boolean } = {},
): Pick<Draft, "answer" | "wrong" | "pad"> {
  const ok = (f: Frac | null): f is Frac =>
    !!f && f.d !== 0 && !feq(f, ans) && (!opts.positive || f.n / f.d > 0);
  const kept: Frac[] = [];
  for (const w of wrong) if (ok(w) && !kept.some((k) => feq(k, w))) kept.push(w);
  return {
    answer: fmt(ans),
    wrong: kept.map(fmt),
    pad: () => {
      const d = ans.d === 1 ? pick([2, 3, 4]) : ans.d;
      let f = fr(ans.n * (d / ans.d) + nz(-3, 3), d);
      if (opts.positive && f.n <= 0) f = fr(ans.n * (d / ans.d) + randInt(1, 4), d);
      return feq(f, ans) ? fmt(fr(ans.n + ans.d, ans.d)) : fmt(f);
    },
  };
}

/**
 * Draft fields for an unreduced fraction answer like "6/8" (elementary grades), with
 * distractors kept only when their value differs from the answer and from each other.
 */
export function rawFracs(ans: [number, number], cands: [number, number][]): Pick<Draft, "answer" | "wrong" | "pad"> {
  const seen: Frac[] = [fr(ans[0], ans[1])];
  const wrong: string[] = [];
  const tryAdd = ([a, b]: [number, number]) => {
    if (a <= 0 || b <= 0) return undefined;
    const f = fr(a, b);
    if (seen.some((s) => feq(s, f))) return undefined;
    seen.push(f);
    return raw(a, b);
  };
  for (const c of cands) {
    const s = tryAdd(c);
    if (s) wrong.push(s);
  }
  return {
    answer: raw(ans[0], ans[1]),
    wrong,
    pad: () => tryAdd([Math.max(1, ans[0] + nz(-2, 2)), ans[1] + pick([0, 0, 1, 2])]) ?? "",
  };
}

/** A pad function giving a nearby lattice point. */
export function padPoint(x: number, y: number): () => string {
  return () => point(x + nz(-2, 2), y + randInt(-2, 2));
}
