import type { Grade } from "@/kit/types";
import { World } from "@/chase/logic";
import type { CaseRules } from "@/chase/logic";
import { CASES, type Band } from "./cases";
import { NC_PLACES } from "./places-nc";
import { TOWN_PLACES } from "./places-town";
import { US_PLACES } from "./places-us";
import { WORLD_PLACES } from "./places-world";
import { G6_PLACES } from "./places-g6";
import { G8_EXTRA, G8_PLACES } from "./places-g8";
import { GLOBAL_EXTRA, GLOBAL_PLACES } from "./places-global";
import type { Place } from "@/chase/types";

/** K–5 places with the grade 6–12 facts merged in (copies, so the K–5 tables stay as written). */
function withExtras(list: Place[]): Place[] {
  return list.map((p) => {
    const g = GLOBAL_EXTRA[p.id];
    const e = G8_EXTRA[p.id];
    if (!g && !e) return p;
    return { ...p, country: g?.country ?? p.country, facts: [...p.facts, ...(g?.facts ?? []), ...(e ?? [])] };
  });
}

export const ALL_PLACES = [...withExtras([...TOWN_PLACES, ...NC_PLACES, ...US_PLACES, ...WORLD_PLACES]), ...G6_PLACES, ...G8_PLACES, ...GLOBAL_PLACES];
export const WORLD = new World(ALL_PLACES);

/** Grade → band: K, 1–2, 3, 4, 5, 6, 7, 8, and one high-school band for 9–12. */
export function bandOf(g: Grade): Band {
  if (g === "K") return "K";
  if (g === "1" || g === "2") return "1-2";
  if (g === "3" || g === "4" || g === "5" || g === "6" || g === "7" || g === "8") return g;
  return "9-12";
}

/** Grades 5 and up see a small "also try Thread Chasers" (world history) note on the title. */
export function showsThreadChasers(g: Grade): boolean {
  return g !== "K" && Number(g) >= 5;
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
  "6": { label: "Grade 6: world regions, landforms and river valleys", rules: { eachClueDecisive: false, maxClue: 110, icons: false }, charges: (legs) => legs * 4 + 7, perMission: 3, pictures: false },
  "7": { label: "Grade 7: countries, capitals, languages, money and flags", rules: { eachClueDecisive: false, maxClue: 120, icons: false }, charges: (legs) => legs * 4 + 6, perMission: 3, pictures: false },
  "8": { label: "Grade 8: North Carolina and U.S. geography in depth", rules: { eachClueDecisive: false, maxClue: 120, icons: false }, charges: (legs) => legs * 4 + 6, perMission: 3, pictures: false },
  "9-12": { label: "Grades 9–12: coordinates, time zones, climate, plates and trade", rules: { eachClueDecisive: false, maxClue: 140, icons: false, unreliable: true }, charges: (legs) => legs * 4 + 7, perMission: 3, pictures: false },
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
  if (b === "5") {
    if (map === "world") return { code: "5.G.1.1", skill: "World places and capitals" };
    if (key === "region") return { code: "5.G.1.1", skill: "U.S. regions" };
    if (key === "capital") return { code: "5.G.1.1", skill: "States and capitals" };
    return { code: "5.G.1.1", skill: "U.S. landforms and landmarks" };
  }
  if (b === "6") {
    if (key === "dir8" || key === "continent" || key === "country" || key === "hemi") return { code: "6.G.1", skill: "World regions and directions" };
    if (key === "civ" || key === "nickname") return { code: "6.G.1.1", skill: "River valleys and settlement" };
    return { code: "6.G.1.2", skill: "Landforms, climate and water" };
  }
  if (b === "7") {
    if (key === "currency" || key === "export") return { code: "7.E.1", skill: "Money, resources and trade" };
    if (key === "language") return { code: "7.B.1.1", skill: "Languages and culture" };
    return { code: "7.G.1", skill: "Countries, capitals and flags" };
  }
  if (b === "8") {
    if (key === "econ" || key === "industry") return { code: "8.E.1.1", skill: "Industries and economy" };
    if (["port", "highway", "hub", "crossing", "confluence", "river", "inlet", "lake"].includes(key)) return { code: "8.G.1.1", skill: "Moving people and goods" };
    return { code: "8.G.1", skill: "Regions, places and population" };
  }
  // grades 9–12 (one band; codes from the HS courses where they honestly fit)
  if (key === "plate") return { code: "ESS.EES.2.2", skill: "Plate boundaries and hazards" };
  if (key === "clim") return { code: "ESS.EES.3", skill: "Climate zones and graphs" };
  if (key === "trade" || key === "energy") return { code: "WH.E.1", skill: "Resources and trade" };
  if (key === "pop") return { code: "WH.G.1.1", skill: "Population and urbanization" };
  return { code: "WH.G.1", skill: "Coordinates and time zones" };
}

/**
 * ELA codes for reading clues: RI.x.1 inference (grades 1–12; RI.9-10.1 / RI.11-12.1 in high
 * school), plus L.x.4 when a vocabulary clue is used (grades 3+).
 */
export function elaFor(grade: Grade, vocab: boolean): Std[] {
  const b = bandOf(grade);
  if (b === "K") return [];
  const n = Number(grade);
  const g = n >= 11 ? "11-12" : n >= 9 ? "9-10" : String(n);
  const out: Std[] = [{ code: `RI.${g}.1`, skill: n <= 2 ? "Key details in clues" : n >= 9 ? "Weighing evidence in clues" : "Inference from clues" }];
  if (vocab && n >= 3) out.push({ code: `L.${g}.4`, skill: "Geography words in context" });
  return out;
}
