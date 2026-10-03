/*
 * The 320x200 scene renderer: a cached background per scene, its animated layer, up to three
 * cast sprites (idle bob, blinking, talking, moods on the face and in emote bubbles), plus the
 * library title, a speech bubble and full-screen banners ("THE END?").
 */
import { resolveMood } from "@/story/validate";
import type { CharId, Mood } from "@/story/roster";
import { EMOTES, faceRows } from "./face";
import { textWidth } from "./font";
import { C, Gfx, H, W } from "./gfx";
import { SCENE_PAINTERS } from "./scenes";
import { KEYS, SPRITES } from "./sprites";

export interface ViewCast {
  id: string;
  mood: string;
}

export interface ViewState {
  scene: string;
  cast: ViewCast[];
  /** Character whose line is being typed out (bobs and talks). */
  speaking: string | null;
  /** Draw the PAGE QUEST title (library hub). */
  title: boolean;
  bubble: { who: string; text: string } | null;
  banner: { text: string; sub?: string; color: string } | null;
}

const SCALE = 2;
export const SLOTS: Record<number, number[]> = { 0: [], 1: [160], 2: [104, 216], 3: [66, 160, 254] };

function wrap(text: string, max: number): string[] {
  const out: string[] = [];
  let line = "";
  for (const w of text.toUpperCase().split(/\s+/)) {
    if (line && (line + " " + w).length > max) {
      out.push(line);
      line = w;
    } else line = line ? `${line} ${w}` : w;
  }
  if (line) out.push(line);
  return out;
}

export class SceneView {
  private g: Gfx;
  private raf = 0;
  private last = 0;
  private t = Math.random() * 10;
  private moodSince = 0;
  private bgCache = new Map<string, HTMLCanvasElement>();
  paused = false;
  state: ViewState = { scene: "library", cast: [], speaking: null, title: false, bubble: null, banner: null };

  constructor(canvas: HTMLCanvasElement) {
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d")!;
    ctx.imageSmoothingEnabled = false;
    this.g = new Gfx(ctx);
  }

  set(s: Partial<ViewState>) {
    const moodKey = (st: ViewState) => st.scene + st.cast.map((c) => c.id + c.mood).join();
    const before = moodKey(this.state);
    this.state = { ...this.state, ...s };
    if (moodKey(this.state) !== before) this.moodSince = this.t;
    if (!this.raf) this.draw();
  }

  start() {
    if (this.raf) return;
    this.last = performance.now();
    const loop = (now: number) => {
      const dt = Math.max(0, Math.min(0.05, (now - this.last) / 1000));
      this.last = now;
      if (!this.paused) this.t += dt;
      this.draw();
      this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
  }

  stop() {
    cancelAnimationFrame(this.raf);
    this.raf = 0;
  }

  private background(id: string): HTMLCanvasElement {
    let c = this.bgCache.get(id);
    if (!c) {
      c = document.createElement("canvas");
      c.width = W;
      c.height = H;
      const ctx = c.getContext("2d")!;
      const g = new Gfx(ctx);
      const p = SCENE_PAINTERS[id as keyof typeof SCENE_PAINTERS];
      if (p) p.bg(g);
      else {
        g.rect(0, 0, W, H, C.navy);
        g.dither(0, 150, W, 50, C.navy, C.blue);
        g.text(`SCENE "${id.toUpperCase().slice(0, 24)}" ?`, 160, 60, C.lgray, 1, "center");
      }
      this.bgCache.set(id, c);
    }
    return c;
  }

  draw() {
    const { g, t } = this;
    const st = this.state;
    const painter = SCENE_PAINTERS[st.scene as keyof typeof SCENE_PAINTERS];
    if (painter?.back) {
      g.rect(0, 0, W, H, C.navy);
      painter.back(g, t);
    }
    g.ctx.drawImage(this.background(st.scene), 0, 0);
    painter?.anim?.(g, t);
    const floor = painter?.floor ?? 188;

    if (st.title) this.drawTitle();

    const cast = st.cast.filter((c) => c.id in SPRITES).slice(0, 3);
    const xs = SLOTS[cast.length];
    const heads: Record<string, [number, number]> = {};
    cast.forEach((c, i) => {
      const def = SPRITES[c.id as CharId];
      const mood = resolveMood(c.mood);
      const talking = st.speaking === c.id;
      const rows0 = def.rows;
      const h = rows0.length * SCALE;
      const frozen = mood === "frozen";
      let x = xs[i] - 8 * SCALE;
      let y = floor - h - (def.lift ?? 0);
      // Frozen characters hold perfectly still (no bob, no float, no talking hop).
      if (!frozen) {
        if (def.float || def.lift) y += Math.round(Math.sin(t * 2.2 + i) * 3);
        else if (talking) y -= Math.floor(t * 8) % 2 ? 3 : 0;
        else y -= Math.floor(t * 1.4 + i * 0.7) % 2 ? 1 : 0;
      }
      if (mood === "scared") x += Math.floor(t * 18) % 2;
      if (!frozen && talking && (def.float || def.lift)) y -= Math.floor(t * 8) % 2 ? 2 : 0;

      // shadow
      g.dither(xs[i] - 12, floor - 2, 24, 3, "#000000", "rgba(0,0,0,0)");

      const altRate = c.id === "cat" ? 1.2 : c.id === "zombie" ? 1.6 : c.id === "ghost" ? 3 : 6;
      const altFrame = def.alt ? Math.floor(t * altRate) % 2 === 1 : false;
      const blink = (t + i * 1.7) % 4 < 0.14;
      const rows = faceRows(def, altFrame, mood, blink, talking && Math.floor(t * 7) % 2 === 0);
      const flip = cast.length > 1 && i === cast.length - 1 && c.id !== "hero";
      if (c.id === "ghost") g.ctx.globalAlpha = 0.85;
      g.grid(rows, { ...KEYS, ...(def.colors ?? {}) }, x, y, SCALE, flip);
      g.ctx.globalAlpha = 1;
      // top of the visible sprite
      const top = rows.findIndex((r) => /[^.]/.test(r));
      if (frozen) this.iceBlock(x, y + Math.max(0, top) * SCALE - 3, 16 * SCALE, floor - (y + Math.max(0, top) * SCALE) + 1, t, i);
      heads[c.id] = [xs[i], y + Math.max(0, top) * SCALE];

      const since = t - this.moodSince;
      const showEmote = mood !== "normal" && (def.noFace || since < 4 || since % 8 < 1.6 || talking);
      if (showEmote) this.emote(mood, xs[i] + 10, y + Math.max(0, top) * SCALE - 14);
    });

    if (st.bubble && heads[st.bubble.who]) this.speech(st.bubble.text, heads[st.bubble.who]);
    if (st.banner) this.banner(st.banner);
  }

  private drawTitle() {
    const { g, t } = this;
    g.dither(64, 14, 192, 44, C.navy, "rgba(0,0,0,0)");
    g.rect(64, 14, 192, 1, C.sbYellow);
    g.rect(64, 57, 192, 1, C.sbYellow);
    const bob = Math.floor(t * 2) % 2;
    g.text("PAGE QUEST", 160, 20 + bob, C.sbYellow, 4, "center", C.sbRed);
    g.text("CO-AUTHORED BY SPIDERBEN10 (NZDO)", 160, 47, C.white, 1, "center", C.black);
  }

  /** A see-through block of ice around a frozen character, with frosty edges and a glint. */
  private iceBlock(x: number, y: number, w: number, h: number, t: number, i: number) {
    const { g } = this;
    const x0 = x - 4;
    const w0 = w + 8;
    g.ctx.globalAlpha = 0.28;
    g.rect(x0, y, w0, h, "#bfe9ff");
    g.ctx.globalAlpha = 0.45;
    g.dither(x0, y, w0, 3, "#ffffff", "rgba(0,0,0,0)");
    g.dither(x0, y, 2, h, "#dff6ff", "rgba(0,0,0,0)");
    g.dither(x0 + w0 - 2, y, 2, h, "#8fd3f4", "rgba(0,0,0,0)");
    g.ctx.globalAlpha = 1;
    g.rect(x0, y, w0, 1, "#dff6ff");
    g.rect(x0, y, 1, h, "#dff6ff");
    g.rect(x0 + w0 - 1, y, 1, h, "#5aa8d8");
    // frost crack lines
    g.line(x0 + 3, y + 6, x0 + 9, y + 14, "#ffffff");
    g.line(x0 + w0 - 4, y + h - 20, x0 + w0 - 10, y + h - 12, "#ffffff");
    // a slow glint that slides down the ice
    const k = ((t * 0.35 + i * 0.3) % 1.6) / 1.6;
    if (k < 1) {
      const gy = y + Math.round(k * (h - 6));
      g.rect(x0 + 2, gy, 2, 4, "#ffffff");
      g.px(x0 + 4, gy + 1, "#ffffff");
    }
    // twinkling crystals at the corners
    if (Math.floor(t * 2 + i) % 2) {
      g.px(x0 + w0 - 3, y + 2, "#ffffff");
      g.px(x0 + 2, y + h - 3, "#ffffff");
    }
  }

  private emote(mood: Mood, x: number, y: number) {
    if (mood === "normal") return;
    const e = EMOTES[mood];
    const { g } = this;
    y = Math.max(1, y);
    g.rect(x, y, 11, 10, C.black);
    g.rect(x + 1, y + 1, 9, 8, C.white);
    g.px(x + 1, y + 10, C.black);
    g.px(x + 2, y + 10, C.black);
    g.px(x, y + 11, C.black);
    g.grid(e.rows, { "#": e.color }, x + 3, y + 3 - 1 + 1, 1);
  }

  private speech(text: string, [hx, hy]: [number, number]) {
    const { g } = this;
    const lines = wrap(text, 26);
    const w = Math.max(...lines.map((l) => textWidth(l))) + 10;
    const h = lines.length * 8 + 6;
    let x = Math.round(hx - w / 2);
    x = Math.max(4, Math.min(W - w - 4, x));
    const y = Math.max(62, hy - h - 10);
    g.rect(x - 1, y - 1, w + 2, h + 2, C.black);
    g.rect(x, y, w, h, C.white);
    g.tri(hx - 4, y + h, hx + 4, y + h, hx, y + h + 7, C.black);
    g.tri(hx - 3, y + h - 1, hx + 3, y + h - 1, hx, y + h + 5, C.white);
    lines.forEach((l, i) => g.text(l, x + 5, y + 4 + i * 8, C.navy));
  }

  private banner(b: { text: string; sub?: string; color: string }) {
    const { g } = this;
    g.dither(0, 0, W, H, "rgba(0,0,0,0.85)", "rgba(0,0,0,0)");
    g.rect(0, 70, W, 60, "rgba(5,8,24,0.85)");
    g.text(b.text, 160, 80, b.color, 5, "center", C.black);
    if (b.sub) g.text(b.sub, 160, 116, C.white, 1, "center", C.black);
  }
}
