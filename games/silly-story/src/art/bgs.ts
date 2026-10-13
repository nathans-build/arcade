/* Scene backgrounds, drawn in code at 320×200 (original art). Each has a floor line for the cast. */
import { pixelText } from "./font";

export const W = 320;
export const H = 200;

export interface Bg {
  id: string;
  name: string;
  /** y of the floor the cast stands on. */
  ground: number;
  /** Characters swim here instead of standing. */
  water?: boolean;
  draw: (c: CanvasRenderingContext2D, t: number) => void;
}

const r = (c: CanvasRenderingContext2D, col: string, x: number, y: number, w: number, h: number) => {
  c.fillStyle = col;
  c.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
};

function bands(c: CanvasRenderingContext2D, cols: string[], y0: number, y1: number) {
  const h = (y1 - y0) / cols.length;
  cols.forEach((col, i) => {
    r(c, col, 0, y0 + i * h, W, h + 1);
    // Dithered seam.
    if (i > 0) {
      c.fillStyle = cols[i - 1];
      for (let x = 0; x < W; x += 2) c.fillRect(x + ((i % 2) ? 1 : 0), Math.round(y0 + i * h), 1, 1);
    }
  });
}

function disc(c: CanvasRenderingContext2D, col: string, cx: number, cy: number, rad: number) {
  c.fillStyle = col;
  for (let y = -rad; y <= rad; y++) {
    const w = Math.round(Math.sqrt(rad * rad - y * y));
    c.fillRect(Math.round(cx - w), Math.round(cy + y), w * 2, 1);
  }
}

function stars(c: CanvasRenderingContext2D, t: number, n: number, maxY: number, seed = 1) {
  for (let i = 0; i < n; i++) {
    const x = (i * 97 + seed * 31) % W;
    const y = (i * 53 + seed * 17) % maxY;
    const tw = Math.sin(t * 2 + i) > 0.6;
    r(c, tw ? "#ffffff" : "#8a8ad0", x, y, 1, 1);
    if (tw && i % 5 === 0) {
      r(c, "#ffffff", x - 1, y, 3, 1);
      r(c, "#ffffff", x, y - 1, 1, 3);
    }
  }
}

function cloud(c: CanvasRenderingContext2D, x: number, y: number, s = 1, col = "#f4f4ff") {
  disc(c, col, x, y, 6 * s);
  disc(c, col, x + 8 * s, y - 3 * s, 8 * s);
  disc(c, col, x + 17 * s, y, 6 * s);
  r(c, col, x, y, 17 * s, 6 * s);
}

function tree(c: CanvasRenderingContext2D, x: number, y: number, s = 1, leaf = "#2f9f3f") {
  r(c, "#6a4020", x - 3 * s, y - 18 * s, 6 * s, 18 * s);
  disc(c, leaf, x, y - 26 * s, 13 * s);
  disc(c, "#3fbf4f", x - 4 * s, y - 30 * s, 6 * s);
}

function pine(c: CanvasRenderingContext2D, x: number, y: number, s = 1, snow = false) {
  r(c, "#5a3a1a", x - 2 * s, y - 6 * s, 4 * s, 6 * s);
  for (let i = 0; i < 3; i++) {
    const w = (14 - i * 3) * s;
    const yy = y - 6 * s - i * 9 * s;
    for (let k = 0; k < 10 * s; k++) {
      const ww = (w * (10 * s - k)) / (10 * s);
      r(c, "#1f6f3f", x - ww, yy - k, ww * 2, 1);
      if (snow && k > 6 * s) r(c, "#f4f4ff", x - ww, yy - k, ww * 2, 1);
    }
  }
}

function floorTiles(c: CanvasRenderingContext2D, y: number, a: string, b: string, size = 16) {
  for (let yy = y; yy < H; yy += size / 2)
    for (let x = 0; x < W; x += size) r(c, ((x / size + (yy - y) / (size / 2)) % 2) < 1 ? a : b, x, yy, size, size / 2);
}

function sun(c: CanvasRenderingContext2D, x: number, y: number, t: number) {
  disc(c, "#ffe27a", x, y, 14);
  disc(c, "#ffd23f", x, y, 11);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + t * 0.3;
    r(c, "#ffd23f", x + Math.cos(a) * 18 - 1, y + Math.sin(a) * 18 - 1, 3, 3);
  }
}

export const BGS: Bg[] = [
  {
    id: "park", name: "Sunny park", ground: 168,
    draw(c, t) {
      bands(c, ["#5fb8ff", "#7cc8ff", "#9ad8ff", "#b8e8ff"], 0, 130);
      sun(c, 270, 30, t);
      cloud(c, 40 + ((t * 6) % 360) - 40, 30);
      cloud(c, 170 + ((t * 4) % 360) - 40, 50, 0.8);
      r(c, "#4fbf4f", 0, 120, W, 80);
      disc(c, "#3faf3f", 60, 140, 60);
      disc(c, "#3faf3f", 260, 150, 70);
      r(c, "#5fcf4f", 0, 150, W, 50);
      tree(c, 30, 160, 1.2);
      tree(c, 295, 158, 1);
      r(c, "#8a5a2b", 240, 150, 36, 4);
      r(c, "#6a4020", 244, 154, 3, 10);
      r(c, "#6a4020", 270, 154, 3, 10);
    },
  },
  {
    id: "zoo", name: "The zoo", ground: 170,
    draw(c, t) {
      bands(c, ["#5fb8ff", "#80ccff", "#a8e0ff"], 0, 120);
      sun(c, 40, 30, t);
      cloud(c, 200 + Math.sin(t * 0.2) * 20, 25);
      tree(c, 300, 130, 1.4);
      tree(c, 20, 128, 1.1);
      r(c, "#6fcf5f", 0, 118, W, 82);
      // Cage bars and a rail.
      for (let x = 60; x < 260; x += 10) r(c, "#5a5a6e", x, 70, 3, 60);
      r(c, "#3a3a4e", 56, 66, 208, 5);
      r(c, "#3a3a4e", 56, 128, 208, 4);
      r(c, "#c08040", 135, 40, 50, 20);
      pixelText(c, "ZOO", 149, 46, "#fff4d8", 2);
      r(c, "#d8b070", 0, 160, W, 40);
      for (let x = 0; x < W; x += 14) r(c, "#c09858", x + ((x / 14) % 2) * 6, 172, 6, 2);
    },
  },
  {
    id: "bedroom", name: "A bedroom", ground: 172,
    draw(c, t) {
      r(c, "#6a4fb8", 0, 0, W, 150);
      for (let x = 0; x < W; x += 24) r(c, "#7a5fc8", x, 0, 10, 150);
      // Window with the night sky.
      r(c, "#f4f4ff", 200, 25, 80, 60);
      r(c, "#101848", 204, 29, 72, 52);
      stars(c, t, 12, 50, 3);
      disc(c, "#fff0a0", 255, 45, 8);
      disc(c, "#101848", 259, 42, 7);
      r(c, "#f4f4ff", 238, 29, 4, 52);
      // Bed and shelf.
      r(c, "#8a5a2b", 10, 120, 6, 50);
      r(c, "#3f9fff", 16, 135, 80, 18);
      r(c, "#f4f4ff", 20, 128, 22, 9);
      r(c, "#8a5a2b", 90, 140, 6, 30);
      r(c, "#8a5a2b", 110, 60, 60, 4);
      r(c, "#e3262f", 114, 48, 6, 12); r(c, "#ffd23f", 121, 50, 5, 10); r(c, "#3fbf4f", 127, 46, 7, 14);
      r(c, "#a0703a", 0, 150, W, 50);
      for (let y = 154; y < H; y += 8) r(c, "#8a5a2b", 0, y, W, 1);
    },
  },
  {
    id: "castle", name: "A castle hall", ground: 172,
    draw(c, t) {
      bands(c, ["#ff9fb8", "#ffb8a0", "#ffd0a0"], 0, 110);
      cloud(c, 30, 30, 0.9, "#fff0f4");
      for (const x of [20, 250]) {
        r(c, "#9aa0b8", x, 30, 50, 120);
        for (let k = 0; k < 5; k++) r(c, "#9aa0b8", x + k * 11, 22, 7, 8);
        r(c, "#1b1230", x + 20, 60, 10, 18);
        r(c, "#5a3a1a", x + 24, 6, 2, 18);
        r(c, Math.sin(t * 4) > 0 ? "#e3262f" : "#ff4f5f", x + 26, 6, 12, 7);
      }
      r(c, "#b0b6cc", 70, 60, 180, 90);
      for (let x = 70; x < 250; x += 20) for (let y = 60; y < 150; y += 10) r(c, "#9aa0b8", x + ((y / 10) % 2) * 10, y, 1, 10);
      r(c, "#5a3a1a", 140, 90, 40, 60);
      r(c, "#ffd23f", 152, 70, 16, 12);
      r(c, "#c02040", 0, 150, W, 50);
      r(c, "#ffd23f", 0, 150, W, 2);
      for (let x = 0; x < W; x += 20) r(c, "#a01830", x, 160, 10, 40);
    },
  },
  {
    id: "farm", name: "A farm", ground: 172,
    draw(c, t) {
      bands(c, ["#5fb8ff", "#8fd0ff", "#c0eaff"], 0, 120);
      sun(c, 280, 30, t);
      cloud(c, 60 + Math.sin(t * 0.3) * 15, 35);
      disc(c, "#5faf3f", 80, 150, 90);
      disc(c, "#4f9f3f", 260, 160, 100);
      // Barn.
      r(c, "#c0302a", 190, 70, 90, 70);
      for (let k = 0; k < 24; k++) r(c, "#a02020", 190 + k * 2, 70 - k, 90 - k * 4, 1);
      r(c, "#f4f4ff", 220, 100, 30, 40);
      r(c, "#c0302a", 223, 103, 24, 34);
      r(c, "#f4f4ff", 223, 119, 24, 2);
      r(c, "#6fbf4f", 0, 140, W, 60);
      for (let x = 0; x < W; x += 16) r(c, "#f4f4ff", x, 128, 3, 22);
      r(c, "#f4f4ff", 0, 133, W, 2);
      r(c, "#f4f4ff", 0, 142, W, 2);
      r(c, "#8a5a2b", 20, 165, 130, 35);
      disc(c, "#7a4a20", 85, 178, 14);
    },
  },
  {
    id: "space", name: "A space station", ground: 172,
    draw(c, t) {
      r(c, "#060818", 0, 0, W, H);
      stars(c, t, 60, 150, 1);
      disc(c, "#ff9f5f", 250, 55, 26);
      disc(c, "#ffbf7f", 244, 49, 12);
      c.fillStyle = "#f4d0a0";
      for (let x = -42; x <= 42; x++) c.fillRect(250 + x, Math.round(55 + x * 0.18 + Math.sqrt(Math.max(0, 42 * 42 - x * x)) * 0.12), 1, 2);
      disc(c, "#3f8fff", 60, 40, 8);
      // Window frame.
      r(c, "#3a4060", 0, 0, W, 8);
      r(c, "#3a4060", 0, 0, 8, 160);
      r(c, "#3a4060", 312, 0, 8, 160);
      r(c, "#3a4060", 152, 0, 16, 150);
      r(c, "#5a6080", 0, 150, W, 50);
      for (let x = 0; x < W; x += 32) r(c, "#4a5070", x, 150, 2, 50);
      r(c, Math.sin(t * 3) > 0 ? "#5fff8a" : "#2a8a4a", 20, 160, 6, 3);
      r(c, Math.sin(t * 2) > 0 ? "#ff5f5f" : "#8a2a2a", 30, 160, 6, 3);
    },
  },
  {
    id: "volcano", name: "Mount Grumblebelly", ground: 172,
    draw(c, t) {
      bands(c, ["#ff7f4f", "#ff9f5f", "#ffbf7f", "#ffd8a0"], 0, 130);
      for (let k = 0; k < 4; k++) {
        const y = 20 - ((t * 10 + k * 15) % 60);
        disc(c, "#8a8090", 160 + Math.sin(t + k) * 8, 40 + y, 8 + k * 2);
      }
      for (let y = 40; y < 150; y++) {
        const w = 18 + (y - 40) * 1.3;
        r(c, "#6a3a2a", 160 - w, y, w * 2, 1);
      }
      for (let y = 40; y < 90; y += 2) r(c, Math.sin(t * 5 + y) > 0 ? "#ff5f1f" : "#ffbf2f", 160 - 4 + Math.sin(y + t * 3) * 3, y, 6, 2);
      disc(c, "#ff8f1f", 160, 40, 16);
      r(c, "#ff8f1f", 140, 40, 40, 4);
      r(c, "#5a3a2a", 0, 150, W, 50);
      for (let x = 0; x < W; x += 22) disc(c, "#4a2a1a", x + 6, 168 + (x % 3) * 6, 5);
      r(c, "#c0a070", 0, 165, W, 4);
    },
  },
  {
    id: "bakery", name: "The bakery", ground: 172,
    draw(c, t) {
      r(c, "#ffd8b0", 0, 0, W, 150);
      for (let x = 0; x < W; x += 20) r(c, "#ffc8a0", x, 0, 10, 150);
      r(c, "#c08040", 10, 40, 120, 6);
      r(c, "#c08040", 10, 80, 120, 6);
      for (let k = 0; k < 6; k++) disc(c, k % 2 ? "#e8b060" : "#c08040", 25 + k * 19, 34, 7);
      for (let k = 0; k < 6; k++) disc(c, k % 2 ? "#ff8fc8" : "#ffd23f", 25 + k * 19, 74, 6);
      // Oven with a glow.
      r(c, "#5a5a6e", 220, 50, 80, 90);
      r(c, "#1b1230", 230, 70, 60, 40);
      r(c, Math.sin(t * 3) > 0 ? "#ff8f1f" : "#ff5f1f", 234, 96, 52, 10);
      r(c, "#c8c8d8", 230, 60, 60, 4);
      pixelText(c, "BAKERY", 130, 12, "#8a3f2a", 2);
      r(c, "#8a5a2b", 0, 140, W, 12);
      floorTiles(c, 152, "#f4f4ff", "#e3262f");
    },
  },
  {
    id: "lab", name: "The science fair", ground: 172,
    draw(c, t) {
      r(c, "#3a6fc8", 0, 0, W, 150);
      r(c, "#2f5fb0", 0, 100, W, 50);
      for (const x of [20, 120, 230]) {
        r(c, "#f4f4ff", x, 20, 60, 40);
        r(c, "#ffd23f", x + 4, 24, 52, 6);
        r(c, "#e3262f", x + 6, 36, 20, 18);
        r(c, "#3fbf4f", x + 32, 40, 20, 14);
      }
      r(c, "#8a8aa0", 10, 110, 300, 6);
      for (const [x, col] of [[40, "#5fff8a"], [80, "#ff5fd2"], [250, "#5fe0ff"]] as [number, string][]) {
        r(c, "#c8c8d8", x, 90, 10, 20);
        r(c, col, x + 1, 96, 8, 14);
        const b = (t * 20 + x) % 20;
        r(c, col, x + 3, 88 - b, 3, 3);
      }
      r(c, "#c8a070", 0, 150, W, 50);
      for (let x = 0; x < W; x += 24) r(c, "#b08a5a", x, 150, 1, 50);
      r(c, "#e3262f", 0, 168, W, 2);
    },
  },
  {
    id: "stage", name: "The cafeteria stage", ground: 172,
    draw(c, t) {
      r(c, "#1a0b2e", 0, 0, W, H);
      for (let x = 0; x < 50; x += 6) r(c, x % 12 ? "#a01830" : "#c02040", x, 0, 6, 160);
      for (let x = 270; x < W; x += 6) r(c, x % 12 ? "#a01830" : "#c02040", x, 0, 6, 160);
      r(c, "#c02040", 0, 0, W, 16);
      for (let x = 0; x < W; x += 16) disc(c, "#a01830", x + 8, 16, 8);
      // Spotlights sweep.
      c.globalAlpha = 0.18;
      for (const [x0, sp] of [[80, 1], [240, -1]] as [number, number][]) {
        const sx = x0 + Math.sin(t * sp) * 40;
        c.fillStyle = "#fff27a";
        c.beginPath();
        c.moveTo(x0, 0);
        c.lineTo(sx - 40, 172);
        c.lineTo(sx + 40, 172);
        c.fill();
      }
      c.globalAlpha = 1;
      r(c, "#8a5a2b", 0, 160, W, 40);
      for (let x = 0; x < W; x += 20) r(c, "#6a4020", x, 160, 1, 40);
      r(c, "#ffd23f", 0, 160, W, 2);
    },
  },
  {
    id: "ocean", name: "Under the sea", ground: 174, water: true,
    draw(c, t) {
      bands(c, ["#1f8fd8", "#1a7ac8", "#1566b0", "#105298", "#0c4080"], 0, 160);
      c.globalAlpha = 0.12;
      for (let k = 0; k < 4; k++) {
        c.fillStyle = "#c0f0ff";
        c.beginPath();
        const x = 40 + k * 80 + Math.sin(t * 0.5 + k) * 10;
        c.moveTo(x, 0);
        c.lineTo(x + 20, 0);
        c.lineTo(x + 60, 160);
        c.lineTo(x + 30, 160);
        c.fill();
      }
      c.globalAlpha = 1;
      r(c, "#e8d08a", 0, 160, W, 40);
      for (let x = 0; x < W; x += 12) r(c, "#d0b870", x, 166 + (x % 5), 4, 1);
      for (const x of [16, 60, 270, 300]) for (let y = 160; y > 110; y -= 4) r(c, "#2faf5f", x + Math.sin(t * 2 + y * 0.2) * 3, y, 4, 4);
      disc(c, "#ff7f8f", 230, 162, 9);
      disc(c, "#ff9f6f", 248, 164, 6);
      for (let k = 0; k < 8; k++) {
        const y = 160 - ((t * 25 + k * 23) % 160);
        r(c, "#c0f0ff", (k * 41) % W + Math.sin(t + k) * 3, y, 2, 2);
      }
    },
  },
  {
    id: "school", name: "The school hallway", ground: 172,
    draw(c) {
      r(c, "#f0d49a", 0, 0, W, 150);
      for (let x = 10; x < W; x += 26) {
        r(c, "#2f5fd8", x, 50, 24, 100);
        r(c, "#1f4fb8", x, 50, 24, 3);
        r(c, "#1b1230", x + 18, 95, 3, 8);
        for (let y = 56; y < 70; y += 3) r(c, "#1f4fb8", x + 4, y, 14, 1);
      }
      r(c, "#e3262f", 60, 12, 200, 26);
      pixelText(c, "GO TEAM!", 100, 18, "#ffd23f", 3);
      r(c, "#c8c8d8", 0, 150, W, 50);
      floorTiles(c, 150, "#d8d8e8", "#b8b8c8", 20);
    },
  },
  {
    id: "snow", name: "Snowy hill", ground: 172,
    draw(c, t) {
      bands(c, ["#a8c8f0", "#c0d8f8", "#d8e8ff"], 0, 120);
      for (let y = 60; y < 150; y++) r(c, "#f4f4ff", 0, y, 100 + (y - 60) * 3, 1);
      pine(c, 30, 70, 1, true);
      pine(c, 270, 130, 1.5, true);
      pine(c, 300, 140, 1.1, true);
      r(c, "#f4f4ff", 0, 145, W, 55);
      r(c, "#d8e8f8", 0, 170, W, 3);
      for (let k = 0; k < 40; k++) {
        const x = (k * 47 + Math.sin(t + k) * 8 + t * 5) % W;
        const y = (k * 29 + t * 18) % H;
        r(c, "#ffffff", x, y, 2, 2);
      }
    },
  },
  {
    id: "library", name: "The Royal Library", ground: 172,
    draw(c) {
      r(c, "#6a3a2a", 0, 0, W, 152);
      const cols = ["#e3262f", "#2456e8", "#3fbf4f", "#ffd23f", "#8b3fd9", "#ff8a1f", "#3fd0c8"];
      for (const sx of [0, 220]) {
        for (let y = 10; y < 140; y += 30) {
          r(c, "#4a2a1a", sx, y + 24, 100, 4);
          for (let x = sx + 4, i = 0; x < sx + 96; i++) {
            const w = 4 + ((i * 7 + y) % 4);
            r(c, cols[(i + y) % cols.length], x, y + 4 + ((i * 3) % 5), w, 20 - ((i * 3) % 5));
            x += w + 1;
          }
        }
      }
      r(c, "#c0e0ff", 130, 20, 60, 70);
      r(c, "#6a3a2a", 158, 20, 4, 70);
      r(c, "#6a3a2a", 130, 52, 60, 4);
      r(c, "#8a5a2b", 0, 152, W, 48);
      r(c, "#a02040", 60, 168, 200, 32);
      r(c, "#ffd23f", 64, 172, 192, 1);
    },
  },
  {
    id: "jungle", name: "The rainforest", ground: 172,
    draw(c, t) {
      bands(c, ["#2f7f4f", "#3f8f4f", "#4f9f5f"], 0, 150);
      for (let k = 0; k < 7; k++) disc(c, k % 2 ? "#1f6f3f" : "#2f8f3f", k * 55, 20, 34);
      for (const x of [40, 120, 210, 290]) {
        r(c, "#5a3a1a", x, 30, 10, 130);
        for (let y = 30; y < 140; y += 6) r(c, "#2faf3f", x + 12 + Math.sin(t + y * 0.1) * 2, y, 2, 4);
      }
      for (let k = 0; k < 5; k++) {
        const x = 20 + k * 70;
        for (let i = 0; i < 18; i++) r(c, "#4fcf4f", x + i, 130 - Math.abs(i - 9) * 0.8 - 6, 1, 12);
      }
      r(c, "#5a3a1a", 0, 155, W, 45);
      r(c, "#3f9f3f", 0, 152, W, 6);
      c.globalAlpha = 0.2;
      r(c, "#f4f4ff", 0, 120 + Math.sin(t * 0.5) * 4, W, 10);
      c.globalAlpha = 1;
    },
  },
  {
    id: "ballroom", name: "The robot prom", ground: 172,
    draw(c, t) {
      r(c, "#1a0b3e", 0, 0, W, H);
      stars(c, t, 20, 100, 5);
      // Disco ball and light dots.
      r(c, "#c8c8d8", 159, 0, 2, 20);
      disc(c, "#c8c8d8", 160, 30, 12);
      for (let k = 0; k < 6; k++) r(c, "#f4f4ff", 152 + ((k * 5 + Math.floor(t * 8)) % 16), 22 + k * 3, 2, 2);
      const dot = ["#ff5fd2", "#5fe0ff", "#ffd23f", "#5fff8a"];
      for (let k = 0; k < 18; k++) {
        const a = t * 0.8 + k;
        r(c, dot[k % 4], 160 + Math.cos(a) * (60 + (k % 5) * 25), 70 + Math.sin(a * 1.3) * 40, 3, 3);
      }
      for (let y = 150; y < H; y += 10)
        for (let x = 0; x < W; x += 20) {
          const on = (Math.floor(t * 3) + x / 20 + y / 10) % 4 === 0;
          r(c, on ? dot[(x / 20) % 4] : "#2a1b5e", x, y, 20, 10);
          r(c, "#1a0b3e", x, y, 20, 1);
        }
    },
  },
  {
    id: "mars", name: "Mars colony", ground: 172,
    draw(c, t) {
      bands(c, ["#d0603a", "#e07a4a", "#f09a6a"], 0, 130);
      disc(c, "#f4e0c0", 60, 30, 6);
      disc(c, "#d8c8a8", 280, 20, 4);
      // Domes.
      for (const [x, rad] of [[220, 40], [290, 26]] as [number, number][]) {
        for (let y = 0; y < rad; y++) {
          const w = Math.sqrt(rad * rad - y * y);
          r(c, "#a8e0ff", x - w, 140 - y, w * 2, 1);
        }
        r(c, "#f4f4ff", x - rad, 138, rad * 2, 3);
      }
      r(c, "#8a5aa0", 210, 112, 20, 26);
      r(c, Math.sin(t * 2) > 0 ? "#5fff8a" : "#2a8a4a", 214, 116, 4, 4);
      r(c, "#b0482a", 0, 140, W, 60);
      for (const [x, y, rr] of [[40, 165, 12], [130, 185, 8], [180, 160, 6]]) {
        disc(c, "#8a3a20", x, y, rr);
        disc(c, "#a0482a", x + 2, y + 2, rr - 3);
      }
      c.globalAlpha = 0.15;
      r(c, "#ffd0a0", 0, 120 + Math.sin(t) * 5, W, 18);
      c.globalAlpha = 1;
    },
  },
  {
    id: "beach", name: "The beach", ground: 174,
    draw(c, t) {
      bands(c, ["#4fb0ff", "#7cc8ff", "#a8e0ff"], 0, 110);
      sun(c, 50, 35, t);
      cloud(c, 200, 30);
      r(c, "#2f8fd8", 0, 110, W, 40);
      for (let x = 0; x < W; x += 16) r(c, "#c0f0ff", x + ((t * 10) % 16), 118 + ((x / 16) % 3) * 8, 8, 1);
      r(c, "#f0d890", 0, 150, W, 50);
      r(c, "#f4f4ff", 0, 148 + Math.sin(t * 2) * 2, W, 3);
      r(c, "#f4f4ff", 270, 110, 3, 60);
      for (let k = 0; k < 20; k++) r(c, k % 4 < 2 ? "#e3262f" : "#f4f4ff", 252 + k * 2, 110 - (10 - Math.abs(k - 10)) * 1.4, 2, 6);
    },
  },
  {
    id: "city", name: "The city at night", ground: 172,
    draw(c, t) {
      bands(c, ["#0a0f2e", "#1a1f4e", "#2a2f6e"], 0, 150);
      stars(c, t, 30, 60, 7);
      disc(c, "#fff0a0", 270, 30, 10);
      for (let i = 0, x = 0; x < W; i++) {
        const w = 26 + ((i * 13) % 20);
        const h = 50 + ((i * 37) % 70);
        r(c, "#1b1230", x, 150 - h, w, h);
        for (let y = 150 - h + 6; y < 145; y += 8)
          for (let wx = x + 4; wx < x + w - 4; wx += 7) r(c, (wx * 7 + y * 3 + Math.floor(t)) % 5 === 0 ? "#3a3a5e" : "#ffd23f", wx, y, 3, 4);
        x += w + 2;
      }
      r(c, "#3a3a4e", 0, 150, W, 50);
      for (let x = 0; x < W; x += 30) r(c, "#ffd23f", x + ((t * 20) % 30), 175, 14, 2);
    },
  },
  {
    id: "bathroom", name: "Bubble bath time", ground: 172,
    draw(c, t) {
      r(c, "#8fd8e8", 0, 0, W, 150);
      for (let y = 0; y < 150; y += 16) for (let x = 0; x < W; x += 16) {
          r(c, "#7fc8d8", x, y, 16, 1);
          r(c, "#7fc8d8", x, y, 1, 16);
        }
      // Mirror, towel rail and a little window.
      r(c, "#f4f4ff", 30, 24, 50, 40);
      r(c, "#c0eaff", 33, 27, 44, 34);
      r(c, "#f4f4ff", 40, 32, 10, 3);
      r(c, "#c8c8d8", 230, 40, 70, 3);
      r(c, "#ff8fc8", 240, 43, 24, 34);
      r(c, "#ffd23f", 268, 43, 22, 28);
      // The tub with bubbles.
      r(c, "#f4f4ff", 90, 110, 150, 46);
      r(c, "#c8c8d8", 90, 152, 150, 4);
      r(c, "#c8c8d8", 100, 156, 8, 10);
      r(c, "#c8c8d8", 222, 156, 8, 10);
      r(c, "#c8c8d8", 92, 86, 4, 24);
      r(c, "#c8c8d8", 92, 86, 14, 4);
      for (let k = 0; k < 14; k++) {
        const bx = 96 + ((k * 23) % 140);
        const by = 108 - ((k * 7) % 12) - Math.abs(Math.sin(t * 1.5 + k)) * 4;
        disc(c, "#ffffff", bx, by, 4 + (k % 3));
        r(c, "#c0f0ff", bx - 1, by - 2, 2, 2);
      }
      for (let k = 0; k < 6; k++) {
        const y = (150 - ((t * 20 + k * 30) % 150));
        disc(c, "#e8faff", 110 + k * 22 + Math.sin(t + k) * 6, y, 2);
      }
      floorTiles(c, 160, "#f4f4ff", "#c8e8f0", 16);
    },
  },
  {
    id: "campsite", name: "Campsite at night", ground: 172,
    draw(c, t) {
      bands(c, ["#0a1030", "#141c48", "#202a60"], 0, 140);
      stars(c, t, 40, 90, 11);
      disc(c, "#fff0a0", 60, 30, 10);
      disc(c, "#0a1030", 65, 27, 9);
      for (const [x, s] of [[20, 1.5], [70, 1.1], [255, 1.6], [300, 1.2]] as [number, number][]) pine(c, x, 150, s);
      r(c, "#1f4f2f", 0, 145, W, 55);
      r(c, "#2a5f3a", 0, 145, W, 3);
      // Tent.
      for (let k = 0; k < 40; k++) r(c, k < 20 ? "#ff8a1f" : "#d86a10", 190 + k, 150 - (20 - Math.abs(k - 20)) * 1.6, 1, (20 - Math.abs(k - 20)) * 1.6);
      r(c, "#1b1230", 208, 138, 4, 12);
      // Campfire.
      for (const [x, y] of [[148, 166], [160, 168], [172, 166]]) r(c, "#6a4020", x - 6, y, 14, 4);
      const f = Math.sin(t * 9) * 2;
      for (let k = 0; k < 10; k++) r(c, k < 4 ? "#ffd23f" : "#ff6a1f", 152 + k * 1.6, 164 - (5 - Math.abs(k - 5)) * 3 - f, 2, (5 - Math.abs(k - 5)) * 3 + f);
      c.globalAlpha = 0.12;
      disc(c, "#ffb040", 162, 160, 34 + f);
      c.globalAlpha = 1;
    },
  },
  {
    id: "island", name: "Treasure island", ground: 174,
    draw(c, t) {
      bands(c, ["#4fb0ff", "#7cc8ff", "#b0e4ff"], 0, 112);
      sun(c, 280, 30, t);
      cloud(c, 40 + Math.sin(t * 0.2) * 10, 30);
      r(c, "#1f7fd0", 0, 110, W, 40);
      for (let x = 0; x < W; x += 18) r(c, "#c0f0ff", (x + t * 12) % W, 116 + ((x / 18) % 3) * 9, 8, 1);
      // A pirate ship on the horizon.
      const sx = 40 + Math.sin(t * 0.4) * 6;
      r(c, "#6a4020", sx, 100, 46, 10);
      for (let k = 0; k < 6; k++) r(c, "#6a4020", sx + k, 100 + k, 46 - k * 2, 1);
      r(c, "#3a2a1a", sx + 22, 66, 2, 34);
      r(c, "#f4f4ff", sx + 8, 70, 14, 22);
      r(c, "#f4f4ff", sx + 25, 72, 14, 18);
      r(c, "#1b1230", sx + 22, 60, 10, 6);
      // Island sand and a palm tree.
      r(c, "#f0d890", 0, 148, W, 52);
      disc(c, "#f0d890", 240, 160, 70);
      r(c, "#f4f4ff", 0, 146 + Math.sin(t * 2) * 2, W, 3);
      for (let k = 0; k < 10; k++) r(c, "#8a5a2b", 262 + k * 1.2, 150 - k * 8, 6, 9);
      for (let k = -3; k <= 3; k++) for (let i = 0; i < 18; i++) r(c, "#2faf3f", 276 + k * i * 0.6, 70 + Math.abs(k) * i * 0.18 + i * 0.3, 3, 2);
      // An X marks the spot.
      r(c, "#e3262f", 60, 178, 10, 2);
      r(c, "#e3262f", 64, 174, 2, 10);
    },
  },
  {
    id: "museum", name: "The museum at night", ground: 172,
    draw(c, t) {
      r(c, "#3a3a6a", 0, 0, W, 150);
      for (const x of [10, 290]) {
        r(c, "#c8c8d8", x, 20, 20, 130);
        r(c, "#a8a8b8", x - 3, 16, 26, 6);
      }
      // Paintings.
      r(c, "#ffd23f", 44, 30, 44, 34);
      r(c, "#5fb8ff", 48, 34, 36, 26);
      disc(c, "#3fbf4f", 66, 60, 12);
      r(c, "#ffd23f", 232, 30, 40, 34);
      r(c, "#ff8fc8", 236, 34, 32, 26);
      disc(c, "#f4f4ff", 252, 46, 6);
      // A dinosaur skeleton.
      for (let k = 0; k < 9; k++) r(c, "#f4f0e0", 110 + k * 10, 70 + Math.abs(k - 4) * 3, 6, 3);
      for (let k = 0; k < 6; k++) r(c, "#f4f0e0", 124 + k * 9, 74, 2, 22);
      r(c, "#f4f0e0", 196, 54, 22, 12);
      r(c, "#3a3a6a", 210, 57, 3, 3);
      r(c, "#f4f0e0", 130, 96, 3, 40);
      r(c, "#f4f0e0", 180, 96, 3, 40);
      r(c, "#8a8aa0", 120, 136, 76, 8);
      // Moonlight through a skylight.
      c.globalAlpha = 0.12 + Math.sin(t) * 0.03;
      c.fillStyle = "#c0e0ff";
      c.beginPath();
      c.moveTo(140, 0);
      c.lineTo(180, 0);
      c.lineTo(230, 150);
      c.lineTo(90, 150);
      c.fill();
      c.globalAlpha = 1;
      r(c, "#6a4a3a", 0, 150, W, 50);
      floorTiles(c, 150, "#7a5a4a", "#6a4a3a", 24);
    },
  },
  {
    id: "stadium", name: "The soccer stadium", ground: 174,
    draw(c, t) {
      bands(c, ["#4fa8f0", "#78c0ff", "#a0d8ff"], 0, 70);
      // Stands full of fans.
      r(c, "#3a3a5a", 0, 40, W, 70);
      const fan = ["#e3262f", "#2456e8", "#ffd23f", "#f4f4ff", "#3fbf4f", "#ff8fc8"];
      for (let y = 46; y < 104; y += 8)
        for (let x = 4; x < W; x += 8) {
          const up = Math.sin(t * 6 + x * 0.3 + y) > 0.6 ? 2 : 0;
          r(c, fan[(x * 3 + y) % fan.length], x, y - up, 4, 5);
        }
      // Floodlights.
      for (const x of [16, 300]) {
        r(c, "#8a8aa0", x, 0, 3, 40);
        r(c, "#ffffe0", x - 6, 0, 15, 6);
      }
      r(c, "#3fa83f", 0, 110, W, 90);
      for (let x = 0; x < W; x += 40) r(c, "#4fbf4f", x, 110, 20, 90);
      r(c, "#f4f4ff", 0, 112, W, 2);
      r(c, "#f4f4ff", 159, 112, 2, 88);
      // Goal.
      r(c, "#f4f4ff", 262, 120, 3, 40);
      r(c, "#f4f4ff", 262, 120, 50, 3);
      for (let x = 268; x < 312; x += 6) r(c, "#c8c8d8", x, 123, 1, 37);
      for (let y = 126; y < 160; y += 6) r(c, "#c8c8d8", 265, y, 47, 1);
    },
  },
  {
    id: "market", name: "Food truck street", ground: 172,
    draw(c, t) {
      bands(c, ["#ffb070", "#ffc890", "#ffe0b0"], 0, 120);
      sun(c, 50, 30, t);
      for (let i = 0, x = 0; x < W; i++) {
        const w = 40 + ((i * 17) % 20);
        const h = 60 + ((i * 29) % 40);
        r(c, ["#c05040", "#d08a4a", "#8a6ab0", "#4a8ab0"][i % 4], x, 130 - h, w, h);
        for (let y = 130 - h + 8; y < 120; y += 14) for (let wx = x + 6; wx < x + w - 6; wx += 12) r(c, "#ffe8b0", wx, y, 6, 7);
        x += w;
      }
      // Two food trucks with striped awnings.
      for (const [x, col] of [[30, "#e3262f"], [190, "#2456e8"]] as [number, string][]) {
        r(c, col, x, 104, 100, 44);
        r(c, "#1b1230", x + 14, 112, 52, 18);
        r(c, "#ffd23f", x + 16, 114, 48, 14);
        for (let k = 0; k < 10; k++) r(c, k % 2 ? "#f4f4ff" : col, x + 10 + k * 6, 98, 6, 8);
        disc(c, "#1b1230", x + 20, 150, 8);
        disc(c, "#1b1230", x + 80, 150, 8);
        disc(c, "#8a8aa0", x + 20, 150, 3);
        disc(c, "#8a8aa0", x + 80, 150, 3);
      }
      r(c, "#7a7a8a", 0, 150, W, 50);
      r(c, "#c8c8d8", 0, 150, W, 3);
      for (let x = 0; x < W; x += 30) r(c, "#f4f4ff", x + 6, 180, 14, 2);
      // A drifting smell cloud.
      c.globalAlpha = 0.25;
      cloud(c, 140 + Math.sin(t * 0.6) * 20, 80 + Math.sin(t) * 4, 0.7, "#9be35a");
      c.globalAlpha = 1;
    },
  },
  {
    id: "lighthouse", name: "Gull Point Lighthouse", ground: 172,
    draw(c, t) {
      bands(c, ["#2a1f5e", "#5a3a8a", "#c0608a", "#ff9f70"], 0, 120);
      stars(c, t, 14, 40, 13);
      r(c, "#1f4f8f", 0, 112, W, 50);
      for (let x = 0; x < W; x += 20) r(c, "#5fa0e0", (x + t * 10) % W, 120 + ((x / 20) % 3) * 10, 10, 1);
      // Rocks and the lighthouse.
      disc(c, "#5a5a6e", 250, 150, 50);
      disc(c, "#4a4a5e", 290, 160, 40);
      for (let y = 40; y < 120; y++) {
        const w = 14 + (y - 40) * 0.12;
        r(c, Math.floor((y - 40) / 16) % 2 ? "#f4f4ff" : "#e3262f", 250 - w, y, w * 2, 1);
      }
      r(c, "#1b1230", 236, 26, 28, 14);
      r(c, "#ffd23f", 240, 29, 20, 8);
      for (let k = 0; k < 5; k++) r(c, "#1b1230", 230 + k * 9, 22 - (2 - Math.abs(k - 2)) * 2, 6, 4);
      // The sweeping beam.
      c.globalAlpha = 0.25;
      c.fillStyle = "#fff4a0";
      const a = Math.sin(t * 0.8) * 0.9 + Math.PI;
      c.beginPath();
      c.moveTo(250, 33);
      c.lineTo(250 + Math.cos(a - 0.12) * 260, 33 + Math.sin(a - 0.12) * 260);
      c.lineTo(250 + Math.cos(a + 0.12) * 260, 33 + Math.sin(a + 0.12) * 260);
      c.fill();
      c.globalAlpha = 1;
      // Beach and dock.
      r(c, "#c8b080", 0, 158, W, 42);
      r(c, "#8a5a2b", 0, 150, 120, 6);
      for (let x = 6; x < 120; x += 24) r(c, "#6a4020", x, 156, 4, 14);
    },
  },
];

export function bgById(id: string): Bg {
  return BGS.find((b) => b.id === id) ?? BGS[0];
}
