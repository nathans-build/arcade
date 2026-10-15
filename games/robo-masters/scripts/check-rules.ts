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
 * 7. Subject/topic picker: arcade topic ids, ?topic= / ?subject= parsing, saved choice, grade fallback; and
 *    (through Vite's SSR loader) the real kit wiring offers the same topics.
 */
import { GRADES } from "../src/kit/grades";
import type { Grade, Question, Subject } from "../src/kit/types";
import { BANDS, QUICK_CHOICE, QUICK_PROMPT, bandOf, type Band } from "../src/robo/band";
import { playStage } from "../src/robo/bot";
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
import { MAX_ENERGY, NO_INPUT, PH, POWER_MAX, Sim, bumpDamage, startLives, type Input } from "../src/robo/sim";

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
  check(r.stage.bass.length === 16, () => `${r.id}: bass loop should have 16 steps`);
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
console.log(`Questions drawn: ${draws}. Extra questions: ${ALL_EXTRAS.length}. Bot frames played: ${botFrames}.`);
if (flavorReport.length) console.log(`Flavour thin (whole topic used instead): ${flavorReport.join(", ")}`);
console.log("Topics by grade:");
for (const g of GRADES) console.log(`  ${g.padStart(2)}: ${catalog.available(g).join(", ")}`);
if (failures) {
  console.error(`${failures} check(s) failed`);
  process.exit(1);
}
console.log("All Robo Masters checks passed.");
