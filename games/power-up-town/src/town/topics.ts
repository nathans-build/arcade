import type { Grade } from "../kit/types";
import { gradeN, safeStorage } from "./common";

/*
 * The title screen's subject row (SCIENCE · MATH · MIXED) and topic chips, plus ?subject= /
 * ?topic= from the arcade menu. Topic ids are the arcade menu's (site/games.js window.TOPICS):
 * physical (Science), numbers and algebra (Math). SCIENCE / physical is the default.
 */

export type SubjectMode = "science" | "math" | "mixed";
export type TopicId = "physical" | "numbers" | "algebra";
export type TopicChoice = TopicId | "all";
export interface Focus {
  subject: SubjectMode;
  topic: TopicChoice;
}

export const DEFAULT_FOCUS: Focus = { subject: "science", topic: "physical" };
export const MIXED: Focus = { subject: "mixed", topic: "all" };

export const SUBJECT_MODES: { id: SubjectMode; label: string; note: string }[] = [
  { id: "science", label: "SCIENCE", note: "Energy, electricity & heat" },
  { id: "math", label: "MATH", note: "Numbers & formulas" },
  { id: "mixed", label: "MIXED", note: "Science + math" },
];

export const TOPICS: { id: TopicId; subject: "science" | "math"; label: string; tag: string }[] = [
  { id: "physical", subject: "science", label: "Physical science", tag: "PHYSICAL SCIENCE" },
  { id: "numbers", subject: "math", label: "Numbers & operations", tag: "NUMBERS" },
  { id: "algebra", subject: "math", label: "Algebra & equations", tag: "ALGEBRA" },
];

/** Grade numbers (K = 0) where each topic has questions. Checked by npm test. */
export const OFFERED: Record<TopicId, number[]> = {
  physical: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
  numbers: [0, 1, 2, 3, 4, 5, 6, 7, 8],
  algebra: [6, 7, 8, 9, 10, 11, 12],
};

export const isTopic = (v: unknown): v is TopicId => v === "physical" || v === "numbers" || v === "algebra";
export const topicInfo = (id: TopicId) => TOPICS.find((t) => t.id === id)!;
export const topicsFor = (s: "science" | "math") => TOPICS.filter((t) => t.subject === s);

export function topicAvailable(t: TopicId, g: Grade): boolean {
  return OFFERED[t].includes(gradeN(g));
}

export function gradesNote(t: TopicId): string {
  const ns = OFFERED[t];
  const name = (n: number) => (n === 0 ? "K" : String(n));
  if (ns.length === 13) return "Grades K–12";
  if (ns[ns.length - 1] === 12) return `Grades ${name(ns[0])}+`;
  return `Grades ${name(ns[0])}–${name(ns[ns.length - 1])}`;
}

/** Makes a focus valid for a grade (a topic the grade lacks becomes the whole subject). */
export function validateFocus(f: Focus, g: Grade): Focus {
  if (f.subject === "mixed") return MIXED;
  if (f.subject === "science") return DEFAULT_FOCUS;
  if (f.topic === "all") return { subject: "math", topic: "all" };
  if (!isTopic(f.topic) || topicInfo(f.topic).subject !== "math" || !topicAvailable(f.topic, g)) return { subject: "math", topic: "all" };
  return f;
}

export function focusTag(f: Focus): string | null {
  if (f.subject === "mixed") return null;
  if (f.topic !== "all") return topicInfo(f.topic).tag;
  return f.subject === "science" ? "PHYSICAL SCIENCE" : "ALL MATH";
}

/**
 * `?topic=` (wins) or `?subject=` from the arcade menu. `unavailable` names a topic the grade can't
 * do (the title shows a note and falls back to its subject).
 */
export function focusFromUrl(search: string, g: Grade): { focus: Focus | null; unavailable: TopicId | null } {
  let p: URLSearchParams;
  try {
    p = new URLSearchParams(search);
  } catch {
    return { focus: null, unavailable: null };
  }
  const topic = (p.get("topic") ?? "").trim().toLowerCase();
  if (topic === "science-mix") return { focus: DEFAULT_FOCUS, unavailable: null };
  if (topic === "math-mix") return { focus: { subject: "math", topic: "all" }, unavailable: null };
  if (isTopic(topic)) {
    const t = topicInfo(topic);
    if (!topicAvailable(topic, g)) return { focus: t.subject === "science" ? DEFAULT_FOCUS : { subject: "math", topic: "all" }, unavailable: topic };
    return { focus: t.subject === "science" ? DEFAULT_FOCUS : { subject: "math", topic }, unavailable: null };
  }
  const subject = (p.get("subject") ?? "").trim().toLowerCase();
  if (subject === "science") return { focus: DEFAULT_FOCUS, unavailable: null };
  if (subject === "math") return { focus: { subject: "math", topic: "all" }, unavailable: null };
  if (subject === "mixed") return { focus: MIXED, unavailable: null };
  return { focus: null, unavailable: null };
}

export const FOCUS_KEY = "arcade.power-up-town.focus";

export function parseFocus(raw: string | null): Focus {
  if (!raw) return DEFAULT_FOCUS;
  try {
    const v = JSON.parse(raw) as Partial<Focus>;
    if (v.subject === "mixed") return MIXED;
    if (v.subject === "math") return { subject: "math", topic: v.topic === "numbers" || v.topic === "algebra" ? v.topic : "all" };
  } catch {
    // ignore
  }
  return DEFAULT_FOCUS;
}

export function loadFocus(store: Pick<Storage, "getItem"> | null = safeStorage()): Focus {
  try {
    return parseFocus(store?.getItem(FOCUS_KEY) ?? null);
  } catch {
    return DEFAULT_FOCUS;
  }
}

export function saveFocus(f: Focus, store: Pick<Storage, "setItem"> | null = safeStorage()) {
  try {
    store?.setItem(FOCUS_KEY, JSON.stringify(f));
  } catch {
    // ignore
  }
}
