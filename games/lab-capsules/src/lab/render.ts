/*
 * Canvas drawing: the lab bottle, germ blobs ("Wobblers"), capsule halves, the falling capsule
 * (clear glass until it lands, unless the set is K–2 colours or COLOR HINTS is on), the next
 * capsule, and Professor Fizzwick, the lab's scientist mascot. All pixel art is drawn in code.
 */
import { COLS, ROWS, pieceCells, type Link, type Piece, type Tile } from "./board";
import type { LevelSet, ShapeId, Token } from "./content";
import type { LabGame } from "./game";

export const KIND_COLORS = ["#ff4d5e", "#ffd23f", "#4da3ff", "#4fe08a"];
export const KIND_DARK = ["#8f1d2c", "#9a6b00", "#14468f", "#13783d"];
export const KIND_LIGHT = ["#ffb3bb", "#fff1b0", "#bfe0ff", "#c4ffd9"];
export const KIND_NAMES = ["red", "yellow", "blue", "green"];
const GLASS = "#e7ecff";
const GLASS_DARK = "#7d88c4";
const INK = "#10143a";

export interface Popup {
  text: string;
  r: number;
  c: number;
  t0: number;
  color: string;
}

export interface DrawOpts {
  cell: number;
  /** ms clock for wobble and flashing. */
  t: number;
  hint: boolean;
  popups: Popup[];
  /** Tiles revealed this long ago glow briefly. */
  ghost: boolean;
}

/** Bottle frame sizes for a cell size. */
export function bottleMetrics(cell: number) {
  const pad = Math.max(4, Math.round(cell * 0.3));
  const neck = Math.round(cell * 0.9);
  return { pad, neck, w: COLS * cell + pad * 2, h: neck + ROWS * cell + pad };
}

/* ------------------------------------------------------------------ rich labels (H₂O, Na⁺, SO₄²⁻) */

const SUBS = "₀₁₂₃₄₅₆₇₈₉";
const SUPS = "⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻";
const SUP_PLAIN = "0123456789+−";

interface Run {
  text: string;
  mode: "n" | "sub" | "sup";
}

function runs(label: string): Run[] {
  const out: Run[] = [];
  for (const ch of label) {
    let mode: Run["mode"] = "n";
    let c = ch;
    const si = SUBS.indexOf(ch);
    const pi = SUPS.indexOf(ch);
    if (si >= 0) (mode = "sub"), (c = String(si));
    else if (pi >= 0) (mode = "sup"), (c = SUP_PLAIN[pi]);
    const last = out[out.length - 1];
    if (last && last.mode === mode) last.text += c;
    else out.push({ text: c, mode });
  }
  return out;
}

const FONT = '"VT323", ui-monospace, monospace';

/** Draws a label centred at (cx, cy), shrunk to fit maxW. */
export function drawLabel(
  ctx: CanvasRenderingContext2D, label: string, cx: number, cy: number, maxW: number, maxSize: number, fill: string, outline: string | null,
) {
  if (!label) return;
  const rs = runs(label);
  const widthAt = (s: number) =>
    rs.reduce((w, r) => {
      ctx.font = `${r.mode === "n" ? s : s * 0.65}px ${FONT}`;
      return w + ctx.measureText(r.text).width;
    }, 0);
  let s = maxSize;
  const w0 = widthAt(s);
  if (w0 > maxW) s = Math.max(6, (s * maxW) / w0);
  const w = widthAt(s);
  let x = cx - w / 2;
  ctx.textBaseline = "middle";
  ctx.textAlign = "left";
  for (const r of rs) {
    const size = r.mode === "n" ? s : s * 0.65;
    const dy = r.mode === "sub" ? s * 0.22 : r.mode === "sup" ? -s * 0.28 : 0;
    ctx.font = `${size}px ${FONT}`;
    if (outline) {
      ctx.lineJoin = "round";
      ctx.lineWidth = Math.max(2, s / 5);
      ctx.strokeStyle = outline;
      ctx.strokeText(r.text, x, cy + dy);
    }
    ctx.fillStyle = fill;
    ctx.fillText(r.text, x, cy + dy);
    x += ctx.measureText(r.text).width;
  }
}

/* ------------------------------------------------------------------ pixel helpers */

/** Draws a 12×12 pixel mask: chars map to colours; '.' is transparent. */
function pixels(ctx: CanvasRenderingContext2D, x0: number, y0: number, size: number, rows: string[], pal: Record<string, string>) {
  const n = rows.length;
  const u = size / n;
  for (let j = 0; j < n; j++) {
    const row = rows[j];
    for (let i = 0; i < row.length; i++) {
      const ch = row[i];
      if (ch === "." || !pal[ch]) continue;
      // merge runs of the same colour into one rect (fewer seams)
      let k = i;
      while (k + 1 < row.length && row[k + 1] === ch) k++;
      const xa = Math.round(x0 + i * u);
      const xb = Math.round(x0 + (k + 1) * u);
      const ya = Math.round(y0 + j * u);
      const yb = Math.round(y0 + (j + 1) * u);
      ctx.fillStyle = pal[ch];
      ctx.fillRect(xa, ya, xb - xa, yb - ya);
      i = k;
    }
  }
}

/** Germ body masks (12×12): b body, o outline, l highlight. Eyes are drawn on top. */
function germMask(kind: number): string[] {
  const N = 12;
  const grid: string[][] = Array.from({ length: N }, () => Array(N).fill("."));
  const inBody = (i: number, j: number): boolean => {
    const cx = 5.5;
    const cy = 6.5;
    const circle = (i - cx) ** 2 + (j - cy) ** 2 <= 5.2 ** 2;
    switch (kind % 4) {
      case 0: // Blobby: round with little feet
        return circle || (j === 11 && (i === 3 || i === 8));
      case 1: // Spikle: spikes on top
        return circle || ((j === 0 || j === 1) && (i === 2 || i === 9)) || (j <= 1 && (i === 5 || i === 6));
      case 2: // Boxo: squarish with an antenna
        return (i >= 1 && i <= 10 && j >= 2 && j <= 11 && !((i === 1 || i === 10) && (j === 2 || j === 11))) || (i === 5 && j <= 1) || (i === 6 && j === 0);
      default: // Starlo: round with two pointy ears
        return circle || (j <= 2 && (i === 1 || i === 10)) || (j === 1 && (i === 2 || i === 9));
    }
  };
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) if (inBody(i, j)) grid[j][i] = "b";
  // outline: body cells touching the outside
  for (let j = 0; j < N; j++)
    for (let i = 0; i < N; i++) {
      if (grid[j][i] !== "b") continue;
      const out = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([di, dj]) => {
        const a = i + di;
        const b = j + dj;
        return a < 0 || b < 0 || a >= N || b >= N || !inBody(a, b);
      });
      if (out) grid[j][i] = "o";
    }
  // highlight
  for (const [i, j] of [[3, 3], [4, 3], [3, 4]]) if (grid[j][i] === "b") grid[j][i] = "l";
  return grid.map((r) => r.join(""));
}

const MASKS = [0, 1, 2, 3].map(germMask);

function shapePath(ctx: CanvasRenderingContext2D, shape: ShapeId, cx: number, cy: number, r: number) {
  ctx.beginPath();
  if (shape === "circle") ctx.arc(cx, cy, r, 0, Math.PI * 2);
  else if (shape === "square") ctx.rect(cx - r * 0.85, cy - r * 0.85, r * 1.7, r * 1.7);
  else if (shape === "triangle") {
    ctx.moveTo(cx, cy - r);
    ctx.lineTo(cx + r, cy + r * 0.8);
    ctx.lineTo(cx - r, cy + r * 0.8);
    ctx.closePath();
  } else {
    for (let k = 0; k < 10; k++) {
      const a = -Math.PI / 2 + (k * Math.PI) / 5;
      const rr = k % 2 ? r * 0.45 : r;
      const x = cx + Math.cos(a) * rr;
      const y = cy + Math.sin(a) * rr;
      if (k) ctx.lineTo(x, y);
      else ctx.moveTo(x, y);
    }
    ctx.closePath();
  }
}

/* ------------------------------------------------------------------ tiles */

export function drawGerm(ctx: CanvasRenderingContext2D, set: LevelSet, tok: Token, x: number, y: number, s: number, t: number, id: number) {
  const k = tok.kind;
  const bob = Math.sin(t / 260 + id * 1.7) > 0.3 ? Math.max(1, Math.round(s / 16)) : 0;
  const pal = { b: KIND_COLORS[k], o: KIND_DARK[k], l: KIND_LIGHT[k] };
  pixels(ctx, x, y - bob, s, MASKS[k], pal);
  const u = s / 12;
  // eyes (blink now and then)
  const blink = (Math.floor(t / 90) + id * 7) % 47 === 0;
  const ey = y - bob + u * 4;
  for (const ex of [3.2, 6.8]) {
    ctx.fillStyle = "#fff";
    ctx.fillRect(Math.round(x + ex * u), Math.round(ey), Math.round(2 * u), Math.round((blink ? 0.6 : 2) * u));
    if (!blink) {
      ctx.fillStyle = INK;
      ctx.fillRect(Math.round(x + (ex + 1) * u), Math.round(ey + u), Math.max(1, Math.round(u)), Math.max(1, Math.round(u)));
    }
  }
  const kd = set.kinds[k];
  if (set.id === "shapes" || set.id === "bonds") {
    // the kind's shape as a badge on the belly
    ctx.fillStyle = "#fff";
    shapePath(ctx, kd.shape ?? "circle", x + s / 2, y - bob + s * 0.7, s * 0.2);
    ctx.fill();
    ctx.lineWidth = Math.max(1, s / 22);
    ctx.strokeStyle = KIND_DARK[k];
    ctx.stroke();
    if (tok.num !== undefined) drawLabel(ctx, String(tok.num), x + s / 2, y - bob + s * 0.71, s * 0.4, s * 0.42, INK, null);
    return;
  }
  drawLabel(ctx, tok.label, x + s / 2, y - bob + s * 0.7, s * 0.94, s * 0.6, "#fff", INK);
}

/** One capsule half. `link` is where its partner is (the rounded end is on the other side). */
export function drawHalf(
  ctx: CanvasRenderingContext2D, set: LevelSet, tok: Token, x: number, y: number, s: number, link: Link, glass: boolean, flash = false,
) {
  const k = tok.kind;
  const fill = flash ? "#ffffff" : glass ? GLASS : KIND_COLORS[k];
  const dark = glass ? GLASS_DARK : KIND_DARK[k];
  const m = Math.max(1, Math.round(s * 0.06));
  const r = Math.round(s * 0.42);
  const x0 = x + m;
  const y0 = y + m;
  const w = s - 2 * m;
  const h = s - 2 * m;
  // corner radii: round the ends away from the partner
  const rad = { tl: r, tr: r, br: r, bl: r };
  if (link === "R") (rad.tr = 2), (rad.br = 2);
  if (link === "L") (rad.tl = 2), (rad.bl = 2);
  if (link === "U") (rad.tl = 2), (rad.tr = 2);
  if (link === "D") (rad.bl = 2), (rad.br = 2);
  const path = () => {
    ctx.beginPath();
    ctx.moveTo(x0 + rad.tl, y0);
    ctx.lineTo(x0 + w - rad.tr, y0);
    ctx.quadraticCurveTo(x0 + w, y0, x0 + w, y0 + rad.tr);
    ctx.lineTo(x0 + w, y0 + h - rad.br);
    ctx.quadraticCurveTo(x0 + w, y0 + h, x0 + w - rad.br, y0 + h);
    ctx.lineTo(x0 + rad.bl, y0 + h);
    ctx.quadraticCurveTo(x0, y0 + h, x0, y0 + h - rad.bl);
    ctx.lineTo(x0, y0 + rad.tl);
    ctx.quadraticCurveTo(x0, y0, x0 + rad.tl, y0);
    ctx.closePath();
  };
  path();
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.lineWidth = Math.max(1.5, s / 14);
  ctx.strokeStyle = dark;
  ctx.stroke();
  // shine
  ctx.fillStyle = "rgba(255,255,255,0.55)";
  ctx.fillRect(Math.round(x0 + w * 0.18), Math.round(y0 + h * 0.14), Math.max(1, Math.round(w * 0.22)), Math.max(1, Math.round(s / 14)));
  if (set.id === "shapes" || set.id === "bonds") {
    const kd = set.kinds[k];
    ctx.fillStyle = glass ? KIND_COLORS[k] : "#fff";
    shapePath(ctx, kd.shape ?? "circle", x + s / 2, y + s / 2, s * (tok.num !== undefined ? 0.3 : 0.26));
    ctx.fill();
    ctx.lineWidth = Math.max(1, s / 22);
    ctx.strokeStyle = dark;
    ctx.stroke();
    if (tok.num !== undefined) drawLabel(ctx, String(tok.num), x + s / 2, y + s * 0.53, s * 0.5, s * 0.5, INK, null);
    return;
  }
  if (glass) drawLabel(ctx, tok.label, x + s / 2, y + s / 2, s * 0.9, s * 0.64, INK, null);
  else drawLabel(ctx, tok.label, x + s / 2, y + s / 2, s * 0.9, s * 0.64, "#fff", INK);
}

/* ------------------------------------------------------------------ the bottle */

export function drawBottle(ctx: CanvasRenderingContext2D, game: LabGame, o: DrawOpts) {
  const { cell } = o;
  const { pad, neck, w, h } = bottleMetrics(cell);
  ctx.clearRect(0, 0, w, h);
  const gx = pad;
  const gy = neck;
  // glass bottle: neck over columns 2–5, shoulders, body
  ctx.fillStyle = "#1a2160";
  ctx.fillRect(gx + 2 * cell - pad, 0, 4 * cell + pad * 2, neck + 2);
  ctx.fillRect(0, neck - pad, w, h - neck + pad);
  ctx.fillStyle = "#070a24";
  ctx.fillRect(gx + 2 * cell, 0, 4 * cell, neck);
  ctx.fillRect(gx, gy, COLS * cell, ROWS * cell);
  // glass shine stripes
  ctx.fillStyle = "rgba(150,180,255,0.18)";
  ctx.fillRect(Math.round(pad * 0.3), neck, Math.max(2, Math.round(pad * 0.35)), ROWS * cell);
  // lab fluid tint + floor gradient
  const grad = ctx.createLinearGradient(0, gy, 0, gy + ROWS * cell);
  grad.addColorStop(0, "rgba(40,60,160,0.05)");
  grad.addColorStop(1, "rgba(60,200,255,0.12)");
  ctx.fillStyle = grad;
  ctx.fillRect(gx, gy, COLS * cell, ROWS * cell);
  // grid dots
  ctx.fillStyle = "rgba(110,160,255,0.16)";
  for (let r = 1; r < ROWS; r++) for (let c = 1; c < COLS; c++) ctx.fillRect(gx + c * cell - 1, gy + r * cell - 1, 2, 2);
  // bubbles
  ctx.fillStyle = "rgba(160,220,255,0.25)";
  for (let i = 0; i < 6; i++) {
    const period = 5200 + i * 900;
    const p = ((o.t + i * 1700) % period) / period;
    const bx = gx + ((i * 37) % COLS) * cell + cell / 2 + Math.sin(o.t / 400 + i) * cell * 0.15;
    const by = gy + ROWS * cell * (1 - p);
    const br = Math.max(1.5, cell * 0.08);
    ctx.fillRect(Math.round(bx), Math.round(by), Math.round(br), Math.round(br));
  }

  const set = game.set;
  const flashing = new Set<string>();
  for (const g of game.flashing) for (const [r, c] of g.cells) flashing.add(`${r},${c}`);
  const flashOn = Math.floor(o.t / 70) % 2 === 0;

  // landing ghost
  if (o.ghost && game.piece && game.phase === "play") {
    const d = game.bottle.dropPos(game.piece);
    if (d.r !== game.piece.r) {
      ctx.strokeStyle = "rgba(200,215,255,0.35)";
      ctx.setLineDash([3, 3]);
      ctx.lineWidth = 1.5;
      for (const [r, c] of pieceCells(d)) ctx.strokeRect(gx + c * cell + 2.5, gy + r * cell + 2.5, cell - 5, cell - 5);
      ctx.setLineDash([]);
    }
  }

  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++) {
      const t: Tile | null = game.bottle.at(r, c);
      if (!t) continue;
      const x = gx + c * cell;
      const y = gy + r * cell;
      const fl = flashing.has(`${r},${c}`);
      if (fl && flashOn) {
        ctx.fillStyle = "rgba(255,255,255,0.85)";
        ctx.fillRect(x + 1, y + 1, cell - 2, cell - 2);
        continue;
      }
      if (t.germ) drawGerm(ctx, set, t.tok, x, y, cell, o.t, t.id);
      else drawHalf(ctx, set, t.tok, x, y, cell, t.link, false, false);
    }

  if (game.piece) drawPiece(ctx, set, game.piece, gx, gy, cell, !set.colored && !o.hint);

  // popups float up
  for (const p of o.popups) {
    const age = (o.t - p.t0) / 1400;
    if (age < 0 || age > 1) continue;
    const x = gx + (p.c + 0.5) * cell;
    const y = gy + (p.r + 0.5) * cell - age * cell * 2.2;
    ctx.globalAlpha = 1 - age * age;
    drawLabel(ctx, p.text, Math.min(Math.max(x, gx + cell * 2), gx + COLS * cell - cell * 2), y, cell * 4, cell * 0.85, p.color, INK);
    ctx.globalAlpha = 1;
  }
}

export function drawPiece(ctx: CanvasRenderingContext2D, set: LevelSet, p: Piece, gx: number, gy: number, cell: number, glass: boolean) {
  const [[ra, ca], [rb, cb]] = pieceCells(p);
  const la: Link = p.vertical ? "U" : "R";
  const lb: Link = p.vertical ? "D" : "L";
  drawHalf(ctx, set, p.a, gx + ca * cell, gy + ra * cell, cell, la, glass);
  drawHalf(ctx, set, p.b, gx + cb * cell, gy + rb * cell, cell, lb, glass);
}

/** The NEXT capsule (horizontal), in a w × h canvas. */
export function drawNext(ctx: CanvasRenderingContext2D, set: LevelSet, next: [Token, Token], w: number, h: number, glass: boolean) {
  ctx.clearRect(0, 0, w, h);
  const s = Math.min(h - 4, (w - 4) / 2);
  const x = (w - 2 * s) / 2;
  const y = (h - s) / 2;
  drawHalf(ctx, set, next[0], x, y, s, "R", glass);
  drawHalf(ctx, set, next[1], x + s, y, s, "L", glass);
}

/** A germ for the germ guide (legend). */
export function drawLegendGerm(ctx: CanvasRenderingContext2D, set: LevelSet, kind: number, s: number) {
  ctx.clearRect(0, 0, s, s);
  const kd = set.kinds[kind];
  const tok: Token = { kind, key: kd.id, label: "", say: "" };
  drawGerm(ctx, set, tok, 0, 0, s, 0, kind);
}

/* ------------------------------------------------------------------ Professor Fizzwick */

const FIZZ_PAL: Record<string, string> = {
  h: "#c86bff", H: "#8a3fd1", s: "#f2b98a", S: "#cf8e62", g: "#ffd23f", l: "#7fe7ff", w: "#ffffff", k: "#1a1a2e",
  m: "#b03a48", c: "#f2f4ff", C: "#aab3dc", t: "#e3262f", f: "#d6ecff", F: "#5fe08a", p: "#2456e8", b: "#1a1a2e",
};

/** 16 × 24 pixel map. Professor Fizzwick: puffy purple hair, round goggles, lab coat, bubbling flask. */
const FIZZ = [
  "....h..hh..h....",
  "...hhhhhhhhhh...",
  "..hhhhhhhhhhhh..",
  ".hhhHhhhhhhHhhh.",
  ".hhHhhhhhhhhhHh.",
  ".hhsssssssssshh.",
  "..sggggssggggs..",
  "..sglwgssglwgs..",
  "..sgllggggllgs..",
  "..sggggssggggs..",
  "..ssssSSSSssss..",
  "...ssskmmkssss..",
  "....ssmmmmss....",
  ".....ssssss.....",
  "...cccctttcccc..",
  "..ccccCtttCcccc.",
  ".cccccCCtCCccccs",
  ".ccsccccccccccss",
  ".cssccccccccccc.",
  "..s.ccccccccc...",
  "....ccccCcccc...",
  "....pppp.pppp...",
  "....pppp.pppp...",
  "...bbbbb.bbbbb..",
];

const FLASK = [
  "..ff..",
  "..ff..",
  ".fFFf.",
  "fFFFFf",
  "fFFFFf",
  ".ffff.",
];

export type Mood = "idle" | "cheer" | "worried";

export function drawMascot(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number, mood: Mood, t: number) {
  const u = scale;
  const bounce = mood === "cheer" ? (Math.floor(t / 160) % 2) * u : 0;
  const rows = FIZZ.map((r, j) => {
    if (mood === "worried" && j === 11) return "...sssmmmssss..";
    if (mood === "worried" && j === 12) return "....smssssms....";
    return r;
  });
  for (let j = 0; j < rows.length; j++)
    for (let i = 0; i < rows[j].length; i++) {
      const ch = rows[j][i];
      if (ch === "." || !FIZZ_PAL[ch]) continue;
      ctx.fillStyle = FIZZ_PAL[ch];
      ctx.fillRect(Math.round(x + i * u), Math.round(y + j * u - bounce), Math.ceil(u), Math.ceil(u));
    }
  // the flask in the right hand, raised when cheering
  const fx = x + 13 * u;
  const fy = y + (mood === "cheer" ? 9 : 13) * u - bounce;
  for (let j = 0; j < FLASK.length; j++)
    for (let i = 0; i < FLASK[j].length; i++) {
      const ch = FLASK[j][i];
      if (ch === ".") continue;
      ctx.fillStyle = FIZZ_PAL[ch];
      ctx.fillRect(Math.round(fx + i * u), Math.round(fy + j * u), Math.ceil(u), Math.ceil(u));
    }
  // bubbles from the flask
  ctx.fillStyle = "#c4ffd9";
  for (let i = 0; i < 3; i++) {
    const p = ((t / 900 + i / 3) % 1);
    ctx.fillRect(Math.round(fx + (2 + Math.sin(t / 300 + i) * 1.5) * u), Math.round(fy - p * 6 * u), Math.ceil(u), Math.ceil(u));
  }
}

export const MASCOT_W = 20;
export const MASCOT_H = 25;
