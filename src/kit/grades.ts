import type { Grade, Subject } from "./types";

export const GRADES: Grade[] = ["K", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];

/** SpiderBen10's Arcade menu. Games link back here, carrying the grade. */
export const ARCADE_URL = "https://icy-smoke-05363610f.3.azurestaticapps.net/";

export function isGrade(v: unknown): v is Grade {
  return typeof v === "string" && (GRADES as string[]).includes(v);
}

export function gradeLabel(g: Grade): string {
  return g === "K" ? "Kindergarten" : `Grade ${g}`;
}

export function gradeShort(g: Grade): string {
  return g === "K" ? "K" : g;
}

/** 0 for K, 1-12 otherwise. Handy for difficulty scaling. */
export function gradeNumber(g: Grade): number {
  return g === "K" ? 0 : Number(g);
}

/** Early readers (K-2) get read-aloud on by default and larger text. */
export function isEarlyReader(g: Grade): boolean {
  return gradeNumber(g) <= 2;
}

/**
 * NC high school courses mapped to grades for this arcade
 * (NC Math 1-4; English I-IV; a typical NC science sequence).
 */
export function courseName(g: Grade, subject: Subject): string | null {
  const n = gradeNumber(g);
  if (n < 9) return null;
  const i = n - 9;
  if (subject === "math") return ["NC Math 1", "NC Math 2", "NC Math 3", "NC Math 4"][i];
  if (subject === "ela") return ["English I", "English II", "English III", "English IV"][i];
  // NC lets districts choose the order of the four required courses; this is the common one.
  if (subject === "social") return ["World History", "Civic Literacy", "American History", "Economics & Personal Finance"][i];
  return ["Earth & Environmental Science", "Biology", "Chemistry", "Physics"][i];
}

/**
 * True when the game was opened from the arcade menu with a grade (`?grade=`).
 * The arcade owns the grade choice then, so games show the grade instead of a picker.
 * Opened directly (no grade in the link), games still show their own picker.
 */
export function gradeFromArcade(): boolean {
  try {
    const q = new URLSearchParams(window.location.search).get("grade");
    return isGrade(q ? q.toUpperCase() : null);
  } catch {
    return false;
  }
}

const STORAGE_KEY = "arcade.grade";

/**
 * The grade to start with: `?grade=` from the arcade link wins, then the last grade used
 * in this game (per browser), then `fallback`.
 */
export function initialGrade(fallback: Grade = "6"): Grade {
  try {
    const q = new URLSearchParams(window.location.search).get("grade");
    const fromUrl = q ? q.toUpperCase() : null;
    if (isGrade(fromUrl)) return fromUrl;
  } catch {
    // ignore
  }
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (isGrade(saved)) return saved;
  } catch {
    // ignore
  }
  return fallback;
}

export function rememberGrade(g: Grade) {
  try {
    localStorage.setItem(STORAGE_KEY, g);
  } catch {
    // ignore
  }
}

/** Link back to the arcade menu, keeping the chosen grade. */
export function arcadeLink(g: Grade): string {
  return `${ARCADE_URL}?grade=${encodeURIComponent(g)}`;
}
