/*
 * Builds kit Question objects from case content (pure, no DOM), so every in-case answer is recorded
 * with recordAnswer under an NC code, and the tests can validate them:
 *  - jump:     where and when did the thread go next? (diffusion)
 *  - reweave:  after bead X, what came next?            (chronology)
 *  - why:      why did it move?                          (cause and effect)
 *  - source:   a source check                            (sourcing)
 */
import { centuryLabel } from "@/chase/clues";
import { place } from "@/chase/places";
import type { Grade, Question } from "@/kit/types";
import { BAND_RULES, beadsFor } from "./bands";
import { codeFor, SKILL_NAMES } from "./standards";
import type { Band, Bead, Case, SkillId } from "./types";

function q(grade: Grade, c: Case, skill: SkillId, id: string, prompt: string, choices: [string, string, string, string], explanation: string, passage?: string): Question {
  return {
    id: `tc-${id}`,
    subject: "social",
    grade,
    standard: codeFor(grade, c, skill),
    skill: SKILL_NAMES[skill],
    prompt,
    choices,
    answer: 0,
    explanation,
    ...(passage ? { passage } : {}),
  };
}

export function beadLabel(b: Bead, band: Band): string {
  const mode = BAND_RULES[band].reweave;
  if (mode === "dates") return `${b.title} (${b.era})`;
  if (mode === "centuries") return `${b.title} (${centuryLabel(b.year)})`;
  return b.title;
}

export const THREAD_ENDS = "Nothing: the thread ends here";

/** "What came next?" for every bead but the last, correct choice first (decks shuffle at display). */
export function reweaveQuestions(grade: Grade, band: Band, c: Case): Question[] {
  const beads = beadsFor(c, band);
  return beads.slice(0, -1).map((b, i) => {
    const next = beads[i + 1];
    const others = beads.filter((_x, j) => j !== i && j !== i + 1).map((x) => beadLabel(x, band));
    // Prefer later beads (the tempting mistake is skipping ahead), then earlier ones.
    const later = beads.slice(i + 2).map((x) => beadLabel(x, band));
    const pool = [...later, ...others.filter((o) => !later.includes(o))];
    const wrong = pool.slice(0, 3);
    while (wrong.length < 3) wrong.push(THREAD_ENDS);
    const unique = [...new Set(wrong)];
    if (unique.length < 3) unique.push(...[THREAD_ENDS].filter((t) => !unique.includes(t)));
    const choices = [beadLabel(next, band), ...unique.slice(0, 3)] as [string, string, string, string];
    const p = place(next.place);
    return q(
      grade,
      c,
      "chronology",
      `${c.id}-rw-${i}`,
      `Re-weave: after "${b.title}" (${place(b.place).name}), what came next on the ${c.thread} thread?`,
      choices,
      `Next came ${next.title} in ${p.name}, ${next.era}.`,
    );
  });
}

export function whyQuestions(grade: Grade, band: Band, c: Case): Question[] {
  return c.why
    .filter((w) => w.bands.includes(band))
    .map((w, i) => q(grade, c, "cause", `${c.id}-why-${band}-${i}`, w.prompt, w.choices, w.explanation));
}

export function sourceQuestions(grade: Grade, band: Band, c: Case): Question[] {
  return c.sourceChecks
    .filter((s) => s.bands.includes(band))
    .slice(0, BAND_RULES[band].sourceChecks)
    .map((s) => q(grade, c, "sourcing", s.id, s.prompt, s.choices, s.explanation, `${s.passage}\n— ${s.cite}`));
}

/** A record-only question for a jump (first try counts), so the report can show diffusion by standard. */
export function jumpQuestion(grade: Grade, c: Case, from: Bead, to: Bead, choices: string[], right: string): Question {
  const wrong = choices.filter((x) => x !== right);
  while (wrong.length < 3) wrong.push("—");
  return q(
    grade,
    c,
    "diffusion",
    `${to.id}-jump`,
    `Where and when did the ${c.thread} thread go after ${from.title}?`,
    [right, wrong[0], wrong[1], wrong[2]],
    `${to.title}: ${place(to.place).name}, ${to.era}.`,
  );
}
