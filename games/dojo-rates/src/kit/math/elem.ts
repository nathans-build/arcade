/* Grade 3 - Grade 5 generators (NC.3.*, NC.4.*, NC.5.*). */
import {
  chance, dec, distinctInts, type Frac, fadd, feq, fmul, fr, fracs, fstr, fsub,
  type Gen, lcm, mixed, n, nums, nz, pick, point, randInt, raw, rawFracs, shuffle,
} from "./core";

const UNIT_WORD: Record<string, string> = { cm: "centimeters", m: "meters", in: "inches", ft: "feet", yd: "yards" };

function pad2(v: number): string {
  return String(v).padStart(2, "0");
}

/** 12-hour clock text from minutes after midnight. */
function clock(total: number): string {
  const t = ((total % 720) + 720) % 720;
  const h = Math.floor(t / 60) || 12;
  return `${h}:${pad2(t % 60)}`;
}

/** Digit-by-digit sum without carrying (a common error). */
function noCarrySum(a: number, b: number): number {
  let out = 0;
  for (let p = 1; p <= Math.max(a, b); p *= 10) out += (((Math.floor(a / p) % 10) + (Math.floor(b / p) % 10)) % 10) * p;
  return out;
}
/** Subtract the smaller digit from the larger in every column (a common error). */
function smallFromBig(a: number, b: number): number {
  let out = 0;
  for (let p = 1; p <= Math.max(a, b); p *= 10) out += Math.abs((Math.floor(a / p) % 10) - (Math.floor(b / p) % 10)) * p;
  return out;
}

/** Choices that compare two values: one true statement and three false ones. */
function compareStatements(x: string, y: string, cmp: number) {
  const sym = cmp > 0 ? ">" : cmp < 0 ? "<" : "=";
  return {
    answer: `${x} ${sym} ${y}`,
    wrong: [...[">", "<", "="].filter((s) => s !== sym).map((s) => `${x} ${s} ${y}`), `${y} ${sym} ${x}`],
  };
}

// ======================================================================== Grade 3

export const GRADE_3: Gen[] = [
  {
    key: "oa7m",
    standard: "NC.3.OA.7",
    skill: "Multiplication facts",
    make() {
      const a = randInt(2, 10);
      const b = randInt(2, 10);
      const p = a * b;
      return {
        prompt: `What is ${a} × ${b}?`,
        ...nums(p, [a + b, a * (b + 1), (a + 1) * b, p + 10, p - 1], { min: 0 }),
        explanation: `${a} × ${b} means ${a} groups of ${b}. Count by ${b}s, ${a} times, to get ${p}.`,
      };
    },
  },
  {
    key: "oa7d",
    standard: "NC.3.OA.7",
    skill: "Division facts",
    make() {
      const a = randInt(2, 10);
      const b = randInt(2, 10);
      const p = a * b;
      return {
        prompt: `What is ${p} ÷ ${a}?`,
        ...nums(b, [p - a, b + 1, b - 1, a === b ? b + 2 : a], { min: 1 }),
        explanation: `Think multiplication: ${a} × ? = ${p}. Since ${a} × ${b} = ${p}, ${p} ÷ ${a} = ${b}.`,
      };
    },
  },
  {
    key: "oa4",
    standard: "NC.3.OA.4",
    skill: "Unknown factor",
    make() {
      const a = randInt(2, 10);
      const b = randInt(2, 10);
      return {
        prompt: `${a} × ? = ${a * b}`,
        ...nums(b, [a * b - a, a * b + a, b + 1, b - 1], { min: 1 }),
        explanation: `Use division: ${a * b} ÷ ${a} = ${b}. Check: ${a} × ${b} = ${a * b}.`,
      };
    },
  },
  {
    key: "oa3",
    standard: "NC.3.OA.3",
    skill: "Multiply and divide word problems",
    make() {
      const a = randInt(3, 9);
      const b = randInt(3, 9);
      const thing = pick(["apples", "stickers", "pencils", "cookies", "marbles", "cards"]);
      if (chance()) {
        return {
          prompt: `There are ${a} bags with ${b} ${thing} in each bag. How many ${thing} in all?`,
          ...nums(a * b, [a + b, a * b + b, a * b - a, a * (b + 1)], { min: 0 }),
          explanation: `Equal groups means multiply: ${a} × ${b} = ${a * b}.`,
        };
      }
      return {
        prompt: `${a * b} ${thing} are shared equally by ${a} friends. How many does each friend get?`,
        ...nums(b, [a * b - a, a * b + a, b + 1, b - 1], { min: 1 }),
        explanation: `Sharing equally means divide: ${a * b} ÷ ${a} = ${b}.`,
      };
    },
  },
  {
    key: "nbt1",
    standard: "NC.3.NBT.1",
    skill: "Rounding",
    make() {
      const to = pick([10, 100]);
      let v = to === 10 ? randInt(12, 988) : randInt(112, 988);
      if (v % to === 0) v += 3;
      const down = Math.floor(v / to) * to;
      const ans = v - down >= to / 2 ? down + to : down;
      const other = ans === down ? down + to : down;
      const otherPlace = to === 10 ? Math.round(v / 100) * 100 : Math.round(v / 10) * 10;
      return {
        prompt: `Round ${v} to the nearest ${to}.`,
        ...nums(ans, [other, otherPlace, ans + to, v], { min: 0, fmt: String }),
        explanation: `${v} is between ${down} and ${down + to}. It is closer to ${ans}${v - down === to / 2 ? " (halfway rounds up)" : ""}.`,
      };
    },
  },
  {
    key: "nbt2",
    standard: "NC.3.NBT.2",
    skill: "Add and subtract within 1000",
    make() {
      if (chance()) {
        const a = randInt(120, 700);
        const b = randInt(105, 999 - a);
        return {
          prompt: `What is ${a} + ${b}?`,
          ...nums(a + b, [noCarrySum(a, b), a + b + 100, a + b - 10, a + b + 10], { min: 0, fmt: String }),
          explanation: `Add ones, tens, then hundreds, regrouping when a place gets to 10 or more. ${a} + ${b} = ${a + b}.`,
        };
      }
      const a = randInt(300, 999);
      const b = randInt(101, a - 30);
      return {
        prompt: `What is ${a} − ${b}?`,
        ...nums(a - b, [smallFromBig(a, b), a - b + 100, a - b - 10, a - b + 10], { min: 0, fmt: String }),
        explanation: `Subtract place by place and regroup when needed. Check: ${b} + ${a - b} = ${a}.`,
      };
    },
  },
  {
    key: "nbt3",
    standard: "NC.3.NBT.3",
    skill: "Multiply by multiples of 10",
    make() {
      const a = randInt(2, 9);
      const t = randInt(2, 9);
      const p = a * t * 10;
      return {
        prompt: `What is ${a} × ${t * 10}?`,
        ...nums(p, [a * t, p * 10, a + t * 10, p + 10], { min: 0 }),
        explanation: `${a} × ${t} tens = ${a * t} tens, which is ${p}.`,
      };
    },
  },
  {
    key: "nf1",
    standard: "NC.3.NF.1",
    skill: "Fractions of a whole",
    make() {
      const d = pick([2, 3, 4, 6, 8]);
      const k = randInt(1, d - 1);
      const food = pick(["pizza", "pie", "cake", "sandwich", "pan of brownies"]);
      return {
        prompt: `A ${food} is cut into ${d} equal pieces. You eat ${k}. What fraction did you eat?`,
        ...rawFracs([k, d], [[k, d - k], [d - k, d], [d, k], [k, d + 1]]),
        explanation: `The bottom number is the ${d} equal pieces. The top number is the ${k} you ate: ${k}/${d}.`,
      };
    },
  },
  {
    key: "nf2",
    standard: "NC.3.NF.2",
    skill: "Fractions on a number line",
    make() {
      const d = pick([2, 3, 4, 6, 8]);
      const k = randInt(1, d - 1);
      return {
        prompt: `A number line from 0 to 1 is cut into ${d} equal parts. What fraction is at the ${ord3(k)} mark after 0?`,
        ...rawFracs([k, d], [[k, d + 1], [d, k], [k + 1, d], [k, d - 1]]),
        explanation: `Each part is 1/${d}. ${k} ${k === 1 ? "jump" : "jumps"} of 1/${d} from 0 ${k === 1 ? "lands" : "land"} on ${k}/${d}.`,
      };
    },
  },
  {
    key: "nf3",
    standard: "NC.3.NF.3",
    skill: "Equivalent fractions",
    make() {
      const base = pick([[1, 2], [1, 3], [2, 3], [1, 4], [3, 4]] as const);
      const [a, b] = base;
      const ms = [2, 3, 4].filter((m) => b * m <= 8);
      const m = pick(ms);
      const target = fr(a, b);
      const cands = [
        [a + m, b + m], [a, b * m], [a * m, b * m + 1], [b, a * m], [a + 1, b + 1], [a * m - 1, b * m],
      ].filter(([x, y]) => x > 0 && y > 0 && !feq(fr(x, y), target));
      return {
        prompt: `Which fraction is equal to ${a}/${b}?`,
        ...rawFracs([a * m, b * m], cands.map(([x, y]): [number, number] => [x, y])),
        explanation: `Multiply the top and bottom by ${m}: ${a} × ${m} = ${a * m} and ${b} × ${m} = ${b * m}. Same amount, smaller pieces.`,
      };
    },
  },
  {
    key: "nf4",
    standard: "NC.3.NF.4",
    skill: "Compare fractions",
    make() {
      const sameTop = chance();
      let x: [number, number];
      let y: [number, number];
      if (sameTop) {
        const [d1, d2] = shuffle([2, 3, 4, 6, 8]).slice(0, 2);
        const top = randInt(1, Math.min(d1, d2) - 1);
        x = [top, d1];
        y = [top, d2];
      } else {
        const d = pick([3, 4, 6, 8]);
        const [t1, t2] = distinctInts(2, 1, d - 1);
        x = [t1, d];
        y = [t2, d];
      }
      const cmp = x[0] * y[1] - y[0] * x[1];
      const c = compareStatements(raw(...x), raw(...y), cmp);
      return {
        prompt: "Which is true?",
        answer: c.answer,
        wrong: c.wrong,
        explanation: sameTop
          ? `Same number of pieces, so look at size: fewer equal parts means bigger pieces. So ${c.answer}.`
          : `The pieces are the same size, so more pieces is more. So ${c.answer}.`,
      };
    },
  },
  {
    key: "md7",
    standard: "NC.3.MD.7",
    skill: "Area of rectangles",
    make() {
      const l = randInt(3, 12);
      const w = randInt(2, 9);
      const u = pick(["cm", "ft", "in", "m"]);
      const sq = (v: number) => `${v} sq ${u}`;
      return {
        prompt: `A rectangle is ${l} ${u} long and ${w} ${u} wide. What is its area?`,
        ...nums(l * w, [2 * (l + w), l + w, l * w + l, l * (w - 1)], { min: 1, fmt: sq }),
        explanation: `Area = length × width = ${l} × ${w} = ${l * w} square ${UNIT_WORD[u]}.`,
      };
    },
  },
  {
    key: "md8",
    standard: "NC.3.MD.8",
    skill: "Perimeter",
    make() {
      const u = pick(["cm", "ft", "in", "m"]);
      const len = (v: number) => `${v} ${u}`;
      if (chance(0.6)) {
        const l = randInt(3, 15);
        const w = randInt(2, 10);
        return {
          prompt: `A rectangle is ${l} ${u} long and ${w} ${u} wide. What is its perimeter?`,
          ...nums(2 * (l + w), [l * w, l + w, 2 * l + w, 2 * (l + w) + 2], { min: 1, fmt: len }),
          explanation: `Perimeter is the distance around: ${l} + ${w} + ${l} + ${w} = ${2 * (l + w)} ${u}.`,
        };
      }
      const l = randInt(4, 15);
      const w = randInt(2, 10);
      const p = 2 * (l + w);
      return {
        prompt: `A rectangle has a perimeter of ${p} ${u}. One side is ${l} ${u}. How long is the side next to it?`,
        ...nums(w, [p - l, p - 2 * l, p / 2, w + 1], { min: 1, fmt: len }),
        explanation: `Two sides that meet add to half the perimeter: ${p} ÷ 2 = ${p / 2}. Then ${p / 2} − ${l} = ${w} ${u}.`,
      };
    },
  },
  {
    key: "md1",
    standard: "NC.3.MD.1",
    skill: "Elapsed time",
    make() {
      const start = randInt(1, 11) * 60 + 5 * randInt(0, 11);
      const dur = 5 * randInt(3, 19);
      const end = start + dur;
      const act = pick(["A movie", "Soccer practice", "A game", "A show", "Art class"]);
      return {
        prompt: `${act} starts at ${clock(start)}. It lasts ${dur} minutes. What time does it end?`,
        answer: clock(end),
        wrong: [clock(end - 10), clock(end + 60), clock(end + 10), clock(start + dur - 60)],
        explanation: `Count on ${dur} minutes from ${clock(start)}${dur >= 60 ? ` (that's 1 hour and ${dur - 60} minutes)` : ""}. It ends at ${clock(end)}.`,
      };
    },
  },
];

function ord3(k: number): string {
  return k === 1 ? "1st" : k === 2 ? "2nd" : k === 3 ? "3rd" : `${k}th`;
}

// ======================================================================== Grade 4

const PRIMES_50 = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47];
const TRICKY_COMPOSITES = [9, 15, 21, 25, 27, 33, 35, 39, 45, 49, 51, 1];

export const GRADE_4: Gen[] = [
  {
    key: "nbt5",
    standard: "NC.4.NBT.5",
    skill: "Multi-digit multiplication",
    make() {
      if (chance()) {
        const a = randInt(12, 99);
        const b = randInt(12, 99);
        const p = a * b;
        const noShift = a * (b % 10) + a * Math.floor(b / 10);
        return {
          prompt: `What is ${a} × ${b}?`,
          ...nums(p, [noShift, p + 10, p - a, p + 100]),
          explanation: `Use partial products: ${a} × ${Math.floor(b / 10) * 10} = ${n(a * Math.floor(b / 10) * 10)} and ${a} × ${b % 10} = ${n(a * (b % 10))}. Add them: ${n(p)}.`,
        };
      }
      const a = randInt(102, 999);
      const b = randInt(3, 9);
      const p = a * b;
      const dropCarry = p - 10 * Math.floor(((a % 10) * b) / 10);
      return {
        prompt: `What is ${a} × ${b}?`,
        ...nums(p, [dropCarry, p + 10, p - b, p + 100]),
        explanation: `Break ${a} into place values and multiply each by ${b}, then add: ${a} × ${b} = ${n(p)}.`,
      };
    },
  },
  {
    key: "nbt6",
    standard: "NC.4.NBT.6",
    skill: "Division with remainders",
    make() {
      const d = randInt(3, 9);
      const q = randInt(11, 99);
      const r = randInt(1, d - 1);
      const t = d * q + r;
      const f = (qq: number, rr: number) => `${qq} R${rr}`;
      return {
        prompt: `What is ${t} ÷ ${d}?`,
        answer: f(q, r),
        wrong: [f(q - 1, r + d), f(q + 1, r), f(q, (r % (d - 1)) + 1), f(q, 0), f(q - 1, r)],
        explanation: `${d} × ${q} = ${d * q}, and ${t} − ${d * q} = ${r} left over. So the answer is ${q} R${r}.`,
      };
    },
  },
  {
    key: "nbt4",
    standard: "NC.4.NBT.4",
    skill: "Multi-digit addition and subtraction",
    make() {
      if (chance()) {
        const a = randInt(1200, 60000);
        const b = randInt(1200, 99999 - a);
        return {
          prompt: `What is ${n(a)} + ${n(b)}?`,
          ...nums(a + b, [noCarrySum(a, b), a + b + 1000, a + b - 10, a + b + 100]),
          explanation: `Line up the places and add from the ones, regrouping as you go: ${n(a + b)}.`,
        };
      }
      const a = randInt(5000, 99999);
      const b = randInt(1000, a - 100);
      return {
        prompt: `What is ${n(a)} − ${n(b)}?`,
        ...nums(a - b, [smallFromBig(a, b), a - b + 1000, a - b - 10, a - b + 100]),
        explanation: `Subtract place by place, regrouping when needed. Check: ${n(b)} + ${n(a - b)} = ${n(a)}.`,
      };
    },
  },
  {
    key: "oa4",
    standard: "NC.4.OA.4",
    skill: "Factors, multiples, and primes",
    make() {
      const kind = randInt(0, 2);
      if (kind === 0) {
        const N = pick([12, 16, 18, 20, 24, 28, 30, 32, 36, 40, 42, 45, 48]);
        const factors = Array.from({ length: N - 3 }, (_, i) => i + 2).filter((f) => N % f === 0 && f < N);
        const f = pick(factors);
        const non = shuffle(Array.from({ length: 14 }, (_, i) => i + 2).filter((x) => N % x !== 0)).slice(0, 3);
        return {
          prompt: `Which number is a factor of ${N}?`,
          answer: String(f),
          wrong: non.map(String),
          explanation: `${N} ÷ ${f} = ${N / f} with nothing left over, so ${f} is a factor of ${N}.`,
        };
      }
      if (kind === 1) {
        const p = pick(PRIMES_50.filter((x) => x > 2));
        const non = shuffle(TRICKY_COMPOSITES).slice(0, 3);
        return {
          prompt: "Which number is prime?",
          answer: String(p),
          wrong: non.map(String),
          explanation: `${p} has exactly two factors: 1 and ${p}. The others can be divided by another number (and 1 is not prime).`,
        };
      }
      const k = randInt(3, 9);
      const m = k * randInt(3, 11);
      const non = new Set<number>();
      while (non.size < 3) {
        const v = m + randInt(-12, 12);
        if (v > 1 && v % k !== 0) non.add(v);
      }
      return {
        prompt: `Which number is a multiple of ${k}?`,
        answer: String(m),
        wrong: [...non].map(String),
        explanation: `${k} × ${m / k} = ${m}, so ${m} is a multiple of ${k}.`,
      };
    },
  },
  {
    key: "nf1",
    standard: "NC.4.NF.1",
    skill: "Equivalent fractions",
    make() {
      const b = pick([2, 3, 4, 5, 6]);
      const a = randInt(1, b - 1);
      const m = randInt(2, b <= 4 ? 4 : 2);
      const D = b * m;
      return {
        prompt: `${a}/${b} = ?/${D}`,
        ...nums(a * m, [a + (D - b), a, a * m + 1, D - a], { min: 1 }),
        explanation: `${b} × ${m} = ${D}, so multiply the top by ${m} too: ${a} × ${m} = ${a * m}.`,
      };
    },
  },
  {
    key: "nf2",
    standard: "NC.4.NF.2",
    skill: "Compare fractions",
    make() {
      const dens = [2, 3, 4, 5, 6, 8, 10, 12];
      const list: Frac[] = [];
      const shown: [number, number][] = [];
      while (list.length < 4) {
        const d = pick(dens);
        const k = randInt(1, d - 1);
        const f = fr(k, d);
        if (!list.some((g) => feq(g, f))) {
          list.push(f);
          shown.push([k, d]);
        }
      }
      const big = chance(0.6);
      let best = 0;
      list.forEach((f, i) => {
        const cmp = f.n * list[best].d - list[best].n * f.d;
        if (big ? cmp > 0 : cmp < 0) best = i;
      });
      return {
        prompt: big ? "Which fraction is the greatest?" : "Which fraction is the least?",
        answer: raw(...shown[best]),
        wrong: shown.filter((_, i) => i !== best).map((s) => raw(...s)),
        explanation: `Compare each to 1/2, or rewrite with a common denominator. ${raw(...shown[best])} is the ${big ? "greatest" : "least"}.`,
      };
    },
  },
  {
    key: "nf3",
    standard: "NC.4.NF.3",
    skill: "Add and subtract like fractions",
    make() {
      const d = pick([3, 4, 5, 6, 8, 10, 12]);
      if (chance()) {
        const a = randInt(1, d - 2);
        const b = randInt(1, d - 1 - a);
        return {
          prompt: `What is ${a}/${d} + ${b}/${d}?`,
          ...rawFracs([a + b, d], [[a + b, 2 * d], [a * b, d], [a + b + 1, d], [a + b, d + 1]]),
          explanation: `The pieces are the same size (${d}ths), so add the tops and keep the bottom: ${a + b}/${d}.`,
        };
      }
      const a = randInt(2, d - 1);
      const b = randInt(1, a - 1);
      return {
        prompt: `What is ${a}/${d} − ${b}/${d}?`,
        ...rawFracs([a - b, d], [[a - b, d * 2], [a + b, d], [a - b + 1, d], [a - b, d - 1]]),
        explanation: `Same size pieces, so subtract the tops and keep the bottom: ${a - b}/${d}.`,
      };
    },
  },
  {
    key: "nf4",
    standard: "NC.4.NF.4",
    skill: "Multiply a fraction by a whole number",
    make() {
      const w = randInt(2, 6);
      const b = pick([3, 4, 5, 6, 8, 10, 12]);
      const a = randInt(1, b - 1);
      return {
        prompt: `What is ${w} × ${a}/${b}?`,
        ...rawFracs([w * a, b], [[w * a, w * b], [a, w * b], [w + a, b], [w * a + 1, b]]),
        explanation: `${w} groups of ${a}/${b} is ${w} × ${a} = ${w * a} pieces of size 1/${b}: ${w * a}/${b}.`,
      };
    },
  },
  {
    key: "nf6",
    standard: "NC.4.NF.6",
    skill: "Fractions as decimals",
    make() {
      if (chance()) {
        let k = randInt(1, 99);
        if (k % 10 === 0) k += 1;
        return {
          prompt: `Write ${k}/100 as a decimal.`,
          answer: dec(k, 2),
          wrong: [dec(k, 1), dec(k, 3), String(k), dec(k * 10 + 1, 3)].filter((w) => w !== dec(k, 2)),
          explanation: `Hundredths use two places after the point, so ${k}/100 = ${dec(k, 2)}.`,
        };
      }
      const k = randInt(1, 9);
      return {
        prompt: `Write ${k}/10 as a decimal.`,
        answer: dec(k, 1),
        wrong: [dec(k, 2), String(k), `${k}.10`, dec(k, 3)],
        explanation: `Tenths use one place after the point, so ${k}/10 = ${dec(k, 1)}.`,
      };
    },
  },
  {
    key: "nf7",
    standard: "NC.4.NF.7",
    skill: "Compare decimals",
    make() {
      const vals = new Set<number>();
      vals.add(randInt(1, 9) * 10); // a tenths value like 0.5
      while (vals.size < 4) vals.add(randInt(1, 99));
      const arr = [...vals];
      const big = chance(0.6);
      const ans = big ? Math.max(...arr) : Math.min(...arr);
      return {
        prompt: big ? "Which decimal is the greatest?" : "Which decimal is the least?",
        answer: dec(ans, 2),
        wrong: arr.filter((v) => v !== ans).map((v) => dec(v, 2)),
        explanation: `Compare tenths first, then hundredths (0.5 = 0.50). ${dec(ans, 2)} is the ${big ? "greatest" : "least"}.`,
      };
    },
  },
  {
    key: "md6",
    standard: "NC.4.MD.6",
    skill: "Unknown angles",
    make() {
      const total = pick([90, 180]);
      const a = 5 * randInt(2, total / 5 - 2);
      const ans = total - a;
      const deg = (v: number) => `${v}°`;
      return {
        prompt: `A ${total === 90 ? "right" : "straight"} angle is split into two angles. One is ${a}°. What is the other?`,
        ...nums(ans, [(total === 90 ? 180 : 90) - a, a, ans + 10, ans - 10], { min: 1, fmt: deg }),
        explanation: `A ${total === 90 ? "right" : "straight"} angle is ${total}°. ${total}° − ${a}° = ${ans}°.`,
      };
    },
  },
  {
    key: "md3",
    standard: "NC.4.MD.3",
    skill: "Area and perimeter formulas",
    make() {
      const w = randInt(2, 12);
      const l = randInt(w + 1, 15);
      const u = pick(["ft", "m", "cm", "yd"]);
      if (chance()) {
        const A = l * w;
        return {
          prompt: `A rectangle has an area of ${A} sq ${u}. Its width is ${w} ${u}. What is its length?`,
          ...nums(l, [A - w, A * w, A - 2 * w, l + 1], { min: 1, fmt: (v) => `${v} ${u}` }),
          explanation: `Area = length × width, so length = ${A} ÷ ${w} = ${l} ${u}.`,
        };
      }
      const P = 2 * (l + w);
      return {
        prompt: `A rectangle has a perimeter of ${P} ${u}. Its width is ${w} ${u}. What is its length?`,
        ...nums(l, [P - w, P / 2 - 2 * w, P - 2 * w, l + w], { min: 1, fmt: (v) => `${v} ${u}` }),
        explanation: `Length + width is half the perimeter: ${P} ÷ 2 = ${P / 2}. So length = ${P / 2} − ${w} = ${l} ${u}.`,
      };
    },
  },
  {
    key: "md1",
    standard: "NC.4.MD.1",
    skill: "Metric conversions",
    make() {
      const conv = pick([
        { big: "meters", small: "centimeters", f: 100 },
        { big: "kilograms", small: "grams", f: 1000 },
        { big: "liters", small: "milliliters", f: 1000 },
        { big: "kilometers", small: "meters", f: 1000 },
        { big: "centimeters", small: "millimeters", f: 10 },
      ]);
      const k = randInt(2, 9);
      return {
        prompt: `How many ${conv.small} are in ${k} ${conv.big}?`,
        ...nums(k * conv.f, [k * (conv.f === 10 ? 100 : 10), k + conv.f, k * conv.f * 10, conv.f === 1000 ? k * 100 : k * 1000], { min: 1 }),
        explanation: `1 ${conv.big.replace(/s$/, "")} = ${n(conv.f)} ${conv.small}, so ${k} × ${n(conv.f)} = ${n(k * conv.f)}.`,
      };
    },
  },
];

// ======================================================================== Grade 5

export const GRADE_5: Gen[] = [
  {
    key: "nbt7a",
    standard: "NC.5.NBT.7",
    skill: "Add and subtract decimals",
    make() {
      let a = randInt(11, 99); // tenths
      if (a % 10 === 0) a += 1;
      let b = randInt(101, 999); // hundredths
      if (b % 10 === 0) b += 1;
      if (chance()) {
        const s = a * 10 + b;
        return {
          prompt: `What is ${dec(a, 1)} + ${dec(b, 2)}?`,
          answer: dec(s, 2),
          wrong: [dec(a + b, 2), dec(s + 10, 2), dec(s - 10, 2), dec(s + 100, 2)],
          explanation: `Line up the decimal points (write ${dec(a, 1)} as ${dec(a, 1)}0), then add: ${dec(a, 1)}0 + ${dec(b, 2)} = ${dec(s, 2)}.`,
        };
      }
      const big = Math.max(a * 10, b);
      const small = Math.min(a * 10, b);
      const bigS = big === a * 10 ? dec(a, 1) : dec(b, 2);
      const smallS = small === a * 10 ? dec(a, 1) : dec(b, 2);
      const mis = Math.abs((big === a * 10 ? a : b) - (small === a * 10 ? a : b));
      return {
        prompt: `What is ${bigS} − ${smallS}?`,
        answer: dec(big - small, 2),
        wrong: [dec(mis, 2), dec(big - small + 10, 2), dec(big - small - 10, 2), dec(big + small, 2)].filter((w) => !w.startsWith("−")),
        explanation: `Line up the decimal points (write ${dec(a, 1)} as ${dec(a, 1)}0), then subtract: ${dec(big - small, 2)}.`,
      };
    },
  },
  {
    key: "nbt7m",
    standard: "NC.5.NBT.7",
    skill: "Multiply decimals",
    make() {
      const a = randInt(2, 9);
      if (chance()) {
        const b = randInt(2, 9);
        const p = a * b;
        return {
          prompt: `What is 0.${a} × 0.${b}?`,
          answer: dec(p, 2),
          wrong: [dec(p, 1), dec(p, 3), dec(a + b, 1), dec(p, 0)],
          explanation: `${a} × ${b} = ${p}. Tenths × tenths = hundredths, so 0.${a} × 0.${b} = ${dec(p, 2)}.`,
        };
      }
      const b = randInt(11, 99);
      const p = a * b;
      return {
        prompt: `What is ${a} × ${dec(b, 1)}?`,
        answer: dec(p, 1),
        wrong: [dec(p, 2), dec(p, 0), dec(a * 10 + b, 1), dec(p + 10, 1)],
        explanation: `${a} × ${b} = ${p}. There is one decimal place in ${dec(b, 1)}, so the answer is ${dec(p, 1)}.`,
      };
    },
  },
  {
    key: "nbt7d",
    standard: "NC.5.NBT.7",
    skill: "Divide decimals",
    make() {
      const d = randInt(2, 9);
      let q = randInt(2, 99);
      if (q % 10 === 0) q += 1;
      const t = q * d;
      return {
        prompt: `What is ${dec(t, 1)} ÷ ${d}?`,
        answer: dec(q, 1),
        wrong: [dec(q, 0), dec(q, 2), dec(q + 10, 1), dec(q * 10 + 1, 1)],
        explanation: `${t} ÷ ${d} = ${q}, and the answer keeps the tenths place: ${dec(t, 1)} ÷ ${d} = ${dec(q, 1)}.`,
      };
    },
  },
  {
    key: "nf1",
    standard: "NC.5.NF.1",
    skill: "Add and subtract unlike fractions",
    make() {
      let b = 0;
      let d = 0;
      while (b === d || b % d === 0 || d % b === 0) {
        b = randInt(2, 10);
        d = randInt(2, 10);
      }
      const a = randInt(1, b - 1);
      const c = randInt(1, d - 1);
      const x = fr(a, b);
      const y = fr(c, d);
      const L = lcm(b, d);
      const add = chance() || feq(x, y);
      if (add) {
        const s = fadd(x, y);
        return {
          prompt: `What is ${a}/${b} + ${c}/${d}?`,
          ...fracs(s, [fr(a + c, b + d), fr(a + c, L), fr(a * d + c * b, b + d), fr(a * c, b * d)], mixed, { positive: true }),
          explanation: `Use a common denominator of ${L}: ${a * (L / b)}/${L} + ${c * (L / d)}/${L} = ${a * (L / b) + c * (L / d)}/${L}${mixed(s) !== `${a * (L / b) + c * (L / d)}/${L}` ? ` = ${mixed(s)}` : ""}.`,
        };
      }
      const [p, q] = x.n * y.d > y.n * x.d ? [[a, b], [c, d]] : [[c, d], [a, b]];
      const s = fsub(fr(p[0], p[1]), fr(q[0], q[1]));
      return {
        prompt: `What is ${p[0]}/${p[1]} − ${q[0]}/${q[1]}?`,
        ...fracs(s, [p[0] - q[0] > 0 ? fr(p[0] - q[0], Math.abs(p[1] - q[1])) : null, fr(Math.abs(p[0] - q[0]) || 1, L), fadd(fr(p[0], p[1]), fr(q[0], q[1]))], mixed, { positive: true }),
        explanation: `Use a common denominator of ${L}: ${p[0] * (L / p[1])}/${L} − ${q[0] * (L / q[1])}/${L} = ${p[0] * (L / p[1]) - q[0] * (L / q[1])}/${L}${mixed(s) !== `${p[0] * (L / p[1]) - q[0] * (L / q[1])}/${L}` ? ` = ${mixed(s)}` : ""}.`,
      };
    },
  },
  {
    key: "nf4",
    standard: "NC.5.NF.4",
    skill: "Multiply fractions",
    make() {
      const b = randInt(2, 9);
      const d = randInt(2, 9);
      const a = randInt(1, b - 1);
      const c = randInt(1, d - 1);
      const p = fmul(fr(a, b), fr(c, d));
      return {
        prompt: `What is ${a}/${b} × ${c}/${d}?`,
        ...fracs(p, [fr(a + c, b + d), fr(a * d, b * c), fr(a * c, b + d), fr(a * c + 1, b * d)], fstr, { positive: true }),
        explanation: `Multiply the tops and the bottoms: ${a * c}/${b * d}${fstr(p) !== `${a * c}/${b * d}` ? `, which simplifies to ${fstr(p)}` : ""}.`,
      };
    },
  },
  {
    key: "nf7",
    standard: "NC.5.NF.7",
    skill: "Divide with unit fractions",
    make() {
      const w = randInt(2, 9);
      const k = randInt(2, 8);
      if (chance()) {
        return {
          prompt: `What is ${w} ÷ 1/${k}?`,
          ...fracs(fr(w * k, 1), [fr(w, k), fr(1, w * k), fr(w + k, 1), fr(k, w)], fstr, { positive: true }),
          explanation: `Each whole has ${k} pieces of size 1/${k}, so ${w} wholes have ${w} × ${k} = ${w * k}.`,
        };
      }
      return {
        prompt: `What is 1/${k} ÷ ${w}?`,
        ...fracs(fr(1, w * k), [fr(w * k, 1), fr(w, k), fr(k, w), fr(1, w + k)], fstr, { positive: true }),
        explanation: `Splitting 1/${k} into ${w} equal parts makes each part 1/${w * k}.`,
      };
    },
  },
  {
    key: "md5",
    standard: "NC.5.MD.5",
    skill: "Volume",
    make() {
      const l = randInt(2, 10);
      const w = randInt(2, 8);
      const h = randInt(2, 8);
      const u = pick(["cm", "in", "ft", "m"]);
      const cu = (v: number) => `${n(v)} ${u}³`;
      return {
        prompt: `A box is ${l} ${u} long, ${w} ${u} wide, and ${h} ${u} tall. What is its volume?`,
        ...nums(l * w * h, [l + w + h, l * w, 2 * (l * w + l * h + w * h), l * w * h + l * w], { min: 1, fmt: cu }),
        explanation: `Volume = length × width × height = ${l} × ${w} × ${h} = ${l * w * h} cubic ${UNIT_WORD[u]}.`,
      };
    },
  },
  {
    key: "oa2",
    standard: "NC.5.OA.2",
    skill: "Order of operations",
    make() {
      const t = randInt(0, 3);
      const a = randInt(2, 9);
      const b = randInt(2, 9);
      const c = randInt(2, 9);
      if (t === 0) {
        return {
          prompt: `What is ${a} + ${b} × ${c}?`,
          ...nums(a + b * c, [(a + b) * c, a * b + c, a + b + c], { min: 0 }),
          explanation: `Multiply before adding: ${b} × ${c} = ${b * c}, then ${a} + ${b * c} = ${a + b * c}.`,
        };
      }
      if (t === 1) {
        return {
          prompt: `What is (${a} + ${b}) × ${c}?`,
          ...nums((a + b) * c, [a + b * c, a * c + b, a + b + c], { min: 0 }),
          explanation: `Parentheses first: ${a} + ${b} = ${a + b}, then ${a + b} × ${c} = ${(a + b) * c}.`,
        };
      }
      if (t === 2) {
        const hi = b + c;
        return {
          prompt: `What is ${a} × (${hi} − ${c})?`,
          ...nums(a * b, [a * hi - c, a * hi + c, a + b], { min: 0 }),
          explanation: `Parentheses first: ${hi} − ${c} = ${b}, then ${a} × ${b} = ${a * b}.`,
        };
      }
      const big = c * b;
      const s = randInt(b + 1, 30);
      return {
        prompt: `What is ${s} − ${big} ÷ ${c}?`,
        ...nums(s - b, [(s - big) / c, s + b, s - big, s - b + c], { min: 0 }),
        explanation: `Divide before subtracting: ${big} ÷ ${c} = ${b}, then ${s} − ${b} = ${s - b}.`,
      };
    },
  },
  {
    key: "g1",
    standard: "NC.5.G.1",
    skill: "Coordinate plane",
    make() {
      const [x, y] = distinctInts(2, 0, 10);
      if (chance()) {
        return {
          prompt: `Start at (0, 0). Move ${x} right and ${y} up. What point are you on?`,
          answer: point(x, y),
          wrong: [point(y, x), point(x, x), point(y, y), point(x + y, 0)],
          explanation: `The first number tells how far right (${x}); the second tells how far up (${y}): ${point(x, y)}.`,
        };
      }
      const which = chance();
      return {
        prompt: `What is the ${which ? "x" : "y"}-coordinate of the point ${point(x, y)}?`,
        ...nums(which ? x : y, [which ? y : x, x + y, (which ? x : y) + 1], { min: 0 }),
        explanation: `A point is written (x, y). The ${which ? "x-coordinate is first" : "y-coordinate is second"}: ${which ? x : y}.`,
      };
    },
  },
  {
    key: "nbt5",
    standard: "NC.5.NBT.5",
    skill: "Multi-digit multiplication",
    make() {
      const a = randInt(102, 999);
      const b = randInt(12, 99);
      const p = a * b;
      const noShift = a * (b % 10) + a * Math.floor(b / 10);
      return {
        prompt: `What is ${a} × ${b}?`,
        ...nums(p, [noShift, p + 100, p - a, p + 1000]),
        explanation: `${a} × ${b % 10} = ${n(a * (b % 10))} and ${a} × ${Math.floor(b / 10) * 10} = ${n(a * Math.floor(b / 10) * 10)}. Add: ${n(p)}.`,
      };
    },
  },
  {
    key: "nbt6",
    standard: "NC.5.NBT.6",
    skill: "Divide by two-digit numbers",
    make() {
      const d = randInt(11, 45);
      const q = randInt(12, Math.floor(9999 / d));
      const t = d * q;
      return {
        prompt: `What is ${n(t)} ÷ ${d}?`,
        ...nums(q, [q + 10, q - 1, q + 1, q * 10], { min: 1 }),
        explanation: `Check with multiplication: ${d} × ${q} = ${n(t)}, so ${n(t)} ÷ ${d} = ${q}.`,
      };
    },
  },
  {
    key: "nbt2",
    standard: "NC.5.NBT.2",
    skill: "Multiply and divide by powers of 10",
    make() {
      let m = randInt(101, 999);
      if (m % 10 === 0) m += 1;
      const e = 2; // m × 10^-2, like 3.45
      const p = randInt(1, 3);
      const P = 10 ** p;
      const times = chance();
      const res = (ee: number) => dec(m, ee);
      const ans = times ? res(e - p) : res(e + p);
      return {
        prompt: `What is ${dec(m, e)} ${times ? "×" : "÷"} ${n(P)}?`,
        answer: ans,
        wrong: [times ? res(e + p) : res(e - p), times ? res(e - p + 1) : res(e + p - 1), times ? res(e - p - 1) : res(e + p + 1), `${dec(m, e)}${"0".repeat(p)}`],
        explanation: `${times ? "Multiplying" : "Dividing"} by ${n(P)} moves each digit ${p} place${p > 1 ? "s" : ""} to the ${times ? "left" : "right"}: ${ans}.`,
      };
    },
  },
  {
    key: "nbt4",
    standard: "NC.5.NBT.4",
    skill: "Round decimals",
    make() {
      let m = randInt(1001, 9999); // thousandths
      if (m % 10 === 0) m += 1;
      const tenth = chance();
      const unit = tenth ? 100 : 10;
      const down = Math.floor(m / unit) * unit;
      const r = m - down >= unit / 2 ? down + unit : down;
      const other = r === down ? down + unit : down;
      const places = tenth ? 1 : 2;
      const other2 = tenth ? Math.round(m / 10) * 10 : Math.round(m / 100) * 100;
      return {
        prompt: `Round ${dec(m, 3)} to the nearest ${tenth ? "tenth" : "hundredth"}.`,
        answer: dec(r / unit, places),
        wrong: [dec(other / unit, places), dec(other2 / (tenth ? 10 : 100), tenth ? 2 : 1), dec(Math.round(m / 1000), 0), dec(r / unit + 1, places)],
        pad: () => dec(Math.max(1, r / unit + nz(-4, 4)), places),
        explanation: `Look at the digit to the right of the ${tenth ? "tenths" : "hundredths"} place. ${dec(m, 3)} rounds to ${dec(r / unit, places)}.`,
      };
    },
  },
];
