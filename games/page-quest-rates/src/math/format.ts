/*
 * Number formatting and tiny random helpers for the Unit 3 generators (pure, no DOM).
 * Money is always kept in whole cents and always shown with 2 decimals ($3.30, never $3.3).
 */

export type Rng = () => number;

/** Small seedable RNG (tests use it so failures can be replayed). */
export function mulberry32(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const int = (rng: Rng, lo: number, hi: number) => lo + Math.floor(rng() * (hi - lo + 1));
export function pick<T>(rng: Rng, list: readonly T[]): T {
  return list[Math.floor(rng() * list.length)];
}
export const chance = (rng: Rng, p: number) => rng() < p;
export function shuffle<T>(rng: Rng, list: readonly T[]): T[] {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const commas = (s: string) => s.replace(/\B(?=(\d{3})+(?!\d))/g, ",");

/** A plain number, rounded to at most `dec` decimals, trailing zeros dropped, with thousands commas. */
export function num(x: number, dec = 2): string {
  const f = 10 ** dec;
  const r = Math.round(Math.abs(x) * f + 1e-9) / f;
  const [i, d = ""] = r.toFixed(dec).split(".");
  const dt = d.replace(/0+$/, "");
  return commas(i) + (dt ? `.${dt}` : "");
}

/** Whole cents → "$1,234.50". */
export function money(cents: number): string {
  const c = Math.round(Math.abs(cents));
  return `$${commas(String(Math.floor(c / 100)))}.${String(c % 100).padStart(2, "0")}`;
}

/** Rounds a cents amount to the nearest cent (half up). */
export const roundCents = (x: number) => Math.floor(x + 0.5 + 1e-9);

export const pct = (p: number) => `${num(p)}%`;

export function gcd(a: number, b: number): number {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) [a, b] = [b, a % b];
  return a;
}

/** n/d as a reduced (mixed) fraction: "2/3", "1 1/2", "4". */
export function frac(n: number, d: number): string {
  const g = gcd(n, d) || 1;
  n /= g;
  d /= g;
  const whole = Math.floor(n / d);
  const rem = n % d;
  if (rem === 0) return String(whole);
  return whole ? `${whole} ${rem}/${d}` : `${rem}/${d}`;
}

/** True when x has at most `dec` decimal places. */
export function terminates(x: number, dec = 2): boolean {
  const f = 10 ** dec;
  return Math.abs(Math.round(x * f) - x * f) < 1e-6;
}

/** A rate shown as a decimal when it ends within 2 places, otherwise as a fraction. */
export function rateText(n: number, d: number): string {
  return terminates(n / d) ? num(n / d) : frac(n, d);
}

/** Minutes since midnight → "4:05 PM". */
export function clock(min: number): string {
  const h = Math.floor(min / 60) % 24;
  const m = min % 60;
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
}

export const plural = (n: number, one: string, many: string) => (n === 1 ? one : many);
