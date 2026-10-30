/*
 * The quest framework: everything a quest is made of, as plain data, plus a World index over one
 * quest's rooms and doors. The engine (game.ts), the renderer (render.ts), the solver (solver.ts)
 * and scripts/check-rules.ts run any QuestDef.
 *
 * A quest is a hub (town / beach / courtyard ...), 3-4 wings (each with its own subject, item,
 * guardian, small keys, map, item chest and bonus treasure) and a final room behind a sealed gate
 * that opens once every wing is restored. See README.md for "how to add a quest".
 *
 * Every room is a 20 x 12 grid of 16 px tiles. Rooms sit on a grid inside their area; the doors
 * between neighbouring rooms are listed once per area (DoorDef), so both sides always agree.
 * Door gaps are carved into the border automatically:
 *   north / south: columns 9-10 of row 0 / row 11       west / east: rows 5-6 of column 0 / column 19
 *
 * Tile legend (RoomDef.rows). Every quest draws these in its own theme (render.ts):
 *   #  wall                       W  building wall (a gate house in the hub)
 *   .  floor    ,  rug    =  path    f  flowers    E  pest spawn (floor)
 *   B  pushable crate             S  pressure switch (floor; crates go on it)
 *   T  cold torch (lantern: face it, press X)     Y  lit torch (decoration)
 *   R  crystal switch (hit it with a thrown item: the "boomerang" power)
 *   _  gap / chasm (can't walk; a "grapple" item pulls you across to a hook post o)   o  hook post
 *   i  hidden bridge / invisible floor (a gap until a "reveal" or "ghost" item shows it)
 *   ^  hazard puddle (ink, lava ...): costs a heart from grade 3 up, harmless to walk on for K-2
 *   K / k  small key (k appears when the room's puzzle is solved)   M / m  area map (same rule)
 *   C / c  chest (same rule; contents in RoomDef.chest)
 *   N  sign (Enter reads it)      F  the quest's helper (Enter talks and refills hearts)
 *   G  guardian (2 x 2 tiles; Enter starts the guardian's questions)
 *   P  gate door: warps to RoomDef.warp (a sealed gate opens when every wing is restored)
 *   t  tree / big plant (solid)   ~  water (solid decoration)   O  decoration (solid: globe, anchor, gear ...)
 *  New mechanics (generic; any quest may use them):
 *   l  tide lever (Enter flips the room's tide between low and high; RoomDef.tide is where it starts)
 *   w  tide pool: deep water at high tide, wet sand you can walk on at low tide
 *   u  floating dock: rides the water up to walk on at high tide, sits at the bottom of a pit at low tide
 *   j  strong current / jellyfish bloom: only a "bubble" shield gets you through (deep water too)
 *   z  clock switch (floor): step on it to open the room's timed gates | for RoomDef.timer seconds
 *   |  timed gate: open while the clock switch's timer runs (and while you stand in it)
 *   < > A V  conveyor belt / current / updraft (left, right, up, down): carries you until it ends
 *   &  wind-up post ("windup" item: face it, press X); when every post in the room is wound,
 *   $  clockwork bridge: a gap until the room's wind-up posts are all wound
 *   b  cooled-rock bridge: a gap until the room's puzzle is solved
 *   h  hot rock: walkable only while you carry the "heat" item
 *   *  magma crystal (the "heat" item lights it: face it, press X)
 *   %  steam vent: puffs on a rhythm (RoomDef.vent); blocked while puffing, and a puff blows you along
 *   q  friendly ghost: invisible floor until a "ghost" item reveals it, then it talks (RoomDef.ghost)
 *
 * Pure data + tiny helpers (no DOM), so scripts/check-rules.ts can load it under tsx.
 */
import type { Subject } from "../kit/types";

export const COLS = 20;
export const ROWS = 12;

export type Dir = "up" | "down" | "left" | "right";
export const DIRS: Dir[] = ["up", "down", "left", "right"];
export const DELTA: Record<Dir, [number, number]> = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
export const OPPOSITE: Record<Dir, Dir> = { up: "down", down: "up", left: "right", right: "left" };

export type DoorKind = "open" | "locked" | "question" | "shutter" | "hidden";
export type PuzzleKind = "blocks" | "torches" | "crystal" | "secret" | "magma" | "winders";

/** What an item does when you press X (or, for "heat", just by carrying it). */
export type ItemPower = "boomerang" | "grapple" | "reveal" | "echo" | "bubble" | "windup" | "heat" | "ghost";

/** Every tile character a room may use (see the legend above). */
export const TILE_CHARS = "#W.,=fEBSTYR_oi^KkMmCcNFGPt~Olwujz|<>AV&$bh*%q";

export interface DoorDef {
  /** Unique across the quest. */
  id: string;
  /** Two rooms of the same area that are grid neighbours. */
  a: string;
  b: string;
  kind: DoorKind;
}

export interface Place {
  area: string;
  room: string;
  x: number;
  y: number;
  facing: Dir;
}

export interface RoomDef {
  id: string;
  name: string;
  /** Column, row on the area grid. */
  at: [number, number];
  rows: string[];
  /** Solving it opens `opens` doors and makes the room's lower-case k / m / c tiles (and b bridges) appear. */
  puzzle?: { kind: PuzzleKind; opens?: string[] };
  chest?: "item" | "book" | "key" | "map";
  /** Sign texts, in reading order of the N tiles (left to right, top to bottom). */
  signs?: string[];
  /** Text only a "reveal" / "ghost" item shows (a "secret" puzzle room). */
  secret?: string;
  /** What the room's friendly ghosts (q) say once revealed. */
  ghost?: string;
  /** Where the room's P tiles lead. */
  warp?: Place;
  /** The P tiles stay shut until every wing is restored (the final room's door). */
  sealed?: boolean;
  /** A side of the room that leads out of the area. */
  exit?: { side: Dir; to: Place };
  /** Where the tide starts (tide rooms; default low). */
  tide?: "low" | "high";
  /** Seconds the clock switch z keeps the timed gates open (grade 3+; K-2 gets half as long again). */
  timer?: number;
  /** Steam vent rhythm in milliseconds (default 1200 on, 1600 off; K-2 rests half as long again). */
  vent?: { on: number; off: number };
}

export type WallStyle = "shelf" | "hedge" | "rock" | "coral" | "brass" | "stone" | "basalt" | "gallery" | "garden";
export type FloorStyle = "boards" | "grass" | "sand" | "tiles" | "metal" | "ash" | "parquet" | "marble";

export interface Pal {
  floorA: string;
  floorB: string;
  rug: string;
  rugEdge: string;
  shelf: string;
  shelfDark: string;
  accent: string;
  building: string;
  buildingDark: string;
}

export interface AreaDef {
  id: string;
  name: string;
  /** Short HUD / map label. */
  short: string;
  subject: Subject | null;
  item: string | null;
  /** Where a player starts (and comes back to after running out of hearts). */
  start: Place;
  rooms: RoomDef[];
  doors: DoorDef[];
  guardian: string | null;
  /** How the area is drawn: wall and floor style and its colours. */
  look: { wall: WallStyle; floor: FloorStyle; pal: Pal };
}

export interface GuardianDef {
  id: string;
  name: string;
  title: string;
  area: string;
  /** Right answers needed (wrong ones only explain and ask another). */
  need: number;
  intro: string;
  win: string;
}

export interface ItemDef {
  id: string;
  name: string;
  short: string;
  wing: string;
  how: string;
  power: ItemPower;
  /** HUD icon colour. */
  color: string;
}

/** A treasure (a book in the Lost Library, a pearl in the Sunken Lighthouse ...) with a fun fact. */
export interface Book {
  id: string;
  title: string;
  wing: string;
  /** Spine / gem colour on the shelf. */
  color: string;
  fact: string;
}

export type Theme = "library" | "sea" | "clock" | "volcano" | "museum";

export interface QuestDef {
  id: string;
  /** Full title ("The Sunken Lighthouse"). */
  title: string;
  /** One line for the quest picker. */
  tagline: string;
  /** The story blurb on the quest picker. */
  story: string;
  /** localStorage key of this quest's save. */
  saveKey: string;
  theme: Theme;
  hub: string;
  /** The area behind the sealed gate (its guardian finishes the quest). */
  final: string;
  wings: string[];
  areas: Record<string, AreaDef>;
  guardians: Record<string, GuardianDef>;
  items: Record<string, ItemDef>;
  /** Where you stand in the hub after leaving each wing (and the final room). */
  gateFront: Record<string, Place>;
  books: Book[];
  /** The treasure each wing's guardian gives back, the bonus one hidden in each wing, and the final one. */
  wingBook: Record<string, string>;
  bonusBook: Record<string, string>;
  finalBook: string;
  /** The room holding each wing's bonus treasure chest. */
  bonusRoom: Record<string, string>;
  /** Pests: harmless ones in the hub, ones that bump hearts in the wings. */
  pests: { hub: string; wing: string; name: string };
  /** Song keys in src/music.ts. */
  music: { hub: string; wings: Record<string, string>; final: string };
  /** Gate building colours in the hub, by room. */
  gateColor: Record<string, [string, string]>;
  terms: {
    /** "wing", "grotto" ... */
    wing: string;
    wings: string;
    /** "book" / "books" */
    treasure: string;
    treasures: string;
    /** Title-screen shelf heading, e.g. "YOUR BOOKSHELF". */
    shelf: string;
    /** The card heading when one is found, e.g. "A LOST BOOK IS FOUND!" */
    found: string;
    /** The pests tidied by the feather duster, e.g. "ink sprites". */
    pests: string;
  };
  helper: {
    name: string;
    first: string;
    /** `left` lists the wings still to restore. */
    progress: (left: string) => string;
    all: string;
    done: string;
    /** How the helper names each wing in hints ("Math (west)"). */
    wingNames: Record<string, string>;
  };
  texts: {
    intro: { title: string; text: string }[];
    howTo: string;
    faint: string;
    sealed: (restored: number, total: number) => string;
    /** Talking to a wing guardian after its wing is restored. */
    thanks: string;
    /** Talking to the final guardian after the end. */
    finalThanks: string;
    /** Walking into a hidden door's cracked wall. */
    crack: string;
    /** Looking at an O decoration. */
    decor: string;
    endingTitle: string;
    endingText: string;
    /** HUD/inventory line about what the hero carries. */
    carries: string;
    /** The quest's own tricks, for the How to Play box (new tiles and items). */
    tricks?: string;
    /** The hub's name in How to Play ("the town", "the beach"). */
    hubName: string;
    /** The final room's name ("the Reading Room"). */
    finalName: string;
  };
}

/* ------------------------------------------------------------------------------ helpers */

/** The side of room `from` that faces its grid neighbour `to` (null if they don't touch). */
export function sideToward(from: RoomDef, to: RoomDef): Dir | null {
  const dx = to.at[0] - from.at[0];
  const dy = to.at[1] - from.at[1];
  if (dx === 1 && dy === 0) return "right";
  if (dx === -1 && dy === 0) return "left";
  if (dx === 0 && dy === 1) return "down";
  if (dx === 0 && dy === -1) return "up";
  return null;
}

/** The two border tiles of a side's door gap. */
export function gapTiles(side: Dir): [number, number][] {
  switch (side) {
    case "up": return [[9, 0], [10, 0]];
    case "down": return [[9, ROWS - 1], [10, ROWS - 1]];
    case "left": return [[0, 5], [0, 6]];
    case "right": return [[COLS - 1, 5], [COLS - 1, 6]];
  }
}

export interface RoomDoor {
  door: DoorDef;
  side: Dir;
  /** The room on the other side. */
  other: string;
}

/** Lookups over one quest's rooms and doors. */
export class World {
  private index = new Map<string, { area: AreaDef; room: RoomDef }>();
  private doorsBy = new Map<string, RoomDoor[]>();

  constructor(public quest: QuestDef) {
    for (const area of Object.values(quest.areas)) for (const room of area.rooms) this.index.set(room.id, { area, room });
    for (const area of Object.values(quest.areas)) {
      for (const d of area.doors) {
        const a = this.index.get(d.a)?.room;
        const b = this.index.get(d.b)?.room;
        if (!a || !b) continue; // check-rules reports it
        const sa = sideToward(a, b);
        const sb = sideToward(b, a);
        if (!sa || !sb) continue;
        this.doorsBy.set(d.a, [...(this.doorsBy.get(d.a) ?? []), { door: d, side: sa, other: d.b }]);
        this.doorsBy.set(d.b, [...(this.doorsBy.get(d.b) ?? []), { door: d, side: sb, other: d.a }]);
      }
    }
  }

  has(id: string): boolean {
    return this.index.has(id);
  }
  room(id: string): RoomDef {
    const r = this.index.get(id);
    if (!r) throw new Error(`no room ${id} in ${this.quest.id}`);
    return r.room;
  }
  areaOf(id: string): AreaDef {
    const r = this.index.get(id);
    if (!r) throw new Error(`no room ${id} in ${this.quest.id}`);
    return r.area;
  }
  allRooms(): RoomDef[] {
    return [...this.index.values()].map((r) => r.room);
  }
  doorsOf(roomId: string): RoomDoor[] {
    return this.doorsBy.get(roomId) ?? [];
  }
  doorById(id: string): DoorDef | undefined {
    for (const a of Object.values(this.quest.areas)) for (const d of a.doors) if (d.id === id) return d;
    return undefined;
  }
  /** The room of the area holding its guardian (the 2 x 2 G tiles). */
  guardianRoom(gid: string): string | null {
    const g = this.quest.guardians[gid];
    if (!g) return null;
    const area = this.quest.areas[g.area];
    return area?.rooms.find((r) => r.rows.some((row) => row.includes("G")))?.id ?? null;
  }
}

const WORLDS = new WeakMap<QuestDef, World>();
export function worldOf(q: QuestDef): World {
  let w = WORLDS.get(q);
  if (!w) {
    w = new World(q);
    WORLDS.set(q, w);
  }
  return w;
}

/** Shorthand for writing places in quest data. */
export const P = (area: string, room: string, x: number, y: number, facing: Dir): Place => ({ area, room, x, y, facing });

/** Shared room shapes. */
export const ENTRANCE = (sign: string, top = "#Y................Y#"): string[] => [
  "####################",
  top,
  "#..................#",
  sign,
  "#..................#",
  "#..................#",
  "#..................#",
  "#.......,,,,.......#",
  "#.......,,,,.......#",
  "#.......,,,,.......#",
  "#.......,,,,.......#",
  "####################",
];
export const GUARDIAN_HALL = [
  "####################",
  "#Y................Y#",
  "#..................#",
  "#........GG........#",
  "#........GG........#",
  "#..................#",
  "#.....,,,,,,,,.....#",
  "#.....,,,,,,,,.....#",
  "#..................#",
  "#Y................Y#",
  "#..................#",
  "####################",
];
