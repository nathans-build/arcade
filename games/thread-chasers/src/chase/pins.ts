/*
 * Chase engine: pins. Lays out up to four lettered pins on a map view so each one stays tappable
 * (pins on the same or nearby places fan out, with a leader line back to the real spot), and finds
 * the pin under a tap. Pure math: shared by the game and the tests.
 */
import { MAP_H, MAP_W, project, type View } from "./geo";
import { place, type PlaceId } from "./places";

export interface PinSpot {
  /** The true spot (map pixels). */
  ax: number;
  ay: number;
  /** Where the pin head is drawn (map pixels), pushed apart from its neighbours. */
  x: number;
  y: number;
}

/** Minimum distance between pin heads, in map pixels (about 9 mm on an iPad screen). */
export const PIN_GAP = 22;

export function layoutPins(view: View, places: PlaceId[]): PinSpot[] {
  const spots: PinSpot[] = places.map((id) => {
    const [ax, ay] = project(view, ...place(id).at);
    return { ax, ay, x: ax, y: ay };
  });
  // Same spot: start them on a small ring so the relaxation has a direction to push.
  spots.forEach((s, i) => {
    const twins = spots.filter((o, j) => j < i && Math.hypot(o.ax - s.ax, o.ay - s.ay) < 1);
    if (twins.length) {
      const a = (twins.length * Math.PI) / 2 + 0.6;
      s.x += Math.cos(a) * 6;
      s.y += Math.sin(a) * 6;
    }
  });
  for (let it = 0; it < 80; it++) {
    let moved = false;
    for (let i = 0; i < spots.length; i++)
      for (let j = i + 1; j < spots.length; j++) {
        const a = spots[i];
        const b = spots[j];
        let dx = b.x - a.x;
        let dy = b.y - a.y;
        let d = Math.hypot(dx, dy);
        if (d >= PIN_GAP) continue;
        if (d < 0.01) {
          dx = 1;
          dy = 0;
          d = 1;
        }
        const push = (PIN_GAP - d) / 2 + 0.2;
        a.x -= (dx / d) * push;
        a.y -= (dy / d) * push;
        b.x += (dx / d) * push;
        b.y += (dy / d) * push;
        moved = true;
      }
    for (const s of spots) {
      s.x = Math.max(8, Math.min(MAP_W - 8, s.x));
      s.y = Math.max(14, Math.min(MAP_H - 6, s.y));
    }
    if (!moved) break;
  }
  return spots;
}

/** Index of the pin whose head (or true spot) is nearest to a tap at map pixel (x, y), or -1. */
export function pinAt(spots: PinSpot[], x: number, y: number, radius = 14): number {
  let best = -1;
  let bd = radius;
  spots.forEach((s, i) => {
    // The head is drawn above the spot: count the head box and the stem.
    const d = Math.min(Math.hypot(s.x - x, s.y - 7 - y), Math.hypot(s.x - x, s.y - y));
    if (d < bd) {
      bd = d;
      best = i;
    }
  });
  return best;
}
