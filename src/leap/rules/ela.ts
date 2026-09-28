import { catRules, listRule, type Rule, type RuleItem } from "./types";

/*
 * ELA rules, K-12, tagged with NC Standard Course of Study for ELA codes in the kit's style
 * (NC numbers RF.K.3 as phonological awareness and RF.K.4 / RF.1.4 as phonics; grades 9-10 and
 * 11-12 use band codes). Word lists are chosen so each word has one clear answer.
 */

/* ------------------------------------------------------------------ K */

/** Rhyme families: the rule word, its spelling pattern, and rhyming words (all spelled with it). */
export const RHYMES: { word: string; rime: string; words: string[] }[] = [
  { word: "CAT", rime: "AT", words: ["HAT", "BAT", "MAT", "RAT", "SAT", "FAT", "PAT", "FLAT", "THAT", "CHAT"] },
  { word: "DOG", rime: "OG", words: ["LOG", "FOG", "FROG", "HOG", "JOG", "BOG", "CLOG", "SMOG"] },
  { word: "SUN", rime: "UN", words: ["RUN", "FUN", "BUN", "SPUN", "STUN", "NUN", "PUN", "BEGUN"] },
  { word: "TOP", rime: "OP", words: ["HOP", "MOP", "POP", "SHOP", "STOP", "DROP", "CHOP", "FLOP", "CROP"] },
];
/** Words that rhyme with none of the families above (checked by the test). */
export const NON_RHYMES = ["CUP", "PIG", "BED", "HOT", "CAR", "BUS", "FISH", "MILK", "TREE", "CAKE", "BALL", "BOOK", "HEN", "MAP", "CAN", "NUT", "LEG", "BOX"];

const kRhymes: Rule[] = RHYMES.map((f) => {
  const others = RHYMES.filter((o) => o !== f).flatMap((o) => o.words.slice(0, 3));
  return listRule({
    id: `k-rhyme-${f.rime.toLowerCase()}`, family: "k-rhyme", subject: "ela", grade: "K", standard: "RF.K.3", skill: "Rhyming words",
    text: `HOP ON WORDS THAT RHYME WITH ${f.word}`,
    say: `Hop only on words that rhyme with ${f.word.toLowerCase()}.`,
    hint: `Rhymes end with the same sound: ${f.word.toLowerCase()}, ${f.words[0].toLowerCase()}.`,
    matches: f.words.map((w) => ({ label: w, why: `${w} and ${f.word} both end in -${f.rime}.` })),
    misses: [...NON_RHYMES, ...others].map((w) => ({ label: w, why: `${w} does not rhyme with ${f.word}.` })),
  });
});

export const STARTS: Record<string, string[]> = {
  B: ["BALL", "BED", "BUG", "BOX", "BAT", "BUS", "BIKE", "BEAR", "BOOK", "BEE"],
  M: ["MOP", "MAP", "MILK", "MOON", "MOUSE", "MUD", "MITTEN", "MONKEY", "MAN", "MUG"],
  S: ["SUN", "SOCK", "SEAL", "SAND", "SIX", "SOAP", "SEVEN", "SALT", "SOUP", "SAD"],
  T: ["TOP", "TEN", "TUB", "TIGER", "TOY", "TENT", "TURTLE", "TAIL", "TOE", "TOOTH"],
};
const EXTRA_START = ["DOG", "CAT", "FISH", "PIG", "HAT", "LOG", "RUG", "NUT", "GOAT", "LEAF"];
const kStarts: Rule[] = Object.entries(STARTS).map(([letter, words]) => {
  const others = [...Object.entries(STARTS).filter(([l]) => l !== letter).flatMap(([, ws]) => ws.slice(0, 3)), ...EXTRA_START];
  return listRule({
    id: `k-start-${letter.toLowerCase()}`, family: "k-start", subject: "ela", grade: "K", standard: "RF.K.4", skill: "Beginning sounds",
    text: `HOP ON WORDS THAT START WITH ${letter}`,
    say: `Hop only on words that start with the ${letter} sound.`,
    hint: `Listen for the first sound: ${words[0].toLowerCase()}.`,
    matches: words.map((w) => ({ label: w, why: `${w} starts with ${letter}.` })),
    misses: others.map((w) => ({ label: w, why: `${w} starts with ${w[0]}, not ${letter}.` })),
  });
});

const kNounVerb = catRules({
  family: "k-nounverb", subject: "ela", grade: "K", standard: "L.K.1", skill: "Nouns and verbs",
  cats: {
    NOUN: { name: "a naming word (noun)", items: ["CAT", "HAT", "CAR", "APPLE", "GIRL", "BOY", "CHAIR", "PENCIL", "ZOO", "TEACHER", "BANANA", "TIGER"] },
    VERB: { name: "an action word (verb)", items: ["EAT", "SIT", "GO", "SING", "GIVE", "TAKE", "BRING", "WRITE", "SEE", "THINK", "SPEAK"] },
  },
  targets: [
    { key: "NOUN", text: "HOP ON NAMING WORDS", say: "Hop only on naming words. Nouns name a person, place or thing.", hint: "Nouns name a person, place or thing." },
    { key: "VERB", text: "HOP ON ACTION WORDS", say: "Hop only on action words. Verbs tell what you do.", hint: "Verbs are action words: things you do." },
  ],
});

/* ------------------------------------------------------------------ 1 */

export const SHORT_A = ["CAT", "HAT", "MAP", "BAG", "CAN", "FAN", "JAM", "NAP", "CLAP", "SAND"];
export const LONG_A = ["CAKE", "RAIN", "LAKE", "PLAY", "GATE", "TRAIN", "SNAIL", "DAY", "GAME", "TAPE"];
const g1Vowels = catRules({
  family: "g1-vowel-a", subject: "ela", grade: "1", standard: "RF.1.4", skill: "Short and long vowels",
  cats: {
    SHORT: { name: "a short a word", items: SHORT_A.map((w) => ({ label: w, why: `${w} has a short a, as in apple.` })) },
    LONG: { name: "a long a word", items: LONG_A.map((w) => ({ label: w, why: `${w} has a long a: the a says its name.` })) },
  },
  targets: [
    { key: "SHORT", text: "HOP ON SHORT A WORDS", say: "Hop only on words with a short a sound, like apple.", hint: "Short a says /a/ as in apple." },
    { key: "LONG", text: "HOP ON LONG A WORDS", say: "Hop only on words with a long a sound, like cake.", hint: "Long a says its name, as in cake." },
  ],
});

/** Singular → plural pairs (the test checks every pair is a real singular/plural). */
export const PLURALS: [string, string][] = [
  ["CAT", "CATS"], ["DOG", "DOGS"], ["BOX", "BOXES"], ["DISH", "DISHES"], ["TOY", "TOYS"], ["HAT", "HATS"],
  ["BUS", "BUSES"], ["FOX", "FOXES"], ["MOUSE", "MICE"], ["FOOT", "FEET"], ["CHILD", "CHILDREN"], ["GOOSE", "GEESE"], ["DRESS", "DRESSES"],
];
const g1Plurals: Rule[] = ["PLURAL", "SINGULAR"].map((t) => {
  const plural: RuleItem[] = PLURALS.map(([s, p]) => ({ label: p, why: `${p} means more than one ${s.toLowerCase()}.` }));
  const single: RuleItem[] = PLURALS.map(([s, p]) => ({
    label: s,
    why: s.endsWith("S") ? `${s} is just one, even though it ends in s. More than one is ${p}.` : `${s} is just one. More than one is ${p}.`,
  }));
  return listRule({
    id: `g1-${t.toLowerCase()}`, family: "g1-plurals", subject: "ela", grade: "1", standard: "L.1.1", skill: "Singular and plural nouns",
    text: t === "PLURAL" ? "HOP ON WORDS FOR MORE THAN ONE" : "HOP ON WORDS FOR JUST ONE",
    say: t === "PLURAL" ? "Hop only on plural nouns, words for more than one." : "Hop only on singular nouns, words for just one.",
    hint: t === "PLURAL" ? "Plural: more than one (cats, boxes, mice)." : "Singular: just one (cat, box, mouse).",
    matches: t === "PLURAL" ? plural : single,
    misses: t === "PLURAL" ? single : plural,
  });
});

const g1Proper = catRules({
  family: "g1-proper", subject: "ela", grade: "1", standard: "L.1.2", skill: "Capitalize names and dates",
  cats: {
    PROPER: { name: "a proper noun (a name)", items: ["MONDAY", "JULY", "TEXAS", "SAM", "MIA", "OHIO", "FRIDAY", "PARIS", "APRIL", "MR. LEE"] },
    COMMON: { name: "a common noun", items: ["DOG", "CITY", "GIRL", "DAY", "MONTH", "STATE", "BOY", "TOWN", "TEACHER", "SCHOOL"] },
  },
  targets: [{ key: "PROPER", text: "HOP ON NAMES THAT NEED CAPITALS", say: "Hop only on names that always start with a capital letter.", hint: "Names of people, places, days and months get capitals." }],
});

/* ------------------------------------------------------------------ 2 */

const g2Pos = catRules({
  family: "g2-pos", subject: "ela", grade: "2", standard: "L.2.1", skill: "Nouns, verbs, adjectives",
  cats: {
    NOUN: { name: "a noun", items: ["TEACHER", "PENCIL", "KITCHEN", "BICYCLE", "ELEPHANT", "PLANET", "BASKET", "WINDOW", "SISTER", "CASTLE", "RABBIT", "TOMATO"] },
    VERB: { name: "a verb", items: ["SWAM", "SANG", "WROTE", "RAN", "GAVE", "CAUGHT", "BROUGHT", "FLEW", "SLEPT", "ATE"] },
    ADJ: { name: "an adjective", items: ["HAPPY", "TINY", "FLUFFY", "HUGE", "NOISY", "SHINY", "TALL", "SLEEPY", "GENTLE", "FUNNY", "ANGRY"] },
  },
  targets: [
    { key: "NOUN", text: "HOP ON NOUNS", say: "Hop only on nouns.", hint: "A noun names a person, place or thing." },
    { key: "VERB", text: "HOP ON VERBS", say: "Hop only on verbs.", hint: "A verb is an action word." },
    { key: "ADJ", text: "HOP ON ADJECTIVES", say: "Hop only on adjectives.", hint: "An adjective describes a noun (what kind?)." },
  ],
});

export const COMPOUNDS: [string, string, string][] = [
  ["SUNSHINE", "SUN", "SHINE"], ["RAINBOW", "RAIN", "BOW"], ["BACKPACK", "BACK", "PACK"], ["CUPCAKE", "CUP", "CAKE"],
  ["FOOTBALL", "FOOT", "BALL"], ["BEDROOM", "BED", "ROOM"], ["TOOTHBRUSH", "TOOTH", "BRUSH"], ["SNOWMAN", "SNOW", "MAN"],
  ["GOLDFISH", "GOLD", "FISH"], ["DOGHOUSE", "DOG", "HOUSE"],
];
const g2Compound = listRule({
  id: "g2-compound", subject: "ela", grade: "2", standard: "L.2.4", skill: "Compound words",
  text: "HOP ON COMPOUND WORDS",
  say: "Hop only on compound words: two small words put together.",
  hint: "Compound word = two words joined: sun + shine.",
  matches: COMPOUNDS.map(([w, a, b]) => ({ label: w, why: `${w} = ${a} + ${b}.` })),
  misses: ["PENCIL", "CAMEL", "PUPPY", "HAPPY", "RABBIT", "BASKET", "TURTLE", "PICNIC", "DOCTOR", "SPIDER", "TIGER", "LEMON"].map((w) => ({
    label: w,
    why: `${w} can't be split into two words, so it isn't compound.`,
  })),
});

/* ------------------------------------------------------------------ 3 */

const g3Adverbs = catRules({
  family: "g3-adverbs", subject: "ela", grade: "3", standard: "L.3.1", skill: "Adverbs",
  cats: {
    ADV: { name: "an adverb", items: ["QUICKLY", "SLOWLY", "LOUDLY", "SOFTLY", "HAPPILY", "CAREFULLY", "GENTLY", "BRAVELY", "QUIETLY", "SOON", "OFTEN", "NEVER"] },
    ADJ: {
      name: "an adjective",
      items: [
        "HAPPY", "CAREFUL", "GENTLE", "NOISY", "SLEEPY", "BEAUTIFUL",
        { label: "FRIENDLY", why: "FRIENDLY ends in -ly but it is an adjective (a friendly dog)." },
        { label: "LOVELY", why: "LOVELY ends in -ly but it is an adjective (a lovely day)." },
        { label: "UGLY", why: "UGLY ends in -ly but it is an adjective (an ugly bug)." },
        { label: "SILLY", why: "SILLY ends in -ly but it is an adjective (a silly joke)." },
      ],
    },
  },
  targets: [{ key: "ADV", text: "HOP ON ADVERBS", say: "Hop only on adverbs.", hint: "Adverbs tell how, when or how often (quickly, soon)." }],
});

const g3Past = catRules({
  family: "g3-past", subject: "ela", grade: "3", standard: "L.3.1", skill: "Verb tenses",
  cats: {
    PAST: { name: "past tense", items: ["WENT", "SAW", "JUMPED", "ATE", "SLEPT", "TOOK", "THOUGHT", "FLEW", "SWAM", "BUILT", "WROTE"] },
    NOW: { name: "present or future tense", items: ["GO", "SEE", "EAT", "SLEEP", "TAKE", "THINK", "FLY", "WILL GO", "JUMPS", "WRITES", "BUILDS"] },
  },
  targets: [{ key: "PAST", text: "HOP ON PAST-TENSE VERBS", say: "Hop only on past tense verbs, things that already happened.", hint: "Past tense = already happened (jumped, went)." }],
});

const g3Prefix = listRule({
  id: "g3-prefix", subject: "ela", grade: "3", standard: "L.3.4", skill: "Prefixes",
  text: "HOP ON WORDS WITH A PREFIX",
  say: "Hop only on words that have a prefix, like un or re, added to a base word.",
  hint: "Prefix + base word: un+happy, re+do.",
  matches: [
    ["UNHAPPY", "un", "happy"], ["REDO", "re", "do"], ["UNLOCK", "un", "lock"], ["REWRITE", "re", "write"], ["UNFAIR", "un", "fair"],
    ["REPLAY", "re", "play"], ["UNTIE", "un", "tie"], ["REFILL", "re", "fill"], ["PREVIEW", "pre", "view"], ["DISLIKE", "dis", "like"],
  ].map(([w, p, b]) => ({ label: w, why: `${w} = ${p}- + ${b}.` })),
  misses: ["UNCLE", "UNDER", "READY", "REAL", "RED", "PRETTY", "DISH", "REACH", "PREY", "DISK"].map((w) => ({
    label: w,
    why: `${w} starts like a prefix, but the rest isn't a base word. No prefix!`,
  })),
});

/* ------------------------------------------------------------------ 4 */

const g4Pos = catRules({
  family: "g4-pos", subject: "ela", grade: "4", standard: "L.4.1", skill: "Parts of speech",
  cats: {
    ADJ: { name: "an adjective", items: ["ENORMOUS", "CURIOUS", "FRAGILE", "ANCIENT", "GRUMPY", "DELICIOUS", "NERVOUS", "GORGEOUS", "FEARLESS", "PECULIAR"] },
    NOUN: { name: "a noun", items: ["VOLCANO", "LIBRARY", "MUSEUM", "CANYON", "ISLAND", "OCEAN", "VILLAGE", "PUMPKIN", "PYRAMID"] },
    VERB: { name: "a verb", items: ["DISCOVER", "EXPLAIN", "WANDER", "BORROW", "IMAGINE", "DECIDE", "ARRIVE", "CELEBRATE", "PERSUADE"] },
  },
  targets: [
    { key: "ADJ", text: "HOP ON ADJECTIVES", say: "Hop only on adjectives.", hint: "Adjectives describe nouns: what kind? how many?" },
    { key: "VERB", text: "HOP ON VERBS", say: "Hop only on verbs.", hint: "Verbs show action or being." },
  ],
});

const g4Big = catRules({
  family: "g4-syn-big", subject: "ela", grade: "4", standard: "L.4.5", skill: "Synonyms and antonyms",
  cats: {
    BIG: { name: "a synonym for big", items: ["HUGE", "GIANT", "ENORMOUS", "VAST", "MASSIVE", "IMMENSE", "GIGANTIC", "JUMBO", "COLOSSAL", "TREMENDOUS"] },
    SMALL: { name: "an antonym (it means small)", items: ["TINY", "SMALL", "LITTLE", "PETITE", "MINIATURE", "WEE", "PUNY", "MINUSCULE"] },
  },
  targets: [{ key: "BIG", text: "HOP ON WORDS THAT MEAN BIG", say: "Hop only on synonyms for big.", hint: "Synonyms mean the same (or almost the same)." }],
});

const g4Happy = catRules({
  family: "g4-syn-happy", subject: "ela", grade: "4", standard: "L.4.5", skill: "Synonyms and antonyms",
  cats: {
    HAPPY: { name: "a synonym for happy", items: ["JOYFUL", "CHEERFUL", "GLAD", "DELIGHTED", "MERRY", "JOLLY", "ELATED", "THRILLED", "ECSTATIC", "OVERJOYED"] },
    NOT: { name: "not a synonym for happy", items: ["SAD", "GLOOMY", "UPSET", "MISERABLE", "GRUMPY", "BORED", "LONELY", "WORRIED", "TEARFUL"] },
  },
  targets: [{ key: "HAPPY", text: "HOP ON WORDS THAT MEAN HAPPY", say: "Hop only on synonyms for happy.", hint: "Synonyms mean the same (or almost the same)." }],
});

/* ------------------------------------------------------------------ 5 */

const g5Pos = catRules({
  family: "g5-pos", subject: "ela", grade: "5", standard: "L.5.1", skill: "Conjunctions, prepositions, interjections",
  cats: {
    CONJ: { name: "a conjunction", items: ["AND", "BUT", "OR", "NOR", "BECAUSE", "ALTHOUGH", "UNLESS", "WHEREAS", "WHETHER"] },
    INTERJ: { name: "an interjection", items: ["WOW", "OUCH", "OOPS", "HOORAY", "YIKES", "UH-OH", "PHEW", "WHOA", "AHA"] },
    PREP: { name: "a preposition", items: ["INTO", "ONTO", "UPON", "DURING", "AMONG", "TOWARD", "BETWEEN", "FROM", "WITH", "OF"] },
  },
  targets: [
    { key: "CONJ", text: "HOP ON CONJUNCTIONS", say: "Hop only on conjunctions.", hint: "Conjunctions join words or ideas (and, because)." },
    { key: "INTERJ", text: "HOP ON INTERJECTIONS", say: "Hop only on interjections.", hint: "Interjections show sudden feeling (wow! ouch!)." },
    { key: "PREP", text: "HOP ON PREPOSITIONS", say: "Hop only on prepositions.", hint: "Prepositions link a noun to the rest (into, from)." },
  ],
});

const g5Perfect = catRules({
  family: "g5-perfect", subject: "ela", grade: "5", standard: "L.5.1", skill: "Perfect verb tenses",
  cats: {
    PERFECT: { name: "a perfect tense (has/have/had + past participle)", items: ["HAD EATEN", "HAS GONE", "HAVE SEEN", "HAD RUN", "HAS DRAWN", "HAD LEFT", "HAVE BEEN", "HAS SUNG", "HAD FLOWN"] },
    OTHER: { name: "not a perfect tense", items: ["ATE", "GOES", "WILL SEE", "IS RUNNING", "WROTE", "LEAVES", "WAS", "SINGS", "FLEW"] },
  },
  targets: [{ key: "PERFECT", text: "HOP ON PERFECT-TENSE VERBS", say: "Hop only on perfect tense verbs: has, have or had plus a past participle.", hint: "Perfect = has / have / had + participle." }],
});

/* ------------------------------------------------------------------ roots (6-12) */

/** A roots set: meanings, their Greek/Latin roots, and example words. The test checks every word
 *  contains one of its own roots and none of the other meanings' roots. */
export interface RootSet {
  family: string;
  grade: Rule["grade"];
  standard: string;
  meanings: { key: string; meaning: string; roots: string[]; words: string[] }[];
}

export const ROOT_SETS: RootSet[] = [
  {
    family: "g6-roots", grade: "6", standard: "L.6.4",
    meanings: [
      { key: "WRITE", meaning: "write", roots: ["scrib", "script", "graph", "gram"], words: ["SCRIBBLE", "DESCRIBE", "SCRIPT", "MANUSCRIPT", "PRESCRIBE", "INSCRIBE", "AUTOGRAPH", "PARAGRAPH", "TELEGRAM", "GRAPHIC"] },
      { key: "CARRY", meaning: "carry", roots: ["port"], words: ["PORTABLE", "TRANSPORT", "EXPORT", "IMPORT", "PORTER", "SUPPORT", "REPORT", "DEPORT", "PORTFOLIO"] },
      { key: "SEE", meaning: "see or look", roots: ["spec", "vis", "vid"], words: ["SPECTATOR", "INSPECT", "SPECTACLE", "VISION", "VISIBLE", "VIDEO", "REVISE", "EVIDENT", "INVISIBLE", "SUPERVISE"] },
      { key: "HEAR", meaning: "hear or sound", roots: ["aud", "phon"], words: ["AUDIO", "AUDIENCE", "AUDITION", "PHONICS", "TELEPHONE", "MICROPHONE", "SYMPHONY", "HEADPHONE", "AUDIBLE", "SAXOPHONE"] },
    ],
  },
  {
    family: "g7-roots", grade: "7", standard: "L.7.4",
    meanings: [
      { key: "WATER", meaning: "water", roots: ["hydr", "aqu"], words: ["HYDRANT", "AQUARIUM", "DEHYDRATE", "AQUATIC", "HYDROGEN", "AQUEDUCT", "HYDROPOWER", "AQUAMARINE", "HYDRATE"] },
      { key: "TIME", meaning: "time", roots: ["chron", "tempo"], words: ["CHRONIC", "CHRONOLOGY", "TEMPORARY", "TEMPO", "CHRONICLE", "TEMPORAL", "EXTEMPORE", "SYNCHRONY"] },
      { key: "LIFE", meaning: "life", roots: ["bio"], words: ["BIOLOGY", "BIOME", "BIOGRAPHY", "ANTIBIOTIC", "BIONIC", "SYMBIOSIS", "BIOPSY", "BIOFUEL", "BIOLOGIST"] },
      { key: "EARTH", meaning: "earth or land", roots: ["geo", "terr"], words: ["GEOLOGY", "GEOGRAPHY", "TERRAIN", "TERRITORY", "GEODE", "TERRARIUM", "GEOTHERMAL", "GEOMETRY"] },
    ],
  },
  {
    family: "g8-roots", grade: "8", standard: "L.8.4",
    meanings: [
      { key: "STAR", meaning: "star", roots: ["astr", "aster"], words: ["ASTRONAUT", "ASTRONOMY", "ASTEROID", "ASTERISK", "DISASTER", "ASTRAL", "ASTRONOMER", "ASTROLOGY"] },
      { key: "LIGHT", meaning: "light", roots: ["photo", "lum"], words: ["PHOTOGRAPH", "PHOTON", "LUMINOUS", "ILLUMINATE", "LUMEN", "LUMINARY", "PHOTOCOPY", "TELEPHOTO", "LUMINOSITY"] },
      { key: "SELF", meaning: "self", roots: ["auto"], words: ["AUTOGRAPH", "AUTOMATIC", "AUTOPILOT", "AUTONOMY", "AUTOMOBILE", "AUTOPSY", "AUTOCRAT", "AUTOMATE"] },
    ],
  },
  {
    family: "g9-roots", grade: "9", standard: "L.9-10.4",
    meanings: [
      { key: "GOOD", meaning: "good or well", roots: ["bene", "ben", "bon"], words: ["BENEFIT", "BENEVOLENT", "BENIGN", "BONUS", "BENEFACTOR", "BENEFICIAL", "BONA FIDE", "BONANZA"] },
      { key: "BAD", meaning: "bad or badly", roots: ["mal"], words: ["MALICE", "MALWARE", "MALIGN", "MALADY", "MALNOURISH", "MALEVOLENT", "MALODOROUS", "MALADROIT", "MALCONTENT"] },
      { key: "SPEAK", meaning: "say, speak or call", roots: ["dict", "loqu", "voc"], words: ["DICTATE", "PREDICT", "VERDICT", "DICTION", "CONTRADICT", "ELOQUENT", "SOLILOQUY", "DICTIONARY", "EDICT", "VOCAL", "ADVOCATE", "VOCABULARY"] },
    ],
  },
  {
    family: "g10-roots", grade: "10", standard: "L.9-10.4",
    meanings: [
      { key: "TRUE", meaning: "true or believe", roots: ["ver", "cred"], words: ["CREDIBLE", "INCREDIBLE", "CREDIT", "CREDO", "VERIFY", "VERACITY", "CREDENTIAL", "VERITABLE", "CREDULOUS"] },
      { key: "AGAINST", meaning: "against or opposite", roots: ["anti", "contra", "counter"], words: ["ANTIDOTE", "ANTIBODY", "CONTRARY", "COUNTERACT", "ANTISOCIAL", "CONTRAST", "ANTIFREEZE", "CONTRABAND"] },
      { key: "MANY", meaning: "many", roots: ["poly", "multi"], words: ["POLYGON", "MULTIPLY", "POLYGLOT", "MULTITUDE", "POLYMER", "MULTIMEDIA", "POLYNOMIAL", "MULTICOLOR", "POLYHEDRON", "MULTIPLE"] },
    ],
  },
  {
    family: "g12-roots", grade: "12", standard: "L.11-12.4",
    meanings: [
      { key: "SEND", meaning: "send", roots: ["mit", "miss"], words: ["TRANSMIT", "EMISSION", "MISSILE", "REMIT", "DISMISS", "MISSION", "EMISSARY", "OMISSION", "SUBMIT", "COMMIT"] },
      { key: "BREAK", meaning: "break", roots: ["rupt", "fract", "frag"], words: ["RUPTURE", "ERUPT", "DISRUPT", "BANKRUPT", "FRACTURE", "FRACTION", "FRAGMENT", "INTERRUPT", "ABRUPT", "FRACTAL"] },
      { key: "TURN", meaning: "turn", roots: ["vert", "vers"], words: ["CONVERT", "REVERSE", "DIVERT", "INVERT", "VERSATILE", "INTROVERT", "ADVERSE", "VERTIGO", "DIVERSION", "VERSION"] },
    ],
  },
];

function rootRules(set: RootSet): Rule[] {
  return set.meanings.map((m) => {
    const rootFor = (w: string, roots: string[]) => roots.find((r) => w.toLowerCase().includes(r)) ?? roots[0];
    return listRule({
      id: `${set.family}-${m.key.toLowerCase()}`, family: set.family, subject: "ela", grade: set.grade, standard: set.standard,
      skill: "Greek and Latin roots",
      text: `HOP ON ROOTS MEANING "${m.key}"`,
      say: `Hop only on words with a Greek or Latin root that means ${m.meaning}.`,
      hint: `Roots for "${m.meaning}": ${m.roots.map((r) => r + "-").join(", ")}`,
      matches: m.words.map((w) => ({ label: w, why: `${w}: ${rootFor(w, m.roots)}- means "${m.meaning}".` })),
      misses: set.meanings.filter((o) => o !== m).flatMap((o) =>
        o.words.map((w) => ({ label: w, why: `${w}: ${rootFor(w, o.roots)}- means "${o.meaning}", not "${m.meaning}".` }))),
    });
  });
}

/* ------------------------------------------------------------------ connotation (6, 10) */

function connotation(o: { family: string; grade: Rule["grade"]; standard: string; pairs: [string, string][] }): Rule[] {
  return ["POSITIVE", "NEGATIVE"].map((t) => {
    const pos: RuleItem[] = o.pairs.map(([p, n]) => ({ label: p, why: `${p} sounds positive. ${n} is the negative way to say it.` }));
    const neg: RuleItem[] = o.pairs.map(([p, n]) => ({ label: n, why: `${n} sounds negative. ${p} is the positive way to say it.` }));
    return listRule({
      id: `${o.family}-${t.toLowerCase()}`, family: o.family, subject: "ela", grade: o.grade, standard: o.standard, skill: "Connotation",
      text: `HOP ON ${t} CONNOTATIONS`,
      say: `Hop only on words with a ${t.toLowerCase()} connotation.`,
      hint: t === "POSITIVE" ? "Same meaning, nicer feeling: thrifty, not stingy." : "Same meaning, harsher feeling: stingy, not thrifty.",
      matches: t === "POSITIVE" ? pos : neg,
      misses: t === "POSITIVE" ? neg : pos,
    });
  });
}

export const CONNOTATION_6: [string, string][] = [
  ["THRIFTY", "STINGY"], ["SLENDER", "SKINNY"], ["CONFIDENT", "ARROGANT"], ["CURIOUS", "NOSY"], ["DETERMINED", "STUBBORN"],
  ["YOUTHFUL", "CHILDISH"], ["RELAXED", "LAZY"], ["FRAGRANT", "SMELLY"], ["UNIQUE", "WEIRD"], ["CAUTIOUS", "COWARDLY"],
];
export const CONNOTATION_10: [string, string][] = [
  ["FRUGAL", "MISERLY"], ["STEADFAST", "OBSTINATE"], ["ASSERTIVE", "PUSHY"], ["CANDID", "BLUNT"], ["SAVVY", "CONNIVING"],
  ["TENACIOUS", "HEADSTRONG"], ["DISCERNING", "PICKY"], ["METICULOUS", "NITPICKY"], ["PERSISTENT", "NAGGING"], ["CASUAL", "SLOPPY"],
];

/* ------------------------------------------------------------------ 7, 8 grammar */

const g7Sub = catRules({
  family: "g7-subordinating", subject: "ela", grade: "7", standard: "L.7.1", skill: "Complex sentences",
  cats: {
    SUB: { name: "a subordinating conjunction", items: ["BECAUSE", "ALTHOUGH", "UNLESS", "WHEREAS", "IF", "WHENEVER", "WHEREVER", "AS SOON AS", "SO THAT", "EVEN IF"] },
    COORD: { name: "a coordinating conjunction (FANBOYS)", items: ["AND", "BUT", "OR", "NOR", "FOR", "SO", "YET"] },
    ADV: { name: "a conjunctive adverb", items: ["HOWEVER", "THEREFORE", "MOREOVER"] },
  },
  targets: [{ key: "SUB", text: "HOP ON SUBORDINATING CONJUNCTIONS", say: "Hop only on subordinating conjunctions, the ones that start a dependent clause.", hint: "They start a dependent clause: because, although, if…" }],
});

const g8Inf = catRules({
  family: "g8-infinitives", subject: "ela", grade: "8", standard: "L.8.1", skill: "Verbals: infinitives",
  cats: {
    INF: { name: "an infinitive (to + verb)", items: ["TO SWIM", "TO BE", "TO WIN", "TO THINK", "TO READ", "TO LAUGH", "TO EXPLORE", "TO DECIDE", "TO GROW", "TO SING"] },
    PREP: { name: "a prepositional phrase", items: ["TO HIM", "TO ME", "TO THEM", "TO MARS", "TO THE BUS", "TO THE ZOO", "TO GRANDMA", "TO BOSTON"] },
    OTHER: {
      name: "not an infinitive",
      items: [
        { label: "SWIMMING", why: "SWIMMING is a gerund or participle, not an infinitive." },
        { label: "TOMORROW", why: "TOMORROW is one word (a noun or adverb), not to + verb." },
      ],
    },
  },
  targets: [{ key: "INF", text: "HOP ON INFINITIVES", say: "Hop only on infinitives: to plus a verb.", hint: "Infinitive = to + verb. To + noun is a prepositional phrase." }],
});

/* ------------------------------------------------------------------ spelling (9, 11) */

export const SPELL_9: [string, string][] = [
  ["RECEIVE", "RECIEVE"], ["SEPARATE", "SEPERATE"], ["DEFINITELY", "DEFINATELY"], ["NECESSARY", "NECESARY"], ["OCCURRED", "OCCURED"],
  ["EMBARRASS", "EMBARASS"], ["RHYTHM", "RYTHM"], ["BELIEVE", "BELEIVE"], ["GRAMMAR", "GRAMMER"], ["PRIVILEGE", "PRIVELEGE"],
  ["WEIRD", "WIERD"], ["CEMETERY", "CEMETARY"], ["NOTICEABLE", "NOTICABLE"], ["TOMORROW", "TOMMOROW"],
];
export const SPELL_11: [string, string][] = [
  ["ACQUIRE", "AQUIRE"], ["CONSCIENCE", "CONCIENCE"], ["MILLENNIUM", "MILLENIUM"], ["LIAISON", "LIASON"], ["MANEUVER", "MANUEVER"],
  ["PERSEVERE", "PERSERVERE"], ["OCCASION", "OCASSION"], ["HARASS", "HARRASS"], ["INOCULATE", "INNOCULATE"], ["RESTAURANT", "RESTARAUNT"],
  ["GAUGE", "GUAGE"], ["PASTIME", "PASTTIME"], ["CONSENSUS", "CONCENSUS"], ["EXHILARATE", "EXHILERATE"],
];

function spelling(o: { id: string; grade: Rule["grade"]; standard: string; pairs: [string, string][] }): Rule {
  return listRule({
    id: o.id, subject: "ela", grade: o.grade, standard: o.standard, skill: "Spelling",
    text: "HOP ON CORRECT SPELLINGS",
    say: "Hop only on words that are spelled correctly.",
    hint: "Watch for i before e, doubled letters and silent letters.",
    matches: o.pairs.map(([c]) => ({ label: c, why: `${c} is spelled correctly.` })),
    misses: o.pairs.map(([c, w]) => ({ label: w, why: `${w} is misspelled. The correct spelling is ${c}.` })),
  });
}

/* ------------------------------------------------------------------ 11, 12 */

const g11Devices = catRules({
  family: "g11-devices", subject: "ela", grade: "11", standard: "RI.11-12.6", skill: "Rhetorical devices",
  cats: {
    DEVICE: {
      name: "a rhetorical device",
      items: [
        { label: "ANAPHORA", why: "ANAPHORA repeats words at the start of lines or clauses." },
        { label: "ANTITHESIS", why: "ANTITHESIS sets opposite ideas side by side." },
        { label: "CHIASMUS", why: "CHIASMUS reverses the order of words in a parallel phrase." },
        { label: "EPISTROPHE", why: "EPISTROPHE repeats words at the end of clauses." },
        { label: "LITOTES", why: "LITOTES is understatement by denying the opposite (not bad)." },
        { label: "ZEUGMA", why: "ZEUGMA uses one word with two others in different senses." },
        { label: "ASYNDETON", why: "ASYNDETON leaves out conjunctions: I came, I saw, I conquered." },
        { label: "SYNECDOCHE", why: "SYNECDOCHE uses a part for the whole (all hands on deck)." },
        { label: "METONYMY", why: "METONYMY names something by a related thing (the crown = the king)." },
        { label: "HYPERBOLE", why: "HYPERBOLE is deliberate exaggeration." },
      ],
    },
    OTHER: {
      name: "not a rhetorical device",
      items: [
        { label: "STANZA", why: "A STANZA is a group of lines in a poem: structure, not a device." },
        { label: "THESIS", why: "A THESIS is the main claim of an argument, not a device." },
        { label: "GERUND", why: "A GERUND is a verb form used as a noun (grammar term)." },
        { label: "SEMICOLON", why: "A SEMICOLON is a punctuation mark." },
        { label: "CLAUSE", why: "A CLAUSE is a grammar unit with a subject and verb." },
        { label: "CITATION", why: "A CITATION credits a source." },
        { label: "SYLLABLE", why: "A SYLLABLE is a unit of sound in a word." },
        { label: "PREFIX", why: "A PREFIX is a word part added to the front of a word." },
        { label: "FOOTNOTE", why: "A FOOTNOTE is a note at the bottom of a page." },
      ],
    },
  },
  targets: [{ key: "DEVICE", text: "HOP ON RHETORICAL DEVICES", say: "Hop only on the names of rhetorical devices.", hint: "Devices: patterns speakers use to persuade or stress." }],
});

export const EUPHEMISMS: [string, string][] = [
  ["PASSED ON", "DIED"], ["LET GO", "FIRED"], ["PRE-OWNED", "USED"], ["RESTROOM", "TOILET"], ["DOWNSIZED", "CUT JOBS"],
  ["BIG-BONED", "FAT"], ["SENIOR", "OLD"], ["NEUTRALIZE", "KILL"], ["ECONOMICAL", "CHEAP"],
];
const g12Euph = listRule({
  id: "g12-euphemism", subject: "ela", grade: "12", standard: "L.11-12.5", skill: "Euphemisms and connotation",
  text: "HOP ON EUPHEMISMS",
  say: "Hop only on euphemisms: gentle words used in place of harsh or blunt ones.",
  hint: "A euphemism softens a blunt word: passed on = died.",
  matches: EUPHEMISMS.map(([e, d]) => ({ label: e, why: `${e} is a softer way to say ${d}.` })),
  misses: EUPHEMISMS.map(([e, d]) => ({ label: d, why: `${d} is the blunt word. The euphemism is ${e}.` })),
});

export const ELA_RULES: Rule[] = [
  ...kRhymes, ...kStarts, ...kNounVerb,
  ...g1Vowels, ...g1Plurals, ...g1Proper,
  ...g2Pos, g2Compound,
  ...g3Adverbs, ...g3Past, g3Prefix,
  ...g4Pos, ...g4Big, ...g4Happy,
  ...g5Pos, ...g5Perfect,
  ...ROOT_SETS.flatMap(rootRules),
  ...connotation({ family: "g6-connotation", grade: "6", standard: "L.6.5", pairs: CONNOTATION_6 }),
  ...g7Sub,
  ...g8Inf,
  spelling({ id: "g9-spelling", grade: "9", standard: "L.9-10.2", pairs: SPELL_9 }),
  ...connotation({ family: "g10-connotation", grade: "10", standard: "L.9-10.5", pairs: CONNOTATION_10 }),
  spelling({ id: "g11-spelling", grade: "11", standard: "L.11-12.2", pairs: SPELL_11 }),
  ...g11Devices,
  g12Euph,
];
