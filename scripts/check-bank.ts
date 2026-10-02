/*
 * npm test: validates Plants vs Undead's own data and simulation for every grade.
 *  - question bank: every grade band and every defender has questions, exactly one correct answer
 *    (authored first), no duplicate choices, quick-question length limits, unique ids,
 *    well-formed NC standard codes for every grade, key science facts answered correctly
 *  - chemistry: every chemical equation anywhere in the game is balanced, and the
 *    photosynthesis equation is always written exactly 6CO₂ + 6H₂O → C₆H₁₂O₆ + 6O₂
 *  - sprites: rectangular grids, known palette letters, every plant and undead drawn
 *  - controls: seed hotkeys never use A–D or 1–4; canvas text has bitmap-font glyphs
 *  - simulation: a bot plays every band headless; photosynthesis makes glucose, dim light and
 *    cold behave, waves clear, levels advance, and the game ends
 */
import { GRADES } from "../src/kit/grades";
import type { Grade } from "../src/kit/types";
import { BANK, SKILL, bandOfGrade, cardItems, checkpointItems, standardFor, type Topic } from "../src/data/bank";
import { PARTS, PHOTO_EQUATION, PLANT_KINDS, RECIPE, RESP_EQUATION, type Band } from "../src/data/parts";
import { LEVELS, PLANTS, TRAY, UNDEAD, cellX, cellY, tuningFor, type UndeadKind } from "../src/pvu/defs";
import { LABELS } from "../src/pvu/engine";
import { hasGlyphs, missingGlyphs } from "../src/pvu/font";
import { Sim } from "../src/pvu/sim";
import { GRIDS, LID, PAL } from "../src/pvu/sprites";

let failures = 0;
let checks = 0;
function ok(cond: unknown, msg: string) {
  checks++;
  if (!cond) {
    failures++;
    console.error("FAIL:", msg);
  }
}

const BANDS: Band[] = [0, 1, 2, 3];
const TOPICS = Object.keys(SKILL) as Topic[];

/* ------------------------------------------------------------------ bank */
const ids = new Set<string>();
for (const q of BANK) {
  ok(!ids.has(q.id), `duplicate id ${q.id}`);
  ids.add(q.id);
  ok(q.answer === 0, `${q.id}: correct answer must be authored first`);
  ok(q.choices.length === 4, `${q.id}: needs 4 choices`);
  const norm = q.choices.map((c) => c.trim().toLowerCase());
  ok(new Set(norm).size === 4, `${q.id}: duplicate choices ${q.choices.join(" | ")}`);
  ok(q.choices.every((c) => c.trim().length > 0), `${q.id}: empty choice`);
  ok(q.prompt.trim().length > 0 && q.explanation.trim().length > 0, `${q.id}: empty prompt/explanation`);
  ok(TOPICS.includes(q.topic), `${q.id}: unknown topic ${q.topic}`);
  if (q.quick) {
    ok(q.prompt.length <= 100, `${q.id}: quick prompt too long (${q.prompt.length})`);
    q.choices.forEach((c) => ok(c.length <= 14, `${q.id}: quick choice "${c}" is ${c.length} chars (max 14)`));
    ok(!q.passage, `${q.id}: quick questions have no passage`);
    ok(q.kind !== null, `${q.id}: seed-card question needs a defender`);
  } else {
    ok(q.prompt.length <= 200, `${q.id}: checkpoint prompt too long`);
    ok(!q.passage || q.passage.length <= 400, `${q.id}: passage too long`);
    q.choices.forEach((c) => ok(c.length <= 80, `${q.id}: checkpoint choice too long: ${c}`));
  }
  ok(q.explanation.length <= 260, `${q.id}: explanation too long`);
  // Correct answer must not also appear inside the prompt verbatim as a giveaway (quick only)
  if (q.quick && q.choices[0].length > 4) ok(!q.prompt.toLowerCase().includes(q.choices[0].toLowerCase()), `${q.id}: prompt gives away the answer`);
}

for (const band of BANDS) {
  for (const kind of PLANT_KINDS) {
    ok(cardItems(band, kind).length >= 2, `band ${band}: defender ${kind} needs at least 2 seed-card questions`);
  }
  ok(checkpointItems(band).length >= 5, `band ${band}: needs at least 5 checkpoint questions`);
}

const CODE = /^(LS|PS|ESS)\.(K|\d{1,2}|Bio|Chm|Phy|EES)(\.\d+){1,2}$/;
for (const g of GRADES) {
  const band = bandOfGrade(g);
  for (const t of TOPICS) {
    const code = standardFor(t, g);
    ok(CODE.test(code), `grade ${g}: bad standard code "${code}" for ${t}`);
    if (Number.isFinite(Number(g)) && Number(g) <= 8) {
      const gradePart = code.split(".")[1];
      ok(gradePart === g || (g === "2" && gradePart === "1") || (["7", "8"].includes(g) && gradePart === "6") || (g === "K" && gradePart === "K"), `grade ${g}: code ${code} is for another grade`);
    }
  }
  if (g === "K") ok(standardFor("parts", g) === "LS.K.1.1", "K uses LS.K.1.1");
  ok(BANK.some((q) => q.band === band), `grade ${g}: no questions`);
}
ok(bandOfGrade("K") === 0 && bandOfGrade("2") === 0 && bandOfGrade("3") === 1 && bandOfGrade("5") === 1 && bandOfGrade("6") === 2 && bandOfGrade("8") === 2 && bandOfGrade("9") === 3 && bandOfGrade("12") === 3, "grade bands");

/* Key facts: a question whose prompt matches must have this correct answer. */
const FACTS: [RegExp, string][] = [
  [/carries water up from the roots/i, "Xylem"],
  [/carries sugar from the leaves/i, "Phloem"],
  [/Calvin cycle takes place/i, "Stroma"],
  [/light-dependent reactions take place/i, "Thylakoids"],
  [/O₂ released by photosynthesis comes from splitting/i, "Water"],
  [/photosynthesis takes place inside which organelle/i, "Chloroplast"],
  [/pigment in leaves absorbs light/i, "Chlorophyll"],
  [/openings for gas exchange/i, "Stomata"],
  [/open and close the stomata/i, "Guard cells"],
  [/most of its mass/i, "Air and water"],
  [/fixes CO₂ in the Calvin cycle/i, "Rubisco"],
  [/makes pollen/i, "Anther"],
  [/develops from which part of the flower/i, "Ovary"],
  [/energy stored in food first came from/i, "Sun"],
  [/gas do leaves take in/i, "Carbon dioxide"],
  [/give off which gas/i, "Oxygen"],
  [/bending toward a sunny window/i, "Phototropism"],
  [/in response to gravity/i, "Gravitropism"],
  [/LEAST photosynthesis/i, "Green"],
  [/how many oxygen atoms/i, "18"],
  [/balanced chemical equation for photosynthesis/i, PHOTO_EQUATION],
  [/word equation shows photosynthesis/i, "Carbon dioxide + water → glucose + oxygen"],
  [/holds a plant tight in the soil/i, "Roots"],
  [/makes food from sunlight/i, "Leaves"],
];
for (const [re, ans] of FACTS) {
  const hits = BANK.filter((q) => re.test(q.prompt));
  ok(hits.length > 0, `fact check found no question for ${re}`);
  for (const q of hits) ok(q.choices[q.answer] === ans, `${q.id}: expected answer "${ans}", got "${q.choices[q.answer]}"`);
}

/* ------------------------------------------------------------------ chemistry */
const SUB = "₀₁₂₃₄₅₆₇₈₉";
function atoms(side: string): Map<string, number> | null {
  const m = new Map<string, number>();
  for (const raw of side.split("+")) {
    const term = raw.trim();
    const mm = /^(\d*)((?:[A-Z][a-z]?[₀-₉]*)+)$/.exec(term);
    if (!mm) return null;
    const coef = mm[1] ? Number(mm[1]) : 1;
    for (const e of mm[2].matchAll(/([A-Z][a-z]?)([₀-₉]*)/g)) {
      const n = e[2] ? Number([...e[2]].map((c) => SUB.indexOf(c)).join("")) : 1;
      m.set(e[1], (m.get(e[1]) ?? 0) + coef * n);
    }
  }
  return m;
}
function balanced(eq: string): boolean {
  const [l, r] = eq.split("→");
  const a = atoms(l);
  const b = atoms(r);
  if (!a || !b) return false;
  if (a.size !== b.size) return false;
  for (const [k, v] of a) if (b.get(k) !== v) return false;
  return true;
}
ok(balanced(PHOTO_EQUATION), "photosynthesis equation balances");
ok(balanced(RESP_EQUATION), "respiration equation balances");
ok(PHOTO_EQUATION === "6CO₂ + 6H₂O → C₆H₁₂O₆ + 6O₂", "canonical photosynthesis equation");
ok(!balanced("CO₂ + H₂O → C₆H₁₂O₆ + O₂"), "balance checker rejects an unbalanced equation");

const TEXTS: [string, string][] = [];
for (const q of BANK) {
  TEXTS.push([`${q.id} prompt`, q.prompt], [`${q.id} explanation`, q.explanation]);
  if (q.passage) TEXTS.push([`${q.id} passage`, q.passage]);
  q.choices.forEach((c, i) => TEXTS.push([`${q.id} choice ${i}`, c]));
}
for (const k of PLANT_KINDS) PARTS[k].job.forEach((j, i) => TEXTS.push([`${k} job ${i}`, j]));
RECIPE.forEach((r, i) => TEXTS.push([`recipe ${i}`, r]));

const FORMULA_EQ = /(?:\d*(?:[A-Z][a-z]?[₀-₉]*)+\s*\+\s*)*\d*(?:[A-Z][a-z]?[₀-₉]*)+\s*→\s*(?:\d*(?:[A-Z][a-z]?[₀-₉]*)+\s*\+\s*)*\d*(?:[A-Z][a-z]?[₀-₉]*)+/g;
let eqCount = 0;
for (const [where, text] of TEXTS) {
  for (const m of text.matchAll(FORMULA_EQ)) {
    const eq = m[0];
    if (![...eq].some((c) => SUB.includes(c))) continue; // words like "Seed → seedling"
    eqCount++;
    ok(balanced(eq), `${where}: unbalanced equation "${eq}"`);
    const left = eq.split("→")[0];
    if (/CO₂/.test(left) && /H₂O/.test(left)) ok(eq === PHOTO_EQUATION, `${where}: photosynthesis must be written "${PHOTO_EQUATION}", got "${eq}"`);
  }
  if (text.includes("C₆H₁₂O₆") && text.includes("→")) {
    ok(text.includes(PHOTO_EQUATION) || text.includes(RESP_EQUATION), `${where}: glucose equation not in canonical form`);
  }
  ok(!/C6H12O6|CO2|H2O|6O2/.test(text), `${where}: write formulas with subscripts (₂, ₆…)`);
}
ok(eqCount >= 6, `expected several chemical equations in the game text, found ${eqCount}`);

/* ------------------------------------------------------------------ sprites */
for (const [name, rows] of Object.entries(GRIDS)) {
  ok(rows.length > 0, `${name}: empty sprite`);
  const w = rows[0].length;
  rows.forEach((r, y) => {
    ok(r.length === w, `${name} row ${y}: width ${r.length} != ${w}`);
    for (const ch of r) if (ch !== ".") ok(PAL[ch], `${name}: unknown palette letter "${ch}"`);
  });
}
for (const k of PLANT_KINDS) {
  ok(GRIDS[k], `no sprite for ${k}`);
  ok(LID[k], `no eyelid colour for ${k}`);
  ok(GRIDS[k] && GRIDS[k].length <= 21 && GRIDS[k][0].length <= 20, `${k}: plant sprite must fit a lawn cell`);
}
for (const k of Object.keys(UNDEAD) as UndeadKind[]) ok(GRIDS[`${k}0`] && GRIDS[`${k}1`], `undead ${k} needs two walk frames`);
for (const n of ["sun", "drop", "co2", "glucose", "o2", "cart", "seedshot", "leafshot"]) ok(GRIDS[n], `missing sprite ${n}`);

/* ------------------------------------------------------------------ controls and canvas text */
const keys = TRAY.map((k) => PLANTS[k].key);
ok(new Set(keys).size === keys.length, "seed hotkeys are unique");
for (const k of keys) ok(!/^[A-Da-d1-4]$/.test(k), `seed hotkey ${k} clashes with answer keys`);
ok(!keys.includes("X") && !keys.includes("M") && !keys.includes("L"), "seed hotkeys avoid X (dig), M (mute), L (listen)");
ok(TRAY.length === PLANT_KINDS.length && PLANT_KINDS.every((k) => TRAY.includes(k)), "every defender has a card");
const canvasText = [
  ...LEVELS.map((l) => `LEVEL 5: ${l.name}`),
  ...BANDS.flatMap((b) => LABELS[b]),
  "THE WEED LICH!", "IT SUMMONS BLIGHT BUGS", "A HUGE WAVE!", "HERE COME THE UNDEAD", "THE GREENHOUSE!", "AN UNDEAD GOT IN",
  "DIM LIGHT: LEAVES MAKE LESS FOOD", "GATHER SUNLIGHT AND PLANT!", "WAVE 3 IS COMING", "PLANT AND GATHER!", "NOT YET — LATER LEVEL",
  "NOTHING TO DIG UP", "PICK A SEED CARD FIRST", "FLOWER BED — PLANT ON THE GRASS", "NEED 150 GLUCOSE", "RECHARGING", "TAKEN", "NOT HERE",
  "COLD", "O₂", "→", "WEED LICH", "LV5 WAVE 3/3", "WAVE 2/3 IN 12", "DIM", "+1500", "100%",
  ...PLANT_KINDS.map((k) => PARTS[k].name.toUpperCase()),
];
for (const t of canvasText) ok(hasGlyphs(t), `bitmap font can't draw "${t}" (missing ${missingGlyphs(t).join("")})`);

/* ------------------------------------------------------------------ simulation */
const DIRS = [cellX(0), cellY(0)];
ok(DIRS[0] === 30 && DIRS[1] === 22, "lawn origin");

function botPlay(band: Band, seed: number) {
  const s = new Sim();
  s.newGame(band, seed);
  const t = tuningFor(band);
  ok(s.lanes.length === (band === 0 ? 3 : 5), `band ${band}: lanes`);
  ok(s.hearts === t.hearts, `band ${band}: hearts`);
  let time = 0;
  let maxLevel = 1;
  let holds = 0;
  let sawDim = false;
  let sawCold = false;
  const glucoseStart = s.glucose;
  const dt = 1 / 30;
  while (s.phase !== "over" && time < 60 * 60) {
    // Collect every mote (a perfect gatherer).
    for (const m of s.motes) s.collectAt(m.x, m.y, 2);
    // Learn whatever is available (answer correctly every other time).
    for (const k of s.available) if (!s.learned.has(k)) s.learn(k, s.learned.size % 2 === 0);
    // Simple planting policy: leaves and roots at the back, slingers next, then the rest.
    const plan: [typeof TRAY[number], number][] = [["sunleaf", 0], ["rootknot", 4], ["slinger", 1], ["slinger", 2], ["pollen", 3], ["frond", 3], ["stoma", 0], ["chloro", 1], ["thorn", 5], ["stem", 2]];
    for (const [kind, col] of plan) {
      if (!s.available.includes(kind)) continue;
      for (const row of s.lanes) {
        if (!s.whyNot(kind, col, row)) s.plant(kind, col, row);
      }
    }
    if (s.sky < s.levelDef.light - 0.01) sawDim = true;
    if (s.cold) sawCold = true;
    s.update(dt);
    time += dt;
    if (s.phase === "hold") {
      holds++;
      s.resolveHold(holds % 2 === 0);
    }
    maxLevel = Math.max(maxLevel, s.level);
    ok(Number.isFinite(s.glucose) && s.glucose >= 0, `band ${band}: glucose stays valid`);
    if (failures > 20) break;
  }
  ok(s.phase === "over", `band ${band}: the game ends (won or lost) within an hour of play`);
  ok(s.stats.batches > 5, `band ${band}: photosynthesis made glucose (${s.stats.batches} batches)`);
  ok(s.stats.glucoseMade === s.stats.batches * t.batch, `band ${band}: glucose made = batches × ${t.batch}`);
  ok(s.stats.o2 === s.stats.batches, `band ${band}: one O₂ per batch`);
  ok(s.stats.defeated > 10, `band ${band}: undead defeated (${s.stats.defeated})`);
  ok(holds >= 2, `band ${band}: waves cleared and checkpoints held (${holds})`);
  ok(maxLevel >= 2, `band ${band}: reached level ${maxLevel}`);
  ok(glucoseStart > 0, `band ${band}: starts with glucose`);
  return { maxLevel, holds, time: Math.round(time), won: s.hearts > 0, sawDim, sawCold, stats: s.stats, hearts: s.hearts };
}

for (const band of BANDS) {
  const r = botPlay(band, 1234 + band);
  console.log(`  band ${band}: level ${r.maxLevel}, ${r.holds} waves cleared, ${r.time}s, ${r.won ? "WON" : "lost"} (hearts ${r.hearts}), batches ${r.stats.batches}, dim ${r.sawDim}, cold ${r.sawCold}`);
}

// Light: a Shade dims the sky, so leaves catch less light.
{
  const s = new Sim();
  s.newGame(2, 5);
  const before = s.sky;
  s.spawn("shade", 2, 300);
  ok(s.sky < before * 0.5, `a Shade dims the sky (${before} → ${s.sky})`);
  s.startLevel(3);
  ok(s.sky < 0.6, "level 3 (twilight) has dim light");
  // Cold slows the reaction
  s.store = { light: 5, water: 5, co2: 5 };
  s.phase = "prewave";
  s.phaseT = 99;
  let tWarm = 0;
  const g0 = s.glucose;
  while (s.glucose === g0 && tWarm < 10) {
    s.update(0.02);
    tWarm += 0.02;
  }
  s.store = { light: 5, water: 5, co2: 5 };
  s.react = -1;
  const wraith = s.spawn("frostwraith", 2, 300);
  wraith.speed = 0;
  let tCold = 0;
  const g1 = s.glucose;
  while (s.glucose === g1 && tCold < 10) {
    s.update(0.02);
    tCold += 0.02;
  }
  ok(tCold > tWarm * 1.8, `cold slows photosynthesis (${tWarm.toFixed(2)}s warm vs ${tCold.toFixed(2)}s cold)`);
  // No ingredient, no glucose
  s.undead = [];
  s.store = { light: 0, water: 5, co2: 5 };
  s.react = -1;
  s.motes = [];
  const g2 = s.glucose;
  for (let i = 0; i < 20; i++) s.update(0.02);
  ok(s.glucose === g2, "no light, no photosynthesis");
}

// Seed-card questions: right = half price, wrong = recharge first.
{
  const s = new Sim();
  s.newGame(1, 9);
  s.learn("sunleaf", true);
  ok(s.priceOf("sunleaf") === PLANTS.sunleaf.cost / 2, "right answer halves the first price");
  s.learn("slinger", false);
  ok((s.cooldown.slinger ?? 0) > 0 && s.whyNot("slinger", 1, 1) === "RECHARGING", "wrong answer makes the card recharge");
  ok(s.plant("sunleaf", 0, 1) && s.priceOf("sunleaf") === PLANTS.sunleaf.cost, "discount used once");
  ok(s.whyNot("sunleaf", 0, 1) !== null, "can't plant on a taken square");
  ok(s.whyNot("thorn", 3, 1) === "LOCKED", "later-level parts are locked");
  // The last line: a gnome cart, then the greenhouse
  const u = s.spawn("grumbones", 2, 26);
  s.phase = "wave";
  s.queue = [{ t: 999, kind: "grumbones", row: 2 }];
  for (let i = 0; i < 60; i++) s.update(0.02);
  ok(s.carts.find((c) => c.row === 2)?.state !== "ready" && u.dead, "a gnome cart rolls and clears the lane");
  const hearts = s.hearts;
  const u2 = s.spawn("grumbones", 2, 6);
  for (let i = 0; i < 40; i++) s.update(0.05);
  ok(s.hearts === hearts - 1 && u2.dead, "an undead past the cart costs a greenhouse heart");
}

// Every grade gets a full deck of card questions.
for (const g of GRADES as Grade[]) {
  for (const k of PLANT_KINDS) ok(cardItems(bandOfGrade(g), k).length > 0, `grade ${g}: ${k} has questions`);
}

console.log(`\n${checks} checks, ${failures} failures. ${BANK.length} questions (${BANK.filter((q) => q.quick).length} seed-card, ${BANK.filter((q) => !q.quick).length} checkpoint), ${eqCount} chemical equations checked.`);
if (failures) process.exit(1);
