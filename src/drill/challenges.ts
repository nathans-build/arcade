/*
 * Field challenges: questions about the ground on screen ("Which marked layer is oldest?").
 * Four layers get numbered markers; the player answers by drilling into a marker, pressing
 * 1–4 / A–D, or tapping a choice. Every question is generated from the level's own layers,
 * so the answer always matches the picture. scripts/check-geology.ts re-derives each answer
 * independently for every grade and site.
 */
import { gradeNumber } from "../kit/grades";
import type { Grade, Question } from "../kit/types";
import { ROCKS, type Era, type RockId } from "./geology";
import { COLS, idx, pickOf, shuffled, type LevelData, type Rng, type Unit } from "./levels";

export type ChallengeKind =
  | "k_soil" | "k_deep" | "k_top" | "k_sand" | "k_hard" | "k_clay"
  | "s_humus" | "s_roots" | "s_subsoil" | "s_bedrock"
  | "t_ign" | "t_sed" | "t_met" | "t_fossil" | "t_soil"
  | "rc_ign" | "rc_sed" | "rc_met" | "s_parent"
  | "e_liquid" | "e_crust" | "e_hot" | "e_plates" | "e_dense" | "sw_s"
  | "o_mantle" | "o_lava"
  | "sp_old" | "sp_young" | "cc_last" | "cc_younger"
  | "r_cap" | "r_source" | "r_coal" | "r_iron" | "r_cement"
  | "era_cenozoic" | "era_mesozoic" | "era_paleozoic" | "fr_old"
  | "hl";

export interface Challenge {
  kind: ChallengeKind;
  q: Question;
  /** Unit index for each choice, in choice order. */
  units: number[];
  /** Marker tile for each choice. */
  markers: [number, number][];
  /** Half-life challenges: half-life (My) and the number of half-lives for each choice. */
  halfLife?: number;
  halves?: number[];
  /** Target number of half-lives asked about. */
  askHalves?: number;
}

interface Built {
  prompt: string;
  /** [answer unit, ...3 distractor units] – shuffled afterwards. */
  answer: Unit;
  others: Unit[];
  explanation: string;
  label?: (u: Unit) => string;
  halfLife?: number;
  halvesOf?: (u: Unit) => number;
  askHalves?: number;
}

type Builder = (units: Unit[], rng: Rng) => Built | null;

/* ------------------------------------------------------------------ helpers */

const layers = (units: Unit[]) => units.filter((u) => u.kind === "layer");
const isRockType = (u: Unit, t: string) => u.rock.type === t;
const isRock = (u: Unit) => ["sedimentary", "igneous", "metamorphic"].includes(u.rock.type);
const is = (id: RockId) => (u: Unit) => u.def.rock === id;

/** One unit matching `yes`, three from `no` (none may match `yes`). */
function oneOf(pool: Unit[], yes: (u: Unit) => boolean, no: (u: Unit) => boolean, rng: Rng) {
  const a = pool.filter(yes);
  const b = pool.filter((u) => !yes(u) && no(u));
  if (a.length < 1 || b.length < 3) return null;
  return { answer: pickOf(rng, a), others: shuffled(rng, b).slice(0, 3) };
}

function simple(prompt: string, explanation: string, yes: (u: Unit) => boolean, no: (u: Unit) => boolean = () => true, pool = layers): Builder {
  return (units, rng) => {
    const r = oneOf(pool(units), yes, no, rng);
    return r && { prompt, explanation, ...r };
  };
}

/** Four seq units; the answer is the deepest (oldest) or shallowest (youngest). */
function byDepth(prompt: string, explanation: string, deepest: boolean, pool: (units: Unit[]) => Unit[], label?: (u: Unit) => string): Builder {
  return (units, rng) => {
    const seq = pool(units);
    if (seq.length < 4) return null;
    const four = shuffled(rng, seq).slice(0, 4).sort((a, b) => a.top - b.top);
    const answer = deepest ? four[3] : four[0];
    return { prompt, explanation, answer, others: four.filter((u) => u !== answer), label };
  };
}

const seqLayers = (units: Unit[]) => layers(units).filter((u) => u.def.seq);

function eraOf(u: Unit): Era | undefined {
  return u.def.era;
}

const ERA_TEXT: Record<Era, string> = {
  cenozoic: "Cenozoic (66 million years ago to today), the age of mammals",
  mesozoic: "Mesozoic (252 to 66 million years ago), the age of dinosaurs and ammonites",
  paleozoic: "Paleozoic (539 to 252 million years ago), when trilobites filled the seas and coal swamps grew",
  precambrian: "Precambrian (before 539 million years ago)",
};

/* ------------------------------------------------------------------ builders */

const BUILDERS: Record<ChallengeKind, Builder> = {
  /* K–2 */
  k_soil: simple("Which layer is SOIL, where plants grow?", "Soil is the top layer. It is dark and full of bits of old plants, so plants grow well in it.", is("topsoil")),
  k_deep: byDepth("Which marked layer is the DEEPEST?", "The deepest layer is the one farthest down from the grass.", true, layers),
  k_top: byDepth("Which marked layer is closest to the TOP?", "The top layer is the one closest to the grass and the sky.", false, layers),
  k_sand: simple("Which layer is made of SAND?", "Sand is tiny grains of rock. It is gritty and light brown, like a beach.", is("sand")),
  k_hard: simple("Which layer is the HARDEST?", "Rock is much harder than soil, sand, clay or mud. It takes the drill the longest!", isRock,
    (u) => ["topsoil", "sand", "clay", "mud"].includes(u.def.rock)),
  k_clay: simple("Which layer is sticky CLAY that holds water?", "Clay has the tiniest grains. It is sticky when wet and holds water well.", is("clay")),

  /* grade 3 soils */
  s_humus: simple("Which layer has the most HUMUS (rotted plant bits)?", "Topsoil has the most humus. Humus makes it dark and feeds plants.", is("topsoil")),
  s_roots: simple("Plant roots grow mostly in which layer?", "Most roots grow in topsoil, where there is humus, air and water.", is("topsoil")),
  s_subsoil: simple("Which layer has clay washed down from above, but little humus?", "Subsoil is under the topsoil. Water carries clay and minerals down into it.", is("subsoil"),
    (u) => u.rock.type === "soil" || u.def.label === "BEDROCK"),
  s_bedrock: simple("Which layer is solid rock with no humus at all?", "Bedrock is the solid rock under the soil. Soil forms as it slowly weathers.", (u) => u.def.label === "BEDROCK",
    (u) => u.rock.type === "soil"),

  /* grades 4–5 rock types */
  t_ign: simple("Which marked layer is IGNEOUS rock?", "Igneous rock forms when melted rock (magma or lava) cools and hardens.", (u) => isRockType(u, "igneous"),
    (u) => u.rock.type !== "earth", (units) => units),
  t_sed: simple("Which marked layer is SEDIMENTARY rock?", "Sedimentary rock forms when sand, mud or shells are pressed and cemented into rock.", (u) => isRockType(u, "sedimentary"),
    (u) => u.rock.type !== "earth" && u.rock.type !== "sediment", (units) => units),
  t_met: simple("Which marked layer is METAMORPHIC rock?", "Metamorphic rock is rock that was changed by heat and pressure deep underground.", (u) => isRockType(u, "metamorphic"),
    (u) => u.rock.type !== "earth", (units) => units),
  t_fossil: simple("Which marked layer is most likely to hold FOSSILS?", "Most fossils are found in sedimentary rock. Heat and melting in igneous and metamorphic rock destroy them.",
    (u) => isRockType(u, "sedimentary"), (u) => u.rock.type === "igneous" || ["schist", "gneiss"].includes(u.def.rock), (units) => units),
  t_soil: simple("Weathered rock and humus make soil. Which layer is SOIL?", "Topsoil formed from rock broken down by weathering, mixed with humus from dead plants and animals.",
    is("topsoil"), isRock, (units) => units),

  /* grades 6+ rock cycle */
  rc_ign: simple("Which marked layer formed when magma or lava cooled?", "Igneous rocks form when magma (underground) or lava (on the surface) cools and hardens.",
    (u) => isRockType(u, "igneous"), (u) => u.rock.type !== "earth" && u.rock.type !== "sediment", (units) => units),
  rc_sed: simple("Which marked layer formed from sediment pressed and cemented?", "Sedimentary rock forms when layers of sediment are buried, pressed and cemented together.",
    (u) => isRockType(u, "sedimentary"), (u) => u.rock.type !== "earth" && u.rock.type !== "sediment", (units) => units),
  rc_met: simple("Which formed when rock changed from heat and pressure, without melting?", "Metamorphic rock forms when heat and pressure change a rock without melting it.",
    (u) => isRockType(u, "metamorphic"), (u) => u.rock.type !== "earth" && u.rock.type !== "sediment", (units) => units),
  s_parent: simple("Soil forms from weathered rock. Which marked layer is SOIL?", "Topsoil forms from weathered parent rock mixed with humus, over hundreds of years.",
    is("topsoil"), isRock, (units) => units),

  /* Earth's layers (whole-Earth site) */
  e_liquid: simple("Which layer of Earth is LIQUID metal?", "The outer core is liquid iron and nickel. The inner core is solid because of huge pressure.", is("outercore")),
  e_crust: simple("Which layer do we live on?", "We live on the crust, Earth's thin, rocky outer layer.", is("crust")),
  e_hot: simple("Which layer of Earth is the HOTTEST?", "Temperature rises with depth. The inner core is the hottest, over 5,000 °C.", is("innercore")),
  e_plates: simple("Which layer flows slowly and carries the plates?", "Part of the upper mantle (the asthenosphere) flows slowly, carrying the tectonic plates.", is("uppermantle")),
  e_dense: simple("Which layer of Earth is the DENSEST?", "Density increases with depth. The inner core, solid iron and nickel, is the densest layer.", is("innercore")),
  sw_s: simple("S waves cannot pass through liquid. Which layer stops them?", "S waves (shear waves) cannot travel through liquid, so the liquid outer core stops them.", is("outercore")),

  /* ocean and continent sites */
  o_mantle: simple("Which marked layer is part of the MANTLE?", "Under the crust is the mantle, made of the green rock peridotite.", (u) => u.label === "MANTLE", () => true, (units) => units),
  o_lava: simple("Which layer formed from lava that cooled fast under the sea?", "Lava that erupts under the sea cools fast into pillow basalt. Gabbro cooled slowly, deeper down.", is("pillow")),

  /* superposition and cross-cutting */
  sp_old: byDepth("Which marked layer is the OLDEST?", "Law of superposition: in undisturbed layers, the bottom layer formed first, so it is the oldest.", true, seqLayers),
  sp_young: byDepth("Which marked layer is the YOUNGEST?", "Law of superposition: in undisturbed layers, the top layer formed last, so it is the youngest.", false, seqLayers),
  cc_last: (units, rng) => {
    const dike = units.find((u) => u.kind === "dike");
    if (!dike?.cuts || dike.cuts.length < 3) return null;
    const cut = shuffled(rng, dike.cuts.map((i) => units[i])).slice(0, 3);
    return {
      prompt: "The basalt DIKE cuts through layers. Which formed LAST?", answer: dike, others: cut,
      explanation: "Cross-cutting: magma can only cut through layers that are already there, so the dike is younger than every layer it cuts.",
    };
  },
  cc_younger: (units, rng) => {
    const dike = units.find((u) => u.kind === "dike");
    if (!dike?.cuts || dike.cuts.length < 3) return null;
    const above = seqLayers(units).filter((u) => u.bottom < dike.top);
    if (above.length < 1) return null;
    return {
      prompt: "Which marked layer is YOUNGER than the basalt dike?", answer: pickOf(rng, above),
      others: shuffled(rng, dike.cuts.map((i) => units[i])).slice(0, 3),
      explanation: "The dike is younger than the layers it cuts. Layers lying on top of the dike, uncut, formed after it.",
    };
  },

  /* resources */
  r_cap: simple("Which layer is the CAP ROCK that traps the oil?", "Oil and gas rise until a tight layer stops them. Here shale sits right on top of the oil sandstone.",
    (u) => u.def.role === "cap"),
  r_source: simple("Oil formed from buried sea life in which SOURCE rock?", "Oil forms in dark, organic-rich shale deep down, then seeps UP into the sandstone above it.",
    (u) => u.def.role === "source", (u) => u.def.rock !== "limestone"),
  r_coal: simple("Which layer is a fossil fuel made from ancient swamp plants?", "Coal formed from swamp plants buried and squeezed for millions of years.", is("coal")),
  r_iron: simple("Which layer is mined as IRON ORE?", "Banded iron formation is full of hematite and magnetite, the main iron ores.", is("bif")),
  r_cement: simple("Cement is made mostly by heating which rock?", "Cement is made by heating limestone (calcite) with a little clay or shale.", is("limestone"),
    (u) => u.def.rock !== "marble"),

  /* fossil record and eras (geologic-time site) */
  era_cenozoic: eraBuilder("cenozoic"),
  era_mesozoic: eraBuilder("mesozoic"),
  era_paleozoic: eraBuilder("paleozoic"),
  fr_old: (units, rng) => {
    const withIndex = seqLayers(units).filter((u) => u.def.index);
    const pool = withIndex.length >= 4 ? withIndex : seqLayers(units);
    return byDepth("Fossils in which marked layer are the OLDEST?", "Deeper layers formed first, so the fossils in them are older. Life in the deepest layer lived longest ago.",
      true, () => pool, withIndex.length >= 4 ? (u) => `${u.label.replace(/ \(.*\)$/, "")} · ${u.def.index}` : undefined)(units, rng);
  },

  /* half-life dating */
  hl: (units, rng) => {
    const dated = seqLayers(units).filter((u) => u.def.ageMa);
    const halfLife = pickOf(rng, [100, 50]);
    const fits = (u: Unit) => {
      const [a, b] = u.def.ageMa!;
      for (let n = 1; n <= 8; n++) if (n * halfLife >= a && n * halfLife <= b) return n;
      return 0;
    };
    const ok = dated.filter((u) => fits(u) > 0);
    if (ok.length < 4) return null;
    const four = shuffled(rng, ok).slice(0, 4);
    const answer = pickOf(rng, four);
    const n = fits(answer);
    return {
      prompt: `Half-life = ${halfLife} million years. Which sample is ${n * halfLife} million years old?`,
      answer, others: four.filter((u) => u !== answer), halfLife, halvesOf: fits, askHalves: n,
      label: (u) => `${u.label.replace(/ \(.*\)$/, "")} · 1/${2 ** fits(u)} LEFT`,
      explanation: `${n * halfLife} million years is ${n} half-li${n === 1 ? "fe" : "ves"}. After each half-life, half the parent isotope is left: 1/2, 1/4, 1/8… so 1/${2 ** n} is left.`,
    };
  },
};

function eraBuilder(era: Era): Builder {
  return (units, rng) => {
    const pool = seqLayers(units).filter((u) => u.def.index && u.def.era);
    const r = oneOf(pool, (u) => eraOf(u) === era, () => true, rng);
    if (!r) return null;
    return {
      prompt: `Which marked layer formed in the ${era.toUpperCase()} era?`,
      ...r,
      label: (u) => `${u.label.replace(/ \(.*\)$/, "")} · ${u.def.index}`,
      explanation: `Index fossils date a layer. ${r.answer.def.index} lived in the ${ERA_TEXT[era]}.`,
    };
  };
}

/* ------------------------------------------------------------------ per grade */

const ROCK_CYCLE: ChallengeKind[] = ["rc_ign", "rc_sed", "rc_met"];
const EARTH: ChallengeKind[] = ["e_liquid", "e_crust", "e_hot", "e_plates"];
const OCEAN: ChallengeKind[] = ["o_mantle", "o_lava"];
const RESOURCES: ChallengeKind[] = ["r_cap", "r_source", "r_coal", "r_iron", "r_cement"];
const SUPER: ChallengeKind[] = ["sp_old", "sp_young"];

/** Kinds each grade uses: [main topics, review topics used when no main topic fits the site]. */
export function kindsForGrade(grade: Grade): { main: ChallengeKind[]; review: ChallengeKind[] } {
  const n = gradeNumber(grade);
  if (n === 0) return { main: ["k_soil", "k_deep", "k_top", "k_sand", "k_hard"], review: [] };
  if (n <= 2) return { main: ["k_soil", "k_deep", "k_top", "k_sand", "k_hard", "k_clay"], review: [] };
  if (n === 3) return { main: ["s_humus", "s_roots", "s_subsoil", "s_bedrock"], review: [] };
  if (n <= 5) return { main: ["t_ign", "t_sed", "t_met", "t_fossil", "t_soil"], review: [] };
  if (n === 6) return { main: [...ROCK_CYCLE, ...EARTH, ...OCEAN, "s_parent"], review: [] };
  if (n === 7) return { main: [...SUPER], review: [...ROCK_CYCLE, ...EARTH, ...OCEAN] };
  if (n === 8) return { main: [...SUPER, "cc_last", "cc_younger"], review: [...ROCK_CYCLE, ...EARTH, ...OCEAN] };
  if (n === 9) return { main: [...ROCK_CYCLE, ...RESOURCES, ...SUPER, ...OCEAN, ...EARTH], review: [] };
  if (n === 10) return { main: ["era_cenozoic", "era_mesozoic", "era_paleozoic", "fr_old"], review: [...RESOURCES, ...ROCK_CYCLE, ...EARTH, ...OCEAN] };
  if (n === 11) return { main: ["hl"], review: [...RESOURCES, ...ROCK_CYCLE, ...EARTH, ...OCEAN] };
  return { main: ["sw_s", "e_dense"], review: ["hl", ...RESOURCES, ...ROCK_CYCLE, "e_plates", ...OCEAN] };
}

/** NC standard and skill for a challenge kind at a grade. */
export function tagFor(kind: ChallengeKind, grade: Grade): { standard: string; skill: string } {
  const n = gradeNumber(grade);
  const group = kind.startsWith("rc_") ? "rc" : kind.startsWith("e_") || kind.startsWith("o_") ? "earth"
    : kind.startsWith("sp_") ? "sp" : kind.startsWith("cc_") ? "cc" : kind.startsWith("r_") ? "res"
    : kind.startsWith("era_") || kind === "fr_old" ? "fossil" : kind;
  if (n === 0) return { standard: "PS.K.1.1", skill: "Sorting Earth materials" };
  if (n <= 2) return { standard: "ESS.1.2.1", skill: "Earth materials" };
  if (n === 3) return { standard: "LS.3.3", skill: "Soil layers" };
  if (n <= 5) {
    if (kind === "t_fossil") return { standard: "LS.4.2.2", skill: "Fossils in rock" };
    if (kind === "t_soil") return { standard: "ESS.4.2.3", skill: "Weathering and soil" };
    return { standard: "ESS.4.2.2", skill: "Rock types" };
  }
  if (n <= 8) {
    if (group === "sp") return { standard: "ESS.8.1", skill: "Law of superposition" };
    if (group === "cc") return { standard: "ESS.8.1", skill: "Cross-cutting relationships" };
    if (kind === "s_parent") return { standard: "ESS.6.3", skill: "Soil formation" };
    if (group === "rc") return { standard: "ESS.6.2", skill: "Rock cycle" };
    return { standard: "ESS.6.2", skill: "Earth's layers" };
  }
  if (group === "fossil") return { standard: "LS.Bio.6", skill: "Fossil record" };
  if (kind === "hl") return { standard: "PS.Chm.1.2", skill: "Half-life dating" };
  if (kind === "sw_s") return { standard: "PS.Phy.7", skill: "Seismic waves" };
  if (group === "res") return { standard: "ESS.EES.5", skill: "Energy and mineral resources" };
  if (group === "sp") return { standard: "ESS.EES.2", skill: "Relative dating" };
  if (group === "rc") return { standard: "ESS.EES.2", skill: "Rock cycle" };
  return { standard: "ESS.EES.2", skill: "Earth's layers" };
}

/** Kinds that can be built on this level (main topics first, review topics as a fallback). */
export function feasibleKinds(data: LevelData): ChallengeKind[] {
  const { main, review } = kindsForGrade(data.grade);
  const ok = (k: ChallengeKind) => {
    for (let s = 1; s <= 6; s++) if (BUILDERS[k](data.units, seededish(s))) return true;
    return false;
  };
  const m = main.filter(ok);
  return m.length ? m : review.filter(ok);
}

function seededish(s: number): Rng {
  let x = s * 9301 + 49297;
  return () => {
    x = (x * 9301 + 49297) % 233280;
    return x / 233280;
  };
}

/* ------------------------------------------------------------------ markers */

function markerTile(data: LevelData, u: Unit, rng: Rng, used: [number, number][], avoid: [number, number]): [number, number] {
  const blocked = new Set<number>();
  for (const g of data.gems) if (g.state === "buried") blocked.add(idx(g.col, g.row));
  for (const [c, r] of data.boulders) blocked.add(idx(c, r));
  const cand: [number, number][] = [];
  for (let r = u.top; r <= u.bottom; r++) {
    for (let c = 0; c < COLS; c++) {
      if (data.unitAt[idx(c, r)] !== u.index || blocked.has(idx(c, r))) continue;
      if (c === avoid[0] && r === avoid[1]) continue;
      cand.push([c, r]);
    }
  }
  // prefer tiles spread out from other markers and from the hero
  const score = ([c, r]: [number, number]) => {
    let d = Math.abs(c - avoid[0]) + Math.abs(r - avoid[1]) > 2 ? 4 : 0;
    if (!data.dug[idx(c, r)]) d += 12; // keep markers out of critter tunnels when possible
    for (const [uc, ur] of used) d += Math.min(6, Math.abs(uc - c) + Math.abs(ur - r));
    return d + rng() * 3;
  };
  let best = cand[0];
  let bestS = -1;
  for (const p of cand) {
    const s = score(p);
    if (s > bestS) {
      bestS = s;
      best = p;
    }
  }
  return best;
}

let counter = 0;

/**
 * Builds a challenge for this level. `hero` is the hero's tile (markers avoid it).
 * Returns null only if the grade has no feasible kind here (the tests make sure that never happens).
 */
export function makeChallenge(data: LevelData, rng: Rng, hero: [number, number] = [13, 1], avoidKind?: ChallengeKind): Challenge | null {
  let kinds = feasibleKinds(data);
  if (kinds.length > 1 && avoidKind) kinds = kinds.filter((k) => k !== avoidKind);
  if (kinds.length === 0) return null;
  const kind = pickOf(rng, kinds);
  const b = BUILDERS[kind](data.units, rng);
  if (!b) return null;
  const order = shuffled(rng, [b.answer, ...b.others]);
  const label = b.label ?? ((u: Unit) => u.label);
  const tag = tagFor(kind, data.grade);
  const choices = order.map(label) as Question["choices"];
  const used: [number, number][] = [];
  const markers = order.map((u) => {
    const m = markerTile(data, u, rng, used, hero);
    used.push(m);
    return m;
  });
  const answer = order.indexOf(b.answer);
  const q: Question = {
    id: `rd-g${data.grade}-${kind}-${++counter}`,
    subject: "science",
    grade: data.grade,
    standard: tag.standard,
    skill: tag.skill,
    prompt: b.prompt,
    choices,
    answer,
    explanation: `${b.explanation} Answer: ${choices[answer]}.`,
  };
  return {
    kind, q, units: order.map((u) => u.index), markers,
    halfLife: b.halfLife, halves: b.halvesOf ? order.map(b.halvesOf) : undefined, askHalves: b.askHalves,
  };
}

/** Rock ids used by each K–2 label, for the tests. */
export const LOOSE_ROCKS: RockId[] = (Object.keys(ROCKS) as RockId[]).filter((r) => ["soil", "sediment"].includes(ROCKS[r].type));
