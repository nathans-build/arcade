/*
 * Game numbers for Sidewalk Stand. All prices are FICTIONAL "game numbers" in integer cents,
 * scaled per grade band so the money math fits the grade (K counts single coins, grade 1
 * stays under 50¢ an order, grade 2 stays near a dollar, older grades use dollars).
 */
import type { Grade } from "@/kit/types";

export type ItemId = "juice" | "fruit" | "snack";
export type SupplyId = "cups" | "jugs" | "ice" | "fruit" | "snacks";
export type UpgradeId = "sign" | "umbrella" | "counter" | "cooler";
export type Weather = "sunny" | "cloudy" | "rain";

export const ITEMS: ItemId[] = ["juice", "fruit", "snack"];
export const ITEM_NAME: Record<ItemId, string> = { juice: "juice", fruit: "fruit cup", snack: "snack" };
export const ITEM_PLURAL: Record<ItemId, string> = { juice: "juices", fruit: "fruit cups", snack: "snacks" };
export const ITEM_LABEL: Record<ItemId, string> = { juice: "JUICE", fruit: "FRUIT CUP", snack: "SNACK" };

/** What one serving of each menu item uses up. */
export const RECIPE: Record<ItemId, Partial<Record<SupplyId, number>>> = {
  juice: { cups: 1, jugs: 1, ice: 1 },
  fruit: { cups: 1, fruit: 1 },
  snack: { snacks: 1 },
};

export interface SupplyDef {
  id: SupplyId;
  name: string;
  pack: string;
  /** Servings in one pack. */
  per: number;
  note: string;
}
export const SUPPLIES: SupplyDef[] = [
  { id: "cups", name: "Cups", pack: "pack of 10", per: 10, note: "1 per juice or fruit cup" },
  { id: "jugs", name: "Juice", pack: "jug, 10 servings", per: 10, note: "1 serving per juice" },
  { id: "ice", name: "Ice", pack: "bag, 10 scoops", per: 10, note: "1 scoop per juice; melts overnight" },
  { id: "fruit", name: "Fruit", pack: "bag, 5 servings", per: 5, note: "1 per fruit cup; spoils overnight" },
  { id: "snacks", name: "Snacks", pack: "box of 5", per: 5, note: "1 per snack; keeps" },
];

export interface UpgradeDef {
  id: UpgradeId;
  name: string;
  what: string;
}
export const UPGRADES: UpgradeDef[] = [
  { id: "sign", name: "BRIGHT SIGN", what: "+15% more people stop by." },
  { id: "umbrella", name: "BIG UMBRELLA", what: "Rainy days are less slow; hot sunny days get +10%." },
  { id: "counter", name: "SECOND COUNTER", what: "A 4th serving lane: room for 16 customers a day, not 12." },
  { id: "cooler", name: "COOLER", what: "Ice and fruit keep overnight instead of melting or spoiling." },
];

export interface Scale {
  key: "K" | "1" | "2" | "elem" | "upper";
  /** Starting cash. */
  start: number;
  /** Cost of one pack of each supply. */
  pack: Record<SupplyId, number>;
  /** Juice price choices (the player picks one each morning). */
  priceOptions: number[];
  /** The "usual" juice price the demand model compares against. */
  ref: number;
  /** Fixed menu prices for the other items. */
  fruitPrice: number;
  snackPrice: number;
  /** Upgrade prices. */
  upgrade: Record<UpgradeId, number>;
  /** Most items in one customer's order, and the biggest bill they carry. */
  maxItems: number;
  maxBill: number;
  /** Most money in one order (K–1 keep amounts small). */
  maxOrder: number;
}

function range(lo: number, hi: number, step: number): number[] {
  const out: number[] = [];
  for (let v = lo; v <= hi; v += step) out.push(v);
  return out;
}

export const SCALES: Record<Scale["key"], Scale> = {
  K: {
    key: "K",
    start: 100,
    pack: { cups: 10, jugs: 20, ice: 5, fruit: 10, snacks: 10 },
    priceOptions: [5, 10, 25],
    ref: 10,
    fruitPrice: 10,
    snackPrice: 5,
    upgrade: { sign: 30, umbrella: 40, counter: 60, cooler: 40 },
    maxItems: 1,
    maxBill: 0,
    maxOrder: 25,
  },
  "1": {
    key: "1",
    start: 300,
    pack: { cups: 20, jugs: 60, ice: 10, fruit: 50, snacks: 30 },
    priceOptions: range(15, 45, 5),
    ref: 25,
    fruitPrice: 30,
    snackPrice: 15,
    upgrade: { sign: 80, umbrella: 100, counter: 150, cooler: 100 },
    maxItems: 2,
    maxBill: 0,
    maxOrder: 50,
  },
  "2": {
    key: "2",
    start: 800,
    pack: { cups: 50, jugs: 150, ice: 25, fruit: 125, snacks: 75 },
    priceOptions: range(30, 95, 5),
    ref: 50,
    fruitPrice: 60,
    snackPrice: 35,
    upgrade: { sign: 200, umbrella: 250, counter: 400, cooler: 250 },
    maxItems: 2,
    maxBill: 200,
    maxOrder: 195,
  },
  elem: {
    key: "elem",
    start: 2500,
    pack: { cups: 100, jugs: 400, ice: 100, fruit: 300, snacks: 250 },
    priceOptions: range(50, 300, 25),
    ref: 150,
    fruitPrice: 175,
    snackPrice: 125,
    upgrade: { sign: 600, umbrella: 800, counter: 1200, cooler: 800 },
    maxItems: 3,
    maxBill: 1000,
    maxOrder: 1000,
  },
  upper: {
    key: "upper",
    start: 4000,
    pack: { cups: 150, jugs: 500, ice: 150, fruit: 400, snacks: 300 },
    priceOptions: range(75, 400, 25),
    ref: 200,
    fruitPrice: 225,
    snackPrice: 150,
    upgrade: { sign: 800, umbrella: 1000, counter: 1600, cooler: 1000 },
    maxItems: 3,
    maxBill: 2000,
    maxOrder: 2000,
  },
};

export function gnum(g: Grade): number {
  return g === "K" ? 0 : Number(g);
}

export function scaleFor(g: Grade): Scale {
  const n = gnum(g);
  if (n === 0) return SCALES.K;
  if (n === 1) return SCALES["1"];
  if (n === 2) return SCALES["2"];
  if (n <= 5) return SCALES.elem;
  return SCALES.upper;
}

export function itemPrice(s: Scale, item: ItemId, juicePrice: number): number {
  return item === "juice" ? juicePrice : item === "fruit" ? s.fruitPrice : s.snackPrice;
}

/** Days in one game: three for K–2, four from grade 3 up. */
export function daysFor(g: Grade): number {
  return gnum(g) <= 2 ? 3 : 4;
}

// ------------------------------------------------------------- customers

export type CustKind = "kid" | "jogger" | "dogwalker" | "mail" | "grandpa" | "robot" | "artist" | "skater";
export const CUSTOMERS: { id: CustKind; name: string }[] = [
  { id: "kid", name: "Kid" },
  { id: "jogger", name: "Jogger" },
  { id: "dogwalker", name: "Dog walker" },
  { id: "mail", name: "Mail carrier" },
  { id: "grandpa", name: "Grandpa" },
  { id: "robot", name: "Robot" },
  { id: "artist", name: "Painter" },
  { id: "skater", name: "Skater" },
];
export const CUST_NAME: Record<CustKind, string> = Object.fromEntries(CUSTOMERS.map((c) => [c.id, c.name])) as Record<CustKind, string>;

/** Rush pacing by grade band (K–2 slower and more patient). */
export interface Pace {
  walk: number;
  patience: number;
  spawnEvery: number;
  slide: number;
}
export function paceFor(g: Grade): Pace {
  const n = gnum(g);
  if (n <= 2) return { walk: 17, patience: 40, spawnEvery: 3.4, slide: 110 };
  if (n <= 5) return { walk: 22, patience: 26, spawnEvery: 2.6, slide: 130 };
  if (n <= 8) return { walk: 25, patience: 20, spawnEvery: 2.2, slide: 140 };
  return { walk: 27, patience: 18, spawnEvery: 2.0, slide: 150 };
}
