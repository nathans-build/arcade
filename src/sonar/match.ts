/*
 * The Sonar Squad rules engine. It talks to both sides only through the `Player`
 * interface, so it never knows (or cares) whether a seat is a kid at this device
 * (LocalHumanPlayer), the computer (ComputerPlayer), or, in a future online version,
 * a RemotePlayer. See "Adding online play later" in the README.
 *
 * A turn: the seat's power-up charge goes up by one, then the engine asks the player for
 * actions until its shots are used up:
 *   - fire at a spot (must be on the board and not fired at before);
 *   - "jammed": the player missed the shot question, so the shot is lost;
 *   - a power-up attempt (needs a full charge; uses it up): sonar on a 3x3 area,
 *     double shot (one extra shot this turn) or repair (fix one hit square on your own
 *     ship that is still afloat). `earned: false` means the question was missed: the
 *     charge is spent and nothing happens.
 * Questions are asked by the human player's UI, not by the rules.
 */
import { FLEET, Fleet, HIT, MISS, SUNK, UNKNOWN, onBoard, idx, toCoord, type Coord, type Placement, type ShipDef, type ShotMark, type ShotResult, type TargetView } from "./core";

export type PowerUp = "sonar" | "double" | "repair";
export const POWER_UPS: PowerUp[] = ["sonar", "double", "repair"];

export type TurnAction =
  | { type: "fire"; at: Coord }
  | { type: "jammed" }
  | { type: "power"; power: PowerUp; earned: boolean; center?: Coord };

/** Everything a player may see when it is asked to act. */
export interface TurnView {
  seat: number;
  size: number;
  turn: number;
  target: TargetView;
  /** Sonar results on the enemy board: 0 none, 1 clear water, 2 contact. */
  sonar: number[];
  charge: number;
  chargeNeeded: number;
  shotsLeft: number;
  /** First action of this turn (the UI asks the shot question then). */
  turnStart: boolean;
  canRepair: boolean;
}

export type MatchEvent =
  | { type: "placed"; seat: number }
  | { type: "turn"; seat: number; turn: number; charge: number }
  | { type: "shot"; seat: number; at: Coord; result: ShotResult; ship?: ShipDef; cells?: Coord[]; shotsLeft: number }
  | { type: "jammed"; seat: number }
  | { type: "power"; seat: number; power: PowerUp; earned: boolean; center?: Coord; count?: number; repaired?: Coord }
  | { type: "over"; winner: number };

export interface Player {
  readonly kind: "human" | "computer" | "remote";
  placeFleet(ctx: { seat: number; size: number; fleet: ShipDef[] }): Promise<Placement[]>;
  takeAction(view: TurnView): Promise<TurnAction>;
  /** Hit/miss/sunk and other news about the match, for both seats. */
  notify?(ev: MatchEvent): void;
}

export interface MatchOptions {
  chargeNeeded?: number[];
  startCharge?: number[];
  first?: number;
  /** Awaited after every event (animations); the engine waits before going on. */
  onEvent?: (ev: MatchEvent) => void | Promise<void>;
  maxActions?: number;
}

export class Match {
  fleets: Fleet[] = [];
  /** shots[s] = what seat s knows about the other seat's board. */
  shots: ShotMark[][];
  sonar: number[][];
  charge: number[];
  chargeNeeded: number[];
  turn = 0;
  current: number;
  winner = -1;
  shotsLeft = 0;
  stopped = false;

  constructor(public readonly size: number, public readonly players: [Player, Player], private opts: MatchOptions = {}) {
    const n = size * size;
    this.shots = [new Array(n).fill(UNKNOWN), new Array(n).fill(UNKNOWN)];
    this.sonar = [new Array(n).fill(0), new Array(n).fill(0)];
    this.chargeNeeded = opts.chargeNeeded ?? [3, 3];
    this.charge = opts.startCharge ? [...opts.startCharge] : [0, 0];
    this.current = opts.first ?? 0;
  }

  private async emit(ev: MatchEvent) {
    this.players.forEach((p) => p.notify?.(ev));
    await this.opts.onEvent?.(ev);
  }

  targetView(seat: number): TargetView {
    return { size: this.size, shots: [...this.shots[seat]], remaining: this.fleets[1 - seat].remaining() };
  }

  view(seat: number, turnStart: boolean): TurnView {
    return {
      seat,
      size: this.size,
      turn: this.turn,
      target: this.targetView(seat),
      sonar: [...this.sonar[seat]],
      charge: this.charge[seat],
      chargeNeeded: this.chargeNeeded[seat],
      shotsLeft: this.shotsLeft,
      turnStart,
      canRepair: this.fleets[seat]?.repairable() != null,
    };
  }

  async place() {
    for (let seat = 0; seat < 2; seat++) {
      const placements = await this.players[seat].placeFleet({ seat, size: this.size, fleet: FLEET });
      this.fleets[seat] = new Fleet(this.size, placements);
      await this.emit({ type: "placed", seat });
    }
  }

  /** Plays the whole match; resolves with the winning seat. */
  async run(): Promise<number> {
    if (this.fleets.length < 2) await this.place();
    let actions = 0;
    const max = this.opts.maxActions ?? 5000;
    while (this.winner < 0 && !this.stopped) {
      const seat = this.current;
      this.turn++;
      this.charge[seat] = Math.min(this.chargeNeeded[seat], this.charge[seat] + 1);
      this.shotsLeft = 1;
      await this.emit({ type: "turn", seat, turn: this.turn, charge: this.charge[seat] });
      let first = true;
      while (this.shotsLeft > 0 && this.winner < 0 && !this.stopped) {
        if (++actions > max) throw new Error("match did not finish");
        const action = await this.players[seat].takeAction(this.view(seat, first));
        if (this.stopped) break;
        first = false;
        await this.apply(seat, action);
      }
      this.current = 1 - seat;
    }
    return this.winner;
  }

  /** Validates and applies one action. Illegal actions throw: no player may cheat. */
  async apply(seat: number, a: TurnAction) {
    const enemy = this.fleets[1 - seat];
    if (a.type === "jammed") {
      this.shotsLeft = 0;
      await this.emit({ type: "jammed", seat });
      return;
    }
    if (a.type === "fire") {
      const { r, c } = a.at;
      if (!Number.isInteger(r) || !Number.isInteger(c) || !onBoard(this.size, r, c)) throw new Error(`seat ${seat} fired off the board at ${r},${c}`);
      const i = idx(this.size, r, c);
      if (this.shots[seat][i] !== UNKNOWN) throw new Error(`seat ${seat} fired twice at ${r},${c}`);
      const { result, ship } = enemy.receive(i);
      this.shots[seat][i] = result === "miss" ? MISS : HIT;
      let cells: Coord[] | undefined;
      if (result === "sunk" && ship) {
        ship.cells.forEach((ci) => (this.shots[seat][ci] = SUNK));
        cells = ship.cells.map((ci) => toCoord(this.size, ci));
      }
      this.shotsLeft--;
      if (enemy.allSunk()) this.winner = seat;
      await this.emit({ type: "shot", seat, at: { r, c }, result, ship: ship?.def, cells, shotsLeft: this.shotsLeft });
      if (this.winner >= 0) await this.emit({ type: "over", winner: seat });
      return;
    }
    // Power-up attempt
    if (this.charge[seat] < this.chargeNeeded[seat]) throw new Error(`seat ${seat} used a power-up without a full charge`);
    this.charge[seat] = 0;
    if (!a.earned) {
      await this.emit({ type: "power", seat, power: a.power, earned: false });
      return;
    }
    if (a.power === "double") {
      this.shotsLeft++;
      await this.emit({ type: "power", seat, power: "double", earned: true });
    } else if (a.power === "sonar") {
      const ctr = a.center;
      if (!ctr || !onBoard(this.size, ctr.r, ctr.c)) throw new Error("sonar needs a center on the board");
      const count = enemy.sonarCount(ctr.r, ctr.c);
      for (let dr = -1; dr <= 1; dr++)
        for (let dc = -1; dc <= 1; dc++) {
          const rr = ctr.r + dr;
          const cc = ctr.c + dc;
          if (onBoard(this.size, rr, cc)) this.sonar[seat][idx(this.size, rr, cc)] = count ? 2 : 1;
        }
      await this.emit({ type: "power", seat, power: "sonar", earned: true, center: ctr, count });
    } else {
      const own = this.fleets[seat];
      const i = own.repairable();
      let repaired: Coord | undefined;
      if (i != null && own.repair(i)) {
        // The enemy's mark there is wiped: that square has to be found again.
        this.shots[1 - seat][i] = UNKNOWN;
        repaired = toCoord(this.size, i);
      }
      await this.emit({ type: "power", seat, power: "repair", earned: true, repaired });
    }
  }

  stop() {
    this.stopped = true;
  }
}
