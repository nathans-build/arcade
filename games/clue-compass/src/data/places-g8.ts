import type { Fact, Place } from "@/chase/types";

/*
 * Grade 8: North Carolina and U.S. geography in depth (physical and human geography, cities,
 * ports, highways, trade, population). New pins for Durham, High Point, Fayetteville, Morehead
 * City, Los Angeles, Houston, Savannah, Detroit and Pittsburgh; the K–5 NC and U.S. places get
 * extra grade 8 facts through G8_EXTRA (their K–5 entries stay untouched).
 * Population figures are 2020 Census counts, rounded.
 */
const C = "coords";

const fact = (k: string, v: string, src: string, say: string, hint: string, note: string): Fact => ({ k, v, src, say, hint, note });

const ncRegion = (name: string, v: "Piedmont" | "Coastal Plain"): Fact =>
  v === "Piedmont"
    ? fact("region", v, "nc-regions", `${name} is in the Piedmont, the region of rolling hills in the middle of North Carolina.`, "Pocket headed for the rolling hills in the middle of the state: the PIEDMONT.", "My hideout is in the Piedmont, where the hills roll.")
    : fact("region", v, "nc-regions", `${name} is in the Coastal Plain, the low, flat region by the ocean.`, "Pocket wanted low, flat land near the ocean: the COASTAL PLAIN region.", "My hideout is in the Coastal Plain, low and flat.");
const usRegion = (name: string, v: string, say: string): Fact =>
  fact("region", v, "regions", `${name} is in ${say}.`, `Pocket said the next stop is in the ${v.toUpperCase()} region of the U.S.`, `My hideout is in the ${v} region.`);

/** "NC's 2nd-largest city" style population facts (2020 Census). */
const ncPop = (name: string, rank: string, people: string): Fact =>
  fact(
    "pop", `NC's ${rank} city`, "nc-census",
    `${name} is North Carolina's ${rank} city, with about ${people} people (2020 Census).`,
    `A census table on the bus: Pocket's next city had about ${people} people in 2020, NC's ${rank.toUpperCase()}.`,
    `My hideout is NC's ${rank} city (2020 Census).`,
  );
const usPop = (name: string, rank: string, people: string): Fact =>
  fact(
    "pop", `the ${rank} U.S. city`, "us-census",
    `${name} is the ${rank} city in the United States, with about ${people} people (2020 Census).`,
    `A census chart: Pocket's next city had about ${people} people in 2020, the ${rank.toUpperCase()} in the U.S.`,
    `My hideout is the ${rank} city in the U.S.`,
  );
const road = (name: string, v: string): Fact =>
  fact("highway", v, "nc-highways", `Interstate ${v.slice(2)} runs through ${name}.`, `Pocket's truck driver said they rolled down ${v} to get there.`, `My hideout is on ${v}.`);
const deepwater = (name: string, where: string): Fact =>
  fact("port", "a deepwater port", "ncports", `${name} has one of North Carolina's two deepwater ports, ${where}.`, "Pocket stowed away on a cargo ship at one of NC's two DEEPWATER PORTS.", "My hideout has one of NC's two deepwater ports.");

export const G8_PLACES: Place[] = [
  // ---------------- North Carolina ----------------
  {
    id: "durham", name: "Durham", map: "nc", at: [35.99, -78.9], atSrc: C, state: "NC", scene: "campus", local: "a lab scientist",
    facts: [
      ncRegion("Durham", "Piedmont"),
      ncPop("Durham", "4th-largest", "283,500"),
      fact("econ", "research", "rtp", "Most of Research Triangle Park, the largest research park in the U.S., is in Durham County.", "Pocket sneaked into the largest RESEARCH PARK in the U.S., full of labs and tech companies.", "My hideout is next to the biggest research park in the U.S."),
      road("Durham", "I-85"),
      road("Durham", "I-40"),
    ],
  },
  {
    id: "highpoint", name: "High Point", map: "nc", at: [35.96, -80.01], atSrc: C, state: "NC", scene: "city", local: "a furniture designer",
    facts: [
      ncRegion("High Point", "Piedmont"),
      fact("econ", "furniture", "highpoint", "High Point hosts the world's largest home-furnishings trade show twice a year.", "Pocket tried out sofas at the world's biggest FURNITURE trade show, held twice a year.", "My hideout is the home-furnishings capital."),
    ],
  },
  {
    id: "fayetteville", name: "Fayetteville", map: "nc", at: [35.05, -78.88], atSrc: C, state: "NC", scene: "city", local: "a soldier",
    facts: [
      ncRegion("Fayetteville", "Coastal Plain"),
      ncPop("Fayetteville", "6th-largest", "208,500"),
      fact("econ", "Army base", "fayetteville", "Fayetteville is next to one of the largest U.S. Army bases, a huge part of its economy.", "Pocket saw paratroopers practice. The next city sits beside one of the biggest U.S. ARMY BASES.", "My hideout is next to a giant Army base."),
      road("Fayetteville", "I-95"),
    ],
  },
  {
    id: "moreheadcity", name: "Morehead City", map: "nc", at: [34.72, -76.73], atSrc: C, state: "NC", scene: "port", mark: "ship", local: "a harbor pilot",
    facts: [
      ncRegion("Morehead City", "Coastal Plain"),
      deepwater("Morehead City", "reached from the ocean through Beaufort Inlet"),
      fact("inlet", "Beaufort Inlet", "ncports", "Ships reach Morehead City's port straight from the ocean through Beaufort Inlet.", "Pocket's ship came straight in from the ocean through BEAUFORT INLET.", "Ships reach my hideout through Beaufort Inlet."),
      fact("climate", "hurricanes", "nc-regions", "Morehead City is right on the coast, so people there get ready for hurricanes.", "Pocket bought a hurricane kit. Big ocean storms can hit there!", "My hideout is on the coast where hurricanes can blow in."),
    ],
  },
  // ---------------- United States ----------------
  {
    id: "losangeles", name: "Los Angeles", map: "us", at: [34.05, -118.24], atSrc: C, state: "CA", scene: "harbor", mark: "ship", local: "a film crew member",
    facts: [
      usRegion("Los Angeles", "West", "the West, with tall mountains and the Pacific coast"),
      usPop("Los Angeles", "2nd-largest", "3.9 million"),
      fact("port", "the busiest U.S. container port", "portla", "The Port of Los Angeles is the busiest container port in the U.S., the main gate for goods from Asia.", "Pocket hid in a container at the BUSIEST container port in the U.S., the main gate for goods from Asia.", "My hideout is the busiest U.S. container port."),
      fact("industry", "movies and TV", "losangeles", "Hollywood, in Los Angeles, is the center of the U.S. movie and TV industry.", "Pocket tried to get a part in a MOVIE. The next city is the heart of film and TV.", "My hideout makes movies and TV shows."),
      fact("ocean", "Pacific Ocean", "coords", "Los Angeles is on the Pacific Ocean side of the country.", "Pocket wanted to dip a toe in the PACIFIC OCEAN.", "My hideout is near the Pacific Ocean."),
    ],
  },
  {
    id: "houston", name: "Houston", map: "us", at: [29.76, -95.37], atSrc: C, state: "TX", scene: "port", mark: "oil", local: "a ship pilot",
    facts: [
      usRegion("Houston", "Southwest", "the Southwest, with deserts, canyons and big skies"),
      usPop("Houston", "4th-largest", "2.3 million"),
      fact("port", "the U.S. port with the most foreign cargo", "porthouston", "Port Houston ranks first in the U.S. for foreign waterborne tonnage, much of it oil and chemicals.", "Pocket's ship docked at the U.S. port that handles the most FOREIGN cargo by weight.", "My hideout's port handles the most foreign cargo by weight."),
      fact("industry", "oil and energy", "porthouston", "Houston is the center of the U.S. oil and energy industry.", "Pocket toured refineries in the ENERGY capital of the U.S.", "My hideout is the U.S. energy capital."),
    ],
  },
  {
    id: "savannah", name: "Savannah", map: "us", at: [32.08, -81.09], atSrc: C, state: "GA", scene: "harbor", mark: "ship", local: "a tugboat captain",
    facts: [
      usRegion("Savannah", "Southeast", "the Southeast, with warm weather and long coasts"),
      fact("port", "the largest single container terminal in North America", "savannah", "Savannah's Garden City Terminal is the largest single-terminal container facility in North America.", "Pocket hid in the LARGEST SINGLE CONTAINER TERMINAL in North America, up a river from the Atlantic.", "My hideout has the largest single container terminal."),
    ],
  },
  {
    id: "detroit", name: "Detroit", map: "us", at: [42.33, -83.05], atSrc: C, state: "MI", scene: "city", local: "an auto worker",
    facts: [
      usRegion("Detroit", "Midwest", "the Midwest, with flat farmland, plains and the Great Lakes"),
      fact("industry", "cars", "detroit", "Detroit is the Motor City, the center of the U.S. car industry.", "Pocket test-drove a car in the MOTOR CITY.", "My hideout is the Motor City."),
      fact("crossing", "busiest U.S.–Canada trade crossing", "detroit", "The Ambassador Bridge to Windsor, Canada, carries about a quarter of U.S.–Canada trade.", "Pocket crossed a bridge that carries about a QUARTER of all U.S.–CANADA trade.", "My hideout has the busiest bridge to Canada."),
    ],
  },
  {
    id: "pittsburgh", name: "Pittsburgh", map: "us", at: [40.44, -80.0], atSrc: C, state: "PA", scene: "river", mark: "bridge", local: "a bridge painter",
    facts: [
      usRegion("Pittsburgh", "Northeast", "the Northeast, with old cities and rocky coasts"),
      fact("industry", "steel", "pittsburgh", "Pittsburgh was once one of the world's biggest steel makers: the Steel City.", "Pocket visited the STEEL CITY, once one of the world's biggest steel makers.", "My hideout is the Steel City."),
      fact("confluence", "where the Ohio River begins", "pittsburgh", "In Pittsburgh the Allegheny and Monongahela rivers meet to form the Ohio River.", "Pocket watched two rivers, the Allegheny and Monongahela, meet and form the OHIO River.", "My hideout is where the Ohio River begins."),
    ],
  },
];

/** Extra grade 8 facts for K–5 NC and U.S. places. */
export const G8_EXTRA: Record<string, Fact[]> = {
  charlotte: [
    ncPop("Charlotte", "largest", "874,600"),
    fact("econ", "banking", "charlotte-bank", "Charlotte is the second-largest banking center in the U.S., after New York City.", "Pocket counted bank towers in the 2nd-largest BANKING center in the U.S.", "My hideout is a giant banking center."),
    fact("hub", "a giant airline hub", "clt", "Charlotte Douglas is one of the busiest U.S. airports, a giant hub for American Airlines.", "Pocket changed planes at a GIANT AIRLINE HUB, one of the busiest airports in the U.S.", "My hideout has a giant airline hub."),
    road("Charlotte", "I-85"),
    road("Charlotte", "I-77"),
  ],
  raleigh: [ncPop("Raleigh", "2nd-largest", "467,700"), road("Raleigh", "I-40")],
  greensboro: [ncPop("Greensboro", "3rd-largest", "299,000"), road("Greensboro", "I-40"), road("Greensboro", "I-85")],
  oldsalem: [ncPop("Winston-Salem", "5th-largest", "249,500"), road("Winston-Salem", "I-40")],
  wilmington: [deepwater("Wilmington", "on the Cape Fear River"), road("Wilmington", "I-40")],
  asheville: [road("Asheville", "I-26"), road("Asheville", "I-40")],
  // ---- U.S.
  nyc: [
    usPop("New York City", "largest", "8.8 million"),
    fact("port", "the busiest East Coast port", "portnynj", "The Port of New York and New Jersey is the busiest port on the East Coast.", "Pocket hid in a container at the BUSIEST PORT ON THE EAST COAST.", "My hideout is the busiest East Coast port."),
  ],
  chicago: [
    usPop("Chicago", "3rd-largest", "2.7 million"),
    fact("hub", "the biggest U.S. rail hub", "chicago-rail", "Chicago is the biggest railroad hub in the U.S.; six of the seven largest railroads meet there.", "Pocket hopped freight trains to the BIGGEST RAILROAD HUB in the U.S.", "My hideout is the biggest U.S. rail hub."),
  ],
  phoenix: [usPop("Phoenix", "5th-largest", "1.6 million")],
  atlanta: [fact("hub", "the world's busiest passenger airport", "atlanta", "Atlanta's airport is the busiest passenger airport in the world.", "Pocket changed planes at the world's BUSIEST PASSENGER AIRPORT.", "My hideout has the world's busiest airport.")],
  sanfrancisco: [fact("industry", "tech companies", "sanfrancisco", "The San Francisco Bay Area, with Silicon Valley, is a world center of tech companies.", "Pocket visited TECH companies near Silicon Valley, on a famous bay.", "My hideout is a tech capital.")],
};
