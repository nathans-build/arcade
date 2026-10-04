/*
 * The 320×200 canvas: museum gallery (title, intro, report) with the arcade hero as guide,
 * the general store, the side-view travel strip with the Ledger HUD, landmark scenes and winter.
 * Everything is drawn with rectangles, code-defined sprites and the bitmap font.
 */
import type { Game } from "@/game/game";
import type { SceneId, Terrain } from "@/data/types";
import { dateOf } from "@/sim/sim";
import { FONT_H, forEachPixel, textWidth } from "./font";
import { COACH, ENGINE, HERO, HORSE, OX, WAGON, WALKER, bitmap } from "./sprites";

export const W = 320;
export const H = 200;

type Ctx = CanvasRenderingContext2D;

const hash = (n: number) => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};

export function drawText(g: Ctx, s: string, x: number, y: number, color: string, scale = 1, align: "left" | "center" | "right" = "left", shadow?: string) {
  const w = textWidth(s, scale);
  const x0 = Math.round(align === "center" ? x - w / 2 : align === "right" ? x - w : x);
  const put = (dx: number, dy: number, col: string) => {
    g.fillStyle = col;
    forEachPixel(s, (px, py) => g.fillRect(x0 + px * scale + dx, y + py * scale + dy, scale, scale));
  };
  if (shadow) put(1, 1, shadow);
  put(0, 0, color);
}

/** Word-wraps `s` to lines no wider than `maxW` pixels (at scale 1). */
export function wrap(s: string, maxW: number): string[] {
  const out: string[] = [];
  let line = "";
  for (const word of s.split(/\s+/)) {
    const next = line ? `${line} ${word}` : word;
    if (textWidth(next) > maxW && line) {
      out.push(line);
      line = word;
    } else line = next;
  }
  if (line) out.push(line);
  return out;
}

function rect(g: Ctx, x: number, y: number, w: number, h: number, c: string) {
  g.fillStyle = c;
  g.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}

function sky(g: Ctx, top: string, bottom: string, h = 120) {
  const bands = 8;
  for (let i = 0; i < bands; i++) {
    g.fillStyle = mix(top, bottom, i / (bands - 1));
    g.fillRect(0, Math.floor((i * h) / bands), W, Math.ceil(h / bands) + 1);
  }
}

function mix(a: string, b: string, t: number): string {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  return `rgb(${pa.map((v, i) => Math.round(v + (pb[i] - v) * t)).join(",")})`;
}

/** A ridge line of hills; `off` scrolls it (parallax). */
function ridge(g: Ctx, base: number, amp: number, color: string, seed: number, off = 0, step = 4) {
  g.fillStyle = color;
  for (let x = 0; x < W; x += step) {
    const u = (x + off) / 60 + seed;
    const h = amp * (0.55 + 0.3 * Math.sin(u) + 0.15 * Math.sin(u * 2.7 + seed));
    g.fillRect(x, Math.round(base - h), step, Math.round(h) + 200);
  }
}

function peaks(g: Ctx, base: number, color: string, snow: string | null, seed: number, off = 0) {
  for (let k = -1; k < 6; k++) {
    const span = 90;
    const px = ((k * span - (off % span)) + span) % (W + span) - span / 2;
    const ph = 40 + hash(seed + Math.floor((off + k * span) / span)) * 30;
    for (let y = 0; y < ph; y++) {
      const half = (y / ph) * 55;
      rect(g, px - half, base - ph + y, half * 2, 1, color);
      if (snow && y < ph * 0.25) rect(g, px - half, base - ph + y, half * 2, 1, snow);
    }
  }
}

function pine(g: Ctx, x: number, y: number, s: number, c = "#1d4a2a") {
  for (let i = 0; i < 4 * s; i++) rect(g, x - i / 2, y - 6 * s + i * 1.5, i + 1, 2, c);
  rect(g, x, y, 1, 2, "#3a2414");
}

function roundTree(g: Ctx, x: number, y: number, c = "#2d6a34") {
  rect(g, x - 4, y - 9, 9, 7, c);
  rect(g, x - 3, y - 11, 7, 2, c);
  rect(g, x, y - 2, 1, 3, "#4a2c14");
}

function building(g: Ctx, x: number, y: number, w: number, h: number, wall: string, roof: string | null, win = "#ffd23f", rows = 2) {
  rect(g, x, y - h, w, h, wall);
  if (roof) for (let i = 0; i < 6; i++) rect(g, x - 2 + i, y - h - 6 + i, w + 4 - 2 * i, 1, roof);
  const cols = Math.max(1, Math.floor((w - 4) / 6));
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) rect(g, x + 3 + c * 6, y - h + 4 + r * 7, 3, 4, win);
}

function river(g: Ctx, y: number, h: number, c: string, t: number) {
  rect(g, 0, y, W, h, c);
  for (let i = 0; i < 14; i++) {
    const x = (hash(i) * W + t * 8) % W;
    rect(g, x, y + 2 + (i % Math.max(1, h - 3)), 8, 1, "#9fd0ff");
  }
}

function stars(g: Ctx, n: number, maxY: number, t: number) {
  for (let i = 0; i < n; i++) {
    const tw = Math.sin(t * 2 + i) > 0.7 ? "#ffffff" : "#9aa6e0";
    rect(g, Math.floor(hash(i + 3) * W), Math.floor(hash(i + 50) * maxY), 1, 1, tw);
  }
}

/* ------------------------------------------------------------------ scenes */

type Painter = (g: Ctx, t: number) => void;

const SCENES: Record<SceneId, Painter> = {
  museum: (g) => {
    rect(g, 0, 0, W, H, "#1a1440");
    rect(g, 0, 150, W, 50, "#3a2a1a");
    for (let x = 0; x < W; x += 16) rect(g, x, 150, 1, 50, "#2a1e12");
    rect(g, 0, 148, W, 3, "#5a4024");
    // Exhibit frames: wagon, train, map.
    const frame = (x: number, y: number, w: number, h: number) => {
      rect(g, x - 3, y - 3, w + 6, h + 6, "#c8a040");
      rect(g, x, y, w, h, "#e8dcb8");
    };
    frame(20, 46, 70, 40);
    g.drawImage(bitmap(WAGON), 42, 58);
    frame(125, 46, 70, 40);
    rect(g, 132, 52, 56, 2, "#7a4a22");
    for (let i = 0; i < 5; i++) rect(g, 136 + i * 10, 56, 6, 1 + (i % 3), "#3a2a1a");
    rect(g, 140, 66, 40, 1, "#b0905a");
    rect(g, 140, 72, 34, 1, "#b0905a");
    rect(g, 140, 78, 38, 1, "#b0905a");
    frame(230, 46, 70, 40);
    g.drawImage(bitmap(ENGINE), 248, 60);
    rect(g, 0, 0, W, 8, "#0a0f2e");
    for (let x = 30; x < W; x += 70) rect(g, x, 8, 10, 4, "#ffd23f");
  },
  bethlehem: (g, t) => {
    sky(g, "#5a86c8", "#e8c890");
    ridge(g, 105, 25, "#4a6a50", 2);
    river(g, 150, 12, "#3a6aa8", t);
    rect(g, 0, 118, W, 32, "#5a7a3a");
    building(g, 60, 140, 70, 34, "#b8a888", "#8a3a2a", "#ffe8a0", 3);
    building(g, 150, 140, 46, 26, "#c8b898", "#8a3a2a");
    building(g, 210, 140, 38, 22, "#a89878", "#7a3424");
    roundTree(g, 30, 140);
    roundTree(g, 270, 140);
    rect(g, 0, 162, W, 38, "#4a6a2a");
  },
  susquehanna: (g, t) => {
    sky(g, "#6a9ad8", "#d8e0c0");
    ridge(g, 110, 22, "#5a7a68", 5);
    river(g, 112, 50, "#3a72b8", t);
    rect(g, 120, 128, 60, 6, "#7a4a22");
    g.drawImage(bitmap(WAGON), 126, 113);
    rect(g, 0, 70 + 92, W, 38, "#5a7a3a");
    for (let x = 0; x < W; x += 30) pine(g, x + 10, 176, 1);
  },
  potomac: (g, t) => {
    sky(g, "#5a8ad0", "#e8d0a0");
    ridge(g, 100, 34, "#3e5a48", 9);
    ridge(g, 118, 18, "#4e6e3a", 3);
    river(g, 122, 30, "#2e64a8", t);
    rect(g, 0, 152, W, 48, "#5a7a3a");
    roundTree(g, 40, 160);
    roundTree(g, 280, 162);
  },
  augusta: (g) => {
    sky(g, "#6a9ae0", "#f0d8a8");
    ridge(g, 96, 30, "#44608a", 11);
    ridge(g, 112, 18, "#5a7a50", 4);
    rect(g, 0, 112, W, 88, "#7a9a48");
    for (let i = 0; i < 6; i++) rect(g, i * 56, 130 + (i % 2) * 8, 50, 10, i % 2 ? "#c8a050" : "#6a8a38");
    building(g, 140, 160, 40, 26, "#c8b8a0", "#6a4a3a");
    rect(g, 156, 120, 8, 14, "#c8b8a0");
    building(g, 60, 165, 26, 16, "#8a5a32", "#5a3a22", "#ffd23f", 1);
    building(g, 240, 165, 26, 16, "#8a5a32", "#5a3a22", "#ffd23f", 1);
  },
  dan: (g, t) => {
    sky(g, "#5a7ac0", "#e8b880");
    ridge(g, 108, 20, "#4a5a40", 13);
    rect(g, 0, 108, W, 92, "#4a6a30");
    river(g, 140, 14, "#3a6a98", t);
    for (let i = 0; i < 12; i++) roundTree(g, 12 + i * 27, 132 + (i % 3) * 3, i % 2 ? "#8a5a20" : "#a8641c");
    for (let i = 0; i < 10; i++) roundTree(g, 20 + i * 32, 190, i % 2 ? "#7a4a1a" : "#2d5a30");
  },
  bethabara: (g, t) => {
    sky(g, "#0a1030", "#3a2a5a", 140);
    stars(g, 50, 90, t);
    rect(g, 250, 26, 10, 10, "#f2e8b0");
    ridge(g, 120, 16, "#1a2a20", 17);
    rect(g, 0, 120, W, 80, "#1e3420");
    // log cabin
    rect(g, 120, 130, 70, 34, "#6a4222");
    for (let y = 132; y < 164; y += 4) rect(g, 120, y, 70, 1, "#3e2410");
    for (let i = 0; i < 10; i++) rect(g, 114 + i, 130 - i * 1.6, 82 - 2 * i, 2, "#4a2e18");
    rect(g, 146, 146, 12, 18, "#2a180a");
    rect(g, 128, 140, 10, 8, Math.sin(t * 6) > 0 ? "#ffd23f" : "#ffb030");
    rect(g, 174, 140, 10, 8, "#ffd23f");
    for (let i = 0; i < 9; i++) pine(g, 20 + i * 36 + (i > 3 ? 90 : 0), 176, 2, "#0e2416");
  },
  independence: (g) => {
    sky(g, "#6aa0e8", "#f0e0b0");
    rect(g, 0, 120, W, 80, "#8a7a4a");
    building(g, 120, 140, 80, 40, "#a8452a", "#5a2a1a", "#ffe8a0", 3);
    rect(g, 154, 84, 12, 16, "#e8e0c8");
    rect(g, 158, 78, 4, 6, "#e8e0c8");
    building(g, 30, 145, 50, 26, "#8a5a32", "#4a2a14");
    building(g, 230, 145, 60, 28, "#9a6a3a", "#4a2a14");
    g.drawImage(bitmap(WAGON), 30, 160);
    g.drawImage(bitmap(WAGON), 210, 166);
  },
  laramie: (g, t) => {
    sky(g, "#5a98e8", "#f0d8a0");
    peaks(g, 112, "#7a8a9a", null, 3);
    rect(g, 0, 112, W, 88, "#b0a060");
    river(g, 170, 10, "#4a7ab0", t);
    rect(g, 100, 122, 120, 30, "#d8c090");
    rect(g, 100, 122, 120, 3, "#b89a68");
    rect(g, 92, 112, 18, 40, "#c8ac78");
    rect(g, 210, 112, 18, 40, "#c8ac78");
    rect(g, 152, 136, 16, 16, "#5a3a1a");
    rect(g, 154, 108, 2, 16, "#5a3a1a");
    rect(g, 156, 108, 10, 6, "#e3262f");
  },
  indrock: (g) => {
    sky(g, "#4a90e8", "#f0e0a8");
    rect(g, 0, 120, W, 80, "#a8a060");
    for (let y = 0; y < 48; y++) {
      const half = Math.sqrt(1 - ((y - 48) / 48) ** 2) * 110;
      rect(g, 160 - half, 124 - 48 + y, half * 2, 1, y < 6 ? "#a8a8a0" : "#8a8a84");
    }
    for (let i = 0; i < 14; i++) rect(g, 90 + i * 11, 100 + (i % 3) * 6, 6, 1, "#4a4a48");
    rect(g, 0, 150, W, 8, "#4a80b8");
    for (let i = 0; i < 16; i++) rect(g, hash(i) * W, 170 + hash(i + 9) * 25, 6, 3, "#6a7a3a");
  },
  forthall: (g, t) => {
    sky(g, "#5a9ae8", "#e8d8b0");
    ridge(g, 112, 16, "#8a8070", 21);
    rect(g, 0, 112, W, 88, "#b8a878");
    river(g, 160, 14, "#3a6ab0", t);
    rect(g, 110, 118, 100, 32, "#e0d0b0");
    for (let x = 110; x < 210; x += 5) rect(g, x, 116, 3, 4, "#c8b890");
    rect(g, 150, 132, 14, 18, "#5a3a1a");
    rect(g, 156, 104, 2, 14, "#5a3a1a");
    rect(g, 158, 104, 12, 7, "#e3262f");
    for (let i = 0; i < 20; i++) rect(g, hash(i + 4) * W, 180 + hash(i) * 18, 5, 3, "#8a9a6a");
  },
  dalles: (g, t) => {
    sky(g, "#5a90d8", "#e8d8c0");
    peaks(g, 100, "#7a88a0", "#f2f4ff", 31);
    rect(g, 0, 100, W, 100, "#6a6a5a");
    for (let i = 0; i < 8; i++) rect(g, i * 40, 104, 30, 30 + (i % 3) * 6, "#4a4a44");
    river(g, 140, 32, "#2e5aa0", t);
    for (let i = 0; i < 6; i++) rect(g, 60 + i * 30, 146 + (i % 2) * 6, 14, 2, "#f2f4ff");
    rect(g, 0, 172, W, 28, "#7a7a5a");
  },
  willamette: (g, t) => {
    sky(g, "#6aa8f0", "#f0f0d0");
    for (let y = 0; y < 60; y++) {
      const half = (y / 60) * 70;
      rect(g, 230 - half, 40 + y, half * 2, 1, y < 16 ? "#f2f4ff" : "#8a9ab0");
    }
    ridge(g, 112, 18, "#3a6a3a", 7);
    rect(g, 0, 112, W, 88, "#5a9a3a");
    for (let i = 0; i < 5; i++) rect(g, i * 66, 132 + (i % 2) * 10, 58, 12, i % 2 ? "#8ab04a" : "#c8b050");
    river(g, 160, 10, "#3a7ac0", t);
    building(g, 60, 186, 30, 18, "#8a5a32", "#5a3a22", "#ffd23f", 1);
    for (let i = 0; i < 8; i++) roundTree(g, 120 + i * 24, 190);
  },
  durham: (g) => {
    sky(g, "#6a98d8", "#e8d8c0");
    rect(g, 0, 150, W, 50, "#5a5a5a");
    building(g, 20, 150, 110, 60, "#9a3a2a", null, "#ffe8a0", 5);
    rect(g, 110, 60, 10, 40, "#7a2a1a");
    building(g, 150, 150, 50, 46, "#b8a890", "#5a4a3a", "#ffe8a0", 4);
    building(g, 210, 150, 46, 52, "#8a5a3a", null, "#ffe8a0", 5);
    building(g, 262, 150, 50, 36, "#a8452a", "#5a2a1a", "#ffe8a0", 3);
    rect(g, 0, 160, W, 2, "#8a8a8a");
  },
  richmond: (g) => {
    sky(g, "#6a98e0", "#f0e0c8");
    rect(g, 0, 150, W, 50, "#5a5a5a");
    building(g, 30, 150, 60, 44, "#a8452a", "#5a2a1a", "#ffe8a0", 4);
    building(g, 110, 150, 80, 56, "#d8d0c0", null, "#3a3a4a", 5);
    for (let i = 0; i < 5; i++) rect(g, 114 + i * 16, 112, 4, 38, "#f2f0e8");
    rect(g, 108, 104, 84, 8, "#e8e0d0");
    building(g, 210, 150, 40, 40, "#9a5a3a", "#5a2a1a", "#ffe8a0", 3);
    building(g, 256, 150, 50, 46, "#a8452a", "#5a2a1a", "#ffe8a0", 4);
  },
  washington: (g) => {
    sky(g, "#5a90e0", "#f0e8d8");
    rect(g, 236, 70, 40, 20, "#e8e8e0");
    for (let y = 0; y < 16; y++) {
      const half = Math.sqrt(256 - (16 - y) ** 2) * 1.2;
      rect(g, 256 - half, 54 + y, half * 2, 1, "#f2f2ea");
    }
    rect(g, 255, 48, 2, 6, "#f2f2ea");
    rect(g, 0, 150, W, 50, "#7a7a7a");
    rect(g, 30, 92, 200, 58, "#f2eee2");
    for (let i = 0; i < 3; i++) {
      const x = 60 + i * 50;
      rect(g, x, 112, 34, 38, "#3a3a4a");
      for (let k = 0; k < 17; k++) rect(g, x + k * 2, 112 - Math.sqrt(Math.max(0, 289 - (k * 2 - 17) ** 2)) * 0.6, 2, 2, "#f2eee2");
    }
    rect(g, 30, 88, 200, 6, "#d8d2c0");
  },
  baltimore: (g, t) => {
    sky(g, "#5a88d0", "#e8d0b8");
    for (let i = 0; i < 9; i++) building(g, i * 36, 132, 32, 30 + (i % 3) * 8, i % 2 ? "#a8452a" : "#8a3a2a", null, "#ffe8a0", 3);
    river(g, 132, 68, "#2e5a98", t);
    rect(g, 140, 150, 60, 10, "#3a2a1a");
    rect(g, 160, 120, 2, 30, "#3a2a1a");
    rect(g, 162, 122, 18, 14, "#e8e0c8");
  },
  philadelphia: (g) => {
    sky(g, "#6a90d8", "#f0d8c0");
    rect(g, 0, 150, W, 50, "#6a6a6a");
    rect(g, 140, 40, 24, 110, "#d8c8a8");
    rect(g, 146, 26, 12, 14, "#c8b898");
    rect(g, 150, 14, 4, 12, "#8a7a5a");
    rect(g, 146, 60, 12, 12, "#f2f2e0");
    building(g, 60, 150, 70, 60, "#d0c0a0", null, "#3a3a4a", 6);
    building(g, 180, 150, 80, 52, "#a8452a", null, "#ffe8a0", 5);
    building(g, 10, 150, 44, 40, "#8a5a3a", null, "#ffe8a0", 4);
    building(g, 268, 150, 48, 44, "#9a3a2a", null, "#ffe8a0", 4);
  },
  newyork: (g, t) => {
    sky(g, "#2a3a7a", "#e89a6a");
    for (let i = 0; i < 14; i++) building(g, i * 24, 120, 20, 40 + hash(i) * 60, "#3a3a5a", null, Math.sin(t + i) > 0 ? "#ffd23f" : "#c8a030", 6);
    rect(g, 0, 120, W, 80, "#5a5a5a");
    for (let i = 0; i < 8; i++) building(g, i * 40, 178, 38, 50, "#7a4a32", null, "#ffe8a0", 5);
    rect(g, 0, 182, W, 18, "#4a4a4a");
  },
};

/* ------------------------------------------------------------------ travel strip */

const TERRAIN_SKY: Record<Terrain, [string, string]> = {
  farms: ["#6a9ae0", "#f0e0b0"], forest: ["#5a8ac8", "#e0d0a0"], valley: ["#6aa0e8", "#f0d8a8"], hills: ["#5a80c0", "#e8c890"],
  plains: ["#4a90e8", "#f0e8b8"], desert: ["#5a98e8", "#f0d8a0"], mountains: ["#4a80d8", "#e0e0d8"], river: ["#6a9ad8", "#e0e0c0"],
  rail: ["#6a98d8", "#f0e0c8"], city: ["#6a90d0", "#e8d8c8"],
};
const TERRAIN_GROUND: Record<Terrain, string> = {
  farms: "#6a8a38", forest: "#3a5a2a", valley: "#6a9a40", hills: "#5a7a34", plains: "#a8a050", desert: "#c0a870",
  mountains: "#6a7a50", river: "#5a8a3a", rail: "#7a8a4a", city: "#6a6a6a",
};

function travelStrip(g: Ctx, game: Game, t: number) {
  const exp = game.exp!;
  const leg = exp.legs[Math.min(game.sim.leg, exp.legs.length - 1)];
  const terr = leg.terrain;
  const off = game.scroll * 40;
  const [top, bottom] = TERRAIN_SKY[terr];
  sky(g, top, bottom, 140);
  // sun and drifting clouds
  rect(g, 40, 24, 10, 10, "#fff0a0");
  for (let i = 0; i < 4; i++) {
    const cx = ((i * 97 - off * 0.08 + t * 2) % (W + 60) + W + 60) % (W + 60) - 40;
    const cy = 30 + (i % 3) * 16;
    rect(g, cx, cy, 34, 5, "rgba(255,255,255,0.75)");
    rect(g, cx + 6, cy - 4, 18, 4, "rgba(255,255,255,0.75)");
  }
  if (terr === "mountains") peaks(g, 112, "#6a7898", "#f2f4ff", 7, off * 0.2);
  else if (terr === "desert") ridge(g, 112, 16, "#b08a68", 4, off * 0.2);
  else ridge(g, 108, terr === "plains" ? 8 : 24, terr === "hills" || terr === "forest" ? "#3a5a48" : "#5a7a68", 2, off * 0.2);
  ridge(g, 126, terr === "plains" || terr === "desert" ? 6 : 14, mix(TERRAIN_GROUND[terr], "#203020", 0.25), 8, off * 0.5);
  rect(g, 0, 126, W, 74, TERRAIN_GROUND[terr]);
  // mid scenery
  for (let i = 0; i < 9; i++) {
    const span = 52;
    const x = Math.round(((i * span - (off * 0.8) % span) % (W + span) + W + span) % (W + span)) - span / 2;
    const k = Math.floor((off * 0.8 + i * span) / span);
    const hz = hash(k + 99);
    if (terr === "forest" || terr === "hills") pine(g, x, 140 + hz * 4, 2);
    else if (terr === "farms" || terr === "valley") hz > 0.5 ? roundTree(g, x, 140) : rect(g, x - 10, 136, 22, 1, "#8a5a32");
    else if (terr === "plains" || terr === "desert") rect(g, x, 138 + hz * 6, 5, 3, terr === "desert" ? "#8a9a6a" : "#6a7a2a");
    else if (terr === "mountains") pine(g, x, 140, 1 + Math.round(hz));
    else if (terr === "river") hz > 0.4 ? roundTree(g, x, 140) : rect(g, x - 12, 132, 24, 3, "#4a7ab8");
    else if (terr === "rail") {
      rect(g, x, 112, 1, 30, "#4a3a2a");
      rect(g, x - 3, 113, 7, 1, "#4a3a2a");
    }
  }
  // road or rails
  if (exp.mode === "rail") {
    rect(g, 0, 166, W, 3, "#5a4a3a");
    for (let x = -((off * 2) % 8); x < W; x += 8) rect(g, x, 169, 5, 3, "#4a3a2a");
    rect(g, 0, 165, W, 2, "#a8a8b0");
  } else {
    rect(g, 0, 160, W, 18, mix(TERRAIN_GROUND[terr], "#c8a878", 0.55));
    for (let x = -((off * 2) % 24); x < W; x += 24) rect(g, x, 170, 8, 1, mix(TERRAIN_GROUND[terr], "#7a5a3a", 0.5));
  }
  // foreground tufts
  for (let i = 0; i < 12; i++) {
    const x = ((i * 31 - off * 2) % (W + 20) + W + 20) % (W + 20) - 10;
    rect(g, x, 182 + (i % 3) * 4, 3, 2, mix(TERRAIN_GROUND[terr], "#000000", 0.25));
  }
  const moving = game.phase === "travel" && !game.paused;
  const frame = moving ? Math.floor(t * 6) % 2 : 0;
  const bob = moving ? (Math.floor(t * 6) % 2) : 0;
  const big = (img: HTMLCanvasElement, x: number, y: number) => g.drawImage(img, Math.round(x), Math.round(y), img.width * 2, img.height * 2);
  if (exp.mode === "rail") {
    const cx = 20;
    big(bitmap(COACH), cx, 138);
    big(bitmap(COACH), cx + 66, 138);
    // The engine leads on the right, so its sprite is mirrored (smokestack forward).
    const eng = bitmap(ENGINE, { R: "#e3262f" });
    g.save();
    g.translate(cx + 132 + eng.width * 2, 132);
    g.scale(-1, 1);
    g.drawImage(eng, 0, 0, eng.width * 2, eng.height * 2);
    g.restore();
    const stack = cx + 132 + eng.width * 2 - 10;
    if (moving) for (let i = 0; i < 5; i++) rect(g, stack - 4 - i * 14 - ((t * 40) % 14), 124 - i * 4, 8 + i * 2, 6, "#e8e8f0");
  } else {
    const wx = 70;
    big(bitmap(WAGON), wx, 140 + bob);
    const animal = exp.id === "westward" ? OX : HORSE;
    big(bitmap(animal[frame]), wx + 56, 152);
    big(bitmap(animal[1 - frame]), wx + 86, 152);
    const coat = exp.id === "westward" ? { C: "#5a3e8a" } : { C: "#2a2018" };
    big(bitmap(WALKER[frame], coat), wx - 18, 152);
    big(bitmap(WALKER[1 - frame], { ...coat, S: "#d8a880" }), wx + 120, 152);
  }
}

function hud(g: Ctx, game: Game) {
  const exp = game.exp!;
  const s = game.sim;
  rect(g, 0, 0, W, 11, "rgba(5,8,24,0.82)");
  drawText(g, dateOf(exp, s.day).label.toUpperCase(), 4, 2, "#ffd23f");
  drawText(g, `MILE ${s.mile}/${exp.landmarks[exp.landmarks.length - 1].mile}`, W - 4, 2, "#f2f4ff", 1, "right");
  const food = `${Math.floor(s.res.food)} ${exp.units.food.toUpperCase()}`;
  drawText(g, food, W / 2, 2, s.res.food < (exp.party * exp.rations[s.ration].perPerson) * 5 ? "#ff8a90" : "#5fff8a", 1, "center");
  // route strip
  const y = 192;
  rect(g, 0, y - 4, W, 12, "rgba(5,8,24,0.82)");
  const total = exp.landmarks[exp.landmarks.length - 1].mile;
  const x0 = 10, x1 = W - 10;
  rect(g, x0, y + 1, x1 - x0, 1, "#6a78b8");
  for (const lm of exp.landmarks) {
    const x = x0 + ((x1 - x0) * lm.mile) / total;
    rect(g, x - 1, y - 1, 3, 5, lm.mile <= s.mile ? "#ffd23f" : "#6a78b8");
  }
  const px = x0 + ((x1 - x0) * Math.min(s.mile, total)) / total;
  rect(g, px - 2, y - 3, 5, 3, "#e3262f");
  rect(g, px - 1, y, 3, 2, "#e3262f");
}

function banner(g: Ctx, title: string, sub: string) {
  rect(g, 0, 14, W, 22, "rgba(5,8,24,0.78)");
  drawText(g, title.toUpperCase(), W / 2, 17, "#ffd23f", 2, "center", "#e3262f");
  if (sub) drawText(g, sub, W / 2, 31 + 0, "#6ea0ff", 1, "center");
}

function guide(g: Ctx, t: number, words: string) {
  const bob = Math.floor(t * 2) % 2;
  g.drawImage(bitmap(HERO), 20, 120 - bob, 32, 38);
  drawText(g, "MUSEUM GUIDE", 36, 162, "#6ea0ff", 1, "center");
  if (!words) return;
  const lines = wrap(words, 210).slice(0, 4);
  const bw = 222, bh = lines.length * (FONT_H + 2) + 8;
  const bx = 62, by = 104 - bh / 2;
  rect(g, bx, by, bw, bh, "#f2f4ff");
  rect(g, bx - 4, 118, 5, 4, "#f2f4ff");
  lines.forEach((l, i) => drawText(g, l, bx + 6, by + 5 + i * (FONT_H + 2), "#0a0f2e"));
}

/* ------------------------------------------------------------------ the loop */

export class Screen {
  private raf = 0;
  private last = 0;
  private t = 0;
  /** Short line the museum guide says (set by the UI). */
  guideLine = "";
  constructor(private canvas: HTMLCanvasElement, private game: Game, private onTick?: (dt: number) => void) {
    canvas.width = W;
    canvas.height = H;
  }

  start() {
    const loop = (now: number) => {
      const dt = Math.max(0, Math.min(0.05, (now - (this.last || now)) / 1000));
      this.last = now;
      this.t += dt;
      this.onTick?.(dt);
      this.draw();
      this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
  }

  stop() {
    cancelAnimationFrame(this.raf);
  }

  draw() {
    const g = this.canvas.getContext("2d");
    if (!g) return;
    g.imageSmoothingEnabled = false;
    const game = this.game;
    const t = this.t;
    const ph = game.phase;
    if (!game.exp || ph === "select" || ph === "intro" || ph === "report") {
      SCENES.museum(g, t);
      banner(g, "TRAIL LEDGER", game.exp ? `${game.exp.title.toUpperCase()} · ${game.exp.year}` : "A US HISTORY JOURNEY");
      guide(g, t, this.guideLine);
      return;
    }
    const exp = game.exp;
    if (ph === "outfit" || (ph === "question" && game.asking?.purpose === "outfit")) {
      storeScene(g);
      banner(g, "GENERAL STORE", exp.landmarks[0].name.toUpperCase());
      return;
    }
    const atLandmark = ph === "landmark" || ph === "fork" || ph === "arrived" || (ph === "question" && (game.asking?.purpose === "landmark" || game.asking?.purpose === "transmission"));
    if (atLandmark) {
      const lm = exp.landmarks[game.at];
      SCENES[lm.scene](g, t);
      banner(g, lm.name, ph === "arrived" ? "ARRIVED" : lm.place.split(" · ")[0]);
      hud(g, game);
      return;
    }
    travelStrip(g, game, t);
    if (ph === "wintered") {
      g.fillStyle = "rgba(220,230,255,0.55)";
      g.fillRect(0, 0, W, H);
      for (let i = 0; i < 80; i++) rect(g, (hash(i) * W + t * 10 * (1 + (i % 3))) % W, (hash(i + 7) * H + t * 30 * (1 + (i % 2))) % H, 2, 2, "#ffffff");
      banner(g, exp.lateLabel, "RETRY THE LEG FROM THE CHECKPOINT");
    }
    hud(g, game);
    if (game.paused) banner(g, "PAUSED", "");
  }
}

function storeScene(g: Ctx) {
  rect(g, 0, 0, W, H, "#4a3018");
  for (let y = 0; y < 150; y += 8) rect(g, 0, y, W, 1, "#3a2410");
  rect(g, 0, 150, W, 50, "#6a4a28");
  for (let s = 0; s < 3; s++) {
    const y = 60 + s * 30;
    rect(g, 20, y, 280, 4, "#8a5a32");
    for (let i = 0; i < 12; i++) {
      const x = 26 + i * 23;
      const k = (i + s * 5) % 4;
      if (k === 0) rect(g, x, y - 14, 14, 14, "#e8dcb8");
      else if (k === 1) {
        rect(g, x, y - 16, 14, 16, "#7a4a22");
        rect(g, x, y - 12, 14, 1, "#3a2410");
        rect(g, x, y - 5, 14, 1, "#3a2410");
      } else if (k === 2) rect(g, x + 3, y - 10, 8, 10, "#3a6a98");
      else rect(g, x, y - 8, 16, 8, "#a8452a");
    }
  }
  rect(g, 40, 140, 240, 18, "#8a5a32");
  rect(g, 40, 140, 240, 3, "#a8743e");
  rect(g, 150, 128, 20, 12, "#c8a040");
}

export function sceneIds(): SceneId[] {
  return Object.keys(SCENES) as SceneId[];
}
