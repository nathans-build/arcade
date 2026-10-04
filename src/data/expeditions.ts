import type { BankItem, Expedition, ExpeditionId, LockedExpedition } from "./types";
import { WAGON_ROAD } from "./wagon-road";
import { WESTWARD } from "./westward";
import { NORTHBOUND } from "./northbound";
import { WAGON_BANK } from "./bank-wagon";
import { WESTWARD_BANK } from "./bank-westward";
import { NORTHBOUND_BANK } from "./bank-northbound";

/** v1 expeditions, in menu order (keys 1–3). */
export const EXPEDITIONS: Expedition[] = [WAGON_ROAD, WESTWARD, NORTHBOUND];

export const EXP_BY_ID: Record<ExpeditionId, Expedition> = {
  "wagon-road": WAGON_ROAD,
  westward: WESTWARD,
  northbound: NORTHBOUND,
};

export const BANK: BankItem[] = [...WAGON_BANK, ...WESTWARD_BANK, ...NORTHBOUND_BANK];

/** Shown locked on the expedition screen ("coming later"). */
export const COMING_LATER: LockedExpedition[] = [
  { title: "Race to the Dan", year: "1781", note: "Greene's retreat across North Carolina" },
  { title: "Route 66", year: "1936", note: "Dust Bowl families head west" },
  { title: "On the Bus", year: "1960–61", note: "Student reporter: sit-ins and Freedom Rides" },
  { title: "Archive missions", year: "", note: "Museum research missions, after community review" },
];
