/*
 * Where Trail Ledger's questions come from. Pure (no kit banks, no DOM) so tests and bots can
 * use it; the browser adds the kit social deck mix-in and adaptive math through `hooks`.
 */
import type { Grade } from "@/kit/types";
import { gradeNumber } from "@/kit/grades";
import { BANK } from "@/data/expeditions";
import { bandOf, codeFor } from "@/data/standards";
import type { BankItem, ExpeditionId } from "@/data/types";
import { forecastMath, outfitMath, type ForecastCtx, type OutfitCtx } from "@/sim/trailmath";
import type { TLQuestion } from "./question";

export interface QuestionHooks {
  /** The grade (number) to generate math for. Default: the player's grade. Browser: kit mathGradeFor. */
  mathGrade?: (grade: Grade) => number;
  /** Called with every generated math question (browser: kit markAdaptive). */
  onMath?: (q: TLQuestion, grade: Grade) => void;
  /** An on-topic kit social question for this transmission, or null (browser only). */
  kitPick?: (grade: Grade, exp: ExpeditionId, turn: number) => TLQuestion | null;
}

export function toQuestion(item: BankItem, grade: Grade): TLQuestion {
  const { code, preview } = codeFor(item, grade);
  return {
    id: item.id,
    subject: "social",
    grade,
    standard: code,
    skill: item.skill,
    prompt: item.prompt,
    choices: item.choices,
    answer: item.answer,
    explanation: item.explanation,
    quick: item.quick,
    source: "era",
    preview,
  };
}

export class QuestionSource {
  private used = new Set<string>();
  private turn = 0;

  constructor(
    public readonly grade: Grade,
    public readonly exp: ExpeditionId,
    private rand: () => number,
    private hooks: QuestionHooks = {},
  ) {}

  get band() {
    return bandOf(this.grade);
  }

  /** Questions for a landmark: 1 for grade 5, 1–2 for grades 6–8, 2 for grades 9–12. */
  landmark(landmarkId: string, index: number): TLQuestion[] {
    const items = BANK.filter((b) => b.exp === this.exp && b.band === this.band && b.landmark === landmarkId);
    const n = this.band === 0 ? 1 : this.band === 1 ? (index % 2 === 0 ? 2 : 1) : 2;
    const order = [...items].sort(() => this.rand() - 0.5);
    return order.slice(0, n).map((b) => {
      this.used.add(b.id);
      return toQuestion(b, this.grade);
    });
  }

  /** A between-leg transmission question (era bank, with the kit's social deck mixed in where on topic). */
  transmission(): TLQuestion {
    this.turn++;
    if (this.hooks.kitPick && this.turn % 3 === 0) {
      const k = this.hooks.kitPick(this.grade, this.exp, this.turn);
      if (k) return k;
    }
    let pool = BANK.filter((b) => b.exp === this.exp && b.band === this.band && !b.landmark);
    let fresh = pool.filter((b) => !this.used.has(b.id));
    if (!fresh.length) {
      pool.forEach((b) => this.used.delete(b.id));
      fresh = pool;
    }
    pool = fresh;
    const item = pool[Math.floor(this.rand() * pool.length)];
    this.used.add(item.id);
    return toQuestion(item, this.grade);
  }

  private mathGrade(): number {
    return this.hooks.mathGrade ? this.hooks.mathGrade(this.grade) : gradeNumber(this.grade);
  }

  outfit(ctx: OutfitCtx): TLQuestion {
    const q = outfitMath(this.mathGrade(), this.grade, ctx, this.rand);
    if (q.subject === "math") this.hooks.onMath?.(q, this.grade);
    return q;
  }

  forecast(ctx: ForecastCtx): TLQuestion {
    const q = forecastMath(this.mathGrade(), this.grade, ctx, this.rand);
    this.hooks.onMath?.(q, this.grade);
    return q;
  }
}
