import type { Question } from "./types";

// Grade 6 Science — NC Standard Course of Study for Science (adopted 2023, implemented 2024-25).
// Codes follow the PS.6.x / ESS.6.x / LS.6.x structure. Confirm against the current
// WCPSS grade 6 pacing guide when adding items; see README "Question bank".
export const science6: Question[] = [
  // ---- PS.6.1 Matter: atoms, particles, thermal energy & phase change ----
  {
    id: "s-ps1-1", subject: "science", standard: "PS.6.1", skill: "Atoms, particles & phase changes",
    prompt: "What is an element made of?",
    choices: ["Only one kind of atom", "Two or more kinds of atoms bonded together", "Cells", "A mixture of compounds"], answer: 0,
    explanation: "Each element (like oxygen or gold) is made of only one type of atom.",
  },
  {
    id: "s-ps1-2", subject: "science", standard: "PS.6.1", skill: "Atoms, particles & phase changes",
    prompt: "When a substance is heated, what happens to its particles?",
    choices: ["They move faster and spread apart", "They slow down", "They get bigger", "They stop moving"], answer: 0,
    explanation: "Adding thermal energy increases particle motion; faster particles spread farther apart.",
  },
  {
    id: "s-ps1-3", subject: "science", standard: "PS.6.1", skill: "Atoms, particles & phase changes",
    prompt: "Water droplets form on the outside of a cold glass. What is this change called?",
    choices: ["Condensation", "Evaporation", "Melting", "Sublimation"], answer: 0, quick: true,
    explanation: "Water vapor in the air loses energy on the cold glass and becomes liquid: condensation.",
  },
  {
    id: "s-ps1-4", subject: "science", standard: "PS.6.1", skill: "Atoms, particles & phase changes",
    prompt: "In which state of matter do particles vibrate in fixed positions?",
    choices: ["Solid", "Liquid", "Gas", "Plasma"], answer: 0, quick: true,
    explanation: "Solid particles are tightly packed and only vibrate in place.",
  },
  {
    id: "s-ps1-5", subject: "science", standard: "PS.6.1", skill: "Atoms, particles & phase changes",
    prompt: "Dry ice changes directly from a solid to a gas. What is this called?",
    choices: ["Sublimation", "Condensation", "Freezing", "Deposition"], answer: 0, quick: true,
    explanation: "Skipping the liquid state, solid → gas, is sublimation.",
  },
  {
    id: "s-ps1-6", subject: "science", standard: "PS.6.1", skill: "Atoms, particles & phase changes",
    prompt: "Which of these is a compound?",
    choices: ["Water (H₂O)", "Oxygen gas (O₂)", "Gold (Au)", "Helium (He)"], answer: 0, quick: true,
    explanation: "A compound has two or more different elements bonded. H₂O has hydrogen and oxygen. O₂ is only oxygen.",
  },
  {
    id: "s-ps1-7", subject: "science", standard: "PS.6.1", skill: "Atoms, particles & phase changes",
    prompt: "Ice water stays at 0 °C while the ice melts, even though heat is added. Where does the energy go?",
    choices: [
      "Into breaking the particles out of their fixed arrangement",
      "Into making the particles smaller",
      "It disappears",
      "Into cooling the water",
    ], answer: 0,
    explanation: "During a phase change, added energy changes the arrangement of particles instead of raising the temperature.",
  },

  // ---- PS.6.2 Energy transfer: conduction, convection, radiation ----
  {
    id: "s-ps2-1", subject: "science", standard: "PS.6.2", skill: "Thermal energy transfer",
    prompt: "A metal spoon in hot soup gets hot. How was the energy transferred?",
    choices: ["Conduction", "Convection", "Radiation", "Reflection"], answer: 0, quick: true,
    explanation: "Direct contact between particles passes energy along the spoon: conduction.",
  },
  {
    id: "s-ps2-2", subject: "science", standard: "PS.6.2", skill: "Thermal energy transfer",
    prompt: "Warm air rises and cool air sinks, making a loop in a room. What is this?",
    choices: ["Convection", "Conduction", "Radiation", "Insulation"], answer: 0, quick: true,
    explanation: "Moving currents in a fluid (liquid or gas) carry energy: convection.",
  },
  {
    id: "s-ps2-3", subject: "science", standard: "PS.6.2", skill: "Thermal energy transfer",
    prompt: "Energy from the Sun reaches Earth through empty space. How?",
    choices: ["Radiation", "Conduction", "Convection", "Friction"], answer: 0, quick: true,
    explanation: "Radiation (electromagnetic waves) is the only transfer that works without matter.",
  },
  {
    id: "s-ps2-4", subject: "science", standard: "PS.6.2", skill: "Thermal energy transfer",
    prompt: "Which material is the best thermal insulator?",
    choices: ["Foam", "Copper", "Aluminum", "Iron"], answer: 0, quick: true,
    explanation: "Foam traps air and transfers energy slowly. Metals are good conductors.",
  },
  {
    id: "s-ps2-5", subject: "science", standard: "PS.6.2", skill: "Thermal energy transfer",
    prompt: "Thermal energy naturally flows in which direction?",
    choices: ["From warmer objects to cooler objects", "From cooler objects to warmer objects", "Only upward", "Only through metals"], answer: 0,
    explanation: "Heat always moves from higher temperature to lower temperature until they are equal.",
  },

  // ---- ESS.6.1 Earth/Moon/Sun system ----
  {
    id: "s-ess1-1", subject: "science", standard: "ESS.6.1", skill: "Earth–Moon–Sun system",
    prompt: "What causes Earth to have seasons?",
    choices: [
      "The tilt of Earth's axis as it orbits the Sun",
      "Earth's distance from the Sun changing",
      "The Moon blocking sunlight",
      "The Sun getting hotter and cooler",
    ], answer: 0,
    explanation: "Earth's 23.5° tilt means each hemisphere gets more direct sunlight during part of the year.",
  },
  {
    id: "s-ess1-2", subject: "science", standard: "ESS.6.1", skill: "Earth–Moon–Sun system",
    prompt: "About how long does the Moon take to go through all of its phases?",
    choices: ["About 29.5 days", "24 hours", "365 days", "7 days"], answer: 0, quick: true,
    explanation: "One full cycle, new moon to new moon, takes about 29.5 days — roughly a month.",
  },
  {
    id: "s-ess1-3", subject: "science", standard: "ESS.6.1", skill: "Earth–Moon–Sun system",
    prompt: "What mainly causes ocean tides on Earth?",
    choices: ["The Moon's gravity", "Wind", "Earthquakes", "Earth's magnetic field"], answer: 0, quick: true,
    explanation: "The Moon's gravitational pull creates bulges of water on Earth.",
  },
  {
    id: "s-ess1-4", subject: "science", standard: "ESS.6.1", skill: "Earth–Moon–Sun system",
    prompt: "Why do we always see the same side of the Moon from Earth?",
    choices: [
      "It rotates once in the same time it takes to orbit Earth",
      "It does not rotate at all",
      "Earth blocks the other side",
      "The other side is always dark",
    ], answer: 0,
    explanation: "The Moon's rotation and revolution both take about 27 days, so one side always faces us.",
  },
  {
    id: "s-ess1-5", subject: "science", standard: "ESS.6.1", skill: "Earth–Moon–Sun system",
    prompt: "During a lunar eclipse, which body is in the middle?",
    choices: ["Earth", "Moon", "Sun", "Mars"], answer: 0, quick: true,
    explanation: "Sun → Earth → Moon: Earth's shadow falls on the Moon.",
  },
  {
    id: "s-ess1-6", subject: "science", standard: "ESS.6.1", skill: "Earth–Moon–Sun system",
    prompt: "What force keeps the planets in orbit around the Sun?",
    choices: ["Gravity", "Magnetism", "Friction", "Wind"], answer: 0, quick: true,
    explanation: "The Sun's gravity constantly pulls planets inward while they move forward, making an orbit.",
  },
  {
    id: "s-ess1-7", subject: "science", standard: "ESS.6.1", skill: "Earth–Moon–Sun system",
    prompt: "One full rotation of Earth on its axis takes about how long?",
    choices: ["24 hours", "1 month", "1 year", "12 hours"], answer: 0, quick: true,
    explanation: "One rotation = one day (about 24 hours). One revolution around the Sun = one year.",
  },
  {
    id: "s-ess1-8", subject: "science", standard: "ESS.6.1", skill: "Earth–Moon–Sun system",
    prompt: "Why does the Moon appear to shine at night?",
    choices: ["It reflects sunlight", "It makes its own light", "It reflects Earth's city lights", "It is made of glowing rock"], answer: 0, quick: true,
    explanation: "The Moon produces no light; we see sunlight bouncing off its surface.",
  },

  // ---- ESS.6.2 Earth's structure & plate tectonics ----
  {
    id: "s-ess2-1", subject: "science", standard: "ESS.6.2", skill: "Earth's layers & plate tectonics",
    prompt: "What is Earth's thin, rocky outer layer called?",
    choices: ["Crust", "Mantle", "Outer core", "Inner core"], answer: 0, quick: true,
    explanation: "The crust is the outermost solid layer — where we live.",
  },
  {
    id: "s-ess2-2", subject: "science", standard: "ESS.6.2", skill: "Earth's layers & plate tectonics",
    prompt: "Which layer of Earth is liquid metal?",
    choices: ["Outer core", "Inner core", "Crust", "Lithosphere"], answer: 0, quick: true,
    explanation: "The outer core is liquid iron and nickel. The inner core is solid because of extreme pressure.",
  },
  {
    id: "s-ess2-3", subject: "science", standard: "ESS.6.2", skill: "Earth's layers & plate tectonics",
    prompt: "Where do most earthquakes and volcanoes happen?",
    choices: ["Along tectonic plate boundaries", "In the middle of plates", "Only near the equator", "Only in the ocean"], answer: 0,
    explanation: "Plates colliding, pulling apart, or sliding past each other cause most quakes and volcanoes.",
  },
  {
    id: "s-ess2-4", subject: "science", standard: "ESS.6.2", skill: "Rock cycle",
    prompt: "Rock that forms when magma or lava cools is called…",
    choices: ["Igneous", "Sedimentary", "Metamorphic", "Fossil"], answer: 0, quick: true,
    explanation: "Igneous rock (\"fire-formed\") comes from cooled molten rock.",
  },
  {
    id: "s-ess2-5", subject: "science", standard: "ESS.6.2", skill: "Rock cycle",
    prompt: "Heat and pressure deep underground change a rock into…",
    choices: ["Metamorphic rock", "Igneous rock", "Sedimentary rock", "Magma"], answer: 0, quick: true,
    explanation: "Meta = change, morph = form. Heat and pressure transform existing rock.",
  },
  {
    id: "s-ess2-6", subject: "science", standard: "ESS.6.2", skill: "Rock cycle",
    prompt: "Layers of sediment pressed and cemented together form…",
    choices: ["Sedimentary rock", "Igneous rock", "Metamorphic rock", "Lava"], answer: 0, quick: true,
    explanation: "Compaction and cementation of sediments makes sedimentary rock (often with layers and fossils).",
  },

  // ---- ESS.6.3 Lithosphere & humans ----
  {
    id: "s-ess3-1", subject: "science", standard: "ESS.6.3", skill: "Lithosphere & human impact",
    prompt: "Which farming practice helps reduce soil erosion?",
    choices: ["Planting cover crops", "Removing all plants", "Letting animals overgraze", "Plowing straight up and down hills"], answer: 0,
    explanation: "Plant roots hold soil in place and leaves protect it from rain and wind.",
  },
  {
    id: "s-ess3-2", subject: "science", standard: "ESS.6.3", skill: "Lithosphere & human impact",
    prompt: "Which is a nonrenewable resource taken from the lithosphere?",
    choices: ["Coal", "Wind", "Sunlight", "Trees"], answer: 0, quick: true,
    explanation: "Coal takes millions of years to form, so we use it faster than it is replaced.",
  },

  // ---- LS.6.1 Plant structures & processes ----
  {
    id: "s-ls1-1", subject: "science", standard: "LS.6.1", skill: "Plant structures & processes",
    prompt: "In which cell part does photosynthesis happen?",
    choices: ["Chloroplast", "Nucleus", "Cell wall", "Vacuole"], answer: 0, quick: true,
    explanation: "Chloroplasts contain chlorophyll, which captures light energy.",
  },
  {
    id: "s-ls1-2", subject: "science", standard: "LS.6.1", skill: "Plant structures & processes",
    prompt: "Which gas do plants take in to use for photosynthesis?",
    choices: ["Carbon dioxide", "Oxygen", "Nitrogen", "Helium"], answer: 0, quick: true,
    explanation: "Carbon dioxide + water + light energy → glucose + oxygen.",
  },
  {
    id: "s-ls1-3", subject: "science", standard: "LS.6.1", skill: "Plant structures & processes",
    prompt: "A houseplant's stem bends toward a sunny window. What is this response?",
    choices: ["Phototropism", "Gravitropism", "Photosynthesis", "Hibernation"], answer: 0, quick: true,
    explanation: "Photo = light, tropism = growth response. Plants grow toward light.",
  },
  {
    id: "s-ls1-4", subject: "science", standard: "LS.6.1", skill: "Plant structures & processes",
    prompt: "Which plant tissue carries water from the roots up to the leaves?",
    choices: ["Xylem", "Phloem", "Stomata", "Pollen"], answer: 0, quick: true,
    explanation: "Xylem moves water up. Phloem moves sugars around the plant.",
  },
  {
    id: "s-ls1-5", subject: "science", standard: "LS.6.1", skill: "Plant structures & processes",
    prompt: "What are the products of photosynthesis?",
    choices: ["Glucose and oxygen", "Carbon dioxide and water", "Oxygen and nitrogen", "Soil and water"], answer: 0,
    explanation: "Plants make glucose (food) and release oxygen as a product.",
  },
  {
    id: "s-ls1-6", subject: "science", standard: "LS.6.1", skill: "Plant structures & processes",
    prompt: "Leaves exchange gases through tiny openings called…",
    choices: ["Stomata", "Roots", "Xylem", "Seeds"], answer: 0, quick: true,
    explanation: "Stomata let carbon dioxide in and oxygen and water vapor out.",
  },

  // ---- LS.6.2 Ecosystems: energy flow & biomes ----
  {
    id: "s-ls2-1", subject: "science", standard: "LS.6.2", skill: "Ecosystems & energy flow",
    prompt: "In the food chain grass → rabbit → fox, what is the rabbit?",
    choices: ["Primary consumer", "Producer", "Decomposer", "Secondary consumer"], answer: 0, quick: true,
    explanation: "The rabbit eats the producer (grass), so it is a primary consumer.",
  },
  {
    id: "s-ls2-2", subject: "science", standard: "LS.6.2", skill: "Ecosystems & energy flow",
    prompt: "Where does almost all the energy in an ecosystem originally come from?",
    choices: ["The Sun", "The soil", "Water", "Decomposers"], answer: 0, quick: true,
    explanation: "Producers capture sunlight; that energy passes up the food web.",
  },
  {
    id: "s-ls2-3", subject: "science", standard: "LS.6.2", skill: "Ecosystems & energy flow",
    prompt: "Organisms that break down dead plants and animals are called…",
    choices: ["Decomposers", "Producers", "Herbivores", "Predators"], answer: 0, quick: true,
    explanation: "Decomposers (bacteria, fungi) return nutrients to the soil.",
  },
  {
    id: "s-ls2-4", subject: "science", standard: "LS.6.2", skill: "Ecosystems & energy flow",
    prompt: "Which of these is an abiotic factor?",
    choices: ["Temperature", "Mushrooms", "Bacteria", "Grass"], answer: 0, quick: true,
    explanation: "Abiotic = non-living. Temperature, water, sunlight, and soil are abiotic.",
  },
  {
    id: "s-ls2-5", subject: "science", standard: "LS.6.2", skill: "Ecosystems & energy flow",
    prompt: "Only about 10% of energy passes to the next level of a food chain. Where does most of the rest go?",
    choices: [
      "It is used for life processes and lost as heat",
      "It is stored in the soil",
      "It goes back to the Sun",
      "It turns into water",
    ], answer: 0,
    explanation: "Organisms use most energy to move, grow, and stay warm; much is released as heat.",
  },
  {
    id: "s-ls2-6", subject: "science", standard: "LS.6.2", skill: "Biomes & adaptations",
    prompt: "Which biome gets very little rain and has extreme temperatures?",
    choices: ["Desert", "Rainforest", "Temperate forest", "Marine"], answer: 0, quick: true,
    explanation: "Deserts get less than about 25 cm of rain a year.",
  },
  {
    id: "s-ls2-7", subject: "science", standard: "LS.6.2", skill: "Biomes & adaptations",
    prompt: "A cactus has a thick, waxy stem. How does this help it survive?",
    choices: ["It stores water and reduces water loss", "It attracts more rain", "It helps it grow in shade", "It keeps insects warm"], answer: 0,
    explanation: "In dry biomes, storing water and preventing evaporation is key to survival.",
  },
];
