/*
 * Splash Arc renderer: a 320×200 pixel canvas (scaled up with nearest-neighbour by CSS).
 * Everything is drawn pixel by pixel or from character-grid sprites, so it stays crisp.
 */
import { forEachPixel, textWidth } from "./font";
import { GROUND_Y, WIDTH, type Level, type Target } from "./levels";
import { PART_CUTS, SHAPE_VERTS, type Pt, type Solid, type Tank } from "./shapes";

export const W = 320;
export const H = 200;

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
}

export interface Scene {
  lv: Level | null;
  angle: number;
  power: number;
  showAngle: boolean;
  /** "degrees" shows a numbered protractor; "arrow" (K-2) just the aim arrow. */
  protractor: "degrees" | "arrow";
  current: number | null;
  guide: [number, number][] | null;
  trail: [number, number][] | null;
  flight: { pts: [number, number][]; i: number } | null;
  particles: Particle[];
  banner: { text: string; sub?: string; t: number } | null;
  time: number;
  aiming: boolean;
  /** Player colour for pass-and-play (0 or 1). */
  seat: number;
}

// ------------------------------------------------------------------ palette & sprites

const C = {
  navy: "#0a0f2e",
  deep: "#050818",
  red: "#e3262f",
  blue: "#2456e8",
  sky: "#6ea0ff",
  yellow: "#ffd23f",
  white: "#f2f4ff",
  dim: "#6a78b8",
  green: "#5fff8a",
  water: "#4fc3ff",
  waterDark: "#1f7fd6",
  black: "#05060f",
};

const HERO = [
  "......hh........",
  "......hh........",
  "......BB........",
  "......BB........",
  ".....KRRRK......",
  "....KRRRRRK.....",
  "....KRRRRRK.....",
  "....KVVVVVK.....",
  "....KRRRRRK.....",
  ".....KRRRK......",
  "....BBRRRBB.....",
  "....BBYYYBBB....",
  "....BBBYBB.BB...",
  "....BBBBBB..hh..",
  ".....RRRRR......",
  ".....BBBBB......",
  ".....BB.BB......",
  "....BB...BB.....",
  "...hh.....hh....",
];
const HERO_COLORS: Record<string, string> = { h: "#e3262f", R: "#e3262f", K: "#05060f", V: "#7ff3ff", B: "#2456e8", Y: "#ffd23f" };
/** Player 2 wears yellow and blue. */
const HERO2_COLORS: Record<string, string> = { ...HERO_COLORS, h: "#ffd23f", R: "#ffd23f", Y: "#e3262f" };

const FLAME = [
  [
    "....y.....",
    "...yo.....",
    "...yoy.y..",
    "..yoooyo..",
    "..yoRooy..",
    ".yoRRRoy..",
    ".yoRRRoy..",
  ],
  [
    ".....y....",
    ".....oy...",
    "..y.yoy...",
    "..oyoooy..",
    ".yooRoy...",
    ".yoRRRoy..",
    "..oRRRo...",
  ],
];
const FLAME_C: Record<string, string> = { y: "#ffd23f", o: "#ff8a1f", R: "#e3262f" };
const LOGS = [".LLLLLLLL.", "LlLLLLLlLL"];
const LOGS_C: Record<string, string> = { L: "#8a4b22", l: "#c27a3f" };
const BELL = [
  "....kk.....",
  "...kYYk....",
  "..kYYYYk...",
  "..kYyYYk...",
  ".kYyYYYYk..",
  ".kYyYYYYk..",
  ".kYYYYYYk..",
  "kYYYYYYYYk.",
  "kkkkkkkkkk.",
  "....kk.....",
];
const BELL_C: Record<string, string> = { k: "#5a3a08", Y: "#ffd23f", y: "#fff2b0" };
const EGG = [
  "...eee...",
  "..eeeee..",
  ".eeseeee.",
  ".eeeeese.",
  "eeseeeeee",
  "eeeeeseee",
  "eeeeeeeee",
  ".eeseeee.",
  "..eeeee..",
  "ppppppppp",
  ".ppppppp.",
];

function drawGrid(ctx: CanvasRenderingContext2D, rows: string[], colors: Record<string, string>, x: number, y: number, flip = false) {
  rows.forEach((row, j) => {
    for (let i = 0; i < row.length; i++) {
      const col = colors[row[i]];
      if (col) {
        ctx.fillStyle = col;
        ctx.fillRect(Math.round(x + (flip ? row.length - 1 - i : i)), Math.round(y + j), 1, 1);
      }
    }
  });
}

// ------------------------------------------------------------------ pixel helpers

export function drawText(ctx: CanvasRenderingContext2D, s: string, x: number, y: number, color: string, scale = 1, shadow?: string) {
  if (shadow) {
    ctx.fillStyle = shadow;
    forEachPixel(s, (px, py) => ctx.fillRect(Math.round(x + (px + 1) * scale), Math.round(y + (py + 1) * scale), scale, scale));
  }
  ctx.fillStyle = color;
  forEachPixel(s, (px, py) => ctx.fillRect(Math.round(x + px * scale), Math.round(y + py * scale), scale, scale));
}
function textCentered(ctx: CanvasRenderingContext2D, s: string, cx: number, y: number, color: string, scale = 1, shadow?: string) {
  drawText(ctx, s, Math.round(cx - textWidth(s, scale) / 2), y, color, scale, shadow);
}

function inPoly(v: Pt[], x: number, y: number): boolean {
  let inside = false;
  for (let i = 0, j = v.length - 1; i < v.length; j = i++) {
    const [xi, yi] = v[i];
    const [xj, yj] = v[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}
/** Fill a polygon (screen px) testing pixel centres. */
function fillPoly(ctx: CanvasRenderingContext2D, v: Pt[], color: string) {
  const xs = v.map((p) => p[0]);
  const ys = v.map((p) => p[1]);
  ctx.fillStyle = color;
  for (let y = Math.floor(Math.min(...ys)); y <= Math.ceil(Math.max(...ys)); y++) {
    for (let x = Math.floor(Math.min(...xs)); x <= Math.ceil(Math.max(...xs)); x++) {
      if (inPoly(v, x + 0.5, y + 0.5)) ctx.fillRect(x, y, 1, 1);
    }
  }
}
function line(ctx: CanvasRenderingContext2D, x0: number, y0: number, x1: number, y1: number, color: string, dash = 0) {
  ctx.fillStyle = color;
  x0 = Math.round(x0);
  y0 = Math.round(y0);
  x1 = Math.round(x1);
  y1 = Math.round(y1);
  const dx = Math.abs(x1 - x0);
  const dy = -Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx + dy;
  let n = 0;
  for (;;) {
    if (!dash || n % dash < dash / 2) ctx.fillRect(x0, y0, 1, 1);
    n++;
    if (x0 === x1 && y0 === y1) break;
    const e2 = 2 * err;
    if (e2 >= dy) {
      err += dy;
      x0 += sx;
    }
    if (e2 <= dx) {
      err += dx;
      y0 += sy;
    }
  }
}
function polyOutline(ctx: CanvasRenderingContext2D, v: Pt[], color: string) {
  for (let i = 0; i < v.length; i++) line(ctx, v[i][0], v[i][1], v[(i + 1) % v.length][0], v[(i + 1) % v.length][1], color);
}
function fillEllipse(ctx: CanvasRenderingContext2D, cx: number, cy: number, rx: number, ry: number, color: string, half?: "top" | "bottom") {
  ctx.fillStyle = color;
  for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) {
    for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
      const dx = (x + 0.5 - cx) / rx;
      const dy = (y + 0.5 - cy) / ry;
      if (dx * dx + dy * dy <= 1) {
        if (half === "top" && y + 0.5 > cy) continue;
        if (half === "bottom" && y + 0.5 < cy) continue;
        ctx.fillRect(x, y, 1, 1);
      }
    }
  }
}

function hash(n: number): number {
  const s = Math.sin(n * 127.1) * 43758.5453;
  return s - Math.floor(s);
}

// ------------------------------------------------------------------ solids

interface Shade {
  front: string;
  top: string;
  side: string;
  edge: string;
}
const DRY: Shade = { front: "#b07a4a", top: "#d9a56e", side: "#7a5030", edge: "#2a1608" };
const WET: Shade = { front: "#2f8de0", top: "#7fd0ff", side: "#1a5aa8", edge: "#0a2050" };

/** A box: front w×h at (x, y bottom-left), depth vector (dx, dy). */
function box(ctx: CanvasRenderingContext2D, x: number, yb: number, w: number, h: number, dx: number, dy: number, s: Shade, units = 0, fill = 0) {
  const y = yb - h;
  fillPoly(ctx, [[x, y], [x + w, y], [x + w + dx, y + dy], [x + dx, y + dy]], s.top);
  fillPoly(ctx, [[x + w, y], [x + w + dx, y + dy], [x + w + dx, yb + dy], [x + w, yb]], s.side);
  ctx.fillStyle = s.front;
  ctx.fillRect(x, y, w, h);
  if (fill > 0) {
    const fh = Math.round(h * Math.min(1, fill));
    ctx.fillStyle = C.water;
    ctx.fillRect(x, yb - fh, w, fh);
  }
  if (units) {
    ctx.fillStyle = s.edge;
    for (let i = units; i < w; i += units) for (let j = y; j < yb; j += 2) ctx.fillRect(x + i, j, 1, 1);
    for (let j = units; j < h; j += units) for (let i = x; i < x + w; i += 2) ctx.fillRect(i, yb - j, 1, 1);
  }
  polyOutline(ctx, [[x, y], [x + w, y], [x + w, yb], [x, yb]], s.edge);
  line(ctx, x, y, x + dx, y + dy, s.edge);
  line(ctx, x + dx, y + dy, x + w + dx, y + dy, s.edge);
  line(ctx, x + w, y, x + w + dx, y + dy, s.edge);
  line(ctx, x + w + dx, y + dy, x + w + dx, yb + dy, s.edge);
  line(ctx, x + w, yb, x + w + dx, yb + dy, s.edge);
}

function cylinder(ctx: CanvasRenderingContext2D, cx: number, yb: number, rx: number, h: number, s: Shade, fill = 0) {
  const ry = Math.max(1.5, rx / 2.6);
  fillEllipse(ctx, cx, yb - ry, rx, ry, s.side, "bottom");
  ctx.fillStyle = s.front;
  ctx.fillRect(Math.round(cx - rx), Math.round(yb - ry - h), Math.round(rx * 2), Math.round(h));
  ctx.fillStyle = s.side;
  ctx.fillRect(Math.round(cx + rx * 0.4), Math.round(yb - ry - h), Math.round(rx * 0.6), Math.round(h));
  if (fill > 0) {
    ctx.fillStyle = C.water;
    const fh = Math.round(h * Math.min(1, fill));
    ctx.fillRect(Math.round(cx - rx), Math.round(yb - ry - fh), Math.round(rx * 2), fh);
  }
  fillEllipse(ctx, cx, yb - ry - h, rx, ry, s.top);
  ctx.fillStyle = s.edge;
  ctx.fillRect(Math.round(cx - rx), Math.round(yb - ry - h), 1, Math.round(h));
  ctx.fillRect(Math.round(cx + rx) - 1, Math.round(yb - ry - h), 1, Math.round(h));
}

function cone(ctx: CanvasRenderingContext2D, cx: number, yb: number, rx: number, h: number, s: Shade) {
  const ry = Math.max(1.5, rx / 2.6);
  fillEllipse(ctx, cx, yb - ry, rx, ry, s.side, "bottom");
  fillPoly(ctx, [[cx, yb - ry - h], [cx + rx, yb - ry], [cx - rx, yb - ry]], s.front);
  fillPoly(ctx, [[cx, yb - ry - h], [cx + rx, yb - ry], [cx + rx * 0.35, yb - ry + ry * 0.9]], s.side);
  line(ctx, cx, yb - ry - h, cx - rx, yb - ry, s.edge);
  line(ctx, cx, yb - ry - h, cx + rx, yb - ry, s.edge);
}

function sphere(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, s: Shade) {
  fillEllipse(ctx, cx, cy, r, r, s.side);
  fillEllipse(ctx, cx - r * 0.18, cy - r * 0.18, r * 0.8, r * 0.8, s.front);
  fillEllipse(ctx, cx - r * 0.4, cy - r * 0.4, r * 0.3, r * 0.3, s.top);
  ctx.fillStyle = s.edge;
  for (let x = -r + 1; x < r; x += 2) ctx.fillRect(Math.round(cx + x), Math.round(cy + Math.sqrt(Math.max(0, 1 - (x * x) / (r * r))) * r * 0.3), 1, 1);
}

function pyramid(ctx: CanvasRenderingContext2D, x: number, yb: number, w: number, h: number, s: Shade) {
  const dx = Math.round(w * 0.45);
  const dy = -Math.round(w * 0.3);
  const apex: Pt = [x + w / 2 + dx / 2, yb - h];
  fillPoly(ctx, [[x, yb], [x + w, yb], apex], s.front);
  fillPoly(ctx, [[x + w, yb], [x + w + dx, yb + dy], apex], s.side);
  line(ctx, x, yb, x + w, yb, s.edge);
  line(ctx, x + w, yb, x + w + dx, yb + dy, s.edge);
  line(ctx, x, yb, apex[0], apex[1], s.edge);
  line(ctx, x + w, yb, apex[0], apex[1], s.edge);
  line(ctx, x + w + dx, yb + dy, apex[0], apex[1], s.edge);
}

function triprism(ctx: CanvasRenderingContext2D, x: number, yb: number, b: number, th: number, dx: number, dy: number, s: Shade, fill = 0) {
  const apex: Pt = [x + b / 2, yb - th];
  fillPoly(ctx, [apex, [apex[0] + dx, apex[1] + dy], [x + b + dx, yb + dy], [x + b, yb]], s.side);
  fillPoly(ctx, [[x, yb], [x + b, yb], apex], s.front);
  if (fill > 0) {
    const fy = yb - th * Math.min(1, fill);
    ctx.fillStyle = C.water;
    for (let y = Math.ceil(fy); y < yb; y++) {
      const half = ((yb - y) / th) * (b / 2);
      ctx.fillRect(Math.round(x + half), y, Math.max(1, Math.round(b - 2 * half)), 1);
    }
  }
  polyOutline(ctx, [[x, yb], [x + b, yb], apex], s.edge);
  line(ctx, apex[0], apex[1], apex[0] + dx, apex[1] + dy, s.edge);
  line(ctx, apex[0] + dx, apex[1] + dy, x + b + dx, yb + dy, s.edge);
  line(ctx, x + b, yb, x + b + dx, yb + dy, s.edge);
}

function drawSolid(ctx: CanvasRenderingContext2D, solid: Solid, cx: number, yb: number, s: Shade) {
  switch (solid) {
    case "cube":
      return box(ctx, cx - 7, yb, 10, 10, 5, -4, s);
    case "prism":
      return box(ctx, cx - 8, yb, 13, 7, 4, -4, s);
    case "triprism":
      return triprism(ctx, cx - 8, yb, 10, 11, 6, -4, s);
    case "pyramid":
      return pyramid(ctx, cx - 7, yb, 11, 15, s);
    case "cylinder":
      return cylinder(ctx, cx, yb, 6, 10, s);
    case "cone":
      return cone(ctx, cx, yb, 7, 14, s);
    case "sphere":
      return sphere(ctx, cx, yb - 7, 7, s);
  }
}

function drawTank(ctx: CanvasRenderingContext2D, t: Tank, cx: number, yb: number, w: number, s: Shade, fill: number) {
  const x = Math.round(cx - w / 2);
  switch (t.kind) {
    case "box": {
      const d = Math.round(t.w * 2);
      return box(ctx, x, yb, Math.round(t.l * 4), Math.round(t.h * 4), d, -d, s, 4, fill);
    }
    case "step": {
      const d = Math.round(t.w * 2);
      box(ctx, x, yb, t.l1 * 4, t.h1 * 4, d, -d, s, 4, fill);
      return box(ctx, x + t.l1 * 4, yb, t.l2 * 4, t.h2 * 4, d, -d, s, 4, fill);
    }
    case "tri":
      return triprism(ctx, x, yb, Math.round(t.b * 1.2), Math.round(t.th * 2.4), Math.round(t.len * 2), -3, s, fill);
    case "cylinder":
      return cylinder(ctx, cx, yb, Math.min(7, 2 + t.r), Math.min(12, 3 + t.h), s, fill);
    case "cone":
      cone(ctx, cx, yb, Math.min(7, 2 + t.r), Math.min(14, 4 + t.h * 1.2), s);
      return;
    case "sphere":
      return sphere(ctx, cx, yb - 7, t.r >= 6 ? 7 : 6, s);
    case "pyramid":
      return pyramid(ctx, cx - 6, yb, Math.min(12, 6 + t.s), Math.min(15, 6 + t.h), s);
  }
}

// ------------------------------------------------------------------ targets

function drawShapeSign(ctx: CanvasRenderingContext2D, v: Pt[], cx: number, yb: number, wet: boolean, grid: boolean, round = false) {
  const k = 3;
  const w = Math.max(...v.map((p) => p[0]));
  const h = Math.max(...v.map((p) => p[1]));
  const x0 = Math.round(cx - (w * k) / 2);
  const y0 = yb - 5; // the post is 5px
  ctx.fillStyle = "#6a4a2a";
  ctx.fillRect(Math.round(cx), y0, 1, 5);
  if (round) {
    fillEllipse(ctx, cx, y0 - 5, 5, 5, wet ? "#ff6fb0" : "#9a7e8e");
    return;
  }
  const px: Pt[] = v.map((p) => [x0 + p[0] * k, y0 - p[1] * k]);
  fillPoly(ctx, px, wet ? "#ffd23f" : "#c8b888");
  if (grid) {
    ctx.fillStyle = wet ? "#c89a10" : "#8a7e58";
    for (let i = 1; i < w; i++) for (let j = 0; j < h * k; j += 2) if (inPoly(px, x0 + i * k + 0.5, y0 - j - 0.5)) ctx.fillRect(x0 + i * k, y0 - j - 1, 1, 1);
    for (let j = 1; j < h; j++) for (let i = 0; i < w * k; i += 2) if (inPoly(px, x0 + i + 0.5, y0 - j * k - 0.5)) ctx.fillRect(x0 + i, y0 - j * k, 1, 1);
  }
  polyOutline(ctx, px.map((p) => [Math.min(p[0], x0 + w * k - 1), Math.min(p[1], y0 - 1)] as Pt), wet ? "#7a4a00" : "#3a3020");
}

function drawParts(ctx: CanvasRenderingContext2D, parts: keyof typeof PART_CUTS, cx: number, yb: number, wet: boolean) {
  ctx.fillStyle = "#6a4a2a";
  ctx.fillRect(Math.round(cx), yb - 4, 1, 4);
  const cy = yb - 10;
  const r = 6;
  const cuts = PART_CUTS[parts];
  const cols = wet ? ["#e3262f", "#ffd23f", "#2456e8", "#5fff8a"] : ["#ece4cc", "#9a9280", "#cfc6aa", "#7a7260"];
  for (let y = -r; y <= r; y++) {
    for (let x = -r; x <= r; x++) {
      if (x * x + y * y > r * r + 2) continue;
      // Angle from 12 o'clock, clockwise.
      const a = ((Math.atan2(x + 0.01, -y) * 180) / Math.PI + 360) % 360;
      let k = cuts.length - 1;
      for (let i = 0; i < cuts.length; i++) {
        const lo = cuts[i];
        const hi = cuts[(i + 1) % cuts.length];
        const inside = lo < hi ? a >= lo && a < hi : a >= lo || a < hi;
        if (inside) k = i;
      }
      ctx.fillStyle = cols[k % cols.length];
      ctx.fillRect(Math.round(cx + x), Math.round(cy + y), 1, 1);
    }
  }
  for (const a of cuts) {
    const rad = (a * Math.PI) / 180;
    line(ctx, cx, cy, cx + Math.sin(rad) * r, cy - Math.cos(rad) * r, "#1a1020");
  }
}

function drawFlower(ctx: CanvasRenderingContext2D, t: Target, cx: number, yb: number, wet: boolean, time: number) {
  // Pot
  fillPoly(ctx, [[cx - 4, yb - 4], [cx + 4, yb - 4], [cx + 3, yb], [cx - 3, yb]], "#c0603a");
  ctx.fillStyle = "#e07a4f";
  ctx.fillRect(Math.round(cx - 4), yb - 5, 9, 1);
  ctx.fillStyle = wet ? "#3fbf5a" : "#7a8a40";
  ctx.fillRect(Math.round(cx), yb - 9, 1, 4);
  ctx.fillRect(Math.round(cx) + 1, yb - 7, 2, 1);
  const v = SHAPE_VERTS[t.shape!];
  const col = wet ? "#ff6fb0" : "#9a8a8a";
  const cyb = yb - 9;
  if (!v.length) {
    fillEllipse(ctx, cx + 0.5, cyb - 4, 4, 4, col);
    if (wet) fillEllipse(ctx, cx + 0.5, cyb - 4, 1.5, 1.5, C.yellow);
  } else {
    const w = Math.max(...v.map((p) => p[0]));
    const h = Math.max(...v.map((p) => p[1]));
    const k = 9 / Math.max(w, h);
    const px: Pt[] = v.map((p) => [cx - (w * k) / 2 + 0.5 + p[0] * k, cyb - p[1] * k]);
    fillPoly(ctx, px, col);
    if (wet) fillEllipse(ctx, cx + 0.5, cyb - (h * k) / 2, 1.5, 1.5, C.yellow);
  }
  if (wet && Math.floor(time * 3) % 2 === 0) {
    ctx.fillStyle = C.white;
    ctx.fillRect(Math.round(cx - 6), cyb - 9, 1, 1);
    ctx.fillRect(Math.round(cx + 6), cyb - 3, 1, 1);
  }
}

function drawPlanter(ctx: CanvasRenderingContext2D, t: Target, cx: number, yb: number, wet: boolean) {
  const [bw, bh] = t.bed!;
  const x0 = Math.round(cx - bw);
  const top = yb - bh * 2 - 2;
  ctx.fillStyle = "#6a3e1f";
  ctx.fillRect(x0 - 1, top - 1, bw * 2 + 2, bh * 2 + 3);
  ctx.fillStyle = wet ? "#4a2a10" : "#8a6a40";
  ctx.fillRect(x0, top, bw * 2, bh * 2);
  ctx.fillStyle = wet ? "#2a1608" : "#6a4a28";
  for (let i = 1; i < bw; i++) for (let j = 0; j < bh * 2; j += 2) ctx.fillRect(x0 + i * 2, top + j, 1, 1);
  for (let i = 0; i < bw; i++) {
    ctx.fillStyle = wet ? "#3fbf5a" : "#9a9a40";
    const hh = wet ? 3 : 1;
    ctx.fillRect(x0 + i * 2, top - 1 - hh, 1, hh);
    if (wet && i % 2 === 0) {
      ctx.fillStyle = i % 4 ? C.yellow : "#ff6fb0";
      ctx.fillRect(x0 + i * 2, top - 5, 1, 1);
    }
  }
}

function drawTarget(ctx: CanvasRenderingContext2D, t: Target, time: number) {
  const wet = t.watered;
  const cx = t.x;
  const yb = t.y;
  const s = wet ? WET : DRY;
  switch (t.kind) {
    case "fire": {
      drawGrid(ctx, LOGS, LOGS_C, cx - 5, yb - 2);
      if (!wet) drawGrid(ctx, FLAME[Math.floor(time * 6) % 2], FLAME_C, cx - 5, yb - 9);
      else {
        ctx.fillStyle = "#b0b8d0";
        for (let k = 0; k < 4; k++) {
          const ph = (time * 0.8 + k * 0.25) % 1;
          ctx.fillRect(Math.round(cx - 3 + k * 2 + Math.sin(ph * 6 + k) * 1.5), Math.round(yb - 3 - ph * 12), 1, 1);
        }
      }
      return;
    }
    case "bell": {
      ctx.fillStyle = "#3a2a1a";
      ctx.fillRect(cx - 6, yb - 12, 12, 1);
      ctx.fillRect(cx - 6, yb - 12, 1, 12);
      ctx.fillRect(cx + 5, yb - 12, 1, 12);
      const sway = wet && t.fx < 3 ? Math.round(Math.sin(t.fx * 14) * 1.5) : 0;
      drawGrid(ctx, BELL, BELL_C, cx - 5 + sway, yb - 11);
      if (wet && t.fx < 3 && Math.floor(time * 6) % 2) {
        ctx.fillStyle = C.yellow;
        ctx.fillRect(cx - 9, yb - 9, 2, 1);
        ctx.fillRect(cx + 8, yb - 9, 2, 1);
        ctx.fillRect(cx - 9, yb - 6, 1, 1);
        ctx.fillRect(cx + 9, yb - 6, 1, 1);
      }
      return;
    }
    case "egg": {
      const cols = wet ? { e: "#7fd0b0", s: "#2a8a6a", p: "#8a8aa0" } : { e: Math.floor(time * 4) % 2 ? "#ff9a4a" : "#ffb060", s: "#c04a1a", p: "#8a8aa0" };
      drawGrid(ctx, EGG, cols, cx - 4, yb - 11);
      if (!wet) {
        ctx.fillStyle = "#ffd23f";
        const ph = (time * 1.5) % 1;
        ctx.fillRect(cx - 2, Math.round(yb - 12 - ph * 4), 1, 1);
        ctx.fillRect(cx + 3, Math.round(yb - 13 - ((ph + 0.5) % 1) * 4), 1, 1);
      }
      return;
    }
    case "flower":
      return drawFlower(ctx, t, cx, yb, wet, time);
    case "paint":
      return drawParts(ctx, t.parts!, cx, yb, wet);
    case "sign":
      return drawShapeSign(ctx, SHAPE_VERTS[t.shape!], cx, yb, wet, false);
    case "area":
      return drawShapeSign(ctx, t.area!.verts, cx, yb, wet, true);
    case "planter":
      return drawPlanter(ctx, t, cx, yb, wet);
    case "solid":
      return drawSolid(ctx, t.solid!, cx - 1, yb, s);
    case "tank":
    case "container":
      return drawTank(ctx, t.tank!, cx, yb, t.w, wet ? WET : { ...DRY, front: "#8a94b0", top: "#b8c0d8", side: "#5a6480", edge: "#1a2038" }, wet ? Math.min(1, t.fx * 1.2) : 0);
  }
}

// ------------------------------------------------------------------ the screen

const THEME: Record<string, { sky: string[]; build: string[]; win: string; ground: string; groundTop: string; hill?: boolean }> = {
  city: { sky: ["#050818", "#0a0f2e", "#121a4a", "#1c2a6a"], build: ["#1c2450", "#26306a", "#2a1f50", "#162a5a"], win: "#ffd23f", ground: "#141a3a", groundTop: "#2456e8" },
  dusk: { sky: ["#1a0a30", "#3a1450", "#7a2a5a", "#c0504a"], build: ["#24183a", "#2e1f48", "#1e2040", "#331a40"], win: "#ffb060", ground: "#1a1028", groundTop: "#e3262f" },
  park: { sky: ["#050818", "#0a1238", "#13205a", "#1f3a7a"], build: ["#1e5a30", "#24683a", "#1a5028", "#2a7040"], win: "", ground: "#123a1e", groundTop: "#5fff8a", hill: true },
  mars: { sky: ["#1a0806", "#3a1208", "#5a1e0e", "#8a3a1a"], build: ["#7a2e14", "#8a3a1a", "#6a2810", "#9a4420"], win: "", ground: "#5a200c", groundTop: "#c05a2a", hill: true },
  moon: { sky: ["#000000", "#02030a", "#05081a", "#0a0f2e"], build: ["#6a6e80", "#7a7e90", "#5a5e70", "#8a8ea0"], win: "", ground: "#4a4e60", groundTop: "#b0b4c8", hill: true },
};

export class SplashScreen {
  private ctx: CanvasRenderingContext2D;
  private raf = 0;
  private last = 0;
  onTick: ((dt: number) => void) | null = null;

  constructor(
    canvas: HTMLCanvasElement,
    private scene: () => Scene,
  ) {
    canvas.width = W;
    canvas.height = H;
    this.ctx = canvas.getContext("2d")!;
    this.ctx.imageSmoothingEnabled = false;
  }

  start() {
    const loop = (now: number) => {
      const dt = this.last ? Math.max(0, Math.min(0.05, (now - this.last) / 1000)) : 0;
      this.last = now;
      this.onTick?.(dt);
      this.draw();
      this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
  }

  stop() {
    cancelAnimationFrame(this.raf);
  }

  /** Canvas pixel → logical coordinates. */
  static toLogical(canvas: HTMLCanvasElement, clientX: number, clientY: number): [number, number] {
    const r = canvas.getBoundingClientRect();
    return [((clientX - r.left) / r.width) * W, ((clientY - r.top) / r.height) * H];
  }

  draw() {
    const ctx = this.ctx;
    const s = this.scene();
    const lv = s.lv;
    const th = THEME[lv?.theme ?? "city"];
    // Sky bands
    const bands = th.sky;
    for (let i = 0; i < bands.length; i++) {
      ctx.fillStyle = bands[i];
      ctx.fillRect(0, Math.floor((i * GROUND_Y) / bands.length), W, Math.ceil(GROUND_Y / bands.length) + 1);
    }
    for (let i = 0; i < 50; i++) {
      const x = Math.floor(hash(i) * W);
      const y = Math.floor(hash(i + 50) * 90);
      ctx.fillStyle = hash(i + 7) > 0.8 && Math.floor(s.time * 2 + i) % 7 === 0 ? C.sky : "#8a94c8";
      if (hash(i + 3) > 0.35) ctx.fillRect(x, y, 1, 1);
    }
    if (lv?.theme === "moon") {
      fillEllipse(ctx, 270, 30, 9, 9, "#2456e8");
      fillEllipse(ctx, 268, 28, 4, 3, "#5fff8a");
    } else if (lv?.theme !== "mars") {
      fillEllipse(ctx, 290, 26, 7, 7, "#e8ecff");
      fillEllipse(ctx, 293, 24, 6, 6, bands[0]);
    }
    if (!lv) return this.drawTitleScene(ctx, s);

    // Grid (grades 5-6)
    if (lv.grid) {
      const g = lv.grid;
      for (let i = 0; i <= g.nx; i++) {
        ctx.fillStyle = i % 5 === 0 ? "#3a4a8a" : "#222c66";
        for (let y = g.oy - g.ny * g.unit; y < g.oy; y += 2) ctx.fillRect(g.ox + i * g.unit, y, 1, 1);
      }
      for (let j = 0; j <= g.ny; j++) {
        ctx.fillStyle = j % 5 === 0 ? "#3a4a8a" : "#222c66";
        for (let x = g.ox; x < WIDTH; x += 2) ctx.fillRect(x, g.oy - j * g.unit, 1, 1);
      }
    }

    // Buildings / hills
    lv.buildings.forEach((b, k) => {
      const col = th.build[k % th.build.length];
      ctx.fillStyle = col;
      ctx.fillRect(Math.round(b.x), Math.round(b.y), Math.round(b.w), Math.round(b.h));
      if (th.hill) {
        ctx.fillStyle = th.groundTop;
        ctx.fillRect(Math.round(b.x), Math.round(b.y), Math.round(b.w), 1);
        ctx.fillStyle = "#00000033";
        for (let y = b.y + 4; y < GROUND_Y; y += 5) for (let x = b.x + ((y / 5) % 2 ? 2 : 4); x < b.x + b.w - 1; x += 6) ctx.fillRect(Math.round(x), Math.round(y), 1, 1);
      } else {
        ctx.fillStyle = "#ffffff22";
        ctx.fillRect(Math.round(b.x), Math.round(b.y), Math.round(b.w), 1);
        for (let y = b.y + 4; y < GROUND_Y - 3; y += 6) {
          for (let x = b.x + 3; x < b.x + b.w - 3; x += 5) {
            ctx.fillStyle = hash(x * 13 + y * 7 + k) > 0.55 ? th.win : "#0a0f2e";
            ctx.fillRect(Math.round(x), Math.round(y), 2, 3);
          }
        }
      }
    });
    // Ground
    ctx.fillStyle = th.ground;
    ctx.fillRect(0, GROUND_Y, W, H - GROUND_Y);
    ctx.fillStyle = th.groundTop;
    ctx.fillRect(0, GROUND_Y, W, 1);
    if (lv.grid) {
      const g = lv.grid;
      for (let i = 0; i <= g.nx; i += 2) drawText(ctx, String(i), g.ox + i * g.unit - (i >= 10 ? 3 : 1), GROUND_Y + 1, "#b8c0f0");
      for (let j = 2; j <= g.ny; j += 2) {
        const y = g.oy - j * g.unit - 3;
        ctx.fillStyle = "#050818aa";
        ctx.fillRect(0, y - 1, j >= 10 ? 8 : 5, 8);
        drawText(ctx, String(j), 1, y, "#b8c0f0");
      }
    }

    // Targets and their letter tags
    for (const t of lv.targets) {
      drawTarget(ctx, t, s.time);
      if (lv.grid && t.coord) {
        ctx.fillStyle = C.red;
        ctx.fillRect(t.x - 1, t.y - 1, 3, 2);
      }
      const tagY = t.y - t.h - 9;
      const cur = s.current === t.i && !t.watered;
      ctx.fillStyle = cur ? C.yellow : t.watered ? "#1a5a3a" : "#0a0f2ecc";
      ctx.fillRect(t.x - 3, tagY, 7, 8);
      drawText(ctx, t.letter, t.x - 1, tagY + 1, cur ? C.navy : t.watered ? C.green : C.white);
      if (cur && Math.floor(s.time * 3) % 2 === 0) {
        const b = { x: t.x - t.w / 2 - 2, y: t.y - t.h - 1, w: t.w + 4, h: t.h + 2 };
        ctx.fillStyle = C.yellow;
        for (const [x, y, dx, dy] of [[b.x, b.y, 1, 1], [b.x + b.w, b.y, -1, 1], [b.x, b.y + b.h, 1, -1], [b.x + b.w, b.y + b.h, -1, -1]]) {
          ctx.fillRect(Math.round(x), Math.round(y), 3 * dx || 1, 1);
          ctx.fillRect(Math.round(x), Math.round(y), 1, 3 * dy || 1);
          if (dx < 0) ctx.fillRect(Math.round(x) - 2, Math.round(y), 3, 1);
          if (dy < 0) ctx.fillRect(Math.round(x), Math.round(y) - 2, 1, 3);
        }
      }
    }

    // Windsock
    this.drawWind(ctx, lv);

    // Last throw (faint)
    if (s.trail && !s.flight) {
      ctx.fillStyle = "#6ea0ff55";
      s.trail.forEach((p, i) => i % 6 === 0 && ctx.fillRect(Math.round(p[0]), Math.round(p[1]), 1, 1));
      const e = s.trail[s.trail.length - 1];
      if (e) {
        ctx.fillStyle = "#6ea0ff99";
        ctx.fillRect(Math.round(e[0]) - 1, Math.round(e[1]) - 1, 3, 1);
        ctx.fillRect(Math.round(e[0]), Math.round(e[1]) - 2, 1, 3);
      }
    }

    // Hero + launcher + protractor
    this.drawLauncher(ctx, lv, s);

    // Guide line
    if (s.guide && !s.flight) {
      s.guide.forEach((p, i) => {
        if (i % 5 === 0 && p[1] >= 0) {
          ctx.fillStyle = Math.floor(i / 5 + s.time * 6) % 3 === 0 ? C.white : C.yellow;
          ctx.fillRect(Math.round(p[0]), Math.round(p[1]), 1, 1);
        }
      });
    }

    // Flight
    if (s.flight) {
      const { pts, i } = s.flight;
      ctx.fillStyle = "#6ea0ffaa";
      for (let k = Math.max(0, i - 400); k < i; k += 4) ctx.fillRect(Math.round(pts[k][0]), Math.round(pts[k][1]), 1, 1);
      const p = pts[Math.min(i, pts.length - 1)];
      if (p[1] < -2) {
        // Off the top: a little marker.
        ctx.fillStyle = C.water;
        ctx.fillRect(Math.round(p[0]) - 1, 1, 3, 1);
        ctx.fillRect(Math.round(p[0]), 0, 1, 3);
      } else this.balloon(ctx, p[0], p[1]);
    }

    // Particles
    for (const q of s.particles) {
      ctx.fillStyle = q.color;
      ctx.fillRect(Math.round(q.x), Math.round(q.y), 1, 1);
    }

    // Banner text
    if (s.banner && s.banner.t > 0) {
      const y = 46;
      ctx.fillStyle = "#050818cc";
      ctx.fillRect(0, y - 4, W, s.banner.sub ? 28 : 20);
      textCentered(ctx, s.banner.text, W / 2, y, C.yellow, 2, C.red);
      if (s.banner.sub) textCentered(ctx, s.banner.sub, W / 2, y + 16, C.white);
    }
  }

  private balloon(ctx: CanvasRenderingContext2D, x: number, y: number) {
    const X = Math.round(x);
    const Y = Math.round(y);
    ctx.fillStyle = C.waterDark;
    ctx.fillRect(X - 1, Y - 2, 3, 5);
    ctx.fillRect(X - 2, Y - 1, 5, 3);
    ctx.fillStyle = C.water;
    ctx.fillRect(X - 1, Y - 1, 2, 2);
    ctx.fillStyle = C.white;
    ctx.fillRect(X - 1, Y - 1, 1, 1);
  }

  private drawWind(ctx: CanvasRenderingContext2D, lv: Level) {
    const px = 160;
    const py = 6;
    ctx.fillStyle = "#050818aa";
    ctx.fillRect(px - 26, py - 2, 52, 18);
    ctx.fillStyle = "#c0c8e0";
    ctx.fillRect(px - 20, py, 1, 14);
    const w = lv.wind;
    if (w === 0) {
      // Calm: the sock hangs down.
      for (let j = 0; j < 7; j++) {
        ctx.fillStyle = j % 2 ? C.white : C.red;
        ctx.fillRect(px - 19, py + 1 + j, 2, 1);
      }
      drawText(ctx, "CALM", px - 12, py + 4, "#b8c0f0");
      return;
    }
    const len = Math.round(6 + Math.abs(w) * 5);
    const dir = w > 0 ? 1 : -1;
    const x0 = w > 0 ? px - 19 : px - 21;
    for (let i = 0; i < len; i++) {
      const hgt = Math.max(1, 3 - Math.floor((i * 2) / len));
      ctx.fillStyle = Math.floor(i / 3) % 2 ? C.white : C.red;
      const flap = Math.round(Math.sin(i * 0.6 + Date.now() / 120) * 0.5 * (i / len));
      ctx.fillRect(x0 + i * dir, py + 1 + flap, 1, hgt);
    }
    const label = `${w > 0 ? "→" : "←"}${Math.abs(w).toFixed(1)}`;
    drawText(ctx, label, px + 2, py + 8, C.sky);
  }

  private drawLauncher(ctx: CanvasRenderingContext2D, lv: Level, s: Scene) {
    const { x: lx, y: ly } = lv.launch;
    const a = (s.angle * Math.PI) / 180;
    // Protractor
    if (s.aiming && s.protractor === "degrees") {
      const R = 26;
      for (let d = 0; d <= 180; d += 5) {
        const r = (d * Math.PI) / 180;
        const long = d % 30 === 0 ? 5 : d % 10 === 0 ? 3 : 1;
        ctx.fillStyle = d % 30 === 0 ? "#b8c0f0" : "#6a78b8";
        for (let k = 0; k < long; k++) ctx.fillRect(Math.round(lx + Math.cos(r) * (R - k)), Math.round(ly - Math.sin(r) * (R - k)), 1, 1);
      }
      for (let d = 0; d <= 180; d += 2) {
        const r = (d * Math.PI) / 180;
        ctx.fillStyle = "#3a4a8a";
        ctx.fillRect(Math.round(lx + Math.cos(r) * (R + 1)), Math.round(ly - Math.sin(r) * (R + 1)), 1, 1);
      }
      for (const d of [0, 30, 60, 90, 120, 150]) {
        const r = (d * Math.PI) / 180;
        const label = String(d);
        const tx = Math.round(lx + Math.cos(r) * (R + 7) - textWidth(label) / 2);
        if (tx < 1) continue;
        drawText(ctx, label, tx, Math.round(ly - Math.sin(r) * (R + 7) - 3), "#8a94c8");
      }
      // Angle arc
      if (s.showAngle) {
        for (let d = 0; d <= s.angle; d += 2) {
          const r = (d * Math.PI) / 180;
          ctx.fillStyle = C.yellow;
          ctx.fillRect(Math.round(lx + Math.cos(r) * 9), Math.round(ly - Math.sin(r) * 9), 1, 1);
        }
        const lab = `${Math.round(s.angle)}°`;
        const half = ((s.angle / 2) * Math.PI) / 180;
        drawText(ctx, lab, Math.round(lx + Math.cos(half) * 13), Math.round(ly - Math.sin(half) * 13 - 3), C.yellow, 1, C.black);
      }
      // ground line through the centre
      line(ctx, lx - R, ly, lx + R, ly, "#3a4a8a", 2);
    }
    // Hero
    drawGrid(ctx, HERO, s.seat ? HERO2_COLORS : HERO_COLORS, lv.hero.x - 2, lv.hero.y - HERO.length);
    // Launcher tube from the hand
    const len = 9;
    const ex = lx + Math.cos(a) * len;
    const ey = ly - Math.sin(a) * len;
    line(ctx, lx - Math.cos(a) * 2, ly + Math.sin(a) * 2, ex, ey, "#7ff3ff");
    line(ctx, lx - Math.cos(a) * 2 + 1, ly + Math.sin(a) * 2, ex + 1, ey, C.blue);
    if (s.aiming) {
      this.balloon(ctx, ex, ey);
      if (s.protractor === "arrow") {
        // K-2: an arrow whose length shows the power.
        const L = 12 + s.power * 0.22;
        const tx = lx + Math.cos(a) * L;
        const ty = ly - Math.sin(a) * L;
        line(ctx, ex, ey, tx, ty, C.yellow, 3);
        line(ctx, tx, ty, tx - Math.cos(a - 0.5) * 4, ty + Math.sin(a - 0.5) * 4, C.yellow);
        line(ctx, tx, ty, tx - Math.cos(a + 0.5) * 4, ty + Math.sin(a + 0.5) * 4, C.yellow);
      }
    }
  }

  private drawTitleScene(ctx: CanvasRenderingContext2D, s: Scene) {
    ctx.fillStyle = "#1c2450";
    for (let i = 0; i < 10; i++) {
      const h = 30 + hash(i + 3) * 70;
      ctx.fillRect(i * 33, GROUND_Y - h, 28, h);
    }
    ctx.fillStyle = "#141a3a";
    ctx.fillRect(0, GROUND_Y, W, H - GROUND_Y);
    // A looping demo arc.
    const t = (s.time % 3) / 3;
    for (let k = 0; k < 60; k++) {
      const u = k / 60;
      if (u > t) break;
      const x = 30 + u * 250;
      const y = 150 - Math.sin(u * Math.PI) * 110;
      ctx.fillStyle = k % 3 ? "#6ea0ff88" : C.yellow;
      ctx.fillRect(Math.round(x), Math.round(y), 1, 1);
    }
  }
}
