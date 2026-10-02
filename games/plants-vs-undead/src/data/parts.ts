/*
 * The defenders are plant parts. Each one does in the game what that part really does in a
 * plant. This file holds the science-facing facts (names, part, job); gameplay numbers live in
 * src/pvu/defs.ts. The question bank (bank.ts) is keyed by these ids.
 */

export type PlantKind =
  | "sunleaf"
  | "rootknot"
  | "slinger"
  | "thorn"
  | "stem"
  | "pollen"
  | "berry"
  | "frond"
  | "stoma"
  | "chloro";

export const PLANT_KINDS: PlantKind[] = ["sunleaf", "rootknot", "slinger", "thorn", "stem", "pollen", "berry", "frond", "stoma", "chloro"];

/** 0 = K–2, 1 = 3–5, 2 = 6–8, 3 = 9–12. */
export type Band = 0 | 1 | 2 | 3;

export interface PartInfo {
  kind: PlantKind;
  /** Name on the seed card. */
  name: string;
  /** The real plant part it stands for, per band (K–2 gets the plain word). */
  part: [string, string, string, string];
  /** Short K–2 card label. */
  kid: string;
  /** What it does in the game = what the part does in a plant, per band. */
  job: [string, string, string, string];
}

export const PARTS: Record<PlantKind, PartInfo> = {
  sunleaf: {
    kind: "sunleaf",
    kid: "Leaf",
    name: "Sunleaf",
    part: ["Leaf", "Leaf", "Leaf", "Leaf (mesophyll)"],
    job: [
      "Catches sunlight to make food.",
      "Catches light for photosynthesis.",
      "Chlorophyll in its chloroplasts absorbs light.",
      "Light-dependent reactions: absorbs photons, splits water.",
    ],
  },
  rootknot: {
    kind: "rootknot",
    kid: "Roots",
    name: "Rootknot",
    part: ["Roots", "Roots", "Roots", "Roots"],
    job: [
      "Holds on tight and drinks water.",
      "Anchors the plant and absorbs water and minerals.",
      "Root hairs absorb water by osmosis; a tough anchor.",
      "Supplies the water that light reactions split (O₂ comes from H₂O).",
    ],
  },
  slinger: {
    kind: "slinger",
    kid: "Seed",
    name: "Seed Slinger",
    part: ["Seed", "Seed", "Seed", "Seed"],
    job: [
      "Throws seeds. Seeds grow new plants!",
      "Flings seeds: a seed holds a baby plant and food.",
      "Flings seeds: embryo plus stored food (cotyledons).",
      "Flings seeds full of starch, a glucose polymer.",
    ],
  },
  thorn: {
    kind: "thorn",
    kid: "Thorny stem",
    name: "Thorn Stalk",
    part: ["Stem", "Stem", "Stem", "Stem"],
    job: [
      "A strong stem with pokey thorns.",
      "A sturdy stem that holds the plant up; thorns protect it.",
      "A woody stem that blocks; thorns defend against eaters.",
      "Lignified stem: structural support and defense.",
    ],
  },
  stem: {
    kind: "stem",
    kid: "Stem pipe",
    name: "Stem Pipe",
    part: ["Stem", "Stem", "Stem (xylem + phloem)", "Vascular tissue"],
    job: [
      "Carries water like a straw. Helps plants next to it.",
      "Carries water up and food around. Boosts neighbors.",
      "Xylem moves water up, phloem moves sugar. Boosts neighbors.",
      "Xylem (cohesion-tension) and phloem (source to sink). Boosts neighbors.",
    ],
  },
  pollen: {
    kind: "pollen",
    kid: "Flower",
    name: "Pollen Puff",
    part: ["Flower", "Flower", "Flower (anther)", "Flower"],
    job: [
      "Puffs pollen. Flowers make seeds.",
      "Puffs sticky pollen clouds that slow the undead.",
      "Anthers release pollen clouds that slow the undead.",
      "Pigmented petals and pollen clouds that slow the undead.",
    ],
  },
  berry: {
    kind: "berry",
    kid: "Fruit",
    name: "Burst Berry",
    part: ["Fruit", "Fruit", "Fruit (ripe ovary)", "Fruit"],
    job: [
      "Pops and throws its seeds out!",
      "Bursts to spread its seeds (seed dispersal).",
      "A ripened ovary that bursts to disperse seeds.",
      "Stores sugars; bursts to disperse seeds.",
    ],
  },
  frond: {
    kind: "frond",
    kid: "Leaf thrower",
    name: "Frond Flinger",
    part: ["Leaf", "Leaf", "Leaf (cuticle)", "Leaf"],
    job: [
      "Throws spinning leaves.",
      "Throws spinning leaves that slice through a lane.",
      "Waxy-cuticle leaves spin through the whole lane.",
      "Leaves spin through the lane. Graphs show limiting factors.",
    ],
  },
  stoma: {
    kind: "stoma",
    kid: "Air holes",
    name: "Stoma Guard",
    part: ["Leaf (air holes)", "Stomata", "Stomata + guard cells", "Stomata"],
    job: [
      "Breathes in air for the plant.",
      "Tiny leaf openings that let carbon dioxide in.",
      "Guard cells open stomata: CO₂ in, O₂ and water vapor out.",
      "Gas exchange by diffusion: more CO₂ for the Calvin cycle.",
    ],
  },
  chloro: {
    kind: "chloro",
    kid: "Food maker",
    name: "Chloro Core",
    part: ["Green food maker", "Chloroplast", "Chloroplast", "Chloroplast"],
    job: [
      "The green part that makes food. Catches lots of light.",
      "Where photosynthesis happens. Catches lots of light.",
      "The organelle of photosynthesis. Catches lots of light.",
      "Thylakoids catch light; the stroma runs the Calvin cycle.",
    ],
  },
};

/** The photosynthesis equation, exactly as it must appear everywhere in the game. */
export const PHOTO_EQUATION = "6CO₂ + 6H₂O → C₆H₁₂O₆ + 6O₂";
/** Cellular respiration (the reverse), used as a distractor and in explanations. */
export const RESP_EQUATION = "C₆H₁₂O₆ + 6O₂ → 6CO₂ + 6H₂O";

/** The recipe line shown under the lawn, per band. */
export const RECIPE: [string, string, string, string] = [
  "Sunlight + water + air → plant food (sugar) + fresh air (oxygen)",
  "Light + water + carbon dioxide → sugar (glucose) + oxygen",
  `${PHOTO_EQUATION}  (light energy, in chloroplasts)`,
  `${PHOTO_EQUATION}  (light reactions in thylakoids → Calvin cycle in stroma)`,
];
