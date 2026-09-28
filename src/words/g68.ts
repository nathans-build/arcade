/*
 * Grades 6-8: Greek and Latin roots, building words from them, commonly confused words,
 * and commonly misspelled words.
 *   L.6.4 / L.7.4 / L.8.4 vocabulary: Greek or Latin affixes and roots as clues to meaning
 *   L.6.1 / L.7.1 grammar and usage continuum: commonly confused words (to verify)
 *   L.8.2 conventions continuum: spell correctly
 */
import { build, finish, part, spell, usage } from "../worm/challenges";

const ROOT = "Greek and Latin roots";
const CONFUSED = "Commonly confused words";

export const grade6 = finish("6", [
  part("L.6.4", ROOT, "GEO", "ASTRO HYDRO BIO", 'Shoot the root that means "earth"', "GEOGRAPHY"),
  part("L.6.4", ROOT, "ASTR", "GEO HYDR CHRON", 'Shoot the root that means "star"', "ASTRONOMY"),
  part("L.6.4", ROOT, "CHRON", "ASTR PATH GRAPH", 'Shoot the root that means "time"', "CHRONOLOGICAL"),
  part("L.6.4", ROOT, "HYDR", "GEO ASTR THERM", 'Shoot the root that means "water"', "HYDRANT"),
  part("L.6.4", ROOT, "THERM", "HYDR CHRON METER", 'Shoot the root that means "heat"', "THERMOS"),
  part("L.6.4", ROOT, "METER", "GRAPH SCOPE LOG", 'Shoot the root that means "measure"', "SPEEDOMETER"),
  part("L.6.4", ROOT, "PATH", "PHON CHRON LOG", 'Shoot the root that means "feeling"', "SYMPATHY"),
  part("L.6.4", ROOT, "LOGY", "GRAPHY METER SCOPE", 'Shoot the ending that means "the study of"', "ZOOLOGY"),
  part("L.6.4", ROOT, "PHOBIA", "PHIL LOGY PATH", 'Shoot the root that means "fear"', "ARACHNOPHOBIA"),
  part("L.6.4", ROOT, "DEM", "CRAT GEO CHRON", 'Shoot the root that means "people"', "DEMOCRACY"),
  build("L.6.4", "GEO LOGY", "GEOLOGY", "BIO GRAPHY", "the study of the earth and its rocks"),
  build("L.6.4", "THERMO METER", "THERMOMETER", "HYDRO GRAPH", "a tool that measures heat"),
  build("L.6.4", "SYM PATHY", "SYMPATHY", "A ANTI", "feeling sorry along with someone who is sad"),
  build("L.6.4", "ASTRO NAUT", "ASTRONAUT", "AQUA GEO", "a person who travels among the stars"),
  build("L.6.4", "DEMO CRACY", "DEMOCRACY", "AUTO LOGY", "government by the people"),
  build("L.6.4", "AUTO BIO GRAPHY", "AUTOBIOGRAPHY", "GEO LOGY", "the story of a person's life, written by that person"),
  build("L.6.4", "MONO LOGUE", "MONOLOGUE", "DIA PRO", "a long speech by one person"),
  build("L.6.4", "HEMI SPHERE", "HEMISPHERE", "ATMO BIO", "half of a sphere, such as half of the earth"),
  usage("L.6.1", CONFUSED, "AFFECTS", "EFFECTS", "Loud music ___ my mood."),
  usage("L.6.1", CONFUSED, "EFFECT", "AFFECT", "The medicine had a strong ___."),
  usage("L.6.1", CONFUSED, "ACCEPT", "EXCEPT", "I will gladly ___ your gift."),
  usage("L.6.1", CONFUSED, "EXCEPT", "ACCEPT", "Everyone came ___ Sam, who was sick."),
  usage("L.6.1", CONFUSED, "THAN", "THEN", "My dog is bigger ___ yours."),
  usage("L.6.1", CONFUSED, "THEN", "THAN", "Finish your homework, and ___ you can play."),
  usage("L.6.1", CONFUSED, "LOSE", "LOOSE", "Don't ___ your house keys."),
  usage("L.6.1", CONFUSED, "LOOSE", "LOSE", "My front tooth is ___."),
]);

export const grade7 = finish("7", [
  part("L.7.4", ROOT, "BENE", "MAL DYS ANTI", 'Shoot the root that means "good" or "well"', "BENEFIT"),
  part("L.7.4", ROOT, "MAL", "BENE PRO SYN", 'Shoot the root that means "bad"', "MALFUNCTION"),
  part("L.7.4", ROOT, "ANTI", "PRO SYN CIRCUM", 'Shoot the prefix that means "against"', "ANTIBIOTIC"),
  part("L.7.4", ROOT, "CIRCUM", "TRANS INTER SUB", 'Shoot the prefix that means "around"', "CIRCUMNAVIGATE"),
  part("L.7.4", ROOT, "TRANS", "CIRCUM SUB PRE", 'Shoot the prefix that means "across"', "TRANSATLANTIC"),
  part("L.7.4", ROOT, "INTER", "INTRA TRANS POST", 'Shoot the prefix that means "between"', "INTERSTATE"),
  part("L.7.4", ROOT, "MANU", "PED CORP VOC", 'Shoot the root that means "hand"', "MANUAL"),
  part("L.7.4", ROOT, "PED", "MANU CAP VOC", 'Shoot the root that means "foot"', "PEDAL"),
  part("L.7.4", ROOT, "VOC", "AUD SCRIB PED", 'Shoot the root that means "voice" or "call"', "VOCAL"),
  part("L.7.4", ROOT, "SCRIB", "VOC DUC MIT", 'Shoot the root that means "write"', "SCRIBBLE"),
  part("L.7.4", ROOT, "DUC", "MIT SCRIB CRED", 'Shoot the root that means "lead"', "CONDUCTOR"),
  part("L.7.4", ROOT, "CRED", "DUC VOC MIT", 'Shoot the root that means "believe"', "CREDIBLE"),
  build("L.7.4", "BENE FIT", "BENEFIT", "MAL MIS", "something that does good"),
  build("L.7.4", "CIRCUM FERENCE", "CIRCUMFERENCE", "CON INTER", "the distance around a circle"),
  build("L.7.4", "MANU SCRIPT", "MANUSCRIPT", "POST TRANS", "a document written by hand"),
  build("L.7.4", "IN CRED IBLE", "INCREDIBLE", "ABLE DUC", "too amazing to be believed"),
  build("L.7.4", "PED ESTRIAN", "PEDESTRIAN", "MANU CAP", "a person who travels on foot"),
  build("L.7.4", "INTER NATION AL", "INTERNATIONAL", "INTRA TRANS", "between or among nations"),
  build("L.7.4", "MAL FUNCTION", "MALFUNCTION", "BENE PRE", "to work badly or fail"),
  build("L.7.4", "AD VOC ATE", "ADVOCATE", "IN DUC", "to speak up in favor of someone or something"),
  usage("L.7.1", CONFUSED, "LAY", "LIE", "Please ___ the book on the table."),
  usage("L.7.1", CONFUSED, "LIE", "LAY", "I need to ___ down and rest."),
  usage("L.7.1", CONFUSED, "PRINCIPAL", "PRINCIPLE", "The ___ of our school is Ms. Diaz."),
  usage("L.7.1", CONFUSED, "PRINCIPLE", "PRINCIPAL", "Honesty is an important ___ to live by."),
  usage("L.7.1", CONFUSED, "QUITE", "QUIET QUIT", "The test was ___ easy."),
  usage("L.7.1", CONFUSED, "QUIET", "QUITE QUIT", "Be ___, the baby is asleep."),
  usage("L.7.1", CONFUSED, "DESSERT", "DESERT", "We had apple pie for ___."),
  usage("L.7.1", CONFUSED, "DESERT", "DESSERT", "Camels can live in the hot, dry ___."),
]);

const SPELL8 = "Commonly misspelled words";

export const grade8 = finish("8", [
  part("L.8.4", ROOT, "THEO", "PHIL MORPH DEM", 'Shoot the root that means "god"', "THEOLOGY"),
  part("L.8.4", ROOT, "PHIL", "PHOB THEO MORPH", 'Shoot the root that means "love"', "PHILOSOPHY"),
  part("L.8.4", ROOT, "MORPH", "CHRON PHIL NYM", 'Shoot the root that means "form" or "shape"', "METAMORPHOSIS"),
  part("L.8.4", ROOT, "NYM", "MORPH PATH THEO", 'Shoot the root that means "name"', "SYNONYM"),
  part("L.8.4", ROOT, "CHROM", "CHRON THERM NYM", 'Shoot the root that means "color"', "MONOCHROME"),
  part("L.8.4", ROOT, "PAN", "MONO MICRO HOMO", 'Shoot the root that means "all"', "PANORAMA"),
  part("L.8.4", ROOT, "HOMO", "HETERO PAN POLY", 'Shoot the root that means "same"', "HOMOPHONE"),
  part("L.8.4", ROOT, "POLY", "MONO HOMO MICRO", 'Shoot the root that means "many"', "POLYGON"),
  part("L.8.4", ROOT, "VER", "FID DUC VOC", 'Shoot the root that means "truth"', "VERDICT"),
  part("L.8.4", ROOT, "FID", "VER NYM PAN", 'Shoot the root that means "faith" or "trust"', "CONFIDENT"),
  part("L.8.4", ROOT, "FIN", "FID GRAD VER", 'Shoot the root that means "end"', "FINAL"),
  build("L.8.4", "SYN ONYM", "SYNONYM", "ANT HOM", "a word with the same meaning as another word"),
  build("L.8.4", "POLY GON", "POLYGON", "MONO PAN", "a flat shape with many angles and sides"),
  build("L.8.4", "META MORPH OSIS", "METAMORPHOSIS", "POLY ISM", "a complete change of form, like a caterpillar becoming a butterfly"),
  build("L.8.4", "PHIL ANTHROP IST", "PHILANTHROPIST", "THEO ISM", "a person who gives to help others out of love for people"),
  build("L.8.4", "VER IFY", "VERIFY", "FID ITY", "to check that something is true"),
  build("L.8.4", "PAN DEMIC", "PANDEMIC", "EPI EN", "a disease that spreads among people all over the world"),
  build("L.8.4", "THEO LOGY", "THEOLOGY", "PHIL NYM", "the study of God or religion"),
  build("L.8.4", "IN FIN ITE", "INFINITE", "DE FID", "without an end"),
  spell("L.8.2", SPELL8, "AR GU MENT", "ARGUMENT", "GUE MANT", { clue: "a reason or set of reasons given for a point of view", tip: "Drop the E of ARGUE before MENT." }),
  spell("L.8.2", SPELL8, "OC CUR RED", "OCCURRED", "O ED", { clue: "happened; took place", tip: "Two C's, and double the R before ED." }),
  spell("L.8.2", SPELL8, "EM BARR ASS", "EMBARRASS", "BAR AS", { clue: "to make someone feel awkward or ashamed", tip: "Double R and double S." }),
  spell("L.8.2", SPELL8, "CON SCI OUS", "CONSCIOUS", "SH SHUS", { clue: "awake and aware of what is around you", tip: "The /sh/ sound is spelled SCI." }),
  spell("L.8.2", SPELL8, "MIS CHIE VOUS", "MISCHIEVOUS", "CHEE VIOUS", { clue: "playfully causing trouble", tip: "It ends in VOUS, not VIOUS." }),
  spell("L.8.2", SPELL8, "REC OMM END", "RECOMMEND", "RECC OM", { clue: "to suggest something as good or worth trying", tip: "One C, two M's." }),
]);
