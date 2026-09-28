/*
 * City Shield's bitmap pixel font, drawn straight onto the 320x200 canvas so missile labels
 * stay crisp at any scale and never wait on a web font. Pure data + metrics (no DOM), so the
 * content checker can measure every label too.
 *
 * Each glyph sits on an 8-row cell: capitals and digits use rows 2-6 (3x5), superscripts
 * rows 0-3, subscripts rows 4-7, lowercase letters rows 3-6 (g descends to row 7).
 * A "√" draws a bar over the number or letters that follow it.
 */

interface Glyph {
  top: number;
  rows: string[];
}

const main = (...rows: string[]): Glyph => ({ top: 2, rows });
const sup = (...rows: string[]): Glyph => ({ top: 0, rows });
const sub = (...rows: string[]): Glyph => ({ top: 4, rows });
const low = (top: number, ...rows: string[]): Glyph => ({ top, rows });

/* Small 3x4 digits for exponents and log bases. */
const MINI: Record<string, string[]> = {
  "0": ["###", "#.#", "#.#", "###"],
  "1": [".#.", "##.", ".#.", "###"],
  "2": ["##.", "..#", ".#.", "###"],
  "3": ["###", ".##", "..#", "###"],
  "4": ["#.#", "#.#", "###", "..#"],
  "5": ["###", "##.", "..#", "##."],
  "6": ["#..", "###", "#.#", "###"],
  "7": ["###", "..#", ".#.", ".#."],
  "8": ["###", "#.#", "###", "###"],
  "9": ["###", "#.#", "###", "..#"],
};
const SUP = "⁰¹²³⁴⁵⁶⁷⁸⁹";
const SUB = "₀₁₂₃₄₅₆₇₈₉";

const G: Record<string, Glyph> = {
  "0": main("###", "#.#", "#.#", "#.#", "###"),
  "1": main(".#.", "##.", ".#.", ".#.", "###"),
  "2": main("###", "..#", "###", "#..", "###"),
  "3": main("###", "..#", ".##", "..#", "###"),
  "4": main("#.#", "#.#", "###", "..#", "..#"),
  "5": main("###", "#..", "###", "..#", "###"),
  "6": main("###", "#..", "###", "#.#", "###"),
  "7": main("###", "..#", "..#", ".#.", ".#."),
  "8": main("###", "#.#", "###", "#.#", "###"),
  "9": main("###", "#.#", "###", "..#", "###"),
  A: main(".#.", "#.#", "###", "#.#", "#.#"),
  B: main("##.", "#.#", "##.", "#.#", "##."),
  C: main(".##", "#..", "#..", "#..", ".##"),
  D: main("##.", "#.#", "#.#", "#.#", "##."),
  E: main("###", "#..", "##.", "#..", "###"),
  F: main("###", "#..", "##.", "#..", "#.."),
  G: main(".##", "#..", "#.#", "#.#", ".##"),
  H: main("#.#", "#.#", "###", "#.#", "#.#"),
  I: main("###", ".#.", ".#.", ".#.", "###"),
  J: main("..#", "..#", "..#", "#.#", ".#."),
  K: main("#.#", "#.#", "##.", "#.#", "#.#"),
  L: main("#..", "#..", "#..", "#..", "###"),
  M: main("#...#", "##.##", "#.#.#", "#...#", "#...#"),
  N: main("#..#", "##.#", "#.##", "#..#", "#..#"),
  O: main(".#.", "#.#", "#.#", "#.#", ".#."),
  P: main("##.", "#.#", "##.", "#..", "#.."),
  Q: main(".#.", "#.#", "#.#", "##.", ".##"),
  R: main("##.", "#.#", "##.", "#.#", "#.#"),
  S: main(".##", "#..", ".#.", "..#", "##."),
  T: main("###", ".#.", ".#.", ".#.", ".#."),
  U: main("#.#", "#.#", "#.#", "#.#", "###"),
  V: main("#.#", "#.#", "#.#", "#.#", ".#."),
  W: main("#...#", "#...#", "#.#.#", "##.##", "#...#"),
  X: main("#.#", "#.#", ".#.", "#.#", "#.#"),
  Y: main("#.#", "#.#", ".#.", ".#.", ".#."),
  Z: main("###", "..#", ".#.", "#..", "###"),
  // Lowercase, for math names: x, f, g, log, sin, cos, tan.
  a: low(3, ".##", "..#", "#.#", ".##"),
  c: low(3, ".##", "#..", "#..", ".##"),
  f: main("..##", ".#..", "###.", ".#..", ".#.."),
  g: low(3, ".##", "#.#", ".##", "..#", "##."),
  i: main("#", ".", "#", "#", "#"),
  l: main("#.", "#.", "#.", "#.", ".#"),
  n: low(3, "##.", "#.#", "#.#", "#.#"),
  o: low(3, ".#.", "#.#", "#.#", ".#."),
  s: low(3, ".##", "##.", "..#", "##."),
  t: main(".#.", "###", ".#.", ".#.", "..#"),
  x: low(4, "#.#", ".#.", "#.#"),
  "+": main("...", ".#.", "###", ".#.", "..."),
  "-": main("...", "...", "###", "...", "..."),
  "−": main("...", "...", "###", "...", "..."),
  "×": main("...", "#.#", ".#.", "#.#", "..."),
  "÷": main(".#.", "...", "###", "...", ".#."),
  "·": main(".", ".", "#", ".", "."),
  "=": main("...", "###", "...", "###", "..."),
  "(": main(".#", "#.", "#.", "#.", ".#"),
  ")": main("#.", ".#", ".#", ".#", "#."),
  "[": main("##", "#.", "#.", "#.", "##"),
  "]": main("##", ".#", ".#", ".#", "##"),
  "!": main("#", "#", "#", ".", "#"),
  ".": main(".", ".", ".", ".", "#"),
  ",": low(5, ".#", "#."),
  ":": main(".", "#", ".", "#", "."),
  "?": main("###", "..#", ".#.", "...", ".#."),
  "'": main("#", "#", ".", ".", "."),
  "/": main("..#", "..#", ".#.", "#..", "#.."),
  "°": sup("###", "#.#", "###"),
  "π": low(3, "####", ".#.#", ".#.#", ".#.#"),
  "√": { top: 1, rows: ["...#", "...#", "...#", "#..#", ".##.", "..#."] },
  "∛": { top: 0, rows: ["###...", ".##..#", "###..#", ".....#", "..#..#", "...##.", "....#."] },
  "ᐟ": sup("..#", ".#.", ".#.", "#.."),
  "⁻": sup("...", "###", "...", "..."),
  "→": main("....", "..#.", "####", "..#.", "...."),
  "✔": main("...", "..#", "#.#", ".#.", "..."),
  "✘": main("#.#", ".#.", "#.#", "...", "..."),
  " ": main("..", "..", "..", "..", ".."),
};
for (let d = 0; d <= 9; d++) {
  G[SUP[d]] = sup(...MINI[String(d)]);
  G[SUB[d]] = sub(...MINI[String(d)]);
}

export const FONT_ROWS = 8;

function glyph(ch: string): Glyph {
  return G[ch] ?? G[ch.toUpperCase()] ?? G["?"];
}

function glyphWidth(ch: string): number {
  return Math.max(...glyph(ch).rows.map((r) => r.length));
}

/** Pixel width of `s` at `scale` (1px gap between glyphs). */
export function textWidth(s: string, scale = 1): number {
  if (!s) return 0;
  let w = 0;
  for (const ch of s) w += glyphWidth(ch) + 1;
  return (w - 1) * scale;
}

export function textHeight(scale = 1): number {
  return FONT_ROWS * scale;
}

const RADICAND = /[0-9a-zA-Zπ]/;

/** Calls `plot(x, y)` for every lit pixel of `s` (unscaled), left edge at 0, top of the cell at 0. */
export function forEachPixel(s: string, plot: (x: number, y: number) => void) {
  const chars = [...s];
  let cx = 0;
  let bar = false; // drawing the bar of a square root over its radicand
  chars.forEach((ch, idx) => {
    const g = glyph(ch);
    const w = glyphWidth(ch);
    g.rows.forEach((row, y) => {
      for (let x = 0; x < row.length; x++) if (row[x] === "#") plot(cx + x, g.top + y);
    });
    if (ch === "√" || ch === "∛") bar = true;
    else if (bar && !RADICAND.test(ch)) bar = false;
    const next = chars[idx + 1];
    if (bar && next !== undefined && RADICAND.test(next)) {
      // Extend the bar across the gap and the next glyph.
      const nw = glyphWidth(next);
      for (let x = w; x <= w + nw; x++) plot(cx + x, 1);
    }
    cx += w + 1;
  });
}

/** True when every character of `s` has a real glyph. */
export function hasGlyphs(s: string): boolean {
  for (const ch of s) if (!(ch in G) && !(ch.toUpperCase() in G)) return false;
  return true;
}
