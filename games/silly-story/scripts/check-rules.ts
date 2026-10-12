/*
 * Checks Silly Story Studio's stories, word cards, pictures, grammar coach and safety filter:
 *   npm test   (tsx scripts/check-rules.ts)
 *
 * Stories    every built-in story parses, has 6-12 valid blanks, a grade band, a background, uses only
 *            blank types for its band, has no rude words, fills cleanly (articles, capitals) and puts
 *            at least two characters in its picture.
 * Cards      every card word's part of speech (from the built-in dictionary) matches its category;
 *            dealt hands have three cards that fit and at most one that doesn't (and that one really
 *            is a different part of speech).
 * Pictures   every sprite referenced exists and draws; sprite words don't clash; adjective cards have a
 *            visual modifier and verb cards an animation; scenes show the chosen modifiers.
 * Coach      morphology (-s/-es, -ed, -ing, -ly, -er/-est and irregulars) and the coach's hints.
 * Safety     the filter catches a test list (incl. look-alike letters and stretched/spaced letters) and
 *            doesn't flag normal words (class, grass, assassin, Scunthorpe…); input is limited.
 * Writing    Write-your-own template parsing: friendly names, errors, {a}/an, plurals, capitals.
 */
import { GRADES } from "../src/kit/grades";
import type { Grade } from "../src/kit/types";
import { BGS, bgById } from "../src/art/bgs";
import { ANIM_IDS, adjectiveEffect, adverbEffect, COLOR_HEX, verbAnim } from "../src/art/mods";
import { rasterize } from "../src/art/raster";
import { buildScene, MAX_COPIES } from "../src/art/scene";
import { SPRITES, spriteById, spriteForWord } from "../src/art/sprites";
import {
  ADJ_CARDS, ADVERB_CARDS, allCards, CAT_TAG, cardFits, COLOR_CARDS, dealCards, NUMBER_CARDS, rngFrom, VERB_CARDS, wrongCardMessage,
} from "../src/story/cards";
import {
  adverbOf, classify, coach, comparative, fits, ingForm, numberValue, pastTense, pluralize, superlative,
} from "../src/story/grammar";
import { bandOf, promptFor, standardFor } from "../src/story/prompts";
import { cleanText, cleanWord, ENCODED, isRude, rot13, sanitizeInput, SWAP_WORD } from "../src/story/safety";
import { STORIES } from "../src/story/stories";
import { fill, filledText, linkCast, parseTemplate } from "../src/story/template";
import { BANDS, BLANK_TYPES, type Band, type BlankType } from "../src/story/types";
import { SIMILES, VOCAB } from "../src/story/vocab";

let failures = 0;
let checks = 0;
function check(cond: boolean, msg: () => string) {
  checks++;
  if (!cond) {
    failures++;
    if (failures <= 400) console.error("FAIL:", msg());
  }
}
const eq = <T>(got: T, want: T, what: string) => check(got === want, () => `${what}: got ${JSON.stringify(got)}, want ${JSON.stringify(want)}`);

/* ------------------------------------------------------------------ stories */

const ALLOWED: Record<Band, BlankType[]> = {
  "K-2": ["noun", "verb", "adjective", "color", "number"],
  "3-5": ["noun", "verb", "adjective", "color", "number", "plural-noun", "verb-past", "verb-ing", "adverb"],
  "6-8": ["noun", "verb", "adjective", "color", "number", "plural-noun", "verb-past", "verb-ing", "adverb", "pronoun-subject", "pronoun-object", "preposition", "comparative", "superlative", "sound"],
  "9-12": [...BLANK_TYPES],
};

/** A sample word that fits each blank type (used to fill stories in tests). */
const SAMPLE: Record<BlankType, string> = {
  noun: "elephant", "plural-noun": "tacos", verb: "dance", "verb-past": "jumped", "verb-ing": "spinning", adjective: "giant", color: "purple",
  number: "three", adverb: "quickly", "pronoun-subject": "she", "pronoun-object": "them", preposition: "under", comparative: "bigger",
  superlative: "silliest", sound: "boing", simile: "like a rocket", vocab: "",
};

check(STORIES.length >= 12, () => `need at least 12 stories, have ${STORIES.length}`);
eq(new Set(STORIES.map((s) => s.id)).size, STORIES.length, "story ids unique");
for (const b of BANDS) check(STORIES.filter((s) => s.band === b).length >= 3, () => `band ${b} needs at least 3 stories`);

for (const s of STORIES) {
  const p = parseTemplate(s.template);
  const where = `story ${s.id}`;
  check(p.errors.length === 0, () => `${where} parse errors: ${p.errors.join("; ")}`);
  check(p.blanks.length >= 6 && p.blanks.length <= 12, () => `${where} has ${p.blanks.length} blanks (6-12)`);
  check((BANDS as string[]).includes(s.band), () => `${where} band ${s.band}`);
  check(BGS.some((b) => b.id === s.bg), () => `${where} unknown background ${s.bg}`);
  check(s.title.length > 0 && s.blurb.length > 0, () => `${where} needs a title and blurb`);
  check(!/mad ?libs?/i.test(s.title + s.template + s.blurb), () => `${where} mentions a trademark`);
  for (const b of p.blanks) check(ALLOWED[s.band].includes(b.type), () => `${where} blank ${b.id} type ${b.type} isn't for band ${s.band}`);
  // Rude-word scan of the story's own text.
  const plain = s.template.replace(/\[[^\]]*\]|\{a\}|\{A\}/g, " ");
  for (const tok of plain.split(/[^A-Za-z'-]+/).filter(Boolean)) check(!isRude(tok), () => `${where} has a flagged word “${tok}”`);
  check(!isRude(s.title) && !isRude(s.blurb), () => `${where} title/blurb flagged`);
  // Cast references.
  const ids = new Set(p.blanks.map((b) => b.id));
  for (const c of s.cast ?? []) {
    if (c.sprite) check(!!spriteById(c.sprite), () => `${where} cast sprite ${c.sprite} missing`);
    for (const id of [c.noun, c.verb, c.adverb, c.count, ...(c.adj ?? [])]) if (id) check(ids.has(id), () => `${where} cast refers to unknown blank ${id}`);
    if (c.anim) check((ANIM_IDS as string[]).includes(c.anim), () => `${where} cast anim ${c.anim} unknown`);
  }
  // Fill it in with sample words.
  const words = p.blanks.map((b) => (b.type === "vocab" ? VOCAB[b.hint!].words[0] : SAMPLE[b.type]));
  const text = filledText(p, words);
  check(!/[\[\]{}]/.test(text), () => `${where} filled text still has markup: ${text.slice(0, 80)}`);
  check(!/\ba [aeiou]/i.test(text.replace(/\ba (one|uni|use)/gi, "")), () => `${where} has "a" before a vowel: ${text.match(/\ba [aeiou]\w*/i)?.[0]}`);
  check(!/\ban [^aeiou\s]/i.test(text), () => `${where} has "an" before a consonant: ${text.match(/\ban [^aeiou\s]\w*/i)?.[0]}`);
  check(!/[.!?]\s+[a-z]/.test(text.replace(/\b(Mr|Ms|Mrs|Dr)\. /g, "")), () => `${where} sentence starts lowercase: ${text.match(/[.!?]\s+[a-z]\w*/)?.[0]}`);
  // Prompts for every blank at the band's grades.
  for (const g of GRADES.filter((g) => bandOf(g) === s.band)) {
    for (const b of p.blanks) {
      const info = promptFor(b, g);
      check(info.sentence.length > 10 && !/undefined|NaN/.test(info.sentence), () => `${where} prompt for ${b.id} at ${g}: ${info.sentence}`);
      check(/^L\.(K|\d{1,2}|9-10|11-12)\.\d[a-z]?$/.test(info.standard), () => `${where} ${b.type} at ${g} standard ${info.standard}`);
    }
  }
  // The picture: at least two characters, and every blank in the legend.
  const scene = buildScene(p, words, s.bg, s.cast);
  check(scene.actors.length >= 2, () => `${where} scene has ${scene.actors.length} characters`);
  eq(scene.legend.length, p.blanks.length, `${where} legend covers every blank`);
  for (const a of scene.actors) check(a.x > 0 && a.x < 320 && a.y > 0 && a.y <= 200, () => `${where} actor ${a.word} off screen at ${a.x},${a.y}`);
  // Every story's blanks get a 4-card hand with 3 fits and at most 1 miss.
  for (const b of p.blanks) {
    for (let seed = 1; seed <= 6; seed++) {
      const hand = dealCards(b, rngFrom(seed * 31 + b.index));
      const good = hand.filter((c) => cardFits(c, b));
      const bad = hand.filter((c) => !cardFits(c, b));
      check(good.length === 3, () => `${where} ${b.id} (${b.type}) hand has ${good.length} fitting cards`);
      check(bad.length <= 1, () => `${where} ${b.id} hand has ${bad.length} misfits`);
      check(new Set(hand.map((c) => c.word)).size === hand.length, () => `${where} ${b.id} hand repeats a word`);
      for (const c of bad) {
        const tags = classify(c.word);
        check(b.type === "vocab" || (b.type === "simile" ? !/^(like|as) /.test(c.word) : !fits(tags, b.type)), () => `${where} ${b.id} "wrong" card ${c.word} actually fits ${b.type}`);
        const msg = wrongCardMessage(c, b, s.band === "K-2" ? "1" : "4");
        check(msg.length > 20 && !/undefined/.test(msg), () => `${where} wrong-card message: ${msg}`);
      }
    }
  }
}

/* ------------------------------------------------------------------ cards */

const deck = allCards();
for (const [cat, cards] of deck) {
  check(cards.length >= 4, () => `card category ${cat} has ${cards.length} cards`);
  for (const c of cards) {
    const tags = classify(c.word);
    if (cat === "vocab") {
      const v = VOCAB[c.vocab!];
      check(fits(tags, v.pos), () => `vocab card “${c.word}” (${c.vocab}) should be a ${v.pos}; dictionary says ${[...tags].join(",")}`);
    } else if (cat === "simile") {
      check(/^(like|as) /.test(c.word), () => `simile card “${c.word}”`);
    } else {
      const want = CAT_TAG[cat]!;
      check(tags.has(want), () => `${cat} card “${c.word}” isn't a ${want} in the dictionary (${[...tags].join(",") || "unknown"})`);
    }
    if (c.pic.kind === "sprite") check(!!spriteById(c.pic.sprite), () => `card ${c.word} sprite ${c.pic.kind === "sprite" ? c.pic.sprite : ""} missing`);
  }
}
for (const w of VERB_CARDS) check(!!verbAnim(w), () => `verb card “${w}” has no animation`);
for (const w of VERB_CARDS) check(!!verbAnim(pastTense(w)) && !!verbAnim(ingForm(w)), () => `verb card “${w}” past/-ing forms lose the animation`);
for (const w of ADJ_CARDS) check(!!adjectiveEffect(w), () => `adjective card “${w}” has no visual modifier`);
for (const w of COLOR_CARDS) check(!!COLOR_HEX[w] || w === "rainbow", () => `color card “${w}” has no color`);
for (const w of ADVERB_CARDS) check(!!adverbEffect(w), () => `adverb card “${w}” has no effect`);
for (const [w, n] of NUMBER_CARDS) eq(numberValue(w), n, `number card ${w}`);
for (const [id, v] of Object.entries(VOCAB)) {
  check(v.words.length >= 4, () => `vocab ${id} needs 4+ words`);
  for (const w of [...v.words, v.plain]) check(fits(classify(w), v.pos), () => `vocab ${id} word “${w}” isn't a ${v.pos} in the dictionary`);
}
for (const [id, s] of Object.entries(SIMILES)) check(s.examples.length >= 3, () => `simile topic ${id} needs examples`);

/* ------------------------------------------------------------------ pictures */

eq(new Set(SPRITES.map((s) => s.id)).size, SPRITES.length, "sprite ids unique");
check(SPRITES.length >= 80, () => `need ~80 sprites, have ${SPRITES.length}`);
const wordOwner = new Map<string, string>();
for (const s of SPRITES) {
  const r = rasterize(s);
  check(r.filled >= 25, () => `sprite ${s.id} draws only ${r.filled} pixels`);
  const recol = rasterize(s, { color: "#123456" });
  check(JSON.stringify(recol.px) !== JSON.stringify(r.px) || !s.ops.some((o) => o[1] === "M"), () => `sprite ${s.id} doesn't recolor`);
  for (const w of s.words) {
    check(!wordOwner.has(w), () => `word “${w}” draws both ${wordOwner.get(w)} and ${s.id}`);
    wordOwner.set(w, s.id);
    if (!s.hidden) check(classify(w).has("noun") || classify(w.split(" ").pop()!).has("noun"), () => `sprite word “${w}” (${s.id}) isn't a noun in the dictionary`);
  }
}
for (const s of STORIES) bgById(s.bg);
eq(spriteForWord("Hot Dog")?.id, "hotdog", "sprite lookup: phrase");
eq(spriteForWord("giant pizza")?.id, "pizza", "sprite lookup: last word");

// Modifiers and animations show up in the scene.
{
  const p = parseTemplate("{A} [adjective@a1] [color@a2] [noun@n1] liked to [verb@v1] [adverb@d1]. Then [number@c1] [adjective@a3] [plural-noun@n2] began to [verb@v2]. A [noun@n3] watched.");
  eq(p.errors.length, 0, "scene test parses");
  const { links } = linkCast(p);
  eq(links.length, 3, "three characters linked");
  eq(JSON.stringify(links[0].adjs), "[0,1]", "describing words attach to the noun after them");
  eq(links[0].verb, 3, "verb attaches to the noun before it");
  eq(links[0].adverb, 4, "adverb attaches to its verb");
  eq(links[1].count, 5, "number attaches to its noun");
  const scene = buildScene(p, ["giant", "purple", "elephant", "dance", "quickly", "12", "upside-down", "tacos", "sleep", "flibbertigibbet"], "zoo");
  const [el, tacos, box] = scene.actors;
  eq(el.sprite.id, "elephant", "noun → sprite");
  eq(el.color, COLOR_HEX.purple, "color word recolors");
  eq(el.scale > 1.2, true, "giant scales up");
  eq(el.anim, "dance", "verb → animation");
  eq(el.speed > 1, true, "quickly speeds it up");
  eq(tacos.sprite.id, "taco", "plural noun → sprite (singular)");
  eq(tacos.count, MAX_COPIES, "numbers make copies, capped");
  eq(tacos.more, 12, "big numbers show ×N");
  eq(tacos.flipY, true, "upside-down flips");
  eq(tacos.anim, "sleep", "sleep animation");
  eq(box.sprite.id, "mystery", "unknown word → mystery box");
  eq(box.mystery, "flibbertigibbet", "mystery box shows the word");
  const s2 = buildScene(parseTemplate("The [adjective] [adjective] [adjective] [noun] began [verb-ing]."), ["fuzzy", "sparkly", "invisible", "cat", "flying"], "park");
  const cat = s2.actors[0];
  eq(cat.fuzzy && cat.particles.includes("sparkle") && cat.alpha < 0.5 && cat.anim === "fly" && cat.air, true, "fuzzy + sparkly + invisible + flying");
  const s3 = buildScene(parseTemplate("{A} [adjective] [noun] [verb-past]."), ["striped", "dragon", "swam"], "ocean");
  eq(s3.actors[0].striped && s3.actors[0].anim === "swim", true, "striped + swam");
  const s4 = buildScene(parseTemplate("{A} [comparative] [noun] and the [superlative] [noun] [verb-past]."), ["fuzzier", "dog", "biggest", "cat", "sang"], "park");
  eq(s4.actors[0].fuzzy, true, "comparative maps back to its base (fuzzier → fuzzy)");
  eq(s4.actors[1].scale >= 2, true, "superlative size (biggest)");
  for (const w of ["spotted", "shiny", "spicy", "frozen", "stinky", "happy", "sleepy", "cool", "fancy", "royal", "wobbly", "tiny"]) check(!!adjectiveEffect(w), () => `modifier for ${w}`);
  for (const w of ["danced", "spinning", "jumps", "slept", "wobbled", "flew", "ran", "swimming", "sang", "ate", "giggled", "sneezed"]) check(!!verbAnim(w), () => `animation for ${w}`);
}

/* ------------------------------------------------------------------ grammar coach morphology */

const pl: [string, string][] = [["cat", "cats"], ["bus", "buses"], ["puppy", "puppies"], ["mouse", "mice"], ["sheep", "sheep"], ["leaf", "leaves"], ["box", "boxes"], ["potato", "potatoes"], ["toy", "toys"], ["hot dog", "hot dogs"], ["child", "children"], ["dish", "dishes"]];
for (const [a, b] of pl) eq(pluralize(a), b, `pluralize ${a}`);
const pt: [string, string][] = [["jump", "jumped"], ["dance", "danced"], ["hop", "hopped"], ["cry", "cried"], ["swim", "swam"], ["run", "ran"], ["eat", "ate"], ["fly", "flew"], ["play", "played"], ["sing", "sang"], ["stop", "stopped"], ["wobble", "wobbled"], ["sleep", "slept"]];
for (const [a, b] of pt) eq(pastTense(a), b, `past tense ${a}`);
const ig: [string, string][] = [["run", "running"], ["dance", "dancing"], ["lie", "lying"], ["swim", "swimming"], ["play", "playing"], ["see", "seeing"], ["jump", "jumping"]];
for (const [a, b] of ig) eq(ingForm(a), b, `-ing ${a}`);
const ly: [string, string][] = [["quick", "quickly"], ["happy", "happily"], ["gentle", "gently"], ["magic", "magically"], ["loud", "loudly"], ["good", "well"], ["full", "fully"]];
for (const [a, b] of ly) eq(adverbOf(a), b, `adverb ${a}`);
const cmp: [string, string, string][] = [["big", "bigger", "biggest"], ["silly", "sillier", "silliest"], ["nice", "nicer", "nicest"], ["good", "better", "best"], ["sparkly", "sparklier", "sparkliest"], ["beautiful", "more beautiful", "most beautiful"], ["fast", "faster", "fastest"], ["bad", "worse", "worst"]];
for (const [a, c, s] of cmp) {
  eq(comparative(a), c, `comparative ${a}`);
  eq(superlative(a), s, `superlative ${a}`);
}
const tagCases: [string, string][] = [
  ["tacos", "plural"], ["jumped", "past"], ["quickly", "adv"], ["biggest", "sup"], ["mice", "plural"], ["ran", "past"], ["happier", "comp"],
  ["dancing", "ing"], ["hopped", "past"], ["cried", "past"], ["she", "pron-subj"], ["him", "pron-obj"], ["under", "prep"], ["seven", "num"],
  ["42", "num"], ["purple", "color"], ["elephant", "noun"], ["wiggle", "verb"], ["fuzzy", "adj"], ["boing", "sound"], ["more fuzzy", "comp"],
  ["most sparkly", "sup"], ["hot dog", "noun"], ["puppies", "plural"], ["families", "plural"], ["gently", "adv"], ["happily", "adv"],
  ["stopped", "past"], ["swimming", "ing"], ["fuzzier", "comp"], ["tiniest", "sup"], ["better", "comp"], ["children", "plural"],
];
for (const [w, t] of tagCases) check(classify(w).has(t as never), () => `classify “${w}” should include ${t} (got ${[...classify(w)].join(",")})`);
const notCases: [string, string][] = [["class", "plural"], ["grass", "plural"], ["teacher", "comp"], ["flower", "comp"], ["silly", "adv"], ["butterfly", "adv"], ["sing", "ing"], ["forest", "sup"], ["red", "past"]];
for (const [w, t] of notCases) check(!classify(w).has(t as never), () => `classify “${w}” should NOT include ${t}`);

const ok = (w: string, t: BlankType, hint?: string) => check(coach(w, t, hint).verdict === "ok", () => `coach: “${w}” should fit ${t}${hint ? `:${hint}` : ""} (${coach(w, t, hint).message})`);
const hint = (w: string, t: BlankType, sug?: string, h?: string) => {
  const r = coach(w, t, h);
  check(r.verdict === "hint" && !!r.message, () => `coach: “${w}” for ${t} should get a hint (got ${r.verdict})`);
  if (sug !== undefined) eq(r.suggestion, sug, `coach suggestion for “${w}” as ${t}`);
};
ok("taco", "noun"); ok("tacos", "plural-noun"); ok("jumped", "verb-past"); ok("swam", "verb-past"); ok("wiggle", "verb"); ok("fuzzy", "adjective");
ok("purple", "adjective"); ok("purple", "color"); ok("12", "number"); ok("a zillion", "number"); ok("loudly", "adverb"); ok("they", "pronoun-subject");
ok("us", "pronoun-object"); ok("behind", "preposition"); ok("sillier", "comparative"); ok("more sparkly", "comparative"); ok("biggest", "superlative");
ok("kersplat", "sound"); ok("like a soggy noodle", "simile"); ok("ambled", "vocab", "walk-slow"); ok("dancing", "verb-ing"); ok("hot dog", "noun");
hint("quickly", "noun"); hint("taco", "plural-noun", "tacos"); hint("jump", "verb-past", "jumped"); hint("jumping", "verb-past", "jumped");
hint("happy", "adverb", "happily"); hint("him", "pronoun-subject", "he"); hint("she", "pronoun-object", "her"); hint("big", "comparative", "bigger");
hint("bigger", "superlative", "biggest"); hint("rocket", "simile", "like a rocket"); hint("walked", "vocab", undefined, "walk-slow"); hint("fuzzy", "color");
hint("jumped", "verb", "jump"); hint("dance", "verb-ing", "dancing"); hint("elephant", "adjective"); hint("quickly", "adjective", "quick");
hint("castle", "verb"); hint("purple", "number"); hint("taco", "preposition");
eq(coach("flibbertigibbet", "noun").verdict, "unknown", "unknown words are accepted");
eq(coach("ambled", "vocab", "walk-slow").precise, true, "precise vocabulary is praised");
eq(numberValue("twenty two"), 22, "number words");
eq(numberValue("a dozen"), 12, "a dozen");

/* ------------------------------------------------------------------ standards */

for (const g of GRADES as Grade[]) for (const t of BLANK_TYPES) {
  const s = standardFor(t, g);
  check(/^L\.(K|\d{1,2}|9-10|11-12)\.\d[a-z]?$/.test(s.code), () => `standard for ${t} at ${g}: ${s.code}`);
  check(s.skill.length > 3, () => `skill name for ${t}`);
}
eq(standardFor("noun", "K").code, "L.K.1b", "K nouns");
eq(standardFor("adjective", "1").code, "L.1.1f", "grade 1 adjectives");
eq(standardFor("noun", "3").code, "L.3.1a", "grade 3 parts of speech");
eq(standardFor("pronoun-subject", "6").code, "L.6.1a", "grade 6 pronoun case");
eq(standardFor("simile", "10").code, "L.9-10.5a", "grade 10 similes");
eq(standardFor("vocab", "12").code, "L.11-12.5b", "grade 12 connotation");

/* ------------------------------------------------------------------ safety */

// Test cases are generated from the filter's own (encoded) list, so no list is written out here:
// each entry, plus look-alike letters, stretched letters, spaced letters, capitals and endings.
const blocked = ENCODED.split(" ").filter(Boolean).map((e) => rot13(e.replace(/\*$/, "")));
const LEET: Record<string, string> = { a: "4", e: "3", i: "1", o: "0", s: "$" };
for (const w of blocked) {
  check(isRude(w), () => `filter misses list entry #${blocked.indexOf(w)}`);
  check(isRude(w.toUpperCase()), () => `filter misses capitals of entry #${blocked.indexOf(w)}`);
  check(isRude(w + "s"), () => `filter misses plural of entry #${blocked.indexOf(w)}`);
  const leet = w.replace(/[aeios]/, (c) => LEET[c]);
  if (leet !== w) check(isRude(leet), () => `filter misses look-alike form of entry #${blocked.indexOf(w)}`);
  check(isRude(w[0] + w[0] + w[0] + w.slice(1)), () => `filter misses stretched form of entry #${blocked.indexOf(w)}`);
  if (w.length <= 6) check(isRude(w.split("").join(" ")), () => `filter misses spaced form of entry #${blocked.indexOf(w)}`);
  eq(cleanWord(w), SWAP_WORD, `cleanWord swaps entry #${blocked.indexOf(w)}`);
}
const t1 = cleanText(`The ${blocked[0]} cat ate a taco.`);
check(t1 === `The ${SWAP_WORD} cat ate a taco.`, () => "cleanText swaps just the flagged word");
const NORMAL = [
  "class", "grass", "assassin", "Scunthorpe", "cocktail", "Dickens", "hello", "shell", "button", "therapist", "assemble", "bass", "pass",
  "classic", "passport", "cockatoo", "peacock", "Sussex", "analysis", "shiitake", "hoe", "spice", "skill", "killer whale", "grape", "stable",
  "title", "banana", "glasses", "Essex", "scrap", "raccoon", "hello kitty", "massage", "cucumber", "document", "pitch", "witch", "shuttle",
  "hitch", "Matsushita", "as", "it", "a", "sex-free"].filter((w) => w !== "sex-free");
for (const w of NORMAL) check(!isRude(w), () => `filter wrongly flags “${w}”`);
for (const s of STORIES) for (const w of s.template.split(/[^A-Za-z]+/)) if (w) check(!isRude(w), () => `story word flagged: ${w}`);
for (const c of [...deck.values()].flat()) check(!isRude(c.word), () => `card word flagged: ${c.word}`);
eq(sanitizeInput("Hello<script>!!"), "Helloscript", "input strips symbols");
eq(sanitizeInput("abcdefghijklmnopqrstuvwxyz").length, 20, "input max 20 characters");
eq(sanitizeInput("it’s a-ok 42"), "it's a-ok 42", "input keeps letters, numbers, spaces, hyphens, apostrophes");

/* ------------------------------------------------------------------ write-your-own templates */

{
  const p = parseTemplate("My [naming word] can [action word] and is [describing word]. It [past tense verb] with [plural noun].");
  eq(p.errors.length, 0, "friendly blank names parse");
  eq(p.blanks.map((b) => b.type).join(","), "noun,verb,adjective,verb-past,plural-noun", "friendly names map to types");
  eq(parseTemplate("[animal] and [food]").blanks.map((b) => `${b.type}:${b.hint}`).join(","), "noun:animal,noun:food", "noun hints");
  check(parseTemplate("A [nounz] here").errors.length > 0, () => "unknown blank is an error");
  check(parseTemplate("A [noun here").errors.length > 0, () => "unmatched bracket is an error");
  check(parseTemplate("[@x] again").errors.length > 0, () => "undefined repeat is an error");
  check(parseTemplate("[noun@x] [verb@x]").errors.length > 0, () => "duplicate id is an error");
  check(parseTemplate("[verb+s]").errors.length > 0, () => "+s only on nouns");
  check(parseTemplate("no blanks at all").errors.length > 0, () => "a story needs a blank");
  check(parseTemplate("[noun] ".repeat(21), { maxBlanks: 20 }).errors.length > 0, () => "too many blanks");
  const r = parseTemplate("[noun@hero] met {a} [noun]. [@hero] laughed.");
  eq(filledText(r, ["dragon", "elephant"]), "Dragon met an elephant. Dragon laughed.", "repeat blank, an, capitals");
  eq(filledText(parseTemplate("I saw {a} [noun]."), ["unicorn"]), "I saw a unicorn.", "a unicorn");
  eq(filledText(parseTemplate("I saw [number] [noun+s]."), ["three", "puppy"]), "I saw three puppies.", "+s pluralizes");
  eq(filledText(parseTemplate("I saw [number] [noun+s]."), ["one", "puppy"]), "I saw one puppy.", "+s stays singular after one");
  eq(filledText(parseTemplate("\"[sound]!\" said Bo."), ["boing"]), "\"Boing!\" said Bo.", "capital after a quote");
  const pieces = fill(parseTemplate("The [adjective] cat."), ["fuzzy"]);
  eq(pieces.filter((x) => x.blank >= 0).map((x) => x.text).join(), "fuzzy", "fill marks the player's words");
  check(!/banana/.test(cleanText("A [noun] at the [adjective] zoo.")), () => "cleanText leaves blanks alone");
}

console.log(`${checks} checks, ${failures} failures`);
if (failures) process.exit(1);
