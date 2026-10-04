/*
 * The demand model: how many customers come to the cart today. Simple and explainable on
 * purpose (the README and the morning screen for grades 8+ show the formula):
 *
 *   customers = round( BASE × weather × temperature × price × sign × luck ), at most the lane capacity
 *
 *   BASE        8 people (K–2) or 12 people (grades 3+)
 *   weather     sunny 1.0 · cloudy 0.75 · rain 0.4 (0.6 with the umbrella)
 *   temperature 0.6 at 50°F up to 1.5 at 95°F: 0.6 + 0.02 × (°F − 50); hot sunny days with the umbrella ×1.1
 *   price       2 − price ÷ usual price (a straight-line demand curve: the usual price gives 1, double gives 0)
 *   sign        1.15 with the bright sign, else 1
 *   luck        0.9 to 1.1, fixed by the day's seed
 *   capacity    4 customers per lane (3 lanes = 12, 4 lanes with the second counter = 16)
 *
 * It is monotonic: a higher price never brings more customers; better weather and warmer
 * temperatures never bring fewer.
 */
import { gnum, type Scale, type UpgradeId, type Weather } from "./config";
import { hashSeed, rng } from "./money";
import type { Grade } from "@/kit/types";

export interface Forecast {
  weather: Weather;
  temp: number;
  /** Day's luck factor ×1000 (900..1100), integer so the model stays exact. */
  luck: number;
}

export const WEATHER_FACTOR: Record<Weather, number> = { sunny: 1, cloudy: 0.75, rain: 0.4 };
export const WEATHER_WORD: Record<Weather, string> = { sunny: "SUNNY", cloudy: "CLOUDY", rain: "RAINY" };

export function forecastFor(seed: number, day: number): Forecast {
  const r = rng(hashSeed(seed, day, 77));
  // Day 1 is always friendly (sunny or cloudy) so a first game starts well.
  const roll = r();
  const weather: Weather = day === 1 ? (roll < 0.65 ? "sunny" : "cloudy") : roll < 0.5 ? "sunny" : roll < 0.8 ? "cloudy" : "rain";
  const base = weather === "sunny" ? 78 : weather === "cloudy" ? 68 : 60;
  const temp = base + Math.floor(r() * 15); // sunny 78–92, cloudy 68–82, rain 60–74
  const luck = 900 + Math.floor(r() * 201);
  return { weather, temp, luck };
}

export function baseFor(g: Grade): number {
  return gnum(g) <= 2 ? 8 : 12;
}

export function weatherFactor(w: Weather, ups: ReadonlySet<UpgradeId>): number {
  if (w === "rain" && ups.has("umbrella")) return 0.6;
  return WEATHER_FACTOR[w];
}

export function tempFactor(temp: number, w: Weather, ups: ReadonlySet<UpgradeId>): number {
  const t = Math.max(0.6, Math.min(1.5, 0.6 + 0.02 * (temp - 50)));
  return w === "sunny" && temp >= 85 && ups.has("umbrella") ? t * 1.1 : t;
}

export function priceFactor(price: number, ref: number): number {
  return Math.max(0, Math.min(1.8, 2 - price / ref));
}

export function capacityFor(ups: ReadonlySet<UpgradeId>): number {
  return ups.has("counter") ? 16 : 12;
}

export interface DemandParts {
  base: number;
  weather: number;
  temp: number;
  price: number;
  sign: number;
  luck: number;
  raw: number;
  capacity: number;
  customers: number;
}

export function demand(g: Grade, s: Scale, f: Forecast, price: number, ups: ReadonlySet<UpgradeId>): DemandParts {
  const base = baseFor(g);
  const weather = weatherFactor(f.weather, ups);
  const temp = tempFactor(f.temp, f.weather, ups);
  const p = priceFactor(price, s.ref);
  const sign = ups.has("sign") ? 1.15 : 1;
  const luck = f.luck / 1000;
  const raw = base * weather * temp * p * sign * luck;
  const capacity = capacityFor(ups);
  return { base, weather, temp, price: p, sign, luck, raw, capacity, customers: Math.min(capacity, Math.max(0, Math.round(raw))) };
}

/** The morning hint: expected customers at the usual price, without the hidden luck. */
export function hintRange(g: Grade, s: Scale, f: Forecast, ups: ReadonlySet<UpgradeId>): [number, number] {
  const d = demand(g, s, { ...f, luck: 1000 }, s.ref, ups);
  const lo = Math.min(d.capacity, Math.round(d.raw * 0.9));
  const hi = Math.min(d.capacity, Math.round(d.raw * 1.1));
  return [lo, Math.max(lo, hi)];
}
