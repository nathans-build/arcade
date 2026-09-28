import { ChipAudio } from "./audio";
import { getSprites, makeRover, PALETTE, ROVER_COLORS, type SpriteSheet } from "./sprites";
import type { DealtQuestion } from "./questions";

/* Logical arcade resolution; the canvas is scaled up with nearest-neighbor. */
export const W = 320;
export const H = 200;
const GROUND_Y = 168;

export const SECTOR_LEN = 1600;
export const SECTOR_LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const WAVE_AT = 0.3; // fraction of the sector where the Quiz Squadron appears
export const WAVE_TIME = 15;

const MIN_SPEED = 45;
const CRUISE_SPEED = 75;
const MAX_SPEED = 115;
const WAVE_MAX_SPEED = 55;

const GRAVITY = 330;
const JUMP_VY = -165;

const FUEL_DRAIN = 2.4; // per second
export const FUEL = { checkpointRight: 55, checkpointWrong: 25, waveRight: 15, waveWrong: -10 };

export type Action = "left" | "right" | "jump" | "fire";
export type WaveResult = "correct" | "wrong" | "timeout";

export interface HudState {
  score: number;
  lives: number;
  fuel: number;
  sector: number; // 0 = A
  sectorProgress: number; // 0..1 toward next checkpoint
  streak: number;
  waveTimeLeft: number | null;
  /** This run's rover body color, for the HUD. */
  roverColor: string;
}

export interface EngineCallbacks {
  /** Engine has paused at a checkpoint; call `resolveCheckpoint` to continue. */
  onCheckpoint(sectorReached: number): void;
  /** Engine wants a short question for a UFO wave. Return null to skip the wave. */
  requestWaveQuestion(): DealtQuestion | null;
  onWaveStart(q: DealtQuestion): void;
  onWaveEnd(q: DealtQuestion, result: WaveResult): void;
  onGameOver(reason: "lives" | "fuel"): void;
  onHud(h: HudState): void;
}

interface Obstacle { kind: "crater" | "rock"; x: number; w: number; h: number; big?: boolean; hp: number }
interface Ufo {
  x: number; y: number; baseX: number; baseY: number; t: number; life: number;
  bombCd: number; answer?: number; leaving?: boolean; reveal?: number;
}
interface Bullet { x: number; y: number; vx: number; vy: number; dist: number; target?: number }
interface Bomb { x: number; y: number; vy: number }
interface Particle { x: number; y: number; vx: number; vy: number; life: number; color: string }

type Mode = "demo" | "play" | "paused" | "dying" | "stalling" | "over";

function rand(a: number, b: number) {
  return a + Math.random() * (b - a);
}
/** Deterministic hash for procedural scenery. */
function hash(n: number) {
  const s = Math.sin(n * 127.1) * 43758.5453;
  return s - Math.floor(s);
}

export class LunarEngine {
  private ctx: CanvasRenderingContext2D;
  private sprites: SpriteSheet;
  private raf = 0;
  private last = 0;
  private hudTimer = 0;
  private frame = 0;

  mode: Mode = "demo";
  private keys = new Set<Action>();
  private jumpQueued = false;

  private camX = 0;
  private speed = CRUISE_SPEED;
  private roverY = GROUND_Y;
  private vy = 0;
  private airborne = false;
  private sinking = 0;
  private invuln = 0;
  private fireCd = 0;
  private dyingT = 0;

  private obstacles: Obstacle[] = [];
  private ufos: Ufo[] = [];
  private bullets: Bullet[] = [];
  private bombs: Bomb[] = [];
  private particles: Particle[] = [];
  private nextSpawnX = 400;
  private ufoCd = 6;

  private sector = 0;
  private waveSector = -1;
  private wave: { q: DealtQuestion; t: number; done: boolean; fired: boolean } | null = null;

  score = 0;
  lives = 3;
  roverColor = ROVER_COLORS[0].body;
  private roverSprite: HTMLCanvasElement;
  fuel = 100;
  streak = 0;

  private stars = Array.from({ length: 70 }, () => ({ x: rand(0, W * 4), y: rand(0, 120), p: Math.random() }));
  private earth: HTMLCanvasElement;

  constructor(canvas: HTMLCanvasElement, private audio: ChipAudio, private cb: EngineCallbacks) {
    canvas.width = W;
    canvas.height = H;
    this.ctx = canvas.getContext("2d")!;
    this.ctx.imageSmoothingEnabled = false;
    this.sprites = getSprites();
    this.earth = this.makeEarth();
    this.roverSprite = this.sprites.rover;
  }

  /* ------------------------------ lifecycle ------------------------------ */

  start() {
    this.last = performance.now();
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - this.last) / 1000);
      this.last = now;
      this.update(dt);
      this.draw();
      this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
  }

  stop() {
    cancelAnimationFrame(this.raf);
  }

  /** Gentler run for early readers (K-2): wider gaps, slower fuel burn, later UFOs. */
  private easy = false;
  setEasy(on: boolean) {
    this.easy = on;
  }

  newGame() {
    this.mode = "play";
    // A new paint job every run, never the same as the last one.
    const options = ROVER_COLORS.filter((c) => c.body !== this.roverColor);
    const pick = options[Math.floor(Math.random() * options.length)];
    this.roverColor = pick.body;
    this.roverSprite = makeRover(pick.body, pick.dark);
    this.camX = 0;
    this.speed = CRUISE_SPEED;
    this.roverY = GROUND_Y;
    this.vy = 0;
    this.airborne = false;
    this.sinking = 0;
    this.invuln = 2;
    this.obstacles = [];
    this.ufos = [];
    this.bullets = [];
    this.bombs = [];
    this.particles = [];
    this.nextSpawnX = 420;
    this.ufoCd = 8;
    this.sector = 0;
    this.waveSector = -1;
    this.wave = null;
    this.score = 0;
    this.lives = 3;
    this.fuel = 100;
    this.streak = 0;
    this.keys.clear();
    this.emitHud();
  }

  /** Return to the attract-mode demo (title screen). */
  demo() {
    this.newGame();
    this.mode = "demo";
  }

  setKey(a: Action, down: boolean) {
    if (down) {
      if (a === "jump" && !this.keys.has("jump")) this.jumpQueued = true;
      this.keys.add(a);
    } else {
      this.keys.delete(a);
    }
  }

  releaseAllKeys() {
    this.keys.clear();
    this.jumpQueued = false;
  }

  private userPaused = false;

  /** Player-initiated pause. Returns true if now paused. */
  togglePause(force?: boolean) {
    const want = force ?? !(this.mode === "paused" && this.userPaused);
    if (want && this.mode === "play") {
      this.mode = "paused";
      this.userPaused = true;
      this.releaseAllKeys();
    } else if (!want && this.mode === "paused" && this.userPaused) {
      this.mode = "play";
      this.userPaused = false;
      this.last = performance.now();
    }
    return this.mode === "paused" && this.userPaused;
  }

  /**
   * Quiz Squadron: fire a homing answer missile at UFO `choice` (0-3 = A-D).
   * The rover can't drive under every UFO, so this is how B-D are reachable.
   * One pick per wave. Returns true if a missile was launched.
   */
  selectWaveAnswer(choice: number) {
    if (this.mode !== "play" || !this.wave || this.wave.done || this.wave.fired) return false;
    if (!this.ufos.some((u) => u.answer === choice && !u.leaving)) return false;
    this.wave.fired = true;
    const rx = this.roverScreenX();
    this.bullets.push({ x: rx + 12, y: this.roverY - 14, vx: 0, vy: -260, dist: 0, target: choice });
    this.audio.shoot();
    return true;
  }

  /** Called by the UI after the player answers a checkpoint transmission. */
  resolveCheckpoint(correct: boolean) {
    if (correct) {
      this.streak++;
      this.score += 1000 * Math.min(this.streak, 5);
      this.fuel = Math.min(100, this.fuel + FUEL.checkpointRight);
    } else {
      this.streak = 0;
      this.fuel = Math.min(100, this.fuel + FUEL.checkpointWrong);
    }
    this.clearAhead(220);
    this.ufos = [];
    this.bombs = [];
    this.invuln = 1;
    this.releaseAllKeys();
    this.mode = "play";
    this.emitHud();
  }

  /* ------------------------------ update ------------------------------ */

  private roverScreenX() {
    return 56 + ((this.speed - MIN_SPEED) / (MAX_SPEED - MIN_SPEED)) * 44;
  }

  private update(dt: number) {
    this.frame++;
    this.updateParticles(dt);

    if (this.mode === "paused" || this.mode === "over") return;

    if (this.mode === "dying") {
      this.dyingT -= dt;
      if (this.sinking > 0) this.sinking = Math.min(14, this.sinking + dt * 30);
      if (this.dyingT <= 0) this.respawn();
      return;
    }

    if (this.mode === "stalling") {
      this.speed = Math.max(0, this.speed - 50 * dt);
      this.camX += this.speed * dt;
      if (this.speed <= 0) {
        this.mode = "over";
        this.audio.stopMusic();
        this.cb.onGameOver("fuel");
      }
      return;
    }

    const demo = this.mode === "demo";

    // Speed control
    let target = CRUISE_SPEED;
    if (!demo) {
      if (this.keys.has("right")) target = MAX_SPEED;
      if (this.keys.has("left")) target = MIN_SPEED;
    }
    if (this.wave) target = Math.min(target, WAVE_MAX_SPEED);
    this.speed += Math.sign(target - this.speed) * Math.min(Math.abs(target - this.speed), 90 * dt);
    const prevCam = this.camX;
    this.camX += this.speed * dt;
    if (!demo) this.score += Math.floor(this.camX / 10) - Math.floor(prevCam / 10);

    // Jump
    const wantJump = demo ? hash(Math.floor(this.camX / 97)) > 0.93 && !this.airborne : this.jumpQueued || this.keys.has("jump");
    this.jumpQueued = false;
    if (wantJump && !this.airborne) {
      this.vy = JUMP_VY;
      this.airborne = true;
      if (!demo) this.audio.jump();
    }
    if (this.airborne) {
      this.vy += GRAVITY * dt;
      this.roverY += this.vy * dt;
      if (this.roverY >= GROUND_Y) {
        this.roverY = GROUND_Y;
        this.vy = 0;
        this.airborne = false;
      }
    }

    // Fire
    this.fireCd -= dt;
    if (!demo && this.keys.has("fire") && this.fireCd <= 0) this.fire();

    this.invuln = Math.max(0, this.invuln - dt);

    if (demo) return;

    // Fuel
    this.fuel -= FUEL_DRAIN * (this.easy ? 0.7 : 1) * dt;
    if (this.fuel <= 0) {
      this.fuel = 0;
      this.mode = "stalling";
      this.emitHud();
      return;
    }

    this.spawn(dt);
    this.updateBullets(dt);
    this.updateUfos(dt);
    this.updateBombs(dt);
    this.checkCollisions();
    this.updateWave(dt);

    // Checkpoint
    const nextCp = (this.sector + 1) * SECTOR_LEN;
    if (this.mode === "play" && this.roverWorldX() >= nextCp) {
      this.sector++;
      if (this.wave) this.endWave("timeout");
      this.mode = "paused";
      this.releaseAllKeys();
      this.audio.checkpoint();
      this.emitHud();
      this.cb.onCheckpoint(this.sector);
      return;
    }

    this.hudTimer -= dt;
    if (this.hudTimer <= 0) {
      this.hudTimer = 0.1;
      this.emitHud();
    }
  }

  private roverWorldX() {
    return this.camX + this.roverScreenX() + 12;
  }

  private fire() {
    const rx = this.roverScreenX();
    const fwd = this.bullets.filter((b) => b.vy === 0).length;
    const up = this.bullets.filter((b) => b.vy < 0 && b.target === undefined).length;
    if (fwd < 2) this.bullets.push({ x: rx + 24, y: this.roverY - 8, vx: 280, vy: 0, dist: 0 });
    if (up < 3) this.bullets.push({ x: rx + 4, y: this.roverY - 14, vx: 0, vy: -230, dist: 0 });
    this.fireCd = 0.22;
    this.audio.shoot();
  }

  private spawn(dt: number) {
    const diff = this.sector;
    const gapBase = Math.max(95, 210 - diff * 12) + (this.easy ? 70 : 0);
    while (this.nextSpawnX < this.camX + W + 40) {
      const x = this.nextSpawnX;
      const cpDist = Math.abs(x - Math.round(x / SECTOR_LEN) * SECTOR_LEN);
      const waveZone =
        this.wave !== null ||
        (x > this.sectorStart() + SECTOR_LEN * WAVE_AT - 60 && x < this.sectorStart() + SECTOR_LEN * WAVE_AT + WAVE_TIME * WAVE_MAX_SPEED);
      if (cpDist > 140 && !waveZone) {
        const r = Math.random();
        if (r < 0.45) {
          this.obstacles.push({ kind: "crater", x, w: Math.floor(rand(16, 22 + Math.min(diff, 5) * 2)), h: 0, hp: 0 });
        } else if (r < 0.8 || diff < 2) {
          this.obstacles.push({ kind: "rock", x, w: 8, h: 6, hp: 1 });
        } else {
          this.obstacles.push({ kind: "rock", x, w: 12, h: 9, big: true, hp: 2 });
        }
      }
      this.nextSpawnX += gapBase + rand(0, gapBase * 0.7);
    }
    this.obstacles = this.obstacles.filter((o) => o.x + o.w > this.camX - 20);

    // Enemy UFOs (none during a quiz wave)
    if (!this.wave) {
      this.ufoCd -= dt;
      const maxUfos = Math.min(1 + Math.floor(diff / 2), 3);
      if (this.ufoCd <= 0 && this.ufos.length < maxUfos && diff >= (this.easy ? 2 : 1)) {
        this.ufos.push({ x: -16, y: 30, baseX: rand(90, 230), baseY: rand(30, 60), t: 0, life: rand(9, 14), bombCd: rand(1.5, 3) });
        this.ufoCd = rand(3, 7) - Math.min(diff, 4) * 0.4;
      }
    }

    // Quiz Squadron wave
    const waveX = this.sectorStart() + SECTOR_LEN * WAVE_AT;
    if (!this.wave && this.waveSector !== this.sector && this.roverWorldX() >= waveX) {
      this.waveSector = this.sector;
      const q = this.cb.requestWaveQuestion();
      if (q) {
        this.wave = { q, t: WAVE_TIME, done: false, fired: false };
        this.ufos = this.ufos.map((u) => ({ ...u, leaving: true }));
        for (let i = 0; i < 4; i++) {
          this.ufos.push({ x: 52 + i * 66, y: -10 - i * 4, baseX: 52 + i * 66, baseY: 66, t: i, life: 999, bombCd: 999, answer: i });
        }
        this.cb.onWaveStart(q);
      }
    }
  }

  private sectorStart() {
    return this.sector * SECTOR_LEN;
  }

  private updateBullets(dt: number) {
    for (const b of this.bullets) {
      if (b.target !== undefined) {
        // Answer missile: steer toward the chosen UFO each frame.
        const u = this.ufos.find((f) => f.answer === b.target && !f.leaving);
        if (u) {
          const dx = u.x + 8 - b.x;
          const dy = u.y + 3 - b.y;
          const d = Math.max(1, Math.hypot(dx, dy));
          b.vx = (dx / d) * 260;
          b.vy = Math.min(-1, (dy / d) * 260);
        }
      }
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.dist += Math.abs(b.vx * dt) + Math.abs(b.vy * dt);
    }
    this.bullets = this.bullets.filter((b) => (b.vy === 0 ? b.dist < 120 : b.y > -5 && b.dist < 600));
  }

  private updateUfos(dt: number) {
    const rx = this.roverScreenX();
    for (const u of this.ufos) {
      u.t += dt;
      if (u.answer !== undefined) {
        // Answer UFOs descend into formation and bob in place.
        if (u.leaving) {
          u.y -= 60 * dt;
        } else {
          u.y += Math.sign(u.baseY - u.y) * Math.min(Math.abs(u.baseY - u.y), 60 * dt);
          u.x = u.baseX + Math.sin(u.t * 1.7) * 4;
          if (u.y >= u.baseY - 1) u.y = u.baseY + Math.sin(u.t * 2.3) * 3;
        }
        if (u.reveal !== undefined) u.reveal -= dt;
        continue;
      }
      u.life -= dt;
      if (u.life <= 0) u.leaving = true;
      if (u.leaving) {
        u.y -= 50 * dt;
        u.x += 40 * dt;
        continue;
      }
      u.baseX += Math.sign(rx + 40 - u.baseX) * 10 * dt;
      const tx = u.baseX + Math.sin(u.t * 1.3) * 70;
      const ty = u.baseY + Math.sin(u.t * 2.1) * 14;
      u.x += (tx - u.x) * Math.min(1, dt * 2);
      u.y += (ty - u.y) * Math.min(1, dt * 2);
      u.bombCd -= dt;
      if (u.bombCd <= 0 && Math.abs(u.x - rx) < 90) {
        this.bombs.push({ x: u.x + 7, y: u.y + 6, vy: 20 });
        u.bombCd = rand(1.6, 3.2) - Math.min(this.sector, 5) * 0.15;
      }
    }
    this.ufos = this.ufos.filter((u) => u.y > -30 && u.x < W + 30);
  }

  private updateBombs(dt: number) {
    for (const b of this.bombs) {
      b.vy += 120 * dt;
      b.y += b.vy * dt;
    }
    const rx = this.roverScreenX();
    this.bombs = this.bombs.filter((b) => {
      if (b.y >= GROUND_Y - 1) {
        this.burst(b.x, GROUND_Y - 2, 10, PALETTE.groundHi);
        this.audio.explode();
        const wx = b.x + this.camX;
        // Bombs that land ahead of the rover blast new craters, just like the arcade.
        if (b.x > rx + 40) this.obstacles.push({ kind: "crater", x: wx - 7, w: 14, h: 0, hp: 0 });
        return false;
      }
      return true;
    });
  }

  private updateWave(dt: number) {
    if (!this.wave) return;
    this.wave.t -= dt;
    if (!this.wave.done && this.wave.t <= 0) this.endWave("timeout");
    if (this.wave && this.wave.done && this.wave.t <= 0) {
      this.ufos = this.ufos.map((u) => (u.answer !== undefined ? { ...u, leaving: true } : u));
      this.wave = null;
    }
  }

  private endWave(result: WaveResult) {
    if (!this.wave || this.wave.done) return;
    const q = this.wave.q;
    this.wave.done = true;
    this.wave.t = 1.6; // linger so the right answer can be seen
    for (const u of this.ufos) if (u.answer === q.answer) u.reveal = 1.6;
    if (result === "correct") {
      this.streak++;
      this.score += 500 * Math.min(this.streak, 5);
      this.fuel = Math.min(100, this.fuel + FUEL.waveRight);
      this.audio.correct();
    } else {
      this.streak = 0;
      if (result === "wrong") this.fuel = Math.max(1, this.fuel + FUEL.waveWrong);
      this.audio.wrong();
    }
    this.cb.onWaveEnd(q, result);
  }

  private checkCollisions() {
    const rx = this.roverScreenX();

    // Bullets vs rocks / UFOs / bombs
    for (const b of this.bullets) {
      if (b.vy === 0) {
        for (const o of this.obstacles) {
          if (o.kind !== "rock" || o.hp <= 0) continue;
          const sx = o.x - this.camX;
          if (b.x >= sx && b.x <= sx + o.w && b.y >= GROUND_Y - o.h - 2) {
            o.hp--;
            b.dist = 9999;
            if (o.hp <= 0) {
              this.score += o.big ? 200 : 100;
              this.burst(sx + o.w / 2, GROUND_Y - o.h / 2, 14, "#c8905a");
              this.audio.explode();
            } else {
              this.burst(b.x, b.y, 4, "#ffffff");
            }
          }
        }
      } else {
        for (const u of this.ufos) {
          if (u.leaving) continue;
          if (b.target !== undefined && u.answer !== b.target) continue;
          if (b.x >= u.x - 1 && b.x <= u.x + 17 && b.y >= u.y - 1 && b.y <= u.y + 7) {
            b.y = -100;
            if (u.answer !== undefined) {
              if (!this.wave || this.wave.done) continue;
              if (u.answer === this.wave.q.answer) {
                this.burst(u.x + 8, u.y + 3, 30, "#5fff8a");
                for (const a of this.ufos) {
                  if (a.answer === undefined) continue;
                  a.leaving = a !== u;
                  if (a === u) a.y = -100;
                }
                this.endWave("correct");
              } else {
                this.burst(u.x + 8, u.y + 3, 24, "#ff4040");
                u.y = -100;
                this.endWave("wrong");
              }
            } else {
              this.burst(u.x + 8, u.y + 3, 18, "#ffe25a");
              u.y = -100;
              this.score += 300;
              this.audio.explode();
            }
          }
        }
        for (const bomb of this.bombs) {
          if (Math.abs(b.x - bomb.x) < 4 && Math.abs(b.y - bomb.y) < 5) {
            bomb.y = 9999;
            b.y = -100;
            this.score += 50;
          }
        }
        this.bombs = this.bombs.filter((bb) => bb.y < 9000);
      }
    }
    this.obstacles = this.obstacles.filter((o) => o.kind === "crater" || o.hp > 0);
    this.ufos = this.ufos.filter((u) => u.y > -30);

    if (this.invuln > 0) return;

    // Rover vs craters (fall in if the middle wheel is over the pit)
    const mid = this.camX + rx + 12;
    if (!this.airborne) {
      for (const o of this.obstacles) {
        if (o.kind === "crater" && mid > o.x + 3 && mid < o.x + o.w - 3) {
          this.sinking = 1;
          this.die();
          return;
        }
      }
    }
    // Rover vs rocks
    for (const o of this.obstacles) {
      if (o.kind !== "rock") continue;
      const sx = o.x - this.camX;
      if (sx < rx + 22 && sx + o.w > rx + 2 && this.roverY > GROUND_Y - o.h + 1) {
        this.die();
        return;
      }
    }
    // Rover vs bombs
    for (const b of this.bombs) {
      if (b.x > rx && b.x < rx + 24 && b.y > this.roverY - 12 && b.y < this.roverY) {
        this.die();
        return;
      }
    }
  }

  private die() {
    this.mode = "dying";
    this.dyingT = 1.8;
    this.lives--;
    this.streak = 0;
    const rx = this.roverScreenX();
    this.burst(rx + 12, this.roverY - 6, 40, "#ff9a3a");
    this.burst(rx + 12, this.roverY - 6, 20, "#e24ae2");
    this.audio.crash();
    if (this.wave && !this.wave.done) this.endWave("timeout");
    this.emitHud();
  }

  private respawn() {
    this.sinking = 0;
    if (this.lives <= 0) {
      this.mode = "over";
      this.audio.stopMusic();
      this.cb.onGameOver("lives");
      return;
    }
    this.clearAhead(W);
    this.ufos = this.ufos.filter((u) => u.answer !== undefined);
    this.bombs = [];
    this.roverY = GROUND_Y;
    this.vy = 0;
    this.airborne = false;
    this.speed = CRUISE_SPEED;
    this.invuln = 2;
    this.releaseAllKeys();
    this.mode = "play";
    this.emitHud();
  }

  private clearAhead(dist: number) {
    const from = this.camX - 20;
    const to = this.camX + this.roverScreenX() + dist;
    this.obstacles = this.obstacles.filter((o) => o.x + o.w < from || o.x > to);
  }

  private burst(x: number, y: number, n: number, color: string) {
    for (let i = 0; i < n; i++) {
      this.particles.push({ x, y, vx: rand(-70, 70), vy: rand(-110, 10), life: rand(0.4, 1.1), color });
    }
  }

  private updateParticles(dt: number) {
    for (const p of this.particles) {
      p.vy += 150 * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
    }
    this.particles = this.particles.filter((p) => p.life > 0 && p.y < H);
  }

  private emitHud() {
    const start = this.sectorStart();
    this.cb.onHud({
      score: this.score,
      lives: this.lives,
      fuel: this.fuel,
      sector: this.sector,
      sectorProgress: Math.max(0, Math.min(1, (this.roverWorldX() - start) / SECTOR_LEN)),
      streak: this.streak,
      waveTimeLeft: this.wave && !this.wave.done ? Math.max(0, this.wave.t) : null,
      roverColor: this.roverColor,
    });
  }

  /* ------------------------------ render ------------------------------ */

  private makeEarth() {
    const c = document.createElement("canvas");
    const r = 11;
    c.width = c.height = r * 2 + 1;
    const g = c.getContext("2d")!;
    for (let y = -r; y <= r; y++) {
      for (let x = -r; x <= r; x++) {
        if (x * x + y * y > r * r) continue;
        const land = hash(Math.floor((x + 40) / 3) * 13 + Math.floor((y + 40) / 3) * 7) > 0.62;
        const shade = x > r * 0.35 + y * 0.2;
        g.fillStyle = shade ? (land ? "#1a5a2a" : "#1a2a70") : land ? "#3fbf5a" : "#3a6aff";
        if (!shade && hash(x * 3.1 + y * 5.7) > 0.93) g.fillStyle = "#ffffff";
        g.fillRect(x + r, y + r, 1, 1);
      }
    }
    return c;
  }

  private draw() {
    const g = this.ctx;
    g.fillStyle = PALETTE.sky;
    g.fillRect(0, 0, W, H);

    // Stars
    for (const s of this.stars) {
      const x = Math.floor((((s.x - this.camX * 0.03) % (W * 4)) + W * 4) % (W * 4));
      if (x >= W) continue;
      const tw = (this.frame + s.p * 100) % 90 < 8;
      g.fillStyle = s.p > 0.7 && !tw ? PALETTE.star : PALETTE.starDim;
      g.fillRect(x, Math.floor(s.y), 1, 1);
    }
    g.drawImage(this.earth, 250, 14);

    // Far mountains
    for (let x = 0; x < W; x += 2) {
      const wx = x + this.camX * 0.12;
      const h = 50 + 18 * Math.sin(wx / 37) + 10 * Math.sin(wx / 13 + 1) + 5 * Math.sin(wx / 5.3);
      const top = Math.floor((150 - h) / 2) * 2;
      g.fillStyle = PALETTE.farMtn;
      g.fillRect(x, top, 2, 150 - top);
      g.fillStyle = PALETTE.farMtnHi;
      g.fillRect(x, top, 2, 2);
    }

    // Mid hills + moon-base domes
    const hillTop = (wx: number) => Math.floor((150 - (16 + 9 * Math.sin(wx / 29) + 5 * Math.sin(wx / 11 + 2))) / 2) * 2;
    for (let x = 0; x < W; x += 2) {
      const wx = x + this.camX * 0.35;
      const top = hillTop(wx);
      g.fillStyle = PALETTE.midHill;
      g.fillRect(x, top, 2, GROUND_Y - top);
      g.fillStyle = PALETTE.midHillHi;
      g.fillRect(x, top, 2, 1);
    }
    const layerX = this.camX * 0.35;
    for (let i = Math.floor(layerX / 180) - 1; i < Math.floor((layerX + W) / 180) + 2; i++) {
      if (hash(i) < 0.45) continue;
      const wx = i * 180 + 60;
      const sx = Math.floor(wx - layerX);
      const base = hillTop(wx) + 3;
      this.drawDome(sx, base, 7 + Math.floor(hash(i + 3) * 5));
    }

    // Ground
    g.fillStyle = PALETTE.ground;
    g.fillRect(0, GROUND_Y, W, H - GROUND_Y);
    g.fillStyle = PALETTE.groundHi;
    g.fillRect(0, GROUND_Y, W, 1);
    g.fillStyle = PALETTE.groundDark;
    const cell = 6;
    for (let x = -cell; x < W + cell; x += cell) {
      const ci = Math.floor((x + this.camX) / cell);
      const sx = Math.floor(ci * cell - this.camX);
      for (let row = 0; row < 4; row++) {
        const hv = hash(ci * 7 + row * 131);
        if (hv > 0.55) g.fillRect(sx + Math.floor(hv * 5), GROUND_Y + 4 + row * 7 + Math.floor(hv * 3), hv > 0.85 ? 3 : 2, 1);
      }
    }

    // Checkpoint flags
    for (let s = this.sector; s <= this.sector + 1; s++) {
      const cx = (s + 1) * SECTOR_LEN - this.camX;
      if (cx > -20 && cx < W + 10) {
        g.drawImage(this.sprites.flag, Math.floor(cx), GROUND_Y - 11);
        this.text(SECTOR_LETTERS[(s + 1) % 26], Math.floor(cx) + 2, GROUND_Y - 13, "#000010", 8, "left");
        this.text(SECTOR_LETTERS[(s + 1) % 26], Math.floor(cx) + 1, GROUND_Y - 14, "#ffe25a", 8, "left");
      }
    }

    // Craters & rocks
    for (const o of this.obstacles) {
      const sx = Math.floor(o.x - this.camX);
      if (sx > W || sx + o.w < -4) continue;
      if (o.kind === "crater") {
        g.fillStyle = PALETTE.crater;
        for (let r = 0; r < 12; r++) {
          const inset = Math.floor(r * 0.7);
          g.fillRect(sx + inset, GROUND_Y + r, o.w - inset * 2, 1);
        }
        g.fillStyle = PALETTE.groundHi;
        g.fillRect(sx - 3, GROUND_Y - 1, 3, 1);
        g.fillRect(sx + o.w, GROUND_Y - 1, 3, 1);
      } else {
        g.drawImage(o.big ? this.sprites.rockBig : this.sprites.rockSmall, sx, GROUND_Y - o.h);
      }
    }

    // UFOs
    for (const u of this.ufos) {
      const x = Math.floor(u.x);
      const y = Math.floor(u.y);
      if (u.answer !== undefined) {
        const flash = u.reveal !== undefined && u.reveal > 0 && this.frame % 10 < 5;
        g.drawImage(this.sprites.answerUfo, x, y);
        const label = "ABCD"[u.answer];
        g.fillStyle = flash ? "#ffffff" : "#000010";
        g.fillRect(x + 3, y + 8, 11, 11);
        g.strokeStyle = flash ? "#5fff8a" : "#34c86a";
        g.strokeRect(x + 3.5, y + 8.5, 10, 10);
        this.text(label, x + 9, y + 10, flash ? "#000010" : "#ffffff", 8, "center");
      } else {
        g.drawImage(this.sprites.ufo, x, y);
      }
    }

    // Bombs
    for (const b of this.bombs) {
      g.fillStyle = this.frame % 6 < 3 ? "#ff4040" : "#ffe25a";
      g.fillRect(Math.floor(b.x) - 1, Math.floor(b.y) - 1, 3, 3);
    }

    // Bullets
    for (const b of this.bullets) {
      g.fillStyle = b.target !== undefined ? "#5fff8a" : b.vy === 0 ? "#ffffff" : "#ffe25a";
      if (b.target !== undefined) g.fillRect(Math.floor(b.x) - 1, Math.floor(b.y) - 1, 3, 3);
      else if (b.vy === 0) g.fillRect(Math.floor(b.x), Math.floor(b.y), 4, 1);
      else g.fillRect(Math.floor(b.x), Math.floor(b.y), 1, 4);
    }

    // Rover
    if (this.mode !== "dying" || this.sinking > 0) {
      const visible = this.invuln <= 0 || this.frame % 8 < 5 || this.mode === "demo";
      if (visible) this.drawRover();
    }

    // Particles
    for (const p of this.particles) {
      g.fillStyle = p.color;
      g.fillRect(Math.floor(p.x), Math.floor(p.y), 1, 1);
    }

    if (this.mode === "stalling") {
      this.text("OUT OF FUEL", W / 2, 90, "#ff4040", 8, "center");
    }
  }

  private drawRover() {
    const g = this.ctx;
    const rx = Math.floor(this.roverScreenX());
    const base = Math.floor(this.roverY + this.sinking);
    const wheel = Math.floor(this.camX / 6) % 2 === 0 ? this.sprites.wheelA : this.sprites.wheelB;
    const wheelX = [1, 9, 17];
    const bob = (i: number) => (this.airborne ? 0 : hash(Math.floor((this.camX + i * 9) / 11)) > 0.8 ? -1 : 0);
    const bodyBob = this.airborne ? 0 : bob(1);
    g.drawImage(this.roverSprite, rx, base - 13 + bodyBob);
    wheelX.forEach((wx, i) => g.drawImage(wheel, rx + wx, base - 6 + bob(i) + (this.airborne && i !== 1 ? 1 : 0)));
  }

  private drawDome(cx: number, base: number, r: number) {
    const g = this.ctx;
    for (let y = 0; y <= r; y++) {
      const half = Math.floor(Math.sqrt(r * r - y * y));
      g.fillStyle = y === r ? "#c8d4f0" : PALETTE.dome;
      g.fillRect(cx - half, base - y, half * 2, 1);
    }
    g.fillStyle = PALETTE.domeWin;
    for (let i = -r + 3; i < r - 2; i += 4) {
      if ((this.frame >> 5) % 7 !== (i & 7)) g.fillRect(cx + i, base - 3, 2, 2);
    }
    g.fillStyle = "#6a7797";
    g.fillRect(cx - r - 2, base, r * 2 + 4, 2);
  }

  private text(s: string, x: number, y: number, color: string, size: number, align: CanvasTextAlign) {
    const g = this.ctx;
    g.font = `${size}px "Press Start 2P", monospace`;
    g.textAlign = align;
    g.textBaseline = "top";
    g.fillStyle = color;
    g.fillText(s, x, y);
  }
}
