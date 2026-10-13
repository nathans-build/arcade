/*
 * Key Comets simulation: comets fall toward the station, typing zaps them.
 * Pure logic (no DOM, no audio) so scripts/check-rules.ts can drive it.
 *
 * Typing: every comet whose text starts with what you've typed so far is "locked" (its typed
 * letters light up). Finish one and the laser zaps it. A key that fits no comet is a miss,
 * counted against the key you should have pressed (the glowing key).
 */
import type { Item } from "./words";
import { statKey } from "./keyboard";

export const W = 640;
export const H = 400;
/** Top of the space station (drawing). */
export const STATION_Y = 330;
/** A comet dents the shield when it falls this far (its word label touches the dome). */
export const HIT_Y = 296;
/** In practice mode comets stop and wait here. */
export const HOVER_Y = 250;

export type CometKind = "letter" | "word" | "sentence";

export interface Comet {
  id: number;
  text: string;
  by?: string;
  kind: CometKind;
  x: number;
  y: number;
  /** px per ms */
  vy: number;
  /** Comet flight wobble phase. */
  phase: number;
  waiting: boolean;
}

export type SimEvent =
  | { type: "spawn"; comet: Comet }
  | { type: "key"; ch: string; comet: Comet }
  | { type: "zap"; comet: Comet; points: number; combo: number }
  | { type: "miss"; ch: string; expected: string | null }
  | { type: "hit"; comet: Comet; shield: number }
  | { type: "over"; won: boolean };

export interface SimOptions {
  items: Item[];
  /** Words per minute the comets are paced for. */
  paceWpm: number;
  /** No shield damage: comets wait above the station until typed. Rounds never end by losing. */
  practice: boolean;
  shieldMax?: number;
  rng?: () => number;
}

export interface TypingStats {
  keystrokes: number;
  correct: number;
  errors: number;
  /** Correct characters typed (5 = one "word" for WPM). */
  chars: number;
  missed: Record<string, number>;
  /** Typing time (ms): from the first key press, paused time excluded. */
  activeMs: number;
}

export function kindOf(text: string): CometKind {
  if (text.length === 1) return "letter";
  if (text.length > 18) return "sentence";
  return "word";
}

/** About half the width of a comet's word label on the 640 px screen. */
export function labelHalfWidth(text: string): number {
  const kind = kindOf(text);
  if (kind === "sentence") return 200;
  if (kind === "letter") return 30;
  return text.length <= 9 ? 12 + text.length * 7 : 12 + text.length * 6.5;
}

/** Milliseconds a comet takes from the top to the shield. */
export function fallMs(text: string, paceWpm: number): number {
  const cps = (paceWpm * 5) / 60;
  return 2600 + (text.length / cps) * 1500;
}

export class CometSim {
  readonly items: Item[];
  readonly practice: boolean;
  readonly shieldMax: number;
  paceWpm: number;
  comets: Comet[] = [];
  shield: number;
  score = 0;
  combo = 0;
  bestCombo = 0;
  zapped = 0;
  dented = 0;
  /** What has been typed toward the locked comet(s). */
  buffer = "";
  spawned = 0;
  phase: "playing" | "over" = "playing";
  won = false;
  stats: TypingStats = { keystrokes: 0, correct: 0, errors: 0, chars: 0, missed: {}, activeMs: 0 };
  events: SimEvent[] = [];
  private nextId = 1;
  private spawnTimer = 0;
  private started = false;
  private rng: () => number;

  constructor(opts: SimOptions) {
    this.items = opts.items;
    this.practice = opts.practice;
    this.paceWpm = opts.paceWpm;
    this.shieldMax = opts.shieldMax ?? 5;
    this.shield = this.shieldMax;
    this.rng = opts.rng ?? Math.random;
    this.spawnTimer = 600;
  }

  get total() {
    return this.items.length;
  }

  /** How many comets may be in the sky at once. */
  maxOnScreen(): number {
    const next = this.items[this.spawned]?.text ?? "";
    if (kindOf(next) === "sentence" || this.comets.some((c) => c.kind === "sentence")) return 1;
    return this.paceWpm < 10 ? 2 : this.paceWpm < 18 ? 3 : 4;
  }

  private spawn() {
    const item = this.items[this.spawned++];
    const kind = kindOf(item.text);
    const halfW = labelHalfWidth(item.text);
    // Try a few spots and keep the one whose label overlaps least with comets still near the top.
    const near = this.comets.filter((o) => o.y < 90);
    let x = W / 2;
    let bestGap = -Infinity;
    for (let i = 0; i < 10; i++) {
      const cx = halfW + 10 + this.rng() * Math.max(0, W - 2 * halfW - 20);
      const gap = near.length ? Math.min(...near.map((o) => Math.abs(o.x - cx) - halfW - labelHalfWidth(o.text))) : 0;
      if (gap > bestGap) {
        bestGap = gap;
        x = cx;
      }
      if (!near.length) break;
    }
    // Gently faster as the round goes on (up to +25%).
    const ramp = 1 + 0.25 * (this.spawned / Math.max(1, this.items.length));
    const c: Comet = {
      id: this.nextId++, text: item.text, by: item.by, kind, x, y: -18, vy: ((HIT_Y + 18) / fallMs(item.text, this.paceWpm)) * ramp,
      phase: this.rng() * Math.PI * 2, waiting: false,
    };
    this.comets.push(c);
    this.events.push({ type: "spawn", comet: c });
  }

  /** Advance `dt` milliseconds (call only while not paused). */
  step(dt: number) {
    if (this.phase !== "playing") return;
    if (this.started) this.stats.activeMs += dt;
    this.spawnTimer -= dt;
    if (this.spawned < this.items.length && this.comets.length < this.maxOnScreen() && (this.spawnTimer <= 0 || this.comets.length === 0)) {
      this.spawn();
      this.spawnTimer = Math.max(900, 2600 - this.paceWpm * 40);
    }
    for (const c of [...this.comets]) {
      c.phase += dt * 0.004;
      if (c.waiting) continue;
      c.y += c.vy * dt;
      if (this.practice && c.y >= HOVER_Y) {
        c.y = HOVER_Y;
        c.waiting = true;
      } else if (!this.practice && c.y >= HIT_Y) {
        this.comets = this.comets.filter((o) => o !== c);
        this.shield = Math.max(0, this.shield - 1);
        this.dented++;
        this.combo = 0;
        this.events.push({ type: "hit", comet: c, shield: this.shield });
        if (this.shield <= 0) {
          this.finish(false);
          return;
        }
      }
    }
    if (this.buffer && !this.candidates().length) this.buffer = "";
    if (this.spawned >= this.items.length && this.comets.length === 0) this.finish(true);
  }

  private finish(won: boolean) {
    if (this.phase === "over") return;
    this.phase = "over";
    this.won = won;
    this.events.push({ type: "over", won });
  }

  /** Comets matching the typed buffer, lowest (most urgent) first. */
  candidates(buf = this.buffer): Comet[] {
    return this.comets.filter((c) => c.text.startsWith(buf)).sort((a, b) => b.y - a.y);
  }

  /** The comet the glowing key belongs to. */
  target(): Comet | null {
    if (this.buffer) return this.candidates()[0] ?? null;
    return [...this.comets].sort((a, b) => b.y - a.y)[0] ?? null;
  }

  /** The key to press next (glows on the keyboard), or null when the sky is empty. */
  nextKey(): string | null {
    const t = this.target();
    return t ? t.text[this.buffer.length] ?? null : null;
  }

  /** Type one character. Returns what happened. */
  type(ch: string): "zap" | "hit" | "miss" | "ignored" {
    if (this.phase !== "playing" || ch.length !== 1 || !this.comets.length) return "ignored";
    this.started = true;
    this.stats.keystrokes++;
    const next = this.buffer + ch;
    const cands = this.candidates(next);
    if (!cands.length) {
      const expected = this.nextKey();
      this.stats.errors++;
      if (expected !== null) {
        const k = statKey(expected);
        this.stats.missed[k] = (this.stats.missed[k] ?? 0) + 1;
      }
      this.combo = 0;
      this.events.push({ type: "miss", ch, expected });
      return "miss";
    }
    this.stats.correct++;
    this.stats.chars++;
    const done = cands.find((c) => c.text === next);
    if (done) {
      this.comets = this.comets.filter((c) => c !== done);
      this.buffer = "";
      this.zapped++;
      this.combo++;
      this.bestCombo = Math.max(this.bestCombo, this.combo);
      const points = 10 * done.text.length * multiplier(this.combo);
      this.score += points;
      this.events.push({ type: "zap", comet: done, points, combo: this.combo });
      if (this.spawned >= this.items.length && this.comets.length === 0) this.finish(true);
      return "zap";
    }
    this.buffer = next;
    this.events.push({ type: "key", ch, comet: cands[0] });
    return "hit";
  }

  drainEvents(): SimEvent[] {
    const e = this.events;
    this.events = [];
    return e;
  }
}

/** Combo multiplier: x1, then +1 every 5 zaps in a row, up to x5. */
export function multiplier(combo: number): number {
  return Math.min(5, 1 + Math.floor(Math.max(0, combo - 1) / 5));
}
