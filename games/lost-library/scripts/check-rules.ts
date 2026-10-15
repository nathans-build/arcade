/*
 * Quest of the Lost Library checks:   npm test   (npx tsx scripts/check-rules.ts)
 *
 * 1. Map data: every room is 20 x 12 with known tiles and a solid border; doors join grid
 *    neighbours of the same area (one door per side, unique ids, the tiles inside each gap are
 *    walkable); every room is reachable; signs match lecterns; warps, gate fronts and starts are
 *    walkable; every wing has one item chest, one map, one bonus book, a guardian (2 x 2), at least
 *    one Question Door, as many small keys as locked doors, and its puzzles have what they need.
 * 2. Solvable: the real game rules (game.ts) are played by a headless solver (solver.ts): every
 *    wing from its own entrance with nothing in hand, the whole game from a new save, and "collect
 *    everything" (every book, map, chest and door), for K-2 rules and grade 3+ rules. No softlock:
 *    from many random states (random walking, pushing crates into corners, spending keys) the
 *    solver still finishes the wing, using only "Reset room" from the pause menu.
 * 3. Question Doors and guardians: a wrong answer changes nothing (the door stays shut but asks
 *    again, no heart lost), a right one opens it; guardians need N right answers and never go back.
 * 4. Hearts: hazards and ink sprites cost a heart; running out sends the hero to the area's
 *    entrance with full hearts and every bit of progress kept. K-2 ink puddles are harmless.
 * 5. Saving: save/load round-trips mid-quest (keys, items, doors, books, crates of solved rooms),
 *    damaged saves start fresh, and every storage key starts with "arcade.lost-library.".
 * 6. Questions, for every grade K-12: MIXED gives each wing its own subject (Math Wing math, Science
 *    Wing science, Story Wing ELA, History & Maps Wing social studies; Reading Room all four); every
 *    question has 4 unique choices, an answer index, an explanation, an NC standard code of the right
 *    shape and the right subject. One subject / one topic: every offered topic and ALL <SUBJECT>
 *    draws only that, at every grade. Through Vite's SSR loader, so the kit's real banks are used.
 * 7. The topic picker: ?topic= / ?subject= parsing (arcade ids, quiz-mix ids), stored choice
 *    parsing, fallback when a grade can't offer a topic.
 */
import { GRADES } from "../src/kit/grades";
import { MATH_GENERATORS, mathQuestion } from "../src/kit/math";
import type { Grade, Question, Subject } from "../src/kit/types";
import { BOOKS, BONUS_BOOK, WING_BOOK } from "../src/library/books";
import {
  FOCUS_TOPICS, FocusCatalog, FocusDeck, MIXED, SUBJECT_CHOICES, SUBJECT_KEY, TOPIC_KEY, classifyTopic, focusFromUrl,
  loadFocus, parseStoredFocus, saveFocus, topicsOf, validateFocus, type FocusChoice, type FocusTopicId, type TopicChoice,
} from "../src/library/focus";
import { Game, SAVE_KEY, newSave, parseSave, type SaveData } from "../src/library/game";
import { HERO_SPRITES } from "../src/library/render";
import { applyAction, pathTo, solve, solveRoomBlocks, type Action } from "../src/library/solver";
import {
  AREAS, AREA_IDS, COLS, DELTA, GATE_FRONT, GUARDIANS, GUARDIAN_ROOM, ITEMS, ROWS, WINGS, WING_BONUS_ROOM, allRooms, doorsOf,
  gapTiles, roomById, sideToward, type AreaId, type Dir, type WingId,
} from "../src/library/world";

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

/* ------------------------------------------------------------------- 1. map data */

const KNOWN = new Set("#W.,=fEBSTYR_oi^KkMmCcNFGPt~O".split(""));
const FLOORISH = new Set([".", ",", "=", "f", "E", "S"]);
const roomIds = new Set<string>();
const doorIds = new Set<string>();

for (const area of Object.values(AREAS)) {
  const spots = new Set<string>();
  for (const r of area.rooms) {
    check(!roomIds.has(r.id), () => `duplicate room id ${r.id}`);
    roomIds.add(r.id);
    check(!spots.has(r.at.join()), () => `${area.id}: two rooms at ${r.at}`);
    spots.add(r.at.join());
    check(r.rows.length === ROWS, () => `${r.id}: ${r.rows.length} rows`);
    r.rows.forEach((row, y) => {
      check(row.length === COLS, () => `${r.id} row ${y}: ${row.length} columns`);
      [...row].forEach((c, x) => {
        check(KNOWN.has(c), () => `${r.id} (${x},${y}): unknown tile "${c}"`);
        if (x === 0 || y === 0 || x === COLS - 1 || y === ROWS - 1) check(c === "#", () => `${r.id} (${x},${y}): border must be "#" (gaps are carved by doors)`);
      });
    });
    const sides = new Set<Dir>();
    const sideList: Dir[] = doorsOf(r.id).map((d) => d.side);
    if (r.exit) sideList.push(r.exit.side);
    for (const s of sideList) {
      check(!sides.has(s), () => `${r.id}: two doors on side ${s}`);
      sides.add(s);
      // The tiles just inside the gap must be walkable floor.
      for (const [gx, gy] of gapTiles(s)) {
        const [dx, dy] = DELTA[s];
        const ix = gx - dx;
        const iy = gy - dy;
        check(FLOORISH.has(r.rows[iy][ix]), () => `${r.id}: tile inside the ${s} door (${ix},${iy}) is "${r.rows[iy][ix]}"`);
      }
    }
    const signs = Game.tilesOf(r, "N").length;
    check((r.signs ?? []).length === signs, () => `${r.id}: ${signs} lecterns but ${(r.signs ?? []).length} sign texts`);
    check((r.signs ?? []).every((s) => s.trim().length > 10), () => `${r.id}: empty sign text`);
    const ps = Game.tilesOf(r, "P");
    check(ps.length === 0 || !!r.warp, () => `${r.id}: gate tiles without a warp`);
    if (r.warp) {
      check(ps.length > 0, () => `${r.id}: warp without gate tiles`);
      const to = roomById(r.warp.room);
      check(FLOORISH.has(to.rows[r.warp.y][r.warp.x]), () => `${r.id}: warp lands on "${to.rows[r.warp.y][r.warp.x]}"`);
      check(AREAS[r.warp.area].rooms.includes(to), () => `${r.id}: warp area mismatch`);
    }
    if (r.exit) {
      const to = roomById(r.exit.to.room);
      check(FLOORISH.has(to.rows[r.exit.to.y][r.exit.to.x]), () => `${r.id}: exit lands on "${to.rows[r.exit.to.y][r.exit.to.x]}"`);
    }
    // Lower-case pickups only make sense in a puzzle room.
    if (Game.tilesOf(r, "kmc").length) check(!!r.puzzle, () => `${r.id}: k/m/c tiles need a puzzle`);
    if (Game.tilesOf(r, "Cc").length) check(!!r.chest && Game.tilesOf(r, "Cc").length === 1, () => `${r.id}: one chest per room, with contents`);
    if (r.chest) check(Game.tilesOf(r, "Cc").length === 1, () => `${r.id}: chest contents but no chest`);
    const p = r.puzzle;
    if (p?.kind === "blocks") {
      const sw = Game.tilesOf(r, "S").length;
      check(sw > 0 && Game.tilesOf(r, "B").length >= sw, () => `${r.id}: crate puzzle needs switches and enough crates`);
    }
    if (p?.kind === "torches") check(Game.tilesOf(r, "T").length > 0, () => `${r.id}: torch puzzle without torches`);
    if (p?.kind === "crystal") check(Game.tilesOf(r, "R").length > 0, () => `${r.id}: crystal puzzle without crystals`);
    if (p?.kind === "secret") check(!!r.secret && Game.tilesOf(r, "N").length > 0, () => `${r.id}: secret puzzle needs secret text on a lectern`);
    if (!p) check(Game.tilesOf(r, "TRS").length === 0 || area.id === "hub", () => `${r.id}: torches/crystals/switches but no puzzle`);
  }
  for (const d of area.doors) {
    check(!doorIds.has(d.id), () => `duplicate door id ${d.id}`);
    doorIds.add(d.id);
    const a = roomById(d.a);
    const b = roomById(d.b);
    check(area.rooms.includes(a) && area.rooms.includes(b), () => `door ${d.id} joins rooms of another area`);
    check(!!sideToward(a, b), () => `door ${d.id}: ${d.a} and ${d.b} are not grid neighbours`);
  }
  for (const r of area.rooms) for (const p of r.puzzle?.opens ?? []) {
    const d = area.doors.find((x) => x.id === p);
    check(!!d && d.kind === "shutter" && (d.a === r.id || d.b === r.id), () => `${r.id}: puzzle opens ${p}, which is not one of its shutter doors`);
  }
  for (const d of area.doors.filter((x) => x.kind === "shutter")) {
    check(area.rooms.some((r) => r.puzzle?.opens?.includes(d.id)), () => `shutter ${d.id} is never opened by a puzzle`);
  }
  // Every room connects to the area's start (ignoring what kind of door).
  const seen = new Set([area.start.room]);
  const queue = [area.start.room];
  while (queue.length) {
    const id = queue.shift()!;
    for (const d of doorsOf(id)) if (!seen.has(d.other)) {
      seen.add(d.other);
      queue.push(d.other);
    }
  }
  check(seen.size === area.rooms.length, () => `${area.id}: rooms not connected: ${area.rooms.filter((r) => !seen.has(r.id)).map((r) => r.id)}`);
  check(FLOORISH.has(roomById(area.start.room).rows[area.start.y][area.start.x]), () => `${area.id}: start is not floor`);
}
for (const [k, p] of Object.entries(GATE_FRONT)) check(FLOORISH.has(roomById(p.room).rows[p.y][p.x]), () => `gate front ${k} is not floor`);

for (const w of WINGS) {
  const a = AREAS[w];
  const rooms = a.rooms;
  const count = (c: string) => rooms.reduce((n, r) => n + Game.tilesOf(r, c).length, 0);
  check(rooms.length >= 5 && rooms.length <= 8, () => `${w}: ${rooms.length} rooms (want 5-8)`);
  check(rooms.filter((r) => r.chest === "item").length === 1, () => `${w}: needs exactly one item chest`);
  check(rooms.filter((r) => r.chest === "book").length === 1 && roomById(WING_BONUS_ROOM[w]).chest === "book", () => `${w}: needs one bonus book chest`);
  check(count("M") + count("m") === 1, () => `${w}: needs exactly one map`);
  check(count("K") + count("k") === a.doors.filter((d) => d.kind === "locked").length, () => `${w}: small keys ${count("K") + count("k")} vs locked doors ${a.doors.filter((d) => d.kind === "locked").length}`);
  check(a.doors.some((d) => d.kind === "question"), () => `${w}: needs a Question Door`);
  check(a.doors.some((d) => d.kind === "locked"), () => `${w}: needs a locked door`);
  check(!!a.item && ITEMS[a.item].wing === w, () => `${w}: item`);
  check(!!a.guardian && GUARDIANS[a.guardian].area === w, () => `${w}: guardian`);
  const gr = roomById(GUARDIAN_ROOM[a.guardian!]);
  check(rooms.includes(gr) && Game.tilesOf(gr, "G").length === 4, () => `${w}: guardian room needs a 2x2 guardian`);
  check(a.subject !== null, () => `${w}: subject`);
  check(rooms.some((r) => r.exit?.to.area === "hub"), () => `${w}: no way back to town`);
  // Each wing's own item is needed: without it the guardian can't be reached (checked by the solver below).
}
check(new Set(WINGS.map((w) => AREAS[w].item)).size === 4, () => "four different items");
check(new Set(WINGS.map((w) => AREAS[w].subject)).size === 4, () => "four different subjects");
check(AREAS.math.subject === "math" && AREAS.science.subject === "science" && AREAS.story.subject === "ela" && AREAS.history.subject === "social", () => "wing subjects");
check(Object.values(GUARDIANS).every((g) => g.need >= 3 && g.intro.length > 40 && g.win.length > 20), () => "guardian texts");
check(BOOKS.length === 9 && new Set(BOOKS.map((b) => b.id)).size === 9 && BOOKS.every((b) => b.fact.length > 30 && /[.!"]$/.test(b.fact)), () => "nine books with facts");
check(WINGS.every((w) => BOOKS.some((b) => b.id === WING_BOOK[w]) && BOOKS.some((b) => b.id === BONUS_BOOK[w])), () => "every wing has its books");
for (const [k, rows] of Object.entries(HERO_SPRITES)) check(rows.length === 16 && rows.every((r) => r.length === 16), () => `hero sprite ${k} is not 16x16`);
// Hub: a gate to every wing and the sealed Reading Room.
for (const w of [...WINGS, "reading"] as AreaId[]) check(AREAS.hub.rooms.some((r) => r.warp?.area === w), () => `town has no gate to ${w}`);
check(AREAS.hub.rooms.some((r) => r.warp?.area === "reading" && r.sealed), () => "the Reading Room gate is sealed");

/* ------------------------------------------------------------------- 2. solvable */

const solverOpts = (early: boolean) => ({ early, enemies: false, invincible: true });
function wingSave(w: WingId): SaveData {
  const s = newSave();
  s.at = { ...AREAS[w].start };
  s.entry = { ...s.at };
  return s;
}
const wingDone = (w: WingId) => (g: Game) => g.s.restored.includes(w);
const solutions = new Map<string, Action[]>();
for (const early of [false, true]) {
  for (const w of WINGS) {
    const g = new Game(wingSave(w), solverOpts(early));
    const r = solve(g, wingDone(w), { area: w });
    check(r.ok, () => `${w} (${early ? "K-2" : "3+"}) is not solvable from its entrance: ${r.reason}`);
    if (r.ok) solutions.set(`${w}|${early}`, r.actions);
    check(g.s.items.includes(AREAS[w].item!), () => `${w}: solved without picking up its item`);
    // The item really is needed: without it the wing can't be finished.
    const noItem = new Game(wingSave(w), solverOpts(early));
    const blocked = solve(noItem, wingDone(w), { area: w, accept: (x) => x.s.items.length === 0 });
    check(!blocked.ok, () => `${w}: can be finished without the ${ITEMS[AREAS[w].item!].name}`);
  }
  // The whole game from a new save, and collecting everything.
  const g = new Game(null, solverOpts(early));
  const full = solve(g, (x) => x.s.finished);
  check(full.ok, () => `whole game (${early ? "K-2" : "3+"}) not solvable: ${full.reason}`);
  check(g.s.restored.length === 4 && g.s.books.includes("reading"), () => "finishing restores all wings and the Reading Room book");
  const all = new Game(null, solverOpts(early));
  const everything = (x: Game) =>
    x.s.finished && x.s.books.length === BOOKS.length && x.s.maps.length === 4 && x.s.items.length === 4 &&
    AREA_IDS.every((a) => AREAS[a].doors.every((d) => x.doorOpen(d))) &&
    allRooms().every((r) => Game.tilesOf(r, "KkMmCc").every(([cx, cy]) => x.s.taken.includes(`${r.id}:${cx},${cy}`)));
  const coll = solve(all, everything);
  check(coll.ok, () => `collect-everything (${early ? "K-2" : "3+"}) failed: ${coll.reason}`);
  if (!early) console.log(`Solver: whole game ${full.actions.length} actions, collect-everything ${coll.actions.length} actions.`);
}

// Crate puzzles: each one has a plan from the room's door (the playtest uses solveRoomBlocks).
for (const r of allRooms().filter((x) => x.puzzle?.kind === "blocks")) {
  const area = AREAS[allRooms().includes(r) ? (Object.values(AREAS).find((a) => a.rooms.includes(r))!.id) : "hub"];
  const door = doorsOf(r.id)[0];
  const [gx, gy] = gapTiles(door.side)[0];
  const s = newSave();
  s.at = { area: area.id, room: r.id, x: gx, y: gy, facing: "up" };
  s.entry = { ...s.at };
  s.opened = area.doors.map((d) => d.id);
  const g = new Game(s, solverOpts(false));
  const plan = solveRoomBlocks(g);
  check(!!plan && plan.length > 0, () => `${r.id}: no crate plan`);
  if (plan) {
    for (const d of plan) g.move(d);
    check(g.s.solved.includes(r.id), () => `${r.id}: crate plan does not solve it`);
  }
}
{
  const g = new Game(null, solverOpts(false));
  const p = pathTo(g, 4, 8);
  check(!!p && p.length > 0, () => "pathTo in the square");
  if (p) for (const d of p) g.move(d);
  check(g.s.at.x === 4 && g.s.at.y === 8, () => "pathTo arrives");
}

// No softlock: random play (walking, pushing crates anywhere, spending keys) never makes a wing unsolvable.
function rng(seed: number) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32);
}
let fuzzRuns = 0;
for (const w of WINGS) {
  const sol = solutions.get(`${w}|false`) ?? [];
  for (let trial = 0; trial < 14; trial++) {
    const r = rng(trial * 97 + w.length);
    const g = new Game(wingSave(w), { early: trial % 2 === 1, enemies: false, invincible: true, rng: r });
    // Follow the known solution part of the way, then wander randomly.
    const upto = Math.floor((sol.length * trial) / 14);
    for (const a of sol.slice(0, upto)) applyAction(g, a);
    const acts: Action[] = ["up", "down", "left", "right", "up", "down", "left", "right", "enter@up", "x:lantern@up", ...g.s.items.map((i) => `x:${i}@${(["up", "down", "left", "right"] as Dir[])[trial % 4]}` as Action)];
    for (let i = 0; i < 160; i++) {
      applyAction(g, acts[Math.floor(r() * acts.length)]);
      if (g.s.at.area !== w) g.goTo(AREAS[w].start); // wandered out to town: walk back in
    }
    const res = solve(g, wingDone(w), { area: w, allowReset: true });
    fuzzRuns++;
    check(res.ok, () => `${w}: softlock after random play (trial ${trial}): ${res.reason}`);
  }
}

/* -------------------------------------------------------- 3. Question Doors & guardians */

{
  const g = new Game(wingSave("math"), solverOpts(false));
  // Walk to the Question Door between m2 and m4.
  g.enterRoom("m2", 9, 1, "up");
  g.takeEvents();
  const before = g.progSig();
  const hearts = g.s.hearts;
  g.move("up");
  const evs = g.takeEvents();
  const q = evs.find((e) => e.type === "question");
  check(!!q && q.type === "question" && q.doorId === "m2-m4", () => `bumping a Question Door asks a question: ${JSON.stringify(evs)}`);
  // A wrong answer: the UI simply doesn't open it. Nothing changed, and the door asks again.
  check(g.progSig() === before && g.s.hearts === hearts && g.s.at.y === 1, () => "a Question Door bump changes nothing by itself");
  for (let i = 0; i < 3; i++) {
    g.move("up");
    check(g.takeEvents().some((e) => e.type === "question"), () => "the Question Door asks again after a wrong answer");
  }
  g.openQuestionDoor("m2-m4");
  check(g.s.opened.includes("m2-m4") && g.tile(9, 0) === ".", () => "a right answer opens the Question Door");
  check(g.move("up") && g.move("up") && g.s.at.room === "m4", () => "walk through the opened Question Door");
  // Guardians: wrong answers never count or go back; need right answers.
  for (const gid of ["tallyshell", "petri", "inkwhisker", "kitewing", "smudge"] as const) {
    const h = new Game(null, solverOpts(false));
    const need = GUARDIANS[gid].need;
    let done = false;
    for (let i = 0; i < need * 2; i++) {
      const right = i % 2 === 1;
      const before = h.guardianProgress(gid);
      done = h.guardianAnswer(gid, right);
      check(h.guardianProgress(gid) === before + (right ? 1 : 0), () => `${gid}: answer ${i} changed progress wrongly`);
      if (done) break;
    }
    check(done && h.guardianProgress(gid) === need, () => `${gid}: needs ${need} right answers`);
    if (gid !== "smudge") {
      const w = GUARDIANS[gid].area as WingId;
      check(h.s.restored.includes(w) && h.s.books.includes(WING_BOOK[w]) && h.s.at.room === GATE_FRONT[w].room, () => `${gid}: restores the wing, gives its book, returns to town`);
    } else check(h.s.finished && h.s.books.includes("reading"), () => "the Ink Smudge finishes the quest");
  }
}

/* ------------------------------------------------------------------------- 4. hearts */

{
  // Grade 3+: an ink puddle costs a heart and blocks; K-2: harmless.
  const s = wingSave("math");
  s.at = { area: "math", room: "m2", x: 3, y: 6, facing: "down" };
  const g = new Game(s, { early: false, enemies: false });
  const h0 = g.s.hearts;
  check(g.tile(3, 7) === "^", () => "m2 has a puddle at (3,7)");
  check(!g.move("down") && g.s.hearts === h0 - 1 && g.s.at.y === 6, () => "a puddle costs a heart and blocks (grade 3+)");
  g.move("down");
  check(g.s.hearts === h0 - 1, () => "no second heart lost while flashing");
  const e = new Game(JSON.parse(JSON.stringify(s)), { early: true, enemies: false });
  const eh = e.s.hearts;
  check(e.move("down") && e.s.hearts === eh && e.s.at.y === 7, () => "K-2: a puddle is a harmless stain");
  check(e.maxHearts > g.maxHearts, () => "K-2 gets more hearts");

  // Running out of hearts mid-wing: back to the entrance, nothing lost.
  const mid = new Game(wingSave("science"), solverOpts(false));
  const sol = solutions.get("science|false")!;
  for (const a of sol.slice(0, Math.floor(sol.length * 0.7))) applyAction(mid, a);
  const progBefore = mid.progSig();
  const snap = JSON.parse(JSON.stringify(mid.s)) as SaveData;
  const live = new Game(snap, { early: false, enemies: false });
  live.s.hearts = 1;
  live.invuln = 0;
  live.hurt();
  const evs = live.takeEvents();
  check(evs.some((x) => x.type === "faint"), () => "fainting is reported");
  check(live.s.hearts === live.maxHearts && live.s.at.room === AREAS.science.start.room && live.s.at.x === AREAS.science.start.x, () => `faint returns to the wing entrance with full hearts (${live.s.at.room})`);
  check(live.progSig() === progBefore, () => "fainting keeps every key, item, door and book");
  check(live.s.faints === snap.faints + 1, () => "faints are counted");
  // Ink sprites: one sitting on the hero costs hearts until a faint; still nothing lost.
  const spr = new Game(JSON.parse(JSON.stringify(mid.s)), { early: false, enemies: true, rng: rng(5) });
  spr.enterRoom("s3", 9, 9, "up");
  spr.takeEvents();
  let fainted = false;
  for (let i = 0; i < 4000 && !fainted; i++) {
    const [px, py] = spr.pos;
    for (const en of spr.enemies) {
      en.x = px;
      en.y = py;
    }
    if (!spr.enemies.length) spr.enemies.push({ id: 99, kind: "sprite", x: px, y: py, fx: px, fy: py, mt: 1, t: 9 });
    spr.tick(0.05, null);
    fainted = spr.takeEvents().some((x) => x.type === "faint");
  }
  check(fainted && spr.progSig() === progBefore, () => "ink sprites can knock you out, but progress is kept");
  // Dusting tidies a sprite in front.
  const d = new Game(null, { early: false, enemies: true, rng: rng(1) });
  d.enemies = [{ id: 1, kind: "sprite", x: 9, y: 7, fx: 9, fy: 7, mt: 1, t: 9 }];
  d.s.at.facing = "up";
  d.dust();
  check(d.enemies.length === 0 && d.takeEvents().some((x) => x.type === "sfx" && x.name === "poof"), () => "the duster poofs an ink sprite in front");
  // Town dust bunnies are harmless.
  const town = new Game(null, { early: false, enemies: true, rng: rng(2) });
  const th = town.s.hearts;
  town.enemies = [{ id: 1, kind: "bunny", x: 9, y: 8, fx: 9, fy: 8, mt: 1, t: 9 }];
  town.tick(0.05, null);
  check(town.s.hearts === th, () => "dust bunnies in town don't hurt");
}

/* ------------------------------------------------------------------------- 5. saving */

{
  check(SAVE_KEY.startsWith("arcade.lost-library.") && SUBJECT_KEY.startsWith("arcade.lost-library.") && TOPIC_KEY.startsWith("arcade.lost-library."), () => "storage keys");
  const g = new Game(wingSave("math"), solverOpts(false));
  const sol = solutions.get("math|false")!;
  for (const a of sol) {
    if (g.s.solved.includes("m2") && g.s.items.includes("boomerang") && g.s.keys.math + g.s.opened.length > 0) break;
    applyAction(g, a);
  }
  check(g.s.solved.includes("m2") && g.s.items.includes("boomerang") && !g.s.restored.includes("math"), () => "math solution reached the crates and the boomerang");
  const raw = JSON.stringify(g.s);
  const back = parseSave(raw);
  check(!!back && JSON.stringify(back) === raw, () => "save round-trips exactly");
  const g2 = new Game(back, solverOpts(false));
  check(g2.progSig() === g.progSig() && g2.s.at.room === g.s.at.room && g2.s.at.x === g.s.at.x, () => "loading restores progress and position");
  // Solved crate rooms keep their crates on the switches.
  g2.enterRoom("m2", 1, 5, "right");
  const sw = Game.tilesOf(roomById("m2"), "S");
  check(sw.every(([x, y]) => g2.blockAt(x, y) >= 0), () => "solved crates stay on their switches after loading");
  check(parseSave(null) === null && parseSave("{bad json") === null && parseSave('{"v":2}') === null && parseSave(JSON.stringify({ ...g.s, at: { ...g.s.at, room: "nowhere" } })) === null, () => "damaged saves start fresh");
  const odd = parseSave(JSON.stringify({ ...g.s, keys: { math: -3, science: "x" }, selected: "quill", items: ["boomerang"] }));
  check(!!odd && odd.keys.math === 0 && odd.keys.science === 0 && odd.selected === null, () => "save values are sanitized");
  // Unsolved crate rooms reset when you come back; "Reset room" puts the hero back at the door.
  const r = new Game(wingSave("story"), solverOpts(false));
  r.enterRoom("e2", 19, 5, "left");
  r.move("left");
  r.move("left");
  const start = Game.tilesOf(roomById("e2"), "B").map((b) => b.join()).join(";");
  r.s.at = { ...r.s.at, x: 7, y: 6 };
  r.move("left");
  check(r.blocks.map((b) => b.join()).join(";") !== start, () => "pushed a crate");
  r.resetRoom();
  check(r.blocks.map((b) => b.join()).join(";") === start && r.s.at.x === 19 && r.s.at.y === 5, () => "Reset room puts crates and hero back");
}

/* ------------------------------------------------------------------ 6 & 7. questions */

type Written = Exclude<Subject, "math">;
const BANK: Record<Written, Partial<Record<Grade, Question[]>>> = { science: {}, ela: {}, social: {} };
for (const s of Object.keys(BANK) as Written[]) {
  for (const g of GRADES) BANK[s][g] = ((await import(`../src/kit/banks/${s}/g${g}.ts`)) as { default: Question[] }).default;
}
const bankSource = (s: Written, g: Grade) => BANK[s][g] ?? [];
const catalog = new FocusCatalog(bankSource);

const STD: Record<Subject, RegExp> = {
  math: /^NC\.(K|\d|M\d)\.[A-Z]/,
  science: /^(PS|LS|ESS)\.[A-Za-z0-9]+\./,
  ela: /^(RL|RI|RF|L|W|SL)\.(K|\d+|\d+-\d+)\.\d+/,
  social: /^(K|\d{1,2}|WH|CL|AH|EPF)\.[A-Z&]+\./,
};
let questionsChecked = 0;
function checkQ(q: Question, where: string, subject?: Subject) {
  questionsChecked++;
  const w = `${where} ${q.id} "${q.prompt.slice(0, 40)}"`;
  check(Array.isArray(q.choices) && q.choices.length === 4, () => `${w}: needs 4 choices`);
  check(new Set(q.choices.map((c) => c.trim())).size === 4 && q.choices.every((c) => c.trim().length > 0), () => `${w}: choices not unique/non-empty: ${q.choices.join(" | ")}`);
  check(Number.isInteger(q.answer) && q.answer >= 0 && q.answer < 4, () => `${w}: bad answer index ${q.answer}`);
  check(q.explanation.trim().length >= 10, () => `${w}: explanation missing`);
  check(q.prompt.trim().length > 3, () => `${w}: prompt missing`);
  check(STD[q.subject].test(q.standard), () => `${w}: standard ${q.standard} doesn't look like an NC ${q.subject} code`);
  if (subject) check(q.subject === subject, () => `${w}: subject ${q.subject}, want ${subject}`);
}

// Every written question in the kit banks (the deck may deal any of them) and generated math.
for (const s of Object.keys(BANK) as Written[]) for (const g of GRADES) for (const q of bankSource(s, g)) checkQ(q, `bank ${s} ${g}`, s);
for (const g of GRADES) {
  check(MATH_GENERATORS[g].length > 0, () => `no math for grade ${g}`);
  for (let i = 0; i < 60; i++) checkQ(mathQuestion(g), `math ${g}`, "math");
}

// One subject / one topic at every grade.
const offeredAt = new Map<Grade, FocusTopicId[]>();
let focusDraws = 0;
function checkDeck(g: Grade, subject: Subject, topic: TopicChoice) {
  const deck = new FocusDeck(catalog, g, subject, topic, { adaptive: false });
  for (let i = 0; i < 30; i++) {
    const q = deck.draw(false);
    focusDraws++;
    checkQ(q, `focus ${g}/${subject}/${topic}`, subject);
    if (topic !== "all") check(classifyTopic(q) === topic, () => `focus ${g}/${topic}: drew ${q.standard} "${q.skill}" (${classifyTopic(q)})`);
    check(!q.passage, () => `focus ${g}/${topic}: drew a passage question`);
  }
}
for (const g of GRADES) {
  const av = catalog.available(g);
  offeredAt.set(g, av);
  for (const s of ["math", "science", "ela", "social"] as Subject[]) {
    checkDeck(g, s, "all");
    for (const t of topicsOf(s)) if (av.includes(t.id)) checkDeck(g, s, t.id);
  }
  check(av.length >= 6, () => `grade ${g} offers only ${av.length} topics`);
}

// Topic picker: arcade ids and parsing.
check(SUBJECT_CHOICES.map((s) => s.id).join() === "math,science,ela,social,mixed", () => "subject row MATH · SCIENCE · ELA · SOCIAL STUDIES · MIXED");
check(SUBJECT_CHOICES.find((s) => s.id === "mixed")!.label === "MIXED", () => "MIXED label");
const MENU_IDS = ["numbers", "factors", "ratios", "fractions", "algebra", "geometry", "life", "earth", "physical", "reading", "phonics", "grammar", "civics", "history", "geography", "economics"];
check(FOCUS_TOPICS.map((t) => t.id).join() === MENU_IDS.join(), () => "topic ids are the arcade menu's");
const same = (a: FocusChoice | null, b: FocusChoice | null) => JSON.stringify(a) === JSON.stringify(b);
const url = (q: string, g: Grade = "5") => focusFromUrl(q, g, catalog);
check(same(url("?topic=fractions").choice, { subject: "math", topic: "fractions" }), () => "?topic=fractions");
check(same(url("?grade=4&topic=history", "4").choice, { subject: "social", topic: "history" }), () => "?topic=history");
check(same(url("?topic=life").choice, { subject: "science", topic: "life" }), () => "?topic=life");
check(same(url("?topic=math-mix").choice, { subject: "math", topic: "all" }), () => "?topic=math-mix → ALL MATH");
check(same(url("?topic=science-mix").choice, { subject: "science", topic: "all" }), () => "?topic=science-mix");
check(same(url("?topic=ela-mix").choice, { subject: "ela", topic: "all" }), () => "?topic=ela-mix");
check(same(url("?topic=social-mix").choice, { subject: "social", topic: "all" }), () => "?topic=social-mix");
check(same(url("?topic=mix").choice, MIXED), () => "?topic=mix → MIXED");
check(same(url("?subject=science").choice, { subject: "science", topic: "all" }), () => "?subject=science");
check(same(url("?subject=mixed").choice, MIXED), () => "?subject=mixed");
check(url("?topic=dragons").choice === null && url("").choice === null, () => "unknown topic ignored");
check(url("?topic=typing").choice === null, () => "a menu topic this game doesn't have is ignored");
{
  const u = url("?topic=ratios", "2");
  check(u.choice === null && u.unavailable === "ratios", () => "?topic=ratios at grade 2 is reported unavailable");
}
check(same(validateFocus({ subject: "math", topic: "ratios" }, "2", catalog), { subject: "math", topic: "all" }), () => "unavailable topic → ALL MATH");
check(same(parseStoredFocus("wizardry", "x"), MIXED) && same(parseStoredFocus("ela", "ratios"), { subject: "ela", topic: "all" }), () => "stored focus parsing");
{
  const store = new Map<string, string>();
  (globalThis as unknown as { localStorage: Pick<Storage, "getItem" | "setItem" | "removeItem"> }).localStorage = {
    getItem: (k) => store.get(k) ?? null,
    setItem: (k, v) => void store.set(k, v),
    removeItem: (k) => void store.delete(k),
  };
  saveFocus({ subject: "social", topic: "geography" });
  check(same(loadFocus(), { subject: "social", topic: "geography" }), () => "focus save/load");
  check([...store.keys()].every((k) => k.startsWith("arcade.lost-library.")), () => `storage keys: ${[...store.keys()]}`);
  delete (globalThis as { localStorage?: unknown }).localStorage;
}

// The game's real question wiring (kit bankFor via import.meta.glob) through Vite's SSR loader.
{
  const { createServer } = await import("vite");
  const server = await createServer({ configFile: new URL("../vite.config.ts", import.meta.url).pathname, server: { middlewareMode: true, hmr: false }, appType: "custom", logLevel: "error" });
  try {
    const mod = (await server.ssrLoadModule("/src/library/questions.ts")) as typeof import("../src/library/questions");
    for (const g of GRADES) {
      check(mod.focusCatalog.available(g).join() === offeredAt.get(g)!.join(), () => `real catalog at ${g} differs`);
      const decks = new mod.LibraryDecks(g, "lost-library-test");
      for (const w of WINGS) {
        for (let i = 0; i < 8; i++) checkQ(decks.draw(AREAS[w].subject), `MIXED ${g} ${w}`, AREAS[w].subject!);
      }
      const final = new Set(Array.from({ length: 8 }, () => {
        const q = decks.draw(null);
        checkQ(q, `MIXED ${g} reading room`);
        return q.subject;
      }));
      check(final.size === 4, () => `grade ${g}: the Reading Room should ask all four subjects, got ${[...final]}`);
      // One subject: every wing asks it.
      for (const s of ["math", "science", "ela", "social"] as Subject[]) {
        const one = new mod.LibraryDecks(g, "lost-library-test", { subject: s, topic: "all" });
        for (const w of [...WINGS, null]) checkQ(one.draw(w ? AREAS[w].subject : null), `ALL ${s} ${g}`, s);
      }
    }
    const t = new mod.LibraryDecks("7", "lost-library-test", { subject: "math", topic: "ratios" });
    for (let i = 0; i < 10; i++) check(classifyTopic(t.draw("science")) === "ratios", () => "a topic quest asks that topic in every wing");
  } finally {
    await server.close();
  }
}

console.log(`${checks} checks, ${failures} failures (${((Date.now() - t0) / 1000).toFixed(1)} s)`);
console.log(`Rooms ${allRooms().length} (${AREA_IDS.map((a) => `${a} ${AREAS[a].rooms.length}`).join(", ")}); softlock trials ${fuzzRuns}; questions checked ${questionsChecked}; focus draws ${focusDraws}.`);
console.log("Topics by grade:");
for (const g of GRADES) console.log(`  ${g.padStart(2)}: ${offeredAt.get(g)!.join(", ")}`);
if (failures) {
  console.error(`${failures} check(s) failed`);
  process.exit(1);
}
console.log("All Quest of the Lost Library checks passed.");
