/*
 * The on-screen keyboard: a compact US layout, which finger presses each key, and
 * which characters need Shift. Pure data + helpers (no DOM), so the rules script can test it.
 */

export type Finger = "lp" | "lr" | "lm" | "li" | "ri" | "rm" | "rr" | "rp" | "th";

export const FINGER_NAMES: Record<Finger, string> = {
  lp: "left pinky",
  lr: "left ring finger",
  lm: "left middle finger",
  li: "left index finger",
  ri: "right index finger",
  rm: "right middle finger",
  rr: "right ring finger",
  rp: "right pinky",
  th: "thumb",
};

/** Finger zone colors (mirrored left/right, like a classic typing chart). */
export const FINGER_COLORS: Record<Finger, string> = {
  lp: "#c77dff",
  lr: "#4d8dff",
  lm: "#3fd47a",
  li: "#ffb13b",
  ri: "#ff7a3b",
  rm: "#3fd47a",
  rr: "#4d8dff",
  rp: "#c77dff",
  th: "#aab4e8",
};

export interface KeyDef {
  /** Unshifted character this key types ("" for Shift). */
  base: string;
  /** Shifted character, if any. */
  shift?: string;
  finger: Finger;
  /** Special keys. */
  kind?: "shiftL" | "shiftR" | "space";
  /** Relative width (1 = normal key). */
  w?: number;
  /** Home-row bump (F and J). */
  bump?: boolean;
}

const k = (base: string, shift: string | undefined, finger: Finger, extra: Partial<KeyDef> = {}): KeyDef => ({ base, shift, finger, ...extra });

export const ROWS: KeyDef[][] = [
  [
    k("1", "!", "lp"), k("2", "@", "lr"), k("3", "#", "lm"), k("4", "$", "li"), k("5", "%", "li"),
    k("6", "^", "ri"), k("7", "&", "ri"), k("8", "*", "rm"), k("9", "(", "rr"), k("0", ")", "rp"), k("-", "_", "rp"),
  ],
  [
    k("q", "Q", "lp"), k("w", "W", "lr"), k("e", "E", "lm"), k("r", "R", "li"), k("t", "T", "li"),
    k("y", "Y", "ri"), k("u", "U", "ri"), k("i", "I", "rm"), k("o", "O", "rr"), k("p", "P", "rp"),
  ],
  [
    k("a", "A", "lp"), k("s", "S", "lr"), k("d", "D", "lm"), k("f", "F", "li", { bump: true }), k("g", "G", "li"),
    k("h", "H", "ri"), k("j", "J", "ri", { bump: true }), k("k", "K", "rm"), k("l", "L", "rr"), k(";", ":", "rp"), k("'", '"', "rp"),
  ],
  [
    k("", undefined, "lp", { kind: "shiftL", w: 1.5 }),
    k("z", "Z", "lp"), k("x", "X", "lr"), k("c", "C", "lm"), k("v", "V", "li"), k("b", "B", "li"),
    k("n", "N", "ri"), k("m", "M", "ri"), k(",", "<", "rm"), k(".", ">", "rr"), k("/", "?", "rp"),
    k("", undefined, "rp", { kind: "shiftR", w: 1.5 }),
  ],
  [k(" ", undefined, "th", { kind: "space", w: 6 })],
];

const ALL_KEYS = ROWS.flat();

interface KeyInfo {
  key: KeyDef;
  shifted: boolean;
}

const BY_CHAR = new Map<string, KeyInfo>();
for (const key of ALL_KEYS) {
  if (key.kind === "shiftL" || key.kind === "shiftR") continue;
  BY_CHAR.set(key.base, { key, shifted: false });
  if (key.shift) BY_CHAR.set(key.shift, { key, shifted: true });
}

/** Every character the keyboard can type (space included). */
export const TYPEABLE = new Set(BY_CHAR.keys());

export function keyFor(ch: string): KeyInfo | null {
  return BY_CHAR.get(ch) ?? null;
}

export function fingerFor(ch: string): Finger | null {
  return keyFor(ch)?.key.finger ?? null;
}

export function needsShift(ch: string): boolean {
  return keyFor(ch)?.shifted ?? false;
}

const isLeft = (f: Finger) => f[0] === "l";

/** Which Shift key to hold: the one on the other hand from the key. */
export function shiftSideFor(ch: string): "shiftL" | "shiftR" | null {
  const info = keyFor(ch);
  if (!info || !info.shifted) return null;
  return isLeft(info.key.finger) ? "shiftR" : "shiftL";
}

/** Friendly name for read-aloud and hints ("semicolon", "space", "capital F"). */
export function keyName(ch: string): string {
  const names: Record<string, string> = {
    " ": "space", ";": "semicolon", ":": "colon", "'": "apostrophe", '"': "quote mark", ",": "comma", ".": "period",
    "/": "slash", "?": "question mark", "!": "exclamation mark", "-": "dash", "_": "underscore", "(": "open parenthesis",
    ")": "close parenthesis", "@": "at sign", "#": "number sign", $: "dollar sign", "%": "percent", "^": "caret",
    "&": "and sign", "*": "star", "<": "less than", ">": "greater than",
  };
  if (names[ch]) return names[ch];
  if (/^[A-Z]$/.test(ch)) return `capital ${ch}`;
  return ch.toUpperCase();
}

/** "Use your left index finger" (+ the Shift tip for capitals and symbols). */
export function fingerHint(ch: string): string {
  const info = keyFor(ch);
  if (!info) return "";
  const f = info.key.finger;
  if (f === "th") return "Tap the SPACE bar with either thumb.";
  let s = `Use your ${FINGER_NAMES[f]} for ${keyName(ch).replace(/^capital /, "")}.`;
  if (info.shifted) {
    s += isLeft(f) ? " Hold the RIGHT Shift with your right pinky." : " Hold the LEFT Shift with your left pinky.";
  }
  return s;
}

/** The key a stray character should be counted against (lower-case letter keys, symbols as-is). */
export function statKey(ch: string): string {
  return ch === " " ? "space" : ch;
}
