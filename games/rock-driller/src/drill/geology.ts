/*
 * Rock Driller's geology: real Earth materials, the specimens buried in them, and the
 * ground cross-sections ("sites") the driller digs through at each grade.
 *
 * Every fact here is checked by scripts/check-geology.ts against an independent truth
 * table (rock classes, metamorphic parents, where fossils can occur, era order and ages).
 */
import type { Grade } from "../kit/types";

/* ------------------------------------------------------------------ rocks */

/**
 * soil        – soil horizons (topsoil, subsoil, weathered rock)
 * sediment    – loose sediment for K–2 (sand, clay, pebbles, mud)
 * sedimentary / igneous / metamorphic – the three rock classes
 * earth       – Earth's deep layers (crust, mantle, core) on the not-to-scale "whole Earth" site
 */
export type RockType = "soil" | "sediment" | "sedimentary" | "igneous" | "metamorphic" | "earth";

export type Texture =
  | "roots" | "clods" | "chunks" | "grains" | "smooth" | "pebbles" | "shells" | "layers" | "glints"
  | "crystals" | "fine" | "pillows" | "veins" | "sheen" | "bands" | "ironbands" | "oil" | "liquid" | "hot";

export type RockId =
  | "topsoil" | "subsoil" | "weathered" | "sand" | "clay" | "pebbles" | "mud"
  | "sandstone" | "shale" | "limestone" | "coal" | "conglomerate" | "oilsand" | "bif"
  | "granite" | "basalt" | "pillow" | "gabbro" | "peridotite"
  | "marble" | "slate" | "schist" | "gneiss"
  | "crust" | "uppermantle" | "lowermantle" | "outercore" | "innercore";

export interface Rock {
  id: RockId;
  /** Upper-case label for the legend (bitmap font, ≤ 14 characters). */
  name: string;
  type: RockType;
  /** Base, dark and light colours used to paint its texture. */
  colors: [string, string, string];
  tex: Texture;
  /** 1 = loose, fast to drill … 7 = very hard. Sets the drill speed. */
  hardness: number;
  /** For metamorphic rocks: the rock it changed from. */
  parent?: RockId;
  /** Liquid (only the outer core). */
  liquid?: boolean;
  /** One or two kid-friendly sentences shown on the specimen card. */
  fact: string;
}

const R = (r: Rock) => r;

export const ROCKS: Record<RockId, Rock> = {
  topsoil: R({ id: "topsoil", name: "TOPSOIL", type: "soil", colors: ["#4a3322", "#2e1f14", "#6f4e33"], tex: "roots", hardness: 1,
    fact: "Topsoil is dark because it is full of humus: bits of rotted leaves, roots and animals. Most plant roots grow here." }),
  subsoil: R({ id: "subsoil", name: "SUBSOIL", type: "soil", colors: ["#9a6333", "#6e4424", "#b98050"], tex: "clods", hardness: 2,
    fact: "Subsoil lies under the topsoil. It has little humus, but lots of clay and minerals carried down by water." }),
  weathered: R({ id: "weathered", name: "WEATHERED ROCK", type: "soil", colors: ["#8f8570", "#6a624f", "#b0a68c"], tex: "chunks", hardness: 2,
    fact: "Weathered rock is bedrock slowly breaking into pieces. Over a long time, it turns into soil." }),
  sand: R({ id: "sand", name: "SAND", type: "sediment", colors: ["#dcc07a", "#b99a55", "#f0dca0"], tex: "grains", hardness: 1,
    fact: "Sand is made of tiny grains of rock, mostly the mineral quartz. It feels gritty and water drains through it fast." }),
  clay: R({ id: "clay", name: "CLAY", type: "sediment", colors: ["#b5714f", "#8d5236", "#cf9070"], tex: "smooth", hardness: 2,
    fact: "Clay has the tiniest grains of all. It is sticky when wet and holds water well." }),
  pebbles: R({ id: "pebbles", name: "PEBBLES", type: "sediment", colors: ["#9c8f7e", "#6f6456", "#c9bda9"], tex: "pebbles", hardness: 2,
    fact: "Pebbles are small rocks. Rolling in moving water wears their sharp edges smooth and round." }),
  mud: R({ id: "mud", name: "MUD", type: "sediment", colors: ["#6f5a44", "#4f3f2f", "#8c7459"], tex: "smooth", hardness: 1,
    fact: "Mud is fine silt and clay mixed with water. It is soft and squishy." }),

  sandstone: R({ id: "sandstone", name: "SANDSTONE", type: "sedimentary", colors: ["#c8995a", "#a07540", "#e2bb80"], tex: "grains", hardness: 3,
    fact: "Sandstone is sand grains pressed and cemented together. It is a sedimentary rock." }),
  shale: R({ id: "shale", name: "SHALE", type: "sedimentary", colors: ["#5b5f66", "#44474d", "#777c84"], tex: "layers", hardness: 3,
    fact: "Shale is mud and clay pressed into thin layers. It is a sedimentary rock that splits into flat pieces and often holds fossils." }),
  limestone: R({ id: "limestone", name: "LIMESTONE", type: "sedimentary", colors: ["#cfc8ae", "#aaa38a", "#ebe5cf"], tex: "shells", hardness: 3,
    fact: "Limestone is a sedimentary rock made mostly of calcite, often from the shells of sea creatures. It fizzes in acid." }),
  coal: R({ id: "coal", name: "COAL", type: "sedimentary", colors: ["#1f1e22", "#0e0e10", "#4a4952"], tex: "glints", hardness: 2,
    fact: "Coal formed from swamp plants that were buried and squeezed for millions of years. It is a sedimentary rock and a fossil fuel." }),
  conglomerate: R({ id: "conglomerate", name: "CONGLOMERATE", type: "sedimentary", colors: ["#a58d6c", "#7d6850", "#cdb693"], tex: "pebbles", hardness: 3,
    fact: "Conglomerate is rounded pebbles cemented together with sand. It is a sedimentary rock." }),
  oilsand: R({ id: "oilsand", name: "OIL SANDSTONE", type: "sedimentary", colors: ["#7d6038", "#4e3a20", "#a4834e"], tex: "oil", hardness: 3,
    fact: "The tiny spaces between this sandstone's grains are filled with oil and natural gas. Geologists call it a reservoir rock." }),
  bif: R({ id: "bif", name: "BANDED IRON", type: "sedimentary", colors: ["#8e3b2c", "#4a2a24", "#b88a74"], tex: "ironbands", hardness: 5,
    fact: "Banded iron formation is layers of iron minerals such as hematite, laid down in ancient oceans, most more than 1.8 billion years ago. It is our main iron ore." }),

  granite: R({ id: "granite", name: "GRANITE", type: "igneous", colors: ["#b8a39c", "#6f625d", "#eadcd6"], tex: "crystals", hardness: 5,
    fact: "Granite forms when magma cools slowly deep underground, so its crystals grow big enough to see. It is an igneous rock." }),
  basalt: R({ id: "basalt", name: "BASALT", type: "igneous", colors: ["#3d3e44", "#2a2b30", "#5a5c63"], tex: "fine", hardness: 5,
    fact: "Basalt forms when lava cools quickly, so its crystals are tiny. It is an igneous rock." }),
  pillow: R({ id: "pillow", name: "PILLOW BASALT", type: "igneous", colors: ["#3b4046", "#23272c", "#5d646c"], tex: "pillows", hardness: 5,
    fact: "Pillow basalt forms when lava erupts under the sea and cools fast into round blobs. It is the top of the ocean crust." }),
  gabbro: R({ id: "gabbro", name: "GABBRO", type: "igneous", colors: ["#2f3a33", "#1c231f", "#6b7a6f"], tex: "crystals", hardness: 5,
    fact: "Gabbro has the same minerals as basalt, but it cooled slowly underground, so its crystals are bigger. It makes up the lower ocean crust." }),
  peridotite: R({ id: "peridotite", name: "PERIDOTITE", type: "igneous", colors: ["#6b7a3a", "#48531f", "#9db35a"], tex: "crystals", hardness: 6,
    fact: "Peridotite is the green rock of the upper mantle. It is rich in the mineral olivine." }),

  marble: R({ id: "marble", name: "MARBLE", type: "metamorphic", parent: "limestone", colors: ["#e4e0da", "#a9a39a", "#ffffff"], tex: "veins", hardness: 4,
    fact: "Marble is limestone that was changed by heat and pressure. It is a metamorphic rock." }),
  slate: R({ id: "slate", name: "SLATE", type: "metamorphic", parent: "shale", colors: ["#4a5566", "#343d4a", "#6a778d"], tex: "layers", hardness: 4,
    fact: "Slate is shale that was changed by heat and pressure. It is a metamorphic rock that splits into smooth, flat sheets." }),
  schist: R({ id: "schist", name: "SCHIST", type: "metamorphic", parent: "shale", colors: ["#8d8f86", "#5f615a", "#d6d8cb"], tex: "sheen", hardness: 4,
    fact: "Schist forms when shale or slate is squeezed and heated even more, until shiny, flat mica crystals line up. It is metamorphic." }),
  gneiss: R({ id: "gneiss", name: "GNEISS", type: "metamorphic", parent: "granite", colors: ["#a79c92", "#4f4842", "#e2d8cc"], tex: "bands", hardness: 5,
    fact: "Gneiss (say \"nice\") forms under very high heat and pressure. Its minerals separate into light and dark bands. It is metamorphic." }),

  crust: R({ id: "crust", name: "CRUST", type: "earth", colors: ["#7a6a58", "#554a3e", "#a2927e"], tex: "chunks", hardness: 4,
    fact: "The crust is Earth's thin, rocky outer layer: about 5 to 10 km thick under oceans and 30 to 70 km under continents." }),
  uppermantle: R({ id: "uppermantle", name: "UPPER MANTLE", type: "earth", colors: ["#b5562a", "#83391b", "#d67a45"], tex: "hot", hardness: 6,
    fact: "The upper mantle is hot, solid rock. Part of it, the asthenosphere, flows very slowly and carries the tectonic plates." }),
  lowermantle: R({ id: "lowermantle", name: "LOWER MANTLE", type: "earth", colors: ["#94371f", "#6a2414", "#b8553a"], tex: "hot", hardness: 6,
    fact: "The lower mantle is even hotter solid rock, squeezed by huge pressure. The mantle reaches down about 2,900 km." }),
  outercore: R({ id: "outercore", name: "OUTER CORE", type: "earth", liquid: true, colors: ["#e08a1e", "#b8650f", "#ffb347"], tex: "liquid", hardness: 1,
    fact: "The outer core is liquid iron and nickel. Its swirling metal makes Earth's magnetic field." }),
  innercore: R({ id: "innercore", name: "INNER CORE", type: "earth", colors: ["#f3d04a", "#c9a526", "#fff2a8"], tex: "hot", hardness: 7,
    fact: "The inner core is solid iron and nickel, hotter than 5,000 °C. Enormous pressure keeps it solid. It is the densest layer." }),
};

/* ------------------------------------------------------------------ specimens */

export type SpecimenKind = "living" | "fossil" | "crystal" | "fuel" | "ore" | "metal";
export type Era = "cenozoic" | "mesozoic" | "paleozoic" | "precambrian";
export type SpriteShape =
  | "worm" | "grub" | "root" | "shell" | "spiral" | "leaf" | "bone" | "trilobite" | "tooth" | "stem" | "wood"
  | "crystal" | "flake" | "cube" | "nugget" | "lump" | "drop" | "bubble" | "blob";

export type SpecimenId =
  | "earthworm" | "grub" | "roots"
  | "seashell" | "leaf" | "dinobone" | "trilobite" | "crinoid" | "brachiopod" | "ammonite" | "fern" | "sharktooth"
  | "mammoth" | "petrified"
  | "quartz" | "feldspar" | "mica" | "calcite" | "garnet" | "olivine" | "pyrite" | "diamond" | "geode"
  | "coallump" | "oil" | "gas"
  | "hematite" | "magnetite" | "gold" | "galena" | "chalcopyrite"
  | "ironnickel";

export interface Specimen {
  id: SpecimenId;
  /** Upper-case name for cards and the canvas (≤ 14 characters). */
  name: string;
  kind: SpecimenKind;
  shape: SpriteShape;
  /** Main and accent colours of the sprite. */
  colors: [string, string];
  /** Rocks it can be found in (checked against the truth table in the tests). */
  hosts: RockId[];
  /** For index fossils on the geologic-time sites: the era(s) it is placed in. */
  eras?: Era[];
  fact: string;
}

const S = (s: Specimen) => s;

export const SPECIMENS: Record<SpecimenId, Specimen> = {
  earthworm: S({ id: "earthworm", name: "EARTHWORM", kind: "living", shape: "worm", colors: ["#e58a8a", "#b85a5a"], hosts: ["topsoil"],
    fact: "Earthworms are living animals. Their tunnels let air and water into the soil, and their droppings feed plants." }),
  grub: S({ id: "grub", name: "BEETLE GRUB", kind: "living", shape: "grub", colors: ["#f2ead2", "#a8743a"], hosts: ["topsoil"],
    fact: "A grub is a young beetle. It is alive: it eats, grows and will change into an adult beetle." }),
  roots: S({ id: "roots", name: "PLANT ROOTS", kind: "living", shape: "root", colors: ["#e8d9a8", "#8a6a3a"], hosts: ["topsoil"],
    fact: "Roots are living parts of plants. They hold the plant in the soil and take in water." }),

  seashell: S({ id: "seashell", name: "SEASHELL", kind: "fossil", shape: "shell", colors: ["#f4e2c4", "#c98c5a"], hosts: ["sand", "limestone"],
    fact: "This shell was once part of a living sea animal. Shells like it can become fossils." }),
  leaf: S({ id: "leaf", name: "LEAF FOSSIL", kind: "fossil", shape: "leaf", colors: ["#7c8f4a", "#4d5a2c"], hosts: ["shale", "clay", "mud"],
    fact: "A leaf fossil is the print of a leaf pressed into mud long ago. The mud later hardened into rock." }),
  dinobone: S({ id: "dinobone", name: "DINOSAUR BONE", kind: "fossil", shape: "bone", colors: ["#e9dcc0", "#9c8660"], hosts: ["sandstone", "shale"], eras: ["mesozoic"],
    fact: "Dinosaurs lived in the Mesozoic era, from about 252 to 66 million years ago. Their bones are found in sedimentary rock." }),
  trilobite: S({ id: "trilobite", name: "TRILOBITE", kind: "fossil", shape: "trilobite", colors: ["#6d5a44", "#c9b18a"], hosts: ["limestone", "shale"], eras: ["paleozoic"],
    fact: "Trilobites were sea animals with hard shells. They lived only in the Paleozoic era, so they are index fossils." }),
  crinoid: S({ id: "crinoid", name: "CRINOID", kind: "fossil", shape: "stem", colors: ["#d8ccb0", "#8a7a5c"], hosts: ["limestone"], eras: ["paleozoic"],
    fact: "Crinoids, or sea lilies, are animals related to starfish. Their stems piled up to make whole beds of limestone in the Paleozoic." }),
  brachiopod: S({ id: "brachiopod", name: "BRACHIOPOD", kind: "fossil", shape: "shell", colors: ["#cdbb95", "#7e6a48"], hosts: ["limestone", "shale"], eras: ["paleozoic"],
    fact: "Brachiopods are shelled sea animals. They were very common in Paleozoic seas." }),
  ammonite: S({ id: "ammonite", name: "AMMONITE", kind: "fossil", shape: "spiral", colors: ["#c9a36a", "#7a5a30"], hosts: ["shale", "limestone"], eras: ["mesozoic"],
    fact: "Ammonites were squid-like animals in coiled shells. They were common in Mesozoic seas and died out with the dinosaurs." }),
  fern: S({ id: "fern", name: "FERN FOSSIL", kind: "fossil", shape: "leaf", colors: ["#6f8a4a", "#3a4a26"], hosts: ["coal", "shale"], eras: ["paleozoic"],
    fact: "Ferns and seed ferns grew in huge swamps about 300 million years ago. Buried swamp plants became coal." }),
  sharktooth: S({ id: "sharktooth", name: "SHARK TOOTH", kind: "fossil", shape: "tooth", colors: ["#3a3a44", "#8a8a9a"], hosts: ["sandstone", "sand", "mud"], eras: ["cenozoic"],
    fact: "Sharks lose thousands of teeth. Hard teeth fossilize well, so they are among the most common fossils." }),
  mammoth: S({ id: "mammoth", name: "MAMMOTH TOOTH", kind: "fossil", shape: "tooth", colors: ["#d9cdb4", "#7d6a4a"], hosts: ["sandstone", "sand", "pebbles"], eras: ["cenozoic"],
    fact: "Mammoths lived in the Cenozoic era, during the Ice Ages. Their ridged teeth ground up grass." }),
  petrified: S({ id: "petrified", name: "PETRIFIED WOOD", kind: "fossil", shape: "wood", colors: ["#a86a4a", "#e0b080"], hosts: ["sandstone"],
    fact: "In petrified wood, minerals slowly replaced the wood of a buried tree, turning it into stone." }),

  quartz: S({ id: "quartz", name: "QUARTZ", kind: "crystal", shape: "crystal", colors: ["#f4f6ff", "#a8b4d8"], hosts: ["granite", "sandstone", "pebbles", "gneiss", "schist", "crust"],
    fact: "Quartz is one of the most common minerals. It is hard enough to scratch glass." }),
  feldspar: S({ id: "feldspar", name: "FELDSPAR", kind: "crystal", shape: "cube", colors: ["#f0b8a8", "#b87a6a"], hosts: ["granite", "gneiss", "crust"],
    fact: "Feldspar is the most common mineral in Earth's crust. Pink feldspar gives some granite its pink color." }),
  mica: S({ id: "mica", name: "MICA", kind: "crystal", shape: "flake", colors: ["#d8d0a0", "#6a6440"], hosts: ["granite", "schist", "gneiss"],
    fact: "Mica peels into thin, shiny sheets, like pages of a book." }),
  calcite: S({ id: "calcite", name: "CALCITE", kind: "crystal", shape: "crystal", colors: ["#fff4d8", "#d8c48a"], hosts: ["limestone", "marble"],
    fact: "Calcite is the mineral in limestone and marble. A drop of acid makes it fizz." }),
  garnet: S({ id: "garnet", name: "GARNET", kind: "crystal", shape: "crystal", colors: ["#b0203a", "#ff7a8a"], hosts: ["schist", "gneiss", "peridotite"],
    fact: "Garnets are deep red crystals that grow in rocks squeezed by heat and pressure." }),
  olivine: S({ id: "olivine", name: "OLIVINE", kind: "crystal", shape: "crystal", colors: ["#9cc040", "#5a7a1a"], hosts: ["peridotite", "basalt", "gabbro", "pillow", "uppermantle"],
    fact: "Olivine is a green mineral. It is the most common mineral in the upper mantle." }),
  pyrite: S({ id: "pyrite", name: "PYRITE", kind: "crystal", shape: "cube", colors: ["#e0c050", "#8a7020"], hosts: ["shale", "coal", "slate"],
    fact: "Pyrite is called fool's gold. It is shiny and gold-colored, but it is made of iron and sulfur." }),
  diamond: S({ id: "diamond", name: "DIAMOND", kind: "crystal", shape: "crystal", colors: ["#e8fbff", "#7fd8ff"], hosts: ["peridotite", "uppermantle"],
    fact: "Diamonds form from carbon deep in the mantle, about 150 km down, where heat and pressure are huge. Diamond is the hardest mineral." }),
  geode: S({ id: "geode", name: "QUARTZ GEODE", kind: "crystal", shape: "crystal", colors: ["#c8a8f0", "#6a4a9a"], hosts: ["limestone", "shale"],
    fact: "A geode is a hollow rock lined with crystals that grew slowly from mineral-rich water." }),

  coallump: S({ id: "coallump", name: "COAL", kind: "fuel", shape: "lump", colors: ["#26252a", "#8a8a9a"], hosts: ["coal"],
    fact: "Coal is a fossil fuel made from ancient plants. Burning it releases energy and carbon dioxide. It is nonrenewable." }),
  oil: S({ id: "oil", name: "CRUDE OIL", kind: "fuel", shape: "drop", colors: ["#1a1410", "#6a5030"], hosts: ["oilsand"],
    fact: "Oil formed from tiny sea organisms buried in mud. Heat and pressure changed them over millions of years. It is nonrenewable." }),
  gas: S({ id: "gas", name: "NATURAL GAS", kind: "fuel", shape: "bubble", colors: ["#bfe8ff", "#5aa0d0"], hosts: ["oilsand", "shale", "coal"],
    fact: "Natural gas (mostly methane) is a fossil fuel. It is lighter than oil, so it collects at the top of a trap." }),

  hematite: S({ id: "hematite", name: "HEMATITE", kind: "ore", shape: "nugget", colors: ["#7a2a22", "#c05a4a"], hosts: ["bif"],
    fact: "Hematite is the most important iron ore. Steel is made from its iron." }),
  magnetite: S({ id: "magnetite", name: "MAGNETITE", kind: "ore", shape: "nugget", colors: ["#2a2a30", "#707080"], hosts: ["bif", "gabbro"],
    fact: "Magnetite is an iron ore that is naturally magnetic. It sticks to a magnet!" }),
  gold: S({ id: "gold", name: "GOLD", kind: "ore", shape: "nugget", colors: ["#ffd23f", "#b88a10"], hosts: ["schist", "slate"],
    fact: "Gold is often found in quartz veins in metamorphic rock. The first gold found in the U.S. was found in North Carolina, in 1799." }),
  galena: S({ id: "galena", name: "GALENA", kind: "ore", shape: "cube", colors: ["#8a8fa0", "#4a4e5a"], hosts: ["limestone"],
    fact: "Galena is the main ore of lead. It forms heavy, silvery cubes." }),
  chalcopyrite: S({ id: "chalcopyrite", name: "CHALCOPYRITE", kind: "ore", shape: "nugget", colors: ["#c8a040", "#3a8a7a"], hosts: ["granite"],
    fact: "Chalcopyrite is the most important copper ore. Copper carries electricity in wires." }),

  ironnickel: S({ id: "ironnickel", name: "IRON-NICKEL", kind: "metal", shape: "blob", colors: ["#d0d0d8", "#8a8a96"], hosts: ["outercore", "innercore"],
    fact: "Earth's core is mostly iron with some nickel. Some meteorites are made of the same iron-nickel metal." }),
};

/* ------------------------------------------------------------------ sites */

export interface UnitDef {
  rock: RockId;
  rows: number;
  /** Legend label when it differs from the rock name (e.g. "MANTLE", "BEDROCK"). */
  label?: string;
  /** Part of an undisturbed sedimentary sequence: the law of superposition applies. */
  seq?: boolean;
  /** Age range in millions of years (geologic-time sites). */
  ageMa?: [number, number];
  era?: Era;
  /** Specimens that can be buried in this unit (subset of those whose hosts include the rock). */
  specimens: SpecimenId[];
  /** Index fossil named in era challenges (e.g. "AMMONITES"). */
  index?: string;
  /** Oil-trap role (resources challenges). */
  role?: "cap" | "reservoir" | "source";
}

export interface SiteDef {
  id: string;
  name: string;
  units: UnitDef[];
  /** A basalt dike cuts the bottom units up to the top of unit `dikeTop` (cross-cutting). */
  dike?: { topMin: number; topMax: number };
  /** Earth's layers are shown far from scale. */
  notToScale?: boolean;
  /** One-line teaching note shown when the level starts. */
  intro: string;
}

export const GROUND_ROWS = 18;

export const SITES: Record<string, SiteDef> = {
  /* K–2 */
  backyard: {
    id: "backyard", name: "BACKYARD", intro: "Dig under the grass: soil, sand, clay and rock.",
    units: [
      { rock: "topsoil", rows: 4, label: "SOIL", specimens: ["earthworm", "grub", "roots"] },
      { rock: "sand", rows: 4, specimens: ["seashell"] },
      { rock: "clay", rows: 4, specimens: ["leaf"] },
      { rock: "limestone", rows: 6, label: "ROCK", specimens: ["seashell", "geode", "calcite"] },
    ],
  },
  riverbank: {
    id: "riverbank", name: "RIVER BANK", intro: "Rivers drop mud, sand and pebbles in layers.",
    units: [
      { rock: "topsoil", rows: 3, label: "SOIL", specimens: ["earthworm", "grub", "roots"] },
      { rock: "mud", rows: 4, specimens: ["leaf", "sharktooth"] },
      { rock: "sand", rows: 4, specimens: ["seashell", "sharktooth"] },
      { rock: "pebbles", rows: 3, specimens: ["mammoth", "quartz"] },
      { rock: "sandstone", rows: 4, label: "ROCK", specimens: ["petrified", "quartz"] },
    ],
  },
  rockyhill: {
    id: "rockyhill", name: "ROCKY HILL", intro: "A thin soil sits on hard, sparkly rock.",
    units: [
      { rock: "topsoil", rows: 3, label: "SOIL", specimens: ["earthworm", "grub", "roots"] },
      { rock: "clay", rows: 3, specimens: ["leaf"] },
      { rock: "pebbles", rows: 4, specimens: ["quartz", "mammoth"] },
      { rock: "granite", rows: 8, label: "ROCK", specimens: ["quartz", "feldspar", "mica"] },
    ],
  },

  /* 3–5 */
  farm: {
    id: "farm", name: "FARM FIELD", intro: "A soil profile: topsoil, subsoil, weathered rock, then bedrock.",
    units: [
      { rock: "topsoil", rows: 3, specimens: ["earthworm", "grub", "roots"] },
      { rock: "subsoil", rows: 4, specimens: [] },
      { rock: "weathered", rows: 4, specimens: [] },
      { rock: "granite", rows: 7, label: "BEDROCK", specimens: ["quartz", "feldspar", "mica"] },
    ],
  },
  mesa: {
    id: "mesa", name: "CANYON MESA", intro: "Canyon walls show stacked sedimentary layers on old granite.",
    units: [
      { rock: "topsoil", rows: 2, specimens: ["earthworm", "roots"] },
      { rock: "sandstone", rows: 3, seq: true, specimens: ["dinobone", "petrified"] },
      { rock: "shale", rows: 3, seq: true, specimens: ["leaf", "ammonite", "pyrite"] },
      { rock: "limestone", rows: 4, seq: true, specimens: ["trilobite", "crinoid", "brachiopod", "calcite"] },
      { rock: "conglomerate", rows: 2, seq: true, specimens: [] },
      { rock: "granite", rows: 4, specimens: ["quartz", "feldspar", "mica"] },
    ],
  },
  mountain: {
    id: "mountain", name: "MOUNTAIN ROOTS", intro: "Deep in old mountains, heat and pressure changed the rocks.",
    units: [
      { rock: "topsoil", rows: 2, specimens: ["earthworm", "roots"] },
      { rock: "sandstone", rows: 3, specimens: ["petrified", "quartz"] },
      { rock: "schist", rows: 4, specimens: ["garnet", "mica", "quartz"] },
      { rock: "gneiss", rows: 4, specimens: ["garnet", "feldspar", "mica"] },
      { rock: "granite", rows: 5, specimens: ["quartz", "feldspar", "mica"] },
    ],
  },
  coalhills: {
    id: "coalhills", name: "COAL HILLS", intro: "Swamp plants long ago became a black seam of coal.",
    units: [
      { rock: "topsoil", rows: 2, specimens: ["earthworm", "grub", "roots"] },
      { rock: "sandstone", rows: 3, seq: true, specimens: ["petrified", "quartz"] },
      { rock: "shale", rows: 3, seq: true, specimens: ["fern", "leaf", "pyrite"] },
      { rock: "coal", rows: 3, seq: true, specimens: ["fern", "pyrite"] },
      { rock: "limestone", rows: 4, seq: true, specimens: ["crinoid", "brachiopod", "calcite"] },
      { rock: "marble", rows: 3, specimens: ["calcite"] },
    ],
  },

  /* 6–8 */
  cliff: {
    id: "cliff", name: "FOSSIL CLIFF", intro: "Flat sedimentary layers, cut by a basalt dike.",
    dike: { topMin: 2, topMax: 3 },
    units: [
      { rock: "sandstone", rows: 3, seq: true, specimens: ["dinobone", "petrified", "quartz"] },
      { rock: "shale", rows: 3, seq: true, specimens: ["ammonite", "leaf", "pyrite"] },
      { rock: "limestone", rows: 3, seq: true, specimens: ["brachiopod", "crinoid", "calcite"] },
      { rock: "shale", rows: 3, seq: true, specimens: ["trilobite", "brachiopod", "geode"] },
      { rock: "sandstone", rows: 3, seq: true, specimens: ["quartz"] },
      { rock: "conglomerate", rows: 3, seq: true, specimens: [] },
    ],
  },
  ocean: {
    id: "ocean", name: "OCEAN FLOOR", intro: "Under the sea floor: mud, then ocean crust, then the mantle.",
    units: [
      { rock: "mud", rows: 3, label: "OCEAN MUD", specimens: ["sharktooth"] },
      { rock: "pillow", rows: 4, specimens: ["olivine"] },
      { rock: "gabbro", rows: 5, specimens: ["olivine", "magnetite"] },
      { rock: "peridotite", rows: 6, label: "MANTLE", specimens: ["olivine", "garnet"] },
    ],
  },
  continent: {
    id: "continent", name: "CONTINENT ROOT", intro: "Continents are thick: granite crust sits on the mantle.",
    units: [
      { rock: "topsoil", rows: 2, specimens: ["earthworm", "roots"] },
      { rock: "sandstone", rows: 3, specimens: ["petrified", "quartz"] },
      { rock: "granite", rows: 4, specimens: ["quartz", "feldspar", "mica"] },
      { rock: "gneiss", rows: 4, specimens: ["garnet", "feldspar"] },
      { rock: "peridotite", rows: 5, label: "MANTLE", specimens: ["olivine", "diamond", "garnet"] },
    ],
  },
  earth: {
    id: "earth", name: "WHOLE EARTH", notToScale: true, intro: "A super-drill trip to the center of the Earth (not to scale).",
    units: [
      { rock: "crust", rows: 3, specimens: ["quartz", "feldspar"] },
      { rock: "uppermantle", rows: 4, specimens: ["olivine", "diamond"] },
      { rock: "lowermantle", rows: 4, specimens: [] },
      { rock: "outercore", rows: 4, specimens: ["ironnickel"] },
      { rock: "innercore", rows: 3, specimens: ["ironnickel"] },
    ],
  },

  /* 9–12 */
  time: {
    id: "time", name: "GEOLOGIC TIME", intro: "Each layer is a chapter of Earth history. Deeper is older.",
    units: [
      { rock: "sandstone", rows: 3, seq: true, era: "cenozoic", ageMa: [1, 20], index: "MAMMOTH", specimens: ["mammoth", "sharktooth"] },
      { rock: "sandstone", rows: 3, seq: true, era: "mesozoic", ageMa: [95, 105], index: "DINOSAURS", specimens: ["dinobone", "petrified"] },
      { rock: "shale", rows: 3, seq: true, era: "mesozoic", ageMa: [195, 205], index: "AMMONITES", specimens: ["ammonite", "pyrite"] },
      { rock: "coal", rows: 2, seq: true, era: "paleozoic", ageMa: [295, 305], index: "SEED FERNS", specimens: ["fern", "coallump"] },
      { rock: "limestone", rows: 4, seq: true, era: "paleozoic", ageMa: [395, 405], index: "TRILOBITES", specimens: ["trilobite", "crinoid", "brachiopod"] },
      { rock: "granite", rows: 3, era: "precambrian", ageMa: [1000, 1100], specimens: ["quartz", "feldspar"] },
    ],
  },
  oilfield: {
    id: "oilfield", name: "OIL FIELD", intro: "Oil rises from source rock until a cap rock traps it.",
    units: [
      { rock: "topsoil", rows: 2, specimens: ["earthworm", "roots"] },
      { rock: "sandstone", rows: 3, seq: true, specimens: ["petrified", "quartz"] },
      { rock: "shale", rows: 3, seq: true, role: "cap", specimens: ["pyrite", "leaf"] },
      { rock: "oilsand", rows: 4, seq: true, role: "reservoir", specimens: ["oil", "gas"] },
      { rock: "limestone", rows: 3, seq: true, specimens: ["brachiopod", "crinoid", "galena"] },
      { rock: "shale", rows: 3, seq: true, role: "source", specimens: ["gas", "pyrite"] },
    ],
  },
  orehills: {
    id: "orehills", name: "ORE HILLS", intro: "Mineral resources: metals come from ore rocks.",
    units: [
      { rock: "topsoil", rows: 2, specimens: ["earthworm", "roots"] },
      { rock: "limestone", rows: 4, specimens: ["galena", "calcite", "brachiopod"] },
      { rock: "schist", rows: 4, specimens: ["gold", "garnet", "mica"] },
      { rock: "bif", rows: 4, specimens: ["hematite", "magnetite"] },
      { rock: "granite", rows: 4, specimens: ["chalcopyrite", "quartz", "feldspar"] },
    ],
  },
};

/** Sites visited, in order, at each grade (levels cycle through the list). */
export const GRADE_SITES: Record<Grade, string[]> = {
  K: ["backyard", "riverbank", "rockyhill"],
  "1": ["backyard", "riverbank", "rockyhill"],
  "2": ["riverbank", "backyard", "rockyhill"],
  "3": ["farm", "mesa", "coalhills", "mountain"],
  "4": ["mesa", "mountain", "farm", "coalhills"],
  "5": ["mesa", "mountain", "coalhills", "farm"],
  "6": ["continent", "earth", "ocean", "cliff"],
  "7": ["cliff", "continent", "ocean", "earth"],
  "8": ["cliff", "continent", "earth", "ocean"],
  "9": ["oilfield", "time", "orehills", "ocean"],
  "10": ["time", "cliff", "oilfield", "earth"],
  "11": ["time", "orehills", "oilfield", "earth"],
  "12": ["earth", "time", "oilfield", "ocean"],
};

/** Era boundaries (millions of years ago, International Chronostratigraphic Chart). */
export const ERA_BOUNDS: { era: Era; name: string; young: number; old: number }[] = [
  { era: "cenozoic", name: "CENOZOIC", young: 0, old: 66 },
  { era: "mesozoic", name: "MESOZOIC", young: 66, old: 252 },
  { era: "paleozoic", name: "PALEOZOIC", young: 252, old: 539 },
  { era: "precambrian", name: "PRECAMBRIAN", young: 539, old: 4600 },
];

export const TYPE_NAMES: Record<RockType, string> = {
  soil: "SOIL",
  sediment: "SEDIMENT",
  sedimentary: "SEDIMENTARY",
  igneous: "IGNEOUS",
  metamorphic: "METAMORPHIC",
  earth: "EARTH LAYER",
};

/** Short legend tags. */
export const TYPE_TAGS: Record<RockType, string> = {
  soil: "SOIL",
  sediment: "LOOSE",
  sedimentary: "SED",
  igneous: "IGN",
  metamorphic: "MET",
  earth: "",
};

export function unitLabel(u: UnitDef): string {
  return u.label ?? ROCKS[u.rock].name;
}
