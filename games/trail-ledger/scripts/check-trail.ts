/*
 * npm test: validates Trail Ledger's data, simulation and generators for every grade.
 *   1. resource simulation vs an independent reference implementation
 *   2. every expedition is finishable at every grade 5–12, including worst-case "always pick A"
 *      play with every answer wrong; the calendar ("wintered") and the checkpoint retry work
 *   3. every generated math answer is recomputed by its own solver
 *   4. every event card and landmark cites a source; public-domain excerpts are pre-1929
 *   5. banned-word lint (slurs, "savage", "died of", hunting verbs in player actions, trademark)
 *   6. reading level and length per band (Flesch–Kincaid, Page Quest's checker)
 *   7. bank rules: one correct answer, 4 distinct choices, quick limits, NC code forms
 *   8. data integrity: legs, landmarks, transmissions, store baskets, event pools, canvas glyphs
 */
import { GRADES, gradeNumber } from "../src/kit/grades";
import type { Grade } from "../src/kit/types";
import { BANK, COMING_LATER, EXPEDITIONS } from "../src/data/expeditions";
import { CODE_NAMES, CODE_RE, bandOf, codeFor, playable } from "../src/data/standards";
import type { Band, Expedition } from "../src/data/types";
import { Game, bandEffect, eventsPerLeg } from "../src/game/game";
import { rng } from "../src/game/question";
import { isQuick } from "../src/data/bankutil";
import { applyEffect, cloneSim, dateOf, newSim, travelDay, workStop } from "../src/sim/sim";
import { forecastMath, outfitMath, parseAnswer, type Calc } from "../src/sim/trailmath";
import { lint } from "../src/text/lint";
import { readability } from "../src/text/readability";
import { hasGlyphs } from "../src/render/font";
import { CANVAS_STRINGS } from "../src/render/strings";
import { ALL_GRIDS, PAL } from "../src/render/sprites";
import { sceneIds } from "../src/render/screen";

let failures = 0;
let checks = 0;
const warnings: string[] = [];
function ok(cond: unknown, msg: string) {
  checks++;
  if (!cond) {
    failures++;
    console.error("FAIL:", msg);
  }
}
const BANDS: Band[] = [0, 1, 2];
const PLAY_GRADES = GRADES.filter((g) => playable(g));
const words = (t: string) => (t.match(/[A-Za-z][A-Za-z'’-]*/g) ?? []).length;

/* ================================================================== 1. simulation vs reference */
{
  // Reference: written independently, day by day with plain arithmetic.
  function reference(exp: Expedition, band: Band, pace: number, ration: number, food: number, parts: number, morale: number) {
    let day = 0, f = food, p = parts, m = morale, wear = 0;
    const perDay = Math.round(exp.party * exp.rations[ration].perPerson * 10) / 10;
    const out: { leg: number; day: number; food: number; parts: number; morale: number; ran: number }[] = [];
    let ran = 0;
    for (let leg = 0; leg < exp.legs.length; leg++) {
      let left = exp.legs[leg].miles;
      while (left > 0) {
        let factor = exp.paces[pace].speed;
        if (band >= 1 && m < 25) factor *= 0.85;
        if (band >= 1 && p <= 0 && exp.mode === "wagon") factor *= 0.85;
        const speed = Math.max(1, Math.round(exp.legs[leg].mpd * factor));
        left -= Math.min(speed, left);
        if (f >= perDay) f = Math.round((f - perDay) * 10) / 10;
        else {
          f = 0;
          ran++;
        }
        if (band >= 1) {
          m = Math.max(0, Math.min(100, m + exp.paces[pace].morale + exp.rations[ration].morale));
          wear = Math.round((wear + exp.paces[pace].wear) * 10) / 10;
          while (wear >= 1) {
            wear = Math.round((wear - 1) * 10) / 10;
            if (p > 0) p--;
          }
        }
        day++;
      }
      out.push({ leg, day, food: f, parts: p, morale: m, ran });
    }
    return out;
  }
  let compared = 0;
  for (const exp of EXPEDITIONS) {
    for (const band of BANDS) {
      for (let pace = 0; pace < exp.paces.length; pace++) {
        for (let ration = 0; ration < exp.rations.length; ration++) {
          for (const food of [0, 400, 5000]) {
            const s = newSim(exp, band);
            s.pace = pace;
            s.ration = ration;
            s.res.food = food;
            s.res.parts = 2;
            const ref = reference(exp, band, pace, ration, food, 2, s.res.morale);
            let ran = 0;
            for (let leg = 0; leg < exp.legs.length; leg++) {
              let guard = 0;
              while (guard++ < 1000) {
                const r = travelDay(s, exp);
                if (r.outOfFood) ran++;
                if (r.reached) break;
              }
              const want = ref[leg];
              ok(s.day === want.day && s.res.food === want.food && s.res.parts === want.parts && s.res.morale === want.morale && ran === want.ran,
                `sim vs reference ${exp.id} band ${band} pace ${pace} ration ${ration} food ${food} leg ${leg}: got day ${s.day} food ${s.res.food} parts ${s.res.parts} morale ${s.res.morale} ran ${ran}, want ${JSON.stringify(want)}`);
              compared++;
              if (leg < exp.legs.length - 1) {
                s.leg++;
                s.legMile = 0;
              }
            }
          }
        }
      }
    }
  }
  // Effects, work stops and dates.
  const exp = EXPEDITIONS[1];
  const s = newSim(exp, 2);
  s.res.food = 100;
  applyEffect(s, exp, { days: 2, money: -50, food: 10 });
  ok(s.day === 2 && s.res.money === 0 && s.res.food === 100 + 10 - 2 * 12.5, `applyEffect days/money/food (${s.day}, ${s.res.money}, ${s.res.food})`);
  const before = cloneSim(s);
  workStop(s, exp);
  ok(s.day === before.day + exp.work.days && s.res.money === exp.work.money && s.res.food === before.res.food + exp.work.food, "workStop costs days and adds money and food");
  ok(dateOf(EXPEDITIONS[0], 40).label === "Nov 17, 1753", `Wagon Road day 40 is Nov 17, 1753 (got ${dateOf(EXPEDITIONS[0], 40).label})`);
  console.log(`simulation: ${compared} leg results match the reference`);
}

/* ================================================================== 2. finishable at every grade */
type Strategy = "A" | "last" | "random";
function play(expId: Expedition["id"], grade: Grade, seed: number, strat: Strategy, answers: "wrong" | "right" | "random", opts: { settle?: boolean } = {}) {
  const g = new Game(grade, {}, seed);
  const r = rng(seed ^ 0x5eed);
  g.choose(expId);
  g.begin();
  if (!g.finishOutfit()) return { g, ok: false, why: "outfit refused (basket over budget or weight)" };
  let guard = 0;
  while (g.phase !== "arrived" && guard++ < 20000) {
    switch (g.phase) {
      case "question": {
        const a = g.asking!;
        if (a.done) g.continueQuestion();
        else {
          const right = a.q.answer;
          const wrong = [0, 1, 2, 3].find((i) => i !== right && !a.struck.includes(i))!;
          const pick = answers === "right" ? right : answers === "wrong" ? wrong : r() < 0.6 ? right : wrong;
          g.answer(pick);
        }
        break;
      }
      case "landmark": g.continueLandmark(); break;
      case "travel": g.step(); break;
      case "event": {
        const ch = g.shown!.choices;
        const enabled = ch.map((c, k) => (c.enabled ? k : -1)).filter((k) => k >= 0);
        const k = strat === "A" ? enabled[0] : strat === "last" ? enabled[enabled.length - 1] : enabled[Math.floor(r() * enabled.length)];
        g.decide(k);
        break;
      }
      case "outcome": g.continueOutcome(); break;
      case "notice": g.continueNotice(); break;
      case "fork": g.fork(opts.settle ?? true); break;
      case "wintered": return { g, ok: false, why: `wintered on day ${g.sim.day} at mile ${g.sim.mile}` };
      default: return { g, ok: false, why: `stuck in phase ${g.phase}` };
    }
  }
  return { g, ok: g.phase === "arrived", why: g.phase === "arrived" ? "" : "did not arrive" };
}
{
  let runs = 0;
  const margins: Record<string, number[]> = {};
  for (const exp of EXPEDITIONS) {
    for (const grade of PLAY_GRADES) {
      const runsFor: [Strategy, "wrong" | "right" | "random", number][] = [
        ["A", "wrong", 1], ["A", "right", 2], ["last", "wrong", 3], ["random", "random", 4], ["random", "wrong", 5], ["A", "wrong", 6], ["last", "random", 7],
      ];
      for (const [strat, ans, seed] of runsFor) {
        const res = play(exp.id, grade, seed * 7919 + gradeNumber(grade), strat, ans);
        runs++;
        ok(res.ok, `${exp.id} grade ${grade} strategy ${strat}/${ans} seed ${seed}: ${res.why}`);
        if (res.ok) {
          const key = `${exp.id} band ${bandOf(grade)}`;
          (margins[key] ??= []).push(exp.deadline[bandOf(grade)] - res.g.sim.day);
          ok(res.g.retries === 0, `${exp.id} grade ${grade}: no retry needed`);
          ok(res.g.log.length >= exp.legs.length * 2, `${exp.id} grade ${grade}: answered ${res.g.log.length} questions`);
        }
      }
    }
    if (exp.landmarks.some((l) => l.canEnd)) {
      const res = play(exp.id, "8", 99, "A", "wrong", { settle: false });
      ok(res.ok && res.g.summary().end === exp.landmarks[exp.landmarks.length - 1].name, `${exp.id}: going on past the optional end reaches ${exp.landmarks[exp.landmarks.length - 1].name}`);
      const res2 = play(exp.id, "8", 99, "A", "wrong", { settle: true });
      ok(res2.ok && res2.g.summary().end === exp.landmarks.find((l) => l.canEnd)!.name, `${exp.id}: settling ends at the optional stop`);
    }
  }
  for (const [k, v] of Object.entries(margins)) console.log(`finishable: ${k}: days to spare min ${Math.min(...v)}, max ${Math.max(...v)}`);
  console.log(`finishable: ${runs} bot runs`);

  // Wintered + retry from the checkpoint, at every band.
  for (const exp of EXPEDITIONS) {
    for (const grade of ["5", "8", "11"] as Grade[]) {
      const g = new Game(grade, {}, 4242);
      g.choose(exp.id);
      g.begin();
      g.finishOutfit();
      let guard = 0;
      const pass = () => {
        if (g.phase === "question") g.asking!.done ? g.continueQuestion() : g.answer(g.asking!.q.answer);
        else if (g.phase === "landmark") g.continueLandmark();
        else if (g.phase === "event") g.decide(g.shown!.choices.findIndex((c) => c.enabled));
        else if (g.phase === "outcome") g.continueOutcome();
        else if (g.phase === "notice") g.continueNotice();
        else if (g.phase === "fork") g.fork(false);
      };
      // Reach the second leg, then burn the calendar.
      while (!(g.phase === "travel" && g.sim.leg >= 1) && guard++ < 5000) (g.phase === "travel" ? g.step() : pass());
      ok(g.phase === "travel" && g.sim.leg >= 1, `${exp.id} ${grade}: reached leg 2 for the winter test`);
      const legAtStart = g.sim.leg;
      const dayAtStart = g.sim.day;
      g.sim.day = exp.deadline[g.band] - 1;
      guard = 0;
      while (g.phase !== "wintered" && guard++ < 5000) (g.phase === "travel" ? g.step() : pass());
      ok(g.phase === "wintered", `${exp.id} ${grade}: the calendar ends the leg as ${exp.lateLabel}`);
      g.retry();
      ok(g.phase === "travel" && g.sim.leg === legAtStart && g.sim.day === dayAtStart && g.sim.legMile === 0 && g.retries === 1, `${exp.id} ${grade}: retry restores the leg checkpoint (leg ${g.sim.leg}, day ${g.sim.day})`);
      guard = 0;
      while (g.phase !== "arrived" && g.phase !== "wintered" && guard++ < 20000) (g.phase === "travel" ? g.step() : pass());
      ok(g.phase === "arrived", `${exp.id} ${grade}: arrives after the retry (${g.phase})`);
    }
  }
}

/* ================================================================== 3. math recomputed */
function solve(c: Calc): number {
  switch (c.t) {
    case "sum": return c.prices.reduce((s, p, i) => s + p * c.qty[i], 0);
    case "change": return c.paid - c.prices.reduce((s, p, i) => s + p * c.qty[i], 0);
    case "lasts": return Math.floor(c.amount / c.perDay);
    case "daysTo": return Math.ceil(c.miles / c.mpd);
    case "unitRate": return c.total / c.qty;
    case "percentOf": return (c.base * c.pct) / 100;
    case "markup": return c.base + (c.base * c.pct) / 100;
    case "proportion": return (c.b / c.a) * c.c;
    case "slope": return (c.m2 - c.m1) / (c.d2 - c.d1);
    case "linearAt": return c.m * c.x + c.b;
    case "solveT": return c.d / c.r;
    case "maxUnits": return Math.floor((c.budget - c.fixed) / c.unit);
    case "rateNeeded": return Math.ceil(c.miles / c.days);
    case "budgetLeft": return c.income - c.costs.reduce((a, b) => a + b, 0);
    case "budgetShare": return (c.income * c.pct) / 100;
  }
}
{
  let n = 0;
  const kinds = new Set<string>();
  const r = rng(12345);
  for (const exp of EXPEDITIONS) {
    const items = exp.store.filter((s) => s.price > 0).map((s) => ({ name: s.name, unit: s.unit, price: s.price, qty: s.rec[1] || 2 }));
    for (const grade of PLAY_GRADES) {
      for (let mg = 3; mg <= 12; mg++) {
        for (let k = 0; k < 25; k++) {
          const qs = [
            outfitMath(mg, grade, { items, budget: exp.budget[bandOf(grade)], foodUnit: exp.units.food, where: exp.landmarks[0].name }, r),
            forecastMath(mg, grade, { place: exp.landmarks[2].name, miles: 37 + k * 11, speed: 9 + (k % 9), food: 500, perDay: 12.5, foodUnit: exp.units.food, daysLeft: 5 + k, day: k, mile: 100 + k * 30 }, r),
          ];
          for (const q of qs) {
            n++;
            kinds.add(`${q.calc!.t}:${q.standard}`);
            const want = solve(q.calc!);
            ok(Number.isInteger(want) && want > 0, `${q.id}: answer ${want} is a positive whole number (${JSON.stringify(q.calc)})`);
            ok(parseAnswer(q.choices[q.answer]) === want, `${q.id}: shown answer "${q.choices[q.answer]}" ≠ recomputed ${want} (${q.prompt})`);
            ok(new Set(q.choices).size === 4, `${q.id}: duplicate choices ${q.choices.join(" | ")}`);
            ok(q.choices.every((c, i) => i === q.answer || parseAnswer(c) !== want), `${q.id}: a wrong choice equals the answer`);
            ok(q.prompt.length <= 220 && !!q.explanation && !!q.hint, `${q.id}: prompt length / explanation / hint`);
            if (grade === "12" && (q.calc!.t === "budgetLeft" || q.calc!.t === "budgetShare")) ok(q.standard === "EPF.MCM.1.1", `${q.id}: grade 12 budgeting tagged EPF.MCM.1.1`);
            ok(/^(NC\.\d+\.[A-Z]+\.\d+|NC\.M\d\.[A-Z]+-[A-Z]+\.\d+|EPF\.MCM\.1\.1)$/.test(q.standard), `${q.id}: math code form ${q.standard}`);
          }
        }
      }
    }
  }
  console.log(`math: ${n} generated questions recomputed (${kinds.size} kinds: ${[...kinds].sort().join(", ")})`);
}

/* ================================================================== 4–6. sources, lint, reading level */
{
  const hits: string[] = [];
  const L = (where: string, text: string, o: Parameters<typeof lint>[2] = {}) => lint(where, text, o).forEach((h) => hits.push(`${h.where}: ${h.rule}: "${h.text.slice(0, 80)}"`));
  const RANGE: Record<Band, { words: [number, number]; fk: [number, number] }> = {
    0: { words: [38, 72], fk: [2, 7.5] },
    1: { words: [78, 122], fk: [5, 11] },
    2: { words: [118, 205], fk: [8, 15] },
  };
  const fkBy: Record<Band, number[]> = { 0: [], 1: [], 2: [] };
  for (const exp of EXPEDITIONS) {
    const serious = exp.id === "northbound";
    L(exp.id, `${exp.title} ${exp.route} ${exp.role} ${exp.guide.intro} ${exp.guide.outro} ${exp.lateText} ${exp.historicalNote}`, { serious });
    for (const lm of exp.landmarks) {
      ok(typeof lm.source === "string" && lm.source.length > 20, `${exp.id}/${lm.id}: landmark needs a source`);
      L(`${exp.id}/${lm.id} source`, lm.source, { quoted: true });
      lm.read.forEach((p, b) => {
        const band = b as Band;
        L(`${exp.id}/${lm.id} b${b}`, p.text, { serious });
        const w = words(p.text);
        const fk = readability(p.text).grade;
        fkBy[band].push(fk);
        ok(w >= RANGE[band].words[0] && w <= RANGE[band].words[1], `${exp.id}/${lm.id} band ${b}: ${w} words (want ${RANGE[band].words.join("–")})`);
        ok(fk >= RANGE[band].fk[0] && fk <= RANGE[band].fk[1], `${exp.id}/${lm.id} band ${b}: Flesch–Kincaid ${fk} (want ${RANGE[band].fk.join("–")})`);
        if (p.excerpt) {
          L(`${exp.id}/${lm.id} excerpt`, p.excerpt.quote, { serious, quoted: true });
          ok(p.excerpt.cite.length > 10, `${exp.id}/${lm.id}: excerpt needs a citation`);
          if (p.excerpt.status === "public domain") {
            const year = Number((p.excerpt.cite.match(/\b(1[5-9]\d\d)\b/g) ?? ["9999"]).pop());
            ok(year < 1929, `${exp.id}/${lm.id}: public-domain excerpt must cite a pre-1929 publication (${p.excerpt.cite})`);
          } else ok(/retold/i.test(p.excerpt.cite), `${exp.id}/${lm.id}: non-public-domain excerpt must be labeled "retold"`);
        }
      });
    }
    for (const e of exp.events) {
      ok(typeof e.source === "string" && e.source.length > 20, `${exp.id}/${e.id}: event needs a source`);
      L(`${exp.id}/${e.id} source`, e.source, { quoted: true });
      L(`${exp.id}/${e.id}`, `${e.title}. ${e.text}`, { serious });
      const ew = words(e.text);
      ok(ew >= 15 && ew <= 75, `${exp.id}/${e.id}: event text ${ew} words (15–75)`);
      ok(readability(e.text).grade <= 9.5, `${exp.id}/${e.id}: event reading level ${readability(e.text).grade} (≤ 9.5, read by every band)`);
      ok(e.choices.length >= 2 && e.choices.length <= 4, `${exp.id}/${e.id}: 2–4 choices`);
      for (const band of BANDS) {
        if ((e.minBand ?? 0) > band) continue;
        ok(e.choices.filter((c) => (c.minBand ?? 0) <= band).length >= 2, `${exp.id}/${e.id}: at least 2 choices for band ${band}`);
        ok(e.choices.some((c) => (c.minBand ?? 0) <= band && !bandEffectNeeds(c, band)), `${exp.id}/${e.id}: band ${band} always has a choice with no cost requirement`);
      }
      for (const c of e.choices) {
        ok(c.label.length <= 64, `${exp.id}/${e.id}: choice label too long "${c.label}"`);
        L(`${exp.id}/${e.id} choice`, `${c.label}. ${c.outcome}`, { action: true, serious });
        if (c.later) L(`${exp.id}/${e.id} later`, c.later.text, { action: true, serious });
        ok(!c.effect.days || c.effect.days <= 4, `${exp.id}/${e.id}: a single choice costs at most 4 days`);
      }
    }
    for (const t of exp.transmissions) L(`${exp.id} transmission`, `${t.kind} ${t.from} ${t.text}`, { serious });
    for (const s of exp.store) L(`${exp.id} store`, `${s.name} ${s.unit}`, { action: true });
    L(`${exp.id} work`, `${exp.work.label} ${exp.work.text}`, { action: true, serious });
  }
  for (const b of BANK) L(`bank ${b.id}`, `${b.prompt} ${b.choices.join(" ")} ${b.explanation}`, { serious: b.exp === "northbound" });
  for (const c of COMING_LATER) L("coming later", `${c.title} ${c.note}`);
  hits.forEach((h) => ok(false, `lint: ${h}`));
  for (const b of BANDS) console.log(`reading level band ${b}: Flesch–Kincaid ${Math.min(...fkBy[b]).toFixed(1)}–${Math.max(...fkBy[b]).toFixed(1)} (mean ${(fkBy[b].reduce((a, x) => a + x, 0) / fkBy[b].length).toFixed(1)})`);
}
function bandEffectNeeds(c: { needs?: object }, band: Band): boolean {
  if (!c.needs) return false;
  const n = { ...(c.needs as Record<string, number>) };
  if (band === 0) {
    delete n.parts;
    delete n.trade;
  } else if (band === 1) delete n.trade;
  return Object.values(n).some((v) => v > 0);
}

/* ================================================================== 7. bank rules */
{
  const ids = new Set<string>();
  const prompts = new Set<string>();
  for (const b of BANK) {
    ok(!ids.has(b.id), `duplicate bank id ${b.id}`);
    ids.add(b.id);
    ok(!prompts.has(b.prompt), `duplicate prompt ${b.prompt}`);
    prompts.add(b.prompt);
    ok(b.answer === 0, `${b.id}: correct answer is authored first`);
    ok(b.choices.length === 4, `${b.id}: 4 choices`);
    ok(new Set(b.choices.map((c) => c.trim().toLowerCase())).size === 4, `${b.id}: 4 distinct choices (${b.choices.join(" | ")})`);
    ok(b.choices.every((c) => c.trim().length > 0 && c.length <= 40), `${b.id}: choice length`);
    ok(!b.choices.some((c) => /all of the above|none of the above/i.test(c)), `${b.id}: no all/none of the above`);
    ok(b.quick === isQuick(b.prompt, b.choices, b.passage), `${b.id}: quick flag matches the quick limits`);
    if (b.quick) {
      ok(b.prompt.length <= 100 && b.choices.every((c) => c.length <= 14) && !b.passage, `${b.id}: quick limits`);
    }
    ok(b.prompt.length <= 140, `${b.id}: prompt ≤ 140 chars (${b.prompt.length})`);
    ok(b.explanation.length >= 20 && b.explanation.length <= 220, `${b.id}: explanation length ${b.explanation.length}`);
    ok(CODE_RE[b.band].test(b.code), `${b.id}: code ${b.code} has the band ${b.band} form`);
    ok(b.code in CODE_NAMES, `${b.id}: code ${b.code} is in the verified list (CODE_NAMES)`);
    ok(b.choices[0].length > 3 ? !b.prompt.toLowerCase().includes(b.choices[0].toLowerCase()) : true, `${b.id}: prompt gives away the answer`);
  }
  for (const exp of EXPEDITIONS) {
    for (const band of BANDS) {
      const items = BANK.filter((b) => b.exp === exp.id && b.band === band);
      ok(items.length >= 24 && items.length <= 30, `${exp.id} band ${band}: ~25 items (${items.length})`);
      const general = items.filter((b) => !b.landmark);
      ok(general.length >= exp.transmissions.length + 3, `${exp.id} band ${band}: enough transmission items (${general.length})`);
      for (const lm of exp.landmarks) {
        const n = items.filter((b) => b.landmark === lm.id).length;
        ok(n >= (band === 0 ? 1 : 2), `${exp.id}/${lm.id} band ${band}: landmark questions (${n})`);
      }
    }
  }
  // Codes per grade: preview labels for 6, 7 and 9 only.
  for (const g of PLAY_GRADES) {
    const band = bandOf(g);
    const sample = BANK.find((b) => b.band === band)!;
    const c = codeFor(sample, g);
    const n = gradeNumber(g);
    ok(c.preview === (n === 6 || n === 7 || n === 9), `grade ${g}: preview flag ${c.preview}`);
    if (n === 9) ok(/^8\./.test(c.code), `grade 9 uses grade-8 codes (${c.code})`);
  }
  ok(!playable("4") && playable("5") && playable("12"), "grades 5–12 only");
  console.log(`bank: ${BANK.length} items (${EXPEDITIONS.map((e) => `${e.id} ${BANK.filter((b) => b.exp === e.id).length}`).join(", ")}), ${BANK.filter((b) => b.quick).length} quick`);
}

/* ================================================================== 8. data integrity */
{
  for (const exp of EXPEDITIONS) {
    ok(exp.landmarks.length === exp.legs.length + 1, `${exp.id}: one more landmark than legs`);
    ok(exp.landmarks.length >= 6, `${exp.id}: about 6 landmarks`);
    ok(exp.events.length >= 15 && exp.events.length <= 19, `${exp.id}: 15–18 events (${exp.events.length})`);
    ok(exp.transmissions.length === exp.legs.length, `${exp.id}: one transmission per leg`);
    let mile = 0;
    exp.legs.forEach((l, i) => {
      mile += l.miles;
      ok(exp.landmarks[i + 1].mile === mile, `${exp.id}: landmark ${exp.landmarks[i + 1].id} mile ${exp.landmarks[i + 1].mile} = sum of legs ${mile}`);
    });
    const ids = new Set(exp.events.map((e) => e.id));
    ok(ids.size === exp.events.length, `${exp.id}: unique event ids`);
    for (const band of BANDS) {
      for (let leg = 0; leg < exp.legs.length; leg++) {
        const pool = exp.events.filter((e) => e.legs.includes(leg) && (e.minBand ?? 0) <= band);
        ok(pool.length >= eventsPerLeg(band, leg), `${exp.id} band ${band} leg ${leg}: ${pool.length} events for ${eventsPerLeg(band, leg)} draws`);
      }
      // The default basket fits the budget and the load limit and feeds the party for a while.
      const items = exp.store.filter((s) => (s.minBand ?? 0) <= band);
      const cost = items.reduce((s, it) => s + it.price * it.rec[band], 0);
      const weight = items.reduce((s, it) => s + it.weight * it.rec[band], 0);
      ok(cost <= exp.budget[band], `${exp.id} band ${band}: default basket ${cost} ≤ budget ${exp.budget[band]}`);
      if (band === 2) ok(weight <= exp.weightLimit, `${exp.id}: default basket weight ${weight} ≤ ${exp.weightLimit}`);
      ok(exp.deadline[band] > exp.historicalDays || exp.mode === "rail", `${exp.id}: deadline after the historical pace`);
      ok(band === 0 || exp.deadline[band] <= exp.deadline[band - 1], `${exp.id}: tighter calendar for older bands`);
      items.forEach((it) => ok(Object.keys(bandEffect(it.gives, band)).length > 0 || it.id === "tools" || !!it.gives.morale, `${exp.id}/${it.id}: store item does something at band ${band}`));
    }
    for (const lm of exp.landmarks) ok(lm.read.length === 3, `${exp.id}/${lm.id}: three passages`);
  }
  ok(COMING_LATER.some((c) => /Dan/.test(c.title)) && COMING_LATER.some((c) => /66/.test(c.title)) && COMING_LATER.some((c) => /Bus/.test(c.title)) && COMING_LATER.some((c) => /Archive/.test(c.title)), "locked expeditions listed as coming later");
  for (const s of CANVAS_STRINGS()) ok(hasGlyphs(s), `canvas text has bitmap glyphs: "${s}"`);
  const scenes = new Set(sceneIds());
  for (const exp of EXPEDITIONS) for (const lm of exp.landmarks) ok(scenes.has(lm.scene), `${exp.id}/${lm.id}: scene ${lm.scene} has a painter`);
  for (const [name, grid] of Object.entries(ALL_GRIDS)) {
    ok(grid.every((r) => r.length === grid[0].length), `sprite ${name} is rectangular`);
    ok(grid.every((r) => [...r].every((ch) => ch === "." || ch in PAL)), `sprite ${name} uses known palette letters`);
  }
}

for (const w of warnings) console.log("warning:", w);
console.log(`\n${checks} checks, ${failures} failure(s).`);
process.exit(failures ? 1 : 0);
