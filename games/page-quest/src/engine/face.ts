/*
 * Moods on faces: builds the frame of a sprite for a mood (eyes, brows, mouth), blinking and
 * talking, plus the little emote icons shown in a bubble over the head (! ? ♥ … and friends).
 */
import type { Mood } from "@/story/roster";
import { KEYS, type SpriteDef } from "./sprites";

function luminance(hex: string): number {
  const m = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex);
  if (!m) return 0.5;
  const [r, g, b] = [m[1], m[2], m[3]].map((h) => parseInt(h, 16) / 255);
  return 0.3 * r + 0.59 * g + 0.11 * b;
}

/**
 * The `frozen` look: every pixel is re-coloured in ice blues (keys I, i, j) by its brightness (black
 * outlines stay), the eyes are shut (a lid line), the mouth is a small flat line, and a few
 * ice crystals sparkle on the edges. Works on any sprite, with or without a face.
 */
export function freezeRows(def: SpriteDef, rows: string[]): string[] {
  const colors: Record<string, string> = { ...KEYS, ...(def.colors ?? {}) };
  const g = rows.map((r) =>
    r.split("").map((k): string => {
      if (k === "." || k === "K") return k;
      const l = luminance(colors[k] ?? "#888888");
      return l > 0.62 ? "I" : l > 0.3 ? "i" : "j";
    }),
  );
  const set = (x: number, y: number, k: string) => {
    if (y >= 0 && y < g.length && x >= 0 && x < g[y].length) g[y][x] = k;
  };
  const f = def.face;
  if (f) {
    const ew = f.ew ?? 1;
    const lidY = f.ey + (f.eh ?? 1) - 1;
    for (const ex of f.ex) {
      for (let x = 0; x < ew; x++) for (let y = f.ey; y <= lidY; y++) set(ex + x, y, "i");
      for (let x = -1; x <= ew; x++) set(ex + x, lidY, "j");
    }
    if (f.mx !== undefined && f.my !== undefined) {
      set(f.mx, f.my, "j");
      set(f.mx + 1, f.my, "j");
    }
  }
  // Ice crystals: a white glint on the outer edge of every fourth filled row.
  g.forEach((row, y) => {
    if (y % 4 !== 1) return;
    const first = row.findIndex((k) => k !== ".");
    if (first < 0) return;
    const last = row.length - 1 - [...row].reverse().findIndex((k) => k !== ".");
    set(y % 8 === 1 ? first : last, y, "W");
  });
  return g.map((r) => r.join(""));
}

export function faceRows(def: SpriteDef, alt: boolean, mood: Mood, blink: boolean, talkOpen: boolean): string[] {
  if (mood === "frozen") return freezeRows(def, def.rows);
  const base = alt && def.alt ? def.alt : def.rows;
  const f = def.face;
  if (!f) return base;
  const g = base.map((r) => r.split(""));
  const set = (x: number, y: number, k: string) => {
    if (y >= 0 && y < g.length && x >= 0 && x < g[y].length) g[y][x] = k;
  };
  const ew = f.ew ?? 1;
  let eh = f.eh ?? 1;
  let ey = f.ey;
  const eye = f.eye ?? "K";
  if (mood === "thinking") ey -= 1;
  if (mood === "surprised" || mood === "scared") {
    ey -= 1;
    eh += 1;
  }
  f.ex.forEach((ex, i) => {
    if (blink) {
      for (let x = 0; x < ew; x++) set(ex + x, f.ey + (f.eh ?? 1) - 1, f.lid ?? f.skin);
      return;
    }
    if (mood === "happy" && f.big) {
      for (let x = 0; x < ew; x++) for (let y = 0; y < eh; y++) set(ex + x, ey + y, f.skin);
      set(ex - 1, ey + 1, eye);
      for (let x = 0; x < ew; x++) set(ex + x, ey, eye);
      set(ex + ew, ey + 1, eye);
      return;
    }
    for (let x = 0; x < ew; x++) for (let y = 0; y < eh; y++) set(ex + x, ey + y, eye);
    // Brows
    const left = i === 0;
    const outer = left ? ex - 1 : ex + ew;
    const inner = left ? ex + ew - 1 : ex;
    if (mood === "angry") {
      set(outer, ey - 2, "K");
      set(inner, ey - 1, "K");
    } else if (mood === "sad" || mood === "scared") {
      set(outer, ey - 1, "K");
      set(inner, ey - 2, "K");
    }
  });
  if (mood === "sad" && !blink) set(f.ex[0], f.ey + (f.eh ?? 1), "C");

  if (f.mx !== undefined && f.my !== undefined) {
    const m = f.mc ?? "z";
    const x = f.mx;
    const y = f.my;
    if (talkOpen || mood === "surprised") {
      set(x, y, m); set(x + 1, y, m); set(x, y + 1, m); set(x + 1, y + 1, m);
    } else if (mood === "happy") {
      set(x - 1, y, m); set(x, y + 1, m); set(x + 1, y + 1, m); set(x + 2, y, m);
    } else if (mood === "sad") {
      set(x - 1, y + 1, m); set(x, y, m); set(x + 1, y, m); set(x + 2, y + 1, m);
    } else if (mood === "angry") {
      set(x - 1, y, m); set(x, y, m); set(x + 1, y, m); set(x + 2, y, m);
    } else if (mood === "scared") {
      set(x - 1, y + 1, m); set(x, y, m); set(x + 1, y + 1, m); set(x + 2, y, m);
    } else if (mood === "thinking") {
      set(x + 1, y, m); set(x + 2, y, m);
    } else {
      set(x, y, m); set(x + 1, y, m);
    }
  }
  return g.map((r) => r.join(""));
}

/** 5x5 emote icons, drawn in a speech bubble over a character. */
export const EMOTES: Record<Exclude<Mood, "normal">, { rows: string[]; color: string }> = {
  happy: { rows: [".#.#.", "#####", "#####", ".###.", "..#.."], color: "#e3262f" },
  sad: { rows: [".....", ".....", ".....", ".....", "#.#.#"], color: "#2456e8" },
  angry: { rows: [".#.#.", "##.##", ".....", "##.##", ".#.#."], color: "#e3262f" },
  scared: { rows: ["#.#..", "#.#..", "#.#.#", "....#", "#.#.."], color: "#00aaaa" },
  surprised: { rows: ["..#..", "..#..", "..#..", ".....", "..#.."], color: "#000000" },
  thinking: { rows: [".###.", "#...#", "..##.", ".....", "..#.."], color: "#000000" },
  frozen: { rows: ["#.#.#", ".###.", "##.##", ".###.", "#.#.#"], color: "#2a8ad8" },
};
