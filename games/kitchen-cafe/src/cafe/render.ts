import { STATIONS } from "./kitchens";
import { ZONE, OVERDONE, noClock, type CafeSim } from "./sim";
import { CHANGE_BY_ID } from "./science";

/*
 * All the art, drawn in code on a 320×200 canvas (scaled up with crisp pixels): the dining
 * counter with customers, the five kitchen stations, and Chef Bix, the café's own mascot
 * (a round little chef with a tall hat, red apron and blue neckerchief). Original art only.
 */

export const W = 320;
export const H = 200;

type Ctx = CanvasRenderingContext2D;

interface Theme {
  wall: string; wall2: string; trim: string; floor1: string; floor2: string; counter: string; counterTop: string; sign: string; signText: string; label: string;
}

const THEMES: Record<number, Theme> = {
  1: { wall: "#1d8a8a", wall2: "#23a3a3", trim: "#e3262f", floor1: "#f2f4ff", floor2: "#e3262f", counter: "#c0c6e0", counterTop: "#e3262f", sign: "#0a0f2e", signText: "#ff5fa2", label: "BREAKFAST DINER" },
  2: { wall: "#8a3b2a", wall2: "#9c4632", trim: "#2f9e44", floor1: "#f2f4ff", floor2: "#2f9e44", counter: "#7a5232", counterTop: "#e3262f", sign: "#0a0f2e", signText: "#ffd23f", label: "PIZZA PARLOR" },
  3: { wall: "#7cc8ff", wall2: "#9ad6ff", trim: "#2456e8", floor1: "#d8ecff", floor2: "#2456e8", counter: "#f2f4ff", counterTop: "#2456e8", sign: "#0a0f2e", signText: "#6ef0ff", label: "FROSTY TRUCK" },
  4: { wall: "#4b1f7a", wall2: "#5a2890", trim: "#ffd23f", floor1: "#2a1450", floor2: "#ffd23f", counter: "#2a2a48", counterTop: "#ffd23f", sign: "#0a0f2e", signText: "#ffd23f", label: "BAKE-OFF FINALE" },
};

function rect(c: Ctx, x: number, y: number, w: number, h: number, col: string) {
  c.fillStyle = col;
  c.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}

function text(c: Ctx, s: string, x: number, y: number, col: string, size = 8, align: CanvasTextAlign = "center") {
  c.font = `${size}px "Press Start 2P", monospace`;
  c.textAlign = align;
  c.textBaseline = "top";
  c.fillStyle = "#000";
  c.fillText(s, x + 1, y + 1);
  c.fillStyle = col;
  c.fillText(s, x, y);
}

// ------------------------------------------------------------------ scene

function drawRoom(c: Ctx, kitchen: number, t: number) {
  const th = THEMES[kitchen] ?? THEMES[1];
  rect(c, 0, 0, W, 100, th.wall);
  for (let x = 0; x < W; x += 16) rect(c, x, 0, 8, 100, th.wall2);
  rect(c, 0, 18, W, 2, th.trim);
  // neon sign
  rect(c, 92, 2, 136, 15, th.sign);
  rect(c, 92, 2, 136, 1, th.trim);
  const blink = Math.sin(t * 3) > -0.8;
  text(c, th.label, 160, 5, blink ? th.signText : "#444", 7);
  if (kitchen === 1) {
    // round diner windows
    for (const x of [24, 270]) {
      rect(c, x, 28, 28, 28, "#0a0f2e");
      rect(c, x + 3, 31, 22, 22, "#ffd9a0");
      rect(c, x + 13, 31, 2, 22, "#0a0f2e");
    }
  } else if (kitchen === 2) {
    // brick pizza oven and awning
    rect(c, 18, 26, 50, 40, "#5a2a1c");
    for (let y = 26; y < 66; y += 6) for (let x = 18 + ((y / 6) % 2) * 5; x < 66; x += 10) rect(c, x, y, 9, 5, "#a24b33");
    rect(c, 30, 44, 26, 22, "#1a0a06");
    rect(c, 33, 54, 20, 12, Math.sin(t * 6) > 0 ? "#ff8a1f" : "#ffd23f");
    for (let x = 240; x < 312; x += 12) rect(c, x, 24, 6, 10, "#f2f4ff"), rect(c, x + 6, 24, 6, 10, "#2f9e44");
  } else if (kitchen === 3) {
    // truck serving window with snowy sky
    rect(c, 14, 24, 64, 40, "#2456e8");
    rect(c, 18, 28, 56, 32, "#cfe9ff");
    for (let i = 0; i < 8; i++) {
      const sx = 20 + ((i * 23 + t * 8) % 52);
      const sy = 30 + ((i * 11 + t * 14) % 28);
      rect(c, sx, sy, 2, 2, "#ffffff");
    }
    for (let x = 0; x < W; x += 20) rect(c, x + ((t * 4) % 20), 92, 6, 2, "#ffffff");
  } else {
    // stage curtain and spotlights
    for (let x = 0; x < 40; x += 8) rect(c, x, 20, 6, 80, "#8a1c3c"), rect(c, W - 40 + x, 20, 6, 80, "#8a1c3c");
    c.globalAlpha = 0.18 + 0.08 * Math.sin(t * 2);
    c.fillStyle = "#fff6c0";
    c.beginPath();
    c.moveTo(150, 20);
    c.lineTo(110, 100);
    c.lineTo(210, 100);
    c.closePath();
    c.fill();
    c.globalAlpha = 1;
  }
  // counter where customers stand
  rect(c, 0, 84, W, 4, th.counterTop);
  rect(c, 0, 88, W, 14, th.counter);
  for (let x = 6; x < W; x += 24) rect(c, x, 90, 12, 10, "rgba(0,0,0,0.12)");
  // kitchen floor
  for (let y = 102; y < H; y += 8) for (let x = 0; x < W; x += 8) rect(c, x, y, 8, 8, ((x + y) / 8) % 2 ? th.floor1 : th.floor2);
  c.globalAlpha = 0.55;
  rect(c, 0, 102, W, H - 102, "#0a0f2e");
  c.globalAlpha = 1;
}

// ------------------------------------------------------------------ people

const SKIN = ["#f6c89a", "#d99a6c", "#8d5a3b", "#f0d0b0", "#b87a4b", "#6b4228"];
const SHIRTS = ["#2456e8", "#2f9e44", "#ff8a1f", "#8a3bd1", "#e3262f", "#16a3a3"];
const HAIR = ["#3a2412", "#111111", "#d8a040", "#7a2a10", "#555555", "#f2e2b0"];

function drawCustomer(c: Ctx, x: number, y: number, v: number, t: number, happy: boolean) {
  const skin = SKIN[v % 6], shirt = SHIRTS[(v * 5 + 1) % 6], hair = HAIR[(v * 7 + 2) % 6];
  const bob = Math.round(Math.sin(t * 6) * 1);
  rect(c, x - 7, y - 14 + bob, 14, 14, shirt);
  rect(c, x - 6, y - 26 + bob, 12, 12, skin);
  rect(c, x - 7, y - 28 + bob, 14, 4, hair);
  if (v % 3 === 0) rect(c, x - 7, y - 26 + bob, 3, 8, hair);
  rect(c, x - 3, y - 22 + bob, 2, 2, "#111");
  rect(c, x + 2, y - 22 + bob, 2, 2, "#111");
  if (happy) {
    rect(c, x - 3, y - 18 + bob, 6, 1, "#7a1010");
    rect(c, x - 4, y - 19 + bob, 1, 1, "#7a1010");
    rect(c, x + 3, y - 19 + bob, 1, 1, "#7a1010");
  } else rect(c, x - 2, y - 18 + bob, 4, 1, "#7a1010");
}

/** Chef Bix: tall white hat, round face, red apron, blue neckerchief. */
export function drawChef(c: Ctx, x: number, y: number, t: number, working: boolean, mood: "happy" | "think" = "happy") {
  const bob = working ? Math.round(Math.sin(t * 18) * 1) : Math.round(Math.sin(t * 3));
  const X = Math.round(x), Y = Math.round(y) + bob;
  // legs
  rect(c, X - 6, Y - 6, 5, 6, "#1c2a78");
  rect(c, X + 1, Y - 6, 5, 6, "#1c2a78");
  rect(c, X - 7, Y - 1, 6, 2, "#111");
  rect(c, X + 1, Y - 1, 6, 2, "#111");
  // body + apron
  rect(c, X - 9, Y - 22, 18, 17, "#f2f4ff");
  rect(c, X - 6, Y - 18, 12, 13, "#e3262f");
  rect(c, X - 1, Y - 16, 2, 2, "#ffd23f");
  // arms
  const arm = working ? Math.round(Math.sin(t * 18) * 2) : 0;
  rect(c, X - 12, Y - 20 + arm, 4, 10, "#f2f4ff");
  rect(c, X + 8, Y - 20 - arm, 4, 10, "#f2f4ff");
  rect(c, X - 12, Y - 11 + arm, 4, 3, "#f6c89a");
  rect(c, X + 8, Y - 11 - arm, 4, 3, "#f6c89a");
  // spatula
  rect(c, X + 11, Y - 18 - arm, 1, 8, "#8a8a9a");
  rect(c, X + 10, Y - 21 - arm, 3, 3, "#c0c6e0");
  // neckerchief
  rect(c, X - 6, Y - 24, 12, 3, "#2456e8");
  rect(c, X - 2, Y - 22, 4, 3, "#2456e8");
  // head
  rect(c, X - 8, Y - 37, 16, 14, "#f6c89a");
  rect(c, X - 9, Y - 33, 1, 5, "#f6c89a");
  rect(c, X + 8, Y - 33, 1, 5, "#f6c89a");
  rect(c, X - 5, Y - 32, 2, 3, "#111");
  rect(c, X + 3, Y - 32, 2, 3, "#111");
  rect(c, X - 7, Y - 28, 3, 2, "#ff9a9a");
  rect(c, X + 4, Y - 28, 3, 2, "#ff9a9a");
  if (mood === "happy") {
    rect(c, X - 3, Y - 26, 6, 1, "#7a1010");
    rect(c, X - 4, Y - 27, 1, 1, "#7a1010");
    rect(c, X + 3, Y - 27, 1, 1, "#7a1010");
  } else rect(c, X - 2, Y - 26, 4, 2, "#7a1010");
  // curly mustache
  rect(c, X - 4, Y - 29, 8, 1, "#5a3218");
  rect(c, X - 5, Y - 30, 1, 1, "#5a3218");
  rect(c, X + 4, Y - 30, 1, 1, "#5a3218");
  // toque
  rect(c, X - 8, Y - 40, 16, 3, "#dfe3f5");
  rect(c, X - 7, Y - 50, 14, 10, "#ffffff");
  rect(c, X - 9, Y - 52, 6, 6, "#ffffff");
  rect(c, X - 3, Y - 54, 6, 6, "#ffffff");
  rect(c, X + 3, Y - 52, 6, 6, "#ffffff");
  rect(c, X - 7, Y - 42, 14, 1, "#c9cfe8");
}

// ------------------------------------------------------------------ stations

const SX = (i: number) => 32 + i * 64;
const STATION_Y = 106;

function drawStation(c: Ctx, i: number, t: number, active: boolean, progress: number, target: boolean, change?: string, zone = true) {
  const x = SX(i) - 28;
  const y = STATION_Y;
  // base cabinet
  rect(c, x, y + 26, 56, 26, "#3a4270");
  rect(c, x, y + 24, 56, 3, "#8a94c8");
  rect(c, x + 4, y + 32, 22, 16, "#2c3360");
  rect(c, x + 30, y + 32, 22, 16, "#2c3360");
  if (target) {
    const a = 0.5 + 0.5 * Math.sin(t * 8);
    c.globalAlpha = a;
    rect(c, x - 2, y - 2, 60, 2, "#ffd23f");
    rect(c, x - 2, y + 52, 60, 2, "#ffd23f");
    rect(c, x - 2, y - 2, 2, 56, "#ffd23f");
    rect(c, x + 56, y - 2, 2, 56, "#ffd23f");
    c.globalAlpha = 1;
  }
  const id = STATIONS[i].id;
  const p = Math.min(1, progress);
  if (id === "board") {
    rect(c, x + 6, y + 14, 44, 10, "#b07a3a");
    rect(c, x + 6, y + 14, 44, 2, "#d49a52");
    const chop = active ? Math.abs(Math.sin(t * 14)) * 6 : 0;
    rect(c, x + 30, y + 2 + chop, 3, 10, "#5a3218");
    rect(c, x + 33, y + 4 + chop, 12, 5, "#d8dce8");
    if (active) for (let k = 0; k < Math.floor(p * 5); k++) rect(c, x + 10 + k * 4, y + 10, 3, 3, "#f0c060");
  } else if (id === "bowl") {
    rect(c, x + 12, y + 10, 32, 14, "#2456e8");
    rect(c, x + 10, y + 8, 36, 3, "#6ea0ff");
    const rise = change === "yeast-rise" && active ? p * 6 : 0;
    rect(c, x + 14, y + 6 - rise, 28, 4 + rise, change === "cocoa" ? "#6b3a1c" : change === "float-fizz" ? "#7a3a1a" : "#f2e2b0");
    const sw = active ? Math.sin(t * 12) * 6 : 0;
    rect(c, x + 27 + sw, y - 4, 2, 12, "#c0c6e0");
    if (active && (change === "float-fizz" || change === "soda-vinegar")) for (let k = 0; k < 5; k++) rect(c, x + 16 + k * 6, y + 2 - ((t * 20 + k * 5) % 12), 2, 2, "#ffffff");
  } else if (id === "stove") {
    rect(c, x + 4, y + 12, 48, 12, "#1a1a2e");
    if (active) {
      for (let k = 0; k < 4; k++) rect(c, x + 14 + k * 8, y + 18 - ((t * 30 + k * 3) % 4), 4, 4, k % 2 ? "#6ea0ff" : "#ff8a1f");
    }
    rect(c, x + 10, y + 8, 36, 5, "#555a70");
    rect(c, x + 46, y + 9, 8, 2, "#333");
    if (active) {
      const cooked = p;
      // food in the pan changes as it cooks
      const col = change === "fry-egg" ? (cooked > 0.5 ? "#ffffff" : "#e8f0ff") : change === "melt-butter" || change === "melt-chocolate" ? (change === "melt-chocolate" ? "#5a2e12" : "#ffe680") : change === "caramel" ? (cooked > 0.5 ? "#a85a14" : "#f2f4ff") : change === "pancakes" ? (cooked > 0.5 ? "#d49a52" : "#f2e2b0") : "#cfe9ff";
      rect(c, x + 16, y + 6, 24 - (change === "melt-butter" ? 0 : 0) + cooked * 4, 3, col);
      if (change === "fry-egg") rect(c, x + 25, y + 5, 5, 3, "#ffd23f");
      if (change === "boil-water" || change === "salt-water") for (let k = 0; k < 4; k++) rect(c, x + 16 + k * 7, y - ((t * 18 + k * 4) % 14), 3, 3, "rgba(255,255,255,0.7)");
    }
  } else if (id === "oven") {
    rect(c, x + 6, y - 4, 44, 28, "#c0c6e0");
    rect(c, x + 6, y - 4, 44, 4, "#8a94c8");
    rect(c, x + 12, y + 3, 32, 16, "#1a1a2e");
    if (active) {
      c.globalAlpha = 0.5 + 0.3 * Math.sin(t * 10);
      rect(c, x + 12, y + 3, 32, 16, "#ff8a1f");
      c.globalAlpha = 1;
      const brown = change === "toast" || change === "bake-crust" || change === "cookies" || change === "bake-cupcake";
      const rise = change === "bake-cupcake" ? p * 5 : 0;
      rect(c, x + 18, y + 12 - rise, 20, 5 + rise, brown ? (p > 0.6 ? "#a8642a" : "#e8c27a") : change === "melt-cheese" ? "#ffd23f" : "#e8c27a");
    }
    for (let k = 0; k < 3; k++) rect(c, x + 14 + k * 8, y - 2, 3, 2, active ? "#ff3030" : "#2a2a48");
  } else {
    rect(c, x + 8, y - 8, 40, 32, "#e8f4ff");
    rect(c, x + 8, y - 8, 40, 2, "#ffffff");
    rect(c, x + 8, y + 6, 40, 1, "#9ab8d8");
    rect(c, x + 42, y - 4, 2, 8, "#8a94c8");
    rect(c, x + 42, y + 10, 2, 8, "#8a94c8");
    if (active) for (let k = 0; k < 6; k++) rect(c, x + 10 + ((k * 13 + t * 20) % 34), y - 6 + ((k * 7 + t * 16) % 28), 2, 2, "#6ef0ff");
  }
  text(c, STATIONS[i].short, SX(i), y + 40, active ? "#ffd23f" : "#c9d2ff", 5);
  // cooking meter
  if (active) {
    const bx = x + 2, by = y - 16, bw = 52;
    rect(c, bx - 1, by - 1, bw + 2, 8, "#000");
    rect(c, bx, by, bw, 6, "#2a3268");
    if (zone) rect(c, bx + (ZONE[0] / OVERDONE) * bw, by, ((ZONE[1] - ZONE[0]) / OVERDONE) * bw, 6, "#2f9e44");
    const f = zone ? Math.min(1, progress / OVERDONE) : Math.min(1, progress);
    rect(c, bx, by, f * bw, zone ? 2 : 6, zone ? "#ffd23f" : "#2f9e44");
    if (zone) rect(c, bx + f * bw - 1, by - 2, 2, 10, "#ffffff");
  }
}

/** Puffs over the station that just finished: bubbles for gas, steam, smell waves, sparkles. */
function drawAfter(c: Ctx, sim: CafeSim, t: number) {
  const d = sim.lastDone;
  if (!d) return;
  const item = d.change ? CHANGE_BY_ID.get(d.change) : undefined;
  const x = SX(d.station);
  const y = STATION_Y;
  const k = d.t;
  c.globalAlpha = Math.max(0, 1 - k / 2.5);
  if (item?.clues.includes("gas") || item?.clues.includes("already")) for (let i = 0; i < 7; i++) rect(c, x - 18 + i * 6, y - 4 - ((k * 30 + i * 7) % 30), 3, 3, "#ffffff");
  else if (item?.clues.includes("smell")) for (let i = 0; i < 3; i++) for (let j = 0; j < 6; j++) rect(c, x - 12 + i * 10 + Math.sin(k * 6 + j) * 2, y - 6 - j * 4 - k * 8, 2, 3, "#ffd9a0");
  else if (item?.clues.includes("state")) for (let i = 0; i < 5; i++) rect(c, x - 14 + i * 7, y - 6 - ((k * 20 + i * 5) % 24), 4, 4, "rgba(220,240,255,0.8)");
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + k * 2;
    rect(c, x + Math.cos(a) * (10 + k * 14), y + 6 + Math.sin(a) * (6 + k * 8), 2, 2, "#ffd23f");
  }
  c.globalAlpha = 1;
  void t;
}

/** One frame. `sim` may be null (title screen): the café idles with Chef Bix waving. */
export function drawFrame(c: Ctx, sim: CafeSim | null, kitchen: number, t: number) {
  c.imageSmoothingEnabled = false;
  drawRoom(c, kitchen, t);
  // customer at the counter
  if (sim && sim.order && sim.phase !== "done") {
    let cx = 236;
    if (sim.phase === "arrive") cx = W + 20 - (W + 20 - 236) * Math.min(1, sim.phaseT / 1.1);
    if (sim.phase === "leave") cx = 236 + (W + 30 - 236) * Math.min(1, sim.phaseT / 0.9);
    drawCustomer(c, cx, 86, sim.order.customer, t, sim.phase === "pay" || sim.phase === "leave");
    // ticket on the rail
    if (sim.phase !== "arrive") {
      rect(c, 116, 30, 70, 46, "#fffbe8");
      rect(c, 116, 30, 70, 5, "#e3262f");
      text(c, `#${sim.orderIdx + 1}`, 151, 38, "#0a0f2e", 6);
      const steps = sim.order.dish.steps;
      steps.forEach((s, i) => {
        const done = i < sim.step;
        const idx = STATIONS.findIndex((st) => st.id === s.station);
        text(c, `${done ? "✓" : i === sim.step ? ">" : " "}${STATIONS[idx].short}`, 120, 48 + i * 9, done ? "#2f9e44" : i === sim.step ? "#e3262f" : "#4a4a6a", 5, "left");
      });
    }
    if (sim.phase === "pay") {
      for (let i = 0; i < 4; i++) rect(c, 220 + i * 6, 70 - ((sim.phaseT * 40 + i * 6) % 20), 4, 4, "#ffd23f");
    }
  } else if (!sim) {
    drawCustomer(c, 236, 86, Math.floor(t / 4) % 6, t, true);
  }
  for (let i = 0; i < STATIONS.length; i++) {
    const active = !!sim && sim.phase === "work" && sim.work?.station === i;
    const target = !!sim && sim.phase === "cook" && sim.nextStation === i;
    const step = sim?.order?.dish.steps[sim.step];
    drawStation(c, i, t, active, active ? sim!.work!.progress : 0, target, active ? step?.change : undefined, !sim || !noClock(sim.grade));
  }
  if (sim) drawAfter(c, sim, t);
  const cx = sim ? SX(sim.chefX) : SX(2) + Math.sin(t * 0.7) * 60;
  drawChef(c, cx, 196, t, !!sim && sim.phase === "work", sim?.phase === "ask" ? "think" : "happy");
  if (sim && sim.flashT > 0 && sim.flash) text(c, sim.flash, 160, 22 + 2 * Math.sin(t * 10), "#ffd23f", 7);
}
