export type BlankType =
  | "noun" | "plural-noun" | "verb" | "verb-past" | "verb-ing" | "adjective" | "color" | "number" | "adverb"
  | "pronoun-subject" | "pronoun-object" | "preposition" | "comparative" | "superlative" | "sound" | "simile" | "vocab";

export const BLANK_TYPES: BlankType[] = [
  "noun", "plural-noun", "verb", "verb-past", "verb-ing", "adjective", "color", "number", "adverb",
  "pronoun-subject", "pronoun-object", "preposition", "comparative", "superlative", "sound", "simile", "vocab",
];

export type Band = "K-2" | "3-5" | "6-8" | "9-12";
export const BANDS: Band[] = ["K-2", "3-5", "6-8", "9-12"];

export interface Blank {
  /** Position in the prompt order (0-based). */
  index: number;
  /** Author's id (`@hero`) or an automatic one (`b3`). */
  id: string;
  type: BlankType;
  /** Noun category (animal, food…), simile topic, or vocab set id. */
  hint?: string;
  /** `+s`: show the word as a plural in the story (for K-2, who pick singular picture cards). */
  plural?: boolean;
}

export type Segment =
  | { kind: "text"; text: string }
  | { kind: "blank"; blank: number }
  | { kind: "article"; upper: boolean };

export interface Parsed {
  segments: Segment[];
  blanks: Blank[];
  errors: string[];
}

/** A character the story always has (not chosen by the player), plus which blanks change it. */
export interface CastSpec {
  /** A fixed sprite id… */
  sprite?: string;
  /** …or a noun blank id. */
  noun?: string;
  adj?: string[];
  verb?: string;
  adverb?: string;
  /** A fixed animation when no verb blank is linked. */
  anim?: string;
  count?: string;
}

export type StoryLength = "short" | "medium" | "long";

export interface Story {
  id: string;
  title: string;
  band: Band;
  /** Short (about 6-9 blanks), Medium (10-14) or Long (15-22, several paragraphs); limits per band are in length.ts. */
  length: StoryLength;
  bg: string;
  blurb: string;
  template: string;
  cast?: CastSpec[];
}
