/*
 * Kindergarten and grade 1: phonics, rhymes, simple spelling and sight words.
 * NC numbering for K-1 Reading: Foundational Skills (see src/kit/banks/ela/NOTES.md):
 *   RF.K.3 / RF.1.3 phonological awareness (rhymes, sounds in words)
 *   RF.K.4 / RF.1.4 phonics and word analysis, decoding and encoding (letter sounds,
 *   digraphs, silent e, vowel teams, sight words)
 */
import { finish, letterSound, rhyme, spell, teamSound } from "../worm/challenges";

const K_SIGHT = "Sight words";

export const gradeK = finish("K", [
  // Letter sounds (consonants)
  letterSound("RF.K.4", "B", "D P M"),
  letterSound("RF.K.4", "S", "F T M"),
  letterSound("RF.K.4", "M", "N W B"),
  letterSound("RF.K.4", "T", "F L D"),
  letterSound("RF.K.4", "F", "V T H"),
  letterSound("RF.K.4", "D", "B P G"),
  letterSound("RF.K.4", "P", "B D R"),
  letterSound("RF.K.4", "N", "M H R"),
  letterSound("RF.K.4", "L", "I T R"),
  letterSound("RF.K.4", "R", "P B N"),
  letterSound("RF.K.4", "H", "N M L"),
  letterSound("RF.K.4", "G", "J D P"),
  letterSound("RF.K.4", "K", "H L T"),
  letterSound("RF.K.4", "J", "Y I L"),
  letterSound("RF.K.4", "W", "M V Y"),
  letterSound("RF.K.4", "V", "W F Y"),
  letterSound("RF.K.4", "Z", "V N T"),
  // Short vowels
  letterSound("RF.K.4", "A", "E O U"),
  letterSound("RF.K.4", "E", "I O U"),
  letterSound("RF.K.4", "I", "A O U"),
  letterSound("RF.K.4", "O", "U I E"),
  letterSound("RF.K.4", "U", "I E M"),
  // Rhymes
  rhyme("RF.K.3", "CAT", "HAT", "DOG CUP SUN"),
  rhyme("RF.K.3", "BUG", "RUG", "BED CAP FOX"),
  rhyme("RF.K.3", "PIG", "WIG", "PAN TOP BUS"),
  rhyme("RF.K.3", "HEN", "TEN", "HAM SIT BOX"),
  rhyme("RF.K.3", "MOP", "TOP", "MAP SUN LEG"),
  rhyme("RF.K.3", "CAKE", "LAKE", "CAR BOOK FISH"),
  rhyme("RF.K.3", "BELL", "WELL", "BALL BIKE DOG"),
  rhyme("RF.K.3", "STAR", "CAR", "SUN SKY BED"),
  rhyme("RF.K.3", "KING", "RING", "KITE BAT CUP"),
  rhyme("RF.K.3", "BEE", "TREE", "BED DOG HAT"),
  // Spell CVC words (encoding)
  spell("RF.K.4", "Spell short-vowel words", "C A T", "CAT", "B O G"),
  spell("RF.K.4", "Spell short-vowel words", "D O G", "DOG", "B U T"),
  spell("RF.K.4", "Spell short-vowel words", "S U N", "SUN", "R E P"),
  spell("RF.K.4", "Spell short-vowel words", "P I G", "PIG", "D O T"),
  spell("RF.K.4", "Spell short-vowel words", "H A T", "HAT", "N O B"),
  spell("RF.K.4", "Spell short-vowel words", "B U G", "BUG", "D I N"),
  spell("RF.K.4", "Spell short-vowel words", "M O P", "MOP", "N U B"),
  spell("RF.K.4", "Spell short-vowel words", "R E D", "RED", "A L P"),
  spell("RF.K.4", "Spell short-vowel words", "F O X", "FOX", "S U T"),
  spell("RF.K.4", "Spell short-vowel words", "C U P", "CUP", "B O M"),
  spell("RF.K.4", "Spell short-vowel words", "N E T", "NET", "M I D"),
  spell("RF.K.4", "Spell short-vowel words", "B E D", "BED", "P O G"),
  // Sight words (Dolch-style pre-primer / primer list)
  spell("RF.K.4", K_SIGHT, "T H E", "THE", "A U N", { sight: true }),
  spell("RF.K.4", K_SIGHT, "A N D", "AND", "E M T", { sight: true }),
  spell("RF.K.4", K_SIGHT, "S E E", "SEE", "O M I", { sight: true }),
  spell("RF.K.4", K_SIGHT, "C A N", "CAN", "O R T", { sight: true }),
  spell("RF.K.4", K_SIGHT, "Y O U", "YOU", "A E W", { sight: true }),
  spell("RF.K.4", K_SIGHT, "L O O K", "LOOK", "A E B", { sight: true }),
  spell("RF.K.4", K_SIGHT, "P L A Y", "PLAY", "E O R", { sight: true }),
  spell("RF.K.4", K_SIGHT, "G O", "GO", "A U T", { sight: true }),
  spell("RF.K.4", K_SIGHT, "W E", "WE", "A O M", { sight: true }),
  spell("RF.K.4", K_SIGHT, "M Y", "MY", "A E B", { sight: true }),
  spell("RF.K.4", K_SIGHT, "I S", "IS", "A T Z", { sight: true }),
  spell("RF.K.4", K_SIGHT, "L I K E", "LIKE", "O A T", { sight: true }),
]);

const DIGRAPH = "Digraphs (sh, ch, th, wh, ck, ng)";
const SILENT_E = "Silent e words";
const TEAMS = "Vowel teams";
const SIGHT1 = "Sight words";

export const grade1 = finish("1", [
  // Which letters make this sound?
  teamSound("RF.1.4", DIGRAPH, "SH", "SHIP", "CH TH WH"),
  teamSound("RF.1.4", DIGRAPH, "CH", "CHIN", "SH TH WH"),
  teamSound("RF.1.4", DIGRAPH, "TH", "THUMB", "SH CH WH"),
  teamSound("RF.1.4", DIGRAPH, "WH", "WHALE", "TH SH CH"),
  teamSound("RF.1.4", DIGRAPH, "CK", "DUCK", "SH TH CH", "end"),
  teamSound("RF.1.4", DIGRAPH, "NG", "RING", "SH TH CK", "end"),
  // Spell words with digraphs
  spell("RF.1.4", DIGRAPH, "SH I P", "SHIP", "CH A"),
  spell("RF.1.4", DIGRAPH, "CH I N", "CHIN", "SH E"),
  spell("RF.1.4", DIGRAPH, "F I SH", "FISH", "CH TH A"),
  spell("RF.1.4", DIGRAPH, "TH I N", "THIN", "SH E"),
  spell("RF.1.4", DIGRAPH, "D U CK", "DUCK", "K O", { tip: "CK comes right after a short vowel." }),
  spell("RF.1.4", DIGRAPH, "WH E N", "WHEN", "W A", { tip: "Question words like WHEN start with WH." }),
  spell("RF.1.4", DIGRAPH, "B A TH", "BATH", "T SH"),
  spell("RF.1.4", DIGRAPH, "R I NG", "RING", "NK O"),
  // Silent e (CVCe)
  spell("RF.1.4", SILENT_E, "C A K E", "CAKE", "O I", { tip: "The silent E makes the A say its name." }),
  spell("RF.1.4", SILENT_E, "B I K E", "BIKE", "A U", { tip: "The silent E makes the I say its name." }),
  spell("RF.1.4", SILENT_E, "H O M E", "HOME", "A U", { tip: "The silent E makes the O say its name." }),
  spell("RF.1.4", SILENT_E, "C U T E", "CUTE", "A O", { tip: "The silent E makes the U say its name." }),
  spell("RF.1.4", SILENT_E, "R O P E", "ROPE", "A I", { tip: "The silent E makes the O say its name." }),
  spell("RF.1.4", SILENT_E, "K I T E", "KITE", "A O", { tip: "The silent E makes the I say its name." }),
  spell("RF.1.4", SILENT_E, "N O S E", "NOSE", "A U", { tip: "The silent E makes the O say its name." }),
  // Vowel teams
  teamSound("RF.1.4", TEAMS, "AI", "RAIN", "OA EE OU"),
  teamSound("RF.1.4", TEAMS, "EE", "TREE", "AI OA OU"),
  teamSound("RF.1.4", TEAMS, "OA", "BOAT", "AI EE OU"),
  teamSound("RF.1.4", TEAMS, "AY", "PLAY", "OY EE OA"),
  // Rhymes
  rhyme("RF.1.3", "LIGHT", "NIGHT", "LIFT LEFT LOT"),
  rhyme("RF.1.3", "SHIP", "CHIP", "SHOP SHED CHIN"),
  rhyme("RF.1.3", "JUMP", "BUMP", "JUNK JAM LAMP"),
  rhyme("RF.1.3", "RAIN", "TRAIN", "RAN RUN RING"),
  rhyme("RF.1.3", "BOAT", "COAT", "BOOT BAT COT"),
  rhyme("RF.1.3", "FISH", "DISH", "FIST DUSK MASH"),
  // Sight words (Dolch-style first grade list)
  spell("RF.1.4", SIGHT1, "S A I D", "SAID", "E Y", { sight: true }),
  spell("RF.1.4", SIGHT1, "W A S", "WAS", "U Z", { sight: true }),
  spell("RF.1.4", SIGHT1, "T H E Y", "THEY", "A I", { sight: true }),
  spell("RF.1.4", SIGHT1, "W A N T", "WANT", "O U", { sight: true }),
  spell("RF.1.4", SIGHT1, "W H A T", "WHAT", "O U", { sight: true }),
  spell("RF.1.4", SIGHT1, "H A V E", "HAVE", "U F", { sight: true }),
  spell("RF.1.4", SIGHT1, "C O M E", "COME", "U A", { sight: true }),
  spell("RF.1.4", SIGHT1, "F R O M", "FROM", "U N", { sight: true }),
  spell("RF.1.4", SIGHT1, "W E R E", "WERE", "A U", { sight: true }),
  spell("RF.1.4", SIGHT1, "O F", "OF", "U V", { sight: true }),
  spell("RF.1.4", SIGHT1, "W H E R E", "WHERE", "A U", { sight: true }),
]);
