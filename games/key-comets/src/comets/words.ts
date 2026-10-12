/*
 * Free-play word lists by grade band, plus original sentences and public-domain quotes.
 * Every word here is checked by scripts/check-rules.ts: kid-safe (blocklist), spelled from the
 * reviewed allowlist (scripts/spelling.ts), and short enough to fit on a comet.
 */
import type { Grade } from "@/kit/types";
import { gradeNumber } from "@/kit/grades";

export type Band = "k1" | "23" | "45" | "68" | "912";

export const BANDS: Band[] = ["k1", "23", "45", "68", "912"];

export function bandOf(g: Grade): Band {
  const n = gradeNumber(g);
  if (n <= 1) return "k1";
  if (n <= 3) return "23";
  if (n <= 5) return "45";
  if (n <= 8) return "68";
  return "912";
}

export const BAND_LABEL: Record<Band, string> = {
  k1: "Grades K–1",
  "23": "Grades 2–3",
  "45": "Grades 4–5",
  "68": "Grades 6–8",
  "912": "Grades 9–12",
};

/** A thing to type. `by` credits a quote's author (shown after it is typed). */
export interface Item {
  text: string;
  by?: string;
}

export const HOME_ROW_LETTERS = ["a", "s", "d", "f", "j", "k", "l"];
export const ALPHABET = "abcdefghijklmnopqrstuvwxyz".split("");

/** Grade 1 free play mixes letters with tiny sight words. */
export const TINY_WORDS = [
  "a", "I", "at", "am", "an", "and", "as", "be", "big", "can", "cat", "dog", "go", "he", "in", "is", "it", "me",
  "my", "no", "on", "red", "run", "see", "she", "sun", "the", "to", "up", "we", "yes", "you", "hop", "mom", "dad", "fun",
];

/** Grades 2–3: sight words and short spelling words. */
export const WORDS_23 = [
  "about", "after", "again", "always", "around", "because", "been", "before", "best", "both", "bring", "call",
  "carry", "clean", "cold", "could", "does", "done", "down", "draw", "drink", "eight", "every", "fast", "first",
  "five", "found", "full", "gave", "goes", "green", "grow", "hold", "keep", "kind", "laugh", "light", "long", "made",
  "many", "much", "myself", "never", "night", "only", "open", "over", "pick", "play", "please", "pretty", "pull",
  "read", "right", "round", "seven", "show", "sing", "sleep", "small", "start", "tell", "thank", "their", "these",
  "those", "today", "together", "try", "upon", "very", "walk", "warm", "wash", "which", "wish", "work", "would",
  "write", "your", "ship", "shop", "chip", "lunch", "frog", "snack", "stamp", "plant", "truck", "cake", "bike",
  "home", "rope", "cute", "rain", "boat", "tree", "seed",
];

/** Grades 4–5: grade spelling and vocabulary words. */
export const WORDS_45 = [
  "accept", "adventure", "ancient", "anxious", "arrive", "balance", "beneath", "brilliant", "calendar", "capture",
  "celebrate", "character", "citizen", "climate", "compare", "courage", "curious", "decision", "describe", "discover",
  "distance", "energy", "enormous", "equator", "evidence", "explore", "favorite", "fraction", "generous", "habitat",
  "harvest", "history", "imagine", "island", "journey", "language", "library", "machine", "measure", "mineral",
  "mystery", "natural", "neighbor", "observe", "ocean", "orbit", "patient", "planet", "predict", "promise", "purpose",
  "question", "receive", "recycle", "sentence", "special", "surprise", "temperature", "thousand", "village", "weather",
  "whisper", "wonder",
];

/** Grades 6–8: longer vocabulary words. */
export const WORDS_68 = [
  "abundant", "accurate", "analyze", "atmosphere", "boundary", "catastrophe", "civilization", "collaborate",
  "consequence", "contradict", "democracy", "dimension", "eloquent", "environment", "equation", "estimate", "evaluate",
  "examine", "exaggerate", "fascinating", "geography", "hypothesis", "illustrate", "independent", "influence",
  "interpret", "investigate", "legislature", "magnificent", "metaphor", "migration", "narrative", "negotiate",
  "observation", "organism", "perspective", "persuade", "photosynthesis", "population", "precipitation", "prediction",
  "relationship", "resilient", "revolution", "significant", "strategy", "summarize", "symbolize", "technology",
  "territory", "thermometer", "translate", "variable", "vocabulary", "volunteer",
];

/** Grades 2–3 short sentences (final lesson). */
export const SENTENCES_23 = [
  "The dog can run fast.", "I like to read books.", "We play at the park.", "The sun is very hot.",
  "My cat naps all day.", "Frogs jump in the pond.", "Can you help me?", "Look at the big moon!",
  "We grow beans and corn.", "Birds sing in the morning.", "I have two red kites.", "The bus is on time.",
];

/** Grades 4–5 sentences (final lesson). */
export const SENTENCES_45 = [
  "The planet Mars looks red at night.", "Bees help flowers make seeds.", "Our class read a mystery book.",
  "A good friend is kind and fair.", "The river flows to the ocean.", "We measured the rain in a jar.",
  "Maps help us find our way.", "Clouds are made of tiny drops of water.", "Owls can see well in the dark.",
  "My team won the spelling bee!", "Raleigh is the capital of our state.", "Please return books on time.",
];

/** Grades 6–8 short sentences (free play mixes these with the long words). */
export const SENTENCES_68 = [
  "Read the map before you hike.", "Rivers carve canyons over time.", "A good plan starts with a question.",
  "Plants turn sunlight into food.", "Our class built a solar oven.", "The comet tail points away from the sun.",
  "Practice makes your fingers faster.", "Every vote counts in a democracy.", "Fractions and decimals are friends.",
  "Check your work, then check it again.", "The library opens at nine.", "Volcanoes can build new islands.",
  "Keep your wrists up and relaxed.", "Look at the screen, not the keys.", "Strong writers revise their drafts.",
];

/** Grades 9–12: original sentences. */
export const SENTENCES_912 = [
  "Curiosity is the engine of every great discovery.", "A clear thesis guides the reader through an essay.",
  "Evidence matters more than volume in an argument.", "The best drafts are the ones you are willing to revise.",
  "Strong typists keep their eyes on the words, not the keys.", "Light from distant stars left them before we were born.",
  "Good questions open more doors than quick answers.", "Every expert was once a beginner who kept practicing.",
  "Compound interest rewards those who start saving early.", "A citizen who reads widely can weigh both sides of a debate.",
  "Data tells a story only when it is read with care.", "Kindness costs nothing and is worth more than gold.",
  "The scientific method turns guesses into knowledge.", "Precise words make a persuasive essay much stronger.",
  "Steady practice beats last-minute cramming every time.",
];

/** Grades 9–12: public-domain quotes, with attribution. */
export const QUOTES: Item[] = [
  { text: "Well done is better than well said.", by: "Benjamin Franklin" },
  { text: "Energy and persistence conquer all things.", by: "Benjamin Franklin" },
  { text: "Hitch your wagon to a star.", by: "Ralph Waldo Emerson" },
  { text: "Nothing great was ever achieved without enthusiasm.", by: "Ralph Waldo Emerson" },
  { text: "Hope is the thing with feathers.", by: "Emily Dickinson" },
  { text: "I'm nobody! Who are you?", by: "Emily Dickinson" },
  { text: "A journey of a thousand miles begins with a single step.", by: "Laozi, Tao Te Ching" },
  { text: "The only thing we have to fear is fear itself.", by: "Franklin D. Roosevelt, 1933" },
  { text: "With malice toward none, with charity for all", by: "Abraham Lincoln, 1865" },
  { text: "Two roads diverged in a yellow wood,", by: "Robert Frost, 1916" },
  { text: "I wandered lonely as a cloud", by: "William Wordsworth" },
  { text: "To be, or not to be, that is the question.", by: "William Shakespeare, Hamlet" },
  { text: "All the world's a stage.", by: "William Shakespeare, As You Like It" },
  { text: "Be not afraid of greatness.", by: "William Shakespeare, Twelfth Night" },
  { text: "It was the best of times, it was the worst of times.", by: "Charles Dickens" },
  { text: "Simplicity, simplicity, simplicity!", by: "Henry David Thoreau, Walden" },
  { text: "We hold these truths to be self-evident,", by: "Declaration of Independence, 1776" },
];

/** K–1 final-lesson words and tiny sentences. */
export const SENTENCES_K1 = ["I can run.", "I see a cat.", "We can hop.", "Look at me!", "The sun is up.", "I like red."];

/** Free-play items for a grade (before shuffling). */
export function freePool(g: Grade): Item[] {
  const n = gradeNumber(g);
  const t = (list: string[]) => list.map((text) => ({ text }));
  if (n === 0) return t(ALPHABET);
  if (n === 1) return [...t(ALPHABET), ...t(TINY_WORDS)];
  if (n <= 3) return t(WORDS_23);
  if (n <= 5) return t(WORDS_45);
  if (n <= 8) return [...t(WORDS_68), ...t(SENTENCES_68)];
  return [...t(SENTENCES_912), ...QUOTES];
}

/** Every list, for the rules script. */
export const ALL_LISTS: Record<string, string[]> = {
  TINY_WORDS, WORDS_23, WORDS_45, WORDS_68, SENTENCES_K1, SENTENCES_23, SENTENCES_45, SENTENCES_68, SENTENCES_912,
  QUOTES: QUOTES.map((q) => q.text),
};

/** Max characters per line on a sentence comet (two lines at most). */
export const SENTENCE_LINE = 32;

/** Word-wraps text into lines of at most `max` characters (spaces stay at line ends so offsets add up). */
export function wrapLines(text: string, max = SENTENCE_LINE): string[] {
  if (text.length <= max) return [text];
  const lines: string[] = [];
  let rest = text;
  while (rest.length > max) {
    let cut = rest.lastIndexOf(" ", max);
    if (cut <= 0) cut = max - 1;
    lines.push(rest.slice(0, cut + 1));
    rest = rest.slice(cut + 1);
  }
  if (rest) lines.push(rest);
  return lines;
}
