/*
 * Chase engine: geography. Pure data + math, no DOM, so the game, the content tests and a sister
 * game (Clue Compass) can share it.
 *  - LAND: Natural Earth land rings (lon/lat), decoded from worldData.ts
 *  - views: a rectangle of the world drawn into the 288x120 map area (whole world, or a zoomed inset)
 *  - fitView(): the smallest view that keeps a set of points apart enough to tap
 *  - onLand()/nearCoast(): used by the tests ("pins on land, or on the coast for ports")
 */
import { LAND_RINGS } from "./worldData";

export type LonLat = [number, number];

/** Map area on the 320x200 screen. */
export const MAP_W = 288;
export const MAP_H = 120;

function decode(s: string): LonLat[] {
  const n = s.split(",").map(Number);
  const out: LonLat[] = [];
  let x = 0;
  let y = 0;
  for (let i = 0; i + 1 < n.length; i += 2) {
    x += n[i];
    y += n[i + 1];
    out.push([x / 10, y / 10]);
  }
  return out;
}

export const LAND: LonLat[][] = LAND_RINGS.map(decode);

const BOXES = LAND.map((r) => {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const [x, y] of r) {
    x0 = Math.min(x0, x); x1 = Math.max(x1, x);
    y0 = Math.min(y0, y); y1 = Math.max(y1, y);
  }
  return [x0, y0, x1, y1] as const;
});

function inRing(r: LonLat[], lon: number, lat: number): boolean {
  let inside = false;
  for (let i = 0, j = r.length - 1; i < r.length; j = i++) {
    const [xi, yi] = r[i];
    const [xj, yj] = r[j];
    if (yi > lat !== yj > lat && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

/** True when the point is on land (even-odd over all rings, so lakes cut out of land count as water). */
export function onLand(lon: number, lat: number): boolean {
  let inside = false;
  LAND.forEach((r, i) => {
    const [x0, y0, x1, y1] = BOXES[i];
    if (lon < x0 || lon > x1 || lat < y0 || lat > y1) return;
    if (inRing(r, lon, lat)) inside = !inside;
  });
  return inside;
}

/** True when land lies within `deg` degrees (a port or island town counts as "on the coast"). */
export function nearCoast(lon: number, lat: number, deg = 0.6): boolean {
  for (let a = 0; a < 16; a++) {
    for (const d of [deg / 3, (2 * deg) / 3, deg]) {
      const t = (a / 16) * Math.PI * 2;
      if (onLand(lon + Math.cos(t) * d, lat + Math.sin(t) * d)) return true;
    }
  }
  return onLand(lon, lat);
}

/** A rectangle of the world: top-left corner and degrees per map pixel (same in x and y). */
export interface View {
  id: string;
  lon0: number;
  lat0: number;
  dpp: number;
}

export const WORLD_VIEW: View = { id: "world", lon0: -180, lat0: 82, dpp: 360 / MAP_W };

/** Named insets from the plan: the Mediterranean and Arabia / the Indian Ocean (and a few more). */
export const INSETS: View[] = [
  { id: "britain", lon0: -12, lat0: 58, dpp: 20 / MAP_W },
  { id: "europe", lon0: -14, lat0: 58, dpp: 40 / MAP_W },
  { id: "med", lon0: -14, lat0: 52, dpp: 60 / MAP_W },
  { id: "sahara", lon0: -24, lat0: 36, dpp: 64 / MAP_W },
  { id: "nafr", lon0: -22, lat0: 42, dpp: 70 / MAP_W },
  { id: "ind", lon0: 26, lat0: 34, dpp: 110 / MAP_W },
  { id: "silk", lon0: -2, lat0: 60, dpp: 130 / MAP_W },
  { id: "atl", lon0: -106, lat0: 62, dpp: 120 / MAP_W },
];

export function project(v: View, lon: number, lat: number): [number, number] {
  return [(lon - v.lon0) / v.dpp, (v.lat0 - lat) / v.dpp];
}

export function unproject(v: View, x: number, y: number): LonLat {
  return [v.lon0 + x * v.dpp, v.lat0 - y * v.dpp];
}

export function contains(v: View, lon: number, lat: number, margin = 6): boolean {
  const [x, y] = project(v, lon, lat);
  return x >= margin && x <= MAP_W - margin && y >= margin + 4 && y <= MAP_H - margin;
}

function minGap(v: View, pts: LonLat[]): number {
  let g = Infinity;
  const ps = pts.map(([a, b]) => project(v, a, b));
  for (let i = 0; i < ps.length; i++)
    for (let j = i + 1; j < ps.length; j++) {
      const d = Math.hypot(ps[i][0] - ps[j][0], ps[i][1] - ps[j][1]);
      if (d > 0.01) g = Math.min(g, d);
    }
  return g;
}

/**
 * Picks the view for a set of points: the world map when the points are already far enough apart
 * to tap, otherwise the most zoomed-in inset that contains them all (falling back to a view fitted
 * around them). Identical places are allowed (they are fanned out by the pin layout).
 */
export function fitView(pts: LonLat[], want = 18): View {
  if (minGap(WORLD_VIEW, pts) >= want) return WORLD_VIEW;
  // A box around the points, keeping the 288:120 shape.
  const lons = pts.map((p) => p[0]);
  const lats = pts.map((p) => p[1]);
  const cx = (Math.min(...lons) + Math.max(...lons)) / 2;
  const cy = (Math.min(...lats) + Math.max(...lats)) / 2;
  const span = Math.max(40, (Math.max(...lons) - Math.min(...lons)) * 1.3, (Math.max(...lats) - Math.min(...lats)) * 1.4 * (MAP_W / MAP_H));
  if (span >= 300) return WORLD_VIEW;
  const dpp = span / MAP_W;
  // A named inset (Mediterranean, Indian Ocean...) when it frames the points about as well.
  const centre = (v: View): LonLat => [v.lon0 + (MAP_W * v.dpp) / 2, v.lat0 - (MAP_H * v.dpp) / 2];
  const named = INSETS.filter((v) => pts.every(([a, b]) => contains(v, a, b)))
    .filter((v) => v.dpp <= dpp * 1.6 && Math.abs(centre(v)[0] - cx) < span / 4 && Math.abs(centre(v)[1] - cy) < (span / 4) * (MAP_H / MAP_W) * 2)
    .sort((a, b) => a.dpp - b.dpp);
  if (named.length) return named[0];
  const lon0 = Math.max(-180, Math.min(180 - span, cx - span / 2));
  return { id: `fit:${lon0.toFixed(1)},${cy.toFixed(1)},${dpp.toFixed(3)}`, lon0, lat0: Math.min(84, cy + (MAP_H * dpp) / 2), dpp };
}

/** Great-circle distance in km (used by tests to check "plausible neighbour" pins really are near). */
export function km(a: LonLat, b: LonLat): number {
  const R = 6371;
  const toR = Math.PI / 180;
  const dLat = (b[1] - a[1]) * toR;
  const dLon = (b[0] - a[0]) * toR;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a[1] * toR) * Math.cos(b[1] * toR) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
