import { fmtTemp, type Band } from "./common";

/*
 * Heat puzzles. Pure TypeScript (npm test runs every level).
 *
 * The models (simple, but physically honest):
 *  - Cooling and warming (keep it hot / keep it cold): Newton's law of cooling. The drink or
 *    ice pop moves toward room temperature, T(t) = Troom + (T0 − Troom)·e^(−k t), with
 *    k = 1 / (R·C): R is the container's thermal resistance (better insulator → bigger R →
 *    slower change) and C how much heat the food holds. Heat always flows from hot to cold, so
 *    T only ever moves toward room temperature and never crosses it. Insulators don't add
 *    cold or heat; they slow the flow.
 *  - Sunshine (radiation): an object in the sun absorbs a fraction a of the sunlight (dark
 *    colours a lot, white and shiny surfaces little) and loses heat to the air:
 *    T(t) = Troom + (a·S/k)(1 − e^(−k t)).
 *  - Spoons and handles (conduction): the handle warms toward a steady temperature between the
 *    soup and the room. Metals conduct heat well, so their handle warms fast and gets hot;
 *    wood and plastic barely change.
 *  - Heater placement (convection): a room as a floor layer and a ceiling layer. Warm air rises,
 *    so a heater by the floor stirs the whole room (strong mixing); a heater near the ceiling
 *    leaves warm air trapped up high (weak mixing) and the floor stays cold.
 *  - The cold night (insulation): C·dT/dt = P − UA·(T − Tout). Each part of the house (attic,
 *    walls, windows, door gaps) lets heat out; insulating it lowers its UA (raises its R-value).
 *    Inside approaches Tout + P/UA.
 *  - Heating water (Q = m·c·ΔT): a 1000 W heater in an insulated tank raises 2 kg of water by
 *    P·t / (m·c) degrees.
 */

export type HeatType = "keep-hot" | "keep-cold" | "radiation" | "conduction" | "convection" | "insulate" | "heat-up";
export type Scene = "cocoa" | "icepop" | "sun" | "spoons" | "room" | "house" | "tank";

export interface HeatOption {
  id: string;
  label: string;
  /** Small print (R-value, cost…). */
  detail?: string;
  /** The model's number for this option (R, absorptivity, conduction factor, seconds…). */
  value: number;
  /** For conduction: how fast the handle warms (per minute). */
  rate?: number;
  /** Insulation: cost in coins and the heat-loss it saves (UA). */
  cost?: number;
  save?: number;
  color: string;
}

export interface HeatLevel {
  kind: "heat";
  id: string;
  type: HeatType;
  scene: Scene;
  title: string;
  goal: string;
  intro: string;
  lesson: string;
  /** For predict-and-test levels: the question asked before running. */
  question?: string;
  options: HeatOption[];
  multi?: boolean;
  budget?: number;
  /** Run length, in `unit`. */
  duration: number;
  unit: "min" | "h" | "s";
  room: number;
  start: number;
  /** keep-hot: stay at or above; keep-cold: stay below; convection/insulate: end at or above; heat-up: hit (±2). */
  target?: number;
  pick?: "max" | "min";
  /** Model constants. */
  c?: number;
}

export interface Series {
  id: string;
  label: string;
  color: string;
  pts: number[];
  chosen: boolean;
}

export interface HeatRun {
  series: Series[];
  win: boolean;
  /** Inside/handle/etc. temperature at the end for the chosen option. */
  end: number;
  verdict: string;
  /** Horizontal guide line (target). */
  line: number | null;
  /** Second guide line (outside air for the house). */
  line2: number | null;
}

export const SAMPLES = 60;

/* ---------------------------------------------------------------- pure models (checked by npm test) */

export const coolK = (R: number, C: number) => 1 / (R * C);
export function newton(T0: number, room: number, k: number, t: number): number {
  return room + (T0 - room) * Math.exp(-k * t);
}
export function sunT(room: number, absorb: number, sun: number, k: number, t: number): number {
  return room + ((absorb * sun) / k) * (1 - Math.exp(-k * t));
}
export function handleT(room: number, soup: number, factor: number, rate: number, t: number): number {
  return room + factor * (soup - room) * (1 - Math.exp(-rate * t));
}
export function houseSteady(out: number, power: number, ua: number) {
  return out + power / ua;
}
export function houseT(T0: number, out: number, power: number, ua: number, C: number, t: number): number {
  const ss = houseSteady(out, power, ua);
  return ss + (T0 - ss) * Math.exp((-ua * t) / C);
}
/** Q = m c ΔT, so ΔT = P t / (m c). */
export function heatUpT(T0: number, watts: number, kg: number, cJ: number, tOn: number, t: number): number {
  return T0 + (watts * Math.min(t, tOn)) / (kg * cJ);
}
export const WATER_C = 4186; // J/(kg·°C)
export const TANK = { kg: 2, watts: 1000 };

/** Two air layers. Returns [floor, ceiling] samples. */
export function convectionRun(heaterLow: boolean, opts: { start: number; out: number; minutes: number; power?: number }): [number[], number[]] {
  const power = opts.power ?? 1.5; // °C per minute into the heater's layer
  const loss = 0.03;
  let f = opts.start;
  let c = opts.start;
  const dt = 0.25;
  const floor: number[] = [f];
  const ceil: number[] = [c];
  const steps = Math.round(opts.minutes / dt);
  const every = steps / SAMPLES;
  for (let i = 1; i <= steps; i++) {
    // Warm air rises: when the floor is warmer than the ceiling the air churns (mixing is strong);
    // warm air sitting on top of cool air stays put (mixing is weak).
    const mix = f > c ? 0.2 : 0.01;
    const flow = mix * (f - c);
    const df = (heaterLow ? power : 0) - loss * (f - opts.out) - flow;
    const dc = (heaterLow ? 0 : power) - loss * (c - opts.out) + flow;
    f += df * dt;
    c += dc * dt;
    if (i % every === 0) {
      floor.push(f);
      ceil.push(c);
    }
  }
  return [floor, ceil];
}

/* ---------------------------------------------------------------- house parts */

export const HOUSE_BASE_UA = 10; // attic 4 + walls 3 + windows 2 + door gaps 1
export const HOUSE = { out: -8, power: 150, C: 30, start: 20 };

/* ---------------------------------------------------------------- running a level */

function samples(f: (t: number) => number, duration: number): number[] {
  return Array.from({ length: SAMPLES + 1 }, (_, i) => f((duration * i) / SAMPLES));
}

export function optionById(level: HeatLevel, id: string): HeatOption {
  const o = level.options.find((x) => x.id === id);
  if (!o) throw new Error(`no option ${id}`);
  return o;
}

export function totalCost(level: HeatLevel, chosen: string[]): number {
  return chosen.reduce((s, id) => s + (optionById(level, id).cost ?? 0), 0);
}

export function simulate(level: HeatLevel, chosen: string[], band: Band): HeatRun {
  const T = (c: number) => fmtTemp(c, band);
  const C = level.c ?? 20;
  const ser = (o: HeatOption, f: (t: number) => number): Series => ({
    id: o.id, label: o.label, color: o.color, pts: samples(f, level.duration), chosen: chosen.includes(o.id),
  });
  switch (level.type) {
    case "keep-hot":
    case "keep-cold": {
      const series = level.options.map((o) => ser(o, (t) => newton(level.start, level.room, coolK(o.value, C), t)));
      const mine = series.find((s) => s.chosen)!;
      const end = mine.pts[SAMPLES];
      const hot = level.type === "keep-hot";
      const win = hot ? end >= level.target! : Math.max(...mine.pts) < level.target!;
      const o = optionById(level, chosen[0]);
      const verdict = hot
        ? win
          ? `Still ${T(end)} after ${level.duration} minutes! The ${o.label.toLowerCase()} is a good insulator: it slowed the heat moving out into the cold room.`
          : `Only ${T(end)}: too cool. The ${o.label.toLowerCase()} let heat flow out quickly. Try a better insulator.`
        : win
          ? `Still frozen (${T(end)})! The ${o.label.toLowerCase()} slowed the heat flowing in from the warm room.`
          : `Melted! It reached ${T(end)}. Heat from the warm room flowed in too fast through the ${o.label.toLowerCase()}.`;
      return { series, win, end, verdict, line: level.target!, line2: null };
    }
    case "radiation":
    case "conduction": {
      const series = level.options.map((o) =>
        ser(o, (t) => (level.type === "radiation" ? sunT(level.room, o.value, 1, 0.05, t) : handleT(level.room, level.start, o.value, o.rate ?? 0.1, t))),
      );
      const ends = series.map((s) => s.pts[SAMPLES]);
      const best = level.pick === "min" ? Math.min(...ends) : Math.max(...ends);
      const mine = series.find((s) => s.chosen)!;
      const end = mine.pts[SAMPLES];
      const win = end === best;
      const top = series[ends.indexOf(best)];
      const verdict = win
        ? `Right! The ${top.label.toLowerCase()} ${level.pick === "min" ? "stayed coolest" : "got warmest"} (${T(best)}).`
        : `Not this time: the ${top.label.toLowerCase()} ${level.pick === "min" ? "stayed coolest" : "got warmest"} (${T(best)}). Yours reached ${T(end)}.`;
      return { series, win, end, verdict, line: null, line2: null };
    }
    case "convection": {
      const low = chosen[0] === "low";
      const [floor, ceil] = convectionRun(low, { start: level.start, out: level.room, minutes: level.duration });
      const series: Series[] = [
        { id: "floor", label: "Floor (where we sit)", color: "#ffd23f", pts: floor, chosen: true },
        { id: "ceiling", label: "Ceiling", color: "#ff7a6e", pts: ceil, chosen: false },
      ];
      const end = floor[SAMPLES];
      const win = end >= level.target!;
      const verdict = win
        ? `Cozy: the floor reached ${T(end)}. The heater warmed the air near the floor, the warm air rose and cooler air sank to take its place, so the whole room churned and warmed.`
        : `Brr! The ceiling got to ${T(ceil[SAMPLES])} but the floor only ${T(end)}. Warm air rises, so it stayed trapped up high.`;
      return { series, win, end, verdict, line: level.target!, line2: null };
    }
    case "insulate": {
      const saved = chosen.reduce((s, id) => s + (optionById(level, id).save ?? 0), 0);
      const ua = HOUSE_BASE_UA - saved;
      const cost = totalCost(level, chosen);
      const pts = samples((t) => houseT(HOUSE.start, HOUSE.out, HOUSE.power, ua, HOUSE.C, t), level.duration);
      const end = pts[SAMPLES];
      const over = cost > level.budget!;
      const win = !over && end >= level.target!;
      const series: Series[] = [{ id: "inside", label: "Inside", color: "#ffd23f", pts, chosen: true }];
      const verdict = over
        ? `That costs ${cost} coins, but the budget is ${level.budget}.`
        : win
          ? `Warm all night: ${T(end)} at sunrise. Insulation slowed the heat escaping to the cold outside.`
          : `By morning it's only ${T(end)} inside. Heat still escaped too fast. Where does the most heat get out?`;
      return { series, win, end, verdict, line: level.target!, line2: HOUSE.out };
    }
    case "heat-up": {
      const o = optionById(level, chosen[0]);
      const pts = samples((t) => heatUpT(level.start, TANK.watts, TANK.kg, WATER_C, o.value, t), level.duration);
      const end = pts[SAMPLES];
      const win = Math.abs(end - level.target!) <= 2;
      const verdict = win
        ? `Perfect: ${end.toFixed(1)}°C. Q = m·c·ΔT = 2 kg × 4186 J/(kg·°C) × 30°C ≈ 251,000 J, and a 1000 W heater gives 1000 J each second: about 251 s.`
        : `The water reached ${end.toFixed(1)}°C, not ${level.target}°C. Work out Q = m·c·ΔT first, then t = Q ÷ P.`;
      return { series: [{ id: "tank", label: "Water", color: "#7fe7ff", pts, chosen: true }], win, end, verdict, line: level.target!, line2: null };
    }
  }
}

/** Every allowed choice (single options, or every set of parts within budget). */
export function allChoices(level: HeatLevel): string[][] {
  if (!level.multi) return level.options.map((o) => [o.id]);
  const out: string[][] = [];
  const n = level.options.length;
  for (let mask = 0; mask < 1 << n; mask++) {
    const pick = level.options.filter((_, i) => mask & (1 << i)).map((o) => o.id);
    out.push(pick);
  }
  return out;
}

/* ---------------------------------------------------------------- the levels */

const CUP = {
  metal: { id: "metal", label: "Metal mug", value: 1.2, color: "#9fb3c8" },
  glass: { id: "glass", label: "Glass cup", value: 1.6, color: "#9ee8e0" },
  cardboard: { id: "cardboard", label: "Paper cup", value: 2.0, color: "#d9b48a" },
  foam: { id: "foam", label: "Foam cup", value: 5, color: "#f4f4ff" },
  wool: { id: "wool", label: "Mug in a wool cozy", value: 4, color: "#d04a6a" },
};
const COOLER = {
  metal: { id: "metal", label: "Metal tin", value: 1.2, color: "#9fb3c8" },
  cardboard: { id: "cardboard", label: "Cardboard box", value: 2.0, color: "#d9b48a" },
  foam: { id: "foam", label: "Foam cooler", value: 8, color: "#f4f4ff" },
  wool: { id: "wool", label: "Wrapped in a wool blanket", value: 6, color: "#d04a6a" },
};
const withR = <T extends { value: number }>(o: T) => ({ ...o, detail: `R = ${o.value}` });

const HOUSE_PARTS: HeatOption[] = [
  { id: "attic", label: "Attic insulation", value: 0, cost: 3, save: 3, color: "#ffd23f" },
  { id: "walls", label: "Wall insulation", value: 0, cost: 3, save: 1.5, color: "#ff7a6e" },
  { id: "windows", label: "Window film & curtains", value: 0, cost: 1, save: 0.8, color: "#7fe7ff" },
  { id: "door", label: "Weather-strip the door", value: 0, cost: 1, save: 0.6, color: "#5fff8a" },
];
const HOUSE_PARTS_R: HeatOption[] = [
  { ...HOUSE_PARTS[0], detail: "R-11 → R-38 · 3 coins" },
  { ...HOUSE_PARTS[1], detail: "R-4 → R-13 · 3 coins" },
  { ...HOUSE_PARTS[2], detail: "R-1 → R-2 · 1 coin" },
  { ...HOUSE_PARTS[3], detail: "seal the gaps · 1 coin" },
];

const SPOONS = [
  { id: "metal", label: "Metal spoon", value: 0.8, rate: 0.5, color: "#c9d3e0" },
  { id: "wood", label: "Wooden spoon", value: 0.1, rate: 0.05, color: "#a0703a" },
  { id: "plastic", label: "Plastic spoon", value: 0.15, rate: 0.06, color: "#4ab0d0" },
];

const INSULATORS_NOTE = "Insulators slow heat down; they don't make anything hot or cold by themselves.";

export const HEATS: Record<string, HeatLevel> = {
  /* ------------------------------------------------------------ K-2 */
  "k2-cocoa": {
    kind: "heat", id: "k2-cocoa", type: "keep-hot", scene: "cocoa", title: "Bakery Cocoa",
    goal: "Pick a cup that keeps the cocoa hot until the bell.",
    intro: "Brr! The baker made hot cocoa for the workers. Which cup will keep it hot the longest?",
    lesson: `Foam and wool are good at keeping heat in. Metal and glass let the heat out fast, so the cocoa cools down. ${INSULATORS_NOTE}`,
    options: [CUP.metal, CUP.glass, CUP.foam, CUP.wool], duration: 30, unit: "min", room: 20, start: 80, target: 55,
  },
  "k2-sun": {
    kind: "heat", id: "k2-sun", type: "radiation", scene: "sun", title: "School Sunshine",
    goal: "Which shirt gets warmest in the sun?",
    question: "Three shirts lie in the sunshine. Which one gets the warmest?",
    intro: "The sun came out after the storm! Three shirts lie in the sunshine. Which one do you think gets the warmest?",
    lesson: "The sun warms things up! Dark colors soak up more sunlight, so the black shirt gets warmest. White reflects more sunlight away.",
    options: [
      { id: "black", label: "Black shirt", value: 0.9, color: "#3a3a4a" },
      { id: "white", label: "White shirt", value: 0.25, color: "#f4f4ff" },
      { id: "red", label: "Red shirt", value: 0.6, color: "#e3262f" },
    ],
    pick: "max", duration: 40, unit: "min", room: 10, start: 10,
  },
  "k2-icepop": {
    kind: "heat", id: "k2-icepop", type: "keep-cold", scene: "icepop", title: "Grocery Ice Pops",
    goal: "Keep the ice pops frozen until the power comes back.",
    intro: "The grocery's freezer has no power! Which box keeps the ice pops frozen until the power comes back?",
    lesson: `The foam cooler and the wool blanket slow down the warmth getting in, so the ice pops stay frozen. They don't make cold: they keep the warm out. ${INSULATORS_NOTE}`,
    options: [COOLER.metal, COOLER.cardboard, COOLER.foam, COOLER.wool], duration: 40, unit: "min", room: 20, start: -12, target: 0,
  },
  "k2-spoons": {
    kind: "heat", id: "k2-spoons", type: "conduction", scene: "spoons", title: "Ice Rink Soup",
    goal: "Which spoon's handle gets hot in the soup?",
    question: "Three spoons sit in hot soup. Which handle gets hot?",
    intro: "The ice rink café has hot soup. Three spoons sit in the bowl. Which spoon's handle will get hot?",
    lesson: "The metal spoon's handle got hot: heat moves through metal easily. Wood and plastic stay cool, so they make good handles.",
    options: SPOONS, pick: "max", duration: 10, unit: "min", room: 20, start: 90,
  },

  /* ------------------------------------------------------------ 3-5 */
  "g35-cocoa": {
    kind: "heat", id: "g35-cocoa", type: "keep-hot", scene: "cocoa", title: "Bakery Cocoa",
    goal: "Keep the cocoa at 131°F or hotter for 30 minutes.",
    intro: "Hot cocoa (176°F) for the line workers, and the bakery is chilly (68°F). Pick the cup that keeps it hot for 30 minutes.",
    lesson: `Heat always moves from hot to cold: from the cocoa into the cool room. Foam and wool are insulators, so they slow it down. Metal and glass are conductors of heat. ${INSULATORS_NOTE}`,
    options: [CUP.metal, CUP.glass, CUP.foam, CUP.wool], duration: 30, unit: "min", room: 20, start: 80, target: 55,
  },
  "g35-sun": {
    kind: "heat", id: "g35-sun", type: "radiation", scene: "sun", title: "School Sunshine",
    goal: "Predict: which paper gets warmest in the window?",
    question: "Four papers sit in a sunny window. Which one warms up the most?",
    intro: "The school's science class puts four papers in a sunny window. Predict which one warms the most, then run the test.",
    lesson: "Radiation: the sun's energy travels as light, even through space and glass. Black paper absorbs most of it and warms the most. White and shiny foil reflect most of it.",
    options: [
      { id: "black", label: "Black paper", value: 0.9, color: "#3a3a4a" },
      { id: "white", label: "White paper", value: 0.25, color: "#f4f4ff" },
      { id: "foil", label: "Shiny foil", value: 0.1, color: "#c9d3e0" },
      { id: "green", label: "Green paper", value: 0.6, color: "#3aa860" },
    ],
    pick: "max", duration: 40, unit: "min", room: 15, start: 15,
  },
  "g35-icepop": {
    kind: "heat", id: "g35-icepop", type: "keep-cold", scene: "icepop", title: "Grocery Ice Pops",
    goal: "Keep the ice pops below 32°F for 40 minutes.",
    intro: "The freezer is off and the store is 68°F. Which container keeps the ice pops below 32°F (frozen) for 40 minutes?",
    lesson: `Heat flows into the ice pops from the warmer room. A foam cooler is an insulator: it slows that heat down so they stay frozen. It doesn't "add cold". ${INSULATORS_NOTE}`,
    options: [COOLER.metal, COOLER.cardboard, COOLER.foam, COOLER.wool], duration: 40, unit: "min", room: 20, start: -12, target: 0,
  },
  "g35-heater": {
    kind: "heat", id: "g35-heater", type: "convection", scene: "room", title: "Community Center Heater",
    goal: "Where should the heater go so the floor gets warm?",
    question: "Where should the heater go to warm the people sitting on the floor?",
    intro: "Families are coming to the community center to warm up. Where should the little heater go so it's cozy down where people sit?",
    lesson: "Convection: warm air is less dense, so it rises, and cooler air sinks to take its place. A heater near the floor starts that loop and warms the whole room.",
    options: [
      { id: "low", label: "Down by the floor", value: 0, color: "#ffd23f" },
      { id: "high", label: "Up near the ceiling", value: 1, color: "#ff7a6e" },
    ],
    duration: 60, unit: "min", room: 0, start: 10, target: 20,
  },
  "g35-spoons": {
    kind: "heat", id: "g35-spoons", type: "conduction", scene: "spoons", title: "Ice Rink Soup",
    goal: "Predict: which spoon handle gets hottest?",
    question: "Three spoons stand in 194°F soup. Which handle gets hottest after 10 minutes?",
    intro: "Three spoons stand in hot soup at the ice rink café. Predict which handle gets hottest, then test it.",
    lesson: "Conduction: heat moves through a solid from the hot end to the cool end. Metal conducts heat well, so its handle gets hot. Wood and plastic are insulators. It's also why a metal spoon feels colder than a wooden one at the same room temperature: metal carries heat away from your warm hand faster.",
    options: SPOONS, pick: "max", duration: 10, unit: "min", room: 20, start: 90,
  },
  "g35-house": {
    kind: "heat", id: "g35-house", type: "insulate", scene: "house", title: "Town Hall: The Cold Night",
    goal: "Spend up to 5 coins so it's still 59°F+ inside at sunrise.",
    intro: "Tonight will be freezing (18°F). Town Hall has a small heater. Spend 5 coins on insulation so it's still at least 59°F inside at sunrise.",
    lesson: "Warm air rises, so a lot of heat escapes through the attic. Insulation slows heat flowing out to the cold. The heater's heat stays inside longer.",
    options: HOUSE_PARTS, multi: true, budget: 5, duration: 12, unit: "h", room: -8, start: 20, target: 15,
  },

  /* ------------------------------------------------------------ 6-8 */
  "g68-cocoa": {
    kind: "heat", id: "g68-cocoa", type: "keep-hot", scene: "cocoa", title: "Bakery: Thermal Equilibrium",
    goal: "Keep the cocoa at 55°C or above for 30 minutes.",
    intro: "Cocoa starts at 80°C in a 20°C room. Every cup lets it drift toward 20°C (thermal equilibrium). Which one slows it enough?",
    lesson: `The cocoa and the room trade energy until they're the same temperature: thermal equilibrium. The bigger the temperature difference, the faster heat flows, so the curve is steep at first and levels off. Insulators slow it; they never push the cocoa below room temperature. ${INSULATORS_NOTE}`,
    options: [withR(CUP.metal), withR(CUP.glass), withR(CUP.cardboard), withR(CUP.foam)], duration: 30, unit: "min", room: 20, start: 80, target: 55,
  },
  "g68-icepop": {
    kind: "heat", id: "g68-icepop", type: "keep-cold", scene: "icepop", title: "Grocery: Keep It Frozen",
    goal: "Keep the ice pops below 0°C for 40 minutes.",
    intro: "Ice pops at −12°C, store at 20°C, no freezer. Pick the container that keeps them below 0°C.",
    lesson: `Energy flows from the warm air into the cold ice pops. A foam cooler's trapped air is a poor conductor, so energy enters slowly. ${INSULATORS_NOTE}`,
    options: [withR(COOLER.metal), withR(COOLER.cardboard), withR(COOLER.foam), withR(COOLER.wool)], duration: 40, unit: "min", room: 20, start: -12, target: 0,
  },
  "g68-spoons": {
    kind: "heat", id: "g68-spoons", type: "conduction", scene: "spoons", title: "Toy Shop Soup: Conduction",
    goal: "Predict which handle heats fastest, then explain it with particles.",
    question: "Metal, wood or plastic: which spoon handle heats up fastest in 90°C soup?",
    intro: "Predict which spoon handle heats up fastest in 90°C soup.",
    lesson: "Particles in the hot soup vibrate fast and bump the spoon's particles, which bump their neighbours up the handle. Metals also have free electrons that carry energy quickly, so metal conducts heat best. The same reason makes a room-temperature metal spoon feel colder than a wooden one: both are the same temperature, but metal conducts heat out of your hand faster.",
    options: SPOONS, pick: "max", duration: 10, unit: "min", room: 20, start: 90,
  },
  "g68-heater": {
    kind: "heat", id: "g68-heater", type: "convection", scene: "room", title: "Community Center: Convection",
    goal: "Warm the floor layer to 20°C in an hour.",
    question: "Where does the heater warm the floor layer fastest?",
    intro: "The room starts at 10°C and it's 0°C outside. Where should the heater go to warm the floor layer to 20°C?",
    lesson: "Heated air expands, becomes less dense and rises; cool, dense air sinks. That convection current carries energy around the room, but only if the heat starts low.",
    options: [
      { id: "low", label: "By the floor", value: 0, color: "#ffd23f" },
      { id: "high", label: "Near the ceiling", value: 1, color: "#ff7a6e" },
    ],
    duration: 60, unit: "min", room: 0, start: 10, target: 20,
  },
  "g68-sun": {
    kind: "heat", id: "g68-sun", type: "radiation", scene: "sun", title: "Ice Rink: Radiation",
    goal: "Predict which cover absorbs the most sunlight.",
    question: "Which cover absorbs the most radiant energy from the sun?",
    intro: "The ice rink tests covers for the warming hut's roof. Predict which one absorbs the most sunlight.",
    lesson: "Radiant energy needs no matter to travel through. Dark, dull surfaces absorb more of it and warm up; light and shiny surfaces reflect more of it.",
    options: [
      { id: "black", label: "Black cover", value: 0.9, color: "#3a3a4a" },
      { id: "white", label: "White cover", value: 0.25, color: "#f4f4ff" },
      { id: "foil", label: "Shiny foil", value: 0.1, color: "#c9d3e0" },
      { id: "green", label: "Green cover", value: 0.6, color: "#3aa860" },
    ],
    pick: "max", duration: 40, unit: "min", room: 15, start: 15,
  },
  "g68-house": {
    kind: "heat", id: "g68-house", type: "insulate", scene: "house", title: "Town Hall: The Cold Night",
    goal: "5 coins: keep it 15°C or warmer inside until sunrise.",
    intro: "Tonight it's −8°C. Spend 5 coins on insulation so Town Hall is still 15°C or warmer at sunrise.",
    lesson: "Heat flows out faster where the temperature difference is big and the barrier is thin. Warm air collects up high, so the attic loses most. Insulation (trapped air) slows conduction and convection.",
    options: HOUSE_PARTS, multi: true, budget: 5, duration: 12, unit: "h", room: -8, start: 20, target: 15,
  },

  /* ------------------------------------------------------------ 9-12 */
  "hs-tank": {
    kind: "heat", id: "hs-tank", type: "heat-up", scene: "tank", title: "Bakery: Q = mcΔT",
    goal: "Heat 2 kg of water from 20°C to 50°C with a 1000 W heater.",
    question: "How long should the 1000 W heater run? (c = 4186 J/kg·°C)",
    intro: "The bakery's insulated tank holds 2 kg of water at 20°C. It needs 50°C. The heater is 1000 W. How long should it run?",
    lesson: "Q = m·c·ΔT = 2 × 4186 × 30 ≈ 251,000 J. Power is energy per second, so t = Q ÷ P ≈ 251 s. Water's high specific heat means it takes a lot of energy to warm.",
    options: [
      { id: "63", label: "63 s", value: 63, color: "#7fe7ff" },
      { id: "126", label: "126 s", value: 126, color: "#5fff8a" },
      { id: "251", label: "251 s", value: 251, color: "#ffd23f" },
      { id: "502", label: "502 s", value: 502, color: "#ff7a6e" },
    ],
    duration: 600, unit: "s", room: 20, start: 20, target: 50,
  },
  "hs-icepop": {
    kind: "heat", id: "hs-icepop", type: "keep-cold", scene: "icepop", title: "Grocery: Thermal Resistance",
    goal: "Keep the ice pops below 0°C for 40 minutes.",
    intro: "Each container has a thermal resistance R. The rate constant is k = 1/(R·C). Which keeps the ice pops below 0°C for 40 minutes?",
    lesson: `T(t) = T_room + (T₀ − T_room)·e^(−t/RC). A bigger R means a longer time constant RC, so the ice pops approach room temperature more slowly. ${INSULATORS_NOTE}`,
    options: [withR(COOLER.metal), withR(COOLER.cardboard), withR(COOLER.foam), withR(COOLER.wool)], duration: 40, unit: "min", room: 20, start: -12, target: 0,
  },
  "hs-heater": {
    kind: "heat", id: "hs-heater", type: "convection", scene: "room", title: "Community Center: Convection",
    goal: "Warm the floor layer to 20°C within an hour.",
    question: "Which heater position warms the occupied (floor) layer to 20°C?",
    intro: "Two air layers, one heater. Warm air is less dense and rises. Where should the heater go?",
    lesson: "Buoyancy drives convection: heated air expands, its density drops and it rises, setting up a circulating current. Heat delivered at the top creates a stable warm layer that barely mixes down.",
    options: [
      { id: "low", label: "Floor level", value: 0, color: "#ffd23f" },
      { id: "high", label: "Ceiling level", value: 1, color: "#ff7a6e" },
    ],
    duration: 60, unit: "min", room: 0, start: 10, target: 20,
  },
  "hs-handles": {
    kind: "heat", id: "hs-handles", type: "conduction", scene: "spoons", title: "Ice Rink: Pot Handles",
    goal: "Which handle stays coolest on a 90°C pot?",
    question: "Which handle material keeps the handle coolest after 10 minutes?",
    intro: "The ice rink's soup pot needs a handle that stays cool. Which material conducts heat the least?",
    lesson: "Thermal conductivity: copper and steel move heat quickly (free electrons and a tight lattice); wood traps tiny air pockets and conducts poorly, so it stays coolest.",
    options: [
      { id: "copper", label: "Copper", value: 0.9, rate: 1.0, color: "#e08a3c" },
      { id: "steel", label: "Steel", value: 0.7, rate: 0.4, color: "#c9d3e0" },
      { id: "silicone", label: "Silicone", value: 0.15, rate: 0.06, color: "#d04a6a" },
      { id: "wood", label: "Wood", value: 0.1, rate: 0.05, color: "#a0703a" },
    ],
    pick: "min", duration: 10, unit: "min", room: 20, start: 90,
  },
  "hs-house": {
    kind: "heat", id: "hs-house", type: "insulate", scene: "house", title: "Town Hall: R-Values",
    goal: "5 coins: 15°C or warmer inside at sunrise (−8°C outside).",
    intro: "Heat loss = UA·ΔT, and U = 1/R. Spend 5 coins raising R-values so Town Hall stays at 15°C or more all night.",
    lesson: "Higher R-value means lower U, so less heat flows per degree of difference. Inside settles toward T_out + P/UA. The attic has the biggest UA, so insulating it saves the most.",
    options: HOUSE_PARTS_R, multi: true, budget: 5, duration: 12, unit: "h", room: -8, start: 20, target: 15,
  },
};
