import type { Fact, Place } from "@/chase/types";

/*
 * United States places (grade 3 "NC and its neighbors", grade 5 regions, capitals and landforms).
 * Regions follow the five-region model taught in NC grade 5 (Northeast, Southeast, Midwest,
 * Southwest, West). Washington, D.C. has no region fact on purpose (books disagree).
 */
const C = "coords";

const REGION_SAY: Record<string, string> = {
  West: "the West, with tall mountains and the Pacific coast",
  Southwest: "the Southwest, with deserts, canyons and big skies",
  Midwest: "the Midwest, with flat farmland, plains and the Great Lakes",
  Southeast: "the Southeast, with warm weather and long coasts",
  Northeast: "the Northeast, with old cities and rocky coasts",
};
const REGION_HINT: Record<string, string> = {
  West: "Pocket said the next stop is in the WEST region of the U.S.",
  Southwest: "Pocket said the next stop is in the SOUTHWEST region of the U.S.",
  Midwest: "Pocket said the next stop is in the MIDWEST region of the U.S.",
  Southeast: "Pocket said the next stop is in the SOUTHEAST region of the U.S.",
  Northeast: "Pocket said the next stop is in the NORTHEAST region of the U.S.",
};
const region = (name: string, v: string): Fact => ({
  k: "region", v, src: "regions",
  say: `${name} is in ${REGION_SAY[v]}.`,
  hint: REGION_HINT[v],
  note: `My hideout is in the ${v} region.`,
});
const capital = (name: string, state: string): Fact => ({
  k: "capital", v: state, src: "capitals",
  say: `${name} is the capital of ${state}.`,
  hint: `Pocket wanted to see the state capitol building of ${state.toUpperCase()}.`,
  note: `My hideout is in the capital city of ${state}.`,
});
const ocean = (name: string, v: string): Fact => ({
  k: "ocean", v, src: "coords",
  say: `${name} is on the ${v} side of the country.`,
  hint: `Pocket wanted to dip a toe in the ${v.toUpperCase()}.`,
  note: `My hideout is near the ${v}.`,
});

export const US_PLACES: Place[] = [
  // ---------------- West ----------------
  {
    id: "seattle", name: "Seattle", map: "us", at: [47.61, -122.33], atSrc: C, state: "WA", scene: "city", mark: "needle", local: "a ferry worker",
    facts: [
      region("Seattle", "West"),
      ocean("Seattle", "Pacific Ocean"),
      { k: "landmark", v: "Space Needle", src: "spaceneedle", say: "Seattle's Space Needle was built for the 1962 World's Fair.", hint: "Pocket rode to the top of a tower built for the 1962 World's Fair: the SPACE NEEDLE.", note: "My hideout has a tower shaped like a flying saucer on a stick." },
    ],
  },
  {
    id: "sanfrancisco", name: "San Francisco", map: "us", at: [37.77, -122.42], atSrc: C, state: "CA", scene: "bay", mark: "gate", local: "a cable car driver",
    facts: [
      region("San Francisco", "West"),
      ocean("San Francisco", "Pacific Ocean"),
      { k: "landmark", v: "Golden Gate Bridge", src: "goldengate", say: "San Francisco's Golden Gate Bridge opened in 1937.", hint: "Pocket crossed a big orange bridge called the GOLDEN GATE.", note: "My hideout is near a famous orange bridge." },
    ],
  },
  {
    id: "sacramento", name: "Sacramento", map: "us", at: [38.58, -121.49], atSrc: C, state: "CA", scene: "capitol", mark: "dome", local: "a gold-panning guide",
    facts: [
      region("Sacramento", "West"),
      capital("Sacramento", "California"),
      { k: "history", v: "gold rush", src: "sacramento", say: "Gold was found at Sutter's Mill near Sacramento in 1848, starting the California Gold Rush.", hint: "Pocket went panning for gold near where the 1848 GOLD RUSH began.", note: "My hideout is near where the California Gold Rush began." },
    ],
  },
  {
    id: "denver", name: "Denver", map: "us", at: [39.74, -104.99], atSrc: C, state: "CO", scene: "mountains", local: "a ski instructor",
    facts: [
      region("Denver", "West"),
      capital("Denver", "Colorado"),
      { k: "landform", v: "Rocky Mountains", src: "denver", say: "Denver sits where the high plains meet the Rocky Mountains.", hint: "Pocket could see the ROCKY MOUNTAINS from the city's front steps.", note: "The Rocky Mountains are right next to my hideout." },
      { k: "nickname", v: "Mile High City", src: "denver", say: "Denver is the Mile High City: a step of its capitol is one mile above sea level.", hint: "Pocket stood on a capitol step exactly ONE MILE above sea level.", note: "My hideout is one mile above sea level." },
    ],
  },
  {
    id: "saltlake", name: "Salt Lake City", map: "us", at: [40.76, -111.89], atSrc: C, state: "UT", scene: "lake", local: "a bird watcher",
    facts: [
      region("Salt Lake City", "West"),
      capital("Salt Lake City", "Utah"),
      { k: "lake", v: "Great Salt Lake", src: "saltlake", say: "The Great Salt Lake is the largest saltwater lake in the Western Hemisphere.", hint: "Pocket floated in the biggest SALTWATER LAKE in the Western Hemisphere.", note: "A giant salty lake is next to my hideout." },
    ],
  },
  {
    id: "yellowstone", name: "Yellowstone", map: "us", at: [44.46, -110.83], atSrc: C, state: "WY", scene: "geyser", mark: "geyser", local: "a park ranger",
    facts: [
      region("Yellowstone", "West"),
      { k: "landmark", v: "Old Faithful", src: "yellowstone", say: "Old Faithful in Yellowstone is a geyser that shoots hot water into the air again and again.", hint: "Pocket waited for a GEYSER named Old Faithful to erupt.", note: "A geyser erupts near my hideout." },
      { k: "history", v: "first national park", src: "yellowstone", say: "Yellowstone, mostly in Wyoming, became the first national park in 1872.", hint: "Pocket visited America's FIRST national park, from 1872.", note: "My hideout is in the first national park." },
    ],
  },
  // ---------------- Southwest ----------------
  {
    id: "grandcanyon", name: "the Grand Canyon", map: "us", at: [36.06, -112.14], atSrc: C, state: "AZ", scene: "canyon", local: "a mule guide",
    facts: [
      region("The Grand Canyon", "Southwest"),
      { k: "river", v: "Colorado River", src: "grandcanyon", say: "The Colorado River carved the Grand Canyon, about a mile deep.", hint: "Pocket looked down into a CANYON a mile deep, carved by the Colorado River.", vocab: true, note: "My hideout is at the bottom of a giant canyon." },
    ],
  },
  {
    id: "phoenix", name: "Phoenix", map: "us", at: [33.45, -112.07], atSrc: C, state: "AZ", scene: "desert", mark: "cactus", local: "a desert hiker",
    facts: [
      region("Phoenix", "Southwest"),
      capital("Phoenix", "Arizona"),
      { k: "landform", v: "Sonoran Desert", src: "phoenix", say: "Phoenix is in the Sonoran Desert, where tall saguaro cactuses grow.", hint: "Pocket hid behind a giant SAGUARO cactus in the Sonoran Desert.", note: "Giant cactuses grow around my hideout." },
    ],
  },
  {
    id: "santafe", name: "Santa Fe", map: "us", at: [35.69, -105.94], atSrc: C, state: "NM", scene: "adobe", local: "a potter",
    facts: [
      region("Santa Fe", "Southwest"),
      capital("Santa Fe", "New Mexico"),
      { k: "history", v: "oldest state capital", src: "santafe", say: "Santa Fe, founded in 1610, is the oldest state capital city in the U.S.", hint: "Pocket visited the OLDEST state capital city, founded in 1610.", note: "My hideout is in the oldest capital city in the country." },
    ],
  },
  {
    id: "austin", name: "Austin", map: "us", at: [30.27, -97.74], atSrc: C, state: "TX", scene: "city", mark: "bat", local: "a bat scientist",
    facts: [
      region("Austin", "Southwest"),
      capital("Austin", "Texas"),
      { k: "animal", v: "bats", src: "austin", say: "About 1.5 million bats live under a bridge in Austin and fly out at sunset.", hint: "Pocket watched about 1.5 million BATS fly out from under a city bridge.", note: "Millions of bats live near my hideout." },
    ],
  },
  // ---------------- Midwest ----------------
  {
    id: "rushmore", name: "Mount Rushmore", map: "us", at: [43.88, -103.46], atSrc: C, state: "SD", scene: "peak", mark: "faces", local: "a sculptor",
    facts: [
      region("Mount Rushmore", "Midwest"),
      { k: "landmark", v: "Mount Rushmore", src: "rushmore", say: "Mount Rushmore has the faces of four presidents carved into a mountain.", hint: "Pocket wanted to see four presidents' faces carved into a mountain.", note: "Four giant stone faces look over my hideout." },
      { k: "landform", v: "Black Hills", src: "rushmore", say: "Mount Rushmore is in the Black Hills of South Dakota.", hint: "Pocket hiked in the BLACK HILLS of South Dakota.", note: "My hideout is in the Black Hills." },
    ],
  },
  {
    id: "stlouis", name: "St. Louis", map: "us", at: [38.63, -90.19], atSrc: C, state: "MO", scene: "river", mark: "arch", local: "a riverboat captain",
    facts: [
      region("St. Louis", "Midwest"),
      { k: "river", v: "Mississippi River", src: "arch", say: "St. Louis is on the west bank of the Mississippi River.", hint: "Pocket rode a riverboat on the mighty MISSISSIPPI RIVER.", note: "The Mississippi River flows past my hideout." },
      { k: "landmark", v: "Gateway Arch", src: "arch", say: "St. Louis has the Gateway Arch, 630 feet tall, the tallest arch in the world.", hint: "Pocket rode a tiny tram to the top of a 630-foot steel ARCH.", note: "My hideout has a giant steel arch." },
    ],
  },
  {
    id: "chicago", name: "Chicago", map: "us", at: [41.88, -87.63], atSrc: C, state: "IL", scene: "city", local: "a sailor",
    facts: [
      region("Chicago", "Midwest"),
      { k: "lake", v: "Lake Michigan", src: "chicago", say: "Chicago's skyline stretches along Lake Michigan, one of the Great Lakes.", hint: "Pocket saw skyscrapers along LAKE MICHIGAN, one of the Great Lakes.", note: "My hideout is on one of the Great Lakes." },
      { k: "landmark", v: "Willis Tower", src: "chicago", say: "Chicago's Willis Tower is 110 floors tall.", hint: "Pocket rode an elevator up a 110-floor skyscraper called the Willis Tower.", note: "My hideout has a 110-floor tower." },
    ],
  },
  // ---------------- Southeast ----------------
  {
    id: "neworleans", name: "New Orleans", map: "us", at: [29.95, -90.07], atSrc: C, state: "LA", scene: "river", mark: "horn", local: "a trumpet player",
    facts: [
      region("New Orleans", "Southeast"),
      { k: "river", v: "Mississippi River", src: "neworleans", say: "New Orleans is near the mouth of the Mississippi River.", hint: "Pocket floated down the Mississippi River almost to where it meets the sea.", note: "My hideout is near the end of the Mississippi River." },
      { k: "music", v: "jazz", src: "neworleans", say: "New Orleans is called the birthplace of jazz music.", hint: "Pocket danced to music in the city called the birthplace of JAZZ.", note: "My hideout is where jazz was born." },
    ],
  },
  {
    id: "nashville", name: "Nashville", map: "us", at: [36.16, -86.78], atSrc: C, state: "TN", scene: "city", mark: "guitar", local: "a singer",
    facts: [
      region("Nashville", "Southeast"),
      capital("Nashville", "Tennessee"),
      { k: "music", v: "country music", src: "nashville", say: "Nashville is Music City, home of the Grand Ole Opry country music show.", hint: "Pocket sang at the Grand Ole Opry in MUSIC CITY.", note: "My hideout is in Music City." },
      { k: "border", v: "west", src: "ncneighbors", say: "Tennessee is North Carolina's neighbor to the west.", hint: "Pocket crossed into the state next door to the WEST of North Carolina.", note: "My hideout is in NC's neighbor to the west." },
    ],
  },
  {
    id: "atlanta", name: "Atlanta", map: "us", at: [33.75, -84.39], atSrc: C, state: "GA", scene: "city", local: "a peach seller",
    facts: [
      region("Atlanta", "Southeast"),
      capital("Atlanta", "Georgia"),
      { k: "border", v: "southwest", src: "ncneighbors", say: "Georgia touches North Carolina's southwest corner.", hint: "Pocket crossed into the state that touches NC's SOUTHWEST corner.", note: "My hideout is in the state at NC's southwest corner." },
    ],
  },
  {
    id: "everglades", name: "the Everglades", map: "us", at: [25.6, -80.8], atSrc: C, state: "FL", scene: "swamp", mark: "gator", local: "an airboat driver",
    facts: [
      region("The Everglades", "Southeast"),
      { k: "animal", v: "alligators and crocodiles", src: "everglades", say: "The Everglades in Florida is the only place where alligators and crocodiles live side by side.", hint: "Pocket saw ALLIGATORS and CROCODILES living side by side.", note: "Alligators AND crocodiles swim near my hideout." },
    ],
  },
  {
    id: "richmond", name: "Richmond", map: "us", at: [37.54, -77.44], atSrc: C, state: "VA", scene: "capitol", mark: "dome", local: "a tour guide",
    facts: [
      region("Richmond", "Southeast"),
      capital("Richmond", "Virginia"),
      { k: "border", v: "north", src: "ncneighbors", say: "Virginia is North Carolina's neighbor to the north.", hint: "Pocket crossed into the state next door to the NORTH of North Carolina.", note: "My hideout is in NC's neighbor to the north." },
    ],
  },
  {
    id: "columbia", name: "Columbia", map: "us", at: [34.0, -81.03], atSrc: C, state: "SC", scene: "capitol", mark: "dome", local: "a mail carrier",
    facts: [
      region("Columbia", "Southeast"),
      capital("Columbia", "South Carolina"),
      { k: "border", v: "south", src: "ncneighbors", say: "South Carolina is North Carolina's neighbor to the south.", hint: "Pocket crossed into the state next door to the SOUTH of North Carolina.", note: "My hideout is in NC's neighbor to the south." },
    ],
  },
  {
    id: "raleigh_us", name: "Raleigh", map: "us", at: [35.78, -78.64], atSrc: C, state: "NC", scene: "capitol", mark: "dome", local: "a tour guide",
    facts: [
      region("Raleigh", "Southeast"),
      capital("Raleigh", "North Carolina"),
      { k: "border", v: "home state", src: "ncneighbors", say: "Raleigh is in our own state, North Carolina.", hint: "Pocket flew home to our own state's capital.", note: "My hideout is in our home state." },
    ],
  },
  {
    id: "dc", name: "Washington, D.C.", map: "us", at: [38.9, -77.04], atSrc: C, state: "DC", scene: "capitol", mark: "dome", local: "a White House guide",
    facts: [
      { k: "capital", v: "the United States", src: "dc", say: "Washington, D.C. is the capital of the whole United States.", hint: "Pocket wanted to see the CAPITAL of the whole United States.", note: "My hideout is in our nation's capital." },
      { k: "landmark", v: "White House", src: "dc", say: "The President lives and works in the White House in Washington, D.C.", hint: "Pocket waved at the WHITE HOUSE, where the President lives.", note: "The President's house is near my hideout." },
    ],
  },
  // ---------------- Northeast ----------------
  {
    id: "nyc", name: "New York City", map: "us", at: [40.71, -74.01], atSrc: C, state: "NY", scene: "harbor", mark: "liberty", local: "a ferry captain",
    facts: [
      region("New York City", "Northeast"),
      ocean("New York City", "Atlantic Ocean"),
      { k: "landmark", v: "Statue of Liberty", src: "liberty", say: "The Statue of Liberty, a gift from France, stands in New York Harbor.", hint: "Pocket waved at a giant statue holding a torch, a gift from FRANCE.", note: "A statue with a torch stands near my hideout." },
    ],
  },
  {
    id: "boston", name: "Boston", map: "us", at: [42.36, -71.06], atSrc: C, state: "MA", scene: "harbor", local: "a history guide",
    facts: [
      region("Boston", "Northeast"),
      capital("Boston", "Massachusetts"),
      ocean("Boston", "Atlantic Ocean"),
      { k: "history", v: "Freedom Trail", src: "freedomtrail", say: "Boston's Freedom Trail links 16 places from the American Revolution.", hint: "Pocket walked the FREEDOM TRAIL past 16 places from the American Revolution.", note: "The Freedom Trail runs through my hideout." },
    ],
  },
];
