import {
  CELL_VOLTS, DEFAULT_OHMS, MATERIALS, cellKey, isLoad, rotCount, solve, tidy, type Grid, type MatId, type SolveResult, type Tile, type WireShape,
} from "./circuit";

/*
 * Circuit puzzles. A level is drawn as rows of tokens (one per cell):
 *   .            an empty slot the player can build on
 *   ~            bare board (nothing can go there)
 *   ─ │ ┌ ┐ └ ┘ ├ ┤ ┬ ┴ ┼   fixed wires
 *   B0-B3        a battery (B0: − on the left, + on the right; B1: − on top, + below; B2/B3 flipped)
 *   S0 S1        the switch (flipped by the FLIP SWITCH button)
 *   L F Z R + 0/1  bulb, fan motor, buzzer, resistor (0 = lying left-right, 1 = standing up)
 * `volts` and `ohms` give the batteries' and loads' values in reading order.
 * `pre` are loose parts already on the board (the player may take them away), `tools` the toolbox
 * and `solution` one winning board (npm test checks it, and also searches every placement).
 */

export type CircuitType = "loop" | "materials" | "fixit" | "short" | "series" | "parallel" | "ohm" | "power" | "equiv" | "energy";

export type CircuitGoal =
  | { type: "light" }
  | { type: "series" }
  | { type: "parallel"; amps?: number }
  | { type: "current"; amps: number; of: "load" | "battery" }
  | { type: "power"; watts: number };

export interface Placement {
  r: number;
  c: number;
  tile: Tile;
}
export interface ToolSpec {
  tile: Tile;
  count: number;
}

export interface CircuitLevel {
  kind: "circuit";
  id: string;
  type: CircuitType;
  title: string;
  /** One line under the board. */
  goal: string;
  /** Read at the start (read-aloud for K-2). */
  intro: string;
  /** The science, shown when it's solved. */
  lesson: string;
  rows: string[];
  volts?: number[];
  ohms?: number[];
  pre?: Placement[];
  tools: ToolSpec[];
  win: CircuitGoal;
  solution: Placement[];
}

const WIRE_TOKENS: Record<string, [WireShape, number]> = {
  "─": ["straight", 0], "│": ["straight", 1],
  "└": ["corner", 0], "┌": ["corner", 1], "┐": ["corner", 2], "┘": ["corner", 3],
  "┴": ["tee", 0], "├": ["tee", 1], "┬": ["tee", 2], "┤": ["tee", 3], "┼": ["cross", 0],
};
const PART_TOKENS: Record<string, Tile["kind"]> = { B: "battery", S: "switch", L: "bulb", F: "motor", Z: "buzzer", R: "resistor" };

export interface Board {
  grid: Grid;
  /** True where the player may build. */
  slots: boolean[][];
  rows: number;
  cols: number;
}

export function parseBoard(level: Pick<CircuitLevel, "rows" | "volts" | "ohms" | "pre">): Board {
  const toks = level.rows.map((r) => r.trim().split(/\s+/));
  const rows = toks.length;
  const cols = Math.max(...toks.map((t) => t.length));
  const grid: Grid = [];
  const slots: boolean[][] = [];
  let vi = 0;
  let oi = 0;
  for (let r = 0; r < rows; r++) {
    grid.push([]);
    slots.push([]);
    for (let c = 0; c < cols; c++) {
      const t = toks[r][c] ?? "~";
      slots[r].push(t === ".");
      if (t === "." || t === "~") {
        grid[r].push(null);
      } else if (WIRE_TOKENS[t]) {
        const [shape, rot] = WIRE_TOKENS[t];
        grid[r].push({ kind: "wire", shape, rot, fixed: true });
      } else if (PART_TOKENS[t[0]] && /^[A-Z][0-3]$/.test(t)) {
        const kind = PART_TOKENS[t[0]];
        const tile: Tile = { kind, rot: Number(t[1]), fixed: true };
        if (kind === "battery") tile.volts = level.volts?.[vi++] ?? CELL_VOLTS;
        if (isLoad(tile)) tile.ohms = level.ohms?.[oi++] ?? DEFAULT_OHMS[kind];
        grid[r].push(tile);
      } else throw new Error(`bad token "${t}"`);
    }
  }
  for (const p of level.pre ?? []) {
    if (!slots[p.r]?.[p.c]) throw new Error(`pre part off a slot at ${p.r},${p.c}`);
    grid[p.r][p.c] = { ...p.tile, fixed: false };
  }
  return { grid, slots, rows, cols };
}

/** Same part ignoring rotation (for toolbox counts). */
export function tileSig(t: Tile): string {
  return [t.kind, t.shape ?? "", t.mat ?? "", t.ohms ?? "", t.volts ?? ""].join("|");
}

export function toolLabel(t: Tile): string {
  switch (t.kind) {
    case "wire":
      return t.shape === "straight" ? "Straight wire" : t.shape === "corner" ? "Corner wire" : t.shape === "tee" ? "T wire" : "Cross wire";
    case "material":
      return MATERIALS[t.mat!].label;
    case "battery":
      return `${tidy(t.volts ?? CELL_VOLTS)} V battery`;
    case "resistor":
      return `${tidy(t.ohms ?? 3)} Ω resistor`;
    case "bulb":
      return "Bulb";
    case "motor":
      return "Fan motor";
    case "buzzer":
      return "Buzzer";
    case "switch":
      return "Switch";
  }
}

/* ---------------------------------------------------------------- goals */

export interface Verdict {
  win: boolean;
  res: SolveResult;
  /** What went right or wrong, kid-friendly. */
  message: string;
  /** Measured values for the HUD (current, power…). */
  reading: string;
}

function mainLoad(res: SolveResult) {
  return res.loads.find((l) => l.kind !== "resistor") ?? res.loads[0];
}

/** Every load (bulbs, motors, buzzers) stays on when any one other load is taken out. */
function parallelOk(grid: Grid, res: SolveResult): boolean {
  const loads = res.loads.filter((l) => l.kind !== "resistor");
  if (loads.length < 2) return false;
  for (const off of loads) {
    const r2 = solve(grid, { closed: true, out: new Set([cellKey(off.r, off.c)]) });
    const rest = r2.loads.filter((l) => l.kind !== "resistor" && !(l.r === off.r && l.c === off.c));
    if (!rest.every((l) => l.on)) return false;
  }
  return true;
}

/** Taking out any one load turns every other load off. */
function seriesOk(grid: Grid, res: SolveResult): boolean {
  const loads = res.loads.filter((l) => l.kind !== "resistor");
  if (loads.length < 2) return false;
  for (const off of loads) {
    const r2 = solve(grid, { closed: true, out: new Set([cellKey(off.r, off.c)]) });
    const rest = r2.loads.filter((l) => l.kind !== "resistor" && !(l.r === off.r && l.c === off.c));
    if (rest.some((l) => l.on)) return false;
  }
  return true;
}

export function judge(level: CircuitLevel, grid: Grid): Verdict {
  const res = solve(grid, { closed: true });
  const ml = mainLoad(res);
  const reading = res.short
    ? "SHORT CIRCUIT"
    : ml && ml.kind !== "resistor"
      ? `${tidy(res.volts)} V · ${tidy(Math.abs(ml.current))} A · ${tidy(ml.power)} W`
      : `${tidy(res.volts)} V · ${tidy(res.batteryCurrent)} A from the battery`;
  const fail = (message: string): Verdict => ({ win: false, res, message, reading });
  if (res.short) return fail("SHORT CIRCUIT! A wire goes from one end of the battery straight back to the other, with nothing to use the energy. Take that shortcut wire away.");
  if (!res.batteries) return fail("No battery! A circuit needs a battery (an energy source) to push the current around.");
  if (res.conflict) return fail("Those batteries are fighting each other. Try turning one around.");
  if (!res.allOn) return fail(res.anyOn ? "Some parts work, but not all. Look for the ✗: that's where a loop is broken." : "Nothing works yet: the loop is broken where you see ✗. Current needs a complete path of conductors from one end of the battery to the other.");
  const w = level.win;
  switch (w.type) {
    case "light":
      return { win: true, res, message: "", reading };
    case "series":
      return seriesOk(grid, res)
        ? { win: true, res, message: "", reading }
        : fail("Everything lights, but this isn't one single loop. Make one path, so if one bulb goes out they all go out.");
    case "parallel": {
      if (!parallelOk(grid, res)) return fail("Everything lights, but it's all on one path. Give each part its own branch to the battery, so one going out doesn't turn the others off.");
      if (w.amps !== undefined && Math.abs(res.batteryCurrent - w.amps) > 0.05) return fail(`The battery gives ${tidy(res.batteryCurrent)} A, but the goal is ${tidy(w.amps)} A.`);
      return { win: true, res, message: "", reading };
    }
    case "current": {
      const i = w.of === "battery" ? res.batteryCurrent : Math.abs(ml?.current ?? 0);
      if (Math.abs(i - w.amps) <= 0.02) return { win: true, res, message: "", reading };
      return fail(`The current is ${tidy(i)} A, but it needs to be ${tidy(w.amps)} A. ${i > w.amps ? "Too much current: add more resistance (or less voltage)." : "Too little current: use less resistance (or more voltage)."} I = V ÷ R.`);
    }
    case "power": {
      const p = ml?.power ?? 0;
      if (Math.abs(p - w.watts) <= 0.1) return { win: true, res, message: "", reading };
      return fail(`The ${ml?.kind === "motor" ? "fan" : "part"} gets ${tidy(p)} W, but it needs ${tidy(w.watts)} W. P = V × I, and here I = V ÷ R.`);
    }
  }
}

/* ---------------------------------------------------------------- search (used by npm test) */

/**
 * Tries every way to fill the slots from the toolbox (and the loose parts, which may be taken
 * away or moved), every rotation, and reports the first winning board, or null.
 */
export function searchSolution(level: CircuitLevel, limit = 400000): { grid: Grid; tries: number } | null {
  const board = parseBoard(level);
  const slots: [number, number][] = [];
  board.slots.forEach((row, r) => row.forEach((s, c) => s && slots.push([r, c])));
  // Inventory: toolbox + loose parts.
  const inv = new Map<string, { tile: Tile; count: number }>();
  const add = (t: Tile, n: number) => {
    const k = tileSig(t);
    const cur = inv.get(k);
    if (cur) cur.count += n;
    else inv.set(k, { tile: { ...t, fixed: false }, count: n });
  };
  level.tools.forEach((t) => add(t.tile, t.count));
  (level.pre ?? []).forEach((p) => add(p.tile, 1));
  const items = [...inv.values()];
  const grid = board.grid.map((row) => row.slice());
  for (const [r, c] of slots) grid[r][c] = null;
  let tries = 0;
  let found: Grid | null = null;
  const rec = (i: number) => {
    if (found || tries > limit) return;
    if (i === slots.length) {
      tries++;
      if (judge(level, grid).win) found = grid.map((row) => row.map((t) => (t ? { ...t } : null)));
      return;
    }
    const [r, c] = slots[i];
    grid[r][c] = null;
    rec(i + 1);
    for (const it of items) {
      if (it.count <= 0) continue;
      it.count--;
      for (let rot = 0; rot < rotCount(it.tile); rot++) {
        grid[r][c] = { ...it.tile, rot };
        rec(i + 1);
        if (found) break;
      }
      grid[r][c] = null;
      it.count++;
      if (found) return;
    }
  };
  rec(0);
  return found ? { grid: found, tries } : null;
}

/** The board with a level's stored solution applied. */
export function solutionGrid(level: CircuitLevel): Grid {
  const b = parseBoard(level);
  const g = b.grid.map((row) => row.slice());
  b.slots.forEach((row, r) => row.forEach((s, c) => s && (g[r][c] = null)));
  for (const p of level.solution) g[p.r][p.c] = { ...p.tile, fixed: false };
  return g;
}

/* ---------------------------------------------------------------- the levels */

const W = (shape: WireShape, rot = 0): Tile => ({ kind: "wire", shape, rot });
const M = (mat: MatId, rot = 0): Tile => ({ kind: "material", mat, rot });
const RES = (ohms: number, rot = 0): Tile => ({ kind: "resistor", ohms, rot });
const BAT = (volts: number, rot = 1): Tile => ({ kind: "battery", volts, rot });
const BULB = (rot = 0, ohms = DEFAULT_OHMS.bulb): Tile => ({ kind: "bulb", rot, ohms });
const T = (tile: Tile, count = 1): ToolSpec => ({ tile, count });
const P = (r: number, c: number, tile: Tile): Placement => ({ r, c, tile });

const FRAME_RIGHT_GAP = ["┌ ─ L0 ─ ┐", "│ ~ ~ ~ │", "B1 ~ ~ ~ .", "│ ~ ~ ~ │", "└ ─ S0 ─ ┘"];
const SHORT_BIG = ["┌ ─ L0 ─ ┐", "├ . . ~ │", "B1 ~ . ~ │", "├ . . ~ │", "└ ─ S0 ─ ┘"];
const SHORT_BIG_PRE = [P(1, 1, W("straight", 0)), P(1, 2, W("corner", 2)), P(2, 2, W("straight", 1)), P(3, 2, W("corner", 3)), P(3, 1, W("straight", 0))];
const PARALLEL = ["┌ ─ . L0 ─ . ┐", "│ ~ │ ~ ~ │ │", "B1 ~ └ L0 ─ ┘ │", "│ ~ ~ ~ ~ ~ │", "└ ─ ─ S0 ─ ─ ┘"];

const SAFETY = "Never connect a wire straight from one end of a battery to the other, and never poke anything into a wall outlet: a short circuit makes wires very hot.";

export const CIRCUITS: Record<string, CircuitLevel> = {
  /* ------------------------------------------------------------ K-2 */
  "k2-loop": {
    kind: "circuit", id: "k2-loop", type: "loop", title: "Light the Workshop",
    goal: "Fill the 2 gaps with wire, then flip the switch.",
    intro: "The workshop is dark! Put wire in the two empty spots to make a loop, then flip the switch.",
    lesson: "A bulb lights when there is a complete loop: from the battery, through the bulb, and back to the battery. The battery gives the energy.",
    rows: ["┌ ─ L0 ─ ┐", "│ ~ ~ ~ │", "B1 ~ ~ ~ .", "│ ~ ~ ~ │", "└ . S0 ─ ┘"],
    tools: [T(W("straight"), 2), T(W("corner"))],
    win: { type: "light" },
    solution: [P(2, 4, W("straight", 1)), P(4, 1, W("straight", 0))],
  },
  "k2-materials": {
    kind: "circuit", id: "k2-materials", type: "materials", title: "Library Lamp",
    goal: "Which thing lets the power through? Put it in the gap.",
    intro: "The library lamp needs one more piece. Try a paper clip, a rubber band, a wooden stick or a plastic straw. Which one lets the power through?",
    lesson: "Metal things like a paper clip let electricity through. They are conductors. Rubber, wood and plastic stop it. They are insulators.",
    rows: FRAME_RIGHT_GAP,
    tools: [T(M("clip")), T(M("rubber")), T(M("wood")), T(M("plastic"))],
    win: { type: "light" },
    solution: [P(2, 4, M("clip", 1))],
  },
  "k2-fixit": {
    kind: "circuit", id: "k2-fixit", type: "fixit", title: "Fix the Clinic Light",
    goal: "Find what is blocking the power and swap it for foil.",
    intro: "The clinic light won't turn on. Something in the loop is blocking the power! Flip the switch to find it, then swap it for the foil.",
    lesson: "A rubber band is an insulator, so the loop was broken. Aluminum foil is a metal, a conductor, so the power can flow all the way around.",
    rows: ["┌ ─ L0 . ┐", "│ ~ ~ ~ │", "B1 ~ ~ ~ │", "│ ~ ~ ~ │", "└ ─ S0 ─ ┘"],
    pre: [P(0, 3, M("rubber", 0))],
    tools: [T(M("foil"))],
    win: { type: "light" },
    solution: [P(0, 3, M("foil", 0))],
  },
  "k2-short": {
    kind: "circuit", id: "k2-short", type: "short", title: "Firehouse Safety",
    goal: "A shortcut wire skips the bulb! Take it away with ✋ TAKE.",
    intro: "Uh-oh! A shortcut wire goes from one end of the battery right back to the other end. Flip the switch to see, then take the shortcut away.",
    lesson: `The shortcut was a short circuit: the power skipped the bulb and made the wire hot. ${SAFETY}`,
    rows: ["┌ ─ L0 ─ ┐", "├ . ~ ~ │", "B1 . ~ ~ │", "├ . ~ ~ │", "└ ─ S0 ─ ┘"],
    pre: [P(1, 1, W("corner", 2)), P(2, 1, W("straight", 1)), P(3, 1, W("corner", 3))],
    tools: [],
    win: { type: "light" },
    solution: [],
  },
  "k2-fan": {
    kind: "circuit", id: "k2-fan", type: "energy", title: "Toy Shop Fan",
    goal: "Turn the corners with corner wires to make the fan spin.",
    intro: "The toy shop fan needs power. Use corner wires to finish the loop, then flip the switch.",
    lesson: "The fan's motor uses electricity to spin. Electrical energy became motion!",
    rows: ["┌ ─ F0 ─ .", "│ ~ ~ ~ │", "B1 ~ ~ ~ │", "│ ~ ~ ~ │", ". ─ S0 ─ ┘"],
    tools: [T(W("corner"), 2), T(W("straight"))],
    win: { type: "light" },
    solution: [P(0, 4, W("corner", 2)), P(4, 0, W("corner", 0))],
  },
  "k2-buzzer": {
    kind: "circuit", id: "k2-buzzer", type: "energy", title: "Community Doorbell",
    goal: "Fill the gaps so the doorbell buzzes.",
    intro: "The community center doorbell is quiet. Fill in the gaps so it can buzz!",
    lesson: "The buzzer uses electricity to make a sound. Electrical energy became sound!",
    rows: ["┌ ─ Z0 ─ ┐", "│ ~ ~ ~ .", "B1 ~ ~ ~ │", "│ ~ ~ ~ .", "└ ─ S0 ─ ┘"],
    tools: [T(W("straight"), 2), T(W("corner"))],
    win: { type: "light" },
    solution: [P(1, 4, W("straight", 1)), P(3, 4, W("straight", 1))],
  },
  "k2-materials2": {
    kind: "circuit", id: "k2-materials2", type: "materials", title: "Radio Tower Lamp",
    goal: "Two gaps! Pick the two things that let power through.",
    intro: "The radio tower lamp has two gaps. Find two things that let the power through: a coin, foil, string, a glass rod or paper.",
    lesson: "The coin and the foil are metal, so they conduct electricity. String, glass and paper are insulators: they block it.",
    rows: ["┌ . L0 ─ ┐", "│ ~ ~ ~ │", "B1 ~ ~ ~ │", "│ ~ ~ ~ │", "└ ─ S0 . ┘"],
    tools: [T(M("coin")), T(M("foil")), T(M("string")), T(M("glass")), T(M("paper"))],
    win: { type: "light" },
    solution: [P(0, 1, M("coin", 0)), P(4, 3, M("foil", 0))],
  },
  "k2-townhall": {
    kind: "circuit", id: "k2-townhall", type: "loop", title: "Town Hall Lights",
    goal: "Fill the gaps to light both bulbs.",
    intro: "Last one! Town Hall has two bulbs and two batteries. Finish the loop to light them both.",
    lesson: "Two batteries give more push, so both bulbs in the loop shine bright. You lit up the whole town!",
    rows: ["┌ ─ L0 ─ L0 ─ ┐", "│ ~ ~ ~ ~ ~ │", "B1 ~ ~ ~ ~ ~ .", "B1 ~ ~ ~ ~ ~ │", "└ . ─ S0 ─ ─ ┘"],
    tools: [T(W("straight"), 2), T(W("corner"))],
    win: { type: "light" },
    solution: [P(2, 6, W("straight", 1)), P(4, 1, W("straight", 0))],
  },

  /* ------------------------------------------------------------ 3-5 */
  "g35-loop": {
    kind: "circuit", id: "g35-loop", type: "loop", title: "Light the Workshop",
    goal: "Turn all four corners, then flip the switch.",
    intro: "The workshop is dark. Use corner wires (tap a placed wire to turn it) to make a complete circuit, then flip the switch.",
    lesson: "A complete circuit is a closed loop: battery → wire → bulb → wire → back to the battery. Open the switch and the loop breaks, so the bulb goes out.",
    rows: [". ─ L0 ─ .", "│ ~ ~ ~ │", "B1 ~ ~ ~ │", "│ ~ ~ ~ │", ". ─ S0 ─ ."],
    tools: [T(W("corner"), 4), T(W("straight"))],
    win: { type: "light" },
    solution: [P(0, 0, W("corner", 1)), P(0, 4, W("corner", 2)), P(4, 0, W("corner", 0)), P(4, 4, W("corner", 3))],
  },
  "g35-materials": {
    kind: "circuit", id: "g35-materials", type: "materials", title: "Library Lamp",
    goal: "Fill both gaps with conductors.",
    intro: "Two gaps, six materials. Which are conductors and which are insulators? Test them!",
    lesson: "Metals (the steel paper clip and the aluminum foil) are conductors. Rubber, wood, glass and string are insulators: they block electric current.",
    rows: ["┌ . L0 ─ ┐", "│ ~ ~ ~ │", "B1 ~ ~ ~ .", "│ ~ ~ ~ │", "└ ─ S0 ─ ┘"],
    tools: [T(M("clip")), T(M("foil")), T(M("rubber")), T(M("wood")), T(M("glass")), T(M("string"))],
    win: { type: "light" },
    solution: [P(0, 1, M("clip", 0)), P(2, 4, M("foil", 1))],
  },
  "g35-fixit": {
    kind: "circuit", id: "g35-fixit", type: "fixit", title: "Fix the Clinic Light",
    goal: "Find both breaks and fix them.",
    intro: "The clinic light is broken in two places. Flip the switch: the ✗ marks show where the loop is open.",
    lesson: "An eraser is an insulator, and a gap is an open circuit. Both stop the current. Fix every break and the circuit is complete.",
    rows: ["┌ ─ L0 ─ ┐", "│ ~ ~ ~ .", "B1 ~ ~ ~ │", "│ ~ ~ ~ │", "└ . S0 ─ ┘"],
    pre: [P(4, 1, M("eraser", 0))],
    tools: [T(W("straight")), T(M("copper"))],
    win: { type: "light" },
    solution: [P(1, 4, W("straight", 1)), P(4, 1, M("copper", 0))],
  },
  "g35-short": {
    kind: "circuit", id: "g35-short", type: "short", title: "Firehouse Safety",
    goal: "Spot the short circuit and break it.",
    intro: "Flip the switch. Something is wrong: the bulb stays dark and a wire gets hot! Find the short circuit and fix it.",
    lesson: `A short circuit is a path with no bulb or motor in it, straight across the battery. Current rushes through it, the wire heats up, and the bulb gets nothing. ${SAFETY}`,
    rows: SHORT_BIG,
    pre: SHORT_BIG_PRE,
    tools: [],
    win: { type: "light" },
    solution: [],
  },
  "g35-motor": {
    kind: "circuit", id: "g35-motor", type: "energy", title: "Toy Shop Fan",
    goal: "Finish the circuit to run the fan and the light.",
    intro: "The toy shop fan and its light share one loop. Finish it with a wire and a conductor.",
    lesson: "One loop runs both parts: the motor turns electrical energy into motion, and the bulb turns it into light (and a little heat).",
    rows: ["┌ ─ F0 ─ L0 ─ ┐", "│ ~ ~ ~ ~ ~ .", "B1 ~ ~ ~ ~ ~ │", "B1 ~ ~ ~ ~ ~ │", "└ ─ . S0 ─ ─ ┘"],
    tools: [T(W("straight")), T(W("corner")), T(M("clip")), T(M("rubber"))],
    win: { type: "light" },
    solution: [P(1, 6, W("straight", 1)), P(4, 2, M("clip", 0))],
  },
  "g35-parallel": {
    kind: "circuit", id: "g35-parallel", type: "parallel", title: "Radio Tower Beacons",
    goal: "Give each bulb its own path (use T wires).",
    intro: "The radio tower has two beacons. Wire them so each one has its own path to the battery. Then unscrew one (tap it): does the other stay on?",
    lesson: "This is a parallel circuit: each bulb has its own path, so if one goes out the other stays lit. Houses are wired this way.",
    rows: PARALLEL,
    tools: [T(W("tee"), 2), T(W("straight"), 2)],
    win: { type: "parallel" },
    solution: [P(0, 2, W("tee", 2)), P(0, 5, W("tee", 2))],
  },

  /* ------------------------------------------------------------ 6-8 */
  "g68-energy": {
    kind: "circuit", id: "g68-energy", type: "energy", title: "Workshop Power-Up",
    goal: "Complete the circuit with conductors.",
    intro: "Power up the workshop's lamp and fan. Finish the circuit using conductors only.",
    lesson: "Energy transfer: the batteries' chemical energy becomes electrical energy, then light and heat in the bulb and motion (kinetic energy) in the fan. No energy is lost, it just changes form.",
    rows: [". ─ L0 ─ F0 ─ ┐", "│ ~ ~ ~ ~ ~ │", "B1 ~ ~ ~ ~ ~ .", "B1 ~ ~ ~ ~ ~ │", "└ ─ . S0 ─ ─ ┘"],
    tools: [T(W("corner")), T(W("straight")), T(M("foil")), T(M("glass")), T(M("wood"))],
    win: { type: "light" },
    solution: [P(0, 0, W("corner", 1)), P(2, 6, W("straight", 1)), P(4, 2, M("foil", 0))],
  },
  "g68-series": {
    kind: "circuit", id: "g68-series", type: "series", title: "Library Reading Lights",
    goal: "Add the second bulb in the same loop (series).",
    intro: "Put the second bulb into the same single loop. Then unscrew one (tap it while the switch is on) and watch the other.",
    lesson: "Series circuit: one path, so the current goes through both bulbs. Unscrew one and the loop breaks, so both go out. They also share the voltage, so each glows a bit less than a bulb alone.",
    rows: ["┌ ─ L0 ─ . ─ ┐", "│ ~ ~ ~ ~ ~ │", "B1 ~ ~ ~ ~ ~ │", "B1 ~ ~ ~ ~ ~ │", "└ ─ S0 ─ ─ ─ ┘"],
    tools: [T(BULB()), T(W("straight"))],
    win: { type: "series" },
    solution: [P(0, 4, BULB(0))],
  },
  "g68-parallel": {
    kind: "circuit", id: "g68-parallel", type: "parallel", title: "School Hallway Lights",
    goal: "Wire two bulbs in parallel.",
    intro: "The school hallway needs two lights that work on their own. Build a parallel circuit.",
    lesson: "In parallel each bulb gets the battery's full voltage, so both glow as brightly as one bulb alone, and one going out doesn't stop the other. The battery has to give more current, though.",
    rows: ["┌ ─ . L0 ─ . ┐", "│ ~ │ ~ ~ │ │", "B1 ~ └ . ─ ┘ │", "│ ~ ~ ~ ~ ~ │", "└ ─ ─ S0 ─ ─ ┘"],
    tools: [T(W("tee"), 2), T(BULB()), T(W("straight"), 2)],
    win: { type: "parallel" },
    solution: [P(0, 2, W("tee", 2)), P(0, 5, W("tee", 2)), P(2, 3, BULB(0))],
  },
  "g68-fixit": {
    kind: "circuit", id: "g68-fixit", type: "fixit", title: "Fix the Clinic Light",
    goal: "Swap every insulator for a conductor.",
    intro: "Three pieces in this loop, but which ones block the current? Test, find the ✗ marks and swap.",
    lesson: "In metals some electrons are free to move, so current flows. In insulators like glass and wood the electrons are held tightly, so current can't flow.",
    rows: ["┌ . L0 ─ ┐", "│ ~ ~ ~ │", "B1 ~ ~ ~ .", "│ ~ ~ ~ │", "└ ─ S0 . ┘"],
    pre: [P(0, 1, M("glass", 0)), P(2, 4, M("wood", 1)), P(4, 3, M("clip", 0))],
    tools: [T(M("copper")), T(M("foil")), T(M("string"))],
    win: { type: "light" },
    solution: [P(0, 1, M("copper", 0)), P(2, 4, M("foil", 1)), P(4, 3, M("clip", 0))],
  },
  "g68-short": {
    kind: "circuit", id: "g68-short", type: "short", title: "Firehouse Safety",
    goal: "Find the short circuit and remove it.",
    intro: "The firehouse lights are wired in parallel, but someone added a third branch with no bulb in it. Flip the switch and find the problem.",
    lesson: `The bare-wire branch connected the battery's + side to its − side with almost no resistance, a short circuit. Current takes the easy path, so the bulbs get almost nothing while the wire heats up. Fuses and breakers cut a short off. ${SAFETY}`,
    rows: ["┌ ─ ┬ L0 ─ ┬ ┐", "│ ~ │ ~ ~ │ │", "B1 ~ ├ L0 ─ ┤ │", "│ ~ . . . . │", "└ ─ ─ S0 ─ ─ ┘"],
    pre: [P(3, 2, W("corner", 0)), P(3, 3, W("straight", 0)), P(3, 4, W("straight", 0)), P(3, 5, W("corner", 3))],
    tools: [],
    win: { type: "light" },
    solution: [P(3, 2, W("corner", 0)), P(3, 4, W("straight", 0)), P(3, 5, W("corner", 3))],
  },
  "g68-radio": {
    kind: "circuit", id: "g68-radio", type: "parallel", title: "Radio Tower Station",
    goal: "Light, sound and motion: put all three on their own branches.",
    intro: "The radio station needs its lamp, its fan and its buzzer, each on its own branch. Use T wires on the top and bottom rails.",
    lesson: "Three energy changes at once: the bulb makes light, the fan makes motion and the buzzer makes sound, all from electrical energy. In parallel, each branch works on its own.",
    rows: ["┌ ─ . ─ . ─ ┐", "│ ~ L1 ~ F1 ~ Z1", "B1 ~ │ ~ │ ~ │", "│ ~ │ ~ │ ~ │", "└ S0 . ─ . ─ ┘"],
    tools: [T(W("tee"), 4), T(W("straight"), 2)],
    win: { type: "parallel" },
    solution: [P(0, 2, W("tee", 2)), P(0, 4, W("tee", 2)), P(4, 2, W("tee", 0)), P(4, 4, W("tee", 0))],
  },

  /* ------------------------------------------------------------ 9-12 */
  "hs-ohm": {
    kind: "circuit", id: "hs-ohm", type: "ohm", title: "Workshop: Ohm's Law",
    goal: "Pick the resistor so the 4 Ω bulb gets 0.5 A from 6 V.",
    intro: "The workshop bulb is rated for 0.5 A. The battery is 6 V and the bulb is 4 Ω. Which resistor in series gives exactly 0.5 A?",
    lesson: "V = I × R, so the total resistance must be 6 V ÷ 0.5 A = 12 Ω. The bulb has 4 Ω, so the resistor adds 8 Ω. In series, resistances add.",
    rows: ["┌ ─ L0 ─ . ─ ┐", "│ ~ ~ ~ ~ ~ │", "B1 ~ ~ ~ ~ ~ │", "│ ~ ~ ~ ~ ~ │", "└ ─ S0 ─ ─ ─ ┘"],
    volts: [6], ohms: [4],
    tools: [T(RES(2)), T(RES(4)), T(RES(8)), T(RES(12)), T(W("straight"))],
    win: { type: "current", amps: 0.5, of: "load" },
    solution: [P(0, 4, RES(8, 0))],
  },
  "hs-battery": {
    kind: "circuit", id: "hs-battery", type: "ohm", title: "Library: Pick the Battery",
    goal: "The 6 Ω lamp needs 1.5 A. Which battery?",
    intro: "The library's reading lamp is 6 Ω and needs 1.5 A. Choose the battery that gives exactly that.",
    lesson: "V = I × R = 1.5 A × 6 Ω = 9 V. Flipping the battery reverses the current's direction but not its size.",
    rows: ["┌ ─ L0 ─ ┐", "│ ~ ~ ~ │", ". ~ ~ ~ │", "│ ~ ~ ~ │", "└ ─ S0 ─ ┘"],
    ohms: [6],
    tools: [T(BAT(1.5)), T(BAT(3)), T(BAT(6)), T(BAT(9))],
    win: { type: "current", amps: 1.5, of: "load" },
    solution: [P(2, 0, BAT(9, 1))],
  },
  "hs-series": {
    kind: "circuit", id: "hs-series", type: "equiv", title: "School: Series Resistance",
    goal: "12 V, 1 A through the 4 Ω bulb. Use two resistors.",
    intro: "The school's bell light is 4 Ω on a 12 V supply and must get 1 A. Fill both gaps with resistors.",
    lesson: "Total resistance = 12 V ÷ 1 A = 12 Ω. In series R = R₁ + R₂ + R₃, so the two resistors must add to 8 Ω: 2 Ω + 6 Ω.",
    rows: ["┌ ─ L0 ─ . ─ ┐", "│ ~ ~ ~ ~ ~ │", "B1 ~ ~ ~ ~ ~ .", "│ ~ ~ ~ ~ ~ │", "└ ─ S0 ─ ─ ─ ┘"],
    volts: [12], ohms: [4],
    tools: [T(RES(2)), T(RES(3)), T(RES(6)), T(RES(10)), T(W("straight"))],
    win: { type: "current", amps: 1, of: "load" },
    solution: [P(0, 4, RES(2, 0)), P(2, 6, RES(6, 1))],
  },
  "hs-parallel": {
    kind: "circuit", id: "hs-parallel", type: "equiv", title: "Clinic: Parallel Current",
    goal: "Two 6 Ω lamps in parallel on 6 V: battery current 2 A.",
    intro: "The clinic needs two 6 Ω exam lamps that work on their own, on a 6 V battery. Build it so the battery gives 2 A.",
    lesson: "In parallel, 1/R = 1/6 + 1/6, so R = 3 Ω and I = 6 V ÷ 3 Ω = 2 A. Each branch gets the full 6 V and 1 A.",
    rows: PARALLEL,
    volts: [6], ohms: [6, 6],
    tools: [T(W("tee"), 2), T(W("straight"), 2)],
    win: { type: "parallel", amps: 2 },
    solution: [P(0, 2, W("tee", 2)), P(0, 5, W("tee", 2))],
  },
  "hs-short": {
    kind: "circuit", id: "hs-short", type: "short", title: "Firehouse: Short Circuit",
    goal: "Find the zero-resistance path and break it.",
    intro: "A 9 V battery, a lamp, and a sneaky wire. Flip the switch: the lamp stays dark. Why? Fix it.",
    lesson: `I = V ÷ R: with almost no resistance in the shortcut, the current gets huge, the wire heats up (P = I²R in the wire) and the battery drains. Fuses and circuit breakers open the circuit when current gets too big. ${SAFETY}`,
    rows: SHORT_BIG,
    volts: [9], ohms: [6],
    pre: SHORT_BIG_PRE,
    tools: [],
    win: { type: "light" },
    solution: [],
  },
  "hs-power": {
    kind: "circuit", id: "hs-power", type: "power", title: "Toy Shop: Power",
    goal: "The 6 Ω fan needs 6 W. Which battery?",
    intro: "The toy shop fan motor acts like 6 Ω and is designed for 6 W. Choose the battery.",
    lesson: "P = V × I and I = V ÷ R, so P = V² ÷ R. 6 V: P = 36 ÷ 6 = 6 W. 12 V would give 24 W, four times too much!",
    rows: ["┌ ─ F0 ─ ┐", "│ ~ ~ ~ │", ". ~ ~ ~ │", "│ ~ ~ ~ │", "└ ─ S0 ─ ┘"],
    ohms: [6],
    tools: [T(BAT(3)), T(BAT(6)), T(BAT(9)), T(BAT(12))],
    win: { type: "power", watts: 6 },
    solution: [P(2, 0, BAT(6, 1))],
  },
  "hs-equiv": {
    kind: "circuit", id: "hs-equiv", type: "equiv", title: "Radio Tower: Parallel Resistors",
    goal: "6 V supply, 2.5 A total: two resistors in parallel.",
    intro: "The radio transmitter's load must draw 2.5 A from 6 V. Put one resistor in each branch.",
    lesson: "R = V ÷ I = 6 ÷ 2.5 = 2.4 Ω. In parallel 1/R = 1/4 + 1/6 = 5/12, so R = 2.4 Ω. A plain wire in a branch would be a short circuit!",
    rows: ["┌ ─ ┬ . ─ ┬ ┐", "│ ~ │ ~ ~ │ │", "B1 ~ └ . ─ ┘ │", "│ ~ ~ ~ ~ ~ │", "└ ─ ─ S0 ─ ─ ┘"],
    volts: [6],
    tools: [T(RES(2)), T(RES(4)), T(RES(6)), T(RES(8)), T(W("straight"))],
    win: { type: "current", amps: 2.5, of: "battery" },
    solution: [P(0, 3, RES(4, 0)), P(2, 3, RES(6, 0))],
  },
};
