/* The typed model of a `.story` file (see PAGE_QUEST.md). Pure data. */
import type { CharId } from "./roster";

export interface Issue {
  level: "error" | "warning";
  /** 1-based line in the .story text (0 = whole file). */
  line: number;
  message: string;
  page?: string;
}

export interface CastMember {
  /** As written (validated against CHARACTERS). */
  id: string;
  /** As written, lower case ("normal" when omitted). May be an alias like "worried". */
  mood: string;
}

export type Block =
  | { kind: "para"; text: string }
  /** A chapter heading line: "~ Chapter Two ~". */
  | { kind: "heading"; text: string }
  | { kind: "say"; who: CharId; text: string };

export interface Choice {
  text: string;
  target: string;
  line: number;
}

export interface GateAnswer {
  text: string;
  correct: boolean;
  line: number;
}

export interface Gate {
  kind: "mc" | "order";
  /** Standard without the grade, e.g. "RL.3". */
  anchor: string;
  question: string;
  /** Multiple choice answers (kind "mc"). */
  answers: GateAnswer[];
  /** Order items in the correct order (kind "order"). */
  items: { text: string; line: number }[];
  hint: string;
  next: string;
  line: number;
  hintLine: number;
  nextLine: number;
}

export interface Ending {
  type: string;
  name: string;
  line: number;
}

export interface Page {
  id: string;
  line: number;
  scene: string;
  cast: CastMember[];
  checkpoint: boolean;
  clues: string[];
  blocks: Block[];
  choices: Choice[];
  gate: Gate | null;
  end: Ending | null;
}

export interface StoryHeader {
  title: string;
  author: string;
  genre: string;
  band: string;
  cover: string;
  blurb: string;
  start: string;
}

export const HEADER_KEYS: (keyof StoryHeader)[] = ["title", "author", "genre", "band", "cover", "blurb", "start"];

export interface Story extends StoryHeader {
  pages: Page[];
  /** Line of each header field (0 when missing). */
  headerLines: Partial<Record<keyof StoryHeader, number>>;
}
