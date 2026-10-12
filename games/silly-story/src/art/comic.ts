/*
 * "Save as picture": the finished comic (scene + story text) drawn on one canvas and handed to the
 * browser as a PNG download. Everything happens on the device; nothing is uploaded.
 */
import type { FilledPiece } from "../story/template";
import { H, W } from "./bgs";
import { drawScene, type Scene } from "./scene";

const PAD = 24;
const OUT_W = W * 2 + PAD * 2;

interface Run {
  text: string;
  mine: boolean;
}

function wrap(c: CanvasRenderingContext2D, pieces: FilledPiece[], maxW: number): Run[][] {
  // Split into words, keeping which ones are the player's.
  const words: Run[] = [];
  for (const p of pieces) {
    const parts = p.text.split(/(\s+)/);
    for (const part of parts) if (part) words.push({ text: part, mine: p.blank >= 0 });
  }
  const lines: Run[][] = [[]];
  let lineW = 0;
  for (const w of words) {
    if (/^\s+$/.test(w.text)) {
      if (w.text.includes("\n")) {
        lines.push([]);
        lineW = 0;
        continue;
      }
      if (lineW === 0) continue;
    }
    const ww = c.measureText(w.text).width;
    if (lineW + ww > maxW && !/^\s+$/.test(w.text) && lineW > 0) {
      // Drop trailing space.
      const cur = lines[lines.length - 1];
      if (cur.length && /^\s+$/.test(cur[cur.length - 1].text)) cur.pop();
      lines.push([]);
      lineW = 0;
    }
    lines[lines.length - 1].push(w);
    lineW += ww;
  }
  return lines;
}

export function renderComic(scene: Scene, title: string, pieces: FilledPiece[], t = 1.2): HTMLCanvasElement {
  const sceneCv = document.createElement("canvas");
  sceneCv.width = W;
  sceneCv.height = H;
  drawScene(sceneCv.getContext("2d")!, scene, t);

  const measure = document.createElement("canvas").getContext("2d")!;
  const font = '26px "VT323", ui-monospace, monospace';
  measure.font = font;
  const lines = wrap(measure, pieces, OUT_W - PAD * 2);
  const lineH = 28;
  const headH = 56;
  const footH = 40;
  const outH = headH + H * 2 + PAD + lines.length * lineH + PAD + footH;

  const cv = document.createElement("canvas");
  cv.width = OUT_W;
  cv.height = outH;
  const c = cv.getContext("2d")!;
  c.fillStyle = "#1a0b2e";
  c.fillRect(0, 0, OUT_W, outH);
  c.fillStyle = "#e3262f";
  c.fillRect(0, 0, OUT_W, 6);
  c.fillStyle = "#2456e8";
  c.fillRect(0, 6, OUT_W, 3);
  c.font = '16px "Press Start 2P", ui-monospace, monospace';
  c.fillStyle = "#ffd23f";
  c.textBaseline = "top";
  c.fillText(title.toUpperCase().slice(0, 34), PAD, 24);
  c.imageSmoothingEnabled = false;
  c.fillStyle = "#000";
  c.fillRect(PAD - 4, headH - 4, W * 2 + 8, H * 2 + 8);
  c.drawImage(sceneCv, PAD, headH, W * 2, H * 2);

  c.font = font;
  let y = headH + H * 2 + PAD;
  for (const line of lines) {
    let x = PAD;
    for (const run of line) {
      const w = c.measureText(run.text).width;
      if (run.mine && run.text.trim()) {
        c.fillStyle = "#ffd23f";
        c.fillRect(x - 2, y - 1, w + 4, lineH - 2);
        c.fillStyle = "#1a0b2e";
      } else c.fillStyle = "#f2f4ff";
      c.fillText(run.text, x, y);
      x += w;
    }
    y += lineH;
  }
  c.font = '10px "Press Start 2P", ui-monospace, monospace';
  c.fillStyle = "#8a7ab8";
  c.fillText("MADE IN SILLY STORY STUDIO · SPIDERBEN10'S ARCADE", PAD, outH - footH + 12);
  return cv;
}

/** Turns the comic into a PNG file download (data URL; no upload). */
export function downloadComic(scene: Scene, title: string, pieces: FilledPiece[]): string {
  const cv = renderComic(scene, title, pieces);
  const url = cv.toDataURL("image/png");
  const a = document.createElement("a");
  a.href = url;
  a.download = `${title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "silly-story"}.png`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  return url;
}
