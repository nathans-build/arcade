import type { CaseDef } from "@/chase/types";

/*
 * Clue Compass cases, six per band. Pocket (a runaway souvenir robot) BORROWS one thing per case
 * and always gives it back. Clue references point at facts of the next stop (see places-*.ts);
 * scripts/check-game.ts proves every case is solvable and every wrong trip is explained.
 */
export type Band = "K" | "1-2" | "3" | "4" | "5";
export const BANDS: Band[] = ["K", "1-2", "3", "4", "5"];

export const CASES: CaseDef[] = [
  // ======================= Kindergarten: Compass Corners (community helpers) =======================
  {
    id: "k-bell", band: "K", map: "town", title: "The Missing Fire Bell", item: "the fire station's shiny bell", itemIcon: "bell",
    brief: "Clang? No clang! Pocket the robot borrowed the fire station's shiny bell. Look at the picture clues to find where Pocket went!",
    stops: ["fire", "library", "park", "farm"],
    legs: [
      { clues: ["thing", "helper"], opts: ["school", "bakery", "clinic"] },
      { clues: ["thing", "sound"], opts: ["post", "police", "grocery"] },
    ],
    traits: ["thing", "sound", "helper"],
    hideoutOpts: ["school", "bakery", "clinic"],
    end: "Beep-boop! I wanted the cows to hear a bell. Here it is. Clang, clang, thank you!",
  },
  {
    id: "k-book", band: "K", map: "town", title: "The Giant Storybook", item: "the library's giant storybook", itemIcon: "book",
    brief: "The library's giant storybook is gone! An IOU note says: Pocket borrowed it. Use the picture clues to follow Pocket.",
    stops: ["library", "bakery", "clinic", "school"],
    legs: [
      { clues: ["helper", "sound"], opts: ["fire", "farm", "post"] },
      { clues: ["thing", "helper"], opts: ["park", "grocery", "police"] },
    ],
    traits: ["helper", "thing", "sound"],
    hideoutOpts: ["fire", "park", "farm"],
    end: "Beep! I wanted to read the giant book to the kids at school. Please take it back to the library!",
  },
  {
    id: "k-cake", band: "K", map: "town", title: "The Birthday Cake Caper", item: "the bakery's birthday cake", itemIcon: "cake",
    brief: "Oh no! The bakery's birthday cake is missing. Pocket left a note: IOU ONE CAKE. Let's find that robot!",
    stops: ["bakery", "farm", "post", "police"],
    legs: [
      { clues: ["thing", "sound"], opts: ["library", "school", "fire"] },
      { clues: ["helper", "thing"], opts: ["grocery", "clinic", "park"] },
    ],
    traits: ["thing", "sound", "helper"],
    hideoutOpts: ["fire", "school", "clinic"],
    end: "Bzzt! I wanted to say thank you to the police officers. Here's the cake for the party. Not one bite gone!",
  },
  {
    id: "k-kite", band: "K", map: "town", title: "The Runaway Kite", item: "the park's big red kite", itemIcon: "kite",
    brief: "Whoosh! The big red kite from the park flew off with Pocket. Follow the picture clues around town!",
    stops: ["park", "grocery", "school", "fire"],
    legs: [
      { clues: ["sound", "thing"], opts: ["post", "bakery", "farm"] },
      { clues: ["thing", "helper"], opts: ["library", "police", "clinic"] },
    ],
    traits: ["thing", "sound", "helper"],
    hideoutOpts: ["police", "farm", "post"],
    end: "Beep-beep! I wanted to fly the kite from the top of the fire truck ladder. Here it is!",
  },
  {
    id: "k-pumpkin", band: "K", map: "town", title: "The Prize Pumpkin", item: "the farm's prize pumpkin", itemIcon: "pumpkin",
    brief: "The farmer's biggest, orangest pumpkin is gone! Pocket borrowed it. Can you find where Pocket rolled it?",
    stops: ["farm", "police", "library", "grocery"],
    legs: [
      { clues: ["thing", "helper"], opts: ["fire", "clinic", "school"] },
      { clues: ["sound", "thing"], opts: ["park", "bakery", "post"] },
    ],
    traits: ["thing", "helper", "sound"],
    hideoutOpts: ["bakery", "clinic", "post"],
    end: "Boop! I wanted to see how much the pumpkin weighs on the store scale. Here, roll it home!",
  },
  {
    id: "k-teddy", band: "K", map: "town", title: "The Checkup Teddy Bear", item: "the doctor's teddy bear", itemIcon: "teddy",
    brief: "The doctor's office has a teddy bear that helps kids feel brave. Pocket borrowed it! Follow the clues.",
    stops: ["clinic", "post", "fire", "bakery"],
    legs: [
      { clues: ["helper", "sound"], opts: ["school", "grocery", "park"] },
      { clues: ["thing", "sound"], opts: ["police", "farm", "library"] },
    ],
    traits: ["thing", "helper", "sound"],
    hideoutOpts: ["grocery", "farm", "school"],
    end: "Beep... I felt a little scared, so I hugged the teddy bear. I feel brave now! Here it is.",
  },

  // ======================= Grades 1–2: directions, continents & oceans, NC basics =======================
  {
    id: "g12-mailbag", band: "1-2", map: "town", title: "The Mixed-Up Mailbag", item: "the mail carrier's mailbag", itemIcon: "mailbag",
    brief: "Pocket borrowed the mail carrier's mailbag! Use the compass rose (N, S, E, W) and the picture clues to follow Pocket around town.",
    stops: ["post", "library", "school", "park", "farm"],
    legs: [
      { clues: ["dir", "thing"], opts: ["grocery", "police", "bakery"] },
      { clues: ["dir", "helper"], opts: ["fire", "post", "police"] },
      { clues: ["dir", "sound"], opts: ["library", "fire", "post"] },
    ],
    traits: ["thing", "sound", "helper"],
    hideoutOpts: ["bakery", "police", "clinic"],
    end: "Beep! I was delivering letters to the cows. They can't read? Oops! Here's the mailbag.",
  },
  {
    id: "g12-recipe", band: "1-2", map: "town", title: "The Secret Recipe", item: "the baker's secret recipe", itemIcon: "recipe",
    brief: "The baker's secret cookie recipe is missing! Pocket left an IOU. Read the map directions to follow the trail.",
    stops: ["bakery", "police", "clinic", "grocery", "fire"],
    legs: [
      { clues: ["dir", "thing"], opts: ["library", "school", "post"] },
      { clues: ["dir", "helper"], opts: ["farm", "bakery", "library"] },
      { clues: ["dir", "sound"], opts: ["farm", "police", "park"] },
    ],
    traits: ["thing", "helper", "sound"],
    hideoutOpts: ["post", "school", "library"],
    end: "Bzzt! I wanted to bake cookies for the firefighters. Here's the recipe back, baker!",
  },
  {
    id: "g12-globe", band: "1-2", map: "world", title: "The Snow Globe Voyage", item: "Pip's snow globe", itemIcon: "globe",
    brief: "Pocket borrowed Pip the pigeon's snow globe and flew around the world! Use the picture clues and the compass to visit continents and oceans.",
    stops: ["northamerica", "atlantic", "africa", "indian", "australia"],
    legs: [
      { clues: ["home"], opts: ["pacific", "arctic", "southern"] },
      { clues: ["landmark", "desert", "dir"], opts: ["southamerica", "northamerica", "pacific"] },
      { clues: ["between", "dir"], opts: ["atlantic", "europe", "southamerica"] },
    ],
    traits: ["animal", "size", "kind"],
    hideoutOpts: ["antarctica", "asia", "pacific"],
    end: "Boing! The kangaroos wanted to see snow, so I showed them the snow globe. Here, Pip!",
  },
  {
    id: "g12-hat", band: "1-2", map: "world", title: "The Penguin Party Hat", item: "a penguin's party hat", itemIcon: "hat",
    brief: "Pocket borrowed a party hat and zoomed across the world map! Follow the animals and landmarks from continent to ocean.",
    stops: ["europe", "asia", "pacific", "southamerica", "antarctica"],
    legs: [
      { clues: ["animal", "landmark", "dir"], opts: ["northamerica", "atlantic", "africa"] },
      { clues: ["size"], opts: ["indian", "arctic", "atlantic"] },
      { clues: ["animal", "river"], opts: ["northamerica", "africa", "australia"] },
    ],
    traits: ["animal", "climate", "kind"],
    hideoutOpts: ["arctic", "southern", "australia"],
    end: "Beep-boop! The penguins are having a party and I was bringing the hat. Party time!",
  },
  {
    id: "g12-lamp", band: "1-2", map: "nc", title: "The Lighthouse Lamp", item: "a lighthouse lamp", itemIcon: "lamp",
    brief: "A lighthouse lamp went missing, and Pocket left an IOU! Use the North Carolina map symbols and directions to follow the trail.",
    stops: ["raleigh", "charlotte", "mitchell", "wilmington", "hatteras"],
    legs: [
      { clues: ["pic", "dir"], opts: ["wilmington", "killdevil", "hatteras"] },
      { clues: ["pic", "dir"], opts: ["raleigh", "wilmington", "hatteras"] },
      { clues: ["pic", "dir"], opts: ["asheville", "cherokee", "chimney"] },
    ],
    traits: ["pic", "landform", "climate"],
    hideoutOpts: ["killdevil", "ocracoke", "raleigh"],
    end: "Blink-blink! I was just cleaning the lamp so ships can see it. All shiny now!",
  },
  {
    id: "g12-star", band: "1-2", map: "nc", title: "The Mountain Map Star", item: "a gold map star", itemIcon: "star",
    brief: "Pocket borrowed a gold star sticker from a giant North Carolina map! Follow the clues across the state.",
    stops: ["hatteras", "killdevil", "raleigh", "mitchell"],
    legs: [
      { clues: ["pic", "dir"], opts: ["wilmington", "ocracoke", "charlotte"] },
      { clues: ["pic", "dir"], opts: ["hatteras", "nagshead", "ocracoke"] },
    ],
    traits: ["pic", "climate"],
    hideoutOpts: ["asheville", "charlotte", "wilmington"],
    end: "Beep! I wanted to put a star on top of the highest mountain. Here it is, back on the map!",
  },

  // ======================= Grade 3: NC regions & landforms, NC's neighbors =======================
  {
    id: "g3-flag", band: "3", map: "nc", title: "The Capitol's Flag", item: "a flag from the State Capitol", itemIcon: "flag",
    brief: "A North Carolina flag from the State Capitol in Raleigh is missing! Pocket left an IOU. Read each witness clue to find the right region.",
    stops: ["raleigh", "wilmington", "boone", "charlotte"],
    legs: [
      { clues: ["region", "river", "climate"], opts: ["asheville", "charlotte", "greensboro"] },
      { clues: ["region", "product", "climate"], opts: ["newbern", "chapelhill", "mitchell"] },
    ],
    traits: ["region", "size", "lake"],
    hideoutOpts: ["raleigh", "greensboro", "asheville"],
    end: "Bzzt! I wanted to wave the flag at the biggest city in the state. Here it is, folded neatly!",
  },
  {
    id: "g3-lighthouse", band: "3", map: "nc", title: "The Lighthouse Bell", item: "a lighthouse keeper's bell", itemIcon: "bell",
    brief: "Pocket borrowed a lighthouse keeper's old brass bell and toured all three NC regions! Follow the clues from the mountains to the sea.",
    stops: ["charlotte", "mitchell", "raleigh", "nagshead", "hatteras"],
    legs: [
      { clues: ["region", "landmark", "climate"], opts: ["chimney", "greensboro", "wilmington"] },
      { clues: ["capital", "region"], opts: ["asheville", "chapelhill", "newbern"] },
      { clues: ["landform", "landmark", "region"], opts: ["ocracoke", "pembroke", "greensboro"] },
    ],
    traits: ["landform", "climate", "landmark", "region"],
    hideoutOpts: ["ocracoke", "killdevil", "wilmington"],
    end: "Ding-ding! I rang the bell to warn the ships about a storm. Here, keeper, it's yours.",
  },
  {
    id: "g3-kite", band: "3", map: "nc", title: "The Box Kite Chase", item: "a champion box kite", itemIcon: "kite",
    brief: "A kite flyer's champion box kite blew away with Pocket hanging on! Use landforms and regions to follow the trail.",
    stops: ["nagshead", "raleigh", "chimney", "charlotte", "wilmington"],
    legs: [
      { clues: ["capital", "river", "region"], opts: ["newbern", "charlotte", "edenton"] },
      { clues: ["landmark", "region"], opts: ["mtairy", "grandfather", "ocracoke"] },
      { clues: ["size", "lake", "region"], opts: ["greensboro", "raleigh", "asheville"] },
    ],
    traits: ["region", "climate", "river", "symbol"],
    hideoutOpts: ["newbern", "pembroke", "hatteras"],
    end: "Whee! I flew the kite over the port to wave at the ships. Here it is, not even torn!",
  },
  {
    id: "g3-gnome", band: "3", map: "nc", title: "The Granite Gnome", item: "a granite garden gnome", itemIcon: "gnome",
    brief: "A garden gnome carved from North Carolina granite is missing! Pocket's trail crosses the Piedmont and the Mountains.",
    stops: ["wilmington", "mtairy", "cherokee", "raleigh"],
    legs: [
      { clues: ["symbol", "region"], opts: ["hiddenite", "boone", "newbern"] },
      { clues: ["people", "river", "region"], opts: ["pembroke", "asheville", "chapelhill"] },
    ],
    traits: ["capital", "region", "river"],
    hideoutOpts: ["chapelhill", "newbern", "charlotte"],
    end: "Beep! I wanted the gnome to see where the state's leaders work. Here, he's all yours!",
  },
  {
    id: "g3-map", band: "3", map: "us", title: "The Neighbor's Map", item: "a map of NC's neighbors", itemIcon: "map",
    brief: "Pocket borrowed a map of North Carolina's neighbor states and flew off to see them for real! Use the compass and the border clues.",
    stops: ["raleigh_us", "richmond", "dc", "nashville", "atlanta"],
    legs: [
      { clues: ["border", "capital", "dir"], opts: ["columbia", "atlanta", "nashville"] },
      { clues: ["capital", "landmark", "dir"], opts: ["nashville", "columbia", "raleigh_us"] },
      { clues: ["border", "music", "dir"], opts: ["richmond", "nyc", "boston"] },
    ],
    traits: ["border", "capital"],
    hideoutOpts: ["columbia", "raleigh_us", "richmond"],
    end: "Bzzt! I colored in every neighbor on the map. Look, it's finished! You can have it back.",
  },
  {
    id: "g3-apple", band: "3", map: "us", title: "The Big Apple Sign", item: "a shiny apple sign", itemIcon: "apple",
    brief: "Pocket borrowed a shiny apple sign and set off up the East Coast! Follow the clues about states, capitals and landmarks.",
    stops: ["raleigh_us", "columbia", "nashville", "dc", "nyc"],
    legs: [
      { clues: ["border", "capital"], opts: ["richmond", "nashville", "dc"] },
      { clues: ["border", "music", "capital"], opts: ["atlanta", "richmond", "raleigh_us"] },
      { clues: ["capital", "landmark"], opts: ["atlanta", "columbia", "raleigh_us"] },
    ],
    traits: ["landmark", "ocean"],
    hideoutOpts: ["boston", "richmond", "raleigh_us"],
    end: "Beep-boop! People call New York City the Big Apple, so I brought the apple sign to visit. Here!",
  },

  // ======================= Grade 4: North Carolina deep dive =======================
  {
    id: "g4-plank", band: "4", map: "nc", title: "The Swinging Bridge Plank", item: "a spare plank from a famous bridge", itemIcon: "plank",
    brief: "A spare plank from a famous mountain bridge is missing, and Pocket left an IOU! Use NC's landmarks, state symbols and history to follow the trail.",
    stops: ["raleigh", "grandfather", "hiddenite", "reed", "newbern"],
    legs: [
      { clues: ["landmark", "region"], opts: ["chimney", "mtairy", "killdevil"] },
      { clues: ["symbol", "region"], opts: ["mtairy", "boone", "wilmington"] },
      { clues: ["history", "region"], opts: ["oldsalem", "greensboro", "asheville"] },
    ],
    traits: ["landmark", "river", "food", "region"],
    hideoutOpts: ["edenton", "wilmington", "raleigh"],
    end: "Bzzt! I was building a model of the palace garden and needed a plank. I'll send it right back up the mountain!",
  },
  {
    id: "g4-spyglass", band: "4", map: "nc", title: "The Pirate's Spyglass", item: "an old brass spyglass", itemIcon: "spyglass",
    brief: "A museum's old brass spyglass is missing! Pocket sailed off along the coast. Use NC history and the sounds and islands to track it down.",
    stops: ["charlotte", "ocracoke", "manteo", "edenton", "killdevil"],
    legs: [
      { clues: ["history", "landform"], opts: ["hatteras", "wilmington", "edenton"] },
      { clues: ["symbol", "history"], opts: ["hatteras", "newbern", "pembroke"] },
      { clues: ["history", "water"], opts: ["newbern", "wilmington", "oldsalem"] },
    ],
    traits: ["history", "landform", "climate", "region"],
    hideoutOpts: ["hatteras", "ocracoke", "wilmington"],
    end: "Beep! I used the spyglass to watch for airplanes over the dunes. Here it is, captain!",
  },
  {
    id: "g4-moravian", band: "4", map: "nc", title: "The Moravian Star", item: "a paper Moravian star", itemIcon: "star",
    brief: "A many-pointed paper star from a Moravian village is missing! Follow Pocket through NC's history stops in the Piedmont.",
    stops: ["wilmington", "oldsalem", "greensboro", "chapelhill", "asheville"],
    legs: [
      { clues: ["history", "region"], opts: ["newbern", "mtairy", "boone"] },
      { clues: ["history", "region"], opts: ["charlotte", "raleigh", "edenton"] },
      { clues: ["history", "region"], opts: ["boone", "raleigh", "pembroke"] },
    ],
    traits: ["river", "landmark", "region", "climate"],
    hideoutOpts: ["boone", "cherokee", "charlotte"],
    end: "Boop! I hung the star in the window of a 250-room house. So pretty! I'll send it home.",
  },
  {
    id: "g4-flytrap", band: "4", map: "nc", title: "The Flytrap Flowerpot", item: "a Venus flytrap in a flowerpot", itemIcon: "plant",
    brief: "A Venus flytrap from a science classroom is gone! Pocket left an IOU. Follow rivers, symbols and the people of NC to find it.",
    stops: ["asheville", "wilmington", "pembroke", "raleigh"],
    legs: [
      { clues: ["symbol", "landmark", "river"], opts: ["newbern", "hatteras", "manteo"] },
      { clues: ["people", "river"], opts: ["cherokee", "edenton", "chapelhill"] },
    ],
    traits: ["capital", "river", "region"],
    hideoutOpts: ["newbern", "chapelhill", "greensboro"],
    end: "Snap! I wanted the flytrap to meet the state leaders. It's back in its pot, safe and sound.",
  },
  {
    id: "g4-nugget", band: "4", map: "nc", title: "The Doorstop Nugget", item: "a pretend gold nugget doorstop", itemIcon: "nugget",
    brief: "A museum's pretend gold nugget doorstop is missing! Pocket's trail runs from the coast to the mountains.",
    stops: ["killdevil", "reed", "cherokee", "mitchell", "boone"],
    legs: [
      { clues: ["history", "region"], opts: ["hiddenite", "edenton", "greensboro"] },
      { clues: ["people", "river", "region"], opts: ["pembroke", "asheville", "oldsalem"] },
      { clues: ["landmark", "region", "climate"], opts: ["grandfather", "chimney", "mtairy"] },
    ],
    traits: ["product", "landmark", "region", "climate"],
    hideoutOpts: ["asheville", "grandfather", "hiddenite"],
    end: "Beep-boop! I used the nugget to prop open a door at a Christmas tree farm. Here it is!",
  },
  {
    id: "g4-dune", band: "4", map: "nc", title: "The Dune Flag", item: "a beach-safety flag", itemIcon: "flag",
    brief: "A beach-safety flag from the Outer Banks is missing! Pocket's trail heads from the barrier islands to the mountains.",
    stops: ["newbern", "hatteras", "nagshead", "mtairy", "chimney"],
    legs: [
      { clues: ["landmark", "landform"], opts: ["ocracoke", "killdevil", "wilmington"] },
      { clues: ["landmark", "landform"], opts: ["ocracoke", "wilmington", "edenton"] },
      { clues: ["symbol", "region"], opts: ["hiddenite", "grandfather", "newbern"] },
    ],
    traits: ["landmark", "region"],
    hideoutOpts: ["grandfather", "mitchell", "charlotte"],
    end: "Bzzt! I planted the flag on top of the rock spire to say hello to Lake Lure. Here it is!",
  },

  // ======================= Grade 5: U.S. regions, capitals and landforms + world =======================
  {
    id: "g5-torch", band: "5", map: "us", title: "The Liberty Torch Keychain", item: "a torch-shaped keychain", itemIcon: "torch",
    brief: "A gift-shop keychain shaped like a torch is missing from Washington, D.C.! Pocket left an IOU and headed out across the regions of the U.S.",
    stops: ["dc", "nyc", "boston", "chicago", "stlouis", "denver"],
    legs: [
      { clues: ["landmark", "region", "ocean"], opts: ["boston", "richmond", "chicago"] },
      { clues: ["capital", "history", "region"], opts: ["richmond", "nashville", "chicago"] },
      { clues: ["lake", "landmark", "region"], opts: ["rushmore", "saltlake", "nyc"] },
      { clues: ["landmark", "river", "region"], opts: ["neworleans", "rushmore", "denver"] },
    ],
    traits: ["landform", "nickname", "capital", "region"],
    hideoutOpts: ["saltlake", "santafe", "rushmore"],
    end: "Beep! I wanted to hold the torch up exactly one mile high. Done! Here's your keychain back.",
  },
  {
    id: "g5-trumpet", band: "5", map: "us", title: "The Jazz Trumpet", item: "a little brass trumpet", itemIcon: "trumpet",
    brief: "A street musician's little brass trumpet is missing! Pocket tooted off through the Southwest and the Southeast.",
    stops: ["austin", "neworleans", "everglades", "atlanta", "nashville"],
    legs: [
      { clues: ["music", "river", "region"], opts: ["stlouis", "nashville", "phoenix"] },
      { clues: ["animal", "region"], opts: ["austin", "atlanta", "sanfrancisco"] },
      { clues: ["capital", "region"], opts: ["columbia", "richmond", "austin"] },
    ],
    traits: ["music", "capital", "region"],
    hideoutOpts: ["neworleans", "richmond", "columbia"],
    end: "Toot-toot! I wanted to play a song at the Grand Ole Opry. Here's your trumpet back!",
  },
  {
    id: "g5-compass", band: "5", map: "us", title: "The Desert Compass", item: "a park ranger's compass", itemIcon: "compass",
    brief: "A park ranger's compass is missing! Pocket headed west from the Great Lakes. Use landforms and regions to follow.",
    stops: ["chicago", "rushmore", "yellowstone", "grandcanyon", "phoenix", "santafe"],
    legs: [
      { clues: ["landmark", "landform", "region"], opts: ["stlouis", "denver", "saltlake"] },
      { clues: ["landmark", "history", "region"], opts: ["denver", "grandcanyon", "chicago"] },
      { clues: ["river", "region"], opts: ["stlouis", "phoenix", "denver"] },
      { clues: ["landform", "capital", "region"], opts: ["austin", "sacramento", "saltlake"] },
    ],
    traits: ["history", "capital", "region"],
    hideoutOpts: ["austin", "denver", "sacramento"],
    end: "Bzzt! I needed the compass to find the oldest capital. Found it! Here, ranger.",
  },
  {
    id: "g5-bolt", band: "5", map: "us", title: "The Golden Bolt", item: "a giant bolt from a bridge shop", itemIcon: "bolt",
    brief: "A giant golden bolt from a bridge-repair shop is missing! Pocket rolled it to the Pacific coast.",
    stops: ["saltlake", "sacramento", "sanfrancisco", "seattle"],
    legs: [
      { clues: ["capital", "history", "region"], opts: ["sanfrancisco", "phoenix", "denver"] },
      { clues: ["landmark", "ocean"], opts: ["seattle", "saltlake", "austin"] },
    ],
    traits: ["landmark", "ocean", "region"],
    hideoutOpts: ["sacramento", "denver", "boston"],
    end: "Beep-boop! I wanted to see if the bolt fits the Space Needle. It doesn't. Here it is!",
  },
  {
    id: "g5-bigben", band: "5", map: "world", title: "The Bell Clapper", item: "a clock tower's spare bell clapper", itemIcon: "bell",
    brief: "Pocket borrowed a spare bell clapper and flew around the world! Use continents, rivers and landmarks to visit capital cities.",
    stops: ["washington_w", "ottawa", "london", "cairo", "tokyo"],
    legs: [
      { clues: ["capital", "border", "continent"], opts: ["mexicocity", "london", "tokyo"] },
      { clues: ["landmark", "river", "continent"], opts: ["cairo", "sydney", "mexicocity"] },
      { clues: ["river", "landmark", "continent"], opts: ["tokyo", "sydney", "ottawa"] },
    ],
    traits: ["capital", "landmark", "continent"],
    hideoutOpts: ["sydney", "london", "mexicocity"],
    end: "Bong! I rang it on a fast train, and then I gave it a polish. Here's the clapper back!",
  },
  {
    id: "g5-sail", band: "5", map: "world", title: "The Opera House Sail", item: "a model sail", itemIcon: "sail",
    brief: "A tiny model sail is missing from a museum! Pocket left an IOU and flew south, then far across the Pacific.",
    stops: ["washington_w", "mexicocity", "tokyo", "sydney"],
    legs: [
      { clues: ["capital", "border", "continent"], opts: ["ottawa", "cairo", "london"] },
      { clues: ["capital", "landmark", "continent"], opts: ["london", "cairo", "ottawa"] },
    ],
    traits: ["landmark", "continent"],
    hideoutOpts: ["london", "cairo", "mexicocity"],
    end: "Beep! I wanted to see the sail-shaped roof in person. It's so pretty! Here's your sail.",
  },
];
