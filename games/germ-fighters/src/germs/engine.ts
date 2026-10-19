import type { ChipAudio } from "../kit/audio";
import { CLUE_RIGHT, POWER_UP } from "@/music";
import type { Band } from "./band";
import { BOOSTS, BOOST_IDS, type BoostId } from "./boosts";
import { buildLevel, SCREEN_H, SCREEN_W } from "./levels";
import { bossNameOf, drawGame, drawPreview, themeFor, type BossKey, type Gobbler, type Look, type Particle } from "./render";
import { POWERS, RUSH, ZONES, type PowerId, type StageId, type VirusId } from "./roster";
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
  /** Active power-ups with frames left. */
  boosts: { id: BoostId; left: number; max: number }[];
  cluesDone: number;
  cluesTotal: number;
  /** Lymph Node: which Major Virus is up (0-based). */
  rushIdx: number;
}

export interface EngineCallbacks {
  onHud: (h: Hud) => void;
  /** A boss is dropping in (a stage germ, or the next Major Virus). */
  onBossIntro: (boss: BossKey) => void;
  /** A question opened: the boss's antigen panel, or Antigen Clue n. */
  onQuestion: (kind: "boss" | "clue", n: number) => void;
  /** A Major Virus was identified (next: the one coming up, or null after the last). */
  onVirusDown?: (virus: VirusId, next: VirusId | null) => void;
  onCleared: () => void;
  onGameOver: () => void;
}

type Held = "left" | "right" | "jump" | "shoot";
type Press = "shoot" | "power" | "cycle";

const STEP = 1000 / 60;

export class GermEngine {
  sim: Sim | null = null;
  private ctx: CanvasRenderingContext2D;
  private look: Look | null = null;
  private preview: { sim: Sim; look: Look } | null = null;
  private particles: Particle[] = [];
  private gobblers: Gobbler[] = [];
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
  private stuckNote = 0;

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

  /** Starts a stage (the Lymph Node rush can start at Major Virus `rushFrom`). */
  startStage(id: StageId, band: Band, powers: PowerId[], rushFrom = 0) {
    this.preview = null;
    this.sim = new Sim(buildLevel(id, band), band, powers, undefined, rushFrom);
    this.look = lookFor(id);
    this.particles = [];
    this.gobblers = [];
    this.paused = false;
    this.releaseAll();
    const name = id === "rush" ? RUSH.stage.name : ZONES.find((z) => z.id === id)!.stage.name;
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

  /** Debug hook: straight to the boss (in the Lymph Node, optionally Major Virus n). */
  warpToBoss(virus?: number) {
    this.sim?.warpToBoss(virus);
    if (this.sim) this.handle(this.sim.drain());
  }

  /** Debug hook: grant a power-up now. */
  giveBoost(id: BoostId) {
    this.sim?.giveBoost(id, "pickup");
    if (this.sim) this.handle(this.sim.drain());
    this.pushHud();
  }

  /** Debug hook: open the boss's antigen panel now. */
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
    this.gobblers = this.gobblers.filter((g) => {
      g.t++;
      g.x += g.dir * 0.6;
      return g.t < 50;
    });
    const sim = this.sim;
    if (!sim || this.paused) return;
    const h = this.held;
    const input = {
      left: h.left,
      right: h.right,
      jump: h.jump || this.jumpTap,
      // Holding Z keeps zapping (kinder on tablets).
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
          // A germ poofs into harmless sparkles and bubbles; a macrophage pal gobbles them up.
          a.tone(880, 0.12, "triangle", 0.3, 1760);
          this.sparks(e.x, e.y, ["#ffe066", "#9affd8", "#ffffff", "#ff9ac8"], 16);
          if (this.gobblers.length < 3) this.gobblers.push({ x: e.x - 18, y: e.y + 2, t: 0, dir: 1 });
          break;
        case "split":
          a.tone(300, 0.1, "square", 0.2, 600);
          this.sparks(e.x, e.y, ["#8ae06a", "#ffffff"], 6, 1);
          this.note("SPLIT!", "BACTERIA DIVIDE IN TWO IF LEFT ALONE");
          break;
        case "stuck":
          if (this.frame - this.stuckNote > 30) a.tone(220, 0.08, "triangle", 0.25, 160);
          this.stuckNote = this.frame;
          this.sparks(e.x, e.y, ["#c8ff5a", "#ffffff"], 4, 0.6);
          break;
        case "hurt": a.tone(160, 0.18, "sawtooth", 0.3, 80); break;
        case "pit": a.tone(400, 0.4, "triangle", 0.4, 60); break;
        case "lifeLost": a.crash(); break;
        case "respawn": this.note("READY!"); break;
        case "gameOver": a.gameOver(); this.cb.onGameOver(); break;
        case "pickup":
          if (e.kind === "capsule") { a.levelUp(); this.note("1-UP!", "THE HEALED CELL SAYS THANK YOU"); }
          else a.tone(e.kind === "nutrient" ? 1200 : 900, 0.08, "square", 0.25, 1600);
          break;
        case "checkpoint": a.checkpoint(); this.note("CHECKPOINT!"); break;
        case "gate": a.levelUp(); this.note("CELL HEALED!", "GRAB THE 1-UP HEART"); break;
        case "power": {
          a.tone(500, 0.2, "square", 0.3, 1200);
          const p = sim?.s.p;
          if (p) this.sparks(p.x + 6, p.y + 10, [POWERS[e.power].color, POWERS[e.power].color2], 10, 1.2);
          break;
        }
        case "noPower":
          a.tone(140, 0.12, "square", 0.25);
          if (e.reason === "none") this.note("NO SKILLS YET", "IDENTIFY A STAGE GERM TO EARN ONE");
          else if (e.reason === "meter") this.note("SKILL METER LOW", "GRAB BLUE DROPS");
          else if (e.reason === "ground") this.note("USE IT ON THE GROUND");
          else this.note("USE IT IN THE AIR");
          break;
        case "cycle": a.blip(); this.note(POWERS[e.power].name.toUpperCase()); break;
        // The warning jingle and the fight music are started by the game (cb.onBossIntro).
        case "bossIntro": {
          const key = sim ? sim.bossKey : null;
          if (key) {
            this.note("WARNING!", bossNameOf(key));
            this.cb.onBossIntro(key);
          }
          break;
        }
        case "bossStart": break;
        case "panelHit": {
          a.tone(1000, 0.06, "square", 0.25);
          const b = sim?.s.boss;
          if (b) this.sparks(b.x + 13, b.y + 15, ["#5fff8a", "#ffffff"], 5, 1);
          break;
        }
        case "question": a.tone(660, 0.12, "square", 0.3, 990); this.cb.onQuestion("boss", 0); break;
        case "clue":
          a.tone(880, 0.1, "square", 0.3, 1320);
          this.sparks(e.x, e.y, ["#ffd23f", "#ffffff", "#c9b8ff"], 10, 1.2);
          this.cb.onQuestion("clue", e.n);
          break;
        case "clueDone": {
          this.sparks(e.x, e.y, e.correct ? ["#ffd23f", "#5fff8a", "#ffffff", "#9affd8"] : ["#c9b8ff", "#ffffff"], e.correct ? 30 : 14, e.correct ? 2.2 : 1.4);
          if (e.correct) {
            // A power-up reward plays the power-up jingle instead (see "boost").
            if (!e.reward.boost) a.playJingle(CLUE_RIGHT);
          } else a.wrong();
          const sub = `+${e.reward.energy} ENERGY${e.reward.boost ? ` · ${BOOSTS[e.reward.boost].name.toUpperCase()}!` : ""}`;
          this.note(e.correct ? "ANTIGEN IDENTIFIED!" : "CLUE POOF!", sub);
          break;
        }
        case "boost": {
          a.playJingle(POWER_UP);
          const B = BOOSTS[e.boost];
          const p = sim?.s.p;
          if (p) this.sparks(p.x + 6, p.y + 10, [B.color, B.color2, "#ffffff"], 18, 1.6);
          if (e.from === "pickup") this.note(B.name.toUpperCase() + "!", B.tip);
          break;
        }
        case "boostEnd": a.tone(500, 0.12, "triangle", 0.25, 250); break;
        case "vaccinePop": {
          a.tone(1200, 0.15, "triangle", 0.3, 400);
          const p = sim?.s.p;
          if (p) this.sparks(p.x + 6, p.y + 10, ["#9ad1ff", "#ffffff"], 14, 1.8);
          this.note("VACCINE MEMORY!", "YOUR BODY WAS READY FOR THAT ONE");
          break;
        }
        case "weak": a.tone(880, 0.3, "triangle", 0.4, 1760); this.note("WEAK SPOT!", "NEXT RIGHT ANSWER = DOUBLE HIT"); break;
        case "bossHit": {
          a.correct();
          const b = sim?.s.boss;
          if (b) this.sparks(b.x + 13, b.y + 15, ["#ffd23f", "#9affd8", "#ffffff"], e.weakness ? 40 : 22, 2.2);
          break;
        }
        case "blocked": a.wrong(); break;
        case "bossDown": {
          a.levelUp();
          const b = sim?.s.boss;
          if (b) for (let i = 0; i < 4; i++) this.sparks(b.x + 13, b.y + 15, ["#ffd23f", "#9affd8", "#ffffff", "#ff9ac8"], 20, 2.6);
          this.note("IDENTIFIED!", "POOF! JUST SPARKLES NOW");
          break;
        }
        case "virusDown": this.cb.onVirusDown?.(e.virus, e.next); break;
        case "nextVirus": break;
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
      boosts: BOOST_IDS.filter((id) => s.boosts[id] > 0).map((id) => ({ id, left: s.boosts[id], max: BOOSTS[id].frames })),
      cluesDone: s.clueDone.filter(Boolean).length, cluesTotal: s.clueDone.length, rushIdx: s.rushIdx,
    });
  }

  private draw() {
    const ctx = this.ctx;
    ctx.setTransform(2, 0, 0, 2, 0, 0);
    ctx.imageSmoothingEnabled = false;
    if (this.sim && this.look) {
      drawGame(ctx, this.sim, this.look, this.particles, this.gobblers, this.frame, this.banner);
      if (this.paused) {
        ctx.fillStyle = "#00000088";
        ctx.fillRect(0, 0, SCREEN_W, SCREEN_H);
      }
    } else if (this.preview) {
      drawPreview(ctx, this.preview.sim, this.preview.look, this.frame);
    } else {
      ctx.fillStyle = "#12061a";
      ctx.fillRect(0, 0, SCREEN_W, SCREEN_H);
    }
  }
}

export function lookFor(id: StageId): Look {
  return { theme: themeFor(id), stage: id };
}
