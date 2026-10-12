/*
 * Turns a sprite's shape ops into a pixel grid (pure; testable without a browser), then into a canvas.
 * Color words repaint M/D/L; "fuzzy" grows fur, "striped"/"spotted" pattern the main color.
 */
import { PAL, type Op, type SpriteDef } from "./sprites";

export const GRID = 20;
const OX = 2;
const OY = 3;
export const OUTLINE = "#1b1230";

export interface RasterOpts {
  color?: string;
  fuzzy?: boolean;
  striped?: boolean;
  spotted?: boolean;
}

export function hexToRgb(h: string): [number, number, number] {
  const n = parseInt(h.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
export function rgbToHex(r: number, g: number, b: number): string {
  const c = (v: number) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0");
  return `#${c(r)}${c(g)}${c(b)}`;
}
/** amt > 0 lightens toward white, < 0 darkens toward black. */
export function shade(hex: string, amt: number): string {
  const [r, g, b] = hexToRgb(hex);
  if (amt >= 0) return rgbToHex(r + (255 - r) * amt, g + (255 - g) * amt, b + (255 - b) * amt);
  return rgbToHex(r * (1 + amt), g * (1 + amt), b * (1 + amt));
}

/** Grid of hex colors ("" = empty), GRID×GRID. Group "m" marks main-colored pixels (for patterns). */
export interface Raster {
  px: string[][];
  main: boolean[][];
  filled: number;
}

const hash = (x: number, y: number) => {
  let h = (x * 374761393 + y * 668265263) >>> 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177) >>> 0;
  return (h ^ (h >>> 16)) >>> 0;
};

export function rasterize(def: SpriteDef, o: RasterOpts = {}): Raster {
  const main = o.color ?? def.main;
  const col = (c: string): string => {
    if (c === "M") return main;
    if (c === "D") return shade(main, -0.32);
    if (c === "L") return shade(main, 0.4);
    if (c === "X") return "";
    return PAL[c] ?? c;
  };
  const px: string[][] = Array.from({ length: GRID }, () => Array(GRID).fill(""));
  const isMain: boolean[][] = Array.from({ length: GRID }, () => Array(GRID).fill(false));
  const set = (x: number, y: number, c: string, m: boolean) => {
    const gx = Math.round(x) + OX;
    const gy = Math.round(y) + OY;
    if (gx < 0 || gy < 0 || gx >= GRID || gy >= GRID) return;
    px[gy][gx] = c;
    isMain[gy][gx] = m && c !== "";
  };
  for (const op of def.ops) drawOp(op, col, set);
  // Patterns on the main color.
  if (o.striped || o.spotted) {
    const dark = shade(main, -0.45);
    const light = shade(main, 0.6);
    for (let y = 0; y < GRID; y++)
      for (let x = 0; x < GRID; x++) {
        if (!isMain[y][x]) continue;
        if (o.striped && Math.floor((x + y) / 2) % 2 === 0) px[y][x] = dark;
        if (o.spotted && hash(x >> 1, y >> 1) % 4 === 0) px[y][x] = isDark(main) ? light : dark;
      }
  }
  // Outline (or fur).
  const out = px.map((r) => r.slice());
  let filled = 0;
  for (let y = 0; y < GRID; y++)
    for (let x = 0; x < GRID; x++) {
      if (px[y][x]) {
        filled++;
        continue;
      }
      const n = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => px[y + dy]?.[x + dx]);
      if (n) out[y][x] = o.fuzzy ? (hash(x, y) % 3 === 0 ? shade(main, 0.35) : shade(main, -0.2)) : OUTLINE;
    }
  if (o.fuzzy) {
    // A second, broken ring of fur.
    for (let y = 0; y < GRID; y++)
      for (let x = 0; x < GRID; x++) {
        if (out[y][x] || hash(x + 7, y + 3) % 2) continue;
        const n = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => px[y + dy]?.[x + dx] === "" && out[y + dy]?.[x + dx]);
        if (n) out[y][x] = shade(main, -0.2);
      }
  }
  return { px: out, main: isMain, filled };
}

function isDark(hex: string) {
  const [r, g, b] = hexToRgb(hex);
  return r * 0.3 + g * 0.59 + b * 0.11 < 90;
}

function drawOp(op: Op, col: (c: string) => string, set: (x: number, y: number, c: string, m: boolean) => void) {
  const c = col(op[1]);
  const m = op[1] === "M" || op[1] === "L" || op[1] === "D";
  switch (op[0]) {
    case "r": {
      const [, , x, y, w, h] = op;
      for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) set(x + i, y + j, c, m);
      break;
    }
    case "e": {
      const [, , cx, cy, rx, ry] = op;
      for (let y = Math.floor(cy - ry - 1); y <= Math.ceil(cy + ry + 1); y++)
        for (let x = Math.floor(cx - rx - 1); x <= Math.ceil(cx + rx + 1); x++) {
          const dx = (x + 0.5 - cx) / rx;
          const dy = (y + 0.5 - cy) / ry;
          if (dx * dx + dy * dy <= 1) set(x, y, c, m);
        }
      break;
    }
    case "p": {
      const pts = op.slice(2) as number[];
      for (let i = 0; i + 1 < pts.length; i += 2) set(pts[i], pts[i + 1], c, m);
      break;
    }
    case "l": {
      let [, , x0, y0, x1, y1] = op;
      x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
      const dx = Math.abs(x1 - x0), sx = x0 < x1 ? 1 : -1, dy = -Math.abs(y1 - y0), sy = y0 < y1 ? 1 : -1;
      let err = dx + dy;
      for (let n = 0; n < 64; n++) {
        set(x0, y0, c, m);
        if (x0 === x1 && y0 === y1) break;
        const e2 = 2 * err;
        if (e2 >= dy) { err += dy; x0 += sx; }
        if (e2 <= dx) { err += dx; y0 += sy; }
      }
      break;
    }
    case "t": {
      const [, , ax, ay, bx, by, cx, cy] = op;
      const minX = Math.floor(Math.min(ax, bx, cx)), maxX = Math.ceil(Math.max(ax, bx, cx));
      const minY = Math.floor(Math.min(ay, by, cy)), maxY = Math.ceil(Math.max(ay, by, cy));
      const area = (bx - ax) * (cy - ay) - (cx - ax) * (by - ay);
      if (area === 0) break;
      for (let y = minY; y <= maxY; y++)
        for (let x = minX; x <= maxX; x++) {
          const px = x + 0.5, py = y + 0.5;
          const w0 = ((bx - px) * (cy - py) - (cx - px) * (by - py)) / area;
          const w1 = ((cx - px) * (ay - py) - (ax - px) * (cy - py)) / area;
          const w2 = 1 - w0 - w1;
          if (w0 >= -0.02 && w1 >= -0.02 && w2 >= -0.02) set(x, y, c, m);
        }
      break;
    }
  }
}

/* ---------------------------------------------------------------- canvas side */

const cache = new Map<string, HTMLCanvasElement>();

export function spriteCanvas(def: SpriteDef, o: RasterOpts = {}): HTMLCanvasElement {
  const key = `${def.id}|${o.color ?? ""}|${o.fuzzy ? 1 : 0}${o.striped ? 1 : 0}${o.spotted ? 1 : 0}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const r = rasterize(def, o);
  const cv = document.createElement("canvas");
  cv.width = GRID;
  cv.height = GRID;
  const ctx = cv.getContext("2d")!;
  for (let y = 0; y < GRID; y++)
    for (let x = 0; x < GRID; x++) {
      if (!r.px[y][x]) continue;
      ctx.fillStyle = r.px[y][x];
      ctx.fillRect(x, y, 1, 1);
    }
  cache.set(key, cv);
  return cv;
}
