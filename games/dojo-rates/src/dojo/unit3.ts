import type { Question } from "../kit/types";

/*
 * Math 6 · Unit 3 (Unit Rates and Percentages) question generators for Dojo Tower: Rates & Percents,
 * SpiderBen10's special edition. The curriculum source of truth is docs/math6-unit3.md.
 *
 * Every generator is a pure function of a random source: fresh numbers each time, every answer
 * computed here (never hand-typed), wrong choices built from real mistakes (the step-one answer,
 * the flipped division, the decimal in the wrong place, the unrounded value...) and each wrong
 * choice carries feedback that NAMES the mistake. Every question has a skill tag (the 18 names
 * in section 5 of the doc), a two-stage hint (a nudge, then a worked step) and, for rate and
 * percent items, a model to draw (double number line, tape diagram or ratio table).
 * Money always shows 2 decimals; money math is done in whole cents.
 */

export type Rng = () => number;

/** Sections of the unit (X = the 7th-grade bridge: scale factors). */
export type SectionId = "A" | "B" | "C" | "D" | "E" | "X";

/** Section 5 of the doc: skill tags 1-18, exactly as named there. */
export const SKILL_TAGS = [
  "Estimating with rates",
  "Choosing sensible units",
  "Converting units",
  "Comparing speeds and prices",
  "Two unit rates from one ratio",
  "Same rate? (equivalent ratios)",
  "Speed vs. pace",
  "Multi-step rate problems",
  "Percent as a rate per 100",
  "Percents on double number lines",
  "Percents with tape diagrams",
  "Benchmark percents",
  "Percent of a number (find the part)",
  "Find the whole",
  "Find the percent",
  "Discounts, tax, and tips (two-step)",
  "Multi-step project (Painting a Room)",
  "Bridge: scale factors",
] as const;
export type SkillTag = (typeof SKILL_TAGS)[number];

export function tagName(tag: number): SkillTag {
  return SKILL_TAGS[tag - 1];
}

/** NC standard per skill tag (NC.6.RP.2 unit rate; NC.6.RP.3 ratio and rate reasoning; bridge: NC.7.G.1). */
const STANDARD: Record<number, string> = {
  1: "NC.6.RP.3", 2: "NC.6.RP.3", 3: "NC.6.RP.3", 4: "NC.6.RP.3", 5: "NC.6.RP.2", 6: "NC.6.RP.3", 7: "NC.6.RP.3",
  8: "NC.6.RP.3", 9: "NC.6.RP.3", 10: "NC.6.RP.3", 11: "NC.6.RP.3", 12: "NC.6.RP.3", 13: "NC.6.RP.3", 14: "NC.6.RP.3",
  15: "NC.6.RP.3", 16: "NC.6.RP.3", 17: "NC.6.RP.3", 18: "NC.7.G.1",
};

export type Model =
  | { type: "dnl"; topLabel: string; bottomLabel: string; top: string[]; bottom: string[] }
  | { type: "tape"; parts: number; shaded: number; partLabel: string; shadedLabel: string; totalLabel: string }
  | { type: "table"; head: string[]; rows: string[][] };

export type Dir = "toSmaller" | "toBigger";

export interface U3Question extends Question {
  section: SectionId;
  /** Skill tag number, 1-18. */
  tag: number;
  kind: KindId;
  /** Stage 1: a nudge. Stage 2: a worked step (never the final answer). */
  hints: [string, string];
  /** Per choice (same order as `choices`): the named mistake, "" for the right answer. */
  feedback: string[];
  /** Needs two (or more) steps; only the final answer is accepted. */
  twoStep: boolean;
  /** The inputs, so tests can recompute the answer independently. */
  data: Record<string, number | string>;
  /** Unit conversions: which way the conversion goes. */
  dir?: Dir;
  model?: Model;
  /** Paint the Room: which step of the job (1-5). */
  step?: number;
}

/* ------------------------------------------------------------------ number helpers */

export const ri = (rng: Rng, a: number, b: number) => a + Math.floor(rng() * (b - a + 1));
export const pick = <T>(rng: Rng, arr: readonly T[]): T => arr[Math.floor(rng() * arr.length)];

export function gcd(a: number, b: number): number {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) [a, b] = [b, a % b];
  return a;
}

/** Rounds n / d to the nearest whole number, halves up (n, d positive integers). */
export function roundDiv(n: number, d: number): number {
  return Math.floor((2 * n + d) / (2 * d));
}

const commas = (s: string) => s.replace(/\B(?=(\d{3})+(?!\d))/g, ",");

/** A number with at most 2 decimals (trailing zeros dropped) and thousands commas: 5,280 · 7.5 · 26.4. */
export function fmtNum(x: number): string {
  const r = Math.round(x * 100 + (x >= 0 ? 1e-7 : -1e-7)) / 100;
  const [i, f] = Math.abs(r).toFixed(2).split(".");
  const frac = f.replace(/0+$/, "");
  return `${r < 0 ? "-" : ""}${commas(i)}${frac ? `.${frac}` : ""}`;
}

/** Money from whole cents, always 2 decimals: $3.30, $1,250.00. */
export function money(cents: number): string {
  const c = Math.round(cents);
  return `$${commas(String(Math.floor(c / 100)))}.${String(c % 100).padStart(2, "0")}`;
}

/** An exact amount in hundredths of a cent: 2 decimals when it is whole cents, else the unrounded value ($1.9992). */
export function exactMoney(n: number): string {
  return n % 100 === 0 ? money(n / 100) : `$${(n / 10000).toFixed(4).replace(/0+$/, "")}`;
}

/** Cents as a plain number of cents with up to 2 decimals, e.g. "13.75¢" (used for price per ounce). */
const centsText = (c: number) => `${fmtNum(c)}¢`;

const GLYPH: Record<string, string> = {
  "1/2": "½", "1/3": "⅓", "2/3": "⅔", "1/4": "¼", "3/4": "¾", "1/5": "⅕", "2/5": "⅖", "3/5": "⅗", "4/5": "⅘",
  "1/6": "⅙", "5/6": "⅚", "1/8": "⅛", "3/8": "⅜", "5/8": "⅝", "7/8": "⅞", "1/10": "⅒",
};

const terminates = (d: number) => {
  while (d % 2 === 0) d /= 2;
  while (d % 5 === 0) d /= 5;
  return d === 1;
};

/**
 * A rate or amount n/d (positive integers) as kids read it: whole numbers plain; halves, thirds,
 * quarters (and other common fractions) as ½ ⅓ ⅔ ¼ ¾, 1½; other terminating values as decimals (2.4);
 * anything else as a fraction (5/7).
 */
export function niceRate(n: number, d: number): string {
  const g = gcd(n, d);
  n /= g;
  d /= g;
  if (d === 1) return fmtNum(n);
  const whole = Math.floor(n / d);
  const rem = n % d;
  const glyph = GLYPH[`${rem}/${d}`];
  if (glyph) return whole ? `${fmtNum(whole)}${glyph}` : glyph;
  if (terminates(d) && Number.isInteger((n * 100) / d)) return fmtNum(n / d);
  return whole ? `${fmtNum(whole)} ${rem}/${d}` : `${rem}/${d}`;
}

/** A fraction of a batch / unit, e.g. ⅔ or 1½. */
const fracText = (num: number, den: number) => niceRate(num, den);

/* ------------------------------------------------------------------ building a question */

interface Wrong {
  t: string;
  why: string;
}

/** Kind ids, with each kind's section, skill tag and whether it needs two steps. */
export const KIND_META = {
  washTime: { section: "A", tag: 1, twoStep: true },
  washHours: { section: "A", tag: 1, twoStep: true },
  towerHeight: { section: "A", tag: 1, twoStep: false },
  elevator: { section: "A", tag: 1, twoStep: false },
  crewCost: { section: "A", tag: 1, twoStep: true },
  stairs: { section: "A", tag: 1, twoStep: true },
  unitAnchor: { section: "B", tag: 2, twoStep: false },
  biggerNumber: { section: "B", tag: 2, twoStep: false },
  moreOrFewer: { section: "B", tag: 2, twoStep: false },
  convert: { section: "B", tag: 3, twoStep: false },
  convert2: { section: "B", tag: 3, twoStep: true },
  convertFrac: { section: "B", tag: 3, twoStep: false },
  unitCost: { section: "B", tag: 3, twoStep: true },
  whoFaster: { section: "C", tag: 4, twoStep: false },
  betterDeal: { section: "C", tag: 4, twoStep: false },
  unitPriceRound: { section: "C", tag: 4, twoStep: false },
  twoRates: { section: "C", tag: 5, twoStep: false },
  sameRate: { section: "C", tag: 6, twoStep: false },
  paceCompare: { section: "C", tag: 7, twoStep: false },
  speedToPace: { section: "C", tag: 7, twoStep: false },
  paceToSpeed: { section: "C", tag: 7, twoStep: false },
  fastestPace: { section: "C", tag: 7, twoStep: false },
  unitThenTotal: { section: "C", tag: 8, twoStep: true },
  roundAtEnd: { section: "C", tag: 8, twoStep: true },
  timeForDistance: { section: "C", tag: 8, twoStep: true },
  recipeBatch: { section: "C", tag: 8, twoStep: false },
  cookieScale: { section: "C", tag: 8, twoStep: true },
  gasOp: { section: "C", tag: 8, twoStep: true },
  percentMeaning: { section: "D", tag: 9, twoStep: false },
  ticketPercent: { section: "D", tag: 9, twoStep: false },
  outOf: { section: "D", tag: 9, twoStep: false },
  dnlPart: { section: "D", tag: 10, twoStep: false },
  dnlWhole: { section: "D", tag: 10, twoStep: false },
  tapeWhole: { section: "D", tag: 11, twoStep: true },
  tapePart: { section: "D", tag: 11, twoStep: true },
  benchmark: { section: "D", tag: 12, twoStep: false },
  findPart: { section: "D", tag: 13, twoStep: false },
  findWhole: { section: "D", tag: 14, twoStep: false },
  findPercent: { section: "D", tag: 15, twoStep: false },
  discount: { section: "D", tag: 16, twoStep: true },
  tax: { section: "D", tag: 16, twoStep: true },
  tip: { section: "D", tag: 16, twoStep: true },
  paintWalls: { section: "E", tag: 17, twoStep: true },
  paintSubtract: { section: "E", tag: 17, twoStep: true },
  paintGallons: { section: "E", tag: 17, twoStep: true },
  paintBuy: { section: "E", tag: 4, twoStep: true },
  paintTax: { section: "E", tag: 16, twoStep: true },
  comboDeal: { section: "C", tag: 8, twoStep: true },
  comboRunner: { section: "C", tag: 8, twoStep: true },
  comboTank: { section: "D", tag: 11, twoStep: true },
  comboShop: { section: "D", tag: 16, twoStep: true },
  comboPaint: { section: "E", tag: 17, twoStep: true },
  copier: { section: "X", tag: 18, twoStep: false },
  enlargedBy: { section: "X", tag: 18, twoStep: true },
  areaScale: { section: "X", tag: 18, twoStep: true },
  reverseCopy: { section: "X", tag: 18, twoStep: false },
  scaleRatio: { section: "X", tag: 18, twoStep: false },
} as const satisfies Record<string, { section: SectionId; tag: number; twoStep: boolean }>;
export type KindId = keyof typeof KIND_META;
export const KIND_IDS = Object.keys(KIND_META) as KindId[];

let serial = 0;
/** How many times a generator ran short of mistake-based wrong choices (tests keep this near 0). */
export const stats = { filler: 0 };

const GENERIC_WHY = "Not quite. Redo the arithmetic one step at a time.";

/** Generic near-miss choices (only used when a generator's own mistakes collide). */
function filler(correct: string): Wrong[] {
  stats.filler++;
  const m = correct.match(/(\$?)(\d[\d,]*(?:\.\d+)?)/);
  if (!m) return [];
  const isMoney = m[1] === "$";
  const v = Number(m[2].replace(/,/g, ""));
  const out: Wrong[] = [];
  for (const k of [2, 0.5, 10, 1.5, 3, 0.1, 4]) {
    const x = v * k;
    const txt = isMoney ? money(Math.round(x * 100)) : fmtNum(x);
    if (x > 0) out.push({ t: correct.replace(m[0], `${m[1]}${txt.replace(/^\$/, "")}`), why: GENERIC_WHY });
  }
  return out;
}

function hasNegative(s: string): boolean {
  const first = s.match(/\d[\d,]*(?:\.\d+)?/);
  if (first && Number(first[0].replace(/,/g, "")) === 0 && !/[½⅓⅔¼¾⅕⅖⅗⅘⅙⅚⅛⅜⅝⅞⅒]/.test(s)) return true;
  return /(^|[^\w])[-−]\s?\$?\d/.test(s) || /NaN|Infinity/.test(s);
}

interface Spec {
  kind: KindId;
  prompt: string;
  correct: string;
  wrongs: Wrong[];
  hints: [string, string];
  explanation: string;
  data: Record<string, number | string>;
  dir?: Dir;
  model?: Model;
  step?: number;
  /** Override the kind's skill tag (combo steps keep their own tag). */
  tag?: number;
  twoStep?: boolean;
}

function make(rng: Rng, s: Spec): U3Question {
  const meta = KIND_META[s.kind];
  const seen = new Set([s.correct.toLowerCase()]);
  const chosen: Wrong[] = [];
  const consider = (list: Wrong[]) => {
    for (const w of list) {
      if (chosen.length >= 3) return;
      const key = w.t.toLowerCase();
      if (!w.t.trim() || seen.has(key) || hasNegative(w.t)) continue;
      seen.add(key);
      chosen.push(w);
    }
  };
  consider(s.wrongs);
  if (chosen.length < 3) consider(filler(s.correct));
  if (chosen.length < 3) throw new Error(`${s.kind}: not enough wrong choices for "${s.correct}"`);
  const opts = [{ t: s.correct, why: "" }, ...chosen];
  for (let i = opts.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [opts[i], opts[j]] = [opts[j], opts[i]];
  }
  const answer = opts.findIndex((o) => o.why === "" && o.t === s.correct);
  const tag = s.tag ?? meta.tag;
  return {
    id: `u3-${s.kind}-${++serial}`,
    subject: "math",
    grade: "6",
    standard: STANDARD[tag],
    skill: tagName(tag),
    prompt: s.prompt,
    choices: opts.map((o) => o.t) as [string, string, string, string],
    answer,
    explanation: s.explanation,
    section: meta.section,
    tag,
    kind: s.kind,
    hints: s.hints,
    feedback: opts.map((o) => o.why),
    twoStep: s.twoStep ?? meta.twoStep,
    data: s.data,
    ...(s.dir ? { dir: s.dir } : {}),
    ...(s.model ? { model: s.model } : {}),
    ...(s.step ? { step: s.step } : {}),
  };
}

/* ------------------------------------------------------------------ people and things */

/** Original names only (no textbook names). */
export const NAMES = ["Maya", "Theo", "Priya", "Jonah", "Rosa", "Kenji", "Amara", "Leo", "Zoe", "Omar", "Ivy", "Mateo", "Nia", "Ezra", "Lucia", "Dev", "Hana", "Felix", "Tariq", "Wren"];

function two(rng: Rng): [string, string] {
  const a = pick(rng, NAMES);
  let b = pick(rng, NAMES);
  while (b === a) b = pick(rng, NAMES);
  return [a, b];
}

const plural = (n: number, one: string, many: string) => (n === 1 ? one : many);

/* ================================================================== Section A · estimating with rates */

function washTime(rng: Rng): U3Question {
  const w = pick(rng, [2, 3, 4, 5, 6]);
  const m = pick(rng, [5, 10, 15, 20]);
  const g = pick(rng, [400, 600, 800, 1000, 1200, 1500, 2000, 2500, 3000, 4000, 5000, 8000]);
  const N = w * g;
  const ans = g * m;
  return make(rng, {
    kind: "washTime",
    prompt: `A window washer cleans ${w} windows every ${m} minutes. About how many minutes would it take to clean all ${fmtNum(N)} windows of a giant tower?`,
    correct: `${fmtNum(ans)} min`,
    wrongs: [
      { t: `${fmtNum(g)} min`, why: `That's how many groups of ${w} windows there are (${fmtNum(N)} ÷ ${w}) — you stopped after step one. Each group takes ${m} minutes.` },
      { t: `${fmtNum(N * m)} min`, why: `That's ${m} minutes for EVERY window. It's ${m} minutes for every ${w} windows, so divide by ${w} too.` },
      { t: `${fmtNum((N * w) / m)} min`, why: `The division is flipped. Find the groups first: ${fmtNum(N)} ÷ ${w}, then multiply by ${m}.` },
      { t: `${fmtNum(ans / 10)} min`, why: "A zero went missing — check the place value." },
    ],
    hints: [`How many groups of ${w} windows are in ${fmtNum(N)} windows?`, `${fmtNum(N)} ÷ ${w} = ${fmtNum(g)} groups. Each group takes ${m} minutes, so multiply ${fmtNum(g)} × ${m}.`],
    explanation: `${fmtNum(N)} ÷ ${w} = ${fmtNum(g)} groups, and ${fmtNum(g)} × ${m} min = ${fmtNum(ans)} minutes (about ${fmtNum(Math.round(ans / 60))} hours!).`,
    data: { w, m, N },
    model: { type: "table", head: ["Windows", "Minutes"], rows: [[`${w}`, `${m}`], [`${w * 10}`, `${m * 10}`], [fmtNum(N), "?"]] },
  });
}

function washHours(rng: Rng): U3Question {
  const w = pick(rng, [2, 3, 4, 5]);
  const m = pick(rng, [5, 10, 15, 20, 30]);
  const H = pick(rng, [20, 25, 30, 40, 50, 60, 75, 80, 100, 120, 150, 200]);
  const N = ((H * 60) / m) * w;
  const minutes = H * 60;
  return make(rng, {
    kind: "washHours",
    prompt: `A robot window cleaner does ${w} windows every ${m} minutes. A skyscraper has ${fmtNum(N)} windows. About how many HOURS will the robot need?`,
    correct: `${fmtNum(H)} hours`,
    wrongs: [
      { t: `${fmtNum(minutes)} hours`, why: `${fmtNum(minutes)} is the number of MINUTES. There are 60 minutes in an hour, so divide by 60.` },
      { t: `${fmtNum(N / w)} hours`, why: `That's the number of groups of ${w} windows — you stopped after step one. Each group takes ${m} minutes.` },
      { t: `${fmtNum(minutes / 10)} hours`, why: "An hour is 60 minutes, not 10. Divide the minutes by 60." },
      { t: `${fmtNum((N * m) / 60)} hours`, why: `That counts ${m} minutes for every single window. It's ${m} minutes for every ${w} windows.` },
    ],
    hints: [`First find the minutes: how many groups of ${w} windows, and how long is each group?`, `${fmtNum(N)} ÷ ${w} × ${m} = ${fmtNum(minutes)} minutes. Now change minutes to hours.`],
    explanation: `${fmtNum(N)} ÷ ${w} = ${fmtNum(N / w)} groups × ${m} min = ${fmtNum(minutes)} minutes, and ${fmtNum(minutes)} ÷ 60 = ${fmtNum(H)} hours.`,
    data: { w, m, N },
    model: { type: "table", head: ["Windows", "Minutes"], rows: [[`${w}`, `${m}`], [fmtNum(N), "?"]] },
  });
}

function towerHeight(rng: Rng): U3Question {
  const F = pick(rng, [100, 120, 150, 160, 180, 200]);
  const h = pick(rng, [3, 3.5, 4, 4.5, 5]);
  const ans = F * h;
  return make(rng, {
    kind: "towerHeight",
    prompt: `A super-tall tower has ${F} floors. Each floor is about ${fmtNum(h)} meters tall. About how tall is the whole tower?`,
    correct: `${fmtNum(ans)} m`,
    wrongs: [
      { t: `${fmtNum(F / h)} m`, why: "You divided. More floors means MORE height, so multiply floors × meters per floor." },
      { t: `${fmtNum(F + h)} m`, why: `Adding ${fmtNum(h)} only counts one floor's height. Every one of the ${F} floors is ${fmtNum(h)} m tall.` },
      { t: `${fmtNum(ans * 10)} m`, why: "Check the place value — that's 10 times too tall." },
      { t: `${fmtNum(ans / 10)} m`, why: "Check the place value — that's 10 times too short." },
    ],
    hints: ["You know the height of ONE floor. How do you get the height of all the floors?", `Each floor adds ${fmtNum(h)} m, and there are ${F} floors: ${F} × ${fmtNum(h)}.`],
    explanation: `${F} floors × ${fmtNum(h)} m per floor = ${fmtNum(ans)} m. (The Burj Khalifa is about 830 m!)`,
    data: { F, h },
    model: { type: "table", head: ["Floors", "Meters"], rows: [["1", fmtNum(h)], ["10", fmtNum(h * 10)], [`${F}`, "?"]] },
  });
}

function elevator(rng: Rng): U3Question {
  const r = pick(rng, [4, 5, 8, 10, 16, 20, 25]);
  const ans = 800 / r;
  return make(rng, {
    kind: "elevator",
    prompt: `The Burj Khalifa is about 830 m tall — call it 800 m to estimate. An elevator rises ${r} m every second. About how many seconds does a ride to the top take?`,
    correct: `${fmtNum(ans)} seconds`,
    wrongs: [
      { t: `${fmtNum(800 * r)} seconds`, why: `You multiplied. Each second covers ${r} m, so ask how many ${r}s fit in 800: divide.` },
      { t: `${fmtNum(8000 / r)} seconds`, why: "An extra zero snuck in — the height is 800 m, not 8,000." },
      { t: `${fmtNum(800 - r)} seconds`, why: `Subtracting doesn't tell how many ${r}-meter jumps fit in 800 m. Divide 800 ÷ ${r}.` },
      { t: `${fmtNum(80 / r)} seconds`, why: "A zero went missing — the height is 800 m, not 80." },
    ],
    hints: [`How many ${r}-meter jumps does it take to go 800 m?`, `Seconds = meters ÷ meters per second = 800 ÷ ${r}.`],
    explanation: `800 m ÷ ${r} m per second = ${fmtNum(ans)} seconds (a bit more for the real 830 m).`,
    data: { r },
    model: { type: "table", head: ["Seconds", "Meters"], rows: [["1", `${r}`], ["10", `${r * 10}`], ["?", "800"]] },
  });
}

function crewCost(rng: Rng): U3Question {
  const c = pick(rng, [5, 6, 8, 12, 15, 20]);
  const k = pick(rng, [4, 5, 10, 20]);
  const g = pick(rng, [50, 80, 100, 120, 150, 200, 250, 300, 400, 500]);
  const N = k * g;
  const ans = g * c * 100;
  return make(rng, {
    kind: "crewCost",
    prompt: `A cleaning crew charges ${money(c * 100)} for every ${k} windows. About how much to clean ${fmtNum(N)} windows?`,
    correct: money(ans),
    wrongs: [
      { t: money(g * 100), why: `That's the number of groups of ${k} windows — you stopped after step one. Each group costs ${money(c * 100)}.` },
      { t: money(N * c * 100), why: `That charges ${money(c * 100)} for EVERY window. It's ${money(c * 100)} for every ${k} windows.` },
      { t: money(ans / 10), why: "A zero went missing — check the place value." },
      { t: money(ans * 10), why: "An extra zero — check the place value." },
    ],
    hints: [`How many groups of ${k} windows are in ${fmtNum(N)}?`, `${fmtNum(N)} ÷ ${k} = ${fmtNum(g)} groups. Each group costs ${money(c * 100)}.`],
    explanation: `${fmtNum(N)} ÷ ${k} = ${fmtNum(g)} groups × ${money(c * 100)} = ${money(ans)}.`,
    data: { c, k, N },
    model: { type: "table", head: ["Windows", "Cost"], rows: [[`${k}`, money(c * 100)], [fmtNum(N), "?"]] },
  });
}

function stairs(rng: Rng): U3Question {
  const s = pick(rng, [15, 16, 20, 25]);
  const Hs = s === 16 ? [60, 120, 300, 600] : [30, 60, 90, 120, 150, 300, 450, 600];
  const H = pick(rng, Hs);
  const ans = (H * 100) / s;
  return make(rng, {
    kind: "stairs",
    prompt: `Each stair step in a tall tower is about ${s} cm high. About how many steps do you climb to reach a deck ${H} m up? (1 m = 100 cm)`,
    correct: `${fmtNum(ans)} steps`,
    wrongs: [
      { t: `${fmtNum(H / s)} steps`, why: `The units don't match. Change ${H} m to centimeters first (× 100), then divide by ${s}.` },
      { t: `${fmtNum(H * 100)} steps`, why: `That's the height in centimeters — you stopped after step one. Now divide by ${s} cm per step.` },
      { t: `${fmtNum(H * s)} steps`, why: "Multiplying makes it bigger the wrong way. How many steps of that size fit in the height? Divide." },
      { t: `${fmtNum((H * 10) / s)} steps`, why: "1 m = 100 cm, not 10 cm." },
    ],
    hints: ["The step is in centimeters but the height is in meters. Make the units match first.", `${H} m = ${fmtNum(H * 100)} cm. Now how many ${s} cm steps fit in that?`],
    explanation: `${H} m = ${fmtNum(H * 100)} cm, and ${fmtNum(H * 100)} ÷ ${s} = ${fmtNum(ans)} steps.`,
    data: { s, H },
  });
}

/* ================================================================== Section B · units and conversions */

interface Anchor {
  q: string;
  a: string;
  w: [string, string][];
  hint: string;
}

const ANCHORS: Anchor[] = [
  { q: "About how wide is your thumb?", a: "1 inch", w: [["1 foot", "A foot is about the length of a ruler — way more than a thumb."], ["1 yard", "A yard is about one big step — way too big."], ["1 mile", "A mile is a 20-minute walk!"]], hint: "A ruler is 1 foot long. Your thumb is MUCH smaller than a ruler." },
  { q: "About how wide is a classroom door?", a: "1 meter", w: [["1 centimeter", "A centimeter is about the width of a fingernail — far too small."], ["1 kilometer", "A kilometer is about 10 soccer fields long!"], ["1 inch", "An inch is a thumb width — far too small."]], hint: "A door is about as wide as one big step. Which unit is about one big step?" },
  { q: "About how heavy is a 1-liter bottle of water?", a: "1 kilogram", w: [["1 gram", "A gram is about a paper clip — much lighter."], ["1 ounce", "An ounce is about a slice of bread — much lighter."], ["100 pounds", "100 pounds is as heavy as a big dog!"]], hint: "A paper clip is about 1 gram. A liter of water is about as heavy as a big hardcover book." },
  { q: "About how much does the big jug of milk at the store hold?", a: "1 gallon", w: [["1 cup", "A cup fits in one glass — the big jug holds 16 cups."], ["1 fluid ounce", "A fluid ounce is two spoonfuls."], ["1 pint", "A pint is a small carton — the big jug holds 8 of them."]], hint: "1 cup fills one glass. The big jug fills about 16 glasses. Which unit holds 16 cups?" },
  { q: "About how long is a school bus?", a: "12 meters", w: [["12 centimeters", "12 cm is about the length of a pencil."], ["12 kilometers", "12 km would take a few hours to walk!"], ["12 inches", "12 inches is one foot — a ruler."]], hint: "One big step is about the length of the unit you need. A bus is about 12 big steps long." },
  { q: "About how heavy is a paper clip?", a: "1 gram", w: [["1 kilogram", "A kilogram is like a liter of water — way heavier."], ["1 pound", "A pound is like a loaf of bread."], ["10 pounds", "10 pounds is like a bowling ball."]], hint: "A liter of water is about a kilogram. A paper clip is much, much lighter." },
  { q: "About how far can you walk in 20 minutes?", a: "1 mile", w: [["1 foot", "One foot is a single shoe length."], ["1 yard", "A yard is one big step."], ["100 miles", "100 miles takes hours in a car!"]], hint: "Walking speed is about 3 miles per hour, and 20 minutes is ⅓ of an hour." },
  { q: "Which unit fits the length of a pencil?", a: "centimeters", w: [["kilometers", "A kilometer is about 10 soccer fields long — way too big."], ["miles", "A mile is a 20-minute walk — way too big."], ["liters", "Liters measure how much a container holds, not length."]], hint: "Pick a small unit of length." },
  { q: "Which unit fits the distance to the next town?", a: "kilometers", w: [["centimeters", "Centimeters are tiny — you'd need millions of them."], ["inches", "Inches are thumb-sized — you'd need hundreds of thousands."], ["pounds", "Pounds measure weight, not distance."]], hint: "Pick a big unit of length." },
  { q: "Which unit fits the weight of a large dog?", a: "pounds", w: [["ounces", "An ounce is a slice of bread — you'd need about a thousand."], ["grams", "A gram is a paper clip — way too small."], ["quarts", "Quarts measure liquid volume, not weight."]], hint: "Pick a unit of weight that fits something you could (barely) lift." },
  { q: "Which unit fits the water in a bathtub?", a: "gallons", w: [["fluid ounces", "A fluid ounce is two spoonfuls — you'd need thousands."], ["cups", "A cup is one glass — you'd need hundreds."], ["inches", "Inches measure length, not how much water."]], hint: "Pick a big unit of liquid volume." },
];

function unitAnchor(rng: Rng): U3Question {
  const i = ri(rng, 0, ANCHORS.length - 1);
  const a = ANCHORS[i];
  return make(rng, {
    kind: "unitAnchor",
    prompt: a.q,
    correct: a.a,
    wrongs: a.w.map(([t, why]) => ({ t, why })),
    hints: ["Picture one of each unit. Which size makes sense?", a.hint],
    explanation: `${a.q.replace(/\?$/, "")}: ${a.a}.`,
    data: { item: i },
  });
}

/** [small unit, big unit, small per big, something measured]. */
export const UNIT_PAIRS: [string, string, number, string][] = [
  ["inches", "feet", 12, "a rug"],
  ["feet", "yards", 3, "a hallway"],
  ["centimeters", "meters", 100, "a garden"],
  ["ounces", "pounds", 16, "a pumpkin"],
  ["cups", "pints", 2, "a pot of soup"],
  ["quarts", "gallons", 4, "a fish tank"],
  ["grams", "kilograms", 1000, "a bag of rice"],
  ["meters", "kilometers", 1000, "a hiking trail"],
];

function biggerNumber(rng: Rng): U3Question {
  const i = ri(rng, 0, UNIT_PAIRS.length - 1);
  const [small, big, f, thing] = UNIT_PAIRS[i];
  const [name] = two(rng);
  return make(rng, {
    kind: "biggerNumber",
    prompt: `${name} measures ${thing} in ${small} and again in ${big}. Which number will be bigger?`,
    correct: `The number of ${small}`,
    wrongs: [
      { t: `The number of ${big}`, why: `${big[0].toUpperCase()}${big.slice(1)} are the BIGGER unit, so you need fewer of them. Smaller unit → bigger number.` },
      { t: "Both numbers are the same", why: `The amount is the same, but 1 ${big.replace(/s$/, "").replace("feet", "foot")} = ${fmtNum(f)} ${small}, so the numbers differ.` },
      { t: "It depends on the size of it", why: `It doesn't depend: it always takes more ${small} than ${big}, because ${small} are smaller.` },
    ],
    hints: ["Which unit is smaller? Do you need more or fewer of a small unit?", `1 of the big unit = ${fmtNum(f)} ${small}. So the count of ${small} is ${fmtNum(f)} times as big.`],
    explanation: `${small[0].toUpperCase()}${small.slice(1)} are smaller than ${big}, so it takes more of them: the number of ${small} is ${fmtNum(f)} times the number of ${big}.`,
    data: { pair: i },
  });
}

const MORE_FEWER: [string, string, string, string, number][] = [
  ["yards", "yd", "feet", "ft", 3],
  ["feet", "ft", "inches", "in", 12],
  ["meters", "m", "centimeters", "cm", 100],
  ["pounds", "lb", "ounces", "oz", 16],
  ["gallons", "gal", "quarts", "qt", 4],
];

function moreOrFewer(rng: Rng): U3Question {
  const i = ri(rng, 0, MORE_FEWER.length - 1);
  const [big, bigA, small, smallA, f] = MORE_FEWER[i];
  const n = pick(rng, [2, 3, 4, 5, 6, 9]);
  const thing = pick(rng, ["table", "banner", "board", "rope"]);
  return make(rng, {
    kind: "moreOrFewer",
    prompt: `A ${thing} measures ${n} ${big}. Measured in ${small}, is the number more or fewer than ${n}? How many ${small}?`,
    correct: `More: ${fmtNum(n * f)} ${smallA}`,
    wrongs: [
      { t: `Fewer: ${fmtNum(n / f)} ${smallA}`, why: `${small[0].toUpperCase()}${small.slice(1)} are SMALLER than ${big}, so you need MORE of them: multiply by ${f}.` },
      { t: `The same: ${n} ${smallA}`, why: `Changing units changes the number: 1 ${bigA} = ${f} ${smallA}.` },
      { t: `More: ${fmtNum(n + f)} ${smallA}`, why: `Adding ${f} doesn't convert. Each ${bigA} is ${f} ${smallA}, so multiply.` },
      { t: `Fewer: ${fmtNum(n * f)} ${bigA}`, why: `The number of ${small} is bigger, not fewer — the unit is smaller.` },
    ],
    hints: [`Is a ${small.replace(/s$/, "").replace("feet", "foot").replace("inche", "inch")} bigger or smaller than a ${big.replace(/s$/, "").replace("feet", "foot")}?`, `1 ${bigA} = ${f} ${smallA}, so ${n} ${bigA} = ${n} × ${f}.`],
    explanation: `Smaller unit → bigger number: ${n} ${bigA} × ${f} = ${fmtNum(n * f)} ${smallA}, which is more than ${n}.`,
    data: { pair: i, n },
  });
}

/** Conversion facts from the doc (US + metric, as the book uses them). */
export interface Fact {
  big: string;
  small: string;
  f: number;
  approx: boolean;
  vals: number[];
  /** A tempting wrong factor. */
  wrongF: number;
}

const unit = (u: string, v: number) => (u === "cups" && v === 1 ? "cup" : u);

export const FACTS: Fact[] = [
  { big: "ft", small: "in", f: 12, approx: false, vals: [2, 3, 4, 5, 6, 7.5, 8, 10, 2.5, 1.5], wrongF: 10 },
  { big: "yd", small: "ft", f: 3, approx: false, vals: [2, 3, 4, 5, 7, 10, 12, 1.5, 2.5], wrongF: 12 },
  { big: "mi", small: "ft", f: 5280, approx: false, vals: [2, 3, 0.5, 1.5, 0.25], wrongF: 1000 },
  { big: "in", small: "cm", f: 2.54, approx: false, vals: [2, 4, 5, 10, 12, 20], wrongF: 2.5 },
  { big: "m", small: "cm", f: 100, approx: false, vals: [2, 3.5, 4.25, 6, 1.5, 12, 0.75], wrongF: 10 },
  { big: "km", small: "m", f: 1000, approx: false, vals: [2, 3.5, 5, 0.8, 1.25, 12], wrongF: 100 },
  { big: "lb", small: "oz", f: 16, approx: false, vals: [2, 3, 5, 1.5, 2.5, 0.75, 4], wrongF: 12 },
  { big: "kg", small: "lb", f: 2.2, approx: true, vals: [5, 10, 12, 15, 20, 25, 30], wrongF: 2 },
  { big: "kg", small: "g", f: 1000, approx: false, vals: [2, 3.5, 0.5, 1.25, 4, 0.25], wrongF: 100 },
  { big: "gal", small: "qt", f: 4, approx: false, vals: [2, 3, 5, 1.5, 2.5, 6], wrongF: 2 },
  { big: "qt", small: "pt", f: 2, approx: false, vals: [3, 4, 5, 7, 1.5, 10], wrongF: 4 },
  { big: "pt", small: "cups", f: 2, approx: false, vals: [3, 4, 5, 6, 2.5, 8], wrongF: 4 },
  { big: "cups", small: "fl oz", f: 8, approx: false, vals: [2, 3, 4, 1.5, 2.5, 0.5], wrongF: 16 },
  { big: "L", small: "qt", f: 1.06, approx: true, vals: [2, 3, 4, 5, 10], wrongF: 1.6 },
];

const factText = (F: Fact) => `1 ${unit(F.big, 1)} ${F.approx ? "≈" : "="} ${fmtNum(F.f)} ${unit(F.small, F.f)}`;

function convert(rng: Rng, dir: Dir): U3Question {
  const fi = ri(rng, 0, FACTS.length - 1);
  const F = FACTS[fi];
  const eq = F.approx ? "≈" : "=";
  const v = pick(rng, F.vals);
  if (dir === "toSmaller") {
    const ans = v * F.f;
    const u = (x: number) => `${fmtNum(x)} ${unit(F.small, x)}`;
    return make(rng, {
      kind: "convert",
      prompt: `Convert: ${fmtNum(v)} ${unit(F.big, v)} ${eq} ? ${F.small}   (${factText(F)})`,
      correct: u(ans),
      wrongs: [
        { t: u(v / F.f), why: `You divided. Going to a SMALLER unit, you need MORE of them, so the number gets bigger: multiply by ${fmtNum(F.f)}.` },
        { t: u(v * F.wrongF), why: `${factText(F)}, not ${fmtNum(F.wrongF)}.` },
        { t: u(ans * 10), why: "Check the decimal point — that's 10 times too big." },
        { t: u(v + F.f), why: `Adding ${fmtNum(F.f)} doesn't convert. Each ${unit(F.big, 1)} is ${fmtNum(F.f)} ${unit(F.small, F.f)}, so multiply.` },
      ],
      hints: [`Is ${unit(F.small, 2)} a smaller or a bigger unit than ${unit(F.big, 2)}? So will the number get bigger or smaller?`, `Each ${unit(F.big, 1)} is ${fmtNum(F.f)} ${unit(F.small, F.f)}, so you need ${fmtNum(v)} groups of ${fmtNum(F.f)}: multiply.`],
      explanation: `Smaller unit → bigger number: ${fmtNum(v)} × ${fmtNum(F.f)} = ${fmtNum(ans)} ${unit(F.small, ans)}.`,
      data: { fact: fi, v },
      dir,
      model: { type: "table", head: [F.big, F.small], rows: [["1", fmtNum(F.f)], [fmtNum(v), "?"]] },
    });
  }
  const s = v * F.f;
  const u = (x: number) => `${fmtNum(x)} ${unit(F.big, x)}`;
  return make(rng, {
    kind: "convert",
    prompt: `Convert: ${fmtNum(s)} ${unit(F.small, s)} ${eq} ? ${F.big}   (${factText(F)})`,
    correct: u(v),
    wrongs: [
      { t: u(s * F.f), why: `You multiplied. Going to a BIGGER unit, you need FEWER of them, so the number gets smaller: divide by ${fmtNum(F.f)}.` },
      { t: u(s / F.wrongF), why: `${factText(F)}, not ${fmtNum(F.wrongF)}.` },
      { t: u(v * 10), why: "Check the decimal point — that's 10 times too big." },
      { t: u(v / 10), why: "Check the decimal point — that's 10 times too small." },
    ],
    hints: [`Is ${unit(F.big, 2)} a bigger or a smaller unit than ${unit(F.small, 2)}? So will the number get bigger or smaller?`, `How many groups of ${fmtNum(F.f)} ${unit(F.small, F.f)} fit in ${fmtNum(s)} ${unit(F.small, s)}? That's ${fmtNum(s)} ÷ ${fmtNum(F.f)}.`],
    explanation: `Bigger unit → smaller number: ${fmtNum(s)} ÷ ${fmtNum(F.f)} = ${fmtNum(v)} ${unit(F.big, v)}.`,
    data: { fact: fi, s },
    dir,
    model: { type: "table", head: [F.big, F.small], rows: [["1", fmtNum(F.f)], ["?", fmtNum(s)]] },
  });
}

/** Two-step chains: big → middle → small. */
export const CHAINS: { big: string; mid: string; small: string; f1: number; f2: number; vals: number[] }[] = [
  { big: "gal", mid: "qt", small: "pt", f1: 4, f2: 2, vals: [2, 3, 5, 1.5, 2.5, 6] },
  { big: "gal", mid: "qt", small: "cups", f1: 4, f2: 4, vals: [2, 3, 1.5, 0.5, 5] },
  { big: "yd", mid: "ft", small: "in", f1: 3, f2: 12, vals: [2, 3, 4, 5, 10, 0.5] },
  { big: "qt", mid: "pt", small: "cups", f1: 2, f2: 2, vals: [3, 4, 5, 7, 1.5, 10] },
  { big: "km", mid: "m", small: "cm", f1: 1000, f2: 100, vals: [2, 3, 0.5, 1.5, 0.25] },
];

function convert2(rng: Rng, dir: Dir): U3Question {
  const ci = ri(rng, 0, CHAINS.length - 1);
  const C = CHAINS[ci];
  const v = pick(rng, C.vals);
  const s = v * C.f1 * C.f2;
  const facts = `1 ${C.big} = ${C.f1} ${C.mid}, 1 ${C.mid} = ${C.f2} ${unit(C.small, C.f2)}`;
  if (dir === "toSmaller") {
    const u = (x: number) => `${fmtNum(x)} ${unit(C.small, x)}`;
    return make(rng, {
      kind: "convert2",
      prompt: `Convert: ${fmtNum(v)} ${C.big} = ? ${C.small}   (${facts})`,
      correct: u(s),
      wrongs: [
        { t: u(v * C.f1), why: `${fmtNum(v * C.f1)} is the number of ${C.mid} — you stopped after step one. Now change ${C.mid} to ${C.small}.` },
        { t: u(v * (C.f1 + C.f2)), why: `Don't add the facts. Multiply by ${C.f1}, then multiply that by ${C.f2}.` },
        { t: u(v / (C.f1 * C.f2)), why: "You divided. Smaller unit → bigger number, so multiply." },
        { t: u(s * 10), why: "Check the place value — that's 10 times too big." },
      ],
      hints: [`Go one step at a time: ${C.big} → ${C.mid} → ${C.small}.`, `${fmtNum(v)} ${C.big} × ${C.f1} = ${fmtNum(v * C.f1)} ${C.mid}. Now change those ${C.mid} to ${C.small}.`],
      explanation: `${fmtNum(v)} × ${C.f1} = ${fmtNum(v * C.f1)} ${C.mid}, and ${fmtNum(v * C.f1)} × ${C.f2} = ${fmtNum(s)} ${unit(C.small, s)}.`,
      data: { chain: ci, v },
      dir,
    });
  }
  const u = (x: number) => `${fmtNum(x)} ${C.big}`;
  return make(rng, {
    kind: "convert2",
    prompt: `Convert: ${fmtNum(s)} ${unit(C.small, s)} = ? ${C.big}   (${facts})`,
    correct: u(v),
    wrongs: [
      { t: u(s / C.f2), why: `${fmtNum(s / C.f2)} is the number of ${C.mid} — you stopped after step one. Now change ${C.mid} to ${C.big}.` },
      { t: u(s * C.f1 * C.f2), why: "You multiplied. Bigger unit → smaller number, so divide." },
      { t: u(s / (C.f1 + C.f2)), why: `Don't add the facts. Divide by ${C.f2}, then divide that by ${C.f1}.` },
      { t: u(v * 10), why: "Check the place value — that's 10 times too big." },
    ],
    hints: [`Go one step at a time: ${C.small} → ${C.mid} → ${C.big}.`, `${fmtNum(s)} ${unit(C.small, s)} ÷ ${C.f2} = ${fmtNum(s / C.f2)} ${C.mid}. Now change those ${C.mid} to ${C.big}.`],
    explanation: `${fmtNum(s)} ÷ ${C.f2} = ${fmtNum(s / C.f2)} ${C.mid}, and ${fmtNum(s / C.f2)} ÷ ${C.f1} = ${fmtNum(v)} ${C.big}.`,
    data: { chain: ci, s },
    dir,
  });
}

/** Fraction conversions: [big, small, factor, fractions [num, den] with num*f/den whole]. */
export const FRAC_FACTS: { big: string; small: string; f: number; fr: [number, number][] }[] = [
  { big: "ft", small: "in", f: 12, fr: [[2, 3], [1, 4], [1, 3], [1, 2], [3, 2], [3, 4]] },
  { big: "gal", small: "qt", f: 4, fr: [[1, 2], [1, 4], [3, 2], [5, 2], [3, 4]] },
  { big: "lb", small: "oz", f: 16, fr: [[1, 2], [1, 4], [3, 4], [3, 2]] },
  { big: "yd", small: "ft", f: 3, fr: [[2, 3], [1, 3], [5, 3]] },
  { big: "cups", small: "fl oz", f: 8, fr: [[1, 2], [1, 4], [3, 2], [3, 4]] },
];

function convertFrac(rng: Rng, dir: Dir): U3Question {
  const fi = ri(rng, 0, FRAC_FACTS.length - 1);
  const F = FRAC_FACTS[fi];
  const [num, den] = pick(rng, F.fr);
  const s = (num * F.f) / den;
  const fr = fracText(num, den);
  const big1 = unit(F.big, 1);
  if (dir === "toSmaller") {
    const u = (x: string, n: number) => `${x} ${unit(F.small, n)}`;
    return make(rng, {
      kind: "convertFrac",
      prompt: `How many ${F.small} are in ${fr} ${F.big === "cups" ? (num < den ? "cup" : "cups") : F.big}?   (1 ${big1} = ${F.f} ${F.small})`,
      correct: u(fmtNum(s), s),
      wrongs: [
        { t: u(niceRate(F.f * den, num), 2), why: `You divided ${F.f} by ${fr}. Taking ${fr} of a ${big1} means multiplying: ${F.f} × ${fr}.` },
        { t: u(fmtNum(F.f * num), 2), why: `You multiplied by the top number only. ${fr} means × ${num} AND ÷ ${den}.` },
        { t: u(niceRate(F.f, den), 2), why: `That's 1/${den} of a ${big1}. You need ${fr}.` },
        { t: u(niceRate(F.f * den + num, den), 2), why: `Adding ${fr} doesn't convert. Multiply ${F.f} × ${fr}.` },
      ],
      hints: [`1 ${big1} is ${F.f} ${F.small}. What is ${fr} of ${F.f}?`, `Split ${F.f} into ${den} equal parts: each is ${fmtNum(F.f / den)}. Now take ${num} of those parts.`],
      explanation: `1 ${big1} = ${F.f} ${F.small}, so ${fr} ${F.big} = ${fr} × ${F.f} = ${fmtNum(s)} ${unit(F.small, s)}.`,
      data: { fact: fi, num, den },
      dir,
      model: { type: "table", head: [F.big, F.small], rows: [["1", `${F.f}`], [fr, "?"]] },
    });
  }
  const u = (x: string) => `${x} ${F.big}`;
  return make(rng, {
    kind: "convertFrac",
    prompt: `${fmtNum(s)} ${unit(F.small, s)} is how many ${F.big}?   (1 ${big1} = ${F.f} ${F.small})`,
    correct: u(fr),
    wrongs: [
      { t: u(fmtNum(s * F.f)), why: `You multiplied. ${F.big} are the BIGGER unit, so the number gets smaller: divide by ${F.f}.` },
      { t: u(niceRate(F.f, s)), why: `That's ${F.f} ÷ ${fmtNum(s)} — flipped. Divide ${fmtNum(s)} by ${F.f}.` },
      { t: u(niceRate(s, F.f * 2)), why: `Check the fact: 1 ${big1} = ${F.f} ${F.small}. Divide by ${F.f}, not ${F.f * 2}.` },
      { t: u(fmtNum(s)), why: "Changing units changes the number. Divide by the conversion fact." },
    ],
    hints: [`How many ${F.small} make 1 ${big1}? What part of that is ${fmtNum(s)}?`, `${fmtNum(s)} out of ${F.f} is the fraction ${fmtNum(s)}/${F.f}. Simplify it.`],
    explanation: `${fmtNum(s)} ÷ ${F.f} = ${fmtNum(s)}/${F.f} = ${fr} ${F.big}.`,
    data: { fact: fi, num, den },
    dir,
    model: { type: "table", head: [F.big, F.small], rows: [["1", `${F.f}`], ["?", fmtNum(s)]] },
  });
}

/** Price per one unit, amount in another unit. [thing, big, small, f, small-unit prices in cents, amounts]. */
export const COST_ITEMS: { thing: string; big: string; small: string; f: number; bigNames: [string, string]; smallNames: [string, string] }[] = [
  { thing: "Ribbon", big: "yd", small: "ft", f: 3, bigNames: ["yard", "yards"], smallNames: ["foot", "feet"] },
  { thing: "Wood trim", big: "ft", small: "in", f: 12, bigNames: ["foot", "feet"], smallNames: ["inch", "inches"] },
  { thing: "Juice", big: "gal", small: "qt", f: 4, bigNames: ["gallon", "gallons"], smallNames: ["quart", "quarts"] },
  { thing: "Cheese", big: "lb", small: "oz", f: 16, bigNames: ["pound", "pounds"], smallNames: ["ounce", "ounces"] },
];

function unitCost(rng: Rng, dir: Dir): U3Question {
  const ii = ri(rng, 0, COST_ITEMS.length - 1);
  const I = COST_ITEMS[ii];
  if (dir === "toSmaller") {
    // price per SMALL unit, amount in BIG units: convert big → small (multiply), then × price
    const p = pick(rng, I.f >= 12 ? [10, 15, 20, 25, 30, 35] : [25, 40, 50, 75, 90, 125]);
    const n = pick(rng, [2, 3, 4, 5, 1.5]);
    const smallN = n * I.f;
    const ans = smallN * p;
    return make(rng, {
      kind: "unitCost",
      prompt: `${I.thing} costs ${money(p)} per ${I.smallNames[0]}. How much for ${fmtNum(n)} ${n === 1 ? I.bigNames[0] : I.bigNames[1]}?   (1 ${I.bigNames[0]} = ${I.f} ${I.smallNames[1]})`,
      correct: money(ans),
      wrongs: [
        { t: money(smallN * 100), why: `${fmtNum(smallN)} is the number of ${I.smallNames[1]} — you stopped after step one. Now multiply by the price.` },
        { t: money(n * p), why: `That prices ${fmtNum(n)} ${I.smallNames[1]}, not ${fmtNum(n)} ${I.bigNames[1]}. Change ${I.bigNames[1]} to ${I.smallNames[1]} first.` },
        { t: money((n / I.f) * p), why: `You converted the wrong way. ${I.smallNames[1]} are smaller, so there are MORE of them: × ${I.f}.` },
        { t: money(ans * 10), why: "Check the decimal point — that's 10 times too much." },
      ],
      hints: [`The price is per ${I.smallNames[0]}. How many ${I.smallNames[1]} are in ${fmtNum(n)} ${I.bigNames[1]}?`, `${fmtNum(n)} × ${I.f} = ${fmtNum(smallN)} ${I.smallNames[1]}. Now find the cost of that many.`],
      explanation: `${fmtNum(n)} ${I.bigNames[1]} = ${fmtNum(smallN)} ${I.smallNames[1]}, and ${fmtNum(smallN)} × ${money(p)} = ${money(ans)}.`,
      data: { item: ii, p, n },
      dir,
    });
  }
  // price per BIG unit, amount in SMALL units: convert small → big (divide), then × price
  const pBig = pick(rng, [180, 240, 300, 360, 480, 600, 640, 720, 960]);
  const k = pick(rng, [1, 2, 3, 4, 5, 6]);
  const smallN = (k * I.f) / pick(rng, I.f % 4 === 0 ? [1, 2, 4] : [1, 3].filter((d) => (k * I.f) % d === 0));
  const bigN = smallN / I.f;
  const ans = Math.round(bigN * pBig);
  return make(rng, {
    kind: "unitCost",
    prompt: `${I.thing} costs ${money(pBig)} per ${I.bigNames[0]}. How much for ${fmtNum(smallN)} ${smallN === 1 ? I.smallNames[0] : I.smallNames[1]}?   (1 ${I.bigNames[0]} = ${I.f} ${I.smallNames[1]})`,
    correct: money(ans),
    wrongs: [
      { t: money(Math.round(bigN * 100)), why: `${fmtNum(bigN)} is the number of ${I.bigNames[1]} — you stopped after step one. Now multiply by the price.` },
      { t: money(smallN * pBig), why: `That prices ${fmtNum(smallN)} ${I.bigNames[1]}! Change ${I.smallNames[1]} to ${I.bigNames[1]} first (÷ ${I.f}).` },
      { t: money(smallN * I.f * pBig), why: `You converted the wrong way. ${I.bigNames[1]} are bigger, so there are FEWER of them: ÷ ${I.f}.` },
      { t: money(ans * 10), why: "Check the decimal point — that's 10 times too much." },
      { t: money(ans / 10), why: "Check the decimal point — that's 10 times too little." },
    ],
    hints: [`The price is per ${I.bigNames[0]}. What part of a ${I.bigNames[0]} is ${fmtNum(smallN)} ${I.smallNames[1]}?`, `${fmtNum(smallN)} ÷ ${I.f} = ${fmtNum(bigN)} ${I.bigNames[1]}. Now find the cost of that many.`],
    explanation: `${fmtNum(smallN)} ${I.smallNames[1]} = ${fmtNum(bigN)} ${I.bigNames[1]}, and ${fmtNum(bigN)} × ${money(pBig)} = ${money(ans)}.`,
    data: { item: ii, p: pBig, s: smallN },
    dir,
  });
}

/* ================================================================== Section C · rates */

const SPEEDS = [8, 9, 10, 12, 12.5, 15, 16, 18, 20];
const HOURS = [2, 3, 4, 1.5, 2.5];

function whoFaster(rng: Rng): U3Question {
  const [A, B] = two(rng);
  const tie = rng() < 0.25;
  let s1 = 0, s2 = 0, t1 = 0, t2 = 0;
  for (let k = 0; k < 200; k++) {
    s1 = pick(rng, SPEEDS);
    s2 = tie ? s1 : pick(rng, SPEEDS);
    t1 = pick(rng, HOURS);
    t2 = pick(rng, HOURS);
    if (t1 === t2 || (!tie && s1 === s2)) continue;
    const d1 = s1 * t1, d2 = s2 * t2;
    if (d1 === d2) continue;
    // Usually make the one who went farther the slower one (the classic trap).
    if (!tie && rng() < 0.65 && (d1 > d2) === (s1 > s2)) continue;
    break;
  }
  const d1 = s1 * t1, d2 = s2 * t2;
  const correct = s1 === s2 ? "They're the same speed" : s1 > s2 ? A : B;
  const farther = d1 > d2 ? A : B;
  const rates = `${A}: ${fmtNum(d1)} ÷ ${fmtNum(t1)} = ${fmtNum(s1)} mph; ${B}: ${fmtNum(d2)} ÷ ${fmtNum(t2)} = ${fmtNum(s2)} mph`;
  const whyName = (n: string) =>
    n === farther ? `${n} went farther, but also rode longer. Compare miles in ONE hour: ${rates}.` : `Compare miles per hour: ${rates}.`;
  return make(rng, {
    kind: "whoFaster",
    prompt: `${A} biked ${fmtNum(d1)} miles in ${fmtNum(t1)} hours. ${B} biked ${fmtNum(d2)} miles in ${fmtNum(t2)} hours. Who rode faster?`,
    correct,
    wrongs: [
      { t: A, why: whyName(A) },
      { t: B, why: whyName(B) },
      { t: "They're the same speed", why: `Find each speed: ${rates}. They're not the same.` },
      { t: "Can't tell without more facts", why: "You can tell! Divide miles by hours for each rider and compare." },
    ],
    hints: ["Find how many miles each rider goes in ONE hour.", `${A}: ${fmtNum(d1)} ÷ ${fmtNum(t1)}. ${B}: ${fmtNum(d2)} ÷ ${fmtNum(t2)}. Which is more miles per hour?`],
    explanation: `${rates}. ${s1 === s2 ? "Same speed — a tie!" : `${correct} is faster.`}`,
    data: { d1, t1, d2, t2, A, B },
    model: { type: "table", head: ["Rider", "Miles", "Hours", "mph"], rows: [[A, fmtNum(d1), fmtNum(t1), "?"], [B, fmtNum(d2), fmtNum(t2), "?"]] },
  });
}

const DEAL_ITEMS = ["soap", "juice", "cereal", "shampoo", "yogurt", "trail mix"];
const SIZES = [8, 12, 16, 20, 24, 32, 36, 48];

function betterDeal(rng: Rng): U3Question {
  const item = pick(rng, DEAL_ITEMS);
  const tie = rng() < 0.2;
  let s1 = 0, s2 = 0, p1 = 0, p2 = 0;
  for (let k = 0; k < 500; k++) {
    s1 = pick(rng, SIZES);
    s2 = pick(rng, SIZES);
    if (s1 === s2) continue;
    const u1 = ri(rng, 8, 30);
    p1 = s1 * u1;
    if (tie) p2 = s2 * u1;
    else {
      const d = (rng() < 0.5 ? -1 : 1) * (0.05 + rng() * 0.15);
      p2 = Math.round((s2 * u1 * (1 + d)) / 5) * 5;
    }
    if (!tie && p1 * s2 === p2 * s1) continue;
    if (p2 <= 0) continue;
    break;
  }
  const o1 = `${s1} oz for ${money(p1)}`;
  const o2 = `${s2} oz for ${money(p2)}`;
  const cmp = p1 * s2 - p2 * s1; // < 0: option 1 cheaper per ounce
  const correct = cmp === 0 ? "Same price per ounce" : cmp < 0 ? o1 : o2;
  const per = `${o1} is ${centsText(p1 / s1)} per oz; ${o2} is ${centsText(p2 / s2)} per oz`;
  return make(rng, {
    kind: "betterDeal",
    prompt: `Which ${item} is the better buy (cheaper per ounce): ${s1} oz for ${money(p1)}, or ${s2} oz for ${money(p2)}?`,
    correct,
    wrongs: [
      { t: o1, why: `Find the price of ONE ounce: ${per}.` },
      { t: o2, why: `Find the price of ONE ounce: ${per}.` },
      { t: "Same price per ounce", why: `Divide price by ounces for each: ${per}. Not the same!` },
      { t: "Can't tell: the sizes are different", why: "You can tell! The unit price (price for 1 ounce) lets you compare different sizes." },
    ],
    hints: ["Find the price of ONE ounce for each.", `${money(p1)} ÷ ${s1} and ${money(p2)} ÷ ${s2}. Which unit price is lower?`],
    explanation: `${per}. ${cmp === 0 ? "A tie — they cost the same per ounce!" : `The better buy is ${correct}.`}`,
    data: { s1, p1, s2, p2 },
    model: { type: "table", head: ["Ounces", "Price", "Per oz"], rows: [[`${s1}`, money(p1), "?"], [`${s2}`, money(p2), "?"]] },
  });
}

const BULK = ["granola bars", "pencils", "cans of soup", "apples", "juice boxes", "markers"];

function unitPriceRound(rng: Rng): U3Question {
  const thing = pick(rng, BULK);
  let n = 3, P = 1000;
  for (let k = 0; k < 100; k++) {
    n = pick(rng, [3, 6, 7, 9]);
    P = pick(rng, [2, 4, 5, 7, 8, 10, 11, 13, 20, 25]) * 100 + pick(rng, [0, 0, 50]);
    if (P % n !== 0) break;
  }
  const ans = roundDiv(P, n);
  const fl = Math.floor(P / n);
  const off = fl === ans ? ans + 1 : fl;
  return make(rng, {
    kind: "unitPriceRound",
    prompt: `To compare deals, find the price of one. A store sells ${n} ${thing} for ${money(P)}. What is the price of one, rounded to the nearest cent?`,
    correct: money(ans),
    wrongs: [
      { t: money(off), why: `${money(P)} ÷ ${n} = $${(P / n / 100).toFixed(4)}... Look at the thousandths digit to round to the NEAREST cent.` },
      { t: money(Math.floor(P / n / 10) * 10), why: "That's rounded to the dime (tenths), not the cent (hundredths). Keep 2 decimal places." },
      { t: money(roundDiv(n * 10000, P)), why: `You divided ${n} by the price — that's ${thing} per dollar, flipped. Divide price ÷ ${n}.` },
      { t: money(P * n), why: `That's the price of ${n} sets! Divide the price by ${n}.` },
    ],
    hints: [`Divide the price by the number of ${thing}.`, `Work out ${money(P)} ÷ ${n} to 3 decimal places, then look at the thousandths digit to round to the cent.`],
    explanation: `${money(P)} ÷ ${n} = $${(P / n / 100).toFixed(4)}..., which rounds to ${money(ans)} each.`,
    data: { n, P },
  });
}

/** Ratio pairs whose two unit rates are both kid-friendly (whole, ½ ⅓ ⅔ ¼ ¾, 1½, or short decimals). */
const RATIO_PAIRS: [number, number][] = [[3, 2], [2, 3], [6, 4], [4, 6], [5, 2], [3, 4], [4, 3], [9, 6], [5, 4], [8, 6], [10, 4], [3, 6], [6, 3], [2, 5]];
const PER_DOLLAR = [25, 50, 75, 125, 150, 200, 250, 300, 400];

function twoRates(rng: Rng): U3Question {
  const style = pick(rng, ["money", "recipe", "laps"] as const);
  const askAB = rng() < 0.5;
  if (style === "money") {
    const uC = pick(rng, PER_DOLLAR);
    const a = pick(rng, [2, 3, 4, 6]);
    const thing = pick(rng, ["apples", "grapes", "carrots", "bananas"]);
    const total = a * uC;
    const perDollar = niceRate(100, uC);
    const head = ["Pounds", "Dollars"];
    if (askAB) {
      return make(rng, {
        kind: "twoRates",
        prompt: `${a} pounds of ${thing} cost ${money(total)}. What is the price per pound?`,
        correct: `${money(uC)} per lb`,
        wrongs: [
          { t: `${money(roundDiv(10000, uC))} per lb`, why: `That's ${perDollar} lb per dollar written as money — the other unit rate, flipped. Divide dollars by pounds.` },
          { t: `${money(total)} per lb`, why: `That's the price for all ${a} pounds. Per pound means for ONE pound.` },
          { t: `${money(total * a)} per lb`, why: "You multiplied. To find the price of one pound, divide the price by the pounds." },
          { t: `${money(uC * 10)} per lb`, why: "Check the decimal point — that's 10 times too much." },
        ],
        hints: ["A ratio has TWO unit rates. This one asks: dollars for ONE pound.", `${money(total)} for ${a} pounds: split the price into ${a} equal parts.`],
        explanation: `${money(total)} ÷ ${a} = ${money(uC)} per pound. The other unit rate is ${a} ÷ ${fmtNum(total / 100)} = ${perDollar} lb per dollar.`,
        data: { style, a, uC, ask: "ab" },
        model: { type: "table", head, rows: [[`${a}`, money(total)], ["1", "?"]] },
      });
    }
    return make(rng, {
      kind: "twoRates",
      prompt: `${a} pounds of ${thing} cost ${money(total)}. How many pounds can you buy for $1.00?`,
      correct: `${perDollar} lb`,
      wrongs: [
        { t: `${niceRate(uC, 100)} lb`, why: "That's the dollars per pound — the other unit rate. Here you need pounds for ONE dollar: pounds ÷ dollars." },
        { t: `${a} lb`, why: `${a} pounds is what ${money(total)} buys. How much does $1.00 buy?` },
        { t: `${niceRate(a * total, 100)} lb`, why: "You multiplied. Pounds per dollar = pounds ÷ dollars." },
        { t: `${niceRate(1000, uC)} lb`, why: "Check the place value — that's 10 times too much." },
        { t: `${niceRate(10, uC)} lb`, why: "Check the place value — that's 10 times too little." },
      ],
      hints: ["A ratio has TWO unit rates. This one asks: pounds for ONE dollar.", `Divide pounds by dollars: ${a} ÷ ${fmtNum(total / 100)}.`],
      explanation: `${a} ÷ ${fmtNum(total / 100)} = ${perDollar} lb per dollar. The other unit rate is ${money(uC)} per pound.`,
      data: { style, a, uC, ask: "ba" },
      model: { type: "table", head, rows: [[`${a}`, money(total)], ["?", "$1.00"]] },
    });
  }
  const [a, b] = pick(rng, RATIO_PAIRS);
  const [x, y, xs, ys, verb] =
    style === "recipe" ? ["cups of flour", "cups of sugar", "cup of flour", "cup of sugar", "uses"] : ["laps", "minutes", "lap", "minute", "swims"];
  const name = pick(rng, NAMES);
  const prompt =
    style === "recipe"
      ? `A cookie recipe uses ${a} cups of flour for every ${b} cups of sugar. ${askAB ? "How many cups of flour per cup of sugar?" : "How many cups of sugar per cup of flour?"}`
      : `${name} ${verb} ${a} laps in ${b} minutes. ${askAB ? "How many laps per minute?" : "How many minutes per lap?"}`;
  const [n, d] = askAB ? [a, b] : [b, a];
  const unitLbl = askAB ? x : y;
  const per = askAB ? ys : xs;
  return make(rng, {
    kind: "twoRates",
    prompt,
    correct: `${niceRate(n, d)} ${unitLbl}`,
    wrongs: [
      { t: `${niceRate(d, n)} ${unitLbl}`, why: `That's the other unit rate (${niceRate(d, n)} ${askAB ? y : x} per ${askAB ? xs : ys}) — flipped. You want ${unitLbl} per ONE ${per}.` },
      { t: `${fmtNum(a * b)} ${unitLbl}`, why: `You multiplied. A unit rate divides: ${unitLbl} ÷ ${askAB ? y : x}.` },
      { t: `${fmtNum(a + b)} ${unitLbl}`, why: "That's the total of both numbers. A rate compares them by dividing." },
      { t: `${niceRate(n * 10, d)} ${unitLbl}`, why: "Check the place value — that's 10 times too much." },
      { t: `${niceRate(n, d * 10)} ${unitLbl}`, why: "Check the place value — that's 10 times too little." },
    ],
    hints: [`Every ratio has two unit rates. Which one is "${unitLbl} per 1 ${per}"?`, `Divide: ${n} ${unitLbl} ÷ ${d} ${askAB ? y : x}.`],
    explanation: `${n} ÷ ${d} = ${niceRate(n, d)} ${unitLbl} per ${per}. The other unit rate is ${niceRate(d, n)} ${askAB ? y : x} per ${askAB ? xs : ys} — both are true!`,
    data: { style, a, b, ask: askAB ? "ab" : "ba" },
    model: { type: "table", head: [x, y], rows: [[`${a}`, `${b}`], askAB ? ["?", "1"] : ["1", "?"]] },
  });
}

const SAME_CONTEXT: [string, string, string, string][] = [
  ["lemonade", "scoops of mix", "cups of water", "scoop of mix per cup of water"],
  ["paint", "cups of blue", "cups of yellow", "cup of blue per cup of yellow"],
  ["trail mix", "cups of nuts", "cups of raisins", "cup of nuts per cup of raisins"],
  ["cookie dough", "cups of flour", "cups of sugar", "cup of flour per cup of sugar"],
];

function sameRate(rng: Rng): U3Question {
  const [what, x, y] = pick(rng, SAME_CONTEXT);
  const [a, b] = pick(rng, [[6, 4], [2, 3], [3, 5], [4, 6], [3, 2], [4, 5], [5, 2]] as [number, number][]);
  const mode = pick(rng, ["yes", "yes", "add", "other"] as const);
  let c = a, d = b;
  if (mode === "yes") {
    const k = pick(rng, a % 2 === 0 && b % 2 === 0 ? [0.5, 1.5, 2, 3] : [2, 3, 4]);
    c = a * k;
    d = b * k;
  } else if (mode === "add") {
    const m = pick(rng, [1, 2, 3]);
    c = a + m;
    d = b + m;
  } else {
    const k = pick(rng, [2, 3]);
    c = a * k + (rng() < 0.5 ? 1 : 0);
    d = b * k + (c === a * k ? 1 : 0);
  }
  const r1 = niceRate(a, b), r2 = niceRate(c, d);
  const cmp = a * d - c * b; // > 0: first has more x per y
  const xOne = x.replace(/^cups/, "cup").replace(/^scoops/, "scoop");
  const yOne = y.replace(/^cups/, "cup");
  const first = `No: the first has more ${x.replace(/^(cups|scoops) of /, "")} per ${yOne}`;
  const second = `No: the second has more ${x.replace(/^(cups|scoops) of /, "")} per ${yOne}`;
  const correct = cmp === 0 ? "Yes, it's the same rate" : cmp > 0 ? first : second;
  const rates = `${a} ÷ ${b} = ${r1} and ${c} ÷ ${d} = ${r2} ${xOne.replace(/^(cup|scoop) of /, "")} per ${yOne}`;
  return make(rng, {
    kind: "sameRate",
    prompt: `Is ${a} ${x} to ${b} ${y} the same ${what} recipe as ${c} ${x} to ${d} ${y}?`,
    correct,
    wrongs: [
      { t: "Yes, it's the same rate", why: mode === "add" ? `Adding the same amount to both parts does NOT keep the rate: ${rates}.` : `Compare unit rates: ${rates}. Not equal.` },
      { t: first, why: `Compare unit rates: ${rates}.` },
      { t: second, why: `Compare unit rates: ${rates}.` },
      { t: "No: the numbers are different", why: `Different numbers can still be the SAME rate. Compare unit rates: ${rates}.` },
    ],
    hints: [`Find the unit rate for each: ${x} per 1 ${yOne}.`, `First: ${a} ÷ ${b}. Second: ${c} ÷ ${d}. Are they equal?`],
    explanation: `${rates}. ${cmp === 0 ? "Equivalent ratios have the same unit rate — same recipe!" : "Different unit rates, so the recipes taste different."}`,
    data: { a, b, c, d },
    model: { type: "table", head: [x, y], rows: [[`${a}`, `${b}`], [`${c}`, `${d}`]] },
  });
}

/** Speeds whose pace (60 ÷ speed) is a clean number of minutes. */
export const CLEAN_SPEEDS = [3, 4, 5, 6, 7.5, 8, 10, 12, 15, 20, 24, 30];

function paceCompare(rng: Rng): U3Question {
  const [A, B] = two(rng);
  const tie = rng() < 0.25;
  let p = 8, s = 10;
  if (tie) {
    s = pick(rng, [5, 6, 7.5, 8, 10, 12]);
    p = 60 / s;
  } else {
    for (let k = 0; k < 100; k++) {
      p = pick(rng, [5, 6, 7, 8, 9, 10, 12]);
      s = pick(rng, [5, 6, 7.5, 8, 10, 12]);
      if (60 / s !== p) break;
    }
  }
  const bp = 60 / s;
  const correct = bp === p ? "Same speed" : bp < p ? B : A;
  const conv = `${B}: 60 ÷ ${fmtNum(s)} = ${fmtNum(bp)} min per mile, vs ${A}'s ${fmtNum(p)} min per mile`;
  return make(rng, {
    kind: "paceCompare",
    prompt: `${A} runs at a pace of ${fmtNum(p)} minutes per mile. ${B} runs at a speed of ${fmtNum(s)} miles per hour. Who is faster?`,
    correct,
    wrongs: [
      { t: A, why: `Change ${B}'s speed to a pace: ${conv}. Lower pace = faster.` },
      { t: B, why: `Change ${B}'s speed to a pace: ${conv}. Lower pace = faster.` },
      { t: "Same speed", why: `Not a tie: ${conv}.` },
      { t: "Can't compare speed and pace", why: `You CAN: change the speed to minutes per mile. ${conv}.` },
    ],
    hints: [`Put them in the same units. How many minutes does ${B} take for ONE mile?`, `An hour is 60 minutes. ${B} goes ${fmtNum(s)} miles in 60 minutes, so 1 mile takes 60 ÷ ${fmtNum(s)} minutes.`],
    explanation: `${conv}. ${correct === "Same speed" ? "Same pace — a tie!" : `Fewer minutes per mile means faster: ${correct}.`}`,
    data: { p, s, A, B },
  });
}

function speedToPace(rng: Rng): U3Question {
  const name = pick(rng, NAMES);
  const s = pick(rng, CLEAN_SPEEDS);
  const ans = 60 / s;
  const how = pick(rng, ["bikes", "runs", "skates"]);
  return make(rng, {
    kind: "speedToPace",
    prompt: `${name} ${how} at ${fmtNum(s)} miles per hour. What is the pace in minutes per mile?`,
    correct: `${fmtNum(ans)} min per mile`,
    wrongs: [
      { t: `${fmtNum(s)} min per mile`, why: "That's the speed (miles per hour). Pace is the other way around: minutes for ONE mile." },
      { t: `${fmtNum(60 * s)} min per mile`, why: `You multiplied. ${fmtNum(s)} miles take 60 minutes, so 1 mile takes 60 ÷ ${fmtNum(s)}.` },
      { t: `${fmtNum(60 - s)} min per mile`, why: `Subtracting doesn't find a rate. Divide 60 minutes by ${fmtNum(s)} miles.` },
      { t: `${fmtNum(ans * 10)} min per mile`, why: "Check the place value — that's 10 times too many minutes." },
    ],
    hints: ["Pace = minutes for ONE mile. How many minutes are in the hour?", `${fmtNum(s)} miles in 60 minutes. Split 60 minutes into ${fmtNum(s)} equal parts.`],
    explanation: `60 minutes ÷ ${fmtNum(s)} miles = ${fmtNum(ans)} minutes per mile.`,
    data: { s },
    model: { type: "table", head: ["Miles", "Minutes"], rows: [[fmtNum(s), "60"], ["1", "?"]] },
  });
}

function paceToSpeed(rng: Rng): U3Question {
  const name = pick(rng, NAMES);
  const p = pick(rng, [4, 5, 6, 8, 10, 12, 15, 20]);
  const ans = 60 / p;
  return make(rng, {
    kind: "paceToSpeed",
    prompt: `${name}'s pace is ${p} minutes per mile. What is that speed in miles per hour?`,
    correct: `${fmtNum(ans)} mph`,
    wrongs: [
      { t: `${p} mph`, why: "That's the pace number. Speed is miles in ONE hour (60 minutes)." },
      { t: `${fmtNum(60 * p)} mph`, why: `You multiplied. Ask: how many ${p}-minute miles fit in 60 minutes? Divide.` },
      { t: `${fmtNum(60 - p)} mph`, why: `Subtracting doesn't find a rate. Divide 60 by ${p}.` },
      { t: `${fmtNum(ans * 10)} mph`, why: "Check the place value — that's 10 times too fast." },
    ],
    hints: ["Speed = miles in ONE hour. How many minutes are in an hour?", `Each mile takes ${p} minutes. How many groups of ${p} minutes fit in 60 minutes?`],
    explanation: `60 ÷ ${p} = ${fmtNum(ans)} miles in an hour, so ${fmtNum(ans)} mph.`,
    data: { p },
    model: { type: "table", head: ["Miles", "Minutes"], rows: [["1", `${p}`], ["?", "60"]] },
  });
}

function fastestPace(rng: Rng): U3Question {
  const pool = [5, 5.5, 6, 6.5, 7, 7.5, 8, 9, 10, 11, 12];
  const set = new Set<number>();
  while (set.size < 4) set.add(pick(rng, pool));
  const ps = [...set];
  const best = Math.min(...ps);
  const worst = Math.max(...ps);
  const txt = (p: number) => `${fmtNum(p)} min per mile`;
  return make(rng, {
    kind: "fastestPace",
    prompt: "Four runners give their pace. Which pace is the FASTEST?",
    correct: txt(best),
    wrongs: ps
      .filter((p) => p !== best)
      .sort((a, b) => b - a)
      .map((p) => ({
        t: txt(p),
        why: p === worst ? "That's the SLOWEST: a bigger pace number means MORE minutes for each mile." : `A bigger pace number is slower. ${fmtNum(best)} minutes per mile beats ${fmtNum(p)}.`,
      })),
    hints: ["Pace = minutes for one mile. Do fast runners need MORE or FEWER minutes?", "Faster runners finish a mile in less time, so look for the smallest number of minutes."],
    explanation: `Faster = lower pace. ${txt(best)} takes the least time per mile.`,
    data: { ps: ps.join(",") },
  });
}

const ITEMS = ["notebooks", "smoothies", "tickets", "bags of popcorn", "packs of stickers", "comic books"];

function unitThenTotal(rng: Rng): U3Question {
  const thing = pick(rng, ITEMS);
  const n = pick(rng, [3, 4, 5, 6, 8]);
  const u = pick(rng, [75, 125, 150, 180, 240, 35, 45, 225, 95]);
  let m = pick(rng, [2, 3, 7, 9, 10, 12]);
  if (m === n) m++;
  const P = n * u;
  const ans = u * m;
  return make(rng, {
    kind: "unitThenTotal",
    prompt: `${n} ${thing} cost ${money(P)}. At the same price, how much do ${m} cost?`,
    correct: money(ans),
    wrongs: [
      { t: money(u), why: `That's the price of ONE — you stopped after step one. Now find the cost of ${m}.` },
      { t: money(P * m), why: `That's ${m} sets of ${n}! Find the price of one first: ${money(P)} ÷ ${n}.` },
      { t: money(roundDiv(P * n, m)), why: "The division is flipped. Price of one = total price ÷ number of items." },
      { t: money(P + m * 100), why: `Adding ${money(m * 100)} doesn't scale the price. Find the unit price, then multiply by ${m}.` },
      { t: money(ans * 10), why: "Check the decimal point — that's 10 times too much." },
    ],
    hints: ["First find the price of ONE (the unit price).", `${money(P)} ÷ ${n} = ${money(u)} each. Now how much for ${m}?`],
    explanation: `${money(P)} ÷ ${n} = ${money(u)} each, and ${money(u)} × ${m} = ${money(ans)}.`,
    data: { n, P, m },
    model: { type: "table", head: ["Items", "Cost"], rows: [[`${n}`, money(P)], ["1", "?"], [`${m}`, "?"]] },
  });
}

function roundAtEnd(rng: Rng): U3Question {
  const thing = pick(rng, BULK);
  let n = 3, P = 1000, m = 7;
  for (let k = 0; k < 300; k++) {
    n = pick(rng, [3, 6, 7, 9]);
    P = pick(rng, [2, 4, 5, 7, 8, 10, 11, 13, 20]) * 100;
    m = pick(rng, [2, 4, 5, 7, 8, 10, 11]);
    if (m % n === 0 || P % n === 0) continue;
    if (roundDiv(P, n) * m !== roundDiv(P * m, n)) break;
  }
  const ans = roundDiv(P * m, n);
  const early = roundDiv(P, n) * m;
  return make(rng, {
    kind: "roundAtEnd",
    prompt: `${n} ${thing} cost ${money(P)}. At that rate, how much do ${m} cost? Round your final answer to the nearest cent.`,
    correct: money(ans),
    wrongs: [
      { t: money(early), why: `You rounded the unit price first (${money(roundDiv(P, n))}), then multiplied. Round at the END: ${money(P)} ÷ ${n} × ${m}.` },
      { t: money(roundDiv(P, n)), why: `That's the price of ONE — you stopped after step one. Now find the cost of ${m}.` },
      { t: money(Math.floor((P * m) / n) === ans ? ans + 1 : Math.floor((P * m) / n)), why: "Round to the NEAREST cent: look at the thousandths digit." },
      { t: money(P * m), why: `That's ${m} sets of ${n}. Divide by ${n} too.` },
    ],
    hints: ["Find the cost of one, but don't round yet!", `${money(P)} ÷ ${n} = $${(P / n / 100).toFixed(4)}... Multiply THAT by ${m}, then round to the cent.`],
    explanation: `${money(P)} ÷ ${n} × ${m} = $${((P * m) / n / 100).toFixed(4)}..., which rounds to ${money(ans)}.`,
    data: { n, P, m },
  });
}

function timeForDistance(rng: Rng): U3Question {
  const s = pick(rng, [40, 45, 50, 55, 60, 65]);
  const t = pick(rng, [2, 3, 4]);
  let T = pick(rng, [1.5, 2.5, 3, 5, 6, 7]);
  if (T === t) T = 5;
  const d = s * t, D = s * T;
  const vehicle = pick(rng, ["train", "bus", "car"]);
  return make(rng, {
    kind: "timeForDistance",
    prompt: `A ${vehicle} travels ${d} miles in ${t} hours. At the same speed, how long will ${fmtNum(D)} miles take?`,
    correct: `${fmtNum(T)} hours`,
    wrongs: [
      { t: `${s} hours`, why: `${s} is the speed (miles in ONE hour) — you stopped after step one. Now find the hours for ${fmtNum(D)} miles.` },
      { t: `${fmtNum(D * s)} hours`, why: "Multiply or divide? miles ÷ (miles per hour) = hours. Divide." },
      { t: `${fmtNum(D / t)} hours`, why: `You divided by ${t} hours. Find the speed first: ${d} ÷ ${t}.` },
      { t: `${fmtNum(T * 10)} hours`, why: "Check the place value — that's 10 times too long." },
    ],
    hints: ["First find the speed: miles in ONE hour.", `${d} ÷ ${t} = ${s} miles per hour. How many hours to go ${fmtNum(D)} miles at that speed?`],
    explanation: `${d} ÷ ${t} = ${s} mph, and ${fmtNum(D)} ÷ ${s} = ${fmtNum(T)} hours.`,
    data: { d, t, D },
    model: { type: "table", head: ["Hours", "Miles"], rows: [[`${t}`, `${d}`], ["1", "?"], ["?", fmtNum(D)]] },
  });
}

/** Batch fractions from the doc: ½ ⅓ ¼ ⅔ 1½ (and 2½). */
export const BATCH_FRACS: [number, number][] = [[1, 2], [1, 3], [1, 4], [2, 3], [3, 2], [5, 2]];

function recipeBatch(rng: Rng): U3Question {
  const [num, den] = pick(rng, BATCH_FRACS);
  const c = den * pick(rng, [1, 2, 3, 4]);
  const ans = (c * num) / den;
  const fr = fracText(num, den);
  const [ing, one] = pick(rng, [["cups of oats", "cup"], ["cups of milk", "cup"], ["cups of flour", "cup"], ["eggs", "egg"]] as [string, string][]);
  const label = (x: string, val: number) => `${x} ${val === 1 && one === "egg" ? "egg" : ing.split(" ")[0]}`;
  const batch = num > den ? `${fr} batches` : `${fr} of a batch`;
  return make(rng, {
    kind: "recipeBatch",
    prompt: `A granola bar recipe uses ${c} ${ing}. ${pick(rng, NAMES)} makes ${batch}. How many ${ing} are needed?`,
    correct: label(fmtNum(ans), ans),
    wrongs: [
      { t: label(niceRate(c * den, num), 2), why: `You divided by ${fr}. Making ${batch} means MULTIPLY: ${c} × ${fr}.` },
      { t: label(niceRate(c * den + num, den), 2), why: `Adding ${fr} isn't scaling. Multiply the amount by ${fr}.` },
      { t: label(fmtNum(c * num), 2), why: `You multiplied by the top number only. ${fr} means × ${num} and ÷ ${den}.` },
      { t: label(niceRate(c, den), 2), why: `That's 1/${den} of the recipe. You need ${fr}.` },
    ],
    hints: [`Making ${batch} means multiplying every amount by ${fr}.`, num > den ? `${fr} = 1 + ${fracText(num - den, den)}. One full batch is ${c}; add ${fracText(num - den, den)} of ${c}.` : `Split ${c} into ${den} equal parts (${niceRate(c, den)} each), then take ${num} of them.`],
    explanation: `${c} × ${fr} = ${fmtNum(ans)} ${ing.split(" ")[0]}.`,
    data: { c, num, den },
    model: { type: "table", head: ["Batches", ing], rows: [["1", `${c}`], [fr, "?"]] },
  });
}

function cookieScale(rng: Rng): U3Question {
  for (let k = 0; ; k++) {
    const kk = pick(rng, [12, 18, 24, 36]);
    const c = pick(rng, [2, 3, 4, 6]);
    const [fn, fd] = pick(rng, [[3, 2], [2, 3], [5, 2], [1, 2], [1, 3], [3, 1], [3, 4]] as [number, number][]);
    const K = (kk * fn) / fd;
    if (!Number.isInteger(K) || K === kk) continue;
    const cups = niceRate(c * K, kk);
    if (cups.includes("/") && k < 50) continue;
    return make(rng, {
      kind: "cookieScale",
      prompt: `A recipe uses ${c} cups of flour to make ${kk} cookies. How many cups of flour for ${K} cookies?`,
      correct: `${cups} cups`,
      wrongs: [
        { t: `${niceRate(c, kk)} cups`, why: `That's the flour for ONE cookie — you stopped after step one. Now scale up to ${K} cookies.` },
        { t: `${fmtNum(c * K)} cups`, why: `That's ${c} cups for EVERY cookie! It's ${c} cups for ${kk} cookies, so divide by ${kk} too.` },
        { t: `${niceRate(c * kk, K)} cups`, why: `The division is flipped. ${K} cookies is ${fracText(K, kk)} of a batch: multiply ${c} × ${fracText(K, kk)}.` },
        { t: `${fmtNum(c + K - kk > 0 ? c + K - kk : c + K)} cups`, why: "Adding or subtracting cookies doesn't scale a recipe. Use a unit rate or a scale factor." },
      ],
      hints: [`How many batches of ${kk} cookies is ${K} cookies?`, `${K} ÷ ${kk} = ${fracText(K, kk)} batches. Multiply ${c} cups by ${fracText(K, kk)}.`],
      explanation: `${K} cookies = ${fracText(K, kk)} batches, and ${c} × ${fracText(K, kk)} = ${cups} cups of flour.`,
      data: { c, kk, K },
      model: { type: "table", head: ["Cookies", "Cups of flour"], rows: [[`${kk}`, `${c}`], [`${K}`, "?"]] },
    });
  }
}

function gasOp(rng: Rng): U3Question {
  const mpg = pick(rng, [20, 25, 30, 32, 35, 40]);
  const g = pick(rng, [2, 3, 4, 5]);
  let G = pick(rng, [1.5, 2.5, 3, 6, 7, 8]);
  if (G === g) G = 8;
  const d = mpg * g, D = mpg * G;
  return make(rng, {
    kind: "gasOp",
    prompt: `A car goes ${d} miles on ${g} gallons of gas. How many gallons does it need for ${fmtNum(D)} miles?`,
    correct: `${fmtNum(G)} gal`,
    wrongs: [
      { t: `${fmtNum(D * mpg)} gal`, why: "Multiply or divide? miles ÷ (miles per gallon) = gallons. Divide." },
      { t: `${mpg} gal`, why: `${mpg} is miles per gallon — you stopped after step one. Now find the gallons for ${fmtNum(D)} miles.` },
      { t: `${fmtNum(D / g)} gal`, why: `You divided by ${g} gallons. Find the miles per gallon first: ${d} ÷ ${g}.` },
      { t: `${fmtNum(G * 10)} gal`, why: "Check the place value — that's 10 times too much gas." },
    ],
    hints: ["First find how far the car goes on ONE gallon.", `${d} ÷ ${g} = ${mpg} miles per gallon. How many gallons cover ${fmtNum(D)} miles?`],
    explanation: `${d} ÷ ${g} = ${mpg} miles per gallon, and ${fmtNum(D)} ÷ ${mpg} = ${fmtNum(G)} gallons.`,
    data: { d, g, D },
    model: { type: "table", head: ["Gallons", "Miles"], rows: [[`${g}`, `${d}`], ["1", "?"], ["?", fmtNum(D)]] },
  });
}

/* ================================================================== Section D · percentages */

function percentMeaning(rng: Rng): U3Question {
  const P = pick(rng, [35, 6, 12, 40, 150, 125, 200, 75]);
  return make(rng, {
    kind: "percentMeaning",
    prompt: `What does ${P}% mean?`,
    correct: `${P} for every 100`,
    wrongs: [
      { t: `${P} for every 10`, why: "Percent means PER 100 (cent = 100, like 100 cents in a dollar)." },
      { t: `1 for every ${P}`, why: `That's flipped. ${P}% means ${P} for every 100.` },
      { t: `${P} for every 1,000`, why: "Percent means per 100, not per 1,000." },
    ],
    hints: ['"Per cent" means "per ___". How many cents are in a dollar?', `So ${P}% compares ${P} to a whole of 100.`],
    explanation: `${P}% = ${P} for every 100.${P > 100 ? " More than 100% means more than the whole!" : ""}`,
    data: { P },
    model: { type: "dnl", topLabel: "%", bottomLabel: "per 100", top: ["0%", `${P}%`, "100%"], bottom: ["0", `${P}`, "100"].map((v, i) => (i === 1 ? "?" : v)) },
  });
}

/** Double-number-line ticks from 0 up to past `upTo`, every `step` percent. */
function ticks(step: number, upTo: number): number[] {
  const out: number[] = [];
  for (let p = 0; p <= Math.max(100, upTo); p += step) out.push(p);
  return out;
}

function ticketPercent(rng: Rng): U3Question {
  const w = pick(rng, [20, 40, 60, 80, 12, 16, 30, 50]);
  const P = pick(rng, [50, 150, 200, 25, 125, 10, 300]);
  const ans = w * P; // cents: w dollars × P / 100
  const step = P % 50 === 0 ? 50 : P % 25 === 0 ? 25 : 10;
  const tk = ticks(step, P);
  const wrongs: Wrong[] = [
    { t: money(P * 100), why: `${P} is the percent, not dollars. ${P}% of ${money(w * 100)} is ${P / 100} × ${money(w * 100)}.` },
    { t: money(ans / 10), why: "Check the decimal point — that's 10 times too little." },
    { t: money(ans * 10), why: "Check the decimal point — that's 10 times too much." },
  ];
  if (P > 100) wrongs.unshift({ t: money(w * (P - 100)), why: `That's just the EXTRA ${P - 100}%. ${P}% is the whole ${money(w * 100)} plus that.` });
  else wrongs.unshift({ t: money(w * 100 - ans), why: `That's the other ${100 - P}%. You want ${P}%.` });
  return make(rng, {
    kind: "ticketPercent",
    prompt: `A concert ticket costs ${money(w * 100)}. That's 100%. What is ${P}% of the ticket price?`,
    correct: money(ans),
    wrongs,
    hints: [P > 100 ? `${P}% is MORE than 100%, so the answer is more than ${money(w * 100)}.` : `${P}% is less than 100%, so the answer is less than ${money(w * 100)}.`, P === step ? `100% is ${100 / step} equal jumps of ${step}%. Split ${money(w * 100)} into ${100 / step} equal jumps.` : `Find 1 jump on the number line: ${step}% of ${money(w * 100)} = ${money(w * step)}. How many jumps is ${P}%?`],
    explanation: `${P}% = ${P / 100} × ${money(w * 100)} = ${money(ans)}.`,
    data: { w, P },
    model: { type: "dnl", topLabel: "percent", bottomLabel: "dollars", top: tk.map((p) => `${p}%`), bottom: tk.map((p) => (p === 0 ? "$0" : p === 100 ? `$${w}` : p === P ? "?" : "")) },
  });
}

function outOf(rng: Rng): U3Question {
  const b = pick(rng, [20, 25, 50, 10, 200, 4]);
  const P = pick(rng, b === 4 ? [25, 50, 75] : b === 200 ? [6, 12, 35, 45, 70] : b === 10 ? [30, 40, 70, 90] : b === 25 ? [12, 36, 48, 60, 84] : b === 20 ? [15, 35, 45, 65, 85] : [6, 12, 38, 46, 70]);
  const a = (b * P) / 100;
  const what = pick(rng, ["students ride the bus", "seeds sprouted", "shots went in", "marbles are blue"]);
  return make(rng, {
    kind: "outOf",
    prompt: `${a} out of ${b} ${what.split(" ")[0]} ${what.split(" ").slice(1).join(" ")}. What percent is that?`,
    correct: `${P}%`,
    wrongs: [
      { t: `${fmtNum(a)}%`, why: `That's ${fmtNum(a)} out of ${b}, not out of 100. Scale ${b} up (or down) to 100.` },
      { t: `${100 - P}%`, why: "That's the percent that DIDN'T. Find the part that did." },
      { t: `${fmtNum(P / 10)}%`, why: "Check the place value — percent is out of 100." },
      { t: `${fmtNum(P * 10)}%`, why: "Check the place value — percent is out of 100." },
    ],
    hints: ["Percent means out of 100. What do you multiply (or divide) the whole by to get 100?", `${b} × ${fmtNum(100 / b)} = 100, so do the same to ${fmtNum(a)}.`],
    explanation: `${fmtNum(a)} out of ${b} = ${P} out of 100 = ${P}%.`,
    data: { a, b },
    model: { type: "dnl", topLabel: "count", bottomLabel: "percent", top: ["0", fmtNum(a), `${b}`], bottom: ["0%", "?", "100%"] },
  });
}

const DNL_UNITS: [string, string][] = [["m", "meters"], ["gal", "gallons"], ["pages", "pages"], ["$", "dollars"], ["km", "kilometers"]];

function dnlPart(rng: Rng): U3Question {
  const step = pick(rng, [25, 20, 10]);
  const W = pick(rng, step === 25 ? [40, 60, 80, 120, 200, 24, 36, 48] : step === 20 ? [20, 35, 45, 60, 80, 150, 250] : [30, 50, 70, 90, 120, 250, 40]);
  const P = step * pick(rng, step === 10 ? [1, 3, 4, 6, 7, 9, 12, 15] : step === 20 ? [1, 2, 3, 4, 6] : [1, 2, 3, 5, 6]);
  const [u, words] = pick(rng, DNL_UNITS);
  const fmt = (x: number) => (u === "$" ? money(x * 100) : `${fmtNum(x)} ${u}`);
  const ans = (W * P) / 100;
  const tk = ticks(step, P);
  const wrongs: Wrong[] = [
    { t: fmt(P), why: `${P} is the percent (top line). Read the ${words} line: ${P}% of ${fmt(W)}.` },
    { t: fmt((W * (P + step)) / 100), why: `That's ${P + step}%. Each jump is ${step}% = ${fmt((W * step) / 100)}; count the jumps again.` },
    { t: fmt((W * (P - step)) / 100), why: `That's ${P - step}%. Each jump is ${step}% = ${fmt((W * step) / 100)}; count the jumps again.` },
    P < 100 ? { t: fmt(W - ans), why: `That's what's left (${100 - P}%). You want ${P}%.` } : { t: fmt(ans - W), why: `That's only the part past 100%. ${P}% is the whole ${fmt(W)} plus that.` },
    { t: fmt(ans * 10), why: "Check the place value — that's 10 times too much." },
    { t: fmt(W + P), why: `Adding ${P} mixes up percents and ${words}. Count jumps of ${step}%.` },
  ];
  return make(rng, {
    kind: "dnlPart",
    prompt: `On a double number line, 100% is ${fmt(W)}. What is ${P}%?`,
    correct: fmt(ans),
    wrongs,
    hints: [`Each tick is ${step}%. What is ${step}% of ${fmt(W)}?`, P === step ? `100% is ${100 / step} equal jumps of ${step}%. Split ${fmt(W)} into ${100 / step} equal parts.` : `Each ${step}% jump is ${fmt((W * step) / 100)}. ${P}% is ${P / step} jumps.`],
    explanation: `${step}% = ${fmt((W * step) / 100)}, so ${P}% = ${P / step} × ${fmt((W * step) / 100)} = ${fmt(ans)}.`,
    data: { W, P, u },
    model: { type: "dnl", topLabel: "percent", bottomLabel: words, top: tk.map((p) => `${p}%`), bottom: tk.map((p) => (p === 0 ? "0" : p === 100 ? fmtNum(W) : p === P ? "?" : "")) },
  });
}

function dnlWhole(rng: Rng): U3Question {
  const P = pick(rng, [25, 50, 20, 10, 40, 75]);
  const step = P === 75 || P === 25 || P === 50 ? 25 : P === 40 || P === 20 ? 20 : 10;
  const unitPart = pick(rng, [3, 4, 5, 6, 8, 9, 12, 15]);
  const part = unitPart * (P / step);
  const W = unitPart * (100 / step);
  const [u, words] = pick(rng, DNL_UNITS.filter(([x]) => x !== "$"));
  const fmt = (x: number) => `${fmtNum(x)} ${u}`;
  const tk = ticks(step, 100);
  return make(rng, {
    kind: "dnlWhole",
    prompt: `On a double number line, ${P}% lines up with ${fmt(part)}. What lines up with 100%?`,
    correct: fmt(W),
    wrongs: [
      { t: fmt((part * P) / 100), why: `You took ${P}% OF ${fmt(part)}. But ${fmt(part)} IS ${P}%; go UP to 100%.` },
      { t: fmt(W - unitPart), why: `That's ${100 - step}% — one jump short of 100%.` },
      { t: fmt(part + 100 - P), why: `Adding ${100 - P} mixes up percents and ${words}. Count jumps of ${step}%.` },
      { t: fmt(W * 10), why: "Check the place value — that's 10 times too much." },
    ],
    hints: [`${P}% is ${P / step} jumps of ${step}%. How much is one jump?`, `One ${step}% jump = ${fmt(part)} ÷ ${P / step} = ${fmt(unitPart)}. 100% is ${100 / step} jumps.`],
    explanation: `${step}% = ${fmt(unitPart)}, so 100% = ${100 / step} × ${fmt(unitPart)} = ${fmt(W)}.`,
    data: { P, part, u },
    model: { type: "dnl", topLabel: "percent", bottomLabel: words, top: tk.map((p) => `${p}%`), bottom: tk.map((p) => (p === 0 ? "0" : p === P ? fmtNum(part) : p === 100 ? "?" : "")) },
  });
}

function tapeWhole(rng: Rng): U3Question {
  const parts = pick(rng, [5, 4, 10]);
  const pp = 100 / parts;
  const k = ri(rng, 1, parts - 1);
  const P = k * pp;
  const u = pick(rng, [3, 4, 5, 6, 7, 8, 9, 12, 15]);
  const part = k * u;
  const W = parts * u;
  const [unitTxt, ctx] = pick(rng, [["gal", "of a fish tank is filled"], ["pages", "of a book has been read"], ["L", "of a water jug is full"], ["km", "of a bike trail is done"]] as [string, string][]);
  const fmt = (x: number) => `${fmtNum(x)} ${unitTxt}`;
  return make(rng, {
    kind: "tapeWhole",
    prompt: `${P}% ${ctx}: that's ${fmt(part)}. How much is the whole (100%)?`,
    correct: fmt(W),
    wrongs: [
      { t: fmt(u), why: `That's ONE piece of the tape (${pp}%) — you stopped after step one. The whole is ${parts} pieces.` },
      { t: fmt((part * P) / 100), why: `You found ${P}% OF ${fmt(part)}. But ${fmt(part)} is the part; the whole is bigger.` },
      { t: fmt(part * parts), why: `${fmt(part)} is ${k} pieces, not one. Find one piece first: ${fmt(part)} ÷ ${k}.` },
      { t: fmt(part + 100 - P), why: "Adding the missing percent mixes up percents and amounts. Use the tape: find one piece first." },
    ],
    hints: [`Cut the tape into ${parts} equal pieces of ${pp}%. How many pieces is ${P}%?`, `${P}% = ${k} pieces = ${fmt(part)}, so one piece is ${fmt(part)} ÷ ${k} = ${fmt(u)}. The whole tape has ${parts} pieces.`],
    explanation: `${P}% = ${k} pieces = ${fmt(part)}, so 1 piece (${pp}%) = ${fmt(u)}, and 100% = ${parts} × ${fmt(u)} = ${fmt(W)}.`,
    data: { P, part, parts },
    model: { type: "tape", parts, shaded: k, partLabel: `${pp}%`, shadedLabel: `${P}% = ${fmt(part)}`, totalLabel: "100% = ?" },
  });
}

function tapePart(rng: Rng): U3Question {
  const parts = pick(rng, [5, 4, 10]);
  const pp = 100 / parts;
  const k = ri(rng, 1, parts - 1);
  const P = k * pp;
  const u = pick(rng, [3, 4, 6, 8, 9, 12, 15, 20]);
  const W = parts * u;
  const ans = k * u;
  return make(rng, {
    kind: "tapePart",
    prompt: `A tape diagram has ${parts} equal parts, and the whole tape (100%) is ${W}. What is ${P}% of ${W}?`,
    correct: fmtNum(ans),
    wrongs: [
      { t: fmtNum(u), why: `That's ONE part (${pp}%) — you stopped after step one. ${P}% is ${k} parts.` },
      { t: fmtNum(W - ans), why: `That's the other ${100 - P}%. You want ${P}%.` },
      { t: fmtNum(P), why: `${P} is the percent, not the amount. Find ${k} parts of the tape.` },
      { t: fmtNum((W * P) / 10), why: "Check the decimal point — that's 10 times too much." },
      { t: fmtNum(ans + u), why: `That's ${k + 1} parts. ${P}% is ${k} parts.` },
      { t: fmtNum(ans * 10), why: "Check the decimal point — that's 10 times too much." },
    ],
    hints: [`Each of the ${parts} parts is ${pp}%. How much is one part of ${W}?`, `${W} ÷ ${parts} = ${u} per part. ${P}% is ${k} parts.`],
    explanation: `${W} ÷ ${parts} = ${u} per part (${pp}%), and ${k} × ${u} = ${fmtNum(ans)}.`,
    data: { W, P },
    model: { type: "tape", parts, shaded: k, partLabel: `${pp}%`, shadedLabel: `${P}% = ?`, totalLabel: `100% = ${W}` },
  });
}

export const BENCH_FRAC: Record<number, string> = { 1: "1/100", 10: "⅒", 25: "¼", 50: "½", 75: "¾" };

function benchmark(rng: Rng): U3Question {
  const P = pick(rng, [10, 25, 50, 75, 1, 10, 25, 75]);
  const W = pick(rng, P === 1 ? [200, 500, 800, 1200, 3500, 900] : P === 10 ? [350, 80, 120, 450, 70, 960] : P === 50 ? [48, 90, 130, 64, 250] : [80, 48, 120, 36, 200, 64, 160]);
  const ans = (W * P) / 100;
  const d = 100 / P;
  return make(rng, {
    kind: "benchmark",
    prompt: `Quick! What is ${P}% of ${fmtNum(W)}?`,
    correct: fmtNum(ans),
    wrongs: [
      { t: fmtNum(W / P), why: `Dividing by ${P} isn't ${P}%. ${P}% = ${BENCH_FRAC[P]}${P === 75 ? `: divide by 4, then times 3.` : `, so divide by ${fmtNum(d)}.`}` },
      P === 50 ? { t: fmtNum(W * 2), why: "50% is HALF — divide by 2." } : { t: fmtNum(W - ans), why: `That's what's left (${100 - P}%). You want ${P}%.` },
      { t: fmtNum(ans / 10), why: "Check the decimal point — that's 10 times too small." },
      { t: fmtNum(ans * 10), why: "Check the decimal point — that's 10 times too big." },
    ],
    hints: [`${P}% is a benchmark: ${P}% = ${BENCH_FRAC[P]}.`, P === 75 ? `¼ of ${fmtNum(W)} is ${fmtNum(W / 4)}. ¾ is three of those.` : `${BENCH_FRAC[P]} of ${fmtNum(W)} means ${fmtNum(W)} ÷ ${fmtNum(d)}.`],
    explanation: `${P}% = ${BENCH_FRAC[P]}, and ${BENCH_FRAC[P]} of ${fmtNum(W)} = ${fmtNum(ans)}.`,
    data: { P, W },
    model: P === 1 ? undefined : { type: "tape", parts: P === 10 ? 10 : P === 50 ? 2 : 4, shaded: P === 10 ? 1 : P === 50 ? 1 : P / 25, partLabel: P === 10 ? "10%" : P === 50 ? "50%" : "25%", shadedLabel: `${P}% = ?`, totalLabel: `100% = ${fmtNum(W)}` },
  });
}

const PART_P = [6, 12, 35, 15, 30, 45, 65, 80, 5, 20, 40, 125, 150, 200, 8];

function findPart(rng: Rng): U3Question {
  const P = pick(rng, PART_P);
  const isMoney = rng() < 0.5;
  const roundIt = isMoney && rng() < 0.3;
  if (isMoney) {
    const Wc = roundIt ? pick(rng, [1299, 2450, 1875, 3199, 899, 4625]) : pick(rng, [20, 45, 60, 80, 120, 15, 36, 250]) * 100;
    const exact = Wc * P; // hundredths of a cent
    const ans = roundDiv(exact, 100);
    const wrongs: Wrong[] = [
      { t: money(ans * 10), why: `Check the decimal point. ${P}% = ${fmtNum(P / 100)}, so it's ${fmtNum(P / 100)} × ${money(Wc)}.` },
      { t: money(ans / 10), why: `Check the decimal point. ${P}% = ${fmtNum(P / 100)}, not ${fmtNum(P / 1000)}.` },
      P < 100 ? { t: money(Wc - ans), why: `That's what's LEFT after taking ${P}%. You want the ${P}% part itself.` } : { t: money(ans - Wc), why: `That's only the part above 100%. ${P}% is the whole plus that.` },
    ];
    if (roundIt) wrongs.unshift({ t: money(Math.floor(exact / 100) === ans ? ans + 1 : Math.floor(exact / 100)), why: "Round to the NEAREST cent: look at the thousandths digit." });
    return make(rng, {
      kind: "findPart",
      prompt: `What is ${P}% of ${money(Wc)}?${roundIt ? " Round to the nearest cent." : ""}`,
      correct: money(ans),
      wrongs,
      hints: [`${P}% means ${P} per 100. Find 1% first, or use ${P}/100.`, `1% of ${money(Wc)} is ${money(Wc / 100).replace(/\.(\d\d)$/, ".$1")}${Wc % 100 ? "..." : ""}; ${P}% is ${P} times that.`],
      explanation: `${P}% of ${money(Wc)} = ${P}/100 × ${money(Wc)} = ${exactMoney(exact)}${roundIt ? `, which rounds to ${money(ans)}` : ""}.`,
      data: { P, Wc, money: 1 },
      model: { type: "dnl", topLabel: "percent", bottomLabel: "dollars", top: ["0%", `${P}%`, "100%"].sort((a, b) => parseInt(a) - parseInt(b)), bottom: [0, P, 100].sort((a, b) => a - b).map((p) => (p === 0 ? "$0" : p === 100 ? money(Wc) : "?")) },
    });
  }
  const unitW = 100 / gcd(P, 100);
  const W = unitW * pick(rng, unitW >= 20 ? [1, 2, 3, 4, 6] : unitW >= 4 ? [3, 5, 6, 8, 12] : [20, 30, 45, 60, 90]);
  const ans = (W * P) / 100;
  return make(rng, {
    kind: "findPart",
    prompt: `What is ${P}% of ${fmtNum(W)}?`,
    correct: fmtNum(ans),
    wrongs: [
      { t: fmtNum(ans * 10), why: `Check the decimal point. ${P}% = ${fmtNum(P / 100)}.` },
      { t: fmtNum(ans / 10), why: `Check the decimal point. ${P}% = ${fmtNum(P / 100)}, not ${fmtNum(P / 1000)}.` },
      P < 100 ? { t: fmtNum(W - ans), why: `That's what's LEFT after taking ${P}%.` } : { t: fmtNum(ans - W), why: `That's only the part above 100%.` },
      { t: fmtNum(W + P), why: `Adding ${P} isn't taking a percent. ${P}% of ${fmtNum(W)} = ${P}/100 × ${fmtNum(W)}.` },
    ],
    hints: [`${P}% means ${P} for every 100. How many hundreds (or parts of 100) are in ${fmtNum(W)}?`, `1% of ${fmtNum(W)} is ${fmtNum(W / 100)}. Multiply that by ${P}.`],
    explanation: `${P}% of ${fmtNum(W)} = ${P}/100 × ${fmtNum(W)} = ${fmtNum(ans)}.`,
    data: { P, W, money: 0 },
  });
}

function findWhole(rng: Rng): U3Question {
  const P = pick(rng, [10, 20, 25, 40, 50, 60, 75, 80, 120, 150, 5, 35]);
  const g = gcd(P, 100);
  const unitPart = pick(rng, [2, 3, 4, 5, 6, 8, 9, 12]);
  const part = (P / g) * unitPart;
  const W = (100 / g) * unitPart;
  const [ctx, u] = pick(rng, [["pages of a book are read", "pages"], ["seats in the gym are full", "seats"], ["songs on the playlist are played", "songs"], ["of a savings goal is saved", "$"]] as [string, string][]);
  const fmt = (x: number) => (u === "$" ? money(x * 100) : fmtNum(x));
  const prompt = u === "$" ? `${fmt(part)} is ${P}% of a savings goal. What is the whole goal?` : `${fmtNum(part)} ${ctx.split(" ")[0]} ${ctx.split(" ").slice(1).join(" ")}. That's ${P}% of all of them. How many in all?`;
  return make(rng, {
    kind: "findWhole",
    prompt: u === "$" ? prompt : prompt.replace(`${fmtNum(part)} pages of a book are read`, `${fmtNum(part)} pages of a book are read`),
    correct: fmt(W),
    wrongs: [
      { t: fmt((part * P) / 100), why: `You found ${P}% OF ${fmt(part)}. But ${fmt(part)} is the part; the whole is ${P < 100 ? "bigger" : "smaller"}.` },
      { t: fmt(part + 100 - P > 0 ? part + 100 - P : part + P), why: "Adding percents to an amount mixes them up. Find 1% (or 10%) first, then scale to 100%." },
      { t: fmt(W * 10), why: "Check the place value — that's 10 times too big." },
      { t: fmt(W / 10), why: "Check the place value — that's 10 times too small." },
    ],
    hints: [`${fmt(part)} is ${P}%. Find a smaller piece first, like ${g}%.`, `${P}% ÷ ${P / g} = ${g}%, so ${g}% = ${fmt(part)} ÷ ${P / g} = ${fmt(unitPart)}. 100% is ${100 / g} of those.`],
    explanation: `${g}% = ${fmt(unitPart)}, so 100% = ${100 / g} × ${fmt(unitPart)} = ${fmt(W)}.`,
    data: { P, part, money: u === "$" ? 1 : 0 },
    model: { type: "dnl", topLabel: "percent", bottomLabel: u === "$" ? "dollars" : u, top: (P < 100 ? [0, P, 100] : [0, 100, P]).map((p) => `${p}%`), bottom: (P < 100 ? [0, P, 100] : [0, 100, P]).map((p) => (p === 0 ? "0" : p === P ? fmt(part).replace(/^\$/, "$") : "?")) },
  });
}

function findPercent(rng: Rng): U3Question {
  const P = pick(rng, [25, 75, 50, 20, 40, 60, 10, 5, 150, 200, 12, 35, 6, 125]);
  const g = gcd(P, 100);
  const b = (100 / g) * pick(rng, [1, 2, 3, 4]);
  const a = (b * P) / 100;
  return make(rng, {
    kind: "findPercent",
    prompt: `${fmtNum(a)} is what percent of ${fmtNum(b)}?`,
    correct: `${P}%`,
    wrongs: [
      { t: `${fmtNum((b * 100) / a)}%`, why: `You divided ${fmtNum(b)} by ${fmtNum(a)} — flipped. Percent = part ÷ whole × 100.` },
      { t: `${fmtNum(a)}%`, why: `${fmtNum(a)} is the part, not the percent. Compare it to ${fmtNum(b)} as "out of 100".` },
      P < 100 ? { t: `${100 - P}%`, why: "That's the percent for the OTHER part." } : { t: `${P - 100}%`, why: `${fmtNum(a)} is more than ${fmtNum(b)}, so it's more than 100%.` },
      { t: `${fmtNum(P / 10)}%`, why: "Check the place value: percent is per 100." },
    ],
    hints: [`Write it as a fraction: ${fmtNum(a)} out of ${fmtNum(b)}. How can you make the "out of" 100?`, `${fmtNum(a)}/${fmtNum(b)} = ${fmtNum(a / b)}. Now write that per 100.`],
    explanation: `${fmtNum(a)} ÷ ${fmtNum(b)} = ${fmtNum(a / b)} = ${P} per 100 = ${P}%.`,
    data: { a, b },
    model: { type: "dnl", topLabel: "amount", bottomLabel: "percent", top: (a < b ? [0, a, b] : [0, b, a]).map(fmtNum), bottom: (a < b ? [0, a, b] : [0, b, a]).map((x) => (x === 0 ? "0%" : x === b ? "100%" : "?")) },
  });
}

const SHOP: Record<"discount" | "tax" | "tip", { items: string[]; P: number[] }> = {
  discount: { items: ["jacket", "pair of sneakers", "skateboard", "board game", "pair of headphones", "backpack"], P: [10, 15, 20, 25, 30, 35, 40, 12] },
  tax: { items: ["video game", "basketball", "art kit", "lamp", "pair of jeans"], P: [5, 6, 7, 8] },
  tip: { items: ["pizza dinner", "taco lunch", "pancake breakfast", "noodle dinner"], P: [15, 18, 20, 25, 10] },
};

function shopping(rng: Rng, kind: "discount" | "tax" | "tip"): U3Question {
  const S = SHOP[kind];
  const item = pick(rng, S.items);
  const P = pick(rng, S.P);
  const roundIt = rng() < 0.3;
  const price = roundIt ? pick(rng, [1299, 2499, 1850, 3675, 4199, 2725, 1999]) : kind === "discount" ? pick(rng, [24, 30, 40, 48, 60, 80, 90, 120]) * 100 : pick(rng, [2000, 2400, 1850, 3600, 4500, 5000, 1200, 3250]);
  const exact = price * P; // hundredths of a cent
  const amt = roundDiv(exact, 100);
  const cut = kind === "discount";
  const ans = cut ? price - amt : price + amt;
  const word = kind === "discount" ? "discount" : kind === "tax" ? "tax" : "tip";
  const truncated = cut ? price - Math.floor(exact / 100) : price + Math.floor(exact / 100);
  const wrongs: Wrong[] = [
    { t: money(amt), why: cut ? "That's the discount — what does the customer pay?" : `That's the ${word} — add it to the ${kind === "tip" ? "bill" : "price"} for the total.` },
    { t: money(cut ? price + amt : price - amt), why: cut ? "A discount comes OFF the price: subtract it." : `A ${word} is ADDED to the ${kind === "tip" ? "bill" : "price"}, not taken away.` },
    { t: money(cut ? price - P * 100 : price + P * 100), why: `${P}% isn't ${money(P * 100)}. Find ${P}% of ${money(price)} first.` },
  ];
  if (roundIt && truncated !== ans) wrongs.unshift({ t: money(truncated), why: `Round the ${word} to the NEAREST cent before you ${cut ? "subtract" : "add"} — look at the thousandths digit.` });
  wrongs.push({ t: money(cut ? price - amt * 10 : price + amt * 10), why: `Check the decimal point: ${P}% = ${fmtNum(P / 100)}.` });
  wrongs.push({ t: money(cut ? price - roundDiv(amt, 10) : price + roundDiv(amt, 10)), why: `Check the decimal point: ${P}% = ${fmtNum(P / 100)}, not ${fmtNum(P / 1000)}.` });
  wrongs.push({ t: money(cut ? roundDiv(price * (100 + P), 100) + 100 : roundDiv(price * (100 - P), 100)), why: cut ? "A discount makes the price go DOWN." : `A ${word} makes the total go UP.` });
  const prompt =
    kind === "discount"
      ? `A ${money(price)} ${item} is on sale for ${P}% off. What is the sale price?${roundIt ? " (Round to the cent.)" : ""}`
      : kind === "tax"
        ? `A ${item} costs ${money(price)}. Sales tax is ${P}%. What is the total cost?${roundIt ? " (Round to the cent.)" : ""}`
        : `The bill for a ${item} is ${money(price)}. ${pick(rng, NAMES)}'s family leaves a ${P}% tip. What is the total with the tip?${roundIt ? " (Round to the cent.)" : ""}`;
  return make(rng, {
    kind,
    prompt,
    correct: money(ans),
    wrongs,
    hints: [`Two steps: find the ${word} (${P}% of ${money(price)}), then ${cut ? "subtract it from" : "add it to"} the ${kind === "tip" ? "bill" : "price"}.`, `${P}% of ${money(price)} = ${exactMoney(exact)}${roundIt ? " (round it to the cent)" : ""}. Now ${cut ? "take that away from" : "add that to"} ${money(price)}.`],
    explanation: `${word[0].toUpperCase()}${word.slice(1)}: ${P}% of ${money(price)} = ${money(amt)}. ${cut ? `${money(price)} − ${money(amt)}` : `${money(price)} + ${money(amt)}`} = ${money(ans)}.`,
    data: { price, P },
    model: { type: "tape", parts: cut ? 2 : 2, shaded: 1, partLabel: "", shadedLabel: cut ? `${P}% off` : `${100}%`, totalLabel: cut ? `100% = ${money(price)}` : `+ ${P}% ${word}` },
  });
}

/* ================================================================== Section E · Paint the Room */

export interface Room {
  L: number;
  W: number;
  H: number;
  doorW: number;
  doorH: number;
  windows: number;
  winW: number;
  winH: number;
  coats: number;
  cover: number;
  /** One-gallon can price and the "big deal" bucket (holds bucketGal, cheaper per gallon). */
  canC: number;
  bucketGal: number;
  bucketC: number;
  taxP: number;
}

export function wallArea(r: Room) {
  return 2 * (r.L + r.W) * r.H;
}
export function paintArea(r: Room) {
  return wallArea(r) - r.doorW * r.doorH - r.windows * r.winW * r.winH;
}
export function gallonsNeeded(r: Room) {
  return Math.ceil((paintArea(r) * r.coats) / r.cover);
}

/** Cheapest way to get at least `need` gallons from cans (1 gal) and buckets; returns [cans, buckets, cents]. */
export function cheapestBuy(need: number, canC: number, bucketGal: number, bucketC: number): [number, number, number][] {
  const out: [number, number, number][] = [];
  for (let b = 0; b <= Math.ceil(need / bucketGal) + 1; b++) {
    const cans = Math.max(0, Math.ceil(need - b * bucketGal - 1e-9));
    out.push([cans, b, cans * canC + b * bucketC]);
  }
  return out.sort((x, y) => x[2] - y[2]);
}

export function newRoom(rng: Rng): Room {
  for (;;) {
    const r: Room = {
      L: pick(rng, [10, 11, 12, 14, 15, 16]),
      W: pick(rng, [8, 9, 10, 12]),
      H: pick(rng, [8, 9, 10]),
      doorW: 3,
      doorH: 7,
      windows: pick(rng, [1, 2]),
      winW: pick(rng, [3, 4]),
      winH: pick(rng, [3, 4]),
      coats: pick(rng, [2, 2, 3, 1]),
      cover: pick(rng, [350, 400]),
      canC: pick(rng, [2800, 3000, 3200, 2600, 3500]),
      bucketGal: 1.5,
      bucketC: 0,
      taxP: pick(rng, [5, 6, 7, 8]),
    };
    const need = (paintArea(r) * r.coats) / r.cover;
    const G = gallonsNeeded(r);
    if (Number.isInteger(need) || G < 2 || G > 4 || Math.floor(need) === 0) continue;
    r.bucketGal = G === 2 ? 1.5 : G === 3 ? 2.5 : 3.5;
    // The bucket is cheaper per gallon, but one bucket isn't enough, and every mix with buckets costs more than cans.
    const per = r.canC / 100;
    const lo = Math.ceil(r.bucketGal * per * 0.8);
    let ok = false;
    for (let d = lo; d < r.bucketGal * per; d++) {
      r.bucketC = d * 100;
      const opts = cheapestBuy(G, r.canC, r.bucketGal, r.bucketC);
      if (opts[0][1] === 0 && opts[1][2] > opts[0][2] && r.bucketC / r.bucketGal < r.canC) {
        ok = true;
        break;
      }
    }
    if (ok) return r;
  }
}

const roomLine = (r: Room) => `Your room is ${r.L} ft by ${r.W} ft, with walls ${r.H} ft tall.`;

export function paintQuestion(rng: Rng, r: Room, step: number): U3Question {
  const A = wallArea(r);
  const door = r.doorW * r.doorH;
  const win = r.winW * r.winH;
  const S = paintArea(r);
  const total = S * r.coats;
  const G = gallonsNeeded(r);
  const exactG = total / r.cover;
  const head = `Paint the Room · step ${step} of 5. `;
  const data = { ...r } as unknown as Record<string, number>;
  if (step === 1) {
    const per = 2 * (r.L + r.W);
    return make(rng, {
      kind: "paintWalls",
      step,
      prompt: `${head}${roomLine(r)} What is the total area of all four walls?`,
      correct: `${fmtNum(A)} sq ft`,
      wrongs: [
        { t: `${per} sq ft`, why: `${per} ft is the perimeter (the distance around) — you stopped after step one. Multiply by the wall height.` },
        { t: `${r.L * r.W} sq ft`, why: "That's the FLOOR area. You're painting the walls: perimeter × height." },
        { t: `${(r.L + r.W) * r.H} sq ft`, why: "That's only two walls. A room has four: two of each size." },
        { t: `${fmtNum(A * 10)} sq ft`, why: "Check the place value — that's 10 times too big." },
      ],
      hints: ["Unroll the four walls into one long strip. How long is the strip? How tall?", `The strip is the perimeter: ${r.L} + ${r.W} + ${r.L} + ${r.W} = ${per} ft long and ${r.H} ft tall.`],
      explanation: `Perimeter ${per} ft × height ${r.H} ft = ${fmtNum(A)} sq ft of wall.`,
      data,
      model: { type: "table", head: ["Wall", "Size", "Area"], rows: [["2 long", `${r.L} × ${r.H}`, "?"], ["2 short", `${r.W} × ${r.H}`, "?"]] },
    });
  }
  if (step === 2) {
    const wn = r.windows === 1 ? "a window" : `${r.windows} windows`;
    return make(rng, {
      kind: "paintSubtract",
      step,
      prompt: `${head}The four walls are ${fmtNum(A)} sq ft. You won't paint the door (${r.doorW} ft × ${r.doorH} ft) or ${wn} (${r.winW} ft × ${r.winH} ft${r.windows > 1 ? " each" : ""}). How many square feet will you paint?`,
      correct: `${fmtNum(S)} sq ft`,
      wrongs: [
        { t: `${fmtNum(door + r.windows * win)} sq ft`, why: "That's the area you WON'T paint — you stopped after step one. Subtract it from the walls." },
        { t: `${fmtNum(A - door)} sq ft`, why: `You took away the door but forgot the ${r.windows === 1 ? "window" : "windows"}.` },
        { t: `${fmtNum(A - (r.doorW + r.doorH) - r.windows * (r.winW + r.winH))} sq ft`, why: "You subtracted lengths, not areas. Door area = width × height, and the same for windows." },
        { t: `${fmtNum(A + door + r.windows * win)} sq ft`, why: "Doors and windows are taken AWAY, not added." },
        r.windows > 1 ? { t: `${fmtNum(A - door - win)} sq ft`, why: `There are ${r.windows} windows — subtract each one.` } : { t: `${fmtNum(A - win)} sq ft`, why: "You took away the window but forgot the door." },
      ],
      hints: ["Find the area of the door and of the window(s), then take them away from the walls.", `Door: ${r.doorW} × ${r.doorH} = ${door} sq ft. Window${r.windows > 1 ? "s" : ""}: ${r.windows > 1 ? `${r.windows} × ` : ""}${r.winW} × ${r.winH} = ${r.windows * win} sq ft.`],
      explanation: `${fmtNum(A)} − ${door} (door) − ${r.windows * win} (window${r.windows > 1 ? "s" : ""}) = ${fmtNum(S)} sq ft to paint.`,
      data,
    });
  }
  if (step === 3) {
    const coatsTxt = r.coats === 1 ? "1 coat" : `${r.coats} coats`;
    return make(rng, {
      kind: "paintGallons",
      step,
      prompt: `${head}You'll paint ${fmtNum(S)} sq ft with ${coatsTxt}. One gallon covers ${r.cover} sq ft. Paint is sold by the whole gallon. How many gallons must you buy?`,
      correct: `${G} gallons`,
      wrongs: [
        { t: `${G - 1} ${plural(G - 1, "gallon", "gallons")}`, why: `${fmtNum(total)} ÷ ${r.cover} = ${fmtNum(exactG)}. Rounding DOWN leaves part of the wall bare — round UP so you have enough.` },
        { t: `${fmtNum(exactG)} gallons`, why: `${fmtNum(exactG)} is the exact (unrounded) amount, but stores sell whole gallons. Round UP.` },
        { t: `${Math.ceil(S / r.cover)} ${plural(Math.ceil(S / r.cover), "gallon", "gallons")}`, why: r.coats > 1 ? `Don't forget the coats: ${r.coats} coats means painting ${fmtNum(S)} sq ft ${r.coats} times.` : "Check the division." },
        { t: `${G + 1} gallons`, why: `${G + 1} gallons is more than you need. ${fmtNum(exactG)} rounds up to ${G}.` },
        { t: `${G * 2} gallons`, why: `More than you need: ${fmtNum(exactG)} rounds up to ${G}.` },
        { t: `${fmtNum(exactG / r.coats)} gallons`, why: `Don't forget the coats, and round UP to whole gallons.` },
      ],
      hints: [`First find the total area to cover with ${coatsTxt}. Then how many ${r.cover}s fit?`, `${fmtNum(S)} × ${r.coats} = ${fmtNum(total)} sq ft. ${fmtNum(total)} ÷ ${r.cover} = ${fmtNum(exactG)}... Can you buy part of a can?`],
      explanation: `${fmtNum(S)} × ${r.coats} = ${fmtNum(total)} sq ft, ÷ ${r.cover} = ${fmtNum(exactG)} gallons, so buy ${G} (always round UP for paint).`,
      data,
    });
  }
  if (step === 4) {
    const per = roundDiv(r.bucketC * 2, r.bucketGal * 2);
    const buckets = Math.ceil(G / r.bucketGal);
    return make(rng, {
      kind: "paintBuy",
      step,
      prompt: `${head}You need ${G} gallons. Cans: 1 gallon for ${money(r.canC)}. "Big Deal" bucket: ${fmtNum(r.bucketGal)} gallons for ${money(r.bucketC)} (only ${money(per)} per gallon!). What is the cheapest way to get ENOUGH paint?`,
      correct: `${G} cans for ${money(G * r.canC)}`,
      wrongs: [
        { t: `1 bucket for ${money(r.bucketC)}`, why: `The bucket IS cheaper per gallon, but ${fmtNum(r.bucketGal)} gallons isn't enough — you need ${G}.` },
        { t: `${G - 1} ${plural(G - 1, "can", "cans")} for ${money((G - 1) * r.canC)}`, why: `${G - 1} gallon${G - 1 === 1 ? "" : "s"} isn't enough — you need ${G}.` },
        { t: `${buckets} buckets for ${money(buckets * r.bucketC)}`, why: `${buckets} buckets hold enough (${fmtNum(buckets * r.bucketGal)} gal), but cost ${money(buckets * r.bucketC)} — more than ${G} cans.` },
        { t: `1 bucket + 1 can for ${money(r.bucketC + r.canC)}`, why: `That's enough paint, but ${money(r.bucketC + r.canC)} costs more than ${G} cans.` },
      ],
      hints: ["Cheaper per gallon only helps if you get ENOUGH paint. Which choices give at least the gallons you need?", `${G} cans = ${G} × ${money(r.canC)}. Buckets: you'd need ${buckets} of them = ${buckets} × ${money(r.bucketC)}. Compare.`],
      explanation: `One bucket (${fmtNum(r.bucketGal)} gal) is not enough. ${G} cans cost ${money(G * r.canC)}; ${buckets} buckets cost ${money(buckets * r.bucketC)}. Cheapest with enough paint: ${G} cans.`,
      data,
      model: { type: "table", head: ["Choice", "Gallons", "Cost"], rows: [[`${G} cans`, `${G}`, "?"], ["1 bucket", fmtNum(r.bucketGal), money(r.bucketC)], [`${buckets} buckets`, fmtNum(buckets * r.bucketGal), "?"]] },
    });
  }
  const T = G * r.canC;
  const exactTax = T * r.taxP;
  const tax = roundDiv(exactTax, 100);
  return make(rng, {
    kind: "paintTax",
    step: 5,
    prompt: `${head}${G} cans cost ${money(T)} before tax. Sales tax is ${r.taxP}%. What is the total at the register?`,
    correct: money(T + tax),
    wrongs: [
      { t: money(tax), why: "That's just the tax — you stopped after step one. Add it to the price." },
      { t: money(T - tax), why: "Sales tax is ADDED to the price, not taken away." },
      { t: money(T + r.taxP * 100), why: `${r.taxP}% isn't ${money(r.taxP * 100)}. Find ${r.taxP}% of ${money(T)}.` },
      { t: money(T + tax * 10), why: `Check the decimal point: ${r.taxP}% = ${fmtNum(r.taxP / 100)}.` },
    ],
    hints: [`Find ${r.taxP}% of ${money(T)}, then add it on.`, `${r.taxP}% of ${money(T)} = ${fmtNum(r.taxP / 100)} × ${money(T)}. Now add that to ${money(T)}.`],
    explanation: `Tax: ${r.taxP}% of ${money(T)} = ${money(tax)}. Total: ${money(T)} + ${money(tax)} = ${money(T + tax)}. Room painted!`,
    data,
  });
}

/* ================================================================== Bridge · scale factors (7th grade) */

function copier(rng: Rng): U3Question {
  const P = pick(rng, [50, 80, 150, 200, 125, 75]);
  const len = pick(rng, [8, 12, 16, 20, 24, 40]);
  const ans = (len * P) / 100;
  return make(rng, {
    kind: "copier",
    prompt: `A drawing is ${len} cm long. The copier is set to ${P}%. How long is the copy?`,
    correct: `${fmtNum(ans)} cm`,
    wrongs: [
      { t: `${fmtNum((len * 100) / P)} cm`, why: `That's the reciprocal — going backwards. A ${P}% copy multiplies lengths by ${fmtNum(P / 100)}.` },
      P > 100 ? { t: `${fmtNum(len * (P - 100) / 100)} cm`, why: `That's only the extra ${P - 100}%. ${P}% is the whole plus that.` } : { t: `${fmtNum(len - ans)} cm`, why: `That's how much SHORTER it got. The copy is ${P}% of the original.` },
      { t: `${fmtNum(len + P)} cm`, why: `Adding ${P} isn't scaling. ${P}% = × ${fmtNum(P / 100)}.` },
      { t: `${fmtNum(ans * 10)} cm`, why: "Check the decimal point." },
    ],
    hints: [`A copier percent is a scale factor: ${P}% = × ${fmtNum(P / 100)}.`, `${len} × ${fmtNum(P / 100)} — is the copy bigger or smaller than ${len} cm?`],
    explanation: `${P}% = × ${fmtNum(P / 100)}, so ${len} × ${fmtNum(P / 100)} = ${fmtNum(ans)} cm.`,
    data: { P, len },
  });
}

function enlargedBy(rng: Rng): U3Question {
  const p = pick(rng, [50, 25, 100, 20, 10]);
  const w = pick(rng, [8, 10, 12, 20, 40, 16]);
  const ans = (w * (100 + p)) / 100;
  return make(rng, {
    kind: "enlargedBy",
    prompt: `A photo is ${w} cm wide. It is enlarged BY ${p}%. How wide is the new photo?`,
    correct: `${fmtNum(ans)} cm`,
    wrongs: [
      { t: `${fmtNum((w * p) / 100)} cm`, why: `That's just the ${p}% that gets ADDED. Enlarged BY ${p}% means ${100 + p}% of the original.` },
      { t: `${fmtNum(w + p)} cm`, why: `It grew by ${p} PERCENT, not ${p} cm. ${100 + p}% of ${w} = ${fmtNum((100 + p) / 100)} × ${w}.` },
      { t: `${fmtNum((w * p) / 100 + p)} cm`, why: `Start from the original: ${100 + p}% of ${w}.` },
      { t: `${fmtNum(ans * 10)} cm`, why: "Check the decimal point." },
    ],
    hints: [`"Enlarged BY ${p}%" means the whole picture (100%) plus ${p}% more. What percent is that?`, `100% + ${p}% = ${100 + p}% = × ${fmtNum((100 + p) / 100)}. Multiply ${w} by that.`],
    explanation: `Enlarged by ${p}% = ${100 + p}% of the original: ${w} × ${fmtNum((100 + p) / 100)} = ${fmtNum(ans)} cm.`,
    data: { p, w },
  });
}

function areaScale(rng: Rng): U3Question {
  const P = pick(rng, [200, 300, 50, 150]);
  const A = pick(rng, P === 150 ? [8, 12, 20, 24, 40] : [6, 10, 12, 18, 20, 24]);
  const f = P / 100;
  const ans = A * f * f;
  return make(rng, {
    kind: "areaScale",
    prompt: `A rectangle has an area of ${A} sq in. It is copied at ${P}% (every length × ${fmtNum(f)}). What is the area of the copy?`,
    correct: `${fmtNum(ans)} sq in`,
    wrongs: [
      { t: `${fmtNum(A * f)} sq in`, why: `That's only step one: lengths scale by ${fmtNum(f)}, but area uses TWO lengths (length and width), so it scales by ${fmtNum(f)} × ${fmtNum(f)}.` },
      { t: `${fmtNum(A * 2 * f)} sq in`, why: `Area scales by the factor SQUARED (${fmtNum(f)} × ${fmtNum(f)}), not doubled.` },
      { t: `${fmtNum(A / (f * f))} sq in`, why: "That goes backwards. The copy is the one that changed size." },
      { t: `${fmtNum(A * f * f * f)} sq in`, why: "That's the factor cubed — that's for volume. Area is factor × factor." },
    ],
    hints: ["Area = length × width. What happens to EACH of those?", `Length × ${fmtNum(f)} and width × ${fmtNum(f)}, so area × ${fmtNum(f)} × ${fmtNum(f)} = × ${fmtNum(f * f)}.`],
    explanation: `Area scales by the factor squared: ${A} × ${fmtNum(f)} × ${fmtNum(f)} = ${fmtNum(ans)} sq in.`,
    data: { P, A },
  });
}

function reverseCopy(rng: Rng): U3Question {
  const P = pick(rng, [150, 200, 50, 125, 80]);
  const orig = pick(rng, [4, 8, 12, 16, 20]);
  const c = (orig * P) / 100;
  return make(rng, {
    kind: "reverseCopy",
    prompt: `A copy made at ${P}% is ${fmtNum(c)} cm long. How long was the original?`,
    correct: `${fmtNum(orig)} cm`,
    wrongs: [
      { t: `${fmtNum((c * P) / 100)} cm`, why: `You scaled it AGAIN. To go back to the original, divide by ${fmtNum(P / 100)} (the reciprocal).` },
      { t: `${fmtNum(c - (P - 100 > 0 ? P - 100 : 100 - P) > 0 ? c - Math.abs(P - 100) : c + Math.abs(P - 100))} cm`, why: "Percents scale by multiplying, not adding or subtracting." },
      { t: `${fmtNum(c)} cm`, why: `The copy changed size at ${P}%, so the original is different.` },
      { t: `${fmtNum(orig * 10)} cm`, why: "Check the decimal point." },
    ],
    hints: [`copy = original × ${fmtNum(P / 100)}. How do you undo × ${fmtNum(P / 100)}?`, `Divide: ${fmtNum(c)} ÷ ${fmtNum(P / 100)}.`],
    explanation: `${fmtNum(c)} ÷ ${fmtNum(P / 100)} = ${fmtNum(orig)} cm (the reciprocal factor takes you back).`,
    data: { P, c },
  });
}

function scaleRatio(rng: Rng): U3Question {
  const n = pick(rng, [2, 4, 5, 6, 8, 10, 20]);
  const ans = 12 * n;
  return make(rng, {
    kind: "scaleRatio",
    prompt: `A map scale says 1 inch to ${n} feet. With the same units on both sides, the scale is 1 : ?`,
    correct: `1 : ${ans}`,
    wrongs: [
      { t: `1 : ${n}`, why: `The units aren't the same yet: change ${n} feet to inches (× 12).` },
      { t: `1 : ${n * 100}`, why: "1 foot = 12 inches, not 100." },
      { t: `1 : ${fmtNum(n / 12)}`, why: "You divided. Inches are smaller than feet, so there are MORE of them: × 12." },
      { t: `1 : ${n + 12}`, why: "Adding doesn't convert. Multiply by 12." },
    ],
    hints: ["A scale is a rate. Make both sides inches.", `${n} feet = ${n} × 12 inches.`],
    explanation: `${n} ft = ${ans} in, so 1 in : ${n} ft = 1 : ${ans}.`,
    data: { n },
  });
}

/* ------------------------------------------------------------------ registry */

export interface GenOpts {
  dir?: Dir;
  room?: Room;
  step?: number;
}

export function generate(kind: KindId, rng: Rng = Math.random, opts: GenOpts = {}): U3Question {
  const dir: Dir = opts.dir ?? (rng() < 0.5 ? "toSmaller" : "toBigger");
  switch (kind) {
    case "washTime": return washTime(rng);
    case "washHours": return washHours(rng);
    case "towerHeight": return towerHeight(rng);
    case "elevator": return elevator(rng);
    case "crewCost": return crewCost(rng);
    case "stairs": return stairs(rng);
    case "unitAnchor": return unitAnchor(rng);
    case "biggerNumber": return biggerNumber(rng);
    case "moreOrFewer": return moreOrFewer(rng);
    case "convert": return convert(rng, dir);
    case "convert2": return convert2(rng, dir);
    case "convertFrac": return convertFrac(rng, dir);
    case "unitCost": return unitCost(rng, dir);
    case "whoFaster": return whoFaster(rng);
    case "betterDeal": return betterDeal(rng);
    case "unitPriceRound": return unitPriceRound(rng);
    case "twoRates": return twoRates(rng);
    case "sameRate": return sameRate(rng);
    case "paceCompare": return paceCompare(rng);
    case "speedToPace": return speedToPace(rng);
    case "paceToSpeed": return paceToSpeed(rng);
    case "fastestPace": return fastestPace(rng);
    case "unitThenTotal": return unitThenTotal(rng);
    case "roundAtEnd": return roundAtEnd(rng);
    case "timeForDistance": return timeForDistance(rng);
    case "recipeBatch": return recipeBatch(rng);
    case "cookieScale": return cookieScale(rng);
    case "gasOp": return gasOp(rng);
    case "percentMeaning": return percentMeaning(rng);
    case "ticketPercent": return ticketPercent(rng);
    case "outOf": return outOf(rng);
    case "dnlPart": return dnlPart(rng);
    case "dnlWhole": return dnlWhole(rng);
    case "tapeWhole": return tapeWhole(rng);
    case "tapePart": return tapePart(rng);
    case "benchmark": return benchmark(rng);
    case "findPart": return findPart(rng);
    case "findWhole": return findWhole(rng);
    case "findPercent": return findPercent(rng);
    case "discount": case "tax": case "tip": return shopping(rng, kind);
    case "paintWalls": return paintQuestion(rng, opts.room ?? newRoom(rng), 1);
    case "paintSubtract": return paintQuestion(rng, opts.room ?? newRoom(rng), 2);
    case "paintGallons": return paintQuestion(rng, opts.room ?? newRoom(rng), 3);
    case "paintBuy": return paintQuestion(rng, opts.room ?? newRoom(rng), 4);
    case "paintTax": return paintQuestion(rng, opts.room ?? newRoom(rng), 5);
    case "copier": return copier(rng);
    case "enlargedBy": return enlargedBy(rng);
    case "areaScale": return areaScale(rng);
    case "reverseCopy": return reverseCopy(rng);
    case "scaleRatio": return scaleRatio(rng);
    case "comboDeal": case "comboRunner": case "comboTank": case "comboShop": case "comboPaint":
      return makeCombo(kind, rng).final;
  }
}

/** Kinds that convert units (their direction alternates so both ways come up equally). */
export const DIR_KINDS: KindId[] = ["convert", "convert2", "convertFrac", "unitCost"];
export const PAINT_STEPS: KindId[] = ["paintWalls", "paintSubtract", "paintGallons", "paintBuy", "paintTax"];

/** Kinds for one skill tag. */
export function kindsForTag(tag: number): KindId[] {
  return KIND_IDS.filter((k) => KIND_META[k].tag === tag);
}

/* ================================================================== COMBO story problems (2-5 steps) */

/*
 * A combo is a short story with a final question. In a boss fight the player first gets the FINAL
 * answer (its wrong choices include the step answers, named "That's only step k"). Right first try is a
 * big combo. If not, the problem breaks into its steps: each step is its own question with its own
 * skill tag, the story and the results so far stay on screen, and the last step asks for the final
 * answer again. The chain as a whole carries the combo's tag (8, 11, 16 or 17).
 */

export type ComboKind = "comboDeal" | "comboRunner" | "comboTank" | "comboShop" | "comboPaint";
export const COMBO_KINDS: ComboKind[] = ["comboDeal", "comboRunner", "comboTank", "comboShop", "comboPaint"];

export interface ComboStep {
  q: U3Question;
  /** "Work so far" line once this step is done, e.g. "Store A: $1.25 each". */
  result: string;
  /** The step's numeric answer (cents for money). */
  value: number;
  /** Unit family of the value ("$", "min", "gal", "sq ft"...), to match it with the final answer's unit. */
  unit: string;
}

export interface Combo {
  kind: ComboKind;
  tag: number;
  title: string;
  story: string;
  /** The final-answer question (its prompt is the story plus the ask). */
  final: U3Question;
  finalValue: number;
  finalUnit: string;
  steps: ComboStep[];
  data: Record<string, number | string>;
}

const stepLabel = (k: number, n: number) => (k === n ? "Last step" : `Step ${k}`);
const onlyStep = (k: number, what: string) => `That's only step ${k} (${what}) — keep going!`;

function comboDeal(rng: Rng): Combo {
  const name = pick(rng, NAMES);
  const thing = pick(rng, ["headbands", "practice swords", "water bottles", "towels", "belts"]);
  let n1 = 4, n2 = 6, u1 = 150, u2 = 125, m = 10;
  for (let k = 0; k < 500; k++) {
    n1 = pick(rng, [3, 4, 5, 6]);
    n2 = pick(rng, [6, 8, 10, 12]);
    u1 = pick(rng, [125, 150, 175, 200, 225, 250, 300]);
    u2 = u1 + pick(rng, [-50, -25, 25, 50, 75]);
    m = pick(rng, [7, 9, 11, 14, 15, 20]);
    const lo0 = Math.min(u1, u2) * m;
    if (u2 > 0 && u2 !== u1 && n1 !== n2 && m !== n1 && m !== n2 && lo0 !== n1 * u1 && lo0 !== n2 * u2) break;
  }
  const P1 = n1 * u1, P2 = n2 * u2;
  const lo = Math.min(u1, u2), hi = Math.max(u1, u2);
  const cheap = u1 < u2 ? "A" : "B";
  const ans = lo * m;
  const story = `${name} the shopkeeper ninja needs ${m} ${thing} for the dojo. Store A sells ${n1} for ${money(P1)}. Store B sells ${n2} for ${money(P2)}.`;
  const data = { n1, P1, n2, P2, m };
  const unitQ = (k: number, store: string, n: number, P: number, u: number) =>
    make(rng, {
      kind: "comboDeal", tag: 4, twoStep: false, data,
      prompt: `${stepLabel(k, 3)}: What is Store ${store}'s price for ONE?`,
      correct: money(u),
      wrongs: [
        { t: money(P), why: `That's the price of the whole pack of ${n}. Divide by ${n}.` },
        { t: money(P * n), why: `You multiplied. One costs ${money(P)} ÷ ${n}.` },
        { t: money(roundDiv(n * 10000, P)), why: `That's ${thing} per dollar, flipped. Divide price ÷ ${n}.` },
        { t: money(u * 10), why: "Check the decimal point." },
        { t: money(roundDiv(u, 10)), why: "Check the decimal point." },
      ],
      hints: ["Unit price = price ÷ number of items.", `${money(P)} ÷ ${n} = ?`],
      explanation: `${money(P)} ÷ ${n} = ${money(u)} each.`,
    });
  const s1 = unitQ(1, "A", n1, P1, u1);
  const s2 = unitQ(2, "B", n2, P2, u2);
  const s3 = make(rng, {
    kind: "comboDeal", tag: 8, twoStep: false, data,
    prompt: `${stepLabel(3, 3)}: Buy at the cheaper store. How much do ${m} ${thing} cost?`,
    correct: money(ans),
    wrongs: [
      { t: money(hi * m), why: `That's at the MORE expensive store. ${money(lo)} each is cheaper than ${money(hi)}.` },
      { t: money(lo), why: `That's for ONE. You need ${m}.` },
      { t: money((cheap === "A" ? P1 : P2) * m), why: `That's ${m} whole packs! Use the price for one: ${money(lo)} × ${m}.` },
      { t: money(ans * 10), why: "Check the decimal point." },
      { t: money(lo * (m + 1)), why: `Count again: you need ${m}.` },
    ],
    hints: ["Which price for one is lower?", `Store ${cheap} is ${money(lo)} each. Multiply by ${m}.`],
    explanation: `Store ${cheap}: ${money(lo)} × ${m} = ${money(ans)}.`,
  });
  const final = make(rng, {
    kind: "comboDeal", data,
    prompt: `${story} How much will ${m} ${thing} cost at the cheaper store?`,
    correct: money(ans),
    wrongs: [
      { t: money(u1), why: onlyStep(1, "Store A's price for one") },
      { t: money(u2), why: onlyStep(2, "Store B's price for one") },
      { t: money(hi * m), why: `That's ${m} at the MORE expensive store. Compare the prices for one first.` },
      { t: money(ans * 10), why: "Check the decimal point." },
    ],
    hints: ["Find each store's price for ONE, then buy at the cheaper one.", `Store A: ${money(P1)} ÷ ${n1}. Store B: ${money(P2)} ÷ ${n2}. Then × ${m}.`],
    explanation: `Store A ${money(u1)} each, Store B ${money(u2)} each. Store ${cheap} is cheaper: ${money(lo)} × ${m} = ${money(ans)}.`,
  });
  return {
    kind: "comboDeal", tag: 8, title: "DEAL OR STEAL", story, final, finalValue: ans, finalUnit: "$", data,
    steps: [
      { q: s1, result: `Store A: ${money(u1)} each`, value: u1, unit: "$" },
      { q: s2, result: `Store B: ${money(u2)} each`, value: u2, unit: "$" },
      { q: s3, result: `${m} at Store ${cheap}: ${money(ans)}`, value: ans, unit: "$" },
    ],
  };
}

function comboRunner(rng: Rng): Combo {
  const [A, B] = two(rng);
  let p = 8, s = 10, d = 3;
  for (let k = 0; k < 500; k++) {
    p = pick(rng, [6, 7, 8, 9, 10, 12]);
    s = pick(rng, [5, 6, 7.5, 8, 10, 12]);
    d = pick(rng, [2, 3, 4, 5, 6]);
    const tA = p * d, pB = 60 / s, tB = pB * d, diff = Math.abs(tA - tB);
    if (pB !== p && new Set([tA, pB, tB, diff]).size === 4 && diff > 0) break;
  }
  const tA = p * d, pB = 60 / s, tB = pB * d, diff = Math.abs(tA - tB);
  const faster = tA < tB ? A : B;
  const mins = (x: number) => `${fmtNum(x)} min`;
  const story = `${A} runs a ${d}-mile dojo race at a pace of ${p} minutes per mile. ${B} runs the same race at ${fmtNum(s)} miles per hour.`;
  const data = { p, s, d, A, B };
  const s1 = make(rng, {
    kind: "comboRunner", tag: 8, twoStep: false, data,
    prompt: `Step 1: How many minutes does ${A} take for the ${d} miles?`,
    correct: mins(tA),
    wrongs: [
      { t: mins(p), why: `That's ONE mile. The race is ${d} miles.` },
      { t: mins(p + d), why: `Adding doesn't work: ${d} miles at ${p} minutes EACH is ${p} × ${d}.` },
      { t: mins(p / d), why: `You divided. Each of the ${d} miles takes ${p} minutes: multiply.` },
      { t: mins(tA * 10), why: "Check the place value." },
    ],
    hints: ["Pace = minutes for one mile. How many miles are there?", `${p} minutes × ${d} miles.`],
    explanation: `${p} × ${d} = ${fmtNum(tA)} minutes.`,
  });
  const s2 = make(rng, {
    kind: "comboRunner", tag: 7, twoStep: false, data,
    prompt: `Step 2: Change ${B}'s speed to a pace. How many minutes per mile is ${fmtNum(s)} mph?`,
    correct: `${fmtNum(pB)} min per mile`,
    wrongs: [
      { t: `${fmtNum(s)} min per mile`, why: "That's the speed. Pace is minutes for ONE mile: 60 ÷ speed." },
      { t: `${fmtNum(60 * s)} min per mile`, why: `You multiplied. ${fmtNum(s)} miles in 60 minutes: 60 ÷ ${fmtNum(s)}.` },
      { t: `${fmtNum(60 - s)} min per mile`, why: `Subtracting doesn't find a rate. Divide 60 by ${fmtNum(s)}.` },
    ],
    hints: ["An hour is 60 minutes.", `${fmtNum(s)} miles in 60 minutes → 60 ÷ ${fmtNum(s)} minutes for one mile.`],
    explanation: `60 ÷ ${fmtNum(s)} = ${fmtNum(pB)} minutes per mile.`,
  });
  const s3 = make(rng, {
    kind: "comboRunner", tag: 8, twoStep: false, data,
    prompt: `Step 3: How many minutes does ${B} take for the ${d} miles?`,
    correct: mins(tB),
    wrongs: [
      { t: mins(pB), why: `That's one mile. Multiply by ${d}.` },
      { t: mins(s * d), why: `Use the pace (${fmtNum(pB)} min per mile), not the speed.` },
      { t: mins(pB + d), why: `${d} miles at ${fmtNum(pB)} minutes EACH: multiply.` },
      { t: mins(tB * 10), why: "Check the place value." },
    ],
    hints: [`${B}'s pace is ${fmtNum(pB)} minutes per mile.`, `${d} miles, each taking ${fmtNum(pB)} minutes: multiply ${fmtNum(pB)} × ${d}.`],
    explanation: `${fmtNum(pB)} × ${d} = ${fmtNum(tB)} minutes.`,
  });
  const lastWrongs: Wrong[] = [
    { t: mins(tA), why: onlyStep(1, `${A}'s time`) },
    { t: mins(pB), why: onlyStep(2, `${B}'s pace`) },
    { t: mins(tB), why: `That's only step 3 (${B}'s time) — now compare the two times!` },
    { t: mins(tA + tB), why: "Adding the times doesn't compare them. Subtract." },
  ];
  const s4 = make(rng, {
    kind: "comboRunner", tag: 7, twoStep: false, data,
    prompt: `Last step: ${A} takes ${fmtNum(tA)} min and ${B} takes ${fmtNum(tB)} min. How many minutes sooner does the faster runner finish?`,
    correct: mins(diff),
    wrongs: lastWrongs.slice(3).concat([{ t: mins(tA), why: `That's ${A}'s whole time. Find the DIFFERENCE.` }, { t: mins(tB), why: `That's ${B}'s whole time. Find the DIFFERENCE.` }, { t: mins(diff * 2), why: "Check the subtraction." }]),
    hints: ["Who has the smaller time?", `Subtract: bigger time − smaller time.`],
    explanation: `${fmtNum(Math.max(tA, tB))} − ${fmtNum(Math.min(tA, tB))} = ${fmtNum(diff)} minutes. ${faster} wins!`,
  });
  const final = make(rng, {
    kind: "comboRunner", data,
    prompt: `${story} How many minutes sooner does the faster runner finish?`,
    correct: mins(diff),
    wrongs: lastWrongs.slice(0, 3),
    hints: [`Find each runner's time for the ${d} miles. Change the speed to a pace first.`, `${A}: ${p} × ${d}. ${B}: (60 ÷ ${fmtNum(s)}) minutes per mile, times ${d}. Then subtract.`],
    explanation: `${A}: ${fmtNum(tA)} min. ${B}: 60 ÷ ${fmtNum(s)} = ${fmtNum(pB)} min per mile × ${d} = ${fmtNum(tB)} min. ${faster} finishes ${fmtNum(diff)} minutes sooner.`,
  });
  return {
    kind: "comboRunner", tag: 8, title: "RACE DAY", story, final, finalValue: diff, finalUnit: "min", data,
    steps: [
      { q: s1, result: `${A}'s time: ${mins(tA)}`, value: tA, unit: "min" },
      { q: s2, result: `${B}'s pace: ${fmtNum(pB)} min per mile`, value: pB, unit: "min" },
      { q: s3, result: `${B}'s time: ${mins(tB)}`, value: tB, unit: "min" },
      { q: s4, result: `${faster} is ${mins(diff)} sooner`, value: diff, unit: "min" },
    ],
  };
}

function comboTank(rng: Rng): Combo {
  let parts = 5, k = 2, u = 6;
  for (let t = 0; t < 1000; t++) {
    parts = pick(rng, [5, 10]);
    k = ri(rng, 2, parts - 2);
    if (2 * k === parts) continue;
    u = pick(rng, [3, 4, 5, 6, 7, 8, 9, 12]);
    const W = parts * u, part = k * u;
    if (new Set([u, W, W - part, part, 100 - k * (100 / parts)]).size === 5) break;
  }
  const pp = 100 / parts;
  const P = k * pp, part = k * u, W = parts * u, more = W - part;
  const [thing, unitTxt] = pick(rng, [["rain barrel", "gal"], ["water cooler", "L"], ["fish tank", "gal"]] as [string, string][]);
  const q = (x: number) => `${fmtNum(x)} ${unitTxt}`;
  const story = `The dojo's ${thing} is ${P}% full. Right now it holds ${q(part)}.`;
  const data = { P, part, parts };
  const tape: Model = { type: "tape", parts, shaded: k, partLabel: `${pp}%`, shadedLabel: `${P}% = ${q(part)}`, totalLabel: "100% = ?" };
  const s1 = make(rng, {
    kind: "comboTank", tag: 11, twoStep: false, data, model: tape,
    prompt: `Step 1: Cut the tape into ${parts} pieces of ${pp}%. How much is ONE piece?`,
    correct: q(u),
    wrongs: [
      { t: q(part), why: `${q(part)} is ${k} pieces. Divide by ${k}.` },
      { t: q(part * k), why: `You multiplied. ${P}% is ${k} pieces, so one piece is ${q(part)} ÷ ${k}.` },
      { t: q((part * pp) / 100), why: `You took ${pp}% OF ${q(part)}. But ${q(part)} is already ${P}%.` },
      { t: q(u * 10), why: "Check the place value." },
      { t: q(u + 1), why: `Check the division: ${q(part)} ÷ ${k}.` },
    ],
    hints: [`${P}% is how many ${pp}% pieces?`, `${P}% ÷ ${pp}% = ${k} pieces, so divide ${q(part)} by ${k}.`],
    explanation: `${q(part)} ÷ ${k} = ${q(u)} per ${pp}% piece.`,
  });
  const s2 = make(rng, {
    kind: "comboTank", tag: 14, twoStep: false, data, model: tape,
    prompt: `Step 2: One ${pp}% piece is ${q(u)}. How much does the full ${thing} (100%) hold?`,
    correct: q(W),
    wrongs: [
      { t: q(u * k), why: `That's only ${P}%. The full tape has ${parts} pieces.` },
      { t: q(u * 100), why: `100% is ${parts} pieces of ${pp}%, not 100 pieces.` },
      { t: q(W + u), why: `Count again: ${parts} pieces make 100%.` },
      { t: q(W - u), why: `Count again: ${parts} pieces make 100%.` },
      { t: q(W * 10), why: "Check the place value." },
    ],
    hints: [`How many ${pp}% pieces make 100%?`, `${parts} pieces × ${q(u)}.`],
    explanation: `${parts} × ${q(u)} = ${q(W)}.`,
  });
  const s3 = make(rng, {
    kind: "comboTank", tag: 11, twoStep: false, data, model: tape,
    prompt: `Last step: It holds ${q(W)} when full and has ${q(part)} now. How many more ${unitTxt} will fill it?`,
    correct: q(more),
    wrongs: [
      { t: q(W), why: "That's the full amount. Some water is already in it — subtract." },
      { t: q(W + part), why: "Subtract what's already there; don't add it." },
      { t: q(100 - P), why: `${100 - P} is the missing PERCENT. Turn it into ${unitTxt}: ${parts - k} pieces of ${q(u)}.` },
      { t: q(part), why: "That's what's already in it. How much MORE fits?" },
      { t: q(more * 10), why: "Check the place value." },
    ],
    hints: ["Full amount − what's already in it.", `${q(W)} − ${q(part)}.`],
    explanation: `${q(W)} − ${q(part)} = ${q(more)} (that's ${100 - P}%, or ${parts - k} pieces).`,
  });
  const final = make(rng, {
    kind: "comboTank", data, model: tape,
    prompt: `${story} How many more ${unitTxt} will fill it to the top?`,
    correct: q(more),
    wrongs: [
      { t: q(u), why: onlyStep(1, `one ${pp}% piece`) },
      { t: q(W), why: "That's only step 2 (the FULL amount) — keep going: some is already in it!" },
      { t: q(100 - P), why: `${100 - P} is the missing PERCENT, not the ${unitTxt}.` },
      { t: q(part), why: "That's what's already in it. How much MORE fits?" },
      { t: q(W + part), why: "Subtract what's already there; don't add it." },
    ],
    hints: ["Use a tape diagram: find one piece, then the whole, then what's missing.", `${P}% is ${k} pieces of ${pp}%. One piece = ${q(part)} ÷ ${k}.`],
    explanation: `One ${pp}% piece = ${q(u)}; full = ${parts} × ${q(u)} = ${q(W)}; more needed = ${q(W)} − ${q(part)} = ${q(more)}.`,
  });
  return {
    kind: "comboTank", tag: 11, title: "FILL THE BARREL", story, final, finalValue: more, finalUnit: unitTxt, data,
    steps: [
      { q: s1, result: `One ${pp}% piece: ${q(u)}`, value: u, unit: unitTxt },
      { q: s2, result: `Full (100%): ${q(W)}`, value: W, unit: unitTxt },
      { q: s3, result: `Still needed: ${q(more)}`, value: more, unit: unitTxt },
    ],
  };
}

function comboShop(rng: Rng): Combo {
  const name = pick(rng, NAMES);
  const things = pick(rng, ["throwing stars (foam!)", "rolls of tape", "practice mats", "headbands", "grip gloves"]);
  let n = 4, u = 150, m = 10, D = 15, T = 6;
  let cost = 0, disc = 0, sale = 0, tax = 0, total = 0;
  for (let k = 0; k < 500; k++) {
    n = pick(rng, [3, 4, 5, 6]);
    u = pick(rng, [125, 150, 175, 220, 240, 325, 80, 95]);
    m = pick(rng, [8, 10, 12, 15, 20]);
    D = pick(rng, [10, 15, 20, 25]);
    T = pick(rng, [5, 6, 7, 8]);
    if (m === n) continue;
    cost = u * m;
    disc = roundDiv(cost * D, 100);
    sale = cost - disc;
    tax = roundDiv(sale * T, 100);
    total = sale + tax;
    if (new Set([u, cost, sale, total, disc, tax]).size === 6) break;
  }
  const P = n * u;
  const story = `${name}, a shopkeeper ninja, is buying training supplies. A pack of ${n} ${things} costs ${money(P)}, and ${name} needs ${m}. Today everything is ${D}% off, and then ${T}% sales tax is added.`;
  const data = { n, P, m, D, T };
  const s1 = make(rng, {
    kind: "comboShop", tag: 5, twoStep: false, data,
    prompt: "Step 1: What is the price for ONE?",
    correct: money(u),
    wrongs: [
      { t: money(P), why: `That's the whole pack of ${n}. Divide by ${n}.` },
      { t: money(P * n), why: `You multiplied. Price for one = ${money(P)} ÷ ${n}.` },
      { t: money(roundDiv(n * 10000, P)), why: "That's items per dollar — flipped." },
      { t: money(u * 10), why: "Check the decimal point." },
      { t: money(u + 100), why: `Check the division: ${money(P)} ÷ ${n}.` },
    ],
    hints: ["Unit price = pack price ÷ items in the pack.", `${money(P)} ÷ ${n}.`],
    explanation: `${money(P)} ÷ ${n} = ${money(u)} each.`,
  });
  const s2 = make(rng, {
    kind: "comboShop", tag: 8, twoStep: false, data,
    prompt: `Step 2: At ${money(u)} each, what do ${m} cost (before the sale)?`,
    correct: money(cost),
    wrongs: [
      { t: money(P * m), why: `That's ${m} whole packs! Use the price for one.` },
      { t: money(u), why: `That's one. You need ${m}.` },
      { t: money(cost * 10), why: "Check the decimal point." },
      { t: money(u * (m + 1)), why: `Count again: you need ${m}.` },
    ],
    hints: ["Price for one × how many.", `${money(u)} × ${m}.`],
    explanation: `${money(u)} × ${m} = ${money(cost)}.`,
  });
  const s3 = make(rng, {
    kind: "comboShop", tag: 16, twoStep: false, data,
    prompt: `Step 3: ${money(cost)} is ${D}% off. What is the sale price?`,
    correct: money(sale),
    wrongs: [
      { t: money(disc), why: "That's the discount — what do you pay after taking it off?" },
      { t: money(cost + disc), why: "A discount comes OFF the price." },
      { t: money(cost - D * 100), why: `${D}% off isn't ${money(D * 100)} off. Find ${D}% of ${money(cost)}.` },
      { t: money(cost - roundDiv(disc, 10)), why: `Check the decimal point: ${D}% = ${fmtNum(D / 100)}.` },
      { t: money(cost - disc * 2), why: `You took ${D}% off twice.` },
    ],
    hints: [`Find ${D}% of ${money(cost)}, then subtract it.`, `${D}% of ${money(cost)} = ${fmtNum(D / 100)} × ${money(cost)}.`],
    explanation: `${D}% of ${money(cost)} = ${money(disc)}; ${money(cost)} − ${money(disc)} = ${money(sale)}.`,
  });
  const s4 = make(rng, {
    kind: "comboShop", tag: 16, twoStep: false, data,
    prompt: `Last step: Add ${T}% sales tax to ${money(sale)}. What is the final total? (Round to the cent.)`,
    correct: money(total),
    wrongs: [
      { t: money(tax), why: "That's just the tax — add it to the sale price." },
      { t: money(sale - tax), why: "Tax is ADDED, not taken away." },
      { t: money(sale + T * 100), why: `${T}% isn't ${money(T * 100)}. Find ${T}% of ${money(sale)}.` },
      { t: money(sale + tax * 10), why: `Check the decimal point: ${T}% = ${fmtNum(T / 100)}.` },
      { t: money(sale + roundDiv(tax, 10)), why: `Check the decimal point: ${T}% = ${fmtNum(T / 100)}.` },
    ],
    hints: [`Find ${T}% of ${money(sale)} and add it on.`, `${T}% of ${money(sale)} = $${((sale * T) / 10000).toFixed(4)}... → round to the cent.`],
    explanation: `${T}% of ${money(sale)} = ${money(tax)}; ${money(sale)} + ${money(tax)} = ${money(total)}.`,
  });
  const final = make(rng, {
    kind: "comboShop", data,
    prompt: `${story} What is the final total?`,
    correct: money(total),
    wrongs: [
      { t: money(u), why: onlyStep(1, "the price for one") },
      { t: money(cost), why: onlyStep(2, `the cost of ${m} before the sale`) },
      { t: money(sale), why: "That's only step 3 (the sale price) — keep going: add the tax!" },
      { t: money(cost + roundDiv(cost * T, 100)), why: `You skipped the ${D}% discount.` },
      { t: money(total * 10), why: "Check the decimal point." },
    ],
    hints: ["Four steps: price for one → cost of all → take off the discount → add the tax.", `Price for one: ${money(P)} ÷ ${n}. Then × ${m}.`],
    explanation: `${money(u)} each × ${m} = ${money(cost)}; ${D}% off → ${money(sale)}; + ${T}% tax (${money(tax)}) = ${money(total)}.`,
  });
  return {
    kind: "comboShop", tag: 16, title: "SUPPLY RUN", story, final, finalValue: total, finalUnit: "$", data,
    steps: [
      { q: s1, result: `One costs ${money(u)}`, value: u, unit: "$" },
      { q: s2, result: `${m} cost ${money(cost)}`, value: cost, unit: "$" },
      { q: s3, result: `Sale price: ${money(sale)}`, value: sale, unit: "$" },
      { q: s4, result: `Total with tax: ${money(total)}`, value: total, unit: "$" },
    ],
  };
}

/** Cheapest total (cans only) for a room, its pre-tax cost and the bucket-trap total. */
export function paintTotals(r: Room) {
  const G = gallonsNeeded(r);
  const pre = G * r.canC;
  const withTax = (c: number) => c + roundDiv(c * r.taxP, 100);
  return { G, pre, total: withTax(pre), trap: withTax(r.bucketC), short: withTax((G - 1) * r.canC) };
}

function comboPaint(rng: Rng, room?: Room): Combo {
  const r = room ?? newRoom(rng);
  const { G, pre, total, trap, short } = paintTotals(r);
  const S = paintArea(r);
  const wn = r.windows === 1 ? "one window" : `${r.windows} windows`;
  const story = `Paint the Room! Your room is ${r.L} ft × ${r.W} ft with ${r.H}-ft walls, a ${r.doorW} × ${r.doorH} ft door and ${wn} (${r.winW} × ${r.winH} ft). You want ${r.coats === 1 ? "1 coat" : `${r.coats} coats`}; a gallon covers ${r.cover} sq ft. Cans: ${money(r.canC)} per gallon, or a ${fmtNum(r.bucketGal)}-gal bucket for ${money(r.bucketC)}. Tax is ${r.taxP}%.`;
  const data = { ...r } as unknown as Record<string, number>;
  const steps: ComboStep[] = [1, 2, 3, 4, 5].map((k) => {
    const q = paintQuestion(rng, r, k);
    q.prompt = q.prompt.replace(/^Paint the Room · step (\d) of 5\. /, (_m, d: string) => (d === "5" ? "Last step: " : `Step ${d}: `));
    return q;
  }).map((q, i) => {
    const vals: [string, number, string][] = [
      [`Walls: ${fmtNum(wallArea(r))} sq ft`, wallArea(r), "sq ft"],
      [`Paint: ${fmtNum(S)} sq ft`, S, "sq ft"],
      [`Buy ${G} gallons`, G, "gal"],
      [`${G} cans: ${money(pre)}`, pre, "$"],
      [`Total with tax: ${money(total)}`, total, "$"],
    ];
    return { q, result: vals[i][0], value: vals[i][1], unit: vals[i][2] };
  });
  const final = make(rng, {
    kind: "comboPaint", data, step: undefined,
    prompt: `${story} What do you pay at the register for the cheapest way to get ENOUGH paint?`,
    correct: money(total),
    wrongs: [
      { t: money(pre), why: "That's only step 4 (the paint before tax) — keep going: add the tax!" },
      { t: money(trap), why: `The bucket is cheaper per gallon, but ${fmtNum(r.bucketGal)} gallons isn't enough — you need ${G}.` },
      { t: money(short), why: `That buys ${G - 1} gallon${G - 1 === 1 ? "" : "s"}, which isn't enough. Round the gallons UP.` },
      { t: money(pre + r.taxP * 100), why: `${r.taxP}% tax isn't ${money(r.taxP * 100)}. Find ${r.taxP}% of ${money(pre)}.` },
      { t: money(total * 10), why: "Check the decimal point." },
    ],
    hints: ["Walls → take away door and windows → × coats ÷ coverage (round UP) → cheapest way to buy enough → add tax.", `Walls: perimeter ${2 * (r.L + r.W)} ft × ${r.H} ft. Then subtract the door and window areas.`],
    explanation: `Walls ${fmtNum(wallArea(r))} sq ft − door and windows = ${fmtNum(S)} sq ft; × ${r.coats} ÷ ${r.cover} → buy ${G} gal; ${G} cans = ${money(pre)}; + ${r.taxP}% tax = ${money(total)}.`,
  });
  return { kind: "comboPaint", tag: 17, title: "PAINT THE ROOM", story, final, finalValue: total, finalUnit: "$", data, steps };
}

export function makeCombo(kind: ComboKind, rng: Rng = Math.random): Combo {
  switch (kind) {
    case "comboDeal": return comboDeal(rng);
    case "comboRunner": return comboRunner(rng);
    case "comboTank": return comboTank(rng);
    case "comboShop": return comboShop(rng);
    case "comboPaint": return comboPaint(rng);
  }
}
