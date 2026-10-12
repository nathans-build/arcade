/*
 * The sticker book: one sticker per finished round. Saved in this browser under an
 * `arcade.word-hopper.` key, so the arcade's player switcher keeps each child's book.
 */

export const STICKERS: string[] = [
  "cat", "dog", "pig", "fox", "hen", "bee", "cow", "fish", "duck", "goat", "crab", "chick", "whale", "seal", "sheep",
  "snail", "octopus", "frog", "star", "sun", "moon", "cake", "kite", "boat", "train", "truck", "bike", "umbrella",
  "igloo", "yoyo",
];

export const STICKER_KEY = "arcade.word-hopper.stickers.v1";
export const RECENT_KEY = "arcade.word-hopper.recent.v1";

export interface Book {
  /** Stickers earned, in the order they were earned. */
  earned: string[];
  /** Rounds finished (a full book keeps counting). */
  rounds: number;
}

export function loadBook(): Book {
  try {
    const raw = localStorage.getItem(STICKER_KEY);
    if (raw) {
      const b = JSON.parse(raw) as Partial<Book>;
      const earned = Array.isArray(b.earned) ? b.earned.filter((s) => STICKERS.includes(s)) : [];
      return { earned: [...new Set(earned)], rounds: typeof b.rounds === "number" ? b.rounds : earned.length };
    }
  } catch {
    // storage unavailable or corrupt
  }
  return { earned: [], rounds: 0 };
}

export function saveBook(b: Book) {
  try {
    localStorage.setItem(STICKER_KEY, JSON.stringify(b));
  } catch {
    // ignore
  }
}

/** Award a sticker for a finished round: a new one while any are left, else a repeat favourite. */
export function awardSticker(book: Book, rng: () => number = Math.random): { book: Book; sticker: string; isNew: boolean } {
  const left = STICKERS.filter((s) => !book.earned.includes(s));
  const isNew = left.length > 0;
  const pool = isNew ? left : STICKERS;
  const sticker = pool[Math.floor(rng() * pool.length)];
  const next: Book = { earned: isNew ? [...book.earned, sticker] : book.earned, rounds: book.rounds + 1 };
  return { book: next, sticker, isNew };
}

/** Item keys seen lately, per activity and level ("rhyme/K"), so rounds don't repeat. */
export function loadRecent(): Record<string, string[]> {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    if (raw) {
      const r = JSON.parse(raw);
      if (r && typeof r === "object") return r as Record<string, string[]>;
    }
  } catch {
    // ignore
  }
  return {};
}

export function saveRecent(r: Record<string, string[]>) {
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(r));
  } catch {
    // ignore
  }
}

/** Remember a finished round's keys, keeping at most `keep` per list. */
export function rememberKeys(r: Record<string, string[]>, list: string, keys: string[], keep: number): Record<string, string[]> {
  const old = (r[list] ?? []).filter((k) => !keys.includes(k));
  return { ...r, [list]: [...old, ...keys].slice(-keep) };
}
