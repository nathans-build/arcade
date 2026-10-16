import type { ChipAudio } from "@/kit";
import { BOSS_INTRO, BOSS_SONG, FLOOR_CLEAR, GAME_OVER, TOWER_CLEARED, floorSong } from "@/music";
import { FLOORS } from "./rules";
import type { FloorPlan } from "./bosses";
import type { Band } from "./qmake";
import type { BossResult } from "./rules";
import { Renderer, type QuestionCard } from "./render";
import { DojoSim, type Hud, type Press, type SimEvent, type SoundName } from "./sim";

/*
 * Runs Dojo Tower: a requestAnimationFrame loop that steps the simulation, draws it, plays the
 * chip sounds and tells the React layer about questions, floors and the end of the game.
 * Before a game starts it plays an attract-mode demo (the student auto-walks and punches).
 */

export interface EngineCallbacks {
  onHud(h: Hud): void;
  /** A scroll-carrying ninja was beaten: show a quick question. */
  onScroll(): void;
  /** The floor master is ready: show a boss question. */
  onBossStart(floor: number): void;
  /** The floor master was beaten (after the last answer's animation). */
  onBossDown(floor: number): void;
  onFloorStart(floor: number): void;
  onLifeLost(): void;
  onGameOver(): void;
  onTowerCleared(): void;
}

export class DojoEngine {
  sim: DojoSim;
  private renderer: Renderer;
  private raf = 0;
  private last = 0;
  private hudT = 0;
  private demo = true;
  private demoT = 0;
  paused = false;

  constructor(canvas: HTMLCanvasElement, private audio: ChipAudio, private cb: EngineCallbacks) {
    this.renderer = new Renderer(canvas);
    this.sim = this.makeDemo("g35");
  }

  private plan: FloorPlan[] | undefined;

  private makeDemo(band: Band): DojoSim {
    const s = new DojoSim(band, { plan: this.plan });
    s.invincible = true;
    s.events = [];
    return s;
  }

  /** Title-screen attract mode (with the chosen subject's floor masters). */
  showDemo(band: Band, plan?: FloorPlan[]) {
    if (plan) this.plan = plan;
    this.demo = true;
    this.renderer.card = null;
    this.paused = false;
    this.sim = this.makeDemo(band);
  }

  /** A new climb with this run's ten floors; `floor` > 1 continues from a checkpoint (score starts over). */
  newGame(band: Band, plan: FloorPlan[], floor = 1) {
    this.plan = plan;
    this.demo = false;
    this.renderer.card = null;
    this.paused = false;
    this.sim = new DojoSim(band, { plan, floor });
    this.cb.onHud(this.sim.hud());
  }

  start() {
    this.last = performance.now();
    const loop = (t: number) => {
      const dt = Math.min(0.05, (t - this.last) / 1000);
      this.last = t;
      this.step(dt);
      this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
  }

  stop() {
    cancelAnimationFrame(this.raf);
  }

  /** One frame. Public so tests can drive the game without waiting for real time. */
  step(dt: number) {
    if (!this.paused) {
      if (this.demo) this.autopilot(dt);
      this.sim.update(dt);
    }
    const evs = this.sim.events;
    this.sim.events = [];
    for (const ev of evs) this.handle(ev);
    this.renderer.draw(this.sim, this.paused ? 0 : dt);
    this.hudT -= dt;
    if (this.hudT <= 0 && !this.demo) {
      this.hudT = 0.1;
      this.cb.onHud(this.sim.hud());
    }
  }

  private handle(ev: SimEvent) {
    this.renderer.onEvent(ev, this.sim);
    if (this.demo) {
      if (ev.type === "scroll") this.sim.answerScroll(true);
      return;
    }
    switch (ev.type) {
      case "sound": this.sound(ev.name); break;
      case "scroll": this.cb.onScroll(); break;
      case "bossStart": this.cb.onBossStart(this.sim.floor); break;
      case "bossDown": this.cb.onBossDown(this.sim.floor); break;
      case "floorStart": this.audio.playSong(floorSong(ev.floor)); this.cb.onFloorStart(ev.floor); break;
      case "lifeLost": this.cb.onLifeLost(); break;
      case "gameOver": this.cb.onHud(this.sim.hud()); this.cb.onGameOver(); break;
      case "towerCleared": this.cb.onHud(this.sim.hud()); this.cb.onTowerCleared(); break;
      default: break;
    }
  }

  /** Attract mode: walk forward, punch what comes close, answer the boss right now and then. */
  private autopilot(dt: number) {
    const s = this.sim;
    if (s.mode === "run") {
      s.held.right = s.dir > 0;
      s.held.left = s.dir < 0;
      const near = s.enemies.find((e) => Math.abs(e.x - s.player.x) < 26);
      if (near) {
        s.player.facing = (near.x > s.player.x ? 1 : -1) as 1 | -1;
        s.held.down = near.kind === "blob";
        s.press(near.kind === "blob" ? "punch" : Math.random() < 0.5 ? "kick" : "punch");
      } else s.held.down = false;
      if (s.burstT > 0 && s.enemies.some((e) => (e.x - s.player.x) * s.dir > 0 && Math.abs(e.x - s.player.x) < 150)) s.press("star");
    }
    if (s.mode === "boss" && !s.bossAnim) {
      this.demoT += dt;
      if (this.demoT > 1.6) {
        this.demoT = 0;
        s.answerBoss(Math.random() < 0.8);
      }
    }
    if (s.mode === "bossDown") s.finishFloor();
    if (s.mode === "won" || s.mode === "over") this.sim = this.makeDemo(s.band);
  }

  // ------------------------------------------------------------------ player input (no-ops in demo)

  setHeld(k: "left" | "right" | "down", on: boolean) {
    if (this.demo) return;
    this.sim.held[k] = on;
  }

  releaseAll() {
    this.sim.held.left = this.sim.held.right = this.sim.held.down = false;
  }

  press(a: Press) {
    if (this.demo || this.paused) return;
    this.sim.press(a);
  }

  answerScroll(correct: boolean) {
    this.sim.answerScroll(correct);
  }

  answerBoss(correct: boolean): BossResult | null {
    return this.sim.answerBoss(correct);
  }

  /** The open question, mirrored on the game screen (null to hide). */
  setCard(card: QuestionCard | null) {
    this.renderer.card = card;
  }

  /** FOCUS mode's topic tag for the floor and boss banners (null in MIX). */
  setFocusTag(tag: string | null) {
    this.renderer.focusTag = tag;
  }

  finishFloor() {
    this.sim.finishFloor();
  }

  togglePause(force?: boolean): boolean {
    if (this.demo) return false;
    const m = this.sim.mode;
    if (m === "over" || m === "won") return false;
    this.paused = force ?? !this.paused;
    if (this.paused) this.releaseAll();
    return this.paused;
  }

  // ------------------------------------------------------------------ sound

  private sound(n: SoundName) {
    const a = this.audio;
    switch (n) {
      case "punch": a.tone(520, 0.06, "square", 0.16, 260); break;
      case "kick": a.tone(360, 0.09, "square", 0.2, 140); break;
      case "hit": a.noise(0.12, 0.3); a.tone(240, 0.1, "square", 0.2, 90); break;
      case "hurt": a.tone(240, 0.22, "sawtooth", 0.25, 110); break;
      case "jump": a.jump(); break;
      case "thunder": a.explode(); a.tone(1400, 0.45, "square", 0.18, 120); break;
      case "scroll": a.checkpoint(); break;
      case "correct": a.correct(); break;
      case "wrong": a.wrong(); break;
      case "block": a.tone(900, 0.08, "triangle", 0.3); a.tone(1250, 0.12, "triangle", 0.22); break;
      // Music stingers (they play at the sound-effects volume when music is off).
      case "bossDown": a.playJingle(FLOOR_CLEAR, { then: this.sim.floor >= FLOORS ? "stop" : floorSong(this.sim.floor + 1) }); break;
      case "floor": a.checkpoint(); break;
      case "over": a.playJingle(GAME_OVER, { then: "stop" }); break;
      case "won": a.playJingle(TOWER_CLEARED, { then: "stop" }); break;
      case "ready": a.tone(1047, 0.1, "square", 0.2); a.tone(1568, 0.16, "square", 0.2); break;
      case "throw": a.tone(900, 0.06, "triangle", 0.12, 1400); break;
      case "deflect": a.tone(1500, 0.05, "square", 0.12); break;
      case "bossIn": a.playJingle(BOSS_INTRO, { then: BOSS_SONG }); break;
      case "star": a.tone(1200, 0.07, "triangle", 0.14, 1800); break;
      case "burst": a.tone(784, 0.1, "square", 0.18); a.tone(1175, 0.1, "square", 0.18); a.tone(1568, 0.2, "square", 0.18); break;
    }
  }
}
