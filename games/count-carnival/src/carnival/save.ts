/*
 * Tickets and prizes, saved per browser under `arcade.count-carnival.*` (the arcade menu swaps
 * every `arcade.*` key when players switch, so each player keeps their own prize shelf).
 */
import type { BoothId } from "./items";

export const SAVE_KEY = "arcade.count-carnival.save.v1";

export interface PrizeDef {
  id: string;
  name: string;
  cost: number;
}

/** Original prizes (drawn in art.tsx). Cheapest first. */
export const PRIZES: PrizeDef[] = [
  { id: "pinwheel", name: "Pinwheel", cost: 6 },
  { id: "yoyo", name: "Yo-yo", cost: 8 },
  { id: "kite", name: "Kite", cost: 10 },
  { id: "bear", name: "Teddy bear", cost: 12 },
  { id: "fish", name: "Goldfish", cost: 14 },
  { id: "wand", name: "Star wand", cost: 16 },
  { id: "rocket", name: "Toy rocket", cost: 18 },
  { id: "dino", name: "Dino buddy", cost: 20 },
  { id: "robot", name: "Robot pal", cost: 24 },
  { id: "crown", name: "Royal crown", cost: 28 },
  { id: "horse", name: "Rocking horse", cost: 32 },
  { id: "trophy", name: "Gold trophy", cost: 40 },
];

export interface SaveData {
  tickets: number;
  prizes: string[];
  rounds: Partial<Record<BoothId, number>>;
}

export function emptySave(): SaveData {
  return { tickets: 0, prizes: [], rounds: {} };
}

export function loadSave(): SaveData {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (raw) {
      const p = JSON.parse(raw) as Partial<SaveData>;
      return {
        tickets: Math.max(0, Math.floor(Number(p.tickets) || 0)),
        prizes: Array.isArray(p.prizes) ? p.prizes.filter((x) => PRIZES.some((d) => d.id === x)) : [],
        rounds: p.rounds && typeof p.rounds === "object" ? p.rounds : {},
      };
    }
  } catch {
    // storage unavailable or corrupt
  }
  return emptySave();
}

export function writeSave(s: SaveData) {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(s));
  } catch {
    // ignore
  }
}

/** Buy a prize if affordable and not owned. Returns the new save, or null if not possible. */
export function buyPrize(s: SaveData, id: string): SaveData | null {
  const def = PRIZES.find((p) => p.id === id);
  if (!def || s.prizes.includes(id) || s.tickets < def.cost) return null;
  return { ...s, tickets: s.tickets - def.cost, prizes: [...s.prizes, id] };
}
