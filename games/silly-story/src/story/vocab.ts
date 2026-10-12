/*
 * Grades 9-12: precise vocabulary and connotation prompts (L.9-10.5b / L.11-12.5b),
 * and simile prompts (figurative language, L.9-10.5a / L.11-12.5a).
 */
import type { BlankType } from "./types";

export interface VocabSet {
  /** The part of speech the word must be. */
  pos: Exclude<BlankType, "vocab" | "simile" | "sound">;
  /** Shown as "Give me …". */
  prompt: string;
  /** Strong, precise words (lowercase). */
  words: string[];
  /** A plain word that works but isn't precise (the "not quite" card). */
  plain: string;
  /** Connotation note shown after answering. */
  note: string;
}

export const VOCAB: Record<string, VocabSet> = {
  "walk-slow": {
    pos: "verb-past", prompt: "a past-tense verb for walking SLOWLY",
    words: ["ambled", "strolled", "shuffled", "trudged", "moseyed", "plodded", "dawdled", "sauntered", "meandered", "crept", "tiptoed", "lumbered", "waddled", "wandered"],
    plain: "walked", note: "“Trudged” sounds tired; “sauntered” sounds relaxed and confident. Same speed, different feeling!",
  },
  "speak-quiet": {
    pos: "verb-past", prompt: "a past-tense verb for speaking QUIETLY",
    words: ["whispered", "murmured", "mumbled", "muttered", "breathed", "hushed"],
    plain: "said", note: "“Murmured” sounds gentle; “muttered” sounds grumpy.",
  },
  shout: {
    pos: "verb-past", prompt: "a past-tense verb for speaking LOUDLY",
    words: ["bellowed", "hollered", "yelled", "roared", "boomed", "shouted", "bawled", "shrieked", "howled", "squealed", "exclaimed"],
    plain: "said", note: "“Boomed” sounds big and deep; “shrieked” sounds high and surprised.",
  },
  laugh: {
    pos: "verb-past", prompt: "a past-tense verb for a small, quiet laugh",
    words: ["giggled", "chuckled", "tittered", "snickered", "chortled", "snorted"],
    plain: "laughed", note: "“Chuckled” is warm and friendly; “snickered” can sound sneaky or mean.",
  },
  "eat-fast": {
    pos: "verb-past", prompt: "a past-tense verb for eating FAST or greedily",
    words: ["gobbled", "devoured", "wolfed", "scarfed", "inhaled", "gulped", "chomped", "munched"],
    plain: "ate", note: "“Devoured” makes the eater sound like a hungry beast!",
  },
  "happy-strong": {
    pos: "adjective", prompt: "an adjective meaning VERY happy",
    words: ["ecstatic", "overjoyed", "thrilled", "elated", "delighted", "jubilant", "giddy", "exuberant", "joyful"],
    plain: "happy", note: "“Giddy” is bubbly and a little silly; “jubilant” sounds like a big celebration.",
  },
  "angry-strong": {
    pos: "adjective", prompt: "an adjective meaning VERY angry",
    words: ["furious", "livid", "irate", "enraged", "seething", "fuming", "outraged"],
    plain: "mad", note: "“Seething” and “fuming” are angry on the inside, like a pot about to boil.",
  },
  tired: {
    pos: "adjective", prompt: "an adjective meaning EXTREMELY tired",
    words: ["exhausted", "drained", "weary", "worn-out", "spent", "fatigued", "sapped", "drowsy"],
    plain: "tired", note: "“Weary” sounds old-fashioned and long-suffering; “drained” sounds like a battery at zero.",
  },
  "thin-positive": {
    pos: "adjective", prompt: "an adjective for THIN with a POSITIVE connotation",
    words: ["slender", "slim", "lean", "svelte", "willowy", "graceful", "sleek"],
    plain: "skinny", note: "“Slender” and “willowy” sound admiring. “Scrawny” or “bony” would sound negative.",
  },
  "old-positive": {
    pos: "adjective", prompt: "an adjective for OLD with a RESPECTFUL connotation",
    words: ["distinguished", "venerable", "seasoned", "experienced", "wise", "vintage", "classic", "timeless", "ancient"],
    plain: "old", note: "“Distinguished” and “seasoned” are compliments. “Ancient” can be one too, unless you mean a sandwich.",
  },
  "confident-negative": {
    pos: "adjective", prompt: "an adjective for TOO confident, with a NEGATIVE connotation",
    words: ["arrogant", "cocky", "smug", "boastful", "conceited", "haughty", "snobbish", "bossy"],
    plain: "confident", note: "“Confident” is a compliment; “smug” and “arrogant” are not!",
  },
  "smell-good": {
    pos: "noun", prompt: "a noun for a PLEASANT smell",
    words: ["aroma", "fragrance", "scent", "perfume", "bouquet"],
    plain: "smell", note: "“Aroma” and “fragrance” are pleasant; “stench” and “odor” are not.",
  },
  "big-precise": {
    pos: "adjective", prompt: "a precise adjective meaning VERY large",
    words: ["enormous", "gigantic", "colossal", "massive", "immense", "gargantuan", "mammoth", "towering", "vast", "humongous"],
    plain: "big", note: "“Towering” is big and tall; “vast” is big and wide.",
  },
};

export interface SimileTopic {
  prompt: string;
  examples: string[];
}

export const SIMILES: Record<string, SimileTopic> = {
  fast: { prompt: "a simile for moving FAST", examples: ["like a rocket", "like a cheetah on skates", "as fast as lightning", "like a sneeze"] },
  quiet: { prompt: "a simile for being QUIET", examples: ["like a mouse in socks", "as quiet as snow", "like a whispering cloud", "as silent as a sleeping cat"] },
  big: { prompt: "a simile for being HUGE", examples: ["as big as a bus", "like a mountain", "as large as a whale", "like a parade float"] },
  dance: { prompt: "a simile for dancing", examples: ["like wobbly jelly", "like a spinning top", "like popcorn in a pan", "like a happy noodle"] },
  team: { prompt: "a simile for being a good TEAM", examples: ["like two peas in a pod", "like peanut butter and jelly", "like socks and shoes", "as close as twins"] },
  bright: { prompt: "a simile for being BRIGHT", examples: ["like a disco ball", "as bright as the sun", "like a thousand fireflies", "like a lighthouse"] },
};
