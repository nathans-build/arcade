import { THEMES, type FloorTheme } from "./floors";
import { KIND_META, type ComboKind, type KindId, type SectionId } from "./unit3";

/*
 * Dojo Tower: Rates & Percents — the floor masters and the floor plans. Each floor follows a section of
 * Math 6 · Unit 3 (docs/math6-unit3.md); its master asks that section's questions, and floors 3-7 add
 * COMBO story problems. All names, lines and looks are original; the lines are kid-friendly puns
 * (nobody gets hurt: hits are "combo hits", masters bow out).
 *
 * Looks are drawn by render.ts from a body, a head, a hat, a prop, a palette and a size.
 */

export type LegacySprite = "wordwhirl" | "abacus" | "gavel" | "momentum" | "inkmaster";
export type BossBody = "robe" | "gi" | "coat" | "armor" | "beast";
export type BossHead = "human" | "ox" | "fox" | "owl" | "panda" | "bear" | "goblin";
export type BossHat =
  | "none" | "bun" | "wig" | "crown" | "wizard" | "tophat" | "helmet" | "beret" | "mortarboard" | "headband"
  | "hood" | "leafcrown" | "tricorn" | "goggles" | "cap" | "flame" | "bowler" | "dome" | "spiky" | "topknot"
  | "beard" | "mask";
export type BossProp =
  | "quill" | "abacus" | "gavel" | "pendulum" | "brush" | "tally" | "pie" | "protractor" | "timessign" | "scales"
  | "bamboo" | "slate" | "staff" | "fan" | "magnifier" | "volcano" | "cloud" | "magnet" | "leaf" | "telescope"
  | "flask" | "bone" | "atom" | "pencil" | "book" | "comma" | "scroll" | "drum" | "map" | "ruler" | "coin"
  | "compass" | "apple" | "hourglass" | "ballot" | "globe";

export interface BossLook {
  /** One of the five original hand-drawn masters (drawn as before). */
  sprite?: LegacySprite;
  body: BossBody;
  head: BossHead;
  hat: BossHat;
  prop: BossProp;
  /** Main outfit colour, its shade, and the trim (belt, hat band, piping). */
  robe: string;
  robe2: string;
  trim: string;
  skin: string;
  hair: string;
  /** Pixel scale (1.5 = the original masters' size). */
  size: number;
}


export interface Boss {
  id: string;
  name: string;
  /** The floor's name while this master holds it, e.g. "UNIT SWAP SHOP". */
  hall: string;
  look: BossLook;
  /** Said when the master arrives. */
  intro: string;
  /** Said when the master blocks a wrong answer (cycled). */
  block: string[];
  /** Said after a right answer lands a hit (cycled). */
  hit: string[];
  /** Said when the master is beaten. */
  defeat: string[];
}

const SKIN = "#f1c27d";
const SKIN2 = "#c68c53";
const SKIN3 = "#8d5a3a";

type L = Partial<BossLook> & Pick<BossLook, "body" | "head" | "hat" | "prop" | "robe" | "robe2" | "trim">;
const look = (l: L): BossLook => ({ skin: SKIN, hair: "#2a1a10", size: 1.5, ...l });

function boss(id: string, name: string, hall: string, lk: BossLook, intro: string, block: string[], hit: string[], defeat: string[]): Boss {
  return { id, name, hall, look: lk, intro, block, hit, defeat };
}

export const SKYLINE = boss("skyline", "CAPTAIN SKYLINE", "SKYSCRAPER LOOKOUT",
  look({ body: "coat", head: "human", hat: "helmet", prop: "telescope", robe: "#c45a1a", robe2: "#8a3e10", trim: "#ffd23f", skin: SKIN2, size: 1.55 }),
  "How many windows on a tower THIS tall? Estimate, student!",
  ["Way off the skyline! Blocked!", "Scale it up the right way!"],
  ["Ooh! A sky-high estimate!", "That one reached the top floor!"],
  ["Your estimates tower over mine! Climb on!", "I see it from up here: you win!"]);

export const MEASURE = boss("measure", "MADAM MEASURE", "UNIT SWAP SHOP",
  look({ body: "robe", head: "human", hat: "beret", prop: "ruler", robe: "#2a8a8a", robe2: "#1c6060", trim: "#ffd23f", hair: "#1b1b2a", skin: SKIN3 }),
  "Inches, feet, quarts, pounds... can you swap them all?",
  ["Wrong unit! Blocked!", "Bigger unit, smaller number — remember!"],
  ["Ouch! Measured perfectly!", "A conversion combo!"],
  ["You've got my measure! Go on up.", "Every unit bows to you!"]);

export const MARIGOLD = boss("marigold", "MERCHANT MARIGOLD", "DEAL OR STEAL BAZAAR",
  look({ body: "coat", head: "human", hat: "tophat", prop: "coin", robe: "#7a2a8a", robe2: "#521c60", trim: "#ffd23f", hair: "#c8502a", size: 1.5 }),
  "Two prices, two sizes... which is the real bargain?",
  ["No sale! Blocked!", "Check the price for ONE!"],
  ["Oof! You found the better deal!", "A bargain-sized hit!"],
  ["You out-shopped me! Climb on!", "Best deal in the tower: YOU!"]);

export const QUICKSTEP = boss("quickstep", "RACER QUICKSTEP", "RACE DAY TRACK",
  look({ body: "gi", head: "human", hat: "goggles", prop: "hourglass", robe: "#e3262f", robe2: "#a01a22", trim: "#f2f4ff", skin: SKIN2, hair: "#3b2a1a", size: 1.45 }),
  "Miles per hour or minutes per mile? Race me!",
  ["Too slow! Blocked!", "Lower pace is FASTER — remember!"],
  ["Whoa! You lapped me!", "A speedy combo!"],
  ["You win by a mile! Go on.", "Out-paced! Climb on!"]);

export const PANDA = boss("percentpanda", "THE PER-CENT PANDA", "HUNDRED-STEP GARDEN",
  look({ body: "beast", head: "panda", hat: "none", prop: "scroll", robe: "#f2f4ff", robe2: "#1b1b2a", trim: "#ffd23f", size: 1.6 }),
  "Everything here is out of one hundred! Ready?",
  ["Not per hundred! Blocked!", "Bamboo-zled! Check the tape."],
  ["Oof! One hundred percent right!", "A perfect-percent hit!"],
  ["You've got 100% of my respect!", "Panda-monium! You win!"]);

export const MARKDOWN = boss("markdown", "MADAM MARKDOWN", "MALL RUSH ARCADE",
  look({ body: "robe", head: "human", hat: "bun", prop: "scales", robe: "#c42a6a", robe2: "#8a1a4a", trim: "#ffd23f", hair: "#1b1b2a", skin: SKIN }),
  "Sale! Tax! Tip! But what do you REALLY pay?",
  ["Not the final price! Blocked!", "You're not done yet!"],
  ["Ka-ching! Exact change!", "Ouch! Discount combo!"],
  ["Sold! You win the mall!", "Checkout complete. Climb on!"]);

export const BRUSHSTROKE = boss("brushstroke", "GRANDMASTER BRUSHSTROKE", "PAINT THE ROOM STUDIO",
  look({ body: "robe", head: "human", hat: "topknot", prop: "brush", robe: "#e8f2ff", robe2: "#a8c8f0", trim: "#ffd23f", skin: SKIN, hair: "#f2f4ff", size: 1.8 }),
  "Walls, doors, coats, cans and tax. Paint my room, step by step!",
  ["A drip! Blocked!", "Round the gallons UP, student!"],
  ["A masterpiece of a hit!", "Ho ho! Fresh coat of combo!"],
  ["The room is painted. You are the Master of the Tower!", "Every wall bows to you!"]);

export const SCALEUP = boss("scaleup", "THE SCALE-UP SENSEI", "COPY ROOM",
  look({ body: "armor", head: "owl", hat: "none", prop: "magnifier", robe: "#4a3a8a", robe2: "#2e2460", trim: "#9ae8ff", hair: "#8a6a4a", size: 1.5 }),
  "One-fifty percent! Two hundred! Can you scale with me?",
  ["Out of scale! Blocked!", "Area scales by the factor SQUARED!"],
  ["Hoo! A scaled-up hit!", "Double the size, double the combo!"],
  ["You scaled my tower! Bonus cleared!", "Seventh grade, here you come!"]);

export const SECOND_CHANCE = boss("secondchance", "SENSEI SECOND-CHANCE", "RETRY DOJO",
  look({ body: "gi", head: "bear", hat: "headband", prop: "book", robe: "#3a6ab0", robe2: "#244a80", trim: "#ffd23f", size: 1.55 }),
  "The ones that got away... let's try them with new numbers!",
  ["Almost! Try the hint.", "Blocked — read the feedback!"],
  ["Yes! Now you've got it!", "That's the way!"],
  ["Mistakes fixed! Well trained!", "Second chance: taken!"]);

export const ALL_BOSSES = [SKYLINE, MEASURE, MARIGOLD, QUICKSTEP, PANDA, MARKDOWN, BRUSHSTROKE, SCALEUP, SECOND_CHANCE];

export type Weighted = [KindId, number][];

export interface FloorPlan {
  /** Tower floor (1-7, 8 = bonus Copy Room, 0 = retry round). */
  n: number;
  /** Banner name: "FLOOR 3", "BONUS FLOOR", "RETRY DOJO". */
  label: string;
  section: SectionId | "R";
  /** e.g. "SECTION C · RATES". */
  sectionLabel: string;
  theme: FloorTheme;
  boss: Boss;
  hall: string;
  /** Floor-master questions (weighted). */
  kinds: Weighted;
  /** Gold-scroll questions (weighted). */
  scrollKinds: Weighted;
  /** COMBO story problems: none, once per fight (the 2nd question), or every question. */
  combo: { kinds: ComboKind[]; mode: "none" | "once" | "all" };
  /** Floor master HP. */
  hp: number;
  /** Retry round: always start at the master (no running part). */
  bossOnly?: boolean;
}

const BRIDGE: Weighted = [["copier", 2], ["enlargedBy", 2], ["areaScale", 2], ["reverseCopy", 1], ["scaleRatio", 1]];


function floor(n: number, section: SectionId, sectionLabel: string, theme: FloorTheme, b: Boss, kinds: Weighted, combo: FloorPlan["combo"], hp: number, scrollKinds?: Weighted): FloorPlan {
  return { n, label: n === 8 ? "BONUS FLOOR" : `FLOOR ${n}`, section, sectionLabel, theme, boss: b, hall: b.hall, kinds, scrollKinds: scrollKinds ?? kinds, combo, hp };
}

const NONE: FloorPlan["combo"] = { kinds: [], mode: "none" };

/** Floors 1-7 (the unit) and 8 (the bridge bonus floor). */
export const FLOORS_ALL: FloorPlan[] = [
  floor(1, "A", "SECTION A · ESTIMATING WITH RATES", THEMES.skyline, SKYLINE,
    [["washTime", 3], ["washHours", 2], ["towerHeight", 2], ["elevator", 2], ["crewCost", 2], ["stairs", 2]], NONE, 3),
  floor(2, "B", "SECTION B · UNITS & CONVERSIONS", THEMES.measure, MEASURE,
    [["unitAnchor", 2], ["biggerNumber", 1], ["moreOrFewer", 1], ["convert", 4], ["convert2", 2], ["convertFrac", 2], ["unitCost", 2]], NONE, 3),
  floor(3, "C", "SECTION C · COMPARING RATES", THEMES.bazaar, MARIGOLD,
    [["whoFaster", 2], ["betterDeal", 2], ["unitPriceRound", 2], ["twoRates", 3], ["sameRate", 3]], { kinds: ["comboDeal"], mode: "once" }, 3),
  floor(4, "C", "SECTION C · SPEED, PACE & MULTI-STEP", THEMES.track, QUICKSTEP,
    [["paceCompare", 2], ["speedToPace", 1], ["paceToSpeed", 1], ["fastestPace", 1], ["unitThenTotal", 2], ["roundAtEnd", 2], ["timeForDistance", 1], ["recipeBatch", 2], ["cookieScale", 1], ["gasOp", 1]],
    { kinds: ["comboRunner"], mode: "once" }, 3),
  floor(5, "D", "SECTION D · PERCENTS, LINES & TAPES", THEMES.hundred, PANDA,
    [["percentMeaning", 1], ["ticketPercent", 2], ["outOf", 1], ["dnlPart", 3], ["dnlWhole", 1], ["tapeWhole", 2], ["tapePart", 1], ["benchmark", 3]],
    { kinds: ["comboTank"], mode: "once" }, 3),
  floor(6, "D", "SECTION D · PART, WHOLE, PERCENT & SHOPPING", THEMES.mall, MARKDOWN,
    [["findPart", 3], ["findWhole", 3], ["findPercent", 3], ["discount", 2], ["tax", 2], ["tip", 1]],
    { kinds: ["comboShop"], mode: "once" }, 3),
  floor(7, "E", "SECTION E · PAINT THE ROOM", THEMES.studio, BRUSHSTROKE,
    [["paintWalls", 1], ["paintSubtract", 1], ["paintGallons", 1], ["paintBuy", 1], ["paintTax", 1]],
    { kinds: ["comboPaint"], mode: "all" }, 4,
    [["paintGallons", 1], ["paintBuy", 1], ["copier", 1], ["enlargedBy", 1], ["areaScale", 1]]),
  floor(8, "X", "BRIDGE · SCALE FACTORS (7TH GRADE)", THEMES.copy, SCALEUP, BRIDGE, NONE, 3),
];

export type Practice = "full" | "A" | "B" | "C" | "D" | "E" | "X";

export const PRACTICES: { id: Practice; label: string; note: string }[] = [
  { id: "full", label: "FULL CLIMB", note: "All 7 floors · about 10-15 min" },
  { id: "A", label: "A", note: "Estimating with rates" },
  { id: "B", label: "B", note: "Units & conversions" },
  { id: "C", label: "C", note: "Rates, speed & pace" },
  { id: "D", label: "D", note: "Percentages" },
  { id: "E", label: "E", note: "Paint the Room" },
  { id: "X", label: "BRIDGE", note: "Scale factors (bonus)" },
];

/** The floors a practice choice plays. */
export function practicePlan(p: Practice): FloorPlan[] {
  if (p === "full") return FLOORS_ALL.slice(0, 7);
  return FLOORS_ALL.filter((f) => f.section === p);
}

/** "Redo the ones I missed": a boss-only round with new numbers for the missed skill tags. */
export function retryPlan(tags: number[]): FloorPlan[] {
  const kinds: Weighted = [];
  for (const k of Object.keys(KIND_META) as KindId[]) {
    const m = KIND_META[k];
    if (!tags.includes(m.tag) || k.startsWith("combo")) continue;
    kinds.push([k, 1]);
  }
  const hp = Math.max(3, Math.min(8, tags.length * 2));
  return [{
    n: 0, label: "RETRY DOJO", section: "R", sectionLabel: "REDO THE ONES I MISSED", theme: THEMES.retry, boss: SECOND_CHANCE, hall: SECOND_CHANCE.hall,
    kinds, scrollKinds: kinds, combo: NONE, hp, bossOnly: true,
  }];
}

/** A line from a list, cycled by a counter. */
export function lineOf(lines: string[], i: number): string {
  return lines[((i % lines.length) + lines.length) % lines.length];
}
