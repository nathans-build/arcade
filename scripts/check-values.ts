/*
 * Value tests for Sum Stack (run: npm test, i.e. npx tsx scripts/check-values.ts).
 *
 * For every grade and many levels/seeds this checks that:
 *  - every cell value is a finite exact rational with a drawable label that fits its cell;
 *  - each label means what the game thinks (independent evaluator for fractions, decimals,
 *    expressions in x, f(k), logs, roots and exponents);
 *  - dealt value sets combine exactly to the target (perfect rows are reachable);
 *  - the fixer and WILD cells complete rows exactly;
 *  - a simple bot actually makes perfect rows in real play.
 */
import { GRADES } from "../src/kit/grades";
import type { Grade } from "../src/kit/types";
import { ValueBag } from "../src/stack/bag";
import {
  COLS, ROWS, bestPlacement, cloneGrid, dropped, emptyGrid, evaluateRows, fits, lockPiece, removeRows,
  resolveWilds, rowCells, spawnPiece, type Grid,
} from "../src/stack/board";
import { hasGlyph, measure } from "../src/stack/font";
import { add, eq, fmtDec, fmtFrac, key, parseQ, q, toNumber, type Q } from "../src/stack/rational";
import { combine, complement, partition, ruleFor, type Rule } from "../src/stack/rules";

let failures = 0;
let checks = 0;
function assert(cond: unknown, msg: string) {
  checks++;
  if (!cond) {
    failures++;
    if (failures < 400) console.error("FAIL:", msg);
  }
}

/** Small deterministic RNG (mulberry32). */
function seeded(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ---------- independent evaluator (floats, deliberately separate from the game) ---------- */

function toJs(s: string): string {
  return s
    .replace(/−/g, "-")
    .replace(/\{([^}]*)\}/g, "**($1)")
    .replace(/(\d)x/g, "$1*x");
}

function evalLabel(label: string, rule: Rule): number {
  if (/^[−-]?\d+(\.\d+)?(\/\d+)?$/.test(label)) return toNumber(parseQ(label));
  let m = label.match(/^f\(([−-]?\d+)\)$/);
  if (m) {
    const def = rule.context.find((c) => c.startsWith("f(x)="));
    if (!def) throw new Error(`no f for ${label}`);
    const k = Number(m[1].replace("−", "-"));
    return Function("x", `return ${toJs(def.slice(5))};`)(k) as number;
  }
  m = label.match(/^log(?:\[(\d+)\])?(\d+)$/);
  if (m) return Math.log(Number(m[2])) / Math.log(m[1] ? Number(m[1]) : 10);
  m = label.match(/^\{3\}√(\d+)$/);
  if (m) return Math.cbrt(Number(m[1]));
  m = label.match(/^√(\d+)$/);
  if (m) return Math.sqrt(Number(m[1]));
  const xdef = rule.context.find((c) => c.startsWith("x = "));
  const x = xdef ? toNumber(parseQ(xdef.slice(4))) : NaN;
  const v = Function("x", `return ${toJs(label)};`)(x) as number;
  return v;
}

/* ------------------------------- rational basics ------------------------------- */

assert(eq(add(parseQ("0.1"), parseQ("0.2")), parseQ("0.3")), "0.1 + 0.2 = 0.3 exactly");
assert(eq(add(q(1, 3), q(1, 6)), q(1, 2)), "1/3 + 1/6 = 1/2");
assert(fmtDec(q(3, 4)) === "0.75" && fmtDec(q(-1, 20)) === "−0.05" && fmtDec(q(1, 3)) === "1/3", "fmtDec");
assert(fmtFrac(q(-6, 8)) === "−3/4" && fmtFrac(q(4, 2)) === "2", "fmtFrac");
assert(key(q(0, 5)) === "0/1" && key(q(0, -5)) === "0/1", "zero normalised");

/* ------------------------------- per grade ------------------------------- */

const LEVELS = 12;
const SEEDS = 12;
const summary: string[] = [];

for (const grade of GRADES as Grade[]) {
  const standards = new Set<string>();
  let perfectRows = 0;
  let pieces = 0;
  for (let level = 1; level <= LEVELS; level++) {
    for (let s = 0; s < SEEDS; s++) {
      const rng = seeded(1000 * level + s + grade.charCodeAt(0) * 7);
      const rule = ruleFor(grade, level, rng);
      standards.add(`${rule.standard} ${rule.skill}`);
      const tag = `G${grade} L${level} ${rule.title}`;

      assert(Number.isSafeInteger(rule.target.n) && rule.target.d > 0, `${tag}: target finite`);
      assert(rule.title.includes(rule.targetLabel), `${tag}: title shows the target`);
      assert(/^NC\./.test(rule.standard), `${tag}: NC standard code`);
      assert(rule.domain.length >= 2, `${tag}: domain`);
      for (const t of [rule.title, ...rule.context]) {
        for (const ch of t) assert(hasGlyph(ch), `${tag}: glyph "${ch}" in "${t}"`);
        assert(measure(t) <= 88, `${tag}: HUD line "${t}" fits the side panel`);
      }

      if (s === 0) {
        for (const c of rule.domain) {
          const v = c.v;
          assert(Number.isSafeInteger(v.n) && Number.isSafeInteger(v.d) && v.d > 0, `${tag}: ${c.label} exact`);
          assert(c.label.length > 0, `${tag}: label`);
          for (const ch of c.label) assert(hasGlyph(ch), `${tag}: glyph "${ch}" in ${c.label}`);
          const w = measure(c.label, rule.big ? 2 : 1);
          assert(w <= 21, `${tag}: label ${c.label} is ${w}px wide`);
          const ev = evalLabel(c.label, rule);
          assert(Number.isFinite(ev) && Math.abs(ev - toNumber(v)) < 1e-9, `${tag}: ${c.label} = ${ev}, game says ${fmtFrac(v)}`);
          if (/^[−-]?\d+(\.\d+)?(\/\d+)?$/.test(c.label)) assert(eq(parseQ(c.label), v), `${tag}: ${c.label} exact parse`);
        }
        // row totals / targets print and parse back exactly
        assert(eq(parseQ(rule.fmt(rule.target)), rule.target), `${tag}: fmt(target) round-trips`);
      }

      // Dealt sets always combine exactly to the target.
      for (let i = 0; i < 25; i++) {
        const parts = partition(rule, rng);
        const agg = combine(rule.op, parts.map((p) => p.v));
        assert(parts.length >= 2, `${tag}: partition size`);
        assert(eq(agg, rule.target), `${tag}: partition ${parts.map((p) => p.label).join(",")} → ${fmtFrac(agg)}`);
        assert(parts.every((p) => rule.domain.includes(p)), `${tag}: partition from domain`);
      }

      // Fixer: for random open rows, the fixer completes one exactly.
      const bag = new ValueBag(rule, rng);
      for (let i = 0; i < 10; i++) {
        const g = emptyGrid();
        const part = partition(rule, rng);
        const r = ROWS - 1;
        part.slice(0, -1).forEach((v, c) => (g[r][c] = { val: v, kind: 0 }));
        if (eq(combine(rule.op, part.slice(0, -1).map((p) => p.v)), rule.target)) continue; // already exact (last part neutral)
        const fix = bag.fixer(g);
        assert(fix, `${tag}: fixer found for ${part.map((p) => p.label).join(",")}`);
        if (fix) assert(eq(combine(rule.op, [...part.slice(0, -1).map((p) => p.v), fix.v]), rule.target), `${tag}: fixer exact`);
      }

      // WILD: completes a row when the missing value is sensible.
      {
        const g = emptyGrid();
        const part = partition(rule, rng);
        const r = ROWS - 1;
        const prefix = part.slice(0, -1);
        prefix.forEach((v, c) => (g[r][c] = { val: v, kind: 0 }));
        if (prefix.length === 1 && rule.op === "×" && part[1].v.n === 1) continue;
        g[r][COLS - 1] = { val: { label: "?", v: q(0), wild: true }, kind: 0 };
        resolveWilds(g, rule, rng);
        const vals = rowCells(g, r).map((c) => c.val.v);
        assert(eq(combine(rule.op, vals), rule.target), `${tag}: wild completes row`);
        assert(!rowCells(g, r).some((c) => c.val.wild), `${tag}: wild resolved`);
      }

      // Complement sanity
      const one = rule.domain[0];
      const need = complement(rule, one.v);
      if (need) assert(eq(combine(rule.op, [one.v, need]), rule.target), `${tag}: complement`);

      // Real play with the bot (fewer seeds, it is slower).
      if (s < 2) {
        const pr = playBot(rule, rng, 120);
        perfectRows += pr.perfect;
        pieces += pr.pieces;
      }
    }
  }
  assert(perfectRows > pieces * 0.05, `G${grade}: bot made only ${perfectRows} perfect rows in ${pieces} pieces`);
  summary.push(`${grade.padStart(2)}: ${String(perfectRows).padStart(4)} perfect rows / ${pieces} pieces · ${[...standards].join(" | ")}`);
}

function playBot(rule: Rule, rng: () => number, n: number) {
  let g: Grid = emptyGrid();
  const bag = new ValueBag(rule, rng);
  let perfect = 0;
  for (let i = 0; i < n; i++) {
    const kind = Math.floor(rng() * 7);
    const p = spawnPiece(kind, bag.piece(g));
    if (!fits(g, p)) {
      g = emptyGrid();
      continue;
    }
    const mv = bestPlacement(g, p, rule);
    const placed = dropped(g, mv ? { ...p, rot: mv.rot, x: mv.x } : p);
    const sim = cloneGrid(g);
    if (!lockPiece(sim, placed)) {
      g = emptyGrid();
      continue;
    }
    const res = evaluateRows(sim, rule);
    for (const r of res.perfect) {
      const vals: Q[] = rowCells(sim, r).map((c) => c.val.v);
      assert(eq(combine(rule.op, vals), rule.target), `perfect row really hits target`);
    }
    perfect += res.perfect.length;
    g = removeRows(sim, [...res.perfect, ...res.full]);
  }
  return { perfect, pieces: n };
}

console.log(summary.join("\n"));
console.log(`\n${checks} checks, ${failures} failures`);
if (failures) process.exit(1);
