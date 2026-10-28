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
import { answer as mathAnswer, hint as mathHint, makeItem, startMath, type Attempt, type MathState, type QResult } from "@/math/play";

export const MAX_HEARTS = 3;
export const POINTS = { gateFirstTry: 100, gateLater: 25, chainBonus: 150, win: 300, secret: 300, secretBonus: 500, lose: 50, newEnding: 200, transmission: 50 };

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
  /** Math gates (Unit 3): the generated question and its progress. */
  math?: MathState;
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
  /** Math results this read (one per question answered), for the skill report. */
  math: QResult[];
}

/** Special edition: no hearts at any grade. Wrong answers never cost anything (gentle rules). */
export const usesHearts = (_grade: number) => false;

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
  if (p.gate.kind === "math" && p.gate.math) {
    const math = startMath(makeItem(p.gate.math));
    return { page: p.id, order: [], misses: 0, placed: [], status: "open", lastWrong: null, math };
  }
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
  const run: RunState = { v: 1, page: start, hearts: MAX_HEARTS, checkpoint: start, clues: [], score: 0, log: [], gate: null, visited: [], transmissions: [], math: [] };
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

export type MathResult = "ignored" | "wrong" | "breakdown" | "step" | "right";

/**
 * Answer a math gate. Gentle rules: a miss never costs a heart, never reveals the answer and
 * never ends the story; Quill names the mistake and the player tries again (or, in a chain,
 * works through the steps).
 */
export function answerMathGate(story: Story, run: RunState, display: number): { run: RunState; result: MathResult; attempt: Attempt | null } {
  const p = pageOf(story, run.page);
  const g = run.gate;
  if (!p?.gate || p.gate.kind !== "math" || !g?.math || g.status === "solved") return { run, result: "ignored", attempt: null };
  const { s, event, attempt } = mathAnswer(g.math, display);
  if (event === "ignored") return { run, result: "ignored", attempt: null };
  const newResults = s.results.slice(g.math.results.length);
  let next: RunState = { ...run, math: [...run.math, ...newResults] };
  const misses = g.misses + (attempt && !attempt.correct ? 1 : 0);
  if (event === "done") {
    let score = next.score + (s.firstTry ? POINTS.gateFirstTry : POINTS.gateLater);
    let clues = next.clues;
    if (s.bonus && s.item.kind === "chain") {
      score += POINTS.chainBonus;
      const clue = `★ ${p.gate.bonus || s.item.c.clue}`;
      if (!clues.includes(clue)) clues = [...clues, clue];
    }
    next = { ...next, score, clues, gate: { ...g, math: s, misses, status: "solved", lastWrong: null } };
    return { run: next, result: "right", attempt };
  }
  next = { ...next, gate: { ...g, math: s, misses, status: event === "wrong" || event === "breakdown" ? "wrong" : "open" } };
  return { run: next, result: event, attempt };
}

export function hintMathGate(run: RunState): RunState {
  const g = run.gate;
  if (!g?.math || g.status === "solved") return run;
  return { ...run, gate: { ...g, math: mathHint(g.math) } };
}
