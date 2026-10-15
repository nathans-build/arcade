/*
 * What the capsule halves and germ blobs say, grade by grade, and what "the same kind" means.
 *
 * Every tile carries a Token: `kind` is the match group (4 in a line of the same kind clear),
 * `label` is what is drawn on it, `key` is its exact identity (used by the bonus rules), and
 * `say` is how read-aloud names it. Kinds are MEANINGS, not just colours: 3×4 and 12 are the
 * same kind, Na and "sodium" are the same kind, Na⁺ and K⁺ are the same kind (both 1+).
 *
 * Sets by grade band:
 *   K–2  shapes   colour + shape sorting (science: properties)
 *        bonds    shapes with numbers; a number touching its partner to 10 pops (3 + 7)
 *   3–5  facts    multiplication / division facts ↔ products (3×4 matches 12)
 *        matter   solid / liquid / gas examples (milk matches LIQUID)
 *   6–8  elements symbols ↔ names (O = oxygen); atoms touching in the right numbers make a
 *                 molecule or compound bonus (H, H, O → H₂O)
 *        integers integer expressions ↔ values (−5+2 matches −3)
 *   6–12 equations equations ↔ solutions (2x=8 matches x=4)
 *   9–12 ions     ions grouped by charge (Na⁺ matches K⁺); a net-zero cluster makes an ionic
 *                 compound bonus (Na⁺ + Cl⁻ → NaCl, Mg²⁺ + 2 Cl⁻ → MgCl₂)
 *
 * Pure TypeScript (no DOM): scripts/check-rules.ts imports it under tsx.
 */
import type { Grade, Question, Subject } from "../kit/types";
import { int, pick, sample, shuffle, type Rng } from "./rng";

export type SetId = "shapes" | "bonds" | "facts" | "matter" | "elements" | "integers" | "equations" | "ions";
export type TopicId = "physical" | "numbers" | "algebra";
export type BonusKind = "bond10" | "molecule" | "ionic";
export type ShapeId = "circle" | "triangle" | "square" | "star";

export interface Token {
  kind: number;
  key: string;
  label: string;
  say: string;
  /** K–2 number bonds: the number on the tile. */
  num?: number;
}

export interface KindDef {
  id: string;
  /** What a germ of this kind shows (e.g. "12", "Na", "LIQUID"); for ions, the charge. */
  anchor: string;
  /** Germ guide line, e.g. "12", "Na · sodium", "1+ ions". */
  legend: string;
  /** Spoken name, e.g. "twelve", "sodium", "red circle". */
  say: string;
  shape?: ShapeId;
  /** Every label that belongs to this kind (germs and halves), for checks and quizzes. */
  reps: { label: string; say: string; key: string; num?: number }[];
}

export interface BonusInfo {
  kind: BonusKind;
  /** Big popup, e.g. "H₂O!", "3 + 7 = 10!", "NaCl!" */
  title: string;
  /** One kid-friendly line for the lab notes. */
  detail: string;
  say: string;
  formula?: string;
  name?: string;
  /** Ionic bonus: [cation id, anion id]. */
  ions?: [string, string];
}

export interface LevelSet {
  id: SetId;
  subject: Subject;
  topic: TopicId;
  grade: Grade;
  level: number;
  title: string;
  /** One line on how matching works this level. */
  rule: string;
  kinds: KindDef[];
  /** Falling capsules show their colour (K–2). Otherwise they fall as clear glass until they land. */
  colored: boolean;
  bonus: BonusKind | null;
  /** Sizes of connected clusters the bonus rule looks at. */
  bonusSizes: number[];
  germToken(kind: number, rng: Rng): Token;
  halfToken(kind: number, rng: Rng): Token;
  bonusCheck(tokens: Token[]): BonusInfo | null;
}

export type Band = "k2" | "35" | "68" | "912";

export function gradeN(g: Grade): number {
  return g === "K" ? 0 : Number(g);
}

export function bandOf(g: Grade): Band {
  const n = gradeN(g);
  return n <= 2 ? "k2" : n <= 5 ? "35" : n <= 8 ? "68" : "912";
}

export const MINUS = "−";
/** Integer with a proper minus sign. */
export const nstr = (v: number) => (v < 0 ? `${MINUS}${-v}` : String(v));
const nsay = (v: number) => (v < 0 ? `negative ${-v}` : String(v));

const SUB = "₀₁₂₃₄₅₆₇₈₉";
const SUP = "⁰¹²³⁴⁵⁶⁷⁸⁹";
export const subDigits = (n: number) => String(n).split("").map((d) => SUB[Number(d)]).join("");
/** "⁺", "²⁺", "⁻", "³⁻" */
export function supCharge(c: number): string {
  const sign = c > 0 ? "⁺" : "⁻";
  const m = Math.abs(c);
  return m === 1 ? sign : `${SUP[m]}${sign}`;
}
/** "1+", "2−" */
export const chargeLabel = (c: number) => `${Math.abs(c)}${c > 0 ? "+" : MINUS}`;
/** Turns ₂ ⁺ etc. back into plain characters (for checks and plain-text places). */
export function plain(s: string): string {
  return s
    .replace(/[₀-₉]/g, (ch) => String(SUB.indexOf(ch)))
    .replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹]/g, (ch) => String(SUP.indexOf(ch)))
    .replace(/⁺/g, "+")
    .replace(/⁻/g, "-")
    .replace(/−/g, "-");
}

/* ================================================================== K–2: shapes and number bonds */

export const SHAPE_KINDS: { shape: ShapeId; color: string }[] = [
  { shape: "circle", color: "red" },
  { shape: "triangle", color: "yellow" },
  { shape: "square", color: "blue" },
  { shape: "star", color: "green" },
];

function shapeKinds(n: number, numbers: boolean): KindDef[] {
  return SHAPE_KINDS.slice(0, n).map((s) => ({
    id: s.shape,
    anchor: s.shape,
    legend: `${s.color} ${s.shape}`,
    say: `${s.color} ${s.shape}`,
    shape: s.shape,
    reps: numbers
      ? Array.from({ length: 9 }, (_, i) => ({ label: String(i + 1), say: `${s.color} ${s.shape} ${i + 1}`, key: String(i + 1), num: i + 1 }))
      : [{ label: "", say: `${s.color} ${s.shape}`, key: s.shape }],
  }));
}

/* ================================================================== 3–5: multiplication facts */

const factRange = (g: number) => (g <= 3 ? { lo: 2, hi: 9 } : g === 4 ? { lo: 2, hi: 10 } : { lo: 2, hi: 12 });

/** Every fact label (×, and ÷ from grade 4) whose value is v at grade g. */
export function factReps(v: number, g: number): { label: string; say: string; key: string }[] {
  const { lo, hi } = factRange(g);
  const out: { label: string; say: string; key: string }[] = [];
  for (let a = lo; a <= hi; a++) {
    if (v % a === 0) {
      const b = v / a;
      if (b >= lo && b <= hi) out.push({ label: `${a}×${b}`, say: `${a} times ${b}`, key: `${a}x${b}` });
    }
  }
  if (g >= 4) {
    const maxDividend = g === 4 ? 100 : 144;
    for (let b = 2; b <= 9; b++) {
      const d = v * b;
      if (d <= maxDividend && v <= 12) out.push({ label: `${d}÷${b}`, say: `${d} divided by ${b}`, key: `${d}/${b}` });
    }
  }
  return out;
}

/** Products a grade can use: at least 2 different facts, and small at the first levels. */
export function factProducts(g: number, level: number): number[] {
  const { hi } = factRange(g);
  const cap = level <= 2 ? (g <= 3 ? 30 : 50) : hi * hi;
  const out: number[] = [];
  for (let v = 4; v <= cap; v++) {
    const facts = factReps(v, g).filter((r) => r.label.includes("×"));
    if (facts.length >= 2) out.push(v);
  }
  return out;
}

function factKinds(g: number, level: number, n: number, rng: Rng): KindDef[] {
  return sample(rng, factProducts(g, level), n)
    .sort((a, b) => a - b)
    .map((v) => ({
      id: String(v),
      anchor: String(v),
      legend: String(v),
      say: String(v),
      reps: [{ label: String(v), say: String(v), key: String(v) }, ...factReps(v, g)],
    }));
}

/* ================================================================== 3–5: states of matter */

export const MATTER: { state: string; examples: string[] }[] = [
  { state: "SOLID", examples: ["ice", "rock", "wood", "brick", "coin", "crayon", "spoon", "block"] },
  { state: "GAS", examples: ["air", "helium", "oxygen", "vapor", "neon"] },
  { state: "LIQUID", examples: ["water", "milk", "juice", "oil", "honey", "syrup", "vinegar"] },
];

function matterKinds(): KindDef[] {
  return MATTER.map((m) => ({
    id: m.state.toLowerCase(),
    anchor: m.state,
    legend: m.state,
    say: m.state.toLowerCase(),
    reps: [
      { label: m.state, say: m.state.toLowerCase(), key: m.state },
      ...m.examples.map((e) => ({ label: e, say: e === "vapor" ? "water vapor" : e, key: e })),
    ],
  }));
}

/* ================================================================== 6–8: elements and molecules */

export interface Element {
  sym: string;
  name: string;
  z: number;
}

/** Symbols, names and atomic numbers (checked by npm test against known values). */
export const ELEMENTS: Element[] = [
  { sym: "H", name: "hydrogen", z: 1 },
  { sym: "He", name: "helium", z: 2 },
  { sym: "Li", name: "lithium", z: 3 },
  { sym: "C", name: "carbon", z: 6 },
  { sym: "N", name: "nitrogen", z: 7 },
  { sym: "O", name: "oxygen", z: 8 },
  { sym: "F", name: "fluorine", z: 9 },
  { sym: "Ne", name: "neon", z: 10 },
  { sym: "Na", name: "sodium", z: 11 },
  { sym: "Mg", name: "magnesium", z: 12 },
  { sym: "Al", name: "aluminum", z: 13 },
  { sym: "Si", name: "silicon", z: 14 },
  { sym: "S", name: "sulfur", z: 16 },
  { sym: "Cl", name: "chlorine", z: 17 },
  { sym: "K", name: "potassium", z: 19 },
  { sym: "Ca", name: "calcium", z: 20 },
  { sym: "Fe", name: "iron", z: 26 },
  { sym: "Ni", name: "nickel", z: 28 },
  { sym: "Cu", name: "copper", z: 29 },
  { sym: "Zn", name: "zinc", z: 30 },
  { sym: "Ag", name: "silver", z: 47 },
  { sym: "Sn", name: "tin", z: 50 },
  { sym: "I", name: "iodine", z: 53 },
  { sym: "Au", name: "gold", z: 79 },
  { sym: "Pb", name: "lead", z: 82 },
];

export const element = (sym: string) => {
  const e = ELEMENTS.find((x) => x.sym === sym);
  if (!e) throw new Error(`unknown element ${sym}`);
  return e;
};

export interface Recipe {
  formula: string;
  name: string;
  atoms: Record<string, number>;
  /** "molecule" (covalent) or "compound" (ionic, e.g. table salt). */
  type: "molecule" | "compound";
}

/** Clusters that make a bonus at grades 6–8. Never two of the same element only (O₂ would pop all the time). */
export const RECIPES: Recipe[] = [
  { formula: "H₂O", name: "water", atoms: { H: 2, O: 1 }, type: "molecule" },
  { formula: "CO₂", name: "carbon dioxide", atoms: { C: 1, O: 2 }, type: "molecule" },
  { formula: "NH₃", name: "ammonia", atoms: { N: 1, H: 3 }, type: "molecule" },
  { formula: "HCl", name: "hydrogen chloride", atoms: { H: 1, Cl: 1 }, type: "molecule" },
  { formula: "NaCl", name: "sodium chloride (table salt)", atoms: { Na: 1, Cl: 1 }, type: "compound" },
  { formula: "KCl", name: "potassium chloride", atoms: { K: 1, Cl: 1 }, type: "compound" },
  { formula: "MgO", name: "magnesium oxide", atoms: { Mg: 1, O: 1 }, type: "compound" },
  { formula: "CaO", name: "calcium oxide", atoms: { Ca: 1, O: 1 }, type: "compound" },
];

/** Element groups per level (3 kinds for levels 1–3, then 4). Each group's molecules come from RECIPES. */
export const ELEMENT_GROUPS_3 = [["H", "O", "C"], ["Na", "Cl", "H"], ["Mg", "O", "He"], ["K", "Cl", "N"], ["Ca", "O", "Ne"]];
export const ELEMENT_GROUPS_4 = [["H", "O", "C", "N"], ["Na", "Cl", "K", "O"], ["Fe", "Cu", "Au", "Ag"], ["Ca", "O", "C", "H"], ["Mg", "O", "Na", "Cl"]];

function elementKinds(level: number): KindDef[] {
  const groups = level <= 3 ? ELEMENT_GROUPS_3 : ELEMENT_GROUPS_4;
  const group = groups[(level - 1) % groups.length];
  return group.map((sym) => {
    const e = element(sym);
    return {
      id: sym,
      anchor: sym,
      legend: `${sym} · ${e.name}`,
      say: e.name,
      reps: [
        { label: sym, say: e.name, key: sym },
        { label: e.name, say: e.name, key: sym },
      ],
    };
  });
}

function countKeys(tokens: Token[]): Record<string, number> {
  const m: Record<string, number> = {};
  for (const t of tokens) m[t.key] = (m[t.key] ?? 0) + 1;
  return m;
}

export function recipeFor(tokens: Token[]): Recipe | null {
  const c = countKeys(tokens);
  const keys = Object.keys(c);
  for (const r of RECIPES) {
    const rk = Object.keys(r.atoms);
    if (rk.length === keys.length && rk.every((k) => c[k] === r.atoms[k])) return r;
  }
  return null;
}

/** "2 H + 1 O" style list, for explanations. */
export function atomList(atoms: Record<string, number>): string {
  return Object.entries(atoms)
    .map(([k, n]) => `${n} ${k}`)
    .join(" + ");
}

/* ================================================================== 9–12: ions and ionic compounds */

export interface Ion {
  id: string;
  label: string;
  /** Formula without the charge: "Na", "NH₄", "SO₄". */
  formula: string;
  poly: boolean;
  charge: number;
  /** Name used in a compound name: "sodium", "copper(II)", "chloride". */
  name: string;
}

const ion = (formula: string, charge: number, name: string, poly = false): Ion => ({
  id: `${plain(formula)}${charge > 0 ? "+" : "-"}${Math.abs(charge)}`,
  label: `${formula}${supCharge(charge)}`,
  formula,
  poly,
  charge,
  name,
});

/** Common ions with their charges (checked by npm test). */
export const IONS: Ion[] = [
  ion("Na", 1, "sodium"),
  ion("K", 1, "potassium"),
  ion("Li", 1, "lithium"),
  ion("Ag", 1, "silver"),
  ion("NH₄", 1, "ammonium", true),
  ion("Cl", -1, "chloride"),
  ion("F", -1, "fluoride"),
  ion("Br", -1, "bromide"),
  ion("I", -1, "iodide"),
  ion("OH", -1, "hydroxide", true),
  ion("NO₃", -1, "nitrate", true),
  ion("Mg", 2, "magnesium"),
  ion("Ca", 2, "calcium"),
  ion("Zn", 2, "zinc"),
  ion("Ba", 2, "barium"),
  ion("Cu", 2, "copper(II)"),
  ion("Fe", 2, "iron(II)"),
  ion("O", -2, "oxide"),
  ion("S", -2, "sulfide"),
  ion("SO₄", -2, "sulfate", true),
  ion("CO₃", -2, "carbonate", true),
  ion("Al", 3, "aluminum"),
  ion("Fe", 3, "iron(III)"),
  ion("PO₄", -3, "phosphate", true),
];

export const ionById = (id: string) => {
  const i = IONS.find((x) => x.id === id);
  if (!i) throw new Error(`unknown ion ${id}`);
  return i;
};

/** Combinations that would be "net zero" on paper but aren't real, stable compounds. */
export const NOT_A_COMPOUND = ["(NH₄)₂O", "NH₄OH", "AgOH", "CuI₂"];

const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));

/** Lowest-terms formula of a cation and an anion, e.g. MgCl₂, (NH₄)₂SO₄, Ca(OH)₂. */
export function ionicFormula(cat: Ion, an: Ion): { formula: string; nCat: number; nAn: number; name: string } {
  const g = gcd(cat.charge, -an.charge);
  const nCat = -an.charge / g;
  const nAn = cat.charge / g;
  const part = (i: Ion, n: number) => (n === 1 ? i.formula : i.poly ? `(${i.formula})${subDigits(n)}` : `${i.formula}${subDigits(n)}`);
  return { formula: part(cat, nCat) + part(an, nAn), nCat, nAn, name: `${cat.name} ${an.name}` };
}

/** The ionic compound a cluster of ion tiles makes, or null (one cation + one anion species, exact lowest-terms counts). */
export function compoundFor(tokens: Token[]): { formula: string; name: string; cat: Ion; an: Ion } | null {
  const c = countKeys(tokens);
  const keys = Object.keys(c);
  if (keys.length !== 2) return null;
  const ions = keys.map((k) => IONS.find((i) => i.id === k));
  if (ions.some((i) => !i)) return null;
  const cat = ions.find((i) => i!.charge > 0);
  const an = ions.find((i) => i!.charge < 0);
  if (!cat || !an) return null;
  const f = ionicFormula(cat, an);
  if (c[cat.id] !== f.nCat || c[an.id] !== f.nAn) return null;
  if (NOT_A_COMPOUND.includes(f.formula)) return null;
  return { formula: f.formula, name: f.name, cat, an };
}

export const ION_CHARGE_SETS_EARLY = [[1, -1, 2], [1, -1, -2], [2, -2, -1]];
export const ION_CHARGE_SETS_LATE = [[1, -1, 2, -2], [2, -2, 3, -3]];

function ionCharges(level: number): number[] {
  return level <= 3 ? ION_CHARGE_SETS_EARLY[level - 1] : ION_CHARGE_SETS_LATE[(level - 4) % ION_CHARGE_SETS_LATE.length];
}

function ionKinds(level: number): KindDef[] {
  return ionCharges(level).map((ch) => {
    const ions = IONS.filter((i) => i.charge === ch);
    return {
      id: chargeLabel(ch),
      anchor: chargeLabel(ch),
      legend: `${chargeLabel(ch)} ions`,
      say: `${Math.abs(ch)} ${ch > 0 ? "plus" : "minus"} ions`,
      reps: ions.map((i) => ({ label: i.label, say: `${i.name} ion`, key: i.id })),
    };
  });
}

/* ================================================================== 6–8: integers */

/** A random integer expression worth v (label ≤ 6 characters). Grade 7+ also uses × and ÷. */
export function integerExpr(v: number, g: number, rng: Rng): { label: string; say: string; key: string } {
  for (let tries = 0; tries < 60; tries++) {
    const form = int(rng, 0, g >= 7 ? 4 : 2);
    if (form === 0) {
      // a + b, b positive
      const b = int(rng, 1, 9);
      const a = v - b;
      if (a === 0 || a < -9 || a > 9) continue;
      return { label: `${nstr(a)}+${b}`, say: `${nsay(a)} plus ${b}`, key: `${a}+${b}` };
    }
    if (form === 1) {
      // a − b, b positive
      const b = int(rng, 1, 9);
      const a = v + b;
      if (a === 0 || a < -9 || a > 9) continue;
      return { label: `${nstr(a)}${MINUS}${b}`, say: `${nsay(a)} minus ${b}`, key: `${a}-${b}` };
    }
    if (form === 2) {
      // a + (−b)
      const b = int(rng, 1, 9);
      const a = v + b;
      if (a < 1 || a > 9) continue;
      return { label: `${a}+(${MINUS}${b})`, say: `${a} plus negative ${b}`, key: `${a}+(-${b})` };
    }
    if (form === 3) {
      // −a × b  or a × −b written as "−a×b"
      const divs = [2, 3, 4].filter((d) => v % d === 0 && Math.abs(v / d) <= 9 && v / d !== 0);
      if (!divs.length) continue;
      const d = pick(rng, divs);
      const q = v / d;
      // v = (−d) × (−q)
      if (-q < -9 || -q > 9) continue;
      return { label: `${MINUS}${d}×${nstr(-q)}`, say: `negative ${d} times ${nsay(-q)}`, key: `-${d}*${-q}` };
    }
    // a ÷ b with negatives: a = v × b
    const b = pick(rng, [-2, -3, 2, 3]);
    const a = v * b;
    if (Math.abs(a) > 30 || (a > 0 && b > 0)) continue;
    const label = `${nstr(a)}÷${b < 0 ? `(${nstr(b)})` : b}`;
    if (label.length > 7) continue;
    return { label, say: `${nsay(a)} divided by ${nsay(b)}`, key: `${a}/${b}` };
  }
  return { label: nstr(v), say: nsay(v), key: String(v) };
}

/** A kid-friendly explanation of one integer expression. */
export function integerSteps(label: string, v: number): string {
  const p = plain(label);
  let m: RegExpMatchArray | null;
  if ((m = p.match(/^(-?\d+)\+(\d+)$/))) return `Start at ${nstr(Number(m[1]))} on the number line and move ${m[2]} to the right: you land on ${nstr(v)}.`;
  if ((m = p.match(/^(-?\d+)-(\d+)$/))) return `Start at ${nstr(Number(m[1]))} on the number line and move ${m[2]} to the left: you land on ${nstr(v)}.`;
  if ((m = p.match(/^(\d+)\+\(-(\d+)\)$/))) return `Adding ${MINUS}${m[2]} is the same as subtracting ${m[2]}: ${m[1]} ${MINUS} ${m[2]} = ${nstr(v)}.`;
  return `${label} = ${nstr(v)}. A negative and a positive multiply (or divide) to a negative; two negatives make a positive.`;
}

/** A step-by-step explanation of one equation. */
export function equationSteps(label: string, v: number): string {
  const p = plain(label).replace(/÷/g, "/");
  const [lhs, rhsRaw] = p.split("=");
  const c = Number(rhsRaw);
  let m: RegExpMatchArray | null;
  if ((m = lhs.match(/^x\+(\d+)$/))) return `Subtract ${m[1]} from both sides: x = ${nstr(c)} ${MINUS} ${m[1]} = ${nstr(v)}.`;
  if ((m = lhs.match(/^x-(\d+)$/))) return `Add ${m[1]} to both sides: x = ${nstr(c)} + ${m[1]} = ${nstr(v)}.`;
  if ((m = lhs.match(/^x\/(\d+)$/))) return `Multiply both sides by ${m[1]}: x = ${nstr(c)} × ${m[1]} = ${nstr(v)}.`;
  if ((m = lhs.match(/^(-?\d+)x$/))) return `Divide both sides by ${nstr(Number(m[1]))}: x = ${nstr(c)} ÷ ${Number(m[1]) < 0 ? `(${nstr(Number(m[1]))})` : m[1]} = ${nstr(v)}.`;
  if ((m = lhs.match(/^(\d+)x\+(\d+)$/))) return `Subtract ${m[2]} from both sides: ${m[1]}x = ${nstr(c - Number(m[2]))}. Then divide by ${m[1]}: x = ${nstr(v)}.`;
  if ((m = lhs.match(/^(\d+)x-(\d+)$/))) return `Add ${m[2]} to both sides: ${m[1]}x = ${nstr(c + Number(m[2]))}. Then divide by ${m[1]}: x = ${nstr(v)}.`;
  return `Undo each step with the inverse operation to get x alone: x = ${nstr(v)}.`;
}

/** Evaluates the labels integerExpr and equationRep make (used by npm test). */
export function evalInt(label: string): number {
  const s = plain(label).replace(/×/g, "*").replace(/÷/g, "/");
  if (!/^[-+*/()\d]+$/.test(s)) throw new Error(`not an integer expression: ${label}`);
  // eslint-disable-next-line no-new-func
  return Function(`"use strict"; return (${s});`)() as number;
}

function integerKinds(n: number, rng: Rng, g: number): KindDef[] {
  let vals: number[] = [];
  for (let i = 0; i < 50; i++) {
    vals = sample(rng, [-9, -8, -7, -6, -5, -4, -3, -2, -1, 1, 2, 3, 4, 5, 6, 7, 8, 9], n);
    if (vals.some((v) => v < 0) && vals.some((v) => v > 0)) break;
  }
  return vals
    .sort((a, b) => a - b)
    .map((v) => {
      const reps = [{ label: nstr(v), say: nsay(v), key: String(v) }];
      for (let i = 0; i < 12; i++) {
        const r = integerExpr(v, g, rng);
        if (!reps.some((x) => x.label === r.label)) reps.push(r);
      }
      return { id: String(v), anchor: nstr(v), legend: nstr(v), say: nsay(v), reps };
    });
}

/* ================================================================== 6–12: equations */

/** A random equation whose solution is v. Grades 6–8: one step; 9–12: two steps. */
export function equationRep(v: number, g: number, rng: Rng): { label: string; say: string; key: string } {
  for (let tries = 0; tries < 80; tries++) {
    let label = "";
    let say = "";
    if (g <= 8) {
      const form = int(rng, 0, 3);
      if (form === 0) {
        const a = int(rng, 1, 9);
        label = `x+${a}=${v + a}`;
        say = `x plus ${a} equals ${v + a}`;
      } else if (form === 1) {
        const a = int(rng, 1, 9);
        if (v - a < 0) continue;
        label = `x${MINUS}${a}=${v - a}`;
        say = `x minus ${a} equals ${v - a}`;
      } else if (form === 2) {
        const a = int(rng, 2, 9);
        label = `${a}x=${a * v}`;
        say = `${a} x equals ${a * v}`;
      } else {
        const ds = [2, 3, 4, 5].filter((d) => v % d === 0);
        if (!ds.length) continue;
        const d = pick(rng, ds);
        label = `x÷${d}=${v / d}`;
        say = `x divided by ${d} equals ${v / d}`;
      }
      if (label.length > 6) continue;
    } else {
      const form = int(rng, 0, 2);
      const a = int(rng, 2, 5);
      if (form === 0) {
        const b = int(rng, 1, 9);
        const c = a * v + b;
        label = `${a}x+${b}=${nstr(c)}`;
        say = `${a} x plus ${b} equals ${nsay(c)}`;
      } else if (form === 1) {
        const b = int(rng, 1, 9);
        const c = a * v - b;
        label = `${a}x${MINUS}${b}=${nstr(c)}`;
        say = `${a} x minus ${b} equals ${nsay(c)}`;
      } else {
        const c = -a * v;
        label = `${MINUS}${a}x=${nstr(c)}`;
        say = `negative ${a} x equals ${nsay(c)}`;
      }
      if (label.length > 7) continue;
    }
    return { label, say, key: plain(label) };
  }
  return { label: `x=${nstr(v)}`, say: `x equals ${nsay(v)}`, key: `x=${v}` };
}

/** Solves the one-variable linear equations equationRep makes (used by npm test). */
export function solveEquation(label: string): number {
  const s = plain(label).replace(/÷/g, "/");
  const [lhs, rhs] = s.split("=");
  const r = Number(rhs);
  let m: RegExpMatchArray | null;
  if ((m = lhs.match(/^x$/))) return r;
  if ((m = lhs.match(/^x\+(\d+)$/))) return r - Number(m[1]);
  if ((m = lhs.match(/^x-(\d+)$/))) return r + Number(m[1]);
  if ((m = lhs.match(/^x\/(\d+)$/))) return r * Number(m[1]);
  if ((m = lhs.match(/^(-?\d+)x$/))) return r / Number(m[1]);
  if ((m = lhs.match(/^(-?\d+)x\+(\d+)$/))) return (r - Number(m[2])) / Number(m[1]);
  if ((m = lhs.match(/^(-?\d+)x-(\d+)$/))) return (r + Number(m[2])) / Number(m[1]);
  throw new Error(`can't solve ${label}`);
}

function equationKinds(n: number, rng: Rng, g: number): KindDef[] {
  const pool = g <= 8 ? [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12] : [-6, -5, -4, -3, -2, -1, 1, 2, 3, 4, 5, 6, 7, 8, 9];
  return sample(rng, pool, n)
    .sort((a, b) => a - b)
    .map((v) => {
      const anchor = `x=${nstr(v)}`;
      const reps = [{ label: anchor, say: `x equals ${nsay(v)}`, key: `x=${v}` }];
      for (let i = 0; i < 14; i++) {
        const r = equationRep(v, g, rng);
        if (!reps.some((x) => x.label === r.label)) reps.push(r);
      }
      return { id: anchor, anchor, legend: anchor, say: `x equals ${nsay(v)}`, reps };
    });
}

/* ================================================================== building a level */

export const SET_INFO: Record<SetId, { subject: Subject; topic: TopicId; title: string }> = {
  shapes: { subject: "science", topic: "physical", title: "Color & shape lab" },
  bonds: { subject: "math", topic: "numbers", title: "Number bond lab" },
  facts: { subject: "math", topic: "numbers", title: "Fact lab" },
  matter: { subject: "science", topic: "physical", title: "States of matter lab" },
  elements: { subject: "science", topic: "physical", title: "Element lab" },
  integers: { subject: "math", topic: "numbers", title: "Integer lab" },
  equations: { subject: "math", topic: "algebra", title: "Equation lab" },
  ions: { subject: "science", topic: "physical", title: "Ion lab" },
};

/** Which sets each grade band can play. */
export const BAND_SETS: Record<Band, SetId[]> = {
  k2: ["shapes", "bonds"],
  "35": ["facts", "matter"],
  "68": ["elements", "integers", "equations"],
  "912": ["ions", "equations"],
};

export function kindCount(set: SetId, level: number): number {
  if (set === "matter") return 3;
  if (set === "ions") return ionCharges(level).length;
  if (set === "elements") return level <= 3 ? 3 : 4;
  return level <= 3 ? 3 : 4;
}

function tokenFrom(kind: number, r: { label: string; say: string; key: string; num?: number }): Token {
  const t: Token = { kind, key: r.key, label: r.label, say: r.say };
  if (r.num !== undefined) t.num = r.num;
  return t;
}

export function makeLevelSet(id: SetId, grade: Grade, level: number, rng: Rng): LevelSet {
  const g = gradeN(grade);
  const info = SET_INFO[id];
  const n = kindCount(id, level);
  const base = { id, grade, level, subject: info.subject, topic: info.topic, title: info.title };
  const noBonus = { bonus: null, bonusSizes: [] as number[], bonusCheck: () => null };

  switch (id) {
    case "shapes":
    case "bonds": {
      const numbers = id === "bonds";
      const kinds = shapeKinds(n, numbers);
      const tok = (k: number, r: Rng) => (numbers ? tokenFrom(k, kinds[k].reps[int(r, 0, 8)]) : tokenFrom(k, kinds[k].reps[0]));
      return {
        ...base,
        rule: numbers
          ? "Line up 4 of the same color and shape. A number touching its partner to make 10 (like 3 and 7) pops too!"
          : "Line up 4 of the same color and shape to pop the germs.",
        kinds,
        colored: true,
        germToken: tok,
        halfToken: tok,
        ...(numbers
          ? {
              bonus: "bond10" as const,
              bonusSizes: [2],
              bonusCheck: (ts: Token[]) => {
                if (ts.length !== 2 || ts[0].num === undefined || ts[1].num === undefined) return null;
                const [a, b] = [ts[0].num, ts[1].num].sort((x, y) => x - y);
                if (a + b !== 10) return null;
                return { kind: "bond10" as const, title: `${a} + ${b} = 10!`, detail: `${a} and ${b} make 10. That's a number bond!`, say: `${a} and ${b} make 10!` };
              },
            }
          : noBonus),
      };
    }
    case "facts": {
      const kinds = factKinds(g, level, n, rng);
      return {
        ...base,
        rule: "A fact matches its answer: 3×4, 2×6 and 12 are all the same kind. Read each capsule before it lands!",
        kinds,
        colored: false,
        germToken: (k) => tokenFrom(k, kinds[k].reps[0]),
        halfToken: (k, r) => tokenFrom(k, r() < 0.25 ? kinds[k].reps[0] : pick(r, kinds[k].reps.slice(1))),
        ...noBonus,
      };
    }
    case "matter": {
      const kinds = matterKinds();
      return {
        ...base,
        rule: "Match things in the same state of matter: milk and juice are both LIQUID. Read each capsule before it lands!",
        kinds,
        colored: false,
        germToken: (k) => tokenFrom(k, kinds[k].reps[0]),
        halfToken: (k, r) => tokenFrom(k, pick(r, kinds[k].reps.slice(1))),
        ...noBonus,
      };
    }
    case "elements": {
      const kinds = elementKinds(level);
      return {
        ...base,
        rule: "A symbol matches its element's name: O and oxygen are the same kind. Atoms touching in the right numbers (H, H, O) make a molecule bonus!",
        kinds,
        colored: false,
        germToken: (k) => tokenFrom(k, kinds[k].reps[0]),
        halfToken: (k, r) => tokenFrom(k, pick(r, kinds[k].reps)),
        bonus: "molecule",
        bonusSizes: [2, 3, 4],
        bonusCheck: (ts) => {
          const r = recipeFor(ts);
          if (!r) return null;
          return {
            kind: "molecule",
            title: `${r.formula}!`,
            detail: `${atomList(r.atoms)} → ${r.formula}, ${r.name}. You built a ${r.type}!`,
            say: `You made ${r.name}!`,
            formula: r.formula,
            name: r.name,
          };
        },
      };
    }
    case "integers": {
      const kinds = integerKinds(n, rng, g);
      return {
        ...base,
        rule: "An expression matches its value: −5+2 and −3 are the same kind. Read each capsule before it lands!",
        kinds,
        colored: false,
        germToken: (k) => tokenFrom(k, kinds[k].reps[0]),
        halfToken: (k, r) => (r() < 0.2 ? tokenFrom(k, kinds[k].reps[0]) : tokenFrom(k, integerExpr(Number(kinds[k].id), g, r))),
        ...noBonus,
      };
    }
    case "equations": {
      const kinds = equationKinds(n, rng, g);
      return {
        ...base,
        rule: "An equation matches its solution: 2x=8 and x=4 are the same kind. Solve each capsule before it lands!",
        kinds,
        colored: false,
        germToken: (k) => tokenFrom(k, kinds[k].reps[0]),
        halfToken: (k, r) => {
          const v = Number(plain(kinds[k].id).slice(2));
          return r() < 0.15 ? tokenFrom(k, kinds[k].reps[0]) : tokenFrom(k, equationRep(v, g, r));
        },
        ...noBonus,
      };
    }
    case "ions": {
      const kinds = ionKinds(level);
      const tok = (k: number, r: Rng) => tokenFrom(k, pick(r, kinds[k].reps));
      return {
        ...base,
        rule: "Ions with the same charge match: Na⁺ and K⁺ are both 1+. Ions touching with a net charge of zero (Na⁺ + Cl⁻) make a compound bonus!",
        kinds,
        colored: false,
        germToken: tok,
        halfToken: tok,
        bonus: "ionic",
        bonusSizes: [2, 3],
        bonusCheck: (ts) => {
          const c = compoundFor(ts);
          if (!c) return null;
          const f = ionicFormula(c.cat, c.an);
          const parts = `${f.nCat > 1 ? `${f.nCat} ` : ""}${c.cat.label} + ${f.nAn > 1 ? `${f.nAn} ` : ""}${c.an.label}`;
          return {
            kind: "ionic",
            title: `${c.formula}!`,
            detail: `${parts} → ${c.formula} (${c.name}). The charges add up to zero!`,
            say: `You made ${c.name}!`,
            formula: c.formula,
            name: c.name,
            ions: [c.cat.id, c.an.id],
          };
        },
      };
    }
  }
}

/* ================================================================== Lab Quiz (between levels) */

/** What the player matched this level, so the quiz asks about it. */
export interface MatchLog {
  tokens: Token[];
  bonuses: BonusInfo[];
}

export interface LabQuestion extends Question {
  /** Which set it came from (for the report). */
  set: SetId;
}

/** Correct choice first → shuffled; returns choices + answer index. */
function deal(rng: Rng, correct: string, wrong: string[]): { choices: [string, string, string, string]; answer: number } {
  const uniq: string[] = [];
  for (const w of wrong) if (w !== correct && !uniq.includes(w)) uniq.push(w);
  if (uniq.length < 3) throw new Error(`not enough distractors for ${correct}`);
  const all = shuffle(rng, [correct, ...uniq.slice(0, 3)]);
  return { choices: all as [string, string, string, string], answer: all.indexOf(correct) };
}

let quizSeq = 0;
function q(
  set: SetId,
  grade: Grade,
  subject: Subject,
  standard: string,
  skill: string,
  prompt: string,
  dealt: { choices: [string, string, string, string]; answer: number },
  explanation: string,
): LabQuestion {
  quizSeq++;
  return { id: `lc-${set}-${grade}-${quizSeq}`, set, subject, grade, standard, skill, prompt, ...dealt, explanation };
}

const bondStd = (g: number) => (g === 0 ? "NC.K.OA.4" : g === 1 ? "NC.1.OA.6" : "NC.2.OA.2");
const shapeStd = (g: number) => (g === 0 ? "NC.K.G.4" : g === 1 ? "NC.1.G.1" : "NC.2.G.1");

/** Balancing mini-challenges for grades 9–12: the blank's coefficient is `answer` (all checked by npm test). */
export interface BalanceItem {
  /** Reactants and products: [coefficient, formula, atoms]. The blank is `blank` (index across both sides). */
  left: [number, string, Record<string, number>][];
  right: [number, string, Record<string, number>][];
  blank: number;
}

export const BALANCING: BalanceItem[] = [
  { left: [[2, "H₂", { H: 2 }], [1, "O₂", { O: 2 }]], right: [[2, "H₂O", { H: 2, O: 1 }]], blank: 0 },
  { left: [[1, "N₂", { N: 2 }], [3, "H₂", { H: 2 }]], right: [[2, "NH₃", { N: 1, H: 3 }]], blank: 1 },
  { left: [[2, "Na", { Na: 1 }], [1, "Cl₂", { Cl: 2 }]], right: [[2, "NaCl", { Na: 1, Cl: 1 }]], blank: 2 },
  { left: [[1, "CH₄", { C: 1, H: 4 }], [2, "O₂", { O: 2 }]], right: [[1, "CO₂", { C: 1, O: 2 }], [2, "H₂O", { H: 2, O: 1 }]], blank: 1 },
  { left: [[2, "Mg", { Mg: 1 }], [1, "O₂", { O: 2 }]], right: [[2, "MgO", { Mg: 1, O: 1 }]], blank: 0 },
  { left: [[4, "Fe", { Fe: 1 }], [3, "O₂", { O: 2 }]], right: [[2, "Fe₂O₃", { Fe: 2, O: 3 }]], blank: 1 },
  { left: [[2, "Al", { Al: 1 }], [6, "HCl", { H: 1, Cl: 1 }]], right: [[2, "AlCl₃", { Al: 1, Cl: 3 }], [3, "H₂", { H: 2 }]], blank: 1 },
  { left: [[1, "C₃H₈", { C: 3, H: 8 }], [5, "O₂", { O: 2 }]], right: [[3, "CO₂", { C: 1, O: 2 }], [4, "H₂O", { H: 2, O: 1 }]], blank: 1 },
  { left: [[2, "KClO₃", { K: 1, Cl: 1, O: 3 }]], right: [[2, "KCl", { K: 1, Cl: 1 }], [3, "O₂", { O: 2 }]], blank: 0 },
  { left: [[1, "Zn", { Zn: 1 }], [2, "HCl", { H: 1, Cl: 1 }]], right: [[1, "ZnCl₂", { Zn: 1, Cl: 2 }], [1, "H₂", { H: 2 }]], blank: 1 },
  { left: [[1, "CaCO₃", { Ca: 1, C: 1, O: 3 }], [2, "HCl", { H: 1, Cl: 1 }]], right: [[1, "CaCl₂", { Ca: 1, Cl: 2 }], [1, "H₂O", { H: 2, O: 1 }], [1, "CO₂", { C: 1, O: 2 }]], blank: 1 },
];

/** "_H₂ + O₂ → 2H₂O" with the blank shown as "__". */
export function balanceText(b: BalanceItem): string {
  const terms = [...b.left, ...b.right].map(([n, f], i) => (i === b.blank ? `__${f}` : n === 1 ? f : `${n}${f}`));
  const l = terms.slice(0, b.left.length).join(" + ");
  const r = terms.slice(b.left.length).join(" + ");
  return `${l} → ${r}`;
}

export function balanceAnswer(b: BalanceItem): number {
  return [...b.left, ...b.right][b.blank][0];
}

/** Atom counts on each side (both sides must match). */
export function sideAtoms(side: [number, string, Record<string, number>][]): Record<string, number> {
  const m: Record<string, number> = {};
  for (const [n, , atoms] of side) for (const [k, c] of Object.entries(atoms)) m[k] = (m[k] ?? 0) + n * c;
  return m;
}

function formulaVariants(cat: Ion, an: Ion, nCat: number, nAn: number): string[] {
  const part = (i: Ion, n: number) => (n === 1 ? i.formula : i.poly ? `(${i.formula})${subDigits(n)}` : `${i.formula}${subDigits(n)}`);
  const pairs: [number, number][] = [[1, 1], [2, 1], [1, 2], [2, 3], [3, 2], [1, 3], [3, 1]];
  return pairs.filter(([a, b]) => !(a === nCat && b === nAn)).map(([a, b]) => part(cat, a) + part(an, b));
}

/**
 * The Lab Quiz after a level: one 4-choice question about what the player matched.
 * Grades 9–12 science: every even level is a balancing mini-challenge.
 */
export function makeQuiz(set: LevelSet, rng: Rng, log: MatchLog): LabQuestion {
  const grade = set.grade;
  const g = gradeN(grade);
  const kind = (log.tokens.length ? pick(rng, log.tokens).kind : int(rng, 0, set.kinds.length - 1)) % set.kinds.length;
  const kd = set.kinds[kind];
  const subj = set.subject;

  switch (set.id) {
    case "shapes": {
      const s = kd.shape ?? "circle";
      const r = rng();
      if (r < 0.5) {
        const sides: Record<ShapeId, { n: number; word: string; ex: string }> = {
          triangle: { n: 3, word: "sides", ex: "A triangle has 3 straight sides and 3 corners." },
          square: { n: 4, word: "sides", ex: "A square has 4 sides, all the same length, and 4 corners." },
          circle: { n: 0, word: "corners", ex: "A circle is round. It has no corners and no straight sides." },
          star: { n: 5, word: "points", ex: "Our lab stars have 5 points." },
        };
        const it = sides[s];
        const nums = ["0", "3", "4", "5", "6"].filter((x) => x !== String(it.n));
        return q(
          "shapes", grade, "math", shapeStd(g), "Shapes",
          `How many ${it.word} does a ${s} have?`,
          deal(rng, String(it.n), shuffle(rng, nums)),
          it.ex,
        );
      }
      const props = [
        { ask: "COLOR", right: pick(rng, ["red", "blue", "yellow", "green"]), wrong: ["round", "big", "soft", "square", "tall"] },
        { ask: "SHAPE", right: pick(rng, ["circle", "square", "triangle"]), wrong: ["blue", "heavy", "smooth", "red", "loud"] },
      ];
      const p = pick(rng, props);
      return q(
        "shapes", grade, "science", "PS.K.1.1", "Properties: color and shape",
        `Which word tells a ${p.ask}?`,
        deal(rng, p.right, shuffle(rng, p.wrong)),
        p.ask === "COLOR"
          ? `${p.right[0].toUpperCase()}${p.right.slice(1)} is a color. Color and shape are properties: ways we sort things.`
          : `A ${p.right} is a shape. Shape and color are properties: ways we sort things, like you sorted the germs.`,
      );
    }
    case "bonds": {
      const bonded = log.bonuses.filter((b) => b.kind === "bond10");
      const nums = log.tokens.map((t) => t.num).filter((x): x is number => x !== undefined);
      const a = bonded.length ? Number(pick(rng, bonded).title.split(" ")[0]) : nums.length ? pick(rng, nums) : int(rng, 1, 9);
      const b = 10 - a;
      const wrong = [b + 1, b - 1, a, b + 2, 10 + a].filter((x) => x >= 0 && x !== b).map(String);
      return q(
        "bonds", grade, "math", bondStd(g), "Make 10",
        `What number goes with ${a} to make 10?`,
        deal(rng, String(b), wrong),
        `${a} + ${b} = 10. ${a} and ${b} are a number bond for 10!`,
      );
    }
    case "facts": {
      const v = Number(kd.id);
      const facts = kd.reps.filter((r) => r.label.includes("×"));
      const f = pick(rng, facts);
      const [a, b] = f.label.split("×").map(Number);
      if (rng() < 0.5) {
        const others = set.kinds.filter((k) => k !== kd).flatMap((k) => k.reps.filter((r) => r.label.includes("×")).map((r) => r.label));
        const near = [`${a}×${b + 1}`, `${a + 1}×${b}`, `${a}+${b}`, `${a}×${Math.max(1, b - 1)}`];
        return q(
          "facts", grade, subj, "NC.3.OA.7", "Multiplication facts",
          `Which one equals ${v}?`,
          deal(rng, f.label, shuffle(rng, [...shuffle(rng, others).slice(0, 2), ...near])),
          `${f.label} = ${v}: ${a} groups of ${b} make ${v}.`,
        );
      }
      const wrong = [a + b, v + a, v - b, v + 1, v - 1].filter((x) => x > 0 && x !== v).map(String);
      return q(
        "facts", grade, subj, "NC.3.OA.7", "Multiplication facts",
        `${f.label} = ?`,
        deal(rng, String(v), wrong),
        `${a} groups of ${b} make ${v}, so ${f.label} = ${v}.`,
      );
    }
    case "matter": {
      const m = MATTER[kind];
      const right = pick(rng, m.examples);
      const otherStates = MATTER.filter((x) => x !== m);
      const wrong = shuffle(rng, otherStates.flatMap((x) => x.examples));
      const why: Record<string, string> = {
        SOLID: "keeps its own shape",
        LIQUID: "flows and takes the shape of its container",
        GAS: "spreads out to fill any container",
      };
      return q(
        "matter", grade, subj, "PS.3.1.2", "States of matter",
        `Which one is a ${m.state.toLowerCase()}?`,
        deal(rng, right, wrong),
        `${right[0].toUpperCase()}${right.slice(1)}${right === "vapor" ? " (water vapor)" : ""} is a ${m.state.toLowerCase()}: a ${m.state.toLowerCase()} ${why[m.state]}.`,
      );
    }
    case "elements": {
      const made = log.bonuses.filter((b) => b.kind === "molecule");
      const r0 = rng();
      if (made.length && r0 < 0.4) {
        const chosen = pick(rng, made).formula;
        const rec = RECIPES.find((r) => r.formula === chosen)!;
        const desc = Object.entries(rec.atoms).map(([k, n]) => `${n} ${k}`).join(" and ");
        return q(
          "elements", grade, subj, "PS.8.1", "Elements and compounds",
          `Which formula has ${desc}?`,
          deal(rng, rec.formula, shuffle(rng, RECIPES.filter((r) => r !== rec).map((r) => r.formula))),
          `${rec.formula} (${rec.name}) has ${desc}. The small numbers count atoms; no number means 1.`,
        );
      }
      const e = element(kd.id);
      const similar = (s: string) => ELEMENTS.filter((x) => x.sym !== e.sym && (x.sym[0] === s[0] || x.name[0] === e.name[0]));
      const rest = shuffle(rng, ELEMENTS.filter((x) => x.sym !== e.sym));
      if (r0 < 0.7) {
        const pool = [...shuffle(rng, similar(e.sym)), ...rest].map((x) => x.sym);
        return q(
          "elements", grade, subj, "PS.8.1", "Element symbols",
          `What is the symbol for ${e.name}?`,
          deal(rng, e.sym, pool),
          `${e.name[0].toUpperCase()}${e.name.slice(1)} is ${e.sym} (atomic number ${e.z}).${e.sym[0] !== e.name[0].toUpperCase() ? " Its symbol comes from its Latin name." : ""}`,
        );
      }
      const pool = [...shuffle(rng, similar(e.sym)), ...rest].map((x) => x.name);
      return q(
        "elements", grade, subj, "PS.8.1", "Element symbols",
        `${e.sym} is the symbol for which element?`,
        deal(rng, e.name, pool),
        `${e.sym} stands for ${e.name}, element number ${e.z} on the periodic table.`,
      );
    }
    case "integers": {
      const v = Number(kd.id);
      const reps = kd.reps.slice(1);
      const r = reps.length ? pick(rng, reps) : integerExpr(v, g, rng);
      const mul = /[×÷]/.test(r.label);
      const wrong = [-v, v + 1, v - 1, v + 2, v - 2].filter((x) => x !== v).map(nstr);
      return q(
        "integers", grade, subj, mul ? "NC.7.NS.2" : "NC.7.NS.1", mul ? "Multiply and divide integers" : "Add and subtract integers",
        `${r.label} = ?`,
        deal(rng, nstr(v), wrong),
        integerSteps(r.label, v),
      );
    }
    case "equations": {
      const v = Number(plain(kd.id).slice(2));
      const reps = kd.reps.slice(1);
      const r = reps.length ? pick(rng, reps) : equationRep(v, g, rng);
      const wrong = [-v, v + 1, v - 1, v * 2, v + 2].filter((x) => x !== v).map((x) => `x = ${nstr(x)}`);
      return q(
        "equations", grade, subj, g <= 8 ? "NC.6.EE.7" : "NC.M1.A-REI.3", g <= 8 ? "One-step equations" : "Solve linear equations",
        `Solve: ${r.label}`,
        deal(rng, `x = ${nstr(v)}`, wrong),
        equationSteps(r.label, v),
      );
    }
    case "ions": {
      if (set.level % 2 === 0) {
        const b = pick(rng, BALANCING);
        const ans = balanceAnswer(b);
        const wrong = [1, 2, 3, 4, 5, 6].filter((x) => x !== ans).map(String);
        return q(
          "ions", grade, subj, "PS.Chm.4.2", "Balancing equations",
          `Balance it: ${balanceText(b)}. What number goes in the blank?`,
          deal(rng, String(ans), shuffle(rng, wrong)),
          `With ${ans} there, every kind of atom has the same count on both sides: ${Object.entries(sideAtoms(b.left)).map(([k, n]) => `${n} ${k}`).join(", ")}. Atoms are never created or destroyed.`,
        );
      }
      const made = log.bonuses.filter((b) => b.kind === "ionic");
      if (made.length && rng() < 0.6) {
        const m = pick(rng, made);
        const cat = ionById(m.ions![0]);
        const an = ionById(m.ions![1]);
        const f = ionicFormula(cat, an);
        return q(
          "ions", grade, subj, "PS.Chm.3.1", "Ionic compounds",
          `${cat.label} and ${an.label} ions make which compound?`,
          deal(rng, f.formula, shuffle(rng, formulaVariants(cat, an, f.nCat, f.nAn))),
          `${f.formula} (${f.name}): ${f.nCat} × (${chargeLabel(cat.charge)}) + ${f.nAn} × (${chargeLabel(an.charge)}) = 0. Ionic formulas balance the charges.`,
        );
      }
      const io = ionById(pick(rng, kd.reps).key);
      const wrong = [1, 2, 3, -1, -2, -3].filter((c) => c !== io.charge).map(chargeLabel);
      return q(
        "ions", grade, subj, "PS.Chm.3.1", "Ion charges",
        `What is the charge on the ${io.name} ion (${io.formula})?`,
        deal(rng, chargeLabel(io.charge), shuffle(rng, wrong)),
        io.poly
          ? `${io.label}: ${io.name} is a polyatomic ion, a group of atoms that carries a ${chargeLabel(io.charge)} charge together.`
          : io.charge > 0
            ? `${io.label}: the atom loses ${io.charge} electron${io.charge > 1 ? "s" : ""}, so it has a ${chargeLabel(io.charge)} charge.`
            : `${io.label}: the atom gains ${-io.charge} electron${io.charge < -1 ? "s" : ""}, so it has a ${chargeLabel(io.charge)} charge.`,
      );
    }
  }
}
