/*
 * Pixel art for the new quests' characters, all drawn in code: guardians (2 x 2 tiles), helpers
 * (one tile), pests and their "poof", and themed crates. Every character is original and friendly.
 */

export type Ctx = CanvasRenderingContext2D;
export const rect = (c: Ctx, color: string, x: number, y: number, w: number, h: number) => {
  c.fillStyle = color;
  c.fillRect(x, y, w, h);
};
const disc = (c: Ctx, color: string, x: number, y: number, r: number) => {
  c.fillStyle = color;
  c.beginPath();
  c.arc(x, y, r, 0, Math.PI * 2);
  c.fill();
};
const oval = (c: Ctx, color: string, x: number, y: number, rx: number, ry: number) => {
  c.fillStyle = color;
  c.beginPath();
  c.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  c.fill();
};

export function hash(x: number, y: number, s = 0): number {
  let h = (x * 374761393 + y * 668265263 + s * 2147483647) | 0;
  h = (h ^ (h >>> 13)) * 1274126177;
  return (h ^ (h >>> 16)) >>> 0;
}

function eye(c: Ctx, ex: number, ey: number, time: number, size = 5) {
  rect(c, "#f2f4ff", ex, ey, size, size);
  rect(c, "#1a1030", ex + Math.floor(size / 2) + (Math.sin(time) > 0.6 ? 1 : 0), ey + Math.floor(size / 2), 2, 2);
}
function sleepy(c: Ctx, ex: number, ey: number) {
  rect(c, "#1a1030", ex, ey + 2, 5, 1);
}
function smile(c: Ctx, x: number, y: number, w: number, color = "#1a1030") {
  rect(c, color, x + 1, y + 1, w - 2, 1);
  rect(c, color, x, y, 1, 1);
  rect(c, color, x + w - 1, y, 1, 1);
}
function blush(c: Ctx, x: number, y: number) {
  rect(c, "#ff8ab0", x, y, 3, 2);
}

/** A new quest's guardian at (px, py), 32 x 32. Returns false for an unknown id. */
export function drawQuestGuardian(c: Ctx, id: string, px: number, py: number, time: number, happy: boolean): boolean {
  const bob = Math.round(Math.sin(time * 2.5) * 1.5);
  const y = py + bob;
  const wig = (k: number, a = 2) => Math.round(Math.sin(time * 4 + k) * a);
  switch (id) {
    /* ---- The Sunken Lighthouse */
    case "pufferton": {
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2;
        rect(c, "#c98a1a", px + 16 + Math.cos(a) * 14 - 1, y + 18 + Math.sin(a) * 12 - 1, 3, 3);
      }
      oval(c, "#ffd23f", px + 16, y + 18, 13, 11);
      oval(c, "#fff2a8", px + 16, y + 22, 9, 6);
      for (const [dx, dy] of [[8, 14], [22, 13], [12, 24], [21, 23]]) rect(c, "#c98a1a", px + dx, y + dy, 2, 2);
      eye(c, px + 9, y + 13, time);
      eye(c, px + 18, y + 13, time);
      rect(c, "#ff8a3d", px - 1, y + 16 + wig(1, 1), 4, 5);
      rect(c, "#ff8a3d", px + 29, y + 16 + wig(2, 1), 4, 5);
      // mortarboard
      rect(c, "#1a1030", px + 7, y + 4, 18, 3);
      rect(c, "#1a1030", px + 11, y + 7, 10, 3);
      rect(c, "#ffd23f", px + 23, y + 5, 1, 6);
      if (happy) smile(c, px + 13, y + 20, 6);
      else rect(c, "#1a1030", px + 14, y + 21, 4, 2);
      return true;
    }
    case "octavia": {
      for (let i = 0; i < 8; i++) {
        const bx = px + 3 + i * 3.6;
        for (let k = 0; k < 4; k++) rect(c, i % 2 ? "#a35cd6" : "#8a3fc0", bx + wig(i + k, 1.5), y + 18 + k * 3, 3, 3);
        rect(c, "#ffd0f0", bx + 1 + wig(i + 3, 1.5), y + 28, 2, 2);
      }
      oval(c, "#a35cd6", px + 16, y + 12, 11, 10);
      rect(c, "#c88aff", px + 10, y + 4, 4, 3);
      eye(c, px + 9, y + 10, time);
      eye(c, px + 18, y + 10, time);
      blush(c, px + 7, y + 17);
      blush(c, px + 22, y + 17);
      if (happy) smile(c, px + 13, y + 17, 6);
      // counting beads held up
      for (let i = 0; i < 3; i++) disc(c, ["#e3262f", "#ffd23f", "#2fbf71"][i], px + 2 + i * 13, y + 20 + wig(i, 2), 2);
      return true;
    }
    case "quillfin": {
      // a seahorse: snout, head, belly, curled tail; a captain's hat; a book under a fin
      rect(c, "#ff8a3d", px + 12, y + 8, 10, 8);
      rect(c, "#ff8a3d", px + 21, y + 11, 7, 3);
      rect(c, "#ff8a3d", px + 11, y + 15, 10, 9);
      rect(c, "#ffc07a", px + 13, y + 16, 6, 7);
      rect(c, "#ff8a3d", px + 12, y + 24, 5, 3);
      rect(c, "#ff8a3d", px + 9, y + 26, 5, 2);
      rect(c, "#ff8a3d", px + 8, y + 23, 2, 4);
      for (let i = 0; i < 4; i++) rect(c, "#c85a1a", px + 10, y + 10 + i * 4, 2, 2);
      eye(c, px + 15, y + 9, time, 4);
      rect(c, "#14348c", px + 10, y + 3, 14, 5);
      rect(c, "#14348c", px + 8, y + 7, 18, 2);
      rect(c, "#ffd23f", px + 16, y + 4, 2, 2);
      rect(c, "#e3262f", px + 20, y + 18 + wig(0, 1), 7, 9);
      rect(c, "#f2ead0", px + 21, y + 19 + wig(0, 1), 5, 7);
      if (happy) smile(c, px + 22, y + 14, 5);
      return true;
    }
    case "murkle": {
      const g = happy ? "#e8eef8" : "#9aa4b8";
      const d = happy ? "#c8d4e8" : "#76809a";
      for (const [dx, dy, r] of [[8, 16, 8], [16, 11, 9], [24, 16, 8], [12, 21, 7], [21, 21, 7]] as [number, number, number][]) disc(c, d, px + dx, y + dy + 1, r);
      for (const [dx, dy, r] of [[8, 15, 7], [16, 10, 8], [24, 15, 7], [12, 20, 6], [21, 20, 6]] as [number, number, number][]) disc(c, g, px + dx, y + dy, r);
      if (happy) {
        eye(c, px + 10, y + 12, time);
        eye(c, px + 18, y + 12, time);
        smile(c, px + 13, y + 20, 7);
        blush(c, px + 7, y + 18);
        blush(c, px + 23, y + 18);
      } else {
        sleepy(c, px + 10, y + 12);
        sleepy(c, px + 18, y + 12);
        rect(c, "#3a3a4a", px + 14, y + 20, 5, 2);
        for (let i = 0; i < 3; i++) rect(c, "#6ea0ff", px + 6 + i * 9, y + 28 + ((Math.floor(time * 6) + i) % 3), 1, 2);
      }
      return true;
    }
    /* ---- The Clockwork Castle */
    case "sprocket": {
      rect(c, "#8a8aa8", px + 9, y + 12, 14, 14);
      rect(c, "#c0c8d8", px + 10, y + 13, 12, 12);
      rect(c, "#8a8aa8", px + 10, y + 26, 4, 5);
      rect(c, "#8a8aa8", px + 18, y + 26, 4, 5);
      rect(c, "#c0c8d8", px + 10, y + 2, 12, 11);
      rect(c, "#1a1030", px + 12, y + 6, 8, 2);
      rect(c, happy ? "#5fff8a" : "#6ea0ff", px + 13, y + 6, 2, 2);
      rect(c, happy ? "#5fff8a" : "#6ea0ff", px + 17, y + 6, 2, 2);
      rect(c, "#e3262f", px + 15, y - 2 + wig(0, 1), 3, 5);
      // gear shield
      disc(c, "#b8862a", px + 5, y + 19, 6);
      disc(c, "#ffd23f", px + 5, y + 19, 4);
      disc(c, "#b8862a", px + 5, y + 19, 1.5);
      // wind-up key on the back
      const k = Math.sin(time * 3) > 0;
      rect(c, "#ffd23f", px + 23, y + 17, 4, 2);
      rect(c, "#ffd23f", px + 27, y + (k ? 13 : 15), 2, k ? 10 : 6);
      if (happy) smile(c, px + 13, y + 9, 6, "#1a1030");
      return true;
    }
    case "chimewell": {
      rect(c, "#d85a9a", px + 3, y + 22, 26, 9);
      rect(c, "#ff8ad8", px + 4, y + 23, 24, 3);
      rect(c, "#ffd23f", px + 3, y + 28, 26, 1);
      oval(c, "#f2f4ff", px + 15, y + 18, 11, 6);
      rect(c, "#f2f4ff", px + 21, y + 6, 4, 13);
      rect(c, "#f2f4ff", px + 21, y + 3, 7, 5);
      rect(c, "#ff8a3d", px + 28, y + 5, 3, 2);
      eye(c, px + 23, y + 3, time, 3);
      rect(c, "#ffd23f", px + 21, y + 0, 2, 3);
      rect(c, "#ffd23f", px + 24, y - 1, 2, 4);
      rect(c, "#ffd23f", px + 27, y + 0, 2, 3);
      rect(c, "#dcdcf0", px + 6, y + 15 + wig(1, 1), 8, 3);
      // music notes
      for (let i = 0; i < 2; i++) {
        const nx = px + 4 + i * 8;
        const ny = y + 4 + ((Math.floor(time * 2) + i) % 3) * 2;
        rect(c, "#6ea0ff", nx, ny + 3, 3, 2);
        rect(c, "#6ea0ff", nx + 2, ny, 1, 4);
      }
      if (happy) blush(c, px + 25, y + 7);
      return true;
    }
    case "windleby": {
      oval(c, "#2fbf71", px + 16, y + 20, 12, 9);
      oval(c, "#8affc1", px + 16, y + 23, 8, 5);
      disc(c, "#2fbf71", px + 9, y + 10, 5);
      disc(c, "#2fbf71", px + 23, y + 10, 5);
      // goggles
      disc(c, "#b8862a", px + 9, y + 10, 4);
      disc(c, "#b8862a", px + 23, y + 10, 4);
      disc(c, "#bfe8ff", px + 9, y + 10, 3);
      disc(c, "#bfe8ff", px + 23, y + 10, 3);
      rect(c, "#1a1030", px + 9 + (Math.sin(time) > 0.6 ? 1 : 0), y + 10, 2, 2);
      rect(c, "#1a1030", px + 23 + (Math.sin(time) > 0.6 ? 1 : 0), y + 10, 2, 2);
      rect(c, "#2fbf71", px + 2, y + 25, 7, 3);
      rect(c, "#2fbf71", px + 23, y + 25, 7, 3);
      if (happy) smile(c, px + 11, y + 17, 10);
      else rect(c, "#1a5a2a", px + 12, y + 18, 8, 1);
      const k = Math.sin(time * 3) > 0;
      rect(c, "#ffd23f", px + 15, y + 27, 2, 4);
      rect(c, "#ffd23f", px + (k ? 11 : 13), y + 30, k ? 10 : 6, 2);
      return true;
    }
    case "tock": {
      rect(c, "#5a3a1a", px + 7, y + 0, 18, 32);
      rect(c, "#8a5a2b", px + 9, y + 2, 14, 28);
      disc(c, "#f2ead0", px + 16, y + 10, 6);
      const a = happy ? time * 2 : 0;
      c.strokeStyle = "#1a1030";
      c.lineWidth = 1;
      c.beginPath();
      c.moveTo(px + 16, y + 10);
      c.lineTo(px + 16 + Math.cos(a - Math.PI / 2) * 5, y + 10 + Math.sin(a - Math.PI / 2) * 5);
      c.moveTo(px + 16, y + 10);
      c.lineTo(px + 16 + Math.cos(a / 12) * 3, y + 10 + Math.sin(a / 12) * 3);
      c.stroke();
      if (happy) {
        eye(c, px + 10, y + 16, time, 4);
        eye(c, px + 18, y + 16, time, 4);
        smile(c, px + 13, y + 22, 6);
      } else {
        sleepy(c, px + 10, y + 16);
        sleepy(c, px + 18, y + 16);
        rect(c, "#f2f4ff", px + 26, y + 2, 3, 1);
        rect(c, "#f2f4ff", px + 28, y + 3, 1, 1);
        rect(c, "#f2f4ff", px + 26, y + 4, 3, 1);
      }
      const sw = happy ? Math.round(Math.sin(time * 4) * 3) : 0;
      rect(c, "#2a1608", px + 11, y + 24, 10, 6);
      rect(c, "#ffd23f", px + 15 + sw, y + 24, 1, 4);
      disc(c, "#ffd23f", px + 15.5 + sw, y + 28, 2);
      return true;
    }
    /* ---- The Volcano Observatory */
    case "cindersnout": {
      rect(c, "#e3562f", px + 6, y + 16, 20, 9);
      rect(c, "#e3562f", px + 22, y + 10, 9, 9);
      rect(c, "#e3562f", px + 1, y + 20 + wig(0, 1), 6, 3);
      for (const [dx, dy] of [[9, 18], [14, 17], [19, 19], [25, 12]]) rect(c, "#ffd23f", px + dx, y + dy, 2, 2);
      rect(c, "#e3562f", px + 8, y + 25, 3, 4);
      rect(c, "#e3562f", px + 20, y + 25, 3, 4);
      rect(c, "#8a8aa8", px + 22, y + 11, 9, 2);
      disc(c, "#bfe8ff", px + 25, y + 14, 2);
      disc(c, "#bfe8ff", px + 29, y + 14, 2);
      rect(c, "#1a1030", px + 25, y + 14, 1, 1);
      rect(c, "#1a1030", px + 29, y + 14, 1, 1);
      if (happy) smile(c, px + 25, y + 17, 5);
      // lab coat collar
      rect(c, "#f2f4ff", px + 18, y + 16, 5, 6);
      return true;
    }
    case "kettleby": {
      oval(c, "#3a7fdf", px + 15, y + 19, 12, 10);
      oval(c, "#9ad0ff", px + 15, y + 17, 8, 4);
      rect(c, "#3a7fdf", px + 25, y + 13, 3, 3);
      rect(c, "#3a7fdf", px + 27, y + 10, 3, 4);
      rect(c, "#3a7fdf", px + 1, y + 15, 3, 9);
      rect(c, "#3a7fdf", px + 3, y + 14, 2, 2);
      rect(c, "#3a7fdf", px + 3, y + 23, 2, 2);
      rect(c, "#2456e8", px + 9, y + 7, 13, 3);
      rect(c, "#ffd23f", px + 14, y + 4, 3, 3);
      eye(c, px + 9, y + 14, time, 4);
      eye(c, px + 18, y + 14, time, 4);
      if (happy) smile(c, px + 12, y + 21, 7);
      else rect(c, "#14348c", px + 13, y + 22, 5, 1);
      for (let i = 0; i < 3; i++) disc(c, "rgba(240,244,255,0.75)", px + 30 + i * 2, y + 7 - i * 3 - ((time * 6) % 3), 2 + i * 0.5);
      return true;
    }
    case "astra": {
      for (let i = 0; i < 6; i++) disc(c, i % 2 ? "#bfe8ff" : "#6ea0ff", px + 4 + i * 2, y + 22 - i * 2 + wig(i, 1), 4 - i * 0.4);
      for (let i = 0; i < 4; i++) {
        const s = (Math.floor(time * 5) + i) % 4;
        rect(c, "#ffe9a0", px + 1 + i * 4, y + 26 - i * 5 - s, 1, 1);
      }
      oval(c, "#f2f4ff", px + 19, y + 21, 8, 6);
      rect(c, "#f2f4ff", px + 15, y + 26, 2, 5);
      rect(c, "#f2f4ff", px + 22, y + 26, 2, 5);
      oval(c, "#f2f4ff", px + 23, y + 12, 6, 5);
      rect(c, "#f2f4ff", px + 18, y + 5, 3, 5);
      rect(c, "#f2f4ff", px + 26, y + 5, 3, 5);
      rect(c, "#6ea0ff", px + 19, y + 6, 1, 3);
      rect(c, "#6ea0ff", px + 27, y + 6, 1, 3);
      rect(c, "#1a1030", px + 28, y + 13, 2, 2);
      eye(c, px + 20, y + 9, time, 3);
      eye(c, px + 25, y + 9, time, 3);
      if (happy) blush(c, px + 19, y + 14);
      return true;
    }
    case "rumble": {
      c.fillStyle = "#6a4a32";
      c.beginPath();
      c.moveTo(px + 2, y + 31);
      c.lineTo(px + 11, y + 10);
      c.lineTo(px + 21, y + 10);
      c.lineTo(px + 30, y + 31);
      c.fill();
      rect(c, happy ? "#ffd23f" : "#ff5a1f", px + 11, y + 9, 10, 3);
      for (const [dx, dy, r] of [[12, 5, 4], [18, 3, 5], [23, 6, 3]] as [number, number, number][]) disc(c, happy ? "#f2f4ff" : "#8a8a9a", px + dx, y + dy - ((time * 4) % 2), r);
      if (happy) {
        eye(c, px + 10, y + 16, time, 4);
        eye(c, px + 18, y + 16, time, 4);
        smile(c, px + 13, y + 23, 6);
        blush(c, px + 8, y + 22);
        blush(c, px + 22, y + 22);
      } else {
        rect(c, "#1a1030", px + 10, y + 17, 5, 2);
        rect(c, "#1a1030", px + 18, y + 17, 5, 2);
        rect(c, "#ffd23f", px + 11, y + 17, 2, 1);
        rect(c, "#ffd23f", px + 19, y + 17, 2, 1);
        rect(c, "#1a1030", px + 13, y + 24, 6, 1);
      }
      return true;
    }
    /* ---- The Haunted Museum (silly, never scary) */
    case "tickletooth": {
      const bone = "#f2ead0";
      rect(c, "#8a5a2b", px + 4, y + 29, 24, 3);
      rect(c, bone, px + 18, y + 4, 12, 8);
      rect(c, "#1a1030", px + 22, y + 6, 2, 2);
      rect(c, bone, px + 20, y + 12, 9, 2);
      for (let i = 0; i < 4; i++) rect(c, "#1a1030", px + 21 + i * 2, y + 11, 1, 1);
      rect(c, bone, px + 8, y + 13, 13, 2);
      for (let i = 0; i < 4; i++) rect(c, bone, px + 9 + i * 3, y + 15, 1, 7);
      rect(c, bone, px + 8, y + 22, 13, 2);
      rect(c, bone, px + 1, y + 16 + wig(0, 1), 8, 2);
      rect(c, bone, px + 10, y + 24, 2, 5);
      rect(c, bone, px + 17, y + 24, 2, 5);
      rect(c, bone, px + 22, y + 14, 4, 1);
      if (happy || Math.sin(time * 5) > 0) {
        rect(c, "#ff8ab0", px + 28, y + 2, 2, 2);
        rect(c, "#ffd23f", px + 30, y + 0, 1, 1);
      }
      return true;
    }
    case "rattleby": {
      rect(c, "#8a5a2b", px + 26, y + 0, 2, 31);
      rect(c, "#e3262f", px + 28, y + 1 + wig(0, 1), 4, 8);
      rect(c, "#a8b0c8", px + 9, y + 12, 14, 12);
      rect(c, "#d8e0f0", px + 10, y + 13, 12, 3);
      rect(c, "#a8b0c8", px + 10, y + 24, 4, 7);
      rect(c, "#a8b0c8", px + 18, y + 24, 4, 7);
      rect(c, "#a8b0c8", px + 5, y + 13, 4, 8);
      rect(c, "#a8b0c8", px + 23, y + 13, 3, 8);
      rect(c, "#c0c8d8", px + 10, y + 1, 12, 11);
      rect(c, "#3a3a4a", px + 11, y + 5, 10, 3);
      rect(c, happy ? "#ffd23f" : "#6ea0ff", px + 12, y + 6, 2, 1);
      rect(c, happy ? "#ffd23f" : "#6ea0ff", px + 18, y + 6, 2, 1);
      rect(c, "#2fbf71", px + 14, y - 3 + wig(1, 1), 4, 4);
      if (happy) smile(c, px + 13, y + 9, 6, "#3a3a4a");
      return true;
    }
    case "naphotep": {
      const wrap = "#e8dcc0";
      rect(c, "#d8b850", px + 6, y + 28, 20, 3);
      rect(c, wrap, px + 10, y + 2, 12, 10);
      rect(c, wrap, px + 8, y + 12, 16, 14);
      rect(c, wrap, px + 10, y + 26, 4, 3);
      rect(c, wrap, px + 18, y + 26, 4, 3);
      for (let i = 0; i < 6; i++) rect(c, "#b8a888", px + 8 + (i % 2) * 3, y + 4 + i * 4, 13, 1);
      rect(c, wrap, px + 3, y + 14, 6, 3);
      rect(c, wrap, px + 23, y + 14, 6, 3);
      rect(c, "#b8a888", px + 3 + wig(0, 1), y + 17, 3, 3);
      if (happy) {
        eye(c, px + 11, y + 5, time, 4);
        eye(c, px + 17, y + 5, time, 4);
        smile(c, px + 13, y + 10, 6);
      } else {
        sleepy(c, px + 11, y + 5);
        rect(c, "#f2f4ff", px + 17, y + 5, 4, 4);
        rect(c, "#1a1030", px + 18, y + 7, 2, 2);
        const z = Math.floor(time * 2) % 3;
        for (let i = 0; i <= z; i++) {
          const zx = px + 25 + i * 3;
          const zy = y + 2 - i * 3;
          rect(c, "#6ea0ff", zx, zy, 3, 1);
          rect(c, "#6ea0ff", zx + 1, zy + 1, 1, 1);
          rect(c, "#6ea0ff", zx, zy + 2, 3, 1);
        }
      }
      return true;
    }
    case "gigglewhisp": {
      const wob = Math.sin(time * 3) * 2;
      c.fillStyle = "#f8f8ff";
      c.beginPath();
      c.arc(px + 16, y + 13, 12, Math.PI, 0);
      c.lineTo(px + 28, y + 27);
      for (let i = 0; i < 4; i++) c.lineTo(px + 25 - i * 6, y + 27 + ((i % 2) ? 3 : 0) + wob * (i % 2 ? 1 : -1) * 0.5);
      c.lineTo(px + 4, y + 27);
      c.fill();
      rect(c, "#b05cff", px + 9, y - 1, 14, 3);
      rect(c, "#ffd23f", px + 10, y - 4, 2, 3);
      rect(c, "#ffd23f", px + 15, y - 5, 2, 4);
      rect(c, "#ffd23f", px + 20, y - 4, 2, 3);
      eye(c, px + 9, y + 10, time, 4);
      eye(c, px + 18, y + 10, time, 4);
      blush(c, px + 7, y + 16);
      blush(c, px + 22, y + 16);
      if (happy || Math.sin(time * 6) > 0) {
        rect(c, "#1a1030", px + 13, y + 17, 6, 3);
        rect(c, "#ff6fb5", px + 14, y + 19, 4, 1);
      } else smile(c, px + 13, y + 17, 6);
      return true;
    }
  }
  return false;
}

/** The quest's helper on an F tile (the Lost Library's owl is drawn in render.ts). */
export function drawHelper(c: Ctx, theme: string, px: number, py: number, time: number) {
  const blink = Math.sin(time * 1.3) > 0.95;
  if (theme === "sea") {
    // Dot the whale shark peeking out of the water, smiling
    rect(c, "#1a6aa8", px, py, 16, 16);
    rect(c, "#3a8fcf", px + 2 + Math.round(Math.sin(time * 2) * 2), py + 2, 4, 1);
    rect(c, "#1f5fbf", px, py + 10, 16, 6);
    oval(c, "#2a4a8a", px + 8, py + 9, 8, 6);
    for (const [dx, dy] of [[3, 6], [7, 4], [11, 6], [5, 9], [12, 9], [9, 7]]) rect(c, "#f2f4ff", px + dx, py + dy, 1, 1);
    rect(c, "#9ad0ff", px + 2, py + 11, 12, 1);
    rect(c, blink ? "#2a4a8a" : "#f2f4ff", px + 3, py + 7, 2, 2);
    rect(c, blink ? "#2a4a8a" : "#f2f4ff", px + 11, py + 7, 2, 2);
    rect(c, "#1a1030", px + 4, py + 8, 1, 1);
    rect(c, "#1a1030", px + 12, py + 8, 1, 1);
    rect(c, "#c8d8ff", px + 5, py + 12, 6, 1);
    rect(c, "#3a7fdf", px + 1 + Math.round(Math.sin(time * 3)), py + 14, 3, 1);
  } else if (theme === "clock") {
    // Tinpenny, the castle's tin caretaker
    rect(c, "#5a5a78", px + 7, py, 2, 3);
    rect(c, "#e3262f", px + 6, py, 4, 2);
    rect(c, "#a8b0c8", px + 3, py + 3, 10, 7);
    rect(c, blink ? "#a8b0c8" : "#6ea0ff", px + 5, py + 5, 2, 2);
    rect(c, blink ? "#a8b0c8" : "#6ea0ff", px + 9, py + 5, 2, 2);
    rect(c, "#3a3a4a", px + 6, py + 8, 4, 1);
    rect(c, "#8a8aa8", px + 4, py + 10, 8, 5);
    rect(c, "#ffd23f", px + 7, py + 11, 2, 2);
    rect(c, "#8a8aa8", px + 2, py + 11, 2, 3);
    rect(c, "#8a8aa8", px + 12, py + 11, 2, 3);
  } else if (theme === "volcano") {
    // Dr. Basalta, the rock-badger astronomer
    rect(c, "#3a3a4a", px + 3, py + 2, 10, 8);
    rect(c, "#f2f4ff", px + 7, py + 2, 2, 8);
    rect(c, "#f2f4ff", px + 3, py + 6, 2, 2);
    rect(c, "#f2f4ff", px + 11, py + 6, 2, 2);
    rect(c, blink ? "#3a3a4a" : "#1a1030", px + 5, py + 5, 1, 1);
    rect(c, blink ? "#3a3a4a" : "#1a1030", px + 10, py + 5, 1, 1);
    rect(c, "#1a1030", px + 7, py + 8, 2, 1);
    rect(c, "#f2f4ff", px + 3, py + 10, 10, 6);
    rect(c, "#2456e8", px + 7, py + 10, 2, 6);
    rect(c, "#ffd23f", px + 10, py + 12, 1, 1);
  } else if (theme === "museum") {
    // Curator Mopsy, the museum mouse (bow tie, big ears)
    disc(c, "#a8a0b8", px + 3, py + 4, 3);
    disc(c, "#a8a0b8", px + 13, py + 4, 3);
    disc(c, "#ffb0c8", px + 3, py + 4, 1.5);
    disc(c, "#ffb0c8", px + 13, py + 4, 1.5);
    oval(c, "#c8c0d8", px + 8, py + 7, 5, 4);
    rect(c, blink ? "#c8c0d8" : "#1a1030", px + 5, py + 6, 2, 2);
    rect(c, blink ? "#c8c0d8" : "#1a1030", px + 9, py + 6, 2, 2);
    rect(c, "#ff6fb5", px + 7, py + 9, 2, 1);
    rect(c, "#2fbf71", px + 3, py + 11, 10, 5);
    rect(c, "#e3262f", px + 5, py + 11, 2, 2);
    rect(c, "#e3262f", px + 9, py + 11, 2, 2);
    rect(c, "#ffd23f", px + 7, py + 11, 2, 2);
  }
}

/** A pest (or harmless critter) on its tile. `px, py` is the tile's top-left. */
export function drawPest(c: Ctx, kind: string, px: number, py: number, time: number, id: number): boolean {
  const wob = Math.sin(time * 8 + id);
  switch (kind) {
    case "crab":
      rect(c, "#ff6a3d", px + 3, py + 8, 10, 5);
      rect(c, "#ff6a3d", px + 1, py + 6 + Math.round(wob), 3, 3);
      rect(c, "#ff6a3d", px + 12, py + 6 - Math.round(wob), 3, 3);
      for (let i = 0; i < 3; i++) {
        rect(c, "#c84a1a", px + 3 + i * 2, py + 13, 1, 2);
        rect(c, "#c84a1a", px + 10 + i * 2 - 2, py + 13, 1, 2);
      }
      rect(c, "#f2f4ff", px + 5, py + 6, 2, 2);
      rect(c, "#f2f4ff", px + 9, py + 6, 2, 2);
      rect(c, "#1a1030", px + 6, py + 7, 1, 1);
      rect(c, "#1a1030", px + 10, py + 7, 1, 1);
      return true;
    case "jelly": {
      const b = Math.round(wob * 1.5);
      c.fillStyle = "rgba(255, 140, 210, 0.9)";
      c.beginPath();
      c.arc(px + 8, py + 7 + b, 6, Math.PI, 0);
      c.fill();
      rect(c, "rgba(255, 140, 210, 0.9)", px + 2, py + 7 + b, 12, 2);
      for (let i = 0; i < 4; i++) rect(c, "#ff8ad8", px + 3 + i * 3, py + 9 + b, 1, 4 + ((i + Math.floor(time * 6)) % 2));
      rect(c, "#1a1030", px + 5, py + 5 + b, 2, 2);
      rect(c, "#1a1030", px + 9, py + 5 + b, 2, 2);
      rect(c, "#ffffff", px + 4, py + 3 + b, 2, 1);
      return true;
    }
    case "mouse":
      oval(c, "#a8a8c0", px + 8, py + 10, 6, 4);
      disc(c, "#a8a8c0", px + 12, py + 7, 2);
      rect(c, "#1a1030", px + 13, py + 9, 1, 1);
      rect(c, "#ff8ab0", px + 14, py + 10, 1, 1);
      rect(c, "#ffd23f", px + 5, py + 4, 1, 3);
      rect(c, "#ffd23f", px + 3 + (wob > 0 ? 1 : 0), py + 3, 4 - (wob > 0 ? 2 : 0), 1);
      rect(c, "#5a5a78", px + 1, py + 11, 2, 1);
      return true;
    case "soldier":
      rect(c, "#1a1030", px + 5, py + 0, 6, 5);
      rect(c, "#f2c29b", px + 5, py + 5, 6, 3);
      rect(c, "#1a1030", px + 6, py + 6, 1, 1);
      rect(c, "#1a1030", px + 9, py + 6, 1, 1);
      rect(c, "#e3262f", px + 4, py + 8, 8, 5);
      rect(c, "#ffd23f", px + 7, py + 9, 2, 3);
      rect(c, "#2456e8", px + 5, py + 13, 2, 3 - (wob > 0 ? 1 : 0));
      rect(c, "#2456e8", px + 9, py + 13, 2, 2 + (wob > 0 ? 1 : 0));
      rect(c, "#c0c8d8", px + 12, py + 4, 1, 9);
      return true;
    case "smoke":
      for (const [dx, dy, r] of [[6, 10, 4], [10, 9, 4], [8, 6, 3]] as [number, number, number][]) disc(c, "rgba(180, 180, 196, 0.85)", px + dx, py + dy + wob * 0.5, r);
      rect(c, "#3a3a4a", px + 6, py + 8, 1, 1);
      rect(c, "#3a3a4a", px + 10, py + 8, 1, 1);
      return true;
    case "ember": {
      const f = Math.round(wob);
      c.fillStyle = "#ff5a1f";
      c.beginPath();
      c.moveTo(px + 8, py + 1 + f);
      c.lineTo(px + 13, py + 10);
      c.lineTo(px + 8, py + 14);
      c.lineTo(px + 3, py + 10);
      c.fill();
      disc(c, "#ffd23f", px + 8, py + 10, 3);
      rect(c, "#1a1030", px + 6, py + 9, 1, 2);
      rect(c, "#1a1030", px + 9, py + 9, 1, 2);
      return true;
    }
    case "wisp": {
      const b = Math.round(wob * 1.5);
      c.fillStyle = "rgba(230, 255, 245, 0.9)";
      c.beginPath();
      c.arc(px + 8, py + 7 + b, 5, Math.PI, 0);
      c.lineTo(px + 13, py + 13 + b);
      c.lineTo(px + 10, py + 11 + b);
      c.lineTo(px + 8, py + 14 + b);
      c.lineTo(px + 6, py + 11 + b);
      c.lineTo(px + 3, py + 13 + b);
      c.fill();
      rect(c, "#1a1030", px + 6, py + 6 + b, 1, 2);
      rect(c, "#1a1030", px + 9, py + 6 + b, 1, 2);
      rect(c, "#ff8ab0", px + 7, py + 9 + b, 2, 1);
      return true;
    }
  }
  return false;
}

/** The "poof" when a pest is tidied, by theme: bubbles, springs, sparks, giggles, or the library's stars. */
export function drawPoof(c: Ctx, theme: string, cx: number, cy: number, t: number) {
  const r = 2 + t * 22;
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const x = cx + Math.cos(a) * r;
    const y = cy + Math.sin(a) * r;
    if (theme === "sea") {
      c.strokeStyle = "#bfe8ff";
      c.lineWidth = 1;
      c.beginPath();
      c.arc(x, y - t * 10, 1.5 + (i % 3), 0, Math.PI * 2);
      c.stroke();
    } else if (theme === "clock") {
      c.strokeStyle = i % 2 ? "#c0c8d8" : "#ffd23f";
      c.lineWidth = 1;
      c.beginPath();
      for (let k = 0; k < 4; k++) c.lineTo(x - 2 + (k % 2) * 4, y - 3 + k * 2);
      c.stroke();
    } else if (theme === "volcano") {
      rect(c, i % 2 ? "#ffd23f" : "#ff5a1f", x - 1, y - 1, 2, 2);
    } else if (theme === "museum") {
      rect(c, i % 2 ? "#ff8ad8" : "#8affc1", x - 1, y - 1, 3, 3);
    } else rect(c, i % 2 ? "#ffd23f" : "#f2f4ff", x - 1, y - 1, 3, 3);
  }
}

/** A pushable crate in the quest's style. */
export function drawCrate(c: Ctx, theme: string, px: number, py: number) {
  if (theme === "sea") {
    rect(c, "#1a2a3a", px + 1, py + 1, 14, 14);
    rect(c, "#7a6a4a", px + 2, py + 2, 12, 12);
    rect(c, "#5a4a2a", px + 2, py + 6, 12, 1);
    rect(c, "#5a4a2a", px + 2, py + 10, 12, 1);
    for (const [dx, dy] of [[3, 3], [11, 4], [5, 11], [12, 12]]) rect(c, "#d8d0c0", px + dx, py + dy, 2, 2);
    rect(c, "#2fbf71", px + 8, py + 2, 1, 4);
  } else if (theme === "clock") {
    rect(c, "#2a2a3a", px + 1, py + 1, 14, 14);
    rect(c, "#b8862a", px + 2, py + 2, 12, 12);
    disc(c, "#8a5a1a", px + 8, py + 8, 5);
    disc(c, "#ffd23f", px + 8, py + 8, 3);
    disc(c, "#8a5a1a", px + 8, py + 8, 1);
    for (const [dx, dy] of [[3, 3], [12, 3], [3, 12], [12, 12]]) rect(c, "#5a3a10", px + dx, py + dy, 1, 1);
  } else if (theme === "volcano") {
    rect(c, "#1a1018", px + 1, py + 1, 14, 14);
    rect(c, "#4a3a3a", px + 2, py + 2, 12, 12);
    rect(c, "#5a4a4a", px + 3, py + 3, 5, 4);
    rect(c, "#3a2a2a", px + 9, py + 9, 4, 3);
    rect(c, "#ff8a3d", px + 7, py + 8, 1, 3);
  } else if (theme === "museum") {
    rect(c, "#3a2a10", px + 1, py + 1, 14, 14);
    rect(c, "#d8b878", px + 2, py + 2, 12, 12);
    rect(c, "#b8985a", px + 2, py + 2, 12, 1);
    rect(c, "#e3262f", px + 3, py + 7, 10, 2);
    rect(c, "#b8985a", px + 2, py + 13, 12, 1);
  } else {
    rect(c, "#2a1608", px + 1, py + 1, 14, 14);
    rect(c, "#a86a2a", px + 2, py + 2, 12, 12);
    rect(c, "#8a5a2b", px + 2, py + 7, 12, 2);
    rect(c, "#8a5a2b", px + 7, py + 2, 2, 12);
    rect(c, "#e3262f", px + 3, py + 3, 3, 3);
    rect(c, "#2456e8", px + 10, py + 10, 3, 3);
  }
}
