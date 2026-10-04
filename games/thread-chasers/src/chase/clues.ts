/*
 * Chase engine: the witness / clue / pin model. A "leg" is everything needed to find the next stop
 * from the current one: a free plaque clue, witnesses (each costs time), wrong places and wrong eras
 * (each with the polite explanation a local gives at the dead end). The engine turns a leg into
 *  - four lettered pins (place + era), or
 *  - a split dial (pick the place, then the era) for older players.
 * Text comes in reading levels (`Lines`, keyed by level id); the game picks its level.
 * Nothing here knows about history: Clue Compass could feed it present-day geography.
 */
import type { PlaceId } from "./places";

/** Text at several reading levels, e.g. { b5: "...", b68: "...", b912: "..." }. */
export type Lines = Record<string, string | undefined>;

/** The first defined level from `order` (falls back to any defined text). */
export function lineFor(lines: Lines, order: string[]): string {
  for (const k of order) {
    const v = lines[k];
    if (v) return v;
  }
  return Object.values(lines).find((v) => !!v) ?? "";
}

export type LookId = string;

export interface Witness {
  who: string;
  look: LookId;
  /** What the clue is about: where, when, or why/how. */
  kind: "where" | "when" | "why";
  text: Lines;
}

/** A true but useless remark (grades 6-8): reading strategy is noticing it does not help. */
export interface Herring {
  who: string;
  look: LookId;
  text: string;
  note: string;
}

/** A witness who is wrong or contradicts the others (grades 9-12), with why to doubt them. */
export interface Unreliable {
  who: string;
  look: LookId;
  text: string;
  note: string;
}

export interface WrongPlace {
  place: PlaceId;
  /** place = right era, wrong place; near = a plausible neighbour; independent = it happened there too, but on its own. */
  kind: "place" | "near" | "independent";
  /** Shown era for this pin (defaults to the right era). */
  era?: string;
  year?: number;
  why: string;
}

export interface WrongEra {
  era: string;
  year: number;
  why: string;
}

export interface Leg {
  plaque: Lines;
  witnesses: Witness[];
  herring?: Herring;
  unreliable?: Unreliable;
  wrongPlaces: WrongPlace[];
  wrongEras: WrongEra[];
}

export interface Target {
  place: PlaceId;
  year: number;
  era: string;
}

export interface PinOption {
  place: PlaceId;
  era: string;
  year: number;
  correct: boolean;
  kind: "right" | "era" | WrongPlace["kind"];
  why: string;
}

export interface EraOption {
  era: string;
  year: number;
  correct: boolean;
  why: string;
}

export function shuffle<T>(arr: T[], rnd: () => number = Math.random): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Four pins: the right one, the right place in a wrong era, and two wrong places
 * (right era elsewhere, or a plausible neighbour), shuffled.
 */
export function buildPins(target: Target, leg: Leg, rnd: () => number = Math.random): PinOption[] {
  const out: PinOption[] = [{ place: target.place, era: target.era, year: target.year, correct: true, kind: "right", why: "" }];
  const e = leg.wrongEras[0];
  if (e) out.push({ place: target.place, era: e.era, year: e.year, correct: false, kind: "era", why: e.why });
  for (const w of leg.wrongPlaces) {
    if (out.length >= 4) break;
    out.push({ place: w.place, era: w.era ?? target.era, year: w.year ?? target.year, correct: false, kind: w.kind, why: w.why });
  }
  return shuffle(out, rnd);
}

/** A ready-made explanation for an extra era choice the author did not write. */
export function templateEra(target: Target, year: number, what: string): string {
  const gap = Math.abs(year - target.year);
  const span = gap >= 200 ? `about ${Math.round(gap / 100)} centuries` : gap >= 20 ? `about ${Math.round(gap / 10) * 10} years` : `${gap} years`;
  return year < target.year ? `Too early: ${what} is ${span} in the future from here.` : `Too late: ${what} happened ${span} before this.`;
}

/** The split dial: four places (right + three wrong), then four eras (right + three wrong). */
export function buildDial(target: Target, leg: Leg, what: string, rnd: () => number = Math.random) {
  const places: PinOption[] = [{ place: target.place, era: "", year: target.year, correct: true, kind: "right", why: "" }];
  for (const w of leg.wrongPlaces) {
    if (places.length >= 4) break;
    if (places.some((p) => p.place === w.place)) continue;
    places.push({ place: w.place, era: "", year: target.year, correct: false, kind: w.kind, why: w.why });
  }
  const eras: EraOption[] = [{ era: target.era, year: target.year, correct: true, why: "" }];
  for (const e of leg.wrongEras) if (eras.length < 4) eras.push({ era: e.era, year: e.year, correct: false, why: e.why });
  // Fill with centuries on either side, explained by a template.
  for (const d of [-300, 300, -600, 600, -150, 150]) {
    if (eras.length >= 4) break;
    const y = Math.round((target.year + d) / 50) * 50;
    if (eras.some((e) => Math.abs(e.year - y) < 60)) continue;
    eras.push({ era: yearLabel(y), year: y, correct: false, why: templateEra(target, y, what) });
  }
  return { places: shuffle(places, rnd), eras: shuffle(eras, rnd).sort((a, b) => a.year - b.year) };
}

/** "c. 1150", "500 BCE"... */
export function yearLabel(y: number): string {
  return y < 0 ? `${-y} BCE` : y < 1000 ? `${y} CE` : `${y}`;
}

/** "the 1100s", "the 100s BCE". */
export function centuryLabel(y: number): string {
  if (y < 0) return `the ${Math.floor(-y / 100) * 100 || ""}s BCE`.replace("the s BCE", "the 1st century BCE");
  const c = Math.floor(y / 100) * 100;
  return c === 0 ? "the 1st century CE" : `the ${c}s`;
}
