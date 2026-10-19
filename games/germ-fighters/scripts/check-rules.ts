/*
 * Germ Fighters checks:   npm test   (npx tsx scripts/check-rules.ts)
 * 1. The cast: hero (Granule Blast, black eyes), helper, 8 body zones (stage germs with real names, no old pun
 *    names anywhere in src/ or the README, accurate germ types, distinct looks, patterns,
 *    stages, songs, kid-friendly lines), 8 immune skills and weak spots, 6 Major Viruses (the required real
 *    viruses, no frightening ones) and their fact tables (antibiotics never work on viruses; norovirus:
 *    soap and water beat sanitizer; measles: MMR; flu: yearly vaccine; no vaccine for the common cold).
 * 2. This game's health bank (>= 15 per band) and every virus's fact questions (>= 4 per band): well formed,
 *    NC-coded for their band, correct choice first, explanations, quick flags; the antibiotic fact check
 *    (no right answer or explanation ever says antibiotics work on viruses); no leftover robot words.
 * 3. Every zone and every Major Virus at every grade K-12, in the default (SCIENCE · Life & health), MIXED,
 *    every single subject and sample topics: 4 unique choices, a valid answer (also after dealing), an
 *    explanation, an NC code and the right source; MIXED reaches all four subjects; viruses ask their own facts.
 * 4. Boss rules: right answers deplete HP (double with the weak-spot skill); wrong answers never change HP,
 *    energy or lives; Major Viruses have shorter HP and the last one a little more.
 * 5. Stages: length, checkpoints, rest stop, infected cell, 3 Antigen Clues with barriers in every stage; K-2
 *    gentler; bacteria split in two if left alone; the headless bot clears every zone and the whole Major
 *    Virus rush in every grade band (answering some questions wrong), drawing real questions for every panel.
 * 6. Immune skills each work in the sim; the infected cell opens only to its skill.
 * 7. Power-ups: effects and durations (Phase Through Membrane, Lymph Leap, Vaccine Memory, Fever Boost,
 *    Antibody Burst, Mucus Shield); Antigen Clue rewards; nothing lost to wrong answers.
 * 8. Save/load (keys arcade.germ-fighters.*), virus cards, the Lymph Node unlock, rush retries.
 * 9. Subject/topic picker: default SCIENCE · Life & health, MIXED, ?topic= / ?subject= parsing, grade fallback,
 *    and (through Vite's SSR loader) the real kit wiring offers the same topics.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { GRADES } from "../src/kit/grades";
import type { Grade, Question, Subject } from "../src/kit/types";
import { LYMPH_SONG, ZONE_SONGS } from "../src/music";
import { BANDS, QUICK_CHOICE, QUICK_PROMPT, bandOf, type Band } from "../src/germs/band";
import { playStage } from "../src/germs/bot";
import {
  BOOSTS, BOOST_IDS, CLUES_PER_STAGE, FEVER, LEAP_JUMP_V, boostChance, boostFromRoll, clueReward,
} from "../src/germs/boosts";
import {
  DEFAULT_FOCUS, FOCUS_TOPICS, FocusCatalog, MIXED, SUBJECT_CHOICES, SUBJECT_KEY, TOPIC_KEY, focusFromUrl, focusTopic,
  loadFocus, parseStoredFocus, refocusSavedForGrade, saveFocus, validateFocus, type FocusChoice, type FocusTopicId,
} from "../src/germs/focus";
import { ALL_HEALTH, HEALTH, type HealthQuestion } from "../src/germs/health";
import { ARENA_W, buildLevel, gatePowerFor, tuningFor } from "../src/germs/levels";
import { GermQuestions, dealQuestion, healthMode, isHealthItem, matchesPlain, matchesSource, resolveVirus, resolveZone } from "../src/germs/questions";
import { ACID_GRANULE_COLORS, CYTO_EYE, CYTO_EYE_SHINE, GRANULE_COLORS } from "../src/germs/render";
import { HERO, POWERS, POWER_IDS, RUSH, VIRUSES, VIRUS_IDS, ZONES, ZONE_IDS, type PowerId, type StageId, type VirusId } from "../src/germs/roster";
import {
  EMPTY_SAVE, SAVE_KEY, applyAnswer, bossHp, loadSave, markBeaten, markRush, markVirus, newFight, panelHits, panelTimeout,
  parseSave, powersOf, rushOpen, virusHp, writeSave,
} from "../src/germs/rules";
import { CELL_ENERGY, JUMP_V, MAX_ENERGY, NO_INPUT, PH, POWER_MAX, PW, RUN, Sim, bumpDamage, splitFrames, startLives, type Input } from "../src/germs/sim";
import { ALL_VIRUS_QUESTIONS, VIRUS_QUESTIONS } from "../src/germs/viruses";

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

const uniq = <T>(xs: T[]) => new Set(xs).size === xs.length;
/** Words that don't belong in a cheerful K-12 germ game. */
/** Gross or frightening words never belong anywhere, even in a science explanation. */
const GROSS = /\b(gross|gory|gore|guts|vomit|puke|poop|diarrh\w*|scary|terrif\w*|hiv|ebola|plague|blood[- ]?thirsty)\b/i;
const UNFRIENDLY = /\b(kill|kills|killed|die|dies|dying|dead|death|destroy|smash|blood[- ]?thirsty|gross|gory|gore|guts|vomit|puke|poop|diarrh\w*|scary|terrif\w*|hiv|ebola|plague)\b/i;

/* ------------------------------------------------------------ 1. the cast */

check(HERO.name === "CYTO" && /killer T cell/i.test(HERO.blurb) && HERO.helper === "HANA", () => "hero is Cyto the killer T cell, helper Hana");
check(ZONES.length === 8, () => `want 8 body zones, got ${ZONES.length}`);
check(uniq(ZONES.map((z) => z.id)) && uniq(ZONES.map((z) => z.boss)) && uniq(ZONES.map((z) => z.place)), () => "zone ids, bosses and places are unique");
check(uniq(ZONES.map((z) => z.stage.name)) && uniq(ZONES.map((z) => z.stage.deco)), () => "stage names and scenery are unique");
check(uniq(ZONES.map((z) => z.pattern)), () => "stage germ patterns repeat");
check(uniq(ZONES.map((z) => z.look.body + z.look.trim)), () => "stage germ colours repeat");
check(uniq(ZONES.map((z) => z.power)) && POWER_IDS.every((p) => ZONES.some((z) => z.power === p)), () => "every immune skill belongs to exactly one zone");
check(uniq(ZONES.map((z) => z.weakness)) && ZONES.every((z) => z.weakness !== z.power), () => "weak spots: one per skill, never a germ's own skill");
check(new Set(ZONES.map((z) => z.partner)).size === 3 && !ZONES.some((z) => z.partner === "science"), () => "MIXED partners cover math, ELA and social studies");
for (const place of ["Nose & Airways", "Throat & Tonsils", "Lung Bubbles", "Bloodstream", "Stomach", "Gut Garden", "Skin & Cut", "Mouth & Teeth"]) {
  check(ZONES.some((z) => z.place === place), () => `zone ${place} missing`);
}
// Germ types are accurate for the real germs they are named after.
const GERM_TYPE: Record<string, { kind: "bacterium" | "virus"; type: RegExp }> = {
  nose: { kind: "virus", type: /adenovirus/i },
  throat: { kind: "bacterium", type: /Streptococcus.*Strep A.*chain/i },
  lungs: { kind: "bacterium", type: /Streptococcus pneumoniae.*pairs/i },
  blood: { kind: "bacterium", type: /Borrelia.*spirochete.*spiral.*tick/i },
  stomach: { kind: "bacterium", type: /Helicobacter pylori/i },
  gut: { kind: "bacterium", type: /Salmonella.*rod/i },
  skin: { kind: "bacterium", type: /Staphylococcus aureus.*grape/i },
  mouth: { kind: "bacterium", type: /Streptococcus mutans.*sugar/i },
};
for (const z of ZONES) {
  const want = GERM_TYPE[z.id];
  check(z.germ === want.kind && want.type.test(z.bossType), () => `${z.id}: germ type "${z.bossType}" (${z.germ})`);
  check(z.germ === "virus" ? /virus/i.test(z.bossType) && !/bacteri/i.test(z.bossType) : /bacteri/i.test(z.bossType), () => `${z.id}: bossType should say bacterium or virus to match its kind`);
  check(z.lines.intro.length > 10 && z.lines.defeat.length > 10 && z.lines.block.length >= 2 && z.lines.hit.length >= 2, () => `${z.id}: lines`);
  const all = [z.lines.intro, z.lines.defeat, ...z.lines.block, ...z.lines.hit, z.defense, z.bossType].join(" ");
  check(!UNFRIENDLY.test(all), () => `${z.id}: lines should be kid-friendly: ${all.match(UNFRIENDLY)}`);
  check(/spot|identif/i.test(z.lines.defeat), () => `${z.id}: the defeat line should say the germ was spotted/identified`);
  check(!!ZONE_SONGS[z.id] && ZONE_SONGS[z.id].title === z.stage.name, () => `${z.id}: needs a stage theme in src/music.ts named after its stage`);
  check(POWERS[z.power].cost > 0 && POWERS[z.power].cost <= POWER_MAX, () => `${z.id}: skill cost`);
  check(z.retune.science.includes("life"), () => `${z.id}: SCIENCE retunes to life science`);
}
check(LYMPH_SONG.title === RUSH.stage.name, () => "the Lymph Node has its own theme");

// Real germ names: every stage germ is shown by its real organism name (standard abbreviations when long).
const REAL_NAMES: Record<string, [string, RegExp]> = {
  nose: ["ADENOVIRUS", /^Adenovirus$/],
  throat: ["STREPTOCOCCUS", /^Streptococcus pyogenes \(Strep A\)$/],
  lungs: ["S. PNEUMONIAE", /^Streptococcus pneumoniae/],
  blood: ["BORRELIA", /^Borrelia burgdorferi$/],
  stomach: ["H. PYLORI", /^Helicobacter pylori$/],
  gut: ["SALMONELLA", /^Salmonella$/],
  skin: ["S. AUREUS", /^Staphylococcus aureus$/],
  mouth: ["S. MUTANS", /^Streptococcus mutans$/],
};
for (const z of ZONES) {
  const [name, full] = REAL_NAMES[z.id];
  check(z.boss === name, () => `${z.id}: stage germ should be shown as ${name}, got ${z.boss}`);
  check(full.test(z.bossFull), () => `${z.id}: full name ${z.bossFull}`);
  // Fits a 5px HUD label, the 6px banner sub-line and a stage-select tile on a 360px phone.
  check(z.boss.length <= 13 && z.boss === z.boss.toUpperCase(), () => `${z.id}: on-screen name too long or not caps: ${z.boss}`);
  check(z.lines.intro.includes(z.boss), () => `${z.id}: the intro line introduces the germ by its real name`);
}
// The old pun names are gone from the game's source and README (the kit's banks are not this game's text).
const OLD_NAMES = /adeno-?bounce|strep-?tacular|pneumo-?pair|spiro-?swirl|heli-copter|sally monella|staph-?a-?lot|mutans munch|whup-whup|propeller|mayday/i;
const PROJECTILE_WORDS = /\b(lasers?|zappers?|zap|zaps|zapp\w*|zapped|beams?)\b/i;
const gameRoot = new URL("..", import.meta.url).pathname;
function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) return f === "kit" ? [] : sourceFiles(p);
    return /\.(ts|tsx|css|svg|html)$/.test(f) ? [p] : [];
  });
}
const texts = [...sourceFiles(join(gameRoot, "src")), join(gameRoot, "README.md"), join(gameRoot, "index.html"), join(gameRoot, "public", "favicon.svg")];
for (const f of texts) {
  const body = readFileSync(f, "utf8");
  check(!OLD_NAMES.test(body), () => `${f}: old pun name left: ${body.match(OLD_NAMES)?.[0]}`);
}
// The projectile is cytotoxic granules: no laser / zapper / beam / zap wording in anything a player reads.
for (const f of [join(gameRoot, "src", "GermFighters.tsx"), join(gameRoot, "README.md"), join(gameRoot, "index.html"), join(gameRoot, "src", "germs", "roster.ts"), join(gameRoot, "src", "germs", "boosts.ts")]) {
  const body = readFileSync(f, "utf8").replace(/no laser\/zapper\/beam wording/g, "");
  check(!PROJECTILE_WORDS.test(body), () => `${f}: projectile should be granules, found "${body.match(PROJECTILE_WORDS)?.[0]}"`);
}
const playerText = [HERO.blurb, HERO.attack.name, HERO.attack.button, HERO.attack.science, ...Object.values(POWERS).flatMap((p) => [p.name, p.short, p.desc]), ...Object.values(BOOSTS).flatMap((b) => [b.name, b.desc, b.tip, b.science])].join(" ");
check(!PROJECTILE_WORDS.test(playerText), () => `player text: ${playerText.match(PROJECTILE_WORDS)?.[0]}`);
check(/granule/i.test(HERO.attack.name) && /granule/i.test(HERO.blurb) && HERO.attack.button === "BLAST", () => "Cyto's attack is the Granule Blast (BLAST button)");
check(/perforin/i.test(HERO.attack.science) && /granzyme/i.test(HERO.attack.science) && /killer T cell/i.test(HERO.attack.science), () => "the Granule Blast science note names perforin and granzymes");
check(/granule/i.test(POWERS.acid.desc) && /granule/i.test(POWERS.acid.short), () => "Acid Spray throws granules");
check(/antibod/i.test(BOOSTS.antibody.desc) && /Y-shaped/.test(BOOSTS.antibody.desc), () => "Antibody Burst keeps its Y-shaped antibodies");
check(!/"beam"/.test(readFileSync(join(gameRoot, "src", "germs", "render.ts"), "utf8") + readFileSync(join(gameRoot, "src", "germs", "sim.ts"), "utf8")), () => "no beam shot kind is left in the sim or renderer");
check(GRANULE_COLORS.body !== ACID_GRANULE_COLORS.body, () => "Acid Spray granules look different");
// Cyto's eyes are black with a small white shine (game, portraits and the favicon).
check(CYTO_EYE === "#000000" && CYTO_EYE_SHINE === "#ffffff", () => `Cyto's eye colour should be black, got ${CYTO_EYE}`);
{
  const fav = readFileSync(join(gameRoot, "public", "favicon.svg"), "utf8");
  check(/x="6" y="6" width="2" height="2" fill="#000000"/.test(fav) && /x="9" y="6" width="2" height="2" fill="#000000"/.test(fav) && !/#5ef0ff/i.test(fav), () => "favicon Cyto has black eyes and no beam");
}

// The Major Viruses: the brief's six, in order, Coronavirus last; no frightening/sensitive viruses.
check(VIRUS_IDS.join() === "rhino,flu,noro,varicella,measles,corona", () => `Major Viruses: ${VIRUS_IDS}`);
check(uniq(VIRUSES.map((v) => v.pattern)) && uniq(VIRUSES.map((v) => v.look.body)), () => "every Major Virus has its own pattern and look");
check(VIRUSES[VIRUSES.length - 1].pattern === "teleport", () => "the final virus has the final pattern");
for (const v of VIRUSES) {
  const text = [v.name, v.title, ...v.card, v.lines.intro, v.lines.defeat, ...v.lines.block, ...v.lines.hit, ...Object.values(v.facts).map(String)].join(" ");
  check(!UNFRIENDLY.test(text), () => `${v.id}: kid-friendly text: ${text.match(UNFRIENDLY)}`);
  check(v.card.length === 3 && v.card.every((c) => c.length > 20 && c.length < 90), () => `${v.id}: three short fact-card lines`);
  check(v.facts.antibioticsWork === false, () => `${v.id}: antibiotics never work on viruses`);
  check(/spot|identif/i.test(v.lines.defeat), () => `${v.id}: defeat line`);
}
const V = Object.fromEntries(VIRUSES.map((v) => [v.id, v])) as Record<VirusId, (typeof VIRUSES)[number]>;
check(/common cold/i.test(V.rhino.facts.disease) && V.rhino.facts.vaccine === null && V.rhino.card.some((c) => /most common colds/i.test(c)) && V.rhino.card.some((c) => /more than 100/i.test(c)), () => "rhinovirus: most colds, 100+ kinds, no vaccine");
check(/flu/i.test(V.flu.facts.disease) && /every year|yearly/i.test(`${V.flu.facts.vaccine} ${V.flu.facts.protect}`) && /droplet/i.test(V.flu.facts.spreads), () => "influenza: droplets, a yearly vaccine");
check(V.noro.facts.sanitizerWorksWell === false && /soap and water/i.test(V.noro.facts.protect) && V.noro.card.some((c) => /soap and water/i.test(c)) && /stomach bug/i.test(V.noro.facts.disease), () => "norovirus: stomach bug; soap and water beat sanitizer");
check(VIRUSES.filter((v) => v.id !== "noro").every((v) => v.facts.sanitizerWorksWell), () => "only norovirus is flagged as sanitizer-resistant");
check(/chickenpox/i.test(V.varicella.facts.disease) && !!V.varicella.facts.vaccine && V.varicella.card.some((c) => /itchy/i.test(c)), () => "varicella: itchy spots, vaccine available");
check(/MMR/.test(V.measles.facts.vaccine ?? "") && V.measles.card.some((c) => /most catching|contagious/i.test(c)) && V.measles.card.some((c) => /2 hours/.test(c)) && V.measles.card.some((c) => /97/.test(c)), () => "measles: very contagious, lingers 2 hours, MMR ~97%");
check(/COVID-19/.test(V.corona.facts.disease) && V.corona.card.some((c) => /SARS-CoV-2/.test(c)) && V.corona.card.some((c) => /crown/i.test(c)) && !!V.corona.facts.vaccine, () => "coronavirus: SARS-CoV-2 causes COVID-19, crown of spikes, vaccines");
for (const n of ["Antibody Burst", "Fever Boost", "Mucus Shield", "Vaccine Memory", "Phase Through Membrane", "Lymph Leap"]) {
  check(Object.values(BOOSTS).some((b) => b.name === n), () => `power-up ${n} missing`);
}
for (const id of BOOST_IDS) check(!UNFRIENDLY.test(`${BOOSTS[id].desc} ${BOOSTS[id].tip} ${BOOSTS[id].science}`), () => `${id}: kid-friendly power-up text`);
check(/fever/i.test(BOOSTS.fever.science) && /germs slow/i.test(BOOSTS.fever.science), () => "Fever Boost explains how a fever helps");

/* ------------------------------------------------------------ 2. this game's questions */

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
/** Codes each band may use (see the header of src/germs/health.ts). */
const BAND_CODES: Record<Band, RegExp> = {
  k2: /^(K|1|2)\.PCH\.1$/,
  g35: /^((3|4|5)\.PCH\.1|LS\.3\.1\.2|LS\.4\.1\.1|LS\.5\.1\.[12]|LS\.5\.2\.2)$/,
  g68: /^(LS\.7\.1\.[123]|LS\.8\.1\.[12])$/,
  hs: /^LS\.Bio\.(1\.4|1\.5|3\.1|9\.1)$/,
};
function checkOwn(q: HealthQuestion, band: Band, where: string) {
  check(!ids.has(q.id), () => `duplicate id ${q.id}`);
  ids.add(q.id);
  checkShape(q, where);
  check(new Set(q.choices.map((c) => c.trim().toLowerCase())).size === 4, () => `${where}: choices differ only in case`);
  check(q.subject === "science" && isHealthItem(q), () => `${where}: health items are science with a gf- id`);
  check(q.answer === 0, () => `${where}: author the correct choice first`);
  check(/[.!?)"]$/.test(q.explanation.trim()), () => `${where}: explanation should end with punctuation`);
  check(bandOf(q.grade) === band, () => `${where}: grade ${q.grade} is not in ${band}`);
  check(BAND_CODES[band].test(q.standard), () => `${where}: code ${q.standard} not allowed for ${band}`);
  const n = q.grade === "K" ? "K" : Number(q.grade);
  if (n === "K" || n <= 8) check(q.standard.includes(`${n}.`), () => `${where}: standard ${q.standard} does not match grade ${q.grade}`);
  const fits = q.prompt.length <= QUICK_PROMPT && q.choices.every((c) => c.length <= QUICK_CHOICE);
  check(!!q.quick === fits, () => `${where}: quick flag`);
  check(q.zones.length > 0 && q.zones.every((z) => z === "any" || (ZONE_IDS as string[]).includes(z)), () => `${where}: zone tags`);
  check(!/\b(all|none) of the above\b/i.test(q.choices.join(" ")), () => `${where}: no all/none of the above`);
  const text = `${q.prompt} ${q.choices.join(" ")} ${q.explanation}`;
  check(!GROSS.test(text), () => `${where}: kid-friendly wording (${text.match(GROSS)})`);
}
for (const band of BANDS) {
  check(HEALTH[band].length >= 15, () => `${band}: only ${HEALTH[band].length} health questions (want >= 15)`);
  for (const q of HEALTH[band]) checkOwn(q, band, `${q.id} "${q.prompt.slice(0, 40)}"`);
  check(uniq(HEALTH[band].map((q) => q.prompt.toLowerCase())), () => `${band}: repeated prompts`);
  for (const z of ZONES) check(HEALTH[band].some((q) => q.zones.includes(z.id)), () => `${band}: no health item tagged for ${z.id}`);
  for (const v of VIRUSES) {
    const qs = VIRUS_QUESTIONS[v.id][band];
    check(qs.length >= 4, () => `${v.id} ${band}: only ${qs.length} fact questions`);
    for (const q of qs) {
      checkOwn(q, band, `${q.id} "${q.prompt.slice(0, 40)}"`);
      check(q.id.includes(v.id === "varicella" ? "vari" : v.id), () => `${q.id}: id should name its virus`);
    }
  }
}
// The antibiotic fact check: no right answer or explanation ever says antibiotics work on a virus.
const VIRUS_WORD = /virus|viral|cold|flu\b|influenza|covid|measles|chickenpox|norovirus|rhinovirus/i;
const NEGATION = /n't|\bnot\b|\bno\b|\bnever\b|\bonly (work )?on bacteria|\bcan't\b|\bcannot\b|\bwon't\b|\bneither\b|\black\b/i;
let antibioticItems = 0;
for (const q of [...ALL_HEALTH, ...ALL_VIRUS_QUESTIONS]) {
  const right = q.choices[q.answer];
  for (const sentence of `${right}. ${q.explanation}`.split(/(?<=[.!?])\s+/)) {
    if (/antibiotic/i.test(sentence) && VIRUS_WORD.test(sentence)) {
      check(NEGATION.test(sentence), () => `${q.id}: "${sentence}" seems to say antibiotics work on a virus`);
    }
  }
  if (VIRUS_WORD.test(q.prompt) && !/bacteri/i.test(q.prompt)) check(!/^antibiotic/i.test(right), () => `${q.id}: the right answer to a virus question is "${right}"`);
  if (/antibiotic/i.test(`${q.prompt} ${q.explanation}`)) antibioticItems++;
}
for (const band of ["g35", "g68", "hs"] as Band[]) {
  const all = [...HEALTH[band], ...VIRUSES.flatMap((v) => VIRUS_QUESTIONS[v.id][band])];
  check(all.some((q) => /antibiotic/i.test(q.prompt) && /virus/i.test(q.explanation)), () => `${band}: should teach that antibiotics don't work on viruses`);
}
check(antibioticItems >= 10, () => `only ${antibioticItems} antibiotic items`);
// Norovirus: every band teaches soap and water; no item recommends sanitizer for it.
for (const band of BANDS) {
  check(VIRUS_QUESTIONS.noro[band].some((q) => /soap|wash/i.test(`${q.choices[0]} ${q.explanation}`)), () => `${band}: norovirus handwashing`);
}
for (const q of ALL_VIRUS_QUESTIONS.filter((x) => x.id.startsWith("gf-noro"))) check(!/sanitizer/i.test(q.choices[0]) || /poor|not|only/i.test(q.choices[0]), () => `${q.id}: never say sanitizer is the fix for norovirus`);
// Measles items mention MMR; flu items mention the yearly vaccine; rhinovirus items never offer a cold vaccine as right.
check(ALL_VIRUS_QUESTIONS.some((q) => q.id.includes("measles") && /MMR/.test(`${q.prompt} ${q.choices[0]}`)), () => "measles items teach MMR");
check(ALL_VIRUS_QUESTIONS.some((q) => q.id.includes("flu") && /every year/i.test(`${q.choices[0]} ${q.explanation}`)), () => "flu items teach the yearly vaccine");
check(!ALL_VIRUS_QUESTIONS.some((q) => q.id.includes("rhino") && /vaccine/i.test(q.choices[0]) && !/no|over 100/i.test(q.choices[0])), () => "no right answer offers a cold vaccine");
// No leftover robot words anywhere in the game's own source (the kit is shared and excluded).
{
  const files: string[] = [];
  const walk = (dir: string) => {
    for (const f of readdirSync(dir)) {
      const p = join(dir, f);
      if (statSync(p).isDirectory()) { if (f !== "kit") walk(p); } else files.push(p);
    }
  };
  const root = new URL("..", import.meta.url).pathname;
  walk(join(root, "src"));
  files.push(join(root, "index.html"), join(root, "README.md"), join(root, "public", "favicon.svg"));
  for (const f of files) {
    const text = readFileSync(f, "utf8");
    const bad = text.match(/robo|reboot|rivet|quiz bot|lord static|citadel|mini-bot|t-cell[ -]squad/i);
    check(!bad, () => `${f}: leftover "${bad?.[0]}"`);
  }
}

/* ------------------------------------------------------------ 3. every zone and virus, every grade */

type Written = Exclude<Subject, "math">;
const BANK: Record<Written, Partial<Record<Grade, Question[]>>> = { science: {}, ela: {}, social: {} };
for (const s of Object.keys(BANK) as Written[]) {
  for (const g of GRADES) BANK[s][g] = ((await import(`../src/kit/banks/${s}/g${g}.ts`)) as { default: Question[] }).default;
}
const catalog = new FocusCatalog((s, g) => BANK[s][g] ?? []);

const MODES: FocusChoice[] = [DEFAULT_FOCUS, MIXED, { subject: "science", topic: "all" }, { subject: "math", topic: "all" }, { subject: "ela", topic: "all" }, { subject: "social", topic: "all" }];
let draws = 0;
for (const g of GRADES) {
  const avail = catalog.available(g);
  const sampleTopics: FocusChoice[] = (["earth", "fractions", "grammar", "history"] as FocusTopicId[])
    .filter((t) => avail.includes(t))
    .map((t) => ({ subject: focusTopic(t).subject, topic: t }));
  for (const mode of [...MODES, ...sampleTopics]) {
    const qs = new GermQuestions(g, mode, catalog, { adaptive: false });
    const subjects = new Set<Subject>();
    for (const z of ZONES) {
      const res = resolveZone(z, g, mode, catalog);
      const prompts = new Set<string>();
      let healthSeen = 0;
      const N = 10;
      for (let i = 0; i < N; i++) {
        const q = qs.draw(z.id);
        draws++;
        subjects.add(q.subject);
        const where = `${g} ${JSON.stringify(mode)} ${z.id} ${q.id} "${q.prompt.slice(0, 40)}"`;
        checkShape(q, where);
        check(!q.passage, () => `${where}: no passages`);
        check(matchesSource(q, res), () => `${where}: ${q.subject} ${q.standard} is not from ${JSON.stringify(res)}`);
        if (isHealthItem(q)) {
          healthSeen++;
          check(bandOf(q.grade) === bandOf(g), () => `${where}: health item from another band`);
          check(!ALL_VIRUS_QUESTIONS.some((v) => v.id === q.id), () => `${where}: virus fact questions are saved for the Major Viruses`);
        }
        if (mode.subject === "mixed") check((i % 2 === 1) === (q.subject === z.partner) || (z.partner !== "math" && q.subject === "science" && i % 2 === 0), () => `${where}: MIXED alternates health and ${z.partner}`);
        const d = dealQuestion(q);
        check(d.choices[d.answer] === q.choices[q.answer] && new Set(d.choices).size === 4, () => `${where}: dealing lost the answer`);
        prompts.add(q.prompt);
      }
      check(prompts.size >= 5, () => `${g} ${JSON.stringify(mode)} ${z.id}: only ${prompts.size} different questions in ${N}`);
      const isDefault = JSON.stringify(mode) === JSON.stringify(DEFAULT_FOCUS);
      if (healthMode(mode)) check(healthSeen >= (isDefault ? 4 : 1), () => `${g} ${JSON.stringify(mode)} ${z.id}: only ${healthSeen} health items in ${N}`);
      else check(healthSeen === 0 && res.subject === (mode as { subject: Subject }).subject, () => `${g} ${JSON.stringify(mode)} ${z.id}: asks ${res.subject}, ${healthSeen} health items`);
    }
    if (mode.subject === "mixed") check(subjects.size === 4, () => `MIXED ${g}: all four subjects should appear (${[...subjects]})`);
    if (JSON.stringify(mode) === JSON.stringify(DEFAULT_FOCUS)) check([...subjects].join() === "science", () => `default ${g}: only science (${[...subjects]})`);
    // The Major Viruses: their own facts first in the health modes, the chosen subject otherwise.
    for (const v of VIRUSES) {
      const res = resolveVirus(v.id, g, mode, catalog);
      const own = VIRUS_QUESTIONS[v.id][bandOf(g)];
      for (let i = 0; i < 7; i++) {
        const q = qs.draw(v.id);
        draws++;
        const where = `${g} ${JSON.stringify(mode)} ${v.id} #${i} ${q.id}`;
        checkShape(q, where);
        if (healthMode(mode)) {
          if (i < own.length) check(own.some((o) => o.id === q.id), () => `${where}: should ask its own virus facts first`);
          else check(isHealthItem(q) || (q.subject === "science" && (res.topic === "all" || matchesSource(q, res))), () => `${where}: fallback should be health/science`);
        } else check(matchesPlain(q, res), () => `${where}: off-source ${q.subject} ${q.standard}`);
      }
    }
  }
}

/* ------------------------------------------------------------ 4. boss rules */

for (const band of BANDS) {
  for (const hp of [bossHp(band), virusHp(band), virusHp(band, true)]) {
    const f = newFight(hp);
    for (let i = 0; i < 10; i++) {
      const r = applyAnswer(f, false);
      check(r.damage === 0 && !r.defeated && f.hp === f.maxHp, () => `${band}: a wrong answer changed HP`);
    }
    let hits = 0;
    while (f.hp > 0 && hits < 20) {
      applyAnswer(f, true);
      hits++;
    }
    check(hits === hp && f.hp === 0, () => `${band}: right answers should deplete HP ${hp} in ${hp} hits`);
  }
  const w = newFight(bossHp(band));
  w.weakReady = true;
  const r1 = applyAnswer(w, false);
  check(r1.damage === 0 && w.weakReady, () => `${band}: a wrong answer keeps the weak-spot bonus waiting`);
  const r2 = applyAnswer(w, true);
  check(r2.damage === 2 && r2.weakness && !w.weakReady && w.hp === w.maxHp - 2, () => `${band}: weak spot should double the next right answer`);
  check(bossHp(band) >= 3 && bossHp(band) <= 5 && virusHp(band) >= 2 && virusHp(band, true) === virusHp(band) + 1, () => `${band}: HP values`);
}
check(bossHp("k2") < bossHp("g68") && virusHp("k2") < virusHp("hs") && panelHits("k2") < panelHits("g68") && panelTimeout("k2") < panelTimeout("g68"), () => "K-2 bosses gentler");

/* ------------------------------------------------------------ 5. stages, splitting bacteria and the bot */

const STAGES: StageId[] = [...ZONE_IDS, "rush"];
for (const band of BANDS) {
  for (const id of STAGES) {
    const L = buildLevel(id, band);
    const rush = id === "rush";
    check(!!L.gate && L.gate.power === gatePowerFor(id), () => `${id} ${band}: infected cell`);
    check(L.width === L.arenaX + ARENA_W, () => `${id} ${band}: arena`);
    if (rush) check(L.arenaX >= 2000 && L.arenaX <= 3400, () => `rush ${band}: the Lymph Node run is ${L.arenaX} long (want a short run before six bosses)`);
    else if (band === "k2") check(L.arenaX >= 3500, () => `${id} k2: stage only ${L.arenaX} long`);
    else check(L.arenaX >= 3600 && L.arenaX <= 5200, () => `${id} ${band}: stage length ${L.arenaX}`);
    check(L.checkpoints.length >= (rush ? 5 : 7), () => `${id} ${band}: ${L.checkpoints.length} checkpoints`);
    const xs = [L.start.x, ...L.checkpoints.map((c) => c.x), L.arenaX];
    const longest = Math.max(...xs.slice(1).map((x, i) => x - xs[i]));
    check(longest <= 1100, () => `${id} ${band}: ${longest}px between checkpoints`);
    check(L.restX > L.arenaX * 0.3 && L.restX < L.arenaX * 0.7 && L.checkpoints.some((c) => c.x === L.restX), () => `${id} ${band}: rest stop at ${L.restX}`);
    check(L.items.filter((it) => it.kind === "cell").length >= 3 && L.items.some((it) => it.kind === "boost") && L.skyLedges.length >= 1, () => `${id} ${band}: cells, hidden capsule, sky ledge`);
    check(L.movers.length >= 1 && L.pulses.length >= 2 && L.enemies.length >= (band === "k2" ? 3 : 6), () => `${id} ${band}: movers, hazards and germs`);
    check(L.clues.length === CLUES_PER_STAGE, () => `${id} ${band}: ${L.clues.length} Antigen Clues`);
    const barriers = L.solids.filter((sd) => sd.kind === "barrier");
    check(barriers.length === CLUES_PER_STAGE, () => `${id} ${band}: ${barriers.length} barriers`);
    L.clues.forEach((q, i) => {
      const b = barriers.find((sd) => sd.qb === i);
      check(!!b && b.x === q.barrierX && q.x < b.x && b.x + b.w < L.arenaX - 16 && b.y < -200, () => `${id} ${band}: clue ${i} barrier`);
      check(q.x > L.restX && q.x > L.arenaX / 2, () => `${id} ${band}: clue ${i} at ${q.x} should be in the second half`);
      if (i > 0) check(q.x - L.clues[i - 1].x > 300, () => `${id} ${band}: clues ${i - 1} and ${i} too close`);
    });
    for (const e of L.enemies) check(["rod", "cocci", "virus", "spiral"].includes(e.kind), () => `${id}: germ kind ${e.kind}`);
  }
}
check(tuningFor("k2").gapScale < tuningFor("g68").gapScale && tuningFor("k2").enemyEvery > 1, () => "K-2 levels are gentler");
check(startLives("k2") > startLives("g68") && bumpDamage("k2") < bumpDamage("g68"), () => "K-2 gets more lives and softer bumps");
check(splitFrames("k2") > splitFrames("g68"), () => "K-2 bacteria split more slowly");

// K-2 pits cost energy, not a life; older grades lose a life.
for (const band of ["k2", "g68"] as Band[]) {
  const sim = new Sim(buildLevel("blood", band), band);
  const grounds = sim.level.solids.filter((s) => s.kind === "ground").sort((a, b) => a.x - b.x);
  const gap = grounds.find((s, i) => i > 0 && s.x > grounds[i - 1].x + grounds[i - 1].w)!;
  const prev = grounds[grounds.indexOf(gap) - 1];
  for (let i = 0; i < 30; i++) sim.step({ ...NO_INPUT, right: true });
  sim.s.p.x = prev.x + prev.w + 4;
  sim.s.p.y = 170;
  sim.s.p.vy = 2;
  for (let i = 0; i < 80 && sim.s.mode === "play"; i++) sim.step(NO_INPUT);
  if (band === "k2") check(sim.s.lives === startLives(band) && sim.s.energy === MAX_ENERGY - 4 && sim.s.mode === "play", () => `K-2 pit: lives ${sim.s.lives} energy ${sim.s.energy}`);
  else check(sim.s.lives === startLives(band) - 1, () => `${band} pit should cost a life (lives ${sim.s.lives})`);
}

/** A sim with the hero standing on flat ground at x (germs cleared unless kept). */
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

// Binary fission: a rod bacterium left alone splits into two once; the copy never splits; a respawn clears copies.
for (const band of ["k2", "g68"] as Band[]) {
  const sim = standAt("nose", 60, band);
  const rodX = 150;
  sim.s.enemies = [{ kind: "rod", x: rodX, y: sim.s.p.y + 8, w: 14, h: 12, vx: 0, vy: 0, hp: 1, dead: false, t: 0, dir: -1, sx: rodX, sy: sim.s.p.y + 8, flash: 0 }];
  sim.s.p.inv = 1e9;
  let first = -1;
  for (let i = 0; i < splitFrames(band) + 600; i++) {
    sim.step(NO_INPUT);
    if (first < 0 && sim.s.enemies.length > 1) first = i;
  }
  check(first >= splitFrames(band) - 10 && first <= splitFrames(band) + 10, () => `${band}: the rod should split after about ${splitFrames(band)} frames (split at ${first})`);
  check(sim.s.enemies.length === 2 && sim.s.splits === 1 && sim.s.enemies.filter((e) => e.child).length === 1, () => `${band}: exactly one split (${sim.s.enemies.length} germs, ${sim.s.splits} splits)`);
  sim.s.mode = "respawn";
  sim.s.modeT = 49;
  sim.step(NO_INPUT);
  check(sim.s.enemies.length === 1 && !sim.s.enemies[0].child, () => `${band}: a respawn clears the copies`);
}
// Hit early with granules, a rod never gets to split.
{
  const sim = standAt("nose", 60);
  sim.s.enemies = [{ kind: "rod", x: 110, y: sim.s.p.y + 8, w: 14, h: 12, vx: 0, vy: 0, hp: 1, dead: false, t: 0, dir: -1, sx: 110, sy: sim.s.p.y + 8, flash: 0 }];
  for (let i = 0; i < 40; i++) sim.step({ ...NO_INPUT, shoot: i % 9 === 0 });
  for (let i = 0; i < splitFrames("g68") + 60; i++) sim.step(NO_INPUT);
  check(sim.s.enemies[0].dead && sim.s.splits === 0, () => "a rod popped early with granules poofs and never splits");
}

// The bot plays every zone and the whole Major Virus rush in every band, answering some questions wrong,
// with a real question drawn for every antigen panel (from the right zone or virus).
const botGrades: Record<Band, Grade> = { k2: "1", g35: "4", g68: "7", hs: "10" };
let botFrames = 0;
let botClues = 0;
for (const band of BANDS) {
  const g = botGrades[band];
  const qs = new GermQuestions(g, DEFAULT_FOCUS, catalog, { adaptive: false });
  for (const id of STAGES) {
    const sim = new Sim(buildLevel(id, band), band, []);
    const res = playStage(sim, {
      answerRight: (n) => n % 3 !== 1,
      onQuestion: (_n, boss) => {
        const q = qs.draw(boss as VirusId);
        checkShape(q, `bot ${band} ${id} ${boss} ${q.id}`);
        if (id === "rush") check(VIRUS_QUESTIONS[boss as VirusId][band].some((o) => o.id === q.id) || isHealthItem(q) || q.subject === "science", () => `${band} rush ${boss}: question ${q.id}`);
      },
      onClue: () => checkShape(qs.draw(id === "rush" ? sim.bossKey : id), `bot ${band} ${id} clue`),
    });
    botFrames += res.frames;
    check(res.cleared, () => `bot could not clear ${id} in ${band}: ${res.reason}`);
    check(res.wrong >= 1, () => `${id} ${band}: the bot should have tried a wrong answer`);
    for (const a of res.answers) {
      if (!a.correct) check(a.hpAfter === a.hpBefore && a.livesAfter === a.livesBefore && a.energyAfter === a.energyBefore, () => `${id} ${band}: a wrong answer changed HP/lives/energy`);
      else check(a.hpAfter < a.hpBefore, () => `${id} ${band}: a right answer did not deplete HP`);
    }
    const wantHp = id === "rush" ? VIRUSES.reduce((n, v, i) => n + virusHp(band, i === VIRUSES.length - 1), 0) : bossHp(band);
    check(res.questions - res.wrong === wantHp, () => `${id} ${band}: ${res.questions - res.wrong} right answers for HP ${wantHp}`);
    check(res.bosses.join() === (id === "rush" ? VIRUS_IDS.join() : id), () => `${id} ${band}: bosses beaten ${res.bosses}`);
    if (id === "rush") check(sim.s.rushBeaten.join() === VIRUS_IDS.join() && sim.s.rushIdx === VIRUSES.length - 1, () => `rush ${band}: all six viruses identified in order`);
    check(res.clues.length === CLUES_PER_STAGE && res.cluesBeforeBoss === CLUES_PER_STAGE, () => `${id} ${band}: the bot answered ${res.clues.length} clues (${res.cluesBeforeBoss} before the boss)`);
    for (const q of res.clues) {
      check(q.livesAfter === q.livesBefore && q.energyAfter >= q.energyBefore && q.powerAfter >= q.powerBefore, () => `${id} ${band}: a clue answer took something`);
      check(q.energyAfter === Math.min(MAX_ENERGY, q.energyBefore + q.reward.energy), () => `${id} ${band}: clue energy reward not applied`);
      check(q.correct ? q.reward.energy >= 10 : q.reward.energy > 0 && q.reward.energy < 10, () => `${id} ${band}: clue reward size`);
    }
    const firstRight = res.clues.find((q) => q.correct)!;
    check(!!firstRight.reward.boost || res.clues.slice(0, res.clues.indexOf(firstRight)).some((q) => !!q.reward.boost), () => `${id} ${band}: first right clue answer should give a power-up`);
    botClues += res.clues.length;
  }
}
// Mostly wrong answers: still won, and no life lost to answers (a stage germ and the whole rush).
for (const id of ["throat", "rush"] as StageId[]) {
  const sim = new Sim(buildLevel(id, "g68"), "g68", []);
  const res = playStage(sim, { skipToBoss: true, answerRight: (n) => n % 4 === 3 });
  check(res.cleared && res.wrong >= 3 * bossHp("g68"), () => `${id}: a mostly-wrong fight should still be won (${res.reason})`);
}
// A rush retry starts at the virus the player reached.
{
  const sim = new Sim(buildLevel("rush", "g35"), "g35", [], undefined, 3);
  const res = playStage(sim, { skipToBoss: true });
  check(res.cleared && res.bosses.join() === "varicella,measles,corona", () => `rush from virus 4: ${res.bosses} ${res.reason}`);
  // Losing a life in the rush keeps the current virus.
  const s2 = new Sim(buildLevel("rush", "g68"), "g68", []);
  s2.warpToBoss(2);
  for (let i = 0; i < 101; i++) s2.step(NO_INPUT);
  s2.s.mode = "respawn";
  s2.s.modeT = 49;
  s2.s.lives = 2;
  s2.step(NO_INPUT);
  check(s2.s.mode === "boss" && s2.bossKey === "noro", () => `a respawn in the rush keeps the current virus (${s2.bossKey}, ${s2.s.mode})`);
}

/* ------------------------------------------------------------ 6. immune skills */

function freshSim(id: StageId, powers: PowerId[], band: Band = "g68"): Sim {
  const sim = new Sim(buildLevel(id, band), band, powers);
  for (let i = 0; i < 20; i++) sim.step(NO_INPUT);
  return sim;
}
const press = (sim: Sim, inp: Partial<Input>) => sim.step({ ...NO_INPUT, ...inp });
{
  const none = freshSim("nose", []);
  check(none.selectedPower === null && !none.usePower(), () => "no skills: X does nothing");
  const all = freshSim("nose", [...POWER_IDS]);
  for (let i = 0; i < POWER_IDS.length; i++) {
    check(all.selectedPower === POWER_IDS[i], () => `cycle order at ${i}`);
    press(all, { cycle: true });
  }
  check(all.selectedPower === POWER_IDS[0], () => "cycling wraps around");

  const ac = freshSim("stomach", ["acid"]);
  press(ac, { power: true });
  check(ac.s.shots.filter((x) => x.from === "hero").length === 3 && ac.s.power === POWER_MAX - POWERS.acid.cost, () => "Acid Spray fires three granules");
  check(ac.s.shots.filter((x) => x.from === "hero").every((x) => x.kind === "acidGranule" && x.w === 6 && x.h === 4), () => "Acid Spray shots are acid granules with the same hitbox");
  {
    const g = freshSim("nose", []);
    press(g, { shoot: true });
    const shot = g.s.shots.find((x) => x.from === "hero");
    check(!!shot && shot.kind === "granule" && shot.w === 6 && shot.h === 4 && Math.abs(shot.vx) === 4.5, () => `Z launches a granule (${JSON.stringify(shot)})`);
  }

  const vv = freshSim("gut", ["villi"]);
  const plain = freshSim("gut", []);
  press(vv, { power: true });
  press(plain, { jump: true });
  let peakV = 999;
  let peakP = 999;
  for (let i = 0; i < 40; i++) {
    press(vv, {});
    press(plain, { jump: true });
    peakV = Math.min(peakV, vv.s.p.y);
    peakP = Math.min(peakP, plain.s.p.y);
  }
  check(peakV < peakP - 30, () => `Villi Vault should jump much higher (${peakV} vs ${peakP})`);

  const pp = freshSim("skin", ["platelet"]);
  press(pp, { power: true });
  const e0 = pp.s.energy;
  pp.s.shots.push({ x: pp.s.p.x, y: pp.s.p.y + 4, w: 8, h: 8, vx: 0, vy: 0, grav: 0, life: 60, from: "foe", kind: "toxin", delay: 0, floor: "none" });
  press(pp, {});
  check(pp.s.energy === e0 && pp.s.p.shieldT > 0, () => "Platelet Patch blocks shots");

  const cd = freshSim("throat", ["cough"]);
  const walk = freshSim("throat", []);
  const x0 = cd.s.p.x;
  press(cd, { power: true });
  for (let i = 0; i < 20; i++) {
    press(cd, {});
    press(walk, { right: true });
  }
  check(cd.s.p.x - x0 > walk.s.p.x - x0 + 30, () => "Cough Dash goes farther than walking");

  const br = freshSim("lungs", ["breath"]);
  check(!br.usePower(), () => "Breath Bounce needs the air");
  press(br, { jump: true });
  for (let i = 0; i < 10; i++) press(br, { jump: true });
  const vyBefore = br.s.p.vy;
  press(br, { jump: true, power: true });
  check(br.s.p.airJumped && br.s.p.vy < vyBefore - 2, () => "Breath Bounce jumps again in mid-air");

  const sn = freshSim("nose", ["sneeze"]);
  const onScreen = () => sn.s.enemies.filter((e) => !e.dead && e.x + e.w > sn.s.camX && e.x < sn.s.camX + 320).length;
  sn.s.p.x = 380;
  for (let i = 0; i < 10; i++) press(sn, {});
  const before = onScreen();
  press(sn, { power: true });
  check(before > 0 && onScreen() === 0, () => `Sneeze Blast should poof the germs on screen (${before} -> ${onScreen()})`);

  const pf = freshSim("blood", ["plasma"]);
  const fall = freshSim("blood", []);
  for (const s of [pf, fall]) {
    s.s.p.y -= 60;
    s.s.p.onGround = false;
  }
  press(pf, { power: true });
  for (let i = 0; i < 30; i++) {
    press(pf, {});
    press(fall, {});
  }
  check(pf.s.p.y < fall.s.p.y - 20, () => "Plasma Float falls slower");

  const sl = freshSim("mouth", ["saliva"]);
  press(sl, { power: true });
  const wt0 = sl.s.wt;
  for (let i = 0; i < 10; i++) press(sl, {});
  check(sl.s.slowT > 0 && sl.s.wt - wt0 < 6, () => "Saliva Slow-Mo slows the world clock");
}
// Infected cells open only to their skill, and the thankful cell gives a 1-up.
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
    if (s.selectedPower === "breath" || s.selectedPower === "plasma") {
      s.s.p.onGround = false;
      s.s.p.coyote = 0;
      s.s.p.y -= 20;
    }
    s.usePower();
  }
  check(!wrong.s.gateOpen && right.s.gateOpen, () => `${id}: the infected cell should open only to ${want}`);
  const lives = right.s.lives;
  right.s.p.x = L.gate!.x + 4;
  right.s.p.y = L.gate!.y - PH;
  right.s.p.dashT = 0;
  right.s.p.vx = 0;
  for (let i = 0; i < 3; i++) right.step(NO_INPUT);
  check(right.s.capsule && right.s.lives === lives + 1, () => `${id}: the healed cell should give a 1-up`);
}
// The weak-spot skill during a stage fight doubles the next right answer; any skill works on a Major Virus.
for (const z of ZONES) {
  const sim = new Sim(buildLevel(z.id, "g35"), "g35", [z.weakness]);
  sim.warpToBoss();
  for (let i = 0; i < 101; i++) sim.step(NO_INPUT);
  sim.s.p.onGround = true;
  sim.s.p.airJumped = false;
  if (z.weakness === "breath" || z.weakness === "plasma") {
    sim.s.p.onGround = false;
    sim.s.p.y -= 30;
  }
  sim.s.power = POWER_MAX;
  sim.usePower();
  check(!!sim.s.fight?.weakReady, () => `${z.id}: using ${z.weakness} should ready the weak spot`);
  sim.forceQuestion();
  const hp = sim.s.fight!.hp;
  const res = sim.answer(true);
  check(res.damage === 2 && sim.s.fight!.hp === hp - 2, () => `${z.id}: weak-spot answer should deal 2`);
}

/* ------------------------------------------------------------ 7. power-ups and Antigen Clues */

for (const band of BANDS) {
  check(boostChance(true, band) >= 0.5 && boostChance(false, band) <= 0.2, () => `${band}: power-ups weighted to right answers`);
  const right = clueReward(true, band, 0.99, 0.2, true);
  const wrong = clueReward(false, band, 0.99, 0.2, true);
  check(right.energy >= 10 && right.power > 0 && right.boost === null, () => `${band}: right reward`);
  check(wrong.energy > 0 && wrong.energy < right.energy && wrong.power === 0 && wrong.boost === null, () => `${band}: wrong reward`);
  check(clueReward(true, band, 0.99, 0.5, false).boost !== null, () => `${band}: first right answer always gives a power-up`);
}
check(new Set(Array.from({ length: 60 }, (_, i) => boostFromRoll(i / 60))).size === BOOST_IDS.length, () => "every power-up can be rolled");
for (const id of BOOST_IDS) {
  const B = BOOSTS[id];
  check(B.frames >= 5 * 60 && B.frames <= 20 * 60 && B.name.length > 3 && B.desc.length > 8 && B.science.length > 20, () => `${id}: power-up data`);
  check(!Object.values(POWERS).some((p) => p.name === B.name), () => `${id}: name clashes with an immune skill`);
}
// A clue in the sim: zapping it opens a question; the barrier blocks until answered; wrong costs nothing.
for (const band of BANDS) {
  for (const right of [true, false]) {
    const L = buildLevel("nose", band);
    const q = L.clues[0];
    const sim = standAt("nose", q.x - 90, band);
    sim.s.energy = 8;
    sim.s.power = 10;
    for (let i = 0; i < 120; i++) sim.step({ ...NO_INPUT, right: true });
    check(sim.s.p.x + PW <= q.barrierX + 0.01 && sim.s.mode === "play", () => `${band}: the biofilm barrier should block`);
    for (let i = 0; i < 40 && sim.s.mode === "play"; i++) sim.step({ ...NO_INPUT, shoot: i % 9 === 0 });
    check(sim.s.mode === "quiz" && sim.s.ask === 0, () => `${band}: zapping a clue opens its question`);
    const before = { e: sim.s.energy, p: sim.s.power, l: sim.s.lives };
    const res = sim.answer(right);
    check(!!res.reward && res.damage === 0 && sim.s.clueDone[0] && sim.s.cluesRight === (right ? 1 : 0), () => `${band}: clue bookkeeping`);
    check(sim.s.lives === before.l && sim.s.energy === Math.min(MAX_ENERGY, before.e + res.reward!.energy) && sim.s.power >= before.p, () => `${band} ${right}: clue reward applied, nothing lost`);
    sim.resume();
    for (let i = 0; i < 60; i++) sim.step({ ...NO_INPUT, right: true });
    check(sim.s.p.x > q.barrierX + 12 && !sim.s.fight, () => `${band}: the barrier is gone after the answer, and the boss is untouched`);
  }
}
{
  const id: StageId = "nose";
  const flatX = 60;
  for (const b of BOOST_IDS) {
    const sim = standAt(id, flatX);
    sim.giveBoost(b);
    check(sim.s.boosts[b] === BOOSTS[b].frames, () => `${b}: starts at its full duration`);
    for (let i = 0; i < 100; i++) sim.step(NO_INPUT);
    sim.giveBoost(b);
    check(sim.s.boosts[b] === BOOSTS[b].frames, () => `${b}: picking it again refreshes the timer`);
    for (let i = 0; i < BOOSTS[b].frames; i++) sim.step(NO_INPUT);
    check(sim.s.boosts[b] === 0, () => `${b}: ends after ${BOOSTS[b].frames / 60} s`);
  }
  check(BOOSTS.membrane.frames === 8 * 60 && BOOSTS.leap.frames === 10 * 60 && BOOSTS.vaccine.frames === 20 * 60 && BOOSTS.fever.frames === 10 * 60 && BOOSTS.antibody.frames === 10 * 60 && BOOSTS.mucus.frames === 12 * 60, () => "power-up durations");
  const zap = (sim: Sim) => sim.s.shots.push({ x: sim.s.p.x, y: sim.s.p.y + 4, w: 8, h: 8, vx: 0, vy: 0, grav: 0, life: 60, from: "foe", kind: "toxin", delay: 0, floor: "none" });
  // Phase Through Membrane: germs and shots pass through; spikes and pits still count.
  {
    const sim = standAt(id, flatX);
    sim.giveBoost("membrane");
    const e0 = sim.s.energy;
    sim.s.enemies = [{ kind: "virus", x: sim.s.p.x, y: sim.s.p.y + 8, w: 14, h: 10, vx: 0, vy: 0, hp: 1, dead: false, t: 0, dir: -1, sx: sim.s.p.x, sy: sim.s.p.y + 8, flash: 0 }];
    for (let i = 0; i < 5; i++) {
      zap(sim);
      sim.step(NO_INPUT);
    }
    check(sim.s.energy === e0 && sim.s.hurts === 0, () => "Phase Through Membrane: germs and shots pass through");
    const sp = buildLevel(id, "g68").spikes[0];
    const spk = standAt(id, flatX);
    spk.giveBoost("membrane");
    spk.s.p.x = sp.x + 30;
    spk.s.p.y = sp.y + sp.h - PH;
    spk.step(NO_INPUT);
    check(spk.s.hurts === 1, () => "Phase Through Membrane does not protect from hazards");
    const pit = standAt(id, flatX, "g68");
    pit.giveBoost("membrane");
    pit.s.p.y = 240;
    pit.s.p.vy = 3;
    pit.step(NO_INPUT);
    check(pit.s.lives === startLives("g68") - 1, () => "Phase Through Membrane does not save you from pits");
  }
  // Vaccine Memory: blocks exactly one bump.
  {
    const sim = standAt(id, flatX);
    sim.giveBoost("vaccine");
    zap(sim);
    sim.step(NO_INPUT);
    check(sim.s.energy === MAX_ENERGY && sim.s.boosts.vaccine === 0, () => "Vaccine Memory blocks one shot and is used up");
    sim.s.p.inv = 0;
    zap(sim);
    sim.step(NO_INPUT);
    check(sim.s.energy < MAX_ENERGY, () => "the second shot hurts once the memory was used");
  }
  // Mucus Shield: germ shots get stuck (all of them, for its whole time); a germ bump still hurts.
  {
    const sim = standAt(id, flatX);
    sim.giveBoost("mucus");
    for (let i = 0; i < 6; i++) {
      zap(sim);
      sim.step(NO_INPUT);
      sim.s.p.inv = 0;
    }
    check(sim.s.energy === MAX_ENERGY && sim.s.stuck === 6 && !sim.s.shots.some((x) => x.from === "foe"), () => `Mucus Shield catches every shot (stuck ${sim.s.stuck}, energy ${sim.s.energy})`);
    sim.s.enemies = [{ kind: "rod", x: sim.s.p.x, y: sim.s.p.y + 8, w: 14, h: 12, vx: 0, vy: 0, hp: 1, dead: false, t: 0, dir: -1, sx: sim.s.p.x, sy: sim.s.p.y + 8, flash: 0 }];
    sim.step(NO_INPUT);
    check(sim.s.energy < MAX_ENERGY, () => "Mucus Shield does not stop a bump");
    const plainSim = standAt(id, flatX);
    zap(plainSim);
    plainSim.step(NO_INPUT);
    check(plainSim.s.energy < MAX_ENERGY, () => "without a shield a shot hurts");
  }
  // Lymph Leap: much higher jump; reaches every sky ledge, which a normal jump cannot.
  {
    const peak = (leap: boolean) => {
      const sim = standAt(id, flatX);
      if (leap) sim.giveBoost("leap");
      const y0 = sim.s.p.y;
      let top = y0;
      for (let i = 0; i < 60; i++) {
        sim.step({ ...NO_INPUT, jump: true });
        top = Math.min(top, sim.s.p.y);
      }
      return y0 - top;
    };
    const hn = peak(false);
    const hl = peak(true);
    check(hl > hn + 35 && hl < 130 && LEAP_JUMP_V < JUMP_V, () => `Lymph Leap jump ${hl.toFixed(1)} vs normal ${hn.toFixed(1)}`);
    for (const sid of STAGES) {
      for (const band of ["k2", "g68"] as Band[]) {
        const L = buildLevel(sid, band);
        const ledge = L.skyLedges[0];
        const reach = (leap: boolean) => {
          const sim = standAt(sid, ledge.x - 30, band);
          if (leap) sim.giveBoost("leap");
          for (let i = 0; i < 90; i++) sim.step({ ...NO_INPUT, jump: true, right: i > 2 && i < 40 });
          for (let i = 0; i < 30; i++) sim.step(NO_INPUT);
          return Math.abs(sim.s.p.y + PH - ledge.y) < 0.5 && sim.s.p.onGround;
        };
        check(reach(true), () => `${sid} ${band}: Lymph Leap should reach the sky ledge`);
        check(!reach(false), () => `${sid} ${band}: a normal jump should not reach the sky ledge`);
      }
    }
  }
  // Fever Boost: faster run.
  {
    const a = standAt(id, flatX);
    const b = standAt(id, flatX);
    b.giveBoost("fever");
    const x0 = a.s.p.x;
    for (let i = 0; i < 30; i++) {
      a.step({ ...NO_INPUT, right: true });
      b.step({ ...NO_INPUT, right: true });
    }
    check(Math.abs((b.s.p.x - x0) - (a.s.p.x - x0) * FEVER) < 2 && a.s.p.x - x0 > RUN * 25, () => `Fever Boost ${b.s.p.x - x0} vs ${a.s.p.x - x0}`);
  }
  // Antibody Burst: more shots in the same time.
  {
    const count = (on: boolean) => {
      const sim = standAt(id, flatX);
      if (on) sim.giveBoost("antibody");
      let n = 0;
      for (let i = 0; i < 60; i++) {
        const before = sim.s.shots.filter((x) => x.from === "hero").length;
        sim.step({ ...NO_INPUT, shoot: true });
        if (sim.s.shots.filter((x) => x.from === "hero").length > before) n++;
      }
      return n;
    };
    check(count(true) >= count(false) * 1.6, () => "Antibody Burst fires faster");
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
  }
  // Power-ups never skip the boss quiz, and they end on a respawn.
  {
    const sim = new Sim(buildLevel("mouth", "g68"), "g68", []);
    sim.warpToBoss();
    for (const b of BOOST_IDS) sim.giveBoost(b);
    for (let i = 0; i < 400; i++) sim.step({ ...NO_INPUT, shoot: i % 5 === 0 });
    check(!!sim.s.fight && sim.s.fight.hp === sim.s.fight.maxHp, () => "power-ups never lower boss HP");
    sim.s.mode = "respawn";
    sim.s.modeT = 49;
    sim.step(NO_INPUT);
    check(BOOST_IDS.every((b) => sim.s.boosts[b] === 0), () => "power-ups end when Cyto respawns");
  }
}

/* ------------------------------------------------------------ 8. save */

{
  store.clear();
  check(SAVE_KEY.startsWith("arcade.germ-fighters.") && SUBJECT_KEY.startsWith("arcade.germ-fighters.") && TOPIC_KEY.startsWith("arcade.germ-fighters."), () => "storage keys");
  let s = loadSave();
  check(s.beaten.length === 0 && s.viruses.length === 0 && !s.rush && !rushOpen(s), () => "empty save");
  s = markBeaten(s, "stomach");
  s = markBeaten(s, "nose");
  s = markBeaten(s, "stomach");
  check(s.beaten.join() === "stomach,nose", () => `markBeaten is idempotent and ordered: ${s.beaten}`);
  check(powersOf(s).join() === "acid,sneeze", () => `skills follow the save: ${powersOf(s)}`);
  s = markVirus(markVirus(s, "flu"), "flu");
  check(s.viruses.join() === "flu", () => "virus cards are collected once");
  writeSave(s);
  const back = loadSave();
  check(JSON.stringify(back) === JSON.stringify(s), () => "save round trip");
  check([...store.keys()].every((k) => k.startsWith("arcade.germ-fighters.")), () => `keys: ${[...store.keys()]}`);
  const sim = new Sim(buildLevel("skin", "g35"), "g35", powersOf(back));
  check(sim.s.powers.join() === "acid,sneeze" && sim.selectedPower === "acid", () => "earned skills carry into other zones");
  let all = s;
  for (const id of ZONE_IDS) all = markBeaten(all, id);
  check(rushOpen(all) && !all.rush, () => "the Lymph Node opens after all eight");
  check(markRush(all).rush && !markRush(s).rush, () => "the rush counts only after all eight");
  check(parseSave("not json").beaten.length === 0 && parseSave(JSON.stringify({ beaten: ["nose", "nope", "nose"], viruses: ["flu", "zika", "flu"], rush: true })).beaten.join() === "nose", () => "corrupt saves are cleaned");
  check(parseSave(JSON.stringify({ beaten: ["nose"], viruses: ["flu", "zika"], rush: true })).viruses.join() === "flu" && !parseSave(JSON.stringify({ beaten: ["nose"], rush: true })).rush, () => "virus list cleaned; rush flag needs all eight");
  check(EMPTY_SAVE.beaten.length === 0 && Object.keys(JSON.parse(store.get(SAVE_KEY)!)).sort().join() === "beaten,rush,viruses", () => "save fields");
}

/* ------------------------------------------------------------ 9. subject/topic picker */

{
  check(SUBJECT_CHOICES.map((s) => s.label).join(" · ") === "MATH · SCIENCE · ELA · SOCIAL STUDIES · MIXED", () => "subject row");
  const arcadeIds = ["numbers", "factors", "ratios", "fractions", "algebra", "geometry", "life", "earth", "physical", "reading", "phonics", "grammar", "civics", "history", "geography", "economics"];
  check(FOCUS_TOPICS.map((t) => t.id).join() === arcadeIds.join(), () => "topic ids are the arcade menu's");
  const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);
  store.clear();
  check(same(loadFocus(), { subject: "science", topic: "life" }) && same(DEFAULT_FOCUS, { subject: "science", topic: "life" }), () => "the default is SCIENCE · Life & health");
  check(same(parseStoredFocus("mixed", null), MIXED) && same(parseStoredFocus(null, null), DEFAULT_FOCUS) && same(parseStoredFocus("math", "dragons"), { subject: "math", topic: "all" }), () => "stored parsing");
  for (const g of GRADES) check(validateFocus(DEFAULT_FOCUS, g, catalog).subject === "science", () => `default focus at ${g}`);
  check(same(focusFromUrl("?topic=fractions", "4", catalog).choice, { subject: "math", topic: "fractions" }), () => "?topic=fractions @4");
  const kf = focusFromUrl("?topic=fractions", "K", catalog);
  check(kf.choice === null && kf.unavailable === "fractions", () => "?topic=fractions @K is not offered");
  check(same(focusFromUrl("?topic=life", "7", catalog).choice, { subject: "science", topic: "life" }), () => "?topic=life");
  check(same(focusFromUrl("?subject=math", "8", catalog).choice, { subject: "math", topic: "all" }) && same(focusFromUrl("?subject=mixed", "8", catalog).choice, MIXED), () => "?subject=");
  check(focusFromUrl("?topic=dragons", "8", catalog).choice === null && focusFromUrl("?grade=5", "5", catalog).choice === null, () => "unknown/no topic: keep the saved one");
  saveFocus({ subject: "math", topic: "fractions" });
  check(same(loadFocus(), { subject: "math", topic: "fractions" }), () => "saved choice");
  check(same(refocusSavedForGrade("1", catalog), { subject: "math", topic: "all" }), () => "fractions @1 falls back to ALL MATH");
  saveFocus(MIXED);
  check(same(loadFocus(), MIXED), () => "MIXED is saved");
  for (const g of ["2", "6", "11"] as Grade[]) {
    check(ZONES.every((z) => resolveZone(z, g, { subject: "math", topic: "all" }, catalog).subject === "math"), () => `MATH @${g}: every zone asks math`);
    check(VIRUSES.every((v) => resolveVirus(v.id, g, { subject: "ela", topic: "all" }, catalog).subject === "ela"), () => `ELA @${g}: every virus asks ELA`);
  }
}

// The game's real wiring (kit bankFor via import.meta.glob), through Vite's SSR loader.
{
  const { createServer } = await import("vite");
  const server = await createServer({ configFile: new URL("../vite.config.ts", import.meta.url).pathname, server: { middlewareMode: true, hmr: false }, appType: "custom", logLevel: "error" });
  try {
    const mod = (await server.ssrLoadModule("/src/germs/bank.ts")) as typeof import("../src/germs/bank");
    for (const g of GRADES) check(mod.catalog.available(g).join() === catalog.available(g).join(), () => `real catalog at ${g}`);
  } finally {
    await server.close();
  }
}

const counts = BANDS.map((b) => `${b} ${HEALTH[b].length} health + ${VIRUSES.reduce((n, v) => n + VIRUS_QUESTIONS[v.id][b].length, 0)} virus`).join(", ");
console.log(`${checks} checks, ${failures} failures (${((Date.now() - t0) / 1000).toFixed(1)} s)`);
console.log(`Questions drawn: ${draws}. Own questions: ${counts}. Bot frames played: ${botFrames}. Antigen Clues answered by the bot: ${botClues}.`);
if (failures) {
  console.error(`${failures} check(s) failed`);
  process.exit(1);
}
console.log("All Germ Fighters checks passed.");
