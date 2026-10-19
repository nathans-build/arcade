import type { Grade, Question } from "../kit/types";
import { MATH_GENERATORS } from "../kit/math";
import type { Draft } from "../kit/math/core";
import { BANK, type Area } from "./bank";
import { bandOf, dealQ, gradeN, shuffled, type Rng } from "./common";
import { topicAvailable, type Focus, type TopicId } from "./topics";

/*
 * Science Checks and math questions. Pure: the kit's written science bank comes in through
 * `KitScience` (the game passes the kit's bankFor, which needs Vite; npm test loads the bank files
 * directly), so this file runs under tsx.
 */

export type KitScience = (g: Grade) => Question[];

export interface PutQuestion extends Question {
  area: Area | "math";
  source: "bank" | "kit" | "math";
}

/* ---------------------------------------------------------------- misconception guard */

const NEGATION = /\b(not|no|never|don't|doesn't|isn't|aren't|can't|cannot|won't)\b|n't\b/i;
const MISCONCEPTIONS: RegExp[] = [
  // Insulators (or coats, coolers...) making or adding cold or heat.
  /\b(insulat\w*|foam|wool|cooler|coat|blanket|mitten\w*|cozy)\b[^.]*\b(make|makes|making|add|adds|adding|create|creates|give|gives|produce|produces)\s+(cold|coldness|cold energy|heat|warmth)\b/i,
  // Cold as a thing that flows.
  /\bcold\s+(flows?|moves?|travels?|goes|leaks?|spreads?)\b/i,
  /\bcold energy\b/i,
  // Heat flowing from colder to hotter.
  /\bheat\s+(always\s+)?(flows?|moves?|travels?|goes)\s+from\s+(the\s+)?(cold|colder|cooler)\b/i,
  // Metal being colder than wood at the same temperature.
  /\bmetal (is|was) (actually )?colder\b/i,
];

/** Sentences of a text that state a misconception as true (a negated sentence is fine). */
export function misconceptions(text: string): string[] {
  const out: string[] = [];
  for (const s of text.split(/(?<=[.!?])\s+/)) {
    if (NEGATION.test(s)) continue;
    if (MISCONCEPTIONS.some((re) => re.test(s))) out.push(s);
  }
  return out;
}

/** The correct answer and the explanation must be free of misconceptions (distractors may hold them). */
export function teachesMisconception(q: Question): boolean {
  return misconceptions(`${q.choices[q.answer]}.`).length > 0 || misconceptions(q.explanation).length > 0;
}

/* ---------------------------------------------------------------- science */

const ENERGY_STD = /^(PS\.2\.1|PS\.4\.2|PS\.5\.1\.3|PS\.6\.1\.2|PS\.6\.2|PS\.7\.2|PS\.Phy\.(6|8)|PS\.Chm\.4\.1|ESS\.2\.1\.1)/;
const ENERGY_WORDS = /\b(energy|electric\w*|circuit\w*|conduct\w*|insulat\w*|heat\w*|warm\w*|cold|cool\w*|melt\w*|freez\w*|temperature|batter(y|ies)|bulbs?|current|volt\w*|resist\w*|power|ohms?|sun|thermal|kinetic|wires?|fuse|generator|magnet\w*)\b/i;
const HEAT_WORDS = /\b(heat\w*|warm\w*|cold|cool\w*|melt\w*|freez\w*|temperature|thermal|sun|insulat\w*|ice)\b/i;

/** Kit science items about energy, electricity and heat that fit this game (and pass the guard). */
export function kitEnergyItems(g: Grade, kit: KitScience): PutQuestion[] {
  return kit(g)
    .filter((q) => ENERGY_STD.test(q.standard) && ENERGY_WORDS.test(`${q.prompt} ${q.choices.join(" ")}`) && !teachesMisconception(q))
    .map((q) => ({ ...q, area: HEAT_WORDS.test(q.prompt) ? "heat" : "electric", source: "kit" }));
}

export function bankItems(g: Grade): PutQuestion[] {
  const band = bandOf(g);
  return BANK[band].map((b) => ({
    id: `put-${band}-${b.id}`,
    subject: "science",
    grade: g,
    standard: b.standard,
    skill: b.skill,
    prompt: b.prompt,
    choices: b.choices,
    answer: 0,
    explanation: b.explanation,
    area: b.area,
    source: "bank",
  }));
}

export function scienceItems(g: Grade, kit: KitScience): PutQuestion[] {
  return [...bankItems(g), ...kitEnergyItems(g, kit)];
}

/* ---------------------------------------------------------------- math */

export interface MathGen {
  key: string;
  standard: string;
  skill: string;
  make: () => Draft;
}

const ri = (r: Rng, a: number, b: number) => a + Math.floor(r() * (b - a + 1));
/** Distractors that differ from the answer and each other (first three). */
const uniq = (answer: string, ws: string[]) => [...new Set(ws.filter((w) => w !== answer))].slice(0, 3);

/** Power Up Town's own formula questions (V = I × R, P = V × I) for algebra, grades 6-12. */
export function circuitGens(g: Grade, r: Rng = Math.random): MathGen[] {
  const n = gradeN(g);
  if (n < 6) return [];
  if (n === 6)
    return [{
      key: "vir-eval", standard: "NC.6.EE.2", skill: "Evaluate a formula",
      make: () => {
        const i = ri(r, 2, 6);
        const R = ri(r, 2, 9);
        return {
          prompt: `Sparky's formula: V = I × R. What is V when I = ${i} and R = ${R}?`,
          answer: String(i * R), wrong: uniq(String(i * R), [String(i + R), String(i * R + i), String(i * R + R + 2), String(i * R - 1), String(i * R * 2)]),
          explanation: `Put the numbers in: V = ${i} × ${R} = ${i * R}.`,
        };
      },
    }];
  if (n === 7)
    return [{
      key: "vir-solve", standard: "NC.7.EE.4", skill: "Solve equations",
      make: () => {
        const i = ri(r, 2, 6);
        const R = ri(r, 2, 9);
        return {
          prompt: `V = I × R. A ${i * R} V battery pushes ${i} A. Solve ${i * R} = ${i} × R. What is R (in ohms)?`,
          answer: String(R), wrong: uniq(String(R), [String(i * R * i), String(i * R - i), String(R + 1), String(i * R + i), String(R + 2)]),
          explanation: `Divide both sides by ${i}: R = ${i * R} ÷ ${i} = ${R} Ω.`,
        };
      },
    }];
  if (n === 8)
    return [{
      key: "series-solve", standard: "NC.8.EE.7", skill: "Solve linear equations",
      make: () => {
        const R = ri(r, 2, 9);
        const b = ri(r, 1, 6);
        const tot = 2 * R + b;
        return {
          prompt: `Two equal resistors R and a ${b} Ω resistor in series total ${tot} Ω. Solve 2R + ${b} = ${tot}. R = ?`,
          answer: String(R), wrong: uniq(String(R), [String(tot - b), String((tot + b) / 2), String(R + 2), String(tot / 2), String(R + 1), String(R + 3), String(tot)]),
          explanation: `Subtract ${b}: 2R = ${tot - b}. Divide by 2: R = ${R} Ω.`,
        };
      },
    }];
  return [{
    key: "power-solve", standard: "NC.M1.A-CED.4", skill: "Rearrange formulas",
    make: () => {
      const v = [6, 12, 24, 120][ri(r, 0, 3)];
      const i = [0.5, 1, 2, 3, 4][ri(r, 0, 4)];
      const p = v * i;
      return {
        prompt: `P = V × I. Solve for I, then find the current for a ${p} W device on ${v} V.`,
        answer: `I = P ÷ V = ${i} A`, wrong: [`I = P × V = ${p * v} A`, `I = V ÷ P = ${Math.round((v / p) * 1000) / 1000} A`, `I = P − V = ${p - v} A`],
        explanation: `Divide both sides of P = V × I by V: I = P ÷ V = ${p} ÷ ${v} = ${i} A.`,
      };
    },
  }];
}

const NUMBERS_STD = /\.(CC|OA|NBT|NF|NS)\.\d/;
const ALGEBRA_STD = /\.EE\.\d|\.A-(SSE|REI|APR|CED)\.|\.F-(IF|BF|LE)\.|\.AF\./;

export function mathGensFor(g: Grade, topic: TopicId | "all"): MathGen[] {
  const kit = (MATH_GENERATORS[g] ?? []).map((k) => ({ key: k.key, standard: k.standard, skill: k.skill, make: () => k.make(false) }));
  const own = circuitGens(g);
  if (topic === "numbers") return topicAvailable("numbers", g) ? kit.filter((k) => NUMBERS_STD.test(k.standard)) : [];
  if (topic === "algebra") return topicAvailable("algebra", g) ? [...own, ...kit.filter((k) => ALGEBRA_STD.test(k.standard))] : [];
  return [...own, ...kit];
}

let mathCounter = 0;

/** Builds a math question with 4 different choices (answer first), or null. */
export function buildMath(g: Grade, gen: MathGen, d: Draft): PutQuestion | null {
  const choices = [d.answer.trim()];
  const add = (w: string | undefined) => {
    const t = w?.trim();
    if (t && choices.length < 4 && !choices.includes(t)) choices.push(t);
  };
  d.wrong.forEach(add);
  for (let i = 0; choices.length < 4 && d.pad && i < 60; i++) add(d.pad());
  if (choices.length < 4 || !choices[0]) return null;
  return {
    id: `put-m-${gen.key}-${++mathCounter}`, subject: "math", grade: g, standard: gen.standard, skill: gen.skill,
    prompt: d.prompt, choices: choices as Question["choices"], answer: 0, explanation: d.explanation, area: "math", source: "math",
  };
}

export function mathItem(g: Grade, topic: TopicId | "all", r: Rng = Math.random): PutQuestion | null {
  const gens = mathGensFor(g, topic);
  if (!gens.length) return null;
  for (let attempt = 0; attempt < 40; attempt++) {
    const gen = gens[Math.floor(r() * gens.length)];
    try {
      const q = buildMath(g, gen, gen.make());
      if (q) return q;
    } catch {
      // try another generator
    }
  }
  return null;
}

/* ---------------------------------------------------------------- the deck */

export class Deck {
  private sci: PutQuestion[];
  private used = new Set<string>();
  private n = 0;
  constructor(
    readonly grade: Grade,
    readonly focus: Focus,
    kit: KitScience,
    private r: Rng = Math.random,
  ) {
    this.sci = shuffled(scienceItems(grade, kit), r);
  }

  /** The next question (choices shuffled). `area` prefers matching science items. */
  next(area?: "electric" | "heat"): PutQuestion {
    const f = this.focus;
    const wantMath = f.subject === "math" || (f.subject === "mixed" && this.n % 2 === 1);
    this.n++;
    if (wantMath) {
      const topic = f.subject === "math" ? f.topic : "all";
      const m = mathItem(this.grade, topic === "physical" ? "all" : topic, this.r);
      if (m) return dealQ(m, this.r);
    }
    let pool = this.sci.filter((q) => !this.used.has(q.id));
    if (!pool.length) {
      this.used.clear();
      pool = this.sci;
    }
    const fits = (q: PutQuestion) => (area === "heat" ? q.area === "heat" : area === "electric" ? q.area !== "heat" : true);
    const pickFrom = pool.some(fits) ? pool.filter(fits) : pool;
    const q = pickFrom[0];
    this.used.add(q.id);
    return dealQ(q, this.r);
  }
}
