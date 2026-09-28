/* Paints the ground cross-section: sky, textured rock layers, the dike and dug tunnels. */
import { measure } from "./font";
import type { Rock } from "./geology";
import { COLS, GROUND_TOP, ROWS, TILE, idx, type LevelData } from "./levels";

export const FIELD_W = COLS * TILE; // 260
export const FIELD_H = ROWS * TILE; // 200

function hash(a: number, b: number, s = 0): number {
  const v = Math.sin(a * 127.1 + b * 311.7 + s * 74.7) * 43758.5453;
  return v - Math.floor(v);
}

function hex(c: string): [number, number, number] {
  const n = parseInt(c.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function shade(c: string, f: number): string {
  const [r, g, b] = hex(c);
  const m = (v: number) => Math.max(0, Math.min(255, Math.round(v * f)));
  return `rgb(${m(r)},${m(g)},${m(b)})`;
}

/** Tunnel colour for a rock: its dark colour, much darker. */
export function tunnelColor(rock: Rock): string {
  return rock.liquid ? shade(rock.colors[1], 0.55) : shade(rock.colors[1], 0.32);
}

/** Paints `rock`'s texture into the pixel rectangle (x, y, w, h). */
export function paintRock(g: CanvasRenderingContext2D, rock: Rock, x0: number, y0: number, w: number, h: number, seed: number) {
  const [base, dark, light] = rock.colors;
  g.fillStyle = base;
  g.fillRect(x0, y0, w, h);
  const px = (x: number, y: number, col: string, pw = 1, ph = 1) => {
    if (x < x0 || y < y0 || x >= x0 + w || y >= y0 + h) return;
    g.fillStyle = col;
    g.fillRect(x, y, Math.min(pw, x0 + w - x), Math.min(ph, y0 + h - y));
  };
  const each = (fn: (x: number, y: number, r: number) => void) => {
    for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) fn(x, y, hash(x, y, seed));
  };
  switch (rock.tex) {
    case "roots":
      each((x, y, r) => {
        if (r < 0.1) px(x, y, dark);
        else if (r > 0.97) px(x, y, light);
      });
      for (let k = 0; k < (w * h) / 60; k++) {
        const x = x0 + Math.floor(hash(k, 1, seed) * w);
        let y = y0 + Math.floor(hash(k, 2, seed) * h);
        let xx = x;
        for (let s = 0; s < 5; s++) {
          px(xx, y, "#c9a877");
          y++;
          if (hash(k, s, seed + 3) > 0.6) xx += hash(k, s, seed + 9) > 0.5 ? 1 : -1;
        }
      }
      break;
    case "clods":
    case "chunks":
      each((x, y, r) => {
        if (r < 0.06) px(x, y, dark, 2, 2);
        else if (r > 0.95) px(x, y, light, rock.tex === "chunks" ? 3 : 2, 2);
      });
      break;
    case "grains":
    case "oil":
      each((x, y, r) => {
        if (r < 0.18) px(x, y, dark);
        else if (r > 0.8) px(x, y, light);
      });
      if (rock.tex === "oil") {
        for (let k = 0; k < (w * h) / 40; k++) {
          const x = x0 + Math.floor(hash(k, 5, seed) * w);
          const y = y0 + Math.floor(hash(k, 6, seed) * h);
          px(x, y, "#1a120a", 3, 2);
        }
      }
      break;
    case "smooth":
    case "fine":
      each((x, y, r) => {
        if (r < 0.05) px(x, y, dark);
        else if (r > 0.97) px(x, y, light);
      });
      break;
    case "pebbles":
      each((x, y, r) => {
        if (r < 0.1) px(x, y, dark);
      });
      for (let k = 0; k < (w * h) / 26; k++) {
        const cx = x0 + Math.floor(hash(k, 7, seed) * w);
        const cy = y0 + Math.floor(hash(k, 8, seed) * h);
        const col = hash(k, 9, seed) > 0.5 ? light : shade(base, 1.2);
        px(cx - 1, cy, dark, 4, 3);
        px(cx, cy - 1, dark, 2, 5);
        px(cx, cy, col, 2, 2);
        px(cx - 1 + 1, cy + 1, col, 1, 1);
      }
      break;
    case "shells":
      each((x, y, r) => {
        if (r < 0.07) px(x, y, dark);
        else if (r > 0.96) px(x, y, light);
      });
      for (let k = 0; k < (w * h) / 45; k++) {
        const x = x0 + Math.floor(hash(k, 11, seed) * w);
        const y = y0 + Math.floor(hash(k, 12, seed) * h);
        px(x, y, light);
        px(x + 1, y + 1, light);
        px(x + 2, y + 1, light);
        px(x + 3, y, light);
      }
      break;
    case "layers":
      for (let y = y0; y < y0 + h; y++) {
        const line = (y - y0) % 3 === 0;
        for (let x = x0; x < x0 + w; x++) {
          const r = hash(x, y, seed);
          if (line && r > 0.1) px(x, y, dark);
          else if (!line && r > 0.94) px(x, y, light);
        }
      }
      break;
    case "glints":
      each((x, y, r) => {
        if (r > 0.975) px(x, y, light);
        else if (r < 0.2) px(x, y, dark);
      });
      break;
    case "crystals":
      each((x, y, r) => {
        if (r < 0.1) px(x, y, dark, r < 0.03 ? 2 : 1, 1);
        else if (r > 0.86) px(x, y, light, r > 0.96 ? 2 : 1, r > 0.96 ? 2 : 1);
        else if (r > 0.8) px(x, y, "#f2f0ea");
      });
      break;
    case "pillows":
      each((x, y, r) => {
        if (r < 0.06) px(x, y, dark);
      });
      for (let k = 0; k < (w * h) / 55; k++) {
        const cx = x0 + Math.floor(hash(k, 13, seed) * w);
        const cy = y0 + Math.floor(hash(k, 14, seed) * h);
        for (let a = 0; a < 20; a++) {
          const t = (a / 20) * Math.PI * 2;
          px(Math.round(cx + Math.cos(t) * 5), Math.round(cy + Math.sin(t) * 3), dark);
        }
        px(cx - 2, cy - 1, light, 3, 1);
      }
      break;
    case "veins":
      each((x, y, r) => {
        if (r < 0.04) px(x, y, dark);
      });
      for (let k = 0; k < w / 14; k++) {
        let x = x0 + Math.floor(hash(k, 15, seed) * w);
        for (let y = y0; y < y0 + h; y++) {
          px(x, y, dark);
          if (hash(k, y, seed + 5) > 0.5) x += 1;
        }
      }
      break;
    case "sheen":
      each((x, y, r) => {
        if (r < 0.12) px(x, y, dark);
        else if (r > 0.9) px(x, y, light, 2, 1);
      });
      break;
    case "bands":
    case "ironbands":
      for (let y = y0; y < y0 + h; y++) {
        for (let x = x0; x < x0 + w; x++) {
          const wave = Math.sin(x / (rock.tex === "bands" ? 7 : 11) + seed) * 1.5;
          const period = rock.tex === "bands" ? 5 : 3;
          const band = Math.floor((y + wave) / period) % 2 === 0;
          const r = hash(x, y, seed);
          if (band) px(x, y, r > 0.1 ? dark : base);
          else if (r > 0.9) px(x, y, light);
        }
      }
      break;
    case "liquid":
      for (let y = y0; y < y0 + h; y++) {
        for (let x = x0; x < x0 + w; x++) {
          const v = Math.sin(x / 5 + y / 2.2 + seed) + Math.sin(x / 9 - y / 3);
          if (v > 1.3) px(x, y, light);
          else if (v < -1.3) px(x, y, dark);
        }
      }
      break;
    case "hot":
      each((x, y, r) => {
        if (r < 0.1) px(x, y, dark);
        else if (r > 0.95) px(x, y, light, 2, 1);
      });
      break;
  }
}

/** Builds the level's ground canvas: sky row, layers, dike and the tunnels already dug. */
export function paintGround(data: LevelData): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = FIELD_W;
  c.height = FIELD_H;
  const g = c.getContext("2d")!;
  g.imageSmoothingEnabled = false;

  // sky
  const skyH = GROUND_TOP * TILE;
  const grad = g.createLinearGradient(0, 0, 0, skyH);
  grad.addColorStop(0, "#3d6fe0");
  grad.addColorStop(1, "#9cc0ff");
  g.fillStyle = grad;
  g.fillRect(0, 0, FIELD_W, skyH);
  g.fillStyle = "#ffe89a";
  g.fillRect(228, 3, 8, 8);
  g.fillStyle = "#fff6d0";
  g.fillRect(230, 5, 4, 4);
  g.fillStyle = "#eef4ff";
  for (const [x, y, w] of [[30, 5, 16], [36, 3, 8], [150, 7, 18], [156, 5, 9], [196, 4, 12]]) g.fillRect(x, y, w, 3);

  // layers
  data.units.forEach((u, i) => {
    if (u.kind !== "layer") return;
    const y = u.top * TILE;
    const h = (u.bottom - u.top + 1) * TILE;
    paintRock(g, u.rock, 0, y, FIELD_W, h, i * 13 + 5);
    g.fillStyle = shade(u.rock.colors[1], 0.7);
    g.fillRect(0, y, FIELD_W, 1);
  });
  // dike (with dark chilled margins)
  for (const u of data.units) {
    if (u.kind !== "dike" || !u.cols) continue;
    const x = u.cols[0] * TILE;
    const w = (u.cols[1] - u.cols[0] + 1) * TILE;
    const y = u.top * TILE;
    paintRock(g, u.rock, x, y, w, FIELD_H - y, 99);
    g.fillStyle = "#15161a";
    g.fillRect(x, y, 1, FIELD_H - y);
    g.fillRect(x + w - 1, y, 1, FIELD_H - y);
    g.fillRect(x, y, w, 1);
  }
  // grass on soil, a bare edge otherwise
  const top = data.units[0];
  g.fillStyle = top.rock.id === "topsoil" ? "#3fae4a" : shade(top.rock.colors[2], 0.9);
  g.fillRect(0, skyH, FIELD_W, 2);
  if (top.rock.id === "topsoil") {
    g.fillStyle = "#2c8a38";
    for (let x = 0; x < FIELD_W; x += 3) g.fillRect(x + (x % 2), skyH - 1, 1, 1);
  }

  // tunnels that start dug
  for (let r = GROUND_TOP; r < ROWS; r++) {
    for (let col = 0; col < COLS; col++) if (data.dug[idx(col, r)]) digTile(g, data, col, r);
  }
  return c;
}

/** Paints a tunnel over any pixel rectangle, using each tile's own tunnel colour. */
export function digRect(g: CanvasRenderingContext2D, data: LevelData, x: number, y: number, w: number, h: number) {
  const x1 = Math.max(0, Math.floor(x)), y1 = Math.max(GROUND_TOP * TILE, Math.floor(y));
  const x2 = Math.min(FIELD_W, Math.ceil(x + w)), y2 = Math.min(FIELD_H, Math.ceil(y + h));
  if (x2 <= x1 || y2 <= y1) return;
  for (let tr = Math.floor(y1 / TILE); tr <= Math.floor((y2 - 1) / TILE); tr++) {
    for (let tc = Math.floor(x1 / TILE); tc <= Math.floor((x2 - 1) / TILE); tc++) {
      const u = data.units[data.unitAt[idx(tc, tr)]];
      if (!u) continue;
      const ax = Math.max(x1, tc * TILE), ay = Math.max(y1, tr * TILE);
      const bx = Math.min(x2, (tc + 1) * TILE), by = Math.min(y2, (tr + 1) * TILE);
      g.fillStyle = tunnelColor(u.rock);
      g.fillRect(ax, ay, bx - ax, by - ay);
    }
  }
}

export function digTile(g: CanvasRenderingContext2D, data: LevelData, col: number, row: number) {
  digRect(g, data, col * TILE, row * TILE, TILE, TILE);
}

/** Restores one tile's rock texture (after a boulder crumbles into it, for instance). */
export function fillTile(g: CanvasRenderingContext2D, data: LevelData, col: number, row: number) {
  const u = data.units[data.unitAt[idx(col, row)]];
  if (!u) return;
  paintRock(g, u.rock, col * TILE, row * TILE, TILE, TILE, u.index * 13 + 5);
}

/** Width available for a legend label. */
export const LEGEND_TEXT_W = 320 - FIELD_W - 9;

/** A unit's legend label, on one line or split over two. */
export function legendLines(label: string): string[] {
  const name = label.replace(/ \((UPPER|LOWER)\)$/, "");
  if (measure(name) <= LEGEND_TEXT_W) return [name];
  const words = name.split(" ");
  return [words[0], words.slice(1).join(" ")];
}

