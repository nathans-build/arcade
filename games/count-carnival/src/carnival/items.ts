/*
 * Count Carnival's own question generators (K-2), one per booth and grade. Every item is a kit
 * `Question` (4 choices, answer index, NC standard) plus what the booth draws (`visual`), how each
 * choice is drawn (`art`), what is read aloud (`say`) and a gentle `hint` for after a wrong tap.
 * `level` (0-4) is the item's place in a 5-item round, so rounds ramp up a little.
 */
import type { Grade, Question } from "../kit/types";
import { choose, rint, shuffle, type Rng } from "./rng";

export type BoothId = "balloons" | "tightrope" | "ducks" | "shapes";
export const BOOTHS: BoothId[] = ["balloons", "tightrope", "ducks", "shapes"];

/** The game's content grade: K, 1 or 2 (grades above 2 play grade-2 content). */
export type Play = "K" | "1" | "2";
export function playGrade(g: Grade): Play {
  return g === "K" || g === "1" || g === "2" ? g : "2";
}

export type Sprite = "balloon" | "duck" | "star" | "popcorn";
export type FlatShape = "circle" | "square" | "triangle" | "rectangle" | "hexagon";
export type SolidShape = "cube" | "cone" | "cylinder" | "sphere";
export type ShapeName = FlatShape | SolidShape;
export const FLATS: FlatShape[] = ["circle", "square", "triangle", "rectangle", "hexagon"];
export const SOLIDS: SolidShape[] = ["cube", "cone", "cylinder", "sphere"];
export type CoinName = "penny" | "nickel" | "dime" | "quarter";
export const COIN_CENTS: Record<CoinName, number> = { penny: 1, nickel: 5, dime: 10, quarter: 25 };

/** Counters under the tightrope: red/blue = the two parts, cross = taken away, ghost = the missing part (shown as a hint). */
export type Counter = "red" | "blue" | "cross" | "ghost";

export type Visual =
  | { kind: "objects"; sprite: Sprite; n: number }
  | { kind: "tens"; tens: number; ones: number }
  | { kind: "skip"; step: number; groups: number; seq: (number | null)[] }
  | { kind: "rope"; a: number; b: number; op: "+" | "−"; c: number; unknown: "b" | "c"; counters: Counter[] | null; frame: 5 | 10 | 20 | 0 }
  | { kind: "ducks"; n: number; ask: "more" | "fewer" | "same" }
  | { kind: "numcmp"; n: number; ask: "more" | "less" }
  | { kind: "compare"; a: number; b: number }
  | { kind: "pick-shape"; target: ShapeName | "flat" | "solid" }
  | { kind: "pick-frac"; parts: 2 | 4; shaded: boolean }
  | { kind: "clock"; h: number; m: number }
  | { kind: "coins"; coins: CoinName[] };

export type ChoiceArt =
  | { kind: "num"; n: number; dots: boolean }
  | { kind: "text" }
  | { kind: "ducks"; n: number }
  | { kind: "shape"; shape: ShapeName; rot: number; size: number; color: string }
  | { kind: "frac"; form: "circle" | "rect"; parts: number; equal: boolean; shaded: boolean };

export interface CCItem extends Question {
  booth: BoothId;
  visual: Visual;
  /** How each choice is drawn, parallel to `choices`. */
  art: [ChoiceArt, ChoiceArt, ChoiceArt, ChoiceArt];
  /** Spoken version of each choice, parallel to `choices`. */
  spoken: [string, string, string, string];
  /** Everything read aloud when the item appears. */
  say: string;
  /** Shown and read aloud after a wrong tap. */
  hint: string;
  /** Labels lit one at a time by the counting hint (empty = no counting animation). */
  hintSteps: string[];
}

/** Button colours, in order; read aloud for picture/text choices ("Red: ..."). */
export const CHOICE_COLORS = ["Red", "Blue", "Green", "Yellow"] as const;

interface Opt {
  label: string;
  art: ChoiceArt;
  spoken?: string;
}

interface Base {
  booth: BoothId;
  grade: Play;
  standard: string;
  skill: string;
  prompt: string;
  /** Spoken prompt (defaults to `prompt`). */
  sayPrompt?: string;
  /** "list": "Is it 7, 8, 9 or 6?"  "colors": "Red: ... Blue: ..."  "none": prompt only. */
  readChoices: "list" | "colors" | "none";
  explanation: string;
  visual: Visual;
  hint: string;
  hintSteps?: string[];
}

let serial = 0;

function build(rng: Rng, base: Base, right: Opt, wrong: Opt[]): CCItem {
  if (wrong.length !== 3) throw new Error(`need 3 wrong options for ${base.skill}, got ${wrong.length}`);
  const opts = shuffle(rng, [{ ...right, ok: true }, ...wrong.map((w) => ({ ...w, ok: false }))]);
  const choices = opts.map((o) => o.label) as CCItem["choices"];
  const art = opts.map((o) => o.art) as CCItem["art"];
  const spoken = opts.map((o) => o.spoken ?? o.label) as CCItem["spoken"];
  const answer = opts.findIndex((o) => o.ok);
  const p = base.sayPrompt ?? base.prompt;
  let say = p;
  if (base.readChoices === "list") say = `${p} Is it ${spoken.slice(0, 3).join(", ")}, or ${spoken[3]}?`;
  else if (base.readChoices === "colors") say = `${p} ${spoken.map((s, i) => `${CHOICE_COLORS[i]}: ${s}.`).join(" ")}`;
  serial = (serial + 1) % 1_000_000;
  return {
    id: `cc-${base.booth}-${base.grade}-${base.standard}-${serial}`,
    subject: "math",
    grade: base.grade,
    standard: base.standard,
    skill: base.skill,
    prompt: base.prompt,
    choices,
    answer,
    explanation: base.explanation,
    quick: false,
    booth: base.booth,
    visual: base.visual,
    art,
    spoken,
    say,
    hint: base.hint,
    hintSteps: base.hintSteps ?? [],
  };
}

/** Three different numbers ≠ ans in [min, max], taking `prefer` first (in random order), then nearby ones. */
export function nearNums(rng: Rng, ans: number, min: number, max: number, prefer: number[] = []): number[] {
  const out: number[] = [];
  const ok = (v: number) => Number.isInteger(v) && v >= min && v <= max && v !== ans && !out.includes(v);
  for (const v of shuffle(rng, prefer)) if (out.length < 3 && ok(v)) out.push(v);
  for (let spread = 2; out.length < 3 && spread < 2000; spread *= 2) {
    for (let t = 0; t < 12 && out.length < 3; t++) {
      const v = ans + rint(rng, -spread, spread);
      if (ok(v)) out.push(v);
    }
  }
  for (let v = min; out.length < 3 && v <= max; v++) if (ok(v)) out.push(v);
  return out;
}

const numOpt = (n: number, dots: boolean, unit?: string): Opt => ({ label: String(n), art: { kind: "num", n, dots }, spoken: unit ? `${n} ${unit}` : String(n) });
const range = (n: number, f: (i: number) => string) => Array.from({ length: n }, (_, i) => f(i));

/* ================================================================= Balloon Count */

const SPRITE_WORD: Record<Sprite, string> = { balloon: "balloons", duck: "ducks", star: "stars", popcorn: "popcorn boxes" };

function balloonsK(rng: Rng, level: number): CCItem {
  const n = level <= 2 ? rint(rng, level === 0 ? 1 : 3, 10) : rint(rng, 11, 20);
  const sprite = choose(rng, level <= 2 ? (["balloon", "duck", "star"] as Sprite[]) : (["balloon", "popcorn", "star"] as Sprite[]));
  const word = SPRITE_WORD[sprite];
  const dots = n <= 10;
  return build(
    rng,
    {
      booth: "balloons", grade: "K", standard: "NC.K.CC.5", skill: n <= 10 ? "Count to tell how many (1-10)" : "Count to tell how many (11-20)",
      prompt: `How many ${word}?`, readChoices: "list",
      explanation: `There ${n === 1 ? "is" : "are"} ${n} ${n === 1 ? word.replace(/e?s$/, "") : word}!`,
      visual: { kind: "objects", sprite, n },
      hint: "Let's count them together. Watch them light up!",
      hintSteps: range(n, (i) => String(i + 1)),
    },
    numOpt(n, dots),
    nearNums(rng, n, 1, 20, [n - 1, n + 1, n + 2, n - 2]).map((v) => numOpt(v, dots)),
  );
}

function balloons1(rng: Rng, level: number): CCItem {
  const n = level <= 2 ? rint(rng, 11, 99) : rint(rng, 100, 120);
  const tens = Math.floor(n / 10);
  const ones = n % 10;
  const swapped = ones > 0 && ones !== tens && tens < 10 ? ones * 10 + tens : -1;
  return build(
    rng,
    {
      booth: "balloons", grade: "1", standard: n < 100 ? "NC.1.NBT.2" : "NC.1.NBT.1", skill: n < 100 ? "Tens and ones" : "Count to 120",
      prompt: "How many balloons?", sayPrompt: "Each bunch has 10 balloons. How many balloons in all?", readChoices: "list",
      explanation: `${tens} bunches of ten and ${ones} more make ${n}.`,
      visual: { kind: "tens", tens, ones },
      hint: `Count the bunches by tens: 10, 20, 30... Then count on the single balloons by ones.`,
      hintSteps: [...range(tens, (i) => String((i + 1) * 10)), ...range(ones, (i) => String(tens * 10 + i + 1))],
    },
    numOpt(n, false),
    nearNums(rng, n, 1, 130, [swapped, n + 10, n - 10, n + 1, n - 1, tens + ones]).map((v) => numOpt(v, false)),
  );
}

function balloons2(rng: Rng, level: number): CCItem {
  const step = level === 0 ? choose(rng, [2, 5]) : level === 4 ? 100 : choose(rng, [2, 5, 10, 100]);
  const groups = rint(rng, 4, 10);
  const terms = [0, 1, 2, 3].map((i) => (groups - 3 + i) * step);
  const blank = rint(rng, 1, 3);
  const ans = terms[blank];
  const seq = terms.map((t, i) => (i === blank ? null : t));
  const what = step === 2 ? "pairs of socks" : step === 5 ? "bags of 5 balloons" : step === 10 ? "bunches of 10 balloons" : "rolls of 100 tickets";
  const seqSay = seq.map((t) => (t === null ? "blank" : String(t))).join(", ");
  return build(
    rng,
    {
      booth: "balloons", grade: "2", standard: step === 2 ? "NC.2.OA.3" : "NC.2.NBT.2", skill: `Skip-count by ${step}s`,
      prompt: `Count by ${step}s. What number is missing?`,
      sayPrompt: `Count by ${step}s. ${seqSay}. What number goes in the blank?`, readChoices: "list",
      explanation: `Counting by ${step}s: ${terms.join(", ")}.`,
      visual: { kind: "skip", step, groups, seq },
      hint: `Count the ${what} by ${step}s, one group at a time.`,
      hintSteps: range(groups, (i) => String((i + 1) * step)),
    },
    numOpt(ans, false),
    nearNums(rng, ans, 1, 1100, [ans + step, ans - step, ans + 1, ans - 1, ans + 2 * step, ans + 10]).map((v) => numOpt(v, false)),
  );
}

/* ================================================================= Tightrope Ten */

function counters(red: number, blue: number, kind: "blue" | "cross" | "ghost"): Counter[] {
  return [...Array<Counter>(red).fill("red"), ...Array<Counter>(blue).fill(kind)];
}

function ropeItem(
  rng: Rng, grade: Play, standard: string, skill: string,
  a: number, b: number, op: "+" | "−", unknown: "b" | "c", frame: 5 | 10 | 20 | 0, dots: boolean, max: number,
): CCItem {
  const c = op === "+" ? a + b : a - b;
  const ans = unknown === "b" ? b : c;
  const eq = unknown === "b" ? `${a} ${op} ? = ${c}` : `${a} ${op} ${b} = ?`;
  const eqSay = (unknown === "b" ? `${a} ${op === "+" ? "plus" : "minus"} what makes ${c}?` : `${a} ${op === "+" ? "plus" : "minus"} ${b} is how many?`);
  let cs: Counter[] | null = null;
  if (frame) {
    if (op === "+") cs = counters(a, b, unknown === "b" ? "ghost" : "blue");
    else cs = counters(a - b, b, "cross");
  }
  const tens = (v: number) => Math.floor(v / 10) * 10;
  let hint: string;
  const pref = [ans + 1, ans - 1, ans + 2, ans - 2];
  const small = Math.max(a, b, c) <= 20;
  if (op === "+" && unknown === "b") hint = frame ? `Count up from ${a} to ${c}. The empty spots show how many more.` : `Start at ${a} and count up to ${c}. How many did you count?`;
  else if (op === "+" && (frame || small)) hint = `Start at ${a} and count on ${b} more.${small && !frame && a + b > 10 ? " Making a 10 first can help!" : ""}`;
  else if (frame) hint = `Start with ${a}. Take away ${b}. Count what is left.`;
  else if (small) hint = `Think addition: ${b} plus what makes ${a}?`;
  else if (op === "+") {
    hint = `Add the tens: ${tens(a)} + ${tens(b)} = ${tens(a) + tens(b)}. Then add the ones: ${a % 10} + ${b % 10} = ${(a % 10) + (b % 10)}.`;
    pref.unshift(tens(a) + tens(b) + (((a % 10) + (b % 10)) % 10), ans + 10, ans - 10);
  } else {
    hint = `Take away the tens first: ${a} − ${tens(b)} = ${a - tens(b)}. Then take away ${b % 10} more.`;
    pref.unshift((Math.floor(a / 10) - Math.floor(b / 10)) * 10 + Math.abs((a % 10) - (b % 10)), ans + 10, ans - 10);
  }
  if (op === "−") pref.push(a + b);
  return build(
    rng,
    {
      booth: "tightrope", grade, standard, skill,
      prompt: frame === 5 || frame === 10 ? (unknown === "b" ? `${a} and how many more make ${c}?` : eq) : eq,
      sayPrompt: frame === 5 || frame === 10 ? (unknown === "b" ? `Tally has ${a}. How many more make ${c}?` : eqSay) : eqSay,
      readChoices: "list",
      explanation: `${a} ${op} ${b} = ${c}.`,
      visual: { kind: "rope", a, b, op, c, unknown, counters: cs, frame },
      hint,
      hintSteps: cs ? range(cs.length, (i) => String(i + 1)) : [],
    },
    numOpt(ans, dots),
    nearNums(rng, ans, 0, max, pref).map((v) => numOpt(v, dots)),
  );
}

function tightropeK(rng: Rng, level: number): CCItem {
  if (level <= 1) {
    const a = rint(rng, 1, 4);
    return ropeItem(rng, "K", "NC.K.OA.3", "Make 5", a, 5 - a, "+", "b", 5, true, 10);
  }
  if (level === 2) {
    if (rng() < 0.5) {
      const a = rint(rng, 1, 4);
      return ropeItem(rng, "K", "NC.K.OA.5", "Add within 5", a, rint(rng, 1, 5 - a), "+", "c", 5, true, 10);
    }
    const a = rint(rng, 2, 5);
    return ropeItem(rng, "K", "NC.K.OA.5", "Subtract within 5", a, rint(rng, 1, a - 1), "−", "c", 5, true, 10);
  }
  const a = rint(rng, 1, 9);
  return ropeItem(rng, "K", "NC.K.OA.4", "Make 10", a, 10 - a, "+", "b", 10, true, 10);
}

function fact20(rng: Rng, grade: Play, standard: string, frames: boolean): CCItem {
  const form = rint(rng, 0, 2);
  if (form === 0) {
    const a = rint(rng, 2, 10);
    const b = rint(rng, 1, Math.min(10, 20 - a));
    return ropeItem(rng, grade, standard, "Add within 20", a, b, "+", "c", frames ? 20 : 0, false, 20);
  }
  if (form === 1) {
    const a = rint(rng, 2, 10);
    const b = rint(rng, 1, Math.min(10, 20 - a));
    return ropeItem(rng, grade, standard, "Missing addend within 20", a, b, "+", "b", frames ? 20 : 0, false, 20);
  }
  const a = rint(rng, 6, 20);
  const b = rint(rng, 1, Math.min(10, a - 1));
  return ropeItem(rng, grade, standard, "Subtract within 20", a, b, "−", "c", frames ? 20 : 0, false, 20);
}

function tightrope1(rng: Rng): CCItem {
  return fact20(rng, "1", "NC.1.OA.6", true);
}

function tightrope2(rng: Rng, level: number): CCItem {
  if (level <= 1) return fact20(rng, "2", "NC.2.OA.2", false);
  if (rng() < 0.5) {
    const a = rint(rng, 12, 79);
    const b = rint(rng, 11, 99 - a);
    return ropeItem(rng, "2", "NC.2.NBT.5", "Add within 100", a, b, "+", "c", 0, false, 100);
  }
  const a = rint(rng, 30, 99);
  const b = rint(rng, 11, a - 5);
  return ropeItem(rng, "2", "NC.2.NBT.5", "Subtract within 100", a, b, "−", "c", 0, false, 100);
}

/* ================================================================= Duck Pond */

const duckOpt = (n: number): Opt => ({ label: `${n} ducks`, art: { kind: "ducks", n }, spoken: `${n} ${n === 1 ? "duck" : "ducks"}` });

function ducksK(rng: Rng, level: number): CCItem {
  if (level <= 2) {
    const ask = choose(rng, ["more", "fewer", "same"] as const);
    let n: number;
    let right: number;
    let pool: number[];
    if (ask === "more") {
      n = rint(rng, 3, 8);
      right = rint(rng, n + 1, Math.min(10, n + 4));
      pool = range(n, (i) => String(i + 1)).map(Number);
    } else if (ask === "fewer") {
      n = rint(rng, 4, 8);
      right = rint(rng, Math.max(1, n - 4), n - 1);
      pool = range(11 - n, (i) => String(n + i)).map(Number);
    } else {
      n = rint(rng, 2, 9);
      right = n;
      pool = [n - 1, n + 1, n - 2, n + 2, n + 3].filter((v) => v >= 1 && v <= 10);
    }
    const wrong = shuffle(rng, pool.filter((v) => v !== right)).slice(0, 3);
    const word = ask === "more" ? "MORE" : ask === "fewer" ? "FEWER" : "the SAME number of";
    return build(
      rng,
      {
        booth: "ducks", grade: "K", standard: "NC.K.CC.6", skill: "Compare groups: more, fewer, same",
        prompt: `Tap the pond with ${word} ducks.`,
        sayPrompt: `Look at the big pond. It has ${n} ducks. Tap the little pond with ${word.toLowerCase()} ducks.`,
        readChoices: "none",
        explanation: ask === "same" ? `${right} is the same as ${n}.` : `${right} ducks is ${ask} than ${n} ducks.`,
        visual: { kind: "ducks", n, ask },
        hint: ask === "same" ? `Count the big pond, then find a pond with just as many.` : `Count the big pond. Then count each little pond.`,
        hintSteps: range(n, (i) => String(i + 1)),
      },
      duckOpt(right),
      wrong.map(duckOpt),
    );
  }
  const ask = choose(rng, ["more", "less"] as const);
  const n = rint(rng, 3, 8);
  const right = ask === "more" ? rint(rng, n + 1, 10) : rint(rng, 1, n - 1);
  const pool = ask === "more" ? range(n, (i) => String(i + 1)).map(Number) : range(11 - n, (i) => String(n + i)).map(Number);
  const wrong = shuffle(rng, pool).slice(0, 3);
  return build(
    rng,
    {
      booth: "ducks", grade: "K", standard: "NC.K.CC.7", skill: "Compare two numbers (1-10)",
      prompt: `Tap a number ${ask === "more" ? "MORE" : "LESS"} than ${n}.`,
      sayPrompt: `The duck has ${n}. Tap the number that is ${ask} than ${n}.`, readChoices: "list",
      explanation: `${right} is ${ask} than ${n}.`,
      visual: { kind: "numcmp", n, ask },
      hint: ask === "more" ? `Bigger numbers come after ${n} when we count.` : `Smaller numbers come before ${n} when we count.`,
      hintSteps: range(n, (i) => String(i + 1)),
    },
    numOpt(right, true),
    wrong.map((v) => numOpt(v, true)),
  );
}

const SYM_WORD: Record<string, string> = { "<": "is less than", ">": "is greater than", "=": "is equal to" };
const stmt = (x: number, s: string, y: number): Opt => ({ label: `${x} ${s} ${y}`, art: { kind: "text" }, spoken: `${x} ${SYM_WORD[s]} ${y}` });
export const truth = (x: number, s: string, y: number) => (s === "<" ? x < y : s === ">" ? x > y : x === y);

function compareItem(rng: Rng, grade: Play, a: number, b: number): CCItem {
  const sym = a < b ? "<" : a > b ? ">" : "=";
  const right = stmt(a, sym, b);
  const others = ["<", ">", "="].filter((s) => s !== sym).map((s) => stmt(a, s, b));
  let fourth: Opt;
  if (sym === "=") {
    const rev = Number(String(a).split("").reverse().join(""));
    fourth = rev !== a && String(rev).length === String(a).length ? stmt(rev, "=", a) : stmt(a + 1, "=", a);
  } else fourth = stmt(b, sym, a);
  const place = grade === "1" ? "tens" : "hundreds";
  return build(
    rng,
    {
      booth: "ducks", grade, standard: grade === "1" ? "NC.1.NBT.3" : "NC.2.NBT.4",
      skill: grade === "1" ? "Compare two-digit numbers (>, <, =)" : "Compare three-digit numbers (>, <, =)",
      prompt: "Which one is TRUE?", sayPrompt: `The ducks have ${a} and ${b}. Which one is true?`, readChoices: "colors",
      explanation: `${a} ${SYM_WORD[sym]} ${b}. The open mouth of < or > eats the bigger number.`,
      visual: { kind: "compare", a, b },
      hint: grade === "1" ? `Compare the tens first. If the tens are the same, compare the ones.` : `Compare the ${place} first, then the tens, then the ones.`,
    },
    right,
    [...others, fourth],
  );
}

function ducks1(rng: Rng): CCItem {
  const r = rng();
  const a = rint(rng, 10, 99);
  let b: number;
  if (r < 0.2) b = a;
  else if (r < 0.45) b = Math.floor(a / 10) * 10 + rint(rng, 0, 9);
  else if (r < 0.65 && a % 10 !== 0) b = (a % 10) * 10 + Math.floor(a / 10);
  else b = rint(rng, 10, 99);
  if (b === a && r >= 0.2) b = a === 99 ? 98 : a + 1;
  return compareItem(rng, "1", a, b);
}

function ducks2(rng: Rng): CCItem {
  const r = rng();
  const a = rint(rng, 100, 999);
  let b: number;
  if (r < 0.15) b = a;
  else if (r < 0.45) b = Math.floor(a / 100) * 100 + rint(rng, 0, 99);
  else if (r < 0.65) b = Number(String(a).split("").reverse().join(""));
  else b = rint(rng, 100, 999);
  if (b < 100) b = rint(rng, 100, 999);
  if (b === a && r >= 0.15) b = a === 999 ? 998 : a + 1;
  return compareItem(rng, "2", a, b);
}

/* ================================================================= Shape & Coin Booth */

const SHAPE_COLORS = ["#e3262f", "#2f6fe0", "#21a35a", "#f29e1f", "#9b4fd1", "#e0559a"];
const shapeOpt = (rng: Rng, shape: ShapeName): Opt => ({
  label: shape,
  art: { kind: "shape", shape, rot: SOLIDS.includes(shape as SolidShape) ? 0 : choose(rng, [0, 0, 15, 30, 45, 90, 180]), size: 0.65 + rng() * 0.35, color: choose(rng, SHAPE_COLORS) },
  spoken: `a ${shape}`,
});

const SHAPE_HINT: Record<ShapeName, string> = {
  circle: "A circle is round and flat. It has no corners.",
  square: "A square has 4 sides that are all the same length.",
  triangle: "A triangle has 3 sides and 3 corners.",
  rectangle: "A rectangle has 4 sides: 2 long sides and 2 short sides.",
  hexagon: "A hexagon has 6 sides and 6 corners.",
  cube: "A cube is a solid shape like a block. All its faces are squares.",
  cone: "A cone is a solid shape like a party hat or an ice cream cone.",
  cylinder: "A cylinder is a solid shape like a can. Its ends are circles.",
  sphere: "A sphere is a solid shape like a ball. It is round all over.",
};

function shapesK(rng: Rng, level: number): CCItem {
  const mode = level <= 1 ? "flat" : level === 2 ? "solid" : choose(rng, ["flat", "solid", "kind"] as const);
  if (mode === "kind") {
    const want = choose(rng, ["flat", "solid"] as const);
    const right = choose(rng, want === "flat" ? FLATS : SOLIDS) as ShapeName;
    const wrong = shuffle(rng, want === "flat" ? SOLIDS : FLATS).slice(0, 3) as ShapeName[];
    return build(
      rng,
      {
        booth: "shapes", grade: "K", standard: "NC.K.G.3", skill: "Flat (2-D) or solid (3-D)",
        prompt: `Tap the ${want.toUpperCase()} shape.`,
        sayPrompt: want === "flat" ? "Tap the flat shape. Flat shapes are like drawings on paper." : "Tap the solid shape. Solid shapes are like things you can hold.",
        readChoices: "none",
        explanation: `The ${right} is ${want}.`,
        visual: { kind: "pick-shape", target: want },
        hint: want === "flat" ? "Flat shapes lie flat like paper. Find the one with no sides sticking out." : "Solid shapes look like blocks, balls, cans and cones.",
      },
      shapeOpt(rng, right),
      wrong.map((s) => shapeOpt(rng, s)),
    );
  }
  let target: ShapeName;
  let pool: ShapeName[];
  if (mode === "flat") {
    target = choose(rng, FLATS);
    pool = FLATS.filter((s) => s !== target && !(target === "rectangle" && s === "square"));
  } else {
    target = choose(rng, SOLIDS);
    const lookalike: Record<SolidShape, FlatShape> = { cube: "square", cone: "triangle", cylinder: "rectangle", sphere: "circle" };
    pool = [...SOLIDS.filter((s) => s !== target), lookalike[target as SolidShape]];
  }
  const wrong = shuffle(rng, pool).slice(0, 3);
  return build(
    rng,
    {
      booth: "shapes", grade: "K", standard: "NC.K.G.2", skill: mode === "flat" ? "Name flat shapes" : "Name solid shapes",
      prompt: `Tap the ${target}.`, readChoices: "none",
      explanation: `That is a ${target}! ${SHAPE_HINT[target]}`,
      visual: { kind: "pick-shape", target },
      hint: SHAPE_HINT[target],
    },
    shapeOpt(rng, target),
    wrong.map((s) => shapeOpt(rng, s)),
  );
}

const fracLabel = (parts: number, equal: boolean, shaded: boolean) => `${shaded ? "1 of " : ""}${parts} ${equal ? "equal parts" : "parts, not equal"}`;
const fracOpt = (form: "circle" | "rect", parts: number, equal: boolean, shaded: boolean): Opt => ({
  label: fracLabel(parts, equal, shaded),
  art: { kind: "frac", form, parts, equal, shaded },
  spoken: `${parts} ${equal ? "equal" : "not equal"} parts`,
});

function fracItem(rng: Rng): CCItem {
  const parts = choose(rng, [2, 4] as const);
  const shaded = rng() < 0.5;
  const form = choose(rng, ["circle", "rect"] as const);
  const name = parts === 2 ? "halves" : "fourths";
  const one = parts === 2 ? "one half" : "one fourth";
  const wrong = parts === 2
    ? [fracOpt(form, 2, false, shaded), fracOpt(form, 4, true, shaded), fracOpt(form, 3, true, shaded)]
    : [fracOpt(form, 4, false, shaded), fracOpt(form, 2, true, shaded), fracOpt(form, 3, true, shaded)];
  const thing = form === "circle" ? "pie" : "cake";
  return build(
    rng,
    {
      booth: "shapes", grade: "1", standard: "NC.1.G.3", skill: parts === 2 ? "Halves" : "Fourths",
      prompt: shaded ? `Tap the ${thing} with ${one.toUpperCase()} colored.` : `Tap the ${thing} cut in ${name.toUpperCase()}.`,
      sayPrompt: shaded ? `Tap the ${thing} with ${one} colored in.` : `Tap the ${thing} cut into ${name}. ${name === "halves" ? "Halves are 2 equal parts." : "Fourths are 4 equal parts."}`,
      readChoices: "none",
      explanation: `${parts === 2 ? "Halves" : "Fourths"} means ${parts} equal parts${shaded ? `, and ${one} is 1 of them` : ""}.`,
      visual: { kind: "pick-frac", parts, shaded },
      hint: `Count the parts. They must be ${parts} parts, and all the same size.`,
    },
    fracOpt(form, parts, true, shaded),
    wrong,
  );
}

export const timeLabel = (h: number, m: number) => `${h}:${String(m).padStart(2, "0")}`;
export function timeSay(h: number, m: number): string {
  if (m === 0) return `${h} o'clock`;
  if (m < 10) return `${h} oh ${m}`;
  return `${h} ${m}`;
}
const timeOpt = (h: number, m: number): Opt => ({ label: timeLabel(h, m), art: { kind: "text" }, spoken: timeSay(h, m) });
const hourWrap = (h: number) => ((((h - 1) % 12) + 12) % 12) + 1;

function clockItem(rng: Rng, grade: Play): CCItem {
  const h = rint(rng, 1, 12);
  const m = grade === "1" ? choose(rng, [0, 30]) : rint(rng, 0, 11) * 5;
  const cands: [number, number][] = grade === "1"
    ? [[h, 30 - m], [hourWrap(h + 1), m], [hourWrap(h - 1), m], [hourWrap(h + 1), 30 - m], [hourWrap(h + 6), m]]
    : [[h, (m + 5) % 60], [h, (m + 55) % 60], [hourWrap(h + 1), m], [hourWrap(h - 1), m], [h, m / 5 || 12], [hourWrap(m / 5 || 12), h * 5 % 60]];
  const seen = new Set([timeLabel(h, m)]);
  const wrong: Opt[] = [];
  for (const [wh, wm] of shuffle(rng, cands)) {
    const l = timeLabel(wh, wm);
    if (wrong.length < 3 && !seen.has(l)) {
      seen.add(l);
      wrong.push(timeOpt(wh, wm));
    }
  }
  return build(
    rng,
    {
      booth: "shapes", grade, standard: grade === "1" ? "NC.1.MD.3" : "NC.2.MD.7",
      skill: grade === "1" ? "Time to the hour and half hour" : "Time to 5 minutes",
      prompt: "What time is it?", readChoices: "list",
      explanation: `The clock shows ${timeSay(h, m)}.`,
      visual: { kind: "clock", h, m },
      hint: grade === "1"
        ? "The short hand shows the hour. When the long hand points at 12 it is o'clock; at 6 it is 30."
        : "The short hand shows the hour. Count by 5s around the clock to the long hand to find the minutes.",
      hintSteps: grade === "2" ? range(m / 5, (i) => String((i + 1) * 5)) : [],
    },
    timeOpt(h, m),
    wrong,
  );
}

export const coinTotal = (coins: CoinName[]) => coins.reduce((s, c) => s + COIN_CENTS[c], 0);

function coinItem(rng: Rng): CCItem {
  let coins: CoinName[] = [];
  for (let t = 0; t < 50; t++) {
    const k = rint(rng, 2, 6);
    coins = range(k, () => "").map(() => choose(rng, ["penny", "nickel", "dime", "quarter", "dime", "penny"] as CoinName[]));
    if (coinTotal(coins) <= 99 && new Set(coins).size >= 2) break;
  }
  if (coinTotal(coins) > 99) coins = ["quarter", "dime", "nickel", "penny"];
  coins.sort((x, y) => COIN_CENTS[y] - COIN_CENTS[x]);
  const total = coinTotal(coins);
  const allTen = coins.reduce((s, c) => s + (c === "quarter" ? 10 : COIN_CENTS[c]), 0);
  const cents = (v: number): Opt => ({ label: `${v}¢`, art: { kind: "text" }, spoken: v === 1 ? "1 cent" : `${v} cents` });
  let run = 0;
  return build(
    rng,
    {
      booth: "shapes", grade: "2", standard: "NC.2.MD.8", skill: "Count coins",
      prompt: "How much money?", sayPrompt: "How much money is this? Count the cents.", readChoices: "list",
      explanation: `${coins.map((c) => COIN_CENTS[c]).join(" + ")} = ${total}¢.`,
      visual: { kind: "coins", coins },
      hint: "Start with the biggest coin. Count on: quarters are 25, dimes 10, nickels 5, pennies 1.",
      hintSteps: coins.map((c) => String((run += COIN_CENTS[c]))),
    },
    cents(total),
    nearNums(rng, total, 1, 125, [total + 1, total - 1, total + 5, total - 5, total + 10, coins.length, allTen]).map(cents),
  );
}

function shapes1(rng: Rng, level: number): CCItem {
  return level % 2 === 0 ? fracItem(rng) : clockItem(rng, "1");
}

function shapes2(rng: Rng, level: number): CCItem {
  return level % 2 === 0 ? coinItem(rng) : clockItem(rng, "2");
}

/* ================================================================= dispatch */

type Gen = (rng: Rng, level: number) => CCItem;
export const GENERATORS: Record<BoothId, Record<Play, Gen>> = {
  balloons: { K: balloonsK, "1": balloons1, "2": balloons2 },
  tightrope: { K: tightropeK, "1": tightrope1, "2": tightrope2 },
  ducks: { K: ducksK, "1": ducks1, "2": ducks2 },
  shapes: { K: shapesK, "1": shapes1, "2": shapes2 },
};

export const ROUND_LEN = 5;

/** A 5-item round for one booth. No item repeats its prompt+answer within the round. */
export function makeRound(rng: Rng, booth: BoothId, grade: Grade): CCItem[] {
  const g = playGrade(grade);
  const out: CCItem[] = [];
  const seen = new Set<string>();
  for (let level = 0; level < ROUND_LEN; level++) {
    let it = GENERATORS[booth][g](rng, level);
    for (let t = 0; t < 8 && seen.has(it.prompt + it.choices[it.answer]); t++) it = GENERATORS[booth][g](rng, level);
    seen.add(it.prompt + it.choices[it.answer]);
    out.push(it);
  }
  return out;
}

export const BOOTH_INFO: Record<BoothId, { name: string; say: Record<Play, string>; topic: Record<Play, string> }> = {
  balloons: {
    name: "Balloon Count",
    topic: { K: "Count to 20", "1": "Tens & ones to 120", "2": "Skip-count 2s 5s 10s 100s" },
    say: { K: "Balloon Count! Count the balloons.", "1": "Balloon Count! Count bunches of ten.", "2": "Balloon Count! Skip count the balloons." },
  },
  tightrope: {
    name: "Tightrope Ten",
    topic: { K: "Make 5 and 10", "1": "Facts to 20", "2": "Add & subtract to 100" },
    say: { K: "Tightrope Ten! Help Tally balance. Make five and ten.", "1": "Tightrope Ten! Help Tally balance with number facts.", "2": "Tightrope Ten! Help Tally balance. Add and subtract." },
  },
  ducks: {
    name: "Duck Pond",
    topic: { K: "More, fewer, same", "1": "Compare to 100", "2": "Compare to 1000" },
    say: { K: "Duck Pond! More or less?", "1": "Duck Pond! Which number is bigger?", "2": "Duck Pond! Which number is bigger?" },
  },
  shapes: {
    name: "Shape & Coin",
    topic: { K: "Flat & solid shapes", "1": "Halves, fourths & time", "2": "Coins & time" },
    say: { K: "Shape Booth! Find the shapes.", "1": "Shape Booth! Halves, fourths, and clocks.", "2": "Coin Booth! Count coins and tell time." },
  },
};
