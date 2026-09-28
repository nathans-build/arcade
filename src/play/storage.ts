/* Per-browser saves: current page per book (CONTINUE) and the endings found per book. */
import type { RunState } from "./session";

const saveKey = (bookId: string) => `pageQuest.save.${bookId}`;
const endKey = (bookId: string) => `pageQuest.endings.${bookId}`;

export function loadRun(bookId: string): RunState | null {
  try {
    const raw = localStorage.getItem(saveKey(bookId));
    if (!raw) return null;
    const r = JSON.parse(raw) as RunState;
    return r && r.v === 1 && typeof r.page === "string" ? r : null;
  } catch {
    return null;
  }
}

export function saveRun(bookId: string, run: RunState) {
  try {
    localStorage.setItem(saveKey(bookId), JSON.stringify(run));
  } catch {
    // ignore
  }
}

export function clearRun(bookId: string) {
  try {
    localStorage.removeItem(saveKey(bookId));
  } catch {
    // ignore
  }
}

export function loadEndings(bookId: string): string[] {
  try {
    const raw = localStorage.getItem(endKey(bookId));
    const list = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(list) ? list.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

/** Adds an ending (by page id). Returns true when it is new. */
export function addEnding(bookId: string, pageId: string): boolean {
  const list = loadEndings(bookId);
  if (list.includes(pageId)) return false;
  try {
    localStorage.setItem(endKey(bookId), JSON.stringify([...list, pageId]));
  } catch {
    // ignore
  }
  return true;
}
