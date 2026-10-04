/*
 * Chase engine types. Nothing here knows about Clue Compass's story, grades or drawing, so the
 * same engine can run another chase (for example Thread Chasers' time map) with its own data.
 *
 *  Place  — a stop on a map, with a facts table (every fact has a source)
 *  Fact   — one checkable trait of a place (key + value), with kid sentences for clues and lessons
 *  CaseDef — an ordered trail of stops; each leg's clues are references to facts of the NEXT stop
 */

/** Which pixel map a place lives on. */
export type MapId = "town" | "nc" | "us" | "world";

export interface Fact {
  /** What kind of fact: "region", "river", "landmark", "animal"… (see keys.ts for labels). */
  k: string;
  /** The checkable value. Two places "share" a fact when k and v are both equal. */
  v: string;
  /** A true sentence about this place, used when a traveler lands here by mistake (the lesson). */
  say: string;
  /** A witness clue pointing TO this place (must not name the place). */
  hint?: string;
  /** Pocket's IOU-note wording when this fact describes a hideout (must not name the place). */
  note?: string;
  /** Picture-clue icon for K–2 (see gfx/icons.ts). */
  icon?: string;
  /** Uses a geography vocabulary word (counts toward L.x.4 in grades 3–5). */
  vocab?: boolean;
  /** Source id (see data/sources.ts). */
  src: string;
}

export interface Place {
  id: string;
  name: string;
  map: MapId;
  /** [lat, lon] in degrees for real maps; [x, y] in town units (0–100, 0–60) for the town map. */
  at: [number, number];
  /** Source id for the coordinates. */
  atSrc: string;
  /** US state (postal code) or "NC" etc.; used by the coordinate sanity tests. */
  state?: string;
  /** Background painter for the place scene. */
  scene: string;
  /** Big landmark icon drawn into the scene (optional). */
  mark?: string;
  /** Who meets you here when Pocket isn't around ("a park ranger"). */
  local: string;
  facts: Fact[];
}

/** A clue reference: a fact key of the destination ("river"), "key=value", or "dir" (map direction). */
export type ClueRef = string;

export interface Leg {
  /** 1–3 witness clues about the next stop. */
  clues: ClueRef[];
  /** Three wrong destinations. */
  opts: [string, string, string];
}

export interface CaseDef {
  id: string;
  band: string;
  map: MapId;
  title: string;
  /** What Pocket borrowed, e.g. "the fire station's bell". */
  item: string;
  /** Icon for the borrowed thing. */
  itemIcon: string;
  brief: string;
  /** Place ids; stops[0] is where the case starts and the last stop is Pocket's hideout. */
  stops: string[];
  /** One leg per trip to stops[1] … stops[n-2] (so stops.length - 2 legs). */
  legs: Leg[];
  /** Notebook traits of the hideout: IOU notes left at the first stops (2 to stops.length - 1). */
  traits: ClueRef[];
  /** Three wrong hideouts for the final pick. */
  hideoutOpts: [string, string, string];
  /** What Pocket says when caught (gives the item back). */
  end: string;
}

/** A resolved tag: the fact (k, v) a clue points to. Direction tags use k = "dir". */
export interface Tag {
  k: string;
  v: string;
}

export type Verdict = "yes" | "no" | "unsure";
