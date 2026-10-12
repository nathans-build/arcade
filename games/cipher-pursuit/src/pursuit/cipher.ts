/*
 * Shift (Caesar) cipher helpers. Letters A-Z move `k` places along the alphabet and wrap
 * around (Z + 1 = A); anything that is not a capital letter is left alone.
 */

export const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

/** ((n % m) + m) % m: a remainder that is never negative. */
export function mod(n: number, m: number): number {
  return ((n % m) + m) % m;
}

export function shiftLetter(ch: string, k: number): string {
  const i = ALPHABET.indexOf(ch);
  return i < 0 ? ch : ALPHABET[mod(i + k, 26)];
}

/** Moves every letter of `text` forward by `k` (backward when `k` is negative). */
export function shiftText(text: string, k: number): string {
  return [...text.toUpperCase()].map((c) => shiftLetter(c, k)).join("");
}

export const encode = (plain: string, k: number) => shiftText(plain, k);
export const decode = (coded: string, k: number) => shiftText(coded, -k);

/** "K→H, H→E, …" for explanations (at most `max` letters). */
export function letterSteps(from: string, to: string, max = 5): string {
  const pairs = [...from].slice(0, max).map((c, i) => `${c}→${to[i]}`);
  return pairs.join(", ") + (from.length > max ? ", …" : "");
}

/** Spy words for coded messages (all capitals, 2-7 letters). */
export const CODE_WORDS = [
  "AGENT", "CODE", "TURBO", "SHIELD", "GADGET", "ROAD", "BOAT", "MAP", "CLUE", "RADIO", "SECRET", "ROUTE",
  "SPEED", "TRUCK", "FOAM", "SMOKE", "VAN", "LANE", "BRIDGE", "RIVER", "HELLO", "FRIEND", "SIGNAL", "TUNNEL",
  "ROCKET", "PLANET", "TIGER", "PIZZA", "WIZARD", "JUMP", "QUIZ", "ZEBRA", "YELLOW", "WATER", "OCEAN", "MOON",
  "STAR", "CAMERA", "PILOT", "ORBIT", "MAGNET", "LOCK", "KEY", "BADGE", "SPY", "GO", "HIDE", "FAST", "DASH",
];

/** Short, familiar words for the easy codes (grades 3-8 in Focus: Secret codes). */
export const EASY_CODE_WORDS = [
  "CAR", "VAN", "MAP", "KEY", "SPY", "SUN", "DOG", "CAT", "HAT", "RED", "BUS", "PIG", "CUP", "BED", "TOP", "BOX",
  "FOX", "FUN", "BOAT", "ROAD", "FAST", "JUMP", "HIDE", "LOCK", "CODE", "STAR", "MOON", "LANE", "FISH", "FROG",
  "CAKE", "BIRD", "TREE", "BOOK", "GOLD", "SHIP", "RAIN", "SNOW", "HELP", "DASH", "CLUE", "MILK", "LAMP", "DUCK",
];
