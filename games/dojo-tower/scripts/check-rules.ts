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

console.log(`${checks} checks, ${failures} failures`);
console.log(
  `Banks: civics ${BANDS.map((b) => `${b} ${CIVICS[b].length} (${CIVICS[b].filter((q) => q.quick).length} quick)`).join(", ")}; ` +
    `forces ${BANDS.map((b) => `${b} ${FORCES[b].length}`).join(", ")}`,
);
if (failures) {
  console.error(`${failures} check(s) failed`);
  process.exit(1);
}
console.log("All Dojo Tower checks passed.");
