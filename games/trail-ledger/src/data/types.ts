/*
 * Trail Ledger data model. One data-driven simulation (src/sim) is fed by an era file per
 * expedition (src/data/<era>.ts) plus an era question bank (src/data/bank-<era>.ts).
 *
 * Bands: 0 = grade 5, 1 = grades 6–8, 2 = grades 9–12. K–4 never reach a band (gate screen).
 * Money is always stored in cents so arithmetic stays exact.
 */

export type Band = 0 | 1 | 2;
export type ExpeditionId = "wagon-road" | "westward" | "northbound";

/** Things a choice, an answer or a stop can change. Money in cents. */
export interface Effect {
  days?: number;
  food?: number;
  money?: number;
  parts?: number;
  morale?: number;
  trade?: number;
  miles?: number;
}

export interface Needs {
  money?: number;
  trade?: number;
  parts?: number;
  food?: number;
}

export interface Choice {
  /** Shown on the button (≤ 64 characters). */
  label: string;
  effect: Effect;
  /** What happened, shown after the choice (one or two sentences). */
  outcome: string;
  /** The choice is disabled when the party lacks these. */
  needs?: Needs;
  /** Only offered from this band up (default 0). */
  minBand?: Band;
  /**
   * Grades 9–12 only: a consequence that arrives some days later ("decisions whose
   * consequences come later"). Younger bands never see it.
   */
  later?: { days: number; effect: Effect; text: string };
}

export interface EventCard {
  id: string;
  /** Legs (0-based) where the card may be drawn. */
  legs: number[];
  /** Only drawn from this band up (default 0). */
  minBand?: Band;
  title: string;
  /** 25–75 words, plain and non-graphic. */
  text: string;
  /** URL or bibliographic citation. Required (tests fail without it). */
  source: string;
  choices: Choice[];
}

/** A short reading at a landmark, written for one band. */
export interface Passage {
  text: string;
  /**
   * A primary-source excerpt. `status: "public domain"` must quote a work published before 1929
   * (or a US government work); anything else is paraphrased and labeled "retold".
   */
  excerpt?: { quote: string; cite: string; status: "public domain" | "retold" };
  /** Glosses for old or hard words in the excerpt (grades 6–12). */
  gloss?: [string, string][];
}

export type SceneId =
  | "bethlehem" | "susquehanna" | "potomac" | "augusta" | "dan" | "bethabara"
  | "independence" | "laramie" | "indrock" | "forthall" | "dalles" | "willamette"
  | "durham" | "richmond" | "washington" | "baltimore" | "philadelphia" | "newyork"
  | "museum";

export interface Landmark {
  id: string;
  name: string;
  /** Short line under the name, e.g. "Pennsylvania · Moravian town". */
  place: string;
  /** Miles from the start (rounded, "about"). */
  mile: number;
  scene: SceneId;
  source: string;
  /** Passages for band 0, 1, 2. */
  read: [Passage, Passage, Passage];
  /** The journey may end here (the player chooses to settle or go on). */
  canEnd?: boolean;
  /** Days spent at the stop (finding a room, changing trains). Default 0. */
  stay?: number;
}

export type Terrain = "farms" | "forest" | "valley" | "hills" | "plains" | "desert" | "mountains" | "river" | "rail" | "city";

export interface Leg {
  miles: number;
  /** Miles per day at the normal pace. */
  mpd: number;
  terrain: Terrain;
  /** A fixed cost paid on leaving the landmark before this leg (fare, ferry, toll). */
  cost?: { money: number; label: string; source?: string };
}

export interface StoreItem {
  id: string;
  name: string;
  /** e.g. "100 lb sack". */
  unit: string;
  /** Cents per unit. */
  price: number;
  /** Pounds per unit (weight limit, grades 9–12). */
  weight: number;
  gives: Effect;
  /** Default quantity per band (the "always pick A" basket). */
  rec: [number, number, number];
  max: number;
  minBand?: Band;
  /** Set only when the price comes from a source; otherwise the store says "game numbers". */
  priceSource?: string;
}

export interface Pace {
  id: string;
  label: string;
  note: string;
  speed: number;
  /** Morale per day (grades 6–12). */
  morale: number;
  /** Wear per day; every whole point uses one spare part (grades 6–12). */
  wear: number;
}

export interface Ration {
  id: string;
  label: string;
  /** Food units per person per day. */
  perPerson: number;
  morale: number;
}

export interface Transmission {
  /** "LETTER FROM BETHLEHEM", "WIRE FROM PHILADELPHIA" … */
  kind: string;
  from: string;
  text: string;
}

export interface Expedition {
  id: ExpeditionId;
  title: string;
  year: number;
  route: string;
  role: string;
  /** Grades flagged YOUR LEVEL. */
  recommended: [number, number];
  /** ISO date of departure. */
  start: string;
  /** Days the real journey took (for the report's "historical pace"). */
  historicalDays: number;
  historicalNote: string;
  /** Last day (from 0) before the expedition is "wintered", per band. */
  deadline: [number, number, number];
  lateLabel: string;
  lateText: string;
  party: number;
  partyLabel: string;
  mode: "wagon" | "rail";
  units: { food: string; parts: string; trade: string; money: string };
  startRes: { food: number; money: number; parts: number; morale: number; trade: number };
  /** Outfit budget in cents per band. */
  budget: [number, number, number];
  /** Wagon load limit in lb (grades 9–12). */
  weightLimit: number;
  store: StoreItem[];
  paces: Pace[];
  rations: Ration[];
  /** When food runs out and there is money: stop to buy or trade for food (costs days and money). */
  resupply: { label: string; days: number; money: number; food: number; text: string; source: string };
  /** Stop to work or trade: costs days, gives money and/or food. */
  work: { label: string; days: number; money: number; food: number; text: string; source: string };
  landmarks: Landmark[];
  legs: Leg[];
  events: EventCard[];
  /** One per leg, shown on arrival at the landmark that ends the leg. */
  transmissions: Transmission[];
  /** Museum guide lines (the arcade hero, never inside the era). */
  guide: { intro: string; outro: string };
  /** Era chiptune motif: [Hz, beats] pairs. */
  motif: [number, number][];
  /** Words that make a kit social question "on topic" for this expedition (grades 5, 8, 11). */
  topic: RegExp;
}

/** One era-bank question. Authored with the correct choice first (answer 0). */
export interface BankItem {
  id: string;
  exp: ExpeditionId;
  band: Band;
  /** Asked at this landmark; general items are used for transmissions. */
  landmark?: string;
  /** NC code as authored: 5.* for band 0, 8.* for band 1, AH.* for band 2. */
  code: string;
  skill: string;
  prompt: string;
  choices: [string, string, string, string];
  answer: 0;
  explanation: string;
  passage?: string;
  quick?: boolean;
}

export interface LockedExpedition {
  title: string;
  year: string;
  note: string;
}
