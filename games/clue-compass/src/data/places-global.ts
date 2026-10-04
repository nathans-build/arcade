import type { Fact, Place } from "@/chase/types";

/*
 * World map, grades 7 and 9–12.
 *  Grade 7 (modern world regions): capitals, languages, currencies, flags (in words + pixel flags)
 *  and exports.
 *  Grades 9–12 (global geography): UTC offsets (standard time), climate graphs described in
 *  words (Köppen family), plate boundaries, population and urbanization (rounded, dated) and trade.
 *  Latitude/longitude clues are generated from each pin (see chase/geo.ts fmtLL), so they are
 *  always the pin's own coordinates rounded to whole degrees.
 * Existing grade 5 world places (Ottawa, Mexico City, London, Cairo, Tokyo, Washington) get the
 * same kinds of facts through GLOBAL_EXTRA, so their K–5 entries stay untouched.
 */
const C = "coords";

// ------------------------------------------------------------------ grade 7 fact makers
const cont = (name: string, v: string): Fact => ({ k: "continent", v, src: "continents", say: `${name} is in ${v}.`, hint: `Pocket flew to ${v.toUpperCase()}.`, note: `My hideout is in ${v}.` });
const capital = (name: string, country: string): Fact => ({
  k: "capital", v: country, src: "capitals-world",
  say: `${name} is the capital of ${country}.`,
  hint: `Pocket wanted to see the capital city of ${country.toUpperCase()}.`,
  note: `My hideout is the capital of ${country}.`,
});
const lang = (name: string, v: string, say?: string): Fact => {
  const two = v.includes(" and ");
  return {
    k: "language", v, src: "languages",
    say: say ?? `${v} ${two ? "are the main languages" : "is the main language"} in ${name}.`,
    hint: `A waiter told Pocket the main language${two ? "s" : ""} there: ${v.toUpperCase()}.`,
    note: `People at my hideout speak ${v}.`,
  };
};
const money = (name: string, v: string, country: string): Fact => ({
  k: "currency", v, src: "currencies",
  say: `${country} uses the ${v}, so that's the money in ${name}.`,
  hint: `Pocket paid for a snack with the ${v.toUpperCase()}.`,
  note: `At my hideout I pay with the ${v}.`,
});
const flag = (country: string, v: string, icon?: string): Fact => ({
  k: "flag", v, src: "flags", icon,
  say: `The flag of ${country} has ${v}.`,
  hint: `Pocket waved a flag with ${v}.`,
  note: `My hideout's flag has ${v}.`,
});
/** Export facts: v reads after "the clue pointed to …"; countries that share a v share the same claim. */
const exp = (v: string, hint: string, say: string, note: string, src: string): Fact => ({ k: "export", v, src, say, hint, note });
const TOP = (thing: string) => `a country whose top export is ${thing}`;

// ------------------------------------------------------------------ grades 9–12 fact makers
/** UTC offset in standard time; `fixed` = the country has no daylight saving time. */
const utc = (name: string, v: string, fixed: boolean): Fact => ({
  k: "utc", v, src: "utc",
  say: `${name} keeps ${v}${fixed ? " all year (no daylight saving time)" : " in standard time"}.`,
  hint: `Pocket reset a wristwatch to ${v}${fixed ? "" : " (standard time)"} on landing.`,
  note: `My hideout's clocks read ${v}.`,
});
const clim = (v: string, say: string, hint: string, src: string): Fact => ({ k: "clim", v, src, say, hint, note: `My hideout's climate: ${v}.` });
const plate = (v: "divergent" | "convergent" | "transform" | "far from a boundary", say: string, hint: string, src = "plates"): Fact => ({
  k: "plate", v, src, say, hint, vocab: true,
  note: v === "far from a boundary" ? "My hideout sits far from any plate boundary." : `My hideout is on a ${v} plate boundary.`,
});
const fact = (k: string, v: string, src: string, say: string, hint: string, note: string): Fact => ({ k, v, src, say, hint, note });

/** The local's fallback lesson uses the first fact: lead with a telling fact, continent last. */
const LEAD = ["capital", "plate", "trade", "pop", "clim", "utc"];
const lead = (p: Place): Place => {
  const rank = (k: string) => (k === "continent" ? 99 : LEAD.includes(k) ? LEAD.indexOf(k) : 50);
  return { ...p, facts: [...p.facts].sort((a, b) => rank(a.k) - rank(b.k)) };
};

export const GLOBAL_PLACES: Place[] = ([
  // ======================= Europe =======================
  {
    id: "paris", name: "Paris", map: "world", at: [48.86, 2.35], atSrc: C, country: "FR", scene: "city", mark: "eiffel", local: "a baker",
    facts: [
      cont("Paris", "Europe"), capital("Paris", "France"), lang("Paris", "French"), money("Paris", "euro", "France"),
      flag("France", "blue, white and red vertical stripes", "flag:v:BWR"),
      utc("Paris", "UTC+1", false),
      clim("oceanic", "Paris has an oceanic climate: mild, with rain spread through the year.", "Pocket's climate graph: mild winters, warm summers, small rain bars every month.", "paris-climate"),
      plate("far from a boundary", "Paris sits in the middle of the Eurasian Plate, far from any boundary.", "Pocket picked a calm city in the middle of the Eurasian Plate, far from any plate boundary."),
    ],
  },
  {
    id: "berlin", name: "Berlin", map: "world", at: [52.52, 13.4], atSrc: C, country: "DE", scene: "city", local: "a tram driver",
    facts: [
      cont("Berlin", "Europe"), capital("Berlin", "Germany"), lang("Berlin", "German"), money("Berlin", "euro", "Germany"),
      flag("Germany", "black, red and gold horizontal stripes", "flag:h:KRY"),
      exp(TOP("cars"), "Pocket rode in a brand-new car. Cars are this country's top export.", "Cars are Germany's biggest export.", "My hideout's country sells more cars than anything else.", "exports"),
    ],
  },
  {
    id: "madrid", name: "Madrid", map: "world", at: [40.42, -3.7], atSrc: C, country: "ES", scene: "city", local: "a flamenco dancer",
    facts: [
      cont("Madrid", "Europe"), capital("Madrid", "Spain"), lang("Madrid", "Spanish"), money("Madrid", "euro", "Spain"),
      flag("Spain", "red, yellow and red stripes, the yellow twice as wide", "flag:h:RYYR"),
    ],
  },
  {
    id: "rome", name: "Rome", map: "world", at: [41.9, 12.5], atSrc: C, country: "IT", scene: "city", local: "a gelato maker",
    facts: [
      cont("Rome", "Europe"), capital("Rome", "Italy"), lang("Rome", "Italian"), money("Rome", "euro", "Italy"),
      flag("Italy", "green, white and red vertical stripes", "flag:v:GWR"),
    ],
  },
  {
    id: "dublin", name: "Dublin", map: "world", at: [53.35, -6.26], atSrc: C, country: "IE", scene: "harbor", local: "a fiddler",
    facts: [
      cont("Dublin", "Europe"), capital("Dublin", "Ireland"), lang("Dublin", "English and Irish"), money("Dublin", "euro", "Ireland"),
      flag("Ireland", "green, white and orange vertical stripes", "flag:v:GWO"),
    ],
  },
  {
    id: "moscow", name: "Moscow", map: "world", at: [55.76, 37.62], atSrc: C, country: "RU", scene: "city", local: "a ballet dancer",
    facts: [
      cont("Moscow", "Europe"), capital("Moscow", "Russia"), lang("Moscow", "Russian"), money("Moscow", "ruble", "Russia"),
      flag("Russia", "white, blue and red horizontal stripes", "flag:h:WBR"),
      exp("a top natural-gas exporter", "Pocket followed a giant gas pipeline from the world's biggest country.", "Russia is one of the world's largest exporters of natural gas.", "My hideout's country pipes natural gas to the world.", "exports"),
      utc("Moscow", "UTC+3", true),
      plate("far from a boundary", "Moscow sits in the middle of the Eurasian Plate, far from any boundary.", "Pocket picked a city in the middle of the Eurasian Plate, far from any plate boundary."),
      clim("humid continental", "Moscow has a humid continental climate: snowy winters below freezing and warm summers.", "Pocket's climate graph: winter months below 0°C, warm summers near 19°C, rain or snow every month.", "moscow-climate"),
    ],
  },
  {
    id: "rotterdam", name: "Rotterdam", map: "world", at: [51.92, 4.48], atSrc: C, country: "NL", scene: "port", mark: "ship", local: "a crane operator",
    facts: [
      cont("Rotterdam", "Europe"),
      utc("Rotterdam", "UTC+1", false),
      fact("trade", "Europe's largest port", "rotterdam", "Rotterdam, in the Netherlands, is the largest seaport in Europe.", "Pocket hid among stacks of shipping containers at EUROPE'S LARGEST PORT, on the North Sea.", "My hideout is Europe's largest port."),
      clim("oceanic", "Rotterdam has a mild, wet oceanic climate.", "Pocket's climate graph: mild winters, cool summers, rain bars in every month.", "paris-climate"),
      plate("far from a boundary", "The Netherlands lie in the middle of the Eurasian Plate.", "Pocket picked a flat, calm country in the middle of the Eurasian Plate."),
    ],
  },
  {
    id: "istanbul", name: "Istanbul", map: "world", at: [41.01, 28.95], atSrc: C, country: "TR", scene: "city", local: "a ferry captain",
    facts: [
      cont("Istanbul", "Europe"),
      utc("Istanbul", "UTC+3", true),
      plate("transform", "Istanbul is close to the North Anatolian Fault, a transform boundary where two plates slide past each other.", "A witness said the next city sits by a TRANSFORM fault, where plates slide sideways past each other."),
    ],
  },
  {
    id: "reykjavik", name: "Reykjavík", map: "world", at: [64.15, -21.94], atSrc: C, country: "IS", scene: "ice", mark: "volcano", local: "a volcano guide",
    facts: [
      cont("Reykjavík", "Europe"),
      utc("Reykjavík", "UTC+0", true),
      plate("divergent", "Iceland sits on the Mid-Atlantic Ridge, where the North American and Eurasian plates pull apart.", "Pocket stood where two plates PULL APART on a mid-ocean ridge that rises above the sea."),
      clim("subpolar oceanic", "Reykjavík has a subpolar oceanic climate: cool all year, mild for its far-north latitude.", "Pocket's climate graph: about 0°C in winter, only about 11°C in July, rain or snow every month.", "reykjavik-climate"),
      fact("energy", "geothermal heat", "iceland-energy", "Most homes in Iceland are heated with geothermal water from underground.", "Pocket warmed up in a house heated by hot water from volcanic rock: GEOTHERMAL heat.", "My hideout is heated by geothermal water."),
    ],
  },
  // ======================= Africa =======================
  {
    id: "nairobi", name: "Nairobi", map: "world", at: [-1.29, 36.82], atSrc: C, country: "KE", scene: "savanna", local: "a safari driver",
    facts: [
      cont("Nairobi", "Africa"), capital("Nairobi", "Kenya"), lang("Nairobi", "Swahili and English"), money("Nairobi", "Kenyan shilling", "Kenya"),
      flag("Kenya", "black, red and green stripes with a shield and spears"),
      exp("the top black-tea exporter", "Pocket sipped tea from the world's top exporter of black tea.", "Kenya is the world's largest exporter of black tea.", "My hideout's country exports the most black tea.", "kenya-tea"),
      utc("Nairobi", "UTC+3", true),
      plate("divergent", "Nairobi is beside the East African Rift, where Africa is slowly splitting apart.", "Pocket peered into a rift valley where a continent is slowly PULLING APART."),
      clim("subtropical highland", "Nairobi is near the equator but high up, so it has a mild subtropical highland climate.", "Pocket's climate graph: about 18°C all year even near the equator, with two rainy seasons.", "nairobi-climate"),
    ],
  },
  {
    id: "abuja", name: "Abuja", map: "world", at: [9.06, 7.49], atSrc: C, country: "NG", scene: "capitol", mark: "dome", local: "a drummer",
    facts: [
      cont("Abuja", "Africa"), capital("Abuja", "Nigeria"), lang("Abuja", "English", "English is Nigeria's official language, used in Abuja's government and schools; many people also speak Hausa, Yoruba or Igbo."), money("Abuja", "naira", "Nigeria"),
      flag("Nigeria", "green, white and green vertical stripes", "flag:v:GWG"),
      exp(TOP("crude oil"), "Pocket hitched a ride on an oil tanker. Crude oil is this country's top export.", "Crude oil is Nigeria's biggest export.", "My hideout's country sells crude oil above all.", "nigeria"),
    ],
  },
  {
    id: "lagos", name: "Lagos", map: "world", at: [6.52, 3.38], atSrc: C, country: "NG", scene: "port", mark: "ship", local: "a market trader",
    facts: [
      cont("Lagos", "Africa"),
      utc("Lagos", "UTC+1", true),
      fact("trade", "a big crude-oil exporter", "nigeria", "Lagos is Nigeria's biggest port, and crude oil is the country's main export.", "Pocket boarded a tanker in a country whose top export is CRUDE OIL, on the Gulf of Guinea.", "My hideout's country exports lots of oil."),
      fact("pop", "Africa's most populous country", "nigeria", "Nigeria has more people than any other African country: over 220 million (2023).", "A census poster: Pocket's next country has over 220 MILLION people (2023), the most in Africa.", "My hideout is in Africa's most populous country."),
      plate("far from a boundary", "Lagos is on the African Plate, far from a plate boundary.", "Pocket picked a coast in the middle of the African Plate, far from any boundary."),
    ],
  },
  {
    id: "capetown", name: "Cape Town", map: "world", at: [-33.92, 18.42], atSrc: C, country: "ZA", scene: "harbor", local: "a penguin ranger",
    facts: [
      cont("Cape Town", "Africa"),
      utc("Cape Town", "UTC+2", true),
      clim("Mediterranean", "Cape Town has a Mediterranean climate: dry summers and rainy winters (June to August).", "Pocket's climate graph: tall rain bars in JUNE to AUGUST, dry December to February, mild all year.", "capetown-climate"),
      plate("far from a boundary", "Cape Town is on the African Plate, far from a plate boundary.", "Pocket picked a quiet coast in the middle of the African Plate."),
    ],
  },
  // ======================= Asia =======================
  {
    id: "riyadh", name: "Riyadh", map: "world", at: [24.71, 46.68], atSrc: C, country: "SA", scene: "desert", mark: "oil", local: "a date seller",
    facts: [
      cont("Riyadh", "Asia"), capital("Riyadh", "Saudi Arabia"), lang("Riyadh", "Arabic"), money("Riyadh", "riyal", "Saudi Arabia"),
      flag("Saudi Arabia", "white Arabic writing and a sword on green", "flag:h:G:W"),
      plate("far from a boundary", "Riyadh is in the middle of the Arabian Plate, far from its edges.", "Pocket picked a desert city in the middle of the Arabian Plate, far from any boundary."),
      exp(TOP("crude oil"), "Pocket hitched a ride on an oil tanker. Crude oil is this country's top export.", "Crude oil is Saudi Arabia's top export; it is one of the world's largest oil exporters.", "My hideout's country sells crude oil above all.", "saudi"),
      utc("Riyadh", "UTC+3", true),
      fact("trade", "a big crude-oil exporter", "saudi", "Saudi Arabia is one of the world's largest exporters of crude oil.", "Pocket boarded a tanker in a country that is one of the world's biggest CRUDE OIL exporters.", "My hideout's country exports lots of oil."),
      clim("hot desert", "Riyadh has a hot desert climate: summer highs above 40°C and almost no rain.", "Pocket's climate graph: summer highs above 40°C, rain bars almost at zero all year.", "riyadh-climate"),
    ],
  },
  {
    id: "newdelhi", name: "New Delhi", map: "world", at: [28.61, 77.21], atSrc: C, country: "IN", scene: "capitol", mark: "dome", local: "a rickshaw driver",
    facts: [
      cont("New Delhi", "Asia"), capital("New Delhi", "India"), lang("New Delhi", "Hindi and English"), money("New Delhi", "Indian rupee", "India"),
      flag("India", "saffron, white and green stripes with a blue wheel", "flag:h:OWG:B"),
      utc("New Delhi", "UTC+5:30", true),
      fact("pop", "the most populous country", "india-pop", "In 2023 India passed China as the most populous country: about 1.43 billion people.", "A census poster: Pocket's next country has about 1.43 BILLION people, the most of any country (2023).", "My hideout is in the most populous country."),
    ],
  },
  {
    id: "kathmandu", name: "Kathmandu", map: "world", at: [27.72, 85.32], atSrc: C, country: "NP", scene: "peak", local: "a Sherpa guide",
    facts: [
      cont("Kathmandu", "Asia"),
      utc("Kathmandu", "UTC+5:45", true),
      plate("convergent", "Nepal sits where the India Plate pushes into the Eurasian Plate, piling up the Himalayas.", "Pocket went where two CONTINENTS COLLIDE and push up the world's tallest mountains."),
    ],
  },
  {
    id: "dhaka", name: "Dhaka", map: "world", at: [23.81, 90.41], atSrc: C, country: "BD", scene: "river", mark: "boat", local: "a rickshaw artist",
    facts: [
      cont("Dhaka", "Asia"),
      utc("Dhaka", "UTC+6", true),
      fact("pop", "the world's 2nd-largest city", "un-cities", "The UN counted about 37 million people in greater Dhaka in 2025, the 2nd-largest city on Earth.", "A UN report says Pocket's next city has about 37 MILLION people (2025), 2nd-largest on Earth.", "My hideout is the world's 2nd-largest city."),
      clim("tropical savanna", "Dhaka is warm all year, with heavy monsoon rains from June to September.", "Pocket's climate graph: warm all year, giant MONSOON rain bars June to September, dry winters.", "dhaka-climate"),
    ],
  },
  {
    id: "ulaanbaatar", name: "Ulaanbaatar", map: "world", at: [47.92, 106.92], atSrc: C, country: "MN", scene: "plains", local: "a yak herder",
    facts: [
      cont("Ulaanbaatar", "Asia"),
      utc("Ulaanbaatar", "UTC+8", true),
      clim("cold semi-arid", "Ulaanbaatar is the coldest national capital: dry, with January averages near −20°C.", "Pocket's climate graph: January near −20°C, a short warm summer, very little rain. Brrr!", "ulaanbaatar-climate"),
    ],
  },
  {
    id: "beijing", name: "Beijing", map: "world", at: [39.9, 116.41], atSrc: C, country: "CN", scene: "city", mark: "wall", local: "a kite maker",
    facts: [
      cont("Beijing", "Asia"), capital("Beijing", "China"), lang("Beijing", "Mandarin Chinese"), money("Beijing", "yuan (renminbi)", "China"),
      flag("China", "yellow stars on red", "flag:star:RY"),
    ],
  },
  {
    id: "shanghai", name: "Shanghai", map: "world", at: [31.23, 121.3], atSrc: C, country: "CN", scene: "port", mark: "ship", local: "a dock worker",
    facts: [
      cont("Shanghai", "Asia"),
      utc("Shanghai", "UTC+8", true),
      fact("trade", "the world's busiest container port", "shanghai", "Shanghai has been the world's busiest container port every year since 2010.", "Pocket hid in a container at the world's BUSIEST CONTAINER PORT, near the Yangtze's mouth.", "My hideout is the world's busiest container port."),
      clim("humid subtropical", "Shanghai has a humid subtropical climate: hot, rainy summers and cool winters.", "Pocket's climate graph: hot, wet summers near 28°C and cool winters near 5°C.", "shanghai-climate"),
      plate("far from a boundary", "Shanghai sits on the Eurasian Plate, far from its edges.", "Pocket picked a coastal city in the middle of the Eurasian Plate, far from any boundary."),
    ],
  },
  {
    id: "seoul", name: "Seoul", map: "world", at: [37.57, 126.98], atSrc: C, country: "KR", scene: "city", local: "a robot engineer",
    facts: [
      cont("Seoul", "Asia"), capital("Seoul", "South Korea"), lang("Seoul", "Korean"), money("Seoul", "won", "South Korea"),
      flag("South Korea", "a red-and-blue circle and four black bars on white"),
    ],
  },
  {
    id: "singapore", name: "Singapore", map: "world", at: [1.35, 103.82], atSrc: C, country: "SG", scene: "harbor", mark: "ship", local: "a hawker cook",
    facts: [
      cont("Singapore", "Asia"),
      utc("Singapore", "UTC+8", true),
      fact("pop", "a 100% urban city-state", "singapore", "Singapore is a city-state: all of its about 6 million people (2023) live in a city.", "Pocket went to a CITY-STATE where 100% of about 6 million people (2023) live in the city.", "Everyone in my hideout's country lives in one city."),
      fact("trade", "the world's 2nd-busiest container port", "singapore", "In 2024 Singapore was the world's 2nd-busiest container port, where ships swap cargo.", "Pocket hid at the world's 2nd-BUSIEST CONTAINER PORT, on a narrow strait where ships swap cargo.", "My hideout is a giant port where ships swap cargo."),
      clim("tropical rain forest", "Singapore has a tropical rain forest climate: hot and rainy in every month.", "Pocket's climate graph: about 27°C every month and tall rain bars all year, over 2,000 mm.", "singapore-climate"),
    ],
  },
  {
    id: "jakarta", name: "Jakarta", map: "world", at: [-6.35, 106.83], atSrc: C, country: "ID", scene: "city", local: "a batik artist",
    facts: [
      cont("Jakarta", "Asia"), capital("Jakarta", "Indonesia"), lang("Jakarta", "Indonesian"), money("Jakarta", "rupiah", "Indonesia"),
      flag("Indonesia", "a red stripe over a white stripe", "flag:h:RW"),
      utc("Jakarta", "UTC+7", true),
      fact("pop", "the world's largest city", "un-cities", "The UN counted about 42 million people in greater Jakarta in 2025, the largest city on Earth.", "A UN report says Pocket's next city has about 42 MILLION people (2025), the largest on Earth.", "My hideout is the world's largest city."),
      plate("convergent", "Off Java, the Indo-Australian Plate dives under the Sunda Plate: earthquakes and volcanoes.", "Pocket felt a quake where an ocean plate DIVES UNDER another plate, lined with volcanoes."),
      clim("tropical monsoon", "Jakarta has a tropical monsoon climate: hot all year with a very wet season.", "Pocket's climate graph: about 28°C all year, huge rain bars December to February, a drier mid-year.", "jakarta-climate"),
    ],
  },
  // ======================= Oceania =======================
  {
    id: "canberra", name: "Canberra", map: "world", at: [-35.28, 149.13], atSrc: C, country: "AU", scene: "capitol", mark: "dome", local: "a park ranger",
    facts: [
      cont("Canberra", "Australia"), capital("Canberra", "Australia"), lang("Canberra", "English"), money("Canberra", "Australian dollar", "Australia"),
      flag("Australia", "the Union Jack and white stars on blue"),
      exp("the top iron-ore exporter", "Pocket rode a train of IRON ORE. This country exports more of it than any other.", "Australia is the world's largest exporter of iron ore.", "My hideout's country exports the most iron ore.", "australia-iron"),
    ],
  },
  {
    id: "perth", name: "Perth", map: "world", at: [-31.95, 115.86], atSrc: C, country: "AU", scene: "harbor", local: "a surfer",
    facts: [
      cont("Perth", "Australia"),
      utc("Perth", "UTC+8", true),
      clim("Mediterranean", "Perth has a Mediterranean climate: hot, dry summers and rainy winters (June to August).", "Pocket's climate graph: tall rain bars in JUNE to AUGUST, hot and dry December to February.", "perth-climate"),
      fact("trade", "the top iron-ore exporter", "australia-iron", "Western Australia ships huge amounts of iron ore; Australia is the top exporter.", "Pocket rode an ore train to the coast of the world's biggest IRON ORE exporter.", "My hideout's state ships iron ore."),
      plate("far from a boundary", "Perth is in the middle of the Australian Plate.", "Pocket picked a city in the middle of the Australian Plate, far from any boundary."),
    ],
  },
  // ======================= South America =======================
  {
    id: "brasilia", name: "Brasília", map: "world", at: [-15.79, -47.88], atSrc: C, country: "BR", scene: "capitol", mark: "dome", local: "an architect",
    facts: [
      cont("Brasília", "South America"), capital("Brasília", "Brazil"), lang("Brasília", "Portuguese"), money("Brasília", "real", "Brazil"),
      flag("Brazil", "a yellow diamond and a blue globe on green", "flag:diamond:GYB"),
      exp("the top coffee grower", "Pocket hitched a ride on a coffee truck. This country grows more coffee than any other.", "Brazil is the world's largest coffee producer and exporter.", "My hideout's country grows the most coffee.", "coffee"),
    ],
  },
  {
    id: "buenosaires", name: "Buenos Aires", map: "world", at: [-34.6, -58.38], atSrc: C, country: "AR", scene: "harbor", local: "a tango dancer",
    facts: [
      cont("Buenos Aires", "South America"), capital("Buenos Aires", "Argentina"), lang("Buenos Aires", "Spanish"), money("Buenos Aires", "Argentine peso", "Argentina"),
      flag("Argentina", "light blue and white stripes with a gold sun", "flag:h:bWb:Y"),
    ],
  },
  {
    id: "lima", name: "Lima", map: "world", at: [-12.05, -77.04], atSrc: C, country: "PE", scene: "desert", local: "a ceviche chef",
    facts: [
      cont("Lima", "South America"), capital("Lima", "Peru"), lang("Lima", "Spanish and Quechua"), money("Lima", "sol", "Peru"),
      flag("Peru", "red, white and red vertical stripes", "flag:v:RWR"),
      exp(TOP("copper"), "Pocket rode a truck of COPPER ore. It's this country's biggest export.", "Copper is Peru's biggest export.", "My hideout's country sells copper above all.", "peru-copper"),
      utc("Lima", "UTC−5", true),
      plate("convergent", "Off Peru, the Nazca Plate dives under the South American Plate, causing earthquakes.", "Pocket felt a quake where the NAZCA Plate dives under a continent."),
      clim("hot desert", "Lima is a coastal desert city: cool ocean currents keep rain close to zero.", "Pocket's climate graph: rain bars almost at zero all year, mild temperatures about 17–23°C. A coastal desert!", "lima-climate"),
    ],
  },
  {
    id: "santiago", name: "Santiago", map: "world", at: [-33.45, -70.67], atSrc: C, country: "CL", scene: "mountains", local: "a skier",
    facts: [
      cont("Santiago", "South America"), capital("Santiago", "Chile"), utc("Santiago", "UTC−4", false), lang("Santiago", "Spanish"), money("Santiago", "Chilean peso", "Chile"),
      flag("Chile", "a white star on blue, with white and red stripes"),
      exp(TOP("copper"), "Pocket rode a truck of COPPER ore. It's this country's biggest export.", "Copper is Chile's biggest export; Chile mines more copper than any other country.", "My hideout's country sells copper above all.", "chile-copper"),
      fact("trade", "the top copper producer", "chile-copper", "Chile has been the world's top copper producer since 1983.", "Pocket hid in a COPPER mine truck in the world's top copper-producing country.", "My hideout's country mines the most copper."),
      plate("convergent", "Off Chile, the Nazca Plate dives under the South American Plate, raising the Andes.", "Pocket felt a quake where the NAZCA Plate dives under a continent and pushes up mountains."),
      clim("Mediterranean", "Santiago has a Mediterranean-type climate: dry summers and rainy winters (June to August).", "Pocket's climate graph: rain bars only in JUNE to AUGUST, dry warm summers.", "santiago-climate"),
    ],
  },
  {
    id: "bogota", name: "Bogotá", map: "world", at: [4.71, -74.07], atSrc: C, country: "CO", scene: "mountains", local: "a coffee farmer",
    facts: [
      cont("Bogotá", "South America"), capital("Bogotá", "Colombia"), lang("Bogotá", "Spanish"), money("Bogotá", "Colombian peso", "Colombia"),
      flag("Colombia", "a wide yellow stripe over blue and red", "flag:h:YYBR"),
      exp("a famous coffee grower", "Pocket hitched a ride on a coffee truck from famous mountain coffee farms.", "Colombia is one of the world's top coffee growers.", "My hideout's country grows famous coffee.", "coffee"),
    ],
  },
  {
    id: "quito", name: "Quito", map: "world", at: [-0.18, -78.47], atSrc: C, country: "EC", scene: "mountains", mark: "volcano", local: "a volcano watcher",
    facts: [
      cont("Quito", "South America"),
      utc("Quito", "UTC−5", true),
      clim("subtropical highland", "Quito is almost on the equator but 2,850 m high, so it is spring-like all year.", "Pocket's climate graph: a flat line near 14°C all year, right on the equator. High up!", "quito-climate"),
      plate("convergent", "Off Ecuador, the Nazca Plate dives under South America, feeding volcanoes like Cotopaxi.", "Pocket saw volcanoes fed by the NAZCA Plate diving under a continent."),
    ],
  },
  // ======================= North America =======================
  {
    id: "sf_w", name: "San Francisco", map: "world", at: [37.77, -122.42], atSrc: C, country: "US", scene: "bay", mark: "gate", local: "a cable car driver",
    facts: [
      cont("San Francisco", "North America"),
      utc("San Francisco", "UTC−8", false),
      plate("transform", "The San Andreas Fault runs past San Francisco: the Pacific and North American plates slide past each other.", "A witness said the next city sits by a TRANSFORM fault, where plates slide sideways past each other."),
      clim("Mediterranean", "San Francisco has a Mediterranean climate: dry summers and rainy winters.", "Pocket's climate graph: rain bars in NOVEMBER to MARCH, dry, foggy summers.", "sf-climate"),
    ],
  },
] as Place[]).map(lead);

/** Extra facts (and countries) for the grade 5 world places, used by grades 7 and 9–12. */
export const GLOBAL_EXTRA: Record<string, { country: string; facts: Fact[] }> = {
  washington_w: {
    country: "US",
    facts: [lang("Washington, D.C.", "English"), money("Washington, D.C.", "U.S. dollar", "The United States"), flag("the United States", "13 red and white stripes and 50 stars")],
  },
  ottawa: {
    country: "CA",
    facts: [lang("Ottawa", "English and French"), money("Ottawa", "Canadian dollar", "Canada"), flag("Canada", "a red maple leaf between red stripes", "flag:v:RWR:R")],
  },
  mexicocity: {
    country: "MX",
    facts: [
      lang("Mexico City", "Spanish"), money("Mexico City", "Mexican peso", "Mexico"),
      flag("Mexico", "green, white and red stripes with an eagle", "flag:v:GWR:N"),
      utc("Mexico City", "UTC−6", true),
      clim("subtropical highland", "Mexico City is 2,240 m high, so it is mild all year, with a rainy season from May to October.", "Pocket's climate graph: mild all year (about 14–19°C) with a rainy season May to October.", "mexicocity-climate"),
      plate("convergent", "The Cocos Plate dives under Mexico, so Mexico City feels strong earthquakes.", "Pocket felt a quake where the COCOS Plate dives under a continent."),
    ],
  },
  london: {
    country: "GB",
    facts: [lang("London", "English"), money("London", "pound sterling", "The United Kingdom"), flag("the United Kingdom", "red and white crosses on blue (the Union Jack)")],
  },
  cairo: {
    country: "EG",
    facts: [
      lang("Cairo", "Arabic"), money("Cairo", "Egyptian pound", "Egypt"),
      flag("Egypt", "red, white and black stripes with a gold eagle", "flag:h:RWK:Y"),
      utc("Cairo", "UTC+2", false),
      clim("hot desert", "Cairo has a hot desert climate: hot summers and almost no rain.", "Pocket's climate graph: summer highs near 35°C, rain bars almost at zero all year.", "cairo-climate"),
    ],
  },
  tokyo: {
    country: "JP",
    facts: [
      lang("Tokyo", "Japanese"), money("Tokyo", "yen", "Japan"),
      flag("Japan", "a red disc on white", "flag:disc:WR"),
      exp(TOP("cars"), "Pocket rode in a brand-new car. Cars are this country's top export.", "Cars are Japan's biggest export.", "My hideout's country sells more cars than anything else.", "exports"),
      utc("Tokyo", "UTC+9", true),
      fact("pop", "a country with an aging, shrinking population", "japan-pop", "Japan has about 124 million people (2023); the population is aging and shrinking.", "A census poster: Pocket's next country has about 124 MILLION people (2023), aging and SHRINKING.", "My hideout's country is aging and shrinking."),
      plate("convergent", "Japan sits where the Pacific and Philippine Sea plates dive under other plates: many earthquakes.", "Pocket felt a quake where the PACIFIC Plate dives under another plate along a deep trench."),
      clim("humid subtropical", "Tokyo has a humid subtropical climate: hot, rainy summers and cool winters.", "Pocket's climate graph: hot, wet summers near 27°C and cool, dry winters near 5°C.", "tokyo-climate"),
    ],
  },
  sydney: { country: "AU", facts: [] },
};
