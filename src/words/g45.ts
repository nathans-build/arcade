/*
 * Grades 4 and 5: prefixes, suffixes and roots; homophones; grade-level spelling.
 *   L.4.4 / L.5.4 vocabulary: Greek and Latin affixes and roots as clues to meaning
 *   L.4.1 grammar and usage continuum: frequently confused words (to, too, two; there, their)
 *   L.5.2 conventions continuum: spell grade-appropriate words correctly
 */
import { build, finish, part, spell, usage } from "../worm/challenges";

const AFFIX = "Greek and Latin affixes";
const ROOT = "Greek and Latin roots";
const HOMO = "Homophones";

export const grade4 = finish("4", [
  // Affixes
  part("L.4.4", AFFIX, "UN", "RE PRE SUB", 'Shoot the prefix that means "not"', "UNFAIR"),
  part("L.4.4", AFFIX, "RE", "UN MIS PRE", 'Shoot the prefix that means "again"', "REBUILD"),
  part("L.4.4", AFFIX, "PRE", "POST SUB RE", 'Shoot the prefix that means "before"', "PREVIEW"),
  part("L.4.4", AFFIX, "SUB", "SUPER RE TRI", 'Shoot the prefix that means "under"', "SUBMARINE"),
  part("L.4.4", AFFIX, "TRI", "BI UNI SUB", 'Shoot the prefix that means "three"', "TRIANGLE"),
  part("L.4.4", AFFIX, "BI", "TRI UNI RE", 'Shoot the prefix that means "two"', "BICYCLE"),
  part("L.4.4", AFFIX, "ABLE", "LESS NESS FUL", 'Shoot the suffix that means "able to be"', "WASHABLE"),
  part("L.4.4", AFFIX, "LESS", "FUL ABLE ER", 'Shoot the suffix that means "without"', "HOMELESS"),
  part("L.4.4", AFFIX, "OR", "LY FUL NESS", 'Shoot the suffix that means "a person who" in ACTOR', "ACTOR"),
  // Roots
  part("L.4.4", ROOT, "TELE", "GRAPH PHOTO MICRO", 'Shoot the root that means "far"', "TELEVISION"),
  part("L.4.4", ROOT, "GRAPH", "PHON SCOPE MICRO", 'Shoot the root that means "write"', "AUTOGRAPH"),
  part("L.4.4", ROOT, "PHON", "GRAPH SCOPE TELE", 'Shoot the root that means "sound"', "PHONICS"),
  part("L.4.4", ROOT, "PORT", "SPECT GRAPH VIS", 'Shoot the root that means "carry"', "PORTABLE"),
  part("L.4.4", ROOT, "VIS", "PORT PHON DICT", 'Shoot the root that means "see"', "VISION"),
  part("L.4.4", ROOT, "DICT", "PORT VIS GRAPH", 'Shoot the root that means "say"', "PREDICT"),
  // Build a word
  build("L.4.4", "RE PLAY ED", "REPLAYED", "UN ING", "played again"),
  build("L.4.4", "UN BREAK ABLE", "UNBREAKABLE", "DIS ING", "not able to be broken"),
  build("L.4.4", "TELE SCOPE", "TELESCOPE", "MICRO PHONE", "a tool for seeing things far away"),
  build("L.4.4", "TRANS PORT", "TRANSPORT", "EX IM", "to carry from one place across to another"),
  build("L.4.4", "AUTO GRAPH", "AUTOGRAPH", "PHOTO TELE", "a person's name, written by that person"),
  build("L.4.4", "BI CYCLE", "BICYCLE", "TRI UNI", "a bike with two wheels"),
  build("L.4.4", "PRE HEAT ED", "PREHEATED", "RE ING", "heated before"),
  build("L.4.4", "HOPE LESS LY", "HOPELESSLY", "FUL NESS", "in a way that is without hope"),
  // Homophones
  usage("L.4.1", HOMO, "THEIR", "THERE THEY'RE", "We left ___ bikes by the door. (the bikes belong to them)"),
  usage("L.4.1", HOMO, "THERE", "THEIR THEY'RE", "Put the box over ___."),
  usage("L.4.1", HOMO, "THEY'RE", "THEIR THERE", "___ going to win the game!"),
  usage("L.4.1", HOMO, "TOO", "TO TWO", "I want to go ___."),
  usage("L.4.1", HOMO, "TWO", "TO TOO", "I have ___ dogs and a cat."),
  usage("L.4.1", HOMO, "YOUR", "YOU'RE", "Is this ___ backpack?"),
  usage("L.4.1", HOMO, "YOU'RE", "YOUR", "___ my best friend."),
  usage("L.4.1", HOMO, "ITS", "IT'S", "The dog wagged ___ tail."),
  usage("L.4.1", HOMO, "IT'S", "ITS", "___ raining outside."),
  usage("L.4.1", HOMO, "THREW", "THROUGH", "Sam ___ the ball to me."),
  usage("L.4.1", HOMO, "HEAR", "HERE", "Can you ___ the bell?"),
  usage("L.4.1", HOMO, "WROTE", "ROTE", "She ___ a letter to her grandma."),
]);

const SPELL5 = "Spell grade-level words";

export const grade5 = finish("5", [
  // Roots
  part("L.5.4", ROOT, "PHOTO", "GEO BIO PHON", 'Shoot the root that means "light"', "PHOTOGRAPH"),
  part("L.5.4", ROOT, "BIO", "GEO PHOTO AQUA", 'Shoot the root that means "life"', "BIOLOGY"),
  part("L.5.4", ROOT, "AQUA", "TERR PHOTO AUTO", 'Shoot the root that means "water"', "AQUARIUM"),
  part("L.5.4", ROOT, "TERR", "AQUA AUD SPECT", 'Shoot the root that means "earth" or "land"', "TERRAIN"),
  part("L.5.4", ROOT, "AUD", "VIS DICT PORT", 'Shoot the root that means "hear"', "AUDIO"),
  part("L.5.4", ROOT, "SPECT", "AUD PORT DICT", 'Shoot the root that means "look"', "INSPECT"),
  part("L.5.4", ROOT, "RUPT", "STRUCT PORT JECT", 'Shoot the root that means "break"', "ERUPT"),
  part("L.5.4", ROOT, "STRUCT", "RUPT JECT SPECT", 'Shoot the root that means "build"', "STRUCTURE"),
  part("L.5.4", ROOT, "JECT", "RUPT PORT STRUCT", 'Shoot the root that means "throw"', "PROJECT"),
  part("L.5.4", ROOT, "AUTO", "BIO TELE MICRO", 'Shoot the root that means "self"', "AUTOPILOT"),
  part("L.5.4", ROOT, "MICRO", "MEGA TELE AUTO", 'Shoot the root that means "small"', "MICROSCOPE"),
  part("L.5.4", ROOT, "MULTI", "UNI MONO BI", 'Shoot the root that means "many"', "MULTIPLY"),
  // Build a word
  build("L.5.4", "INTER RUPT", "INTERRUPT", "DIS E", "to break in while someone is talking"),
  build("L.5.4", "IN SPECT OR", "INSPECTOR", "EX ER", "a person whose job is to look closely at things"),
  build("L.5.4", "AUD IENCE", "AUDIENCE", "VIS ANCE", "the people who listen to or watch a show"),
  build("L.5.4", "MICRO SCOPE", "MICROSCOPE", "TELE PHONE", "a tool that makes tiny things look big"),
  build("L.5.4", "BIO LOGY", "BIOLOGY", "GEO GRAPHY", "the study of living things"),
  build("L.5.4", "PHOTO GRAPH", "PHOTOGRAPH", "AUTO PHON", "a picture made with light"),
  build("L.5.4", "RE JECT", "REJECT", "IN PRO", "to throw back; to refuse"),
  build("L.5.4", "CON STRUCT", "CONSTRUCT", "DE IN", "to build"),
  // Spell grade-level words
  spell("L.5.2", SPELL5, "NE CE SS ARY", "NECESSARY", "SE C ERY", { clue: "Sleep is ____ for good health.", tip: "One C, two S's: a shirt has one Collar and two Sleeves." }),
  spell("L.5.2", SPELL5, "SEP AR ATE", "SEPARATE", "ER IT", { clue: "Keep the raw meat ____ from the salad.", tip: "There is A RAT in sepARATe." }),
  spell("L.5.2", SPELL5, "CAL EN DAR", "CALENDAR", "ER IN", { clue: "Mark the party on the ____.", tip: "CALENDAR ends in AR." }),
  spell("L.5.2", SPELL5, "DEF IN ITE LY", "DEFINITELY", "AN ATE", { clue: "I will ____ be at your game!", tip: "DEFINITELY has FINITE inside it." }),
  spell("L.5.2", SPELL5, "BE LIEVE", "BELIEVE", "LEIVE LEAVE", { clue: "I ____ you can do it.", tip: "Never beLIEve a LIE." }),
  spell("L.5.2", SPELL5, "W EI RD", "WEIRD", "IE EE", { clue: "That strange noise was really ____.", tip: "WEIRD breaks the I-before-E rule." }),
  spell("L.5.2", SPELL5, "A CROSS", "ACROSS", "AC CROS", { clue: "We swam ____ the lake.", tip: "ACROSS has one C and ends with CROSS." }),
  spell("L.5.2", SPELL5, "GRAM MAR", "GRAMMAR", "MER GRAMM", { clue: "Good ____ helps your writing make sense.", tip: "GRAMMAR ends in AR." }),
]);
