/*
 * The title screen's subject row (SCIENCE · MATH · MIXED) and topic row, ?subject= / ?topic=
 * from the arcade menu, and which lab set each level plays.
 *
 * Topic ids are the arcade menu's (site/games.js window.TOPICS): physical (Science),
 * numbers and algebra (Math). Pure TypeScript.
 */
import type { Grade } from "../kit/types";
import { BAND_SETS, bandOf, gradeN, type SetId, type TopicId } from "./content";

export type SubjectId = "science" | "math";
export type SubjectMode = SubjectId | "mixed";
export type TopicChoice = TopicId | "all";

export interface TopicInfo {
  id: TopicId;
  subject: SubjectId;
  label: string;
  short: string;
}

export const TOPICS: TopicInfo[] = [
  { id: "physical", subject: "science", label: "Physical science", short: "Physical science" },
  { id: "numbers", subject: "math", label: "Numbers & operations", short: "Numbers" },
  { id: "algebra", subject: "math", label: "Algebra & equations", short: "Equations" },
];

export const isTopic = (v: unknown): v is TopicId => v === "physical" || v === "numbers" || v === "algebra";
export const topicInfo = (id: TopicId) => TOPICS.find((t) => t.id === id)!;
export const topicsFor = (s: SubjectId) => TOPICS.filter((t) => t.subject === s);

/** Grade numbers (K = 0) where each topic has a lab set. Checked by npm test. */
export const OFFERED: Record<TopicId, number[]> = {
  physical: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
  numbers: [0, 1, 2, 3, 4, 5, 6, 7, 8],
  algebra: [6, 7, 8, 9, 10, 11, 12],
};

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

export const SUBJECT_MODES: { id: SubjectMode; label: string; note: string }[] = [
  { id: "science", label: "SCIENCE", note: "Matter · Atoms · Ions" },
  { id: "math", label: "MATH", note: "Facts · Integers · Equations" },
  { id: "mixed", label: "MIXED", note: "Science and math, by grade" },
];

/** The subject buttons' small print, for a grade band. */
export function subjectNote(id: SubjectMode, g: Grade): string {
  const band = bandOf(g);
  if (id === "mixed") return "Science and math, by grade";
  const notes: Record<string, [string, string]> = {
    k2: ["Colors & shapes", "Number bonds to 10"],
    "35": ["Solids, liquids & gases", "Times & division facts"],
    "68": ["Elements & molecules", "Integers · Equations"],
    "912": ["Ions & compounds", "Equations"],
  };
  return notes[band][id === "science" ? 0 : 1];
}

export const isSubjectMode = (v: unknown): v is SubjectMode => v === "science" || v === "math" || v === "mixed";

export interface FocusPref {
  subject: SubjectMode;
  topic: TopicChoice;
}

export const DEFAULT_PREF: FocusPref = { subject: "mixed", topic: "all" };
export const SUBJECT_KEY = "arcade.lab-capsules.subject";
export const TOPIC_KEY = "arcade.lab-capsules.topic";

export function parsePref(subject: string | null | undefined, topic: string | null | undefined): FocusPref {
  if (!isSubjectMode(subject) || subject === "mixed") return DEFAULT_PREF;
  const t: TopicChoice = isTopic(topic) && topicInfo(topic).subject === subject ? topic : "all";
  return { subject, topic: t };
}

export function loadPref(): FocusPref {
  try {
    return parsePref(localStorage.getItem(SUBJECT_KEY), localStorage.getItem(TOPIC_KEY));
  } catch {
    return DEFAULT_PREF;
  }
}

export function savePref(p: FocusPref) {
  try {
    localStorage.setItem(SUBJECT_KEY, p.subject);
    localStorage.setItem(TOPIC_KEY, p.topic);
  } catch {
    // storage blocked: the choice just isn't remembered
  }
}

export type Focus = { mode: "mix" } | { mode: "subject"; subject: SubjectId } | { mode: "focus"; topic: TopicId };

/** MIXED → the mix; an available topic → that topic; ALL or an unavailable topic → the whole subject. */
export function resolveFocus(p: FocusPref, g: Grade): Focus {
  if (p.subject === "mixed") return { mode: "mix" };
  if (p.topic !== "all" && topicInfo(p.topic).subject === p.subject && topicAvailable(p.topic, g)) return { mode: "focus", topic: p.topic };
  return { mode: "subject", subject: p.subject };
}

export function prefOf(f: Focus): FocusPref {
  if (f.mode === "mix") return DEFAULT_PREF;
  if (f.mode === "subject") return { subject: f.subject, topic: "all" };
  return { subject: topicInfo(f.topic).subject, topic: f.topic };
}

export function focusTag(f: Focus): string | null {
  if (f.mode === "mix") return null;
  if (f.mode === "subject") return f.subject === "math" ? "ALL MATH" : "ALL SCIENCE";
  return topicInfo(f.topic).short.toUpperCase();
}

export function focusName(f: Focus): string | null {
  if (f.mode === "mix") return null;
  if (f.mode === "subject") return f.subject === "math" ? "All math" : "All science";
  const t = topicInfo(f.topic);
  return `${t.label} (${t.subject === "math" ? "Math" : "Science"})`;
}

/**
 * The lab sets a run cycles through, level by level, for a focus at a grade.
 * Every list is non-empty for every grade (checked by npm test).
 */
export function setCycle(f: Focus, g: Grade): SetId[] {
  const band = bandOf(g);
  const sets = BAND_SETS[band];
  const sci = sets.filter((s) => s === "shapes" || s === "matter" || s === "elements" || s === "ions");
  const nums = sets.filter((s) => s === "bonds" || s === "facts" || s === "integers");
  const alg = sets.filter((s) => s === "equations");
  if (f.mode === "focus") {
    if (f.topic === "physical") return sci;
    if (f.topic === "numbers") return nums.length ? nums : alg;
    return alg.length ? alg : nums;
  }
  if (f.mode === "subject") return f.subject === "science" ? sci : [...nums, ...alg];
  // MIXED: K–2 starts with number bonds (shapes + numbers); others start with science.
  if (band === "k2") return ["bonds", "shapes"];
  if (band === "35") return ["matter", "facts"];
  if (band === "68") return ["elements", "integers", "elements", "equations"];
  return ["ions", "equations"];
}

export function setForLevel(f: Focus, g: Grade, level: number): SetId {
  const c = setCycle(f, g);
  return c[(level - 1) % c.length];
}

function subjectFromParam(v: string): SubjectMode | null {
  const s = v.trim().toLowerCase();
  if (s === "science") return "science";
  if (s === "math") return "math";
  if (s === "mixed" || s === "mix") return "mixed";
  return null;
}

export interface UrlFocus {
  pref: FocusPref | null;
  note: string | null;
}

/**
 * ?topic=physical|numbers|algebra preselects that subject + topic; science-mix / math-mix pick
 * ALL <subject>; mix picks MIXED. A topic the grade doesn't offer falls back to ALL <subject>
 * with a note. ?subject= alone picks that subject.
 */
export function readUrlFocus(search: string, g: Grade): UrlFocus {
  let p: URLSearchParams;
  try {
    p = new URLSearchParams(search);
  } catch {
    return { pref: null, note: null };
  }
  const sRaw = p.get("subject");
  const subj = sRaw ? subjectFromParam(sRaw) : null;
  const raw = (p.get("topic") ?? "").trim().toLowerCase();
  if (!raw) return { pref: subj ? (subj === "mixed" ? DEFAULT_PREF : { subject: subj, topic: "all" }) : null, note: null };
  if (raw === "mix" || raw === "mixed") return { pref: DEFAULT_PREF, note: null };
  if (raw === "science-mix") return { pref: { subject: "science", topic: "all" }, note: null };
  if (raw === "math-mix") return { pref: { subject: "math", topic: "all" }, note: null };
  if (!isTopic(raw)) return { pref: null, note: null };
  const info = topicInfo(raw);
  if (subj && subj !== info.subject) return { pref: null, note: null };
  if (!topicAvailable(raw, g)) {
    return {
      pref: { subject: info.subject, topic: "all" },
      note: `${info.label} is for ${gradesNote(raw).toLowerCase()}, so this lab is ALL ${info.subject === "math" ? "MATH" : "SCIENCE"}.`,
    };
  }
  return { pref: { subject: info.subject, topic: raw }, note: null };
}
