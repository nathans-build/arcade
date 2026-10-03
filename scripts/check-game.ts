/*
 * Sonar Squad checks (npm test): coordinate notation for every grade, coordinate-challenge
 * math, fleet placement, the computer players (never off the board, never twice at a spot,
 * medium follows a line, hard picks the densest spot), the rules engine (power-ups, illegal
 * moves), and simulated win rates. Run with `npx tsx scripts/check-game.ts`.
 * SIMS=2000 runs more games for the win-rate table.
 */
import { GRADES, gradeNumber } from "@/kit/grades";
import type { Grade } from "@/kit/types";
import { AI_LEVELS, aiShot, densityMap, hardShot, mediumShot, targetCandidates, type AiLevel } from "@/sonar/ai";
import { makeChallenge, kindsFor, callStandard, type ChallengeKind } from "@/sonar/challenge";
import { FLEET, Fleet, HIT, MISS, SUNK, UNKNOWN, fits, idx, placementProblems, randomFleet, seeded, shipCells, toCoord, type Coord, type Placement, type Rng, type ShotMark, type TargetView } from "@/sonar/core";
import { Match, type Player, type TurnAction, type TurnView } from "@/sonar/match";
import { PICTURES, axisRange, boardSize, colLabel, formatCoord, fromXY, pair, parseCoord, rowLabel, schemeFor, toXY, type Scheme } from "@/sonar/notation";
import { ComputerPlayer } from "@/sonar/players";
import { hasGlyphs } from "@/sonar/font";

let failures = 0;
let checks = 0;
function ok(cond: unknown, msg: string) {
  checks++;
  if (!cond) {
    failures++;
    if (failures < 40) console.error("FAIL:", msg);
  }
}

/* ---------------- notation ---------------- */
const expectScheme: Record<string, Scheme> = { K: "picture", 1: "picture", 2: "picture", 3: "letters", 4: "letters", 5: "q1" };
for (const g of GRADES) {
  const s = schemeFor(g);
  ok(s === (expectScheme[g] ?? "q4"), `grade ${g} scheme ${s}`);
}
for (const s of ["picture", "letters", "q1", "q4"] as Scheme[]) {
  const n = boardSize(s);
  ok(n === (s === "q4" ? 11 : 10), `${s} size ${n}`);
  const seen = new Set<string>();
  for (let r = 0; r < n; r++)
    for (let c = 0; c < n; c++) {
      const p = { r, c };
      const f = formatCoord(s, p);
      ok(!seen.has(f), `${s} duplicate label ${f}`);
      seen.add(f);
      const back = parseCoord(s, f);
      ok(back && back.r === r && back.c === c, `${s} parse(format) ${f}`);
      const { x, y } = toXY(s, p);
      const p2 = fromXY(s, x, y);
      ok(p2 && p2.r === r && p2.c === c, `${s} xy round trip ${r},${c}`);
      ok(hasGlyphs(f.replace(/[a-z]/g, (ch) => ch.toUpperCase())), `${s} label ${f} has bitmap glyphs`);
    }
  ok(!hasGlyphs("") || true, "");
  for (let i = 0; i < n; i++) ok(hasGlyphs(colLabel(s, i)) && (s === "picture" || hasGlyphs(rowLabel(s, i))), `${s} axis label ${i}`);
}
// Specific mappings from the plan.
ok(formatCoord("letters", { r: 2, c: 6 }) === "C7", "C7");
ok(formatCoord("picture", { r: 1, c: 3 }) === "Crab 4", "Crab 4");
ok(formatCoord("q1", { r: 9, c: 0 }) === "(0, 0)", "q1 origin bottom-left");
ok(formatCoord("q1", { r: 0, c: 9 }) === "(9, 9)", "q1 top-right");
ok(formatCoord("q4", { r: 5, c: 5 }) === "(0, 0)", "q4 origin centre");
ok(formatCoord("q4", { r: 7, c: 8 }) === "(3, −2)", "q4 (3, −2)");
ok(formatCoord("q4", { r: 0, c: 0 }) === "(−5, 5)", "q4 top-left");
ok(formatCoord("q4", { r: 10, c: 10 }) === "(5, −5)", "q4 bottom-right");
ok(parseCoord("q4", "3,-2")?.r === 7 && parseCoord("q4", "(3, −2)")?.c === 8, "parse (3,-2)");
ok(parseCoord("q4", "(6, 0)") === null && parseCoord("q1", "(-1, 0)") === null, "off-board pairs rejected");
ok(parseCoord("letters", "K1") === null && parseCoord("letters", "A11") === null && parseCoord("letters", "J10")?.r === 9, "letters bounds");
ok(PICTURES.length === 10 && new Set(PICTURES.map((p) => p.name)).size === 10, "10 distinct picture rows");
ok(axisRange("q4").min === -5 && axisRange("q4").max === 5, "q4 range");

/* ---------------- coordinate challenges ---------------- */
const KNOWN_CODES = new Set(["NC.K.G.1", "3.G.1", "4.G.1", "NC.5.G.1", "NC.6.NS.6", "NC.6.NS.8", "NC.6.G.3", "NC.8.G.3", "NC.M1.G-GPE.6", "NC.M2.G-CO.2"]);
/** Independent check of a challenge's answer from the numbers it was built from. */
function verify(kind: ChallengeKind, given: number[][], a: { x: number; y: number }): boolean {
  const [p, q, r] = given;
  switch (kind) {
    case "call":
      return a.x === p[0] && a.y === p[1];
    case "move":
    case "shift":
    case "translate":
      return a.x - p[0] === q[0] && a.y - p[1] === q[1];
    case "reflectX": // axis is the perpendicular bisector: same x, y's sum to 0
      return a.x === p[0] && a.y + p[1] === 0 && p[1] !== 0;
    case "reflectY":
      return a.y === p[1] && a.x + p[0] === 0 && p[0] !== 0;
    case "rotate180": // origin is the midpoint
      return a.x + p[0] === 0 && a.y + p[1] === 0;
    case "rotate90": {
      // same distance from origin, perpendicular, counterclockwise (positive cross product)
      const dot = a.x * p[0] + a.y * p[1];
      const cross = p[0] * a.y - p[1] * a.x;
      return dot === 0 && cross > 0 && a.x * a.x + a.y * a.y === p[0] * p[0] + p[1] * p[1];
    }
    case "reflectYX": // midpoint on y = x and segment perpendicular to it
      return (a.x + p[0]) === (a.y + p[1]) && (a.x - p[0]) === -(a.y - p[1]) && !(p[0] === p[1]);
    case "midpoint":
      return 2 * a.x === p[0] + q[0] && 2 * a.y === p[1] + q[1];
    case "rectangle": {
      // four corners: each pair of opposite corners shares a midpoint (parallelogram) and the angle at B is right
      const mid1 = [p[0] + r[0], p[1] + r[1]];
      const mid2 = [q[0] + a.x, q[1] + a.y];
      const ab = [q[0] - p[0], q[1] - p[1]];
      const bc = [r[0] - q[0], r[1] - q[1]];
      return mid1[0] === mid2[0] && mid1[1] === mid2[1] && ab[0] * bc[0] + ab[1] * bc[1] === 0;
    }
    case "quadrant": {
      const [quad, d] = p;
      const sx = Math.sign(a.x);
      const sy = Math.sign(a.y);
      const qq = sx > 0 && sy > 0 ? 1 : sx < 0 && sy > 0 ? 2 : sx < 0 && sy < 0 ? 3 : sx > 0 && sy < 0 ? 4 : 0;
      return qq === quad && Math.abs(a.x) === d && Math.abs(a.y) === d;
    }
  }
}
const kindCount: Record<string, number> = {};
for (const g of GRADES) {
  const s = schemeFor(g);
  const rng = seeded(100 + gradeNumber(g));
  const kinds = [...new Set(kindsFor(g))];
  for (const kind of kinds) {
    for (let t = 0; t < 300; t++) {
      // half the board already fired at, so the open-spot rule is exercised
      const shot = new Set<number>();
      const n = boardSize(s);
      for (let i = 0; i < n * n; i++) if (rng() < 0.5) shot.add(i);
      const ch = makeChallenge(g, rng, (p) => !shot.has(idx(n, p.r, p.c)), kind);
      ok(ch, `grade ${g} could not make a ${kind} challenge`);
      if (!ch) continue;
      kindCount[kind] = (kindCount[kind] ?? 0) + 1;
      ok(!shot.has(idx(n, ch.target.r, ch.target.c)), `${kind} target already fired at`);
      const xy = toXY(s, ch.target);
      ok(xy.x === ch.answer.x && xy.y === ch.answer.y, `${kind} target matches answer`);
      ok(verify(kind, ch.given, ch.answer), `grade ${g} ${kind} wrong math: ${ch.text} → ${pair(ch.answer.x, ch.answer.y)}`);
      ok(KNOWN_CODES.has(ch.standard), `unknown standard ${ch.standard}`);
      ok(ch.text.length <= 110, `challenge text too long (${ch.text.length}): ${ch.text}`);
      if (kind !== "call" && kind !== "quadrant") {
        // Every point in the text is written in proper notation and on the board.
        const pts = [...ch.text.matchAll(/\((−?\d+), (−?\d+)\)/g)].map((m) => parseCoord(s, m[0]));
        ok(pts.length >= 1 && pts.every((p) => p), `${kind} text points on board: ${ch.text}`);
      }
      if (kind === "call") ok(ch.text.includes(formatCoord(s, ch.target)), `call names the spot: ${ch.text}`);
      ok(!/-\d/.test(ch.text), `hyphen used as minus: ${ch.text}`);
      ok(ch.explain.includes(pair(ch.answer.x, ch.answer.y)) || kind === "call", `explanation gives the answer: ${ch.explain}`);
    }
  }
  ok(KNOWN_CODES.has(callStandard(g).standard), `call standard ${g}`);
}
// Spot checks from the brief.
{
  const ch = makeChallenge("7", seeded(11), () => true, "reflectX");
  ok(ch && ch.answer.y === -toXY("q4", fromXY("q4", ch.given[0][0], ch.given[0][1])!).y, "reflectX sample");
}

/* ---------------- placement ---------------- */
for (const size of [10, 11]) {
  const rng = seeded(7 + size);
  for (let t = 0; t < 500; t++) {
    const f = randomFleet(size, rng, true);
    ok(placementProblems(size, f).length === 0, `random fleet valid (${size})`);
    // no touching
    const taken = new Set<number>();
    let touch = false;
    for (const p of f) {
      const len = FLEET.find((d) => d.id === p.id)!.len;
      if (!fits(size, taken, p.r, p.c, p.o, len, true)) touch = true;
      shipCells(p, len).forEach((c) => taken.add(idx(size, c.r, c.c)));
    }
    ok(!touch, "computer ships never touch");
    ok(taken.size === 17, "17 ship spots");
  }
}
ok(placementProblems(10, [{ id: "dragon", r: 0, c: 6, o: "h" }]).length > 0, "off-board/missing ships rejected");
ok(FLEET.map((f) => f.len).join() === "5,4,3,3,2", "fleet lengths 5,4,3,3,2");

/* ---------------- AI units ---------------- */
function blankView(size: number): TargetView {
  return { size, shots: new Array(size * size).fill(UNKNOWN), remaining: FLEET.map((f) => f.len) };
}
{
  // Medium: after one hit, shoot a neighbour.
  const v = blankView(10);
  v.shots[idx(10, 4, 4)] = HIT;
  const cands = targetCandidates(v).map((i) => toCoord(10, i));
  ok(cands.length === 4 && cands.every((p) => Math.abs(p.r - 4) + Math.abs(p.c - 4) === 1), "medium targets the 4 neighbours of a hit");
  // Two hits in a row: follow the line.
  v.shots[idx(10, 4, 5)] = HIT;
  v.shots[idx(10, 4, 3)] = MISS;
  const line = targetCandidates(v).map((i) => toCoord(10, i));
  ok(line.length === 1 && line[0].r === 4 && line[0].c === 6, `medium follows the line (${JSON.stringify(line)})`);
  const rng = seeded(3);
  for (let t = 0; t < 50; t++) {
    const i = mediumShot(v, rng);
    ok(i === idx(10, 4, 6), "medium shot follows the line");
  }
  // Hard: picks a spot of maximum density, and with a hit it shoots next to it.
  const h = blankView(10);
  const map = densityMap(h);
  const hs = hardShot(h, rng);
  ok(map[hs] === Math.max(...map), "hard picks the max of the density map");
  const centre = map[idx(10, 4, 4)];
  ok(centre > map[idx(10, 0, 0)], "density is higher in the middle than in a corner");
  h.shots[idx(10, 0, 0)] = HIT;
  const hn = toCoord(10, hardShot(h, rng));
  ok(Math.abs(hn.r) + Math.abs(hn.c) === 1, "hard targets next to a hit");
  // Misses and sunk ships remove placements.
  const m = blankView(10);
  for (let c = 0; c < 10; c++) m.shots[idx(10, 1, c)] = MISS;
  ok(densityMap(m)[idx(10, 0, 0)] < map[idx(10, 0, 0)], "misses lower the density nearby");
}

/* ---------------- full games: legality and win rates ---------------- */
const SIMS = Number(process.env.SIMS ?? 400);

/** A simulated kid: loses `jam` of shots to wrong answers, otherwise aims like `aim`. */
class SimHuman implements Player {
  readonly kind = "human" as const;
  /** `power`: chance of earning a double shot when the charge is full (harder question); 0 = never tries. */
  constructor(private aim: AiLevel, private jam: number, private rng: Rng, private power = 0) {}
  placeFleet(ctx: { size: number }): Promise<Placement[]> {
    return Promise.resolve(randomFleet(ctx.size, this.rng, false));
  }
  takeAction(view: TurnView): Promise<TurnAction> {
    if (view.turnStart && this.rng() < this.jam) return Promise.resolve({ type: "jammed" });
    if (this.power > 0 && view.charge >= view.chargeNeeded) return Promise.resolve({ type: "power", power: "double", earned: this.rng() < this.power });
    return Promise.resolve({ type: "fire", at: toCoord(view.size, aiShot(this.aim, view.target, this.rng)) });
  }
}

/** Wraps a player and checks every shot it makes is legal before the engine sees it. */
class Audited implements Player {
  readonly kind: Player["kind"];
  shots = 0;
  constructor(private inner: Player) {
    this.kind = inner.kind;
  }
  placeFleet(ctx: Parameters<Player["placeFleet"]>[0]) {
    return this.inner.placeFleet(ctx);
  }
  async takeAction(view: TurnView) {
    const a = await this.inner.takeAction(view);
    if (a.type === "fire") {
      this.shots++;
      ok(a.at.r >= 0 && a.at.c >= 0 && a.at.r < view.size && a.at.c < view.size, "AI fired off the board");
      ok(view.target.shots[idx(view.size, a.at.r, a.at.c)] === UNKNOWN, "AI fired twice at a spot");
    }
    return a;
  }
}

async function play(a: Player, b: Player, size: number, first: number): Promise<{ winner: number; shotsA: number; shotsB: number }> {
  const A = new Audited(a);
  const B = new Audited(b);
  const m = new Match(size, [A, B], { first });
  let winner = -1;
  try {
    winner = await m.run();
  } catch (e) {
    ok(false, `match error: ${e}`);
  }
  return { winner, shotsA: A.shots, shotsB: B.shots };
}

async function winRate(name: string, mk: (rng: Rng) => [Player, Player], size = 10): Promise<number> {
  const rng = seeded(name.length * 977 + size);
  let wins = 0;
  let shots = 0;
  for (let i = 0; i < SIMS; i++) {
    const [a, b] = mk(rng);
    const r = await play(a, b, size, i % 2);
    if (r.winner === 0) wins++;
    shots += r.shotsA;
  }
  const rate = wins / SIMS;
  console.log(`  ${name.padEnd(46)} ${(rate * 100).toFixed(1).padStart(5)}%   (avg ${Math.round(shots / SIMS)} shots by the first player)`);
  return rate;
}

async function shotsToSink(level: AiLevel, size: number): Promise<number> {
  const rng = seeded(level.length * 31 + size);
  let total = 0;
  const N = Math.min(SIMS, 300);
  for (let t = 0; t < N; t++) {
    const fleet = new Fleet(size, randomFleet(size, rng, true));
    const shots: ShotMark[] = new Array(size * size).fill(UNKNOWN);
    let n = 0;
    while (!fleet.allSunk()) {
      const i = aiShot(level, { size, shots, remaining: fleet.remaining() }, rng);
      ok(shots[i] === UNKNOWN && i >= 0 && i < size * size, `${level} legal shot`);
      const { result, ship } = fleet.receive(i);
      shots[i] = result === "miss" ? MISS : HIT;
      if (result === "sunk" && ship) ship.cells.forEach((c) => (shots[c] = SUNK));
      n++;
      if (n > size * size) {
        ok(false, `${level} did not finish`);
        break;
      }
    }
    total += n;
  }
  return total / N;
}

async function main() {
  console.log("Average shots to sink a whole fleet (10x10 / 11x11):");
  for (const lv of AI_LEVELS) console.log(`  ${lv.padEnd(7)} ${(await shotsToSink(lv, 10)).toFixed(1)} / ${(await shotsToSink(lv, 11)).toFixed(1)}`);

  console.log(`Win rates over ${SIMS} games (first player listed first; who shoots first alternates):`);
  const he = await winRate("Hard vs Easy", (r) => [new ComputerPlayer("hard", r), new ComputerPlayer("easy", r)]);
  const hm = await winRate("Hard vs Medium", (r) => [new ComputerPlayer("hard", r), new ComputerPlayer("medium", r)]);
  const me = await winRate("Medium vs Easy", (r) => [new ComputerPlayer("medium", r), new ComputerPlayer("easy", r)]);
  ok(he > 0.85, `Hard should beat Easy most of the time (${he})`);
  ok(hm > 0.55, `Hard should beat Medium more often than not (${hm})`);
  ok(me > 0.8, `Medium should beat Easy most of the time (${me})`);

  console.log("Simulated kid (aims hunt-and-target like Medium; ~20% of shots jammed by wrong answers):");
  for (const lv of AI_LEVELS) await winRate(`kid(medium aim, 20% jam) vs ${lv}`, (r) => [new SimHuman("medium", 0.2, r), new ComputerPlayer(lv, r)]);
  console.log("Same kid, also using the power-up: a double shot every 3 turns, earned 75% of the time:");
  for (const lv of AI_LEVELS) await winRate(`kid(medium aim, 20% jam, power-ups) vs ${lv}`, (r) => [new SimHuman("medium", 0.2, r, 0.75), new ComputerPlayer(lv, r)]);
  console.log("Simulated K-2 kid (one retry, so ~4% jammed) with random aim / hunt-and-target aim:");
  await winRate("kid(random aim, 4% jam) vs easy", (r) => [new SimHuman("easy", 0.04, r), new ComputerPlayer("easy", r)]);
  await winRate("kid(medium aim, 4% jam) vs easy", (r) => [new SimHuman("medium", 0.04, r), new ComputerPlayer("easy", r)]);
  console.log("Simulated kid with random aim (a beginner) and ~20% jammed:");
  for (const lv of ["easy", "medium"] as AiLevel[]) await winRate(`kid(random aim, 20% jam) vs ${lv}`, (r) => [new SimHuman("easy", 0.2, r), new ComputerPlayer(lv, r)]);
  console.log("11x11 board (grade 6+):");
  await winRate("kid(medium aim, 20% jam) vs medium 11x11", (r) => [new SimHuman("medium", 0.2, r), new ComputerPlayer("medium", r)], 11);
  await winRate("Hard vs Easy 11x11", (r) => [new ComputerPlayer("hard", r), new ComputerPlayer("easy", r)], 11);

  /* ---------------- rules engine ---------------- */
  {
    // Scripted players exercise power-ups and illegal moves.
    const fleetA: Placement[] = [
      { id: "dragon", r: 0, c: 0, o: "h" },
      { id: "narwhal", r: 2, c: 0, o: "h" },
      { id: "turtle", r: 4, c: 0, o: "h" },
      { id: "manta", r: 6, c: 0, o: "h" },
      { id: "puffer", r: 8, c: 0, o: "h" },
    ];
    const script: TurnAction[] = [];
    const seen: TurnView[] = [];
    const scripted: Player = {
      kind: "human",
      placeFleet: () => Promise.resolve(fleetA),
      takeAction: (v) => {
        seen.push(v);
        const a = script.shift();
        if (!a) throw new Error("script ran out");
        return Promise.resolve(a);
      },
    };
    const events: string[] = [];
    const m = new Match(10, [scripted, new ComputerPlayer("easy", seeded(5))], { chargeNeeded: [3, 3], startCharge: [2, 0], onEvent: (e) => void events.push(e.type) });
    await m.place();
    // Force the enemy fleet to a known layout.
    m.fleets[1] = new Fleet(10, fleetA);
    let threw = false;
    try {
      await m.apply(0, { type: "fire", at: { r: 10, c: 0 } });
    } catch {
      threw = true;
    }
    ok(threw, "engine rejects an off-board shot");
    await m.apply(0, { type: "fire", at: { r: 0, c: 0 } });
    ok(m.shots[0][0] === HIT, "hit recorded");
    threw = false;
    try {
      await m.apply(0, { type: "fire", at: { r: 0, c: 0 } });
    } catch {
      threw = true;
    }
    ok(threw, "engine rejects a repeat shot");
    // Power-up needs a full charge.
    m.charge[0] = 1;
    threw = false;
    try {
      await m.apply(0, { type: "power", power: "double", earned: true });
    } catch {
      threw = true;
    }
    ok(threw, "power-up without a full charge is rejected");
    m.charge[0] = 3;
    m.shotsLeft = 1;
    await m.apply(0, { type: "power", power: "double", earned: true });
    ok(m.shotsLeft === 2 && m.charge[0] === 0, "double shot adds a shot and uses the charge");
    m.charge[0] = 3;
    await m.apply(0, { type: "power", power: "sonar", earned: true, center: { r: 1, c: 1 } });
    ok(m.sonar[0][idx(10, 0, 0)] === 2 && m.sonar[0][idx(10, 2, 2)] === 2, "sonar marks contact in the 3x3 area");
    m.charge[0] = 3;
    await m.apply(0, { type: "power", power: "sonar", earned: true, center: { r: 4, c: 8 } });
    ok(m.sonar[0][idx(10, 4, 8)] === 1, "sonar marks clear water");
    ok(m.fleets[1].sonarCount(1, 1) === 5, "sonar counts unhit ship spots (row 0: 2 of 3 unhit, row 2: 3)");
    m.charge[0] = 3;
    await m.apply(0, { type: "power", power: "sonar", earned: false });
    ok(m.charge[0] === 0, "a missed power-up question still spends the charge");
    // Repair: seat 1 hits seat 0, then seat 0 repairs.
    await m.apply(1, { type: "fire", at: { r: 2, c: 1 } });
    ok(m.shots[1][idx(10, 2, 1)] === HIT, "enemy hit on my Narwhal");
    m.charge[0] = 3;
    await m.apply(0, { type: "power", power: "repair", earned: true });
    ok(m.shots[1][idx(10, 2, 1)] === UNKNOWN && m.fleets[0].ships[1].hits.size === 0, "repair fixes the square and wipes the enemy's mark");
    // Jammed turn ends the shots.
    m.shotsLeft = 1;
    await m.apply(0, { type: "jammed" });
    ok(m.shotsLeft === 0, "jammed loses the shot");
    // Sinking.
    for (let c = 0; c < 2; c++) await m.apply(0, { type: "fire", at: { r: 8, c } });
    ok(m.shots[0][idx(10, 8, 0)] === SUNK && m.shots[0][idx(10, 8, 1)] === SUNK, "sunk marks the whole ship");
    ok(events.includes("power") && events.includes("shot") && events.includes("jammed"), "events emitted");
  }

  console.log(`\n${checks} checks, ${failures} failures. Challenge kinds: ${JSON.stringify(kindCount)}`);
  if (failures) process.exit(1);
}

void main();

// Keep Coord/Grade imported for type use in editors.
export type _T = Coord | Grade;
