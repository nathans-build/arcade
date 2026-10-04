import type { Grade } from "@/kit/types";
import { World } from "@/chase/logic";
import type { CaseRules } from "@/chase/logic";
import { CASES, type Band } from "./cases";
import { NC_PLACES } from "./places-nc";
import { TOWN_PLACES } from "./places-town";
import { US_PLACES } from "./places-us";
import { WORLD_PLACES } from "./places-world";

export const ALL_PLACES = [...TOWN_PLACES, ...NC_PLACES, ...US_PLACES, ...WORLD_PLACES];
export const WORLD = new World(ALL_PLACES);

/** Grades 6–12 play the grade 5 band (with a note pointing them to Thread Chasers). */
export function bandOf(g: Grade): Band {
  if (g === "K") return "K";
  if (g === "1" || g === "2") return "1-2";
  if (g === "3") return "3";
  if (g === "4") return "4";
  return "5";
}

export function isOlder(g: Grade): boolean {
  return g !== "K" && Number(g) >= 6;
}

export interface BandConfig {
  label: string;
  rules: CaseRules;
  /** Compass charges at the start of a case (null = unlimited, the clock never ends a case). */
  charges: (legs: number) => number | null;
  /** Cases per mission. */
  perMission: number;
  /** Picture clues (big icons) and read-aloud by default. */
  pictures: boolean;
}

export const BAND_CONFIG: Record<Band, BandConfig> = {
  K: { label: "Kindergarten: helpers in Compass Corners", rules: { eachClueDecisive: true, maxClue: 60, icons: true }, charges: () => null, perMission: 2, pictures: true },
  "1-2": { label: "Grades 1–2: directions, continents, oceans and NC", rules: { eachClueDecisive: true, maxClue: 60, icons: true }, charges: () => null, perMission: 2, pictures: true },
  "3": { label: "Grade 3: NC regions and neighbors", rules: { eachClueDecisive: false, maxClue: 90, icons: false }, charges: (legs) => legs * 4 + 10, perMission: 3, pictures: false },
  "4": { label: "Grade 4: North Carolina deep dive", rules: { eachClueDecisive: false, maxClue: 110, icons: false }, charges: (legs) => legs * 4 + 9, perMission: 3, pictures: false },
  "5": { label: "Grade 5: U.S. regions, capitals and the world", rules: { eachClueDecisive: false, maxClue: 120, icons: false }, charges: (legs) => legs * 4 + 8, perMission: 3, pictures: false },
};

export function casesFor(b: Band) {
  return CASES.filter((c) => c.band === b);
}

/** Hours (compass charges) each action costs. */
export const COST = { talk: 1, travel: 2, wrongTrip: 4 } as const;

// ------------------------------------------------------------------ standards

export interface Std {
  code: string;
  skill: string;
}

/**
 * NC Social Studies codes for a clue key at a grade (forms as in the kit's social bank).
 * Codes whose objective number could not be confirmed are listed in the README.
 */
export function stdFor(grade: Grade, map: string, key: string): Std {
  const b = bandOf(grade);
  if (b === "K") return key === "map" ? { code: "K.G.1.1", skill: "Picture maps" } : { code: "K.E.1", skill: "Community helpers and places" };
  if (b === "1-2") {
    const g1 = grade === "1";
    if (key === "dir") return g1 ? { code: "1.G.1", skill: "Map directions" } : { code: "2.G.1.1", skill: "Relative location and directions" };
    if (map === "town") return g1 ? { code: "1.C&G.1.1", skill: "Community helpers" } : { code: "2.G.1.1", skill: "Places in a community" };
    if (map === "world") return g1 ? { code: "1.G.1", skill: "Maps and globes" } : { code: "2.G.1", skill: "Continents and oceans" };
    return g1 ? { code: "1.G.1.2", skill: "Map symbols" } : { code: "2.G.1.1", skill: "Places in North Carolina" };
  }
  if (b === "3") {
    if (map === "us") return { code: "3.G.1.1", skill: "NC and its neighbors" };
    if (key === "region") return { code: "3.G.1.1", skill: "NC regions" };
    if (key === "climate") return { code: "3.G.1.2", skill: "Climate" };
    return { code: "3.G.1.2", skill: "Physical characteristics" };
  }
  if (b === "4") {
    if (key === "region" || key === "landform" || key === "climate" || key === "water") return { code: "4.G.1.1", skill: "NC regions and landforms" };
    if (key === "river" || key === "lake") return { code: "4.G.1.2", skill: "NC rivers and movement" };
    if (key === "symbol" || key === "product" || key === "food") return { code: "4.E.1", skill: "NC resources and products" };
    if (key === "people") return { code: "4.H.1.1", skill: "American Indians in NC" };
    if (key === "history") return { code: "4.H.1", skill: "NC history places" };
    return { code: "4.G.1", skill: "NC landmarks" };
  }
  if (map === "world") return { code: "5.G.1.1", skill: "World places and capitals" };
  if (key === "region") return { code: "5.G.1.1", skill: "U.S. regions" };
  if (key === "capital") return { code: "5.G.1.1", skill: "States and capitals" };
  return { code: "5.G.1.1", skill: "U.S. landforms and landmarks" };
}

/** ELA codes for reading clues: RI.x.1 inference (grades 1–5), plus L.x.4 when a vocabulary clue is used (3–5). */
export function elaFor(grade: Grade, vocab: boolean): Std[] {
  const b = bandOf(grade);
  if (b === "K") return [];
  const g = Math.min(5, Number(grade));
  const out: Std[] = [{ code: `RI.${g}.1`, skill: g <= 2 ? "Key details in clues" : "Inference from clues" }];
  if (vocab && g >= 3) out.push({ code: `L.${g}.4`, skill: "Geography words in context" });
  return out;
}
