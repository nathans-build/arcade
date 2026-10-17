/*
 * Checks Count Carnival's questions and rules:   npm test   (tsx scripts/check-rules.ts)
 *
 * Questions: for K, 1 and 2 (and grades above 2, which play grade-2 content), every booth, many seeds:
 * 4 different choices, a valid answer index, an NC standard code for the item's grade, read-aloud text,
 * a hint and an explanation. The right answer is RECOMPUTED here from what the booth draws (objects,
 * bunches of ten, skip-count sequences, tightrope equations, duck groups, >/</= statements, shapes,
 * fraction pictures, clock times, coin totals), and no wrong choice may also be right. K-1 never shows a
 * negative number; values stay in each grade's range.
 *
 * Rules: wrong taps never end a round (no game over, no lives, no timer); hints grow, then the right
 * answer glows; tickets are earned for every solved item plus a round bonus; prizes cost tickets and
 * are saved under arcade.count-carnival.*.
 */
import {
  BOOTHS, COIN_CENTS, FLATS, GENERATORS, ROUND_LEN, SOLIDS, makeRound, playGrade,
  type BoothId, type CCItem, type CoinName, type Play,
} from "../src/carnival/items";
import { Round, ROUND_BONUS, TICKETS_FIRST_TRY, TICKETS_LATER } from "../src/carnival/round";
import { makeRng } from "../src/carnival/rng";
import { PRIZES, SAVE_KEY, buyPrize, emptySave, loadSave, writeSave } from "../src/carnival/save";
import type { Grade } from "../src/kit/types";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { COIN_MM, Coin, coinPx } from "../src/carnival/art";

let failures = 0;
let checks = 0;
function fail(msg: string) {
  failures++;
  if (failures <= 60) console.error("FAIL:", msg);
}
function check(cond: boolean, msg: () => string) {
  checks++;
  if (!cond) fail(msg());
}

const SEEDS = 600;
const PLAYS: Play[] = ["K", "1", "2"];

/** Standards each booth may use at each grade (codes we are confident of). */
const ALLOWED: Record<BoothId, Record<Play, string[]>> = {
  balloons: { K: ["NC.K.CC.5"], "1": ["NC.1.NBT.1", "NC.1.NBT.2"], "2": ["NC.2.NBT.2", "NC.2.OA.3"] },
  tightrope: { K: ["NC.K.OA.3", "NC.K.OA.4", "NC.K.OA.5"], "1": ["NC.1.OA.6"], "2": ["NC.2.OA.2", "NC.2.NBT.5"] },
  ducks: { K: ["NC.K.CC.6", "NC.K.CC.7"], "1": ["NC.1.NBT.3"], "2": ["NC.2.NBT.4"] },
  shapes: { K: ["NC.K.G.2", "NC.K.G.3"], "1": ["NC.1.G.3", "NC.1.MD.3"], "2": ["NC.2.MD.7", "NC.2.MD.8"] },
};

/** Largest number a grade's items may show. */
const MAX_VALUE: Record<Play, number> = { K: 20, "1": 130, "2": 1100 };

const isInt = (s: string) => /^\d+$/.test(s);
const nums = (it: CCItem) => it.choices.map(Number);
const ctx = (it: CCItem) => `${it.booth}/${it.grade}/${it.standard} "${it.prompt}" [${it.choices.join(" | ")}] ans=${it.answer}`;

/* -------------------------------------------------------------- independent recomputation */

const MY_CENTS: Record<string, number> = { penny: 1, nickel: 5, dime: 10, quarter: 25 };

function checkItem(it: CCItem, g: Play, booth: BoothId) {
  const c = () => ctx(it);
  check(it.booth === booth, () => `booth mismatch ${c()}`);
  check(it.grade === g, () => `grade mismatch ${c()}`);
  check(it.subject === "math", c);
  check(it.choices.length === 4 && new Set(it.choices).size === 4, () => `choices not 4 unique: ${c()}`);
  check(Number.isInteger(it.answer) && it.answer >= 0 && it.answer <= 3, () => `bad answer index ${c()}`);
  check(it.art.length === 4 && it.spoken.length === 4, () => `art/spoken not 4 ${c()}`);
  check(new Set(it.spoken).size === 4 || it.art[0].kind !== "text", () => `spoken choices not unique ${c()}`);
  check(ALLOWED[booth][g].includes(it.standard), () => `standard ${it.standard} not allowed for ${booth}/${g}`);
  check(new RegExp(`^NC\\.${g}\\.(CC|OA|NBT|G|MD)\\.\\d+$`).test(it.standard), () => `standard format ${it.standard}`);
  check(it.prompt.length > 0 && it.say.length >= it.prompt.length - 20, () => `say text missing ${c()}`);
  check(it.hint.length > 10 && it.explanation.length > 3 && it.skill.length > 3, () => `hint/explanation/skill missing ${c()}`);
  check(it.id.startsWith("cc-"), c);
  const right = it.choices[it.answer];
  const v = it.visual;

  // No negative numbers anywhere in K-1 (and none at all in this game), values in range.
  for (const ch of it.choices) {
    const m = ch.match(/-?\d+/g) ?? [];
    for (const s of m) {
      check(Number(s) >= 0, () => `negative value ${c()}`);
      check(Number(s) <= MAX_VALUE[g], () => `value ${s} out of grade ${g} range ${c()}`);
    }
  }

  switch (v.kind) {
    case "objects": {
      check(booth === "balloons" && g === "K", c);
      check(v.n >= 1 && v.n <= 20, () => `K count out of range ${c()}`);
      check(right === String(v.n), () => `count answer wrong ${c()}`);
      check(it.choices.every(isInt) && nums(it).every((n) => n >= 1 && n <= 20), () => `K count choices ${c()}`);
      check(it.hintSteps.length === v.n && it.hintSteps[v.n - 1] === String(v.n), () => `count hint steps ${c()}`);
      break;
    }
    case "tens": {
      const n = v.tens * 10 + v.ones;
      check(v.ones >= 0 && v.ones <= 9 && n >= 11 && n <= 120, () => `tens range ${c()}`);
      check(right === String(n), () => `tens answer wrong (${n}) ${c()}`);
      check(it.choices.every(isInt), c);
      check(it.hintSteps[it.hintSteps.length - 1] === String(n), () => `tens hint end ${c()}`);
      break;
    }
    case "skip": {
      check([2, 5, 10, 100].includes(v.step), c);
      check(v.seq.length === 4 && v.seq.filter((t) => t === null).length === 1, () => `seq blank ${c()}`);
      const bi = v.seq.indexOf(null);
      const known = v.seq.map((t, i) => (t === null ? null : { t, i })).filter(Boolean) as { t: number; i: number }[];
      const start = known[0].t - known[0].i * v.step;
      check(known.every((k) => k.t === start + k.i * v.step), () => `seq not by ${v.step}s ${c()}`);
      const ans = start + bi * v.step;
      check(right === String(ans), () => `skip answer wrong (${ans}) ${c()}`);
      check(start > 0 && start % v.step === 0, () => `seq should start on a multiple ${c()}`);
      check(v.groups * v.step === start + 3 * v.step, () => `picture groups don't reach the last term ${c()}`);
      check(v.step !== 2 || start + 3 * v.step <= 20, () => `count by 2s within 20 ${c()}`);
      check(start + 3 * v.step <= 1000, () => `within 1000 ${c()}`);
      check(it.standard === (v.step === 2 ? "NC.2.OA.3" : "NC.2.NBT.2"), () => `skip standard ${c()}`);
      break;
    }
    case "rope": {
      const cc = v.op === "+" ? v.a + v.b : v.a - v.b;
      check(cc === v.c, () => `rope c wrong ${c()}`);
      check(v.a >= 0 && v.b >= 0 && v.c >= 0, () => `rope negative ${c()}`);
      const ans = v.unknown === "b" ? v.b : v.c;
      check(right === String(ans), () => `rope answer wrong ${c()}`);
      check(it.choices.every(isInt), c);
      const maxC = g === "K" ? 10 : g === "1" ? 20 : 100;
      check(Math.max(v.a, v.b, v.c) <= maxC, () => `rope values over ${maxC} ${c()}`);
      if (it.standard === "NC.K.OA.3") check(v.op === "+" && v.c === 5 && v.unknown === "b", () => `make 5 ${c()}`);
      if (it.standard === "NC.K.OA.4") check(v.op === "+" && v.c === 10 && v.unknown === "b", () => `make 10 ${c()}`);
      if (it.standard === "NC.K.OA.5") check(Math.max(v.a, v.b, v.c) <= 5, () => `within 5 ${c()}`);
      if (it.standard === "NC.1.OA.6" || it.standard === "NC.2.OA.2") check(Math.max(v.a, v.b, v.c) <= 20, () => `within 20 ${c()}`);
      if (v.counters) {
        const red = v.counters.filter((k) => k === "red").length;
        const other = v.counters.length - red;
        if (v.op === "+") check(red === v.a && other === v.b, () => `counters + ${c()}`);
        else check(red === v.c && v.counters.filter((k) => k === "cross").length === v.b, () => `counters − ${c()}`);
      }
      break;
    }
    case "ducks": {
      const counts = it.art.map((a) => (a.kind === "ducks" ? a.n : -1));
      check(counts.every((n) => n >= 1 && n <= 10), () => `duck counts ${c()}`);
      const ok = (n: number) => (v.ask === "more" ? n > v.n : v.ask === "fewer" ? n < v.n : n === v.n);
      check(ok(counts[it.answer]), () => `duck answer not ${v.ask} than ${v.n} ${c()}`);
      check(counts.filter(ok).length === 1, () => `more than one duck pond fits ${c()}`);
      break;
    }
    case "numcmp": {
      const ok = (n: number) => (v.ask === "more" ? n > v.n : n < v.n);
      check(ok(Number(right)), () => `numcmp answer ${c()}`);
      check(nums(it).filter(ok).length === 1, () => `numcmp several right ${c()}`);
      check(nums(it).every((n) => n >= 1 && n <= 10), c);
      break;
    }
    case "compare": {
      const truthy = it.choices.map((s) => {
        const m = s.match(/^(\d+) ([<>=]) (\d+)$/);
        if (!m) return null;
        const x = Number(m[1]);
        const y = Number(m[3]);
        return m[2] === "<" ? x < y : m[2] === ">" ? x > y : x === y;
      });
      check(truthy.every((t) => t !== null), () => `bad statement ${c()}`);
      check(truthy[it.answer] === true && truthy.filter(Boolean).length === 1, () => `compare: not exactly one true ${c()}`);
      const lo = g === "1" ? 10 : 100;
      const hi = g === "1" ? 99 : 999;
      check(v.a >= lo && v.a <= hi && v.b >= lo && v.b <= hi, () => `compare range ${c()}`);
      check(right.startsWith(`${v.a} `) && right.endsWith(` ${v.b}`), () => `compare answer about a,b ${c()}`);
      break;
    }
    case "pick-shape": {
      const shapes = it.art.map((a) => (a.kind === "shape" ? a.shape : null));
      check(shapes.every(Boolean) && new Set(shapes).size === 4, () => `shape art ${c()}`);
      const isSolid = (s: string | null) => (SOLIDS as string[]).includes(s ?? "");
      if (v.target === "flat" || v.target === "solid") {
        const fits = shapes.map((s) => (v.target === "solid" ? isSolid(s) : (FLATS as string[]).includes(s ?? "")));
        check(fits[it.answer] && fits.filter(Boolean).length === 1, () => `flat/solid ${c()}`);
      } else {
        check(shapes[it.answer] === v.target && right === v.target, () => `shape answer ${c()}`);
        check(!(v.target === "rectangle" && shapes.includes("square")), () => `square shown when rectangle asked ${c()}`);
      }
      break;
    }
    case "pick-frac": {
      const fits = it.art.map((a) => a.kind === "frac" && a.parts === v.parts && a.equal && a.shaded === v.shaded);
      check(fits[it.answer] && fits.filter(Boolean).length === 1, () => `fraction ${c()}`);
      check(it.art.every((a) => a.kind === "frac" && a.shaded === v.shaded && a.form === (it.art[0] as { form: string }).form), () => `fraction art mixed ${c()}`);
      break;
    }
    case "clock": {
      check(v.h >= 1 && v.h <= 12 && v.m >= 0 && v.m < 60, () => `clock range ${c()}`);
      check(g === "1" ? v.m % 30 === 0 : v.m % 5 === 0, () => `clock minutes step ${c()}`);
      check(right === `${v.h}:${String(v.m).padStart(2, "0")}`, () => `clock answer ${c()}`);
      for (const ch of it.choices) {
        const m = ch.match(/^(\d{1,2}):(\d\d)$/);
        check(!!m && Number(m[1]) >= 1 && Number(m[1]) <= 12 && Number(m[2]) < 60, () => `bad time choice ${ch} ${c()}`);
      }
      // Hands: hour hand angle from 12 o'clock, minute hand angle.
      const hourDeg = ((v.h % 12) + v.m / 60) * 30;
      const minDeg = v.m * 6;
      check(Math.abs(hourDeg / 30 - (v.h % 12) - v.m / 60) < 1e-9 && minDeg === v.m * 6, c);
      break;
    }
    case "coins": {
      const total = v.coins.reduce((s, k) => s + MY_CENTS[k], 0);
      check(total === v.coins.reduce((s, k) => s + COIN_CENTS[k as CoinName], 0), () => `coin table ${c()}`);
      check(total >= 2 && total <= 99, () => `coin total range ${c()}`);
      check(right === `${total}¢`, () => `coin answer ${total} ${c()}`);
      check(it.choices.every((s) => /^\d+¢$/.test(s) && Number(s.slice(0, -1)) >= 1), () => `coin choices ${c()}`);
      check(v.coins.every((k, i) => i === 0 || MY_CENTS[v.coins[i - 1]] >= MY_CENTS[k]), () => `coins sorted big to small ${c()}`);
      check(it.hintSteps[it.hintSteps.length - 1] === String(total), () => `coin hint end ${c()}`);
      // Coins are drawn without values, so the hint teaches each coin's name and value, and read-aloud names them.
      for (const k of new Set(v.coins)) {
        check(it.hint.includes(`${k} is ${MY_CENTS[k]}¢`), () => `coin hint should say "${k} is ${MY_CENTS[k]}¢" ${c()}`);
        check(new RegExp(`\\d+ ${k === "penny" ? "penn(y|ies)" : `${k}s?`}\\b`).test(it.say), () => `read-aloud should name the ${k}s: "${it.say}"`);
      }
      break;
    }
  }
}

/* -------------------------------------------------------------- coin art */

{
  // Real US coins by look: no printed value or words, relative sizes dime < penny < nickel < quarter,
  // copper penny, ridged dime and quarter.
  const svg = (k: CoinName) => renderToStaticMarkup(createElement(Coin, { name: k }));
  for (const k of ["penny", "nickel", "dime", "quarter"] as CoinName[]) {
    const m = svg(k);
    check(!/<text|¢|\d+\s*c\b/i.test(m.replace(/<svg[^>]*>/, "")), () => `coin ${k} must not print a value or words: ${m.slice(0, 160)}`);
    check(new RegExp(`width="${coinPx(k)}"`).test(m), () => `coin ${k} size ${coinPx(k)}`);
    check((m.match(/stroke-dasharray/g) ?? []).length === (k === "dime" || k === "quarter" ? 1 : 0), () => `coin ${k} ridged edge`);
  }
  check(coinPx("dime") < coinPx("penny") && coinPx("penny") < coinPx("nickel") && coinPx("nickel") < coinPx("quarter"), () => "coin sizes dime < penny < nickel < quarter");
  check(Math.abs(COIN_MM.quarter / COIN_MM.dime - 24.26 / 17.91) < 0.01, () => "coin sizes follow real diameters");
  check(/#c8733f/i.test(svg("penny")) && !/#c8733f/i.test(svg("dime")), () => "penny is copper, dime is not");
}

/* -------------------------------------------------------------- run generators */

const standardsSeen: Record<string, number> = {};
for (const g of PLAYS) {
  for (const booth of BOOTHS) {
    for (let seed = 1; seed <= SEEDS; seed++) {
      const rng = makeRng(seed * 7919 + booth.length * 31 + g.charCodeAt(0));
      const items = makeRound(rng, booth, g as Grade);
      check(items.length === ROUND_LEN, () => `round length ${booth}/${g}`);
      for (const it of items) {
        checkItem(it, g, booth);
        standardsSeen[it.standard] = (standardsSeen[it.standard] ?? 0) + 1;
      }
      // every level directly as well
      for (let level = 0; level < ROUND_LEN; level++) checkItem(GENERATORS[booth][g](rng, level), g, booth);
    }
  }
}
for (const booth of BOOTHS)
  for (const g of PLAYS)
    for (const code of ALLOWED[booth][g]) check((standardsSeen[code] ?? 0) > 0, () => `standard ${code} never generated (${booth}/${g})`);

// K rounds ramp: first items within 10, last items 11-20.
{
  const rng = makeRng(42);
  for (let t = 0; t < 200; t++) {
    const r = makeRound(rng, "balloons", "K");
    const ns = r.map((it) => (it.visual.kind === "objects" ? it.visual.n : -1));
    check(ns.slice(0, 3).every((n) => n <= 10) && ns.slice(3).every((n) => n >= 11 && n <= 20), () => `K ramp ${ns}`);
  }
}

// Grades above 2 play grade-2 content.
check(playGrade("5") === "2" && playGrade("12") === "2" && playGrade("K") === "K" && playGrade("1") === "1", () => "playGrade mapping");
{
  const it = makeRound(makeRng(9), "shapes", "7")[0];
  check(it.grade === "2", () => "grade 7 should get grade-2 items");
}

/* -------------------------------------------------------------- rules: no losing */

{
  const rng = makeRng(2024);
  for (let t = 0; t < 300; t++) {
    const booth = BOOTHS[t % 4];
    const g = PLAYS[t % 3];
    const r = new Round(makeRound(rng, booth, g as Grade));
    let expected = 0;
    let solvedCount = 0;
    while (!r.finished) {
      const it = r.item;
      // Tap every wrong answer (several times each) before the right one.
      const wrongs = [0, 1, 2, 3].filter((i) => i !== it.answer);
      const nWrong = Math.floor(rng() * 4);
      for (let k = 0; k < nWrong; k++) {
        const res = r.pick(wrongs[k % 3]);
        check(res === "wrong", () => `wrong tap should be "wrong", got ${res}`);
        check(!r.finished && !r.solved, () => "a wrong tap ended the item or the round");
        r.pick(wrongs[k % 3]); // same wrong again: still no harm
      }
      const distinctWrong = Math.min(nWrong, 3);
      check(r.tries === distinctWrong, () => `tries ${r.tries} != ${distinctWrong}`);
      check(r.hintLevel === (distinctWrong === 0 ? 0 : distinctWrong === 1 ? 1 : 2), () => "hint level");
      check(r.next() === false || false, () => "next() before solving must not advance");
      check(r.idx === solvedCount, () => "next() advanced an unsolved item");
      check(r.pick(it.answer) === "right", () => "right tap");
      check(r.pick(it.answer) === "ignored", () => "double tap after solving should be ignored");
      expected += distinctWrong === 0 ? TICKETS_FIRST_TRY : TICKETS_LATER;
      solvedCount++;
      r.next();
    }
    check(solvedCount === ROUND_LEN, () => "round ended early");
    check(r.tickets === expected + ROUND_BONUS, () => `tickets ${r.tickets} != ${expected + ROUND_BONUS}`);
    check(r.pick(0) === "ignored", () => "pick after finish");
  }
  // A thousand wrong taps never end the game.
  const r = new Round(makeRound(makeRng(5), "ducks", "K"));
  const wrong = (r.item.answer + 1) % 4;
  for (let k = 0; k < 1000; k++) r.pick(wrong);
  check(!r.finished && r.idx === 0 && r.tries === 1 && r.hintLevel === 1, () => "1000 wrong taps changed the round");
  r.pick((r.item.answer + 2) % 4);
  check(r.hintLevel === 2, () => "second different wrong tap → show me");
}

/* -------------------------------------------------------------- tickets and prizes */

{
  const store = new Map<string, string>();
  (globalThis as unknown as { localStorage: Storage }).localStorage = {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, String(v)),
    removeItem: (k: string) => void store.delete(k),
    clear: () => store.clear(),
    key: () => null,
    length: 0,
  } as Storage;
  check(SAVE_KEY.startsWith("arcade.count-carnival."), () => "save key must start with arcade.count-carnival.");
  check(JSON.stringify(loadSave()) === JSON.stringify(emptySave()), () => "empty save");
  let s = { ...emptySave(), tickets: 10 };
  check(buyPrize(s, "trophy") === null, () => "can't buy what you can't afford");
  const b = buyPrize(s, "pinwheel");
  check(!!b && b.tickets === 4 && b.prizes.includes("pinwheel"), () => "buy pinwheel");
  s = b!;
  check(buyPrize(s, "pinwheel") === null, () => "can't buy a prize twice");
  writeSave(s);
  check(store.has(SAVE_KEY) && loadSave().tickets === 4 && loadSave().prizes[0] === "pinwheel", () => "save round-trip");
  store.set(SAVE_KEY, "{not json");
  check(loadSave().tickets === 0, () => "corrupt save falls back");
  check(new Set(PRIZES.map((p) => p.id)).size === PRIZES.length && PRIZES.every((p) => p.cost > 0), () => "prize list");
  check(PRIZES.every((p, i) => i === 0 || PRIZES[i - 1].cost <= p.cost), () => "prizes cheapest first");
}

console.log(`${checks} checks, ${failures} failures`);
console.log("standards:", Object.entries(standardsSeen).sort().map(([k, n]) => `${k}×${n}`).join("  "));
if (failures) process.exit(1);
