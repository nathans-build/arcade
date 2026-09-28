import type { Grade } from "../kit/types";
import { GRADES } from "../kit/grades";
import { ELA, ELA_KINDS } from "./ela";
import { MATH_KINDS, ownMathKinds, reviewMathKinds, type MathKind as GenKind, type Rand } from "./math";
import { SCIENCE } from "./science";
import { BAND_GRADES, bandOf, type SeqSubject, type Sequence } from "./types";

export { SCIENCE, ELA, ELA_KINDS, MATH_KINDS };
export type { Sequence, SeqSubject, GenKind };
export { bandOf };

export type SeqMode = SeqSubject | "mixed";

const FIXED: Record<Exclude<SeqSubject, "math">, Sequence[]> = { science: SCIENCE, ela: ELA };

/** Written sequences for a grade; grades with fewer than 4 borrow the nearest grades in the band. */
export function fixedPool(subject: Exclude<SeqSubject, "math">, grade: Grade): Sequence[] {
  const all = FIXED[subject];
  let pool = all.filter((s) => s.grades.includes(grade));
  const band = BAND_GRADES[bandOf(grade)];
  const gi = band.indexOf(grade);
  for (let d = 1; pool.length < 4 && d < band.length; d++) {
    for (const j of [gi - d, gi + d]) {
      if (j < 0 || j >= band.length) continue;
      for (const s of all) if (s.grades.includes(band[j]) && !pool.includes(s)) pool = [...pool, s];
    }
  }
  return pool;
}

/** Generated kinds (math, and ABC order for K-2 ELA) for a grade: its own, then review from earlier in the band. */
export function genKinds(subject: SeqSubject, grade: Grade): { own: GenKind[]; review: GenKind[] } {
  if (subject === "math") return { own: ownMathKinds(grade), review: reviewMathKinds(grade) };
  if (subject === "ela") return { own: ELA_KINDS.filter((k) => k.grades.includes(grade)), review: [] };
  return { own: [], review: [] };
}

function shuffle<T>(r: Rand, arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Hands out one sequence per level: no repeats until a pool is used up; mixed rotates subjects. */
export class SequenceDeck {
  private subjects: SeqSubject[];
  private turn: number;
  private queues = new Map<string, Sequence[]>();
  private lastKind = "";
  private lastId = "";
  private retries: Sequence[] = [];
  private sinceRetry = 0;

  constructor(public readonly grade: Grade, mode: SeqMode, private r: Rand = Math.random) {
    this.subjects = mode === "mixed" ? ["math", "science", "ela"] : [mode];
    this.turn = Math.floor(r() * 3);
  }

  /** A sequence built with mistakes comes back two levels later. */
  retry(seq: Sequence) {
    if (!seq.id.startsWith("m-") && !seq.id.startsWith("ela-abc")) this.retries.push(seq);
  }

  next(): Sequence {
    const subject = this.subjects[this.turn++ % this.subjects.length];
    this.sinceRetry++;
    const ri = this.retries.findIndex((s) => s.subject === subject);
    if (ri >= 0 && this.sinceRetry >= 2) {
      this.sinceRetry = 0;
      return this.remember(this.retries.splice(ri, 1)[0]);
    }
    const gen = genKinds(subject, this.grade);
    const fixed = subject === "math" ? [] : fixedPool(subject, this.grade);
    const useGen = gen.own.length > 0 && (fixed.length === 0 || this.r() < 0.3);
    if (useGen) {
      const pool = gen.review.length && this.r() < 0.3 ? gen.review : gen.own;
      const choices = pool.length > 1 ? pool.filter((k) => k.key !== this.lastKind) : pool;
      const kind = choices[Math.floor(this.r() * choices.length)];
      this.lastKind = kind.key;
      return this.remember(kind.make(this.grade, this.r));
    }
    let q = this.queues.get(subject);
    if (!q || q.length === 0) {
      q = shuffle(this.r, fixed);
      if (q.length > 1 && q[0].id === this.lastId) q.push(q.shift()!);
      this.queues.set(subject, q);
    }
    return this.remember(q.shift()!);
  }

  private remember(s: Sequence): Sequence {
    this.lastId = s.id;
    return s;
  }
}

/** The short reason shown when slab `wrong` reaches the plate while slab `expected` is still needed. */
export function whyWrong(seq: Sequence, wrong: number, expected: number): string {
  const w = seq.steps[wrong];
  const e = seq.steps[expected];
  if (seq.values) {
    const cmp = seq.values[wrong] > seq.values[expected] ? "greater than" : "less than";
    return `${w} is ${cmp} ${e}, so ${e} goes on first (${seq.ends[0].toLowerCase()} at the bottom).`;
  }
  const note = seq.notes?.[expected];
  if (wrong < expected) return `${w} is already on the plate.`;
  return `Not yet! ${e} comes before ${w}.${note ? ` ${note}` : ""}`;
}

const SUP = "⁰¹²³⁴⁵⁶⁷⁸⁹";
const SUB = "₀₁₂₃₄₅₆₇₈₉";

/** How read-aloud says a slab label. */
export function spokenLabel(seq: Sequence, i: number): string {
  const said = seq.say?.[i];
  if (said) return said;
  let s = seq.steps[i];
  s = s.replace(/\|(−?[\d.]+)\|/g, "the absolute value of $1");
  s = s.replace(/√\(([^)]*)\)/g, "the square root of $1,").replace(/√(\d+)/g, "the square root of $1");
  s = s.replace(/\)²/g, ") squared").replace(/x²/g, "x squared");
  s = s.replace(/[⁻⁰¹²³⁴⁵⁶⁷⁸⁹]+/g, (m) => ` to the power ${[...m].map((c) => (c === "⁻" ? "negative " : SUP.indexOf(c))).join("")}`);
  s = s.replace(/[₀₁₂₃₄₅₆₇₈₉]+/g, (m) => ` base ${[...m].map((c) => SUB.indexOf(c)).join("")} of`);
  s = s.replace(/(\d) M$/, "$1 meters").replace(/(\d) CM$/, "$1 centimeters").replace(/(\d) MM$/, "$1 millimeters");
  s = s.replace(/π/g, " pi ").replace(/°/g, " degrees").replace(/±/g, " plus or minus ").replace(/\^/g, " to the power ");
  s = s.replace(/(^|[(=\s,|])−(\d)/g, "$1negative $2");
  // Words in capitals are read as words, not spelled out.
  if (/[A-Z]{2,}/.test(s) && !/^[A-Z]$/.test(s)) s = s.toLowerCase();
  return s.replace(/\s+/g, " ").trim();
}

/** Goal line for the banner and read-aloud. */
export function goalText(seq: Sequence): string {
  return `Build ${seq.title}: bottom = ${seq.ends[0]}, top = ${seq.ends[1]}.`;
}

export const GRADE_BLURB: Record<Grade, string> = {
  K: "Seasons, how plants and people grow, story events, ABC order, counting and teen numbers",
  "1": "Sun and sky, plants and animals, story events, how-to steps, ABC order, tens and ones",
  "2": "Life cycles, heating and cooling, beginning-middle-end, writing steps, time, coins, 3-digit numbers",
  "3": "Plant life cycles, planets, heating ice, story events, procedures, products and fractions",
  "4": "Moon phases, fossils, weathering, story events, how things are made, fractions, decimals, units",
  "5": "Water cycle, food chains, body systems, research steps, order of operations, thousandths",
  "6": "Phase changes, EM waves, plot structure, writing process, integers, exponents, order of operations",
  "7": "Atmosphere layers, body organization, story events, research, two-step equations, rationals",
  "8": "Structure of matter, rock layers, flashback, MLA citations, scientific notation, irrationals",
  "9": "Rock cycle, stars, nonlinear plots, writing process, multi-step equations, rational exponents",
  "10": "Cell cycle, protein synthesis, character development, essay structure, completing the square",
  "11": "Atomic models, periodic trends, literary periods, sonnets, logs, radical and exponential equations",
  "12": "EM spectrum, energy transformations, tragedy structure, British literature, trig values, radians",
};

export const ALL_GRADES = GRADES;
