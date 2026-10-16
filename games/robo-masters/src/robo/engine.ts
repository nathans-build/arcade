import type { ChipAudio } from "../kit/audio";
import type { Band } from "./band";
import { buildLevel, SCREEN_H, SCREEN_W } from "./levels";
import { drawGame, drawPreview, themeFor, type Look, type Particle } from "./render";
import { FINAL_BOSS, POWERS, ROBOTS, type PowerId, type StageId } from "./robots";
import type { AnswerResult } from "./rules";
import { NO_INPUT, Sim, type Mode, type SimEvent } from "./sim";

export interface Hud {
  energy: number;
  lives: number;
  power: number;
  sel: PowerId | null;
  powers: PowerId[];
  score: number;
  mode: Mode;
  bossHp: number;
  bossMax: number;
  weakReady: boolean;
  progress: number;
  checkpoint: number;
}

export interface EngineCallbacks {
  onHud: (h: Hud) => void;
  onBossIntro: () => void;
  onQuestion: () => void;
  onCleared: () => void;
  onGameOver: () => void;
  onNote?: (text: string) => void;
}

type Held = "left" | "right" | "jump" | "shoot";
type Press = "shoot" | "power" | "cycle";

const STEP = 1000 / 60;

export class RoboEngine {
  sim: Sim | null = null;
  private ctx: CanvasRenderingContext2D;
  private look: Look | null = null;
  private preview: { sim: Sim; look: Look } | null = null;
  private particles: Particle[] = [];
  private banner: { text: string; sub?: string; t: number } | null = null;
  private held: Record<Held, boolean> = { left: false, right: false, jump: false, shoot: false };
  private pressed: Record<Press, boolean> = { shoot: false, power: false, cycle: false };
  /** A jump tap shorter than one frame still counts. */
  private jumpTap = false;
  private raf = 0;
  private last = 0;
  private acc = 0;
  private frame = 0;
  paused = false;
  private hudTick = 0;

  constructor(canvas: HTMLCanvasElement, private audio: ChipAudio, private cb: EngineCallbacks) {
    canvas.width = SCREEN_W * 2;
    canvas.height = SCREEN_H * 2;
    this.ctx = canvas.getContext("2d")!;
    this.ctx.imageSmoothingEnabled = false;
  }

  start() {
    const loop = (now: number) => {
      this.raf = requestAnimationFrame(loop);
      if (!this.last) this.last = now;
      this.acc = Math.min(this.acc + (now - this.last), STEP * 5);
      this.last = now;
      while (this.acc >= STEP) {
        this.acc -= STEP;
        this.tick();
      }
      this.draw();
    };
    this.raf = requestAnimationFrame(loop);
  }

  stop() {
    cancelAnimationFrame(this.raf);
  }

  /** Menus: a stage scrolls slowly behind the panels. */
  showPreview(id: StageId, band: Band) {
    this.sim = null;
    const sim = new Sim(buildLevel(id, band), band, []);
    this.preview = { sim, look: lookFor(id) };
  }

  startStage(id: StageId, band: Band, powers: PowerId[]) {
    this.preview = null;
    this.sim = new Sim(buildLevel(id, band), band, powers);
    this.look = lookFor(id);
    this.particles = [];
    this.paused = false;
    this.releaseAll();
    const name = id === "fortress" ? FINAL_BOSS.stage.name : ROBOTS.find((r) => r.id === id)!.stage.name;
    this.banner = { text: "READY!", sub: name.toUpperCase(), t: 0 };
    this.pushHud();
  }

  setHeld(k: Held, on: boolean) {
    this.held[k] = on;
    if (k === "shoot" && on) this.pressed.shoot = true;
    if (k === "jump" && on) this.jumpTap = true;
  }

  press(k: Press) {
    this.pressed[k] = true;
  }

  releaseAll() {
    this.held = { left: false, right: false, jump: false, shoot: false };
    this.pressed = { shoot: false, power: false, cycle: false };
    this.jumpTap = false;
  }

  togglePause(force?: boolean): boolean {
    this.paused = force ?? !this.paused;
    if (this.paused) this.releaseAll();
    return this.paused;
  }

  answer(correct: boolean): AnswerResult | null {
    if (!this.sim || this.sim.s.mode !== "quiz") return null;
    const res = this.sim.answer(correct);
    this.handle(this.sim.drain());
    this.pushHud();
    return res;
  }

  resume() {
    if (!this.sim) return;
    this.sim.resume();
    this.releaseAll();
    this.handle(this.sim.drain());
    this.pushHud();
  }

  /** Debug hook: straight to the boss. */
  warpToBoss() {
    this.sim?.warpToBoss();
    if (this.sim) this.handle(this.sim.drain());
  }

  /** Debug hook: open the boss's reboot panel now. */
  forceQuestion() {
    this.sim?.forceQuestion();
    if (this.sim) this.handle(this.sim.drain());
  }

  private tick() {
    this.frame++;
    if (this.banner) {
      this.banner.t++;
      if (this.banner.t > 110) this.banner = null;
    }
    this.particles = this.particles.filter((p) => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.08;
      return --p.life > 0;
    });
    const sim = this.sim;
    if (!sim || this.paused) return;
    const h = this.held;
    const input = {
      left: h.left,
      right: h.right,
      jump: h.jump || this.jumpTap,
      // Holding Z keeps firing (kinder on tablets).
      shoot: this.pressed.shoot || (h.shoot && this.frame % 10 === 0),
      power: this.pressed.power,
      cycle: this.pressed.cycle,
    };
    this.pressed = { shoot: false, power: false, cycle: false };
    this.jumpTap = false;
    sim.step(sim.s.mode === "play" || sim.s.mode === "boss" ? input : NO_INPUT);
    this.handle(sim.drain());
    if (++this.hudTick % 6 === 0) this.pushHud();
  }

  private sparks(x: number, y: number, colors: string[], n: number, speed = 1.6) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const v = Math.random() * speed + 0.4;
      this.particles.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 0.8, life: 30 + Math.random() * 20, max: 50, color: colors[i % colors.length], size: Math.random() < 0.3 ? 3 : 2 });
    }
  }

  private note(text: string, sub?: string) {
    this.banner = { text, sub, t: 40 };
  }

  private handle(events: SimEvent[]) {
    const a = this.audio;
    const sim = this.sim;
    for (const e of events) {
      switch (e.type) {
        case "shoot": a.shoot(); break;
        case "jump": a.jump(); break;
        case "enemyHit": a.blip(); this.sparks(e.x, e.y, ["#ffffff", "#5ef0ff"], 4, 1); break;
        case "short":
          a.explode();
          this.sparks(e.x, e.y, ["#ffd23f", "#5ef0ff", "#ffffff", "#9aa4c8"], 16);
          break;
        case "hurt": a.tone(160, 0.18, "sawtooth", 0.3, 80); break;
        case "pit": a.tone(400, 0.4, "triangle", 0.4, 60); break;
        case "lifeLost": a.crash(); break;
        case "respawn": this.note("READY!"); break;
        case "gameOver": a.gameOver(); this.cb.onGameOver(); break;
        case "pickup":
          if (e.kind === "capsule") { a.levelUp(); this.note("1-UP!", "FULL ENERGY + POWER"); }
          else a.tone(e.kind === "bolt" ? 1200 : 900, 0.08, "square", 0.25, 1600);
          break;
        case "checkpoint": a.checkpoint(); this.note("CHECKPOINT!"); break;
        case "gate": a.levelUp(); this.note("POWER SPOT OPEN!", "GRAB THE 1-UP"); break;
        case "power": {
          a.tone(500, 0.2, "square", 0.3, 1200);
          const p = sim?.s.p;
          if (p) this.sparks(p.x + 6, p.y + 10, [POWERS[e.power].color, POWERS[e.power].color2], 10, 1.2);
          break;
        }
        case "noPower":
          a.tone(140, 0.12, "square", 0.25);
          if (e.reason === "none") this.note("NO POWERS YET", "REBOOT A ROBO MASTER TO EARN ONE");
          else if (e.reason === "meter") this.note("POWER METER LOW", "GRAB BLUE CAPSULES");
          else if (e.reason === "ground") this.note("USE IT ON THE GROUND");
          else this.note("USE IT IN THE AIR");
          break;
        case "cycle": a.blip(); this.note(POWERS[e.power].name.toUpperCase()); break;
        // The warning jingle and the fight music are started by the game (cb.onBossIntro).
        case "bossIntro": this.note("WARNING!", this.look?.bossName); this.cb.onBossIntro(); break;
        case "bossStart": break;
        case "panelHit": {
          a.tone(1000, 0.06, "square", 0.25);
          const b = sim?.s.boss;
          if (b) this.sparks(b.x + 13, b.y + 15, ["#5fff8a", "#ffffff"], 5, 1);
          break;
        }
        case "question": a.tone(660, 0.12, "square", 0.3, 990); this.cb.onQuestion(); break;
        case "weak": a.tone(880, 0.3, "triangle", 0.4, 1760); this.note("WEAK SPOT!", "NEXT RIGHT ANSWER = DOUBLE REBOOT"); break;
        case "bossHit": {
          a.correct();
          const b = sim?.s.boss;
          if (b) this.sparks(b.x + 13, b.y + 15, ["#ffd23f", "#5ef0ff", "#ffffff"], e.weakness ? 40 : 22, 2.2);
          break;
        }
        case "blocked": a.wrong(); break;
        case "bossDown": {
          a.levelUp();
          const b = sim?.s.boss;
          if (b) for (let i = 0; i < 4; i++) this.sparks(b.x + 13, b.y + 15, ["#ffd23f", "#5ef0ff", "#ffffff", "#ff5ec8"], 20, 2.6);
          this.note("REBOOTED!");
          break;
        }
        case "clear": a.stopMusic(); this.cb.onCleared(); break;
        case "bossAttack": break;
      }
    }
  }

  private pushHud() {
    const sim = this.sim;
    if (!sim) return;
    const s = sim.s;
    this.cb.onHud({
      energy: Math.max(0, s.energy), lives: s.lives, power: s.power, sel: sim.selectedPower, powers: s.powers, score: s.score, mode: s.mode,
      bossHp: s.fight?.hp ?? 0, bossMax: s.fight?.maxHp ?? 0, weakReady: !!s.fight?.weakReady, progress: sim.progress(), checkpoint: s.checkpoint,
    });
  }

  private draw() {
    const ctx = this.ctx;
    ctx.setTransform(2, 0, 0, 2, 0, 0);
    ctx.imageSmoothingEnabled = false;
    if (this.sim && this.look) {
      drawGame(ctx, this.sim, this.look, this.particles, this.frame, this.banner);
      if (this.paused) {
        ctx.fillStyle = "#00000088";
        ctx.fillRect(0, 0, SCREEN_W, SCREEN_H);
      }
    } else if (this.preview) {
      drawPreview(ctx, this.preview.sim, this.preview.look, this.frame);
    } else {
      ctx.fillStyle = "#050818";
      ctx.fillRect(0, 0, SCREEN_W, SCREEN_H);
    }
  }
}

export function lookFor(id: StageId): Look {
  if (id === "fortress") return { theme: themeFor("fortress"), boss: "static", bossName: FINAL_BOSS.name };
  const r = ROBOTS.find((x) => x.id === id)!;
  return { theme: themeFor(id), boss: r.id, bossName: r.name };
}
