/* Grade 6 - Grade 8 generators (NC.6.*, NC.7.*, NC.8.*). */
import {
  chance, dec, distinctInts, fdiv, fr, fracs, fstr, type Gen, gcd, lcm, lin, MINUS,
  mixed, money, n, ns, nums, nz, padPoint, paren, pick, PI, point, pow, randInt, shuffle, sup, xPlus,
} from "./core";

const TRIPLES: [number, number, number][] = [
  [3, 4, 5], [6, 8, 10], [5, 12, 13], [9, 12, 15], [8, 15, 17], [12, 16, 20], [7, 24, 25], [15, 20, 25], [20, 21, 29], [10, 24, 26],
];

const pct = (v: number) => `${v}%`;
const deg = (v: number) => `${v}°`;

// ======================================================================== Grade 6

export const GRADE_6: Gen[] = [
  {
    key: "rp3u",
    standard: "NC.6.RP.3",
    skill: "Unit rates",
    make() {
      const unit = randInt(2, 12);
      const k = randInt(3, 9);
      if (chance()) {
        const thing = pick(["notebooks", "tickets", "pens", "snacks", "games"]);
        const total = unit * k;
        return {
          prompt: `${k} ${thing} cost $${total}. How much does 1 cost?`,
          ...nums(unit, [total * k, total - k, unit + 1, k], { min: 1, fmt: (v) => `$${v}` }),
          explanation: `Divide the total by the number of items: $${total} ÷ ${k} = $${unit} each.`,
        };
      }
      const speed = unit * 10;
      return {
        prompt: `A car goes ${speed * k} miles in ${k} hours. How many miles per hour is that?`,
        ...nums(speed, [speed * k * k, speed * k - k, speed + 10, speed * 2], { min: 1, fmt: (v) => `${v} mph` }),
        explanation: `Miles per hour = miles ÷ hours = ${speed * k} ÷ ${k} = ${speed}.`,
      };
    },
  },
  {
    key: "rp3r",
    standard: "NC.6.RP.3",
    skill: "Equivalent ratios",
    make() {
      let a = randInt(2, 9);
      let b = randInt(2, 9);
      if (a === b) b += 1;
      const g = gcd(a, b);
      a /= g;
      b /= g;
      const k = randInt(2, 6);
      const [x, y] = pick([["red", "blue"], ["cats", "dogs"], ["boys", "girls"], ["cups of flour", "cups of sugar"]]);
      return {
        prompt: `The ratio of ${x} to ${y} is ${a}:${b}. If there are ${b * k} ${y}, how many ${x} are there?`,
        ...nums(a * k, [a + (b * k - b), b * k * a, a * k + a, b * k - a], { min: 1 }),
        explanation: `${b} × ${k} = ${b * k}, so multiply ${a} by ${k} too: ${a} × ${k} = ${a * k}.`,
      };
    },
  },
  {
    key: "rp4",
    standard: "NC.6.RP.4",
    skill: "Percent",
    make() {
      const p = pick([5, 10, 20, 25, 30, 40, 50, 60, 75, 80]);
      let whole = 20 * randInt(1, 10);
      while ((p * whole) % 100 !== 0) whole += 20;
      const part = (p * whole) / 100;
      if (chance(0.6)) {
        return {
          prompt: `What is ${p}% of ${whole}?`,
          ...nums(part, [(p * whole) / 10, whole - p, part * 10, whole - part], { min: 0 }),
          explanation: `${p}% means ${p} per 100: ${p}/100 × ${whole} = ${part}.`,
        };
      }
      return {
        prompt: `${part} is what percent of ${whole}?`,
        ...nums(p, [100 - p, part, p * 2, p + 5], { min: 1, fmt: pct }),
        explanation: `Divide the part by the whole: ${part} ÷ ${whole} = ${dec(p, 2)}, which is ${p}%.`,
      };
    },
  },
  {
    key: "ns1",
    standard: "NC.6.NS.1",
    skill: "Divide fractions",
    make() {
      const b = randInt(2, 9);
      const d = randInt(2, 9);
      const a = randInt(1, b - 1);
      const c = randInt(1, d - 1);
      const q = fdiv(fr(a, b), fr(c, d));
      return {
        prompt: `What is ${a}/${b} ÷ ${c}/${d}?`,
        ...fracs(q, [fr(a * c, b * d), fr(b * c, a * d), fr(a + d, b + c), fr(a * d + 1, b * c)], mixed, { positive: true }),
        explanation: `Multiply by the reciprocal: ${a}/${b} × ${d}/${c} = ${a * d}/${b * c}${mixed(q) !== `${a * d}/${b * c}` ? ` = ${mixed(q)}` : ""}.`,
      };
    },
  },
  {
    key: "ns4g",
    standard: "NC.6.NS.4",
    skill: "Greatest common factor",
    make() {
      const g = randInt(2, 12);
      let m1 = 0;
      let m2 = 0;
      while (m1 === m2 || gcd(m1, m2) !== 1) {
        m1 = randInt(1, 9);
        m2 = randInt(2, 9);
      }
      const a = g * m1;
      const b = g * m2;
      const smaller = [2, 3, 4, 6].map((f) => g / f).filter((v) => Number.isInteger(v) && v > 1);
      return {
        prompt: `What is the GCF of ${a} and ${b}?`,
        ...nums(g, [lcm(a, b), a * b, ...smaller, Math.min(a, b) === g ? g * 2 : Math.min(a, b)], { min: 1 }),
        explanation: `List factors of both numbers. The greatest one they share is ${g} (${a} = ${g} × ${m1}, ${b} = ${g} × ${m2}).`,
      };
    },
  },
  {
    key: "ns4l",
    standard: "NC.6.NS.4",
    skill: "Least common multiple",
    make() {
      let a = 0;
      let b = 0;
      while (a === b || a % b === 0 || b % a === 0 || lcm(a, b) > 100) {
        a = randInt(2, 15);
        b = randInt(2, 15);
      }
      const L = lcm(a, b);
      return {
        prompt: `What is the LCM of ${a} and ${b}?`,
        ...nums(L, [a * b, gcd(a, b) === 1 ? a + b : gcd(a, b), L * 2, a * b - L > 0 ? L + Math.min(a, b) : L + a], { min: 1 }),
        explanation: `List multiples of ${Math.max(a, b)}: ${Math.max(a, b)}, ${2 * Math.max(a, b)}, … The first one ${Math.min(a, b)} also divides is ${L}.`,
      };
    },
  },
  {
    key: "ns7",
    standard: "NC.6.NS.7",
    skill: "Absolute value and ordering",
    make() {
      if (chance()) {
        const v = randInt(2, 30) * (chance(0.7) ? -1 : 1);
        return {
          prompt: `What is |${ns(v)}|?`,
          answer: ns(Math.abs(v)),
          wrong: [ns(-Math.abs(v)), "0", `1/${Math.abs(v)}`, ns(Math.abs(v) + 1)],
          explanation: `Absolute value is the distance from 0, which is never negative. ${ns(v)} is ${Math.abs(v)} units from 0.`,
        };
      }
      const vals = distinctInts(4, -15, 12);
      if (!vals.some((v) => v < 0)) vals[0] = -randInt(1, 15);
      if (new Set(vals).size < 4) return GRADE_6[6].make(false);
      const least = chance();
      const ans = least ? Math.min(...vals) : Math.max(...vals);
      return {
        prompt: least ? "Which number is the least?" : "Which number is the greatest?",
        answer: ns(ans),
        wrong: vals.filter((v) => v !== ans).map(ns),
        explanation: `On a number line, numbers to the left are smaller. ${ns(ans)} is farthest ${least ? "left" : "right"}.`,
      };
    },
  },
  {
    key: "ee1",
    standard: "NC.6.EE.1",
    skill: "Exponents",
    make() {
      const b = randInt(2, 9);
      const e = b <= 5 ? randInt(2, 4) : randInt(2, 3);
      const v = b ** e;
      return {
        prompt: `What is ${pow(b, e)}?`,
        ...nums(v, [b * e, e ** b <= 100000 ? e ** b : v + b, b ** (e - 1), b + e, v * b]),
        explanation: `${pow(b, e)} means ${Array(e).fill(b).join(" × ")} = ${n(v)}, not ${b} × ${e}.`,
      };
    },
  },
  {
    key: "ee2",
    standard: "NC.6.EE.2",
    skill: "Evaluate expressions",
    make() {
      const x = randInt(2, 9);
      const a = randInt(2, 9);
      const b = randInt(1, 12);
      const t = randInt(0, 2);
      if (t === 0) {
        return {
          prompt: `If x = ${x}, what is ${a}x + ${b}?`,
          ...nums(a * x + b, [Number(`${a}${x}`) + b, a + x + b, a * (x + b)], { min: 0 }),
          explanation: `${a}x means ${a} × x. ${a} × ${x} + ${b} = ${a * x} + ${b} = ${a * x + b}.`,
        };
      }
      if (t === 1) {
        return {
          prompt: `If x = ${x}, what is ${a}(x + ${b})?`,
          ...nums(a * (x + b), [a * x + b, a + x + b, a * x * b], { min: 0 }),
          explanation: `Parentheses first: ${x} + ${b} = ${x + b}. Then ${a} × ${x + b} = ${a * (x + b)}.`,
        };
      }
      return {
        prompt: `If x = ${x}, what is x² + ${b}?`,
        ...nums(x * x + b, [2 * x + b, x + 2 + b, (x + b) ** 2], { min: 0 }),
        explanation: `x² = ${x} × ${x} = ${x * x}. Then ${x * x} + ${b} = ${x * x + b}.`,
      };
    },
  },
  {
    key: "ee7",
    standard: "NC.6.EE.7",
    skill: "One-step equations",
    make() {
      const x = randInt(2, 15);
      const a = randInt(2, 12);
      const t = randInt(0, 3);
      if (t === 0) {
        return {
          prompt: `Solve for x: x + ${a} = ${x + a}`,
          ...nums(x, [x + 2 * a, x + a, x - 1], { min: 0 }),
          explanation: `Subtract ${a} from both sides: x = ${x + a} − ${a} = ${x}.`,
        };
      }
      if (t === 1) {
        return {
          prompt: `Solve for x: x − ${a} = ${x}`,
          ...nums(x + a, [x - a, x, x + a + 1]),
          explanation: `Add ${a} to both sides: x = ${x} + ${a} = ${x + a}.`,
        };
      }
      if (t === 2) {
        return {
          prompt: `Solve for x: ${a}x = ${a * x}`,
          ...nums(x, [a * x - a, a * x * a, a * x + a, x + 1], { min: 0 }),
          explanation: `Divide both sides by ${a}: x = ${a * x} ÷ ${a} = ${x}.`,
        };
      }
      return {
        prompt: `Solve for x: x ÷ ${a} = ${x}`,
        ...nums(a * x, [x, x + a, a * x + a, a * x - 1], { min: 0 }),
        explanation: `Multiply both sides by ${a}: x = ${x} × ${a} = ${a * x}.`,
      };
    },
  },
  {
    key: "g1",
    standard: "NC.6.G.1",
    skill: "Area of triangles and parallelograms",
    make() {
      const b = randInt(3, 16);
      let h = randInt(2, 14);
      const u = pick(["cm", "in", "ft", "m"]);
      const sq = (v: number) => `${v} ${u}²`;
      if (chance()) {
        if ((b * h) % 2) h += 1;
        return {
          prompt: `A triangle has a base of ${b} ${u} and a height of ${h} ${u}. What is its area?`,
          ...nums((b * h) / 2, [b * h, b + h, 2 * (b + h), (b * h) / 2 + b], { min: 1, fmt: sq }),
          explanation: `Area of a triangle = ½ × base × height = ½ × ${b} × ${h} = ${(b * h) / 2} ${u}².`,
        };
      }
      return {
        prompt: `A parallelogram has a base of ${b} ${u} and a height of ${h} ${u}. What is its area?`,
        ...nums(b * h, [(b * h) / 2, b + h, 2 * (b + h), b * h + h], { min: 1, fmt: sq }),
        explanation: `Area of a parallelogram = base × height = ${b} × ${h} = ${b * h} ${u}².`,
      };
    },
  },
  {
    key: "sp5",
    standard: "NC.6.SP.5",
    skill: "Mean, median, and range",
    make() {
      let vals: number[] = [];
      do vals = Array.from({ length: 5 }, () => randInt(1, 30));
      while (vals.reduce((a, b) => a + b, 0) % 5 !== 0 || new Set(vals).size < 4);
      const sorted = [...vals].sort((a, b) => a - b);
      const mean = vals.reduce((a, b) => a + b, 0) / 5;
      const median = sorted[2];
      const range = sorted[4] - sorted[0];
      const which = pick(["mean", "median", "range"] as const);
      const ans = which === "mean" ? mean : which === "median" ? median : range;
      const others = [mean, median, range, vals[2], sorted[4], mean + 1];
      return {
        prompt: `Find the ${which} of: ${vals.join(", ")}`,
        ...nums(ans, others, { min: 0 }),
        explanation:
          which === "mean"
            ? `Add them (${vals.reduce((a, b) => a + b, 0)}) and divide by 5: ${mean}.`
            : which === "median"
              ? `Put them in order: ${sorted.join(", ")}. The middle number is ${median}.`
              : `Range = greatest − least = ${sorted[4]} − ${sorted[0]} = ${range}.`,
      };
    },
  },
  {
    key: "ns3",
    standard: "NC.6.NS.3",
    skill: "Decimal operations",
    make() {
      const q = randInt(2, 40);
      const d = randInt(2, 9);
      if (chance()) {
        return {
          prompt: `What is ${dec(q * d, 1)} ÷ 0.${d}?`,
          answer: n(q),
          wrong: [dec(q, 1), n(q * 10), dec(q, 2), n(q + d)],
          explanation: `Multiply both numbers by 10 to get ${q * d} ÷ ${d} = ${q}.`,
        };
      }
      const a = randInt(11, 99);
      const b = randInt(11, 99);
      return {
        prompt: `What is ${dec(a, 1)} × ${dec(b, 1)}?`,
        answer: dec(a * b, 2),
        wrong: [dec(a * b, 1), dec(a * b, 3), dec(a * b + 100, 2), dec(a * b - 10, 2)],
        explanation: `${a} × ${b} = ${a * b}. There are 2 decimal places in all, so ${dec(a * b, 2)}.`,
      };
    },
  },
];

// ======================================================================== Grade 7

export const GRADE_7: Gen[] = [
  {
    key: "ns1",
    standard: "NC.7.NS.1",
    skill: "Add and subtract integers",
    make() {
      const a = nz(-15, 15);
      const b = nz(-15, 15);
      if (chance()) {
        const s = a + b;
        return {
          prompt: `What is ${ns(a)} + ${paren(b)}?`,
          ...nums(s, [-s, a - b, -(Math.abs(a) + Math.abs(b)) === s ? Math.abs(a) + Math.abs(b) : -(Math.abs(a) + Math.abs(b)), s + 1]),
          explanation:
            Math.sign(a) === Math.sign(b)
              ? `Same signs: add the sizes and keep the sign. ${ns(a)} + ${paren(b)} = ${ns(s)}.`
              : `Different signs: subtract the sizes and keep the sign of the bigger one. ${ns(a)} + ${paren(b)} = ${ns(s)}.`,
        };
      }
      const d = a - b;
      return {
        prompt: `What is ${ns(a)} − ${paren(b)}?`,
        ...nums(d, [a + b, -d, -a - b, d - 1]),
        explanation: `Subtracting is adding the opposite: ${ns(a)} − ${paren(b)} = ${ns(a)} + ${paren(-b)} = ${ns(d)}.`,
      };
    },
  },
  {
    key: "ns2",
    standard: "NC.7.NS.2",
    skill: "Multiply and divide integers",
    make() {
      let a = nz(-12, 12);
      let b = nz(-12, 12);
      if (a > 0 && b > 0) a = -a;
      if (Math.abs(a) === 1) a *= 3;
      if (Math.abs(b) === 1) b *= 4;
      const p = a * b;
      if (chance()) {
        return {
          prompt: `What is ${ns(a)} × ${paren(b)}?`,
          ...nums(p, [-p, a + b, -(a + b), p + a]),
          explanation: `${Math.sign(a) === Math.sign(b) ? "Same signs give a positive" : "Different signs give a negative"}: ${ns(a)} × ${paren(b)} = ${ns(p)}.`,
        };
      }
      return {
        prompt: `What is ${ns(p)} ÷ ${paren(a)}?`,
        ...nums(b, [-b, p - a, p + a, b + 1]),
        explanation: `${Math.sign(p) === Math.sign(a) ? "Same signs give a positive" : "Different signs give a negative"}: ${ns(p)} ÷ ${paren(a)} = ${ns(b)}.`,
      };
    },
  },
  {
    key: "rp2",
    standard: "NC.7.RP.2",
    skill: "Constant of proportionality",
    make() {
      const k = randInt(2, 12);
      const x = randInt(2, 10);
      const y = k * x;
      return {
        prompt: `y is proportional to x. When x = ${x}, y = ${y}. What is k in y = kx?`,
        answer: String(k),
        wrong: [`1/${k}`, ns(y - x), ns(y * x), ns(k + 1)],
        explanation: `k = y ÷ x = ${y} ÷ ${x} = ${k}.`,
      };
    },
  },
  {
    key: "rp1",
    standard: "NC.7.RP.1",
    skill: "Unit rates with fractions",
    make() {
      const rate = randInt(2, 8);
      const t = pick([fr(1, 2), fr(1, 3), fr(1, 4), fr(3, 4), fr(2, 3)]);
      const dist = fr(rate * t.n, t.d);
      return {
        prompt: `You walk ${fstr(dist)} mile${dist.n / dist.d > 1 ? "s" : ""} in ${fstr(t)} hour. How many miles per hour is that?`,
        ...fracs(fr(rate, 1), [fdiv(t, dist), fr(dist.n * t.n, dist.d * t.d), fr(dist.n + t.n, dist.d + t.d)], mixed, { positive: true }),
        explanation: `Miles per hour = miles ÷ hours = ${fstr(dist)} ÷ ${fstr(t)} = ${rate}.`,
      };
    },
  },
  {
    key: "rp3",
    standard: "NC.7.RP.3",
    skill: "Percent problems",
    make() {
      const kind = randInt(0, 3);
      const p = pick([10, 15, 20, 25, 30, 40, 50]);
      const price = 20 * randInt(1, 10);
      const part = (p * price) / 100;
      if (kind === 0) {
        return {
          prompt: `A $${price} jacket is ${p}% off. What is the sale price?`,
          ...nums(price - part, [part, price + part, price - p, price - part * 2], { min: 1, fmt: (v) => `$${v}` }),
          explanation: `${p}% of $${price} is $${part}. Subtract the discount: $${price} − $${part} = $${price - part}.`,
        };
      }
      if (kind === 1) {
        const tax = pick([5, 6, 8, 10]);
        const cents = price * tax; // price × tax% in cents
        return {
          prompt: `A game costs $${price}. Sales tax is ${tax}%. What is the total cost?`,
          answer: money(price * 100 + cents),
          wrong: [money(cents), money(price * 100 + tax * 100), money(price * 100 - cents), money(price * 100 + cents * 10)],
          explanation: `Tax: ${tax}% of $${price} = ${money(cents)}. Total: $${price} + ${money(cents)} = ${money(price * 100 + cents)}.`,
        };
      }
      if (kind === 2) {
        return {
          prompt: `Your meal costs $${price}. You leave a ${p}% tip. How much is the tip?`,
          ...nums(part, [price + part, p, part * 10, price - part], { min: 1, fmt: (v) => `$${v}` }),
          explanation: `${p}% of $${price} = ${p}/100 × ${price} = $${part}.`,
        };
      }
      const oldV = pick([20, 40, 50, 80, 100, 200]);
      const pc = pick([10, 20, 25, 50, 75]);
      const change = (oldV * pc) / 100;
      if (!Number.isInteger(change)) return GRADE_7[4].make(false);
      const up = chance();
      const newV = up ? oldV + change : oldV - change;
      const wrongByNew = Math.round((change / newV) * 1000) / 10;
      return {
        prompt: `A price ${up ? "rises" : "drops"} from $${oldV} to $${newV}. What is the percent ${up ? "increase" : "decrease"}?`,
        ...nums(pc, [change, Number.isInteger(wrongByNew) ? wrongByNew : 100 - pc, 100 + pc, pc * 2], { min: 1, fmt: pct }),
        explanation: `Percent change = change ÷ original = ${change} ÷ ${oldV} = ${dec(pc, 2)} = ${pc}%.`,
      };
    },
  },
  {
    key: "ee4",
    standard: "NC.7.EE.4",
    skill: "Two-step equations",
    make() {
      const x = nz(-9, 12);
      const a = pick([2, 3, 4, 5, 6, 7, 8, -2, -3, -4]);
      const b = nz(-15, 15);
      const c = a * x + b;
      const alt = (c + b) / a;
      return {
        prompt: `Solve for x: ${lin(a, b)} = ${ns(c)}`,
        ...nums(x, [Number.isInteger(alt) ? alt : c - b, -x, c - b, x + 1]),
        explanation: `${b < 0 ? "Add" : "Subtract"} ${Math.abs(b)} on both sides: ${lin(a, 0)} = ${ns(c - b)}. Divide by ${ns(a)}: x = ${ns(x)}.`,
      };
    },
  },
  {
    key: "ee4i",
    standard: "NC.7.EE.4",
    skill: "Two-step inequalities",
    make() {
      const x = nz(-8, 10);
      const a = pick([2, 3, 4, 5, -2, -3, -4]);
      const b = nz(-12, 12);
      const c = a * x + b;
      const sym = pick([">", "<", "≥", "≤"]);
      const flipMap: Record<string, string> = { ">": "<", "<": ">", "≥": "≤", "≤": "≥" };
      const out = a < 0 ? flipMap[sym] : sym;
      const wrongX = Number.isInteger((c + b) / a) ? (c + b) / a : x + 2;
      return {
        prompt: `Solve: ${lin(a, b)} ${sym} ${ns(c)}`,
        answer: `x ${out} ${ns(x)}`,
        wrong: [`x ${flipMap[out]} ${ns(x)}`, `x ${out} ${ns(wrongX === x ? -x : wrongX)}`, `x ${out} ${ns(-x)}`, `x ${flipMap[out]} ${ns(-x)}`],
        explanation: `Undo the ${ns(b)}, then divide by ${ns(a)}.${a < 0 ? " Dividing by a negative flips the inequality sign." : ""} So x ${out} ${ns(x)}.`,
      };
    },
  },
  {
    key: "ee1",
    standard: "NC.7.EE.1",
    skill: "Simplify expressions",
    make() {
      const a = randInt(2, 6);
      const b = nz(-9, 9);
      let c = nz(-5, 5);
      if (a + c === 0) c += 1;
      if (c === 0) c = 2;
      const expr = `${a}(${xPlus(b)}) ${c < 0 ? MINUS : "+"} ${Math.abs(c) === 1 ? "" : Math.abs(c)}x`;
      return {
        prompt: `Simplify: ${expr}`,
        answer: lin(a + c, a * b),
        wrong: [lin(a + c, b), lin(a, a * b), lin(a + c, -a * b), lin(a - c, a * b), lin(a + c + 1, a * b)],
        explanation: `Distribute: ${a}x ${a * b < 0 ? MINUS : "+"} ${Math.abs(a * b)}. Then combine the x terms: ${a}x ${c < 0 ? MINUS : "+"} ${lin(Math.abs(c), 0)} = ${lin(a + c, 0)}.`,
      };
    },
  },
  {
    key: "g4",
    standard: "NC.7.G.4",
    skill: "Circles",
    make() {
      const r = randInt(2, 12);
      const u = pick(["cm", "in", "m", "ft"]);
      const useD = chance(0.35);
      const given = useD ? `diameter of ${2 * r}` : `radius of ${r}`;
      if (chance()) {
        const f = (v: number) => `${v}${PI} ${u}²`;
        return {
          prompt: `A circle has a ${given} ${u}. What is its area?`,
          ...nums(r * r, [2 * r, 4 * r * r, r, 2 * r * r], { min: 1, fmt: f }),
          explanation: `Area = ${PI}r². The radius is ${r}, so ${PI} × ${r}² = ${r * r}${PI} ${u}².`,
        };
      }
      const f = (v: number) => `${v}${PI} ${u}`;
      return {
        prompt: `A circle has a ${given} ${u}. What is its circumference?`,
        ...nums(2 * r, [r * r, r, 4 * r, 2 * r + 2], { min: 1, fmt: f }),
        explanation: `Circumference = 2${PI}r = ${PI}d. The diameter is ${2 * r}, so C = ${2 * r}${PI} ${u}.`,
      };
    },
  },
  {
    key: "g5",
    standard: "NC.7.G.5",
    skill: "Angle relationships",
    make() {
      const kind = pick(["complementary", "supplementary", "vertical"] as const);
      const x = kind === "complementary" ? randInt(10, 80) : randInt(20, 160);
      const ans = kind === "complementary" ? 90 - x : kind === "supplementary" ? 180 - x : x;
      const wrong = [90 - x, 180 - x, 360 - x, x, ans + 10].filter((v) => v > 0);
      return {
        prompt: kind === "vertical" ? `Two lines cross. One angle is ${x}°. What is the vertical angle across from it?` : `Two angles are ${kind}. One is ${x}°. What is the other?`,
        ...nums(ans, wrong, { min: 1, fmt: deg }),
        explanation:
          kind === "vertical"
            ? `Vertical angles are equal, so it is also ${x}°.`
            : `${kind === "complementary" ? "Complementary angles add to 90°" : "Supplementary angles add to 180°"}: ${kind === "complementary" ? 90 : 180}° − ${x}° = ${ans}°.`,
      };
    },
  },
  {
    key: "sp7",
    standard: "NC.7.SP.7",
    skill: "Probability",
    make() {
      const colors = shuffle(["red", "blue", "green", "yellow"]).slice(0, 3);
      const counts = distinctInts(3, 2, 9);
      const total = counts[0] + counts[1] + counts[2];
      const i = randInt(0, 2);
      const P = fr(counts[i], total);
      return {
        prompt: `A bag has ${counts[0]} ${colors[0]}, ${counts[1]} ${colors[1]}, and ${counts[2]} ${colors[2]} marbles. P(${colors[i]})?`,
        ...fracs(P, [fr(counts[i], total - counts[i]), fr(counts[(i + 1) % 3], total), fr(1, 3), fr(counts[i], 10)], fstr, { positive: true }),
        explanation: `P = favorable ÷ total = ${counts[i]}/${total}${fstr(P) !== `${counts[i]}/${total}` ? ` = ${fstr(P)}` : ""}.`,
      };
    },
  },
  {
    key: "sp8",
    standard: "NC.7.SP.8",
    skill: "Compound probability",
    make() {
      if (chance()) {
        const face = randInt(1, 6);
        const side = pick(["heads", "tails"]);
        return {
          prompt: `You flip a coin and roll a number cube. What is P(${side} and ${face})?`,
          ...fracs(fr(1, 12), [fr(1, 8), fr(2, 3), fr(1, 6), fr(7, 12)], fstr),
          explanation: `There are 2 × 6 = 12 equally likely outcomes and only 1 is ${side} with a ${face}: 1/12.`,
        };
      }
      const s = randInt(2, 12);
      const ways = 6 - Math.abs(7 - s);
      const P = fr(ways, 36);
      return {
        prompt: `You roll two number cubes. What is the probability the sum is ${s}?`,
        ...fracs(P, [fr(1, 11), fr(1, 12), fr(ways, 12), fr(ways + 1, 36), fr(1, 6)], fstr),
        explanation: `There are 36 equally likely outcomes, and ${ways} of them add to ${s}: ${ways}/36${fstr(P) !== `${ways}/36` ? ` = ${fstr(P)}` : ""}.`,
      };
    },
  },
  {
    key: "g6",
    standard: "NC.7.G.6",
    skill: "Surface area and volume",
    make() {
      const l = randInt(2, 10);
      const w = randInt(2, 8);
      const h = randInt(2, 8);
      const SA = 2 * (l * w + l * h + w * h);
      const u = pick(["cm", "in", "ft"]);
      return {
        prompt: `A box is ${l} × ${w} × ${h} ${u}. What is its surface area?`,
        ...nums(SA, [l * w * h, SA / 2, l * w + l * h + w * h + l * w, 6 * l * w], { min: 1, fmt: (v) => `${v} ${u}²` }),
        explanation: `Add the areas of all 6 faces: 2(${l}·${w} + ${l}·${h} + ${w}·${h}) = 2(${l * w + l * h + w * h}) = ${SA} ${u}².`,
      };
    },
  },
];


// ======================================================================== Grade 8

export const GRADE_8: Gen[] = [
  {
    key: "ee1",
    standard: "NC.8.EE.1",
    skill: "Exponent rules",
    make() {
      const b = randInt(2, 9);
      const m = randInt(2, 7);
      const k = randInt(2, 6);
      const kind = randInt(0, 3);
      const P = (e: number) => (e === 0 ? `${b}⁰` : pow(b, e));
      if (kind === 0) {
        return {
          prompt: `Simplify: ${pow(b, m)} × ${pow(b, k)}`,
          answer: pow(b, m + k),
          wrong: [pow(b, m * k), pow(b * b, m + k), pow(b, Math.abs(m - k) || m + k + 1), pow(b * b, m * k)],
          pad: () => pow(b, m + k + nz(-3, 3)),
          explanation: `Same base, so add the exponents: ${m} + ${k} = ${m + k}. The answer is ${pow(b, m + k)}.`,
        };
      }
      if (kind === 1) {
        const hi = m + k;
        return {
          prompt: `Simplify: ${pow(b, hi)} ÷ ${pow(b, k)}`,
          answer: P(m),
          wrong: [pow(b, hi + k), Number.isInteger(hi / k) && hi / k !== m ? pow(b, hi / k) : P(m - 1), pow(1, m), P(m + 1)],
          pad: () => P(Math.max(0, m + nz(-3, 3))),
          explanation: `Same base, so subtract the exponents: ${hi} − ${k} = ${m}. The answer is ${pow(b, m)}.`,
        };
      }
      if (kind === 2) {
        const mm = randInt(2, 5);
        const kk = randInt(2, 4);
        return {
          prompt: `Simplify: (${pow(b, mm)})${sup(kk)}`,
          answer: pow(b, mm * kk),
          wrong: [pow(b, mm + kk), mm ** kk <= 99 && mm ** kk !== mm * kk ? pow(b, mm ** kk) : pow(b, mm * kk + 1), pow(b * kk, mm), pow(b, mm * kk - 1)],
          pad: () => pow(b, mm * kk + nz(-4, 4)),
          explanation: `A power of a power multiplies the exponents: ${mm} × ${kk} = ${mm * kk}.`,
        };
      }
      const e = randInt(1, b <= 5 ? 3 : 2);
      const v = b ** e;
      return {
        prompt: `What is ${b}${sup(-e)}?`,
        answer: `1/${v}`,
        wrong: [ns(-v), ns(-b * e), `1/${b * e}`, `${MINUS}1/${v}`].filter((w) => w !== `1/${v}`),
        pad: () => pick([`1/${v * b}`, `${MINUS}${v * b}`, `1/${b + e}`, ns(v)]),
        explanation: `A negative exponent means the reciprocal: ${b}${sup(-e)} = 1/${pow(b, e)} = 1/${v}.`,
      };
    },
  },
  {
    key: "ee2",
    standard: "NC.8.EE.2",
    skill: "Square and cube roots",
    make() {
      if (chance(0.6)) {
        const r = randInt(2, 15);
        const sq = r * r;
        return {
          prompt: `What is √${sq}?`,
          ...nums(r, [sq / 2, r + 1, r - 1, 2 * r], { min: 1 }),
          explanation: `${r} × ${r} = ${sq}, so √${sq} = ${r}.`,
        };
      }
      const r = randInt(2, 6);
      const c = r ** 3;
      return {
        prompt: `What is ∛${c}?`,
        ...nums(r, [Number.isInteger(c / 3) ? c / 3 : r * 3, r * r, r + 1, r - 1], { min: 1 }),
        explanation: `${r} × ${r} × ${r} = ${c}, so ∛${c} = ${r}.`,
      };
    },
  },
  {
    key: "ee3",
    standard: "NC.8.EE.3",
    skill: "Scientific notation",
    make() {
      let md = randInt(11, 99); // mantissa × 10, e.g. 45 -> 4.5
      if (md % 10 === 0) md += 1;
      const mant = dec(md, 1);
      const big = chance();
      const e = big ? randInt(3, 8) : -randInt(2, 6);
      let standard: string;
      if (big) {
        standard = n(md * 10 ** (e - 1));
      } else {
        standard = `0.${"0".repeat(-e - 1)}${md}`;
      }
      const sci = (ex: number) => `${mant} × 10${sup(ex)}`;
      return {
        prompt: `Write ${standard} in scientific notation.`,
        answer: sci(e),
        wrong: [sci(e + 1), sci(e - 1), sci(-e), `${md} × 10${sup(e + 1)}`],
        explanation: `Move the decimal point to get ${mant} (between 1 and 10). You moved it ${Math.abs(e)} place${Math.abs(e) > 1 ? "s" : ""} ${big ? "left, so the exponent is" : "right, so the exponent is"} ${ns(e)}.`,
      };
    },
  },
  {
    key: "ee4",
    standard: "NC.8.EE.4",
    skill: "Operations in scientific notation",
    make() {
      const a = randInt(1, 4);
      const b = randInt(2, Math.floor(9 / a));
      const m = randInt(2, 8);
      const k = randInt(2, 8);
      const f = (c: number, e: number) => `${c} × 10${sup(e)}`;
      return {
        prompt: `Multiply: (${f(a, m)}) × (${f(b, k)})`,
        answer: f(a * b, m + k),
        wrong: [f(a * b, m * k), f(a + b, m + k), f(a * b, m + k + 1), f(a + b, m * k)],
        pad: () => f(Math.max(1, a * b + nz(-2, 2)), m + k + nz(-2, 2)),
        explanation: `Multiply the numbers (${a} × ${b} = ${a * b}) and add the exponents (${m} + ${k} = ${m + k}).`,
      };
    },
  },
  {
    key: "ee7",
    standard: "NC.8.EE.7",
    skill: "Multi-step equations",
    make() {
      const x = nz(-9, 9);
      let a = randInt(2, 9);
      const c = randInt(1, 8);
      if (a === c) a += 1;
      const b = nz(-12, 12);
      const d = (a - c) * x + b;
      const alt1 = (d + b) / (a - c);
      const alt2 = (d - b) / (a + c);
      return {
        prompt: `Solve for x: ${lin(a, b)} = ${lin(c, d)}`,
        ...nums(x, [-x, Number.isInteger(alt1) ? alt1 : x + 2, Number.isInteger(alt2) ? alt2 : x - 2, d - b]),
        explanation: `Get x terms on one side: ${lin(a - c, 0)} = ${ns(d - b)}.${a - c !== 1 ? ` Divide by ${a - c}: x = ${ns(x)}.` : ""}`,
      };
    },
  },
  {
    key: "ee8",
    standard: "NC.8.EE.8",
    skill: "Systems of equations",
    make() {
      const x = randInt(-5, 6);
      const y = randInt(-5, 8);
      const [m1, m2] = distinctInts(2, -4, 4);
      const b1 = y - m1 * x;
      const b2 = y - m2 * x;
      return {
        prompt: `What is the solution? y = ${lin(m1, b1)} and y = ${lin(m2, b2)}`,
        answer: point(x, y),
        wrong: [point(y, x), point(-x, y), point(x, -y), point(x + 1, m1 * (x + 1) + b1), point(0, b1)],
        pad: padPoint(x, y),
        explanation: `Set them equal: ${lin(m1, b1)} = ${lin(m2, b2)} gives x = ${ns(x)}. Then y = ${ns(y)}, so ${point(x, y)}.`,
      };
    },
  },
  {
    key: "f4",
    standard: "NC.8.F.4",
    skill: "Slope",
    make() {
      if (chance(0.35)) {
        const m = nz(-9, 9);
        const b = nz(-9, 9);
        return {
          prompt: `What is the slope of y = ${lin(m, b)}?`,
          ...nums(m, [b, -m, m + b]),
          explanation: `In y = mx + b, the slope is m, the number multiplied by x: ${ns(m)}.`,
        };
      }
      let rise = 0;
      let run = 0;
      while (rise === 0 || Math.abs(rise) === Math.abs(run)) {
        rise = nz(-9, 9);
        run = randInt(1, 6);
      }
      const x1 = randInt(-5, 5);
      const y1 = randInt(-5, 5);
      const x2 = x1 + run;
      const y2 = y1 + rise;
      const [p, q] = chance() ? [point(x1, y1), point(x2, y2)] : [point(x2, y2), point(x1, y1)];
      const m = fr(rise, run);
      return {
        prompt: `What is the slope of the line through ${p} and ${q}?`,
        ...fracs(m, [fr(run, rise), fr(-rise, run), fr(-run, rise), fr(y2 + y1, x2 + x1 || 1)], fstr),
        explanation: `Slope = rise ÷ run = (${ns(y2)} − ${paren(y1)}) ÷ (${ns(x2)} − ${paren(x1)}) = ${ns(rise)}/${run}${fstr(m) !== `${ns(rise)}/${run}` ? ` = ${fstr(m)}` : ""}.`,
      };
    },
  },
  {
    key: "g7",
    standard: "NC.8.G.7",
    skill: "Pythagorean theorem",
    make() {
      const [a, b, c] = pick(TRIPLES);
      if (chance()) {
        return {
          prompt: `A right triangle has legs ${a} and ${b}. How long is the hypotenuse?`,
          ...nums(c, [a + b, a * a + b * b, c + 1, Math.abs(b - a) + c], { min: 1 }),
          explanation: `a² + b² = c²: ${a * a} + ${b * b} = ${c * c}, and √${c * c} = ${c}.`,
        };
      }
      return {
        prompt: `A right triangle has hypotenuse ${c} and one leg ${a}. How long is the other leg?`,
        ...nums(b, [c - a, c * c - a * a, c + a, b + 1], { min: 1 }),
        explanation: `${c}² − ${a}² = ${c * c} − ${a * a} = ${b * b}, and √${b * b} = ${b}.`,
      };
    },
  },
  {
    key: "ns1",
    standard: "NC.8.NS.1",
    skill: "Rational and irrational numbers",
    make() {
      const nonSquares = [2, 3, 5, 6, 7, 8, 10, 11, 12, 13, 15, 17, 19, 20];
      const irr = () => (chance(0.15) ? PI : `√${pick(nonSquares)}`);
      const rat = shuffle([`√${pick([4, 9, 16, 25, 36, 49, 64, 81, 100])}`, `${randInt(1, 8)}/${randInt(3, 9)}`, dec(randInt(1, 99), 2), ns(-randInt(1, 20)), "0.333…"]);
      if (chance(0.6)) {
        return {
          prompt: "Which number is irrational?",
          answer: irr(),
          wrong: rat,
          explanation: `An irrational number can't be written as a fraction; its decimal never ends or repeats. Square roots of non-perfect squares and ${PI} are irrational.`,
        };
      }
      const set = new Set<string>();
      while (set.size < 3) set.add(irr());
      return {
        prompt: "Which number is rational?",
        answer: rat[0],
        wrong: [...set],
        explanation: `${rat[0]} can be written as a fraction of integers, so it is rational. The others are irrational.`,
      };
    },
  },
  {
    key: "g5",
    standard: "NC.8.G.5",
    skill: "Triangle angles",
    make() {
      const a = randInt(25, 85);
      const b = randInt(20, 150 - a);
      const c = 180 - a - b;
      if (chance()) {
        return {
          prompt: `Two angles of a triangle are ${a}° and ${b}°. What is the third angle?`,
          ...nums(c, [360 - a - b, a + b, 90 - Math.min(a, b), c + 10], { min: 1, fmt: deg }),
          explanation: `The angles of a triangle add to 180°: 180° − ${a}° − ${b}° = ${c}°.`,
        };
      }
      return {
        prompt: `A triangle has interior angles ${a}° and ${b}°. What is the exterior angle at the third corner?`,
        ...nums(a + b, [c, 180 - a, 360 - a - b, a + b + 10], { min: 1, fmt: deg }),
        explanation: `An exterior angle equals the sum of the two far interior angles: ${a}° + ${b}° = ${a + b}°.`,
      };
    },
  },
  {
    key: "g9",
    standard: "NC.8.G.9",
    skill: "Volume of cylinders, cones, and spheres",
    make() {
      const u = pick(["cm", "in", "m"]);
      const f = (v: number) => `${n(v)}${PI} ${u}³`;
      const kind = randInt(0, 2);
      if (kind === 0) {
        const r = randInt(1, 6);
        const h = randInt(2, 10);
        return {
          prompt: `A cylinder has radius ${r} ${u} and height ${h} ${u}. What is its volume?`,
          ...nums(r * r * h, [2 * r * h, r * h, 4 * r * r * h, r * r * h / 3], { min: 1, fmt: f }),
          explanation: `V = ${PI}r²h = ${PI} × ${r}² × ${h} = ${r * r * h}${PI} ${u}³.`,
        };
      }
      if (kind === 1) {
        const r = randInt(1, 6);
        let h = randInt(2, 12);
        while ((r * r * h) % 3) h += 1;
        return {
          prompt: `A cone has radius ${r} ${u} and height ${h} ${u}. What is its volume?`,
          ...nums((r * r * h) / 3, [r * r * h, (2 * r * h) / 3, (4 * r * r * h) / 3, (r * h) / 3], { min: 1, fmt: f }),
          explanation: `V = ⅓${PI}r²h = ⅓ × ${PI} × ${r}² × ${h} = ${(r * r * h) / 3}${PI} ${u}³.`,
        };
      }
      const r = pick([3, 6]);
      return {
        prompt: `A sphere has radius ${r} ${u}. What is its volume?`,
        ...nums((4 * r ** 3) / 3, [4 * r * r, r ** 3, (4 * r * r) / 3, 4 * r ** 3], { min: 1, fmt: f }),
        explanation: `V = ⁴⁄₃${PI}r³ = ⁴⁄₃ × ${PI} × ${r ** 3} = ${(4 * r ** 3) / 3}${PI} ${u}³.`,
      };
    },
  },
  {
    key: "f1",
    standard: "NC.8.F.1",
    skill: "Identify functions",
    quick: false,
    make() {
      const xs = distinctInts(3, -3, 6);
      const ys = () => xs.map(() => randInt(-5, 9));
      const set = (pairs: [number, number][]) => `{${pairs.map(([a, b]) => point(a, b)).join(", ")}}`;
      const good = xs.map((x, i): [number, number] => [x, ys()[i]]);
      const bads: string[] = [];
      while (bads.length < 3) {
        const p: [number, number][] = xs.map((x): [number, number] => [x, randInt(-5, 9)]);
        const j = randInt(1, 2);
        let yy = randInt(-5, 9);
        if (yy === p[0][1]) yy += 1;
        p[j] = [p[0][0], yy];
        const s = set(shuffle(p));
        if (!bads.includes(s)) bads.push(s);
      }
      return {
        prompt: "Which set of ordered pairs is a function?",
        answer: set(good),
        wrong: bads,
        explanation: "In a function, each input (x) has exactly one output (y). The other sets repeat an x-value with a different y.",
      };
    },
  },
];
