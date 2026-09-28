/*
 * Checks all of Cube Hop's content for every grade:  npm test
 *  - enough build items and color rules per grade band and subject (≥ 10 sentences, ≥ 4 rules)
 *    and per grade; no duplicate ids, sentences or labels
 *  - sentences reconstruct exactly from their tokens, start with a capital, end with a mark,
 *    and distractors never equal a token
 *  - math equations are true in every accepted order, and no distractor (alone or in a pair)
 *    can make a true equation; generated items contain no NaN
 *  - build paths exist: on many random layouts, every label is reachable from the top over
 *    blank cubes, and each next token can be reached from the previous one
 *  - color rules: ≥ 8 matching and ≥ 8 non-matching labels, no overlap, math memberships
 *    re-computed independently, element/metal/ionic lists checked against a periodic table
 *  - every label has glyphs and fits a cube top at its grade's size (big labels for K–1)
 *  - standards codes match the grades they are tagged with
 */
import { GRADES } from "../src/kit/grades";
import type { Grade } from "../src/kit/types";
import {
  ALL_RULES,
  BAND_GRADES,
  RoundDeck,
  WRITTEN_BUILDS,
  bandOf,
  colorLabels,
  mathTemplatesFor,
  roundSizes,
  rowsFor,
  rulesFor,
  withOrders,
  writtenBuildsFor,
  type Band,
  type RoundSpec,
} from "../src/content";
import { MATH_TEMPLATES, makeMathBuild, isIrrationalLabel } from "../src/content/math";
import { isTrueEquation, trueOrders, valueOf } from "../src/content/expr";
import { ruleLabels, type BuiltItem, type Subject } from "../src/content/types";
import { hasGlyphs, textWidth } from "../src/hop/font";
import { findPath, geomFor, key, layoutReachable, rng, type Cell } from "../src/hop/geom";
import { Round } from "../src/hop/round";

let failures = 0;
const fail = (msg: string) => {
  failures++;
  if (failures <= 400) console.log("FAIL", msg);
};
const SUBJECTS: Subject[] = ["ela", "math", "science"];
const BANDS: Band[] = ["k2", "35", "68", "hs"];
const gnum = (g: Grade) => (g === "K" ? 0 : Number(g));

/* ------------------------------------------------------------------ labels */

function checkLabel(label: string, grades: Grade[], where: string) {
  if (!label || label.trim() !== label) fail(`${where}: empty or padded label "${label}"`);
  if ([...label].length > 10) fail(`${where}: label "${label}" is longer than 10 characters`);
  if (!hasGlyphs(label)) fail(`${where}: label "${label}" has characters the bitmap font can't draw`);
  for (const g of grades) {
    const geom = geomFor(rowsFor(g));
    const bigOnly = g === "K" || g === "1";
    const scale = bigOnly ? 2 : 1;
    if (textWidth(label, scale) > geom.chipMax) fail(`${where}: label "${label}" (${textWidth(label, scale)}px at ×${scale}) doesn't fit a grade ${g} cube (${geom.chipMax}px)`);
  }
}

/* ------------------------------------------------------------------ standards */

function checkStandard(code: string, grades: Grade[], subject: Subject, where: string) {
  const min = Math.min(...grades.map(gnum)), max = Math.max(...grades.map(gnum));
  if (subject === "ela") {
    const m = /^(L|RF)\.(K|\d+|9-10|11-12)\.\d$/.exec(code);
    if (!m) return fail(`${where}: bad ELA code ${code}`);
    const g = m[2];
    if (g === "9-10" || g === "11-12") {
      if (min < 9) fail(`${where}: ${code} tagged for grade ${min}`);
    } else if (!grades.includes(g as Grade)) fail(`${where}: ${code} not tagged for grade ${g} (${grades})`);
    return;
  }
  if (subject === "math") {
    const m = /^NC\.(K|\d+|M[1-4])\.[A-Z-]+\.\d+$/.exec(code);
    if (!m) return fail(`${where}: bad math code ${code}`);
    const g = m[1];
    if (g.startsWith("M")) {
      if (min < 8) fail(`${where}: ${code} tagged below high school`);
    } else if (!grades.includes(g as Grade)) fail(`${where}: ${code} not tagged for grade ${g} (${grades})`);
    return;
  }
  const hs: Record<string, number> = { EES: 9, Bio: 10, Chm: 11, Phy: 12 };
  const m = /^(PS|LS|ESS)\.(K|\d+|EES|Bio|Chm|Phy)(\.\d+){1,2}$/.exec(code);
  if (!m) return fail(`${where}: bad science code ${code}`);
  const g = m[2] in hs ? hs[m[2]] : m[2] === "K" ? 0 : Number(m[2]);
  if (g < min || g > max) fail(`${where}: ${code} (grade ${g}) outside tagged grades ${grades}`);
}

/* ------------------------------------------------------------------ build paths */

/** Plays a build round by hopping between tokens only over open cubes. */
function walkBuild(spec: RoundSpec, g: Grade, seed: number, where: string) {
  const geom = geomFor(rowsFor(g));
  let round: Round;
  try {
    round = new Round(spec, geom, rng(seed));
  } catch (e) {
    return fail(`${where}: ${String(e)}`);
  }
  const labelled = new Map([...round.cubes].filter(([, c]) => c.label).map(([k, c]) => [k, c.label]));
  if (!layoutReachable(geom, labelled)) fail(`${where}: layout ${seed} leaves a label unreachable`);
  let here: Cell = { r: 0, c: 0 };
  round.land(here);
  for (let guard = 0; guard < 40 && !round.complete; guard++) {
    const opts = round.options(rng(seed + guard));
    const targets = round.targets();
    if (!targets.length) return fail(`${where}: no target cube at step ${guard}`);
    if (!opts.some((o) => targets.some((t) => key(t.r, t.c) === o.key))) return fail(`${where}: options ${opts.map((o) => o.label)} miss the answer`);
    if (opts.length > 4 || new Set(opts.map((o) => o.label)).size !== opts.length) fail(`${where}: bad options ${opts.map((o) => o.label)}`);
    const t = targets[0];
    const path = findPath(geom, here, t, (c) => round.open(c));
    if (!path) return fail(`${where}: no safe path to "${t.label}" (layout ${seed})`);
    for (const c of path.slice(0, -1)) round.land(c);
    const res = round.land(t);
    if (res.type !== "correct") return fail(`${where}: landing on "${t.label}" gave ${res.type}`);
    here = t;
  }
  if (!round.complete) fail(`${where}: round never completed`);
  if (spec.kind === "build" && round.built.join(" ") !== spec.item.orders[0].join(" ") && !spec.item.orders.some((o) => o.join(" ") === round.built.join(" ")))
    fail(`${where}: built "${round.built.join(" ")}" is not an accepted order`);
}

/* ------------------------------------------------------------------ written builds */

const seenIds = new Set<string>();
const seenSentences = new Set<string>();
for (const subject of ["ela", "science"] as const) {
  for (const item of WRITTEN_BUILDS[subject]) {
    const where = `${item.id} "${item.tokens.join(" ")}"`;
    if (seenIds.has(item.id)) fail(`${where}: duplicate id`);
    seenIds.add(item.id);
    const text = item.tokens.join(" ");
    if (seenSentences.has(text)) fail(`${where}: duplicate sentence`);
    seenSentences.add(text);
    if (item.subject !== subject) fail(`${where}: subject ${item.subject}`);
    if (!/^["A-Z]/.test(text)) fail(`${where}: sentence must start with a capital`);
    if (!/[.!?]"?$/.test(text)) fail(`${where}: sentence must end with . ! or ?`);
    if (/\s{2}/.test(text) || item.tokens.some((t) => !t || /\s/.test(t))) fail(`${where}: bad spacing`);
    const built = withOrders(item);
    if (built.orders[0].join(" ") !== text) fail(`${where}: canonical order does not reconstruct the sentence`);
    for (const o of built.orders) {
      if ([...o].sort().join("|") !== [...item.tokens].sort().join("|")) fail(`${where}: alt order uses different tokens`);
    }
    const labels = [...item.tokens, ...item.distractors.map((d) => d.label)];
    if (new Set(labels).size !== labels.length) fail(`${where}: duplicate labels ${labels}`);
    if (item.distractors.length < 1) fail(`${where}: no distractors`);
    if (item.tokens.length < 3) fail(`${where}: fewer than 3 tokens`);
    const maxTokens = Math.min(...item.grades.map((g) => ({ 5: 5, 6: 7, 7: 9 })[rowsFor(g)] as number));
    if (item.tokens.length > maxTokens) fail(`${where}: ${item.tokens.length} tokens is too many for a ${Math.min(...item.grades.map(rowsFor))}-row pyramid`);
    for (const d of item.distractors) {
      if (d.why.length < 12) fail(`${where}: distractor "${d.label}" has no reason`);
    }
    if (bandOf(item.grades[0]) === "k2" && item.tokens.length > 5) fail(`${where}: K–2 sentences are 3–5 words`);
    if (!item.explain || !item.prompt) fail(`${where}: missing prompt/explain`);
    for (const l of labels) checkLabel(l, item.grades, where);
    checkStandard(item.standard, item.grades, subject, where);
    for (const g of item.grades)
      for (let seed = 1; seed <= 25; seed++) walkBuild({ kind: "build", subject, item: built }, g, seed * 7919 + labels.length, `${where} [grade ${g}]`);
  }
}

/* ------------------------------------------------------------------ math builds */

const SUB_CHECKS = 25;
for (const t of MATH_TEMPLATES) {
  for (const g of t.grades) {
    const rand = rng(1234 + t.id.length * 17 + gnum(g));
    const texts = new Set<string>();
    for (let i = 0; i < 80; i++) {
      let item: BuiltItem;
      try {
        item = makeMathBuild(t, rand, roundSizes(g).distractors);
      } catch (e) {
        fail(`${t.id}: ${String(e)}`);
        break;
      }
      const where = `${t.id} "${item.tokens.join(" ")}" [grade ${g}]`;
      texts.add(item.tokens.join(" "));
      const all = [item.prompt, item.explain, ...item.tokens, ...item.distractors.flatMap((d) => [d.label, d.why])].join(" ");
      if (/NaN|undefined|Infinity/.test(all)) fail(`${where}: NaN/undefined in text: ${all}`);
      const check = item.tokens.includes("x") && /Solve/.test(item.prompt) ? { kind: "solve" as const, x: valueOf(item.tokens[item.tokens.length - 1]) } : /identity/.test(item.prompt) ? { kind: "identity" as const } : { kind: "num" as const };
      if (!isTrueEquation(item.tokens.join(" "), check)) fail(`${where}: canonical equation is not true`);
      if (item.orders[0].join(" ") !== item.tokens.join(" ")) fail(`${where}: canonical order not first`);
      for (const o of item.orders) if (!isTrueEquation(o.join(" "), check)) fail(`${where}: accepted order "${o.join(" ")}" is false`);
      if (trueOrders(item.tokens, check).length !== item.orders.length) fail(`${where}: orders list incomplete`);
      const labels = [...item.tokens, ...item.distractors.map((d) => d.label)];
      if (new Set(labels).size !== labels.length) fail(`${where}: duplicate labels`);
      if (i < SUB_CHECKS) {
        for (const d of item.distractors) {
          item.tokens.forEach((_, k) => {
            const swapped = item.tokens.map((tok, j) => (j === k ? d.label : tok));
            if (trueOrders(swapped, check).length) fail(`${where}: distractor "${d.label}" makes a true equation`);
          });
        }
      }
      for (const l of labels) checkLabel(l, [g], where);
      if (i < 4) walkBuild({ kind: "build", subject: "math", item }, g, 99 + i, where);
    }
    if (texts.size < 3) fail(`${t.id} [grade ${g}]: only ${texts.size} different equations`);
  }
  checkStandard(t.standard, t.grades, "math", t.id);
}

/* ------------------------------------------------------------------ color rules */

const ELEMENTS = new Set("hydrogen helium lithium beryllium boron carbon nitrogen oxygen fluorine neon sodium magnesium aluminum silicon phosphorus sulfur chlorine argon potassium calcium iron copper zinc silver gold tin lead nickel cobalt mercury uranium platinum iodine".split(" "));
const METALS = new Set("Li Be Na Mg Al K Ca Sc Ti V Cr Mn Fe Co Ni Cu Zn Ga Rb Sr Ag Cd In Sn Cs Ba Pt Au Hg Pb Fr Ra U".split(" "));
const NONMETALS = new Set("H He C N O F Ne P S Cl Ar Se Br Kr I Xe Rn".split(" "));
const symbols = (formula: string) => [...formula.replace(/[₀-₉]/g, "").matchAll(/[A-Z][a-z]?/g)].map((m) => m[0]);
const isPrimeSieve = (() => {
  const s = Array(200).fill(true);
  s[0] = s[1] = false;
  for (let i = 2; i < 200; i++) if (s[i]) for (let j = i * i; j < 200; j += i) s[j] = false;
  return (n: number) => Number.isInteger(n) && n >= 0 && n < 200 && s[n];
})();

const ruleIds = new Set<string>();
for (const subject of SUBJECTS) {
  for (const rule of ALL_RULES[subject]) {
    const where = `${rule.id} ${rule.target}`;
    if (ruleIds.has(rule.id)) fail(`${where}: duplicate id`);
    ruleIds.add(rule.id);
    const labels = ruleLabels(rule);
    const yes = labels.filter((l) => l.match), no = labels.filter((l) => !l.match);
    if (yes.length < 8) fail(`${where}: only ${yes.length} matching labels`);
    if (no.length < 8) fail(`${where}: only ${no.length} non-matching labels`);
    const names = labels.map((l) => l.label);
    if (new Set(names).size !== names.length) fail(`${where}: duplicate labels ${names.filter((n, i) => names.indexOf(n) !== i)}`);
    for (const l of labels) {
      checkLabel(l.label, rule.grades, where);
      if (!l.why || /[{}]|NaN|undefined/.test(l.why)) fail(`${where}: bad reason for "${l.label}": ${l.why}`);
    }
    checkStandard(rule.standard, rule.grades, subject, where);
    if (!rule.prompt || !rule.target) fail(`${where}: missing prompt/target`);
    if (subject === "math") {
      if (!rule.test) fail(`${where}: math rule without a computed test`);
      for (const l of labels) if (!Number.isFinite(valueOf(l.label)) && !/π|√/.test(l.label)) fail(`${where}: "${l.label}" doesn't compute`);
      // Independent re-computation of the memberships
      const v = (s: string) => valueOf(s);
      const indep: Record<string, (s: string) => boolean> = {
        "m-r-prime": (s) => isPrimeSieve(v(s)),
        "m-r-squares": (s) => [1, 4, 9, 16, 25, 36, 49, 64, 81, 100, 121, 144].includes(v(s)),
        "m-r-even": (s) => [2, 4, 6, 8, 10, 12, 14, 16, 18, 20].includes(v(s)),
        "m-r-fac36": (s) => [1, 2, 3, 4, 6, 9, 12, 18, 36].includes(v(s)),
        "m-r-mult4": (s) => v(s) / 4 === Math.floor(v(s) / 4),
        "m-r-irrational": (s) => ["√2", "√3", "π", "√5", "√8", "√10", "2π", "√12", "√15"].includes(s),
        "m-r-log2": (s) => [1, 2, 4, 8, 16, 32, 64, 128].includes(Number(s.replace("log₂", ""))),
        "m-r-lcm": (s) => v(s) % 12 === 0,
      };
      const f = indep[rule.id];
      for (const l of labels) {
        if (rule.test && rule.test(l.label) !== l.match) fail(`${where}: "${l.label}" list/test mismatch`);
        if (f && f(l.label) !== l.match) fail(`${where}: "${l.label}" independent check disagrees`);
      }
      if (rule.id === "m-r-irrational") for (const l of labels) if (isIrrationalLabel(l.label) && Number.isInteger(v(l.label))) fail(`${where}: ${l.label}`);
    }
    if (rule.id === "s-r17" || rule.target === "ELEMENTS") for (const l of yes) if (!ELEMENTS.has(l.label)) fail(`${where}: "${l.label}" is not in the element list`);
    if (rule.target === "ELEMENTS") for (const l of no) if (ELEMENTS.has(l.label)) fail(`${where}: "${l.label}" is an element`);
    if (rule.target === "METALS") for (const l of labels) if (METALS.has(l.label) !== l.match || (!l.match && !NONMETALS.has(l.label))) fail(`${where}: "${l.label}" metal/nonmetal wrong`);
    if (rule.target === "IONIC")
      for (const l of labels) {
        const syms = symbols(l.label);
        if (syms.some((s) => !METALS.has(s) && !NONMETALS.has(s))) fail(`${where}: unknown symbol in ${l.label}`);
        if (syms.some((s) => METALS.has(s)) !== l.match) fail(`${where}: "${l.label}" ionic/covalent wrong`);
      }
    // Color rounds are playable on many layouts
    for (const g of rule.grades) {
      for (let seed = 1; seed <= 12; seed++) {
        const spec: RoundSpec = { kind: "color", subject, rule, labels: colorLabels(rule, g, rng(seed)) };
        walkBuild(spec, g, seed * 31, `${where} [grade ${g}]`);
      }
    }
  }
}

/* ------------------------------------------------------------------ ELA part-of-speech consistency */

// A word used in a rule's "no" list with a kind must not be claimed as a different kind elsewhere
// in the same band (keeps the part-of-speech reasons consistent).
{
  for (const band of BANDS) {
    const kinds = new Map<string, Set<string>>();
    for (const rule of ALL_RULES.ela.filter((r) => r.grades.some((g) => BAND_GRADES[band].includes(g)))) {
      for (const entry of rule.no) {
        const i = entry.lastIndexOf("/");
        if (i < 0) continue;
        const w = entry.slice(0, i), k = entry.slice(i + 1).replace(/^(coordinating|subordinating) /, "");
        if (!kinds.has(w)) kinds.set(w, new Set());
        kinds.get(w)!.add(k);
      }
    }
    for (const [w, ks] of kinds) if (ks.size > 1) fail(`ELA band ${band}: "${w}" is called ${[...ks].join(" and ")}`);
  }
}

/* ------------------------------------------------------------------ coverage */

for (const band of BANDS) {
  for (const subject of SUBJECTS) {
    const grades = BAND_GRADES[band];
    const rules = ALL_RULES[subject].filter((r) => r.grades.some((g) => grades.includes(g)));
    if (rules.length < 4) fail(`band ${band} ${subject}: only ${rules.length} color rules`);
    if (subject === "math") {
      const tpls = MATH_TEMPLATES.filter((t) => t.grades.some((g) => grades.includes(g)));
      const texts = new Set<string>();
      const rand = rng(77);
      for (const t of tpls) for (let i = 0; i < 20; i++) texts.add(makeMathBuild(t, rand, 3).tokens.join(" "));
      if (texts.size < 10) fail(`band ${band} math: only ${texts.size} different equations`);
    } else {
      const items = WRITTEN_BUILDS[subject].filter((b) => b.grades.some((g) => grades.includes(g)));
      if (items.length < 10) fail(`band ${band} ${subject}: only ${items.length} sentences`);
    }
  }
}
for (const g of GRADES) {
  for (const subject of SUBJECTS) {
    const rules = rulesFor(g, subject);
    if (rules.length < 2) fail(`grade ${g} ${subject}: only ${rules.length} color rules`);
    if (subject === "math") {
      if (mathTemplatesFor(g).length < 1) fail(`grade ${g}: no math build templates`);
    } else if (writtenBuildsFor(g, subject).length < 5) fail(`grade ${g} ${subject}: only ${writtenBuildsFor(g, subject).length} sentences`);
  }
  // The round deck serves a long game without errors, alternating kinds.
  for (const mode of ["ela", "math", "science", "mixed"] as const) {
    const deck = new RoundDeck(g, mode, rng(gnum(g) * 13 + mode.length));
    for (let i = 0; i < 16; i++) {
      const spec = deck.next();
      if (spec.kind !== (i % 2 === 0 ? "build" : "color")) fail(`deck ${g} ${mode}: round ${i} is ${spec.kind}`);
      if (mode !== "mixed" && spec.subject !== mode) fail(`deck ${g} ${mode}: served ${spec.subject}`);
      if (i === 5) deck.retry(spec);
    }
  }
}

/* ------------------------------------------------------------------ summary */

const count = (s: Subject) => (s === "math" ? `${MATH_TEMPLATES.length} equation templates` : `${WRITTEN_BUILDS[s].length} sentences`);
for (const s of SUBJECTS) console.log(`${s.padEnd(8)} ${count(s)}, ${ALL_RULES[s].length} color rules`);
for (const band of BANDS) {
  const g = BAND_GRADES[band];
  const n = (s: "ela" | "science") => WRITTEN_BUILDS[s].filter((b) => b.grades.some((x) => g.includes(x))).length;
  const r = (s: Subject) => ALL_RULES[s].filter((b) => b.grades.some((x) => g.includes(x))).length;
  console.log(`band ${band.padEnd(3)} ELA ${n("ela")} sentences/${r("ela")} rules · math ${MATH_TEMPLATES.filter((t) => t.grades.some((x) => g.includes(x))).length} templates/${r("math")} rules · science ${n("science")} sentences/${r("science")} rules`);
}
if (failures) {
  console.log(`\n${failures} problem(s).`);
  process.exit(1);
}
console.log("\nAll Cube Hop content checks passed.");
