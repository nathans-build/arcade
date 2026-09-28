import type { Grade } from "../kit/types";
import { CHALLENGES } from "../words";
import type { Challenge } from "./challenges";

/**
 * Deals a grade's worm challenges in a shuffled order without repeats until the list is
 * used up. A challenge with wrong shots comes back a few worms later for another try.
 */
export class ChallengeDeck {
  private queue: Challenge[] = [];
  private lastId = "";

  constructor(private grade: Grade, private rand: () => number = Math.random) {}

  next(): Challenge {
    if (this.queue.length === 0) {
      this.queue = [...CHALLENGES[this.grade]];
      for (let i = this.queue.length - 1; i > 0; i--) {
        const j = Math.floor(this.rand() * (i + 1));
        [this.queue[i], this.queue[j]] = [this.queue[j], this.queue[i]];
      }
      if (this.queue.length > 1 && this.queue[0].id === this.lastId) this.queue.push(this.queue.shift()!);
    }
    const ch = this.queue.shift()!;
    this.lastId = ch.id;
    return ch;
  }

  /** Bring a missed challenge back soon (after three other worms). */
  retry(ch: Challenge) {
    this.queue = this.queue.filter((q) => q.id !== ch.id);
    this.queue.splice(Math.min(3, this.queue.length), 0, ch);
  }
}
