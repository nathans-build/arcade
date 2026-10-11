import type { Band } from "./qmake";

/* The five floors of the tower: topic, look and floor master. All names are original. */

export type Topic = "ela" | "math" | "civics" | "forces" | "mixed";
export type BossId = "wordwhirl" | "abacus" | "gavel" | "momentum" | "inkmaster";

export interface FloorInfo {
  n: number;
  topic: Topic;
  hall: string;
  boss: BossId;
  bossName: string;
  /** Said when the boss arrives. */
  taunt: string;
  /** Said when the boss blocks a wrong answer. */
  block: string;
  /** Said when the boss is beaten. */
  bow: string;
  wall: string;
  wallDark: string;
  trim: string;
  floor: string;
  floorDark: string;
}

export const FLOOR_INFO: FloorInfo[] = [
  {
    n: 1, topic: "ela", hall: "WORD DOJO", boss: "wordwhirl", bossName: "MADAME WORDWHIRL",
    taunt: "My quill is mightier than your kick!", block: "Swish! Read it once more, student.", bow: "Well written! You may climb.",
    wall: "#7a2430", wallDark: "#5a1822", trim: "#ffd23f", floor: "#8a5a2b", floorDark: "#6a4220",
  },
  {
    n: 2, topic: "math", hall: "NUMBER DOJO", boss: "abacus", bossName: "ABACUS OX",
    taunt: "Count your moves, little one!", block: "Clack-clack! The beads say no.", bow: "Your math adds up. Go on!",
    wall: "#1f4a7a", wallDark: "#163a60", trim: "#6ea0ff", floor: "#7a5030", floorDark: "#5a3a22",
  },
  {
    n: 3, topic: "civics", hall: "CIVICS DOJO", boss: "gavel", bossName: "JUDGE GAVEL-FIST",
    taunt: "Order in the dojo! Know your government!", block: "Objection sustained! Study the law.", bow: "Case closed. You may pass!",
    wall: "#2d5a3a", wallDark: "#1f4229", trim: "#5fff8a", floor: "#80583a", floorDark: "#5e3f28",
  },
  {
    n: 4, topic: "forces", hall: "MOTION DOJO", boss: "momentum", bossName: "DOCTOR MOMENTUM",
    taunt: "An object at rest... is about to lose!", block: "Equal and opposite! Blocked!", bow: "Your science has force!",
    wall: "#4a2d6a", wallDark: "#361f50", trim: "#d38bff", floor: "#6e4a30", floorDark: "#503522",
  },
  {
    n: 5, topic: "mixed", hall: "MASTER'S ROOF", boss: "inkmaster", bossName: "THE GRAND INKMASTER",
    taunt: "My Ink Ninjas fell? Then face ME!", block: "Splat! My ink shield holds!", bow: "The tower is yours, Master!",
    wall: "#1a1f3a", wallDark: "#11152a", trim: "#e3262f", floor: "#5a3a24", floorDark: "#40281a",
  },
];

/** What each floor's questions are about, by grade band (shown on the title screen). */
export const TOPIC_NOTES: Record<Band, Record<Topic, string>> = {
  k2: { ela: "Rhyming & words", math: "Shapes & numbers", civics: "Rules & community helpers", forces: "Pushes & pulls", mixed: "A bit of everything" },
  g35: { ela: "Vocabulary & reading", math: "Multiplication & division", civics: "Branches, state & local government", forces: "Friction, gravity & speed", mixed: "A bit of everything" },
  g68: { ela: "Vocabulary & reading", math: "Integers & more", civics: "Constitution & Bill of Rights", forces: "Newton's laws", mixed: "A bit of everything" },
  hs: { ela: "Vocabulary & reading", math: "NC Math", civics: "How a bill becomes law; rights & duties", forces: "Physics word problems", mixed: "A bit of everything" },
};

export const TOPIC_LABEL: Record<Topic, string> = { ela: "ELA", math: "MATH", civics: "CIVICS", forces: "SCIENCE", mixed: "MIXED" };
