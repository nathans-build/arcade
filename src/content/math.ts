import type { Grade } from "@/kit";
import { fmt, isPrime, trueOrders, valueOf, type Check } from "./expr";
import type { BuiltItem, CategoryRule, Distractor } from "./types";

/*
 * Math content for Cube Hop, K–12 (NC Standard Course of Study for Mathematics).
 * Build rounds are generated fresh: hop the cubes to make a TRUE equation. Every accepted
 * order is computed by trying all orders of the tokens, and a distractor is only used if
 * no order of the tokens with it swapped in for any one token is true.
 * Color rounds sort labels with a `test` that computes the answer from the label.
 */

type Rand = () => number;
const ri = (rand: Rand, a: number, b: number) => a + Math.floor(rand() * (b - a + 1));
const pickOne = <T,>(rand: Rand, arr: T[]) => arr[Math.floor(rand() * arr.length)];
const neg = (v: number) => fmt(v);

interface Draft {
  prompt: string;
  tokens: string[];
  check: Check;
  /** Candidate wrong labels with reasons; filtered so none can make a true equation. */
  pool: Distractor[];
  explain: string;
}

export interface MathTemplate {
  id: string;
  grades: Grade[];
  standard: string;
  skill: string;
  make(rand: Rand): Draft;
}

const BUILD = "Build a true equation.";

/** Near-miss numbers for a correct value, with a reason. */
function nearMisses(value: number, what: string, deltas: number[] = [1, -1, 2, 10, -10]): Distractor[] {
  return deltas
    .map((d) => value + d)
    .filter((v) => v >= 0 || value < 0)
    .map((v) => ({ label: neg(v), why: `${what} = ${neg(value)}, not ${neg(v)}.` }));
}

export const MATH_TEMPLATES: MathTemplate[] = [
  {
    id: "m-t-add5", grades: ["K"], standard: "NC.K.OA.5", skill: "Add and subtract within 5",
    make(rand) {
      for (;;) {
        const a = ri(rand, 1, 4), b = ri(rand, 1, 5 - a);
        if (a === b) continue;
        const c = a + b;
        if (rand() < 0.5) {
          return {
            prompt: `${BUILD} (${a} + ${b})`, tokens: [String(a), "+", String(b), "=", String(c)], check: { kind: "num" },
            pool: [...nearMisses(c, `${a} + ${b}`, [1, -1, 2]), { label: "−", why: `Putting ${a} and ${b} together is adding, so use +.` }],
            explain: `${a} + ${b} = ${c}. Adding puts groups together.`,
          };
        }
        return {
          prompt: `${BUILD} (${c} − ${b})`, tokens: [String(c), "−", String(b), "=", String(a)], check: { kind: "num" },
          pool: [...nearMisses(a, `${c} − ${b}`, [1, -1, 2]), { label: "+", why: `Taking ${b} away from ${c} is subtracting, so use −.` }],
          explain: `${c} − ${b} = ${a}. Subtracting takes some away.`,
        };
      }
    },
  },
  {
    id: "m-t-add20", grades: ["1", "2"], standard: "NC.1.OA.6", skill: "Add and subtract within 20",
    make(rand) {
      for (;;) {
        const a = ri(rand, 2, 12), b = ri(rand, 2, 9);
        const c = a + b;
        if (c > 20 || a === b || a === c || b === c) continue;
        if (rand() < 0.5) {
          return {
            prompt: BUILD, tokens: [String(a), "+", String(b), "=", String(c)], check: { kind: "num" },
            pool: [...nearMisses(c, `${a} + ${b}`), { label: "−", why: `${a} − ${b} is not ${c}. Adding gives ${c}.` }],
            explain: a < 10 && c > 10 ? `${a} + ${b} = ${c}. Make a ten: ${a} + ${10 - a} = 10, and ${b - (10 - a)} more is ${c}.` : `${a} + ${b} = ${c}.`,
          };
        }
        return {
          prompt: BUILD, tokens: [String(c), "−", String(b), "=", String(a)], check: { kind: "num" },
          pool: [...nearMisses(a, `${c} − ${b}`), { label: "+", why: `${c} + ${b} is ${c + b}, not ${a}.` }],
          explain: `${c} − ${b} = ${a}, because ${a} + ${b} = ${c}.`,
        };
      }
    },
  },
  {
    id: "m-t-add100", grades: ["2"], standard: "NC.2.NBT.5", skill: "Add and subtract within 100",
    make(rand) {
      for (;;) {
        const a = ri(rand, 12, 68), b = ri(rand, 11, 39);
        const c = a + b;
        if (c > 99 || a === b) continue;
        if (rand() < 0.5) {
          return {
            prompt: BUILD, tokens: [String(a), "+", String(b), "=", String(c)], check: { kind: "num" },
            pool: [...nearMisses(c, `${a} + ${b}`, [10, -10, 1, -1]), { label: "−", why: `Use + to put ${a} and ${b} together.` }],
            explain: `${a} + ${b} = ${c}: add the tens, then the ones.`,
          };
        }
        return {
          prompt: BUILD, tokens: [String(c), "−", String(b), "=", String(a)], check: { kind: "num" },
          pool: [...nearMisses(a, `${c} − ${b}`, [10, -10, 1, -1]), { label: "+", why: `${c} + ${b} is ${c + b}.` }],
          explain: `${c} − ${b} = ${a}. Check: ${a} + ${b} = ${c}.`,
        };
      }
    },
  },
  {
    id: "m-t-mult", grades: ["3", "4"], standard: "NC.3.OA.7", skill: "Multiply and divide within 100",
    make(rand) {
      for (;;) {
        const a = ri(rand, 2, 9), b = ri(rand, 3, 10);
        const c = a * b;
        if (a === b || a === c || b === c) continue;
        if (rand() < 0.55) {
          return {
            prompt: BUILD, tokens: [String(a), "×", String(b), "=", String(c)], check: { kind: "num" },
            pool: [...nearMisses(c, `${a} × ${b}`, [a, -a, b, 1]), { label: "+", why: `${a} + ${b} = ${a + b}, not ${c}.` }],
            explain: `${a} × ${b} = ${c}: ${a} groups of ${b}.`,
          };
        }
        return {
          prompt: BUILD, tokens: [String(c), "÷", String(a), "=", String(b)], check: { kind: "num" },
          pool: [...nearMisses(b, `${c} ÷ ${a}`, [1, -1, 2]), { label: "×", why: `${c} × ${a} is much bigger than ${b}.` }],
          explain: `${c} ÷ ${a} = ${b}, because ${a} × ${b} = ${c}.`,
        };
      }
    },
  },
  {
    id: "m-t-mult2", grades: ["4", "5"], standard: "NC.4.NBT.5", skill: "Multi-digit multiplication and division",
    make(rand) {
      for (;;) {
        const a = ri(rand, 12, 49), b = ri(rand, 3, 9);
        const c = a * b;
        if (rand() < 0.5) {
          return {
            prompt: BUILD, tokens: [String(a), "×", String(b), "=", String(c)], check: { kind: "num" },
            pool: nearMisses(c, `${a} × ${b}`, [b, -b, 10, a]),
            explain: `${a} × ${b} = ${Math.floor(a / 10) * 10} × ${b} + ${a % 10} × ${b} = ${c}.`,
          };
        }
        return {
          prompt: BUILD, tokens: [String(c), "÷", String(b), "=", String(a)], check: { kind: "num" },
          pool: nearMisses(a, `${c} ÷ ${b}`, [1, -1, 10]),
          explain: `${c} ÷ ${b} = ${a}, because ${a} × ${b} = ${c}.`,
        };
      }
    },
  },
  {
    id: "m-t-paren", grades: ["5"], standard: "NC.5.OA.1", skill: "Parentheses in expressions",
    make(rand) {
      for (;;) {
        const a = ri(rand, 1, 6), b = ri(rand, 2, 7), c = ri(rand, 2, 6);
        const d = (a + b) * c;
        const wrong = a + b * c;
        if (a === b || c === d || wrong === d) continue;
        const g = `(${a}+${b})`;
        return {
          prompt: BUILD, tokens: [g, "×", String(c), "=", String(d)], check: { kind: "num" },
          pool: [
            { label: String(wrong), why: `Parentheses come first: ${a} + ${b} = ${a + b}, then × ${c} = ${d}.` },
            ...nearMisses(d, `(${a} + ${b}) × ${c}`, [c, -c, 1]),
          ],
          explain: `Work inside the parentheses first: ${a} + ${b} = ${a + b}, and ${a + b} × ${c} = ${d}.`,
        };
      }
    },
  },
  {
    id: "m-t-dec", grades: ["5"], standard: "NC.5.NBT.7", skill: "Decimal operations",
    make(rand) {
      const [x, k] = pickOne(rand, [[0.5, 2], [0.2, 5], [0.25, 4], [1.5, 2]] as const);
      const m = ri(rand, 2, 9) * k;
      const p = Math.round(x * m * 100) / 100;
      return {
        prompt: BUILD, tokens: [String(x), "×", String(m), "=", fmt(p)], check: { kind: "num" },
        pool: [
          { label: fmt(p * 10), why: `${x} × ${m} = ${fmt(p)}. Check where the decimal point goes.` },
          ...nearMisses(p, `${x} × ${m}`, [1, -1]),
        ],
        explain: `${x} × ${m} = ${fmt(p)}.`,
      };
    },
  },
  {
    id: "m-t-exp", grades: ["6"], standard: "NC.6.EE.1", skill: "Whole-number exponents",
    make(rand) {
      for (;;) {
        const base = ri(rand, 2, 6), e = base <= 3 ? pickOne(rand, [2, 3]) : 2;
        const add = ri(rand, 1, 9);
        const v = base ** e + add;
        const sup = e === 2 ? "²" : "³";
        if (add === base || add === v) continue;
        return {
          prompt: BUILD, tokens: [`${base}${sup}`, "+", String(add), "=", String(v)], check: { kind: "num" },
          pool: [
            { label: String(base * e + add), why: `${base}${sup} means ${Array(e).fill(base).join(" × ")} = ${base ** e}, not ${base} × ${e}.` },
            ...nearMisses(v, `${base}${sup} + ${add}`, [1, -1]),
          ],
          explain: `${base}${sup} = ${base ** e}, so ${base}${sup} + ${add} = ${v}.`,
        };
      }
    },
  },
  {
    id: "m-t-solve1", grades: ["6"], standard: "NC.6.EE.7", skill: "One-step equations",
    make(rand) {
      const x = ri(rand, 2, 15), p = ri(rand, 2, 12);
      const q = x + p;
      return {
        prompt: `Solve x + ${p} = ${q}. Build the answer.`, tokens: ["x", "=", String(x)], check: { kind: "solve", x },
        pool: [
          { label: String(q + p), why: `Subtract ${p} from both sides: x = ${q} − ${p} = ${x}.` },
          ...nearMisses(x, `x = ${q} − ${p}`, [1, -1]),
        ],
        explain: `x + ${p} = ${q}, so x = ${q} − ${p} = ${x}.`,
      };
    },
  },
  {
    id: "m-t-int", grades: ["7"], standard: "NC.7.NS.1", skill: "Adding integers",
    make(rand) {
      for (;;) {
        const a = -ri(rand, 2, 12), b = ri(rand, 2, 15);
        const c = a + b;
        if (c === 0 || Math.abs(c) === Math.abs(a) || c === b || -a === b) continue;
        return {
          prompt: BUILD, tokens: [neg(a), "+", String(b), "=", neg(c)], check: { kind: "num" },
          pool: [
            { label: neg(-c), why: `${neg(a)} + ${b} = ${neg(c)}. Check the sign: ${Math.abs(b) > Math.abs(a) ? "the positive number is bigger" : "the negative number is bigger"}.` },
            { label: neg(a - b), why: `${neg(a)} + ${b} moves ${b} to the right of ${neg(a)}: ${neg(c)}.` },
            ...nearMisses(c, `${neg(a)} + ${b}`, [1]),
          ],
          explain: `${neg(a)} + ${b} = ${neg(c)}.`,
        };
      }
    },
  },
  {
    id: "m-t-intmul", grades: ["7"], standard: "NC.7.NS.2", skill: "Multiplying integers",
    make(rand) {
      for (;;) {
        const a = -ri(rand, 2, 9), b = ri(rand, 2, 9);
        const c = a * b;
        if (-a === b) continue;
        return {
          prompt: BUILD, tokens: [neg(a), "×", String(b), "=", neg(c)], check: { kind: "num" },
          pool: [
            { label: neg(-c), why: `A negative times a positive is negative: ${neg(c)}.` },
            ...nearMisses(c, `${neg(a)} × ${b}`, [a, 1]),
          ],
          explain: `Negative × positive = negative, so ${neg(a)} × ${b} = ${neg(c)}.`,
        };
      }
    },
  },
  {
    id: "m-t-solve2", grades: ["7", "8"], standard: "NC.7.EE.4", skill: "Two-step equations",
    make(rand) {
      const x = ri(rand, 2, 9), a = ri(rand, 2, 6), b = ri(rand, 1, 9);
      const c = a * x + b;
      return {
        prompt: `Solve ${a}x + ${b} = ${c}. Build the answer.`, tokens: ["x", "=", String(x)], check: { kind: "solve", x },
        pool: [
          { label: String(x + 1), why: `${a}(${x + 1}) + ${b} = ${a * (x + 1) + b}, not ${c}.` },
          { label: fmt((c + b) / a), why: `Subtract ${b} first (don't add): ${a}x = ${c - b}, so x = ${x}.` },
          { label: String(c - b), why: `${c - b} is ${a}x. Divide by ${a}: x = ${x}.` },
        ],
        explain: `${a}x + ${b} = ${c} → ${a}x = ${c - b} → x = ${x}.`,
      };
    },
  },
  {
    id: "m-t-root", grades: ["8"], standard: "NC.8.EE.2", skill: "Square roots",
    make(rand) {
      for (;;) {
        const r = ri(rand, 3, 12), add = ri(rand, 1, 9);
        const v = r + add;
        if (add === r || add === v) continue;
        return {
          prompt: BUILD, tokens: [`√${r * r}`, "+", String(add), "=", String(v)], check: { kind: "num" },
          pool: [
            { label: String((r * r) / 2 + add), why: `√${r * r} is ${r} (because ${r} × ${r} = ${r * r}), not half of ${r * r}.` },
            ...nearMisses(v, `√${r * r} + ${add}`, [1, -1]),
          ],
          explain: `√${r * r} = ${r}, so √${r * r} + ${add} = ${v}.`,
        };
      }
    },
  },
  {
    id: "m-t-exprule", grades: ["8"], standard: "NC.8.EE.1", skill: "Properties of exponents",
    make(rand) {
      const SUP = ["⁰", "¹", "²", "³", "⁴", "⁵", "⁶"];
      for (;;) {
        const base = pickOne(rand, [2, 3, 5]), m = ri(rand, 2, 4), n = ri(rand, 2, 6 - m);
        if (m === n || m + n > 6) continue;
        return {
          prompt: BUILD, tokens: [`${base}${SUP[m]}`, "×", `${base}${SUP[n]}`, "=", `${base}${SUP[m + n]}`], check: { kind: "num" },
          pool: m * n <= 6 && m * n !== m + n
            ? [{ label: `${base}${SUP[m * n]}`, why: `Multiplying powers of the same base adds the exponents: ${m} + ${n} = ${m + n}.` }]
            : [{ label: `${base * base}${SUP[m + n]}`, why: `Keep the base ${base}; add the exponents.` }],
          explain: `aᵐ × aⁿ = aᵐ⁺ⁿ, so ${base}${SUP[m]} × ${base}${SUP[n]} = ${base}${SUP[m + n]}.`,
        };
      }
    },
  },
  {
    id: "m-t-solve3", grades: ["8"], standard: "NC.8.EE.7", skill: "Multi-step equations",
    make(rand) {
      const x = ri(rand, 4, 12), a = ri(rand, 2, 5), b = ri(rand, 1, 3);
      const c = a * (x - b);
      return {
        prompt: `Solve ${a}(x − ${b}) = ${c}. Build the answer.`, tokens: ["x", "=", String(x)], check: { kind: "solve", x },
        pool: [
          { label: String(c / a - b), why: `x − ${b} = ${c / a}, so add ${b}: x = ${x}.` },
          { label: String(x + 1), why: `${a}(${x + 1} − ${b}) = ${a * (x + 1 - b)}, not ${c}.` },
          { label: String(c - b), why: `Divide by ${a} first: x − ${b} = ${c / a}, so x = ${x}.` },
        ],
        explain: `Divide by ${a}: x − ${b} = ${c / a}. Add ${b}: x = ${x}.`,
      };
    },
  },
  {
    id: "m-t-solvehs", grades: ["9"], standard: "NC.M1.A-REI.3", skill: "Solve linear equations",
    make(rand) {
      const x = ri(rand, -6, 12), a = ri(rand, 2, 7), b = ri(rand, 2, 15);
      if (x === 0) return this.make(rand);
      const c = a * x - b;
      return {
        prompt: `Solve ${a}x − ${b} = ${neg(c)}. Build the answer.`, tokens: ["x", "=", neg(x)], check: { kind: "solve", x },
        pool: [
          { label: neg(-x), why: `${a}(${neg(-x)}) − ${b} = ${neg(-a * x - b)}. Check the sign.` },
          { label: fmt((c - b) / a), why: `Add ${b} to both sides (don't subtract): ${a}x = ${neg(c + b)}.` },
          { label: neg(x + 1), why: `${a}(${neg(x + 1)}) − ${b} = ${neg(a * (x + 1) - b)}, not ${neg(c)}.` },
        ],
        explain: `${a}x − ${b} = ${neg(c)} → ${a}x = ${neg(c + b)} → x = ${neg(x)}.`,
      };
    },
  },
  {
    id: "m-t-dist", grades: ["9"], standard: "NC.M1.A-SSE.1", skill: "Equivalent expressions",
    make(rand) {
      for (;;) {
        const a = ri(rand, 2, 6), b = ri(rand, 2, 9);
        if (a === b || a * b === a || a * b === b) continue;
        return {
          prompt: "Build a true identity (true for every x).", tokens: [String(a), `(x+${b})`, "=", `${a}x`, "+", String(a * b)], check: { kind: "identity" },
          pool: [
            { label: String(b), why: `Distribute: ${a}(x + ${b}) = ${a}x + ${a * b}. Multiply ${b} by ${a} too.` },
            { label: String(a + b), why: `${a} × ${b} = ${a * b}, not ${a + b}.` },
          ],
          explain: `The distributive property: ${a}(x + ${b}) = ${a}x + ${a * b}.`,
        };
      }
    },
  },
  {
    id: "m-t-factor", grades: ["9", "10"], standard: "NC.M1.A-SSE.3", skill: "Factoring quadratics",
    make(rand) {
      for (;;) {
        const p = ri(rand, 1, 6), q = ri(rand, 2, 7);
        if (p === q) continue;
        const tri = `x²+${p + q}x+${p * q}`;
        return {
          prompt: "Build a true identity (true for every x).", tokens: [`(x+${p})`, `(x+${q})`, "=", tri], check: { kind: "identity" },
          pool: [
            { label: `(x+${p + 1})`, why: `(x+${p + 1})(x+${q}) = x²+${p + 1 + q}x+${(p + 1) * q}, not ${tri}.` },
            { label: `(x−${p})`, why: `(x−${p})(x+${q}) ends in −${p * q}, not +${p * q}.` },
            { label: `x²+${p * q}x+${p + q}`, why: `Multiply it out: (x+${p})(x+${q}) = ${tri}. The numbers ${p} and ${q} add to ${p + q} and multiply to ${p * q}.` },
          ],
          explain: `${p} + ${q} = ${p + q} and ${p} × ${q} = ${p * q}, so ${tri} = (x+${p})(x+${q}).`,
        };
      }
    },
  },
  {
    id: "m-t-ratexp", grades: ["10", "11"], standard: "NC.M2.N-RN.2", skill: "Rational exponents",
    make(rand) {
      const [label, v] = pickOne(rand, [
        ["8^(2/3)", 4], ["27^(2/3)", 9], ["16^(3/4)", 8], ["4^(3/2)", 8], ["9^(3/2)", 27], ["25^(1/2)", 5], ["32^(2/5)", 4], ["64^(1/3)", 4], ["16^(1/2)", 4], ["125^(1/3)", 5],
      ] as [string, number][]);
      const add = ri(rand, 1, 9);
      if (add === v || add === v + add) return this.make(rand);
      return {
        prompt: BUILD, tokens: [label, "+", String(add), "=", String(v + add)], check: { kind: "num" },
        pool: [
          ...nearMisses(v + add, `${label} + ${add}`, [1, -1, v]),
        ],
        explain: `a^(m/n) is the nth root of a, raised to the m: ${label} = ${v}, so the sum is ${v + add}.`,
      };
    },
  },
  {
    id: "m-t-log", grades: ["11", "12"], standard: "NC.M3.F-LE.4", skill: "Logarithms",
    make(rand) {
      const SUB: Record<number, string> = { 2: "₂", 3: "₃", 10: "" };
      const base = pickOne(rand, [2, 3, 10]);
      const e = base === 10 ? ri(rand, 1, 4) : ri(rand, 2, base === 2 ? 6 : 4);
      const arg = base ** e;
      const label = base === 10 ? `log ${arg}` : `log${SUB[base]}${arg}`;
      const add = ri(rand, 1, 9);
      if (add === e || add === e + add) return this.make(rand);
      return {
        prompt: BUILD, tokens: [label, "+", String(add), "=", String(e + add)], check: { kind: "num" },
        pool: [
          { label: String(arg / base + add), why: `${label} asks: ${base} to what power is ${arg}? It's ${e}, not ${arg} ÷ ${base}.` },
          ...nearMisses(e + add, `${label} + ${add}`, [1, -1]),
        ],
        explain: `${base}^${e} = ${arg}, so ${label} = ${e} and ${label} + ${add} = ${e + add}.`,
      };
    },
  },
  {
    id: "m-t-trig", grades: ["12"], standard: "NC.M3.F-TF.2", skill: "Trig values of special angles",
    make(rand) {
      const [label, v] = pickOne(rand, [
        ["sin 30°", 0.5], ["cos 60°", 0.5], ["sin 90°", 1], ["cos 0°", 1], ["tan 45°", 1], ["cos 180°", -1], ["sin 150°", 0.5], ["cos 120°", -0.5],
      ] as [string, number][]);
      const m = pickOne(rand, [4, 6, 8, 10]);
      return {
        prompt: BUILD, tokens: [label, "×", String(m), "=", neg(v * m)], check: { kind: "num" },
        pool: [
          { label: neg(-v * m), why: `${label} = ${neg(v)}. Check the sign on the unit circle.` },
          { label: neg(v * m + 1), why: `${label} = ${neg(v)}, so × ${m} gives ${neg(v * m)}.` },
        ],
        explain: `${label} = ${neg(v)} (unit circle), so ${label} × ${m} = ${neg(v * m)}.`,
      };
    },
  },
];

/** Substituting a distractor for any one token must never give a true equation. */
function safeDistractors(tokens: string[], check: Check, pool: Distractor[], want: number, rand: Rand): Distractor[] | null {
  const seen = new Set(tokens);
  const ok = pool.filter((d) => {
    if (seen.has(d.label)) return false;
    seen.add(d.label);
    return tokens.every((_, i) => trueOrders(tokens.map((t, j) => (j === i ? d.label : t)), check).length === 0);
  });
  const chosen = ok.sort(() => rand() - 0.5).slice(0, want);
  return chosen.length ? chosen : null;
}

let seq = 0;
/** A fresh build item from a template. `distractors` is how many wrong cubes to add. */
export function makeMathBuild(t: MathTemplate, rand: Rand, distractors: number): BuiltItem {
  for (let tries = 0; tries < 40; tries++) {
    const d = t.make(rand);
    if (new Set(d.tokens).size !== d.tokens.length) continue;
    const orders = trueOrders(d.tokens, d.check);
    const canonical = d.tokens.join(" ");
    if (!orders.some((o) => o.join(" ") === canonical)) throw new Error(`${t.id}: "${canonical}" is not true`);
    const dis = safeDistractors(d.tokens, d.check, d.pool, distractors, rand);
    if (!dis) continue;
    // Canonical order first.
    orders.sort((a, b) => (a.join(" ") === canonical ? -1 : b.join(" ") === canonical ? 1 : 0));
    return {
      id: `${t.id}-${++seq}`, subject: "math", grades: t.grades, standard: t.standard, skill: t.skill,
      prompt: d.prompt, tokens: d.tokens, distractors: dis, explain: d.explain, orders,
    };
  }
  throw new Error(`${t.id}: no safe distractors`);
}

/* ------------------------------------------------------------------------------------------ */

function mr(
  id: string, grades: Grade[], standard: string, skill: string, target: string, prompt: string,
  pool: string[], test: (label: string) => boolean, why: (label: string, match: boolean) => string,
): CategoryRule {
  return {
    id, subject: "math", grades, standard, skill, target, prompt,
    yes: pool.filter(test), no: pool.filter((l) => !test(l)),
    yesWhy: "", noWhy: "", test, why,
  };
}

const num = (l: string) => valueOf(l);
const eqTo = (target: number) => (l: string) => Math.abs(num(l) - target) < 1e-9;
const range = (a: number, b: number) => Array.from({ length: b - a + 1 }, (_, i) => String(a + i));
const sq = (n: number) => Number.isInteger(Math.sqrt(n));

/** Irrational: a square root of a non-square whole number, or a multiple of π; everything else here is rational. */
export function isIrrationalLabel(l: string): boolean {
  if (/π/.test(l)) return true;
  const m = /^(\d*)√(\d+)$/.exec(l);
  return !!m && !sq(Number(m[2]));
}

export const MATH_RULES: CategoryRule[] = [
  // ------------------------------------------------------------------ K-2
  mr("m-r-eq5", ["K", "1"], "NC.K.OA.3", "Ways to make 5", "EQUALS 5", "Color the cubes that EQUAL 5.",
    ["1+4", "2+3", "3+2", "4+1", "5+0", "0+5", "6−1", "7−2", "2+2", "3+3", "1+3", "4+2", "8−2", "6−3", "1+1", "9−3"],
    eqTo(5), (l, ok) => (ok ? `${l} = 5.` : `${l} = ${fmt(num(l))}, not 5.`)),
  mr("m-r-teen", ["K", "1"], "NC.K.NBT.1", "Teen numbers", "TEEN NUMBERS", "Color the TEEN numbers (11 to 19): ten and some more.",
    range(1, 20), (l) => num(l) >= 11 && num(l) <= 19,
    (l, ok) => (ok ? `${l} is ten and ${num(l) - 10} more.` : num(l) < 11 ? `${l} is less than 11.` : `${l} is 2 tens, not a teen number.`)),
  mr("m-r-ten", ["1", "2"], "NC.1.OA.6", "Make ten", "MAKES 10", "Color the cubes that MAKE 10.",
    ["1+9", "2+8", "3+7", "4+6", "6+4", "7+3", "8+2", "9+1", "5+4", "6+5", "3+8", "2+7", "4+4", "9+2", "7+4", "5+3"],
    eqTo(10), (l, ok) => (ok ? `${l} = 10.` : `${l} = ${fmt(num(l))}, not 10.`)),
  mr("m-r-gt50", ["1"], "NC.1.NBT.3", "Compare two-digit numbers", "MORE THAN 50", "Color the numbers MORE THAN 50.",
    ["51", "57", "63", "70", "75", "82", "89", "96", "15", "25", "38", "42", "49", "50", "19", "5"],
    (l) => num(l) > 50, (l, ok) => (ok ? `${l} > 50.` : num(l) === 50 ? "50 is equal to 50, not more." : `${l} < 50: it has fewer tens.`)),
  mr("m-r-even", ["2"], "NC.2.OA.3", "Odd and even", "EVEN NUMBERS", "Color the EVEN numbers.",
    range(1, 20), (l) => num(l) % 2 === 0,
    (l, ok) => (ok ? `${l} is even: it makes pairs with none left over.` : `${l} is odd: one is left over when you make pairs.`)),
  mr("m-r-eq15", ["2"], "NC.2.OA.2", "Add and subtract within 20", "EQUALS 15", "Color the cubes that EQUAL 15.",
    ["8+7", "9+6", "7+8", "10+5", "20−5", "18−3", "6+9", "17−2", "8+8", "9+7", "20−6", "7+7", "19−3", "6+8", "16−2", "10+4"],
    eqTo(15), (l, ok) => (ok ? `${l} = 15.` : `${l} = ${fmt(num(l))}, not 15.`)),
  // ------------------------------------------------------------------ 3-5
  mr("m-r-mult4", ["3"], "NC.3.OA.7", "Multiples", "MULTIPLES OF 4", "Color the MULTIPLES OF 4.",
    ["4", "8", "12", "16", "20", "24", "28", "32", "36", "6", "10", "14", "18", "22", "26", "30", "34", "15"],
    (l) => num(l) % 4 === 0,
    (l, ok) => (ok ? `${l} = 4 × ${num(l) / 4}.` : `${l} ÷ 4 leaves a remainder of ${num(l) % 4}.`)),
  mr("m-r-half", ["3", "4"], "NC.3.NF.3", "Equivalent fractions", "EQUALS 1/2", "Color the fractions EQUAL TO 1/2.",
    ["1/2", "2/4", "3/6", "4/8", "5/10", "6/12", "7/14", "8/16", "1/3", "2/3", "3/4", "1/4", "2/6", "3/8", "5/8", "4/6", "2/5"],
    eqTo(0.5), (l, ok) => {
      const [a, b] = l.split("/").map(Number);
      return ok ? `${l}: ${a} is half of ${b}.` : `${l} is ${a / b > 0.5 ? "more" : "less"} than 1/2: half of ${b} is ${b / 2}.`;
    }),
  mr("m-r-prod24", ["3", "4"], "NC.3.OA.7", "Multiplication facts", "PRODUCT 24", "Color the products that EQUAL 24.",
    ["3×8", "4×6", "6×4", "8×3", "2×12", "12×2", "24×1", "1×24", "5×5", "3×7", "4×5", "6×3", "2×11", "9×3", "4×7", "5×4"],
    eqTo(24), (l, ok) => (ok ? `${l} = 24.` : `${l} = ${fmt(num(l))}, not 24.`)),
  mr("m-r-prime", ["4", "5"], "NC.4.OA.4", "Prime numbers", "PRIMES", "Color the PRIME numbers (exactly two factors).",
    ["2", "3", "5", "7", "11", "13", "17", "19", "23", "29", "31", "1", "4", "9", "15", "21", "25", "27", "33", "39", "49", "51"],
    (l) => isPrime(num(l)),
    (l, ok) => {
      const v = num(l);
      if (ok) return `${l} is prime: its only factors are 1 and ${l}.`;
      if (v === 1) return "1 has only one factor, so it is not prime.";
      let f = 2;
      while (v % f) f++;
      return `${l} = ${f} × ${v / f}, so it is composite.`;
    }),
  mr("m-r-fac36", ["4"], "NC.4.OA.4", "Factors", "FACTORS OF 36", "Color the FACTORS OF 36.",
    ["1", "2", "3", "4", "6", "9", "12", "18", "36", "5", "7", "8", "10", "14", "16", "24", "15", "27"],
    (l) => 36 % num(l) === 0,
    (l, ok) => (ok ? `${l} × ${36 / num(l)} = 36.` : `36 ÷ ${l} leaves a remainder, so ${l} is not a factor.`)),
  mr("m-r-ops10", ["5"], "NC.5.OA.1", "Order of operations", "EQUALS 10", "Color the expressions that EQUAL 10.",
    ["2×(3+2)", "(4+1)×2", "20÷2", "4+3×2", "(8+12)÷2", "18−4×2", "2+2×4", "30÷3", "(4+3)×2", "2×3+2", "4×(3+2)", "(18−4)×2", "2+4×4", "12−6÷2", "(6+4)÷5", "3+3×3"],
    eqTo(10), (l, ok) => (ok ? `${l} = 10 (parentheses first, then × and ÷, then + and −).` : `${l} = ${fmt(num(l))}: parentheses first, then × and ÷, then + and −.`)),
  mr("m-r-gthalf", ["5"], "NC.5.NBT.3", "Compare decimals", "MORE THAN 0.5", "Color the decimals GREATER THAN 0.5.",
    ["0.6", "0.75", "0.8", "0.52", "0.9", "0.51", "0.65", "0.7", "0.45", "0.09", "0.5", "0.25", "0.3", "0.05", "0.49", "0.1"],
    (l) => num(l) > 0.5,
    (l, ok) => (ok ? `${l} > 0.5.` : num(l) === 0.5 ? "0.5 equals 0.5; it isn't greater." : `${l} < 0.5: compare the tenths first.`)),
  // ------------------------------------------------------------------ 6-8
  mr("m-r-eq16", ["6"], "NC.6.EE.1", "Exponents", "EQUALS 16", "Color the expressions that EQUAL 16.",
    ["4²", "2⁴", "16¹", "8+2³", "2³×2", "32÷2", "4×2²", "10+6", "2³", "3²", "4³", "6²", "2⁵", "8²", "2×4²", "4+2²"],
    eqTo(16), (l, ok) => (ok ? `${l} = 16.` : `${l} = ${fmt(num(l))}, not 16.`)),
  mr("m-r-ineq", ["6"], "NC.6.EE.8", "Inequalities", "x + 4 > 9", "Color the values of x that make x + 4 > 9 true.",
    ["6", "7", "8", "9", "10", "12", "15", "5.5", "5", "4", "3", "0", "1", "2", "4.5", "4.9"],
    (l) => num(l) + 4 > 9,
    (l, ok) => (ok ? `${l} + 4 = ${fmt(num(l) + 4)}, which is greater than 9.` : `${l} + 4 = ${fmt(num(l) + 4)}, which is not greater than 9.`)),
  mr("m-r-lcm", ["6"], "NC.6.NS.4", "Common multiples", "MULTIPLE OF 4 & 6", "Color the COMMON MULTIPLES of 4 and 6.",
    ["12", "24", "36", "48", "60", "72", "84", "96", "8", "16", "18", "20", "30", "42", "28", "54"],
    (l) => num(l) % 4 === 0 && num(l) % 6 === 0,
    (l, ok) => (ok ? `${l} is a multiple of both 4 and 6 (and of their LCM, 12).` : `${l} is ${num(l) % 4 === 0 ? "a multiple of 4 but not of 6" : num(l) % 6 === 0 ? "a multiple of 6 but not of 4" : "a multiple of neither"}.`)),
  mr("m-r-negative", ["7"], "NC.7.NS.1", "Adding and subtracting integers", "NEGATIVE", "Color the expressions with a NEGATIVE value.",
    ["3−8", "−2+1", "−4×2", "5−9", "−6+4", "2−10", "−9+3", "−1−1", "8−3", "−2+7", "−3×−4", "10−4", "−5+5", "6−2", "−8÷−2", "−1+9"],
    (l) => num(l) < 0,
    (l, ok) => (ok ? `${l} = ${fmt(num(l))}, which is negative.` : num(l) === 0 ? `${l} = 0, which is neither positive nor negative.` : `${l} = ${fmt(num(l))}, which is positive.`)),
  mr("m-r-negmul", ["7"], "NC.7.NS.2", "Multiplying and dividing integers", "EQUALS −12", "Color the expressions that EQUAL −12.",
    ["−3×4", "3×(−4)", "−24÷2", "−6×2", "4×(−3)", "12÷(−1)", "−2×6", "36÷(−3)", "−3×(−4)", "−24÷(−2)", "6×2", "−6×(−2)", "−15+3", "−4×−3", "2×(−5)", "−20÷4", "−4×4"],
    eqTo(-12), (l, ok) => (ok ? `${l} = −12: the signs are different, so the answer is negative.` : `${l} = ${fmt(num(l))}, not −12.`)),
  mr("m-r-squares", ["8"], "NC.8.EE.2", "Perfect squares", "PERFECT SQUARES", "Color the PERFECT SQUARES.",
    ["1", "4", "9", "16", "25", "36", "49", "64", "81", "100", "121", "144", "8", "12", "18", "24", "32", "50", "72", "90", "99", "125"],
    (l) => sq(num(l)),
    (l, ok) => (ok ? `${l} = ${Math.sqrt(num(l))} × ${Math.sqrt(num(l))}.` : `${l} is between ${Math.floor(Math.sqrt(num(l))) ** 2} and ${Math.ceil(Math.sqrt(num(l))) ** 2}, so it is not a perfect square.`)),
  mr("m-r-irrational", ["8", "9"], "NC.8.NS.1", "Rational and irrational numbers", "IRRATIONAL", "Color the IRRATIONAL numbers.",
    ["√2", "√3", "π", "√5", "√8", "√10", "2π", "√12", "√15", "√4", "√9", "0.5", "3/4", "√16", "−7", "√25", "1.25", "√49"],
    isIrrationalLabel,
    (l, ok) => (ok ? `${l} is irrational: its decimal never ends or repeats.` : /√/.test(l) ? `${l} = ${fmt(num(l))}, a whole number, so it is rational.` : `${l} can be written as a fraction, so it is rational.`)),
  // ------------------------------------------------------------------ 9-12
  mr("m-r-ineqhs", ["9", "10"], "NC.M1.A-REI.3", "Linear inequalities", "3x − 2 > 7", "Color the values of x that make 3x − 2 > 7 true.",
    ["4", "5", "6", "3.5", "10", "7", "3.1", "8", "3", "2", "0", "−3", "1", "2.9", "−4", "−1"],
    (l) => 3 * num(l) - 2 > 7,
    (l, ok) => `3(${l}) − 2 = ${fmt(3 * num(l) - 2)}, which is ${ok ? "greater than 7" : "not greater than 7"}. (x > 3)`),
  mr("m-r-quarter", ["9", "10", "11"], "NC.M1.N-RN.2", "Exponent rules", "EQUALS 1/4", "Color the expressions that EQUAL 1/4.",
    ["2⁻²", "4⁻¹", "0.25", "(1/2)²", "1/4", "3/12", "25%", "16^(−1/2)", "2⁻¹", "4²", "0.4", "(1/2)⁻²", "1/2", "2/4", "40%", "4^(1/2)"],
    eqTo(0.25), (l, ok) => (ok ? `${l} = 1/4.` : `${l} = ${fmt(num(l))}, not 1/4 (0.25).`)),
  mr("m-r-eq8", ["10", "11", "12"], "NC.M2.N-RN.2", "Rational exponents", "EQUALS 8", "Color the expressions that EQUAL 8.",
    ["2³", "√64", "4^(3/2)", "64^(1/2)", "16^(3/4)", "(1/2)⁻³", "2⁶÷2³", "512^(1/3)", "2⁴", "3²", "8^(1/3)", "4^(1/2)", "2⁻³", "64^(1/3)", "16^(1/2)", "√8"],
    eqTo(8), (l, ok) => (ok ? `${l} = 8.` : `${l} = ${fmt(num(l))}, not 8.`)),
  mr("m-r-negquad", ["10", "11"], "NC.M2.F-IF.4", "Interpreting quadratic functions", "x² − 4 < 0", "Color the x-values where f(x) = x² − 4 is NEGATIVE.",
    ["−1.5", "−1", "−0.5", "0", "0.5", "1", "1.5", "1.9", "−3", "−2", "2", "2.5", "3", "4", "−2.5", "5"],
    (l) => num(l) ** 2 - 4 < 0,
    (l, ok) => `f(${l}) = ${fmt(num(l) ** 2 - 4)}, ${ok ? "below zero (between the zeros −2 and 2)" : "not below zero"}.`),
  mr("m-r-log2", ["11", "12"], "NC.M3.F-LE.4", "Logarithms", "WHOLE-NUMBER LOG", "Color the logs that equal a WHOLE NUMBER.",
    ["log₂1", "log₂2", "log₂4", "log₂8", "log₂16", "log₂32", "log₂64", "log₂128", "log₂3", "log₂5", "log₂6", "log₂10", "log₂12", "log₂20", "log₂7", "log₂9"],
    (l) => Math.abs(num(l) - Math.round(num(l))) < 1e-9,
    (l, ok) => {
      const a = Number(l.replace("log₂", ""));
      return ok ? `2^${Math.round(num(l))} = ${a}, so ${l} = ${Math.round(num(l))}.` : `${a} is not a power of 2, so ${l} ≈ ${fmt(num(l))}.`;
    }),
  mr("m-r-trighalf", ["11", "12"], "NC.M3.F-TF.2", "Unit circle values", "EQUALS 1/2", "Color the values that EQUAL 1/2.",
    ["sin 30°", "cos 60°", "sin 150°", "cos 300°", "0.5", "2⁻¹", "tan 45°÷2", "cos 420°", "sin 60°", "cos 30°", "sin 90°", "cos 120°", "tan 45°", "sin 210°", "cos 0°", "sin 0°"],
    eqTo(0.5), (l, ok) => (ok ? `${l} = 1/2.` : `${l} = ${fmt(num(l))}, not 1/2.`)),
];
