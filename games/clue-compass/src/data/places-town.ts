import type { Place } from "@/chase/types";

/*
 * Compass Corners: a made-up town for kindergarten (community helpers and places) and grades 1–2
 * (map directions on a town map). Town units: x 0–100 west→east, y 0–60 north→south.
 * Every place has a helper, a thing and a sound, each unique, so every picture clue fits one place.
 */
const T = "town";

export const TOWN_PLACES: Place[] = [
  {
    id: "school", name: "the School", map: "town", at: [15, 10], atSrc: T, scene: "school", local: "a teacher",
    facts: [
      { k: "helper", v: "teacher", say: "This is the school. Teachers help kids learn here.", hint: "Pocket went where a TEACHER helps kids learn.", note: "My hideout has a teacher!", icon: "person:teacher", src: T },
      { k: "thing", v: "school bus", say: "The yellow school bus stops at the school.", hint: "Pocket rode away on a big YELLOW BUS!", note: "My hideout has a yellow bus!", icon: "bus", src: T },
      { k: "sound", v: "ABC", say: "At school we sing our ABCs.", hint: "Pocket heard kids singing their A-B-Cs.", note: "At my hideout, kids sing A-B-C!", icon: "say:ABC", src: T },
    ],
  },
  {
    id: "library", name: "the Library", map: "town", at: [50, 10], atSrc: T, scene: "library", local: "a librarian",
    facts: [
      { k: "helper", v: "librarian", say: "This is the library. The librarian helps us find books.", hint: "Pocket went to see the LIBRARIAN.", note: "My hideout has a librarian!", icon: "person:librarian", src: T },
      { k: "thing", v: "books", say: "The library has shelves and shelves of books.", hint: "Pocket wanted to borrow a BOOK.", note: "My hideout is full of books!", icon: "book", src: T },
      { k: "sound", v: "Shh!", say: "In the library we use quiet voices. Shh!", hint: "Pocket went where everyone says SHH!", note: "Shh! My hideout is a quiet place.", icon: "say:SHH", src: T },
    ],
  },
  {
    id: "fire", name: "the Fire Station", map: "town", at: [85, 10], atSrc: T, scene: "fire", local: "a firefighter",
    facts: [
      { k: "helper", v: "firefighter", say: "This is the fire station. Firefighters keep us safe from fires.", hint: "Pocket went to visit a FIREFIGHTER.", note: "A firefighter lives at my hideout!", icon: "person:firefighter", src: T },
      { k: "thing", v: "fire truck", say: "The big red fire truck lives at the fire station.", hint: "Pocket wanted to see a big RED FIRE TRUCK.", note: "My hideout has a red fire truck!", icon: "firetruck", src: T },
      { k: "sound", v: "wee-oo", say: "The fire truck siren goes WEE-OO!", hint: "Pocket zoomed toward a WEE-OO siren!", note: "My hideout goes WEE-OO!", icon: "say:WEE-OO", src: T },
    ],
  },
  {
    id: "park", name: "the Park", map: "town", at: [15, 30], atSrc: T, scene: "park", local: "a park worker",
    facts: [
      { k: "helper", v: "park worker", say: "This is the park. The park worker rakes leaves and keeps it clean.", hint: "Pocket went to help the PARK WORKER rake leaves.", note: "My hideout has a park worker with a rake!", icon: "person:parkworker", src: T },
      { k: "thing", v: "slide", say: "The park has a tall slide and swings.", hint: "Pocket wanted to go down a SLIDE!", note: "My hideout has a slide!", icon: "slide", src: T },
      { k: "sound", v: "wheee", say: "Kids shout WHEEE on the slide.", hint: "Pocket went where kids shout WHEEE!", note: "Everybody shouts WHEEE at my hideout!", icon: "say:WHEEE", src: T },
    ],
  },
  {
    id: "bakery", name: "the Bakery", map: "town", at: [38, 30], atSrc: T, scene: "bakery", local: "a baker",
    facts: [
      { k: "helper", v: "baker", say: "This is the bakery. The baker makes bread and cakes.", hint: "Pocket went to see the BAKER in a tall white hat.", note: "A baker works at my hideout!", icon: "person:baker", src: T },
      { k: "thing", v: "bread", say: "Warm bread comes out of the bakery oven.", hint: "Pocket smelled warm BREAD.", note: "My hideout smells like bread!", icon: "bread", src: T },
      { k: "sound", v: "ding", say: "The oven timer goes DING when the bread is done.", hint: "Pocket heard an oven timer go DING!", note: "The oven at my hideout goes DING!", icon: "say:DING", src: T },
    ],
  },
  {
    id: "post", name: "the Post Office", map: "town", at: [62, 30], atSrc: T, scene: "post", local: "a mail carrier",
    facts: [
      { k: "helper", v: "mail carrier", say: "This is the post office. Mail carriers bring letters to our homes.", hint: "Pocket went to find the MAIL CARRIER.", note: "A mail carrier works at my hideout!", icon: "person:mail", src: T },
      { k: "thing", v: "letters", say: "Letters and packages are sorted at the post office.", hint: "Pocket wanted to mail a LETTER.", note: "My hideout has piles of letters!", icon: "letter", src: T },
      { k: "sound", v: "stamp", say: "Stamp, stamp! Every letter gets a stamp.", hint: "Pocket heard STAMP, STAMP!", note: "STAMP, STAMP goes my hideout!", icon: "say:STAMP", src: T },
    ],
  },
  {
    id: "grocery", name: "the Grocery Store", map: "town", at: [85, 30], atSrc: T, scene: "grocery", local: "a cashier",
    facts: [
      { k: "helper", v: "cashier", say: "This is the grocery store. The cashier helps you pay for food.", hint: "Pocket went to see the CASHIER.", note: "A cashier works at my hideout!", icon: "person:cashier", src: T },
      { k: "thing", v: "shopping cart", say: "Shoppers push carts full of apples and milk.", hint: "Pocket rolled away in a SHOPPING CART!", note: "My hideout has shopping carts!", icon: "cart", src: T },
      { k: "sound", v: "beep", say: "The scanner goes BEEP for every food.", hint: "Pocket heard a scanner go BEEP!", note: "BEEP! BEEP! goes my hideout!", icon: "say:BEEP", src: T },
    ],
  },
  {
    id: "farm", name: "the Farm", map: "town", at: [15, 50], atSrc: T, scene: "farm", local: "a farmer",
    facts: [
      { k: "helper", v: "farmer", say: "This is the farm. The farmer grows food for us to eat.", hint: "Pocket went to help the FARMER.", note: "A farmer works at my hideout!", icon: "person:farmer", src: T },
      { k: "thing", v: "tractor", say: "The farmer drives a green tractor in the fields.", hint: "Pocket wanted to ride a TRACTOR.", note: "My hideout has a tractor!", icon: "tractor", src: T },
      { k: "sound", v: "moo", say: "The cows on the farm say MOO!", hint: "Pocket heard a cow say MOO!", note: "MOO! There are cows at my hideout!", icon: "say:MOO", src: T },
    ],
  },
  {
    id: "police", name: "the Police Station", map: "town", at: [50, 50], atSrc: T, scene: "police", local: "a police officer",
    facts: [
      { k: "helper", v: "police officer", say: "This is the police station. Police officers help keep our town safe.", hint: "Pocket went to ask a POLICE OFFICER for help.", note: "A police officer works at my hideout!", icon: "person:police", src: T },
      { k: "thing", v: "police car", say: "The police car has blue lights on top.", hint: "Pocket saw a car with BLUE LIGHTS on top.", note: "My hideout has a car with blue lights!", icon: "policecar", src: T },
      { k: "sound", v: "tweet", say: "The crossing whistle goes TWEET!", hint: "Pocket heard a whistle go TWEET!", note: "TWEET! A whistle blows at my hideout!", icon: "say:TWEET", src: T },
    ],
  },
  {
    id: "clinic", name: "the Doctor's Office", map: "town", at: [85, 50], atSrc: T, scene: "clinic", local: "a nurse",
    facts: [
      { k: "helper", v: "doctor", say: "This is the doctor's office. Doctors and nurses help sick people get well.", hint: "Pocket went to see the DOCTOR.", note: "A doctor works at my hideout!", icon: "person:doctor", src: T },
      { k: "thing", v: "bandage", say: "The nurse puts a bandage on a scraped knee.", hint: "Pocket needed a BANDAGE for a scratch.", note: "My hideout has lots of bandages!", icon: "bandage", src: T },
      { k: "sound", v: "ahh", say: "At a checkup the doctor says: open wide and say AHH!", hint: "Pocket went where you open wide and say AHH!", note: "Say AHH! That's what you do at my hideout!", icon: "say:AHH", src: T },
    ],
  },
];
