/*
 * Story length: every built-in story is Short, Medium or Long, and which lengths a grade band
 * can pick (and how many blanks each may have) depends on the band:
 *   K-2   Short (6-9) · Medium (10-12, still picture cards)
 *   3-5   Short (6-9) · Medium (10-14) · Long (15-16)
 *   6-8   Short (6-9) · Medium (10-14) · Long (15-22)
 *   9-12  Short (6-9) · Medium (10-14) · Long (15-22)
 * The player's length choice is remembered on this device under "arcade.silly-story.length.v1"
 * (the arcade's player switcher files it per player).
 */
import { BANDS, type Band, type Story, type StoryLength } from "./types";

export type LengthFilter = StoryLength | "all";

export const LENGTHS: StoryLength[] = ["short", "medium", "long"];
export const LENGTH_FILTERS: LengthFilter[] = ["all", ...LENGTHS];
export const LENGTH_KEY = "arcade.silly-story.length.v1";
/** The most blanks a built-in story may have. */
export const MAX_STORY_BLANKS = 22;

export const LENGTH_LABEL: Record<LengthFilter, string> = { all: "All", short: "Short", medium: "Medium", long: "Long" };

/** Blank-count range for each length, per band. A missing length isn't offered to that band. */
export const BAND_LENGTHS: Record<Band, Partial<Record<StoryLength, [number, number]>>> = {
  "K-2": { short: [6, 9], medium: [10, 12] },
  "3-5": { short: [6, 9], medium: [10, 14], long: [15, 16] },
  "6-8": { short: [6, 9], medium: [10, 14], long: [15, MAX_STORY_BLANKS] },
  "9-12": { short: [6, 9], medium: [10, 14], long: [15, MAX_STORY_BLANKS] },
};

/** The lengths a band can choose from (in Short → Long order). */
export function lengthsFor(band: Band): StoryLength[] {
  return LENGTHS.filter((l) => BAND_LENGTHS[band][l]);
}

/** The length a number of blanks counts as (used for kids' own stories). */
export function lengthOfCount(n: number): StoryLength {
  return n <= 9 ? "short" : n <= 14 ? "medium" : "long";
}

/** Does a story with `n` blanks fit its length tag within its band's limits? */
export function fitsLength(band: Band, length: StoryLength, n: number): boolean {
  const range = BAND_LENGTHS[band][length];
  return !!range && n >= range[0] && n <= range[1];
}

/** A range as words: "10–14 blanks". */
export function rangeText(band: Band, length: StoryLength): string {
  const range = BAND_LENGTHS[band][length];
  return range ? `${range[0]}–${range[1]} blanks` : "";
}

/**
 * The filter to use for a band, from a saved (possibly stale or junk) value:
 * unknown values and lengths the band doesn't offer (Long for K-2) fall back to "all".
 */
export function effectiveLength(saved: unknown, band: Band): LengthFilter {
  if (saved === "all") return "all";
  if (typeof saved === "string" && (LENGTHS as string[]).includes(saved) && lengthsFor(band).includes(saved as StoryLength)) return saved as StoryLength;
  return "all";
}

export function loadLength(): string | null {
  try {
    return localStorage.getItem(LENGTH_KEY);
  } catch {
    return null;
  }
}

export function saveLength(f: LengthFilter) {
  try {
    localStorage.setItem(LENGTH_KEY, f);
  } catch {
    // ignore (private browsing)
  }
}

export interface StoryPick {
  list: Story[];
  /** Set when the band has none of that length yet and the list comes from the nearest band that does. */
  from?: Band;
}

/**
 * Stories for a band tab and length filter. If the band has no stories of that length yet,
 * the nearest band that does (the younger one first) fills in, so a filter is never empty.
 */
export function pickStories(stories: Story[], band: Band, filter: LengthFilter): StoryPick {
  const inBand = stories.filter((s) => s.band === band);
  if (filter === "all") return { list: inBand };
  const own = inBand.filter((s) => s.length === filter);
  if (own.length) return { list: own };
  const i = BANDS.indexOf(band);
  for (let d = 1; d < BANDS.length; d++) {
    for (const j of [i - d, i + d]) {
      const b = BANDS[j];
      if (!b) continue;
      const list = stories.filter((s) => s.band === b && s.length === filter);
      if (list.length) return { list, from: b };
    }
  }
  return { list: [] };
}
