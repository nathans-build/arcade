/*
 * Dojo Tower checks:   npm test   (npx tsx scripts/check-rules.ts)
 * 1. Every civics and forces question written for this game: exactly 4 unique non-empty choices,
 *    a valid answer index, an explanation, a grade inside its band, an NC code of the right shape
 *    for its grade, `quick` set exactly when the item fits (prompt ≤ 100, choices ≤ 14), enough
 *    items per band, and the numeric answers recomputed independently.
 * 2. The boss-quiz rules: right answers land hits (Thunder Kick on every full meter), wrong answers
 *    never deal damage, cost energy or lives, and every fight is eventually won.
 * 3. The simulation, played headlessly: punches and kicks poof ninjas, ducking/jumping dodge ink
 *    stars, blobs need a low attack, scroll ninjas open a question, the Thunder Kick clears the
 *    screen, losing all energy costs a life, and the whole tower can be climbed.
 * 4. One subject / one topic: for every grade K-12, every topic offered there and every "ALL <SUBJECT>",
 *    60 drawn questions all belong to it, are well formed and varied; topics not offered really lack
 *    questions; topic classification; ?topic= / ?subject= parsing; the saved choice falls back when the
 *    grade changes; and (through Vite's SSR loader, which understands the kit's import.meta.glob)
 *    MIXED is unchanged.
 */
import { GRADES } from "../src/kit/grades";
import type { Grade, Question } from "../src/kit/types";
import { CIVICS } from "../src/dojo/civics";
import { FLOOR_INFO } from "../src/dojo/floors";
import { FORCES, FORCE_SKILL } from "../src/dojo/forces";
import { QUICK_CHOICE, QUICK_PROMPT, bandOf, type Band } from "../src/dojo/qmake";
import {
  FLOORS, METER_MAX, applyAnswer, bossHpFor, newFight, newStreak, resolveBossAnswer, spendThunder,
} from "../src/dojo/rules";
import { DojoSim, GROUND, MAX_ENERGY, START_LIVES, type SimEvent } from "../src/dojo/sim";
import { MATH_GENERATORS, mathQuestion } from "../src/kit/math";
import type { Subject } from "../src/kit/types";
import {
  FOCUS_SUBJECTS, FOCUS_TOPICS, FocusCatalog, FocusDeck, MIN_DISTINCT, MIXED, SUBJECT_CHOICES, SUBJECT_KEY, TOPIC_KEY,
  classifyTopic, focusFromUrl, focusLabel, focusTag, gradeRangeNote, loadFocus, loadStoredTopic, mathHasVariety,
  mathSourceGrade, parseStoredFocus, refocusSavedForGrade, saveFocus, topicForSubject, topicsOf, validateFocus,
  type FocusChoice, type FocusTopicId, type TopicChoice,
} from "../src/dojo/focus";

let failures = 0;
let checks = 0;
function check(cond: boolean, msg: () => string) {
  checks++;
  if (!cond) {
    failures++;
    if (failures <= 80) console.error("FAIL:", msg());
  }
}

/* ------------------------------------------------------------ 1. question banks */

const BANDS: Band[] = ["k2", "g35", "g68", "hs"];
const ids = new Set<string>();

function checkQuestion(q: Question, band: Band, subject: "social" | "science", codeRe: RegExp) {
  const where = `${q.id} "${q.prompt.slice(0, 40)}"`;
  check(!ids.has(q.id), () => `duplicate id ${q.id}`);
  ids.add(q.id);
  check(q.subject === subject, () => `${where}: subject ${q.subject}`);
  check(GRADES.includes(q.grade), () => `${where}: bad grade ${q.grade}`);
  check(bandOf(q.grade) === band, () => `${where}: grade ${q.grade} is not in band ${band}`);
  check(codeRe.test(q.standard), () => `${where}: standard ${q.standard} has an unexpected shape`);
  const n = q.grade === "K" ? "K" : Number(q.grade);
  if (n === "K" || n <= 8) {
    check(q.standard.includes(`${n}.`), () => `${where}: standard ${q.standard} does not match grade ${q.grade}`);
  }
  check(q.skill.trim().length > 2, () => `${where}: missing skill`);
  check(q.prompt.trim().length > 5, () => `${where}: missing prompt`);
  check(Array.isArray(q.choices) && q.choices.length === 4, () => `${where}: needs exactly 4 choices`);
  check(q.choices.every((c) => typeof c === "string" && c.trim().length > 0 && c === c.trim()), () => `${where}: empty or untrimmed choice`);
  check(new Set(q.choices.map((c) => c.toLowerCase())).size === 4, () => `${where}: choices are not unique: ${q.choices.join(" | ")}`);
  check(Number.isInteger(q.answer) && q.answer >= 0 && q.answer <= 3, () => `${where}: bad answer index ${q.answer}`);
  check(q.answer === 0, () => `${where}: author the correct choice first`);
  check(q.explanation.trim().length >= 20, () => `${where}: explanation too short`);
  check(/[.!?)"]$/.test(q.explanation.trim()), () => `${where}: explanation should end with punctuation`);
  check(!q.passage, () => `${where}: no passages in this game's banks`);
  const fits = q.prompt.length <= QUICK_PROMPT && q.choices.every((c) => c.length <= QUICK_CHOICE);
  check(!!q.quick === fits, () => `${where}: quick=${q.quick} but fits=${fits}`);
  if (q.quick) {
    check(q.prompt.length <= QUICK_PROMPT, () => `${where}: quick prompt longer than ${QUICK_PROMPT}`);
    check(q.choices.every((c) => c.length <= QUICK_CHOICE), () => `${where}: quick choice longer than ${QUICK_CHOICE}`);
  }
  // The right answer must not also be hidden in a distractor (e.g. "Vote" vs "Vote!").
  const norm = (c: string) => c.toLowerCase().replace(/[^a-z0-9.]/g, "");
  const right = norm(q.choices[q.answer]);
  check(q.choices.every((c, i) => i === q.answer || norm(c) !== right), () => `${where}: a distractor equals the answer`);
}

const CIVICS_CODE = /^((K|[1-8])\.C&G\.\d+(\.\d+)?|CL\.C&G\.\d+(\.\d+)?)$/;
const FORCES_CODE = /^PS\.(K|[1-8]|Phy)\.\d+(\.\d+)?$/;

for (const band of BANDS) {
  const civ = CIVICS[band];
  const frc = FORCES[band];
  check(civ.length >= 12, () => `civics ${band}: only ${civ.length} questions (want ≥ 12)`);
  check(civ.filter((q) => q.quick).length >= 8, () => `civics ${band}: only ${civ.filter((q) => q.quick).length} quick questions (want ≥ 8 for scrolls)`);
  check(frc.length >= 8, () => `forces ${band}: only ${frc.length} questions (want ≥ 8)`);
  check(frc.filter((q) => q.quick).length >= 6, () => `forces ${band}: only ${frc.filter((q) => q.quick).length} quick questions`);
  for (const q of civ) checkQuestion(q, band, "social", CIVICS_CODE);
  for (const q of frc) {
    checkQuestion(q, band, "science", FORCES_CODE);
    check(FORCE_SKILL.test(q.skill) || /weight|inertia/i.test(q.skill), () => `${q.id}: skill "${q.skill}" is not a forces/motion skill`);
  }
  // Answer positions: authored first, but the deck shuffles; just make sure prompts are not repeated.
  const prompts = [...civ, ...frc].map((q) => q.prompt.toLowerCase());
  check(new Set(prompts).size === prompts.length, () => `${band}: repeated prompt`);
}

// Civics topics required per band
const hasSkill = (band: Band, re: RegExp) => CIVICS[band].some((q) => re.test(q.skill) || re.test(q.prompt));
check(hasSkill("k2", /rule/i) && hasSkill("k2", /helper/i), () => "K-2 civics needs rules and community helpers");
check(hasSkill("g35", /branch/i) && hasSkill("g35", /state government/i) && hasSkill("g35", /local government/i), () => "3-5 civics needs branches, state and local government");
check(hasSkill("g68", /constitution/i) && hasSkill("g68", /bill of rights|amendment/i), () => "6-8 civics needs the Constitution and Bill of Rights");
check(hasSkill("hs", /bill becomes law/i) && hasSkill("hs", /rights and responsibilities/i), () => "9-12 civics needs how a bill becomes law and rights & responsibilities");

// Independent recomputation of the numeric forces answers
const num = (s: string) => Number(s.replace(/,/g, "").replace(/[^\d.]/g, ""));
const byPrompt = (band: Band, start: string) => FORCES[band].find((q) => q.prompt.startsWith(start));
// [band, prompt start, value, the value appears in only one choice]
const NUMERIC: [Band, string, number, boolean?][] = [
  ["g35", "A runner goes 100 meters in 20 seconds", 100 / 20],
  ["g35", "A car travels 60 miles in 2 hours", 60 / 2],
  ["g68", "F = m × a. What force", 2 * 3],
  ["g68", "Forces on a box: 10 N right and 4 N left", 10 - 4, false], // "6 N right" vs "6 N left": direction decides
  ["hs", "A car speeds up from 0 to 20 m/s in 4 s", (20 - 0) / 4],
  ["hs", "What net force gives a 1,200 kg car", 1200 * 2],
  ["hs", "What is the weight of a 5 kg box", 5 * 9.8],
  ["hs", "A ball is dropped from rest. Ignoring air, how fast", 10 * 2],
  ["hs", "A ball is dropped from rest. Ignoring air, how far", 0.5 * 10 * 2 * 2],
  ["hs", "A bike rides at a steady 6 m/s for 15 s", 6 * 15],
  ["hs", "What is the momentum of a 3 kg cart", 3 * 4],
  ["hs", "A 100 N force acts on a ball for 0.5 s", 100 * 0.5],
  ["hs", "You push a 10 kg box with 50 N", (50 - 30) / 10],
];
for (const [band, start, want, unique = true] of NUMERIC) {
  const q = byPrompt(band, start);
  check(!!q, () => `numeric item not found: ${start}`);
  if (q) {
    check(Math.abs(num(q.choices[q.answer]) - want) < 1e-9, () => `${q.id}: answer ${q.choices[q.answer]} but recomputed ${want}`);
    if (unique) check(q.choices.filter((c) => Math.abs(num(c) - want) < 1e-9).length === 1, () => `${q.id}: more than one choice equals ${want}`);
  }
}

// Every band gets a grade for each K-12 grade
for (const g of GRADES as Grade[]) check(BANDS.includes(bandOf(g)), () => `grade ${g} has no band`);
check(FLOOR_INFO.length === FLOORS, () => "five floors expected");
check(new Set(FLOOR_INFO.map((f) => f.bossName)).size === FLOORS, () => "boss names must be unique");
check(FLOOR_INFO.map((f) => f.topic).join() === "ela,math,civics,forces,mixed", () => "floor topics out of order");

/* ------------------------------------------------------------ 2. rules */

{
  let s = newStreak();
  for (let i = 1; i <= 5; i++) {
    const r = applyAnswer(s, true);
    check(r.streak.streak === i, () => `streak after ${i} right = ${r.streak.streak}`);
    check(r.streak.meter === Math.min(METER_MAX, i), () => `meter after ${i} right = ${r.streak.meter}`);
    check(r.filled === (i === METER_MAX), () => `filled flag at ${i}`);
    s = r.streak;
  }
  check(spendThunder(s)?.meter === 0, () => "spending a full meter empties it");
  check(spendThunder({ ...s, meter: 1 }) === null, () => "cannot spend a partial meter");
  const w = applyAnswer(s, false);
  check(w.streak.streak === 0 && w.streak.meter === 0 && w.streak.best === 5, () => "a wrong answer resets streak and meter but keeps best");
}
{
  // Boss: right = 1 damage, every METER_MAX-th right in a row = Thunder Kick (2), wrong = blocked.
  let fight = newFight("g35", 1);
  let st = newStreak();
  check(fight.hp === bossHpFor("g35", 1) && fight.hp > 0, () => "fight starts with full HP");
  let r = resolveBossAnswer(fight, st, false, 1);
  check(r.result.blocked && r.result.damage === 0 && r.fight.hp === fight.hp && !r.result.defeated, () => "wrong answer is blocked with no damage");
  fight = r.fight;
  st = r.streak;
  r = resolveBossAnswer(fight, st, true, 1);
  check(r.result.damage === 1 && r.fight.hp === fight.hp - 1 && !r.result.thunder, () => "right answer deals 1");
  check(r.result.points > 0, () => "right answer scores");
  fight = r.fight;
  st = r.streak;
  r = resolveBossAnswer(fight, st, true, 1);
  fight = r.fight;
  st = r.streak;
  const hpBefore = fight.hp;
  r = resolveBossAnswer(fight, st, true, 1);
  check(r.result.thunder && r.result.damage === Math.min(2, hpBefore), () => `third right in a row is a Thunder Kick (damage ${r.result.damage})`);
  check(r.streak.meter === 0, () => "Thunder Kick empties the meter");
  check(r.fight.combo === 3, () => `combo counts right answers in a row (${r.fight.combo})`);
  // Property test: random answer sequences never raise HP, wrong answers never hurt, and every fight is won.
  let seed = 7;
  const rand = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);
  for (let trial = 0; trial < 2000; trial++) {
    const band = BANDS[trial % 4];
    const floor = 1 + (trial % 5);
    let f = newFight(band, floor);
    let s = newStreak();
    const p = 0.1 + rand() * 0.9;
    let n = 0;
    while (f.hp > 0 && n < 5000) {
      const ok = rand() < p;
      const out = resolveBossAnswer(f, s, ok, floor);
      check(out.fight.hp <= f.hp, () => "boss HP never goes up");
      if (!ok) check(out.fight.hp === f.hp && out.result.damage === 0 && out.result.points === 0, () => "wrong answers never deal damage or points");
      if (ok) check(out.fight.hp < f.hp, () => "right answers always deal damage");
      f = out.fight;
      s = out.streak;
      n++;
    }
    check(f.hp === 0, () => `fight ${trial} did not finish`);
    check(f.right <= f.maxHp, () => "never needs more right answers than HP");
  }
}

/* ------------------------------------------------------------ 3. simulation */

function run(sim: DojoSim, seconds: number, until?: () => boolean): SimEvent[] {
  const evs: SimEvent[] = [];
  for (let t = 0; t < seconds; t += 1 / 60) {
    sim.update(1 / 60);
    evs.push(...sim.events);
    sim.events = [];
    if (until?.()) break;
  }
  return evs;
}
const toRun = (sim: DojoSim) => run(sim, 5, () => sim.mode === "run");
const quiet = (sim: DojoSim) => {
  // Freeze spawning for a controlled test.
  (sim as unknown as { spawnT: number }).spawnT = 1e9;
  (sim as unknown as { scrollsLeft: number[] }).scrollsLeft = [];
};
function placeEnemy(sim: DojoSim, kind: "ninja" | "blob" | "thrower" | "scroll", dx: number) {
  const e = sim.spawn(kind, true);
  e.x = sim.player.x + dx;
  e.speed = 0;
  return e;
}

{
  // Punch and kick poof ninjas in reach
  const sim = new DojoSim("g35", { rng: () => 0.5 });
  toRun(sim);
  check(sim.mode === "run", () => `intro should end in run, got ${sim.mode}`);
  quiet(sim);
  sim.player.facing = 1;
  const e = placeEnemy(sim, "ninja", 16);
  const score0 = sim.score;
  sim.press("punch");
  run(sim, 0.3);
  check(!sim.enemies.includes(e), () => "punch should poof a ninja 16px ahead");
  check(sim.score > score0, () => "poofing a ninja scores");
  const e2 = placeEnemy(sim, "ninja", 24);
  sim.press("kick");
  run(sim, 0.35);
  check(!sim.enemies.includes(e2), () => "kick should reach a ninja 24px ahead");
  const e3 = placeEnemy(sim, "ninja", -16);
  sim.press("punch");
  run(sim, 0.3);
  check(sim.enemies.includes(e3), () => "a punch to the front does not hit a ninja behind");
  sim.enemies = [];

  // Blobs: standing punch misses, ducking punch hits
  const b = placeEnemy(sim, "blob", 14);
  b.t = 0;
  sim.press("punch");
  run(sim, 0.05);
  b.y = 0;
  run(sim, 0.25);
  check(sim.enemies.includes(b), () => "a standing punch should pass over an ink blob");
  sim.enemies = [];
  sim.player.invuln = 5;
  const b2 = placeEnemy(sim, "blob", 14);
  sim.held.down = true;
  run(sim, 1 / 60);
  sim.press("punch");
  run(sim, 0.3);
  sim.held.down = false;
  check(!sim.enemies.includes(b2), () => "a ducking punch should poof an ink blob");
}

{
  // Ink stars: duck under high ones, jump over low ones, standing still gets hit
  const mk = (high: boolean, stance: "stand" | "duck" | "jump") => {
    const sim = new DojoSim("g68", { rng: () => 0.5 });
    toRun(sim);
    quiet(sim);
    const p = sim.player;
    sim.shots.push({ id: 999, x: p.x + 40, y: high ? 22 : 4, vx: -90, high });
    if (stance === "duck") sim.held.down = true;
    const e0 = sim.energy;
    if (stance === "jump") {
      run(sim, 0.2);
      sim.press("jump");
    }
    run(sim, 1);
    return sim.energy < e0;
  };
  check(mk(true, "stand"), () => "a high ink star should hit a standing student");
  check(!mk(true, "duck"), () => "ducking should dodge a high ink star");
  check(mk(false, "stand"), () => "a low ink star should hit a standing student");
  check(!mk(false, "jump"), () => "jumping should clear a low ink star");
}

{
  // Bumps cost 1 energy with a grace period; empty energy costs a life; no lives = game over
  const sim = new DojoSim("g35", { rng: () => 0.5 });
  toRun(sim);
  quiet(sim);
  placeEnemy(sim, "ninja", 4);
  run(sim, 0.1);
  check(sim.energy === MAX_ENERGY - 1, () => `one bump = one energy (energy ${sim.energy})`);
  run(sim, 0.4);
  check(sim.energy === MAX_ENERGY - 1, () => "no second hit during the grace period");
  for (let life = START_LIVES; life >= 1; life--) {
    sim.energy = 1;
    sim.player.invuln = 0;
    sim.enemies = [];
    placeEnemy(sim, "ninja", 3);
    run(sim, 0.1);
    check(sim.mode === "dying", () => `energy 0 should start dying (mode ${sim.mode})`);
    const evs = run(sim, 2.5, () => sim.mode !== "dying");
    if (life > 1) {
      check(sim.mode === "run" && sim.lives === life - 1 && sim.energy === MAX_ENERGY, () => `life lost: mode ${sim.mode} lives ${sim.lives}`);
      check(evs.some((e) => e.type === "lifeLost"), () => "lifeLost event");
    } else {
      check(sim.mode === "over" && evs.some((e) => e.type === "gameOver"), () => "last life lost = game over");
    }
  }
}

{
  // Scroll ninjas open a question; answers never hurt
  const sim = new DojoSim("k2", { rng: () => 0.5 });
  toRun(sim);
  quiet(sim);
  sim.energy = 5;
  sim.player.facing = 1;
  placeEnemy(sim, "scroll", 16);
  sim.press("punch");
  const evs = run(sim, 0.3, () => sim.mode === "scroll");
  check(sim.mode === "scroll" && evs.some((e) => e.type === "scroll"), () => "beating a scroll ninja opens a question");
  const frozen = sim.player.x;
  sim.held.right = true;
  run(sim, 0.5);
  sim.held.right = false;
  check(sim.player.x === frozen, () => "action is frozen while the question is open");
  sim.answerScroll(false);
  check(sim.mode === "run" && sim.energy === 5 && sim.lives === START_LIVES, () => "a wrong scroll answer costs nothing");
  placeEnemy(sim, "scroll", 16);
  sim.press("punch");
  run(sim, 0.3, () => sim.mode === "scroll");
  sim.answerScroll(true);
  check(sim.energy === 7 && sim.streak.streak === 1, () => `a right scroll answer gives energy (energy ${sim.energy})`);

  // Thunder Kick needs a full meter, then clears the screen
  placeEnemy(sim, "ninja", 60);
  placeEnemy(sim, "ninja", 90);
  sim.press("thunder");
  run(sim, 1 / 60);
  check(sim.enemies.length === 2, () => "no Thunder Kick without a full meter");
  sim.streak = { streak: 3, best: 3, meter: METER_MAX };
  sim.press("thunder");
  run(sim, 1 / 60);
  check(sim.enemies.length === 0 && sim.streak.meter === 0, () => "Thunder Kick clears the screen and empties the meter");
}

{
  // Boss fights: wrong answers are blocked forever without cost; right answers win; all 5 floors
  for (const band of BANDS) {
    const sim = new DojoSim(band, { rng: () => 0.3 });
    let towerEv = false;
    for (let floor = 1; floor <= FLOORS; floor++) {
      check(sim.floor === floor, () => `${band}: expected floor ${floor}, got ${sim.floor}`);
      check(sim.dir === (floor % 2 ? 1 : -1), () => `${band}: floor ${floor} direction`);
      toRun(sim);
      sim.warpToBoss();
      sim.held[sim.dir > 0 ? "right" : "left"] = true;
      const evs = run(sim, 8, () => sim.mode === "boss");
      sim.held.left = sim.held.right = false;
      check(sim.mode === "boss" && evs.some((e) => e.type === "bossStart"), () => `${band} floor ${floor}: boss fight should start (mode ${sim.mode})`);
      check(sim.enemies.length === 0, () => "ninjas leave when the floor master arrives");
      const hp0 = sim.fight!.hp;
      const lives0 = sim.lives;
      const energy0 = sim.energy;
      for (let i = 0; i < 12; i++) {
        const r = sim.answerBoss(false)!;
        check(!!r && r.blocked && !r.defeated, () => "wrong answer blocked");
        run(sim, 1);
      }
      check(sim.mode === "boss" && sim.fight!.hp === hp0 && sim.lives === lives0 && sim.energy === energy0, () => `${band} floor ${floor}: wrong answers must not change anything (hp ${sim.fight!.hp}, lives ${sim.lives}, energy ${sim.energy})`);
      let answers = 0;
      while (sim.fight!.hp > 0 && answers < 20) {
        sim.answerBoss(true);
        run(sim, 1.6);
        answers++;
      }
      check(answers <= hp0, () => `${band} floor ${floor}: took ${answers} right answers for ${hp0} HP`);
      const downEvs = run(sim, 2, () => sim.mode === "bossDown");
      check(sim.mode === "bossDown" || downEvs.some((e) => e.type === "bossDown"), () => `${band} floor ${floor}: boss should go down (mode ${sim.mode})`);
      sim.finishFloor();
      const after = run(sim, 3, () => sim.mode === "intro" || sim.mode === "won");
      if (after.some((e) => e.type === "towerCleared")) towerEv = true;
    }
    check(sim.mode === "won" && towerEv, () => `${band}: the tower should be cleared after floor 5 (mode ${sim.mode})`);
    check(sim.lives === START_LIVES, () => `${band}: boss quizzes never cost lives`);
  }
}

{
  // A natural floor with spawning: enemies come and the student can walk to the boss
  const sim = new DojoSim("g35");
  sim.invincible = true;
  toRun(sim);
  sim.held.right = true;
  let sawEnemy = false;
  let sawScroll = false;
  for (let t = 0; t < 60 && sim.mode !== "boss"; t += 1 / 60) {
    sim.update(1 / 60);
    if (sim.enemies.length) sawEnemy = true;
    if (sim.mode === "scroll") {
      sawScroll = true;
      sim.answerScroll(true);
    }
    // swat anything close
    if (sim.enemies.some((e) => Math.abs(e.x - sim.player.x) < 22)) sim.press(sim.enemies[0].kind === "blob" ? "kick" : "punch");
    sim.events = [];
  }
  check(sawEnemy, () => "enemies should spawn on a floor");
  check(sawScroll || sim.mode === "boss", () => "the run should reach the floor master");
  check(sim.player.y >= 0 && GROUND > 0, () => "student stays on or above the floor");
}

/* ------------------------------------------------------------ 4. FOCUS mode */

// The kit's banks, loaded file by file (kit/banks/index.ts uses Vite's import.meta.glob).
type Written = Exclude<Subject, "math">;
const BANK: Record<Written, Partial<Record<Grade, Question[]>>> = { science: {}, ela: {}, social: {} };
for (const s of Object.keys(BANK) as Written[]) {
  for (const g of GRADES) BANK[s][g] = ((await import(`../src/kit/banks/${s}/g${g}.ts`)) as { default: Question[] }).default;
}
const bankSource = (s: Written, g: Grade) => BANK[s][g] ?? [];
const catalog = new FocusCatalog(bankSource);
const gi = (g: Grade) => GRADES.indexOf(g);

// Topic ids are the arcade menu's.
const MENU_IDS: Record<string, string[]> = {
  math: ["numbers", "factors", "ratios", "fractions", "algebra", "geometry"],
  science: ["life", "earth", "physical"],
  ela: ["reading", "phonics", "grammar"],
  social: ["civics", "history", "geography", "economics"],
};
check(FOCUS_SUBJECTS.map((s) => s.id).join() === "math,science,ela,social", () => "focus subjects");
for (const [subj, list] of Object.entries(MENU_IDS)) {
  check(topicsOf(subj as Subject).map((t) => t.id).join() === list.join(), () => `${subj} topic ids: ${topicsOf(subj as Subject).map((t) => t.id)}`);
}
check(FOCUS_TOPICS.length === 16, () => "16 focus topics");
check(SUBJECT_KEY === "arcade.dojo-tower.subject" && TOPIC_KEY === "arcade.dojo-tower.topic", () => "storage keys");
check(SUBJECT_CHOICES.map((s) => s.id).join() === "math,science,ela,social,mixed" && SUBJECT_CHOICES.every((s) => s.note.length > 3), () => "subject row");

// Classification spot checks
const C = (subject: Subject, standard: string, skill = "x") => classifyTopic({ subject, standard, skill });
const CLASSES: [Subject, string, string, FocusTopicId | null][] = [
  ["math", "NC.6.RP.3", "Unit rates", "ratios"], ["math", "NC.7.RP.3", "Percent problems", "ratios"],
  ["math", "NC.5.NF.1", "Add and subtract unlike fractions", "fractions"], ["math", "NC.6.NS.1", "Divide fractions", "fractions"],
  ["math", "NC.5.NBT.7", "Multiply decimals", "fractions"], ["math", "NC.4.NF.7", "Compare decimals", "fractions"],
  ["math", "NC.4.OA.4", "Factors, multiples, and primes", "factors"], ["math", "NC.6.NS.4", "Greatest common factor", "factors"],
  ["math", "NC.6.NS.4", "Least common multiple", "factors"], ["math", "NC.3.OA.4", "Unknown factor", "numbers"],
  ["math", "NC.3.OA.7", "Multiplication facts", "numbers"], ["math", "NC.2.NBT.1", "Place value", "numbers"],
  ["math", "NC.7.NS.1", "Add and subtract integers", "numbers"], ["math", "NC.2.MD.8", "Count money", "numbers"],
  ["math", "NC.6.EE.7", "One-step equations", "algebra"], ["math", "NC.8.F.4", "Slope", "algebra"],
  ["math", "NC.M1.A-REI.3", "Solve linear equations", "algebra"], ["math", "NC.M3.F-TF.2", "Unit circle values", "algebra"],
  ["math", "NC.M4.AF.3.2", "Solve logarithmic equations", "algebra"], ["math", "NC.M4.AF.2.2", "Law of Cosines", "geometry"],
  ["math", "NC.M2.G-SRT.6", "Trigonometric ratios", "geometry"], ["math", "NC.3.MD.7", "Area of rectangles", "geometry"],
  ["math", "NC.5.MD.5", "Volume", "geometry"], ["math", "NC.K.G.4", "Shapes: sides and corners", "geometry"],
  ["math", "NC.7.SP.7", "Probability", null], ["math", "NC.M1.S-ID.2", "Center and spread", null],
  ["science", "PS.Phy.1.2", "x", "physical"], ["science", "PS.Chm.1.1", "x", "physical"], ["science", "PS.K.2", "x", "physical"],
  ["science", "LS.Bio.3.1", "x", "life"], ["science", "LS.4.1.2", "x", "life"], ["science", "ESS.EES.2.2", "x", "earth"], ["science", "ESS.K.1.1", "x", "earth"],
  ["ela", "RL.3.2", "Central message", "reading"], ["ela", "RI.9-10.8", "Logical fallacies", "reading"],
  ["ela", "RF.K.3", "Rhyming words", "phonics"], ["ela", "L.3.2", "Spelling", "phonics"],
  ["ela", "L.4.1", "Relative pronouns", "grammar"], ["ela", "L.9-10.4", "Latin roots", "grammar"],
  ["social", "K.C&G.1", "x", "civics"], ["social", "CL.C&G.2", "x", "civics"], ["social", "WH.H.1.2", "x", "history"],
  ["social", "AH.G.1", "x", "geography"], ["social", "3.E.1.1", "x", "economics"], ["social", "EPF.MCM.1.1", "x", "economics"],
  ["social", "K.B.1.1", "x", null],
];
for (const [subj, std, skill, want] of CLASSES) check(C(subj, std, skill) === want, () => `classify ${subj} ${std} "${skill}" = ${C(subj, std, skill)}, want ${want}`);
// Every kit item gets a topic (except behavioral sciences in social studies), and so does every math generator but statistics.
for (const s of Object.keys(BANK) as Written[]) {
  for (const g of GRADES) {
    for (const q of bankSource(s, g)) {
      const t = classifyTopic(q);
      if (s === "social" && /^(K|\d+|WH|CL|AH)\.B\./.test(q.standard)) check(t === null, () => `${q.id} ${q.standard} should have no topic`);
      else check(t !== null && MENU_IDS[s].includes(t), () => `${q.id} (${s} ${q.standard} "${q.skill}") classified ${t}`);
    }
  }
}
for (const g of GRADES) {
  for (const gen of MATH_GENERATORS[g]) {
    const t = classifyTopic({ subject: "math", standard: gen.standard, skill: gen.skill });
    if (/\.(SP|S-[A-Z]+)\./.test(gen.standard)) check(t === null, () => `${gen.standard} (statistics) should have no topic`);
    else check(t !== null, () => `math generator ${g} ${gen.key} ${gen.standard} "${gen.skill}" has no topic`);
  }
}

// Every grade, every offered topic and every "ALL <SUBJECT>": 60 questions (every third a quick scroll draw).
const offeredAt = new Map<Grade, FocusTopicId[]>();
let focusDraws = 0;
function checkDeck(g: Grade, subject: Subject, topic: TopicChoice) {
  const deck = new FocusDeck(catalog, g, subject, topic);
  const prompts = new Set<string>();
  let lastPrompt = "";
  let backToBack = 0;
  for (let i = 0; i < 60; i++) {
    const q = deck.draw(i % 3 === 0);
    focusDraws++;
    const where = `focus ${g}/${subject}/${topic} #${i} ${q.id} ${q.standard} "${q.prompt.slice(0, 40)}"`;
    if (topic === "all") check(q.subject === subject, () => `${where}: subject ${q.subject}`);
    else check(classifyTopic(q) === topic, () => `${where}: classified ${classifyTopic(q)}`);
    check(q.choices.length === 4 && q.choices.every((c) => typeof c === "string" && c.trim().length > 0), () => `${where}: needs 4 non-empty choices`);
    // Exact strings: capitalization items ("Lake Erie" / "lake erie") differ only by case on purpose.
    check(new Set(q.choices.map((c) => c.trim())).size === 4, () => `${where}: choices not unique: ${q.choices.join(" | ")}`);
    check(Number.isInteger(q.answer) && q.answer >= 0 && q.answer < 4, () => `${where}: bad answer ${q.answer}`);
    check(q.explanation.trim().length >= 5, () => `${where}: no explanation`);
    check(!q.passage, () => `${where}: passages are not used in the tower`);
    check(bandOf(q.grade) === bandOf(g) || Math.abs(gi(q.grade) - gi(g)) <= 1, () => `${where}: grade ${q.grade} too far from ${g}`);
    if (q.prompt === lastPrompt) backToBack++;
    lastPrompt = q.prompt;
    prompts.add(q.prompt);
  }
  check(prompts.size >= (topic === "all" ? 20 : MIN_DISTINCT), () => `focus ${g}/${subject}/${topic}: only ${prompts.size} different questions in 60 draws`);
  check(backToBack === 0, () => `focus ${g}/${subject}/${topic}: the same question twice in a row ${backToBack} times`);
}
for (const g of GRADES) {
  const offered = catalog.available(g);
  offeredAt.set(g, offered);
  for (const s of FOCUS_SUBJECTS) checkDeck(g, s.id, "all");
  for (const topic of offered) checkDeck(g, FOCUS_TOPICS.find((t) => t.id === topic)!.subject, topic);
  // Topics not offered really lack questions at this grade.
  for (const t of FOCUS_TOPICS.filter((x) => !offered.includes(x.id))) {
    if (t.subject === "math") {
      check(mathSourceGrade(g, t.id) === null && !mathHasVariety(g, t.id), () => `${g}/${t.id} not offered but has math`);
      const seen = new Set<string>();
      for (let i = 0; i < 400; i++) {
        const q = mathQuestion(g);
        if (classifyTopic(q) === t.id) seen.add(q.prompt);
      }
      check(seen.size < MIN_DISTINCT, () => `${g}/${t.id} not offered but grade ${g} math made ${seen.size} different questions`);
    } else {
      check(catalog.writtenPool(g, t.id).length < MIN_DISTINCT, () => `${g}/${t.id} not offered but pool has ${catalog.writtenPool(g, t.id).length}`);
      check(catalog.ownCount(g, t.id) < MIN_DISTINCT, () => `${g}/${t.id} not offered but grade ${g} alone has ${catalog.ownCount(g, t.id)}`);
    }
  }
}
// Grade-band expectations from the arcade menu
const offers = (g: Grade, t: FocusTopicId) => offeredAt.get(g)!.includes(t);
for (const g of GRADES) {
  const n = gi(g);
  check(offers(g, "ratios") === (n >= 6 && n <= 8), () => `ratios at grade ${g}: ${offers(g, "ratios")}`);
  if (n <= 3) check(!offers(g, "factors"), () => `factors should not be offered at grade ${g}`);
  if (n <= 2) check(offers(g, "phonics") && offers(g, "numbers"), () => `K-2 needs phonics and numbers (grade ${g})`);
  if (n >= 6) check(!offers(g, "phonics"), () => `phonics should not be offered at grade ${g}`);
  if (n >= 6) check(offers(g, "algebra"), () => `algebra should be offered at grade ${g}`);
  if (n >= 9) check(offers(g, "geometry") && !offers(g, "numbers"), () => `high school math topics at grade ${g}`);
  for (const t of ["life", "earth", "physical", "reading", "grammar", "civics", "history", "geography", "economics"] as FocusTopicId[]) {
    check(offers(g, t), () => `${t} should be offered at grade ${g}`);
  }
}
for (const t of FOCUS_TOPICS) check(GRADES.some((g) => offers(g, t.id)), () => `${t.id} is never offered`);
check(catalog.gradesNote("ratios") === "Grades 6–8", () => `ratios note: ${catalog.gradesNote("ratios")}`);
check(gradeRangeNote(["K", "1", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"]) === "Grades K–1, 3+", () => "grade range note");
check(gradeRangeNote(["4"]) === "Grade 4" && gradeRangeNote([]) === "Not available yet", () => "grade range note (single/empty)");

// Drawing never hangs: an empty bank still gives math, and math topics always answer.
{
  const empty = new FocusCatalog(() => []);
  // With no kit banks, only math and Dojo Tower's own civics and forces sets remain.
  check(empty.available("5").every((t) => FOCUS_TOPICS.find((x) => x.id === t)!.subject === "math" || t === "civics" || t === "physical"), () => `empty banks offer ${empty.available("5")}`);
  const v = validateFocus({ subject: "ela", topic: "reading" }, "5", empty);
  check(v.subject === "ela" && v.topic === "all", () => "a topic the grade lacks falls back to ALL <SUBJECT>");
  const t0 = Date.now();
  const d = new FocusDeck(catalog, "4", "math", "factors");
  for (let i = 0; i < 200; i++) d.draw(true);
  check(Date.now() - t0 < 5000, () => `200 focus math draws took ${Date.now() - t0} ms`);
}

// ?topic= / ?subject=
{
  const u = (search: string, g: Grade) => focusFromUrl(search, g, catalog);
  const is = (c: FocusChoice | null, subject: string, topic?: TopicChoice) =>
    !!c && c.subject === subject && (topic === undefined || (c.subject !== "mixed" && c.topic === topic));
  check(is(u("?grade=7&topic=ratios", "7").choice, "math", "ratios"), () => "?topic=ratios at grade 7");
  check(is(u("?grade=4&topic=civics", "4").choice, "social", "civics"), () => "?topic=civics at grade 4 is social studies");
  const r2 = u("?grade=2&topic=ratios", "2");
  check(r2.choice === null && r2.unavailable === "ratios", () => `?topic=ratios at grade 2 should be ignored: ${JSON.stringify(r2)}`);
  check(u("?topic=dragons", "5").choice === null && u("?topic=dragons", "5").unavailable === null, () => "unknown topic ignored");
  check(u("", "5").choice === null && u("?grade=5", "5").choice === null, () => "no topic: no override");
  check(is(u("?topic=PHONICS", "1").choice, "ela", "phonics"), () => "topic ids are case-insensitive");
  check(is(u("?subject=science", "5").choice, "science", "all"), () => "?subject= alone: ALL SCIENCE");
  check(is(u("?subject=mixed", "5").choice, "mixed"), () => "?subject=mixed");
  check(is(u("?subject=math&topic=all", "5").choice, "math", "all"), () => "?subject=math&topic=all");
  check(is(u("?subject=ela&topic=geometry", "8").choice, "math", "geometry"), () => "the topic decides the subject");
  check(u("?subject=wizardry", "5").choice === null, () => "unknown subject ignored");
  check(u("?topic=", "5").choice === null, () => "empty topic ignored");
}

// Saving, validating and the grade-change fallback (with an in-memory localStorage)
{
  const mem = new Map<string, string>();
  (globalThis as unknown as { localStorage: Pick<Storage, "getItem" | "setItem" | "removeItem"> }).localStorage = {
    getItem: (k) => mem.get(k) ?? null,
    setItem: (k, v) => void mem.set(k, String(v)),
    removeItem: (k) => void mem.delete(k),
  };
  const same = (a: FocusChoice, b: FocusChoice) => JSON.stringify(a) === JSON.stringify(b);
  check(loadFocus().subject === "mixed", () => "nothing saved: MIXED");
  saveFocus({ subject: "math", topic: "ratios" });
  check([...mem.keys()].every((k) => k.startsWith("arcade.dojo-tower.")), () => `keys ${[...mem.keys()]}`);
  check(mem.get(SUBJECT_KEY) === "math" && mem.get(TOPIC_KEY) === "ratios", () => `stored ${JSON.stringify([...mem])}`);
  check(same(loadFocus(), { subject: "math", topic: "ratios" }), () => `saved focus ${JSON.stringify(loadFocus())}`);
  // Grade 7 -> 2: ratios isn't offered, so the saved choice becomes ALL MATH there.
  check(same(refocusSavedForGrade("2", catalog), { subject: "math", topic: "all" }), () => "grade 2 fallback");
  check(same(loadFocus(), { subject: "math", topic: "all" }), () => "fallback saved");
  check(same(refocusSavedForGrade("3", catalog), { subject: "math", topic: "all" }), () => "ALL stays ALL");
  saveFocus({ subject: "ela", topic: "phonics" });
  check(same(refocusSavedForGrade("1", catalog), { subject: "ela", topic: "phonics" }), () => "phonics stays at grade 1");
  check(same(refocusSavedForGrade("10", catalog), { subject: "ela", topic: "all" }), () => "phonics @10 -> ALL ELA");
  // MIXED keeps the last topic for when that subject is picked again.
  saveFocus({ subject: "science", topic: "earth" });
  saveFocus(MIXED);
  check(loadFocus().subject === "mixed" && loadStoredTopic() === "earth", () => "MIXED keeps the last topic");
  check(refocusSavedForGrade("2", catalog).subject === "mixed", () => "MIXED survives a grade change");
  check(topicForSubject("science", "5", catalog) === "earth" && topicForSubject("math", "5", catalog) === "all", () => "topicForSubject");
  check(validateFocus(MIXED, "7", catalog).subject === "mixed", () => "validate MIXED");
  const wrongSubj = validateFocus({ subject: "ela", topic: "ratios" }, "7", catalog);
  check(same(wrongSubj, { subject: "ela", topic: "all" }), () => "a topic from another subject becomes ALL");
  check(parseStoredFocus(null, null).subject === "mixed" && parseStoredFocus("wizardry", "ratios").subject === "mixed", () => "bad stored subject is MIXED");
  check(same(parseStoredFocus("math", "dragons"), { subject: "math", topic: "all" }), () => "bad stored topic is ALL");
  check(same(parseStoredFocus("ela", "ratios"), { subject: "ela", topic: "all" }), () => "stored topic of another subject is ALL");
  check(focusTag({ subject: "math", topic: "ratios" }) === "RATIOS & RATES" && focusTag({ subject: "social", topic: "all" }) === "SOCIAL STUDIES" && focusTag(MIXED) === null, () => "focus tags");
  check(focusLabel({ subject: "math", topic: "ratios" }) === "Math: Ratios & rates" && focusLabel({ subject: "science", topic: "all" }) === "All science", () => "focus labels");
  delete (globalThis as { localStorage?: unknown }).localStorage;
}

// MIX unchanged, and the game's real wiring (kit bankFor via import.meta.glob), through Vite's SSR loader.
{
  const { createServer } = await import("vite");
  const server = await createServer({ configFile: new URL("../vite.config.ts", import.meta.url).pathname, server: { middlewareMode: true, hmr: false }, appType: "custom", logLevel: "error" });
  try {
    const mod = (await server.ssrLoadModule("/src/dojo/topics.ts")) as typeof import("../src/dojo/topics");
    for (const g of ["K", "4", "7", "11"] as Grade[]) {
      const mix = new mod.TopicDecks(g, "dojo-tower-test");
      const mixed = new mod.TopicDecks(g, "dojo-tower-test", MIXED);
      for (let i = 0; i < 12; i++) {
        const quick = i % 2 === 0;
        const e = mix.draw("ela", quick);
        check(e.subject === "ela", () => `MIX ${g} floor 1 drew ${e.subject}`);
        const m = mix.draw("math", quick);
        check(m.subject === "math", () => `MIX ${g} floor 2 drew ${m.subject}`);
        const c = mix.draw("civics", quick);
        check(c.subject === "social" && c.standard.includes("C&G"), () => `MIX ${g} floor 3 drew ${c.subject} ${c.standard}`);
        const f = mix.draw("forces", quick);
        check(f.subject === "science", () => `MIX ${g} floor 4 drew ${f.subject}`);
      }
      for (let i = 0; i < 6; i++) {
        const f = FLOOR_INFO[i % 4];
        const q = mixed.draw(f.topic, false);
        const want = { ela: "ela", math: "math", civics: "social", forces: "science", mixed: "" }[f.topic];
        check(q.subject === want, () => `MIXED ${g} floor ${f.n} drew ${q.subject}`);
      }
      const roof = new Set(Array.from({ length: 8 }, () => mix.draw("mixed", false).subject));
      check(roof.size === 4, () => `MIX ${g} roof should rotate through 4 subjects, got ${[...roof]}`);
      // Same topics offered with the real kit banks as with the test's loader.
      check(mod.focusCatalog.available(g).join() === offeredAt.get(g)!.join(), () => `real catalog at ${g}: ${mod.focusCatalog.available(g)} vs ${offeredAt.get(g)}`);
    }
    // FOCUS through TopicDecks: every floor, boss or scroll, draws the topic (dealt: answer still right).
    const runs: [Grade, Subject, TopicChoice][] = [["7", "math", "ratios"], ["4", "social", "civics"], ["1", "ela", "phonics"], ["10", "science", "life"], ["5", "science", "all"], ["8", "math", "all"], ["3", "social", "all"]];
    for (const [g, subject, topic] of runs) {
      const decks = new mod.TopicDecks(g, "dojo-tower-test", { subject, topic });
      for (const floor of FLOOR_INFO) {
        for (const quick of [false, true]) {
          const q = decks.draw(floor.topic, quick);
          if (topic === "all") check(q.subject === subject, () => `ALL ${subject} ${g} floor ${floor.n} drew ${q.subject}`);
          else check(classifyTopic(q) === topic, () => `FOCUS ${g}/${topic} floor ${floor.n} drew ${q.standard}`);
          check(q.answer >= 0 && q.answer < 4 && new Set(q.choices).size === 4, () => `FOCUS ${g}/${topic}: bad dealt question`);
        }
      }
    }
    // A topic the grade can't offer plays ALL of its subject rather than off-topic questions.
    const bad = new mod.TopicDecks("2", "dojo-tower-test", { subject: "math", topic: "ratios" });
    check(bad.draw("ela", false).subject === "math", () => "unavailable topic should play ALL MATH");
  } finally {
    await server.close();
  }
}

console.log(`${checks} checks, ${failures} failures`);
console.log(
  `Banks: civics ${BANDS.map((b) => `${b} ${CIVICS[b].length} (${CIVICS[b].filter((q) => q.quick).length} quick)`).join(", ")}; ` +
    `forces ${BANDS.map((b) => `${b} ${FORCES[b].length}`).join(", ")}`,
);
console.log(`Focus: ${focusDraws} questions drawn. Topics by grade:`);
for (const g of GRADES) console.log(`  ${g.padStart(2)}: ${offeredAt.get(g)!.join(", ")}`);
if (failures) {
  console.error(`${failures} check(s) failed`);
  process.exit(1);
}
console.log("All Dojo Tower checks passed.");
