import type { DeliveryRule } from "./types";

/*
 * ELA delivery rules, K–12 (NC Standard Course of Study for English Language Arts):
 * phonics (RF), parts of speech and verb tense (L.x.1), word relationships, synonyms and
 * figurative language (L.x.5), and Greek/Latin affixes and roots (L.x.4).
 * Words that can be more than one part of speech were avoided where that would confuse.
 */

export const ELA_RULES: DeliveryRule[] = [
  // ---------------------------------------------------------------- K
  {
    id: "e-k-rhyme", subject: "ela", grades: ["K"], standard: "RF.K.2", skill: "Rhyming words",
    target: "RHYMES WITH CAT", prompt: "Deliver to words that RHYME WITH CAT.",
    yes: ["HAT", "BAT", "MAT", "SAT", "RAT", "PAT", "FLAT", "CHAT"],
    no: ["DOG", "SUN", "PIG", "CUP", "BED", "TOP", "FISH", "CAKE", "CAN", "CUT"],
    yesWhy: "{x} ends with -AT, just like CAT, so they rhyme.", noWhy: "{x} does not end with the -AT sound, so it does not rhyme with CAT.",
    notes: { CAN: "CAN starts like CAT, but it ends with -AN, not -AT. Rhymes share the ending sound." },
  },
  {
    id: "e-k-colors", subject: "ela", grades: ["K"], standard: "L.K.5", skill: "Sorting words into groups",
    target: "COLOR WORDS", prompt: "Deliver to COLOR words.",
    yes: ["RED", "BLUE", "GREEN", "YELLOW", "PURPLE", "PINK", "BROWN", "BLACK", "WHITE"],
    no: ["DOG", "CAT", "BALL", "HAT", "TREE", "CAR", "BOOK", "FROG", "SUN"],
    yesWhy: "{x} is a color word.", noWhy: "{x} is not a color. It names a thing.",
  },
  {
    id: "e-k-b", subject: "ela", grades: ["K"], standard: "RF.K.3", skill: "Letter sounds",
    target: "STARTS WITH B", prompt: "Deliver to words that START WITH B.",
    yes: ["BALL", "BED", "BUG", "BOX", "BAT", "BIKE", "BUS", "BEE"],
    no: ["CAT", "DOG", "SUN", "PIG", "MOP", "TOP", "FAN", "HAT", "DUCK"],
    yesWhy: "{x} starts with the letter B and the /b/ sound.", noWhy: "{x} does not start with B.",
    notes: { DUCK: "DUCK starts with D. The letters b and d look alike, so watch which way the bump faces." },
  },
  // ---------------------------------------------------------------- 1
  {
    id: "e-1-past", subject: "ela", grades: ["1", "2"], standard: "L.1.1", skill: "Verb tense",
    target: "PAST TENSE", prompt: "Deliver to PAST-TENSE verbs: actions that already happened.",
    yes: ["JUMPED", "PLAYED", "RAN", "SAT", "ATE", "WALKED", "SANG", "SWAM", "LOOKED"],
    no: ["JUMPS", "PLAYS", "RUNS", "SITS", "EATS", "WALKS", "SINGS", "SWIMS", "LOOKS"],
    yesWhy: "{x} is past tense: it already happened.", noWhy: "{x} is present tense: it is happening now.",
    notes: { RAN: "RAN is the past tense of RUN. Some verbs change their spelling instead of adding -ed.", ATE: "ATE is the past tense of EAT." },
  },
  {
    id: "e-1-sh", subject: "ela", grades: ["1"], standard: "RF.1.3", skill: "Digraphs",
    target: "SH WORDS", prompt: "Deliver to words with the letters SH.",
    yes: ["SHIP", "FISH", "SHOP", "DISH", "SHELL", "WISH", "SHOE", "BRUSH", "SHARK"],
    no: ["CHIP", "THIN", "CHAT", "SIP", "HIS", "CHOP", "WITH", "SIT", "CHICK"],
    yesWhy: "{x} has SH: two letters that make one sound, /sh/.", noWhy: "{x} does not have the letters SH.",
    notes: { HIS: "HIS has an S and an H, but not together as SH." },
  },
  {
    id: "e-1-fruits", subject: "ela", grades: ["1"], standard: "L.1.5", skill: "Sorting words into categories",
    target: "FRUITS", prompt: "Deliver to words that name FRUITS.",
    yes: ["APPLE", "PEAR", "GRAPE", "BANANA", "PLUM", "PEACH", "CHERRY", "LEMON", "MANGO"],
    no: ["CARROT", "BREAD", "CHEESE", "EGG", "MILK", "RICE", "POTATO", "LETTUCE", "CELERY"],
    yesWhy: "{x} is a fruit.", noWhy: "{x} is a food, but not a fruit.",
  },
  // ---------------------------------------------------------------- 2
  {
    id: "e-2-plural", subject: "ela", grades: ["2"], standard: "L.2.1", skill: "Plural nouns",
    target: "PLURAL NOUNS", prompt: "Deliver to PLURAL nouns: more than one.",
    yes: ["CATS", "MICE", "FEET", "BOXES", "TEETH", "GEESE", "BUSES", "CHILDREN", "WOLVES"],
    no: ["CAT", "MOUSE", "FOOT", "BOX", "TOOTH", "GOOSE", "CHILD", "BUS", "WOLF"],
    yesWhy: "{x} means more than one.", noWhy: "{x} means just one.",
    notes: { MICE: "MICE is the plural of MOUSE: it changes spelling instead of adding -s.", BUS: "BUS ends in S, but it means just one. The plural is BUSES." },
  },
  {
    id: "e-2-compound", subject: "ela", grades: ["2", "3"], standard: "L.2.4", skill: "Compound words",
    target: "COMPOUND WORDS", prompt: "Deliver to COMPOUND words: two words joined into one.",
    yes: ["SUNSHINE", "RAINBOW", "BACKPACK", "CUPCAKE", "FOOTBALL", "SNOWMAN", "BEDROOM", "PANCAKE", "TOOTHBRUSH"],
    no: ["HAPPY", "GARDEN", "PENCIL", "WINDOW", "TABLE", "SISTER", "APPLE", "MONKEY", "CARPET"],
    yesWhy: "{x} is two words joined together.", noWhy: "{x} is not made of two words that keep their meanings.",
    notes: { CARPET: "CARPET has CAR and PET inside it, but a carpet is not a car or a pet, so it is not a compound word." },
  },
  // ---------------------------------------------------------------- 3
  {
    id: "e-3-adj", subject: "ela", grades: ["3"], standard: "L.3.1", skill: "Adjectives",
    target: "ADJECTIVES", prompt: "Deliver to ADJECTIVES: words that describe nouns.",
    yes: ["HAPPY", "SHINY", "TINY", "NOISY", "FLUFFY", "GENTLE", "HUNGRY", "SLEEPY", "HUGE"],
    no: ["TABLE", "JUMP", "QUICKLY", "SING", "TEACHER", "SLOWLY", "RIVER", "WROTE", "UNDER"],
    yesWhy: "{x} is an adjective: it describes a noun (a {x} puppy).", noWhy: "{x} is not an adjective.",
    notes: { QUICKLY: "QUICKLY is an adverb: it describes a verb (run quickly).", SLOWLY: "SLOWLY is an adverb: it tells how something is done." },
  },
  {
    id: "e-3-adv", subject: "ela", grades: ["3", "4"], standard: "L.3.1", skill: "Adverbs",
    target: "ADVERBS", prompt: "Deliver to ADVERBS: words that tell how an action is done.",
    yes: ["QUICKLY", "SLOWLY", "SOFTLY", "LOUDLY", "GENTLY", "NEATLY", "CAREFULLY", "SADLY", "BRAVELY"],
    no: ["HAPPY", "TABLE", "RUN", "SILLY", "LOVELY", "FRIENDLY", "TALL", "APPLE", "JUMP"],
    yesWhy: "{x} is an adverb: it tells how something is done.", noWhy: "{x} is not an adverb.",
    notes: { SILLY: "SILLY ends in -ly, but it is an adjective: a silly joke.", LOVELY: "LOVELY ends in -ly, but it is an adjective: a lovely day.", FRIENDLY: "FRIENDLY ends in -ly, but it is an adjective: a friendly dog." },
  },
  // ---------------------------------------------------------------- 4
  {
    id: "e-4-happy", subject: "ela", grades: ["4"], standard: "L.4.5", skill: "Synonyms and antonyms",
    target: "SYNONYMS OF HAPPY", prompt: "Deliver to SYNONYMS of HAPPY.",
    yes: ["GLAD", "JOYFUL", "CHEERFUL", "MERRY", "JOLLY", "PLEASED", "DELIGHTED", "THRILLED", "ELATED"],
    no: ["SAD", "ANGRY", "GLOOMY", "UPSET", "GRUMPY", "TIRED", "SCARED", "BORED", "LONELY"],
    yesWhy: "{x} means about the same as happy.", noWhy: "{x} does not mean happy.",
    notes: { GLOOMY: "GLOOMY means sad and dark: it is an antonym of happy." },
  },
  {
    id: "e-4-prep", subject: "ela", grades: ["4", "5"], standard: "L.4.1", skill: "Prepositions",
    target: "PREPOSITIONS", prompt: "Deliver to PREPOSITIONS: words that show where or when.",
    yes: ["UNDER", "ABOVE", "BEHIND", "BETWEEN", "BESIDE", "THROUGH", "DURING", "AMONG", "TOWARD", "ACROSS"],
    no: ["JUMP", "HAPPY", "TABLE", "QUICKLY", "SANG", "GREEN", "TEACHER", "SOFTLY", "BRIGHT"],
    yesWhy: "{x} is a preposition: it shows how a noun is related in place or time to the rest of the sentence.",
    noWhy: "{x} is not a preposition.",
  },
  // ---------------------------------------------------------------- 5
  {
    id: "e-5-conj", subject: "ela", grades: ["5"], standard: "L.5.1", skill: "Conjunctions",
    target: "CONJUNCTIONS", prompt: "Deliver to CONJUNCTIONS: words that join words or ideas.",
    yes: ["AND", "BUT", "OR", "NOR", "BECAUSE", "ALTHOUGH", "UNLESS", "IF", "WHEREAS"],
    no: ["WOW", "UNDER", "QUICKLY", "TABLE", "JUMP", "HAPPY", "OUCH", "THEY", "WITH"],
    yesWhy: "{x} is a conjunction: it joins words, phrases or clauses.", noWhy: "{x} is not a conjunction.",
    notes: { WITH: "WITH is a preposition, not a conjunction.", UNDER: "UNDER is a preposition: it shows position." },
  },
  {
    id: "e-5-interj", subject: "ela", grades: ["5"], standard: "L.5.1", skill: "Interjections",
    target: "INTERJECTIONS", prompt: "Deliver to INTERJECTIONS: words that show sudden feeling.",
    yes: ["WOW", "OUCH", "OOPS", "HOORAY", "YIKES", "WHOA", "BRAVO", "PHEW", "UH-OH"],
    no: ["AND", "TABLE", "QUICKLY", "RUN", "UNDER", "BLUE", "BECAUSE", "THEY", "FRIEND"],
    yesWhy: "{x} is an interjection: it shows a sudden feeling, often with an exclamation point.", noWhy: "{x} is not an interjection.",
  },
  {
    id: "e-5-onomato", subject: "ela", grades: ["4", "5"], standard: "L.5.5", skill: "Onomatopoeia",
    target: "ONOMATOPOEIA", prompt: "Deliver to ONOMATOPOEIA: words that sound like what they mean.",
    yes: ["BUZZ", "SIZZLE", "CRASH", "BANG", "HISS", "WHOOSH", "SPLASH", "THUD", "MEOW"],
    no: ["TABLE", "QUIET", "GARDEN", "PENCIL", "HAPPY", "WINDOW", "SLOWLY", "PURPLE", "SOFT"],
    yesWhy: "{x} imitates the sound it names.", noWhy: "{x} does not imitate a sound.",
    notes: { QUIET: "QUIET is about sound, but the word does not imitate a sound." },
  },
  // ---------------------------------------------------------------- 6
  {
    id: "e-6-pronouns", subject: "ela", grades: ["6"], standard: "L.6.1", skill: "Pronouns",
    target: "PRONOUNS", prompt: "Deliver to PRONOUNS: words that take the place of nouns.",
    yes: ["HE", "SHE", "THEY", "WE", "US", "THEM", "IT", "HIMSELF", "OURSELVES", "ME"],
    no: ["TABLE", "RUN", "HAPPY", "QUICKLY", "UNDER", "AND", "TEACHER", "BLUE", "JUMPED"],
    yesWhy: "{x} is a pronoun: it stands in for a noun.", noWhy: "{x} is not a pronoun.",
    notes: { HIMSELF: "HIMSELF is a reflexive (intensive) pronoun.", TEACHER: "TEACHER is a noun. A pronoun like SHE or HE could replace it." },
  },
  {
    id: "e-6-angry", subject: "ela", grades: ["6", "7"], standard: "L.6.5", skill: "Shades of meaning",
    target: "SYNONYMS OF ANGRY", prompt: "Deliver to SYNONYMS of ANGRY.",
    yes: ["FURIOUS", "IRATE", "ENRAGED", "LIVID", "IRRITATED", "FUMING", "INCENSED", "ANNOYED"],
    no: ["CALM", "SERENE", "JOLLY", "CONTENT", "PEACEFUL", "RELAXED", "CHEERFUL", "GRATEFUL", "AMUSED"],
    yesWhy: "{x} means angry (some are stronger: furious and livid mean very angry).", noWhy: "{x} does not mean angry.",
  },
  // ---------------------------------------------------------------- 7
  {
    id: "e-7-not", subject: "ela", grades: ["7"], standard: "L.7.4", skill: "Prefixes",
    target: "PREFIX = NOT", prompt: "Deliver to words with a prefix meaning NOT (un-, in-, im-, il-, ir-, dis-, non-).",
    yes: ["UNHAPPY", "IMPOSSIBLE", "INVISIBLE", "DISLIKE", "NONSTOP", "ILLEGAL", "IRREGULAR", "UNFAIR", "INCORRECT"],
    no: ["REPLAY", "PREVIEW", "INSIDE", "IMPORT", "INHALE", "UNIFORM", "UNITE", "REWRITE", "INVITE"],
    yesWhy: "{x} starts with a prefix meaning not.", noWhy: "{x} does not have a prefix meaning not.",
    notes: {
      INSIDE: "In INSIDE, in- means into or within, not 'not'.",
      IMPORT: "In IMPORT, im- means into: bring into a country.",
      INHALE: "In INHALE, in- means into: breathe in.",
      UNIFORM: "In UNIFORM, uni- means one: one form for everyone.",
      UNITE: "UNITE comes from uni-, meaning one: become one.",
      INVITE: "INVITE has no prefix meaning not: it means ask someone to come.",
    },
  },
  {
    id: "e-7-scrib", subject: "ela", grades: ["7", "8"], standard: "L.7.4", skill: "Latin roots",
    target: "ROOT SCRIB/SCRIPT", prompt: "Deliver to words with the Latin root SCRIB or SCRIPT (write).",
    yes: ["SCRIBBLE", "DESCRIBE", "SCRIPT", "PRESCRIBE", "INSCRIBE", "SUBSCRIBE", "MANUSCRIPT", "TRANSCRIPT", "SCRIBE"],
    no: ["SCRUB", "SCREAM", "SCREEN", "SCRAP", "SCRATCH", "SCRAMBLE", "DESTROY", "PORTABLE"],
    yesWhy: "{x} has the root scrib/script, meaning write.", noWhy: "{x} does not have the root scrib/script.",
    notes: { SCRATCH: "SCRATCH starts with scr-, but it has no root meaning write." },
  },
  // ---------------------------------------------------------------- 8
  {
    id: "e-8-phon", subject: "ela", grades: ["8"], standard: "L.8.4", skill: "Greek roots",
    target: "ROOT PHON", prompt: "Deliver to words with the Greek root PHON (sound).",
    yes: ["PHONE", "SYMPHONY", "PHONICS", "MICROPHONE", "TELEPHONE", "PHONETIC", "HEADPHONE", "XYLOPHONE", "MEGAPHONE"],
    no: ["PHOTO", "GRAPH", "PHYSICAL", "TELESCOPE", "PHANTOM", "ALPHABET", "PHARMACY", "DOLPHIN", "GEOGRAPHY"],
    yesWhy: "{x} has the root phon, meaning sound.", noWhy: "{x} does not have the root phon.",
    notes: { PHOTO: "PHOTO has the root phot, meaning light.", TELESCOPE: "TELESCOPE has tele (far) and scope (see), not phon." },
  },
  {
    id: "e-8-brave", subject: "ela", grades: ["8"], standard: "L.8.5", skill: "Synonyms and nuance",
    target: "SYNONYMS OF BRAVE", prompt: "Deliver to SYNONYMS of BRAVE.",
    yes: ["COURAGEOUS", "FEARLESS", "BOLD", "VALIANT", "DARING", "HEROIC", "GALLANT", "INTREPID"],
    no: ["TIMID", "COWARDLY", "FEARFUL", "MEEK", "SCARED", "NERVOUS", "AFRAID", "SHY"],
    yesWhy: "{x} means brave.", noWhy: "{x} is the opposite of brave.",
  },
  // ---------------------------------------------------------------- 9–10
  {
    id: "e-9-graph", subject: "ela", grades: ["9"], standard: "L.9-10.4", skill: "Greek roots",
    target: "ROOT GRAPH/GRAM", prompt: "Deliver to words with the Greek root GRAPH or GRAM (write, draw).",
    yes: ["AUTOGRAPH", "BIOGRAPHY", "PARAGRAPH", "TELEGRAM", "DIAGRAM", "GRAMMAR", "GRAPHIC", "PHOTOGRAPH", "TELEGRAPH"],
    no: ["GRAPE", "GRAB", "GRASP", "GRAVITY", "GRAIN", "GRAPPLE", "GRADUAL", "GRATEFUL", "GRANITE"],
    yesWhy: "{x} has the Greek root graph/gram, meaning write or draw.", noWhy: "{x} starts with gr-, but it does not have the root graph/gram.",
  },
  {
    id: "e-9-allit", subject: "ela", grades: ["9"], standard: "L.9-10.5", skill: "Sound devices",
    target: "ALLITERATION", prompt: "Deliver to ALLITERATION: words close together that start with the same sound.",
    yes: ["BIG BLUE", "SLY SNAKE", "PINK PIG", "WILD WIND", "TINY TOT", "FUNNY FROG", "BUSY BEES", "DEEP DARK", "SILLY SAM"],
    no: ["RED CAR", "HOT SUN", "OLD BOOK", "SAD CLOWN", "NEW SHOES", "COLD RAIN", "WET GRASS", "SOFT BED", "CITY CAR"],
    yesWhy: "{x} repeats the same beginning sound: alliteration.", noWhy: "{x} does not repeat a beginning sound.",
    notes: { "CITY CAR": "CITY and CAR both start with C, but CITY starts with /s/ and CAR with /k/. Alliteration is about sounds, not letters." },
  },
  {
    id: "e-10-person", subject: "ela", grades: ["10", "11"], standard: "L.9-10.5", skill: "Figurative language",
    target: "PERSONIFICATION", prompt: "Deliver to PERSONIFICATION: a thing doing something only people do.",
    yes: ["SUN SMILED", "WIND SANG", "SKY WEPT", "CAR SIGHED", "STARS WINK", "WAVES CLAP", "CITY SLEPT", "PEN DANCED", "BOOKS TALK"],
    no: ["SUN SHONE", "WIND BLEW", "RAIN FELL", "DOG BARKED", "BIRD SANG", "CAR STOPS", "WAVES ROSE", "STARS GLOW", "MOON ROSE", "BABY WEPT"],
    yesWhy: "{x} gives a human action to something that is not human: personification.",
    noWhy: "{x} is literal: that thing really can do that.",
    notes: { "BIRD SANG": "Birds really sing, so BIRD SANG is literal, not personification.", "BABY WEPT": "A baby is a person, so weeping is literal here." },
  },
  {
    id: "e-10-logy", subject: "ela", grades: ["10"], standard: "L.9-10.4", skill: "Greek roots",
    target: "ROOT LOG/LOGY", prompt: "Deliver to words with the Greek root LOG (word, reason, study of).",
    yes: ["BIOLOGY", "DIALOGUE", "APOLOGY", "MONOLOGUE", "GEOLOGY", "ECOLOGY", "PROLOGUE", "CATALOG", "LOGIC", "ANALOGY"],
    no: ["LODGE", "LOCAL", "SLOGAN", "GRAVITY", "PORTABLE", "TELEPHONE", "SCRIBBLE", "MOTION", "VISION"],
    yesWhy: "{x} comes from the Greek logos: word, reason or study.", noWhy: "{x} does not come from the Greek root log.",
    notes: { SLOGAN: "SLOGAN has l-o-g inside, but it comes from a Scottish Gaelic battle cry, not the Greek logos." },
  },
  // ---------------------------------------------------------------- 11–12
  {
    id: "e-11-vid", subject: "ela", grades: ["11", "12"], standard: "L.11-12.4", skill: "Latin roots",
    target: "ROOT VID/VIS", prompt: "Deliver to words with the Latin root VID or VIS (see).",
    yes: ["VISION", "VIDEO", "VISIBLE", "EVIDENT", "REVISE", "SUPERVISE", "VISTA", "VISUAL", "PROVIDE", "EVIDENCE"],
    no: ["VIRUS", "VITAL", "VINYL", "VIOLIN", "VICTORY", "VIVID", "VILLAGE", "VIRTUE", "VIOLENT"],
    yesWhy: "{x} comes from the Latin videre, to see.", noWhy: "{x} starts with vi-, but it does not come from videre (to see).",
    notes: { VIVID: "VIVID comes from vivus, alive.", VITAL: "VITAL comes from vita, life.", PROVIDE: "PROVIDE is pro (ahead) + videre (see): to see ahead and prepare." },
  },
  {
    id: "e-11-verbose", subject: "ela", grades: ["11", "12"], standard: "L.11-12.5", skill: "Synonyms and nuance",
    target: "MEANS VERBOSE", prompt: "Deliver to words that mean VERBOSE: using too many words.",
    yes: ["WORDY", "GARRULOUS", "PROLIX", "RAMBLING", "TALKATIVE", "LOQUACIOUS", "CHATTY", "GABBY"],
    no: ["TERSE", "CONCISE", "SUCCINCT", "BRIEF", "LACONIC", "PITHY", "CURT", "TACITURN"],
    yesWhy: "{x} describes someone who uses a lot of words.", noWhy: "{x} means using few words: an antonym of verbose.",
  },
  {
    id: "e-12-cred", subject: "ela", grades: ["12"], standard: "L.11-12.4", skill: "Latin roots",
    target: "ROOT CRED", prompt: "Deliver to words with the Latin root CRED (believe).",
    yes: ["CREDIT", "CREDIBLE", "INCREDIBLE", "CREED", "CREDO", "CREDULOUS", "DISCREDIT", "ACCREDIT", "CREDENTIAL"],
    no: ["CREATE", "CREEK", "CREEP", "CRESCENT", "CREASE", "CRATER", "CREW", "CRADLE", "CRAYON"],
    yesWhy: "{x} comes from the Latin credere, to believe.", noWhy: "{x} starts with cr-, but it does not come from credere (to believe).",
    notes: { CRESCENT: "CRESCENT comes from crescere, to grow (a growing moon)." },
  },
];
