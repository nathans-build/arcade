/*
 * Money helpers. Every amount in Sidewalk Stand is an INTEGER number of cents; nothing is ever
 * stored as a floating-point dollar value, so there are no 0.1 + 0.2 money bugs.
 * Pure data and functions (no DOM), shared by the game and the tests.
 */
import type { Grade } from "@/kit/types";

export const MINUS = "−";

/** Small seeded random generator (mulberry32). Same seed → same game numbers. */
export type Rand = () => number;
export function rng(seed: number): Rand {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
/** Mixes numbers into one 32-bit seed. */
export function hashSeed(...parts: number[]): number {
  let h = 2166136261 >>> 0;
  for (const p of parts) {
    h ^= p >>> 0;
    h = Math.imul(h, 16777619) >>> 0;
    h ^= h >>> 13;
  }
  return h >>> 0;
}
export const ri = (r: Rand, lo: number, hi: number) => lo + Math.floor(r() * (hi - lo + 1));
export const pickR = <T>(r: Rand, a: readonly T[]): T => a[Math.floor(r() * a.length)];

/**
 * How a grade writes money: K–1 always in cents (75¢, 120¢); grades 2–3 use ¢ under a dollar
 * and $ from a dollar up; grades 4+ always use dollars and cents ($0.75).
 */
export type MoneyStyle = "cents" | "mixed" | "dollars";
export function styleFor(g: Grade): MoneyStyle {
  const n = g === "K" ? 0 : Number(g);
  return n <= 1 ? "cents" : n <= 3 ? "mixed" : "dollars";
}

/** $3.25, $12.00, $1,250.00 (always two decimals). */
export function dollars(c: number): string {
  if (!Number.isInteger(c)) throw new Error(`money must be whole cents, got ${c}`);
  const neg = c < 0;
  const a = Math.abs(c);
  const d = Math.floor(a / 100);
  const cc = a % 100;
  const ds = String(d).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `${neg ? MINUS : ""}$${ds}.${cc < 10 ? "0" : ""}${cc}`;
}

/** Formats integer cents in a style: 75¢ / $3.25. */
export function money(c: number, style: MoneyStyle = "dollars"): string {
  if (!Number.isInteger(c)) throw new Error(`money must be whole cents, got ${c}`);
  if (style === "cents" || (style === "mixed" && Math.abs(c) < 100)) return `${c < 0 ? MINUS : ""}${Math.abs(c)}¢`;
  return dollars(c);
}

/** Spoken form for read-aloud: "3 dollars and 25 cents". */
export function sayMoney(c: number): string {
  const a = Math.abs(c);
  const d = Math.floor(a / 100);
  const cc = a % 100;
  const parts: string[] = [];
  if (d) parts.push(`${d} dollar${d === 1 ? "" : "s"}`);
  if (cc || !d) parts.push(`${cc} cent${cc === 1 ? "" : "s"}`);
  return (c < 0 ? "minus " : "") + parts.join(" and ");
}

// ------------------------------------------------------------- coins and bills

export type PieceId = "penny" | "nickel" | "dime" | "quarter" | "bill1" | "bill5" | "bill10" | "bill20";
export const PIECE_VALUE: Record<PieceId, number> = {
  penny: 1,
  nickel: 5,
  dime: 10,
  quarter: 25,
  bill1: 100,
  bill5: 500,
  bill10: 1000,
  bill20: 2000,
};
export const PIECE_NAME: Record<PieceId, string> = {
  penny: "Penny",
  nickel: "Nickel",
  dime: "Dime",
  quarter: "Quarter",
  bill1: "$1 bill",
  bill5: "$5 bill",
  bill10: "$10 bill",
  bill20: "$20 bill",
};
export const COINS: PieceId[] = ["penny", "nickel", "dime", "quarter"];
export const BILLS: PieceId[] = ["bill1", "bill5", "bill10", "bill20"];

export function sumPieces(p: readonly PieceId[]): number {
  return p.reduce((a, x) => a + PIECE_VALUE[x], 0);
}

/** Sorts pieces biggest first (how you would lay money out to count it). */
export function sortPieces(p: PieceId[]): PieceId[] {
  return [...p].sort((a, b) => PIECE_VALUE[b] - PIECE_VALUE[a]);
}

/**
 * Exact payment of `amount` with a little variety: bills first (up to `maxBill`), then a
 * random mix of coins. At most `maxPieces` pieces (falls back to the fewest-pieces greedy mix).
 */
export function exactPieces(amount: number, r: Rand, maxBill: number, maxPieces = 8): PieceId[] {
  for (let attempt = 0; attempt < 20; attempt++) {
    const out: PieceId[] = [];
    let left = amount;
    for (const b of ["bill20", "bill10", "bill5", "bill1"] as PieceId[]) {
      const v = PIECE_VALUE[b];
      if (v > maxBill) continue;
      while (left >= v) {
        out.push(b);
        left -= v;
      }
    }
    for (const c of ["quarter", "dime", "nickel"] as PieceId[]) {
      const v = PIECE_VALUE[c];
      while (left >= v) {
        // Sometimes use smaller coins instead of a bigger one, for counting practice.
        if (attempt < 19 && c !== "nickel" && r() < 0.3) break;
        out.push(c);
        left -= v;
      }
    }
    while (left > 0) {
      out.push("penny");
      left--;
    }
    if (out.length <= maxPieces) return sortPieces(out);
  }
  return greedyPieces(amount, maxBill);
}

/** Fewest pieces for an amount (bills up to maxBill, then coins). */
export function greedyPieces(amount: number, maxBill = 2000): PieceId[] {
  const out: PieceId[] = [];
  let left = amount;
  for (const p of ["bill20", "bill10", "bill5", "bill1", "quarter", "dime", "nickel", "penny"] as PieceId[]) {
    const v = PIECE_VALUE[p];
    if (v >= 100 && v > maxBill) continue;
    while (left >= v) {
      out.push(p);
      left -= v;
    }
  }
  return out;
}

/** The smallest common bill (or bill pair) a customer would hand over for `total`. */
export function billFor(total: number, r: Rand, maxBill = 2000): number {
  const opts = [100, 200, 500, 1000, 2000].filter((b) => b > total && b <= Math.max(maxBill, 200));
  if (!opts.length) return Math.ceil((total + 1) / 500) * 500;
  // Usually the next bill up; sometimes the one after.
  return opts.length > 1 && r() < 0.25 ? opts[1] : opts[0];
}

/**
 * "Count up" steps from the price to the money paid (the way a cashier makes change):
 * coins up to the next quarter, quarters up to the next dollar, then dollars.
 * Returns the steps as [added, reachedTotal] pairs; the added amounts sum to paid − total.
 */
export function countUp(total: number, paid: number): [number, number][] {
  const steps: [number, number][] = [];
  let at = total;
  const go = (to: number) => {
    if (to > at && to <= paid) {
      steps.push([to - at, to]);
      at = to;
    }
  };
  go(Math.ceil(at / 5) * 5); // pennies to the next nickel
  if (at % 25) go(Math.ceil(at / 25) * 25); // nickels/dimes to the next quarter
  if (at % 100) go(Math.ceil(at / 100) * 100); // quarters to the next dollar
  if (at % 500 && paid - at >= 100) go(Math.min(paid, Math.ceil(at / 500) * 500)); // dollars to $5
  go(paid);
  return steps;
}

export function countUpText(total: number, paid: number, style: MoneyStyle): string {
  const steps = countUp(total, paid);
  return `Count up from ${money(total, style)}: ${steps.map(([a, to]) => `+${money(a, style)} makes ${money(to, style)}`).join(", ")}.`;
}
