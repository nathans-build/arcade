/*
 * The two kinds of player in v1. The rules (match.ts) only see the `Player` interface.
 *
 *  - LocalHumanPlayer: a kid at this device. It hands every request to the screen
 *    (`HumanSeatUI`), which places ships, asks the shot and power-up questions and lets
 *    the kid aim. Pass-and-play is simply two LocalHumanPlayers sharing one UI that shows
 *    a "don't peek" cover screen between turns.
 *  - ComputerPlayer(level): places its fleet at random (ships never touch) and fires
 *    using the pure AI functions in ai.ts. It does not answer questions.
 *
 * A future RemotePlayer (online, v2) would implement the same interface by sending the
 * request to a server and waiting for the other device's move; see the README.
 */
import { aiShot, type AiLevel } from "./ai";
import { idx, randomFleet, toCoord, type Coord, type Placement, type Rng, type ShipDef, type TargetView } from "./core";
import type { MatchEvent, Player, TurnAction, TurnView } from "./match";

export interface HumanSeatUI {
  placeFleet(seat: number, size: number, fleet: ShipDef[]): Promise<Placement[]>;
  takeAction(view: TurnView): Promise<TurnAction>;
  notify?(ev: MatchEvent): void;
}

export class LocalHumanPlayer implements Player {
  readonly kind = "human" as const;
  constructor(public readonly seat: number, private ui: HumanSeatUI) {}
  placeFleet(ctx: { seat: number; size: number; fleet: ShipDef[] }) {
    return this.ui.placeFleet(ctx.seat, ctx.size, ctx.fleet);
  }
  takeAction(view: TurnView) {
    return this.ui.takeAction(view);
  }
  notify(ev: MatchEvent) {
    this.ui.notify?.(ev);
  }
}

export interface ComputerOptions {
  /** Waits before each shot so people can follow the game (0 in tests). */
  thinkMs?: number;
  /** Awaited before each shot (the game uses it to hold the computer while paused). */
  gate?: () => Promise<void>;
  /** Debug/test only: a spot to fire at instead of the AI's choice. */
  override?: (view: TargetView) => Coord | null;
}

export class ComputerPlayer implements Player {
  readonly kind = "computer" as const;
  constructor(public level: AiLevel, private rng: Rng = Math.random, private opts: ComputerOptions = {}) {}

  placeFleet(ctx: { seat: number; size: number; fleet: ShipDef[] }): Promise<Placement[]> {
    return Promise.resolve(randomFleet(ctx.size, this.rng, true));
  }

  /** The AI's next spot for a target view. */
  chooseShot(view: TargetView): Coord {
    const o = this.opts.override?.(view);
    if (o && view.shots[idx(view.size, o.r, o.c)] === 0) return o;
    return toCoord(view.size, aiShot(this.level, view, this.rng));
  }

  async takeAction(view: TurnView): Promise<TurnAction> {
    if (this.opts.thinkMs) await new Promise((r) => setTimeout(r, this.opts.thinkMs));
    if (this.opts.gate) await this.opts.gate();
    return { type: "fire", at: this.chooseShot(view.target) };
  }
}
