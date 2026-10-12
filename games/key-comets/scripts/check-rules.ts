/*
 * Key Comets rules check (npm test). Fails with a list of problems.
 *
 * - Word lists per grade: kid-safe (blocklist), spelled from the reviewed allowlist (scripts/spelling.ts),
 *   only typeable ASCII, and short enough to fit on a comet / two lines of a sentence comet.
 * - Lessons: every lesson's text only uses the keys learned so far (sampled rounds at every grade too),
 *   each lesson actually practices its new keys, and capitals/digits/punctuation wait for their lessons.
 * - Keyboard: every character has a key and a finger; Shift is on the other hand.
 * - WPM / accuracy math, most-missed keys, the pass rule and lesson unlocks.
 * - The simulation: typing zaps comets, misses count against the glowing key, shields end a round,
 *   and Practice mode never ends the round.
 */
import { existsSync, readdirSync, readFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { GRADES } from "../src/kit/grades";
import type { Grade } from "../src/kit/types";
import { FINGER_NAMES, ROWS, TYPEABLE, fingerFor, fingerHint, keyFor, needsShift, shiftSideFor } from "../src/comets/keyboard";
import { FREE_ID, LESSONS, freeItems, lessonItems, lessonKeys, roundItems, roundSize } from "../src/comets/lessons";
import { CometSim, HIT_Y, HOVER_Y, fallMs, kindOf, multiplier } from "../src/comets/sim";
import {
  PASS_ACCURACY, accuracy, applyResult, emptySave, grossWpm, isUnlocked, makeResult, mostMissed, paceFor, passes, practiceDefault,
  standardsFor, wpm,
} from "../src/comets/stats";
import { ALL_LISTS, QUOTES, SENTENCE_LINE, bandOf, freePool, wrapLines, type Item } from "../src/comets/words";
import { NAMES, WORDS } from "./spelling";

const problems: string[] = [];
const fail = (msg: string) => problems.push(msg);
let checks = 0;
const check = (ok: boolean, msg: string) => {
  checks++;
  if (!ok) fail(msg);
};

/** Seeded RNG so failures are reproducible. */
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ---------------- blocklist (ROT13 so the repo doesn't spell these out) ---------------- */
const rot13 = (s: string) => s.replace(/[a-z]/gi, (c) => {
  const b = c <= "Z" ? 65 : 97;
  return String.fromCharCode(((c.charCodeAt(0) - b + 13) % 26) + b);
});
const BLOCK_WORDS = new Set(
  ("xvyy xvyyrq xvyyre qvr qvrq qrnq qrngu zheqre tha thaf fubbg fubg oybbq oybbql fgno xavsr obzo jrncba jne ungr ungrf " +
    "fghcvq qhzo vqvbg zbeba ybfre htyl sng frk frkl anxrq ahqr xvff qeht qehtf orre jvar ibqxn qehax fzbxr pvtnerggr qnza " +
    "uryy penc ohgg sneg cbbc crr fhpx fhpxf fuhghc fuhg shpx fuvg ovgpu nff nffubyr onfgneq qvpx cvff pbpx chffl fyhg juber " +
    "snt avttre ergneq")
    .split(" ")
    .map(rot13),
);
/** Never allowed even inside a longer word. */
const BLOCK_PARTS = "shpx fuvg ovgpu phag avtt fyhg juber".split(" ").map(rot13);

function safetyProblems(text: string): string[] {
  const out: string[] = [];
  const lower = text.toLowerCase();
  for (const w of lower.split(/[^a-z]+/)) if (w && BLOCK_WORDS.has(w)) out.push(`blocked word "${w}"`);
  for (const w of lower.split(/[^a-z]+/)) for (const p of BLOCK_PARTS) if (w.includes(p)) out.push("blocked letters inside a word");
  return out;
}

// The blocklist itself must work.
check(safetyProblems(`we ${rot13("ungr")} it`).length > 0, "blocklist does not catch a blocked word");
check(safetyProblems("a glass of water, a class, Dickinson").length === 0, "blocklist flags innocent words (glass, class, Dickinson)");

/* ---------------- spelling (allowlist) ---------------- */
function spellingProblems(text: string): string[] {
  const out: string[] = [];
  for (const raw of text.split(/[^A-Za-z']+/)) {
    const w = raw.replace(/^'+|'+$/g, "");
    if (!w) continue;
    if (NAMES.has(w)) continue;
    if (w.length === 1 && /[aAI]/.test(w)) continue;
    if (!WORDS.has(w.toLowerCase())) out.push(`"${w}" is not in the spelling allowlist`);
  }
  return out;
}
check(spellingProblems("teh cat").length === 1, "spelling check misses a typo");

/* ---------------- text that fits ---------------- */
function fitProblems(text: string): string[] {
  const out: string[] = [];
  if (!/^[\x20-\x7e]+$/.test(text)) out.push("non-ASCII or control character");
  if (text !== text.trim() || /\s{2}/.test(text)) out.push("leading/trailing/double space");
  for (const ch of text) if (!TYPEABLE.has(ch)) out.push(`"${ch}" is not on the keyboard`);
  const kind = kindOf(text);
  if (kind === "word" && !text.includes(" ") && text.length > 14) out.push(`word longer than 14 characters (${text.length})`);
  if (kind === "word" && text.length > 18) out.push("word comet longer than 18 characters");
  if (kind === "sentence") {
    if (text.length > 64) out.push(`sentence longer than 64 characters (${text.length})`);
    const lines = wrapLines(text);
    if (lines.length > 2) out.push(`sentence wraps to ${lines.length} lines`);
    if (lines.some((l) => l.trimEnd().length > SENTENCE_LINE)) out.push("sentence line wider than the comet");
    if (lines.join("") !== text) out.push("wrapLines loses characters");
  }
  return out;
}

const isDrill = (text: string) => LESSONS.some((l) => l.drills.includes(text));

function checkText(where: string, text: string, opts: { spelling: boolean }) {
  checks++;
  const ps = [...safetyProblems(text), ...fitProblems(text), ...(opts.spelling ? spellingProblems(text) : [])];
  for (const p of ps) fail(`${where}: "${text}": ${p}`);
}

// Every list in words.ts
for (const [name, list] of Object.entries(ALL_LISTS)) {
  check(list.length > 0, `${name} is empty`);
  check(new Set(list).size === list.length, `${name} has duplicates`);
  for (const t of list) checkText(`words.${name}`, t, { spelling: true });
}
for (const q of QUOTES) check(!!q.by && q.by.length > 3, `quote "${q.text}" has no attribution`);

// Every lesson's content
for (const l of LESSONS) {
  for (const t of l.words) checkText(`lesson ${l.id} word`, t, { spelling: true });
  for (const t of l.drills) checkText(`lesson ${l.id} drill`, t, { spelling: false });
  for (const [band, list] of Object.entries(l.byBand ?? {})) for (const t of list!) checkText(`lesson ${l.id} ${band}`, t, { spelling: !isDrill(t) && t.length > 1 });
}

/* ---------------- free play per grade ---------------- */
for (const g of GRADES) {
  const n = g === "K" ? 0 : Number(g);
  const pool = freePool(g).map((i) => i.text);
  check(pool.length >= 20, `grade ${g}: free-play pool has only ${pool.length} items`);
  for (let seed = 1; seed <= 30; seed++) {
    const items = freeItems(g, mulberry32(seed));
    check(items.length === roundSize(g), `grade ${g}: free play round has ${items.length} comets`);
    for (const it of items) {
      for (const p of [...safetyProblems(it.text), ...fitProblems(it.text)]) fail(`grade ${g} free play "${it.text}": ${p}`);
      if (n <= 1) check(it.text.length <= 3, `grade ${g}: free play item "${it.text}" too long for K–1`);
      if (n === 0) check(/^[a-z]$/.test(it.text), `grade K: free play item "${it.text}" is not a single letter`);
      if (n >= 2 && n <= 5) check(!it.text.includes(" "), `grade ${g}: free play item "${it.text}" should be a word`);
      if (n >= 9) check(kindOf(it.text) === "sentence" || it.text.split(" ").length >= 3, `grade ${g}: free play item "${it.text}" should be a sentence or quote`);
    }
  }
  // K starts on the home row
  if (n === 0) {
    const first = freeItems(g, mulberry32(7)).slice(0, 7).map((i) => i.text);
    check(first.every((c) => "asdfjkl".includes(c)), `grade K free play should start on the home row (got ${first.join(",")})`);
  }
}
// Grade bands scale up
const avgLen = (g: Grade) => {
  const p = freePool(g);
  return p.reduce((s, i) => s + i.text.length, 0) / p.length;
};
check(avgLen("K") < avgLen("3") && avgLen("3") < avgLen("5") && avgLen("5") < avgLen("7") && avgLen("7") < avgLen("10"), "free-play text should get longer with grade");

/* ---------------- lesson key sets ---------------- */
const CAPS = /[A-Z]/;
const DIGITS = /[0-9]/;
const PUNCT_LATE = /[!?'":\-()]/;
const shiftIdx = LESSONS.findIndex((l) => l.id === "shift");
const numIdx = LESSONS.findIndex((l) => l.id === "numbers");
const punctIdx = LESSONS.findIndex((l) => l.id === "punct");
check(LESSONS.map((l) => l.id).join(",") === "home,ei,reach,top,bottom,shift,numbers,punct,sentences", "lesson order changed");
check(new Set(LESSONS.map((l) => l.id)).size === LESSONS.length && !LESSONS.some((l) => l.id === FREE_ID), "lesson ids must be unique");

for (let i = 0; i < LESSONS.length; i++) {
  const l = LESSONS[i];
  const keys = lessonKeys(i);
  if (i > 0) for (const k of lessonKeys(i - 1)) check(keys.has(k), `lesson ${l.id} forgot key "${k}" from earlier lessons`);
  const all = [...l.singles, ...l.drills, ...l.words, ...Object.values(l.byBand ?? {}).flat()];
  const sampled: string[] = [];
  for (const g of GRADES) for (let seed = 1; seed <= 25; seed++) sampled.push(...lessonItems(i, g, mulberry32(seed * 31 + i)).map((x) => x.text));
  for (const t of [...all, ...sampled]) {
    for (const ch of t) if (!keys.has(ch)) fail(`lesson ${l.id}: "${t}" uses "${ch}", not learned yet`);
    if (i < shiftIdx && CAPS.test(t)) fail(`lesson ${l.id}: "${t}" has a capital before the Shift lesson`);
    if (i < numIdx && DIGITS.test(t)) fail(`lesson ${l.id}: "${t}" has a digit before the Numbers lesson`);
    if (i < punctIdx && PUNCT_LATE.test(t)) fail(`lesson ${l.id}: "${t}" has punctuation before the Punctuation lesson`);
    checks++;
  }
  for (const t of sampled) for (const p of [...safetyProblems(t), ...fitProblems(t)]) fail(`lesson ${l.id} sampled "${t}": ${p}`);
  // The lesson practices its own new keys (K–1 singles cover every new letter key).
  if (l.id !== "sentences") {
    const newKeys = [...keys].filter((k) => i === 0 || !lessonKeys(i - 1).has(k));
    const text = all.join("");
    for (const k of newKeys) {
      if (k === "/" ) continue;
      check(text.includes(k), `lesson ${l.id} never practices its new key "${k}"`);
    }
    const k1 = new Set(lessonItems(i, "K", mulberry32(5), 60).map((x) => x.text));
    for (const k of l.byBand?.k1 ?? l.singles) check(k1.has(k), `lesson ${l.id}: K round never shows "${k}"`);
  }
  // K–1 lessons are single keys (except the final lesson's tiny words)
  for (const g of ["K", "1"] as Grade[]) {
    const items = lessonItems(i, g, mulberry32(11));
    if (l.id !== "sentences" && l.id !== "punct") check(items.every((x) => x.text.length === 1), `lesson ${l.id} grade ${g}: K–1 should get single keys`);
    check(items.every((x) => x.text.length <= 14), `lesson ${l.id} grade ${g}: K–1 items too long`);
  }
}
check(lessonKeys(0).size === 9 && [..."asdfjkl; "].every((c) => lessonKeys(0).has(c)), "home row lesson keys should be a s d f j k l ; and space");
check(!lessonKeys(0).has("e") && lessonKeys(1).has("e") && lessonKeys(1).has("i"), "E and I arrive in lesson 2");
check(["r", "t", "y", "u"].every((c) => lessonKeys(2).has(c) && !lessonKeys(1).has(c)), "R T Y U arrive in lesson 3");
check(roundItems("nope", "3", mulberry32(1)).length === roundSize("3"), "unknown lesson ids fall back to the home row");

/* ---------------- keyboard ---------------- */
const fingerOf = (c: string) => fingerFor(c);
check(fingerOf("f") === "li" && fingerOf("j") === "ri" && fingerOf("a") === "lp" && fingerOf(";") === "rp" && fingerOf(" ") === "th", "home row finger map is wrong");
check(fingerOf("t") === "li" && fingerOf("y") === "ri" && fingerOf("b") === "li" && fingerOf("n") === "ri" && fingerOf("6") === "ri", "index reach map is wrong");
check(needsShift("A") && needsShift("?") && !needsShift("a") && !needsShift("/"), "needsShift is wrong");
check(shiftSideFor("A") === "shiftR" && shiftSideFor("J") === "shiftL" && shiftSideFor("!") === "shiftR" && shiftSideFor("a") === null, "Shift must be on the other hand");
check(fingerHint("f").includes("left index"), "finger hint for F");
check(fingerHint("J").includes("LEFT Shift"), "finger hint for capital J mentions the left Shift");
check(Object.keys(FINGER_NAMES).length === 9, "nine finger zones (8 fingers + thumbs)");
check(ROWS.flat().filter((k) => k.bump).map((k) => k.base).join("") === "fj", "bumps on F and J");
for (const ch of new Set([...Object.values(ALL_LISTS).flat(), ...LESSONS.flatMap((l) => [...l.singles, ...l.drills, ...l.words, ...Object.values(l.byBand ?? {}).flat()])].join(""))) {
  check(!!keyFor(ch), `character "${ch}" has no key on the on-screen keyboard`);
}

/* ---------------- WPM / accuracy math ---------------- */
check(wpm(250, 60000) === 50, "250 chars in a minute = 50 WPM");
check(wpm(100, 30000) === 40, "100 chars in 30 s = 40 WPM");
check(wpm(0, 60000) === 0 && wpm(10, 0) === 0, "WPM with nothing typed is 0");
check(wpm(5, 200) === 60, "WPM clamps very short times to 1 second");
check(grossWpm(300, 60000) === 60, "gross WPM counts every key press");
check(accuracy(9, 10) === 90 && accuracy(0, 0) === 100 && accuracy(2, 3) === 67, "accuracy %");
const mm = mostMissed({ a: 2, s: 5, d: 2, f: 0, j: 1 });
check(mm.map((m) => m.key).join("") === "sad", `most-missed order (got ${mm.map((m) => m.key).join("")})`);

/* ---------------- pass rule & unlocks ---------------- */
check(passes({ completed: true, accuracy: 90, zapped: 8, total: 10 }), "90% and 8/10 passes");
check(!passes({ completed: true, accuracy: 89, zapped: 10, total: 10 }), "89% does not pass");
check(!passes({ completed: true, accuracy: 100, zapped: 7, total: 10 }), "7/10 zapped does not pass");
check(!passes({ completed: false, accuracy: 100, zapped: 9, total: 10 }), "a round ended by the shield does not pass");
check(PASS_ACCURACY === 90, "pass accuracy is 90%");

let save = emptySave();
check(isUnlocked("home", save.passed) && !isUnlocked("ei", save.passed) && isUnlocked(FREE_ID, save.passed), "start: only Home row and Free play are open");
check(!isUnlocked("sentences", save.passed) && !isUnlocked("nope", save.passed), "later/unknown lessons are locked");
const stats = (correct: number, errors: number, ms: number) => ({ keystrokes: correct + errors, correct, errors, chars: correct, missed: errors ? { d: errors } : {}, activeMs: ms });
const failR = makeResult("home", "1", stats(80, 20, 60000), { zapped: 15, total: 15, won: true, score: 100, bestCombo: 3 });
check(!failR.passed && failR.accuracy === 80, "80% accuracy round fails");
let ap = applyResult(save, failR, { d: 20 });
check(ap.unlocked === null && !isUnlocked("ei", ap.save.passed), "a failed round unlocks nothing");
check(!ap.save.bests.home && !ap.newBest, "an 80% round doesn't set a personal best (bests need 90% accuracy)");
check(ap.save.missed.d === 20, "lifetime missed keys are saved");
save = ap.save;
const passR = makeResult("home", "1", stats(95, 5, 60000), { zapped: 15, total: 15, won: true, score: 500, bestCombo: 9 });
check(passR.passed && passR.accuracy === 95 && passR.wpm === 19, "95% round passes at 19 WPM");
ap = applyResult(save, passR, {});
check(ap.unlocked === "ei" && isUnlocked("ei", ap.save.passed) && !isUnlocked("reach", ap.save.passed), "passing Home row unlocks lesson 2 only");
check(ap.save.bests.home.wpm === 19 && ap.newBest, "a faster round replaces the personal best");
save = ap.save;
ap = applyResult(save, passR, {});
check(ap.unlocked === null && ap.save.passed.filter((x) => x === "home").length === 1, "passing again doesn't duplicate or re-unlock");
const freeR = makeResult(FREE_ID, "7", stats(100, 0, 60000), { zapped: 14, total: 14, won: true, score: 900, bestCombo: 14 });
ap = applyResult(save, freeR, {});
check(ap.unlocked === null && ap.save.bests["free-7"]?.wpm === 20, "free play saves a per-grade best and unlocks nothing");
const lastR = makeResult("sentences", "9", stats(100, 0, 60000), { zapped: 10, total: 10, won: true, score: 900, bestCombo: 10 });
check(applyResult(save, lastR, {}).unlocked === null, "the final lesson has nothing after it");

/* ---------------- grade scaling ---------------- */
check(practiceDefault("K") && practiceDefault("1") && !practiceDefault("2"), "K–1 default to Practice");
check(paceFor("K", "ei") < paceFor("3", "ei") && paceFor("3", "ei") < paceFor("12", "ei"), "comets get faster with grade");
check(fallMs("a", paceFor("K", "home")) > 6000, "K letters fall slowly (> 6 s)");
check(bandOf("K") === "k1" && bandOf("3") === "23" && bandOf("4") === "45" && bandOf("8") === "68" && bandOf("9") === "912", "grade bands");
for (const g of GRADES) {
  for (const id of [...LESSONS.map((l) => l.id), FREE_ID]) {
    for (const s of standardsFor(g, id)) check(/^(W|L|RF)\.(K|[1-8]|9-10|11-12)\.\d$/.test(s.code), `bad standard code ${s.code}`);
  }
}
check(standardsFor("10", "home")[0].code === "W.9-10.6" && standardsFor("K", "home").some((s) => s.code === "RF.K.1"), "standard bands");

/* ---------------- simulation ---------------- */
const items = (...t: string[]): Item[] => t.map((text) => ({ text }));

function runUntil(sim: CometSim, pred: () => boolean, maxMs = 120000) {
  for (let t = 0; t < maxMs && !pred(); t += 16) sim.step(16);
}

{
  // Typing a letter zaps it; a wrong key is a miss counted against the glowing key.
  const sim = new CometSim({ items: items("f", "j"), paceWpm: 6, practice: false, rng: mulberry32(1) });
  runUntil(sim, () => sim.comets.length > 0);
  check(sim.nextKey() === "f", `first glowing key should be f (got ${sim.nextKey()})`);
  check(sim.type("k") === "miss" && sim.stats.missed.f === 1 && sim.stats.errors === 1, "wrong key = miss against f");
  check(sim.type("f") === "zap" && sim.zapped === 1 && sim.score > 0, "typing f zaps it");
  runUntil(sim, () => sim.comets.length > 0);
  check(sim.type("j") === "zap", "typing j zaps it");
  runUntil(sim, () => sim.phase === "over", 2000);
  check(sim.phase === "over" && sim.won, "round over and won after all comets zapped");
  const r = makeResult("home", "1", sim.stats, sim);
  check(r.accuracy === 67 && r.zapped === 2 && r.missed[0]?.key === "f", "result: 2 of 3 keys right, f most missed");
}
{
  // Prefix lock-on: both "add" and "ask" match "a"; "s" narrows to "ask".
  const sim = new CometSim({ items: items("add", "ask"), paceWpm: 20, practice: true, rng: mulberry32(2) });
  runUntil(sim, () => sim.comets.length === 2);
  check(sim.comets.length === 2, "two comets on screen");
  check(sim.type("a") === "hit" && sim.candidates().length === 2, "a locks both comets");
  check(sim.type("s") === "hit" && sim.candidates().length === 1 && sim.candidates()[0].text === "ask", "s narrows to ask");
  check(sim.type("k") === "zap" && sim.comets.length === 1 && sim.buffer === "", "k zaps ask");
  check(sim.nextKey() === "a", "next key is the a of add");
  for (const c of "add") sim.type(c);
  check(sim.zapped === 2 && sim.stats.chars === 6 && sim.stats.errors === 0, "6 correct characters, no errors");
}
{
  // Shield: untouched comets dent it and end the round.
  const sim = new CometSim({ items: items(..."asdfjklasdfjkl".split("")), paceWpm: 20, practice: false, shieldMax: 3, rng: mulberry32(3) });
  runUntil(sim, () => sim.phase === "over", 600000);
  check(sim.phase === "over" && !sim.won && sim.shield === 0 && sim.dented === 3, "three dents end a 3-shield round");
  const r = makeResult("home", "5", sim.stats, sim);
  check(!r.completed && !r.passed, "a shield-out round is not completed or passed");
}
{
  // Practice mode never ends the round, however long you wait or however many keys you miss.
  for (const g of ["K", "1", "6"] as Grade[]) {
    const sim = new CometSim({ items: lessonItems(0, g, mulberry32(4)), paceWpm: paceFor(g, "home"), practice: true, shieldMax: 3, rng: mulberry32(4) });
    for (let t = 0; t < 10 * 60000; t += 50) {
      sim.step(50);
      if (t % 1000 === 0) sim.type("q");
    }
    check(sim.phase === "playing" && sim.shield === 3 && sim.dented === 0, `grade ${g} practice: round still going after 10 minutes, shield untouched`);
    check(sim.comets.length > 0 && sim.comets.every((c) => c.y <= HOVER_Y && c.y < HIT_Y), `grade ${g} practice: comets wait above the station`);
    // ...and it does end once everything is typed.
    for (let n = 0; n < 200 && sim.phase === "playing"; n++) {
      const k = sim.nextKey();
      if (k) sim.type(k);
      sim.step(4000);
    }
    check(sim.phase === "over" && sim.won && sim.zapped === sim.total, `grade ${g} practice: typing everything finishes the round`);
  }
}
{
  // Sentences come one at a time.
  const sim = new CometSim({ items: items("Well done is better than well said.", "Hope is the thing with feathers."), paceWpm: 26, practice: false, rng: mulberry32(5) });
  runUntil(sim, () => sim.comets.length > 0);
  for (let t = 0; t < 8000; t += 16) sim.step(16);
  check(sim.comets.length === 1 && sim.comets[0].kind === "sentence", "only one sentence comet at a time");
  for (const ch of "Well done is better than well said.") sim.type(ch);
  check(sim.zapped === 1, "typing the whole sentence (with spaces and capitals) zaps it");
}
check(multiplier(1) === 1 && multiplier(5) === 1 && multiplier(6) === 2 && multiplier(100) === 5, "combo multiplier x1..x5");
check(sim0Ignored(), "keys with no comets on screen are ignored (not counted)");
function sim0Ignored() {
  const sim = new CometSim({ items: items("a"), paceWpm: 6, practice: false });
  return sim.type("a") === "ignored" && sim.stats.keystrokes === 0;
}

/* ---------------- kit copy & storage keys ---------------- */
const here = path.dirname(fileURLToPath(import.meta.url));
const canon = path.resolve(here, "../../../kit");
if (existsSync(canon)) {
  const walk = (d: string): string[] => readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]));
  for (const f of walk(canon)) {
    const rel = path.relative(canon, f);
    const mine = path.resolve(here, "../src/kit", rel);
    check(existsSync(mine) && readFileSync(mine, "utf8") === readFileSync(f, "utf8"), `src/kit/${rel} differs from the arcade kit`);
  }
}
const src = readdirSync(path.resolve(here, "../src/comets")).map((f) => readFileSync(path.resolve(here, "../src/comets", f), "utf8")).join("\n")
  + readFileSync(path.resolve(here, "../src/KeyComets.tsx"), "utf8");
for (const m of src.matchAll(/localStorage\.(?:get|set)Item\(\s*"([^"]+)"/g)) check(m[1].startsWith("arcade.key-comets."), `storage key ${m[1]} should start with arcade.key-comets.`);
check(/SAVE_KEY = "arcade\.key-comets\./.test(src), "save key starts with arcade.key-comets.");
check(!/https?:\/\/(?!www\.w3\.org)/.test(src), "no external URLs in game code");

if (problems.length) {
  console.error(`Key Comets rules: ${problems.length} problem(s) in ${checks} checks`);
  for (const p of [...new Set(problems)].slice(0, 80)) console.error(" - " + p);
  process.exit(1);
}
console.log(`Key Comets rules: all ${checks} checks passed.`);
