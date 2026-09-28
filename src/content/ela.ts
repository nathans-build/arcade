import type { Grade } from "@/kit";
import type { BuildItem, CategoryRule } from "./types";

/*
 * ELA content for Cube Hop, K–12 (NC Standard Course of Study for English Language Arts):
 * sentence features (RF.K.1, RF.1.1), grammar and usage (L.x.1) and capitalization and
 * punctuation (L.x.2). Every sentence is original. Tokens are the sentence split on spaces,
 * so punctuation rides on its word ("fast." "tired,"). Each sentence has one build order:
 * distractors never make a second correct sentence with the other tokens.
 */

const K: Grade[] = ["K"];
const K1: Grade[] = ["K", "1"];
const G1: Grade[] = ["1"];
const G12: Grade[] = ["1", "2"];
const G2: Grade[] = ["2"];
const G3: Grade[] = ["3"];
const G34: Grade[] = ["3", "4"];
const G4: Grade[] = ["4"];
const G45: Grade[] = ["4", "5"];
const G5: Grade[] = ["5"];
const G6: Grade[] = ["6"];
const G67: Grade[] = ["6", "7"];
const G7: Grade[] = ["7"];
const G78: Grade[] = ["7", "8"];
const G8: Grade[] = ["8"];
const HS1: Grade[] = ["9", "10"];
const HS: Grade[] = ["9", "10", "11", "12"];
const HS2: Grade[] = ["11", "12"];

let n = 0;
function b(
  grades: Grade[], standard: string, skill: string, prompt: string, sentence: string,
  distractors: [string, string][], explain: string,
): BuildItem {
  n++;
  return {
    id: `e-b${n}`, subject: "ela", grades, standard, skill, prompt,
    tokens: sentence.split(" "),
    distractors: distractors.map(([label, why]) => ({ label, why })),
    explain,
  };
}

const CAP = "A sentence starts with a capital letter.";
const DOT = "A telling sentence ends with a period.";
const ASK = "It asks something, so it ends with a question mark.";

export const ELA_BUILDS: BuildItem[] = [
  // ------------------------------------------------------------------ K
  b(K, "RF.K.1", "Sentence features", "Build the sentence: The cat naps.", "The cat naps.",
    [["the", CAP], ["naps", DOT]], "Start with a capital letter and end with a period."),
  b(K, "RF.K.1", "Sentence features", "Build the sentence: I see a dog.", "I see a dog.",
    [["i", "The word I is always a capital letter."], ["dog", DOT]], "The word I is always a capital. The period shows the sentence is over."),
  b(K, "RF.K.1", "Sentence features", "Build the sentence: We can run.", "We can run.",
    [["we", CAP], ["run", DOT]], "Capital letter first, period last."),
  b(K1, "RF.K.1", "Sentence features", "Build the sentence: Look at me!", "Look at me!",
    [["look", CAP], ["me", "This sentence shows strong feeling, so it ends with an exclamation mark."]], "An exclamation mark shows strong feeling."),
  b(K, "RF.K.1", "Sentence features", "Build the sentence: The sun is hot.", "The sun is hot.",
    [["the", CAP], ["hot", DOT]], "Words go left to right, with a capital first and a period last."),
  b(K, "RF.K.1", "Sentence features", "Build the sentence: My hat is red.", "My hat is red.",
    [["my", CAP], ["red", DOT]], "Capital letter first, period last."),
  b(K1, "L.K.1", "Asking sentences", "Build the question: Can you hop?", "Can you hop?",
    [["can", CAP], ["hop.", ASK]], "Questions end with a question mark."),
  b(K1, "L.K.1", "Asking sentences", "Build the question: Is it big?", "Is it big?",
    [["is", CAP], ["big.", ASK]], "Questions end with a question mark."),
  b(K, "L.K.1", "Plural nouns", "Build the sentence: I see two cats.", "I see two cats.",
    [["cat.", "Two means more than one, so add -s: cats."], ["i", "The word I is always a capital letter."]], "Add -s to name more than one: cat, cats."),
  // ------------------------------------------------------------------ 1
  b(G1, "L.1.1", "Subject-verb agreement", "Fix it: the dogs runs.", "The dogs run.",
    [["runs.", "Dogs means more than one, so use run."], ["the", CAP]], "One dog runs. Two dogs run."),
  b(G1, "L.1.1", "Subject-verb agreement", "Fix it: sam have a cat.", "Sam has a cat.",
    [["have", "Sam is one person, so use has."], ["sam", "Names of people start with a capital letter."]], "Sam has. They have."),
  b(G12, "L.1.2", "Capitalize names", "Fix it: we went to ohio.", "We went to Ohio.",
    [["ohio.", "Names of places start with a capital letter."], ["goed", "The past tense of go is went."]], "Names of places, like Ohio, start with a capital letter."),
  b(G1, "L.1.1", "Pronouns", "Fix it: her is my pal.", "She is my pal.",
    [["Her", "Use she for the one doing something: She is my pal."], ["are", "She is one person, so use is."]], "Use she, he or I to start a sentence about who is doing something."),
  b(G1, "RF.1.1", "Sentence features", "Fix it: where is my hat.", "Where is my hat?",
    [["hat.", ASK], ["where", CAP]], "A question starts with a capital and ends with a question mark."),
  b(G12, "L.1.1", "Past tense", "Fix it: the cups falled.", "The cups fell.",
    [["falled.", "The past tense of fall is fell."], ["the", CAP]], "Some verbs change spelling in the past: fall, fell."),
  b(G1, "RF.1.1", "Sentence features", "Fix it: wow, we won", "Wow, we won!",
    [["won.", "This shows strong feeling, so end with an exclamation mark."], ["wow,", CAP]], "Strong feelings end with an exclamation mark."),
  // ------------------------------------------------------------------ 2
  b(G2, "L.2.1", "Irregular plurals", "Fix it: the mouses eated.", "The mice ate.",
    [["mouses", "More than one mouse is mice."], ["eated.", "The past tense of eat is ate."]], "Mouse becomes mice, and eat becomes ate."),
  b(G2, "L.2.1", "Reflexive pronouns", "Fix it: i did it meself.", "I did it myself.",
    [["meself.", "Meself is not a word. Use myself."], ["i", "The word I is always a capital letter."]], "Myself, yourself and himself point back to who did it."),
  b(G2, "L.2.1", "Irregular plurals", "Fix it: two gooses swimmed.", "Two geese swam.",
    [["gooses", "More than one goose is geese."], ["swimmed.", "The past tense of swim is swam."]], "Goose becomes geese, and swim becomes swam."),
  b(G2, "L.2.2", "Apostrophes in contractions", "Fix it: we cant go.", "We can't go.",
    [["cant", "Can't needs an apostrophe where the letters were left out (can not)."], ["goes.", "After can't, use go."]], "The apostrophe in can't stands for missing letters."),
  b(G2, "L.2.2", "Capitalize days", "Fix it: today is monday.", "Today is Monday.",
    [["monday.", "Days of the week start with a capital letter."], ["today", CAP]], "Days of the week are names, so they get a capital."),
  b(G2, "L.2.1", "Adverbs", "Fix it: she ran quick.", "She ran quickly.",
    [["quick.", "Quickly tells how she ran. Many words that tell how end in -ly."], ["runned", "The past tense of run is ran."]], "Adverbs like quickly tell how something happens."),
  b(G2, "L.2.1", "Collective nouns", "Fix it: our class are loud.", "Our class is loud.",
    [["are", "A class is one group, so use is."], ["our", CAP]], "A group word like class or team takes is."),
  // ------------------------------------------------------------------ 3
  b(G3, "L.3.1", "Subject-verb agreement", "Fix it: the kids walks to school", "The kids walk to school.",
    [["walks", "Kids is plural, so the verb is walk."], ["school", DOT]], "Plural subjects take verbs without -s: the kids walk."),
  b(G3, "L.3.1", "Comparative adjectives", "Fix it: my dog is more big than yours.", "My dog is bigger than yours.",
    [["more big", "Add -er to short adjectives: bigger."], ["biggest", "Use -er to compare two things; -est is for three or more."]], "Compare two things with -er: big, bigger."),
  b(G3, "L.3.1", "Verb tenses", "Make it past tense: Yesterday we play chess.", "Yesterday we played chess.",
    [["play", "Yesterday is in the past, so add -ed: played."], ["plays", "Yesterday is in the past, so use played."]], "Yesterday tells you to use the past tense."),
  b(G3, "L.3.1", "Verb tenses", "Make it future tense: Tomorrow I swim.", "Tomorrow I will swim.",
    [["swam.", "Tomorrow hasn't happened yet, so use will swim."], ["swims.", "After will, use swim."]], "The future tense uses will: I will swim."),
  b(G34, "L.3.1", "Conjunctions", "Combine with so: Mia was hungry. She ate.", "Mia was hungry, so she ate.",
    [["but", "But shows a contrast. Being hungry is the reason she ate, so use so."], ["hungry", "Put a comma before so when it joins two sentences."]], "So joins a cause and its result, with a comma before it."),
  b(G34, "L.3.1", "Conjunctions", "Combine: It rained. We played anyway.", "It rained, but we played.",
    [["so", "So means as a result. Playing in the rain is a surprise, so use but."], ["We", "After the comma, we is not the start of a sentence, so no capital."]], "But joins two ideas that contrast."),
  b(G3, "L.3.2", "Possessives", "Fix it: the dogs bone is big.", "The dog's bone is big.",
    [["dogs", "Use an apostrophe to show the bone belongs to the dog: dog's."], ["the", CAP]], "Add 's to show that something belongs to someone."),
  b(G3, "L.3.2", "Quotation marks", "Fix it: Mom said \"come in.\"", "Mom said, \"Come in.\"",
    [["said", "Put a comma after said, before the quote."], ["\"come", "The first word inside quotation marks gets a capital."]], "Use a comma before a quote, and start the quote with a capital."),
  b(G3, "L.3.1", "Pronoun-antecedent agreement", "Fix it: the girls lost her hats.", "The girls lost their hats.",
    [["her", "Girls is plural, so use their."], ["there", "There tells a place. Their shows belonging."]], "A plural noun like girls needs a plural pronoun: their."),
  b(G3, "L.3.1", "Superlative adjectives", "Fix it: this is the most tallest tree.", "This is the tallest tree.",
    [["most", "Don't use most with -est. Tallest already means most tall."], ["this", CAP]], "Use -est OR most, never both."),
  // ------------------------------------------------------------------ 4
  b(G4, "L.4.1", "Relative pronouns", "Fix it: the boy which won smiled.", "The boy who won smiled.",
    [["which", "Use who for people. Which is for things."], ["smiled", DOT]], "Who is for people; which is for things."),
  b(G4, "L.4.1", "Progressive verb tenses", "Fix it: we was running home.", "We were running home.",
    [["was", "We is plural, so use were."], ["runned", "Running is the form that goes with were."]], "The past progressive is was/were + -ing: we were running."),
  b(G4, "L.4.1", "Order of adjectives", "Put the describing words in order: She has a red small ball.", "She has a small red ball.",
    [["balls.", "A means one, so use ball."], ["Her", "Use she to start the sentence."]], "Size words come before color words: a small red ball."),
  b(G4, "L.4.1", "Modal auxiliaries", "Fix it: you may goes outside.", "You may go outside.",
    [["goes", "After may, use the plain verb go."], ["you", CAP]], "Helping verbs like may, can and must go with the plain verb."),
  b(G4, "L.4.1", "Frequently confused words", "Fix it: I want to go two.", "I want to go too.",
    [["two.", "Two is the number 2. Too means also."], ["i", "The word I is always a capital letter."]], "Too means also; two is a number; to shows direction."),
  b(G45, "L.4.2", "Commas in compound sentences", "Combine: Sam ran fast. He won.", "Sam ran fast, and he won.",
    [["fast", "Put a comma before and when it joins two sentences."], ["him", "He is doing the winning, so use he."]], "Use a comma before and, but or so when they join two sentences."),
  b(G4, "L.4.1", "Frequently confused words", "Fix it: their going to the park.", "They're going to the park.",
    [["Their", "Their shows belonging. They're means they are."], ["There", "There tells a place. They're means they are."]], "They're = they are. Their = belonging. There = a place."),
  // ------------------------------------------------------------------ 5
  b(G5, "L.5.1", "Perfect verb tenses", "Fix it: she have finish her work.", "She has finished her work.",
    [["have", "She is one person, so use has."], ["finish", "The perfect tense needs the -ed form: has finished."]], "The present perfect is has/have + past participle."),
  b(G5, "L.5.1", "Correlative conjunctions", "Fix it: either Ann nor Joe will go.", "Either Ann or Joe will go.",
    [["nor", "Either goes with or. Neither goes with nor."], ["either", CAP]], "Either … or; neither … nor."),
  b(G5, "L.5.1", "Correlative conjunctions", "Fix it: neither Max or Zoe ate.", "Neither Max nor Zoe ate.",
    [["or", "Neither goes with nor."], ["eated.", "The past tense of eat is ate."]], "Neither … nor go together."),
  b(G5, "L.5.2", "Commas after introductory words", "Add the comma: After lunch we read.", "After lunch, we read.",
    [["lunch", "Put a comma after an opening phrase like After lunch."], ["We", "After the comma, we is not the start of a sentence."]], "A comma follows an introductory phrase."),
  b(G5, "L.5.2", "Commas with yes and no", "Add the comma: Yes I can help.", "Yes, I can help.",
    [["Yes", "Put a comma after yes or no at the start of a sentence."], ["helps.", "After can, use help."]], "Use a comma after yes or no."),
  b(G5, "L.5.2", "Commas in direct address", "Add the comma: Ben please sit down.", "Ben, please sit down.",
    [["Ben", "When you talk to someone by name, set the name off with a comma."], ["sits", "Please is followed by the plain verb sit."]], "Set off the name of the person you speak to with a comma."),
  b(G5, "L.5.1", "Perfect verb tenses", "Fix it: we had ate before six.", "We had eaten before six.",
    [["ate", "Had needs the past participle: had eaten."], ["has", "The past perfect uses had."]], "The past perfect is had + past participle: had eaten."),
  b(G5, "L.5.1", "Shifts in verb tense", "Fix the tense: He opened the door and smiles.", "He opened the door and smiled.",
    [["smiles.", "Keep the same tense: opened … smiled."], ["opens", "Keep the same tense: opened … smiled."]], "Don't switch tenses in the middle of a sentence."),
  // ------------------------------------------------------------------ 6
  b(G6, "L.6.1", "Pronoun case", "Fix it: Maya and me won the game.", "Maya and I won the game.",
    [["me", "Maya and I are doing the action, so use the subject pronoun I."], ["myself", "Use I as the subject, not myself."]], "Use subject pronouns (I, he, she) for the doer."),
  b(G67, "L.6.1", "Pronoun case", "Fix it: Coach gave the ball to Leo and I.", "Coach gave the ball to Leo and me.",
    [["I.", "After the preposition to, use the object pronoun me."], ["myself.", "Myself only points back to an I in the same sentence."]], "Use object pronouns (me, him, her) after prepositions."),
  b(G6, "L.6.1", "Intensive pronouns", "Fix it: The chef hisself made dessert.", "The chef herself made dessert.",
    [["hisself", "Hisself is not standard English. The chef here is a she: herself."], ["sheself", "Sheself is not a word. Use herself."]], "Intensive pronouns (herself, himself) add emphasis."),
  b(G6, "L.6.1", "Shifts in pronoun person", "Fix the shift: When students study, you learn more.", "When students study, they learn more.",
    [["you", "Don't shift from students to you. Use they."], ["study", "Put a comma after the opening clause."]], "Keep pronouns consistent with the noun they replace."),
  b(G67, "L.6.2", "Commas with nonrestrictive elements", "Add commas: My aunt a pilot flew home.", "My aunt, a pilot, flew home.",
    [["aunt", "Set off the extra information a pilot with commas on both sides."], ["pilot", "Set off the extra information a pilot with commas on both sides."]], "Extra information in the middle of a sentence is set off by a pair of commas."),
  b(G6, "L.6.1", "Possessive pronouns", "Fix it: The choice is your's.", "The choice is yours.",
    [["your's.", "Possessive pronouns never use an apostrophe: yours."], ["you're.", "You're means you are."]], "Yours, hers, ours and theirs have no apostrophe."),
  // ------------------------------------------------------------------ 7
  b(G7, "L.7.1", "Complex sentences", "Combine: It snowed. School closed.", "Because it snowed, school closed.",
    [["Although", "Although shows contrast. The snow is the reason, so use Because."], ["snowed", "Put a comma after an opening dependent clause."]], "A dependent clause (Because it snowed) plus an independent clause makes a complex sentence."),
  b(G7, "L.7.2", "Commas between coordinate adjectives", "Add the comma: It was a long dark night.", "It was a long, dark night.",
    [["long", "Long and dark each describe night, so separate them with a comma."], ["darkly", "Night is a noun, so describe it with the adjective dark."]], "Use a comma between adjectives that each describe the noun."),
  b(G7, "L.7.1", "Dangling modifiers", "Fix it: Walking home, a fox saw me.", "Walking home, I saw a fox.",
    [["me.", "Who was walking home? You were, so I must come right after the comma."], ["walking", CAP]], "An opening phrase describes whatever comes right after the comma."),
  b(G78, "L.7.1", "Compound-complex sentences", "Combine: When the bell rang, we left. Ed stayed.", "When the bell rang, we left, but Ed stayed.",
    [["so", "Ed staying is a contrast to us leaving, so use but."], ["rang", "Put a comma after the opening clause When the bell rang."]], "A compound-complex sentence has two independent clauses and a dependent one."),
  b(G7, "L.7.1", "Phrases and clauses", "Fix the fragment: Since the game ended. We left.", "Since the game ended, we left.",
    [["ended.", "Since the game ended is a fragment. Join it to we left with a comma."], ["We", "After the comma, we is not the start of a sentence."]], "A dependent clause can't stand alone; join it to an independent clause."),
  // ------------------------------------------------------------------ 8
  b(G8, "L.8.1", "Subjunctive mood", "Fix it: If Tom was taller he could reach.", "If Tom were taller, he could reach.",
    [["was", "For something that isn't true, use the subjunctive were."], ["taller", "Put a comma after the if clause."]], "Use were in if-clauses about things that are not true."),
  b(G8, "L.8.1", "Active and passive voice", "Make it active: The ball was kicked by Ana.", "Ana kicked the ball.",
    [["was", "Active voice has no was … by. The doer comes first."], ["by", "Active voice has no was … by. The doer comes first."]], "In active voice the subject does the action."),
  b(G8, "L.8.1", "Gerunds", "Fix it: Swim is my favorite sport.", "Swimming is my favorite sport.",
    [["Swim", "As a subject, use the gerund swimming."], ["are", "Swimming is one activity, so use is."]], "A gerund is a verb + -ing used as a noun."),
  b(G78, "L.8.1", "Infinitives", "Fix it: We hope winning the cup.", "We hope to win the cup.",
    [["winning", "After hope, use the infinitive to win."], ["won", "After to, use the plain verb win."]], "An infinitive is to + a verb."),
  b(G8, "L.8.1", "Shifts in mood", "Fix the shift: Open the box and you should read it.", "Open the box and read it.",
    [["you should", "Stay in the imperative mood: Open … and read."], ["reading", "Stay in the imperative: Open … and read."]], "Don't shift from a command to a suggestion in one sentence."),
  // ------------------------------------------------------------------ 9-12
  b(HS1, "L.9-10.1", "Parallel structure", "Make it parallel: She likes hiking, biking, and to swim.", "She likes hiking, biking, and swimming.",
    [["to swim.", "Keep the list parallel: hiking, biking, swimming."], ["swims.", "Keep the list parallel: all -ing words."]], "Items in a list should have the same form."),
  b(HS1, "L.9-10.2", "Semicolons", "Fix the comma splice: Ana studied hard, she passed.", "Ana studied hard; she passed.",
    [["hard,", "A comma alone can't join two sentences. Use a semicolon."], ["She", "After a semicolon, don't use a capital letter."]], "A semicolon joins two closely related independent clauses."),
  b(HS1, "L.9-10.2", "Colons", "Add the colon: Bring three things pens, paper, and tape.", "Bring three things: pens, paper, and tape.",
    [["things;", "Use a colon, not a semicolon, to introduce a list."], ["things", "Use a colon after a complete sentence to introduce a list."]], "A colon introduces a list after a complete sentence."),
  b(HS, "L.9-10.2", "Semicolons with conjunctive adverbs", "Fix it: It rained, however we played.", "It rained; however, we played.",
    [["rained,", "However can't join two sentences with just a comma. Use a semicolon."], ["however", "Put a comma after however."]], "Use a semicolon before however and a comma after it."),
  b(HS1, "L.9-10.1", "Parallel structure", "Make it parallel: He is smart, kind, and a joker.", "He is smart, kind, and funny.",
    [["a joker.", "Keep the list parallel: three adjectives, not a noun."], ["funnily.", "He is … needs adjectives: funny."]], "Parallel lists match: smart, kind, funny."),
  b(HS1, "L.9-10.1", "Subject-verb agreement", "Fix it: The book that I lent you are overdue.", "The book that I lent you is overdue.",
    [["are", "The subject is book (singular), so use is."], ["lended", "The past tense of lend is lent."]], "Find the true subject, even when a clause comes between it and the verb."),
  b(HS2, "L.11-12.1", "Subject-verb agreement", "Fix it: The list of items are long.", "The list of items is long.",
    [["are", "The subject is list, not items, so use is."], ["lists", "The sentence is about one list."]], "The verb agrees with the subject, not with a noun in a prepositional phrase."),
  b(HS2, "L.11-12.1", "Who and whom", "Fix it: To who should I write?", "To whom should I write?",
    [["who", "After a preposition, use the object form whom."], ["write.", "It asks something, so end with a question mark."]], "Whom is the object form: to whom, for whom."),
  b(HS2, "L.11-12.2", "Hyphens", "Hyphenate: She is a well known author.", "She is a well-known author.",
    [["well known", "Hyphenate a compound adjective that comes before a noun."], ["an", "Use a before a consonant sound: a well-known author."]], "Compound adjectives before a noun are hyphenated."),
  b(HS2, "L.11-12.1", "Agreement with neither/nor", "Fix it: Neither Kai nor his friends was late.", "Neither Kai nor his friends were late.",
    [["was", "With neither … nor, the verb agrees with the nearer subject: friends were."], ["or", "Neither goes with nor."]], "With or/nor, the verb agrees with the closer subject."),
  b(HS, "L.11-12.1", "Indefinite pronoun agreement", "Fix it: Each of the boys have a bike.", "Each of the boys has a bike.",
    [["have", "Each is singular, so use has."], ["boy", "Each of the takes a plural noun: boys."]], "Each, every and either are singular."),
  b(HS2, "L.11-12.1", "Parallel correlatives", "Fix it: She is not only smart and also kind.", "She is not only smart but also kind.",
    [["and", "Not only pairs with but also."], ["kindly.", "Is needs an adjective: kind."]], "Not only … but also is a matched pair."),
  b(HS, "L.11-12.1", "Lie and lay", "Fix it: I will lay down now.", "I will lie down now.",
    [["lay", "Lie means to recline. Lay needs an object (lay the book down)."], ["laid", "Laid is the past of lay, which needs an object."]], "People lie down; they lay things down."),
  b(HS1, "L.9-10.1", "Fewer and less", "Fix it: We had less delays today.", "We had fewer delays today.",
    [["less", "Use fewer for things you can count, like delays."], ["lesser", "Use fewer for things you can count."]], "Fewer for countable things, less for amounts."),
  b(HS2, "L.11-12.1", "Affect and effect", "Fix it: Rain will effect our game.", "Rain will affect our game.",
    [["effect", "Affect is usually the verb; effect is usually the noun."], ["affects", "After will, use the plain verb affect."]], "To affect something is to change it; the effect is the result."),
];

/* ------------------------------------------------------------------------------------------ */

let m = 0;
function r(
  grades: Grade[], standard: string, skill: string, target: string, prompt: string,
  yes: string[], no: string[], yesWhy: string, noWhy: string, notes?: Record<string, string>,
): CategoryRule {
  m++;
  return { id: `e-r${m}`, subject: "ela", grades, standard, skill, target, prompt, yes, no, yesWhy, noWhy, notes };
}

export const ELA_RULES: CategoryRule[] = [
  // ------------------------------------------------------------------ K-2
  r(K1, "L.K.1", "Nouns", "NAMING WORDS", "Color the NAMING words (nouns): people, animals, places and things.",
    ["dog", "cat", "ball", "hat", "cup", "bed", "sun", "bus", "tree", "frog", "mom"],
    ["see/action word", "go/action word", "sit/action word", "eat/action word", "big/describing word", "red/describing word", "sad/describing word", "hot/describing word", "tall/describing word"],
    "{x} names a thing, so it is a noun.", "{x} is {ak}, not a naming word."),
  r(K1, "L.K.1", "Verbs", "ACTION WORDS", "Color the ACTION words (verbs).",
    ["run", "hop", "sit", "eat", "swim", "sing", "clap", "dig", "read", "kick"],
    ["cat/naming word", "dog/naming word", "hat/naming word", "bed/naming word", "cup/naming word", "red/describing word", "big/describing word", "sun/naming word", "box/naming word"],
    "{x} is something you can do, so it is a verb.", "{x} is {ak}, not an action."),
  r(K1, "L.K.1", "Plural nouns", "MORE THAN ONE", "Color the words that mean MORE THAN ONE.",
    ["cats", "dogs", "hats", "cups", "bugs", "pigs", "beds", "boxes", "foxes", "buses"],
    ["cat", "dog", "hat", "cup", "bug", "pig", "bed", "box", "fox"],
    "{x} ends in -s or -es, so it means more than one.", "{x} means just one."),
  r(G12, "L.1.1", "Adjectives", "DESCRIBING WORDS", "Color the DESCRIBING words (adjectives).",
    ["big", "red", "soft", "tall", "sad", "happy", "cold", "wet", "tiny", "green"],
    ["dog/naming word", "run/action word", "sit/action word", "cup/naming word", "hop/action word", "bed/naming word", "eat/action word", "tree/naming word", "sing/action word"],
    "{x} describes what something is like.", "{x} is {ak}, not a describing word."),
  r(G12, "L.1.1", "Question words", "QUESTION WORDS", "Color the words that start QUESTIONS.",
    ["who", "what", "where", "when", "why", "how", "which", "whose"],
    ["the", "and", "dog", "big", "run", "into", "see", "happy", "then"],
    "{x} is a question word, like in \"{x} is it?\"", "{x} is not a question word."),
  r(G2, "L.2.1", "Past tense verbs", "PAST TENSE", "Color the PAST-TENSE verbs: things that already happened.",
    ["jumped", "played", "ran", "ate", "sat", "swam", "sang", "looked", "hopped", "wrote"],
    ["jumps", "plays", "runs", "eats", "sits", "swims", "sings", "looks", "hops", "writes"],
    "{x} is past tense: it already happened.", "{x} is present tense: it is happening now."),
  r(G2, "L.2.1", "Adverbs", "HOW WORDS", "Color the ADVERBS that tell HOW something is done.",
    ["quickly", "slowly", "softly", "loudly", "gladly", "sadly", "neatly", "gently", "badly"],
    ["quick", "slow", "soft", "loud", "glad", "sad", "neat", "gentle", "bad"],
    "{x} tells how something is done. Many adverbs end in -ly.", "{x} is an adjective. It describes a noun, not how something is done."),
  r(G2, "L.2.2", "Contractions", "CONTRACTIONS", "Color the CONTRACTIONS: two words squeezed into one with an apostrophe.",
    ["can't", "don't", "I'm", "it's", "we're", "isn't", "he's", "didn't"],
    ["do not", "I am", "it is", "we are", "is not", "he is", "did not", "can not"],
    "{x} is a contraction: the apostrophe stands for missing letters.", "{x} is two whole words, not a contraction."),
  r(G2, "L.2.1", "Collective nouns", "GROUP WORDS", "Color the COLLECTIVE nouns: words for a group.",
    ["team", "class", "flock", "herd", "crowd", "family", "pack", "band"],
    ["player", "student", "bird", "cow", "person", "wolf", "singer", "tiger"],
    "{x} names a whole group.", "{x} names one member, not a group."),
  // ------------------------------------------------------------------ 3-5
  r(G3, "L.3.1", "Abstract nouns", "ABSTRACT NOUNS", "Color the ABSTRACT nouns: ideas and feelings you can't touch.",
    ["joy", "courage", "honesty", "freedom", "kindness", "bravery", "friendship", "anger", "childhood"],
    ["desk", "apple", "rock", "puppy", "shoe", "river", "pencil", "chair", "window"],
    "{x} is an idea or feeling, so it is an abstract noun.", "{x} is something you can see and touch, so it is a concrete noun."),
  r(G34, "L.3.1", "Adjectives", "ADJECTIVES", "Color the ADJECTIVES: words that describe nouns.",
    ["happy", "shiny", "tiny", "noisy", "fluffy", "gentle", "hungry", "sleepy", "brave"],
    ["quickly/adverb", "jumped/verb", "river/noun", "sang/verb", "slowly/adverb", "pencil/noun", "under/preposition", "they/pronoun", "wrote/verb"],
    "{x} describes a noun, so it is an adjective.", "{x} is {ak}, not an adjective."),
  r(G34, "L.3.1", "Verbs", "VERBS", "Color the VERBS: action words.",
    ["climbed", "carried", "shouted", "explored", "painted", "laughed", "grabbed", "splashed"],
    ["ladder/noun", "happy/adjective", "slowly/adverb", "under/preposition", "bright/adjective", "garden/noun", "they/pronoun", "quietly/adverb"],
    "{x} is an action, so it is a verb.", "{x} is {ak}, not a verb."),
  r(G3, "L.3.1", "Comparative adjectives", "COMPARE TWO", "Color the adjectives that COMPARE TWO things.",
    ["taller", "faster", "happier", "bigger", "smaller", "colder", "better", "worse", "more fun"],
    ["tallest", "fastest", "happiest", "biggest", "smallest", "coldest", "best", "worst", "most fun"],
    "{x} compares two things.", "{x} compares three or more things (a superlative)."),
  r(G45, "L.4.1", "Prepositions", "PREPOSITIONS", "Color the PREPOSITIONS: words that show where or when.",
    ["under", "over", "behind", "beside", "between", "through", "across", "during", "above"],
    ["quickly/adverb", "happy/adjective", "jumped/verb", "table/noun", "they/pronoun", "and/conjunction", "because/conjunction", "slowly/adverb", "green/adjective"],
    "{x} is a preposition: it shows position or time.", "{x} is {ak}, not a preposition."),
  r(G4, "L.4.1", "Modal auxiliaries", "HELPING MODALS", "Color the MODAL helping verbs (can, must...).",
    ["can", "could", "may", "might", "must", "shall", "should", "will", "would"],
    ["eat", "jumped", "tried", "ran", "sleep", "walk", "said", "grew", "thought"],
    "{x} is a modal: it helps another verb (I {x} go).", "{x} is a main verb that shows action, not a modal."),
  r(G5, "L.5.1", "Conjunctions", "CONJUNCTIONS", "Color the CONJUNCTIONS: words that join ideas.",
    ["and", "but", "or", "so", "yet", "because", "although", "unless", "nor"],
    ["under/preposition", "quickly/adverb", "happy/adjective", "table/noun", "jumped/verb", "them/pronoun", "across/preposition", "slowly/adverb"],
    "{x} is a conjunction: it joins words or ideas.", "{x} is {ak}, not a conjunction."),
  r(G5, "L.5.1", "Interjections", "INTERJECTIONS", "Color the INTERJECTIONS: words that burst out with feeling.",
    ["wow", "oops", "ouch", "hooray", "yikes", "whoa", "phew", "uh-oh"],
    ["window/noun", "quickly/adverb", "jumped/verb", "happy/adjective", "under/preposition", "and/conjunction", "they/pronoun", "bright/adjective"],
    "{x} is an interjection: it shows sudden feeling.", "{x} is {ak}, not an interjection."),
  r(G5, "L.5.1", "Perfect verb tenses", "PERFECT TENSE", "Color the PERFECT-tense verbs (has, have or had + past participle).",
    ["has eaten", "had gone", "have sung", "had flown", "has grown", "have seen", "had drawn", "has taken"],
    ["ate", "went", "sang", "flew", "is eating", "grows", "will see", "is drawing"],
    "{x} uses has, have or had with a past participle: perfect tense.", "{x} is not a perfect tense: it has no has/have/had + past participle."),
  // ------------------------------------------------------------------ 6-8
  r(G6, "L.6.1", "Pronouns", "PRONOUNS", "Color the PRONOUNS: words that take the place of nouns.",
    ["she", "they", "him", "it", "we", "us", "their", "myself", "them", "hers"],
    ["girl/noun", "team/noun", "quickly/adverb", "happy/adjective", "jumped/verb", "under/preposition", "and/conjunction", "Maria/proper noun"],
    "{x} is a pronoun: it stands in for a noun.", "{x} is {ak}, not a pronoun."),
  r(G67, "L.6.1", "Intensive and reflexive pronouns", "-SELF PRONOUNS", "Color the INTENSIVE/REFLEXIVE pronouns.",
    ["myself", "yourself", "himself", "herself", "itself", "ourselves", "themselves", "yourselves"],
    ["me", "him", "her", "our", "them", "they", "his", "its", "your"],
    "{x} is an intensive/reflexive pronoun (it ends in -self or -selves).", "{x} is a personal or possessive pronoun, not a -self pronoun."),
  r(G78, "L.7.1", "Subordinating conjunctions", "SUBORDINATORS", "Color the SUBORDINATING conjunctions: they start dependent clauses.",
    ["because", "although", "unless", "whenever", "whereas", "though", "if", "even if"],
    ["and/coordinating conjunction", "but/coordinating conjunction", "or/coordinating conjunction", "nor/coordinating conjunction", "yet/coordinating conjunction", "however/conjunctive adverb", "therefore/conjunctive adverb", "moreover/conjunctive adverb"],
    "{x} starts a dependent clause, so it is a subordinating conjunction.", "{x} is {ak}, not a subordinating conjunction."),
  r(G67, "L.6.1", "Prepositions", "PREPOSITIONS", "Color the PREPOSITIONS.",
    ["throughout", "despite", "toward", "beneath", "among", "within", "beyond", "against"],
    ["quickly/adverb", "although/conjunction", "beautiful/adjective", "bravely/adverb", "whenever/conjunction", "notice/verb", "therefore/conjunctive adverb", "gently/adverb"],
    "{x} is a preposition: it links a noun to the rest of the sentence.", "{x} is {ak}, not a preposition."),
  r(G8, "L.8.1", "Verbals: infinitives", "INFINITIVES", "Color the INFINITIVES (to + verb).",
    ["to run", "to eat", "to swim", "to read", "to think", "to win", "to grow", "to speak"],
    ["running", "eaten", "swam", "reads", "thought", "won", "grows", "spoke"],
    "{x} is an infinitive: to + the plain verb.", "{x} is a verb form, but not an infinitive (no to)."),
  r(G8, "L.8.1", "Active and passive voice", "PASSIVE VOICE", "Color the PASSIVE-voice verbs (a form of be + past participle).",
    ["was eaten", "is sold", "were built", "was found", "is made", "are grown", "was sent", "were told"],
    ["ate", "sold", "built", "found", "makes", "grow", "sends", "told"],
    "{x} is passive: be + past participle, so the subject receives the action.", "{x} is active voice: the subject does the action."),
  // ------------------------------------------------------------------ 9-12
  r(HS, "L.9-10.1", "Conjunctive adverbs", "CONJ. ADVERBS", "Color the CONJUNCTIVE ADVERBS (they follow a semicolon).",
    ["however", "therefore", "moreover", "meanwhile", "otherwise", "thus", "hence", "instead", "likewise", "besides"],
    ["because/subordinating conjunction", "although/subordinating conjunction", "and/coordinating conjunction", "but/coordinating conjunction", "unless/subordinating conjunction", "whereas/subordinating conjunction", "or/coordinating conjunction", "if/subordinating conjunction"],
    "{x} is a conjunctive adverb: ; {x}, …", "{x} is {ak}, not a conjunctive adverb."),
  r(HS, "L.9-10.1", "Relative pronouns", "RELATIVE PRONOUNS", "Color the RELATIVE pronouns: they start relative (adjective) clauses.",
    ["who", "whom", "whose", "which", "that", "whoever", "whomever", "whichever"],
    ["because/subordinating conjunction", "although/subordinating conjunction", "if/subordinating conjunction", "unless/subordinating conjunction", "and/coordinating conjunction", "but/coordinating conjunction", "while/subordinating conjunction", "until/subordinating conjunction"],
    "{x} is a relative pronoun: it starts a clause that describes a noun.", "{x} is {ak}, not a relative pronoun."),
  r(HS, "L.11-12.1", "Indefinite pronoun agreement", "SINGULAR", "Color the SINGULAR indefinite pronouns (they take is/has).",
    ["each", "everyone", "anybody", "someone", "nobody", "either", "neither", "everybody", "anyone"],
    ["both", "few", "many", "several", "others", "these", "those", "they"],
    "{x} is singular: {x} is … / {x} has …", "{x} is plural: it takes are/have."),
  r(HS2, "L.11-12.1", "Latin plurals", "LATIN PLURALS", "Color the PLURAL forms of Latin and Greek nouns.",
    ["data", "criteria", "phenomena", "alumni", "cacti", "fungi", "analyses", "theses", "crises", "nuclei"],
    ["datum", "criterion", "phenomenon", "alumnus", "cactus", "fungus", "analysis", "thesis", "crisis", "nucleus"],
    "{x} is a plural (Latin or Greek form).", "{x} is singular; its plural changes the ending."),
];
