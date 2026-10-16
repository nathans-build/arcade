/*
 * One level of Lab Capsules with its clock: gravity, soft and hard drops, the clear flash,
 * the falling animation after a clear, chains, scoring, win and lose. Pure TypeScript:
 * the React screen calls update(dt) every frame and drains `events`.
 */
import { Bottle, placeGerms, pieceCells, type Group, type Piece, type Pos, type Tile } from "./board";
import type { LevelSet, MatchLog, Token } from "./content";
import { int, type Rng } from "./rng";

export type SpeedId = "slow" | "medium" | "fast";
export const SPEEDS: { id: SpeedId; label: string; note: string; ms: number; mult: number }[] = [
  { id: "slow", label: "SLOW", note: "Time to read", ms: 1000, mult: 1 },
  { id: "medium", label: "MEDIUM", note: "A steady drip", ms: 700, mult: 2 },
  { id: "fast", label: "FAST", note: "Lab emergency!", ms: 450, mult: 3 },
];
export const speedInfo = (id: SpeedId) => SPEEDS.find((s) => s.id === id)!;
export const isSpeed = (v: unknown): v is SpeedId => v === "slow" || v === "medium" || v === "fast";

export type Phase = "play" | "flash" | "fall" | "won" | "lost";

export type GameEvent =
  | { type: "spawn" }
  | { type: "move" }
  | { type: "rotate" }
  | { type: "land"; hard: boolean }
  | { type: "clear"; groups: Group[]; chain: number; germs: number; points: number; tiles: Tile[] }
  | { type: "won" }
  | { type: "lost" };

export const FLASH_MS = 380;
export const FALL_STEP_MS = 70;
export const SOFT_MS = 45;
export const POINTS = { germ: 100, half: 10, bonus: 250 };

export interface GameOptions {
  set: LevelSet;
  speed: SpeedId;
  rng: Rng;
  score?: number;
  /** Tests: start with an empty bottle (no germs). */
  empty?: boolean;
}

export class LabGame {
  readonly set: LevelSet;
  readonly speed: SpeedId;
  readonly rng: Rng;
  bottle = new Bottle();
  piece: Piece | null = null;
  next: [Token, Token];
  phase: Phase = "play";
  score: number;
  capsules = 0;
  chain = 0;
  soft = false;
  events: GameEvent[] = [];
  log: MatchLog = { tokens: [], bonuses: [] };
  /** Cells flashing before they clear. */
  flashing: Group[] = [];
  germsAtStart: number;
  private timer = 0;
  private fresh: Pos[] = [];
  private movedIds = new Set<number>();

  constructor(o: GameOptions) {
    this.set = o.set;
    this.speed = o.speed;
    this.rng = o.rng;
    this.score = o.score ?? 0;
    if (!o.empty) placeGerms(this.bottle, o.set.level, o.set.kinds.length, o.set.germToken, o.rng);
    this.germsAtStart = this.bottle.germCount();
    this.next = this.rollCapsule();
    this.spawn();
  }

  get germs() {
    return this.bottle.germCount();
  }

  rollCapsule(): [Token, Token] {
    const k = this.set.kinds.length;
    return [this.set.halfToken(int(this.rng, 0, k - 1), this.rng), this.set.halfToken(int(this.rng, 0, k - 1), this.rng)];
  }

  /** Gravity interval: a little faster every 10 capsules and every level (never below 160 ms). */
  dropMs(): number {
    const base = speedInfo(this.speed).ms;
    return Math.max(160, Math.round(base * Math.pow(0.95, Math.floor(this.capsules / 10)) - (this.set.level - 1) * 12));
  }

  private spawn() {
    const [a, b] = this.next;
    this.next = this.rollCapsule();
    const p = this.bottle.spawn(a, b);
    if (!p) {
      this.piece = null;
      this.phase = "lost";
      this.events.push({ type: "lost" });
      return;
    }
    this.piece = p;
    this.phase = "play";
    this.timer = 0;
    this.soft = false;
    this.capsules++;
    this.events.push({ type: "spawn" });
  }

  /* ---------------------------------------------------------------- input */

  move(dc: -1 | 1): boolean {
    if (this.phase !== "play" || !this.piece) return false;
    const q = this.bottle.move(this.piece, dc);
    if (!q) return false;
    this.piece = q;
    this.events.push({ type: "move" });
    return true;
  }

  rotate(dir: 1 | -1): boolean {
    if (this.phase !== "play" || !this.piece) return false;
    const q = this.bottle.rotate(this.piece, dir);
    if (!q) return false;
    this.piece = q;
    this.events.push({ type: "rotate" });
    return true;
  }

  /** One row down (a player's soft-drop tap; restarts the gravity clock). Returns true if it locked. */
  stepDown(): boolean {
    if (this.phase !== "play" || !this.piece) return false;
    this.timer = 0;
    return this.fall();
  }

  private fall(): boolean {
    const q = this.bottle.down(this.piece!);
    if (q) {
      this.piece = q;
      return false;
    }
    this.land(false);
    return true;
  }

  hardDrop(): void {
    if (this.phase !== "play" || !this.piece) return;
    this.piece = this.bottle.dropPos(this.piece);
    this.land(true);
  }

  setSoft(on: boolean) {
    this.soft = on;
  }

  /* ---------------------------------------------------------------- landing and clearing */

  private land(hard: boolean) {
    const p = this.piece!;
    this.fresh = this.bottle.lock(p);
    this.piece = null;
    this.chain = 0;
    this.events.push({ type: "land", hard });
    this.checkGroups();
  }

  private checkGroups() {
    const rule = this.set.bonus ? { sizes: this.set.bonusSizes, check: this.set.bonusCheck } : null;
    const groups = this.bottle.findGroups(this.fresh, rule);
    if (groups.length) {
      this.chain++;
      this.flashing = groups;
      this.phase = "flash";
      this.timer = 0;
      return;
    }
    this.flashing = [];
    if (this.bottle.germCount() === 0) {
      this.phase = "won";
      this.events.push({ type: "won" });
      return;
    }
    this.spawn();
  }

  private doClear() {
    const groups = this.flashing;
    const tiles = this.bottle.clear(groups.flatMap((g) => g.cells));
    const germs = tiles.filter((t) => t.germ).length;
    const halves = tiles.length - germs;
    const bonuses = groups.filter((g) => g.type === "bonus").length;
    const mult = speedInfo(this.speed).mult * this.chain;
    const points = (germs * POINTS.germ + halves * POINTS.half + bonuses * POINTS.bonus) * mult;
    this.score += points;
    for (const t of tiles) this.log.tokens.push(t.tok);
    for (const g of groups) if (g.bonus) this.log.bonuses.push(g.bonus);
    this.events.push({ type: "clear", groups, chain: this.chain, germs, points, tiles });
    this.flashing = [];
    this.fresh = [];
    this.phase = "fall";
    this.timer = 0;
  }

  update(dt: number) {
    if (this.phase === "won" || this.phase === "lost") return;
    this.timer += dt;
    if (this.phase === "play") {
      const every = this.soft ? Math.min(SOFT_MS, this.dropMs()) : this.dropMs();
      while (this.phase === "play" && this.timer >= every) {
        this.timer -= every;
        this.fall();
      }
    } else if (this.phase === "flash") {
      if (this.timer >= FLASH_MS) this.doClear();
    } else if (this.phase === "fall") {
      while (this.phase === "fall" && this.timer >= FALL_STEP_MS) {
        this.timer -= FALL_STEP_MS;
        const moved = this.bottle.fallStep();
        if (moved.length) {
          for (const m of moved) this.movedIds.add(this.bottle.at(...m)!.id);
        } else {
          // settled: the fresh cells are where the moved tiles came to rest
          this.fresh = this.bottle.tiles().filter(({ t }) => this.movedIds.has(t.id)).map(({ r, c }) => [r, c] as Pos);
          this.movedIds.clear();
          this.checkGroups();
        }
      }
    }
  }

  /* ---------------------------------------------------------------- debug / tests */

  /** Clears every germ (the ?debug finish-level hook). */
  debugClearGerms() {
    const cells: Pos[] = [];
    for (const { r, c, t } of this.bottle.tiles()) if (t.germ) cells.push([r, c]);
    this.piece = null;
    this.flashing = [{ type: "match", kind: 0, cells }];
    this.chain = 1;
    this.phase = "flash";
    this.timer = 0;
  }

  /** Replace the falling capsule's halves (tests / debug). */
  debugSetPiece(a: number, b: number) {
    if (!this.piece) return;
    this.piece = { ...this.piece, a: this.set.halfToken(a, this.rng), b: this.set.halfToken(b, this.rng) };
  }

  pieceCells(): Pos[] {
    return this.piece ? pieceCells(this.piece) : [];
  }
}
