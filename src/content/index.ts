import type { Grade } from "@/kit";
import { gradeNumber } from "@/kit/grades";
import { ELA_BUILDS, ELA_RULES } from "./ela";
import { MATH_RULES, MATH_TEMPLATES, makeMathBuild } from "./math";
import { SCIENCE_BUILDS, SCIENCE_RULES } from "./science";
import { ruleLabels, type Subject, type SubjectMode, type BuildItem, type BuiltItem, type CategoryRule, type RuleLabel } from "./types";
import { shuffle } from "@/hop/geom";

export type Band = "k2" | "35" | "68" | "hs";
export type RoundKind = "build" | "color";

export type { Subject, SubjectMode };

export function bandOf(g: Grade): Band {
  const n = gradeNumber(g);
  return n <= 2 ? "k2" : n <= 5 ? "35" : n <= 8 ? "68" : "hs";
}

export const BAND_GRADES: Record<Band, Grade[]> = {
  k2: ["K", "1", "2"],
  "35": ["3", "4", "5"],
  "68": ["6", "7", "8"],
  hs: ["9", "10", "11", "12"],
};

/** Pyramid rows: 5 for K–2 (big cubes, big labels), 6 for 3–5, 7 from grade 6 up. */
export function rowsFor(g: Grade): number {
  const b = bandOf(g);
  return b === "k2" ? 5 : b === "35" ? 6 : 7;
}

/** How many wrong cubes a build round adds, and how many cubes a color round labels. */
export function roundSizes(g: Grade): { distractors: number; yes: number; no: number } {
  const rows = rowsFor(g);
  if (rows === 5) return { distractors: 2, yes: 3, no: 3 };
  if (rows === 6) return { distractors: 3, yes: 4, no: 4 };
  return { distractors: 3, yes: 5, no: 4 };
}

export const WRITTEN_BUILDS: Record<Exclude<Subject, "math">, BuildItem[]> = { ela: ELA_BUILDS, science: SCIENCE_BUILDS };
export const ALL_RULES: Record<Subject, CategoryRule[]> = { ela: ELA_RULES, math: MATH_RULES, science: SCIENCE_RULES };

/** Items tagged for this grade; if there are too few, the rest of its band joins in. */
function forGrade<T extends { grades: Grade[] }>(items: T[], g: Grade, min: number): T[] {
  const own = items.filter((i) => i.grades.includes(g));
  if (own.length >= min) return own;
  const band = BAND_GRADES[bandOf(g)];
  const more = items.filter((i) => !own.includes(i) && i.grades.some((x) => band.includes(x)));
  return own.concat(more);
}

export function writtenBuildsFor(g: Grade, subject: Exclude<Subject, "math">): BuildItem[] {
  return forGrade(WRITTEN_BUILDS[subject], g, 5);
}

export function mathTemplatesFor(g: Grade) {
  return forGrade(MATH_TEMPLATES, g, 1);
}

export function rulesFor(g: Grade, subject: Subject): CategoryRule[] {
  return forGrade(ALL_RULES[subject], g, 2);
}

export function withOrders(item: BuildItem): BuiltItem {
  return { ...item, orders: [item.tokens, ...(item.alts ?? [])] };
}

export type RoundSpec =
  | { kind: "build"; subject: Subject; item: BuiltItem }
  | { kind: "color"; subject: Subject; rule: CategoryRule; labels: RuleLabel[] };

export function specId(s: RoundSpec): string {
  return s.kind === "build" ? s.item.id : s.rule.id;
}

/** Picks which labels a color round puts on the pyramid. */
export function colorLabels(rule: CategoryRule, g: Grade, rand: () => number = Math.random): RuleLabel[] {
  const { yes, no } = roundSizes(g);
  const all = ruleLabels(rule);
  return shuffle([
    ...shuffle(all.filter((l) => l.match), rand).slice(0, yes),
    ...shuffle(all.filter((l) => !l.match), rand).slice(0, no),
  ], rand);
}

/** Short grade blurb for the title screen. */
export function blurb(g: Grade, subject: SubjectMode): string {
  const b = bandOf(g);
  const ela: Record<Band, string> = {
    k2: "capitals and periods, plurals, action and naming words",
    "35": "verb tenses, conjunctions, commas, parts of speech",
    "68": "pronoun case, clauses, modifiers, verbals, voice",
    hs: "parallel structure, semicolons, agreement, usage",
  };
  const math: Record<Band, string> = {
    k2: "add and subtract, teen numbers, even and odd",
    "35": "multiply and divide, fractions, primes, order of operations",
    "68": "exponents, integers, equations, roots, irrational numbers",
    hs: "solving, factoring, exponents, logs, the unit circle",
  };
  const sci: Record<Band, string> = {
    k2: "living things, weather, plants, solids and liquids",
    "35": "planets, conductors, rocks, producers, changes",
    "68": "heat, cells, energy, elements and resources",
    hs: "rocks, greenhouse gases, cells, bonds, vectors",
  };
  if (subject === "ela") return ela[b];
  if (subject === "math") return math[b];
  if (subject === "science") return sci[b];
  return "ELA, math and science rounds in turn";
}

/**
 * Serves rounds for a grade and subject mode. Rounds alternate "build" and "color"; in
 * mixed mode subjects rotate ELA → math → science. Written items don't repeat until the
 * pool is used up, and a round finished with mistakes comes back two rounds later.
 */
export class RoundDeck {
  private n = 0;
  private used = new Set<string>();
  private retries: { at: number; spec: RoundSpec }[] = [];
  private subjects: Subject[];

  constructor(public readonly grade: Grade, mode: SubjectMode, private rand: () => number = Math.random) {
    this.subjects = mode === "mixed" ? ["ela", "math", "science"] : [mode];
  }

  next(): RoundSpec {
    const i = this.n++;
    const kind: RoundKind = i % 2 === 0 ? "build" : "color";
    const due = this.retries.findIndex((r) => r.at <= i && r.spec.kind === kind && (this.subjects.length > 1 || r.spec.subject === this.subjects[0]));
    if (due >= 0) {
      const spec = this.retries.splice(due, 1)[0].spec;
      if (spec.kind === "color") return { ...spec, labels: colorLabels(spec.rule, this.grade, this.rand) };
      return spec;
    }
    return this.make(this.subjects[i % this.subjects.length], kind);
  }

  make(subject: Subject, kind: RoundKind): RoundSpec {
    const g = this.grade;
    if (kind === "color") {
      const rule = this.fresh(rulesFor(g, subject), (r) => r.id);
      return { kind, subject, rule, labels: colorLabels(rule, g, this.rand) };
    }
    if (subject === "math") {
      const t = this.fresh(mathTemplatesFor(g), (t) => t.id);
      return { kind, subject, item: makeMathBuild(t, this.rand, roundSizes(g).distractors) };
    }
    const item = this.fresh(writtenBuildsFor(g, subject), (b) => b.id);
    return { kind, subject, item: withOrders(item) };
  }

  /** Round finished with mistakes: bring it back a couple of rounds later. */
  retry(spec: RoundSpec) {
    if (this.retries.some((r) => specId(r.spec) === specId(spec))) return;
    this.retries.push({ at: this.n + 2, spec });
  }

  private fresh<T>(pool: T[], id: (t: T) => string): T {
    let options = pool.filter((p) => !this.used.has(id(p)));
    if (options.length === 0) {
      pool.forEach((p) => this.used.delete(id(p)));
      options = pool;
    }
    const pickT = options[Math.floor(this.rand() * options.length)];
    this.used.add(id(pickT));
    return pickT;
  }
}

