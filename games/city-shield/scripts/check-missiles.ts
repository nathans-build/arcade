/*
 * Content checks for City Shield, for every grade:   npm test   (npx tsx scripts/check-missiles.ts)
 *
 * Missile labels are re-evaluated by an independent parser/evaluator written here (it does not
 * use the game's value.ts): exact BigInt fractions where the math is rational, floating point
 * (tight tolerance) for roots of non-squares, π, trig and logs. It checks that
 *   - every live missile really equals the target (or, in WRONG waves, really is a false claim),
 *     and every decoy really doesn't (or really is true);
 *   - every fact shown after a missile is true;
 *   - equations have exactly one solution and it's the stated one;
 *   - labels and notes only use characters the pixel font can draw, and fit their space;
 *   - no NaN / undefined / Infinity, no repeated labels on screen, content suits the grade.
 */
import type { Grade } from "../src/kit/types";
import { hasGlyphs, textWidth } from "../src/shield/font";
import {
  GRADE_SKILLS,
  labelMaxW,
  NOTE_MAX_W,
  labelScale,
  makeRound,
  outcomeNote,
  skillFor,
  type Outcome,
  type Round,
} from "../src/shield/missions";

const GRADES: Grade[] = ["K", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];
const WAVES = 12;
const ROUNDS_PER_WAVE = 25;
const MISSILES_PER_ROUND = 40;

/* ------------------------------ numbers ------------------------------ */

interface Num {
  q: [bigint, bigint] | null; // exact rational, or null if irrational / approximate
  f: number;
}

function bgcd(a: bigint, b: bigint): bigint {
  a = a < 0n ? -a : a;
  b = b < 0n ? -b : b;
  while (b) [a, b] = [b, a % b];
  return a || 1n;
}
function R(n: bigint, d: bigint = 1n): Num {
  if (d === 0n) throw new Error("division by zero");
  if (d < 0n) {
    n = -n;
    d = -d;
  }
  const g = bgcd(n, d);
  n /= g;
  d /= g;
  return { q: [n, d], f: Number(n) / Number(d) };
}
const F = (x: number): Num => ({ q: null, f: x });
const addN = (a: Num, b: Num) => (a.q && b.q ? R(a.q[0] * b.q[1] + b.q[0] * a.q[1], a.q[1] * b.q[1]) : F(a.f + b.f));
const negN = (a: Num) => (a.q ? R(-a.q[0], a.q[1]) : F(-a.f));
const mulN = (a: Num, b: Num) => (a.q && b.q ? R(a.q[0] * b.q[0], a.q[1] * b.q[1]) : F(a.f * b.f));
const divN = (a: Num, b: Num) => {
  if (b.q ? b.q[0] === 0n : b.f === 0) throw new Error("division by zero");
  return a.q && b.q ? R(a.q[0] * b.q[1], a.q[1] * b.q[0]) : F(a.f / b.f);
};
function iroot(n: bigint, k: number): bigint | null {
  if (n < 0n) return null;
  let r = BigInt(Math.round(Math.pow(Number(n), 1 / k)));
  for (const c of [r - 1n, r, r + 1n]) if (c >= 0n && c ** BigInt(k) === n) return c;
  r = 0n;
  return null;
}
function rootN(a: Num, k: number): Num {
  if (a.q) {
    const n = iroot(a.q[0], k);
    const d = iroot(a.q[1], k);
    if (n !== null && d !== null) return R(n, d);
  }
  if (a.f < 0) throw new Error("even root of a negative");
  return F(Math.pow(a.f, 1 / k));
}
function powN(a: Num, p: number, q: number): Num {
  // a^(p/q)
  let base = a;
  if (q !== 1) base = rootN(a, q);
  if (base.q) {
    if (p >= 0) return R(base.q[0] ** BigInt(p), base.q[1] ** BigInt(p));
    return R(base.q[1] ** BigInt(-p), base.q[0] ** BigInt(-p));
  }
  return F(Math.pow(base.f, p));
}
function eqN(a: Num, b: Num): boolean {
  if (a.q && b.q) return a.q[0] === b.q[0] && a.q[1] === b.q[1];
  return Math.abs(a.f - b.f) <= 1e-9 * Math.max(1, Math.abs(a.f), Math.abs(b.f));
}
const finite = (a: Num) => Number.isFinite(a.f);

/* ------------------------------ parser ------------------------------ */

const SUP = "⁰¹²³⁴⁵⁶⁷⁸⁹";
const SUB = "₀₁₂₃₄₅₆₇₈₉";

class Evaluator {
  private s: string[] = [];
  private i = 0;
  private x: Num | null = null;
  constructor(private funcs: Record<string, string> = {}) {}

  static withContext(context?: string): Evaluator {
    const funcs: Record<string, string> = {};
    if (context) {
      for (const part of context.split(/\s{2,}/)) {
        const m = /^([fg])\(x\)=(.+)$/.exec(part.trim());
        if (!m) throw new Error(`bad context part "${part}"`);
        funcs[m[1]] = m[2];
      }
    }
    return new Evaluator(funcs);
  }

  eval(text: string, x: Num | null = null): Num {
    const saved = { s: this.s, i: this.i, x: this.x };
    this.s = [...text];
    this.i = 0;
    this.x = x;
    try {
      const v = this.sum();
      this.skip();
      if (this.i < this.s.length) throw new Error(`unexpected "${this.s.slice(this.i).join("")}" in "${text}"`);
      return v;
    } finally {
      this.s = saved.s;
      this.i = saved.i;
      this.x = saved.x;
    }
  }

  private skip() {
    while (this.s[this.i] === " ") this.i++;
  }
  private peek(): string | undefined {
    this.skip();
    return this.s[this.i];
  }
  private take(ch: string) {
    if (this.peek() !== ch) throw new Error(`expected "${ch}" at ${this.i} in "${this.s.join("")}"`);
    this.i++;
  }
  private word(w: string): boolean {
    this.skip();
    if (this.s.slice(this.i, this.i + w.length).join("") === w) {
      this.i += w.length;
      return true;
    }
    return false;
  }

  private sum(): Num {
    let v = this.prod();
    for (;;) {
      const c = this.peek();
      if (c === "+") {
        this.i++;
        v = addN(v, this.prod());
      } else if (c === "−" || c === "-") {
        this.i++;
        v = addN(v, negN(this.prod()));
      } else return v;
    }
  }
  private prod(): Num {
    let v = this.frac();
    for (;;) {
      const c = this.peek();
      if (c === "×" || c === "·") {
        this.i++;
        v = mulN(v, this.frac());
      } else if (c === "÷") {
        this.i++;
        v = divN(v, this.frac());
      } else return v;
    }
  }
  private frac(): Num {
    let v = this.imp();
    while (this.peek() === "/") {
      this.i++;
      v = divN(v, this.imp());
    }
    return v;
  }
  private startsPrimary(c: string | undefined): boolean {
    return c !== undefined && /[0-9.(\[xπ√∛fgslct]/.test(c);
  }
  private imp(): Num {
    let v = this.unary();
    while (this.startsPrimary(this.peek())) v = mulN(v, this.power());
    return v;
  }
  private unary(): Num {
    const c = this.peek();
    if (c === "−" || c === "-") {
      this.i++;
      return negN(this.unary());
    }
    return this.power();
  }
  private power(): Num {
    const b = this.primary();
    const c = this.s[this.i];
    if (c !== undefined && (SUP.includes(c) || c === "⁻")) {
      let sign = 1;
      if (c === "⁻") {
        sign = -1;
        this.i++;
      }
      let p = "";
      while (this.s[this.i] !== undefined && SUP.includes(this.s[this.i])) p += SUP.indexOf(this.s[this.i++]);
      let q = "1";
      if (this.s[this.i] === "ᐟ") {
        this.i++;
        q = "";
        while (this.s[this.i] !== undefined && SUP.includes(this.s[this.i])) q += SUP.indexOf(this.s[this.i++]);
      }
      if (!p || !q) throw new Error("bad exponent");
      return powN(b, sign * Number(p), Number(q));
    }
    return b;
  }
  private number(): Num {
    let t = "";
    while (this.s[this.i] !== undefined && /[0-9.]/.test(this.s[this.i])) t += this.s[this.i++];
    if (!/^\d+(\.\d+)?$|^\.\d+$/.test(t)) throw new Error(`bad number "${t}"`);
    const [w, f = ""] = t.split(".");
    return R(BigInt((w || "0") + f), 10n ** BigInt(f.length));
  }
  private primary(): Num {
    const c = this.peek();
    if (c === undefined) throw new Error("unexpected end");
    if (/[0-9.]/.test(c)) return this.number();
    if (c === "(" || c === "[") {
      this.i++;
      const v = this.sum();
      this.take(c === "(" ? ")" : "]");
      return v;
    }
    if (c === "x") {
      this.i++;
      if (!this.x) throw new Error("x has no value here");
      return this.x;
    }
    if (c === "π") {
      this.i++;
      return F(Math.PI);
    }
    if (c === "√") {
      this.i++;
      return rootN(this.primary(), 2);
    }
    if (c === "∛") {
      this.i++;
      return rootN(this.primary(), 3);
    }
    if (this.word("log")) {
      let base = "";
      while (this.s[this.i] !== undefined && SUB.includes(this.s[this.i])) base += SUB.indexOf(this.s[this.i++]);
      const b = base ? Number(base) : 10;
      const arg = this.power();
      if (arg.f <= 0) throw new Error("log of a non-positive number");
      if (arg.q) {
        for (let k = -30; k <= 30; k++) {
          const bk = k >= 0 ? R(BigInt(b) ** BigInt(k)) : R(1n, BigInt(b) ** BigInt(-k));
          if (eqN(bk, arg)) return R(BigInt(k));
        }
      }
      return F(Math.log(arg.f) / Math.log(b));
    }
    for (const fn of ["sin", "cos", "tan"] as const) {
      if (this.word(fn)) {
        let rad: number;
        if (this.peek() === "(") {
          rad = this.primary().f;
        } else {
          const deg = this.number().f;
          this.take("°");
          rad = (deg * Math.PI) / 180;
        }
        const v = Math[fn](rad);
        if (!Number.isFinite(v) || Math.abs(v) > 1e6) throw new Error("undefined trig value");
        return F(v);
      }
    }
    if ((c === "f" || c === "g") && this.s[this.i + 1] === "(") {
      this.i++;
      const body = this.funcs[c];
      if (!body) throw new Error(`${c} is not defined`);
      this.take("(");
      const arg = this.sum();
      this.take(")");
      return this.eval(body, arg);
    }
    throw new Error(`unexpected "${c}" in "${this.s.join("")}"`);
  }
}

/* ------------------------------ checks ------------------------------ */

let failures = 0;
function fail(msg: string) {
  failures++;
  if (failures <= Number(process.env.MAXFAIL ?? 40)) console.error("FAIL:", msg);
}
function check(cond: boolean, msg: () => string) {
  if (!cond) fail(msg());
}

function textOk(s: string, what: string) {
  check(s.length > 0 && !/NaN|undefined|Infinity|null|\[object/.test(s), () => `${what} "${s}" looks broken`);
  check(hasGlyphs(s), () => `${what} "${s}" uses characters the pixel font can't draw`);
}

function splitEq(s: string): [string, string] {
  const i = s.indexOf("=");
  if (i < 0 || s.indexOf("=", i + 1) >= 0) throw new Error(`expected exactly one "=" in "${s}"`);
  return [s.slice(0, i), s.slice(i + 1)];
}

/** For equation rounds: does the equation hold at x = v? Also checks it's linear-or-monotone with one root. */
function holds(ev: Evaluator, eqn: string, v: Num): boolean {
  const [l, r] = splitEq(eqn);
  return eqN(ev.eval(l, v), ev.eval(r, v));
}

function gradeRules(grade: Grade, label: string): string | null {
  const nums = (label.match(/\d+(\.\d+)?/g) ?? []).map(Number);
  const max = Math.max(0, ...nums);
  if (grade === "K" && (max > 10 || /[×÷]/.test(label))) return "K label out of range";
  if (grade === "1" && (max > 99 || /[×÷]/.test(label))) return "grade 1 label out of range";
  if (grade === "2" && (max > 999 || /[×÷]/.test(label))) return "grade 2 label out of range";
  if (["K", "1", "2", "3", "4", "5", "6"].includes(grade) && /(^−|\(−|[×÷+·=]−)/.test(label)) return "negative numbers before grade 7";
  if (Number(grade) < 9 && grade !== "K" && /[fgx]|log|sin|cos|tan/.test(label)) return "algebra/functions before grade 9";
  return null;
}

const OUTCOMES: Outcome[] = ["stopped", "wasted", "passed", "landed"];

function checkRound(grade: Grade, wave: number, round: Round, stats: { missiles: number; live: number; samples: Set<string> }) {
  const ev = Evaluator.withContext(round.context);
  const scale = labelScale(grade);
  textOk(round.targetText, "target");
  check(/^NC\./.test(round.standard), () => `standard ${round.standard}`);
  if (round.context) {
    textOk(round.context, "context");
    check(textWidth(round.context) <= NOTE_MAX_W, () => `context too wide: ${round.context}`);
  }
  const isEq = round.mode === "match" && round.targetText.startsWith("x = ");
  let target: Num | null = null;
  if (round.mode === "match") {
    target = ev.eval(isEq ? round.targetText.slice(4) : round.targetText);
    check(finite(target), () => `target ${round.targetText} not finite`);
    check(textWidth(`TARGET ${round.targetText}`) <= NOTE_MAX_W, () => `target too wide`);
  }

  const onScreen = new Set<string>();
  let live = 0;
  let safe = 0;
  for (let i = 0; i < MISSILES_PER_ROUND; i++) {
    const danger = i % 2 === 0;
    // Keep a sliding "screen" of labels like the game does (up to 5 at once).
    if (onScreen.size >= 5) onScreen.delete(onScreen.values().next().value as string);
    const m = round.next(danger, onScreen);
    check(m.danger === danger, () => `asked for danger=${danger}, got ${m.danger} (${m.label})`);
    check(!onScreen.has(m.label), () => `repeated label on screen: ${m.label} (grade ${grade} wave ${wave})`);
    onScreen.add(m.label);
    stats.missiles++;
    if (m.danger) live++;
    else safe++;
    if (stats.samples.size < 3 && m.danger) stats.samples.add(`${round.mode === "match" ? `T=${round.targetText}: ` : ""}${m.label}`);

    textOk(m.label, "label");
    textOk(m.fact, "fact");
    const w = textWidth(m.label, scale);
    check(w <= labelMaxW(grade), () => `label "${m.label}" is ${w}px wide at scale ${scale} (max ${labelMaxW(grade)})`);
    const rule = gradeRules(grade, m.label);
    check(rule === null, () => `${rule}: ${m.label}`);
    for (const o of OUTCOMES) {
      const note = outcomeNote(round, m, o);
      textOk(note, "note");
      check(textWidth(note) <= NOTE_MAX_W, () => `note too wide (${textWidth(note)}px): ${note}`);
    }

    try {
      if (round.mode === "match" && isEq) {
        const t = target!;
        const [l, r] = splitEq(m.label);
        check(/x/.test(l + r), () => `equation without x: ${m.label}`);
        check(holds(ev, m.label, t) === m.danger, () => `${m.label}: holds at ${round.targetText} is ${!m.danger}, danger=${m.danger}`);
        // The fact states the real solution.
        const fm = /^(.*) → x=(.*)$/.exec(m.fact);
        check(!!fm && fm[1] === m.label, () => `bad equation fact "${m.fact}"`);
        if (fm) {
          const sol = ev.eval(fm[2]);
          check(holds(ev, m.label, sol), () => `${m.label} does not hold at x=${fm[2]}`);
          check(eqN(sol, t) === m.danger, () => `${m.fact}: solution vs target mismatch`);
          // Exactly one solution: linear equations have a nonzero slope; log equations are monotone.
          if (!/log/.test(m.label)) {
            const d0 = addN(ev.eval(l, R(0n)), negN(ev.eval(r, R(0n))));
            const d1 = addN(ev.eval(l, R(1n)), negN(ev.eval(r, R(1n))));
            const d2 = addN(ev.eval(l, R(2n)), negN(ev.eval(r, R(2n))));
            check(!eqN(d0, d1), () => `${m.label} has no unique solution`);
            check(eqN(addN(d2, negN(d1)), addN(d1, negN(d0))), () => `${m.label} isn't linear`);
          }
        }
      } else if (round.mode === "match") {
        const v = ev.eval(m.label);
        check(finite(v), () => `${m.label} not finite`);
        check(eqN(v, target!) === m.danger, () => `${m.label} = ${v.f}, target ${round.targetText} (${target!.f}), danger=${m.danger}`);
        const [fl, fr] = splitEq(m.fact);
        check(fl === m.label, () => `fact "${m.fact}" isn't about "${m.label}"`);
        check(eqN(ev.eval(fr), v), () => `fact "${m.fact}" is false (${v.f})`);
      } else {
        const [l, r] = splitEq(m.label);
        const truth = eqN(ev.eval(l), ev.eval(r));
        check(truth !== m.danger, () => `claim "${m.label}" is ${truth ? "true" : "false"} but danger=${m.danger}`);
        const [fl, fr] = splitEq(m.fact);
        check(fl === l, () => `fact "${m.fact}" isn't about "${l}"`);
        check(eqN(ev.eval(fl), ev.eval(fr)), () => `fact "${m.fact}" is false`);
      }
    } catch (e) {
      fail(`grade ${grade} wave ${wave}: can't evaluate "${m.label}" / "${m.fact}": ${(e as Error).message}`);
    }
  }
  stats.live += live;
  check(live > 0 && safe > 0, () => `round without both kinds of missile`);
}

for (const grade of GRADES) {
  const stats = { missiles: 0, live: 0, samples: new Set<string>() };
  const skillsSeen = new Set<string>();
  let wrongWaves = 0;
  for (let wave = 1; wave <= WAVES; wave++) {
    skillsSeen.add(skillFor(grade, wave).key);
    for (let r = 0; r < ROUNDS_PER_WAVE; r++) {
      let round: Round;
      try {
        round = makeRound(grade, wave);
      } catch (e) {
        fail(`grade ${grade} wave ${wave}: makeRound threw ${(e as Error).message}`);
        continue;
      }
      if (round.mode === "wrong") wrongWaves++;
      checkRound(grade, wave, round, stats);
    }
  }
  const all = GRADE_SKILLS[grade];
  check(all.every((s) => skillsSeen.has(s.key)), () => `grade ${grade}: some skills never appear in 12 waves`);
  check(all.some((s) => s.claims), () => `grade ${grade}: no skill can make WRONG-wave claims`);
  check(wrongWaves > 0, () => `grade ${grade}: no WRONG waves`);
  console.log(
    `grade ${grade.padStart(2)} ok · ${stats.missiles} missiles (${stats.live} live) · ${all.map((s) => s.standard).join(", ")} · e.g. ${[...stats.samples].join(" | ")}`,
  );
}

if (failures) {
  console.error(`\n${failures} check(s) failed`);
  process.exit(1);
}
console.log("\nAll City Shield content checks passed.");
