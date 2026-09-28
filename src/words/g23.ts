/*
 * Grades 2 and 3: vowel teams, blends and digraphs, grade-level spelling, fixing
 * misspellings, and first prefixes and suffixes.
 *   RF.2.4 phonics and word analysis (NC numbering; decoding and encoding)
 *   L.2.2 / L.3.2 conventions continuum: spelling
 *   RF.3.3 phonics and word analysis (grades 3-5 keep Common Core numbering)
 *   L.3.4 vocabulary: meaning of a word when a known prefix or suffix is added
 */
import { build, finish, fix, part, spell } from "../worm/challenges";

const TEAM = "Vowel teams";
const BLEND = "Blends and digraphs";

export const grade2 = finish("2", [
  // Vowel teams
  spell("RF.2.4", TEAM, "B OA T", "BOAT", "OW O", { clue: "We rowed the ____ across the lake.", tip: "OA makes the long O sound." }),
  spell("RF.2.4", TEAM, "R AI N", "RAIN", "AY A", { clue: "Take an umbrella in case it starts to ____.", tip: "AI in the middle of a word makes the long A sound." }),
  spell("RF.2.4", TEAM, "TR EE", "TREE", "EA EY", { clue: "An apple grows on a ____.", tip: "EE makes the long E sound." }),
  spell("RF.2.4", TEAM, "PL AY", "PLAY", "AI A", { clue: "Can you come outside to ____?", tip: "AY at the end of a word makes the long A sound." }),
  spell("RF.2.4", TEAM, "SN OW", "SNOW", "OA O", { clue: "The ____ fell, and the ground turned white.", tip: "OW can make the long O sound." }),
  spell("RF.2.4", TEAM, "L IGH T", "LIGHT", "I E", { clue: "Turn on the ____ so we can see.", tip: "IGH makes the long I sound." }),
  spell("RF.2.4", TEAM, "T EE TH", "TEETH", "EA IE", { clue: "Brush your ____ every day.", tip: "EE makes the long E sound." }),
  spell("RF.2.4", TEAM, "B EA CH", "BEACH", "EE E", { clue: "We built a sandcastle at the ____.", tip: "EA can make the long E sound." }),
  spell("RF.2.4", TEAM, "M OO N", "MOON", "OU U", { clue: "The ____ shines at night.", tip: "OO makes the sound in MOON and ZOO." }),
  spell("RF.2.4", TEAM, "R OA D", "ROAD", "OW O", { clue: "Look both ways before you cross the ____.", tip: "OA makes the long O sound." }),
  spell("RF.2.4", TEAM, "CL OU D", "CLOUD", "OW O", { clue: "A gray ____ covered the sun.", tip: "OU makes the /ow/ sound in the middle of a word." }),
  spell("RF.2.4", TEAM, "T OY", "TOY", "OI O", { clue: "My favorite ____ is a red truck.", tip: "OY makes the /oy/ sound at the end of a word." }),
  // Blends and digraphs
  spell("RF.2.4", BLEND, "FR O G", "FROG", "FL R", { clue: "A green ____ hopped into the pond." }),
  spell("RF.2.4", BLEND, "ST O P", "STOP", "S SP", { clue: "A red light means ____." }),
  spell("RF.2.4", BLEND, "CL A P", "CLAP", "CR C", { clue: "____ your hands to the beat." }),
  spell("RF.2.4", BLEND, "SPL A SH", "SPLASH", "SP CH", { clue: "The ducks ____ in the puddle." }),
  spell("RF.2.4", BLEND, "SH E LL", "SHELL", "CH A", { clue: "I found a pretty ____ on the beach." }),
  spell("RF.2.4", BLEND, "TR U CK", "TRUCK", "DR K", { clue: "The dump ____ carried dirt." }),
  spell("RF.2.4", BLEND, "BR U SH", "BRUSH", "BL CH", { clue: "I ____ my hair every morning." }),
  spell("RF.2.4", BLEND, "GR A SS", "GRASS", "CR Z", { clue: "Cows eat green ____." }),
  // Fix the misspelling
  fix("L.2.2", "SAYD", "SAID"),
  fix("L.2.2", "WAZ", "WAS", "WAS ends with S, even though it sounds like Z."),
  fix("L.2.2", "BECAWSE", "BECAUSE"),
  fix("L.2.2", "THAY", "THEY"),
  fix("L.2.2", "WHITCH", "WHICH"),
  fix("L.2.2", "COMMING", "COMING", "Drop the E and add ING: come, coming."),
  fix("L.2.2", "OPUN", "OPEN"),
  fix("L.2.2", "AROWND", "AROUND"),
  fix("L.2.2", "PRITTY", "PRETTY"),
]);

const AFFIX = "Prefixes and suffixes";
const SPELL3 = "Spell high-frequency words";

export const grade3 = finish("3", [
  // Which prefix or suffix?
  part("L.3.4", AFFIX, "UN", "RE PRE MIS", 'Shoot the prefix that makes HAPPY mean "not happy"', "UNHAPPY"),
  part("L.3.4", AFFIX, "RE", "UN PRE DIS", 'Shoot the prefix that makes PAINT mean "paint again"', "REPAINT"),
  part("L.3.4", AFFIX, "PRE", "RE UN MIS", 'Shoot the prefix that makes HEAT mean "heat before"', "PREHEAT"),
  part("L.3.4", AFFIX, "FUL", "LESS LY ER", 'Shoot the suffix that makes HOPE mean "full of hope"', "HOPEFUL"),
  part("L.3.4", AFFIX, "LESS", "FUL ER LY", 'Shoot the suffix that makes FEAR mean "without fear"', "FEARLESS"),
  part("L.3.4", AFFIX, "ER", "FUL LESS NESS", 'Shoot the suffix that makes TEACH mean "a person who teaches"', "TEACHER"),
  part("L.3.4", AFFIX, "DIS", "RE PRE SUB", 'Shoot the prefix that makes AGREE mean "not agree"', "DISAGREE"),
  part("L.3.4", AFFIX, "LY", "FUL LESS ING", 'Shoot the suffix that makes QUICK mean "in a quick way"', "QUICKLY"),
  part("L.3.4", AFFIX, "MIS", "RE UN PRE", 'Shoot the prefix that makes SPELL mean "spell wrongly"', "MISSPELL"),
  part("L.3.4", AFFIX, "NESS", "LY ER EST", 'Shoot the suffix that makes KIND mean "the state of being kind"', "KINDNESS"),
  // Build a word
  build("L.3.4", "RE READ", "REREAD", "UN PRE ROAD", "to read again"),
  build("L.3.4", "PLAY FUL", "PLAYFUL", "LESS LY", "full of play"),
  build("L.3.4", "CARE LESS", "CARELESS", "FUL ER", "without care"),
  build("L.3.4", "UN SAFE", "UNSAFE", "RE DIS", "not safe"),
  build("L.3.4", "SLOW LY", "SLOWLY", "ER FUL", "in a slow way"),
  build("L.3.4", "PRE VIEW", "PREVIEW", "RE UN", "to see before"),
  build("L.3.4", "UN LOCK", "UNLOCK", "RE DIS", "to open a lock"),
  build("L.3.4", "SING ER", "SINGER", "ING LY", "a person who sings"),
  // Spell grade-level words
  spell("L.3.2", SPELL3, "B E C AU SE", "BECAUSE", "AW Z", { clue: "I wore a coat ____ it was cold." }),
  spell("L.3.2", SPELL3, "FR IE ND", "FRIEND", "EI E", { clue: "My best ____ lives next door.", tip: "Remember: a FRIEND is there to the END." }),
  spell("L.3.2", SPELL3, "TH EY", "THEY", "AY A", { clue: "____ went to the park together." }),
  spell("L.3.2", SPELL3, "A G AI N", "AGAIN", "AY E", { clue: "Please say that ____." }),
  spell("L.3.2", SPELL3, "PEO PLE", "PEOPLE", "PE PUL", { clue: "Many ____ came to the fair." }),
  spell("L.3.2", SPELL3, "WH ERE", "WHERE", "W AIR", { clue: "____ did you put my shoes?", tip: "WHERE has HERE inside it, and both are about places." }),
  spell("L.3.2", SPELL3, "TH OUGH T", "THOUGHT", "AU OW", { clue: "I ____ about the puzzle all night." }),
  spell("L.3.2", SPELL3, "EN OUGH", "ENOUGH", "UF UFF", { clue: "Do we have ____ chairs for everyone?", tip: "OUGH can make the /uff/ sound." }),
  spell("L.3.2", SPELL3, "B EAU TI FUL", "BEAUTIFUL", "EW FULL", { clue: "The sunset was ____.", tip: "The suffix FUL has only one L." }),
  spell("L.3.2", SPELL3, "D OE S", "DOES", "U Z", { clue: "____ your dog like to swim?" }),
  spell("L.3.2", SPELL3, "S AY S", "SAYS", "E Z", { clue: "Mom ____ it's time for dinner." }),
  spell("L.3.2", SPELL3, "B UI LD", "BUILD", "IL I", { clue: "Let's ____ a fort out of blankets." }),
  // Fix the misspelling
  fix("L.3.2", "UNTILL", "UNTIL", "UNTIL has only one L at the end."),
  fix("L.3.2", "SCISSERS", "SCISSORS"),
  fix("L.3.2", "COLLOR", "COLOR"),
  fix("L.3.2", "TRUELY", "TRULY", "Drop the E: true, truly."),
  fix("L.3.2", "WRITTING", "WRITING", "Drop the silent E and add ING: write, writing."),
  fix("L.3.2", "HOPEING", "HOPING", "Drop the silent E and add ING: hope, hoping."),
  fix("L.3.2", "NOTISE", "NOTICE"),
]);
