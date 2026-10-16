/*
 * Quest of the Lost Library: the game rules, with no DOM. The React UI drives it (tick, move,
 * dust, useItem, interact) and reads its events; scripts/check-rules.ts drives the very same code
 * headlessly to prove every wing can be solved.
 *
 * Saved progress (localStorage `arcade.lost-library.save.v1`) never goes backwards: running out of
 * hearts only sends the hero back to the area's entrance with every key, item, door and book kept.
 */
import { BONUS_BOOK, WING_BOOK } from "./books";
import {
  AREAS, COLS, DELTA, GATE_FRONT, GUARDIANS, ROWS, WINGS, areaOfRoom, doorsOf, gapTiles, roomById,
  type AreaDef, type AreaId, type BookId, type Dir, type DoorDef, type GuardianId, type ItemId, type Place, type RoomDef,
  type WingId,
} from "./world";

export const SAVE_KEY = "arcade.lost-library.save.v1";

export interface SaveData {
  v: 1;
  at: Place;
  /** Where the hero came into the current room ("Reset room" goes back here). */
  entry: Place;
  hearts: number;
  visited: string[];
  keys: Record<WingId, number>;
  opened: string[];
  taken: string[];
  items: ItemId[];
  /** null = the lantern. */
  selected: ItemId | null;
  maps: WingId[];
  solved: string[];
  lit: string[];
  revealed: string[];
  blockPos: Record<string, [number, number][]>;
  books: BookId[];
  restored: WingId[];
  guardian: Partial<Record<GuardianId, number>>;
  finished: boolean;
  faints: number;
}

export function newSave(): SaveData {
  const start = AREAS.hub.start;
  return {
    v: 1, at: { ...start }, entry: { ...start }, hearts: -1, visited: [start.room],
    keys: { math: 0, science: 0, story: 0, history: 0 },
    opened: [], taken: [], items: [], selected: null, maps: [], solved: [], lit: [], revealed: [], blockPos: {},
    books: [], restored: [], guardian: {}, finished: false, faints: 0,
  };
}

const isStrArr = (v: unknown): v is string[] => Array.isArray(v) && v.every((x) => typeof x === "string");

function validPlace(p: unknown): p is Place {
  if (!p || typeof p !== "object") return false;
  const q = p as Place;
  try {
    roomById(q.room);
  } catch {
    return false;
  }
  return Number.isInteger(q.x) && Number.isInteger(q.y) && q.x >= 0 && q.y >= 0 && q.x < COLS && q.y < ROWS && ["up", "down", "left", "right"].includes(q.facing);
}

/** Reads a saved game; anything damaged or from another version gives null (start fresh). */
export function parseSave(raw: string | null | undefined): SaveData | null {
  if (!raw) return null;
  let o: Partial<SaveData>;
  try {
    o = JSON.parse(raw) as Partial<SaveData>;
  } catch {
    return null;
  }
  if (!o || o.v !== 1 || !validPlace(o.at)) return null;
  const base = newSave();
  const keys = { ...base.keys };
  for (const w of WINGS) {
    const n = (o.keys as Record<string, unknown> | undefined)?.[w];
    if (typeof n === "number" && n >= 0 && n < 10) keys[w] = Math.floor(n);
  }
  const s: SaveData = {
    ...base,
    at: { ...o.at!, area: areaOfRoom(o.at!.room).id },
    entry: validPlace(o.entry) ? { ...o.entry, area: areaOfRoom(o.entry.room).id } : { ...o.at!, area: areaOfRoom(o.at!.room).id },
    hearts: typeof o.hearts === "number" ? o.hearts : -1,
    keys,
    faints: typeof o.faints === "number" ? o.faints : 0,
    finished: o.finished === true,
  };
  for (const k of ["visited", "opened", "taken", "items", "maps", "solved", "lit", "revealed", "books", "restored"] as const) {
    if (isStrArr(o[k])) (s[k] as string[]) = [...new Set(o[k] as string[])];
  }
  if (o.selected === null || (typeof o.selected === "string" && s.items.includes(o.selected as ItemId))) s.selected = (o.selected ?? null) as ItemId | null;
  if (o.blockPos && typeof o.blockPos === "object") s.blockPos = o.blockPos;
  if (o.guardian && typeof o.guardian === "object") s.guardian = o.guardian;
  return s;
}

export function loadSave(): SaveData | null {
  try {
    return parseSave(localStorage.getItem(SAVE_KEY));
  } catch {
    return null;
  }
}

export function writeSave(s: SaveData): void {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(s));
  } catch {
    // Private mode or full storage: progress just isn't kept.
  }
}

export function clearSave(): void {
  try {
    localStorage.removeItem(SAVE_KEY);
  } catch {
    // ignore
  }
}

/* ---------------------------------------------------------------------------------- tiles */

/** Tiles you can stand on (effective tiles, see Game.tile). "^" only for K-2. */
const WALK = new Set([".", ",", "=", "f", "S", "E", "K", "M", "P", "I"]);
/** Tiles a thrown boomerang or a quill line passes over. */
const PASS = new Set([".", ",", "=", "f", "S", "E", "K", "M", "P", "I", "_", "^", "~"]);
/** Tiles a book crate can slide onto. */
const BLOCK_OK = new Set([".", ",", "=", "f", "S", "E"]);

export type Sfx =
  | "push" | "bump" | "key" | "item" | "door" | "solve" | "dust" | "poof" | "hurt" | "torch" | "throw" | "hit"
  | "quill" | "magnify" | "bell" | "chest" | "warp" | "heart" | "book" | "right" | "wrong" | "faint";

export type Fx =
  | { kind: "poof"; x: number; y: number; t: number }
  | { kind: "swing"; x: number; y: number; dir: Dir; t: number }
  | { kind: "boomerang"; path: [number, number][]; t: number }
  | { kind: "quill"; from: [number, number]; to: [number, number]; t: number }
  | { kind: "ring"; x: number; y: number; color: string; t: number }
  | { kind: "sparkle"; x: number; y: number; t: number };

export type GameEvent =
  | { type: "msg"; text: string; title?: string }
  | { type: "question"; doorId: string }
  | { type: "guardian"; guardian: GuardianId }
  | { type: "book"; book: BookId }
  | { type: "item"; item: ItemId }
  | { type: "sfx"; name: Sfx }
  | { type: "room" }
  | { type: "hurt" }
  | { type: "faint" }
  | { type: "restored"; wing: WingId }
  | { type: "finished" };

export interface Enemy {
  id: number;
  kind: "sprite" | "bunny";
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
  /** K-2: more hearts, fewer and slower ink sprites, ink puddles are harmless stains. */
  early: boolean;
  /** Spawn ink sprites (off for the headless solver). */
  enemies: boolean;
  invincible?: boolean;
  rng?: () => number;
}

export const STEP_TIME = 0.13;
const FX_TIME: Record<Fx["kind"], number> = { poof: 0.5, swing: 0.18, boomerang: 0.45, quill: 0.3, ring: 0.7, sparkle: 0.8 };

export class Game {
  s: SaveData;
  blocks: [number, number][] = [];
  enemies: Enemy[] = [];
  drops: [number, number][] = [];
  invuln = 0;
  /** Player walk animation: previous tile and progress 0..1. */
  anim = { fx: 0, fy: 0, t: 1 };
  pushAnim: { i: number; fx: number; fy: number; t: number } | null = null;
  fx: Fx[] = [];
  events: GameEvent[] = [];
  /** Set whenever saved progress changed (the UI writes the save). */
  dirty = false;
  private nextEnemy = 1;
  private lastBump = "";
  private rng: () => number;
  /** Increases every time something visible changes (the UI uses it for the HUD). */
  version = 0;

  constructor(save: SaveData | null, public opts: GameOpts) {
    this.rng = opts.rng ?? Math.random;
    this.s = save ? parseSave(JSON.stringify(save))! : newSave();
    if (this.s.hearts <= 0 || this.s.hearts > this.maxHearts) this.s.hearts = this.maxHearts;
    this.loadRoomState();
    this.anim = { fx: this.s.at.x, fy: this.s.at.y, t: 1 };
  }

  get maxHearts(): number {
    return this.opts.early ? 5 : 4;
  }
  get area(): AreaDef {
    return AREAS[this.s.at.area];
  }
  get room(): RoomDef {
    return roomById(this.s.at.room);
  }
  get wing(): WingId | null {
    const a = this.s.at.area;
    return (WINGS as string[]).includes(a) ? (a as WingId) : null;
  }
  get pos(): [number, number] {
    return [this.s.at.x, this.s.at.y];
  }
  allRestored(): boolean {
    return WINGS.every((w) => this.s.restored.includes(w));
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
    for (const rd of doorsOf(this.s.at.room)) if (gapTiles(rd.side).some(([gx, gy]) => gx === x && gy === y)) return rd.door;
    return null;
  }

  doorOpen(d: DoorDef): boolean {
    return d.kind === "open" || this.s.opened.includes(d.id);
  }

  /**
   * The tile as it is right now: doors (. open, D shutter, L locked, Q question, H hidden crack),
   * pickups (taken → floor; k/m/c hidden until the puzzle is solved), U open chest, Y lit torch,
   * r crystal that's been hit, I revealed ink bridge, X sealed gate.
   */
  tile(x: number, y: number, roomId = this.s.at.room): string {
    if (x < 0 || y < 0 || x >= COLS || y >= ROWS) return "#";
    const room = roomById(roomId);
    if (x === 0 || y === 0 || x === COLS - 1 || y === ROWS - 1) {
      for (const rd of doorsOf(roomId)) {
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
      default:
        return c;
    }
  }

  walkable(t: string): boolean {
    return WALK.has(t) || (t === "^" && this.opts.early);
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

  /* ------------------------------------------------------------------------- rooms & moving */

  private loadRoomState() {
    const room = this.room;
    const solvedPos = this.s.blockPos[room.id];
    this.blocks = this.s.solved.includes(room.id) && solvedPos ? solvedPos.map(([x, y]) => [x, y]) : Game.tilesOf(room, "B");
    this.drops = [];
    this.enemies = [];
    this.pushAnim = null;
    this.fx = [];
    if (this.opts.enemies) {
      const spawns = Game.tilesOf(room, "E").filter((_, i) => !this.opts.early || i % 2 === 0);
      const kind = this.s.at.area === "hub" ? "bunny" : "sprite";
      for (const [x, y] of spawns) this.enemies.push({ id: this.nextEnemy++, kind, x, y, fx: x, fy: y, mt: 1, t: 0.6 + this.rng() * 0.8 });
    }
  }

  enterRoom(roomId: string, x: number, y: number, facing: Dir) {
    const area = areaOfRoom(roomId).id;
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
    const rd = doorsOf(room.id).find((d) => d.side === dir);
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
  }

  /** One step (or a push, or walking into a door). Returns true when the hero moved. */
  move(dir: Dir): boolean {
    this.s.at.facing = dir;
    const { x, y } = this.s.at;
    const [dx, dy] = DELTA[dir];
    const nx = x + dx;
    const ny = y + dy;
    if (nx < 0 || ny < 0 || nx >= COLS || ny >= ROWS) return this.leaveRoom(dir);
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
      this.arrive();
      return true;
    }
    this.touch(nx, ny, t, true);
    return false;
  }

  /** Walking into (bump) or facing + Enter (not bump) something solid. */
  private touch(x: number, y: number, t: string, bump: boolean): boolean {
    const key = `${this.s.at.room}:${x},${y}`;
    const say = (text: string) => (bump ? this.bumpMsg(key, text) : this.msg(text));
    const door = this.doorAtGap(x, y);
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
        } else say("Locked! A small key from this wing opens it.");
        return true;
      }
      case "D":
        say("This door is shut tight. Solve the puzzle in this room to open it.");
        return true;
      case "X":
        say(`The Reading Room door has four book-shaped holes. Restore all four wings to open it. (${this.s.restored.length} of 4 restored)`);
        return true;
      case "H":
        if (!bump) say("This shelf has a big crack in it. It sounds hollow...");
        return true;
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
    if (t === "K") {
      this.add("taken", id);
      if (w) this.s.keys[w]++;
      this.sfx("key");
      this.msg("You found a small key! It opens one locked door in this wing.");
    } else if (t === "M") {
      this.add("taken", id);
      if (w && !this.s.maps.includes(w)) this.s.maps.push(w);
      this.sfx("item");
      this.msg("You found the wing map! Press Esc (or MAP) to see every room of this wing.");
    } else if (t === "P") {
      const warp = this.room.warp;
      if (warp) {
        this.sfx("warp");
        this.goTo(warp);
        return;
      }
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

  /** Enter: read, talk, open a chest, or knock on a door. */
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
        this.msg(this.folioHint(), "MADAME FOLIO");
        return true;
      case "G": {
        const g = this.area.guardian;
        if (!g) return false;
        const done = g === "smudge" ? this.s.finished : this.s.restored.includes(GUARDIANS[g].area as WingId);
        if (done) this.msg(g === "smudge" ? "Splotch! Thanks for reading with me." : `${GUARDIANS[g].name}: Thank you for caring for the library!`);
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
        this.msg("A brass hook post. A Grappling Quill can hook onto it.");
        return true;
      case "O":
        this.msg("A dusty old globe. It still spins!");
        return true;
      case "Y":
        this.msg("A warm, bright torch.");
        return true;
      default:
        return false;
    }
  }

  folioHint(): string {
    const s = this.s;
    if (s.finished) return "You found the lost library, Pip! Every book is home. Come back anytime to read.";
    if (this.allRestored()) return "All four wings are restored! The Reading Room door on the Library Steps is open. Go north!";
    const left = WINGS.filter((w) => !s.restored.includes(w));
    const names: Record<WingId, string> = { math: "Math (west)", science: "Science (north-west)", story: "Story (north-east)", history: "History & Maps (east)" };
    if (s.restored.length === 0) {
      return "Pip! Thank goodness. The Ink Smudge knocked every book off our shelves. Each wing's guardian is keeping one safe. Visit the four wings and bring the books home. I filled your hearts!";
    }
    return `Wonderful work! Still to restore: ${left.map((w) => names[w]).join(", ")}. I filled your hearts!`;
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
      this.addBook(BONUS_BOOK[w]);
    } else if (what === "key" && w) {
      this.s.keys[w]++;
      this.sfx("key");
      this.msg("A small key!");
    } else if (what === "map" && w) {
      if (!this.s.maps.includes(w)) this.s.maps.push(w);
    }
    this.save();
  }

  private addBook(b: BookId) {
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
    }
  }

  private checkPuzzle() {
    const room = this.room;
    if (!room.puzzle || this.s.solved.includes(room.id) || !this.puzzleDone(room)) return;
    this.add("solved", room.id);
    if (room.puzzle.kind === "blocks") this.s.blockPos[room.id] = this.blocks.map(([x, y]) => [x, y]);
    for (const d of room.puzzle.opens ?? []) this.add("opened", d);
    this.sfx("solve");
    const what: string[] = [];
    if (Game.tilesOf(room, "k").length) what.push("A small key appeared!");
    if (Game.tilesOf(room, "m").length) what.push("The wing map appeared!");
    if (Game.tilesOf(room, "c").length) what.push("A treasure chest appeared!");
    if (room.puzzle.opens?.length) what.push("A door slid open!");
    for (const [x, y] of Game.tilesOf(room, "kmc")) this.fx.push({ kind: "sparkle", x, y, t: 0 });
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
  itemChoices(): (ItemId | null)[] {
    return [null, ...this.s.items];
  }

  selectNext() {
    const list = this.itemChoices();
    const i = list.indexOf(this.s.selected);
    this.s.selected = list[(i + 1) % list.length];
    this.sfx("hit");
    this.save();
  }

  select(item: ItemId | null) {
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
    if (item === "boomerang") {
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
    if (item === "quill") {
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
    if (item === "magnifier") {
      this.sfx("magnify");
      this.fx.push({ kind: "ring", x: this.s.at.x, y: this.s.at.y, color: "#b05cff", t: 0 });
      const hasInk = Game.tilesOf(room, "i").length > 0;
      if ((hasInk || room.secret) && !this.s.revealed.includes(room.id)) {
        this.add("revealed", room.id);
        for (const [x, y] of Game.tilesOf(room, "i")) this.fx.push({ kind: "sparkle", x, y, t: 0 });
        this.msg(room.secret ?? "The magnifier shows a bridge written in invisible ink! Now you can walk across.");
        this.checkPuzzle();
      } else this.bumpMsg("magnify", "You look closely... nothing secret here.");
      return;
    }
    if (item === "bell") {
      this.sfx("bell");
      this.fx.push({ kind: "ring", x: this.s.at.x, y: this.s.at.y, color: "#6ea0ff", t: 0 });
      const hidden = doorsOf(room.id).filter((d) => d.door.kind === "hidden" && !this.s.opened.includes(d.door.id));
      if (hidden.length) {
        for (const d of hidden) {
          this.add("opened", d.door.id);
          for (const [x, y] of gapTiles(d.side)) this.fx.push({ kind: "sparkle", x, y, t: 0 });
        }
        this.sfx("door");
        this.msg(hidden.length > 1 ? "DONG! The echo found hidden doors!" : "DONG! The echo found a hidden door!");
      } else this.bumpMsg("bell", "DONG... the echo comes back. No hidden doors in this room.");
    }
  }

  /* ---------------------------------------------------------------------- doors & guardians */

  openQuestionDoor(doorId: string) {
    this.add("opened", doorId);
    this.sfx("door");
  }

  guardianProgress(g: GuardianId): number {
    return this.s.guardian[g] ?? 0;
  }

  /** One guardian answer. Right ones count; wrong ones change nothing. Returns true when finished. */
  guardianAnswer(g: GuardianId, correct: boolean): boolean {
    if (!correct) return false;
    const n = (this.s.guardian[g] ?? 0) + 1;
    this.s.guardian[g] = n;
    this.save();
    if (n < GUARDIANS[g].need) return false;
    if (g === "smudge") {
      this.addBook("reading");
      this.s.finished = true;
      this.save();
      this.emit({ type: "finished" });
      return true;
    }
    const wing = GUARDIANS[g].area as WingId;
    if (!this.s.restored.includes(wing)) this.s.restored.push(wing);
    this.s.hearts = this.maxHearts;
    this.emit({ type: "restored", wing });
    this.addBook(WING_BOOK[wing]);
    this.goTo(GATE_FRONT[wing]);
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
    this.msg("Whoops, too much ink! Madame Folio's tidy-up spell carried you back to the entrance. You kept every key, item and book.");
  }

  /* ------------------------------------------------------------------------------- time */

  /** Advances animations and ink sprites. `held` is the direction being held (or null). */
  tick(dt: number, held: Dir | null) {
    if (dt <= 0) return; // paused: nothing moves and nothing can hurt the hero
    this.invuln = Math.max(0, this.invuln - dt);
    const step = this.opts.early ? STEP_TIME * 1.15 : STEP_TIME;
    if (this.anim.t < 1) this.anim.t = Math.min(1, this.anim.t + dt / step);
    if (this.pushAnim) {
      this.pushAnim.t += dt / step;
      if (this.pushAnim.t >= 1) this.pushAnim = null;
    }
    if (this.anim.t >= 1 && held) this.move(held);
    for (const f of this.fx) f.t += dt;
    this.fx = this.fx.filter((f) => f.t < FX_TIME[f.kind]);
    this.tickEnemies(dt);
  }

  private tickEnemies(dt: number) {
    const period = this.opts.early ? 1.05 : 0.62;
    const chase = this.opts.early ? 0.2 : 0.45;
    for (const e of this.enemies) {
      e.mt = Math.min(1, e.mt + dt / (period * 0.6));
      e.t -= dt;
      if (e.t > 0) continue;
      e.t = period * (0.8 + this.rng() * 0.4);
      const [px, py] = this.pos;
      let dirs: Dir[] = (["up", "down", "left", "right"] as Dir[]).sort(() => this.rng() - 0.5);
      if (e.kind === "sprite" && this.rng() < chase) {
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
        if (!(WALK.has(t) || t === "^") || t === "P" || this.blockAt(nx, ny) >= 0 || this.enemyAt(nx, ny)) continue;
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
      for (const e of this.enemies) if (e.kind === "sprite" && e.x === px && e.y === py) this.hurt();
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
    const g = Object.values(s.guardian).reduce((a, b) => a + (b ?? 0), 0);
    return `${s.opened.length}.${s.taken.length}.${s.items.length}.${s.maps.length}.${s.solved.length}.${s.lit.length}.${s.revealed.length}.${s.books.length}.${s.restored.length}.${s.keys.math}${s.keys.science}${s.keys.story}${s.keys.history}.${g}.${s.finished ? 1 : 0}`;
  }

  /** Everything that counts as progress (it only ever grows; keys go up and are spent on doors). */
  progressKey(): string {
    const s = this.s;
    const k = (a: string[]) => [...a].sort().join(",");
    return [
      WINGS.map((w) => s.keys[w]).join(""), k(s.opened), k(s.taken), k(s.items), k(s.maps), k(s.solved), k(s.lit), k(s.revealed),
      k(s.books), k(s.restored), JSON.stringify(s.guardian), s.finished,
    ].join("|");
  }

  /** Where the hero is and how the current room's crates sit (all that changes between progress). */
  lightKey(): string {
    const { room, x, y, facing } = this.s.at;
    return `${room}|${x},${y}|${facing}|${this.s.selected}|${this.blocks.map(([bx, by]) => `${bx},${by}`).join(";")}|${this.s.entry.room},${this.s.entry.x},${this.s.entry.y}`;
  }

  snapshot(): string {
    return JSON.stringify({ s: this.s, blocks: this.blocks, enemies: this.enemies, drops: this.drops, invuln: this.invuln });
  }

  restore(snap: string) {
    const o = JSON.parse(snap) as { s: SaveData; blocks: [number, number][]; enemies: Enemy[]; drops: [number, number][]; invuln: number };
    this.s = o.s;
    this.blocks = o.blocks;
    this.enemies = o.enemies;
    this.drops = o.drops;
    this.invuln = o.invuln;
    this.fx = [];
    this.events = [];
    this.anim = { fx: o.s.at.x, fy: o.s.at.y, t: 1 };
    this.pushAnim = null;
    this.lastBump = "";
  }
}

/** Book, area and room counts for the HUD and the title screen. */
export function wingOf(area: AreaId): WingId | null {
  return (WINGS as string[]).includes(area) ? (area as WingId) : null;
}
