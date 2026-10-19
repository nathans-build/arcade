import { DC, DR, MATERIALS, cellKey, sides, type Grid, type PathStep, type SolveResult, type Tile } from "./circuit";
import { fmtTemp, type Band } from "./common";
import { SAMPLES, type HeatLevel, type HeatRun } from "./heat";
import { RUN_TILE, type RunSim } from "./run";
import { BUILDINGS } from "./town";

/* Canvas drawing for Power Up Town. Logical screen 320 × 200, scaled up with crisp pixels. */

export const W = 320;
export const H = 200;

type Ctx = CanvasRenderingContext2D;

const FONT = "'Press Start 2P', monospace";
function text(c: Ctx, s: string, x: number, y: number, color: string, size = 6, align: CanvasTextAlign = "left") {
  c.font = `${size}px ${FONT}`;
  c.textAlign = align;
  c.textBaseline = "top";
  c.fillStyle = color;
  c.fillText(s, x, y);
}

/* ---------------------------------------------------------------- Sparky */

/** Sparky: a round little electron with a "−" on its tummy and a zig-zag spark tuft. */
export function drawSparky(c: Ctx, x: number, y: number, t: number, s = 1, happy = true) {
  const bob = Math.sin(t * 8) * 0.8 * s;
  y += bob;
  // glow
  const g = c.createRadialGradient(x, y, 1, x, y, 11 * s);
  g.addColorStop(0, "rgba(255,240,140,0.55)");
  g.addColorStop(1, "rgba(255,240,140,0)");
  c.fillStyle = g;
  c.fillRect(x - 12 * s, y - 12 * s, 24 * s, 24 * s);
  // spark tuft
  c.strokeStyle = "#7fe7ff";
  c.lineWidth = 1.2 * s;
  c.beginPath();
  const flick = Math.sin(t * 20) > 0 ? 1 : -1;
  c.moveTo(x - 1 * s, y - 5 * s);
  c.lineTo(x - 3 * s, y - 8 * s);
  c.lineTo(x, y - 8 * s);
  c.lineTo(x - 1 * s + flick * s, y - 11 * s);
  c.stroke();
  // body
  c.fillStyle = "#ffd23f";
  c.beginPath();
  c.arc(x, y, 5.5 * s, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = "#fff6b8";
  c.beginPath();
  c.arc(x - 2 * s, y - 2 * s, 1.6 * s, 0, Math.PI * 2);
  c.fill();
  // eyes
  c.fillStyle = "#1a1a3a";
  const blink = Math.sin(t * 1.7) > 0.97;
  c.fillRect(x - 2.5 * s, y - 1.2 * s, 1.2 * s, blink ? 0.4 * s : 1.8 * s);
  c.fillRect(x + 1.3 * s, y - 1.2 * s, 1.2 * s, blink ? 0.4 * s : 1.8 * s);
  // smile + minus sign
  c.strokeStyle = "#1a1a3a";
  c.lineWidth = 0.8 * s;
  c.beginPath();
  if (happy) c.arc(x, y + 1.2 * s, 1.6 * s, 0.15 * Math.PI, 0.85 * Math.PI);
  else c.arc(x, y + 3 * s, 1.4 * s, 1.2 * Math.PI, 1.8 * Math.PI);
  c.stroke();
  c.fillStyle = "#2456e8";
  c.fillRect(x - 1.5 * s, y + 3.6 * s, 3 * s, 0.9 * s);
}

/* ---------------------------------------------------------------- town map */

export interface BuildingBox {
  i: number;
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Where each building stands on the map (two rows of six). */
export function townLayout(): BuildingBox[] {
  const out: BuildingBox[] = [];
  const rows = [
    { idx: [0, 1, 2, 3, 4, 5], base: 112 },
    { idx: [6, 7, 8, 9, 10, 11], base: 184 },
  ];
  for (const row of rows) {
    const total = row.idx.reduce((s, i) => s + BUILDINGS[i].w, 0);
    const gap = (W - total) / (row.idx.length + 1);
    let x = gap;
    for (const i of row.idx) {
      const b = BUILDINGS[i];
      out.push({ i, x: Math.round(x), y: row.base - b.h, w: b.w, h: b.h });
      x += b.w + gap;
    }
  }
  return out.sort((a, b) => a.i - b.i);
}

const SNOW = Array.from({ length: 70 }, (_, i) => ({ x: (i * 97.3) % W, y: (i * 53.7) % H, s: 0.4 + ((i * 7) % 5) / 6 }));
const STARS = Array.from({ length: 40 }, (_, i) => ({ x: (i * 71.9) % W, y: (i * 13.3) % 60 }));

export interface TownView {
  lit: boolean[];
  open: boolean[];
  selected: number;
  /** Building being lit right now and how far along (0-1). */
  lighting: { i: number; p: number } | null;
  allLit: boolean;
}

export function drawTown(c: Ctx, v: TownView, t: number) {
  const litN = v.lit.filter(Boolean).length;
  // sky: a little brighter as the town lights up
  const sky = c.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, v.allLit ? "#1a2a6a" : "#070a24");
  sky.addColorStop(1, `rgb(${20 + litN * 3}, ${24 + litN * 3}, ${60 + litN * 4})`);
  c.fillStyle = sky;
  c.fillRect(0, 0, W, H);
  for (const s of STARS) {
    c.fillStyle = (Math.sin(t * 2 + s.x) > 0.6) ? "#ffffff" : "#8a94c8";
    c.fillRect(s.x, s.y, 1, 1);
  }
  // moon
  c.fillStyle = "#f2f4ff";
  c.beginPath();
  c.arc(290, 18, 8, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = "#070a24";
  c.beginPath();
  c.arc(294, 15, 7, 0, Math.PI * 2);
  c.fill();
  // snowy ground and two streets
  c.fillStyle = "#dfe8f8";
  c.fillRect(0, 112, W, 10);
  c.fillStyle = "#3a4060";
  c.fillRect(0, 122, W, 6);
  c.fillStyle = "#dfe8f8";
  c.fillRect(0, 128, W, 4);
  c.fillRect(0, 184, W, 16);
  c.fillStyle = "#3a4060";
  c.fillRect(0, 190, W, 6);
  c.fillStyle = "#c8d0e8";
  for (let x = 0; x < W; x += 16) c.fillRect(x + ((t * 4) % 16), 192, 6, 1);

  const boxes = townLayout();
  // power lines between the buildings (sparks run along lit stretches)
  for (const row of [[0, 1, 2, 3, 4, 5], [6, 7, 8, 9, 10, 11]]) {
    for (let k = 0; k < row.length - 1; k++) {
      const a = boxes[row[k]];
      const b = boxes[row[k + 1]];
      const y = a.y + 4 < b.y + 4 ? b.y + 4 : a.y + 4;
      const x1 = a.x + a.w;
      const x2 = b.x;
      const on = v.lit[row[k]] && v.lit[row[k + 1]];
      c.strokeStyle = on ? "#ffd23f" : "#4a5070";
      c.lineWidth = 1;
      c.beginPath();
      c.moveTo(x1, y);
      c.quadraticCurveTo((x1 + x2) / 2, y + 5, x2, y);
      c.stroke();
      if (on) {
        const p = (t * 0.8 + k * 0.3) % 1;
        c.fillStyle = "#fff6b8";
        c.fillRect(x1 + (x2 - x1) * p - 1, y + 5 * 4 * p * (1 - p) * 0.5 - 1, 2, 2);
      }
    }
  }
  for (const box of boxes) drawBuilding(c, box, v, t);
  // snow
  for (const s of SNOW) {
    const y = (s.y + t * 10 * s.s) % H;
    const x = (s.x + Math.sin(t + s.y) * 3) % W;
    c.fillStyle = "rgba(255,255,255,0.8)";
    c.fillRect(x, y, s.s > 0.8 ? 2 : 1, s.s > 0.8 ? 2 : 1);
  }
  // Sparky by the selected building
  const sel = boxes[v.selected];
  if (sel) drawSparky(c, sel.x + sel.w / 2, sel.y - 12 + Math.sin(t * 3) * 2, t, 0.9);
  if (v.allLit) {
    for (let i = 0; i < 12; i++) {
      const fx = ((i * 53 + t * 30) % W);
      const fy = 20 + ((i * 29) % 50) + Math.sin(t * 3 + i) * 4;
      c.fillStyle = ["#ffd23f", "#7fe7ff", "#ff7a6e", "#5fff8a"][i % 4];
      c.fillRect(fx, fy, 2, 2);
    }
  }
}

function drawBuilding(c: Ctx, box: BuildingBox, v: TownView, t: number) {
  const b = BUILDINGS[box.i];
  const lighting = v.lighting && v.lighting.i === box.i ? v.lighting.p : null;
  const lit = v.lit[box.i] && (lighting === null || lighting > 0.5);
  const { x, y, w, h } = box;
  if (lit) {
    const g = c.createRadialGradient(x + w / 2, y + h / 2, 2, x + w / 2, y + h / 2, w);
    g.addColorStop(0, "rgba(255,210,63,0.35)");
    g.addColorStop(1, "rgba(255,210,63,0)");
    c.fillStyle = g;
    c.fillRect(x - w / 2, y - h / 2, w * 2, h * 2);
  }
  // walls
  c.fillStyle = lit ? b.wall : shade(b.wall);
  c.fillRect(x, y + 6, w, h - 6);
  // roof
  c.fillStyle = lit ? b.roof : shade(b.roof);
  if (b.id === "radio") {
    c.fillRect(x + w / 2 - 1, y - 10, 2, 16);
    c.fillStyle = lit && Math.sin(t * 6) > 0 ? "#ff3a3a" : "#5a2a2a";
    c.fillRect(x + w / 2 - 2, y - 12, 4, 3);
  } else if (b.id === "townhall") {
    c.fillRect(x - 2, y + 4, w + 4, 4);
    c.beginPath();
    c.moveTo(x + w / 2 - 8, y + 4);
    c.lineTo(x + w / 2, y - 6);
    c.lineTo(x + w / 2 + 8, y + 4);
    c.fill();
    // clock
    c.fillStyle = lit ? "#fff6b8" : "#6a6a7a";
    c.beginPath();
    c.arc(x + w / 2, y + 14, 4, 0, Math.PI * 2);
    c.fill();
  } else {
    c.beginPath();
    c.moveTo(x - 2, y + 7);
    c.lineTo(x + w / 2, y - 2);
    c.lineTo(x + w + 2, y + 7);
    c.fill();
  }
  // snow on the roof
  c.fillStyle = "#f2f4ff";
  c.fillRect(x + 2, y + 5, w - 4, 2);
  // windows
  const cols = Math.max(2, Math.floor((w - 6) / 8));
  const rows = Math.max(1, Math.floor((h - 18) / 9));
  for (let r = 0; r < rows; r++) {
    for (let k = 0; k < cols; k++) {
      const wx = x + 4 + k * ((w - 8) / cols) + 1;
      const wy = y + 11 + r * 9;
      const flick = lighting !== null && lighting < 0.5 ? Math.sin(t * 40 + k + r) > 0 : false;
      c.fillStyle = lit || flick ? (Math.sin(t * 2 + k * 3 + r) > 0.95 ? "#ffe680" : "#ffd23f") : "#1a2040";
      c.fillRect(wx, wy, 4, 5);
    }
  }
  // door
  c.fillStyle = lit ? "#5a3a2a" : "#2a2030";
  c.fillRect(x + w / 2 - 3, y + h - 8, 6, 8);
  // selection & lock
  if (v.selected === box.i) {
    c.strokeStyle = Math.sin(t * 6) > 0 ? "#ffd23f" : "#e3262f";
    c.lineWidth = 1;
    c.strokeRect(x - 2.5, y - 3.5, w + 5, h + 5);
  }
  if (!v.open[box.i]) {
    c.fillStyle = "rgba(7,10,36,0.45)";
    c.fillRect(x, y, w, h);
  }
  text(c, String(box.i + 1), x + 1, y + h - 7, lit ? "#1a1a2e" : "#8a94c8", 5);
}

function shade(hex: string): string {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.round(((n >> 16) & 255) * 0.35);
  const g = Math.round(((n >> 8) & 255) * 0.35);
  const b = Math.round((n & 255) * 0.42);
  return `rgb(${r},${g},${b})`;
}

/* ---------------------------------------------------------------- circuit board */

export interface BoardGeom {
  x0: number;
  y0: number;
  cs: number;
}

export function boardGeom(rows: number, cols: number): BoardGeom {
  const cs = Math.min(40, Math.floor(W / cols), Math.floor(H / rows));
  return { x0: Math.floor((W - cs * cols) / 2), y0: Math.floor((H - cs * rows) / 2), cs };
}

export interface BoardView {
  grid: Grid;
  slots: boolean[][];
  closed: boolean;
  res: SolveResult | null;
  out: Set<string>;
  cursor: { r: number; c: number } | null;
  /** Sparky's loop and where along it (0-1). */
  path: PathStep[] | null;
  pathP: number;
  showBreaks: boolean;
}

export function drawBoard(c: Ctx, v: BoardView, t: number) {
  const rows = v.grid.length;
  const cols = v.grid[0].length;
  const g = boardGeom(rows, cols);
  // circuit board
  c.fillStyle = "#0c2a24";
  c.fillRect(0, 0, W, H);
  c.fillStyle = "#123a30";
  for (let x = 4; x < W; x += 8) for (let y = 4; y < H; y += 8) c.fillRect(x, y, 1, 1);
  const lit = new Map<string, { bright: number; on: boolean; kind: string; current: number }>();
  for (const l of v.res?.loads ?? []) lit.set(cellKey(l.r, l.c), { bright: l.bright, on: l.on, kind: l.kind, current: l.current });
  const hot = new Set((v.res?.short ? v.res.shortCells : []).map((s) => cellKey(s.r, s.c)));
  for (let r = 0; r < rows; r++) {
    for (let col = 0; col < cols; col++) {
      const x = g.x0 + col * g.cs;
      const y = g.y0 + r * g.cs;
      if (v.slots[r][col]) {
        c.fillStyle = "#16443a";
        c.fillRect(x + 1, y + 1, g.cs - 2, g.cs - 2);
        c.strokeStyle = "#3a8a70";
        c.setLineDash([3, 3]);
        c.lineWidth = 1;
        c.strokeRect(x + 2.5, y + 2.5, g.cs - 5, g.cs - 5);
        c.setLineDash([]);
      }
      const tile = v.grid[r][col];
      if (tile) drawTile(c, tile, x, y, g.cs, t, { closed: v.closed, info: lit.get(cellKey(r, col)), hot: hot.has(cellKey(r, col)), out: v.out.has(cellKey(r, col)) });
    }
  }
  // breaks
  if (v.showBreaks && v.res && !v.res.short) {
    const blink = Math.sin(t * 8) > -0.3;
    for (const b of v.res.breaks) {
      if (!blink) break;
      const cx = g.x0 + b.c * g.cs + g.cs / 2 + (b.dir !== null ? DC[b.dir] * g.cs * 0.42 : 0);
      const cy = g.y0 + b.r * g.cs + g.cs / 2 + (b.dir !== null ? DR[b.dir] * g.cs * 0.42 : 0);
      drawX(c, cx, cy, b.dir === null ? 7 : 4);
    }
  }
  // short circuit heat shimmer
  if (v.res?.short) {
    for (const s of v.res.shortCells) {
      const x = g.x0 + s.c * g.cs + g.cs / 2;
      const y = g.y0 + s.r * g.cs + g.cs / 2;
      c.strokeStyle = `rgba(255,${120 + Math.floor(Math.sin(t * 10) * 60)},60,0.8)`;
      c.lineWidth = 1;
      for (let k = -1; k <= 1; k++) {
        c.beginPath();
        c.moveTo(x + k * 5, y - 4);
        c.quadraticCurveTo(x + k * 5 + 3, y - 9 - Math.sin(t * 6 + k) * 2, x + k * 5, y - 14);
        c.stroke();
      }
    }
  }
  // cursor
  if (v.cursor) {
    const x = g.x0 + v.cursor.c * g.cs;
    const y = g.y0 + v.cursor.r * g.cs;
    c.strokeStyle = Math.sin(t * 8) > 0 ? "#ffd23f" : "#ffffff";
    c.lineWidth = 2;
    c.strokeRect(x + 1, y + 1, g.cs - 2, g.cs - 2);
  }
  // Sparky running the loop
  if (v.path && v.path.length > 1) {
    const pt = pathPoint(v.path, v.pathP, g);
    for (let k = 1; k <= 4; k++) {
      const tp = pathPoint(v.path, Math.max(0, v.pathP - k * 0.012), g);
      c.fillStyle = `rgba(127,231,255,${0.5 - k * 0.1})`;
      c.fillRect(tp[0] - 1.5, tp[1] - 1.5, 3, 3);
    }
    drawSparky(c, pt[0], pt[1], t, Math.max(0.8, g.cs / 40));
  }
}

function drawX(c: Ctx, x: number, y: number, s: number) {
  c.strokeStyle = "#000";
  c.lineWidth = 4;
  c.beginPath();
  c.moveTo(x - s, y - s);
  c.lineTo(x + s, y + s);
  c.moveTo(x + s, y - s);
  c.lineTo(x - s, y + s);
  c.stroke();
  c.strokeStyle = "#ff4a5a";
  c.lineWidth = 2;
  c.stroke();
}

/** A point along Sparky's loop (cell centres and side midpoints). */
function pathPoint(path: PathStep[], p: number, g: BoardGeom): [number, number] {
  const pts: [number, number][] = [];
  for (const s of path) {
    const cx = g.x0 + s.c * g.cs + g.cs / 2;
    const cy = g.y0 + s.r * g.cs + g.cs / 2;
    if (s.from !== null) pts.push([cx + DC[s.from] * g.cs / 2, cy + DR[s.from] * g.cs / 2]);
    pts.push([cx, cy]);
    if (s.to !== null) pts.push([cx + DC[s.to] * g.cs / 2, cy + DR[s.to] * g.cs / 2]);
  }
  const f = Math.max(0, Math.min(0.9999, p)) * (pts.length - 1);
  const i = Math.floor(f);
  const k = f - i;
  const a = pts[i];
  const b = pts[i + 1] ?? a;
  return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k];
}

interface TileState {
  closed: boolean;
  info?: { bright: number; on: boolean; kind: string; current: number };
  hot: boolean;
  out: boolean;
}

export function drawTile(c: Ctx, tile: Tile, x: number, y: number, cs: number, t: number, st: TileState) {
  const cx = x + cs / 2;
  const cy = y + cs / 2;
  const half = cs / 2;
  if (!tile.fixed) {
    // a part the player placed (or may take away): a lighter mat underneath
    c.fillStyle = "#1e5a4a";
    c.fillRect(x + 2, y + 2, cs - 4, cs - 4);
  }
  const wireColor = st.hot ? (Math.sin(t * 12) > 0 ? "#ff6a3a" : "#ffb03a") : "#e08a3c";
  const stub = (d: number, len = half) => {
    c.beginPath();
    c.moveTo(cx, cy);
    c.lineTo(cx + DC[d] * len, cy + DR[d] * len);
    c.stroke();
  };
  const [a, b] = sides(tile);
  c.lineCap = "butt";
  if (tile.kind === "wire") {
    c.strokeStyle = "#5a2e10";
    c.lineWidth = 6;
    for (const d of sides(tile)) stub(d);
    c.strokeStyle = wireColor;
    c.lineWidth = 3;
    for (const d of sides(tile)) stub(d);
    c.fillStyle = wireColor;
    c.fillRect(cx - 2.5, cy - 2.5, 5, 5);
    return;
  }
  // two-terminal parts: leads to both sides
  c.strokeStyle = wireColor;
  c.lineWidth = 3;
  stub(a);
  stub(b);
  const horiz = a === 3 || a === 1;
  const s = cs / 40;
  switch (tile.kind) {
    case "battery": {
      const bw = horiz ? 22 * s : 12 * s;
      const bh = horiz ? 12 * s : 22 * s;
      c.fillStyle = "#2a2a3a";
      c.fillRect(cx - bw / 2, cy - bh / 2, bw, bh);
      // + end (copper cap) on side b
      c.fillStyle = "#e3262f";
      const capW = horiz ? 6 * s : bw;
      const capH = horiz ? bh : 6 * s;
      const px = cx + DC[b] * (bw / 2 - 3 * s) - capW / 2;
      const py = cy + DR[b] * (bh / 2 - 3 * s) - capH / 2;
      c.fillRect(px, py, capW, capH);
      text(c, "+", cx + DC[b] * 13 * s, cy + DR[b] * 13 * s - 3, "#ffd23f", 6, "center");
      text(c, "−", cx + DC[a] * 13 * s, cy + DR[a] * 13 * s - 3, "#7fe7ff", 6, "center");
      text(c, `${tile.volts ?? 1.5}V`, cx, cy - 3, "#ffffff", 5, "center");
      break;
    }
    case "switch": {
      c.fillStyle = "#3a3a5a";
      c.fillRect(cx - 9 * s, cy - 4 * s, 18 * s, 8 * s);
      const p1x = cx + DC[a] * 8 * s;
      const p1y = cy + DR[a] * 8 * s;
      const p2x = cx + DC[b] * 8 * s;
      const p2y = cy + DR[b] * 8 * s;
      c.fillStyle = "#c9d3e0";
      c.fillRect(p1x - 2, p1y - 2, 4, 4);
      c.fillRect(p2x - 2, p2y - 2, 4, 4);
      c.strokeStyle = st.closed ? "#5fff8a" : "#ffd23f";
      c.lineWidth = 2.5;
      c.beginPath();
      c.moveTo(p1x, p1y);
      if (st.closed) c.lineTo(p2x, p2y);
      else c.lineTo(p2x + (horiz ? 0 : -10 * s), p2y + (horiz ? -10 * s : 0));
      c.stroke();
      text(c, st.closed ? "ON" : "OFF", cx, cy + 6 * s + 1, st.closed ? "#5fff8a" : "#ffd23f", 5, "center");
      break;
    }
    case "bulb": {
      const on = !st.out && !!st.info?.on;
      const br = st.info?.bright ?? 0;
      if (on) {
        const gr = c.createRadialGradient(cx, cy, 2, cx, cy, (10 + 14 * br) * s);
        gr.addColorStop(0, `rgba(255,240,140,${0.5 + 0.5 * br})`);
        gr.addColorStop(1, "rgba(255,240,140,0)");
        c.fillStyle = gr;
        c.fillRect(cx - 26 * s, cy - 26 * s, 52 * s, 52 * s);
      }
      if (st.out) {
        c.fillStyle = "#3a3a4a";
        c.fillRect(cx - 4 * s, cy + 4 * s, 8 * s, 4 * s);
        text(c, "OUT", cx, cy - 4, "#ff8a8f", 5, "center");
        break;
      }
      c.fillStyle = on ? (br > 0.6 ? "#fff6b8" : br > 0.3 ? "#ffe680" : "#d8b850") : "#5a6a8a";
      c.beginPath();
      c.arc(cx, cy - 2 * s, 7 * s, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = "#9aa0b0";
      c.fillRect(cx - 4 * s, cy + 4 * s, 8 * s, 4 * s);
      c.strokeStyle = on ? "#ff9a3a" : "#2a2a3a";
      c.lineWidth = 1;
      c.beginPath();
      c.moveTo(cx - 3 * s, cy + 1 * s);
      c.lineTo(cx - 1 * s, cy - 4 * s);
      c.lineTo(cx + 1 * s, cy + 1 * s);
      c.lineTo(cx + 3 * s, cy - 4 * s);
      c.stroke();
      if (tile.ohms && tile.ohms !== 3) text(c, `${tile.ohms}Ω`, cx, cy + 9 * s + 1, "#cfd6ff", 5, "center");
      break;
    }
    case "motor": {
      const on = !!st.info?.on;
      c.fillStyle = "#3a5a8a";
      c.beginPath();
      c.arc(cx, cy, 9 * s, 0, Math.PI * 2);
      c.fill();
      const ang = on ? t * 14 : 0.4;
      c.fillStyle = on ? "#7fe7ff" : "#9aa0b0";
      for (let k = 0; k < 3; k++) {
        const an = ang + (k * Math.PI * 2) / 3;
        c.beginPath();
        c.moveTo(cx, cy);
        c.arc(cx, cy, 8 * s, an, an + 0.7);
        c.fill();
      }
      c.fillStyle = "#1a1a2e";
      c.fillRect(cx - 1.5, cy - 1.5, 3, 3);
      if (tile.ohms && tile.ohms !== 3) text(c, `${tile.ohms}Ω`, cx, cy + 10 * s, "#cfd6ff", 5, "center");
      break;
    }
    case "buzzer": {
      const on = !!st.info?.on;
      c.fillStyle = "#2a2a3a";
      c.fillRect(cx - 7 * s, cy - 7 * s, 14 * s, 14 * s);
      c.fillStyle = on ? "#ffd23f" : "#6a6a8a";
      c.beginPath();
      c.arc(cx, cy, 4 * s, 0, Math.PI * 2);
      c.fill();
      if (on) {
        c.strokeStyle = "#ffd23f";
        c.lineWidth = 1;
        const w = (t * 3) % 1;
        for (const k of [0, 0.5]) {
          const rr = (8 + ((w + k) % 1) * 8) * s;
          c.beginPath();
          c.arc(cx, cy, rr, -0.6, 0.6);
          c.stroke();
        }
      }
      break;
    }
    case "resistor": {
      c.fillStyle = "#0c2a24";
      c.fillRect(cx - 10 * s, cy - 5 * s, 20 * s, 10 * s);
      c.strokeStyle = st.info && Math.abs(st.info.current) > 0.05 ? "#ffb03a" : "#d9b48a";
      c.lineWidth = 2;
      c.beginPath();
      for (let k = 0; k <= 6; k++) {
        const along = -10 + (20 * k) / 6;
        const off = k === 0 || k === 6 ? 0 : k % 2 ? -4 : 4;
        const px = cx + (horiz ? along : off) * s;
        const py = cy + (horiz ? off : along) * s;
        if (k === 0) c.moveTo(px, py);
        else c.lineTo(px, py);
      }
      c.stroke();
      text(c, `${tile.ohms ?? 3}Ω`, cx + (horiz ? 0 : 9 * s), cy + (horiz ? 7 * s : -3), "#ffffff", 5, "center");
      break;
    }
    case "material": {
      const m = MATERIALS[tile.mat!];
      const mw = horiz ? 30 * s : 14 * s;
      const mh = horiz ? 14 * s : 30 * s;
      c.fillStyle = m.color;
      c.fillRect(cx - mw / 2, cy - mh / 2, mw, mh);
      c.strokeStyle = "#000";
      c.lineWidth = 1;
      c.strokeRect(cx - mw / 2 + 0.5, cy - mh / 2 + 0.5, mw - 1, mh - 1);
      c.save();
      c.translate(cx, cy);
      if (!horiz) c.rotate(-Math.PI / 2);
      text(c, m.short, 0, -2.5, "#1a1a2e", 5, "center");
      c.restore();
      break;
    }
  }
}

/** A toolbox icon (drawn into its own small canvas). */
export function drawToolIcon(c: Ctx, tile: Tile, size: number) {
  c.clearRect(0, 0, size, size);
  drawTile(c, { ...tile, fixed: true }, 0, 0, size, 0, { closed: false, hot: false, out: false });
}

/* ---------------------------------------------------------------- heat lab */

export interface HeatViewState {
  level: HeatLevel;
  band: Band;
  chosen: string[];
  run: HeatRun | null;
  /** 0-1 of the run shown so far. */
  p: number;
}

export function drawHeat(c: Ctx, v: HeatViewState, t: number) {
  c.fillStyle = "#0b1030";
  c.fillRect(0, 0, W, H);
  // scene on the left
  c.save();
  c.beginPath();
  c.rect(0, 0, 168, H);
  c.clip();
  drawScene(c, v, t);
  c.restore();
  drawGraph(c, v, 172, 8, 142, 150);
  // legend
  if (v.run) {
    let y = 166;
    const shown = v.run.series.filter((s) => s.chosen || v.level.type === "radiation" || v.level.type === "conduction" || v.level.type === "convection").slice(0, 4);
    for (const s of shown) {
      c.fillStyle = s.color;
      c.fillRect(174, y + 1, 6, 4);
      text(c, s.label.slice(0, 20), 183, y, s.chosen ? "#ffffff" : "#8a94c8", 5);
      y += 8;
    }
  }
}

function tempAt(v: HeatViewState, seriesId?: string): number {
  if (!v.run) return v.level.start;
  const s = seriesId ? v.run.series.find((x) => x.id === seriesId) : v.run.series.find((x) => x.chosen);
  if (!s) return v.level.start;
  const f = Math.min(SAMPLES, v.p * SAMPLES);
  const i = Math.floor(f);
  const k = f - i;
  const a = s.pts[i];
  const b = s.pts[Math.min(SAMPLES, i + 1)];
  return a + (b - a) * k;
}

function thermometer(c: Ctx, x: number, y: number, h: number, temp: number, lo: number, hi: number, band: Band) {
  c.fillStyle = "#f2f4ff";
  c.fillRect(x, y, 6, h);
  c.beginPath();
  c.arc(x + 3, y + h + 3, 5, 0, Math.PI * 2);
  c.fill();
  const f = Math.max(0, Math.min(1, (temp - lo) / (hi - lo)));
  const col = temp > 45 ? "#e3262f" : temp > 15 ? "#ff9a3a" : temp > 0 ? "#7fe7ff" : "#2456e8";
  c.fillStyle = col;
  c.fillRect(x + 2, y + h - f * h, 2, f * h + 2);
  c.beginPath();
  c.arc(x + 3, y + h + 3, 3.5, 0, Math.PI * 2);
  c.fill();
  text(c, fmtTemp(temp, band), x + 3, y - 9, "#ffffff", 5, "center");
}

function drawScene(c: Ctx, v: HeatViewState, t: number) {
  const L = v.level;
  const opt = L.options.find((o) => v.chosen.includes(o.id));
  switch (L.scene) {
    case "cocoa": {
      // bakery counter
      c.fillStyle = "#3a2a3a";
      c.fillRect(0, 0, 168, H);
      c.fillStyle = "#6a4a3a";
      c.fillRect(0, 140, 168, 60);
      const temp = tempAt(v);
      const col = opt?.color ?? "#9aa0b0";
      c.fillStyle = col;
      c.fillRect(54, 92, 44, 48);
      c.fillRect(98, 102, 10, 4);
      c.fillRect(104, 102, 4, 24);
      c.fillRect(98, 122, 10, 4);
      if (opt?.id === "wool") {
        c.fillStyle = "#a03050";
        for (let y = 96; y < 136; y += 6) c.fillRect(54, y, 44, 2);
      }
      c.fillStyle = "#5a2e10";
      c.fillRect(57, 92, 38, 6);
      // steam ∝ how hot
      const steam = Math.max(0, (temp - 30) / 50);
      c.strokeStyle = `rgba(255,255,255,${0.2 + 0.6 * steam})`;
      c.lineWidth = 1.5;
      for (let k = 0; k < 3; k++) {
        const sx = 64 + k * 12;
        c.beginPath();
        c.moveTo(sx, 88);
        for (let yy = 0; yy < 30 * steam; yy += 3) c.lineTo(sx + Math.sin(t * 3 + yy / 5 + k) * 3, 88 - yy);
        c.stroke();
      }
      thermometer(c, 140, 40, 70, temp, 0, 90, v.band);
      text(c, opt ? opt.label : "Pick a cup", 76, 150, "#ffffff", 5, "center");
      break;
    }
    case "icepop": {
      c.fillStyle = "#1a3a4a";
      c.fillRect(0, 0, 168, H);
      c.fillStyle = "#6a6a7a";
      c.fillRect(0, 150, 168, 50);
      const temp = tempAt(v);
      const col = opt?.color ?? "#9aa0b0";
      c.fillStyle = col;
      c.fillRect(30, 90, 90, 60);
      c.fillStyle = "#1a2a3a";
      c.fillRect(36, 96, 78, 48);
      for (let k = 0; k < 4; k++) {
        const melt = Math.max(0, Math.min(1, temp / 8));
        const px = 44 + k * 18;
        c.fillStyle = ["#ff5a7a", "#ffd23f", "#5fff8a", "#7fe7ff"][k];
        c.fillRect(px, 104 + melt * 10, 10, 26 - melt * 10);
        c.fillStyle = "#d9b48a";
        c.fillRect(px + 4, 130, 2, 10);
        if (temp > 0) {
          c.fillStyle = "rgba(127,231,255,0.7)";
          c.fillRect(px + 2, 140 + ((t * 20 + k * 5) % 6), 2, 2);
        }
      }
      thermometer(c, 140, 40, 70, temp, -15, 25, v.band);
      text(c, temp < 0 ? "FROZEN" : "MELTING!", 75, 76, temp < 0 ? "#7fe7ff" : "#ff8a8f", 6, "center");
      break;
    }
    case "sun": {
      c.fillStyle = "#4a8ad8";
      c.fillRect(0, 0, 168, H);
      c.fillStyle = "#ffd23f";
      c.beginPath();
      c.arc(24, 24, 14, 0, Math.PI * 2);
      c.fill();
      c.strokeStyle = "#ffe680";
      c.lineWidth = 1.5;
      for (let k = 0; k < 8; k++) {
        const an = (k * Math.PI) / 4 + t * 0.5;
        c.beginPath();
        c.moveTo(24 + Math.cos(an) * 18, 24 + Math.sin(an) * 18);
        c.lineTo(24 + Math.cos(an) * 24, 24 + Math.sin(an) * 24);
        c.stroke();
      }
      c.fillStyle = "#dfe8f8";
      c.fillRect(0, 150, 168, 50);
      const n = L.options.length;
      L.options.forEach((o, k) => {
        const x = 12 + k * (150 / n);
        const w = 150 / n - 10;
        const temp = tempAt(v, o.id);
        c.fillStyle = o.color;
        c.fillRect(x, 120, w, 30);
        c.fillRect(x - 4, 120, 6, 10);
        c.fillRect(x + w - 2, 120, 6, 10);
        if (v.chosen.includes(o.id)) {
          c.strokeStyle = "#ffd23f";
          c.lineWidth = 2;
          c.strokeRect(x - 2, 118, w + 4, 34);
        }
        // sun rays landing
        c.strokeStyle = "rgba(255,230,128,0.5)";
        c.lineWidth = 1;
        c.beginPath();
        c.moveTo(30, 34);
        c.lineTo(x + w / 2, 118);
        c.stroke();
        if (v.run) text(c, fmtTemp(temp, v.band), x + w / 2, 156, "#1a1a2e", 5, "center");
        const shimmer = Math.max(0, (temp - L.room) / 20);
        if (shimmer > 0.1) {
          c.strokeStyle = `rgba(255,120,60,${Math.min(0.8, shimmer)})`;
          c.beginPath();
          c.moveTo(x + w / 2, 116);
          c.quadraticCurveTo(x + w / 2 + 3, 110 - Math.sin(t * 5 + k) * 2, x + w / 2, 104);
          c.stroke();
        }
      });
      break;
    }
    case "spoons": {
      c.fillStyle = "#2a2a4a";
      c.fillRect(0, 0, 168, H);
      c.fillStyle = "#6a4a3a";
      c.fillRect(0, 160, 168, 40);
      // bowl of soup
      c.fillStyle = "#e8e0d0";
      c.beginPath();
      c.ellipse(84, 140, 70, 22, 0, 0, Math.PI);
      c.fill();
      c.fillStyle = "#d8803a";
      c.beginPath();
      c.ellipse(84, 140, 66, 8, 0, 0, Math.PI * 2);
      c.fill();
      const n = L.options.length;
      L.options.forEach((o, k) => {
        const x = 40 + k * (90 / Math.max(1, n - 1));
        const temp = tempAt(v, o.id);
        const heat = Math.max(0, Math.min(1, (temp - L.room) / (L.start - L.room)));
        c.strokeStyle = o.color;
        c.lineWidth = 5;
        c.beginPath();
        c.moveTo(x, 140);
        c.lineTo(x - 14, 60);
        c.stroke();
        // the handle glows as it heats
        c.strokeStyle = `rgba(255,70,40,${heat})`;
        c.lineWidth = 5;
        c.beginPath();
        c.moveTo(x - 9, 100);
        c.lineTo(x - 14, 60);
        c.stroke();
        if (v.chosen.includes(o.id)) {
          c.strokeStyle = "#ffd23f";
          c.lineWidth = 1;
          c.strokeRect(x - 20, 54, 14, 14);
        }
        if (v.run) text(c, fmtTemp(temp, v.band), x - 14, 44, heat > 0.5 ? "#ff8a8f" : "#ffffff", 5, "center");
      });
      // steam
      c.strokeStyle = "rgba(255,255,255,0.5)";
      for (let k = 0; k < 4; k++) {
        c.beginPath();
        c.moveTo(50 + k * 22, 130);
        c.quadraticCurveTo(54 + k * 22, 118 - Math.sin(t * 3 + k) * 3, 50 + k * 22, 108);
        c.stroke();
      }
      break;
    }
    case "room": {
      const low = v.chosen[0] !== "high";
      const fT = tempAt(v, "floor");
      const cT = tempAt(v, "ceiling");
      const tint = (x: number) => {
        const f = Math.max(0, Math.min(1, (x - 5) / 25));
        return `rgb(${Math.round(30 + 160 * f)}, ${Math.round(50 + 30 * f)}, ${Math.round(120 - 60 * f)})`;
      };
      c.fillStyle = tint(cT);
      c.fillRect(8, 20, 152, 70);
      c.fillStyle = tint(fT);
      c.fillRect(8, 90, 152, 70);
      c.strokeStyle = "#c9d3e0";
      c.lineWidth = 3;
      c.strokeRect(8, 20, 152, 140);
      c.fillStyle = "#5a3a2a";
      c.fillRect(8, 160, 152, 6);
      text(c, `CEILING ${v.run ? fmtTemp(cT, v.band) : ""}`, 12, 24, "#ffffff", 5);
      text(c, `FLOOR ${v.run ? fmtTemp(fT, v.band) : ""}`, 12, 148, "#ffffff", 5);
      // heater
      if (v.chosen.length) {
        const hy = low ? 138 : 32;
        c.fillStyle = "#3a3a4a";
        c.fillRect(120, hy, 30, 16);
        c.fillStyle = Math.sin(t * 6) > 0 ? "#ff5a3a" : "#ff9a3a";
        for (let k = 0; k < 4; k++) c.fillRect(123 + k * 7, hy + 3, 3, 10);
      }
      // particles: warm air rises; with the heater low it churns the whole room
      if (v.run) {
        for (let k = 0; k < 26; k++) {
          const ph = (t * 0.25 + k / 26) % 1;
          let x: number;
          let y: number;
          if (low) {
            const ang = ph * Math.PI * 2;
            x = 84 + Math.cos(ang) * (60 - (k % 3) * 12);
            y = 90 + Math.sin(ang) * (55 - (k % 3) * 10);
          } else {
            x = 16 + ((k * 37 + t * 8) % 136);
            y = k % 2 ? 26 + ((k * 13) % 50) : 100 + ((k * 17) % 50);
          }
          const warm = low ? Math.sin(ph * Math.PI * 2) < 0 : y < 80;
          c.fillStyle = warm ? "#ff9a5a" : "#7fb8ff";
          c.fillRect(x, y, 2, 2);
        }
      }
      // a family on the floor
      drawPerson(c, 40, 146, fT);
      drawPerson(c, 60, 146, fT);
      break;
    }
    case "house": {
      c.fillStyle = "#0a1030";
      c.fillRect(0, 0, 168, H);
      c.fillStyle = "#dfe8f8";
      c.fillRect(0, 170, 168, 30);
      const temp = tempAt(v);
      const has = (id: string) => v.chosen.includes(id);
      // attic
      c.fillStyle = has("attic") ? "#f0a0b0" : "#3a3a5a";
      c.beginPath();
      c.moveTo(14, 70);
      c.lineTo(84, 22);
      c.lineTo(154, 70);
      c.fill();
      c.strokeStyle = "#c0392b";
      c.lineWidth = 3;
      c.stroke();
      // walls
      c.fillStyle = "#c8a878";
      c.fillRect(22, 70, 124, 100);
      c.fillStyle = tempAt(v) > 15 ? "#5a3a3a" : "#2a3a5a";
      c.fillRect(30, 78, 108, 92);
      if (has("walls")) {
        c.fillStyle = "#f0a0b0";
        c.fillRect(22, 70, 8, 100);
        c.fillRect(138, 70, 8, 100);
      }
      // windows and door
      c.fillStyle = has("windows") ? "#9ee8e0" : "#4a6a9a";
      c.fillRect(40, 92, 22, 18);
      c.fillRect(106, 92, 22, 18);
      if (has("windows")) {
        c.fillStyle = "#c0392b";
        c.fillRect(40, 92, 4, 18);
        c.fillRect(124, 92, 4, 18);
      }
      c.fillStyle = "#5a3a2a";
      c.fillRect(74, 130, 20, 40);
      if (has("door")) {
        c.fillStyle = "#5fff8a";
        c.fillRect(72, 130, 2, 40);
        c.fillRect(94, 130, 2, 40);
      }
      // heat escaping (arrows sized by how much each part loses)
      if (v.run) {
        const parts: [string, number, number, number, number][] = [
          ["attic", 4, 84, 18, -1],
          ["walls", 3, 10, 120, 0],
          ["windows", 2, 51, 100, 0],
          ["door", 1, 84, 150, 0],
        ];
        for (const [id, base, x, y, up] of parts) {
          const opt2 = L.options.find((o) => o.id === id);
          const loss = base - (has(id) ? opt2?.save ?? 0 : 0);
          const len = 4 + loss * 4;
          const wob = ((t * 20) % 8);
          c.strokeStyle = "#ff6a3a";
          c.lineWidth = Math.max(1, loss);
          c.beginPath();
          if (up) {
            c.moveTo(x, y - wob);
            c.lineTo(x, y - wob - len);
          } else {
            c.moveTo(x - wob, y);
            c.lineTo(x - wob - len, y);
          }
          c.stroke();
        }
      }
      thermometer(c, 80, 90, 34, temp, -10, 25, v.band);
      text(c, "OUTSIDE", 4, 176, "#2a3a6a", 5);
      text(c, fmtTemp(L.room, v.band), 4, 184, "#2a3a6a", 5);
      break;
    }
    case "tank": {
      c.fillStyle = "#2a2a3a";
      c.fillRect(0, 0, 168, H);
      const temp = tempAt(v);
      c.fillStyle = "#c9d3e0";
      c.fillRect(34, 40, 80, 120);
      const f = Math.max(0, Math.min(1, (temp - 15) / 70));
      c.fillStyle = `rgb(${Math.round(60 + 180 * f)}, ${Math.round(140 - 40 * f)}, ${Math.round(230 - 150 * f)})`;
      c.fillRect(40, 56, 68, 98);
      const on = !!v.run && v.p * L.duration < (L.options.find((o) => v.chosen.includes(o.id))?.value ?? 0);
      c.strokeStyle = on ? (Math.sin(t * 10) > 0 ? "#ff3a1a" : "#ff9a3a") : "#6a6a7a";
      c.lineWidth = 2;
      c.beginPath();
      for (let k = 0; k < 6; k++) {
        c.moveTo(46 + k * 10, 148);
        c.lineTo(51 + k * 10, 140);
        c.lineTo(56 + k * 10, 148);
      }
      c.stroke();
      text(c, on ? "HEATER ON" : "HEATER OFF", 74, 166, on ? "#ff8a3a" : "#9aa0b0", 5, "center");
      text(c, `${(v.p * L.duration).toFixed(0)} s`, 74, 30, "#ffffff", 6, "center");
      thermometer(c, 140, 40, 90, temp, 10, 90, v.band);
      break;
    }
  }
}

function drawPerson(c: Ctx, x: number, y: number, temp: number) {
  c.fillStyle = "#f6c89a";
  c.fillRect(x, y - 12, 6, 6);
  c.fillStyle = "#2456e8";
  c.fillRect(x - 1, y - 6, 8, 8);
  if (temp < 15) {
    c.fillStyle = "#7fe7ff";
    c.fillRect(x + 7 + (Math.random() > 0.5 ? 1 : 0), y - 10, 1, 1);
  }
}

function drawGraph(c: Ctx, v: HeatViewState, x: number, y: number, w: number, h: number) {
  const L = v.level;
  c.fillStyle = "#060920";
  c.fillRect(x, y, w, h);
  c.strokeStyle = "#3a4a8a";
  c.lineWidth = 1;
  c.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  // range
  let lo = Math.min(L.start, L.room, L.target ?? L.start);
  let hi = Math.max(L.start, L.room, L.target ?? L.start);
  if (v.run) for (const s of v.run.series) for (const p of s.pts) {
    lo = Math.min(lo, p);
    hi = Math.max(hi, p);
  }
  if (v.run?.line2 !== null && v.run?.line2 !== undefined) lo = Math.min(lo, v.run.line2);
  lo = Math.floor(lo / 5) * 5 - 5;
  hi = Math.ceil(hi / 5) * 5 + 5;
  const gy = (T: number) => y + h - 12 - ((T - lo) / (hi - lo)) * (h - 22);
  const gx = (i: number) => x + 22 + (i / SAMPLES) * (w - 28);
  // axes labels
  text(c, fmtTemp(hi, v.band), x + 2, gy(hi) - 3, "#8a94c8", 4);
  text(c, fmtTemp(lo, v.band), x + 2, gy(lo) - 3, "#8a94c8", 4);
  text(c, `${L.duration} ${L.unit}`, x + w - 4, y + h - 9, "#8a94c8", 4, "right");
  text(c, "0", x + 22, y + h - 9, "#8a94c8", 4);
  // room temperature / target lines
  const dashed = (T: number, col: string, label: string) => {
    c.strokeStyle = col;
    c.setLineDash([2, 2]);
    c.beginPath();
    c.moveTo(x + 22, gy(T));
    c.lineTo(x + w - 4, gy(T));
    c.stroke();
    c.setLineDash([]);
    text(c, label, x + w - 5, gy(T) - 7, col, 4, "right");
  };
  if (L.type === "keep-hot" || L.type === "keep-cold" || L.type === "radiation" || L.type === "conduction") dashed(L.room, "#5a6aa8", "ROOM");
  if (L.target !== undefined) dashed(L.target, "#5fff8a", "GOAL");
  if (v.run?.line2 !== null && v.run?.line2 !== undefined) dashed(v.run.line2, "#7fe7ff", "OUTSIDE");
  if (!v.run) {
    text(c, "PICK, THEN RUN", x + w / 2 + 10, y + h / 2 - 4, "#6a78b8", 5, "center");
    return;
  }
  const upto = Math.max(1, Math.round(v.p * SAMPLES));
  const order = [...v.run.series].sort((a, b) => Number(a.chosen) - Number(b.chosen));
  for (const s of order) {
    c.strokeStyle = s.chosen ? s.color : s.color + "88";
    c.lineWidth = s.chosen ? 2 : 1;
    c.beginPath();
    for (let i = 0; i <= upto; i++) {
      if (i === 0) c.moveTo(gx(i), gy(s.pts[i]));
      else c.lineTo(gx(i), gy(s.pts[i]));
    }
    c.stroke();
  }
}

/* ---------------------------------------------------------------- Sparky's Run */

export function drawRun(c: Ctx, sim: RunSim, t: number) {
  const T = RUN_TILE;
  const g = sim.grid;
  const mapW = g[0].length * T;
  const mapH = g.length * T;
  const [pr, pc] = sim.pos();
  const camX = Math.max(0, Math.min(mapW - W, pc * T + T / 2 - W / 2));
  const offY = Math.floor((H - mapH) / 2);
  c.fillStyle = "#0a0f2e";
  c.fillRect(0, 0, W, H);
  const c0 = Math.floor(camX / T);
  for (let r = 0; r < g.length; r++) {
    for (let col = c0; col < Math.min(g[0].length, c0 + Math.ceil(W / T) + 1); col++) {
      const x = col * T - camX;
      const y = r * T + offY;
      drawRunTile(c, sim.tileAt(r, col) ?? "#", x, y, T, t, sim);
    }
  }
  // Sparky
  const sx = pc * T - camX + T / 2;
  const sy = pr * T + offY + T / 2;
  if (sim.dash > 0) {
    c.fillStyle = "rgba(127,231,255,0.35)";
    c.beginPath();
    c.arc(sx, sy, 10, 0, Math.PI * 2);
    c.fill();
  }
  if (sim.shield > 0) {
    c.strokeStyle = "#5fff8a";
    c.lineWidth = 1;
    c.beginPath();
    c.arc(sx, sy, 9, 0, Math.PI * 2);
    c.stroke();
  }
  drawSparky(c, sx, sy, t, 1, sim.hotMsg <= 0);
  if (sim.hotMsg > 0) text(c, "TOO HOT! FIND THE FAN", W / 2, 6, "#ff8a8f", 6, "center");
}

function drawRunTile(c: Ctx, ch: string, x: number, y: number, T: number, t: number, sim: RunSim) {
  switch (ch) {
    case "#":
      c.fillStyle = "#4a1a2a";
      c.fillRect(x, y, T, T);
      c.fillStyle = "#6a2a3a";
      c.fillRect(x + 1, y + 1, T - 2, 3);
      return;
    case ".":
      c.fillStyle = "#121a4a";
      c.fillRect(x, y, T, T);
      c.fillStyle = "#1e2a6a";
      c.fillRect(x + 4, y + 4, 2, 2);
      c.fillRect(x + 14, y + 12, 2, 2);
      return;
  }
  // every walkable tile sits on copper track
  c.fillStyle = "#1a1408";
  c.fillRect(x, y, T, T);
  c.fillStyle = "#b8682a";
  c.fillRect(x + 2, y + 2, T - 4, T - 4);
  c.fillStyle = "#e08a3c";
  c.fillRect(x + 4, y + 4, T - 8, T - 8);
  const cx = x + T / 2;
  const cy = y + T / 2;
  switch (ch) {
    case "+":
      c.fillStyle = "#2a2a3a";
      c.fillRect(x + 3, y + 5, T - 6, T - 10);
      text(c, "+−", cx, cy - 3, "#ffd23f", 6, "center");
      break;
    case "B": {
      const on = sim.done && sim.stars > 0;
      c.fillStyle = on || Math.sin(t * 4) > 0.6 ? "#fff6b8" : "#9aa0b0";
      c.beginPath();
      c.arc(cx, cy - 2, 6, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = "#6a6a7a";
      c.fillRect(cx - 3, cy + 3, 6, 4);
      break;
    }
    case "r":
      c.strokeStyle = "#3a2010";
      c.lineWidth = 2;
      c.beginPath();
      for (let k = 0; k <= 6; k++) c.lineTo(x + 3 + k * 2.3, cy + (k % 2 ? -4 : 4) * (k === 0 || k === 6 ? 0 : 1));
      c.stroke();
      break;
    case "c":
      c.fillStyle = "#7fe7ff";
      c.fillRect(x + 5, y + 5, T - 10, T - 10);
      text(c, "⚡", cx, cy - 4, "#0a0f2e", 7, "center");
      break;
    case "s":
      c.fillStyle = "#3a3a5a";
      c.fillRect(x + 4, y + 7, T - 8, 6);
      c.strokeStyle = sim.gatesClosed ? "#5fff8a" : "#ffd23f";
      c.lineWidth = 2;
      c.beginPath();
      c.moveTo(x + 5, cy);
      c.lineTo(x + T - 5, sim.gatesClosed ? cy : cy - 7);
      c.stroke();
      break;
    case "g":
      if (!sim.gatesClosed) {
        c.fillStyle = "#0a0f2e";
        c.fillRect(x + 6, y, T - 12, T);
        c.strokeStyle = "#ffd23f";
        c.setLineDash([2, 2]);
        c.strokeRect(x + 6.5, y + 0.5, T - 13, T - 1);
        c.setLineDash([]);
      }
      break;
    case "h":
      if (!sim.cooled) {
        c.fillStyle = Math.sin(t * 10) > 0 ? "#ff3a1a" : "#ff8a3a";
        c.fillRect(x + 3, y + 3, T - 6, T - 6);
        c.strokeStyle = "#ffd23f";
        c.lineWidth = 1;
        c.beginPath();
        c.moveTo(cx - 3, y + 2);
        c.quadraticCurveTo(cx, y - 4, cx + 3, y + 2);
        c.stroke();
      } else {
        c.fillStyle = "#9ad8f0";
        c.fillRect(x + 7, y + 7, T - 14, T - 14);
      }
      break;
    case "f": {
      c.fillStyle = "#2456e8";
      c.beginPath();
      c.arc(cx, cy, 7, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = "#c9e8ff";
      const an = t * 10;
      for (let k = 0; k < 3; k++) {
        c.beginPath();
        c.moveTo(cx, cy);
        c.arc(cx, cy, 6, an + k * 2.1, an + k * 2.1 + 0.8);
        c.fill();
      }
      break;
    }
    case "*":
      c.fillStyle = Math.sin(t * 8 + x) > 0 ? "#ffffff" : "#ffd23f";
      c.fillRect(cx - 1, cy - 4, 2, 8);
      c.fillRect(cx - 4, cy - 1, 8, 2);
      break;
    case "P":
      c.fillStyle = "#ffd23f";
      c.fillRect(x + 4, y + 4, T - 8, T - 8);
      text(c, "SC", cx, cy - 3, "#0a0f2e", 6, "center");
      break;
    case "U":
      c.fillStyle = "#5fff8a";
      c.beginPath();
      c.moveTo(cx, y + 3);
      c.lineTo(x + T - 4, y + 6);
      c.lineTo(cx, y + T - 3);
      c.lineTo(x + 4, y + 6);
      c.fill();
      text(c, "F", cx, cy - 4, "#0a0f2e", 6, "center");
      break;
  }
}
