import { CIRCUITS, type CircuitLevel } from "./circuitLevels";
import type { Band } from "./common";
import { HEATS, type HeatLevel } from "./heat";

/*
 * The town: twelve buildings along a snowy street, dark since the storm. Solving a building's
 * level lights it up (saved). Each grade band has its own twelve levels for the same buildings.
 */

export type Level = CircuitLevel | HeatLevel;

export interface Building {
  id: string;
  name: string;
  /** Wall and roof colours, width and height in map pixels. */
  wall: string;
  roof: string;
  w: number;
  h: number;
}

export const BUILDINGS: Building[] = [
  { id: "workshop", name: "Workshop", wall: "#8a5a3a", roof: "#3a3a5a", w: 30, h: 26 },
  { id: "bakery", name: "Bakery", wall: "#e8b878", roof: "#c0392b", w: 32, h: 30 },
  { id: "library", name: "Library", wall: "#7a6a9a", roof: "#2a2a4a", w: 38, h: 34 },
  { id: "school", name: "School", wall: "#c0503a", roof: "#5a3a2a", w: 40, h: 36 },
  { id: "clinic", name: "Clinic", wall: "#e8eef8", roof: "#2456e8", w: 32, h: 30 },
  { id: "firehouse", name: "Firehouse", wall: "#c0302b", roof: "#4a2a2a", w: 36, h: 32 },
  { id: "grocery", name: "Grocery", wall: "#5aa86a", roof: "#2a4a3a", w: 38, h: 28 },
  { id: "toyshop", name: "Toy Shop", wall: "#e878b0", roof: "#6a2a5a", w: 30, h: 30 },
  { id: "community", name: "Community Center", wall: "#d8a040", roof: "#5a4020", w: 42, h: 32 },
  { id: "rink", name: "Ice Rink", wall: "#9ad8f0", roof: "#2a5a7a", w: 40, h: 26 },
  { id: "radio", name: "Radio Tower", wall: "#9aa0b0", roof: "#e3262f", w: 22, h: 52 },
  { id: "townhall", name: "Town Hall", wall: "#d8d0b8", roof: "#2a3a6a", w: 46, h: 44 },
];

export const LEVEL_IDS: Record<Band, string[]> = {
  k2: ["k2-loop", "k2-cocoa", "k2-materials", "k2-sun", "k2-fixit", "k2-short", "k2-icepop", "k2-fan", "k2-buzzer", "k2-spoons", "k2-materials2", "k2-townhall"],
  g35: ["g35-loop", "g35-cocoa", "g35-materials", "g35-sun", "g35-fixit", "g35-short", "g35-icepop", "g35-motor", "g35-heater", "g35-spoons", "g35-parallel", "g35-house"],
  g68: ["g68-energy", "g68-cocoa", "g68-series", "g68-parallel", "g68-fixit", "g68-short", "g68-icepop", "g68-spoons", "g68-heater", "g68-sun", "g68-radio", "g68-house"],
  hs: ["hs-ohm", "hs-tank", "hs-battery", "hs-series", "hs-parallel", "hs-short", "hs-icepop", "hs-power", "hs-heater", "hs-handles", "hs-equiv", "hs-house"],
};

export const LEVEL_COUNT = BUILDINGS.length;

export function levelById(id: string): Level {
  const l = CIRCUITS[id] ?? HEATS[id];
  if (!l) throw new Error(`no level ${id}`);
  return l;
}

export function levelFor(band: Band, i: number): Level {
  return levelById(LEVEL_IDS[band][i]);
}

/** A short tag for the level list. */
export function levelTag(l: Level): string {
  if (l.kind === "circuit") return "⚡ CIRCUIT";
  return "🔥 HEAT LAB";
}

/** Sparky's Run is offered after every solved level; maps rotate. */
export function runMapFor(i: number): number {
  return i % 4;
}
