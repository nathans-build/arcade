/*
 * The game controller: runs a Match, acts as the screen for every LocalHumanPlayer
 * (placement, shot questions, power-up questions, aiming, cover screens), animates
 * events on the SonarScreen and keeps per-player stats for the mission report.
 * React reads `ui` and calls the intent methods; nothing here touches the DOM directly.
 */
import { ChipAudio, QuestionDeck, gradeNumber, isEarlyReader, recordAnswer, submitScore, type DealtQuestion, type Grade, type Subject, type SubjectMode } from "@/kit";
import { type AiLevel } from "./ai";
import { makeChallenge, type Challenge } from "./challenge";
import { FLEET, HIT, UNKNOWN, fits, idx, onBoard, randomFleet, shipCells, type Coord, type Orient, type Placement, type ShipDef } from "./core";
import { Match, type MatchEvent, type PowerUp, type TurnAction, type TurnView } from "./match";
import { boardSize, formatCoord, parseCoord, schemeFor, spokenCoord, type Scheme } from "./notation";
import { ComputerPlayer, LocalHumanPlayer, type HumanSeatUI } from "./players";
import { PAL } from "./sprites";
import { SonarScreen, type BoardModel, type Scene } from "./render";

export const GAME_ID = "sonar-squad";

export type PlayMode = "cpu" | "pass";
export type GameMode = SubjectMode | "all";

export type Phase = "title" | "cover" | "place" | "question" | "aim" | "powerpick" | "sonarAim" | "busy" | "over";

export interface LogEntry {
  cat: "shot" | "power" | "coord";
  subject: string;
  standard: string;
  skill: string;
  correct: boolean;
}

export interface SeatStats {
  name: string;
  shots: number;
  hits: number;
  sunk: string[];
  jams: number;
  score: number;
  powers: number;
  log: LogEntry[];
  missStreak: number;
}

export interface QState {
  q: DealtQuestion;
  purpose: "shot" | "power";
  power?: PowerUp;
  picked: number | null;
  /** This is the K-2 second try. */
  retry: boolean;
  /** A wrong answer will get another (different) question. */
  willRetry: boolean;
}

export interface UiState {
  phase: Phase;
  mode: PlayMode;
  grade: Grade;
  scheme: Scheme;
  size: number;
  seat: number;
  viewer: number;
  bigSide: "target" | "own";
  coverSeat: number;
  coverWhy: "place" | "turn";
  q: QState | null;
  msg: { text: string; tone: "ok" | "no" | "info" };
  aim: Coord;
  sonarAim: Coord;
  typed: string;
  placing: { placed: Placement[]; current: string | null; orient: Orient; cursor: Coord };
  charge: number[];
  chargeNeeded: number[];
  shotsLeft: number;
  challenge: Challenge | null;
  cpuLevel: AiLevel;
  stats: SeatStats[];
  winner: number;
  turn: number;
  hint: Coord | null;
  canRepair: boolean;
}

/** Default computer level by grade band: K-5 Easy, 6-12 Medium (Hard is always selectable). */
export function defaultLevel(g: Grade): AiLevel {
  return gradeNumber(g) <= 5 ? "easy" : "medium";
}

/** Shot questions come from one grade below (K stays K). */
export function shotGrade(g: Grade): Grade {
  const n = gradeNumber(g);
  return n <= 0 ? "K" : n === 1 ? "K" : (String(n - 1) as Grade);
}

export function subjectsFor(m: GameMode): SubjectMode | Subject[] {
  return m === "all" ? ["math", "science", "ela", "social"] : m;
}

const POWER_NAMES: Record<PowerUp, string> = { sonar: "SONAR SWEEP", double: "DOUBLE SHOT", repair: "REPAIR CREW" };

function freshStats(name: string): SeatStats {
  return { name, shots: 0, hits: 0, sunk: [], jams: 0, score: 0, powers: 0, log: [], missStreak: 0 };
}

export interface GameHooks {
  say(text: string): void;
  sayQuestion(q: DealtQuestion): void;
  onChange(): void;
}

export class SonarGame implements HumanSeatUI {
  screen: SonarScreen | null = null;
  match: Match | null = null;
  ui: UiState;
  private decks: { shot: QuestionDeck; power: QuestionDeck }[] = [];
  private pendingAction: ((a: TurnAction) => void) | null = null;
  private pendingPlace: ((p: Placement[]) => void) | null = null;
  private pendingCover: (() => void) | null = null;
  private pendingQ: ((correct: boolean) => void) | null = null;
  private qTimer = 0;

  private firstShotOfTurn = false;
  private lastChallengeTurn = -10;
  private paused = false;
  private pauseWaiters: (() => void)[] = [];
  private drag: { picked: Placement | null; offset: number; start: Coord; moved: boolean } | null = null;
  fast = false;
  cpu: ComputerPlayer | null = null;
  /** Debug only: make the computer fire at my ships (to test losing). */
  cpuOracle = false;
  private gen = 0;

  constructor(private audio: ChipAudio, private hooks: GameHooks, grade: Grade) {
    this.ui = this.baseUi(grade, "cpu", defaultLevel(grade));
  }

  private baseUi(grade: Grade, mode: PlayMode, cpuLevel: AiLevel): UiState {
    const scheme = schemeFor(grade);
    const size = boardSize(scheme);
    const mid = Math.floor(size / 2);
    return {
      phase: "title", mode, grade, scheme, size, seat: 0, viewer: 0, bigSide: "target", coverSeat: 0, coverWhy: "place",
      q: null, msg: { text: "", tone: "info" }, aim: { r: mid, c: mid }, sonarAim: { r: mid, c: mid }, typed: "",
      placing: { placed: [], current: FLEET[0].id, orient: "h", cursor: { r: 0, c: 0 } },
      charge: [0, 0], chargeNeeded: [3, 3], shotsLeft: 0, challenge: null, cpuLevel, stats: [freshStats("You"), freshStats("Computer")],
      winner: -1, turn: 0, hint: null, canRepair: false,
    };
  }

  private changed() {
    this.hooks.onChange();
  }

  get early() {
    return isEarlyReader(this.ui.grade);
  }

  /* ------------------------------ scene for the renderer ------------------------------ */

  scene = (): Scene => {
    const u = this.ui;
    const m = this.match;
    const base: Scene = {
      mode: u.phase === "title" ? "title" : u.phase === "cover" ? "cover" : "play",
      scheme: u.scheme, size: u.size, big: null, small: null, smallTitle: "", bigTitle: "", cursor: null, cursorKind: null,
      ghost: null, hint: null, aimLabel: "", enemyFleet: FLEET.map((def) => ({ def, sunk: false })), status: "", statusColor: PAL.white,
    };
    if (u.phase === "title" || !m) {
      base.big = this.demoBoard();
      base.small = { own: true, marks: new Array(u.size * u.size).fill(0), ships: [] };
      base.smallTitle = "YOUR FLEET";
      base.bigTitle = "SONAR SQUAD";
      base.cursor = u.aim;
      base.cursorKind = "aim";
      base.aimLabel = formatCoord(u.scheme, u.aim);
      return base;
    }
    const v = u.viewer;
    const target: BoardModel = {
      own: false,
      marks: m.shots[v],
      sonar: m.sonar[v],
      ships: m.fleets[1 - v] ? m.fleets[1 - v].ships.filter((s) => m.fleets[1 - v].isSunk(s) || u.phase === "over").map((s) => ({ def: s.def, place: s.place, sunk: m.fleets[1 - v].isSunk(s) })) : [],
    };
    const ownShips = u.phase === "place" ? u.placing.placed.map((p) => ({ def: FLEET.find((d) => d.id === p.id)!, place: p, sunk: false })) : m.fleets[v] ? m.fleets[v].ships.map((s) => ({ def: s.def, place: s.place, sunk: m.fleets[v].isSunk(s) })) : [];
    const own: BoardModel = { own: true, marks: m.shots[1 - v], ships: ownShips };
    if (u.phase === "place") {
      base.big = { own: true, marks: new Array(u.size * u.size).fill(0), ships: ownShips };
      base.small = { own: false, marks: new Array(u.size * u.size).fill(0), ships: [] };
      base.smallTitle = "ENEMY WATERS";
      base.bigTitle = "PLACE YOUR FLEET";
      const cur = u.placing.current ? FLEET.find((d) => d.id === u.placing.current)! : null;
      if (cur) {
        base.ghost = { def: cur, anchor: u.placing.cursor, o: u.placing.orient, ok: this.placeOk(cur, u.placing.cursor, u.placing.orient) };
        base.cursor = u.placing.cursor;
        base.cursorKind = "place";
      }
      base.aimLabel = cur ? formatCoord(u.scheme, u.placing.cursor) : "";
      base.status = cur ? cur.name.toUpperCase() : "READY?";
      base.statusColor = PAL.green;
      return base;
    }
    if (u.bigSide === "target") {
      base.big = target;
      base.small = own;
      base.smallTitle = u.mode === "pass" ? `P${v + 1} FLEET` : "YOUR FLEET";
      base.bigTitle = "ENEMY WATERS";
    } else {
      base.big = own;
      base.small = target;
      base.smallTitle = "ENEMY WATERS";
      base.bigTitle = u.mode === "pass" ? `P${v + 1} FLEET` : "YOUR FLEET";
    }
    if (m.fleets[1 - v]) base.enemyFleet = m.fleets[1 - v].ships.map((s) => ({ def: s.def, sunk: m.fleets[1 - v].isSunk(s) }));
    if (u.bigSide === "target" && (u.phase === "aim" || u.phase === "question" || u.phase === "powerpick" || u.phase === "busy")) {
      base.cursor = u.aim;
      base.cursorKind = u.phase === "busy" ? null : "aim";
      base.aimLabel = formatCoord(u.scheme, u.aim);
      base.hint = u.hint;
    }
    if (u.phase === "sonarAim") {
      base.cursor = u.sonarAim;
      base.cursorKind = "sonar";
      base.aimLabel = formatCoord(u.scheme, u.sonarAim);
    }
    if (u.mode === "pass") base.status = `PLAYER ${u.seat + 1}`;
    else base.status = u.seat === 0 ? "YOUR TURN" : "ENEMY TURN";
    base.statusColor = u.seat === 0 ? PAL.yellow : PAL.red;
    return base;
  };

  private demoFleet: Placement[] | null = null;
  private demoBoard(): BoardModel {
    const u = this.ui;
    if (!this.demoFleet || this.demoFleet.some((p) => !onBoard(u.size, p.r, p.c))) this.demoFleet = randomFleet(u.size, Math.random, true);
    const marks = new Array(u.size * u.size).fill(0);
    return { own: true, marks, ships: this.demoFleet.map((p) => ({ def: FLEET.find((d) => d.id === p.id)!, place: p, sunk: false })) };
  }

  /* ------------------------------ setup ------------------------------ */

  setGrade(g: Grade) {
    if (this.ui.phase !== "title") return;
    const lvl = defaultLevel(g);
    this.ui = this.baseUi(g, this.ui.mode, lvl);
    this.demoFleet = null;
    this.changed();
  }

  setMode(m: PlayMode) {
    this.ui.mode = m;
    this.changed();
  }

  setCpuLevel(l: AiLevel) {
    this.ui.cpuLevel = l;
    if (this.cpu) this.cpu.level = l;
    this.changed();
  }

  async start(subject: GameMode) {
    this.stopMatch();
    const gen = ++this.gen;
    const u = this.ui;
    const keepMode = u.mode;
    const keepLevel = u.cpuLevel;
    this.ui = this.baseUi(u.grade, keepMode, keepLevel);
    const g = this.ui.grade;
    const early = this.early;
    const mode = subjectsFor(subject);
    this.decks = [0, 1].map(() => ({
      shot: new QuestionDeck(shotGrade(g), mode, { gameId: GAME_ID, quickOnly: true }),
      power: new QuestionDeck(g, mode, { gameId: GAME_ID }),
    }));
    this.ui.stats = keepMode === "pass" ? [freshStats("Player 1"), freshStats("Player 2")] : [freshStats("You"), freshStats("Computer")];
    // K-2: power-ups charge every 2 turns and start full (extra sonar).
    this.ui.chargeNeeded = early ? [2, 2] : [3, 3];
    const startCharge = early ? [1, 1] : [0, 0];
    const p0 = new LocalHumanPlayer(0, this);
    let p1;
    if (keepMode === "pass") {
      p1 = new LocalHumanPlayer(1, this);
      this.cpu = null;
    } else {
      this.cpu = new ComputerPlayer(keepLevel, Math.random, {
        thinkMs: 0,
        gate: () => this.whenUnpaused(),
        override: (v) => {
          if (!this.cpuOracle || !this.match) return null;
          const f = this.match.fleets[0];
          const i = f.at.findIndex((si, k) => si >= 0 && v.shots[k] === UNKNOWN);
          return i >= 0 ? { r: Math.floor(i / v.size), c: i % v.size } : null;
        },
      });
      p1 = this.cpu;
    }
    this.match = new Match(this.ui.size, [p0, p1], {
      chargeNeeded: this.ui.chargeNeeded,
      startCharge,
      first: 0,
      onEvent: (ev) => (gen === this.gen ? this.onEvent(ev) : undefined),
    });
    this.screen?.clearEffects();
    this.changed();
    try {
      const winner = await this.match.run();
      if (gen !== this.gen) return;
      this.finish(winner);
    } catch (e) {
      if (gen === this.gen) console.error(e);
    }
  }

  stopMatch() {
    this.gen++;
    this.match?.stop();
    this.match = null;
    this.pendingAction = this.pendingPlace = this.pendingCover = this.pendingQ = null;
    window.clearTimeout(this.qTimer);
  }

  toTitle() {
    this.stopMatch();
    this.ui = this.baseUi(this.ui.grade, this.ui.mode, this.ui.cpuLevel);
    this.changed();
  }

  /* ------------------------------ pause ------------------------------ */

  setPaused(p: boolean) {
    this.paused = p;
    if (this.screen) this.screen.paused = p;
    if (!p) {
      const w = this.pauseWaiters;
      this.pauseWaiters = [];
      w.forEach((f) => f());
    }
  }

  whenUnpaused(): Promise<void> {
    if (!this.paused) return Promise.resolve();
    return new Promise((r) => this.pauseWaiters.push(r));
  }

  private wait(ms: number) {
    if (this.screen) return this.screen.wait(this.fast ? ms / 8 : ms);
    return new Promise<void>((r) => setTimeout(r, ms));
  }

  /* ------------------------------ cover screens (pass-and-play) ------------------------------ */

  private async ensureViewer(seat: number, why: "place" | "turn") {
    const u = this.ui;
    u.seat = seat;
    if (u.mode !== "pass") {
      u.viewer = 0;
      return;
    }
    if (u.viewer === seat && why === "turn") return;
    u.phase = "cover";
    u.coverSeat = seat;
    u.coverWhy = why;
    this.changed();
    this.hooks.say(`Pass to Player ${seat + 1}. Don't peek!`);
    await new Promise<void>((r) => (this.pendingCover = r));
    u.viewer = seat;
  }

  coverReady() {
    if (this.ui.phase !== "cover" || !this.pendingCover) return;
    this.audio.blip();
    const r = this.pendingCover;
    this.pendingCover = null;
    r();
  }

  /* ------------------------------ placement ------------------------------ */

  placeFleet(seat: number): Promise<Placement[]> {
    return (async () => {
      await this.ensureViewer(seat, "place");
      const u = this.ui;
      u.placing = { placed: [], current: FLEET[0].id, orient: "h", cursor: { r: 0, c: 0 } };
      u.phase = "place";
      u.bigSide = "own";
      u.msg = { text: this.early ? "Tap the water to put your ships. R or ROTATE turns a ship. AUTO places them all." : "Place your fleet: tap or drag ships, arrows + Space, R rotates, AUTO places them all.", tone: "info" };
      this.hooks.say(u.mode === "pass" ? `Player ${seat + 1}, place your ships.` : "Place your ships.");
      this.changed();
      return new Promise<Placement[]>((r) => (this.pendingPlace = r));
    })();
  }

  private takenExcept(id: string | null): Set<number> {
    const u = this.ui;
    const s = new Set<number>();
    for (const p of u.placing.placed) {
      if (p.id === id) continue;
      const d = FLEET.find((f) => f.id === p.id)!;
      shipCells(p, d.len).forEach((c) => s.add(idx(u.size, c.r, c.c)));
    }
    return s;
  }

  private placeOk(def: ShipDef, at: Coord, o: Orient) {
    return fits(this.ui.size, this.takenExcept(def.id), at.r, at.c, o, def.len);
  }

  private clampAnchor(def: ShipDef, at: Coord, o: Orient): Coord {
    const n = this.ui.size;
    const maxR = o === "v" ? n - def.len : n - 1;
    const maxC = o === "h" ? n - def.len : n - 1;
    return { r: Math.max(0, Math.min(maxR, at.r)), c: Math.max(0, Math.min(maxC, at.c)) };
  }

  private currentDef(): ShipDef | null {
    const id = this.ui.placing.current;
    return id ? FLEET.find((d) => d.id === id)! : null;
  }

  private nextUnplaced(): string | null {
    const ids = new Set(this.ui.placing.placed.map((p) => p.id));
    return FLEET.find((d) => !ids.has(d.id))?.id ?? null;
  }

  placeMove(dr: number, dc: number) {
    const p = this.ui.placing;
    const d = this.currentDef();
    if (this.ui.phase !== "place" || !d) return;
    p.cursor = this.clampAnchor(d, { r: p.cursor.r + dr, c: p.cursor.c + dc }, p.orient);
    this.audio.blip();
    this.changed();
  }

  rotate() {
    const p = this.ui.placing;
    const d = this.currentDef();
    if (this.ui.phase !== "place") return;
    if (!d) {
      // Nothing in hand: rotate the last placed ship if it fits.
      const last = p.placed[p.placed.length - 1];
      if (!last) return;
      const def = FLEET.find((f) => f.id === last.id)!;
      const o: Orient = last.o === "h" ? "v" : "h";
      if (fits(this.ui.size, this.takenExcept(last.id), last.r, last.c, o, def.len)) last.o = o;
      this.changed();
      return;
    }
    p.orient = p.orient === "h" ? "v" : "h";
    p.cursor = this.clampAnchor(d, p.cursor, p.orient);
    this.audio.blip();
    this.changed();
  }

  placeHere(): boolean {
    const p = this.ui.placing;
    const d = this.currentDef();
    if (this.ui.phase !== "place" || !d) return false;
    if (!this.placeOk(d, p.cursor, p.orient)) {
      this.ui.msg = { text: `The ${d.name} doesn't fit there. Try another spot or rotate.`, tone: "no" };
      this.audio.wrong();
      this.changed();
      return false;
    }
    p.placed = p.placed.filter((x) => x.id !== d.id).concat({ id: d.id, r: p.cursor.r, c: p.cursor.c, o: p.orient });
    p.current = this.nextUnplaced();
    this.audio.tone(520, 0.08, "square", 0.3);
    const nd = this.currentDef();
    if (nd) p.cursor = this.clampAnchor(nd, p.cursor, p.orient);
    this.ui.msg = nd ? { text: `${d.name} placed. Next: the ${nd.name} (${nd.len} long).`, tone: "ok" } : { text: "Fleet ready! Press READY (Enter), or tap a ship to turn it.", tone: "ok" };
    this.changed();
    return true;
  }

  autoPlace() {
    if (this.ui.phase !== "place") return;
    this.ui.placing.placed = randomFleet(this.ui.size, Math.random, true);
    this.ui.placing.current = null;
    this.ui.msg = { text: "AUTO placed your fleet. Press READY, or drag ships to move them.", tone: "ok" };
    this.audio.blip();
    this.changed();
  }

  undoPlace() {
    const p = this.ui.placing;
    if (this.ui.phase !== "place" || !p.placed.length) return;
    const last = p.placed.pop()!;
    p.current = last.id;
    p.orient = last.o;
    p.cursor = { r: last.r, c: last.c };
    this.changed();
  }

  ready() {
    const p = this.ui.placing;
    if (this.ui.phase !== "place" || p.placed.length !== FLEET.length || !this.pendingPlace) return;
    const r = this.pendingPlace;
    this.pendingPlace = null;
    this.ui.phase = "busy";
    this.audio.checkpoint();
    this.changed();
    // Keep FLEET order for the engine.
    r(FLEET.map((d) => ({ ...p.placed.find((x) => x.id === d.id)! })));
  }

  private shipAt(at: Coord): Placement | null {
    for (const p of this.ui.placing.placed) {
      const d = FLEET.find((f) => f.id === p.id)!;
      if (shipCells(p, d.len).some((c) => c.r === at.r && c.c === at.c)) return p;
    }
    return null;
  }

  /** Pointer down on the board while placing: pick up a ship, or start placing the current one. */
  placePointer(kind: "down" | "move" | "up", at: Coord | null) {
    const u = this.ui;
    if (u.phase !== "place") return;
    const p = u.placing;
    if (kind === "down") {
      if (!at) return;
      const hit = this.shipAt(at);
      if (hit) {
        const d = FLEET.find((f) => f.id === hit.id)!;
        const offset = hit.o === "h" ? at.c - hit.c : at.r - hit.r;
        p.placed = p.placed.filter((x) => x.id !== hit.id);
        p.current = hit.id;
        p.orient = hit.o;
        p.cursor = { r: hit.r, c: hit.c };
        this.drag = { picked: hit, offset, start: at, moved: false };
        void d;
      } else {
        const d = this.currentDef();
        if (!d) return;
        p.cursor = this.clampAnchor(d, at, p.orient);
        this.drag = { picked: null, offset: 0, start: at, moved: false };
      }
      this.changed();
      return;
    }
    if (!this.drag) return;
    const d = this.currentDef();
    if (!d) return;
    if (kind === "move") {
      if (!at) return;
      if (at.r !== this.drag.start.r || at.c !== this.drag.start.c) this.drag.moved = true;
      const anchor = p.orient === "h" ? { r: at.r, c: at.c - this.drag.offset } : { r: at.r - this.drag.offset, c: at.c };
      p.cursor = this.clampAnchor(d, anchor, p.orient);
      this.changed();
      return;
    }
    // up
    const drag = this.drag;
    this.drag = null;
    if (drag.picked && !drag.moved) {
      // A tap on a placed ship turns it (if it fits), else puts it back.
      const o: Orient = drag.picked.o === "h" ? "v" : "h";
      const ok = fits(u.size, this.takenExcept(d.id), drag.picked.r, drag.picked.c, o, d.len);
      p.placed = p.placed.concat({ ...drag.picked, o: ok ? o : drag.picked.o });
      p.current = this.nextUnplaced();
      const nd = this.currentDef();
      if (nd) p.cursor = this.clampAnchor(nd, p.cursor, p.orient);
      this.audio.blip();
      this.changed();
      return;
    }
    if (!this.placeHere() && drag.picked) {
      // Dropped somewhere it doesn't fit: back where it was.
      p.placed = p.placed.concat(drag.picked);
      p.current = this.nextUnplaced();
      this.changed();
    }
  }

  /* ------------------------------ turns ------------------------------ */

  async takeAction(view: TurnView): Promise<TurnAction> {
    const seat = view.seat;

    const u = this.ui;
    if (view.turnStart) {
      await this.ensureViewer(seat, "turn");
      u.bigSide = "target";
      u.charge = [...(this.match?.charge ?? [0, 0])];
      u.challenge = null;
      u.hint = null;
      this.firstShotOfTurn = true;
      this.updateHint(seat);
      const ok = await this.shotQuestion(seat);
      if (!ok) {
        u.stats[seat].jams++;
        return { type: "jammed" };
      }
      this.maybeChallenge(seat);
    }
    u.seat = seat;
    u.shotsLeft = view.shotsLeft;
    u.canRepair = view.canRepair;
    u.charge = [...(this.match?.charge ?? [0, 0])];
    u.phase = "aim";
    u.bigSide = "target";
    if (view.turnStart || view.shotsLeft > 1) {
      u.msg = {
        text: view.shotsLeft > 1 ? `DOUBLE SHOT! ${view.shotsLeft} shots left. Aim and fire.` : u.challenge ? "Coordinate challenge! Fire at the right spot for bonus points." : this.aimHelp(),
        tone: view.shotsLeft > 1 ? "ok" : "info",
      };
    }
    this.changed();
    return new Promise<TurnAction>((r) => (this.pendingAction = r));
  }

  private aimHelp() {
    switch (this.ui.scheme) {
      case "picture":
        return "Torpedo ready! Tap a square (or use the arrows), then FIRE.";
      case "letters":
        return "Torpedo ready! Tap a square or move with the arrows. Space or FIRE shoots.";
      default:
        return "Torpedo ready! Tap a point, use the arrows, or type the ordered pair and press Enter.";
    }
  }

  private updateHint(seat: number) {
    const u = this.ui;
    const m = this.match;
    if (!m || !this.early || u.stats[seat].missStreak < 3) return;
    // A soft glow over a 3x3 area that holds a ship square not found yet.
    const f = m.fleets[1 - seat];
    const open: number[] = [];
    f.at.forEach((si, i) => {
      if (si >= 0 && m.shots[seat][i] === UNKNOWN) open.push(i);
    });
    if (!open.length) return;
    const i = open[Math.floor(Math.random() * open.length)];
    const r = Math.floor(i / u.size) + Math.floor(Math.random() * 3) - 1;
    const c = (i % u.size) + Math.floor(Math.random() * 3) - 1;
    u.hint = { r: Math.max(0, Math.min(u.size - 1, r)), c: Math.max(0, Math.min(u.size - 1, c)) };
  }

  private maybeChallenge(seat: number) {
    const u = this.ui;
    const m = this.match;
    if (!m) return;
    const chance = gradeNumber(u.grade) >= 5 ? 0.45 : 0.35;
    if (m.turn - this.lastChallengeTurn < 3 || Math.random() > chance) return;
    const ch = makeChallenge(u.grade, Math.random, (p) => m.shots[seat][idx(u.size, p.r, p.c)] === UNKNOWN);
    if (!ch) return;
    this.lastChallengeTurn = m.turn;
    u.challenge = ch;
    this.hooks.say(ch.spoken);
  }

  /** Forces a challenge now (debug/playtest). */
  debugChallenge(kind?: Parameters<typeof makeChallenge>[3]) {
    const m = this.match;
    if (!m) return null;
    const seat = this.ui.seat;
    const ch = makeChallenge(this.ui.grade, Math.random, (p) => m.shots[seat][idx(this.ui.size, p.r, p.c)] === UNKNOWN, kind);
    this.ui.challenge = ch;
    this.firstShotOfTurn = true;
    this.changed();
    return ch;
  }

  /* ------------------------------ questions ------------------------------ */

  private shotQuestion(seat: number): Promise<boolean> {
    return this.ask(seat, "shot", undefined, false);
  }

  private ask(seat: number, purpose: "shot" | "power", power: PowerUp | undefined, retry: boolean): Promise<boolean> {
    const deck = this.decks[seat][purpose];
    const q = deck.draw();
    const u = this.ui;
    u.q = { q, purpose, power, picked: null, retry, willRetry: purpose === "shot" && this.early && !retry };
    u.phase = "question";
    u.msg = {
      text: purpose === "shot" ? (retry ? "One more try: answer to arm the torpedo!" : "Answer the question to arm your torpedo!") : "Answer this harder question to earn the power-up!",
      tone: "info",
    };
    this.audio.checkpoint();
    this.hooks.sayQuestion(q);
    this.changed();
    const willRetry = u.q.willRetry;
    return new Promise<boolean>((res) => {
      this.pendingQ = (correct) => {
        if (!correct && willRetry) {
          void this.ask(seat, purpose, power, true).then(res);
          return;
        }
        res(correct);
      };
    });
  }

  answer(i: number) {
    const u = this.ui;
    const qs = u.q;
    if (u.phase !== "question" || !qs || qs.picked !== null || i < 0 || i > 3) return;
    qs.picked = i;
    const correct = i === qs.q.answer;
    const st = u.stats[u.seat];
    recordAnswer(GAME_ID, qs.q, correct);
    st.log.push({ cat: qs.purpose, subject: qs.q.subject, standard: qs.q.standard, skill: qs.q.skill, correct });
    if (correct) {
      this.audio.correct();
      if (qs.purpose === "power") st.score += 100;
    } else this.audio.wrong();
    const right = qs.q.choices[qs.q.answer];
    this.hooks.say(`${correct ? (qs.purpose === "shot" ? "Correct! Torpedo armed." : "Correct! Power-up earned.") : `Not quite. The answer is ${right}.`} ${qs.q.explanation}`);
    if (correct) {
      window.clearTimeout(this.qTimer);
      this.qTimer = window.setTimeout(() => this.continueQuestion(), this.fast ? 150 : this.early ? 2600 : 1700);
    }
    this.changed();
  }

  continueQuestion() {
    const u = this.ui;
    const qs = u.q;
    if (u.phase !== "question" || !qs || qs.picked === null || !this.pendingQ) return;
    window.clearTimeout(this.qTimer);
    const correct = qs.picked === qs.q.answer;
    const done = this.pendingQ;
    this.pendingQ = null;
    u.q = null;
    u.phase = "busy";
    this.changed();
    done(correct);
  }

  /* ------------------------------ aiming and firing ------------------------------ */

  moveAim(dr: number, dc: number) {
    const u = this.ui;
    const n = u.size;
    if (u.phase === "aim") {
      u.aim = { r: (u.aim.r + dr + n) % n, c: (u.aim.c + dc + n) % n };
      u.typed = "";
    } else if (u.phase === "sonarAim") {
      u.sonarAim = { r: (u.sonarAim.r + dr + n) % n, c: (u.sonarAim.c + dc + n) % n };
    } else return;
    this.audio.blip();
    this.sayAim();
    this.changed();
  }

  private sayTimer = 0;
  private sayAim() {
    window.clearTimeout(this.sayTimer);
    const u = this.ui;
    const at = u.phase === "sonarAim" ? u.sonarAim : u.aim;
    this.sayTimer = window.setTimeout(() => this.hooks.say(spokenCoord(u.scheme, at)), 350);
  }

  /** Tap on the big board. Tapping the spot already aimed at fires. */
  tapSpot(at: Coord) {
    const u = this.ui;
    if (u.phase === "aim") {
      if (u.aim.r === at.r && u.aim.c === at.c) {
        this.fire();
        return;
      }
      u.aim = at;
      u.typed = "";
      this.audio.blip();
      this.sayAim();
      this.changed();
    } else if (u.phase === "sonarAim") {
      if (u.sonarAim.r === at.r && u.sonarAim.c === at.c) {
        this.confirmSonar();
        return;
      }
      u.sonarAim = at;
      this.audio.blip();
      this.sayAim();
      this.changed();
    }
  }

  setTyped(t: string) {
    this.ui.typed = t;
    const p = parseCoord(this.ui.scheme, t);
    if (p && this.ui.phase === "aim") this.ui.aim = p;
    this.changed();
  }

  /** Fire at the typed coordinate (Enter in the TYPE box). */
  fireTyped() {
    const u = this.ui;
    const p = parseCoord(u.scheme, u.typed);
    if (!p) {
      u.msg = { text: u.scheme === "q4" ? "Type an ordered pair from (−5, −5) to (5, 5), like (3, −2)." : "Type an ordered pair from (0, 0) to (9, 9), like (3, 7).", tone: "no" };
      this.audio.wrong();
      this.changed();
      return;
    }
    u.aim = p;
    this.fire();
  }

  fire() {
    const u = this.ui;
    if (u.phase !== "aim" || !this.pendingAction || !this.match) return;
    const i = idx(u.size, u.aim.r, u.aim.c);
    if (this.match.shots[u.seat][i] !== UNKNOWN) {
      u.msg = { text: `You already fired at ${formatCoord(u.scheme, u.aim)}. Pick a new spot.`, tone: "no" };
      this.audio.wrong();
      this.changed();
      return;
    }
    const r = this.pendingAction;
    this.pendingAction = null;
    u.phase = "busy";
    u.typed = "";
    this.audio.shoot();
    this.changed();
    r({ type: "fire", at: { ...u.aim } });
  }

  /* ------------------------------ power-ups ------------------------------ */

  get powerReady() {
    const u = this.ui;
    return u.phase === "aim" && u.charge[u.seat] >= u.chargeNeeded[u.seat];
  }

  openPower() {
    if (!this.powerReady) {
      if (this.ui.phase === "aim") {
        const u = this.ui;
        const left = u.chargeNeeded[u.seat] - u.charge[u.seat];
        u.msg = { text: `Power-up charging: ready in ${left} more turn${left === 1 ? "" : "s"}.`, tone: "info" };
        this.changed();
      }
      return;
    }
    this.ui.phase = "powerpick";
    this.audio.blip();
    this.hooks.say("Pick a power-up: sonar sweep, double shot, or repair crew. Then answer a harder question.");
    this.changed();
  }

  cancelPower() {
    if (this.ui.phase !== "powerpick") return;
    this.ui.phase = "aim";
    this.changed();
  }

  async choosePower(p: PowerUp) {
    const u = this.ui;
    if (u.phase !== "powerpick" || !this.pendingAction) return;
    if (p === "repair" && !u.canRepair) {
      u.msg = { text: "Nothing to repair yet: none of your ships afloat has been hit.", tone: "no" };
      this.changed();
      return;
    }
    const resolve = this.pendingAction;
    this.pendingAction = null;
    const earned = await this.ask(u.seat, "power", p, false);
    if (earned && p === "sonar") {
      u.phase = "sonarAim";
      u.sonarAim = { ...u.aim };
      u.msg = { text: "SONAR SWEEP: pick the middle of a 3×3 area (tap it twice, or arrows + Space).", tone: "ok" };
      this.changed();
      this.pendingSonar = (center) => resolve({ type: "power", power: "sonar", earned: true, center });
      return;
    }
    u.phase = "busy";
    this.changed();
    resolve({ type: "power", power: p, earned });
  }
  private pendingSonar: ((c: Coord) => void) | null = null;

  confirmSonar() {
    const u = this.ui;
    if (u.phase !== "sonarAim" || !this.pendingSonar) return;
    const r = this.pendingSonar;
    this.pendingSonar = null;
    u.phase = "busy";
    this.changed();
    r({ ...u.sonarAim });
  }

  /* ------------------------------ match events ------------------------------ */

  private async onEvent(ev: MatchEvent) {
    const u = this.ui;
    const sc = this.screen;
    const human = (seat: number) => u.mode === "pass" || seat === 0;
    switch (ev.type) {
      case "turn": {
        u.turn = ev.turn;
        u.seat = ev.seat;
        u.charge = [...(this.match?.charge ?? [0, 0])];
        if (!human(ev.seat)) {
          u.phase = "busy";
          u.bigSide = "own";
          u.msg = { text: "Enemy sonar is pinging… incoming torpedo!", tone: "info" };
          this.changed();
          await this.wait(700);
        }
        break;
      }
      case "shot": {
        const st = u.stats[ev.seat];
        const mine = human(ev.seat);
        // The viewer sees their shots on the big board and incoming shots on their own fleet.
        const which = ev.seat === u.viewer ? (u.bigSide === "target" ? "big" : "small") : u.bigSide === "own" ? "big" : "small";
        st.shots++;
        if (ev.result !== "miss") st.hits++;
        let bonus = 0;
        let chMsg: UiState["msg"] | null = null;
        if (mine && this.firstShotOfTurn && u.challenge) {
          const ch = u.challenge;
          const right = ch.target.r === ev.at.r && ch.target.c === ev.at.c;
          st.log.push({ cat: "coord", subject: "math", standard: ch.standard, skill: ch.skill, correct: right });
          if (right) bonus = gradeNumber(u.grade) >= 5 ? 300 : 250;
          chMsg = right
            ? { text: `★ CHALLENGE CORRECT! ${ch.explain} +${bonus}`, tone: "ok" }
            : { text: `Challenge missed: the answer was ${formatCoord(u.scheme, ch.target)}. ${ch.explain}`, tone: "no" };
          u.challenge = null;
        }
        this.firstShotOfTurn = false;
        const where = formatCoord(u.scheme, ev.at);
        if (sc) await sc.torpedo(which, ev.at);
        if (ev.result === "miss") {
          sc?.splash(which, ev.at);
          this.audio.tone(300, 0.25, "triangle", 0.4, 120);
          st.missStreak++;
          sc?.floater("SPLASH", which, ev.at, PAL.lightBlue);
        } else {
          sc?.explode(which, ev.at, ev.result === "sunk");
          this.audio.explode();
          st.missStreak = 0;
          if (mine) u.hint = null;
          st.score += 100;
          sc?.floater(ev.result === "sunk" ? "SUNK!" : "HIT!", which, ev.at, ev.result === "sunk" ? PAL.red : PAL.yellow, ev.result === "sunk" ? 2 : 1);
        }
        if (ev.result === "sunk" && ev.ship) {
          st.sunk.push(ev.ship.name);
          st.score += 200 + 50 * ev.ship.len;
          const fl = this.match?.fleets[1 - ev.seat].ships.find((s) => s.def.id === ev.ship!.id);
          if (fl && sc) sc.sink(which, fl.def, fl.place);
          this.audio.gameOver();
        }
        st.score += bonus;
        if (bonus && sc) sc.floater(`+${bonus}`, which, { r: Math.max(0, ev.at.r - 1), c: ev.at.c }, PAL.green);
        const who = u.mode === "pass" ? `Player ${ev.seat + 1}` : ev.seat === 0 ? "You" : "The enemy";
        const resText = ev.result === "miss" ? "miss" : ev.result === "hit" ? "HIT" : `SUNK the ${ev.ship?.name}`;
        const line = `${who} fired at ${where}: ${resText}${ev.result === "miss" ? "." : "!"}`;
        u.msg = chMsg ? { text: `${line} ${chMsg.text}`, tone: chMsg.tone } : { text: line, tone: ev.result === "miss" ? "info" : mine ? "ok" : "no" };
        this.hooks.say(`${spokenCoord(u.scheme, ev.at)}. ${ev.result === "miss" ? "Splash. A miss." : ev.result === "hit" ? "Hit!" : `Sunk! The ${ev.ship?.name}.`}${chMsg ? (bonus ? " Challenge correct!" : " Challenge missed.") : ""}`);
        this.changed();
        await this.wait(ev.result === "sunk" ? 1500 : 800);
        if (ev.shotsLeft === 0 && this.match && this.match.winner < 0) {
          // Let the shooter see the result before the board changes hands.
          await this.wait(mine ? (u.mode === "pass" ? 1100 : 500) : 900);
          if (!mine) u.bigSide = "target";
        }
        this.changed();
        break;
      }
      case "jammed": {
        sc?.jam();
        this.audio.crash();
        u.msg = { text: "Sonar jammed! The shot is lost this turn.", tone: "no" };
        this.hooks.say("Sonar jammed! The shot is lost.");
        this.changed();
        await this.wait(1300);
        break;
      }
      case "power": {
        const st = u.stats[ev.seat];
        const which = u.bigSide === "target" ? "big" : "small";
        u.charge = [...(this.match?.charge ?? [0, 0])];
        if (!ev.earned) {
          u.msg = { text: `No ${POWER_NAMES[ev.power]} this time. Keep going: aim and fire!`, tone: "no" };
          this.changed();
          await this.wait(400);
          break;
        }
        st.powers++;
        if (ev.power === "sonar" && ev.center) {
          sc?.ping(which, ev.center, !!ev.count);
          this.audio.tone(1200, 0.5, "sine", 0.5, 600);
          u.msg = ev.count
            ? { text: `SONAR CONTACT! ${ev.count} ship square${ev.count === 1 ? "" : "s"} hiding in the 3×3 area around ${formatCoord(u.scheme, ev.center)}.`, tone: "ok" }
            : { text: `Sonar: all clear around ${formatCoord(u.scheme, ev.center)}. No ships there.`, tone: "info" };
          this.hooks.say(ev.count ? `Sonar contact! ${ev.count} ship squares nearby.` : "Sonar says all clear. No ships there.");
        } else if (ev.power === "double") {
          this.audio.levelUp();
          u.msg = { text: "DOUBLE SHOT! You get two torpedoes this turn.", tone: "ok" };
          this.hooks.say("Double shot! Two torpedoes this turn.");
        } else {
          this.audio.levelUp();
          if (ev.repaired) {
            sc?.repairFx(u.bigSide === "own" ? "big" : "small", ev.repaired);
            u.msg = { text: `REPAIR CREW fixed your ship at ${formatCoord(u.scheme, ev.repaired)}. The enemy has to find it again!`, tone: "ok" };
          } else u.msg = { text: "The repair crew found nothing to fix.", tone: "info" };
          this.hooks.say("Repair crew fixed your ship.");
        }
        this.changed();
        await this.wait(1200);
        break;
      }
      case "over":
        break;
      case "placed":
        break;
    }
  }

  private finish(winner: number) {
    const u = this.ui;
    u.winner = winner;
    u.stats[winner].score += 1000;
    u.phase = "over";
    u.bigSide = "target";
    if (u.mode === "cpu") {
      submitScore(GAME_ID, u.stats[0].score);
      if (winner === 0) this.audio.levelUp();
      else this.audio.gameOver();
      this.hooks.say(winner === 0 ? "Victory! You sank the whole enemy fleet!" : "The enemy sank your fleet. Try again!");
    } else {
      u.stats.forEach((s) => submitScore(GAME_ID, s.score));
      this.audio.levelUp();
      this.hooks.say(`Player ${winner + 1} wins!`);
    }
    this.changed();
  }

  /* ------------------------------ debug helpers (?debug) ------------------------------ */

  /** Unhit enemy ship squares for `seat`. */
  enemyShipSpots(seat = this.ui.seat): Coord[] {
    const m = this.match;
    if (!m) return [];
    const out: Coord[] = [];
    m.fleets[1 - seat].at.forEach((si, i) => {
      if (si >= 0 && m.shots[seat][i] === UNKNOWN) out.push({ r: Math.floor(i / m.size), c: i % m.size });
    });
    return out;
  }

  openSpots(seat = this.ui.seat): Coord[] {
    const m = this.match;
    if (!m) return [];
    const out: Coord[] = [];
    m.shots[seat].forEach((v, i) => {
      if (v === UNKNOWN) out.push({ r: Math.floor(i / m.size), c: i % m.size });
    });
    return out;
  }

  hitsOn(seat: number) {
    return this.match ? this.match.shots[1 - seat].filter((v) => v === HIT).length : 0;
  }
}
