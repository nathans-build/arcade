/*
 * Exact rational arithmetic for cell values, so fraction and decimal rows add up
 * exactly (0.1 + 0.2 really is 0.3 here). Values stay small, so plain numbers are safe.
 */

export interface Q {
  readonly n: number;
  readonly d: number;
}

function gcd(a: number, b: number): number {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) [a, b] = [b, a % b];
  return a || 1;
}

/** n/d in lowest terms with a positive denominator. Throws on anything non-integer. */
export function q(n: number, d = 1): Q {
  if (!Number.isSafeInteger(n) || !Number.isSafeInteger(d) || d === 0) throw new Error(`bad rational ${n}/${d}`);
  if (d < 0) {
    n = -n;
    d = -d;
  }
  const g = gcd(n, d);
  return { n: n / g || 0, d: d / g };
}

export const ZERO = q(0);
export const ONE = q(1);

export const add = (a: Q, b: Q) => q(a.n * b.d + b.n * a.d, a.d * b.d);
export const sub = (a: Q, b: Q) => q(a.n * b.d - b.n * a.d, a.d * b.d);
export const mul = (a: Q, b: Q) => q(a.n * b.n, a.d * b.d);
export const div = (a: Q, b: Q) => q(a.n * b.d, a.d * b.n);
export const eq = (a: Q, b: Q) => a.n === b.n && a.d === b.d;
export const cmp = (a: Q, b: Q) => a.n * b.d - b.n * a.d;
export const isInt = (a: Q) => a.d === 1;
export const toNumber = (a: Q) => a.n / a.d;
export const key = (a: Q) => `${a.n}/${a.d}`;

const MINUS = "−";

function sign(n: number) {
  return n < 0 ? MINUS : "";
}

/** "3", "−2", "5/6", "−7/4" */
export function fmtFrac(a: Q): string {
  if (a.d === 1) return sign(a.n) + Math.abs(a.n);
  return `${sign(a.n)}${Math.abs(a.n)}/${a.d}`;
}

/** Terminating decimals as decimals ("0.75"), anything else as a fraction. */
export function fmtDec(a: Q): string {
  if (a.d === 1) return fmtFrac(a);
  for (let k = 1, p = 10; k <= 6; k++, p *= 10) {
    if (p % a.d === 0) {
      const scaled = Math.abs(a.n) * (p / a.d);
      const whole = Math.floor(scaled / p);
      const frac = String(scaled % p).padStart(k, "0").replace(/0+$/, "");
      return `${sign(a.n)}${whole}.${frac}`;
    }
  }
  return fmtFrac(a);
}

/** Parses "3", "−3", "3/4", "0.25", "-1.5" exactly (used by tests and label checks). */
export function parseQ(s: string): Q {
  const t = s.replace(/−/g, "-").trim();
  if (/^-?\d+\/\d+$/.test(t)) {
    const [a, b] = t.split("/");
    return q(Number(a), Number(b));
  }
  if (/^-?\d*\.\d+$/.test(t)) {
    const neg = t.startsWith("-");
    const [w, f] = t.replace("-", "").split(".");
    const d = 10 ** f.length;
    const n = Number(w || "0") * d + Number(f);
    return q(neg ? -n : n, d);
  }
  if (/^-?\d+$/.test(t)) return q(Number(t));
  throw new Error(`not a number: ${s}`);
}
