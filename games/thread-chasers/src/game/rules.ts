/*
 * Small pure rules the engine and the tests share, so "sensitive beads have no Knot and no timer"
 * is enforced in one place and checked by npm test.
 */
import { BAND_RULES, COST } from "./bands";
import type { Band, Bead } from "./types";

/** Knot (the yarn gremlin) never appears on a sensitive bead. */
export function knotVisible(bead: Bead | null): boolean {
  return !!bead && !bead.sensitive;
}

/** Lantern hours an action costs at this bead: nothing at all on sensitive beads (no timer pressure). */
export function lanternCost(bead: Bead, action: "witness" | "deadEnd"): number {
  if (bead.sensitive) return 0;
  return COST[action];
}

/** Music pauses on sensitive beads. */
export function musicOn(bead: Bead | null): boolean {
  return !bead?.sensitive;
}

export function lanternFor(band: Band): number {
  return BAND_RULES[band].lantern;
}

export type Rank = "Page" | "Archivist" | "Curator" | "Keeper of the Loom";

/** Ranks from the plan, by how many of the grade's cases are re-woven (saved per browser). */
export function rankFor(solved: number, total: number): Rank {
  if (solved <= 0) return "Page";
  if (total > 0 && solved >= total) return "Keeper of the Loom";
  if (solved >= Math.ceil(total / 2)) return "Curator";
  if (solved >= 1) return "Archivist";
  return "Page";
}
