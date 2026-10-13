import type { Band } from "./qmake";

/*
 * The ten floors of the tower: each floor's scenery (walls, floor boards, the student's belt, time of
 * day) and, in MIXED, which subject its floor master asks. The floor masters themselves live in
 * bosses.ts (one roster per subject, so a single-subject run meets ten subject-themed masters).
 * All names are original.
 */

export type Topic = "ela" | "math" | "civics" | "forces" | "mixed";

/** How the floor's background is drawn (render.ts). */
export type SceneKind = "hall" | "roof" | "bamboo" | "lanterns" | "waterfall" | "snow" | "sky";

export interface FloorTheme {
  n: number;
  /** Scenery name shown on the floor banner and the title list, e.g. "BAMBOO GARDEN". */
  scene: string;
  kind: SceneKind;
  /** MIXED: the subject this floor's master asks. */
  mixedTopic: Topic;
  wall: string;
  wallDark: string;
  trim: string;
  floor: string;
  floorDark: string;
  /** The student's belt on this floor (white at the bottom, gold at the top). */
  belt: string;
}

export const FLOOR_THEMES: FloorTheme[] = [
  { n: 1, scene: "CRIMSON HALL", kind: "hall", mixedTopic: "ela", wall: "#7a2430", wallDark: "#5a1822", trim: "#ffd23f", floor: "#8a5a2b", floorDark: "#6a4220", belt: "#f2f4ff" },
  { n: 2, scene: "SAPPHIRE HALL", kind: "hall", mixedTopic: "math", wall: "#1f4a7a", wallDark: "#163a60", trim: "#6ea0ff", floor: "#7a5030", floorDark: "#5a3a22", belt: "#ffd23f" },
  { n: 3, scene: "JADE HALL", kind: "hall", mixedTopic: "civics", wall: "#2d5a3a", wallDark: "#1f4229", trim: "#5fff8a", floor: "#80583a", floorDark: "#5e3f28", belt: "#ff9a3c" },
  { n: 4, scene: "VIOLET HALL", kind: "hall", mixedTopic: "forces", wall: "#4a2d6a", wallDark: "#361f50", trim: "#d38bff", floor: "#6e4a30", floorDark: "#503522", belt: "#5fff8a" },
  { n: 5, scene: "MOONLIT ROOF", kind: "roof", mixedTopic: "mixed", wall: "#1a1f3a", wallDark: "#11152a", trim: "#e3262f", floor: "#5a3a24", floorDark: "#40281a", belt: "#2456e8" },
  { n: 6, scene: "BAMBOO GARDEN", kind: "bamboo", mixedTopic: "ela", wall: "#9fd8a0", wallDark: "#3f8a4a", trim: "#7cff6a", floor: "#b0884a", floorDark: "#8a6a36", belt: "#9a4cff" },
  { n: 7, scene: "LANTERN HALL", kind: "lanterns", mixedTopic: "math", wall: "#3a1430", wallDark: "#260c20", trim: "#ffb03a", floor: "#4a2a1c", floorDark: "#341c12", belt: "#e3262f" },
  { n: 8, scene: "WATERFALL BRIDGE", kind: "waterfall", mixedTopic: "civics", wall: "#5a7a8a", wallDark: "#3a5262", trim: "#9ae8ff", floor: "#8a6a3a", floorDark: "#5e4826", belt: "#8a5a2b" },
  { n: 9, scene: "SNOWY TEMPLE", kind: "snow", mixedTopic: "forces", wall: "#3a4670", wallDark: "#2a3458", trim: "#cfe6ff", floor: "#e8f0ff", floorDark: "#b0c4e8", belt: "#05060f" },
  { n: 10, scene: "CLOUD PEAK", kind: "sky", mixedTopic: "mixed", wall: "#7ac8ff", wallDark: "#4a9ae0", trim: "#ffd23f", floor: "#f0e2b0", floorDark: "#d0b870", belt: "#ffc21a" },
];

/** What each MIXED floor's questions are about, by grade band (shown on the title screen). */
export const TOPIC_NOTES: Record<Band, Record<Topic, string>> = {
  k2: { ela: "Rhyming & words", math: "Shapes & numbers", civics: "Rules & community helpers", forces: "Pushes & pulls", mixed: "A bit of everything" },
  g35: { ela: "Vocabulary & reading", math: "Multiplication & division", civics: "Branches, state & local government", forces: "Friction, gravity & speed", mixed: "A bit of everything" },
  g68: { ela: "Vocabulary & reading", math: "Integers & more", civics: "Constitution & Bill of Rights", forces: "Newton's laws", mixed: "A bit of everything" },
  hs: { ela: "Vocabulary & reading", math: "NC Math", civics: "How a bill becomes law; rights & duties", forces: "Physics word problems", mixed: "A bit of everything" },
};

export const TOPIC_LABEL: Record<Topic, string> = { ela: "ELA", math: "MATH", civics: "CIVICS", forces: "SCIENCE", mixed: "MIXED" };
