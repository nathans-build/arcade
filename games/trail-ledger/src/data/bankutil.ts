import type { Band, BankItem, ExpeditionId } from "./types";

/** [landmark id or "", NC code, skill, prompt, choices (correct first), explanation] */
export type Row = [string, string, string, string, [string, string, string, string], string];

/** quick = no passage, prompt ≤ 100 characters and every choice ≤ 14 (the kit's rule). */
export function isQuick(prompt: string, choices: readonly string[], passage?: string): boolean {
  return !passage && prompt.length <= 100 && choices.every((c) => c.length <= 14);
}

export function rows(exp: ExpeditionId, band: Band, prefix: string, list: Row[]): BankItem[] {
  return list.map(([landmark, code, skill, prompt, choices, explanation], i) => ({
    id: `${prefix}-b${band}-${String(i + 1).padStart(2, "0")}`,
    exp,
    band,
    ...(landmark ? { landmark } : {}),
    code,
    skill,
    prompt,
    choices,
    answer: 0 as const,
    explanation,
    quick: isQuick(prompt, choices),
  }));
}
