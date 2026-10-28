/*
 * Math 6 · Unit 3 generator tests (npm test). Thousands of questions per generator and chain:
 *  - every answer matches an INDEPENDENT recomputation from the question's raw numbers
 *    (written again here, without the generator's helpers);
 *  - 4 unique choices, exactly one correct, every wrong choice names its mistake, 2 hints;
 *  - money always shows 2 decimals; no negative numbers; percents include 6/12/35 and >100%;
 *  - at least 1 in 4 items is two-step; conversions go both directions about equally;
 *  - chains: every step recomputes, the last step is the final answer, and the final answer's
 *    wrong choices include each earlier step's value;
 *  - the gentle gate rules, the .story MATH syntax, the attempt log and the CSV/JSON export;
 *  - no out-of-scope words or private names in any generated text.
 */
import assert from "node:assert/strict";
import { GENERATORS, TAG_GENERATOR, generate } from "../src/math/unit3";
import { CHAINS, generateChain } from "../src/math/chains";
import { mulberry32 } from "../src/math/format";
import { SKILL_TAGS, TAG_CODE, type ChainQ, type MathQ } from "../src/math/types";
import { answer, hint, makeItem, startMath, currentQ, correctDisplay } from "../src/math/play";
import { checkStory } from "../src/story/validate";
import { parseStory } from "../src/story/parse";
import { serializeStory } from "../src/story/serialize";
import { advance, answerMathGate, hintMathGate, newRun } from "../src/play/session";
import * as log from "../src/math/log";
import { privateWord } from "./private-words";

let passed = 0;
let checks = 0;
function test(name: string, fn: () => void) {
  try {
    fn();
    passed++;
  } catch (e) {
    console.error(`FAIL ${name}`);
    throw e;
  }
}
const ok = (cond: boolean, msg: () => string) => {
  checks++;
  if (!cond) throw new Error(msg());
};

// ---------- independent formatting (not the game's helpers) ----------
const usd = (cents: number) => {
  const c = Math.round(cents);
  return "$" + (c / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};
const plain = (x: number) => x.toLocaleString("en-US", { maximumFractionDigits: 2 });
const G = (a: number, b: number): number => (b ? G(b, a % b) : a);
const fracText = (n: number, d: number) => {
  const g = G(n, d);
  n /= g;
  d /= g;
  const w = Math.floor(n / d);
  const r = n % d;
  return r === 0 ? `${w}` : w ? `${w} ${r}/${d}` : `${r}/${d}`;
};
const halfUp = (num: number, den: number) => Math.floor((2 * num + den) / (2 * den)); // integers only
const near = (a: number, b: number) => Math.abs(a - b) < 1e-6;
const hasNum = (text: string, x: number) => new RegExp(`(^|[^\\d.,])${plain(x).replace(/[.]/g, "\\.")}(?![\\d,]|\\.\\d)`).test(text);

const allText = (q: MathQ) => [q.prompt, ...q.choices.map((c) => c.text), ...q.choices.map((c) => c.why), ...q.hints];
const MONEY_RE = /\$[\d,]*(\.\d*)?/g;
const BAD_WORDS = [/\bnegative\b/i, /\bintegers?\b/i, /\bequations?\b/i, /\bvariables?\b/i, /\binterest\b/i, /\bmarkups?\b/i, /percent (increase|decrease)/i, /constant of proportionality/i];

/** Shape checks that apply to every generated question. */
function shape(q: MathQ, where: string) {
  ok(q.choices.length === 4, () => `${where}: ${q.choices.length} choices`);
  const keys = new Set(q.choices.map((c) => c.text.toLowerCase().trim()));
  ok(keys.size === 4, () => `${where}: duplicate choices ${JSON.stringify(q.choices.map((c) => c.text))}`);
  ok(q.choices.filter((c) => c.correct).length === 1 && q.choices[0].correct, () => `${where}: correct choice must be first and unique`);
  ok(q.choices[0].text === q.answer, () => `${where}: answer text mismatch`);
  for (const c of q.choices.slice(1)) ok(c.why.trim().length > 10, () => `${where}: wrong choice "${c.text}" has no named mistake`);
  ok(q.hints.length === 2 && q.hints.every((h) => h.trim().length > 5), () => `${where}: needs 2 hints`);
  // hints never give the answer away (checked for answers with 3+ digits, where a match can't be a coincidence)
  if ((q.answer.match(/\d/g) ?? []).length >= 3 && !/^100%?$/.test(q.answer)) {
    const esc = q.answer.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    ok(!q.hints.some((h) => new RegExp(`(^|[^\\d.,/])${esc}(?!\\d)`).test(h)), () => `${where}: a hint gives away the answer "${q.answer}": ${q.hints.join(" / ")}`);
  }
  ok((SKILL_TAGS as readonly string[]).includes(q.tag) && q.code === TAG_CODE[q.tag], () => `${where}: bad tag/code ${q.tag} ${q.code}`);
  for (const t of allText(q)) {
    for (const m of t.match(MONEY_RE) ?? []) ok(/^\$\d{1,3}(,\d{3})*\.\d{2}$/.test(m), () => `${where}: money not 2 decimals: "${m}" in "${t}"`);
    ok(!/(^|[\s(:$])[-−]\d/.test(t), () => `${where}: negative number in "${t}"`);
    ok(!/NaN|Infinity|undefined/.test(t), () => `${where}: broken text "${t}"`);
    for (const re of BAD_WORDS) ok(!re.test(t), () => `${where}: out-of-scope word ${re} in "${t}"`);
    ok(!privateWord(t), () => `${where}: private word in "${t}"`);
  }
  if (typeof q.value === "number") ok(q.value >= 0 && Number.isFinite(q.value), () => `${where}: bad value ${q.value}`);
}

/** The expected answer from the raw numbers, recomputed without the generator's code. */
function expected(q: MathQ): { value: number | string; text?: string } {
  const f = q.facts as Record<string, number & string>;
  switch (q.gen) {
    case "estimate-rate": {
      const minutes = (f.N / f.a) * f.b;
      return { value: f.two ? minutes / 60 : minutes };
    }
    case "pick-unit": {
      if (f.variant === "count") return { value: `more ${f.n * f.f}` };
      const UNITS: Record<string, string> = {
        "the length of a pencil": "centimeters", "the height of a door": "meters", "the distance across a desert city": "kilometers",
        "the weight of a backpack": "pounds", "how much water a bathtub holds": "gallons", "the weight of a paper clip": "grams",
        "the width of a phone screen": "inches", "the paint needed for a whole room": "gallons", "the length of a giant tower": "meters",
      };
      return { value: UNITS[f.obj], text: UNITS[f.obj] };
    }
    case "convert-length":
    case "convert-weight":
    case "convert-volume":
      return { value: f.dir === "down" ? (f.B * f.f100) / 100 : f.B };
    case "deal-compare": {
      const a = f.pA / f.qA;
      const b = f.pB / f.qB;
      return { value: near(a, b) ? "tie" : a < b ? "A" : "B" };
    }
    case "speed-compare": {
      // read the distances and times back out of the question text
      const m = [...q.prompt.matchAll(/([\d.,]+) miles in (\d+) hours/g)].map((x) => [Number(x[1].replace(/,/g, "")), Number(x[2])]);
      const [sa, sb] = [m[0][0] / m[0][1], m[1][0] / m[1][1]];
      return { value: near(sa, sb) ? "tie" : `${sa > sb ? f.A : f.B} ${Math.abs(sa - sb)}` };
    }
    case "two-rates":
      return f.per === "unit" ? { value: f.P / f.a } : { value: (100 * f.a) / f.P, text: fracText(100 * f.a, f.P) };
    case "same-rate":
      return { value: f.a0 * f.b1 === f.a1 * f.b0 ? "yes" : "no" };
    case "pace-vs-speed": {
      if (f.variant === "toPace") return { value: 60 / f.s };
      if (f.variant === "toSpeed") return { value: 60 / f.pc };
      const pB = 60 / f.s;
      return { value: near(f.pA, pB) ? "tie" : "?" };
    }
    case "unit-price-total":
      return f.variant === "total" ? { value: (f.P / f.n) * f.m } : { value: halfUp(f.P, f.n) };
    case "batch-scale":
      return f.variant === "factor"
        ? { value: (f.qn * f.fn) / (f.qd * f.fd), text: fracText(f.qn * f.fn, f.qd * f.fd) }
        : { value: (f.qn * f.s2) / (f.qd * f.s1), text: fracText(f.qn * f.s2, f.qd * f.s1) };
    case "percent-rate":
      return f.variant === "price" ? { value: (f.W * f.P) / 100 } : { value: (f.P * f.N) / 100 };
    case "percent-dnl":
    case "benchmark-percent":
      return { value: (f.W * f.P) / 100 };
    case "percent-tape":
    case "percent-whole":
      return { value: (f.part * 100) / f.P };
    case "percent-of":
      return f.variant === "money" ? { value: halfUp(f.W * f.P, 100) } : { value: (f.W * f.P) / 100 };
    case "percent-find":
      return { value: (100 * f.a) / f.b };
    case "sale-price":
      return { value: f.W - halfUp(f.W * f.P, 100) };
    case "sales-tax":
    case "tip":
      return { value: f.W + halfUp(f.W * f.r, 100) };
    case "paint-area":
      return { value: 2 * (f.L + f.W) * f.H - 21 - 12 * f.windows };
    case "paint-gallons":
      return { value: Math.ceil((f.A * f.coats) / f.c) };
    case "paint-cost": {
      let best = { cost: Infinity, key: "" };
      for (let x = 0; x <= 20; x++) for (let y = 0; y <= 20; y++) {
        if (x * f.S + y >= f.G && x * f.b + y * f.a < best.cost) best = { cost: x * f.b + y * f.a, key: `${x}+${y}` };
      }
      return { value: best.key };
    }
    case "scale-copy":
      return f.variant === "at" ? { value: (f.L * f.P) / 100 } : f.variant === "by" ? { value: (f.L * (100 + f.B)) / 100 } : { value: (f.C * 100) / f.P };
    case "scale-area":
      return { value: f.a * f.b * (f.P / 100) ** 2 };
    case "scale-drawing":
      return f.variant === "real" ? { value: f.s * f.d } : { value: 12 * f.s };
    default:
      throw new Error(`no recomputation for ${q.gen}`);
  }
}

function checkAnswer(q: MathQ, where: string) {
  const e = expected(q);
  if (e.value === "?") return; // who-is-faster (non-tie) is checked below
  if (typeof e.value === "number") {
    ok(typeof q.value === "number" && near(q.value, e.value), () => `${where}: value ${q.value} but recomputed ${e.value} (${q.prompt})`);
    if (e.text) ok(q.answer.startsWith(e.text), () => `${where}: answer "${q.answer}" should start with ${e.text}`);
    else if (q.unit === "cents") ok(q.answer.includes(usd(e.value)), () => `${where}: answer "${q.answer}" should show ${usd(e.value)}`);
    else ok(hasNum(q.answer, e.value), () => `${where}: answer "${q.answer}" should show ${plain(e.value as number)}`);
  } else {
    ok(q.value === e.value, () => `${where}: key ${q.value} but recomputed ${e.value} (${q.prompt})`);
    if (e.text) ok(q.answer.includes(e.text), () => `${where}: answer "${q.answer}" should include ${e.text}`);
  }
  if (q.gen === "pace-vs-speed" && q.facts.variant === "who") {
    const pA = Number(q.facts.pA);
    const pB = 60 / Number(q.facts.s);
    const fasterIsA = pA < pB;
    if (!near(pA, pB)) {
      const name = /^(\S+) runs at a pace/.exec(q.prompt)![1];
      ok(q.answer === `${fasterIsA ? name : /\. (\S+) runs/.exec(q.prompt)![1]} is faster`, () => `${where}: wrong faster runner "${q.answer}" for ${q.prompt}`);
    }
  }
}

const N = Number(process.env.N ?? 3000);
const rng = mulberry32(12345);
let twoStep = 0;
let total = 0;
const dirs = { up: 0, down: 0 };
const percents = new Set<number>();
let roundingItems = 0;

test("every generator: answers recompute, choices, money, no negatives, scope", () => {
  for (const id of Object.keys(GENERATORS)) {
    const params = {};
    for (let i = 0; i < N; i++) {
      const q = generate(id, params, rng);
      const where = `${id}#${i}`;
      ok(q.gen === id || (id.startsWith("convert-") && q.gen === id), () => `${where}: gen id ${q.gen}`);
      shape(q, where);
      checkAnswer(q, where);
      total++;
      if (q.steps >= 2) twoStep++;
      if (q.dir) dirs[q.dir]++;
      if (q.rounding) roundingItems++;
      for (const m of q.prompt.matchAll(/(\d+)%/g)) percents.add(Number(m[1]));
    }
  }
});

test("generator mix: two-step share, both conversion directions, special percents, rounding items", () => {
  ok(twoStep / total >= 0.25, () => `two-step share ${(twoStep / total).toFixed(2)} < 0.25`);
  const share = dirs.down / (dirs.up + dirs.down);
  ok(share > 0.45 && share < 0.55, () => `conversion directions not balanced: ${JSON.stringify(dirs)}`);
  for (const p of [6, 12, 35, 125, 150, 200]) ok(percents.has(p), () => `percent ${p}% never appears`);
  ok(roundingItems > 0, () => "no round-to-the-cent items");
});

test("every skill tag has a generator, and the tag table has exactly the 18 names", () => {
  ok(SKILL_TAGS.length === 18, () => `${SKILL_TAGS.length} tags`);
  for (const t of SKILL_TAGS) ok(GENERATORS[TAG_GENERATOR[t]]?.tag === t, () => `no generator for ${t}`);
  const fromGens = new Set(Object.values(GENERATORS).map((g) => g.tag));
  for (const t of SKILL_TAGS) ok(fromGens.has(t), () => `tag ${t} has no generator`);
  ok(TAG_CODE["Bridge: scale factors"].includes("7th-grade bridge"), () => "bridge items must be tagged as 7th-grade bridge");
  ok(Object.entries(TAG_CODE).filter(([t]) => t !== "Bridge: scale factors").every(([, c]) => c === "NC.6.RP.2" || c === "NC.6.RP.3"), () => "Unit 3 tags use NC.6.RP.2 / NC.6.RP.3");
});

// ---------- chains ----------
function chainExpected(c: ChainQ): number[] {
  const f = c.facts as Record<string, number & string>;
  switch (c.gen) {
    case "chain:receipt": {
      const sub = f.n * f.u;
      const disc = halfUp(sub * f.pc, 100);
      const after = sub - disc;
      return [sub, disc, after, after + halfUp(after * f.r, 100)];
    }
    case "chain:sale-tax": {
      const disc = halfUp(f.W * f.P, 100);
      const sale = f.W - disc;
      return [disc, sale, sale + halfUp(sale * f.r, 100)];
    }
    case "chain:tip-split": {
      const tip = halfUp(f.B * f.t, 100);
      return [tip, f.B + tip, halfUp(f.B + tip, f.k)];
    }
    case "chain:deal-total": {
      const uA = f.pA / f.qA;
      const uB = f.pB / f.qB;
      const cost = f.m * Math.min(uA, uB);
      return [uA, uB, cost, f.bill - cost];
    }
    case "chain:climb-time": {
      const groups = f.N / f.a;
      const climb = groups * f.b;
      const w = f.sunset - f.start;
      return [groups, climb, w, w - climb];
    }
    case "chain:race-pace": {
      const pA = 60 / f.sA;
      return [pA, pA * f.d, f.pB * f.d, Math.abs(pA * f.d - f.pB * f.d)];
    }
    case "chain:water-trip":
      return [f.k * f.c, f.k * f.c * f.h, (f.k * f.c * f.h) / 4];
    case "chain:wall-area": {
      const per = 2 * (f.L + f.W);
      return [per, per * f.H, per * f.H - 21 - 12 * f.windows];
    }
    case "chain:paint-gallons":
      return [f.A * f.coats, (f.A * f.coats) / f.c, Math.ceil((f.A * f.coats) / f.c)];
    case "chain:paint-buy": {
      let best = Infinity;
      for (let x = 0; x <= 20; x++) for (let y = 0; y <= 20; y++) if (x * f.S + y >= f.G) best = Math.min(best, x * f.b + y * f.a);
      return [f.b / f.S, NaN, best + halfUp(best * f.r, 100)];
    }
    case "chain:copy-area": {
      const A = f.a * f.b;
      const k = (f.P / 100) ** 2;
      return [A, k, A * k];
    }
    default:
      throw new Error(`no chain recomputation for ${c.gen}`);
  }
}

test("every chain: steps recompute, last step = final answer, final distractors include each step value", () => {
  for (const id of Object.keys(CHAINS)) {
    for (let i = 0; i < Math.ceil(N / 2); i++) {
      const c = generateChain(id, {}, rng);
      const where = `chain:${id}#${i}`;
      ok(c.gen === `chain:${id}`, () => `${where}: gen ${c.gen}`);
      ok(c.steps.length >= 2 && c.steps.length <= 4, () => `${where}: ${c.steps.length} steps (want 2–4)`);
      ok(c.final.steps >= 2, () => `${where}: final must be multi-step`);
      ok(c.setup.length > 20 && c.final.prompt.includes(c.setup), () => `${where}: final prompt must tell the story setup`);
      shape(c.final, `${where} final`);
      c.steps.forEach((s, k) => shape(s, `${where} step ${k + 1}`));
      const exp = chainExpected(c);
      ok(exp.length === c.steps.length, () => `${where}: ${c.steps.length} steps vs ${exp.length} expected`);
      c.steps.forEach((s, k) => {
        if (Number.isNaN(exp[k])) return; // a "which buy?" step: checked by the paint-cost recomputation
        ok(typeof s.value === "number" && near(s.value, exp[k]), () => `${where}: step ${k + 1} value ${s.value}, recomputed ${exp[k]}`);
      });
      const last = c.steps[c.steps.length - 1];
      ok(near(Number(last.value), Number(c.final.value)) && last.answer === c.final.answer, () => `${where}: last step must be the final answer`);
      ok(near(Number(c.final.value), exp[exp.length - 1]), () => `${where}: final ${c.final.value} vs recomputed ${exp[exp.length - 1]}`);
      // the final answer's wrong choices include every earlier step's value
      const wrongs = c.final.choices.filter((ch) => !ch.correct).map((ch) => ch.text);
      exp.slice(0, -1).forEach((v, k) => {
        if (Number.isNaN(v)) return;
        const shown = c.steps[k].unit === "cents" ? wrongs.some((w) => w.includes(usd(v))) : wrongs.some((w) => hasNum(w, v));
        ok(shown, () => `${where}: step ${k + 1} value ${v} missing from final choices ${JSON.stringify(wrongs)}`);
      });
      for (const k of c.steps) if (k.gen === "paint-cost") checkAnswer(k, `${where} paint-cost step`);
    }
  }
});

// ---------- gentle rules ----------
test("math gates: wrong never costs anything; named feedback; two hint stages; retry", () => {
  const s0 = startMath(makeItem({ gen: "sale-price", chain: false, params: {} }, mulberry32(1)), mulberry32(2));
  const q = currentQ(s0);
  const right = correctDisplay(s0);
  const wrongD = [0, 1, 2, 3].find((d) => d !== right)!;
  const w = answer(s0, wrongD);
  assert.equal(w.event, "wrong");
  assert.ok(w.s.feedback && !w.s.feedback.ok && w.s.feedback.text === q.choices[s0.order[wrongD]].why);
  assert.equal(answer(w.s, wrongD).event, "ignored", "the same wrong answer can't be picked twice");
  const h1 = hint(w.s);
  const h2 = hint(h1);
  assert.equal(h1.hints, 1);
  assert.equal(h2.hints, 2);
  assert.equal(hint(h2), h2, "only two hint stages");
  const r = answer(h2, right);
  assert.equal(r.event, "done");
  assert.equal(r.s.firstTry, false);
  assert.equal(r.s.results[0].hints, 2);
  assert.equal(r.s.results[0].attempts, 2);
  assert.equal(r.attempt!.correct, true);
});

test("chain gates: right first try = bonus; a miss breaks into steps with work so far", () => {
  const item = makeItem({ gen: "receipt", chain: true, params: {} }, mulberry32(9));
  const s0 = startMath(item, mulberry32(3));
  const first = answer(s0, correctDisplay(s0));
  assert.equal(first.event, "done");
  assert.equal(first.s.bonus, true);
  const s1 = startMath(item, mulberry32(4));
  const miss = answer(s1, [0, 1, 2, 3].find((d) => d !== correctDisplay(s1))!);
  assert.equal(miss.event, "breakdown");
  assert.equal(miss.s.phase, "steps");
  assert.ok(/break it into steps/.test(miss.s.feedback!.text));
  let s = miss.s;
  const n = item.kind === "chain" ? item.c.steps.length : 0;
  for (let k = 0; k < n; k++) {
    assert.equal(currentQ(s).tag, item.kind === "chain" ? item.c.steps[k].tag : "");
    const r = answer(s, correctDisplay(s));
    s = r.s;
    assert.equal(r.event, k === n - 1 ? "done" : "step");
    assert.equal(s.work.length, k + 1);
  }
  assert.equal(s.bonus, false);
  assert.equal(s.results.length, n + 1, "the chain's own result plus one per step");
  assert.equal(s.results[0].firstTry, false);
});

const BOOK = `title: T
author: A
genre: mystery
band: 6-8
cover: mall
blurb: A short test book.
start: a

=== a
scene: mall
cast: hero
checkpoint
The mall is busy.
? MATH sale-price item=red_jacket : The sign says something.
next: b

=== b
scene: mall
cast: hero
A story problem.
? MATH chain:receipt who=Ms._Pell : Check the receipt.
bonus: Receipt solved!
next: c

=== c
scene: mall
cast: hero
The end.
end: win Done
`;

test(".story MATH syntax: parse, validate, serialize, play", () => {
  const r = checkStory(BOOK);
  assert.deepEqual(r.errors, []);
  const g = r.story.pages[0].gate!;
  assert.equal(g.kind, "math");
  assert.deepEqual(g.math, { gen: "sale-price", chain: false, params: { item: "red_jacket" } });
  assert.equal(g.question, "The sign says something.");
  const c = r.story.pages[1].gate!;
  assert.deepEqual(c.math, { gen: "receipt", chain: true, params: { who: "Ms._Pell" } });
  assert.equal(c.bonus, "Receipt solved!");
  assert.equal(r.stats.gates.math, 2);
  assert.equal(r.stats.gates.chain, 1);
  // serializer round trip
  const back = parseStory(serializeStory(r.story)).story;
  assert.deepEqual(back.pages.map((p) => p.gate?.math ?? null), r.story.pages.map((p) => p.gate?.math ?? null));
  // errors: unknown generator / chain / parameter, answers on a math gate
  const errs = (t: string) => checkStory(t).errors.map((e) => e.message).join("\n");
  assert.match(errs(BOOK.replace("sale-price item", "sale-prize item")), /Unknown math generator "sale-prize"/);
  assert.match(errs(BOOK.replace("chain:receipt", "chain:recipe")), /Unknown math chain "recipe"/);
  assert.match(errs(BOOK.replace("item=red_jacket", "colour=red")), /has no parameter "colour"/);
  assert.match(errs(BOOK.replace("next: b", "+ 12\nnext: b")), /makes its own answers/);
  assert.match(errs(BOOK.replace("next: b\n", "")), /needs a "next:" line/);
  // play: a wrong answer never costs a heart; a right one moves on with points
  const story = r.story;
  let run = newRun(story, 6);
  const ms = run.gate!.math!;
  const right = correctDisplay(ms);
  const wrongR = answerMathGate(story, run, [0, 1, 2, 3].find((d) => d !== right)!);
  assert.equal(wrongR.result, "wrong");
  assert.equal(wrongR.run.hearts, run.hearts);
  assert.equal(wrongR.run.page, "a");
  run = hintMathGate(wrongR.run);
  assert.equal(run.gate!.math!.hints, 1);
  const rightR = answerMathGate(story, run, right);
  assert.equal(rightR.result, "right");
  assert.equal(rightR.run.gate!.status, "solved");
  assert.equal(rightR.run.math.length, 1);
  assert.equal(rightR.run.math[0].firstTry, false);
  assert.ok(rightR.run.score > 0);
  // the chain on page b: right on the first try = bonus points + the gold-star clue
  run = advance(story, rightR.run, 0);
  assert.equal(run.page, "b");
  const cs = run.gate!.math!;
  const chainR = answerMathGate(story, run, correctDisplay(cs));
  assert.equal(chainR.result, "right");
  assert.equal(chainR.run.score - run.score, 100 + 150);
  assert.ok(chainR.run.clues.includes("★ Receipt solved!"));
});

// ---------- attempt log + export (with an in-memory localStorage) ----------
test("attempt log keeps the newest 500; CSV and JSON have every field", () => {
  const store = new Map<string, string>();
  (globalThis as unknown as { localStorage: Storage }).localStorage = {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
    removeItem: (k: string) => void store.delete(k),
    clear: () => store.clear(),
    key: () => null,
    length: 0,
  } as Storage;
  for (let i = 0; i < 520; i++) {
    log.logAttempt({ tag: "Find the whole", code: "NC.6.RP.3", question: `Q${i}, "quoted"`, given: "$1.00", correctAnswer: "$2.00", correct: i % 2 === 0, hints: i % 3 }, "Book");
  }
  const rows = log.loadAttempts();
  assert.equal(rows.length, log.LOG_CAP);
  assert.equal(rows[0].question, 'Q20, "quoted"');
  const csv = log.toCSV(rows);
  const head = csv.split("\n")[0];
  for (const h of ["date", "game", "skill tag", "question", "answer given", "correct answer", "correct/incorrect", "hints used"]) assert.ok(head.includes(h), `CSV header has ${h}`);
  assert.ok(csv.includes('"Q20, ""quoted"""'), "CSV escapes commas and quotes");
  assert.ok(/,correct,|,incorrect,/.test(csv));
  const json = JSON.parse(log.toJSON(rows)) as Record<string, unknown>[];
  for (const k of ["date", "game", "skill", "question", "answerGiven", "correctAnswer", "correct", "hintsUsed"]) assert.ok(k in json[0], `JSON has ${k}`);
  assert.equal(json[0].game, "Page Quest: Rate & Percent Mysteries");
  // redo list: missed tags, new numbers each time
  const missed = log.missedFrom([
    { tag: "Find the whole", code: "NC.6.RP.3", gen: "percent-whole", question: "", answer: "", firstTry: false, hints: 0, attempts: 2, twoStep: false },
    { tag: "Converting units", code: "NC.6.RP.3", gen: "chain:water-trip", question: "", answer: "", firstTry: false, hints: 1, attempts: 3, twoStep: false },
    { tag: "Benchmark percents", code: "NC.6.RP.3", gen: "benchmark-percent", question: "", answer: "", firstTry: true, hints: 0, attempts: 1, twoStep: false },
  ]);
  assert.deepEqual(missed, [{ tag: "Find the whole", gen: "percent-whole" }, { tag: "Converting units", gen: "convert-length" }]);
  log.addMissed(missed);
  assert.equal(log.loadMissed().length, 2);
  log.clearMastered([{ tag: "Find the whole", code: "", gen: "percent-whole", question: "", answer: "", firstTry: true, hints: 0, attempts: 1, twoStep: false }]);
  assert.deepEqual(log.loadMissed().map((m) => m.tag), ["Converting units"]);
  const tags = log.byTag([
    { tag: "Find the whole", code: "NC.6.RP.3", gen: "x", question: "", answer: "", firstTry: true, hints: 1, attempts: 1, twoStep: false },
    { tag: "Find the whole", code: "NC.6.RP.3", gen: "x", question: "", answer: "", firstTry: false, hints: 2, attempts: 3, twoStep: false },
  ]);
  assert.deepEqual(tags, [{ tag: "Find the whole", code: "NC.6.RP.3", total: 2, firstTry: 1, hints: 3 }]);
});

console.log(`test-math: ${passed} tests passed (${checks} checks; ${total} generated questions across ${Object.keys(GENERATORS).length} generators + ${Object.keys(CHAINS).length} chains, ${(100 * twoStep / total).toFixed(0)}% two-step, conversions ${dirs.down} down / ${dirs.up} up).`);
