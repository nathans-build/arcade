import type { Grade, Question } from "../kit/types";

/** Grade bands Power Up Town's levels and questions are written for. */
export type Band = "k2" | "g35" | "g68" | "hs";
export const BANDS: Band[] = ["k2", "g35", "g68", "hs"];

export function gradeN(g: Grade): number {
  return g === "K" ? 0 : Number(g);
}

export function bandOf(g: Grade): Band {
  const n = gradeN(g);
  return n <= 2 ? "k2" : n <= 5 ? "g35" : n <= 8 ? "g68" : "hs";
}

export const BAND_LABEL: Record<Band, string> = { k2: "Grades K–2", g35: "Grades 3–5", g68: "Grades 6–8", hs: "Grades 9–12" };

/** K–5 read temperatures in °F (what they see at home); 6–12 use °C like science class. */
export function usesF(band: Band): boolean {
  return band === "k2" || band === "g35";
}

export function fmtTemp(c: number, band: Band): string {
  return usesF(band) ? `${Math.round((c * 9) / 5 + 32)}°F` : `${Math.round(c)}°C`;
}

/** Small seeded random number generator (mulberry32). */
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

export function shuffled<T>(arr: readonly T[], r: Rng = Math.random): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Shuffles a question's choices for display, keeping track of the right one. */
export function dealQ<T extends Question>(q: T, r: Rng = Math.random): T {
  const order = shuffled([0, 1, 2, 3], r);
  return { ...q, choices: order.map((i) => q.choices[i]) as Question["choices"], answer: order.indexOf(q.answer) };
}

export function safeStorage(): Storage | null {
  try {
    return typeof localStorage === "undefined" ? null : localStorage;
  } catch {
    return null;
  }
}
