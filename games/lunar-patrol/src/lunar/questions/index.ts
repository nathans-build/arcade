// Lunar Patrol's view of the shared arcade kit: K-12 questions (NC standards),
// per-grade decks, and saved progress. The engine and UI only talk to this file.
import {
  QuestionDeck as KitDeck,
  loadProgress as kitLoadProgress,
  saveProgress as kitSaveProgress,
  type DealtQuestion,
  type Grade,
  type Progress,
  type Subject,
  type SubjectMode,
} from "@/kit";

export type { DealtQuestion, Grade, Progress, Subject, SubjectMode };

export const GAME_ID = "lunar-patrol";

export const SUBJECT_LABELS: Record<Subject, string> = {
  math: "MATH",
  science: "SCIENCE",
  ela: "ELA",
  social: "SOCIAL STUDIES",
};

/** Checkpoints use any question; Quiz Squadron waves need short ("quick") ones. */
export class QuestionDeck {
  private full: KitDeck;
  private quick: KitDeck;

  constructor(mode: SubjectMode, grade: Grade) {
    this.full = new KitDeck(grade, mode, { gameId: GAME_ID });
    this.quick = new KitDeck(grade, mode, { gameId: GAME_ID, quickOnly: true });
  }

  draw(quickOnly = false): DealtQuestion {
    return (quickOnly ? this.quick : this.full).draw();
  }
}

const LEGACY_KEY = "lunarPatrol.progress.v1"; // grade 6-only version

export function loadProgress(): Progress {
  const p = kitLoadProgress(GAME_ID);
  if (p.highScore === 0 && Object.keys(p.standards).length === 0) {
    // Carry over high score and standards from the original grade 6 game.
    try {
      const raw = localStorage.getItem(LEGACY_KEY);
      if (raw) {
        const old = JSON.parse(raw) as Progress;
        const migrated = { highScore: old.highScore ?? 0, standards: old.standards ?? {} };
        kitSaveProgress(GAME_ID, migrated);
        return migrated;
      }
    } catch {
      // ignore
    }
  }
  return p;
}

export function saveProgress(p: Progress) {
  kitSaveProgress(GAME_ID, p);
}
