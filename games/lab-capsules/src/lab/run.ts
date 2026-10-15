/*
 * A whole run: level after level, with a Lab Quiz between levels. Only a full bottle ends a
 * run; quiz answers (right or wrong) only add bonus points and always lead to the next level.
 * Pure TypeScript.
 */
import type { Grade } from "../kit/types";
import { makeLevelSet, makeQuiz, type LabQuestion } from "./content";
import { LabGame, type SpeedId } from "./game";
import type { Rng } from "./rng";
import { setForLevel, type Focus } from "./topics";

export const QUIZ_BONUS = 500;
export const LEVEL_BONUS = 1000;

export interface QuizLogEntry {
  q: LabQuestion;
  correct: boolean;
}

export class LabRun {
  level = 1;
  score = 0;
  /** Score when the current level started (a retry goes back to it). */
  levelStartScore = 0;
  game: LabGame;
  quiz: LabQuestion | null = null;
  quizLog: QuizLogEntry[] = [];
  over = false;

  constructor(
    readonly grade: Grade,
    readonly focus: Focus,
    readonly speed: SpeedId,
    readonly rng: Rng,
    startLevel = 1,
  ) {
    this.level = startLevel;
    this.game = this.makeGame();
  }

  makeGame(): LabGame {
    const set = makeLevelSet(setForLevel(this.focus, this.grade, this.level), this.grade, this.level, this.rng);
    return new LabGame({ set, speed: this.speed, rng: this.rng, score: this.score });
  }

  /** Call when the game reports "won": banks the score and deals the Lab Quiz. */
  finishLevel(): LabQuestion {
    this.score = this.game.score + LEVEL_BONUS * this.level;
    this.quiz = makeQuiz(this.game.set, this.rng, this.game.log);
    return this.quiz;
  }

  /** Answer the Lab Quiz. Never ends the run. */
  answer(index: number): { correct: boolean; bonus: number } {
    if (!this.quiz) return { correct: false, bonus: 0 };
    const correct = index === this.quiz.answer;
    const bonus = correct ? QUIZ_BONUS : 0;
    this.score += bonus;
    this.quizLog.push({ q: this.quiz, correct });
    return { correct, bonus };
  }

  /** After the quiz's explanation: on to the next level. */
  nextLevel() {
    this.quiz = null;
    this.level++;
    this.levelStartScore = this.score;
    this.game = this.makeGame();
  }

  /** Call when the game reports "lost". */
  lose() {
    this.score = this.game.score;
    this.over = true;
  }

  /** Try the same level again (score goes back to the level start). */
  retry() {
    this.over = false;
    this.score = this.levelStartScore;
    this.game = this.makeGame();
  }
}
