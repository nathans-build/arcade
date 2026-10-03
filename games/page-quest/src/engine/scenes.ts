/*
 * Backgrounds for every scene id in the story format, drawn procedurally in an 80s EGA style
 * (solid colours, checkerboard dithering, chunky shapes). `bg` is drawn once and cached;
 * `anim` draws the moving bits (waves, stars, flames, lasers...) every frame.
 * Characters stand with their feet on `floor`.
 */
import type { SceneId } from "@/story/roster";
import { C, Gfx, W, rnd } from "./gfx";

export interface ScenePainter {
  floor: number;
  /** Moving layer drawn BEHIND the cached background (which leaves those areas transparent). */
  back?: (g: Gfx, t: number) => void;
  bg: (g: Gfx) => void;
  anim?: (g: Gfx, t: number) => void;
}

// ---------- shared bits ----------
function stars(g: Gfx, n: number, y0: number, y1: number, seed: number, t?: number) {
  for (let i = 0; i < n; i++) {
    const x = Math.floor(rnd(seed + i) * W);
    const y = Math.floor(y0 + rnd(seed + i * 7.3) * (y1 - y0));
    const tw = t === undefined ? 1 : Math.sin(t * 2 + i) > 0.6 ? 0 : 1;
    g.px(x, y, tw ? (rnd(seed + i * 3) > 0.8 ? C.yellow : C.white) : C.lgray);
  }
}

function cloud(g: Gfx, x: number, y: number, s: number, c: string = C.white, shade: string = C.lgray) {
  g.ellipse(x, y + 2, 10 * s, 3 * s, shade);
  g.ellipse(x - 5 * s, y, 6 * s, 3 * s, c);
  g.ellipse(x + 4 * s, y - 1, 7 * s, 4 * s, c);
  g.ellipse(x, y + 1, 9 * s, 3 * s, c);
}

function planks(g: Gfx, y0: number, y1: number, a: string, b: string, line: string) {
  g.rect(0, y0, W, y1 - y0, a);
  let y = y0;
  let row = 0;
  while (y < y1) {
    const h = 5 + row;
    g.rect(0, y + h - 1, W, 1, line);
    const off = (row * 37) % 60;
    for (let x = -off; x < W; x += 60) g.rect(x, y, 1, h - 1, line);
    if (row % 2) g.dither(0, y, W, 1, a, b);
    y += h;
    row++;
  }
}

function bricks(g: Gfx, x0: number, y0: number, w: number, h: number, a: string, mortar: string, bw = 16, bh = 8) {
  g.rect(x0, y0, w, h, a);
  for (let y = y0, r = 0; y < y0 + h; y += bh, r++) {
    g.rect(x0, y, w, 1, mortar);
    for (let x = x0 - (r % 2 ? bw / 2 : 0); x < x0 + w; x += bw) if (x >= x0) g.rect(x, y, 1, bh, mortar);
  }
}

function flame(g: Gfx, x: number, y: number, t: number, s = 1) {
  const f = Math.floor(t * 10) % 3;
  g.ellipse(x, y - 1 * s, 3 * s, (4 + f) * s, C.orange);
  g.ellipse(x, y, 2 * s, (2 + (f % 2)) * s, C.yellow);
  g.px(x + (f - 1), y - (6 + f) * s, C.orange);
}

function torch(g: Gfx, x: number, y: number) {
  g.rect(x - 1, y, 3, 10, C.dbrown);
  g.rect(x - 2, y - 1, 5, 2, C.dgray);
}

function pine(g: Gfx, x: number, base: number, h: number, c: string, dark: string) {
  g.rect(x - 1, base - 4, 3, 4, C.dbrown);
  for (let i = 0; i < 3; i++) {
    const top = base - 4 - h + i * (h / 3.2);
    const w = (h / 3) * (0.6 + i * 0.35);
    g.tri(x, top, x - w, top + h / 2.2, x + w, top + h / 2.2, i % 2 ? dark : c);
  }
}

function palm(g: Gfx, x: number, base: number, lean: number) {
  for (let i = 0; i < 14; i++) {
    const y = base - i * 6;
    const xx = x + (lean * i * i) / 30;
    g.rect(xx - 2, y - 6, 5, 6, i % 2 ? C.brown : C.dbrown);
  }
  const tx = x + (lean * 169) / 30;
  const ty = base - 84;
  const leaves: [number, number][] = [[-26, 8], [26, 10], [-18, -8], [20, -6], [0, -12]];
  for (const [dx, dy] of leaves) {
    g.tri(tx, ty, tx + dx, ty + dy, tx + dx * 0.6, ty + dy + 6, C.green);
    g.tri(tx, ty + 1, tx + dx, ty + dy, tx + dx * 0.5, ty + dy + 2, C.dgreen);
  }
  g.circle(tx - 2, ty + 4, 2, C.dbrown);
  g.circle(tx + 3, ty + 4, 2, C.dbrown);
}

function sea(g: Gfx, y0: number, y1: number, t: number, cols: string[] = [C.lblue, C.sbBlue, C.blue], foam: string = C.lcyan) {
  g.bands(0, y0, W, y1, cols);
  for (let i = 0; i < 26; i++) {
    const y = y0 + 3 + ((i * 7) % (y1 - y0 - 4));
    const x = ((rnd(i) * W + t * (6 + (i % 4) * 3)) % (W + 20)) - 10;
    g.rect(x, y, 4 + (i % 3) * 2, 1, foam);
  }
}

function windowFrame(g: Gfx, x: number, y: number, w: number, h: number, frame: string, arch = false) {
  g.rect(x - 2, y - 2, w + 4, h + 4, frame);
  if (arch) g.ellipse(x + w / 2, y, w / 2 + 2, 8, frame);
}

function bookshelf(g: Gfx, x: number, y: number, w: number, h: number, seed: number) {
  g.rect(x, y, w, h, C.dbrown);
  g.rect(x + 2, y + 2, w - 4, h - 4, "#3a1c08");
  const cols = [C.sbRed, C.sbBlue, C.green, C.sbYellow, C.magenta, C.cyan, C.brown, C.lred, C.lblue, C.cream];
  for (let sy = y + 4, r = 0; sy + 22 < y + h; sy += 26, r++) {
    let bx = x + 3;
    let i = 0;
    while (bx < x + w - 6) {
      const bw = 3 + Math.floor(rnd(seed + r * 31 + i) * 4);
      const bh = 15 + Math.floor(rnd(seed + r * 17 + i * 3) * 7);
      const c = cols[Math.floor(rnd(seed + i * 5 + r) * cols.length)];
      if (rnd(seed + i + r * 9) > 0.93) {
        g.poly([[bx, sy + 22], [bx + bw, sy + 22], [bx + bw + 5, sy + 22 - bh + 2], [bx + 5, sy + 22 - bh + 2]], c);
        bx += bw + 6;
      } else {
        g.rect(bx, sy + 22 - bh, bw, bh, c);
        g.rect(bx, sy + 22 - bh + 3, bw, 1, C.sbYellow);
        bx += bw + (rnd(seed + i * 11) > 0.85 ? 2 : 0);
      }
      i++;
    }
    g.rect(x + 2, sy + 22, w - 4, 3, C.brown);
  }
}

// ---------- scenes ----------
export const SCENE_PAINTERS: Record<SceneId, ScenePainter> = {
  library: {
    floor: 188,
    bg(g) {
      g.dither(0, 0, W, 150, C.dbrown, "#3a1c08");
      bookshelf(g, 4, 10, 108, 142, 3);
      bookshelf(g, 208, 10, 108, 142, 9);
      // Round window with the night sky
      g.ellipse(160, 58, 36, 40, C.dbrown);
      g.ellipse(160, 58, 32, 36, C.navy);
      g.dither(124, 74, 72, 20, C.navy, C.blue);
      stars(g, 22, 24, 90, 5);
      g.circle(172, 42, 7, C.cream);
      g.circle(175, 40, 6, C.navy);
      g.rect(159, 22, 2, 72, C.dbrown);
      g.rect(128, 57, 64, 2, C.dbrown);
      // Sign
      g.rect(122, 2, 76, 11, C.dbrown);
      g.rect(123, 3, 74, 9, C.sbRed);
      g.text("ARCADE LIBRARY", 160, 5, C.sbYellow, 1, "center");
      // Desk with lamp and open book
      g.rect(122, 110, 76, 6, C.brown);
      g.rect(126, 116, 4, 34, C.dbrown);
      g.rect(190, 116, 4, 34, C.dbrown);
      g.poly([[140, 109], [158, 106], [158, 109]], C.white);
      g.poly([[160, 106], [178, 109], [160, 109]], C.cream);
      g.rect(186, 96, 2, 14, C.dgray);
      g.tri(180, 96, 194, 96, 187, 88, C.green);
      // Floor + rug
      planks(g, 150, 200, C.brown, C.dbrown, "#3a1c08");
      g.ellipse(160, 180, 110, 14, C.sbYellow);
      g.ellipse(160, 180, 106, 12, C.sbRed);
      g.dither(80, 176, 160, 8, C.sbRed, C.red);
    },
    anim(g, t) {
      const f = 0.5 + 0.5 * Math.sin(t * 3);
      g.dither(178, 96 + 1, 18, 2, C.sbYellow, f > 0.5 ? C.yellow : C.orange);
      // dust motes in the lamp light
      for (let i = 0; i < 5; i++) g.px(150 + ((i * 13 + t * 4) % 50), 70 + ((i * 17 + t * 6) % 40), C.sbYellow);
    },
  },

  beach: {
    floor: 188,
    bg(g) {
      g.bands(0, 0, W, 86, [C.sbBlue, C.sbSky, "#9cc4ff", "#cfe3ff"]);
      g.circle(262, 30, 13, C.sbYellow);
      g.circle(262, 30, 10, C.yellow);
      cloud(g, 70, 22, 1.2);
      cloud(g, 190, 36, 0.9);
      g.rect(0, 118, W, 82, C.sand);
      g.dither(0, 118, W, 8, C.tan, C.sand);
      g.dither(0, 150, W, 50, C.sand, C.sbYellow);
      // Dock going out to sea
      g.rect(200, 100, 120, 6, C.brown);
      g.rect(200, 105, 120, 1, C.dbrown);
      for (let x = 204; x < W; x += 14) g.rect(x, 106, 3, 16, C.dbrown);
      palm(g, 36, 170, 1.4);
      // shells & a crab
      g.rect(120, 172, 3, 2, C.white);
      g.rect(250, 182, 3, 2, C.lmagenta);
      g.rect(96, 190, 5, 3, C.sbRed);
      g.px(95, 189, C.sbRed);
      g.px(101, 189, C.sbRed);
    },
    back(g, t) {
      sea(g, 86, 118, t);
    },
    anim(g, t) {
      const surf = 118 + Math.round(Math.sin(t * 1.5) * 2);
      g.dither(0, surf - 2, W, 3, C.white, C.lcyan);
      // gull
      const gx = (t * 18) % (W + 40) - 20;
      g.line(gx - 4, 44, gx, 46 + Math.round(Math.sin(t * 8)), C.white);
      g.line(gx, 46 + Math.round(Math.sin(t * 8)), gx + 4, 44, C.white);
    },
  },

  "ship-deck": {
    floor: 190,
    bg(g) {
      g.bands(0, 0, W, 96, [C.sbBlue, C.sbSky, "#cfe3ff"]);
      cloud(g, 60, 30, 1);
      cloud(g, 260, 18, 1.3);
      // mast, sail, rigging
      g.rect(156, 0, 6, 128, C.dbrown);
      g.rect(90, 12, 136, 3, C.dbrown);
      g.poly([[94, 15], [222, 15], [214, 84], [102, 84]], C.cream);
      g.dither(94, 70, 128, 14, C.cream, C.lgray);
      for (let x = 110; x < 214; x += 18) g.line(x, 16, x + (x - 158) / 16, 83, C.lgray);
      g.rect(96, 84, 124, 2, C.dbrown);
      g.circle(158, 48, 12, C.sbRed);
      g.circle(158, 48, 6, C.cream);
      g.line(10, 112, 150, 2, C.dgray);
      g.line(310, 112, 166, 2, C.dgray);
      // rail
      g.rect(0, 108, W, 5, C.brown);
      g.rect(0, 113, W, 1, C.dbrown);
      for (let x = 4; x < W; x += 12) g.rect(x, 114, 4, 18, C.brown);
      g.rect(0, 130, W, 3, C.dbrown);
      // deck with perspective seams
      g.rect(0, 133, W, 67, C.brown);
      for (let i = -8; i <= 8; i++) g.line(160 + i * 12, 133, 160 + i * 40, 200, C.dbrown);
      g.dither(0, 133, W, 6, C.dbrown, C.brown);
      // barrels and a coil of rope
      for (const bx of [22, 44]) {
        g.rect(bx - 9, 146, 18, 26, C.brown);
        g.rect(bx - 9, 150, 18, 2, C.dgray);
        g.rect(bx - 9, 166, 18, 2, C.dgray);
        g.rect(bx - 9, 146, 2, 26, C.dbrown);
      }
      g.ellipse(292, 176, 14, 5, C.tan);
      g.ellipse(292, 176, 9, 3, C.brown);
      g.ellipse(292, 176, 5, 1, C.tan);
    },
    back(g, t) {
      sea(g, 96, 108, t);
    },
    anim(g, t) {
      // flag at the masthead
      for (let i = 0; i < 12; i++) g.rect(162 + i, 2 + Math.round(Math.sin(t * 6 + i * 0.6) * 1.5), 1, 6, i < 6 ? C.sbRed : C.sbBlue);
    },
  },

  "island-jungle": {
    floor: 188,
    bg(g) {
      g.rect(0, 0, W, 200, C.dgreen);
      g.dither(0, 0, W, 60, C.green, C.dgreen);
      // light rays
      for (let i = 0; i < 4; i++) g.poly([[60 + i * 70, 0], [76 + i * 70, 0], [40 + i * 70, 150], [30 + i * 70, 150]], "#1f6a1f");
      // trunks
      for (const [x, w] of [[30, 12], [120, 8], [210, 14], [290, 10]] as [number, number][]) {
        g.rect(x, 0, w, 160, C.dbrown);
        g.rect(x + 2, 0, 2, 160, C.brown);
      }
      // canopy blobs
      for (let i = 0; i < 18; i++) g.ellipse(rnd(i) * W, rnd(i + 40) * 40, 22 + rnd(i + 2) * 16, 10 + rnd(i + 3) * 6, i % 3 ? C.green : C.dgreen);
      // vines
      for (let i = 0; i < 9; i++) {
        const x = 16 + i * 36;
        const len = 40 + rnd(i + 7) * 60;
        g.rect(x, 20, 1, len, C.lgreen);
        for (let y = 26; y < 20 + len; y += 8) g.rect(x - 2, y, 2, 2, C.green);
      }
      // big leaves near the ground
      g.rect(0, 150, W, 50, "#3a2a10");
      g.dither(0, 150, W, 50, "#3a2a10", C.dbrown);
      g.poly([[100, 178], [220, 178], [240, 200], [80, 200]], C.tan);
      g.dither(90, 180, 140, 20, C.tan, C.brown);
      for (let i = 0; i < 10; i++) {
        const x = i * 34 + (i % 2) * 10;
        const y = 150 + (i % 3) * 6;
        g.tri(x, y + 18, x + 18, y - 6, x + 22, y + 16, C.green);
        g.tri(x + 4, y + 18, x - 14, y - 2, x - 10, y + 18, C.lgreen);
      }
      g.circle(70, 160, 3, C.sbRed);
      g.circle(262, 166, 3, C.lmagenta);
      g.circle(262, 166, 1, C.yellow);
    },
    anim(g, t) {
      const bx = 160 + Math.sin(t * 0.7) * 120;
      const by = 90 + Math.sin(t * 1.9) * 20;
      const wing = Math.sin(t * 16) > 0 ? 3 : 1;
      g.rect(bx - wing, by, wing, 3, C.sbYellow);
      g.rect(bx + 1, by, wing, 3, C.sbYellow);
      g.px(bx, by + 1, C.black);
    },
  },

  cave: {
    floor: 188,
    bg(g) {
      g.rect(0, 0, W, 200, "#1a1a24");
      g.dither(0, 0, W, 160, "#1a1a24", C.black);
      // mouth of the cave at the back
      g.ellipse(170, 96, 46, 36, C.navy);
      g.dither(130, 70, 80, 60, C.navy, C.blue);
      // rock masses
      g.poly([[0, 0], [90, 0], [70, 40], [40, 140], [0, 160]], C.dgray);
      g.poly([[320, 0], [230, 0], [250, 50], [276, 150], [320, 160]], C.dgray);
      g.dither(0, 0, 60, 150, C.dgray, C.stone);
      g.dither(270, 0, 50, 150, C.dgray, C.stone);
      // stalactites
      for (let i = 0; i < 14; i++) {
        const x = 20 + i * 22 + rnd(i) * 8;
        g.tri(x - 5, 0, x + 5, 0, x, 14 + rnd(i + 3) * 26, i % 2 ? C.stone : C.dgray);
      }
      // floor
      g.rect(0, 150, W, 50, C.dgray);
      g.dither(0, 150, W, 50, C.dgray, "#3a3a44");
      for (let i = 0; i < 6; i++) g.tri(20 + i * 56, 160, 30 + i * 56, 132 + rnd(i) * 10, 40 + i * 56, 160, C.stone);
      g.ellipse(230, 186, 30, 5, C.blue);
      g.ellipse(230, 186, 24, 3, C.sbBlue);
      torch(g, 60, 90);
      torch(g, 262, 90);
    },
    anim(g, t) {
      flame(g, 60, 86, t);
      flame(g, 262, 86, t + 1);
      // glowing crystals
      const glow = Math.sin(t * 2) > 0 ? C.lcyan : C.cyan;
      g.tri(100, 150, 106, 128, 110, 150, glow);
      g.tri(108, 150, 114, 136, 118, 150, C.lmagenta);
      g.tri(290, 152, 296, 132, 300, 152, glow);
      // drip
      const d = (t * 40) % 60;
      g.px(200, 30 + d, C.lcyan);
    },
  },

  "castle-hall": {
    floor: 190,
    bg(g) {
      bricks(g, 0, 0, W, 150, C.dgray, "#3a3a44");
      g.dither(0, 0, W, 20, C.dgray, "#3a3a44");
      // arched window
      windowFrame(g, 134, 30, 52, 70, C.lgray, true);
      g.rect(134, 30, 52, 70, C.sbBlue);
      g.ellipse(160, 30, 26, 8, C.sbBlue);
      g.rect(134, 62, 52, 38, C.sbRed);
      g.dither(134, 58, 52, 6, C.sbBlue, C.sbRed);
      g.rect(158, 22, 4, 78, C.lgray);
      g.rect(134, 64, 52, 3, C.lgray);
      g.circle(160, 46, 6, C.sbYellow);
      // banners
      for (const [x, c] of [[62, C.sbRed], [244, C.sbBlue]] as [number, string][]) {
        g.rect(x - 16, 14, 32, 2, C.dbrown);
        g.poly([[x - 14, 16], [x + 14, 16], [x + 14, 90], [x, 80], [x - 14, 90]], c);
        g.poly([[x, 34], [x + 8, 46], [x, 58], [x - 8, 46]], C.sbYellow);
      }
      torch(g, 104, 70);
      torch(g, 216, 70);
      // flagstone floor + carpet
      g.rect(0, 150, W, 50, C.stone);
      for (let y = 150, r = 0; y < 200; y += 10, r++) {
        g.rect(0, y, W, 1, C.dgray);
        for (let x = (r % 2) * 14; x < W; x += 28) g.rect(x, y, 1, 10, C.dgray);
      }
      g.poly([[140, 150], [180, 150], [230, 200], [90, 200]], C.sbRed);
      g.line(140, 150, 90, 200, C.sbYellow);
      g.line(180, 150, 230, 200, C.sbYellow);
      g.rect(0, 148, W, 3, "#3a3a44");
    },
    anim(g, t) {
      flame(g, 104, 66, t);
      flame(g, 216, 66, t + 0.4);
    },
  },

  forest: {
    floor: 188,
    bg(g) {
      g.bands(0, 0, W, 110, [C.sbSky, "#9cc4ff", "#cfe3ff"]);
      // distant trees
      for (let i = 0; i < 16; i++) pine(g, i * 22 + 6, 118, 44 + rnd(i) * 20, "#2f7a4a", "#1f5a3a");
      // grass
      g.rect(0, 118, W, 82, C.green);
      g.dither(0, 118, W, 30, C.dgreen, C.green);
      // path
      g.poly([[140, 118], [176, 118], [250, 200], [70, 200]], C.tan);
      g.dither(110, 150, 110, 50, C.tan, C.sand);
      // big trunks and canopy
      for (const [x, w] of [[20, 20], [270, 24], [90, 10], [226, 10]] as [number, number][]) {
        g.rect(x, 0, w, 160, C.dbrown);
        g.rect(x + 3, 0, 3, 160, C.brown);
        g.ellipse(x + w / 2, 160, w / 2 + 4, 3, C.dbrown);
      }
      for (let i = 0; i < 12; i++) g.ellipse(rnd(i + 9) * W, 8 + rnd(i + 19) * 26, 26 + rnd(i) * 14, 12, i % 2 ? C.green : C.dgreen);
      // bushes and mushrooms
      for (const x of [50, 300, 200]) {
        g.ellipse(x, 160, 18, 10, C.dgreen);
        g.ellipse(x + 4, 157, 12, 7, C.green);
      }
      for (const x of [62, 246]) {
        g.rect(x, 180, 2, 5, C.cream);
        g.ellipse(x + 1, 179, 4, 2, C.sbRed);
        g.px(x, 178, C.white);
      }
    },
    anim(g, t) {
      const lx = 180 + Math.sin(t * 1.3) * 30;
      const ly = (t * 14) % 150;
      g.rect(lx, ly, 2, 2, C.orange);
      for (let i = 0; i < 4; i++) {
        const on = Math.sin(t * 3 + i * 2) > 0.3;
        if (on) g.px(40 + i * 70 + Math.sin(t + i) * 8, 130 + Math.cos(t * 1.3 + i) * 10, C.yellow);
      }
    },
  },

  village: {
    floor: 190,
    bg(g) {
      g.bands(0, 0, W, 110, [C.sbSky, "#9cc4ff", "#cfe3ff"]);
      cloud(g, 240, 22, 1.1);
      g.ellipse(80, 118, 120, 30, "#2f7a4a");
      g.ellipse(260, 122, 110, 26, C.green);
      // houses
      const houses: [number, number, number, string, string][] = [
        [10, 70, 60, C.cream, C.sbRed],
        [84, 58, 52, C.tan, C.brown],
        [196, 76, 56, C.cream, C.sbBlue],
        [262, 62, 52, C.tan, C.sbRed],
      ];
      for (const [x, y, w, wall, roof] of houses) {
        const h = 146 - y;
        g.rect(x, y, w, h, wall);
        g.dither(x, y, 4, h, wall, C.lgray);
        g.tri(x - 6, y + 1, x + w + 6, y + 1, x + w / 2, y - 26, roof);
        g.rect(x + w - 14, y - 22, 6, 12, C.dgray);
        g.rect(x + w / 2 - 5, y + h - 20, 10, 20, C.dbrown);
        g.px(x + w / 2 + 3, y + h - 10, C.sbYellow);
        g.rect(x + 6, y + 10, 10, 9, C.sbYellow);
        g.rect(x + w - 16, y + 10, 10, 9, C.sbYellow);
        g.rect(x + 10, y + 10, 1, 9, C.dbrown);
        g.rect(x + w - 12, y + 10, 1, 9, C.dbrown);
      }
      // cobbles
      g.rect(0, 146, W, 54, C.lgray);
      for (let y = 148, r = 0; y < 200; y += 6, r++) for (let x = (r % 2) * 5; x < W; x += 10) g.rect(x, y, 8, 4, r % 3 ? C.stone : "#9a9aaa");
      // well
      g.rect(150, 128, 26, 18, C.dgray);
      g.rect(150, 128, 26, 3, C.stone);
      g.rect(150, 108, 2, 20, C.dbrown);
      g.rect(174, 108, 2, 20, C.dbrown);
      g.tri(146, 110, 180, 110, 163, 98, C.brown);
    },
    anim(g, t) {
      for (const [x, y] of [[59, 36], [128, 24], [241, 42], [305, 28]] as [number, number][]) {
        for (let i = 0; i < 3; i++) {
          const k = (t * 0.6 + i / 3) % 1;
          g.circle(x + Math.sin(t + i) * 3 + k * 6, y - k * 24, 2 + k * 3, k > 0.6 ? "#cfe3ff" : C.lgray);
        }
      }
    },
  },

  "mountain-pass": {
    floor: 190,
    bg(g) {
      g.bands(0, 0, W, 120, [C.sbBlue, C.sbSky, "#cfe3ff"]);
      g.poly([[0, 120], [60, 40], [120, 110], [180, 30], [250, 100], [300, 50], [320, 70], [320, 120]], C.purple);
      for (const [x, y] of [[60, 40], [180, 30], [300, 50]] as [number, number][]) g.tri(x - 12, y + 14, x + 12, y + 14, x, y, C.white);
      g.poly([[0, 140], [40, 80], [100, 130], [160, 70], [230, 130], [280, 90], [320, 120], [320, 150], [0, 150]], C.dgray);
      g.dither(0, 110, W, 40, C.dgray, C.stone);
      for (let i = 0; i < 9; i++) pine(g, 10 + i * 38, 150, 26 + rnd(i) * 10, C.dgreen, "#0f3a1f");
      // rocky path
      g.rect(0, 150, W, 50, C.brown);
      g.dither(0, 150, W, 50, C.brown, C.tan);
      for (let i = 0; i < 12; i++) g.ellipse(rnd(i + 5) * W, 160 + rnd(i + 8) * 36, 5 + rnd(i) * 6, 3, i % 2 ? C.stone : C.dgray);
      g.poly([[0, 150], [30, 150], [0, 200]], C.dgray);
      g.poly([[320, 150], [290, 150], [320, 200]], C.dgray);
    },
    anim(g, t) {
      cloud(g, ((t * 6) % 400) - 40, 26, 1);
      cloud(g, ((t * 4 + 200) % 400) - 40, 50, 0.7);
      const ex = ((t * 20) % 380) - 30;
      const ey = 38 + Math.sin(t) * 6;
      const up = Math.sin(t * 5) > 0;
      g.line(ex - 5, ey + (up ? -2 : 1), ex, ey, C.dbrown);
      g.line(ex, ey, ex + 5, ey + (up ? -2 : 1), C.dbrown);
    },
  },

  "space-bridge": {
    floor: 190,
    bg(g) {
      g.rect(0, 0, W, 200, "#1c2440");
      for (let x = 0; x < W; x += 40) g.rect(x, 0, 1, 150, "#2a3560");
      // viewport
      g.rect(36, 8, 248, 88, C.lgray);
      g.rect(40, 12, 240, 80, C.deep);
      g.rect(40, 12, 240, 1, C.stone);
      // consoles
      g.poly([[0, 120], [320, 120], [320, 150], [0, 150]], "#2a3560");
      g.rect(0, 118, W, 3, C.lgray);
      for (let x = 12; x < W; x += 60) {
        g.rect(x, 124, 40, 18, C.deep);
        for (let i = 0; i < 6; i++) g.rect(x + 3 + i * 6, 138 - Math.floor(rnd(x + i) * 12), 4, 1 + Math.floor(rnd(x + i) * 12), C.cyan);
      }
      // floor panels
      g.rect(0, 150, W, 50, "#2a3560");
      for (let y = 150; y < 200; y += 10) g.rect(0, y, W, 1, "#1c2440");
      for (let i = -6; i <= 6; i++) g.line(160 + i * 14, 150, 160 + i * 40, 200, "#1c2440");
      g.rect(0, 150, W, 2, C.sbSky);
    },
    anim(g, t) {
      g.rect(40, 13, 240, 79, C.deep);
      for (let i = 0; i < 40; i++) {
        const k = (rnd(i) + t * 0.15 * (0.5 + rnd(i + 3))) % 1;
        const ang = rnd(i + 9) * Math.PI * 2;
        const r = k * 150;
        const x = 160 + Math.cos(ang) * r;
        const y = 52 + Math.sin(ang) * r * 0.5;
        if (x > 40 && x < 279 && y > 13 && y < 91) g.rect(x, y, k > 0.6 ? 2 : 1, 1, k > 0.5 ? C.white : C.lgray);
      }
      g.circle(236, 70, 12, C.orange);
      g.circle(240, 66, 10, C.sbYellow);
      g.dither(224, 64, 24, 14, C.orange, C.sbRed);
      for (let x = 12; x < W; x += 60) {
        for (let i = 0; i < 4; i++) {
          const on = Math.floor(t * 3 + i + x) % 3 === 0;
          g.rect(x + 44 + (i % 2) * 5, 126 + Math.floor(i / 2) * 5, 3, 3, on ? [C.sbRed, C.lgreen, C.sbYellow, C.lcyan][i] : C.dgray);
        }
      }
    },
  },

  "space-corridor": {
    floor: 190,
    bg(g) {
      g.rect(0, 0, W, 200, "#2a3560");
      g.poly([[0, 0], [110, 50], [110, 130], [0, 190]], "#3a4680");
      g.poly([[320, 0], [210, 50], [210, 130], [320, 190]], "#3a4680");
      g.poly([[0, 0], [320, 0], [210, 50], [110, 50]], "#1c2440");
      g.poly([[0, 200], [320, 200], [210, 130], [110, 130]], C.dgray);
      for (let i = 0; i < 8; i++) {
        const k = i / 8;
        const y = 130 + Math.pow(k, 1.6) * 70;
        g.line(110 - k * 110, y, 210 + k * 110, y, C.stone);
      }
      g.rect(110, 50, 100, 80, C.deep);
      g.rect(140, 66, 40, 64, C.lgray);
      g.rect(159, 66, 2, 64, C.dgray);
      // side doors
      g.poly([[20, 40], [70, 62], [70, 140], [20, 162]], C.stone);
      g.poly([[300, 40], [250, 62], [250, 140], [300, 162]], C.stone);
      g.poly([[26, 48], [64, 65], [64, 137], [26, 154]], C.lgray);
      g.poly([[294, 48], [256, 65], [256, 137], [294, 154]], C.lgray);
      // pipes
      g.line(0, 12, 110, 56, C.lgray);
      g.line(320, 12, 210, 56, C.lgray);
    },
    anim(g, t) {
      for (let i = 0; i < 5; i++) {
        const k = i / 5;
        const on = Math.floor(t * 4 - i) % 5 === 0;
        g.rect(160 - (50 + k * 100), 44 - k * 40, 100 + k * 200, 2, on ? C.lcyan : C.cyan);
      }
      g.rect(48, 96, 4, 4, Math.sin(t * 3) > 0 ? C.sbRed : C.red);
      g.rect(268, 96, 4, 4, Math.sin(t * 2) > 0 ? C.lgreen : C.green);
      g.rect(156, 58, 8, 3, Math.sin(t * 5) > 0 ? C.sbYellow : C.brown);
    },
  },

  "planet-surface": {
    floor: 190,
    bg(g) {
      g.bands(0, 0, W, 130, [C.deep, C.purple, C.magenta, C.lmagenta]);
      stars(g, 50, 0, 60, 21);
      // ringed planet + moons
      g.circle(80, 44, 22, C.orange);
      g.dither(58, 40, 44, 26, C.orange, C.sbRed);
      g.ellipse(80, 48, 40, 5, C.sbYellow);
      g.ellipse(80, 48, 34, 3, C.purple);
      g.rect(58, 45, 44, 3, C.orange);
      g.circle(250, 28, 6, C.lgray);
      g.circle(280, 50, 3, C.cream);
      // ground
      g.poly([[0, 130], [60, 120], [140, 132], [220, 118], [320, 128], [320, 200], [0, 200]], C.brown);
      g.dither(0, 130, W, 70, C.brown, C.orange);
      for (let i = 0; i < 7; i++) {
        const x = 20 + rnd(i + 3) * 280;
        const y = 150 + rnd(i + 9) * 40;
        const r = 6 + rnd(i) * 10;
        g.ellipse(x, y, r, r / 3, C.dbrown);
        g.ellipse(x, y - 1, r - 2, r / 3 - 1, "#8a3a10");
      }
      // rocket
      g.rect(276, 96, 14, 40, C.lgray);
      g.tri(276, 96, 290, 96, 283, 80, C.sbRed);
      g.tri(270, 136, 276, 120, 276, 136, C.sbRed);
      g.tri(296, 136, 290, 120, 290, 136, C.sbRed);
      g.circle(283, 108, 3, C.sbSky);
    },
    anim(g, t) {
      for (let i = 0; i < 4; i++) {
        const x = 30 + i * 60;
        const sway = Math.round(Math.sin(t * 1.5 + i) * 2);
        g.line(x, 150, x + sway, 128, C.cyan);
        g.circle(x + sway, 126, 3, Math.sin(t * 2 + i) > 0 ? C.lcyan : C.cyan);
      }
    },
  },

  "museum-hall": {
    floor: 190,
    bg(g) {
      g.rect(0, 0, W, 150, C.cream);
      g.dither(0, 0, W, 16, C.tan, C.cream);
      g.rect(0, 120, W, 30, C.tan);
      g.rect(0, 120, W, 2, C.brown);
      // columns
      for (const x of [18, 286]) {
        g.rect(x, 12, 18, 138, C.white);
        g.rect(x + 3, 12, 2, 138, C.lgray);
        g.rect(x + 10, 12, 2, 138, C.lgray);
        g.rect(x - 4, 8, 26, 6, C.lgray);
        g.rect(x - 4, 144, 26, 6, C.lgray);
      }
      // paintings
      const frames: [number, number, number, number][] = [[58, 30, 56, 40], [206, 26, 52, 48]];
      for (const [x, y, w, h] of frames) {
        g.rect(x - 4, y - 4, w + 8, h + 8, C.sbYellow);
        g.rect(x - 2, y - 2, w + 4, h + 4, C.brown);
      }
      g.bands(58, 30, 56, 70, [C.sbSky, "#cfe3ff"]);
      g.poly([[58, 70], [80, 48], [100, 62], [114, 54], [114, 70]], C.green);
      g.circle(100, 40, 4, C.sbYellow);
      g.rect(206, 26, 52, 48, C.dbrown);
      g.ellipse(232, 48, 12, 14, "#f0b890");
      g.rect(218, 60, 28, 14, C.sbRed);
      g.rect(226, 38, 12, 4, C.dbrown);
      // display case on a pedestal
      g.rect(140, 96, 40, 50, C.lgray);
      g.rect(142, 98, 36, 4, C.white);
      g.rect(136, 70, 48, 28, "#bfe8ff");
      g.dither(136, 70, 48, 28, "#bfe8ff", C.white);
      g.rect(136, 70, 48, 1, C.dgray);
      // floor: checkered marble
      for (let r = 0; r < 5; r++) {
        const y0 = 150 + r * 10;
        for (let c = -10; c < 20; c++) {
          const k = (r + c) % 2;
          const x0 = 160 + (c - 5) * (16 + r * 4);
          g.rect(x0, y0, 16 + r * 4, 10, k ? C.white : C.dgray);
        }
      }
      // velvet ropes
      for (const x of [110, 210]) {
        g.rect(x, 150, 3, 22, C.sbYellow);
        g.rect(x - 2, 170, 7, 3, C.sbYellow);
      }
      for (let x = 112; x < 211; x++) g.px(x, 154 + Math.round(Math.sin(((x - 112) / 99) * Math.PI) * 6), C.sbRed);
    },
    anim(g, t) {
      g.rect(300, 20, 10, 6, C.dgray);
      g.rect(296, 22, 4, 2, C.dgray);
      g.px(303, 22, Math.sin(t * 4) > 0 ? C.sbRed : C.dgray);
    },
  },

  "museum-vault": {
    floor: 190,
    bg(g) {
      g.rect(0, 0, W, 150, C.stone);
      for (let x = 0; x < W; x += 32) {
        g.rect(x, 0, 1, 150, C.dgray);
        for (let y = 6; y < 150; y += 20) {
          g.px(x + 4, y, C.lgray);
          g.px(x + 27, y, C.lgray);
        }
      }
      // big round vault door (swung open) on the right
      g.circle(264, 78, 50, C.dgray);
      g.circle(264, 78, 44, C.lgray);
      g.circle(264, 78, 36, C.stone);
      g.circle(264, 78, 8, C.dgray);
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        g.line(264, 78, 264 + Math.cos(a) * 26, 78 + Math.sin(a) * 26, C.dgray);
      }
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        g.circle(264 + Math.cos(a) * 40, 78 + Math.sin(a) * 40, 2, C.white);
      }
      // shelves of gold
      g.rect(10, 60, 70, 4, C.dgray);
      g.rect(10, 100, 70, 4, C.dgray);
      for (let i = 0; i < 5; i++) {
        g.rect(14 + i * 13, 52, 10, 8, C.sbYellow);
        g.rect(14 + i * 13, 52, 10, 2, C.yellow);
      }
      for (let i = 0; i < 3; i++) g.circle(22 + i * 22, 94, 5, C.sbYellow);
      // pedestal
      g.rect(146, 108, 28, 42, C.lgray);
      g.rect(142, 104, 36, 6, C.white);
      // floor
      g.rect(0, 150, W, 50, C.dgray);
      for (let x = 0; x < W; x += 8) g.rect(x, 150, 1, 50, "#3a3a44");
      for (let y = 150; y < 200; y += 8) g.rect(0, y, W, 1, "#3a3a44");
    },
    anim(g, t) {
      const s = Math.floor(t * 4) % 4;
      g.poly([[160, 84], [168, 94], [160, 104], [152, 94]], C.lcyan);
      g.poly([[160, 88], [164, 94], [160, 100], [156, 94]], C.white);
      if (s === 0) { g.px(166, 86, C.white); g.px(154, 100, C.white); }
      const on = Math.sin(t * 1.2) > -0.3;
      if (on) {
        g.line(0, 120, 140, 160, C.lred);
        g.line(0, 160, 140, 118, C.lred);
        g.line(180, 118, 320, 150, C.lred);
      }
    },
  },

  "city-street": {
    floor: 186,
    bg(g) {
      g.bands(0, 0, W, 120, [C.deep, C.navy, "#1c2460"]);
      stars(g, 30, 0, 50, 41);
      g.circle(40, 22, 8, C.cream);
      let x = 0;
      let i = 0;
      while (x < W) {
        const w = 26 + Math.floor(rnd(i + 2) * 30);
        const h = 50 + Math.floor(rnd(i + 5) * 80);
        const top = 150 - h;
        g.rect(x, top, w - 2, h, i % 2 ? "#1c2440" : "#2a2a4a");
        for (let wy = top + 6; wy < 140; wy += 10) for (let wx = x + 4; wx < x + w - 8; wx += 8) if (rnd(wx * 3 + wy) > 0.45) g.rect(wx, wy, 4, 5, C.sbYellow);
        x += w;
        i++;
      }
      // sidewalk + road
      g.rect(0, 146, W, 44, C.stone);
      g.dither(0, 146, W, 44, C.stone, C.lgray);
      for (let x2 = 0; x2 < W; x2 += 32) g.rect(x2, 146, 1, 44, C.dgray);
      g.rect(0, 190, W, 10, C.dgray);
      g.rect(0, 189, W, 2, C.lgray);
      for (let x2 = 10; x2 < W; x2 += 40) g.rect(x2, 196, 20, 2, C.sbYellow);
      // lamps
      for (const lx of [70, 250]) {
        g.rect(lx, 96, 3, 54, C.dgray);
        g.rect(lx - 4, 92, 11, 4, C.dgray);
      }
      g.rect(296, 170, 8, 14, C.sbRed);
      g.rect(294, 168, 12, 3, C.sbRed);
      // neon sign
      g.rect(130, 70, 60, 16, C.deep);
      g.text("DINER", 160, 76, C.lmagenta, 1, "center");
    },
    anim(g, t) {
      for (const lx of [70, 250]) {
        g.rect(lx - 3, 96, 9, 3, C.yellow);
        g.dither(lx - 18, 100, 39, 46, "#2a2a4a", C.sbYellow);
      }
      if (Math.sin(t * 3) > -0.8) g.rect(128, 68, 64, 1, C.lmagenta);
    },
  },

  lab: {
    floor: 190,
    bg(g) {
      g.rect(0, 0, W, 150, C.white);
      for (let x = 0; x < W; x += 10) g.rect(x, 0, 1, 150, "#d8e0e8");
      for (let y = 0; y < 150; y += 10) g.rect(0, y, W, 1, "#d8e0e8");
      // whiteboard with formulas
      g.rect(100, 16, 120, 60, C.lgray);
      g.rect(102, 18, 116, 56, C.white);
      g.text("E = MC", 112, 26, C.sbBlue);
      g.text("H2O", 170, 30, C.sbRed);
      g.line(112, 46, 150, 40, C.green);
      g.line(150, 40, 170, 60, C.green);
      g.line(170, 60, 204, 44, C.green);
      // shelves of beakers
      g.rect(8, 50, 70, 3, C.dgray);
      g.rect(242, 50, 70, 3, C.dgray);
      const beaker = (x: number, y: number, c: string) => {
        g.rect(x, y - 12, 8, 12, "#cfe3ff");
        g.rect(x + 1, y - 7, 6, 7, c);
        g.rect(x + 2, y - 15, 4, 3, "#cfe3ff");
      };
      [C.lgreen, C.lmagenta, C.lcyan, C.sbYellow, C.lred].forEach((c, i) => {
        beaker(12 + i * 13, 50, c);
        beaker(246 + i * 13, 50, [C.lcyan, C.sbYellow, C.lgreen, C.lred, C.lmagenta][i]);
      });
      // machine
      g.rect(250, 70, 60, 80, C.stone);
      g.rect(256, 78, 48, 24, C.deep);
      for (let i = 0; i < 3; i++) g.circle(264 + i * 16, 118, 5, C.lgray);
      // bench
      g.rect(10, 120, 120, 6, C.dgray);
      g.rect(14, 126, 4, 24, C.dgray);
      g.rect(122, 126, 4, 24, C.dgray);
      // tiled floor
      for (let y = 150, r = 0; y < 200; y += 10, r++) for (let x = 0, c = 0; x < W; x += 20, c++) g.rect(x, y, 20, 10, (r + c) % 2 ? C.lgray : "#c8d0d8");
    },
    anim(g, t) {
      // bubbling flasks on the bench
      g.poly([[30, 120], [44, 120], [40, 104], [34, 104]], C.lgreen);
      g.poly([[80, 120], [96, 120], [92, 100], [84, 100]], C.lmagenta);
      for (let i = 0; i < 3; i++) {
        const k = (t * 0.8 + i / 3) % 1;
        g.px(37 + Math.sin(t * 4 + i) * 2, 100 - k * 20, C.lgreen);
        g.px(88 + Math.cos(t * 4 + i) * 2, 96 - k * 20, C.lmagenta);
      }
      for (let i = 0; i < 12; i++) g.rect(258 + i * 4, 98 - Math.abs(Math.sin(t * 3 + i)) * 16, 2, 2, C.lgreen);
      for (let i = 0; i < 3; i++) g.px(264 + i * 16, 118, Math.floor(t * 2 + i) % 2 ? C.sbRed : C.lgreen);
    },
  },

  lighthouse: {
    floor: 190,
    bg(g) {
      g.bands(0, 0, W, 112, [C.navy, C.purple, C.magenta, C.orange]);
      stars(g, 30, 0, 40, 61);
      // rocks and grass
      g.poly([[0, 100], [40, 90], [150, 104], [210, 126], [320, 130], [320, 200], [0, 200]], C.dgray);
      g.poly([[0, 112], [50, 102], [130, 110], [190, 130], [0, 142]], C.stone);
      g.poly([[20, 116], [60, 110], [110, 116], [60, 126]], C.lgray);
      g.poly([[0, 140], [320, 150], [320, 200], [0, 200]], C.dgreen);
      g.dither(0, 140, W, 60, C.dgreen, C.green);
      // tower
      g.poly([[70, 36], [104, 36], [112, 140], [62, 140]], C.white);
      for (let i = 0; i < 4; i++) {
        const y = 48 + i * 24;
        const k = (y - 36) / 104;
        g.poly([[70 - k * 8, y], [104 + k * 8, y], [104 + (k + 0.1) * 8, y + 10], [70 - (k + 0.1) * 8, y + 10]], C.sbRed);
      }
      g.rect(64, 30, 46, 6, C.dgray);
      g.rect(72, 14, 30, 16, C.navy);
      g.tri(68, 14, 106, 14, 87, 2, C.sbRed);
      g.rect(82, 118, 10, 22, C.dbrown);
    },
    back(g, t) {
      sea(g, 112, 142, t, [C.blue, C.sbBlue], C.sbSky);
    },
    anim(g, t) {
      const a = t * 1.2;
      const dir = Math.cos(a);
      const len = 170 * Math.abs(dir);
      const x = 87;
      const y = 22;
      if (Math.abs(dir) > 0.1) g.poly([[x, y - 2], [x + dir * len, y - 14], [x + dir * len, y + 14], [x, y + 2]], "#fff7a8");
      g.rect(74, 16, 26, 12, C.yellow);
      g.rect(86, 16, 2, 12, C.sbYellow);
    },
  },

  "stormy-sea": {
    floor: 190,
    bg(g) {
      g.bands(0, 0, W, 110, ["#1a1a24", C.dgray, "#3a3a50"]);
      for (let i = 0; i < 8; i++) g.ellipse(rnd(i + 70) * W, 10 + rnd(i + 80) * 50, 40, 12, i % 2 ? C.dgray : "#2a2a36");
      // deck in the foreground
      g.rect(0, 150, W, 50, C.dbrown);
      for (let i = -8; i <= 8; i++) g.line(160 + i * 14, 150, 160 + i * 40, 200, "#3a1c08");
      g.rect(0, 136, W, 4, C.brown);
      for (let x = 6; x < W; x += 14) g.rect(x, 140, 3, 10, C.brown);
    },
    anim(g, t) {
      // heaving waves behind the rail
      g.rect(0, 100, W, 36, C.blue);
      for (let x = 0; x < W; x += 2) {
        const y = 104 + Math.sin(x / 18 + t * 2) * 8 + Math.sin(x / 7 - t * 3) * 2;
        g.rect(x, y, 2, 136 - y, C.sbBlue);
        g.px(x, y, C.white);
      }
      g.rect(0, 136, W, 4, C.brown);
      for (let x = 6; x < W; x += 14) g.rect(x, 140, 3, 10, C.brown);
      // rain
      for (let i = 0; i < 50; i++) {
        const x = (rnd(i) * 360 + t * 60) % 340 - 10;
        const y = (rnd(i + 5) * 200 + t * 200) % 200;
        g.line(x, y, x - 2, y + 5, "#8aa0c8");
      }
      // lightning
      const f = (t % 5) / 5;
      if (f < 0.04) {
        g.dither(0, 0, W, 100, C.lgray, "#3a3a50");
        g.line(220, 0, 210, 30, C.white);
        g.line(210, 30, 226, 44, C.white);
        g.line(226, 44, 214, 90, C.white);
      }
    },
  },

  school: {
    floor: 190,
    bg(g) {
      g.rect(0, 0, W, 150, "#9ac8a8");
      g.dither(0, 110, W, 40, "#9ac8a8", "#7aa888");
      g.rect(0, 108, W, 3, C.brown);
      // chalkboard
      g.rect(90, 20, 140, 70, C.brown);
      g.rect(94, 24, 132, 62, "#1f4a2f");
      g.text("READ ALL", 104, 32, C.white);
      g.text("ABOUT IT!", 104, 42, C.sbYellow);
      g.line(104, 60, 150, 60, C.white);
      g.text("3 + 4 = 7", 150, 70, C.white);
      g.rect(94, 86, 132, 3, C.dbrown);
      g.rect(120, 85, 8, 2, C.white);
      // windows
      for (const x of [14, 250]) {
        g.rect(x, 22, 56, 60, C.white);
        g.bands(x + 3, 25, 50, 79, [C.sbSky, "#cfe3ff"]);
        g.ellipse(x + 30, 70, 14, 10, C.green);
        g.rect(x + 28, 70, 3, 10, C.dbrown);
        g.rect(x + 27, 22, 2, 60, C.white);
        g.rect(x, 50, 56, 2, C.white);
      }
      // clock + alphabet
      g.circle(160, 10, 7, C.white);
      g.circle(160, 10, 6, C.cream);
      g.line(160, 10, 160, 6, C.black);
      g.line(160, 10, 163, 10, C.black);
      g.text("ABCDEFG", 10, 96, C.sbRed);
      g.text("HIJKLMN", 258, 96, C.sbBlue);
      // floor + desks
      planks(g, 150, 200, C.tan, C.brown, C.brown);
      for (const x of [20, 250]) {
        g.rect(x, 150, 50, 5, C.brown);
        g.rect(x + 4, 155, 3, 25, C.dgray);
        g.rect(x + 43, 155, 3, 25, C.dgray);
      }
      g.circle(40, 146, 3, C.sbRed);
      g.px(40, 142, C.green);
      g.rect(0, 148, W, 2, C.dbrown);
    },
  },

  train: {
    floor: 190,
    bg(g) {
      g.rect(0, 0, W, 150, "#6a1a1a");
      g.dither(0, 0, W, 150, "#6a1a1a", C.red);
      g.rect(0, 0, W, 12, C.dbrown);
      // luggage rack
      g.rect(0, 20, W, 3, C.sbYellow);
      g.rect(20, 12, 30, 8, C.brown);
      g.rect(200, 14, 22, 6, C.sbBlue);
      // windows (outside drawn in anim)
      for (let x = 12; x < W; x += 76) g.rect(x - 3, 29, 62, 56, C.dbrown);
      g.rect(0, 92, W, 4, C.dbrown);
      // seats
      for (let x = 4; x < W; x += 76) {
        g.rect(x, 100, 30, 44, C.sbBlue);
        g.rect(x, 100, 30, 3, C.lblue);
        g.rect(x + 36, 100, 30, 44, C.sbBlue);
        g.rect(x + 36, 100, 30, 3, C.lblue);
      }
      // aisle carpet
      g.rect(0, 150, W, 50, C.dbrown);
      g.poly([[110, 150], [210, 150], [250, 200], [70, 200]], C.sbRed);
      g.dither(80, 170, 160, 30, C.sbRed, C.red);
      g.rect(0, 146, W, 4, C.brown);
    },
    anim(g, t) {
      for (let x = 12; x < W; x += 76) {
        g.bands(x, 32, 56, 70, [C.sbSky, "#cfe3ff"]);
        // scrolling hills and poles, clipped to the window
        for (let px = 0; px < 56; px++) {
          const wx = px + x + t * 40;
          const h = 10 + Math.sin(wx / 30) * 6 + Math.sin(wx / 11) * 2;
          g.rect(x + px, 82 - h, 1, h, px % 2 ? C.green : C.dgreen);
        }
        const pole = ((t * 90 + x * 3) % 140) - 20;
        if (pole > 0 && pole < 54) g.rect(x + pole, 40, 2, 42, C.dbrown);
        g.rect(x + 27, 32, 2, 50, C.dbrown);
      }
      const shake = Math.sin(t * 20) > 0.9 ? 1 : 0;
      g.rect(0, 146 + shake, W, 1, C.dbrown);
    },
  },

  // A frosty cryo bay on a space station: frozen sleep pods, icicles, an icy floor and
  // drifting cold mist.
  "cryo-bay": {
    floor: 190,
    bg(g) {
      g.rect(0, 0, W, 150, "#1d2f4a");
      for (let x = 0; x < W; x += 32) g.rect(x, 16, 1, 134, "#2c4466");
      g.rect(0, 84, W, 1, "#2c4466");
      // frost creeping in from the top corners
      g.poly([[0, 16], [70, 16], [0, 70]], "#3d6488");
      g.poly([[320, 16], [250, 16], [320, 70]], "#3d6488");
      g.dither(0, 16, 46, 26, C.lcyan, "#3d6488");
      g.dither(274, 16, 46, 26, C.lcyan, "#3d6488");
      // ceiling pipe
      g.rect(0, 0, W, 10, C.deep);
      g.rect(0, 10, W, 6, C.lgray);
      g.rect(0, 10, W, 1, C.white);
      g.rect(0, 15, W, 1, C.stone);
      for (let x = 24; x < W; x += 64) g.rect(x, 9, 6, 8, C.stone);
      // porthole with stars and an icy moon
      g.circle(160, 40, 21, C.stone);
      g.circle(160, 40, 18, C.deep);
      for (let i = 0; i < 16; i++) {
        const a = rnd(i + 41) * Math.PI * 2;
        const r = rnd(i + 43) * 16;
        g.px(160 + Math.cos(a) * r, 40 + Math.sin(a) * r, i % 4 ? C.white : C.sbYellow);
      }
      g.circle(168, 46, 7, "#cfe3ff");
      g.dither(162, 42, 12, 10, "#cfe3ff", C.lcyan);
      g.text("CRYO BAY", 160, 66, C.lcyan, 1, "center", C.deep);
      // sleep pods
      for (const cx of [30, 113, 207, 290]) {
        g.rect(cx - 19, 142, 38, 8, C.dgray);
        g.rect(cx - 17, 52, 34, 92, C.stone);
        g.ellipse(cx, 54, 17, 6, C.stone);
        g.rect(cx - 13, 58, 26, 72, "#9fd8f0");
        g.dither(cx - 13, 58, 26, 72, "#9fd8f0", "#dff6ff");
        g.rect(cx - 10, 62, 4, 40, C.white);
        g.rect(cx - 13, 130, 26, 2, C.lgray);
        g.rect(cx - 8, 134, 16, 6, C.deep);
        // frost on the glass edges
        g.dither(cx - 13, 58, 26, 6, C.white, "#dff6ff");
        g.dither(cx - 13, 122, 26, 8, C.white, "#9fd8f0");
      }
      // icicles under the pipe
      for (let i = 0; i < 22; i++) {
        const x = 6 + i * 14 + Math.floor(rnd(i + 70) * 6);
        const h = 4 + Math.floor(rnd(i + 90) * 9);
        g.tri(x, 16, x + 4, 16, x + 2, 16 + h, i % 3 ? C.lcyan : C.white);
      }
      // icy floor
      g.rect(0, 150, W, 50, "#7aa6c4");
      for (let y = 150, r = 0; y < 200; y += 10, r++) for (let x = 0, c = 0; x < W; x += 32, c++) if ((r + c) % 2) g.rect(x, y, 32, 10, "#8db8d4");
      g.dither(0, 150, W, 6, C.white, "#7aa6c4");
      g.rect(0, 148, W, 2, C.lgray);
      for (let i = 0; i < 9; i++) {
        const x = 10 + rnd(i + 30) * 290;
        const y = 158 + rnd(i + 50) * 36;
        g.line(x, y, x + 14, y - 3, "#dff6ff");
      }
    },
    anim(g, t) {
      // pod status lights
      [30, 113, 207, 290].forEach((cx, i) => {
        const on = Math.floor(t * 2 + i * 0.7) % 3;
        g.rect(cx - 6, 136, 3, 2, on === 0 ? C.lcyan : C.cyan);
        g.rect(cx - 1, 136, 3, 2, on === 1 ? C.lgreen : C.green);
        g.rect(cx + 4, 136, 3, 2, on === 2 ? C.sbYellow : C.brown);
      });
      // ice sparkles drifting down from the icicles
      for (let i = 0; i < 14; i++) {
        const x = (rnd(i + 5) * W + Math.sin(t + i) * 4 + W) % W;
        const y = 20 + ((rnd(i + 8) * 130 + t * (8 + rnd(i) * 8)) % 130);
        g.px(x, y, Math.sin(t * 3 + i) > 0 ? C.white : C.lcyan);
      }
      // cold mist rolling along the floor
      g.ctx.globalAlpha = 0.35;
      for (let i = 0; i < 6; i++) {
        const x = ((t * (10 + i * 3) + i * 70) % (W + 80)) - 40;
        g.ellipse(x, 186 - (i % 3) * 5, 30, 4, C.white);
      }
      g.ctx.globalAlpha = 1;
    },
  },
};
