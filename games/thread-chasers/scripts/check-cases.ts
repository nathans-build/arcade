/*
 * Content tests for Thread Chasers (npm test). Validates every case, bead, clue, pin, question and
 * source for every grade band, plus the chase engine's geography:
 *  - beads strictly in date order; bead counts per band
 *  - clue lengths per band (5: 60, 6-8: 100, 9-12: 140); every witness/plaque present at the right level
 *  - every dead end explained; no distractor accidentally correct; built pins/dials well formed
 *  - "near" pins really are near; every place on land (or on the coast for ports)
 *  - NC codes from the allowed set, in the right form, for every grade and case
 *  - every case solvable within the lantern with at least 3 mistakes
 *  - content lint (banned words; sensitive beads have no Knot and no lantern clock)
 *  - every bead cites at least 2 sources that exist in docs/sources.md
 *  - generated questions: 4 unique choices, answer present, no empty text
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { buildDial, buildPins, lineFor } from "@/chase/clues";
import { km, nearCoast, onLand } from "@/chase/geo";
import { PLACE_IDS, place } from "@/chase/places";
import { CASES } from "@/cases";
import { BAND_RULES, beadsFor, casesFor, levels } from "@/game/bands";
import { reweaveQuestions, sourceQuestions, whyQuestions } from "@/game/questions";
import { knotVisible, lanternCost, lanternFor, musicOn } from "@/game/rules";
import { ALLOWED_CODES, codeFor } from "@/game/standards";
import type { Band, Bead, Case, SkillId } from "@/game/types";
import type { Grade, Question } from "@/kit/types";

const errors: string[] = [];
const notes: string[] = [];
const err = (m: string) => errors.push(m);

const BANDS: Band[] = ["b5", "b68", "b912"];
const GRADES_5_12: Grade[] = ["5", "6", "7", "8", "9", "10", "11", "12"];
const bandGrades: Record<Band, Grade[]> = { b5: ["5"], b68: ["6", "7", "8"], b912: ["9", "10", "11", "12"] };
const offered = (c: Case, b: Band) => bandGrades[b].some((g) => c.grades.includes(g));

// ---------- sources ----------
const sourcesMd = fs.readFileSync(path.join(path.dirname(fileURLToPath(import.meta.url)), "../docs/sources.md"), "utf8");
const sourceIds = new Set([...sourcesMd.matchAll(/^- \*\*([a-z0-9-]+)\*\*:/gm)].map((m) => m[1]));

// ---------- places ----------
for (const id of PLACE_IDS) {
  const p = place(id);
  const [lon, lat] = p.at;
  if (p.port ? !nearCoast(lon, lat) : !onLand(lon, lat)) err(`place ${id} (${p.name}) is ${p.port ? "not near any coast" : "not on land"} at ${lon},${lat}`);
}

// ---------- lint ----------
const BANNED: [RegExp, string][] = [
  [/\bdiscovered\b/i, `"discovered" (say "reached")`],
  [/\bsavages?\b/i, `"savage"`],
  [/\bprimitive\b/i, `"primitive"`],
  [/\b(blood|bloody|gore|gory|corpses?|behead\w*|decapitat\w*|mutilat\w*|dismember\w*|tortur\w*|slaughter\w*|massacre\w*|disembowel\w*)\b/i, "gore term"],
  [/\bslaves\b/i, `"slaves" (say "enslaved people")`],
  [/\bnatives\b/i, `"natives" (name the people)`],
];
function lint(where: string, text: string | undefined) {
  if (!text) return;
  for (const [re, what] of BANNED) if (re.test(text)) err(`${where}: banned word ${what}: "${text.slice(0, 80)}"`);
  // "tribe" only right after a nation's name (a capitalised word).
  for (const m of text.matchAll(/(\S+)\s+tribes?\b/gi)) if (!/^[A-Z]/.test(m[1])) err(`${where}: "tribe" without a nation name`);
  if (/\btribes?\b/i.test(text) && /^tribe/i.test(text.trim())) err(`${where}: "tribe" without a nation name`);
  if (/ {2}/.test(text)) err(`${where}: double space`);
  if (text !== text.trim()) err(`${where}: leading/trailing space`);
}

function checkLen(where: string, text: string | undefined, max: number) {
  if (!text) return err(`${where}: missing text`);
  if (text.length > max) err(`${where}: ${text.length} chars > ${max}: "${text}"`);
  lint(where, text);
}

// ---------- cases ----------
const caseIds = new Set<string>();
for (const c of CASES) {
  if (caseIds.has(c.id)) err(`duplicate case id ${c.id}`);
  caseIds.add(c.id);
  const beadIds = new Set<string>();
  for (const b of c.beads) {
    if (beadIds.has(b.id)) err(`${b.id}: duplicate bead id`);
    beadIds.add(b.id);
  }
  lint(`${c.id} woven`, c.woven);
  // strictly in date order
  for (let i = 1; i < c.beads.length; i++) if (!(c.beads[i].year > c.beads[i - 1].year)) err(`${c.id}: bead ${c.beads[i].id} (${c.beads[i].year}) is not after ${c.beads[i - 1].id} (${c.beads[i - 1].year})`);

  for (const band of BANDS) {
    if (!offered(c, band)) continue;
    const rules = BAND_RULES[band];
    const lv = band;
    const chain = beadsFor(c, band);
    if (chain.length < rules.beads[0] || chain.length > rules.beads[1]) err(`${c.id} ${band}: ${chain.length} beads, expected ${rules.beads.join("–")}`);
    if (!c.brief[lv]) err(`${c.id}: no brief at ${lv}`);
    lint(`${c.id} brief ${lv}`, c.brief[lv]);
    chain.forEach((b, i) => {
      if (!b.fact[lv]) err(`${b.id}: no fact card at ${lv}`);
      lint(`${b.id} fact ${lv}`, b.fact[lv]);
      if (i === 0) return;
      const f = b.find;
      if (!f) return err(`${b.id}: no clues to find it (${band})`);
      checkLen(`${b.id} plaque ${lv}`, f.plaque[lv], rules.clueMax);
      if (f.witnesses.length < 2) err(`${b.id}: needs 2 helpful witnesses`);
      f.witnesses.forEach((w, k) => checkLen(`${b.id} witness ${k} (${w.who}) ${lv}`, w.text[lv], rules.clueMax));
      if (band === "b68") {
        if (!f.herring) err(`${b.id}: grades 6-8 need a red-herring witness`);
        else {
          checkLen(`${b.id} herring`, f.herring.text, 100);
          lint(`${b.id} herring note`, f.herring.note);
        }
      }
      if (band === "b912") {
        if (!f.unreliable) err(`${b.id}: grades 9-12 need an unreliable witness`);
        else {
          checkLen(`${b.id} unreliable`, f.unreliable.text, 140);
          lint(`${b.id} unreliable note`, f.unreliable.note);
        }
      }
    });
    // Solvable within the lantern with at least 3 mistakes.
    const lantern = lanternFor(band);
    const legs = chain.slice(0, -1);
    const clockLegs = legs.filter((b) => !b.sensitive);
    const deadEnds = 3 * 2 * (clockLegs.length ? 1 : 0); // dead ends only cost on clocked legs
    const plaqueOnly = deadEnds;
    const oneWitness = clockLegs.length + deadEnds;
    const refuels = clockLegs.length; // one optional refuel per bead visit
    if (plaqueOnly > lantern) err(`${c.id} ${band}: 3 mistakes cost ${plaqueOnly}h > lantern ${lantern}h`);
    if (oneWitness > lantern + refuels) err(`${c.id} ${band}: one witness per leg + 3 mistakes = ${oneWitness}h > ${lantern}h + ${refuels} refuels`);
    notes.push(`${c.id.padEnd(8)} ${band.padEnd(4)} ${chain.length} beads, lantern ${lantern}h: 3 mistakes + 1 witness/leg = ${oneWitness}h${oneWitness > lantern ? ` (needs ${oneWitness - lantern} refuel)` : ""}`);
  }

  for (const b of c.beads) {
    if (b.sources.length < 2) err(`${b.id}: needs at least 2 sources`);
    for (const s of b.sources) if (!sourceIds.has(s)) err(`${b.id}: source "${s}" is not in docs/sources.md`);
    lint(`${b.id} title`, b.title);
    // Sensitive beads: no Knot, no clock, no music.
    if (b.sensitive) {
      if (knotVisible(b)) err(`${b.id}: Knot visible on a sensitive bead`);
      if (lanternCost(b, "witness") !== 0 || lanternCost(b, "deadEnd") !== 0) err(`${b.id}: lantern clock runs on a sensitive bead`);
      if (musicOn(b)) err(`${b.id}: music on a sensitive bead`);
    }
    const f = b.find;
    if (!f) continue;
    const target = { place: b.place, year: b.year, era: b.era };
    if (f.wrongPlaces.length < 3) err(`${b.id}: needs 3 wrong places`);
    if (f.wrongEras.length < 2) err(`${b.id}: needs 2 wrong eras`);
    if (!f.wrongPlaces.some((w) => w.kind === "near")) err(`${b.id}: needs a plausible-neighbour pin`);
    const sameAsBead = (pl: string, year: number) => c.beads.some((x) => x.place === pl && Math.abs(x.year - year) <= 25);
    for (const w of f.wrongPlaces) {
      if (w.why.length < 25) err(`${b.id} dead end ${w.place}: explanation too short`);
      lint(`${b.id} dead end ${w.place}`, w.why);
      if (w.place === b.place) err(`${b.id}: wrong place ${w.place} is the right place`);
      if (sameAsBead(w.place, w.year ?? b.year)) err(`${b.id}: wrong place ${w.place} matches a bead of this case in that era`);
      if (w.kind === "near" && km(place(w.place).at, place(b.place).at) > 3500) err(`${b.id}: "near" pin ${w.place} is ${Math.round(km(place(w.place).at, place(b.place).at))} km away`);
    }
    for (const e of f.wrongEras) {
      if (e.why.length < 25) err(`${b.id} dead end ${e.era}: explanation too short`);
      lint(`${b.id} dead end ${e.era}`, e.why);
      if (Math.abs(e.year - b.year) <= 25 || e.era === b.era) err(`${b.id}: wrong era ${e.era} is too close to the right one (${b.era})`);
      if (sameAsBead(b.place, e.year)) err(`${b.id}: wrong era ${e.era} at ${b.place} matches another bead of this case`);
    }
    // Built pins and dials, many shuffles.
    for (let k = 0; k < 20; k++) {
      const pins = buildPins(target, f);
      if (pins.length !== 4) err(`${b.id}: ${pins.length} pins`);
      if (pins.filter((p) => p.correct).length !== 1) err(`${b.id}: pins need exactly one correct`);
      if (new Set(pins.map((p) => `${p.place}|${p.era}`)).size !== 4) err(`${b.id}: duplicate pins`);
      if (pins.some((p) => !p.correct && !p.why)) err(`${b.id}: unexplained pin`);
      const dial = buildDial(target, f, b.what);
      if (dial.places.length !== 4 || new Set(dial.places.map((p) => p.place)).size !== 4) err(`${b.id}: dial places must be 4 distinct`);
      if (dial.eras.length !== 4 || new Set(dial.eras.map((e) => e.era)).size !== 4) err(`${b.id}: dial eras must be 4 distinct`);
      if (dial.places.filter((p) => p.correct).length !== 1 || dial.eras.filter((e) => e.correct).length !== 1) err(`${b.id}: dial needs one correct place and era`);
      if ([...dial.places, ...dial.eras].some((p) => !p.correct && !p.why)) err(`${b.id}: unexplained dial option`);
      if (dial.eras.some((e) => !e.correct && sameAsBead(b.place, e.year))) err(`${b.id}: a dial era matches another bead here`);
    }
  }

  // Source checks
  for (const s of c.sourceChecks) {
    const bead = c.beads.find((b) => b.id === s.bead);
    if (!bead) err(`${s.id}: unknown bead ${s.bead}`);
    for (const band of s.bands) if (bead && !bead.bands.includes(band)) err(`${s.id}: bead ${s.bead} is not played at ${band}`);
    if (s.kind === "quoted" && !/public domain/i.test(s.cite)) err(`${s.id}: quoted text must be public domain (say so in the cite)`);
    if (s.kind === "retold" && !/^Retold from/.test(s.cite)) err(`${s.id}: retold text must be labelled "Retold from …"`);
    if (s.kind === "retold" && s.passage.split(/\s+/).length > 95) err(`${s.id}: excerpt over ~80 words`);
    lint(`${s.id} passage`, s.passage);
    lint(`${s.id} explanation`, s.explanation);
  }
  for (const band of BANDS) {
    if (!offered(c, band)) continue;
    const need = BAND_RULES[band].sourceChecks;
    const have = c.sourceChecks.filter((s) => s.bands.includes(band)).length;
    if (have < need) err(`${c.id} ${band}: ${have} source checks, need ${need}`);
    if (!c.why.some((w) => w.bands.includes(band))) err(`${c.id} ${band}: no "why did it move?" question`);
  }
}

// ---------- grades, codes, questions ----------
const CODE_FORM = /^(\d{1,2}|WH)\.(H|G|E|C&G|B)\.\d(\.\d)?$/;
function checkQ(where: string, q: Question) {
  if (q.choices.length !== 4 || new Set(q.choices).size !== 4) err(`${where}: choices must be 4 unique: ${JSON.stringify(q.choices)}`);
  if (q.answer < 0 || q.answer > 3) err(`${where}: bad answer index`);
  if (!q.prompt || !q.explanation || q.choices.some((x) => !x)) err(`${where}: empty text`);
  if (!ALLOWED_CODES.has(q.standard) || !CODE_FORM.test(q.standard)) err(`${where}: code ${q.standard} not allowed`);
  lint(`${where} prompt`, q.prompt);
  q.choices.forEach((x, i) => lint(`${where} choice ${i}`, x));
}

for (const g of GRADES_5_12) {
  const list = casesFor(g);
  if (!list.length) err(`grade ${g}: no cases`);
  const band: Band = Number(g) <= 5 ? "b5" : Number(g) <= 8 ? "b68" : "b912";
  for (const c of list) {
    for (const skill of ["chronology", "diffusion", "cause", "sourcing"] as SkillId[]) {
      const code = codeFor(g, c, skill);
      if (!ALLOWED_CODES.has(code) || !CODE_FORM.test(code)) err(`grade ${g} ${c.id} ${skill}: code ${code}`);
      if (g === "5" && !["5.G.1.2", "5.G.1.3"].includes(code)) err(`grade 5 must use 5.G.1.2/5.G.1.3, got ${code}`);
    }
    const qs = [...reweaveQuestions(g, band, c), ...whyQuestions(g, band, c), ...sourceQuestions(g, band, c)];
    if (!qs.length) err(`grade ${g} ${c.id}: no questions`);
    qs.forEach((q) => checkQ(`grade ${g} ${q.id}`, q));
    if (reweaveQuestions(g, band, c).length !== beadsFor(c, band).length - 1) err(`grade ${g} ${c.id}: re-weave count`);
  }
}
const g5 = casesFor("5").map((c) => c.id).sort().join(",");
if (g5 !== "exchange,gold,paper") err(`grade 5 should play only the light cases 1, 2, 6; got ${g5}`);
for (const g of ["K", "1", "2", "3", "4"] as Grade[]) if (casesFor(g).length) err(`grade ${g} must see no cases`);
for (const b of BANDS) if (!levels(b).includes(b)) err(`levels(${b})`);
void lineFor;

// ---------- report ----------
const beadsTotal = CASES.reduce((a, c) => a + c.beads.length, 0);
const clueLines = CASES.reduce(
  (a, c) =>
    a +
    c.beads.reduce((n, b) => {
      const f = b.find;
      if (!f) return n;
      return n + Object.values(f.plaque).filter(Boolean).length + f.witnesses.reduce((m, w) => m + Object.values(w.text).filter(Boolean).length, 0) + (f.herring ? 1 : 0) + (f.unreliable ? 1 : 0);
    }, 0),
  0,
);
const deadEnds = CASES.reduce((a, c) => a + c.beads.reduce((n, b) => n + (b.find ? b.find.wrongPlaces.length + b.find.wrongEras.length : 0), 0), 0);
console.log(notes.join("\n"));
console.log(`\n${CASES.length} cases, ${beadsTotal} beads, ${clueLines} clue lines, ${deadEnds} authored dead ends, ${CASES.reduce((a, c) => a + c.sourceChecks.length, 0)} source checks, ${PLACE_IDS.length} places.`);
if (errors.length) {
  console.error(`\n${errors.length} problem(s):\n- ${errors.join("\n- ")}`);
  process.exit(1);
}
console.log("All content checks passed.");
