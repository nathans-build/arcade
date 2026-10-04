/* Thread Chasers content model: cases made of beads (moments in time and place). */
import type { Leg, Lines } from "@/chase/clues";
import type { PlaceId } from "@/chase/places";
import type { SceneId } from "./scenes";

/** Grade bands from the plan: 5 (light cases), 6-8 and 9-12. */
export type Band = "b5" | "b68" | "b912";

/** Skills the report groups by. */
export type SkillId = "chronology" | "diffusion" | "cause" | "sourcing";

export interface Bead {
  id: string;
  place: PlaceId;
  /** Sortable year (negative = BCE). Beads in a case are strictly in date order. */
  year: number;
  /** Shown date, e.g. "c. 105 CE", "1324". */
  era: string;
  title: string;
  scene: SceneId;
  /** Slavery, war, famine, plague, genocide nearby: no Knot, no lantern clock, no music. */
  sensitive?: boolean;
  bands: Band[];
  /** The fact card shown on arrival (per reading level). */
  fact: Lines;
  /** Ids in docs/sources.md (at least two). */
  sources: string[];
  /** How the previous bead's witnesses point here (absent on the first bead of a case). */
  find?: Leg;
  /** A short phrase for dead-end templates: "paper reaching Baghdad". */
  what: string;
}

export interface SourceCheck {
  id: string;
  bands: Band[];
  /** Shown at this bead, after the fact card. */
  bead: string;
  /** "Quoted" texts are public domain; "retold" ones are paraphrased. */
  kind: "quoted" | "retold";
  cite: string;
  passage: string;
  prompt: string;
  /** Correct first. */
  choices: [string, string, string, string];
  explanation: string;
}

export interface WhyItem {
  bands: Band[];
  prompt: string;
  /** Correct first. */
  choices: [string, string, string, string];
  explanation: string;
}

export interface Case {
  id: string;
  n: number;
  title: string;
  /** What moved along this thread: "paper", "gold and salt"… */
  thread: string;
  /** Grades that get this case in their list. */
  grades: string[];
  /** Wick reads this loose-thread card. */
  brief: Lines;
  color: string;
  beads: Bead[];
  sourceChecks: SourceCheck[];
  why: WhyItem[];
  /** One sentence for the Loom picture in the report. */
  woven: string;
}
