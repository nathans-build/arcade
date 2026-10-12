/*
 * Picks the question for each code checkpoint: this game's own generators (questions.ts) mixed
 * with the kit's generated math and written ELA banks, by grade band. Every question that leaves
 * here is "quick" (prompt ≤ 100 characters, every choice ≤ 14) and fits a lane gate.
 *
 * The kit is reached through `KitHooks`, so the browser can pass the real deck pieces
 * (adaptive math, `bankFor`) and the checker can pass plain functions under tsx.
 */
import type { Grade, Question } from "../kit/types";
import { MATH_GENERATORS } from "../kit/math";
import type { Gen } from "../kit/math/core";
import { hasGlyphs, textWidth } from "./font";
import { MIX, kitTopic, questionTopic, type Focus, type SubjectId, type TopicId } from "./topics";
import {
  addSub, avgRate, bigMult, chase, cipherDecode, cipherEncode, cipherLetter, cipherShift, countNext, drt, fracrate, lineParam,
  lineq, mpg, multFact, multWord, pctchange, pctof, rate, rateTable, ratio, sightMatch, sightSentence, slope, vocab,
  type CPQuestion, type DriveCtx, type Family, type GenCtx, type Generator, type Rand,
} from "./questions";

export const QUICK_PROMPT = 100;
export const QUICK_CHOICE = 14;
/** Widest label (in font pixels, scale 1) that fits inside a lane gate's sign. */
export const GATE_TEXT_MAX = 66;

export interface KitHooks {
  /** A fresh quick kit math question (the browser uses adaptive math here). */
  math(grade: Grade): Question;
  /** The kit's written ELA questions for a grade (the browser passes `bankFor("ela", grade)`). */
  ela(grade: Grade): Question[];
}

type Entry = [Family, number];

/** Which families each grade band uses, and how often. */
export function familiesFor(n: number): Entry[] {
  if (n === 0) return [["kitMath", 3], ["addSub", 2.5], ["countNext", 1.5], ["sightMatch", 3], ["kitEla", 0.6]];
  if (n === 1) return [["kitMath", 3], ["addSub", 2.5], ["countNext", 1], ["sightMatch", 1.5], ["sightSentence", 1.5], ["kitEla", 0.6]];
  if (n === 2) return [["kitMath", 3], ["addSub", 2.5], ["countNext", 1], ["sightSentence", 3], ["kitEla", 0.6]];
  if (n === 3) return [["multFact", 2], ["multWord", 2], ["kitMath", 2], ["vocab", 2.5], ["kitEla", 1.5]];
  if (n === 4) return [["drt", 2.5], ["multWord", 1], ["kitMath", 2.5], ["vocab", 2.5], ["kitEla", 1.5]];
  if (n === 5) return [["drt", 2], ["bigMult", 1.5], ["kitMath", 2.5], ["vocab", 2.5], ["kitEla", 1.5]];
  if (n === 6) return [["drt", 2], ["rate", 2], ["ratio", 1.5], ["pctof", 2], ["kitMath", 2.5]];
  if (n === 7) return [["drt", 2], ["fracrate", 2], ["pctchange", 2], ["mpg", 1.5], ["kitMath", 2.5]];
  if (n === 8) return [["slope", 2], ["rateTable", 2], ["chase", 2], ["kitMath", 2.5]];
  return [["lineq", 2], ["lineParam", 1.5], ["avgRate", 1.5], ["cipherDecode", 2], ["cipherEncode", 1], ["cipherLetter", 0.7], ["cipherShift", 1], ["kitMath", 2]];
}

export const GENERATORS: Partial<Record<Family, Generator>> = {
  drt, rate, ratio, pctof, pctchange, fracrate, mpg, slope, rateTable, chase, lineq, lineParam, avgRate,
  cipherDecode, cipherEncode, cipherLetter, cipherShift, addSub, countNext, sightMatch, sightSentence, multFact, multWord, bigMult, vocab,
};

/** True when a question can go on the lane gates: quick, and every answer fits a gate sign. */
export function fitsGates(q: Question): boolean {
  return (
    !q.passage &&
    q.prompt.length <= QUICK_PROMPT &&
    q.choices.length === 4 &&
    new Set(q.choices).size === 4 &&
    q.choices.every((ch) => ch.length > 0 && ch.length <= QUICK_CHOICE && hasGlyphs(ch) && textWidth(ch) <= GATE_TEXT_MAX)
  );
}

function shuffle<T>(arr: T[], r: Rand): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Shuffles the four choices, keeping track of the right one. */
export function dealQ<Q extends Question>(q: Q, r: Rand): Q {
  const order = shuffle([0, 1, 2, 3], r);
  return { ...q, choices: order.map((i) => q.choices[i]) as Question["choices"], answer: order.indexOf(q.answer) };
}

function gradeNum(g: Grade): number {
  return g === "K" ? 0 : Number(g);
}

/** ELA bank items that suit a grade's lane gates (phonics for K-2, word meaning for 3-5). */
export function kitElaPool(grade: Grade, all: Question[]): Question[] {
  const n = gradeNum(grade);
  const want = n <= 2 ? [`RF.${grade}.4`] : [`L.${grade}.4`, `L.${grade}.5`];
  return all.filter((q) => q.quick && want.includes(q.standard) && fitsGates(q));
}

/* ------------------------------------------------------------------ focus mode */

/** The game's own families for a focus topic at grade number n, with weights (kit added separately). */
export function focusFamilies(topic: TopicId, n: number): Entry[] {
  switch (topic) {
    case "numbers":
      if (n <= 2) return [["addSub", 2.5], ["countNext", 1.5]];
      if (n === 3) return [["multFact", 2], ["multWord", 2]];
      if (n === 4) return [["drt", 2], ["multWord", 1.5]];
      if (n === 5) return [["bigMult", 1.5]];
      return [];
    case "fractions":
      return n === 5 ? [["drt", 1.5]] : [];
    case "ratios":
      // The car's own speed and fuel: the signature of this game.
      if (n === 6) return [["drt", 2], ["rate", 2], ["ratio", 1.5], ["pctof", 2]];
      if (n === 7) return [["drt", 2], ["fracrate", 2], ["pctchange", 2], ["mpg", 1.5]];
      if (n === 8) return [["drt", 2], ["rate", 1.5], ["mpg", 2], ["pctchange", 2], ["fracrate", 1.5]];
      return [];
    case "algebra":
      if (n === 8) return [["slope", 2], ["rateTable", 2], ["chase", 2]];
      if (n >= 9) return [["lineq", 2], ["lineParam", 1.5], ["avgRate", 1.5]];
      return [];
    case "codes":
      if (n < 3) return [];
      if (n <= 8) return [["cipherDecode", 2], ["cipherEncode", 1.5], ["cipherLetter", 1], ["cipherShift", 1]];
      return [["cipherDecode", 2], ["cipherEncode", 1], ["cipherLetter", 0.7], ["cipherShift", 1]];
    case "phonics":
      if (n === 0) return [["sightMatch", 3]];
      if (n === 1) return [["sightMatch", 1.5], ["sightSentence", 1.5]];
      if (n === 2) return [["sightSentence", 2]];
      return [];
    case "grammar":
      return n >= 3 && n <= 5 ? [["vocab", 2.5]] : [];
    default:
      return [];
  }
}

/** Kit math generators whose items belong to `topic` at `grade` (quick-capable ones only). */
export function kitGensFor(topic: TopicId, grade: Grade): Gen[] {
  return (MATH_GENERATORS[grade] ?? []).filter((g) => g.quick !== false && kitTopic(g.standard, g.skill) === topic);
}

/** Kit ELA bank items for `topic` that fit the lane gates. */
export function kitElaFocusPool(topic: TopicId, all: Question[]): Question[] {
  return all.filter((q) => q.quick && fitsGates(q) && kitTopic(q.standard, q.skill) === topic);
}

let kitCounter = 0;

/** One kit math question from a specific generator (the kit's own build rules), or null. */
export function kitFromGen(grade: Grade, gen: Gen): Question | null {
  let d;
  try {
    d = gen.make(true);
  } catch {
    return null;
  }
  const answer = d.answer.trim();
  if (!answer) return null;
  const choices = [answer];
  const add = (w: string | undefined) => {
    const t = w?.trim();
    if (t && choices.length < 4 && !choices.includes(t)) choices.push(t);
  };
  d.wrong.forEach(add);
  for (let i = 0; choices.length < 4 && d.pad && i < 60; i++) add(d.pad());
  if (choices.length < 4) return null;
  const q: Question = {
    id: `cp-kit-g${grade.toLowerCase()}-${gen.key}-${++kitCounter}`,
    subject: "math",
    grade,
    standard: gen.standard,
    skill: gen.skill,
    prompt: d.prompt,
    choices: choices as Question["choices"],
    answer: 0,
    explanation: d.explanation,
    quick: true,
  };
  return fitsGates(q) ? q : null;
}

/** ELA families of the game's own (everything else it makes is math). */
const ELA_FAMILIES: Family[] = ["sightMatch", "sightSentence", "vocab", "kitEla"];

/**
 * ALL MATH / ALL ELA: the grade's usual mix, kept to one subject. ALL MATH also gets the easy
 * secret codes at grades 3-8 (a Math topic there); ALL ELA draws from every lane-sized bank item.
 */
export function subjectFamilies(subject: SubjectId, n: number): Entry[] {
  const mix = familiesFor(n);
  if (subject === "ela") return mix.filter(([f]) => ELA_FAMILIES.includes(f) && f !== "kitEla");
  const math = mix.filter(([f]) => !ELA_FAMILIES.includes(f));
  if (n >= 3 && n <= 8) math.push(["cipherDecode", 0.8], ["cipherEncode", 0.5], ["cipherLetter", 0.4], ["cipherShift", 0.4]);
  return math;
}

/** How many recent prompts a focus run avoids repeating. */
const RECENT = 10;

export class CodeSource {
  private last: Family | null = null;
  private usedEla = new Set<string>();
  readonly n: number;
  /** Focus mode: the weighted families for the topic, its kit generators and ELA items. */
  private focusEntries: Entry[] = [];
  private focusGens: Gen[] = [];
  private focusEla: Question[] = [];
  private recent: string[] = [];
  private mixFallback: CodeSource | null = null;

  /** One topic (FOCUS on a topic), when set. */
  readonly topic: TopicId | null = null;
  /** One subject (ALL MATH / ALL ELA), when set. */
  readonly subject: SubjectId | null = null;

  /**
   * `focus`: MIX (the default) is the classic grade-based mix, unchanged; `subject` keeps every
   * checkpoint in one subject; `focus` keeps every checkpoint in one topic.
   */
  constructor(readonly grade: Grade, private kit: KitHooks, private r: Rand = Math.random, readonly focus: Focus = MIX) {
    this.n = gradeNum(grade);
    if (focus.mode === "focus") {
      const topic = (this.topic = focus.topic);
      this.focusEntries = focusFamilies(topic, this.n);
      this.focusGens = kitGensFor(topic, grade);
      this.focusEla = topic === "phonics" || topic === "grammar" ? kitElaFocusPool(topic, kit.ela(grade)) : [];
      const own = this.focusEntries.reduce((t, [, w]) => t + w, 0);
      // The game's own (car) questions lead when there are any; the kit fills in the rest of the topic.
      if (this.focusGens.length) this.focusEntries.push(["kitMath", own > 0 ? Math.max(2, own * 0.35) : 1]);
      if (this.focusEla.length) this.focusEntries.push(["kitEla", own > 0 ? Math.max(2.5, own) : 1]);
    } else if (focus.mode === "subject") {
      this.subject = focus.subject;
      this.focusEntries = subjectFamilies(focus.subject, this.n);
      if (focus.subject === "ela") {
        this.focusEla = kit.ela(grade).filter((q) => q.quick && fitsGates(q));
        const own = this.focusEntries.reduce((t, [, w]) => t + w, 0);
        if (this.focusEla.length) this.focusEntries.push(["kitEla", own > 0 ? Math.max(2.5, own) : 1]);
      }
    }
  }

  private entries(): Entry[] {
    return this.focus.mode === "mix" ? familiesFor(this.n) : this.focusEntries;
  }

  private pickFamily(): Family {
    const all = this.entries();
    const entries = all.filter(([f]) => f !== this.last || all.length < 2);
    const total = entries.reduce((s, [, w]) => s + w, 0);
    let x = this.r() * total;
    for (const [f, w] of entries) {
      x -= w;
      if (x <= 0) return f;
    }
    return entries[entries.length - 1][0];
  }

  /** One family's question (correct answer at index 0), or null if it couldn't make one that fits. */
  make(family: Family, drive: DriveCtx): CPQuestion | null {
    if (this.topic && family === "kitMath") {
      if (!this.focusGens.length) return null;
      const gen = this.focusGens[Math.floor(this.r() * this.focusGens.length)];
      const q = kitFromGen(this.grade, gen);
      return q ? { ...q, family, meta: { kind: "kit" } } : null;
    }
    if (this.focus.mode !== "mix" && family === "kitEla") return this.pickEla(this.focusEla, family);
    if (family === "kitMath") {
      const q = this.kit.math(this.grade);
      return fitsGates(q) ? { ...q, family, meta: { kind: "kit" } } : null;
    }
    if (family === "kitEla") return this.pickEla(kitElaPool(this.grade, this.kit.ela(this.grade)), family);
    const gen = GENERATORS[family];
    if (!gen) return null;
    const c: GenCtx = { grade: this.grade, n: this.n, r: this.r, drive };
    const q = gen(c);
    return q && fitsGates(q) ? q : null;
  }

  /** An unused bank item from `pool` (starting over once all are used). */
  private pickEla(pool: Question[], family: Family): CPQuestion | null {
    let fresh = pool.filter((q) => !this.usedEla.has(q.id));
    if (!fresh.length) {
      this.usedEla.clear();
      fresh = pool;
    }
    if (!fresh.length) return null;
    const q = fresh[Math.floor(this.r() * fresh.length)];
    this.usedEla.add(q.id);
    return { ...q, family, meta: { kind: "kit" } };
  }

  /** True when `q` belongs to the chosen topic / subject (always true in MIX). */
  inFocus(q: CPQuestion): boolean {
    if (this.topic) return questionTopic(q, this.n) === this.topic;
    if (this.subject) return q.subject === this.subject;
    return true;
  }

  /** FOCUS: a question from the topic, avoiding the last few prompts. Bounded: never hangs. */
  private nextFocus(drive: DriveCtx): CPQuestion | null {
    if (!this.focusEntries.length) return null;
    for (let attempt = 0; attempt < 80; attempt++) {
      const family = this.pickFamily();
      const q = this.make(family, drive);
      if (!q || !this.inFocus(q)) continue;
      // Later attempts accept a repeat rather than fail (tiny pools).
      if (attempt < 50 && this.recent.includes(q.prompt)) continue;
      this.last = family;
      this.recent.push(q.prompt);
      if (this.recent.length > RECENT) this.recent.shift();
      return dealQ(q, this.r);
    }
    // Still nothing: try every source of the topic in turn.
    for (const [family] of this.focusEntries) {
      for (let i = 0; i < 10; i++) {
        const q = this.make(family, drive);
        if (q && this.inFocus(q)) return dealQ(q, this.r);
      }
    }
    return null;
  }

  /** The next checkpoint question, choices shuffled. */
  next(drive: DriveCtx): CPQuestion {
    if (this.focus.mode !== "mix") {
      const q = this.nextFocus(drive);
      if (q) return q;
      // A topic the grade doesn't offer (the UI never starts one): play MIX rather than stall.
      this.mixFallback ??= new CodeSource(this.grade, this.kit, this.r);
      return this.mixFallback.next(drive);
    }
    for (let attempt = 0; attempt < 40; attempt++) {
      const family = this.pickFamily();
      const q = this.make(family, drive);
      if (q) {
        this.last = family;
        return dealQ(q, this.r);
      }
    }
    // Practically unreachable: the game's own generators always fit.
    const fallback = this.n <= 2 ? addSub : this.n <= 5 ? multFact : this.n <= 8 ? drt : lineq;
    const q = fallback({ grade: this.grade, n: this.n, r: this.r, drive })!;
    return dealQ(q, this.r);
  }
}
