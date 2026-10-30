import { PRACTICES, type Practice } from "./bosses";

/*
 * The attempt log ("save progress locally" and export, docs/math6-unit3.md section 9): every answer
 * with date, game, skill tag, question, answer given, correct answer, correct/incorrect and hints used.
 * Kept in localStorage (the last ATTEMPT_LOG_MAX answers) and exported as CSV or JSON.
 */

export const GAME_ID = "dojo-rates";
export const LOG_KEY = "arcade.dojo-rates.log.v1";
export const PRACTICE_KEY = "arcade.dojo-rates.practice";
export const ATTEMPT_LOG_MAX = 500;

export interface Attempt {
  /** ISO date and time. */
  date: string;
  game: string;
  /** Skill tag number (1-18) and its name. */
  tag: number;
  skill: string;
  question: string;
  given: string;
  correct: string;
  ok: boolean;
  hints: number;
  kind: "boss" | "scroll";
  /** "", "combo final" or "combo step n". */
  part: string;
}

function store(): Storage | null {
  try {
    return typeof localStorage === "undefined" ? null : localStorage;
  } catch {
    return null;
  }
}

export function loadAttempts(): Attempt[] {
  try {
    const raw = store()?.getItem(LOG_KEY);
    const v = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(v) ? (v as Attempt[]).slice(-ATTEMPT_LOG_MAX) : [];
  } catch {
    return [];
  }
}

export function saveAttempts(list: Attempt[]): void {
  try {
    store()?.setItem(LOG_KEY, JSON.stringify(list.slice(-ATTEMPT_LOG_MAX)));
  } catch {
    // storage full or unavailable
  }
}

export function loadPractice(): Practice {
  try {
    const v = store()?.getItem(PRACTICE_KEY);
    if (v && PRACTICES.some((p) => p.id === v)) return v as Practice;
  } catch {
    // ignore
  }
  return "full";
}

export function savePractice(p: Practice): void {
  try {
    store()?.setItem(PRACTICE_KEY, p);
  } catch {
    // ignore
  }
}

export const EXPORT_FIELDS = ["date", "game", "skill tag", "question", "answer given", "correct answer", "correct/incorrect", "hints used"] as const;

function row(a: Attempt): string[] {
  return [a.date, a.game, `${a.tag}. ${a.skill}`, a.question, a.given, a.correct, a.ok ? "correct" : "incorrect", String(a.hints)];
}

const csvCell = (s: string) => (/[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s);

export function toCSV(list: Attempt[]): string {
  return [EXPORT_FIELDS.join(","), ...list.map((a) => row(a).map(csvCell).join(","))].join("\r\n") + "\r\n";
}

export function toJSON(list: Attempt[]): string {
  return JSON.stringify(
    list.map((a) => {
      const r = row(a);
      return Object.fromEntries(EXPORT_FIELDS.map((f, i) => [f, f === "hints used" ? a.hints : r[i]]));
    }),
    null,
    2,
  );
}

export interface TagRow {
  tag: number;
  n: number;
  c: number;
  hints: number;
}

/** Right/total and hints used per skill tag, in tag order. */
export function tagRows(log: Attempt[]): TagRow[] {
  const m = new Map<number, TagRow>();
  for (const a of log) {
    const r = m.get(a.tag) ?? { tag: a.tag, n: 0, c: 0, hints: 0 };
    r.n++;
    if (a.ok) r.c++;
    r.hints += a.hints;
    m.set(a.tag, r);
  }
  return [...m.values()].sort((a, b) => a.tag - b.tag);
}
