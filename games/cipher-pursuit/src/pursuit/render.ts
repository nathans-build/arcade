/*
 * Draws a PursuitSim onto the 320x200 canvas: the scrolling road (city, coast or river),
 * the 4-lane code checkpoint with its answer gates, the cars and boats, foam, goo and the van.
 */
import { forEachPixel, hasGlyphs, rowSpan, textWidth } from "./font";
import {
  GATE_LEFT, H, LANE_W, PLAYER_Y, W, ZONE_NAMES, laneAt, laneCenter,
  type Checkpoint, type Enemy, type PursuitSim, type Surface,
} from "./sim";
import { getSprites, type SpriteSheet } from "./sprites";

export const LANE_COLORS = ["#e3262f", "#2456e8", "#ffd23f", "#2fbf5a"];
const LANE_TEXT_ON = ["#fff", "#fff", "#11131f", "#11131f"];

const SIDE: Record<Surface, string> = { city: "#1a1f3a", coast: "#d9b56a", water: "#2e8b3e" };
const ROAD: Record<Surface, string> = { city: "#3a3f55", coast: "#41465c", water: "#1f5fd0" };

function hash(n: number): number {
  let x = Math.imul(n ^ 0x9e3779b9, 0x85ebca6b);
  x ^= x >>> 13;
  x = Math.imul(x, 0xc2b2ae35);
  x ^= x >>> 16;
  return (x >>> 0) / 4294967296;
}

/** Greedy word wrap to a pixel width (scale 1). */
export function wrap(s: string, max: number): string[] {
  const out: string[] = [];
  let cur = "";
  for (const w of s.split(/\s+/)) {
    const next = cur ? `${cur} ${w}` : w;
    if (cur && textWidth(next) > max) {
      out.push(cur);
      cur = w;
    } else cur = next;
  }
  if (cur) out.push(cur);
  return out;
}

export interface Banner { text: string; sub?: string; t: number; color: string }

export class Renderer {
  private ctx: CanvasRenderingContext2D;
  private sprites: SpriteSheet;
  private textCache = new Map<string, HTMLCanvasElement>();
  shake = 0;

  constructor(canvas: HTMLCanvasElement) {
    canvas.width = W;
    canvas.height = H;
    this.ctx = canvas.getContext("2d")!;
    this.ctx.imageSmoothingEnabled = false;
    this.sprites = getSprites();
  }

  /** Pixel-font text. `align`: 0 left, 0.5 centre, 1 right. */
  text(s: string, x: number, y: number, color = "#f2f4ff", scale = 1, align = 0.5, shadow = true) {
    const key = `${s}|${color}|${scale}|${shadow}`;
    let c = this.textCache.get(key);
    if (!c) {
      const [lo, hi] = rowSpan(s);
      c = document.createElement("canvas");
      c.width = textWidth(s, scale) + (shadow ? scale : 0) + 1;
      c.height = (hi - lo + 1) * scale + (shadow ? scale : 0);
      const g = c.getContext("2d")!;
      if (shadow) {
        g.fillStyle = "#000";
        forEachPixel(s, (px, py) => g.fillRect(px * scale + scale, (py - lo) * scale + scale, scale, scale));
      }
      g.fillStyle = color;
      forEachPixel(s, (px, py) => g.fillRect(px * scale, (py - lo) * scale, scale, scale));
      if (this.textCache.size > 400) this.textCache.clear();
      this.textCache.set(key, c);
    }
    this.ctx.drawImage(c, Math.round(x - c.width * align), Math.round(y));
  }

  draw(sim: PursuitSim, banner: Banner | null) {
    const ctx = this.ctx;
    ctx.save();
    if (this.shake > 0) {
      ctx.translate(Math.round((Math.random() - 0.5) * this.shake * 4), Math.round((Math.random() - 0.5) * this.shake * 4));
      this.shake = Math.max(0, this.shake - 0.05);
    }
    this.ground(sim);
    this.scenery(sim);
    for (const c of [sim.cp, ...sim.ramps]) if (Number.isFinite(c.gateWy)) this.laneMarks(sim, c);
    this.enemies(sim, true);
    this.enemies(sim, false);
    this.shots(sim);
    this.van(sim);
    this.player(sim);
    this.fx(sim);
    for (const c of [sim.cp, ...sim.ramps]) if (Number.isFinite(c.gateWy)) this.gate(sim, c);
    this.floaters(sim);
    this.overlay(sim, banner);
    ctx.restore();
  }

  /* ------------------------------------------------------------ road and scenery */

  private ground(sim: PursuitSim) {
    const ctx = this.ctx;
    for (let y = 0; y < H; y += 2) {
      const wy = sim.dist + PLAYER_Y - y;
      const r = sim.roadAt(wy);
      const left = Math.round(r.cx - r.half);
      const right = Math.round(r.cx + r.half);
      const s = r.surface;
      // Sides
      if (s === "coast") {
        ctx.fillStyle = SIDE.coast;
        ctx.fillRect(0, y, left, 2);
        ctx.fillStyle = "#1a4fb8";
        ctx.fillRect(right, y, W - right, 2);
        ctx.fillStyle = "#e9d49a";
        ctx.fillRect(right, y, 6, 2);
      } else {
        ctx.fillStyle = SIDE[s];
        ctx.fillRect(0, y, left, 2);
        ctx.fillRect(right, y, W - right, 2);
      }
      if (s === "city") {
        ctx.fillStyle = "#6a6f88";
        ctx.fillRect(left - 8, y, 8, 2);
        ctx.fillRect(right, y, 8, 2);
      }
      // Road / river
      ctx.fillStyle = ROAD[s];
      ctx.fillRect(left, y, right - left, 2);
      const band = Math.floor(wy / 8);
      if (s === "water") {
        ctx.fillStyle = "#9fd8ff";
        ctx.fillRect(left, y, 2, 2);
        ctx.fillRect(right - 2, y, 2, 2);
        if (hash(band * 7 + 1) > 0.7) {
          ctx.fillStyle = "#3f86ec";
          const wx = left + Math.floor(hash(band) * (right - left - 10));
          ctx.fillRect(wx, y, 6, 1);
        }
      } else {
        ctx.fillStyle = s === "city" && band % 2 === 0 ? "#e3262f" : "#f2f4ff";
        ctx.fillRect(left, y, 2, 2);
        ctx.fillRect(right - 2, y, 2, 2);
      }
      // Centre line or lane lines
      if (r.f < 0.5) {
        if (Math.floor(wy / 14) % 2 === 0) {
          ctx.fillStyle = s === "water" ? "#cfe8ff" : "#ffd23f";
          ctx.fillRect(Math.round(r.cx) - 1, y, 2, 2);
        }
      } else if (Math.floor(wy / 12) % 2 === 0) {
        ctx.fillStyle = s === "water" ? "#cfe8ff" : "#f2f4ff";
        for (let i = 1; i < 4; i++) ctx.fillRect(Math.round(left + ((right - left) * i) / 4) - 1, y, 2, 2);
      }
      // Dock where land meets water
      for (const z of sim.zones) {
        if (Math.abs(wy - z.from) < 5) {
          ctx.fillStyle = Math.floor(wy) % 3 === 0 ? "#5a3a1b" : "#8a5a2b";
          ctx.fillRect(left, y, right - left, 2);
        }
      }
    }
  }

  private scenery(sim: PursuitSim) {
    const ctx = this.ctx;
    const top = sim.dist + PLAYER_Y + 40;
    const bottom = sim.dist - (H - PLAYER_Y) - 40;
    const step = 36;
    for (let b = Math.floor(bottom / step); b <= Math.floor(top / step); b++) {
      const wy = b * step;
      const y = Math.round(sim.sy(wy));
      const r = sim.roadAt(wy);
      const left = r.cx - r.half;
      const right = r.cx + r.half;
      for (const side of [0, 1]) {
        const h = hash(b * 2 + side);
        const room = side === 0 ? left - 12 : W - right - 12;
        if (room < 10) continue;
        if (r.surface === "city") {
          const bw = Math.min(room, 14 + Math.floor(h * 30));
          const bh = 22 + Math.floor(hash(b * 5 + side) * 10);
          const x = side === 0 ? left - 10 - bw : right + 10;
          const cols = ["#2a3168", "#3a2a68", "#1f3f5f", "#4a2440"];
          ctx.fillStyle = cols[Math.floor(h * 4)];
          ctx.fillRect(Math.round(x), y - bh, Math.round(bw), bh - 3);
          ctx.fillStyle = "#11131f";
          ctx.fillRect(Math.round(x), y - 3, Math.round(bw), 2);
          for (let wx = 3; wx < bw - 3; wx += 5) {
            for (let wy2 = 4; wy2 < bh - 6; wy2 += 6) {
              ctx.fillStyle = hash(b * 31 + wx * 7 + wy2) > 0.45 ? "#ffd23f" : "#1c2450";
              ctx.fillRect(Math.round(x + wx), y - bh + wy2, 2, 3);
            }
          }
        } else if (r.surface === "coast") {
          if (side === 0 && h > 0.35) {
            const x = Math.round(left - 14 - h * Math.max(0, room - 14));
            this.tree(x, y, "#2fae5a", "#1e7e3e");
          } else if (side === 1 && h > 0.5) {
            ctx.fillStyle = "#e9f2ff";
            const x = Math.round(right + 10 + h * Math.max(0, room - 12));
            ctx.fillRect(x, y, 7, 1);
            ctx.fillRect(x + 2, y + 1, 4, 1);
          }
        } else if (h > 0.3) {
          const x = side === 0 ? Math.round(left - 12 - h * Math.max(0, room - 10)) : Math.round(right + 6 + h * Math.max(0, room - 10));
          this.tree(x, y, "#3fbf5a", "#1e6e2e");
        }
      }
    }
  }

  private tree(x: number, y: number, light: string, dark: string) {
    const ctx = this.ctx;
    ctx.fillStyle = dark;
    ctx.fillRect(x - 4, y - 3, 9, 7);
    ctx.fillRect(x - 3, y - 5, 7, 11);
    ctx.fillStyle = light;
    ctx.fillRect(x - 3, y - 3, 6, 5);
    ctx.fillRect(x - 1, y - 4, 3, 2);
  }

  /** Lane tints and the big lane numbers painted on the road before the gates. */
  private laneMarks(sim: PursuitSim, c: Checkpoint) {
    const ctx = this.ctx;
    const gy = sim.sy(c.gateWy);
    const y0 = Math.max(0, Math.round(gy));
    const y1 = Math.min(H, Math.round(sim.sy(c.gateWy - 240)));
    if (y1 <= 0 || y0 >= H) return;
    ctx.globalAlpha = 0.16;
    for (let i = 0; i < 4; i++) {
      ctx.fillStyle = LANE_COLORS[i];
      ctx.fillRect(GATE_LEFT + i * LANE_W + 3, y0, LANE_W - 6, y1 - y0);
    }
    ctx.globalAlpha = 1;
    const ny = sim.sy(c.gateWy - 120);
    if (ny > -20 && ny < H + 4) {
      for (let i = 0; i < 4; i++) this.text(String(i + 1), laneCenter(i), ny - 10, LANE_COLORS[i], 3, 0.5, false);
    }
  }

  /** The gantry of answer signs over the 4 lanes. Drawn over the cars. */
  private gate(sim: PursuitSim, c: Checkpoint) {
    const q = c.q;
    if (!q) return;
    const ctx = this.ctx;
    const gy = Math.round(sim.sy(c.gateWy));
    if (gy < -16 || gy > H + 20) return;
    // Posts
    ctx.fillStyle = "#11131f";
    for (let i = 0; i <= 4; i++) ctx.fillRect(GATE_LEFT + i * LANE_W - 2, gy - 12, 4, 16);
    ctx.fillStyle = "#6a6f88";
    ctx.fillRect(GATE_LEFT - 2, gy - 13, LANE_W * 4 + 4, 2);
    for (let i = 0; i < 4; i++) {
      const x = GATE_LEFT + i * LANE_W + 3;
      const w = LANE_W - 6;
      let border = LANE_COLORS[i];
      let fill = "#0b1240";
      if (c.correct !== null) {
        if (i === q.answer) {
          border = "#5fff8a";
          fill = "#0d3a22";
        } else if (i === c.picked) {
          border = "#ff5a5a";
          fill = "#3a0d12";
        }
      } else if (c.lock === i && Math.floor(sim.time * 6) % 2 === 0) {
        fill = "#1c2a90";
      }
      ctx.fillStyle = border;
      ctx.fillRect(x - 1, gy - 11, w + 2, 13);
      ctx.fillStyle = fill;
      ctx.fillRect(x, gy - 10, w, 11);
      // Number tab
      ctx.fillStyle = LANE_COLORS[i];
      ctx.fillRect(x - 1, gy - 19, 11, 9);
      this.text(String(i + 1), x + 4.5, gy - 18, LANE_TEXT_ON[i], 1, 0.5, false);
      this.text(q.choices[i], x + w / 2, gy - 8, "#f2f4ff", 1, 0.5, false);
    }
  }

  /* ------------------------------------------------------------ actors */

  private enemies(sim: PursuitSim, decals: boolean) {
    const ctx = this.ctx;
    const sp = this.sprites;
    for (const e of sim.enemies) {
      const isDecal = e.state === "splat" || e.kind === "oil" || e.kind === "log" || e.kind === "fuel";
      if (isDecal !== decals) continue;
      const x = sim.enemyX(e);
      const y = sim.sy(e.wy);
      if (y < -30 || y > H + 30) {
        if (e.kind === "tailer" && e.state === "live" && y > H && y < H + 60 && Math.floor(sim.time * 8) % 2 === 0) {
          this.text("!", x, H - 12, "#ff5a5a", 2);
        }
        continue;
      }
      if (e.state === "splat") {
        if (e.wy < -1e8) continue;
        ctx.drawImage(sp.GOO, Math.round(x - 8), Math.round(y - 4));
        continue;
      }
      const img = this.enemySprite(e);
      ctx.drawImage(img, Math.round(x - img.width / 2), Math.round(y - img.height / 2));
    }
  }

  private enemySprite(e: Enemy): HTMLCanvasElement {
    const sp = this.sprites;
    switch (e.kind) {
      case "oil": return sp.OIL;
      case "log": return sp.LOG;
      case "fuel": return sp.FUEL;
      case "bumper": return e.boat ? sp.SMUDGE_BOAT : sp.BUMPER;
      case "tailer": return e.boat ? sp.SMUDGE_BOAT : sp.TAILER;
      default: return e.boat ? sp.SMUDGE_BOAT : sp.SMUDGE;
    }
  }

  private shots(sim: PursuitSim) {
    const ctx = this.ctx;
    for (const s of sim.shots) {
      const y = Math.round(sim.sy(s.wy));
      const x = Math.round(s.x);
      ctx.fillStyle = "#7ff3ff";
      ctx.fillRect(x - 2, y - 1, 4, 3);
      ctx.fillStyle = "#f2f4ff";
      ctx.fillRect(x - 1, y - 2, 2, 5);
    }
  }

  private van(sim: PursuitSim) {
    const v = sim.van;
    if (!v) return;
    const img = this.sprites.VAN;
    let x: number;
    let y: number;
    if (v.mode === "deliver") {
      x = sim.x + v.side * 22;
      const t = v.t;
      // Rises from below, rides alongside, drops back.
      y = t < 1 ? H + 20 - (H + 20 - PLAYER_Y) * t : t < 2.4 ? PLAYER_Y : PLAYER_Y + (t - 2.4) * 90;
      if (y > H + 30) return;
      if (t > 1 && t < 1.6) {
        // Gadget crate sliding across
        const k = (t - 1) / 0.6;
        this.ctx.fillStyle = "#ffd23f";
        this.ctx.fillRect(Math.round(x - v.side * 22 * k) - 3, Math.round(y) - 3, 6, 6);
      }
    } else {
      x = v.x;
      y = 70 - v.t * 60;
      if (y < -30) return;
    }
    this.ctx.drawImage(img, Math.round(x - img.width / 2), Math.round(y - img.height / 2));
  }

  private player(sim: PursuitSim) {
    const ctx = this.ctx;
    if (sim.phase === "over") return;
    if (sim.invuln > 0 && sim.phase === "drive" && Math.floor(sim.time * 12) % 2 === 0) return;
    const img = sim.boat ? this.sprites.BOAT : this.sprites.CAR;
    const x = sim.x;
    const y = PLAYER_Y;
    if (sim.turbo > 0 && sim.phase === "drive") {
      ctx.fillStyle = Math.floor(sim.time * 20) % 2 ? "#ff8a1f" : "#ffd23f";
      ctx.fillRect(Math.round(x) - 3, y + 8, 2, 4 + Math.floor(Math.random() * 3));
      ctx.fillRect(Math.round(x) + 1, y + 8, 2, 4 + Math.floor(Math.random() * 3));
    }
    ctx.save();
    ctx.translate(Math.round(x), y);
    if (sim.spin > 0) ctx.rotate(sim.spin * 9);
    if (sim.phase === "crash") ctx.rotate(sim.crashT * 6);
    ctx.drawImage(img, -Math.floor(img.width / 2), -Math.floor(img.height / 2));
    ctx.restore();
    if (sim.shield) {
      ctx.strokeStyle = Math.floor(sim.time * 4) % 2 ? "#7ff3ff" : "#6ea0ff";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(Math.round(x) + 0.5, y + 0.5, 12, 0, Math.PI * 2);
      ctx.stroke();
    }
    if (sim.smoke > 0 && sim.phase === "drive") {
      ctx.globalAlpha = 0.45;
      ctx.fillStyle = "#c8ccdf";
      for (let i = 0; i < 6; i++) {
        const a = sim.time * 2 + i;
        ctx.fillRect(Math.round(x + Math.cos(a) * 22) - 4, Math.round(y + Math.sin(a * 1.3) * 26) - 3, 8, 6);
      }
      ctx.globalAlpha = 1;
    }
  }

  private fx(sim: PursuitSim) {
    const ctx = this.ctx;
    for (const f of sim.fx) {
      const y = sim.sy(f.wy);
      const k = f.t / 0.9;
      const col = f.kind === "goo" ? "#5fff8a" : f.kind === "splash" ? "#9fd8ff" : f.kind === "smoke" ? "#c8ccdf" : "#ffd23f";
      ctx.fillStyle = col;
      ctx.globalAlpha = 1 - k;
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2 + f.id;
        const rr = 4 + k * 16;
        ctx.fillRect(Math.round(f.x + Math.cos(a) * rr) - 1, Math.round(y + Math.sin(a) * rr) - 1, f.kind === "smoke" ? 4 : 2, f.kind === "smoke" ? 4 : 2);
      }
      ctx.globalAlpha = 1;
      if (f.kind === "spark" && f.t < 0.6) this.text("BONK!", f.x, y - 22, "#ffd23f", 1);
    }
  }

  private floaters(sim: PursuitSim) {
    for (const f of sim.floaters) this.text(f.text, f.x, sim.sy(f.wy) - 6, f.color, 1);
  }

  /* ------------------------------------------------------------ messages */

  private overlay(sim: PursuitSim, banner: Banner | null) {
    const ctx = this.ctx;
    if (sim.phase === "approach") {
      const q = sim.cp.q;
      const lines = q && hasGlyphs(q.prompt) ? wrap(q.prompt, W - 14) : null;
      if (lines && lines.length <= 3) {
        // The coded message across the top of the screen (also shown, larger, in the radio panel).
        const h = 13 + lines.length * 8;
        ctx.fillStyle = "rgba(5,8,24,0.86)";
        ctx.fillRect(0, 0, W, h);
        ctx.fillStyle = "#ffd23f";
        ctx.fillRect(0, h, W, 1);
        if (Math.floor(sim.time * 2.5) % 2 === 0) this.text("INCOMING CODE", 6, 3, "#ffd23f", 1, 0);
        this.text("STEER INTO THE RIGHT LANE", W - 6, 3, "#7ff3ff", 1, 1);
        lines.forEach((ln, i) => this.text(ln, W / 2, 12 + i * 8, "#f2f4ff", 1));
      } else if (Math.floor(sim.time * 2.5) % 2 === 0) {
        ctx.fillStyle = "rgba(5,8,24,0.75)";
        ctx.fillRect(W / 2 - 74, 3, 148, 11);
        this.text("CODE CHECKPOINT AHEAD", W / 2, 5, "#ffd23f", 1);
      }
      const c = sim.cp;
      const bandH = lines && lines.length <= 3 ? 14 + lines.length * 8 : 15;
      if (Number.isFinite(c.timeTotal) && !c.released) {
        // Countdown bar (NORMAL / SPEEDY) under the message: full until any read-aloud ends.
        const frac = Math.max(0, Math.min(1, c.timeLeft / c.timeTotal));
        ctx.fillStyle = "rgba(5,8,24,0.86)";
        ctx.fillRect(0, bandH, W, 4);
        ctx.fillStyle = frac > 0.5 ? "#5fff8a" : frac > 0.2 ? "#ffd23f" : "#ff5a5a";
        ctx.fillRect(1, bandH + 1, Math.round((W - 2) * frac), 2);
      }
      if (sim.waiting && c.lock === null) {
        const settling = c.settle > 0;
        const msg = settling ? `GOING THROUGH LANE ${laneAt(sim.x) + 1}…` : Number.isFinite(c.timeTotal) ? "PICK A LANE: 1-4, TAP OR STEER" : "TAKE YOUR TIME!";
        ctx.fillStyle = "rgba(5,8,24,0.78)";
        const w = textWidth(msg) * 1 + 10;
        ctx.fillRect(W / 2 - w / 2, 52, w, 12);
        this.text(msg, W / 2, 54, settling ? "#7ff3ff" : "#5fff8a", 1);
        if (!Number.isFinite(c.timeTotal) && !settling) {
          ctx.fillRect(W / 2 - 74, 64, 148, 11);
          this.text("PICK A LANE: 1-4 OR TAP", W / 2, 66, "#f2f4ff", 1);
        }
      }
      if (sim.cp.lock !== null) {
        // Arrow over the locked-in lane
        const lx = Math.round(laneCenter(sim.cp.lock));
        ctx.fillStyle = LANE_COLORS[sim.cp.lock];
        for (let i = 0; i < 5; i++) ctx.fillRect(lx - 5 + i, 42 + i, 11 - i * 2, 1);
      }
    }
    if (sim.phase === "drive" && sim.fuel <= 0 && Math.floor(sim.time * 3) % 2 === 0) this.text("OUT OF FUEL: GRAB A CAN!", W / 2, 22, "#ff8a1f", 1);
    else if (sim.phase === "drive" && sim.fuel < 25 && Math.floor(sim.time * 2) % 2 === 0) this.text("LOW FUEL", W / 2, 22, "#ff8a1f", 1);
    if (banner && banner.t > 0) {
      ctx.fillStyle = "rgba(5,8,24,0.8)";
      ctx.fillRect(0, 60, W, banner.sub ? 30 : 20);
      this.text(banner.text, W / 2, 65, banner.color, 2);
      if (banner.sub) this.text(banner.sub, W / 2, 80, "#7ff3ff", 1);
    }
  }
}

export { ZONE_NAMES };
