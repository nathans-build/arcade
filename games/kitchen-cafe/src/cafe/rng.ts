/*
 * Seeded randomness (mulberry32) so the checker can replay any question from its seed,
 * plus the small helpers every generator uses. Pure TypeScript: no DOM.
 */

export type Rng = () => number;

export function makeRng(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function randSeed(): number {
  return Math.floor(Math.random() * 0x7fffffff);
}

export function int(r: Rng, min: number, max: number): number {
  return min + Math.floor(r() * (max - min + 1));
}

export function pick<T>(r: Rng, arr: readonly T[]): T {
  return arr[Math.floor(r() * arr.length)];
}

export function shuffle<T>(r: Rng, arr: readonly T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function gcd(a: number, b: number): number {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) [a, b] = [b, a % b];
  return a || 1;
}

/** "3/4", "1 1/2", "2" (proper or mixed number, simplified). */
export function frac(num: number, den: number): string {
  const g = gcd(num, den);
  num /= g;
  den /= g;
  if (den === 1) return String(num);
  const whole = Math.floor(num / den);
  const rest = num % den;
  return whole ? `${whole} ${rest}/${den}` : `${rest}/${den}`;
}

/** $4.05 */
export function money(cents: number): string {
  const neg = cents < 0;
  const c = Math.abs(Math.round(cents));
  return `${neg ? "−" : ""}$${Math.floor(c / 100)}.${String(c % 100).padStart(2, "0")}`;
}

/** Signed temperature with a real minus sign: −4°F */
export function deg(v: number, unit: "F" | "C"): string {
  return `${v < 0 ? "−" : ""}${Math.abs(v)}°${unit}`;
}

/** 7:05 (12-hour clock, minutes since midnight). */
export function clock(mins: number): string {
  const m = ((mins % 1440) + 1440) % 1440;
  let h = Math.floor(m / 60) % 12;
  if (h === 0) h = 12;
  return `${h}:${String(m % 60).padStart(2, "0")}`;
}
