import type { Question } from "./types";

/* Per-browser progress, stored separately for each game. */

export interface StandardStats {
  seen: number;
  correct: number;
}

export interface Progress {
  highScore: number;
  standards: Record<string, StandardStats>;
}

const key = (gameId: string) => `arcade.${gameId}.progress.v1`;

export function loadProgress(gameId: string): Progress {
  try {
    const raw = localStorage.getItem(key(gameId));
    if (raw) {
      const p = JSON.parse(raw) as Progress;
      return { highScore: p.highScore ?? 0, standards: p.standards ?? {} };
    }
  } catch {
    // storage unavailable or corrupt
  }
  return { highScore: 0, standards: {} };
}

export function saveProgress(gameId: string, p: Progress) {
  try {
    localStorage.setItem(key(gameId), JSON.stringify(p));
  } catch {
    // ignore
  }
}

/** Record one answer against its standard and persist. Returns the updated progress. */
export function recordAnswer(gameId: string, q: Question, correct: boolean): Progress {
  const p = loadProgress(gameId);
  const s = p.standards[q.standard] ?? { seen: 0, correct: 0 };
  p.standards[q.standard] = { seen: s.seen + 1, correct: s.correct + (correct ? 1 : 0) };
  saveProgress(gameId, p);
  return p;
}

/** Save a new high score if it beats the old one. Returns the high score. */
export function submitScore(gameId: string, score: number): number {
  const p = loadProgress(gameId);
  if (score > p.highScore) {
    p.highScore = score;
    saveProgress(gameId, p);
  }
  return p.highScore;
}
