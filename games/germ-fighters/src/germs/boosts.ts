import type { Band } from "./band";

/*
 * Power-ups ("boosts"): short, random, temporary helpers, separate from the eight immune skills earned from
 * stage germs. They come from Antigen Clue rewards (mostly for right answers), now and then from a poofed
 * germ, and from hidden capsules. Picking up one you already have refreshes its timer (no stacking).
 * None of them changes a boss quiz: bosses are still only beaten by right answers.
 */

export type BoostId = "membrane" | "leap" | "vaccine" | "fever" | "antibody" | "mucus";
export const BOOST_IDS: BoostId[] = ["membrane", "leap", "vaccine", "fever", "antibody", "mucus"];

export interface BoostInfo {
  name: string;
  /** Duration in frames (60 per second). */
  frames: number;
  desc: string;
  /** A short line for the on-screen banner. */
  tip: string;
  /** One kid-friendly science line about the real thing it is named after. */
  science: string;
  color: string;
  color2: string;
}

export const BOOSTS: Record<BoostId, BoostInfo> = {
  membrane: {
    name: "Phase Through Membrane", frames: 8 * 60, desc: "germs, viruses and their shots pass right through you (pits and hazards still count!)", tip: "GERMS AND SHOTS PASS THROUGH YOU",
    science: "White blood cells really can squeeze through the walls of tiny blood vessels to reach germs.", color: "#c9b8ff", color2: "#6a4ad1",
  },
  leap: {
    name: "Lymph Leap", frames: 10 * 60, desc: "super-high jumps to reach the tall ledges", tip: "SUPER-HIGH JUMPS!",
    science: "Lymph is a clear fluid that carries immune cells between lymph nodes.", color: "#9affd8", color2: "#1e8a6a",
  },
  vaccine: {
    name: "Vaccine Memory", frames: 20 * 60, desc: "learned immunity: blocks the next bump or shot", tip: "BLOCKS THE NEXT BUMP OR SHOT",
    science: "Vaccines train memory cells, so the body is ready before a germ ever shows up.", color: "#9ad1ff", color2: "#2456e8",
  },
  fever: {
    name: "Fever Boost", frames: 10 * 60, desc: "run much faster", tip: "RUN MUCH FASTER!",
    science: "A fever warms the body: many germs slow down while immune cells speed up.", color: "#ffb35e", color2: "#c0561a",
  },
  antibody: {
    name: "Antibody Burst", frames: 10 * 60, desc: "B cell friends help: Y-shaped antibody zaps fire twice as fast", tip: "ANTIBODY ZAPS FIRE TWICE AS FAST",
    science: "B cells make Y-shaped antibodies that grab onto one exact germ.", color: "#ffe066", color2: "#b8862b",
  },
  mucus: {
    name: "Mucus Shield", frames: 12 * 60, desc: "a sticky coat that catches every germ shot that touches you", tip: "STICKY! GERM SHOTS GET STUCK",
    science: "Mucus is sticky on purpose: it traps germs and dust before they get inside.", color: "#c8ff5a", color2: "#4a8a1a",
  },
};

/** Lymph Leap jump speed (normal -5.6 rises about 50 px; this about 97 px; Villi Vault -8). */
export const LEAP_JUMP_V = -7.8;
/** Fever Boost run-speed factor. */
export const FEVER = 1.6;
/** Antibody Burst: frames between zaps and zaps on screen. */
export const RAPID_COOLDOWN = 4;
export const RAPID_SHOTS = 5;
/** Mucus Shield reach around the hero (px) that catches germ shots. */
export const MUCUS_REACH = 6;

export function boostFromRoll(roll: number): BoostId {
  return BOOST_IDS[Math.min(BOOST_IDS.length - 1, Math.floor(roll * BOOST_IDS.length))];
}

// ------------------------------------------------------------------ Antigen Clue rewards

/** Antigen Clues in every body-zone stage, all placed before the boss door. */
export const CLUES_PER_STAGE = 3;

export interface ClueReward {
  /** Energy refilled (the meter caps at MAX_ENERGY). */
  energy: number;
  /** Skill meter refilled. */
  power: number;
  boost: BoostId | null;
}

/** Chance that an identified Antigen Clue drops a power-up (right answers are weighted much higher). */
export function boostChance(correct: boolean, band: Band): number {
  if (correct) return band === "k2" ? 0.75 : 0.6;
  return band === "k2" ? 0.15 : 0.1;
}

/**
 * What an Antigen Clue gives. Right: a big energy chunk, skill meter and often a power-up (always one for
 * the first right answer in a stage that has not given one yet). Wrong: a little energy, and never anything
 * taken away.
 */
export function clueReward(correct: boolean, band: Band, rollChance: number, rollKind: number, boostGivenThisStage: boolean): ClueReward {
  const kid = band === "k2";
  const chance = boostChance(correct, band);
  const boost = (correct && !boostGivenThisStage) || rollChance < chance ? boostFromRoll(rollKind) : null;
  if (correct) return { energy: kid ? 12 : 10, power: 8, boost };
  return { energy: 3, power: 0, boost };
}
