/*
 * Checks every Lane Leap rule for every grade and subject:
 *   npm test   (npx tsx scripts/check-rules.ts)
 * - each grade × subject has at least two rule families;
 * - each rule has ≥ 8 matching and ≥ 8 non-matching logs, labels ≤ 10 characters that the pixel
 *   font can draw and that fit a log, no duplicates, no label on both sides, a reason for every log;
 * - memberships are recomputed: math with number checks and the expression evaluator, and
 *   chemistry, genetics, DNA, speed, Ohm's law, rhymes, first letters, plurals, roots, etc.
 *   with their own checks here. Any rule without a recompute must be a category rule, whose
 *   categories are checked to be disjoint.
 */
import type { Grade, Subject } from "../src/kit/types";
import { hasGlyphs } from "../src/leap/font";
import { bandFor, labelFits, labelScale, logWidth, MAX_LOG_W } from "../src/leap/layout";
import { ALL_RULES, rulesFor, type Rule } from "../src/leap/rules";
import { evaluate, near } from "../src/leap/rules/expr";
import {
  COMPOUNDS, CONNOTATION_10, CONNOTATION_6, EUPHEMISMS, LONG_A, NON_RHYMES, PLURALS, RHYMES, ROOT_SETS, SHORT_A, SPELL_11, SPELL_9, STARTS,
} from "../src/leap/rules/ela";

const GRADES: Grade[] = ["K", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];
const SUBJECTS: Subject[] = ["math", "science", "ela"];

let failures = 0;
function fail(msg: string) {
  failures++;
  if (failures <= 60) console.error("FAIL:", msg);
}
function check(cond: boolean, msg: () => string) {
  if (!cond) fail(msg());
}

/* ------------------------------------------------------------ evaluator self-test */
const EVAL_CASES: [string, number, number?][] = [
  ["2+3×4", 14], ["(2+3)×4", 20], ["√16", 4], ["3√4", 6], ["log₂8", 3], ["log 1000", 3], ["ln e³", 3], ["sin 30°", 0.5],
  ["cos(−60°)", 0.5], ["(1/4)^(−1)", 4], ["16^(1/2)", 4], ["4(2)ˣ", 32, 3], ["|−8|", 8], ["−(−4)", 4], ["2x²", 18, 3],
  ["10⁴÷10", 1000], ["75%", 0.75], ["x(x+5)+6", 20, 2], ["−x²", -9, 3], ["2ˣ", 8, 3], ["1,000", 1000], ["12÷(−2)", -6],
  ["−3−3", -6], ["3/4+1/4", 1], ["(√5)²", 5], ["sin(π/6)", 0.5], ["y", NaN],
];
for (const [e, v, x] of EVAL_CASES) {
  let got: number;
  try {
    got = evaluate(e, x ?? 0);
  } catch {
    got = NaN;
  }
  if (Number.isNaN(v)) check(Number.isNaN(got), () => `evaluator should reject ${e}`);
  else check(near(got, v), () => `evaluator: ${e} = ${got}, expected ${v}`);
}

/* ------------------------------------------------------------ independent membership checks */

const num = (l: string) => Number(l.replace(/−/g, "-"));
const frac = (l: string) => { const [a, b] = l.split("/").map(Number); return a / b; };
const isPrime = (n: number) => { if (n < 2) return false; for (let d = 2; d * d <= n; d++) if (n % d === 0) return false; return true; };
const WORDS = ["ZERO", "ONE", "TWO", "THREE", "FOUR", "FIVE", "SIX", "SEVEN", "EIGHT", "NINE", "TEN"];
const kValue = (l: string) => (/^\d+$/.test(l) ? Number(l) : l.startsWith("●") ? [...l].length : WORDS.indexOf(l));
const sidesEqual = (l: string, x: number) => { const [a, b] = l.split("="); return near(evaluate(a, x), evaluate(b, x)); };

/** A line through two points fits every defined sample. */
function linearCheck(label: string): boolean {
  const f = (x: number) => evaluate(label.split("=")[1], x);
  const xs = [-2.5, -1, 0.5, 1, 2, 3, 7].filter((x) => Number.isFinite(f(x)));
  const [x0, x1] = xs;
  const m = (f(x1) - f(x0)) / (x1 - x0);
  return xs.every((x) => near(f(x), f(x0) + m * (x - x0)));
}
/** Continued-fraction test: a rational with a small denominator ends the expansion quickly. */
function rationalCheck(v: number): boolean {
  let x = v;
  for (let i = 0; i < 12; i++) {
    const a = Math.floor(x + 1e-12);
    const r = x - a;
    if (Math.abs(r) < 1e-8 || Math.abs(r - 1) < 1e-8) return true;
    x = 1 / r;
    if (x > 1e7) return true;
  }
  return false;
}
function irrationalLabel(l: string): boolean {
  if (l.includes("π")) return true;
  const m = l.match(/√(\d+)/);
  if (m) { const n = Number(m[1]); return Math.round(Math.sqrt(n)) ** 2 !== n; }
  return false;
}
/** Powers of i via complex multiplication. */
function complexValue(l: string): [number, number] {
  const mul = (a: [number, number], b: [number, number]): [number, number] => [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]];
  const pow = (z: [number, number], n: number) => { let r: [number, number] = [1, 0]; for (let k = 0; k < n; k++) r = mul(r, z); return r; };
  const sup = (s: string) => Number([...s].map((c) => "⁰¹²³⁴⁵⁶⁷⁸⁹".indexOf(c)).join("") || "1");
  let neg = false;
  let s = l;
  if (s.startsWith("−i")) { neg = true; s = s.slice(1); }
  let z: [number, number] = [1, 0];
  for (const f of s.split("·")) {
    let m;
    if ((m = f.match(/^i(\D*)$/))) z = mul(z, pow([0, 1], sup(m[1])));
    else if ((m = f.match(/^\(−i\)(.+)$/))) z = mul(z, pow([0, -1], sup(m[1])));
    else if ((m = f.match(/^\(i(.+)\)(.+)$/))) z = mul(z, pow(pow([0, 1], sup(m[1])), sup(m[2])));
    else throw new Error(`complex: ${l}`);
  }
  return neg ? [-z[0], -z[1]] : z;
}
const METAL = new Set(["Li", "Na", "K", "Rb", "Cs", "Mg", "Ca", "Sr", "Ba", "Al", "Fe", "Cu", "Zn", "Ag", "Au"]);
const elementsOf = (f: string) => [...f.replace(/[₀-₉()]/g, "").matchAll(/[A-Z][a-z]?/g)].map((m) => m[0]);
/** Periodic groups written out independently of the game data. */
const GROUP_TABLE: Record<string, number> = {};
for (const [g, list] of [
  [1, "H Li Na K Rb Cs Fr HYDROGEN LITHIUM SODIUM POTASSIUM RUBIDIUM CESIUM"],
  [2, "Be Mg Ca Sr Ba"], [8, "Fe"], [13, "Al"], [14, "C"], [15, "N"], [16, "O S"],
  [17, "F Cl Br I FLUORINE CHLORINE BROMINE IODINE"], [18, "He Ne Ar Kr Xe Rn HELIUM NEON ARGON KRYPTON XENON RADON"],
] as [number, string][]) for (const s of list.split(" ")) GROUP_TABLE[s] = g;
const ALKALI = (s: string) => GROUP_TABLE[s] === 1 && s !== "H" && s !== "HYDROGEN";

/** Recomputed membership for each rule id (true = the label should be a match). */
const CHECKERS: Record<string, (l: string) => boolean> = {
  "k-bigger5": (l) => kValue(l) > 5,
  "k-make10": (l) => near(evaluate(l), 10),
  "k-eq5": (l) => near(evaluate(l), 5),
  "g1-eq10": (l) => near(evaluate(l), 10),
  "g1-gt50": (l) => num(l) > 50,
  "g1-4tens": (l) => Math.floor(num(l) / 10) === 4,
  "g2-even": (l) => num(l) % 2 === 0,
  "g2-odd": (l) => num(l) % 2 === 1,
  "g2-gt500": (l) => num(l) > 500,
  "g2-eq15": (l) => near(evaluate(l), 15),
  "g3-eq24": (l) => near(evaluate(l), 24),
  "g3-round50": (l) => num(l) >= 45 && num(l) < 55,
  "g3-less1": (l) => frac(l) < 1,
  ...Object.fromEntries([3, 4, 6, 7, 8, 9].map((k) => [`g4-mult${k}`, (l: string) => num(l) % k === 0])),
  ...Object.fromEntries([24, 36, 48].map((n) => [`g4-factors${n}`, (l: string) => n % num(l) === 0])),
  "g4-primes": (l) => isPrime(num(l)),
  "g4-half": (l) => { const [a, b] = l.split("/").map(Number); return 2 * a === b; },
  "g5-over-half": (l) => num(l) > 0.5,
  "g5-sum1": (l) => { const [p, q] = l.split("+"); return near(frac(p) + frac(q), 1); },
  "g5-1000": (l) => near(evaluate(l), 1000),
  "g6-negative": (l) => evaluate(l) < 0,
  "g6-ratio23": (l) => { const [a, b] = l.split(":").map(Number); return a / b === 2 / 3; },
  "g6-x4": (l) => sidesEqual(l, 4),
  "g7-neg6": (l) => near(evaluate(l), -6),
  "g7-neg12": (l) => near(evaluate(l), -12),
  "g7-75": (l) => near(evaluate(l), 0.75),
  "g7-x3": (l) => sidesEqual(l, 3),
  "g8-linear": linearCheck,
  "g8-irrational": irrationalLabel,
  "g8-cubes": (l) => { const n = num(l); return Math.round(Math.cbrt(n)) ** 3 === n; },
  "m1-equiv": (l) => [-4, -1, 0, 1, 3, 6].every((x) => near(evaluate(l, x), (x + 2) * (x + 3))),
  "m1-factor": (l) => near(evaluate(l, -2), 0),
  "m1-growth": (l) => { const f = (x: number) => evaluate(l.split("=")[1], x); const r = f(1) / f(0); return r > 1 && [1, 2, 3].every((x) => near(f(x + 1) / f(x), r)); },
  "m2-rational": (l) => rationalCheck(evaluate(l)),
  "m2-irrational": (l) => !rationalCheck(evaluate(l)),
  "m2-eq4": (l) => near(evaluate(l), 4),
  "m2-x4": (l) => sidesEqual(l, 4),
  "m3-root1": (l) => near(evaluate(l, 1), 0),
  "m3-even": (l) => { const f = (x: number) => evaluate(l.split("=")[1], x); return [0.7, 1.3, 2.9].every((x) => near(f(x), f(-x))); },
  "m3-log3": (l) => near(evaluate(l), 3),
  "m4-log2": (l) => near(evaluate(l), 2),
  "m4-i": (l) => { const [re, im] = complexValue(l); return re === -1 && im === 0; },
  "m4-half": (l) => near(evaluate(l), 0.5),
  // science
  "g7-genotype-het": (l) => l.length === 2 && l[0].toLowerCase() === l[1].toLowerCase() && l[0] !== l[1],
  "g7-genotype-hom": (l) => l.length === 2 && l[0] === l[1],
  "g7-speed10": (l) => { const m = l.match(/^([\d.]+)m\/([\d.]+)s$/)!; return Number(m[1]) / Number(m[2]) === 10; },
  "bio-dna": (l) => { const [a, b] = l.split("/"); const c: Record<string, string> = { A: "T", T: "A", G: "C", C: "G" }; return [...a].map((x) => c[x]).join("") === b; },
  "chm-bonds-ionic": (l) => { const e = elementsOf(l); return e.some((x) => METAL.has(x)) && e.some((x) => !METAL.has(x)); },
  "chm-bonds-covalent": (l) => elementsOf(l).every((x) => !METAL.has(x)),
  "chm-acids-acid": (l) => (/^H/.test(l) && l !== "H₂O") || l.endsWith("COOH"),
  "chm-acids-base": (l) => /OH\)?₂?$/.test(l) && !l.endsWith("COOH") || l === "NH₃",
  "chm-groups-alkali": ALKALI,
  "chm-groups-halogen": (l) => GROUP_TABLE[l] === 17,
  "chm-groups-noble": (l) => GROUP_TABLE[l] === 18,
  "phy-ohm4": (l) => { const m = l.match(/^([\d.]+) V, ([\d.]+) A$/)!; return Number(m[1]) / Number(m[2]) === 4; },
  // ELA
  ...Object.fromEntries(RHYMES.map((f) => [`k-rhyme-${f.rime.toLowerCase()}`, (l: string) => l.endsWith(f.rime) && l !== f.word])),
  ...Object.fromEntries(Object.keys(STARTS).map((c) => [`k-start-${c.toLowerCase()}`, (l: string) => l[0] === c && !/^(SH|TH|CH)/.test(l)])),
  "g1-vowel-a-short": (l) => /^[^AEIOU]*A[^AEIOUY]*$/.test(l),
  "g1-vowel-a-long": (l) => /A[^AEIOU]E$|AI|AY/.test(l),
  "g1-plural": (l) => PLURALS.some(([, p]) => p === l),
  "g1-singular": (l) => PLURALS.some(([s]) => s === l),
  "g2-compound": (l) => COMPOUNDS.some(([w, a, b]) => w === l && a + b === w),
  "g9-spelling": (l) => SPELL_9.some(([c]) => c === l),
  "g11-spelling": (l) => SPELL_11.some(([c]) => c === l),
  "g6-connotation-positive": (l) => CONNOTATION_6.some(([p]) => p === l),
  "g6-connotation-negative": (l) => CONNOTATION_6.some(([, n]) => n === l),
  "g10-connotation-positive": (l) => CONNOTATION_10.some(([p]) => p === l),
  "g10-connotation-negative": (l) => CONNOTATION_10.some(([, n]) => n === l),
  "g12-euphemism": (l) => EUPHEMISMS.some(([e]) => e === l),
};
for (const set of ROOT_SETS) {
  for (const m of set.meanings) {
    CHECKERS[`${set.family}-${m.key.toLowerCase()}`] = (l) => m.roots.some((r) => l.toLowerCase().includes(r));
  }
}

/* ------------------------------------------------------------ data sanity for the ELA/science tables */

for (const f of RHYMES) {
  for (const w of NON_RHYMES) check(!w.endsWith(f.rime), () => `non-rhyme ${w} ends in ${f.rime}`);
}
for (const set of ROOT_SETS) {
  for (const m of set.meanings) {
    for (const w of m.words) {
      check(m.roots.some((r) => w.toLowerCase().includes(r)), () => `${set.family}: ${w} has no ${m.key} root`);
      for (const o of set.meanings) if (o !== m) check(!o.roots.some((r) => w.toLowerCase().includes(r)), () => `${set.family}: ${w} also has a ${o.key} root`);
    }
  }
}
for (const [a, b] of [...SPELL_9, ...SPELL_11, ...CONNOTATION_6, ...CONNOTATION_10, ...EUPHEMISMS]) check(a !== b, () => `pair ${a}/${b} is identical`);
for (const [s, p] of PLURALS) check(s !== p, () => `plural pair ${s}`);
for (const w of SHORT_A) check(!/A[^AEIOU]E$|AI|AY/.test(w), () => `short-a ${w} looks long`);
for (const w of LONG_A) check(/A[^AEIOU]E$|AI|AY/.test(w), () => `long-a ${w} looks short`);

/* ------------------------------------------------------------ per-rule checks */

const CODE: Record<Subject, RegExp> = {
  math: /^NC\.(K|[1-8]|M[1-4])\.[A-Z-]+(\.\d+)+$/,
  science: /^(PS|LS|ESS)\.(K|[1-8]|EES|Bio|Chm|Phy)\.\d+(\.\d+)?$/,
  ela: /^(RF|RL|RI|L|W)\.(K|[1-8]|9-10|11-12)\.\d+$/,
};

const ids = new Set<string>();
let checked = 0;
let categoryOnly = 0;
for (const r of ALL_RULES) {
  const tag = `${r.id} (grade ${r.grade} ${r.subject})`;
  check(!ids.has(r.id), () => `duplicate rule id ${r.id}`);
  ids.add(r.id);
  check(CODE[r.subject].test(r.standard), () => `${tag}: odd standard code ${r.standard}`);
  check(r.text.length <= 36, () => `${tag}: rule text too long (${r.text.length})`);
  check(hasGlyphs(r.text), () => `${tag}: rule text has undrawable characters`);
  check(r.hint.length > 0 && r.hint.length <= 60, () => `${tag}: hint length ${r.hint.length}`);
  check(r.say.length > 0, () => `${tag}: no read-aloud text`);
  check(r.matches.length >= 8, () => `${tag}: only ${r.matches.length} matches`);
  check(r.misses.length >= 8, () => `${tag}: only ${r.misses.length} non-matches`);

  const all = [...r.matches, ...r.misses];
  const labels = all.map((i) => i.label);
  const seen = new Set<string>();
  for (const it of all) {
    check(it.label.length > 0 && it.label.length <= 10, () => `${tag}: label "${it.label}" is ${it.label.length} chars`);
    check(hasGlyphs(it.label), () => `${tag}: label "${it.label}" has undrawable characters`);
    check(!seen.has(it.label), () => `${tag}: duplicate label "${it.label}"`);
    seen.add(it.label);
    check(!!it.why && !/undefined|NaN|Infinity/.test(it.why), () => `${tag}: bad reason for "${it.label}": ${it.why}`);
    check(it.why.length <= 90, () => `${tag}: reason for "${it.label}" too long (${it.why.length})`);
  }
  const matchSet = new Set(r.matches.map((i) => i.label));
  for (const m of r.misses) check(!matchSet.has(m.label), () => `${tag}: "${m.label}" is both a match and a non-match`);

  // Fits on a log at this grade's size.
  const band = bandFor(r.grade === "K" ? 0 : Number(r.grade));
  const scale = labelScale(labels, band);
  check(logWidth(labels, scale) <= MAX_LOG_W, () => `${tag}: logs too wide (${logWidth(labels, scale)}px)`);
  for (const l of labels) check(labelFits(l, band), () => `${tag}: "${l}" doesn't fit a log`);

  const recompute = CHECKERS[r.id];
  if (recompute) {
    checked++;
    for (const it of r.matches) {
      let ok = false;
      try { ok = recompute(it.label); } catch (e) { fail(`${tag}: can't check "${it.label}": ${e}`); continue; }
      check(ok, () => `${tag}: "${it.label}" is listed as a match but isn't`);
    }
    for (const it of r.misses) {
      let ok = true;
      try { ok = recompute(it.label); } catch (e) { fail(`${tag}: can't check "${it.label}": ${e}`); continue; }
      check(!ok, () => `${tag}: "${it.label}" is listed as a non-match but matches`);
    }
  } else {
    categoryOnly++;
    check(r.subject !== "math", () => `${tag}: math rule without a recompute`);
  }
}

// Categories in one family must not share a label (a word can't be both a noun and a verb).
const byFamily = new Map<string, Rule[]>();
for (const r of ALL_RULES.filter((x) => x.exclusive)) byFamily.set(r.family, [...(byFamily.get(r.family) ?? []), r]);
for (const [fam, rules] of byFamily) {
  for (const a of rules) for (const b of rules) {
    if (a === b) continue;
    const aM = new Set(a.matches.map((i) => i.label));
    for (const it of b.matches) check(!aM.has(it.label), () => `${fam}: "${it.label}" matches both ${a.id} and ${b.id}`);
  }
}

/* ------------------------------------------------------------ coverage */

const table: string[] = [];
for (const g of GRADES) {
  const row: string[] = [];
  for (const s of SUBJECTS) {
    const rules = rulesFor(g, s);
    const fams = new Set(rules.map((r) => r.family));
    check(fams.size >= 2, () => `grade ${g} ${s}: only ${fams.size} rule families`);
    row.push(`${s} ${rules.length} rules/${fams.size} fam`);
  }
  table.push(`  ${g.padStart(2)}: ${row.join(" · ")}`);
}

console.log(`Rules: ${ALL_RULES.length} (${checked} recomputed item by item, ${categoryOnly} category rules)`);
console.log(table.join("\n"));
console.log(`Evaluator cases: ${EVAL_CASES.length}`);
if (failures) {
  console.error(`\n${failures} problem(s).`);
  process.exit(1);
}
console.log("All rule checks passed.");
