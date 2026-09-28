/*
 * A tiny proportional bitmap font (3×5 capitals and digits, a few 5-wide letters) so the
 * in-canvas labels (layer names, banners, markers) stay crisp at 320×200 even when the
 * web fonts fail to load. Lower-case text is drawn in capitals.
 */

const G: Record<string, string[]> = {
  "0": ["###", "#.#", "#.#", "#.#", "###"],
  "1": [".#.", "##.", ".#.", ".#.", "###"],
  "2": ["###", "..#", "###", "#..", "###"],
  "3": ["###", "..#", ".##", "..#", "###"],
  "4": ["#.#", "#.#", "###", "..#", "..#"],
  "5": ["###", "#..", "###", "..#", "###"],
  "6": ["###", "#..", "###", "#.#", "###"],
  "7": ["###", "..#", "..#", ".#.", ".#."],
  "8": ["###", "#.#", "###", "#.#", "###"],
  "9": ["###", "#.#", "###", "..#", "###"],
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
  "+": ["...", ".#.", "###", ".#.", "..."],
  "-": ["...", "...", "###", "...", "..."],
  "=": ["...", "###", "...", "###", "..."],
  "/": ["..#", "..#", ".#.", "#..", "#.."],
  ".": [".", ".", ".", ".", "#"],
  ",": [".", ".", ".", "#", "#"],
  ":": [".", "#", ".", "#", "."],
  "·": [".", ".", "#", ".", "."],
  "'": ["#", "#", ".", ".", "."],
  "(": [".#", "#.", "#.", "#.", ".#"],
  ")": ["#.", ".#", ".#", ".#", "#."],
  "?": ["###", "..#", ".##", "...", ".#."],
  "!": ["#", "#", "#", ".", "#"],
  "▶": ["#..", "##.", "###", "##.", "#.."],
  "◀": ["..#", ".##", "###", ".##", "..#"],
  "▼": ["#####", ".###.", "..#..", ".....", "....."],
  "%": ["#.#", "..#", ".#.", "#..", "#.#"],
  "×": ["...", "#.#", ".#.", "#.#", "..."],
  "★": [".#.", "###", ".#.", "#.#", "..."],
  " ": ["..", "..", "..", "..", ".."],
};

const ALIAS: Record<string, string> = { "−": "-", "–": "-", "—": "-", "’": "'" };

export const GLYPH_H = 5;

function glyph(ch: string): string[] | undefined {
  const c = ALIAS[ch] ?? ch;
  return G[c] ?? G[c.toUpperCase()];
}

export function hasGlyph(ch: string): boolean {
  return !!glyph(ch);
}

/** Width in font pixels of `text` at `scale`. */
export function measure(text: string, scale = 1): number {
  let w = 0;
  for (const ch of text) {
    const g = glyph(ch);
    if (g) w += g[0].length + 1;
  }
  return Math.max(0, w - 1) * scale;
}

const cache = new Map<string, HTMLCanvasElement>();

function render(text: string, color: string, scale: number, shadow: string | null): HTMLCanvasElement {
  const w = measure(text, 1);
  const c = document.createElement("canvas");
  c.width = Math.max(1, (w + 1) * scale);
  c.height = (GLYPH_H + 1) * scale;
  const g = c.getContext("2d")!;
  const paint = (ox: number, oy: number, col: string) => {
    g.fillStyle = col;
    let x = 0;
    for (const ch of text) {
      const rows = glyph(ch);
      if (!rows) continue;
      rows.forEach((row, y) => {
        for (let i = 0; i < row.length; i++) if (row[i] === "#") g.fillRect((x + i + ox) * scale, (y + oy) * scale, scale, scale);
      });
      x += rows[0].length + 1;
    }
  };
  if (shadow) paint(1, 1, shadow);
  paint(0, 0, color);
  return c;
}

/** Draws `text` with its top-left glyph corner at (x, y). Returns the width drawn. */
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
    if (cache.size > 600) cache.clear();
    cache.set(k, img);
  }
  const w = measure(text, scale);
  const left = opts.align === "center" ? Math.round(x - w / 2) : opts.align === "right" ? x - w : x;
  ctx.drawImage(img, left, y);
  return w;
}
