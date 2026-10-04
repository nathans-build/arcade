/*
 * The 320x200 screen: title, the Loom (case board, re-weave, report picture), bead scenes with
 * witnesses, the chrono-map with pins or the split dial, and dead ends. Reads the engine's `ui`
 * every frame; also answers "what did the player tap?" for canvas taps.
 */
import { C, Gfx } from "@/chase/gfx";
import { MAP_H, MAP_W, WORLD_VIEW } from "@/chase/geo";
import { drawMap, PIN_COLORS, type MapPin } from "@/chase/mapview";
import { pinAt } from "@/chase/pins";
import { place } from "@/chase/places";
import type { ThreadGame } from "./engine";
import { knotVisible } from "./rules";
import { FLOOR, PAINTERS, type BackdropId } from "./scenes";
import { HERO, HERO_COLORS, KNOT, KNOT_COLORS, WICK, WICK_COLORS, witnessSprite } from "./sprites";

export const W = 320;
export const H = 200;
const MAP_X = 16;
const MAP_Y = 12;

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

export type Tap = { kind: "item"; i: number } | { kind: "pick"; i: number } | null;

export class Screen {
  private g: Gfx;
  private raf = 0;
  private last = 0;
  t = 0;
  paused = false;
  private bg = new Map<string, HTMLCanvasElement>();

  constructor(canvas: HTMLCanvasElement, private game: ThreadGame) {
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d")!;
    ctx.imageSmoothingEnabled = false;
    this.g = new Gfx(ctx);
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

  private backdrop(id: BackdropId) {
    let c = this.bg.get(id);
    if (!c) {
      c = document.createElement("canvas");
      c.width = W;
      c.height = H;
      const g = new Gfx(c.getContext("2d")!);
      g.rect(0, 0, W, H, C.navy);
      PAINTERS[id](g);
      this.bg.set(id, c);
    }
    this.g.ctx.drawImage(c, 0, 0);
  }

  // ---------- geometry shared with taps ----------
  itemXs(): number[] {
    const n = this.game.ui.talkers.length;
    const talk = n === 3 ? [96, 146, 196] : n === 2 ? [116, 176] : [];
    return [...talk, 246, 290];
  }

  tapAt(x: number, y: number): Tap {
    const u = this.game.ui;
    if (u.phase === "bead") {
      if (y < 60 || y > 160) return null;
      const xs = this.itemXs();
      let best = -1;
      let bd = 24;
      xs.forEach((ix, i) => {
        if (Math.abs(ix - x) < bd) {
          bd = Math.abs(ix - x);
          best = i;
        }
      });
      return best >= 0 ? { kind: "item", i: best } : null;
    }
    if (u.phase === "map" && u.map) {
      if (u.map.dial && u.map.dial.step === "era") {
        for (let i = 0; i < 4; i++) if (x >= 16 + i * 74 && x < 16 + i * 74 + 70 && y >= 138 && y < 166) return { kind: "pick", i };
        return null;
      }
      const i = pinAt(u.map.spots, x - MAP_X, y - MAP_Y, 15);
      return i >= 0 ? { kind: "pick", i } : null;
    }
    return null;
  }

  // ---------- drawing ----------
  draw() {
    const u = this.game.ui;
    const g = this.g;
    g.rect(0, 0, W, H, C.navy);
    switch (u.phase) {
      case "title":
        this.title();
        break;
      case "cases":
        this.loom("cases");
        break;
      case "brief":
        this.brief();
        break;
      case "bead":
        this.bead();
        break;
      case "map":
        this.map();
        break;
      case "deadend":
        this.deadEnd();
        break;
      case "slip":
        this.bead();
        this.banner("THE THREAD SLIPS", "LANTERN REFILLED - BACK TO THE LAST BEAD", C.sbRed);
        break;
      case "question": {
        const p = u.q?.purpose;
        if (p === "reweave" || p === "why" || p === "transmission") this.loom("reweave");
        else this.bead();
        break;
      }
      case "solved":
        this.loom("solved");
        break;
      case "report":
        this.loom("report");
        break;
    }
    if (u.phase !== "title" && u.phase !== "cases" && u.phase !== "report") this.hud();
  }

  private hud() {
    const g = this.g;
    const u = this.game.ui;
    const c = this.game.currentCase;
    g.rect(0, 0, W, 10, "#050818");
    g.rect(0, 10, W, 1, "#1c2a78");
    if (c) g.text(c.title.toUpperCase(), 3, 3, c.color);
    // lantern meter
    const x0 = 200;
    g.text("LANTERN", x0, 3, u.sensitive ? C.lgray : C.sbYellow);
    const n = u.lanternMax;
    const w = Math.floor(84 / n);
    for (let i = 0; i < n; i++) {
      const lit = i < u.lantern;
      g.rect(x0 + 32 + i * w, 2, w - 1, 6, lit ? (u.sensitive ? "#8a8aa8" : u.lantern <= 3 ? C.sbRed : C.sbYellow) : "#24284a");
    }
  }

  private banner(text: string, sub: string, color: string) {
    const g = this.g;
    g.dither(0, 0, W, H, "rgba(0,0,0,0.75)", "rgba(0,0,0,0)");
    g.rect(0, 70, W, 56, "rgba(5,8,24,0.92)");
    g.text(text, 160, 78, color, 3, "center", C.black);
    g.text(sub, 160, 108, C.white, 1, "center", C.black);
  }

  private hero(x: number, y: number) {
    const bob = Math.floor(this.t * 1.5) % 2;
    this.g.grid(HERO, HERO_COLORS, x, y - HERO.length * 2 - bob, 2);
  }

  private wick(x: number, y: number) {
    const f = WICK[Math.floor(this.t * 6) % 2];
    const yy = y + Math.round(Math.sin(this.t * 2.4) * 3);
    // lantern sparkles
    for (let i = 0; i < 4; i++) {
      const a = this.t * 2 + i * 1.57;
      if (Math.floor(this.t * 5 + i) % 3) this.g.px(x + 12 + Math.cos(a) * 15, yy + 10 + Math.sin(a) * 9, "#fff2a0");
    }
    this.g.grid(f, WICK_COLORS, x, yy, 2);
  }

  private knot(x: number, y: number, caught = false) {
    const g = this.g;
    const t = this.t;
    if (caught) {
      g.grid(KNOT, KNOT_COLORS, x, y, 2);
      // wrapped in a loop of golden yarn, smiling
      for (let a = 0; a < 24; a++) {
        const ang = (a / 24) * Math.PI * 2 + t;
        g.px(x + 12 + Math.cos(ang) * 15, y + 11 + Math.sin(ang) * 13, C.sbYellow);
      }
      return;
    }
    const hop = Math.abs(Math.sin(t * 4)) * 4;
    g.grid(KNOT, KNOT_COLORS, x, y - hop, 2);
    // a loose thread trailing behind
    for (let i = 0; i < 30; i++) g.px(x + 24 + i, y + 18 - hop / 2 + Math.round(Math.sin(i / 3 + t * 3) * 2), "#ff6fb0");
  }

  private title() {
    this.backdrop("loom");
    const g = this.g;
    const t = this.t;
    for (let i = 0; i < 5; i++) {
      const y = 44 + i * 16;
      const col = ["#e3262f", "#ffd23f", "#2456e8", "#2fd36a", "#ff55ff"][i];
      for (let x = 50; x < 270; x++) g.px(x, y + Math.round(Math.sin(x / 9 + t * 2 + i) * 2), col);
    }
    g.dither(40, 14, 240, 40, "rgba(5,8,24,0.9)", "rgba(0,0,0,0)");
    const bob = Math.floor(t * 2) % 2;
    g.text("THREAD", 160, 16 + bob, C.sbYellow, 4, "center", C.sbRed);
    g.text("CHASERS", 160, 38 + bob, C.sbYellow, 4, "center", C.sbBlue);
    g.text("CREATED BY SPIDERBEN10 (NZDO)", 160, 62, C.white, 1, "center", C.black);
    this.hero(60, FLOOR);
    this.wick(92, 92);
    this.knot(240 + Math.round(Math.sin(t) * 10), 120);
    g.text("A WORLD-HISTORY CHASE THROUGH TIME AND PLACE", 160, 172, C.sbSky, 1, "center");
    g.text("GRADES 5-12", 160, 182, C.lgray, 1, "center");
  }

  private loom(mode: "cases" | "reweave" | "solved" | "report") {
    this.backdrop("loom");
    const g = this.g;
    const u = this.game.ui;
    const t = this.t;
    if (mode === "cases" || mode === "report") {
      const list = this.game.caseList;
      list.forEach((c, i) => {
        const y = 40 + i * 11;
        const solved = this.game.isSolved(c.id);
        const sel = mode === "cases" && i === u.caseSel;
        const col = solved ? c.color : "#3a4680";
        for (let x = 52; x < 270; x++) {
          const loose = !solved && x > 200 ? Math.round(Math.sin(x / 4 + t * 3) * (x - 200) / 20) : 0;
          g.px(x, y + loose, col);
        }
        if (solved) for (let k = 0; k < 6; k++) g.circle(70 + k * 34, y, 2, c.color);
        g.text(String(c.n), 46, y - 2, sel ? C.sbYellow : C.lgray, 1, "right");
        if (sel) {
          g.rect(48, y - 4, 226, 1, C.sbYellow);
          g.rect(48, y + 4, 226, 1, C.sbYellow);
        }
      });
      g.text(mode === "report" ? "THE LOOM: YOUR RE-WOVEN THREADS" : "THE GREAT LOOM: PICK A LOOSE THREAD", 160, 14, C.sbYellow, 1, "center");
      g.text(`RANK: ${this.game.rank.toUpperCase()}`, 160, 150, C.white, 1, "center");
      this.wick(8, 120 + Math.round(Math.sin(t) * 6));
      if (mode === "cases") this.knot(286, 128);
      return;
    }
    // One case's thread with its beads, woven left to right.
    const c = this.game.currentCase;
    const chain = u.chain;
    if (!c) return;
    const n = chain.length;
    const x0 = 64;
    const x1 = 256;
    const y = 82;
    for (let x = 52; x < 270; x++) g.px(x, y + (x > x0 + ((x1 - x0) * Math.max(0, u.woven - 1)) / Math.max(1, n - 1) + 4 ? Math.round(Math.sin(x / 5 + t * 3) * 3) : 0), c.color);
    chain.forEach((b, i) => {
      const x = x0 + ((x1 - x0) * i) / Math.max(1, n - 1);
      const lit = i < u.woven;
      g.circle(x, y, 5, lit ? c.color : "#2a3060");
      g.circle(x, y, 3, lit ? C.white : "#3a4680");
      const lbl = place(b.place).name.split(/[ ,(]/)[0].toUpperCase().slice(0, 10);
      g.text(lbl, x, i % 2 ? y + 10 : y - 16, lit ? C.white : "#5a6098", 1, "center");
      if (lit && u.band !== "b912") g.text(b.year < 0 ? `${-b.year}BCE` : String(b.year), x, i % 2 ? y + 18 : y - 24, C.sbYellow, 1, "center");
    });
    g.text(c.title.toUpperCase(), 160, 18, c.color, 2, "center", C.black);
    if (mode === "solved" || (mode === "reweave" && u.woven >= n)) this.knot(150, 108, true);
    this.wick(12, 110);
    if (mode === "solved") g.text("THREAD RE-WOVEN! KNOT IS CAUGHT.", 160, 156, C.sbYellow, 1, "center");
  }

  private brief() {
    const g = this.g;
    const c = this.game.currentCase!;
    const first = this.game.ui.chain[0];
    drawMap(g, WORLD_VIEW, MAP_X, MAP_Y, this.t, { here: place(first.place).at, title: `${c.title}: the thread starts in ${place(first.place).name}` });
    this.wick(276, 140);
    const lines = wrap(this.game.text(c.brief), 46);
    lines.slice(0, 4).forEach((l, i) => g.text(l, 16, 140 + i * 8, C.white));
  }

  private bead() {
    const g = this.g;
    const u = this.game.ui;
    const b = this.game.bead;
    if (!b) return;
    this.backdrop(b.scene);
    // the hero and Wick
    this.hero(16, FLOOR);
    this.wick(48, 78);
    // witnesses
    const xs = this.itemXs();
    u.talkers.forEach((t, i) => {
      const talking = u.asked[u.asked.length - 1] === i && Math.floor(this.t * 6) % 2 === 0 && u.msg.startsWith(t.who);
      const sp = witnessSprite(t.look, t.who, b.place, talking);
      const x = xs[i] - 12;
      const y = FLOOR - sp.rows.length * 2 - (Math.floor(this.t * 1.3 + i) % 2);
      g.dither(xs[i] - 10, FLOOR - 2, 20, 3, "#000000", "rgba(0,0,0,0)");
      g.grid(sp.rows, sp.colors, x, y, 2, i === u.talkers.length - 1 && i > 0);
      if (u.asked.includes(i)) g.text("✔", xs[i] + 10, y - 2, C.lgreen);
      else if (!u.sensitive) g.text("1H", xs[i] + 8, y - 2, C.sbYellow);
    });
    // plaque on a pedestal
    const px = xs[u.talkers.length];
    g.rect(px - 8, FLOOR - 26, 16, 26, "#7a6a5a");
    g.rect(px - 11, FLOOR - 34, 22, 10, u.plaqueRead ? "#c8a040" : C.sbYellow);
    g.rect(px - 9, FLOOR - 32, 18, 6, "#5a4020");
    g.text("FREE", px, FLOOR - 42, C.lgreen, 1, "center");
    // the chrono-map gate (or the loom when this is the last bead)
    const gx = xs[u.talkers.length + 1];
    const pulse = Math.floor(this.t * 4) % 2;
    const last = !this.game.nextBead;
    g.ellipse(gx, FLOOR - 24, 13, 22, last ? C.sbRed : C.sbBlue);
    g.ellipse(gx, FLOOR - 24, 10, 19, pulse ? "#6ea0ff" : "#2fd3ff");
    g.ellipse(gx, FLOOR - 24, 7, 16, C.navy);
    g.text(last ? "LOOM" : "MAP", gx, FLOOR - 28, C.white, 1, "center");
    // Knot peeks from behind the gate (never on a sensitive bead)
    if (knotVisible(b) && !last) {
      const peek = Math.sin(this.t * 1.3) > 0.2;
      if (peek) this.knot(gx - 34, 30 + Math.round(Math.sin(this.t * 3) * 3));
    }
    // selection cursor
    if (u.phase === "bead") {
      const sx = xs[u.sel];
      const bob = Math.floor(this.t * 4) % 2;
      g.tri(sx - 4, 64 + bob, sx + 4, 64 + bob, sx, 70 + bob, C.sbYellow);
    }
    // info strip
    g.rect(0, 160, W, 40, "#050818");
    g.rect(0, 160, W, 1, "#1c2a78");
    const p = place(b.place);
    g.text(`${p.name.toUpperCase()} - ${b.era.toUpperCase()}`, 4, 164, C.sbYellow, 1);
    g.text(b.title.toUpperCase(), 4, 172, C.white, 1);
    this.timeline(4, 188, 312);
    if (u.sensitive) g.text("A QUIET BEAD: NO CLOCK HERE", 316, 164, C.lgray, 1, "right");
  }

  /** The case's thread with its beads as a timeline bar (found beads lit). */
  private timeline(x: number, y: number, w: number) {
    const g = this.g;
    const u = this.game.ui;
    const c = this.game.currentCase;
    if (!c) return;
    const n = u.chain.length;
    g.rect(x, y, w, 1, "#3a4680");
    u.chain.forEach((b, i) => {
      const bx = x + 6 + ((w - 12) * i) / Math.max(1, n - 1);
      const lit = i <= u.beadIx;
      g.circle(bx, y, 3, lit ? c.color : "#2a3060");
      if (i === u.beadIx) g.circle(bx, y, 1, C.white);
      if (lit && u.band !== "b912") g.text(b.year < 0 ? `${-b.year} BCE` : String(b.year), bx, y + 5, C.lgray, 1, "center");
    });
  }

  private map() {
    const g = this.g;
    const u = this.game.ui;
    const m = u.map;
    const b = this.game.bead;
    if (!m || !b) return;
    const dial = m.dial;
    const pins: { spot: (typeof m.spots)[number]; pin: MapPin }[] = m.pins.map((p, i) => {
      const name = place(p.place).name;
      const tried = m.tried.some((k) => k.startsWith(`${p.place}|`) && (dial || k === `${p.place}|${p.era}`));
      let label = "";
      let sub = "";
      if (u.band === "b5") {
        label = name;
        sub = p.era;
      } else if (u.band === "b68") {
        label = name;
        sub = m.selected === i || tried ? p.era : "";
      }
      const dim = dial ? dial.step === "era" && dial.placeIx !== i : tried;
      return { spot: m.spots[i], pin: { letter: "ABCD"[i], color: PIN_COLORS[i], label, sub, dim, selected: m.selected === i || (dial?.placeIx === i) } };
    });
    const path = u.chain.slice(0, u.beadIx + 1).map((x) => place(x.place).at);
    drawMap(g, m.view, MAP_X, MAP_Y, this.t, {
      pins: dial && dial.step === "era" ? pins.filter((_, i) => i === dial.placeIx) : pins,
      path,
      here: place(b.place).at,
      title: m.view.id === "world" ? "Chrono-map" : `Chrono-map: zoomed in`,
    });
    // bottom: split dial eras, or the timeline
    g.rect(0, 134, W, 66, "#050818");
    if (dial && dial.step === "era") {
      g.text("ERA DIAL: WHEN DID IT REACH " + place(dial.places[dial.placeIx ?? 0].place).name.toUpperCase() + "?", 160, 138, C.sbYellow, 1, "center");
      dial.eras.forEach((e, i) => {
        const x = 16 + i * 74;
        const tried = m.tried.some((k) => k.endsWith(`|${e.era}`));
        g.rect(x, 146, 70, 20, tried ? "#24284a" : PIN_COLORS[i]);
        g.rect(x + 2, 148, 66, 16, tried ? "#1a1e3a" : "#0a0f2e");
        g.text("ABCD"[i], x + 6, 153, tried ? "#5a6098" : PIN_COLORS[i]);
        g.text(e.era.toUpperCase(), x + 40, 153, tried ? "#5a6098" : C.white, 1, "center");
      });
      // dial arrow
      const a = this.t * 1.2;
      g.line(160, 186, 160 + Math.cos(a) * 10, 186 + Math.sin(a) * 6, C.sbYellow);
      g.circle(160, 186, 2, C.sbYellow);
    } else {
      g.text(dial ? "SPLIT DIAL: FIRST PICK THE PLACE (A-D)" : u.band === "b68" ? "PICK A PIN (A-D) TO SEE ITS ERA, THEN JUMP" : "WHERE AND WHEN? PICK A PIN: A B C D", 160, 140, C.sbYellow, 1, "center");
      this.timeline(16, 160, 288);
      this.wick(286, 170);
    }
    g.text(`FROM ${place(b.place).name.toUpperCase()}, ${b.era.toUpperCase()}`, 16, 190, C.lgray, 1);
  }

  private deadEnd() {
    const g = this.g;
    const u = this.game.ui;
    const d = u.deadEnd;
    if (!d) return;
    this.backdrop("road");
    this.hero(40, FLOOR);
    this.wick(72, 80);
    const sp = witnessSprite("elder", d.place, "rome");
    g.grid(sp.rows, sp.colors, 200, FLOOR - sp.rows.length * 2, 2, true);
    // speech bubble
    const lines = wrap("Not here! " + (d.era ? `Not in ${d.era}.` : ""), 22);
    const bw = Math.max(...lines.map((l) => g.textWidthOf(l))) + 12;
    const bh = lines.length * 8 + 8;
    g.rect(150, 40, bw, bh, C.white);
    g.rect(150, 40, bw, 1, C.black);
    g.tri(206, 40 + bh, 216, 40 + bh, 212, 40 + bh + 8, C.white);
    lines.forEach((l, i) => g.text(l, 156, 45 + i * 8, C.navy));
    g.rect(0, 160, W, 40, "#050818");
    g.text("DEAD END", 160, 164, C.sbRed, 2, "center", C.black);
    g.text(`${d.place.toUpperCase()}${d.era ? " - " + d.era.toUpperCase() : ""}${d.cost ? `  (-${d.cost} LANTERN HOURS)` : ""}`, 160, 182, C.white, 1, "center");
  }
}

export { MAP_H, MAP_W };
