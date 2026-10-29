/*
 * Quest of the Lost Library: pixel art, all drawn in code (no image files). The 320 x 200 screen is
 * an 8 px title band plus the 20 x 12 room of 16 px tiles. The room's still parts are cached on an
 * offscreen canvas and redrawn only when something changes; torches, water, crystals, vents, timed
 * gates, conveyors, the hero, pests and effects are drawn every frame. Every quest has its own
 * theme (quest.ts Theme): wall and floor styles and colours per area, decorations, crates, its
 * helper, pests and guardians (art.ts).
 */
import { drawCrate, drawHelper, drawPest, drawPoof, drawQuestGuardian, hash } from "./art";
import { Game, type Enemy, type Fx } from "./game";
import { COLS, ROWS, type Dir, type FloorStyle, type Pal, type RoomDef, type Theme, type WallStyle } from "./quest";

export const W = 320;
export const H = 200;
export const TOP = 8;
const T = 16;

const BOOK_COLORS = ["#e3262f", "#2456e8", "#ffd23f", "#2fbf71", "#b05cff", "#ff8a3d", "#f2f4ff", "#3ad6c6", "#ff6fb5"];

type Ctx = CanvasRenderingContext2D;
const rect = (c: Ctx, color: string, x: number, y: number, w: number, h: number) => {
  c.fillStyle = color;
  c.fillRect(x, y, w, h);
};

/* ----------------------------------------------------------------------------- the hero */

// Pip Lampwick, junior page-keeper: teal cloak, yellow scarf, brown hair. 16 x 16, 2 walk frames.
const HERO_PAL: Record<string, string> = {
  k: "#1a1030", h: "#7a4320", s: "#f2c29b", e: "#1a1030", r: "#e0737a", y: "#ffd23f", c: "#2a9d8f", C: "#1d6f66", b: "#4a2c1a",
};
const LEGS_A = ["...kCCCCCCCCk...", "...kbbk..kbbk...", "...kbbk..kbbk...", "....kk....kk...."];
const LEGS_B = ["...kCCCCCCCCk...", "...kbbk..kbbk...", "...kbbk...kk....", "....kk.........."];
const BODY = ["...kyyyyyyyyk...", "..kcccyycccck...", ".kscccccccccsk..", ".kscccccccccsk.."];
const HERO: Record<"down" | "up" | "side", string[]> = {
  down: [
    "................", ".....kkkkkk.....", "....khhhhhhk....", "...khhhhhhhhk...", "...khsssssshk...",
    "...ksessssesk...", "...kssssssssk...", "....kssrrssk....",
  ],
  up: [
    "................", ".....kkkkkk.....", "....khhhhhhk....", "...khhhhhhhhk...", "...khhhhhhhhk...",
    "...khhhhhhhhk...", "...khhhhhhhhk...", "....khhhhhhk....",
  ],
  side: [
    "................", ".....kkkkkk.....", "....khhhhhhk....", "...khhhhhhhhk...", "...khhhhhssssk..",
    "...khhhhsssesk..", "...khhhssssssk..", "....khhsssssk...",
  ],
};
const SIDE_BODY = ["...kyyyyyyyyk...", "...kcccccyyyk...", "...kcccccscck...", "...kcccccccck..."];
const SIDE_LEGS_A = ["...kCCCCCCCCk...", "....kbbkkbbk....", "....kbbk.kbbk...", "....kkk...kkk..."];
const SIDE_LEGS_B = ["...kCCCCCCCCk...", "....kbbkkbbk....", "....kbbkkbbk....", ".....kkkkkk....."];

export const HERO_SPRITES: Record<string, string[]> = {
  "down-0": [...HERO.down, ...BODY, ...LEGS_A],
  "down-1": [...HERO.down, ...BODY, ...LEGS_B],
  "up-0": [...HERO.up, ...BODY, ...LEGS_A],
  "up-1": [...HERO.up, ...BODY, ...LEGS_B],
  "side-0": [...HERO.side, ...SIDE_BODY, ...SIDE_LEGS_A],
  "side-1": [...HERO.side, ...SIDE_BODY, ...SIDE_LEGS_B],
};

const spriteCache = new Map<string, HTMLCanvasElement>();
function sprite(name: string, rows: string[], pal: Record<string, string>, flip = false): HTMLCanvasElement {
  const key = `${name}|${flip}`;
  const hit = spriteCache.get(key);
  if (hit) return hit;
  const cv = document.createElement("canvas");
  cv.width = rows[0].length;
  cv.height = rows.length;
  const c = cv.getContext("2d")!;
  rows.forEach((row, y) =>
    [...row].forEach((ch, x) => {
      const col = pal[ch];
      if (col) rect(c, col, flip ? cv.width - 1 - x : x, y, 1, 1);
    }),
  );
  spriteCache.set(key, cv);
  return cv;
}

/** The hero's drawn position: between tiles while walking, along the path on a conveyor ride. */
function heroXY(g: Game): [number, number] {
  const { x, y } = g.s.at;
  const a = g.anim;
  const k = Math.min(1, a.t);
  if (a.path && a.path.length > 1) {
    const segs = a.path.length - 1;
    const f = k * segs;
    const i = Math.min(segs - 1, Math.floor(f));
    const [ax, ay] = a.path[i];
    const [bx, by] = a.path[i + 1];
    const u = f - i;
    return [(ax + (bx - ax) * u) * T, (ay + (by - ay) * u) * T + TOP];
  }
  return [(a.fx + (x - a.fx) * k) * T, (a.fy + (y - a.fy) * k) * T + TOP];
}

function drawHero(c: Ctx, g: Game, time: number) {
  const { facing } = g.s.at;
  const a = g.anim;
  const [px, py] = heroXY(g);
  if (g.invuln > 0 && Math.floor(time * 12) % 2 === 0) return;
  const frame = a.t < 1 ? (Math.floor(a.t * 2) % 2) : 0;
  const view = facing === "left" || facing === "right" ? "side" : facing;
  const spr = sprite(`hero-${view}-${frame}`, HERO_SPRITES[`${view}-${frame}`], HERO_PAL, facing === "left");
  // Lantern glow
  c.fillStyle = "rgba(255, 220, 120, 0.12)";
  c.beginPath();
  c.arc(px + 8, py + 9, 13 + Math.sin(time * 5) * 1, 0, Math.PI * 2);
  c.fill();
  c.drawImage(spr, Math.round(px), Math.round(py) - 1);
  // The lantern in hand (not when facing up: it's in front)
  if (facing !== "up") {
    const lx = facing === "left" ? px + 1 : facing === "right" ? px + 12 : px + 12;
    rect(c, "#3a2a10", lx, py + 9, 3, 1);
    rect(c, "#ffd23f", lx, py + 10, 3, 3);
    rect(c, "#fff6c0", lx + 1, py + 11, 1, 1);
  }
  // A bubble shield: a wobbly bubble with the steps left
  if (g.shield > 0) {
    c.strokeStyle = g.shield <= 3 && Math.floor(time * 8) % 2 ? "#ff8ad8" : "#bfe8ff";
    c.lineWidth = 1;
    c.beginPath();
    c.ellipse(px + 8, py + 8, 10 + Math.sin(time * 6) * 0.8, 10 - Math.sin(time * 6) * 0.8, 0, 0, Math.PI * 2);
    c.stroke();
    rect(c, "rgba(191, 232, 255, 0.5)", px + 2, py + 1, 3, 2);
    c.fillStyle = "#bfe8ff";
    c.font = '8px "Press Start 2P", monospace';
    c.textAlign = "center";
    c.fillText(String(g.shield), px + 8, py - 3);
    c.textAlign = "left";
  }
}

/* ------------------------------------------------------------------------------- tiles */

function shelf(c: Ctx, p: Pal, px: number, py: number, tx: number, ty: number, crack = false) {
  rect(c, p.shelfDark, px, py, T, T);
  rect(c, p.shelf, px + 1, py + 1, T - 2, T - 2);
  for (let row = 0; row < 2; row++) {
    const by = py + 2 + row * 7;
    rect(c, p.shelfDark, px + 1, by + 6, T - 2, 1);
    let bx = px + 2;
    let i = 0;
    while (bx < px + T - 2) {
      const h = hash(tx * 2 + row, ty, i);
      const w = 2 + (h % 2);
      if (bx + w > px + T - 2) break;
      const tall = 4 + ((h >> 3) % 2);
      rect(c, BOOK_COLORS[(h >> 5) % BOOK_COLORS.length], bx, by + 6 - tall, w, tall);
      bx += w + ((h >> 9) % 3 === 0 ? 1 : 0);
      i++;
    }
  }
  if (crack) {
    c.fillStyle = "#0b0610";
    for (const [dx, dy] of [[7, 1], [8, 2], [7, 3], [6, 4], [7, 5], [8, 6], [9, 7], [8, 8], [7, 9], [7, 10], [8, 11], [9, 12], [8, 13], [8, 14]]) c.fillRect(px + dx, py + dy, 1, 1);
  }
}

function hedge(c: Ctx, px: number, py: number, tx: number, ty: number) {
  rect(c, "#143d1c", px, py, T, T);
  for (let i = 0; i < 9; i++) {
    const h = hash(tx, ty, i);
    rect(c, i % 2 ? "#2b7a35" : "#1f5a2a", px + (h % 13), py + ((h >> 4) % 13), 4, 4);
  }
}


function crackLines(c: Ctx, px: number, py: number) {
  c.fillStyle = "#0b0610";
  for (const [dx, dy] of [[7, 1], [8, 2], [7, 3], [6, 4], [7, 5], [8, 6], [9, 7], [8, 8], [7, 9], [7, 10], [8, 11], [9, 12], [8, 13], [8, 14]]) c.fillRect(px + dx, py + dy, 1, 1);
}

/** A wall tile in the area's style. */
function wall(c: Ctx, style: WallStyle, p: Pal, px: number, py: number, tx: number, ty: number, crack = false) {
  const h = hash(tx, ty, 11);
  switch (style) {
    case "shelf":
      shelf(c, p, px, py, tx, ty, crack);
      return;
    case "hedge": case "garden":
      hedge(c, px, py, tx, ty);
      break;
    case "rock":
      rect(c, p.shelfDark, px, py, T, T);
      for (let i = 0; i < 3; i++) {
        const hh = hash(tx, ty, i + 20);
        const bx = px + 1 + (i % 2) * 7 + (hh % 2);
        const by = py + 1 + Math.floor(i / 2) * 7 + ((hh >> 3) % 2);
        rect(c, p.shelf, bx, by, 7, 6);
        rect(c, p.accent, bx + 1, by, 4, 1);
      }
      break;
    case "coral":
      rect(c, p.shelfDark, px, py, T, T);
      rect(c, p.shelf, px + 1, py + 1, 14, 6);
      rect(c, p.shelf, px + 1, py + 9, 6, 6);
      rect(c, p.shelf, px + 9, py + 9, 6, 6);
      if (h % 3 === 0) {
        rect(c, "#ff6f8a", px + 3 + (h % 6), py + 3, 2, 4);
        rect(c, "#ff6f8a", px + 2 + (h % 6), py + 4, 4, 1);
      }
      if (h % 4 === 1) for (let i = 0; i < 3; i++) rect(c, "#2fbf71", px + 11 + (i % 2), py + 8 + i * 2, 1, 2);
      break;
    case "brass":
      rect(c, p.shelfDark, px, py, T, T);
      rect(c, p.shelf, px + 1, py + 1, 14, 14);
      rect(c, p.accent, px + 2, py + 2, 1, 1);
      rect(c, p.accent, px + 13, py + 2, 1, 1);
      rect(c, p.accent, px + 2, py + 13, 1, 1);
      rect(c, p.accent, px + 13, py + 13, 1, 1);
      if (h % 4 === 0) {
        c.fillStyle = p.shelfDark;
        c.beginPath();
        c.arc(px + 8, py + 8, 4, 0, Math.PI * 2);
        c.fill();
        for (let i = 0; i < 6; i++) rect(c, p.shelfDark, px + 7 + Math.cos(i) * 5, py + 7 + Math.sin(i) * 5, 2, 2);
        rect(c, p.accent, px + 7, py + 7, 2, 2);
      } else rect(c, p.shelfDark, px + 1, py + 7, 14, 1);
      break;
    case "stone": {
      rect(c, p.shelfDark, px, py, T, T);
      const off = ty % 2 ? 4 : 0;
      for (let bx = -8; bx < T; bx += 8) rect(c, p.shelf, px + Math.max(0, bx + off) + 1, py + 1, Math.min(7, T - Math.max(0, bx + off) - 1), 6);
      for (let bx = -8; bx < T; bx += 8) rect(c, p.shelf, px + Math.max(0, bx + 4 - off) + 1, py + 9, Math.min(7, T - Math.max(0, bx + 4 - off) - 1), 6);
      break;
    }
    case "basalt":
      rect(c, p.shelfDark, px, py, T, T);
      rect(c, p.shelf, px + 1, py + 1, 6, 14);
      rect(c, p.shelf, px + 9, py + 1, 6, 14);
      rect(c, "rgba(255,255,255,0.08)", px + 1, py + 1, 6, 1);
      if (h % 5 === 0) {
        rect(c, p.accent, px + 7, py + 3 + (h % 6), 2, 1);
        rect(c, p.accent, px + 8, py + 4 + (h % 6), 1, 3);
      }
      break;
    case "gallery":
      rect(c, p.shelf, px, py, T, T);
      for (let i = 0; i < T; i += 4) rect(c, p.shelfDark, px + i + 1, py, 1, 11);
      rect(c, "#8a5a2b", px, py + 11, T, 5);
      rect(c, "#6a4220", px, py + 11, T, 1);
      if (h % 5 === 0 && ty > 0 && ty < ROWS - 1) {
        rect(c, "#ffd23f", px + 3, py + 2, 10, 8);
        rect(c, ["#9ad0ff", "#ffb0c8", "#b8f0c0"][h % 3], px + 4, py + 3, 8, 6);
        rect(c, "#2fbf71", px + 4, py + 7, 8, 2);
        rect(c, "#ff8a3d", px + 9, py + 4, 2, 2);
      }
      break;
  }
  if (crack) crackLines(c, px, py);
}

function floor(c: Ctx, p: Pal, style: FloorStyle, px: number, py: number, tx: number, ty: number) {
  const h = hash(tx, ty, 7);
  switch (style) {
    case "grass":
      rect(c, p.floorA, px, py, T, T);
      rect(c, "#4fa346", px + (h % 12), py + ((h >> 4) % 12), 2, 1);
      rect(c, "#327a2e", px + ((h >> 8) % 12), py + ((h >> 12) % 12), 1, 2);
      return;
    case "sand":
      rect(c, p.floorA, px, py, T, T);
      rect(c, p.floorB, px + (h % 13), py + ((h >> 4) % 13), 2, 1);
      rect(c, p.floorB, px + ((h >> 8) % 13), py + ((h >> 12) % 13), 1, 1);
      if (h % 23 === 0) rect(c, "#f2e0e8", px + 6, py + 7, 3, 2);
      return;
    case "tiles":
      rect(c, (tx + ty) % 2 ? p.floorA : p.floorB, px, py, T, T);
      rect(c, "rgba(0,0,0,0.18)", px, py + 7, T, 1);
      rect(c, "rgba(0,0,0,0.18)", px + 7, py, 1, T);
      if (h % 9 === 0) rect(c, p.accent, px + 3, py + 3, 2, 2);
      return;
    case "metal":
      rect(c, p.floorA, px, py, T, T);
      for (let i = 0; i < 4; i++) rect(c, p.floorB, px + 2 + (i % 2) * 8, py + 2 + Math.floor(i / 2) * 8 + (i % 2) * 2, 3, 1);
      rect(c, "rgba(0,0,0,0.2)", px, py + T - 1, T, 1);
      rect(c, "rgba(0,0,0,0.2)", px + T - 1, py, 1, T);
      return;
    case "ash":
      rect(c, p.floorA, px, py, T, T);
      rect(c, p.floorB, px + (h % 12), py + ((h >> 4) % 12), 3, 2);
      rect(c, "rgba(0,0,0,0.2)", px + ((h >> 8) % 13), py + ((h >> 12) % 13), 2, 1);
      return;
    case "parquet":
      rect(c, p.floorA, px, py, T, T);
      if ((tx + ty) % 2) for (let i = 0; i < T; i += 4) rect(c, p.floorB, px + i, py, 1, T);
      else for (let i = 0; i < T; i += 4) rect(c, p.floorB, px, py + i, T, 1);
      return;
    case "marble":
      rect(c, (tx + ty) % 2 ? p.floorA : p.floorB, px, py, T, T);
      rect(c, "rgba(120,110,140,0.25)", px + (h % 8), py + 2, 1, 6);
      rect(c, "rgba(120,110,140,0.25)", px + (h % 8) + 1, py + 8, 1, 5);
      rect(c, "rgba(0,0,0,0.08)", px, py + T - 1, T, 1);
      return;
    default:
      rect(c, (tx + ty) % 2 ? p.floorA : p.floorB, px, py, T, T);
      rect(c, "rgba(0,0,0,0.12)", px, py + T - 1, T, 1);
      rect(c, "rgba(255,255,255,0.05)", px, py, T, 1);
  }
}

function building(c: Ctx, g: Game, room: RoomDef, p: Pal, px: number, py: number, tx: number, ty: number) {
  const [col, dark] = g.q.gateColor[room.id] ?? [p.building, p.buildingDark];
  rect(c, dark, px, py, T, T);
  const off = ty % 2 ? 4 : 0;
  for (let bx = -8; bx < T; bx += 8) rect(c, col, px + Math.max(0, bx + off) + 1, py + 1, Math.min(7, T - Math.max(0, bx + off) - 1), 6);
  for (let bx = -8; bx < T; bx += 8) rect(c, col, px + Math.max(0, bx + 4 - off) + 1, py + 9, Math.min(7, T - Math.max(0, bx + 4 - off) - 1), 6);
  // A roof edge on the building's top row
  if (ty === 1) rect(c, "#2a1d10", px, py, T, 3);
  void tx;
}

function door(c: Ctx, kind: string, p: Pal, style: WallStyle, px: number, py: number, time: number) {
  if (kind === "D") {
    rect(c, "#2a2a3a", px, py, T, T);
    for (let i = 1; i < T; i += 4) rect(c, "#8a8aa8", px + i, py, 2, T);
    rect(c, "#5a5a78", px, py + 7, T, 2);
  } else if (kind === "L") {
    rect(c, "#3a1d0a", px, py, T, T);
    rect(c, "#8a5a2b", px + 1, py + 1, T - 2, T - 2);
    rect(c, "#6a4220", px + 1, py + 5, T - 2, 1);
    rect(c, "#6a4220", px + 1, py + 10, T - 2, 1);
    rect(c, "#ffd23f", px + 6, py + 6, 4, 4);
    rect(c, "#1a1030", px + 7, py + 7, 2, 2);
  } else if (kind === "Q") {
    rect(c, "#0c1450", px, py, T, T);
    rect(c, "#2456e8", px + 1, py + 1, T - 2, T - 2);
    const glow = Math.sin(time * 4) > 0 ? "#ffd23f" : "#ffe9a0";
    // a pixel "?"
    for (const [dx, dy] of [[5, 3], [6, 3], [7, 3], [8, 3], [9, 3], [4, 4], [10, 4], [10, 5], [9, 6], [8, 7], [7, 8], [7, 9], [7, 12]]) rect(c, glow, px + dx, py + dy, 2, 1);
    rect(c, glow, px + 7, py + 12, 2, 2);
  } else if (kind === "H") {
    wall(c, style, p, px, py, Math.floor(px / T), Math.floor(py / T), true);
  }
}


/** Gap / chasm colours by theme: [depth, rim]. */
const GAP: Record<Theme, [string, string]> = {
  library: ["#05030a", "#2a1d3a"],
  sea: ["#04162a", "#1a4a6a"],
  clock: ["#08080f", "#3a3a50"],
  volcano: ["#a8280c", "#ff8a3d"],
  museum: ["#140f22", "#3a2f5a"],
};

function gap(c: Ctx, g: Game, px: number, py: number, tx: number, ty: number) {
  const [deep, rim] = GAP[g.q.theme];
  rect(c, deep, px, py, T, T);
  if (g.q.theme === "volcano") {
    const h = hash(tx, ty, 3);
    rect(c, "#e3562f", px + (h % 10), py + ((h >> 4) % 10), 5, 3);
    rect(c, "#ffd23f", px + ((h >> 8) % 12), py + ((h >> 12) % 12), 2, 2);
    if (g.tile(tx, ty - 1) !== "_") rect(c, "#3a1a10", px, py, T, 3);
    return;
  }
  if (g.tile(tx, ty - 1) !== "_") rect(c, rim, px, py, T, 3);
  if (g.q.theme === "sea" && hash(tx, ty, 2) % 3 === 0) rect(c, "#1a4a6a", px + (hash(tx, ty, 6) % 12) + 2, py + 6 + (hash(ty, tx, 6) % 8), 2, 2);
  if (g.q.theme === "clock" && hash(tx, ty, 2) % 4 === 0) {
    const gx = px + 4 + (hash(tx, ty, 6) % 8);
    const gy = py + 6 + (hash(ty, tx, 6) % 6);
    c.strokeStyle = "#2a2a3a";
    c.lineWidth = 1;
    c.beginPath();
    c.arc(gx, gy, 3, 0, Math.PI * 2);
    c.stroke();
    for (let i = 0; i < 4; i++) rect(c, "#2a2a3a", gx + Math.cos((i * Math.PI) / 2) * 4 - 0.5, gy + Math.sin((i * Math.PI) / 2) * 4 - 0.5, 1, 1);
  }
}

function water(c: Ctx, theme: Theme, px: number, py: number, tx: number, ty: number) {
  if (theme === "volcano") {
    rect(c, "#c83a10", px, py, T, T);
    rect(c, "#ff8a3d", px + 2 + (hash(tx, ty) % 6), py + 5, 5, 2);
    rect(c, "#ffd23f", px + 6 + (hash(ty, tx) % 5), py + 11, 3, 1);
    return;
  }
  const [base, wave] = theme === "sea" ? ["#1a6aa8", "#3a8fcf"] : theme === "museum" ? ["#5aa8e8", "#9ad0ff"] : ["#1f5fbf", "#3a7fdf"];
  rect(c, base, px, py, T, T);
  rect(c, wave, px + 2 + (hash(tx, ty) % 6), py + 5, 5, 1);
  rect(c, wave, px + 6 + (hash(ty, tx) % 5), py + 11, 4, 1);
}

function deepWater(c: Ctx, px: number, py: number, tx: number, ty: number) {
  rect(c, "#123c7a", px, py, T, T);
  rect(c, "#1f5fbf", px + 1 + (hash(tx, ty, 5) % 7), py + 4, 6, 1);
  rect(c, "#1f5fbf", px + 4 + (hash(ty, tx, 5) % 6), py + 10, 5, 1);
}

function sign(c: Ctx, theme: Theme, px: number, py: number) {
  if (theme === "library") {
    rect(c, "#5a3a1a", px + 7, py + 8, 2, 7);
    rect(c, "#3a2410", px + 4, py + 14, 8, 2);
    rect(c, "#8a5a2b", px + 2, py + 4, 12, 5);
    rect(c, "#f2ead0", px + 3, py + 3, 5, 4);
    rect(c, "#f2ead0", px + 8, py + 3, 5, 4);
    rect(c, "#9a8a6a", px + 4, py + 4, 3, 1);
    rect(c, "#9a8a6a", px + 9, py + 4, 3, 1);
    return;
  }
  const [post, board, edge] =
    theme === "sea" ? ["#8a7a5a", "#c8b088", "#5a4a2a"] : theme === "clock" ? ["#5a5a78", "#ffd23f", "#b8862a"] :
    theme === "volcano" ? ["#3a3a4a", "#6a6a7a", "#2a2a3a"] : ["#3a2a10", "#ffd23f", "#b8862a"];
  rect(c, post, px + 7, py + 9, 2, 6);
  rect(c, edge, px + 2, py + 2, 12, 8);
  rect(c, board, px + 3, py + 3, 10, 6);
  rect(c, edge, px + 4, py + 5, 8, 1);
  rect(c, edge, px + 4, py + 7, 6, 1);
}

function tree(c: Ctx, theme: Theme, px: number, py: number) {
  if (theme === "sea") {
    rect(c, "#8a6a3a", px + 7, py + 6, 2, 10);
    rect(c, "#2fbf71", px + 2, py + 3, 12, 2);
    rect(c, "#2fbf71", px + 1, py + 5, 3, 2);
    rect(c, "#2fbf71", px + 12, py + 5, 3, 2);
    rect(c, "#1f8f55", px + 5, py + 1, 6, 2);
    rect(c, "#8a5a2b", px + 7, py + 5, 2, 2);
  } else if (theme === "clock") {
    rect(c, "#8a8aa8", px + 3, py + 12, 10, 4);
    rect(c, "#1f8f55", px + 3, py + 2, 10, 10);
    rect(c, "#2fbf71", px + 4, py + 3, 4, 3);
    rect(c, "#ffd23f", px + 9, py + 7, 2, 2);
  } else if (theme === "volcano") {
    c.fillStyle = "#3a2a2a";
    c.beginPath();
    c.moveTo(px + 3, py + 15);
    c.lineTo(px + 7, py + 1);
    c.lineTo(px + 10, py + 2);
    c.lineTo(px + 13, py + 15);
    c.fill();
    rect(c, "#ff8a3d", px + 8, py + 6, 1, 4);
  } else if (theme === "museum") {
    rect(c, "#c85a3a", px + 4, py + 10, 8, 6);
    rect(c, "#a8482a", px + 4, py + 10, 8, 1);
    rect(c, "#2fbf71", px + 7, py + 2, 2, 8);
    rect(c, "#2fbf71", px + 3, py + 4, 4, 2);
    rect(c, "#2fbf71", px + 9, py + 3, 4, 2);
    rect(c, "#1f8f55", px + 4, py + 7, 3, 2);
    rect(c, "#1f8f55", px + 9, py + 6, 3, 2);
  } else {
    rect(c, "#5a3a1a", px + 6, py + 10, 4, 6);
    c.fillStyle = "#1f6a2a";
    c.beginPath();
    c.arc(px + 8, py + 7, 7, 0, Math.PI * 2);
    c.fill();
    rect(c, "#2f8f3a", px + 4, py + 3, 4, 3);
  }
}

function decor(c: Ctx, theme: Theme, px: number, py: number) {
  if (theme === "sea") {
    // an old anchor
    c.strokeStyle = "#5a6a7a";
    c.lineWidth = 2;
    c.beginPath();
    c.arc(px + 8, py + 4, 2, 0, Math.PI * 2);
    c.moveTo(px + 8, py + 6);
    c.lineTo(px + 8, py + 14);
    c.moveTo(px + 4, py + 9);
    c.lineTo(px + 12, py + 9);
    c.moveTo(px + 2, py + 11);
    c.quadraticCurveTo(px + 8, py + 17, px + 14, py + 11);
    c.stroke();
  } else if (theme === "clock") {
    // a big brass gear
    c.fillStyle = "#b8862a";
    c.beginPath();
    c.arc(px + 8, py + 8, 6, 0, Math.PI * 2);
    c.fill();
    for (let i = 0; i < 8; i++) rect(c, "#b8862a", px + 7 + Math.cos((i * Math.PI) / 4) * 7, py + 7 + Math.sin((i * Math.PI) / 4) * 7, 2, 2);
    c.fillStyle = "#5a3a10";
    c.beginPath();
    c.arc(px + 8, py + 8, 2, 0, Math.PI * 2);
    c.fill();
  } else if (theme === "volcano") {
    // a brass telescope on a tripod
    rect(c, "#5a3a1a", px + 4, py + 9, 1, 7);
    rect(c, "#5a3a1a", px + 11, py + 9, 1, 7);
    rect(c, "#5a3a1a", px + 7, py + 9, 2, 7);
    c.save();
    c.translate(px + 8, py + 7);
    c.rotate(-0.6);
    rect(c, "#ffd23f", -7, -2, 14, 4);
    rect(c, "#b8862a", -7, -2, 3, 4);
    rect(c, "#9ad0ff", 6, -1, 1, 2);
    c.restore();
  } else if (theme === "museum") {
    // a marble bust with a curly mustache (very serious, very silly)
    rect(c, "#8a7a9a", px + 3, py + 12, 10, 4);
    rect(c, "#e8e4f0", px + 4, py + 9, 8, 3);
    rect(c, "#e8e4f0", px + 5, py + 2, 6, 7);
    rect(c, "#1a1030", px + 6, py + 4, 1, 1);
    rect(c, "#1a1030", px + 9, py + 4, 1, 1);
    rect(c, "#3a2a1a", px + 5, py + 7, 6, 1);
    rect(c, "#3a2a1a", px + 4, py + 6, 1, 1);
    rect(c, "#3a2a1a", px + 11, py + 6, 1, 1);
  } else {
    rect(c, "#5a3a1a", px + 6, py + 12, 4, 3);
    c.fillStyle = "#2456e8";
    c.beginPath();
    c.arc(px + 8, py + 7, 6, 0, Math.PI * 2);
    c.fill();
    rect(c, "#2fbf71", px + 5, py + 4, 4, 3);
    rect(c, "#2fbf71", px + 8, py + 8, 3, 3);
  }
}

function path(c: Ctx, theme: Theme, px: number, py: number, tx: number, ty: number) {
  if (theme === "sea") {
    rect(c, "#7a5a3a", px, py, T, T);
    for (let i = 0; i < 4; i++) rect(c, "#a8804f", px, py + i * 4, T, 3);
    rect(c, "#5a3a1a", px + 7 + (ty % 2) * 4, py, 1, T);
    return;
  }
  if (theme === "clock" || theme === "museum") {
    rect(c, "#8a1a24", px, py, T, T);
    rect(c, "#b8242f", px + 1, py, 14, T);
    if ((tx + ty) % 2 === 0) rect(c, "#ffd23f", px + 7, py + 7, 2, 2);
    return;
  }
  if (theme === "volcano") {
    rect(c, "#4a4a5a", px, py, T, T);
    for (let i = 0; i < 4; i++) {
      const h = hash(tx, ty, i);
      rect(c, "#6a6a7a", px + (i % 2) * 8 + 1, py + Math.floor(i / 2) * 8 + 1, 6 + (h % 2), 6);
    }
    return;
  }
  rect(c, "#a8854f", px, py, T, T);
  for (let i = 0; i < 4; i++) {
    const h = hash(tx, ty, i);
    rect(c, "#c9a66b", px + (i % 2) * 8 + 1, py + Math.floor(i / 2) * 8 + 1, 6 + (h % 2), 6);
  }
}

function flowers(c: Ctx, theme: Theme, px: number, py: number, tx: number, ty: number) {
  const cols = theme === "sea" ? ["#f2e0e8", "#ffb0c8", "#ffd8a0"] : theme === "clock" ? ["#ffd23f", "#c0c8d8", "#b8862a"] : theme === "volcano" ? ["#ff8a3d", "#ffd23f", "#ff5a1f"] : ["#ff6fb5", "#ffd23f", "#f2f4ff"];
  for (let i = 0; i < 3; i++) {
    const h = hash(tx, ty, i + 3);
    rect(c, cols[i], px + 2 + (h % 10), py + 2 + ((h >> 4) % 10), 2, 2);
  }
}

/** The hazard puddle ^ in the quest's style (harmless-looking for K-2). */
function puddle(c: Ctx, theme: Theme, early: boolean, px: number, py: number) {
  if (theme === "volcano") {
    if (early) {
      c.fillStyle = "#3a2420";
      c.beginPath();
      c.ellipse(px + 8, py + 9, 7, 5, 0, 0, Math.PI * 2);
      c.fill();
      rect(c, "#8a3a1a", px + 5, py + 8, 6, 1);
      return;
    }
    c.fillStyle = "#e3562f";
    c.beginPath();
    c.ellipse(px + 8, py + 9, 7, 5, 0, 0, Math.PI * 2);
    c.fill();
    rect(c, "#ffd23f", px + 5, py + 7, 3, 2);
    rect(c, "#ffd23f", px + 10, py + 10, 2, 1);
    // warning stripes on the rim
    rect(c, "#1a1030", px + 1, py + 14, 14, 1);
    return;
  }
  const [deep, glint] = theme === "sea" ? ["#5a2a7a", "#c88aff"] : theme === "clock" ? ["#1a1a1a", "#5a5a78"] : theme === "museum" ? ["#7a2a9a", "#ff8ad8"] : ["#141038", "#3a3480"];
  c.fillStyle = early ? "rgba(20, 16, 60, 0.35)" : deep;
  c.beginPath();
  c.ellipse(px + 8, py + 9, 7, 5, 0, 0, Math.PI * 2);
  c.fill();
  if (!early) {
    rect(c, glint, px + 5, py + 7, 3, 1);
    rect(c, glint, px + 10, py + 10, 2, 1);
    if (theme === "sea") for (const [dx, dy] of [[4, 5], [8, 4], [12, 6], [6, 12]]) rect(c, glint, px + dx, py + dy, 1, 2);
  }
}

function drawStatic(c: Ctx, g: Game) {
  const room = g.room;
  const look = g.area.look;
  const p = look.pal;
  const theme = g.q.theme;
  for (let ty = 0; ty < ROWS; ty++) {
    for (let tx = 0; tx < COLS; tx++) {
      const px = tx * T;
      const py = ty * T + TOP;
      const t = g.tile(tx, ty);
      const base = room.rows[ty][tx];
      const isGap = (tx === 0 || ty === 0 || tx === COLS - 1 || ty === ROWS - 1) && base === "#" && t !== "#";
      if (t === "#" || t === "H") {
        wall(c, look.wall, p, px, py, tx, ty, t === "H");
        continue;
      }
      if (isGap) {
        if ("DLQ".includes(t)) door(c, t, p, look.wall, px, py, 0);
        else {
          floor(c, p, look.floor, px, py, tx, ty);
          rect(c, "rgba(0,0,0,0.25)", px, py, T, T);
        }
        continue;
      }
      // Floors under everything else
      if (t === "W") {
        building(c, g, room, p, px, py, tx, ty);
        continue;
      }
      if (t === "_") {
        gap(c, g, px, py, tx, ty);
        if (base === "u") {
          // a floating dock stuck at the bottom of its pit (low tide)
          rect(c, "#3a2a1a", px + 2, py + 6, 12, 8);
          rect(c, "#5a4a2a", px + 2, py + 6, 12, 1);
        } else if (base === "$") {
          rect(c, "#b8862a", px, py + 6, 2, 4);
          rect(c, "#b8862a", px + 14, py + 6, 2, 4);
        }
        continue;
      }
      if (t === "~") {
        water(c, theme, px, py, tx, ty);
        continue;
      }
      if (t === "w" || t === "j") {
        deepWater(c, px, py, tx, ty);
        if (t === "j") {
          for (let i = 0; i < 2; i++) rect(c, "#3a8fcf", px + 2 + i * 7, py + 4 + i * 5, 5, 1);
        }
        continue;
      }
      if (t === "u") {
        deepWater(c, px, py, tx, ty);
        rect(c, "#5a3a1a", px + 1, py + 3, 14, 10);
        for (let i = 0; i < 3; i++) rect(c, "#a8804f", px + 2, py + 4 + i * 3, 12, 2);
        continue;
      }
      if (t === "=") {
        path(c, theme, px, py, tx, ty);
        continue;
      }
      if (t === "h") {
        rect(c, "#8a2a10", px, py, T, T);
        rect(c, "#c83a10", px + 1, py + 1, 14, 14);
        const hh = hash(tx, ty, 9);
        rect(c, "#3a1a10", px + 2 + (hh % 6), py + 3, 6, 1);
        rect(c, "#3a1a10", px + 5, py + 8 + (hh % 4), 7, 1);
        rect(c, "#ff8a3d", px + 3, py + 11, 3, 2);
        continue;
      }
      if (t === "I") {
        if (base === "i" && theme === "library") {
          rect(c, "#05030a", px, py, T, T);
          rect(c, "#8a5a2b", px, py + 3, T, 10);
          for (let i = 0; i < T; i += 4) rect(c, "#6a4220", px + i, py + 3, 1, 10);
          rect(c, "rgba(176, 92, 255, 0.35)", px, py + 2, T, 12);
        } else if (base === "i") {
          // a revealed hidden floor: ghostly tiles (museum) or a bridge of starlight (others)
          gap(c, g, px, py, tx, ty);
          rect(c, theme === "museum" ? "rgba(138, 255, 193, 0.55)" : "rgba(160, 200, 255, 0.6)", px + 1, py + 2, 14, 12);
          rect(c, theme === "museum" ? "#d8fff0" : "#f2f4ff", px + 3, py + 4, 2, 2);
          rect(c, theme === "museum" ? "#d8fff0" : "#f2f4ff", px + 10, py + 9, 2, 2);
        } else if (base === "$") {
          gap(c, g, px, py, tx, ty);
          rect(c, "#8a5a1a", px, py + 3, T, 10);
          for (let i = 0; i < T; i += 5) rect(c, "#ffd23f", px + i, py + 4, 3, 8);
          rect(c, "#5a3a10", px, py + 3, T, 1);
        } else {
          // b: lava cooled into a rock bridge
          gap(c, g, px, py, tx, ty);
          rect(c, "#3a3038", px, py + 2, T, 12);
          rect(c, "#5a4a52", px + 2, py + 4, 5, 3);
          rect(c, "#5a4a52", px + 9, py + 8, 5, 3);
          rect(c, "#1a1018", px + 7, py + 3, 1, 10);
        }
        continue;
      }
      floor(c, p, look.floor, px, py, tx, ty);
      if (t === ",") {
        rect(c, p.rug, px, py, T, T);
        const l = g.tile(tx - 1, ty) !== ",";
        const r = g.tile(tx + 1, ty) !== ",";
        const u = g.tile(tx, ty - 1) !== ",";
        const d = g.tile(tx, ty + 1) !== ",";
        if (l) rect(c, p.rugEdge, px, py, 2, T);
        if (r) rect(c, p.rugEdge, px + T - 2, py, 2, T);
        if (u) rect(c, p.rugEdge, px, py, T, 2);
        if (d) rect(c, p.rugEdge, px, py + T - 2, T, 2);
        if ((tx + ty) % 2 === 0) rect(c, "rgba(255,255,255,0.08)", px + 6, py + 6, 4, 4);
      } else if (t === "f") {
        flowers(c, theme, px, py, tx, ty);
      } else if (t === "S") {
        rect(c, "#3a3a4a", px + 2, py + 2, 12, 12);
        rect(c, "#6a6a80", px + 3, py + 3, 10, 10);
        rect(c, g.blockAt(tx, ty) >= 0 ? "#5fff8a" : "#e3262f", px + 6, py + 6, 4, 4);
      } else if (t === "^") {
        puddle(c, theme, g.opts.early, px, py);
      } else if (t === "s") {
        rect(c, "#b89868", px, py, T, T);
        const hh = hash(tx, ty, 4);
        rect(c, "#9a7a4a", px + (hh % 12), py + ((hh >> 4) % 12), 3, 2);
        rect(c, "rgba(150, 200, 255, 0.45)", px + ((hh >> 8) % 10), py + ((hh >> 12) % 10), 4, 1);
      } else if (t === "t") {
        tree(c, theme, px, py);
      } else if (t === "N") {
        sign(c, theme, px, py);
      } else if (t === "K") {
        rect(c, "#ffd23f", px + 4, py + 4, 5, 5);
        rect(c, "#1a1030", px + 6, py + 6, 1, 1);
        rect(c, "#ffd23f", px + 8, py + 6, 5, 2);
        rect(c, "#ffd23f", px + 11, py + 8, 2, 2);
      } else if (t === "M") {
        rect(c, "#f2ead0", px + 3, py + 4, 10, 9);
        rect(c, "#c9a66b", px + 2, py + 4, 2, 9);
        rect(c, "#c9a66b", px + 12, py + 4, 2, 9);
        rect(c, "#2456e8", px + 5, py + 6, 3, 2);
        rect(c, "#2fbf71", px + 8, py + 9, 3, 2);
        rect(c, "#e3262f", px + 9, py + 6, 1, 1);
      } else if (t === "C" || t === "U") {
        rect(c, "#3a1d0a", px + 1, py + 4, 14, 11);
        rect(c, "#a86a2a", px + 2, py + 5, 12, 9);
        rect(c, "#ffd23f", px + 2, py + 8, 12, 1);
        if (t === "C") {
          rect(c, "#8a5a2b", px + 2, py + 5, 12, 3);
          rect(c, "#ffd23f", px + 7, py + 8, 2, 3);
        } else {
          rect(c, "#1a0c04", px + 2, py + 5, 12, 3);
          rect(c, "#a86a2a", px + 2, py + 1, 12, 3);
        }
      } else if (t === "o") {
        rect(c, "#5a3a1a", px + 6, py + 6, 4, 9);
        c.strokeStyle = "#ffd23f";
        c.lineWidth = 2;
        c.beginPath();
        c.arc(px + 8, py + 5, 3, 0, Math.PI * 2);
        c.stroke();
      } else if (t === "O") {
        decor(c, theme, px, py);
      } else if (t === "P" || t === "X") {
        const [col, dark] = g.q.gateColor[room.id] ?? [p.building, p.buildingDark];
        rect(c, dark, px, py, T, T);
        rect(c, t === "X" ? "#3a2a1a" : "#1a0f08", px + 2, py + 2, 12, 14);
        rect(c, col, px + 2, py + 2, 12, 2);
        if (t === "X") {
          // One hole per wing (filled as wings are restored), two per door tile
          const filled = g.s.restored.length;
          const total = g.q.wings.length;
          const left = room.rows[ty][tx - 1] === "P";
          for (let i = 0; i < 2; i++) {
            const n = (left ? 2 : 0) + i;
            if (n >= total) continue;
            rect(c, n < filled ? BOOK_COLORS[n] : "#0b0610", px + 4 + i * 5, py + 6, 3, 6);
          }
        } else {
          rect(c, "#ffd23f", px + (room.rows[ty][tx - 1] === "P" ? 3 : 11), py + 9, 2, 2);
        }
      } else if (t === "F" && theme === "library") {
        drawOwl(c, px, py);
      } else if (t === "l") {
        rect(c, "#5a5a6a", px + 3, py + 10, 10, 5);
        rect(c, "#8a8a9a", px + 4, py + 10, 8, 2);
        const up = g.tideHigh();
        c.strokeStyle = "#c0c8d8";
        c.lineWidth = 2;
        c.beginPath();
        c.moveTo(px + 8, py + 11);
        c.lineTo(px + (up ? 11 : 5), py + (up ? 3 : 4));
        c.stroke();
        rect(c, up ? "#3a8fcf" : "#ffd23f", px + (up ? 10 : 3), py + (up ? 1 : 2), 4, 4);
      } else if (t === "&" || t === "a") {
        rect(c, "#5a3a10", px + 5, py + 6, 6, 10);
        rect(c, "#b8862a", px + 4, py + 4, 8, 4);
        rect(c, "#1a1030", px + 7, py + 5, 2, 2);
      } else if (t === "*" || t === "+") {
        rect(c, "#2a1a1a", px + 4, py + 12, 8, 3);
        c.fillStyle = t === "+" ? "#ff8a3d" : "#5a1a1a";
        c.beginPath();
        c.moveTo(px + 8, py + 1);
        c.lineTo(px + 12, py + 7);
        c.lineTo(px + 8, py + 13);
        c.lineTo(px + 4, py + 7);
        c.fill();
        rect(c, t === "+" ? "#ffe9a0" : "#8a3a3a", px + 6, py + 5, 2, 3);
      } else if (t === "%" || t === ";") {
        rect(c, "#2a2a32", px + 2, py + 2, 12, 12);
        for (let i = 0; i < 4; i++) rect(c, "#5a5a68", px + 3, py + 3 + i * 3, 10, 1);
        rect(c, "#ff8a3d", px + 2, py + 2, 12, 1);
      } else if (t === "z") {
        rect(c, "#3a3a4a", px + 1, py + 1, 14, 14);
        c.fillStyle = "#f2ead0";
        c.beginPath();
        c.arc(px + 8, py + 8, 6, 0, Math.PI * 2);
        c.fill();
        for (let i = 0; i < 4; i++) rect(c, "#1a1030", px + 7 + Math.round(Math.cos((i * Math.PI) / 2) * 5), py + 7 + Math.round(Math.sin((i * Math.PI) / 2) * 5), 2, 2);
      } else if (CONVEYOR_TILES.includes(t)) {
        conveyorBase(c, theme, px, py, t);
      }
    }
  }
  if (room.sealed && theme !== "library") drawLandmark(c, g, room);
}

const CONVEYOR_TILES = "<>AV";
const CONVEYOR_DIR: Record<string, [number, number]> = { "<": [-1, 0], ">": [1, 0], A: [0, -1], V: [0, 1] };

function conveyorBase(c: Ctx, theme: Theme, px: number, py: number, t: string) {
  const horiz = t === "<" || t === ">";
  if (theme === "sea") {
    rect(c, "#1a6aa8", px, py, T, T);
    return;
  }
  if (theme === "volcano") {
    rect(c, "#3a3038", px, py, T, T);
    for (let i = 0; i < 4; i++) rect(c, "#5a4a52", horiz ? px + i * 4 : px + 1, horiz ? py + 1 : py + i * 4, horiz ? 1 : 14, horiz ? 14 : 1);
    return;
  }
  rect(c, "#2a2a3a", px, py, T, T);
  if (horiz) {
    rect(c, "#4a4a5a", px, py + 2, T, 12);
    rect(c, "#8a8aa8", px, py + 2, T, 1);
    rect(c, "#8a8aa8", px, py + 13, T, 1);
  } else {
    rect(c, "#4a4a5a", px + 2, py, 12, T);
    rect(c, "#8a8aa8", px + 2, py, 1, T);
    rect(c, "#8a8aa8", px + 13, py, 1, T);
  }
}

/** Moving chevrons on a conveyor (belt, current or updraft). */
function conveyorArrows(c: Ctx, theme: Theme, px: number, py: number, t: string, time: number) {
  const [dx, dy] = CONVEYOR_DIR[t];
  const col = theme === "sea" ? "#bfe8ff" : theme === "volcano" ? "rgba(240,240,250,0.9)" : "#ffd23f";
  const off = Math.floor((time * 12) % 8);
  c.save();
  c.beginPath();
  c.rect(px, py, T, T);
  c.clip();
  for (let k = -1; k < 2; k++) {
    // a ">" chevron, 3 deep and 7 wide, pointing along (dx, dy)
    const along = k * 8 + off + 2;
    for (let i = -3; i <= 3; i++) {
      const depth = 2 - Math.abs(i) * 0.67;
      const a = along + Math.round(depth);
      const x = dx ? (dx > 0 ? px + a : px + T - 1 - a) : px + 8 + i;
      const y = dy ? (dy > 0 ? py + a : py + T - 1 - a) : py + 8 + i;
      rect(c, col, x - (dx ? 1 : 0), y - (dy ? 1 : 0), dx ? 2 : 1, dy ? 2 : 1);
    }
  }
  c.restore();
}

/** The quest's landmark on the hub's sealed gate building: a lighthouse, a clock tower, a dome, a museum front. */
function drawLandmark(c: Ctx, g: Game, room: RoomDef) {
  const ws = Game.tilesOf(room, "W");
  const ps = Game.tilesOf(room, "P");
  if (!ws.length || !ps.length) return;
  const pRow = Math.min(...ps.map(([, y]) => y));
  const top = ws.filter(([, y]) => y < pRow);
  if (!top.length) return;
  const x0 = Math.min(...top.map(([x]) => x)) * T;
  const x1 = (Math.max(...top.map(([x]) => x)) + 1) * T;
  const y0 = Math.min(...top.map(([, y]) => y)) * T + TOP;
  const y1 = (Math.max(...top.map(([, y]) => y)) + 1) * T + TOP;
  const cx = (x0 + x1) / 2;
  const lit = g.allRestored();
  const theme = g.q.theme;
  if (theme === "sea") {
    // a striped lighthouse tower with its lamp room
    const w = Math.min(40, x1 - x0 - 8);
    for (let y = y0 + 10; y < y1; y += 6) rect(c, ((y - y0) / 6) % 2 < 1 ? "#f2f4ff" : "#e3262f", cx - w / 2, y, w, Math.min(6, y1 - y));
    rect(c, "#3a3a4a", cx - w / 2 - 3, y0 + 8, w + 6, 3);
    rect(c, "#1a1030", cx - 8, y0, 16, 9);
    rect(c, lit ? "#fff6c0" : "#5a5a3a", cx - 6, y0 + 2, 12, 6);
    rect(c, "#3a3a4a", cx - 9, y0 - 2, 18, 2);
  } else if (theme === "clock") {
    const r = Math.min(14, (y1 - y0) / 2 - 1);
    c.fillStyle = "#3a2a10";
    c.beginPath();
    c.arc(cx, (y0 + y1) / 2, r + 2, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = lit ? "#fff6c0" : "#f2ead0";
    c.beginPath();
    c.arc(cx, (y0 + y1) / 2, r, 0, Math.PI * 2);
    c.fill();
    for (let i = 0; i < 12; i++) rect(c, "#1a1030", cx + Math.cos((i * Math.PI) / 6) * (r - 2) - 1, (y0 + y1) / 2 + Math.sin((i * Math.PI) / 6) * (r - 2) - 1, 2, 2);
    c.strokeStyle = "#1a1030";
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(cx, (y0 + y1) / 2);
    c.lineTo(cx, (y0 + y1) / 2 - r + 4);
    c.moveTo(cx, (y0 + y1) / 2);
    c.lineTo(cx + r - 6, (y0 + y1) / 2);
    c.stroke();
  } else if (theme === "volcano") {
    // the observatory dome with its telescope slot
    const r = Math.min((x1 - x0) / 2 - 2, y1 - y0);
    c.fillStyle = "#c0c8d8";
    c.beginPath();
    c.arc(cx, y1, r, Math.PI, 0);
    c.fill();
    rect(c, "#1a1030", cx - 3, y1 - r + 2, 6, r - 2);
    rect(c, lit ? "#ffd23f" : "#3a3a5a", cx - 2, y1 - r + 4, 4, 4);
    rect(c, "#8a90a8", cx - r, y1 - 2, r * 2, 2);
  } else if (theme === "museum") {
    // a museum front: a triangle roof and columns
    c.fillStyle = "#f2ead0";
    c.beginPath();
    c.moveTo(x0, y0 + 14);
    c.lineTo(cx, y0);
    c.lineTo(x1, y0 + 14);
    c.fill();
    rect(c, "#d8c8a8", x0, y0 + 14, x1 - x0, 3);
    for (let x = x0 + 4; x < x1 - 4; x += 10) rect(c, "#f2ead0", x, y0 + 17, 5, y1 - y0 - 17);
    rect(c, lit ? "#ffd23f" : "#b05cff", cx - 3, y0 + 6, 6, 5);
  }
}

function drawOwl(c: Ctx, px: number, py: number) {
  rect(c, "#7a4a2a", px + 3, py + 3, 10, 12);
  rect(c, "#7a4a2a", px + 2, py + 1, 2, 3);
  rect(c, "#7a4a2a", px + 12, py + 1, 2, 3);
  rect(c, "#c9a66b", px + 5, py + 9, 6, 5);
  rect(c, "#f2f4ff", px + 4, py + 4, 4, 4);
  rect(c, "#f2f4ff", px + 8, py + 4, 4, 4);
  rect(c, "#1a1030", px + 5, py + 5, 2, 2);
  rect(c, "#1a1030", px + 9, py + 5, 2, 2);
  rect(c, "#ffd23f", px + 7, py + 7, 2, 2);
  rect(c, "#b05cff", px + 3, py + 11, 10, 2);
  // glasses
  c.strokeStyle = "#ffd23f";
  c.lineWidth = 1;
  c.strokeRect(px + 4.5, py + 4.5, 3, 3);
  c.strokeRect(px + 8.5, py + 4.5, 3, 3);
}

/* -------------------------------------------------------------------------- guardians */

function drawGuardian(c: Ctx, id: string, px: number, py: number, time: number, happy: boolean) {
  if (drawQuestGuardian(c, id, px, py, time, happy)) return;
  const bob = Math.round(Math.sin(time * 2.5) * 1.5);
  const y = py + bob;
  const eye = (ex: number, ey: number) => {
    rect(c, "#f2f4ff", ex, ey, 5, 5);
    rect(c, "#1a1030", ex + 2 + (Math.sin(time) > 0.6 ? 1 : 0), ey + 2, 2, 2);
  };
  if (id === "tallyshell") {
    rect(c, "#3f8f3a", px + 2, y + 22, 6, 8);
    rect(c, "#3f8f3a", px + 24, y + 22, 6, 8);
    rect(c, "#5a3a1a", px + 4, y + 8, 24, 16);
    rect(c, "#8a5a2b", px + 6, y + 10, 20, 12);
    for (let r = 0; r < 3; r++) {
      rect(c, "#3a2410", px + 6, y + 12 + r * 4, 20, 1);
      for (let b = 0; b < 4; b++) rect(c, BOOK_COLORS[(r * 4 + b) % BOOK_COLORS.length], px + 8 + ((b * 5 + r * 2 + Math.floor(time)) % 16), y + 11 + r * 4, 3, 3);
    }
    rect(c, "#4fa346", px + 22, y + 4, 9, 9);
    rect(c, "#c0c8d8", px + 21, y + 1, 11, 4);
    rect(c, "#e3262f", px + 25, y - 2, 3, 3);
    eye(px + 25, y + 6);
  } else if (id === "petri") {
    rect(c, "#d8c8a8", px + 10, y + 18, 12, 12);
    c.fillStyle = "#f2e2c0";
    c.beginPath();
    c.arc(px + 16, y + 14, 14, Math.PI, 0);
    c.fill();
    rect(c, "#f2e2c0", px + 2, y + 14, 28, 4);
    for (const [dx, dy] of [[6, 6], [14, 3], [22, 7], [10, 11], [20, 12]]) rect(c, "#c0a070", px + dx, y + dy, 3, 3);
    rect(c, "#3a3a4a", px + 9, y + 20, 14, 2);
    eye(px + 9, y + 18);
    eye(px + 18, y + 18);
    rect(c, "#2fbf71", px + 4, y + 22, 6, 2);
    rect(c, "#2fbf71", px + 22, y + 22, 6, 2);
  } else if (id === "inkwhisker") {
    rect(c, "#f2f4ff", px + 6, y + 10, 20, 18);
    rect(c, "#f2f4ff", px + 6, y + 4, 6, 8);
    rect(c, "#f2f4ff", px + 20, y + 4, 6, 8);
    rect(c, "#1a1030", px + 6, y + 10, 20, 1);
    for (let i = 0; i < 4; i++) rect(c, "#9aa0c0", px + 8, y + 14 + i * 3, 16, 1);
    eye(px + 9, y + 12);
    eye(px + 18, y + 12);
    rect(c, "#ff6fb5", px + 15, y + 18, 2, 2);
    rect(c, "#f2f4ff", px + 26, y + 18 + Math.round(Math.sin(time * 3) * 2), 5, 3);
  } else if (id === "kitewing") {
    rect(c, "#d8b878", px + 8, y + 10, 16, 16);
    c.fillStyle = "#e3262f";
    c.beginPath();
    c.moveTo(px + 8, y + 12);
    c.lineTo(px - 2, y + 4 + Math.sin(time * 3) * 2);
    c.lineTo(px + 4, y + 20);
    c.fill();
    c.fillStyle = "#2456e8";
    c.beginPath();
    c.moveTo(px + 24, y + 12);
    c.lineTo(px + 34, y + 4 + Math.sin(time * 3) * 2);
    c.lineTo(px + 28, y + 20);
    c.fill();
    rect(c, "#8a5a2b", px + 10, y + 14, 6, 1);
    rect(c, "#2fbf71", px + 14, y + 18, 5, 3);
    rect(c, "#d8b878", px + 11, y + 2, 10, 9);
    eye(px + 12, y + 4);
    rect(c, "#ffd23f", px + 18, y + 2, 2, 2);
    for (let i = 0; i < 4; i++) rect(c, BOOK_COLORS[i], px + 15 + i, y + 26 + i, 2, 2);
  } else if (id === "smudge") {
    // The Ink Smudge
    c.fillStyle = "#141038";
    c.beginPath();
    c.ellipse(px + 16, y + 18, 15, 12, 0, 0, Math.PI * 2);
    c.fill();
    c.beginPath();
    c.arc(px + 8, y + 8, 5, 0, Math.PI * 2);
    c.arc(px + 22, y + 6, 6, 0, Math.PI * 2);
    c.fill();
    eye(px + 9, y + 13);
    eye(px + 18, y + 13);
    rect(c, "#3a3480", px + 6, y + 26, 4, 3);
    if (happy) {
      rect(c, "#ff6fb5", px + 12, y + 22, 8, 2);
      rect(c, "#ff6fb5", px + 10, y + 20, 2, 2);
      rect(c, "#ff6fb5", px + 20, y + 20, 2, 2);
    } else rect(c, "#f2f4ff", px + 12, y + 22, 8, 2);
  }
}

/* --------------------------------------------------------------------- moving things */

function drawEnemy(c: Ctx, e: Enemy, time: number) {
  const k = Math.min(1, e.mt);
  const px = (e.fx + (e.x - e.fx) * k) * T;
  const py = (e.fy + (e.y - e.fy) * k) * T + TOP;
  if (drawPest(c, e.kind, px, py, time, e.id)) return;
  const wob = Math.sin(time * 8 + e.id) * 1;
  if (e.kind === "bunny") {
    c.fillStyle = "#c8c8d8";
    c.beginPath();
    c.arc(px + 8, py + 10, 6 + wob * 0.5, 0, Math.PI * 2);
    c.fill();
    rect(c, "#c8c8d8", px + 4, py + 2, 2, 5);
    rect(c, "#c8c8d8", px + 10, py + 2, 2, 5);
    rect(c, "#1a1030", px + 5, py + 9, 2, 2);
    rect(c, "#1a1030", px + 9, py + 9, 2, 2);
    rect(c, "#ff6fb5", px + 7, py + 12, 2, 1);
    return;
  }
  c.fillStyle = "#141038";
  c.beginPath();
  c.ellipse(px + 8, py + 10, 6 + wob, 6 - wob, 0, 0, Math.PI * 2);
  c.fill();
  c.beginPath();
  c.moveTo(px + 8, py + 1);
  c.lineTo(px + 4, py + 7);
  c.lineTo(px + 12, py + 7);
  c.fill();
  rect(c, "#3a3480", px + 5, py + 6, 2, 2);
  rect(c, "#f2f4ff", px + 4, py + 9, 3, 3);
  rect(c, "#f2f4ff", px + 9, py + 9, 3, 3);
  rect(c, "#e3262f", px + 5, py + 10, 1, 1);
  rect(c, "#e3262f", px + 10, py + 10, 1, 1);
}

const DUSTER_OFF: Record<Dir, [number, number]> = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };

function drawFx(c: Ctx, f: Fx, g: Game) {
  const cx = (x: number) => x * T + 8;
  const cy = (y: number) => y * T + 8 + TOP;
  if (f.kind === "poof") {
    drawPoof(c, g.q.theme, cx(f.x), cy(f.y), f.t);
  } else if (f.kind === "puff") {
    const k = f.t / 0.5;
    for (let i = 0; i < 3; i++) {
      c.fillStyle = `rgba(240, 240, 250, ${0.7 * (1 - k)})`;
      c.beginPath();
      c.arc(cx(f.x) + (i - 1) * 4, cy(f.y) - 4 - k * 12 - i * 2, 3 + k * 4, 0, Math.PI * 2);
      c.fill();
    }
  } else if (f.kind === "swing") {
    const [dx, dy] = DUSTER_OFF[f.dir];
    const [hx, hy] = g.pos;
    const sx = cx(hx) + dx * 10;
    const sy = cy(hy) + dy * 10;
    const sw = Math.sin((f.t / 0.18) * Math.PI) * 5;
    rect(c, "#8a5a2b", sx - 1 + (dy ? sw : 0), sy - 1 + (dx ? sw : 0), 3, 3);
    c.fillStyle = "#ff8ad8";
    c.beginPath();
    c.arc(sx + dx * 4 + (dy ? sw : 0), sy + dy * 4 + (dx ? sw : 0), 4, 0, Math.PI * 2);
    c.fill();
    rect(c, "#ffd23f", sx + dx * 4 + (dy ? sw : 0), sy + dy * 4 + (dx ? sw : 0), 1, 1);
  } else if (f.kind === "boomerang") {
    const n = f.path.length;
    const k = f.t / 0.45;
    const out = k < 0.5 ? k * 2 : (1 - k) * 2;
    const idx = Math.min(n - 1, Math.floor(out * n));
    const [bx, by] = f.path[Math.max(0, idx)];
    c.save();
    c.translate(cx(bx), cy(by));
    c.rotate(f.t * 30);
    rect(c, "#e3262f", -5, -1, 10, 3);
    rect(c, "#ffd23f", -1, -5, 3, 10);
    c.restore();
  } else if (f.kind === "quill") {
    const [hx, hy] = g.pos;
    c.strokeStyle = "#f2f4ff";
    c.lineWidth = 1;
    c.beginPath();
    c.moveTo(cx(hx), cy(hy));
    c.lineTo(cx(f.to[0]), cy(f.to[1]));
    c.stroke();
    rect(c, "#ffd23f", cx(f.to[0]) - 2, cy(f.to[1]) - 2, 4, 4);
  } else if (f.kind === "ring") {
    c.strokeStyle = f.color;
    c.globalAlpha = Math.max(0, 1 - f.t / 0.7);
    c.lineWidth = 2;
    c.beginPath();
    c.arc(cx(f.x), cy(f.y), 4 + f.t * 60, 0, Math.PI * 2);
    c.stroke();
    c.globalAlpha = 1;
  } else if (f.kind === "sparkle") {
    const s = Math.sin(f.t * 20) > 0 ? 3 : 1;
    rect(c, "#ffe9a0", cx(f.x) - s, cy(f.y), s * 2 + 1, 1);
    rect(c, "#ffe9a0", cx(f.x), cy(f.y) - s, 1, s * 2 + 1);
  }
}

/* --------------------------------------------------------------------------- the frame */

/** Each target canvas keeps its own cache of the room's still parts. */
const bgCache = new WeakMap<HTMLCanvasElement, { bg: HTMLCanvasElement; key: string }>();

export function drawFrame(c: Ctx, g: Game, time: number, title: string) {
  c.imageSmoothingEnabled = false;
  const key = `${g.q.id}|${g.s.at.room}|${g.progSig()}|${g.opts.early}|${g.blocks.map((b) => b.join()).join(";")}|${g.s.tide.join(",")}`;
  let cache = bgCache.get(c.canvas);
  if (!cache) {
    const bg = document.createElement("canvas");
    bg.width = W;
    bg.height = H;
    cache = { bg, key: "" };
    bgCache.set(c.canvas, cache);
  }
  if (key !== cache.key) {
    const bc = cache.bg.getContext("2d")!;
    bc.clearRect(0, 0, W, H);
    drawStatic(bc, g);
    cache.key = key;
  }
  rect(c, "#0b0610", 0, 0, W, TOP);
  c.drawImage(cache.bg, 0, 0);

  const room = g.room;
  const theme = g.q.theme;
  // Animated tiles
  for (let ty = 1; ty < ROWS - 1; ty++) {
    for (let tx = 1; tx < COLS - 1; tx++) {
      const t = g.tile(tx, ty);
      const base = room.rows[ty][tx];
      const px = tx * T;
      const py = ty * T + TOP;
      if (t === "T" || t === "Y") {
        rect(c, "#3a3a4a", px + 5, py + 9, 6, 6);
        rect(c, "#6a6a80", px + 3, py + 7, 10, 3);
        if (t === "Y") {
          const fl = Math.sin(time * 14 + tx * 3) > 0 ? 1 : 0;
          rect(c, "#e3262f", px + 4, py + 2 + fl, 8, 5);
          rect(c, "#ffd23f", px + 5, py + 1 + fl, 6, 5);
          rect(c, "#fff6c0", px + 7, py + 3 + fl, 2, 3);
          c.fillStyle = "rgba(255, 210, 63, 0.10)";
          c.beginPath();
          c.arc(px + 8, py + 6, 14, 0, Math.PI * 2);
          c.fill();
        } else rect(c, "#2a2a3a", px + 5, py + 5, 6, 2);
      } else if (t === "R" || t === "r") {
        const on = t === "r";
        const pulse = on ? (Math.sin(time * 6) + 1) / 2 : 0;
        c.fillStyle = on ? `rgb(${120 + pulse * 100}, 240, 255)` : "#5a3a8a";
        c.beginPath();
        c.moveTo(px + 8, py + 1);
        c.lineTo(px + 14, py + 8);
        c.lineTo(px + 8, py + 15);
        c.lineTo(px + 2, py + 8);
        c.fill();
        rect(c, on ? "#ffffff" : "#8a6abf", px + 6, py + 5, 2, 3);
      } else if (t === "_" && base === "i" && Math.sin(time * 3 + tx * 1.7) > 0.85) {
        rect(c, theme === "museum" ? "#8affc1" : "#b05cff", px + 3 + ((tx * 5) % 9), py + 7, 1, 1);
      } else if (t === "P" && room.warp && g.s.restored.includes(room.warp.area)) {
        // A restored wing's gate twinkles.
        const k = Math.sin(time * 4 + tx) > 0 ? 3 : 1;
        rect(c, "#ffd23f", px + 7 - k, py - 6, k * 2 + 2, 2);
        rect(c, "#ffd23f", px + 7, py - 6 - k, 2, k * 2 + 2);
      } else if (t === "~" && Math.sin(time * 2 + tx + ty) > 0.7) {
        rect(c, theme === "volcano" ? "#ffe9a0" : "#9ad0ff", px + 4, py + 7, 4, 1);
      } else if ((t === "w" || t === "u") && Math.sin(time * 2 + tx * 1.3 + ty) > 0.75) {
        rect(c, "#9ad0ff", px + 3 + ((tx * 3) % 8), py + 2, 4, 1);
      } else if (t === "j") {
        const b = Math.round(Math.sin(time * 4 + tx + ty * 2) * 2);
        const sx = Math.floor((time * 10 + tx * 4) % 16);
        rect(c, "#9ad0ff", px + sx, py + 13, 3, 1);
        c.fillStyle = "rgba(255, 140, 210, 0.85)";
        c.beginPath();
        c.arc(px + 8, py + 7 + b, 4, Math.PI, 0);
        c.fill();
        for (let i = 0; i < 3; i++) rect(c, "#ff8ad8", px + 5 + i * 3, py + 7 + b, 1, 3);
      } else if (t === "|" || t === ":") {
        if (t === "|") {
          rect(c, "#2a2a3a", px, py, T, 2);
          for (let i = 1; i < T; i += 4) rect(c, "#c0c8d8", px + i, py, 2, T);
          rect(c, "#8a8aa8", px, py + 7, T, 2);
        } else {
          rect(c, "#2a2a3a", px, py, T, 2);
          for (let i = 1; i < T; i += 4) rect(c, "#8a8aa8", px + i, py, 2, 2);
        }
      } else if (t === "z") {
        const on = g.timerMs > 0;
        const a = on ? (g.timerMs / 1000) * Math.PI : -Math.PI / 2;
        if (on) {
          c.fillStyle = "rgba(255, 210, 63, 0.35)";
          c.beginPath();
          c.arc(px + 8, py + 8, 8, 0, Math.PI * 2);
          c.fill();
        }
        c.strokeStyle = on ? "#e3262f" : "#1a1030";
        c.lineWidth = 1;
        c.beginPath();
        c.moveTo(px + 8, py + 8);
        c.lineTo(px + 8 + Math.cos(a) * 5, py + 8 + Math.sin(a) * 5);
        c.stroke();
      } else if (CONVEYOR_TILES.includes(t)) {
        conveyorArrows(c, theme, px, py, t, time);
      } else if (t === "a") {
        const k = Math.sin(time * 5 + tx) > 0;
        rect(c, "#ffd23f", px + 7, py + 0, 2, 4);
        rect(c, "#ffd23f", px + (k ? 3 : 5), py + 0, k ? 10 : 6, 2);
      } else if (t === "+") {
        c.fillStyle = `rgba(255, 138, 61, ${0.15 + 0.1 * Math.sin(time * 5 + tx)})`;
        c.beginPath();
        c.arc(px + 8, py + 7, 12, 0, Math.PI * 2);
        c.fill();
      } else if (t === "%") {
        for (let i = 0; i < 3; i++) {
          const k = ((time * 3 + i / 3) % 1);
          c.fillStyle = `rgba(240, 240, 250, ${0.85 - k * 0.6})`;
          c.beginPath();
          c.arc(px + 4 + i * 4, py + 12 - k * 14, 3 + k * 3, 0, Math.PI * 2);
          c.fill();
        }
      } else if (t === ";" && Math.sin(time * 3 + tx) > 0.6) {
        rect(c, "rgba(240,240,250,0.5)", px + 7, py + 3, 2, 2);
      } else if (t === "q") {
        const b = Math.round(Math.sin(time * 3 + tx) * 1.5);
        c.fillStyle = "rgba(248, 248, 255, 0.92)";
        c.beginPath();
        c.arc(px + 8, py + 7 + b, 6, Math.PI, 0);
        c.lineTo(px + 14, py + 14 + b);
        c.lineTo(px + 11, py + 12 + b);
        c.lineTo(px + 8, py + 15 + b);
        c.lineTo(px + 5, py + 12 + b);
        c.lineTo(px + 2, py + 14 + b);
        c.fill();
        rect(c, "#1a1030", px + 5, py + 5 + b, 2, 2);
        rect(c, "#1a1030", px + 9, py + 5 + b, 2, 2);
        rect(c, "#ff8ab0", px + 3, py + 8 + b, 2, 1);
        rect(c, "#ff8ab0", px + 11, py + 8 + b, 2, 1);
        rect(c, "#1a1030", px + 7, py + 9 + b, 2, 1);
      } else if (t === "F" && theme !== "library") {
        drawHelper(c, theme, px, py, time);
      }
    }
  }

  // Guardian (2 x 2)
  const gid = g.area.guardian;
  if (gid) {
    const gs = Game.tilesOf(room, "G");
    if (gs.length) {
      const [gx, gy] = gs[0];
      const happy = g.s.at.area === g.q.final ? g.s.finished : g.s.restored.includes(g.s.at.area);
      drawGuardian(c, gid, gx * T, gy * T + TOP, time, happy);
    }
  }

  // Crates
  g.blocks.forEach(([bx, by], i) => {
    let px = bx * T;
    let py = by * T + TOP;
    const pa = g.pushAnim;
    if (pa && pa.i === i && pa.t < 1) {
      px = (pa.fx + (bx - pa.fx) * pa.t) * T;
      py = (pa.fy + (by - pa.fy) * pa.t) * T + TOP;
    }
    drawCrate(c, theme, Math.round(px), Math.round(py));
  });

  // Heart drops
  for (const [dx, dy] of g.drops) {
    const px = dx * T;
    const py = dy * T + TOP + Math.round(Math.sin(time * 5));
    rect(c, "#e3262f", px + 4, py + 5, 3, 3);
    rect(c, "#e3262f", px + 9, py + 5, 3, 3);
    rect(c, "#e3262f", px + 4, py + 7, 8, 3);
    rect(c, "#e3262f", px + 6, py + 10, 4, 2);
  }

  for (const e of g.enemies) drawEnemy(c, e, time);
  drawHero(c, g, time);
  for (const f of g.fx) drawFx(c, f, g);

  // Title band
  c.fillStyle = "#ffd23f";
  c.font = '8px "Press Start 2P", monospace';
  c.textBaseline = "alphabetic";
  c.textAlign = "left";
  c.fillText(title.toUpperCase(), 3, TOP);
  // A running clock switch: seconds left, top right
  if (g.timerMs > 0) {
    const secs = Math.ceil(g.timerMs / 1000);
    c.fillStyle = secs <= 2 && Math.floor(time * 6) % 2 ? "#e3262f" : "#ffd23f";
    c.textAlign = "right";
    c.fillText(`⏱${secs}`, W - 3, TOP);
    c.textAlign = "left";
  }
}
