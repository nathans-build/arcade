/*
 * The shelf. Every src/stories/**\/*.story file is bundled (Vite glob) and parsed at start-up;
 * new books dropped into src/stories/4-5/, 6-8/ or 9-12/ show up automatically. Books with
 * validation errors stay off the shelf (npm test reports them). The sample book in
 * src/stories/sample/ is the HOW TO PLAY book, and also sits in its genre until real books
 * exist for that genre.
 */
import { checkStory } from "@/story/validate";
import { BANDS, type Band, type Genre } from "@/story/roster";
import type { Issue, Story } from "@/story/types";

export interface Book {
  id: string;
  story: Story;
  errors: Issue[];
  sample: boolean;
  /** Written in the Writer's Desk (this browser). */
  draft: boolean;
  endings: { page: string; type: string; name: string }[];
  readingLevel: number;
}

const files = import.meta.glob("./stories/**/*.story", { query: "?raw", import: "default", eager: true }) as Record<string, string>;

export function makeBook(id: string, text: string, opts: { sample?: boolean; draft?: boolean } = {}): Book {
  const r = checkStory(text);
  return {
    id,
    story: r.story,
    errors: r.errors,
    sample: !!opts.sample,
    draft: !!opts.draft,
    endings: r.story.pages.filter((p) => p.end).map((p) => ({ page: p.id, type: p.end!.type, name: p.end!.name })),
    readingLevel: r.stats.readability.grade,
  };
}

export const ALL_BOOKS: Book[] = Object.entries(files)
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([path, text]) => {
    const id = path.replace(/^\.\/stories\//, "").replace(/\.story$/, "");
    const b = makeBook(id, text, { sample: id.startsWith("sample/") });
    if (b.errors.length) console.warn(`Page Quest: "${id}" has ${b.errors.length} error(s) and is not on the shelf. Run npm test.`);
    return b;
  });

export const SHELF_BOOKS = ALL_BOOKS.filter((b) => b.errors.length === 0);
export const HOW_TO_PLAY = SHELF_BOOKS.find((b) => b.sample) ?? null;

const bandRank = (b: string) => (BANDS as readonly string[]).indexOf(b);

/** Books in a genre section, lowest band first. The sample only shows when the genre has no real book. */
export function genreBooks(books: Book[], genre: Genre): Book[] {
  const real = books.filter((b) => !b.sample && !b.draft && b.story.genre === genre);
  const list = real.length ? real : books.filter((b) => b.sample && b.story.genre === genre);
  return [...list].sort((a, b) => bandRank(a.story.band) - bandRank(b.story.band) || a.story.title.localeCompare(b.story.title));
}

export type BandTag = "YOUR LEVEL" | "EASY READ" | "CHALLENGE";

export function bandTag(bookBand: string, playerBand: Band | null): BandTag {
  if (!playerBand) return "YOUR LEVEL";
  const d = bandRank(bookBand) - bandRank(playerBand);
  return d === 0 ? "YOUR LEVEL" : d < 0 ? "EASY READ" : "CHALLENGE";
}
