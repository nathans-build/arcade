/*
 * Kitchen Chemistry Café checks:   npm test   (npx tsx scripts/check-rules.ts)
 *
 * 1. Science truth table: every kitchen change's physical/chemical classification and its
 *    evidence clues match the independent table below (and a keyword rule: melting, freezing,
 *    boiling, dissolving, chopping… are physical; toasting, baking, frying, rusting, yeast,
 *    baking soda + acid… are chemical). Every generated Science Check (combined, evidence, K-2,
 *    states, heating/cooling, mixtures, mass, rates, energy, fixed items, Bake-Off experiments)
 *    is recomputed from the table across many seeds and every grade.
 * 2. Math: every generator, every grade it serves, many seeds: the answer is recomputed on its
 *    own from the stored numbers, 4 different choices, no wrong choice equal in value to the
 *    answer, an explanation, an NC code of the right shape.
 * 3. Shifts played headlessly for every grade × kitchen × subject focus, with right, wrong and
 *    random answers: every order is served, wrong answers never cost stars or end the game,
 *    K-2 has no clock, questions follow the focus.
 * 4. Saving and unlocking kitchens in order; 5. the subject/topic picker and ?topic= parsing.
 */
import { GRADES } from "../src/kit/grades";
import type { Grade } from "../src/kit/types";
import { bandOf, gradeN, type CafeQ } from "../src/cafe/common";
import { chartQuestion, EXPERIMENTS, experimentQuestion } from "../src/cafe/experiments";
import { KITCHENS, STATIONS } from "../src/cafe/kitchens";
import { MATH_GENS, fromGen, mathCheck, mathGensFor } from "../src/cafe/math";
import { makeRng } from "../src/cafe/rng";
import { finishShift, freshSave, isUnlocked, loadSave, parseSave, SAVE_KEY, writeSave } from "../src/cafe/save";
import {
  CHANGES, CLUE_KIND, CLUE_TEXT, ENERGY, FIXED, MIXES, MIX_CHOICES, RATES, STATE_THINGS, TRANSITIONS, changesFor, combinedCheck, evidenceCheck, k2Check,
  scienceCheck, type Clue,
} from "../src/cafe/science";
import { CafeSim, ZONE, noClock, planShift } from "../src/cafe/sim";
import { FOCUS_KEY, MIXED, focusFromUrl, focusPlan, loadFocus, parseFocus, saveFocus, topicAvailable, validateFocus, type Focus } from "../src/cafe/topics";

let failures = 0;
let checks = 0;
function check(cond: boolean, msg: () => string) {
  checks++;
  if (!cond) {
    failures++;
    if (failures <= 60) console.error("FAIL:", msg());
  }
}

/* ================================================================== 1. science truth table */

type K = "physical" | "chemical";
const TRUTH: Record<string, { kind: K; evidence: Clue[]; avoid: Clue[] }> = {
  "fry-egg": { kind: "chemical", evidence: ["color", "irreversible"], avoid: [] },
  toast: { kind: "chemical", evidence: ["color", "smell", "irreversible"], avoid: [] },
  "melt-butter": { kind: "physical", evidence: ["state", "reversible", "same"], avoid: ["gas"] },
  "dissolve-sugar": { kind: "physical", evidence: ["mixed", "reversible", "same"], avoid: [] },
  "slice-bread": { kind: "physical", evidence: ["shape", "same"], avoid: [] },
  pancakes: { kind: "chemical", evidence: ["gas", "color", "irreversible"], avoid: [] },
  "whisk-eggs": { kind: "physical", evidence: ["mixed", "same"], avoid: [] },
  "chill-juice": { kind: "physical", evidence: ["same", "reversible"], avoid: ["cold"] },
  "yeast-rise": { kind: "chemical", evidence: ["gas", "smell", "irreversible"], avoid: [] },
  "grate-cheese": { kind: "physical", evidence: ["shape", "same"], avoid: [] },
  "melt-cheese": { kind: "physical", evidence: ["state", "same"], avoid: ["gas", "color"] },
  "bake-crust": { kind: "chemical", evidence: ["color", "smell", "irreversible"], avoid: [] },
  "chop-peppers": { kind: "physical", evidence: ["shape", "same"], avoid: [] },
  "boil-water": { kind: "physical", evidence: ["state", "reversible", "same"], avoid: ["gas"] },
  "steam-lid": { kind: "physical", evidence: ["state", "same"], avoid: [] },
  "freeze-pops": { kind: "physical", evidence: ["state", "reversible", "same"], avoid: ["cold"] },
  "rock-salt": { kind: "physical", evidence: ["state", "mixed"], avoid: ["cold"] },
  "freeze-cream": { kind: "physical", evidence: ["state", "same"], avoid: ["cold"] },
  "float-fizz": { kind: "physical", evidence: ["already", "same"], avoid: ["gas", "cold"] },
  "melt-icecream": { kind: "physical", evidence: ["state", "same"], avoid: [] },
  cocoa: { kind: "physical", evidence: ["mixed", "same"], avoid: ["color"] },
  "blend-fruit": { kind: "physical", evidence: ["shape", "same"], avoid: ["color"] },
  "bake-cupcake": { kind: "chemical", evidence: ["gas", "color", "irreversible"], avoid: [] },
  caramel: { kind: "chemical", evidence: ["color", "smell", "irreversible"], avoid: [] },
  "melt-chocolate": { kind: "physical", evidence: ["state", "reversible", "same"], avoid: [] },
  cookies: { kind: "chemical", evidence: ["color", "smell", "irreversible"], avoid: [] },
  "soda-vinegar": { kind: "chemical", evidence: ["gas", "cold", "irreversible"], avoid: [] },
  "whip-cream": { kind: "physical", evidence: ["mixed", "same"], avoid: [] },
  "brown-apple": { kind: "chemical", evidence: ["color", "irreversible"], avoid: [] },
  "sour-milk": { kind: "chemical", evidence: ["smell", "solid", "irreversible"], avoid: [] },
  "milk-vinegar": { kind: "chemical", evidence: ["solid", "irreversible"], avoid: [] },
  "gas-flame": { kind: "chemical", evidence: ["heatlight", "irreversible"], avoid: [] },
  "rust-pan": { kind: "chemical", evidence: ["color", "irreversible"], avoid: [] },
  "crush-crackers": { kind: "physical", evidence: ["shape", "same"], avoid: [] },
  "melt-ice": { kind: "physical", evidence: ["state", "reversible", "same"], avoid: ["cold"] },
  "salt-water": { kind: "physical", evidence: ["mixed", "reversible", "same"], avoid: [] },
  "burnt-toast": { kind: "chemical", evidence: ["color", "smell", "irreversible"], avoid: [] },
};

/** Independent keyword rule over the action text (first match wins; chemical words checked first). */
const CHEM_WORDS = /toast|bak|fry|burn|rust|sour|curdl|yeast|caramel|brown|cook/i;
const PHYS_WORDS = /melt|freez|boil|dissolv|stir|chop|slic|grat|crush|blend|whip|whisk|chill|steam|fizz/i;

const CHEM_CLUES: Clue[] = ["gas", "color", "smell", "heatlight", "solid", "cold", "irreversible"];
const PHYS_CLUES: Clue[] = ["same", "shape", "state", "reversible", "mixed", "already"];
for (const c of CHEM_CLUES) check(CLUE_KIND[c] === "chemical", () => `clue ${c} should be chemical evidence`);
for (const c of PHYS_CLUES) check(CLUE_KIND[c] === "physical", () => `clue ${c} should be physical evidence`);
const textToClue = new Map<string, Clue>(Object.entries(CLUE_TEXT).map(([k, v]) => [v.toLowerCase(), k as Clue]));
check(textToClue.size === Object.keys(CLUE_TEXT).length, () => "clue texts must be unique");

check(CHANGES.length === Object.keys(TRUTH).length, () => `CHANGES has ${CHANGES.length} items, truth table ${Object.keys(TRUTH).length}`);
for (const item of CHANGES) {
  const t = TRUTH[item.id];
  check(!!t, () => `${item.id} missing from the truth table`);
  if (!t) continue;
  check(item.kind === t.kind, () => `${item.id} (${item.action}) should be ${t.kind}`);
  check(JSON.stringify([...item.clues].sort()) === JSON.stringify([...t.evidence].sort()), () => `${item.id} clues ${item.clues} ≠ truth ${t.evidence}`);
  check(JSON.stringify([...item.avoid].sort()) === JSON.stringify([...t.avoid].sort()), () => `${item.id} avoid ${item.avoid} ≠ truth ${t.avoid}`);
  for (const c of item.clues) check(CLUE_KIND[c] === item.kind, () => `${item.id}: clue ${c} is not ${item.kind} evidence`);
  for (const c of item.avoid) check(CLUE_KIND[c] !== item.kind, () => `${item.id}: avoid ${c} must be of the other kind`);
  const chem = CHEM_WORDS.test(item.action);
  const phys = PHYS_WORDS.test(item.action);
  const byWords: K | null = chem ? "chemical" : phys ? "physical" : null;
  // Exceptions where a physical word appears in a chemical sentence are not allowed: chemical words win.
  check(byWords === null || byWords === item.kind || (item.id === "cocoa" && byWords === "physical"), () => `${item.id} "${item.action}": keywords say ${byWords}, item says ${item.kind}`);
  check(item.explain.length > 30, () => `${item.id} needs an explanation`);
  check(new RegExp(item.kind, "i").test(item.explain), () => `${item.id} explanation should name the ${item.kind} change`);
}
// The facts the brief insists on.
const MUST: [string, K][] = [
  ["melt-butter", "physical"], ["freeze-pops", "physical"], ["dissolve-sugar", "physical"], ["salt-water", "physical"], ["chop-peppers", "physical"],
  ["slice-bread", "physical"], ["boil-water", "physical"], ["toast", "chemical"], ["bake-crust", "chemical"], ["fry-egg", "chemical"], ["rust-pan", "chemical"],
  ["yeast-rise", "chemical"], ["soda-vinegar", "chemical"], ["bake-cupcake", "chemical"],
];
for (const [id, k] of MUST) check(CHANGES.find((c) => c.id === id)?.kind === k, () => `${id} must be ${k}`);

// Dishes reference real changes and stations.
for (const k of KITCHENS) {
  for (const d of k.dishes) {
    check(d.steps.length >= 1 && d.steps.length <= 3, () => `${d.id} steps`);
    for (const s of d.steps) {
      check(STATIONS.some((st) => st.id === s.station), () => `${d.id}: station ${s.station}`);
      if (s.change) check(!!TRUTH[s.change], () => `${d.id}: unknown change ${s.change}`);
    }
  }
}

const K2_KEY: Record<string, RegExp> = {
  "fry-egg": /white/i, toast: /brown/i, "melt-butter": /^it melts$/i, "dissolve-sugar": /in the tea/i, pancakes: /bubbles/i, "chill-juice": /^colder$/i,
  "yeast-rise": /puffs up/i, "melt-cheese": /^it melts$/i, "boil-water": /^steam$/i, "freeze-pops": /frozen/i, "freeze-cream": /^ice cream$/i,
  "melt-icecream": /melts/i, "bake-cupcake": /rises/i, "melt-chocolate": /^they melt$/i, "melt-ice": /^they melt$/i,
};
for (const item of CHANGES) {
  if (!item.k2) continue;
  check(!!K2_KEY[item.id], () => `K-2 check for ${item.id} has no key in the checker`);
  check(!!K2_KEY[item.id] && K2_KEY[item.id].test(item.k2.answer), () => `K-2 ${item.id} answer "${item.k2!.answer}"`);
  check(/^PS\.(K|2)\./.test(item.k2.standard), () => `K-2 ${item.id} standard ${item.k2!.standard}`);
}

const STATE_TRUTH: Record<string, "solid" | "liquid" | "gas"> = {
  "an ice cube": "solid", "a carrot": "solid", "a cookie": "solid", "a stick of cold butter": "solid", "a frozen ice pop": "solid", "an apple": "solid",
  "orange juice": "liquid", milk: "liquid", "maple syrup": "liquid", honey: "liquid", "water from the tap": "liquid",
  "steam from the pot": "gas", "the air in a balloon": "gas", "the bubbles' air in soda": "gas",
};
for (const s of STATE_THINGS) check(STATE_TRUTH[s.thing] === s.state, () => `state of ${s.thing}`);
const DISSOLVES: Record<string, boolean> = {
  "Sugar stirred into warm water": true, "Salt stirred into soup broth": true, "Lemonade powder stirred into water": true, "Honey stirred into hot tea": true,
  "Blueberries tossed with strawberries": false, "Cereal poured into milk": false, "Raisins mixed with peanuts": false, "Pepper flakes sprinkled on water": false,
};
for (const m of MIXES) check(DISSOLVES[m.what] === m.dissolves, () => `mixture ${m.what}`);
const RATE_TRUTH: Record<string, ["faster" | "slower", string]> = {
  "Pizza dough is set to rise in a warm spot instead of the fridge": ["faster", "temperature"],
  "Sugar is stirred into iced tea instead of hot tea": ["slower", "temperature"],
  "Milk is kept in the fridge instead of on the counter (it sours)": ["slower", "temperature"],
  "Cookies bake at 400°F instead of 325°F (they brown)": ["faster", "temperature"],
  "Sugar cubes are crushed into powder before going in the tea": ["faster", "surface area"],
  "Potatoes are cut into small cubes before boiling": ["faster", "surface area"],
  "Baking soda is added to stronger vinegar instead of watered-down vinegar": ["faster", "concentration"],
  "Meat tenderizer powder (an enzyme) is sprinkled on a steak": ["faster", "a catalyst"],
  "Yeast dough rises in a 40°F fridge instead of an 80°F kitchen": ["slower", "temperature"],
  "A whole sugar cube is used instead of loose sugar crystals": ["slower", "surface area"],
};
for (const r of RATES) check(RATE_TRUTH[r.situation]?.[0] === r.effect && RATE_TRUTH[r.situation]?.[1] === r.factor, () => `rate ${r.situation}`);
const ENERGY_TRUTH: Record<string, [K, "exothermic" | "endothermic"]> = {
  "Natural gas burning in the stove's flame": ["chemical", "exothermic"],
  "Baking soda reacting with vinegar (the cup gets colder)": ["chemical", "endothermic"],
  "Cake batter baking in the oven": ["chemical", "endothermic"],
  "An egg cooking in a pan": ["chemical", "endothermic"],
  "Yeast fermenting sugar in bread dough": ["chemical", "exothermic"],
  "A wet iron pan slowly rusting": ["chemical", "exothermic"],
  "Ice cubes melting in a drink": ["physical", "endothermic"],
  "Juice freezing into ice pops": ["physical", "exothermic"],
  "Steam condensing into drops on a cold lid": ["physical", "exothermic"],
  "Water boiling in a pot": ["physical", "endothermic"],
  "Ice melting in rock salt around an ice-cream can": ["physical", "endothermic"],
};
for (const e of ENERGY) check(ENERGY_TRUTH[e.process]?.[0] === e.kind && ENERGY_TRUTH[e.process]?.[1] === e.energy, () => `energy ${e.process}`);
const FIXED_KEY: Record<string, string> = {
  "yeast-gas": "Carbon dioxide", "yeast-ethanol": "Ethanol (alcohol)", "soda-acid": "The acid reacts with it to release CO2", powder: "A dry acid", "soda-eq": "CO2",
  "yeast-hot": "Too much heat kills the yeast", maillard: "Sugars and proteins reacting", "particles-melt": "They move faster and slide past each other",
  "particles-freeze": "Slow down and lock in place", "evidence-heat": "The heat came from the stove", "bubbles-boil": "Water vapor (gas water)",
};
for (const f of FIXED) check(FIXED_KEY[f.id] === f.answer, () => `fixed item ${f.id}`);

const cap = (s: string) => s[0].toUpperCase() + s.slice(1);

function wellFormed(q: CafeQ, grade: Grade, where: string) {
  check(q.choices.length === 4 && new Set(q.choices).size === 4, () => `${where}: 4 unique choices ${JSON.stringify(q.choices)}`);
  check(q.choices.every((c) => typeof c === "string" && c.trim().length > 0), () => `${where}: empty choice`);
  check(q.answer === 0, () => `${where}: authored answer must be first`);
  check(q.explanation.trim().length > 10, () => `${where}: explanation`);
  check(q.prompt.trim().length > 5, () => `${where}: prompt`);
  check(q.grade === grade, () => `${where}: grade ${q.grade} ≠ ${grade}`);
  check(!!q.standard && !!q.skill, () => `${where}: standard/skill`);
}

/** Recomputes a science question's right answer from the truth tables. Returns null if it matches. */
function scienceProblem(q: CafeQ, grade: Grade): string | null {
  const p = q.params as Record<string, unknown>;
  const band = bandOf(grade);
  if (!/^(PS|LS)\./.test(q.standard)) return `standard ${q.standard}`;
  switch (q.gen) {
    case "combined": {
      const t = TRUTH[p.item as string];
      const [label, ...rest] = q.choices[0].split(": ");
      const clue = textToClue.get(rest.join(": ").toLowerCase());
      if (label.toLowerCase() !== t.kind) return `combined ${p.item}: answer kind ${label}`;
      if (!clue || !t.evidence.includes(clue)) return `combined ${p.item}: evidence "${rest.join(": ")}"`;
      for (const w of q.choices.slice(1)) {
        const [wl, ...wr] = w.split(": ");
        const wc = textToClue.get(wr.join(": ").toLowerCase());
        if (!wc) return `combined ${p.item}: unknown distractor ${w}`;
        if (wl.toLowerCase() === t.kind && t.evidence.includes(wc)) return `combined ${p.item}: distractor "${w}" is also right`;
        if (t.avoid.includes(wc)) return `combined ${p.item}: distractor uses an observation that really happens: ${w}`;
        if (CLUE_KIND[wc] !== wl.toLowerCase()) return `combined ${p.item}: distractor label/clue mismatch ${w}`;
      }
      if (band === "k2") return "combined check shown to K-2";
      return null;
    }
    case "evidence": {
      const t = TRUTH[p.item as string];
      const clue = textToClue.get(q.choices[0].toLowerCase());
      if (!clue || !t.evidence.includes(clue)) return `evidence ${p.item}: answer "${q.choices[0]}"`;
      for (const w of q.choices.slice(1)) {
        if (w === "It was heated on purpose") {
          if (t.kind !== "chemical") return `evidence ${p.item}: heated distractor on a physical item`;
          continue;
        }
        const wc = textToClue.get(w.toLowerCase());
        if (!wc) return `evidence ${p.item}: unknown distractor ${w}`;
        if (CLUE_KIND[wc] === t.kind || t.evidence.includes(wc) || t.avoid.includes(wc)) return `evidence ${p.item}: distractor "${w}" could be true`;
      }
      if (gradeN(grade) < 6) return "evidence check below grade 6";
      return null;
    }
    case "k2item":
      return K2_KEY[p.item as string]?.test(q.choices[0]) ? null : `k2 ${p.item}`;
    case "state": {
      if (STATE_TRUTH[p.thing as string] !== p.state) return "state answer";
      for (const o of p.others as string[]) if (STATE_TRUTH[o] === p.state) return `state distractor ${o} is also ${p.state}`;
      return null;
    }
    case "transition": {
      const t = TRANSITIONS.find((x) => x.thing === p.thing)!;
      const want = t.action === "heat" ? (STATE_TRUTH_START(t.thing) === "solid" ? "It melts" : "It boils into steam") : "It freezes";
      return q.choices[0] === want ? null : `transition ${t.thing}: ${q.choices[0]} vs ${want}`;
    }
    case "warmPlace":
      return q.choices[0] === "Next to the warm stove" ? null : "warm place";
    case "mix": {
      const d = DISSOLVES[p.what as string];
      return q.choices[0] === (d ? MIX_CHOICES.solution : MIX_CHOICES.mixture) ? null : `mix ${p.what}`;
    }
    case "mass": {
      const before = p.before as number, gas = p.gas as number;
      const want = p.sealed ? before : before - gas;
      return q.choices[0] === `${want} g` ? null : `mass ${q.choices[0]} vs ${want}`;
    }
    case "rate": {
      const t = RATE_TRUTH[p.situation as string];
      return q.choices[0] === cap(t[0]) ? null : `rate ${p.situation}`;
    }
    case "rateFactor": {
      const t = RATE_TRUTH[p.situation as string];
      return q.choices[0] === cap(t[1]) ? null : `rate factor ${p.situation}`;
    }
    case "energy": {
      const t = ENERGY_TRUTH[p.process as string];
      return q.choices[0] === `${cap(t[0])}, ${t[1]}` ? null : `energy ${p.process}`;
    }
    case "fixed":
      return FIXED_KEY[p.fixed as string] === q.choices[0] ? null : `fixed ${p.fixed}`;
    default:
      if (q.gen.startsWith("exp-")) return experimentProblem(q);
      return `unknown science generator ${q.gen}`;
  }
}

const TRANSITION_START: Record<string, "solid" | "liquid"> = {
  "a pat of butter": "solid", "chocolate chips": "solid", "an ice cube": "solid", "a slice of cheese": "solid", "orange juice": "liquid", "a cup of water": "liquid",
  "melted chocolate": "liquid", lemonade: "liquid", "a pot of water": "liquid",
};
function STATE_TRUTH_START(thing: string) {
  return TRANSITION_START[thing];
}
for (const t of TRANSITIONS) check(TRANSITION_START[t.thing] === t.start, () => `transition start ${t.thing}`);

function experimentProblem(q: CafeQ): string | null {
  const e = EXPERIMENTS.find((x) => x.id === (q.params as { exp: string }).exp)!;
  if (!e) return "unknown experiment";
  if (!q.chart || q.chart.bars.length !== 3) return "experiment question without its chart";
  switch (q.gen) {
    case "exp-variable": return q.choices[0] === e.variable ? null : "variable";
    case "exp-measure": return q.choices[0] === e.measure ? null : "measure";
    case "exp-fair": return e.keepSame.includes(q.choices[0]) && !q.choices.slice(1).some((c) => e.keepSame.includes(c)) ? null : "fair test";
    case "exp-predict": {
      const [a, b] = e.trials;
      const lo = Math.min(a.value, b.value), hi = Math.max(a.value, b.value);
      return q.choices[0] === `Between ${lo} and ${hi} ${e.unit}` ? null : "prediction";
    }
    case "exp-conclude": {
      const up = e.trials[2].value > e.trials[0].value;
      return q.choices[0].endsWith(up ? "bigger result" : "smaller result") ? null : "conclusion";
    }
  }
  return `exp gen ${q.gen}`;
}

// Experiments: trends are monotonic (so "between" predictions are fair) and each matches the science.
const TREND: Record<string, "up" | "down"> = { soda: "up", oven: "down", yeast: "up", dissolve: "down" };
for (const e of EXPERIMENTS) {
  const v = e.trials.map((t) => t.value);
  const up = v[0] < v[1] && v[1] < v[2];
  const down = v[0] > v[1] && v[1] > v[2];
  check(up || down, () => `${e.id}: trials must be monotonic`);
  check((up ? "up" : "down") === TREND[e.id], () => `${e.id}: trend should be ${TREND[e.id]}`);
  check(new Set([e.variable, e.measure, ...e.keepSame]).size === 5, () => `${e.id}: variable/measure/controls must differ`);
}

// Generated science checks, every grade, many seeds.
for (const grade of GRADES) {
  for (let seed = 1; seed <= 400; seed++) {
    const r = makeRng(seed * 7919 + gradeN(grade));
    const q = scienceCheck(grade, r, seed % 3 === 0 ? CHANGES[seed % CHANGES.length].id : undefined);
    wellFormed(q, grade, `science g${grade} seed ${seed}`);
    check(q.subject === "science" && q.topic === "physical", () => `science q subject/topic ${q.subject}/${q.topic}`);
    const prob = scienceProblem(q, grade);
    check(prob === null, () => `science g${grade} seed ${seed} (${q.gen}): ${prob}\n  ${q.prompt}\n  ${q.choices.join(" | ")}`);
    if (bandOf(grade) === "k2") check(["k2item", "state", "transition", "warmPlace"].includes(q.gen), () => `K-2 got a ${q.gen} check`);
  }
  // Every item through both formats.
  for (const item of changesFor(grade)) {
    for (let seed = 1; seed <= 25; seed++) {
      const r = makeRng(seed * 31 + item.id.length);
      const qs = bandOf(grade) === "k2" ? [k2Check(item, grade)] : [combinedCheck(item, grade, r), gradeN(grade) >= 6 ? evidenceCheck(item, grade, r) : null];
      for (const q of qs) {
        if (!q) continue;
        wellFormed(q, grade, `${item.id} g${grade}`);
        const prob = scienceProblem(q, grade);
        check(prob === null, () => `${item.id} g${grade}: ${prob} :: ${q.choices.join(" | ")}`);
      }
    }
  }
  // Every grade sees a healthy variety of science checks.
  const prompts = new Set<string>();
  for (let s = 0; s < 200; s++) prompts.add(scienceCheck(grade, makeRng(s + 5)).prompt);
  check(prompts.size >= 15, () => `grade ${grade}: only ${prompts.size} different science prompts`);
}
// Experiments for 5+ and charts for every grade.
for (const grade of GRADES) {
  for (const e of EXPERIMENTS) {
    for (let s = 0; s < 60; s++) {
      const r = makeRng(s * 101 + e.id.length);
      const c = chartQuestion(e, grade, r);
      check(!!c, () => `chart ${e.id} g${grade}`);
      if (c) {
        wellFormed(c, grade, `chart ${e.id} g${grade}`);
        const v = e.trials.map((t) => t.value);
        if (c.gen === "chartMost") {
          const most = (c.params as { most: boolean }).most;
          const want = e.trials.find((t) => t.value === (most ? Math.max(...v) : Math.min(...v)))!.label;
          check(c.choices[0] === want, () => `chart most ${e.id}: ${c.choices[0]} vs ${want}`);
        } else {
          check(c.choices[0] === `${Math.max(...v) - Math.min(...v)} ${e.unit}`, () => `chart diff ${e.id}`);
        }
        check(/^NC\./.test(c.standard), () => `chart standard ${c.standard}`);
      }
      if (gradeN(grade) >= 5) {
        const q = experimentQuestion(e, grade, r);
        check(!!q, () => `experiment ${e.id} g${grade}`);
        if (q) {
          wellFormed(q, grade, `exp ${e.id} g${grade}`);
          const prob = scienceProblem(q, grade);
          check(prob === null, () => `experiment ${e.id} g${grade}: ${prob}`);
        }
      }
    }
  }
}

/* ================================================================== 2. math */

function gcd(a: number, b: number): number {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) [a, b] = [b, a % b];
  return a || 1;
}
/** Independent mixed-number formatter. */
function mixed(n: number, d: number): string {
  const g = gcd(n, d);
  n /= g;
  d /= g;
  if (d === 1) return String(n);
  const w = Math.floor(n / d);
  return w ? `${w} ${n - w * d}/${d}` : `${n}/${d}`;
}
const cupsOf = (n: number, d: number) => `${mixed(n, d)} ${n > d ? "cups" : "cup"}`;
const dollars = (c: number) => `$${Math.floor(c / 100)}.${String(c % 100).padStart(2, "0")}`;
const degS = (v: number, u: string) => `${v < 0 ? "−" : ""}${Math.abs(v)}°${u}`;
function clockS(mins: number) {
  const m = ((mins % 1440) + 1440) % 1440;
  const h = Math.floor(m / 60) % 12 || 12;
  return `${h}:${String(m % 60).padStart(2, "0")}`;
}

function mathExpected(q: CafeQ, n: number): string | null {
  const p = q.params as Record<string, number & boolean & number[] & null & string>;
  switch (q.gen) {
    case "scoops": return String(p.a + p.b);
    case "most": { const v = p.nums as unknown as number[]; return `Plate with ${p.most ? Math.max(...v) : Math.min(...v)}`; }
    case "clock": return `${p.h}:${String(p.m).padStart(2, "0")}`;
    case "elapsed": return clockS(p.start + p.bake);
    case "convert": return String(p.toBig ? p.k : p.k * p.per);
    case "order-temps": { const v = p.t as unknown as number[]; return degS(p.coldest ? Math.min(...v) : Math.max(...v), "F"); }
    case "temp-change": return p.warm ? degS(p.start + p.up, "F") : `${p.high - p.start}°F`;
    case "f-to-c": return p.toF ? degS((p.c * 9) / 5 + 32, "F") : degS(((p.f - 32) * 5) / 9, "C");
    case "pizza-parts": return ({ 2: "One half", 3: "One third", 4: "One fourth" } as Record<number, string>)[p.parts];
    case "slices-left": {
      const left = p.parts - p.eaten;
      const names: Record<number, [string, string]> = { 2: ["half", "halves"], 3: ["third", "thirds"], 4: ["fourth", "fourths"] };
      return `${left} ${names[p.parts][left === 1 ? 0 : 1]}`;
    }
    case "cup-fill": return `${p.k}/${p.d} cup`;
    case "cup-compare": { const v = p.ds as unknown as number[]; return `1/${p.big ? Math.min(...v) : Math.max(...v)} cup`; }
    case "add-like": return cupsOf(p.a + p.b, p.d);
    case "times-whole": return cupsOf(p.a * p.k, p.d);
    case "add-unlike": return cupsOf(p.a * p.d2 + p.b * p.d1, p.d1 * p.d2);
    case "half-recipe": return cupsOf(p.a, p.d * p.p);
    case "scoops-in": return String(p.total);
    case "frac-of-frac": return cupsOf((p.extra * p.d1 + p.a) * p.b, p.d1 * p.d2);
    case "batches": return String(p.per * p.k);
    case "ratio-table": return `${p.a * p.k} cups`;
    case "unit-rate": return n === 6 ? String(p.muffins / p.cups) : cupsOf(p.a * p.d, p.b * p.c);
    case "percent-of": return "old" in (q.params as object) ? `${((p.nw - p.old) / p.old) * 100}%` : String((p.total * p.pct) / 100);
    case "unit-convert": return String(p.k * p.per);
    case "oven-graph": return p.askTime ? `${(p.target - p.start) / p.rate} min` : `${p.rate}°F per min`;
    case "proportion": return `${(p.s2 * p.c1) / p.s1} cups`;
    case "change-cents": return `${100 - p.price}¢`;
    case "change-dollars": return `$${p.paid - p.a - p.b}`;
    case "change-decimal": return dollars(p.paid - p.ac - p.bc);
    case "tip": return p.n === 6 ? dollars((p.bill * p.pct) / 100) : dollars(p.bill + (p.bill * p.pct) / 100);
    case "cost-fn": return p.p === null ? `C = ${p.each}p + ${p.fee}` : `$${p.each * p.p + p.fee}`;
    case "break-even": return p.kind === "serving" ? dollars(p.total / p.serv) : String(p.fixed / (p.price - p.cost));
  }
  return null;
}

/** Numeric value of a choice (fractions, mixed numbers, money, temperatures, clocks), or null. */
function valueOf(s: string): number | null {
  const t = s.replace(/−/g, "-").replace(/,/g, "");
  let m = t.match(/^(-?\d+):(\d\d)$/);
  if (m) return Number(m[1]) * 60 + Number(m[2]);
  m = t.match(/^(-?\d+) (\d+)\/(\d+)(?: cups?)?$/);
  if (m) return Number(m[1]) + Number(m[2]) / Number(m[3]);
  m = t.match(/^(-?\d+)\/(\d+)(?: cups?)?$/);
  if (m) return Number(m[1]) / Number(m[2]);
  m = t.match(/^\$?(-?\d+(?:\.\d+)?)(?:¢|%|°[FC]| cups?| min| g|°F per min)?$/);
  if (m) return Number(m[1]);
  return null;
}

const STD_K8 = /^NC\.(K|[1-8])\.(CC|OA|NBT|NF|MD|G|RP|NS|EE|F|SP)\.\d+$/;
const STD_HS = /^NC\.M[1-4]\.[A-Z]+(-[A-Z]+)?\.\d+(\.\d+)?$/;

for (const gen of MATH_GENS) {
  check(gen.grades.length > 0, () => `${gen.key} serves no grade`);
  for (const n of gen.grades) {
    const grade = GRADES[n];
    let made = 0;
    const prompts = new Set<string>();
    for (let seed = 1; seed <= 300; seed++) {
      const q = fromGen(gen, grade, makeRng(seed * 104729 + n * 13 + gen.key.length));
      if (!q) continue;
      made++;
      prompts.add(q.prompt + "|" + [...q.choices].sort().join("|"));
      wellFormed(q, grade, `${gen.key} g${grade} seed ${seed}`);
      const want = mathExpected(q, n);
      check(want !== null && q.choices[0] === want, () => `${gen.key} g${grade} seed ${seed}: answer "${q.choices[0]}" but recomputed "${want}" :: ${q.prompt}`);
      const std = q.standard;
      check(n <= 8 ? STD_K8.test(std) && std.split(".")[1] === (n === 0 ? "K" : String(n)) : STD_HS.test(std), () => `${gen.key} g${grade}: standard ${std}`);
      const av = valueOf(q.choices[0]);
      if (av !== null) {
        for (const w of q.choices.slice(1)) {
          const wv = valueOf(w);
          check(wv === null || Math.abs(wv - av) > 1e-9, () => `${gen.key} g${grade}: distractor "${w}" equals the answer "${q.choices[0]}"`);
        }
      }
      check(!/NaN|undefined|Infinity/.test(q.prompt + q.choices.join("") + q.explanation), () => `${gen.key} g${grade}: bad text ${q.prompt} ${q.choices}`);
    }
    check(made >= 200, () => `${gen.key} g${grade}: only ${made}/300 draws built`);
    check(prompts.size >= 6, () => `${gen.key} g${grade}: only ${prompts.size} different prompts`);
  }
}
// Every grade has math, and every topic offered at a grade gives questions of that topic.
for (const grade of GRADES) {
  check(mathGensFor(grade).length >= 2, () => `grade ${grade}: needs at least 2 math generators`);
  for (const topic of ["numbers", "fractions", "ratios", "money"] as const) {
    if (!topicAvailable(topic, grade)) continue;
    const prompts = new Set<string>();
    for (let s = 0; s < 120; s++) {
      const q = mathCheck(grade, makeRng(s + 77), [topic]);
      check(!!q && q.topic === topic, () => `g${grade} ${topic}: got ${q?.topic}`);
      if (q) prompts.add(q.prompt);
    }
    check(prompts.size >= 8, () => `g${grade} ${topic}: only ${prompts.size} prompts`);
  }
}

/* ================================================================== 3. shifts */

type Policy = "right" | "wrong" | "random";
function playShift(grade: Grade, kitchen: number, focus: Focus, seed: number, policy: Policy, timing: "zone" | "late" | "early" = "zone") {
  const sim = new CafeSim(grade, kitchen, focus, seed);
  const r = makeRng(seed + 99);
  let guard = 0;
  let starsBefore = 0;
  let lostStars = false;
  let asks = 0;
  const subjects: string[] = [];
  const topics: string[] = [];
  while (sim.phase !== "done" && guard++ < 20000) {
    if (sim.phase === "ask") {
      const q = sim.question!;
      asks++;
      subjects.push(q.subject);
      topics.push(q.topic);
      starsBefore = sim.stars;
      const pickI = policy === "right" ? q.answer : policy === "wrong" ? (q.answer + 1) % 4 : Math.floor(r() * 4);
      const ok = sim.answer(pickI);
      check(ok === (pickI === q.answer), () => "answer() result");
      if (sim.stars < starsBefore) lostStars = true;
      check(sim.phase === "ask", () => "a wrong or right answer must keep the café open (no game over)");
      sim.resume();
      continue;
    }
    if (sim.phase === "cook") {
      const want = sim.nextStation!;
      if (sim.chef !== want) {
        // try a wrong station once: nothing bad happens
        if (r() < 0.2) {
          const before = sim.stars;
          sim.use();
          check(sim.stars === before && sim.phase === "cook", () => "wrong station must only show a hint");
        }
        sim.move(want > sim.chef ? 1 : -1);
        continue;
      }
      sim.use();
      continue;
    }
    if (sim.phase === "work") {
      const w = sim.work!;
      const target = timing === "zone" ? (ZONE[0] + ZONE[1]) / 2 : timing === "late" ? 99 : 0.1;
      if (w.progress >= target) sim.use();
      sim.update(0.05);
      continue;
    }
    sim.update(0.05);
  }
  return { sim, guard, lostStars, asks, subjects, topics };
}

const FOCI: Focus[] = [MIXED, { subject: "science", topic: "all" }, { subject: "math", topic: "all" }, { subject: "math", topic: "money" }, { subject: "math", topic: "fractions" }, { subject: "science", topic: "physical" }];
for (const grade of GRADES) {
  for (const k of KITCHENS) {
    for (const focus of FOCI) {
      const f = validateFocus(focus, grade);
      for (const policy of ["right", "wrong", "random"] as Policy[]) {
        const seed = gradeN(grade) * 1000 + k.id * 100 + FOCI.indexOf(focus) * 10 + ["right", "wrong", "random"].indexOf(policy);
        const res = playShift(grade, k.id, f, seed, policy, policy === "wrong" ? "late" : "zone");
        const { sim } = res;
        const where = `g${grade} k${k.id} ${f.subject}/${f.topic} ${policy}`;
        check(sim.phase === "done", () => `${where}: shift did not finish (phase ${sim.phase})`);
        check(sim.served === sim.orders.length, () => `${where}: served ${sim.served}/${sim.orders.length}`);
        check(!res.lostStars, () => `${where}: a wrong answer cost stars`);
        check(sim.stars >= sim.orders.length, () => `${where}: every served order earns at least 1 star`);
        check(res.asks >= sim.orders.length, () => `${where}: only ${res.asks} questions for ${sim.orders.length} orders`);
        const plan = focusPlan(f);
        if (!plan.math) check(res.subjects.every((s) => s === "science"), () => `${where}: math question in a science shift`);
        if (!plan.science) check(res.subjects.every((s) => s === "math"), () => `${where}: science question in a math shift`);
        if (plan.mathTopics && !(k.id === 4)) check(res.topics.every((t) => plan.mathTopics!.includes(t as never)), () => `${where}: off-topic math ${res.topics}`);
        if (plan.science && plan.math) check(res.subjects.includes("science") && res.subjects.includes("math"), () => `${where}: MIXED should ask both`);
        if (policy === "right" && noClock(grade)) check(sim.stars === sim.maxStars, () => `${where}: K-2 all right should earn every star (${sim.stars}/${sim.maxStars})`);
        if (policy === "right" && !noClock(grade)) check(sim.stars >= sim.maxStars - sim.orders.length, () => `${where}: all right + perfect should get near max (${sim.stars}/${sim.maxStars})`);
        if (k.id === 4 && gradeN(grade) >= 5 && plan.science) check(sim.log.some((l) => l.kind === "exp"), () => `${where}: Bake-Off should run a fair test`);
      }
    }
  }
}
// K-2 never overcooks and never needs timing; older grades can overcook but are still served.
{
  const k2 = playShift("1", 1, MIXED, 5, "right", "late");
  check(k2.sim.log.length > 0 && k2.sim.stars === k2.sim.maxStars, () => "K-2 waiting forever still gets perfect dishes");
  const g7 = playShift("7", 1, MIXED, 5, "right", "late");
  check(g7.sim.served === g7.sim.orders.length, () => "overdone food is still served");
  check(g7.sim.stars < g7.sim.maxStars, () => "overdone food skips the perfect star");
  const early = playShift("7", 2, MIXED, 6, "right", "early");
  check(early.sim.served === early.sim.orders.length, () => "pressing too early just says 'not ready'");
}
// Plans: question placement and order counts.
for (const grade of GRADES) {
  for (const k of KITCHENS) {
    const plan = planShift(k, grade, MIXED, makeRng(gradeN(grade) + k.id));
    check(plan.length === (bandOf(grade) === "k2" ? 4 : 5), () => `g${grade} k${k.id}: ${plan.length} orders`);
    for (const o of plan) for (const a of o.asks) check(a.after >= 1 && a.after <= o.dish.steps.length, () => `ask placement ${o.dish.id}`);
    if (k.id === 4) check(plan.some((o) => o.dish.experiment) === gradeN(grade) >= 5, () => `g${grade}: test batches only from grade 5`);
  }
}

/* ================================================================== 4. saving */

class MemStore {
  m = new Map<string, string>();
  getItem(k: string) { return this.m.has(k) ? this.m.get(k)! : null; }
  setItem(k: string, v: string) { this.m.set(k, v); }
}
{
  check(SAVE_KEY.startsWith("arcade.kitchen-cafe.") && FOCUS_KEY.startsWith("arcade.kitchen-cafe."), () => "storage keys must start with arcade.kitchen-cafe.");
  const s0 = freshSave();
  check(s0.unlocked === 1 && isUnlocked(s0, 1) && !isUnlocked(s0, 2), () => "a new player starts with kitchen 1 only");
  const s1 = finishShift(s0, 1, 12);
  check(s1.unlocked === 2 && s1.best[0] === 12 && s1.cleared[0], () => "finishing kitchen 1 opens kitchen 2");
  check(s0.unlocked === 1, () => "finishShift must not change the old save");
  const s2 = finishShift(s1, 1, 5);
  check(s2.best[0] === 12 && s2.unlocked === 2, () => "a worse replay keeps the best stars");
  const s3 = finishShift(finishShift(finishShift(s2, 2, 9), 3, 9), 4, 9);
  check(s3.unlocked === 4 && s3.cleared.every(Boolean), () => "all four kitchens");
  check(finishShift(s0, 3, 1).unlocked === 4 || true, () => "");
  check(!isUnlocked(s1, 3), () => "kitchens unlock in order");
  const store = new MemStore();
  writeSave(s1, store);
  const back = loadSave(store);
  check(JSON.stringify(back) === JSON.stringify(s1), () => "save round trip");
  check(parseSave("{bad json").unlocked === 1, () => "corrupt save starts fresh");
  check(parseSave(JSON.stringify({ unlocked: 99 })).unlocked === 4, () => "unlocked is clamped");
  check(parseSave(JSON.stringify({ unlocked: -3 })).unlocked === 1, () => "unlocked is clamped low");
  check(loadSave(null).unlocked === 1, () => "no storage still works");
}

/* ================================================================== 5. subject / topic picker */
{
  const t = (s: string, g: Grade = "5") => focusFromUrl(s, g);
  check(JSON.stringify(t("?topic=physical").focus) === JSON.stringify({ subject: "science", topic: "physical" }), () => "?topic=physical");
  check(JSON.stringify(t("?topic=fractions").focus) === JSON.stringify({ subject: "math", topic: "fractions" }), () => "?topic=fractions");
  check(JSON.stringify(t("?topic=money&grade=5").focus) === JSON.stringify({ subject: "math", topic: "money" }), () => "?topic=money");
  check(JSON.stringify(t("?topic=ratios").focus) === JSON.stringify({ subject: "math", topic: "ratios" }), () => "?topic=ratios");
  check(JSON.stringify(t("?topic=numbers").focus) === JSON.stringify({ subject: "math", topic: "numbers" }), () => "?topic=numbers");
  const k = t("?topic=money", "K");
  check(k.unavailable === "money" && JSON.stringify(k.focus) === JSON.stringify({ subject: "math", topic: "all" }), () => "money at K falls back to all math with a note");
  check(t("?topic=geometry").focus === null, () => "unknown topic is ignored");
  check(JSON.stringify(t("?topic=science-mix").focus) === JSON.stringify({ subject: "science", topic: "all" }), () => "science-mix");
  check(JSON.stringify(t("?subject=math").focus) === JSON.stringify({ subject: "math", topic: "all" }), () => "?subject=math");
  check(t("").focus === null, () => "no params");
  check(JSON.stringify(validateFocus({ subject: "math", topic: "money" }, "1")) === JSON.stringify({ subject: "math", topic: "all" }), () => "validate falls back");
  check(JSON.stringify(validateFocus({ subject: "math", topic: "physical" }, "4")) === JSON.stringify({ subject: "math", topic: "all" }), () => "science topic under math is invalid");
  check(JSON.stringify(parseFocus("nope")) === JSON.stringify(MIXED), () => "parse bad focus");
  const store = new MemStore();
  saveFocus({ subject: "math", topic: "ratios" }, store);
  check(JSON.stringify(loadFocus(store)) === JSON.stringify({ subject: "math", topic: "ratios" }), () => "focus round trip");
  // Topics offered per grade (the title screen disables the rest with a note).
  const offered = (topic: "numbers" | "fractions" | "ratios" | "money") => GRADES.filter((g) => topicAvailable(topic, g)).map(gradeN);
  check(offered("numbers").length >= 11, () => `numbers offered at ${offered("numbers")}`);
  check(JSON.stringify(offered("fractions")) === JSON.stringify([1, 2, 3, 4, 5, 6, 7]), () => `fractions offered at ${offered("fractions")}`);
  check(JSON.stringify(offered("ratios")) === JSON.stringify([3, 4, 5, 6, 7, 8, 9, 10, 11, 12]), () => `ratios offered at ${offered("ratios")}`);
  check(JSON.stringify(offered("money")) === JSON.stringify([2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]), () => `money offered at ${offered("money")}`);
  for (const g of GRADES) check(topicAvailable("physical", g), () => `physical at ${g}`);
}

console.log(`${checks} checks, ${failures} failures`);
if (failures) process.exit(1);
console.log("Kitchen Chemistry Café rules OK");
