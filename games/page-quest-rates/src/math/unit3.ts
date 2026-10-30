/*
 * Math 6 · Unit 3 question generators (docs/math6-unit3.md). Pure TypeScript, no DOM.
 * Every answer is computed here, at play time, with fresh numbers. Distractors come from real
 * mistakes (the step-one answer, the flipped division, the misplaced decimal, the unrounded or
 * chopped value), and each one carries feedback that names the mistake.
 *
 * Story files ask for a generator by id: `? MATH sale-price item=jacket : lead-in`.
 */
import {
  chance, clock, frac, int, money, num, pct, pick, plural, rateText, roundCents, terminates, type Rng,
} from "./format";
import { TAG_CODE, type Choice, type MathQ, type Model, type Params, type SkillTag } from "./types";

export class Retry extends Error {}

interface Opt {
  text: string;
  why: string;
}

type Base = Omit<MathQ, "choices" | "answer" | "code">;

/** Capitalizes the first letter of each sentence ("the shopper bought..." → "The shopper bought..."). */
export const sentences = (s: string) => s.replace(/(^|[.?!)]\s+)([a-z])/g, (_, a: string, b: string) => a + b.toUpperCase());

const key = (s: string) => s.toLowerCase().replace(/\s+/g, " ").trim();

/** Builds the 4 choices: the correct one first, then the first 3 distinct mistakes. */
export function finish(base: Base, correct: string, wrong: (Opt | null | false)[], extra: (Opt | null | false)[] = []): MathQ {
  const choices: Choice[] = [{ text: correct, correct: true, why: "" }];
  const seen = new Set([key(correct)]);
  for (const o of [...wrong, ...extra]) {
    if (choices.length === 4) break;
    if (!o || !o.text || seen.has(key(o.text))) continue;
    seen.add(key(o.text));
    choices.push({ text: o.text, correct: false, why: o.why });
  }
  if (choices.length < 4) throw new Retry("not enough distinct choices");
  // Hints never jump straight to the answer: redraw if a worked step happens to show it.
  if ((correct.match(/\d/g) ?? []).length >= 3 && !/^100%?$/.test(correct)) {
    const esc = correct.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(`(^|[^\\d.,/])${esc}(?!\\d)`);
    if (base.hints.some((h) => re.test(h))) throw new Retry("a hint shows the answer");
  }
  return { ...base, prompt: sentences(base.prompt), code: TAG_CODE[base.tag], choices, answer: correct };
}

/** A numeric mistake, or null when the value is not a sensible positive number. */
function opt(v: number, fmt: (x: number) => string, why: string): Opt | null {
  if (!Number.isFinite(v) || v <= 0) return null;
  return { text: fmt(v), why };
}

/** Last-resort mistakes for numeric answers (decimal point slips, doubling). */
function nudges(v: number, fmt: (x: number) => string, isMoney = false): (Opt | null)[] {
  const r = (x: number) => (isMoney ? Math.round(x) : x);
  return [
    opt(r(v * 10), fmt, "Check the decimal point: that's 10 times too big."),
    opt(r(v / 10), fmt, "Check the decimal point: that's 10 times too small."),
    opt(r(v * 2), fmt, "That's double. Check which numbers you multiplied."),
    opt(r(v / 2), fmt, "That's only half. Check your rate again."),
    opt(r(v * 100), fmt, "Check the decimal point: that's 100 times too big."),
  ];
}

const name = (p: Params, k: string, dflt: string) => (p[k] ?? dflt).replace(/_/g, " ");
const NAMES = ["Mira", "Theo", "Kenji", "Lucia", "Omar", "Priya", "Dev", "Zoe", "Ari", "Bea", "Jonah", "Rosa", "Felix", "Tamsin", "Wren", "Sol"];
function twoNames(rng: Rng, p: Params): [string, string] {
  const a = name(p, "a", pick(rng, NAMES));
  let b = name(p, "b", pick(rng, NAMES));
  while (b === a) b = pick(rng, NAMES);
  return [a, b];
}
const nm = (x: number) => num(x);
const unitFmt = (u: string) => (x: number) => `${num(x)} ${u}`;

// =====================================================================================
// A · Estimating with rates
// =====================================================================================

const ESTIMATE_THEMES = {
  windows: { thing: "windows", doing: "A washing crew cleans", small: "minutes", big: "hours", bigOne: "hour", bigNeed: "wash all", ranges: [10, 90, 100] },
  steps: { thing: "steps", doing: "The climbers go up", small: "seconds", big: "minutes", bigOne: "minute", bigNeed: "climb all", ranges: [20, 120, 10] },
  floors: { thing: "floors", doing: "The elevator passes", small: "seconds", big: "minutes", bigOne: "minute", bigNeed: "pass all", ranges: [20, 50, 1] },
  lights: { thing: "lights", doing: "The robot checks", small: "minutes", big: "hours", bigOne: "hour", bigNeed: "check all", ranges: [10, 60, 10] },
  bricks: { thing: "bricks", doing: "The builder bot stacks", small: "minutes", big: "hours", bigOne: "hour", bigNeed: "stack all", ranges: [10, 90, 10] },
} as const;

function estimateRate(rng: Rng, p: Params): MathQ {
  const th = ESTIMATE_THEMES[(p.theme as keyof typeof ESTIMATE_THEMES) in ESTIMATE_THEMES ? (p.theme as keyof typeof ESTIMATE_THEMES) : "windows"];
  const a = th.thing === "floors" ? pick(rng, [2, 3, 4]) : pick(rng, [2, 3, 4, 5, 6, 8]);
  let b = pick(rng, [2, 3, 4, 5, 6, 10, 12, 15, 20]);
  while (b === a) b = pick(rng, [3, 5, 10, 12, 15, 20]);
  const two = chance(rng, 0.5);
  let g: number;
  if (two) {
    // groups × b must be a whole number of big units (60 small units each)
    const per = 60 / gcd60(b);
    g = per * int(rng, 2, Math.max(2, Math.floor((th.ranges[1] * th.ranges[2]) / per)));
  } else g = int(rng, th.ranges[0], th.ranges[1]) * th.ranges[2];
  const N = a * g;
  const small = g * b;
  const value = two ? small / 60 : small;
  const unit = two ? th.big : th.small;
  const fmt = unitFmt(unit);
  const prompt = `${th.doing} ${a} ${th.thing} every ${b} ${th.small}. At that rate, how many ${unit} to ${th.bigNeed} ${num(N)} ${th.thing}?`;
  const wrong: (Opt | null)[] = [
    two ? opt(small, fmt, `That's the number of ${th.small}. The question asks for ${th.big}: divide by 60.`) : null,
    opt(g, fmt, `That's how many groups of ${a} ${th.thing} there are. Each group takes ${b} ${th.small}.`),
    opt(two ? (N * b) / 60 : N * b, fmt, `You gave every one of the ${th.thing} ${b} ${th.small}. It's each group of ${a} that takes ${b} ${th.small}.`),
    two ? opt(small / 100, fmt, `There are 60 ${th.small} in 1 ${th.bigOne}, not 100.`) : opt((N / b) * a, fmt, "That's dividing the wrong way. First find how many groups, then multiply by the time for one group."),
  ];
  return finish(
    {
      gen: "estimate-rate", tag: "Estimating with rates", prompt, steps: two ? 2 : 1, unit, value,
      hints: [
        `How many groups of ${a} ${th.thing} fit in ${num(N)}?`,
        `${num(N)} ÷ ${a} = ${num(g)} groups. Each group takes ${b} ${th.small}, so multiply${two ? `, then change ${th.small} to ${th.big} (÷ 60)` : ""}.`,
      ],
      model: { kind: "table", headers: [th.thing, th.small], rows: [[nm(a), nm(b)], [nm(N), "?"]] },
      facts: { a, b, N, two: two ? 1 : 0, theme: th.thing },
    },
    fmt(value),
    wrong,
    nudges(value, fmt),
  );
}
const gcd60 = (b: number) => {
  let x = 60;
  let y = b;
  while (y) [x, y] = [y, x % y];
  return x;
};

// =====================================================================================
// B · Units
// =====================================================================================

const UNIT_FIT = [
  { obj: "the length of a pencil", unit: "centimeters", wrong: [["kilometers", "A kilometer is about 10 football fields long. Way too big for a pencil!"], ["meters", "A meter is about as wide as a door. A pencil is much shorter."], ["liters", "Liters measure how much a bottle holds (volume), not length."]] },
  { obj: "the height of a door", unit: "meters", wrong: [["kilometers", "A kilometer is about 10 football fields. Far too big for a door."], ["millimeters", "A millimeter is about as thick as a coin's edge. You'd need about 2,000 of them!"], ["kilograms", "Kilograms measure weight, not height."]] },
  { obj: "the distance across a desert city", unit: "kilometers", wrong: [["centimeters", "Centimeters are tiny, about a fingernail wide. You'd need millions."], ["inches", "An inch is about a thumb's width. Way too small for a whole city."], ["gallons", "Gallons measure liquid, not distance."]] },
  { obj: "the weight of a backpack", unit: "pounds", wrong: [["tons", "A ton is about as heavy as a small car. Too big!"], ["feet", "Feet measure length, not weight."], ["fluid ounces", "Fluid ounces measure liquid volume, not weight."]] },
  { obj: "how much water a bathtub holds", unit: "gallons", wrong: [["teaspoons", "A teaspoon is tiny. You'd need thousands to fill a tub."], ["miles", "Miles measure distance, not how much a tub holds."], ["grams", "Grams measure weight, and a tub of water would be a huge number of them."]] },
  { obj: "the weight of a paper clip", unit: "grams", wrong: [["kilograms", "A kilogram is about a liter of water. A paper clip is much lighter."], ["pounds", "A pound is about a loaf of bread. Too heavy for one clip."], ["liters", "Liters measure volume, not weight."]] },
  { obj: "the width of a phone screen", unit: "inches", wrong: [["yards", "A yard is about as long as a baseball bat. Too big for a phone."], ["miles", "A mile is far, about a 20-minute walk."], ["quarts", "Quarts measure liquid, not width."]] },
  { obj: "the paint needed for a whole room", unit: "gallons", wrong: [["cups", "A cup is small. A room would need dozens and dozens of cups."], ["inches", "Inches measure length, not how much paint."], ["kilometers", "Kilometers measure long distances, not paint."]] },
  { obj: "the length of a giant tower", unit: "meters", wrong: [["millimeters", "Millimeters are tiny. The number would be in the hundreds of thousands!"], ["ounces", "Ounces measure weight, not height."], ["gallons", "Gallons measure liquid, not height."]] },
] as const;

const BIGGER_SMALLER = [
  { big: "yards", small: "feet", f: 3, wf: 12, thing: "rope" },
  { big: "feet", small: "inches", f: 12, wf: 10, thing: "banner" },
  { big: "meters", small: "centimeters", f: 100, wf: 10, thing: "hallway" },
  { big: "gallons", small: "quarts", f: 4, wf: 2, thing: "paint" },
  { big: "kilograms", small: "grams", f: 1000, wf: 100, thing: "bag of sand" },
  { big: "pounds", small: "ounces", f: 16, wf: 12, thing: "crate" },
] as const;

function pickUnit(rng: Rng, p: Params): MathQ {
  if (chance(rng, 0.5)) {
    const it = pick(rng, UNIT_FIT);
    return finish(
      {
        gen: "pick-unit", tag: "Choosing sensible units", steps: 1, unit: "key", value: it.unit,
        prompt: `Which unit makes the most sense for measuring ${it.obj}?`,
        hints: ["Picture the object. Is it tiny, hand-sized, room-sized or city-sized? And are you measuring length, weight or volume?", "Match the size: inch ≈ thumb width, meter ≈ door width, kilometer ≈ 10 football fields, gallon = a big milk jug, kilogram ≈ a liter of water."],
        facts: { obj: it.obj, variant: "fit" },
      },
      it.unit,
      it.wrong.map(([text, why]) => ({ text, why })),
    );
  }
  const c = pick(rng, BIGGER_SMALLER);
  const n = int(rng, 2, 9);
  const [a, b] = twoNames(rng, p);
  const thing = c.f === 1000 ? "bag of sand" : c.thing;
  const value = n * c.f;
  return finish(
    {
      gen: "pick-unit", tag: "Choosing sensible units", steps: 1, unit: "key", value: `more ${value}`,
      prompt: `${a} measures the ${thing} and gets ${n} ${c.big}. ${b} measures the same ${thing} in ${c.small}. What does ${b} get?`,
      hints: [`Which unit is smaller: ${c.big} or ${c.small}? Do you need more of a small unit or fewer?`, `1 ${c.big.replace(/s$/, "").replace(/feet$/, "foot")} = ${c.f} ${c.small}. A smaller unit means a bigger number, so multiply ${n} × ${c.f}.`],
      facts: { n, f: c.f, variant: "count" },
    },
    `More: ${num(value)} ${c.small}`,
    [
      { text: `Fewer: ${num(n / c.f, 3)} ${c.small}`, why: `${c.small[0].toUpperCase() + c.small.slice(1)} are smaller, so you need MORE of them, not fewer.` },
      { text: `The same: ${n} ${c.small}`, why: "The length didn't change, but the unit did. A smaller unit means a bigger number." },
      { text: `More: ${num(n * c.wf)} ${c.small}`, why: `Check the conversion fact: there are ${c.f} ${c.small} in each one, not ${c.wf}.` },
    ],
    [{ text: `More: ${num(n + c.f)} ${c.small}`, why: `Converting means multiplying by ${c.f}, not adding ${c.f}.` }],
  );
}

interface Conv {
  big: [string, string];
  small: [string, string];
  /** small units per big unit, ×100 (so 2.54 → 254) */
  f100: number;
  wf100: number;
  approx?: boolean;
  /** two-step: via a middle unit */
  via?: { unit: string; f: number };
  thing: string;
  verb: "long" | "weighs" | "holds";
}

const CONVS: Record<"length" | "weight" | "volume", Conv[]> = {
  length: [
    { big: ["foot", "feet"], small: ["inch", "inches"], f100: 1200, wf100: 1000, thing: "banner", verb: "long" },
    { big: ["yard", "yards"], small: ["foot", "feet"], f100: 300, wf100: 1200, thing: "rope", verb: "long" },
    { big: ["mile", "miles"], small: ["foot", "feet"], f100: 528000, wf100: 100000, thing: "trail", verb: "long" },
    { big: ["meter", "meters"], small: ["centimeter", "centimeters"], f100: 10000, wf100: 1000, thing: "hallway", verb: "long" },
    { big: ["kilometer", "kilometers"], small: ["meter", "meters"], f100: 100000, wf100: 10000, thing: "race course", verb: "long" },
    { big: ["inch", "inches"], small: ["centimeter", "centimeters"], f100: 254, wf100: 1000, approx: true, thing: "ribbon", verb: "long" },
    { big: ["yard", "yards"], small: ["inch", "inches"], f100: 3600, wf100: 1200, via: { unit: "feet", f: 3 }, thing: "cable", verb: "long" },
  ],
  weight: [
    { big: ["pound", "pounds"], small: ["ounce", "ounces"], f100: 1600, wf100: 1000, thing: "crate", verb: "weighs" },
    { big: ["kilogram", "kilograms"], small: ["pound", "pounds"], f100: 220, wf100: 1000, approx: true, thing: "suitcase", verb: "weighs" },
    { big: ["kilogram", "kilograms"], small: ["gram", "grams"], f100: 100000, wf100: 10000, thing: "bag of rice", verb: "weighs" },
  ],
  volume: [
    { big: ["gallon", "gallons"], small: ["quart", "quarts"], f100: 400, wf100: 200, thing: "water jug", verb: "holds" },
    { big: ["quart", "quarts"], small: ["pint", "pints"], f100: 200, wf100: 400, thing: "pitcher", verb: "holds" },
    { big: ["pint", "pints"], small: ["cup", "cups"], f100: 200, wf100: 800, thing: "bottle", verb: "holds" },
    { big: ["cup", "cups"], small: ["fluid ounce", "fluid ounces"], f100: 800, wf100: 1600, thing: "mug", verb: "holds" },
    { big: ["liter", "liters"], small: ["quart", "quarts"], f100: 106, wf100: 1000, approx: true, thing: "cooler", verb: "holds" },
    { big: ["gallon", "gallons"], small: ["pint", "pints"], f100: 800, wf100: 400, via: { unit: "quarts", f: 4 }, thing: "tank", verb: "holds" },
  ],
};

const fact = (c: Conv) => `1 ${c.big[0]} ${c.approx ? "≈" : "="} ${num(c.f100 / 100)} ${c.small[1]}`;
function amount(c: Conv, x: number, which: "big" | "small") {
  const u = which === "big" ? c.big : c.small;
  return `${num(x)} ${x === 1 ? u[0] : u[1]}`;
}

function convert(kind: "length" | "weight" | "volume") {
  return (rng: Rng, p: Params): MathQ => {
    const list = CONVS[kind];
    const forced = p.pair ? list.filter((c) => `${c.big[1]}-${c.small[1]}` === p.pair) : [];
    const c = forced[0] ?? pick(rng, list);
    const dir: "up" | "down" = p.dir === "up" || p.dir === "down" ? p.dir : chance(rng, 0.5) ? "down" : "up";
    const f = c.f100 / 100;
    // the amount in the big unit: whole, or a half / quarter when the conversion stays clean
    let B: number;
    if (c.approx) B = int(rng, 2, 40);
    else {
      const parts = [1, 2, 4].filter((d) => (c.f100 / d) % 100 === 0);
      const d = pick(rng, parts);
      const maxB = c.f100 >= 100000 ? 6 : c.f100 >= 10000 ? 12 : 20;
      B = int(rng, d, maxB * d) / d;
      if (B === 1) B = 2;
    }
    const S = Math.round(B * c.f100) / 100;
    const thing = name(p, "thing", c.thing);
    const verbText = c.verb === "long" ? "is" : c.verb;
    const tail = c.verb === "long" ? " long" : "";
    const given = dir === "down" ? amount(c, B, "big") : amount(c, S, "small");
    const target = dir === "down" ? c.small[1] : c.big[1];
    const value = dir === "down" ? S : B;
    const fmt = (x: number) => `${num(x)} ${target}`;
    const showFact = c.approx || c.f100 === 528000;
    const prompt = `The ${thing} ${verbText} ${given}${tail}. How many ${target} is that?${showFact ? ` (${fact(c)})` : ""}`;
    const two = !!c.via;
    const wf = c.wf100 / 100;
    const wrong: (Opt | null)[] = [
      dir === "down"
        ? opt(B / f, fmt, `You divided, but ${c.small[1]} are smaller than ${c.big[1]}, so you need MORE of them. Multiply.`)
        : opt(S * f, fmt, `You multiplied, but ${c.big[1]} are bigger than ${c.small[1]}, so you need FEWER of them. Divide.`),
      two
        ? opt(dir === "down" ? B * c.via!.f : S / (f / c.via!.f), fmt, `That's only step one (${c.via!.unit}). Keep going to ${target}.`)
        : null,
      dir === "down" ? opt(B * wf, fmt, `Check the fact: ${fact(c)}, not ${num(wf)}.`) : opt(S / wf, fmt, `Check the fact: ${fact(c)}, not ${num(wf)}.`),
      opt(value * 10, fmt, "Check the decimal point: that's 10 times too big."),
      opt(value / 10, fmt, "Check the decimal point: that's 10 times too small."),
    ];
    const model: Model = {
      kind: "dnl",
      rows: [
        { label: c.big[1], ticks: ["0", "1", dir === "down" ? nm(B) : "?"] },
        { label: c.small[1], ticks: ["0", nm(f), dir === "down" ? "?" : nm(S)] },
      ],
    };
    return finish(
      {
        gen: `convert-${kind}`, tag: "Converting units", prompt, steps: two ? 2 : 1, unit: target, value, dir, model,
        hints: [
          `Is a ${dir === "down" ? c.small[0] : c.big[0]} bigger or smaller than a ${dir === "down" ? c.big[0] : c.small[0]}? Smaller unit → bigger number.`,
          two
            ? `${dir === "down" ? `${num(B)} ${c.big[1]} × ${c.via!.f} = ${num(B * c.via!.f)} ${c.via!.unit}. Now change ${c.via!.unit} to ${target}.` : `${num(S)} ${c.small[1]} ÷ ${num(f / c.via!.f)} = ${num(S / (f / c.via!.f))} ${c.via!.unit}. Now change ${c.via!.unit} to ${target}.`}`
            : `${fact(c)}, so ${dir === "down" ? `multiply: ${num(B)} × ${num(f)}` : `divide: ${num(S)} ÷ ${num(f)}`}.`,
        ],
        facts: { B, f100: c.f100, dir, big: c.big[1], small: c.small[1] },
      },
      fmt(value),
      wrong,
      nudges(value, fmt),
    );
  };
}

// =====================================================================================
// C · Rates
// =====================================================================================

const SIZES = [8, 10, 12, 16, 18, 20, 24, 32, 36, 48];

function dealCompare(rng: Rng, p: Params): MathQ {
  const item = name(p, "item", "shampoo");
  const u = name(p, "unit", "oz");
  const [qA, qB] = pickTwo(rng, SIZES).sort((x, y) => x - y);
  const tie = chance(rng, 0.15);
  const uA = int(rng, 8, 45);
  let uB = uA;
  if (!tie) while (uB === uA) uB = int(rng, Math.max(5, uA - 8), uA + 8);
  const pA = qA * uA;
  const pB = qB * uB;
  const best = tie ? "tie" : uA < uB ? "A" : "B";
  const [qBest, uBest, pBest, qOther, uOther] = best === "B" ? [qB, uB, pB, qA, uA] : [qA, uA, pA, qB, uB];
  const lbl = (q: number) => `${q}-${u} ${item}`;
  const prompt = `The ${lbl(qA)} costs ${money(pA)}. The ${lbl(qB)} costs ${money(pB)}. Which is the better buy, and what does 1 ${u} cost?`;
  const hints: [string, string] = [`What does 1 ${u} cost in each one? Divide price by ${u}.`, `${money(pA)} ÷ ${qA} = ${money(uA)} per ${u}. Now do the ${qB}-${u} one and compare.`];
  const base = {
    gen: "deal-compare", tag: "Comparing speeds and prices" as SkillTag, prompt, steps: 1, unit: "key", value: best, hints,
    model: { kind: "table", headers: [u, "price"], rows: [[nm(qA), money(pA)], [nm(qB), money(pB)], ["1", "?"]] } as Model,
    facts: { qA, qB, pA, pB },
  };
  if (tie) {
    return finish(base, `Same deal: ${money(uA)} per ${u} each`, [
      { text: `The ${lbl(qA)}: lower price tag`, why: `A lower price tag isn't a better deal when you get less. Both are ${money(uA)} per ${u}.` },
      { text: `The ${lbl(qB)}: bigger is cheaper`, why: `Not this time! Divide each price by its ${u}: they match.` },
      { text: `The ${lbl(qB)} at ${money(pB)} per ${u}`, why: `${money(pB)} is the price of the whole ${item}, not 1 ${u}.` },
      { text: `The ${lbl(qA)} at ${money(pA)} per ${u}`, why: `${money(pA)} is the price of the whole ${item}, not 1 ${u}.` },
    ]);
  }
  return finish(base, `The ${lbl(qBest)}: ${money(uBest)} per ${u}`, [
    { text: `The ${lbl(qOther)}: ${money(uOther)} per ${u}`, why: `Compare the price of 1 ${u}: ${money(uOther)} is more than ${money(uBest)}.` },
    { text: `The ${lbl(qBest)}: ${money(pBest)} per ${u}`, why: `${money(pBest)} is the price of the whole ${item}. Divide by ${qBest} to get 1 ${u}.` },
    { text: `Same deal: ${money(uBest)} per ${u} each`, why: `Find both unit prices: ${money(uA)} and ${money(uB)} are not the same.` },
    { text: `The ${lbl(qOther)}: ${money(qOther === qA ? pA : pB)} per ${u}`, why: "That's the whole price, not the price of 1 unit." },
  ]);
}

function pickTwo<T>(rng: Rng, list: readonly T[]): [T, T] {
  const a = pick(rng, list);
  let b = pick(rng, list);
  while (b === a) b = pick(rng, list);
  return [a, b];
}

const SPEEDS = [6, 8, 10, 12, 12.5, 15, 16, 20, 24, 25, 30];

function speedCompare(rng: Rng, p: Params): MathQ {
  const [A, B] = twoNames(rng, p);
  const how = name(p, "how", "rode");
  const tie = chance(rng, 0.15);
  const sA = pick(rng, SPEEDS);
  let sB = sA;
  if (!tie) while (sB === sA) sB = pick(rng, SPEEDS);
  let tA = int(rng, 2, 5);
  let tB = int(rng, 2, 5);
  while (tB === tA) tB = int(rng, 2, 5);
  const dA = sA * tA;
  const dB = sB * tB;
  if (!terminates(dA, 1) || !terminates(dB, 1)) throw new Retry();
  const fast = sA > sB ? A : B;
  const slow = fast === A ? B : A;
  const diff = Math.abs(sA - sB);
  const prompt = `${A} ${how} ${num(dA)} miles in ${tA} hours. ${B} ${how} ${num(dB)} miles in ${tB} hours. Who was faster, and by how many miles per hour?`;
  const hints: [string, string] = ["Find each speed: how many miles in 1 hour?", `${num(dA)} ÷ ${tA} = ${num(sA)} mph for ${A}. Now divide ${num(dB)} ÷ ${tB} for ${B}.`];
  const base = {
    gen: "speed-compare", tag: "Comparing speeds and prices" as SkillTag, prompt, steps: 1, unit: "key", value: tie ? "tie" : `${fast} ${diff}`, hints,
    model: { kind: "table", headers: ["miles", "hours"], rows: [[`${num(dA)} (${A})`, String(tA)], [`${num(dB)} (${B})`, String(tB)], ["?", "1"]] } as Model,
    facts: { sA, sB, tA, tB, A, B },
  };
  const dd = Math.abs(dA - dB);
  const farther = dA > dB ? A : B;
  if (tie)
    return finish(base, `Tied: both ${num(sA)} mph`, [
      dd ? { text: `${farther}, by ${num(dd)} mph`, why: `That's the difference in total miles, not miles per hour. Divide: both go ${num(sA)} mph.` } : null,
      { text: `${tA > tB ? A : B}, by ${Math.abs(tA - tB)} mph`, why: "That's the difference in hours. Find miles per hour for each." },
      { text: `${A}, by ${num(sA)} mph`, why: `${num(sA)} mph is ${A}'s whole speed, and ${B} goes the same speed.` },
      { text: `${B}, by ${num(sA / 2)} mph`, why: "Divide miles by hours for each rider: the speeds come out equal." },
    ]);
  return finish(base, `${fast}, by ${num(diff)} mph`, [
    { text: `${slow}, by ${num(diff)} mph`, why: `Find miles per hour: ${slow} goes ${num(Math.min(sA, sB))} mph, which is slower.` },
    dd && dd !== diff ? { text: `${farther}, by ${num(dd)} mph`, why: "That's the difference in total miles, not miles per hour." } : null,
    { text: `Tied: both ${num(Math.max(sA, sB))} mph`, why: `Their speeds are different: ${num(sA)} mph and ${num(sB)} mph.` },
    { text: `${fast}, by ${num(Math.max(sA, sB))} mph`, why: `${num(Math.max(sA, sB))} mph is ${fast}'s whole speed. How much MORE than ${slow}?` },
    { text: `${fast}, by ${num(diff * 2)} mph`, why: `Subtract the two speeds again: ${num(sA)} and ${num(sB)}.` },
  ]);
}

const RATE_CENTS = [50, 75, 125, 150, 200, 250, 300, 400];

function twoRates(rng: Rng, p: Params): MathQ {
  const item = name(p, "item", "apples");
  const u = name(p, "unit", "lb");
  const a = pick(rng, [2, 3, 4, 5, 6, 8]);
  const uc = pick(rng, RATE_CENTS);
  const P = a * uc;
  const per = chance(rng, 0.5) ? "unit" : "dollar";
  const prompt = `${a} ${u} of ${item} cost ${money(P)}. ${per === "unit" ? `What is the price for 1 ${u}?` : `How many ${u} of ${item} do you get for 1 dollar?`}`;
  const hints: [string, string] = [
    "Every ratio has two unit rates: dollars per pound AND pounds per dollar. Which one is the question asking for?",
    per === "unit" ? `Price for 1 ${u}: dollars ÷ ${u} = ${money(P)} ÷ ${a}.` : `${u} for 1 dollar: ${u} ÷ dollars = ${a} ÷ ${num(P / 100)}.`,
  ];
  const base = {
    gen: "two-rates", tag: "Two unit rates from one ratio" as SkillTag, prompt, steps: 1, hints, facts: { a, P, per },
    model: { kind: "table", headers: [u, "dollars"], rows: per === "unit" ? [[String(a), num(P / 100)], ["1", "?"]] : [[String(a), num(P / 100)], ["?", "1"]] } as Model,
  };
  if (per === "unit") {
    const fmt = (c: number) => `${money(c)} per ${u}`;
    return finish({ ...base, unit: "cents", value: uc }, fmt(uc), [
      opt(Math.round(10000 / uc), fmt, `That's ${u} per dollar (${a} ÷ ${num(P / 100)}). You flipped it: dollars ÷ ${u} gives the price of 1 ${u}.`),
      opt(P, fmt, `That's the price of all ${a} ${u}, not 1 ${u}.`),
      opt(P * a, fmt, `You multiplied. Divide the price by the ${u}.`),
    ], nudges(uc, fmt, true));
  }
  const fmt = (n: number, d: number) => `${frac(n, d)} ${u} per dollar`;
  return finish({ ...base, unit: u, value: 100 / uc }, fmt(100, uc), [
    { text: fmt(uc, 100), why: `That's dollars per ${u}, flipped. ${u} ÷ dollars gives the ${u} you get for 1 dollar.` },
    { text: fmt(a, 1), why: `That's how many ${u} you get for all ${money(P)}, not for 1 dollar.` },
    { text: fmt(P, 100), why: "That's the total price in dollars, not an amount of food." },
    { text: fmt(200, uc), why: "That's double. Divide the amount by the dollars." },
    { text: fmt(a * 100 + 1, 100), why: "Divide the amount by the dollars." },
  ]);
}

const BASES: [number, number][] = [[3, 2], [2, 1], [5, 2], [4, 3], [3, 4], [5, 4], [1, 2], [6, 5], [3, 1], [2, 5]];

function sameRate(rng: Rng, p: Params): MathQ {
  const x1 = name(p, "a", "flour");
  const y1 = name(p, "b", "sugar");
  const u = name(p, "unit", "cups");
  const thing = name(p, "thing", "recipe");
  const [x, y] = pick(rng, BASES);
  const k1 = int(rng, 1, 3);
  const A: [number, number] = [x * k1, y * k1];
  const mode = rng() < 0.45 ? "same" : rng() < 0.75 ? "add" : "other";
  let B: [number, number];
  let n = 0;
  if (mode === "same") {
    const k2 = int(rng, k1 + 1, k1 + 4);
    B = [x * k2, y * k2];
  } else if (mode === "add") {
    n = int(rng, 1, 4);
    B = [A[0] + n, A[1] + n];
  } else {
    const k2 = int(rng, k1 + 1, k1 + 3);
    B = [x * k2 + 1, y * k2];
  }
  const rA = rateText(A[0], A[1]);
  const rB = rateText(B[0], B[1]);
  const same = A[0] * B[1] === A[1] * B[0];
  const per = `${u} of ${x1} per ${u.replace(/s$/, "")} of ${y1}`;
  const prompt = `${thing[0].toUpperCase() + thing.slice(1)} 1 uses ${A[0]} ${u} of ${x1} to ${A[1]} ${u} of ${y1}. ${thing[0].toUpperCase() + thing.slice(1)} 2 uses ${B[0]} to ${B[1]}. Is it the same rate?`;
  const hints: [string, string] = [`Find the unit rate for each: ${x1} for 1 ${u.replace(/s$/, "")} of ${y1}.`, `${A[0]} ÷ ${A[1]} = ${rA} for the first one. Now find ${B[0]} ÷ ${B[1]}.`];
  const base = {
    gen: "same-rate", tag: "Same rate? (equivalent ratios)" as SkillTag, prompt, steps: 1, unit: "key", value: same ? "yes" : "no", hints,
    model: { kind: "table", headers: [x1, y1], rows: [[String(A[0]), String(A[1])], [String(B[0]), String(B[1])]] } as Model,
    facts: { a0: A[0], a1: A[1], b0: B[0], b1: B[1] },
  };
  if (same)
    return finish(base, `Yes: both are ${rA} ${per}`, [
      { text: `No: ${thing} 2 has more ${x1}`, why: `It also has more ${y1}. Compare ${x1} per 1 ${u.replace(/s$/, "")} of ${y1}: both are ${rA}.` },
      { text: `No: the amounts didn't go up by the same number`, why: "Equivalent ratios grow by MULTIPLYING both numbers, not by adding the same amount." },
      rateText(A[1], A[0]) !== rA ? { text: `Yes: both are ${rateText(A[1], A[0])} ${per}`, why: `Right idea, but that's ${y1} per ${x1}, flipped. Divide ${x1} by ${y1}.` } : null,
      { text: `No: ${thing} 2 makes a bigger batch`, why: "A bigger batch can still be the same rate. Check the unit rates." },
    ]);
  return finish(base, `No: ${rA} vs. ${rB} ${per}`, [
    { text: `Yes: both are ${rA} ${per}`, why: `Check the second one: ${B[0]} ÷ ${B[1]} = ${rB}, not ${rA}.` },
    mode === "add"
      ? { text: `Yes: it just adds ${n} ${u} of each`, why: "Adding the same amount to both changes the rate. To keep it the same, multiply both." }
      : { text: `Yes: both use ${x1} and ${y1}`, why: `Same ingredients isn't the same rate. Compare ${x1} per cup of ${y1}.` },
    { text: `No: ${thing} 2 makes a bigger batch`, why: `A bigger batch could still be the same rate. The real difference: ${rA} vs. ${rB}.` },
    { text: `Yes: both are ${rB} ${per}`, why: `Check the first one: ${A[0]} ÷ ${A[1]} = ${rA}, not ${rB}.` },
  ]);
}

/** mph → minutes per mile (all clean). */
const PACE: [number, number][] = [[4, 15], [5, 12], [6, 10], [7.5, 8], [8, 7.5], [10, 6], [12, 5], [15, 4]];

function paceVsSpeed(rng: Rng, p: Params): MathQ {
  const [A, B] = twoNames(rng, p);
  const r = rng();
  const tag: SkillTag = "Speed vs. pace";
  if (r < 0.55) {
    const [s, paceB] = pick(rng, PACE);
    const tie = chance(rng, 0.2);
    let pA = paceB;
    if (!tie) while (pA === paceB) pA = pick(rng, PACE)[1];
    const fast = tie ? "tie" : pA < paceB ? A : B;
    const prompt = `${A} runs at a pace of ${num(pA)} minutes per mile. ${B} runs ${num(s)} miles per hour. Who is faster?`;
    const whyA = pA > paceB
      ? `A bigger pace number means MORE minutes per mile: that's slower! ${B}'s pace is 60 ÷ ${num(s)} = ${num(paceB)} minutes per mile.`
      : `Turn ${B}'s speed into a pace: 60 ÷ ${num(s)} = ${num(paceB)} minutes per mile. That's fewer minutes than ${A}.`;
    const whyB = pA < paceB
      ? `${num(s)} looks bigger than ${num(pA)}, but they're different units! 60 ÷ ${num(s)} = ${num(paceB)} minutes per mile, slower than ${A}.`
      : `Turn ${B}'s speed into a pace: 60 ÷ ${num(s)} = ${num(paceB)} minutes per mile. They take the same time.`;
    return finish(
      {
        gen: "pace-vs-speed", tag, prompt, steps: 1, unit: "key", value: fast,
        hints: [`Put them in the same units. How many minutes does ${B} take for 1 mile?`, `${B}: ${num(s)} miles in 60 minutes, so 1 mile takes 60 ÷ ${num(s)} = ${num(paceB)} minutes. Fewer minutes per mile = faster.`],
        model: { kind: "dnl", rows: [{ label: "miles", ticks: ["0", "1", num(s)] }, { label: "minutes", ticks: ["0", "?", "60"] }] },
        facts: { pA, s, variant: "who" },
      },
      tie ? "It's a tie" : `${fast} is faster`,
      [
        fast !== A ? { text: `${A} is faster`, why: whyA } : null,
        fast !== B ? { text: `${B} is faster`, why: whyB } : null,
        !tie ? { text: "It's a tie", why: `Change both to minutes per mile: ${num(pA)} vs. ${num(paceB)}. Not the same.` } : null,
        { text: "Can't compare mph and pace", why: `You can! Turn the speed into a pace: 60 ÷ ${num(s)}.` },
      ],
    );
  }
  const [s, pc] = pick(rng, PACE);
  if (r < 0.8) {
    const fmt = unitFmt("minutes per mile");
    return finish(
      {
        gen: "pace-vs-speed", tag, prompt: `${A} runs at ${num(s)} miles per hour. What is ${A}'s pace in minutes per mile?`, steps: 1, unit: "min/mi", value: pc,
        hints: ["Pace is time per mile. How many minutes are in the hour?", `${num(s)} miles take 60 minutes, so 1 mile takes 60 ÷ ${num(s)}.`],
        model: { kind: "dnl", rows: [{ label: "miles", ticks: ["0", "1", num(s)] }, { label: "minutes", ticks: ["0", "?", "60"] }] },
        facts: { s, variant: "toPace" },
      },
      fmt(pc),
      [
        opt(s, fmt, "Speed and pace aren't the same number. Pace = minutes ÷ miles."),
        opt(s / 60, fmt, `That's miles per minute (${num(s)} ÷ 60). Flip it: 60 ÷ ${num(s)}.`),
        opt(60 * s, fmt, `You multiplied. 1 mile takes 60 ÷ ${num(s)} minutes.`),
      ],
      nudges(pc, fmt),
    );
  }
  const fmt = unitFmt("miles per hour");
  return finish(
    {
      gen: "pace-vs-speed", tag, prompt: `${A} runs 1 mile every ${num(pc)} minutes. What is ${A}'s speed in miles per hour?`, steps: 1, unit: "mph", value: s,
      hints: ["How many miles in 60 minutes?", `Each mile takes ${num(pc)} minutes. How many groups of ${num(pc)} fit in 60? 60 ÷ ${num(pc)}.`],
      model: { kind: "dnl", rows: [{ label: "miles", ticks: ["0", "1", "?"] }, { label: "minutes", ticks: ["0", num(pc), "60"] }] },
      facts: { pc, variant: "toSpeed" },
    },
    fmt(s),
    [
      opt(pc, fmt, "That's the pace (minutes per mile), not the speed."),
      opt(pc / 60, fmt, `Flipped: it's 60 ÷ ${num(pc)}, not ${num(pc)} ÷ 60.`),
      opt(60 * pc, fmt, `You multiplied. Divide 60 minutes by ${num(pc)}.`),
    ],
    nudges(s, fmt),
  );
}

function unitPriceTotal(rng: Rng, p: Params): MathQ {
  const item = name(p, "item", "pencils");
  if (chance(rng, 0.7)) {
    const n = int(rng, 2, 8);
    const u = int(rng, 3, 80) * 5;
    const P = n * u;
    let m = int(rng, 2, 12);
    while (m === n) m = int(rng, 2, 12);
    const value = m * u;
    const fmt = money;
    return finish(
      {
        gen: "unit-price-total", tag: "Multi-step rate problems", steps: 2, unit: "cents", value,
        prompt: `${n} ${item} cost ${money(P)}. At the same price each, how much do ${m} ${item} cost?`,
        hints: ["Two steps. What does ONE cost?", `${money(P)} ÷ ${n} = ${money(u)} for one. Now find the cost of ${m}.`],
        model: { kind: "table", headers: [item, "price"], rows: [[String(n), money(P)], ["1", "?"], [String(m), "?"]] },
        facts: { n, P, m, variant: "total" },
      },
      fmt(value),
      [
        opt(u, fmt, `That's the price of ONE (step one). Now find the cost of ${m}.`),
        opt(P * m, fmt, `You multiplied the whole price by ${m}. Find the price of one first.`),
        opt(P + (m - n) * 100, fmt, `Adding $1.00 for each extra one doesn't use the real price. Find the price of one.`),
      ],
      nudges(value, fmt, true),
    );
  }
  const n = pick(rng, [3, 6, 7, 9]);
  let P = int(rng, 20, 300) * 10;
  if (P % n === 0) P += 10;
  const exact = P / n;
  const value = roundCents(exact);
  const chopped = Math.floor(exact);
  const tenth = Math.round(exact / 10) * 10;
  const fmt = money;
  return finish(
    {
      gen: "unit-price-total", tag: "Multi-step rate problems", steps: 1, unit: "cents", value, rounding: true,
      prompt: `A pack of ${n} ${item} costs ${money(P)}. What does 1 cost, rounded to the nearest cent?`,
      hints: [`Divide the price by ${n}. Then look at the third decimal place to round.`, `${money(P)} ÷ ${n} = ${num(exact / 100, 4)}... Money goes to 2 decimal places: round to the nearest cent.`],
      facts: { n, P, variant: "round" },
    },
    fmt(value),
    [
      chopped !== value ? opt(chopped, fmt, "You chopped off the extra digits. Round instead: look at the next digit.") : null,
      tenth !== value ? opt(tenth, fmt, "Money rounds to the nearest CENT (2 decimal places), not the nearest dime.") : null,
      opt(roundCents((n * 10000) / P), fmt, `That's how many ${item} per dollar, flipped. Price ÷ ${item} gives the price of one.`),
      opt(P, fmt, `That's the price of the whole pack of ${n}.`),
      opt(value + 1, fmt, "Round to the NEAREST cent. Check the next digit again."),
    ],
    nudges(value, fmt, true),
  );
}

const Q_AMOUNTS: [number, number][] = [[1, 1], [2, 1], [3, 1], [4, 1], [6, 1], [3, 4], [3, 2], [1, 2], [9, 2], [5, 1]];
const FACTORS: [number, number][] = [[1, 2], [1, 3], [1, 4], [2, 3], [3, 2], [5, 2], [3, 4]];

function batchScale(rng: Rng, p: Params): MathQ {
  const ing = name(p, "ing", "flour");
  const u = name(p, "unit", "cups");
  const what = name(p, "what", "muffins");
  const [qn, qd] = pick(rng, Q_AMOUNTS);
  const qText = frac(qn, qd);
  const amt = (n: number, d: number) => `${frac(n, d)} ${n / d <= 1 ? u.replace(/s$/, "") : u}`;
  if (chance(rng, 0.55)) {
    const [fn, fd] = pick(rng, FACTORS);
    const fText = fn < fd ? `${frac(fn, fd)} of a batch` : `${frac(fn, fd)} batches`;
    const vn = qn * fn;
    const vd = qd * fd;
    const wrong: (Opt | null)[] = [
      { text: amt(qn * fd, qd * fn), why: `You divided by ${frac(fn, fd)}. To scale a recipe, MULTIPLY by ${frac(fn, fd)}.` },
      { text: amt(qn * fd + fn * qd, qd * fd), why: `Adding ${frac(fn, fd)} doesn't scale a recipe. Multiply: ${qText} × ${frac(fn, fd)}.` },
      fn === 2 && fd === 3 ? { text: amt(qn, qd * 3), why: "That's only 1/3 of a batch. 2/3 is twice that much." } : null,
      fn === 3 && fd === 2 ? { text: amt(qn, qd * 2), why: "That's just the extra half batch. 1 1/2 batches = 1 batch + 1/2 batch." } : null,
      fn === 5 && fd === 2 ? { text: amt(qn * 2, qd), why: "That's 2 batches. You still need the extra half." } : null,
      fn < fd ? { text: amt(qn * (fd - fn), qd * fd), why: `That's what's LEFT, not ${frac(fn, fd)} of the batch.` } : null,
      { text: amt(vn * 2, vd), why: "That's double. Multiply the amount by the number of batches." },
      { text: amt(qn, qd), why: "That's the amount for ONE batch." },
    ];
    return finish(
      {
        gen: "batch-scale", tag: "Multi-step rate problems", steps: 1, unit: u, value: vn / vd,
        prompt: `One batch of ${what} uses ${qText} ${u} of ${ing}. How much ${ing} for ${fText}?`,
        hints: [`Scaling a recipe means multiplying. What is ${qText} × ${frac(fn, fd)}?`, fn < fd ? `Split ${qText} into ${fd} equal parts, then take ${fn} of them.` : `${frac(fn, fd)} batches = ${Math.floor(fn / fd)} batch${Math.floor(fn / fd) > 1 ? "es" : ""} + 1/2 batch. Find the half and add it on.`],
        model: { kind: "table", headers: ["batches", `${u} of ${ing}`], rows: [["1", qText], [frac(fn, fd), "?"]] },
        facts: { qn, qd, fn, fd, variant: "factor" },
      },
      amt(vn, vd),
      wrong,
    );
  }
  const s1 = pick(rng, [2, 3, 4, 6, 8, 12]);
  const [rn, rd] = pick(rng, [[1, 2], [3, 2], [2, 3], [4, 3], [5, 2], [3, 4], [5, 4]] as [number, number][]);
  if ((s1 * rn) % rd !== 0) throw new Retry();
  const s2 = (s1 * rn) / rd;
  const vn = qn * s2;
  const vd = qd * s1;
  return finish(
    {
      gen: "batch-scale", tag: "Multi-step rate problems", steps: 2, unit: u, value: vn / vd,
      prompt: `A recipe for ${s1} servings of ${what} uses ${qText} ${u} of ${ing}. How much ${ing} for ${s2} servings?`,
      hints: ["Two steps. How much for 1 serving?", `${qText} ÷ ${s1} = ${frac(qn, qd * s1)} for 1 serving. Now multiply by ${s2}.`],
      model: { kind: "table", headers: ["servings", `${u} of ${ing}`], rows: [[String(s1), qText], ["1", "?"], [String(s2), "?"]] },
      facts: { qn, qd, s1, s2, variant: "servings" },
    },
    amt(vn, vd),
    [
      { text: amt(qn, qd * s1), why: `That's for 1 serving (step one). Now multiply by ${s2} servings.` },
      { text: amt(qn * s2, qd), why: `You forgot to divide by ${s1} servings first.` },
      s2 > s1 ? { text: amt(qn + (s2 - s1) * qd, qd), why: `Adding ${s2 - s1} doesn't keep the recipe the same. Use the amount per serving.` } : { text: amt(qn * s1, qd * s2), why: `Flipped: multiply by ${s2}/${s1}, not ${s1}/${s2}.` },
      { text: amt(qn * s1 * s2, qd), why: "You multiplied by both. Divide by the old servings, multiply by the new." },
      { text: amt(vn * 2, vd), why: "That's double. Check your per-serving amount." },
    ],
  );
}

// =====================================================================================
// D · Percentages
// =====================================================================================

function percentRate(rng: Rng, p: Params): MathQ {
  const tag: SkillTag = "Percent as a rate per 100";
  if (chance(rng, 0.5)) {
    const thing = name(p, "thing", "ticket");
    const P = pick(rng, [50, 150, 200, 125, 250, 10, 25, 75, 300, 120]);
    const W = int(rng, 1, 15) * 400;
    const value = (W * P) / 100;
    const fmt = money;
    return finish(
      {
        gen: "percent-rate", tag, steps: 1, unit: "cents", value,
        prompt: `A ${thing} costs ${money(W)}. That's 100%. What is ${P}% of that price?`,
        hints: [`${P}% means ${P} for every 100. Is ${P}% more or less than the whole price?`, `100% = ${money(W)}, so 1% = ${money(W / 100)}. ${P}% is ${P} of those.`],
        model: { kind: "dnl", rows: [{ label: "percent", ticks: ["0%", "100%", `${P}%`] }, { label: "dollars", ticks: ["0", money(W), "?"] }] },
        facts: { W, P, variant: "price" },
      },
      fmt(value),
      [
        P !== 100 && P * 100 !== value ? opt(P * 100, fmt, `That's ${P} dollars. ${P}% means ${P} per 100: ${P}/100 of the price.`) : null,
        opt(W, fmt, "That's 100%, the whole price."),
        P > 100 ? opt((W * (P - 100)) / 100, fmt, `That's only the extra ${P - 100}%. ${P}% is the whole price PLUS that.`) : opt(W - value, fmt, `That's what's left (${100 - P}%), not ${P}%.`),
        opt(value * 10, fmt, "Check the decimal point: that's 10 times too big."),
      ],
      nudges(value, fmt, true),
    );
  }
  const P = pick(rng, [35, 12, 6, 20, 45, 60, 15, 80]);
  const N = pick(rng, [200, 300, 400, 500, 600, 1000]);
  const what = name(p, "what", "visitors");
  const adj = name(p, "adj", "wearing hats");
  const value = (P * N) / 100;
  const fmt = (x: number) => `${num(x)} ${what}`;
  return finish(
    {
      gen: "percent-rate", tag, steps: 1, unit: what, value,
      prompt: `${P}% of the ${what} are ${adj}. That's ${P} out of every 100. How many out of ${num(N)}?`,
      hints: [`How many hundreds are in ${num(N)}?`, `${num(N)} is ${N / 100} hundreds. Each hundred has ${P}.`],
      model: { kind: "dnl", rows: [{ label: what, ticks: ["0", String(P), "?"] }, { label: "out of", ticks: ["0", "100", num(N)] }] },
      facts: { P, N, variant: "per100" },
    },
    fmt(value),
    [
      opt(P, fmt, `That's for 100 ${what}. There are ${num(N)}.`),
      opt(P * N, fmt, "It's per 100, so divide by 100."),
      opt(N - value, fmt, `That's how many are NOT ${adj}.`),
      opt(P + N, fmt, "Adding doesn't work. Scale up by the number of hundreds."),
    ],
    nudges(value, fmt),
  );
}

function percentDnl(rng: Rng, p: Params): MathQ {
  const u = name(p, "unit", "meters");
  const thing = name(p, "thing", "track");
  const s = pick(rng, [25, 20, 10]);
  const n = 100 / s;
  const k = pick(rng, Array.from({ length: n + (s === 10 ? 5 : 2) }, (_, i) => i + 1).filter((i) => i > 1 && i * s !== 100));
  const P = k * s;
  const W = int(rng, 2, 30) * n * (s === 10 ? 1 : 2);
  const value = (W * P) / 100;
  const fmt = unitFmt(u);
  const maxK = Math.max(n, k);
  const top = Array.from({ length: maxK + 1 }, (_, i) => `${i * s}%`);
  const bottom = Array.from({ length: maxK + 1 }, (_, i) => (i === 0 ? "0" : i === n ? nm(W) : i === k ? "?" : ""));
  return finish(
    {
      gen: "percent-dnl", tag: "Percents on double number lines", steps: 1, unit: u, value,
      prompt: `The whole ${thing} is ${num(W)} ${u}. That's 100%. Use the double number line: what is ${P}%?`,
      hints: [`Each tick mark is ${s}%. What is ${s}% of ${num(W)}?`, `100% = ${num(W)}, so ${s}% = ${num(W)} ÷ ${n} = ${num(W / n)}. Count ${k} ticks.`],
      model: { kind: "dnl", rows: [{ label: "percent", ticks: top }, { label: u, ticks: bottom }] },
      facts: { W, P, variant: "dnl" },
    },
    fmt(value),
    [
      opt((W * (P + s)) / 100, fmt, `Count the tick marks again: that's ${P + s}%.`),
      opt((W * (P - s)) / 100, fmt, `Count the tick marks again: that's ${P - s}%.`),
      opt(P, fmt, `That's the percent, not the ${u}.`),
      P < 100 ? opt(W - value, fmt, `That's the rest (${100 - P}%), not ${P}%.`) : opt(W, fmt, `That's 100%. ${P}% is past it.`),
    ],
    nudges(value, fmt),
  );
}

function percentTape(rng: Rng, p: Params): MathQ {
  const u = name(p, "unit", "gallons");
  const thing = name(p, "thing", "tank");
  const n = pick(rng, [5, 4, 10]);
  const s = 100 / n;
  const k = int(rng, 1, n - 1);
  const P = k * s;
  const one = int(rng, 2, 25);
  const part = k * one;
  const W = n * one;
  if (k === 1 && n === 10) throw new Retry();
  const fmt = unitFmt(u);
  return finish(
    {
      gen: "percent-tape", tag: "Percents with tape diagrams", steps: 2, unit: u, value: W,
      prompt: `${P}% of the ${thing} is ${part} ${u}. How much is the whole ${thing}?`,
      hints: [`Split the tape into ${n} equal parts. Each part is ${s}%. How many parts make ${P}%?`, `${P}% is ${k} part${k > 1 ? "s" : ""}, so 1 part = ${part} ÷ ${k} = ${one} ${u}. The whole tape is ${n} parts.`],
      model: { kind: "tape", parts: n, shaded: k, shadedLabel: `${part} ${u} = ${P}%`, totalLabel: "? = 100%", partLabel: `${s}%` },
      facts: { P, part, variant: "whole" },
    },
    fmt(W),
    [
      k > 1 ? opt(one, fmt, `That's one part (${s}%). The whole tape is ${n} parts.`) : opt(part * 2, fmt, `That's only ${2 * s}%. The whole tape is ${n} parts.`),
      opt((part * P) / 100, fmt, `That's ${P}% of ${part}. But ${part} is already the part. Find 100%.`),
      opt(W - part, fmt, `That's the part that's left (${100 - P}%), not the whole.`),
      opt(part + (100 - P), fmt, `Adding the missing percent to the ${u} doesn't work. Use equal parts.`),
    ],
    nudges(W, fmt),
  );
}

function benchmarkPercent(rng: Rng, p: Params): MathQ {
  const u = name(p, "unit", "");
  const P = pick(rng, [10, 25, 50, 75, 1, 10, 25, 75]);
  const W = P === 1 ? int(rng, 2, 40) * 100 : P === 10 ? int(rng, 2, 90) * 10 : P === 50 ? int(rng, 2, 99) * 2 : int(rng, 2, 50) * 4;
  const value = (W * P) / 100;
  const fmt = (x: number) => (u ? `${num(x)} ${u}` : num(x));
  const parts: Record<number, string> = { 1: "1/100", 10: "1/10", 25: "1/4", 50: "1/2", 75: "3/4" };
  const wrong: (Opt | null)[] =
    P === 75 ? [opt(W / 4, fmt, "That's 25%. 75% is three of those."), opt((W * 3) / 10, fmt, "75% isn't 3/10. It's 3/4: divide by 4, then times 3."), opt(W - 75, fmt, "Percent isn't subtracting. 75% means 3/4.")]
    : P === 25 ? [opt(W / 2, fmt, "That's 50%. 25% is half of that."), opt(W / 25, fmt, "You divided by 25. 25% means 1/4: divide by 4."), opt((W * 3) / 4, fmt, "That's 75%.")]
    : P === 10 ? [opt(W / 100, fmt, "That's 1%. 10% is 1/10."), opt(W - W / 10, fmt, "That's what's left (90%)."), opt(W + 10, fmt, "Adding doesn't find a percent. 10% means 1/10.")]
    : P === 50 ? [opt(W / 4, fmt, "That's 25%. 50% is half."), opt(W * 2, fmt, "That's 200%. 50% is half."), opt(W - 50, fmt, "Percent isn't subtracting. 50% means half.")]
    : [opt(W / 10, fmt, "That's 10%. 1% is 1/100."), opt(W - 1, fmt, "Percent isn't subtracting. 1% means 1/100."), opt(W / 1000, fmt, "Check the decimal point: 1% is 1/100, not 1/1,000.")];
  return finish(
    {
      gen: "benchmark-percent", tag: "Benchmark percents", steps: 1, unit: u || "number", value,
      prompt: `Do it in your head: what is ${P}% of ${fmt(W)}?`,
      hints: [`${P}% is a benchmark: it's ${parts[P]}.`, P === 75 ? `25% of ${num(W)} is ${num(W / 4)}. 75% is 3 of those.` : `${parts[P]} of ${num(W)}: divide ${num(W)} by ${P === 1 ? 100 : P === 10 ? 10 : P === 25 ? 4 : 2}.`],
      facts: { P, W },
    },
    fmt(value),
    wrong,
    nudges(value, fmt),
  );
}

function percentOf(rng: Rng, p: Params): MathQ {
  const thing = name(p, "thing", "");
  if (chance(rng, 0.6)) {
    const P = pick(rng, [6, 12, 35, 15, 20, 30, 8, 25, 40, 5]);
    const round = chance(rng, 0.4);
    let W = round ? int(rng, 300, 9999) : int(rng, 2, 120) * 100;
    if (round && (W * P) % 100 === 0) W += 1;
    const value = roundCents((W * P) / 100);
    const chopped = Math.floor((W * P) / 100);
    const fmt = money;
    return finish(
      {
        gen: "percent-of", tag: "Percent of a number (find the part)", steps: 1, unit: "cents", value, rounding: round,
        prompt: `What is ${P}% of ${money(W)}${thing ? ` (the ${thing})` : ""}?${round ? " Round to the nearest cent." : ""}`,
        hints: [`${P}% means ${P}/100. Find 1% first?`, `1% of ${money(W)} is ${num(W / 10000, 4)} dollars. ${P}% is ${P} times that.`],
        model: { kind: "dnl", rows: [{ label: "percent", ticks: ["0%", `${P}%`, "100%"] }, { label: "dollars", ticks: ["0", "?", money(W)] }] },
        facts: { P, W, variant: "money" },
      },
      fmt(value),
      [
        round && chopped !== value ? opt(chopped, fmt, "You chopped off the extra digits. Round to the nearest cent instead.") : null,
        opt(roundCents((W * P) / 1000), fmt, "Check the decimal point: that's 10 times too small."),
        opt(roundCents((W * P) / 10), fmt, "Check the decimal point: that's 10 times too big."),
        opt(W - value, fmt, `That's what's left after taking away ${P}%. The question asks for ${P}%.`),
        opt(P * 100, fmt, `That's ${P} dollars, not ${P}%.`),
      ],
      nudges(value, fmt, true),
    );
  }
  const P = pick(rng, [30, 40, 60, 15, 35, 45, 5, 12, 6, 20, 80, 70]);
  const step = 100 / gcdN(P, 100);
  let W = step * int(rng, 1, Math.max(2, Math.floor(400 / step)));
  if (W === 100) W += step;
  const value = (W * P) / 100;
  const fmt = (x: number) => num(x);
  return finish(
    {
      gen: "percent-of", tag: "Percent of a number (find the part)", steps: 1, unit: "number", value,
      prompt: `What is ${P}% of ${num(W)}?`,
      hints: [`${P}% means ${P} out of every 100. Try 10% or 1% first.`, `${P}/100 × ${num(W)}: 1% of ${num(W)} is ${num(W / 100)}, so ${P}% is ${P} × ${num(W / 100)}.`],
      model: { kind: "dnl", rows: [{ label: "percent", ticks: ["0%", `${P}%`, "100%"] }, { label: "amount", ticks: ["0", "?", num(W)] }] },
      facts: { P, W, variant: "number" },
    },
    fmt(value),
    [
      opt(value / 10, fmt, "Check the decimal point: that's 10 times too small."),
      opt(value * 10, fmt, "Check the decimal point: that's 10 times too big."),
      opt(W - value, fmt, `That's what's left (${100 - P}%), not ${P}%.`),
      opt(P * W, fmt, "Percent means per 100: divide by 100."),
    ],
    nudges(value, fmt),
  );
}
const gcdN = (a: number, b: number): number => (b ? gcdN(b, a % b) : a);

function percentWhole(rng: Rng, p: Params): MathQ {
  const what = name(p, "what", "tickets");
  const done = name(p, "done", "sold");
  const P = pick(rng, p.over === "no" ? [25, 75, 50, 20, 40, 60, 10, 5, 80] : [25, 75, 50, 20, 40, 60, 10, 5, 150, 125, 80]);
  const step = 100 / gcdN(P, 100);
  const W = step * int(rng, 1, Math.max(2, Math.floor(300 / step)));
  const part = (W * P) / 100;
  if (part < 2) throw new Retry();
  const unitPct = gcdN(P, 100);
  const fmt = unitFmt(what);
  return finish(
    {
      gen: "percent-whole", tag: "Find the whole", steps: 1, unit: what, value: W,
      prompt: `${num(part)} ${what} are ${done}. That is ${P}% of ${P > 100 ? "the goal" : `all the ${what}`}. How many ${what} make 100%?`,
      hints: [`If ${P}% is ${num(part)}, what is ${unitPct}%?`, `${P}% = ${num(part)}, so ${unitPct}% = ${num(part)} ÷ ${P / unitPct} = ${num(part / (P / unitPct))}. 100% is ${100 / unitPct} of those.`],
      model: { kind: "dnl", rows: [{ label: "percent", ticks: ["0%", `${P}%`, "100%"].sort((a, b) => parseFloat(a) - parseFloat(b)) }, { label: what, ticks: P < 100 ? ["0", num(part), "?"] : ["0", "?", num(part)] }] },
      facts: { P, part },
    },
    fmt(W),
    [
      opt((part * P) / 100, fmt, `That's ${P}% of ${num(part)}. But ${num(part)} is the part. Find 100%.`),
      P / unitPct > 1 ? opt(part / (P / unitPct), fmt, `That's only ${unitPct}%. Keep going to 100%.`) : null,
      opt(part + (100 - P), fmt, "Adding the missing percent to the count doesn't work. Find 1 part, then build 100%."),
      opt(part * 2, fmt, "Doubling only works when the part is 50%."),
    ],
    nudges(W, fmt),
  );
}

function percentFind(rng: Rng, p: Params): MathQ {
  const what = name(p, "what", "shots");
  const adj = name(p, "adj", "made");
  const over = chance(rng, 0.2);
  let a: number;
  let b: number;
  if (over) {
    b = pick(rng, [4, 8, 10, 20, 40, 50]);
    const P = pick(rng, [125, 150, 200, 250]);
    a = (b * P) / 100;
    if (a % 1) throw new Retry();
  } else {
    b = pick(rng, [4, 5, 8, 10, 12, 20, 25, 40, 50]);
    a = int(rng, 1, b - 1);
    if (!terminates((100 * a) / b, 0)) throw new Retry();
  }
  const value = (100 * a) / b;
  const fmt = (x: number) => pct(x);
  const prompt = over
    ? `The goal was ${b} ${what}. The team got ${a}. What percent of the goal is that?`
    : `${a} out of ${b} ${what} were ${adj}. What percent is that?`;
  return finish(
    {
      gen: "percent-find", tag: "Find the percent", steps: 1, unit: "percent", value,
      prompt,
      hints: ["Percent means out of 100. Make the whole equal 100.", terminates(100 / b, 2) ? `${a} out of ${b} = ? out of 100. ${b} × ${num(100 / b)} = 100, so multiply ${a} by ${num(100 / b)} too.` : `${a} ÷ ${b} = ${num(a / b, 4)}. Percent means per 100, so multiply by 100.`],
      model: { kind: "dnl", rows: [{ label: what, ticks: over ? ["0", String(b), String(a)] : ["0", String(a), String(b)] }, { label: "percent", ticks: over ? ["0%", "100%", "?"] : ["0%", "?", "100%"] }] },
      facts: { a, b },
    },
    fmt(value),
    [
      terminates((100 * b) / a, 1) ? opt((100 * b) / a, fmt, `Flipped: you divided ${b} by ${a}. It's part ÷ whole: ${a} ÷ ${b}.`) : null,
      opt(a, fmt, `${a} isn't out of 100, it's out of ${b}.`),
      !over ? opt(100 - value, fmt, `That's the percent NOT ${adj}.`) : opt(value - 100, fmt, "That's only the part above 100%. The whole goal is 100% already."),
      terminates(a / b, 2) ? { text: `${num(a / b)}%`, why: `${num(a / b)} is the decimal. Percent means per 100: multiply by 100.` } : null,
    ],
    nudges(value, fmt),
  );
}

function salePrice(rng: Rng, p: Params): MathQ {
  const item = name(p, "item", "jacket");
  const P = pick(rng, [10, 15, 20, 25, 30, 40, 50, 35, 12]);
  const round = chance(rng, 0.35);
  const W = round ? int(rng, 5, 90) * 100 - pick(rng, [1, 5, 51]) : int(rng, 4, 90) * 100;
  const disc = roundCents((W * P) / 100);
  const value = W - disc;
  const fmt = money;
  return finish(
    {
      gen: "sale-price", tag: "Discounts, tax, and tips (two-step)", steps: 2, unit: "cents", value, rounding: (W * P) % 100 !== 0,
      prompt: `A ${money(W)} ${item} is ${P}% off. What do you pay?${(W * P) % 100 !== 0 ? " (Round the discount to the nearest cent.)" : ""}`,
      hints: ["Two steps: find the discount, then what's left to pay.", P === 50 ? `50% off means you still pay the other 50%: half of ${money(W)}.` : `Discount = ${P}% of ${money(W)} = ${money(disc)}. Now take it off the price.`],
      model: 100 / gcdN(P, 100) <= 10 ? { kind: "tape", parts: 100 / gcdN(P, 100), shaded: P / gcdN(P, 100), shadedLabel: `${P}% off`, totalLabel: `${money(W)} = 100%`, partLabel: `${gcdN(P, 100)}%` } : undefined,
      facts: { W, P },
    },
    fmt(value),
    [
      opt(disc, fmt, "That's the discount. What does the customer pay?"),
      opt(W + disc, fmt, "You added the discount. A sale makes the price go DOWN."),
      W - P * 100 > 0 ? opt(W - P * 100, fmt, `You took off ${P} dollars, not ${P}%.`) : null,
      opt(W - disc * 10 > 0 ? W - disc * 10 : W - roundCents(disc / 10), fmt, "Check the decimal point in the discount."),
    ],
    nudges(value, fmt, true),
  );
}

function addOn(kind: "tax" | "tip") {
  return (rng: Rng, p: Params): MathQ => {
    const item = name(p, "item", kind === "tax" ? "scooter" : "dinner");
    const r = kind === "tax" ? pick(rng, [6, 7, 8, 5, 4]) : pick(rng, [15, 20, 18, 10, 25]);
    const W = int(rng, 500, 12000);
    const add = roundCents((W * r) / 100);
    const value = W + add;
    const chopped = W + Math.floor((W * r) / 100);
    const fmt = money;
    const word = kind === "tax" ? "sales tax" : "tip";
    return finish(
      {
        gen: kind === "tax" ? "sales-tax" : "tip", tag: "Discounts, tax, and tips (two-step)", steps: 2, unit: "cents", value, rounding: (W * r) % 100 !== 0,
        prompt: kind === "tax"
          ? `The ${item} costs ${money(W)}. Sales tax is ${r}%. What is the total? (Round the tax to the nearest cent.)`
          : `The bill for ${item} is ${money(W)}. You leave a ${r}% tip. What is the total? (Round the tip to the nearest cent.)`,
        hints: [`Two steps: find the ${word}, then add it on.`, `${r}% of ${money(W)} = ${num((W * r) / 10000, 4)} → ${money(add)}. Now add it to ${money(W)}.`],
        facts: { W, r },
      },
      fmt(value),
      [
        opt(add, fmt, `That's just the ${word}. Add it to the price.`),
        opt(W - add, fmt, `The ${word} is ADDED on, not taken off.`),
        opt(W + r * 100, fmt, `You added ${r} dollars, not ${r}%.`),
        chopped !== value ? opt(chopped, fmt, `You chopped the ${word} instead of rounding it to the nearest cent.`) : null,
        opt(W + add * 10, fmt, `Check the decimal point in the ${word}.`),
      ],
      nudges(value, fmt, true),
    );
  };
}

// =====================================================================================
// E · Painting a Room
// =====================================================================================

function room(rng: Rng) {
  const L = int(rng, 9, 16);
  const W = int(rng, 8, 14);
  const H = pick(rng, [8, 9, 10]);
  const windows = int(rng, 0, 2);
  const per = 2 * (L + W);
  const walls = per * H;
  const open = 21 + 12 * windows;
  return { L, W, H, windows, per, walls, open, paint: walls - open };
}
const roomText = (r: ReturnType<typeof room>) =>
  `The room is ${r.L} ft by ${r.W} ft, and the walls are ${r.H} ft tall. It has a 3 ft × 7 ft door${r.windows ? ` and ${r.windows === 1 ? "a 3 ft × 4 ft window" : "two 3 ft × 4 ft windows"}` : ""}.`;

function paintArea(rng: Rng): MathQ {
  const r = room(rng);
  const fmt = unitFmt("sq ft");
  return finish(
    {
      gen: "paint-area", tag: "Multi-step project (Painting a Room)", steps: 2, unit: "sq ft", value: r.paint,
      prompt: `${roomText(r)} How many square feet of wall need paint?`,
      hints: ["Find the area of all four walls first: perimeter × height.", `Perimeter = ${r.L} + ${r.W} + ${r.L} + ${r.W} = ${r.per} ft. ${r.per} × ${r.H} = ${r.walls} sq ft. Now subtract the door${r.windows ? " and windows" : ""}.`],
      facts: { L: r.L, W: r.W, H: r.H, windows: r.windows },
    },
    fmt(r.paint),
    [
      opt(r.walls, fmt, `That's all four walls. Subtract the door${r.windows ? " and windows" : ""}: you don't paint those.`),
      opt(r.L * r.W, fmt, "That's the floor, not the walls."),
      opt((r.L + r.W) * r.H - r.open, fmt, "That's only two walls. A room has four."),
      opt(r.L * r.W * r.H, fmt, "That's the volume of the room (cubic feet), not the wall area."),
    ],
    nudges(r.paint, fmt),
  );
}

function paintGallons(rng: Rng): MathQ {
  const A = int(rng, 20, 70) * 10;
  const coats = pick(rng, [2, 2, 3, 1]);
  const c = pick(rng, [350, 400, 300, 250]);
  const need = (A * coats) / c;
  if (Number.isInteger(need)) throw new Retry();
  const value = Math.ceil(need);
  const fmt = (x: number) => `${num(x)} ${plural(x, "gallon", "gallons")}`;
  return finish(
    {
      gen: "paint-gallons", tag: "Multi-step project (Painting a Room)", steps: 2, unit: "gallons", value, rounding: true,
      prompt: `The walls are ${num(A)} sq ft. You want ${coats} ${plural(coats, "coat", "coats")}. One gallon covers ${c} sq ft. How many whole gallons do you buy?`,
      hints: [`First find the total area to cover: ${coats} ${plural(coats, "coat", "coats")} of ${num(A)} sq ft.`, `${num(A)} × ${coats} = ${num(A * coats)} sq ft. ${num(A * coats)} ÷ ${c} = about ${num(need)} gallons. Can you buy part of a gallon?`],
      facts: { A, coats, c },
    },
    fmt(value),
    [
      Math.floor(need) >= 1 ? opt(Math.floor(need), fmt, "You rounded down, so you'd run out of paint! Round UP.") : null,
      { text: `about ${num(need)} gallons`, why: "Stores sell whole gallons. Round UP so you have enough." },
      coats > 1 && Math.ceil(A / c) !== value ? opt(Math.ceil(A / c), fmt, `That's enough for one coat. You need ${coats}.`) : null,
      opt(value + 1, fmt, "That's one more gallon than you need."),
      opt(value + 2, fmt, "That's more than you need. Round up to the next whole gallon only."),
    ],
  );
}

interface Combo {
  x: number;
  y: number;
  gal: number;
  cost: number;
}
const comboText = (c: Combo, S: number) =>
  [c.x ? `${c.x} ${S}-gal ${plural(c.x, "bucket", "buckets")}` : "", c.y ? `${c.y} 1-gal ${plural(c.y, "can", "cans")}` : ""].filter(Boolean).join(" + ");

/** The paint shop: 1-gallon cans and bigger buckets that are cheaper per gallon. */
export function paintShop(rng: Rng) {
  const S = pick(rng, [2, 5]);
  const G = S === 2 ? pick(rng, [3, 5, 7]) : pick(rng, [6, 7, 8, 9, 11]);
  const a = int(rng, 18, 34) * 100 + pick(rng, [0, 50, 99]);
  const perB = a - int(rng, 2, 6) * 100;
  const b = perB * S;
  const combos: Combo[] = [];
  for (let x = 0; x <= Math.ceil(G / S); x++)
    for (let y = 0; y <= G; y++) {
      const gal = x * S + y;
      if (x + y === 0) continue;
      combos.push({ x, y, gal, cost: x * b + y * a });
    }
  const ok = combos.filter((c) => c.gal >= G).sort((m, n) => m.cost - n.cost);
  const best = ok[0];
  if (ok[1] && ok[1].cost === best.cost) throw new Retry();
  const trap: Combo = { x: Math.floor(G / S), y: 0, gal: Math.floor(G / S) * S, cost: Math.floor(G / S) * b };
  return { S, G, a, b, perB, best, ok, trap };
}

/** "Which buy is cheapest and holds enough?" for a given shop (also a chain step). */
export function paintCostQ(sh: ReturnType<typeof paintShop>, prompt?: string): MathQ {
  const { S, G, a, b, best, ok, trap } = sh;
  const others = ok.filter((c) => c !== best && !(c.x === trap.x && c.y === trap.y));
  const t = (c: Combo) => `${comboText(c, S)} (${money(c.cost)})`;
  const allCans = others.find((c) => c.x === 0) ?? null;
  const allBuckets = others.find((c) => c.y === 0) ?? null;
  return finish(
    {
      gen: "paint-cost", tag: "Multi-step project (Painting a Room)", steps: 2, unit: "key", value: `${best.x}+${best.y}`,
      prompt: prompt ?? `You need ${G} gallons. A 1-gallon can costs ${money(a)}. A ${S}-gallon bucket costs ${money(b)}. What is the cheapest way to get ENOUGH paint?`,
      hints: [`Find the price per gallon of the bucket. Then check: does each choice hold at least ${G} gallons?`, `${money(b)} ÷ ${S} = ${money(sh.perB)} per gallon, cheaper than a can. Use buckets for most of it, but make sure the total is at least ${G} gallons.`],
      model: { kind: "table", headers: ["gallons", "price"], rows: [["1 (can)", money(a)], [`${S} (bucket)`, money(b)], [String(G), "?"]] },
      facts: { S, G, a, b },
      label: "Cheapest buy that holds enough",
    },
    t(best),
    [
      trap.gal < G && trap.x > 0 ? { text: t(trap), why: `Cheapest per gallon, but that's only ${trap.gal} gallons. You need ${G}.` } : null,
      allCans ? { text: t(allCans), why: `Enough paint, but cans cost more per gallon. ${money(best.cost)} is cheaper.` } : null,
      allBuckets ? { text: t(allBuckets), why: `Enough paint, but it costs more than ${money(best.cost)}.` } : null,
      ...others.slice(0, 6).map((c) => ({ text: t(c), why: `Enough paint, but it costs more than ${money(best.cost)}.` })),
    ],
  );
}

const paintCost = (rng: Rng): MathQ => paintCostQ(paintShop(rng));

// =====================================================================================
// Bridge · scale factors (7th grade)
// =====================================================================================

function scaleCopy(rng: Rng, p: Params): MathQ {
  const thing = name(p, "thing", "drawing");
  const tag: SkillTag = "Bridge: scale factors";
  const L = int(rng, 2, 24) * 2;
  const r = rng();
  const fmt = unitFmt("cm");
  if (r < 0.4) {
    const P = pick(rng, [50, 150, 200, 80, 125, 75, 250]);
    const value = (L * P) / 100;
    return finish(
      {
        gen: "scale-copy", tag, steps: 1, unit: "cm", value,
        prompt: `The ${thing} is ${L} cm long. The copy machine is set to ${P}%. How long is the copy?`,
        hints: [`${P}% is a scale factor. As a decimal, ${P}% = × ${num(P / 100)}.`, `${L} × ${num(P / 100)}: ${P > 100 ? "bigger" : "smaller"} than ${L}.`],
        facts: { L, P, variant: "at" },
      },
      fmt(value),
      [
        opt(L / (P / 100), fmt, `You divided by ${num(P / 100)}. A copy at ${P}% MULTIPLIES by ${num(P / 100)}.`),
        P > 100 ? opt((L * (P - 100)) / 100, fmt, `That's only the extra ${P - 100}%. ${P}% is the whole length plus that.`) : opt(L - value, fmt, `That's how much shorter it got, not the new length.`),
        opt(L + P, fmt, `You added ${P}. A percent scale multiplies.`),
        opt(L, fmt, "That's the original length."),
      ],
      nudges(value, fmt),
    );
  }
  if (r < 0.7) {
    const B = pick(rng, [50, 25, 100, 20, 75]);
    const value = (L * (100 + B)) / 100;
    return finish(
      {
        gen: "scale-copy", tag, steps: 2, unit: "cm", value,
        prompt: `The ${thing} is ${L} cm long. It is enlarged BY ${B}%. How long is it now?`,
        hints: [`"Enlarged BY ${B}%" means 100% + ${B}% = ${100 + B}%.`, `${100 + B}% = × ${num((100 + B) / 100)}. ${L} × ${num((100 + B) / 100)} = ?`],
        facts: { L, B, variant: "by" },
      },
      fmt(value),
      [
        opt((L * B) / 100, fmt, `That's only the extra ${B}%. "Enlarged BY ${B}%" means ${100 + B}% of the original.`),
        opt(L + B, fmt, `You added ${B} cm, not ${B}%.`),
        opt((L * B) / 10, fmt, "Check the decimal point."),
        opt(L * 2, fmt, `That's 200%. Enlarged by ${B}% is ${100 + B}%.`),
      ],
      nudges(value, fmt),
    );
  }
  const P = pick(rng, [150, 200, 50, 250, 125]);
  const C = (L * P) / 100;
  return finish(
    {
      gen: "scale-copy", tag, steps: 1, unit: "cm", value: L,
      prompt: `A copy made at ${P}% is ${num(C)} cm long. How long was the original?`,
      hints: [`The copy = original × ${num(P / 100)}. To go back, undo it.`, `Undo × ${num(P / 100)} by dividing: ${num(C)} ÷ ${num(P / 100)}.`],
      facts: { C, P, variant: "back" },
    },
    fmt(L),
    [
      opt((C * P) / 100, fmt, `That makes ANOTHER copy at ${P}%. Go back by dividing by ${num(P / 100)}.`),
      opt(C, fmt, "That's the copy's length, not the original."),
      opt(P > 100 ? C - (C * (P - 100)) / 100 : C + C / 2, fmt, "Going back isn't subtracting the same percent. Divide by the scale factor."),
      opt(L * 10, fmt, "Check the decimal point."),
    ],
    nudges(L, fmt),
  );
}

function scaleArea(rng: Rng, p: Params): MathQ {
  const thing = name(p, "thing", "poster");
  const a = int(rng, 2, 12);
  const b = int(rng, 2, 12);
  const P = pick(rng, [200, 150, 50, 300]);
  const f = P / 100;
  const A = a * b;
  const value = A * f * f;
  if (!terminates(value)) throw new Retry();
  const fmt = unitFmt("sq cm");
  return finish(
    {
      gen: "scale-area", tag: "Bridge: scale factors", steps: 2, unit: "sq cm", value,
      prompt: `A ${thing} is ${a} cm by ${b} cm. It is copied at ${P}%. What is the AREA of the copy?`,
      hints: ["Find the new length and the new width first.", `New sides: ${a} × ${num(f)} = ${num(a * f)} and ${b} × ${num(f)} = ${num(b * f)}. Area = length × width.`],
      facts: { a, b, P },
    },
    fmt(value),
    [
      opt(A * f, fmt, `Area grows by the scale factor TWICE (once for length, once for width): × ${num(f)} × ${num(f)}.`),
      opt(A, fmt, "That's the original area."),
      opt(2 * (a + b) * f, fmt, "That's the perimeter of the copy, not the area."),
      opt(A * f * 2, fmt, `Multiply by ${num(f)} twice, not by ${num(f)} and then 2.`),
    ],
    nudges(value, fmt),
  );
}

function scaleDrawing(rng: Rng): MathQ {
  const s = pick(rng, [2, 3, 4, 5, 6, 8, 10]);
  const tag: SkillTag = "Bridge: scale factors";
  if (chance(rng, 0.6)) {
    const d = int(rng, 3, 18) / 2;
    const value = d * s;
    const fmt = unitFmt("feet");
    return finish(
      {
        gen: "scale-drawing", tag, steps: 1, unit: "feet", value,
        prompt: `The plan's scale is 1 inch to ${s} feet. A wall is ${num(d)} inches on the plan. How long is the real wall?`,
        hints: ["A scale is a rate: feet per inch.", `Each inch stands for ${s} feet, so multiply ${num(d)} × ${s}.`],
        model: { kind: "dnl", rows: [{ label: "inches", ticks: ["0", "1", num(d)] }, { label: "feet", ticks: ["0", String(s), "?"] }] },
        facts: { s, d, variant: "real" },
      },
      fmt(value),
      [
        opt(d / s, fmt, `You divided. Each inch is ${s} feet, so multiply.`),
        opt(d * s * 12, fmt, "That's inches. The scale already gives feet."),
        opt(d + s, fmt, `Adding doesn't use the scale. Multiply by ${s}.`),
        opt(s, fmt, "That's just 1 inch on the plan."),
      ],
      nudges(value, fmt),
    );
  }
  const fmt = (x: number) => `1 : ${num(x)}`;
  return finish(
    {
      gen: "scale-drawing", tag, steps: 2, unit: "ratio", value: 12 * s,
      prompt: `A scale of 1 inch to ${s} feet, written with the SAME units, is 1 : what?`,
      hints: ["Change feet to inches so both sides use inches.", `1 foot = 12 inches, so ${s} feet = ${s} × 12 inches.`],
      facts: { s, variant: "ratio" },
    },
    fmt(12 * s),
    [
      opt(s, fmt, "Those aren't the same units yet. Change feet to inches first."),
      opt(3 * s, fmt, "A foot is 12 inches, not 3."),
      opt(s + 12, fmt, "Multiply by 12, don't add."),
      opt(s / 12, fmt, "You divided. Feet → inches means multiplying by 12."),
    ],
  );
}

// =====================================================================================
// Registry
// =====================================================================================

export interface GenDef {
  id: string;
  tag: SkillTag;
  /** Story parameters it understands (`item=jacket`). */
  params: readonly string[];
  /** Can it produce two-step items? "always" / "sometimes" / "never". */
  two: "always" | "sometimes" | "never";
  make: (rng: Rng, p: Params) => MathQ;
}

const g = (id: string, tag: SkillTag, params: readonly string[], two: GenDef["two"], make: GenDef["make"]): GenDef => ({ id, tag, params, two, make });

export const GENERATORS: Record<string, GenDef> = Object.fromEntries(
  [
    g("estimate-rate", "Estimating with rates", ["theme"], "sometimes", estimateRate),
    g("pick-unit", "Choosing sensible units", ["a", "b"], "never", pickUnit),
    g("convert-length", "Converting units", ["thing", "dir", "pair"], "sometimes", convert("length")),
    g("convert-weight", "Converting units", ["thing", "dir", "pair"], "never", convert("weight")),
    g("convert-volume", "Converting units", ["thing", "dir", "pair"], "sometimes", convert("volume")),
    g("deal-compare", "Comparing speeds and prices", ["item", "unit"], "never", dealCompare),
    g("speed-compare", "Comparing speeds and prices", ["a", "b", "how"], "never", speedCompare),
    g("two-rates", "Two unit rates from one ratio", ["item", "unit"], "never", twoRates),
    g("same-rate", "Same rate? (equivalent ratios)", ["a", "b", "unit", "thing"], "never", sameRate),
    g("pace-vs-speed", "Speed vs. pace", ["a", "b"], "never", paceVsSpeed),
    g("unit-price-total", "Multi-step rate problems", ["item"], "sometimes", unitPriceTotal),
    g("batch-scale", "Multi-step rate problems", ["ing", "unit", "what"], "sometimes", batchScale),
    g("percent-rate", "Percent as a rate per 100", ["thing", "what", "adj"], "never", percentRate),
    g("percent-dnl", "Percents on double number lines", ["unit", "thing"], "never", percentDnl),
    g("percent-tape", "Percents with tape diagrams", ["unit", "thing"], "always", percentTape),
    g("benchmark-percent", "Benchmark percents", ["unit"], "never", benchmarkPercent),
    g("percent-of", "Percent of a number (find the part)", ["thing"], "never", percentOf),
    g("percent-whole", "Find the whole", ["what", "done", "over"], "never", percentWhole),
    g("percent-find", "Find the percent", ["what", "adj"], "never", percentFind),
    g("sale-price", "Discounts, tax, and tips (two-step)", ["item"], "always", salePrice),
    g("sales-tax", "Discounts, tax, and tips (two-step)", ["item"], "always", addOn("tax")),
    g("tip", "Discounts, tax, and tips (two-step)", ["item"], "always", addOn("tip")),
    g("paint-area", "Multi-step project (Painting a Room)", [], "always", paintArea),
    g("paint-gallons", "Multi-step project (Painting a Room)", [], "always", paintGallons),
    g("paint-cost", "Multi-step project (Painting a Room)", [], "always", paintCost),
    g("scale-copy", "Bridge: scale factors", ["thing"], "sometimes", scaleCopy),
    g("scale-area", "Bridge: scale factors", ["thing"], "always", scaleArea),
    g("scale-drawing", "Bridge: scale factors", [], "sometimes", scaleDrawing),
  ].map((d) => [d.id, d]),
);

/** One generator per skill tag, for redo rounds of tags that came from chain steps. */
export const TAG_GENERATOR: Record<SkillTag, string> = {
  "Estimating with rates": "estimate-rate",
  "Choosing sensible units": "pick-unit",
  "Converting units": "convert-length",
  "Comparing speeds and prices": "deal-compare",
  "Two unit rates from one ratio": "two-rates",
  "Same rate? (equivalent ratios)": "same-rate",
  "Speed vs. pace": "pace-vs-speed",
  "Multi-step rate problems": "unit-price-total",
  "Percent as a rate per 100": "percent-rate",
  "Percents on double number lines": "percent-dnl",
  "Percents with tape diagrams": "percent-tape",
  "Benchmark percents": "benchmark-percent",
  "Percent of a number (find the part)": "percent-of",
  "Find the whole": "percent-whole",
  "Find the percent": "percent-find",
  "Discounts, tax, and tips (two-step)": "sale-price",
  "Multi-step project (Painting a Room)": "paint-gallons",
  "Bridge: scale factors": "scale-copy",
};

/** Make a question (retries when a random draw doesn't give 4 clean, different choices). */
export function generate(id: string, params: Params, rng: Rng): MathQ {
  const def = GENERATORS[id];
  if (!def) throw new Error(`Unknown math generator "${id}"`);
  for (let i = 0; i < 200; i++) {
    try {
      return def.make(rng, params);
    } catch (e) {
      if (!(e instanceof Retry)) throw e;
    }
  }
  throw new Error(`Generator "${id}" could not make a question`);
}

// re-exported for chains
export { money, num, pct, frac, clock, roundCents, room, roomText, comboText, opt, nudges, name, twoNames, unitFmt, gcdN };
export type { Opt, Combo };
