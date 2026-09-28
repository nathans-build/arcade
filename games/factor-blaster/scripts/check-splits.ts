/*
 * Fuzz-checks Factor Blaster's math for every grade:
 *   npx tsx scripts/check-splits.ts
 * Every split must multiply / add / expand back to the rock it came from, cores must be
 * true cores, labels must be drawable and fit their rocks, and every level must be clearable.
 */
import type { Grade } from "../src/kit/types";
import { hasGlyphs, textWidth } from "../src/blaster/font";
import {
  K2_MAX_GEN,
  MAX_ROCK_R,
  bandOf,
  comboNote,
  gradeInfo,
  isPrime,
  labelFits,
  labelScale,
  levelRocks,
  makeRule,
  polyEq,
  polyMul,
  rockRadius,
  splitRock,
  topRock,
  type RockMath,
} from "../src/blaster/splits";

const GRADES: Grade[] = ["K", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];
const RUNS = 4000;

let failures = 0;
function fail(msg: string) {
  failures++;
  if (failures <= 30) console.error("FAIL:", msg);
}
function check(cond: boolean, msg: () => string) {
  if (!cond) fail(msg());
}

function checkLabel(grade: Grade, m: RockMath, gen: number) {
  const scale = labelScale(grade);
  check(m.label.length > 0 && !m.label.includes("NaN") && !m.label.includes("undefined"), () => `bad label "${m.label}" (grade ${grade})`);
  check(hasGlyphs(m.label), () => `label "${m.label}" has characters the pixel font can't draw`);
  const r = rockRadius(m.label, gen, scale);
  check(r <= MAX_ROCK_R, () => `rock "${m.label}" too big: r=${r}`);
  check(labelFits(m.label, r, scale), () => `label "${m.label}" (w=${textWidth(m.label, scale)}) doesn't fit r=${r}`);
  if (m.n !== null) check(Number.isFinite(m.n) && Number.isInteger(m.n) && m.n >= 1, () => `bad value ${m.n}`);
  if (m.poly) check(m.poly.every((c) => Number.isInteger(c)), () => `bad poly ${m.poly}`);
}

/** Blast a rock completely, checking every split; returns the cores it ends in. */
function blast(grade: Grade, m: RockMath, gen: number, stats: { rocks: number; maxDepth: number }): RockMath[] {
  checkLabel(grade, m, gen);
  stats.rocks++;
  stats.maxDepth = Math.max(stats.maxDepth, gen);
  const band = bandOf(grade);
  const s = splitRock(m, grade, gen);
  if (!s) {
    // Pops: must be a core, or (K-2 only) a small rock that's split enough times.
    if (band === "k2") check(m.core ? m.n === 1 : gen >= K2_MAX_GEN, () => `K-2 rock ${m.label} popped at gen ${gen}`);
    else check(m.core, () => `non-core ${m.label} (grade ${grade}) did not split`);
    if (m.core && m.n !== null && band !== "k2") check(isPrime(m.n), () => `core ${m.n} is not prime`);
    if (m.core && m.poly) check(m.poly.length <= 2, () => `core ${m.label} is not linear/constant`);
    return [m];
  }
  check(!m.core, () => `core ${m.label} split`);
  check(!m.label.startsWith("("), () => `splittable rock ${m.label} is written like a factor`);
  const [a, b] = s.parts;
  if (s.op === "+") {
    check(a.n! + b.n! === m.n && a.n! >= 1 && b.n! >= 1, () => `${m.n} ≠ ${a.n} + ${b.n}`);
    check(s.note === `${m.n}=${a.n}+${b.n}`, () => `note ${s.note}`);
  } else if (s.op === "×") {
    check(a.n! * b.n! === m.n && a.n! > 1 && b.n! > 1, () => `${m.n} ≠ ${a.n} × ${b.n}`);
    check(a.core === isPrime(a.n!) && b.core === isPrime(b.n!), () => `core flag wrong on ${a.n}/${b.n}`);
  } else {
    check(!!m.poly && !!a.poly && !!b.poly && polyEq(polyMul(a.poly, b.poly), m.poly), () => `${a.label}·${b.label} ≠ ${m.label}`);
  }
  check(gen < 12, () => `split chain too deep for ${m.label}`);
  return [...blast(grade, a, gen + 1, stats), ...blast(grade, b, gen + 1, stats)];
}

for (const grade of GRADES) {
  const info = gradeInfo(grade);
  const stats = { rocks: 0, maxDepth: 0 };
  let maxRocks = 0;
  const samples = new Set<string>();
  for (let i = 0; i < RUNS; i++) {
    const root = topRock(grade);
    check(!root.core, () => `top rock ${root.label} is a core`);
    const before = stats.rocks;
    const cores = blast(grade, root, 0, stats);
    maxRocks = Math.max(maxRocks, stats.rocks - before);
    if (samples.size < 4) samples.add(root.label);

    // The cores must rebuild the rock.
    if (bandOf(grade) === "k2") {
      check(cores.reduce((s, c) => s + c.n!, 0) === root.n, () => `bonds of ${root.n} don't add back`);
    } else if (root.n !== null) {
      check(cores.reduce((s, c) => s * c.n!, 1) === root.n, () => `prime factors of ${root.n} don't multiply back`);
      const note = comboNote(root, cores);
      check(!note.includes("NaN") && hasGlyphs(note), () => `combo note "${note}"`);
    } else {
      const prod = cores.reduce<number[]>((p, c) => polyMul(p, c.poly!), [1]);
      check(polyEq(prod, root.poly!), () => `factors of ${root.label} don't expand back`);
      const note = comboNote(root, cores);
      check(hasGlyphs(note) && textWidth(note) <= 300, () => `combo note "${note}" too wide or undrawable`);
    }
  }

  // Rules: text is drawable, levels always have a rule-matching rock, `why` explains misses.
  for (let level = 1; level <= 12; level++) {
    const rule = makeRule(grade, level);
    check(hasGlyphs(rule.short) && rule.short.length <= 26, () => `rule short "${rule.short}"`);
    check(/^NC\./.test(rule.standard), () => `rule standard ${rule.standard}`);
    for (let t = 0; t < 150; t++) {
      const rocks = levelRocks(grade, rule, 3 + (level % 3));
      check(rocks.some((r) => rule.test(r)), () => `grade ${grade} level ${level} (${rule.short}) has no target rock`);
      for (const r of rocks) {
        if (!rule.test(r)) {
          const why = rule.why(r);
          check(hasGlyphs(why) && textWidth(why) <= 316 && !why.includes("NaN"), () => `why "${why}"`);
        }
      }
    }
  }
  console.log(
    `grade ${grade.padStart(2)} ${info.standard.padEnd(14)} ok · ${RUNS} rocks, ${stats.rocks} pieces, deepest split ${stats.maxDepth}, ` +
      `max pieces/rock ${maxRocks} · e.g. ${[...samples].join(", ")}`,
  );
}

if (failures) {
  console.error(`\n${failures} check(s) failed`);
  process.exit(1);
}
console.log("\nAll split checks passed.");
