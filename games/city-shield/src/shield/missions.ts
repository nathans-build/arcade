/*
 * City Shield's math: for each grade, the skills (NC standards), the TARGET for each wave
 * and the expression every falling missile carries. All values are exact (see value.ts).
 *
 * A wave is either
 *   - a MATCH round: "TARGET 24" — missiles whose value equals the target are live warheads,
 *     the rest are decoys that burn up harmlessly; or
 *   - a WRONG round: every missile carries a claim like "6×7=48" — the wrong ones are live.
 *
 * Most skills are "pools": every expression the skill can make is enumerated once, grouped by
 * exact value, and targets are chosen among values that have enough different expressions.
 * Decoys come from nearby values, and often from "traps" (expressions whose common mistake
 * gives the target, like 3+5×4 when the target is 32).
 */
import type { Grade } from "../kit/types";
import {
  MINUS,
  add,
  approx,
  div,
  eq,
  fmt,
  fmtDec,
  fmtInt,
  frac,
  int,
  mk,
  mul,
  pow,
  powLabel,
  root,
  splitSquare,
  sub,
  subNum,
  supNum,
  type Val,
} from "./value";

export type RoundMode = "match" | "wrong";

/** One missile's math. */
export interface MissileMath {
  label: string;
  /** True for a live warhead (equals the target / is a wrong claim). */
  danger: boolean;
  /** The correct fact, shown after the missile is dealt with ("12+5=17", "2x+3=11 → x=4"). */
  fact: string;
}

export interface Round {
  mode: RoundMode;
  key: string;
  standard: string;
  skill: string;
  /** Shown big in the HUD: "24", "x = 4", "4√2" (match rounds only). */
  targetText: string;
  /** Compact form for notes: "24", "x=4". */
  targetShort: string;
  /** Function definitions, e.g. "f(x)=2x+1  g(x)=x²−3". */
  context?: string;
  /** Read-aloud line for the wave. */
  say: string;
  /** Short instruction line. */
  hint: string;
  /** Next missile. `avoid` holds labels already on screen. */
  next(danger: boolean, avoid?: ReadonlySet<string>): MissileMath;
}

/* ------------------------------ randomness ------------------------------ */

export function ri(a: number, b: number): number {
  return a + Math.floor(Math.random() * (b - a + 1));
}
function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
function chance(p: number): boolean {
  return Math.random() < p;
}
const ns = fmtInt;
/** A number in parentheses when negative: 3×(−4). */
const pn = (v: number) => (v < 0 ? `(${ns(v)})` : String(v));
/** "+5" / "−5" for writing ax+b. */
const signed = (v: number) => (v < 0 ? `${MINUS}${-v}` : `+${v}`);
const coef = (a: number) => (a === 1 ? "" : a === -1 ? MINUS : ns(a));

/* ------------------------------ pools ------------------------------ */

interface Item {
  label: string;
  value: Val;
  form: string;
  /** What a common mistake gives instead. */
  slip?: Val;
}

const vkey = (v: Val) => `${v.n}/${v.d}r${v.r}`;

interface Setup {
  target: Val;
  targetText: string;
  targetShort: string;
  context?: string;
  /** Equation skills: the missile shows an equation, its "value" is the solution. */
  eq?: boolean;
  hit(avoid: ReadonlySet<string>): Item;
  miss(avoid: ReadonlySet<string>): Item;
  /** Any expression this skill can make (for WRONG-round claims). */
  any(avoid: ReadonlySet<string>): Item;
  show(v: Val): string;
  /** A believable wrong value for a claim about `it`. */
  wrongFor(it: Item): Val;
}

interface Skill {
  key: string;
  standard: string;
  skill: string;
  /** Can make WRONG-round claims. */
  claims: boolean;
  setup(level: number, ctx?: unknown): Setup;
  /** Per-round shared context (function definitions); fixed for a whole wave. */
  context?(level: number): unknown;
}

interface PoolSpec {
  key: string;
  standard: string;
  skill: string;
  claims?: boolean;
  /** Every expression for this level/context. */
  build(level: number, ctx: unknown): Item[];
  /** Is `v` a good target at this level? */
  targetOk?(v: Val, level: number): boolean;
  /** Distinct labels a target needs. */
  minHits?: number;
  show?(v: Val, ctx: unknown): string;
  /** Distance between values for choosing decoys (default: numeric difference). */
  dist?(a: Val, b: Val, ctx: unknown): number;
  /** Decoys are drawn from values within this distance. */
  near: number | ((t: Val) => number);
  context?(level: number): unknown;
  contextText?(ctx: unknown): string;
}

interface Pool {
  groups: Map<string, Item[]>;
  values: Map<string, Val>;
  /** Items grouped by the value of their slip. */
  traps: Map<string, Item[]>;
  items: Item[];
}

const poolCache = new Map<string, Pool>();

function makePool(spec: PoolSpec, level: number, ctx: unknown, cacheKey: string): Pool {
  const hit = poolCache.get(cacheKey);
  if (hit) return hit;
  const items = spec.build(level, ctx);
  const groups = new Map<string, Item[]>();
  const values = new Map<string, Val>();
  const traps = new Map<string, Item[]>();
  const seen = new Set<string>();
  for (const it of items) {
    if (seen.has(it.label)) continue;
    seen.add(it.label);
    const k = vkey(it.value);
    if (!groups.has(k)) {
      groups.set(k, []);
      values.set(k, it.value);
    }
    groups.get(k)!.push(it);
    if (it.slip && !eq(it.slip, it.value)) {
      const sk = vkey(it.slip);
      if (!traps.has(sk)) traps.set(sk, []);
      traps.get(sk)!.push(it);
    }
  }
  const pool = { groups, values, traps, items };
  if (poolCache.size > 60) poolCache.clear();
  poolCache.set(cacheKey, pool);
  return pool;
}

function fresh(list: readonly Item[], avoid: ReadonlySet<string>): Item {
  const ok = list.filter((i) => !avoid.has(i.label));
  return pick(ok.length ? ok : list);
}

/** A hit picks a form first, so rarer forms (÷, parentheses) show up as often as common ones. */
function byForm(list: readonly Item[], avoid: ReadonlySet<string>): Item {
  const ok = list.filter((i) => !avoid.has(i.label));
  const use = ok.length ? ok : list;
  const forms = [...new Set(use.map((i) => i.form))];
  const f = pick(forms);
  return pick(use.filter((i) => i.form === f));
}

function poolSkill(spec: PoolSpec): Skill {
  return {
    key: spec.key,
    standard: spec.standard,
    skill: spec.skill,
    claims: spec.claims ?? true,
    context: spec.context,
    setup(level, ctxIn) {
      const tier = Math.min(level, 4);
      const minHits = spec.minHits ?? 3;
      let ctx: unknown;
      let pool: Pool;
      let keys: string[];
      // A context (like f and g) that gives no target with enough expressions is drawn again.
      for (let attempt = 0; ; attempt++) {
        ctx = ctxIn ?? spec.context?.(level);
        pool = makePool(spec, tier, ctx, `${spec.key}|${tier}|${JSON.stringify(ctx ?? null)}`);
        const p = pool;
        keys = [...p.groups.keys()].filter((k) => p.groups.get(k)!.length >= minHits && (spec.targetOk?.(p.values.get(k)!, tier) ?? true));
        if (keys.length || ctxIn !== undefined || !spec.context || attempt >= 40) break;
      }
      const show = (v: Val) => (spec.show ? spec.show(v, ctx) : fmt(v));
      const dist = (a: Val, b: Val) => (spec.dist ? spec.dist(a, b, ctx) : Math.abs(approx(a) - approx(b)));
      if (keys.length === 0) keys = [...pool.groups.keys()].filter((k) => pool.groups.get(k)!.length >= 2);
      if (keys.length === 0) throw new Error(`no targets for ${spec.key}`);
      const tk = pick(keys);
      const target = pool.values.get(tk)!;
      const hits = pool.groups.get(tk)!;
      const nearMax = typeof spec.near === "function" ? spec.near(target) : spec.near;
      const nearKeys = [...pool.groups.keys()].filter((k) => k !== tk && dist(pool.values.get(k)!, target) <= nearMax);
      const farKeys = [...pool.groups.keys()].filter((k) => k !== tk);
      const trapList = (pool.traps.get(tk) ?? []).filter((i) => !eq(i.value, target));

      const nearValue = (v: Val): Val => {
        const cands = [...pool.values.values()].filter((w) => !eq(w, v) && dist(w, v) <= nearMax);
        return cands.length ? pick(cands) : add(v, int(1));
      };

      return {
        target,
        targetText: show(target),
        targetShort: show(target),
        context: ctx !== undefined && spec.contextText ? spec.contextText(ctx) : undefined,
        show,
        hit: (avoid) => byForm(hits, avoid),
        any: (avoid) => byForm(pool.items.filter((i) => spec.targetOk?.(i.value, tier) ?? true), avoid),
        miss: (avoid) => {
          if (trapList.length && chance(0.4)) {
            const t = trapList.filter((i) => !avoid.has(i.label));
            if (t.length) return pick(t);
          }
          // A nearby value first; if every nearby label is already on screen, any other value.
          for (const ks of [nearKeys, farKeys]) {
            const open = ks.filter((k) => pool.groups.get(k)!.some((i) => !avoid.has(i.label)));
            if (open.length) return fresh(pool.groups.get(pick(open))!, avoid);
          }
          return fresh(pool.groups.get(pick(farKeys))!, avoid);
        },
        wrongFor: (it) => (it.slip && !eq(it.slip, it.value) && chance(0.75) ? it.slip : nearValue(it.value)),
      };
    },
  };
}

/* ------------------------------ helpers for building pools ------------------------------ */

function range(a: number, b: number): number[] {
  const out: number[] = [];
  for (let i = a; i <= b; i++) out.push(i);
  return out;
}

function isqrt(n: number): number | null {
  const r = Math.round(Math.sqrt(n));
  return r * r === n ? r : null;
}

function gcdN(a: number, b: number): number {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) [a, b] = [b, a % b];
  return a;
}

const inRange = (lo: number, hi: number) => (v: Val) => v.r === 1 && v.d === 1 && v.n >= lo && v.n <= hi;

/* ============================== K-2 ============================== */

const K_ADD5 = poolSkill({
  key: "k-add5",
  standard: "NC.K.OA.5",
  skill: "Add and subtract within 5",
  build() {
    const out: Item[] = [];
    for (const a of range(0, 5))
      for (const b of range(0, 5)) {
        if (a + b <= 5 && (a > 0 || b > 0)) out.push({ label: `${a}+${b}`, value: int(a + b), form: "+", slip: int(a + b + (a + b < 5 ? 1 : -1)) });
        if (b <= a && a > 0) out.push({ label: `${a}−${b}`, value: int(a - b), form: "−", slip: int(a - b + (a - b < 5 ? 1 : -1)) });
      }
    return out;
  },
  targetOk: inRange(1, 5),
  near: 2,
});

const K_PAIRS10 = poolSkill({
  key: "k-pairs10",
  standard: "NC.K.OA.3",
  skill: "Number pairs that make a number (to 10)",
  build() {
    const out: Item[] = [];
    for (const a of range(1, 9))
      for (const b of range(1, 9))
        if (a + b <= 10) out.push({ label: `${a}+${b}`, value: int(a + b), form: "+", slip: int(a + b - 1) });
    return out;
  },
  targetOk: inRange(6, 10),
  near: 2,
});

const G1_ADD20 = poolSkill({
  key: "g1-add20",
  standard: "NC.1.OA.6",
  skill: "Add and subtract within 20",
  build(level) {
    const max = level <= 1 ? 15 : 20;
    const out: Item[] = [];
    for (const a of range(1, max))
      for (const b of range(1, max)) {
        if (a + b <= max && a + b >= 5) out.push({ label: `${a}+${b}`, value: int(a + b), form: "+", slip: int(a + b + 1) });
        if (b < a && a - b >= 2) out.push({ label: `${a}−${b}`, value: int(a - b), form: "−", slip: int(a - b + 1) });
      }
    return out;
  },
  targetOk: (v, level) => inRange(5, level <= 1 ? 15 : 20)(v),
  minHits: 4,
  near: 2,
});

const G1_TENS = poolSkill({
  key: "g1-tens",
  standard: "NC.1.NBT.4",
  skill: "Add within 100 (tens and ones)",
  build() {
    const out: Item[] = [];
    for (const a of range(11, 89)) {
      for (const k of range(1, 8)) {
        const s = a + 10 * k;
        // Mistake: adding the tens to the ones place (34+20 → 36).
        if (s <= 99) out.push({ label: `${a}+${10 * k}`, value: int(s), form: "+tens", slip: a % 10 + k <= 9 ? int(a + k) : undefined });
      }
      for (const d of range(2, 9)) {
        const s = a + d;
        // Mistake: forgetting to make a new ten (38+5 → 33), or adding to the tens (34+2 → 54).
        const slip = (a % 10) + d >= 10 ? int(s - 10) : a + 10 * d <= 99 ? int(a + 10 * d) : undefined;
        if (s <= 99) out.push({ label: `${a}+${d}`, value: int(s), form: "+ones", slip });
      }
    }
    return out;
  },
  targetOk: inRange(20, 99),
  near: 11,
});

const G2_ADD100 = poolSkill({
  key: "g2-add100",
  standard: "NC.2.NBT.5",
  skill: "Add and subtract within 100",
  build() {
    const out: Item[] = [];
    for (const a of range(10, 89))
      for (const b of range(3, 89)) {
        const s = a + b;
        if (s <= 99 && s >= 20 && b <= a + 10) {
          // Forgetting the carried ten.
          const carry = (a % 10) + (b % 10) >= 10;
          out.push({ label: `${a}+${b}`, value: int(s), form: "+", slip: int(carry ? s - 10 : s + 10) });
        }
        const d = a + b; // a − b written as d − b with d ≤ 99
        if (d <= 99 && d >= 20 && b >= 3) {
          const borrow = d % 10 < b % 10;
          // "Smaller from larger" in the ones place.
          const wrong = (Math.floor(d / 10) - Math.floor(b / 10)) * 10 + Math.abs((d % 10) - (b % 10));
          out.push({ label: `${d}−${b}`, value: int(a), form: "−", slip: int(borrow ? wrong : a + 10) });
        }
      }
    return out;
  },
  targetOk: inRange(20, 99),
  minHits: 6,
  near: 10,
});

const G2_EXPAND = poolSkill({
  key: "g2-expand",
  standard: "NC.2.NBT.3",
  skill: "Expanded form (hundreds, tens, ones)",
  minHits: 2,
  build() {
    const out: Item[] = [];
    for (const h of range(1, 9))
      for (const t of range(0, 9))
        for (const o of range(0, 9)) {
          const v = 100 * h + 10 * t + o;
          const slip = t !== o ? int(100 * h + 10 * o + t) : int(h < 9 ? v + 100 : v - 100);
          const parts = [`${h}00`, t ? `${t}0` : "", o ? `${o}` : ""].filter(Boolean);
          if (parts.length < 2) continue;
          out.push({ label: parts.join("+"), value: int(v), form: "hto", slip });
          if (parts.length === 3) {
            out.push({ label: [parts[1], parts[2], parts[0]].join("+"), value: int(v), form: "mixed", slip });
            out.push({ label: `${h}00+${10 * t + o}`, value: int(v), form: "h+to", slip });
            out.push({ label: `${100 * h + 10 * t}+${o}`, value: int(v), form: "ht+o", slip });
          }
        }
    return out;
  },
  targetOk: (v) => v.n % 10 !== 0 && Math.floor(v.n / 10) % 10 !== 0,
  near: 110,
});

/* ============================== 3-5 ============================== */

const G3_FACTS = poolSkill({
  key: "g3-facts",
  standard: "NC.3.OA.7",
  skill: "Multiplication and division facts",
  build(level) {
    const max = level <= 1 ? 9 : 10;
    const out: Item[] = [];
    for (const a of range(2, max))
      for (const b of range(2, max)) {
        out.push({ label: `${a}×${b}`, value: int(a * b), form: "×", slip: int(a * (b + 1)) });
        out.push({ label: `${a * b}÷${b}`, value: int(a), form: "÷", slip: int(a + 1) });
      }
    return out;
  },
  targetOk: inRange(4, 100),
  minHits: 3,
  near: (t) => Math.max(3, Math.round(approx(t) * 0.2)),
});

const G4_PAIRS = poolSkill({
  key: "g4-pairs",
  standard: "NC.4.OA.4",
  skill: "Factor pairs",
  build() {
    const out: Item[] = [];
    for (const a of range(2, 10))
      for (const b of range(a, 50)) {
        if (a * b > 100) continue;
        out.push({ label: `${a}×${b}`, value: int(a * b), form: "ab", slip: int(a * (b + 1)) });
        if (a !== b) out.push({ label: `${b}×${a}`, value: int(a * b), form: "ba", slip: int((a + 1) * b) });
      }
    return out;
  },
  targetOk: inRange(12, 100),
  minHits: 5,
  near: 8,
});

const G4_MULT = poolSkill({
  key: "g4-mult",
  standard: "NC.4.NBT.5",
  skill: "Multi-digit multiplication",
  minHits: 3,
  build(level) {
    const out: Item[] = [];
    for (const x of range(3, 9))
      for (const y of range(12, 99)) {
        if (y % 10 === 0) continue;
        out.push({ label: `${y}×${x}`, value: int(x * y), form: "2x1", slip: int(x * y + x) });
      }
    if (level >= 2)
      for (const x of range(11, 25))
        for (const y of range(x, 40)) {
          if (y % 10 === 0 || x % 10 === 0) continue;
          out.push({ label: `${x}×${y}`, value: int(x * y), form: "2x2", slip: int(x * y - x) });
        }
    return out;
  },
  targetOk: inRange(100, 999),
  near: 30,
});

const G5_ORDER = poolSkill({
  key: "g5-order",
  standard: "NC.5.OA.2",
  skill: "Order of operations with parentheses",
  build(level) {
    const out: Item[] = [];
    const N = range(2, 9);
    const push = (label: string, v: number, form: string, slip?: number) => {
      if (Number.isInteger(v) && v >= 0) out.push({ label, value: int(v), form, slip: slip !== undefined && Number.isInteger(slip) && slip >= 0 ? int(slip) : undefined });
    };
    for (const a of N)
      for (const b of N)
        for (const c of N) {
          push(`(${a}+${b})×${c}`, (a + b) * c, "(a+b)c", a + b * c);
          push(`${a}+${b}×${c}`, a + b * c, "a+bc", (a + b) * c);
          push(`${a}×(${b}+${c})`, a * (b + c), "a(b+c)", a * b + c);
          push(`${a}×${b}+${c}`, a * b + c, "ab+c", a * (b + c));
          if (a > b) push(`(${a}−${b})×${c}`, (a - b) * c, "(a-b)c", a - b * c);
          if (b > c) push(`${a}×(${b}−${c})`, a * (b - c), "a(b-c)", a * b - c);
          if (a * b > c) push(`${a}×${b}−${c}`, a * b - c, "ab-c", b > c ? a * (b - c) : undefined);
          if ((a + b) % c === 0) push(`(${a}+${b})÷${c}`, (a + b) / c, "(a+b)/c", b % c === 0 ? a + b / c : undefined);
          if (level >= 3 && (a * b) % c === 0) push(`${a}×${b}÷${c}`, (a * b) / c, "ab/c");
          if (level >= 3 && c > 2) push(`${a}+[${b}×(${c}−1)]`, a + b * (c - 1), "a+[b(c-1)]", a + b * c - 1);
        }
    return out;
  },
  targetOk: (v, level) => inRange(6, level <= 1 ? 50 : 90)(v),
  minHits: 3,
  near: 8,
});

const G5_DEC = poolSkill({
  key: "g5-dec",
  standard: "NC.5.NBT.7",
  skill: "Decimal operations",
  build(level) {
    const out: Item[] = [];
    const t = (k: number) => frac(k, 10);
    const d = (v: Val) => fmtDec(v);
    for (const A of range(1, 99))
      for (const B of range(1, 99)) {
        if (A % 10 === 0 && B % 10 === 0) continue; // keep at least one real decimal
        const s = A + B;
        if (s <= 99) {
          const carry = (A % 10) + (B % 10) >= 10;
          out.push({ label: `${d(t(A))}+${d(t(B))}`, value: t(s), form: "+", slip: carry ? t(s - 10) : t(s + 1) });
        }
        if (B < A) out.push({ label: `${d(t(A))}−${d(t(B))}`, value: t(A - B), form: "−", slip: t(A - B + 10) });
      }
    for (const A of range(1, 99))
      for (const n of range(2, 9)) {
        if (A % 10 === 0) continue;
        if (A * n <= 99) out.push({ label: `${d(t(A))}×${n}`, value: t(A * n), form: "×n", slip: frac(A * n, 100) });
        if (A % n === 0) out.push({ label: `${d(t(A))}÷${n}`, value: t(A / n), form: "÷n", slip: int(A / n) });
      }
    if (level >= 2)
      for (const A of range(1, 9))
        for (const B of range(1, 9))
          out.push({ label: `0.${A}×0.${B}`, value: frac(A * B, 100), form: "×.", slip: t(A * B) });
    return out;
  },
  show: (v) => fmtDec(v),
  targetOk: (v) => v.r === 1 && v.d === 10 && v.n >= 11 && v.n <= 99,
  minHits: 4,
  near: 1,
});

/* ============================== 6-8 ============================== */

const G6_EXP = poolSkill({
  key: "g6-exp",
  standard: "NC.6.EE.1",
  skill: "Exponents and order of operations",
  build() {
    const out: Item[] = [];
    const push = (label: string, v: number, form: string, slip?: number) =>
      out.push({ label, value: int(v), form, slip: slip !== undefined && slip >= 0 ? int(slip) : undefined });
    for (const a of range(2, 10)) {
      push(`${a}²`, a * a, "a2", 2 * a);
      if (a <= 5) push(`${a}³`, a ** 3, "a3", 3 * a);
      for (const b of range(1, 9)) {
        push(`${a}²+${b}`, a * a + b, "a2+b", 2 * a + b);
        if (a * a > b) push(`${a}²−${b}`, a * a - b, "a2-b", 2 * a - b);
        if (a <= 5 && b <= 5 && b >= 2) push(`${a}×${b}²`, a * b * b, "ab2", (a * b) ** 2);
        if (a + b <= 10) push(`(${a}+${b})²`, (a + b) ** 2, "(a+b)2", a * a + b * b);
        if (b >= 2 && b < a) push(`${a}²+${b}²`, a * a + b * b, "a2+b2", 2 * a + 2 * b);
        if (a <= 4 && a ** 3 > b) push(`${a}³−${b}`, a ** 3 - b, "a3-b", 3 * a - b);
        if (b >= 2 && b <= 9 && (b * b) % a === 0 && a < b) push(`${b}²÷${a}`, (b * b) / a, "b2/a", (2 * b) % a === 0 ? (2 * b) / a : undefined);
      }
    }
    for (const n of range(3, 6)) push(`2${supNum(n)}`, 2 ** n, "2n", 2 * n);
    return out;
  },
  targetOk: inRange(8, 100),
  minHits: 3,
  near: 8,
});

const FRACS: [number, number][] = [];
for (const q of range(2, 10)) for (const p of range(1, q - 1)) if (gcdN(p, q) === 1) FRACS.push([p, q]);

const G6_FRAC = poolSkill({
  key: "g6-frac",
  standard: "NC.6.NS.1",
  skill: "Divide fractions",
  build() {
    const out: Item[] = [];
    for (const [p, q] of FRACS)
      for (const [r, s] of FRACS) {
        if (p === r && q === s) continue;
        out.push({ label: `${p}/${q}÷${r}/${s}`, value: frac(p * s, q * r), form: "f÷f", slip: frac(p * r, q * s) });
      }
    for (const n of range(1, 6))
      for (const [r, s] of FRACS) out.push({ label: `${n}÷${r}/${s}`, value: frac(n * s, r), form: "n÷f", slip: frac(n * r, s) });
    for (const [p, q] of FRACS)
      for (const n of range(2, 6)) out.push({ label: `${p}/${q}÷${n}`, value: frac(p, q * n), form: "f÷n", slip: frac(p * n, q) });
    return out;
  },
  targetOk: (v) => v.r === 1 && v.d <= 4 && v.n > 0 && v.n / v.d <= 12,
  minHits: 3,
  near: (t) => Math.max(1, approx(t) * 0.5),
});

const G7_ADD = poolSkill({
  key: "g7-add",
  standard: "NC.7.NS.1",
  skill: "Add and subtract integers",
  build() {
    const out: Item[] = [];
    for (const a of range(-12, 12))
      for (const b of range(-12, 12)) {
        if (a === 0 || b === 0 || (a > 0 && b > 0)) continue;
        out.push({ label: `${ns(a)}+${pn(b)}`, value: int(a + b), form: "+", slip: int(a - b) });
        out.push({ label: `${ns(a)}−${pn(b)}`, value: int(a - b), form: "−", slip: int(a + b) });
      }
    return out;
  },
  targetOk: (v) => inRange(-15, 15)(v) && v.n !== 0,
  minHits: 4,
  near: 4,
});

const G7_MUL = poolSkill({
  key: "g7-mul",
  standard: "NC.7.NS.2",
  skill: "Multiply and divide integers",
  build() {
    const out: Item[] = [];
    for (const a of range(-12, 12))
      for (const b of range(-12, 12)) {
        if (Math.abs(a) < 2 || Math.abs(b) < 2 || (a > 0 && b > 0)) continue;
        out.push({ label: `${ns(a)}×${pn(b)}`, value: int(a * b), form: "×", slip: int(-a * b) });
        out.push({ label: `${ns(a * b)}÷${pn(b)}`, value: int(a), form: "÷", slip: int(-a) });
      }
    return out;
  },
  targetOk: (v) => v.r === 1 && v.d === 1 && Math.abs(v.n) >= 2 && Math.abs(v.n) <= 72,
  minHits: 3,
  near: (t) => Math.max(4, Math.abs(approx(t)) * 0.25),
  // Sign mistakes are the whole point here: −t is always "near".
  dist: (a, b) => Math.min(Math.abs(approx(a) - approx(b)), Math.abs(approx(a) + approx(b)) * 0.1),
});

/* Grade 8: exponent rules with one base per wave. */
function expOf(v: Val, b: number): number {
  const x = Math.round(Math.log(approx(v)) / Math.log(b));
  return x;
}

const G8_RULES = poolSkill({
  key: "g8-rules",
  standard: "NC.8.EE.1",
  skill: "Exponent rules",
  context: () => pick([2, 3, 5, 10]),
  build(level, ctx) {
    const b = ctx as number;
    const out: Item[] = [];
    const P = (k: number) => pow(int(b), k);
    const safe = (k: number) => Math.abs(k) <= 15 && b ** Math.abs(k) <= 1e15;
    const L = (k: number) => powLabel(b, k);
    for (const m of range(1, 9))
      for (const n of range(1, 9)) {
        if (m + n <= 12) out.push({ label: `${L(m)}·${L(n)}`, value: P(m + n), form: "product", slip: safe(m * n) ? P(m * n) : undefined });
        if (m >= 2 && n >= 2 && m * n <= 12) out.push({ label: `(${L(m)})${supNum(n)}`, value: P(m * n), form: "power", slip: P(m + n) });
        if (m > n || level >= 2) {
          const hi = m + n;
          if (hi <= 12 && hi - n !== 0) out.push({ label: `${L(hi)}÷${L(n)}`, value: P(hi - n), form: "quotient", slip: hi % n === 0 ? P(hi / n) : undefined });
        }
        if (level >= 2 && m > n) out.push({ label: `${L(m)}·${L(-n)}`, value: P(m - n), form: "negative", slip: safe(m + n) ? P(m + n) : undefined });
      }
    return out;
  },
  show: (v, ctx) => powLabel(ctx as number, expOf(v, ctx as number)),
  targetOk: (v) => v.r === 1 && v.d === 1 && v.n > 1,
  // Decoys are a power or two away (by exponent), e.g. 2⁶ or 2¹⁰ when the target is 2⁸.
  dist: (a, b, ctx) => Math.abs(Math.log(approx(a)) - Math.log(approx(b))) / Math.log(ctx as number),
  near: 2.5,
  minHits: 3,
});

const G8_ROOTS = poolSkill({
  key: "g8-roots",
  standard: "NC.8.EE.2",
  skill: "Square and cube roots",
  build() {
    const out: Item[] = [];
    for (const n of range(2, 15)) out.push({ label: `√${n * n}`, value: int(n), form: "sqrt", slip: (n * n) % 2 === 0 ? int((n * n) / 2) : int(n + 1) });
    for (const n of [2, 3, 4, 5, 6, 10]) out.push({ label: `∛${n ** 3}`, value: int(n), form: "cbrt", slip: (n ** 3) % 3 === 0 ? int(n ** 3 / 3) : int(n * n) });
    for (const a of range(1, 10))
      for (const b of range(1, 10)) {
        if (a === b) continue;
        const inside = isqrt(a * a + b * b);
        out.push({ label: `√${a * a}+√${b * b}`, value: int(a + b), form: "sum", slip: inside !== null ? int(inside) : undefined });
        if (a > b) out.push({ label: `√${a * a}−√${b * b}`, value: int(a - b), form: "diff" });
        if (a * b <= 15 && a > 1 && b > 1) out.push({ label: `√${a * a}·√${b * b}`, value: int(a * b), form: "prod", slip: int(a * a + b * b) });
      }
    return out;
  },
  targetOk: inRange(2, 15),
  minHits: 3,
  near: 2,
});

/** 6×10⁸, 1.2×10⁻³ */
function fmtSci(v: Val): string {
  let k = Math.floor(Math.log10(Math.abs(approx(v))) + 1e-9);
  let m = div(v, pow(int(10), k));
  // guard against rounding at exact powers of ten
  if (approx(m) >= 10) {
    k++;
    m = div(v, pow(int(10), k));
  } else if (approx(m) < 1) {
    k--;
    m = div(v, pow(int(10), k));
  }
  return `${fmtDec(m)}×10${supNum(k)}`;
}

const G8_SCI = poolSkill({
  key: "g8-sci",
  standard: "NC.8.EE.4",
  skill: "Operations in scientific notation",
  claims: false,
  build(level) {
    const out: Item[] = [];
    const S = (c: number, k: number) => mul(int(c), pow(int(10), k));
    const L = (c: number, k: number) => `${c}×10${supNum(k)}`;
    for (const a of range(1, 9))
      for (const b of range(2, 9))
        for (const m of range(2, 6))
          for (const n of range(2, 6)) {
            if (a * b >= 10 && level <= 1) continue;
            out.push({ label: `(${L(a, m)})(${L(b, n)})`, value: S(a * b, m + n), form: "prod", slip: m * n <= 12 ? S(a * b, m * n) : undefined });
          }
    for (const c of range(2, 9))
      for (const d of range(2, 9)) {
        if (c % d !== 0 || c === d) continue;
        for (const m of range(5, 9))
          for (const n of range(2, 4)) out.push({ label: `(${L(c, m)})÷(${L(d, n)})`, value: S(c / d, m - n), form: "quot", slip: S(c / d, m + n) });
      }
    return out;
  },
  show: (v) => fmtSci(v),
  targetOk: (v) => v.r === 1 && v.d === 1,
  minHits: 3,
  dist: (a, b) => Math.abs(Math.log10(approx(a)) - Math.log10(approx(b))),
  near: 1.3,
});

/* ============================== high school ============================== */

interface FG {
  a: number;
  b: number;
  c: number;
}

function linText(a: number, b: number) {
  return `${coef(a)}x${b === 0 ? "" : signed(b)}`;
}
function quadText(c: number) {
  return `x²${c === 0 ? "" : signed(c)}`;
}
const fgText = (ctx: unknown) => {
  const { a, b, c } = ctx as FG;
  return `f(x)=${linText(a, b)}  g(x)=${quadText(c)}`;
};

const M1_FUNC = poolSkill({
  key: "m1-func",
  standard: "NC.M1.F-IF.2",
  skill: "Evaluate functions",
  context: () => ({ a: pick([2, 3, 4, 5, -2, -3]), b: pick([-9, -7, -5, -4, -3, -2, -1, 1, 2, 3, 4, 5, 6, 7]), c: ri(-9, 6) }),
  contextText: fgText,
  build(_level, ctx) {
    const { a, b, c } = ctx as FG;
    const f = (x: number) => a * x + b;
    const g = (x: number) => x * x + c;
    const out: Item[] = [];
    for (const k of range(-5, 9)) out.push({ label: `f(${ns(k)})`, value: int(f(k)), form: "f", slip: int(a * k - b) });
    for (const k of range(-5, 6)) out.push({ label: `g(${ns(k)})`, value: int(g(k)), form: "g", slip: int(k < 0 ? -(k * k) + c : 2 * k + c) });
    for (const j of range(0, 4))
      for (const i of range(0, 4)) out.push({ label: `f(${j})+g(${i})`, value: int(f(j) + g(i)), form: "f+g" });
    return out;
  },
  targetOk: (v) => v.r === 1 && v.d === 1 && Math.abs(v.n) <= 40,
  minHits: 3,
  near: 4,
});

/* Equations: the missile shows an equation; its value is the solution. */
function linearEq(T: number, allowBoth: boolean): { label: string; sol: number } {
  const forms = ["ax+b", "a(x+b)", "x/a+b", "b-x", ...(allowBoth ? ["both", "both"] : [])];
  for (let tries = 0; tries < 50; tries++) {
    const f = pick(forms);
    if (f === "ax+b") {
      const a = ri(2, 9);
      const b = pick([-12, -9, -7, -5, -4, -3, -2, -1, 1, 2, 3, 4, 5, 7, 9, 12]);
      return { label: `${a}x${signed(b)}=${ns(a * T + b)}`, sol: T };
    }
    if (f === "a(x+b)") {
      const a = ri(2, 5);
      const b = pick([-6, -5, -4, -3, -2, -1, 1, 2, 3, 4, 5, 6]);
      return { label: `${a}(x${signed(b)})=${ns(a * (T + b))}`, sol: T };
    }
    if (f === "x/a+b") {
      const a = pick([2, 3, 4, 5].filter((d) => T % d === 0));
      if (!a) continue;
      const b = pick([-5, -3, -2, -1, 1, 2, 3, 4, 6]);
      return { label: `x/${a}${signed(b)}=${ns(T / a + b)}`, sol: T };
    }
    if (f === "b-x") {
      const b = ri(T + 1, T + 15);
      return { label: `${ns(b)}−x=${ns(b - T)}`, sol: T };
    }
    const a = ri(3, 7);
    const d = ri(1, a - 1);
    const b = pick([-9, -6, -5, -3, -2, 1, 2, 4, 5, 7]);
    const e = (a - d) * T + b;
    if (e === 0) continue;
    return { label: `${a}x${signed(b)}=${coef(d)}x${signed(e)}`, sol: T };
  }
  return { label: `x+1=${ns(T + 1)}`, sol: T };
}

function eqSkill(key: string, standard: string, skill: string, allowBoth: (level: number) => boolean): Skill {
  return {
    key,
    standard,
    skill,
    claims: false,
    setup(level) {
      const T = pick(range(-6, 12).filter((v) => v !== 0 && v !== 1));
      const mkItem = (sol: number, label: string): Item => ({ label, value: int(sol), form: "eq" });
      return {
        target: int(T),
        targetText: `x = ${ns(T)}`,
        targetShort: `x=${ns(T)}`,
        eq: true,
        show: (v) => fmt(v),
        hit: (avoid) => {
          for (let i = 0; i < 20; i++) {
            const e = linearEq(T, allowBoth(level));
            if (!avoid.has(e.label)) return mkItem(e.sol, e.label);
          }
          const e = linearEq(T, allowBoth(level));
          return mkItem(e.sol, e.label);
        },
        miss: (avoid) => {
          for (let i = 0; i < 30; i++) {
            if (chance(0.45)) {
              // Trap: adding b instead of subtracting it gives T. ax+b=c with c = aT−b.
              const a = ri(2, 6);
              const m = pick([-3, -2, -1, 1, 2, 3]);
              const b = a * m;
              const c = a * T - b;
              const sol = T - 2 * m;
              const label = `${a}x${signed(b)}=${ns(c)}`;
              if (sol !== T && !avoid.has(label)) return mkItem(sol, label);
              continue;
            }
            const other = pick([T + 1, T - 1, T + 2, T - 2, -T, T + 3].filter((v) => v !== T));
            const e = linearEq(other, allowBoth(level));
            if (!avoid.has(e.label)) return mkItem(e.sol, e.label);
          }
          const e = linearEq(T + 1, false);
          return mkItem(e.sol, e.label);
        },
        any: () => mkItem(T, linearEq(T, false).label),
        wrongFor: (it) => add(it.value, int(1)),
      };
    },
  };
}

const M1_SOLVE = eqSkill("m1-solve", "NC.M1.A-REI.3", "Solve linear equations", (level) => level >= 3);
const M2_SOLVE = eqSkill("m2-solve", "NC.M1.A-REI.3", "Solve equations (x on both sides)", () => true);

const RADS = [2, 3, 5, 6, 7];

const M2_RAD = poolSkill({
  key: "m2-rad",
  standard: "NC.M2.N-RN.2",
  skill: "Simplify radicals",
  build() {
    const out: Item[] = [];
    for (const N of range(8, 300)) {
      const s = splitSquare(N);
      if (s.out === 1 || s.inside === 1) continue;
      out.push({ label: `√${N}`, value: root(N), form: "sqrt", slip: mk(s.out * s.out, 1, s.inside) });
    }
    for (const j of range(2, 5))
      for (const m of range(8, 75)) {
        const s = splitSquare(m);
        if (s.out === 1 || s.inside === 1) continue;
        out.push({ label: `${j}√${m}`, value: root(m, j), form: "k-sqrt", slip: mk(j * s.out * s.out, 1, s.inside) });
      }
    for (const a of range(2, 20))
      for (const b of range(a + 1, 24)) {
        if (isqrt(a) !== null || isqrt(b) !== null) continue;
        const v = root(a * b);
        if (v.r === 1 && v.n > 12) continue;
        out.push({ label: `√${a}·√${b}`, value: v, form: "product", slip: root(a + b) });
      }
    for (const r of RADS)
      for (const a of range(1, 4))
        for (const b of range(1, 4)) {
          const L = (k: number) => `${k === 1 ? "" : k}√${r}`;
          out.push({ label: `${L(a)}+${L(b)}`, value: root(r, a + b), form: "like", slip: mk(a + b, 1, 2 * r) });
        }
    return out;
  },
  targetOk: (v) => v.d === 1 && RADS.includes(v.r) && v.n >= 2 && v.n <= 6,
  minHits: 3,
  dist: (a, b) => (a.r === b.r ? Math.abs(a.n / a.d - b.n / b.d) : 1.5 + Math.abs(a.n / a.d - b.n / b.d)),
  near: 2.5,
});

const M2_RATEXP = poolSkill({
  key: "m2-ratexp",
  standard: "NC.M2.N-RN.2",
  skill: "Rational exponents",
  build(level) {
    const out: Item[] = [];
    for (const c of range(2, 10))
      for (const q of range(2, 5))
        for (const p of range(1, 4)) {
          if (gcdN(p, q) !== 1 || p >= q + 2) continue;
          const B = c ** q;
          if (B > 1024 || c ** p > 100) continue;
          const lbl = `${B}${supNum(p)}ᐟ${supNum(q)}`;
          const slip = (B * p) % q === 0 ? int((B * p) / q) : int(c ** p + c);
          out.push({ label: lbl, value: int(c ** p), form: `p${p}`, slip });
          if (level >= 3 && p === 1) out.push({ label: `${B}⁻¹ᐟ${supNum(q)}`, value: frac(1, c), form: "neg", slip: int(-c) });
        }
    return out;
  },
  targetOk: (v) => v.r === 1 && v.d === 1 && v.n >= 2,
  minHits: 3,
  near: (t) => Math.max(3, approx(t) * 0.5),
});

const LOG_BASES = [2, 3, 4, 5, 10];
const logLabel = (b: number, arg: string) => (b === 10 ? `log ${arg}` : `log${subNum(b)}${arg}`);

const M3_LOG = poolSkill({
  key: "m3-log",
  standard: "NC.M3.F-LE.4",
  skill: "Logarithms",
  build(level) {
    const out: Item[] = [];
    for (const b of LOG_BASES)
      for (const k of range(level >= 2 ? -3 : 0, 6)) {
        if (k >= 0 && b ** k > 100000) continue;
        if (k < 0 && b ** -k > 1000) continue;
        let arg: string;
        if (k >= 0) arg = String(b ** k);
        else arg = b === 10 ? fmtDec(frac(1, 10 ** -k)) : `(1/${b ** -k})`;
        const N = b ** k;
        const slip = k > 0 && Number.isInteger(N / b) && N / b !== k ? int(N / b) : k < 0 ? int(-k) : int(k + 1);
        out.push({ label: logLabel(b, arg), value: int(k), form: k < 0 ? "neg" : "plain", slip });
      }
    if (level >= 2)
      for (const b of [2, 3])
        for (const i of range(1, 4))
          for (const j of range(1, 4)) {
            if (b ** i > 81 || b ** j > 81) continue;
            out.push({ label: `${logLabel(b, String(b ** i))}+${logLabel(b, String(b ** j))}`, value: int(i + j), form: "sum", slip: int(i * j) });
          }
    return out;
  },
  // log_b(1) = 0 is too easy to be a whole wave's target at first.
  targetOk: (v, level) => v.r === 1 && v.d === 1 && v.n >= (level >= 2 ? -3 : 1) && v.n <= 6,
  minHits: 2,
  near: 1.5,
});

/* Unit circle: exact sin/cos/tan at multiples of 30° and 45°. */
const ANGLES = [0, 30, 45, 60, 90, 120, 135, 150, 180, 210, 225, 240, 270, 300, 315, 330];

function trigExact(fn: "sin" | "cos" | "tan", deg: number): Val | null {
  const base: Record<number, [Val, Val]> = {
    0: [int(0), int(1)],
    30: [frac(1, 2), mk(1, 2, 3)],
    45: [mk(1, 2, 2), mk(1, 2, 2)],
    60: [mk(1, 2, 3), frac(1, 2)],
    90: [int(1), int(0)],
  };
  const d = ((deg % 360) + 360) % 360;
  let ref: number;
  let sS = 1;
  let sC = 1;
  if (d <= 90) ref = d;
  else if (d <= 180) {
    ref = 180 - d;
    sC = -1;
  } else if (d <= 270) {
    ref = d - 180;
    sS = -1;
    sC = -1;
  } else {
    ref = 360 - d;
    sS = -1;
  }
  const [s0, c0] = base[ref];
  const s = sS < 0 ? mul(s0, int(-1)) : s0;
  const c = sC < 0 ? mul(c0, int(-1)) : c0;
  if (fn === "sin") return s;
  if (fn === "cos") return c;
  if (c.n === 0) return null;
  return div(s, c);
}

function radLabel(deg: number): string {
  if (deg === 0) return "0";
  const g = gcdN(deg, 180);
  const p = deg / g;
  const q = 180 / g;
  const top = `${p === 1 ? "" : p}π`;
  return q === 1 ? top : `${top}/${q}`;
}

function trigSkill(key: string, standard: string, skill: string, radians: boolean): Skill {
  return poolSkill({
    key,
    standard,
    skill,
    build() {
      const out: Item[] = [];
      for (const deg of ANGLES)
        for (const fn of ["sin", "cos", "tan"] as const) {
          const v = trigExact(fn, deg);
          if (!v) continue;
          const other = fn === "sin" ? trigExact("cos", deg) : fn === "cos" ? trigExact("sin", deg) : trigExact("tan", 90 - deg);
          const label = radians ? `${fn}(${radLabel(deg)})` : `${fn} ${deg}°`;
          out.push({ label, value: v, form: fn, slip: other ?? undefined });
        }
      return out;
    },
    minHits: 3,
    near: 0.9,
  });
}

const M3_TRIG = trigSkill("m3-trig", "NC.M3.F-TF.2", "Unit circle values (degrees)", false);
const M4_TRIG = trigSkill("m4-trig", "NC.M3.F-TF.2", "Unit circle values (radians)", true);

const M4_COMP = poolSkill({
  key: "m4-comp",
  standard: "NC.M4.AF.1.2",
  skill: "Evaluate composite functions",
  context: () => ({ a: pick([2, 3, 4, -2]), b: pick([-5, -4, -3, -2, -1, 1, 2, 3, 4, 5]), c: pick([-4, -3, -2, -1, 1, 2, 3]) }),
  contextText: fgText,
  build(_level, ctx) {
    const { a, b, c } = ctx as FG;
    const f = (x: number) => a * x + b;
    const g = (x: number) => x * x + c;
    const out: Item[] = [];
    for (const k of range(-4, 4)) {
      out.push({ label: `f(g(${ns(k)}))`, value: int(f(g(k))), form: "fg", slip: int(g(f(k))) });
      out.push({ label: `g(f(${ns(k)}))`, value: int(g(f(k))), form: "gf", slip: int(f(g(k))) });
      out.push({ label: `f(f(${ns(k)}))`, value: int(f(f(k))), form: "ff", slip: int(f(k) * f(k)) });
    }
    return out;
  },
  targetOk: (v) => v.r === 1 && v.d === 1,
  minHits: 3,
  near: 8,
});

const LOGEQ_BASES = [2, 3, 4, 5, 8, 9, 10, 16, 25, 27];

const M4_LOGEQ: Skill = (() => {
  const spec: PoolSpec = {
    key: "m4-logeq",
    standard: "NC.M4.AF.3.2",
    skill: "Solve logarithmic equations",
    claims: false,
    build(level) {
      const out: Item[] = [];
      for (const b of LOGEQ_BASES)
        for (const k of range(level >= 2 ? -2 : 1, 6)) {
          if (k === 0) continue;
          if (k > 0 && b ** k > 100000) continue;
          if (k < 0 && b ** -k > 100) continue;
          out.push({ label: `${logLabel(b, "x")}=${ns(k)}`, value: pow(int(b), k), form: String(b), slip: k > 0 ? int(b * k) : undefined });
        }
      return out;
    },
    minHits: 3,
    dist: (a, b) => Math.abs(Math.log(approx(a)) - Math.log(approx(b))),
    near: 1.3,
  };
  const s = poolSkill(spec);
  return {
    ...s,
    setup(level, ctx) {
      const base = s.setup(level, ctx);
      return { ...base, eq: true, targetText: `x = ${fmt(base.target)}`, targetShort: `x=${fmt(base.target)}` };
    },
  };
})();

/* ------------------------------ grades ------------------------------ */

export const GRADE_SKILLS: Record<Grade, Skill[]> = {
  K: [K_ADD5, K_PAIRS10],
  "1": [G1_ADD20, G1_TENS],
  "2": [G2_ADD100, G2_EXPAND],
  "3": [G3_FACTS],
  "4": [G4_PAIRS, G4_MULT],
  "5": [G5_ORDER, G5_DEC],
  "6": [G6_EXP, G6_FRAC],
  "7": [G7_ADD, G7_MUL],
  "8": [G8_RULES, G8_ROOTS, G8_SCI],
  "9": [M1_FUNC, M1_SOLVE],
  "10": [M2_RAD, M2_RATEXP, M2_SOLVE],
  "11": [M3_LOG, M3_TRIG],
  "12": [M4_COMP, M4_LOGEQ, M4_TRIG],
};

/* ------------------------------ read-aloud ------------------------------ */

const SUPS = "⁰¹²³⁴⁵⁶⁷⁸⁹";
const SUBS = "₀₁₂₃₄₅₆₇₈₉";

/** Turns a math label into words for speech synthesis. */
export function sayMath(s: string): string {
  let t = s;
  t = t.replace(/log([₀-₉]+)/g, (_m, d: string) => ` log base ${[...d].map((c) => SUBS.indexOf(c)).join("")} of `);
  t = t.replace(/log /g, " log of ");
  t = t.replace(/([⁻]?[⁰-⁹]+)ᐟ([⁰-⁹]+)/g, (_m, p: string, q: string) => ` to the ${fromSup(p)} over ${fromSup(q)} power `);
  t = t.replace(/²(?![⁰-⁹])/g, " squared ").replace(/³(?![⁰-⁹])/g, " cubed ");
  t = t.replace(/([⁻]?[⁰-⁹]+)/g, (m: string) => ` to the power ${fromSup(m)} `);
  t = t.replace(/√/g, " root ").replace(/∛/g, " cube root of ");
  t = t.replace(/°/g, " degrees").replace(/π/g, " pi ").replace(/·/g, " times ");
  t = t.replace(/([fg])\(/g, " $1 of (");
  t = t.replace(/\//g, " over ").replace(/=/g, " equals ").replace(/\+/g, " plus ").replace(/→/g, ", so ");
  t = t.replace(/\s+/g, " ").trim();
  return t;
}

function fromSup(s: string): string {
  return [...s].map((c) => (c === "⁻" ? "negative " : String(SUPS.indexOf(c)))).join("");
}

/* ------------------------------ rounds ------------------------------ */

export function gradeSkills(grade: Grade): Skill[] {
  return GRADE_SKILLS[grade];
}

/** Every third wave is a "stop the WRONG answers" wave. */
export function isWrongWave(wave: number): boolean {
  return wave % 3 === 0;
}

/** The skill used on `wave` (1-based). */
export function skillFor(grade: Grade, wave: number): Skill {
  const all = GRADE_SKILLS[grade];
  if (isWrongWave(wave)) {
    const c = all.filter((s) => s.claims);
    return c[(wave / 3 - 1) % c.length];
  }
  const matchIndex = wave - 1 - Math.floor(wave / 3);
  return all[matchIndex % all.length];
}

/** A "level" (1-4) for pools: difficulty rises through the first waves. */
export function tierFor(wave: number): number {
  return Math.min(4, 1 + Math.floor((wave - 1) / 2));
}

export function makeRound(grade: Grade, wave: number): Round {
  const sk = skillFor(grade, wave);
  const level = tierFor(wave);
  return isWrongWave(wave) ? wrongRound(sk, level) : matchRound(sk, level);
}

function matchRound(sk: Skill, level: number): Round {
  const st = sk.setup(level);
  const fact = (it: Item) => (st.eq ? `${it.label} → x=${st.show(it.value)}` : `${it.label}=${st.show(it.value)}`);
  const say = st.eq
    ? `Target: x equals ${sayMath(st.show(st.target))}. Stop the equations whose answer is x equals ${sayMath(st.show(st.target))}.`
    : `Target ${sayMath(st.targetText)}. Stop the missiles that equal ${sayMath(st.targetText)}.`;
  return {
    mode: "match",
    key: sk.key,
    standard: sk.standard,
    skill: sk.skill,
    targetText: st.targetText,
    targetShort: st.targetShort,
    context: st.context,
    say: (st.context ? `${sayMath(st.context.replace(/ {2}/g, ". "))}. ` : "") + say,
    hint: st.eq ? `Stop equations with x = ${st.show(st.target)}` : `Stop missiles that equal ${st.targetText}`,
    next(danger, avoid = new Set()) {
      for (let i = 0; i < 40; i++) {
        const it = danger ? st.hit(avoid) : st.miss(avoid);
        if (eq(it.value, st.target) !== danger) continue; // never happens for a correct pool; belt and braces
        if (i < 30 && avoid.has(it.label)) continue;
        return { label: it.label, danger, fact: fact(it) };
      }
      const it = danger ? st.hit(new Set()) : st.miss(new Set());
      return { label: it.label, danger: eq(it.value, st.target), fact: fact(it) };
    },
  };
}

function wrongRound(sk: Skill, level: number): Round {
  const ctx = sk.context?.(level);
  const first = sk.setup(level, ctx);
  return {
    mode: "wrong",
    key: sk.key,
    standard: sk.standard,
    skill: sk.skill,
    targetText: "WRONG ANSWERS",
    targetShort: "",
    context: first.context,
    say: (first.context ? `${sayMath(first.context.replace(/ {2}/g, ". "))}. ` : "") + "Stop the wrong answers! Only shoot the missiles with a mistake.",
    hint: "Stop the missiles with a mistake",
    next(danger, avoid = new Set()) {
      // Don't put two claims about the same expression on screen at once.
      const lhs = new Set([...avoid].map((l) => l.slice(0, l.lastIndexOf("="))));
      for (let i = 0; i < 40; i++) {
        const st = sk.setup(level, ctx);
        const it = st.any(lhs);
        if (lhs.has(it.label) && i < 30) continue;
        const right = st.show(it.value);
        const truth = `${it.label}=${right}`;
        if (!danger) {
          if (avoid.has(truth) && i < 30) continue;
          return { label: truth, danger: false, fact: truth };
        }
        const w = st.wrongFor(it);
        if (eq(w, it.value)) continue;
        const label = `${it.label}=${st.show(w)}`;
        if (avoid.has(label) && i < 30) continue;
        return { label, danger: true, fact: truth };
      }
      const st = sk.setup(level, ctx);
      const it = st.hit(new Set());
      return { label: `${it.label}=${st.show(it.value)}`, danger: false, fact: `${it.label}=${st.show(it.value)}` };
    },
  };
}

/** Short grade description for the title screen. */
export function gradeBlurb(grade: Grade): { skills: string; example: string } {
  const sk = GRADE_SKILLS[grade];
  const r = makeRound(grade, 1);
  const m = r.next(true);
  return {
    skills: sk.map((s) => `${s.skill} (${s.standard})`).join(" · "),
    example: `${r.context ? r.context + "  " : ""}TARGET ${r.targetText}: ${m.label}`,
  };
}

// Re-exported for the checker.
export { fmtSci, trigExact, sub };

/* ------------------------------ labels and notes ------------------------------ */

/** K-2 labels are drawn at double size. */
export function labelScale(grade: Grade): number {
  return grade === "K" || grade === "1" || grade === "2" ? 2 : 1;
}

/** Widest a missile label may be, in logical pixels (after scaling). K-2 have fewer missiles, so more room. */
export function labelMaxW(grade: Grade): number {
  return labelScale(grade) === 2 ? 100 : 84;
}
/** Widest a floating note may be (the screen is 320 wide). */
export const NOTE_MAX_W = 312;

export type Outcome = "stopped" | "wasted" | "passed" | "landed";

/** The line shown on screen when a missile is dealt with. */
export function outcomeNote(round: Round, m: MissileMath, o: Outcome): string {
  if (round.mode === "match") {
    if (o === "stopped") return `${m.fact} ✔`;
    if (o === "wasted") return `${m.fact}, NOT ${round.targetShort}`;
    if (o === "passed") return `${m.fact} SAFE`;
    return `${m.fact}!`;
  }
  if (o === "stopped") return `FIXED: ${m.fact}`;
  if (o === "wasted") return `${m.fact} IS TRUE!`;
  if (o === "passed") return `${m.fact} ✔`;
  return `WRONG! ${m.fact}`;
}
