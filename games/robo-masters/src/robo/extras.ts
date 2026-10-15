import type { Grade, Question, Subject } from "../kit/types";
import { QUICK_CHOICE, QUICK_PROMPT, type Band } from "./band";
import type { RobotId } from "./robots";

/*
 * Small extra banks, written for Robo Masters where the kit is thin on a robot's flavour
 * (volcanoes and rocks at K-3 and 7, weather at grades 1, 3, 4 and 7, plants at grade 2,
 * maps at 6-12). Each item is tagged with the NC standard it practises; the correct choice
 * is written first (decks shuffle at runtime).
 */

function q(
  id: string,
  subject: Subject,
  grade: Grade,
  standard: string,
  skill: string,
  prompt: string,
  choices: [string, string, string, string],
  explanation: string,
): Question {
  const out: Question = { id: `rm-${id}`, subject, grade, standard, skill, prompt, choices, answer: 0, explanation };
  if (prompt.length <= QUICK_PROMPT && choices.every((c) => c.length <= QUICK_CHOICE)) out.quick = true;
  return out;
}

const VOLCANO: Record<Band, Question[]> = {
  k2: [
    q("vol-k2-1", "science", "1", "ESS.1.2.1", "Earth materials", "Which of these is an Earth material?", ["A rock", "A toy car", "A plastic cup", "A crayon"], "Rocks, soil, sand and water come from Earth. Toys, cups and crayons are made by people."),
    q("vol-k2-2", "science", "1", "ESS.1.2.1", "Earth materials", "Which is the biggest piece of rock?", ["A boulder", "A pebble", "Sand", "Dust"], "A boulder is a giant rock. Pebbles are small, and sand and dust are tiny bits of rock."),
    q("vol-k2-3", "science", "1", "ESS.1.2.2", "Soil", "What do plants grow in?", ["Soil", "Glass", "Metal", "Plastic"], "Soil is made of tiny bits of rock mixed with old plant and animal parts. Plants grow their roots in it."),
    q("vol-k2-4", "science", "K", "ESS.K.2.1", "Weather changes the land", "Heavy rain can wash away...", ["Soil", "The sun", "The moon", "The sky"], "Rushing rainwater can carry soil and sand away. That changes the land."),
    q("vol-k2-5", "science", "2", "ESS.2.1.1", "The sun warms Earth", "In the sun, a rock usually feels...", ["Warm", "Wet", "Fuzzy", "Sticky"], "Sunlight warms the land, rocks, water and air."),
  ],
  g35: [
    q("vol-35-1", "science", "4", "ESS.4.2.3", "Changes to Earth's surface", "What comes out of an erupting volcano?", ["Lava", "Snow", "Sap", "Salt water"], "Melted rock called magma rises up. When it comes out of a volcano it is called lava."),
    q("vol-35-2", "science", "4", "ESS.4.2.2", "Rocks", "Lava cools and hardens into which kind of rock?", ["Igneous", "Sedimentary", "Metamorphic", "Fossil"], "Igneous rock forms when melted rock (magma or lava) cools and hardens."),
    q("vol-35-3", "science", "4", "ESS.4.2.3", "Changes to Earth's surface", "Which changes Earth's surface very quickly?", ["An earthquake", "Wind on sand", "A slow river", "Ice on rock"], "Earthquakes and volcanoes change the land in minutes. Wind, water and ice usually change it slowly."),
    q("vol-35-4", "science", "3", "ESS.3.2.2", "Land features", "A tall landform with steep sides and a peak is a...", ["Mountain", "Valley", "Plain", "Plateau"], "Mountains rise high with a peak. A valley is low land between hills or mountains."),
    q("vol-35-5", "science", "4", "ESS.4.2.1", "Minerals", "How can you test how hard a mineral is?", ["Scratch test", "Smell it", "Weigh it", "Freeze it"], "A scratch test shows hardness: a harder mineral can scratch a softer one."),
  ],
  g68: [
    q("vol-68-1", "science", "6", "ESS.6.2.1", "Earth's layers", "Which layer of Earth do we live on?", ["Crust", "Mantle", "Outer core", "Inner core"], "The crust is Earth's thin, rocky outer layer. The mantle, outer core and inner core lie beneath it."),
    q("vol-68-2", "science", "6", "ESS.6.2.1", "Earth's layers", "Most volcanoes form where...", ["Tectonic plates meet", "Rivers end", "Deserts start", "Forests grow"], "Many volcanoes form at plate boundaries, where magma can rise through cracks in the crust."),
    q("vol-68-3", "science", "6", "ESS.6.2", "Changes to Earth's surface", "Breaking rock into smaller pieces is called...", ["Weathering", "Deposition", "Erosion", "Melting"], "Weathering breaks rock down. Erosion moves the pieces, and deposition drops them somewhere new."),
    q("vol-68-4", "science", "8", "ESS.8.1", "Earth's history", "In undisturbed rock layers, the oldest layer is usually at the...", ["Bottom", "Top", "Middle", "Surface"], "Layers pile up over time, so the bottom layer formed first (the law of superposition)."),
    q("vol-68-5", "science", "6", "ESS.6.2.1", "Earth's layers", "Hot, slowly flowing rock in the mantle is called...", ["Magma", "Granite", "Sediment", "Fossil"], "Magma is melted rock below the surface. Once it erupts it is called lava."),
  ],
  hs: [
    q("vol-hs-1", "science", "9", "ESS.EES.2.2", "Plate boundaries", "Plates moving apart form a...", ["Divergent boundary", "Convergent boundary", "Transform boundary", "Hot spot"], "At divergent boundaries plates spread apart and magma rises, as at mid-ocean ridges."),
    q("vol-hs-2", "science", "9", "ESS.EES.2.2", "Plate boundaries", "The San Andreas Fault, where plates slide past each other, is a...", ["Transform boundary", "Divergent boundary", "Convergent boundary", "Rift valley"], "At transform boundaries plates grind sideways past each other, which causes earthquakes."),
    q("vol-hs-3", "science", "9", "ESS.EES.2.2", "Plate boundaries", "An ocean plate sinking under a continental plate makes a...", ["Subduction zone", "Mid-ocean ridge", "Hot spot", "Delta"], "In a subduction zone the denser ocean plate sinks into the mantle, often building volcanoes."),
    q("vol-hs-4", "science", "9", "ESS.EES.6", "Natural hazards", "Which tool records earthquake waves?", ["Seismometer", "Barometer", "Anemometer", "Telescope"], "A seismometer detects the ground shaking from seismic waves."),
    q("vol-hs-5", "science", "9", "ESS.EES.2.2", "Plate boundaries", "Hawaii's volcanoes formed over a...", ["Hot spot", "Transform fault", "Trench", "Glacier"], "A hot spot is a plume of hot mantle. As the plate moves over it, a chain of volcanic islands forms."),
  ],
};

const WEATHER: Record<Band, Question[]> = {
  k2: [
    q("wx-k2-1", "science", "K", "ESS.K.1.1", "Weather", "Which tool tells how hot or cold it is?", ["Thermometer", "Ruler", "Scale", "Magnet"], "A thermometer measures temperature: how hot or cold the air is."),
    q("wx-k2-2", "science", "K", "ESS.K.1.2", "Weather", "What should you wear on a rainy day?", ["A raincoat", "A swimsuit", "Sandals only", "Sunglasses only"], "A raincoat keeps you dry when it rains."),
    q("wx-k2-3", "science", "2", "ESS.2.1.4", "Weather tools", "A wind sock shows the wind's...", ["Direction", "Color", "Taste", "Weight"], "A wind sock points the way the wind is blowing."),
    q("wx-k2-4", "science", "2", "ESS.2.1.2", "Weather conditions", "Rain, snow and hail all fall from...", ["Clouds", "Trees", "Rivers", "Rocks"], "Water in clouds falls as rain, snow or hail. That is called precipitation."),
    q("wx-k2-5", "science", "K", "ESS.K.1.3", "Seasons", "Which season is usually the coldest?", ["Winter", "Summer", "Spring", "Fall"], "Winter is the coldest season. Summer is the warmest."),
  ],
  g35: [
    q("wx-35-1", "science", "5", "ESS.5.1.4", "Water cycle", "Water turning into vapor is called...", ["Evaporation", "Condensation", "Precipitation", "Freezing"], "When the sun heats water, it evaporates into water vapor in the air."),
    q("wx-35-2", "science", "5", "ESS.5.1.4", "Water cycle", "Water vapor cooling into cloud droplets is...", ["Condensation", "Evaporation", "Runoff", "Melting"], "When water vapor cools, it condenses into tiny droplets that make clouds."),
    q("wx-35-3", "science", "5", "ESS.5.1.1", "Weather data", "Which tool measures how much rain fell?", ["Rain gauge", "Thermometer", "Barometer", "Compass"], "A rain gauge collects rain so you can measure how much fell."),
    q("wx-35-4", "science", "5", "ESS.5.1.2", "Weather data and severe weather", "A spinning column of air touching the ground is a...", ["Tornado", "Breeze", "Fog bank", "Drizzle"], "A tornado is a violently spinning column of air that reaches from a storm cloud to the ground."),
    q("wx-35-5", "science", "5", "ESS.5.1.1", "Weather data", "An anemometer measures...", ["Wind speed", "Rainfall", "Air pressure", "Humidity"], "An anemometer has spinning cups; the faster they spin, the faster the wind."),
    q("wx-35-6", "science", "5", "ESS.5.1.3", "Ocean and weather", "Hurricanes usually form over...", ["Warm ocean water", "Cold deserts", "Snowy mountains", "Frozen lakes"], "Hurricanes get their energy from warm ocean water, so they form over warm seas."),
  ],
  g68: [
    q("wx-68-1", "science", "7", "ESS.7.1.3", "Air masses and fronts", "A cold air mass pushing under warm air makes a...", ["Cold front", "Warm front", "High tide", "Jet lag"], "At a cold front, cold air wedges under warm air and lifts it fast, often bringing storms."),
    q("wx-68-2", "science", "7", "ESS.7.1.1", "Air pressure", "Which tool measures air pressure?", ["Barometer", "Anemometer", "Hygrometer", "Rain gauge"], "A barometer measures air pressure. Falling pressure often means stormy weather is coming."),
    q("wx-68-3", "science", "7", "ESS.7.1.2", "Atmosphere structure", "In which layer of the atmosphere does weather happen?", ["Troposphere", "Stratosphere", "Mesosphere", "Thermosphere"], "Almost all weather happens in the troposphere, the lowest layer."),
    q("wx-68-4", "science", "7", "ESS.7.1.4", "Predicting weather", "Falling air pressure usually means...", ["Clouds or storms", "Clear skies", "No wind at all", "Colder sand"], "Low pressure lets air rise and cool, forming clouds and often rain."),
    q("wx-68-5", "science", "7", "ESS.7.1.3", "Air masses and fronts", "An air mass that forms over warm ocean water is...", ["Warm and humid", "Cold and dry", "Warm and dry", "Cold and humid"], "Air takes on the properties of where it forms: over warm water it becomes warm and moist."),
  ],
  hs: [
    q("wx-hs-1", "science", "9", "ESS.EES.3", "Weather and climate", "Weather vs. climate: climate is...", ["Long-term pattern", "Today's rain", "One storm", "A forecast"], "Weather is short-term (today, this week). Climate is the average pattern over many years."),
    q("wx-hs-2", "science", "9", "ESS.EES.3", "Weather and climate", "The Coriolis effect is caused by Earth's...", ["Rotation", "Moon", "Magnetism", "Oceans' salt"], "Because Earth spins, moving air and water curve: right in the Northern Hemisphere, left in the Southern."),
    q("wx-hs-3", "science", "9", "ESS.EES.3", "Weather and climate", "Hurricanes form over warm ocean water because warm water...", ["Supplies heat and moisture", "Is salty", "Has waves", "Is deep"], "Warm water evaporates fast, and the heat released when that vapor condenses powers the storm."),
    q("wx-hs-4", "science", "9", "ESS.EES.3", "Weather and climate", "Why do coastal cities have milder temperatures?", ["Water heats and cools slowly", "Sand reflects heat", "Wind stops there", "Salt warms air"], "Water has a high specific heat, so oceans keep nearby air from getting very hot or very cold."),
    q("wx-hs-5", "science", "9", "ESS.EES.1", "Solar energy and seasons", "Earth has seasons mainly because of its...", ["Tilted axis", "Distance to the sun", "Moon's phases", "Ocean tides"], "Earth's tilt changes how directly sunlight hits each hemisphere through the year."),
  ],
};

const PLANTS: Record<Band, Question[]> = {
  k2: [
    q("pl-k2-1", "science", "K", "LS.K.2.2", "Plants alike and different", "What do plants need to grow?", ["Water and light", "Candy", "Toys", "Shoes"], "Plants need water, light, air and space to grow."),
    q("pl-k2-2", "science", "1", "LS.1.1.1", "Plant parts", "Which plant part holds the plant in the soil?", ["Roots", "Petals", "Leaves", "Fruit"], "Roots hold the plant in place and take in water from the soil."),
    q("pl-k2-3", "science", "1", "LS.1.1.1", "Plant parts", "Which part of a plant makes seeds?", ["Flower", "Root", "Stem", "Bark"], "Flowers make seeds, which can grow into new plants."),
    q("pl-k2-4", "science", "1", "LS.1.1.1", "Plant parts", "A seed grows into a...", ["New plant", "Rock", "Cloud", "Bird"], "A seed has a tiny baby plant inside. With water and warmth it sprouts."),
    q("pl-k2-5", "science", "K", "LS.K.2.2", "Plants alike and different", "Which is a living thing?", ["A tree", "A rock", "A spoon", "A cloud"], "A tree is alive: it grows, needs water and makes seeds. Rocks and spoons are not alive."),
  ],
  g35: [
    q("pl-35-1", "science", "3", "LS.3.2.1", "Plant structures", "Which part carries water from the roots up the plant?", ["Stem", "Petal", "Seed", "Pollen"], "The stem holds the plant up and moves water and food between the roots and leaves."),
    q("pl-35-2", "science", "3", "LS.3.2.2", "Seed-plant life cycle", "What is the first stage of a seed plant's life cycle?", ["Seed", "Flower", "Fruit", "Adult plant"], "A seed germinates into a seedling, grows into an adult plant, flowers and makes new seeds."),
    q("pl-35-3", "science", "3", "LS.3.2.1", "Plant structures", "Leaves use sunlight to make...", ["Food", "Rocks", "Soil", "Wind"], "Leaves use sunlight, air and water to make food (sugar) for the plant."),
    q("pl-35-4", "science", "3", "LS.3.2.2", "Seed-plant life cycle", "Bees help flowers by moving...", ["Pollen", "Soil", "Roots", "Bark"], "Bees carry pollen from flower to flower. That pollination helps flowers make seeds."),
  ],
  g68: [
    q("pl-68-1", "science", "6", "LS.6.1.1", "Respiration and transpiration", "Plants lose water vapor through their leaves in...", ["Transpiration", "Germination", "Pollination", "Erosion"], "Transpiration is water evaporating out of tiny openings (stomata) in leaves."),
    q("pl-68-2", "science", "6", "LS.6.1.2", "Vascular and nonvascular plants", "Tubes that carry water up a plant are called...", ["Xylem", "Phloem", "Stomata", "Spores"], "Xylem carries water up from the roots. Phloem carries sugars around the plant."),
    q("pl-68-3", "science", "6", "LS.6.1.2", "Vascular and nonvascular plants", "Which plant is nonvascular?", ["Moss", "Oak tree", "Sunflower", "Corn"], "Mosses have no xylem or phloem, so they stay small and grow in damp places."),
    q("pl-68-4", "science", "6", "LS.6.2.1", "Energy flow from the sun", "Plants are called producers because they...", ["Make their own food", "Eat insects", "Break down waste", "Hunt prey"], "Producers use sunlight to make food. Consumers get energy by eating other living things."),
  ],
  hs: [
    q("pl-hs-1", "science", "10", "LS.Bio.3.2", "Photosynthesis", "Where in a plant cell does photosynthesis happen?", ["Chloroplast", "Mitochondrion", "Nucleus", "Ribosome"], "Chloroplasts contain chlorophyll, which captures light energy to make glucose."),
    q("pl-hs-2", "science", "10", "LS.Bio.3.2", "Photosynthesis", "Photosynthesis takes in carbon dioxide and water and gives off...", ["Oxygen", "Nitrogen", "Methane", "Helium"], "6CO2 + 6H2O + light → C6H12O6 + 6O2: plants release oxygen."),
    q("pl-hs-3", "science", "10", "LS.Bio.3.2", "Photosynthesis", "The green pigment that absorbs light is...", ["Chlorophyll", "Hemoglobin", "Melanin", "Keratin"], "Chlorophyll absorbs mostly red and blue light and reflects green, which is why leaves look green."),
    q("pl-hs-4", "science", "10", "LS.Bio.3.3", "Cellular respiration", "Do plant cells also do cellular respiration?", ["Yes, all the time", "Only at night", "Never", "Only in roots"], "Plants make glucose by photosynthesis and also break it down by cellular respiration for energy, day and night."),
  ],
};

const MAPS: Record<Band, Question[]> = {
  k2: [
    q("map-k2-1", "social", "K", "K.G.1.1", "Picture maps", "A map is a drawing of a...", ["Place", "Song", "Story", "Feeling"], "A map shows a place from above, like a bird would see it."),
    q("map-k2-2", "social", "1", "1.G.1", "Map directions", "On most maps, north is at the...", ["Top", "Bottom", "Left", "Right"], "Most maps put north at the top. A compass rose shows the directions."),
    q("map-k2-3", "social", "1", "1.G.1.2", "Map symbols", "The box that explains map symbols is the...", ["Map key", "Title", "Scale", "Border"], "A map key (or legend) tells what each symbol on the map means."),
    q("map-k2-4", "social", "2", "2.G.1.1", "Location", "A globe is a model of...", ["Earth", "The moon", "A city", "A school"], "A globe is a round model of Earth that shows land and water."),
  ],
  g35: [
    q("map-35-1", "social", "3", "3.G.1", "Map skills", "Which tool on a map shows north, south, east and west?", ["Compass rose", "Map key", "Title", "Scale bar"], "The compass rose shows the cardinal directions: north, south, east and west."),
    q("map-35-2", "social", "3", "3.G.1", "Map skills", "Northeast is between north and...", ["East", "West", "South", "Southwest"], "Intermediate directions sit between the cardinal ones: northeast is between north and east."),
    q("map-35-3", "social", "5", "5.G.1.1", "U.S. regions", "Lines of latitude run...", ["East to west", "North to south", "In circles up", "Only on oceans"], "Latitude lines run east-west around the globe and measure distance north or south of the equator."),
    q("map-35-4", "social", "3", "3.G.1", "Map skills", "A map scale helps you find...", ["Distance", "Weather", "Population", "Time zones"], "A scale bar shows how many miles or kilometers an inch or centimeter on the map stands for."),
  ],
  g68: [
    q("map-68-1", "social", "6", "6.G.1", "Map skills", "The prime meridian is 0 degrees of...", ["Longitude", "Latitude", "Altitude", "Elevation"], "Longitude lines run north-south. The prime meridian, through Greenwich, England, is 0°."),
    q("map-68-2", "social", "6", "6.G.1", "Map skills", "The equator is 0 degrees of...", ["Latitude", "Longitude", "Elevation", "Time"], "The equator circles Earth halfway between the poles at 0° latitude."),
    q("map-68-3", "social", "7", "7.G.1", "Map skills", "Why do flat maps distort shapes and sizes?", ["Earth is round", "Maps are small", "Ink spreads", "Oceans move"], "Flattening a round globe onto paper always stretches some areas; each projection makes trade-offs."),
    q("map-68-4", "social", "7", "7.G.1", "Map skills", "A map showing where people live most densely is a...", ["Population map", "Physical map", "Road map", "Climate map"], "Thematic maps show one topic. A population map shows where people are concentrated."),
    q("map-68-5", "social", "6", "6.G.1", "Map skills", "Which pair gives an exact location on Earth?", ["Latitude and longitude", "North and south", "Scale and key", "Title and border"], "Latitude and longitude lines cross at one point, giving an absolute location."),
  ],
  hs: [
    q("map-hs-1", "social", "9", "WH.G.1", "Location", "Describing a place by where it is compared to other places is its...", ["Relative location", "Absolute location", "Projection", "Elevation"], "Relative location describes a place in relation to others (for example, east of the river)."),
    q("map-hs-2", "social", "9", "WH.G.1", "Location", "Which map projection keeps directions true for navigation but enlarges areas near the poles?", ["Mercator", "Robinson", "Equal-area", "Polar"], "The Mercator projection keeps compass directions straight, which sailors liked, but makes Greenland look huge."),
    q("map-hs-3", "social", "9", "WH.G.1", "Location", "GIS stands for Geographic Information...", ["System", "Satellite", "Survey", "Signal"], "A Geographic Information System layers data (roads, rivers, population) on digital maps."),
    q("map-hs-4", "social", "9", "WH.G.1", "Location", "A narrow strip of land connecting two larger landmasses is an...", ["Isthmus", "Archipelago", "Delta", "Plateau"], "An isthmus joins two larger land areas, like the Isthmus of Panama."),
  ],
};

/** Extra items per robot and band (robots not listed rely on the kit). */
export const EXTRAS: Partial<Record<RobotId, Record<Band, Question[]>>> = {
  igneous: VOLCANO,
  cumulo: WEATHER,
  chlorophil: PLANTS,
  meridian: MAPS,
};

export const ALL_EXTRAS: Question[] = Object.values(EXTRAS).flatMap((b) => Object.values(b!).flat());
