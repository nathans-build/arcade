/*
 * Exact numbers for City Shield: every value is (n / d) · √r with integers n, d and a
 * square-free r ≥ 1 (r = 1 for rational numbers). That covers whole numbers, fractions,
 * decimals, simplified radicals and the special-angle trig values, with no floating point.
 */

export interface Val {
  n: number;
  d: number;
  r: number;
}

export const MINUS = "−";

function gcd(a: number, b: number): number {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) [a, b] = [b, a % b];
  return a || 1;
}

function checkInt(...xs: number[]) {
  for (const x of xs) if (!Number.isSafeInteger(x)) throw new Error(`not a safe integer: ${x}`);
}

/** Largest k with k² dividing m, and what's left under the root. */
export function splitSquare(m: number): { out: number; inside: number } {
  let out = 1;
  let inside = m;
  for (let f = 2; f * f <= inside; f++) {
    while (inside % (f * f) === 0) {
      inside /= f * f;
      out *= f;
    }
  }
  return { out, inside };
}

export function mk(n: number, d = 1, r = 1): Val {
  checkInt(n, d, r);
  if (d === 0) throw new Error("division by zero");
  if (r < 1) throw new Error(`bad radicand ${r}`);
  const s = splitSquare(r);
  n *= s.out;
  r = s.inside;
  if (d < 0) {
    n = -n;
    d = -d;
  }
  const g = gcd(n, d);
  n /= g;
  d /= g;
  if (n === 0) return { n: 0, d: 1, r: 1 };
  return { n, d, r };
}

export const int = (k: number) => mk(k);
export const frac = (n: number, d: number) => mk(n, d);
/** k·√m, simplified. */
export const root = (m: number, k = 1) => mk(k, 1, m);

export function eq(a: Val, b: Val): boolean {
  return a.n === b.n && a.d === b.d && a.r === b.r;
}

export function isInt(a: Val): boolean {
  return a.r === 1 && a.d === 1;
}

export function add(a: Val, b: Val): Val {
  if (a.n === 0) return b;
  if (b.n === 0) return a;
  if (a.r !== b.r) throw new Error("can't add unlike radicals exactly");
  return mk(a.n * b.d + b.n * a.d, a.d * b.d, a.r);
}

export function neg(a: Val): Val {
  return mk(-a.n, a.d, a.r);
}

export function sub(a: Val, b: Val): Val {
  return add(a, neg(b));
}

export function mul(a: Val, b: Val): Val {
  // √r·√s = √(rs); mk() pulls out any square factor.
  return mk(a.n * b.n, a.d * b.d, a.r * b.r);
}

export function div(a: Val, b: Val): Val {
  if (b.n === 0) throw new Error("division by zero");
  // a / ((n/d)√r) = a · d√r / (n r)
  return mul(a, mk(b.d, b.n * b.r, b.r));
}

/** a^k for an integer k (rational a only). */
export function pow(a: Val, k: number): Val {
  if (a.r !== 1) throw new Error("pow of a radical");
  if (k < 0) return div(int(1), pow(a, -k));
  let n = 1;
  let d = 1;
  for (let i = 0; i < k; i++) {
    n *= a.n;
    d *= a.d;
  }
  return mk(n, d);
}

/** Approximate value (for display hints and tests only; never for equality). */
export function approx(a: Val): number {
  return (a.n / a.d) * Math.sqrt(a.r);
}

/* ------------------------------ formatting ------------------------------ */

export function fmtInt(k: number): string {
  return k < 0 ? MINUS + String(-k) : String(k);
}

/** "3", "−3/4", "5√2", "√3/2", "−2√3/3". */
export function fmt(a: Val): string {
  const sign = a.n < 0 ? MINUS : "";
  const n = Math.abs(a.n);
  let top: string;
  if (a.r === 1) top = String(n);
  else top = (n === 1 ? "" : String(n)) + "√" + a.r;
  return sign + (a.d === 1 ? top : `${top}/${a.d}`);
}

/** Exact decimal when the denominator divides a power of ten ("2.4", "0.25"), else a fraction. */
export function fmtDec(a: Val): string {
  if (a.r !== 1) return fmt(a);
  let places = 0;
  let p10 = 1;
  while (p10 % a.d !== 0) {
    places++;
    p10 *= 10;
    if (places > 8) return fmt(a);
  }
  const sign = a.n < 0 ? MINUS : "";
  const s = String(Math.abs(a.n) * (p10 / a.d)).padStart(places + 1, "0");
  if (places === 0) return sign + s;
  return `${sign}${s.slice(0, s.length - places)}.${s.slice(s.length - places)}`;
}

const SUPS = "⁰¹²³⁴⁵⁶⁷⁸⁹";
const SUBS = "₀₁₂₃₄₅₆₇₈₉";

export function supNum(k: number): string {
  return (k < 0 ? "⁻" : "") + [...String(Math.abs(k))].map((c) => SUPS[Number(c)]).join("");
}

export function subNum(k: number): string {
  return [...String(k)].map((c) => SUBS[Number(c)]).join("");
}

/** 2⁸, 5⁻², 10⁰ */
export function powLabel(base: number, k: number): string {
  return `${base}${supNum(k)}`;
}
