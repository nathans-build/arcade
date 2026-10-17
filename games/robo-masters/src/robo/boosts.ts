import type { Band } from "./band";

/*
 * Power-ups ("boosts"): short, random, temporary helpers, separate from the eight earned Robo Master
 * powers. They come from Quiz Bot rewards (mostly for right answers), now and then from a mini-bot,
 * and from hidden capsules. Picking up one you already have refreshes its timer (no stacking).
 * None of them changes the boss quiz: the boss is still only rebooted by right answers.
 */

export type BoostId = "phase" | "spring" | "bubble" | "turbo" | "rapid" | "magnet";
export const BOOST_IDS: BoostId[] = ["phase", "spring", "bubble", "turbo", "rapid", "magnet"];

export interface BoostInfo {
  name: string;
  /** Duration in frames (60 per second). */
  frames: number;
  desc: string;
  /** A short line for the on-screen banner. */
  tip: string;
  color: string;
  color2: string;
}

export const BOOSTS: Record<BoostId, BoostInfo> = {
  phase: { name: "Phase Cloak", frames: 8 * 60, desc: "mini-bots, robots and their zaps pass right through you (pits and spikes still count!)", tip: "BOTS AND ZAPS PASS RIGHT THROUGH YOU", color: "#c9b8ff", color2: "#6a4ad1" },
  spring: { name: "Spring Boots", frames: 10 * 60, desc: "super-high jumps to reach the tall ledges", tip: "SUPER-HIGH JUMPS!", color: "#7dff7a", color2: "#1e8a3a" },
  bubble: { name: "Shield Bubble", frames: 20 * 60, desc: "blocks the next bump or zap", tip: "BLOCKS THE NEXT BUMP OR ZAP", color: "#9ad1ff", color2: "#2456e8" },
  turbo: { name: "Turbo Treads", frames: 10 * 60, desc: "run much faster", tip: "RUN MUCH FASTER!", color: "#ffb35e", color2: "#c0561a" },
  rapid: { name: "Rapid Beam", frames: 10 * 60, desc: "your reboot beam fires twice as fast", tip: "BEAM FIRES TWICE AS FAST", color: "#5ef0ff", color2: "#1a7a9a" },
  magnet: { name: "Bolt Magnet", frames: 12 * 60, desc: "pulls bolts and energy to you", tip: "PULLS BOLTS AND ENERGY TO YOU", color: "#ff7ad1", color2: "#a01a7a" },
};

/** Spring Boots jump speed (normal -5.6 rises about 50 px; this about 97 px; Magma Hop -8). */
export const SPRING_JUMP_V = -7.8;
/** Turbo Treads run-speed factor. */
export const TURBO = 1.6;
/** Rapid Beam: frames between beams and shots on screen. */
export const RAPID_COOLDOWN = 4;
export const RAPID_SHOTS = 5;
/** Bolt Magnet reach (px) and pull speed. */
export const MAGNET_RANGE = 110;
export const MAGNET_PULL = 2.6;

export function boostFromRoll(roll: number): BoostId {
  return BOOST_IDS[Math.min(BOOST_IDS.length - 1, Math.floor(roll * BOOST_IDS.length))];
}

// ------------------------------------------------------------------ Quiz Bot rewards

/** Quiz Bots in every stage, all placed before the boss door. */
export const QUIZ_BOTS_PER_STAGE = 3;

export interface QuizReward {
  /** Energy refilled (the meter caps at MAX_ENERGY). */
  energy: number;
  /** Power meter refilled. */
  power: number;
  boost: BoostId | null;
}

/** Chance that a Quiz Bot drops a power-up (right answers are weighted much higher). */
export function boostChance(correct: boolean, band: Band): number {
  if (correct) return band === "k2" ? 0.75 : 0.6;
  return band === "k2" ? 0.15 : 0.1;
}

/**
 * What a rebooted Quiz Bot gives. Right: a big energy chunk, power meter and often a power-up (always
 * one for the first right answer in a stage that has not given one yet). Wrong: a little energy, and
 * never anything taken away.
 */
export function quizBotReward(correct: boolean, band: Band, rollChance: number, rollKind: number, boostGivenThisStage: boolean): QuizReward {
  const kid = band === "k2";
  const chance = boostChance(correct, band);
  const boost = (correct && !boostGivenThisStage) || rollChance < chance ? boostFromRoll(rollKind) : null;
  if (correct) return { energy: kid ? 12 : 10, power: 8, boost };
  return { energy: 3, power: 0, boost };
}
