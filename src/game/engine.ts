/*
 * Thread Chasers game state machine (framework-free; the React shell renders `ui` and calls methods).
 *
 * cases -> brief -> bead (witnesses, plaque, refuel) -> map (pins / split dial) -> next bead ... ->
 * re-weave ("what came next?" + "why did it move?") -> solved (Knot caught) -> transmission -> report
 * A wrong jump is a dead end (an explanation, -2 lantern hours, back to the last bead).
 * An empty lantern: "the thread slips", restart at the last bead with points kept.
 */
import { buildDial, buildPins, lineFor, shuffle, type EraOption, type PinOption, type Witness } from "@/chase/clues";
import { fitView, type LonLat, type View } from "@/chase/geo";
import { layoutPins, type PinSpot } from "@/chase/pins";
import { place } from "@/chase/places";
import { CASES } from "@/cases";
import { ChipAudio, QuestionDeck, bankFor, deal, gradeNumber, recordAnswer, submitScore, type DealtQuestion, type Grade, type Question } from "@/kit";
import { BAND_RULES, bandOf, beadsFor, casesFor, levels } from "./bands";
import { jumpQuestion, reweaveQuestions, sourceQuestions, whyQuestions } from "./questions";
import { lanternCost, lanternFor, musicOn, rankFor, type Rank } from "./rules";
import { SKILL_NAMES } from "./standards";
import type { Band, Bead, Case } from "./types";

export const GAME_ID = "thread-chasers";

export type Phase = "title" | "cases" | "brief" | "bead" | "map" | "deadend" | "slip" | "question" | "solved" | "report";
export type QPurpose = "source" | "refuel" | "reweave" | "why" | "transmission";

export interface Talker {
  who: string;
  look: string;
  text: string;
  kind: "clue" | "herring" | "unreliable";
  note?: string;
}

export interface Heard {
  who: string;
  text: string;
  plaque?: boolean;
}

export interface QState {
  q: DealtQuestion;
  picked: number | null;
  purpose: QPurpose;
  title: string;
  /** Re-weave progress, e.g. 2 of 4. */
  step?: [number, number];
}

export interface LogEntry {
  standard: string;
  skill: string;
  correct: boolean;
  cat: "case" | "kit";
}

export interface MapState {
  view: View;
  /** Pins mode (grades 5-8). */
  pins: PinOption[];
  spots: PinSpot[];
  selected: number | null;
  /** Split dial (grades 9-12). */
  dial: { places: PinOption[]; eras: EraOption[]; step: "place" | "era"; placeIx: number | null } | null;
  tried: string[];
}

export interface Ui {
  phase: Phase;
  grade: Grade;
  band: Band;
  caseIx: number;
  caseSel: number;
  chain: Bead[];
  beadIx: number;
  lantern: number;
  lanternMax: number;
  score: number;
  talkers: Talker[];
  asked: number[];
  heard: Heard[];
  plaqueRead: boolean;
  refueled: boolean;
  sel: number;
  sourcePending: boolean;
  /** After a jump: what the red-herring / unreliable witness should have taught. */
  review: string | null;
  map: MapState | null;
  attempts: number;
  deadEnd: { place: string; era: string; why: string; cost: number } | null;
  q: QState | null;
  queue: { q: Question; purpose: QPurpose; title: string }[];
  woven: number;
  log: LogEntry[];
  misses: { bead: string; place: string; era: string; why: string }[];
  solvedNow: string[];
  msg: string;
  sensitive: boolean;
}

const SOLVED_KEY = "arcade.thread-chasers.solved.v1";

function loadSolved(): Record<string, string[]> {
  try {
    const raw = localStorage.getItem(SOLVED_KEY);
    if (raw) return JSON.parse(raw) as Record<string, string[]>;
  } catch {
    // ignore
  }
  return {};
}

function saveSolved(s: Record<string, string[]>) {
  try {
    localStorage.setItem(SOLVED_KEY, JSON.stringify(s));
  } catch {
    // ignore
  }
}

function seeded(seed: string): () => number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  };
}

/** Kit social deck at the player's own grade; the game's own case bank if the kit pool is empty. */
class RefuelDeck {
  private deck: QuestionDeck | null;
  private own: Question[] = [];
  private i = 0;
  constructor(grade: Grade, band: Band) {
    this.deck = bankFor("social", grade).length ? new QuestionDeck(grade, "social", { gameId: GAME_ID }) : null;
    if (!this.deck) {
      for (const c of casesFor(grade)) this.own.push(...whyQuestions(grade, band, c), ...reweaveQuestions(grade, band, c));
      this.own = shuffle(this.own);
    }
  }
  draw(): DealtQuestion {
    if (this.deck) return this.deck.draw();
    const q = this.own[this.i++ % Math.max(1, this.own.length)];
    return deal(q);
  }
}

export interface Hooks {
  onChange: () => void;
  say: (text: string) => void;
  sayQuestion: (q: Question) => void;
}

export class ThreadGame {
  ui: Ui;
  fast = false;
  private refuel!: RefuelDeck;
  private solved = loadSolved();
  private cases: Case[] = [];

  constructor(private audio: ChipAudio, private hooks: Hooks, grade: Grade) {
    this.ui = this.fresh(grade);
    this.setGrade(grade);
  }

  private fresh(grade: Grade): Ui {
    const band = bandOf(grade);
    return {
      phase: "title", grade, band, caseIx: 0, caseSel: 0, chain: [], beadIx: 0,
      lantern: lanternFor(band), lanternMax: lanternFor(band), score: 0,
      talkers: [], asked: [], heard: [], plaqueRead: false, refueled: false, sel: 0, sourcePending: false, review: null,
      map: null, attempts: 0, deadEnd: null, q: null, queue: [], woven: 0, log: [], misses: [], solvedNow: [], msg: "", sensitive: false,
    };
  }

  private changed() {
    this.hooks.onChange();
  }

  setGrade(g: Grade) {
    this.ui = this.fresh(g);
    this.cases = casesFor(g);
    this.refuel = new RefuelDeck(g, this.ui.band);
    this.changed();
  }

  get levels(): string[] {
    return levels(this.ui.band);
  }

  get caseList(): Case[] {
    return this.cases;
  }

  get currentCase(): Case | null {
    return this.cases[this.ui.caseIx] ?? null;
  }

  get bead(): Bead | null {
    return this.ui.chain[this.ui.beadIx] ?? null;
  }

  get nextBead(): Bead | null {
    return this.ui.chain[this.ui.beadIx + 1] ?? null;
  }

  isSolved(id: string): boolean {
    return (this.solved[this.ui.grade] ?? []).includes(id);
  }

  get rank(): Rank {
    const mine = (this.solved[this.ui.grade] ?? []).filter((id) => this.cases.some((c) => c.id === id));
    return rankFor(mine.length, this.cases.length);
  }

  text(lines: Record<string, string | undefined>): string {
    return lineFor(lines, this.levels);
  }

  // ---------- navigation ----------
  start() {
    this.ui.phase = "cases";
    this.ui.caseSel = Math.max(0, this.cases.findIndex((c) => !this.isSolved(c.id)));
    this.ui.msg = "Pick a loose thread to chase.";
    this.audio.startMusic();
    this.changed();
  }

  toTitle() {
    this.ui.phase = "title";
    this.changed();
  }

  moveCaseSel(d: number) {
    const n = this.cases.length;
    this.ui.caseSel = (this.ui.caseSel + d + n) % n;
    this.audio.blip();
    this.changed();
  }

  chooseCase(ix: number) {
    const c = this.cases[ix];
    if (!c) return;
    this.ui.caseIx = ix;
    this.ui.caseSel = ix;
    this.ui.chain = beadsFor(c, this.ui.band);
    this.ui.phase = "brief";
    this.ui.msg = this.text(c.brief);
    this.hooks.say(this.ui.msg);
    this.changed();
  }

  beginCase() {
    this.ui.lanternMax = lanternFor(this.ui.band);
    this.ui.lantern = this.ui.lanternMax;
    this.ui.woven = 0;
    this.ui.review = null;
    this.arrive(0);
  }

  private talkersFor(dest: Bead): Talker[] {
    const f = dest.find;
    if (!f) return [];
    const lv = this.levels;
    const base: Talker[] = f.witnesses.slice(0, 2).map((w: Witness) => ({ who: w.who, look: w.look, text: lineFor(w.text, lv), kind: "clue" }));
    if (this.ui.band === "b68" && f.herring) base.push({ ...f.herring, kind: "herring" });
    if (this.ui.band === "b912" && f.unreliable) base.push({ ...f.unreliable, kind: "unreliable" });
    return shuffle(base, seeded(dest.id + this.ui.band));
  }

  private arrive(i: number) {
    const u = this.ui;
    u.beadIx = i;
    const b = this.bead!;
    const next = this.nextBead;
    u.talkers = next ? this.talkersFor(next) : [];
    u.asked = [];
    u.heard = [];
    u.plaqueRead = false;
    u.refueled = false;
    u.sel = 0;
    u.map = null;
    u.attempts = 0;
    u.deadEnd = null;
    u.sensitive = !!b.sensitive;
    u.sourcePending = this.sourceFor(b) !== null;
    u.phase = "bead";
    u.woven = Math.max(u.woven, i + 1);
    u.msg = next
      ? b.sensitive
        ? "A quiet bead. Take your time: Wick's lantern rests here."
        : "Ask a witness (1 hour each) or read the plaque (free), then open the chrono-map."
      : "This is the last bead. Re-weave the thread!";
    if (musicOn(b)) this.audio.startMusic();
    else this.audio.stopMusic();
    this.hooks.say(`${b.title}. ${place(b.place).name}, ${b.era}. ${this.text(b.fact)}`);
    this.changed();
  }

  private sourceFor(b: Bead): Question | null {
    const c = this.currentCase!;
    const qs = sourceQuestions(this.ui.grade, this.ui.band, c);
    const sc = c.sourceChecks.find((s) => s.bead === b.id && qs.some((q) => q.id === `tc-${s.id}`));
    if (!sc) return null;
    return qs.find((q) => q.id === `tc-${sc.id}`) ?? null;
  }

  // ---------- bead scene ----------
  /** Items you can select in a bead scene: talkers..., plaque, chrono-map (or re-weave). */
  get sceneItems(): number {
    return this.ui.talkers.length + 2;
  }

  moveSel(d: number) {
    const n = this.sceneItems;
    this.ui.sel = (this.ui.sel + d + n) % n;
    this.audio.blip();
    this.changed();
  }

  activate(i = this.ui.sel) {
    const n = this.ui.talkers.length;
    this.ui.sel = i;
    if (i < n) this.talk(i);
    else if (i === n) this.readPlaque();
    else this.openMap();
  }

  talk(i: number) {
    const u = this.ui;
    const t = u.talkers[i];
    const b = this.bead;
    if (!t || !b || u.phase !== "bead") return;
    if (!u.asked.includes(i)) {
      u.asked.push(i);
      u.heard.push({ who: t.who, text: t.text });
      u.lantern -= lanternCost(b, "witness");
      this.audio.blip();
    }
    this.hooks.say(`${t.who}: ${t.text}`);
    u.msg = `${t.who}: "${t.text}"`;
    if (u.lantern <= 0) return this.slip();
    this.changed();
  }

  readPlaque() {
    const u = this.ui;
    const next = this.nextBead;
    if (!next?.find || u.phase !== "bead") return;
    const text = this.text(next.find.plaque);
    if (!u.plaqueRead) {
      u.plaqueRead = true;
      u.heard.push({ who: "Plaque", text, plaque: true });
    }
    u.msg = text;
    this.hooks.say(text);
    this.audio.blip();
    this.changed();
  }

  private slip() {
    this.ui.phase = "slip";
    this.ui.msg = "Wick's lantern went out. The thread slips! Back to the last bead, lantern refilled, points kept.";
    this.audio.gameOver();
    this.hooks.say(this.ui.msg);
    this.changed();
  }

  continueAfterSlip() {
    this.ui.lantern = this.ui.lanternMax;
    this.arrive(this.ui.beadIx);
  }

  // ---------- refuel ----------
  canRefuel(): boolean {
    const u = this.ui;
    return u.phase === "bead" && !u.refueled && !u.sensitive && !!this.nextBead && u.lantern < u.lanternMax;
  }

  askRefuel() {
    if (!this.canRefuel()) return;
    this.ui.refueled = true;
    this.ask(this.refuel.draw(), "refuel", "LANTERN REFUEL: answer for +1 hour");
  }

  // ---------- questions ----------
  private ask(q: DealtQuestion, purpose: QPurpose, title: string, step?: [number, number]) {
    this.ui.q = { q, picked: null, purpose, title, step };
    this.ui.phase = "question";
    this.hooks.sayQuestion(q);
    this.changed();
  }

  answer(i: number) {
    const s = this.ui.q;
    if (!s || s.picked !== null || i < 0 || i > 3) return;
    s.picked = i;
    const right = i === s.q.answer;
    recordAnswer(GAME_ID, s.q, right);
    this.ui.log.push({ standard: s.q.standard, skill: s.q.skill, correct: right, cat: s.purpose === "refuel" || s.purpose === "transmission" ? "kit" : "case" });
    if (right) {
      this.audio.correct();
      const pts = { source: 100, refuel: 25, reweave: 50, why: 100, transmission: 100 }[s.purpose];
      this.ui.score += pts;
      if (s.purpose === "refuel") this.ui.lantern = Math.min(this.ui.lanternMax, this.ui.lantern + 1);
      if (s.purpose === "reweave") this.ui.woven = Math.min(this.ui.chain.length, this.ui.woven + 1);
    } else this.audio.wrong();
    this.hooks.say(`${right ? "Correct!" : `The answer is ${s.q.choices[s.q.answer]}.`} ${s.q.explanation}`);
    this.changed();
  }

  continueQuestion() {
    const s = this.ui.q;
    if (!s || s.picked === null) return;
    this.ui.q = null;
    switch (s.purpose) {
      case "source":
        this.ui.sourcePending = false;
        if (this.nextBead) this.openMap();
        else this.startReweave();
        return;
      case "refuel":
        this.ui.phase = "bead";
        this.ui.msg = s.picked === s.q.answer ? "The lantern glows brighter: +1 hour!" : "No refuel this time. Keep chasing!";
        this.changed();
        return;
      case "reweave":
      case "why":
        return this.nextReweave();
      case "transmission":
        this.ui.phase = "report";
        submitScore(GAME_ID, this.ui.score);
        this.changed();
        return;
    }
  }

  // ---------- chrono-map ----------
  openMap() {
    const u = this.ui;
    const b = this.bead;
    if (!b || (u.phase !== "bead" && u.phase !== "question")) return;
    if (u.sourcePending) {
      const sq = this.sourceFor(b);
      if (sq) return this.ask(deal(sq), "source", "SOURCE CHECK");
    }
    const next = this.nextBead;
    if (!next) return this.startReweave();
    const f = next.find!;
    const target = { place: next.place, year: next.year, era: next.era };
    if (!u.map) {
      const rnd = seeded(next.id + u.band + "pins");
      if (u.band === "b912") {
        const dial = buildDial(target, f, next.what, rnd);
        const view = fitView([...dial.places.map((p) => place(p.place).at as LonLat), place(b.place).at as LonLat]);
        u.map = { view, pins: dial.places, spots: layoutPins(view, dial.places.map((p) => p.place)), selected: null, dial: { ...dial, step: "place", placeIx: null }, tried: [] };
      } else {
        const pins = buildPins(target, f, rnd);
        const view = fitView([...pins.map((p) => place(p.place).at as LonLat), place(b.place).at as LonLat]);
        u.map = { view, pins, spots: layoutPins(view, pins.map((p) => p.place)), selected: null, dial: null, tried: [] };
      }
    } else {
      u.map.selected = null;
      if (u.map.dial) {
        u.map.dial.step = "place";
        u.map.dial.placeIx = null;
      }
    }
    u.phase = "map";
    u.msg =
      u.band === "b912"
        ? "Split dial: first pick the PLACE (A–D), then the ERA."
        : u.band === "b68"
          ? "Pick a pin (A–D) to see its era, then JUMP."
          : "Where and when did the thread go? Pick a pin: A, B, C or D.";
    this.hooks.say(u.msg);
    this.audio.checkpoint();
    this.changed();
  }

  closeMap() {
    if (this.ui.phase !== "map") return;
    this.ui.phase = "bead";
    this.changed();
  }

  /** A, B, C, D (index) on the map: a pin, a dial place, or a dial era. */
  pick(i: number) {
    const m = this.ui.map;
    if (!m || this.ui.phase !== "map" || i < 0 || i > 3) return;
    if (m.dial) {
      if (m.dial.step === "place") {
        const p = m.dial.places[i];
        if (!p.correct) return this.deadEnd(p.place, "", p.why);
        m.dial.placeIx = i;
        m.dial.step = "era";
        this.ui.msg = `${place(p.place).name}: right place! Now pick the ERA.`;
        this.audio.blip();
        this.hooks.say(this.ui.msg);
        return this.changed();
      }
      const e = m.dial.eras[i];
      const p = m.dial.places[m.dial.placeIx ?? 0];
      if (!e.correct) return this.deadEnd(p.place, e.era, e.why);
      return this.success();
    }
    if (this.ui.band === "b68" && m.selected !== i) {
      m.selected = i;
      const p = m.pins[i];
      this.ui.msg = `${"ABCD"[i]}: ${place(p.place).name}, ${p.era}. Press ${"ABCD"[i]} again or JUMP.`;
      this.audio.blip();
      this.hooks.say(`${place(p.place).name}, ${p.era}`);
      return this.changed();
    }
    this.jumpTo(i);
  }

  /** Confirm the selected pin (grades 6-8). */
  confirmJump() {
    const m = this.ui.map;
    if (m && m.selected !== null) this.jumpTo(m.selected);
  }

  private jumpTo(i: number) {
    const p = this.ui.map!.pins[i];
    if (!p.correct) return this.deadEnd(p.place, p.era, p.why);
    this.success();
  }

  private recordJump(correct: boolean) {
    const c = this.currentCase!;
    const from = this.bead!;
    const to = this.nextBead!;
    const m = this.ui.map!;
    const labels = (m.dial ? m.dial.places.map((p) => `${place(p.place).name}, ${to.era}`) : m.pins.map((p) => `${place(p.place).name}, ${p.era}`));
    const right = `${place(to.place).name}, ${to.era}`;
    const q = jumpQuestion(this.ui.grade, c, from, to, [right, ...labels.filter((l) => l !== right)].slice(0, 4), right);
    recordAnswer(GAME_ID, q, correct);
    this.ui.log.push({ standard: q.standard, skill: q.skill, correct, cat: "case" });
  }

  private deadEnd(pl: Bead["place"], era: string, why: string) {
    const u = this.ui;
    const b = this.bead!;
    if (u.attempts === 0) this.recordJump(false);
    u.attempts++;
    const key = `${pl}|${era}`;
    if (u.map && !u.map.tried.includes(key)) u.map.tried.push(key);
    const cost = lanternCost(b, "deadEnd");
    u.lantern -= cost;
    u.deadEnd = { place: place(pl).name, era, why, cost };
    u.misses.push({ bead: this.nextBead!.title, place: place(pl).name, era, why });
    u.phase = "deadend";
    u.msg = why;
    this.audio.wrong();
    this.hooks.say(`Dead end! ${why}`);
    this.changed();
  }

  backFromDeadEnd() {
    if (this.ui.phase !== "deadend") return;
    if (this.ui.lantern <= 0) return this.slip();
    this.ui.phase = "bead";
    this.ui.msg = "Back at the last bead. Ask another witness, or try another pin.";
    this.changed();
  }

  private success() {
    const u = this.ui;
    const firstTry = u.attempts === 0;
    if (firstTry) this.recordJump(true);
    u.score += firstTry ? 150 : 50;
    const odd = u.talkers.find((t) => t.kind !== "clue");
    const heardOdd = odd && u.heard.some((h) => h.who === odd.who);
    u.review = odd && heardOdd ? `${odd.kind === "herring" ? "Red herring" : "Unreliable witness"}: ${odd.who}. ${odd.note}` : null;
    this.audio.levelUp();
    this.arrive(u.beadIx + 1);
  }

  // ---------- re-weave ----------
  startReweave() {
    const u = this.ui;
    const c = this.currentCase!;
    const rw = reweaveQuestions(u.grade, u.band, c).map((q) => ({ q, purpose: "reweave" as const, title: "RE-WEAVE: WHAT CAME NEXT?" }));
    const why = whyQuestions(u.grade, u.band, c).map((q) => ({ q, purpose: "why" as const, title: "WHY DID IT MOVE?" }));
    u.queue = [...rw, ...why];
    u.woven = 1;
    this.audio.startMusic();
    this.nextReweave();
  }

  private nextReweave() {
    const u = this.ui;
    const item = u.queue.shift();
    if (!item) return this.solve();
    const total = u.chain.length - 1;
    const done = total - u.queue.filter((x) => x.purpose === "reweave").length;
    this.ask(deal(item.q), item.purpose, item.title, item.purpose === "reweave" ? [done, total] : undefined);
  }

  private solve() {
    const u = this.ui;
    const c = this.currentCase!;
    u.woven = u.chain.length;
    const bonus = Math.max(0, u.lantern) * 20 + 300;
    u.score += bonus;
    if (!u.solvedNow.includes(c.id)) u.solvedNow.push(c.id);
    const mine = this.solved[u.grade] ?? [];
    if (!mine.includes(c.id)) this.solved[u.grade] = [...mine, c.id];
    saveSolved(this.solved);
    submitScore(GAME_ID, u.score);
    u.phase = "solved";
    u.msg = `Thread re-woven! Knot is caught (gently) and wound back onto the Loom. +${bonus} points.`;
    this.audio.levelUp();
    this.hooks.say(u.msg);
    this.changed();
  }

  /** After a solved case: a transmission (kit question at the player's own grade), then the report. */
  transmission() {
    this.ask(this.refuel.draw(), "transmission", "TRANSMISSION FROM THE LONG ARCHIVE");
  }

  nextCase() {
    const n = this.cases.length;
    let ix = this.cases.findIndex((c, i) => i > this.ui.caseIx && !this.isSolved(c.id));
    if (ix < 0) ix = this.cases.findIndex((c) => !this.isSolved(c.id));
    if (ix < 0) ix = (this.ui.caseIx + 1) % n;
    this.chooseCase(ix);
  }

  toCases() {
    this.ui.phase = "cases";
    this.changed();
  }

  // ---------- report ----------
  reportRows(cat: LogEntry["cat"]) {
    const m = new Map<string, { std: string; skill: string; n: number; c: number }>();
    for (const l of this.ui.log.filter((x) => x.cat === cat)) {
      const k = `${l.standard}|${l.skill}`;
      const cur = m.get(k) ?? { std: l.standard, skill: l.skill, n: 0, c: 0 };
      cur.n++;
      if (l.correct) cur.c++;
      m.set(k, cur);
    }
    return [...m.values()].sort((a, b) => Object.values(SKILL_NAMES).indexOf(a.skill) - Object.values(SKILL_NAMES).indexOf(b.skill));
  }

  /** Debug/test helpers (?debug). */
  debugAnswer(): number {
    return this.ui.q?.q.answer ?? -1;
  }
  debugRightPin(): number {
    const m = this.ui.map;
    if (!m) return -1;
    if (m.dial) return m.dial.step === "place" ? m.dial.places.findIndex((p) => p.correct) : m.dial.eras.findIndex((e) => e.correct);
    return m.pins.findIndex((p) => p.correct);
  }
  debugWrongPin(): number {
    const m = this.ui.map;
    if (!m) return -1;
    if (m.dial) return m.dial.step === "place" ? m.dial.places.findIndex((p) => !p.correct) : m.dial.eras.findIndex((e) => !e.correct);
    return m.pins.findIndex((p) => !p.correct);
  }
}

export function gradeOk(g: Grade): boolean {
  return gradeNumber(g) >= 5;
}

export function allCases() {
  return CASES;
}

export { BAND_RULES };
