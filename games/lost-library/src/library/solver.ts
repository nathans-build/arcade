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
import { Game } from "./game";
import { DELTA, type AreaId, type Dir, type ItemId, type Place } from "./world";

/** A step: a move, or face a direction and use an item / press Enter, or reset the room. */
export type Action = Dir | "reset" | `enter@${Dir}` | `x:${ItemId | "lantern"}@${Dir}`;

const MOVES: Dir[] = ["up", "down", "left", "right"];

/** Runs one action, answering any Question Door or guardian right. */
export function applyAction(g: Game, a: Action): void {
  if (a === "reset") g.resetRoom();
  else if (a.startsWith("enter@")) {
    g.s.at.facing = a.slice(6) as Dir;
    g.interact();
  } else if (a.startsWith("x:")) {
    const [item, dir] = a.slice(2).split("@");
    g.s.at.facing = dir as Dir;
    g.select(item === "lantern" ? null : (item as ItemId));
    g.useItem();
  } else g.move(a as Dir);
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
  selected: ItemId | null;
}
function getLight(g: Game): Light {
  return { at: { ...g.s.at }, entry: { ...g.s.entry }, blocks: g.blocks.map(([x, y]) => [x, y]), selected: g.s.selected };
}
function setLight(g: Game, l: Light, x = l.at.x, y = l.at.y) {
  g.s.at = { ...l.at, x, y };
  g.s.entry = { ...l.entry };
  g.blocks = l.blocks.map(([bx, by]) => [bx, by]);
  g.s.selected = l.selected;
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

const configKey = (l: Light) => `${l.at.room}|${l.blocks.map(([x, y]) => `${x},${y}`).join(";")}|${l.entry.room},${l.entry.x},${l.entry.y}`;

/** Item and Enter actions that can possibly do something at this spot (the rest change nothing). */
function usefulActs(g: Game, x: number, y: number): Action[] {
  const out: Action[] = [];
  const room = g.room;
  const has = (c: string) => room.rows.some((r) => r.includes(c));
  for (const d of MOVES) {
    const [dx, dy] = DELTA[d];
    const t = g.tile(x + dx, y + dy);
    if (t === "G" || t === "C") out.push(`enter@${d}`);
    if (t === "T") out.push(`x:lantern@${d}`);
    if (g.s.items.includes("boomerang") && has("R")) out.push(`x:boomerang@${d}`);
    if (g.s.items.includes("quill") && has("o")) out.push(`x:quill@${d}`);
  }
  if (g.s.items.includes("magnifier") && (has("i") || room.secret) && !g.s.revealed.includes(room.id)) out.push("x:magnifier@up");
  if (g.s.items.includes("bell")) out.push("x:bell@up");
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
  area?: AreaId;
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
      applyAction(g, a);
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
      const ck = configKey(light);
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
          const nk = configKey(r);
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
    for (const a of found) applyAction(g, a);
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
  const blocks = configKey(light);
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
        if (configKey(getLight(g)) !== blocks || g.progSig() !== sig) continue;
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
