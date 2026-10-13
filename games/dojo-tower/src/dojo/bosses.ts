import type { Subject } from "../kit/types";
import { FLOOR_THEMES, type FloorTheme, type Topic } from "./floors";
import type { FocusChoice, FocusTopicId } from "./focus";

/*
 * Dojo Tower's floor masters. Every subject has a roster of ten (nine masters and a grand master for
 * floor 10), and MIXED has its own ten that cycle through the subjects, so one run never meets the
 * same master twice and every master matches what the run is asking. All names, lines and looks are
 * original; the lines are kid-friendly puns (nobody gets hurt: hits are "combo hits", masters bow out).
 *
 * Looks: the five original masters keep their hand-made sprites (`sprite`); the others are drawn by
 * render.ts from a body, a head, a hat, a prop, a palette and a size.
 */

export type BossSubject = Subject | "mixed";
export type LegacySprite = "wordwhirl" | "abacus" | "gavel" | "momentum" | "inkmaster";
export type BossBody = "robe" | "gi" | "coat" | "armor" | "beast";
export type BossHead = "human" | "ox" | "fox" | "owl" | "panda" | "bear" | "goblin";
export type BossHat =
  | "none" | "bun" | "wig" | "crown" | "wizard" | "tophat" | "helmet" | "beret" | "mortarboard" | "headband"
  | "hood" | "leafcrown" | "tricorn" | "goggles" | "cap" | "flame" | "bowler" | "dome" | "spiky" | "topknot"
  | "beard" | "mask";
export type BossProp =
  | "quill" | "abacus" | "gavel" | "pendulum" | "brush" | "tally" | "pie" | "protractor" | "timessign" | "scales"
  | "bamboo" | "slate" | "staff" | "fan" | "magnifier" | "volcano" | "cloud" | "magnet" | "leaf" | "telescope"
  | "flask" | "bone" | "atom" | "pencil" | "book" | "comma" | "scroll" | "drum" | "map" | "ruler" | "coin"
  | "compass" | "apple" | "hourglass" | "ballot" | "globe";

export interface BossLook {
  /** One of the five original hand-drawn masters (drawn as before). */
  sprite?: LegacySprite;
  body: BossBody;
  head: BossHead;
  hat: BossHat;
  prop: BossProp;
  /** Main outfit colour, its shade, and the trim (belt, hat band, piping). */
  robe: string;
  robe2: string;
  trim: string;
  skin: string;
  hair: string;
  /** Pixel scale (1.5 = the original masters' size). */
  size: number;
}

export interface Boss {
  id: string;
  name: string;
  subject: BossSubject;
  /** The floor's name while this master holds it, e.g. "FRACTION DEN". */
  hall: string;
  /** Topics this master is best at (topic runs meet these first). Empty: any. */
  topics: FocusTopicId[];
  look: BossLook;
  /** Said when the master arrives. */
  intro: string;
  /** Said when the master blocks a wrong answer (cycled). */
  block: string[];
  /** Said after a right answer lands a hit (cycled). */
  hit: string[];
  /** Said when the master is beaten. */
  defeat: string[];
}

const SKIN = "#f1c27d";
const SKIN2 = "#c68c53";
const SKIN3 = "#8d5a3a";

type L = Partial<BossLook> & Pick<BossLook, "body" | "head" | "hat" | "prop" | "robe" | "robe2" | "trim">;
const look = (l: L): BossLook => ({ skin: SKIN, hair: "#2a1a10", size: 1.5, ...l });

function boss(
  id: string, name: string, subject: BossSubject, hall: string, topics: FocusTopicId[], lk: BossLook,
  intro: string, block: string[], hit: string[], defeat: string[],
): Boss {
  return { id, name, subject, hall, topics, look: lk, intro, block, hit, defeat };
}

// ------------------------------------------------------------------ the original five

const WORDWHIRL = boss("wordwhirl", "MADAME WORDWHIRL", "ela", "WORD DOJO", ["reading", "grammar"],
  look({ sprite: "wordwhirl", body: "robe", head: "human", hat: "bun", prop: "quill", robe: "#7b3fc4", robe2: "#5e2d99", trim: "#ffd23f", hair: "#3b2a1a" }),
  "My quill is mightier than your kick!",
  ["Swish! Read it once more, student.", "Ink-correct! Check your words."],
  ["Ow! That was well-phrased!", "A plot twist! I didn't see that coming."],
  ["Well written! You may climb.", "The end... of MY chapter!"]);

const ABACUS = boss("abacus", "ABACUS OX", "math", "NUMBER DOJO", ["numbers"],
  look({ sprite: "abacus", body: "gi", head: "ox", hat: "none", prop: "abacus", robe: "#ff9a3c", robe2: "#d9772a", trim: "#05060f", skin: "#8a5a2b" }),
  "Count your moves, little one!",
  ["Clack-clack! The beads say no.", "Recount! That doesn't add up."],
  ["Oof! You're on the right track!", "Moo-ve over, that one counted!"],
  ["Your math adds up. Go on!", "I'm out-numbered! Climb on!"]);

const GAVEL = boss("gavel", "JUDGE GAVEL-FIST", "social", "CIVICS DOJO", ["civics"],
  look({ sprite: "gavel", body: "robe", head: "human", hat: "wig", prop: "gavel", robe: "#1b1b2a", robe2: "#1b1b2a", trim: "#f2f4ff", skin: SKIN2, hair: "#e8e8f0" }),
  "Order in the dojo! Know your government!",
  ["Objection sustained! Study the law.", "Overruled! Check the rules again."],
  ["Ouch! The court is impressed!", "A fair point! Point to you."],
  ["Case closed. You may pass!", "The jury agrees: you win!"]);

const MOMENTUM = boss("momentum", "DOCTOR MOMENTUM", "science", "MOTION DOJO", ["physical"],
  look({ sprite: "momentum", body: "coat", head: "human", hat: "goggles", prop: "pendulum", robe: "#f2f4ff", robe2: "#b8c0e0", trim: "#6ea0ff", hair: "#c0c8d8" }),
  "An object at rest... is about to lose!",
  ["Equal and opposite! Blocked!", "Friction stops that answer!"],
  ["Whoa! That hit had force!", "My momentum... is slipping!"],
  ["Your science has force!", "I'm at rest now. Climb on!"]);

const INKMASTER = boss("inkmaster", "THE GRAND INKMASTER", "mixed", "INK MOON TERRACE", [],
  look({ sprite: "inkmaster", body: "armor", head: "human", hat: "mask", prop: "brush", robe: "#2a2350", robe2: "#17122e", trim: "#e3262f" }),
  "My Ink Ninjas fell? Then face ME!",
  ["Splat! My ink shield holds!", "Smudged it! Try again."],
  ["Gah! You blotted my robe!", "Ink-credible hit!"],
  ["Half the tower is yours! Climb higher!", "Out of ink... go on, student!"]);

// ------------------------------------------------------------------ MATH

const TALLYHO = boss("tallyho", "COUNT TALLYHO", "math", "TALLY HALL", ["numbers"],
  look({ body: "coat", head: "human", hat: "tophat", prop: "tally", robe: "#4a2a7a", robe2: "#2a1850", trim: "#ffd23f", skin: "#f6dcc0", size: 1.55 }),
  "One, two, three... I count YOU out!",
  ["Tally-NO! Count again.", "Ah ah ah! Miscounted!"],
  ["Ouch! That's one point for you!", "Another tally mark... for you!"],
  ["I've lost count! You win!", "Tallyho! Off you climb!"]);

const FRACTION_FOX = boss("fractionfox", "THE FRACTION FOX", "math", "FRACTION DEN", ["fractions"],
  look({ body: "gi", head: "fox", hat: "headband", prop: "pie", robe: "#2a8a5a", robe2: "#1c6040", trim: "#ffd23f", hair: "#ff7a2a", size: 1.4 }),
  "I'll take my half of this fight... and yours!",
  ["Not a whole answer! Blocked!", "Split decision: no!"],
  ["Yip! You sliced right through!", "That hit was a full one!"],
  ["You beat me fair and square... and whole!", "I'm in pieces! Go on up."]);

const PROTRACTOR = boss("protractor", "PROFESSOR PROTRACTOR", "math", "ANGLE HALL", ["geometry"],
  look({ body: "coat", head: "human", hat: "mortarboard", prop: "protractor", robe: "#2a5a8a", robe2: "#1a3e62", trim: "#9ae8ff", skin: SKIN2, size: 1.5 }),
  "Let's see your angle on THIS!",
  ["Wrong angle! Blocked at 90 degrees!", "Obtuse! Try a sharper answer."],
  ["Acute hit! Ouch!", "Right on! A right angle!"],
  ["You've got all the angles. Pass!", "I'm totally out of shape!"]);

const MULTIPLY = boss("multiply", "MADAM MULTIPLY", "math", "TIMES TABLE TEMPLE", ["numbers", "factors"],
  look({ body: "robe", head: "human", hat: "beret", prop: "timessign", robe: "#c42a6a", robe2: "#8a1a4a", trim: "#ffd23f", hair: "#1b1b2a", skin: SKIN3, size: 1.5 }),
  "I'll multiply my moves by ten!",
  ["Times up for that answer! Blocked!", "That doesn't multiply! Again!"],
  ["Double trouble! Nice hit!", "Times two! That stings!"],
  ["You've multiplied my defeat! Go!", "Your skills are off the times table!"]);

const RATIO = boss("ratio", "RANGER RATIO", "math", "RATE RANGE", ["ratios"],
  look({ body: "coat", head: "human", hat: "cap", prop: "scales", robe: "#5a6a2a", robe2: "#3e4a1c", trim: "#ffb03a", hair: "#7a4a22", size: 1.45 }),
  "For every kick you throw, I throw two!",
  ["Out of proportion! Blocked!", "Check your rate, rookie!"],
  ["Ouch! A perfect ratio!", "That hit was right on rate!"],
  ["Your ratio of wins is perfect!", "I'm out-paced! Climb on."]);

const PRIME_PANDA = boss("primepanda", "THE PRIME PANDA", "math", "PRIME GROVE", ["factors"],
  look({ body: "beast", head: "panda", hat: "none", prop: "bamboo", robe: "#f2f4ff", robe2: "#1b1b2a", trim: "#5fff8a", size: 1.6 }),
  "I can only be divided by me... and ONE!",
  ["Not a factor! Blocked!", "Bamboo-zled! Try again."],
  ["Oof! That was prime!", "You found my factor! Ouch!"],
  ["You're in your prime! Pass!", "Panda-monium! You win!"]);

const ALGEBRA_OWL = boss("algebraowl", "THE ALGEBRA OWL", "math", "VARIABLE NEST", ["algebra"],
  look({ body: "robe", head: "owl", hat: "none", prop: "slate", robe: "#4a3a8a", robe2: "#2e2460", trim: "#6ea0ff", hair: "#8a6a4a", size: 1.45 }),
  "Whooo can solve for X? Not you!",
  ["Whooo-ps! X marks the wrong spot.", "Balance both sides! Blocked!"],
  ["Hoo! You solved that one!", "You isolated my weak spot!"],
  ["X equals... YOU WIN!", "Whooo knew? You did! Fly on."]);

const DECIMAL = boss("decimal", "BARON DECIMAL", "math", "POINT PAVILION", ["fractions"],
  look({ body: "armor", head: "human", hat: "bowler", prop: "staff", robe: "#1f6a6a", robe2: "#124848", trim: "#e3e8f0", skin: "#f6dcc0", hair: "#c8a050", size: 1.55 }),
  "Point taken... and your point is MINE!",
  ["Wrong place value! Blocked!", "Off by a decimal point!"],
  ["Ouch! Right to the point!", "A whole hit, not a tenth!"],
  ["You out-pointed me! Pass!", "My decimal moved... you win!"]);

const INFINITY = boss("infinity", "EMPRESS INFINITY", "math", "INFINITY PEAK", [],
  look({ body: "robe", head: "human", hat: "crown", prop: "fan", robe: "#e8b020", robe2: "#b08010", trim: "#7b3fc4", skin: SKIN2, hair: "#1b1b2a", size: 1.75 }),
  "My numbers never end! Can you?",
  ["Infinitely wrong! Blocked!", "Count again... forever!"],
  ["What?! A finite hit!", "That one added up! Ouch!"],
  ["Your math is beyond measure! You win!", "Infinity bows to you, Master!"]);

// ------------------------------------------------------------------ SCIENCE

const PETRI = boss("petri", "PROFESSOR PETRI", "science", "PETRI LAB", ["life"],
  look({ body: "coat", head: "human", hat: "bun", prop: "magnifier", robe: "#3a9a6a", robe2: "#267050", trim: "#f2f4ff", skin: SKIN3, hair: "#1b1b2a", size: 1.45 }),
  "My microbes are ready to rumble!",
  ["Under the microscope: wrong!", "Germ of an idea... but no!"],
  ["Eek! You cultured that one!", "Cell-ebrate! Nice hit!"],
  ["You've got the right cells! Pass!", "My dish is done. Climb on!"]);

const MAGMA = boss("magma", "CAPTAIN MAGMA", "science", "VOLCANO VAULT", ["earth"],
  look({ body: "armor", head: "human", hat: "flame", prop: "volcano", robe: "#a02a10", robe2: "#6a1a08", trim: "#ffb03a", skin: SKIN2, size: 1.65 }),
  "Feel the heat! I'm about to erupt!",
  ["Cooled off! Blocked!", "Rocky answer! Try again."],
  ["Ouch! That was a hot hit!", "You made me erupt!"],
  ["I'm cooling down... you win!", "Lava-ly fight! Go on up."]);

const WEATHER = boss("weather", "THE WEATHER WITCH", "science", "STORM STUDIO", ["earth"],
  look({ body: "robe", head: "human", hat: "wizard", prop: "cloud", robe: "#2a4a9a", robe2: "#1a3070", trim: "#ffd23f", hair: "#c0c8d8", size: 1.5 }),
  "Forecast: a hundred percent chance of ME!",
  ["Cloudy answer! Blocked!", "Brrr! A cold front of wrong!"],
  ["Thunder! Nice hit!", "You blew me away!"],
  ["Sunny skies ahead for you!", "The storm is over. Climb on!"]);

const MAGNET = boss("magnet", "MAJOR MAGNET", "science", "MAGNET MILL", ["physical"],
  look({ body: "armor", head: "human", hat: "cap", prop: "magnet", robe: "#4a4a6a", robe2: "#2e2e48", trim: "#e3262f", skin: SKIN, size: 1.6 }),
  "I'm attracted to winning!",
  ["Repelled! Blocked!", "Bounced off my force field!"],
  ["Ouch! That was a positive hit!", "You pulled that one off!"],
  ["I'm de-magnetized! Pass!", "You're drawn to victory! Go!"]);

const GREENLEAF = boss("greenleaf", "GRANNY GREENLEAF", "science", "GREENHOUSE", ["life"],
  look({ body: "robe", head: "human", hat: "leafcrown", prop: "leaf", robe: "#3a7a2a", robe2: "#265418", trim: "#ff8ad8", hair: "#e8e8f0", size: 1.4 }),
  "Time to get to the root of it!",
  ["Wilted! Blocked!", "Needs more sunlight, sprout!"],
  ["Oh my petals! Nice hit!", "You're growing stronger!"],
  ["You've blossomed! Climb on!", "Leaf it to you. You win!"]);

const COMET = boss("comet", "COMMANDER COMET", "science", "STAR DECK", ["earth"],
  look({ body: "armor", head: "human", hat: "dome", prop: "telescope", robe: "#1a2a5a", robe2: "#0e1a3e", trim: "#c0c8d8", skin: SKIN2, size: 1.5 }),
  "Prepare for a close encounter!",
  ["Out of orbit! Blocked!", "A space-tacular miss!"],
  ["Ouch! Stellar hit!", "You're out of this world!"],
  ["You're a superstar! Blast off!", "Mission complete. Climb on!"]);

const BUBBLES = boss("bubbles", "BARON BUBBLES", "science", "FIZZ LAB", ["physical"],
  look({ body: "coat", head: "human", hat: "tophat", prop: "flask", robe: "#7a3ac4", robe2: "#52268a", trim: "#9aff9a", skin: "#f6dcc0", size: 1.5 }),
  "My potions are bubbling with power!",
  ["Fizzle! Blocked!", "That answer evaporated!"],
  ["Pop! Nice hit!", "What a reaction!"],
  ["You're the real chemistry champ!", "All my bubbles popped. Pass!"]);

const DINA_BONES = boss("dinabones", "DOCTOR DINA BONES", "science", "FOSSIL HALL", ["life", "earth"],
  look({ body: "coat", head: "human", hat: "bun", prop: "bone", robe: "#b08a4a", robe2: "#806232", trim: "#5a3a22", skin: SKIN3, hair: "#1b1b2a", size: 1.4 }),
  "I dig science... and I'll dig you out!",
  ["That answer is extinct! Blocked!", "Dig deeper, explorer!"],
  ["Ouch! Dino-mite hit!", "You found a rare one!"],
  ["You rock, like a fossil! Go on.", "A bone-afide win! Climb on!"]);

const QUARK = boss("quark", "PROFESSOR QUARK", "science", "ATOM OBSERVATORY", [],
  look({ body: "robe", head: "human", hat: "spiky", prop: "atom", robe: "#1a1a3a", robe2: "#0e0e24", trim: "#5ff0ff", hair: "#f2f4ff", size: 1.75 }),
  "Every atom in me is ready to fight!",
  ["Not even close, particle!", "Hypothesis rejected! Blocked!"],
  ["Whoa! That hit was elemental!", "You split my atom!"],
  ["Your science is super-charged! You win!", "Experiment complete: you're the Master!"]);

// ------------------------------------------------------------------ ELA

const SPELLSALOT = boss("spellsalot", "SIR SPELLSALOT", "ela", "SPELLING CASTLE", ["phonics"],
  look({ body: "armor", head: "human", hat: "helmet", prop: "pencil", robe: "#a8b0c8", robe2: "#7a8298", trim: "#2456e8", size: 1.6 }),
  "Spell it out, squire: S-U-R-R-E-N-D-E-R!",
  ["Mis-spelled! Blocked!", "Check your letters, squire!"],
  ["Ow! Spelled perfectly!", "A-C-E! Ace hit!"],
  ["You've spelled my defeat! Pass!", "Well spelled, noble student!"]);

const GOBLIN = boss("goblin", "THE GRAMMAR GOBLIN", "ela", "GRAMMAR GROTTO", ["grammar"],
  look({ body: "gi", head: "goblin", hat: "none", prop: "book", robe: "#6a3a2a", robe2: "#4a2a1a", trim: "#ffd23f", skin: "#7acc5a", size: 1.3 }),
  "Your sentences is wrong! Hee hee!",
  ["Run-on answer! Blocked!", "Hee hee! Try that again!"],
  ["Ouch! Proper punctuation!", "Yikes! That hit was correct!"],
  ["Fine. You is... ARE the winner!", "Period. End of my sentence."]);

const COMMA = boss("comma", "CAPTAIN COMMA", "ela", "PAUSE PORT", ["grammar"],
  look({ body: "coat", head: "human", hat: "tricorn", prop: "comma", robe: "#1f3a7a", robe2: "#142858", trim: "#ffd23f", skin: SKIN2, hair: "#3b2a1a", size: 1.55 }),
  "Let's pause... and FIGHT!",
  ["Missing comma, matey! Blocked!", "Avast! Wrong punctuation!"],
  ["Arr! A well-placed hit!", "Shiver my sentences!"],
  ["You punctuated my defeat! Sail on!", "Full stop. You win, matey!"]);

const RHYMESWORTH = boss("rhymesworth", "LADY RHYMESWORTH", "ela", "RHYME GARDEN", ["phonics", "reading"],
  look({ body: "robe", head: "human", hat: "leafcrown", prop: "fan", robe: "#e05aa0", robe2: "#a83a74", trim: "#f2f4ff", hair: "#ffd23f", size: 1.45 }),
  "Don't make me laugh... or rhyme!",
  ["Wrong, my song! Blocked along!", "That answer won't rhyme this time!"],
  ["Oh dear! A hit, I fear!", "A smack! Right on track!"],
  ["You win with a grin! Climb on in!", "My rhymes are done. You've won!"]);

const PLOT_TWISTER = boss("plottwister", "THE PLOT TWISTER", "ela", "STORY STAGE", ["reading"],
  look({ body: "coat", head: "human", hat: "mask", prop: "scroll", robe: "#2a1a3a", robe2: "#1a0e26", trim: "#e3262f", skin: "#f6dcc0", hair: "#1b1b2a", size: 1.55 }),
  "Plot twist: you lose!",
  ["Twist! That's not what happened!", "Re-read the story, reader!"],
  ["Ouch! Didn't see THAT coming!", "A dramatic hit!"],
  ["The hero wins! What a twist!", "And they climbed on... the end!"]);

const VOCABULON = boss("vocabulon", "BARON VOCABULON", "ela", "WORD VAULT", ["grammar"],
  look({ body: "robe", head: "human", hat: "bowler", prop: "magnifier", robe: "#7a1a2a", robe2: "#52101a", trim: "#ffd23f", skin: SKIN, hair: "#8a8a9a", size: 1.6 }),
  "Prepare to be... flabbergasted!",
  ["Incorrect! Most egregious!", "Preposterous! Blocked!"],
  ["Astonishing! A splendid hit!", "Gadzooks! Magnificent!"],
  ["Your vocabulary is victorious!", "I'm speechless... you may pass."]);

const PARAGRAPH = boss("paragraph", "PROFESSOR PARAGRAPH", "ela", "ESSAY ACADEMY", ["reading", "grammar"],
  look({ body: "coat", head: "human", hat: "beard", prop: "ruler", robe: "#7a5a3a", robe2: "#563e26", trim: "#5fff8a", skin: SKIN3, hair: "#e8e8f0", size: 1.5 }),
  "Indent yourself for a lesson!",
  ["Topic sentence: WRONG!", "Needs more details! Blocked!"],
  ["Ouch! Strong main idea!", "Excellent supporting hit!"],
  ["A-plus! You may climb!", "In conclusion... you win!"]);

const SYLLABLE = boss("syllable", "SUMO SYLLABLE", "ela", "SOUND-IT-OUT RING", ["phonics"],
  look({ body: "beast", head: "human", hat: "topknot", prop: "drum", robe: "#f1c27d", robe2: "#e3262f", trim: "#2456e8", skin: SKIN, hair: "#1b1b2a", size: 1.7 }),
  "Clap the beats: YOU. WILL. LOSE!",
  ["Wrong beat! Blocked!", "Sound it out, little one!"],
  ["Oof! Syl-la-ble SMASH!", "Ba-dum! Nice hit!"],
  ["You've got the beat! Climb on!", "I'm all sounded out. You win!"]);

const LEXICON = boss("lexicon", "THE GRAND LEXICON", "ela", "LIBRARY SUMMIT", [],
  look({ body: "robe", head: "human", hat: "wizard", prop: "staff", robe: "#1a2a6a", robe2: "#101a48", trim: "#ffd23f", skin: SKIN2, hair: "#f2f4ff", size: 1.75 }),
  "Every word ever written is on MY side!",
  ["Unreadable! Blocked!", "Look it up again, scholar!"],
  ["Remarkable! Simply remarkable!", "Ouch! That was a bestseller!"],
  ["You've written your own legend! You win!", "The library is yours, Master!"]);

// ------------------------------------------------------------------ SOCIAL STUDIES

const MAP_MONK = boss("mapmonk", "THE MAP MONK", "social", "MAP MONASTERY", ["geography"],
  look({ body: "robe", head: "human", hat: "hood", prop: "map", robe: "#c8701a", robe2: "#8a4a10", trim: "#ffd23f", skin: SKIN2, size: 1.5 }),
  "Find your way... if you can!",
  ["Wrong way! Blocked!", "Check your map, traveler."],
  ["Ouch! You found my spot!", "X marks the hit!"],
  ["You know your way! Pass, traveler.", "Mapped and beaten. Climb on!"]);

const TIMELINE = boss("timeline", "PROFESSOR TIMELINE", "social", "HISTORY HALL", ["history"],
  look({ body: "coat", head: "human", hat: "beret", prop: "ruler", robe: "#5a3a1a", robe2: "#3e2810", trim: "#9ae8ff", skin: SKIN, hair: "#8a8a9a", size: 1.45 }),
  "History says... you're going down!",
  ["That's not how it happened!", "Wrong era! Blocked!"],
  ["A hit for the history books!", "A historic hit!"],
  ["You've made history! Pass!", "My time is up. Climb on!"]);

const MARKET = boss("market", "MADAM MARKET", "social", "MARKET SQUARE", ["economics"],
  look({ body: "robe", head: "human", hat: "bun", prop: "coin", robe: "#2a8a7a", robe2: "#1a6054", trim: "#ffd23f", skin: SKIN3, hair: "#3b2a1a", size: 1.5 }),
  "Let's make a deal: I win, you lose!",
  ["No sale! Blocked!", "That answer is out of stock!"],
  ["Ouch! You drove a hard bargain!", "Worth every penny! Nice hit!"],
  ["Sold! You win!", "My shop is closed. Climb on!"]);

const COMPASS = boss("compass", "CAPTAIN COMPASS", "social", "COMPASS COVE", ["geography"],
  look({ body: "coat", head: "human", hat: "cap", prop: "compass", robe: "#9a1a2a", robe2: "#6a101c", trim: "#ffd23f", skin: SKIN, hair: "#7a4a22", size: 1.55 }),
  "North, south, east, west... you're lost!",
  ["Off course! Blocked!", "Wrong direction, sailor!"],
  ["Ouch! Right on course!", "You navigated that one!"],
  ["You found true north! Pass!", "Full speed ahead to the next floor!"]);

const SENATOR = boss("senator", "SENATOR SCROLL", "social", "SENATE STEPS", ["civics"],
  look({ body: "robe", head: "human", hat: "leafcrown", prop: "scroll", robe: "#e8e8f0", robe2: "#b8c0e0", trim: "#7b3fc4", skin: SKIN2, hair: "#3b2a1a", size: 1.55 }),
  "I propose... your defeat!",
  ["Motion denied! Blocked!", "Vetoed! Try again."],
  ["Ouch! The motion passes!", "A vote for you! Nice hit!"],
  ["All in favor of YOU! Pass!", "The senate agrees: you win!"]);

const BARTER_BEAR = boss("barterbear", "BARTER BEAR", "social", "TRADING POST", ["economics"],
  look({ body: "beast", head: "bear", hat: "cap", prop: "apple", robe: "#7a4a22", robe2: "#c89a6a", trim: "#2456e8", size: 1.65 }),
  "I'll trade you one defeat... for free!",
  ["No trade! Blocked!", "That's not a fair swap!"],
  ["Ouch! A fair trade!", "You out-bargained me!"],
  ["Deal! You win!", "I'll trade this floor for a nap. Go on!"]);

const CHRONICLE = boss("chronicle", "GRANDPA CHRONICLE", "social", "ARCHIVE ATTIC", ["history"],
  look({ body: "robe", head: "human", hat: "beard", prop: "hourglass", robe: "#6a6a7a", robe2: "#4a4a58", trim: "#ffb03a", skin: SKIN, hair: "#f2f4ff", size: 1.45 }),
  "Back in my day, students lost to ME!",
  ["Hmph! Not how I remember it!", "Wrong year, youngster!"],
  ["Oh my! That takes me back!", "A legendary hit!"],
  ["You'll go down in history! Pass!", "Time for my nap. You win!"]);

const BALLOT = boss("ballot", "MAYOR BALLOT", "social", "TOWN HALL", ["civics"],
  look({ body: "coat", head: "human", hat: "bowler", prop: "ballot", robe: "#2456e8", robe2: "#163a9a", trim: "#e3262f", skin: SKIN3, size: 1.5 }),
  "Vote for me... to win this fight!",
  ["Recount! Blocked!", "That answer didn't get my vote!"],
  ["Ouch! The people have spoken!", "A landslide hit!"],
  ["You win by a landslide!", "I concede! Climb on!"]);

const GLOBE = boss("globe", "CHANCELLOR GLOBE", "social", "WORLD COUNCIL", [],
  look({ body: "coat", head: "human", hat: "crown", prop: "globe", robe: "#1a5a3a", robe2: "#0e3e26", trim: "#ffd23f", skin: SKIN2, hair: "#3b2a1a", size: 1.75 }),
  "The whole world is watching... me win!",
  ["Not on my map! Blocked!", "The council says no!"],
  ["Ouch! A world-class hit!", "You've got global power!"],
  ["The world is yours, Master!", "You are a true citizen champion!"]);

// ------------------------------------------------------------------ MIXED final

const SKYBRUSH = boss("skybrush", "GRANDMASTER SKYBRUSH", "mixed", "SKY DOJO", [],
  look({ body: "robe", head: "human", hat: "topknot", prop: "brush", robe: "#e8f2ff", robe2: "#a8c8f0", trim: "#ffd23f", skin: SKIN, hair: "#f2f4ff", size: 1.8 }),
  "You climbed to the clouds? Show me ALL you know!",
  ["A gust of wind! Blocked!", "Not quite! The clouds hid that one."],
  ["Thunder and lightning! Nice hit!", "Ho ho! Your brain is sky-high!"],
  ["You are the Master of the Tower!", "The sky bows to you. Well done!"]);

// ------------------------------------------------------------------ rosters

/** Ten masters per subject; the last one is the grand master of floor 10. */
export const ROSTERS: Record<Subject, Boss[]> = {
  math: [ABACUS, TALLYHO, FRACTION_FOX, PROTRACTOR, MULTIPLY, RATIO, PRIME_PANDA, ALGEBRA_OWL, DECIMAL, INFINITY],
  science: [MOMENTUM, PETRI, MAGMA, WEATHER, MAGNET, GREENLEAF, COMET, BUBBLES, DINA_BONES, QUARK],
  ela: [WORDWHIRL, SPELLSALOT, GOBLIN, COMMA, RHYMESWORTH, PLOT_TWISTER, VOCABULON, PARAGRAPH, SYLLABLE, LEXICON],
  social: [GAVEL, MAP_MONK, TIMELINE, MARKET, COMPASS, SENATOR, BARTER_BEAR, CHRONICLE, BALLOT, GLOBE],
};

/** MIXED: the classic five, then ELA, math, civics, forces and the grand mixed final. */
export const MIXED_ROSTER: Boss[] = [WORDWHIRL, ABACUS, GAVEL, MOMENTUM, INKMASTER, SPELLSALOT, PROTRACTOR, SENATOR, MAGNET, SKYBRUSH];

/** Every master in the game (each once). */
export const ALL_BOSSES: Boss[] = [...new Set([...MIXED_ROSTER, ...Object.values(ROSTERS).flat()])];

const TOPIC_SUBJECT: Record<Topic, Subject | null> = { ela: "ela", math: "math", civics: "social", forces: "science", mixed: null };

/** The subject a floor's questions come from (null: the MIXED roof floors rotate subjects). */
export function topicSubject(t: Topic): Subject | null {
  return TOPIC_SUBJECT[t];
}

export interface FloorPlan {
  n: number;
  theme: FloorTheme;
  /** Which question source the floor uses in MIXED (single-subject runs ignore it). */
  topic: Topic;
  boss: Boss;
  /** The floor's name, e.g. "NUMBER DOJO" (it follows the master). */
  hall: string;
}

/**
 * The ten floors for a choice: MIXED gets the MIXED roster; one subject gets that subject's roster;
 * one topic gets the subject's roster with the masters who know that topic first (the grand master
 * always guards floor 10).
 */
export function towerPlan(choice: FocusChoice): FloorPlan[] {
  let roster: Boss[];
  if (choice.subject === "mixed") roster = MIXED_ROSTER;
  else {
    const all = ROSTERS[choice.subject];
    const body = all.slice(0, -1);
    if (choice.topic !== "all") {
      const t = choice.topic;
      const fit = body.filter((b) => b.topics.includes(t));
      roster = [...fit, ...body.filter((b) => !fit.includes(b)), all[all.length - 1]];
    } else roster = all;
  }
  return FLOOR_THEMES.map((theme, i) => ({ n: theme.n, theme, topic: theme.mixedTopic, boss: roster[i], hall: roster[i].hall }));
}

/** A line from a list, cycled by a counter. */
export function lineOf(lines: string[], i: number): string {
  return lines[((i % lines.length) + lines.length) % lines.length];
}
