import type { Fact, Place } from "@/chase/types";

/*
 * North Carolina places (grades 1–4). Coordinates are [lat, lon]. Every place has a region fact;
 * the tests check it against the region the pin falls in on the map (Blue Ridge front / Fall Line).
 * "pic" facts are the short picture clues used by grades 1–2.
 */
const C = "coords";

const mtn = (name: string): Fact => ({
  k: "region", v: "Mountains", src: "nc-regions",
  say: `${name} is in the Mountains region, the highest land in North Carolina.`,
  hint: "Pocket wanted the highest, coolest land in North Carolina: the MOUNTAINS region.",
  note: "My hideout is in the Mountains region.",
});
const pied = (name: string): Fact => ({
  k: "region", v: "Piedmont", src: "nc-regions",
  say: `${name} is in the Piedmont, the region of rolling hills in the middle of North Carolina.`,
  hint: "Pocket headed for the rolling hills in the middle of the state: the PIEDMONT.",
  note: "My hideout is in the Piedmont, where the hills roll.",
});
const coast = (name: string): Fact => ({
  k: "region", v: "Coastal Plain", src: "nc-regions",
  say: `${name} is in the Coastal Plain, the low, flat region by the ocean.`,
  hint: "Pocket wanted low, flat land near the ocean: the COASTAL PLAIN region.",
  note: "My hideout is in the Coastal Plain, low and flat.",
});
const snow = (name: string): Fact => ({
  k: "climate", v: "snowy winters", src: "nc-regions",
  say: `High up in ${name}, winters are cold and it snows more than anywhere else in NC.`,
  hint: "Pocket packed a snow hat. It snows the most up there in winter!",
  note: "Bring a coat! It snows a lot at my hideout in winter.",
  icon: "snow",
});
const storms = (name: string): Fact => ({
  k: "climate", v: "hurricanes", src: "nc-regions",
  say: `${name} is right on the coast, so people there get ready for hurricanes.`,
  hint: "Pocket bought a hurricane kit. Big ocean storms can hit there!",
  note: "My hideout is on the coast where hurricanes can blow in.",
  icon: "storm",
});
const obx = (name: string): Fact => ({
  k: "landform", v: "barrier island", src: "nc-geo", vocab: true,
  say: `${name} is on the Outer Banks, a long chain of thin barrier islands.`,
  hint: "Pocket crossed a bridge to a thin BARRIER ISLAND on the Outer Banks.",
  note: "My hideout is on a thin barrier island.",
  icon: "island",
});

export const NC_PLACES: Place[] = [
  // ---------------- Mountains ----------------
  {
    id: "asheville", name: "Asheville", map: "nc", at: [35.6, -82.55], atSrc: C, state: "NC", scene: "mountains", mark: "mansion", local: "a river guide",
    facts: [
      mtn("Asheville"),
      snow("Asheville"),
      { k: "river", v: "French Broad River", src: "frenchbroad", say: "The French Broad River flows through Asheville. It is one of the few rivers that flows north!", hint: "Pocket rafted down a river that flows NORTH instead of south: the French Broad.", note: "A river that flows north runs past my hideout." },
      { k: "landmark", v: "Biltmore", src: "biltmore", say: "Asheville has Biltmore, the largest private home in America, with 250 rooms.", hint: "Pocket wanted to count the 250 rooms of America's biggest house.", note: "My hideout is near a house with 250 rooms!" },
    ],
  },
  {
    id: "boone", name: "Boone", map: "nc", at: [36.22, -81.67], atSrc: C, state: "NC", scene: "mountains", mark: "tree", local: "a tree farmer",
    facts: [
      mtn("Boone"),
      snow("Boone"),
      { k: "product", v: "Fraser fir", src: "ncfarm", say: "Mountain farms near Boone grow Fraser firs, NC's official Christmas tree.", hint: "Pocket wanted a Fraser fir, NC's state Christmas tree, from a mountain farm.", note: "Christmas tree farms grow around my hideout." },
      { k: "landmark", v: "Appalachian State University", src: "boone", say: "Boone is home to Appalachian State University, high in the Blue Ridge Mountains.", hint: "Pocket visited the college town of Appalachian State University.", note: "My hideout is a college town in the Blue Ridge." },
    ],
  },
  {
    id: "mitchell", name: "Mount Mitchell", map: "nc", at: [35.765, -82.265], atSrc: C, state: "NC", scene: "peak", local: "a park ranger",
    facts: [
      mtn("Mount Mitchell"),
      snow("Mount Mitchell"),
      { k: "pic", v: "highest mountain", src: "mitchell", icon: "mountain", say: "Mount Mitchell is the highest mountain in NC.", hint: "Pocket climbed the HIGHEST mountain in NC!", note: "My hideout is on the highest mountain!" },
      { k: "landmark", v: "highest peak east of the Mississippi", src: "mitchell", vocab: true, say: "Mount Mitchell, 6,684 feet tall, is the highest peak east of the Mississippi River.", hint: "Pocket climbed to the highest PEAK east of the Mississippi River.", note: "My hideout is on the highest peak east of the Mississippi." },
    ],
  },
  {
    id: "grandfather", name: "Grandfather Mountain", map: "nc", at: [36.1, -81.81], atSrc: C, state: "NC", scene: "peak", mark: "bridge", local: "a hiker",
    facts: [
      mtn("Grandfather Mountain"),
      snow("Grandfather Mountain"),
      { k: "landmark", v: "Mile High Swinging Bridge", src: "grandfather", say: "Grandfather Mountain has the Mile High Swinging Bridge, America's highest suspension footbridge.", hint: "Pocket walked across a swinging bridge about a MILE high.", note: "You need to cross a mile-high swinging bridge to reach my hideout." },
    ],
  },
  {
    id: "chimney", name: "Chimney Rock", map: "nc", at: [35.44, -82.25], atSrc: C, state: "NC", scene: "gorge", mark: "spire", local: "a climber",
    facts: [
      mtn("Chimney Rock"),
      { k: "landmark", v: "rock spire", src: "chimney", vocab: true, say: "Chimney Rock is a 315-foot stone spire above Hickory Nut Gorge and Lake Lure.", hint: "Pocket rode an elevator up a tall stone SPIRE over a lake in a gorge.", note: "My hideout looks down on Lake Lure from a stone spire." },
    ],
  },
  {
    id: "cherokee", name: "Cherokee", map: "nc", at: [35.47, -83.32], atSrc: C, state: "NC", scene: "river", mark: "museum", local: "a museum guide",
    facts: [
      mtn("Cherokee"),
      { k: "people", v: "Eastern Band of Cherokee Indians", src: "cherokee", say: "Cherokee is on the Qualla Boundary, home of the Eastern Band of Cherokee Indians.", hint: "Pocket visited the Qualla Boundary, home of the Eastern Band, by the Smokies.", note: "My hideout is on the Qualla Boundary in the mountains." },
      { k: "river", v: "Oconaluftee River", src: "cherokee", say: "The Museum of the Cherokee People sits beside the Oconaluftee River.", hint: "Pocket toured a museum of mountain history beside the Oconaluftee River.", note: "The Oconaluftee River flows by my hideout." },
    ],
  },
  // ---------------- Piedmont ----------------
  {
    id: "mtairy", name: "Mount Airy", map: "nc", at: [36.5, -80.61], atSrc: C, state: "NC", scene: "quarry", local: "a stone cutter",
    facts: [
      pied("Mount Airy"),
      { k: "symbol", v: "granite", src: "nc-symbols", say: "Granite is NC's state rock, and Mount Airy, the Granite City, is famous for it.", hint: "Pocket wanted a chunk of GRANITE, NC's state rock, from the Granite City.", note: "My hideout is in the Granite City." },
    ],
  },
  {
    id: "hiddenite", name: "Hiddenite", map: "nc", at: [35.9, -81.09], atSrc: C, state: "NC", scene: "mine", mark: "gem", local: "a gem miner",
    facts: [
      pied("Hiddenite"),
      { k: "symbol", v: "emerald", src: "hiddenite", say: "Hiddenite is famous for emeralds. The emerald is NC's state precious stone.", hint: "Pocket went digging for EMERALDS, NC's state gem.", note: "Green gems are buried near my hideout." },
    ],
  },
  {
    id: "charlotte", name: "Charlotte", map: "nc", at: [35.23, -80.84], atSrc: C, state: "NC", scene: "city", local: "a bus driver",
    facts: [
      pied("Charlotte"),
      { k: "pic", v: "biggest city", src: "charlotte", icon: "city", say: "Charlotte is the biggest city in NC.", hint: "Pocket went to NC's BIGGEST city!", note: "My hideout is in the biggest city!" },
      { k: "size", v: "largest city", src: "charlotte", say: "Charlotte is the largest city in North Carolina.", hint: "Pocket wanted to see the tall towers of NC's LARGEST city.", note: "My hideout is in North Carolina's largest city." },
      { k: "lake", v: "Lake Norman", src: "charlotte", say: "Lake Norman, NC's largest man-made lake, is just north of Charlotte.", hint: "Pocket went boating on Lake Norman, NC's biggest man-made lake.", note: "My hideout is near NC's largest man-made lake." },
    ],
  },
  {
    id: "reed", name: "Reed Gold Mine", map: "nc", at: [35.29, -80.47], atSrc: C, state: "NC", scene: "mine", mark: "gold", local: "a mine guide",
    facts: [
      pied("Reed Gold Mine"),
      { k: "history", v: "first gold find", src: "reed", say: "In 1799, 12-year-old Conrad Reed found a 17-pound gold rock here. It was the first documented gold find in the U.S.!", hint: "Pocket heard a kid once used a 17-pound GOLD nugget as a doorstop there.", note: "My hideout is where America's first gold was found." },
    ],
  },
  {
    id: "oldsalem", name: "Winston-Salem", map: "nc", at: [36.09, -80.24], atSrc: C, state: "NC", scene: "village", local: "a baker in old-time clothes",
    facts: [
      pied("Winston-Salem"),
      { k: "history", v: "Moravian town", src: "oldsalem", say: "Old Salem in Winston-Salem was built by Moravian settlers in 1766. Today you can watch old-time crafts there.", hint: "Pocket toured a village built by MORAVIAN settlers in 1766.", note: "My hideout is in an old Moravian village." },
    ],
  },
  {
    id: "greensboro", name: "Greensboro", map: "nc", at: [36.07, -79.79], atSrc: C, state: "NC", scene: "city", mark: "counter", local: "a museum guide",
    facts: [
      pied("Greensboro"),
      { k: "history", v: "1960 sit-in", src: "sitin", say: "In 1960, four college students sat at a Greensboro lunch counter to protest unfair rules. A museum honors them today.", hint: "Pocket visited the lunch counter where four students stood up for fairness in 1960.", note: "My hideout is near a famous lunch counter from 1960." },
    ],
  },
  {
    id: "chapelhill", name: "Chapel Hill", map: "nc", at: [35.91, -79.06], atSrc: C, state: "NC", scene: "campus", local: "a student",
    facts: [
      pied("Chapel Hill"),
      { k: "history", v: "first public university", src: "unc", say: "UNC in Chapel Hill opened in 1795, the first public university in the U.S. to open its doors.", hint: "Pocket toured the first public university in the U.S. to open its doors.", note: "My hideout is at the oldest public university to open." },
    ],
  },
  {
    id: "raleigh", name: "Raleigh", map: "nc", at: [35.78, -78.64], atSrc: C, state: "NC", scene: "capitol", mark: "dome", local: "a tour guide",
    facts: [
      pied("Raleigh"),
      { k: "pic", v: "capital star", src: "raleigh", icon: "star", say: "Raleigh is NC's capital. Maps show it with a star.", hint: "Pocket went to the city with a STAR on the map!", note: "My hideout has a star on the map!" },
      { k: "capital", v: "capital of North Carolina", src: "raleigh", say: "Raleigh is the capital of North Carolina, where state leaders meet.", hint: "Pocket wanted to see where North Carolina's leaders meet: the STATE CAPITAL.", note: "My hideout is in the state capital." },
      { k: "river", v: "Neuse River", src: "raleigh", say: "The Neuse River flows through the northeast part of Raleigh.", hint: "Pocket went to a city the Neuse River flows through, nicknamed the City of Oaks.", note: "My hideout is in the City of Oaks." },
    ],
  },
  // ---------------- Coastal Plain ----------------
  {
    id: "wilmington", name: "Wilmington", map: "nc", at: [34.23, -77.94], atSrc: C, state: "NC", scene: "port", mark: "ship", local: "a ship captain",
    facts: [
      coast("Wilmington"),
      storms("Wilmington"),
      { k: "pic", v: "big ships", src: "wilmington", icon: "ship", say: "Wilmington has a port where big ships come and go.", hint: "Pocket went where BIG SHIPS dock!", note: "Big ships float by my hideout!" },
      { k: "river", v: "Cape Fear River", src: "wilmington", say: "Wilmington sits on the Cape Fear River, and its port ships goods around the world.", hint: "Pocket sailed up the Cape Fear River to a busy PORT.", vocab: true, note: "My hideout is a port on the Cape Fear River." },
      { k: "symbol", v: "Venus flytrap", src: "flytrap", say: "Venus flytraps, NC's state carnivorous plant, grow wild only near Wilmington.", hint: "Pocket wanted to see a plant that snaps up bugs. It grows wild only in this area!", note: "Bug-eating plants grow wild near my hideout." },
      { k: "landmark", v: "Battleship North Carolina", src: "wilmington", say: "The Battleship North Carolina is parked across the Cape Fear River from downtown Wilmington.", hint: "Pocket climbed aboard a giant World War II battleship named after our state.", note: "A giant battleship is parked near my hideout." },
    ],
  },
  {
    id: "newbern", name: "New Bern", map: "nc", at: [35.11, -77.04], atSrc: C, state: "NC", scene: "palace", local: "a gardener",
    facts: [
      coast("New Bern"),
      { k: "river", v: "Neuse and Trent rivers", src: "newbern", say: "New Bern sits where the Neuse and Trent rivers meet.", hint: "Pocket went where the Neuse and Trent rivers meet.", note: "Two rivers meet at my hideout." },
      { k: "landmark", v: "Tryon Palace", src: "newbern", say: "Tryon Palace in New Bern was NC's first capitol, rebuilt so visitors can tour it.", hint: "Pocket toured Tryon Palace, North Carolina's first capitol.", note: "My hideout is NC's first capital city." },
      { k: "food", v: "Pepsi", src: "newbern", say: "A New Bern pharmacist invented the drink that became Pepsi-Cola in 1893.", hint: "Pocket sipped a soda where Pepsi-Cola was invented.", note: "A famous soda was invented at my hideout." },
    ],
  },
  {
    id: "pembroke", name: "Pembroke", map: "nc", at: [34.68, -79.2], atSrc: C, state: "NC", scene: "river", local: "a teacher",
    facts: [
      coast("Pembroke"),
      { k: "people", v: "Lumbee Tribe", src: "lumbee", say: "Pembroke, in Robeson County, is the center of the Lumbee Tribe of North Carolina.", hint: "Pocket visited the home of the LUMBEE Tribe in Robeson County.", note: "My hideout is the center of the Lumbee Tribe." },
      { k: "river", v: "Lumber River", src: "lumbee", say: "The Lumbee people have lived along the Lumber River for a very long time.", hint: "Pocket paddled the Lumber River, home waters of the Lumbee people.", note: "The Lumber River flows near my hideout." },
    ],
  },
  {
    id: "edenton", name: "Edenton", map: "nc", at: [36.06, -76.61], atSrc: C, state: "NC", scene: "harbor", local: "a historian",
    facts: [
      coast("Edenton"),
      { k: "history", v: "Edenton Tea Party", src: "edenton", say: "In 1774, 51 women in Edenton signed a promise not to buy British tea. It was the Edenton Tea Party.", hint: "Pocket went where 51 women signed a promise to stop buying British tea in 1774.", note: "My hideout is where women held a famous tea party in 1774." },
      { k: "water", v: "Albemarle Sound", src: "nc-geo", vocab: true, say: "Edenton sits on Albemarle Sound, a big body of water behind the Outer Banks.", hint: "Pocket sailed on Albemarle SOUND to a little harbor town.", note: "My hideout is on Albemarle Sound." },
    ],
  },
  {
    id: "killdevil", name: "Kill Devil Hills", map: "nc", at: [36.01, -75.67], atSrc: C, state: "NC", scene: "dunes", mark: "plane", local: "a park ranger",
    facts: [
      coast("Kill Devil Hills"),
      obx("Kill Devil Hills"),
      storms("Kill Devil Hills"),
      { k: "pic", v: "first airplane", src: "wright", icon: "plane", say: "The first airplane flight was here.", hint: "Pocket went where the first AIRPLANE flew!", note: "The first airplane flew at my hideout!" },
      { k: "history", v: "first flight", src: "wright", say: "On December 17, 1903, the Wright brothers made the first powered airplane flight here.", hint: "Pocket wanted to see where the Wright brothers first flew in 1903.", note: "My hideout is where the first airplane flew." },
    ],
  },
  {
    id: "nagshead", name: "Nags Head", map: "nc", at: [35.96, -75.63], atSrc: C, state: "NC", scene: "dunes", local: "a kite flyer",
    facts: [
      coast("Nags Head"),
      obx("Nags Head"),
      storms("Nags Head"),
      { k: "landmark", v: "Jockey's Ridge", src: "jockeys", vocab: true, say: "Jockey's Ridge in Nags Head is the tallest living sand DUNE system on the Atlantic coast.", hint: "Pocket flew a kite from the tallest sand DUNES on the Atlantic coast.", note: "My hideout is on a giant sand dune." },
    ],
  },
  {
    id: "hatteras", name: "Cape Hatteras", map: "nc", at: [35.25, -75.53], atSrc: C, state: "NC", scene: "lighthouse", mark: "lighthouse", local: "a lighthouse keeper",
    facts: [
      coast("Cape Hatteras"),
      obx("Cape Hatteras"),
      storms("Cape Hatteras"),
      { k: "pic", v: "lighthouse", src: "hatteras", icon: "lighthouse", say: "Cape Hatteras has a tall striped lighthouse by the beach.", hint: "Pocket went to a tall LIGHTHOUSE by the beach!", note: "My hideout has a lighthouse!" },
      { k: "landmark", v: "Cape Hatteras Lighthouse", src: "hatteras", say: "The Cape Hatteras Lighthouse is the tallest brick lighthouse in the U.S. In 1999 it was moved 2,900 feet away from the waves.", hint: "Pocket wanted to see the tallest brick lighthouse in the U.S., the one that was MOVED in 1999.", note: "My hideout is by a lighthouse that once was moved." },
    ],
  },
  {
    id: "manteo", name: "Manteo", map: "nc", at: [35.91, -75.68], atSrc: C, state: "NC", scene: "harbor", mark: "boat", local: "a boat builder",
    facts: [
      coast("Manteo"),
      storms("Manteo"),
      { k: "history", v: "The Lost Colony", src: "manteo", say: "Manteo, on Roanoke Island, puts on The Lost Colony, a play about English settlers who went missing after 1587.", hint: "Pocket watched an outdoor play about the colonists who vanished from Roanoke Island.", note: "My hideout is on Roanoke Island." },
      { k: "symbol", v: "shad boat", src: "manteo", say: "The shad boat, NC's state historical boat, was first built on Roanoke Island.", hint: "Pocket wanted to ride a SHAD BOAT, NC's state boat, where it was first built.", note: "NC's state boat was first built at my hideout." },
    ],
  },
  {
    id: "ocracoke", name: "Ocracoke", map: "nc", at: [35.11, -75.98], atSrc: C, state: "NC", scene: "harbor", mark: "pirate", local: "a ferry captain",
    facts: [
      coast("Ocracoke"),
      obx("Ocracoke"),
      storms("Ocracoke"),
      { k: "history", v: "Blackbeard", src: "ocracoke", say: "The pirate Blackbeard used Ocracoke as his hideout until 1718.", hint: "Pocket took a ferry to the island where the pirate BLACKBEARD hid in 1718.", note: "A famous pirate hid at my hideout long ago." },
    ],
  },
];
