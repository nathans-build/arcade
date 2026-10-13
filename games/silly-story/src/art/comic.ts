/*
 * "Save as picture": the finished comic (scene + story text) drawn on one canvas and handed to the
 * browser as a PNG download. Everything happens on the device; nothing is uploaded.
 * Long stories get a smaller font and a taller picture, so every word fits; paragraphs keep a gap.
 */
import type { FilledPiece } from "../story/template";
import { H, W } from "./bgs";
import { drawScene, type Scene } from "./scene";

const PAD = 24;
export const COMIC_W = W * 2 + PAD * 2;
export const COMIC_TEXT_W = COMIC_W - PAD * 2;
const TITLE_CHARS = 34;
const TITLE_LINE = 24;
const FOOT_H = 40;

export interface Run {
  text: string;
  mine: boolean;
}

export interface ComicLayout {
  /** Story text size in px (smaller for long stories). */
  fontPx: number;
  lineH: number;
  titleLines: string[];
  headH: number;
  /** Lines of runs; an empty line is a paragraph gap. */
  lines: Run[][];
  textTop: number;
  height: number;
}

/** Measures text width at a font size (canvas in the browser; an estimate in tests). */
export type Measure = (text: string, fontPx: number) => number;

function wrap(pieces: FilledPiece[], maxW: number, fontPx: number, measure: Measure): Run[][] {
  // Split into words, keeping which ones are the player's.
  const words: Run[] = [];
  for (const p of pieces) {
    const parts = p.text.split(/(\s+)/);
    for (const part of parts) if (part) words.push({ text: part, mine: p.blank >= 0 });
  }
  const lines: Run[][] = [[]];
  let lineW = 0;
  const dropTrailingSpace = () => {
    const cur = lines[lines.length - 1];
    if (cur.length && /^\s+$/.test(cur[cur.length - 1].text)) cur.pop();
  };
  for (const w of words) {
    if (/^\s+$/.test(w.text)) {
      const breaks = (w.text.match(/\n/g) ?? []).length;
      if (breaks) {
        dropTrailingSpace();
        // One newline starts a new line; a blank line between paragraphs leaves an empty line.
        for (let k = 0; k < Math.min(breaks, 2); k++) lines.push([]);
        lineW = 0;
        continue;
      }
      if (lineW === 0) continue;
    }
    const ww = measure(w.text, fontPx);
    if (lineW + ww > maxW && !/^\s+$/.test(w.text) && lineW > 0) {
      dropTrailingSpace();
      lines.push([]);
      lineW = 0;
    }
    lines[lines.length - 1].push(w);
    lineW += ww;
  }
  dropTrailingSpace();
  while (lines.length > 1 && lines[lines.length - 1].length === 0) lines.pop();
  return lines;
}

function wrapTitle(title: string): string[] {
  const out: string[] = [];
  let cur = "";
  for (const word of title.toUpperCase().split(/\s+/).filter(Boolean)) {
    const next = cur ? `${cur} ${word}` : word;
    if (next.length > TITLE_CHARS && cur) {
      out.push(cur);
      cur = word.slice(0, TITLE_CHARS);
    } else cur = next.slice(0, TITLE_CHARS);
  }
  if (cur) out.push(cur);
  return out.slice(0, 2);
}

/** Where everything goes on the comic: the font size, the wrapped lines and the picture's height. */
export function layoutComic(pieces: FilledPiece[], title: string, measure: Measure): ComicLayout {
  const chars = pieces.reduce((n, p) => n + p.text.length, 0);
  // Long stories: smaller text so the picture doesn't get enormous (still easy to read).
  const fontPx = chars > 1100 ? 21 : chars > 650 ? 23 : 26;
  const lineH = Math.round(fontPx * 1.08);
  const titleLines = wrapTitle(title);
  const headH = 32 + titleLines.length * TITLE_LINE;
  const lines = wrap(pieces, COMIC_TEXT_W, fontPx, measure);
  const textTop = headH + H * 2 + PAD;
  const height = textTop + lines.length * lineH + PAD + FOOT_H;
  return { fontPx, lineH, titleLines, headH, lines, textTop, height };
}

const fontFor = (px: number) => `${px}px "VT323", ui-monospace, monospace`;

export function renderComic(scene: Scene, title: string, pieces: FilledPiece[], t = 1.2): { canvas: HTMLCanvasElement; layout: ComicLayout } {
  const sceneCv = document.createElement("canvas");
  sceneCv.width = W;
  sceneCv.height = H;
  drawScene(sceneCv.getContext("2d")!, scene, t);

  const m = document.createElement("canvas").getContext("2d")!;
  const measure: Measure = (text, px) => {
    m.font = fontFor(px);
    return m.measureText(text).width;
  };
  const L = layoutComic(pieces, title, measure);

  const cv = document.createElement("canvas");
  cv.width = COMIC_W;
  cv.height = L.height;
  const c = cv.getContext("2d")!;
  c.fillStyle = "#1a0b2e";
  c.fillRect(0, 0, COMIC_W, L.height);
  c.fillStyle = "#e3262f";
  c.fillRect(0, 0, COMIC_W, 6);
  c.fillStyle = "#2456e8";
  c.fillRect(0, 6, COMIC_W, 3);
  c.font = '16px "Press Start 2P", ui-monospace, monospace';
  c.fillStyle = "#ffd23f";
  c.textBaseline = "top";
  L.titleLines.forEach((line, i) => c.fillText(line, PAD, 22 + i * TITLE_LINE));
  c.imageSmoothingEnabled = false;
  c.fillStyle = "#000";
  c.fillRect(PAD - 4, L.headH - 4, W * 2 + 8, H * 2 + 8);
  c.drawImage(sceneCv, PAD, L.headH, W * 2, H * 2);

  c.font = fontFor(L.fontPx);
  let y = L.textTop;
  for (const line of L.lines) {
    let x = PAD;
    for (const run of line) {
      const w = c.measureText(run.text).width;
      if (run.mine && run.text.trim()) {
        c.fillStyle = "#ffd23f";
        c.fillRect(x - 2, y - 1, w + 4, L.lineH - 2);
        c.fillStyle = "#1a0b2e";
      } else c.fillStyle = "#f2f4ff";
      c.fillText(run.text, x, y);
      x += w;
    }
    y += L.lineH;
  }
  c.font = '10px "Press Start 2P", ui-monospace, monospace';
  c.fillStyle = "#8a7ab8";
  c.fillText("MADE IN SILLY STORY STUDIO · SPIDERBEN10'S ARCADE", PAD, L.height - FOOT_H + 12);
  return { canvas: cv, layout: L };
}

/** Turns the comic into a PNG file download (data URL; no upload). */
export function downloadComic(scene: Scene, title: string, pieces: FilledPiece[]) {
  const { canvas: cv, layout } = renderComic(scene, title, pieces);
  const url = cv.toDataURL("image/png");
  const a = document.createElement("a");
  a.href = url;
  a.download = `${title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "silly-story"}.png`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  return { url, width: cv.width, height: cv.height, fontPx: layout.fontPx, lineH: layout.lineH, lines: layout.lines.length, textTop: layout.textTop };
}
