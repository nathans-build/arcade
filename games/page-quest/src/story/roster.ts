/*
 * The fixed rosters from the Page Quest story format (PAGE_QUEST.md): scenes the engine
 * draws, characters it has sprites for, moods, genres, bands and gate anchors.
 * Pure data (no DOM), shared by the game, the Writer's Desk and the node checks.
 */

export const SCENES = [
  "library", "beach", "ship-deck", "island-jungle", "cave", "castle-hall", "forest", "village",
  "mountain-pass", "space-bridge", "space-corridor", "planet-surface", "museum-hall", "museum-vault",
  "city-street", "lab", "lighthouse", "stormy-sea", "school", "train",
] as const;
export type SceneId = (typeof SCENES)[number];

export const SCENE_LABEL: Record<SceneId, string> = {
  library: "Arcade Library",
  beach: "Beach",
  "ship-deck": "Ship deck",
  "island-jungle": "Island jungle",
  cave: "Cave",
  "castle-hall": "Castle hall",
  forest: "Forest",
  village: "Village",
  "mountain-pass": "Mountain pass",
  "space-bridge": "Starship bridge",
  "space-corridor": "Starship corridor",
  "planet-surface": "Planet surface",
  "museum-hall": "Museum hall",
  "museum-vault": "Museum vault",
  "city-street": "City street",
  lab: "Lab",
  lighthouse: "Lighthouse",
  "stormy-sea": "Stormy sea",
  school: "School",
  train: "Train",
};

export const CHARACTERS = [
  { id: "hero", name: "Hero", who: "the player (the arcade hero)" },
  { id: "quill", name: "Quill", who: "the owl librarian sidekick" },
  { id: "kid", name: "Kid", who: "a kid about the player's age" },
  { id: "captain", name: "Captain", who: "a ship captain" },
  { id: "parrot", name: "Parrot", who: "a talkative parrot" },
  { id: "robot", name: "Robot", who: "a friendly boxy robot" },
  { id: "scientist", name: "Scientist", who: "a scientist in a lab coat" },
  { id: "detective", name: "Detective", who: "a detective in a trench coat" },
  { id: "guard", name: "Guard", who: "a guard / security officer" },
  { id: "keeper", name: "Keeper", who: "an old lighthouse/museum keeper" },
  { id: "ghost", name: "Ghost", who: "a friendly-ish ghost" },
  { id: "dragon", name: "Dragon", who: "a small dragon" },
  { id: "knight", name: "Knight", who: "a knight in armor" },
  { id: "mayor", name: "Mayor", who: "a town mayor" },
  { id: "cat", name: "Cat", who: "a cat" },
  { id: "stranger", name: "Stranger", who: "a hooded mysterious figure" },
  { id: "alien", name: "Alien", who: "a friendly alien" },
] as const;
export type CharId = (typeof CHARACTERS)[number]["id"];
export const CHAR_IDS = CHARACTERS.map((c) => c.id) as CharId[];

export function charName(id: CharId): string {
  return CHARACTERS.find((c) => c.id === id)?.name ?? id;
}

/** Display name (as written in dialogue lines, e.g. "Captain") → character id. */
export function charByName(name: string): CharId | null {
  const n = name.trim().toLowerCase();
  return CHARACTERS.find((c) => c.name.toLowerCase() === n)?.id ?? null;
}

export const MOODS = ["normal", "happy", "sad", "angry", "scared", "surprised", "thinking"] as const;
export type Mood = (typeof MOODS)[number];

/**
 * Words that are not in the mood list but that writers reach for (the format's own example
 * uses `captain:worried`). They are accepted with a warning and shown as the mapped mood.
 */
export const MOOD_ALIASES: Record<string, Mood> = {
  worried: "scared",
  nervous: "scared",
  afraid: "scared",
  frightened: "scared",
  upset: "sad",
  unhappy: "sad",
  mad: "angry",
  furious: "angry",
  cross: "angry",
  shocked: "surprised",
  amazed: "surprised",
  confused: "thinking",
  curious: "thinking",
  puzzled: "thinking",
  excited: "happy",
  glad: "happy",
  proud: "happy",
  calm: "normal",
  neutral: "normal",
};

export const GENRES = ["mystery", "adventure", "space"] as const;
export type Genre = (typeof GENRES)[number];

export const BANDS = ["4-5", "6-8", "9-12"] as const;
export type Band = (typeof BANDS)[number];

export const ENDING_TYPES = ["win", "lose", "secret"] as const;
export type EndingType = (typeof ENDING_TYPES)[number];

/** Gate anchors: a standard without the grade. */
export const ANCHORS: Record<string, string> = {
  "RL.1": "Cite text evidence",
  "RL.2": "Theme & summary",
  "RL.3": "Characters, setting & plot",
  "RL.4": "Word meaning & tone",
  "RL.5": "Story structure & order",
  "RL.6": "Point of view",
  "RL.7": "Story across media",
  "RL.8": "Reasoning in a text",
  "RL.9": "Compare stories",
  "RI.1": "Cite evidence (nonfiction)",
  "RI.2": "Main idea & summary",
  "RI.3": "Events, ideas & steps",
  "RI.4": "Word meaning (nonfiction)",
  "RI.5": "Text structure",
  "RI.6": "Author's purpose & view",
  "RI.7": "Charts, maps & media",
  "RI.8": "Claims & evidence",
  "RI.9": "Compare sources",
  "L.1": "Grammar & usage",
  "L.2": "Capitals, punctuation & spelling",
  "L.3": "Word choice & style",
  "L.4": "Word meaning from clues",
  "L.5": "Figurative language",
  "L.6": "Academic vocabulary",
  "W.1": "Opinion & argument",
  "W.2": "Informative writing",
  "W.3": "Narrative writing",
  "RF.3": "Phonics & word analysis",
  "RF.4": "Reading fluency",
};

export function isAnchor(a: string): boolean {
  return a in ANCHORS;
}

export function bandOfGrade(grade: number): Band | null {
  if (grade >= 4 && grade <= 5) return "4-5";
  if (grade >= 6 && grade <= 8) return "6-8";
  if (grade >= 9 && grade <= 12) return "9-12";
  return null;
}

export const BAND_GRADES: Record<Band, [number, number]> = { "4-5": [4, 5], "6-8": [6, 8], "9-12": [9, 12] };

export const ID_RE = /^[a-z0-9-]+$/;
