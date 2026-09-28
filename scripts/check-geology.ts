/*
 * Content tests for Rock Driller (run: npm test, i.e. npx tsx scripts/check-geology.ts).
 *
 * Checks the game's geology against an independent truth table written here (not imported
 * from the game): rock classes, metamorphic parents, where fossils/fuels/living things can
 * occur, era order and ages, Earth's layer order. Then, for every grade, it builds many
 * levels and field challenges and re-derives each challenge's answer from first principles
 * (superposition, cross-cutting, index fossils, half-lives, rock classes…).
 */
import { GRADES, gradeNumber } from "../src/kit/grades";
import type { Grade } from "../src/kit/types";
import {
  GRADE_SITES, GROUND_ROWS, ROCKS, SITES, SPECIMENS, unitLabel,
  type Era, type RockId, type SpecimenId,
} from "../src/drill/geology";
import {
  COLS, GROUND_TOP, ROWS, START_COL, buildLevel, critterCount, goalMatches, goalsForGrade, idx, seeded, siteFor,
  type LevelData, type Unit,
} from "../src/drill/levels";
import { feasibleKinds, kindsForGrade, makeChallenge, tagFor, type Challenge } from "../src/drill/challenges";
import { hasGlyph, measure } from "../src/drill/font";
import { LEGEND_TEXT_W, legendLines } from "../src/drill/ground";

let failures = 0;
let checks = 0;
function assert(cond: unknown, msg: string) {
  checks++;
  if (!cond) {
    failures++;
    if (failures < 200) console.error("FAIL:", msg);
  }
}

/* ============================== independent truth table ============================== */

const SEDIMENTARY = new Set(["sandstone", "shale", "limestone", "coal", "conglomerate", "oilsand", "bif"]);
const IGNEOUS = new Set(["granite", "basalt", "pillow", "gabbro", "peridotite"]);
const METAMORPHIC = new Set(["marble", "slate", "schist", "gneiss"]);
const SOIL = new Set(["topsoil", "subsoil", "weathered"]);
const LOOSE = new Set(["sand", "clay", "pebbles", "mud"]);
const EARTH_ORDER = ["crust", "uppermantle", "lowermantle", "outercore", "innercore"];
const META_PARENT: Record<string, string[]> = { marble: ["limestone"], slate: ["shale"], schist: ["shale", "slate"], gneiss: ["granite", "shale", "schist"] };
const LIQUID = new Set(["outercore"]);
// Eras by age (Ma): Cenozoic 0–66, Mesozoic 66–252, Paleozoic 252–539, Precambrian > 539.
function eraOfAge(ma: number): Era {
  if (ma < 66) return "cenozoic";
  if (ma < 252) return "mesozoic";
  if (ma < 539) return "paleozoic";
  return "precambrian";
}
const ERA_RANK: Record<Era, number> = { cenozoic: 0, mesozoic: 1, paleozoic: 2, precambrian: 3 };
// Index fossils and the eras they belong to.
const FOSSIL_ERAS: Partial<Record<SpecimenId, Era[]>> = {
  trilobite: ["paleozoic"], crinoid: ["paleozoic"], brachiopod: ["paleozoic"], fern: ["paleozoic"],
  ammonite: ["mesozoic"], dinobone: ["mesozoic"], mammoth: ["cenozoic"], sharktooth: ["cenozoic"],
};

function classOf(rock: string): string {
  if (SEDIMENTARY.has(rock)) return "sedimentary";
  if (IGNEOUS.has(rock)) return "igneous";
  if (METAMORPHIC.has(rock)) return "metamorphic";
  if (SOIL.has(rock)) return "soil";
  if (LOOSE.has(rock)) return "sediment";
  if (EARTH_ORDER.includes(rock)) return "earth";
  return "?";
}

const drawable = (s: string) => [...s].every((ch) => hasGlyph(ch));

/* ============================== rocks ============================== */

for (const [id, r] of Object.entries(ROCKS)) {
  assert(r.id === id, `rock id ${id}`);
  assert(r.type === classOf(id), `${id}: class ${r.type}, truth ${classOf(id)}`);
  assert(r.name === r.name.toUpperCase() && r.name.length <= 14 && drawable(r.name), `${id}: name "${r.name}" drawable, ≤14`);
  assert(r.colors.every((c) => /^#[0-9a-f]{6}$/i.test(c)), `${id}: colours`);
  assert(r.hardness >= 1 && r.hardness <= 7, `${id}: hardness`);
  assert(r.fact.length > 20 && r.fact.length < 200, `${id}: fact length`);
  if (r.type === "metamorphic") {
    assert(!!r.parent && META_PARENT[id]?.includes(r.parent), `${id}: metamorphic parent ${r.parent}`);
    assert(r.parent && ["sedimentary", "igneous", "metamorphic"].includes(classOf(r.parent)), `${id}: parent is a rock`);
  } else assert(!r.parent, `${id}: only metamorphic rocks have a parent`);
  assert(!!r.liquid === LIQUID.has(id), `${id}: liquid`);
  // class words in the fact must agree with the class
  for (const word of ["sedimentary", "igneous", "metamorphic"]) {
    if (r.fact.toLowerCase().includes(`${word} rock`) || r.fact.toLowerCase().includes(`it is ${word}`)) {
      assert(r.type === word, `${id}: fact says ${word}`);
    }
  }
  for (const leg of legendLines(r.name)) assert(measure(leg) <= LEGEND_TEXT_W, `${id}: legend line "${leg}" fits`);
}
const loose = Object.values(ROCKS).filter((r) => r.type === "soil" || r.type === "sediment");
const hard = Object.values(ROCKS).filter((r) => r.type === "igneous" || r.type === "metamorphic");
assert(Math.max(...loose.map((r) => r.hardness)) < Math.min(...hard.map((r) => r.hardness)), "soil/sediment drill faster than igneous/metamorphic rock");
assert(ROCKS.innercore.hardness > ROCKS.outercore.hardness, "solid inner core harder than liquid outer core");

/* ============================== specimens ============================== */

for (const [id, s] of Object.entries(SPECIMENS)) {
  assert(s.id === id, `specimen id ${id}`);
  assert(s.name.length <= 14 && drawable(s.name), `${id}: name`);
  assert(s.hosts.length > 0, `${id}: hosts`);
  for (const h of s.hosts) {
    const c = classOf(h);
    if (s.kind === "fossil") assert(c === "sedimentary" || c === "sediment", `${id}: fossil in ${h} (${c})`);
    if (s.kind === "living") assert(h === "topsoil", `${id}: living thing in ${h}`);
    if (s.kind === "fuel") assert(c === "sedimentary", `${id}: fossil fuel in ${h}`);
    if (s.kind === "ore") assert(c !== "soil" && c !== "sediment" && c !== "earth", `${id}: ore in ${h}`);
    if (s.kind === "metal") assert(h === "outercore" || h === "innercore", `${id}: core metal in ${h}`);
  }
  const truth = FOSSIL_ERAS[id as SpecimenId];
  if (truth) assert(JSON.stringify(s.eras) === JSON.stringify(truth), `${id}: eras ${s.eras} vs ${truth}`);
  else assert(!s.eras, `${id}: unexpected eras`);
}
assert(SPECIMENS.diamond.hosts.every((h) => ["peridotite", "uppermantle"].includes(h)), "diamonds form in the mantle");
assert(SPECIMENS.oil.hosts.every((h) => h === "oilsand"), "oil sits in the reservoir rock");

/* ============================== sites ============================== */

for (const [id, site] of Object.entries(SITES)) {
  assert(site.id === id, `site id ${id}`);
  assert(site.units.reduce((a, u) => a + u.rows, 0) === GROUND_ROWS, `${id}: rows sum to ${GROUND_ROWS}`);
  assert(site.units.every((u) => u.rows >= 2), `${id}: every layer at least 2 rows (legend fits)`);
  assert(drawable(site.name) && measure(site.name, 2) <= 240, `${id}: site name`);
  for (const u of site.units) {
    const label = unitLabel(u);
    assert(drawable(label), `${id}: label ${label}`);
    for (const leg of legendLines(label)) assert(measure(leg) <= LEGEND_TEXT_W, `${id}: legend line "${leg}" fits`);
    for (const s of u.specimens) assert(SPECIMENS[s].hosts.includes(u.rock), `${id}/${u.rock}: ${s} can't be found in ${u.rock}`);
    if (u.seq) assert(SEDIMENTARY.has(u.rock), `${id}: superposition layer ${u.rock} must be sedimentary`);
    if (u.ageMa) {
      assert(u.ageMa[0] < u.ageMa[1], `${id}: age range`);
      assert(eraOfAge(u.ageMa[0]) === u.era && eraOfAge(u.ageMa[1]) === u.era, `${id}/${u.rock}: ages ${u.ageMa} fit era ${u.era}`);
    }
    for (const s of u.specimens) {
      const e = FOSSIL_ERAS[s];
      if (e && u.era) assert(e.includes(u.era), `${id}: ${s} (${e}) in a ${u.era} layer`);
    }
    if (u.label === "MANTLE") assert(u.rock === "peridotite", `${id}: mantle is peridotite`);
    if (u.label === "BEDROCK") assert(classOf(u.rock) !== "soil" && classOf(u.rock) !== "sediment", `${id}: bedrock is rock`);
    if (u.label === "ROCK") assert(["sedimentary", "igneous", "metamorphic"].includes(classOf(u.rock)), `${id}: ROCK is rock`);
    if (u.label === "SOIL") assert(u.rock === "topsoil", `${id}: SOIL is topsoil`);
  }
  // Superposition: dated layers get older downward; index fossils never out of order.
  const dated = site.units.filter((u) => u.ageMa);
  for (let i = 1; i < dated.length; i++) assert(dated[i].ageMa![0] >= dated[i - 1].ageMa![1], `${id}: ages increase with depth`);
  const seq = site.units.filter((u) => u.seq);
  let maxAbove = -1;
  for (const u of seq) {
    const ranks = u.specimens.flatMap((s) => (FOSSIL_ERAS[s] ?? []).map((e) => ERA_RANK[e]));
    if (ranks.length) {
      assert(Math.min(...ranks) >= maxAbove, `${id}: index fossils out of order at ${u.rock}`);
      maxAbove = Math.max(maxAbove, ...ranks);
    }
  }
  // Earth's layers in order
  const earth = site.units.filter((u) => classOf(u.rock) === "earth").map((u) => u.rock);
  if (earth.length) assert(JSON.stringify(earth) === JSON.stringify(EARTH_ORDER), `${id}: Earth's layers in order`);
  // Oil trap: cap rock right on top of the reservoir, source rock below it, both shale.
  const roles = site.units.map((u) => u.role);
  if (roles.includes("reservoir")) {
    const r = roles.indexOf("reservoir");
    assert(roles[r - 1] === "cap" && site.units[r - 1].rock === "shale", `${id}: shale cap rock directly above reservoir`);
    const s = roles.indexOf("source");
    assert(s > r && site.units[s].rock === "shale", `${id}: shale source rock below reservoir`);
    assert(site.units[r].specimens.includes("oil"), `${id}: reservoir holds oil`);
  }
  if (site.dike) assert(site.units.slice(site.dike.topMin).every((u) => u.seq), `${id}: dike cuts sedimentary layers`);
}
for (const g of GRADES) {
  assert(GRADE_SITES[g].every((s) => !!SITES[s]), `grade ${g}: sites exist`);
  const n = gradeNumber(g);
  if (n <= 2) assert(GRADE_SITES[g].every((s) => SITES[s].units[0].rock === "topsoil"), `grade ${g}: K–2 sites start with soil`);
}

/* ============================== levels ============================== */

function unitsOf(d: LevelData) {
  return d.units;
}

for (const g of GRADES) {
  const n = gradeNumber(g);
  for (let level = 1; level <= 8; level++) {
    let prev: string | undefined;
    for (let seed = 1; seed <= 25; seed++) {
      const rng = seeded(seed * 1000 + level * 37 + n);
      const d = buildLevel(g, level, rng, prev as never);
      const tag = `g${g} L${level} s${seed} ${d.site.id}`;
      assert(d.site === siteFor(g, level), `${tag}: site`);
      assert(goalsForGrade(g).includes(d.goal.id) || d.goal.id === "crystal", `${tag}: goal ${d.goal.id} allowed`);
      if (n <= 2) assert(["living", "fossil", "crystal"].includes(d.goal.id), `${tag}: K–2 goals are things you can see`);
      assert(drawable(`GOAL: ${d.goal.short}`) && measure(`GOAL: ${d.goal.short}`, 2) <= 240, `${tag}: goal banner fits`);
      const targets = d.gems.filter((x) => x.target);
      assert(targets.length >= d.goal.count + 2, `${tag}: ${targets.length} target gems for goal ${d.goal.count}`);
      for (const gem of d.gems) {
        const u = d.units[gem.unit];
        assert(d.unitAt[idx(gem.col, gem.row)] === gem.unit, `${tag}: gem in its unit`);
        assert(u.kind === "layer" && u.def.specimens.includes(gem.specimen), `${tag}: ${gem.specimen} allowed in ${u.label}`);
        assert(goalMatches(d.goal.id, gem.specimen, u) === gem.target, `${tag}: target flag of ${gem.specimen}`);
        assert(!d.dug[idx(gem.col, gem.row)], `${tag}: gem not in a tunnel`);
        assert(!d.boulders.some(([c, r]) => c === gem.col && r === gem.row), `${tag}: gem not under a boulder`);
        assert(gem.row >= GROUND_TOP, `${tag}: gem underground`);
      }
      for (const [c, r] of d.boulders) {
        assert(r >= GROUND_TOP && r < ROWS - 1 && !d.dug[idx(c, r)] && !d.dug[idx(c, r + 1)], `${tag}: boulder rests on solid ground`);
        assert(Math.abs(c - START_COL) > 1, `${tag}: no boulder over the start shaft`);
      }
      assert(d.tunnels.length === critterCount(g, level), `${tag}: ${d.tunnels.length} critter tunnels`);
      for (const t of d.tunnels) {
        for (const [c, r] of t.cells) {
          assert(d.dug[idx(c, r)] === 1 && r >= GROUND_TOP + 3 && c >= 0 && c < COLS && r < ROWS, `${tag}: tunnel cell`);
          assert(Math.max(Math.abs(c - START_COL), Math.abs(r - GROUND_TOP)) >= 6, `${tag}: critters start away from the hero`);
        }
      }
      if (n <= 2) assert(d.tunnels.every((t) => t.critter === "bug"), `${tag}: no fire critters for K–2`);
      // unit map covers the ground exactly once per tile
      for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
        const v = d.unitAt[idx(c, r)];
        assert(r < GROUND_TOP ? v === -1 : v >= 0 && v < unitsOf(d).length, `${tag}: unit map`);
      }
      const labels = d.units.map((u) => u.label);
      assert(new Set(labels).size === labels.length, `${tag}: unit labels distinct (${labels})`);
      prev = d.goal.id;
    }
  }
}

/* ============================== field challenges ============================== */

const EXPECTED_CODES: Record<string, string[]> = {
  K: ["PS.K.1.1"], "1": ["ESS.1.2.1"], "2": ["ESS.1.2.1"], "3": ["LS.3.3"],
  "4": ["ESS.4.2.2", "LS.4.2.2", "ESS.4.2.3"], "5": ["ESS.4.2.2", "LS.4.2.2", "ESS.4.2.3"],
  "6": ["ESS.6.2", "ESS.6.3"], "7": ["ESS.8.1", "ESS.6.2"], "8": ["ESS.8.1", "ESS.6.2"],
  "9": ["ESS.EES.2", "ESS.EES.5"], "10": ["LS.Bio.6", "ESS.EES.2", "ESS.EES.5"],
  "11": ["PS.Chm.1.2", "ESS.EES.2", "ESS.EES.5"], "12": ["PS.Phy.7", "ESS.EES.2", "ESS.EES.5", "PS.Chm.1.2"],
};

const isCut = (u: Unit, dike: Unit) => u.kind === "layer" && u.bottom >= dike.top;

function checkChallenge(ch: Challenge, d: LevelData, tag: string) {
  const q = ch.q;
  const units = ch.units.map((i) => d.units[i]);
  const ans = units[q.answer];
  const others = units.filter((_, i) => i !== q.answer);
  const rock = (u: Unit) => u.def.rock as RockId;
  assert(new Set(ch.units).size === 4, `${tag}: 4 distinct layers`);
  assert(new Set(q.choices).size === 4, `${tag}: distinct choices ${q.choices}`);
  assert(q.choices.every((c) => c.length > 0 && c.length <= 26), `${tag}: choice lengths ${q.choices}`);
  assert(q.prompt.length <= 100, `${tag}: prompt length ${q.prompt.length}`);
  assert(q.answer >= 0 && q.answer < 4, `${tag}: answer index`);
  assert(q.explanation.includes(q.choices[q.answer]), `${tag}: explanation names the answer`);
  assert(EXPECTED_CODES[d.grade].includes(q.standard), `${tag}: standard ${q.standard} for grade ${d.grade}`);
  assert(q.standard === tagFor(ch.kind, d.grade).standard, `${tag}: tag`);
  const { main, review } = kindsForGrade(d.grade);
  assert(main.includes(ch.kind) || review.includes(ch.kind), `${tag}: kind ${ch.kind} belongs to grade`);
  // markers: inside their own layer, distinct, not on a gem or boulder
  ch.markers.forEach(([c, r], i) => {
    assert(d.unitAt[idx(c, r)] === ch.units[i], `${tag}: marker ${i + 1} in its layer`);
    assert(!d.gems.some((g) => g.state === "buried" && g.col === c && g.row === r), `${tag}: marker not on a gem`);
    assert(!d.boulders.some(([bc, br]) => bc === c && br === r), `${tag}: marker not on a boulder`);
  });
  assert(new Set(ch.markers.map(([c, r]) => idx(c, r))).size === 4, `${tag}: markers distinct`);

  const cls = (u: Unit) => classOf(rock(u));
  const deepest = [...units].sort((a, b) => b.top - a.top)[0];
  const shallowest = [...units].sort((a, b) => a.top - b.top)[0];
  const exactlyOne = (pred: (u: Unit) => boolean) => pred(ans) && others.every((u) => !pred(u));
  switch (ch.kind) {
    case "k_soil": case "s_humus": case "s_roots":
      assert(exactlyOne((u) => rock(u) === "topsoil"), `${tag}: topsoil`); break;
    case "t_soil": case "s_parent":
      assert(rock(ans) === "topsoil" && others.every((u) => ["sedimentary", "igneous", "metamorphic"].includes(cls(u))), `${tag}: soil vs rocks`); break;
    case "k_deep":
      assert(ans === deepest, `${tag}: deepest`); break;
    case "k_top":
      assert(ans === shallowest, `${tag}: top`); break;
    case "sp_old": case "fr_old":
      assert(units.every((u) => u.kind === "layer" && u.def.seq && SEDIMENTARY.has(rock(u))), `${tag}: undisturbed sedimentary layers`);
      assert(ans === deepest, `${tag}: oldest = deepest`);
      if (ch.kind === "fr_old" && units.every((u) => u.def.ageMa)) assert(units.every((u) => u === ans || u.def.ageMa![1] < ans.def.ageMa![0]), `${tag}: oldest by age too`);
      break;
    case "sp_young":
      assert(units.every((u) => u.kind === "layer" && u.def.seq && SEDIMENTARY.has(rock(u))), `${tag}: undisturbed sedimentary layers`);
      assert(ans === shallowest, `${tag}: youngest = top`); break;
    case "k_sand": assert(exactlyOne((u) => rock(u) === "sand"), `${tag}: sand`); break;
    case "k_clay": assert(exactlyOne((u) => rock(u) === "clay"), `${tag}: clay`); break;
    case "k_hard":
      assert(["sedimentary", "igneous", "metamorphic"].includes(cls(ans)) && others.every((u) => ["topsoil", "sand", "clay", "mud"].includes(rock(u))), `${tag}: rock vs loose`); break;
    case "s_subsoil": assert(exactlyOne((u) => rock(u) === "subsoil"), `${tag}: subsoil`); break;
    case "s_bedrock": assert(ans.label === "BEDROCK" && others.every((u) => cls(u) === "soil"), `${tag}: bedrock`); break;
    case "t_ign": case "rc_ign": assert(exactlyOne((u) => cls(u) === "igneous"), `${tag}: igneous`); break;
    case "t_sed": case "rc_sed": assert(exactlyOne((u) => cls(u) === "sedimentary"), `${tag}: sedimentary`); break;
    case "t_met": case "rc_met": assert(exactlyOne((u) => cls(u) === "metamorphic"), `${tag}: metamorphic`); break;
    case "t_fossil":
      assert(cls(ans) === "sedimentary" && others.every((u) => cls(u) === "igneous" || ["schist", "gneiss"].includes(rock(u))), `${tag}: fossils`); break;
    case "e_liquid": case "sw_s": assert(exactlyOne((u) => LIQUID.has(rock(u))), `${tag}: liquid outer core`); break;
    case "e_crust": assert(rock(ans) === EARTH_ORDER[0], `${tag}: crust`); break;
    case "e_hot": case "e_dense": assert(rock(ans) === EARTH_ORDER[4] && ans === deepest, `${tag}: inner core`); break;
    case "e_plates": assert(rock(ans) === "uppermantle", `${tag}: asthenosphere in upper mantle`); break;
    case "o_mantle": assert(exactlyOne((u) => rock(u) === "peridotite" && u.label === "MANTLE"), `${tag}: mantle`); break;
    case "o_lava": assert(exactlyOne((u) => rock(u) === "pillow"), `${tag}: pillow basalt`); break;
    case "cc_last": {
      assert(ans.kind === "dike" && others.every((u) => isCut(u, ans)), `${tag}: dike younger than all it cuts`); break;
    }
    case "cc_younger": {
      const dike = d.units.find((u) => u.kind === "dike")!;
      assert(ans.bottom < dike.top && others.every((u) => isCut(u, dike)), `${tag}: layer above the dike is younger`); break;
    }
    case "r_cap": {
      const res = d.units.find((u) => u.def.role === "reservoir")!;
      assert(ans.bottom + 1 === res.top && rock(ans) === "shale", `${tag}: cap rock sits on the reservoir`); break;
    }
    case "r_source": {
      const res = d.units.find((u) => u.def.role === "reservoir")!;
      assert(ans.top > res.bottom && rock(ans) === "shale" && others.every((u) => !(rock(u) === "shale" && u.top > res.bottom) && rock(u) !== "limestone"), `${tag}: source rock`); break;
    }
    case "r_coal": assert(exactlyOne((u) => rock(u) === "coal"), `${tag}: coal`); break;
    case "r_iron": assert(exactlyOne((u) => rock(u) === "bif"), `${tag}: iron ore`); break;
    case "r_cement": assert(exactlyOne((u) => rock(u) === "limestone" || rock(u) === "marble") && rock(ans) === "limestone", `${tag}: cement`); break;
    case "era_cenozoic": case "era_mesozoic": case "era_paleozoic": {
      const era = ch.kind.slice(4) as Era;
      const eraOf = (u: Unit) => (u.def.ageMa ? eraOfAge(u.def.ageMa[0]) : undefined);
      assert(exactlyOne((u) => eraOf(u) === era), `${tag}: ${era}`);
      const idxFossils = ans.def.specimens.filter((s) => FOSSIL_ERAS[s]);
      assert(idxFossils.length > 0 && idxFossils.every((s) => FOSSIL_ERAS[s]!.includes(era)), `${tag}: index fossils prove ${era}`);
      break;
    }
    case "hl": {
      const m = q.prompt.match(/Half-life = (\d+) million years\. Which sample is (\d+) million/);
      assert(!!m, `${tag}: half-life prompt`);
      if (!m) break;
      const T = Number(m[1]), age = Number(m[2]);
      const halves = units.map((u, i) => {
        const frac = q.choices[i].match(/1\/(\d+) LEFT/);
        return frac ? Math.log2(Number(frac[1])) : NaN;
      });
      units.forEach((u, i) => {
        assert(Number.isInteger(halves[i]) && halves[i] >= 1, `${tag}: fraction left is 1/2^n`);
        const a = halves[i] * T;
        assert(a >= u.def.ageMa![0] && a <= u.def.ageMa![1], `${tag}: dated age ${a} fits the layer (${u.def.ageMa})`);
      });
      assert(halves.filter((h) => h * T === age).length === 1 && halves[q.answer] * T === age, `${tag}: one sample is ${age} My`);
      const byDepth = units.map((u, i) => [u.top, halves[i]]).sort((a, b) => a[0] - b[0]);
      for (let i = 1; i < 4; i++) assert(byDepth[i][1] > byDepth[i - 1][1], `${tag}: deeper samples have less parent isotope left`);
      break;
    }
    default:
      assert(false, `${tag}: no independent check for ${ch.kind}`);
  }
}

const kindsSeen = new Map<string, Set<string>>();
for (const g of GRADES) {
  const seen = new Set<string>();
  for (let level = 1; level <= GRADE_SITES[g].length; level++) {
    for (let seed = 1; seed <= 120; seed++) {
      const rng = seeded(seed * 7919 + level * 131 + gradeNumber(g));
      const d = buildLevel(g, level, rng);
      const tag = `g${g} ${d.site.id} s${seed}`;
      if (seed === 1) assert(feasibleKinds(d).length > 0, `${tag}: grade has a challenge for this site`);
      const ch = makeChallenge(d, rng, [START_COL, 1]);
      assert(!!ch, `${tag}: challenge built`);
      if (!ch) continue;
      seen.add(ch.kind);
      checkChallenge(ch, d, `${tag} ${ch.kind}`);
      assert(ch.q.choices.every((c) => drawable(c.replace(/·/g, ""))), `${tag}: choices drawable`);
    }
  }
  kindsSeen.set(g, seen);
  const main = kindsForGrade(g).main;
  assert(main.some((k) => seen.has(k)), `grade ${g}: main topics appear (${[...seen]})`);
}

console.log(`${checks} checks, ${failures} failures`);
for (const [g, s] of kindsSeen) console.log(`  grade ${g.padStart(2)}: ${[...s].sort().join(", ")}`);
if (failures) process.exit(1);
