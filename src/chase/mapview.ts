/*
 * Chase engine: draws a map view (land, coasts, rivers, a faint graticule) into the 288x120 map
 * area, plus lettered pins, a yarn path and a "you are here" marker. Land is rasterised once per
 * view with a hard alpha threshold, so coastlines stay crisp pixel art at any zoom.
 */
import { C, Gfx } from "./gfx";
import { LAND, MAP_H, MAP_W, project, type LonLat, type View } from "./geo";
import type { PinSpot } from "./pins";
import { RIVERS } from "./rivers";

export const MAP_COLORS = {
  sea: "#0d1d5c",
  sea2: "#12276e",
  land: "#c7a764",
  land2: "#b8964f",
  coast: "#5a3e14",
  river: "#6ea0ff",
  grid: "#1c3384",
};

const cache = new Map<string, HTMLCanvasElement>();

function landLayer(view: View): HTMLCanvasElement {
  const hit = cache.get(view.id);
  if (hit) return hit;
  const c = document.createElement("canvas");
  c.width = MAP_W;
  c.height = MAP_H;
  const ctx = c.getContext("2d")!;
  // 1. Land mask with the canvas's own (anti-aliased) fill, even-odd so lakes stay open.
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  for (const ring of LAND) {
    // Skip rings far outside the view.
    let any = false;
    for (const [lon, lat] of ring) {
      const [x, y] = project(view, lon, lat);
      if (x > -40 && x < MAP_W + 40 && y > -40 && y < MAP_H + 40) {
        any = true;
        break;
      }
    }
    if (!any) continue;
    ring.forEach(([lon, lat], i) => {
      const [x, y] = project(view, lon, lat);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.closePath();
  }
  ctx.fill("evenodd");
  // 2. Threshold to hard pixels, then colour: sea dither, land with a darker coast edge.
  const img = ctx.getImageData(0, 0, MAP_W, MAP_H);
  const d = img.data;
  const isLand = new Uint8Array(MAP_W * MAP_H);
  for (let i = 0; i < MAP_W * MAP_H; i++) isLand[i] = d[i * 4 + 3] >= 110 ? 1 : 0;
  const hex = (h: string) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  const [sea, sea2, land, land2, coast] = [MAP_COLORS.sea, MAP_COLORS.sea2, MAP_COLORS.land, MAP_COLORS.land2, MAP_COLORS.coast].map(hex);
  for (let y = 0; y < MAP_H; y++)
    for (let x = 0; x < MAP_W; x++) {
      const i = y * MAP_W + x;
      let col: number[];
      if (isLand[i]) {
        const edge =
          (x > 0 && !isLand[i - 1]) || (x < MAP_W - 1 && !isLand[i + 1]) || (y > 0 && !isLand[i - MAP_W]) || (y < MAP_H - 1 && !isLand[i + MAP_W]);
        col = edge ? coast : (x + y) % 2 === 0 && (x * 7 + y * 13) % 11 === 0 ? land2 : land;
      } else col = (y % 4 === 0 && (x + y) % 2 === 0) ? sea2 : sea;
      d[i * 4] = col[0];
      d[i * 4 + 1] = col[1];
      d[i * 4 + 2] = col[2];
      d[i * 4 + 3] = 255;
    }
  ctx.putImageData(img, 0, 0);
  // 3. Rivers on top (whole pixels, Bresenham).
  const g = new Gfx(ctx);
  for (const r of RIVERS) {
    for (let i = 1; i < r.pts.length; i++) {
      const [x0, y0] = project(view, ...r.pts[i - 1]);
      const [x1, y1] = project(view, ...r.pts[i]);
      if (Math.max(x0, x1) < 0 || Math.min(x0, x1) > MAP_W || Math.max(y0, y1) < 0 || Math.min(y0, y1) > MAP_H) continue;
      g.line(x0, y0, x1, y1, MAP_COLORS.river);
    }
  }
  cache.set(view.id, c);
  return c;
}

export interface MapPin {
  letter: string;
  color: string;
  /** Short label drawn next to the head (empty = letters only). */
  label: string;
  /** Second label line (an era), or empty. */
  sub: string;
  dim?: boolean;
  selected?: boolean;
}

export const PIN_COLORS = ["#e3262f", "#2456e8", "#ffd23f", "#2fd36a"];

/** Draws the map view with its pins at screen offset (ox, oy). `t` animates the blink. */
export function drawMap(
  g: Gfx,
  view: View,
  ox: number,
  oy: number,
  t: number,
  opts: {
    pins?: { spot: PinSpot; pin: MapPin }[];
    path?: LonLat[];
    here?: LonLat | null;
    title?: string;
  } = {},
) {
  g.ctx.save();
  g.ctx.beginPath();
  g.ctx.rect(ox, oy, MAP_W, MAP_H);
  g.ctx.clip();
  g.ctx.drawImage(landLayer(view), ox, oy);
  if (opts.title) {
    g.rect(ox, oy, MAP_W, 7, "rgba(5,8,24,0.75)");
    g.text(opts.title.toUpperCase(), ox + 3, oy + 1, C.sbYellow);
  }
  // The yarn path: the beads already re-threaded.
  const path = opts.path ?? [];
  for (let i = 1; i < path.length; i++) {
    const [x0, y0] = project(view, ...path[i - 1]);
    const [x1, y1] = project(view, ...path[i]);
    yarn(g, ox + x0, oy + y0, ox + x1, oy + y1, t);
  }
  path.forEach(([lon, lat]) => {
    const [x, y] = project(view, lon, lat);
    if (x < 0 || x > MAP_W || y < 0 || y > MAP_H) return;
    g.circle(ox + x, oy + y, 2, C.white);
    g.circle(ox + x, oy + y, 1, C.sbRed);
  });
  if (opts.here) {
    const [x, y] = project(view, ...opts.here);
    if (x >= 0 && x <= MAP_W && y >= 0 && y <= MAP_H) {
      const r = 3 + (Math.floor(t * 3) % 2);
      g.rect(ox + x - r, oy + y, r * 2 + 1, 1, C.sbYellow);
      g.rect(ox + x, oy + y - r, 1, r * 2 + 1, C.sbYellow);
    }
  }
  // Pin labels: try right, left, below and above each head so labels never cover another pin or label.
  const pins = opts.pins ?? [];
  const taken: Box[] = pins.map(({ spot }) => ({ x: spot.x - 6, y: spot.y - 13, w: 12, h: 13 }));
  const boxes: (Box | null)[] = pins.map(({ spot, pin }) => {
    if (!pin.label) return null;
    const w = Math.max(g.textWidthOf(pin.label), pin.sub ? g.textWidthOf(pin.sub) : 0) + 4;
    const h = (pin.sub ? 2 : 1) * 6 + 2;
    const tries: Box[] = [
      { x: spot.x + 7, y: spot.y - 12, w, h },
      { x: spot.x - 7 - w, y: spot.y - 12, w, h },
      { x: spot.x - w / 2, y: spot.y + 3, w, h },
      { x: spot.x - w / 2, y: spot.y - 14 - h, w, h },
      { x: spot.x + 7, y: spot.y + 2, w, h },
      { x: spot.x - 7 - w, y: spot.y + 2, w, h },
    ];
    const inside = (b: Box) => b.x >= 1 && b.y >= 8 && b.x + b.w <= MAP_W - 1 && b.y + b.h <= MAP_H - 1;
    const best = tries.find((b) => inside(b) && !taken.some((o) => overlap(o, b))) ?? tries.find(inside) ?? tries[0];
    taken.push(best);
    return best;
  });
  pins.forEach(({ spot, pin }, i) => drawPin(g, ox, oy, spot, pin, t, boxes[i]));
  g.ctx.restore();
  // frame
  g.rect(ox - 1, oy - 1, MAP_W + 2, 1, "#33408a");
  g.rect(ox - 1, oy + MAP_H, MAP_W + 2, 1, "#33408a");
  g.rect(ox - 1, oy, 1, MAP_H, "#33408a");
  g.rect(ox + MAP_W, oy, 1, MAP_H, "#33408a");
}

interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

function overlap(a: Box, b: Box): boolean {
  return a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
}

function yarn(g: Gfx, x0: number, y0: number, x1: number, y1: number, t: number) {
  const n = Math.max(2, Math.ceil(Math.hypot(x1 - x0, y1 - y0)));
  // A gentle arc, like a thread pulled across the map.
  const mx = (x0 + x1) / 2;
  const my = (y0 + y1) / 2 - Math.min(14, n / 6);
  for (let i = 0; i <= n; i++) {
    const k = i / n;
    const x = (1 - k) * (1 - k) * x0 + 2 * (1 - k) * k * mx + k * k * x1;
    const y = (1 - k) * (1 - k) * y0 + 2 * (1 - k) * k * my + k * k * y1;
    const lit = Math.floor(i / 2 - t * 6) % 6 === 0;
    g.px(x, y, lit ? C.white : C.sbRed);
  }
}

function drawPin(g: Gfx, ox: number, oy: number, s: PinSpot, p: MapPin, t: number, box: Box | null) {
  const ax = ox + s.ax;
  const ay = oy + s.ay;
  const hx = Math.round(ox + s.x);
  const hy = Math.round(oy + s.y);
  if (Math.hypot(s.x - s.ax, s.y - s.ay) > 2) g.line(ax, ay, hx, hy - 1, p.dim ? "#55607a" : "#ffffff");
  g.rect(ax - 1, ay - 1, 3, 3, C.black);
  g.px(ax, ay, p.dim ? "#55607a" : C.white);
  const blink = !p.dim && !p.selected && Math.floor(t * 2.5 + p.letter.charCodeAt(0)) % 3 === 0;
  const col = p.dim ? "#3a4060" : p.color;
  // head: a 9x9 lettered tag
  g.rect(hx - 5, hy - 12, 11, 11, p.selected ? C.white : C.black);
  g.rect(hx - 4, hy - 11, 9, 9, blink ? C.white : col);
  g.text(p.letter, hx, hy - 9, p.dim ? "#7a7f99" : blink ? col : col === "#ffd23f" ? C.navy : C.white, 1, "center");
  g.px(hx, hy - 1, C.black);
  if (p.label && box) {
    const bx = Math.round(ox + box.x);
    const by = Math.round(oy + box.y);
    g.rect(bx, by, box.w, box.h, "rgba(5,8,24,0.85)");
    g.text(p.label, bx + 2, by + 1, p.dim ? "#7a7f99" : C.white);
    if (p.sub) g.text(p.sub, bx + 2, by + 7, p.dim ? "#7a7f99" : C.sbYellow);
  }
}
