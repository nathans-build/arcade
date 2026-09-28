import type { Grade } from "../kit/types";
import type { Challenge } from "../worm/challenges";
import { grade1, gradeK } from "./gK1";
import { grade2, grade3 } from "./g23";
import { grade4, grade5 } from "./g45";
import { grade6, grade7, grade8 } from "./g68";
import { grade10, grade11, grade12, grade9 } from "./g912";

/** Every Word Worm challenge, by grade. */
export const CHALLENGES: Record<Grade, Challenge[]> = {
  K: gradeK, "1": grade1, "2": grade2, "3": grade3, "4": grade4, "5": grade5,
  "6": grade6, "7": grade7, "8": grade8, "9": grade9, "10": grade10, "11": grade11, "12": grade12,
};

/** Grade bands the brief asks for (at least 40 items each). */
export const BANDS: { name: string; grades: Grade[] }[] = [
  { name: "K-1", grades: ["K", "1"] },
  { name: "2-3", grades: ["2", "3"] },
  { name: "4-5", grades: ["4", "5"] },
  { name: "6-8", grades: ["6", "7", "8"] },
  { name: "9-12", grades: ["9", "10", "11", "12"] },
];

/** One-line summary of what each grade practises (title screen). */
export const GRADE_BLURB: Record<Grade, string> = {
  K: "Letter sounds · rhymes · spell CVC words · sight words",
  "1": "Digraphs · silent e · vowel teams · rhymes · sight words",
  "2": "Vowel teams · blends · fix misspelled words",
  "3": "Prefixes & suffixes · spelling · fix misspellings",
  "4": "Affixes · roots · homophones",
  "5": "Latin & Greek roots · build words · tricky spellings",
  "6": "Greek & Latin roots · commonly confused words",
  "7": "Roots & prefixes · build words · confused words",
  "8": "Roots · build words · commonly misspelled words",
  "9": "English I: roots & affixes · misspelled words",
  "10": "English II: roots & affixes · misspelled words",
  "11": "English III: roots & affixes · misspelled words",
  "12": "English IV: roots & affixes · misspelled words",
};
