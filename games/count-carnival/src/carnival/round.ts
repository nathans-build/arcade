/*
 * One booth round: 5 items. There is no way to lose: a wrong tap only adds a hint
 * (after 2 wrong taps the right answer glows), and the round ends only when every item is solved.
 */
import type { CCItem } from "./items";

export const TICKETS_FIRST_TRY = 2;
export const TICKETS_LATER = 1;
export const ROUND_BONUS = 3;

export type PickResult = "right" | "wrong" | "ignored";

export class Round {
  idx = 0;
  /** Wrong taps on the current item. */
  tries = 0;
  /** Choices already tapped wrong on the current item (they fade). */
  wrong = new Set<number>();
  solved = false;
  tickets = 0;
  firstTry = 0;
  totalWrong = 0;
  finished = false;

  constructor(readonly items: CCItem[]) {}

  get item(): CCItem {
    return this.items[Math.min(this.idx, this.items.length - 1)];
  }

  /** 0: no hint, 1: hint shown, 2: the right answer glows ("show me"). */
  get hintLevel(): 0 | 1 | 2 {
    return this.tries === 0 ? 0 : this.tries === 1 ? 1 : 2;
  }

  pick(i: number): PickResult {
    if (this.finished || this.solved || i < 0 || i > 3) return "ignored";
    if (i === this.item.answer) {
      this.solved = true;
      const earned = this.tries === 0 ? TICKETS_FIRST_TRY : TICKETS_LATER;
      if (this.tries === 0) this.firstTry++;
      this.tickets += earned;
      return "right";
    }
    if (this.wrong.has(i)) return "wrong";
    this.wrong.add(i);
    this.tries++;
    this.totalWrong++;
    return "wrong";
  }

  /** After a right answer: go to the next item. Returns true when the round is complete. */
  next(): boolean {
    if (!this.solved || this.finished) return this.finished;
    this.idx++;
    this.tries = 0;
    this.wrong = new Set();
    this.solved = false;
    if (this.idx >= this.items.length) {
      this.finished = true;
      this.tickets += ROUND_BONUS;
    }
    return this.finished;
  }
}
