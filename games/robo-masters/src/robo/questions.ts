import { mathGradeFor } from "../kit/adaptive";
import { mathQuestion } from "../kit/math";
import type { Grade, Question, Subject } from "../kit/types";
import { bandOf } from "./band";
import { EXTRAS } from "./extras";
import {
  FocusCatalog,
  classifyTopic,
  focusTopic,
  mathHasVariety,
  mathSourceGrade,
  validateFocus,
  type FocusChoice,
  type FocusTopicId,
  type TopicChoice,
} from "./focus";
import { ROBOTS, robotById, type Robot, type RobotId } from "./robots";

/*
 * Where every boss question comes from.
 *
 *   MIXED            each Robo Master asks its own subject: the first of its `topics` the grade
 *                    offers (else ALL of its subject), leaning on its flavour (e.g. weather inside
 *                    Earth science) when the kit plus this game's extras have enough of those.
 *   one subject      every robot asks that subject: the first of its `retune[subject]` topics the
 *                    grade offers (else ALL of it).
 *   one topic        every robot asks that topic.
 *   fortress         Lord Static takes turns through all eight robots' sources.
 *
 * Math is generated fresh by the kit (adaptive level when on); written questions come from the kit
 * banks via a FocusCatalog (passed in so Node tests can supply the banks).
 */

export type Slot = RobotId | "fortress";

export interface Resolved {
  subject: Subject;
  topic: TopicChoice;
  /** Flavour regex used to prefer on-theme items (null: whole topic). */
  flavor: RegExp | null;
}

/** A written pool needs this many flavoured items before it narrows to the flavour. */
export const FLAVOR_MIN = 6;

function firstAvailable(list: FocusTopicId[], subject: Subject, grade: Grade, catalog: FocusCatalog): TopicChoice {
  return list.find((t) => focusTopic(t).subject === subject && catalog.isAvailable(grade, t)) ?? "all";
}

/** Which subject/topic a robot asks at this grade for this choice. */
export function resolveRobot(robot: Robot, grade: Grade, choice: FocusChoice, catalog: FocusCatalog): Resolved {
  const c = validateFocus(choice, grade, catalog);
  if (c.subject === "mixed") {
    return { subject: robot.subject, topic: firstAvailable(robot.topics, robot.subject, grade, catalog), flavor: robot.flavor };
  }
  if (c.topic === "all") {
    return { subject: c.subject, topic: firstAvailable(robot.retune[c.subject], c.subject, grade, catalog), flavor: c.subject === robot.subject ? robot.flavor : null };
  }
  const own = c.subject === robot.subject && robot.topics.includes(c.topic);
  return { subject: c.subject, topic: c.topic, flavor: own ? robot.flavor : null };
}

/** True when a question belongs to a resolved source (subject, and topic unless ALL). */
export function matchesSource(q: Question, r: Resolved): boolean {
  if (q.subject !== r.subject) return false;
  return r.topic === "all" || classifyTopic(q) === r.topic;
}

function dedupe(qs: Question[]): Question[] {
  const seen = new Set<string>();
  return qs.filter((q) => {
    const k = q.prompt.trim().toLowerCase();
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

const flavorText = (q: Question) => `${q.skill} ${q.prompt}`;

/** The written pool a robot draws from (empty for math). */
export function writtenPoolFor(robot: Robot, grade: Grade, r: Resolved, catalog: FocusCatalog): Question[] {
  if (r.subject === "math") return [];
  const base = r.topic === "all" ? catalog.subjectPool(grade, r.subject) : catalog.writtenPool(grade, r.topic);
  if (!r.flavor) return base;
  const extras = (EXTRAS[robot.id]?.[bandOf(grade)] ?? []).filter((q) => matchesSource(q, r));
  const flavored = dedupe([...extras, ...base.filter((q) => r.flavor!.test(flavorText(q)))]);
  return flavored.length >= FLAVOR_MIN ? flavored : dedupe([...flavored, ...base]);
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Shuffles a question's choices for display, keeping track of the answer. */
export function dealQuestion(q: Question): Question {
  const order = shuffle([0, 1, 2, 3]);
  return { ...q, choices: order.map((i) => q.choices[i]) as Question["choices"], answer: order.indexOf(q.answer) };
}

const RECENT = 12;
const MATH_TRIES = 300;

/** One robot's question source: no repeats until its pool is used up, recent prompts skipped. */
export class RobotDeck {
  readonly resolved: Resolved;
  readonly pool: Question[];
  private used = new Set<string>();
  private recent: string[] = [];
  private last: Question | null = null;
  private mathSource: Grade | null = null;

  constructor(readonly robot: Robot, readonly grade: Grade, choice: FocusChoice, catalog: FocusCatalog, private opts: { adaptive?: boolean } = {}) {
    this.resolved = resolveRobot(robot, grade, choice, catalog);
    this.pool = writtenPoolFor(robot, grade, this.resolved, catalog);
    if (this.resolved.subject === "math") {
      const t = this.resolved.topic;
      this.mathSource = t === "all" ? grade : mathSourceGrade(grade, t) ?? grade;
    }
  }

  draw(): Question {
    const q = this.resolved.subject === "math" ? this.drawMath() : this.drawWritten();
    this.recent.push(q.prompt);
    if (this.recent.length > RECENT) this.recent.shift();
    this.last = q;
    return q;
  }

  private drawWritten(): Question {
    const pool = this.pool;
    if (pool.length === 0) return this.last ?? mathQuestion(this.grade);
    let fresh = pool.filter((q) => !this.used.has(q.prompt));
    if (fresh.length === 0) {
      for (const q of pool) this.used.delete(q.prompt);
      const recent = this.recent.slice(-Math.min(RECENT, Math.floor(pool.length / 2)));
      fresh = pool.filter((q) => !recent.includes(q.prompt));
      if (fresh.length === 0) fresh = pool;
    }
    const q = fresh[Math.floor(Math.random() * fresh.length)];
    this.used.add(q.prompt);
    return q;
  }

  private mathGrade(): Grade {
    const base = this.mathSource!;
    if (this.opts.adaptive === false) return base;
    const g = mathGradeFor(this.grade);
    const t = this.resolved.topic;
    if (t === "all") return g;
    return g !== this.grade && mathHasVariety(g, t) ? g : base;
  }

  private drawMath(): Question {
    const r = this.resolved;
    let onTopic: Question | null = null;
    for (let i = 0; i < MATH_TRIES; i++) {
      const q = mathQuestion(i < MATH_TRIES / 2 ? this.mathGrade() : this.mathSource!);
      if (!matchesSource(q, r)) continue;
      const fresh = !this.recent.includes(q.prompt);
      // First half of the tries: hold out for a fresh, flavoured question.
      if (fresh && (!r.flavor || r.flavor.test(flavorText(q)) || i >= MATH_TRIES / 2)) return q;
      if (fresh && !onTopic) onTopic = q;
      if (!onTopic && q.prompt !== this.last?.prompt) onTopic = q;
    }
    return onTopic ?? this.last ?? mathQuestion(this.mathSource!);
  }
}

/** All the decks of one run (eight robots and the fortress). */
export class RoboQuestions {
  private decks = new Map<RobotId, RobotDeck>();
  private fortressTurn = Math.floor(Math.random() * ROBOTS.length);

  constructor(readonly grade: Grade, readonly choice: FocusChoice, catalog: FocusCatalog, opts: { adaptive?: boolean } = {}) {
    for (const r of ROBOTS) this.decks.set(r.id, new RobotDeck(r, grade, choice, catalog, opts));
  }

  deck(id: RobotId): RobotDeck {
    return this.decks.get(id)!;
  }

  /** The robot whose source the next fortress question uses. */
  nextFortressRobot(): RobotId {
    return ROBOTS[this.fortressTurn % ROBOTS.length].id;
  }

  /** A fresh (undealt, answer first) question for a slot, with the robot whose source it came from. */
  draw(slot: Slot): { q: Question; from: RobotId } {
    if (slot === "fortress") {
      const from = ROBOTS[this.fortressTurn++ % ROBOTS.length].id;
      return { q: this.deck(from).draw(), from };
    }
    return { q: this.deck(slot).draw(), from: slot };
  }
}

/** Short label for a resolved source, e.g. "SCIENCE · EARTH SCIENCE". */
export function sourceLabel(r: Resolved): string {
  const subj = { math: "MATH", science: "SCIENCE", ela: "ELA", social: "SOCIAL STUDIES" }[r.subject];
  return r.topic === "all" ? subj : `${subj} · ${focusTopic(r.topic).tag}`;
}

export { robotById };
