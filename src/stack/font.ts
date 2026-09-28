/*
 * A tiny proportional bitmap font (3×5 digits and capitals) so numbers in the cells are
 * always crisp at 320×200, even before the web fonts load.
 *
 * Label markup: `{...}` is drawn as a superscript (x{2} → x²), `[...]` as a subscript
 * (log[2]8 → log₂8). Everything else is drawn on the baseline.
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
  x: ["....", "#..#", ".##.", ".##.", "#..#"],
  f: ["..#", ".#.", "###", ".#.", ".#."],
  l: ["#", "#", "#", "#", "#"],
  o: ["...", "...", "###", "#.#", "###"],
  g: ["...", "...", "###", "#.#", "###", "..#", "##."],
  "+": ["...", ".#.", "###", ".#.", "..."],
  "−": ["...", "...", "###", "...", "..."],
  "×": ["...", "#.#", ".#.", "#.#", "..."],
  "=": ["...", "###", "...", "###", "..."],
  "/": ["..#", "..#", ".#.", "#..", "#.."],
  ".": [".", ".", ".", ".", "#"],
  ",": [".", ".", ".", "#", "#"],
  ":": [".", "#", ".", "#", "."],
  "·": [".", ".", "#", ".", "."],
  "(": [".#", "#.", "#.", "#.", ".#"],
  ")": ["#.", ".#", ".#", ".#", "#."],
  "?": ["###", "..#", ".##", "...", ".#."],
  "!": ["#", "#", "#", ".", "#"],
  "√": ["...#", "...#", "#..#", ".#.#", "..#."],
  "▶": ["#..", "##.", "###", "##.", "#.."],
  "◀": ["..#", ".##", "###", ".##", "..#"],
  "%": ["#.#", "..#", ".#.", "#..", "#.#"],
  " ": ["..", "..", "..", "..", ".."],
};

/** Smaller 4-row digits for superscripts and subscripts (x², log₂8). */
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
  "/": ["..#", ".#.", ".#.", "#.."],
};

const ALIAS: Record<string, string> = { "-": "−", "*": "×" };

export const GLYPH_H = 5;
const SUP_RISE = 2;
const SUB_DROP = 2;

function glyphFor(ch: string, small = false): string[] | undefined {
  const c = ALIAS[ch] ?? ch;
  return (small ? MINI[c] : undefined) ?? G[c] ?? G[c.toUpperCase()];
}

export function hasGlyph(ch: string): boolean {
  return ch === "{" || ch === "}" || ch === "[" || ch === "]" || !!glyphFor(ch);
}

interface Run {
  ch: string;
  x: number;
  dy: number;
  small: boolean;
}

/** Lays out a label: glyph positions (in font pixels, before scaling). */
function layout(text: string): { runs: Run[]; width: number } {
  const runs: Run[] = [];
  let x = 0;
  let dy = 0;
  let small = false;
  for (const ch of text) {
    if (ch === "{") { dy = -SUP_RISE; small = true; continue; }
    if (ch === "[") { dy = SUB_DROP; small = true; continue; }
    if (ch === "}" || ch === "]") { dy = 0; small = false; continue; }
    const g = glyphFor(ch, small);
    if (!g) continue;
    runs.push({ ch, x, dy, small });
    x += g[0].length + 1;
  }
  return { runs, width: Math.max(0, x - 1) };
}

/** Width in pixels of `text` at `scale`. */
export function measure(text: string, scale = 1): number {
  return layout(text).width * scale;
}

/** Drops the markup: "log[2]8" → "log28" style plain text is rarely wanted; see `plainLabel`. */
const SUP: Record<string, string> = { "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴", "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹", "−": "⁻", "/": "ᐟ", x: "ˣ" };
const SUB: Record<string, string> = { "0": "₀", "1": "₁", "2": "₂", "3": "₃", "4": "₄", "5": "₅", "6": "₆", "7": "₇", "8": "₈", "9": "₉" };

/** Unicode version of a label for HTML text ("x{2}" → "x²", "log[2]8" → "log₂8"). */
export function plainLabel(text: string): string {
  return text
    .replace(/\{([^}]*)\}/g, (_m, s: string) => [...s].map((c) => SUP[c] ?? c).join(""))
    .replace(/\[([^\]]*)\]/g, (_m, s: string) => [...s].map((c) => SUB[c] ?? c).join(""));
}

/* ------------------------------- drawing ------------------------------- */

const cache = new Map<string, HTMLCanvasElement>();

function renderLabel(text: string, color: string, scale: number, shadow: string | null, accent: string): HTMLCanvasElement {
  const { runs, width } = layout(text);
  const pad = SUP_RISE;
  const h = GLYPH_H + 2 + pad + SUB_DROP + 1;
  const c = document.createElement("canvas");
  c.width = Math.max(1, (width + 1) * scale);
  c.height = h * scale;
  const g = c.getContext("2d")!;
  const paint = (ox: number, oy: number, col: string | null) => {
    for (const r of runs) {
      g.fillStyle = col ?? (r.small ? accent : color);
      const rows = glyphFor(r.ch, r.small)!;
      rows.forEach((row, y) => {
        for (let x = 0; x < row.length; x++) {
          if (row[x] === "#") g.fillRect((r.x + x + ox) * scale, (y + r.dy + pad + oy) * scale, scale, scale);
        }
      });
    }
  };
  if (shadow) paint(1, 1, shadow);
  paint(0, 0, null);
  return c;
}

/**
 * Draws `text` with its top-left glyph corner at (x, y). Returns the width drawn.
 * `align` positions the text horizontally around x.
 */
export function drawText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  color: string,
  opts: { scale?: number; align?: "left" | "center" | "right"; shadow?: string | null; accent?: string } = {},
): number {
  const scale = opts.scale ?? 1;
  const shadow = opts.shadow === undefined ? null : opts.shadow;
  const accent = opts.accent ?? color;
  const k = `${text}|${color}|${scale}|${shadow}|${accent}`;
  let img = cache.get(k);
  if (!img) {
    img = renderLabel(text, color, scale, shadow, accent);
    if (cache.size > 800) cache.clear();
    cache.set(k, img);
  }
  const w = measure(text, scale);
  const left = opts.align === "center" ? Math.round(x - w / 2) : opts.align === "right" ? x - w : x;
  ctx.drawImage(img, left, y - SUP_RISE * scale);
  return w;
}
