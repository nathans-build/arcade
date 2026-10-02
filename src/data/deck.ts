/*
 * Draws Plants vs Undead questions: seed-card questions per defender and between-wave
 * checkpoints. Checkpoints are mostly the game's own plant questions, with every third one
 * from the kit's science deck for the player's grade.
 */
import { QuestionDeck, deal, loadProgress, type DealtQuestion, type Grade, type Question } from "@/kit";
import { BANK, SKILL, bandOfGrade, cardItems, checkpointItems, standardFor, type BankItem } from "./bank";
import type { PlantKind } from "./parts";

export function toQuestion(item: BankItem, grade: Grade): Question {
  return {
    id: item.id,
    subject: "science",
    grade,
    standard: standardFor(item.topic, grade),
    skill: SKILL[item.topic],
    prompt: item.prompt,
    choices: item.choices,
    answer: item.answer,
    explanation: item.explanation,
    ...(item.passage ? { passage: item.passage } : {}),
    quick: item.quick,
  };
}

export class PlantDeck {
  private used = new Set<string>();
  private kit: QuestionDeck;
  private cpTurn = 0;
  private seenPrompts = new Set<string>();

  constructor(public readonly grade: Grade, private gameId: string) {
    this.kit = new QuestionDeck(grade, "science", { gameId });
  }

  private pick(pool: BankItem[]): BankItem {
    let fresh = pool.filter((q) => !this.used.has(q.id));
    if (!fresh.length) {
      pool.forEach((q) => this.used.delete(q.id));
      fresh = pool;
    }
    // Favour standards the player has missed before (like the kit deck).
    const progress = loadProgress(this.gameId);
    const weights = fresh.map((q) => {
      const s = progress.standards[standardFor(q.topic, this.grade)];
      return !s || s.seen === 0 ? 2 : 1 + (1 - s.correct / s.seen) * 2;
    });
    let r = Math.random() * weights.reduce((a, b) => a + b, 0);
    let chosen = fresh[fresh.length - 1];
    for (let i = 0; i < fresh.length; i++) {
      r -= weights[i];
      if (r <= 0) {
        chosen = fresh[i];
        break;
      }
    }
    this.used.add(chosen.id);
    this.seenPrompts.add(chosen.prompt);
    return chosen;
  }

  /** A question about one defender's plant part, for its seed card. */
  card(kind: PlantKind): DealtQuestion {
    return deal(toQuestion(this.pick(cardItems(bandOfGrade(this.grade), kind)), this.grade));
  }

  /** A between-wave checkpoint question. */
  checkpoint(): DealtQuestion {
    this.cpTurn++;
    if (this.cpTurn % 3 === 0) {
      for (let i = 0; i < 6; i++) {
        const q = this.kit.draw();
        if (!this.seenPrompts.has(q.prompt)) {
          this.seenPrompts.add(q.prompt);
          return q;
        }
      }
    }
    const band = bandOfGrade(this.grade);
    let pool = checkpointItems(band);
    if (pool.every((q) => this.used.has(q.id))) {
      // Out of long questions: use card questions from the band that have not come up yet.
      const spare = BANK.filter((q) => q.band === band && !this.used.has(q.id));
      if (spare.length) pool = spare;
    }
    return deal(toQuestion(this.pick(pool), this.grade));
  }
}
