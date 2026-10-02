/*
 * Maze Muncher's bitmap font: 5-pixel capitals, lowercase with descenders, digits, math
 * symbols, raised/lowered mini digits for ² ³ ⁻⁵ and ₂, and little colour icons for the
 * counting emoji used by K–2 questions. Everything drawn in the canvas uses it, so pellet
 * labels stay crisp at 320×200 even when web fonts fail. Metrics are pure (no DOM), so the
 * checker can measure every label.
 */

const G: Record<string, string[]> = {
  "0": ["###", "#.#", "#.#", "#.#", "###"],
  "1": [".#.", "##.", ".#.", ".#.", "###"],
  "2": ["##.", "..#", ".#.", "#..", "###"],
  "3": ["##.", "..#", ".#.", "..#", "##."],
  "4": ["#.#", "#.#", "###", "..#", "..#"],
  "5": ["###", "#..", "##.", "..#", "##."],
  "6": [".##", "#..", "###", "#.#", "###"],
  "7": ["###", "..#", ".#.", ".#.", ".#."],
  "8": ["###", "#.#", "###", "#.#", "###"],
  "9": ["###", "#.#", "###", "..#", "##."],
  A: [".#.", "#.#", "###", "#.#", "#.#"],
  B: ["##.", "#.#", "##.", "#.#", "##."],
  C: [".##", "#..", "#..", "#..", ".##"],
  D: ["##.", "#.#", "#.#", "#.#", "##."],
  E: ["###", "#..", "##.", "#..", "###"],
  F: ["###", "#..", "##.", "#..", "#.."],
  G: [".##", "#..", "#.#", "#.#", ".##"],
  H: ["#.#", "#.#", "###", "#.#", "#.#"],
  I: ["###", ".#.", ".#.", ".#.", "###"],
  J: ["..#", "..#", "..#", "#.#", ".#."],
  K: ["#.#", "#.#", "##.", "#.#", "#.#"],
  L: ["#..", "#..", "#..", "#..", "###"],
  M: ["#...#", "##.##", "#.#.#", "#...#", "#...#"],
  N: ["#..#", "##.#", "#.##", "#..#", "#..#"],
  O: [".#.", "#.#", "#.#", "#.#", ".#."],
  P: ["##.", "#.#", "##.", "#..", "#.."],
  Q: [".#.", "#.#", "#.#", "##.", ".##"],
  R: ["##.", "#.#", "##.", "#.#", "#.#"],
  S: [".##", "#..", ".#.", "..#", "##."],
  T: ["###", ".#.", ".#.", ".#.", ".#."],
  U: ["#.#", "#.#", "#.#", "#.#", "###"],
  V: ["#.#", "#.#", "#.#", "#.#", ".#."],
  W: ["#...#", "#...#", "#.#.#", "##.##", "#...#"],
  X: ["#.#", "#.#", ".#.", "#.#", "#.#"],
  Y: ["#.#", "#.#", ".#.", ".#.", ".#."],
  Z: ["###", "..#", ".#.", "#..", "###"],
  a: ["...", "##.", "..#", "###", "###"],
  b: ["#..", "#..", "##.", "#.#", "##."],
  c: ["...", "...", ".##", "#..", ".##"],
  d: ["..#", "..#", ".##", "#.#", ".##"],
  e: ["...", ".#.", "###", "#..", ".##"],
  "é": ["..#", ".#.", "###", "#..", ".##"],
  "è": ["#..", ".#.", "###", "#..", ".##"],
  "á": ["..#", "##.", "..#", "###", "###"],
  "í": ["..#", "...", "##.", ".#.", "###"],
  "ó": ["..#", "...", ".#.", "#.#", ".#."],
  "ú": ["..#", "...", "#.#", "#.#", ".##"],
  "ñ": ["###", "...", "##.", "#.#", "#.#"],
  f: [".##", "#..", "##.", "#..", "#.."],
  g: ["...", ".##", "#.#", ".##", "..#", "##."],
  h: ["#..", "#..", "##.", "#.#", "#.#"],
  i: [".#.", "...", "##.", ".#.", "###"],
  j: ["..#", "...", "..#", "..#", "#.#", ".#."],
  k: ["#..", "#.#", "##.", "##.", "#.#"],
  l: ["##.", ".#.", ".#.", ".#.", "###"],
  m: ["....", "....", "###.", "#.##", "#..#"],
  n: ["...", "...", "##.", "#.#", "#.#"],
  o: ["...", "...", ".#.", "#.#", ".#."],
  p: ["...", "##.", "#.#", "##.", "#..", "#.."],
  q: ["...", ".##", "#.#", ".##", "..#", "..#"],
  r: ["...", "...", "#.#", "##.", "#.."],
  s: ["...", ".##", "##.", "..#", "##."],
  t: [".#.", "###", ".#.", ".#.", "..#"],
  u: ["...", "...", "#.#", "#.#", ".##"],
  v: ["...", "...", "#.#", "#.#", ".#."],
  w: [".....", ".....", "#...#", "#.#.#", ".#.#."],
  x: ["...", "...", "#.#", ".#.", "#.#"],
  y: ["...", "#.#", "#.#", ".##", "..#", "##."],
  z: ["...", "###", "..#", ".#.", "###"],
  "+": ["...", ".#.", "###", ".#.", "..."],
  "−": ["...", "...", "###", "...", "..."],
  "-": ["..", "..", "##", "..", ".."],
  "–": ["...", "...", "###", "...", "..."],
  "—": ["....", "....", "####", "....", "...."],
  "±": [".#.", "###", ".#.", "...", "###"],
  "×": ["...", "#.#", ".#.", "#.#", "..."],
  "÷": [".#.", "...", "###", "...", ".#."],
  "=": ["...", "###", "...", "###", "..."],
  ">": ["#..", ".#.", "..#", ".#.", "#.."],
  "<": ["..#", ".#.", "#..", ".#.", "..#"],
  "≤": ["..##", "##..", "..##", "....", "####"],
  "≥": ["##..", "..##", "##..", "....", "####"],
  "/": ["..#", "..#", ".#.", "#..", "#.."],
  ".": [".", ".", ".", ".", "#"],
  "…": [".....", ".....", ".....", ".....", "#.#.#"],
  ",": [".", ".", ".", "#", "#"],
  ":": [".", "#", ".", "#", "."],
  ";": [".", "#", ".", "#", "#"],
  "'": ["#", "#", ".", ".", "."],
  "’": ["#", "#", ".", ".", "."],
  '"': ["#.#", "#.#", "...", "...", "..."],
  "·": [".", ".", "#", ".", "."],
  "(": [".#", "#.", "#.", "#.", ".#"],
  ")": ["#.", ".#", ".#", ".#", "#."],
  "|": ["#", "#", "#", "#", "#"],
  "?": ["##.", "..#", ".#.", "...", ".#."],
  "!": ["#", "#", "#", ".", "#"],
  "%": ["#.#", "..#", ".#.", "#..", "#.#"],
  $: [".###", "##..", ".##.", "..##", "###."],
  "¢": ["..#.", ".###", "#.#.", ".###", ".#.."],
  "√": ["..###", "..#..", "#.#..", "#.#..", ".#..."],
  π: ["....", "####", ".#.#", ".#.#", ".#.#"],
  θ: [".#.", "#.#", "###", "#.#", ".#."],
  "°": ["###", "#.#", "###", "...", "..."],
  "Ω": [".###.", "#...#", "#...#", ".#.#.", "##.##"],
  "▶": ["#..", "##.", "###", "##.", "#.."],
  "◀": ["..#", ".##", "###", ".##", "..#"],
  "✔": ["....#", "...#.", "#.#..", ".#...", "....."],
  "✘": ["#...#", ".#.#.", "..#..", ".#.#.", "#...#"],
  "♥": [".#.#.", "#####", "#####", ".###.", "..#.."],
  " ": ["..", "..", "..", "..", ".."],
  // Counting icons (colour letters use ICON_COLORS).
  "🍎": ["..g..", ".rrr.", "rrrrr", "rrrrr", ".rrr."],
  "🎈": [".rrr.", "rrwrr", "rrrrr", ".rrr.", "..w.."],
  "🍪": [".ooo.", "okooo", "oooko", "okooo", ".ooo."],
  "🌸": [".p.p.", "ppppp", ".pyp.", "ppppp", ".p.p."],
  "🐶": ["o...o", "ooooo", "okoko", "ooooo", ".oko."],
  "⭐": ["..y..", ".yyy.", "yyyyy", ".yyy.", ".y.y."],
  "🐟": [".bb.b", "bbbbb", "kbbb.", "bbbbb", ".bb.b"],
  "🚗": [".....", ".rrr.", "rwrwr", "rrrrr", ".k.k."],
};

export const ICON_COLORS: Record<string, string> = {
  r: "#e3262f", g: "#3fbf4f", y: "#ffd23f", b: "#6ea0ff", o: "#c8894a", k: "#1a1a2a", p: "#ff8fc8", w: "#ffffff",
};

/** Smaller 4-row glyphs for superscripts and subscripts. */
const MINI: Record<string, string[]> = {
  "0": ["###", "#.#", "#.#", "###"],
  "1": [".#", "##", ".#", ".#"],
  "2": ["##.", "..#", ".#.", "###"],
  "3": ["###", ".##", "..#", "###"],
  "4": ["#.#", "###", "..#", "..#"],
  "5": ["###", "##.", "..#", "##."],
  "6": ["#..", "###", "#.#", "###"],
  "7": ["###", "..#", ".#.", ".#."],
  "8": [".##", "###", "#.#", "##."],
  "9": ["###", "#.#", "###", "..#"],
  "−": ["..", "##", "..", ".."],
  "+": ["...", ".#.", "###", ".#."],
  x: ["...", "#.#", ".#.", "#.#"],
  n: ["...", "##.", "#.#", "#.#"],
};

const SUPS: Record<string, string> = {
  "⁰": "0", "¹": "1", "²": "2", "³": "3", "⁴": "4", "⁵": "5", "⁶": "6", "⁷": "7", "⁸": "8", "⁹": "9",
  "⁻": "−", "⁺": "+", "ˣ": "x", "ⁿ": "n",
};
const SUBS: Record<string, string> = {
  "₀": "0", "₁": "1", "₂": "2", "₃": "3", "₄": "4", "₅": "5", "₆": "6", "₇": "7", "₈": "8", "₉": "9",
};

export const GLYPH_H = 5;
export const SUP_RISE = 2;
export const SUB_DROP = 2;
/** Height of one text line at scale 1, including room for super/subscripts and descenders. */
export const LINE_H = SUP_RISE + GLYPH_H + SUB_DROP + 1;

/** Characters that draw nothing (emoji variation selectors, zero-width joiners). */
const INVISIBLE = new Set(["️", "︎", "‍"]);

interface Run {
  rows: string[];
  x: number;
  dy: number;
}

function glyphOf(ch: string): { rows: string[]; dy: number } | null {
  if (G[ch]) return { rows: G[ch], dy: 0 };
  if (SUPS[ch]) return { rows: MINI[SUPS[ch]], dy: -SUP_RISE };
  if (SUBS[ch]) return { rows: MINI[SUBS[ch]], dy: SUB_DROP + 1 };
  return null;
}

/** True when every character can be drawn. */
export function hasGlyphs(text: string): boolean {
  for (const ch of text) if (!INVISIBLE.has(ch) && !glyphOf(ch)) return false;
  return true;
}

/** Characters (as they appear) that the font cannot draw. */
export function missingGlyphs(text: string): string[] {
  return [...text].filter((ch) => !INVISIBLE.has(ch) && !glyphOf(ch));
}

function layout(text: string): { runs: Run[]; width: number } {
  const runs: Run[] = [];
  let x = 0;
  for (const ch of text) {
    if (INVISIBLE.has(ch)) continue;
    const g = glyphOf(ch) ?? { rows: G["?"], dy: 0 };
    runs.push({ rows: g.rows, x, dy: g.dy });
    x += g.rows[0].length + 1;
  }
  return { runs, width: Math.max(0, x - 1) };
}

/** Width in logical pixels of `text` at `scale`. */
export function measure(text: string, scale = 1): number {
  return layout(text).width * scale;
}

/** Visible characters (emoji count as one). */
export function glyphCount(text: string): number {
  return [...text].filter((c) => !INVISIBLE.has(c)).length;
}

/* ------------------------------- drawing ------------------------------- */

const cache = new Map<string, HTMLCanvasElement>();

function render(text: string, color: string, scale: number, shadow: string | null): HTMLCanvasElement {
  const { runs, width } = layout(text);
  const c = document.createElement("canvas");
  c.width = Math.max(1, (width + 1) * scale);
  c.height = (LINE_H + 1) * scale;
  const g = c.getContext("2d")!;
  const paint = (ox: number, oy: number, col: string | null) => {
    for (const r of runs) {
      r.rows.forEach((row, y) => {
        for (let x = 0; x < row.length; x++) {
          const p = row[x];
          if (p === ".") continue;
          g.fillStyle = col ?? (p === "#" ? color : ICON_COLORS[p] ?? color);
          g.fillRect((r.x + x + ox) * scale, (y + r.dy + SUP_RISE + oy) * scale, scale, scale);
        }
      });
    }
  };
  if (shadow) paint(1, 1, shadow);
  paint(0, 0, null);
  return c;
}

/** Draws `text` with the top of its capitals at y. Returns the width drawn. */
export function drawText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  color: string,
  opts: { scale?: number; align?: "left" | "center" | "right"; shadow?: string | null } = {},
): number {
  const scale = opts.scale ?? 1;
  const shadow = opts.shadow ?? null;
  const k = `${text}|${color}|${scale}|${shadow}`;
  let img = cache.get(k);
  if (!img) {
    img = render(text, color, scale, shadow);
    if (cache.size > 500) cache.clear();
    cache.set(k, img);
  }
  const w = measure(text, scale);
  const left = Math.round(opts.align === "center" ? x - w / 2 : opts.align === "right" ? x - w : x);
  ctx.drawImage(img, left, Math.round(y - SUP_RISE * scale));
  return w;
}
