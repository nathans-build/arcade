/*
 * Pixel drawing helpers for the 320x200 screen (shared from Page Quest). Everything lands on whole pixels (no
 * anti-aliasing), so scaled-up scenes stay crisp: rects, spans, Bresenham lines, filled
 * circles/ellipses/polygons, EGA-style checkerboard dithering and our own bitmap font.
 */
import { forEachPixel, textWidth } from "./font";

export const W = 320;
export const H = 200;

/** EGA 16 plus the SpiderBen10 colours and a few warm extras. */
export const C = {
  black: "#000000",
  blue: "#0000aa",
  green: "#00aa00",
  cyan: "#00aaaa",
  red: "#aa0000",
  magenta: "#aa00aa",
  brown: "#aa5500",
  lgray: "#aaaaaa",
  dgray: "#555555",
  lblue: "#5555ff",
  lgreen: "#55ff55",
  lcyan: "#55ffff",
  lred: "#ff5555",
  lmagenta: "#ff55ff",
  yellow: "#ffff55",
  white: "#ffffff",
  sbRed: "#e3262f",
  sbBlue: "#2456e8",
  sbSky: "#6ea0ff",
  sbYellow: "#ffd23f",
  navy: "#0a0f2e",
  deep: "#050818",
  dbrown: "#5a2e0e",
  tan: "#d8a060",
  sand: "#e8c878",
  dgreen: "#005500",
  purple: "#55207a",
  orange: "#ff8a2a",
  stone: "#7a7a8a",
  cream: "#f5e6c8",
} as const;

/** Strips accents (the bitmap font only has plain capitals): "Xàtiva" -> "Xativa". */
export function plain(s: string): string {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[’‘]/g, "'").replace(/[–—]/g, "-");
}

export function rnd(i: number): number {
  const s = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
}

export class Gfx {
  private patterns = new Map<string, CanvasPattern>();
  constructor(public ctx: CanvasRenderingContext2D) {}

  rect(x: number, y: number, w: number, h: number, c: string) {
    if (w <= 0 || h <= 0) return;
    this.ctx.fillStyle = c;
    this.ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
  }

  px(x: number, y: number, c: string) {
    this.ctx.fillStyle = c;
    this.ctx.fillRect(Math.round(x), Math.round(y), 1, 1);
  }

  /** Checkerboard of two colours (the classic EGA gradient trick). */
  dither(x: number, y: number, w: number, h: number, a: string, b: string) {
    const key = a + b;
    let p = this.patterns.get(key);
    if (!p) {
      const c = document.createElement("canvas");
      c.width = 2;
      c.height = 2;
      const g = c.getContext("2d")!;
      g.fillStyle = a;
      g.fillRect(0, 0, 2, 2);
      g.fillStyle = b;
      g.fillRect(1, 0, 1, 1);
      g.fillRect(0, 1, 1, 1);
      p = this.ctx.createPattern(c, "repeat")!;
      this.patterns.set(key, p);
    }
    this.ctx.fillStyle = p;
    this.ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
  }

  /** Vertical gradient of solid bands with dithered seams between them. */
  bands(x: number, y0: number, w: number, y1: number, colors: string[]) {
    const n = colors.length;
    const step = (y1 - y0) / n;
    for (let i = 0; i < n; i++) {
      const top = Math.round(y0 + i * step);
      const bot = Math.round(y0 + (i + 1) * step);
      this.rect(x, top, w, bot - top, colors[i]);
      if (i < n - 1) this.dither(x, bot - Math.max(2, Math.round(step / 4)), w, Math.max(2, Math.round(step / 4)), colors[i], colors[i + 1]);
    }
  }

  line(x0: number, y0: number, x1: number, y1: number, c: string) {
    x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
    const dx = Math.abs(x1 - x0);
    const dy = -Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1;
    const sy = y0 < y1 ? 1 : -1;
    let e = dx + dy;
    this.ctx.fillStyle = c;
    for (let i = 0; i < 2000; i++) {
      this.ctx.fillRect(x0, y0, 1, 1);
      if (x0 === x1 && y0 === y1) break;
      const e2 = 2 * e;
      if (e2 >= dy) { e += dy; x0 += sx; }
      if (e2 <= dx) { e += dx; y0 += sy; }
    }
  }

  ellipse(cx: number, cy: number, rx: number, ry: number, c: string) {
    this.ctx.fillStyle = c;
    for (let y = -ry; y <= ry; y++) {
      const w = Math.round(rx * Math.sqrt(Math.max(0, 1 - (y * y) / (ry * ry || 1))));
      this.ctx.fillRect(Math.round(cx - w), Math.round(cy + y), w * 2 + 1, 1);
    }
  }

  circle(cx: number, cy: number, r: number, c: string) {
    this.ellipse(cx, cy, r, r, c);
  }

  /** Scanline polygon fill (even-odd). */
  poly(pts: [number, number][], c: string) {
    let minY = Infinity;
    let maxY = -Infinity;
    for (const [, y] of pts) { minY = Math.min(minY, y); maxY = Math.max(maxY, y); }
    this.ctx.fillStyle = c;
    for (let y = Math.floor(minY); y <= Math.ceil(maxY); y++) {
      const yc = y + 0.5;
      const xs: number[] = [];
      for (let i = 0; i < pts.length; i++) {
        const [ax, ay] = pts[i];
        const [bx, by] = pts[(i + 1) % pts.length];
        if ((ay <= yc && by > yc) || (by <= yc && ay > yc)) xs.push(ax + ((yc - ay) / (by - ay)) * (bx - ax));
      }
      xs.sort((a, b) => a - b);
      for (let i = 0; i + 1 < xs.length; i += 2) {
        const x0 = Math.round(xs[i]);
        const x1 = Math.round(xs[i + 1]);
        if (x1 > x0) this.ctx.fillRect(x0, y, x1 - x0, 1);
      }
    }
  }

  tri(ax: number, ay: number, bx: number, by: number, cx: number, cy: number, c: string) {
    this.poly([[ax, ay], [bx, by], [cx, cy]], c);
  }

  /** Width of bitmap-font text (after accents are stripped). */
  textWidthOf(s: string, scale = 1): number {
    return textWidth(plain(s), scale);
  }

  /** Bitmap-font text; returns its width. `align` "center" centres on x. */
  text(s: string, x: number, y: number, c: string, scale = 1, align: "left" | "center" | "right" = "left", shadow?: string) {
    s = plain(s);
    const w = textWidth(s, scale);
    const x0 = Math.round(align === "center" ? x - w / 2 : align === "right" ? x - w : x);
    const draw = (ox: number, oy: number, col: string) => {
      this.ctx.fillStyle = col;
      forEachPixel(s, (px, py) => this.ctx.fillRect(x0 + ox + px * scale, Math.round(y) + oy + py * scale, scale, scale));
    };
    if (shadow) draw(scale, scale, shadow);
    draw(0, 0, c);
    return w;
  }

  /** Character-grid sprite at `scale`, optionally mirrored. */
  grid(rows: string[], colors: Record<string, string>, x: number, y: number, scale = 1, flip = false) {
    const w = rows[0]?.length ?? 0;
    for (let r = 0; r < rows.length; r++) {
      const row = rows[r];
      for (let i = 0; i < row.length; i++) {
        const col = colors[row[i]];
        if (!col) continue;
        const cx = flip ? w - 1 - i : i;
        this.ctx.fillStyle = col;
        this.ctx.fillRect(Math.round(x + cx * scale), Math.round(y + r * scale), scale, scale);
      }
    }
  }
}
