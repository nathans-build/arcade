/*
 * Quest of the Lost Library: the game rules, with no DOM. The React UI drives it (tick, move,
 * dust, useItem, interact) and reads its events; scripts/check-rules.ts drives the very same code
 * headlessly to prove every wing of every quest can be solved.
 *
 * One engine runs every quest (quest.ts): pass `quest` in GameOpts (default: the Lost Library).
 *
 * Saved progress (localStorage, one key per quest: `arcade.lost-library.save.v1` for the Lost
 * Library, `arcade.lost-library.save.<quest>.v1` for the others) never goes backwards: running out
 * of hearts only sends the hero back to the area's entrance with every key, item, door and treasure
 * kept. Tide levers are saved too, but they are not "progress" (you can flip them back).
 */
import { LIBRARY } from "./world";
import {
  COLS, DELTA, ROWS, gapTiles, worldOf,
  type AreaDef, type Dir, type DoorDef, type ItemPower, type Place, type QuestDef, type RoomDef, type World,
} from "./quest";

export const SAVE_KEY = LIBRARY.saveKey;

export interface SaveData {
  v: 1;
  at: Place;
  /** Where the hero came into the current room ("Reset room" goes back here). */
  entry: Place;
  hearts: number;
  visited: string[];
  keys: Record<string, number>;
  opened: string[];
  taken: string[];
  items: string[];
  /** null = the lantern. */
  selected: string | null;
  maps: string[];
  solved: string[];
  lit: string[];
  revealed: string[];
  blockPos: Record<string, [number, number][]>;
  books: string[];
  restored: string[];
  guardian: Partial<Record<string, number>>;
  finished: boolean;
  faints: number;
  /** Rooms whose tide lever has been flipped from where it starts. */
  tide: string[];
}

export function newSave(q: QuestDef = LIBRARY): SaveData {
  const start = q.areas[q.hub].start;
  const keys: Record<string, number> = {};
  for (const w of q.wings) keys[w] = 0;
  return {
    v: 1, at: { ...start }, entry: { ...start }, hearts: -1, visited: [start.room],
    keys,
    opened: [], taken: [], items: [], selected: null, maps: [], solved: [], lit: [], revealed: [], blockPos: {},
    books: [], restored: [], guardian: {}, finished: false, faints: 0, tide: [],
  };
}

const isStrArr = (v: unknown): v is string[] => Array.isArray(v) && v.every((x) => typeof x === "string");

function validPlace(p: unknown, w: World): p is Place {
  if (!p || typeof p !== "object") return false;
  const q = p as Place;
  if (typeof q.room !== "string" || !w.has(q.room)) return false;
  return Number.isInteger(q.x) && Number.isInteger(q.y) && q.x >= 0 && q.y >= 0 && q.x < COLS && q.y < ROWS && ["up", "down", "left", "right"].includes(q.facing);
}

/** Reads a saved game; anything damaged or from another version gives null (start fresh). */
export function parseSave(raw: string | null | undefined, quest: QuestDef = LIBRARY): SaveData | null {
  if (!raw) return null;
  const w = worldOf(quest);
  let o: Partial<SaveData>;
  try {
    o = JSON.parse(raw) as Partial<SaveData>;
  } catch {
    return null;
  }
  if (!o || o.v !== 1 || !validPlace(o.at, w)) return null;
  const base = newSave(quest);
  const keys = { ...base.keys };
  for (const wing of quest.wings) {
    const n = (o.keys as Record<string, unknown> | undefined)?.[wing];
    if (typeof n === "number" && n >= 0 && n < 10) keys[wing] = Math.floor(n);
  }
  const s: SaveData = {
    ...base,
    at: { ...o.at!, area: w.areaOf(o.at!.room).id },
    entry: validPlace(o.entry, w) ? { ...o.entry, area: w.areaOf(o.entry.room).id } : { ...o.at!, area: w.areaOf(o.at!.room).id },
    hearts: typeof o.hearts === "number" ? o.hearts : -1,
    keys,
    faints: typeof o.faints === "number" ? o.faints : 0,
    finished: o.finished === true,
  };
  for (const k of ["visited", "opened", "taken", "items", "maps", "solved", "lit", "revealed", "books", "restored", "tide"] as const) {
    if (isStrArr(o[k])) (s[k] as string[]) = [...new Set(o[k] as string[])];
  }
  if (o.selected === null || (typeof o.selected === "string" && s.items.includes(o.selected))) s.selected = o.selected ?? null;
  if (o.blockPos && typeof o.blockPos === "object") s.blockPos = o.blockPos;
  if (o.guardian && typeof o.guardian === "object") s.guardian = o.guardian;
  return s;
}

export function loadSave(quest: QuestDef = LIBRARY): SaveData | null {
  try {
    return parseSave(localStorage.getItem(quest.saveKey), quest);
  } catch {
    return null;
  }
}

export function writeSave(s: SaveData, quest: QuestDef = LIBRARY): void {
  try {
    localStorage.setItem(quest.saveKey, JSON.stringify(s));
  } catch {
    // Private mode or full storage: progress just isn't kept.
  }
}

export function clearSave(quest: QuestDef = LIBRARY): void {
  try {
    localStorage.removeItem(quest.saveKey);
  } catch {
    // ignore
  }
}

/* ---------------------------------------------------------------------------------- tiles */

/**
 * Tiles you can stand on (effective tiles, see Game.tile). "^" only for K-2, "h" with a heat item,
 * "w" (deep water) and "j" (current) inside a bubble shield.
 */
const WALK = new Set([".", ",", "=", "f", "S", "E", "K", "M", "P", "I", "s", "u", "z", ":", ";", "<", ">", "A", "V"]);
/** Tiles a thrown boomerang or a quill line passes over. */
const PASS = new Set([".", ",", "=", "f", "S", "E", "K", "M", "P", "I", "_", "^", "~", "s", "u", "w", "j", "z", ":", ";", "<", ">", "A", "V", "h", "%"]);
/** Tiles a crate can slide onto. */
const BLOCK_OK = new Set([".", ",", "=", "f", "S", "E"]);
/** Tiles pests never step on. */
const PEST_AVOID = new Set(["P", "z", ":", ";", "<", ">", "A", "V", "u", "s"]);
export const CONVEYOR: Record<string, Dir> = { "<": "left", ">": "right", A: "up", V: "down" };

/** Fixed solver walking time per step (ms): about 1.5 x the real step, so timed puzzles have margin. */
export const SOLVER_STEP_MS = 200;

export type Sfx =
  | "push" | "bump" | "key" | "item" | "door" | "solve" | "dust" | "poof" | "hurt" | "torch" | "throw" | "hit"
  | "quill" | "magnify" | "bell" | "chest" | "warp" | "heart" | "book" | "right" | "wrong" | "faint"
  | "lever" | "bubble" | "pop" | "wind" | "tick" | "steam" | "conveyor" | "ghost";

export type Fx =
  | { kind: "poof"; x: number; y: number; t: number }
  | { kind: "swing"; x: number; y: number; dir: Dir; t: number }
  | { kind: "boomerang"; path: [number, number][]; t: number }
  | { kind: "quill"; from: [number, number]; to: [number, number]; t: number }
  | { kind: "ring"; x: number; y: number; color: string; t: number }
  | { kind: "sparkle"; x: number; y: number; t: number }
  | { kind: "puff"; x: number; y: number; t: number };

export type GameEvent =
  | { type: "msg"; text: string; title?: string }
  | { type: "question"; doorId: string }
  | { type: "guardian"; guardian: string }
  | { type: "book"; book: string }
  | { type: "item"; item: string }
  | { type: "sfx"; name: Sfx }
  | { type: "room" }
  | { type: "hurt" }
  | { type: "faint" }
  | { type: "restored"; wing: string }
  | { type: "finished" };

export interface Enemy {
  id: number;
  kind: string;
  x: number;
  y: number;
  /** Previous tile, for the walk animation. */
  fx: number;
  fy: number;
  /** 0..1 progress of the current step. */
  mt: number;
  t: number;
}

export interface GameOpts {
  /** K-2: more hearts, fewer and slower pests, hazard puddles are harmless, more generous timers. */
  early: boolean;
  /** Spawn pests (off for the headless solver). */
  enemies: boolean;
  invincible?: boolean;
  rng?: () => number;
  /** Which quest (default: the Lost Library). */
  quest?: QuestDef;
}

export const STEP_TIME = 0.13;
const FX_TIME: Record<Fx["kind"], number> = { poof: 0.5, swing: 0.18, boomerang: 0.45, quill: 0.3, ring: 0.7, sparkle: 0.8, puff: 0.5 };

/** Bubble shield length in steps. */
export const SHIELD_STEPS = { early: 14, normal: 10 };

export class Game {
  s: SaveData;
  readonly q: QuestDef;
  readonly world: World;
  blocks: [number, number][] = [];
  enemies: Enemy[] = [];
  drops: [number, number][] = [];
  invuln = 0;
  /** Player walk animation: previous tile and progress 0..1 (a conveyor ride has a path). */
  anim: { fx: number; fy: number; t: number; path?: [number, number][] } = { fx: 0, fy: 0, t: 1 };
  pushAnim: { i: number; fx: number; fy: number; t: number } | null = null;
  fx: Fx[] = [];
  events: GameEvent[] = [];
  /** Set whenever saved progress changed (the UI writes the save). */
  dirty = false;
  /** Milliseconds since entering the room (steam vents puff on it). */
  clockMs = 0;
  /** Milliseconds left on the room's clock switch (timed gates are open while > 0). */
  timerMs = 0;
  /** Bubble shield steps left. */
  shield = 0;
  /** Tiles moved by the last move() (1, or more on a conveyor). */
  lastSteps = 0;
  private nextEnemy = 1;
  private lastBump = "";
  private rng: () => number;
  /** Increases every time something visible changes (the UI uses it for the HUD). */
  version = 0;

  constructor(save: SaveData | null, public opts: GameOpts) {
    this.rng = opts.rng ?? Math.random;
    this.q = opts.quest ?? LIBRARY;
    this.world = worldOf(this.q);
    this.s = save ? parseSave(JSON.stringify(save), this.q)! : newSave(this.q);
    if (this.s.hearts <= 0 || this.s.hearts > this.maxHearts) this.s.hearts = this.maxHearts;
    this.loadRoomState();
    this.anim = { fx: this.s.at.x, fy: this.s.at.y, t: 1 };
  }

  get maxHearts(): number {
    return this.opts.early ? 5 : 4;
  }
  get area(): AreaDef {
    return this.q.areas[this.s.at.area];
  }
  get room(): RoomDef {
    return this.world.room(this.s.at.room);
  }
  get wing(): string | null {
    const a = this.s.at.area;
    return this.q.wings.includes(a) ? a : null;
  }
  get pos(): [number, number] {
    return [this.s.at.x, this.s.at.y];
  }
  allRestored(): boolean {
    return this.q.wings.every((w) => this.s.restored.includes(w));
  }
  /** The item with this power the hero carries (null if none). */
  itemWith(power: ItemPower): string | null {
    return this.s.items.find((i) => this.q.items[i]?.power === power) ?? null;
  }

  private emit(e: GameEvent) {
    this.events.push(e);
    this.version++;
  }
  private sfx(name: Sfx) {
    this.emit({ type: "sfx", name });
  }
  private msg(text: string, title?: string) {
    this.emit({ type: "msg", text, title });
  }
  /** A message from walking into something: only once until the hero moves again. */
  private bumpMsg(key: string, text: string) {
    if (this.lastBump === key) return;
    this.lastBump = key;
    this.sfx("bump");
    this.msg(text);
  }
  private save() {
    this.dirty = true;
    this.version++;
  }
  private add<K extends "visited" | "opened" | "taken" | "solved" | "lit" | "revealed">(k: K, v: string) {
    if (!this.s[k].includes(v)) {
      this.s[k].push(v);
      this.save();
    }
  }
  has(k: "visited" | "opened" | "taken" | "solved" | "lit" | "revealed", v: string): boolean {
    return this.s[k].includes(v);
  }

  /* ------------------------------------------------------------------------------ the map */

  /** The door whose gap includes tile (x, y) of the current room. */
  doorAtGap(x: number, y: number): DoorDef | null {
    for (const rd of this.world.doorsOf(this.s.at.room)) if (gapTiles(rd.side).some(([gx, gy]) => gx === x && gy === y)) return rd.door;
    return null;
  }

  doorOpen(d: DoorDef): boolean {
    return d.kind === "open" || this.s.opened.includes(d.id);
  }

  /** Is the tide high in this room right now? */
  tideHigh(roomId = this.s.at.room): boolean {
    return (this.world.room(roomId).tide === "high") !== this.s.tide.includes(roomId);
  }

  /** The steam vent rhythm for this room and grade (ms). */
  ventRhythm(room: RoomDef = this.room): { on: number; off: number } {
    const v = room.vent ?? { on: 1200, off: 1600 };
    return { on: v.on, off: this.opts.early ? Math.round(v.off * 1.5) : v.off };
  }
  /** Are the room's steam vents puffing right now? (They rest first, then puff.) */
  ventOn(): boolean {
    const { on, off } = this.ventRhythm();
    return Math.round(this.clockMs) % (on + off) >= off;
  }
  /** Seconds the clock switch keeps the gates open, for this grade. */
  timerSeconds(room: RoomDef = this.room): number {
    return (room.timer ?? 6) * (this.opts.early ? 1.5 : 1);
  }
  /** All the room's wind-up posts are wound. */
  wound(roomId = this.s.at.room): boolean {
    const room = this.world.room(roomId);
    return Game.tilesOf(room, "&").every(([x, y]) => this.s.lit.includes(`${roomId}:${x},${y}`));
  }

  /**
   * The tile as it is right now: doors (. open, D shutter, L locked, Q question, H hidden crack),
   * pickups (taken → floor; k/m/c hidden until the puzzle is solved), U open chest, Y lit torch,
   * r crystal that's been hit, I revealed bridge, X sealed gate, s low-tide sand, a wound post,
   * + lit magma crystal, : open timed gate, ; resting steam vent.
   */
  tile(x: number, y: number, roomId = this.s.at.room): string {
    if (x < 0 || y < 0 || x >= COLS || y >= ROWS) return "#";
    const room = this.world.room(roomId);
    if (x === 0 || y === 0 || x === COLS - 1 || y === ROWS - 1) {
      for (const rd of this.world.doorsOf(roomId)) {
        if (!gapTiles(rd.side).some(([gx, gy]) => gx === x && gy === y)) continue;
        if (this.doorOpen(rd.door)) return ".";
        return { open: ".", shutter: "D", locked: "L", question: "Q", hidden: "H" }[rd.door.kind];
      }
      if (room.exit && gapTiles(room.exit.side).some(([gx, gy]) => gx === x && gy === y)) return ".";
      return "#";
    }
    const c = room.rows[y][x];
    const id = `${roomId}:${x},${y}`;
    const solved = this.s.solved.includes(roomId);
    const here = roomId === this.s.at.room;
    switch (c) {
      case "K": case "M":
        return this.s.taken.includes(id) ? "." : c;
      case "k": case "m":
        return !solved || this.s.taken.includes(id) ? "." : c.toUpperCase();
      case "C":
        return this.s.taken.includes(id) ? "U" : "C";
      case "c":
        return !solved ? "." : this.s.taken.includes(id) ? "U" : "C";
      case "T":
        return this.s.lit.includes(id) ? "Y" : "T";
      case "R":
        return this.s.lit.includes(id) ? "r" : "R";
      case "i":
        return this.s.revealed.includes(roomId) ? "I" : "_";
      case "P":
        return room.sealed && !this.allRestored() ? "X" : "P";
      case "B":
        return ".";
      case "w":
        return this.tideHigh(roomId) ? "w" : "s";
      case "u":
        return this.tideHigh(roomId) ? "u" : "_";
      case "|":
        return here && (this.timerMs > 0 || (this.s.at.x === x && this.s.at.y === y)) ? ":" : "|";
      case "&":
        return this.s.lit.includes(id) ? "a" : "&";
      case "$":
        return this.wound(roomId) ? "I" : "_";
      case "b":
        return solved ? "I" : "_";
      case "*":
        return this.s.lit.includes(id) ? "+" : "*";
      case "%":
        return here && this.ventOn() ? "%" : ";";
      case "q":
        return this.s.revealed.includes(roomId) ? "q" : ".";
      default:
        return c;
    }
  }

  walkable(t: string): boolean {
    if (WALK.has(t)) return true;
    if (t === "^") return this.opts.early;
    if (t === "h") return !!this.itemWith("heat");
    if (t === "w" || t === "j") return this.shield > 0;
    return false;
  }

  blockAt(x: number, y: number): number {
    return this.blocks.findIndex(([bx, by]) => bx === x && by === y);
  }
  enemyAt(x: number, y: number): Enemy | undefined {
    return this.enemies.find((e) => e.x === x && e.y === y);
  }

  /** Tiles of one kind in the room's map, row by row. */
  static tilesOf(room: RoomDef, chars: string): [number, number][] {
    const out: [number, number][] = [];
    room.rows.forEach((row, y) => [...row].forEach((c, x) => chars.includes(c) && out.push([x, y])));
    return out;
  }

  /** Does the room use anything that changes with time (vents, a clock switch)? */
  static timed(room: RoomDef): boolean {
    return room.rows.some((r) => r.includes("%") || r.includes("z"));
  }

  /* ------------------------------------------------------------------------- rooms & moving */

  private loadRoomState() {
    const room = this.room;
    const solvedPos = this.s.blockPos[room.id];
    this.blocks = this.s.solved.includes(room.id) && solvedPos ? solvedPos.map(([x, y]) => [x, y]) : Game.tilesOf(room, "B");
    this.drops = [];
    this.enemies = [];
    this.pushAnim = null;
    this.fx = [];
    this.clockMs = 0;
    this.timerMs = 0;
    this.shield = 0;
    if (this.opts.enemies) {
      const spawns = Game.tilesOf(room, "E").filter((_, i) => !this.opts.early || i % 2 === 0);
      const kind = this.s.at.area === this.q.hub ? this.q.pests.hub : this.q.pests.wing;
      for (const [x, y] of spawns) this.enemies.push({ id: this.nextEnemy++, kind, x, y, fx: x, fy: y, mt: 1, t: 0.6 + this.rng() * 0.8 });
    }
  }

  enterRoom(roomId: string, x: number, y: number, facing: Dir) {
    const area = this.world.areaOf(roomId).id;
    this.s.at = { area, room: roomId, x, y, facing };
    this.s.entry = { ...this.s.at };
    if (!this.s.visited.includes(roomId)) this.s.visited.push(roomId);
    this.loadRoomState();
    this.anim = { fx: x, fy: y, t: 1 };
    this.lastBump = "";
    this.save();
    this.emit({ type: "room" });
  }

  goTo(p: Place) {
    this.enterRoom(p.room, p.x, p.y, p.facing);
  }

  /** Puts the room back as it was when the hero walked in (blocks too, unless already solved). */
  resetRoom() {
    const e = this.s.entry;
    this.enterRoom(e.room, e.x, e.y, e.facing);
  }

  private leaveRoom(dir: Dir): boolean {
    const room = this.room;
    if (room.exit && room.exit.side === dir) {
      this.sfx("warp");
      this.goTo(room.exit.to);
      return true;
    }
    const rd = this.world.doorsOf(room.id).find((d) => d.side === dir);
    if (!rd || !this.doorOpen(rd.door)) return false;
    let { x, y } = this.s.at;
    if (dir === "up") y = ROWS - 1;
    else if (dir === "down") y = 0;
    else if (dir === "left") x = COLS - 1;
    else x = 0;
    this.enterRoom(rd.other, x, y, dir);
    return true;
  }

  private stepTo(x: number, y: number) {
    this.anim = { fx: this.s.at.x, fy: this.s.at.y, t: 0 };
    this.s.at.x = x;
    this.s.at.y = y;
    this.lastBump = "";
    if (this.shield > 0) this.shield--;
  }

  /** One step (or a push, or walking into a door). Returns true when the hero moved. */
  move(dir: Dir): boolean {
    this.lastSteps = 0;
    this.s.at.facing = dir;
    const { x, y } = this.s.at;
    const [dx, dy] = DELTA[dir];
    const nx = x + dx;
    const ny = y + dy;
    if (nx < 0 || ny < 0 || nx >= COLS || ny >= ROWS) {
      const left = this.leaveRoom(dir);
      if (left) this.lastSteps = 1;
      return left;
    }
    const bi = this.blockAt(nx, ny);
    if (bi >= 0) {
      if (this.s.solved.includes(this.s.at.room)) return false; // crates settle once the puzzle is solved
      const bx = nx + dx;
      const by = ny + dy;
      const inside = bx > 0 && by > 0 && bx < COLS - 1 && by < ROWS - 1;
      if (!inside || !BLOCK_OK.has(this.tile(bx, by)) || this.blockAt(bx, by) >= 0 || this.enemyAt(bx, by)) {
        this.sfx("bump");
        return false;
      }
      this.blocks[bi] = [bx, by];
      this.pushAnim = { i: bi, fx: nx, fy: ny, t: 0 };
      this.stepTo(nx, ny);
      this.lastSteps = 1;
      this.sfx("push");
      this.checkPuzzle();
      return true;
    }
    const t = this.tile(nx, ny);
    if (t === "^" && !this.opts.early) {
      this.hurt();
      return false;
    }
    if (this.walkable(t)) {
      this.stepTo(nx, ny);
      this.lastSteps = 1;
      this.arrive();
      this.ride();
      this.afterStep();
      return true;
    }
    this.touch(nx, ny, t, true);
    return false;
  }

  /** Conveyors, currents and updrafts carry the hero along until they end (or something is in the way). */
  private ride() {
    const path: [number, number][] = [];
    const start: [number, number] = [this.anim.fx, this.anim.fy];
    for (let i = 0; i < 40; i++) {
      const room = this.s.at.room;
      const d = CONVEYOR[this.tile(this.s.at.x, this.s.at.y)];
      if (!d) break;
      const [dx, dy] = DELTA[d];
      const nx = this.s.at.x + dx;
      const ny = this.s.at.y + dy;
      if (nx <= 0 || ny <= 0 || nx >= COLS - 1 || ny >= ROWS - 1) break;
      const t = this.tile(nx, ny);
      if (!this.walkable(t) || t === "P" || this.blockAt(nx, ny) >= 0) break;
      if (!path.length) {
        path.push(start, [this.s.at.x, this.s.at.y]);
        this.sfx("conveyor");
      }
      this.s.at.x = nx;
      this.s.at.y = ny;
      path.push([nx, ny]);
      this.lastSteps++;
      this.arrive();
      if (this.s.at.room !== room) return;
    }
    if (path.length) this.anim = { fx: start[0], fy: start[1], t: 0, path };
  }

  /** After a step: a bubble that runs out over deep water floats the hero back to the doorway. */
  private afterStep() {
    if (this.shield > 0) return;
    const t = this.tile(this.s.at.x, this.s.at.y);
    if (t === "w" || t === "j") this.floatBack("Pop! Your bubble shield ran out, and a friendly current floated you back to the doorway.");
  }

  private floatBack(text: string) {
    const e = this.s.entry;
    this.s.at.x = e.x;
    this.s.at.y = e.y;
    this.s.at.facing = e.facing;
    this.anim = { fx: e.x, fy: e.y, t: 1 };
    this.shield = 0;
    this.sfx("pop");
    this.msg(text);
  }

  /** Walking into (bump) or facing + Enter (not bump) something solid. */
  private touch(x: number, y: number, t: string, bump: boolean): boolean {
    const key = `${this.s.at.room}:${x},${y}`;
    const say = (text: string) => (bump ? this.bumpMsg(key, text) : this.msg(text));
    const door = this.doorAtGap(x, y);
    const W = this.q.terms.wing;
    switch (t) {
      case "Q":
        if (door) this.emit({ type: "question", doorId: door.id });
        return true;
      case "L": {
        if (!door) return false;
        const w = this.wing;
        if (w && this.s.keys[w] > 0) {
          this.s.keys[w]--;
          this.add("opened", door.id);
          this.sfx("door");
          this.msg("You used a small key. The door unlocked!");
        } else say(`Locked! A small key from this ${W} opens it.`);
        return true;
      }
      case "D":
        say("This door is shut tight. Solve the puzzle in this room to open it.");
        return true;
      case "X":
        say(this.q.texts.sealed(this.s.restored.length, this.q.wings.length));
        return true;
      case "H":
        if (!bump) say(this.q.texts.crack);
        return true;
      case "w":
        if (bump) say("Deep water! Pull the tide lever to drain it, or blow a bubble shield to swim across.");
        else this.msg("Deep, cool water.");
        return true;
      case "j":
        say("A strong current full of drifting jellyfish. A bubble shield would carry you through safely.");
        return true;
      case "h":
        say("Hot rock! It glows orange. Something heat-proof would keep you cool enough to cross.");
        return true;
      case "|":
        say("A timed gate. Step on the clock switch to open it, then hurry through!");
        return true;
      case "%":
        say("Hiss! The steam vent is puffing. Wait for it to rest, then cross.");
        return true;
      case "_": {
        const base = this.room.rows[y]?.[x];
        if (bump && base === "$") {
          say("A folded-up clockwork bridge. Wind up the posts in this room to stretch it out.");
          return true;
        }
        if (bump && base === "b") {
          say("A river of lava. Solve this room's puzzle and it cools into a rock bridge.");
          return true;
        }
        return bump ? false : this.interactWith(x, y, t);
      }
      default:
        if (!bump) return this.interactWith(x, y, t);
        return false;
    }
  }

  private arrive() {
    const { x, y } = this.s.at;
    const t = this.tile(x, y);
    const id = `${this.s.at.room}:${x},${y}`;
    const w = this.wing;
    const W = this.q.terms.wing;
    if (t === "K") {
      this.add("taken", id);
      if (w) this.s.keys[w]++;
      this.sfx("key");
      this.msg(`You found a small key! It opens one locked door in this ${W}.`);
    } else if (t === "M") {
      this.add("taken", id);
      if (w && !this.s.maps.includes(w)) this.s.maps.push(w);
      this.sfx("item");
      this.msg(`You found the ${W} map! Press Esc (or MAP) to see every room of this ${W}.`);
    } else if (t === "P") {
      const warp = this.room.warp;
      if (warp) {
        this.sfx("warp");
        this.goTo(warp);
        return;
      }
    } else if (t === "z") {
      const fresh = this.timerMs <= 0;
      this.timerMs = this.timerSeconds() * 1000;
      this.sfx("tick");
      if (fresh) for (const [gx, gy] of Game.tilesOf(this.room, "|")) this.fx.push({ kind: "sparkle", x: gx, y: gy, t: 0 });
    }
    const di = this.drops.findIndex(([dx, dy]) => dx === x && dy === y);
    if (di >= 0) {
      this.drops.splice(di, 1);
      this.s.hearts = Math.min(this.maxHearts, this.s.hearts + 1);
      this.sfx("heart");
      this.save();
    }
    this.save();
  }

  facingTile(): [number, number] {
    const [dx, dy] = DELTA[this.s.at.facing];
    return [this.s.at.x + dx, this.s.at.y + dy];
  }

  /** Enter: read, talk, open a chest, pull a lever, or knock on a door. */
  interact(): boolean {
    const [fx, fy] = this.facingTile();
    return this.touch(fx, fy, this.tile(fx, fy), false);
  }

  private interactWith(x: number, y: number, t: string): boolean {
    const room = this.room;
    const id = `${room.id}:${x},${y}`;
    switch (t) {
      case "N": {
        const signs = Game.tilesOf(room, "N");
        const i = signs.findIndex(([sx, sy]) => sx === x && sy === y);
        const texts = room.signs ?? [];
        let text = texts[i] ?? "The page is too smudged to read.";
        if (room.secret && i === texts.length - 1 && this.s.revealed.includes(room.id)) text = room.secret;
        this.msg(text);
        return true;
      }
      case "F":
        this.s.hearts = this.maxHearts;
        this.save();
        this.sfx("heart");
        this.msg(this.folioHint(), this.q.helper.name);
        return true;
      case "q":
        this.sfx("ghost");
        this.msg(room.ghost ?? "Boo-hoo-hello! I'm just a friendly ghost. Have a lovely day!", "A FRIENDLY GHOST");
        return true;
      case "G": {
        const g = this.area.guardian;
        if (!g) return false;
        const final = this.s.at.area === this.q.final;
        const done = final ? this.s.finished : this.s.restored.includes(this.q.guardians[g].area);
        if (done) this.msg(final ? this.q.texts.finalThanks : `${this.q.guardians[g].name}: ${this.q.texts.thanks}`);
        else this.emit({ type: "guardian", guardian: g });
        return true;
      }
      case "C":
        this.add("taken", id);
        this.sfx("chest");
        this.give(room.chest ?? "key");
        return true;
      case "U":
        this.msg("The chest is empty.");
        return true;
      case "T":
        this.msg("A cold torch. Press X to light it with your lantern.");
        return true;
      case "R":
        this.msg("A crystal switch. Hit it with something to make it glow.");
        return true;
      case "r":
        this.msg("The crystal switch glows brightly.");
        return true;
      case "o":
        this.msg(`A brass hook post. A ${this.q.items[this.itemWith("grapple") ?? ""]?.name ?? Object.values(this.q.items).find((i) => i.power === "grapple")?.name ?? "grappling hook"} can hook onto it.`);
        return true;
      case "O":
        this.msg(this.q.texts.decor);
        return true;
      case "Y":
        this.msg("A warm, bright torch.");
        return true;
      case "l":
        this.flipTide();
        return true;
      case "&":
        this.msg("A wind-up post with a big key hole. A wind-up key would fit it.");
        return true;
      case "a":
        this.msg("The post is wound up tight. Tick, tick, tick!");
        return true;
      case "*":
        this.msg("A dark magma crystal. A heat-proof lantern could light it up.");
        return true;
      case "+":
        this.msg("The magma crystal glows warm and bright.");
        return true;
      default:
        return false;
    }
  }

  /** The tide lever: the water in this room rises or drains. */
  private flipTide() {
    const id = this.s.at.room;
    if (this.s.tide.includes(id)) this.s.tide = this.s.tide.filter((r) => r !== id);
    else this.s.tide.push(id);
    this.save();
    this.sfx("lever");
    for (const [x, y] of Game.tilesOf(this.room, "wu")) if ((x + y) % 3 === 0) this.fx.push({ kind: "sparkle", x, y, t: 0 });
    this.msg(this.tideHigh() ? "CLUNK! The tide rises. The water is deep, and the floating docks bob up to the top." : "CLUNK! The tide drains away. You can walk on the wet sand now, but the floating docks sink into their pits.");
    const under = this.tile(this.s.at.x, this.s.at.y);
    if ((under === "w" && this.shield <= 0) || under === "_") this.floatBack("Splash! The water moved under your feet, and a gentle wave carried you back to the doorway.");
  }

  folioHint(): string {
    const s = this.s;
    const h = this.q.helper;
    if (s.finished) return h.done;
    if (this.allRestored()) return h.all;
    const left = this.q.wings.filter((w) => !s.restored.includes(w));
    if (s.restored.length === 0) return h.first;
    return h.progress(left.map((w) => h.wingNames[w]).join(", "));
  }

  private give(what: NonNullable<RoomDef["chest"]>) {
    const w = this.wing;
    if (what === "item") {
      const item = this.area.item;
      if (item && !this.s.items.includes(item)) {
        this.s.items.push(item);
        this.s.selected = item;
        this.sfx("item");
        this.emit({ type: "item", item });
      }
    } else if (what === "book" && w) {
      this.addBook(this.q.bonusBook[w]);
    } else if (what === "key" && w) {
      this.s.keys[w]++;
      this.sfx("key");
      this.msg("A small key!");
    } else if (what === "map" && w) {
      if (!this.s.maps.includes(w)) this.s.maps.push(w);
    }
    this.save();
  }

  private addBook(b: string) {
    if (!this.s.books.includes(b)) this.s.books.push(b);
    this.sfx("book");
    this.emit({ type: "book", book: b });
    this.save();
  }

  /* -------------------------------------------------------------------------------- puzzles */

  puzzleDone(room: RoomDef = this.room): boolean {
    const p = room.puzzle;
    if (!p) return true;
    const lit = (x: number, y: number) => this.s.lit.includes(`${room.id}:${x},${y}`);
    switch (p.kind) {
      case "blocks":
        return Game.tilesOf(room, "S").every(([x, y]) => this.blockAt(x, y) >= 0);
      case "torches":
        return Game.tilesOf(room, "T").every(([x, y]) => lit(x, y));
      case "crystal":
        return Game.tilesOf(room, "R").every(([x, y]) => lit(x, y));
      case "secret":
        return this.s.revealed.includes(room.id);
      case "magma":
        return Game.tilesOf(room, "*").every(([x, y]) => lit(x, y));
      case "winders":
        return Game.tilesOf(room, "&").every(([x, y]) => lit(x, y));
    }
  }

  private checkPuzzle() {
    const room = this.room;
    if (!room.puzzle || this.s.solved.includes(room.id) || !this.puzzleDone(room)) return;
    this.add("solved", room.id);
    if (room.puzzle.kind === "blocks") this.s.blockPos[room.id] = this.blocks.map(([x, y]) => [x, y]);
    for (const d of room.puzzle.opens ?? []) this.add("opened", d);
    this.sfx("solve");
    const W = this.q.terms.wing;
    const what: string[] = [];
    if (Game.tilesOf(room, "k").length) what.push("A small key appeared!");
    if (Game.tilesOf(room, "m").length) what.push(`The ${W} map appeared!`);
    if (Game.tilesOf(room, "c").length) what.push("A treasure chest appeared!");
    if (Game.tilesOf(room, "b").length) what.push("The lava cooled into a rock bridge!");
    if (room.puzzle.opens?.length) what.push("A door slid open!");
    for (const [x, y] of Game.tilesOf(room, "kmcb")) this.fx.push({ kind: "sparkle", x, y, t: 0 });
    this.msg(`Puzzle solved! ${what.join(" ")}`.trim());
  }

  /* ---------------------------------------------------------------------------- items & dust */

  /** Z: swing the feather duster at the tile in front (and the hero's own tile). */
  dust() {
    const [fx, fy] = this.facingTile();
    this.fx.push({ kind: "swing", x: fx, y: fy, dir: this.s.at.facing, t: 0 });
    this.sfx("dust");
    for (const [x, y] of [[fx, fy], this.pos] as [number, number][]) {
      const e = this.enemyAt(x, y);
      if (e) this.tidy(e);
    }
  }

  private tidy(e: Enemy) {
    this.enemies = this.enemies.filter((o) => o !== e);
    this.fx.push({ kind: "poof", x: e.x, y: e.y, t: 0 });
    this.sfx("poof");
    if (this.s.hearts < this.maxHearts && this.rng() < 0.4) this.drops.push([e.x, e.y]);
    this.version++;
  }

  /** The order X / the ITEM button cycles through: the lantern, then items found. */
  itemChoices(): (string | null)[] {
    return [null, ...this.s.items];
  }

  selectNext() {
    const list = this.itemChoices();
    const i = list.indexOf(this.s.selected);
    this.s.selected = list[(i + 1) % list.length];
    this.sfx("hit");
    this.save();
  }

  select(item: string | null) {
    if (item === null || this.s.items.includes(item)) {
      this.s.selected = item;
      this.save();
    }
  }

  /** The straight line in front of the hero that a thrown item flies along, up to `range` tiles. */
  private line(range: number): { path: [number, number][]; stop: [number, number] | null } {
    const [dx, dy] = DELTA[this.s.at.facing];
    const path: [number, number][] = [];
    let { x, y } = this.s.at;
    for (let i = 0; i < range; i++) {
      x += dx;
      y += dy;
      if (x <= 0 || y <= 0 || x >= COLS - 1 || y >= ROWS - 1 || this.blockAt(x, y) >= 0 || !PASS.has(this.tile(x, y))) return { path, stop: [x, y] };
      path.push([x, y]);
    }
    return { path, stop: null };
  }

  /** Ring-style reveal: hidden bridges, secret writing, and (ghost light) friendly ghosts. */
  private reveal(ghost: boolean): boolean {
    const room = this.room;
    const hasInk = Game.tilesOf(room, "i").length > 0;
    const hasGhost = ghost && Game.tilesOf(room, "q").length > 0;
    if ((hasInk || room.secret || hasGhost) && !this.s.revealed.includes(room.id)) {
      this.add("revealed", room.id);
      for (const [x, y] of Game.tilesOf(room, "iq")) this.fx.push({ kind: "sparkle", x, y, t: 0 });
      return true;
    }
    return false;
  }

  /** Echo-style: open the room's hidden doors. */
  private findHidden(): number {
    const hidden = this.world.doorsOf(this.room.id).filter((d) => d.door.kind === "hidden" && !this.s.opened.includes(d.door.id));
    for (const d of hidden) {
      this.add("opened", d.door.id);
      for (const [x, y] of gapTiles(d.side)) this.fx.push({ kind: "sparkle", x, y, t: 0 });
    }
    return hidden.length;
  }

  /** X: light a cold torch in front, or use the selected item. */
  useItem() {
    const [fx, fy] = this.facingTile();
    const room = this.room;
    if (this.tile(fx, fy) === "T") {
      this.add("lit", `${room.id}:${fx},${fy}`);
      this.sfx("torch");
      this.fx.push({ kind: "ring", x: fx, y: fy, color: "#ffd23f", t: 0 });
      this.checkPuzzle();
      return;
    }
    const item = this.s.selected;
    if (!item) {
      this.fx.push({ kind: "ring", x: this.s.at.x, y: this.s.at.y, color: "#ffe9a0", t: 0 });
      this.bumpMsg("lantern", "Your lantern glows. Face a cold torch and press X to light it.");
      return;
    }
    const def = this.q.items[item];
    const power = def?.power;
    if (power === "boomerang") {
      const { path, stop } = this.line(8);
      this.sfx("throw");
      for (const [x, y] of path) {
        const e = this.enemyAt(x, y);
        if (e) this.tidy(e);
      }
      const full = stop ? [...path, stop] : path;
      this.fx.push({ kind: "boomerang", path: full.length ? full : [[fx, fy]], t: 0 });
      if (stop && this.tile(stop[0], stop[1]) === "R") {
        this.add("lit", `${room.id}:${stop[0]},${stop[1]}`);
        this.sfx("hit");
        this.checkPuzzle();
      }
      return;
    }
    if (power === "grapple") {
      const { path, stop } = this.line(9);
      if (stop && this.tile(stop[0], stop[1]) === "o" && path.length >= 2) {
        const [lx, ly] = path[path.length - 1];
        if (this.walkable(this.tile(lx, ly)) && this.blockAt(lx, ly) < 0) {
          const from = this.pos;
          this.sfx("quill");
          this.fx.push({ kind: "quill", from, to: stop, t: 0 });
          this.s.at.x = lx;
          this.s.at.y = ly;
          this.anim = { fx: from[0], fy: from[1], t: 0 };
          this.lastBump = "";
          this.arrive();
          return;
        }
      }
      this.sfx("bump");
      this.fx.push({ kind: "quill", from: this.pos, to: stop ?? path[path.length - 1] ?? [fx, fy], t: 0 });
      this.bumpMsg("quill", "The quill needs a brass hook post across a gap. Face one and press X.");
      return;
    }
    if (power === "reveal") {
      this.sfx("magnify");
      this.fx.push({ kind: "ring", x: this.s.at.x, y: this.s.at.y, color: "#b05cff", t: 0 });
      if (this.reveal(false)) {
        this.msg(room.secret ?? "The magnifier shows a bridge written in invisible ink! Now you can walk across.");
        this.checkPuzzle();
      } else this.bumpMsg("magnify", "You look closely... nothing secret here.");
      return;
    }
    if (power === "echo") {
      this.sfx("bell");
      this.fx.push({ kind: "ring", x: this.s.at.x, y: this.s.at.y, color: "#6ea0ff", t: 0 });
      const n = this.findHidden();
      if (n) {
        this.sfx("door");
        this.msg(n > 1 ? "DONG! The echo found hidden doors!" : "DONG! The echo found a hidden door!");
      } else this.bumpMsg("bell", "DONG... the echo comes back. No hidden doors in this room.");
      return;
    }
    if (power === "ghost") {
      this.sfx("ghost");
      this.fx.push({ kind: "ring", x: this.s.at.x, y: this.s.at.y, color: "#8affc1", t: 0 });
      const shown = this.reveal(true);
      const doors = this.findHidden();
      if (shown || doors) {
        const what: string[] = [];
        if (Game.tilesOf(room, "i").length && shown) what.push("A hidden floor glows into sight!");
        if (Game.tilesOf(room, "q").length && shown) what.push("A friendly ghost waves hello!");
        if (doors) what.push(doors > 1 ? "Secret doors shimmer open!" : "A secret door shimmers open!");
        if (room.secret && shown) what.push(room.secret);
        if (doors) this.sfx("door");
        this.msg(what.join(" ") || "The ghost lantern glows green.");
        this.checkPuzzle();
      } else this.bumpMsg("ghost", "The ghost lantern glows a soft green... nothing hidden in this room.");
      return;
    }
    if (power === "bubble") {
      this.shield = this.opts.early ? SHIELD_STEPS.early : SHIELD_STEPS.normal;
      this.sfx("bubble");
      this.fx.push({ kind: "ring", x: this.s.at.x, y: this.s.at.y, color: "#9ad0ff", t: 0 });
      this.bumpMsg("bubble", `Bloop! A bubble shield wraps around you. It lasts ${this.shield} steps: swim through deep water and currents before it pops!`);
      return;
    }
    if (power === "windup") {
      const t = this.tile(fx, fy);
      if (t === "&") {
        this.add("lit", `${room.id}:${fx},${fy}`);
        this.sfx("wind");
        this.fx.push({ kind: "ring", x: fx, y: fy, color: "#ffd23f", t: 0 });
        if (this.wound()) for (const [x, y] of Game.tilesOf(room, "$")) this.fx.push({ kind: "sparkle", x, y, t: 0 });
        this.checkPuzzle();
        if (Game.tilesOf(room, "$").length && this.wound()) this.msg("Crrrank, tick-tick-tick! The clockwork bridge unfolds across the gap.");
        return;
      }
      this.sfx("wind");
      this.bumpMsg("wind", "Click-clack. The wind-up key needs a wind-up post. Face one and press X.");
      return;
    }
    if (power === "heat") {
      const t = this.tile(fx, fy);
      if (t === "*") {
        this.add("lit", `${room.id}:${fx},${fy}`);
        this.sfx("torch");
        this.fx.push({ kind: "ring", x: fx, y: fy, color: "#ff8a3d", t: 0 });
        this.checkPuzzle();
        return;
      }
      this.fx.push({ kind: "ring", x: this.s.at.x, y: this.s.at.y, color: "#6ad8ff", t: 0 });
      this.bumpMsg("heat", "The heat-proof lantern glows cool blue. It keeps you safe on hot rock and lights magma crystals: face one and press X.");
    }
  }

  /* ---------------------------------------------------------------------- doors & guardians */

  openQuestionDoor(doorId: string) {
    this.add("opened", doorId);
    this.sfx("door");
  }

  guardianProgress(g: string): number {
    return this.s.guardian[g] ?? 0;
  }

  /** One guardian answer. Right ones count; wrong ones change nothing. Returns true when finished. */
  guardianAnswer(g: string, correct: boolean): boolean {
    if (!correct) return false;
    const def = this.q.guardians[g];
    const n = (this.s.guardian[g] ?? 0) + 1;
    this.s.guardian[g] = n;
    this.save();
    if (n < def.need) return false;
    if (def.area === this.q.final) {
      this.addBook(this.q.finalBook);
      this.s.finished = true;
      this.save();
      this.emit({ type: "finished" });
      return true;
    }
    const wing = def.area;
    if (!this.s.restored.includes(wing)) this.s.restored.push(wing);
    this.s.hearts = this.maxHearts;
    this.emit({ type: "restored", wing });
    this.addBook(this.q.wingBook[wing]);
    this.goTo(this.q.gateFront[wing]);
    return true;
  }

  /* ---------------------------------------------------------------------------- hearts */

  hurt() {
    if (this.opts.invincible || this.invuln > 0) return;
    this.s.hearts--;
    this.invuln = 1.4;
    this.sfx("hurt");
    this.emit({ type: "hurt" });
    this.save();
    if (this.s.hearts <= 0) this.faint();
  }

  /** Out of hearts: back to the area's entrance, full hearts, nothing lost. */
  faint() {
    this.s.faints++;
    this.s.hearts = this.maxHearts;
    this.invuln = 2;
    this.sfx("faint");
    const start = this.area.start;
    this.goTo(start);
    this.emit({ type: "faint" });
    this.msg(this.q.texts.faint);
  }

  /* ------------------------------------------------------------------------------- time */

  /**
   * Time passing in the room: timed gates count down, steam vents puff (a puff blows the hero
   * standing on a vent along). The solver calls it with a fixed step time (SOLVER_STEP_MS).
   */
  passTime(ms: number) {
    if (ms <= 0) return;
    const room = this.room;
    if (!Game.timed(room)) {
      this.clockMs += ms;
      return;
    }
    const wasOn = this.ventOn();
    this.clockMs += ms;
    if (this.timerMs > 0) {
      this.timerMs = Math.max(0, this.timerMs - ms);
      if (this.timerMs === 0) this.sfx("tick");
    }
    const on = this.ventOn();
    if (on && !wasOn) {
      for (const [x, y] of Game.tilesOf(room, "%")) this.fx.push({ kind: "puff", x, y, t: 0 });
      this.sfx("steam");
    }
    if (on && room.rows[this.s.at.y][this.s.at.x] === "%") this.blow();
  }

  /** A steam puff blows the hero up to two tiles the way they face (or back a tile if that's blocked). */
  private blow() {
    const d = this.s.at.facing;
    const free = (x: number, y: number) =>
      x > 0 && y > 0 && x < COLS - 1 && y < ROWS - 1 && this.walkable(this.tile(x, y)) && this.tile(x, y) !== "P" && this.blockAt(x, y) < 0 && this.room.rows[y][x] !== "%";
    const [dx, dy] = DELTA[d];
    const { x, y } = this.s.at;
    const over = (tx: number, ty: number) => this.walkable(this.tile(tx, ty)) || this.room.rows[ty]?.[tx] === "%";
    let to: [number, number] | null = null;
    if (over(x + dx, y + dy) && free(x + 2 * dx, y + 2 * dy)) to = [x + 2 * dx, y + 2 * dy];
    else if (free(x + dx, y + dy)) to = [x + dx, y + dy];
    else if (free(x - dx, y - dy)) to = [x - dx, y - dy];
    if (!to) return;
    this.anim = { fx: x, fy: y, t: 0 };
    this.s.at.x = to[0];
    this.s.at.y = to[1];
    this.lastBump = "";
    this.arrive();
    this.afterStep();
  }

  /** Advances animations and pests. `held` is the direction being held (or null). */
  tick(dt: number, held: Dir | null) {
    if (dt <= 0) return; // paused: nothing moves and nothing can hurt the hero
    this.invuln = Math.max(0, this.invuln - dt);
    const step = this.opts.early ? STEP_TIME * 1.15 : STEP_TIME;
    if (this.anim.t < 1) {
      const n = this.anim.path ? Math.max(1, this.anim.path.length - 1) * 0.55 : 1;
      this.anim.t = Math.min(1, this.anim.t + dt / (step * n));
    }
    if (this.pushAnim) {
      this.pushAnim.t += dt / step;
      if (this.pushAnim.t >= 1) this.pushAnim = null;
    }
    this.passTime(dt * 1000);
    if (this.anim.t >= 1 && held) this.move(held);
    for (const f of this.fx) f.t += dt;
    this.fx = this.fx.filter((f) => f.t < FX_TIME[f.kind]);
    this.tickEnemies(dt);
  }

  private tickEnemies(dt: number) {
    const period = this.opts.early ? 1.05 : 0.62;
    const chase = this.opts.early ? 0.2 : 0.45;
    const wingPest = this.q.pests.wing;
    for (const e of this.enemies) {
      e.mt = Math.min(1, e.mt + dt / (period * 0.6));
      e.t -= dt;
      if (e.t > 0) continue;
      e.t = period * (0.8 + this.rng() * 0.4);
      const [px, py] = this.pos;
      let dirs: Dir[] = (["up", "down", "left", "right"] as Dir[]).sort(() => this.rng() - 0.5);
      if (e.kind === wingPest && this.rng() < chase) {
        const toward: Dir[] = [];
        if (px > e.x) toward.push("right");
        if (px < e.x) toward.push("left");
        if (py > e.y) toward.push("down");
        if (py < e.y) toward.push("up");
        dirs = [...toward, ...dirs.filter((d) => !toward.includes(d))];
      }
      for (const d of dirs) {
        const [dx, dy] = DELTA[d];
        const nx = e.x + dx;
        const ny = e.y + dy;
        if (nx <= 0 || ny <= 0 || nx >= COLS - 1 || ny >= ROWS - 1) continue;
        const t = this.tile(nx, ny);
        if (!(WALK.has(t) || t === "^") || PEST_AVOID.has(t) || this.blockAt(nx, ny) >= 0 || this.enemyAt(nx, ny)) continue;
        e.fx = e.x;
        e.fy = e.y;
        e.x = nx;
        e.y = ny;
        e.mt = 0;
        break;
      }
    }
    if (this.anim.t >= 0.5) {
      const [px, py] = this.pos;
      for (const e of this.enemies) if (e.kind === wingPest && e.x === px && e.y === py) this.hurt();
    }
  }

  /** Drains the events since the last call. */
  takeEvents(): GameEvent[] {
    const out = this.events;
    this.events = [];
    return out;
  }

  /* ----------------------------------------------------------------- solver / test helpers */

  /** A cheap signature of saved progress: every progress list only grows, keys go up or are spent. */
  progSig(): string {
    const s = this.s;
    const g = Object.values(s.guardian).reduce((a, b) => (a ?? 0) + (b ?? 0), 0);
    return `${s.opened.length}.${s.taken.length}.${s.items.length}.${s.maps.length}.${s.solved.length}.${s.lit.length}.${s.revealed.length}.${s.books.length}.${s.restored.length}.${this.q.wings.map((w) => s.keys[w]).join("")}.${g}.${s.finished ? 1 : 0}`;
  }

  /** Everything that counts as progress (it only ever grows; keys go up and are spent on doors). */
  progressKey(): string {
    const s = this.s;
    const k = (a: string[]) => [...a].sort().join(",");
    return [
      this.q.wings.map((w) => s.keys[w]).join(""), k(s.opened), k(s.taken), k(s.items), k(s.maps), k(s.solved), k(s.lit), k(s.revealed),
      k(s.books), k(s.restored), JSON.stringify(s.guardian), s.finished,
    ].join("|");
  }

  /** Where the hero is and how the current room's crates sit (all that changes between progress). */
  lightKey(): string {
    const { room, x, y, facing } = this.s.at;
    return `${room}|${x},${y}|${facing}|${this.s.selected}|${this.blocks.map(([bx, by]) => `${bx},${by}`).join(";")}|${this.s.entry.room},${this.s.entry.x},${this.s.entry.y}|${[...this.s.tide].sort().join(",")}|${this.shield}|${this.timerMs}|${this.clockMs}`;
  }

  snapshot(): string {
    return JSON.stringify({ s: this.s, blocks: this.blocks, enemies: this.enemies, drops: this.drops, invuln: this.invuln, clockMs: this.clockMs, timerMs: this.timerMs, shield: this.shield });
  }

  restore(snap: string) {
    const o = JSON.parse(snap) as {
      s: SaveData; blocks: [number, number][]; enemies: Enemy[]; drops: [number, number][]; invuln: number; clockMs?: number; timerMs?: number; shield?: number;
    };
    this.s = o.s;
    this.blocks = o.blocks;
    this.enemies = o.enemies;
    this.drops = o.drops;
    this.invuln = o.invuln;
    this.clockMs = o.clockMs ?? 0;
    this.timerMs = o.timerMs ?? 0;
    this.shield = o.shield ?? 0;
    this.fx = [];
    this.events = [];
    this.anim = { fx: o.s.at.x, fy: o.s.at.y, t: 1 };
    this.pushAnim = null;
    this.lastBump = "";
  }
}

/** The wing an area is (null for the hub and the final room). */
export function wingOf(area: string, quest: QuestDef = LIBRARY): string | null {
  return quest.wings.includes(area) ? area : null;
}
