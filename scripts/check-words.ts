/*
 * Checks every Word Worm challenge for every grade:  npm test
 *  - enough items per grade and per band, no duplicate ids or duplicate words
 *  - every label has glyphs and fits on a segment; worms fit the field
 *  - spell/build: the parts spell the word, and the worm's labels can spell it only one way
 *  - pick: letter-sound decoys never make the target sound; rhymes rhyme and decoys don't;
 *    root/affix and homophone decoys all have a meaning that differs from the target's
 *  - fix: the misspelling is one wrong or extra letter, and shooting any copy of it fixes the word
 *  - standards codes match the grade; the pick strip always offers the needed label
 */
import { GRADES } from "../src/kit/grades";
import type { Grade } from "../src/kit/types";
import { hasGlyphs, textWidth } from "../src/worm/font";
import {
  LETTER_SOUNDS,
  MAX_SEGMENTS,
  PARTS,
  TEAM_SOUNDS,
  WORD_MEANINGS,
  bandOf,
  rimeOf,
  segWidth,
  stripFor,
  trayCells,
  whyWrong,
  wormLabels,
  wormLength,
  wrongLetter,
  type Challenge,
} from "../src/worm/challenges";
import { BANDS, CHALLENGES, GRADE_BLURB } from "../src/words";

const problems: string[] = [];
const bad = (c: Challenge | null, msg: string) => problems.push(`${c ? `${c.id} (${c.word})` : "global"}: ${msg}`);

/** Tiny seeded RNG so failures reproduce. */
function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 2 ** 32;
  };
}

/** Number of ways `word` can be cut into labels from `labels` (each label reusable). */
function segmentations(word: string, labels: string[], cap = 5): number {
  const memo = new Map<number, number>();
  const go = (i: number): number => {
    if (i === word.length) return 1;
    if (memo.has(i)) return memo.get(i)!;
    let n = 0;
    for (const l of new Set(labels)) if (word.startsWith(l, i)) n += go(i + l.length);
    memo.set(i, Math.min(n, cap));
    return Math.min(n, cap);
  };
  return go(0);
}

/** Letters that can also make the target letter's sound (cat/kite, city/sun, is/zip, xylophone, gem/jam). */
const SAME_SOUND: Record<string, string[]> = {
  C: ["K", "Q"], K: ["C", "Q"], S: ["C"], Z: ["S", "X"], J: ["G"],
};

const stdPattern = (g: Grade): RegExp => {
  if (g === "K" || Number(g) <= 8) return new RegExp(`^(RF|L)\\.${g}\\.\\d$`);
  return Number(g) <= 10 ? /^L\.9-10\.[1-6]$/ : /^L\.11-12\.[1-6]$/;
};

const ids = new Set<string>();
let total = 0;

for (const g of GRADES) {
  const list = CHALLENGES[g];
  total += list.length;
  if (list.length < 20) bad(null, `grade ${g} has only ${list.length} challenges`);
  if (!GRADE_BLURB[g]) bad(null, `grade ${g} has no blurb`);
  const seen = new Set<string>();
  const band = bandOf(g);

  for (const c of list) {
    if (ids.has(c.id)) bad(c, "duplicate id");
    ids.add(c.id);
    if (c.grade !== g) bad(c, `grade ${c.grade} filed under ${g}`);
    const key = `${c.kind}:${c.word}:${c.prompt}`;
    if (seen.has(key)) bad(c, "duplicate challenge");
    seen.add(key);
    if (!stdPattern(g).test(c.standard)) bad(c, `standard ${c.standard} doesn't fit grade ${g}`);
    if (!c.skill || !c.say || !c.explain || !c.prompt) bad(c, "missing text");
    if (c.prompt.length > 110) bad(c, `prompt too long (${c.prompt.length})`);
    if (c.explain.length > 220) bad(c, `explanation too long (${c.explain.length})`);
    if (/undefined|NaN/.test(c.prompt + c.say + c.explain + Object.values(c.notes).join(" "))) bad(c, "text has undefined");

    // Labels
    const labels = [...c.steps, ...c.decoys, ...(c.shown ? c.shown.split("") : [])];
    for (const l of labels) {
      if (!/^[A-Z']+$/.test(l)) bad(c, `label "${l}" is not capital letters`);
      if (!hasGlyphs(l)) bad(c, `label "${l}" has no glyph`);
      if (segWidth(l) > 44) bad(c, `label "${l}" too wide (${textWidth(l)}px)`);
    }
    if (!/^[A-Z']+$/.test(c.word)) bad(c, `word "${c.word}" is not capital letters`);
    if (c.steps.length === 0) bad(c, "no steps");
    if (c.kind !== "fix") {
      if (c.decoys.length === 0) bad(c, "no decoys");
      if (new Set(c.decoys).size !== c.decoys.length) bad(c, "repeated decoy");
      for (const d of c.decoys) if (c.steps.includes(d)) bad(c, `decoy ${d} is also a step`);
    }

    switch (c.kind) {
      case "spell":
      case "build": {
        if (c.steps.join("") !== c.word) bad(c, `parts ${c.steps.join("+")} don't spell ${c.word}`);
        const ways = segmentations(c.word, [...c.steps, ...c.decoys]);
        if (ways !== 1) bad(c, `worm labels can spell ${c.word} ${ways} ways`);
        if (c.kind === "build") {
          if (c.steps.length < 2) bad(c, "a build needs at least two parts");
          if (!c.prompt.includes('"')) bad(c, "build prompt has no meaning");
        }
        if (c.kind === "spell" && c.showWord && !c.prompt.includes(c.word)) bad(c, "shown word missing from prompt");
        if (c.kind === "spell" && !c.showWord && c.prompt.includes(c.word)) bad(c, "hidden word appears in the prompt");
        break;
      }
      case "pick": {
        if (c.steps.length !== 1 || c.word !== c.steps[0]) bad(c, "pick must have one target");
        if (c.skill === "Letter sounds" || c.skill === "Short vowel sounds") {
          const t = LETTER_SOUNDS[c.word];
          if (!t) bad(c, "unknown letter");
          for (const d of c.decoys) {
            if (!LETTER_SOUNDS[d]) bad(c, `unknown decoy letter ${d}`);
            else if (LETTER_SOUNDS[d].sound === t.sound || (SAME_SOUND[c.word] ?? []).includes(d)) bad(c, `decoy ${d} can make the ${t.sound} sound`);
          }
          if (!c.prompt.includes(t.key)) bad(c, "keyword missing");
          if (t.key[0] !== c.word) bad(c, `keyword ${t.key} doesn't start with ${c.word}`);
        } else if (c.skill === "Rhyming words") {
          const base = /rhymes with (\w+)/.exec(c.prompt)?.[1] ?? "";
          if (rimeOf(base) !== rimeOf(c.word) && !(base.endsWith(c.word.slice(-2)) && c.word.length >= 3)) bad(c, `${c.word} doesn't rhyme with ${base}`);
          if (base === c.word) bad(c, "rhymes with itself");
          for (const d of c.decoys) if (rimeOf(d) === rimeOf(base)) bad(c, `decoy ${d} rhymes with ${base}`);
        } else if (TEAM_SOUNDS[c.word]) {
          const key = /(in|of) (\w+)$/.exec(c.prompt)?.[2] ?? "";
          if (!key.includes(c.word)) bad(c, `keyword ${key} doesn't contain ${c.word}`);
          for (const d of c.decoys) if (TEAM_SOUNDS[d] && TEAM_SOUNDS[d].sound === TEAM_SOUNDS[c.word].sound) bad(c, `decoy ${d} makes the same sound`);
        } else if (WORD_MEANINGS[c.word]) {
          if (!/_{3}/.test(c.prompt)) bad(c, "usage prompt has no blank");
          for (const d of c.decoys) if (!WORD_MEANINGS[d]) bad(c, `no meaning for decoy ${d}`);
        } else if (PARTS[c.word]) {
          const meaning = PARTS[c.word];
          if (!c.prompt.includes(`"${meaning.split(" or ")[0]}"`) && !c.prompt.includes(" in ") && !c.prompt.includes("makes"))
            bad(c, `prompt doesn't state the meaning "${meaning}"`);
          for (const d of c.decoys) {
            if (!PARTS[d]) bad(c, `no meaning for decoy ${d}`);
            else if (PARTS[d] === meaning) bad(c, `decoy ${d} means the same as ${c.word}`);
          }
          const ex = /as in (\w+)/.exec(c.explain)?.[1] ?? "";
          if (!ex.includes(c.word) && !(c.word === "VIV" && ex === "SURVIVE")) bad(c, `example ${ex} doesn't contain ${c.word}`);
        } else bad(c, "pick of unknown type");
        break;
      }
      case "fix": {
        const shown = c.shown ?? "";
        try {
          const w = wrongLetter(shown, c.word);
          if (w.letter !== c.steps[0]) bad(c, "fix target isn't the wrong letter");
          // Every copy of the target letter must be a valid fix.
          [...shown].forEach((ch, i) => {
            if (ch !== w.letter) return;
            const removed = shown.slice(0, i) + shown.slice(i + 1);
            if (w.extra ? removed !== c.word : i !== w.index) bad(c, `shooting the ${ch} at ${i} would not fix it`);
          });
        } catch (e) {
          bad(c, String(e));
        }
        if (shown.length > MAX_SEGMENTS) bad(c, "misspelled word too long for a worm");
        break;
      }
    }

    // Worms: many random builds, each carrying every step, fitting the field, strip always fair.
    for (let seed = 1; seed <= 40; seed++) {
      const r = rng(seed * 97 + total);
      const w = wormLabels(c, band, r);
      const need = [...c.steps];
      for (const s of need) {
        const want = need.filter((x) => x === s).length;
        if (w.filter((x) => x === s).length < want) {
          bad(c, `worm ${w.join(",")} is missing ${s}`);
          break;
        }
      }
      if (wormLength(w) > 290) bad(c, `worm too long (${wormLength(w)}px)`);
      for (const s of c.steps) {
        const strip = stripFor(w, s, r);
        if (!strip.includes(s) || strip.length > 4 || new Set(strip).size !== strip.length) bad(c, `bad strip ${strip}`);
        if (strip.length < Math.min(4, new Set(w).size)) bad(c, `strip too short ${strip}`);
      }
      if (seed === 1) {
        for (const d of new Set(w)) if (!c.steps.includes(d) && !whyWrong(c, d, c.steps[0])) bad(c, `no reason for ${d}`);
        if (trayCells(c, 0).length === 0) bad(c, "empty tray");
      }
    }
  }
}

for (const b of BANDS) {
  const n = b.grades.reduce((a, g) => a + CHALLENGES[g].length, 0);
  if (n < 40) bad(null, `band ${b.name} has only ${n} challenges`);
  // No word repeated as the same kind of challenge inside a band.
  const words = new Map<string, string>();
  for (const g of b.grades)
    for (const c of CHALLENGES[g]) {
      const k = `${c.kind}:${c.word}`;
      if (words.has(k) && c.kind !== "pick") bad(c, `${c.word} already used in ${words.get(k)}`);
      words.set(k, c.id);
    }
}

for (const [k, v] of Object.entries(PARTS)) if (!v) bad(null, `PARTS.${k} is empty`);

if (problems.length) {
  console.error(problems.join("\n"));
  console.error(`\n${problems.length} problem(s).`);
  process.exit(1);
}
const counts = GRADES.map((g) => `${g}:${CHALLENGES[g].length}`).join(" ");
const bands = BANDS.map((b) => `${b.name}:${b.grades.reduce((a, g) => a + CHALLENGES[g].length, 0)}`).join(" ");
console.log(`OK: ${total} challenges checked (${counts}); bands ${bands}.`);
