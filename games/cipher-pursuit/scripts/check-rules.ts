/*
 * Checks Cipher Pursuit's questions and core rules:   npm test   (tsx scripts/check-rules.ts)
 *
 * Questions — for every grade K-12, many seeds and many car speeds/fuel levels, the checkpoint
 * source must give: exactly 4 different choices, a valid answer index, quick text (prompt ≤ 100,
 * choices ≤ 14 characters) that the pixel font can draw on a lane gate, an explanation, a subject
 * and an NC-style standard code. Every one of the game's own generators is then RECOMPUTED here
 * from its inputs with independent code (distance = speed × time, unit rates, ratios, percents,
 * slopes, linear equations, shift-cipher encode/decode, sight words, context clues…), and no wrong
 * choice may also be right.
 *
 * Rules — lane mapping (x → lane 1-4), the 4-lane road at a gate, steering or keying into a lane,
 * wrong answers never costing a car or ending the game, gadgets for right answers, crashes costing
 * a car and the game ending only when the cars run out, zones (city → coast → river/boat).
 *
 * Timing — RELAXED (default): a player who never answers waits at the gates forever (no auto pass
 * or fail, no hazards, nothing lost) and answering then drives on. NORMAL: every checkpoint gets at
 * least K–2 30 s, ciphers / story problems 25 s, short facts 15 s, more for longer prompts and
 * younger grades, and the countdown only starts after read-aloud. SPEEDY: faster than NORMAL but
 * never under 8 s (14 s for K–2, 12 s for ciphers / story problems).
 */
import { readdirSync } from "fs";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";
import { mathQuestion } from "../src/kit/math";
import { GRADES } from "../src/kit/grades";
import type { Grade, Question } from "../src/kit/types";
import { hasGlyphs, textWidth } from "../src/pursuit/font";
import { CODE_WORDS, EASY_CODE_WORDS } from "../src/pursuit/cipher";
import {
  SIGHT_SENTENCES, SIGHT_SETS, VOCAB, parseNum, type CPQuestion, type Family, type GenCtx,
} from "../src/pursuit/questions";
import {
  CodeSource, GATE_TEXT_MAX, GENERATORS, familiesFor, fitsGates, focusFamilies, kitElaFocusPool, kitElaPool, kitFromGen, kitGensFor, type KitHooks,
} from "../src/pursuit/source";
import {
  MIN_DISTINCT, OFFERED, TOPICS, TOPIC_IDS, availableTopics, gradesNote, parsePref, questionTopic, readUrlFocus, resolveFocus, topicAvailable, topicInfo,
  type FocusPref, type SubjectId, type TopicId,
} from "../src/pursuit/topics";
import { GATE_CX, GATE_HALF, HOLD_GAP, LANE_W, PursuitSim, SETTLE, laneAt, laneCenter, type SimEvent } from "../src/pursuit/sim";
import { TIMING_KEY, answerSeconds, isTiming, speechSeconds, type Timing } from "../src/pursuit/timing";

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

/** Small seeded PRNG so failures can be reproduced. */
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ------------------------------------------------------------ kit banks without Vite */

// The kit's bankFor() uses import.meta.glob (Vite only), so the ELA bank files are loaded directly here.
const ELA: Partial<Record<Grade, Question[]>> = {};
const elaDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "../src/kit/banks/ela");
for (const f of readdirSync(elaDir).filter((f) => /^g(K|\d+)\.ts$/.test(f))) {
  const g = f.match(/^g(K|\d+)\.ts$/)![1] as Grade;
  ELA[g] = (await import(pathToFileURL(path.join(elaDir, f)).href)).default as Question[];
}
const hooks: KitHooks = { math: (g) => mathQuestion(g, { quick: true }), ela: (g) => ELA[g] ?? [] };

/* ------------------------------------------------------------ independent recomputation */

const A = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
/** Independent shift: char codes, not the game's helper. */
function caesar(s: string, k: number): string {
  return s.replace(/[A-Z]/g, (ch) => String.fromCharCode(65 + ((((ch.charCodeAt(0) - 65 + k) % 26) + 26) % 26)));
}
const close = (a: number, b: number) => Math.abs(a - b) < 0.006;
const hoursText = (t: number) => `${t} ${t === 1 ? "hour" : "hours"}`;

/** Returns the true answer value (number or text) for a question from its meta, or null for kit items. */
function expected(q: CPQuestion): { num?: number; text?: string } | null {
  const m = q.meta;
  switch (m.kind) {
    case "drt": return { num: m.speed * (m.minutes !== undefined ? m.minutes / 60 : m.hours) };
    case "rate": return { num: m.dist / m.hours };
    case "ratio": return { num: (m.given / m.a) * m.b };
    case "pctof": return { num: (m.pct / 100) * m.whole };
    case "pctchange": return { num: m.base * (1 + (m.up ? 1 : -1) * (m.pct / 100)) };
    case "fracrate": return { num: (m.mn / m.md) / (m.tn / m.td) };
    case "mpg": return { num: m.mpg * m.gal };
    case "slope": return { num: (m.d2 - m.d1) / (m.t2 - m.t1) };
    case "chase": return { num: m.gap / (m.fast - m.slow) };
    case "lineq": return { num: (m.c - m.b) / m.a };
    case "lineparam": return m.ask === "speed" ? { num: m.m } : { text: "starting miles" };
    case "cipher": return { text: caesar(m.input, m.mode === "decode" ? -m.shift : m.shift) };
    case "cipher-letter": return { text: caesar(m.letter, m.shift) };
    case "cipher-shift": {
      const k = (((A.indexOf(m.coded[0]) - A.indexOf(m.plain[0])) % 26) + 26) % 26;
      return { text: `+${k}` };
    }
    case "arith": {
      const v = m.op === "+" ? m.a + m.b : m.op === "-" ? m.a - m.b : m.op === "×" ? m.a * m.b : m.a / m.b;
      return { num: v };
    }
    case "next": return { num: m.seq[m.seq.length - 1] + m.step };
    case "sight": return { text: m.target };
    case "vocab": {
      const row = VOCAB.find((v) => v[2] === m.word);
      return row ? { text: row[3] } : { text: "?" };
    }
    default: return null;
  }
}

/** Value of a choice: handles fractions like "3/4 mph" as well as decimals. */
function val(s: string): number {
  const f = s.replace(/−/g, "-").match(/(-?\d+)\/(\d+)/);
  return f ? Number(f[1]) / Number(f[2]) : parseNum(s);
}
const fmtPlain = (n: number) => String(Math.round(Math.abs(n) * 100) / 100);
const inPrompt = (q: CPQuestion, ...bits: (string | number)[]) => {
  const p = q.prompt.replace(/,(?=\d{3})/g, "").replace(/−/g, "-");
  for (const b of bits) check(p.includes(String(b)), () => `${q.id}: prompt "${q.prompt}" should mention ${b}`);
};

/** Extra checks that the prompt really states the inputs the answer was computed from. */
function promptMatchesMeta(q: CPQuestion) {
  const m = q.meta;
  switch (m.kind) {
    case "drt": inPrompt(q, `${m.speed} mph`, m.minutes !== undefined ? `${m.minutes} minutes` : hoursText(m.hours)); break;
    case "rate": inPrompt(q, `${m.dist} miles`, hoursText(m.hours)); break;
    case "ratio": inPrompt(q, `${m.a} shields`, `${m.b} turbos`, `${m.given} shields`); break;
    case "pctof": inPrompt(q, `${m.whole} gallons`, `${m.pct}%`); break;
    case "pctchange": inPrompt(q, `${m.base} mph`, `${m.pct}%`, m.up ? "boosts" : "slows"); break;
    case "fracrate": inPrompt(q, `${m.mn}/${m.md} mile`, `${m.tn}/${m.td} hour`); break;
    case "mpg": inPrompt(q, `${m.mpg} miles per gallon`, `${fmtPlain(m.gal)} gallons`); break;
    case "slope": inPrompt(q, m.t2, m.d2, m.d1); break;
    case "chase": inPrompt(q, `${m.gap} miles ahead`, `${m.slow} mph`, `${m.fast} mph`); break;
    case "lineq": {
      const p = q.prompt.replace(/−/g, "-");
      const want = `${m.a}x ${m.b < 0 ? "-" : "+"} ${Math.abs(m.b)} = ${m.c}`;
      check(p.includes(want), () => `${q.id}: equation "${q.prompt}" should read ${want}`);
      check(Number.isInteger((m.c - m.b) / m.a), () => `${q.id}: x should be a whole number`);
      break;
    }
    case "lineparam": inPrompt(q, `d = ${m.m}t + ${m.b}`); break;
    case "cipher": inPrompt(q, m.input, `${m.mode === "decode" ? "back" : "forward"} ${m.shift}`); break;
    case "cipher-letter": inPrompt(q, `forward ${m.shift}`, `What does ${m.letter} become`); break;
    case "cipher-shift": {
      inPrompt(q, m.plain, m.coded);
      const k = (((A.indexOf(m.coded[0]) - A.indexOf(m.plain[0])) % 26) + 26) % 26;
      check(caesar(m.plain, k) === m.coded, () => `${q.id}: ${m.plain} → ${m.coded} is not one shift`);
      check(CODE_WORDS.includes(m.plain) || EASY_CODE_WORDS.includes(m.plain), () => `${q.id}: plain word ${m.plain} not in the word list`);
      break;
    }
    case "cipher":
      break;
    case "arith":
      if (m.op === "÷") inPrompt(q, m.a, m.b);
      else inPrompt(q, m.a, m.b);
      break;
    case "next": inPrompt(q, m.seq.join(", ")); break;
    case "sight":
      if (m.sentence) {
        check(m.sentence.includes("___") && q.prompt.includes(m.sentence), () => `${q.id}: sentence missing`);
      } else {
        check(q.prompt.includes(`"${m.target}"`), () => `${q.id}: sight word prompt should show "${m.target}"`);
      }
      break;
    case "vocab": inPrompt(q, m.word); break;
    default: break;
  }
}

const STD = /^(NC\.(K|[1-8])\.[A-Z]{1,3}\.\d+|NC\.M[1-4]\.[A-Z]{1,2}-[A-Z]{1,4}\.\d+[a-z]?|NC\.M4\.[A-Z]+\.\d+(\.\d+)?|RF\.(K|[1-5])\.\d|L\.(K|\d{1,2}|9-10|11-12)\.\d|R[LI]\.(K|\d{1,2}|9-10|11-12)\.\d+|W\.(\d{1,2}|9-10|11-12)\.\d)$/;

/** Every rule a lane-gate question must follow. */
function validate(q: CPQuestion, where: string) {
  check(q.choices.length === 4, () => `${where}: ${q.choices.length} choices`);
  check(new Set(q.choices).size === 4, () => `${where}: duplicate choices ${JSON.stringify(q.choices)}`);
  check(Number.isInteger(q.answer) && q.answer >= 0 && q.answer <= 3, () => `${where}: answer index ${q.answer}`);
  check(q.prompt.length > 0 && q.prompt.length <= 100, () => `${where}: prompt length ${q.prompt.length}: ${q.prompt}`);
  check(q.quick === true, () => `${where}: not marked quick`);
  check(!q.passage, () => `${where}: has a passage`);
  for (const c of q.choices) {
    check(c.length > 0 && c.length <= 14, () => `${where}: choice "${c}" is ${c.length} chars`);
    check(hasGlyphs(c), () => `${where}: choice "${c}" has characters the pixel font can't draw`);
    check(textWidth(c) <= GATE_TEXT_MAX, () => `${where}: choice "${c}" too wide for a gate (${textWidth(c)}px)`);
  }
  check(q.explanation.trim().length >= 10, () => `${where}: explanation missing`);
  check(q.subject === "math" || q.subject === "ela", () => `${where}: subject ${q.subject}`);
  check(STD.test(q.standard), () => `${where}: standard "${q.standard}" doesn't look like an NC code`);
  check(q.skill.trim().length > 0, () => `${where}: skill missing`);
  check(fitsGates(q), () => `${where}: fitsGates false`);

  const exp = expected(q);
  if (!exp) return;
  promptMatchesMeta(q);
  const right = q.choices[q.answer];
  if (exp.num !== undefined) {
    check(close(val(right), exp.num), () => `${where}: "${q.prompt}" answer "${right}" but recomputed ${exp.num}`);
    q.choices.forEach((c, i) => {
      if (i !== q.answer) check(!close(val(c), exp.num!), () => `${where}: wrong choice "${c}" equals the answer ${exp.num}`);
    });
    // Units match across choices (all "mph", all "miles", …) so the unit doesn't give it away.
    const unit = (s: string) => s.replace(/[−\-\d.,\s=x/]/g, "").replace(/s$/, "");
    check(new Set(q.choices.map(unit)).size === 1, () => `${where}: mixed units ${JSON.stringify(q.choices)}`);
  } else if (exp.text !== undefined) {
    check(right === exp.text, () => `${where}: "${q.prompt}" answer "${right}" but recomputed "${exp.text}"`);
    q.choices.forEach((c, i) => {
      if (i !== q.answer) check(c !== exp.text, () => `${where}: wrong choice "${c}" equals the answer`);
    });
  }
}

/* ------------------------------------------------------------ 1. the checkpoint source, every grade */

const SEEDS = 300;
const seen: Record<string, Set<Family>> = {};
for (const g of GRADES) {
  seen[g] = new Set();
  const gradeN = g === "K" ? 0 : Number(g);
  for (let seed = 1; seed <= SEEDS; seed++) {
    const r = mulberry32(seed * 7919 + gradeN);
    const src = new CodeSource(g, hooks, r);
    for (let k = 0; k < 4; k++) {
      const drive = { mph: 30 + r() * 60, fuelPct: r() * 100 };
      const q = src.next(drive);
      seen[g].add(q.family);
      validate(q, `grade ${g} seed ${seed} #${k} (${q.family})`);
      check(q.grade === g || q.family === "kitMath", () => `grade ${g}: question tagged grade ${q.grade}`);
    }
  }
  for (const [fam] of familiesFor(gradeN)) {
    check(seen[g].has(fam), () => `grade ${g}: family ${fam} never came up in ${SEEDS * 4} checkpoints`);
  }
}

/* ------------------------------------------------------------ 2. every generator, hammered directly */

const FAMILY_GRADES: Partial<Record<Family, number[]>> = {};
for (let n = 0; n <= 12; n++) for (const [f] of familiesFor(n)) (FAMILY_GRADES[f] ??= []).push(n);
let direct = 0;
for (const [fam, grades] of Object.entries(FAMILY_GRADES) as [Family, number[]][]) {
  const gen = GENERATORS[fam];
  if (!gen) continue;
  for (const n of grades) {
    const grade = GRADES[n];
    const r = mulberry32(n * 100 + fam.length);
    for (let i = 0; i < 1500; i++) {
      const c: GenCtx = { grade, n, r, drive: { mph: 20 + r() * 80, fuelPct: r() * 100 } };
      const q = gen(c);
      check(q !== null, () => `${fam} grade ${grade}: generator gave up`);
      if (!q) continue;
      direct++;
      validate(q, `${fam} g${grade} #${i}`);
    }
  }
}

/* ------------------------------------------------------------ 3. content tables */

for (const [g, sets] of Object.entries(SIGHT_SETS)) {
  for (const s of sets) {
    check(new Set(s).size === 4, () => `sight set ${g} ${s} has repeats`);
    check(s.every((w) => /^[a-z]+$/.test(w)), () => `sight set ${s} has odd characters`);
  }
}
for (const [g, rows] of Object.entries(SIGHT_SENTENCES)) {
  for (const [sentence, ...words] of rows) {
    check((sentence.match(/___/g) ?? []).length === 1, () => `sentence ${g} "${sentence}" needs one blank`);
    check(new Set(words).size === 4, () => `sentence "${sentence}" has repeated words`);
  }
}
const vocabWords = new Set<string>();
for (const [g, sentence, word, meaning, ...wrong] of VOCAB) {
  check(sentence.includes(word), () => `vocab ${word}: not in its sentence`);
  check(word === word.toUpperCase(), () => `vocab ${word}: should be in capitals`);
  check(!vocabWords.has(word), () => `vocab ${word}: listed twice`);
  vocabWords.add(word);
  check(new Set([meaning, ...wrong]).size === 4, () => `vocab ${word}: repeated meanings`);
  check([3, 4, 5].includes(g), () => `vocab ${word}: grade ${g}`);
}
for (const g of ["3", "4", "5"] as Grade[]) {
  check(VOCAB.filter((v) => String(v[0]) === g).length >= 6, () => `grade ${g}: fewer than 6 context-clue items`);
  check(kitElaPool(g, ELA[g] ?? []).length >= 4, () => `grade ${g}: kit ELA pool for gates is tiny`);
}
for (const g of ["K", "1", "2"] as Grade[]) check(kitElaPool(g, ELA[g] ?? []).length >= 3, () => `grade ${g}: kit phonics pool is tiny`);
check(CODE_WORDS.every((w) => /^[A-Z]{2,7}$/.test(w)), () => "cipher words must be 2-7 capitals");
// Self-test of the independent cipher.
check(caesar("HELLO", 3) === "KHOOR" && caesar("KHOOR", -3) === "HELLO" && caesar("XYZ", 3) === "ABC", () => "caesar self-test");

/* ------------------------------------------------------------ 4. lanes and the gate road */

for (let i = 0; i < 4; i++) {
  check(laneAt(laneCenter(i)) === i, () => `lane ${i + 1}: centre maps to ${laneAt(laneCenter(i)) + 1}`);
  check(laneAt(GATE_CX - GATE_HALF + i * LANE_W + 1) === i, () => `lane ${i + 1}: left edge`);
  check(laneAt(GATE_CX - GATE_HALF + (i + 1) * LANE_W - 1) === i, () => `lane ${i + 1}: right edge`);
}
check(laneAt(-50) === 0 && laneAt(999) === 3, () => "lanes clamp to 1-4 off the edges");

/* ------------------------------------------------------------ 5. headless play */

function newSim(g: Grade, seed: number, god = false, timing?: Timing, readAloud = false) {
  const r = mulberry32(seed);
  const src = new CodeSource(g, hooks, r);
  return new PursuitSim({ gradeN: g === "K" ? 0 : Number(g), nextQuestion: (ctx) => src.next(ctx), rand: r, god, timing, readAloud });
}
function run(sim: PursuitSim, seconds: number, until?: (e: SimEvent) => boolean): SimEvent[] {
  const all: SimEvent[] = [];
  for (let t = 0; t < seconds; t += 1 / 60) {
    sim.update(1 / 60);
    const ev = sim.drainEvents();
    all.push(...ev);
    if (until && ev.some(until)) break;
  }
  return all;
}

let played = 0;
for (const g of GRADES) {
  const sim = newSim(g, 1000 + played);
  const startLives = sim.lives;
  let cracked = 0;
  for (let k = 0; k < 8; k++) {
    sim.skipToCheckpoint();
    const ann = run(sim, 2, (e) => e.type === "announce").find((e) => e.type === "announce");
    check(!!ann && sim.phase === "approach", () => `grade ${g}: no checkpoint announced (phase ${sim.phase})`);
    if (!ann || ann.type !== "announce") break;
    const q = ann.q;
    check(sim.roadAt(sim.cp.gateWy).half >= GATE_HALF - 0.5, () => `grade ${g}: road not fully 4 lanes at the gate`);
    check(sim.cp.gateWy - sim.dist >= 600, () => `grade ${g}: too little reading time before the gate`);
    // Alternate: wrong lane by steering, right lane by steering, right lane by key, wrong lane by key.
    const mode = k % 4;
    const wrong = (q.answer + 1 + (k % 3)) % 4;
    if (mode === 0) sim.input.targetX = laneCenter(wrong);
    if (mode === 1) sim.input.targetX = laneCenter(q.answer);
    if (mode === 2) check(sim.choose(q.answer), () => "choose() refused during approach");
    if (mode === 3) sim.choose(wrong);
    const livesBefore = sim.lives;
    const res = run(sim, 40, (e) => e.type === "result").find((e) => e.type === "result");
    sim.input.targetX = null;
    check(!!res, () => `grade ${g}: never reached the gates`);
    if (!res || res.type !== "result") break;
    const wantLane = mode === 0 || mode === 3 ? wrong : q.answer;
    check(res.lane === wantLane, () => `grade ${g} mode ${mode}: passed lane ${res.lane + 1}, wanted ${wantLane + 1}`);
    check(res.correct === (wantLane === q.answer), () => `grade ${g}: result.correct wrong`);
    check(sim.lives === livesBefore, () => `grade ${g}: an answer changed the cars (${livesBefore} → ${sim.lives})`);
    check(sim.phase === "debrief", () => `grade ${g}: phase after the gate is ${sim.phase}`);
    if (res.correct) {
      cracked++;
      const evs = run(sim, 2);
      check(evs.some((e) => e.type === "gadget"), () => `grade ${g}: right answer but no gadget`);
      check(sim.fuel === 100, () => `grade ${g}: right answer should refill fuel`);
    } else {
      run(sim, 2);
      check(!sim.shield || k > 1, () => `grade ${g}: wrong answer gave a gadget`);
    }
    check(sim.continueDrive(), () => `grade ${g}: couldn't drive on`);
    check(sim.phase === "drive", () => `grade ${g}: not driving after the debrief`);
  }
  check(sim.lives === startLives, () => `grade ${g}: wrong answers cost cars`);
  check(sim.correctCount === cracked, () => `grade ${g}: correctCount ${sim.correctCount} vs ${cracked}`);
  check(sim.cleared === 8, () => `grade ${g}: cleared ${sim.cleared}`);
  // Zones: city → coast after 2, river after 4, city after 6; the river turns the car into a boat.
  check(sim.zones.map((z) => z.surface).join(",") === "city,coast,water,city,coast", () => `grade ${g}: zones ${sim.zones.map((z) => z.surface)}`);
  played++;
}

// 20 wrong answers in a row: never a game over.
{
  const sim = newSim("7", 4242);
  for (let k = 0; k < 20; k++) {
    sim.skipToCheckpoint();
    run(sim, 2, (e) => e.type === "announce");
    sim.choose((sim.cp.q!.answer + 2) % 4);
    run(sim, 40, (e) => e.type === "result");
    check(sim.phase === "debrief" && sim.lives === 3, () => `wrong answer #${k + 1}: phase ${sim.phase}, cars ${sim.lives}`);
    sim.continueDrive();
  }
  check(sim.correctCount === 0 && sim.cleared === 20, () => "20 wrong answers bookkeeping");
}

// Boat mode: drive into the river zone.
{
  const sim = newSim("4", 77);
  for (let k = 0; k < 4; k++) {
    sim.skipToCheckpoint();
    run(sim, 2, (e) => e.type === "announce");
    sim.choose(sim.cp.q!.answer);
    run(sim, 40, (e) => e.type === "result");
    sim.continueDrive();
  }
  const evs = run(sim, 8, (e) => e.type === "vehicle");
  check(sim.boat && evs.some((e) => e.type === "vehicle" && e.boat), () => "car should become a boat on the river");
}

// Crashes cost a car; the game ends only when the cars run out.
{
  const sim = newSim("5", 99);
  run(sim, 1);
  for (let k = 0; k < 3; k++) {
    const before = sim.lives;
    sim.invuln = 0;
    sim.enemies.push({ id: 9000 + k, kind: "smudge", off: sim.x - sim.roadAt(sim.dist).cx, wy: sim.dist, vy: 0, w: 10, h: 15, state: "live", t: 0, boat: false });
    const evs = run(sim, 3, (e) => e.type === "gameover");
    check(evs.some((e) => e.type === "crash"), () => `crash #${k + 1} not detected`);
    check(sim.lives === before - 1, () => `crash #${k + 1}: cars ${before} → ${sim.lives}`);
    if (k < 2) check(sim.phase === "drive", () => `after crash #${k + 1} phase ${sim.phase}`);
  }
  check(sim.phase === "over", () => `3 crashes should end the game (phase ${sim.phase})`);
}

// Foam splats a Smudge car; a shield absorbs one hit.
{
  const sim = newSim("6", 5);
  run(sim, 0.5);
  const off = sim.x - sim.roadAt(sim.dist + 60).cx;
  sim.enemies.push({ id: 9100, kind: "smudge", off, wy: sim.dist + 60, vy: sim.speed, w: 10, h: 15, state: "live", t: 0, boat: false });
  sim.input.fire = true;
  const evs = run(sim, 1);
  sim.input.fire = false;
  check(evs.some((e) => e.type === "splat"), () => "foam should splat a Smudge car ahead");
  sim.shield = true;
  sim.invuln = 0;
  sim.enemies.push({ id: 9101, kind: "bumper", off: sim.x - sim.roadAt(sim.dist).cx, wy: sim.dist, vy: 0, w: 10, h: 15, state: "live", t: 0, boat: false });
  const ev2 = run(sim, 0.3);
  check(ev2.some((e) => e.type === "shieldHit") && sim.lives === 3 && !sim.shield, () => "shield should absorb one hit");
}

// A long free drive with a simple driver: nothing throws, the road stays drivable.
{
  const sim = newSim("8", 31337);
  let t = 0;
  for (; t < 240 && sim.phase !== "over"; t += 1 / 60) {
    const road = sim.roadAt(sim.dist + 25);
    sim.input.targetX = road.cx;
    sim.input.fire = Math.floor(t * 3) % 2 === 0;
    if (sim.phase === "approach" && sim.cp.lock === null) sim.choose(sim.cp.q!.answer);
    if (sim.phase === "debrief") sim.continueDrive();
    sim.update(1 / 60);
    sim.drainEvents();
    check(Number.isFinite(sim.x) && Number.isFinite(sim.dist), () => "position went NaN");
  }
  check(sim.cleared >= 3, () => `free drive reached only ${sim.cleared} checkpoints in ${t.toFixed(0)}s`);
}


/* ------------------------------------------------------------ 5b. checkpoint timing */

/** Drive to the next checkpoint and return its question (null if none came up). */
function toCheckpoint(sim: PursuitSim): CPQuestion | null {
  sim.skipToCheckpoint();
  const ann = run(sim, 2, (e) => e.type === "announce").find((e) => e.type === "announce");
  return ann && ann.type === "announce" ? ann.q : null;
}
/** Seconds until the gate result, with no input (cap `max`). */
function secondsToResult(sim: PursuitSim, max: number): { t: number; res: SimEvent | undefined } {
  let t = 0;
  for (; t < max; t += 1 / 60) {
    sim.update(1 / 60);
    const res = sim.drainEvents().find((e) => e.type === "result");
    if (res) return { t, res };
  }
  return { t, res: undefined };
}

// RELAXED (the default) waits forever for an answer: no auto pass/fail, no hazards, nothing lost.
let relaxedRuns = 0;
for (const [g, readAloud] of [["K", true], ["1", false], ["2", true], ["4", false], ["7", false], ["9", true], ["12", false]] as [Grade, boolean][]) {
  for (let k = 0; k < 3; k++) {
    const sim = newSim(g, 600 + k * 13 + Number(g === "K" ? 0 : g), false, undefined, readAloud);
    check(sim.timing === "relaxed", () => "RELAXED should be the default timing");
    for (let skip = 0; skip < k; skip++) {
      toCheckpoint(sim);
      sim.choose(0);
      run(sim, 40, (e) => e.type === "result");
      sim.continueDrive();
    }
    const q = toCheckpoint(sim);
    check(!!q && sim.phase === "approach", () => `relaxed grade ${g}: no checkpoint`);
    if (!q) continue;
    check(!Number.isFinite(sim.cp.timeTotal), () => `relaxed grade ${g}: has a timer (${sim.cp.timeTotal})`);
    const lives = sim.lives;
    const fuel = sim.fuel;
    const score = sim.score;
    // Five minutes with no input at all (in 30 s slices, checking along the way).
    let sawResult = false;
    let sawHazard = false;
    for (let slice = 0; slice < 10; slice++) {
      const evs = run(sim, 30);
      if (evs.some((e) => e.type === "result" || e.type === "crash" || e.type === "spin")) sawResult = true;
      if (sim.enemies.some((e) => e.state === "live")) sawHazard = true;
    }
    relaxedRuns++;
    check(!sawResult, () => `relaxed grade ${g}: the gate passed / something happened with no answer`);
    check(!sawHazard, () => `relaxed grade ${g}: hazards appeared while waiting`);
    check(sim.phase === "approach" && sim.waiting, () => `relaxed grade ${g}: not waiting at the gate after 5 min (phase ${sim.phase})`);
    check(Math.abs(sim.cp.gateWy - sim.dist - HOLD_GAP) < 0.01 && sim.speed === 0, () => `relaxed grade ${g}: car should be stopped ${HOLD_GAP}px before the gate (gap ${sim.cp.gateWy - sim.dist}, speed ${sim.speed})`);
    check(sim.lives === lives && sim.fuel === fuel && sim.score === score, () => `relaxed grade ${g}: waiting changed cars/fuel/score`);
    // Answering then proceeds (and steers into the chosen lane first).
    const lane = (q.answer + k) % 4;
    check(sim.choose(lane), () => `relaxed grade ${g}: choose() refused while waiting`);
    const { t, res } = secondsToResult(sim, 10);
    check(!!res && res.type === "result" && res.lane === lane, () => `relaxed grade ${g}: answering lane ${lane + 1} gave ${res && res.type === "result" ? res.lane + 1 : "no result"}`);
    check(t < 5, () => `relaxed grade ${g}: took ${t.toFixed(1)}s to drive through after answering`);
    check(sim.phase === "debrief" && sim.lives === lives, () => `relaxed grade ${g}: after the answer phase ${sim.phase}, cars ${sim.lives}`);
  }
}

// RELAXED: ▲ held from before the checkpoint never forces it; a fresh ▲ press rushes the gate.
{
  const sim = newSim("3", 8080);
  sim.input.up = true;
  run(sim, 1);
  toCheckpoint(sim);
  const r1 = run(sim, 60, (e) => e.type === "result");
  check(!r1.some((e) => e.type === "result") && sim.waiting, () => "relaxed: holding ▲ through the checkpoint forced the gate");
  sim.input.up = false;
  run(sim, 0.2);
  sim.input.up = true;
  const { t, res } = secondsToResult(sim, 10);
  sim.input.up = false;
  check(!!res && t < 3, () => `relaxed: a fresh ▲ should rush the gate (${res ? t.toFixed(1) + "s" : "no result"})`);
}

// RELAXED: steering into a lane and letting go answers; steering again restarts the settle.
{
  const sim = newSim("6", 9090);
  const q = toCheckpoint(sim)!;
  run(sim, 30); // pull up at the gate
  check(sim.waiting, () => "relaxed steer: not waiting");
  const want = laneAt(sim.x) === 3 ? 2 : 3;
  sim.input.right = want > laneAt(sim.x);
  sim.input.left = !sim.input.right;
  let guard = 0;
  while (laneAt(sim.x) !== want || Math.abs(sim.x - laneCenter(want)) > 6) {
    if (++guard > 600) break;
    if (Math.abs(sim.x - laneCenter(want)) < 3) break;
    run(sim, 1 / 60);
  }
  sim.input.left = sim.input.right = false;
  const half = run(sim, SETTLE * 0.6);
  check(!half.some((e) => e.type === "result") && sim.waiting, () => "relaxed steer: drove through before settling");
  const { res } = secondsToResult(sim, 6);
  check(!!res && res.type === "result" && res.lane === want, () => `relaxed steer: wanted lane ${want + 1}, got ${res && res.type === "result" ? res.lane + 1 : "none"}`);
  check(q.choices.length === 4, () => "relaxed steer: question");
}

// NORMAL / SPEEDY: the numbers. Every question the game can ask, every grade.
const WORDY = new Set(["drt", "rate", "ratio", "pctof", "pctchange", "fracrate", "mpg", "slope", "rateTable", "chase", "lineq", "lineParam", "avgRate", "multWord", "bigMult", "addSub"]);
let timed = 0;
const minNormal: Record<string, number> = {};
for (const g of GRADES) {
  const n = g === "K" ? 0 : Number(g);
  const r = mulberry32(31337 + n);
  const src = new CodeSource(g, hooks, r);
  for (let i = 0; i < 400; i++) {
    const q = src.next({ mph: 30 + r() * 60, fuelPct: 50 });
    const normal = answerSeconds(q, n, "normal");
    const speedy = answerSeconds(q, n, "speedy");
    timed++;
    const cipher = q.family.startsWith("cipher");
    const wordy = WORDY.has(q.family);
    const floor = n <= 2 ? 30 : cipher || wordy ? 25 : 15;
    const where = `timing grade ${g} ${q.family} "${q.prompt}"`;
    check(normal >= floor, () => `${where}: NORMAL ${normal}s < ${floor}s`);
    check(normal >= 15, () => `${where}: NORMAL under 15s`);
    check(speedy < normal, () => `${where}: SPEEDY ${speedy}s not faster than NORMAL ${normal}s`);
    check(speedy >= (n <= 2 ? 14 : cipher || wordy ? 12 : 8), () => `${where}: SPEEDY ${speedy}s under its floor`);
    check(answerSeconds(q, n, "relaxed") === Infinity, () => `${where}: RELAXED should have no timer`);
    const key = n <= 2 ? "K-2" : cipher ? "cipher" : wordy ? "word" : "fact";
    minNormal[key] = Math.min(minNormal[key] ?? Infinity, normal);
  }
}
// Longer prompts and younger grades get more time.
{
  const short = { family: "multFact" as const, prompt: "6 × 7 = ?", choices: ["42", "36", "48", "49"] as CPQuestion["choices"] };
  const long = { ...short, family: "drt" as const, prompt: "Your gadget car drives at 45 mph for 3 hours on the coast road. How far does it go in all?" };
  check(answerSeconds(long, 6, "normal") > answerSeconds(short, 6, "normal"), () => "a longer story problem should get more time than a fact");
  check(answerSeconds(long, 3, "normal") > answerSeconds(long, 9, "normal"), () => "grade 3 should get more time than grade 9 for the same problem");
  check(answerSeconds(long, 1, "normal") >= 30 && answerSeconds(short, 0, "normal") >= 30, () => "K-2 at least 30 s");
}
check(isTiming("relaxed") && isTiming("normal") && isTiming("speedy") && !isTiming("fast"), () => "isTiming");
check(TIMING_KEY.startsWith("arcade.cipher-pursuit."), () => `timing key ${TIMING_KEY}`);

// NORMAL / SPEEDY in the sim: no input → the gate takes at least the timer, and the timer waits for read-aloud.
let timedRuns = 0;
for (const timing of ["normal", "speedy"] as Timing[]) {
  for (const [g, readAloud] of [["K", true], ["2", true], ["2", false], ["5", false], ["7", false], ["7", true], ["10", false]] as [Grade, boolean][]) {
    const sim = newSim(g, 4400 + timing.length + (g === "K" ? 0 : Number(g)), false, timing, readAloud);
    for (let k = 0; k < 3; k++) {
      const q = toCheckpoint(sim);
      if (!q) {
        fail(`${timing} grade ${g}: no checkpoint`);
        break;
      }
      const n = g === "K" ? 0 : Number(g);
      const total = sim.cp.timeTotal;
      check(total === answerSeconds(q, n, timing), () => `${timing} grade ${g}: sim timer ${total} vs answerSeconds`);
      const voice = readAloud ? speechSeconds(q) : 0;
      check(Math.abs(sim.cp.voiceWait - voice) < 0.05, () => `${timing} grade ${g}: voiceWait ${sim.cp.voiceWait} vs ${voice}`);
      if (readAloud) {
        run(sim, Math.max(0, voice - 0.3));
        check(sim.cp.timeLeft === total, () => `${timing} grade ${g}: the timer started during read-aloud (${sim.cp.timeLeft}/${total})`);
        // The page also reports the browser still speaking: the timer keeps waiting.
        sim.voiceBusy = true;
        run(sim, 5);
        check(sim.cp.timeLeft === total && sim.phase === "approach", () => `${timing} grade ${g}: timer ran while the voice was busy`);
        sim.voiceBusy = false;
      }
      const startT = sim.time;
      const { res } = secondsToResult(sim, total + 30);
      const elapsed = sim.time - startT;
      timedRuns++;
      check(!!res, () => `${timing} grade ${g}: never reached the gate (timer ${total}s)`);
      check(elapsed >= total - 0.05, () => `${timing} grade ${g}: gate came after ${elapsed.toFixed(1)}s, timer was ${total}s`);
      check(elapsed <= total + 4, () => `${timing} grade ${g}: gate came ${elapsed.toFixed(1)}s after a ${total}s timer`);
      if (timing === "normal") check(elapsed >= (n <= 2 ? 30 : 15), () => `${timing} grade ${g}: only ${elapsed.toFixed(1)}s`);
      check(sim.lives === 3, () => `${timing} grade ${g}: running out of time cost a car`);
      run(sim, 1.5);
      sim.continueDrive();
    }
  }
}
// Answering early still works in NORMAL / SPEEDY (and doesn't wait for the clock).
for (const timing of ["normal", "speedy"] as Timing[]) {
  const sim = newSim("7", 515, false, timing);
  const q = toCheckpoint(sim)!;
  run(sim, 2);
  sim.choose(q.answer);
  const { t, res } = secondsToResult(sim, 20);
  check(!!res && res.type === "result" && res.correct && t < 8, () => `${timing}: answering early should drive through quickly (${t.toFixed(1)}s)`);
}
console.log(`Timing: ${relaxedRuns} RELAXED waits of 5 min · ${timedRuns} timed gates · ${timed} questions timed · min NORMAL s ${JSON.stringify(minNormal)}`);


/* ------------------------------------------------------------ 6. FOCUS mode (one subject + one topic) */

// MIX is unchanged: the family table per grade is locked here (FOCUS never touches it).
const MIX_TABLE = JSON.stringify(GRADES.map((g) => familiesFor(g === "K" ? 0 : Number(g))));
check(
  MIX_TABLE ===
    '[[["kitMath",3],["addSub",2.5],["countNext",1.5],["sightMatch",3],["kitEla",0.6]],[["kitMath",3],["addSub",2.5],["countNext",1],["sightMatch",1.5],["sightSentence",1.5],["kitEla",0.6]],[["kitMath",3],["addSub",2.5],["countNext",1],["sightSentence",3],["kitEla",0.6]],[["multFact",2],["multWord",2],["kitMath",2],["vocab",2.5],["kitEla",1.5]],[["drt",2.5],["multWord",1],["kitMath",2.5],["vocab",2.5],["kitEla",1.5]],[["drt",2],["bigMult",1.5],["kitMath",2.5],["vocab",2.5],["kitEla",1.5]],[["drt",2],["rate",2],["ratio",1.5],["pctof",2],["kitMath",2.5]],[["drt",2],["fracrate",2],["pctchange",2],["mpg",1.5],["kitMath",2.5]],[["slope",2],["rateTable",2],["chase",2],["kitMath",2.5]],[["lineq",2],["lineParam",1.5],["avgRate",1.5],["cipherDecode",2],["cipherEncode",1],["cipherLetter",0.7],["cipherShift",1],["kitMath",2]],[["lineq",2],["lineParam",1.5],["avgRate",1.5],["cipherDecode",2],["cipherEncode",1],["cipherLetter",0.7],["cipherShift",1],["kitMath",2]],[["lineq",2],["lineParam",1.5],["avgRate",1.5],["cipherDecode",2],["cipherEncode",1],["cipherLetter",0.7],["cipherShift",1],["kitMath",2]],[["lineq",2],["lineParam",1.5],["avgRate",1.5],["cipherDecode",2],["cipherEncode",1],["cipherLetter",0.7],["cipherShift",1],["kitMath",2]]]',
  () => `MIX family table changed: ${MIX_TABLE}`,
);
// MIX ciphers (grades 9-12) keep the harder codes: Math 1 standard, the long word list.
for (const g of ["9", "10", "11", "12"] as Grade[]) {
  const r = mulberry32(555 + Number(g));
  const src = new CodeSource(g, hooks, r);
  for (let i = 0; i < 300; i++) {
    const q = src.next({ mph: 55, fuelPct: 50 });
    if (!q.family.startsWith("cipher")) continue;
    check(q.standard === "NC.M1.F-IF.2", () => `MIX grade ${g}: cipher standard ${q.standard}`);
    const m = q.meta;
    if (m.kind === "cipher") check(CODE_WORDS.includes(m.mode === "decode" ? caesar(m.input, -m.shift) : m.input), () => `MIX grade ${g}: cipher word not from the MIX list`);
  }
}

/** Independent topic check from the standard code / family alone (not the game's classifier). */
function looksLike(topic: TopicId, q: CPQuestion): boolean {
  const s = q.standard;
  switch (topic) {
    case "codes": return q.family.startsWith("cipher") && /^(cipher|cipher-letter|cipher-shift)$/.test(q.meta.kind);
    case "phonics": return /^RF\.(K|[1-5])\.\d$/.test(s);
    case "grammar": return /^L\./.test(s);
    case "ratios": return /^NC\.[67]\.RP\.\d$/.test(s);
    case "factors": return /^NC\.(4\.OA\.4|6\.NS\.4)$/.test(s);
    case "fractions": return /^NC\.[3-6]\.(NF|NBT|NS)\.\d$/.test(s) && (/\.NF\./.test(s) || /decimal|fraction/i.test(q.skill));
    case "numbers": return /^NC\.(K|[1-8])\.(CC|OA|NBT|NS|MD)\.\d$|^NC\.M[1-3]\.N-|^NC\.M4\.N\./.test(s) && !/decimal/i.test(q.skill);
    case "algebra": return /^NC\.[6-8]\.(EE|F)\.\d$|^NC\.M[1-3]\.[AFN]-|^NC\.M4\.AF\./.test(s);
    case "geometry": return /^NC\.(K|[1-8])\.(G|MD)\.\d$|^NC\.M[1-3]\.G-|^NC\.M4\.AF\.2\.2$/.test(s);
  }
}

/** Distinct lane-sized prompts every source of a topic can make at a grade (own families, kit math, kit ELA). */
function capacity(topic: TopicId, g: Grade): number {
  const n = g === "K" ? 0 : Number(g);
  const prompts = new Set<string>();
  const r = mulberry32(31 * n + topic.length);
  for (const [fam] of focusFamilies(topic, n)) {
    const gen = GENERATORS[fam]!;
    for (let i = 0; i < 300; i++) {
      const q = gen({ grade: g, n, r, drive: { mph: 30 + r() * 60, fuelPct: r() * 100 } });
      if (q && fitsGates(q) && questionTopic(q, n) === topic) prompts.add(q.prompt);
    }
  }
  for (const gen of kitGensFor(topic, g)) {
    for (let i = 0; i < 300; i++) {
      const q = kitFromGen(g, gen);
      if (q) prompts.add(q.prompt);
    }
  }
  for (const q of kitElaFocusPool(topic, ELA[g] ?? [])) prompts.add(q.prompt);
  return prompts.size;
}

const FOCUS_DRAWS = 200;
let focusDraws = 0;
const offeredByBand: string[] = [];
for (const g of GRADES) {
  const n = g === "K" ? 0 : Number(g);
  offeredByBand.push(`${g}: ${TOPIC_IDS.filter((t) => topicAvailable(t, g)).join(", ")}`);
  for (const topic of TOPIC_IDS) {
    const cap = capacity(topic, g);
    if (!topicAvailable(topic, g)) {
      // Topics left out really lack lane-sized items at this grade…
      check(cap < MIN_DISTINCT, () => `grade ${g}: ${topic} is not offered but has ${cap} distinct prompts (≥ ${MIN_DISTINCT})`);
      // …and a source asked for one anyway still answers (MIX) instead of hanging.
      const q = new CodeSource(g, hooks, mulberry32(9), { mode: "focus", topic }).next({ mph: 55, fuelPct: 50 });
      validate(q, `grade ${g} unoffered ${topic} fallback`);
      continue;
    }
    check(cap >= MIN_DISTINCT, () => `grade ${g}: ${topic} offered but only ${cap} distinct prompts`);
    const r = mulberry32(1009 * (n + 1) + topic.length * 17);
    const src = new CodeSource(g, hooks, r, { mode: "focus", topic });
    const prompts: string[] = [];
    let own = 0;
    for (let k = 0; k < FOCUS_DRAWS; k++) {
      const q = src.next({ mph: 30 + r() * 60, fuelPct: r() * 100 });
      focusDraws++;
      const where = `focus ${topic} grade ${g} #${k} (${q.family} ${q.standard})`;
      validate(q, where);
      check(q.grade === g, () => `${where}: tagged grade ${q.grade}`);
      check(questionTopic(q, n) === topic, () => `${where}: classified as ${questionTopic(q, n)}: ${q.prompt}`);
      check(looksLike(topic, q), () => `${where}: doesn't look like ${topic}: "${q.prompt}" (${q.skill})`);
      if (q.family !== "kitMath" && q.family !== "kitEla") own++;
      // Easy secret codes for grades 3-8: small shifts, short familiar words.
      if (topic === "codes" && n <= 8) {
        const m = q.meta;
        if (m.kind === "cipher") {
          check(m.shift >= 1 && m.shift <= 3, () => `${where}: easy code shift ${m.shift}`);
          const plain = m.mode === "decode" ? caesar(m.input, -m.shift) : m.input;
          check(EASY_CODE_WORDS.includes(plain) && plain.length <= 4, () => `${where}: easy code word ${plain}`);
        }
        if (m.kind === "cipher-letter") check(m.shift <= 3, () => `${where}: easy letter shift ${m.shift}`);
        if (m.kind === "cipher-shift") check(EASY_CODE_WORDS.includes(m.plain) && val(q.choices[q.answer]) <= 3, () => `${where}: easy key`);
        if (m.kind === "cipher-letter" && n <= 5) check(!q.prompt.includes("wrapping"), () => `${where}: grades 3-5 shouldn't wrap`);
      }
      if (prompts.length && topic !== "phonics") {
        check(prompts[prompts.length - 1] !== q.prompt, () => `${where}: same prompt twice in a row`);
      }
      prompts.push(q.prompt);
    }
    const distinct = new Set(prompts).size;
    check(distinct >= 12, () => `focus ${topic} grade ${g}: only ${distinct} distinct prompts in ${FOCUS_DRAWS}`);
    // Recent prompts are avoided: no prompt again within the next 5 when the pool is big.
    if (cap >= 40) {
      for (let i = 5; i < prompts.length; i++) {
        check(!prompts.slice(i - 5, i).includes(prompts[i]), () => `focus ${topic} grade ${g}: "${prompts[i]}" repeated within 5`);
      }
    }
    // Ratios at grades 6-8 lead with the car's own speed / fuel problems.
    if (topic === "ratios") check(own / FOCUS_DRAWS >= 0.5, () => `focus ratios grade ${g}: only ${own}/${FOCUS_DRAWS} car problems`);
  }
}
// Every subject has something at every grade, so FOCUS is always possible.
for (const g of GRADES) {
  check(availableTopics("math", g).length > 0 && availableTopics("ela", g).length > 0, () => `grade ${g}: a subject has no focus topics`);
}
check(TOPICS.every((t) => OFFERED[t.id].every((n) => n >= 0 && n <= 12)), () => "OFFERED grades out of range");
check(gradesNote("ratios") === "Grades 6–8" && gradesNote("algebra") === "Grades 6+" && gradesNote("phonics") === "Grades K–2"
  && gradesNote("factors") === "Grades 4, 6" && gradesNote("codes") === "Grades 3+" && gradesNote("numbers") === "Grades K–7, 10, 12",
  () => `grade notes: ${TOPIC_IDS.map((t) => gradesNote(t)).join(" | ")}`);

// ALL MATH / ALL ELA at every grade: one subject, lane-sized, checked, varied.
for (const g of GRADES) {
  const n = g === "K" ? 0 : Number(g);
  for (const subject of ["math", "ela"] as SubjectId[]) {
    const r = mulberry32(4093 * (n + 1) + subject.length);
    const src = new CodeSource(g, hooks, r, { mode: "subject", subject });
    const prompts = new Set<string>();
    let codes = 0;
    for (let k = 0; k < FOCUS_DRAWS; k++) {
      const q = src.next({ mph: 30 + r() * 60, fuelPct: r() * 100 });
      focusDraws++;
      const where = `ALL ${subject} grade ${g} #${k} (${q.family} ${q.standard})`;
      validate(q, where);
      check(q.subject === subject, () => `${where}: subject ${q.subject}`);
      check(q.grade === g || q.family === "kitMath", () => `${where}: tagged grade ${q.grade}`);
      if (q.family.startsWith("cipher")) codes++;
      prompts.add(q.prompt);
    }
    check(prompts.size >= 12, () => `ALL ${subject} grade ${g}: only ${prompts.size} distinct prompts`);
    if (subject === "math" && n >= 3) check(codes > 0, () => `ALL math grade ${g}: no secret codes`);
  }
}

// ?topic= / ?subject= parsing
{
  const u = (q: string, g: Grade) => readUrlFocus(q, g);
  const f = (q: string, g: Grade) => JSON.stringify(u(q, g).pref);
  const P = (subject: string, topic: string) => JSON.stringify({ subject, topic });
  check(f("?grade=7&topic=ratios", "7") === P("math", "ratios"), () => "?topic=ratios at grade 7");
  check(f("?topic=RATIOS", "6") === P("math", "ratios"), () => "?topic= is case-insensitive");
  check(f("?grade=5&topic=codes", "5") === P("math", "codes"), () => "?topic=codes at grade 5");
  check(f("?grade=2&topic=phonics", "2") === P("ela", "phonics"), () => "?topic=phonics at grade 2");
  check(f("?grade=1&topic=ratios", "1") === P("math", "all") && /grades 6–8/.test(u("?topic=ratios", "1").note ?? ""),
    () => `?topic=ratios at grade 1: ${JSON.stringify(u("?topic=ratios", "1"))}`);
  check(f("?topic=bogus", "5") === "null" && u("?topic=bogus", "5").note === null, () => "unknown topic is ignored quietly");
  check(f("?topic=", "5") === "null" && f("", "5") === "null" && f("?grade=5", "5") === "null", () => "no topic → keep saved");
  check(f("?topic=math-mix", "5") === P("math", "all") && f("?topic=ela-mix", "9") === P("ela", "all"), () => "menu quiz-mix ids → ALL <subject>");
  check(f("?topic=mix", "5") === P("mixed", "all"), () => "?topic=mix → MIXED");
  check(f("?subject=Math", "5") === P("math", "all") && f("?subject=ELA", "5") === P("ela", "all") && f("?subject=mixed", "5") === P("mixed", "all"), () => "?subject= alone");
  check(f("?topic=codes&subject=Math", "9") === P("math", "codes"), () => "?subject=Math with a math topic");
  check(f("?topic=grammar&subject=ELA", "9") === P("ela", "grammar"), () => "?subject=ELA with an ELA topic");
  check(f("?topic=codes&subject=ela", "9") === "null", () => "?subject that contradicts the topic is ignored");
  check(f("?topic=geography", "5") === "null", () => "other subjects' topics are ignored");
  for (const g of GRADES) {
    for (const t of TOPIC_IDS) {
      const got = u(`?grade=${g}&topic=${t}`, g).pref;
      const sub = topicInfo(t).subject;
      check(JSON.stringify(got) === P(sub, topicAvailable(t, g) ? t : "all"), () => `?topic=${t} at grade ${g}: ${JSON.stringify(got)}`);
    }
  }
}

// Saved subject + topic: parsing, and re-validation when the grade changes.
{
  const P = (subject: string, topic: string) => JSON.stringify({ subject, topic });
  check(JSON.stringify(parsePref(null, null)) === P("mixed", "all"), () => "nothing saved → MIXED");
  check(JSON.stringify(parsePref("oops", "ratios")) === P("mixed", "all"), () => "bad saved subject → MIXED");
  check(JSON.stringify(parsePref("math", "nope")) === P("math", "all"), () => "unknown saved topic → ALL");
  check(JSON.stringify(parsePref("ela", "ratios")) === P("ela", "all"), () => "topic from another subject → ALL");
  check(JSON.stringify(parsePref("math", "ratios")) === P("math", "ratios"), () => "saved focus round trip");
  check(JSON.stringify(parsePref("mixed", "codes")) === P("mixed", "all"), () => "MIXED ignores a topic");
  const r = (subject: SubjectId, topic: TopicId | "all", g: Grade) => JSON.stringify(resolveFocus({ subject, topic } as FocusPref, g));
  check(r("math", "ratios", "7") === '{"mode":"focus","topic":"ratios"}', () => "ratios stays at grade 7");
  check(r("math", "ratios", "5") === '{"mode":"subject","subject":"math"}', () => `ratios at grade 5 → ${r("math", "ratios", "5")}`);
  check(r("math", "ratios", "1") === '{"mode":"subject","subject":"math"}', () => "ratios at grade 1 → ALL MATH");
  check(r("ela", "phonics", "5") === '{"mode":"subject","subject":"ela"}', () => "phonics at grade 5 → ALL ELA");
  check(r("ela", "grammar", "K") === '{"mode":"subject","subject":"ela"}', () => "grammar at K → ALL ELA");
  check(r("math", "codes", "2") === '{"mode":"subject","subject":"math"}', () => "codes at grade 2 → ALL MATH");
  check(r("math", "all", "9") === '{"mode":"subject","subject":"math"}', () => "ALL MATH");
  check(JSON.stringify(resolveFocus({ subject: "mixed", topic: "all" }, "7")) === '{"mode":"mix"}', () => "MIXED → MIX");
  for (const g of GRADES) {
    for (const t of TOPIC_IDS) {
      const got = resolveFocus({ subject: topicInfo(t).subject, topic: t }, g);
      const ok = topicAvailable(t, g) ? got.mode === "focus" && got.topic === t : got.mode === "subject" && got.subject === topicInfo(t).subject;
      check(ok, () => `resolveFocus(${t}, ${g}) → ${JSON.stringify(got)}`);
    }
  }
}

// Headless FOCUS missions: every checkpoint the sim announces is from the topic.
for (const [g, topic] of [["7", "ratios"], ["5", "codes"], ["1", "phonics"], ["10", "geometry"], ["4", "factors"]] as [Grade, TopicId][]) {
  const r = mulberry32(2024 + topic.length);
  const src = new CodeSource(g, hooks, r, { mode: "focus", topic });
  const sim = new PursuitSim({ gradeN: g === "K" ? 0 : Number(g), nextQuestion: (ctx) => src.next(ctx), rand: r });
  for (let k = 0; k < 4; k++) {
    sim.skipToCheckpoint();
    const ann = run(sim, 2, (e) => e.type === "announce").find((e) => e.type === "announce");
    check(!!ann && ann.type === "announce" && questionTopic(ann.q, Number(g)) === topic, () => `focus mission ${topic} grade ${g}: checkpoint ${k + 1} off topic`);
    sim.choose(sim.cp.q!.answer);
    run(sim, 40, (e) => e.type === "result");
    sim.continueDrive();
  }
  check(sim.lives === 3 && sim.correctCount === 4, () => `focus mission ${topic} grade ${g}: bookkeeping`);
}
console.log("Focus topics offered per grade:\n  " + offeredByBand.join("\n  "));

console.log(
  failures === 0
    ? `OK: ${checks} checks · ${GRADES.length} grades × ${SEEDS * 4} checkpoints · ${direct} direct generator runs · ${played} headless missions · ${focusDraws} focus checkpoints`
    : `${failures} failure(s) out of ${checks} checks`,
);
process.exit(failures === 0 ? 0 : 1);
