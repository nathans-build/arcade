/*
 * One round on the pyramid (pure: no DOM), shared by the engine and the checker.
 *  - build: land on the tokens in a valid order; distractor cubes cost a shield.
 *  - color: land on every cube whose label fits the rule; others cost a shield.
 * Blank cubes light up when the hero lands on them (bonus points, as in the classic).
 */
import type { RoundSpec } from "@/content";
import { allCells, key, placeLabels, shuffle, type Cell, type Geom } from "./geom";

export type CubeState = "plain" | "lit" | "label" | "done";

export interface Cube {
  r: number;
  c: number;
  label?: string;
  /** build: part of the sentence/equation. color: fits the rule. */
  good?: boolean;
  why?: string;
  state: CubeState;
  /** Seconds left of a red "wrong" flash. */
  flash: number;
}

export type LandResult =
  | { type: "lit" }
  | { type: "none" }
  | { type: "correct"; label: string; complete: boolean }
  | { type: "wrong"; label: string; why: string }
  | { type: "notyet"; label: string; why: string };

export interface Option {
  label: string;
  key: string;
}

export class Round {
  cubes = new Map<string, Cube>();
  /** build: labels landed so far. */
  built: string[] = [];
  /** color: matching cubes colored so far. */
  found = 0;
  total = 0;
  /** Wrong landings this round, and on the current step (for hints). */
  wrongs = 0;
  stepWrongs = 0;

  constructor(public spec: RoundSpec, public geom: Geom, rand: () => number = Math.random) {
    for (const c of allCells(geom)) this.cubes.set(key(c.r, c.c), { r: c.r, c: c.c, state: "plain", flash: 0 });
    let labels: { label: string; good: boolean; why: string }[];
    let chain = 0;
    if (spec.kind === "build") {
      labels = [
        ...spec.item.tokens.map((t) => ({ label: t, good: true, why: "" })),
        ...spec.item.distractors.map((d) => ({ label: d.label, good: false, why: d.why })),
      ];
      chain = spec.item.tokens.length;
      this.total = spec.item.tokens.length;
    } else {
      labels = spec.labels.map((l) => ({ label: l.label, good: l.match, why: l.why }));
      this.total = spec.labels.filter((l) => l.match).length;
    }
    const map = placeLabels(geom, labels.map((l) => l.label), rand, { chainLength: chain });
    if (!map) throw new Error(`no layout for ${labels.length} labels on ${geom.rows} rows`);
    for (const [k, label] of map) {
      const info = labels.find((l) => l.label === label)!;
      const cube = this.cubes.get(k)!;
      Object.assign(cube, { label, good: info.good, why: info.why, state: "label" as CubeState });
    }
  }

  get complete(): boolean {
    return this.spec.kind === "build" ? this.built.length === this.total : this.found === this.total;
  }

  /** build: labels that may come next (more than one when an equation can be written two ways). */
  acceptedNext(): string[] {
    if (this.spec.kind !== "build") return [];
    const n = this.built.length;
    const out = new Set<string>();
    for (const o of this.spec.item.orders) {
      if (o.length > n && this.built.every((b, i) => o[i] === b)) out.add(o[n]);
    }
    return [...out];
  }

  /** Cubes that would count as correct right now. */
  targets(): Cube[] {
    if (this.spec.kind === "build") {
      const next = new Set(this.acceptedNext());
      return [...this.cubes.values()].filter((c) => c.state === "label" && c.label && next.has(c.label));
    }
    return [...this.cubes.values()].filter((c) => c.state === "label" && c.good);
  }

  /** Safe for an auto-hop to pass over: blank, lit or already used. */
  open(cell: Cell): boolean {
    const c = this.cubes.get(key(cell.r, cell.c));
    return !!c && c.state !== "label";
  }

  land(cell: Cell): LandResult {
    const cube = this.cubes.get(key(cell.r, cell.c));
    if (!cube) return { type: "none" };
    if (cube.state === "plain") {
      cube.state = "lit";
      return { type: "lit" };
    }
    if (cube.state !== "label" || !cube.label) return { type: "none" };
    const label = cube.label;
    if (this.spec.kind === "build") {
      if (this.acceptedNext().includes(label)) {
        cube.state = "done";
        this.built.push(label);
        this.stepWrongs = 0;
        return { type: "correct", label, complete: this.complete };
      }
      if (cube.good) {
        const after = this.built.length ? `after "${this.built[this.built.length - 1]}"` : "first";
        return { type: "notyet", label, why: `Not yet: "${label}" comes later. Find what comes ${after}.` };
      }
      return this.wrong(cube);
    }
    if (cube.good) {
      cube.state = "done";
      this.found++;
      return { type: "correct", label, complete: this.complete };
    }
    return this.wrong(cube);
  }

  private wrong(cube: Cube): LandResult {
    cube.flash = 0.8;
    this.wrongs++;
    this.stepWrongs++;
    return { type: "wrong", label: cube.label!, why: cube.why ?? "" };
  }

  /** Marks a pick of a later sentence word as a mistake (it was offered as an answer). */
  noteMiss() {
    this.wrongs++;
    this.stepWrongs++;
  }

  /**
   * Up to four labels for keys 1–4 / A–D: always at least one that counts right now, the
   * rest wrong or later cubes still on the pyramid, shuffled.
   */
  options(rand: () => number = Math.random): Option[] {
    const pending = [...this.cubes.values()].filter((c) => c.state === "label" && c.label);
    const right = shuffle(this.targets(), rand);
    if (right.length === 0) return [];
    const rightKeys = new Set(right.map((c) => key(c.r, c.c)));
    const wrong = shuffle(pending.filter((c) => !rightKeys.has(key(c.r, c.c))), rand);
    // Color rounds may offer two right answers; build rounds offer every accepted next token (max 2).
    const nRight = Math.min(right.length, this.spec.kind === "color" ? (wrong.length >= 3 ? 1 + Math.floor(rand() * 2) : 4 - wrong.length) : 2);
    const picks = [...right.slice(0, nRight), ...wrong.slice(0, 4 - nRight)];
    if (picks.length < 4) picks.push(...right.slice(nRight, nRight + 4 - picks.length));
    return shuffle(picks, rand).map((c) => ({ label: c.label!, key: key(c.r, c.c) }));
  }

  /** How many blank cubes are still unlit. */
  unlit(): number {
    return [...this.cubes.values()].filter((c) => c.state === "plain").length;
  }
}
