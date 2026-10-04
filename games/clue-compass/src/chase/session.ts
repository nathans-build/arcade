/*
 * One case being played: where the detective is, which witnesses were heard, the notebook,
 * the compass charges (hours) and every choice made. Pure state; the game wraps it with
 * sound, speech and drawing. A seeded shuffle keeps the four destinations in a stable order.
 */
import { clueIcon, clueText, deadEnd, factOf, noteText, tagOf, type World } from "./logic";
import type { CaseDef, ClueRef, Place, Tag } from "./types";

export interface Witness {
  ref: ClueRef;
  text: string;
  icon?: string;
  heard: boolean;
}

export interface NoteEntry {
  ref: ClueRef;
  text: string;
  icon?: string;
}

export interface Choice {
  /** Index of the leg (legs.length = the hideout pick). */
  leg: number;
  picked: string;
  correct: boolean;
  /** Clue keys of that leg (for standards). */
  keys: string[];
  vocab: boolean;
}

export type RunPhase = "stop" | "deadend" | "found" | "escaped";

function rng(seed: number) {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return (s >>> 0) / 4294967296;
  };
}

export class CaseRun {
  /** Index into c.stops of the stop the detective is investigating. */
  stop = 0;
  phase: RunPhase = "stop";
  /** Wrong place being visited (deadend phase). */
  wrongAt: Place | null = null;
  lesson = "";
  witnesses: Witness[] = [];
  notebook: NoteEntry[] = [];
  options: string[] = [];
  /** Wrong options already tried at this stop (they can't be picked again). */
  tried = new Set<string>();
  choices: Choice[] = [];
  mistakes = 0;
  charges: number | null;
  readonly startCharges: number | null;
  private rand: () => number;

  constructor(
    public readonly c: CaseDef,
    private world: World,
    charges: number | null,
    private cost: { talk: number; travel: number; wrongTrip: number },
    private short: boolean,
    seed = Math.floor(Math.random() * 1e9),
  ) {
    this.charges = charges;
    this.startCharges = charges;
    this.rand = rng(seed);
    this.arrive();
  }

  get here(): Place {
    return this.world.get(this.c.stops[this.stop]);
  }
  get hideout(): Place {
    return this.world.get(this.c.stops[this.c.stops.length - 1]);
  }
  /** True at the last stop before the hideout: the choice is the hideout pick. */
  get finalPick(): boolean {
    return this.stop === this.c.stops.length - 2;
  }
  get next(): Place {
    return this.world.get(this.c.stops[this.stop + 1]);
  }
  /** The clue refs for the current choice (witnesses, or the notebook for the hideout). */
  get currentRefs(): ClueRef[] {
    return this.finalPick ? this.c.traits : this.c.legs[this.stop].clues;
  }
  get tags(): Tag[] {
    return this.currentRefs.map((r) => tagOf(this.next, r, this.here));
  }
  get legCount(): number {
    return this.c.stops.length - 1;
  }

  private arrive() {
    const here = this.here;
    this.phase = "stop";
    this.wrongAt = null;
    this.lesson = "";
    this.tried = new Set();
    if (this.stop < this.c.traits.length) {
      const ref = this.c.traits[this.stop];
      this.notebook.push({ ref, text: noteText(this.hideout, ref), icon: factOf(this.hideout, ref)?.icon });
    }
    const next = this.next;
    this.witnesses = this.finalPick
      ? []
      : this.c.legs[this.stop].clues.map((ref) => ({ ref, text: clueText(next, ref, here), icon: clueIcon(next, ref, here), heard: false }));
    const wrong = this.finalPick ? this.c.hideoutOpts : this.c.legs[this.stop].opts;
    const all = [next.id, ...wrong];
    for (let i = all.length - 1; i > 0; i--) {
      const j = Math.floor(this.rand() * (i + 1));
      [all[i], all[j]] = [all[j], all[i]];
    }
    this.options = all;
  }

  private spend(n: number) {
    if (this.charges === null) return;
    this.charges = Math.max(0, this.charges - n);
  }

  /** Talk to witness i. Returns false if already heard or out of range. */
  talk(i: number): boolean {
    const w = this.witnesses[i];
    if (!w || this.phase !== "stop") return false;
    if (!w.heard) {
      w.heard = true;
      this.spend(this.cost.talk);
      if (this.charges === 0) this.phase = "escaped";
    }
    return true;
  }

  /** Travel to an option. Returns "right", "wrong" or "found" (the hideout). */
  travel(id: string): "right" | "wrong" | "found" | "none" {
    if (this.phase !== "stop" || !this.options.includes(id) || this.tried.has(id)) return "none";
    const right = id === this.next.id;
    const keys = this.currentRefs.map((r) => r.split("=")[0]);
    const vocab = this.currentRefs.some((r) => r !== "dir" && !!factOf(this.next, r)?.vocab);
    this.choices.push({ leg: this.stop, picked: id, correct: right, keys, vocab });
    if (right) {
      this.spend(this.cost.travel);
      if (this.finalPick) {
        this.stop++;
        this.phase = "found";
        return "found";
      }
      this.stop++;
      this.arrive();
      if (this.charges === 0) this.phase = "escaped";
      return "right";
    }
    this.mistakes++;
    this.tried.add(id);
    const place = this.world.get(id);
    this.wrongAt = place;
    this.lesson = deadEnd(place, this.tags, this.here, this.short) ?? "";
    this.spend(this.cost.wrongTrip);
    this.phase = this.charges === 0 ? "escaped" : "deadend";
    return "wrong";
  }

  /** Fly back from a dead end to the stop. */
  back() {
    if (this.phase !== "deadend") return;
    this.phase = "stop";
    this.wrongAt = null;
    this.lesson = "";
  }
}
