/*
 * Plants vs Undead question bank: plant parts and photosynthesis, K–12.
 *
 * - "Seed card" questions (quick: prompt ≤ 100 chars, choices ≤ 14 chars) unlock a defender the
 *   first time it is picked each level. Every defender has at least two per grade band.
 * - "Checkpoint" questions (longer, sometimes with a passage) come between waves.
 * Every item is authored with the correct choice first (answer 0); decks shuffle at runtime.
 * Standards are attached per grade from the item's topic (see standardFor), in the forms the
 * arcade kit's science banks use (NC Standard Course of Study for Science, 2023).
 */
import type { Grade } from "@/kit/types";
import { PHOTO_EQUATION as EQ, RESP_EQUATION as RESP, type Band, type PlantKind } from "./parts";

export type Topic =
  | "parts" // plant parts and their jobs
  | "soil" // roots, water and minerals from soil
  | "needs" // what plants need
  | "food" // photosynthesis: making food from light, inputs and outputs
  | "cycle" // seeds, flowers, pollination, fruit, dispersal, life cycle
  | "water" // water transport, transpiration, xylem and phloem
  | "cells" // chloroplasts, chlorophyll, organelles
  | "chem" // the chemical equation, atoms
  | "energy" // energy flow and food webs
  | "respond" // tropisms and responses
  | "rate" // limiting factors and rate of photosynthesis
  | "matter"; // matter cycling (carbon, oxygen), photosynthesis vs respiration

export interface BankItem {
  id: string;
  band: Band;
  /** The defender it unlocks (seed-card questions); null for checkpoint-only items. */
  kind: PlantKind | null;
  topic: Topic;
  prompt: string;
  choices: [string, string, string, string];
  /** Always 0 as authored. */
  answer: 0;
  explanation: string;
  quick: boolean;
  passage?: string;
}

export const SKILL: Record<Topic, string> = {
  parts: "Plant parts and their jobs",
  soil: "Roots, water and soil",
  needs: "What plants need",
  food: "Photosynthesis: making food",
  cycle: "Seeds, flowers and life cycles",
  water: "Moving water and sugar",
  cells: "Chloroplasts and cells",
  chem: "Photosynthesis equation",
  energy: "Energy flow in food webs",
  respond: "Plant responses (tropisms)",
  rate: "Rate and limiting factors",
  matter: "Photosynthesis and respiration",
};

/**
 * NC standard code for a topic at a grade, matching the objective-level codes the kit's science
 * banks use for plants (see README "codes to verify").
 */
export function standardFor(topic: Topic, grade: Grade): string {
  switch (grade) {
    case "K":
      return "LS.K.1.1";
    case "1":
    case "2": // grade 2 has no plant standard: review of grade 1
      return "LS.1.1.1";
    case "3":
      if (topic === "cycle") return "LS.3.2.2";
      if (topic === "soil") return "LS.3.3.2";
      if (topic === "needs") return "LS.3.3.1";
      return "LS.3.2.1";
    case "4":
      return topic === "respond" ? "LS.4.1.2" : "LS.4.1.1";
    case "5":
      if (topic === "water") return "ESS.5.1.4";
      if (topic === "food" || topic === "energy" || topic === "matter") return "LS.5.2.2";
      return "LS.5.2";
    case "6":
      if (topic === "energy") return "LS.6.2.1";
      if (topic === "parts" || topic === "respond" || topic === "cycle" || topic === "soil") return "LS.6.1";
      return "LS.6.1.1";
    case "7":
      if (topic === "cells" || topic === "matter") return "LS.7.1.2";
      if (topic === "cycle") return "LS.7.2";
      return "LS.6.1.1";
    case "8":
      if (topic === "energy" || topic === "matter") return "LS.8.2";
      if (topic === "chem") return "PS.8.1";
      return "LS.6.1.1";
    default: {
      // 9–12: Biology standards (the content is biology at every high-school grade)
      if (grade === "11" && topic === "chem") return "PS.Chm.4";
      if (topic === "cells") return "LS.Bio.1.3";
      if (topic === "energy" || topic === "matter") return "LS.Bio.4.2";
      return "LS.Bio.3.2";
    }
  }
}

type Spec = [kind: PlantKind | null, topic: Topic, prompt: string, choices: [string, string, string, string], explanation: string, passage?: string];

function build(band: Band, tag: string, quick: boolean, specs: Spec[]): BankItem[] {
  return specs.map(([kind, topic, prompt, choices, explanation, passage], i) => ({
    id: `pvu-b${band}-${tag}${String(i + 1).padStart(2, "0")}`,
    band,
    kind,
    topic,
    prompt,
    choices,
    answer: 0 as const,
    explanation,
    quick,
    ...(passage ? { passage } : {}),
  }));
}

/* ======================================================================= K–2 */

const B0_CARD: Spec[] = [
  ["sunleaf", "food", "Which plant part makes food from sunlight?", ["Leaves", "Roots", "Seeds", "Petals"], "Leaves catch sunlight and use it to make food (sugar) for the whole plant."],
  ["sunleaf", "needs", "What do leaves need to make plant food?", ["Sunlight", "Candy", "Rocks", "Toys"], "Leaves use sunlight, water and air to make food. No light, no food!"],
  ["rootknot", "parts", "Which part holds a plant tight in the soil?", ["Roots", "Flower", "Leaf", "Fruit"], "Roots grow down into the soil. They hold the plant in place and soak up water."],
  ["rootknot", "soil", "Roots soak up ___ from the soil.", ["Water", "Sunlight", "Seeds", "Feathers"], "Roots drink water from the soil, like a sponge, and send it up to the rest of the plant."],
  ["slinger", "cycle", "What can grow into a new plant?", ["A seed", "A rock", "A spoon", "A shell"], "A seed has a tiny baby plant inside. With water and warmth it sprouts and grows."],
  ["slinger", "needs", "What does a seed need to start growing?", ["Water", "Paint", "Ice cream", "Plastic"], "Seeds need water (and warmth) to sprout. Then the little plant needs sunlight too."],
  ["thorn", "parts", "Which part holds a plant up tall?", ["Stem", "Root", "Seed", "Petal"], "The stem holds the plant up so its leaves can reach the sunlight."],
  ["thorn", "parts", "Some stems have sharp ___ to keep animals away.", ["Thorns", "Feathers", "Wheels", "Shells"], "Roses and other plants have sharp points on their stems so animals do not eat them."],
  ["stem", "water", "Water moves from the roots up through the...", ["Stem", "Flower", "Seed", "Sky"], "The stem is like a straw. It carries water from the roots up to the leaves."],
  ["stem", "water", "A plant's stem is a bit like a...", ["Straw", "Hat", "Rock", "Shoe"], "Water travels up the stem like juice up a straw, all the way to the leaves."],
  ["pollen", "cycle", "Which plant part makes seeds?", ["Flower", "Root", "Stem", "Leaf"], "Flowers make seeds. Bees help by carrying pollen from flower to flower."],
  ["pollen", "cycle", "Bees carry yellow ___ from flower to flower.", ["Pollen", "Water", "Leaves", "Rocks"], "Pollen is a yellow dust. When bees move it between flowers, the flowers can make seeds."],
  ["berry", "cycle", "A fruit holds the plant's...", ["Seeds", "Roots", "Stems", "Rocks"], "Fruits hold seeds. Think of the seeds inside an apple or a watermelon!"],
  ["berry", "parts", "Which one is a fruit with seeds inside?", ["Apple", "Carrot", "Lettuce", "Potato"], "An apple is a fruit with seeds. A carrot is a root, lettuce is leaves and a potato is a stem part."],
  ["frond", "cells", "What color are most leaves?", ["Green", "Purple", "Black", "Blue"], "Most leaves are green. The green stuff in leaves catches sunlight to make food."],
  ["frond", "parts", "Leaves grow out of the plant's...", ["Stem", "Seeds", "Petals", "Fruit"], "Leaves grow on the stem. The stem holds them up to the light."],
  ["stoma", "needs", "Plants take in air through tiny holes in their...", ["Leaves", "Petals", "Seeds", "Fruit"], "Leaves have tiny holes, too small to see, that let air in and out."],
  ["stoma", "needs", "Which of these do plants need?", ["Air", "Toys", "Paint", "Shoes"], "Plants need air, water, sunlight and space to grow."],
  ["chloro", "food", "Plants make their own...", ["Food", "Shoes", "Rain", "Rocks"], "Plants are special: they make their own food using sunlight, water and air."],
  ["chloro", "food", "Which living thing makes its own food?", ["A plant", "A dog", "A person", "A fish"], "Plants make their own food from sunlight. Animals and people have to eat food."],
];

const B0_CHECK: Spec[] = [
  [null, "needs", "A bean plant was kept in a dark closet for two weeks. What will happen to it?", ["It gets pale and weak", "It grows faster", "It turns into a rock", "It grows candy"], "Plants need light to make food. In the dark a plant cannot make food, so it gets pale and weak."],
  [null, "cycle", "What comes FIRST in a bean plant's life?", ["A seed", "A flower", "A big plant", "A bean pod"], "A bean plant starts as a seed. It sprouts, grows, makes flowers, and then makes new seeds."],
  [null, "needs", "Which list shows what plants need?", ["Sun, water, air, space", "Toys, milk, rocks, sand", "Candy, juice, TV, hats", "Snow, ice, wind, dark"], "Plants need sunlight, water, air and space to grow."],
  [null, "parts", "Which part of a carrot plant do we eat?", ["The root", "The flower", "The seed", "The fruit"], "A carrot is a big root. It stores food for the plant under the ground."],
  [null, "parts", "Which part of a lettuce plant do we eat?", ["The leaves", "The roots", "The seeds", "The flower"], "Lettuce is leaves. Leaves are where the plant makes its food."],
  [null, "food", "Why do plants need sunlight?", ["To make food", "To stay cold", "To fall asleep", "To make noise"], "Plants use the energy in sunlight to make their own food (a kind of sugar)."],
  [null, "food", "Plants give off a gas that people and animals breathe in. What is it?", ["Oxygen", "Smoke", "Steam", "Helium"], "When plants make food they let out oxygen. We breathe in oxygen to live."],
];

/* ======================================================================= 3–5 */

const B1_CARD: Spec[] = [
  ["sunleaf", "food", "Leaves use light energy to make...", ["Sugar", "Soil", "Minerals", "Rocks"], "In photosynthesis, leaves use light energy, water and carbon dioxide to make sugar (glucose)."],
  ["sunleaf", "food", "Photosynthesis happens mostly in the...", ["Leaves", "Roots", "Flowers", "Seeds"], "Leaves are flat and green to catch lots of light, so most photosynthesis happens there."],
  ["rootknot", "soil", "Roots take in water and ___ from the soil.", ["Minerals", "Sunlight", "Sugar", "Pollen"], "Roots absorb water and minerals (nutrients) from the soil. Plants make their own sugar in the leaves."],
  ["rootknot", "parts", "Besides taking in water, roots also...", ["Anchor plant", "Make pollen", "Catch light", "Make seeds"], "Roots anchor (hold) the plant in the ground so wind and rain do not knock it over."],
  ["slinger", "cycle", "A seed sprouting into a new plant is called...", ["Germination", "Pollination", "Evaporation", "Erosion"], "Germination is when a seed sprouts. The root grows down first, then the shoot grows up."],
  ["slinger", "cycle", "Seeds carried away by wind, water or animals is called seed...", ["Dispersal", "Erosion", "Melting", "Digestion"], "Seed dispersal spreads seeds to new places, so young plants do not crowd their parent."],
  ["thorn", "parts", "Which part supports the leaves and holds them up to the light?", ["Stem", "Root", "Petal", "Seed"], "The stem supports the plant and holds leaves up toward the sunlight."],
  ["thorn", "parts", "Thorns on a stem mostly give a plant...", ["Protection", "Making food", "Taking water", "Making seeds"], "Sharp thorns protect a plant from animals that would eat it."],
  ["stem", "water", "The stem carries water from the roots to the...", ["Leaves", "Soil", "Air", "Seeds"], "Tubes in the stem carry water up from the roots to the leaves, where food is made."],
  ["stem", "water", "Sugar made in the leaves travels through the ___ to other parts.", ["Stem", "Petals", "Pollen", "Soil"], "The stem has tubes that carry sugar from the leaves to the roots, flowers and fruits."],
  ["pollen", "cycle", "Moving pollen from flower to flower is called...", ["Pollination", "Germination", "Evaporation", "Erosion"], "Pollination happens when pollen moves to another flower's sticky part. Then seeds can form."],
  ["pollen", "cycle", "Bright petals and sweet nectar attract...", ["Pollinators", "Rocks", "Clouds", "Roots"], "Bees, butterflies and birds visit for nectar and carry pollen as they go."],
  ["berry", "cycle", "After pollination, part of the flower grows into a...", ["Fruit", "Root", "Leaf", "Stem"], "After pollination, the flower's ovary grows into a fruit with the seeds inside."],
  ["berry", "cycle", "Animals eat sweet fruits. This helps the plant...", ["Spread seeds", "Catch light", "Hold soil", "Grow roots"], "Animals eat fruit and drop the seeds far away, which spreads the plant to new places."],
  ["frond", "matter", "A plant gets most of its mass (weight) from...", ["Air and water", "Soil", "Sunlight", "Fertilizer"], "Most of a plant's mass comes from carbon dioxide in the air and from water. Soil adds only a little."],
  ["frond", "food", "Which gas do leaves take in to make sugar?", ["Carbon dioxide", "Oxygen", "Helium", "Nitrogen"], "Leaves take in carbon dioxide from the air. Its carbon becomes part of the sugar."],
  ["stoma", "food", "Leaves give off which gas during photosynthesis?", ["Oxygen", "Carbon dioxide", "Helium", "Smoke"], "Photosynthesis releases oxygen into the air. Animals and people breathe it in."],
  ["stoma", "water", "Water vapor leaving a plant's leaves is called...", ["Transpiration", "Condensation", "Erosion", "Germination"], "Transpiration is water vapor escaping from tiny holes in leaves. It is part of the water cycle."],
  ["chloro", "energy", "The energy stored in food first came from the...", ["Sun", "Soil", "Water", "Wind"], "Plants capture the sun's energy and store it in sugar. Animals get that energy by eating plants."],
  ["chloro", "energy", "Plants are called producers because they...", ["Make own food", "Eat animals", "Decompose", "Hunt insects"], "Producers make their own food from sunlight. Consumers eat other living things."],
];

const B1_CHECK: Spec[] = [
  [null, "needs", "What did the student change on purpose (the variable being tested)?", ["The amount of light", "The amount of water", "The kind of plant", "The size of the pot"], "Only the light was different. Everything else stayed the same, so the test is fair.", "Two bean plants got the same soil, the same water and the same pots. One sat by a sunny window. The other sat in a dark closet. After two weeks the window plant was green and tall; the closet plant was pale and weak."],
  [null, "food", "What are the ingredients (inputs) of photosynthesis?", ["Light, water and carbon dioxide", "Oxygen and sugar", "Soil and minerals only", "Sugar and water"], "Plants use light energy, water and carbon dioxide. They make sugar and release oxygen."],
  [null, "food", "What does photosynthesis make (its outputs)?", ["Sugar and oxygen", "Water and soil", "Carbon dioxide and light", "Minerals and water"], "Photosynthesis makes sugar (food for the plant) and oxygen (released into the air)."],
  [null, "cycle", "Which order shows a bean plant's life cycle?", ["Seed → seedling → adult plant → flower → fruit with seeds", "Flower → seed → fruit → seedling → adult", "Adult plant → seed → flower → seedling → fruit", "Seedling → fruit → seed → flower → adult"], "A seed germinates into a seedling, grows into an adult plant, flowers, and makes fruit with new seeds."],
  [null, "matter", "Where did most of the tree's extra mass come from?", ["Carbon dioxide from the air, and water", "The soil in the pot", "The sunlight", "The fertilizer"], "The soil barely changed. The tree built its body mostly from carbon dioxide in the air and water. Sunlight gave the energy, not the mass.", "A scientist planted a small tree in a pot of soil and gave it only water for five years. The tree gained more than 70 kilograms. The soil lost only about 60 grams."],
  [null, "energy", "In the food chain grass → rabbit → fox, where did the fox's energy first come from?", ["The sun", "The rabbit", "The soil", "Water"], "The grass captured the sun's energy by photosynthesis. The rabbit ate the grass and the fox ate the rabbit."],
  [null, "water", "A clear bag tied over a plant's leaves fills with water droplets. Where did the water come from?", ["Transpiration from the leaves", "Rain inside the bag", "The bag melting", "Roots in the air"], "Leaves give off water vapor (transpiration). It condenses into droplets on the cool bag."],
];

/* ======================================================================= 6–8 */

const B2_CARD: Spec[] = [
  ["sunleaf", "cells", "Which pigment in leaves absorbs light for photosynthesis?", ["Chlorophyll", "Hemoglobin", "Melanin", "Keratin"], "Chlorophyll, inside chloroplasts, absorbs light energy. It is why leaves look green."],
  ["sunleaf", "food", "Photosynthesis changes light energy into ___ energy.", ["Chemical", "Sound", "Nuclear", "Magnetic"], "Light energy is stored as chemical energy in the bonds of glucose."],
  ["rootknot", "soil", "Tiny root hairs add surface area so roots can absorb more...", ["Water", "Light", "Pollen", "Sugar"], "Root hairs greatly increase surface area, so more water and minerals are absorbed."],
  ["rootknot", "respond", "Roots growing downward in response to gravity is called...", ["Gravitropism", "Phototropism", "Pollination", "Transpiration"], "Gravitropism is growth in response to gravity: roots grow down and shoots grow up."],
  ["slinger", "cycle", "A seed holds a tiny plant (embryo) and a supply of stored...", ["Food", "Oxygen gas", "Pollen", "Chlorophyll"], "Seeds store food (in cotyledons or endosperm) to fuel the embryo until it can photosynthesize."],
  ["slinger", "cycle", "Before its first leaves open, a sprouting seed gets energy from...", ["Stored food", "Sunlight", "Pollen", "Rainwater"], "Until it has leaves, a seedling runs on the food stored in the seed."],
  ["thorn", "respond", "A stem bending toward a sunny window shows...", ["Phototropism", "Gravitropism", "Transpiration", "Pollination"], "Phototropism is growth toward light. It helps leaves get more light for photosynthesis."],
  ["thorn", "respond", "A plant's growth response to touch is called...", ["Thigmotropism", "Phototropism", "Gravitropism", "Germination"], "Thigmotropism is a response to touch, like a vine curling around a fence."],
  ["stem", "water", "Which tissue carries water up from the roots?", ["Xylem", "Phloem", "Stomata", "Cuticle"], "Xylem tubes carry water and minerals up from the roots to the leaves."],
  ["stem", "water", "Which tissue carries sugar from the leaves to the rest of the plant?", ["Phloem", "Xylem", "Root hair", "Cuticle"], "Phloem carries sugars made in the leaves to the roots, stems, flowers and fruits."],
  ["pollen", "cycle", "Pollen must land on which part of the pistil?", ["Stigma", "Anther", "Sepal", "Root"], "The sticky stigma catches pollen. Then a pollen tube grows down to the ovary."],
  ["pollen", "cycle", "Which part of a flower makes pollen?", ["Anther", "Stigma", "Ovary", "Sepal"], "Anthers, at the tips of the stamens, make pollen."],
  ["berry", "cycle", "A fruit develops from which part of the flower?", ["Ovary", "Anther", "Petal", "Sepal"], "After fertilization, the ovary ripens into a fruit and the ovules become seeds."],
  ["berry", "cycle", "Burrs that stick to fur spread their seeds by...", ["Animals", "Wind", "Water", "Gravity"], "Hooked burrs hitch a ride on animal fur, so animals disperse the seeds."],
  ["frond", "parts", "Which waxy layer on leaves slows water loss?", ["Cuticle", "Stomata", "Xylem", "Phloem"], "The waxy cuticle keeps leaves from drying out."],
  ["frond", "cells", "Most photosynthesis happens in which leaf layer?", ["Palisade layer", "Cuticle", "Root cap", "Bark"], "Palisade cells, just under the upper surface, are packed with chloroplasts."],
  ["stoma", "matter", "Tiny leaf openings for gas exchange are called...", ["Stomata", "Xylem", "Anthers", "Petals"], "Stomata let carbon dioxide in and let oxygen and water vapor out."],
  ["stoma", "water", "Which cells open and close the stomata?", ["Guard cells", "Root hairs", "Pollen", "Xylem cells"], "Two guard cells surround each stoma and swell or shrink to open or close it."],
  ["chloro", "cells", "Photosynthesis takes place inside which organelle?", ["Chloroplast", "Mitochondrion", "Nucleus", "Ribosome"], "Chloroplasts hold chlorophyll and carry out photosynthesis."],
  ["chloro", "matter", "Cellular respiration releases energy from sugar in the...", ["Mitochondria", "Chloroplasts", "Cell wall", "Vacuole"], "Plants and animals both do cellular respiration in mitochondria. Only plants (and algae) also have chloroplasts."],
];

const B2_CHECK: Spec[] = [
  [null, "chem", "Which is the balanced chemical equation for photosynthesis?", [EQ, RESP, "Glucose + light → oxygen", "Oxygen + water → glucose"], `Photosynthesis: ${EQ}, powered by light energy. The reverse, ${RESP}, is cellular respiration.`],
  [null, "chem", "Which word equation shows photosynthesis?", ["Carbon dioxide + water → glucose + oxygen", "Glucose + oxygen → carbon dioxide + water", "Oxygen + water → carbon dioxide + glucose", "Glucose + water → oxygen + carbon dioxide"], "With light energy, carbon dioxide and water become glucose and oxygen. Respiration runs the other way."],
  [null, "chem", `In ${EQ}, how many oxygen atoms are on EACH side?`, ["18", "12", "6", "24"], "Left: 6×2 + 6×1 = 18. Right: 6 (in glucose) + 6×2 = 18. Atoms are conserved, so the equation balances."],
  [null, "matter", "How are photosynthesis and cellular respiration related?", ["The products of one are the reactants of the other", "They are the same process", "Only animals do respiration", "Plants never do respiration"], "Photosynthesis makes glucose and O₂; respiration uses glucose and O₂ and releases CO₂ and water. Plants do both."],
  [null, "rate", "What does this data show?", ["More light makes photosynthesis faster", "Light has no effect", "Less light makes it faster", "The plant stopped making oxygen"], "Closer lamp = more light = more oxygen bubbles. Light intensity affects the rate of photosynthesis.", "A student put a water plant (elodea) under a lamp and counted oxygen bubbles. Lamp 10 cm away: 30 bubbles per minute. 20 cm: 18. 40 cm: 6."],
  [null, "energy", "Only about 10% of energy passes up each level of a food chain. If grass stores 10,000 units, about how much reaches a rabbit that eats it?", ["1,000 units", "100 units", "10,000 units", "10 units"], "10% of 10,000 is 1,000. The rest is used for life processes or lost as heat."],
  [null, "water", "Why does a plant wilt when its soil dries out?", ["Xylem can't replace water lost by transpiration", "Phloem stops making oxygen", "The stomata make too much sugar", "Roots absorb too much light"], "Leaves keep losing water vapor through stomata. With dry soil, xylem cannot bring up enough water to keep cells firm."],
];

/* ====================================================================== 9–12 */

const B3_CARD: Spec[] = [
  ["sunleaf", "cells", "The light-dependent reactions take place in the...", ["Thylakoids", "Stroma", "Cytoplasm", "Nucleus"], "Light reactions happen on thylakoid membranes, where chlorophyll and the electron transport chain are."],
  ["sunleaf", "food", "The light reactions make which energy carriers for the Calvin cycle?", ["ATP and NADPH", "ADP and NADP⁺", "Glucose and O₂", "CO₂ and H₂O"], "Light reactions make ATP and NADPH. The Calvin cycle spends them to build sugar."],
  ["rootknot", "food", "The O₂ released by photosynthesis comes from splitting...", ["Water", "Carbon dioxide", "Glucose", "ATP"], "Photosystem II splits water (photolysis). Its oxygen atoms are released as O₂."],
  ["rootknot", "soil", "Nitrogen absorbed by roots is used to build...", ["Proteins", "Starch", "Cellulose", "Glucose"], "Proteins (and chlorophyll and DNA) contain nitrogen. Starch, cellulose and glucose contain only C, H and O."],
  ["slinger", "matter", "A sprouting seed releases energy from its stored starch by...", ["Respiration", "Transpiration", "Pollination", "Osmosis"], "Cellular respiration breaks down glucose from starch to make ATP for growth."],
  ["slinger", "chem", "Starch is a polymer made of many linked ___ units.", ["Glucose", "Amino acid", "Nucleotide", "Fatty acid"], "Plants store the glucose from photosynthesis as starch, a long chain of glucose."],
  ["thorn", "rate", "Cacti open their stomata at night to save water. They are...", ["CAM plants", "C4 plants", "C3 plants", "Algae"], "CAM plants take in CO₂ at night and store it, then run the Calvin cycle by day with stomata closed."],
  ["thorn", "respond", "Which plant hormone causes stems to bend toward light?", ["Auxin", "Insulin", "Adrenaline", "Ethylene"], "Auxin builds up on the shaded side, making those cells grow longer so the stem bends toward light."],
  ["stem", "water", "Phloem moves sugars from a source (like a leaf) to a...", ["Sink", "Stoma", "Xylem", "Cuticle"], "In phloem, sugars flow from sources (leaves) to sinks (roots, fruits, growing tips)."],
  ["stem", "water", "Water rises in xylem mainly by transpiration pull plus water's...", ["Cohesion", "Gravity", "Respiration", "Pollination"], "Water molecules stick together (cohesion), so evaporation from leaves pulls a column of water up."],
  ["pollen", "cells", "Chlorophyll a absorbs mostly which colors of light?", ["Blue and red", "Green only", "Yellow", "Infrared"], "Chlorophyll absorbs blue-violet and red light best and reflects much of the green."],
  ["pollen", "cells", "Leaves look green because chlorophyll ___ green light.", ["Reflects", "Absorbs", "Creates", "Destroys"], "Green light is mostly reflected (or transmitted), so that is the color we see."],
  ["berry", "matter", "Plants often store the glucose they make as...", ["Starch", "Protein", "DNA", "Chlorophyll"], "Glucose is linked into starch for storage in roots, seeds, tubers and some fruits."],
  ["berry", "matter", "The carbon in a fruit's sugar first entered the plant as...", ["CO₂", "H₂O", "O₂", "N₂"], "The Calvin cycle fixes carbon from CO₂ into sugar. Water supplies hydrogen (and the O₂ released)."],
  ["frond", "rate", "On a graph of rate vs light intensity, the rate levels off. What now limits it?", ["CO₂ or temp", "Light", "Oxygen", "Glucose"], "On the plateau more light no longer helps, so another factor, like CO₂ level or temperature, is limiting."],
  ["frond", "rate", "Far above the best temperature, photosynthesis slows because...", ["Enzymes deform", "Light fades", "CO₂ rises", "Roots grow"], "High heat changes the shape of enzymes like rubisco (denaturing), so reactions slow."],
  ["stoma", "rate", "Closing stomata on a hot day saves water but limits the intake of...", ["CO₂", "Light", "Glucose", "Minerals"], "With stomata closed, less CO₂ diffuses in, so the Calvin cycle slows."],
  ["stoma", "matter", "Gases move in and out of leaves through stomata by...", ["Diffusion", "Phagocytosis", "Pollination", "Translation"], "CO₂ and O₂ diffuse from higher to lower concentration through open stomata."],
  ["chloro", "cells", "The Calvin cycle takes place in the chloroplast's...", ["Stroma", "Thylakoid", "Nucleus", "Cell wall"], "The Calvin cycle runs in the stroma, the fluid around the thylakoids."],
  ["chloro", "food", "Which enzyme fixes CO₂ in the Calvin cycle?", ["Rubisco", "Amylase", "Lipase", "DNA polymerase"], "Rubisco attaches CO₂ to RuBP, the first step of carbon fixation."],
];

const B3_CHECK: Spec[] = [
  [null, "chem", `In ${EQ}, which reactant supplies the oxygen atoms released as O₂?`, ["H₂O (water)", "CO₂ (carbon dioxide)", "Glucose", "Both equally"], "Isotope experiments showed the released O₂ comes from water split in the light reactions. The oxygen from CO₂ ends up in glucose and water."],
  [null, "food", "Which of these happens in the Calvin cycle?", ["CO₂ is fixed and used to build sugar", "Water is split and O₂ is released", "Chlorophyll absorbs light", "Light drives an electron transport chain"], "The light reactions split water and make ATP and NADPH. The Calvin cycle (in the stroma) uses them to fix CO₂ into sugar."],
  [null, "rate", "What do these results show?", ["CO₂ was limiting the rate at the lower plateau", "Light was limiting at both plateaus", "CO₂ has no effect on the rate", "The plant cannot use extra CO₂"], "Raising CO₂ raised the plateau, so at 0.04% CO₂ the limiting factor on the plateau was CO₂, not light.", "Rate of photosynthesis was measured as light intensity increased. At 0.04% CO₂ the rate rose, then leveled off at 20 units. Repeated at 0.10% CO₂, it leveled off at 35 units."],
  [null, "matter", "Which statement about photosynthesis and respiration is correct?", ["Matter cycles between them, but energy flows through and leaves as heat", "Energy cycles, but matter is used up", "Both matter and energy cycle forever with no loss", "They have nothing to do with each other"], "Carbon and oxygen atoms cycle between photosynthesis and respiration. Energy enters as light and leaves as heat, so it flows, not cycles."],
  [null, "cells", "An action spectrum shows the LEAST photosynthesis under which color of light?", ["Green", "Blue", "Red", "Violet"], "Chlorophyll absorbs little green light, so photosynthesis is lowest in green and highest in blue and red."],
  [null, "rate", "CAM plants open stomata at night and store CO₂ as acids. What is the main advantage?", ["Saving water in hot, dry places", "Growing faster in shade", "Making more seeds", "Absorbing more minerals"], "Opening stomata only in the cool night cuts water loss, which suits deserts."],
  [null, "food", "If the light is switched off, the Calvin cycle soon slows down. Why?", ["It runs out of ATP and NADPH from the light reactions", "CO₂ disappears from the air", "Glucose blocks rubisco", "Chlorophyll breaks down at once"], "The Calvin cycle does not use light directly, but it needs the ATP and NADPH that only the light reactions make."],
];

export const BANK: BankItem[] = [
  ...build(0, "c", true, B0_CARD),
  ...build(0, "x", false, B0_CHECK),
  ...build(1, "c", true, B1_CARD),
  ...build(1, "x", false, B1_CHECK),
  ...build(2, "c", true, B2_CARD),
  ...build(2, "x", false, B2_CHECK),
  ...build(3, "c", true, B3_CARD),
  ...build(3, "x", false, B3_CHECK),
];

export function bandOfGrade(g: Grade): Band {
  const n = g === "K" ? 0 : Number(g);
  return n <= 2 ? 0 : n <= 5 ? 1 : n <= 8 ? 2 : 3;
}

export function cardItems(band: Band, kind: PlantKind): BankItem[] {
  return BANK.filter((q) => q.band === band && q.kind === kind && q.quick);
}

export function checkpointItems(band: Band): BankItem[] {
  return BANK.filter((q) => q.band === band && !q.quick);
}
