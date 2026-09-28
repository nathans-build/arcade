/*
 * ELA sequences, K-12 (NC Standard Course of Study for English Language Arts).
 * Stories are original. Each story's events, each how-to text's steps and each structure has
 * exactly one correct order; alphabetical order is generated and sorted in code.
 */
import type { Grade } from "../kit/types";
import type { MathKind as GenKind, Rand } from "./math";
import type { Sequence } from "./types";

type Extra = Partial<Pick<Sequence, "passage" | "notes" | "say">>;

function E(id: string, grades: Grade[], standard: string, skill: string, title: string, ends: [string, string], steps: string[], explain: string, extra: Extra = {}): Sequence {
  return { id, subject: "ela", grades, standard, skill, title, ends, steps, explain, ...extra };
}
const FL: [string, string] = ["FIRST", "LAST"];
const BE: [string, string] = ["BEGINNING", "END"];
const HAPPENED: [string, string] = ["HAPPENED FIRST", "HAPPENED LAST"];

export const ELA: Sequence[] = [
  /* ---------------- K-2 (3 slabs, big labels) ---------------- */
  E("ela-k-01", ["K"], "RL.K.3", "Major events in a story", "MIA'S SEED", BE, ["DIG HOLE", "WATER IT", "FLOWER"],
    "Mia digs a hole for the seed first, then waters it every day, and at the end a flower pops up.",
    { passage: "Mia digs a little hole and drops in a seed. Every day, she gives it water. One morning, a red flower pops up!" }),
  E("ela-k-02", ["K"], "RL.K.3", "Major events in a story", "SAM'S SNOWMAN", BE, ["BIG BALL", "HEAD", "HAT"],
    "Sam makes the big bottom ball first, then the head, and last he puts on the hat.",
    { passage: "Sam rolls a big snowball for the bottom. Then he adds a small snowball for the head. Last, he puts his red hat on top." }),
  E("ela-k-03", ["K"], "RL.K.3", "Major events in a story", "BEN'S PARTY", BE, ["BALLOONS", "FRIENDS", "CAKE"],
    "First Ben blows up balloons, then his friends arrive, and at the end they all eat cake.",
    { passage: "Ben blows up red balloons. Then his friends come to his party. At the end, they all eat cake!" }),
  E("ela-k-04", ["K"], "L.K.1", "Build a sentence", "BUILD THE SENTENCE", FL, ["THE", "CAT", "NAPS."],
    "The cat naps. A sentence starts with a capital letter and ends with a period.",
    { passage: "Put the words in order to make a sentence." }),
  E("ela-1-01", ["1"], "RL.1.3", "Major events in a story", "LILY'S LOOSE TOOTH", BE, ["WIGGLES", "FALLS OUT", "PILLOW"],
    "Lily's tooth wiggles first, then it falls out at lunch, and that night it goes under her pillow.",
    { passage: "Lily's front tooth wiggles when she eats. At lunch, it falls out into her apple! That night, she tucks it under her pillow." }),
  E("ela-1-02", ["1"], "RI.1.3", "Steps in a how-to text", "HOW TO BRUSH YOUR TEETH", FL, ["ADD PASTE", "BRUSH", "RINSE"],
    "First put paste on the brush, next brush every tooth, and last rinse your mouth.",
    { passage: "First, squeeze paste onto your brush. Next, brush every tooth. Last, rinse your mouth with water." }),
  E("ela-1-03", ["1"], "L.1.1", "Build a sentence", "BUILD THE SENTENCE", FL, ["MY", "DOG", "DIGS."],
    "My dog digs. The sentence tells who (my dog) and what it does (digs), and ends with a period.",
    { passage: "Put the words in order to make a sentence." }),
  E("ela-1-04", ["1", "2"], "W.1.3", "Words that show order", "ORDER WORDS", FL, ["FIRST", "NEXT", "LAST"],
    "Writers use FIRST for the start, NEXT for the middle and LAST for the end."),
  E("ela-1-05", ["1"], "RL.1.3", "Major events in a story", "THE MUDDY PUP", BE, ["MUDDY", "BATH", "NAP"],
    "Pip jumps in the mud first, then gets a bath, and at the end naps by the fire.",
    { passage: "Pip the pup jumps in a mud puddle. Dad gives him a warm bath. Clean and sleepy, Pip naps by the fire." }),
  E("ela-2-01", ["2"], "RL.2.5", "Beginning, middle and end", "THE LOST PUPPY", BE, ["GETS LOST", "FOUND", "HOME"],
    "The beginning tells the problem (the puppy gets lost), the middle is when June finds it, and the end solves it (home again).",
    { passage: "A puppy wanders away and gets lost in the park. A girl named June hears it whimper under a bench. She reads its tag and walks it home to its happy family." }),
  E("ela-2-02", ["2"], "RI.2.3", "Steps in a how-to text", "HOW TO PLANT A SEED", FL, ["DIG HOLE", "DROP SEED", "WATER IT"],
    "Dig the hole, drop in the seed and cover it, and then water it.",
    { passage: "Dig a small hole. Drop the seed in and cover it with soil. Then water it well." }),
  E("ela-2-03", ["2"], "W.2.5", "Writing process", "WRITING STEPS", FL, ["PLAN", "DRAFT", "REVISE"],
    "Writers plan their ideas, write a draft, and then revise to make it better."),
  E("ela-2-04", ["2"], "L.2.1", "Build a sentence", "BUILD THE SENTENCE", FL, ["OUR CLASS", "WENT TO", "THE ZOO."],
    "Our class went to the zoo. Who (our class), did what (went to), where (the zoo), with a period at the end.",
    { passage: "Put the word groups in order to make a sentence." }),
  E("ela-2-05", ["2"], "RL.2.5", "Beginning, middle and end", "THE BIG RACE", BE, ["TRIPS", "GETS UP", "FINISHES"],
    "In the beginning Rosa trips, in the middle she gets back up, and at the end she finishes the race.",
    { passage: "At the big race, Rosa trips over her shoelace. She ties it tight and gets back up. She runs hard and finishes, smiling." }),

  /* ---------------- 3-5 (4 slabs) ---------------- */
  E("ela-3-01", ["3"], "RL.3.3", "Sequence of events", "ROSA'S VOLCANO", BE, ["ENTERS FAIR", "IT CRACKS", "GLUES IT", "WINS RIBBON"],
    "Rosa enters the fair, her volcano cracks, she glues it, and it wins. Each event causes the next.",
    { passage: "Rosa enters the science fair with a clay volcano. The night before, it cracks in half. She and her brother stay up late gluing it back together. At the fair, it erupts perfectly and wins a blue ribbon." }),
  E("ela-3-02", ["3"], "RI.3.3", "Steps in a procedure", "MAKE LEMONADE", FL, ["CUT LEMONS", "SQUEEZE", "STIR", "POUR"],
    "The text uses order words: first cut, then squeeze, then stir, and pour last.",
    { passage: "First, cut three lemons in half. Next, squeeze the juice into a pitcher. Then stir in water and sugar. Finally, pour it over ice." }),
  E("ela-3-03", ["3"], "W.3.5", "Writing process", "THE WRITING PROCESS", FL, ["PLAN", "DRAFT", "REVISE", "EDIT"],
    "Plan, write a draft, revise the ideas and words, then edit spelling and punctuation."),
  E("ela-3-04", ["3"], "RI.3.3", "Sequence in informational text", "HOW MAPLE SYRUP IS MADE", FL, ["TAP TREE", "COLLECT SAP", "BOIL SAP", "BOTTLE IT"],
    "Farmers tap the tree, collect the sap, boil it down, and bottle the syrup.",
    { passage: "In late winter, farmers drill a small hole in a maple tree. Sweet sap drips into a bucket. The sap is boiled for hours until it turns thick. Then the syrup is poured into bottles." }),
  E("ela-3-05", ["3", "4"], "W.3.4", "Parts of a letter", "PARTS OF A FRIENDLY LETTER", ["TOP", "BOTTOM"], ["GREETING", "BODY", "CLOSING", "SIGNATURE"],
    "A friendly letter starts with a greeting (Dear Sam,), then the body, then a closing (Your friend,), and your signature last."),
  E("ela-4-01", ["4"], "RL.4.3", "Sequence of events", "THEO'S MAP", BE, ["FINDS MAP", "DIGS AT OAK", "TIN BOX", "MARBLES"],
    "Theo finds the map, digs where it points, hits the tin box, and finds Grandpa's marbles inside.",
    { passage: "Theo finds a faded map in Grandpa's attic. It marks a spot under the old oak tree. Theo and Grandpa dig there and hit a rusty tin box. Inside are the marbles Grandpa buried as a boy." }),
  E("ela-4-02", ["4"], "RI.4.3", "Sequence in informational text", "HOW CHOCOLATE IS MADE", FL, ["PICK PODS", "DRY BEANS", "ROAST BEANS", "GRIND"],
    "Pods are picked, the beans are dried, then roasted at the factory, and finally ground into chocolate paste.",
    { passage: "Farmers cut cacao pods from the tree and scoop out the beans. The beans dry in the sun for about a week. At the factory, the beans are roasted. Finally, they are ground into a paste that becomes chocolate." }),
  E("ela-4-03", ["4"], "W.4.5", "Writing process", "FROM DRAFT TO READERS", FL, ["DRAFT", "REVISE", "EDIT", "PUBLISH"],
    "After drafting, revise the ideas, edit for conventions, and publish last so readers get your best work."),
  E("ela-4-04", ["4"], "RL.4.3", "Sequence of events", "THE KITE CONTEST", BE, ["BUILDS KITE", "WIND DIES", "RUNS FAST", "KITE SOARS"],
    "Maya builds the kite, the wind dies, she runs to lift it, and it soars. The problem comes before the solution.",
    { passage: "Maya spends all week building a dragon kite. On contest day, the wind suddenly dies. Maya runs as fast as she can across the field. Her kite catches a breeze and soars above the rest." }),
  E("ela-5-01", ["5"], "RL.5.3", "Sequence of events", "KIRI FINDS WATER", BE, ["WELL DRIES", "FINDS SPRING", "MARKS TRAIL", "FEAST"],
    "The well dries up (the problem), Kiri finds a spring, marks a trail, and the village celebrates her.",
    { passage: "The village well dried up in the long summer. Kiri hiked into the hills and found a hidden spring. She marked the path with a trail of white stones. That night, the whole village held a feast in her honor." }),
  E("ela-5-02", ["5"], "RI.5.3", "Sequence in informational text", "HOW AN NC BILL BECOMES LAW", FL, ["WRITE BILL", "COMMITTEE", "VOTES", "GOV SIGNS"],
    "A bill is written, studied in committee, voted on, and signed by the governor last.",
    { passage: "A member of the NC General Assembly writes a bill. A committee studies it and may change it. Both the House and the Senate vote on it. Finally, the governor signs it into law." }),
  E("ela-5-03", ["5"], "W.5.7", "Research process", "RESEARCH STEPS", FL, ["ASK QUESTION", "FIND SOURCES", "TAKE NOTES", "WRITE REPORT"],
    "Start with a question, find sources, take notes from them, and then write the report."),
  E("ela-5-04", ["5"], "RL.5.3", "Sequence of events", "JIN'S BRIDGE", BE, ["GETS TASK", "BRIDGE SNAPS", "TRIANGLES", "HOLDS TEN"],
    "The team gets the task, the first bridge snaps, Jin adds triangles, and the new bridge holds ten books.",
    { passage: "Jin's team must build a bridge from craft sticks. Their first bridge snaps under one book. Jin suggests adding triangles to the sides. The new bridge holds ten books, and the class cheers." }),

  /* ---------------- 6-8 (4-5 slabs) ---------------- */
  E("ela-6-01", ["6"], "RL.6.3", "How a plot unfolds", "ANA'S ROBOT", BE, ["JOINS CLUB", "ROBOT FAILS", "FIXES WIRE", "CROWD CHEERS", "GETS PIN"],
    "The plot unfolds in episodes: Ana joins, the robot fails, she fixes it at the climax, the crowd cheers, and she is rewarded.",
    { passage: "Ana joins the robotics club as its youngest member. All season, the team's robot keeps failing its turning test. At the regional contest, the robot freezes with ten seconds left, and Ana reconnects a loose wire. The robot finishes the course as the crowd cheers. On the bus home, the captain gives Ana the team pin." }),
  E("ela-6-02", ["6", "7"], "RL.6.5", "Plot structure", "PLOT STRUCTURE", BE, ["EXPOSITION", "RISING", "CLIMAX", "FALLING", "RESOLUTION"],
    "Exposition introduces characters and setting, rising action builds conflict, the climax is the turning point, falling action follows, and the resolution ends it."),
  E("ela-6-03", ["6"], "W.6.5", "Writing process", "THE WRITING PROCESS", FL, ["PREWRITE", "DRAFT", "REVISE", "EDIT", "PUBLISH"],
    "Prewrite to plan, draft, revise for ideas and organization, edit for conventions, and publish."),
  E("ela-6-04", ["6"], "RI.6.3", "Sequence in informational text", "HOW PAPER IS RECYCLED", FL, ["COLLECTED", "PULPED", "INK REMOVED", "PRESSED"],
    "Paper is collected, soaked into pulp, cleaned of ink and staples, then pressed into new sheets.",
    { passage: "Used paper is collected from bins and trucked to a mill. There it is soaked and churned into a mushy pulp. Screens and soap remove the ink and staples. The clean pulp is pressed flat and rolled into new sheets." }),
  E("ela-7-01", ["7"], "RL.7.3", "How events shape a story", "THE LIGHTHOUSE", BE, ["LIGHT OUT", "ROWS ASHORE", "CLIMBS TOWER", "LAMP ON", "GIFT OF FISH"],
    "The storm knocks out the light, Nell rows for a bulb, climbs the tower, relights the lamp just in time, and is thanked with fish.",
    { passage: "A storm knocks out the lighthouse lamp on Pell Island. Keeper Nell rows to shore for a new bulb while the waves grow. Back at the tower, she climbs 200 steps in the dark. The lamp flickers on just as a fishing boat nears the rocks. The next morning, the boat's crew brings Nell a basket of fish." }),
  E("ela-7-02", ["7"], "W.7.7", "Research process", "A RESEARCH PROJECT", FL, ["ASK QUESTION", "FIND SOURCES", "EVALUATE", "TAKE NOTES", "WRITE REPORT"],
    "Ask a focused question, find sources, evaluate whether they are credible, take notes from the good ones, and then write."),
  E("ela-7-03", ["7"], "RI.7.3", "Sequence in informational text", "HOW A NEWS STORY IS MADE", FL, ["ASSIGNED", "INTERVIEWS", "WRITES", "FACT CHECK", "PUBLISHED"],
    "An editor assigns the story, the reporter interviews people and writes, a copy editor checks facts, and then it is published.",
    { passage: "An editor assigns a story to a reporter. The reporter interviews witnesses at the scene. Back in the newsroom, she writes the article. A copy editor checks the facts and fixes errors. Then the story is published online." }),
  E("ela-8-01", ["8"], "RL.8.5", "Flashback and text structure", "WHAT HAPPENED FIRST?", HAPPENED, ["LOSES GAMES", "PRACTICES", "FINALS", "TROPHY"],
    "The story opens at the end (the trophy) and flashes back. In time order: he loses every game, practices all winter, wins the finals, then holds the trophy.",
    { passage: "Marcus stood on the stage, holding his trophy. He thought back to his first day of chess club, when he lost every game. He remembered the winter he practiced every night. Then came the finals, where he trapped his rival's queen." }),
  E("ela-8-02", ["8"], "RL.8.9", "Archetypal story patterns", "THE HERO'S JOURNEY", BE, ["HOME LIFE", "THE CALL", "MENTOR", "TRIALS", "RETURN"],
    "The hero's journey: ordinary life, a call to adventure, meeting a mentor, facing trials, and returning home changed."),
  E("ela-8-03", ["8"], "W.8.8", "Citing sources", "MLA BOOK CITATION", FL, ["AUTHOR", "TITLE", "PUBLISHER", "YEAR"],
    "An MLA book citation goes author, title, publisher, year. Example: Lopez, Ana. River Songs. Blue Door Press, 2021."),
  E("ela-8-04", ["8"], "RI.8.3", "Sequence in informational text", "HOW A U.S. BILL BECOMES LAW", FL, ["INTRODUCED", "COMMITTEE", "HOUSE VOTE", "SENATE VOTE", "SIGNED"],
    "Following the passage: introduced, studied in committee, passed by the House, passed by the Senate, and signed by the President.",
    { passage: "A bill is introduced in the House of Representatives. A committee studies it. The full House votes on it. Next, the Senate votes. Last, the President signs it." }),

  /* ---------------- 9-12 (4-5 slabs) ---------------- */
  E("ela-9-01", ["9"], "RL.9-10.5", "Nonlinear structure (in medias res)", "WHAT HAPPENED FIRST?", HAPPENED, ["SKIPS ALERT", "STARTS CLIMB", "ROPE FRAYS", "HANGS ON", "RESCUED"],
    "The story starts in the middle of the action (in medias res). In time order: she ignores the warning, climbs, the rope frays, she hangs on, and she is rescued.",
    { passage: "The story opens with Dara hanging from a cliff edge, her rope snapped. It then jumps back: that morning, she had ignored a storm alert. At noon she started up the north face alone. An hour later, rain began and her rope frayed on a sharp rock. The final scene shows a helicopter lifting her to safety." }),
  E("ela-9-02", ["9", "10"], "RL.9-10.5", "Plot structure", "FREYTAG'S PYRAMID", BE, ["EXPOSITION", "RISING", "CLIMAX", "FALLING", "DENOUEMENT"],
    "Freytag's pyramid: exposition, rising action, climax, falling action, and the dénouement, where loose ends are tied up.", { say: ["exposition", "rising action", "climax", "falling action", "day-noo-mon"] }),
  E("ela-9-03", ["9"], "W.9-10.5", "Writing process", "THE WRITING PROCESS", FL, ["PLAN", "DRAFT", "REVISE", "EDIT", "PUBLISH"],
    "Plan, draft, revise (content and structure), edit (conventions), publish."),
  E("ela-10-01", ["10"], "RI.9-10.3", "Order of events in informational text", "THE POLIO VACCINE", FL, ["EPIDEMIC", "LAB TESTS", "FIELD TRIAL", "APPROVED", "CASES FALL"],
    "The 1952 epidemic led to Salk's lab testing, the 1954 field trial, approval in 1955, and a sharp fall in cases.",
    { passage: "In 1952, a polio epidemic sickened tens of thousands of American children. Jonas Salk's team spent the next two years testing a vaccine in the lab. In 1954, more than a million children took part in a national field trial. In April 1955, the vaccine was declared safe and effective. Within a few years, U.S. polio cases fell sharply." }),
  E("ela-10-02", ["10"], "W.9-10.2", "Essay organization", "ESSAY STRUCTURE", ["TOP", "BOTTOM"], ["HOOK", "THESIS", "BODY", "CONCLUSION"],
    "An essay opens with a hook, states its thesis at the end of the introduction, develops it in body paragraphs, and wraps up in the conclusion."),
  E("ela-10-03", ["10"], "RL.9-10.3", "Character development", "PRIYA'S LETTERS", BE, ["REFUSES", "GETS LETTERS", "SHARED FEAR", "READS ALOUD", "MAILS THEM"],
    "Priya refuses to speak, finds the letters, learns her grandmother shared her fear, reads aloud, and then mails the letters. Each event changes her.",
    { passage: "Priya refuses to speak at her grandmother's funeral. Weeks later, she finds a box of letters her grandmother wrote but never sent. Reading them, Priya learns her grandmother was also afraid of crowds. At the memorial concert, Priya reads one letter aloud. Afterward, she mails the rest to the people they were written for." }),
  E("ela-11-01", ["11"], "RL.11-12.9", "American literary periods", "AMERICAN LITERARY PERIODS", ["EARLIEST", "LATEST"], ["COLONIAL", "ROMANTICISM", "REALISM", "MODERNISM", "POSTMODERN"],
    "Colonial writing (1600s-1700s), Romanticism (early-mid 1800s), Realism (late 1800s), Modernism (early 1900s), Postmodernism (after World War II)."),
  E("ela-11-02", ["11"], "RI.11-12.3", "Sequence in a founding document", "AMENDING THE CONSTITUTION", FL, ["PROPOSED", "TO STATES", "RATIFIED", "IN FORCE"],
    "An amendment is proposed, sent to the states, ratified by three-fourths of them, and then takes effect.",
    { passage: "An amendment is proposed when two-thirds of both houses of Congress approve it. It is then sent to the states. Three-fourths of the state legislatures must ratify it. Once ratified, it becomes part of the Constitution." }),
  E("ela-11-03", ["11"], "RL.11-12.5", "Poem structure", "SHAKESPEAREAN SONNET", FL, ["QUATRAIN 1", "QUATRAIN 2", "QUATRAIN 3", "COUPLET"],
    "A Shakespearean sonnet has three quatrains (ABAB CDCD EFEF) and ends with a rhyming couplet (GG) that often turns or sums up the poem."),
  E("ela-12-01", ["12"], "RL.11-12.9", "British literary periods", "BRITISH LITERARY PERIODS", ["EARLIEST", "LATEST"], ["OLD ENGLISH", "MEDIEVAL", "RENAISSANCE", "ROMANTIC", "VICTORIAN"],
    "Old English (Beowulf), Medieval (Chaucer), Renaissance (Shakespeare), Romantic (Wordsworth), Victorian (Dickens)."),
  E("ela-12-02", ["12"], "RL.11-12.5", "Structure of a tragedy", "FIVE-ACT TRAGEDY", BE, ["EXPOSITION", "RISING", "CLIMAX", "FALLING", "CATASTROPHE"],
    "Freytag's five acts of a tragedy: exposition, rising action, climax, falling action, and the catastrophe."),
  E("ela-12-03", ["12"], "RL.11-12.3", "Author's choices in developing a story", "THE LAST SHIFT", BE, ["FINDS BOY", "SKIPS PARTY", "FINDS MOTHER", "BUYS TICKETS", "GETS DRAWING"],
    "Eli finds the boy, gives up his party to search, finds the mother, spends his gift money on tickets, and is thanked a year later.",
    { passage: "On his last night before retiring, conductor Eli Ward finds a lost boy on the platform. He skips his farewell party to search the station for the boy's mother. Near midnight, he finds her asleep in the waiting room. He buys them both tickets home with his retirement gift money. A year later, the boy mails him a drawing of a train." }),
  E("ela-12-04", ["11", "12"], "W.11-12.5", "Writing process", "REVISING A RESEARCH PAPER", FL, ["DRAFT", "PEER REVIEW", "REVISE", "PROOFREAD", "SUBMIT"],
    "Draft, get peer feedback, revise with it, proofread the final version, and submit."),
];

/* ------------------------------ ABC order (generated, K-2) ------------------------------ */

const shuffle = <T>(r: Rand, arr: T[]) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

const WORDS_1 = ["ANT", "BED", "CAT", "DOG", "EGG", "FOX", "HAT", "JAM", "KID", "LOG", "MAP", "NET", "OWL", "PIG", "RUG", "SUN", "TOP", "VAN", "WEB", "YAK", "ZIP"];
const WORDS_2: string[][] = [
  ["BAT", "BED", "BIG", "BOX", "BUS"],
  ["SAND", "SEED", "SIP", "SOCK", "SUN"],
  ["CAKE", "CLAP", "COAT", "CRAB", "CUP"],
  ["MAP", "MEN", "MILK", "MOP", "MUD"],
  ["PAN", "PET", "PIN", "POT", "PUP"],
  ["TAP", "TEN", "TIP", "TOE", "TUB"],
];

function abcSeq(g: Grade, steps: string[], standard: string, skill: string, passage: string): Sequence {
  const sorted = [...steps].sort();
  return {
    id: `ela-abc-${g}-${sorted.join("-")}`,
    subject: "ela",
    grades: [g],
    standard,
    skill,
    title: "ABC ORDER",
    ends: ["A END", "Z END"],
    steps: sorted,
    passage,
    say: sorted.map((s) => (s.length === 1 ? s : s.toLowerCase())),
    explain: `In ABC order: ${sorted.join(", ")}.`,
  };
}

export const ELA_KINDS: GenKind[] = [
  {
    key: "abc-letters",
    grades: ["K"],
    make: (g, r) => abcSeq(g, shuffle(r, "ABCDEFGHIJKLMNOPRSTUW".split("")).slice(0, 3), "RF.K.1", "Alphabet order", "Which letter comes first in the ABCs?"),
  },
  {
    key: "abc-words",
    grades: ["1"],
    make: (g, r) => abcSeq(g, shuffle(r, WORDS_1).slice(0, 3), "RF.1.1", "ABC order (first letter)", "Look at the first letter of each word."),
  },
  {
    key: "abc-second",
    grades: ["2"],
    make: (g, r) => {
      const group = WORDS_2[Math.floor(r() * WORDS_2.length)];
      return abcSeq(g, shuffle(r, group).slice(0, 3), "L.2.2", "ABC order (second letter)", "They all start with the same letter, so look at the second letter.");
    },
  },
];

export const ABC_WORD_LISTS = { WORDS_1, WORDS_2 };
