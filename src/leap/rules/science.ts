import { catRules, listRule, type Rule, type RuleItem } from "./types";

/*
 * Science rules, K-12, tagged with NC Standard Course of Study for Science (2023) codes in the
 * kit's style. High school: 9 = Earth & Environmental Science, 10 = Biology, 11 = Chemistry,
 * 12 = Physics. Codes marked "verify" in the README are best guesses at strand level.
 */

/* ------------------------------------------------------------------ K */

const kLiving = catRules({
  family: "k-living", subject: "science", grade: "K", standard: "LS.K.1.1", skill: "Living and nonliving",
  cats: {
    LIVING: { name: "a living thing", items: ["DOG", "TREE", "BIRD", "FISH", "FLOWER", "FROG", "GRASS", "ANT", "CAT", "WORM", "BEE"] },
    NONLIVING: { name: "not alive", items: ["ROCK", "CAR", "CHAIR", "BALL", "SPOON", "SHOE", "BOOK", "CUP", "KITE", "ROBOT", "SOCK", "TRUCK"] },
  },
  targets: [
    { key: "LIVING", text: "HOP ON LIVING THINGS", say: "Hop only on living things.", hint: "Living things grow, eat, drink and have babies." },
    { key: "NONLIVING", text: "HOP ON NONLIVING THINGS", say: "Hop only on things that are not alive.", hint: "Nonliving things do not grow, eat or breathe." },
  ],
});

const kAnimals = catRules({
  family: "k-animals", subject: "science", grade: "K", standard: "LS.K.1.1", skill: "Living and nonliving",
  cats: {
    ANIMAL: { name: "an animal", items: ["DOG", "CAT", "BIRD", "FISH", "FROG", "ANT", "BEAR", "DUCK", "COW", "BEE", "PIG", "HORSE"] },
    PLANT: { name: "a plant", items: ["TREE", "FLOWER", "GRASS", "CACTUS", "BUSH", "CARROT"] },
    THING: { name: "not alive", items: ["ROCK", "CAR", "BALL", "SHOE", "CUP", "SUN"] },
  },
  targets: [{ key: "ANIMAL", text: "HOP ON ANIMALS", say: "Hop only on animals.", hint: "Animals move around and eat food." }],
});

const kHardSoft = catRules({
  family: "k-hardsoft", subject: "science", grade: "K", standard: "PS.K.1.1", skill: "Sort by properties",
  cats: {
    HARD: { name: "hard", items: ["ROCK", "BRICK", "NAIL", "SPOON", "PENNY", "KEY", "MARBLE", "SHELL", "BONE", "ICE"] },
    SOFT: { name: "soft", items: ["PILLOW", "SOCK", "COTTON", "FEATHER", "SPONGE", "TEDDY BEAR", "BLANKET", "TISSUE", "SCARF", "MITTEN"] },
  },
  targets: [
    { key: "HARD", text: "HOP ON HARD THINGS", say: "Hop only on hard things.", hint: "Hard things don't squish when you press them." },
    { key: "SOFT", text: "HOP ON SOFT THINGS", say: "Hop only on soft things.", hint: "Soft things squish when you press them." },
  ],
});

/* ------------------------------------------------------------------ 1 */

const g1Parts = catRules({
  family: "g1-parts", subject: "science", grade: "1", standard: "LS.1.1", skill: "Plant and animal parts",
  cats: {
    PLANT: { name: "a plant part", items: ["ROOT", "STEM", "LEAF", "FLOWER", "SEED", "FRUIT", "PETAL", "BUD", "BRANCH", "BARK"] },
    ANIMAL: { name: "an animal part", items: ["FUR", "BEAK", "WING", "TAIL", "PAW", "CLAW", "FIN", "SCALES", "FEATHER", "HOOF", "GILLS", "WHISKERS"] },
  },
  targets: [
    { key: "PLANT", text: "HOP ON PLANT PARTS", say: "Hop only on parts of a plant.", hint: "Plants have roots, stems, leaves and flowers.", standard: "LS.1.1" },
    { key: "ANIMAL", text: "HOP ON ANIMAL PARTS", say: "Hop only on parts of an animal.", hint: "Animals can have fur, wings, fins or beaks.", standard: "LS.1.2" },
  ],
});

const g1SkyEarth = catRules({
  family: "g1-skyearth", subject: "science", grade: "1", standard: "ESS.1.1", skill: "Sky and Earth materials",
  cats: {
    SKY: { name: "something in the sky", items: ["SUN", "MOON", "STARS", "CLOUDS", "RAINBOW", "COMET", "BIG DIPPER", "LIGHTNING"] },
    EARTH: { name: "an Earth material", items: ["ROCK", "SOIL", "SAND", "WATER", "CLAY", "PEBBLE", "BOULDER", "GRAVEL", "MUD"] },
    MADE: { name: "made by people", items: ["TOY CAR", "SPOON", "CRAYON", "BIKE", "ROBOT", "CHAIR"] },
  },
  targets: [
    { key: "SKY", text: "HOP ON THINGS IN THE SKY", say: "Hop only on things we see in the sky.", hint: "Look up! Day sky and night sky.", standard: "ESS.1.1", skill: "Objects in the sky" },
    { key: "EARTH", text: "HOP ON EARTH MATERIALS", say: "Hop only on Earth materials.", hint: "Earth materials: rocks, soil, sand and water.", standard: "ESS.1.2.1", skill: "Earth materials" },
  ],
});

/* ------------------------------------------------------------------ 2 */

const g2States = catRules({
  family: "g2-states", subject: "science", grade: "2", standard: "PS.2.1.1", skill: "Solids and liquids",
  cats: {
    SOLID: { name: "a solid", items: ["ICE", "ROCK", "WOOD", "BRICK", "SPOON", "COIN", "CRAYON", "PENCIL", "NAIL", "BLOCK"] },
    LIQUID: { name: "a liquid", items: ["WATER", "MILK", "JUICE", "OIL", "SYRUP", "HONEY", "SODA", "RAIN", "VINEGAR", "MELTED WAX"] },
  },
  targets: [
    { key: "SOLID", text: "HOP ON SOLIDS", say: "Hop only on solids.", hint: "A solid keeps its own shape." },
    { key: "LIQUID", text: "HOP ON LIQUIDS", say: "Hop only on liquids.", hint: "A liquid flows and takes the shape of its container." },
  ],
});

/** Young animal → adult, for the life-cycle rule. */
const YOUNG: [string, string][] = [
  ["TADPOLE", "FROG"], ["LARVA", "INSECT"], ["CHICK", "HEN"], ["CALF", "COW"], ["PUPPY", "DOG"], ["KITTEN", "CAT"],
  ["FOAL", "HORSE"], ["CUB", "BEAR"], ["DUCKLING", "DUCK"], ["LAMB", "SHEEP"], ["FAWN", "DEER"], ["PIGLET", "PIG"],
  ["CATERPILLAR", "BUTTERFLY"],
];
const YOUNG_OK = YOUNG.filter(([y]) => y.length <= 10);
const ADULTS = ["FROG", "BUTTERFLY", "HEN", "COW", "DOG", "CAT", "HORSE", "BEAR", "DUCK", "SHEEP", "DEER", "PIG"];
const youngOf = (adult: string) => YOUNG.find(([, a]) => a === adult)?.[0].toLowerCase();

const g2Young: Rule[] = ["YOUNG", "ADULT"].map((t) => {
  const young: RuleItem[] = YOUNG_OK.map(([y, a]) => ({ label: y, why: `A ${y.toLowerCase()} is a young ${a.toLowerCase()}.` }));
  const adult: RuleItem[] = ADULTS.map((a) => ({ label: a, why: `A ${a.toLowerCase()} is a grown-up. Its baby is a ${youngOf(a)}.` }));
  return listRule({
    id: `g2-${t.toLowerCase()}`, family: "g2-lifecycle", subject: "science", grade: "2", standard: "LS.2.1", skill: "Animal life cycles",
    text: t === "YOUNG" ? "HOP ON BABY ANIMALS" : "HOP ON GROWN-UP ANIMALS",
    say: t === "YOUNG" ? "Hop only on baby animals." : "Hop only on grown-up animals.",
    hint: t === "YOUNG" ? "Baby animals: a calf, a chick, a tadpole." : "Adults are grown up and can have babies.",
    matches: t === "YOUNG" ? young : adult,
    misses: t === "YOUNG" ? adult : young,
  });
});

/* ------------------------------------------------------------------ 3 */

const g3States = catRules({
  family: "g3-states", subject: "science", grade: "3", standard: "PS.3.1.2", skill: "Solids, liquids and gases",
  cats: {
    GAS: { name: "a gas", items: ["STEAM", "AIR", "OXYGEN", "HELIUM", "NITROGEN", "NEON", "WATER VAPOR", "HYDROGEN", "CO₂ GAS"].filter((s) => s.length <= 10) },
    LIQUID: { name: "a liquid", items: ["WATER", "MILK", "OIL", "JUICE", "SYRUP", "VINEGAR", "LAVA", "SODA", "RAIN"] },
    SOLID: { name: "a solid", items: ["ICE", "ROCK", "IRON", "SALT", "WOOD", "BRICK", "COPPER", "SAND"] },
  },
  targets: [
    { key: "GAS", text: "HOP ON GASES", say: "Hop only on gases.", hint: "A gas spreads out to fill any container." },
    { key: "LIQUID", text: "HOP ON LIQUIDS", say: "Hop only on liquids.", hint: "A liquid flows but keeps the same amount of space." },
  ],
});

const g3Planets = catRules({
  family: "g3-planets", subject: "science", grade: "3", standard: "ESS.3.1.1", skill: "The solar system",
  cats: {
    PLANET: { name: "a planet", items: ["MERCURY", "VENUS", "EARTH", "MARS", "JUPITER", "SATURN", "URANUS", "NEPTUNE"] },
    OTHER: {
      name: "not a planet",
      items: [
        { label: "SUN", why: "The SUN is a star, not a planet." },
        { label: "MOON", why: "The MOON is a moon: it orbits Earth, not the sun." },
        { label: "PLUTO", why: "PLUTO is a dwarf planet, not one of the 8 planets." },
        { label: "CERES", why: "CERES is a dwarf planet in the asteroid belt." },
        { label: "COMET", why: "A COMET is a ball of ice and dust, not a planet." },
        { label: "ASTEROID", why: "An ASTEROID is a space rock, not a planet." },
        { label: "METEOR", why: "A METEOR is a space rock burning up in our air." },
        { label: "GALAXY", why: "A GALAXY is a huge group of stars." },
        { label: "STAR", why: "A STAR makes its own light. Planets don't." },
      ],
    },
  },
  targets: [{ key: "PLANET", text: "HOP ON PLANETS", say: "Hop only on planets.", hint: "Our solar system has 8 planets." }],
});

const g3Bones = catRules({
  family: "g3-bones", subject: "science", grade: "3", standard: "LS.3.1.1", skill: "Skeletal and muscular systems",
  cats: {
    BONE: { name: "a bone", items: ["SKULL", "RIBS", "SPINE", "FEMUR", "PELVIS", "JAWBONE", "KNEECAP", "COLLARBONE", "BREASTBONE"] },
    OTHER: {
      name: "not a bone",
      items: [
        { label: "HEART", why: "The HEART is an organ made of muscle, not a bone." },
        { label: "LUNGS", why: "LUNGS are organs for breathing, not bones." },
        { label: "BICEPS", why: "The BICEPS is a muscle that bends your arm." },
        { label: "TRICEPS", why: "The TRICEPS is a muscle that straightens your arm." },
        { label: "SKIN", why: "SKIN covers your body. It is not a bone." },
        { label: "HAIR", why: "HAIR is not a bone." },
        { label: "BRAIN", why: "The BRAIN is an organ. The skull is the bone around it." },
        { label: "STOMACH", why: "The STOMACH is an organ for digesting food." },
        { label: "TONGUE", why: "The TONGUE is a muscle, not a bone." },
      ],
    },
  },
  targets: [{ key: "BONE", text: "HOP ON BONES", say: "Hop only on bones.", hint: "Bones make up your skeleton." }],
});

/* ------------------------------------------------------------------ 4 */

const g4Conduct = catRules({
  family: "g4-conductors", subject: "science", grade: "4", standard: "PS.4.2", skill: "Conductors and insulators",
  cats: {
    CONDUCTOR: { name: "a conductor", items: ["COPPER", "IRON NAIL", "FOIL", "SILVER", "STEEL", "GOLD", "PAPER CLIP", "ALUMINUM", "BRASS"] },
    INSULATOR: { name: "an insulator", items: ["RUBBER", "PLASTIC", "WOOD", "GLASS", "CLOTH", "PAPER", "CORK", "WOOL", "STYROFOAM", "CERAMIC"] },
  },
  targets: [
    { key: "CONDUCTOR", text: "HOP ON ELECTRIC CONDUCTORS", say: "Hop only on things that conduct electricity.", hint: "Metals let electricity flow through them." },
    { key: "INSULATOR", text: "HOP ON INSULATORS", say: "Hop only on insulators.", hint: "Insulators block electricity: rubber, plastic, wood." },
  ],
});

const g4Rocks = catRules({
  family: "g4-rocks", subject: "science", grade: "4", standard: "ESS.4.2.1", skill: "Rock types",
  cats: {
    IGNEOUS: { name: "an igneous rock", items: ["GRANITE", "BASALT", "OBSIDIAN", "PUMICE", "GABBRO", "RHYOLITE", "ANDESITE", "DIORITE", "SCORIA"] },
    SEDIMENTARY: { name: "a sedimentary rock", items: ["SANDSTONE", "LIMESTONE", "SHALE", "COAL", "CHALK", "MUDSTONE", "SILTSTONE", "BRECCIA"] },
    METAMORPHIC: { name: "a metamorphic rock", items: ["MARBLE", "SLATE", "GNEISS", "SCHIST", "QUARTZITE", "PHYLLITE", "SOAPSTONE", "HORNFELS"] },
  },
  targets: [
    { key: "IGNEOUS", text: "HOP ON IGNEOUS ROCKS", say: "Hop only on igneous rocks.", hint: "Igneous rock forms when melted rock cools." },
    { key: "SEDIMENTARY", text: "HOP ON SEDIMENTARY ROCKS", say: "Hop only on sedimentary rocks.", hint: "Sedimentary rock forms from layers pressed together." },
    { key: "METAMORPHIC", text: "HOP ON METAMORPHIC ROCKS", say: "Hop only on metamorphic rocks.", hint: "Metamorphic rock is changed by heat and pressure." },
  ],
});

/* ------------------------------------------------------------------ 5 */

const g5Changes = catRules({
  family: "g5-changes", subject: "science", grade: "5", standard: "PS.5.1.2", skill: "Physical and chemical changes",
  cats: {
    CHEMICAL: { name: "a chemical change", items: ["RUSTING", "BURNING", "BAKING", "ROTTING", "TARNISHING", "FRYING EGG", "MILK SOURS", "FIREWORKS"] },
    PHYSICAL: { name: "a physical change", items: ["MELTING", "FREEZING", "CUTTING", "TEARING", "DISSOLVING", "BOILING", "CRUSHING", "FOLDING", "SHREDDING"] },
  },
  targets: [
    { key: "CHEMICAL", text: "HOP ON CHEMICAL CHANGES", say: "Hop only on chemical changes.", hint: "Chemical change: a new substance is made." },
    { key: "PHYSICAL", text: "HOP ON PHYSICAL CHANGES", say: "Hop only on physical changes.", hint: "Physical change: same substance, new shape or state." },
  ],
});

const g5Roles = catRules({
  family: "g5-roles", subject: "science", grade: "5", standard: "LS.5.2", skill: "Producers, consumers, decomposers",
  cats: {
    PRODUCER: { name: "a producer", items: ["GRASS", "OAK TREE", "ALGAE", "MOSS", "CORN", "FERN", "SEAWEED", "CACTUS", "KELP"] },
    CONSUMER: { name: "a consumer", items: ["DEER", "HAWK", "RABBIT", "SNAKE", "FOX", "OWL", "FROG", "SHARK", "HUMAN"] },
    DECOMPOSER: { name: "a decomposer", items: ["MUSHROOM", "MOLD", "BACTERIA"] },
  },
  targets: [
    { key: "PRODUCER", text: "HOP ON PRODUCERS", say: "Hop only on producers.", hint: "Producers make their own food from sunlight." },
    { key: "CONSUMER", text: "HOP ON CONSUMERS", say: "Hop only on consumers.", hint: "Consumers eat other living things." },
  ],
});

const g5Digest = catRules({
  family: "g5-digestive", subject: "science", grade: "5", standard: "LS.5.1", skill: "Body systems",
  cats: {
    DIGESTIVE: { name: "part of the digestive system", items: ["MOUTH", "TEETH", "STOMACH", "ESOPHAGUS", "LIVER", "PANCREAS", "INTESTINE", "COLON"] },
    CIRCULATORY: { name: "part of the circulatory system", items: ["HEART", "VEIN", "ARTERY", "BLOOD"] },
    RESPIRATORY: { name: "part of the respiratory system", items: ["LUNGS", "TRACHEA"] },
    NERVOUS: { name: "part of the nervous system", items: ["BRAIN", "NERVE"] },
    SKELETAL: { name: "part of the skeletal system", items: ["SKULL", "RIBS"] },
  },
  targets: [{ key: "DIGESTIVE", text: "HOP ON DIGESTIVE SYSTEM PARTS", say: "Hop only on parts of the digestive system.", hint: "The digestive system breaks food down." }],
});

/* ------------------------------------------------------------------ 6 */

const g6Waves = catRules({
  family: "g6-waves", subject: "science", grade: "6", standard: "PS.6.3", skill: "Waves",
  cats: {
    MECHANICAL: {
      name: "a mechanical wave",
      items: ["SOUND", "OCEAN WAVE", "RIPPLE", { label: "SEISMIC", say: "seismic wave", why: "A SEISMIC wave travels through rock." }, "P WAVE", "S WAVE", { label: "SLINKY", say: "Slinky wave", why: "A wave on a SLINKY is a mechanical wave." }, "ECHO", "TSUNAMI", "ULTRASOUND"],
    },
    EM: {
      name: "an EM wave",
      items: ["LIGHT", "RADIO", "X-RAY", "MICROWAVE", "INFRARED", "UV LIGHT", "GAMMA RAY", "SUNLIGHT", "WI-FI"],
    },
  },
  targets: [
    { key: "MECHANICAL", text: "HOP ON MECHANICAL WAVES", say: "Hop only on mechanical waves.", hint: "Mechanical waves need matter (air, water, rock)." },
    { key: "EM", text: "HOP ON ELECTROMAGNETIC WAVES", say: "Hop only on electromagnetic waves.", hint: "EM waves can travel through empty space." },
  ],
});

const g6Biotic = catRules({
  family: "g6-biotic", subject: "science", grade: "6", standard: "LS.6.2", skill: "Biotic and abiotic factors",
  cats: {
    BIOTIC: { name: "biotic (living)", items: ["TREES", "GRASS", "BIRDS", "FUNGI", "BACTERIA", "INSECTS", "DEER", "ALGAE", "WORMS"] },
    ABIOTIC: { name: "abiotic (nonliving)", items: ["SUNLIGHT", "WATER", "ROCKS", "AIR", "WIND", "RAINFALL", "SAND", "SNOW", "OXYGEN"] },
  },
  targets: [
    { key: "BIOTIC", text: "HOP ON BIOTIC FACTORS", say: "Hop only on biotic factors, the living parts of an ecosystem.", hint: "Biotic = living parts of an ecosystem." },
    { key: "ABIOTIC", text: "HOP ON ABIOTIC FACTORS", say: "Hop only on abiotic factors, the nonliving parts of an ecosystem.", hint: "Abiotic = nonliving parts: light, water, air." },
  ],
});

/* ------------------------------------------------------------------ 7 */

const g7Cells = catRules({
  family: "g7-cells", subject: "science", grade: "7", standard: "LS.7.1", skill: "Single-celled and many-celled organisms",
  cats: {
    UNI: { name: "single-celled", items: ["AMOEBA", "PARAMECIUM", "EUGLENA", "YEAST", "DIATOM", "E. COLI", "BACTERIUM", "SALMONELLA"] },
    MULTI: { name: "multicellular", items: ["MUSHROOM", "FERN", "ANT", "HUMAN", "OAK TREE", "KELP", "MOSS", "JELLYFISH", "EARTHWORM"] },
  },
  targets: [
    { key: "UNI", text: "HOP ON SINGLE-CELLED LIFE", say: "Hop only on single-celled organisms.", hint: "Unicellular: the whole organism is one cell." },
    { key: "MULTI", text: "HOP ON MULTICELLULAR LIFE", say: "Hop only on multicellular organisms.", hint: "Multicellular: made of many cells." },
  ],
});

const HET = ["Aa", "Bb", "Tt", "Rr", "Gg", "Pp", "Ee", "Hh"];
const HOM = ["AA", "aa", "BB", "bb", "TT", "tt", "RR", "rr", "GG", "gg"];
const g7Genes = catRules({
  family: "g7-genotype", subject: "science", grade: "7", standard: "LS.7.2", skill: "Genotypes",
  cats: {
    HET: { name: "heterozygous (two different alleles)", items: HET.map((l) => ({ label: l, say: `big ${l[0]}, little ${l[1]}` })) },
    HOM: {
      name: "homozygous (two matching alleles)",
      items: HOM.map((l) => ({ label: l, say: l[0] === l[0].toUpperCase() ? `big ${l[0]}, big ${l[0]}` : `little ${l[0]}, little ${l[0]}` })),
    },
  },
  targets: [
    { key: "HET", text: "HOP ON HETEROZYGOUS GENOTYPES", say: "Hop only on heterozygous genotypes.", hint: "Heterozygous: one dominant + one recessive allele." },
    { key: "HOM", text: "HOP ON HOMOZYGOUS GENOTYPES", say: "Hop only on homozygous genotypes.", hint: "Homozygous: both alleles the same (AA or aa)." },
  ],
});

/** Distance and time for the speed rule, as "20m/2s". */
const SPEEDS = ["20m/2s", "50m/5s", "30m/3s", "100m/10s", "5m/0.5s", "60m/6s", "80m/8s", "40m/4s", "15m/1.5s",
  "10m/2s", "50m/10s", "30m/2s", "100m/5s", "5m/5s", "60m/12s", "80m/4s", "20m/4s", "12m/3s", "90m/10s"];
export const speedOf = (l: string) => {
  const [d, t] = l.split("/").map((p) => parseFloat(p));
  return d / t;
};
const g7Speed = listRule({
  id: "g7-speed10", subject: "science", grade: "7", standard: "PS.7.1", skill: "Speed",
  text: "HOP ON SPEEDS OF 10 m/s",
  say: "Hop only on speeds of 10 meters per second.",
  hint: "Speed = distance ÷ time.",
  matches: SPEEDS.filter((l) => speedOf(l) === 10).map((l) => ({ label: l, say: l.replace(/s$/, " seconds").replace("m/", " meters in "), why: `${l.replace("/", " in ")}: ${l.split("/")[0]} ÷ ${l.split("/")[1]} = 10 m/s.` })),
  misses: SPEEDS.filter((l) => speedOf(l) !== 10).map((l) => ({ label: l, say: l.replace(/s$/, " seconds").replace("m/", " meters in "), why: `${l.replace("/", " in ")} = ${speedOf(l)} m/s, not 10.` })),
});

/* ------------------------------------------------------------------ 8 */

const g8Energy = catRules({
  family: "g8-energy", subject: "science", grade: "8", standard: "PS.8.2", skill: "Renewable and nonrenewable resources",
  cats: {
    RENEWABLE: { name: "renewable", items: ["SOLAR", "WIND", "HYDROPOWER", "GEOTHERMAL", "BIOMASS", "TIDAL", "WAVE POWER", "BIOFUEL"] },
    NONRENEWABLE: { name: "nonrenewable", items: ["COAL", "CRUDE OIL", "PETROLEUM", "URANIUM", "PROPANE", "GASOLINE", "DIESEL", "KEROSENE"] },
  },
  targets: [
    { key: "RENEWABLE", text: "HOP ON RENEWABLE RESOURCES", say: "Hop only on renewable energy resources.", hint: "Renewable: replaced by nature in a human lifetime." },
    { key: "NONRENEWABLE", text: "HOP ON NONRENEWABLE RESOURCES", say: "Hop only on nonrenewable energy resources.", hint: "Nonrenewable: takes millions of years to form." },
  ],
});

const g8Matter = catRules({
  family: "g8-matter", subject: "science", grade: "8", standard: "PS.8.1", skill: "Elements, compounds, mixtures",
  cats: {
    ELEMENT: { name: "an element", items: ["IRON", "OXYGEN", "GOLD", "CARBON", "HELIUM", "NEON", "COPPER", "O₂", "Fe", "Au"] },
    COMPOUND: { name: "a compound", items: ["WATER", "H₂O", "CO₂", "NaCl", "TABLE SALT", "SUGAR", "RUST", "AMMONIA", "CH₄"] },
    MIXTURE: { name: "a mixture", items: ["AIR", "SALT WATER", "SOIL", "TRAIL MIX", "LEMONADE", "BRASS", "GRANITE", "STEEL"] },
  },
  targets: [
    { key: "ELEMENT", text: "HOP ON ELEMENTS", say: "Hop only on elements.", hint: "An element has only one kind of atom." },
    { key: "COMPOUND", text: "HOP ON COMPOUNDS", say: "Hop only on compounds.", hint: "A compound: 2+ elements chemically bonded." },
    { key: "MIXTURE", text: "HOP ON MIXTURES", say: "Hop only on mixtures.", hint: "A mixture: substances mixed but not bonded." },
  ],
});

const g8Disease = catRules({
  family: "g8-disease", subject: "science", grade: "8", standard: "LS.8.1", skill: "Viruses and bacteria",
  cats: {
    VIRUS: { name: "caused by a virus", items: ["FLU", "COVID-19", "MEASLES", "CHICKENPOX", "HIV", "MUMPS", "POLIO", "RABIES", "SMALLPOX"] },
    BACTERIA: {
      name: "caused by bacteria",
      items: [{ label: "STREP", say: "strep throat" }, "CHOLERA", "TETANUS", { label: "LYME", say: "Lyme disease" }, "PLAGUE", "BOTULISM", "TYPHOID", "DIPHTHERIA", "ANTHRAX"],
    },
  },
  targets: [
    { key: "VIRUS", text: "HOP ON VIRAL DISEASES", say: "Hop only on diseases caused by viruses.", hint: "Antibiotics do NOT work on viruses. Vaccines help." },
    { key: "BACTERIA", text: "HOP ON BACTERIAL DISEASES", say: "Hop only on diseases caused by bacteria.", hint: "Bacterial diseases can be treated with antibiotics." },
  ],
});

/* ------------------------------------------------------------------ 9: Earth & Environmental Science */

const eesGhg = catRules({
  family: "ees-ghg", subject: "science", grade: "9", standard: "ESS.EES.4", skill: "Greenhouse gases",
  cats: {
    GHG: { name: "a greenhouse gas", items: ["CO₂", "METHANE", "CH₄", "N₂O", "H₂O VAPOR", "OZONE", "CFCs", "SF₆"] },
    NOT: { name: "not a greenhouse gas", items: ["N₂", "O₂", "ARGON", "NEON", "HELIUM", "NITROGEN", "OXYGEN", "Ar"] },
  },
  targets: [{ key: "GHG", text: "HOP ON GREENHOUSE GASES", say: "Hop only on greenhouse gases.", hint: "Greenhouse gases absorb heat (infrared) in the air." }],
});

const eesSpheres = catRules({
  family: "ees-spheres", subject: "science", grade: "9", standard: "ESS.EES.3", skill: "Earth's spheres",
  cats: {
    HYDRO: { name: "part of the hydrosphere", items: ["OCEAN", "GLACIER", "LAKE", "RIVER", "AQUIFER", "ICE CAP", "SEA ICE", "POND", "SNOWPACK"] },
    GEO: { name: "part of the geosphere", items: ["MANTLE", "CRUST", "MAGMA", "VOLCANO", "MOUNTAIN", "CORE", "SEDIMENT", "BEDROCK", "GRANITE"] },
    BIO: { name: "part of the biosphere", items: ["TREES", "FISH", "CORAL", "FUNGI", "PLANKTON", "BIRDS"] },
    ATMO: { name: "part of the atmosphere", items: ["AIR", "WIND", "JET STREAM"] },
  },
  targets: [
    { key: "HYDRO", text: "HOP ON THE HYDROSPHERE", say: "Hop only on parts of the hydrosphere.", hint: "Hydrosphere: all of Earth's water, liquid or frozen.", standard: "ESS.EES.3" },
    { key: "GEO", text: "HOP ON THE GEOSPHERE", say: "Hop only on parts of the geosphere.", hint: "Geosphere: Earth's rock, from crust to core.", standard: "ESS.EES.2" },
  ],
});

const eesMinerals = catRules({
  family: "ees-minerals", subject: "science", grade: "9", standard: "ESS.EES.2", skill: "Minerals and rocks",
  cats: {
    MINERAL: { name: "a mineral", items: ["QUARTZ", "FELDSPAR", "MICA", "CALCITE", "HALITE", "GYPSUM", "TALC", "PYRITE", "OLIVINE", "GALENA"] },
    ROCK: { name: "a rock", items: ["GRANITE", "BASALT", "SHALE", "MARBLE", "SLATE", "GNEISS", "SANDSTONE", "OBSIDIAN", "LIMESTONE"] },
  },
  targets: [
    { key: "MINERAL", text: "HOP ON MINERALS", say: "Hop only on minerals.", hint: "A mineral: one natural solid with a crystal structure." },
    { key: "ROCK", text: "HOP ON ROCKS", say: "Hop only on rocks.", hint: "A rock is made of one or more minerals (or glass)." },
  ],
});

/* ------------------------------------------------------------------ 10: Biology */

/** DNA strand pairs "ATGC/TACG": a match when the second strand is the complement of the first. */
const DNA = ["ATGC/TACG", "GGTA/CCAT", "TTAG/AATC", "CATG/GTAC", "AGCT/TCGA", "GCGA/CGCT", "TACC/ATGG", "CTTA/GAAT", "AACG/TTGC", "GTCA/CAGT",
  "ATGC/TAGC", "GGTA/CCTA", "TTAG/AAUC", "CATG/CATG", "AGCT/AGCT", "GCGA/CGCA", "TACC/UTGG", "CTTA/GATT", "AACG/TTCG", "GTCA/GACT"];
const PAIR: Record<string, string> = { A: "T", T: "A", G: "C", C: "G" };
export const isComplement = (l: string) => {
  const [a, b] = l.split("/");
  return a.length === b.length && [...a].every((c, i) => PAIR[c] === b[i]);
};
const bioDna = listRule({
  id: "bio-dna", subject: "science", grade: "10", standard: "LS.Bio.5", skill: "DNA base pairing",
  text: "HOP ON MATCHING DNA STRANDS",
  say: "Hop only on DNA strands that pair correctly. A pairs with T, and G pairs with C.",
  hint: "A pairs with T, G pairs with C.",
  matches: DNA.filter(isComplement).map((l) => ({ label: l, say: [...l.replace("/", "")].join(" "), why: `${l}: every base pairs A–T or G–C.` })),
  misses: DNA.filter((l) => !isComplement(l)).map((l) => {
    const [a, b] = l.split("/");
    const i = [...a].findIndex((c, k) => PAIR[c] !== b[k]);
    const why = b[i] === "U" ? `U is found in RNA, not DNA. ${a[i]} pairs with ${PAIR[a[i]]}.` : `${a[i]} pairs with ${PAIR[a[i]]}, not ${b[i]}.`;
    return { label: l, say: [...l.replace("/", "")].join(" "), why };
  }),
});

const bioMacro = catRules({
  family: "bio-macro", subject: "science", grade: "10", standard: "LS.Bio.1", skill: "Biological molecules",
  cats: {
    CARB: { name: "a carbohydrate", items: ["GLUCOSE", "STARCH", "CELLULOSE", "SUCROSE", "GLYCOGEN", "FRUCTOSE", "LACTOSE", "CHITIN"] },
    PROTEIN: { name: "a protein", items: ["AMYLASE", "HEMOGLOBIN", "KERATIN", "COLLAGEN", "INSULIN", "ACTIN", "MYOSIN", "PEPSIN"] },
    LIPID: { name: "a lipid", items: ["FATS", "OILS", "WAXES", "STEROIDS"] },
    NUCLEIC: { name: "a nucleic acid", items: ["DNA", "RNA"] },
  },
  targets: [
    { key: "CARB", text: "HOP ON CARBOHYDRATES", say: "Hop only on carbohydrates.", hint: "Carbohydrates: sugars and starches (C, H, O)." },
    { key: "PROTEIN", text: "HOP ON PROTEINS", say: "Hop only on proteins.", hint: "Proteins are chains of amino acids; enzymes too." },
  ],
});

/* ------------------------------------------------------------------ 11: Chemistry */

export const METALS = new Set(["Li", "Na", "K", "Rb", "Cs", "Be", "Mg", "Ca", "Sr", "Ba", "Al", "Fe", "Cu", "Zn", "Ag", "Au"]);
const IONIC = ["NaCl", "KBr", "MgO", "CaCl₂", "LiF", "NaF", "KI", "CaO", "MgCl₂", "Na₂O", "K₂S"];
const COVALENT = ["H₂O", "CO₂", "CH₄", "NH₃", "O₂", "HCl", "C₆H₁₂O₆", "SO₂", "N₂", "CCl₄", "H₂"];
const chmBonds = catRules({
  family: "chm-bonds", subject: "science", grade: "11", standard: "PS.Chm.3", skill: "Ionic and covalent bonds",
  cats: {
    IONIC: { name: "ionic (metal + nonmetal)", items: IONIC },
    COVALENT: { name: "covalent (nonmetals sharing electrons)", items: COVALENT },
  },
  targets: [
    { key: "IONIC", text: "HOP ON IONIC COMPOUNDS", say: "Hop only on ionic compounds.", hint: "Ionic: a metal gives electrons to a nonmetal." },
    { key: "COVALENT", text: "HOP ON COVALENT SUBSTANCES", say: "Hop only on covalent substances.", hint: "Covalent: nonmetal atoms share electrons." },
  ],
});

const chmAcids = catRules({
  family: "chm-acids", subject: "science", grade: "11", standard: "PS.Chm.5", skill: "Acids and bases",
  cats: {
    ACID: { name: "an acid", items: ["HCl", "HBr", "HI", "HF", "HNO₃", "H₂SO₄", "H₃PO₄", "HClO₄", "CH₃COOH", "H₂CO₃"] },
    BASE: { name: "a base", items: ["NaOH", "KOH", "LiOH", "Ca(OH)₂", "Ba(OH)₂", "Mg(OH)₂", "NH₃", "Sr(OH)₂", "CsOH"] },
    NEUTRAL: { name: "neutral (neither)", items: ["NaCl", "KCl", "CH₄"] },
  },
  targets: [
    { key: "ACID", text: "HOP ON ACIDS", say: "Hop only on acids.", hint: "Acids give off H⁺ ions (pH below 7)." },
    { key: "BASE", text: "HOP ON BASES", say: "Hop only on bases.", hint: "Bases give OH⁻ or take H⁺ (pH above 7)." },
  ],
});

/** Symbol or name → periodic group (1-18). The checker uses this to verify the group rules. */
export const GROUPS: Record<string, number> = {
  Li: 1, Na: 1, K: 1, Rb: 1, Cs: 1, H: 1, LITHIUM: 1, SODIUM: 1, POTASSIUM: 1, CESIUM: 1, RUBIDIUM: 1,
  F: 17, Cl: 17, Br: 17, I: 17, FLUORINE: 17, CHLORINE: 17, BROMINE: 17, IODINE: 17,
  He: 18, Ne: 18, Ar: 18, Kr: 18, Xe: 18, HELIUM: 18, NEON: 18, ARGON: 18, KRYPTON: 18, XENON: 18, RADON: 18,
  Ca: 2, Mg: 2, O: 16, N: 15, Fe: 8, C: 14, S: 16, Al: 13,
};
const chmGroups = catRules({
  family: "chm-groups", subject: "science", grade: "11", standard: "PS.Chm.2", skill: "Periodic table groups",
  cats: {
    ALKALI: { name: "an alkali metal (group 1)", items: ["Li", "Na", "K", "Rb", "Cs", "LITHIUM", "SODIUM", "POTASSIUM", "CESIUM", "RUBIDIUM"] },
    HALOGEN: { name: "a halogen (group 17)", items: ["F", "Cl", "Br", "I", "FLUORINE", "CHLORINE", "BROMINE", "IODINE"] },
    NOBLE: { name: "a noble gas (group 18)", items: ["He", "Ne", "Ar", "Kr", "Xe", "HELIUM", "NEON", "ARGON", "KRYPTON", "XENON", "RADON"] },
    OTHER: {
      name: "in another group",
      items: [
        { label: "H", why: "H is in group 1, but hydrogen is a nonmetal, not an alkali metal." },
        { label: "Ca", why: "Ca (calcium) is an alkaline earth metal, group 2." },
        { label: "Mg", why: "Mg (magnesium) is in group 2." },
        { label: "O", why: "O (oxygen) is in group 16." },
        { label: "N", why: "N (nitrogen) is in group 15." },
        { label: "Fe", why: "Fe (iron) is a transition metal." },
        { label: "C", why: "C (carbon) is in group 14." },
        { label: "S", why: "S (sulfur) is in group 16." },
      ],
    },
  },
  targets: [
    { key: "ALKALI", text: "HOP ON ALKALI METALS", say: "Hop only on alkali metals.", hint: "Alkali metals: group 1 (not hydrogen)." },
    { key: "HALOGEN", text: "HOP ON HALOGENS", say: "Hop only on halogens.", hint: "Halogens: group 17." },
    { key: "NOBLE", text: "HOP ON NOBLE GASES", say: "Hop only on noble gases.", hint: "Noble gases: group 18, very unreactive." },
  ],
});

/* ------------------------------------------------------------------ 12: Physics */

const phyVectors = catRules({
  family: "phy-vectors", subject: "science", grade: "12", standard: "PS.Phy.1", skill: "Vectors and scalars",
  cats: {
    VECTOR: { name: "a vector (size and direction)", items: ["VELOCITY", "FORCE", "MOMENTUM", "WEIGHT", "IMPULSE", "TORQUE", "5 N LEFT", "20 m/s E", "3 m/s² UP"] },
    SCALAR: { name: "a scalar (size only)", items: ["SPEED", "MASS", "TIME", "ENERGY", "DISTANCE", "WORK", "POWER", "VOLUME", "20 m/s", "5 kg"] },
  },
  targets: [
    { key: "VECTOR", text: "HOP ON VECTORS", say: "Hop only on vector quantities.", hint: "A vector has a size AND a direction." },
    { key: "SCALAR", text: "HOP ON SCALARS", say: "Hop only on scalar quantities.", hint: "A scalar has a size only, no direction." },
  ],
});

const phyUnits = catRules({
  family: "phy-units", subject: "science", grade: "12", standard: "PS.Phy.6", skill: "Energy units",
  cats: {
    ENERGY: { name: "a unit of energy", items: ["JOULE", "kWh", "CALORIE", "eV", "BTU", "kJ", "kcal", "MEGAJOULE"] },
    OTHER: {
      name: "not an energy unit",
      items: [
        { label: "WATT", why: "A WATT measures power (joules per second)." },
        { label: "NEWTON", why: "A NEWTON measures force." },
        { label: "PASCAL", why: "A PASCAL measures pressure." },
        { label: "AMPERE", why: "An AMPERE measures electric current." },
        { label: "VOLT", why: "A VOLT measures electric potential difference." },
        { label: "OHM", why: "An OHM measures resistance." },
        { label: "HERTZ", why: "A HERTZ measures frequency." },
        { label: "kg", why: "kg (kilogram) measures mass." },
        { label: "m/s", why: "m/s measures speed or velocity." },
      ],
    },
  },
  targets: [{ key: "ENERGY", text: "HOP ON UNITS OF ENERGY", say: "Hop only on units of energy.", hint: "Energy units: joule, calorie, kilowatt-hour…" }],
});

const OHMS = ["12 V, 3 A", "8 V, 2 A", "20 V, 5 A", "4 V, 1 A", "2 V, 0.5 A", "36 V, 9 A", "16 V, 4 A", "24 V, 6 A", "6 V, 1.5 A",
  "12 V, 4 A", "8 V, 4 A", "20 V, 4 A", "4 V, 2 A", "9 V, 3 A", "10 V, 2 A", "6 V, 3 A", "16 V, 2 A", "24 V, 3 A", "3 V, 1 A"];
export const resistance = (l: string) => {
  const [v, i] = l.split(",").map((p) => parseFloat(p));
  return v / i;
};
const phyOhm = listRule({
  id: "phy-ohm4", subject: "science", grade: "12", standard: "PS.Phy.8", skill: "Ohm's law",
  text: "HOP ON CIRCUITS WITH R = 4 Ω",
  say: "Hop only on circuits with a resistance of 4 ohms. R equals V divided by I.",
  hint: "Ohm's law: R = V ÷ I.",
  matches: OHMS.filter((l) => resistance(l) === 4).map((l) => ({ label: l, say: l.replace("V", "volts").replace("A", "amps"), why: `R = ${l.replace(",", " ÷")} = 4 Ω.` })),
  misses: OHMS.filter((l) => resistance(l) !== 4).map((l) => ({ label: l, say: l.replace("V", "volts").replace("A", "amps"), why: `R = ${l.replace(",", " ÷")} = ${resistance(l)} Ω, not 4.` })),
});

export const SCIENCE_RULES: Rule[] = [
  ...kLiving, ...kAnimals, ...kHardSoft,
  ...g1Parts, ...g1SkyEarth,
  ...g2States, ...g2Young,
  ...g3States, ...g3Planets, ...g3Bones,
  ...g4Conduct, ...g4Rocks,
  ...g5Changes, ...g5Roles, ...g5Digest,
  ...g6Waves, ...g6Biotic,
  ...g7Cells, ...g7Genes, g7Speed,
  ...g8Energy, ...g8Matter, ...g8Disease,
  ...eesGhg, ...eesSpheres, ...eesMinerals,
  bioDna, ...bioMacro,
  ...chmBonds, ...chmAcids, ...chmGroups,
  ...phyVectors, ...phyUnits, phyOhm,
];
