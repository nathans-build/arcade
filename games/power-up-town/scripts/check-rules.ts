/*
 * Power Up Town checks:   npm test   (npx tsx scripts/check-rules.ts)
 *
 * 1. Circuit solver: continuity, the conductor/insulator truth table (independent of the game's
 *    table), switches, short-circuit detection (a short never lights anything), series vs parallel
 *    behaviour (sharing voltage, one bulb out), Ohm's law, power and equivalent resistance
 *    against hand formulas, battery polarity and batteries in series.
 * 2. Circuit levels: the stored solution wins, an exhaustive search over every toolbox placement
 *    and rotation finds a win, the starting board doesn't win, short levels start shorted and
 *    dark, swapping the solution's conductor for any insulator (or the right resistor/battery for
 *    any other) loses, Sparky has a loop on every solution.
 * 3. Heat model: always moves toward room temperature and never crosses it, a better insulator
 *    changes more slowly, sunshine/handles/house/heater/tank models behave; every heat level has
 *    a winning choice and its losing choices really lose (with a margin).
 * 4. Sparky Run maps: the bulb is reachable from the battery along conductors only (no power-ups),
 *    the switch and fan maps really need them, and the sim drives the route to the bulb in time.
 * 5. Questions for every grade: ≥ 15 own items per band, 4 unique choices, a valid answer, an
 *    explanation and a standard code; misconception guards (no right answer or explanation says
 *    insulators make cold or heat flows cold → hot; the metal-feels-colder items explain conduction
 *    at equal temperature); the deck follows the subject/topic; formula math is recomputed.
 * 6. Saving and unlocking buildings; 7. the subject/topic picker and ?topic= parsing; 8. the town.
 */
import { GRADES } from "../src/kit/grades";
import type { Grade, Question } from "../src/kit/types";
import {
  MATERIALS, cellKey, isLoad, ohmsCurrent, parallelR, powerVI, seriesR, solve, sparkyPaths, type Grid, type MatId, type Tile,
} from "../src/town/circuit";
import { CIRCUITS, judge, parseBoard, searchSolution, solutionGrid, tileSig, type CircuitLevel } from "../src/town/circuitLevels";
import { BANDS, bandOf, gradeN, makeRng, type Band } from "../src/town/common";
import {
  HEATS, HOUSE, HOUSE_BASE_UA, SAMPLES, TANK, WATER_C, allChoices, convectionRun, coolK, handleT, heatUpT, houseSteady, houseT, newton, simulate, sunT, totalCost,
} from "../src/town/heat";
import { BANK } from "../src/town/bank";
import { Deck, bankItems, circuitGens, kitEnergyItems, mathGensFor, mathItem, misconceptions, teachesMisconception, type KitScience } from "../src/town/questions";
import { CONDUCTOR_TILES, RUN_MAPS, RunSim, WALKABLE, findTile, mapGrid, passable, routeToBulb, runTimer, type RDir } from "../src/town/run";
import { SAVE_KEY, freshSave, isOpen, litCount, loadSave, nextLevel, parseSave, recordRun, solveLevel, townLit, writeSave } from "../src/town/save";
import { DEFAULT_FOCUS, FOCUS_KEY, MIXED, OFFERED, focusFromUrl, loadFocus, parseFocus, saveFocus, topicAvailable, validateFocus, type Focus } from "../src/town/topics";
import { BUILDINGS, LEVEL_COUNT, LEVEL_IDS, levelById, levelFor } from "../src/town/town";

const t0 = Date.now();
let failures = 0;
let checks = 0;
function check(cond: boolean, msg: () => string) {
  checks++;
  if (!cond) {
    failures++;
    if (failures <= 80) console.error("FAIL:", msg());
  }
}
const near = (a: number, b: number, eps = 1e-6) => Math.abs(a - b) <= eps;

/* ================================================================== 1. circuit solver */

// Independent truth table: metals conduct, everything else here insulates.
const CONDUCTS: Record<MatId, boolean> = {
  copper: true, foil: true, clip: true, coin: true,
  rubber: false, plastic: false, wood: false, glass: false, string: false, eraser: false, paper: false,
};
for (const id of Object.keys(MATERIALS) as MatId[]) {
  check(MATERIALS[id].conductor === CONDUCTS[id], () => `material ${id}: game says conductor=${MATERIALS[id].conductor}`);
  check(id in CONDUCTS, () => `material ${id} missing from the truth table`);
  const why = MATERIALS[id].why.toLowerCase();
  check(CONDUCTS[id] ? /conduct/.test(why) : /insulator/.test(why), () => `material ${id} explanation "${why}"`);
}

/** Builds a grid from a quick map: B battery(−W +E unless rot), L bulb, S switch… using the level parser. */
function board(rows: string[], volts?: number[], ohms?: number[]): Grid {
  return parseBoard({ rows, volts, ohms }).grid;
}
const LOOP = ["┌ ─ L0 ─ ┐", "│ ~ ~ ~ │", "B1 ~ ~ ~ .", "│ ~ ~ ~ │", "└ ─ S0 ─ ┘"];
const put = (g: Grid, r: number, c: number, t: Tile | null) => {
  const n = g.map((row) => row.slice());
  n[r][c] = t;
  return n;
};

{
  const open = board(LOOP);
  const r0 = solve(open, { closed: true });
  check(!r0.allOn && !r0.anyOn && !r0.short, () => "a loop with a gap must not light");
  check(r0.breaks.some((b) => b.r === 2 && b.c === 4) || r0.breaks.some((b) => b.dir !== null && b.r === 1 && b.c === 4) || r0.breaks.some((b) => b.r === 3 && b.c === 4), () => "the gap is marked as a break");
  const wired = put(open, 2, 4, { kind: "wire", shape: "straight", rot: 1 });
  const r1 = solve(wired, { closed: true });
  check(r1.allOn && near(Math.abs(r1.loads[0].current), 0.5) && near(r1.loads[0].power, 0.75), () => `1.5 V across a 3 Ω bulb is 0.5 A, 0.75 W (got ${r1.loads[0]?.current})`);
  check(!solve(wired, { closed: false }).anyOn, () => "an open switch stops the current");
  check(solve(wired, { closed: false }).breaks.some((b) => b.why === "switch"), () => "the open switch is marked");
  check(sparkyPaths(wired, r1, { closed: true }).length > 0, () => "Sparky has a loop on a complete circuit");
  check(sparkyPaths(open, r0, { closed: true }).length === 0, () => "no Sparky loop on a broken circuit");
  const wrongWay = put(open, 2, 4, { kind: "wire", shape: "straight", rot: 0 });
  check(!solve(wrongWay, { closed: true }).anyOn, () => "a wire turned the wrong way leaves a gap");
  // conductors vs insulators, every material
  for (const id of Object.keys(CONDUCTS) as MatId[]) {
    const g = put(open, 2, 4, { kind: "material", mat: id, rot: 1 });
    const r = solve(g, { closed: true });
    check(r.allOn === CONDUCTS[id], () => `${id} in the gap: bulb ${r.allOn ? "on" : "off"}`);
    if (!CONDUCTS[id]) check(r.breaks.some((b) => b.why === "insulator" && b.r === 2 && b.c === 4), () => `${id} marked as the break`);
  }
  // no battery
  const noBat = put(wired, 2, 0, { kind: "wire", shape: "straight", rot: 1 });
  check(!solve(noBat, { closed: true }).anyOn, () => "no battery, no light");
  // polarity: same size, opposite sign
  const flipped = put(wired, 2, 0, { kind: "battery", volts: 1.5, rot: 3 });
  const rf = solve(flipped, { closed: true });
  check(rf.allOn && near(Math.abs(rf.loads[0].current), 0.5) && Math.sign(rf.loads[0].current) === -Math.sign(r1.loads[0].current), () => "turning the battery round reverses the current only");
  // short circuit: a wire straight across the battery
  const SHORT = ["┌ ─ L0 ─ ┐", "├ ┐ ~ ~ │", "B1 │ ~ ~ │", "├ ┘ ~ ~ │", "└ ─ S0 ─ ┘"];
  const rs = solve(board(SHORT), { closed: true });
  check(rs.short && !rs.anyOn && !rs.allOn && rs.loads.every((l) => !l.on && l.current === 0), () => "a short circuit never lights anything");
  check(rs.shortCells.length >= 3 && !isFinite(rs.batteryCurrent), () => "short circuit marks the hot wires and unlimited current");
  check(solve(board(SHORT), { closed: false }).short, () => "a short across the battery is a short even with the switch open");
  // series and parallel
  const SER = ["┌ ─ L0 ─ L0 ─ ┐", "│ ~ ~ ~ ~ ~ │", "B1 ~ ~ ~ ~ ~ │", "│ ~ ~ ~ ~ ~ │", "└ ─ ─ S0 ─ ─ ┘"];
  const ser = board(SER);
  const rser = solve(ser, { closed: true });
  check(rser.allOn && rser.loads.every((l) => near(Math.abs(l.current), 0.25) && near(Math.abs(l.voltage), 0.75)), () => "two bulbs in series share 1.5 V: 0.25 A each");
  check(rser.loads.every((l) => l.bright < r1.loads[0].bright), () => "series bulbs glow dimmer than one bulb alone");
  const serOut = solve(ser, { closed: true, out: new Set([cellKey(0, 2)]) });
  check(!serOut.anyOn, () => "series: one bulb out turns the other off");
  const PAR = ["┌ ─ ┬ L0 ─ ┬ ┐", "│ ~ │ ~ ~ │ │", "B1 ~ └ L0 ─ ┘ │", "│ ~ ~ ~ ~ ~ │", "└ ─ ─ S0 ─ ─ ┘"];
  const par = board(PAR);
  const rpar = solve(par, { closed: true });
  check(rpar.allOn && rpar.loads.every((l) => near(Math.abs(l.current), 0.5)) && near(rpar.batteryCurrent, 1), () => `parallel bulbs each get 0.5 A, battery 1 A (got ${rpar.batteryCurrent})`);
  check(rpar.loads.every((l) => near(l.bright, r1.loads[0].bright)), () => "parallel bulbs are as bright as one bulb alone");
  const parOut = solve(par, { closed: true, out: new Set([cellKey(0, 3)]) });
  check(parOut.loads.filter((l) => l.r === 2).every((l) => l.on) && near(parOut.batteryCurrent, 0.5), () => "parallel: one bulb out, the other stays on");
  // batteries in series add
  const TWO = ["┌ ─ L0 ─ ┐", "│ ~ ~ ~ │", "B1 ~ ~ ~ │", "B1 ~ ~ ~ │", "└ ─ S0 ─ ┘"];
  check(near(Math.abs(solve(board(TWO), { closed: true }).loads[0].current), 1), () => "two 1.5 V cells in series push 1 A through 3 Ω");
  // Ohm's law, power and equivalent resistance against the hand formulas
  const rng = makeRng(42);
  for (let k = 0; k < 60; k++) {
    const V = [1.5, 3, 6, 9, 12][Math.floor(rng() * 5)];
    const R1 = 1 + Math.floor(rng() * 12);
    const R2 = 1 + Math.floor(rng() * 12);
    const ohm = solve(board(["┌ ─ R0 ─ ┐", "│ ~ ~ ~ │", "B1 ~ ~ ~ │", "│ ~ ~ ~ │", "└ ─ S0 ─ ┘"], [V], [R1]), { closed: true });
    check(near(Math.abs(ohm.loads[0].current), ohmsCurrent(V, R1), 1e-6) && near(ohm.loads[0].power, powerVI(V, ohmsCurrent(V, R1)), 1e-6), () => `Ohm: ${V} V / ${R1} Ω`);
    const s2 = solve(board(["┌ ─ R0 ─ R0 ─ ┐", "│ ~ ~ ~ ~ ~ │", "B1 ~ ~ ~ ~ ~ │", "│ ~ ~ ~ ~ ~ │", "└ ─ ─ S0 ─ ─ ┘"], [V], [R1, R2]), { closed: true });
    check(near(s2.batteryCurrent, V / seriesR([R1, R2]), 1e-6), () => `series ${R1}+${R2} Ω`);
    check(near(Math.abs(s2.loads[0].voltage) + Math.abs(s2.loads[1].voltage), V, 1e-6), () => "series voltages add up to the battery's (Kirchhoff)");
    const p2 = solve(board(["┌ ─ ┬ R0 ─ ┬ ┐", "│ ~ │ ~ ~ │ │", "B1 ~ └ R0 ─ ┘ │", "│ ~ ~ ~ ~ ~ │", "└ ─ ─ S0 ─ ─ ┘"], [V], [R1, R2]), { closed: true });
    check(near(p2.batteryCurrent, V / parallelR([R1, R2]), 1e-6), () => `parallel ${R1}‖${R2} Ω`);
    check(near(Math.abs(p2.loads[0].current) + Math.abs(p2.loads[1].current), p2.batteryCurrent, 1e-6), () => "parallel branch currents add up (Kirchhoff)");
    check(near(p2.loads[0].power + p2.loads[1].power, V * p2.batteryCurrent, 1e-6), () => "power used = power supplied");
  }
  check(near(seriesR([2, 3, 5]), 10) && near(parallelR([6, 6]), 3) && near(parallelR([4, 6]), 2.4) && near(powerVI(120, 5), 600), () => "formula helpers");
}

/* ================================================================== 2. circuit levels */

function invOf(l: CircuitLevel): Map<string, number> {
  const m = new Map<string, number>();
  for (const t of l.tools) m.set(tileSig(t.tile), (m.get(tileSig(t.tile)) ?? 0) + t.count);
  for (const p of l.pre ?? []) m.set(tileSig(p.tile), (m.get(tileSig(p.tile)) ?? 0) + 1);
  return m;
}

let searchTries = 0;
for (const l of Object.values(CIRCUITS)) {
  const b = parseBoard(l);
  check(b.rows <= 5 && b.cols <= 8, () => `${l.id}: board ${b.rows}×${b.cols} is too big for the screen`);
  check(b.slots.flat().some(Boolean), () => `${l.id}: no slots`);
  const sol = solutionGrid(l);
  const v = judge(l, sol);
  check(v.win, () => `${l.id}: stored solution doesn't win (${v.message})`);
  check(sparkyPaths(sol, v.res, { closed: true }).length > 0, () => `${l.id}: Sparky has no loop on the solution`);
  // the solution only uses parts the player has
  const inv = invOf(l);
  for (const p of l.solution) {
    const k = tileSig(p.tile);
    inv.set(k, (inv.get(k) ?? 0) - 1);
    check(b.slots[p.r][p.c], () => `${l.id}: solution part off a slot at ${p.r},${p.c}`);
  }
  check([...inv.values()].every((n) => n >= 0), () => `${l.id}: the solution uses parts that aren't in the toolbox`);
  const start = judge(l, b.grid);
  check(!start.win, () => `${l.id}: the starting board already wins`);
  if (l.type === "short") {
    check(start.res.short && !start.res.anyOn, () => `${l.id}: should start as a short circuit that lights nothing`);
    check(/outlet/i.test(l.lesson) && /never/i.test(l.lesson), () => `${l.id}: needs the safety lesson`);
  }
  const found = searchSolution(l);
  check(!!found, () => `${l.id}: the solver found no way to win`);
  if (found) {
    searchTries += found.tries;
    check(judge(l, found.grid).win, () => `${l.id}: search result doesn't verify`);
  }
  // Swaps: each conductor in the solution swapped for an insulator loses; each wrong value loses.
  for (const p of l.solution) {
    if (p.tile.kind === "material") {
      for (const id of Object.keys(CONDUCTS) as MatId[]) {
        const g = put(sol, p.r, p.c, { ...p.tile, mat: id });
        check(judge(l, g).win === CONDUCTS[id], () => `${l.id}: ${id} at ${p.r},${p.c} → win ${judge(l, g).win}`);
      }
    }
    if ((p.tile.kind === "resistor" || p.tile.kind === "battery") && (l.type === "ohm" || l.type === "power")) {
      for (const t of l.tools) {
        if (t.tile.kind !== p.tile.kind || tileSig(t.tile) === tileSig(p.tile)) continue;
        const g = put(sol, p.r, p.c, { ...t.tile, rot: p.tile.rot });
        check(!judge(l, g).win, () => `${l.id}: ${tileSig(t.tile)} also wins`);
      }
      const wire = put(sol, p.r, p.c, p.tile.kind === "battery" ? null : { kind: "wire", shape: "straight", rot: p.tile.rot });
      check(!judge(l, wire).win, () => `${l.id}: leaving out the ${p.tile.kind} also wins`);
    }
  }
  if (l.win.type === "series") check(!solve(sol, { closed: true, out: new Set([cellKey(l.solution[0].r, l.solution[0].c)]) }).anyOn, () => `${l.id}: series solution keeps a bulb on with one out`);
  if (l.win.type === "parallel") {
    const r = judge(l, sol).res;
    const off = r.loads.find((x) => x.kind === "bulb")!;
    const r2 = solve(sol, { closed: true, out: new Set([cellKey(off.r, off.c)]) });
    check(r2.loads.filter((x) => !(x.r === off.r && x.c === off.c) && x.kind !== "resistor").every((x) => x.on), () => `${l.id}: parallel solution loses the others with one bulb out`);
  }
  check(l.intro.length > 20 && l.lesson.length > 20 && l.goal.length > 8, () => `${l.id}: texts`);
  for (const text of [l.intro, l.lesson, l.goal]) check(misconceptions(text).length === 0, () => `${l.id}: misconception in "${text}"`);
}
// A series level built in parallel doesn't count, and vice versa.
{
  const l = CIRCUITS["g35-parallel"];
  const g = solutionGrid(l);
  check(judge(l, g).win, () => "parallel solution wins");
  const asSeries = { ...l, win: { type: "series" as const } };
  check(!judge(asSeries, g).win, () => "a parallel circuit must not pass a series goal");
}

/* ================================================================== 3. heat model and levels */

{
  const rng = makeRng(7);
  for (let k = 0; k < 200; k++) {
    const room = -10 + rng() * 40;
    const T0 = -20 + rng() * 110;
    const R1 = 0.5 + rng() * 5;
    const R2 = R1 + 0.5 + rng() * 5; // better insulator
    let prev = T0;
    for (let i = 1; i <= 50; i++) {
      const t = i * 2;
      const a = newton(T0, room, coolK(R1, 20), t);
      const b = newton(T0, room, coolK(R2, 20), t);
      check(Math.abs(a - room) <= Math.abs(prev - room) + 1e-9, () => "cooling/warming always moves toward room temperature");
      check(Math.sign(a - room) === Math.sign(T0 - room) || Math.abs(a - room) < 1e-9, () => "never crosses room temperature");
      check(Math.abs(b - room) >= Math.abs(a - room) - 1e-9, () => "a better insulator changes more slowly");
      prev = a;
    }
    // radiation: warms from room toward a steady state above it, more for darker
    const s1 = sunT(room, 0.9, 1, 0.05, 30);
    const s2 = sunT(room, 0.25, 1, 0.05, 30);
    check(s1 > s2 && s2 > room && s1 < room + 0.9 / 0.05 + 1e-9, () => "darker surfaces absorb more sunlight and warm more");
    // conduction handles: metal factor/rate beats wood, both stay below the soup
    check(handleT(20, 90, 0.8, 0.5, 10) > handleT(20, 90, 0.1, 0.05, 10) && handleT(20, 90, 0.8, 0.5, 1000) < 90, () => "metal handle warms more but never past the soup");
  }
  // house: approaches its steady state monotonically; more insulation, warmer
  for (const ua of [10, 7, 5.6]) {
    const ss = houseSteady(HOUSE.out, HOUSE.power, ua);
    let prev = HOUSE.start;
    for (let h = 1; h <= 24; h++) {
      const T = houseT(HOUSE.start, HOUSE.out, HOUSE.power, ua, HOUSE.C, h);
      check(Math.abs(T - ss) <= Math.abs(prev - ss) + 1e-9 && Math.sign(T - ss) === Math.sign(HOUSE.start - ss), () => "house temperature heads straight to its steady state");
      prev = T;
    }
  }
  check(houseT(20, -8, 150, 6, 30, 12) > houseT(20, -8, 150, 9, 30, 12), () => "less heat loss (UA), warmer house");
  // convection: heater low warms the floor; heater high leaves it cold
  const [fl, ceilLow] = convectionRun(true, { start: 10, out: 0, minutes: 60 });
  const [fh, ch] = convectionRun(false, { start: 10, out: 0, minutes: 60 });
  check(fl[SAMPLES] > fh[SAMPLES] + 8 && ch[SAMPLES] > fh[SAMPLES] + 10 && Math.abs(fl[SAMPLES] - ceilLow[SAMPLES]) < 5, () => "convection: low heater mixes the room, high heater traps warm air up top");
  // Q = mcΔT
  check(near(heatUpT(20, TANK.watts, TANK.kg, WATER_C, 251, 600), 20 + (1000 * 251) / (2 * 4186)) && heatUpT(20, 1000, 2, 4186, 100, 50) < heatUpT(20, 1000, 2, 4186, 100, 100), () => "Q = m·c·ΔT heating");
  check(near((2 * 4186 * 30) / 1000, 251.16, 0.01), () => "the tank level's 251 s answer");
}

for (const l of Object.values(HEATS)) {
  const choices = allChoices(l);
  const runs = choices.map((c) => ({ c, r: simulate(l, c, "g68") }));
  const winners = runs.filter((x) => x.r.win);
  check(winners.length > 0, () => `${l.id}: no winning choice`);
  check(runs.some((x) => !x.r.win), () => `${l.id}: every choice wins`);
  for (const { c, r } of runs) {
    check(r.series.every((s) => s.pts.length === SAMPLES + 1 && s.pts.every(Number.isFinite)), () => `${l.id}: series samples`);
    check(r.verdict.length > 15 && misconceptions(r.verdict).length === 0, () => `${l.id}: verdict "${r.verdict}"`);
    if (l.type === "keep-hot" || l.type === "keep-cold") {
      for (const s of r.series) {
        for (let i = 1; i <= SAMPLES; i++) {
          check(Math.abs(s.pts[i] - l.room) <= Math.abs(s.pts[i - 1] - l.room) + 1e-9 && Math.sign(s.pts[i] - l.room) === Math.sign(l.start - l.room), () => `${l.id}/${s.id}: heads to room temperature without crossing`);
        }
      }
      // margins: losers miss by ≥ 2°C, winners clear by ≥ 2°C
      const end = r.end;
      if (l.type === "keep-hot") check(r.win ? end >= l.target! + 2 : end <= l.target! - 2, () => `${l.id}/${c}: ${end.toFixed(1)} too close to the goal`);
      else check(r.win ? end <= l.target! - 2 : end >= l.target! + 2, () => `${l.id}/${c}: ${end.toFixed(1)} too close to the goal`);
      // a better insulator (higher R) keeps it closer to where it started
      const sorted = [...l.options].sort((a, b) => a.value - b.value);
      const ends = sorted.map((o) => simulate(l, [o.id], "g68").end);
      check(ends.every((e, i) => i === 0 || Math.abs(e - l.start) <= Math.abs(ends[i - 1] - l.start) + 1e-9), () => `${l.id}: higher R should change less`);
    }
    if (l.type === "radiation" || l.type === "conduction") {
      check(winners.length === 1, () => `${l.id}: prediction levels need exactly one right answer`);
      const ends = r.series.map((s) => s.pts[SAMPLES]).sort((a, b) => b - a);
      check(ends[0] - ends[1] >= 2, () => `${l.id}: the top two are too close to tell apart`);
    }
    if (l.type === "insulate") {
      const cost = totalCost(l, c);
      if (cost > l.budget!) check(!r.win, () => `${l.id}: over budget must lose`);
      check(r.win ? r.end >= l.target! + 0.5 : cost > l.budget! || r.end <= l.target! - 0.5, () => `${l.id}/${c.join("+")}: ${r.end.toFixed(1)} too close to the goal`);
    }
    if (l.type === "heat-up") check(r.win === (c[0] === "251"), () => `${l.id}: ${c[0]} s`);
    if (l.type === "convection") check(r.win === (c[0] === "low"), () => `${l.id}: heater ${c[0]}`);
  }
  if (l.type === "insulate") {
    check(near(l.options.reduce((s, o) => s + (o.save ?? 0), 0), 5.9) && HOUSE_BASE_UA === 10, () => "house parts add up");
    check(winners.every((w) => w.c.includes("attic")), () => `${l.id}: every win should insulate the attic (warm air rises)`);
  }
  check(l.intro.length > 20 && l.lesson.length > 20, () => `${l.id}: texts`);
  for (const text of [l.intro, l.lesson, l.goal, l.question ?? ""]) check(misconceptions(text).length === 0, () => `${l.id}: misconception in "${text}"`);
  if (l.type === "keep-hot" || l.type === "keep-cold") check(/slow/i.test(l.lesson), () => `${l.id}: the lesson should say insulators slow heat flow`);
}

/* ================================================================== 4. Sparky Run */

for (let i = 0; i < RUN_MAPS.length; i++) {
  const m = RUN_MAPS[i];
  check(m.rows.every((r) => r.length === m.rows[0].length), () => `${m.name}: rows of different widths`);
  check(m.rows.length === 10, () => `${m.name}: 10 rows fill the screen`);
  check(m.rows[0].split("").every((ch) => ch === "#") && m.rows[m.rows.length - 1].split("").every((ch) => ch === "#"), () => `${m.name}: top and bottom are insulator walls`);
  check(m.rows.every((r) => !WALKABLE.has(r[0]) && !WALKABLE.has(r[r.length - 1])), () => `${m.name}: left and right edges are walls`);
  const g = mapGrid(i);
  check(g.flat().filter((ch) => ch === "+").length === 1 && g.flat().filter((ch) => ch === "B").length === 1, () => `${m.name}: one battery, one bulb`);
  check(g.flat().every((ch) => WALKABLE.has(ch) || ch === "#" || ch === "."), () => `${m.name}: unknown tile`);
  check(!passable("#", true, true, 9) && !passable(".", true, true, 9), () => "insulators are never walkable");
  const route = routeToBulb(g);
  check(!!route, () => `${m.name}: the bulb can't be reached along conductors`);
  if (!route) continue;
  // every tile on the route is a conductor
  let [r, c] = findTile(g, "+");
  const DRr = [-1, 0, 1, 0];
  const DCc = [0, 1, 0, -1];
  for (const d of route) {
    r += DRr[d];
    c += DCc[d];
    check(CONDUCTOR_TILES.has(g[r][c]), () => `${m.name}: route crosses a non-conductor at ${r},${c}`);
  }
  // the switch and fan maps really need them
  if (g.flat().includes("g")) {
    const noSwitch = g.map((row) => row.map((ch) => (ch === "s" ? "=" : ch)));
    check(!routeToBulb(noSwitch), () => `${m.name}: should need the switch pad`);
  }
  // Hot Wire Alley's only way through is the hot wire (the fan is needed); elsewhere hot wires can also be avoided.
  if (m.name === "Hot Wire Alley") {
    const noFan = g.map((row) => row.map((ch) => (ch === "f" ? "=" : ch)));
    check(!routeToBulb(noFan), () => `${m.name}: should need the fan to cool the hot wire`);
  }
  // drive the sim along the route for every band
  for (const band of BANDS) {
    const sim = new RunSim(i, band);
    const tiles: [number, number][] = [[sim.r, sim.c]];
    for (const d of route) tiles.push([tiles[tiles.length - 1][0] + DRr[d], tiles[tiles.length - 1][1] + DCc[d]]);
    let idx = 0;
    let time = 0;
    const events: string[] = [];
    while (!sim.done && time < 200) {
      while (idx + 1 < tiles.length && tiles[idx + 1][0] === sim.r && tiles[idx + 1][1] === sim.c) idx++;
      if (sim.t > 0) {
        const nx = route[idx + 1];
        if (nx !== undefined && nx !== (((sim.dir ?? 0) + 2) % 4)) sim.want = nx as RDir;
      } else if (route[idx] !== undefined) sim.want = route[idx];
      sim.update(1 / 60);
      time += 1 / 60;
      for (const e of sim.drainEvents()) events.push(e.type);
    }
    check(sim.done && events.includes("goal") && sim.stars >= 1, () => `${m.name}/${band}: driving the route didn't light the bulb (${events.join(",")})`);
    const lim = runTimer(band);
    check(band === "k2" ? lim === null : lim !== null && sim.time < lim * 0.6, () => `${m.name}/${band}: timer ${lim} vs ${sim.time.toFixed(1)} s`);
  }
  // steering into a wall stops Sparky; it never leaves conductors
  const sim = new RunSim(i, "g35");
  for (let k = 0; k < 600; k++) {
    if (k % 40 === 0) sim.steer((Math.floor(k / 40) % 4) as RDir);
    sim.update(1 / 30);
    const ch = sim.grid[sim.r][sim.c];
    check(WALKABLE.has(ch), () => `${m.name}: Sparky stood on "${ch}"`);
    if (sim.done) break;
  }
}

/* ================================================================== 5. questions */

const kitFiles: Partial<Record<Grade, Question[]>> = {};
for (const g of GRADES) kitFiles[g] = ((await import(`../src/kit/banks/science/g${g}.ts`)) as { default: Question[] }).default;
const kit: KitScience = (g) => kitFiles[g] ?? [];

// The guard itself.
for (const bad of ["Foam makes cold.", "The cooler adds cold to the ice pops.", "Cold flows into your hand.", "Heat flows from the colder ice to the hand.", "The metal is colder than the wood.", "Insulation gives warmth.", "There is cold energy in ice."]) {
  check(misconceptions(bad).length > 0, () => `guard misses "${bad}"`);
}
for (const ok of ["Foam doesn't make cold; it slows heat.", "Heat flows from warmer to cooler.", "Insulators don't add cold or heat.", "Cold doesn't flow; heat does.", "Metal conducts heat away from your hand."]) {
  check(misconceptions(ok).length === 0, () => `guard flags "${ok}"`);
}

const STD_SCI = /^(PS|ESS|LS)\.(K|\d+|Phy|Chm|Bio|EES)(\.\d+)*$/;
const STD_MATH = /^NC\.(K|\d+|M\d)\.[A-Z]/;
function validQ(q: Question, where: string) {
  check(q.choices.length === 4 && new Set(q.choices.map((c) => c.trim().toLowerCase())).size === 4 && q.choices.every((c) => c.trim().length > 0), () => `${where} ${q.id}: choices ${JSON.stringify(q.choices)}`);
  check(Number.isInteger(q.answer) && q.answer >= 0 && q.answer < 4, () => `${where} ${q.id}: answer ${q.answer}`);
  check(q.explanation.trim().length >= 15, () => `${where} ${q.id}: explanation`);
  check(q.prompt.trim().length >= 8, () => `${where} ${q.id}: prompt`);
  check(q.subject === "science" ? STD_SCI.test(q.standard) : STD_MATH.test(q.standard), () => `${where} ${q.id}: standard "${q.standard}"`);
  check(!teachesMisconception(q), () => `${where} ${q.id}: teaches a misconception: ${misconceptions(q.explanation).join(" | ")} / ${q.choices[q.answer]}`);
}

for (const b of BANDS) {
  check(BANK[b].length >= 15, () => `${b}: only ${BANK[b].length} own questions`);
  check(new Set(BANK[b].map((x) => x.id)).size === BANK[b].length, () => `${b}: duplicate ids`);
  const areas = new Set(BANK[b].map((x) => x.area));
  check(areas.has("electric") && areas.has("heat") && areas.has("safety"), () => `${b}: needs electricity, heat and safety items`);
  // Metal feels colder: equal temperature, conduction.
  const mf = BANK[b].find((x) => x.id === "metal-feels-colder");
  if (b !== "k2") {
    check(!!mf, () => `${b}: missing the metal-feels-colder item`);
    if (mf) {
      check(/conduct|pulls heat/i.test(mf.choices[0]), () => `${b}: metal-feels-colder answer "${mf.choices[0]}"`);
      check(/same temperature|both are/i.test(mf.explanation) && /conduct/i.test(mf.explanation), () => `${b}: metal-feels-colder explanation`);
      check(mf.choices.slice(1).some((c) => /colder|lower temperature/i.test(c)), () => `${b}: metal-feels-colder should offer the misconception as a wrong answer`);
    }
  }
  // Heat direction items: the right answer is warm → cool.
  for (const it of BANK[b]) {
    if (/heat always moves from/i.test(it.prompt)) check(/warm|hot/i.test(it.choices[0].split(" to ")[0]), () => `${b}/${it.id}: heat must flow from warmer to cooler`);
    if (/foam cooler|foam/i.test(it.prompt) && it.area === "heat") check(/slow/i.test(it.choices[0]) || /insulator/i.test(it.explanation), () => `${b}/${it.id}: foam slows heat`);
  }
}

const deckCounts: string[] = [];
for (const g of GRADES) {
  const own = bankItems(g);
  const kitItems = kitEnergyItems(g, kit);
  check(own.length >= 15, () => `${g}: ${own.length} own questions`);
  for (const q of [...own, ...kitItems]) validQ(q, `science@${g}`);
  check(own.every((q) => q.grade === g), () => `${g}: bank items carry the player's grade`);
  if ([4, 6, 12].includes(gradeN(g))) check(kitItems.length >= 3, () => `${g}: kit energy items ${kitItems.length}`);
  check(kitItems.every((q) => q.grade === g), () => `${g}: kit items from the same grade`);
  deckCounts.push(`${g}:${own.length}+${kitItems.length}`);
  // math topics
  for (const topic of ["numbers", "algebra"] as const) {
    const avail = topicAvailable(topic, g);
    check(avail === mathGensFor(g, topic).length > 0, () => `${g}: ${topic} offered=${avail} but generators=${mathGensFor(g, topic).length}`);
    if (avail) for (let k = 0; k < 20; k++) {
      const q = mathItem(g, topic, makeRng(k * 31 + gradeN(g)));
      check(!!q, () => `${g}/${topic}: no question`);
      if (q) validQ(q, `${topic}@${g}`);
    }
  }
  for (let k = 0; k < 10; k++) {
    const q = mathItem(g, "all", makeRng(k));
    check(!!q, () => `${g}: all math`);
    if (q) validQ(q, `math@${g}`);
  }
  // the deck follows the focus
  const focuses: Focus[] = [DEFAULT_FOCUS, { subject: "math", topic: "all" }, MIXED];
  if (topicAvailable("algebra", g)) focuses.push({ subject: "math", topic: "algebra" });
  if (topicAvailable("numbers", g)) focuses.push({ subject: "math", topic: "numbers" });
  for (const f of focuses) {
    const d = new Deck(g, f, kit, makeRng(5));
    const seen = new Set<string>();
    for (let k = 0; k < 24; k++) {
      const q = d.next(k % 2 ? "heat" : "electric");
      validQ(q, `deck@${g}/${f.subject}`);
      if (f.subject === "science") check(q.subject === "science", () => `${g}: SCIENCE asked ${q.subject}`);
      if (f.subject === "math") check(q.subject === "math", () => `${g}: MATH asked ${q.subject}`);
      if (f.subject === "mixed") check(q.subject === (k % 2 ? "math" : "science"), () => `${g}: MIXED should alternate`);
      if (f.subject === "math" && f.topic === "algebra") check(/EE|A-|F-|AF/.test(q.standard), () => `${g}: algebra asked ${q.standard}`);
      if (f.subject === "science" && k < 16) {
        check(!seen.has(q.id), () => `${g}: repeated ${q.id} too soon`);
        seen.add(q.id);
        if (k % 2) check(q.area === "heat", () => `${g}: after a heat level, ask about heat (got ${q.area})`);
      }
    }
  }
}

// Formula questions recomputed from their own numbers.
for (const g of ["6", "7", "8", "9", "12"] as Grade[]) {
  for (let k = 0; k < 40; k++) {
    for (const gen of circuitGens(g, makeRng(k + 1))) {
      const d = gen.make();
      const nums = (d.prompt.match(/\d+(\.\d+)?/g) ?? []).map(Number);
      let want = "";
      if (gen.key === "vir-eval") want = String(nums[0] * nums[1]);
      if (gen.key === "vir-solve") want = String(nums[0] / nums[1]);
      if (gen.key === "series-solve") want = String((nums[1] - nums[0]) / 2);
      if (gen.key === "power-solve") want = `I = P ÷ V = ${nums[0] / nums[1]} A`;
      check(d.answer === want, () => `${gen.key}@${g}: "${d.prompt}" answer ${d.answer}, want ${want}`);
      check(!d.wrong.includes(d.answer) && new Set(d.wrong).size === 3, () => `${gen.key}: wrong choices ${JSON.stringify(d.wrong)} vs ${d.answer}`);
    }
  }
}
check(circuitGens("5").length === 0, () => "formula questions start in grade 6");

/* ================================================================== 6. saving */

{
  const mem = new Map<string, string>();
  const store = { getItem: (k: string) => mem.get(k) ?? null, setItem: (k: string, v: string) => void mem.set(k, v) };
  check(SAVE_KEY.startsWith("arcade.power-up-town.") && FOCUS_KEY.startsWith("arcade.power-up-town."), () => "storage keys start with arcade.power-up-town.");
  let s = freshSave();
  for (const b of BANDS) {
    check(isOpen(s, b, 0) && !isOpen(s, b, 1) && nextLevel(s, b) === 0 && litCount(s, b) === 0, () => `${b}: a new town has only the first building open`);
  }
  s = solveLevel(s, "g35", 0);
  check(isOpen(s, "g35", 1) && !isOpen(s, "g35", 2) && s.g35.solved[0] && !s.k2.solved[0], () => "solving building 1 opens building 2 in that band only");
  s = recordRun(s, "g35", 0, 2);
  s = recordRun(s, "g35", 0, 1);
  check(s.g35.run[0] === 2, () => "run stars keep the best");
  writeSave(s, store);
  const back = loadSave(store);
  check(back.g35.solved[0] && back.g35.run[0] === 2 && !back.g35.solved[1], () => "save round trip");
  check(parseSave("{bad json").k2.solved.every((x) => !x), () => "corrupt save starts fresh");
  check(parseSave(JSON.stringify({ k2: { solved: [true, "yes", 1], run: [9, -3] } })).k2.run[0] === 3 && !parseSave(JSON.stringify({ k2: { solved: [true, "yes"] } })).k2.solved[1], () => "save values are clamped");
  let all = freshSave();
  for (let i = 0; i < LEVEL_COUNT; i++) {
    check(isOpen(all, "hs", i), () => `building ${i} should be open in order`);
    all = solveLevel(all, "hs", i);
  }
  check(townLit(all, "hs") && !townLit(all, "k2") && nextLevel(all, "hs") === LEVEL_COUNT - 1, () => "the whole town lights up");
  // replaying never locks anything again
  check(isOpen(solveLevel(all, "hs", 3), "hs", 5), () => "replays keep buildings open");
}

/* ================================================================== 7. subject / topic picker */

{
  const G = (g: string) => g as Grade;
  check(JSON.stringify(focusFromUrl("?topic=physical", G("3")).focus) === JSON.stringify(DEFAULT_FOCUS), () => "?topic=physical → SCIENCE");
  check(JSON.stringify(focusFromUrl("?topic=algebra", G("10")).focus) === JSON.stringify({ subject: "math", topic: "algebra" }), () => "?topic=algebra at 10");
  const kAlg = focusFromUrl("?topic=algebra", G("K"));
  check(kAlg.unavailable === "algebra" && kAlg.focus?.subject === "math" && kAlg.focus.topic === "all", () => "?topic=algebra at K falls back to ALL MATH with a note");
  check(focusFromUrl("?topic=numbers", G("11")).unavailable === "numbers", () => "numbers is K-8");
  check(JSON.stringify(focusFromUrl("?topic=science-mix", G("5")).focus) === JSON.stringify(DEFAULT_FOCUS), () => "science-mix");
  check(JSON.stringify(focusFromUrl("?topic=math-mix", G("5")).focus) === JSON.stringify({ subject: "math", topic: "all" }), () => "math-mix");
  check(JSON.stringify(focusFromUrl("?subject=mixed", G("5")).focus) === JSON.stringify(MIXED), () => "?subject=mixed");
  check(focusFromUrl("?topic=geometry", G("5")).focus === null && focusFromUrl("", G("5")).focus === null, () => "unknown topic ignored");
  check(JSON.stringify(validateFocus({ subject: "math", topic: "algebra" }, G("2"))) === JSON.stringify({ subject: "math", topic: "all" }), () => "validate drops a topic the grade lacks");
  check(JSON.stringify(parseFocus(null)) === JSON.stringify(DEFAULT_FOCUS) && JSON.stringify(parseFocus("garbage")) === JSON.stringify(DEFAULT_FOCUS), () => "SCIENCE is the default");
  const mem = new Map<string, string>();
  const store = { getItem: (k: string) => mem.get(k) ?? null, setItem: (k: string, v: string) => void mem.set(k, v) };
  saveFocus({ subject: "math", topic: "numbers" }, store);
  check(JSON.stringify(loadFocus(store)) === JSON.stringify({ subject: "math", topic: "numbers" }), () => "focus round trip");
  for (const g of GRADES) for (const t of ["physical", "numbers", "algebra"] as const) check(topicAvailable(t, g) === OFFERED[t].includes(gradeN(g)), () => "OFFERED");
}

/* ================================================================== 8. the town */

for (const b of BANDS) {
  const ids = LEVEL_IDS[b];
  check(ids.length === LEVEL_COUNT && BUILDINGS.length === LEVEL_COUNT, () => `${b}: ${ids.length} levels for ${BUILDINGS.length} buildings`);
  check(new Set(ids).size === ids.length && ids.every((id) => id.startsWith(`${b}-`)), () => `${b}: level ids`);
  const kinds = ids.map((id) => levelById(id).kind);
  check(kinds.includes("circuit") && kinds.includes("heat") && kinds[0] === "circuit", () => `${b}: needs circuits and heat labs, starting with a circuit`);
  check(levelFor(b, LEVEL_COUNT - 1).id === ids[LEVEL_COUNT - 1], () => "levelFor");
  const types = ids.map((id) => levelById(id)).map((l) => l.type);
  check(types.includes("short"), () => `${b}: needs a short-circuit safety level`);
  if (b !== "k2") check(types.includes("parallel") || types.includes("equiv"), () => `${b}: needs series/parallel`);
  if (b === "hs") check(["ohm", "power", "equiv", "heat-up", "insulate"].every((x) => types.includes(x as never)), () => "hs: Ohm, power, equivalent resistance, Q=mcΔT, R-values");
  if (b !== "k2") check(["keep-hot", "keep-cold", "insulate", "conduction", "convection"].filter((x) => types.includes(x as never)).length >= 3, () => `${b}: heat topics`);
}
check(Object.keys(CIRCUITS).every((id) => BANDS.some((b) => LEVEL_IDS[b].includes(id))) && Object.keys(HEATS).every((id) => BANDS.some((b) => LEVEL_IDS[b].includes(id))), () => "every level is on a street");
check(BANDS.every((b) => bandOf((b === "k2" ? "1" : b === "g35" ? "4" : b === "g68" ? "7" : "10") as Grade) === b), () => "bands");
check(isLoad({ kind: "bulb", rot: 0 }) && !isLoad({ kind: "wire", rot: 0 }), () => "loads");

/* ================================================================== the game's real wiring (Vite SSR) */

{
  const { createServer } = await import("vite");
  const server = await createServer({ configFile: new URL("../vite.config.ts", import.meta.url).pathname, server: { middlewareMode: true, hmr: false }, appType: "custom", logLevel: "error" });
  try {
    const mod = (await server.ssrLoadModule("/src/town/kitwire.ts")) as typeof import("../src/town/kitwire");
    for (const g of GRADES) check(mod.kitScience(g).length === (kitFiles[g]?.length ?? -1), () => `real kit bank at ${g}`);
  } finally {
    await server.close();
  }
}

const own = BANDS.map((b) => `${b} ${BANK[b].length}`).join(", ");
console.log(`${checks} checks, ${failures} failures (${((Date.now() - t0) / 1000).toFixed(1)} s)`);
console.log(`Circuit levels: ${Object.keys(CIRCUITS).length} (search tried ${searchTries} boards). Heat levels: ${Object.keys(HEATS).length}. Run maps: ${RUN_MAPS.length}.`);
console.log(`Own questions: ${own}. Science per grade (own+kit): ${deckCounts.join(" ")}.`);
if (failures) {
  console.error(`${failures} check(s) failed`);
  process.exit(1);
}
console.log("All Power Up Town checks passed.");
