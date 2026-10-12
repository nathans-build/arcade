import { mathGradeFor } from "../kit/adaptive";
import { GRADES, gradeShort } from "../kit/grades";
import { MATH_GENERATORS, mathQuestion } from "../kit/math";
import type { Grade, Question, Subject } from "../kit/types";
import { CIVICS } from "./civics";
import { FORCES } from "./forces";
import { bandOf } from "./qmake";

/*
 * One subject (and optionally one topic) for the whole run (all five floor masters and every
 * gold-scroll ninja). MIXED (the default) is the classic tower: ELA, math, civics, forces, mixed.
 *
 * Topic ids are the arcade menu's ids, so the menu can deep-link with ?topic=<id>.
 *
 * Where a topic's questions come from:
 *   math     kit generated math, filtered by classifyTopic(). A topic is offered at a grade when
 *            that grade has generators for it; otherwise (K-8 only, same grade band) the grade
 *            just below may lend its generators (e.g. grade 8 ratios use grade 7's).
 *   written  kit science / ELA / social studies banks (no passages), plus Dojo Tower's own civics
 *            and forces sets. The grade's own items first; if there are fewer than POOL_TARGET,
 *            the grades next to it, then the rest of its grade band. A topic is offered when that
 *            pool has at least MIN_DISTINCT different questions.
 *
 * This file must not import kit/banks (import.meta.glob) so the Node tests can load it: written
 * banks are passed in as a BankSource.
 */

export type FocusSubject = Subject;
export type FocusTopicId =
  | "numbers" | "factors" | "ratios" | "fractions" | "algebra" | "geometry"
  | "life" | "earth" | "physical"
  | "reading" | "phonics" | "grammar"
  | "civics" | "history" | "geography" | "economics";

export interface FocusTopic {
  id: FocusTopicId;
  subject: FocusSubject;
  /** As in the arcade menu. */
  label: string;
  /** Short upper-case tag for headers and the game screen. */
  tag: string;
}

export const FOCUS_SUBJECTS: { id: FocusSubject; label: string; tag: string }[] = [
  { id: "math", label: "Math", tag: "MATH" },
  { id: "science", label: "Science", tag: "SCIENCE" },
  { id: "ela", label: "Reading & Writing (ELA)", tag: "ELA" },
  { id: "social", label: "Social Studies", tag: "SOCIAL STUDIES" },
];

export const FOCUS_TOPICS: FocusTopic[] = [
  { id: "numbers", subject: "math", label: "Numbers & operations", tag: "NUMBERS & OPERATIONS" },
  { id: "factors", subject: "math", label: "Factors, multiples, GCF & LCM", tag: "FACTORS & MULTIPLES" },
  { id: "ratios", subject: "math", label: "Ratios & rates", tag: "RATIOS & RATES" },
  { id: "fractions", subject: "math", label: "Fractions & decimals", tag: "FRACTIONS & DECIMALS" },
  { id: "algebra", subject: "math", label: "Algebra & equations", tag: "ALGEBRA & EQUATIONS" },
  { id: "geometry", subject: "math", label: "Geometry, area & volume", tag: "GEOMETRY" },
  { id: "life", subject: "science", label: "Life science", tag: "LIFE SCIENCE" },
  { id: "earth", subject: "science", label: "Earth & space science", tag: "EARTH SCIENCE" },
  { id: "physical", subject: "science", label: "Physical science", tag: "PHYSICAL SCIENCE" },
  { id: "reading", subject: "ela", label: "Reading", tag: "READING" },
  { id: "phonics", subject: "ela", label: "Phonics & spelling", tag: "PHONICS & SPELLING" },
  { id: "grammar", subject: "ela", label: "Grammar & words", tag: "GRAMMAR & WORDS" },
  { id: "civics", subject: "social", label: "Civics & government", tag: "CIVICS" },
  { id: "history", subject: "social", label: "History", tag: "HISTORY" },
  { id: "geography", subject: "social", label: "Geography", tag: "GEOGRAPHY" },
  { id: "economics", subject: "social", label: "Economics", tag: "ECONOMICS" },
];

const TOPIC_BY_ID = new Map(FOCUS_TOPICS.map((t) => [t.id, t]));

export function isFocusTopicId(v: unknown): v is FocusTopicId {
  return typeof v === "string" && TOPIC_BY_ID.has(v as FocusTopicId);
}
export function isFocusSubject(v: unknown): v is FocusSubject {
  return typeof v === "string" && FOCUS_SUBJECTS.some((s) => s.id === v);
}
export function focusTopic(id: FocusTopicId): FocusTopic {
  return TOPIC_BY_ID.get(id)!;
}
export function topicsOf(subject: FocusSubject): FocusTopic[] {
  return FOCUS_TOPICS.filter((t) => t.subject === subject);
}

/** A focus pool needs this many different questions to be offered (a 5-floor run sees ~25). */
export const MIN_DISTINCT = 8;
/** Written pools borrow from nearby grades until they reach this size. */
export const POOL_TARGET = 12;

// ------------------------------------------------------------------ classification

/** The focus topic a question belongs to, from its subject, NC standard code and skill (null: none). */
export function classifyTopic(q: Pick<Question, "subject" | "standard" | "skill">): FocusTopicId | null {
  const std = q.standard.trim();
  const skill = q.skill;
  const p = std.split(".");
  switch (q.subject) {
    case "math":
      return mathTopic(p, skill);
    case "science": {
      if (/^(PS|PHY|CHM)\b/i.test(std)) return "physical";
      if (/^(LS|BIO)\b/i.test(std)) return "life";
      if (/^(ESS|EEN|EES)\b/i.test(std)) return "earth";
      return null;
    }
    case "ela": {
      const strand = p[0];
      if (strand === "RF") return "phonics";
      if (strand === "L" && /spelling/i.test(skill)) return "phonics";
      if (strand === "RL" || strand === "RI") return "reading";
      if (strand === "L" || strand === "W") return "grammar";
      return null;
    }
    case "social": {
      if (p[0] === "EPF") return "economics"; // Economics & Personal Finance: every strand
      const strand = p[1];
      if (strand === "C&G") return "civics";
      if (strand === "H") return "history";
      if (strand === "G") return "geography";
      if (strand === "E") return "economics";
      return null; // B (behavioral sciences / culture) has no focus topic
    }
  }
  return null;
}

function mathTopic(p: string[], skill: string): FocusTopicId | null {
  if (p[0] !== "NC" || p.length < 3) return null;
  const course = p[1];
  const dom = p[2];
  if (/^M\d$/.test(course)) {
    // High school: NC.M1.A-REI.3 style; NC Math 4: NC.M4.AF.2.1, NC.M4.N.1, NC.M4.SP.3
    const head = dom.split("-")[0];
    if (head === "S" || head === "SP") return null;
    if (head === "G" || /law of (co)?sines/i.test(skill)) return "geometry";
    return "algebra";
  }
  switch (dom) {
    case "RP":
      return "ratios";
    case "EE":
    case "F":
      return "algebra";
    case "G":
      return "geometry";
    case "NF":
      return "fractions";
    case "MD":
      return /area|perimeter|volume|angle/i.test(skill) ? "geometry" : "numbers";
    case "NS":
      if (p[3] === "4" || /common (factor|multiple)/i.test(skill)) return "factors";
      return /fraction|decimal/i.test(skill) ? "fractions" : "numbers";
    case "OA":
      return /factors, multiples|prime/i.test(skill) ? "factors" : "numbers";
    case "NBT":
      return /decimal/i.test(skill) ? "fractions" : "numbers";
    case "CC":
      return "numbers";
    case "SP":
      return null;
  }
  return null;
}

// ------------------------------------------------------------------ availability

export type BankSource = (subject: Exclude<Subject, "math">, grade: Grade) => Question[];

function gIdx(g: Grade): number {
  return GRADES.indexOf(g);
}

/** Math generators at a grade that make questions for a topic. */
export function mathGensFor(grade: Grade, topic: FocusTopicId) {
  return (MATH_GENERATORS[grade] ?? []).filter((gen) => classifyTopic({ subject: "math", standard: gen.standard, skill: gen.skill }) === topic);
}

/**
 * True when a grade's generators make at least MIN_DISTINCT different questions for a topic.
 * Sampled (at most VARIETY_SAMPLES on-topic questions, stopping as soon as it is enough), so a
 * generator with only a couple of possible prompts (e.g. NC.8.NS.1) does not count. Good topics
 * reach the bar within a few dozen samples and weak ones never can, so the answer is stable.
 */
const VARIETY_SAMPLES = 150;
const varietyCache = new Map<string, boolean>();
export function mathHasVariety(grade: Grade, topic: FocusTopicId): boolean {
  const key = `${grade}|${topic}`;
  const hit = varietyCache.get(key);
  if (hit !== undefined) return hit;
  let ok = false;
  if (mathGensFor(grade, topic).length > 0) {
    const seen = new Set<string>();
    for (let i = 0, onTopic = 0; i < VARIETY_SAMPLES * 30 && onTopic < VARIETY_SAMPLES; i++) {
      const q = mathQuestion(grade);
      if (classifyTopic(q) !== topic) continue;
      onTopic++;
      seen.add(q.prompt);
      if (seen.size >= MIN_DISTINCT) {
        ok = true;
        break;
      }
    }
  }
  varietyCache.set(key, ok);
  return ok;
}

/**
 * The grade whose math generators a focus topic uses at `grade` (null: not offered): the grade
 * itself, or for K-8 the grade just below in the same band when the grade has too little.
 */
export function mathSourceGrade(grade: Grade, topic: FocusTopicId): Grade | null {
  if (mathHasVariety(grade, topic)) return grade;
  const i = gIdx(grade);
  if (i > 0 && i <= 8) {
    const below = GRADES[i - 1];
    if (bandOf(below) === bandOf(grade) && mathHasVariety(below, topic)) return below;
  }
  return null;
}

/** Grades to draw a written pool from, nearest first: the grade, its neighbours, then its band. */
function poolGrades(grade: Grade): Grade[][] {
  const i = gIdx(grade);
  const near = [GRADES[i - 1], GRADES[i + 1]].filter((g): g is Grade => !!g);
  const band = GRADES.filter((g) => g !== grade && !near.includes(g) && bandOf(g) === bandOf(grade))
    .sort((a, b) => Math.abs(gIdx(a) - i) - Math.abs(gIdx(b) - i));
  return [[grade], near, ...band.map((g) => [g])];
}

/** Turns "MIX" or a topic into the arcade's own grade-range note, e.g. "Grades 6–8". */
export function gradeRangeNote(grades: Grade[]): string {
  if (grades.length === 0) return "Not available yet";
  const idx = grades.map(gIdx).sort((a, b) => a - b);
  const runs: [number, number][] = [];
  for (const v of idx) {
    const last = runs[runs.length - 1];
    if (last && v === last[1] + 1) last[1] = v;
    else runs.push([v, v]);
  }
  const fmt = ([a, b]: [number, number]) => {
    const A = gradeShort(GRADES[a]);
    if (a === b) return A;
    if (b === GRADES.length - 1) return `${A}+`;
    return `${A}–${gradeShort(GRADES[b])}`;
  };
  const single = runs.length === 1 && runs[0][0] === runs[0][1];
  return `${single ? "Grade" : "Grades"} ${runs.map(fmt).join(", ")}`;
}

function dedupeByPrompt(qs: Question[]): Question[] {
  const seen = new Set<string>();
  return qs.filter((q) => {
    const k = q.prompt.trim().toLowerCase();
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

/** Knows which focus topics each grade can offer and builds their written pools. */
export class FocusCatalog {
  private pools = new Map<string, Question[]>();
  private avail = new Map<Grade, FocusTopicId[]>();

  constructor(private bank: BankSource) {}

  /** Written questions of a subject at exactly this grade (no passages), with Dojo's own sets. */
  private subjectItems(grade: Grade, subject: Exclude<Subject, "math">): Question[] {
    const extra = subject === "social" ? CIVICS[bandOf(grade)] : subject === "science" ? FORCES[bandOf(grade)] : [];
    return [...this.bank(subject, grade), ...extra.filter((q) => q.grade === grade)].filter((q) => !q.passage);
  }

  /** Every written question for a topic at exactly this grade. */
  private ownItems(grade: Grade, topic: FocusTopicId): Question[] {
    const t = focusTopic(topic);
    if (t.subject === "math") return [];
    return this.subjectItems(grade, t.subject).filter((q) => classifyTopic(q) === topic);
  }

  /** Items for a topic at exactly one grade (tests use it to prove a topic is really missing). */
  ownCount(grade: Grade, topic: FocusTopicId): number {
    return dedupeByPrompt(this.ownItems(grade, topic)).length;
  }

  private ringPool(key: string, items: (g: Grade) => Question[], grade: Grade): Question[] {
    const hit = this.pools.get(key);
    if (hit) return hit;
    let pool: Question[] = [];
    for (const ring of poolGrades(grade)) {
      if (pool.length >= POOL_TARGET) break;
      pool = dedupeByPrompt([...pool, ...ring.flatMap(items)]);
    }
    this.pools.set(key, pool);
    return pool;
  }

  /** The written pool for a topic at a grade (empty for math topics). */
  writtenPool(grade: Grade, topic: FocusTopicId): Question[] {
    return this.ringPool(`${grade}|${topic}`, (g) => this.ownItems(g, topic), grade);
  }

  /** "ALL <SUBJECT>": every written question of the subject for the grade, any topic. */
  subjectPool(grade: Grade, subject: Exclude<Subject, "math">): Question[] {
    return this.ringPool(`${grade}|all-${subject}`, (g) => this.subjectItems(g, subject), grade);
  }

  isAvailable(grade: Grade, topic: FocusTopicId): boolean {
    return this.available(grade).includes(topic);
  }

  /** Topics offered at a grade, in menu order. */
  available(grade: Grade): FocusTopicId[] {
    const hit = this.avail.get(grade);
    if (hit) return hit;
    const out = FOCUS_TOPICS.filter((t) =>
      t.subject === "math" ? mathSourceGrade(grade, t.id) !== null : this.writtenPool(grade, t.id).length >= MIN_DISTINCT,
    ).map((t) => t.id);
    this.avail.set(grade, out);
    return out;
  }

  /** "Grades 6–8"-style note of where a topic is offered. */
  gradesNote(topic: FocusTopicId): string {
    return gradeRangeNote(GRADES.filter((g) => this.isAvailable(g, topic)));
  }
}

// ------------------------------------------------------------------ the player's choice

/** The title screen's subject row: one subject for every floor, or MIXED (the classic tower). */
export type DojoSubject = Subject | "mixed";
/** The topic row: "all" is "ALL <SUBJECT>" (any topic of the subject). */
export type TopicChoice = FocusTopicId | "all";
export type FocusChoice = { subject: "mixed" } | { subject: Subject; topic: TopicChoice };

export const MIXED: FocusChoice = { subject: "mixed" };
export const SUBJECT_KEY = "arcade.dojo-tower.subject";
export const TOPIC_KEY = "arcade.dojo-tower.topic";

export const SUBJECT_CHOICES: { id: DojoSubject; label: string; note: string }[] = [
  { id: "math", label: "MATH", note: "Numbers, shapes & more" },
  { id: "science", label: "SCIENCE", note: "Life, Earth & physical" },
  { id: "ela", label: "ELA", note: "Reading & writing" },
  { id: "social", label: "SOCIAL STUDIES", note: "Civics, history & more" },
  { id: "mixed", label: "MIXED", note: "A new subject each floor" },
];

export function isDojoSubject(v: unknown): v is DojoSubject {
  return v === "mixed" || isFocusSubject(v);
}
export function subjectTag(s: Subject): string {
  return FOCUS_SUBJECTS.find((x) => x.id === s)!.tag;
}

/** The tag a run shows on the question header and the floor banners (null for MIXED). */
export function focusTag(c: FocusChoice): string | null {
  if (c.subject === "mixed") return null;
  return c.topic === "all" ? subjectTag(c.subject) : focusTopic(c.topic).tag;
}

const ALL_LABEL: Record<Subject, string> = { math: "All math", science: "All science", ela: "All ELA", social: "All social studies" };

/** Plain-language name of a choice, e.g. "Math: Ratios & rates", "All science", "Mixed". */
export function focusLabel(c: FocusChoice): string {
  if (c.subject === "mixed") return "Mixed";
  if (c.topic === "all") return ALL_LABEL[c.subject];
  return `${FOCUS_SUBJECTS.find((x) => x.id === c.subject)!.label}: ${focusTopic(c.topic).label}`;
}

/** The topic row's first button, e.g. "ALL MATH". */
export function allLabel(s: Subject): string {
  return ALL_LABEL[s].toUpperCase();
}

/** Makes a choice fit a grade: a topic the grade doesn't offer becomes "ALL <SUBJECT>". */
export function validateFocus(choice: FocusChoice, grade: Grade, catalog: FocusCatalog): FocusChoice {
  if (choice.subject === "mixed") return MIXED;
  if (choice.topic === "all") return choice;
  if (focusTopic(choice.topic).subject === choice.subject && catalog.isAvailable(grade, choice.topic)) return choice;
  return { subject: choice.subject, topic: "all" };
}

/** Reads the two stored values; anything unknown is MIXED / "all". A topic decides its own subject. */
export function parseStoredFocus(subject: string | null, topic: string | null): FocusChoice {
  if (!isFocusSubject(subject)) return MIXED;
  if (isFocusTopicId(topic) && focusTopic(topic).subject === subject) return { subject, topic };
  return { subject, topic: "all" };
}

function read(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function loadFocus(): FocusChoice {
  return parseStoredFocus(read(SUBJECT_KEY), read(TOPIC_KEY));
}

/** The topic saved last (it is kept while MIXED is on), or null. */
export function loadStoredTopic(): FocusTopicId | null {
  const t = read(TOPIC_KEY);
  return isFocusTopicId(t) ? t : null;
}

/** Saves the subject; the topic too unless MIXED (so going back to that subject returns to it). */
export function saveFocus(choice: FocusChoice): void {
  try {
    localStorage.setItem(SUBJECT_KEY, choice.subject);
    if (choice.subject !== "mixed") localStorage.setItem(TOPIC_KEY, choice.topic);
  } catch {
    // storage unavailable
  }
}

/** The topic to show when a subject is picked: its saved topic if the grade offers it, else ALL. */
export function topicForSubject(subject: Subject, grade: Grade, catalog: FocusCatalog): TopicChoice {
  const t = loadStoredTopic();
  return t && focusTopic(t).subject === subject && catalog.isAvailable(grade, t) ? t : "all";
}

/** After the grade changes: re-checks the saved choice and saves the fallback. Returns the result. */
export function refocusSavedForGrade(grade: Grade, catalog: FocusCatalog): FocusChoice {
  const saved = loadFocus();
  const fixed = validateFocus(saved, grade, catalog);
  if (JSON.stringify(fixed) !== JSON.stringify(saved)) saveFocus(fixed);
  return fixed;
}

export interface UrlFocus {
  /** The choice for this visit, or null to keep the saved one. */
  choice: FocusChoice | null;
  /** A topic was asked for in the link but this grade can't offer it. */
  unavailable: FocusTopicId | null;
}

/**
 * `?topic=<id>` preselects its subject and topic for this visit when the grade offers it (unknown
 * or unavailable: ignored). `?subject=` alone (math, science, ela, social, mixed) picks that subject
 * with ALL; `?topic=all&subject=math` too.
 */
export function focusFromUrl(search: string, grade: Grade, catalog: FocusCatalog): UrlFocus {
  let params: URLSearchParams;
  try {
    params = new URLSearchParams(search);
  } catch {
    return { choice: null, unavailable: null };
  }
  const topic = (params.get("topic") ?? "").trim().toLowerCase();
  const subject = (params.get("subject") ?? "").trim().toLowerCase();
  if (isFocusTopicId(topic)) {
    if (catalog.isAvailable(grade, topic)) return { choice: { subject: focusTopic(topic).subject, topic }, unavailable: null };
    return { choice: null, unavailable: topic };
  }
  if ((!topic || topic === "all") && isDojoSubject(subject)) {
    return { choice: subject === "mixed" ? MIXED : { subject, topic: "all" }, unavailable: null };
  }
  return { choice: null, unavailable: null };
}

// ------------------------------------------------------------------ drawing questions

const RECENT = 16;
const MATH_TRIES = 400;

/**
 * Draws every question of a one-subject run. A topic's written questions come from its pool, ALL
 * from the subject's whole pool (no repeats until a pool is used up). Math is generated fresh:
 * a topic keeps only on-topic questions; ALL takes any. Recently asked prompts are skipped.
 * Every loop is bounded, so drawing never hangs.
 */
export class FocusDeck {
  /** Prompts asked in this round of the written pool. */
  private used = new Set<string>();
  private recent: string[] = [];
  private lastMath: Question | null = null;
  readonly pool: Question[];
  readonly quickPool: Question[];
  private mathSource: Grade | null;

  constructor(
    catalog: FocusCatalog,
    readonly grade: Grade,
    readonly subject: Subject,
    readonly topic: TopicChoice,
    private opts: { adaptive?: boolean } = {},
  ) {
    if (subject === "math") {
      this.pool = [];
      this.mathSource = topic === "all" ? grade : mathSourceGrade(grade, topic) ?? grade;
    } else {
      this.pool = topic === "all" ? catalog.subjectPool(grade, subject) : catalog.writtenPool(grade, topic);
      this.mathSource = null;
    }
    this.quickPool = this.pool.filter((q) => q.quick);
  }

  private remember(q: Question) {
    this.recent.push(q.prompt);
    if (this.recent.length > RECENT) this.recent.shift();
  }

  draw(quick = false): Question {
    const q = this.mathSource ? this.drawMath(quick) : this.drawWritten(quick);
    this.remember(q);
    return q;
  }

  private drawWritten(quick: boolean): Question {
    const pool = quick && this.quickPool.length >= 6 ? this.quickPool : this.pool;
    // No repeats until the pool (quick or full) is used up; then a new round that still skips
    // the most recent questions, so a question never comes back right away.
    let fresh = pool.filter((q) => !this.used.has(q.prompt));
    if (fresh.length === 0) {
      for (const q of pool) this.used.delete(q.prompt);
      const recent = this.recent.slice(-Math.min(RECENT, Math.floor(pool.length / 2)));
      fresh = pool.filter((q) => !recent.includes(q.prompt));
      if (fresh.length === 0) fresh = pool;
    }
    const q = fresh[Math.floor(Math.random() * fresh.length)];
    this.used.add(q.prompt);
    return q;
  }

  private mathGrade(): Grade {
    const base = this.mathSource!;
    if (this.opts.adaptive === false) return base;
    const g = mathGradeFor(this.grade);
    if (this.topic === "all") return g;
    return g !== this.grade && mathHasVariety(g, this.topic) ? g : base;
  }

  private onTopic(q: Question): boolean {
    return this.topic === "all" || classifyTopic(q) === this.topic;
  }

  private drawMath(quick: boolean): Question {
    const last = this.recent[this.recent.length - 1];
    let pickQ: Question | null = null;
    for (let i = 0; i < MATH_TRIES; i++) {
      // After half the tries, stop insisting on quick items (some skills never make them).
      const q = mathQuestion(i < MATH_TRIES / 2 ? this.mathGrade() : this.mathSource!, { quick: quick && i < MATH_TRIES / 2 });
      if (!this.onTopic(q)) continue;
      // Best: not asked recently. Next best: at least not the question just asked.
      if (!this.recent.includes(q.prompt)) {
        pickQ = q;
        break;
      }
      if (!pickQ || (pickQ.prompt === last && q.prompt !== last)) pickQ = q;
    }
    // Practically unreachable: reuse the last on-topic question rather than go off-topic.
    const q = pickQ ?? this.lastMath ?? mathQuestion(this.mathSource!);
    this.lastMath = q;
    return q;
  }
}
