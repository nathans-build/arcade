/*
 * The 320x200 park screen: sky and weather, the juice cart with the hero, 3–4 serving lanes
 * (a rail along a park path), customers walking up with order bubbles and patience bars, items
 * sliding down the rails, and floating "+$1.50" sales. Runs the game clock too (game.step).
 * All in-canvas text uses the game's own bitmap font.
 */
import { ITEMS, type ItemId } from "./config";
import { forEachPixel, textWidth } from "./font";
import type { StandGame } from "./game";
import { DOG, HERO, HERO_SERVE, ITEM_SPRITES, PAL, SUN, customerSprite, spriteCanvas } from "./sprites";

export const W = 320;
export const H = 200;
export const LANE_TOP = 56;
export const LANE_BOTTOM = 198;

export function laneY(i: number, n: number): number {
  const h = (LANE_BOTTOM - LANE_TOP) / n;
  return Math.round(LANE_TOP + h * (i + 0.5));
}
/** Which lane a canvas y falls in (or -1 above the lanes). */
export function laneAt(y: number, n: number): number {
  if (y < LANE_TOP - 8) return -1;
  const h = (LANE_BOTTOM - LANE_TOP) / n;
  return Math.max(0, Math.min(n - 1, Math.floor((y - LANE_TOP) / h)));
}

interface Floater {
  x: number;
  y: number;
  t: number;
  text: string;
  color: string;
}
interface Drop {
  x: number;
  y: number;
  v: number;
}

export class StandScreen {
  private ctx: CanvasRenderingContext2D;
  private raf = 0;
  private last = 0;
  private time = 0;
  private floaters: Floater[] = [];
  private drops: Drop[] = [];
  private clouds = [
    { x: 30, y: 10, w: 34 },
    { x: 140, y: 18, w: 26 },
    { x: 230, y: 8, w: 40 },
  ];
  speed = 1;

  constructor(
    canvas: HTMLCanvasElement,
    private game: StandGame,
  ) {
    canvas.width = W;
    canvas.height = H;
    this.ctx = canvas.getContext("2d")!;
    this.ctx.imageSmoothingEnabled = false;
    for (let i = 0; i < 70; i++) this.drops.push({ x: Math.random() * W, y: Math.random() * H, v: 120 + Math.random() * 60 });
  }

  start() {
    this.last = performance.now();
    const loop = (now: number) => {
      const dt = Math.max(0, Math.min(0.05, (now - this.last) / 1000));
      this.last = now;
      for (let i = 0; i < this.speed; i++) this.game.step(dt);
      this.update(dt);
      this.draw();
      this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
  }

  stop() {
    cancelAnimationFrame(this.raf);
  }

  private update(dt: number) {
    if (this.game.paused) return;
    this.time += dt;
    for (const e of this.game.events.splice(0)) {
      this.floaters.push({ x: e.x, y: laneY(e.lane, this.game.lanes) - 26, t: 1.4, text: e.text, color: e.color });
    }
    for (const f of this.floaters) {
      f.t -= dt;
      f.y -= 14 * dt;
    }
    this.floaters = this.floaters.filter((f) => f.t > 0);
    for (const c of this.clouds) {
      c.x += 3 * dt;
      if (c.x > W + 10) c.x = -c.w - 10;
    }
    for (const d of this.drops) {
      d.y += d.v * dt;
      d.x -= d.v * 0.2 * dt;
      if (d.y > H) {
        d.y = -4;
        d.x = Math.random() * (W + 40);
      }
    }
  }

  // ------------------------------------------------------------------ drawing helpers

  private rect(x: number, y: number, w: number, h: number, c: string) {
    this.ctx.fillStyle = c;
    this.ctx.fillRect(Math.round(x), Math.round(y), w, h);
  }

  text(s: string, x: number, y: number, color: string, scale = 1, shadow = true) {
    const ctx = this.ctx;
    const plot = (dx: number, dy: number, c: string) => {
      ctx.fillStyle = c;
      forEachPixel(s, (px, py) => ctx.fillRect(Math.round(x) + px * scale + dx, Math.round(y) + py * scale + dy, scale, scale));
    };
    if (shadow) plot(1, 1, PAL.ink);
    plot(0, 0, color);
  }

  private textC(s: string, cx: number, y: number, color: string, scale = 1) {
    this.text(s, cx - textWidth(s, scale) / 2, y, color, scale);
  }

  private sprite(key: string, s: Parameters<typeof spriteCanvas>[1], x: number, y: number, flip = false) {
    this.ctx.drawImage(spriteCanvas(key, s, flip), Math.round(x), Math.round(y));
  }

  // ------------------------------------------------------------------ scene

  draw() {
    const g = this.game;
    const ctx = this.ctx;
    const w = g.today.forecast.weather;
    const playing = g.phase !== "title" && g.phase !== "over";

    // Sky
    const skyTop = w === "sunny" ? "#4f86f0" : w === "cloudy" ? "#7c86a8" : "#3e4868";
    const skyLow = w === "sunny" ? "#a8c8ff" : w === "cloudy" ? "#a9b0c8" : "#5c6688";
    for (let y = 0; y < 46; y++) {
      const t = y / 45;
      ctx.fillStyle = t < 0.5 ? skyTop : skyLow;
      ctx.fillRect(0, y, W, 1);
    }
    if (w === "sunny") this.sprite("sun", SUN, 288, 8);
    const cloudCol = w === "sunny" ? "#f2f4ff" : w === "cloudy" ? "#dde0ec" : "#8a92ac";
    for (const c of w === "sunny" ? this.clouds.slice(0, 1) : this.clouds) {
      this.rect(c.x, c.y + 3, c.w, 6, cloudCol);
      this.rect(c.x + 5, c.y, c.w - 12, 4, cloudCol);
      this.rect(c.x + c.w / 2, c.y - 2, c.w / 3, 3, cloudCol);
    }
    // Trees and a fence along the back of the park
    for (let i = 0; i < 9; i++) {
      const tx = 6 + i * 38 + ((i * 17) % 11);
      this.rect(tx + 7, 34, 3, 10, "#6b4423");
      this.rect(tx, 24, 17, 12, i % 2 ? "#1f7a35" : "#24903f");
      this.rect(tx + 3, 19, 11, 6, i % 2 ? "#1f7a35" : "#24903f");
    }
    this.rect(0, 42, W, 2, "#f2f4ff");
    for (let x = 2; x < W; x += 8) this.rect(x, 38, 2, 6, "#f2f4ff");
    // Grass
    this.rect(0, 44, W, H - 44, w === "rain" ? "#27753a" : PAL.grass);
    for (let i = 0; i < 60; i++) {
      const gx = (i * 53) % W;
      const gy = 48 + ((i * 29) % 150);
      this.rect(gx, gy, 2, 1, PAL.grassDark);
    }

    // Lanes: a path with a serving rail
    const n = g.lanes;
    for (let i = 0; i < n; i++) {
      const y = laneY(i, n);
      this.rect(44, y - 3, W - 44, 16, PAL.path);
      this.rect(44, y + 13, W - 44, 1, PAL.pathDark);
      for (let x = 52; x < W; x += 16) this.rect(x, y - 3, 1, 16, PAL.pathDark);
      // the rail
      this.rect(44, y - 8, W - 44, 3, i === g.heroLane && playing ? PAL.yellow : "#e3262f");
      this.rect(44, y - 5, W - 44, 1, "#8a1218");
      // lane number
      this.text(String(i + 1), 46, y + 3, PAL.navy, 1, false);
    }

    // The cart: striped awning, blue body, wheels
    const cartTop = LANE_TOP - 12;
    for (let x = 0; x < 44; x += 6) this.rect(x, cartTop, 6, 7, (x / 6) % 2 ? PAL.white : PAL.red);
    this.rect(0, cartTop + 7, 44, 2, "#8a1218");
    this.rect(2, cartTop + 9, 2, LANE_BOTTOM - cartTop - 12, "#6ea0ff");
    this.rect(40, cartTop + 9, 2, LANE_BOTTOM - cartTop - 12, "#6ea0ff");
    this.rect(0, LANE_BOTTOM - 22, 44, 18, PAL.blue);
    this.rect(0, LANE_BOTTOM - 22, 44, 2, "#6ea0ff");
    this.text("JUICE", 6, LANE_BOTTOM - 18, PAL.yellow, 1, false);
    this.rect(6, LANE_BOTTOM - 4, 6, 4, PAL.ink);
    this.rect(32, LANE_BOTTOM - 4, 6, 4, PAL.ink);
    if (g.upgrades.has("sign")) {
      this.rect(4, 2, 50, 11, PAL.yellow);
      this.rect(5, 3, 48, 9, PAL.red);
      this.text("JUICE!", 12, 4, PAL.yellow);
    }
    if (g.upgrades.has("umbrella")) {
      for (let x = -2; x < 50; x += 7) this.rect(x, cartTop - 6, 7, 5, (x / 7) % 2 ? PAL.yellow : PAL.blue);
    }
    if (g.upgrades.has("cooler")) {
      this.rect(4, LANE_BOTTOM - 38, 16, 12, "#7ff3ff");
      this.rect(4, LANE_BOTTOM - 38, 16, 2, PAL.white);
    }
    // A juice dispenser at each lane's start
    for (let i = 0; i < n; i++) {
      const y = laneY(i, n);
      this.rect(30, y - 16, 10, 10, "#ff9a1f");
      this.rect(30, y - 16, 10, 2, PAL.white);
      this.rect(34, y - 6, 2, 2, PAL.ink);
    }

    // Hero at the current lane
    const hy = laneY(g.heroLane, n);
    const heroSprite = g.heroPose > 0 ? HERO_SERVE : HERO;
    this.sprite(g.heroPose > 0 ? "heroS" : "hero", heroSprite, 22 + (g.heroPose > 0 ? 2 : 0), hy - 14);
    if (playing) {
      const it = g.held;
      this.sprite(`item-${it}`, ITEM_SPRITES[it], 38, hy - 22);
    }

    // Slides
    for (const s of g.slides) this.sprite(`item-${s.item}`, ITEM_SPRITES[s.item], s.x - 3, laneY(s.lane, n) - 16);

    // Customers (farther lanes first so lower ones overlap)
    const custs = [...g.customers].sort((a, b) => a.lane - b.lane || b.x - a.x);
    for (const c of custs) {
      const y = laneY(c.lane, n);
      const walking = c.state !== "wait";
      const bob = walking ? Math.floor((this.time * 6 + c.bob) % 2) : 0;
      const flip = c.state === "leave";
      const top = y - 5 - bob;
      this.sprite(`c-${c.kind}-${c.id % 4}`, customerSprite(c.kind, c.id), c.x - 6, top, flip);
      if (c.kind === "dogwalker") this.sprite("dog", DOG, c.x + (flip ? -16 : 7), y + 6, flip);
      // Order bubble with the items still wanted
      if (c.state !== "leave") {
        const left = g.remaining(c);
        const bw = left.length * 8 + 4;
        const bx = c.x - bw / 2;
        const by = top - 12;
        this.rect(bx, by, bw, 11, PAL.white);
        this.rect(bx + bw / 2 - 1, by + 11, 3, 2, PAL.white);
        left.forEach((it, k) => this.sprite(`item-${it}`, ITEM_SPRITES[it], bx + 2 + k * 8, by + 2));
        // Patience bar
        if (c.state === "wait") {
          const f = Math.max(0, c.patience / c.maxPatience);
          this.rect(c.x - 7, y + 14, 14, 2, PAL.ink);
          this.rect(c.x - 7, y + 14, Math.round(14 * f), 2, f > 0.5 ? PAL.green : f > 0.25 ? PAL.yellow : PAL.red);
        }
      }
      if (c.bubble) {
        const tw = textWidth(c.bubble.text);
        const bx = Math.min(W - tw - 4, Math.max(2, c.x - tw / 2 - 2));
        this.rect(bx, top - 22, tw + 4, 9, c.mood === "sad" ? "#ffd0d4" : PAL.white);
        this.text(c.bubble.text, bx + 2, top - 21, PAL.navy, 1, false);
      }
    }

    // Floaters
    for (const f of this.floaters) this.textC(f.text, f.x, f.y, f.color);

    // Rain over everything
    if (w === "rain") {
      ctx.fillStyle = "rgba(200,220,255,0.55)";
      for (const d of this.drops) ctx.fillRect(Math.round(d.x), Math.round(d.y), 1, 3);
    }

    // Top info line
    if (playing) {
      const f = g.today.forecast;
      const label = `DAY ${g.day}/${g.days}  ${f.weather === "rain" ? "RAIN" : f.weather.toUpperCase()} ${f.temp}°F`;
      this.rect(0, 0, textWidth(label) + 6, 10, "rgba(5,8,24,0.65)");
      this.text(label, 3, 2, PAL.yellow);
      if (g.phase === "rush" || g.phase === "pay") {
        const left = g.orders.length - g.spawned + g.customers.filter((c) => c.state !== "leave").length;
        const right = `SERVED ${g.today.served}  WAITING ${left}`;
        this.rect(W - textWidth(right) - 6, 0, textWidth(right) + 6, 10, "rgba(5,8,24,0.65)");
        this.text(right, W - textWidth(right) - 3, 2, PAL.white);
        // Item picker strip
        const sx = 60;
        this.rect(sx - 2, 12, ITEMS.length * 46 + 2, 11, "rgba(5,8,24,0.65)");
        ITEMS.forEach((it: ItemId, k) => {
          const x = sx + k * 46;
          const on = it === g.held;
          if (on) this.rect(x - 1, 12, 45, 11, PAL.yellow);
          this.sprite(`item-${it}`, ITEM_SPRITES[it], x + 1, 13);
          const lbl = it === "fruit" ? "FRUIT" : g.itemLabel(it);
          this.text(`${lbl} ${g.canMake(it)}`, x + 9, 14, on ? PAL.navy : PAL.white, 1, !on);
        });
      }
    } else if (g.phase === "title") {
      this.textC("SIDEWALK STAND", W / 2, 4, PAL.yellow, 2);
    }

    if (g.phase === "rush" && g.closing >= 0) {
      this.rect(80, 92, 160, 18, "rgba(5,8,24,0.8)");
      this.textC(g.soldOutFlag ? "SOLD OUT!" : "CLOSING TIME!", W / 2, 96, PAL.yellow, 2);
    }
  }
}
