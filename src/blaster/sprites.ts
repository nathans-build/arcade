// Pixel-art sprites defined in code and pre-rendered to offscreen canvases.
// SpiderBen10's red & blue on deep space, with a yellow diamond on the ship.

import { forEachPixel, textHeight, textWidth } from "./font";

export const PALETTE = {
  space: "#0a0f2e",
  spaceDeep: "#050818",
  red: "#e3262f",
  redDark: "#8a1018",
  blue: "#2456e8",
  blueLight: "#6ea0ff",
  blueDark: "#15307a",
  yellow: "#ffd23f",
  white: "#f2f4ff",
  dim: "#6a78b8",
  green: "#5fff8a",
  rock: "#5d6396",
  rockHi: "#9aa2d8",
  rockDark: "#2c3066",
  rockEdge: "#1a1d44",
  core: "#ffd23f",
  coreHi: "#fff2a8",
  coreDark: "#c07a10",
  coreEdge: "#6a3a08",
};

type SpriteDef = { rows: string[]; colors: Record<string, string> };

// The ship, nose up. r/d = red, b/n = blue, y = the yellow diamond.
const SHIP: SpriteDef = {
  rows: [
    "......r......",
    ".....rrr.....",
    ".....rrr.....",
    "....rrrrr....",
    "....rryrr....",
    "...rryyyrr...",
    "...rrryrrr...",
    "..brrrrrrrb..",
    ".bbbrrrrrbbb.",
    "bbnbbdddbbnbb",
    "bn...d.d...nb",
    "b...........b",
  ],
  colors: { r: PALETTE.red, d: PALETTE.redDark, b: PALETTE.blue, n: PALETTE.blueLight, y: PALETTE.yellow },
};

function renderDef(def: SpriteDef): HTMLCanvasElement {
  const h = def.rows.length;
  const w = Math.max(...def.rows.map((r) => r.length));
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d")!;
  def.rows.forEach((row, y) => {
    [...row].forEach((ch, x) => {
      const col = def.colors[ch];
      if (col) {
        ctx.fillStyle = col;
        ctx.fillRect(x, y, 1, 1);
      }
    });
  });
  return c;
}

export const SHIP_FRAMES = 32;
export const SHIP_SIZE = 17;

/**
 * The ship pre-rotated to 32 angles with nearest-neighbour sampling, so every frame is
 * clean pixels (canvas rotation would smear them).
 */
function rotatedShips(): HTMLCanvasElement[] {
  const rows = SHIP.rows;
  const sh = rows.length;
  const sw = rows[0].length;
  const cx = (sw - 1) / 2;
  const cy = 6.5;
  const frames: HTMLCanvasElement[] = [];
  for (let f = 0; f < SHIP_FRAMES; f++) {
    const a = (f / SHIP_FRAMES) * Math.PI * 2;
    const cos = Math.cos(a);
    const sin = Math.sin(a);
    const c = document.createElement("canvas");
    c.width = c.height = SHIP_SIZE;
    const g = c.getContext("2d")!;
    const o = (SHIP_SIZE - 1) / 2;
    for (let y = 0; y < SHIP_SIZE; y++) {
      for (let x = 0; x < SHIP_SIZE; x++) {
        // Inverse-rotate the destination pixel into sprite space.
        const dx = x - o;
        const dy = y - o;
        const sx = Math.round(cos * dx + sin * dy + cx);
        const sy = Math.round(-sin * dx + cos * dy + cy);
        if (sx < 0 || sy < 0 || sx >= sw || sy >= sh) continue;
        const col = SHIP.colors[rows[sy][sx]];
        if (!col) continue;
        g.fillStyle = col;
        g.fillRect(x, y, 1, 1);
      }
    }
    frames.push(c);
  }
  return frames;
}

let shipCache: HTMLCanvasElement[] | null = null;
export function shipFrames(): HTMLCanvasElement[] {
  if (!shipCache) shipCache = rotatedShips();
  return shipCache;
}

/** Small ship icon (nose up) for the HUD / lives. */
export function shipIcon(): HTMLCanvasElement {
  return renderDef(SHIP);
}

/**
 * A lumpy pixel rock of radius r, shaded from the top-left. Gold for cores.
 * `seed` keeps each rock's outline its own.
 */
export function makeRock(r: number, core: boolean, seed: number): HTMLCanvasElement {
  const size = r * 2 + 3;
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const g = c.getContext("2d")!;
  const o = (size - 1) / 2;
  const bumps = [1, 2, 3].map((k) => ({ k: k + 2, ph: seed * (1.7 + k), amp: core ? 0.04 : 0.09 / k }));
  const edge = (ang: number) => r * (1 + bumps.reduce((s, b) => s + b.amp * Math.sin(ang * b.k + b.ph), 0) - (core ? 0.02 : 0.08));
  const P = core
    ? { hi: PALETTE.coreHi, mid: PALETTE.core, dark: PALETTE.coreDark, rim: PALETTE.coreEdge }
    : { hi: PALETTE.rockHi, mid: PALETTE.rock, dark: PALETTE.rockDark, rim: PALETTE.rockEdge };
  const inside = (x: number, y: number) => {
    const dx = x - o;
    const dy = y - o;
    return Math.hypot(dx, dy) <= edge(Math.atan2(dy, dx));
  };
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (!inside(x, y)) continue;
      const rim = !inside(x - 1, y) || !inside(x + 1, y) || !inside(x, y - 1) || !inside(x, y + 1);
      const dx = x - o;
      const dy = y - o;
      const light = (-dx - dy) / (r * 1.4); // top-left is lit
      let col = rim ? P.rim : light > 0.45 ? P.hi : light < -0.35 ? P.dark : P.mid;
      // A few craters on plain rocks, kept away from the middle where the label sits.
      if (!core && !rim) {
        const h = Math.sin((x + seed * 13) * 12.9898 + (y + seed * 7) * 78.233) * 43758.5453;
        const n = h - Math.floor(h);
        if (n > 0.93 && Math.hypot(dx, dy) > r * 0.55) col = P.dark;
      }
      g.fillStyle = col;
      g.fillRect(x, y, 1, 1);
    }
  }
  if (core) {
    // Sparkle
    g.fillStyle = "#ffffff";
    g.fillRect(Math.round(o - r * 0.45), Math.round(o - r * 0.5), 2, 1);
  }
  return c;
}

const textCache = new Map<string, HTMLCanvasElement>();

/**
 * Pixel-font text, pre-rendered with a 1px dark outline so it reads on rocks and stars.
 * Cached; the canvas is (width + 2) x (height + 2) at the given scale.
 */
export function textSprite(s: string, color: string, scale = 1, outline = "#05081a"): HTMLCanvasElement {
  const key = `${s}|${color}|${scale}|${outline}`;
  const hit = textCache.get(key);
  if (hit) return hit;
  if (textCache.size > 600) textCache.clear();
  const w = textWidth(s, scale) + 2 * scale;
  const h = textHeight(scale) + 2 * scale;
  const c = document.createElement("canvas");
  c.width = Math.max(1, w);
  c.height = h;
  const g = c.getContext("2d")!;
  const px: [number, number][] = [];
  forEachPixel(s, (x, y) => px.push([x, y]));
  if (outline) {
    g.fillStyle = outline;
    for (const [x, y] of px) g.fillRect(x * scale, y * scale, scale * 3, scale * 3);
  }
  g.fillStyle = color;
  for (const [x, y] of px) g.fillRect((x + 1) * scale, (y + 1) * scale, scale, scale);
  textCache.set(key, c);
  return c;
}
