/*
 * Reading-session rules (pure, no DOM): pages, clues, checkpoints, gates, hearts, score.
 * Losing depends on the PLAYER's grade, not the book (PAGE_QUEST.md):
 *  - grade >= 6: 3 COURAGE hearts. A wrong gate answer costs a heart, shows the hint and lets
 *    you retry. At 0 hearts: "THE END?" → restart at the last checkpoint with full hearts.
 *  - grades 4-5: no hearts. First miss: hint, retry. Second miss: the answer is revealed and
 *    the story continues.
 */
import type { Page, Story } from "@/story/types";
import { standardFor } from "@/story/standards";

export const MAX_HEARTS = 3;
export const POINTS = { gateFirstTry: 100, gateLater: 25, win: 300, secret: 300, secretBonus: 500, lose: 50, newEnding: 200, transmission: 50 };

export interface LogEntry {
  standard: string;
  skill: string;
  correct: boolean;
  kind: "gate" | "transmission";
  page?: string;
}

export interface GateState {
  page: string;
  /** Display position → index in the file (answers for mc, items for order). */
  order: number[];
  misses: number;
  /** Order gates: file indices placed so far (always a correct prefix). */
  placed: number[];
  status: "open" | "wrong" | "reveal" | "solved";
  /** Display index of the last wrong pick. */
  lastWrong: number | null;
}

export interface RunState {
  v: 1;
  page: string;
  hearts: number;
  checkpoint: string;
  clues: string[];
  score: number;
  log: LogEntry[];
  gate: GateState | null;
  visited: string[];
  transmissions: string[];
}

export const usesHearts = (grade: number) => grade >= 6;

function shuffle<T>(a: T[]): T[] {
  const r = [...a];
  for (let i = r.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [r[i], r[j]] = [r[j], r[i]];
  }
  return r;
}

export function pageOf(story: Story, id: string): Page | undefined {
  return story.pages.find((p) => p.id === id);
}

function gateFor(p: Page): GateState | null {
  if (!p.gate) return null;
  const n = p.gate.kind === "mc" ? p.gate.answers.length : p.gate.items.length;
  let order = shuffle([...Array(n).keys()]);
  // An order gate never starts already in order.
  if (p.gate.kind === "order" && n > 1) while (order.every((v, i) => v === i)) order = shuffle(order);
  return { page: p.id, order, misses: 0, placed: [], status: "open", lastWrong: null };
}

/** Show a page: collect its clues, remember checkpoints, set up its gate. */
export function enter(story: Story, run: RunState, id: string): RunState {
  const p = pageOf(story, id);
  if (!p) return run;
  const clues = [...run.clues];
  for (const c of p.clues) if (!clues.includes(c)) clues.push(c);
  return {
    ...run,
    page: id,
    clues,
    checkpoint: p.checkpoint ? id : run.checkpoint,
    visited: run.visited.includes(id) ? run.visited : [...run.visited, id],
    gate: gateFor(p),
  };
}

export function newRun(story: Story, _grade: number, from?: string): RunState {
  const start = from && pageOf(story, from) ? from : story.start;
  const run: RunState = { v: 1, page: start, hearts: MAX_HEARTS, checkpoint: start, clues: [], score: 0, log: [], gate: null, visited: [], transmissions: [] };
  return enter(story, run, start);
}

/** Take choice `i`, or (i ignored) continue after a solved/revealed gate. */
export function advance(story: Story, run: RunState, i: number): RunState {
  const p = pageOf(story, run.page);
  if (!p) return run;
  if (p.gate) {
    if (!run.gate || (run.gate.status !== "solved" && run.gate.status !== "reveal")) return run;
    return enter(story, run, p.gate.next);
  }
  const c = p.choices[i];
  return c ? enter(story, run, c.target) : run;
}

export type GateResult = "right" | "placed" | "wrong" | "reveal" | "lose" | "ignored";

function logGate(story: Story, run: RunState, grade: number, correct: boolean): RunState {
  const p = pageOf(story, run.page)!;
  const { code, skill } = standardFor(p.gate!.anchor, grade);
  return { ...run, log: [...run.log, { standard: code, skill, correct, kind: "gate", page: p.id }] };
}

function miss(story: Story, run: RunState, gate: GateState, grade: number, display: number): { run: RunState; result: GateResult } {
  const g: GateState = { ...gate, misses: gate.misses + 1, lastWrong: display, status: "wrong" };
  if (usesHearts(grade)) {
    const hearts = run.hearts - 1;
    if (hearts <= 0) return { run: logGate(story, { ...run, hearts: 0, gate: g }, grade, false), result: "lose" };
    return { run: { ...run, hearts, gate: g }, result: "wrong" };
  }
  if (g.misses >= 2) {
    const p = pageOf(story, run.page)!;
    const n = p.gate!.kind === "order" ? p.gate!.items.length : 0;
    const revealed: GateState = { ...g, status: "reveal", placed: [...Array(n).keys()] };
    return { run: logGate(story, { ...run, gate: revealed }, grade, false), result: "reveal" };
  }
  return { run: { ...run, gate: g }, result: "wrong" };
}

function solve(story: Story, run: RunState, gate: GateState, grade: number): RunState {
  const first = gate.misses === 0;
  const r = logGate(story, { ...run, gate: { ...gate, status: "solved" } }, grade, first);
  return { ...r, score: r.score + (first ? POINTS.gateFirstTry : POINTS.gateLater) };
}

const open = (g: GateState | null) => !!g && (g.status === "open" || g.status === "wrong");

export function answerMc(story: Story, run: RunState, display: number, grade: number): { run: RunState; result: GateResult } {
  const p = pageOf(story, run.page);
  const g = run.gate;
  if (!p?.gate || p.gate.kind !== "mc" || !g || !open(g)) return { run, result: "ignored" };
  const idx = g.order[display];
  if (idx === undefined) return { run, result: "ignored" };
  if (p.gate.answers[idx].correct) return { run: solve(story, run, g, grade), result: "right" };
  return miss(story, run, g, grade, display);
}

export function tapOrder(story: Story, run: RunState, display: number, grade: number): { run: RunState; result: GateResult } {
  const p = pageOf(story, run.page);
  const g = run.gate;
  if (!p?.gate || p.gate.kind !== "order" || !g || !open(g)) return { run, result: "ignored" };
  const idx = g.order[display];
  if (idx === undefined || g.placed.includes(idx)) return { run, result: "ignored" };
  if (idx === g.placed.length) {
    const placed = [...g.placed, idx];
    const ng: GateState = { ...g, placed, lastWrong: null, status: g.status };
    if (placed.length === p.gate.items.length) return { run: solve(story, run, ng, grade), result: "right" };
    return { run: { ...run, gate: ng }, result: "placed" };
  }
  return miss(story, run, g, grade, display);
}

/** After "THE END?" (0 hearts) or a lose ending: back to the last checkpoint with full hearts. */
export function restartFromCheckpoint(story: Story, run: RunState): RunState {
  return enter(story, { ...run, hearts: MAX_HEARTS, gate: null }, run.checkpoint || story.start);
}

export function correctIndex(story: Story, run: RunState): number {
  const p = pageOf(story, run.page);
  if (!p?.gate || !run.gate) return -1;
  if (p.gate.kind === "mc") return run.gate.order.findIndex((i) => p.gate!.answers[i].correct);
  return run.gate.order.indexOf(run.gate.placed.length);
}
