/*
 * Splash Arc physics: a water balloon in uniform gravity plus a steady sideways wind push,
 * no air drag. Everything is worked in screen pixels with a fixed scale of S pixels per metre,
 * so g = 9.8 m/s² becomes 9.8 × S px/s². The balloon is stepped with a FIXED time step using the
 * exact constant-acceleration update (x += v·dt + ½·a·dt²), so the simulated points lie exactly
 * on the true parabola x(t), y(t). The on-screen guide arc and the real flight both come from
 * `simulate`, so the guide always matches the throw.
 */

/** Pixels per metre. */
export const S = 1.6;
/** Fixed simulation step (seconds). */
export const DT = 1 / 120;
/** Balloon radius in pixels (used for hits). */
export const BALLOON_R = 1.5;

export type PlanetId = "earth" | "mars" | "moon";
export interface Planet {
  id: PlanetId;
  name: string;
  /** Gravity, m/s². */
  g: number;
  /** Launch speed (m/s) per power point: v = power × step. */
  step: number;
}
export const PLANETS: Record<PlanetId, Planet> = {
  earth: { id: "earth", name: "EARTH", g: 9.8, step: 0.5 },
  mars: { id: "mars", name: "MARS", g: 3.7, step: 0.3 },
  moon: { id: "moon", name: "MOON", g: 1.6, step: 0.2 },
};

export const MIN_ANGLE = 5;
export const MAX_ANGLE = 175;
export const MIN_POWER = 5;
export const MAX_POWER = 100;

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface World {
  width: number;
  groundY: number;
  /** Solid terrain: buildings, hills, walls (terrain never breaks). */
  rects: Rect[];
  /** Target hit boxes; `null` for targets already watered (the balloon passes them). */
  targets: (Rect | null)[];
}

export interface Shot {
  x0: number;
  y0: number;
  /** Degrees above the ground, measured from the right (0 = flat right, 90 = straight up). */
  angle: number;
  power: number;
  planet: PlanetId;
  /** Wind as a sideways acceleration in m/s² (positive pushes right). */
  wind: number;
}

export type EndKind = "target" | "ground" | "wall" | "out";
export interface SimEnd {
  kind: EndKind;
  x: number;
  y: number;
  t: number;
  target?: number;
}
export interface SimResult {
  /** One point per time step (when recorded). */
  pts: [number, number][];
  end: SimEnd;
}

export function speedOf(power: number, planet: PlanetId): number {
  return power * PLANETS[planet].step;
}

/** Launch speed shown to players, e.g. "24.8". */
export function speedText(power: number, planet: PlanetId): string {
  return String(Math.round(speedOf(power, planet) * 100) / 100);
}

/** Exact position after time t (px), from the closed-form motion; used by tests. */
export function exactPos(shot: Shot, t: number): [number, number] {
  const p = PLANETS[shot.planet];
  const v = speedOf(shot.power, shot.planet) * S;
  const a = (shot.angle * Math.PI) / 180;
  const ax = shot.wind * S;
  const ay = p.g * S;
  return [shot.x0 + v * Math.cos(a) * t + 0.5 * ax * t * t, shot.y0 - v * Math.sin(a) * t + 0.5 * ay * t * t];
}

function inside(r: Rect, x: number, y: number, pad = 0): boolean {
  return x >= r.x - pad && x <= r.x + r.w + pad && y >= r.y - pad && y <= r.y + r.h + pad;
}

/**
 * Throws one balloon. With `record` false no points are kept (fast, for the solver).
 * `maxT` caps the flight in seconds.
 */
export function simulate(world: World, shot: Shot, opts: { record?: boolean; maxT?: number } = {}): SimResult {
  const record = opts.record !== false;
  const maxT = opts.maxT ?? 40;
  const p = PLANETS[shot.planet];
  const v = speedOf(shot.power, shot.planet) * S;
  const a = (shot.angle * Math.PI) / 180;
  let vx = v * Math.cos(a);
  let vy = -v * Math.sin(a);
  const ax = shot.wind * S;
  const ay = p.g * S;
  let x = shot.x0;
  let y = shot.y0;
  const pts: [number, number][] = record ? [[x, y]] : [];
  const hdt = 0.5 * DT * DT;
  const steps = Math.ceil(maxT / DT);
  // Nothing to hit above the highest roof or target: skip the checks up there.
  let top = world.groundY;
  for (const r of world.rects) top = Math.min(top, r.y);
  for (const r of world.targets) if (r) top = Math.min(top, r.y - BALLOON_R);
  for (let i = 1; i <= steps; i++) {
    const px = x;
    const py = y;
    x += vx * DT + ax * hdt;
    y += vy * DT + ay * hdt;
    vx += ax * DT;
    vy += ay * DT;
    const t = i * DT;
    if (y < top) {
      if (record) pts.push([x, y]);
      if (x < -12 || x > world.width + 12) return { pts, end: { kind: "out", x, y, t } };
      continue;
    }
    // Targets first: a balloon touching a target waters it.
    for (let k = 0; k < world.targets.length; k++) {
      const r = world.targets[k];
      if (r && inside(r, x, y, BALLOON_R)) {
        if (record) pts.push([x, y]);
        return { pts, end: { kind: "target", x, y, t, target: k } };
      }
    }
    if (y >= world.groundY) {
      // Land exactly on the ground line (linear interpolation inside the last step).
      const f = (world.groundY - py) / (y - py || 1);
      const gx = px + (x - px) * f;
      if (record) pts.push([gx, world.groundY]);
      return { pts, end: { kind: "ground", x: gx, y: world.groundY, t: t - DT + DT * f } };
    }
    for (const r of world.rects) {
      if (inside(r, x, y)) {
        if (record) pts.push([x, y]);
        return { pts, end: { kind: "wall", x, y, t } };
      }
    }
    if (record) pts.push([x, y]);
    if (x < -12 || x > world.width + 12) return { pts, end: { kind: "out", x, y, t } };
  }
  return { pts, end: { kind: "out", x, y, t: maxT } };
}

/** Ideal range on flat ground (launch and landing at the same height), in metres. */
export function rangeFormula(speed: number, angleDeg: number, g: number): number {
  return (speed * speed * Math.sin((2 * angleDeg * Math.PI) / 180)) / g;
}

/** Height (m, up) of the projectile when it is `x` metres across, no wind: y = x·tanθ − g·x² / (2v²cos²θ). */
export function heightAt(x: number, speed: number, angleDeg: number, g: number): number {
  const a = (angleDeg * Math.PI) / 180;
  const c = Math.cos(a);
  return x * Math.tan(a) - (g * x * x) / (2 * speed * speed * c * c);
}

/**
 * Every (angle, power) pair with whole numbers that hits each target.
 * Returns, per target index, a map angle → powers that hit it.
 */
export function solveAll(world: World, base: Omit<Shot, "angle" | "power">, angles: [number, number] = [10, 85]): Map<number, number[]>[] {
  const out = world.targets.map(() => new Map<number, number[]>());
  for (let ang = angles[0]; ang <= angles[1]; ang++) {
    for (let pw = 15; pw <= MAX_POWER; pw++) {
      const r = simulate(world, { ...base, angle: ang, power: pw }, { record: false, maxT: 30 });
      if (r.end.kind === "target" && r.end.target !== undefined) {
        const m = out[r.end.target];
        const list = m.get(ang);
        if (list) list.push(pw);
        else m.set(ang, [pw]);
      }
    }
  }
  return out;
}

/** The middle of the longest run of hitting powers: the safest choice for a given angle. */
export function bestPower(powers: number[]): number {
  let best: [number, number] = [0, 0];
  let start = 0;
  for (let i = 1; i <= powers.length; i++) {
    if (i === powers.length || powers[i] !== powers[i - 1] + 1) {
      if (i - start > best[1] - best[0]) best = [start, i];
      start = i;
    }
  }
  return powers[best[0] + Math.floor((best[1] - best[0] - 1) / 2)];
}

/** Length of the longest run of consecutive hitting powers. */
export function runLength(powers: number[]): number {
  let best = 0;
  let cur = 0;
  for (let i = 0; i < powers.length; i++) {
    cur = i > 0 && powers[i] === powers[i - 1] + 1 ? cur + 1 : 1;
    best = Math.max(best, cur);
  }
  return best;
}
