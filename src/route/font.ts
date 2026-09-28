/*
 * Route Runner's bitmap font: 5-pixel capitals, digits, lowercase (with descenders) and
 * math symbols, so every house sign and HUD word stays crisp at 320×200 even when the
 * web fonts fail to load.
 *
 * Label markup: `{...}` draws as a superscript (x{2} → x²), `[...]` as a subscript
 * (CO[2] → CO₂, log[2]8 → log₂8).
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
  "×": ["...", "#.#", ".#.", "#.#", "..."],
  "÷": [".#.", "...", "###", "...", ".#."],
  "=": ["...", "###", "...", "###", "..."],
  "≠": ["..#", "###", ".#.", "###", "#.."],
  ">": ["#..", ".#.", "..#", ".#.", "#.."],
  "<": ["..#", ".#.", "#..", ".#.", "..#"],
  "/": ["..#", "..#", ".#.", "#..", "#.."],
  ".": [".", ".", ".", ".", "#"],
  ",": [".", ".", ".", "#", "#"],
  ":": [".", "#", ".", "#", "."],
  "'": ["#", "#", ".", ".", "."],
  "·": [".", ".", "#", ".", "."],
  "(": [".#", "#.", "#.", "#.", ".#"],
  ")": ["#.", ".#", ".#", ".#", "#."],
  "|": ["#", "#", "#", "#", "#"],
  "?": ["##.", "..#", ".#.", "...", ".#."],
  "!": ["#", "#", "#", ".", "#"],
  "%": ["#.#", "..#", ".#.", "#..", "#.#"],
  "√": ["..###", "..#..", "#.#..", "#.#..", ".#..."],
  "π": ["....", "####", ".#.#", ".#.#", ".#.#"],
  "θ": [".#.", "#.#", "###", "#.#", ".#."],
  "°": ["###", "#.#", "###", "...", "..."],
  "▶": ["#..", "##.", "###", "##.", "#.."],
  "◀": ["..#", ".##", "###", ".##", "..#"],
  "▲": ["..#..", ".###.", "#####", ".....", "....."],
  "▼": ["#####", ".###.", "..#..", ".....", "....."],
  "✔": ["....#", "...#.", "#.#..", ".#...", "....."],
  "✘": ["#...#", ".#.#.", "..#..", ".#.#.", "#...#"],
  "♥": [".#.#.", "#####", "#####", ".###.", "..#.."],
  " ": ["..", "..", "..", "..", ".."],
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
  "/": ["..#", ".#.", ".#.", "#.."],
  x: ["...", "#.#", ".#.", "#.#"],
};

export const GLYPH_H = 5;
const SUP_RISE = 2;
const SUB_DROP = 2;

function glyphFor(ch: string, small = false): string[] | undefined {
  return (small ? MINI[ch] : undefined) ?? G[ch];
}

/** True when every character of the label can be drawn. */
export function canDraw(text: string): boolean {
  for (const ch of text) {
    if ("{}[]".includes(ch)) continue;
    if (!G[ch]) return false;
  }
  return true;
}

/** Label length without markup (the ≤ 10 character rule). */
export function plainLength(text: string): number {
  return [...text.replace(/[{}[\]]/g, "")].length;
}

interface Run {
  ch: string;
  x: number;
  dy: number;
  small: boolean;
}

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

/** Width in logical pixels of `text` at `scale`. */
export function measure(text: string, scale = 1): number {
  return layout(text).width * scale;
}

const SUP: Record<string, string> = { "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴", "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹", "−": "⁻", x: "ˣ" };
const SUB: Record<string, string> = { "0": "₀", "1": "₁", "2": "₂", "3": "₃", "4": "₄", "5": "₅", "6": "₆", "7": "₇", "8": "₈", "9": "₉" };

/** Unicode version of a label for HTML text: x{2} → x², CO[2] → CO₂, 64{1/2} → 64^(1/2). */
export function plainLabel(text: string): string {
  return text
    .replace(/\{([^}]*)\}/g, (_m, s: string) => ([...s].every((c) => SUP[c]) ? [...s].map((c) => SUP[c]).join("") : `^(${s})`))
    .replace(/\[([^\]]*)\]/g, (_m, s: string) => ([...s].every((c) => SUB[c]) ? [...s].map((c) => SUB[c]).join("") : s));
}

/* ------------------------------- drawing ------------------------------- */

const cache = new Map<string, HTMLCanvasElement>();

function render(text: string, color: string, scale: number, shadow: string | null): HTMLCanvasElement {
  const { runs, width } = layout(text);
  const h = SUP_RISE + GLYPH_H + SUB_DROP + 2;
  const c = document.createElement("canvas");
  c.width = Math.max(1, (width + 1) * scale);
  c.height = h * scale;
  const g = c.getContext("2d")!;
  const paint = (ox: number, oy: number, col: string) => {
    g.fillStyle = col;
    for (const r of runs) {
      const rows = glyphFor(r.ch, r.small)!;
      rows.forEach((row, y) => {
        for (let x = 0; x < row.length; x++) {
          if (row[x] === "#") g.fillRect((r.x + x + ox) * scale, (y + r.dy + SUP_RISE + oy) * scale, scale, scale);
        }
      });
    }
  };
  if (shadow) paint(1, 1, shadow);
  paint(0, 0, color);
  return c;
}

/**
 * Draws `text` with the top of its capitals at y. Returns the width drawn.
 */
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
  const left = Math.round(opts.align === "center" ? x - w / 2 : opts.align === "right" ? x - w : x);
  ctx.drawImage(img, left, Math.round(y - SUP_RISE * scale));
  return w;
}
