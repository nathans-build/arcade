/*
 * Saved answers (this browser only): every math answer goes into an attempt log (newest 500 kept),
 * exported as CSV or JSON with date, game, skill tag, question, answer given, correct answer,
 * correct/incorrect and hints used. The "redo" list keeps the skill tags missed on the first try.
 */
import { GENERATORS, TAG_GENERATOR } from "./unit3";
import { SKILL_TAGS, type SkillTag } from "./types";
import type { Attempt, QResult } from "./play";

export const GAME_TITLE = "Page Quest: Rate & Percent Mysteries";
const LOG_KEY = "pqRates.attempts.v1";
const MISSED_KEY = "pqRates.missed.v1";
export const LOG_CAP = 500;

export interface LogRow {
  date: string;
  game: string;
  book: string;
  skill: string;
  standard: string;
  question: string;
  answerGiven: string;
  correctAnswer: string;
  correct: boolean;
  hintsUsed: number;
}

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function write(key: string, v: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(v));
  } catch {
    // storage full or blocked: the game still works
  }
}

export function loadAttempts(): LogRow[] {
  const rows = read<unknown>(LOG_KEY, []);
  return Array.isArray(rows) ? (rows as LogRow[]).filter((r) => r && typeof r.question === "string") : [];
}

export function logAttempt(a: Attempt, book: string, now = new Date()): LogRow {
  const row: LogRow = {
    date: now.toISOString(),
    game: GAME_TITLE,
    book,
    skill: a.tag,
    standard: a.code,
    question: a.question,
    answerGiven: a.given,
    correctAnswer: a.correctAnswer,
    correct: a.correct,
    hintsUsed: a.hints,
  };
  write(LOG_KEY, [...loadAttempts(), row].slice(-LOG_CAP));
  return row;
}

const COLS: [keyof LogRow, string][] = [
  ["date", "date"], ["game", "game"], ["book", "book"], ["skill", "skill tag"], ["standard", "standard"], ["question", "question"],
  ["answerGiven", "answer given"], ["correctAnswer", "correct answer"], ["correct", "correct/incorrect"], ["hintsUsed", "hints used"],
];

const cell = (v: unknown) => {
  const s = typeof v === "boolean" ? (v ? "correct" : "incorrect") : String(v ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export function toCSV(rows: LogRow[]): string {
  return [COLS.map(([, h]) => h).join(","), ...rows.map((r) => COLS.map(([k]) => cell(r[k])).join(","))].join("\n") + "\n";
}

export function toJSON(rows: LogRow[]): string {
  return JSON.stringify(rows.map((r) => ({ ...r, result: r.correct ? "correct" : "incorrect" })), null, 2);
}

export function download(filename: string, text: string, mime: string) {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function exportName(ext: "csv" | "json", now = new Date()): string {
  return `page-quest-rates-answers-${now.toISOString().slice(0, 10)}.${ext}`;
}

// ---- results by skill tag ----
export interface TagRow {
  tag: SkillTag;
  code: string;
  total: number;
  firstTry: number;
  hints: number;
}

export function byTag(results: QResult[]): TagRow[] {
  const m = new Map<SkillTag, TagRow>();
  for (const r of results) {
    const row = m.get(r.tag) ?? { tag: r.tag, code: r.code, total: 0, firstTry: 0, hints: 0 };
    row.total++;
    if (r.firstTry) row.firstTry++;
    row.hints += r.hints;
    m.set(r.tag, row);
  }
  return SKILL_TAGS.filter((t) => m.has(t)).map((t) => m.get(t)!);
}

// ---- redo list ----
export interface RedoItem {
  tag: SkillTag;
  gen: string;
}

/** One redo question per missed skill tag (single-question generators, new numbers each time). */
export function missedFrom(results: QResult[]): RedoItem[] {
  const out: RedoItem[] = [];
  for (const r of results) {
    if (r.firstTry || out.some((o) => o.tag === r.tag)) continue;
    const own = GENERATORS[r.gen];
    out.push({ tag: r.tag, gen: own && own.tag === r.tag ? r.gen : TAG_GENERATOR[r.tag] });
  }
  return out;
}

export function loadMissed(): RedoItem[] {
  const list = read<unknown>(MISSED_KEY, []);
  return Array.isArray(list) ? (list as RedoItem[]).filter((x) => x && GENERATORS[x.gen] && (SKILL_TAGS as readonly string[]).includes(x.tag)) : [];
}

export function saveMissed(list: RedoItem[]) {
  write(MISSED_KEY, list);
}

/** Adds newly missed tags to the saved redo list. */
export function addMissed(items: RedoItem[]) {
  const cur = loadMissed();
  for (const it of items) if (!cur.some((c) => c.tag === it.tag)) cur.push(it);
  saveMissed(cur);
}

/** After a redo round: tags answered right on the first try leave the list. */
export function clearMastered(results: QResult[]) {
  const ok = new Set(results.filter((r) => r.firstTry).map((r) => r.tag));
  const missedAgain = new Set(results.filter((r) => !r.firstTry).map((r) => r.tag));
  saveMissed(loadMissed().filter((x) => !ok.has(x.tag) || missedAgain.has(x.tag)));
}
