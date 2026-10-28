import type { FloorPlan, Weighted } from "./bosses";
import { DIR_KINDS, KIND_META, generate, makeCombo, pick, type Combo, type KindId, type Rng, type U3Question } from "./unit3";

/*
 * Deals the questions for a run: weighted by floor, never the same kind twice in a row when there is a
 * choice, unit conversions alternate direction (to smaller / to bigger units in equal numbers), and
 * floor masters on floors 3-7 add COMBO story problems (floors 3-6: the second question of each fight;
 * floor 7: every question). The retry round cycles through the missed skill tags.
 */

export type BossItem = { type: "single"; q: U3Question } | { type: "combo"; combo: Combo };

export class U3Deck {
  private last: KindId | null = null;
  private flip = 0;
  private tagTurn = 0;
  private recent: string[] = [];

  constructor(private rng: Rng = Math.random) {}

  /** One question from a weighted list of kinds. */
  draw(w: Weighted): U3Question {
    const pool = w.length > 1 ? w.filter(([k]) => k !== this.last) : w;
    const total = pool.reduce((s, [, n]) => s + n, 0);
    let r = this.rng() * total;
    let kind = pool[0][0];
    for (const [k, n] of pool) {
      r -= n;
      if (r < 0) {
        kind = k;
        break;
      }
    }
    return this.make(kind);
  }

  private make(kind: KindId): U3Question {
    this.last = kind;
    let q = generate(kind, this.rng, DIR_KINDS.includes(kind) ? { dir: this.flip++ % 2 === 0 ? "toSmaller" : "toBigger" } : {});
    // Skip an exact repeat of a recent prompt (a few tries).
    for (let i = 0; i < 4 && this.recent.includes(q.prompt); i++) q = generate(kind, this.rng, q.dir ? { dir: q.dir } : {});
    this.recent = [q.prompt, ...this.recent].slice(0, 30);
    return q;
  }

  /** A retry-round question: cycle through the tags present, then a kind of that tag. */
  private retry(w: Weighted): U3Question {
    const tags = [...new Set(w.map(([k]) => KIND_META[k].tag))].sort((a, b) => a - b);
    const tag = tags[this.tagTurn++ % tags.length];
    const kinds = w.filter(([k]) => KIND_META[k].tag === tag);
    return this.make(pick(this.rng, kinds)[0]);
  }

  scroll(plan: FloorPlan): U3Question {
    return plan.section === "R" ? this.retry(plan.scrollKinds) : this.draw(plan.scrollKinds);
  }

  /** The floor master's next question; `asked` = questions already asked in this fight. */
  boss(plan: FloorPlan, asked: number): BossItem {
    const c = plan.combo;
    if (c.kinds.length && (c.mode === "all" || (c.mode === "once" && asked === 1))) {
      return { type: "combo", combo: makeCombo(pick(this.rng, c.kinds), this.rng) };
    }
    return { type: "single", q: plan.section === "R" ? this.retry(plan.kinds) : this.draw(plan.kinds) };
  }
}
