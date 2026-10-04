import type { Place } from "@/chase/types";

/*
 * World map: the 7 continents and 5 oceans (grades 1–2, picture clues) and a few capital cities
 * (grade 5). Continent and ocean pins sit at a label point inside the continent or open ocean;
 * the tests check each pin lands on the right land mass (or on water for oceans).
 */
const C = "coords";

export const WORLD_PLACES: Place[] = [
  // ---------------- continents ----------------
  {
    id: "northamerica", name: "North America", map: "world", at: [45, -100], atSrc: C, scene: "plains", mark: "bison", local: "a rancher",
    facts: [
      { k: "kind", v: "continent", src: "continents", say: "North America is a continent, a huge piece of land.", hint: "Pocket went to a big piece of LAND.", note: "My hideout is on land!", icon: "land" },
      { k: "animal", v: "bison", src: "bison", say: "Bison roam the plains of North America.", hint: "Pocket went to see big furry BISON.", note: "Bison live near my hideout!", icon: "bison" },
      { k: "home", v: "our continent", src: "continents", say: "North America is our home continent. North Carolina is on it!", hint: "Pocket went back to OUR home continent.", note: "My hideout is on our home continent!", icon: "home" },
    ],
  },
  {
    id: "southamerica", name: "South America", map: "world", at: [-12, -60], atSrc: C, scene: "rainforest", mark: "llama", local: "a llama herder",
    facts: [
      { k: "kind", v: "continent", src: "continents", say: "South America is a continent, a huge piece of land.", hint: "Pocket went to a big piece of LAND.", note: "My hideout is on land!", icon: "land" },
      { k: "animal", v: "llama", src: "llama", say: "Llamas live in the Andes Mountains of South America.", hint: "Pocket went to pet a fluffy LLAMA.", note: "Llamas live near my hideout!", icon: "llama" },
      { k: "river", v: "Amazon River", src: "continents", say: "The Amazon River flows through the rain forest of South America.", hint: "Pocket paddled the AMAZON River in the rain forest.", note: "My hideout is by the Amazon River!", icon: "river" },
    ],
  },
  {
    id: "europe", name: "Europe", map: "world", at: [50, 15], atSrc: C, scene: "city", mark: "eiffel", local: "a baker",
    facts: [
      { k: "kind", v: "continent", src: "continents", say: "Europe is a continent, a huge piece of land.", hint: "Pocket went to a big piece of LAND.", note: "My hideout is on land!", icon: "land" },
      { k: "landmark", v: "Eiffel Tower", src: "continents", say: "The Eiffel Tower is in Paris, France, in Europe.", hint: "Pocket climbed the EIFFEL TOWER.", note: "The Eiffel Tower is near my hideout!", icon: "eiffel" },
    ],
  },
  {
    id: "africa", name: "Africa", map: "world", at: [5, 20], atSrc: C, scene: "savanna", mark: "pyramid", local: "a guide",
    facts: [
      { k: "kind", v: "continent", src: "continents", say: "Africa is a continent, a huge piece of land.", hint: "Pocket went to a big piece of LAND.", note: "My hideout is on land!", icon: "land" },
      { k: "landmark", v: "pyramids", src: "cairo", say: "The great pyramids are in Egypt, in Africa.", hint: "Pocket went to see the giant PYRAMIDS.", note: "Pyramids are near my hideout!", icon: "pyramid" },
      { k: "desert", v: "Sahara", src: "sahara", say: "The Sahara, the biggest hot desert, is in Africa.", hint: "Pocket crossed the biggest HOT DESERT.", note: "My hideout is in a big hot desert!", icon: "desert" },
    ],
  },
  {
    id: "asia", name: "Asia", map: "world", at: [45, 90], atSrc: C, scene: "mountains", mark: "wall", local: "a panda keeper",
    facts: [
      { k: "kind", v: "continent", src: "continents", say: "Asia is a continent, a huge piece of land.", hint: "Pocket went to a big piece of LAND.", note: "My hideout is on land!", icon: "land" },
      { k: "size", v: "largest continent", src: "continents", say: "Asia is the biggest continent.", hint: "Pocket went to the BIGGEST continent.", note: "My hideout is on the biggest continent!", icon: "say:BIG" },
      { k: "animal", v: "giant panda", src: "panda", say: "Wild giant pandas live only in China, in Asia.", hint: "Pocket went to see a GIANT PANDA.", note: "Pandas live near my hideout!", icon: "panda" },
      { k: "landmark", v: "Great Wall", src: "continents", say: "The Great Wall of China is in Asia.", hint: "Pocket walked along the GREAT WALL.", note: "The Great Wall is near my hideout!", icon: "wall" },
    ],
  },
  {
    id: "australia", name: "Australia", map: "world", at: [-25, 134], atSrc: C, scene: "outback", mark: "kangaroo", local: "a kangaroo keeper",
    facts: [
      { k: "kind", v: "continent", src: "continents", say: "Australia is a continent, a huge piece of land.", hint: "Pocket went to a big piece of LAND.", note: "My hideout is on land!", icon: "land" },
      { k: "size", v: "smallest continent", src: "continents", say: "Australia is the smallest continent.", hint: "Pocket went to the SMALLEST continent.", note: "My hideout is on the smallest continent!", icon: "say:SMALL" },
      { k: "animal", v: "kangaroo", src: "kangaroo", say: "Kangaroos hop around Australia.", hint: "Pocket went to see a hopping KANGAROO.", note: "Kangaroos hop near my hideout!", icon: "kangaroo" },
    ],
  },
  {
    id: "antarctica", name: "Antarctica", map: "world", at: [-79, 20], atSrc: C, scene: "ice", mark: "penguin", local: "a scientist",
    facts: [
      { k: "kind", v: "continent", src: "continents", say: "Antarctica is a continent covered in ice.", hint: "Pocket went to a big piece of LAND.", note: "My hideout is on land!", icon: "land" },
      { k: "animal", v: "emperor penguin", src: "penguin", say: "Emperor penguins live in icy Antarctica.", hint: "Pocket went to see EMPEROR PENGUINS.", note: "Penguins waddle near my hideout!", icon: "penguin" },
      { k: "climate", v: "icy cold", src: "penguin", say: "Antarctica, at the South Pole, is covered in ice.", hint: "Pocket went where it is ICY COLD all year.", note: "My hideout is icy cold!", icon: "snow" },
    ],
  },
  // ---------------- oceans ----------------
  {
    id: "pacific", name: "the Pacific Ocean", map: "world", at: [5, -140], atSrc: C, scene: "ocean", mark: "whale", local: "a sailor",
    facts: [
      { k: "kind", v: "ocean", src: "oceans", say: "The Pacific is an ocean, a huge body of salt water.", hint: "Pocket sailed off into a big salty OCEAN.", note: "My hideout is in an ocean!", icon: "wave" },
      { k: "size", v: "largest ocean", src: "oceans", say: "The Pacific is the biggest ocean.", hint: "Pocket sailed on the BIGGEST ocean.", note: "My hideout is in the biggest ocean!", icon: "say:BIG" },
    ],
  },
  {
    id: "atlantic", name: "the Atlantic Ocean", map: "world", at: [25, -40], atSrc: C, scene: "ocean", mark: "ship", local: "a ship captain",
    facts: [
      { k: "kind", v: "ocean", src: "oceans", say: "The Atlantic is an ocean, a huge body of salt water.", hint: "Pocket sailed off into a big salty OCEAN.", note: "My hideout is in an ocean!", icon: "wave" },
      { k: "home", v: "touches North Carolina", src: "oceans", say: "The Atlantic Ocean touches North Carolina's beaches.", hint: "Pocket swam in the ocean by NC's beaches.", note: "My hideout's waves touch NC's beaches!", icon: "beach" },
    ],
  },
  {
    id: "indian", name: "the Indian Ocean", map: "world", at: [-20, 75], atSrc: C, scene: "ocean", local: "a fisher",
    facts: [
      { k: "kind", v: "ocean", src: "oceans", say: "The Indian Ocean is an ocean, a huge body of salt water.", hint: "Pocket sailed off into a big salty OCEAN.", note: "My hideout is in an ocean!", icon: "wave" },
      { k: "between", v: "Africa and Australia", src: "oceans", say: "The Indian Ocean lies between Africa and Australia.", hint: "Pocket sailed between AFRICA and AUSTRALIA.", note: "My hideout is between Africa and Australia!", icon: "between" },
    ],
  },
  {
    id: "arctic", name: "the Arctic Ocean", map: "world", at: [76, -160], atSrc: C, scene: "ice", mark: "polarbear", local: "an ice-breaker captain",
    facts: [
      { k: "kind", v: "ocean", src: "oceans", say: "The Arctic is an ocean, a body of salt water near the North Pole.", hint: "Pocket sailed off into a big salty OCEAN.", note: "My hideout is in an ocean!", icon: "wave" },
      { k: "size", v: "smallest ocean", src: "oceans", say: "The Arctic is the smallest ocean.", hint: "Pocket sailed on the SMALLEST ocean.", note: "My hideout is in the smallest ocean!", icon: "say:SMALL" },
      { k: "animal", v: "polar bear", src: "polarbear", say: "Polar bears hunt on the Arctic sea ice.", hint: "Pocket went to see a POLAR BEAR.", note: "Polar bears live near my hideout!", icon: "polarbear" },
    ],
  },
  {
    id: "southern", name: "the Southern Ocean", map: "world", at: [-62, 100], atSrc: C, scene: "ice", local: "a penguin scientist",
    facts: [
      { k: "kind", v: "ocean", src: "oceans", say: "The Southern Ocean is an ocean, a body of salt water.", hint: "Pocket sailed off into a big salty OCEAN.", note: "My hideout is in an ocean!", icon: "wave" },
      { k: "around", v: "Antarctica", src: "oceans", say: "The Southern Ocean goes all the way around Antarctica.", hint: "Pocket sailed in a circle all the way AROUND ANTARCTICA.", note: "My hideout's ocean circles Antarctica!", icon: "ring" },
    ],
  },
  // ---------------- capital cities (grade 5) ----------------
  {
    id: "washington_w", name: "Washington, D.C.", map: "world", at: [38.9, -77.04], atSrc: C, scene: "capitol", mark: "dome", local: "a White House guide",
    facts: [
      { k: "continent", v: "North America", src: "continents", say: "Washington, D.C., our nation's capital, is in North America." },
      { k: "capital", v: "the United States", src: "dc", say: "Washington, D.C. is the capital of the United States.", hint: "Pocket flew home to the capital of the United States." },
    ],
  },
  {
    id: "ottawa", name: "Ottawa", map: "world", at: [45.42, -75.7], atSrc: C, scene: "capitol", local: "a hockey coach",
    facts: [
      { k: "continent", v: "North America", src: "continents", say: "Ottawa is in North America.", hint: "Pocket stayed on our own continent, NORTH AMERICA.", note: "My hideout is in North America." },
      { k: "capital", v: "Canada", src: "ottawa", say: "Ottawa is the capital of Canada.", hint: "Pocket went to the capital of CANADA.", note: "My hideout is the capital of Canada." },
      { k: "border", v: "north", src: "ottawa", say: "Canada is the country to the north of the United States.", hint: "Pocket crossed the border into the country just NORTH of the U.S.", note: "My hideout is in the country north of the U.S." },
    ],
  },
  {
    id: "mexicocity", name: "Mexico City", map: "world", at: [19.43, -99.13], atSrc: C, scene: "city", local: "a taco chef",
    facts: [
      { k: "continent", v: "North America", src: "continents", say: "Mexico City is in North America.", hint: "Pocket stayed on our own continent, NORTH AMERICA.", note: "My hideout is in North America." },
      { k: "capital", v: "Mexico", src: "mexicocity", say: "Mexico City is the capital of Mexico. It was built on the old Aztec city of Tenochtitlan.", hint: "Pocket went to a capital built on the ruins of the Aztec city Tenochtitlan.", note: "My hideout is the capital of Mexico." },
      { k: "border", v: "south", src: "mexicocity", say: "Mexico is the country to the south of the United States.", hint: "Pocket crossed the border into the country just SOUTH of the U.S.", note: "My hideout is in the country south of the U.S." },
    ],
  },
  {
    id: "london", name: "London", map: "world", at: [51.51, -0.13], atSrc: C, scene: "city", mark: "bigben", local: "a guard",
    facts: [
      { k: "continent", v: "Europe", src: "continents", say: "London, England, is in Europe.", hint: "Pocket crossed the Atlantic to EUROPE.", note: "My hideout is in Europe." },
      { k: "landmark", v: "Big Ben", src: "london", say: "Big Ben is the giant bell in London's clock tower, next to the River Thames.", hint: "Pocket heard BIG BEN, a giant bell in a clock tower by the River Thames.", note: "A giant bell named Big Ben rings near my hideout." },
      { k: "river", v: "River Thames", src: "london", say: "London is on the River Thames.", hint: "Pocket took a boat ride on the River THAMES.", note: "My hideout is on the River Thames." },
    ],
  },
  {
    id: "cairo", name: "Cairo", map: "world", at: [30.04, 31.24], atSrc: C, scene: "desert", mark: "pyramid", local: "a felucca sailor",
    facts: [
      { k: "continent", v: "Africa", src: "continents", say: "Cairo, Egypt, is in Africa.", hint: "Pocket flew to the continent of AFRICA.", note: "My hideout is in Africa." },
      { k: "river", v: "Nile River", src: "cairo", say: "Cairo sits on the Nile River.", hint: "Pocket sailed on the NILE River.", note: "The Nile flows through my hideout." },
      { k: "landmark", v: "pyramids of Giza", src: "cairo", say: "The pyramids of Giza stand at the edge of Cairo.", hint: "Pocket climbed near the giant PYRAMIDS of Giza.", note: "Giant pyramids stand near my hideout." },
    ],
  },
  {
    id: "tokyo", name: "Tokyo", map: "world", at: [35.69, 139.69], atSrc: C, scene: "city", mark: "fuji", local: "a train conductor",
    facts: [
      { k: "continent", v: "Asia", src: "continents", say: "Tokyo, Japan, is in Asia.", hint: "Pocket flew all the way to ASIA.", note: "My hideout is in Asia." },
      { k: "capital", v: "Japan", src: "tokyo", say: "Tokyo is the capital of Japan.", hint: "Pocket went to the capital of JAPAN.", note: "My hideout is the capital of Japan." },
      { k: "landmark", v: "Mount Fuji", src: "tokyo", say: "On clear days you can see Mount Fuji from Tokyo.", hint: "Pocket spotted snowy MOUNT FUJI from a city skyscraper.", note: "On clear days, I can see Mount Fuji from my hideout." },
    ],
  },
  {
    id: "sydney", name: "Sydney", map: "world", at: [-33.87, 151.21], atSrc: C, scene: "harbor", mark: "opera", local: "a surfer",
    facts: [
      { k: "continent", v: "Australia", src: "continents", say: "Sydney is in Australia.", hint: "Pocket flew to the continent of AUSTRALIA.", note: "My hideout is in Australia." },
      { k: "landmark", v: "Sydney Opera House", src: "sydney", say: "The Sydney Opera House has a roof shaped like white sails.", hint: "Pocket heard a concert under a roof shaped like white SAILS.", note: "My hideout has a roof like white sails." },
    ],
  },
];
