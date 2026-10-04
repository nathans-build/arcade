/* Every string drawn on the canvas with the bitmap font (checked for glyphs by npm test). */
import { EXPEDITIONS } from "@/data/expeditions";
import { dateOf } from "@/sim/sim";
import { GUIDE_LINES } from "./guide";
import { wrap } from "./screen";

export function CANVAS_STRINGS(): string[] {
  const out: string[] = ["TRAIL LEDGER", "A US HISTORY JOURNEY", "MUSEUM GUIDE", "GENERAL STORE", "ARRIVED", "PAUSED", "RETRY THE LEG FROM THE CHECKPOINT", "MILE 1234/5678"];
  for (const l of Object.values(GUIDE_LINES)) out.push(...wrap(l, 210));
  for (const e of EXPEDITIONS) {
    out.push(`${e.title.toUpperCase()} · ${e.year}`, e.lateLabel, `${e.units.food.toUpperCase()}`);
    out.push(...wrap(e.guide.intro, 210), ...wrap(e.guide.outro, 210));
    for (let d = 0; d < 400; d += 13) out.push(dateOf(e, d).label.toUpperCase());
    for (const l of e.landmarks) out.push(l.name.toUpperCase(), l.place.split(" · ")[0]);
  }
  return out;
}
