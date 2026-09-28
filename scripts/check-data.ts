/*
 * Validates Jungle Run's own data and generators for every grade (run: npm test).
 *  - compass: every direction resolves to the exit on that side of the rose; letter deals are permutations
 *  - map challenges: answers match an independent truth table; where two real places are named, the
 *    answer also matches the compass bearing between their coordinates (within 35° of the cardinal direction)
 *  - timelines: exact dates match an independent truth table, every set has a unique order, tablets fit
 *  - labels on signs and tablets fit the bitmap font
 *  - scenes: thousands of generated scenes per band are traversable with the physics constants (no NaN)
 */
import fs from "fs";
import path from "path";
import { GRADES } from "@/kit/grades";
import type { Grade } from "@/kit";
import { DIRS, DIR_VEC, EXITS, ROSE, SIGNS, SIGN_TEXT_W, dealLetters, exitDirection, type Dir } from "@/jungle/compass";
import { MAP_CHALLENGES, mapChallengesFor } from "@/jungle/data/maps";
import { TIMELINES, dateLabel, dealGate, orderKey, timelinesFor } from "@/jungle/data/timelines";
import { canDraw, measure, wrapLabel } from "@/jungle/font";
import { GROUND, H, W, airTime, jumpDist, jumpPeak, physFor, type Band } from "@/jungle/physics";
import { CAMP_AT, CROSSROADS_AT, GATE_AT, LEG_LENGTH, checkScene, mulberry32, planScene, specialKind } from "@/jungle/scenes";
import { ALL_GRIDS } from "@/jungle/sprites";
import { mapDeck, timelineDeck } from "@/jungle/decks";

let failures = 0;
let checks = 0;
const ok = (cond: boolean, msg: string) => {
  checks++;
  if (!cond) {
    failures++;
    if (failures < 60) console.error("✘ " + msg);
  }
};

/* ------------------------------------------------------------------ compass */
for (const d of DIRS) {
  ok(exitDirection(d) === d, `compass: the ${d} exit is not on the ${d} side of the rose`);
  const e = EXITS[d];
  const [vx, vy] = DIR_VEC[d];
  ok((e.x - ROSE.x) * vx + (e.y - ROSE.y) * vy > 0, `compass: ${d} exit points the wrong way`);
  const s = SIGNS[d];
  ok(s.x >= 0 && s.y >= 0 && s.x + s.w <= W && s.y + s.h <= H, `compass: ${d} sign off screen`);
  // Sign sits on the same side of the rose as its exit (so the letter is next to its exit).
  const sx = s.x + s.w / 2 - ROSE.x;
  const sy = s.y + s.h / 2 - ROSE.y;
  if (d === "E" || d === "W") ok(Math.sign(sx) === vx, `compass: ${d} sign not on its side`);
  if (d === "N" || d === "S") ok(Math.sign(sy) === vy, `compass: ${d} sign not on its side`);
}
for (const a of DIRS) for (const b of DIRS) {
  if (a >= b) continue;
  const A = SIGNS[a], B = SIGNS[b];
  ok(A.x + A.w <= B.x || B.x + B.w <= A.x || A.y + A.h <= B.y || B.y + B.h <= A.y, `compass: signs ${a} and ${b} overlap`);
}
const rnd = mulberry32(42);
for (let i = 0; i < 500; i++) {
  const letters = dealLetters(rnd);
  ok(new Set(letters).size === 4 && letters.every((d) => DIRS.includes(d)), "compass: letter deal is not a permutation");
  // Resolving: pressing the letter of the answer exit gives that exit.
  const answer = DIRS[i % 4];
  ok(letters[letters.indexOf(answer)] === answer, "compass: letter does not resolve to its exit");
}

/* ------------------------------------------------------------------ map challenges */
/** Independent truth table: the correct exit (dir) or the correct sign label. */
const TRUTH: Record<string, Dir | string> = {
  "k2-north": "N", "k2-south": "S", "k2-east": "E", "k2-west": "W", "k2-sunrise": "E", "k2-sunset": "W",
  "k2-opp-north": "S", "k2-opp-east": "W", "k2-letter-n": "N",
  "k2-sym-water": "WATER", "k2-sym-mountain": "MOUNTAIN", "k2-sym-house": "HOME", "k2-sym-forest": "FOREST", "k2-sym-school": "SCHOOL",
  "k2-far": "ANOTHER STATE", "k2-near": "YOUR DESK", "k2-farthest": "THE SUN",
  "nc-pied-coast": "E", "nc-pied-mtn": "W", "nc-mtn-pied": "E", "nc-coast-pied": "W", "nc-va": "N", "nc-sc": "S", "nc-tn": "W",
  "nc-atlantic": "E", "nc-mitchell": "W", "nc-hatteras": "E", "nc-smokies": "W", "nc-mississippi": "W",
  "nc-coast-landmark": "CAPE HATTERAS", "nc-mtn-landmark": "MOUNT MITCHELL", "nc-capital": "RALEIGH",
  "us-california": "W", "us-florida": "S", "us-canada": "N", "us-mexico": "S", "us-rockies": "W", "us-pacific": "W",
  "us-greatlakes": "N", "us-atlantic": "E", "us-gulf-lakes": "N", "us-greatlake": "LAKE ERIE", "us-midwest": "OHIO", "us-westcoast": "OREGON",
  "w-eur-afr": "S", "w-eur-asia": "E", "w-sam-nam": "N", "w-afr-sam": "W", "w-nam-atl": "E", "w-nam-pac": "W", "w-nam-arc": "N",
  "w-sam-ant": "S", "w-ind-ocean": "S", "w-lat-equator": "S", "w-lat-pole": "N", "w-lon-west": "W", "w-lon-east": "E",
  "w-lon-prime": "E", "w-lat-south": "S", "w-lat-cancer": "N",
  "w-continent": "AFRICA", "w-ocean": "ARCTIC", "w-largest-ocean": "PACIFIC", "w-largest-cont": "ASIA", "w-parallels": "PARALLELS",
  "w-prime": "PRIME MERIDIAN", "w-south-only": "ANTARCTICA", "w-nile": "NILE",
  "h-columbus": "W", "h-silkroad": "W", "h-napoleon": "E", "h-dday": "S", "h-berlin": "E", "h-korea": "N", "h-mayflower": "W",
  "h-lewisclark": "W", "h-oregon": "W", "h-tears": "W", "h-ugrr": "N", "h-migration": "N", "h-dustbowl": "W",
  "c-makes-laws": "CONGRESS", "c-interprets": "JUDICIAL", "c-26th": "26TH", "c-1st": "1ST", "c-federalism": "FEDERALISM",
  "e-demand": "PRICES RISE", "e-fed": "FEDERAL RESERVE", "e-oppcost": "OPPORTUNITY COST", "e-inflation": "INFLATION",
};

/** Real coordinates (lat, lon) for "from → to" questions. The bearing must agree with the answer. */
const P: Record<string, [number, number]> = {
  greensboro: [36.07, -79.79], greenville: [35.61, -77.37], asheville: [35.6, -82.55], raleigh: [35.78, -78.64],
  roanoke: [37.27, -79.94], charlotte: [35.23, -80.84], columbia: [34.0, -81.03], knoxville: [35.96, -83.92],
  outerBanksSea: [35.5, -74.5], mtMitchell: [35.765, -82.265], hatteras: [35.25, -75.53], clingmans: [35.56, -83.5],
  memphis: [35.15, -90.05], sacramento: [38.58, -121.49], orlando: [28.54, -81.38], kansas: [39.0, -98.0],
  winnipeg: [49.9, -97.1], mexicoCity: [19.4, -99.1], nebraska: [41.5, -99.9], denver: [39.7, -105.0],
  chicago: [41.9, -87.6], oregonCoast: [44.0, -124.5], atlanta: [33.75, -84.39], lakeMichigan: [44.0, -87.0],
  sanFrancisco: [37.77, -122.42], atlanticOff: [38.0, -70.0], gulf: [25.0, -90.0], lakeErie: [42.2, -81.2],
  europe: [50.0, 10.0], africa: [5.0, 20.0], asia: [45.0, 90.0], southAmerica: [-15.0, -60.0], northAmerica: [45.0, -100.0],
  atlanticMid: [35.0, -40.0], pacificMid: [35.0, -150.0], arctic: [80.0, -100.0], antarctica: [-80.0, -60.0],
  india: [22.0, 79.0], indianOcean: [-10.0, 80.0],
  palos: [37.2, -6.9], sanSalvador: [24.05, -74.5], xian: [34.3, 108.9], rome: [41.9, 12.5], paris: [48.86, 2.35],
  moscow: [55.76, 37.62], portsmouth: [50.8, -1.09], omahaBeach: [49.37, -0.87], westBerlin: [52.5, 13.3], eastBerlin: [52.52, 13.45],
  southKorea: [36.5, 127.8], northKorea: [40.3, 127.5], plymouthUK: [50.37, -4.14], plymouthMA: [41.96, -70.67],
  stLouis: [38.6, -90.2], astoria: [46.19, -123.83], independence: [39.09, -94.42], oregonCity: [45.36, -122.6],
  newEchota: [34.54, -84.9], tahlequah: [35.9, -94.97], richmond: [37.54, -77.44], toronto: [43.65, -79.38],
  jackson: [32.3, -90.2], oklahomaCity: [35.5, -97.5], losAngeles: [34.05, -118.24],
  nc35N79W: [35.0, -79.0], equator79W: [0.0, -79.0], pole79W: [89.0, -79.0], p35N80W: [35.0, -80.0], p35N90W: [35.0, -90.0],
  p0N10E: [0.0, 10.0], p0N30E: [0.0, 30.0], p35N78W: [35.0, -78.0], p35N0: [35.0, 0.0], p20S: [-20.0, 0.0], p40S: [-40.0, 0.0],
  equator0: [0.0, 0.0], cancer: [23.4, 0.0],
};
const ROUTES: Record<string, [string, string]> = {
  "nc-pied-coast": ["greensboro", "greenville"], "nc-pied-mtn": ["greensboro", "asheville"], "nc-mtn-pied": ["asheville", "greensboro"],
  "nc-coast-pied": ["greenville", "greensboro"], "nc-va": ["greensboro", "roanoke"], "nc-sc": ["charlotte", "columbia"],
  "nc-tn": ["asheville", "knoxville"], "nc-atlantic": ["raleigh", "outerBanksSea"], "nc-mitchell": ["raleigh", "mtMitchell"],
  "nc-hatteras": ["raleigh", "hatteras"], "nc-smokies": ["charlotte", "clingmans"], "nc-mississippi": ["raleigh", "memphis"],
  "us-california": ["raleigh", "sacramento"], "us-florida": ["raleigh", "orlando"], "us-canada": ["kansas", "winnipeg"],
  "us-mexico": ["kansas", "mexicoCity"], "us-rockies": ["nebraska", "denver"], "us-pacific": ["chicago", "oregonCoast"],
  "us-greatlakes": ["atlanta", "lakeMichigan"], "us-atlantic": ["sanFrancisco", "atlanticOff"], "us-gulf-lakes": ["gulf", "lakeErie"],
  "w-eur-afr": ["europe", "africa"], "w-eur-asia": ["europe", "asia"], "w-sam-nam": ["southAmerica", "northAmerica"],
  "w-afr-sam": ["africa", "southAmerica"], "w-nam-atl": ["northAmerica", "atlanticMid"], "w-nam-pac": ["northAmerica", "pacificMid"],
  "w-nam-arc": ["northAmerica", "arctic"], "w-sam-ant": ["southAmerica", "antarctica"], "w-ind-ocean": ["india", "indianOcean"],
  "w-lat-equator": ["nc35N79W", "equator79W"], "w-lat-pole": ["nc35N79W", "pole79W"], "w-lon-west": ["p35N80W", "p35N90W"],
  "w-lon-east": ["p0N10E", "p0N30E"], "w-lon-prime": ["p35N78W", "p35N0"], "w-lat-south": ["p20S", "p40S"], "w-lat-cancer": ["equator0", "cancer"],
  "h-columbus": ["palos", "sanSalvador"], "h-silkroad": ["xian", "rome"], "h-napoleon": ["paris", "moscow"], "h-dday": ["portsmouth", "omahaBeach"],
  "h-berlin": ["westBerlin", "eastBerlin"], "h-korea": ["southKorea", "northKorea"], "h-mayflower": ["plymouthUK", "plymouthMA"],
  "h-lewisclark": ["stLouis", "astoria"], "h-oregon": ["independence", "oregonCity"], "h-tears": ["newEchota", "tahlequah"],
  "h-ugrr": ["richmond", "toronto"], "h-migration": ["jackson", "chicago"], "h-dustbowl": ["oklahomaCity", "losAngeles"],
};
/** Initial bearing in degrees (0 = north, 90 = east), local flat-earth approximation. */
function bearing(a: [number, number], b: [number, number]): number {
  const dy = b[0] - a[0];
  const dx = (b[1] - a[1]) * Math.cos((((a[0] + b[0]) / 2) * Math.PI) / 180);
  return ((Math.atan2(dx, dy) * 180) / Math.PI + 360) % 360;
}
const DIR_DEG: Record<Dir, number> = { N: 0, E: 90, S: 180, W: 270 };

const CODE = /^((K|[1-8])\.(G|H|E|B|C&G)\.\d+(\.\d+)?|(WH|AH|CL)\.(G|H|E|B|C&G)\.\d+(\.\d+)?|EPF\.(E|IE|MM|FP|CC)\.\d+(\.\d+)?)$/;
const ids = new Set<string>();
for (const c of MAP_CHALLENGES) {
  const tag = `[map ${c.id}]`;
  ok(!ids.has(c.id), `${tag} duplicate id`);
  ids.add(c.id);
  ok(c.prompt.length > 8 && c.explanation.length > 20, `${tag} missing prompt/explanation`);
  ok(c.grades.length > 0, `${tag} no grades`);
  ok(c.id in TRUTH, `${tag} missing from the truth table`);
  if (c.kind === "dir") {
    ok(!!c.answer && DIRS.includes(c.answer), `${tag} bad answer`);
    ok(!c.signs, `${tag} dir challenge with signs`);
    ok(TRUTH[c.id] === c.answer, `${tag} answer ${c.answer} but truth says ${TRUTH[c.id]}`);
    const route = ROUTES[c.id];
    if (route) {
      const b = bearing(P[route[0]], P[route[1]]);
      const diff = Math.abs(((b - DIR_DEG[c.answer!] + 540) % 360) - 180);
      ok(diff <= 35, `${tag} real bearing ${route.join("→")} is ${b.toFixed(0)}°, ${diff.toFixed(0)}° away from ${c.answer}`);
    }
  } else {
    ok(!!c.signs && c.signs.length === 4 && new Set(c.signs).size === 4, `${tag} needs four distinct signs`);
    ok(c.answer === undefined, `${tag} sign challenge with a direction answer`);
    ok(c.signs?.[0] === TRUTH[c.id], `${tag} first sign ${c.signs?.[0]} but truth says ${TRUTH[c.id]}`);
    for (const label of c.signs ?? []) {
      ok(canDraw(label), `${tag} sign "${label}" has characters the font can't draw`);
      const lines = wrapLabel(label, SIGN_TEXT_W, 2);
      ok(lines !== null, `${tag} sign "${label}" does not fit on a sign (2 lines × ${SIGN_TEXT_W}px)`);
    }
    if (c.icons) ok(c.icons.length === 4, `${tag} needs four icons`);
  }
  for (const g of c.grades) {
    const std = mapChallengesFor(g).find((x) => x.id === c.id)!.standard as string;
    ok(CODE.test(std), `${tag} grade ${g}: standard "${std}" does not look like an NC social studies code`);
  }
}
for (const id of Object.keys(TRUTH)) ok(ids.has(id), `truth table entry ${id} has no challenge`);
for (const id of Object.keys(ROUTES)) ok(ids.has(id), `route ${id} has no challenge`);

/* ------------------------------------------------------------------ timelines */
/** Independent truth table of years (negative = BCE). */
const YEARS: Record<string, number> = {
  "nc-roanoke": 1587, "nc-charter": 1663, "nc-blackbeard": 1718, "nc-halifax": 1776, "nc-12th": 1789, "nc-raleigh": 1792,
  "nc-unc": 1795, "nc-secede": 1861, "nc-flight": 1903, "nc-sitin": 1960,
  "us-columbus": 1492, "us-jamestown": 1607, "us-plymouth": 1620, "us-declaration": 1776, "us-constitution": 1787,
  "us-louisiana": 1803, "us-civilwar": 1861, "us-railroad": 1869, "us-19th": 1920, "us-moon": 1969,
  "an-olympics": -776, "an-qin": -221, "an-caesar": -44, "an-augustus": -27, "an-rome": 476, "an-hijra": 622,
  "an-hastings": 1066, "an-magna": 1215, "an-const": 1453,
  "mo-columbus": 1492, "mo-luther": 1517, "mo-magellan": 1519, "mo-bastille": 1789, "mo-waterloo": 1815, "mo-ww1": 1914,
  "mo-ww2": 1939, "mo-india": 1947, "mo-wall": 1989, "mo-ussr": 1991,
  "e8-roanoke": 1587, "e8-charter": 1663, "e8-halifax": 1776, "e8-constitution": 1787, "e8-ratify": 1789, "e8-secede": 1861,
  "e8-13th": 1865, "e8-wilmington": 1898, "e8-flight": 1903, "e8-sitin": 1960, "e8-cra": 1964,
  "wh-magna": 1215, "wh-plague": 1347, "wh-const": 1453, "wh-luther": 1517, "wh-westphalia": 1648, "wh-bastille": 1789,
  "wh-haiti": 1804, "wh-suez": 1869, "wh-russia": 1917, "wh-prc": 1949, "wh-mandela": 1994,
  "ah-billofrights": 1791, "ah-louisiana": 1803, "ah-seneca": 1848, "ah-emancipation": 1863, "ah-plessy": 1896, "ah-19th": 1920,
  "ah-crash": 1929, "ah-pearl": 1941, "ah-brown": 1954, "ah-vra": 1965,
  "cl-magna": 1215, "cl-ebor": 1689, "cl-declaration": 1776, "cl-articles": 1781, "cl-constitution": 1787, "cl-bor": 1791,
  "cl-marbury": 1803, "cl-14th": 1868, "cl-miranda": 1966, "cl-26th": 1971,
  "ec-smith": 1776, "ec-buttonwood": 1792, "ec-fed": 1913, "ec-crash": 1929, "ec-fdic": 1933, "ec-ssa": 1935, "ec-bretton": 1944,
  "ec-gold": 1971, "ec-euro": 1999, "ec-crisis": 2008,
};
/** K–2 sequences: the expected order of ids. */
const SEQUENCES: Record<string, string[]> = {
  "k2-day": ["day-wake", "day-breakfast", "day-bus", "day-lunch", "day-dinner", "day-bed"],
  "k2-grow": ["grow-baby", "grow-toddler", "grow-kinder", "grow-teen", "grow-adult", "grow-grandparent"],
  "k2-travel": ["tr-wagon", "tr-train", "tr-car", "tr-plane", "tr-jet"],
  "k2-seasons": ["ssn-fall", "ssn-winter", "ssn-spring", "ssn-summer"],
};
const TABLET_TEXT_W = 56;
const eventIds = new Set<string>();
for (const t of TIMELINES) {
  const tag = `[timeline ${t.id}]`;
  ok(t.events.length >= 4, `${tag} needs at least 4 events`);
  const dated = t.events.every((e) => e.year !== undefined);
  const stepped = t.events.every((e) => e.step !== undefined && e.year === undefined);
  ok(dated || stepped, `${tag} mixes years and steps`);
  if (stepped) {
    ok(t.grades.every((g) => ["K", "1", "2"].includes(g)), `${tag} undated sequences are for K–2 only`);
    const order = [...t.events].sort((a, b) => a.step! - b.step!).map((e) => e.id);
    ok(JSON.stringify(order) === JSON.stringify(SEQUENCES[t.id]), `${tag} sequence order ${order.join(",")} disagrees with the truth table`);
  }
  const keys = t.events.map(orderKey);
  ok(new Set(keys).size === keys.length, `${tag} two events share a date, so the order is not unique`);
  for (const e of t.events) {
    ok(!eventIds.has(e.id), `${tag} duplicate event id ${e.id}`);
    eventIds.add(e.id);
    if (e.year !== undefined) {
      ok(Number.isInteger(e.year) && e.year !== 0, `${tag} ${e.id}: year must be an exact non-zero integer`);
      ok(YEARS[e.id] === e.year, `${tag} ${e.id}: year ${e.year} but the truth table says ${YEARS[e.id]}`);
      ok(e.year <= 2026, `${tag} ${e.id}: year in the future`);
    }
    ok(canDraw(e.tablet), `${tag} tablet "${e.tablet}" has characters the font can't draw`);
    ok(wrapLabel(e.tablet, TABLET_TEXT_W, 3) !== null, `${tag} tablet "${e.tablet}" does not fit (3 lines × ${TABLET_TEXT_W}px)`);
    ok(e.text.length > 3, `${tag} ${e.id} missing text`);
    const dl = dateLabel(e);
    ok(canDraw(`1. ${dl}`) && measure(`4. ${dl}`) <= 40, `${tag} date label "${dl}" too wide for a tablet`);
  }
  for (let i = 0; i < 200; i++) {
    const four = dealGate(t, rnd);
    ok(new Set(four).size === 4, `${tag} deal repeated an event`);
    const sorted = [...four].sort((a, b) => orderKey(a) - orderKey(b));
    ok(!four.every((e, j) => e === sorted[j]), `${tag} dealt already in order`);
  }
  for (const g of t.grades) {
    const std = timelinesFor(g).find((x) => x.id === t.id)!.standard as string;
    ok(CODE.test(std), `${tag} grade ${g}: standard "${std}" does not look like an NC code`);
  }
}
for (const id of Object.keys(YEARS)) ok(eventIds.has(id), `year truth entry ${id} has no event`);
ok(dateLabel({ id: "x", text: "x", tablet: "X", year: -44 }) === "44 BCE", "dateLabel BCE");
ok(dateLabel({ id: "x", text: "x", tablet: "X", year: 476 }) === "476 CE", "dateLabel CE");

/* ------------------------------------------------------------------ per grade */
for (const g of GRADES as Grade[]) {
  const maps = mapChallengesFor(g);
  const gates = timelinesFor(g);
  ok(maps.length >= 8, `grade ${g}: only ${maps.length} map challenges`);
  ok(maps.some((m) => m.kind === "dir"), `grade ${g}: no direction challenges`);
  ok(gates.length >= 1, `grade ${g}: no timeline sets`);
  const md = mapDeck(g, rnd);
  const seen = new Set<string>();
  for (let i = 0; i < maps.length; i++) seen.add(md.next().id);
  ok(seen.size === maps.length, `grade ${g}: map deck repeats before using every challenge`);
  timelineDeck(g, rnd).next();
}

/* ------------------------------------------------------------------ sprites */
for (const [name, rows] of Object.entries(ALL_GRIDS)) {
  ok(rows.every((r) => r.length === rows[0].length), `sprite ${name} is not rectangular`);
}

/* ------------------------------------------------------------------ physics and scenes */
let scenesChecked = 0;
const kinds: Record<string, number> = {};
for (const band of [0, 1, 2, 3] as Band[]) {
  const p = physFor(band);
  for (const v of [p.gravity, p.jumpV, p.run, p.airRun, airTime(p), jumpPeak(p), jumpDist(p)]) ok(Number.isFinite(v) && v > 0, `band ${band}: bad physics value`);
  ok(jumpPeak(p) + 18 < GROUND - 30, `band ${band}: jump would leave the screen`);
  for (let seed = 1; seed <= 150; seed++) {
    for (let i = 0; i < LEG_LENGTH * 4; i++) {
      const s = planScene(i, band, p, mulberry32(seed * 7919 + i * 104729));
      const k = i % LEG_LENGTH;
      if (CROSSROADS_AT.includes(k)) ok(s.kind === "crossroads", `scene ${i}: should be a crossroads`);
      else if (k === GATE_AT) ok(s.kind === "gate", `scene ${i}: should be a gate`);
      else if (k === CAMP_AT) ok(s.kind === "camp", `scene ${i}: should be a camp`);
      else ok(specialKind(i) === null, `scene ${i}: unexpected special`);
      const problems = checkScene(s, p);
      if (problems.length) ok(false, `band ${band} seed ${seed} scene ${i} (${s.kind}): ${problems.join("; ")}`);
      else checks++;
      scenesChecked++;
      kinds[`${band}:${s.kind}`] = (kinds[`${band}:${s.kind}`] ?? 0) + 1;
      if (s.tunnel) ok(specialKind(s.tunnel.exitTo) === "crossroads", `scene ${i}: tunnel should come up at a crossroads`);
    }
  }
}
// K–2 jumps are wider (farther) than older bands', and K–2 has the gentlest hazards.
ok(jumpDist(physFor(0)) > jumpDist(physFor(3)), "K–2 jumps should carry farther");
ok(!kinds["0:scorpion"], "K–2 should not get sting-crab scenes");

/* ------------------------------------------------------------------ social studies bank (kit, informational) */
const socialDir = path.join(process.cwd(), "src", "kit", "banks", "social");
let socialCount = 0;
if (fs.existsSync(socialDir)) {
  for (const f of fs.readdirSync(socialDir)) if (/^g(K|\d+)\.ts$/.test(f)) socialCount += (fs.readFileSync(path.join(socialDir, f), "utf8").match(/subject: "social"/g) ?? []).length;
}

console.log(`Map challenges: ${MAP_CHALLENGES.length} · timeline sets: ${TIMELINES.length} (${eventIds.size} events) · scenes checked: ${scenesChecked}`);
console.log(`Kit social studies questions found: ${socialCount}`);
console.log(failures ? `✘ ${failures} of ${checks} checks failed` : `✔ all ${checks} checks passed`);
process.exit(failures ? 1 : 0);
