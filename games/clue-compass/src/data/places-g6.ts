import type { Fact, Place } from "@/chase/types";

/*
 * Grade 6: world regions and physical geography on the world map. Places are present-day
 * landforms, deserts, mountain ranges and river valleys (the four early river-valley regions are
 * shown as the places they are TODAY; their ancient history belongs to Thread Chasers and is only
 * mentioned as context). Every pin carries a `country` (ISO code) that the tests check.
 */
const C = "coords";

const f = (k: string, v: string, src: string, say: string, hint: string, note: string): Fact => ({ k, v, src, say, hint, note });
/** "is" or "are" for a place name ("The Andes are…"). */
const be = (name: string) => (/(Himalayas|Alps|Andes|Mountains)$/.test(name) ? "are" : "is");
const cont = (name: string, v: string): Fact =>
  f("continent", v, "continents", `${name} ${be(name)} in ${v}.`, `A witness saw Pocket's plane land in ${v.toUpperCase()}.`, `My hideout is in ${v}.`);
const country = (name: string, v: string): Fact =>
  f("country", v, "countries", `Today ${name} ${be(name)} in ${v}.`, `Pocket's passport got a new stamp: ${v.toUpperCase()}.`, `IOU! My hideout is in present-day ${v.replace(/^the /, "")}.`);
const hemi = (name: string, v: "Northern" | "Southern"): Fact =>
  f("hemi", v, "continents", `${name} ${be(name)} in the ${v} Hemisphere, ${v === "Northern" ? "north" : "south"} of the equator.`, `Pocket crossed into the ${v.toUpperCase()} Hemisphere.`, `My hideout is in the ${v} Hemisphere.`);
const feature = (name: string, v: string, src: string): Fact =>
  f("feature", v, src, `${name} ${be(name) === "are" ? "are a" : "is a"} ${v}.`, `Pocket said the next stop is a ${v.toUpperCase()}.`, `My hideout is a ${v}.`);

/** The friendly local's fallback lesson uses a place's first fact, so lead with the most telling one. */
const lead = (p: Place): Place => ({ ...p, facts: [...p.facts.filter((x) => x.k === "trait"), ...p.facts.filter((x) => x.k !== "trait" && x.k !== "continent"), ...p.facts.filter((x) => x.k === "continent")] });

export const G6_PLACES: Place[] = ([
  // ---------------- river valleys (present-day places) ----------------
  {
    id: "nile6", name: "the Nile Valley", map: "world", at: [25.7, 32.64], atSrc: C, country: "EG", scene: "river", mark: "pyramid", local: "a felucca captain",
    facts: [
      cont("The Nile Valley", "Africa"),
      country("the Nile Valley around Luxor", "Egypt"),
      feature("The Nile Valley", "river valley", "nile"),
      f("flows", "north", "nile", "The Nile flows NORTH through Egypt, which surprises many map readers.", "Pocket rode a river that flows NORTH, toward the top of the map.", "My hideout's river flows north."),
      f("mouth", "Mediterranean Sea", "nile", "The Nile empties into the Mediterranean Sea through a wide delta.", "Pocket followed a river that empties into the MEDITERRANEAN Sea.", "My hideout's river empties into the Mediterranean."),
      f("civ", "ancient Egypt", "nile", "Ancient Egypt grew up along this river. Today farms still hug its banks in the desert.", "Long ago ancient EGYPT grew along this river. Today it is a green strip in the desert.", "Ancient Egypt grew up beside my hideout's river."),
    ],
  },
  {
    id: "mesopotamia", name: "the Tigris–Euphrates Valley", map: "world", at: [33.3, 44.4], atSrc: C, country: "IQ", scene: "river", local: "a date farmer",
    facts: [
      cont("The Tigris–Euphrates Valley", "Asia"),
      country("the Tigris–Euphrates Valley", "Iraq"),
      feature("The Tigris–Euphrates Valley", "river valley", "tigris"),
      f("mouth", "Persian Gulf", "tigris", "The two rivers join as the Shatt al-Arab and empty into the Persian Gulf.", "Pocket followed two rivers that join and empty into the PERSIAN GULF.", "My hideout's rivers flow into the Persian Gulf."),
      f("flows", "southeast", "tigris", "The Tigris and Euphrates flow southeast across Iraq toward the Persian Gulf.", "Pocket floated on twin rivers flowing SOUTHEAST to a gulf.", "My hideout's rivers flow southeast."),
      f("civ", "Sumer", "tigris", "Sumer, one of the first civilizations, grew between these two rivers in today's Iraq.", "A guide said Sumer, with some of the first cities, grew between two rivers here.", "The first cities of Sumer grew near my hideout."),
    ],
  },
  {
    id: "indus", name: "the Indus Valley", map: "world", at: [27.3, 68.1], atSrc: C, country: "PK", scene: "river", local: "a cotton farmer",
    facts: [
      cont("The Indus Valley", "Asia"),
      country("the Indus Valley", "Pakistan"),
      feature("The Indus Valley", "river valley", "indus"),
      f("mouth", "Arabian Sea", "indus", "The Indus empties into the Arabian Sea through a delta near Karachi.", "Pocket followed a river that empties into the ARABIAN SEA near Karachi.", "My hideout's river empties into the Arabian Sea."),
      f("flows", "south", "indus", "Across the plains of Pakistan the Indus flows south toward the sea.", "Pocket floated SOUTH on a big river across the plains of Pakistan.", "My hideout's river flows south."),
      f("civ", "the Harappan cities", "indus", "The Harappan civilization built planned brick cities in this valley long ago.", "Long ago, planned brick cities like Harappa and Mohenjo-daro grew along this river.", "Old brick cities like Mohenjo-daro are near my hideout."),
    ],
  },
  {
    id: "huanghe", name: "the Huang He Valley", map: "world", at: [34.75, 113.65], atSrc: C, country: "CN", scene: "river", local: "a noodle cook",
    facts: [
      cont("The Huang He Valley", "Asia"),
      country("the Huang He Valley", "China"),
      feature("The Huang He Valley", "river valley", "huanghe"),
      f("mouth", "Bohai Sea", "huanghe", "The Huang He empties into the Bohai Sea in northern China.", "Pocket followed a river all the way to the BOHAI SEA.", "My hideout's river empties into the Bohai Sea."),
      { ...f("nickname", "Yellow River", "huanghe", "Its name means Yellow River, for the yellow loess silt it carries.", "Pocket's boots got yellow mud from a river named for its yellow LOESS silt.", "My hideout's river is named for its yellow mud."), vocab: true },
      f("civ", "early Chinese dynasties", "huanghe", "Early Chinese dynasties, like the Shang, grew up along this river.", "A guide said early Chinese dynasties, like the Shang, began along this river.", "Early Chinese dynasties began near my hideout."),
    ],
  },
  {
    id: "ganges", name: "the Ganges Plain", map: "world", at: [25.32, 83.0], atSrc: C, country: "IN", scene: "river", local: "a boat rower",
    facts: [
      cont("The Ganges Plain", "Asia"),
      country("the Ganges Plain", "India"),
      feature("The Ganges Plain", "river valley", "ganges"),
      f("mouth", "Bay of Bengal", "ganges", "The Ganges flows east across India and empties into the Bay of Bengal.", "Pocket followed a holy river that empties into the BAY OF BENGAL.", "My hideout's river empties into the Bay of Bengal."),
    ],
  },
  // ---------------- Africa ----------------
  {
    id: "congo", name: "the Congo Basin", map: "world", at: [-1.0, 21.0], atSrc: C, country: "CD", scene: "rainforest", local: "a river trader",
    facts: [
      cont("The Congo Basin", "Africa"),
      country("most of the Congo Basin", "the Democratic Republic of the Congo"),
      feature("The Congo Basin", "rain forest", "congo"),
      f("mouth", "Atlantic Ocean", "congo", "The Congo River empties into the Atlantic Ocean.", "Pocket followed a river that empties into the ATLANTIC Ocean.", "My hideout's river empties into the Atlantic."),
      f("trait", "a river that crosses the equator twice", "congo", "The Congo is the only major river that crosses the equator twice.", "Pocket rode the only major river that crosses the EQUATOR TWICE.", "My hideout's river crosses the equator twice."),
    ],
  },
  {
    id: "sahara6", name: "the Sahara", map: "world", at: [23.0, 5.5], atSrc: C, country: "DZ", scene: "desert", mark: "desert", local: "a camel guide",
    facts: [
      cont("The Sahara", "Africa"),
      country("this part of the Sahara", "Algeria"),
      feature("The Sahara", "desert", "sahara"),
      hemi("The Sahara", "Northern"),
      f("trait", "the largest hot desert", "sahara", "The Sahara is the largest hot desert on Earth, stretching across North Africa.", "Pocket crossed the LARGEST HOT DESERT on Earth.", "My hideout is in the largest hot desert."),
    ],
  },
  {
    id: "kalahari", name: "the Kalahari", map: "world", at: [-23.0, 22.0], atSrc: C, country: "BW", scene: "savanna", local: "a wildlife ranger",
    facts: [
      cont("The Kalahari", "Africa"),
      country("most of the Kalahari", "Botswana"),
      feature("The Kalahari", "desert", "kalahari"),
      hemi("The Kalahari", "Southern"),
      f("trait", "a red-sand desert in southern Africa", "kalahari", "The Kalahari is a red-sand desert covering most of Botswana in southern Africa.", "Pocket left footprints in the RED SAND of a desert in southern Africa.", "My hideout has red sand, in southern Africa."),
    ],
  },
  {
    id: "kilimanjaro", name: "Mount Kilimanjaro", map: "world", at: [-3.07, 37.35], atSrc: C, country: "TZ", scene: "peak", mark: "volcano", local: "a mountain porter",
    facts: [
      cont("Mount Kilimanjaro", "Africa"),
      country("Mount Kilimanjaro", "Tanzania"),
      feature("Mount Kilimanjaro", "volcano", "kilimanjaro"),
      hemi("Mount Kilimanjaro", "Southern"),
      f("trait", "Africa's highest mountain", "kilimanjaro", "At 5,895 m (19,341 ft), it is the highest mountain in Africa, with snow near the equator.", "Pocket climbed the HIGHEST MOUNTAIN IN AFRICA, a snowy volcano near the equator.", "My hideout is on Africa's highest mountain."),
    ],
  },
  // ---------------- Asia ----------------
  {
    id: "himalaya", name: "the Himalayas", map: "world", at: [27.99, 86.93], atSrc: C, country: "NP", scene: "peak", local: "a Sherpa guide",
    facts: [
      cont("The Himalayas", "Asia"),
      country("Mount Everest, on the border with China,", "Nepal"),
      feature("The Himalayas", "mountain range", "himalaya"),
      hemi("The Himalayas", "Northern"),
      f("trait", "the highest mountains on Earth", "himalaya", "This range holds Mount Everest, 8,849 m, the highest peak on Earth.", "Pocket climbed toward EVEREST in the highest mountains on Earth.", "My hideout is in the highest mountains on Earth."),
    ],
  },
  {
    id: "gobi", name: "the Gobi Desert", map: "world", at: [43.0, 105.0], atSrc: C, country: "MN", scene: "desert", local: "a herder",
    facts: [
      cont("The Gobi Desert", "Asia"),
      country("most of the Gobi Desert", "Mongolia"),
      feature("The Gobi Desert", "desert", "gobi"),
      hemi("The Gobi Desert", "Northern"),
      f("trait", "a cold desert with icy winters", "gobi", "The Gobi is a COLD desert: dry all year, with freezing winters.", "Pocket packed a parka for a COLD DESERT with icy winters.", "My hideout is a desert, but its winters are icy."),
    ],
  },
  // ---------------- Europe ----------------
  {
    id: "alps", name: "the Alps", map: "world", at: [46.5, 9.84], atSrc: C, country: "CH", scene: "peak", local: "a ski patroller",
    facts: [
      cont("The Alps", "Europe"),
      country("this part of the Alps", "Switzerland"),
      feature("The Alps", "mountain range", "alps"),
      hemi("The Alps", "Northern"),
      f("trait", "Mont Blanc", "alps", "This range holds Mont Blanc, the highest peak in Western Europe.", "Pocket wanted the range with MONT BLANC, the highest peak in Western Europe.", "My hideout's range has Mont Blanc."),
    ],
  },
  {
    id: "danube", name: "the Danube", map: "world", at: [47.5, 19.04], atSrc: C, country: "HU", scene: "river", mark: "boat", local: "a riverboat pilot",
    facts: [
      cont("The Danube", "Europe"),
      country("this stretch of the Danube, at Budapest,", "Hungary"),
      feature("The Danube", "river valley", "danube"),
      f("mouth", "Black Sea", "danube", "The Danube flows east across Europe and empties into the Black Sea.", "Pocket followed a river that empties into the BLACK SEA.", "My hideout's river empties into the Black Sea."),
      f("trait", "a river through four capitals", "danube", "This river flows through four capitals: Vienna, Bratislava, Budapest and Belgrade.", "Pocket rode a river that flows through FOUR CAPITAL cities, like Vienna.", "My hideout's river passes four capitals."),
    ],
  },
  {
    id: "urals", name: "the Ural Mountains", map: "world", at: [58.0, 58.5], atSrc: C, country: "RU", scene: "mountains", local: "a forest ranger",
    facts: [
      cont("The western side of the Ural Mountains", "Europe"),
      country("the Ural Mountains", "Russia"),
      feature("The Ural Mountains", "mountain range", "urals"),
      f("trait", "the Europe–Asia boundary", "urals", "The Ural Mountains in Russia mark part of the boundary between Europe and Asia.", "Pocket stood with one foot in EUROPE and one in ASIA, on an old mountain range.", "My hideout is on the line between Europe and Asia."),
    ],
  },
  // ---------------- South America ----------------
  {
    id: "amazon6", name: "the Amazon Rain Forest", map: "world", at: [-3.1, -60.0], atSrc: C, country: "BR", scene: "rainforest", local: "a canoe guide",
    facts: [
      cont("The Amazon Rain Forest", "South America"),
      country("most of the Amazon Rain Forest", "Brazil"),
      feature("The Amazon Rain Forest", "rain forest", "amazon"),
      f("mouth", "Atlantic Ocean", "amazon", "The Amazon River empties into the Atlantic Ocean.", "Pocket followed a river that empties into the ATLANTIC Ocean.", "My hideout's river empties into the Atlantic."),
      f("trait", "the largest rain forest", "amazon", "This is the largest tropical rain forest on Earth.", "Pocket got lost in the LARGEST tropical RAIN FOREST on Earth.", "My hideout is in the largest rain forest."),
    ],
  },
  {
    id: "andes", name: "the Andes", map: "world", at: [-13.5, -72.0], atSrc: C, country: "PE", scene: "mountains", mark: "llama", local: "a llama herder",
    facts: [
      cont("The Andes", "South America"),
      country("this part of the Andes, near Cusco,", "Peru"),
      feature("The Andes", "mountain range", "andes"),
      hemi("The Andes near Cusco", "Southern"),
      f("trait", "the longest range on a continent", "andes", "At about 7,000 km, this is the longest mountain range on any continent.", "Pocket hiked the LONGEST mountain range on any continent.", "My hideout is in the longest range on land."),
    ],
  },
  {
    id: "atacama", name: "the Atacama Desert", map: "world", at: [-24.5, -69.25], atSrc: C, country: "CL", scene: "desert", local: "an astronomer",
    facts: [
      cont("The Atacama Desert", "South America"),
      country("the Atacama Desert", "Chile"),
      feature("The Atacama Desert", "desert", "atacama"),
      hemi("The Atacama Desert", "Southern"),
      f("trait", "the driest nonpolar desert", "atacama", "The Atacama is the driest desert on Earth outside the polar regions.", "Pocket went to the DRIEST desert on Earth outside the poles.", "My hideout is the driest nonpolar desert."),
    ],
  },
  // ---------------- North America and Australia ----------------
  {
    id: "rockies", name: "the Rocky Mountains", map: "world", at: [40.34, -105.68], atSrc: C, country: "US", scene: "mountains", local: "a park ranger",
    facts: [
      cont("The Rocky Mountains", "North America"),
      country("this part of the Rocky Mountains", "the United States"),
      feature("The Rocky Mountains", "mountain range", "rockies"),
      hemi("The Rocky Mountains", "Northern"),
      f("trait", "the Continental Divide", "rockies", "The Continental Divide runs along this range: rain splits toward the Pacific or the Atlantic.", "Pocket stood on the CONTINENTAL DIVIDE, where rain splits between two oceans.", "My hideout is on the Continental Divide."),
    ],
  },
  {
    id: "mississippi6", name: "the Mississippi River", map: "world", at: [32.35, -90.88], atSrc: C, country: "US", scene: "river", mark: "boat", local: "a towboat pilot",
    facts: [
      cont("The Mississippi River", "North America"),
      country("the Mississippi River", "the United States"),
      feature("The Mississippi River", "river valley", "mississippi"),
      f("mouth", "Gulf of Mexico", "mississippi", "The Mississippi flows south and empties into the Gulf of Mexico.", "Pocket followed a river that empties into the GULF OF MEXICO.", "My hideout's river empties into the Gulf of Mexico."),
      f("flows", "south", "mississippi", "The Mississippi flows south through the middle of the United States.", "Pocket floated SOUTH down the middle of a continent.", "My hideout's river flows south."),
    ],
  },
  {
    id: "outback6", name: "the Australian Outback", map: "world", at: [-25.34, 131.04], atSrc: C, country: "AU", scene: "outback", mark: "kangaroo", local: "an Anangu ranger",
    facts: [
      cont("The Outback", "Australia"),
      country("the Outback", "Australia"),
      feature("The Outback around Uluru", "desert", "outback"),
      hemi("The Outback", "Southern"),
      f("trait", "Uluru", "outback", "Uluru, a giant sandstone rock sacred to the Anangu people, rises from this desert.", "Pocket saw ULURU, a giant red rock, glow at sunset.", "A giant red rock called Uluru is near my hideout."),
    ],
  },
] as Place[]).map(lead);
