/*
 * Quest of the Lost Library: pixel art, all drawn in code (no image files). The 320 x 200 screen is
 * an 8 px title band plus the 20 x 12 room of 16 px tiles. The room's still parts are cached on an
 * offscreen canvas and redrawn only when something changes; torches, water, crystals, the hero,
 * ink sprites and effects are drawn every frame.
 */
import { Game, type Enemy, type Fx } from "./game";
import { COLS, ROWS, GUARDIAN_ROOM, type AreaId, type Dir, type GuardianId, type RoomDef } from "./world";

export const W = 320;
export const H = 200;
export const TOP = 8;
const T = 16;

interface Pal {
  floorA: string;
  floorB: string;
  rug: string;
  rugEdge: string;
  shelf: string;
  shelfDark: string;
  accent: string;
  building: string;
  buildingDark: string;
}

const PAL: Record<AreaId, Pal> = {
  hub: { floorA: "#3f8f3a", floorB: "#3a8636", rug: "#c9a66b", rugEdge: "#a8854f", shelf: "#1f5a2a", shelfDark: "#143d1c", accent: "#ffd23f", building: "#8a7a6a", buildingDark: "#5c4f44" },
  math: { floorA: "#6b3a2a", floorB: "#5e3224", rug: "#a3242c", rugEdge: "#ffd23f", shelf: "#5a2a1a", shelfDark: "#341509", accent: "#e3262f", building: "#a3242c", buildingDark: "#6a141a" },
  science: { floorA: "#2e5a4a", floorB: "#2a5244", rug: "#1f8f55", rugEdge: "#8affc1", shelf: "#23402f", shelfDark: "#132619", accent: "#2fbf71", building: "#1f8f55", buildingDark: "#0f5532" },
  story: { floorA: "#4a2f63", floorB: "#43295a", rug: "#7a3aa8", rugEdge: "#ff8ad8", shelf: "#3a1f4f", shelfDark: "#1f0f2c", accent: "#b05cff", building: "#7a3aa8", buildingDark: "#4a1f6a" },
  history: { floorA: "#6a5232", floorB: "#614a2c", rug: "#2456e8", rugEdge: "#ffd23f", shelf: "#3a2a1a", shelfDark: "#21170c", accent: "#6ea0ff", building: "#2456e8", buildingDark: "#14348c" },
  reading: { floorA: "#6b4a2a", floorB: "#634426", rug: "#b8862a", rugEdge: "#ffe9a0", shelf: "#4a3410", shelfDark: "#2a1d08", accent: "#ffd23f", building: "#b8862a", buildingDark: "#7a5612" },
};

/** Gate building colors in town, by room. */
const GATE_COLOR: Record<string, [string, string]> = {
  "h-math": ["#a3242c", "#6a141a"],
  "h-sci": ["#1f8f55", "#0f5532"],
  "h-story": ["#7a3aa8", "#4a1f6a"],
  "h-hist": ["#2456e8", "#14348c"],
  "h-steps": ["#b0a090", "#7a6a5a"],
};
const BOOK_COLORS = ["#e3262f", "#2456e8", "#ffd23f", "#2fbf71", "#b05cff", "#ff8a3d", "#f2f4ff", "#3ad6c6", "#ff6fb5"];

function hash(x: number, y: number, s = 0): number {
  let h = (x * 374761393 + y * 668265263 + s * 2147483647) | 0;
  h = (h ^ (h >>> 13)) * 1274126177;
  return (h ^ (h >>> 16)) >>> 0;
}

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

function drawHero(c: Ctx, g: Game, time: number) {
  const { x, y, facing } = g.s.at;
  const a = g.anim;
  const k = Math.min(1, a.t);
  const px = (a.fx + (x - a.fx) * k) * T;
  const py = (a.fy + (y - a.fy) * k) * T + TOP;
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

function floor(c: Ctx, p: Pal, area: AreaId, px: number, py: number, tx: number, ty: number) {
  if (area === "hub") {
    rect(c, p.floorA, px, py, T, T);
    const h = hash(tx, ty, 7);
    rect(c, "#4fa346", px + (h % 12), py + ((h >> 4) % 12), 2, 1);
    rect(c, "#327a2e", px + ((h >> 8) % 12), py + ((h >> 12) % 12), 1, 2);
    return;
  }
  rect(c, (tx + ty) % 2 ? p.floorA : p.floorB, px, py, T, T);
  rect(c, "rgba(0,0,0,0.12)", px, py + T - 1, T, 1);
  rect(c, "rgba(255,255,255,0.05)", px, py, T, 1);
}

function building(c: Ctx, room: RoomDef, p: Pal, px: number, py: number, tx: number, ty: number) {
  const [col, dark] = GATE_COLOR[room.id] ?? [p.building, p.buildingDark];
  rect(c, dark, px, py, T, T);
  const off = ty % 2 ? 4 : 0;
  for (let bx = -8; bx < T; bx += 8) rect(c, col, px + Math.max(0, bx + off) + 1, py + 1, Math.min(7, T - Math.max(0, bx + off) - 1), 6);
  for (let bx = -8; bx < T; bx += 8) rect(c, col, px + Math.max(0, bx + 4 - off) + 1, py + 9, Math.min(7, T - Math.max(0, bx + 4 - off) - 1), 6);
  // A roof edge on the building's top row
  if (ty === 1) rect(c, "#2a1d10", px, py, T, 3);
  void tx;
}

function door(c: Ctx, kind: string, p: Pal, px: number, py: number, time: number) {
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
    shelf(c, p, px, py, Math.floor(px / T), Math.floor(py / T), true);
  }
}

function drawStatic(c: Ctx, g: Game) {
  const room = g.room;
  const area = g.s.at.area;
  const p = PAL[area];
  for (let ty = 0; ty < ROWS; ty++) {
    for (let tx = 0; tx < COLS; tx++) {
      const px = tx * T;
      const py = ty * T + TOP;
      const t = g.tile(tx, ty);
      const base = room.rows[ty][tx];
      const isGap = (tx === 0 || ty === 0 || tx === COLS - 1 || ty === ROWS - 1) && base === "#" && t !== "#";
      if (t === "#" || t === "H") {
        if (area === "hub") hedge(c, px, py, tx, ty);
        else shelf(c, p, px, py, tx, ty, t === "H");
        continue;
      }
      if (isGap) {
        if ("DLQ".includes(t)) door(c, t, p, px, py, 0);
        else {
          floor(c, p, area, px, py, tx, ty);
          rect(c, "rgba(0,0,0,0.25)", px, py, T, T);
        }
        continue;
      }
      // Floors under everything else
      if (t === "W") {
        building(c, room, p, px, py, tx, ty);
        continue;
      }
      if (t === "_" || t === "~") {
        if (t === "_") {
          rect(c, "#05030a", px, py, T, T);
          if (g.tile(tx, ty - 1) !== "_") rect(c, "#2a1d3a", px, py, T, 3);
        } else {
          rect(c, "#1f5fbf", px, py, T, T);
          rect(c, "#3a7fdf", px + 2 + (hash(tx, ty) % 6), py + 5, 5, 1);
          rect(c, "#3a7fdf", px + 6 + (hash(ty, tx) % 5), py + 11, 4, 1);
        }
        continue;
      }
      if (t === "=") {
        rect(c, "#a8854f", px, py, T, T);
        for (let i = 0; i < 4; i++) {
          const h = hash(tx, ty, i);
          rect(c, "#c9a66b", px + (i % 2) * 8 + 1, py + Math.floor(i / 2) * 8 + 1, 6 + (h % 2), 6);
        }
        continue;
      }
      floor(c, p, area, px, py, tx, ty);
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
        for (let i = 0; i < 3; i++) {
          const h = hash(tx, ty, i + 3);
          rect(c, ["#ff6fb5", "#ffd23f", "#f2f4ff"][i], px + 2 + (h % 10), py + 2 + ((h >> 4) % 10), 2, 2);
        }
      } else if (t === "S") {
        rect(c, "#3a3a4a", px + 2, py + 2, 12, 12);
        rect(c, "#6a6a80", px + 3, py + 3, 10, 10);
        rect(c, g.blockAt(tx, ty) >= 0 ? "#5fff8a" : "#e3262f", px + 6, py + 6, 4, 4);
      } else if (t === "^") {
        c.fillStyle = g.opts.early ? "rgba(20, 16, 60, 0.35)" : "#141038";
        c.beginPath();
        c.ellipse(px + 8, py + 9, 7, 5, 0, 0, Math.PI * 2);
        c.fill();
        if (!g.opts.early) {
          rect(c, "#3a3480", px + 5, py + 7, 3, 1);
          rect(c, "#3a3480", px + 10, py + 10, 2, 1);
        }
      } else if (t === "I") {
        rect(c, "#05030a", px, py, T, T);
        rect(c, "#8a5a2b", px, py + 3, T, 10);
        for (let i = 0; i < T; i += 4) rect(c, "#6a4220", px + i, py + 3, 1, 10);
        rect(c, "rgba(176, 92, 255, 0.35)", px, py + 2, T, 12);
      } else if (t === "t") {
        rect(c, "#5a3a1a", px + 6, py + 10, 4, 6);
        c.fillStyle = "#1f6a2a";
        c.beginPath();
        c.arc(px + 8, py + 7, 7, 0, Math.PI * 2);
        c.fill();
        rect(c, "#2f8f3a", px + 4, py + 3, 4, 3);
      } else if (t === "N") {
        rect(c, "#5a3a1a", px + 7, py + 8, 2, 7);
        rect(c, "#3a2410", px + 4, py + 14, 8, 2);
        rect(c, "#8a5a2b", px + 2, py + 4, 12, 5);
        rect(c, "#f2ead0", px + 3, py + 3, 5, 4);
        rect(c, "#f2ead0", px + 8, py + 3, 5, 4);
        rect(c, "#9a8a6a", px + 4, py + 4, 3, 1);
        rect(c, "#9a8a6a", px + 9, py + 4, 3, 1);
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
        rect(c, "#5a3a1a", px + 6, py + 12, 4, 3);
        c.fillStyle = "#2456e8";
        c.beginPath();
        c.arc(px + 8, py + 7, 6, 0, Math.PI * 2);
        c.fill();
        rect(c, "#2fbf71", px + 5, py + 4, 4, 3);
        rect(c, "#2fbf71", px + 8, py + 8, 3, 3);
      } else if (t === "P" || t === "X") {
        const [col, dark] = GATE_COLOR[room.id] ?? [p.building, p.buildingDark];
        rect(c, dark, px, py, T, T);
        rect(c, t === "X" ? "#3a2a1a" : "#1a0f08", px + 2, py + 2, 12, 14);
        rect(c, col, px + 2, py + 2, 12, 2);
        if (t === "X") {
          // Four book-shaped holes (filled as wings are restored)
          const filled = g.s.restored.length;
          const left = room.rows[ty][tx - 1] === "P";
          for (let i = 0; i < 2; i++) {
            const n = (left ? 2 : 0) + i;
            rect(c, n < filled ? BOOK_COLORS[n] : "#0b0610", px + 4 + i * 5, py + 6, 3, 6);
          }
        } else {
          rect(c, "#ffd23f", px + (room.rows[ty][tx - 1] === "P" ? 3 : 11), py + 9, 2, 2);
        }
      } else if (t === "F") {
        drawOwl(c, px, py);
      }
    }
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

function drawGuardian(c: Ctx, id: GuardianId, px: number, py: number, time: number, happy: boolean) {
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
  } else {
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

function drawBlock(c: Ctx, px: number, py: number) {
  rect(c, "#2a1608", px + 1, py + 1, 14, 14);
  rect(c, "#a86a2a", px + 2, py + 2, 12, 12);
  rect(c, "#8a5a2b", px + 2, py + 7, 12, 2);
  rect(c, "#8a5a2b", px + 7, py + 2, 2, 12);
  rect(c, "#e3262f", px + 3, py + 3, 3, 3);
  rect(c, "#2456e8", px + 10, py + 10, 3, 3);
}

const DUSTER_OFF: Record<Dir, [number, number]> = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };

function drawFx(c: Ctx, f: Fx, g: Game) {
  const cx = (x: number) => x * T + 8;
  const cy = (y: number) => y * T + 8 + TOP;
  if (f.kind === "poof") {
    const r = 2 + f.t * 22;
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      rect(c, i % 2 ? "#ffd23f" : "#f2f4ff", cx(f.x) + Math.cos(a) * r - 1, cy(f.y) + Math.sin(a) * r - 1, 3, 3);
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

let bgCanvas: HTMLCanvasElement | null = null;
let bgKey = "";

export function drawFrame(c: Ctx, g: Game, time: number, title: string) {
  c.imageSmoothingEnabled = false;
  const key = `${g.s.at.room}|${g.progSig()}|${g.opts.early}|${g.blocks.map((b) => b.join()).join(";")}`;
  if (!bgCanvas) {
    bgCanvas = document.createElement("canvas");
    bgCanvas.width = W;
    bgCanvas.height = H;
  }
  if (key !== bgKey) {
    const bc = bgCanvas.getContext("2d")!;
    bc.clearRect(0, 0, W, H);
    drawStatic(bc, g);
    bgKey = key;
  }
  rect(c, "#0b0610", 0, 0, W, TOP);
  c.drawImage(bgCanvas, 0, 0);

  const room = g.room;
  // Animated tiles
  for (let ty = 1; ty < ROWS - 1; ty++) {
    for (let tx = 1; tx < COLS - 1; tx++) {
      const t = g.tile(tx, ty);
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
      } else if (t === "_" && room.rows[ty][tx] === "i" && Math.sin(time * 3 + tx * 1.7) > 0.85) {
        rect(c, "#b05cff", px + 3 + ((tx * 5) % 9), py + 7, 1, 1);
      } else if (t === "P" && room.warp && (g.s.restored as string[]).includes(room.warp.area)) {
        // A restored wing's gate twinkles.
        const k = Math.sin(time * 4 + tx) > 0 ? 3 : 1;
        rect(c, "#ffd23f", px + 7 - k, py - 6, k * 2 + 2, 2);
        rect(c, "#ffd23f", px + 7, py - 6 - k, 2, k * 2 + 2);
      } else if (t === "~" && Math.sin(time * 2 + tx + ty) > 0.7) {
        rect(c, "#9ad0ff", px + 4, py + 7, 4, 1);
      }
    }
  }

  // Guardian (2 x 2) and Folio
  const gid = g.area.guardian;
  if (gid && GUARDIAN_ROOM[gid] === room.id) {
    const gs = Game.tilesOf(room, "G");
    if (gs.length) {
      const [gx, gy] = gs[0];
      const happy = gid === "smudge" ? g.s.finished : g.s.restored.some((w) => w === g.wing);
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
    drawBlock(c, Math.round(px), Math.round(py));
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
}
