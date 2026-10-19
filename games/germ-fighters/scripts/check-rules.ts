/*
 * Robo Masters checks:   npm test   (npx tsx scripts/check-rules.ts)
 * 1. The roster: 8 distinct Robo Masters, each with a name, subject, topics, a power, a weakness, a boss
 *    pattern, a stage and kid-friendly lines; all eight powers and weaknesses used once; the final boss.
 * 2. This game's extra questions: well formed, NC-coded for their grade, on their robot's topic and flavour.
 * 3. Every robot's questions for every grade K-12, in MIXED, in each single subject and in sample topics:
 *    4 unique choices, a valid answer index (also after dealing), an explanation, an NC standard code, and
 *    the robot's subject/topic; MIXED uses each robot's own subject; one subject retunes all eight.
 * 4. Boss rules: right answers deplete HP (double with the weak-spot power), wrong answers never change HP,
 *    energy or lives; a fight answered mostly wrong is still won.
 * 5. Stages: checkpoints, a power spot and an arena in every stage; K-2 is gentler; a headless bot clears every
 *    stage and the fortress in every grade band, drawing real questions for every reboot panel.
 * 6. Powers: each one works in the sim, the power spot opens only to its power, and earned powers persist in
 *    the password-free save (localStorage keys start with arcade.robo-masters.).
 * 8. Longer stages, Quiz Bots and power-ups: every stage is about twice its old length with a checkpoint per
 *    section and a rest stop; exactly 3 Quiz Bots, each in front of a barrier before the boss door, in the second
 *    half; Quiz Bot rewards (energy, power-up weighting, nothing lost to wrong answers); each power-up's effect and
 *    duration (Phase Cloak ignores mini-bots and zaps but not pits or spikes; Spring Boots reach the sky ledges;
 *    timers refresh instead of stacking); the bot answers every Quiz Bot in every band.
 * 7. Subject/topic picker: arcade topic ids, ?topic= / ?subject= parsing, saved choice, grade fallback; and
 *    (through Vite's SSR loader) the real kit wiring offers the same topics.
 */
import { GRADES } from "../src/kit/grades";
import { STAGE_SONGS } from "../src/music";
import type { Grade, Question, Subject } from "../src/kit/types";
import { BANDS, QUICK_CHOICE, QUICK_PROMPT, bandOf, type Band } from "../src/robo/band";
import { playStage } from "../src/robo/bot";
import {
  BOOSTS, BOOST_IDS, QUIZ_BOTS_PER_STAGE, SPRING_JUMP_V, TURBO, boostChance, boostFromRoll, quizBotReward,
} from "../src/robo/boosts";
import { ALL_EXTRAS, EXTRAS } from "../src/robo/extras";
import {
  FOCUS_TOPICS, FocusCatalog, MIXED, SUBJECT_CHOICES, SUBJECT_KEY, TOPIC_KEY, classifyTopic, focusFromUrl, focusTopic,
  loadFocus, parseStoredFocus, refocusSavedForGrade, saveFocus, topicsOf, validateFocus, type FocusChoice, type FocusTopicId,
} from "../src/robo/focus";
import { ARENA_W, buildLevel, gatePowerFor, tuningFor } from "../src/robo/levels";
import { RoboQuestions, dealQuestion, matchesSource, resolveRobot, writtenPoolFor, FLAVOR_MIN } from "../src/robo/questions";
import { FINAL_BOSS, HERO, POWERS, POWER_IDS, ROBOTS, ROBOT_IDS, type PowerId, type RobotId, type StageId } from "../src/robo/robots";
import {
  EMPTY_SAVE, SAVE_KEY, applyAnswer, bossHp, fortressOpen, loadSave, markBeaten, markFortress, newFight, panelHits, panelTimeout,
  parseSave, powersOf, writeSave,
} from "../src/robo/rules";
import { CELL_ENERGY, JUMP_V, MAX_ENERGY, NO_INPUT, PH, POWER_MAX, PW, RUN, Sim, bumpDamage, startLives, type Input } from "../src/robo/sim";

let failures = 0;
let checks = 0;
function check(cond: boolean, msg: () => string) {
  checks++;
  if (!cond) {
    failures++;
    if (failures <= 80) console.error("FAIL:", msg());
  }
}
const t0 = Date.now();

// A small in-memory localStorage for Node.
const store = new Map<string, string>();
(globalThis as { localStorage?: unknown }).localStorage = {
  getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
  setItem: (k: string, v: string) => void store.set(k, String(v)),
  removeItem: (k: string) => void store.delete(k),
  clear: () => store.clear(),
};

/* ------------------------------------------------------------ 1. roster */

check(ROBOTS.length === 8, () => `want 8 Robo Masters, got ${ROBOTS.length}`);
const uniq = <T>(xs: T[]) => new Set(xs).size === xs.length;
check(uniq(ROBOTS.map((r) => r.id)), () => "robot ids repeat");
check(uniq(ROBOTS.map((r) => r.name)), () => "robot names repeat");
check(uniq(ROBOTS.map((r) => r.title)), () => "robot titles repeat");
check(uniq(ROBOTS.map((r) => r.stage.name)), () => "stage names repeat");
check(uniq(ROBOTS.map((r) => r.stage.deco)), () => "stage scenery repeats");
check(uniq(ROBOTS.map((r) => r.pattern)), () => "boss patterns repeat");
check(uniq(ROBOTS.map((r) => r.look.body + r.look.trim)), () => "robot colours repeat");
check(uniq(ROBOTS.map((r) => r.power)) && POWER_IDS.every((p) => ROBOTS.some((r) => r.power === p)), () => "every power belongs to exactly one robot");
check(uniq(ROBOTS.map((r) => r.weakness)) && ROBOTS.every((r) => r.weakness !== r.power), () => "weaknesses: one per power, never a robot's own power");
const subjectsCovered = new Set(ROBOTS.map((r) => r.subject));
check(subjectsCovered.size === 4, () => `robots should cover math, science, ELA and social studies: ${[...subjectsCovered]}`);
for (const r of ROBOTS) {
  check(r.name.trim().length > 2 && r.title.includes("Robo Master"), () => `${r.id}: name/title`);
  check(r.topics.length > 0 && r.topics.every((t) => focusTopic(t).subject === r.subject || r.topics[0] !== t), () => `${r.id}: first topic must be in its subject`);
  check(focusTopic(r.topics[0]).subject === r.subject, () => `${r.id}: first topic ${r.topics[0]} not in ${r.subject}`);
  for (const s of ["math", "science", "ela", "social"] as Subject[]) {
    check(r.retune[s].length > 0 && r.retune[s].every((t) => focusTopic(t).subject === s), () => `${r.id}: retune.${s} has topics of another subject`);
  }
  check(r.lines.intro.length > 10 && r.lines.defeat.length > 10, () => `${r.id}: intro/defeat lines`);
  check(r.lines.block.length >= 2 && r.lines.hit.length >= 2, () => `${r.id}: at least 2 block and 2 hit lines`);
  const all = [r.lines.intro, r.lines.defeat, ...r.lines.block, ...r.lines.hit].join(" ");
  check(!/\b(kill|die|dead|blood|destroy|hurt you|smash)\b/i.test(all), () => `${r.id}: lines should be kid-friendly`);
  check(/reboot/i.test(r.lines.defeat), () => `${r.id}: the defeat line should mention the reboot`);
  check(POWERS[r.power].name.length > 3 && POWERS[r.power].cost > 0 && POWERS[r.power].cost <= POWER_MAX, () => `${r.id}: power data`);
  check(!!STAGE_SONGS[r.id] && STAGE_SONGS[r.id].title === r.stage.name, () => `${r.id}: needs a stage theme in src/music.ts named after its stage`);
}
check(/reboot/i.test(FINAL_BOSS.lines.defeat) && FINAL_BOSS.lines.block.length >= 2, () => "final boss lines");
check(HERO.name === "RIVET", () => "hero name");
// Named powers from the brief
for (const n of ["Fraction Splitter", "Magma Hop", "Comma Shield", "Compass Dash"]) check(Object.values(POWERS).some((p) => p.name === n), () => `power ${n} missing`);

/* ------------------------------------------------------------ 2. extra questions */

const ids = new Set<string>();
function checkShape(q: Question, where: string) {
  check(Array.isArray(q.choices) && q.choices.length === 4, () => `${where}: needs exactly 4 choices`);
  check(q.choices.every((c) => typeof c === "string" && c.trim().length > 0), () => `${where}: empty choice`);
  check(new Set(q.choices.map((c) => c.trim())).size === 4, () => `${where}: choices not unique: ${q.choices.join(" | ")}`);
  check(Number.isInteger(q.answer) && q.answer >= 0 && q.answer <= 3, () => `${where}: bad answer index ${q.answer}`);
  check(q.explanation.trim().length >= 10, () => `${where}: explanation too short`);
  check(q.prompt.trim().length > 3, () => `${where}: prompt`);
  check(q.skill.trim().length > 2, () => `${where}: skill`);
  check(/^[A-Z0-9][A-Za-z0-9&]*(\.[A-Za-z0-9&-]+)+$/.test(q.standard), () => `${where}: standard code "${q.standard}" has an unexpected shape`);
}
for (const q of ALL_EXTRAS) {
  const where = `${q.id} "${q.prompt.slice(0, 40)}"`;
  check(!ids.has(q.id), () => `duplicate id ${q.id}`);
  ids.add(q.id);
  checkShape(q, where);
  check(q.answer === 0, () => `${where}: author the correct choice first`);
  check(/[.!?)"]$/.test(q.explanation.trim()), () => `${where}: explanation should end with punctuation`);
  const n = q.grade === "K" ? "K" : Number(q.grade);
  if (n === "K" || n <= 8) check(q.standard.includes(`${n}.`), () => `${where}: standard ${q.standard} does not match grade ${q.grade}`);
  const fits = q.prompt.length <= QUICK_PROMPT && q.choices.every((c) => c.length <= QUICK_CHOICE);
  check(!!q.quick === fits, () => `${where}: quick flag`);
}
for (const [rid, byBand] of Object.entries(EXTRAS)) {
  const r = ROBOTS.find((x) => x.id === rid)!;
  for (const band of BANDS) {
    const qs = byBand![band];
    check(qs.length >= 4, () => `${rid} ${band}: only ${qs.length} extra questions`);
    for (const q of qs) {
      check(bandOf(q.grade) === band, () => `${q.id}: grade ${q.grade} not in ${band}`);
      check(q.subject === r.subject && classifyTopic(q) === r.topics[0], () => `${q.id}: classified ${classifyTopic(q)}, robot ${rid} asks ${r.topics[0]}`);
      check(!r.flavor || r.flavor.test(`${q.skill} ${q.prompt}`), () => `${q.id}: does not match ${rid}'s flavour`);
    }
  }
}

/* ------------------------------------------------------------ 3. every robot, every grade */

type Written = Exclude<Subject, "math">;
const BANK: Record<Written, Partial<Record<Grade, Question[]>>> = { science: {}, ela: {}, social: {} };
for (const s of Object.keys(BANK) as Written[]) {
  for (const g of GRADES) BANK[s][g] = ((await import(`../src/kit/banks/${s}/g${g}.ts`)) as { default: Question[] }).default;
}
const catalog = new FocusCatalog((s, g) => BANK[s][g] ?? []);

const MODES: FocusChoice[] = [MIXED, { subject: "math", topic: "all" }, { subject: "science", topic: "all" }, { subject: "ela", topic: "all" }, { subject: "social", topic: "all" }];
let draws = 0;
const flavorReport: string[] = [];
for (const g of GRADES) {
  const avail = catalog.available(g);
  const sampleTopics: FocusChoice[] = (["fractions", "numbers", "earth", "grammar", "geography", "history"] as FocusTopicId[])
    .filter((t) => avail.includes(t))
    .map((t) => ({ subject: focusTopic(t).subject, topic: t }));
  for (const mode of [...MODES, ...sampleTopics]) {
    const qs = new RoboQuestions(g, mode, catalog, { adaptive: false });
    const topicsUsed = new Set<string>();
    for (const r of ROBOTS) {
      const res = resolveRobot(r, g, mode, catalog);
      topicsUsed.add(`${res.subject}/${res.topic}`);
      if (mode.subject === "mixed") check(res.subject === r.subject, () => `MIXED ${g} ${r.id}: asks ${res.subject}, own subject ${r.subject}`);
      else check(res.subject === mode.subject, () => `${mode.subject} ${g} ${r.id}: asks ${res.subject}`);
      if (mode.subject !== "mixed" && mode.topic !== "all") check(res.topic === mode.topic, () => `topic ${mode.topic} ${g} ${r.id}: asks ${res.topic}`);
      if (res.subject !== "math") {
        const pool = writtenPoolFor(r, g, res, catalog);
        check(pool.length >= 6, () => `${g} ${r.id} ${res.subject}/${res.topic}: only ${pool.length} written questions`);
      }
      const prompts = new Set<string>();
      const N = 10;
      for (let i = 0; i < N; i++) {
        const { q, from } = qs.draw(r.id);
        draws++;
        const where = `${g} ${JSON.stringify(mode)} ${r.id} ${q.id} "${q.prompt.slice(0, 40)}"`;
        check(from === r.id, () => `${where}: drew from ${from}`);
        checkShape(q, where);
        check(!q.passage, () => `${where}: boss questions never have passages`);
        check(matchesSource(q, res), () => `${where}: ${q.subject} ${q.standard} (${classifyTopic(q)}) is not ${res.subject}/${res.topic}`);
        const d = dealQuestion(q);
        check(d.choices[d.answer] === q.choices[q.answer] && new Set(d.choices).size === 4, () => `${where}: dealing lost the answer`);
        prompts.add(q.prompt);
      }
      check(prompts.size >= Math.min(5, N), () => `${g} ${JSON.stringify(mode)} ${r.id}: only ${prompts.size} different questions in ${N}`);
      if (mode.subject === "mixed" && r.flavor && res.subject !== "math") {
        const pool = writtenPoolFor(r, g, res, catalog);
        const fl = pool.filter((q) => r.flavor!.test(`${q.skill} ${q.prompt}`)).length;
        if (fl < FLAVOR_MIN) flavorReport.push(`${g}:${r.id} ${fl}/${pool.length}`);
      }
    }
    // Fortress: Lord Static takes turns through all eight robots.
    const froms = new Set<RobotId>();
    for (let i = 0; i < 16; i++) {
      const { q, from } = qs.draw("fortress");
      froms.add(from);
      check(matchesSource(q, resolveRobot(ROBOTS.find((x) => x.id === from)!, g, mode, catalog)), () => `${g} fortress via ${from}: off-source ${q.standard}`);
    }
    check(froms.size === 8, () => `${g} fortress should rotate through all 8 robots, got ${froms.size}`);
    if (mode.subject === "mixed") {
      const subj = new Set(ROBOTS.map((r) => resolveRobot(r, g, mode, catalog).subject));
      check(subj.size === 4, () => `MIXED ${g}: all four subjects should appear`);
    } else if (mode.topic === "all") {
      check(topicsUsed.size >= Math.min(2, topicsOf(mode.subject).filter((t) => avail.includes(t.id)).length), () => `${mode.subject} ${g}: retuned robots should spread over the subject's topics: ${[...topicsUsed]}`);
    }
  }
}

/* ------------------------------------------------------------ 4. boss rules */

for (const band of BANDS) {
  const f = newFight(band);
  check(f.hp === bossHp(band) && f.hp >= 3 && f.hp <= 5, () => `${band}: boss HP ${f.hp}`);
  for (let i = 0; i < 10; i++) {
    const r = applyAnswer(f, false);
    check(r.damage === 0 && !r.defeated && f.hp === f.maxHp, () => `${band}: a wrong answer changed HP`);
  }
  let hits = 0;
  while (f.hp > 0 && hits < 20) {
    const r = applyAnswer(f, true);
    hits++;
    check(r.damage === 1, () => `${band}: a right answer should deal 1`);
  }
  check(hits === bossHp(band) && f.hp === 0, () => `${band}: right answers should deplete HP in ${bossHp(band)} hits`);
  const w = newFight(band);
  w.weakReady = true;
  const r1 = applyAnswer(w, false);
  check(r1.damage === 0 && w.weakReady, () => `${band}: a wrong answer keeps the weak-spot bonus waiting`);
  const r2 = applyAnswer(w, true);
  check(r2.damage === 2 && r2.weakness && !w.weakReady && w.hp === w.maxHp - 2, () => `${band}: weak spot should double the next right answer`);
  check(bossHp(band, true) > bossHp(band), () => `${band}: fortress boss has more HP`);
}
check(bossHp("k2") < bossHp("g68") && panelHits("k2") < panelHits("g68") && panelTimeout("k2") < panelTimeout("g68"), () => "K-2 bosses gentler");

/* ------------------------------------------------------------ 5. stages and the bot */

const STAGES: StageId[] = [...ROBOT_IDS, "fortress"];
for (const band of BANDS) {
  for (const id of STAGES) {
    const L = buildLevel(id, band);
    check(L.checkpoints.length >= 3, () => `${id} ${band}: ${L.checkpoints.length} checkpoints`);
    check(!!L.gate && L.gate.power === gatePowerFor(id), () => `${id} ${band}: power spot`);
    check(L.arenaX > 1400 && L.width === L.arenaX + ARENA_W, () => `${id} ${band}: arena at ${L.arenaX}`);
    check(L.movers.length >= 1 && L.pulses.length >= 2, () => `${id} ${band}: needs moving platforms and timed hazards`);
    check(L.enemies.length >= (band === "k2" ? 3 : 7), () => `${id} ${band}: ${L.enemies.length} mini-bots`);
  }
}
check(tuningFor("k2").gapScale < tuningFor("g68").gapScale && tuningFor("k2").enemyEvery > 1, () => "K-2 levels are gentler");
check(startLives("k2") > startLives("g68") && bumpDamage("k2") < bumpDamage("g68"), () => "K-2 gets more lives and softer bumps");
check(buildLevel("splitz", "k2").enemies.length < buildLevel("splitz", "g68").enemies.length, () => "K-2 has fewer mini-bots");

// K-2 pits cost energy, not a life; older grades lose a life.
{
  for (const band of ["k2", "g68"] as Band[]) {
    const sim = new Sim(buildLevel("splitz", band), band);
    const L = sim.level;
    // Find the first pit (a gap between grounds) and drop the hero in.
    const grounds = L.solids.filter((s) => s.kind === "ground").sort((a, b) => a.x - b.x);
    const gap = grounds.find((s, i) => i > 0 && s.x > grounds[i - 1].x + grounds[i - 1].w)!;
    const prev = grounds[grounds.indexOf(gap) - 1];
    for (let i = 0; i < 30; i++) sim.step({ ...NO_INPUT, right: true });
    sim.s.p.x = prev.x + prev.w + 4;
    sim.s.p.y = 170;
    sim.s.p.vy = 2;
    for (let i = 0; i < 80 && sim.s.mode === "play"; i++) sim.step(NO_INPUT);
    if (band === "k2") check(sim.s.lives === startLives(band) && sim.s.energy === MAX_ENERGY - 4 && sim.s.mode === "play", () => `K-2 pit: lives ${sim.s.lives} energy ${sim.s.energy} mode ${sim.s.mode}`);
    else check(sim.s.lives === startLives(band) - 1, () => `${band} pit should cost a life (lives ${sim.s.lives})`);
  }
}

// The bot plays every stage and the fortress in every band, answering some questions wrong on purpose,
// with a real question drawn for every reboot panel.
const botGrades: Record<Band, Grade> = { k2: "1", g35: "4", g68: "7", hs: "10" };
let botFrames = 0;
let botQb = 0;
for (const band of BANDS) {
  const g = botGrades[band];
  const qs = new RoboQuestions(g, MIXED, catalog, { adaptive: false });
  for (const id of STAGES) {
    const sim = new Sim(buildLevel(id, band), band, []);
    const res = playStage(sim, {
      answerRight: (n) => n % 3 !== 1,
      onQuestion: () => {
        const { q } = qs.draw(id);
        checkShape(q, `bot ${band} ${id} ${q.id}`);
      },
    });
    botFrames += res.frames;
    check(res.cleared, () => `bot could not clear ${id} in ${band}: ${res.reason}`);
    check(res.wrong >= 1, () => `${id} ${band}: the bot should have tried a wrong answer`);
    for (const a of res.answers) {
      if (!a.correct) check(a.hpAfter === a.hpBefore && a.livesAfter === a.livesBefore && a.energyAfter === a.energyBefore, () => `${id} ${band}: a wrong answer changed HP/lives/energy`);
      else check(a.hpAfter < a.hpBefore, () => `${id} ${band}: a right answer did not deplete HP`);
    }
    check(res.questions - res.wrong === bossHp(band, id === "fortress"), () => `${id} ${band}: ${res.questions - res.wrong} right answers for HP ${bossHp(band, id === "fortress")}`);
    check(res.quizBots.length === QUIZ_BOTS_PER_STAGE && res.quizBotsBeforeBoss === QUIZ_BOTS_PER_STAGE, () => `${id} ${band}: the bot answered ${res.quizBots.length} Quiz Bots (${res.quizBotsBeforeBoss} before the boss)`);
    check(res.quizBots.some((q) => !q.correct) && res.quizBots.some((q) => q.correct), () => `${id} ${band}: the bot should answer Quiz Bots both ways`);
    for (const q of res.quizBots) {
      check(q.livesAfter === q.livesBefore && q.energyAfter >= q.energyBefore && q.powerAfter >= q.powerBefore, () => `${id} ${band}: a Quiz Bot answer took something (${JSON.stringify(q)})`);
      check(q.energyAfter === Math.min(MAX_ENERGY, q.energyBefore + q.reward.energy), () => `${id} ${band}: Quiz Bot energy reward not applied`);
      check(q.correct ? q.reward.energy >= 10 : q.reward.energy > 0 && q.reward.energy < 10, () => `${id} ${band}: Quiz Bot reward size ${q.reward.energy} (correct ${q.correct})`);
    }
    // The first right Quiz Bot answer in a stage always gives a power-up.
    const firstRight = res.quizBots.find((q) => q.correct)!;
    check(!!firstRight.reward.boost || res.quizBots.indexOf(firstRight) > 0 && res.quizBots.slice(0, res.quizBots.indexOf(firstRight)).some((q) => !!q.reward.boost), () => `${id} ${band}: first right Quiz Bot answer should give a power-up`);
    botQb += res.quizBots.length;
  }
}

// Mostly wrong answers: still won, and no life lost to answers.
{
  const sim = new Sim(buildLevel("syntaxor", "g68"), "g68", []);
  const res = playStage(sim, { skipToBoss: true, answerRight: (n) => n % 4 === 3 });
  check(res.cleared && res.wrong >= 3 * bossHp("g68"), () => `mostly-wrong fight should still be won (${res.reason})`);
}

/* ------------------------------------------------------------ 6. powers */

function freshSim(id: StageId, powers: PowerId[], band: Band = "g68"): Sim {
  const sim = new Sim(buildLevel(id, band), band, powers);
  for (let i = 0; i < 20; i++) sim.step(NO_INPUT);
  return sim;
}
const press = (sim: Sim, inp: Partial<Input>) => sim.step({ ...NO_INPUT, ...inp });
{
  const none = freshSim("splitz", []);
  check(none.selectedPower === null && !none.usePower(), () => "no powers: X does nothing");
  const all = freshSim("splitz", [...POWER_IDS]);
  for (let i = 0; i < POWER_IDS.length; i++) {
    check(all.selectedPower === POWER_IDS[i], () => `cycle order at ${i}`);
    press(all, { cycle: true });
  }
  check(all.selectedPower === POWER_IDS[0], () => "cycling wraps around");

  const sp = freshSim("splitz", ["splitter"]);
  press(sp, { power: true });
  check(sp.s.shots.filter((x) => x.from === "hero").length === 3 && sp.s.power === POWER_MAX - POWERS.splitter.cost, () => "Fraction Splitter fires three beams");

  const mg = freshSim("igneous", ["magma"]);
  const plain = freshSim("igneous", []);
  press(mg, { power: true });
  press(plain, { jump: true });
  let peakM = 999;
  let peakP = 999;
  for (let i = 0; i < 40; i++) {
    press(mg, {});
    press(plain, { jump: true });
    peakM = Math.min(peakM, mg.s.p.y);
    peakP = Math.min(peakP, plain.s.p.y);
  }
  check(peakM < peakP - 30, () => `Magma Hop should jump much higher (${peakM} vs ${peakP})`);

  const cm = freshSim("syntaxor", ["comma"]);
  press(cm, { power: true });
  const e0 = cm.s.energy;
  cm.s.shots.push({ x: cm.s.p.x, y: cm.s.p.y + 4, w: 8, h: 8, vx: 0, vy: 0, grav: 0, life: 60, from: "foe", kind: "zap", delay: 0, floor: "none" });
  press(cm, {});
  check(cm.s.energy === e0 && cm.s.p.shieldT > 0, () => "Comma Shield blocks zaps");

  const cp = freshSim("meridian", ["compass"]);
  const walk = freshSim("meridian", []);
  const x0 = cp.s.p.x;
  press(cp, { power: true });
  for (let i = 0; i < 20; i++) {
    press(cp, {});
    press(walk, { right: true });
  }
  check(cp.s.p.x - x0 > walk.s.p.x - x0 + 30, () => `Compass Dash should go farther than walking (${cp.s.p.x - x0} vs ${walk.s.p.x - x0})`);

  const cl = freshSim("cumulo", ["cloud"]);
  check(!cl.usePower(), () => "Cloud Step needs the air");
  press(cl, { jump: true });
  for (let i = 0; i < 10; i++) press(cl, { jump: true });
  const vyBefore = cl.s.p.vy;
  press(cl, { jump: true, power: true });
  check(cl.s.p.airJumped && cl.s.p.vy < vyBefore - 2, () => "Cloud Step jumps again in mid-air");

  const po = freshSim("polarix", ["polarity"]);
  const onScreen = () => po.s.enemies.filter((e) => !e.dead && e.x + e.w > po.s.camX && e.x < po.s.camX + 320).length;
  po.s.p.x = 380;
  for (let i = 0; i < 10; i++) press(po, {});
  const before = onScreen();
  press(po, { power: true });
  check(before > 0 && onScreen() === 0, () => `Polarity Pulse should short-circuit the mini-bots on screen (${before} -> ${onScreen()})`);

  const lf = freshSim("chlorophil", ["leaf"]);
  const fall = freshSim("chlorophil", []);
  for (const s of [lf, fall]) {
    s.s.p.y -= 60;
    s.s.p.onGround = false;
  }
  press(lf, { power: true });
  for (let i = 0; i < 30; i++) {
    press(lf, {});
    press(fall, {});
  }
  check(lf.s.p.y < fall.s.p.y - 20, () => `Leaf Glide should fall slower (${lf.s.p.y} vs ${fall.s.p.y})`);

  const tb = freshSim("clio", ["time"]);
  press(tb, { power: true });
  const wt0 = tb.s.wt;
  for (let i = 0; i < 10; i++) press(tb, {});
  check(tb.s.slowT > 0 && tb.s.wt - wt0 < 6, () => `Time Brake slows the world clock (${tb.s.wt - wt0} in 10 frames)`);
}

// Power spots open only to their power, and the capsule is a 1-up.
for (const id of STAGES) {
  const want = gatePowerFor(id);
  const L = buildLevel(id, "g68");
  const other = POWER_IDS.find((p) => p !== want)!;
  const wrong = new Sim(L, "g68", [other]);
  const right = new Sim(L, "g68", [want]);
  for (const s of [wrong, right]) {
    s.s.p.x = L.gate!.x - 30;
    s.s.p.y = L.gate!.y - PH;
    s.s.p.onGround = true;
    s.s.p.vy = 0;
    s.s.p.coyote = 5;
    if (s.selectedPower === "cloud" || s.selectedPower === "leaf") {
      // These two work in mid-air.
      s.s.p.onGround = false;
      s.s.p.coyote = 0;
      s.s.p.y -= 20;
    }
    s.usePower();
  }
  check(!wrong.s.gateOpen, () => `${id}: the power spot opened to ${other}`);
  check(right.s.gateOpen, () => `${id}: the power spot did not open to ${want}`);
  const lives = right.s.lives;
  right.s.p.x = L.gate!.x + 4;
  right.s.p.y = L.gate!.y - PH;
  right.s.p.dashT = 0;
  right.s.p.vx = 0;
  for (let i = 0; i < 3; i++) right.step(NO_INPUT);
  check(right.s.capsule && right.s.lives === lives + 1, () => `${id}: capsule should give a 1-up`);
}

// The weak-spot power during the fight makes the next right answer a double reboot.
for (const r of ROBOTS) {
  const sim = new Sim(buildLevel(r.id, "g35"), "g35", [r.weakness]);
  sim.warpToBoss();
  for (let i = 0; i < 101; i++) sim.step(NO_INPUT);
  check(sim.s.mode === "boss", () => `${r.id}: boss fight should start (mode ${sim.s.mode})`);
  sim.s.p.onGround = true;
  sim.s.p.airJumped = false;
  if (r.weakness === "cloud" || r.weakness === "leaf") {
    sim.s.p.onGround = false;
    sim.s.p.y -= 30;
  }
  sim.s.power = POWER_MAX;
  sim.usePower();
  check(!!sim.s.fight?.weakReady, () => `${r.id}: using ${r.weakness} should ready the weak spot`);
  sim.forceQuestion();
  const hp = sim.s.fight!.hp;
  const res = sim.answer(true);
  check(res.damage === 2 && sim.s.fight!.hp === hp - 2, () => `${r.id}: weak-spot answer should deal 2`);
}

// Save: password-free, keys start with arcade.robo-masters.
{
  store.clear();
  check(SAVE_KEY.startsWith("arcade.robo-masters.") && SUBJECT_KEY.startsWith("arcade.robo-masters.") && TOPIC_KEY.startsWith("arcade.robo-masters."), () => "storage keys");
  let s = loadSave();
  check(s.beaten.length === 0 && !s.fortress && !fortressOpen(s), () => "empty save");
  s = markBeaten(s, "igneous");
  s = markBeaten(s, "splitz");
  s = markBeaten(s, "igneous");
  check(s.beaten.join() === "igneous,splitz", () => `markBeaten is idempotent and ordered: ${s.beaten}`);
  check(powersOf(s).join() === "magma,splitter", () => `powers follow the save: ${powersOf(s)}`);
  writeSave(s);
  const back = loadSave();
  check(JSON.stringify(back) === JSON.stringify(s), () => "save round trip");
  check([...store.keys()].every((k) => k.startsWith("arcade.robo-masters.")), () => `keys: ${[...store.keys()]}`);
  // Powers persist into a new stage.
  const sim = new Sim(buildLevel("meridian", "g35"), "g35", powersOf(back));
  check(sim.s.powers.join() === "magma,splitter" && sim.selectedPower === "magma", () => "earned powers carry into other stages");
  let all = s;
  for (const id of ROBOT_IDS) all = markBeaten(all, id);
  check(fortressOpen(all) && !all.fortress, () => "the citadel opens after all eight");
  check(markFortress(all).fortress && !markFortress(s).fortress, () => "the citadel counts only after all eight");
  check(parseSave("not json").beaten.length === 0 && parseSave(JSON.stringify({ beaten: ["splitz", "nope", "splitz"], fortress: true })).beaten.join() === "splitz", () => "corrupt saves are cleaned");
  check(!parseSave(JSON.stringify({ beaten: ["splitz"], fortress: true })).fortress, () => "fortress flag needs all eight");
  check(EMPTY_SAVE.beaten.length === 0, () => "EMPTY_SAVE untouched");
}

/* ------------------------------------------------------------ 8. longer stages, Quiz Bots, power-ups */

// Boss-door x of every stage before this update (grades 6-8 tuning), from the previous layouts.
const OLD_ARENA: Record<StageId, number> = { splitz: 1978, igneous: 2076, syntaxor: 1958, meridian: 1746, cumulo: 1792, polarix: 1964, chlorophil: 1928, clio: 1892, fortress: 2824 };
const lengthReport: string[] = [];
for (const band of BANDS) {
  for (const id of STAGES) {
    const L = buildLevel(id, band);
    const ratio = L.arenaX / OLD_ARENA[id];
    if (band === "g68") lengthReport.push(`${id} ${OLD_ARENA[id]}->${L.arenaX} (x${ratio.toFixed(2)})`);
    if (band !== "k2") check(ratio >= (id === "fortress" ? 1.6 : 1.85) && ratio <= 2.6, () => `${id} ${band}: stage is x${ratio.toFixed(2)} its old length`);
    else check(L.arenaX >= (id === "fortress" ? 4500 : 3500), () => `${id} k2: stage only ${L.arenaX} long`);
    // Checkpoints: one per section (3 before the rest stop, the rest stop, one past each Quiz Bot barrier).
    check(L.checkpoints.length >= 7, () => `${id} ${band}: ${L.checkpoints.length} checkpoints`);
    const xs = [L.start.x, ...L.checkpoints.map((c) => c.x), L.arenaX];
    const longest = Math.max(...xs.slice(1).map((x, i) => x - xs[i]));
    check(longest <= 1100, () => `${id} ${band}: ${longest}px between checkpoints`);
    check(L.restX > L.arenaX * 0.3 && L.restX < L.arenaX * 0.7 && L.checkpoints.some((c) => c.x === L.restX), () => `${id} ${band}: rest stop at ${L.restX}`);
    check(L.items.filter((it) => it.kind === "cell").length >= 3, () => `${id} ${band}: energy cells`);
    check(L.items.some((it) => it.kind === "boost"), () => `${id} ${band}: a hidden power-up capsule`);
    check(L.skyLedges.length >= 1, () => `${id} ${band}: a sky ledge`);
    // Exactly 3 Quiz Bots, all in the second half, each in front of its own barrier, all before the boss door.
    check(L.quizBots.length === QUIZ_BOTS_PER_STAGE, () => `${id} ${band}: ${L.quizBots.length} Quiz Bots`);
    const barriers = L.solids.filter((sd) => sd.kind === "barrier");
    check(barriers.length === QUIZ_BOTS_PER_STAGE, () => `${id} ${band}: ${barriers.length} barriers`);
    L.quizBots.forEach((q, i) => {
      const b = barriers.find((sd) => sd.qb === i);
      check(!!b && b.x === q.barrierX && q.x < b.x && b.x + b.w < L.arenaX - 16, () => `${id} ${band}: Quiz Bot ${i} barrier`);
      check(!!b && b.y < -200 && b.y + b.h >= L.arenaY - 200, () => `${id} ${band}: barrier ${i} should be too tall to jump`);
      check(q.x > L.restX && q.x > L.arenaX / 2, () => `${id} ${band}: Quiz Bot ${i} at ${q.x} should be in the second half (arena ${L.arenaX})`);
      if (i > 0) check(q.x - L.quizBots[i - 1].x > 300, () => `${id} ${band}: Quiz Bots ${i - 1} and ${i} too close`);
    });
  }
}

// Rewards: pure rules.
for (const band of BANDS) {
  check(boostChance(true, band) >= 0.5 && boostChance(false, band) <= 0.2 && boostChance(true, band) > boostChance(false, band) * 3, () => `${band}: power-ups should be weighted to right answers`);
  const right = quizBotReward(true, band, 0.99, 0.2, true);
  const wrong = quizBotReward(false, band, 0.99, 0.2, true);
  check(right.energy >= 10 && right.power > 0 && right.boost === null, () => `${band}: right reward ${JSON.stringify(right)}`);
  check(wrong.energy > 0 && wrong.energy < right.energy && wrong.power === 0 && wrong.boost === null, () => `${band}: wrong reward ${JSON.stringify(wrong)}`);
  check(quizBotReward(true, band, 0.99, 0.5, false).boost !== null, () => `${band}: first right answer always gives a power-up`);
  check(quizBotReward(false, band, 0.99, 0.5, false).boost === null, () => `${band}: a wrong answer is not guaranteed a power-up`);
  check(quizBotReward(true, band, 0.0, 0.5, true).boost !== null && quizBotReward(false, band, 0.0, 0.5, true).boost !== null, () => `${band}: low rolls give a power-up either way`);
  // Over many rolls, right answers give far more power-ups.
  let r = 0;
  let w = 0;
  for (let i = 0; i < 1000; i++) {
    if (quizBotReward(true, band, (i * 0.618) % 1, (i * 0.37) % 1, true).boost) r++;
    if (quizBotReward(false, band, (i * 0.618) % 1, (i * 0.37) % 1, true).boost) w++;
  }
  check(r > 450 && w < 220 && r > 3 * w, () => `${band}: power-up weighting right ${r} vs wrong ${w} in 1000`);
}
check(new Set(Array.from({ length: 60 }, (_, i) => boostFromRoll(i / 60))).size === BOOST_IDS.length && boostFromRoll(0.9999) === BOOST_IDS[BOOST_IDS.length - 1], () => "every power-up can be rolled");
check(BOOST_IDS.length >= 5 && BOOST_IDS.includes("phase") && BOOST_IDS.includes("spring"), () => "power-up list");
for (const id of BOOST_IDS) {
  const B = BOOSTS[id];
  check(B.frames >= 5 * 60 && B.frames <= 20 * 60 && B.name.length > 3 && B.desc.length > 8, () => `${id}: power-up data`);
  check(!Object.values(POWERS).some((p) => p.name === B.name), () => `${id}: power-up name clashes with a Robo Master power`);
}
check(BOOSTS.phase.frames === 8 * 60 && BOOSTS.spring.frames === 10 * 60, () => "Phase Cloak ~8 s, Spring Boots ~10 s");

/** A sim with the hero standing on flat ground at x (mini-bots cleared unless kept). */
function standAt(id: StageId, x: number, band: Band = "g68", keepFoes = false): Sim {
  const sim = new Sim(buildLevel(id, band), band, []);
  if (!keepFoes) sim.s.enemies = [];
  const g = sim.level.solids.find((sd) => sd.kind === "ground" && sd.x <= x && sd.x + sd.w >= x + PW)!;
  sim.s.p.x = x;
  sim.s.p.y = g.y - PH;
  sim.s.p.vy = 0;
  sim.s.p.inv = 0;
  for (let i = 0; i < 3; i++) sim.step(NO_INPUT);
  return sim;
}

// A Quiz Bot in the sim: beaming it opens a question; the barrier blocks until it is answered; wrong costs nothing.
for (const band of BANDS) {
  for (const right of [true, false]) {
    const L = buildLevel("splitz", band);
    const q = L.quizBots[0];
    const sim = standAt("splitz", q.x - 90, band);
    sim.s.energy = 8;
    sim.s.power = 10;
    // Walking into the barrier: blocked.
    for (let i = 0; i < 120; i++) sim.step({ ...NO_INPUT, right: true });
    check(sim.s.p.x + PW <= q.barrierX + 0.01 && sim.s.mode === "play", () => `${band}: the barrier should block (x ${sim.s.p.x}, barrier ${q.barrierX})`);
    for (let i = 0; i < 40 && sim.s.mode === "play"; i++) sim.step({ ...NO_INPUT, shoot: i % 9 === 0 });
    check(sim.s.mode === "quiz" && sim.s.ask === 0, () => `${band}: beaming a Quiz Bot opens its question (mode ${sim.s.mode}, ask ${sim.s.ask})`);
    const before = { e: sim.s.energy, p: sim.s.power, l: sim.s.lives };
    const res = sim.answer(right);
    check(!!res.reward && res.damage === 0 && sim.s.qbDone[0] && sim.s.qbAnswered === 1 && sim.s.qbRight === (right ? 1 : 0), () => `${band}: Quiz Bot answer bookkeeping`);
    check(sim.s.lives === before.l && sim.s.energy === Math.min(MAX_ENERGY, before.e + res.reward!.energy) && sim.s.power >= before.p, () => `${band} ${right}: Quiz Bot reward applied, nothing lost`);
    if (right) check(!!res.reward!.boost && sim.s.boosts[res.reward!.boost!] === BOOSTS[res.reward!.boost!].frames, () => `${band}: first right answer starts a power-up`);
    sim.resume();
    check(sim.s.mode === "play" && sim.s.ask === "boss", () => `${band}: back to the stage after a Quiz Bot`);
    for (let i = 0; i < 60; i++) sim.step({ ...NO_INPUT, right: true });
    check(sim.s.p.x > q.barrierX + 12, () => `${band}: the barrier should be gone after the answer (x ${sim.s.p.x})`);
    check(!sim.s.fight && !sim.s.locked, () => `${band}: a Quiz Bot never touches the boss fight`);
  }
}
// Quiz Bots only open in play (never during the boss), and a rebooted one cannot be asked twice.
{
  const sim = standAt("igneous", buildLevel("igneous", "g35").quizBots[1].x - 60, "g35");
  for (let i = 0; i < 40 && sim.s.mode === "play"; i++) sim.step({ ...NO_INPUT, shoot: i % 9 === 0 });
  check(sim.s.mode === "quiz" && sim.s.ask === 1, () => "second Quiz Bot opens");
  sim.answer(true);
  sim.resume();
  for (let i = 0; i < 40; i++) sim.step({ ...NO_INPUT, shoot: i % 9 === 0 });
  check(sim.s.mode === "play" && sim.s.qbAnswered === 1, () => "a rebooted Quiz Bot is gone");
}

// Power-ups: effects, durations, no stacking.
{
  const id: StageId = "splitz";
  const flatX = 60; // the first flat of every stage is long
  // Duration: counts down to zero and ends.
  for (const b of BOOST_IDS) {
    const sim = standAt(id, flatX);
    sim.giveBoost(b);
    check(sim.s.boosts[b] === BOOSTS[b].frames, () => `${b}: starts at its full duration`);
    for (let i = 0; i < 100; i++) sim.step(NO_INPUT);
    // Refresh, not stack.
    sim.giveBoost(b);
    check(sim.s.boosts[b] === BOOSTS[b].frames, () => `${b}: picking it again refreshes the timer (no stacking): ${sim.s.boosts[b]}`);
    for (let i = 0; i < BOOSTS[b].frames; i++) sim.step(NO_INPUT);
    check(sim.s.boosts[b] === 0, () => `${b}: ends after ${BOOSTS[b].frames / 60} s`);
  }
  // Two different power-ups run side by side.
  {
    const sim = standAt(id, flatX);
    sim.giveBoost("spring");
    sim.giveBoost("turbo");
    check(sim.s.boosts.spring > 0 && sim.s.boosts.turbo > 0, () => "different power-ups can run together");
  }
  // Phase Cloak: mini-bots and zaps pass through; spikes and pits still count.
  {
    const sim = standAt(id, flatX);
    sim.giveBoost("phase");
    const e0 = sim.s.energy;
    sim.s.enemies = [{ kind: "walker", x: sim.s.p.x, y: sim.s.p.y + 8, w: 14, h: 12, vx: 0, vy: 0, hp: 1, dead: false, t: 0, dir: -1, sx: sim.s.p.x, sy: sim.s.p.y + 8, flash: 0 }];
    for (let i = 0; i < 5; i++) {
      sim.s.shots.push({ x: sim.s.p.x, y: sim.s.p.y + 4, w: 8, h: 8, vx: 0, vy: 0, grav: 0, life: 60, from: "foe", kind: "zap", delay: 0, floor: "none" });
      sim.step(NO_INPUT);
    }
    check(sim.s.energy === e0 && sim.s.hurts === 0, () => `Phase Cloak: mini-bots and zaps should pass through (energy ${e0} -> ${sim.s.energy})`);
    check(sim.s.shots.some((x) => x.from === "foe"), () => "Phase Cloak: zaps pass through rather than popping");
    const plain = standAt(id, flatX);
    plain.s.shots.push({ x: plain.s.p.x, y: plain.s.p.y + 4, w: 8, h: 8, vx: 0, vy: 0, grav: 0, life: 60, from: "foe", kind: "zap", delay: 0, floor: "none" });
    plain.step(NO_INPUT);
    check(plain.s.energy < MAX_ENERGY, () => "without the cloak a zap hurts");
    // Spikes still hurt.
    const sp = buildLevel(id, "g68").spikes[0];
    const spk = standAt(id, flatX);
    spk.giveBoost("phase");
    spk.s.p.x = sp.x + 30;
    spk.s.p.y = sp.y + sp.h - PH;
    spk.step(NO_INPUT);
    check(spk.s.hurts === 1, () => "Phase Cloak does not protect from spikes");
    // Pits still cost a life (g68) / energy (K-2).
    for (const band of ["g68", "k2"] as Band[]) {
      const pit = standAt(id, flatX, band);
      pit.giveBoost("phase");
      pit.s.p.y = 240;
      pit.s.p.vy = 3;
      pit.step(NO_INPUT);
      if (band === "k2") check(pit.s.energy === MAX_ENERGY - 4, () => `Phase Cloak K-2 pit: energy ${pit.s.energy}`);
      else check(pit.s.lives === startLives(band) - 1, () => "Phase Cloak does not save you from pits");
    }
  }
  // Shield Bubble: blocks exactly one bump.
  {
    const sim = standAt(id, flatX);
    sim.giveBoost("bubble");
    const zap = () => sim.s.shots.push({ x: sim.s.p.x, y: sim.s.p.y + 4, w: 8, h: 8, vx: 0, vy: 0, grav: 0, life: 60, from: "foe", kind: "zap", delay: 0, floor: "none" });
    zap();
    sim.step(NO_INPUT);
    check(sim.s.energy === MAX_ENERGY && sim.s.boosts.bubble === 0, () => `Shield Bubble blocks one zap and pops (${sim.s.energy}, ${sim.s.boosts.bubble})`);
    sim.s.p.inv = 0;
    zap();
    sim.step(NO_INPUT);
    check(sim.s.energy < MAX_ENERGY, () => "the second zap hurts once the bubble popped");
  }
  // Spring Boots: much higher jump; reaches every sky ledge, which a normal jump cannot.
  {
    const peak = (spring: boolean) => {
      const sim = standAt(id, flatX);
      if (spring) sim.giveBoost("spring");
      const y0 = sim.s.p.y;
      let top = y0;
      for (let i = 0; i < 60; i++) {
        sim.step({ ...NO_INPUT, jump: true });
        top = Math.min(top, sim.s.p.y);
      }
      return y0 - top;
    };
    const hn = peak(false);
    const hs = peak(true);
    check(hs > hn + 35 && hs < 130, () => `Spring Boots jump ${hs.toFixed(1)} vs normal ${hn.toFixed(1)}`);
    check(SPRING_JUMP_V < JUMP_V, () => "Spring Boots jump speed");
    for (const sid of STAGES) {
      for (const band of ["k2", "g68"] as Band[]) {
        const L = buildLevel(sid, band);
        const ledge = L.skyLedges[0];
        const reach = (spring: boolean) => {
          const sim = standAt(sid, ledge.x - 30, band);
          if (spring) sim.giveBoost("spring");
          for (let i = 0; i < 90; i++) sim.step({ ...NO_INPUT, jump: true, right: i > 2 && i < 40 });
          for (let i = 0; i < 30; i++) sim.step(NO_INPUT);
          return Math.abs(sim.s.p.y + PH - ledge.y) < 0.5 && sim.s.p.onGround;
        };
        check(reach(true), () => `${sid} ${band}: Spring Boots should reach the sky ledge`);
        check(!reach(false), () => `${sid} ${band}: a normal jump should not reach the sky ledge`);
      }
    }
  }
  // Turbo Treads: faster run.
  {
    const a = standAt(id, flatX);
    const b = standAt(id, flatX);
    b.giveBoost("turbo");
    const x0 = a.s.p.x;
    for (let i = 0; i < 30; i++) {
      a.step({ ...NO_INPUT, right: true });
      b.step({ ...NO_INPUT, right: true });
    }
    check(Math.abs((b.s.p.x - x0) - (a.s.p.x - x0) * TURBO) < 2 && a.s.p.x - x0 > RUN * 25, () => `Turbo Treads ${b.s.p.x - x0} vs ${a.s.p.x - x0}`);
  }
  // Rapid Beam: more beams in the same time.
  {
    const count = (rapid: boolean) => {
      const sim = standAt(id, flatX);
      if (rapid) sim.giveBoost("rapid");
      let n = 0;
      for (let i = 0; i < 60; i++) {
        const before = sim.s.shots.filter((x) => x.from === "hero").length;
        sim.step({ ...NO_INPUT, shoot: true });
        if (sim.s.shots.filter((x) => x.from === "hero").length > before) n++;
      }
      return n;
    };
    const n0 = count(false);
    const n1 = count(true);
    check(n1 >= n0 * 1.6, () => `Rapid Beam fires faster (${n1} vs ${n0} beams/s)`);
  }
  // Bolt Magnet: pulls pickups in.
  {
    const a = standAt(id, flatX);
    const b = standAt(id, flatX);
    b.giveBoost("magnet");
    for (const s of [a, b]) {
      s.s.pickups = [{ x: s.s.p.x + 70, y: s.s.p.y - 30, kind: "bolt", life: 400 }];
      for (let i = 0; i < 80; i++) s.step(NO_INPUT);
    }
    check(a.s.pickups.length === 1 && b.s.pickups.length === 0 && b.s.score > a.s.score, () => "Bolt Magnet pulls a bolt to you");
  }
  // Energy cells and hidden capsules.
  {
    const sim = standAt(id, flatX);
    sim.s.energy = 5;
    sim.s.pickups = [{ x: sim.s.p.x, y: sim.s.p.y + 4, kind: "cell", life: Infinity }];
    sim.step(NO_INPUT);
    check(sim.s.energy === 5 + CELL_ENERGY, () => `energy cell gives ${CELL_ENERGY}`);
    sim.s.pickups = [{ x: sim.s.p.x, y: sim.s.p.y + 4, kind: "boost", life: Infinity }];
    sim.step(NO_INPUT);
    check(BOOST_IDS.some((b) => sim.s.boosts[b] > 0), () => "a hidden capsule gives a random power-up");
    const L = buildLevel(id, "g68");
    const fresh = new Sim(L, "g68", []);
    check(fresh.s.pickups.length === L.items.length && fresh.s.pickups.every((p) => p.life === Infinity), () => "placed items start in the level and do not expire");
  }
  // Power-ups never skip the boss quiz: with every power-up on, the boss still needs its right answers.
  {
    const sim = new Sim(buildLevel("clio", "g68"), "g68", []);
    sim.warpToBoss();
    for (const b of BOOST_IDS) sim.giveBoost(b);
    for (let i = 0; i < 400; i++) sim.step({ ...NO_INPUT, shoot: i % 5 === 0 });
    check(!!sim.s.fight && sim.s.fight.hp === sim.s.fight.maxHp, () => "power-ups never lower boss HP");
    // Lost on a respawn.
    sim.s.mode = "respawn";
    sim.s.modeT = 49;
    sim.step(NO_INPUT);
    check(BOOST_IDS.every((b) => sim.s.boosts[b] === 0), () => "power-ups end when Rivet respawns");
  }
  // The save is untouched by Quiz Bots and power-ups (only beaten robots and the citadel flag).
  {
    store.clear();
    const s0 = markBeaten(loadSave(), "splitz");
    writeSave(s0);
    const back = JSON.parse(store.get(SAVE_KEY)!) as Record<string, unknown>;
    check(Object.keys(back).sort().join() === "beaten,fortress", () => `save fields: ${Object.keys(back)}`);
  }
}
console.log(`Stage length (grades 6-8, boss door x): ${lengthReport.join(", ")}`);

/* ------------------------------------------------------------ 7. subject/topic picker */

{
  check(SUBJECT_CHOICES.map((s) => s.label).join(" · ") === "MATH · SCIENCE · ELA · SOCIAL STUDIES · MIXED", () => "subject row");
  const arcadeIds = ["numbers", "factors", "ratios", "fractions", "algebra", "geometry", "life", "earth", "physical", "reading", "phonics", "grammar", "civics", "history", "geography", "economics"];
  check(FOCUS_TOPICS.map((t) => t.id).join() === arcadeIds.join(), () => "topic ids are the arcade menu's");
  const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);
  check(same(focusFromUrl("?topic=fractions", "4", catalog).choice, { subject: "math", topic: "fractions" }), () => "?topic=fractions @4");
  const kf = focusFromUrl("?topic=fractions", "K", catalog);
  check(kf.choice === null && kf.unavailable === "fractions", () => "?topic=fractions @K is not offered");
  check(same(focusFromUrl("?subject=math", "8", catalog).choice, { subject: "math", topic: "all" }), () => "?subject=math");
  check(same(focusFromUrl("?subject=mixed", "8", catalog).choice, MIXED), () => "?subject=mixed");
  check(focusFromUrl("?topic=dragons", "8", catalog).choice === null, () => "unknown topic ignored");
  check(focusFromUrl("?grade=5", "5", catalog).choice === null, () => "no topic: keep the saved one");
  check(same(focusFromUrl("?topic=geography&grade=2", "2", catalog).choice, { subject: "social", topic: "geography" }), () => "?topic=geography");
  check(parseStoredFocus(null, null).subject === "mixed" && same(parseStoredFocus("math", "dragons"), { subject: "math", topic: "all" }), () => "stored parsing");
  store.clear();
  saveFocus({ subject: "math", topic: "fractions" });
  check(same(loadFocus(), { subject: "math", topic: "fractions" }), () => "saved choice");
  check(same(refocusSavedForGrade("1", catalog), { subject: "math", topic: "all" }), () => "fractions @1 falls back to ALL MATH");
  check(validateFocus(MIXED, "7", catalog).subject === "mixed", () => "validate MIXED");
  // MATH-only retunes all eight robots to math.
  for (const g of ["2", "6", "11"] as Grade[]) {
    const math = ROBOTS.map((r) => resolveRobot(r, g, { subject: "math", topic: "all" }, catalog));
    check(math.every((x) => x.subject === "math"), () => `MATH @${g}: every robot asks math`);
    const mixed = ROBOTS.map((r) => resolveRobot(r, g, MIXED, catalog));
    check(mixed.filter((x) => x.subject === "math").length === 2, () => `MIXED @${g}: two math robots`);
  }
}

// The game's real wiring (kit bankFor via import.meta.glob), through Vite's SSR loader.
{
  const { createServer } = await import("vite");
  const server = await createServer({ configFile: new URL("../vite.config.ts", import.meta.url).pathname, server: { middlewareMode: true, hmr: false }, appType: "custom", logLevel: "error" });
  try {
    const mod = (await server.ssrLoadModule("/src/robo/bank.ts")) as typeof import("../src/robo/bank");
    for (const g of GRADES) check(mod.catalog.available(g).join() === catalog.available(g).join(), () => `real catalog at ${g}: ${mod.catalog.available(g)} vs ${catalog.available(g)}`);
  } finally {
    await server.close();
  }
}

console.log(`${checks} checks, ${failures} failures (${((Date.now() - t0) / 1000).toFixed(1)} s)`);
console.log(`Questions drawn: ${draws}. Extra questions: ${ALL_EXTRAS.length}. Bot frames played: ${botFrames}. Quiz Bots answered by the bot: ${botQb}.`);
if (flavorReport.length) console.log(`Flavour thin (whole topic used instead): ${flavorReport.join(", ")}`);
console.log("Topics by grade:");
for (const g of GRADES) console.log(`  ${g.padStart(2)}: ${catalog.available(g).join(", ")}`);
if (failures) {
  console.error(`${failures} check(s) failed`);
  process.exit(1);
}
console.log("All Robo Masters checks passed.");
