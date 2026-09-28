// Shared types for SpiderBen10's Arcade games.

export type Subject = "math" | "science" | "ela";

export type Grade = "K" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10" | "11" | "12";

export interface Question {
  /** Unique and stable, e.g. "sci-g3-07" or "m-g4-mult-1234" for generated items. */
  id: string;
  subject: Subject;
  grade: Grade;
  /**
   * NC Standard Course of Study code, e.g. "NC.3.OA.7", "RL.4.2", "PS.5.1",
   * "NC.M1.A-SSE.1" (NC Math 1), "BIO.1.1". Use the most specific code you are confident of.
   */
  standard: string;
  /** Short plain-language skill name, shown in reports (e.g. "Multiplication facts"). */
  skill: string;
  prompt: string;
  /** Exactly four choices. Author with the correct one first; decks shuffle at runtime. */
  choices: [string, string, string, string];
  /** Index (0-3) of the correct choice. */
  answer: number;
  /** One or two kid-friendly sentences that teach, shown after every answer. */
  explanation: string;
  /** Optional short reading passage (checkpoint-style questions only, never quick). */
  passage?: string;
  /**
   * Short enough to play at arcade speed: prompt ≤ 100 characters and every choice
   * ≤ 14 characters, no passage. Web Invaders and wave-style modes only use quick items.
   */
  quick?: boolean;
}

/** A question whose choices have been shuffled for display. */
export type DealtQuestion = Question;
