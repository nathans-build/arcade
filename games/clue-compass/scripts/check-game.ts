/*
 * Clue Compass data checks (npm test). Validates, for every grade band:
 *  - every case is solvable (played start to finish by the real CaseRun, with and without mistakes)
 *  - no wrong destination accidentally fits the clues; every dead end has an explanation
 *  - clue lengths per band, no clue names its own answer, picture icons + read-aloud text for K–2
 *  - the facts table is complete and every fact cites a known source
 *  - standards codes are well formed and in the right grade
 *  - map pins: inside the map box, on land (or water for oceans), in the right NC region, state
 *    bounding box or continent, and never stacked on top of another choice
 *  - the kit social studies bank has questions for every grade (transmissions)
 */
import { CASES, BANDS } from "../src/data/cases";
import { ALL_PLACES, BAND_CONFIG, COST, WORLD, bandOf, casesFor, elaFor, stdFor } from "../src/data/bands";
import { SOURCES } from "../src/data/sources";
import { validateCase, deadEnd, tagOf, factOf } from "../src/chase/logic";
import { CaseRun } from "../src/chase/session";
import { MAP_BOX, inRing, ncRegionAt, pinOf } from "../src/chase/geo";
import { NC_OUTLINE, NC_SOUNDS, US_OUTLINE, US_WATERS, WORLD_LAND } from "../src/chase/outlines";
import { ICONS, iconExists } from "../src/gfx/icons";
import { GRADES } from "../src/kit/grades";
import type { Grade, Question } from "../src/kit/types";
import type { Place } from "../src/chase/types";
import gK from "../src/kit/banks/social/gK";
import g1 from "../src/kit/banks/social/g1";
import g2 from "../src/kit/banks/social/g2";
import g3 from "../src/kit/banks/social/g3";
import g4 from "../src/kit/banks/social/g4";
import g5 from "../src/kit/banks/social/g5";
import g6 from "../src/kit/banks/social/g6";
import g7 from "../src/kit/banks/social/g7";
import g8 from "../src/kit/banks/social/g8";
import g9 from "../src/kit/banks/social/g9";
import g10 from "../src/kit/banks/social/g10";
import g11 from "../src/kit/banks/social/g11";
import g12 from "../src/kit/banks/social/g12";

const errors: string[] = [];
const warns: string[] = [];
const err = (m: string) => errors.push(m);
let checks = 0;
const ok = (cond: boolean, m: string) => {
  checks++;
  if (!cond) err(m);
};

// ---------------------------------------------------------------- cases
const ids = new Set<string>();
for (const c of CASES) {
  ok(!ids.has(c.id), `duplicate case id ${c.id}`);
  ids.add(c.id);
}
for (const b of BANDS) {
  const list = casesFor(b);
  ok(list.length === 6, `band ${b} has ${list.length} cases (want 6)`);
  for (const c of list) {
    const issues = validateCase(c, WORLD, BAND_CONFIG[b].rules);
    checks++;
    for (const i of issues) err(`case ${i.caseId}: ${i.msg}`);
    ok(iconExists(c.itemIcon), `case ${c.id}: item icon "${c.itemIcon}" missing`);
    ok(c.brief.length > 20 && c.brief.length <= 170, `case ${c.id}: brief length ${c.brief.length}`);
    ok(c.end.length > 10 && c.end.length <= 120, `case ${c.id}: ending length ${c.end.length}`);
    ok(!/\b(steal|stole|stolen|thief|crime|villain|jail|arrest)\b/i.test(c.brief + c.end + c.title), `case ${c.id}: use kid-safe words (Pocket borrows)`);
  }
}

// ---------------------------------------------------------------- play every case with the real engine
for (const c of CASES) {
  const cfg = BAND_CONFIG[c.band as keyof typeof BAND_CONFIG];
  const legs = c.stops.length - 1;
  const budget = cfg.charges(legs);
  // 1) straight solve, asking every witness
  let run = new CaseRun(c, WORLD, budget, COST, cfg.pictures, 7);
  for (let guard = 0; guard < 20 && run.phase === "stop"; guard++) {
    run.witnesses.forEach((_, i) => run.talk(i));
    if (run.phase !== "stop") break;
    run.travel(run.next.id);
  }
  ok(run.phase === "found", `case ${c.id}: perfect play ends "${run.phase}", not "found"`);
  ok(run.choices.length === legs && run.choices.every((x) => x.correct), `case ${c.id}: perfect play made ${run.choices.length} choices`);
  // 2) with mistakes: try every wrong option first at every stop (K–2) or two wrong trips in all (3–5)
  run = new CaseRun(c, WORLD, budget, COST, cfg.pictures, 11);
  let wrongLeft = budget === null ? 99 : 2;
  for (let guard = 0; guard < 60 && (run.phase === "stop" || run.phase === "deadend"); guard++) {
    if (run.phase === "deadend") {
      ok(run.lesson.length > 15, `case ${c.id}: dead end at ${run.wrongAt?.id} has no lesson`);
      run.back();
      continue;
    }
    if (run.witnesses.length) run.talk(0);
    if (run.phase !== "stop") break;
    const wrong = run.options.find((o) => o !== run.next.id && !run.tried.has(o));
    if (wrong && wrongLeft > 0) {
      wrongLeft--;
      run.travel(wrong);
    } else run.travel(run.next.id);
  }
  ok(run.phase === "found", `case ${c.id}: play with mistakes ends "${run.phase}" (budget ${budget})`);
  // every dead end of every leg is explained, in short (K–2) and long form
  for (let i = 0; i < c.stops.length - 1; i++) {
    const from = WORLD.get(c.stops[i]);
    const dest = WORLD.get(c.stops[i + 1]);
    const final = i === c.stops.length - 2;
    const refs = final ? c.traits : c.legs[i].clues;
    const opts = final ? c.hideoutOpts : c.legs[i].opts;
    const tags = refs.map((r) => tagOf(dest, r, from));
    for (const o of opts) {
      const t = deadEnd(WORLD.get(o), tags, from, cfg.pictures);
      ok(!!t && t.length <= 240, `case ${c.id}: dead end ${o} explanation missing/too long (${t?.length})`);
    }
  }
}

// ---------------------------------------------------------------- K–2 picture clues & read-aloud
for (const c of CASES.filter((x) => x.band === "K" || x.band === "1-2")) {
  for (let i = 0; i < c.stops.length - 1; i++) {
    const from = WORLD.get(c.stops[i]);
    const dest = WORLD.get(c.stops[i + 1]);
    const final = i === c.stops.length - 2;
    for (const ref of final ? [] : c.legs[i].clues) {
      if (ref === "dir") continue;
      const f = factOf(dest, ref)!;
      ok(!!f.icon && iconExists(f.icon), `case ${c.id}: picture clue ${dest.id}.${ref} needs an existing icon (${f.icon})`);
      ok(!!f.hint && f.hint.length >= 8, `case ${c.id}: picture clue ${dest.id}.${ref} needs read-aloud text`);
    }
    void from;
  }
  const hide = WORLD.get(c.stops[c.stops.length - 1]);
  for (const ref of c.traits) {
    const f = factOf(hide, ref)!;
    ok(!!f.icon && iconExists(f.icon), `case ${c.id}: notebook trait ${hide.id}.${ref} needs an icon`);
    ok(!!f.note, `case ${c.id}: notebook trait ${hide.id}.${ref} needs read-aloud note text`);
  }
}

// ---------------------------------------------------------------- icons
for (const [id, rows] of Object.entries(ICONS)) {
  ok(rows.length === 12 && rows.every((r) => r.length === 12), `icon ${id} must be 12x12`);
}
for (const p of ALL_PLACES) if (p.mark && !iconExists(p.mark)) warns.push(`place ${p.id}: scene mark "${p.mark}" has no icon`);

// ---------------------------------------------------------------- facts table
const used = new Set(CASES.flatMap((c) => c.stops.concat(c.legs.flatMap((l) => l.opts), c.hideoutOpts)));
const usedSrc = new Set<string>();
for (const p of ALL_PLACES) {
  ok(p.facts.length >= 2, `place ${p.id}: needs at least 2 facts`);
  ok(p.atSrc in SOURCES, `place ${p.id}: coordinate source ${p.atSrc} unknown`);
  ok(!!p.local && !!p.scene, `place ${p.id}: needs a local and a scene`);
  const seen = new Set<string>();
  for (const f of p.facts) {
    const key = `${f.k}=${f.v}`;
    ok(!seen.has(key), `place ${p.id}: duplicate fact ${key}`);
    seen.add(key);
    ok(f.src in SOURCES, `place ${p.id}: fact ${key} cites unknown source "${f.src}"`);
    usedSrc.add(f.src);
    ok(f.say.length >= 15 && f.say.length <= 160, `place ${p.id}: fact ${key} "say" length ${f.say.length}`);
    ok(/[.!?]$/.test(f.say), `place ${p.id}: fact ${key} "say" should be a sentence`);
    if (f.icon) ok(iconExists(f.icon), `place ${p.id}: fact ${key} icon "${f.icon}" missing`);
  }
  if (p.map === "nc") ok(p.facts.some((f) => f.k === "region"), `NC place ${p.id} needs a region`);
  if (p.map === "us" && p.id !== "dc") ok(p.facts.some((f) => f.k === "region"), `US place ${p.id} needs a region`);
  if (p.map === "town") for (const k of ["helper", "thing", "sound"]) ok(p.facts.some((f) => f.k === k), `town place ${p.id} needs ${k}`);
  if (p.map === "world") ok(p.facts.some((f) => f.k === "kind" || f.k === "continent"), `world place ${p.id} needs kind/continent`);
  if (!used.has(p.id)) warns.push(`place ${p.id} is not used by any case`);
}
// town facts must be unique per place (so picture clues never fit two places)
for (const k of ["helper", "thing", "sound"]) {
  const vals = ALL_PLACES.filter((p) => p.map === "town").map((p) => p.facts.find((f) => f.k === k)!.v);
  ok(new Set(vals).size === vals.length, `town ${k} values must be unique`);
}
for (const s of Object.keys(SOURCES)) if (!usedSrc.has(s) && s !== "coords" && s !== "town") warns.push(`source ${s} not cited by any fact`);

// ---------------------------------------------------------------- map pins
const BBOX: Record<string, [number, number, number, number]> = {
  // [latMin, latMax, lonMin, lonMax]
  NC: [33.84, 36.59, -84.33, -75.45], VA: [36.54, 39.47, -83.68, -75.24], SC: [32.03, 35.22, -83.36, -78.54],
  GA: [30.36, 35.0, -85.61, -80.84], TN: [34.98, 36.68, -90.31, -81.65], DC: [38.79, 39.0, -77.12, -76.91],
  NY: [40.5, 45.02, -79.76, -71.86], MA: [41.24, 42.89, -73.51, -69.93], IL: [36.97, 42.51, -91.51, -87.02],
  MO: [35.99, 40.62, -95.77, -89.1], LA: [28.93, 33.02, -94.04, -88.82], FL: [24.4, 31.0, -87.63, -80.03],
  TX: [25.84, 36.5, -106.65, -93.51], AZ: [31.33, 37.0, -114.82, -109.04], NM: [31.33, 37.0, -109.05, -103.0],
  CO: [36.99, 41.0, -109.06, -102.04], UT: [36.99, 42.0, -114.05, -109.04], WY: [40.99, 45.01, -111.06, -104.05],
  SD: [42.48, 45.95, -104.06, -96.44], CA: [32.53, 42.01, -124.41, -114.13], WA: [45.54, 49.0, -124.85, -116.91],
};
for (const p of ALL_PLACES) {
  const [x, y] = pinOf(p);
  ok(x >= MAP_BOX.x && x <= MAP_BOX.x + MAP_BOX.w && y >= MAP_BOX.y && y <= MAP_BOX.y + MAP_BOX.h, `pin ${p.id} is off the map box (${x.toFixed(0)}, ${y.toFixed(0)})`);
  if (p.map === "town") {
    ok(p.at[0] >= 0 && p.at[0] <= 100 && p.at[1] >= 0 && p.at[1] <= 60, `town pin ${p.id} outside the town`);
    continue;
  }
  const [lat, lon] = p.at;
  if (p.state) {
    const bb = BBOX[p.state];
    ok(!!bb, `no bounding box for state ${p.state}`);
    if (bb) ok(lat >= bb[0] && lat <= bb[1] && lon >= bb[2] && lon <= bb[3], `pin ${p.id} (${lat}, ${lon}) is outside ${p.state}`);
  }
  if (p.map === "nc") {
    ok(inRing(lon, lat, NC_OUTLINE), `NC pin ${p.id} is outside the NC outline`);
    ok(!NC_SOUNDS.some((r) => inRing(lon, lat, r)), `NC pin ${p.id} lands in a sound`);
    const reg = p.facts.find((f) => f.k === "region")?.v;
    ok(reg === ncRegionAt(lat, lon), `NC pin ${p.id}: region fact ${reg} but the map puts it in ${ncRegionAt(lat, lon)}`);
  }
  if (p.map === "us") {
    ok(inRing(lon, lat, US_OUTLINE), `US pin ${p.id} is outside the U.S. outline`);
    ok(!US_WATERS.some((w) => inRing(lon, lat, w.ring)), `US pin ${p.id} lands in a lake or bay`);
  }
  if (p.map === "world") {
    const land = WORLD_LAND.find((l) => inRing(lon, lat, l.ring));
    const kind = p.facts.find((f) => f.k === "kind")?.v;
    const cont = p.facts.find((f) => f.k === "continent")?.v;
    if (kind === "ocean") ok(!land, `ocean pin ${p.id} lands on ${land?.name}`);
    else if (kind === "continent") ok(land?.continent === p.name, `continent pin ${p.id} lands on ${land?.continent ?? "water"}`);
    else if (cont) ok(land?.continent === cont, `city pin ${p.id} (${cont}) lands on ${land?.continent ?? "water"}`);
  }
}
// sanity: relative positions read right on the maps
const px = (id: string) => pinOf(WORLD.get(id));
ok(px("asheville")[0] < px("charlotte")[0] && px("charlotte")[0] < px("raleigh")[0] && px("raleigh")[0] < px("hatteras")[0], "NC pins: west-to-east order wrong");
ok(px("seattle")[1] < px("phoenix")[1] && px("boston")[0] > px("chicago")[0], "US pins: order wrong");
ok(px("london")[0] > px("ottawa")[0] && px("sydney")[1] > px("tokyo")[1], "world pins: order wrong");
// choices in the same leg never sit on the same spot (≥ 3 px apart, labels are spread by the renderer)
for (const c of CASES) {
  for (let i = 0; i < c.stops.length - 1; i++) {
    const final = i === c.stops.length - 2;
    const group = [c.stops[i + 1], ...(final ? c.hideoutOpts : c.legs[i].opts)].map((id) => WORLD.get(id));
    for (let a = 0; a < group.length; a++)
      for (let b = a + 1; b < group.length; b++) {
        const [ax, ay] = pinOf(group[a]);
        const [bx, by] = pinOf(group[b]);
        ok(Math.hypot(ax - bx, ay - by) >= 3, `case ${c.id}: pins ${group[a].id} and ${group[b].id} overlap`);
      }
  }
}

// ---------------------------------------------------------------- standards codes
const SOC = /^(K|[1-5])\.(G|E|H|C&G|B)\.\d(\.\d)?$/;
const ELA = /^(RI|L)\.[1-5]\.[14]$/;
for (const g of GRADES) {
  const b = bandOf(g);
  for (const c of casesFor(b)) {
    const keys = new Set(c.legs.flatMap((l) => l.clues).concat(c.traits).map((r) => r.split("=")[0]));
    keys.add("map");
    for (const k of keys) {
      const s = stdFor(g, c.map, k);
      ok(SOC.test(s.code), `grade ${g}: bad code ${s.code}`);
      const gp = s.code.split(".")[0];
      const want = g === "K" ? "K" : String(Math.min(5, Number(g)));
      ok(gp === want, `grade ${g}: code ${s.code} is not a grade ${want} code`);
      ok(s.skill.length > 3 && s.skill.length <= 40, `grade ${g}: skill name "${s.skill}"`);
    }
  }
  for (const s of elaFor(g, true)) ok(ELA.test(s.code), `grade ${g}: bad ELA code ${s.code}`);
}

// ---------------------------------------------------------------- kit bank for transmissions
const BANK: Record<Grade, Question[]> = { K: gK, 1: g1, 2: g2, 3: g3, 4: g4, 5: g5, 6: g6, 7: g7, 8: g8, 9: g9, 10: g10, 11: g11, 12: g12 } as Record<Grade, Question[]>;
for (const g of GRADES) ok((BANK[g]?.length ?? 0) >= 8, `kit social bank for grade ${g} is too small for transmissions`);

// ---------------------------------------------------------------- summary
const byBand = BANDS.map((b) => {
  const cs = casesFor(b);
  const places = new Set(cs.flatMap((c) => c.stops.concat(c.legs.flatMap((l) => l.opts), c.hideoutOpts)));
  const stops = cs.map((c) => c.stops.length);
  return `${b}: ${cs.length} cases, ${Math.min(...stops)}–${Math.max(...stops)} stops, ${places.size} places`;
});
const facts = ALL_PLACES.reduce((a, p) => a + p.facts.length, 0);
console.log(`Clue Compass checks: ${checks} checks, ${CASES.length} cases, ${ALL_PLACES.length} places, ${facts} facts, ${Object.keys(SOURCES).length} sources`);
for (const l of byBand) console.log("  " + l);
for (const w of warns) console.log("  warning: " + w);
void (null as unknown as Place);
if (errors.length) {
  console.error(`\n${errors.length} problem(s):`);
  for (const e of errors) console.error("  ✘ " + e);
  process.exit(1);
}
console.log("All checks passed.");
