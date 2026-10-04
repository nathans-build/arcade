/*
 * Bead scene tile sets (320x200, painted in code, cached as backgrounds): eleven places a bead can
 * happen, plus the Long Archive's loom room and the dusty road of a dead end. The floor is y = 150;
 * the HUD covers y 0-10 and the info strip y 160-200.
 */
import { C, Gfx, rnd } from "@/chase/gfx";

export type SceneId = "court" | "market" | "library" | "mill" | "workshop" | "port" | "desert" | "steppe" | "fields" | "city" | "assembly";
export type BackdropId = SceneId | "loom" | "road";

export const FLOOR = 150;

function sky(g: Gfx, cols: string[], to = FLOOR) {
  g.bands(0, 10, 320, to, cols);
}

function stars(g: Gfx, n: number, seed: number) {
  for (let i = 0; i < n; i++) g.px(rnd(seed + i) * 320, 12 + rnd(seed + i * 3.1) * 60, rnd(i) > 0.7 ? C.sbYellow : C.white);
}

function brickWall(g: Gfx, x: number, y: number, w: number, h: number, a: string, b: string) {
  g.rect(x, y, w, h, a);
  for (let yy = y; yy < y + h; yy += 6) {
    g.rect(x, yy, w, 1, b);
    const off = ((yy - y) / 6) % 2 ? 0 : 6;
    for (let xx = x + off; xx < x + w; xx += 12) g.rect(xx, yy, 1, 6, b);
  }
}

function floorTiles(g: Gfx, a: string, b: string) {
  g.rect(0, FLOOR, 320, 10, a);
  for (let x = 0; x < 320; x += 16) g.rect(x, FLOOR, 8, 10, b);
  g.rect(0, FLOOR, 320, 1, "#000000");
}

function ground(g: Gfx, a: string, b: string) {
  g.rect(0, FLOOR, 320, 10, a);
  g.dither(0, FLOOR + 4, 320, 6, a, b);
}

function arch(g: Gfx, x: number, y: number, w: number, h: number, c: string, inner: string) {
  g.rect(x, y + w / 2, w, h - w / 2, c);
  g.ellipse(x + w / 2, y + w / 2, w / 2, w / 2, c);
  g.rect(x + 3, y + w / 2 + 2, w - 6, h - w / 2 - 2, inner);
  g.ellipse(x + w / 2, y + w / 2 + 2, w / 2 - 3, w / 2 - 3, inner);
}

function ship(g: Gfx, x: number, y: number, hull: string, sail: string, big = false) {
  const w = big ? 70 : 44;
  g.poly([[x, y], [x + w, y], [x + w - 8, y + 10], [x + 8, y + 10]], hull);
  g.rect(x + w / 2 - 1, y - (big ? 50 : 34), 2, big ? 50 : 34, "#5a3a1a");
  g.poly([[x + w / 2 + 2, y - (big ? 46 : 30)], [x + w / 2 + 2, y - 4], [x + w - 6, y - 6]], sail);
  if (big) g.poly([[x + w / 2 - 3, y - 40], [x + w / 2 - 3, y - 6], [x + 6, y - 8]], sail);
}

export const PAINTERS: Record<BackdropId, (g: Gfx) => void> = {
  court(g) {
    sky(g, ["#3a1a2a", "#5a2a3a", "#7a3a3a"]);
    brickWall(g, 0, 30, 320, 120, "#8a2a2a", "#6a1a1a");
    for (const x of [20, 110, 200, 290]) {
      g.rect(x, 30, 10, 120, "#c83a2a");
      g.rect(x - 2, 30, 14, 4, C.sbYellow);
    }
    g.poly([[0, 30], [320, 30], [300, 14], [20, 14]], "#2a4a3a");
    g.rect(0, 28, 320, 3, C.sbYellow);
    g.rect(120, 60, 80, 40, "#e8d8a0");
    g.rect(124, 64, 72, 32, "#c8382a");
    g.rect(150, 70, 20, 20, C.sbYellow);
    floorTiles(g, "#5a3a2a", "#4a2a1a");
  },
  market(g) {
    sky(g, ["#3a6ac8", "#6ea0ff", "#a8c8ff"]);
    g.circle(270, 34, 10, "#fff2a0");
    for (const [x, w, h, c] of [[0, 70, 70, "#d8b878"], [80, 60, 90, "#c8a060"], [250, 70, 80, "#d8b070"]] as const) {
      g.rect(x, FLOOR - h, w, h, c);
      g.rect(x + 10, FLOOR - h + 14, 10, 14, "#3a2a1a");
      g.rect(x + w - 22, FLOOR - h + 14, 10, 14, "#3a2a1a");
    }
    g.ellipse(110, 58, 22, 16, "#3a8a8a");
    g.rect(108, 36, 4, 8, C.sbYellow);
    // awnings and stalls
    for (const [x, c] of [[150, "#e3262f"], [205, "#2456e8"]] as const) {
      g.poly([[x, 100], [x + 50, 100], [x + 44, 112], [x + 6, 112]], c);
      for (let i = 0; i < 5; i++) g.rect(x + 6 + i * 9, 100, 4, 12, "#ffffff");
      g.rect(x + 6, 112, 2, 38, "#5a3a1a");
      g.rect(x + 42, 112, 2, 38, "#5a3a1a");
      g.rect(x + 4, 130, 42, 6, "#8a5a2a");
      for (let i = 0; i < 6; i++) g.circle(x + 9 + i * 6, 128, 2, ["#ffd23f", "#e86a2a", "#5fff8a"][i % 3]);
    }
    ground(g, "#c8a060", "#b08848");
  },
  library(g) {
    sky(g, ["#1a1438", "#241a4a"]);
    brickWall(g, 0, 10, 320, 140, "#3a2a5a", "#2a1a4a");
    for (const x of [8, 250]) {
      g.rect(x, 30, 62, 120, "#5a3a1a");
      for (let s = 0; s < 5; s++) {
        g.rect(x + 2, 40 + s * 22, 58, 2, "#3a2210");
        for (let b = 0; b < 12; b++) g.rect(x + 3 + b * 5, 26 + s * 22, 4, 14, ["#c83a2a", "#2a6ac8", "#d8b860", "#3a8a5a", "#8a3ab0"][(b + s) % 5]);
      }
    }
    arch(g, 120, 24, 80, 80, "#5a4a8a", "#0a0f2e");
    stars(g, 18, 3);
    g.circle(160, 60, 12, "#fff2a0");
    g.rect(100, 120, 120, 6, "#7a5a2a");
    g.rect(106, 126, 4, 24, "#5a3a1a");
    g.rect(210, 126, 4, 24, "#5a3a1a");
    g.rect(130, 114, 26, 6, "#f5e6c8");
    g.rect(160, 112, 22, 8, "#f5e6c8");
    floorTiles(g, "#2a1a3a", "#3a2a4a");
  },
  mill(g) {
    sky(g, ["#5a7ac8", "#8ab0e8", "#c8d8f0"]);
    g.poly([[0, 90], [60, 50], [120, 80], [200, 40], [320, 85], [320, 150], [0, 150]], "#4a7a4a");
    brickWall(g, 150, 60, 130, 90, "#9a4a3a", "#7a3a2a");
    g.poly([[145, 60], [285, 60], [270, 44], [160, 44]], "#4a3a3a");
    for (let i = 0; i < 4; i++) g.rect(160 + i * 30, 76, 14, 18, "#ffd890");
    for (let i = 0; i < 4; i++) g.rect(160 + i * 30, 110, 14, 18, "#ffd890");
    g.rect(270, 20, 10, 40, "#6a3a2a");
    g.ellipse(100, 110, 28, 28, "#6a4a2a");
    g.ellipse(100, 110, 22, 22, "#8a6a3a");
    for (let a = 0; a < 8; a++) g.line(100, 110, 100 + Math.cos(a * 0.785) * 26, 110 + Math.sin(a * 0.785) * 26, "#4a2a10");
    g.rect(0, 136, 140, 14, "#3a6ac8");
    g.dither(0, 136, 140, 14, "#3a6ac8", "#6ea0ff");
    ground(g, "#6a8a4a", "#5a7a3a");
  },
  workshop(g) {
    sky(g, ["#2a1a10", "#3a2a1a"]);
    g.rect(0, 10, 320, 140, "#4a3220");
    for (let x = 0; x < 320; x += 20) g.rect(x, 10, 2, 140, "#3a2414");
    g.rect(0, 20, 320, 6, "#5a3a20");
    // press
    g.rect(120, 50, 10, 100, "#6a4020");
    g.rect(190, 50, 10, 100, "#6a4020");
    g.rect(116, 46, 88, 10, "#7a4a24");
    g.rect(156, 56, 8, 30, "#c8a060");
    g.rect(130, 86, 60, 10, "#8a5a2a");
    g.rect(126, 110, 68, 8, "#5a3a1a");
    g.rect(136, 104, 48, 6, "#f5e6c8");
    // type case
    g.rect(14, 70, 70, 50, "#6a4a2a");
    for (let r = 0; r < 5; r++) for (let c = 0; c < 7; c++) g.rect(17 + c * 10, 73 + r * 10, 8, 8, "#3a2410");
    // lamp glow
    g.circle(260, 60, 14, "#5a4020");
    g.circle(260, 60, 8, "#ffd890");
    g.rect(230, 90, 70, 6, "#7a5a2a");
    floorTiles(g, "#3a2a1a", "#4a3220");
  },
  port(g) {
    sky(g, ["#2a5ab0", "#5a8ae0", "#a0c8f0"]);
    g.circle(60, 36, 12, "#fff2a0");
    g.rect(0, 100, 320, 50, "#1f4a9a");
    for (let y = 104; y < 150; y += 6) for (let x = (y % 12) * 2; x < 320; x += 24) g.rect(x, y, 8, 1, "#6ea0ff");
    ship(g, 30, 102, "#6a3a1a", "#f5e6c8", true);
    ship(g, 150, 108, "#5a2a10", "#e8c8a0");
    g.rect(220, 90, 100, 60, "#c8a878");
    g.rect(230, 70, 30, 30, "#d8b888");
    g.rect(270, 60, 40, 40, "#c8a070");
    g.rect(280, 76, 8, 10, "#3a2a1a");
    g.rect(0, FLOOR - 4, 320, 4, "#7a5a3a");
    floorTiles(g, "#8a6a4a", "#7a5a3a");
  },
  desert(g) {
    sky(g, ["#e8a050", "#f0c070", "#f8e0a0"]);
    g.circle(240, 40, 16, "#fff6c0");
    g.poly([[0, 120], [80, 90], [160, 118], [240, 96], [320, 116], [320, 150], [0, 150]], "#d8a860");
    g.poly([[0, 135], [120, 112], [220, 132], [320, 120], [320, 150], [0, 150]], "#c89850");
    // salt houses
    for (const x of [40, 230]) {
      g.rect(x, 104, 40, 30, "#e8e8e0");
      for (let y = 106; y < 134; y += 6) g.rect(x, y, 40, 1, "#b8b8b0");
      g.rect(x + 15, 118, 10, 16, "#5a4a3a");
      g.rect(x - 2, 100, 44, 4, "#8a6a4a");
    }
    // camel silhouette
    g.poly([[140, 128], [150, 116], [158, 120], [166, 112], [176, 120], [180, 116], [186, 118], [182, 124], [178, 128]], "#7a5030");
    for (const lx of [146, 152, 170, 176]) g.rect(lx, 128, 2, 12, "#7a5030");
    ground(g, "#d8a860", "#c89850");
  },
  steppe(g) {
    sky(g, ["#4a8ad8", "#7ab0f0", "#c0dcf8"]);
    g.poly([[0, 100], [70, 70], [130, 96], [220, 60], [320, 92], [320, 150], [0, 150]], "#7a8aa8");
    g.poly([[0, 120], [320, 112], [320, 150], [0, 150]], "#7aa850");
    // yurts
    for (const [x, c] of [[40, "#f0e8d8"], [250, "#e8dcc8"]] as const) {
      g.rect(x, 108, 44, 24, c);
      g.poly([[x - 2, 108], [x + 46, 108], [x + 22, 92]], c);
      g.rect(x, 112, 44, 2, "#c83a2a");
      g.rect(x + 18, 118, 10, 14, "#c83a2a");
    }
    // relay post flag
    g.rect(160, 70, 2, 64, "#5a3a1a");
    g.poly([[162, 70], [184, 76], [162, 82]], "#2456e8");
    ground(g, "#6a9840", "#5a8830");
  },
  fields(g) {
    sky(g, ["#5a8ad8", "#8ab8f0", "#d0e4f8"]);
    g.poly([[0, 70], [60, 40], [110, 64], [180, 30], [250, 60], [320, 44], [320, 150], [0, 150]], "#5a7a5a");
    for (let i = 0; i < 6; i++) g.rect(0, 92 + i * 9, 320, 5, i % 2 ? "#6a9a40" : "#8aaa50");
    for (let x = 6; x < 320; x += 14) for (let y = 94; y < 146; y += 9) g.rect(x, y, 3, 3, "#3a6a2a");
    g.rect(240, 96, 50, 34, "#c8b088");
    g.poly([[236, 96], [294, 96], [265, 80]], "#7a5a3a");
    g.rect(258, 112, 12, 18, "#3a2a1a");
    ground(g, "#7a6a3a", "#6a5a2a");
  },
  city(g) {
    sky(g, ["#3a5aa0", "#6a8ad0", "#a8c0e8"]);
    for (const [x, w, h, c] of [[0, 50, 100, "#a87858"], [50, 40, 120, "#b88a68"], [90, 60, 90, "#987050"], [170, 50, 110, "#a88060"], [220, 60, 95, "#b89070"], [280, 40, 115, "#987050"]] as const) {
      g.rect(x, FLOOR - h, w, h, c);
      g.poly([[x - 2, FLOOR - h], [x + w + 2, FLOOR - h], [x + w / 2, FLOOR - h - 14]], "#8a3a2a");
      for (let yy = FLOOR - h + 10; yy < FLOOR - 20; yy += 18) for (let xx = x + 6; xx < x + w - 8; xx += 14) g.rect(xx, yy, 6, 9, "#2a2a4a");
    }
    // dome / tower
    g.rect(150, 40, 20, 110, "#c8b088");
    g.ellipse(160, 40, 14, 10, "#b8604a");
    floorTiles(g, "#8a8a8a", "#7a7a7a");
  },
  assembly(g) {
    sky(g, ["#20203a", "#2a2a4a"]);
    g.rect(0, 10, 320, 140, "#3a2a2a");
    for (let i = 0; i < 6; i++) g.rect(20 + i * 52, 20, 12, 130, "#d8c8a8");
    g.rect(0, 16, 320, 6, "#e8d8b8");
    g.rect(110, 40, 100, 50, "#2456e8");
    g.rect(110, 40, 33, 50, "#2456e8");
    g.rect(143, 40, 34, 50, "#f2f4ff");
    g.rect(177, 40, 33, 50, "#e3262f");
    g.rect(140, 100, 40, 10, "#7a4a2a");
    g.rect(150, 110, 20, 40, "#6a3a1a");
    for (let r = 0; r < 3; r++) for (let x = 6; x < 320; x += 12) if (x < 120 || x > 200) g.rect(x, 120 + r * 9, 8, 5, "#5a3a3a");
    floorTiles(g, "#4a2a2a", "#3a1a1a");
  },
  loom(g) {
    sky(g, ["#0a0f2e", "#121a4a", "#1a2460"]);
    stars(g, 40, 9);
    // the Great Loom: a frame with warp threads
    g.rect(40, 24, 240, 8, "#8a5a2a");
    g.rect(40, 132, 240, 8, "#8a5a2a");
    g.rect(40, 24, 8, 126, "#6a4020");
    g.rect(272, 24, 8, 126, "#6a4020");
    for (let x = 52; x < 270; x += 6) g.rect(x, 32, 1, 100, "#4a5a9a");
    floorTiles(g, "#1a1a3a", "#24244a");
  },
  road(g) {
    sky(g, ["#6a7ab0", "#a0a8c8", "#d8d0c0"]);
    g.poly([[0, 100], [90, 80], [200, 100], [320, 84], [320, 150], [0, 150]], "#8a9a7a");
    g.poly([[130, 150], [150, 100], [170, 100], [190, 150]], "#c8b088");
    g.rect(40, 96, 4, 54, "#5a3a1a");
    g.rect(28, 96, 30, 12, "#8a5a2a");
    g.rect(30, 98, 26, 8, "#c8a060");
    ground(g, "#7a8a5a", "#6a7a4a");
  },
};
