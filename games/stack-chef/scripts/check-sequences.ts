/*
 * Checks every Stack Chef sequence, generator and level layout:  npm test
 *  - every written sequence: unique id, grades in one band, the band's slab count, no duplicate
 *    labels (so only one order is correct), labels ≤ 12 characters with glyphs that fit a slab at
 *    the band's size (and a plate slab), standards match the grades, notes/say line up
 *  - at least 8 sequences (written + generator kinds) per band per subject
 *  - math (and ABC) generators, thousands of runs per grade: every label's value is recomputed
 *    here from the label text and must match; values strictly increase (or decrease) with a
 *    clear gap; step orders check each arithmetic step and each equation at the solution; no NaN
 *  - level layouts for every band, level and many seeds: every girder segment is reachable from
 *    the chef's start by ladders, every slab sits on a girder and can be walked across, ladders
 *    never sit under a slab, and slabs always have somewhere to fall
 */
import { GRADES } from "../src/kit/grades";
import type { Grade } from "../src/kit/types";
import { hasGlyphs, textWidth } from "../src/chef/font";
import {
  LADDER_HALF, MAX_STACK_LABEL, SIZES, W, floorBelow, makeLayout, maxLabelWidth, reachable, rng, segmentAt, slabSpan, colCenter, type Band,
} from "../src/chef/layout";
import { ELA, ELA_KINDS, GRADE_BLURB, MATH_KINDS, SCIENCE, SequenceDeck, fixedPool, genKinds, goalText, spokenLabel, whyWrong, type Sequence } from "../src/seq";
import { BAND_GRADES, bandOf } from "../src/seq/types";
import { ABC_WORD_LISTS } from "../src/seq/ela";

const problems: string[] = [];
const bad = (s: Sequence | null, msg: string) => problems.push(`${s ? `${s.id} [${s.title}]` : "global"}: ${msg}`);
const gnum = (g: Grade) => (g === "K" ? 0 : Number(g));

/* ------------------------------ standards ------------------------------ */

/** Grade range a standards code belongs to, or null when the code is not grade-specific. */
function codeGrades(code: string): [number, number] | null {
  let m = code.match(/^NC\.M(\d)\./);
  if (m) return [8 + Number(m[1]), 8 + Number(m[1])];
  m = code.match(/^NC\.(K|\d+)\./);
  if (m) return m[1] === "K" ? [0, 0] : [Number(m[1]), Number(m[1])];
  if (code.startsWith("ESS.EES")) return [9, 9];
  if (code.startsWith("LS.Bio")) return [10, 10];
  if (code.startsWith("PS.Chm")) return [11, 11];
  if (code.startsWith("PS.Phy")) return [12, 12];
  m = code.match(/^[A-Z]+\.(K|\d+)(?:-(\d+))?\./);
  if (m) {
    const a = m[1] === "K" ? 0 : Number(m[1]);
    return [a, m[2] ? Number(m[2]) : a];
  }
  if (code === "SEP.3") return null;
  return [-1, -1];
}

/* ------------------------------ label values ------------------------------ */

/** A tiny expression evaluator: numbers, x, + − × ÷ / ^, superscripts, √, π, | |, ( ) [ ], implicit ×. */
function evaluate(src: string, x = NaN): number {
  const SUP = "⁰¹²³⁴⁵⁶⁷⁸⁹";
  const s = src.replace(/\s+/g, "");
  let i = 0;
  const peek = () => s[i];
  const expr = (): number => {
    let v = term();
    while (peek() === "+" || peek() === "−" || peek() === "-") {
      const op = s[i++];
      const t = term();
      v = op === "+" ? v + t : v - t;
    }
    return v;
  };
  const term = (): number => {
    let v = unary();
    for (;;) {
      const c = peek();
      if (c === "×" || c === "÷" || c === "/") {
        i++;
        const t = unary();
        v = c === "×" ? v * t : v / t;
      } else if (c !== undefined && /[\dxπ(√[|]/.test(c) && !(c === "|" && depthAbs > 0)) {
        v *= unary(); // implicit multiplication: 3x, 2(x+1), 2π
      } else return v;
    }
  };
  const unary = (): number => {
    if (peek() === "−" || peek() === "-") {
      i++;
      return -unary();
    }
    return power();
  };
  const power = (): number => {
    let b = primary();
    if (peek() === "^") {
      i++;
      return b ** unary();
    }
    let e = "";
    if (peek() === "⁻") {
      e = "-";
      i++;
    }
    while (peek() !== undefined && SUP.includes(peek())) e += SUP.indexOf(s[i++]);
    if (e) b = b ** Number(e);
    return b;
  };
  let depthAbs = 0;
  const primary = (): number => {
    const c = peek();
    if (c === "(" || c === "[") {
      i++;
      const v = expr();
      i++; // ) or ]
      return v;
    }
    if (c === "|") {
      i++;
      depthAbs++;
      const v = expr();
      depthAbs--;
      i++;
      return Math.abs(v);
    }
    if (c === "√") {
      i++;
      return Math.sqrt(power());
    }
    if (c === "π") {
      i++;
      return Math.PI;
    }
    if (c === "x") {
      i++;
      return x;
    }
    const m = s.slice(i).match(/^\d+(\.\d+)?/);
    if (!m) throw new Error(`bad token at ${i} in ${src}`);
    i += m[0].length;
    return Number(m[0]);
  };
  const v = expr();
  if (i !== s.length) throw new Error(`trailing input in ${src}`);
  return v;
}

const WORD_NUM: Record<string, number> = { DIME: 10, DIMES: 10, NICKEL: 5, NICKELS: 5, QUARTER: 25, YARD: 36, YARDS: 36, FOOT: 12, FEET: 12, INCHES: 1, M: 100, CM: 1, MM: 0.1, THOUSANDS: 1000, HUNDREDS: 100, TENS: 10 };

/** Value of a math label, worked out from its text alone. */
function labelValue(label: string, seq: Sequence): number {
  let m: RegExpMatchArray | null;
  if (label === "QUARTER") return 25;
  if ((m = label.match(/^(\d+):(\d\d) (AM|PM)$/))) {
    const h = Number(m[1]) % 12;
    return (h + (m[3] === "PM" ? 12 : 0)) * 60 + Number(m[2]);
  }
  if ((m = label.match(/^(\d+) TENS (\d)$/))) return Number(m[1]) * 10 + Number(m[2]);
  if ((m = label.match(/^(\d+) ([A-Z]+)$/)) && WORD_NUM[m[2]] !== undefined) return Number(m[1]) * WORD_NUM[m[2]];
  if ((m = label.match(/^(\d+)%$/))) return Number(m[1]) / 100;
  if ((m = label.match(/^(\d+) rad$/))) return Number(m[1]);
  if ((m = label.match(/^log([₀-₉]+) ([\d.]+)$/))) {
    const b = Number([...m[1]].map((c) => "₀₁₂₃₄₅₆₇₈₉".indexOf(c)).join(""));
    return Math.log(Number(m[2])) / Math.log(b);
  }
  if ((m = label.match(/^log ([\d.]+)$/))) return Math.log10(Number(m[1]));
  if ((m = label.match(/^ln ([\d.]+)$/))) return Math.log(Number(m[1]));
  if ((m = label.match(/^(sin|cos) (\d+)°$/))) {
    const a = (Number(m[2]) * Math.PI) / 180;
    return m[1] === "sin" ? Math.sin(a) : Math.cos(a);
  }
  if ((m = label.match(/^f\((−?\d+)\)$/))) {
    const fx = seq.title.replace(/^f\(x\)=/, "");
    return evaluate(fx, evaluate(m[1]));
  }
  return evaluate(label);
}

/** Checks one equation-step label at the solution. */
function checkEquation(seq: Sequence, label: string, xs: number[]) {
  if (label.includes("±")) {
    const [lhs, rhs] = label.split("=");
    const k = evaluate(rhs.replace("±", ""));
    for (const x of xs) if (Math.abs(Math.abs(evaluate(lhs, x)) - k) > 1e-9) bad(seq, `step ${label} fails at x=${x}`);
    return;
  }
  const or = label.match(/^x=(−?\d+) or (−?\d+)$/);
  if (or) {
    const got = [evaluate(or[1]), evaluate(or[2])].sort((a, b) => a - b);
    const want = [...xs].sort((a, b) => a - b);
    if (got.join() !== want.join()) bad(seq, `roots ${label} vs ${want}`);
    return;
  }
  const [lhs, rhs] = label.split("=");
  if (rhs === undefined) return bad(seq, `step without = : ${label}`);
  for (const x of xs) {
    const a = evaluate(lhs, x);
    const b = evaluate(rhs, x);
    if (!Number.isFinite(a) || !Number.isFinite(b) || Math.abs(a - b) > 1e-9) bad(seq, `step ${label} is false at x=${x} (${a} vs ${b})`);
  }
}

/** Order-of-operations steps: each "p op q=r" is right, and each step uses the result before it. */
function checkOpsChain(seq: Sequence) {
  let prev: number | null = null;
  for (const st of seq.steps) {
    const m = st.match(/^(\d+)([+−×÷])(\d+)=(\d+)$/) ?? st.match(/^(\d+)(²)=(\d+)$/);
    if (!m) return bad(seq, `unparsed op step ${st}`);
    let a: number, b: number, r: number, v: number;
    if (m[2] === "²") {
      a = Number(m[1]);
      b = a;
      r = Number(m[3]);
      v = a * a;
    } else {
      a = Number(m[1]);
      b = Number(m[3]);
      r = Number(m[4]);
      v = m[2] === "+" ? a + b : m[2] === "−" ? a - b : m[2] === "×" ? a * b : a / b;
    }
    if (v !== r) bad(seq, `wrong arithmetic in ${st}`);
    if (prev !== null && a !== prev && b !== prev) bad(seq, `step ${st} does not use the previous result ${prev}`);
    prev = r;
  }
  // The expression's value equals the last result.
  const expr = seq.title.replace(/^EVALUATE /, "");
  if (evaluate(expr) !== prev) bad(seq, `expression ${expr} = ${evaluate(expr)}, steps end at ${prev}`);
}

/* ------------------------------ per-sequence checks ------------------------------ */

function checkSequence(seq: Sequence, generated: boolean) {
  const band = bandOf(seq.grades[0]);
  if (!seq.grades.length || seq.grades.some((g) => bandOf(g) !== band)) bad(seq, `grades span bands: ${seq.grades}`);
  const [lo, hi] = SIZES[band].steps;
  if (seq.steps.length < lo || seq.steps.length > hi) bad(seq, `${seq.steps.length} steps, band ${band} wants ${lo}-${hi}`);
  if (new Set(seq.steps).size !== seq.steps.length) bad(seq, `duplicate labels ${seq.steps}`);
  if (new Set(seq.steps.map((s) => s.toUpperCase())).size !== seq.steps.length) bad(seq, `labels that look the same on the canvas: ${seq.steps}`);
  const maxW = maxLabelWidth(band);
  for (const l of seq.steps) {
    if (!l.trim()) bad(seq, "empty label");
    if ([...l].length > 12) bad(seq, `label over 12 characters: ${l}`);
    if (!hasGlyphs(l)) bad(seq, `label has characters with no glyph: ${l}`);
    if (textWidth(l) > maxW) bad(seq, `label ${l} is ${textWidth(l)}px, slab fits ${maxW}px (band ${band})`);
    if (textWidth(l) > MAX_STACK_LABEL) bad(seq, `label ${l} too wide for a plate slab`);
  }
  if (!hasGlyphs(seq.title) || [...seq.title].length > 34) bad(seq, `title too long or unprintable: ${seq.title}`);
  for (const e of seq.ends) if (!hasGlyphs(e) || textWidth(e) > 60) bad(seq, `end caption ${e}`);
  const canvasGoal = `${seq.title}  BOTTOM=${seq.ends[0]}`;
  if (textWidth(canvasGoal) > W - 8) bad(seq, `canvas goal line too wide: ${canvasGoal}`);
  if (!seq.explain || seq.explain.length > 320) bad(seq, "explain missing or too long");
  if (seq.passage && seq.passage.length > 420) bad(seq, "passage too long");
  if (seq.say && seq.say.length !== seq.steps.length) bad(seq, "say length");
  if (seq.notes && seq.notes.length !== seq.steps.length) bad(seq, "notes length");
  const cg = codeGrades(seq.standard);
  if (cg) {
    const top = Math.max(...seq.grades.map(gnum));
    const bandLo = gnum(BAND_GRADES[band][0]);
    if (cg[0] < 0) bad(seq, `unrecognised standard ${seq.standard}`);
    else if (cg[0] > top || cg[1] < bandLo) bad(seq, `standard ${seq.standard} does not fit grades ${seq.grades}`);
  }
  for (let i = 0; i < seq.steps.length; i++) {
    const sp = spokenLabel(seq, i);
    if (!sp || /undefined|NaN|[⁰¹²³⁴⁵⁶⁷⁸⁹⁻₀₁₂₃₄₅₆₇₈₉]/.test(sp)) bad(seq, `spoken label "${sp}"`);
    for (let j = 0; j < seq.steps.length; j++) {
      if (i === j) continue;
      const why = whyWrong(seq, i, j);
      if (!why || /undefined|NaN/.test(why)) bad(seq, `reason ${why}`);
    }
  }
  if (/undefined|NaN/.test(goalText(seq) + seq.explain + (seq.passage ?? ""))) bad(seq, "undefined/NaN in text");

  if (seq.values) {
    if (seq.values.length !== seq.steps.length) bad(seq, "values length");
    const asc = seq.ends[0] !== "GREATEST";
    for (let i = 0; i < seq.steps.length; i++) {
      const v = seq.values[i];
      if (!Number.isFinite(v)) bad(seq, `value NaN for ${seq.steps[i]}`);
      let parsed: number;
      try {
        parsed = labelValue(seq.steps[i], seq);
      } catch (e) {
        bad(seq, `cannot read value of ${seq.steps[i]}: ${(e as Error).message}`);
        continue;
      }
      if (Math.abs(parsed - v) > 1e-6 * Math.max(1, Math.abs(v))) bad(seq, `label ${seq.steps[i]} is worth ${parsed}, generator said ${v}`);
      if (i > 0) {
        const d = asc ? v - seq.values[i - 1] : seq.values[i - 1] - v;
        if (!(d > 0)) bad(seq, `not strictly ${asc ? "increasing" : "decreasing"}: ${seq.steps}`);
        // Labels that must be estimated (roots, π, fractions, angles, logs) need a clear gap.
        const est = (l: string) => /[√π/°^]|log|ln|rad/.test(l);
        if ((est(seq.steps[i]) || est(seq.steps[i - 1])) && d < 0.02 * Math.max(1, Math.abs(v))) bad(seq, `values too close to tell apart: ${seq.steps[i - 1]} / ${seq.steps[i]}`);
      }
    }
  } else if (seq.subject === "math") {
    if (seq.title.startsWith("EVALUATE")) checkOpsChain(seq);
    else {
      // Equation steps: every step holds at the solution(s).
      const last = seq.steps[seq.steps.length - 1];
      const or = last.match(/^x=(−?\d+) or (−?\d+)$/);
      const sol = seq.steps.find((s) => /^x=−?\d+$/.test(s));
      const xs = or ? [evaluate(or[1]), evaluate(or[2])] : sol ? [evaluate(sol.slice(2))] : [];
      if (!xs.length) bad(seq, "equation without a solution step");
      for (const st of seq.steps) checkEquation(seq, st, xs);
    }
  }
  if (generated && seq.id.startsWith("ela-abc")) {
    const sorted = [...seq.steps].sort();
    if (sorted.join() !== seq.steps.join()) bad(seq, "ABC order not sorted");
    if (seq.grades[0] === "2" && new Set(seq.steps.map((w) => w[1])).size !== seq.steps.length) bad(seq, "second letters repeat");
    if (seq.grades[0] !== "2" && new Set(seq.steps.map((w) => w[0])).size !== seq.steps.length) bad(seq, "first letters repeat");
  }
}

/* ------------------------------ run ------------------------------ */

const ids = new Set<string>();
for (const s of [...SCIENCE, ...ELA]) {
  if (ids.has(s.id)) bad(s, "duplicate id");
  ids.add(s.id);
  checkSequence(s, false);
}
for (const group of ABC_WORD_LISTS.WORDS_2) if (new Set(group.map((w) => w[0])).size !== 1) bad(null, `ABC group ${group} mixes first letters`);

// Counts per band and subject (written sequences + generator kinds).
const counts: string[] = [];
for (const band of Object.keys(BAND_GRADES) as Band[]) {
  const gs = BAND_GRADES[band];
  const sci = SCIENCE.filter((s) => s.grades.some((g) => gs.includes(g))).length;
  const ela = ELA.filter((s) => s.grades.some((g) => gs.includes(g))).length + ELA_KINDS.filter((k) => k.grades.some((g) => gs.includes(g))).length;
  const math = MATH_KINDS.filter((k) => k.grades.some((g) => gs.includes(g))).length;
  counts.push(`${band}: math ${math} generators, science ${sci}, ELA ${ela}`);
  if (sci < 8 || ela < 8 || math < 8) bad(null, `band ${band} has fewer than 8 sequences in a subject (math ${math}, sci ${sci}, ela ${ela})`);
}
for (const g of GRADES) {
  if (!GRADE_BLURB[g]) bad(null, `no blurb for grade ${g}`);
  for (const subj of ["science", "ela"] as const) if (fixedPool(subj, g).length < 4) bad(null, `grade ${g} ${subj} pool has ${fixedPool(subj, g).length}`);
  if (genKinds("math", g).own.length === 0) bad(null, `no math kinds for grade ${g}`);
}

// Generators: thousands of runs.
let generated = 0;
const r = rng(12345);
for (const g of GRADES) {
  const kinds = [...genKinds("math", g).own, ...genKinds("math", g).review, ...genKinds("ela", g).own];
  for (const k of kinds) {
    for (let t = 0; t < 250; t++) {
      const seq = k.make(g, r);
      generated++;
      if (!seq.grades.includes(g)) bad(seq, `made for ${seq.grades}, asked for ${g}`);
      checkSequence(seq, true);
      if (problems.length > 60) break;
    }
  }
  // The deck, in every mode.
  for (const mode of ["math", "science", "ela", "mixed"] as const) {
    const deck = new SequenceDeck(g, mode, rng(7 + gnum(g)));
    for (let t = 0; t < 40; t++) {
      const s = deck.next();
      if (!s || !s.steps.length) bad(null, `deck ${g}/${mode} returned nothing`);
      else if (bandOf(s.grades[0]) !== bandOf(g)) bad(s, `deck for grade ${g} served band ${bandOf(s.grades[0])}`);
      if (t === 5) deck.retry(s);
    }
  }
}

// Layouts: reachability for every band, level, slab count and many seeds.
let layouts = 0;
for (const band of Object.keys(SIZES) as Band[]) {
  const [lo, hi] = SIZES[band].steps;
  for (let n = lo; n <= hi; n++) {
    for (let level = 1; level <= 8; level++) {
      for (let seed = 1; seed <= 250; seed++) {
        const l = makeLayout(band, n, level, seed * 7919 + level);
        layouts++;
        const where = `layout ${band} n=${n} level=${level} seed=${seed}`;
        const nums = [...l.floorY, ...l.segments.flatMap((s) => [s.x0, s.x1]), ...l.ladders.map((d) => d.x), l.start.x];
        if (nums.some((v) => !Number.isFinite(v))) problems.push(`${where}: NaN coordinate`);
        const startSeg = segmentAt(l, l.start.floor, l.start.x);
        if (startSeg < 0) {
          problems.push(`${where}: start is not on a girder`);
          continue;
        }
        const seen = reachable(l, startSeg);
        if (seen.size !== l.segments.length) problems.push(`${where}: ${l.segments.length - seen.size} girder segment(s) unreachable`);
        for (const sp of l.spawns) if (segmentAt(l, sp.floor, sp.x) < 0) problems.push(`${where}: spawn off the girders`);
        if (l.cells.length !== n) problems.push(`${where}: ${l.cells.length} cells for ${n} slabs`);
        const keys = new Set(l.cells.map((c) => `${c.col},${c.floor}`));
        if (keys.size !== l.cells.length) problems.push(`${where}: two slabs share a cell`);
        for (const c of l.cells) {
          const [a, b] = slabSpan(band, c.col);
          const seg = l.segments.findIndex((s) => s.floor === c.floor && s.x0 <= a && s.x1 >= b);
          if (seg < 0) problems.push(`${where}: slab at col ${c.col} floor ${c.floor} is not fully on a girder`);
          else if (!seen.has(seg)) problems.push(`${where}: slab at col ${c.col} floor ${c.floor} cannot be reached`);
          const fb = floorBelow(l, c.col, c.floor);
          if (fb !== -1 && (fb <= c.floor || fb >= l.floorY.length)) problems.push(`${where}: bad floor below`);
        }
        for (const lad of l.ladders) {
          for (let col = 0; col < SIZES[band].cols; col++) {
            const [a, b] = slabSpan(band, col);
            if (lad.x + LADDER_HALF > a && lad.x - LADDER_HALF < b) problems.push(`${where}: ladder at ${lad.x} under a slab in column ${col}`);
          }
          if (segmentAt(l, lad.top, lad.x) < 0 || segmentAt(l, lad.bottom, lad.x) < 0) problems.push(`${where}: ladder end off the girders`);
        }
        if (problems.length > 80) break;
      }
    }
  }
  // Slab centres must be inside the field.
  for (let c = 0; c < SIZES[band].cols; c++) if (!(colCenter(band, c) > 0)) problems.push(`band ${band}: column ${c} centre`);
}

console.log(counts.join("\n"));
console.log(`checked ${SCIENCE.length} science + ${ELA.length} ELA written sequences, ${generated} generated sequences, ${layouts} layouts`);
if (problems.length) {
  console.error(`\n${problems.length} problem(s):\n` + problems.slice(0, 80).join("\n"));
  process.exit(1);
}
console.log("all good");
