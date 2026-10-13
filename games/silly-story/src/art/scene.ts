/*
 * Builds the picture for a finished story and draws it.
 *   nouns → sprites (or a mystery box with the word on it), numbers → that many copies (capped),
 *   adjectives → modifiers, verbs → animations, adverbs → speed and extras.
 */
import { numberValue, singularCandidates } from "../story/grammar";
import { linkCast } from "../story/template";
import type { BlankType, CastSpec, Parsed } from "../story/types";
import { VOCAB } from "../story/vocab";
import { bgById, H, W } from "./bgs";
import { pixelTextOutlined, textWidth } from "./font";
import { adjectiveEffect, adverbEffect, verbAnim, type AnimId, type ModEffect, type Particle } from "./mods";
import { GRID, spriteCanvas } from "./raster";
import { spriteById, spriteForWord, type SpriteDef } from "./sprites";

export const MAX_COPIES = 6;
const BASE = 2;

export interface Actor {
  sprite: SpriteDef;
  /** The word for a mystery box (no sprite for it yet). */
  mystery?: string;
  word: string;
  color?: string;
  rainbow: boolean;
  scale: number;
  sx: number;
  sy: number;
  flipX: boolean;
  flipY: boolean;
  alpha: number;
  fuzzy: boolean;
  striped: boolean;
  spotted: boolean;
  shiny: boolean;
  glow?: string;
  wobble: boolean;
  particles: Particle[];
  overlays: string[];
  anim: AnimId | null;
  speed: number;
  count: number;
  /** "×12" when there were more than MAX_COPIES. */
  more?: number;
  air: boolean;
  /** Small card picture: keep moves short so it stays on the card. */
  demo?: boolean;
  x: number;
  y: number;
  phase: number;
}

export interface LegendItem {
  blank: number;
  word: string;
  type: BlankType;
  does: string;
}

export interface Scene {
  bg: string;
  actors: Actor[];
  tint?: string;
  rainbowSky: boolean;
  particles: Particle[];
  legend: LegendItem[];
}

const VERB_TYPES = new Set<BlankType>(["verb", "verb-past", "verb-ing"]);
const effType = (p: Parsed, i: number): BlankType => {
  const b = p.blanks[i];
  return b.type === "vocab" ? (VOCAB[b.hint ?? ""]?.pos ?? "noun") : b.type;
};

function spriteFor(word: string): SpriteDef | undefined {
  const w = word.trim().toLowerCase();
  return spriteForWord(w) ?? singularCandidates(w).map((s) => spriteForWord(s)).find(Boolean) ?? spriteForWord(w.split(/\s+/).pop() ?? w);
}

function applyMod(a: Actor, e: ModEffect) {
  if (e.color) a.color = e.color;
  if (e.rainbow) a.rainbow = true;
  if (e.scale) a.scale *= e.scale;
  if (e.sx) a.sx *= e.sx;
  if (e.sy) a.sy *= e.sy;
  if (e.flipY) a.flipY = !a.flipY;
  if (e.flipX) a.flipX = !a.flipX;
  if (e.alpha !== undefined) a.alpha = Math.min(a.alpha, e.alpha);
  if (e.fuzzy) a.fuzzy = true;
  if (e.striped) a.striped = true;
  if (e.spotted) a.spotted = true;
  if (e.shiny) a.shiny = true;
  if (e.glow) a.glow = e.glow;
  if (e.wobble) a.wobble = true;
  if (e.particle && !a.particles.includes(e.particle)) a.particles.push(e.particle);
  if (e.overlay && !a.overlays.includes(e.overlay)) a.overlays.push(e.overlay);
}

function newActor(sprite: SpriteDef, word: string, phase: number): Actor {
  return {
    sprite, word, rainbow: false, scale: 1, sx: 1, sy: 1, flipX: false, flipY: false, alpha: 1, fuzzy: false, striped: false, spotted: false,
    shiny: false, wobble: false, particles: [], overlays: [], anim: null, speed: 1, count: 1, air: !!sprite.air, x: 0, y: 0, phase,
  };
}

export function buildScene(p: Parsed, words: string[], bg: string, cast: CastSpec[] = []): Scene {
  const { links, sceneAdjs } = linkCast(p, cast);
  const legend = new Map<number, LegendItem>();
  const note = (i: number, does: string) => {
    if (i < 0 || legend.has(i)) return;
    legend.set(i, { blank: i, word: words[i] ?? "", type: effType(p, i), does });
  };
  const actors: Actor[] = [];
  links.slice(0, 6).forEach((link, k) => {
    const nounWord = link.noun >= 0 ? (words[link.noun] ?? "").trim() : "";
    let sprite = link.sprite ? spriteById(link.sprite) : undefined;
    let mystery: string | undefined;
    if (!sprite) {
      sprite = nounWord ? spriteFor(nounWord) : undefined;
      if (!sprite) {
        sprite = spriteById("mystery")!;
        mystery = nounWord || "?";
      }
    }
    const a = newActor(sprite, nounWord || sprite.words[0], k * 1.7);
    a.mystery = mystery;
    if (link.noun >= 0) note(link.noun, mystery ? "became a mystery box" : `drew ${sprite.id === "mystery" ? "a box" : `a ${sprite.words[0]}`}`);
    const nb = link.noun >= 0 ? p.blanks[link.noun] : undefined;
    if (nb && (nb.type === "plural-noun" || nb.plural)) a.count = 3;
    if (link.count >= 0) {
      const n = numberValue(words[link.count] ?? "");
      if (n !== null) {
        a.count = Math.max(1, Math.min(MAX_COPIES, n));
        if (n === 0) a.alpha = 0.3;
        if (n > MAX_COPIES) a.more = n;
        note(link.count, n > MAX_COPIES ? `drew ${MAX_COPIES} (that's a lot!)` : n === 0 ? "made it fade away" : `drew ${a.count} of them`);
      } else note(link.count, "was a mystery number");
    }
    for (const ai of link.adjs) {
      const e = adjectiveEffect(words[ai] ?? "");
      if (e) applyMod(a, e);
      note(ai, e ? e.does : "is a mystery (no picture magic yet)");
    }
    if (link.verb >= 0) {
      const v = verbAnim(words[link.verb] ?? "");
      a.anim = v ? v.anim : "bob";
      note(link.verb, v ? `made it ${v.does}` : "made a mystery move");
    } else if (link.anim) a.anim = link.anim as AnimId;
    if (link.adverb >= 0) {
      const d = adverbEffect(words[link.adverb] ?? "");
      if (d) {
        a.speed = d.speed;
        if (d.particle && !a.particles.includes(d.particle)) a.particles.push(d.particle);
        if (d.alpha) a.alpha = Math.min(a.alpha, d.alpha);
        if (d.wobble) a.wobble = true;
      }
      note(link.adverb, d ? d.does : "changed how it moves");
    }
    if (a.anim === "fly" || a.anim === "float") a.air = true;
    actors.push(a);
  });

  // Leftover action words and adverbs go to cast members who aren't doing anything yet.
  p.blanks.forEach((_b, i) => {
    if (legend.has(i)) return;
    const t = effType(p, i);
    if (VERB_TYPES.has(t)) {
      const idle = actors.find((a) => !a.anim);
      const v = verbAnim(words[i] ?? "");
      if (idle) {
        idle.anim = v ? v.anim : "bob";
        if (idle.anim === "fly" || idle.anim === "float") idle.air = true;
        note(i, v ? `made the ${idle.mystery ? "box" : idle.sprite.words[0]} ${v.does}` : "made a mystery move");
      } else note(i, v ? `(everyone is busy ${v.does})` : "is in the story");
    } else if (t === "adverb") {
      const d = adverbEffect(words[i] ?? "");
      const target = actors.find((a) => a.anim && a.speed === 1);
      if (target && d) {
        target.speed = d.speed;
        if (d.particle && !target.particles.includes(d.particle)) target.particles.push(d.particle);
      }
      note(i, d && target ? d.does : "tells how");
    }
  });

  // Leftover describing words color the whole scene.
  let tint: string | undefined;
  let rainbowSky = false;
  const particles: Particle[] = [];
  for (const i of sceneAdjs) {
    const e = adjectiveEffect(words[i] ?? "");
    if (e?.color) tint = e.color;
    if (e?.rainbow) rainbowSky = true;
    if (e?.particle && !particles.includes(e.particle)) particles.push(e.particle);
    note(i, e ? (e.color ? `tinted the whole scene` : e.particle ? `filled the scene: ${e.does.replace(/^added |^made it /, "")}` : "set the mood") : "set the mood");
  }
  p.blanks.forEach((_b, i) => {
    if (legend.has(i)) return;
    const t = effType(p, i);
    note(i, t === "pronoun-subject" || t === "pronoun-object" ? "stood in for a name" : t === "preposition" ? "told where" : t === "simile" ? "made a comparison" : t === "sound" ? "made a sound effect" : t === "number" ? "counted something" : "is in the story");
  });

  layout(actors, bgById(bg).ground);
  return { bg, actors, tint, rainbowSky, particles, legend: [...legend.values()].sort((a, b) => a.blank - b.blank) };
}

/** Size of one copy in scene pixels. */
function size(a: Actor) {
  const s = BASE * a.scale * (a.count > 3 ? 0.7 : a.count > 1 ? 0.85 : 1);
  return { w: GRID * s * a.sx, h: GRID * s * a.sy, s };
}

function clusterWidth(a: Actor) {
  const { w } = size(a);
  return w * (1 + (a.count - 1) * 0.6);
}

function layout(actors: Actor[], ground: number) {
  // Shrink everyone if the row is too wide.
  let total = actors.reduce((t, a) => t + clusterWidth(a), 0);
  const maxW = W - 24;
  if (total > maxW) {
    const f = maxW / total;
    for (const a of actors) a.scale *= f;
    total = maxW;
  }
  const gap = (W - total) / (actors.length + 1);
  let x = gap;
  actors.forEach((a, i) => {
    const cw = clusterWidth(a);
    a.x = x + cw / 2;
    x += cw + gap;
    const { h } = size(a);
    a.y = a.air ? Math.min(ground - 30, 70 + (i % 2) * 22 + h / 2) : ground;
  });
}

/* ---------------------------------------------------------------- drawing */

interface Pose {
  dx: number;
  dy: number;
  rot: number;
  sx: number;
  sy: number;
  alpha: number;
}

function pose(anim: AnimId | null, t: number, wobble: boolean, water: boolean): Pose {
  const p: Pose = { dx: 0, dy: 0, rot: 0, sx: 1, sy: 1, alpha: 1 };
  const s = Math.sin;
  switch (anim) {
    case "dance": p.dx = s(t * 4) * 6; p.dy = -Math.abs(s(t * 8)) * 5; p.rot = s(t * 4) * 0.25; break;
    case "spin": p.rot = t * 5; break;
    case "jump": p.dy = -Math.abs(s(t * 4)) * 26; p.sy = 1 - Math.max(0, -s(t * 4 + 1.4)) * 0.15; break;
    case "sleep": p.rot = 1.45; p.sy = 1 + s(t * 2) * 0.04; break;
    case "wobble": p.rot = s(t * 9) * 0.3; p.sx = 1 + s(t * 11) * 0.08; break;
    case "fly": p.dx = s(t * 1.2) * 30; p.dy = s(t * 3) * 8; p.rot = s(t * 1.2 + 1.5) * 0.15; break;
    case "float": p.dy = s(t * 1.5) * 8; p.dx = s(t * 0.7) * 10; break;
    case "run": case "drive": p.dx = s(t * 1.5) * 40; p.dy = -Math.abs(s(t * 12)) * 3; break;
    case "slide": p.dx = s(t * 1.2) * 45; p.rot = -0.1; break;
    case "walk": p.dx = s(t * 0.6) * 30; p.dy = -Math.abs(s(t * 6)) * 2; break;
    case "swim": p.dx = s(t * 1) * 30; p.dy = s(t * 3) * 6 - 12; p.rot = s(t * 3) * 0.15; break;
    case "sing": case "shout": p.sy = 1 + Math.abs(s(t * 6)) * 0.1; p.dy = -Math.abs(s(t * 3)) * 2; break;
    case "eat": p.sy = 1 - Math.abs(s(t * 10)) * 0.12; p.sx = 1 + Math.abs(s(t * 10)) * 0.06; break;
    case "laugh": p.dx = s(t * 25) * 1.5; p.dy = -Math.abs(s(t * 12)) * 3; break;
    case "cry": p.dy = s(t * 2) * 1; break;
    case "sneeze": { const k = (t % 2.2); p.rot = k > 1.8 ? -0.35 : k > 1.4 ? 0.15 : 0; p.dx = k > 1.8 ? -4 : 0; break; }
    case "wave": p.rot = s(t * 6) * 0.12; break;
    case "explode": { const k = t % 2; p.sx = p.sy = k < 0.3 ? 1 + k * 1.5 : 1; break; }
    case "juggle": p.dy = -Math.abs(s(t * 6)) * 2; break;
    case "glow": p.sx = p.sy = 1 + s(t * 3) * 0.05; break;
    case "grow": p.sx = p.sy = 1 + s(t * 1.5) * 0.35; break;
    case "think": p.rot = s(t) * 0.08; break;
    case "hide": p.alpha = 0.2 + Math.abs(s(t * 0.8)) * 0.8; break;
    case "melt": p.sy = 0.75 + s(t * 2) * 0.2; p.sx = 1.25 - s(t * 2) * 0.15; break;
    case "bob": p.dy = s(t * 2) * 3; break;
    default: break;
  }
  if (wobble) { p.rot += s(t * 10) * 0.2; p.sx *= 1 + s(t * 13) * 0.07; }
  if (water && anim !== "swim") p.dy += s(t * 2) * 3;
  return p;
}

const DECOR: Partial<Record<AnimId, Particle | "ha" | "achoo" | "think" | "juggle" | "tears">> = {
  sleep: "zzz", sing: "notes", swim: "bubbles", cry: "tears", laugh: "ha", sneeze: "achoo", shout: "waves", explode: "confetti",
  juggle: "juggle", glow: "sparkle", think: "think", run: "speed", drive: "speed", slide: "speed",
};

const HUES = ["#e3262f", "#ff8a1f", "#ffd23f", "#3fbf4f", "#2f8fff", "#8b3fd9", "#ff5fd2"];

export class SceneRenderer {
  private raf = 0;
  private start = performance.now();
  constructor(private canvas: HTMLCanvasElement, public scene: Scene) {
    canvas.width = W;
    canvas.height = H;
  }

  run() {
    const loop = () => {
      this.draw((performance.now() - this.start) / 1000);
      this.raf = requestAnimationFrame(loop);
    };
    cancelAnimationFrame(this.raf);
    this.raf = requestAnimationFrame(loop);
  }

  stop() {
    cancelAnimationFrame(this.raf);
  }

  draw(t: number) {
    const c = this.canvas.getContext("2d");
    if (!c) return;
    drawScene(c, this.scene, t);
  }
}

export function drawScene(c: CanvasRenderingContext2D, scene: Scene, t: number) {
  c.imageSmoothingEnabled = false;
  c.save();
  c.clearRect(0, 0, W, H);
  const bg = bgById(scene.bg);
  bg.draw(c, t);
  if (scene.tint) {
    c.globalAlpha = 0.22;
    c.fillStyle = scene.tint;
    c.fillRect(0, 0, W, H);
    c.globalAlpha = 1;
  }
  if (scene.rainbowSky) {
    c.globalAlpha = 0.5;
    HUES.forEach((h, i) => {
      c.fillStyle = h;
      for (let x = 0; x < W; x++) c.fillRect(x, 40 + i * 4 + Math.round(Math.sin(x / 50) * 6), 1, 4);
    });
    c.globalAlpha = 1;
  }
  const order = [...scene.actors].sort((a, b) => a.y - b.y);
  for (const a of order) drawActor(c, a, t, !!bg.water);
  for (const kind of scene.particles) drawParticles(c, kind, W / 2, 10, W, H - 20, t, 3);
  c.restore();
}

function drawActor(c: CanvasRenderingContext2D, a: Actor, t: number, water: boolean) {
  const { w, h, s } = size(a);
  const tt = t * a.speed + a.phase;
  const color = a.rainbow ? HUES[Math.floor(t * 4 + a.phase) % HUES.length] : a.color;
  const cv = spriteCanvas(a.sprite, { color, fuzzy: a.fuzzy, striped: a.striped, spotted: a.spotted });
  const n = a.count;
  for (let i = 0; i < n; i++) {
    const off = (i - (n - 1) / 2) * w * 0.6;
    const p = pose(a.anim, tt + i * 0.45, a.wobble, water);
    if (a.demo) {
      p.dx *= 0.2;
      p.dy *= 0.35;
    }
    const cx = a.x + off + p.dx;
    const cy = a.y - h / 2 + p.dy - (i % 2) * 3;
    c.save();
    c.globalAlpha = a.alpha * p.alpha;
    if (a.glow) {
      c.globalAlpha *= 0.3 + Math.sin(t * 3) * 0.1;
      c.fillStyle = a.glow;
      c.beginPath();
      c.ellipse(cx, cy, w * 0.65, h * 0.65, 0, 0, Math.PI * 2);
      c.fill();
      c.globalAlpha = a.alpha * p.alpha;
    }
    if (a.overlays.includes("cape")) {
      c.fillStyle = "#e3262f";
      c.beginPath();
      c.moveTo(cx - w * 0.2, cy - h * 0.25);
      c.lineTo(cx + w * 0.2, cy - h * 0.25);
      c.lineTo(cx + w * 0.45 + Math.sin(t * 6) * 3, cy + h * 0.45);
      c.lineTo(cx - w * 0.45 + Math.sin(t * 6 + 1) * 3, cy + h * 0.45);
      c.fill();
    }
    c.translate(Math.round(cx), Math.round(cy));
    c.rotate(p.rot);
    c.scale(s * a.sx * p.sx * (a.flipX ? -1 : 1), s * a.sy * p.sy * (a.flipY ? -1 : 1));
    c.drawImage(cv, -GRID / 2, -GRID / 2);
    // Hats and glasses ride on the sprite (so they flip and spin with it).
    for (const o of a.overlays) drawOverlay(c, o);
    if (a.shiny) {
      const k = ((t * 0.8 + a.phase) % 2) * GRID - GRID / 2;
      c.globalAlpha = 0.7 * a.alpha;
      c.fillStyle = "#ffffff";
      for (let d = 0; d < 3; d++) c.fillRect(k + d, -GRID / 2 + 4 + d * 3, 1, 3);
    }
    c.restore();
    if (a.mystery && i === 0) {
      const label = a.mystery.toUpperCase().slice(0, 12);
      const tw = textWidth(label);
      pixelTextOutlined(c, label, Math.round(a.x - tw / 2), Math.round(a.y + 3 > H - 7 ? a.y - h - 8 : a.y + 2), "#ffd23f");
    }
  }
  const top = a.y - h - 2;
  const cw = clusterWidth(a);
  for (const kind of a.particles) drawParticles(c, kind, a.x, top, cw, h, t + a.phase, 1);
  const decor = a.anim ? DECOR[a.anim] : undefined;
  if (decor) drawDecor(c, decor, a.x + (a.anim === "run" || a.anim === "slide" || a.anim === "drive" ? pose(a.anim, tt, false, false).dx : 0), top, w, h, tt);
  if (a.more) pixelTextOutlined(c, `×${a.more > 999 ? "LOTS" : a.more}`, Math.round(a.x + cw / 2 - 6), Math.round(top), "#ffffff");
}

function drawOverlay(c: CanvasRenderingContext2D, o: string) {
  const top = -GRID / 2 + 1;
  if (o === "shades") {
    c.fillStyle = "#1b1230";
    c.fillRect(-5, top + 4, 11, 3);
    c.fillStyle = "#6ea0ff";
    c.fillRect(-4, top + 4, 1, 1);
    c.fillRect(2, top + 4, 1, 1);
  } else if (o === "glasses") {
    c.strokeStyle = "#1b1230";
    c.lineWidth = 1;
    c.strokeRect(-5.5, top + 3.5, 4, 3);
    c.strokeRect(1.5, top + 3.5, 4, 3);
  } else if (o === "tophat") {
    c.fillStyle = "#1b1230";
    c.fillRect(-5, top - 1, 10, 2);
    c.fillRect(-3, top - 8, 6, 7);
    c.fillStyle = "#e3262f";
    c.fillRect(-3, top - 3, 6, 1);
  } else if (o === "crown") {
    c.fillStyle = "#ffd23f";
    c.fillRect(-4, top - 3, 9, 3);
    c.fillRect(-4, top - 5, 1, 2);
    c.fillRect(0, top - 6, 1, 3);
    c.fillRect(4, top - 5, 1, 2);
    c.fillStyle = "#e3262f";
    c.fillRect(0, top - 2, 1, 1);
  }
}

const hashf = (i: number, k: number) => {
  const x = Math.sin(i * 127.1 + k * 311.7) * 43758.5453;
  return x - Math.floor(x);
};

function drawParticles(c: CanvasRenderingContext2D, kind: Particle, cx: number, top: number, w: number, h: number, t: number, density: number) {
  const n = Math.round((kind === "speed" || kind === "waves" ? 3 : 7) * density);
  const left = cx - w / 2;
  for (let i = 0; i < n; i++) {
    const rx = hashf(i, 1);
    const ry = hashf(i, 2);
    const cyc = (t * 0.6 + hashf(i, 3)) % 1;
    switch (kind) {
      case "sparkle": {
        if (Math.sin(t * 4 + i * 2.3) < 0.2) break;
        const x = left - 4 + rx * (w + 8), y = top + ry * (h + 6);
        c.fillStyle = i % 2 ? "#ffffff" : "#ffd23f";
        c.fillRect(x - 1, y, 3, 1);
        c.fillRect(x, y - 1, 1, 3);
        break;
      }
      case "fire": {
        const x = left + rx * w, y = top + h - cyc * (h + 10);
        c.fillStyle = cyc < 0.4 ? "#ffd23f" : cyc < 0.7 ? "#ff8a1f" : "#e3262f";
        c.globalAlpha = 1 - cyc;
        c.fillRect(x, y, 2, 3);
        c.globalAlpha = 1;
        break;
      }
      case "snow": case "confetti": {
        const x = left - 6 + rx * (w + 12) + Math.sin(t * 2 + i) * 3, y = top - 10 + cyc * (h + 14);
        c.fillStyle = kind === "snow" ? "#ffffff" : HUES[i % HUES.length];
        c.fillRect(x, y, 2, 2);
        break;
      }
      case "stink": {
        const x = left + (i % 3) * (w / 3) + w / 6, y = top + 4 - cyc * 16;
        c.fillStyle = "#7fd03f";
        c.globalAlpha = 1 - cyc;
        for (let k = 0; k < 4; k++) c.fillRect(x + Math.sin(k + t * 4) * 2, y - k * 2, 1, 2);
        c.globalAlpha = 1;
        break;
      }
      case "hearts": {
        if (i > 3) break;
        const x = left + rx * w, y = top + 4 - cyc * 20;
        c.globalAlpha = 1 - cyc;
        c.fillStyle = "#ff3f6f";
        c.fillRect(x, y, 2, 2); c.fillRect(x + 3, y, 2, 2); c.fillRect(x, y + 1, 5, 2); c.fillRect(x + 1, y + 3, 3, 1); c.fillRect(x + 2, y + 4, 1, 1);
        c.globalAlpha = 1;
        break;
      }
      case "rain": {
        if (i === 0) {
          c.fillStyle = "#8a8aa0";
          c.fillRect(cx - 10, top - 14, 20, 6);
          c.fillRect(cx - 7, top - 17, 12, 4);
        }
        const x = cx - 9 + rx * 18, y = top - 8 + cyc * 14;
        c.fillStyle = "#6ea0ff";
        c.fillRect(x, y, 1, 2);
        break;
      }
      case "drops": {
        const x = left + rx * w, y = top + h * 0.5 + cyc * (h * 0.6);
        c.fillStyle = "#5fb0ff";
        c.fillRect(x, y, 1, 2);
        c.fillRect(x - 1, y + 1, 3, 1);
        break;
      }
      case "zzz": {
        if (i > 2) break;
        const k = (t * 0.5 + i / 3) % 1;
        pixelTextOutlined(c, "Z", Math.round(cx + 4 + k * 14), Math.round(top - k * 16), "#ffffff", 1 + (k > 0.5 ? 1 : 0));
        break;
      }
      case "steam": {
        if (i > 3) break;
        const side = i % 2 ? 1 : -1;
        c.fillStyle = "#e8e8f8";
        c.globalAlpha = 1 - cyc;
        c.fillRect(cx + side * (w * 0.3 + cyc * 6), top - cyc * 10, 3, 3);
        c.globalAlpha = 1;
        break;
      }
      case "notes": {
        if (i > 3) break;
        const x = cx + w * 0.4 + Math.sin(t * 3 + i) * 4 + i * 3, y = top - cyc * 18;
        c.fillStyle = i % 2 ? "#ffd23f" : "#ff8fc8";
        c.globalAlpha = 1 - cyc;
        c.fillRect(x, y, 2, 2); c.fillRect(x + 1, y - 5, 1, 5); c.fillRect(x + 2, y - 5, 2, 1);
        c.globalAlpha = 1;
        break;
      }
      case "bubbles": {
        const x = left + rx * w + Math.sin(t * 3 + i) * 2, y = top + h - cyc * (h + 16);
        c.strokeStyle = "#c0f0ff";
        c.lineWidth = 1;
        c.strokeRect(Math.round(x) + 0.5, Math.round(y) + 0.5, 2, 2);
        break;
      }
      case "speed": {
        const y = top + h * 0.3 + i * (h * 0.2);
        c.fillStyle = "#ffffff";
        c.globalAlpha = 0.7;
        c.fillRect(left - 14 - ((t * 40 + i * 7) % 8), y, 10, 1);
        c.globalAlpha = 1;
        break;
      }
      case "waves": {
        const k = (t * 1.5 + i / 3) % 1;
        c.strokeStyle = "#ffffff";
        c.globalAlpha = 1 - k;
        c.beginPath();
        c.arc(cx + w * 0.4, top + h * 0.4, 4 + k * 12, -0.6, 0.6);
        c.stroke();
        c.globalAlpha = 1;
        break;
      }
    }
  }
}

function drawDecor(c: CanvasRenderingContext2D, d: string, cx: number, top: number, w: number, h: number, t: number) {
  switch (d) {
    case "ha":
      if (Math.sin(t * 5) > 0) pixelTextOutlined(c, "HA!", Math.round(cx + w * 0.3), Math.round(top - 6), "#ffd23f");
      break;
    case "achoo":
      if (t % 2.2 > 1.7) pixelTextOutlined(c, "ACHOO!", Math.round(cx - 12), Math.round(top - 8), "#ffffff");
      break;
    case "tears":
      drawParticles(c, "drops", cx, top - h * 0.2, w * 0.5, h * 0.6, t, 0.6);
      break;
    case "think": {
      c.fillStyle = "#ffffff";
      c.fillRect(Math.round(cx + w * 0.35), Math.round(top - 2), 2, 2);
      c.fillRect(Math.round(cx + w * 0.45), Math.round(top - 7), 3, 3);
      c.fillRect(Math.round(cx + w * 0.5), Math.round(top - 19), 13, 10);
      pixelTextOutlined(c, Math.sin(t * 2) > 0 ? "?" : "!", Math.round(cx + w * 0.5 + 5), Math.round(top - 17), "#2456e8");
      break;
    }
    case "juggle":
      for (let k = 0; k < 3; k++) {
        const a = t * 4 + (k * Math.PI * 2) / 3;
        c.fillStyle = HUES[k * 2];
        c.fillRect(Math.round(cx + Math.cos(a) * 10), Math.round(top - 6 + Math.sin(a) * 8 - Math.abs(Math.cos(a)) * 4), 3, 3);
      }
      break;
    default:
      drawParticles(c, d as Particle, cx, top, w, h, t, 1);
  }
}

/* ---------------------------------------------------------------- little demo pictures (cards, title) */

/** One character for a picture card or the title screen. */
export function demoActor(spriteId: string, o: { anim?: AnimId; adj?: string; count?: number } = {}): Actor {
  const a = newActor(spriteById(spriteId) ?? spriteById("mystery")!, spriteId, 0);
  if (o.adj) {
    const e = adjectiveEffect(o.adj);
    if (e) applyMod(a, e);
  }
  if (o.anim) a.anim = o.anim;
  if (o.count) a.count = o.count;
  a.x = 32;
  a.y = 46;
  return a;
}

/** Draws a demo character on a small (64×48) card canvas. */
export function drawDemo(c: CanvasRenderingContext2D, a: Actor, t: number) {
  c.imageSmoothingEnabled = false;
  c.clearRect(0, 0, c.canvas.width, c.canvas.height);
  const scale = a.scale;
  // Cards are small: keep giant things on the card, but still bigger than normal.
  const card = { ...a, scale: Math.max(0.45, Math.min(scale, 1.15)) * (a.count > 1 ? 0.75 : 1), x: c.canvas.width / 2, y: c.canvas.height - 3, demo: true };
  if (card.anim === "fly" || card.anim === "float" || card.anim === "jump") card.y = c.canvas.height - 6;
  drawActor(c, card, t, false);
}
