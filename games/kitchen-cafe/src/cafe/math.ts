import type { Grade } from "../kit/types";
import { build, gradeN, type CafeQ, type Draft, type Moment, type TopicId } from "./common";
import { clock, deg, frac, gcd, int, money, pick, shuffle, type Rng } from "./rng";

/*
 * Café math, woven into the orders: counting scoops, clocks and oven timers, fraction cups,
 * scaling recipes, ratios and percents, making change, unit conversions, temperatures below
 * zero and °F ↔ °C. Every generator stores the numbers it used in `params`;
 * scripts/check-rules.ts recomputes each answer from them on its own.
 */

export interface MathGen {
  key: string;
  topic: Exclude<TopicId, "physical">;
  /** Grade numbers (K = 0) this generator writes for. */
  grades: number[];
  moment: Moment;
  skill: string;
  std: (n: number) => string;
  make: (n: number, r: Rng) => Draft | null;
}


const plural = (k: number, one: string, many = `${one}s`) => `${k} ${k === 1 ? one : many}`;
/** "3/4 cup", "1 1/2 cups", "2 cups" (simplified). */
export const cups = (num: number, den: number) => `${frac(num, den)} ${num > den ? "cups" : "cup"}`;

const FOODS = ["a pizza", "a pie", "a waffle", "a sandwich", "a tortilla", "a pan of cornbread"];
const PART_NAMES: Record<number, [string, string]> = { 2: ["half", "halves"], 3: ["third", "thirds"], 4: ["fourth", "fourths"] };

const SCOOP_THINGS = ["flour", "sugar", "oats", "blueberries", "chocolate chips"];

export const MATH_GENS: MathGen[] = [
  // ------------------------------------------------------------ numbers
  {
    key: "scoops", topic: "numbers", grades: [0, 1], moment: "bowl", skill: "Add within 10/20",
    std: (n) => (n === 0 ? "NC.K.OA.2" : "NC.1.OA.1"),
    make: (n, r) => {
      const max = n === 0 ? 5 : 10;
      const a = int(r, 1, max), b = int(r, 1, max);
      const what = pick(r, SCOOP_THINGS);
      const s = a + b;
      return {
        prompt: `Chef Bix puts ${plural(a, "scoop")} of ${what} in the bowl, then ${b} more. How many scoops in all?`,
        answer: String(s), wrong: [String(s + 1), String(s - 1), String(Math.abs(a - b)), String(s + 2)],
        explanation: `${a} + ${b} = ${s} scoops. Count on from ${a}: ${Array.from({ length: b }, (_, i) => a + i + 1).join(", ")}.`,
        params: { a, b },
      };
    },
  },
  {
    key: "most", topic: "numbers", grades: [0, 1], moment: "pay", skill: "Compare numbers",
    std: (n) => (n === 0 ? "NC.K.CC.6" : "NC.1.NBT.3"),
    make: (n, r) => {
      const nums = new Set<number>();
      while (nums.size < 4) nums.add(n === 0 ? int(r, 1, 10) : int(r, 10, 99));
      const arr = [...nums];
      const most = r() < 0.6;
      const best = most ? Math.max(...arr) : Math.min(...arr);
      const thing = n === 0 ? "pancakes" : "blueberries";
      return {
        prompt: `Four plates of ${thing}. Which plate has the ${most ? "MOST" : "FEWEST"}?`,
        answer: `Plate with ${best}`, wrong: arr.filter((v) => v !== best).map((v) => `Plate with ${v}`),
        explanation: `${best} is the ${most ? "biggest" : "smallest"} number of ${[...arr].sort((x, y) => x - y).join(", ")}.`,
        params: { nums: arr, most },
      };
    },
  },
  {
    key: "clock", topic: "numbers", grades: [1, 2], moment: "oven", skill: "Tell time",
    std: (n) => (n === 1 ? "NC.1.MD.3" : "NC.2.MD.7"),
    make: (n, r) => {
      const h = int(r, 1, 12);
      const m = n === 1 ? pick(r, [0, 30]) : int(r, 1, 11) * 5;
      const mm = String(m).padStart(2, "0");
      const hand = m === 0 ? 12 : m / 5;
      const next = (h % 12) + 1;
      const wrong = n === 1
        ? [`${h}:${m === 0 ? "30" : "00"}`, `${next}:${mm}`, `12:${String(h).padStart(2, "0")}`]
        : [`${h}:${String(hand).padStart(2, "0")}`, `${next}:${mm}`, `${h}:${String((60 - m) % 60).padStart(2, "0")}`, `${hand}:${String(h * 5 % 60).padStart(2, "0")}`];
      return {
        prompt: `The kitchen clock: the short hand is ${m === 0 ? `on ${h}` : n === 1 ? `halfway between ${h} and ${next}` : `just past ${h}`} and the long hand points to ${hand}. What time is it?`,
        answer: `${h}:${mm}`, wrong,
        explanation: m === 0 ? `The long hand on 12 means "o'clock": ${h}:00.` : `The long hand on ${hand} means ${hand} × 5 = ${m} minutes past ${h}: ${h}:${mm}.`,
        params: { h, m },
      };
    },
  },
  {
    key: "elapsed", topic: "numbers", grades: [3, 4], moment: "oven", skill: "Elapsed time",
    std: (n) => (n === 3 ? "NC.3.MD.1" : "NC.4.MD.2"),
    make: (n, r) => {
      const start = int(r, 6 * 12, 11 * 12) * 5; // 6:00-11:00 in 5-minute steps
      const bake = n === 3 ? int(r, 3, 11) * 5 : int(r, 5, 20) * 5;
      const end = start + bake;
      const what = pick(r, ["muffins", "a pizza", "banana bread", "cookies", "a pie"]);
      return {
        prompt: `Chef Bix puts ${what} in the oven at ${clock(start)} and sets the timer for ${bake} minutes. What time will the timer ring?`,
        answer: clock(end), wrong: [clock(end + 10), clock(end - 10), clock(end + 60), clock(end + 5)],
        explanation: `Start at ${clock(start)} and count on ${bake} minutes: ${clock(end)}.`,
        params: { start, bake },
      };
    },
  },
  {
    key: "convert", topic: "numbers", grades: [4, 5], moment: "bowl", skill: "Convert measurement units",
    std: (n) => (n === 4 ? "NC.4.MD.1" : "NC.5.MD.1"),
    make: (n, r) => {
      const units = [
        { big: "cup", small: "fluid ounces", per: 8 },
        { big: "quart", small: "cups", per: 4 },
        { big: "pound", small: "ounces", per: 16 },
        { big: "hour", small: "minutes", per: 60 },
        { big: "gallon", small: "quarts", per: 4 },
        { big: "kilogram", small: "grams", per: 1000 },
        { big: "liter", small: "milliliters", per: 1000 },
      ];
      const u = pick(r, units);
      const k = int(r, 2, 9);
      const toBig = n === 5 && r() < 0.5;
      const total = k * u.per;
      const answer = toBig ? k : total;
      return {
        prompt: toBig
          ? `1 ${u.big} = ${u.per} ${u.small}. Chef Bix has ${total} ${u.small}. How many ${u.big}s is that?`
          : `1 ${u.big} = ${u.per} ${u.small}. The recipe needs ${k} ${u.big}s. How many ${u.small} is that?`,
        answer: String(answer), wrong: toBig ? [String(k + 1), String(k - 1), String(total - u.per), String(k * 2)] : [String(total + u.per), String(k + u.per), String(total - u.per), String(k * 10)],
        explanation: toBig ? `${total} ÷ ${u.per} = ${k} ${u.big}s.` : `${k} × ${u.per} = ${total} ${u.small}.`,
        params: { per: u.per, k, toBig },
      };
    },
  },
  {
    key: "order-temps", topic: "numbers", grades: [6], moment: "freezer", skill: "Compare temperatures below zero",
    std: () => "NC.6.NS.7",
    make: (_n, r) => {
      const set = new Set<number>();
      while (set.size < 4) set.add(int(r, -20, 40));
      const t = [...set];
      const coldest = r() < 0.5;
      const ans = coldest ? Math.min(...t) : Math.max(...t);
      const names = ["the freezer", "the ice-cream bin", "the cooler", "the snow-cone tub"];
      return {
        prompt: `Frosty Truck thermometers read ${t.map((v, i) => `${names[i]} ${deg(v, "F")}`).join(", ")}. Which is the ${coldest ? "COLDEST" : "WARMEST"} reading?`,
        answer: deg(ans, "F"), wrong: t.filter((v) => v !== ans).map((v) => deg(v, "F")),
        explanation: `On a number line, ${coldest ? "the coldest is farthest left" : "the warmest is farthest right"}: ${[...t].sort((a, b) => a - b).map((v) => deg(v, "F")).join(" < ")}.`,
        params: { t, coldest },
      };
    },
  },
  {
    key: "temp-change", topic: "numbers", grades: [7], moment: "freezer", skill: "Add and subtract integers",
    std: () => "NC.7.NS.1",
    make: (_n, r) => {
      const start = int(r, -18, -2);
      const up = int(r, 5, 25);
      const warm = r() < 0.5;
      if (warm) {
        const end = start + up;
        return {
          prompt: `The truck freezer reads ${deg(start, "F")}. The door stays open and it warms up ${up}°F. What does it read now?`,
          answer: deg(end, "F"), wrong: [deg(start - up, "F"), deg(-(end), "F"), deg(up - start + 0, "F"), deg(end + 2, "F")],
          explanation: `${deg(start, "F")} + ${up} = ${deg(end, "F")}. Start at ${start} on the number line and move ${up} to the right.`,
          params: { start, up, warm },
        };
      }
      const high = int(r, 20, 45);
      const diff = high - start;
      return {
        prompt: `The cooler is ${deg(high, "F")} and the freezer is ${deg(start, "F")}. How many degrees colder is the freezer?`,
        answer: `${diff}°F`, wrong: [`${high + start < 0 ? -(high + start) : high + start}°F`, `${diff + 10}°F`, `${diff - 2}°F`, `${high}°F`],
        explanation: `${high} − (${deg(start, "F").replace("°F", "")}) = ${high} + ${-start} = ${diff}°F.`,
        params: { start, high, warm },
      };
    },
  },
  {
    key: "f-to-c", topic: "numbers", grades: [9, 10, 11, 12], moment: "oven", skill: "Temperature formula (°F and °C)",
    std: (n) => (n === 11 ? "NC.M3.F-BF.4" : "NC.M1.A-CED.4"),
    make: (n, r) => {
      const c = pick(r, [-20, -10, 0, 5, 10, 20, 25, 35, 40, 60, 100, 150, 160, 175, 180, 190, 200, 220, 230, 250]);
      const f = (c * 9) / 5 + 32;
      const toF = n !== 11 && r() < 0.5;
      if (toF) {
        return {
          prompt: `F = (9/5)·C + 32. A recipe says to heat the oven to ${deg(c, "C")}. What is that in °F?`,
          answer: deg(f, "F"), wrong: [deg(2 * c + 30, "F"), deg(((c + 32) * 9) / 5, "F"), deg((c * 9) / 5, "F"), deg(f + 18, "F")],
          explanation: `(9/5)(${c}) + 32 = ${(c * 9) / 5} + 32 = ${f}°F.`,
          params: { c, f, toF },
        };
      }
      return {
        prompt: n === 11
          ? `F(C) = (9/5)·C + 32. Its inverse, C(F) = (5/9)(F − 32), turns °F into °C. What is C(${f})?`
          : `F = (9/5)·C + 32. Solve for C: the freezer thermometer reads ${deg(f, "F")}. What is that in °C?`,
        answer: deg(c, "C"), wrong: [deg(Math.round(((f - 32) * 9) / 5), "C"), deg(Math.round((f * 5) / 9 - 32), "C"), deg(Math.round(f / 2 - 15), "C"), deg(c - 10, "C"), deg(c + 10, "C")],
        explanation: `C = (5/9)(F − 32) = (5/9)(${f - 32}) = ${c}°C.`,
        params: { c, f, toF },
      };
    },
  },
  // ------------------------------------------------------------ fractions
  {
    key: "pizza-parts", topic: "fractions", grades: [1, 2], moment: "board", skill: "Halves, thirds and fourths",
    std: (n) => (n === 1 ? "NC.1.G.3" : "NC.2.G.3"),
    make: (n, r) => {
      const parts = n === 1 ? pick(r, [2, 4]) : pick(r, [2, 3, 4]);
      const name: Record<number, string> = { 2: "One half", 3: "One third", 4: "One fourth" };
      const food = pick(r, FOODS);
      return {
        prompt: `Chef Bix cuts ${food} into ${parts} equal slices. What is one slice called?`,
        answer: name[parts], wrong: ["One half", "One third", "One fourth", "One whole"].filter((x) => x !== name[parts]),
        explanation: `${parts} equal parts make ${parts === 2 ? "halves" : parts === 3 ? "thirds" : "fourths"}, so one slice is ${name[parts].toLowerCase()} of ${food.replace(/^an? /, "the ")}.`,
        params: { parts },
      };
    },
  },
  {
    key: "slices-left", topic: "fractions", grades: [1, 2], moment: "pay", skill: "Halves, thirds and fourths",
    std: (n) => (n === 1 ? "NC.1.G.3" : "NC.2.G.3"),
    make: (n, r) => {
      const parts = n === 1 ? pick(r, [2, 4]) : pick(r, [3, 4]);
      const eaten = int(r, 1, parts - 1);
      const left = parts - eaten;
      const word = (k: number, p: number) => `${k} ${PART_NAMES[p][k === 1 ? 0 : 1]}`;
      const other = parts === 4 ? 2 : 4;
      const food = pick(r, FOODS);
      return {
        prompt: `Chef Bix cuts ${food} into ${parts} equal parts. A customer eats ${eaten} of them. How much is left?`,
        answer: word(left, parts), wrong: [word(eaten + (eaten === left ? 1 : 0), parts), word(parts, parts), word(left, other), word(left + 1, parts), word(left, parts === 3 ? 2 : 3)],
        explanation: `${parts} equal parts are ${PART_NAMES[parts][1]}. ${parts} − ${eaten} = ${left}, so ${word(left, parts)} ${left === 1 ? "is" : "are"} left.`,
        params: { parts, eaten },
      };
    },
  },
  {
    key: "cup-fill", topic: "fractions", grades: [3], moment: "bowl", skill: "Fraction cups",
    std: () => "NC.3.NF.1",
    make: (_n, r) => {
      const d = pick(r, [3, 4, 6, 8]);
      const k = int(r, 2, d - 1);
      const what = pick(r, SCOOP_THINGS);
      return {
        prompt: `Chef Bix fills the 1/${d} cup with ${what} ${plural(k, "time")}. How many cups of ${what} is that?`,
        answer: `${k}/${d} cup`, wrong: [cups(1, d * k), cups(k, d + k), cups(d, k), cups(k + 1, d)],
        explanation: `${k} scoops of 1/${d} is ${k}/${d} cup: ${Array(k).fill(`1/${d}`).join(" + ")} = ${k}/${d}${frac(k, d) !== `${k}/${d}` ? ` (the same as ${frac(k, d)})` : ""}.`,
        params: { d, k },
      };
    },
  },
  {
    key: "cup-compare", topic: "fractions", grades: [3], moment: "bowl", skill: "Compare fractions",
    std: () => "NC.3.NF.3",
    make: (_n, r) => {
      const ds = shuffle(r, [2, 3, 4, 6, 8]).slice(0, 4);
      const big = r() < 0.5;
      const ans = big ? Math.min(...ds) : Math.max(...ds);
      return {
        prompt: `Which measuring cup holds the ${big ? "MOST" : "LEAST"}?`,
        answer: `1/${ans} cup`, wrong: ds.filter((d) => d !== ans).map((d) => `1/${d} cup`),
        explanation: big ? `Fewer equal parts means bigger parts: 1/${ans} is the biggest unit fraction here.` : `More equal parts means smaller parts: 1/${ans} is the smallest unit fraction here.`,
        params: { ds, big },
      };
    },
  },
  {
    key: "add-like", topic: "fractions", grades: [4], moment: "bowl", skill: "Add fractions",
    std: () => "NC.4.NF.3",
    make: (_n, r) => {
      const d = pick(r, [3, 4, 6, 8]);
      const a = int(r, 1, d - 1), b = int(r, 1, d - 1);
      return {
        prompt: `The batter needs ${a}/${d} cup of milk and ${b}/${d} cup of water. How much liquid in all?`,
        answer: cups(a + b, d), wrong: [cups(a + b, d + d), cups(a + b + 1, d), cups(Math.abs(a - b) || d + 1, d), cups(a * b, d), cups(a + b + 2, d)],
        explanation: `Same-size parts: ${a}/${d} + ${b}/${d} = ${a + b}/${d}${frac(a + b, d) !== `${a + b}/${d}` ? ` = ${frac(a + b, d)}` : ""} cup.`,
        params: { a, b, d },
      };
    },
  },
  {
    key: "times-whole", topic: "fractions", grades: [4], moment: "bowl", skill: "Multiply a fraction by a whole number",
    std: () => "NC.4.NF.4",
    make: (_n, r) => {
      const d = pick(r, [2, 3, 4]);
      const a = int(r, 1, d - 1);
      const k = int(r, 2, 6);
      return {
        prompt: `One batch of muffins uses ${a}/${d} cup of oil. Chef Bix makes ${k} batches. How much oil?`,
        answer: cups(a * k, d), wrong: [cups(a, d * k), cups(a * k + d, d), cups(a + k, d), cups(a * k + 1, d), cups(a * k - 1, d)],
        explanation: `${k} × ${a}/${d} = ${a * k}/${d} = ${frac(a * k, d)} cups.`,
        params: { a, d, k },
      };
    },
  },
  {
    key: "add-unlike", topic: "fractions", grades: [5], moment: "bowl", skill: "Add fractions with unlike denominators",
    std: () => "NC.5.NF.1",
    make: (_n, r) => {
      const pairs: [number, number][] = [[2, 3], [2, 4], [3, 4], [2, 6], [3, 6], [4, 8], [2, 8], [3, 8]];
      const [d1, d2] = pick(r, pairs);
      const a = int(r, 1, d1 - 1), b = int(r, 1, d2 - 1);
      const den = (d1 * d2) / gcd(d1, d2);
      const num = a * (den / d1) + b * (den / d2);
      return {
        prompt: `Chef Bix adds ${a}/${d1} cup of sugar and ${b}/${d2} cup of brown sugar. How much sugar in all?`,
        answer: cups(num, den), wrong: [cups(a + b, d1 + d2), cups(num + 1, den), cups(a * b, d1 * d2), cups(num, den * 2), cups(num + 2, den)],
        explanation: `Use ${den}ths: ${a}/${d1} = ${a * (den / d1)}/${den} and ${b}/${d2} = ${b * (den / d2)}/${den}, so the total is ${num}/${den} = ${frac(num, den)} cup${num > den ? "s" : ""}.`,
        params: { a, d1, b, d2 },
      };
    },
  },
  {
    key: "half-recipe", topic: "fractions", grades: [5], moment: "bowl", skill: "Multiply fractions",
    std: () => "NC.5.NF.4",
    make: (_n, r) => {
      const d = pick(r, [3, 4, 5, 8]);
      const a = int(r, 1, d - 1);
      const p = pick(r, [2, 3, 4]);
      return {
        prompt: `A recipe needs ${a}/${d} cup of honey. Chef Bix makes 1/${p} of the recipe. How much honey?`,
        answer: cups(a, d * p), wrong: [cups(a * p, d), cups(a, d + p), cups(a + 1, d * p), cups(a, d + p * 2)],
        explanation: `1/${p} of ${a}/${d} = (1 × ${a})/(${p} × ${d}) = ${frac(a, d * p)} cup.`,
        params: { a, d, p },
      };
    },
  },
  {
    key: "scoops-in", topic: "fractions", grades: [6], moment: "bowl", skill: "Divide fractions",
    std: () => "NC.6.NS.1",
    make: (_n, r) => {
      const d = pick(r, [2, 3, 4, 8]);
      const total = int(r, 1, 4) * d + int(r, 0, d - 1);
      const k = total; // number of 1/d scoops
      return {
        prompt: `How many 1/${d}-cup scoops does it take to measure ${frac(total, d)} cups of flour?`,
        answer: String(k), wrong: [String(k + 1), String(Math.max(1, k - 1)), String(Math.max(2, Math.round((total / d) * 2))), String(k * 2)],
        explanation: `${frac(total, d)} ÷ 1/${d} = ${total}/${d} × ${d} = ${k} scoops.`,
        params: { total, d },
      };
    },
  },
  {
    key: "frac-of-frac", topic: "fractions", grades: [7], moment: "bowl", skill: "Multiply rational numbers",
    std: () => "NC.7.NS.2",
    make: (_n, r) => {
      const d1 = pick(r, [3, 4, 5]);
      const a = int(r, 1, d1 - 1);
      const d2 = pick(r, [2, 3, 4]);
      const b = int(r, 1, d2 - 1);
      const extra = int(r, 1, 2);
      // (extra + a/d1) × b/d2
      const num = (extra * d1 + a) * b;
      const den = d1 * d2;
      return {
        prompt: `The bowl holds ${frac(extra * d1 + a, d1)} cups of batter. Chef Bix pours ${b}/${d2} of it into a pan. How many cups go in the pan?`,
        answer: cups(num, den), wrong: [cups(extra * b + a * b, d1 * d2), cups(num + den, den), cups(extra * d1 + a, d1 * d2), cups(num, den + d2), cups(num + 1, den)],
        explanation: `${frac(extra * d1 + a, d1)} = ${extra * d1 + a}/${d1}; × ${b}/${d2} = ${num}/${den} = ${frac(num, den)} cup${num > den ? "s" : ""}.`,
        params: { extra, a, d1, b, d2 },
      };
    },
  },
  // ------------------------------------------------------------ ratios, rates, scaling
  {
    key: "batches", topic: "ratios", grades: [3, 4, 5], moment: "bowl", skill: "Scale a recipe",
    std: (n) => (n === 3 ? "NC.3.OA.3" : n === 4 ? "NC.4.NBT.5" : "NC.5.NBT.5"),
    make: (n, r) => {
      const per = n === 3 ? int(r, 2, 9) : n === 4 ? int(r, 12, 48) : int(r, 24, 125);
      const k = n === 3 ? int(r, 2, 9) : n === 4 ? int(r, 3, 9) : int(r, 12, 30);
      const thing = n === 3 ? pick(r, ["eggs", "bananas", "strawberries"]) : pick(r, ["blueberries", "chocolate chips", "pepperoni slices"]);
      return {
        prompt: `One batch uses ${per} ${thing}. Chef Bix makes ${k} batches for the rush. How many ${thing}?`,
        answer: String(per * k), wrong: [String(per + k), String(per * k + per), String(per * k - k), String(per * (k - 1))],
        explanation: `${k} batches × ${per} ${thing} = ${per * k}.`,
        params: { per, k },
      };
    },
  },
  {
    key: "ratio-table", topic: "ratios", grades: [6], moment: "bowl", skill: "Ratios",
    std: () => "NC.6.RP.3",
    make: (_n, r) => {
      const a = int(r, 1, 4), b = int(r, 2, 9);
      if (a >= b) return null;
      const k = int(r, 2, 6);
      return {
        prompt: `Lemonade: ${a} cup${a > 1 ? "s" : ""} of lemon juice for every ${b} cups of water. Chef Bix uses ${b * k} cups of water. How much lemon juice?`,
        answer: `${a * k} cups`, wrong: [`${b * k - b + a} cups`, `${a + k} cups`, `${a * k + a} cups`, `${b * k} cups`],
        explanation: `${b * k} is ${k} × ${b}, so use ${k} × ${a} = ${a * k} cups of lemon juice to keep the ratio ${a}:${b}.`,
        params: { a, b, k },
      };
    },
  },
  {
    key: "unit-rate", topic: "ratios", grades: [6, 7], moment: "bowl", skill: "Unit rates",
    std: (n) => (n === 6 ? "NC.6.RP.3" : "NC.7.RP.1"),
    make: (n, r) => {
      if (n === 6) {
        const per = int(r, 2, 9);
        const cups = int(r, 2, 8);
        const muffins = per * cups;
        return {
          prompt: `${muffins} muffins use ${cups} cups of flour. At that rate, how many muffins does 1 cup make?`,
          answer: String(per), wrong: [String(per + 1), String(muffins - cups), String(cups), String(per * 2)],
          explanation: `${muffins} ÷ ${cups} = ${per} muffins per cup.`,
          params: { muffins, cups },
        };
      }
      const b = pick(r, [2, 3, 4, 8]), d = pick(r, [2, 3, 4]);
      const a = int(r, 1, b - 1); // a/b cup
      const c = int(r, 1, d - 1); // c/d batch
      if (a * d === b * c) return null;
      const num = a * d, den = b * c; // (a/b) ÷ (c/d)
      return {
        prompt: `${a}/${b} cup of sugar makes ${c}/${d} of a batch. How many cups of sugar for one whole batch?`,
        answer: cups(num, den), wrong: [cups(a * c, b * d), cups(den, num), cups(num + den, den), cups(a, b + d), cups(num + 1, den)],
        explanation: `Cups per batch = (${a}/${b}) ÷ (${c}/${d}) = ${a}/${b} × ${d}/${c} = ${num}/${den} = ${frac(num, den)}.`,
        params: { a, b, c, d },
      };
    },
  },
  {
    key: "percent-of", topic: "ratios", grades: [6, 7], moment: "pay", skill: "Percents",
    std: (n) => (n === 6 ? "NC.6.RP.3" : "NC.7.RP.3"),
    make: (n, r) => {
      if (n >= 7 && r() < 0.5) {
        const old = int(r, 2, 10) * 4;
        const pct = pick(r, [10, 20, 25, 50, 75]);
        const nw = old + (old * pct) / 100;
        if (!Number.isInteger(nw)) return null;
        return {
          prompt: `A bag of flour cost ${money(old * 100)} last month and ${money(nw * 100)} now. What is the percent increase?`,
          answer: `${pct}%`, wrong: [`${Math.round(((nw - old) / nw) * 100)}%`, `${nw - old}%`, `${pct + 5}%`, `${100 + pct}%`],
          explanation: `Increase ÷ original = ${nw - old} ÷ ${old} = ${pct / 100} = ${pct}%.`,
          params: { old, nw },
        };
      }
      const total = int(r, 2, 12) * 20;
      const pct = pick(r, [10, 20, 25, 30, 40, 50, 75]);
      const part = (total * pct) / 100;
      return {
        prompt: `The café sold ${total} pizzas today, and ${pct}% were veggie. How many veggie pizzas?`,
        answer: String(part), wrong: [String(pct), String(total - part), String(part + 10), String(Math.round(total / pct) + 1)],
        explanation: `${pct}% of ${total} = ${pct / 100} × ${total} = ${part}.`,
        params: { total, pct },
      };
    },
  },
  {
    key: "unit-convert", topic: "ratios", grades: [6, 7], moment: "bowl", skill: "Convert units with ratios",
    std: (n) => (n === 6 ? "NC.6.RP.3" : "NC.7.RP.2"),
    make: (_n, r) => {
      const u = pick(r, [
        { a: "quarts", b: "cups", per: 4 },
        { a: "pounds", b: "ounces", per: 16 },
        { a: "kilograms", b: "grams", per: 1000 },
        { a: "liters", b: "milliliters", per: 1000 },
        { a: "tablespoons", b: "teaspoons", per: 3 },
        { a: "cups", b: "tablespoons", per: 16 },
      ]);
      const half = r() < 0.5;
      const k = half ? int(r, 1, 6) + 0.5 : int(r, 2, 12);
      const ans = k * u.per;
      if (!Number.isInteger(ans)) return null;
      return {
        prompt: `1 ${u.a.replace(/s$/, "")} = ${u.per} ${u.b}. The recipe calls for ${k} ${u.a}. How many ${u.b} is that?`,
        answer: String(ans), wrong: [String(ans + u.per), String(Math.round(k + u.per)), String(ans - u.per), String(Math.round(ans / 2))],
        explanation: `${k} × ${u.per} = ${ans} ${u.b}.`,
        params: { per: u.per, k },
      };
    },
  },
  {
    key: "oven-graph", topic: "ratios", grades: [8, 9, 10, 11, 12], moment: "oven", skill: "Rate of change from a table",
    std: (n) => (n === 8 ? "NC.8.F.4" : "NC.M1.F-IF.6"),
    make: (_n, r) => {
      const start = pick(r, [70, 72, 75, 80]);
      const rate = pick(r, [15, 20, 25, 30, 35]);
      const step = 2;
      const pts = [0, 1, 2].map((i) => [i * step, start + rate * i * step]);
      const target = pick(r, [325, 350, 375, 400, 425]);
      const t = (target - start) / rate;
      const askTime = r() < 0.5 && Number.isInteger(t);
      const table = pts.map(([m, f]) => `${m} min: ${f}°F`).join(" · ");
      if (askTime) {
        return {
          prompt: `The oven heats at a steady rate: ${table}. How many minutes until it reaches ${target}°F?`,
          answer: `${t} min`, wrong: [`${t + 2} min`, `${Math.round(target / rate)} min`, `${t - 1} min`, `${t * 2} min`],
          explanation: `It heats ${rate}°F per minute from ${start}°F: (${target} − ${start}) ÷ ${rate} = ${t} minutes.`,
          params: { start, rate, target, askTime },
        };
      }
      return {
        prompt: `Oven temperature table: ${table}. How fast does the oven heat up?`,
        answer: `${rate}°F per min`, wrong: [`${rate * step}°F per min`, `${start}°F per min`, `${Math.round(rate / 2)}°F per min`, `${rate + 5}°F per min`],
        explanation: `Rate of change = change in temperature ÷ change in time = ${rate * step} ÷ ${step} = ${rate}°F per minute.`,
        params: { start, rate, target, askTime },
      };
    },
  },
  {
    key: "proportion", topic: "ratios", grades: [9, 10, 11, 12], moment: "bowl", skill: "Solve proportions",
    std: () => "NC.M1.A-REI.3",
    make: (_n, r) => {
      const s1 = pick(r, [4, 6, 8, 12]);
      const s2 = pick(r, [6, 9, 10, 15, 18, 20]);
      if (s1 === s2) return null;
      const per = pick(r, [0.25, 0.5, 0.75, 1.5]); // cups per serving
      const c1 = s1 * per;
      const c2 = s2 * per;
      return {
        prompt: `A soup for ${s1} servings uses ${c1} cups of broth. Solve ${c1}/${s1} = x/${s2}: how much broth for ${s2} servings?`,
        answer: `${c2} cups`, wrong: [`${c1 + (s2 - s1)} cups`, `${+((c1 * s1) / s2).toFixed(2)} cups`, `${c2 + per} cups`, `${c2 * 2} cups`],
        explanation: `x = ${s2} × ${c1}/${s1} = ${s2} × ${per} = ${c2} cups.`,
        params: { s1, s2, c1 },
      };
    },
  },
  // ------------------------------------------------------------ money
  {
    key: "change-cents", topic: "money", grades: [2], moment: "pay", skill: "Making change",
    std: () => "NC.2.MD.8",
    make: (_n, r) => {
      const price = int(r, 3, 19) * 5;
      const item = pick(r, ["toast", "a juice box", "a muffin", "an ice pop", "a cookie"]);
      const ch = 100 - price;
      return {
        prompt: `${item[0].toUpperCase() + item.slice(1)} costs ${price}¢. A customer pays with a $1 bill (100¢). How much change?`,
        answer: `${ch}¢`, wrong: [`${ch + 10}¢`, `${Math.abs(ch - 10) || 5}¢`, `${price}¢`, `${ch + 5}¢`],
        explanation: `100¢ − ${price}¢ = ${ch}¢. Count up from ${price}¢ to 100¢.`,
        params: { price },
      };
    },
  },
  {
    key: "change-dollars", topic: "money", grades: [3], moment: "pay", skill: "Two-step money problems",
    std: () => "NC.3.OA.8",
    make: (_n, r) => {
      const a = int(r, 2, 8), b = int(r, 1, 6);
      const paid = a + b <= 10 ? 10 : 20;
      const ch = paid - a - b;
      return {
        prompt: `Pancakes cost $${a} and juice costs $${b}. A customer pays with a $${paid} bill. How much change?`,
        answer: `$${ch}`, wrong: [`$${a + b}`, `$${ch + 1}`, `$${paid - a}`, `$${Math.abs(ch - 2)}`],
        explanation: `First add: $${a} + $${b} = $${a + b}. Then subtract: $${paid} − $${a + b} = $${ch}.`,
        params: { a, b, paid },
      };
    },
  },
  {
    key: "change-decimal", topic: "money", grades: [4, 5], moment: "pay", skill: "Money with decimals",
    std: (n) => (n === 4 ? "NC.4.MD.2" : "NC.5.NBT.7"),
    make: (_n, r) => {
      const a = int(r, 150, 650), b = int(r, 99, 350);
      const ac = Math.round(a / 5) * 5, bc = Math.round(b / 5) * 5;
      const total = ac + bc;
      const paid = total <= 1000 ? 1000 : 2000;
      const ch = paid - total;
      return {
        prompt: `A sandwich is ${money(ac)} and a smoothie is ${money(bc)}. The customer pays ${money(paid)}. How much change?`,
        answer: money(ch), wrong: [money(ch + 100), money(ch - 10), money(total), money(ch + 10)],
        explanation: `${money(ac)} + ${money(bc)} = ${money(total)}; ${money(paid)} − ${money(total)} = ${money(ch)}.`,
        params: { ac, bc, paid },
      };
    },
  },
  {
    key: "tip", topic: "money", grades: [6, 7], moment: "pay", skill: "Tips and tax",
    std: (n) => (n === 6 ? "NC.6.RP.3" : "NC.7.RP.3"),
    make: (n, r) => {
      const bill = int(r, 4, 24) * 200; // cents, even dollars
      const pct = n === 6 ? pick(r, [10, 15, 20, 25]) : pick(r, [15, 18, 20]);
      const tip = (bill * pct) / 100;
      if (n === 6) {
        return {
          prompt: `The bill is ${money(bill)}. The customer leaves a ${pct}% tip. How much is the tip?`,
          answer: money(tip), wrong: [money(pct * 100), money(tip * 2), money(bill + tip), money(tip + 50)],
          explanation: `${pct}% of ${money(bill)} = ${pct / 100} × ${money(bill)} = ${money(tip)}.`,
          params: { bill, pct, n },
        };
      }
      return {
        prompt: `The bill is ${money(bill)}. With ${pct === 18 ? "an" : "a"} ${pct}% tip added, what is the total?`,
        answer: money(bill + tip), wrong: [money(tip), money(bill + pct * 100), money(bill * 1.0 + tip * 2), money(bill + tip + 100)],
        explanation: `Tip: ${pct}% × ${money(bill)} = ${money(tip)}. Total: ${money(bill)} + ${money(tip)} = ${money(bill + tip)}.`,
        params: { bill, pct, n },
      };
    },
  },
  {
    key: "cost-fn", topic: "money", grades: [8], moment: "pay", skill: "Linear cost functions",
    std: () => "NC.8.F.4",
    make: (_n, r) => {
      const fee = pick(r, [5, 10, 12, 15, 20]);
      const each = pick(r, [6, 7, 8, 9, 11, 12]);
      if (r() < 0.5) {
        return {
          prompt: `Catering costs a $${fee} delivery fee plus $${each} per pizza. Which equation gives the cost C for p pizzas?`,
          answer: `C = ${each}p + ${fee}`, wrong: [`C = ${fee}p + ${each}`, `C = ${each + fee}p`, `C = ${each}(p + ${fee})`],
          explanation: `$${each} for each pizza is the rate (slope), and the $${fee} fee is paid once (the starting value): C = ${each}p + ${fee}.`,
          params: { fee, each, p: null },
        };
      }
      const p = int(r, 3, 12);
      return {
        prompt: `Catering costs C = ${each}p + ${fee} dollars for p pizzas. What does an order of ${p} pizzas cost?`,
        answer: `$${each * p + fee}`, wrong: [`$${(each + fee) * p}`, `$${each * p}`, `$${each + fee + p}`, `$${each * (p + fee)}`],
        explanation: `C = ${each}(${p}) + ${fee} = ${each * p} + ${fee} = $${each * p + fee}.`,
        params: { fee, each, p },
      };
    },
  },
  {
    key: "break-even", topic: "money", grades: [9, 10, 11, 12], moment: "pay", skill: "Cost per serving and break-even",
    std: () => "NC.M1.A-REI.3",
    make: (_n, r) => {
      if (r() < 0.5) {
        const serv = pick(r, [8, 10, 12, 16, 20]);
        const per = int(r, 45, 260) * 1; // cents per serving
        const total = serv * per;
        return {
          prompt: `A pot of chili costs ${money(total)} to make and serves ${serv}. What is the cost per serving?`,
          answer: money(per), wrong: [money(per + 10), money(Math.round(total / (serv + 2))), money(per * 2), money(Math.max(1, per - 25))],
          explanation: `${money(total)} ÷ ${serv} = ${money(per)} per serving.`,
          params: { serv, total, kind: "serving" },
        };
      }
      const price = pick(r, [300, 350, 400, 450]);
      const cost = pick(r, [100, 120, 150, 175, 200]);
      const n = int(r, 8, 40);
      const fixed = (price - cost) * n;
      return {
        prompt: `Cupcakes sell for ${money(price)} and each costs ${money(cost)} to make. The booth fee is ${money(fixed)}. How many cupcakes must sell to break even?`,
        answer: String(n), wrong: [String(Math.round(fixed / price)), String(n + 5), String(Math.round(fixed / cost)), String(n - 2)],
        explanation: `Profit per cupcake: ${money(price)} − ${money(cost)} = ${money(price - cost)}. Solve ${(price - cost) / 100}x = ${fixed / 100}: x = ${n}.`,
        params: { price, cost, fixed, kind: "even" },
      };
    },
  },
];

export const MATH_TOPICS: Exclude<TopicId, "physical">[] = ["numbers", "fractions", "ratios", "money"];

export function mathGensFor(grade: Grade, topic?: Exclude<TopicId, "physical">): MathGen[] {
  const n = gradeN(grade);
  return MATH_GENS.filter((g) => g.grades.includes(n) && (!topic || g.topic === topic));
}

let mathCounter = 0;

/** One generated question from a generator (null if the draw can't make 4 different choices). */
export function fromGen(gen: MathGen, grade: Grade, r: Rng): CafeQ | null {
  const n = gradeN(grade);
  const d = gen.make(n, r);
  if (!d) return null;
  return build(
    { id: `m-kc-${gen.key}-${++mathCounter}`, subject: "math", grade, standard: gen.std(n), skill: gen.skill, topic: gen.topic, gen: gen.key, moment: gen.moment },
    d,
  );
}

/**
 * A math question for a grade, from one topic or any topic the grade has. Prefers a generator
 * that fits the moment (the oven asks timers, checkout asks money) when there is one.
 */
export function mathCheck(grade: Grade, r: Rng, topics: Exclude<TopicId, "physical">[] | null, moment?: Moment): CafeQ | null {
  let gens = mathGensFor(grade).filter((g) => !topics || topics.includes(g.topic));
  if (gens.length === 0) return null;
  if (moment) {
    const fit = gens.filter((g) => g.moment === moment);
    if (fit.length && r() < 0.75) gens = fit;
  }
  for (let i = 0; i < 60; i++) {
    const q = fromGen(pick(r, gens), grade, r);
    if (q) return q;
  }
  return null;
}
