/*
 * Screen geometry (320×200 logical pixels) and the answer labels drawn beside the four
 * corner pellets. Labels live in the side panels next to their pellet: A and C on the left,
 * B and D on the right. Pure (no DOM) so the checker can prove every label fits.
 */
import { LINE_H, measure } from "./font";
import type { Maze } from "./maze";

export const W = 320;
export const H = 200;
export const TILE = 8;

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Geometry {
  ox: number;
  oy: number;
  mazeW: number;
  mazeH: number;
  panelW: number;
}

export function geometry(m: Maze): Geometry {
  const mazeW = m.cols * TILE;
  const mazeH = m.rows * TILE;
  return { ox: Math.floor((W - mazeW) / 2), oy: Math.floor((H - mazeH) / 2), mazeW, mazeH, panelW: Math.floor((W - mazeW) / 2) };
}

/** Pixel centre of a tile. */
export function tileCenter(g: Geometry, x: number, y: number): { x: number; y: number } {
  return { x: g.ox + x * TILE + TILE / 2, y: g.oy + y * TILE + TILE / 2 };
}

/* ------------------------------------------------------------ label boxes */

export const BADGE = 12;
export const PAD = 2;

/** Width available for label text inside a box (text is inset 1px from the box edge). */
export function textWidthFor(g: Geometry): number {
  return g.panelW - 4;
}

/** Top edge of a top label box, or bottom edge of a bottom one. */
function anchor(g: Geometry, pelletY: number, i: number): number {
  const py = g.oy + pelletY * TILE;
  return i < 2 ? Math.max(1, py - 10) : Math.min(H - 1, py + TILE + 10);
}

/** Most text lines pellet i's label box can hold at `scale` without leaving its half. */
export function maxLinesFor(g: Geometry, pelletY: number, i: number, scale: number): number {
  const a = anchor(g, pelletY, i);
  const room = i < 2 ? H / 2 - 2 - a : a - (H / 2 + 2);
  return Math.floor((room - (PAD + BADGE + PAD + PAD)) / (LINE_H * scale));
}

export interface LabelLayout {
  scale: 1 | 2;
  lines: string[];
  /** True if a word had to be split across lines. */
  broken: boolean;
}

const EMOJI_RE = /\p{Extended_Pictographic}/u;

/**
 * Word-wraps `text` into lines no wider than `maxW` at `scale`. Words that don't fit are
 * split only when `allowBreak` is set (or the word is a run of counting icons).
 */
export function wrap(text: string, maxW: number, scale: number, allowBreak: boolean): { lines: string[]; broken: boolean } | null {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let cur = "";
  let broken = false;
  for (const word of words) {
    const tryLine = cur ? `${cur} ${word}` : word;
    if (measure(tryLine, scale) <= maxW) {
      cur = tryLine;
      continue;
    }
    if (cur) lines.push(cur);
    cur = "";
    if (measure(word, scale) <= maxW) {
      cur = word;
      continue;
    }
    const icons = EMOJI_RE.test(word);
    if (!allowBreak && !icons) return null;
    if (!icons) broken = true;
    let part = "";
    for (const ch of word) {
      if (measure(part + ch, scale) > maxW && part) {
        lines.push(part);
        part = "";
      }
      part += ch;
    }
    cur = part;
  }
  if (cur) lines.push(cur);
  return { lines, broken };
}

/**
 * The label layout for an answer: the grade's preferred size if it fits without splitting
 * words, else small text, splitting a word only as a last resort.
 */
export function labelLayout(text: string, g: Geometry, pelletY: number, i: number, preferred: 1 | 2): LabelLayout {
  const maxW = textWidthFor(g);
  const tries: [1 | 2, boolean][] = preferred === 2 ? [[2, false], [1, false], [1, true]] : [[1, false], [1, true]];
  for (const [scale, allowBreak] of tries) {
    const r = wrap(text, maxW, scale, allowBreak);
    if (r && r.lines.length <= maxLinesFor(g, pelletY, i, scale)) return { scale, lines: r.lines, broken: r.broken };
  }
  const r = wrap(text, maxW, 1, true)!;
  return { scale: 1, lines: r.lines, broken: true };
}

/** Where pellet i's label box goes (top pellets hang down, bottom pellets stand up). */
export function labelBox(g: Geometry, pelletY: number, i: number, lay: LabelLayout): Rect {
  const w = g.panelW - 2;
  const h = PAD + BADGE + PAD + lay.lines.length * LINE_H * lay.scale + PAD;
  const x = i % 2 === 0 ? 1 : W - g.panelW + 1;
  const a = anchor(g, pelletY, i);
  return { x, y: i < 2 ? a : a - h, w, h };
}

/** True when a label box sits inside its side panel and its half of the screen. */
export function boxFits(g: Geometry, r: Rect, i: number): boolean {
  const inPanel = i % 2 === 0 ? r.x >= 0 && r.x + r.w <= g.ox : r.x >= g.ox + g.mazeW && r.x + r.w <= W;
  const inHalf = i < 2 ? r.y >= 0 && r.y + r.h <= H / 2 : r.y >= H / 2 && r.y + r.h <= H;
  return inPanel && inHalf;
}
