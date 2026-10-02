/*
 * Canvas engine: runs the simulation, draws the 320×200 screen and maps input.
 * The React shell (PlantsVsUndead.tsx) owns menus, the seed tray and every question panel.
 */
import type { ChipAudio } from "@/kit";
import { PARTS, type Band, type PlantKind } from "@/data/parts";
import { drawText, measure } from "./font";
import { CELL_H, CELL_W, COLS, H, LAWN_X, LAWN_Y, LEVELS, PLANTS, ROWS, TRAY, UNDEAD, W, cellX, cellY } from "./defs";
import { Sim, STORE_MAX, type Fx, type MoteKind, type Plant, type SimEvent, type Undead } from "./sim";
import { sprite, type Variant } from "./sprites";

export type Tool = PlantKind | "shovel" | null;

export interface CardState {
  kind: PlantKind;
  price: number;
  cost: number;
  available: boolean;
  learned: boolean;
  discount: boolean;
  /** 0 = ready, 1 = just planted. */
  recharge: number;
  affordable: boolean;
}

export interface HudState {
  glucose: number;
  score: number;
  hearts: number;
  maxHearts: number;
  level: number;
  levelName: string;
  wave: number;
  waves: number;
  phase: string;
  countdown: number;
  sky: number;
  cold: boolean;
  store: { light: number; water: number; co2: number };
  tool: Tool;
  cards: CardState[];
  message: string;
}

export interface EngineCallbacks {
  onHud: (h: HudState) => void;
  /** A card whose question has not been answered this level was picked. */
  onLearn: (kind: PlantKind) => void;
  onWaveClear: (info: { level: number; wave: number; lastOfLevel: boolean; final: boolean }) => void;
  onLevelStart: (level: number) => void;
  onGameOver: (won: boolean) => void;
}

/** Where each store icon sits in the HUD bar (fly-to targets). */
const ICON_AT: Record<MoteKind | "glucose", [number, number]> = {
  light: [58, 7],
  water: [87, 7],
  co2: [116, 7],
  glucose: [7, 8],
};

export const LABELS: Record<Band, [string, string, string, string]> = {
  0: ["SUN", "WATER", "AIR", "FOOD"],
  1: ["LIGHT", "WATER", "CO₂", "SUGAR"],
  2: ["LIGHT", "H₂O", "CO₂", "C₆H₁₂O₆"],
  3: ["LIGHT", "H₂O", "CO₂", "C₆H₁₂O₆"],
};

export class Engine {
  readonly sim = new Sim();
  private ctx: CanvasRenderingContext2D;
  private raf = 0;
  private last = 0;
  playing = false;
  paused = false;
  /** A question panel is open: the world waits. */
  modal = false;
  demoMode = true;
  timeScale = 1;
  band: Band = 0;
  tool: Tool = null;
  cursor = { col: 2, row: 2, visible: false, keyboard: false };
  private banner: { text: string; sub: string; t: number; color: string } | null = null;
  private lastHud = "";
  private hudT = 0;
  private soundT: Record<string, number> = {};
  private now = 0;
  private message = "";
  private messageT = 0;

  constructor(canvas: HTMLCanvasElement, private audio: ChipAudio, private cb: EngineCallbacks) {
    canvas.width = W;
    canvas.height = H;
    this.ctx = canvas.getContext("2d")!;
    this.ctx.imageSmoothingEnabled = false;
  }

  start() {
    const loop = (t: number) => {
      const dt = Math.max(0, Math.min(0.05, (t - (this.last || t)) / 1000));
      this.last = t;
      this.tick(dt);
      this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
  }

  stop() {
    cancelAnimationFrame(this.raf);
  }

  /* ------------------------------------------------------------ game flow */

  /** Title-screen scene: a few plants and undead posing on the lawn. */
  demo(band: Band) {
    this.band = band;
    this.demoMode = true;
    this.playing = false;
    this.modal = false;
    this.paused = false;
    this.tool = null;
    this.banner = null;
    const s = this.sim;
    s.newGame(band, 7);
    s.events = [];
    const rows = s.lanes;
    const put = (kind: PlantKind, col: number, row: number) => {
      if (!rows.includes(row)) return;
      const d = PLANTS[kind];
      s.plants.push({ id: 900 + s.plants.length, kind, col, row, hp: d.hp, maxHp: d.hp, t: 9, act: 0, flash: 0, age: 9, phase: col + row });
    };
    put("sunleaf", 0, 1); put("slinger", 1, 1); put("rootknot", 3, 1);
    put("sunleaf", 0, 2); put("stem", 1, 2); put("pollen", 2, 2); put("thorn", 4, 2);
    put("chloro", 0, 3); put("frond", 1, 3); put("berry", 3, 3);
    put("stoma", 0, 0); put("slinger", 1, 0); put("sunleaf", 0, 4); put("slinger", 2, 4);
    const u1 = s.spawn("grumbones", rows[0] === 0 ? 1 : 1, 232);
    const u2 = s.spawn("rotling", 2, 262);
    const u3 = s.spawn("frostwraith", 3, 250);
    const u4 = s.spawn("blightbug", 2, 292);
    const u5 = s.spawn(rows.includes(0) ? "shade" : "stump", rows.includes(0) ? 0 : 3, 290);
    for (const u of [u1, u2, u3, u4, u5]) u.speed = 0;
    s.motes.push({ id: 991, kind: "light", x: 140, y: 60, vx: 0, vy: 0, landY: 60, life: 1e9, value: 1 });
    s.motes.push({ id: 992, kind: "co2", x: 196, y: 120, vx: 0, vy: 0, landY: NaN, life: 1e9, value: 1 });
  }

  newGame(band: Band) {
    this.band = band;
    this.demoMode = false;
    this.playing = true;
    this.paused = false;
    this.modal = false;
    this.tool = null;
    this.cursor = { col: 2, row: 2, visible: false, keyboard: false };
    this.sim.newGame(band);
    this.drainEvents();
    this.publish(true);
  }

  togglePause(force?: boolean) {
    if (!this.playing) return this.paused;
    this.paused = force ?? !this.paused;
    return this.paused;
  }

  setModal(on: boolean) {
    this.modal = on;
  }

  /** After the between-wave checkpoint. */
  resolveCheckpoint(correct: boolean) {
    this.modal = false;
    const s = this.sim;
    const wasFinal = s.level >= LEVELS.length && s.wave >= s.wavesInLevel;
    s.resolveHold(correct);
    if (wasFinal && s.phase === "over") {
      this.playing = false;
      this.audio.levelUp();
      this.cb.onGameOver(true);
      return;
    }
    if (s.phase === "prewave") this.say(`WAVE ${s.wave} IS COMING`, "PLANT AND GATHER!", "#6ea0ff");
    this.drainEvents();
    this.publish(true);
  }

  /** The player answered a seed card's question. */
  finishLearn(kind: PlantKind, correct: boolean) {
    this.modal = false;
    this.sim.learn(kind, correct);
    this.tool = kind;
    this.publish(true);
  }

  /* ------------------------------------------------------------ input */

  select(tool: Tool) {
    if (!this.playing || this.paused || this.modal) return;
    if (tool === null || tool === "shovel") {
      this.tool = this.tool === tool ? null : tool;
      this.publish(true);
      return;
    }
    if (!this.sim.available.includes(tool)) {
      this.flashMessage("NOT YET — LATER LEVEL");
      this.sound("deny");
      return;
    }
    if (!this.sim.learned.has(tool)) {
      this.modal = true;
      this.tool = tool;
      this.publish(true);
      this.cb.onLearn(tool);
      return;
    }
    this.tool = this.tool === tool ? null : tool;
    this.audio.blip();
    this.publish(true);
  }

  moveCursor(dc: number, dr: number) {
    if (!this.playing || this.paused || this.modal) return;
    const rows = this.sim.lanes;
    this.cursor.keyboard = true;
    if (!this.cursor.visible) {
      this.cursor.visible = true;
    } else {
      this.cursor.col = Math.max(0, Math.min(COLS - 1, this.cursor.col + dc));
      let r = this.cursor.row + dr;
      while (r >= 0 && r < ROWS && !rows.includes(r)) r += dr || 1;
      if (r >= rows[0] && r <= rows[rows.length - 1]) this.cursor.row = r;
    }
    if (!rows.includes(this.cursor.row)) this.cursor.row = rows[Math.floor(rows.length / 2)];
    this.sim.collectCell(this.cursor.col, this.cursor.row);
    this.drainEvents();
  }

  /** Space / Enter: plant (or dig) at the cursor. */
  actAtCursor() {
    if (!this.playing || this.paused || this.modal) return;
    this.cursor.visible = true;
    this.useTool(this.cursor.col, this.cursor.row);
  }

  /** X / Delete: dig up the plant under the cursor. */
  shovelAtCursor() {
    if (!this.playing || this.paused || this.modal) return;
    this.cursor.visible = true;
    if (!this.sim.shovel(this.cursor.col, this.cursor.row)) this.flashMessage("NOTHING TO DIG UP");
    this.drainEvents();
    this.publish(true);
  }

  private useTool(col: number, row: number) {
    const s = this.sim;
    if (this.tool === "shovel") {
      if (s.shovel(col, row)) this.tool = null;
      else this.flashMessage("NOTHING TO DIG UP");
    } else if (this.tool) {
      const why = s.whyNot(this.tool, col, row);
      if (why) {
        this.flashMessage(why === "NEED GLUCOSE" ? `NEED ${s.priceOf(this.tool)} GLUCOSE` : why);
        this.sound("deny");
      } else {
        s.plant(this.tool, col, row);
        this.tool = null;
      }
    } else if (!s.collectCell(col, row)) {
      const p = s.plantAt(col, row);
      this.flashMessage(p ? PARTS[p.kind].name.toUpperCase() : "PICK A SEED CARD FIRST");
    }
    this.drainEvents();
    this.publish(true);
  }

  private toCell(x: number, y: number): { col: number; row: number } | null {
    const col = Math.floor((x - LAWN_X) / CELL_W);
    const row = Math.floor((y - LAWN_Y) / CELL_H);
    if (col < 0 || col >= COLS || row < 0 || row >= ROWS) return null;
    return { col, row };
  }

  /** A tap or click at logical (x, y). */
  tapAt(x: number, y: number) {
    if (!this.playing || this.paused || this.modal) return;
    if (this.sim.collectAt(x, y, 13) > 0) {
      this.drainEvents();
      this.publish(true);
      return;
    }
    const c = this.toCell(x, y);
    if (!c) return;
    this.cursor = { col: c.col, row: c.row, visible: true, keyboard: false };
    if (!this.sim.rowPlayable(c.row)) {
      this.flashMessage("FLOWER BED — PLANT ON THE GRASS");
      return;
    }
    this.useTool(c.col, c.row);
  }

  /** Mouse hover or a finger dragging: move the cursor and sweep up motes. */
  hoverAt(x: number, y: number) {
    if (!this.playing || this.paused || this.modal) return;
    if (this.sim.collectAt(x, y, 9) > 0) this.drainEvents();
    const c = this.toCell(x, y);
    if (c && this.sim.rowPlayable(c.row)) this.cursor = { col: c.col, row: c.row, visible: true, keyboard: false };
  }

  hideCursor() {
    if (!this.cursor.keyboard) this.cursor.visible = false;
  }

  /* ------------------------------------------------------------ loop */

  private tick(dt: number) {
    this.now += dt;
    const s = this.sim;
    if (this.demoMode) {
      s.time += dt;
      for (const p of s.plants) p.age += dt;
      for (const u of s.undead) u.walk += dt * 0.8;
    } else if (this.playing && !this.paused && !this.modal) {
      s.update(dt * this.timeScale);
      if (this.cursor.visible && this.cursor.keyboard) s.collectCell(this.cursor.col, this.cursor.row);
      this.drainEvents();
    }
    if (this.banner) {
      this.banner.t -= dt;
      if (this.banner.t <= 0) this.banner = null;
    }
    if (this.messageT > 0) this.messageT -= dt;
    this.hudT -= dt;
    if (this.hudT <= 0 && this.playing) {
      this.hudT = 0.1;
      this.publish(false);
    }
    this.render();
  }

  private say(text: string, sub: string, color: string, t = 2.6) {
    this.banner = { text, sub, t, color };
  }

  private flashMessage(m: string) {
    this.message = m;
    this.messageT = 1.6;
  }

  private sound(name: string) {
    const t = this.soundT[name] ?? -1;
    if (this.now - t < 0.07) return;
    this.soundT[name] = this.now;
    const a = this.audio;
    switch (name) {
      case "shoot": a.tone(760, 0.05, "square", 0.08, 380); break;
      case "hit": a.tone(240, 0.04, "square", 0.1, 160); break;
      case "plant": a.tone(330, 0.12, "triangle", 0.4, 660); break;
      case "collect": a.tone(1175, 0.06, "square", 0.18, 1568); break;
      case "glucose": a.tone(988, 0.08, "triangle", 0.3, 1319); break;
      case "cart": a.noise(0.5, 0.35); a.tone(200, 0.4, "square", 0.2, 600); break;
      case "burst": a.explode(); break;
      case "chomp": a.tone(130, 0.05, "sawtooth", 0.1, 90); break;
      case "shovel": a.tone(300, 0.1, "square", 0.2, 150); break;
      case "deny": a.tone(150, 0.12, "square", 0.2); break;
      case "defeat": a.tone(520, 0.14, "triangle", 0.25, 130); break;
    }
  }

  private drainEvents() {
    const s = this.sim;
    const evs: SimEvent[] = s.events;
    s.events = [];
    for (const e of evs) {
      switch (e.type) {
        case "sound":
          this.sound(e.name);
          break;
        case "levelStart": {
          const d = LEVELS[e.level - 1];
          this.say(`LEVEL ${e.level}: ${d.name}`, d.light < 0.7 ? "DIM LIGHT: LEAVES MAKE LESS FOOD" : "GATHER SUNLIGHT AND PLANT!", "#ffd23f", 3.2);
          if (e.level > 1) this.audio.levelUp();
          this.cb.onLevelStart(e.level);
          break;
        }
        case "waveStart":
          this.audio.checkpoint();
          this.say(e.big ? "A HUGE WAVE!" : `WAVE ${e.wave}!`, "HERE COME THE UNDEAD", e.big ? "#e3262f" : "#ffd23f");
          break;
        case "boss":
          this.say("THE WEED LICH!", "IT SUMMONS BLIGHT BUGS", "#9b5de5", 3);
          this.audio.tone(98, 0.6, "sawtooth", 0.3, 49);
          break;
        case "heartLost":
          this.audio.crash();
          this.say("THE GREENHOUSE!", "AN UNDEAD GOT IN", "#e3262f", 1.6);
          break;
        case "waveClear":
          this.audio.correct();
          this.cb.onWaveClear(e);
          break;
        case "gameOver":
          this.playing = false;
          this.audio.gameOver();
          this.cb.onGameOver(false);
          break;
      }
    }
  }

  publish(force: boolean) {
    const s = this.sim;
    const cards: CardState[] = TRAY.map((kind) => {
      const d = PLANTS[kind];
      const price = s.priceOf(kind);
      return {
        kind, price, cost: d.cost, available: s.available.includes(kind), learned: s.learned.has(kind), discount: s.discount.has(kind),
        recharge: d.cooldown ? Math.min(1, (s.cooldown[kind] ?? 0) / d.cooldown) : 0, affordable: s.glucose >= price,
      };
    });
    const h: HudState = {
      glucose: s.glucose, score: s.score, hearts: s.hearts, maxHearts: s.tune.hearts, level: s.level, levelName: s.levelDef.name,
      wave: s.wave, waves: s.wavesInLevel, phase: s.phase, countdown: Math.ceil(s.phaseT), sky: Math.round(s.sky * 100) / 100, cold: s.cold,
      store: { ...s.store }, tool: this.tool, cards, message: this.messageT > 0 ? this.message : "",
    };
    const key = JSON.stringify(h);
    if (!force && key === this.lastHud) return;
    this.lastHud = key;
    this.cb.onHud(h);
  }

  /* ------------------------------------------------------------ drawing */

  private render() {
    const g = this.ctx;
    const s = this.sim;
    g.fillStyle = "#0a0f2e";
    g.fillRect(0, 0, W, H);
    this.drawLawn();
    // Entities, top row first
    for (let row = 0; row < ROWS; row++) {
      for (const p of s.plants) if (p.row === row) this.drawPlant(p);
      for (const u of s.undead.filter((u) => u.row === row).sort((a, b) => b.x - a.x)) this.drawUndead(u);
    }
    this.drawStemFlow();
    for (const sh of s.shots) this.drawShot(sh);
    this.drawCarts();
    this.drawSkyTint();
    for (const m of s.motes) this.drawMote(m);
    for (const f of s.fx) this.drawFx(f);
    this.drawCursor();
    this.drawHud();
    this.drawBossBar();
    this.drawBanner();
    if (this.messageT > 0 && this.playing) {
      const w = measure(this.message) + 8;
      g.fillStyle = "rgba(5,8,24,0.85)";
      g.fillRect(160 - w / 2, 186, w, 10);
      drawText(g, this.message, 160, 188, "#ffd23f", { align: "center" });
    }
    if (s.phase === "hold" && this.playing) {
      g.fillStyle = "rgba(5,8,24,0.45)";
      g.fillRect(0, LAWN_Y, W, H - LAWN_Y);
    }
  }

  private drawLawn() {
    const g = this.ctx;
    const s = this.sim;
    for (let row = 0; row < ROWS; row++) {
      const y = cellY(row);
      if (!s.rowPlayable(row)) {
        // Flower bed (not plantable)
        g.fillStyle = "#5a3418";
        g.fillRect(LAWN_X, y, COLS * CELL_W, CELL_H);
        g.fillStyle = "#1f8a3a";
        g.fillRect(LAWN_X, row === 0 ? y + CELL_H - 6 : y, COLS * CELL_W, 6);
        for (let i = 0; i < 26; i++) {
          const fx = LAWN_X + 6 + i * 10.4 + ((i * 7) % 5);
          const fy = y + 10 + ((i * 13) % 17);
          g.fillStyle = "#1f8a3a";
          g.fillRect(fx, fy + 2, 1, 4);
          g.fillStyle = ["#ff8fc8", "#ffd23f", "#9b5de5", "#e3262f"][i % 4];
          g.fillRect(fx - 1, fy, 3, 2);
          g.fillRect(fx, fy - 1, 1, 4);
        }
        continue;
      }
      for (let col = 0; col < COLS; col++) {
        const even = (row + col) % 2 === 0;
        g.fillStyle = even ? "#3f9a3a" : "#4aa844";
        g.fillRect(cellX(col), y, CELL_W, CELL_H);
        g.fillStyle = even ? "#378a33" : "#43993e";
        for (let k = 0; k < 4; k++) g.fillRect(cellX(col) + 4 + k * 7, y + 6 + ((k * 11 + col * 5) % 22), 1, 2);
      }
    }
    // Greenhouse on the left
    g.fillStyle = "#cfefff";
    g.fillRect(0, LAWN_Y, 12, H - LAWN_Y);
    g.fillStyle = "#7ff3ff";
    for (let y = LAWN_Y + 4; y < H; y += 12) g.fillRect(2, y, 8, 8);
    g.fillStyle = "#ffffff";
    g.fillRect(11, LAWN_Y, 2, H - LAWN_Y);
    g.fillRect(0, LAWN_Y, 13, 2);
    // Path strip between greenhouse and lawn
    g.fillStyle = "#8a6a3a";
    g.fillRect(13, LAWN_Y, LAWN_X - 13, H - LAWN_Y);
    g.fillStyle = "#6a4a2a";
    for (let y = LAWN_Y + 3; y < H; y += 9) g.fillRect(16 + ((y * 3) % 9), y, 2, 1);
    // Dirt road on the right where the undead shamble in
    const rx = LAWN_X + COLS * CELL_W;
    g.fillStyle = "#6a4a2a";
    g.fillRect(rx, LAWN_Y, W - rx, H - LAWN_Y);
    g.fillStyle = "#4a3418";
    for (let y = LAWN_Y + 5; y < H; y += 11) g.fillRect(rx + 4 + ((y * 7) % 12), y, 3, 2);
    // Little picket fence posts
    g.fillStyle = "#f2ead0";
    for (let y = LAWN_Y + 2; y < H; y += 16) g.fillRect(rx, y, 2, 6);
    g.fillStyle = "#0a0f2e";
    g.fillRect(0, H - 3, W, 3);
  }

  private drawSkyTint() {
    const g = this.ctx;
    const s = this.sim;
    const sky = s.sky;
    if (sky < 0.99) {
      g.fillStyle = `rgba(10,15,46,${((1 - sky) * 0.8).toFixed(3)})`;
      g.fillRect(LAWN_X, LAWN_Y, COLS * CELL_W, H - LAWN_Y - 3);
    }
    for (const row of s.lanes) {
      if (!s.chilledRow(row)) continue;
      g.fillStyle = "rgba(190,240,255,0.16)";
      g.fillRect(LAWN_X, cellY(row), COLS * CELL_W, CELL_H);
      g.fillStyle = "#ffffff";
      for (let i = 0; i < 8; i++) {
        const fx = LAWN_X + ((i * 37 + this.now * 12) % (COLS * CELL_W));
        const fy = cellY(row) + ((i * 13 + this.now * 9) % CELL_H);
        g.fillRect(fx, fy, 1, 1);
      }
    }
  }

  private drawPlant(p: Plant) {
    const g = this.ctx;
    const s = this.sim;
    const x0 = cellX(p.col) + 6;
    const bob = Math.sin(s.time * 3 + p.phase) > 0 ? 0 : 1;
    const y0 = cellY(p.row) + 13 + bob;
    let v: Variant = "n";
    if (p.flash > 0) v = "flash";
    else if (s.chilledRow(p.row)) v = "frost";
    else if ((s.time + p.phase) % 4 < 0.14) v = "blink";
    const img = sprite(p.kind, v);
    // shadow
    g.fillStyle = "rgba(0,0,0,0.25)";
    g.fillRect(x0 + 3, cellY(p.row) + 32, 12, 2);
    if (p.act > 0) g.drawImage(img, x0 - 1, y0 + 2, img.width + 2, img.height - 2);
    else g.drawImage(img, x0, y0);
    if (p.kind === "berry" && p.age > 1.2 && Math.floor(s.time * 3) % 2 === 0) {
      g.fillStyle = "#ffd23f";
      g.fillRect(x0 + 8, y0 - 3, 2, 2);
    }
    if (p.hp < p.maxHp) this.bar(x0 + 2, cellY(p.row) + 34, 14, p.hp / p.maxHp, "#5fff8a");
  }

  private drawStemFlow() {
    const g = this.ctx;
    const s = this.sim;
    for (const st of s.plants) {
      if (st.kind !== "stem") continue;
      for (const p of s.plants) {
        if (p === st || Math.abs(p.col - st.col) + Math.abs(p.row - st.row) !== 1) continue;
        const ax = cellX(st.col) + 15;
        const ay = cellY(st.row) + 26;
        const bx = cellX(p.col) + 15;
        const by = cellY(p.row) + 26;
        for (let i = 0; i < 3; i++) {
          const t = (s.time * 0.8 + i / 3) % 1;
          g.fillStyle = i % 2 ? "#ffd23f" : "#6ea0ff";
          g.fillRect(Math.round(ax + (bx - ax) * t), Math.round(ay + (by - ay) * t), 2, 2);
        }
      }
    }
  }

  private drawUndead(u: Undead) {
    const g = this.ctx;
    const s = this.sim;
    const d = UNDEAD[u.kind];
    const frame = Math.floor(u.walk * 2) % 2;
    const v: Variant = u.flash > 0 ? "flash" : "n";
    const img = sprite(`${u.kind}${frame}`, v);
    let bottom = cellY(u.row) + 33;
    if (d.floats) bottom -= 4 + Math.round(Math.sin(s.time * 2.5 + u.id) * 2);
    if (u.kind === "weedlich") bottom += 2;
    let x = Math.round(u.x - img.width / 2);
    if (u.eating && Math.floor(u.walk * 4) % 2 === 0) x -= 1;
    g.fillStyle = "rgba(0,0,0,0.25)";
    g.fillRect(Math.round(u.x - img.width / 3), cellY(u.row) + 32, Math.round(img.width / 1.5), 2);
    g.drawImage(img, x, bottom - img.height);
    if (u.eating && Math.floor(u.walk * 4) % 2 === 0) {
      g.fillStyle = "#43d664";
      g.fillRect(x - 2, bottom - img.height + 12, 1, 1);
      g.fillRect(x - 3, bottom - img.height + 14, 1, 1);
    }
    if (u.slowT > 0) {
      g.fillStyle = "#ffd23f";
      for (let i = 0; i < 4; i++) g.fillRect(x + ((i * 5 + Math.floor(s.time * 8)) % img.width), bottom - img.height + ((i * 7) % img.height), 1, 1);
    }
    if (u.hp < u.maxHp && u.kind !== "weedlich") this.bar(Math.round(u.x - 7), bottom - img.height - 3, 14, u.hp / u.maxHp, "#e3262f");
  }

  private drawShot(sh: { kind: string; row: number; x: number; x0: number; t: number }) {
    const g = this.ctx;
    const y = cellY(sh.row) + 14;
    if (sh.kind === "seed") {
      const hop = Math.abs(Math.sin((sh.x - sh.x0) / 16)) * 4;
      g.drawImage(sprite("seedshot"), Math.round(sh.x - 2), Math.round(y - hop - 2));
    } else {
      const img = sprite("leafshot");
      const q = Math.floor(sh.t * 12) % 4;
      g.save();
      g.translate(Math.round(sh.x), y);
      g.rotate((q * Math.PI) / 2);
      g.drawImage(img, -4, -4);
      g.restore();
    }
  }

  private drawCarts() {
    const g = this.ctx;
    for (const c of this.sim.carts) {
      if (c.state === "gone") continue;
      const img = sprite("cart");
      const y = cellY(c.row) + 18;
      const jig = c.state === "rolling" ? Math.floor(this.now * 20) % 2 : 0;
      g.drawImage(img, Math.round(c.x - 9), y - jig);
    }
  }

  private drawMote(m: { kind: MoteKind; x: number; y: number; life: number; landY: number; id: number }) {
    const g = this.ctx;
    if (m.life < 2 && Math.floor(m.life * 8) % 2 === 0) return;
    const name = m.kind === "light" ? "sun" : m.kind === "co2" ? "co2" : "drop";
    const img = sprite(name);
    const pulse = m.kind === "light" ? Math.round(Math.sin(this.now * 6 + m.id) * 0.6) : 0;
    g.drawImage(img, Math.round(m.x - img.width / 2) - pulse, Math.round(m.y - img.height / 2) - pulse, img.width + pulse * 2, img.height + pulse * 2);
  }

  private drawFx(f: Fx) {
    const g = this.ctx;
    const k = f.t / f.life;
    switch (f.kind) {
      case "text":
        drawText(g, f.text ?? "", f.x, f.y, f.color ?? "#fff", { align: "center", shadow: "#000" });
        break;
      case "o2": {
        g.globalAlpha = 1 - k * 0.6;
        g.drawImage(sprite("o2"), Math.round(f.x - 4), Math.round(f.y - 4));
        drawText(g, "O₂", f.x + 6, f.y - 2, "#7ff3ff");
        g.globalAlpha = 1;
        break;
      }
      case "fly": {
        const [tx, ty] = ICON_AT[f.icon ?? "light"];
        const e = k * k;
        const x = f.x + (tx - f.x) * e;
        const y = f.y + (ty - f.y) * e;
        const name = f.icon === "light" ? "sun" : f.icon === "co2" ? "co2" : f.icon === "water" ? "drop" : "glucose";
        const img = sprite(name);
        g.drawImage(img, Math.round(x - img.width / 2), Math.round(y - img.height / 2));
        break;
      }
      case "spark":
        g.fillStyle = f.color ?? "#fff";
        g.fillRect(Math.round(f.x) - 1, Math.round(f.y) - 1, 3, 1);
        g.fillRect(Math.round(f.x), Math.round(f.y) - 2, 1, 3);
        break;
      case "cloud": {
        const w = f.w ?? 60;
        g.fillStyle = `rgba(255,210,63,${(0.55 * (1 - k)).toFixed(2)})`;
        for (let i = 0; i < 14; i++) {
          const cx = f.x + ((i * 23) % w) * Math.min(1, k * 3);
          const cy = f.y + ((i * 7) % 11) - 5 - k * 4;
          g.fillRect(Math.round(cx), Math.round(cy), 3, 3);
        }
        break;
      }
      case "burst": {
        const r = 6 + k * 34;
        g.strokeStyle = k < 0.5 ? "#ffd23f" : "#e3262f";
        g.lineWidth = 2;
        g.beginPath();
        g.arc(f.x, f.y, r, 0, Math.PI * 2);
        g.stroke();
        break;
      }
      case "poof":
        g.fillStyle = f.color ?? "#ccc";
        for (let i = 0; i < 6; i++) {
          const a = (i / 6) * Math.PI * 2;
          const r = 2 + k * 9;
          g.fillRect(Math.round(f.x + Math.cos(a) * r) - 1, Math.round(f.y + Math.sin(a) * r * 0.6) - 1, 3, 3);
        }
        break;
      case "crumb":
        g.fillStyle = f.color ?? "#fff";
        g.fillRect(Math.round(f.x), Math.round(f.y), 2, 2);
        break;
    }
  }

  private drawCursor() {
    if (!this.playing || !this.cursor.visible || this.modal) return;
    const g = this.ctx;
    const s = this.sim;
    const { col, row } = this.cursor;
    if (!s.rowPlayable(row)) return;
    const x = cellX(col);
    const y = cellY(row);
    const tool = this.tool;
    let ok = true;
    if (tool && tool !== "shovel") {
      ok = !s.whyNot(tool, col, row);
      if (!s.plantAt(col, row)) {
        g.globalAlpha = 0.5;
        g.drawImage(sprite(tool), x + 6, y + 13);
        g.globalAlpha = 1;
      }
    } else if (tool === "shovel") ok = !!s.plantAt(col, row);
    const on = Math.floor(this.now * 4) % 2 === 0;
    g.strokeStyle = !ok ? "#e3262f" : on ? "#ffd23f" : "#ffffff";
    g.lineWidth = 1;
    g.strokeRect(x + 0.5, y + 0.5, CELL_W - 1, CELL_H - 1);
    if (tool === "shovel") {
      g.fillStyle = "#c8c8d8";
      g.fillRect(x + 22, y + 3, 3, 6);
      g.fillStyle = "#9a6233";
      g.fillRect(x + 23, y + 9, 1, 5);
    }
  }

  private bar(x: number, y: number, w: number, f: number, color: string) {
    const g = this.ctx;
    g.fillStyle = "#1b1030";
    g.fillRect(x - 1, y - 1, w + 2, 3);
    g.fillStyle = color;
    g.fillRect(x, y, Math.max(0, Math.round(w * Math.max(0, Math.min(1, f)))), 1);
  }

  private drawHud() {
    const g = this.ctx;
    const s = this.sim;
    g.fillStyle = "#0a0f2e";
    g.fillRect(0, 0, W, LAWN_Y);
    g.fillStyle = "#2456e8";
    g.fillRect(0, LAWN_Y - 2, W, 1);
    g.fillStyle = "#e3262f";
    g.fillRect(0, LAWN_Y - 1, W, 1);
    // Glucose
    g.drawImage(sprite("glucose"), 3, 4);
    drawText(g, String(s.glucose), 14, 4, "#ffd23f", { scale: 2, shadow: "#000" });
    const labels = LABELS[this.band];
    // Photosynthesis meter: light + water + CO₂ → glucose + O₂
    const slots: [MoteKind, string][] = [["light", "sun"], ["water", "drop"], ["co2", "co2"]];
    slots.forEach(([k, icon], i) => {
      const x = 52 + i * 29;
      const img = sprite(icon);
      g.drawImage(img, x + (11 - img.width) / 2, 2 + (11 - img.height) / 2);
      const n = s.store[k];
      drawText(g, String(n), x + 13, 5, n > 0 ? "#ffffff" : "#e3262f");
      drawText(g, labels[i], x + 6, 15, "#6a78b8", { align: "center" });
      if (i < 2) drawText(g, "+", x + 22, 5, "#6a78b8");
      // fill bar under the count (how full the store is)
      g.fillStyle = "#1c2450";
      g.fillRect(x + 13, 11, 9, 1);
      g.fillStyle = "#6ea0ff";
      g.fillRect(x + 13, 11, Math.round((9 * n) / STORE_MAX), 1);
    });
    drawText(g, "→", 137, 5, "#ffd23f");
    // Reaction progress (the leaf factory at work)
    g.fillStyle = "#1c2450";
    g.fillRect(143, 5, 22, 5);
    if (s.react >= 0) {
      g.fillStyle = s.cold ? "#7ff3ff" : "#5fff8a";
      g.fillRect(143, 5, Math.round(22 * s.react), 5);
    }
    if (s.cold) {
      // frost on the leaf factory: cold slows the reaction
      g.fillStyle = "#ffffff";
      for (let i = 0; i < 5; i++) g.fillRect(145 + i * 4, i % 2 ? 4 : 10, 1, 1);
    }
    g.drawImage(sprite("glucose"), 169, 3);
    drawText(g, labels[3], 173, 15, "#6a78b8", { align: "center" });
    drawText(g, "+", 181, 5, "#6a78b8");
    g.drawImage(sprite("o2"), 188, 3);
    drawText(g, "O₂", 197, 15, "#6a78b8", { align: "center" });
    // Sky light
    const sky = s.sky;
    g.globalAlpha = 0.35 + 0.65 * sky;
    g.drawImage(sprite("sun"), 207, 2);
    g.globalAlpha = 1;
    drawText(g, `${Math.round(sky * 100)}%`, 213, 15, sky < 0.7 ? "#e3262f" : "#6a78b8", { align: "center" });
    // Wave meter
    const wx = 230;
    if (s.phase === "prewave" && this.playing) {
      drawText(g, `WAVE ${s.wave}/${s.wavesInLevel} IN ${Math.ceil(s.phaseT)}`, wx, 3, "#ffd23f");
    } else {
      drawText(g, `LV${s.level} WAVE ${s.wave}/${s.wavesInLevel}`, wx, 3, "#6ea0ff");
    }
    g.fillStyle = "#1c2450";
    g.fillRect(wx, 12, 86, 4);
    g.fillStyle = "#e3262f";
    g.fillRect(wx, 12, Math.round(86 * s.waveProgress), 4);
    g.fillStyle = "#f2ead0";
    g.fillRect(wx + Math.round(84 * s.waveProgress), 11, 3, 6);
  }

  private drawBossBar() {
    const boss = this.sim.undead.find((u) => u.kind === "weedlich");
    if (!boss) return;
    const g = this.ctx;
    g.fillStyle = "rgba(5,8,24,0.8)";
    g.fillRect(100, 23, 120, 9);
    drawText(g, "WEED LICH", 104, 25, "#9b5de5");
    this.bar(146, 27, 70, boss.hp / boss.maxHp, "#9b5de5");
  }

  private drawBanner() {
    const b = this.banner;
    if (!b) return;
    const g = this.ctx;
    const w = Math.max(measure(b.text, 2), measure(b.sub)) + 16;
    g.fillStyle = "rgba(5,8,24,0.82)";
    g.fillRect(160 - w / 2, 84, w, 30);
    g.fillStyle = b.color;
    g.fillRect(160 - w / 2, 84, w, 1);
    g.fillRect(160 - w / 2, 113, w, 1);
    drawText(g, b.text, 160, 89, b.color, { scale: 2, align: "center", shadow: "#000" });
    drawText(g, b.sub, 160, 104, "#ffffff", { align: "center" });
  }
}
