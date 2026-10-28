/* Flesch–Kincaid grade level of a book's body text (narration + dialogue). */
import type { Story } from "./types";

export function countSyllables(word: string): number {
  let w = word.toLowerCase().replace(/[^a-z]/g, "");
  if (!w) return 0;
  if (w.length <= 3) return 1;
  w = w.replace(/(?:[^laeiouy]es|[^laeiouy]ed|[^laeiouy]e)$/, (m) => m[0]).replace(/^y/, "");
  const groups = w.match(/[aeiouy]+/g);
  return Math.max(1, groups ? groups.length : 1);
}

export interface Readability {
  words: number;
  sentences: number;
  syllables: number;
  /** Flesch–Kincaid grade level (0 when there is no text). */
  grade: number;
}

export function readability(raw: string): Readability {
  // Titles are not sentence ends; "..." (or …) is a pause, not a full stop.
  const text = raw.replace(/\b(Mr|Mrs|Ms|Dr|St|Jr|Sr|Prof)\./g, "$1").replace(/\.{3,}|…/g, ",");
  const words = text.match(/[A-Za-z][A-Za-z'’-]*/g) ?? [];
  const sentences = Math.max(1, (text.match(/[.!?]+(?=\s|$|["'”’)])/g) ?? []).length);
  const syllables = words.reduce((n, w) => n + countSyllables(w), 0);
  if (words.length === 0) return { words: 0, sentences: 0, syllables: 0, grade: 0 };
  const grade = 0.39 * (words.length / sentences) + 11.8 * (syllables / words.length) - 15.59;
  return { words: words.length, sentences, syllables, grade: Math.round(grade * 10) / 10 };
}

export function bodyText(story: Story): string {
  return story.pages.flatMap((p) => p.blocks.map((b) => (b.kind === "heading" ? `${b.text}.` : b.text))).join(" ");
}

export function storyReadability(story: Story): Readability {
  return readability(bodyText(story));
}
