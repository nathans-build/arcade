import type { Grade } from "../kit/types";
import { bandOf, build, gradeN, type CafeQ, type Chart, type Trial } from "./common";
import { pick, shuffle, type Rng } from "./rng";

/*
 * Bake-Off Finale experiments: change ONE variable, keep the rest the same, measure, and compare
 * on a bar chart. Results are typical kitchen-test values (rounded), and every trend is the
 * real one: more baking soda (with an acid in the batter) makes more CO2 and a taller rise up to
 * a point; a hotter oven browns faster; yeast is slow in the fridge and fastest when warm (not
 * hot); sugar dissolves faster in hotter tea.
 */

export interface Experiment {
  id: string;
  title: string;
  /** What Chef Bix changes on purpose (independent variable). */
  variable: string;
  /** What gets measured (dependent variable). */
  measure: string;
  unit: string;
  /** Kept the same for a fair test (controlled variables). */
  keepSame: [string, string, string];
  trials: [Trial, Trial, Trial];
  /** true: a bigger number is "more" of the good result (taller); false: smaller is faster. */
  biggerIsMore: boolean;
  /** For "between" predictions: a new setting between trials 0 and 1. */
  between: string;
  conclusion: string;
  std: { g35: string; g68: string; hs: string };
}

export const EXPERIMENTS: Experiment[] = [
  {
    id: "soda", title: "Baking soda and rise",
    variable: "Amount of baking soda", measure: "How tall the cupcakes rise", unit: "cm",
    keepSame: ["Oven temperature", "Baking time", "Amount of flour"],
    trials: [{ label: "No soda", value: 2 }, { label: "1/2 tsp", value: 4 }, { label: "1 tsp", value: 5 }],
    biggerIsMore: true, between: "1/4 tsp of baking soda",
    conclusion: "More baking soda reacted with the buttermilk's acid and made more CO2 gas, so the cupcakes rose taller. (Way too much tastes bitter and can make them sink!)",
    std: { g35: "PS.5.1.2", g68: "PS.8.1.4", hs: "PS.Chm.4.2" },
  },
  {
    id: "oven", title: "Oven heat and baking time",
    variable: "Oven temperature", measure: "Minutes until the cookies turn golden", unit: "min",
    keepSame: ["Cookie size", "The recipe", "The baking pan"],
    trials: [{ label: "300°F", value: 30 }, { label: "350°F", value: 20 }, { label: "400°F", value: 14 }],
    biggerIsMore: false, between: "325°F",
    conclusion: "Hotter ovens made the browning reactions go faster, so the cookies turned golden sooner.",
    std: { g35: "PS.5.1.2", g68: "PS.8.1", hs: "PS.Chm.5.1" },
  },
  {
    id: "yeast", title: "Where dough rises best",
    variable: "Temperature of the rising spot", measure: "How much the dough rose in 1 hour", unit: "cm",
    keepSame: ["Amount of yeast", "Size of the dough ball", "Rising time"],
    trials: [{ label: "Fridge 40°F", value: 1 }, { label: "Kitchen 75°F", value: 3 }, { label: "Warm 95°F", value: 5 }],
    biggerIsMore: true, between: "a cool 60°F pantry",
    conclusion: "Yeast are living things: warmth speeds up their fermentation, so they made CO2 faster and the dough rose more. (Above about 140°F the yeast would die.)",
    std: { g35: "PS.5.1.2", g68: "PS.8.1", hs: "LS.Bio.3.3" },
  },
  {
    id: "dissolve", title: "Sugar in cold and hot tea",
    variable: "Temperature of the tea", measure: "Seconds for the sugar to dissolve", unit: "s",
    keepSame: ["Amount of sugar", "Amount of tea", "How fast you stir"],
    trials: [{ label: "Iced tea", value: 120 }, { label: "Warm tea", value: 45 }, { label: "Hot tea", value: 15 }],
    biggerIsMore: false, between: "cool tea (between iced and warm)",
    conclusion: "Hot water particles move faster and pull the sugar apart sooner, so it dissolved faster. Dissolving is still a physical change.",
    std: { g35: "PS.5.1.2", g68: "PS.6.1.2", hs: "PS.Chm.6.1" },
  },
];

let expCounter = 0;

/** The value-of-a-bar word: "tallest" for rise, "longest" for times. */
function mostWord(e: Experiment): string {
  return e.unit === "cm" ? "rose the MOST" : "took the LONGEST";
}
function leastWord(e: Experiment): string {
  return e.unit === "cm" ? "rose the LEAST" : "was the FASTEST";
}

/** Chart reading for every grade (math for K-4, science bonus for 5+). */
export function chartQuestion(e: Experiment, grade: Grade, r: Rng): CafeQ | null {
  const n = gradeN(grade);
  const most = r() < 0.5;
  const vals = e.trials.map((t) => t.value);
  const target = most ? Math.max(...vals) : Math.min(...vals);
  const right = e.trials.find((t) => t.value === target)!;
  const chart: Chart = { title: e.measure, unit: e.unit, bars: e.trials };
  if (n >= 3) {
    // difference between the biggest and smallest bar
    const hi = e.trials.reduce((a, b) => (b.value > a.value ? b : a));
    const lo = e.trials.reduce((a, b) => (b.value < a.value ? b : a));
    const diff = hi.value - lo.value;
    const q = build(
      { id: `exp-${e.id}-diff-${++expCounter}`, subject: "math", grade, standard: n === 3 ? "NC.3.MD.3" : n <= 5 ? "NC.3.MD.3" : n <= 8 ? "NC.6.SP.5" : "NC.M1.S-ID.2", skill: "Read a bar graph", topic: "numbers", gen: "chartDiff", moment: "oven" },
      {
        prompt: `Look at the chart: ${e.measure.toLowerCase()} (${e.unit}). How much bigger is "${hi.label}" than "${lo.label}"?`,
        answer: `${diff} ${e.unit}`, wrong: [`${hi.value + lo.value} ${e.unit}`, `${diff + 1} ${e.unit}`, `${hi.value} ${e.unit}`, `${Math.max(1, diff - 2)} ${e.unit}`],
        explanation: `${hi.label}: ${hi.value} ${e.unit}. ${lo.label}: ${lo.value} ${e.unit}. ${hi.value} − ${lo.value} = ${diff} ${e.unit}.`,
        params: { exp: e.id },
      },
    );
    if (q) q.chart = chart;
    if (n <= 5 || r() < 0.5) return q;
  }
  const others = e.trials.filter((t) => t !== right).map((t) => t.label);
  const q = build(
    { id: `exp-${e.id}-chart-${++expCounter}`, subject: "math", grade, standard: n === 0 ? "NC.K.MD.2" : n === 1 ? "NC.1.MD.4" : n === 2 ? "NC.2.MD.10" : n <= 5 ? "NC.3.MD.3" : n <= 8 ? "NC.6.SP.5" : "NC.M1.S-ID.2", skill: "Read a bar graph", topic: "numbers", gen: "chartMost", moment: "oven" },
    {
      prompt: `Look at the chart: ${e.measure.toLowerCase()}. Which one ${most ? mostWord(e) : leastWord(e)}?`,
      answer: right.label, wrong: [...others, "They're all the same"],
      explanation: `The ${most ? "tallest" : "shortest"} bar is "${right.label}" at ${right.value} ${e.unit}.`,
      params: { exp: e.id, most },
    },
  );
  if (q) q.chart = chart;
  return q;
}

/** Fair-test questions (grades 5+): variables, controls, predictions, conclusions. */
export function experimentQuestion(e: Experiment, grade: Grade, r: Rng): CafeQ | null {
  const band = bandOf(grade);
  const std = band === "hs" ? e.std.hs : band === "g68" ? e.std.g68 : e.std.g35;
  const chart: Chart = { title: e.measure, unit: e.unit, bars: e.trials };
  const kind = pick(r, ["variable", "measure", "fair", "predict", "conclude"] as const);
  const base = { id: `exp-${e.id}-${kind}-${++expCounter}`, subject: "science" as const, grade, standard: std, skill: "Fair tests and variables", topic: "physical" as const, gen: `exp-${kind}`, moment: "oven" as const };
  let q: CafeQ | null = null;
  const keep = pick(r, e.keepSame);
  if (kind === "variable") {
    q = build(base, {
      prompt: `Test batch: ${e.title}. What did Chef Bix change ON PURPOSE in this test (the independent variable)?`,
      answer: e.variable, wrong: [e.measure, ...shuffle(r, e.keepSame).slice(0, 2)],
      explanation: `${e.variable} is the one thing changed on purpose. ${e.measure} is what we measured, and everything else stayed the same.`,
      params: { exp: e.id },
    });
  } else if (kind === "measure") {
    q = build(base, {
      prompt: `Test batch: ${e.title}. What did Chef Bix MEASURE to see the result (the dependent variable)?`,
      answer: e.measure, wrong: [e.variable, ...shuffle(r, e.keepSame).slice(0, 2)],
      explanation: `We measured ${e.measure.toLowerCase()} (in ${e.unit}). It depends on what we changed: ${e.variable.toLowerCase()}.`,
      params: { exp: e.id },
    });
  } else if (kind === "fair") {
    q = build(base, {
      prompt: `Test batch: ${e.title}. To keep it a FAIR test, which must stay the same in every trial?`,
      answer: keep, wrong: [e.variable, e.measure, "Nothing; change everything"],
      explanation: `Only ${e.variable.toLowerCase()} should change. Keep ${e.keepSame.map((k) => k.toLowerCase()).join(", ")} the same, or you can't tell what caused the difference.`,
      params: { exp: e.id, keep },
    });
  } else if (kind === "predict") {
    const [a, b] = e.trials;
    const lo = Math.min(a.value, b.value), hi = Math.max(a.value, b.value);
    q = build(base, {
      prompt: `Predict: a new trial uses ${e.between}. Using the chart, what result is most likely?`,
      answer: `Between ${lo} and ${hi} ${e.unit}`, wrong: [`Less than ${lo} ${e.unit}`, `More than ${Math.max(...e.trials.map((t) => t.value))} ${e.unit}`, `Exactly 0 ${e.unit}`],
      explanation: `${e.between[0].toUpperCase() + e.between.slice(1)} sits between "${a.label}" (${a.value} ${e.unit}) and "${b.label}" (${b.value} ${e.unit}), so the result should land between them.`,
      params: { exp: e.id },
    });
  } else {
    const correct = conclusionText(e);
    q = build(base, {
      prompt: `Test batch: ${e.title}. What does the chart show?`,
      answer: correct, wrong: wrongConclusions(e),
      explanation: e.conclusion,
      params: { exp: e.id },
    });
  }
  if (q) q.chart = chart;
  return q;
}

/** "Hotter oven temperature → fewer minutes" style conclusion, computed from the trials. */
export function conclusionText(e: Experiment): string {
  const up = e.trials[2].value > e.trials[0].value;
  return `More ${shortVar(e)} → ${up ? "bigger" : "smaller"} result`;
}
function wrongConclusions(e: Experiment): string[] {
  const up = e.trials[2].value > e.trials[0].value;
  return [`More ${shortVar(e)} → ${up ? "smaller" : "bigger"} result`, `${shortVar(e)[0].toUpperCase() + shortVar(e).slice(1)} made no difference`, "The test wasn't fair"];
}
function shortVar(e: Experiment): string {
  return e.id === "soda" ? "baking soda" : "heat";
}

export function experimentFor(r: Rng): Experiment {
  return pick(r, EXPERIMENTS);
}
