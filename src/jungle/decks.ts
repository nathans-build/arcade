import type { Grade } from "@/kit";
import { mapChallengesFor, type MapChallenge } from "./data/maps";
import { timelinesFor, type TimelineSet } from "./data/timelines";

/** Deals items in a shuffled order, reshuffling when the pile runs out (no back-to-back repeat). */
export class Rotation<T> {
  private pile: T[] = [];
  private last: T | null = null;
  constructor(private items: T[], private rnd: () => number = Math.random) {
    if (items.length === 0) throw new Error("empty rotation");
  }
  next(): T {
    if (this.pile.length === 0) {
      this.pile = [...this.items];
      for (let i = this.pile.length - 1; i > 0; i--) {
        const j = Math.floor(this.rnd() * (i + 1));
        [this.pile[i], this.pile[j]] = [this.pile[j], this.pile[i]];
      }
      if (this.pile.length > 1 && this.pile[this.pile.length - 1] === this.last) this.pile.unshift(this.pile.pop()!);
    }
    this.last = this.pile.pop()!;
    return this.last;
  }
}

export function mapDeck(grade: Grade, rnd?: () => number): Rotation<MapChallenge> {
  return new Rotation(mapChallengesFor(grade), rnd);
}
export function timelineDeck(grade: Grade, rnd?: () => number): Rotation<TimelineSet> {
  return new Rotation(timelinesFor(grade), rnd);
}
