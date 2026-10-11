import {
  GRADES,
  QuestionDeck,
  bankFor,
  deal,
  markAdaptive,
  mathGradeFor,
  mathQuestion,
  type DealtQuestion,
  type Grade,
  type Question,
} from "@/kit";
import { CIVICS } from "./civics";
import { FORCES, FORCE_SKILL } from "./forces";
import type { Topic } from "./floors";
import { bandOf, type Band } from "./qmake";

/*
 * Where each floor's questions come from:
 *   ELA     kit ELA bank (QuestionDeck)
 *   MATH    kit generated math at the adaptive level, steered toward the band's focus
 *           (K-2 shapes and number facts, 3-5 multiplication and division, 6-8 integers)
 *   CIVICS  Dojo Tower's civics bank for the grade band + the kit's Civics & Government items
 *   SCIENCE Dojo Tower's forces set for the band + the kit's force and motion items
 *   MIXED   all four in turn
 * Scroll questions (on the floors) are quick items; boss questions can be longer, never passages.
 */

const MATH_FOCUS: Record<Band, RegExp | null> = {
  k2: /shape|add|subtract|make 10|count/i,
  g35: /multipl|divi|factor/i,
  g68: /integer|absolute/i,
  hs: null,
};

function bandGrades(band: Band): Grade[] {
  return GRADES.filter((g) => bandOf(g) === band);
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** A shuffled pool that avoids repeats until it is used up. */
class PoolDeck {
  private queue: Question[] = [];
  constructor(private pool: Question[]) {}
  get size() {
    return this.pool.length;
  }
  draw(): Question | null {
    if (this.pool.length === 0) return null;
    if (this.queue.length === 0) this.queue = shuffle(this.pool);
    return this.queue.pop()!;
  }
}

export function civicsPool(grade: Grade): Question[] {
  const band = bandOf(grade);
  const kit = bandGrades(band).flatMap((g) => bankFor("social", g)).filter((q) => q.standard.includes("C&G") && !q.passage);
  return [...CIVICS[band], ...kit];
}

export function forcesPool(grade: Grade): Question[] {
  const band = bandOf(grade);
  const kit = bandGrades(band).flatMap((g) => bankFor("science", g)).filter((q) => FORCE_SKILL.test(q.skill) && !q.passage);
  return [...FORCES[band], ...kit];
}

export class TopicDecks {
  private band: Band;
  private ela: { full: QuestionDeck; quick: QuestionDeck };
  private civics: { full: PoolDeck; quick: PoolDeck };
  private forces: { full: PoolDeck; quick: PoolDeck };
  private mixTurn = Math.floor(Math.random() * 4);

  constructor(private grade: Grade, gameId: string) {
    this.band = bandOf(grade);
    this.ela = {
      full: new QuestionDeck(grade, "ela", { gameId }),
      quick: new QuestionDeck(grade, "ela", { gameId, quickOnly: true }),
    };
    const civ = civicsPool(grade);
    const frc = forcesPool(grade);
    this.civics = { full: new PoolDeck(civ), quick: new PoolDeck(civ.filter((q) => q.quick)) };
    this.forces = { full: new PoolDeck(frc), quick: new PoolDeck(frc.filter((q) => q.quick)) };
  }

  private math(quick: boolean): DealtQuestion {
    const focus = MATH_FOCUS[this.band];
    const g = mathGradeFor(this.grade);
    let q = mathQuestion(g, { quick });
    // Mostly the band's focus skill, sometimes anything from the grade.
    if (focus && Math.random() < 0.75) {
      for (let i = 0; i < 40 && !focus.test(q.skill); i++) q = mathQuestion(g, { quick });
    }
    markAdaptive(q, this.grade);
    return deal(q);
  }

  private fromPool(p: { full: PoolDeck; quick: PoolDeck }, quick: boolean): DealtQuestion | null {
    const deck = quick && p.quick.size > 0 ? p.quick : p.full;
    const q = deck.draw();
    return q ? deal(q) : null;
  }

  draw(topic: Topic, quick: boolean): DealtQuestion {
    if (topic === "mixed") {
      const order: Topic[] = ["civics", "math", "forces", "ela"];
      return this.draw(order[this.mixTurn++ % order.length], quick);
    }
    if (topic === "math") return this.math(quick);
    if (topic === "ela") {
      const deck = quick ? this.ela.quick : this.ela.full;
      let q = deck.draw();
      for (let i = 0; i < 12 && q.passage; i++) q = deck.draw();
      return q.passage ? this.ela.quick.draw() : q;
    }
    const q = this.fromPool(topic === "civics" ? this.civics : this.forces, quick);
    return q ?? this.math(quick);
  }
}
