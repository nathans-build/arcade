import {
  QuestionDeck,
  bankFor,
  deal,
  markAdaptive,
  mathGradeFor,
  mathQuestion,
  type DealtQuestion,
  type Grade,
  type Subject,
} from "@/kit";
import { FocusCatalog, FocusDeck, validateFocus, type FocusChoice } from "./focus";

/*
 * Where Question Door and guardian questions come from:
 *   MIXED (default)  each wing's own subject: Math Wing math (generated, adaptive), Science Wing
 *                    science, Story Wing ELA, History & Maps Wing social studies (kit banks, no
 *                    passages); the Reading Room cycles through all four.
 *   one subject      every door and guardian asks that subject, or one topic of it (focus.ts).
 */

/** Which focus topics each grade offers, built from the kit's written banks. */
export const focusCatalog = new FocusCatalog(bankFor);

export const FINAL_ORDER: Subject[] = ["math", "science", "ela", "social"];

export class LibraryDecks {
  private focus: FocusDeck | null = null;
  private written: Partial<Record<Subject, QuestionDeck>> = {};
  private finalTurn = Math.floor(Math.random() * 4);

  constructor(private grade: Grade, private gameId: string, choice: FocusChoice = { subject: "mixed" }) {
    const c = validateFocus(choice, grade, focusCatalog);
    if (c.subject !== "mixed") this.focus = new FocusDeck(focusCatalog, grade, c.subject, c.topic);
  }

  /** A question for a wing whose subject is `subject` (null: the Reading Room, any subject). */
  draw(subject: Subject | null): DealtQuestion {
    if (this.focus) {
      const q = this.focus.draw(false);
      if (q.subject === "math") markAdaptive(q, this.grade);
      return deal(q);
    }
    const s = subject ?? FINAL_ORDER[this.finalTurn++ % FINAL_ORDER.length];
    if (s === "math") {
      const q = mathQuestion(mathGradeFor(this.grade));
      markAdaptive(q, this.grade);
      return deal(q);
    }
    const deck = (this.written[s] ??= new QuestionDeck(this.grade, s, { gameId: this.gameId }));
    let q = deck.draw();
    for (let i = 0; i < 16 && q.passage; i++) q = deck.draw();
    return q;
  }
}
