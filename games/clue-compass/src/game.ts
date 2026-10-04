/*
 * Clue Compass game controller: missions of 2–3 cases, the chase itself (via CaseRun), travel
 * animations on the Screen, transmissions from the kit deck between cases, scoring, recording
 * answers by standard, and the mission report. React reads `ui` and calls the methods.
 */
import { ChipAudio, QuestionDeck, recordAnswer, submitScore, type DealtQuestion, type Grade, type Question } from "@/kit";
import { CaseRun } from "@/chase/session";
import type { CaseDef } from "@/chase/types";
import { BAND_CONFIG, COST, WORLD, bandOf, casesFor, elaFor, stdFor } from "@/data/bands";
import type { Band } from "@/data/cases";
import type { Screen, View } from "@/gfx/render";

export const GAME_ID = "clue-compass";
const SOLVED_KEY = "arcade.clue-compass.solved.v1";

export type Phase = "title" | "brief" | "stop" | "travel" | "deadend" | "found" | "escaped" | "transmission" | "report";

export interface LogEntry {
  cat: "case" | "reading" | "transmission";
  standard: string;
  skill: string;
  correct: boolean;
}

export interface CaseResult {
  id: string;
  title: string;
  solved: boolean;
  mistakes: number;
  lessons: string[];
}

export interface UiState {
  grade: Grade;
  band: Band;
  phase: Phase;
  view: "scene" | "map";
  mission: CaseDef[];
  caseIdx: number;
  run: CaseRun | null;
  focus: number;
  talking: number;
  lastClue: { text: string; icon?: string } | null;
  newNote: boolean;
  score: number;
  log: LogEntry[];
  results: CaseResult[];
  q: { q: DealtQuestion; picked: number | null } | null;
  /** The destination picked last (for the travel/dead-end text). */
  lastPick: string | null;
}

export interface GameHooks {
  say: (text: string) => void;
  onChange: () => void;
}

export function loadSolved(): Set<string> {
  try {
    const raw = localStorage.getItem(SOLVED_KEY);
    if (raw) return new Set(JSON.parse(raw) as string[]);
  } catch {
    // ignore
  }
  return new Set();
}

function saveSolved(s: Set<string>) {
  try {
    localStorage.setItem(SOLVED_KEY, JSON.stringify([...s]));
  } catch {
    // ignore
  }
}

export class Game {
  screen: Screen | null = null;
  fast = false;
  ui: UiState;
  private deck: QuestionDeck;
  private legMiss = 0;
  private lessons: string[] = [];

  constructor(private audio: ChipAudio, private hooks: GameHooks, grade: Grade) {
    this.ui = this.fresh(grade);
    this.deck = new QuestionDeck(grade, "social", { gameId: GAME_ID });
  }

  private fresh(grade: Grade): UiState {
    return {
      grade, band: bandOf(grade), phase: "title", view: "scene", mission: [], caseIdx: 0, run: null, focus: 0, talking: -1,
      lastClue: null, newNote: false, score: 0, log: [], results: [], q: null, lastPick: null,
    };
  }

  private changed() {
    this.paint();
    this.hooks.onChange();
  }

  setGrade(g: Grade) {
    this.ui = this.fresh(g);
    this.deck = new QuestionDeck(g, "social", { gameId: GAME_ID });
    this.changed();
  }

  get config() {
    return BAND_CONFIG[this.ui.band];
  }

  get current(): CaseDef | null {
    return this.ui.mission[this.ui.caseIdx] ?? null;
  }

  // ------------------------------------------------------------------ mission flow
  /** Start a mission at a case (default: the first unsolved one in this band). */
  start(caseId?: string) {
    const list = casesFor(this.ui.band);
    const solved = loadSolved();
    let at = caseId ? list.findIndex((c) => c.id === caseId) : list.findIndex((c) => !solved.has(c.id));
    if (at < 0) at = 0;
    const mission: CaseDef[] = [];
    for (let i = 0; i < this.config.perMission; i++) mission.push(list[(at + i) % list.length]);
    this.ui = { ...this.fresh(this.ui.grade), mission };
    this.beginCase();
  }

  private beginCase() {
    const c = this.current!;
    const cfg = this.config;
    this.ui.run = new CaseRun(c, WORLD, cfg.charges(c.stops.length - 1), COST, cfg.pictures);
    this.ui.phase = "brief";
    this.ui.view = "scene";
    this.ui.lastClue = null;
    this.ui.focus = 0;
    this.ui.talking = -1;
    this.legMiss = 0;
    this.lessons = [];
    this.audio.checkpoint();
    this.hooks.say(`${c.title}. ${c.brief}`);
    this.changed();
  }

  startChase() {
    if (this.ui.phase !== "brief") return;
    this.ui.phase = "stop";
    this.arrived(true);
  }

  private arrived(first: boolean) {
    const run = this.ui.run!;
    this.ui.view = "scene";
    this.ui.focus = 0;
    this.ui.talking = -1;
    this.ui.lastClue = null;
    this.ui.newNote = run.stop < run.c.traits.length;
    const here = run.here;
    const pic = this.config.pictures;
    let line = first ? `You are at ${here.name}.` : `You made it to ${here.name}!`;
    if (this.ui.newNote) line += pic ? " Pocket left an I O U note. It's in your notebook." : " Pocket left an IOU note: a clue about the hideout!";
    if (run.finalPick) line += pic ? " Use your notebook to find Pocket's hideout!" : " Check your notebook and pick Pocket's hideout.";
    else line += pic ? " Tap a helper to hear a clue." : " Question the witnesses.";
    this.hooks.say(line + (this.ui.newNote ? ` ${run.notebook[run.notebook.length - 1].text}` : ""));
    this.changed();
  }

  /** Talk to witness i (keyboard focus or a tap). */
  talk(i: number) {
    const run = this.ui.run;
    if (!run || this.ui.phase !== "stop" || !run.witnesses[i]) return;
    run.talk(i);
    const w = run.witnesses[i];
    this.ui.focus = i;
    this.ui.talking = i;
    this.ui.view = "scene";
    this.ui.lastClue = { text: w.text, icon: w.icon };
    this.audio.blip();
    this.hooks.say(w.text);
    if (run.phase === "escaped") this.escaped();
    else this.changed();
  }

  moveFocus(d: number) {
    const run = this.ui.run;
    if (!run || this.ui.phase !== "stop" || !run.witnesses.length) return;
    const n = run.witnesses.length;
    this.ui.focus = (this.ui.focus + d + n) % n;
    this.changed();
  }

  toggleView(v?: "scene" | "map") {
    if (this.ui.phase !== "stop") return;
    this.ui.view = v ?? (this.ui.view === "scene" ? "map" : "scene");
    this.changed();
  }

  /** Pick destination i (0–3, A–D). */
  choose(i: number) {
    const run = this.ui.run;
    if (!run || this.ui.phase !== "stop") return;
    const id = run.options[i];
    if (!id || run.tried.has(id)) return;
    this.chooseId(id);
  }

  chooseId(id: string) {
    const run = this.ui.run;
    if (!run || this.ui.phase !== "stop") return;
    const from = run.here;
    const leg = run.stop;
    const final = run.finalPick;
    const res = run.travel(id);
    if (res === "none") return;
    const to = WORLD.get(id);
    this.ui.lastPick = id;
    if (res === "wrong") {
      this.legMiss++;
      this.lessons.push(`${to.name}: ${run.lesson}`);
      this.audio.wrong();
    } else {
      this.recordLeg(run, leg, this.legMiss === 0, final);
      this.legMiss = 0;
      this.audio.jump();
    }
    this.ui.phase = "travel";
    this.ui.view = "map";
    this.hooks.say(this.config.pictures ? `Flying to ${to.name}!` : `Traveling to ${to.name}…`);
    this.animate(from, to, () => {
      if (res === "wrong") {
        if (run.phase === "escaped") return this.escaped();
        this.ui.phase = "deadend";
        this.ui.view = "scene";
        this.hooks.say(`${to.local}: ${run.lesson}`);
        this.changed();
      } else if (res === "found") {
        this.found();
      } else if (run.phase === "escaped") {
        this.escaped();
      } else {
        this.ui.phase = "stop";
        this.arrived(false);
      }
    });
  }

  /** Fly back from a dead end. */
  back() {
    const run = this.ui.run;
    if (!run || this.ui.phase !== "deadend") return;
    const from = run.wrongAt!;
    run.back();
    this.ui.phase = "travel";
    this.ui.view = "map";
    this.animate(from, run.here, () => {
      this.ui.phase = "stop";
      this.ui.view = "scene";
      this.ui.talking = -1;
      this.hooks.say(`Back at ${run.here.name}. Look at the clues again.`);
      this.changed();
    }, 0.6);
  }

  private animate(from: import("@/chase/types").Place, to: import("@/chase/types").Place, done: () => void, dur = 1.2) {
    const s = this.screen;
    this.changed();
    if (!s) {
      done();
      return;
    }
    const d = this.fast ? 0.15 : dur;
    s.onTravelDone = done;
    s.set(this.mapView({ from, to, start: s.t, dur: d }));
  }

  private recordLeg(run: CaseRun, leg: number, correct: boolean, final: boolean) {
    const g = this.ui.grade;
    const refs = final ? run.c.traits : run.c.legs[leg].clues;
    const key = final ? "map" : refs[0].split("=")[0];
    const std = stdFor(g, run.c.map, final && this.ui.band !== "K" ? refs[0].split("=")[0] : key);
    const ch = run.choices[run.choices.length - 1];
    const q = this.syntheticQ(std.code, std.skill, `${run.c.id}-${leg}`);
    recordAnswer(GAME_ID, q, correct);
    this.ui.log.push({ cat: "case", standard: std.code, skill: std.skill, correct });
    for (const e of elaFor(g, !!ch?.vocab)) {
      recordAnswer(GAME_ID, this.syntheticQ(e.code, e.skill, `${run.c.id}-${leg}-ela`), correct);
      this.ui.log.push({ cat: "reading", standard: e.code, skill: e.skill, correct });
    }
    this.ui.score += correct ? 100 : 50;
  }

  private syntheticQ(standard: string, skill: string, id: string): Question {
    return {
      id: `cc-${id}`, subject: "social", grade: this.ui.grade, standard, skill, prompt: "Where did Pocket go?",
      choices: ["", "", "", ""], answer: 0, explanation: "",
    };
  }

  private found() {
    const run = this.ui.run!;
    this.ui.phase = "found";
    this.ui.view = "scene";
    const bonus = run.charges === null ? 200 : run.charges * 15;
    this.ui.score += 300 + bonus;
    this.ui.results.push({ id: run.c.id, title: run.c.title, solved: true, mistakes: run.mistakes, lessons: this.lessons });
    const solved = loadSolved();
    solved.add(run.c.id);
    saveSolved(solved);
    this.audio.levelUp();
    this.hooks.say(`Gotcha, Pocket! You found the hideout at ${run.hideout.name}. Pocket says: ${run.c.end}`);
    this.changed();
  }

  private escaped() {
    const run = this.ui.run!;
    this.ui.phase = "escaped";
    this.ui.view = "scene";
    this.ui.results.push({ id: run.c.id, title: run.c.title, solved: false, mistakes: run.mistakes, lessons: this.lessons });
    this.audio.gameOver();
    this.hooks.say(`Out of compass charges! Pocket zipped away, but left ${run.c.item} behind with a sorry note. The hideout was ${run.hideout.name}.`);
    this.changed();
  }

  /** After a catch (or escape): a transmission, then the next case or the report. */
  next() {
    if (this.ui.phase !== "found" && this.ui.phase !== "escaped") return;
    if (this.ui.caseIdx + 1 < this.ui.mission.length) {
      this.transmission();
    } else this.report();
  }

  private transmission() {
    this.ui.phase = "transmission";
    this.ui.q = { q: this.deck.draw(), picked: null };
    this.audio.checkpoint();
    this.changed();
  }

  answer(i: number) {
    const q = this.ui.q;
    if (!q || q.picked !== null || this.ui.phase !== "transmission" || i < 0 || i > 3) return;
    q.picked = i;
    const ok = i === q.q.answer;
    recordAnswer(GAME_ID, q.q, ok);
    this.ui.log.push({ cat: "transmission", standard: q.q.standard, skill: q.q.skill, correct: ok });
    if (ok) {
      this.ui.score += 150;
      this.audio.correct();
    } else this.audio.wrong();
    this.hooks.say(`${ok ? "Correct!" : `The answer is ${"ABCD"[q.q.answer]}: ${q.q.choices[q.q.answer]}.`} ${q.q.explanation}`);
    this.changed();
  }

  continueTransmission() {
    if (this.ui.phase !== "transmission" || !this.ui.q || this.ui.q.picked === null) return;
    this.ui.q = null;
    this.ui.caseIdx++;
    this.beginCase();
  }

  private report() {
    this.ui.phase = "report";
    submitScore(GAME_ID, this.ui.score);
    this.audio.gameOver();
    const solved = this.ui.results.filter((r) => r.solved).length;
    this.hooks.say(`Mission report. You solved ${solved} of ${this.ui.results.length} cases. Score ${this.ui.score}.`);
    this.changed();
  }

  toTitle() {
    this.ui = this.fresh(this.ui.grade);
    this.changed();
  }

  // ------------------------------------------------------------------ drawing
  private mapView(travel: { from: import("@/chase/types").Place; to: import("@/chase/types").Place; start: number; dur: number } | null): View {
    const run = this.ui.run!;
    return {
      kind: "map",
      map: run.c.map,
      here: travel ? travel.from : run.here,
      options: travel ? [] : run.options.map((id, i) => ({ place: WORLD.get(id), letter: "ABCD"[i], tried: run.tried.has(id) })),
      travel,
      showNames: false,
      backdrop: run.c.map === "town" ? [...WORLD.places.values()].filter((p) => p.map === "town") : [],
    };
  }

  paint() {
    const s = this.screen;
    if (!s) return;
    const u = this.ui;
    const run = u.run;
    if (u.phase === "title" || u.phase === "report" || !run) {
      s.set({ kind: "title" }, null);
      return;
    }
    const hud = { title: run.c.title, charges: run.charges, max: run.startCharges };
    if (u.phase === "brief") return s.set({ kind: "brief", itemIcon: run.c.itemIcon, title: run.c.title }, hud);
    if (u.phase === "travel") {
      s.hud = hud;
      return; // the travel animation view is already set
    }
    if (u.phase === "transmission") return s.set({ kind: "brief", itemIcon: "letter", title: "TRANSMISSION" }, { ...hud, title: "TRANSMISSION FROM PIP" });
    if (u.view === "map" && u.phase === "stop") return s.set(this.mapView(null), hud);
    const place = u.phase === "deadend" ? run.wrongAt! : u.phase === "found" || u.phase === "escaped" ? run.hideout : run.here;
    s.set(
      {
        kind: "scene",
        place,
        witnesses: run.witnesses.map((w) => ({ heard: w.heard })),
        focus: u.phase === "stop" ? u.focus : -1,
        talking: u.talking,
        note: u.phase === "stop" && u.newNote,
        local: u.phase === "deadend",
        pocket: u.phase === "found" ? "caught" : u.phase === "escaped" ? "gone" : "none",
        itemIcon: run.c.itemIcon,
        seed: run.stop + run.c.id.length * 3,
      },
      hud,
    );
  }
}
