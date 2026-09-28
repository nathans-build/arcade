export type Subject = "math" | "science" | "ela";

export interface Question {
  id: string;
  subject: Subject;
  /** NC Standard Course of Study code (as used by WCPSS), e.g. "NC.6.RP.3", "PS.6.1", "RL.6.4". */
  standard: string;
  /** Short plain-language name for the standard, shown in the mission report. */
  skill: string;
  prompt: string;
  /** Exactly four choices. */
  choices: [string, string, string, string];
  /** Index (0-3) of the correct choice. */
  answer: number;
  explanation: string;
  /** Optional reading passage shown above the prompt (checkpoint transmissions only). */
  passage?: string;
  /**
   * Short enough to read while driving: used for "Quiz Squadron" UFO waves,
   * where the player shoots the UFO carrying the right answer.
   */
  quick?: boolean;
}
