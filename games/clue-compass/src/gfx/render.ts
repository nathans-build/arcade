/*
 * The 320x200 screen: place scenes (witnesses, the IOU note, a landmark), the four pixel maps
 * with lettered destination pins, the travel animation, the brief, the catch and the title.
 * Everything is drawn on whole pixels with our own bitmap font, so it stays crisp when scaled.
 */
import { inRing, ncRegionAt, projFor, pinOf, DIR_WORD } from "@/chase/geo";
import { NC_OUTLINE, NC_RIVERS, NC_SOUNDS, US_OUTLINE, US_PEAKS, US_RIVERS, US_WATERS, WORLD_LAND, WORLD_RIVERS, WORLD_WATERS, type Ring } from "@/chase/outlines";
import type { MapId, Place } from "@/chase/types";
import { textWidth } from "./font";
import { C, Gfx, H, W, rnd } from "./gfx";
import { PAL, iconGrid } from "./icons";
import { HERO, HERO_COLORS, PERSON, PIP, PIP_COLORS, POCKET, POCKET_COLORS, personColors } from "./sprites";

export interface SceneWitness {
  heard: boolean;
}

export type View =
  | { kind: "title" }
  | { kind: "brief"; itemIcon: string; title: string }
  | {
      kind: "scene";
      place: Place;
      witnesses: SceneWitness[];
      focus: number;
      talking: number;
      /** Show Pocket's IOU sticky note (a new notebook entry here). */
      note: boolean;
      /** Dead end: only the friendly local stands here. */
      local: boolean;
      pocket: "none" | "caught" | "gone";
      itemIcon: string;
      seed: number;
    }
  | {
      kind: "map";
      map: MapId;
      here: Place;
      options: { place: Place; letter: string; tried: boolean }[];
      travel: { from: Place; to: Place; start: number; dur: number } | null;
      showNames: boolean;
      /** Every place on this map that should be drawn even when it is not a choice (the town's buildings). */
      backdrop: Place[];
      /** Latitude/longitude grid lines every 30° (world map, grades 9–12). */
      grid?: boolean;
    };

export interface Hud {
  title: string;
  charges: number | null;
  max: number | null;
}

export type Hit = { kind: "witness"; i: number } | { kind: "option"; id: string } | null;

const FLOOR = 186;
export const WITNESS_X = [128, 186, 244];
/** Four witnesses (a stop with a mixed-up witness, grades 9–12) stand a little closer together. */
const WITNESS_X4 = [112, 158, 204, 250];
export function witnessX(i: number, n: number): number {
  return n > 3 ? WITNESS_X4[i] : WITNESS_X[i];
}

function upper(s: string) {
  return s.toUpperCase().replace(/[“”]/g, '"').replace(/[‘’]/g, "'").replace(/—/g, "-");
}

export class Screen {
  g: Gfx;
  t = 0;
  view: View = { kind: "title" };
  hud: Hud | null = null;
  paused = false;
  speed = 1;
  private raf = 0;
  private last = 0;
  private mapCache = new Map<MapId, HTMLCanvasElement>();
  private tagRects: { id: string; x: number; y: number; w: number; h: number }[] = [];
  onTravelDone: (() => void) | null = null;

  constructor(canvas: HTMLCanvasElement) {
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d")!;
    ctx.imageSmoothingEnabled = false;
    this.g = new Gfx(ctx);
  }

  set(v: View, hud?: Hud | null) {
    this.view = v;
    if (hud !== undefined) this.hud = hud;
    if (!this.raf) this.draw();
  }

  start() {
    if (this.raf) return;
    this.last = performance.now();
    const loop = (now: number) => {
      const dt = Math.max(0, Math.min(0.05, (now - this.last) / 1000));
      this.last = now;
      if (!this.paused) this.t += dt * this.speed;
      this.draw();
      this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
  }

  stop() {
    cancelAnimationFrame(this.raf);
    this.raf = 0;
  }

  /** What is under a canvas point (in 320x200 units). */
  hit(x: number, y: number): Hit {
    const v = this.view;
    if (v.kind === "scene" && !v.local && v.pocket === "none") {
      for (let i = 0; i < v.witnesses.length; i++) {
        const wx = witnessX(i, v.witnesses.length);
        if (x >= wx - 18 && x <= wx + 18 && y >= FLOOR - 52 && y <= FLOOR + 4) return { kind: "witness", i };
      }
    }
    if (v.kind === "map" && !v.travel) {
      for (const r of this.tagRects) if (x >= r.x - 3 && x <= r.x + r.w + 3 && y >= r.y - 3 && y <= r.y + r.h + 3) return { kind: "option", id: r.id };
      // or the nearest pin within 10 px
      let best: Hit = null;
      let bd = 10;
      for (const o of v.options) {
        const [px, py] = pinOf(o.place);
        const d = Math.hypot(px - x, py - y);
        if (d < bd && !o.tried) {
          bd = d;
          best = { kind: "option", id: o.place.id };
        }
      }
      return best;
    }
    return null;
  }

  // ------------------------------------------------------------------ frame
  draw() {
    const v = this.view;
    const g = this.g;
    g.rect(0, 0, W, H, C.navy);
    if (v.kind === "title") this.drawTitle();
    else if (v.kind === "brief") this.drawBrief(v);
    else if (v.kind === "scene") this.drawScene(v);
    else this.drawMap(v);
    if (this.hud && v.kind !== "title") this.drawHud(this.hud);
  }

  private drawHud(h: Hud) {
    const g = this.g;
    g.rect(0, 0, W, 11, "rgba(5,8,24,0.86)");
    g.rect(0, 11, W, 1, C.sbBlue);
    const title = upper(h.title).slice(0, 38);
    g.text(title, 4, 3, C.sbYellow);
    if (h.charges === null) {
      g.text("CLOCK: NO RUSH", W - 4 - textWidth("CLOCK: NO RUSH"), 3, C.lcyan);
    } else {
      const max = h.max ?? h.charges;
      const n = Math.min(max, 24);
      const cells = Math.round((h.charges / Math.max(1, max)) * n);
      const bw = n * 3;
      const x0 = W - 4 - bw;
      for (let i = 0; i < n; i++) g.rect(x0 + i * 3, 3, 2, 5, i < cells ? (cells <= n / 4 ? C.sbRed : C.lcyan) : "#26336e");
      const lbl = `${h.charges}H`;
      g.text(lbl, x0 - 4 - textWidth(lbl), 3, cells <= n / 4 ? C.lred : C.white);
    }
  }

  // ------------------------------------------------------------------ title & brief
  private drawTitle() {
    const { g, t } = this;
    g.bands(0, 0, W, 120, ["#0a0f2e", "#101a4a", "#18266a"]);
    for (let i = 0; i < 40; i++) {
      const x = Math.floor(rnd(i) * W);
      const y = Math.floor(rnd(i + 50) * 110);
      if ((Math.floor(t * 2 + i) % 7) !== 0) g.px(x, y, i % 3 ? "#8090d0" : C.white);
    }
    g.rect(0, 120, W, 80, "#1f6b2a");
    g.dither(0, 120, W, 6, "#1f6b2a", "#3cb043");
    this.compassRose(160, 92, 20, t * 0.6);
    const bob = Math.floor(t * 2) % 2;
    g.text("CLUE COMPASS", 160, 22 + bob, C.sbYellow, 3, "center", C.sbRed);
    g.text("A GEOGRAPHY DETECTIVE CHASE", 160, 48, C.white, 1, "center", C.black);
    g.text("CREATED BY SPIDERBEN10 (NZDO)", 160, 58, C.lcyan, 1, "center", C.black);
    g.grid(HERO, HERO_COLORS, 54, FLOOR - 38, 2);
    const px = 236 + Math.round(Math.sin(t * 1.5) * 20);
    g.grid(POCKET, POCKET_COLORS, px, FLOOR - 36 - (Math.floor(t * 4) % 2), 2);
    this.pip(108, 132 + Math.round(Math.sin(t * 3) * 4), 1);
  }

  private drawBrief(v: { itemIcon: string; title: string }) {
    const { g, t } = this;
    // detective HQ: a map wall, a desk, Pip on a perch
    g.rect(0, 12, W, H - 12, "#1c2460");
    g.dither(0, 12, W, H - 12, "#1c2460", "#222c70");
    g.rect(20, 24, 150, 96, "#c8a060");
    g.rect(22, 26, 146, 92, "#e8d8a8");
    for (let i = 0; i < 6; i++) g.line(30 + i * 24, 30, 40 + i * 22, 110, "#c8b080");
    g.circle(60, 60, 14, "#7ab060");
    g.circle(118, 84, 18, "#7ab060");
    g.circle(140, 48, 10, "#7ab060");
    for (let i = 0; i < 4; i++) g.circle(50 + i * 28, 50 + (i % 2) * 30, 2, C.sbRed);
    g.line(50, 50, 78, 80, C.sbRed);
    g.line(78, 80, 106, 50, C.sbRed);
    g.line(106, 50, 134, 80, C.sbRed);
    // missing item poster
    g.rect(196, 24, 100, 96, C.white);
    g.rect(198, 26, 96, 92, "#fff8e0");
    g.text("BORROWED!", 246, 30, C.sbRed, 1, "center");
    this.icon(v.itemIcon, 228, 42, 3);
    if (Math.floor(t * 2) % 2) g.text("?", 282, 64, C.sbRed, 3);
    g.text("IOU - POCKET", 246, 106, C.dgray, 1, "center");
    // floor + desk
    g.rect(0, 150, W, 50, "#3a1c08");
    g.dither(0, 150, W, 4, "#3a1c08", "#5a2e0e");
    g.rect(110, 140, 120, 10, "#8a5a2b");
    g.rect(116, 150, 6, 30, "#5a2e0e");
    g.rect(218, 150, 6, 30, "#5a2e0e");
    g.grid(HERO, HERO_COLORS, 48, FLOOR - 38, 2);
    this.pip(150, 120 + Math.round(Math.sin(t * 3) * 2), 2);
    this.compassRose(180, 132, 7, 0);
  }

  // ------------------------------------------------------------------ scenes
  private drawScene(v: Extract<View, { kind: "scene" }>) {
    const { g, t } = this;
    const p = v.place;
    this.background(p);
    if (p.mark && v.pocket === "none") this.icon(p.mark, 70, 48, 4);
    // hero
    g.dither(22, FLOOR - 1, 28, 3, "#000000", "rgba(0,0,0,0)");
    g.grid(HERO, HERO_COLORS, 20, FLOOR - 38 - (Math.floor(t * 1.4) % 2), 2);
    this.pip(56, 118 + Math.round(Math.sin(t * 3) * 3), 1);

    if (v.pocket !== "none") {
      // the catch (or the getaway)
      const x = v.pocket === "caught" ? 196 : 196 + ((t * 60) % 160);
      g.grid(POCKET, POCKET_COLORS, x, FLOOR - 36 - (Math.floor(t * 4) % 2), 2);
      this.icon(v.itemIcon, v.pocket === "caught" ? 160 : 150, FLOOR - 30, 2);
      const msg = v.pocket === "caught" ? "GOTCHA, POCKET!" : "POCKET ZIPPED AWAY!";
      g.rect(0, 26, W, 22, "rgba(5,8,24,0.8)");
      g.text(msg, 160, 30, v.pocket === "caught" ? C.sbYellow : C.lred, 2, "center", C.black);
    } else if (v.local) {
      const x = WITNESS_X[1];
      g.dither(x - 10, FLOOR - 1, 20, 3, "#000000", "rgba(0,0,0,0)");
      g.grid(PERSON, personColors(v.seed + 99), x - 12, FLOOR - 40 - (Math.floor(t * 6) % 2), 2);
      this.bubble(x + 10, FLOOR - 62, "NOT HERE!", C.sbRed);
    } else {
      v.witnesses.forEach((w, i) => {
        const x = witnessX(i, v.witnesses.length);
        const talking = v.talking === i;
        g.dither(x - 10, FLOOR - 1, 20, 3, "#000000", "rgba(0,0,0,0)");
        const bob = talking ? (Math.floor(t * 8) % 2) * 2 : Math.floor(t * 1.2 + i) % 2;
        g.grid(PERSON, personColors(v.seed * 7 + i * 13), x - 12, FLOOR - 40 - bob, 2, i > 0);
        if (v.focus === i) {
          const ay = FLOOR - 66 + (Math.floor(t * 4) % 2);
          g.tri(x - 4, ay, x + 4, ay, x, ay + 5, C.sbYellow);
        }
        const mark = w.heard ? "✔" : "?";
        this.bubble(x + 8, FLOOR - 58, mark, w.heard ? C.green : C.sbBlue);
        g.rect(x - 22, FLOOR - 60, 9, 9, C.black);
        g.text(String(i + 1), x - 20, FLOOR - 58, C.sbYellow);
      });
    }
    if (v.note) this.stickyNote(270, 20);
    // place name strip
    const name = upper(p.name.replace(/^the /i, ""));
    g.rect(0, H - 8, W, 8, "rgba(5,8,24,0.75)");
    g.text(name, 160, H - 7, C.white, 1, "center");
  }

  private stickyNote(x: number, y: number) {
    const { g, t } = this;
    const wob = Math.floor(t * 2) % 2;
    g.rect(x + 2, y + 2, 40, 30, "rgba(0,0,0,0.4)");
    g.rect(x, y + wob, 40, 30, C.sbYellow);
    g.rect(x, y + wob, 40, 4, "#e8b820");
    g.text("IOU", x + 20, y + 8 + wob, C.sbRed, 2, "center");
    g.text("POCKET", x + 20, y + 22 + wob, C.navy, 1, "center");
  }

  private bubble(x: number, y: number, text: string, color: string) {
    const g = this.g;
    const w = textWidth(text) + 8;
    g.rect(x - 1, y - 1, w + 2, 11, C.black);
    g.rect(x, y, w, 9, C.white);
    g.tri(x + 2, y + 9, x + 7, y + 9, x + 1, y + 13, C.white);
    g.text(text, x + 4, y + 2, color);
  }

  pip(x: number, y: number, scale: number) {
    const frame = PIP[Math.floor(this.t * 6) % 2];
    this.g.grid(frame, PIP_COLORS, x, y, scale);
  }

  /** Draw any icon id at (x, y) with a pixel scale. */
  icon(id: string, x: number, y: number, scale: number) {
    paintIcon(this.g, id, x, y, scale);
  }

  // ------------------------------------------------------------------ backgrounds
  private background(p: Place) {
    const g = this.g;
    const k = p.scene;
    const sky = (cols: string[]) => g.bands(0, 12, W, 160, cols);
    const groundY = 140;
    const town = ["school", "library", "fire", "park", "bakery", "post", "grocery", "farm", "police", "clinic"];
    if (town.includes(k)) {
      sky(["#4a7ae8", "#6ea0ff", "#9ac0ff"]);
      g.rect(0, groundY, W, H - groundY, "#3cb043");
      g.rect(0, groundY + 14, W, 12, "#777a88");
      g.dither(0, groundY + 14, W, 2, "#777a88", "#999caa");
      this.townBuilding(p);
      return;
    }
    const peaks = (col: string, snow: boolean, base: number, n: number, hgt: number, seed: number) => {
      for (let i = 0; i < n; i++) {
        const cx = (i + 0.5) * (W / n) + (rnd(seed + i) - 0.5) * 30;
        const h = hgt * (0.6 + rnd(seed + i + 9) * 0.5);
        g.tri(cx - h * 1.2, base, cx + h * 1.2, base, cx, base - h, col);
        if (snow) g.tri(cx - h * 0.25, base - h * 0.8, cx + h * 0.25, base - h * 0.8, cx, base - h, C.white);
      }
    };
    const water = (y: number) => {
      g.rect(0, y, W, H - y, "#1a4aa8");
      for (let i = 0; i < 30; i++) {
        const x = (rnd(i * 3) * W + this.t * 6 * (i % 3 ? 1 : -1)) % W;
        g.rect(Math.floor((x + W) % W), y + 4 + Math.floor(rnd(i * 5) * (H - y - 8)), 6, 1, "#6ea0ff");
      }
    };
    const skyline = (y: number, col: string) => {
      for (let i = 0; i < 14; i++) {
        const bw = 14 + Math.floor(rnd(i + 3) * 12);
        const bh = 30 + Math.floor(rnd(i + 7) * 60);
        const bx = i * 24 - 6;
        g.rect(bx, y - bh, bw, bh, col);
        for (let wy = y - bh + 4; wy < y - 4; wy += 6) for (let wx = bx + 3; wx < bx + bw - 3; wx += 5) if (rnd(wx * 7 + wy) > 0.45) g.rect(wx, wy, 2, 2, "#ffd23f");
      }
    };
    switch (k) {
      case "mountains":
      case "peak":
      case "gorge":
        sky(["#5a8ae8", "#8ab0ff", "#c0d8ff"]);
        peaks("#5a6a8a", true, 140, 4, k === "peak" ? 110 : 80, 1);
        peaks("#2f6a3a", false, 150, 6, 50, 5);
        g.rect(0, 148, W, H - 148, "#2f7a3a");
        if (k === "gorge") water(160);
        break;
      case "river":
        sky(["#5a8ae8", "#8ab0ff", "#c0d8ff"]);
        peaks("#3a7a4a", false, 140, 5, 40, 3);
        g.rect(0, 136, W, H - 136, "#3c9a43");
        g.rect(0, 150, W, 18, "#2a6ad0");
        g.dither(0, 150, W, 2, "#2a6ad0", "#6ea0ff");
        break;
      case "city":
      case "campus":
      case "capitol":
      case "village":
      case "palace":
        sky(k === "city" ? ["#2a3a8a", "#4a6ae8", "#8ab0ff"] : ["#5a8ae8", "#8ab0ff", "#c0d8ff"]);
        if (k === "city") skyline(150, "#2a3060");
        else {
          for (let i = 0; i < 6; i++) {
            const bx = i * 56 + 4;
            const col = k === "village" ? "#c87a4a" : k === "campus" ? "#a85a3a" : "#d8d0c0";
            g.rect(bx, 104, 44, 46, col);
            g.tri(bx - 2, 104, bx + 46, 104, bx + 22, 88, k === "village" ? "#7a3a1a" : "#555a6a");
            for (let w = 0; w < 3; w++) g.rect(bx + 6 + w * 13, 114, 6, 8, "#2a3060");
          }
        }
        g.rect(0, 150, W, H - 150, "#555a6a");
        g.dither(0, 150, W, 2, "#555a6a", "#777a88");
        break;
      case "port":
      case "harbor":
      case "bay":
      case "lake":
        sky(["#5a8ae8", "#8ab0ff", "#c0d8ff"]);
        if (k === "port") for (let i = 0; i < 4; i++) g.rect(180 + i * 30, 70, 4, 70, "#e3262f");
        g.rect(0, 130, W, 10, "#7a7a8a");
        water(140);
        g.rect(0, 160, 110, H - 160, "#8a5a2b");
        g.dither(0, 160, 110, 2, "#8a5a2b", "#d8a060");
        break;
      case "dunes":
      case "lighthouse":
      case "ocean":
        sky(["#4a7ae8", "#6ea0ff", "#b0d0ff"]);
        water(118);
        if (k !== "ocean") {
          g.poly([[0, 200], [0, 130], [60, 120], [140, 135], [220, 112], [320, 128], [320, 200]], "#e8c878");
          g.dither(0, 150, W, 2, "#e8c878", "#d8a060");
        }
        break;
      case "canyon":
      case "desert":
      case "adobe":
        sky(["#e87a4a", "#f0a060", "#ffd090"]);
        if (k === "canyon") {
          g.rect(0, 80, W, 120, "#b05a2a");
          for (let i = 0; i < 6; i++) g.rect(0, 90 + i * 12, W, 3, i % 2 ? "#8a3a1a" : "#d8804a");
          g.poly([[110, 200], [140, 120], [180, 120], [210, 200]], "#5a2a10");
          g.rect(150, 150, 20, 50, "#2a6ad0");
        } else {
          g.rect(0, 136, W, H - 136, "#e8b878");
          g.dither(0, 136, W, 3, "#e8b878", "#d89858");
          if (k === "adobe") for (let i = 0; i < 4; i++) g.rect(150 + i * 42, 104, 36, 32, "#c87a4a");
        }
        break;
      case "geyser":
      case "plains":
      case "savanna":
      case "outback":
        sky(k === "outback" ? ["#e87a4a", "#f0a060", "#ffd090"] : ["#5a8ae8", "#8ab0ff", "#c0d8ff"]);
        g.rect(0, 130, W, H - 130, k === "outback" ? "#c8642a" : k === "savanna" ? "#c8a040" : "#5aa040");
        g.dither(0, 130, W, 3, k === "outback" ? "#c8642a" : "#5aa040", "#d8a060");
        if (k === "savanna") for (let i = 0; i < 3; i++) {
          g.rect(220 + i * 36, 110, 3, 22, "#5a2e0e");
          g.ellipse(221 + i * 36, 108, 14, 4, "#2f6a3a");
        }
        break;
      case "rainforest":
      case "swamp":
        sky(["#2a5a3a", "#3a7a4a", "#5a9a5a"]);
        for (let i = 0; i < 12; i++) g.circle(i * 30, 60 + (i % 3) * 14, 26, i % 2 ? "#1f6b2a" : "#2f8a3a");
        g.rect(0, 140, W, H - 140, k === "swamp" ? "#3a6a5a" : "#2f6a3a");
        if (k === "swamp") water(158);
        break;
      case "ice":
        sky(["#8ab0ff", "#c0d8ff", "#e8f0ff"]);
        g.poly([[0, 200], [0, 130], [90, 110], [170, 128], [250, 106], [320, 124], [320, 200]], C.white);
        g.dither(0, 150, W, 3, C.white, "#c0d8ff");
        break;
      case "quarry":
      case "mine":
        sky(["#5a8ae8", "#8ab0ff", "#c0d8ff"]);
        peaks("#7a7a8a", false, 140, 4, 50, 8);
        g.rect(0, 136, W, H - 136, k === "quarry" ? "#a8aec0" : "#8a5a2b");
        g.dither(0, 136, W, 3, "#a8aec0", "#7a7a8a");
        if (k === "mine") {
          g.rect(220, 96, 60, 44, "#5a2e0e");
          g.rect(232, 108, 36, 32, C.black);
        }
        break;
      default:
        sky(["#5a8ae8", "#8ab0ff", "#c0d8ff"]);
        g.rect(0, 140, W, H - 140, "#3cb043");
    }
  }

  private townBuilding(p: Place) {
    const g = this.g;
    const look: Record<string, [string, string]> = {
      school: ["#c84a3a", "#7a2a1a"], library: ["#8a6a9a", "#4a2a5a"], fire: ["#e3262f", "#7a1a1a"], post: ["#2456e8", "#1a2a6a"],
      grocery: ["#3cb043", "#1f6b2a"], bakery: ["#ff9ac8", "#c8507a"], police: ["#2a3a8a", "#151d4a"], clinic: ["#f2f4ff", "#a8aec0"],
      farm: ["#c83a2a", "#f2f4ff"], park: ["#3cb043", "#3cb043"],
    };
    const [wall, roof] = look[p.scene] ?? ["#aaaaaa", "#555555"];
    const thing = p.facts.find((f) => f.k === "thing")?.icon;
    if (p.scene === "park") {
      for (let i = 0; i < 5; i++) {
        g.rect(16 + i * 66, 96, 4, 44, "#5a2e0e");
        g.circle(18 + i * 66, 90, 14, "#1f6b2a");
      }
      if (thing) this.icon(thing, 220, 70, 5);
      return;
    }
    if (p.scene === "farm") {
      g.rect(170, 70, 110, 70, wall);
      g.tri(162, 70, 288, 70, 225, 36, "#7a1a1a");
      g.rect(210, 100, 30, 40, roof);
      g.line(210, 100, 240, 140, wall);
      g.line(240, 100, 210, 140, wall);
      for (let i = 0; i < 10; i++) g.rect(i * 32, 126, 2, 14, "#f2f4ff");
      g.rect(0, 128, W, 2, "#f2f4ff");
      if (thing) this.icon(thing, 96, 96, 3);
      return;
    }
    g.rect(150, 60, 160, 80, wall);
    g.rect(146, 54, 168, 8, roof);
    for (let i = 0; i < 3; i++) g.rect(160 + i * 50, 76, 22, 18, "#9ac0ff");
    g.rect(212, 106, 30, 34, roof);
    const sign = upper(p.name.replace(/^the /i, ""));
    g.rect(170, 40, 120, 12, C.white);
    g.text(sign, 230, 44, C.navy, 1, "center");
    if (thing) this.icon(thing, 92, 90, 3);
  }

  // ------------------------------------------------------------------ maps
  private baseMap(map: MapId): HTMLCanvasElement {
    let c = this.mapCache.get(map);
    if (c) return c;
    c = document.createElement("canvas");
    c.width = W;
    c.height = H;
    const ctx = c.getContext("2d")!;
    const g = new Gfx(ctx);
    const pr = projFor(map);
    const sea = "#1f4fae";
    g.rect(0, 0, W, H, sea);
    g.dither(0, 0, W, H, sea, "#2456b8");
    if (map === "town") {
      this.paintTown(g);
    } else {
      const img = ctx.getImageData(0, 0, W, H);
      const put = (x: number, y: number, hex: string) => {
        const i = (y * W + x) * 4;
        img.data[i] = parseInt(hex.slice(1, 3), 16);
        img.data[i + 1] = parseInt(hex.slice(3, 5), 16);
        img.data[i + 2] = parseInt(hex.slice(5, 7), 16);
        img.data[i + 3] = 255;
      };
      for (let y = 12; y < H; y++) {
        for (let x = 0; x < W; x++) {
          const [lon, lat] = pr.inv(x + 0.5, y + 0.5);
          const chk = (x + y) % 2 === 0;
          if (map === "nc") {
            if (!inRing(lon, lat, NC_OUTLINE)) {
              // neighbors: a dull land color north/west/south of NC, sea to the east
              const neighbor = lat > 36.54 ? lon < -75.95 : lat > 33.86 + 0.694 * (lon + 78.54) && lon < -76.5;
              if (neighbor) put(x, y, chk ? "#3a4a3a" : "#3e4e3e");
              continue;
            }
            if (NC_SOUNDS.some((r) => inRing(lon, lat, r))) {
              put(x, y, chk ? "#3a6ad0" : "#3666c8");
              continue;
            }
            const reg = ncRegionAt(lat, lon);
            const col = reg === "Mountains" ? (chk ? "#7a6a4a" : "#74644a") : reg === "Piedmont" ? (chk ? "#3f9a4a" : "#3c9446") : chk ? "#c8c070" : "#c2ba6a";
            put(x, y, col);
          } else if (map === "us") {
            if (!inRing(lon, lat, US_OUTLINE)) {
              if (lat > 45 || (lat < 32 && lon < -97 && lon > -117)) put(x, y, chk ? "#3a4a3a" : "#3e4e3e");
              continue;
            }
            if (US_WATERS.some((w) => inRing(lon, lat, w.ring))) {
              put(x, y, chk ? "#3a6ad0" : "#3666c8");
              continue;
            }
            const desert = lon < -103 && lat < 37 && lon > -117;
            put(x, y, desert ? (chk ? "#c8a060" : "#c29a5a") : lon < -104 ? (chk ? "#6a8a4a" : "#668646") : chk ? "#3f9a4a" : "#3c9446");
          } else {
            const land = WORLD_LAND.find((l) => inRing(lon, lat, l.ring));
            if (!land) continue;
            if (WORLD_WATERS.some((r) => inRing(lon, lat, r))) {
              put(x, y, "#3a6ad0");
              continue;
            }
            const col =
              land.continent === "Antarctica" || lat > 72 || (land.name === "Greenland")
                ? chk ? "#f2f4ff" : "#dfe6ff"
                : Math.abs(lat) < 12 ? (chk ? "#2f8a3a" : "#2c8436")
                : lat > 15 && lat < 32 && lon > -18 && lon < 60 ? (chk ? "#d8b870" : "#d2b26a")
                : chk ? "#4aa04a" : "#46984a";
            put(x, y, col);
          }
        }
      }
      ctx.putImageData(img, 0, 0);
      const line = (ring: Ring, col: string) => {
        for (let i = 0; i + 1 < ring.length; i++) {
          const [x0, y0] = pr.ll(ring[i][0], ring[i][1]);
          const [x1, y1] = pr.ll(ring[i + 1][0], ring[i + 1][1]);
          g.line(x0, y0, x1, y1, col);
        }
      };
      if (map === "nc") for (const r of NC_RIVERS) line(r.line, "#4a8ae8");
      if (map === "us") {
        for (const r of US_RIVERS) line(r.line, "#4a8ae8");
        for (const [lon, lat] of US_PEAKS) {
          const [x, y] = pr.ll(lon, lat);
          g.tri(x - 3, y + 2, x + 3, y + 2, x, y - 3, "#8a7a5a");
          g.px(x, y - 3, C.white);
        }
      }
      if (map === "world") for (const r of WORLD_RIVERS) line(r.line, "#4a8ae8");
    }
    this.mapCache.set(map, c);
    return c;
  }

  private paintTown(g: Gfx) {
    const pr = projFor("town");
    const b = pr.box;
    g.rect(b.x, b.y, b.w, b.h, "#3cb043");
    g.dither(b.x, b.y, b.w, b.h, "#3cb043", "#44b84a");
    // streets between the rows and columns of the town grid
    for (const ty of [20, 40]) {
      const [, y] = pr.at([0, ty]);
      g.rect(b.x, y - 4, b.w, 8, "#777a88");
      for (let x = b.x; x < b.x + b.w; x += 12) g.rect(x, y, 6, 1, C.sbYellow);
    }
    for (const tx of [27, 50, 73]) {
      const [x] = pr.at([tx, 0]);
      g.rect(x - 4, b.y, 8, b.h, "#777a88");
    }
    // pond and trees
    g.ellipse(b.x + b.w * 0.33, b.y + b.h * 0.86, 14, 6, "#2a6ad0");
    for (let i = 0; i < 8; i++) g.circle(b.x + 8 + i * 37, b.y + b.h - 6, 4, "#1f6b2a");
  }

  private compassRose(cx: number, cy: number, r: number, spin: number) {
    const g = this.g;
    g.circle(cx, cy, r + 2, "#0a0f2e");
    g.circle(cx, cy, r, "#e8d8a8");
    const a = Math.sin(spin) * 0.15;
    const tip = (ang: number, len: number, col: string) => {
      const x = cx + Math.cos(ang + a) * len;
      const y = cy - Math.sin(ang + a) * len;
      const lx = cx + Math.cos(ang + a + Math.PI / 2) * (r / 4);
      const ly = cy - Math.sin(ang + a + Math.PI / 2) * (r / 4);
      const rx = cx + Math.cos(ang + a - Math.PI / 2) * (r / 4);
      const ry = cy - Math.sin(ang + a - Math.PI / 2) * (r / 4);
      g.tri(lx, ly, rx, ry, x, y, col);
    };
    tip(Math.PI / 2, r - 1, C.sbRed);
    tip(-Math.PI / 2, r - 1, C.navy);
    tip(0, r - 3, C.navy);
    tip(Math.PI, r - 3, C.navy);
    if (r >= 9) {
      g.text("N", cx - 1, cy - r - 8, C.white, 1);
      g.text("S", cx - 1, cy + r + 3, C.white, 1);
      g.text("E", cx + r + 3, cy - 2, C.white, 1);
      g.text("W", cx - r - 8, cy - 2, C.white, 1);
    }
  }

  private drawMap(v: Extract<View, { kind: "map" }>) {
    const { g, t } = this;
    g.ctx.drawImage(this.baseMap(v.map), 0, 0);
    const pr = projFor(v.map);
    if (v.grid && v.map === "world") this.graticule();
    // compass rose (bottom-left for world/us, top-right for NC/town)
    const rose = v.map === "nc" ? [30, 170] : v.map === "town" ? [300, 172] : v.map === "us" ? [298, 164] : [20, 156];
    this.compassRose(rose[0], rose[1], 9, 0);
    // map key for NC regions
    if (v.map === "nc") {
      const kx = 210;
      const ky = 150;
      g.rect(kx - 2, ky - 2, 108, 34, "rgba(5,8,24,0.75)");
      const rows: [string, string][] = [["#7a6a4a", "MOUNTAINS"], ["#3f9a4a", "PIEDMONT"], ["#c8c070", "COASTAL PLAIN"]];
      rows.forEach(([col, name], i) => {
        g.rect(kx + 2, ky + 2 + i * 10, 7, 6, col);
        g.text(name, kx + 13, ky + 3 + i * 10, C.white);
      });
    }
    // all town places as little buildings with icons
    const towns = v.map === "town";
    const pins = new Map<string, [number, number]>();
    for (const o of v.options) pins.set(o.place.id, pinOf(o.place));
    if (towns) {
      for (const o of v.backdrop) {
        const [x, y] = pinOf(o);
        g.rect(x - 9, y - 9, 18, 18, "#f2f4ff");
        g.rect(x - 8, y - 8, 16, 16, "#c8c0b0");
        const ic = o.facts.find((f) => f.k === "thing")?.icon;
        if (ic) this.icon(ic, x - 6, y - 6, 1);
      }
    }
    // the trail so far: you are here
    const [hx, hy] = pinOf(v.here);
    const blink = Math.floor(t * 3) % 2;
    // travel path
    if (v.travel) {
      const [ax, ay] = pinOf(v.travel.from);
      const [bx, by] = pinOf(v.travel.to);
      const k = Math.max(0, Math.min(1, (t - v.travel.start) / v.travel.dur));
      const steps = Math.max(2, Math.floor(Math.hypot(bx - ax, by - ay) / 3));
      for (let i = 0; i <= steps * k; i++) {
        const f = i / steps;
        const x = ax + (bx - ax) * f;
        const y = ay + (by - ay) * f - Math.sin(f * Math.PI) * 14;
        if (i % 2 === 0) g.rect(x, y, 2, 2, C.sbYellow);
      }
      const cx = ax + (bx - ax) * k;
      const cy = ay + (by - ay) * k - Math.sin(k * Math.PI) * 14;
      this.g.grid(PIP[Math.floor(t * 10) % 2], PIP_COLORS, cx - 6, cy - 6, 1);
      g.circle(bx, by, 2, C.sbYellow);
      if (k >= 1 && this.onTravelDone) {
        const cb = this.onTravelDone;
        this.onTravelDone = null;
        cb();
      }
      this.tagRects = [];
      this.youAreHere(ax, ay, blink);
      return;
    }
    // option tags with simple collision avoidance
    this.tagRects = [];
    const placed: { x: number; y: number; w: number; h: number }[] = [{ x: hx - 6, y: hy - 6, w: 12, h: 12 }];
    const cands: [number, number][] = towns ? [[0, -22], [12, -14], [-24, -14], [0, 12]] : [[0, -14], [6, -8], [-16, -8], [0, 6], [8, 2], [-18, 2], [10, -16], [-20, -16], [0, -24], [0, 14], [16, 10], [-22, 10]];
    for (const o of v.options) {
      const [px, py] = pins.get(o.place.id)!;
      const label = v.showNames ? `${o.letter} ${upper(o.place.name.replace(/^the /i, ""))}` : o.letter;
      const w = textWidth(label) + 6;
      const h = 9;
      let best: { x: number; y: number } | null = null;
      for (const [dx, dy] of cands) {
        const x = Math.round(px + dx - (dx === 0 ? w / 2 : dx < 0 ? w - 6 : 0));
        const y = Math.round(py + dy);
        if (x < 1 || x + w > W - 1 || y < 13 || y + h > H - 1) continue;
        const clash = placed.some((r) => x < r.x + r.w + 1 && x + w + 1 > r.x && y < r.y + r.h + 1 && y + h + 1 > r.y);
        if (!clash) {
          best = { x, y };
          break;
        }
      }
      if (!best) best = { x: Math.max(1, Math.min(W - w - 1, Math.round(px - w / 2))), y: Math.max(13, Math.round(py - 14)) };
      placed.push({ ...best, w, h });
      const cx = best.x + w / 2;
      const cy = best.y + h / 2;
      if (Math.hypot(cx - px, cy - py) > 9) g.line(px, py, cx, cy, C.white);
      g.rect(px - 2, py - 2, 5, 5, C.black);
      g.rect(px - 1, py - 1, 3, 3, o.tried ? C.dgray : C.sbRed);
      g.rect(best.x - 1, best.y - 1, w + 2, h + 2, C.black);
      g.rect(best.x, best.y, w, h, o.tried ? "#555a6a" : C.sbYellow);
      g.text(label, best.x + 3, best.y + 2, o.tried ? "#aaaaaa" : C.navy);
      if (o.tried) g.line(best.x, best.y + h / 2, best.x + w, best.y + h / 2, C.sbRed);
      if (!o.tried) this.tagRects.push({ id: o.place.id, x: best.x, y: best.y, w, h });
    }
    this.youAreHere(hx, hy, blink);
    void pr;
  }

  /** Dotted latitude/longitude lines every 30°, the equator and prime meridian brighter, with labels. */
  private graticule() {
    const g = this.g;
    const pr = projFor("world");
    const b = pr.box;
    for (let lat = -60; lat <= 60; lat += 30) {
      const [, y] = pr.ll(0, lat);
      const col = lat === 0 ? C.sbYellow : "#9ab4ff";
      for (let x = Math.ceil(b.x); x < b.x + b.w; x += lat === 0 ? 2 : 4) g.px(x, Math.round(y), col);
      const label = lat === 0 ? "0" : `${Math.abs(lat)}${lat > 0 ? "N" : "S"}`;
      const lw = textWidth(label);
      const lx = Math.round(b.x + b.w) - lw - 2;
      g.rect(lx - 1, Math.round(y) - 7, lw + 2, 7, "rgba(5,8,24,0.8)");
      g.text(label, lx, Math.round(y) - 6, col);
    }
    for (let lon = -150; lon <= 150; lon += 30) {
      const [x] = pr.ll(lon, 0);
      const col = lon === 0 ? C.sbYellow : "#9ab4ff";
      for (let y = Math.ceil(b.y); y < b.y + b.h; y += lon === 0 ? 2 : 4) g.px(Math.round(x), y, col);
      if (lon % 60 === 0) {
        const label = lon === 0 ? "0" : `${Math.abs(lon)}${lon > 0 ? "E" : "W"}`;
        const lw = textWidth(label);
        g.rect(Math.round(x) + 1, Math.round(b.y) + 1, lw + 2, 7, "rgba(5,8,24,0.8)");
        g.text(label, Math.round(x) + 2, Math.round(b.y) + 2, col);
      }
    }
  }

  private youAreHere(x: number, y: number, blink: number) {
    const g = this.g;
    g.circle(x, y, 4, C.black);
    g.circle(x, y, 3, blink ? C.white : C.sbBlue);
    g.px(x, y, C.sbRed);
  }
}

/** Draw any icon id (grids, "say:" bubbles, "arrow:" compass arrows) at (x, y). */
export function paintIcon(g: Gfx, id: string, x: number, y: number, scale: number) {
  if (id.startsWith("say:")) {
    const word = id.slice(4);
    const w = textWidth(word);
    const s = Math.max(1, Math.floor((12 * scale) / Math.max(12, w + 4)));
    const bw = (w + 4) * s;
    g.rect(x - 1, y - 1, bw + 2, 8 * s + 2, C.black);
    g.rect(x, y, bw, 8 * s, C.white);
    g.text(word, x + 2 * s, y + 1.5 * s, C.sbRed, s);
    return;
  }
  if (id.startsWith("arrow:")) {
    const d = id.slice(6) as "N" | "E" | "S" | "W";
    const cx = x + 6 * scale;
    const cy = y + 6 * scale;
    const r = 5 * scale;
    const pts: Record<string, [number, number][]> = {
      N: [[cx, cy - r], [cx - r, cy], [cx - r / 2.5, cy], [cx - r / 2.5, cy + r], [cx + r / 2.5, cy + r], [cx + r / 2.5, cy], [cx + r, cy]],
      S: [[cx, cy + r], [cx - r, cy], [cx - r / 2.5, cy], [cx - r / 2.5, cy - r], [cx + r / 2.5, cy - r], [cx + r / 2.5, cy], [cx + r, cy]],
      E: [[cx + r, cy], [cx, cy - r], [cx, cy - r / 2.5], [cx - r, cy - r / 2.5], [cx - r, cy + r / 2.5], [cx, cy + r / 2.5], [cx, cy + r]],
      W: [[cx - r, cy], [cx, cy - r], [cx, cy - r / 2.5], [cx + r, cy - r / 2.5], [cx + r, cy + r / 2.5], [cx, cy + r / 2.5], [cx, cy + r]],
    };
    g.poly(pts[d], C.sbRed);
    g.text(d, cx - 1, cy - 2, C.white);
    return;
  }
  const grid = iconGrid(id);
  if (grid) g.grid(grid.rows, grid.colors, x, y, scale);
}

export { DIR_WORD };
void PAL;
