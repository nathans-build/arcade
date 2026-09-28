/*
 * Maze Muncher checks (npm test → npx tsx scripts/check-maze.ts):
 * - every maze: symmetric, walled, 4 corner pellets, every dot / pellet / item / exit reachable
 *   from the hero start, no dead ends, pen reachable through the door, tunnels wrap;
 * - the hero really wraps through each tunnel in the simulation;
 * - every quick question choice for every grade can be drawn by the bitmap font and fits
 *   beside every pellet of that grade's mazes at that grade's label size;
 * - critters never get stuck, never enter walls, and all leave the pen (long headless runs);
 * - difficulty: critters slower than the hero at every grade and level, K–2 gentler;
 * - question cycle: any of A–D can be locked in; right → dizzy critters, wrong → revealed
 *   answer and fired-up critters; afterwards a fresh question with four new pellets.
 */
import type { Grade, Question } from "../src/kit/types";
import { mathQuestion } from "../src/kit/math";
import { hasGlyphs, measure, missingGlyphs } from "../src/maze/font";
import { boxFits, geometry, labelBox, labelLayout, maxLinesFor, textWidthFor } from "../src/maze/labels";
import {
  BIG_MAZES, SMALL_MAZES, canGo, cellAt, distancesFrom, heroTiles, mirrorHalf, openDirs, stepTile, type Maze,
} from "../src/maze/maze";
import { BIG_LAYOUTS, SMALL_LAYOUTS } from "../src/maze/layouts";
import { MazeSim } from "../src/maze/sim";
import { bandOf, mazeFor, rageSpeed, tuningFor } from "../src/maze/tuning";

const GRADES: Grade[] = ["K", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];

let failures = 0;
let checks = 0;
function check(cond: boolean, msg: () => string) {
  checks++;
  if (!cond) {
    failures++;
    if (failures <= 60) console.error("FAIL:", msg());
  }
}

function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ------------------------------------------------------------ mazes */

const ALL: Maze[] = [...BIG_MAZES, ...SMALL_MAZES];
check(BIG_MAZES.length >= 2 && SMALL_MAZES.length >= 2, () => "need at least 2 big and 2 small mazes");

for (const def of [...BIG_LAYOUTS, ...SMALL_LAYOUTS]) {
  const w = def.half[0].length;
  check(def.half.every((r) => r.length === w), () => `${def.name}: half rows differ in width`);
  check(/^[#.o=pHF ]+$/.test(def.half.join("")), () => `${def.name}: unknown cell characters`);
}

for (const m of ALL) {
  const n = m.name;
  check(m.cells.every((r) => r === [...r].reverse().join("")), () => `${n}: not symmetric`);
  check(/^#+$/.test(m.cells[0]) && /^#+$/.test(m.cells[m.rows - 1]), () => `${n}: top/bottom border must be wall`);
  for (let y = 0; y < m.rows; y++) {
    const edgeOpen = m.cells[y][0] !== "#";
    check(edgeOpen === m.tunnelRows.includes(y), () => `${n}: row ${y} edge/tunnel mismatch`);
  }
  check(m.tunnelRows.length >= 1, () => `${n}: needs a wrap-around tunnel`);
  check(m.pellets.length === 4, () => `${n}: needs exactly 4 pellets, has ${m.pellets.length}`);
  const [a, b, c, d] = m.pellets;
  check(a.x < m.cols / 2 && b.x > m.cols / 2 && c.x < m.cols / 2 && d.x > m.cols / 2, () => `${n}: pellets A/C left, B/D right`);
  check(a.y < m.rows / 2 && b.y < m.rows / 2 && c.y > m.rows / 2 && d.y > m.rows / 2, () => `${n}: pellets A/B top, C/D bottom`);
  check(m.pen.length >= 3, () => `${n}: pen too small`);
  check(cellAt(m, m.exit.x, m.exit.y) !== "#", () => `${n}: pen exit blocked`);

  // Reachability from the hero start.
  const dist = distancesFrom(m, m.hero, "hero");
  const reach = (t: { x: number; y: number }) => dist[t.y][t.x] < Infinity;
  check(m.dots.every(reach), () => `${n}: unreachable dots ${m.dots.filter((t) => !reach(t)).map((t) => `${t.x},${t.y}`).join(" ")}`);
  check(m.pellets.every(reach), () => `${n}: unreachable pellet`);
  check(reach(m.item) && reach(m.exit), () => `${n}: item spot or pen exit unreachable`);
  check(heroTiles(m).every(reach), () => `${n}: some open floor is unreachable`);
  check(m.dots.length > 80, () => `${n}: only ${m.dots.length} dots`);
  // No dead ends anywhere the hero or critters walk (critters don't reverse at will).
  for (const t of heroTiles(m)) {
    check(openDirs(m, t.x, t.y, "hero").length >= 2, () => `${n}: dead end at ${t.x},${t.y}`);
  }
  // Pen: every pen tile reaches the exit through the door, and back.
  const penDist = distancesFrom(m, m.exit, "pen");
  check(m.pen.every((t) => penDist[t.y][t.x] < Infinity), () => `${n}: pen not connected to exit`);
  check(!canGo(m, m.exit.x, m.exit.y, 2, "hero") && !canGo(m, m.exit.x, m.exit.y, 2, "critter"), () => `${n}: door must block the hero and roaming critters`);
  // Tunnel wrap.
  for (const ty of m.tunnelRows) {
    const l = stepTile(m, 0, ty, 1);
    const r = stepTile(m, m.cols - 1, ty, 3);
    check(l.x === m.cols - 1 && l.y === ty, () => `${n}: tunnel left from col 0 should wrap to ${m.cols - 1}, got ${l.x}`);
    check(r.x === 0 && r.y === ty, () => `${n}: tunnel right should wrap to 0`);
    check(canGo(m, 0, ty, 1, "hero") && canGo(m, m.cols - 1, ty, 3, "hero"), () => `${n}: tunnel ends must be open`);
  }
  check(mirrorHalf(["#ab"])[0] === "#aba#", () => "mirrorHalf");
}

/* ------------------------------------------------------------ hero tunnel run in the sim */

for (const g of ["K", "5"] as Grade[]) {
  for (let level = 1; level <= 3; level++) {
    const sim = new MazeSim(g, { rng: mulberry32(level) });
    sim.loadMaze(level);
    const m = sim.maze;
    const ty = m.tunnelRows[0];
    sim.critters = [];
    sim.phase = "play";
    for (const dir of [1, 3] as const) {
      const startX = dir === 1 ? 3 : m.cols - 4;
      sim.hero = { x: startX, y: ty, dir, want: dir, facing: dir };
      let wrapped = false;
      let prev = sim.hero.x;
      for (let i = 0; i < 60; i++) {
        sim.step(1 / 30);
        const x = sim.hero.x;
        check(x >= -0.5 && x < m.cols - 0.5, () => `${m.name}: hero x ${x} out of range while wrapping`);
        check(Math.abs(sim.hero.y - ty) < 1e-9, () => `${m.name}: hero left the tunnel row`);
        if (Math.abs(x - prev) > m.cols / 2) wrapped = true;
        prev = x;
      }
      check(wrapped, () => `${m.name}: hero did not wrap through the tunnel going ${dir === 1 ? "left" : "right"}`);
    }
  }
}

/* ------------------------------------------------------------ labels */

async function quickQuestions(g: Grade): Promise<Question[]> {
  const out: Question[] = [];
  for (const s of ["science", "ela", "social"]) {
    let mod: { default: Question[] } | null = null;
    try {
      mod = (await import(`../src/kit/banks/${s}/g${g}.ts`)) as { default: Question[] };
    } catch {
      mod = null; // no bank for this subject and grade
    }
    if (mod) out.push(...mod.default.filter((q) => q.quick));
  }
  for (let i = 0; i < 1500; i++) out.push(mathQuestion(g, { quick: true }));
  return out;
}

let labelCount = 0;
let splitWords = 0;
const scaleUse: Record<string, [number, number]> = {};
for (const g of GRADES) {
  const qs = await quickQuestions(g);
  check(qs.length > 100, () => `grade ${g}: too few quick questions`);
  const t = tuningFor(g, 1);
  const mazes = bandOf(g) === 0 ? SMALL_MAZES : BIG_MAZES;
  check(mazes.every((m, i) => mazeFor(g, i + 1) === m), () => `grade ${g}: maze order`);
  const seen = new Set<string>();
  scaleUse[g] = [0, 0];
  for (const q of qs) {
    check(q.prompt.length <= 100 && q.choices.every((c) => c.length <= 14), () => `grade ${g}: quick question too long: ${q.id}`);
    check(new Set(q.choices).size === 4, () => `grade ${g}: duplicate choices in ${q.id}`);
    check(q.answer >= 0 && q.answer < 4, () => `grade ${g}: bad answer index in ${q.id}`);
    for (const c of q.choices) {
      if (seen.has(c)) continue;
      seen.add(c);
      check(hasGlyphs(c), () => `grade ${g}: font can't draw "${c}" (${missingGlyphs(c).join(" ")})`);
      for (const m of mazes) {
        const geo = geometry(m);
        m.pellets.forEach((p, i) => {
          const lay = labelLayout(c, geo, p.y, i, t.labelScale);
          labelCount++;
          scaleUse[g][lay.scale - 1]++;
          if (lay.broken) splitWords++;
          check(lay.lines.length <= maxLinesFor(geo, p.y, i, lay.scale), () => `grade ${g} ${m.name}: "${c}" needs ${lay.lines.length} lines`);
          check(lay.lines.every((l) => measure(l, lay.scale) <= textWidthFor(geo)), () => `grade ${g} ${m.name}: "${c}" too wide`);
          const box = labelBox(geo, p.y, i, lay);
          check(boxFits(geo, box, i), () => `grade ${g} ${m.name}: label box for "${c}" at ${"ABCD"[i]} leaves its panel ${JSON.stringify(box)}`);
          check(!lay.broken || bandOf(g) > 0 || /\d/.test(c), () => `grade ${g}: K–2 word split: "${c}"`);
        });
      }
    }
  }
}

/* ------------------------------------------------------------ difficulty */

for (const g of GRADES) {
  for (let level = 1; level <= 12; level++) {
    const t = tuningFor(g, level);
    check(t.critterSpeed < t.heroSpeed, () => `grade ${g} level ${level}: critters as fast as the hero`);
    check(rageSpeed(t) <= t.heroSpeed, () => `grade ${g} level ${level}: fired-up critters faster than the hero`);
    check(t.frightTime >= 3, () => `grade ${g}: dizzy time too short`);
  }
  const t = tuningFor(g, 1);
  if (bandOf(g) === 0) {
    check(t.critters.length >= 2 && t.critters.length <= 3, () => `grade ${g}: K–2 should have 2–3 critters`);
    check(t.frightTime > tuningFor("5", 1).frightTime, () => `grade ${g}: K–2 should have longer dizzy time`);
    check(t.critterSpeed < tuningFor("5", 1).critterSpeed, () => `grade ${g}: K–2 critters should be slower`);
  } else check(t.critters.length === 4, () => `grade ${g}: 4 critters expected`);
}
for (let b = 1; b < 4; b++) {
  const g = (["K", "4", "7", "10"] as Grade[])[b];
  const prev = (["K", "4", "7", "10"] as Grade[])[b - 1];
  check(tuningFor(g).critterSpeed > tuningFor(prev).critterSpeed, () => `critters should speed up by band (${prev} → ${g})`);
}

/* ------------------------------------------------------------ question cycle */

for (const g of ["K", "3", "8", "11"] as Grade[]) {
  for (let pick = 0; pick < 4; pick++) {
    const sim = new MazeSim(g, { rng: mulberry32(pick + 7), ask: () => 2 });
    check(sim.qPhase === "ask" && sim.pelletLive.every(Boolean), () => `grade ${g}: a maze should open with a question and 4 pellets`);
    sim.step(0.1);
    check(sim.answer(pick), () => `grade ${g}: answer ${"ABCD"[pick]} should be accepted`);
    check(sim.phase === "play", () => `grade ${g}: answering during READY should start play`);
    check(sim.pelletLive.every((p) => !p), () => `grade ${g}: pellets should clear after an answer`);
    check(!sim.answer((pick + 1) % 4), () => `grade ${g}: a second answer should be refused`);
    if (pick === 2) {
      check(sim.qPhase === "power" && sim.critters.every((c) => c.frightened), () => `grade ${g}: right answer → dizzy critters`);
      check(sim.streak === 1, () => "streak should count right answers");
    } else {
      check(sim.qPhase === "rage" && sim.revealIdx === 2, () => `grade ${g}: wrong answer → reveal the right pellet`);
      check(sim.critters.every((c) => !c.frightened), () => `grade ${g}: wrong answer should not make critters dizzy`);
    }
    // Run until a fresh question appears (hero parked safely: critters removed).
    sim.critters = [];
    let fresh = false;
    for (let i = 0; i < 30 * 20 && !fresh; i++) {
      sim.step(1 / 30);
      fresh = sim.qPhase === "ask" && sim.pelletLive.every(Boolean);
    }
    check(fresh, () => `grade ${g}: a new question should follow the power phase`);
  }
}

// Eating a pellet by walking onto it answers too.
{
  const sim = new MazeSim("4", { ask: () => 0 });
  const m = sim.maze;
  const p = m.pellets[0];
  sim.critters = [];
  sim.phase = "play";
  sim.hero = { x: p.x, y: p.y + 2, dir: 0, want: 0, facing: 0 };
  for (let i = 0; i < 30 && sim.qPhase === "ask"; i++) sim.step(1 / 30);
  check(sim.qPhase === "power", () => "walking onto the right pellet should answer it");
}

/* ------------------------------------------------------------ long runs: critters never stuck */

let simSeconds = 0;
for (const g of ["K", "1", "4", "7", "10"] as Grade[]) {
  for (let seed = 1; seed <= 4; seed++) {
    const rng = mulberry32(seed * 101 + g.charCodeAt(0));
    const sim = new MazeSim(g, { rng, demo: true });
    const lastMove = new Map<number, { x: number; y: number; t: number }>();
    let t = 0;
    const dt = 1 / 60;
    let mazes = 1;
    let everLeft = new Set<number>();
    for (let i = 0; i < 60 * 150; i++) {
      // A twitchy player: new wants now and then, answers at random.
      if (rng() < 0.02) sim.setWant(Math.floor(rng() * 4) as 0 | 1 | 2 | 3);
      if (sim.qPhase === "ask" && rng() < 0.01) sim.answer(Math.floor(rng() * 4));
      sim.step(dt);
      t += dt;
      if (sim.phase === "waiting") {
        sim.nextMaze(true);
        mazes++;
        lastMove.clear();
        everLeft = new Set();
      }
      if (sim.phase !== "play") {
        lastMove.clear();
        continue;
      }
      const m = sim.maze;
      const h = sim.hero;
      check(cellAt(m, Math.round(h.x), Math.round(h.y)) !== "#", () => `grade ${g}: hero in a wall at ${h.x},${h.y}`);
      for (const c of sim.critters) {
        const cx = Math.round(c.x);
        const cy = Math.round(c.y);
        const cell = cellAt(m, cx, cy);
        check(cell !== "#", () => `grade ${g} ${m.name}: critter ${c.id} in a wall at ${c.x.toFixed(2)},${c.y.toFixed(2)}`);
        if (c.state === "active") check(cell !== "p" && cell !== "=", () => `grade ${g}: roaming critter ${c.id} inside the pen`);
        const onGrid = Math.abs(c.x - cx) < 1e-6 || Math.abs(c.y - cy) < 1e-6;
        check(onGrid, () => `grade ${g}: critter ${c.id} off the corridor grid at ${c.x},${c.y}`);
        if (c.state !== "pen") everLeft.add(c.id);
        if (c.state === "pen") {
          lastMove.delete(c.id);
          continue;
        }
        const lm = lastMove.get(c.id);
        if (!lm || Math.abs(lm.x - c.x) + Math.abs(lm.y - c.y) > 0.01) lastMove.set(c.id, { x: c.x, y: c.y, t });
        else check(t - lm.t < 1, () => `grade ${g} ${m.name}: critter ${c.id} (${c.state}) stuck at ${c.x},${c.y}`);
      }
      if (sim.playT > tuningFor(g, sim.level).releaseGap * 4 + 5) {
        check(sim.critters.every((c) => everLeft.has(c.id) || c.state !== "pen"), () => `grade ${g}: a critter never left the pen`);
      }
    }
    simSeconds += t;
    check(mazes >= 1, () => "maze count");
  }
}

/* ------------------------------------------------------------ result */

const pct = (a: number, b: number) => `${Math.round((100 * a) / Math.max(1, b))}%`;
console.log(
  `${checks} checks · ${labelCount} label placements (${splitWords} with a split number/word) · ` +
    `${Math.round(simSeconds)} simulated seconds`,
);
console.log(
  "big-text labels (scale 2) used for K–2: " +
    ["K", "1", "2"].map((g) => `${g} ${pct(scaleUse[g][1], scaleUse[g][0] + scaleUse[g][1])}`).join(", "),
);
if (failures) {
  console.error(`${failures} failure(s)`);
  process.exit(1);
}
console.log("All Maze Muncher checks passed.");
