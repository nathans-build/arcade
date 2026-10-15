/* Kindergarten - Grade 2 generators (NC.K.*, NC.1.*, NC.2.*). Wording is kept short for read-aloud. */
import { chance, distinctInts, type Gen, n, nums, pick, randInt, shuffle } from "./core";

const THINGS = [
  { e: "🍎", name: "apples" },
  { e: "⭐", name: "stars" },
  { e: "🐶", name: "dogs" },
  { e: "🎈", name: "balloons" },
  { e: "🐟", name: "fish" },
  { e: "🌸", name: "flowers" },
  { e: "🚗", name: "cars" },
  { e: "🍪", name: "cookies" },
] as const;

const NAMES = ["Mia", "Leo", "Ava", "Sam", "Zoe", "Max", "Ivy", "Ben", "Kai", "Ana", "Eli", "Nia"];
const STORY = ["ducks", "frogs", "bees", "cats", "birds", "bugs", "fish", "kids"];

function countUp(k: number): string {
  if (k <= 5) return Array.from({ length: k }, (_, i) => i + 1).join(", ");
  return `1, 2, 3, … ${k}`;
}

function pad2(v: number): string {
  return String(v).padStart(2, "0");
}
function nextHour(h: number): number {
  return (h % 12) + 1;
}

/** "Which is true?" with a comparison statement and three false ones. */
function compareChoices(a: number, b: number, show: (v: number) => string = n) {
  const sym = a > b ? ">" : a < b ? "<" : "=";
  const others = [">", "<", "="].filter((s) => s !== sym);
  const flip = sym === ">" ? "<" : sym === "<" ? ">" : ">";
  return {
    answer: `${show(a)} ${sym} ${show(b)}`,
    wrong: [
      ...others.map((s) => `${show(a)} ${s} ${show(b)}`),
      a === b ? `${show(a + 1)} ${flip === ">" ? "<" : ">"} ${show(a)}` : `${show(b)} ${sym} ${show(a)}`,
    ],
    sym,
  };
}

// ======================================================================== K

export const GRADE_K: Gen[] = [
  {
    key: "cc5",
    standard: "NC.K.CC.5",
    skill: "Count objects",
    make() {
      const k = randInt(2, 10);
      const t = pick(THINGS);
      return {
        prompt: `How many ${t.name}? ${t.e.repeat(k)}`,
        ...nums(k, [k + 1, k - 1, k + 2], { min: 1 }),
        explanation: `Touch each one as you count: ${countUp(k)}. There are ${k} ${t.name}.`,
      };
    },
  },
  {
    key: "cc2",
    standard: "NC.K.CC.2",
    skill: "Count on",
    make() {
      if (chance()) {
        const s = randInt(1, 19);
        return {
          prompt: `What number comes right after ${s}?`,
          ...nums(s + 1, [s - 1, s + 2, s, s + 10], { min: 0 }),
          explanation: `Count on from ${s}: ${s}, ${s + 1}. The next number is ${s + 1}.`,
        };
      }
      const s = randInt(1, 16);
      return {
        prompt: `Count on: ${s}, ${s + 1}, ${s + 2}, __`,
        ...nums(s + 3, [s + 2, s + 4, s + 5, s + 1], { min: 0 }),
        explanation: `Each number is 1 more. After ${s + 2} comes ${s + 3}.`,
      };
    },
  },
  {
    key: "cc7",
    standard: "NC.K.CC.7",
    skill: "Compare numbers",
    make() {
      const vals = distinctInts(4, 0, 10);
      const big = chance();
      const ans = big ? Math.max(...vals) : Math.min(...vals);
      return {
        prompt: big ? "Which number is the biggest?" : "Which number is the smallest?",
        answer: String(ans),
        wrong: vals.filter((v) => v !== ans).map(String),
        explanation: big
          ? `Count up from 0. You say ${ans} last, so ${ans} is the biggest.`
          : `Count up from 0. You say ${ans} first, so ${ans} is the smallest.`,
      };
    },
  },
  {
    key: "cc6",
    standard: "NC.K.CC.6",
    skill: "Compare groups",
    make() {
      const t = pick(THINGS);
      const counts = distinctInts(4, 1, 7);
      const most = chance(0.65);
      const ans = most ? Math.max(...counts) : Math.min(...counts);
      return {
        prompt: most ? `Which group has the most ${t.name}?` : `Which group has the fewest ${t.name}?`,
        answer: t.e.repeat(ans),
        wrong: counts.filter((c) => c !== ans).map((c) => t.e.repeat(c)),
        explanation: most
          ? `Count each group. The group with ${ans} has the most.`
          : `Count each group. The group with ${ans} has the fewest.`,
      };
    },
  },
  {
    key: "oa5",
    standard: "NC.K.OA.5",
    skill: "Add and subtract within 5",
    make() {
      if (chance()) {
        const a = randInt(0, 5);
        const b = randInt(0, 5 - a);
        return {
          prompt: `What is ${a} + ${b}?`,
          ...nums(a + b, [a + b + 1, a + b - 1, Math.abs(a - b), a + b + 2], { min: 0 }),
          explanation: `Start at ${a} and count on ${b} more. ${a} + ${b} = ${a + b}.`,
        };
      }
      const a = randInt(1, 5);
      const b = randInt(0, a);
      return {
        prompt: `What is ${a} − ${b}?`,
        ...nums(a - b, [a + b, a - b + 1, a - b - 1, a], { min: 0 }),
        explanation: `Start with ${a} and take away ${b}. ${a} − ${b} = ${a - b}.`,
      };
    },
  },
  {
    key: "oa2",
    standard: "NC.K.OA.2",
    skill: "Story problems within 10",
    make() {
      const thing = pick(STORY);
      if (chance()) {
        const a = randInt(1, 8);
        const b = randInt(1, 10 - a);
        return {
          prompt: `${a} ${thing} play. ${b} more come. How many ${thing} now?`,
          ...nums(a + b, [a + b + 1, Math.abs(a - b), a + b - 1, a], { min: 0 }),
          explanation: `More came, so we add. ${a} + ${b} = ${a + b}.`,
        };
      }
      const a = randInt(3, 10);
      const b = randInt(1, a - 1);
      return {
        prompt: `${a} ${thing} play. ${b} go home. How many are left?`,
        ...nums(a - b, [a + b, a - b + 1, a - b - 1, b], { min: 0 }),
        explanation: `Some went away, so we take away. ${a} − ${b} = ${a - b}.`,
      };
    },
  },
  {
    key: "oa4",
    standard: "NC.K.OA.4",
    skill: "Make 10",
    make() {
      const k = randInt(1, 9);
      return {
        prompt: `What number goes with ${k} to make 10?`,
        ...nums(10 - k, [10 - k + 1, 10 - k - 1, k, 10 + k], { min: 0 }),
        explanation: `Count up from ${k} to 10. You count ${10 - k} more, so ${k} + ${10 - k} = 10.`,
      };
    },
  },
  {
    key: "oa3",
    standard: "NC.K.OA.3",
    skill: "Break apart numbers",
    make() {
      const total = randInt(3, 10);
      const a = randInt(1, total - 1);
      return {
        prompt: `${total} is ${a} and what number?`,
        ...nums(total - a, [total + a, total - a + 1, total - a - 1, a], { min: 0 }),
        explanation: `Take ${a} away from ${total}. ${total - a} is left, so ${total} is ${a} and ${total - a}.`,
      };
    },
  },
  {
    key: "nbt1",
    standard: "NC.K.NBT.1",
    skill: "Teen numbers",
    make() {
      const k = randInt(1, 9);
      return {
        prompt: `10 and ${k} make what number?`,
        answer: String(10 + k),
        wrong: [`${k}1`, `10${k}`, String(10 + k + 1), String(10 + k - 1)],
        explanation: `1 ten and ${k} ${k === 1 ? "one" : "ones"} is ${10 + k}.`,
      };
    },
  },
  {
    key: "g4",
    standard: "NC.K.G.4",
    skill: "Shapes: sides and corners",
    make() {
      const shapes = [
        { name: "triangle", sides: 3 },
        { name: "square", sides: 4 },
        { name: "rectangle", sides: 4 },
        { name: "hexagon", sides: 6 },
      ];
      if (chance()) {
        const s = pick(shapes);
        const corners = chance(0.3);
        return {
          prompt: `How many ${corners ? "corners" : "sides"} does a ${s.name} have?`,
          ...nums(s.sides, [3, 4, 6, 5, 0, s.sides + 1], { min: 0 }),
          explanation: `A ${s.name} has ${s.sides} straight sides and ${s.sides} corners.`,
        };
      }
      const which = pick([
        { q: "Which shape has 3 sides?", a: "Triangle", why: "A triangle has 3 sides and 3 corners." },
        { q: "Which shape has 6 sides?", a: "Hexagon", why: "A hexagon has 6 sides and 6 corners." },
        { q: "Which shape is round with no corners?", a: "Circle", why: "A circle is round. It has no sides and no corners." },
        { q: "Which shape has 4 sides that are all the same?", a: "Square", why: "A square has 4 sides, all the same length." },
      ]);
      return {
        prompt: which.q,
        answer: which.a,
        wrong: shuffle(["Triangle", "Square", "Circle", "Hexagon", "Rectangle"].filter((s) => s !== which.a && !(which.a === "Square" && s === "Rectangle"))),
        explanation: which.why,
      };
    },
  },
];

// ======================================================================== Grade 1

export const GRADE_1: Gen[] = [
  {
    key: "oa6a",
    standard: "NC.1.OA.6",
    skill: "Add within 20",
    make() {
      const a = randInt(2, 10);
      const b = randInt(2, Math.min(10, 20 - a));
      const s = a + b;
      return {
        prompt: `What is ${a} + ${b}?`,
        ...nums(s, [s + 1, s - 1, s + 10, Math.abs(a - b)], { min: 0 }),
        explanation:
          s > 10 && a >= b && a < 10
            ? `Make a ten: ${a} + ${10 - a} = 10, then add ${b - (10 - a)} more to get ${s}.`
            : `Start at ${Math.max(a, b)} and count on ${Math.min(a, b)}. ${a} + ${b} = ${s}.`,
      };
    },
  },
  {
    key: "oa6s",
    standard: "NC.1.OA.6",
    skill: "Subtract within 20",
    make() {
      const a = randInt(6, 20);
      const b = randInt(1, Math.min(10, a));
      const d = a - b;
      return {
        prompt: `What is ${a} − ${b}?`,
        ...nums(d, [a + b, d + 1, d - 1, d + 10], { min: 0 }),
        explanation: `Think addition: ${b} + ? = ${a}. Since ${b} + ${d} = ${a}, ${a} − ${b} = ${d}.`,
      };
    },
  },
  {
    key: "oa1",
    standard: "NC.1.OA.1",
    skill: "Word problems within 20",
    make() {
      const who = pick(NAMES);
      const thing = pick(["stickers", "shells", "marbles", "books", "crayons", "blocks"]);
      const kind = randInt(0, 2);
      if (kind === 0) {
        const a = randInt(3, 12);
        const b = randInt(2, 20 - a);
        return {
          prompt: `${who} has ${a} ${thing}. ${who} gets ${b} more. How many now?`,
          ...nums(a + b, [Math.abs(a - b), a + b + 1, a + b - 1, a + b + 10], { min: 0 }),
          explanation: `Gets more means add. ${a} + ${b} = ${a + b}.`,
        };
      }
      if (kind === 1) {
        const a = randInt(8, 20);
        const b = randInt(2, a - 1);
        return {
          prompt: `${who} has ${a} ${thing}. ${who} gives away ${b}. How many are left?`,
          ...nums(a - b, [a + b, a - b + 1, a - b - 1, b], { min: 0 }),
          explanation: `Gives away means take away. ${a} − ${b} = ${a - b}.`,
        };
      }
      const a = randInt(8, 20);
      const b = randInt(2, a - 2);
      const other = pick(NAMES.filter((x) => x !== who));
      return {
        prompt: `${who} has ${a} ${thing}. ${other} has ${b}. How many more does ${who} have?`,
        ...nums(a - b, [a + b, a, a - b + 1, a - b - 1], { min: 0 }),
        explanation: `Find the difference. ${a} − ${b} = ${a - b}, so ${who} has ${a - b} more.`,
      };
    },
  },
  {
    key: "oa8",
    standard: "NC.1.OA.8",
    skill: "Missing number",
    make() {
      const a = randInt(2, 10);
      const x = randInt(2, 10);
      const s = a + x;
      if (chance()) {
        return {
          prompt: `${a} + ? = ${s}`,
          ...nums(x, [s + a, x + 1, x - 1, s], { min: 0 }),
          explanation: `Count up from ${a} to ${s}. That is ${x} more, so ${a} + ${x} = ${s}.`,
        };
      }
      return {
        prompt: `${s} − ? = ${a}`,
        ...nums(x, [s + a, x + 1, x - 1, a], { min: 0 }),
        explanation: `${a} + ${x} = ${s}, so ${s} − ${x} = ${a}.`,
      };
    },
  },
  {
    key: "nbt1",
    standard: "NC.1.NBT.1",
    skill: "Count to 120",
    make() {
      const s = chance(0.5) ? randInt(9, 11) * 10 + 9 - randInt(0, 1) * 10 : randInt(20, 118);
      const ans = s + 1;
      const wrong = [s + 10, s - 1, s + 2];
      const w: string[] = [];
      if (s % 10 === 9) w.push(`${Math.floor(s / 10)}10`);
      if (ans > 100 && ans < 110) w.push(`100${ans - 100}`);
      return {
        prompt: `What number comes right after ${s}?`,
        answer: String(ans),
        wrong: [...w, ...wrong.map(String)],
        pad: () => String(ans + pick([-2, 3, 11, -10])),
        explanation: `Count on by 1: ${s}, ${ans}.${s % 10 === 9 ? ` 9 ones plus 1 makes a new ten.` : ""}`,
      };
    },
  },
  {
    key: "nbt2",
    standard: "NC.1.NBT.2",
    skill: "Tens and ones",
    make() {
      const t = randInt(1, 9);
      let o = randInt(0, 9);
      if (o === t) o = (o + 3) % 10;
      if (chance()) {
        return {
          prompt: `What number has ${t} ${t === 1 ? "ten" : "tens"} and ${o} ${o === 1 ? "one" : "ones"}?`,
          answer: String(10 * t + o),
          wrong: [String(10 * o + t), String(t + o), `${t}0${o}`, String(10 * t + o + 10)],
          explanation: `${t} ${t === 1 ? "ten is" : "tens is"} ${10 * t}. ${10 * t} + ${o} = ${10 * t + o}.`,
        };
      }
      const v = 10 * t + o;
      return {
        prompt: `How many tens are in ${v}?`,
        ...nums(t, [o, v, t + 1, 10], { min: 0 }),
        explanation: `The first digit of ${v} shows the tens. ${v} is ${t} ${t === 1 ? "ten" : "tens"} and ${o} ${o === 1 ? "one" : "ones"}.`,
      };
    },
  },
  {
    key: "nbt3",
    standard: "NC.1.NBT.3",
    skill: "Compare two-digit numbers",
    make() {
      const t1 = randInt(1, 9);
      const t2 = randInt(1, 9);
      const a = 10 * t1 + randInt(0, 9);
      const b = chance(0.15) ? a : 10 * t2 + ((a % 10) + randInt(1, 9)) % 10;
      const c = compareChoices(a, b);
      return {
        prompt: "Which is true?",
        answer: c.answer,
        wrong: c.wrong,
        explanation:
          a === b
            ? `Both numbers are ${a}, so they are equal.`
            : Math.floor(a / 10) !== Math.floor(b / 10)
              ? `Compare the tens first: ${Math.floor(a / 10)} tens and ${Math.floor(b / 10)} tens. So ${c.answer}.`
              : `The tens are the same, so compare the ones. So ${c.answer}.`,
      };
    },
  },
  {
    key: "nbt5",
    standard: "NC.1.NBT.5",
    skill: "10 more or 10 less",
    make() {
      const v = randInt(11, 89);
      const more = chance();
      const ans = more ? v + 10 : v - 10;
      return {
        prompt: `What is 10 ${more ? "more" : "less"} than ${v}?`,
        ...nums(ans, [more ? v + 1 : v - 1, more ? v - 10 : v + 10, more ? v + 100 : v - 100, ans + 1], { min: 0 }),
        explanation: `10 ${more ? "more" : "less"} changes only the tens digit: ${v} → ${ans}.`,
      };
    },
  },
  {
    key: "nbt4",
    standard: "NC.1.NBT.4",
    skill: "Add within 100",
    make() {
      if (chance()) {
        const a = randInt(12, 88);
        const b = randInt(2, 9);
        const s = a + b;
        const noCarry = Math.floor(a / 10) * 10 + ((a + b) % 10);
        return {
          prompt: `What is ${a} + ${b}?`,
          ...nums(s, [noCarry, a + 10 * b, s + 1, s - 1], { min: 0 }),
          explanation: `Add the ones: ${a % 10} + ${b} = ${(a % 10) + b}. Then ${Math.floor(a / 10) * 10} + ${(a % 10) + b} = ${s}.`,
        };
      }
      const a = randInt(11, 69);
      const b = randInt(1, Math.floor((99 - a) / 10)) * 10;
      return {
        prompt: `What is ${a} + ${b}?`,
        ...nums(a + b, [a + b / 10, a + b + 1, a + b - 10, a + b + 10], { min: 0 }),
        explanation: `${b} is ${b / 10} ${b === 10 ? "ten" : "tens"}. Add ${b === 10 ? "it" : "them"} to the tens of ${a}: ${a} + ${b} = ${a + b}.`,
      };
    },
  },
  {
    key: "nbt6",
    standard: "NC.1.NBT.6",
    skill: "Subtract tens",
    make() {
      const a = randInt(3, 9) * 10;
      const b = randInt(1, a / 10 - 1) * 10;
      return {
        prompt: `What is ${a} − ${b}?`,
        ...nums(a - b, [a + b, a - b + 10, a - b - 10, a / 10 - b / 10], { min: 0 }),
        explanation: `${a / 10} tens − ${b / 10} tens = ${(a - b) / 10} tens, which is ${a - b}.`,
      };
    },
  },
  {
    key: "md3",
    standard: "NC.1.MD.3",
    skill: "Tell time to the hour and half hour",
    make() {
      const h = randInt(1, 12);
      if (chance()) {
        return {
          prompt: `The short hand is on ${h}. The long hand is on 12. What time is it?`,
          answer: `${h}:00`,
          wrong: [`12:${pad2(h)}`, `${h}:12`, `${nextHour(h)}:00`, `${h}:30`],
          explanation: `The long hand on 12 means o'clock. The short hand shows the hour: ${h}:00.`,
        };
      }
      return {
        prompt: `The short hand is between ${h} and ${nextHour(h)}. The long hand is on 6. What time is it?`,
        answer: `${h}:30`,
        wrong: [`${nextHour(h)}:30`, `${h}:06`, `6:${pad2(h)}`, `${h}:00`],
        explanation: `The long hand on 6 means half past. The short hand has just passed ${h}, so it is ${h}:30.`,
      };
    },
  },
];

// ======================================================================== Grade 2

export const GRADE_2: Gen[] = [
  {
    key: "oa2",
    standard: "NC.2.OA.2",
    skill: "Add and subtract within 20",
    make() {
      const a = randInt(4, 12);
      const b = randInt(3, 20 - a);
      if (chance()) {
        return {
          prompt: `What is ${a} + ${b}?`,
          ...nums(a + b, [a + b + 1, a + b - 1, a + b + 10, Math.abs(a - b)], { min: 0 }),
          explanation: `Make a ten or use a double you know. ${a} + ${b} = ${a + b}.`,
        };
      }
      const s = a + b;
      return {
        prompt: `What is ${s} − ${b}?`,
        ...nums(a, [s + b, a + 1, a - 1, a + 10], { min: 0 }),
        explanation: `Think addition: ${b} + ${a} = ${s}, so ${s} − ${b} = ${a}.`,
      };
    },
  },
  {
    key: "nbt5",
    standard: "NC.2.NBT.5",
    skill: "Add and subtract within 100",
    make() {
      if (chance()) {
        const a = randInt(15, 79);
        const b = randInt(12, 99 - a);
        const s = a + b;
        const noCarry = (Math.floor(a / 10) + Math.floor(b / 10)) * 10 + ((a + b) % 10);
        return {
          prompt: `What is ${a} + ${b}?`,
          ...nums(s, [noCarry, s + 10, s + 1, s - 1], { min: 0 }),
          explanation: `Tens: ${Math.floor(a / 10) * 10} + ${Math.floor(b / 10) * 10} = ${(Math.floor(a / 10) + Math.floor(b / 10)) * 10}. Ones: ${a % 10} + ${b % 10} = ${(a % 10) + (b % 10)}. Together that is ${s}.`,
        };
      }
      const a = randInt(31, 99);
      const b = randInt(12, a - 10);
      const d = a - b;
      const smallFromBig = Math.abs(Math.floor(a / 10) - Math.floor(b / 10)) * 10 + Math.abs((a % 10) - (b % 10));
      return {
        prompt: `What is ${a} − ${b}?`,
        ...nums(d, [smallFromBig, d + 10, d - 10, d + 1], { min: 0 }),
        explanation: `Check with addition: ${b} + ${d} = ${a}. So ${a} − ${b} = ${d}.`,
      };
    },
  },
  {
    key: "nbt7",
    standard: "NC.2.NBT.7",
    skill: "Add and subtract within 1000",
    make() {
      if (chance()) {
        const a = randInt(105, 700);
        const b = randInt(105, 999 - a);
        const s = a + b;
        const noCarry = [100, 10, 1].reduce((acc, p) => acc + ((Math.floor(a / p) % 10 + Math.floor(b / p) % 10) % 10) * p, 0);
        return {
          prompt: `What is ${a} + ${b}?`,
          ...nums(s, [noCarry, s + 100, s - 10, s + 10], { min: 0 }),
          explanation: `Add hundreds, tens, and ones, and regroup 10 of a place into the next place. ${a} + ${b} = ${s}.`,
        };
      }
      const a = randInt(300, 999);
      const b = randInt(101, a - 50);
      const d = a - b;
      const smallFromBig = [100, 10, 1].reduce((acc, p) => acc + Math.abs((Math.floor(a / p) % 10) - (Math.floor(b / p) % 10)) * p, 0);
      return {
        prompt: `What is ${a} − ${b}?`,
        ...nums(d, [smallFromBig, d + 100, d - 10, d + 10], { min: 0 }),
        explanation: `Subtract place by place, trading a ten or hundred when you need to. Check: ${b} + ${d} = ${a}.`,
      };
    },
  },
  {
    key: "nbt1",
    standard: "NC.2.NBT.1",
    skill: "Place value",
    make() {
      const digits = distinctInts(3, 1, 9);
      const v = digits[0] * 100 + digits[1] * 10 + digits[2];
      const place = randInt(0, 2);
      const d = digits[place];
      const value = d * [100, 10, 1][place];
      const others = [d * 100, d * 10, d, d * 1000].filter((x) => x !== value);
      return {
        prompt: `What is the value of the ${d} in ${v}?`,
        answer: String(value),
        wrong: others.map(String),
        explanation: `The ${d} is in the ${["hundreds", "tens", "ones"][place]} place, so it is worth ${value}.`,
      };
    },
  },
  {
    key: "nbt3",
    standard: "NC.2.NBT.3",
    skill: "Expanded form",
    make() {
      const h = randInt(1, 9);
      const t = randInt(0, 9);
      const o = randInt(1, 9);
      const v = 100 * h + 10 * t + o;
      const parts = [`${h * 100}`, t ? `${t * 10}` : "", `${o}`].filter(Boolean).join(" + ");
      return {
        prompt: `What number is ${parts}?`,
        answer: String(v),
        wrong: [`${h}${t * 10}${o}`, t ? `${h}${o}${t}` : `${h}${o}0`, `${h + t + o}`, `${h}0${t}${o}`, String(v + 10)],
        explanation: `${h} hundreds, ${t} tens, and ${o} ones make ${v}.`,
      };
    },
  },
  {
    key: "nbt8",
    standard: "NC.2.NBT.8",
    skill: "Add or subtract 10 and 100",
    make() {
      const v = randInt(110, 889);
      const step = pick([10, 100]);
      const more = chance();
      const ans = more ? v + step : v - step;
      const other = step === 10 ? 100 : 10;
      return {
        prompt: `What is ${step} ${more ? "more" : "less"} than ${v}?`,
        ...nums(ans, [more ? v + other : v - other, more ? v + 1 : v - 1, more ? v - step : v + step], { min: 0 }),
        explanation: `${step} ${more ? "more" : "less"} changes the ${step === 10 ? "tens" : "hundreds"} digit by 1: ${v} → ${ans}.`,
      };
    },
  },
  {
    key: "nbt2",
    standard: "NC.2.NBT.2",
    skill: "Skip count",
    make() {
      const by = pick([2, 5, 10, 100]);
      const start = by * randInt(1, by === 100 ? 6 : 15);
      const seq = [start, start + by, start + 2 * by];
      const ans = start + 3 * by;
      return {
        prompt: `Skip count by ${by}s: ${seq.join(", ")}, __`,
        ...nums(ans, [seq[2] + 1, ans + by, seq[2] + (by === 10 ? 1 : 10), seq[2] + (by === 100 ? 10 : 100)], { min: 0, fmt: String }),
        explanation: `Add ${by} each time. ${seq[2]} + ${by} = ${ans}.`,
      };
    },
  },
  {
    key: "oa3",
    standard: "NC.2.OA.3",
    skill: "Even and odd",
    make() {
      const even = chance();
      const pool = Array.from({ length: 20 }, (_, i) => i + 1);
      const right = pick(pool.filter((v) => (v % 2 === 0) === even));
      const wrong = shuffle(pool.filter((v) => (v % 2 === 0) !== even)).slice(0, 3);
      return {
        prompt: even ? "Which number is even?" : "Which number is odd?",
        answer: String(right),
        wrong: wrong.map(String),
        explanation: even
          ? `${right} can be split into two equal groups of ${right / 2}. Even numbers end in 0, 2, 4, 6, or 8.`
          : `${right} can't be split into two equal groups; 1 is left over. Odd numbers end in 1, 3, 5, 7, or 9.`,
      };
    },
  },
  {
    key: "oa4",
    standard: "NC.2.OA.4",
    skill: "Arrays",
    make() {
      const r = randInt(2, 5);
      const c = randInt(2, 5);
      const t = pick(THINGS);
      return {
        prompt: `There are ${r} rows of ${t.name}. Each row has ${c}. How many ${t.name} in all?`,
        ...nums(r * c, [r + c, r * c + 1, r * c - 1, r * c + c], { min: 0 }),
        explanation: `Add the rows: ${Array(r).fill(c).join(" + ")} = ${r * c}.`,
      };
    },
  },
  {
    key: "nbt4",
    standard: "NC.2.NBT.4",
    skill: "Compare three-digit numbers",
    make() {
      const a = randInt(100, 999);
      let b = chance(0.5) ? Math.floor(a / 100) * 100 + randInt(0, 99) : randInt(100, 999);
      if (chance(0.1)) b = a;
      const c = compareChoices(a, b, String);
      return {
        prompt: "Which is true?",
        answer: c.answer,
        wrong: c.wrong,
        explanation: a === b ? `The numbers are the same, so they are equal.` : `Compare hundreds first, then tens, then ones. So ${c.answer}.`,
      };
    },
  },
  {
    key: "md7",
    standard: "NC.2.MD.7",
    skill: "Tell time to 5 minutes",
    make() {
      const h = randInt(1, 12);
      const k = randInt(1, 11);
      const m = 5 * k;
      return {
        prompt: `The short hand is just past ${h}. The long hand points to ${k}. What time is it?`,
        answer: `${h}:${pad2(m)}`,
        wrong: [`${h}:${pad2(k)}`, `${nextHour(h)}:${pad2(m)}`, `${k}:${pad2((h * 5) % 60)}`, `${h}:${pad2((m + 5) % 60)}`],
        explanation: `Count by 5s to the long hand: ${k} × 5 = ${m} minutes. The hour is ${h}, so it is ${h}:${pad2(m)}.`,
      };
    },
  },
  {
    key: "md8",
    standard: "NC.2.MD.8",
    skill: "Count money",
    make() {
      let q = 0;
      let d = 0;
      let k = 0;
      let p = 0;
      let kinds = 0;
      while (kinds < 2 || 25 * q + 10 * d + 5 * k + p >= 100) {
        q = randInt(0, 3);
        d = randInt(0, 4);
        k = randInt(0, 2);
        p = randInt(0, 4);
        kinds = [q, d, k, p].filter((x) => x > 0).length;
      }
      const total = 25 * q + 10 * d + 5 * k + p;
      const parts: string[] = [];
      const plural = (c: number, s: string, pl: string) => `${c} ${c === 1 ? s : pl}`;
      if (q) parts.push(plural(q, "quarter", "quarters"));
      if (d) parts.push(plural(d, "dime", "dimes"));
      if (k) parts.push(plural(k, "nickel", "nickels"));
      if (p) parts.push(plural(p, "penny", "pennies"));
      const list = parts.length === 2 ? parts.join(" and ") : `${parts.slice(0, -1).join(", ")}, and ${parts[parts.length - 1]}`;
      const cents = (v: number) => `${v}¢`;
      return {
        prompt: `You have ${list}. How many cents is that?`,
        ...nums(total, [q + d + k + p, total - 5 * q, total + 5, total - 5 * d, total + 10], { min: 1, fmt: cents }),
        explanation: `Quarters are 25¢, dimes 10¢, nickels 5¢, pennies 1¢. Count on from the biggest coins: ${total}¢.`,
      };
    },
  },
];
