/*
 * A headless solver over the real game rules (game.ts), used by scripts/check-rules.ts and, through
 * the ?debug hook, by the playtest.
 *
 * Progress in this game only ever grows (keys found, doors opened, torches lit, puzzles solved,
 * items, books, wings restored), and keys always match locked doors inside each wing, so a greedy
 * search is complete: search everything that does NOT count as progress until any new progress is
 * found, take it, and repeat until the goal. Question Doors and guardians are answered right (a
 * wrong answer never changes anything, so it can never make a wing unsolvable).
 *
 * The search is "push-level", like a Sokoban solver: walking around freely inside a room changes
 * nothing, so each search node is (room, crate positions, the hero's walkable region), and the
 * expensive steps are only pushes, room changes, item uses and talking.
 *
 * Pure TypeScript (no DOM).
 */
import { Game, SOLVER_STEP_MS } from "./game";
import { DELTA, type Dir, type Place } from "./quest";

/**
 * A step: a move, or face a direction and use an item / press Enter, wait a moment (steam vents),
 * or reset the room.
 */
export type Action = Dir | "reset" | "wait" | `enter@${Dir}` | `x:${string}@${Dir}`;

const MOVES: Dir[] = ["up", "down", "left", "right"];

/**
 * Runs one action, answering any Question Door or guardian right. Every action takes `stepMs` of
 * game time (a conveyor ride one step per tile), so timed gates and steam vents are played at a
 * walking speed slower than the real one: whatever the solver manages, a player manages too.
 */
export function applyAction(g: Game, a: Action, stepMs = SOLVER_STEP_MS): void {
  let steps = 1;
  if (a === "reset") g.resetRoom();
  else if (a === "wait") {
    // just time passing
  } else if (a.startsWith("enter@")) {
    g.s.at.facing = a.slice(6) as Dir;
    g.interact();
  } else if (a.startsWith("x:")) {
    const [item, dir] = a.slice(2).split("@");
    g.s.at.facing = dir as Dir;
    g.select(item === "lantern" ? null : item);
    g.useItem();
  } else {
    g.move(a as Dir);
    steps = Math.max(1, g.lastSteps);
  }
  if (a !== "reset") g.passTime(stepMs * steps);
  for (const e of g.takeEvents()) {
    if (e.type === "question") g.openQuestionDoor(e.doorId);
    else if (e.type === "guardian") {
      for (let i = 0; i < 20 && !g.guardianAnswer(e.guardian, true); i++);
    }
  }
}

/* The parts of the state that change without progress. */
interface Light {
  at: Place;
  entry: Place;
  blocks: [number, number][];
  selected: string | null;
  /** Tide levers flipped (reversible, so not progress). */
  tide: string[];
  clockMs: number;
  timerMs: number;
  shield: number;
}
function getLight(g: Game): Light {
  return {
    at: { ...g.s.at }, entry: { ...g.s.entry }, blocks: g.blocks.map(([x, y]) => [x, y]), selected: g.s.selected,
    tide: [...g.s.tide], clockMs: g.clockMs, timerMs: g.timerMs, shield: g.shield,
  };
}
function setLight(g: Game, l: Light, x = l.at.x, y = l.at.y) {
  g.s.at = { ...l.at, x, y };
  g.s.entry = { ...l.entry };
  g.blocks = l.blocks.map(([bx, by]) => [bx, by]);
  g.s.selected = l.selected;
  g.s.tide = [...l.tide];
  g.clockMs = l.clockMs;
  g.timerMs = l.timerMs;
  g.shield = l.shield;
  g.enemies = [];
  g.drops = [];
  g.events = [];
}
/* Crate rooms: corner squares a crate can never leave (unless they are switches), and a distance guess. */
const deadCache = new Map<string, Set<string>>();
function deadSquares(g: Game): Set<string> {
  const room = g.room;
  const hit = deadCache.get(room.id);
  if (hit) return hit;
  const dead = new Set<string>();
  const blocked = (x: number, y: number) => x <= 0 || y <= 0 || x >= 19 || y >= 11 || !".,=fSEB".includes(room.rows[y][x]);
  room.rows.forEach((row, y) =>
    [...row].forEach((c, x) => {
      if (blocked(x, y) || c === "S") return;
      if ((blocked(x, y - 1) || blocked(x, y + 1)) && (blocked(x - 1, y) || blocked(x + 1, y))) dead.add(`${x},${y}`);
    }),
  );
  deadCache.set(room.id, dead);
  return dead;
}
function crateGuess(g: Game, blocks: [number, number][]): number {
  const room = g.room;
  if (room.puzzle?.kind !== "blocks" || g.s.solved.includes(room.id)) return 0;
  const sw = Game.tilesOf(room, "S");
  return blocks.reduce((sum, [x, y]) => sum + Math.min(...sw.map(([sx, sy]) => Math.abs(sx - x) + Math.abs(sy - y))), 0);
}

/** A small binary heap (lowest priority first; ties in insertion order). */
class Heap<T> {
  private a: { p: number; n: number; v: T }[] = [];
  private n = 0;
  get size() {
    return this.a.length;
  }
  push(p: number, v: T) {
    const a = this.a;
    a.push({ p, n: this.n++, v });
    let i = a.length - 1;
    while (i > 0) {
      const j = (i - 1) >> 1;
      if (this.less(a[j], a[i])) break;
      [a[i], a[j]] = [a[j], a[i]];
      i = j;
    }
  }
  pop(): T {
    const a = this.a;
    const top = a[0];
    const last = a.pop()!;
    if (a.length) {
      a[0] = last;
      let i = 0;
      for (;;) {
        const l = 2 * i + 1;
        const r = l + 1;
        let m = i;
        if (l < a.length && this.less(a[l], a[m])) m = l;
        if (r < a.length && this.less(a[r], a[m])) m = r;
        if (m === i) break;
        [a[i], a[m]] = [a[m], a[i]];
        i = m;
      }
    }
    return top.v;
  }
  private less(x: { p: number; n: number }, y: { p: number; n: number }) {
    return x.p < y.p || (x.p === y.p && x.n < y.n);
  }
}

/** Rooms with steam vents: the vent rhythm's period (ms), so the clock only matters modulo it. */
const ventPeriod = new Map<string, number>();
function configKey(g: Game, l: Light): string {
  let key = `${l.at.room}|${l.blocks.map(([x, y]) => `${x},${y}`).join(";")}|${l.entry.room},${l.entry.x},${l.entry.y}`;
  if (l.tide.length) key += `|t${[...l.tide].sort().join(",")}`;
  if (l.shield > 0) key += `|b${l.shield}`;
  if (l.timerMs > 0) key += `|z${Math.round(l.timerMs)}`;
  const room = g.world.room(l.at.room);
  if (room.rows.some((r) => r.includes("%"))) {
    const k = `${g.q.id}:${room.id}:${g.opts.early}`;
    let per = ventPeriod.get(k);
    if (per === undefined) {
      const v = g.ventRhythm(room);
      per = v.on + v.off;
      ventPeriod.set(k, per);
    }
    key += `|v${Math.round(l.clockMs) % per}`;
  }
  return key;
}

/** Item and Enter actions that can possibly do something at this spot (the rest change nothing). */
function usefulActs(g: Game, x: number, y: number): Action[] {
  const out: Action[] = [];
  const room = g.room;
  const has = (c: string) => room.rows.some((r) => r.includes(c));
  const boomerang = g.itemWith("boomerang");
  const grapple = g.itemWith("grapple");
  const windup = g.itemWith("windup");
  const heat = g.itemWith("heat");
  for (const d of MOVES) {
    const [dx, dy] = DELTA[d];
    const t = g.tile(x + dx, y + dy);
    if (t === "G" || t === "C" || t === "l") out.push(`enter@${d}`);
    if (t === "T") out.push(`x:lantern@${d}`);
    if (boomerang && has("R")) out.push(`x:${boomerang}@${d}`);
    if (grapple && has("o")) out.push(`x:${grapple}@${d}`);
    if (windup && t === "&") out.push(`x:${windup}@${d}`);
    if (heat && t === "*") out.push(`x:${heat}@${d}`);
  }
  const reveal = g.itemWith("reveal");
  if (reveal && (has("i") || room.secret) && !g.s.revealed.includes(room.id)) out.push(`x:${reveal}@up`);
  const echo = g.itemWith("echo");
  if (echo) out.push(`x:${echo}@up`);
  const ghost = g.itemWith("ghost");
  if (ghost) {
    const unseen = (has("i") || has("q") || !!room.secret) && !g.s.revealed.includes(room.id);
    const hidden = g.world.doorsOf(room.id).some((d) => d.door.kind === "hidden" && !g.s.opened.includes(d.door.id));
    if (unseen || hidden) out.push(`x:${ghost}@up`);
  }
  const bubble = g.itemWith("bubble");
  if (bubble && g.shield === 0 && (has("w") || has("j"))) out.push(`x:${bubble}@up`);
  if (has("%")) out.push("wait");
  return out;
}

export interface SolveResult {
  ok: boolean;
  actions: Action[];
  milestones: number;
  /** Actions tried in total. */
  nodes: number;
  reason?: string;
}

export interface SolveOpts {
  /** Stay inside this area (a wing must be solvable on its own). */
  area?: string;
  /** Game time per action (default SOLVER_STEP_MS). */
  stepMs?: number;
  /** Stay inside this room. */
  room?: string;
  /** Only progress that passes this counts; other progress is treated as a dead end. */
  accept?: (g: Game) => boolean;
  /** Allow "Reset room" (the pause menu's button). */
  allowReset?: boolean;
  maxNodes?: number;
  maxMilestones?: number;
}

/** Greedy progress search until `goal` holds. Leaves `g` in the final state. */
export function solve(g: Game, goal: (g: Game) => boolean, opts: SolveOpts = {}): SolveResult {
  const actions: Action[] = [];
  const maxNodes = opts.maxNodes ?? 3_000_000;
  let nodes = 0;
  const maxM = opts.maxMilestones ?? 400;
  for (let m = 0; m < maxM; m++) {
    if (goal(g)) return { ok: true, actions, milestones: m, nodes };
    const sig = g.progSig();
    const saved = g.snapshot();
    const start = getLight(g);
    const outer = new Heap<{ light: Light; path: Action[]; depth: number }>();
    outer.push(0, { light: start, path: [], depth: 0 });
    /** config|x,y of every spot already flooded. */
    const flooded = new Set<string>();
    let found: Action[] | null = null;

    const tryAct = (light: Light, x: number, y: number, a: Action): "progress" | "same" | Light => {
      setLight(g, light, x, y);
      applyAction(g, a, opts.stepMs);
      nodes++;
      if (g.progSig() !== sig) {
        if (!opts.accept || opts.accept(g)) return "progress";
        g.restore(saved); // progress we don't want: undo it completely
        return "same";
      }
      return getLight(g);
    };

    while (outer.size && !found) {
      const { light, path, depth } = outer.pop();
      const ck = configKey(g, light);
      if (flooded.has(`${ck}|${light.at.x},${light.at.y}`)) continue;
      // Flood the hero's free-walk region in this configuration.
      const inner: { x: number; y: number; path: Action[] }[] = [{ x: light.at.x, y: light.at.y, path }];
      flooded.add(`${ck}|${light.at.x},${light.at.y}`);
      for (let ii = 0; ii < inner.length && !found; ii++) {
        const p = inner[ii];
        const acts: Action[] = [...MOVES, ...usefulActs((setLight(g, light, p.x, p.y), g), p.x, p.y)];
        if (opts.allowReset && ii === 0) acts.push("reset");
        for (const a of acts) {
          const r = tryAct(light, p.x, p.y, a);
          if (r === "progress") {
            found = [...p.path, a];
            break;
          }
          if (r === "same") continue;
          if (opts.area && r.at.area !== opts.area) continue;
          if (opts.room && r.at.room !== opts.room) continue;
          const nk = configKey(g, r);
          const spot = `${nk}|${r.at.x},${r.at.y}`;
          if (flooded.has(spot)) continue;
          if (nk === ck && a !== "reset") {
            // Same room, same crates: just walking (or a quill pull). Part of this region.
            flooded.add(spot);
            inner.push({ x: r.at.x, y: r.at.y, path: [...p.path, a] });
          } else {
            // Prune crates pushed into a dead corner (they could never reach a switch).
            if (nk.split("|")[0] === ck.split("|")[0] && g.room.puzzle?.kind === "blocks" && !g.s.solved.includes(g.room.id)) {
              const dead = deadSquares(g);
              if (r.blocks.some(([bx, by]) => dead.has(`${bx},${by}`))) continue;
            }
            outer.push(depth + 1 + 3 * crateGuess(g, r.blocks), { light: { ...r, at: { ...r.at } }, path: [...p.path, a], depth: depth + 1 });
          }
        }
        if (nodes > maxNodes) {
          g.restore(saved);
          return { ok: false, actions, milestones: m, nodes, reason: `search too big near ${light.at.room}` };
        }
      }
    }
    if (!found) {
      g.restore(saved);
      return { ok: false, actions, milestones: m, nodes, reason: `stuck in ${g.s.at.room} (${g.s.at.x},${g.s.at.y}) after ${actions.length} actions` };
    }
    // Replay the winning path from the milestone's start, so the game is exactly in that state.
    g.restore(saved);
    for (const a of found) applyAction(g, a, opts.stepMs);
    if (g.progSig() === sig) {
      return { ok: false, actions, milestones: m, nodes, reason: `replay mismatch near ${g.s.at.room}` };
    }
    actions.push(...found);
  }
  return { ok: goal(g), actions, milestones: maxM, nodes, reason: goal(g) ? undefined : "too many milestones" };
}

/**
 * Plain BFS inside the current room to a target tile (moves only: never leaves the room, never
 * pushes crates, never picks anything up on the way). Returns the moves, or null.
 */
export function pathTo(g: Game, tx: number, ty: number): Dir[] | null {
  const saved = g.snapshot();
  const light = getLight(g);
  const sig = g.progSig();
  const queue: { x: number; y: number; path: Dir[] }[] = [{ x: light.at.x, y: light.at.y, path: [] }];
  const seen = new Set([`${light.at.x},${light.at.y}`]);
  const blocks = configKey(g, light);
  try {
    for (let qi = 0; qi < queue.length; qi++) {
      const p = queue[qi];
      if (p.x === tx && p.y === ty) return p.path;
      for (const d of MOVES) {
        setLight(g, light, p.x, p.y);
        g.move(d);
        g.takeEvents();
        // The target itself may hold a pickup (picking it up is the point of walking there).
        if (g.s.at.room === light.at.room && g.s.at.x === tx && g.s.at.y === ty) return [...p.path, d];
        if (configKey(g, getLight(g)) !== blocks || g.progSig() !== sig) continue;
        const k = `${g.s.at.x},${g.s.at.y}`;
        if (seen.has(k)) continue;
        seen.add(k);
        queue.push({ x: g.s.at.x, y: g.s.at.y, path: [...p.path, d] });
      }
    }
    return null;
  } finally {
    g.restore(saved);
  }
}

/** The moves (and pushes) that solve the current room's crate puzzle, or null. */
export function solveRoomBlocks(g: Game): Dir[] | null {
  const saved = g.snapshot();
  const room = g.s.at.room;
  try {
    const done = (x: Game) => x.s.solved.includes(room);
    const res = solve(g, done, { room, accept: done, maxMilestones: 2 });
    if (!res.ok || res.actions.some((a) => !MOVES.includes(a as Dir))) return null;
    return res.actions as Dir[];
  } finally {
    g.restore(saved);
  }
}
