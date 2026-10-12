/*
 * Focus mode: one subject + one topic for a whole mission.
 *
 * Topic ids are the arcade menu's ids (site/games.js window.TOPICS), so the menu can deep-link
 * with ?topic=<id>; "codes" (shift ciphers) is this game's own extra Math topic.
 *
 * Every checkpoint question is classified into a topic:
 *  - the game's own generators know what they make (familyTopic),
 *  - kit math by its NC standard (+ skill name for the few domains that mix topics),
 *  - kit ELA bank items by strand (RF → phonics, L → grammar).
 *
 * Which topics a grade offers is a fixed table (OFFERED). scripts/check-rules.ts proves it
 * against the real question pools: every offered topic gives ≥ MIN_DISTINCT different
 * lane-sized prompts at that grade, and every topic left out really has fewer.
 *
 * Pure TypeScript (no DOM, no Vite): the checker imports it under tsx.
 */
import type { Grade } from "../kit/types";
import type { Family } from "./questions";

export type SubjectId = "math" | "ela";
export type TopicId = "numbers" | "factors" | "ratios" | "fractions" | "algebra" | "geometry" | "codes" | "phonics" | "grammar";

export interface TopicInfo {
  id: TopicId;
  subject: SubjectId;
  label: string;
  /** Short, for the radio header (uppercased there). */
  short: string;
}

export const SUBJECTS: { id: SubjectId; label: string }[] = [
  { id: "math", label: "Math" },
  { id: "ela", label: "Reading & Writing (ELA)" },
];

/** In menu order; a subject's "first available topic" follows this order. */
export const TOPICS: TopicInfo[] = [
  { id: "numbers", subject: "math", label: "Numbers & operations", short: "Numbers" },
  { id: "factors", subject: "math", label: "Factors, multiples, GCF & LCM", short: "Factors" },
  { id: "ratios", subject: "math", label: "Ratios & rates", short: "Ratios & rates" },
  { id: "fractions", subject: "math", label: "Fractions & decimals", short: "Fractions" },
  { id: "algebra", subject: "math", label: "Algebra & equations", short: "Algebra" },
  { id: "geometry", subject: "math", label: "Geometry, area & volume", short: "Geometry" },
  { id: "codes", subject: "math", label: "Secret codes", short: "Secret codes" },
  { id: "phonics", subject: "ela", label: "Phonics & spelling", short: "Phonics" },
  { id: "grammar", subject: "ela", label: "Grammar & words", short: "Words" },
];

export const TOPIC_IDS = TOPICS.map((t) => t.id);

export function isTopic(v: unknown): v is TopicId {
  return typeof v === "string" && (TOPIC_IDS as string[]).includes(v);
}

export function topicInfo(id: TopicId): TopicInfo {
  return TOPICS.find((t) => t.id === id)!;
}

/**
 * A topic needs at least this many different lane-sized prompts at a grade to be offered
 * (K shapes have only 12 and K word items 11: too repetitive for a whole mission).
 */
export const MIN_DISTINCT = 15;

const range = (a: number, b: number) => Array.from({ length: b - a + 1 }, (_, i) => a + i);

/** Grade numbers (K = 0) where each topic has enough lane-sized questions. Checked by npm test. */
export const OFFERED: Record<TopicId, number[]> = {
  numbers: [...range(0, 7), 10, 12],
  factors: [4, 6],
  ratios: [6, 7, 8],
  fractions: [3, 4, 5, 6],
  algebra: range(6, 12),
  geometry: range(3, 12),
  codes: range(3, 12),
  phonics: [0, 1, 2],
  grammar: range(1, 12),
};

export function gradeN(g: Grade): number {
  return g === "K" ? 0 : Number(g);
}

export function topicAvailable(topic: TopicId, grade: Grade): boolean {
  return OFFERED[topic].includes(gradeN(grade));
}

export function topicsFor(subject: SubjectId): TopicInfo[] {
  return TOPICS.filter((t) => t.subject === subject);
}

export function availableTopics(subject: SubjectId, grade: Grade): TopicId[] {
  return topicsFor(subject).filter((t) => topicAvailable(t.id, grade)).map((t) => t.id);
}

/** "Grades 6+", "Grades K–2", "Grades 4, 6", "Grades K–7, 10, 12". */
export function gradesNote(topic: TopicId): string {
  const ns = [...OFFERED[topic]].sort((a, b) => a - b);
  const name = (n: number) => (n === 0 ? "K" : String(n));
  const parts: string[] = [];
  for (let i = 0; i < ns.length; ) {
    let j = i;
    while (j + 1 < ns.length && ns[j + 1] === ns[j] + 1) j++;
    if (j === i) parts.push(name(ns[i]));
    else if (ns[j] === 12 && parts.length === 0) parts.push(`${name(ns[i])}+`);
    else if (j === i + 1) parts.push(`${name(ns[i])}, ${name(ns[j])}`);
    else parts.push(`${name(ns[i])}–${name(ns[j])}`);
    i = j + 1;
  }
  return `${ns.length === 1 ? "Grade" : "Grades"} ${parts.join(", ")}`;
}

/* ------------------------------------------------------------------ classification */

/** Topic of one of the game's own generator families at grade number n (null for kit families). */
export function familyTopic(family: Family, n: number): TopicId | null {
  switch (family) {
    case "drt":
      // Grade 4: whole-number multiplication; grade 5: decimal × whole number; from grade 6 a rate.
      return n <= 4 ? "numbers" : n === 5 ? "fractions" : "ratios";
    case "rate": case "ratio": case "pctof": case "pctchange": case "fracrate": case "mpg":
      return "ratios";
    case "slope": case "rateTable": case "chase": case "lineq": case "lineParam": case "avgRate":
      return "algebra";
    case "cipherDecode": case "cipherEncode": case "cipherLetter": case "cipherShift":
      return "codes";
    case "addSub": case "countNext": case "multFact": case "multWord": case "bigMult":
      return "numbers";
    case "sightMatch": case "sightSentence":
      return "phonics";
    case "vocab":
      return "grammar";
    default:
      return null;
  }
}

const FACTOR_SKILL = /GCF|greatest common factor|least common multiple|LCM|factors, multiples|prime/i;

/** Topic of a kit question from its standard code (and skill name), or null when it fits none. */
export function kitTopic(standard: string, skill: string): TopicId | null {
  if (/^RF\./.test(standard)) return "phonics";
  if (/^L\./.test(standard)) return "grammar";
  if (!standard.startsWith("NC.")) return null;
  if (FACTOR_SKILL.test(skill)) return "factors";

  // K-8: NC.<grade>.<domain>.<n>
  const k8 = standard.match(/^NC\.(K|\d)\.([A-Z]+)\.\d+/);
  if (k8) {
    switch (k8[2]) {
      case "RP": return "ratios";
      case "NF": return "fractions";
      case "NS": return /fraction|decimal/i.test(skill) ? "fractions" : "numbers";
      case "CC": case "OA": case "NBT": return /decimal/i.test(skill) ? "fractions" : "numbers";
      case "EE": case "F": return "algebra";
      case "G": return "geometry";
      // Measurement: shapes (area, perimeter, volume, angles) are geometry; time, money, units are number sense.
      case "MD": return /area|perimeter|volume|angle/i.test(skill) ? "geometry" : "numbers";
      default: return null; // SP (statistics & probability)
    }
  }
  // NC Math 1-3: NC.M1.A-REI.3 → conceptual category before the dash.
  const hs = standard.match(/^NC\.M[1-3]\.([A-Z])-/);
  if (hs) {
    switch (hs[1]) {
      case "A": case "F": return "algebra";
      case "G": return "geometry";
      case "N": return /exponent/i.test(skill) && !/rational exponent/i.test(skill) ? "algebra" : "numbers";
      default: return null; // S (statistics)
    }
  }
  // NC Math 4: NC.M4.AF.2.2 / NC.M4.N.1 / NC.M4.SP.3
  const m4 = standard.match(/^NC\.M4\.([A-Z]+)\./);
  if (m4) {
    if (m4[1] === "AF") return /law of (co)?sines/i.test(skill) ? "geometry" : "algebra";
    if (m4[1] === "N") return "numbers";
    return null;
  }
  return null;
}

/** Topic of any checkpoint question. */
export function questionTopic(q: { family: Family; standard: string; skill: string }, n: number): TopicId | null {
  if (q.family === "kitMath" || q.family === "kitEla") return kitTopic(q.standard, q.skill);
  return familyTopic(q.family, n);
}

/* ------------------------------------------------------------------ what the player picked */

/** The title screen's subject row: MATH · ELA · MIXED (MIXED = the classic grade-based mix). */
export type SubjectMode = SubjectId | "mixed";
/** The topic row under MATH / ELA: "all" = any topic in the subject, else one topic. */
export type TopicChoice = TopicId | "all";

/** What actually drives the checkpoints. */
export type Focus =
  | { mode: "mix" }
  | { mode: "subject"; subject: SubjectId }
  | { mode: "focus"; topic: TopicId };

export interface FocusPref {
  subject: SubjectMode;
  topic: TopicChoice;
}

export const SUBJECT_KEY = "arcade.cipher-pursuit.subject";
export const TOPIC_KEY = "arcade.cipher-pursuit.topic";

export const MIX: Focus = { mode: "mix" };
export const DEFAULT_PREF: FocusPref = { subject: "mixed", topic: "all" };

export const SUBJECT_MODES: { id: SubjectMode; label: string; note: string }[] = [
  { id: "math", label: "MATH", note: "Rates · Numbers · Codes" },
  { id: "ela", label: "ELA", note: "Phonics · Words" },
  { id: "mixed", label: "MIXED", note: "Math and words, by grade" },
];

export function isSubjectMode(v: unknown): v is SubjectMode {
  return v === "math" || v === "ela" || v === "mixed";
}

/** Saved values → a pref (anything odd falls back to MIXED / ALL). */
export function parsePref(subject: string | null | undefined, topic: string | null | undefined): FocusPref {
  const s = isSubjectMode(subject) ? subject : "mixed";
  if (s === "mixed") return DEFAULT_PREF;
  const t: TopicChoice = isTopic(topic) && topicInfo(topic).subject === s ? topic : "all";
  return { subject: s, topic: t };
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
    // Private mode or blocked storage: the choice just isn't remembered.
  }
}

/** First topic of `subject` the grade offers, or null. */
export function firstTopic(subject: SubjectId, grade: Grade): TopicId | null {
  return availableTopics(subject, grade)[0] ?? null;
}

/**
 * The focus that applies at `grade`: MIXED → the classic mix; a subject's topic the grade offers →
 * that topic; ALL, or a topic this grade doesn't offer → any topic of the subject (ALL <subject>).
 */
export function resolveFocus(pref: FocusPref, grade: Grade): Focus {
  if (pref.subject === "mixed") return MIX;
  if (pref.topic !== "all" && topicInfo(pref.topic).subject === pref.subject && topicAvailable(pref.topic, grade)) {
    return { mode: "focus", topic: pref.topic };
  }
  return { mode: "subject", subject: pref.subject };
}

/** The pref a resolved focus stands for (what the title screen highlights). */
export function prefOf(f: Focus): FocusPref {
  if (f.mode === "mix") return DEFAULT_PREF;
  if (f.mode === "subject") return { subject: f.subject, topic: "all" };
  return { subject: topicInfo(f.topic).subject, topic: f.topic };
}

/** Short tag for the radio header, e.g. "RATIOS & RATES", "ALL MATH"; null for MIXED. */
export function focusTag(f: Focus): string | null {
  if (f.mode === "mix") return null;
  if (f.mode === "subject") return f.subject === "math" ? "ALL MATH" : "ALL ELA";
  return topicInfo(f.topic).short.toUpperCase();
}

/** Long name for reports, e.g. "Ratios & rates (Math)", "All math"; null for MIXED. */
export function focusName(f: Focus): string | null {
  if (f.mode === "mix") return null;
  if (f.mode === "subject") return f.subject === "math" ? "All math" : "All ELA (reading & writing)";
  const t = topicInfo(f.topic);
  return `${t.label} (${t.subject === "math" ? "Math" : "ELA"})`;
}

function subjectFromParam(v: string): SubjectMode | null {
  const s = v.trim().toLowerCase();
  if (s === "math") return "math";
  if (s === "ela" || s.startsWith("reading")) return "ela";
  if (s === "mixed" || s === "mix") return "mixed";
  return null;
}

export interface UrlFocus {
  /** The pref to use for this visit (not saved), or null to keep the saved choice. */
  pref: FocusPref | null;
  /** A short note for the title screen when a ?topic= couldn't be used at this grade. */
  note: string | null;
}

/**
 * Reads ?topic=<id> and the optional ?subject=. A topic the grade offers preselects its subject +
 * topic; the menu's quiz-mix ids pick ALL <subject> (math-mix, ela-mix) or MIXED (mix); a real topic
 * the grade doesn't offer falls back to ALL <its subject> with a note; an unknown topic, or one that
 * contradicts ?subject=, is ignored. ?subject= alone picks that subject (ALL) or MIXED.
 */
export function readUrlFocus(search: string, grade: Grade): UrlFocus {
  let p: URLSearchParams;
  try {
    p = new URLSearchParams(search);
  } catch {
    return { pref: null, note: null };
  }
  const subjRaw = p.get("subject");
  const subj = subjRaw ? subjectFromParam(subjRaw) : null;
  const raw = (p.get("topic") ?? "").trim().toLowerCase();
  if (!raw) return { pref: subj ? (subj === "mixed" ? DEFAULT_PREF : { subject: subj, topic: "all" }) : null, note: null };
  if (raw === "mix" || raw === "mixed") return { pref: DEFAULT_PREF, note: null };
  if (raw === "math-mix") return { pref: { subject: "math", topic: "all" }, note: null };
  if (raw === "ela-mix") return { pref: { subject: "ela", topic: "all" }, note: null };
  if (!isTopic(raw)) return { pref: null, note: null };
  const info = topicInfo(raw);
  if (subj && subj !== info.subject) return { pref: null, note: null };
  if (!topicAvailable(raw, grade)) {
    const all = info.subject === "math" ? "ALL MATH" : "ALL ELA";
    return {
      pref: { subject: info.subject, topic: "all" },
      note: `${info.label} is for ${gradesNote(raw).replace(/^Grades?/, (m) => m.toLowerCase())}, so this mission is ${all}.`,
    };
  }
  return { pref: { subject: info.subject, topic: raw }, note: null };
}
