/*
 * Checks every quest (scripts/check-rules.ts runs them for all five):
 *   map data, solvability from a fresh save (every wing from its entrance with nothing in hand, the
 *   whole quest, collect-everything; K-2 and grade 3+ rules), each wing's item is really needed,
 *   timed puzzles are solvable at twice the real walking time, no softlock after random play, doors
 *   agree on both sides, Question Doors and guardians, hearts and saving.
 * Questions per quest and grade band are checked in check-rules.ts (Vite SSR, the kit's real banks).
 */
import { Game, SOLVER_STEP_MS, STEP_TIME, newSave, parseSave, type SaveData } from "../src/library/game";
import { COLS, DELTA, ROWS, TILE_CHARS, gapTiles, sideToward, worldOf, type Dir, type QuestDef } from "../src/library/quest";
import { applyAction, solve, type Action } from "../src/library/solver";
import { SONGS } from "../src/music";

export type Check = (cond: boolean, msg: () => string) => void;

export interface QuestReport {
  rooms: number;
  wings: { id: string; rooms: number; actions3: number; actionsK2: number }[];
  whole: number;
  everything: number;
  wholeK2: number;
  everythingK2: number;
  timedRooms: string[];
  fuzz: number;
  minMargin: number | null;
}

const FLOORISH = new Set([".", ",", "=", "f", "E", "S"]);
const KNOWN = new Set(TILE_CHARS.split(""));

function rng(seed: number) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32);
}

export function checkQuest(q: QuestDef, check: Check, opts: { fuzz?: number } = {}): QuestReport {
  const world = worldOf(q);
  const tag = q.id;
  const report: QuestReport = { rooms: 0, wings: [], whole: 0, everything: 0, wholeK2: 0, everythingK2: 0, timedRooms: [], fuzz: 0, minMargin: null };

  /* ------------------------------------------------------------- map data */
  const roomIds = new Set<string>();
  const doorIds = new Set<string>();
  check(q.areas[q.hub] !== undefined && q.areas[q.final] !== undefined, () => `${tag}: hub/final areas`);
  check(q.wings.length >= 3 && q.wings.length <= 4, () => `${tag}: ${q.wings.length} wings (want 3-4)`);
  for (const area of Object.values(q.areas)) {
    const spots = new Set<string>();
    for (const r of area.rooms) {
      report.rooms++;
      const at = `${tag}/${r.id}`;
      check(!roomIds.has(r.id), () => `${tag}: duplicate room id ${r.id}`);
      roomIds.add(r.id);
      check(!spots.has(r.at.join()), () => `${tag}/${area.id}: two rooms at ${r.at}`);
      spots.add(r.at.join());
      check(r.rows.length === ROWS, () => `${at}: ${r.rows.length} rows`);
      r.rows.forEach((row, y) => {
        check(row.length === COLS, () => `${at} row ${y}: ${row.length} columns`);
        [...row].forEach((c, x) => {
          check(KNOWN.has(c), () => `${at} (${x},${y}): unknown tile "${c}"`);
          if (x === 0 || y === 0 || x === COLS - 1 || y === ROWS - 1) check(c === "#", () => `${at} (${x},${y}): border must be "#"`);
        });
      });
      const has = (c: string) => r.rows.some((row) => row.includes(c));
      const sides = new Set<Dir>();
      const sideList: Dir[] = world.doorsOf(r.id).map((d) => d.side);
      if (r.exit) sideList.push(r.exit.side);
      for (const s of sideList) {
        check(!sides.has(s), () => `${at}: two doors on side ${s}`);
        sides.add(s);
        for (const [gx, gy] of gapTiles(s)) {
          const [dx, dy] = DELTA[s];
          const ix = gx - dx;
          const iy = gy - dy;
          check(FLOORISH.has(r.rows[iy][ix]), () => `${at}: tile inside the ${s} door (${ix},${iy}) is "${r.rows[iy][ix]}"`);
        }
      }
      const signs = Game.tilesOf(r, "N").length;
      check((r.signs ?? []).length === signs, () => `${at}: ${signs} signs but ${(r.signs ?? []).length} sign texts`);
      check((r.signs ?? []).every((s) => s.trim().length > 10), () => `${at}: empty sign text`);
      const ps = Game.tilesOf(r, "P");
      check(ps.length === 0 || !!r.warp, () => `${at}: gate tiles without a warp`);
      if (r.warp) {
        check(ps.length > 0, () => `${at}: warp without gate tiles`);
        const to = world.room(r.warp.room);
        check(FLOORISH.has(to.rows[r.warp.y][r.warp.x]), () => `${at}: warp lands on "${to.rows[r.warp.y][r.warp.x]}"`);
        check(q.areas[r.warp.area]?.rooms.includes(to), () => `${at}: warp area mismatch`);
      }
      if (r.exit) {
        const to = world.room(r.exit.to.room);
        check(FLOORISH.has(to.rows[r.exit.to.y][r.exit.to.x]), () => `${at}: exit lands on "${to.rows[r.exit.to.y][r.exit.to.x]}"`);
      }
      if (Game.tilesOf(r, "kmcb").length) check(!!r.puzzle, () => `${at}: k/m/c/b tiles need a puzzle`);
      if (Game.tilesOf(r, "Cc").length) check(!!r.chest && Game.tilesOf(r, "Cc").length === 1, () => `${at}: one chest per room, with contents`);
      if (r.chest) check(Game.tilesOf(r, "Cc").length === 1, () => `${at}: chest contents but no chest`);
      const p = r.puzzle;
      if (p?.kind === "blocks") {
        const sw = Game.tilesOf(r, "S").length;
        check(sw > 0 && Game.tilesOf(r, "B").length >= sw, () => `${at}: crate puzzle needs switches and enough crates`);
      }
      if (p?.kind === "torches") check(has("T"), () => `${at}: torch puzzle without torches`);
      if (p?.kind === "crystal") check(has("R"), () => `${at}: crystal puzzle without crystals`);
      if (p?.kind === "magma") check(has("*"), () => `${at}: magma puzzle without magma crystals`);
      if (p?.kind === "winders") check(has("&"), () => `${at}: wind-up puzzle without posts`);
      if (p?.kind === "secret") check(!!r.secret && has("N"), () => `${at}: secret puzzle needs secret text on a sign`);
      if (!p) check(!has("T") && !has("R") && !has("S") && !has("*") || area.id === q.hub, () => `${at}: torches/crystals/switches but no puzzle`);
      // New mechanics need what they work with.
      if (has("l")) check(has("w") || has("u"), () => `${at}: a tide lever with no tide pools or docks`);
      if ((has("w") || has("u")) && !has("l")) check(r.tide === "high" && !has("u"), () => `${at}: tide water without a lever must be deep (tide: "high") and have no docks`);
      check(has("z") === has("|"), () => `${at}: a clock switch needs timed gates and the other way round`);
      if (has("z")) check(typeof r.timer === "number" && r.timer >= 3, () => `${at}: clock switch without a timer`);
      if (has("$")) check(has("&"), () => `${at}: clockwork bridge without wind-up posts`);
      if (has("q")) check(!!r.ghost && r.ghost.length > 20, () => `${at}: friendly ghost without words`);
      if (has("u")) check(!!r.tide, () => `${at}: docks need a starting tide`);
      if (has("z") || has("%")) report.timedRooms.push(r.id);
    }
    for (const d of area.doors) {
      check(!doorIds.has(d.id), () => `${tag}: duplicate door id ${d.id}`);
      doorIds.add(d.id);
      const a = world.has(d.a) ? world.room(d.a) : null;
      const b = world.has(d.b) ? world.room(d.b) : null;
      check(!!a && !!b && area.rooms.includes(a) && area.rooms.includes(b), () => `${tag}: door ${d.id} joins rooms of another area`);
      if (a && b) {
        check(!!sideToward(a, b), () => `${tag}: door ${d.id}: ${d.a} and ${d.b} are not grid neighbours`);
        // Both sides agree: each room lists the door on facing sides.
        const sa = world.doorsOf(d.a).find((x) => x.door === d);
        const sb = world.doorsOf(d.b).find((x) => x.door === d);
        check(!!sa && !!sb && DELTA[sa.side][0] === -DELTA[sb.side][0] && DELTA[sa.side][1] === -DELTA[sb.side][1], () => `${tag}: door ${d.id} sides disagree`);
      }
    }
    for (const r of area.rooms) for (const p of r.puzzle?.opens ?? []) {
      const d = area.doors.find((x) => x.id === p);
      check(!!d && d.kind === "shutter" && (d.a === r.id || d.b === r.id), () => `${tag}/${r.id}: puzzle opens ${p}, which is not one of its shutter doors`);
    }
    for (const d of area.doors.filter((x) => x.kind === "shutter")) {
      check(area.rooms.some((r) => r.puzzle?.opens?.includes(d.id)), () => `${tag}: shutter ${d.id} is never opened by a puzzle`);
    }
    const seen = new Set([area.start.room]);
    const queue = [area.start.room];
    while (queue.length) {
      const id = queue.shift()!;
      for (const d of world.doorsOf(id)) if (!seen.has(d.other)) {
        seen.add(d.other);
        queue.push(d.other);
      }
    }
    check(seen.size === area.rooms.length, () => `${tag}/${area.id}: rooms not connected: ${area.rooms.filter((r) => !seen.has(r.id)).map((r) => r.id)}`);
    check(FLOORISH.has(world.room(area.start.room).rows[area.start.y][area.start.x]), () => `${tag}/${area.id}: start is not floor`);
  }
  for (const [k, p] of Object.entries(q.gateFront)) check(FLOORISH.has(world.room(p.room).rows[p.y][p.x]), () => `${tag}: gate front ${k} is not floor`);

  for (const w of q.wings) {
    const a = q.areas[w];
    const rooms = a.rooms;
    const count = (c: string) => rooms.reduce((n, r) => n + Game.tilesOf(r, c).length, 0);
    check(rooms.length >= 5 && rooms.length <= 8, () => `${tag}/${w}: ${rooms.length} rooms (want 5-8)`);
    check(rooms.filter((r) => r.chest === "item").length === 1, () => `${tag}/${w}: needs exactly one item chest`);
    check(rooms.filter((r) => r.chest === "book").length === 1 && world.room(q.bonusRoom[w]).chest === "book", () => `${tag}/${w}: needs one bonus chest in ${q.bonusRoom[w]}`);
    check(count("M") + count("m") === 1, () => `${tag}/${w}: needs exactly one map`);
    check(count("K") + count("k") === a.doors.filter((d) => d.kind === "locked").length, () => `${tag}/${w}: small keys vs locked doors`);
    check(a.doors.some((d) => d.kind === "question"), () => `${tag}/${w}: needs a Question Door`);
    check(a.doors.some((d) => d.kind === "locked"), () => `${tag}/${w}: needs a locked door`);
    check(!!a.item && q.items[a.item]?.wing === w, () => `${tag}/${w}: item`);
    check(!!a.guardian && q.guardians[a.guardian]?.area === w, () => `${tag}/${w}: guardian`);
    const gr = a.guardian ? world.guardianRoom(a.guardian) : null;
    check(!!gr && rooms.includes(world.room(gr)) && Game.tilesOf(world.room(gr), "G").length === 4, () => `${tag}/${w}: guardian room needs a 2x2 guardian`);
    check(a.subject !== null, () => `${tag}/${w}: subject`);
    check(rooms.some((r) => r.exit?.to.area === q.hub), () => `${tag}/${w}: no way back to the hub`);
    check(!!q.wingBook[w] && !!q.bonusBook[w] && q.books.some((b) => b.id === q.wingBook[w]) && q.books.some((b) => b.id === q.bonusBook[w]), () => `${tag}/${w}: treasures`);
    check(!!q.music.wings[w] && !!SONGS[q.music.wings[w]], () => `${tag}/${w}: music`);
    check(!!q.helper.wingNames[w], () => `${tag}/${w}: helper hint name`);
    check(q.areas[q.hub].rooms.some((r) => r.warp?.area === w), () => `${tag}: the hub has no gate to ${w}`);
  }
  check(q.areas[q.hub].rooms.some((r) => r.warp?.area === q.final && r.sealed), () => `${tag}: the final gate is sealed`);
  check(new Set(q.wings.map((w) => q.areas[w].item)).size === q.wings.length, () => `${tag}: different items`);
  check(new Set(q.wings.map((w) => q.areas[w].subject)).size === q.wings.length, () => `${tag}: different subjects`);
  check(Object.values(q.guardians).every((g) => g.need >= 3 && g.intro.length > 40 && g.win.length > 20), () => `${tag}: guardian texts`);
  check(q.guardians[q.areas[q.final].guardian ?? ""]?.need >= 4, () => `${tag}: the final guardian needs 4 right answers`);
  check(q.books.length === q.wings.length * 2 + 1 && new Set(q.books.map((b) => b.id)).size === q.books.length && q.books.every((b) => b.fact.length > 30 && /[.!"]$/.test(b.fact)), () => `${tag}: treasures with facts`);
  check(q.books.some((b) => b.id === q.finalBook), () => `${tag}: final treasure`);
  check(!!SONGS[q.music.hub] && !!SONGS[q.music.final], () => `${tag}: hub/final music`);
  check(q.saveKey === (q.id === "library" ? "arcade.lost-library.save.v1" : `arcade.lost-library.save.${q.id}.v1`), () => `${tag}: save key ${q.saveKey}`);
  check(new Set(Object.values(q.items).map((i) => i.name)).size === Object.keys(q.items).length, () => `${tag}: item names`);
  check(q.texts.intro.length > 0 && q.texts.intro.every((m) => m.text.length > 40), () => `${tag}: story intro`);
  check(q.texts.endingTitle.length > 5 && q.texts.endingText.length > 10, () => `${tag}: story outro`);

  /* ------------------------------------------------------------- solvable */
  const solverOpts = (early: boolean) => ({ early, enemies: false, invincible: true, quest: q });
  const wingSave = (w: string): SaveData => {
    const s = newSave(q);
    s.at = { ...q.areas[w].start };
    s.entry = { ...s.at };
    return s;
  };
  const wingDone = (w: string) => (g: Game) => g.s.restored.includes(w);
  const solutions = new Map<string, Action[]>();
  for (const early of [false, true]) {
    for (const w of q.wings) {
      const g = new Game(wingSave(w), solverOpts(early));
      const r = solve(g, wingDone(w), { area: w });
      check(r.ok, () => `${tag}/${w} (${early ? "K-2" : "3+"}) is not solvable from its entrance: ${r.reason}`);
      if (r.ok) solutions.set(`${w}|${early}`, r.actions);
      check(g.s.items.includes(q.areas[w].item!), () => `${tag}/${w}: solved without picking up its item`);
      let entry = report.wings.find((x) => x.id === w);
      if (!entry) report.wings.push((entry = { id: w, rooms: q.areas[w].rooms.length, actions3: 0, actionsK2: 0 }));
      if (early) entry.actionsK2 = r.actions.length;
      else entry.actions3 = r.actions.length;
      // The item really is needed: without it the wing can't be finished.
      const noItem = new Game(wingSave(w), solverOpts(early));
      const blocked = solve(noItem, wingDone(w), { area: w, accept: (x) => x.s.items.length === 0 });
      check(!blocked.ok, () => `${tag}/${w}: can be finished without the ${q.items[q.areas[w].item!].name}`);
      // Timed puzzles with room to spare: solvable even at twice the real walking time.
      if (q.areas[w].rooms.some((rm) => Game.timed(rm))) {
        const slowMs = Math.round(STEP_TIME * (early ? 1.15 : 1) * 2000);
        const slow = new Game(wingSave(w), solverOpts(early));
        const rs = solve(slow, wingDone(w), { area: w, stepMs: slowMs });
        check(rs.ok, () => `${tag}/${w} (${early ? "K-2" : "3+"}): timed puzzles not solvable at 2x walking time: ${rs.reason}`);
      }
    }
    const g = new Game(null, solverOpts(early));
    const full = solve(g, (x) => x.s.finished);
    check(full.ok, () => `${tag}: whole quest (${early ? "K-2" : "3+"}) not solvable: ${full.reason}`);
    check(g.s.restored.length === q.wings.length && g.s.books.includes(q.finalBook), () => `${tag}: finishing restores every wing and gives the final treasure`);
    const all = new Game(null, solverOpts(early));
    const everything = (x: Game) =>
      x.s.finished && x.s.books.length === q.books.length && x.s.maps.length === q.wings.length && x.s.items.length === q.wings.length &&
      Object.values(q.areas).every((a) => a.doors.every((d) => x.doorOpen(d))) &&
      world.allRooms().every((r) => Game.tilesOf(r, "KkMmCc").every(([cx, cy]) => x.s.taken.includes(`${r.id}:${cx},${cy}`)));
    const coll = solve(all, everything);
    check(coll.ok, () => `${tag}: collect-everything (${early ? "K-2" : "3+"}) failed: ${coll.reason}`);
    if (early) {
      report.wholeK2 = full.actions.length;
      report.everythingK2 = coll.actions.length;
    } else {
      report.whole = full.actions.length;
      report.everything = coll.actions.length;
    }
  }

  // Timer margin: the shortest clock-switch-to-gate walk vs the timer (grade 3+, real walking speed).
  for (const id of report.timedRooms) {
    const r = world.room(id);
    if (!r.rows.some((row) => row.includes("z"))) continue;
    const z = Game.tilesOf(r, "z");
    const gates = Game.tilesOf(r, "|");
    // BFS over tiles a hero can stand on (ignoring items) from each switch to the farthest gate it must reach.
    let worst = 0;
    for (const [gx, gy] of gates) {
      let best = Infinity;
      for (const [zx, zy] of z) {
        const dist = new Map<string, number>([[`${zx},${zy}`, 0]]);
        const qu: [number, number][] = [[zx, zy]];
        while (qu.length) {
          const [x, y] = qu.shift()!;
          const d0 = dist.get(`${x},${y}`)!;
          if (x === gx && y === gy) {
            best = Math.min(best, d0);
            break;
          }
          for (const [dx, dy] of Object.values(DELTA)) {
            const nx = x + dx;
            const ny = y + dy;
            if (nx <= 0 || ny <= 0 || nx >= COLS - 1 || ny >= ROWS - 1 || dist.has(`${nx},${ny}`)) continue;
            if (!".,=fESz|<>AVKMkmci;".includes(r.rows[ny][nx])) continue;
            dist.set(`${nx},${ny}`, d0 + 1);
            qu.push([nx, ny]);
          }
        }
      }
      if (best < Infinity) worst = Math.max(worst, best);
    }
    const margin = (r.timer ?? 6) / (worst * STEP_TIME);
    check(worst > 0 && margin >= 2, () => `${tag}/${id}: timer ${r.timer}s for a ${worst}-step run (margin ${margin.toFixed(2)}x, want 2x)`);
    report.minMargin = report.minMargin === null ? margin : Math.min(report.minMargin, margin);
  }

  // No softlock: random play (walking, pushing crates anywhere, levers, items) never makes a wing unsolvable.
  const trials = opts.fuzz ?? 8;
  for (const w of q.wings) {
    const sol = solutions.get(`${w}|false`) ?? [];
    for (let trial = 0; trial < trials; trial++) {
      const r = rng(trial * 97 + w.length * 7 + q.id.length);
      const g = new Game(wingSave(w), { early: trial % 2 === 1, enemies: false, invincible: true, rng: r, quest: q });
      const upto = Math.floor((sol.length * trial) / trials);
      for (const a of sol.slice(0, upto)) applyAction(g, a);
      const dirs: Dir[] = ["up", "down", "left", "right"];
      const acts: Action[] = [...dirs, ...dirs, "enter@up", "enter@left", "x:lantern@up", "wait", ...g.s.items.map((i) => `x:${i}@${dirs[trial % 4]}` as Action)];
      for (let i = 0; i < 160; i++) {
        applyAction(g, acts[Math.floor(r() * acts.length)]);
        if (g.s.at.area !== w) g.goTo(q.areas[w].start);
      }
      const res = solve(g, wingDone(w), { area: w, allowReset: true });
      report.fuzz++;
      check(res.ok, () => `${tag}/${w}: softlock after random play (trial ${trial}): ${res.reason}`);
    }
  }

  /* ------------------------------------------------- Question Doors & guardians */
  for (const w of q.wings) {
    const qd = q.areas[w].doors.find((d) => d.kind === "question")!;
    const g = new Game(wingSave(w), solverOpts(false));
    const rd = world.doorsOf(qd.a).find((x) => x.door === qd)!;
    const [gx, gy] = gapTiles(rd.side)[0];
    const [dx, dy] = DELTA[rd.side];
    g.enterRoom(qd.a, gx - dx, gy - dy, rd.side);
    g.takeEvents();
    const before = g.progSig();
    const hearts = g.s.hearts;
    g.move(rd.side);
    const evs = g.takeEvents();
    check(evs.some((e) => e.type === "question" && e.doorId === qd.id), () => `${tag}/${w}: bumping the Question Door asks a question`);
    check(g.progSig() === before && g.s.hearts === hearts, () => `${tag}/${w}: a Question Door bump (a wrong answer) changes nothing`);
    g.move(rd.side);
    check(g.takeEvents().some((e) => e.type === "question"), () => `${tag}/${w}: the Question Door asks again`);
    g.openQuestionDoor(qd.id);
    check(g.move(rd.side) && g.move(rd.side) && g.s.at.room === qd.b, () => `${tag}/${w}: walk through the opened Question Door`);
  }
  for (const gd of Object.values(q.guardians)) {
    const h = new Game(null, solverOpts(false));
    let done = false;
    for (let i = 0; i < gd.need * 2; i++) {
      const right = i % 2 === 1;
      const before = h.guardianProgress(gd.id);
      done = h.guardianAnswer(gd.id, right);
      check(h.guardianProgress(gd.id) === before + (right ? 1 : 0), () => `${tag}/${gd.id}: a wrong answer changed progress`);
      if (done) break;
    }
    check(done && h.guardianProgress(gd.id) === gd.need, () => `${tag}/${gd.id}: needs ${gd.need} right answers`);
    if (gd.area === q.final) check(h.s.finished && h.s.books.includes(q.finalBook), () => `${tag}: the final guardian finishes the quest`);
    else check(h.s.restored.includes(gd.area) && h.s.books.includes(q.wingBook[gd.area]) && h.s.at.room === q.gateFront[gd.area].room, () => `${tag}/${gd.id}: restores the wing and returns to the hub`);
  }

  /* --------------------------------------------------------------- saving */
  {
    const w = q.wings[0];
    const g = new Game(wingSave(w), solverOpts(false));
    const sol = solutions.get(`${w}|false`) ?? [];
    for (const a of sol.slice(0, Math.floor(sol.length * 0.6))) applyAction(g, a);
    const raw = JSON.stringify(g.s);
    const back = parseSave(raw, q);
    check(!!back && JSON.stringify(back) === raw, () => `${tag}: save round-trips exactly`);
    const g2 = new Game(back, solverOpts(false));
    check(g2.progSig() === g.progSig() && g2.s.at.room === g.s.at.room && g2.s.tide.join() === g.s.tide.join(), () => `${tag}: loading restores progress, position and tides`);
    check(parseSave(raw) === null || q.id === "library", () => `${tag}: another quest's save is not mistaken for the Lost Library's`);
    check(parseSave(JSON.stringify({ ...g.s, at: { ...g.s.at, room: "nowhere" } }), q) === null, () => `${tag}: damaged saves start fresh`);
  }
  void SOLVER_STEP_MS;
  return report;
}

/* ------------------------------------------------------------------ mechanic unit tests */

/** A tiny test quest: one room per mechanic, so every new tile is checked on its own. */
function labQuest(rows: Record<string, { rows: string[]; extra?: Partial<import("../src/library/quest").RoomDef> }>, items: Record<string, import("../src/library/quest").ItemPower> = {}): QuestDef {
  const P = (room: string, x: number, y: number) => ({ area: "lab", room, x, y, facing: "up" as Dir });
  const ids = Object.keys(rows);
  const pal = { floorA: "#000", floorB: "#000", rug: "#000", rugEdge: "#000", shelf: "#000", shelfDark: "#000", accent: "#000", building: "#000", buildingDark: "#000" };
  const look = { wall: "stone" as const, floor: "tiles" as const, pal };
  return {
    id: "lab", title: "Lab", tagline: "", story: "", saveKey: "arcade.lost-library.save.lab.v1", theme: "clock",
    hub: "lab", final: "lab", wings: [],
    areas: {
      lab: {
        id: "lab", name: "Lab", short: "LAB", subject: null, item: null, guardian: null, look, start: P(ids[0], 1, 1),
        rooms: ids.map((id, i) => ({ id, name: id, at: [i, 0] as [number, number], rows: rows[id].rows, ...rows[id].extra })),
        doors: [],
      },
    },
    guardians: {},
    items: Object.fromEntries(Object.entries(items).map(([id, power]) => [id, { id, name: id, short: id, wing: "lab", how: "", power, color: "#fff" }])),
    gateFront: {}, books: [], wingBook: {}, bonusBook: {}, finalBook: "", bonusRoom: {},
    pests: { hub: "mouse", wing: "soldier", name: "soldier" }, music: { hub: "town", wings: {}, final: "town" }, gateColor: {},
    terms: { wing: "wing", wings: "wings", treasure: "gear", treasures: "gears", shelf: "", found: "", pests: "" },
    helper: { name: "", first: "", progress: () => "", all: "", done: "", wingNames: {} },
    texts: {
      intro: [], howTo: "", faint: "", sealed: () => "", thanks: "", finalThanks: "", crack: "", decor: "", endingTitle: "", endingText: "",
      carries: "", hubName: "", finalName: "",
    },
  };
}
const room = (...mid: string[]) => ["####################", ...mid.map((r) => `#${r.padEnd(18, ".")}#`), ...Array(10 - mid.length).fill("#..................#"), "####################"];

export function checkMechanics(check: Check): void {
  const lab = labQuest(
    {
      tide: { rows: room("..l...", "..wwu.", "......"), extra: { tide: "low" } },
      bubble: { rows: room("..jjjj....", "..wwww...."), extra: { tide: "high" } },
      clock: { rows: room("z.|.K....."), extra: { timer: 3 } },
      belt: { rows: room(">>>>K....", "....#", "AAA") },
      wind: { rows: room("&.$$.", "....."), extra: { puzzle: { kind: "winders" } } },
      lava: { rows: room(".^h*", ".bbb"), extra: { puzzle: { kind: "magma" } } },
      vent: { rows: room(".%..") },
      ghost: { rows: room(".q.", "iii"), extra: { ghost: "Boo! I'm a friendly ghost. The exit is to the left, hee hee!" } },
    },
    { bubble: "bubble", key: "windup", lamp: "heat", glow: "ghost" },
  );
  const at = (g: Game, roomId: string, x: number, y: number) => {
    g.enterRoom(roomId, x, y, "up");
    g.takeEvents();
  };
  const mk = (early = false) => new Game(null, { early, enemies: false, quest: lab });

  // Tide: low tide = sand you can walk on, docks sunk; the lever floods it; rising water floats you back.
  {
    const g = mk();
    at(g, "tide", 2, 2);
    check(g.tile(3, 2) === "s" && g.tile(5, 2) === "_", () => "low tide: sand and a sunk dock");
    check(g.move("right") && g.s.at.x === 3, () => "walk onto low-tide sand");
    check(g.move("left") && g.move("up") && g.s.at.x === 2 && g.s.at.y === 1, () => "walk back off the sand");
    g.s.at.facing = "right";
    g.interact();
    check(g.tideHigh() && g.tile(3, 2) === "w" && g.tile(5, 2) === "u", () => "the lever raises the tide: deep water, floating dock");
    check(g.move("down") && !g.move("right") && g.s.at.x === 2, () => "deep water blocks without a bubble");
    const h = mk();
    at(h, "tide", 2, 2);
    h.move("right");
    h.s.at.facing = "up";
    h.interact();
    check(h.tideHigh() && h.s.at.x === 2 && h.s.at.y === 2, () => "the tide rising under you floats you back to the doorway");
  }
  // Bubble shield: deep water and currents for a few steps; popping over water floats you back.
  {
    const g = mk();
    g.s.items.push("bubble");
    at(g, "bubble", 2, 1);
    check(!g.move("right") && g.s.at.x === 2, () => "currents block without a bubble");
    g.select("bubble");
    g.useItem();
    check(g.shield === 10, () => `a bubble lasts 10 steps (got ${g.shield})`);
    check(g.move("right") && g.tile(3, 1) === "j", () => "swim into a current inside the bubble");
    const k2 = mk(true);
    k2.s.items.push("bubble");
    at(k2, "bubble", 2, 1);
    k2.select("bubble");
    k2.useItem();
    check(k2.shield === 14, () => "K-2 bubbles last longer");
    for (let i = 0; i < 12 && g.shield > 0; i++) g.move(i % 2 ? "left" : "right");
    check(g.shield === 0 && g.s.at.x === g.s.entry.x && g.s.at.y === g.s.entry.y, () => "a bubble that pops over water floats you back to the doorway");
  }
  // Clock switch and timed gates (K-2 gets half as long again).
  {
    const g = mk();
    at(g, "clock", 2, 1);
    check(g.tile(3, 1) === "|" && !g.move("right"), () => "a closed timed gate blocks");
    g.s.at.x = 2;
    check(g.move("left") && g.timerMs === 3000, () => `the clock switch starts its timer (${g.timerMs})`);
    check(g.tile(3, 1) === ":", () => "the gate opens");
    g.passTime(1000);
    check(g.move("right") && g.move("right") && g.s.at.x === 3, () => "walk into the open gate");
    g.passTime(5000);
    check(g.timerMs === 0 && g.tile(3, 1) === ":", () => "the gate stays open while you stand in it");
    check(g.move("right") && g.tile(3, 1) === "|", () => "and shuts after you");
    const k2 = mk(true);
    at(k2, "clock", 2, 1);
    k2.move("left");
    check(k2.timerMs === 4500, () => "K-2 timers are 1.5x");
  }
  // Conveyors carry you to the end (picking things up on the way); stepping on against the flow sends you back.
  {
    const g = mk();
    at(g, "belt", 1, 2);
    check(g.move("up") && g.s.at.x === 5 && g.s.at.y === 1 && g.s.keys.lab === undefined, () => `a belt carries you to its end (${g.s.at.x},${g.s.at.y})`);
    check(g.lastSteps === 5, () => `ride length counts every tile (${g.lastSteps})`);
    at(g, "belt", 2, 4);
    check(g.move("up") && g.s.at.y === 2 && g.s.at.x === 2, () => `an up belt carries you to its end (${g.s.at.x},${g.s.at.y})`);
  }
  // Wind-up posts and clockwork bridges.
  {
    const g = mk();
    g.s.items.push("key");
    at(g, "wind", 2, 1);
    check(g.tile(3, 1) === "_" && !g.move("right"), () => "a folded clockwork bridge is a gap");
    g.s.at.facing = "left";
    g.select("key");
    g.useItem();
    check(g.tile(1, 1) === "a" && g.tile(3, 1) === "I" && g.s.solved.includes("wind"), () => "winding every post unfolds the bridge and solves the room");
    check(g.move("right") && g.move("right") && g.s.at.x === 4, () => "walk across the clockwork bridge");
  }
  // Lava puddles, hot rock, magma crystals and cooled-rock bridges.
  {
    const g = mk();
    at(g, "lava", 1, 1);
    const h0 = g.s.hearts;
    check(!g.move("right") && g.s.hearts === h0 - 1, () => "lava costs a heart from grade 3 up");
    const k2 = mk(true);
    at(k2, "lava", 1, 1);
    const k0 = k2.s.hearts;
    check(k2.move("right") && k2.s.hearts === k0, () => "K-2: lava is a harmless cooled crust");
    check(!k2.move("right"), () => "hot rock blocks without a heat-proof item");
    k2.s.items.push("lamp");
    check(k2.move("right") && k2.s.at.x === 3, () => "hot rock is fine with a heat-proof item");
    check(k2.tile(2, 2) === "_", () => "a lava river before the puzzle");
    k2.s.at.facing = "right";
    k2.select("lamp");
    k2.useItem();
    check(k2.tile(4, 1) === "+" && k2.s.solved.includes("lava") && k2.tile(2, 2) === "I", () => "lighting the magma crystal cools the lava into a bridge");
  }
  // Steam vents: blocked while puffing, a puff blows you along.
  {
    const g = mk();
    at(g, "vent", 1, 1);
    check(g.tile(2, 1) === ";" && g.move("right") && g.s.at.x === 2, () => "a resting vent can be crossed");
    g.passTime(1600);
    check(g.s.at.x === 4, () => `a puff blows you along (${g.s.at.x})`);
    check(g.tile(2, 1) === "%", () => "the vent puffs");
    check(g.move("left") && g.s.at.x === 3, () => "step back towards the vent");
    check(!g.move("left") && g.s.at.x === 3, () => "a puffing vent blocks");
    const k2 = mk(true);
    at(k2, "vent", 1, 1);
    k2.passTime(2000);
    check(k2.tile(2, 1) === ";", () => "K-2 vents rest longer");
  }
  // The ghost lantern: hidden floors and friendly ghosts appear.
  {
    const g = mk();
    g.s.items.push("glow");
    at(g, "ghost", 1, 1);
    check(g.tile(2, 1) === "." && g.tile(1, 2) === "_", () => "ghosts and hidden floors are invisible at first");
    g.select("glow");
    g.useItem();
    check(g.tile(2, 1) === "q" && g.tile(1, 2) === "I", () => "the ghost lantern shows them");
    g.s.at.facing = "right";
    g.takeEvents();
    g.interact();
    check(g.takeEvents().some((e) => e.type === "msg" && e.text.startsWith("Boo!")), () => "a friendly ghost talks");
  }
}
