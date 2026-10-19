import { mathGradeFor } from "../kit/adaptive";
import { mathQuestion } from "../kit/math";
import type { Grade, Question, Subject } from "../kit/types";
import { bandOf } from "./band";
import { HEALTH, type HealthQuestion } from "./health";
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
import { VIRUSES, VIRUS_IDS, ZONES, zoneById, type VirusId, type Zone, type ZoneId } from "./roster";
import { VIRUS_QUESTIONS } from "./viruses";

/*
 * Where every question comes from.
 *
 *   SCIENCE · Life & health (default), SCIENCE · ALL
 *                    every body zone asks this game's health bank (its own zone's items first) plus the kit's
 *                    life-science items that fit a health theme (ALL also adds the rest of the kit's science).
 *   MIXED            every other question is health; the rest is the zone's partner subject (math, ELA or
 *                    social studies), so all four subjects show up across the eight zones.
 *   one subject      every zone asks that subject: the first of its `retune[subject]` topics the grade offers.
 *   one topic        every zone asks that topic (science Earth/physical: that topic only).
 *   Major Viruses    in the health modes above (and MIXED) each virus asks its own fact questions for the
 *                    grade band, then general health items; otherwise the chosen subject/topic (each virus
 *                    borrows a zone's retune). The virus's fact card is always shown at its intro.
 *
 * Math is generated fresh by the kit; written items come from the kit banks via a FocusCatalog (passed in so
 * Node tests can supply the banks). Decks never repeat a question until their pool is used up.
 */

export type Slot = ZoneId | VirusId;

export interface Source {
  subject: Subject;
  topic: TopicChoice;
}

export interface Resolved extends Source {
  /** Health mode: this game's health bank plus fitting kit life-science items. */
  health: boolean;
  /** MIXED: the partner subject asked every other question. */
  partner: Source | null;
}

/** Kit science items that fit a germs / body / health theme. */
export const HEALTH_FLAVOR = /germ|bacteri|virus|microb|pathogen|disease|immun|vaccin|antibio|infect|cell|body|organ|skin|blood|heart|lung|breath|digest|stomach|intestin|muscle|skelet|bone|health|sick|fever|homeosta|system|tissue|living|nonliving|decompos/i;

const flavorText = (q: Question) => `${q.skill} ${q.prompt}`;

export function isHealthItem(q: Question): boolean {
  return q.id.startsWith("gf-");
}

function firstAvailable(list: FocusTopicId[], subject: Subject, grade: Grade, catalog: FocusCatalog): TopicChoice {
  return list.find((t) => focusTopic(t).subject === subject && catalog.isAvailable(grade, t)) ?? "all";
}

/** True for the choices that use the health bank (and the viruses' own fact questions). */
export function healthMode(c: FocusChoice): boolean {
  return c.subject === "mixed" || (c.subject === "science" && (c.topic === "all" || c.topic === "life"));
}

/** What a body zone asks at this grade for this choice. */
export function resolveZone(zone: Zone, grade: Grade, choice: FocusChoice, catalog: FocusCatalog): Resolved {
  const c = validateFocus(choice, grade, catalog);
  if (c.subject === "mixed") {
    return { subject: "science", topic: "life", health: true, partner: { subject: zone.partner, topic: firstAvailable(zone.partnerTopics, zone.partner, grade, catalog) } };
  }
  if (c.subject === "science" && (c.topic === "all" || c.topic === "life")) return { subject: "science", topic: c.topic, health: true, partner: null };
  if (c.topic === "all") return { subject: c.subject, topic: firstAvailable(zone.retune[c.subject], c.subject, grade, catalog), health: false, partner: null };
  return { subject: c.subject, topic: c.topic, health: false, partner: null };
}

/** The zone whose subject settings a Major Virus borrows outside the health modes. */
export function virusZone(v: VirusId): Zone {
  return ZONES[VIRUS_IDS.indexOf(v) % ZONES.length];
}

/** True when a question belongs to a plain subject source. */
export function matchesPlain(q: Question, s: Source): boolean {
  if (q.subject !== s.subject) return false;
  return s.topic === "all" || classifyTopic(q) === s.topic;
}

/** True when a question fits a resolved zone source (health items count as life science). */
export function matchesSource(q: Question, r: Resolved): boolean {
  if (r.health) {
    if (q.subject === "science" && (isHealthItem(q) || r.topic === "all" || classifyTopic(q) === "life")) return true;
    return !!r.partner && matchesPlain(q, r.partner);
  }
  return matchesPlain(q, r);
}

function dedupe<T extends Question>(qs: T[]): T[] {
  const seen = new Set<string>();
  return qs.filter((q) => {
    const k = q.prompt.trim().toLowerCase();
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
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

/** A written pool drawn without repeats until it is used up (then a new round that skips recent prompts). */
class Pool {
  private used = new Set<string>();
  private recent: string[] = [];
  constructor(readonly items: Question[]) {}
  get fresh(): number {
    return this.items.filter((q) => !this.used.has(q.prompt)).length;
  }
  draw(): Question | null {
    const pool = this.items;
    if (pool.length === 0) return null;
    let fresh = pool.filter((q) => !this.used.has(q.prompt));
    if (fresh.length === 0) {
      for (const q of pool) this.used.delete(q.prompt);
      const recent = this.recent.slice(-Math.min(RECENT, Math.floor(pool.length / 2)));
      fresh = pool.filter((q) => !recent.includes(q.prompt));
      if (fresh.length === 0) fresh = pool;
    }
    const q = fresh[Math.floor(Math.random() * fresh.length)];
    this.used.add(q.prompt);
    this.recent.push(q.prompt);
    if (this.recent.length > RECENT) this.recent.shift();
    return q;
  }
}

/** One plain subject/topic source (kit banks or generated math). */
export class SubjectDeck {
  readonly pool: Question[];
  private written: Pool;
  private recent: string[] = [];
  private last: Question | null = null;
  private mathSource: Grade | null = null;

  constructor(readonly source: Source, readonly grade: Grade, catalog: FocusCatalog, private opts: { adaptive?: boolean } = {}) {
    const s = source;
    if (s.subject === "math") {
      this.pool = [];
      this.mathSource = s.topic === "all" ? grade : mathSourceGrade(grade, s.topic) ?? grade;
    } else {
      this.pool = s.topic === "all" ? catalog.subjectPool(grade, s.subject) : catalog.writtenPool(grade, s.topic);
    }
    this.written = new Pool(this.pool);
  }

  draw(): Question {
    const q = this.mathSource ? this.drawMath() : this.written.draw() ?? this.last ?? mathQuestion(this.grade);
    this.recent.push(q.prompt);
    if (this.recent.length > RECENT) this.recent.shift();
    this.last = q;
    return q;
  }

  private mathGrade(): Grade {
    const base = this.mathSource!;
    if (this.opts.adaptive === false) return base;
    const g = mathGradeFor(this.grade);
    const t = this.source.topic;
    if (t === "all") return g;
    return g !== this.grade && mathHasVariety(g, t) ? g : base;
  }

  private drawMath(): Question {
    let pick: Question | null = null;
    for (let i = 0; i < MATH_TRIES; i++) {
      const q = mathQuestion(i < MATH_TRIES / 2 ? this.mathGrade() : this.mathSource!);
      if (!matchesPlain(q, this.source)) continue;
      if (!this.recent.includes(q.prompt)) return q;
      if (!pick && q.prompt !== this.last?.prompt) pick = q;
    }
    return pick ?? this.last ?? mathQuestion(this.mathSource!);
  }
}

/** The health pools for a zone (or the rush): its own items first, then the band's other health items and kit life items. */
export function healthPools(grade: Grade, zone: ZoneId | null, topic: TopicChoice, catalog: FocusCatalog): { own: HealthQuestion[]; rest: Question[] } {
  const band = HEALTH[bandOf(grade)];
  const own = zone ? band.filter((q) => q.zones.includes(zone)) : [];
  const kitLife = catalog.writtenPool(grade, "life").filter((q) => HEALTH_FLAVOR.test(flavorText(q)));
  const kitAll = topic === "all" ? catalog.subjectPool(grade, "science") : [];
  const rest = dedupe<Question>([...band.filter((q) => !own.includes(q)), ...kitLife, ...kitAll]).filter((q) => !own.some((o) => o.prompt === q.prompt));
  return { own, rest };
}

/** One body zone's questions. */
export class ZoneDeck {
  readonly resolved: Resolved;
  private own: Pool | null = null;
  private rest: Pool | null = null;
  private plain: SubjectDeck | null = null;
  private partner: SubjectDeck | null = null;
  private turn = 0;

  constructor(readonly zone: Zone, readonly grade: Grade, choice: FocusChoice, catalog: FocusCatalog, opts: { adaptive?: boolean } = {}) {
    this.resolved = resolveZone(zone, grade, choice, catalog);
    const r = this.resolved;
    if (r.health) {
      const p = healthPools(grade, zone.id, r.topic, catalog);
      this.own = new Pool(p.own);
      this.rest = new Pool(p.rest);
      if (r.partner) this.partner = new SubjectDeck(r.partner, grade, catalog, opts);
    } else this.plain = new SubjectDeck(r, grade, catalog, opts);
  }

  /** Every written question this zone can ask (health pools; the kit pool otherwise; empty for math). */
  get pool(): Question[] {
    if (this.plain) return this.plain.pool;
    return [...this.own!.items, ...this.rest!.items];
  }

  draw(): Question {
    if (this.plain) return this.plain.draw();
    const t = this.turn++;
    if (this.partner && t % 2 === 1) return this.partner.draw();
    // Zone items first (about 2 in 3 while fresh ones remain), then everything else.
    const own = this.own!;
    if (own.fresh > 0 && (Math.random() < 0.67 || this.rest!.fresh === 0)) return own.draw()!;
    return this.rest!.draw() ?? own.draw()!;
  }
}

/** One Major Virus's questions: its own facts for the band first, then general health items. */
export class VirusDeck {
  private facts: Pool | null = null;
  private rest: Pool | null = null;
  private plain: SubjectDeck | null = null;
  readonly health: boolean;
  readonly resolved: Resolved;

  constructor(readonly virus: VirusId, readonly grade: Grade, choice: FocusChoice, catalog: FocusCatalog, opts: { adaptive?: boolean } = {}) {
    const c = validateFocus(choice, grade, catalog);
    this.health = healthMode(c);
    if (this.health) {
      this.resolved = { subject: "science", topic: c.subject === "science" ? c.topic : "life", health: true, partner: null };
      this.facts = new Pool(VIRUS_QUESTIONS[virus][bandOf(grade)]);
      this.rest = new Pool(healthPools(grade, null, this.resolved.topic, catalog).rest);
    } else {
      this.resolved = resolveZone(virusZone(virus), grade, c, catalog);
      this.plain = new SubjectDeck(this.resolved, grade, catalog, opts);
    }
  }

  /** The virus's own fact questions still unasked this round. */
  get factsLeft(): number {
    return this.facts?.fresh ?? 0;
  }

  draw(): Question {
    if (this.plain) return this.plain.draw();
    if (this.facts!.fresh > 0) return this.facts!.draw()!;
    return this.rest!.draw() ?? this.facts!.draw()!;
  }
}

/** All the decks of one run: eight zones and six Major Viruses. */
export class GermQuestions {
  private zones = new Map<ZoneId, ZoneDeck>();
  private viruses = new Map<VirusId, VirusDeck>();

  constructor(readonly grade: Grade, readonly choice: FocusChoice, catalog: FocusCatalog, opts: { adaptive?: boolean } = {}) {
    for (const z of ZONES) this.zones.set(z.id, new ZoneDeck(z, grade, choice, catalog, opts));
    for (const v of VIRUSES) this.viruses.set(v.id, new VirusDeck(v.id, grade, choice, catalog, opts));
  }

  zone(id: ZoneId): ZoneDeck {
    return this.zones.get(id)!;
  }

  virus(id: VirusId): VirusDeck {
    return this.viruses.get(id)!;
  }

  /** A fresh (undealt, correct answer first) question for a zone or a Major Virus. */
  draw(slot: Slot): Question {
    return (VIRUS_IDS as string[]).includes(slot) ? this.virus(slot as VirusId).draw() : this.zone(slot as ZoneId).draw();
  }
}

/** Short label for a resolved source, e.g. "SCIENCE · LIFE & HEALTH" or "HEALTH + MATH". */
export function sourceLabel(r: Resolved): string {
  const subj = (s: Source) => {
    const name = { math: "MATH", science: "SCIENCE", ela: "ELA", social: "SOCIAL STUDIES" }[s.subject];
    return s.topic === "all" ? name : `${name} · ${focusTopic(s.topic).tag}`;
  };
  if (r.partner) return `HEALTH + ${subj(r.partner)}`;
  if (r.health) return r.topic === "all" ? "SCIENCE · HEALTH + ALL" : "SCIENCE · LIFE & HEALTH";
  return subj(r);
}

export { zoneById };
