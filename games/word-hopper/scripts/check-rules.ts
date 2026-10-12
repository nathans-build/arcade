/*
 * Word Hopper checks:   npm test   (npx tsx scripts/check-rules.ts)
 * 1. Art: every sprite is a 16x16 grid of palette colours; every picture word used anywhere has a sprite.
 * 2. Word lists: Letter Match words start with their letter (and its usual sound), digraph words start with
 *    their digraph, Word Builder tiles spell the word and fit the grade's pattern (K: CVC; 1: digraphs, blends,
 *    CVCC; 2: silent e and vowel teams), rhyme families share their ending spelling and no two families sound
 *    alike, beginning / ending / short-long vowel sorts are correct, sight words have no repeats.
 * 3. Thousands of generated rounds per activity and grade: five items, right answer present exactly once,
 *    no duplicate or sound-alike wrong choices, wrong-choice hints for every wrong choice, NC standard codes
 *    allowed for the grade, nothing spoken as a lone phoneme, and enough variety that rounds don't repeat.
 * 4. Stickers: 30 different pictures, new ones until the book is full.
 */
import { MASCOT, SPRITES } from "../src/art/sprites";
import { PALETTE } from "../src/art/palette";
import {
  ACTIVITIES, ROUND_SIZE, choiceCount, makeRound, poolKeys, rhymeDistractorPool, seededRng,
  type Activity, type ChoiceItem, type Item,
} from "../src/content/items";
import {
  BEGIN_SORT, BUILD_WORDS, DIGRAPHS, DIGRAPH_WORDS, END_SORT, FIRST_LETTER_WORDS, HOMOPHONES, READ_WORDS, RHYME_FAMILIES,
  SIGHT_WORDS, SPARE_TILES, VOWELS, VOWEL_SORT, firstSoundKey, isLongVowel, isShortVowel, rimeOf, soundsAlike,
  startsWithDigraph, type Level,
} from "../src/content/words";
import { STICKERS, awardSticker, rememberKeys, type Book } from "../src/game/stickers";

let failures = 0;
let checks = 0;
function check(cond: boolean, msg: () => string) {
  checks++;
  if (!cond) {
    failures++;
    if (failures <= 60) console.error("FAIL:", msg());
  }
}

const LEVELS: Level[] = ["K", "1", "2"];
const isConsonant = (c: string) => /^[a-z]$/.test(c) && !VOWELS.has(c);

// ------------------------------------------------------------------ 1. art
for (const [name, grid] of [...Object.entries(SPRITES), ["mascot-sit", MASCOT[0]], ["mascot-hop", MASCOT[1]]] as [string, string[]][]) {
  check(grid.length === 16, () => `${name}: ${grid.length} rows, want 16`);
  grid.forEach((row, y) => {
    check(row.length === 16, () => `${name} row ${y}: ${row.length} wide, want 16`);
    for (const ch of row) check(ch === "." || !!PALETTE[ch], () => `${name} row ${y}: unknown colour "${ch}"`);
  });
  const filled = grid.join("").replace(/\./g, "").length;
  check(filled >= 30, () => `${name}: only ${filled} pixels drawn`);
}
check(Object.keys(SPRITES).length >= 40, () => `only ${Object.keys(SPRITES).length} sprites`);

const pictureWords = new Set<string>([
  ...Object.values(FIRST_LETTER_WORDS).flat(),
  ...Object.values(DIGRAPH_WORDS).flat(),
  ...Object.keys(READ_WORDS),
  ...Object.values(BUILD_WORDS).flat().map((u) => u.join("")),
  ...Object.values(RHYME_FAMILIES).flat(2),
  ...Object.values(BEGIN_SORT).flat(),
  ...Object.values(END_SORT).flat(),
  ...Object.values(VOWEL_SORT).flatMap((v) => [...v.short, ...v.long]),
  ...STICKERS,
]);
for (const w of pictureWords) check(!!SPRITES[w], () => `picture word "${w}" has no sprite`);
check(pictureWords.size >= 40, () => `only ${pictureWords.size} picture words`);
for (const w of pictureWords) check(/^[a-z]+$/.test(w), () => `"${w}" should be plain lowercase letters`);

// ------------------------------------------------------------------ 2. word lists

// Letter Match: first letters.
const VOWEL_START = new Set(["ant", "egg", "igloo", "octopus", "umbrella"]); // all short-vowel starts
for (const [l, words] of Object.entries(FIRST_LETTER_WORDS)) {
  check(words.length >= 1, () => `letter ${l} has no pictures`);
  for (const w of words) {
    check(w[0] === l, () => `${w} is listed under ${l}`);
    check(!startsWithDigraph(w), () => `${w} starts with a digraph, not the letter ${l} alone`);
    check(!/^(kn|wr|ph|gn|ps)/.test(w), () => `${w}: silent or unusual first letter`);
    if (VOWELS.has(l)) check(VOWEL_START.has(w), () => `${w}: vowel-start word not checked for a short vowel`);
    if (l === "c") check(!/^c[eiy]/.test(w), () => `${w}: soft c`);
    if (l === "g") check(!/^g[eiy]/.test(w), () => `${w}: soft g`);
  }
}
check(Object.keys(FIRST_LETTER_WORDS).length >= 20, () => "too few letters with pictures");
for (const [d, words] of Object.entries(DIGRAPH_WORDS)) {
  check(DIGRAPHS.includes(d), () => `${d} is not a digraph`);
  for (const w of words) check(w.startsWith(d), () => `${w} does not start with ${d}`);
}

// Grade 2 reading: three look-alike words, all different.
for (const [w, wrong] of Object.entries(READ_WORDS)) {
  check(new Set([w, ...wrong]).size === 4, () => `read ${w}: repeated choice ${wrong}`);
  for (const x of wrong) check(/^[a-z]+$/.test(x), () => `read ${w}: odd word "${x}"`);
  const v = [...w].find((c) => VOWELS.has(c))!;
  check(isLongVowel(w, v) || w.includes("oo"), () => `read ${w}: not a long-vowel / vowel-team word`);
}

// Word Builder.
const MULTI_UNITS = new Set(["sh", "ch", "th", "wh", "ck", "ll", "ar", "ai", "ee", "ea", "oa", "ie", "oo"]);
for (const level of LEVELS) {
  const seen = new Set<string>();
  for (const units of BUILD_WORDS[level]) {
    const w = units.join("");
    check(!seen.has(w), () => `builder ${level}: ${w} listed twice`);
    seen.add(w);
    for (const u of units) check(u.length === 1 || MULTI_UNITS.has(u), () => `builder ${w}: odd tile "${u}"`);
    for (const u of units) check(/^[a-z]+$/.test(u), () => `builder ${w}: tile "${u}"`);
    if (level === "K") {
      check(units.length === 3 && isConsonant(w[0]) && VOWELS.has(w[1]) && isConsonant(w[2]), () => `builder K: ${w} is not CVC`);
    } else if (level === "1") {
      const vowels = [...w].filter((c) => VOWELS.has(c));
      check(vowels.length === 1 && !w.endsWith("e"), () => `builder 1: ${w} should have one short vowel`);
      const hasDigraph = units.some((u) => ["sh", "ch", "th", "wh", "ck", "ll"].includes(u));
      const blend = /^[^aeiou]{2}/.test(w) || /[^aeiou]{2}$/.test(w);
      check(hasDigraph || blend, () => `builder 1: ${w} has no digraph or blend`);
      // A digraph or ck/ll must be one tile, never split.
      for (const d of ["sh", "ch", "th", "ck", "ll"]) if (w.includes(d)) check(units.includes(d), () => `builder 1: ${w} splits ${d}`);
    } else {
      const v = [...w].find((c) => VOWELS.has(c))!;
      const team = units.find((u) => ["ai", "ee", "ea", "oa", "ie", "oo"].includes(u));
      check(!!team || isLongVowel(w, v), () => `builder 2: ${w} is neither silent-e nor vowel team`);
      if (team) check(w.includes(team), () => `builder 2: ${w} team`);
      if (!team) check(units[units.length - 1] === "e", () => `builder 2: ${w} silent e should be its own tile`);
    }
    const spares = SPARE_TILES[level].filter((t) => !units.includes(t));
    check(spares.length >= 2, () => `builder ${level}: ${w} has too few spare tiles`);
  }
}

// Rhyme families.
check(rimeOf("cake") === "ake" && rimeOf("tree") === "ee" && rimeOf("frog") === "og" && rimeOf("pie") === "ie" && rimeOf("boat") === "oat", () => "rimeOf");
for (const level of LEVELS) {
  const fams = RHYME_FAMILIES[level];
  fams.forEach((fam, i) => {
    check(fam.length >= 2, () => `rhyme ${level}: family ${fam} too small`);
    const r = rimeOf(fam[0]);
    for (const w of fam) check(rimeOf(w) === r && w.endsWith(r), () => `rhyme ${level}: ${w} does not end like ${fam[0]} (-${r})`);
    fams.forEach((other, j) => {
      if (i !== j) check(!soundsAlike(r, rimeOf(other[0])), () => `rhyme ${level}: families ${fam[0]} and ${other[0]} sound alike`);
    });
  });
}

// Sound Sort tables.
const beginSeen = new Map<string, string>();
for (const [l, words] of Object.entries(BEGIN_SORT)) {
  check(words.length >= 3, () => `begin sort ${l}: needs a key picture and two cards`);
  for (const w of words) {
    check(w[0] === l && !startsWithDigraph(w), () => `begin sort ${l}: ${w} does not start with ${l} alone`);
    check(firstSoundKey(w) === (l === "c" ? "k" : l), () => `begin sort ${l}: ${w} first sound`);
    check(!beginSeen.has(w), () => `begin sort: ${w} in two baskets`);
    beginSeen.set(w, l);
  }
}
check(!("k" in BEGIN_SORT && "c" in BEGIN_SORT), () => "begin sort: c and k baskets would sound the same");
const endSeen = new Set<string>();
for (const [l, words] of Object.entries(END_SORT)) {
  check(words.length >= 3, () => `end sort ${l}: needs a key picture and two cards`);
  for (const w of words) {
    check(w.endsWith(l) && isConsonant(l), () => `end sort ${l}: ${w}`);
    check(!/(ck|sh|ch|th|ll|ss|ng|e)$/.test(w) && w[w.length - 2] !== l, () => `end sort ${l}: ${w} ends with a digraph, double letter or silent e`);
    check(!endSeen.has(w), () => `end sort: ${w} twice`);
    endSeen.add(w);
  }
}
for (const [v, { short, long }] of Object.entries(VOWEL_SORT)) {
  check(short.length >= 4 && long.length >= 4, () => `vowel sort ${v}: too few words`);
  for (const w of short) check(isShortVowel(w, v), () => `vowel sort: ${w} is not a short ${v}`);
  for (const w of long) check(isLongVowel(w, v) && !isShortVowel(w, v), () => `vowel sort: ${w} is not a long ${v}`);
  for (const w of long) check([...w].filter((c) => VOWELS.has(c) && c !== v && !(c === "e" && w.endsWith("e"))).length === 0 || /ie|ea|oa|ai|ee/.test(w), () => `vowel sort: ${w} mixes vowels`);
  check(short.every((w) => !long.includes(w)), () => `vowel sort ${v}: a word in both baskets`);
}

// Sight words.
for (const level of LEVELS) {
  const list = SIGHT_WORDS[level];
  check(new Set(list.map((w) => w.toLowerCase())).size === list.length, () => `sight ${level}: duplicate word`);
  check(list.length >= 30, () => `sight ${level}: only ${list.length} words`);
  for (const w of list) check(/^[A-Za-z']+$/.test(w), () => `sight ${level}: "${w}"`);
}
for (const g of HOMOPHONES) check(g.length >= 2, () => `homophones ${g}`);

// ------------------------------------------------------------------ 3. generated rounds
const ALLOWED: Record<Level, string[]> = {
  K: ["RF.K.1", "RF.K.3", "RF.K.4"],
  // Grade 1 reviews two Kindergarten skills (single-letter sounds, rhyme); its own are RF.1.3 and RF.1.4.
  "1": ["RF.1.3", "RF.1.4", "RF.K.3", "RF.K.4"],
  // NC grade 2 has no RF.2.1 or RF.2.3: phonics is RF.2.4.
  "2": ["RF.2.4"],
};
const OWN: Record<Level, string> = { K: "RF.K.", "1": "RF.1.", "2": "RF.2." };

function checkItem(item: Item, level: Level) {
  const where = `${item.activity}/${level} ${item.key}`;
  check(ALLOWED[level].includes(item.standard), () => `${where}: standard ${item.standard} not allowed`);
  check(!!item.skill && !!item.prompt && !!item.say && !!item.praise, () => `${where}: missing text`);
  for (const t of [item.say, item.praise, item.type === "choice" ? item.whyWrong.join(" ") : item.whyWrong]) {
    check(!/\/[a-z]+\//.test(t), () => `${where}: speaks a lone phoneme: ${t}`);
    check(!/undefined|null|NaN/.test(t), () => `${where}: bad text ${t}`);
  }
  if (item.type === "choice") checkChoice(item, level, where);
  else if (item.type === "build") {
    check(item.units.join("") === item.word, () => `${where}: tiles don't spell ${item.word}`);
    const need = item.units.slice(item.given);
    const pool = [...item.tiles];
    for (const u of need) {
      const i = pool.indexOf(u);
      check(i >= 0, () => `${where}: missing tile ${u}`);
      if (i >= 0) pool.splice(i, 1);
    }
    check(pool.length >= 1 && pool.every((t) => !item.units.includes(t)), () => `${where}: spare tiles ${pool} also needed`);
    check(item.given === (level === "K" ? 1 : 0), () => `${where}: given ${item.given}`);
    check(item.tiles.length <= 8, () => `${where}: ${item.tiles.length} tiles is too many`);
  } else {
    check(item.baskets.length === 2 && item.answer >= 0 && item.answer < 2, () => `${where}: baskets`);
    check(!item.baskets.some((b) => b.key === item.card), () => `${where}: card is a basket picture`);
    check(!!SPRITES[item.card] && item.baskets.every((b) => !!SPRITES[b.key]), () => `${where}: sprite`);
    const b = item.baskets[item.answer];
    if (level === "K") check(item.card[0] === b.label[1] && b.label[0] === b.label[1].toUpperCase(), () => `${where}: ${item.card} not in ${b.label}`);
    else if (level === "1") check(b.label === `_${item.card[item.card.length - 1]}`, () => `${where}: ${item.card} not in ${b.label}`);
    else {
      const [kind, v] = b.label.split(" ");
      check(kind === "short" ? isShortVowel(item.card, v) : isLongVowel(item.card, v), () => `${where}: ${item.card} is not ${b.label}`);
    }
    const other = item.baskets[1 - item.answer];
    if (level === "K") check(item.card[0] !== other.label[1], () => `${where}: fits both baskets`);
    if (level === "1") check(!item.card.endsWith(other.label.slice(1)), () => `${where}: fits both baskets`);
  }
}

function checkChoice(item: ChoiceItem, level: Level, where: string) {
  const n = item.choices.length;
  check(n === choiceCount(level), () => `${where}: ${n} choices`);
  const values = item.choices.map((c) => c.value.toLowerCase());
  check(new Set(item.choices.map((c) => c.value)).size === n, () => `${where}: duplicate choices ${values}`);
  check(item.answer >= 0 && item.answer < n, () => `${where}: answer index`);
  check(item.whyWrong.length === n && item.whyWrong.every((t, i) => (i === item.answer ? t === "" : t.length > 0)), () => `${where}: wrong-choice hints`);
  for (const c of item.choices) if (c.kind === "picture") check(!!SPRITES[c.value], () => `${where}: no sprite for ${c.value}`);
  if (item.cue?.kind === "picture") check(!!SPRITES[item.cue.value], () => `${where}: no sprite for cue ${item.cue!.value}`);
  const ans = item.choices[item.answer].value;
  const wrong = item.choices.filter((_, i) => i !== item.answer).map((c) => c.value);
  const k = item.key;
  if (k.startsWith("letters:case-")) {
    const cue = item.cue!.value;
    check(ans !== cue && ans.toLowerCase() === cue.toLowerCase(), () => `${where}: ${cue} → ${ans}`);
    check(!(cue === "I" && wrong.includes("l")) && !(cue === "l" && wrong.includes("I")), () => `${where}: I and l look the same`);
    check(!item.prompt.includes(` ${ans}.`), () => `${where}: prompt gives the answer`);
    check(wrong.every((w) => w.toLowerCase() !== cue.toLowerCase() && (w === w.toLowerCase()) === (ans === ans.toLowerCase())), () => `${where}: case distractors ${wrong}`);
  } else if (k.startsWith("letters:first-")) {
    const l = item.cue!.value[1];
    check(ans[0] === l, () => `${where}: ${ans} doesn't start with ${l}`);
    check(wrong.every((w) => w[0] !== l && firstSoundKey(w) !== firstSoundKey(ans)), () => `${where}: ${wrong} share the first sound of ${ans}`);
  } else if (k.startsWith("letters:digraph-")) {
    const d = item.cue!.value;
    check(ans.startsWith(d), () => `${where}: ${ans} doesn't start with ${d}`);
    check(wrong.every((w) => !w.startsWith(d) && !startsWithDigraph(w)), () => `${where}: ${wrong} start with a digraph`);
  } else if (k.startsWith("letters:read-")) {
    check(item.cue?.kind === "picture" && item.cue.value === ans, () => `${where}: picture is not the answer`);
    check(!item.prompt.toLowerCase().includes(ans), () => `${where}: prompt shows the answer`);
  } else if (k.startsWith("rhyme:")) {
    const t = item.cue!.value;
    check(rimeOf(ans) === rimeOf(t) && ans !== t, () => `${where}: ${t}/${ans} don't share an ending`);
    check(wrong.every((w) => !soundsAlike(rimeOf(w), rimeOf(t)) && w !== t), () => `${where}: ${wrong} rhymes with ${t}`);
    check(wrong.every((w, i) => wrong.every((x, j) => i === j || !soundsAlike(rimeOf(w), rimeOf(x)))), () => `${where}: two wrong choices rhyme ${wrong}`);
  } else if (k.startsWith("sight:")) {
    check(SIGHT_WORDS[level].includes(ans), () => `${where}: ${ans} not a grade ${level} sight word`);
    check(!item.prompt.toLowerCase().split(/\W+/).includes(ans.toLowerCase()), () => `${where}: prompt shows the word`);
    const all = item.choices.map((c) => c.value.toLowerCase());
    check(!HOMOPHONES.some((g) => all.filter((w) => g.includes(w)).length > 1), () => `${where}: homophones ${all}`);
  } else check(false, () => `${where}: unknown item kind`);
}

const ROUNDS = 400;
for (const level of LEVELS) {
  for (const a of ACTIVITIES) {
    const rng = seededRng(1234 + a.length * 7 + level.charCodeAt(0));
    const standards = new Set<string>();
    for (let r = 0; r < ROUNDS; r++) {
      const items = makeRound(a, level, rng);
      check(items.length === ROUND_SIZE, () => `${a}/${level}: round of ${items.length}`);
      check(new Set(items.map((i) => i.key)).size === items.length, () => `${a}/${level}: repeated item in a round ${items.map((i) => i.key)}`);
      for (const it of items) {
        check(it.activity === a && it.level === level, () => `${a}/${level}: wrong activity/level`);
        checkItem(it, level);
        standards.add(it.standard);
      }
      if (a === "sort") {
        const counts = [0, 1].map((b) => items.filter((i) => i.type === "sort" && i.answer === b).length);
        check(counts.every((c) => c >= 2), () => `sort/${level}: basket counts ${counts}`);
        const b0 = items[0].type === "sort" ? items[0].baskets.map((b) => b.label).join() : "";
        check(items.every((i) => i.type === "sort" && i.baskets.map((b) => b.label).join() === b0), () => `sort/${level}: baskets change within a round`);
      }
      if (a === "rhyme") {
        const targets = items.map((i) => (i.type === "choice" ? i.cue!.value : ""));
        check(new Set(targets).size === targets.length, () => `rhyme/${level}: a target repeats in one round`);
      }
    }
    // Grade 1 Rhyme Time reviews the Kindergarten rhyme standard (NC has no grade 1 rhyme standard).
    if (!(a === "rhyme" && level === "1")) check([...standards].some((s) => s.startsWith(OWN[level])), () => `${a}/${level}: never uses a grade ${level} standard (${[...standards]})`);
  }
}

// Variety: pools are big enough, and three rounds in a row don't repeat an item (using the recent list).
const MIN_POOL: Record<Activity, number> = { letters: 20, builder: 20, rhyme: 20, sort: 20, sight: 30 };
for (const level of LEVELS) {
  for (const a of ACTIVITIES) {
    const keys = poolKeys(a, level);
    check(new Set(keys).size >= MIN_POOL[a], () => `${a}/${level}: only ${new Set(keys).size} different items`);
    if (a === "sort") continue;
    const rng = seededRng(99 + level.charCodeAt(0));
    let recent: Record<string, string[]> = {};
    const history: string[][] = [];
    for (let r = 0; r < 12; r++) {
      const items = makeRound(a, level, rng, new Set(recent.x ?? []));
      history.push(items.map((i) => i.key));
      recent = rememberKeys(recent, "x", items.map((i) => i.key), 15);
    }
    for (let r = 2; r < history.length; r++) {
      const window = [...history[r - 2], ...history[r - 1], ...history[r]];
      check(new Set(window).size === window.length, () => `${a}/${level}: repeats within three rounds ${window}`);
    }
  }
  // Sound Sort: many different cards over a few rounds.
  const rng = seededRng(5 + level.charCodeAt(0));
  const cards = new Set<string>();
  for (let r = 0; r < 4; r++) for (const i of makeRound("sort", level, rng)) cards.add(i.key);
  check(cards.size >= 12, () => `sort/${level}: only ${cards.size} different cards in 4 rounds`);
}

// ------------------------------------------------------------------ 4. stickers
check(new Set(STICKERS).size === STICKERS.length && STICKERS.length === 30, () => `stickers: ${STICKERS.length}`);
{
  let book: Book = { earned: [], rounds: 0 };
  const rng = seededRng(7);
  for (let i = 0; i < STICKERS.length; i++) {
    const r = awardSticker(book, rng);
    check(r.isNew && !book.earned.includes(r.sticker), () => `sticker ${i}: not new`);
    book = r.book;
  }
  check(book.earned.length === STICKERS.length, () => "book not full after 30 rounds");
  const extra = awardSticker(book, rng);
  check(!extra.isNew && extra.book.earned.length === STICKERS.length && extra.book.rounds === 31, () => "full book: extra sticker");
}

console.log(`${checks} checks, ${failures} failures`);
if (failures) process.exit(1);
