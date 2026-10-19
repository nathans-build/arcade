import type { ClueReward } from "./boosts";
import { PH, Sim, type Input } from "./sim";


/*
 * A headless test bot: it plays a stage by looking ahead with cloned sims (a small beam search over
 * short input segments) and answers boss and Antigen Clue questions with given policies. It proves every
 * body zone and the Lymph Node's Major Virus rush can be cleared in every grade band (clue barriers included).
 */

interface Action {
  left?: boolean;
  right?: boolean;
  /** "hold": jump held all segment; "tap": a short hop. */
  jump?: "hold" | "tap";
}

const ACTIONS: Action[] = [
  { right: true },
  { right: true, jump: "hold" },
  {},
  { left: true },
  { jump: "hold" },
  { right: true, jump: "tap" },
  { left: true, jump: "hold" },
];

const SEG = 12;
const DEPTH = 4;
const BEAM = 5;

function inputFor(a: Action, f: number, frameNo: number, shoot: boolean): Input {
  return {
    left: !!a.left,
    right: !!a.right,
    jump: a.jump === "hold" ? true : a.jump === "tap" ? f < 4 : false,
    shoot: shoot && frameNo % 7 === 0,
    power: false,
    cycle: false,
  };
}

function runSegment(sim: Sim, a: Action, shoot: boolean) {
  for (let f = 0; f < SEG; f++) {
    sim.step(inputFor(a, f, sim.s.t, shoot));
    const m = sim.s.mode;
    if (m === "quiz" || m === "over" || m === "respawn" || m === "clear" || m === "bossIntro") break;
  }
}

/** Lets an airborne hero finish the jump or fall (holding the same direction), so pits are seen in time. */
function settle(sim: Sim, a: Action): Sim {
  const p = sim.s.p;
  if (p.onGround || (sim.s.mode !== "play" && sim.s.mode !== "boss")) return sim;
  const c = sim.clone();
  for (let f = 0; f < 70 && !c.s.p.onGround && (c.s.mode === "play" || c.s.mode === "boss"); f++) {
    c.step({ left: !!a.left, right: !!a.right, jump: true, shoot: false, power: false, cycle: false });
  }
  return c;
}

function score(sim: Sim, a: Action): number {
  return rawScore(settle(sim, a));
}

function rawScore(sim: Sim): number {
  const s = sim.s;
  if (s.mode === "over") return -1e9;
  let v = s.lives * 5000 + s.energy * 25 - s.livesLost * 5000;
  if (s.mode === "respawn") v -= 4000;
  if (s.locked) {
    v += 100000;
    const f = s.fight;
    if (f) v += (f.maxHp - f.hp) * 3000;
    if (s.boss) {
      v += s.boss.panel * 300;
      // Keep a little distance from the boss and stay on the floor.
      const d = Math.abs(s.p.x - s.boss.x);
      v -= d < 40 ? (40 - d) * 4 : 0;
      v -= d > 200 ? (d - 200) : 0;
    }
    if (s.mode === "quiz") v += 2000;
    v += s.rushIdx * 60000;
    if (s.mode === "bossDown" || s.mode === "clear") v += 50000;
  } else {
    v += s.p.x * 2 + s.checkpoint * 50 + s.cluesAnswered * 600;
    if (s.mode === "quiz") v += 800;
    // Standing higher is progress too (lifts, ledges).
    if (s.p.onGround) v += (200 - (s.p.y + PH)) * 1.5;
    if (s.mode === "bossIntro") v += 100000;
  }
  return v;
}

/** Picks the next segment's action by looking ahead DEPTH segments. */
export function chooseAction(sim: Sim): Action {
  type Node = { sim: Sim; first: Action; v: number };
  let frontier: Node[] = [];
  const shoot = true;
  for (const a of ACTIONS) {
    const c = sim.clone();
    runSegment(c, a, shoot);
    frontier.push({ sim: c, first: a, v: score(c, a) });
  }
  let best = frontier.reduce((x, y) => (y.v > x.v ? y : x));
  for (let d = 1; d < DEPTH; d++) {
    frontier.sort((x, y) => y.v - x.v);
    const keep = frontier.slice(0, BEAM);
    const next: Node[] = [];
    for (const n of keep) {
      const m = n.sim.s.mode;
      if (m !== "play" && m !== "boss") {
        next.push(n);
        continue;
      }
      for (const a of ACTIONS) {
        const c = n.sim.clone();
        runSegment(c, a, shoot);
        next.push({ sim: c, first: n.first, v: score(c, a) });
      }
    }
    frontier = next;
    for (const n of frontier) if (n.v > best.v) best = n;
  }
  return best.first;
}

export interface BotResult {
  cleared: boolean;
  frames: number;
  livesLost: number;
  questions: number;
  wrong: number;
  /** Boss HP right before each answer and right after (to prove wrong answers change nothing), and which boss. */
  answers: { correct: boolean; hpBefore: number; hpAfter: number; livesBefore: number; livesAfter: number; energyBefore: number; energyAfter: number; boss: string }[];
  /** Antigen Clue answers, with what each one gave. */
  clues: { n: number; correct: boolean; reward: ClueReward; livesBefore: number; livesAfter: number; energyBefore: number; energyAfter: number; powerBefore: number; powerAfter: number; x: number }[];
  /** Antigen Clues answered before the boss door closed. */
  cluesBeforeBoss: number;
  /** Bosses beaten, in order (one stage germ, or the six Major Viruses). */
  bosses: string[];
  reason: string;
}

/**
 * Plays the stage to the end. `answerRight(n)` decides whether boss question n (0-based) is answered right.
 * `onQuestion` lets the caller draw a real question for each panel (tests check them); it gets the boss key.
 */
export function playStage(
  sim: Sim,
  opts: {
    answerRight?: (n: number) => boolean;
    /** Antigen Clue policy (n = 0-based clue question). Default: right, wrong, right. */
    answerClue?: (n: number) => boolean;
    maxFrames?: number;
    onQuestion?: (n: number, boss: string) => void;
    onClue?: (n: number) => void;
    skipToBoss?: boolean;
  } = {},
): BotResult {
  const answerRight = opts.answerRight ?? (() => true);
  const answerClue = opts.answerClue ?? ((n: number) => n !== 1);
  const maxFrames = opts.maxFrames ?? 60 * 60 * 14;
  const res: BotResult = { cleared: false, frames: 0, livesLost: 0, questions: 0, wrong: 0, answers: [], clues: [], cluesBeforeBoss: 0, bosses: [], reason: "" };
  if (opts.skipToBoss) sim.warpToBoss();
  let plan: { a: Action; f: number } | null = null;
  const start = sim.s.t;
  while (sim.s.t - start < maxFrames) {
    const s = sim.s;
    if (s.mode === "clear") {
      res.cleared = true;
      break;
    }
    if (s.mode === "over") {
      res.reason = `game over at x=${Math.round(s.p.x)} (arena ${sim.level.arenaX})`;
      break;
    }
    if (s.mode === "quiz" && s.ask !== "boss") {
      const n = res.clues.length;
      opts.onClue?.(n);
      const right = answerClue(n);
      const before = { lives: s.lives, energy: s.energy, power: s.power };
      const r = sim.answer(right);
      res.clues.push({ n, correct: right, reward: r.reward!, livesBefore: before.lives, livesAfter: s.lives, energyBefore: before.energy, energyAfter: s.energy, powerBefore: before.power, powerAfter: s.power, x: s.p.x });
      if (!s.locked) res.cluesBeforeBoss++;
      sim.resume();
      plan = null;
      continue;
    }
    if (s.mode === "quiz") {
      const boss = sim.bossKey;
      opts.onQuestion?.(res.questions, boss);
      const right = answerRight(res.questions);
      const before = { hp: s.fight!.hp, lives: s.lives, energy: s.energy };
      sim.answer(right);
      res.answers.push({ correct: right, hpBefore: before.hp, hpAfter: s.fight!.hp, livesBefore: before.lives, livesAfter: s.lives, energyBefore: before.energy, energyAfter: s.energy, boss });
      res.questions++;
      if (!right) res.wrong++;
      const down = s.fight!.hp <= 0;
      sim.resume();
      if (down) res.bosses.push(boss);
      plan = null;
      continue;
    }
    if (s.mode !== "play" && s.mode !== "boss") {
      sim.step({ left: false, right: false, jump: false, shoot: false, power: false, cycle: false });
      plan = null;
      continue;
    }
    if (!plan || plan.f >= SEG) plan = { a: chooseAction(sim), f: 0 };
    sim.step(inputFor(plan.a, plan.f, sim.s.t, true));
    plan.f++;
    sim.drain();
  }
  res.frames = sim.s.t - start;
  res.livesLost = sim.s.livesLost;
  if (!res.cleared && !res.reason) res.reason = `timed out at x=${Math.round(sim.s.p.x)} y=${Math.round(sim.s.p.y + PH)} mode=${sim.s.mode} (arena ${sim.level.arenaX})`;
  return res;
}
