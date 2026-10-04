/*
 * Map math shared by the renderer, the game and the tests: lat/long → screen pixels for each
 * map, point-in-polygon, compass directions between pins, and NC region lookup.
 */
import { NC_BLUE_RIDGE, NC_FALL_LINE, type Ring } from "./outlines";
import type { MapId, Place } from "./types";

/** The part of the 320x200 screen a map is drawn into. */
export const MAP_BOX = { x: 6, y: 16, w: 308, h: 168 };

interface Frame {
  lon0: number;
  lon1: number;
  lat0: number; // top
  lat1: number; // bottom
  /** Shrink longitude by cos(refLat) so shapes keep their proportions (0 = plain equirectangular). */
  refLat: number;
}

const FRAMES: Record<Exclude<MapId, "town">, Frame> = {
  nc: { lon0: -84.5, lon1: -75.3, lat0: 36.85, lat1: 33.6, refLat: 35.3 },
  us: { lon0: -125.5, lon1: -66.3, lat0: 49.9, lat1: 24.2, refLat: 38 },
  world: { lon0: -180, lon1: 180, lat0: 84, lat1: -80, refLat: 0 },
};

/** The town map is laid out in town units: x 0–100, y 0–60 (y grows downward / south). */
const TOWN = { w: 100, h: 60 };

export interface Proj {
  /** [x, y] screen pixels for a [lat, lon] (or town [x, y]) position. */
  at(p: [number, number]): [number, number];
  /** [x, y] for a [lon, lat] outline point. */
  ll(lon: number, lat: number): [number, number];
  /** Inverse: [lon, lat] (or town [x, y]) for a screen pixel. */
  inv(x: number, y: number): [number, number];
  box: { x: number; y: number; w: number; h: number };
}

const projCache = new Map<MapId, Proj>();

export function projFor(map: MapId): Proj {
  const hit = projCache.get(map);
  if (hit) return hit;
  let proj: Proj;
  if (map === "town") {
    const s = Math.min(MAP_BOX.w / TOWN.w, MAP_BOX.h / TOWN.h);
    const w = TOWN.w * s;
    const h = TOWN.h * s;
    const x0 = MAP_BOX.x + (MAP_BOX.w - w) / 2;
    const y0 = MAP_BOX.y + (MAP_BOX.h - h) / 2;
    const f = (x: number, y: number): [number, number] => [x0 + x * s, y0 + y * s];
    proj = { at: ([x, y]) => f(x, y), ll: f, inv: (x, y) => [(x - x0) / s, (y - y0) / s], box: { x: x0, y: y0, w, h } };
  } else {
    const fr = FRAMES[map];
    const k = Math.cos((fr.refLat * Math.PI) / 180);
    const wDeg = (fr.lon1 - fr.lon0) * k;
    const hDeg = fr.lat0 - fr.lat1;
    const s = Math.min(MAP_BOX.w / wDeg, MAP_BOX.h / hDeg);
    const w = wDeg * s;
    const h = hDeg * s;
    const x0 = MAP_BOX.x + (MAP_BOX.w - w) / 2;
    const y0 = MAP_BOX.y + (MAP_BOX.h - h) / 2;
    const f = (lon: number, lat: number): [number, number] => [x0 + (lon - fr.lon0) * k * s, y0 + (fr.lat0 - lat) * s];
    const inv = (x: number, y: number): [number, number] => [fr.lon0 + (x - x0) / (k * s), fr.lat0 - (y - y0) / s];
    proj = { at: ([lat, lon]) => f(lon, lat), ll: f, inv, box: { x: x0, y: y0, w, h } };
  }
  projCache.set(map, proj);
  return proj;
}

/** Screen position of a place's pin. */
export function pinOf(p: Place): [number, number] {
  return projFor(p.map).at(p.at);
}

/** Even-odd point-in-polygon on [lon, lat] rings. */
export function inRing(lon: number, lat: number, ring: Ring): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    if (yi > lat !== yj > lat && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

export const DIRS = ["N", "E", "S", "W"] as const;
export type Dir = (typeof DIRS)[number];
export const DIR_WORD: Record<Dir, string> = { N: "north", E: "east", S: "south", W: "west" };
const DIR_ANGLE: Record<Dir, number> = { E: 0, N: 90, W: 180, S: -90 };

/** Compass angle on the map from a to b (degrees, east = 0, north = 90). */
export function bearing(a: Place, b: Place): number {
  const [ax, ay] = pinOf(a);
  const [bx, by] = pinOf(b);
  return (Math.atan2(ay - by, bx - ax) * 180) / Math.PI;
}

function angleGap(x: number, y: number): number {
  let d = Math.abs(x - y) % 360;
  if (d > 180) d = 360 - d;
  return d;
}

/**
 * Is b in direction `d` from a? "yes" within 45° of the compass point, "no" more than 60°
 * away, and "unsure" in between (the tests reject unsure distractors so no clue is a coin toss).
 */
export function dirVerdict(a: Place, b: Place, d: Dir): "yes" | "no" | "unsure" {
  const gap = angleGap(bearing(a, b), DIR_ANGLE[d]);
  if (gap <= 45) return "yes";
  if (gap > 60) return "no";
  return "unsure";
}

/** The main compass direction from a to b. */
export function mainDir(a: Place, b: Place): Dir {
  const ang = bearing(a, b);
  let best: Dir = "N";
  for (const d of DIRS) if (angleGap(ang, DIR_ANGLE[d]) < angleGap(ang, DIR_ANGLE[best])) best = d;
  return best;
}

/** Longitude of a north–south boundary line at a given latitude (clamped at its ends). */
function lineLon(line: Ring, lat: number): number {
  for (let i = 0; i + 1 < line.length; i++) {
    const [x0, y0] = line[i];
    const [x1, y1] = line[i + 1];
    if ((lat <= y0 && lat >= y1) || (lat >= y0 && lat <= y1)) return x0 + ((lat - y0) / (y1 - y0 || 1)) * (x1 - x0);
  }
  return lat > line[0][1] ? line[0][0] : line[line.length - 1][0];
}

/** NC region of a [lat, lon] point, from the Blue Ridge front and the Fall Line. */
export function ncRegionAt(lat: number, lon: number): "Mountains" | "Piedmont" | "Coastal Plain" {
  if (lon < lineLon(NC_BLUE_RIDGE, lat)) return "Mountains";
  if (lon > lineLon(NC_FALL_LINE, lat)) return "Coastal Plain";
  return "Piedmont";
}
