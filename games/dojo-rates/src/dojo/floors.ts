/*
 * The floors of Dojo Tower: Rates & Percents: each floor's scenery (walls, floor boards, the student's
 * belt, time of day). Floors 1-7 are the climb through Math 6 Unit 3; floor 8 is the bonus Copy Room
 * (7th-grade bridge); the Retry Dojo is the "redo the ones I missed" round. The floor masters and the
 * questions each floor asks live in bosses.ts. All names are original.
 */

/** How the floor's background is drawn (render.ts). */
export type SceneKind = "hall" | "roof" | "bamboo" | "lanterns" | "waterfall" | "snow" | "sky";

export interface FloorTheme {
  /** Scenery name shown on the floor banner, e.g. "SKYLINE HALL". */
  scene: string;
  kind: SceneKind;
  wall: string;
  wallDark: string;
  trim: string;
  floor: string;
  floorDark: string;
  /** The student's belt on this floor (white at the bottom, gold at the top). */
  belt: string;
}

export const THEMES: Record<string, FloorTheme> = {
  skyline: { scene: "SKYLINE HALL", kind: "hall", wall: "#7a2430", wallDark: "#5a1822", trim: "#ffd23f", floor: "#8a5a2b", floorDark: "#6a4220", belt: "#f2f4ff" },
  measure: { scene: "SAPPHIRE HALL", kind: "hall", wall: "#1f4a7a", wallDark: "#163a60", trim: "#6ea0ff", floor: "#7a5030", floorDark: "#5a3a22", belt: "#ffd23f" },
  bazaar: { scene: "JADE HALL", kind: "hall", wall: "#2d5a3a", wallDark: "#1f4229", trim: "#5fff8a", floor: "#80583a", floorDark: "#5e3f28", belt: "#ff9a3c" },
  track: { scene: "BAMBOO GARDEN", kind: "bamboo", wall: "#9fd8a0", wallDark: "#3f8a4a", trim: "#7cff6a", floor: "#b0884a", floorDark: "#8a6a36", belt: "#5fff8a" },
  hundred: { scene: "MOONLIT ROOF", kind: "roof", wall: "#1a1f3a", wallDark: "#11152a", trim: "#e3262f", floor: "#5a3a24", floorDark: "#40281a", belt: "#2456e8" },
  mall: { scene: "LANTERN HALL", kind: "lanterns", wall: "#3a1430", wallDark: "#260c20", trim: "#ffb03a", floor: "#4a2a1c", floorDark: "#341c12", belt: "#9a4cff" },
  studio: { scene: "CLOUD PEAK", kind: "sky", wall: "#7ac8ff", wallDark: "#4a9ae0", trim: "#ffd23f", floor: "#f0e2b0", floorDark: "#d0b870", belt: "#ffc21a" },
  copy: { scene: "SNOWY TEMPLE", kind: "snow", wall: "#3a4670", wallDark: "#2a3458", trim: "#cfe6ff", floor: "#e8f0ff", floorDark: "#b0c4e8", belt: "#05060f" },
  retry: { scene: "WATERFALL BRIDGE", kind: "waterfall", wall: "#5a7a8a", wallDark: "#3a5262", trim: "#9ae8ff", floor: "#8a6a3a", floorDark: "#5e4826", belt: "#e3262f" },
};
