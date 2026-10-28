/*
 * Shared types for the Math 6 · Unit 3 (unit rates and percentages) question generators.
 * Skill tags are the exact 18 names from docs/math6-unit3.md section 5.
 */

export const SKILL_TAGS = [
  "Estimating with rates",
  "Choosing sensible units",
  "Converting units",
  "Comparing speeds and prices",
  "Two unit rates from one ratio",
  "Same rate? (equivalent ratios)",
  "Speed vs. pace",
  "Multi-step rate problems",
  "Percent as a rate per 100",
  "Percents on double number lines",
  "Percents with tape diagrams",
  "Benchmark percents",
  "Percent of a number (find the part)",
  "Find the whole",
  "Find the percent",
  "Discounts, tax, and tips (two-step)",
  "Multi-step project (Painting a Room)",
  "Bridge: scale factors",
] as const;
export type SkillTag = (typeof SKILL_TAGS)[number];

/**
 * NC standard for each tag (NC.6.RP.2 unit rate; NC.6.RP.3 ratio tables, unit-rate problems,
 * percent and unit conversion). The scale-factor bridge is 7th-grade work (scale drawings).
 */
export const TAG_CODE: Record<SkillTag, string> = {
  "Estimating with rates": "NC.6.RP.3",
  "Choosing sensible units": "NC.6.RP.3",
  "Converting units": "NC.6.RP.3",
  "Comparing speeds and prices": "NC.6.RP.3",
  "Two unit rates from one ratio": "NC.6.RP.2",
  "Same rate? (equivalent ratios)": "NC.6.RP.2",
  "Speed vs. pace": "NC.6.RP.3",
  "Multi-step rate problems": "NC.6.RP.3",
  "Percent as a rate per 100": "NC.6.RP.3",
  "Percents on double number lines": "NC.6.RP.3",
  "Percents with tape diagrams": "NC.6.RP.3",
  "Benchmark percents": "NC.6.RP.3",
  "Percent of a number (find the part)": "NC.6.RP.3",
  "Find the whole": "NC.6.RP.3",
  "Find the percent": "NC.6.RP.3",
  "Discounts, tax, and tips (two-step)": "NC.6.RP.3",
  "Multi-step project (Painting a Room)": "NC.6.RP.3",
  "Bridge: scale factors": "NC.7.G.1 (7th-grade bridge)",
};

export interface Choice {
  text: string;
  correct: boolean;
  /** For a wrong choice: Quill's feedback that names the mistake. */
  why: string;
}

/** A picture of the problem, like the textbook's: double number line, tape diagram or ratio table. "?" marks the unknown. */
export type Model =
  | { kind: "dnl"; rows: [{ label: string; ticks: string[] }, { label: string; ticks: string[] }] }
  | { kind: "tape"; parts: number; shaded: number; shadedLabel: string; totalLabel: string; partLabel?: string }
  | { kind: "table"; headers: [string, string]; rows: [string, string][] };

export interface MathQ {
  gen: string;
  tag: SkillTag;
  code: string;
  prompt: string;
  /** Exactly 4 unique choices; the correct one is first (the game shuffles them). */
  choices: Choice[];
  answer: string;
  /** Quill's nudge, then a worked step. Never the answer itself. */
  hints: [string, string];
  /** How many steps the problem needs (1 = one step). Only the final answer is accepted. */
  steps: number;
  model?: Model;
  /** The raw numbers, so tests can recompute the answer independently. */
  facts: Record<string, number | string>;
  /** The answer as a number (cents for money) or a key for "which one?" items. */
  value: number | string;
  /** The answer's unit ("cents", "minutes", "key"...). */
  unit: string;
  /** Conversions: to a smaller unit (down, multiply) or a bigger unit (up, divide). */
  dir?: "up" | "down";
  /** The answer had to be rounded to the cent / rounded up. */
  rounding?: boolean;
  /** Short label for the "work so far" list in a chain. */
  label?: string;
}

/** A multi-step story problem: ask for the final answer first; on a miss, walk through the steps. */
export interface ChainQ {
  gen: string;
  tag: SkillTag;
  code: string;
  /** The problem as told in the story (stays on screen during the steps). */
  setup: string;
  final: MathQ;
  /** Each step is its own question with its own skill tag; the last one asks the final answer again. */
  steps: MathQ[];
  /** Clue for the journal when the final answer is right on the first try. */
  clue: string;
  facts: Record<string, number | string>;
}

export type Params = Record<string, string>;
