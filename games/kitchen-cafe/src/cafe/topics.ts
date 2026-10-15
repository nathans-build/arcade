import type { Grade } from "../kit/types";
import { gradeN, type TopicId } from "./common";
import { MATH_TOPICS, mathGensFor } from "./math";

/*
 * The title screen's subject row (SCIENCE · MATH · MIXED, like the other arcade games) and, under
 * SCIENCE or MATH, a topic row. Topic ids are the arcade menu's (site/games.js window.TOPICS), so
 * the menu can deep-link with ?topic=<id> (or ?subject=science|math). Pure TypeScript: the checker
 * imports it under tsx.
 */

export type SubjectMode = "mixed" | "science" | "math";
export type TopicChoice = TopicId | "all";
export interface Focus { subject: SubjectMode; topic: TopicChoice }

export const MIXED: Focus = { subject: "mixed", topic: "all" };

export const SUBJECT_MODES: { id: SubjectMode; label: string; note: string }[] = [
  { id: "science", label: "SCIENCE", note: "Physical & chemical changes" },
  { id: "math", label: "MATH", note: "Measure, time & money" },
  { id: "mixed", label: "MIXED", note: "Science + math" },
];

export const TOPICS: { id: TopicId; subject: "science" | "math"; label: string; tag: string }[] = [
  { id: "physical", subject: "science", label: "Physical science", tag: "PHYSICAL SCIENCE" },
  { id: "numbers", subject: "math", label: "Numbers & operations", tag: "NUMBERS" },
  { id: "fractions", subject: "math", label: "Fractions & decimals", tag: "FRACTIONS" },
  { id: "ratios", subject: "math", label: "Ratios & rates", tag: "RATIOS & RATES" },
  { id: "money", subject: "math", label: "Money", tag: "MONEY" },
];

export function isTopic(v: unknown): v is TopicId {
  return typeof v === "string" && TOPICS.some((t) => t.id === v);
}

export function topicInfo(id: TopicId) {
  return TOPICS.find((t) => t.id === id)!;
}

export function topicsFor(subject: "science" | "math") {
  return TOPICS.filter((t) => t.subject === subject);
}

/** A topic is offered at a grade when the café has questions for it there. */
export function topicAvailable(topic: TopicId, grade: Grade): boolean {
  if (topic === "physical") return true;
  return mathGensFor(grade, topic).length > 0;
}

export function gradesNote(topic: TopicId): string {
  const GR: Grade[] = ["K", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];
  const ns = GR.filter((g) => topicAvailable(topic, g)).map(gradeN);
  const name = (n: number) => (n === 0 ? "K" : String(n));
  const parts: string[] = [];
  for (let i = 0; i < ns.length; ) {
    let j = i;
    while (j + 1 < ns.length && ns[j + 1] === ns[j] + 1) j++;
    parts.push(j === i ? name(ns[i]) : ns[j] === 12 ? `${name(ns[i])}+` : `${name(ns[i])}–${name(ns[j])}`);
    i = j + 1;
  }
  return `${ns.length === 1 ? "Grade" : "Grades"} ${parts.join(", ")}`;
}

/** Which question kinds a focus asks, and which math topics (null = all the grade has). */
export function focusPlan(f: Focus): { science: boolean; math: boolean; mathTopics: Exclude<TopicId, "physical">[] | null } {
  if (f.subject === "science") return { science: true, math: false, mathTopics: null };
  if (f.subject === "math") {
    return { science: false, math: true, mathTopics: f.topic === "all" || f.topic === "physical" ? null : [f.topic] };
  }
  return { science: true, math: true, mathTopics: null };
}

export function focusTag(f: Focus): string | null {
  if (f.subject === "mixed") return null;
  if (f.topic !== "all") return topicInfo(f.topic).tag;
  return f.subject === "science" ? "ALL SCIENCE" : "ALL MATH";
}

/** Makes a focus valid for a grade (a math topic the grade lacks becomes ALL MATH). */
export function validateFocus(f: Focus, grade: Grade): Focus {
  if (f.subject === "mixed") return MIXED;
  if (f.topic === "all") return { subject: f.subject, topic: "all" };
  const t = TOPICS.find((x) => x.id === f.topic);
  if (!t || t.subject !== f.subject || !topicAvailable(t.id, grade)) return { subject: f.subject, topic: "all" };
  return f;
}

/**
 * `?topic=` (wins) or `?subject=` from the arcade menu. `unavailable` names a topic the grade
 * can't do (the title screen shows a note and falls back to its subject).
 */
export function focusFromUrl(search: string, grade: Grade): { focus: Focus | null; unavailable: TopicId | null } {
  let p: URLSearchParams;
  try {
    p = new URLSearchParams(search);
  } catch {
    return { focus: null, unavailable: null };
  }
  const topic = (p.get("topic") ?? "").trim().toLowerCase();
  if (topic === "science-mix") return { focus: { subject: "science", topic: "all" }, unavailable: null };
  if (topic === "math-mix") return { focus: { subject: "math", topic: "all" }, unavailable: null };
  if (isTopic(topic)) {
    const t = topicInfo(topic);
    if (!topicAvailable(topic, grade)) return { focus: { subject: t.subject, topic: "all" }, unavailable: topic };
    return { focus: { subject: t.subject, topic }, unavailable: null };
  }
  const subject = (p.get("subject") ?? "").trim().toLowerCase();
  if (subject === "science" || subject === "math" || subject === "mixed") return { focus: subject === "mixed" ? MIXED : { subject, topic: "all" }, unavailable: null };
  return { focus: null, unavailable: null };
}

export const FOCUS_KEY = "arcade.kitchen-cafe.focus";

export function parseFocus(raw: string | null): Focus {
  if (!raw) return MIXED;
  try {
    const v = JSON.parse(raw) as Partial<Focus>;
    if (v.subject === "science" || v.subject === "math") {
      const topic = v.topic === "all" || isTopic(v.topic) ? v.topic : "all";
      return { subject: v.subject, topic };
    }
  } catch {
    // ignore
  }
  return MIXED;
}

export function loadFocus(store: Pick<Storage, "getItem"> | null = safeStorage()): Focus {
  try {
    return parseFocus(store?.getItem(FOCUS_KEY) ?? null);
  } catch {
    return MIXED;
  }
}

export function saveFocus(f: Focus, store: Pick<Storage, "setItem"> | null = safeStorage()) {
  try {
    store?.setItem(FOCUS_KEY, JSON.stringify(f));
  } catch {
    // ignore
  }
}

export function safeStorage(): Storage | null {
  try {
    return typeof localStorage === "undefined" ? null : localStorage;
  } catch {
    return null;
  }
}

export { MATH_TOPICS };
