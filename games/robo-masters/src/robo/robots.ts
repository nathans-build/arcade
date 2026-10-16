import type { Subject } from "../kit/types";
import type { FocusTopicId } from "./focus";

/*
 * The eight Robo Masters, the final boss and the hero. Every name, look and line is original.
 * The robots are glitched, not bad: the hero reboots them with right answers, and a rebooted
 * Robo Master shares its power.
 */

export type RobotId = "splitz" | "igneous" | "syntaxor" | "meridian" | "cumulo" | "polarix" | "chlorophil" | "clio";
export type PowerId = "splitter" | "magma" | "comma" | "compass" | "cloud" | "polarity" | "leaf" | "time";

export const HERO = {
  name: "RIVET",
  blurb: "a pocket-sized repair robot with a reboot beam",
};

export interface Power {
  id: PowerId;
  name: string;
  /** Short line for the HUD and stage select. */
  short: string;
  /** What it does, for How to play. */
  desc: string;
  /** Power-meter cost per use (the meter holds POWER_MAX). */
  cost: number;
  /** Two colours for the icon, HUD and the hero's armour while it is selected. */
  color: string;
  color2: string;
}

export const POWERS: Record<PowerId, Power> = {
  splitter: { id: "splitter", name: "Fraction Splitter", short: "3-way beam", desc: "fires a beam that splits three ways", cost: 2, color: "#ffb347", color2: "#c0392b" },
  magma: { id: "magma", name: "Magma Hop", short: "super jump", desc: "a super-high jump from the ground", cost: 3, color: "#ff6a2b", color2: "#7a1f10" },
  comma: { id: "comma", name: "Comma Shield", short: "shield", desc: "a comma-shaped shield that blocks bumps and zaps for a few seconds", cost: 4, color: "#9ad1ff", color2: "#2b4fb8" },
  compass: { id: "compass", name: "Compass Dash", short: "dash", desc: "a fast dash straight ahead (nothing can bump you while dashing)", cost: 3, color: "#ffe066", color2: "#2e8b57" },
  cloud: { id: "cloud", name: "Cloud Step", short: "air jump", desc: "one extra jump in mid-air", cost: 2, color: "#e8f4ff", color2: "#6b7fa8" },
  polarity: { id: "polarity", name: "Polarity Pulse", short: "screen pulse", desc: "a pulse that short-circuits every mini-bot on screen and clears zaps", cost: 6, color: "#ff5ec8", color2: "#3a2bd1" },
  leaf: { id: "leaf", name: "Leaf Glide", short: "glide", desc: "float down slowly on a big leaf (press in the air)", cost: 2, color: "#7dff7a", color2: "#1e7a3a" },
  time: { id: "time", name: "Time Brake", short: "slow time", desc: "slows mini-bots, zaps, hazards and moving platforms for a few seconds", cost: 5, color: "#e0c27a", color2: "#6b4a1f" },
};

export const POWER_IDS = Object.keys(POWERS) as PowerId[];

export interface RobotLook {
  /** Main body, trim, accent/eye colours. */
  body: string;
  trim: string;
  accent: string;
  eye: string;
}

export interface StageTheme {
  name: string;
  /** Sky gradient top/bottom, far scenery, ground fill, ground top edge, hazard colour. */
  skyTop: string;
  skyBottom: string;
  far: string;
  ground: string;
  edge: string;
  hazard: string;
  /** Name of the stage's timed hazard, shown on the stage card. */
  hazardName: string;
  /** Background decoration style drawn by render.ts. */
  deco: "pies" | "caves" | "letters" | "cliffs" | "storm" | "neon" | "greenhouse" | "gears" | "citadel";
}

export interface Robot {
  id: RobotId;
  name: string;
  /** "The Fraction Robo Master" */
  title: string;
  subject: Subject;
  /** Topics asked in MIXED, best first; the first one the grade offers is used (else ALL of the subject). */
  topics: FocusTopicId[];
  /** When the player picks one whole subject: the topic each robot asks, best first (else ALL of it). */
  retune: Record<Subject, FocusTopicId[]>;
  /** Keyword flavour inside its topic (e.g. weather inside Earth science), used when enough items match. */
  flavor: RegExp | null;
  flavorName: string;
  power: PowerId;
  /** The power this robot is weak to: using it in the fight makes the next right answer a double reboot. */
  weakness: PowerId;
  /** Boss movement pattern. */
  pattern: "hop" | "hover" | "dash" | "arc" | "bounce" | "zigzag" | "sprout" | "pendulum";
  look: RobotLook;
  stage: StageTheme;
  lines: { intro: string; block: string[]; hit: string[]; defeat: string };
}

export const ROBOTS: Robot[] = [
  {
    id: "splitz",
    name: "SPLITZ",
    title: "The Fraction Robo Master",
    subject: "math",
    topics: ["fractions", "geometry", "numbers"],
    retune: { math: ["fractions", "ratios", "numbers", "algebra"], science: ["physical"], ela: ["phonics", "grammar"], social: ["economics"] },
    flavor: /fraction|decimal|half|halves|third|fourth|quarter|equal (share|part)|partition/i,
    flavorName: "fractions and equal parts",
    power: "splitter",
    weakness: "polarity",
    pattern: "bounce",
    look: { body: "#f4c26b", trim: "#c0392b", accent: "#fff3c4", eye: "#2ad1ff" },
    stage: {
      name: "Pie Factory", skyTop: "#2b0f3a", skyBottom: "#7a2f4a", far: "#4a1c40", ground: "#8a4a22", edge: "#f4c26b", hazard: "#ff7a3a",
      hazardName: "pie cutters", deco: "pies",
    },
    lines: {
      intro: "I'm SPLITZ! A glitch broke my circuits into pieces. Think you can put me back together?",
      block: ["Blocked! Want to split the difference and try again?", "Nope! That answer was in the wrong slice."],
      hit: ["Whoa! You fixed a whole piece of me!", "Yum! That answer was as easy as pie!"],
      defeat: "Rebooted! I feel whole again. Take my Fraction Splitter!",
    },
  },
  {
    id: "igneous",
    name: "IGNEOUS REX",
    title: "The Volcano Robo Master",
    subject: "science",
    topics: ["earth", "physical"],
    retune: { math: ["geometry", "numbers", "algebra"], science: ["earth"], ela: ["reading"], social: ["geography"] },
    flavor: /volcan|rock|earthquake|plate|magma|lava|mineral|soil|erosion|weathering|\bland|mountain|crust|fossil|layer|sand|pebble|earth material|surface/i,
    flavorName: "rocks, volcanoes and Earth's surface",
    power: "magma",
    weakness: "cloud",
    pattern: "hop",
    look: { body: "#5a4a48", trim: "#ff6a2b", accent: "#ffd23f", eye: "#ffef7a" },
    stage: {
      name: "Magma Mines", skyTop: "#1a0606", skyBottom: "#5a1a0a", far: "#3a1208", ground: "#3a2a26", edge: "#ff6a2b", hazard: "#ff3a1a",
      hazardName: "magma geysers", deco: "caves",
    },
    lines: {
      intro: "ROAR! I'm IGNEOUS REX! My circuits are molten and my temper is volcanic!",
      block: ["Rocky answer! My shield is solid as granite.", "Blocked! That one didn't quite erupt."],
      hit: ["Whoa, that cooled me right down!", "Now THAT'S a rock-solid answer!"],
      defeat: "Rebooted... I feel so much more chill. Lava you, Rivet! Take my Magma Hop!",
    },
  },
  {
    id: "syntaxor",
    name: "SYNTAXOR",
    title: "The Grammar Robo Master",
    subject: "ela",
    topics: ["grammar", "phonics", "reading"],
    retune: { math: ["numbers", "algebra"], science: ["physical"], ela: ["grammar", "reading"], social: ["civics"] },
    flavor: null,
    flavorName: "grammar and words",
    power: "comma",
    weakness: "compass",
    pattern: "hover",
    look: { body: "#3a4ad1", trim: "#f2f4ff", accent: "#ffd23f", eye: "#ff5e7a" },
    stage: {
      name: "Punctuation Press", skyTop: "#0a1030", skyBottom: "#2a3a7a", far: "#1a2458", ground: "#2a2a3a", edge: "#9ad1ff", hazard: "#1a1a1a",
      hazardName: "ink stampers", deco: "letters",
    },
    lines: {
      intro: "Halt! I am SYNTAXOR. A glitch gave me run-on sentences and also run-on sentences and also...",
      block: ["Incorrect! Let me pause, comma, and block that.", "Blocked! That answer needs editing."],
      hit: ["Exclamation point! That really hit home!", "Correct! You put me in my place, like a period."],
      defeat: "Rebooted. Period. Thank you! Take my Comma Shield.",
    },
  },
  {
    id: "meridian",
    name: "MERIDIAN",
    title: "The Map Robo Master",
    subject: "social",
    topics: ["geography", "history"],
    retune: { math: ["geometry", "numbers", "algebra"], science: ["earth"], ela: ["reading"], social: ["geography"] },
    flavor: /map|compass|direction|continent|ocean|globe|latitude|longitude|region|north|south|east|west|landform|symbol|location/i,
    flavorName: "maps, places and directions",
    power: "compass",
    weakness: "magma",
    pattern: "dash",
    look: { body: "#2e8b57", trim: "#ffe066", accent: "#4ab3ff", eye: "#ffffff" },
    stage: {
      name: "Compass Cliffs", skyTop: "#3a7ad1", skyBottom: "#bde3ff", far: "#6a9a7a", ground: "#7a5a3a", edge: "#5fd36a", hazard: "#a0a0a0",
      hazardName: "rolling boulders", deco: "cliffs",
    },
    lines: {
      intro: "I'm MERIDIAN! My compass is spinning in circles and I've lost my bearings!",
      block: ["Wrong way! Recalculating... blocked!", "Blocked! That answer is off the map."],
      hit: ["That pointed me in the right direction!", "Now we're on the map!"],
      defeat: "Rebooted! Now I know where I stand. Take my Compass Dash!",
    },
  },
  {
    id: "cumulo",
    name: "CUMULO-TRON",
    title: "The Weather Robo Master",
    subject: "science",
    topics: ["earth", "physical"],
    retune: { math: ["numbers", "ratios", "algebra"], science: ["earth"], ela: ["reading"], social: ["geography"] },
    flavor: /weather|cloud|rain|wind|storm|temperat|climate|water cycle|precipit|hurricane|tornado|season|evaporat|condens|air (mass|pressure)|front|thermometer|snow/i,
    flavorName: "weather and the water cycle",
    power: "cloud",
    weakness: "time",
    pattern: "zigzag",
    look: { body: "#e8f0ff", trim: "#6b7fa8", accent: "#ffe066", eye: "#2a3a7a" },
    stage: {
      name: "Thunderhead Tower", skyTop: "#1a1f3a", skyBottom: "#4a5578", far: "#2c3350", ground: "#4a5068", edge: "#c8d8ff", hazard: "#fff36a",
      hazardName: "lightning strikes", deco: "storm",
    },
    lines: {
      intro: "Bzzt! CUMULO-TRON forecast: 100% chance of glitches with scattered sparks!",
      block: ["Cloudy answer! Blocked!", "Blocked! That answer was full of hot air."],
      hit: ["That was a real brainstorm!", "Bright and sunny! Good answer!"],
      defeat: "Skies clearing... reboot complete! Take my Cloud Step!",
    },
  },
  {
    id: "polarix",
    name: "POLARIX",
    title: "The Number Line Robo Master",
    subject: "math",
    topics: ["numbers", "algebra"],
    retune: { math: ["numbers", "algebra"], science: ["physical"], ela: ["grammar"], social: ["economics"] },
    flavor: /integer|negative|number line|absolute|opposite|greater|less|compare|order/i,
    flavorName: "number lines and integers",
    power: "polarity",
    weakness: "comma",
    pattern: "arc",
    look: { body: "#2a1f5a", trim: "#ff5ec8", accent: "#5ef0ff", eye: "#ffe066" },
    stage: {
      name: "Number Line Neon", skyTop: "#050018", skyBottom: "#1a0a40", far: "#240a50", ground: "#14143a", edge: "#5ef0ff", hazard: "#ff5ec8",
      hazardName: "zap gates", deco: "neon",
    },
    lines: {
      intro: "I'm POLARIX! My number line got flipped. Up is down and plus is minus!",
      block: ["That's the opposite answer! Blocked!", "Blocked! Below zero on that one."],
      hit: ["Plus one for you! That added up!", "Positively correct!"],
      defeat: "Back to zero... rebooted! You're a real positive. Take my Polarity Pulse!",
    },
  },
  {
    id: "chlorophil",
    name: "CHLORO-PHIL",
    title: "The Plant Robo Master",
    subject: "science",
    topics: ["life", "earth"],
    retune: { math: ["factors", "numbers", "geometry", "algebra"], science: ["life"], ela: ["phonics", "reading"], social: ["economics", "geography"] },
    flavor: /plant|seed|leaf|leaves|root|flower|photosynth|stem|pollin|chlorophyll|sprout|grow|producer/i,
    flavorName: "plants and how they grow",
    power: "leaf",
    weakness: "splitter",
    pattern: "sprout",
    look: { body: "#c8743a", trim: "#3fbf4a", accent: "#ff7ab8", eye: "#1a1a1a" },
    stage: {
      name: "Greenhouse Grove", skyTop: "#0f3a2a", skyBottom: "#5aa86a", far: "#1f5a3a", ground: "#5a3a1a", edge: "#7dff7a", hazard: "#b04aff",
      hazardName: "snapping vines", deco: "greenhouse",
    },
    lines: {
      intro: "Hi, I'm CHLORO-PHIL! A glitch got tangled in my roots. Leaf me alone!",
      block: ["Nope! That answer needs more time to grow.", "Blocked! Try branching out."],
      hit: ["Ooh, that went straight to my roots!", "That answer really blossomed!"],
      defeat: "Rebooted! I'm turning over a new leaf. Take my Leaf Glide!",
    },
  },
  {
    id: "clio",
    name: "CLOCKWORK CLIO",
    title: "The History Robo Master",
    subject: "social",
    topics: ["history", "civics"],
    retune: { math: ["numbers", "ratios", "algebra"], science: ["life"], ela: ["reading"], social: ["history"] },
    flavor: null,
    flavorName: "history and timelines",
    power: "time",
    weakness: "leaf",
    pattern: "pendulum",
    look: { body: "#b8862b", trim: "#5a3a12", accent: "#f2e6c4", eye: "#2a1a0a" },
    stage: {
      name: "Gearworks Museum", skyTop: "#2a1a10", skyBottom: "#6a4a2a", far: "#4a3018", ground: "#4a3a2a", edge: "#e0c27a", hazard: "#8a8a9a",
      hazardName: "gear crushers", deco: "gears",
    },
    lines: {
      intro: "Tick-tock! I'm CLOCKWORK CLIO. A glitch scrambled my whole timeline!",
      block: ["Wrong era! My gears blocked that one.", "Blocked! That answer is out of order."],
      hit: ["That answer is history... the good kind!", "Right on time!"],
      defeat: "Rebooted! It's about time. Take my Time Brake!",
    },
  },
];

export const ROBOT_IDS = ROBOTS.map((r) => r.id);

export function robotById(id: RobotId): Robot {
  return ROBOTS.find((r) => r.id === id)!;
}

/** The robot whose power this is. */
export function robotWithPower(p: PowerId): Robot {
  return ROBOTS.find((r) => r.power === p)!;
}

/** The final boss, met in the Static Citadel after all eight Robo Masters are rebooted. */
export const FINAL_BOSS = {
  id: "static" as const,
  name: "LORD STATIC",
  title: "The Glitch Behind the Glitches",
  look: { body: "#3a3a4a", trim: "#9a9ab0", accent: "#ff3ad1", eye: "#5ef0ff" },
  stage: {
    name: "Static Citadel", skyTop: "#08080f", skyBottom: "#2a1a3a", far: "#1a1428", ground: "#26243a", edge: "#ff3ad1", hazard: "#5ef0ff",
    hazardName: "static fields", deco: "citadel",
  } as StageTheme,
  lines: {
    intro: "SKRRZZT! I am LORD STATIC, the glitch behind all the glitches! I'll scramble EVERY subject at once!",
    block: ["STATIC SHIELD! Fuzzy answer!", "Bzzt! Bad reception on that one!"],
    hit: ["AAGH! Clear signal!", "No! My static is fading!"],
    defeat: "Signal... restored... Okay, okay, I'm rebooted. Can I be the TV for robot movie night?",
  },
};

/** A stage is one of the eight robots or the fortress. */
export type StageId = RobotId | "fortress";
