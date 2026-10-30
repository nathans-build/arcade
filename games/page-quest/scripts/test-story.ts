/*
 * Unit tests for the .story parser, validator, serializer, readability and standards mapping
 * (npm test). Small inline stories, including broken ones.
 */
import assert from "node:assert/strict";
import { parseStory } from "../src/story/parse";
import { checkStory, resolveMood } from "../src/story/validate";
import { serializeStory } from "../src/story/serialize";
import { countSyllables, readability } from "../src/story/readability";
import { standardFor } from "../src/story/standards";
import type { Story } from "../src/story/types";
import { draftFromStory, draftFromText, draftToText, newDraft } from "../src/writer/draft";
import { advance, answerMc, correctIndex, newRun, setQuiz, tapOrder, type RunState } from "../src/play/session";
import {
  MIXED_ROTATION, SUBJECT_KEY, SubjectDeck, initialSubject, loadSubject, saveSubject, subjectFromParams, subjectsFor, writtenPool, type BankSource,
} from "../src/play/subjects";
import { exits } from "../src/story/validate";
import type { DealtQuestion, Grade, Question, Subject } from "../src/kit/types";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { CHARACTERS, GENRES, MOODS, SCENES, charByName } from "../src/story/roster";
import { SCENE_PAINTERS } from "../src/engine/scenes";
import { KEYS, SPRITES } from "../src/engine/sprites";
import { EMOTES, faceRows } from "../src/engine/face";

let passed = 0;
function test(name: string, fn: () => void) {
  try {
    fn();
    passed++;
  } catch (e) {
    console.error(`FAIL ${name}`);
    throw e;
  }
}

const HEAD = (band = "4-5", start = "a") => `title: T
author: A
genre: mystery
band: ${band}
cover: museum-hall
blurb: A short test book.
start: ${start}
`;

const GOOD = `${HEAD("6-8")}
# a comment
=== a
scene: museum-hall
cast: hero, detective:thinking, guard:worried
checkpoint
~ Chapter One ~
The hall is dark.
The lights hum.

Detective: Someone was here.
Guard: Not me!
Note: the lights hum again.
A draft blows.
clue: The guard was asleep.
> Look at the case -> b
> Go home -> lose1

=== b
scene: museum-vault
cast: hero
? RL.1 : What did the detective say?
+ Someone was here.
- Nobody came.
- The lights are off.
hint: Read the detective's line.
next: c

=== c
scene: museum-vault
Order time.
? RL.5 order : Put it in order.
1 First thing.
2 3 cups of second thing.
3 Third thing.
hint: Look for first and next.
next: win1

=== win1
scene: museum-hall
cast: detective:happy
You solved it.
end: win Case Closed

=== lose1
scene: city-street
The case goes cold.
end: lose The Cold Case
`;

const errorsOf = (text: string) => checkStory(text).errors.map((e) => e.message);
const has = (text: string, re: RegExp) => errorsOf(text).some((m) => re.test(m));

test("parses a good story", () => {
  const r = checkStory(GOOD);
  assert.deepEqual(r.errors, [], r.errors.map((e) => e.message).join("\n"));
  const s = r.story;
  assert.equal(s.title, "T");
  assert.equal(s.pages.length, 5);
  const a = s.pages[0];
  assert.equal(a.scene, "museum-hall");
  assert.deepEqual(a.cast, [{ id: "hero", mood: "normal" }, { id: "detective", mood: "thinking" }, { id: "guard", mood: "worried" }]);
  assert.equal(a.checkpoint, true);
  assert.deepEqual(a.clues, ["The guard was asleep."]);
  assert.deepEqual(a.blocks, [
    { kind: "heading", text: "Chapter One" },
    { kind: "para", text: "The hall is dark.\nThe lights hum." },
    { kind: "say", who: "detective", text: "Someone was here." },
    { kind: "say", who: "guard", text: "Not me!" },
    { kind: "para", text: "Note: the lights hum again.\nA draft blows." },
  ]);
  assert.equal(a.choices.length, 2);
  assert.equal(a.choices[1].target, "lose1");
  const b = s.pages[1].gate!;
  assert.equal(b.kind, "mc");
  assert.equal(b.anchor, "RL.1");
  assert.equal(b.answers.filter((x) => x.correct)[0].text, "Someone was here.");
  const c = s.pages[2].gate!;
  assert.equal(c.kind, "order");
  assert.deepEqual(c.items.map((i) => i.text), ["First thing.", "3 cups of second thing.", "Third thing."]);
  assert.deepEqual(s.pages[4].end, { type: "lose", name: "The Cold Case", line: s.pages[4].end!.line });
  assert.equal(r.stats.endings.win, 1);
  assert.equal(r.stats.endings.lose, 1);
  // "worried" is the format example's mood: accepted with a warning, shown as scared.
  assert.ok(r.warnings.some((w) => /worried/.test(w.message)));
  assert.equal(resolveMood("worried"), "scared");
});

test("line numbers in errors", () => {
  const r = checkStory(GOOD.replace("scene: museum-vault\ncast: hero", "scene: moon-base\ncast: hero"));
  const e = r.errors.find((x) => /moon-base/.test(x.message))!;
  assert.ok(e, "unknown scene reported");
  assert.equal(e.page, "b");
  assert.ok(e.line > 15);
});

test("header errors", () => {
  const t = GOOD.replace("genre: mystery", "genre: romance").replace("band: 6-8", "band: 3-4").replace("cover: museum-hall", "cover: mall").replace("author: A\n", "");
  assert.ok(has(t, /genre must be/));
  assert.ok(has(t, /band must be/));
  assert.ok(has(t, /cover "mall"/));
  assert.ok(has(t, /Missing header field "author/));
  assert.ok(has(GOOD.replace("blurb: A short test book.", `blurb: ${"x".repeat(121)}`), /blurb is 121/));
  assert.ok(has(GOOD.replace("start: a", "start: zzz"), /start page "zzz" does not exist/));
  assert.ok(has("title: x\nthis is not a header\n=== a\n", /Header lines look like/));
});

test("unknown character, mood, too many cast", () => {
  assert.ok(has(GOOD.replace("cast: hero\n", "cast: hero, wizard\n"), /Unknown character "wizard"/));
  assert.ok(has(GOOD.replace("cast: detective:happy", "cast: detective:gleeful"), /Unknown mood "gleeful"/));
  assert.ok(has(GOOD.replace("cast: hero\n", "cast: hero, cat, dragon, alien\n"), /4 cast members/));
});

test("bad ids, duplicate and missing pages, bad links", () => {
  assert.ok(has(GOOD.replace("=== c\n", "=== Page_C\n").replace("next: c", "next: Page_C"), /may use only lowercase/));
  assert.ok(has(GOOD + "\n=== b\nscene: cave\nx\nend: win Again\n", /Duplicate page id "b"/));
  assert.ok(has(GOOD.replace("> Go home -> lose1", "> Go home -> nowhere"), /goes to page "nowhere", which does not exist/));
  assert.ok(has(GOOD.replace("next: win1", "next: nope"), /next: goes to page "nope"/));
  assert.ok(has(GOOD.replace("=== b\nscene: museum-vault", "=== b\n"), /needs a "scene:" line/));
  assert.ok(has("=== a\n", /Missing header field/));
});

test("unreachable pages, dead ends and loops", () => {
  const unreachable = GOOD + "\n=== island\nscene: beach\nAlone.\nend: win Lonely\n";
  assert.ok(has(unreachable, /"island" can't be reached/));
  const dead = GOOD.replace("> Go home -> lose1", "> Go home -> stuck") + "\n=== stuck\nscene: cave\nNothing here.\n";
  assert.ok(has(dead, /"stuck" has no way forward/));
  const loop = GOOD.replace("> Go home -> lose1", "> Go home -> l1") + "\n=== l1\nscene: cave\nx\n> on -> l2\n\n=== l2\nscene: cave\ny\n> back -> l1\n";
  assert.ok(has(loop, /"l1" the reader can never reach an ending/));
  assert.ok(has(loop, /"l2" the reader can never reach an ending/));
  // A loop with an exit is fine.
  const okLoop = GOOD.replace("> Go home -> lose1", "> Go home -> l1") + "\n=== l1\nscene: cave\nx\n> on -> l2\n\n=== l2\nscene: cave\ny\n> back -> l1\n> out -> win1\n";
  assert.ok(!has(okLoop, /never reach/));
  assert.ok(has(okLoop, /"lose1" can't be reached/));
});

test("two kinds of ending on one page", () => {
  assert.ok(has(GOOD.replace("You solved it.\n", "You solved it.\n> again -> a\n"), /only ONE of/));
});

test("lose endings not allowed in 4-5", () => {
  assert.ok(has(GOOD.replace("band: 6-8", "band: 4-5"), /Lose endings are not allowed in 4-5/));
  assert.ok(!has(GOOD, /Lose endings/));
  assert.ok(has(GOOD.replace("end: lose The Cold Case", "end: tie The Cold Case"), /win, lose or secret/));
  assert.ok(has(GOOD.replace("end: lose The Cold Case", "end: lose"), /needs a name/));
});

test("gate rules", () => {
  assert.ok(has(GOOD.replace("- Nobody came.", "+ Nobody came."), /exactly one "\+" answer; found 2/));
  assert.ok(has(GOOD.replace("+ Someone was here.", "- Someone was here."), /exactly one "\+" answer; found 0/));
  assert.ok(has(GOOD.replace("- Nobody came.\n- The lights are off.\n", ""), /2–4 answers.*found 1/));
  assert.ok(has(GOOD.replace("- The lights are off.", "- The lights are off.\n- A\n- B"), /found 5/));
  assert.ok(has(GOOD.replace("3 Third thing.\n", ""), /3–5 numbered items; found 2/));
  assert.ok(has(GOOD.replace("hint: Read the detective's line.\n", ""), /needs a "hint:"/));
  assert.ok(has(GOOD.replace("next: c\n", ""), /needs a "next:"/));
  assert.ok(has(GOOD.replace("? RL.1 :", "? XX.9 :"), /Unknown standard anchor "XX.9"/));
  assert.ok(has(GOOD.replace("- Nobody came.", `- ${"n".repeat(71)}`), /Answer is 71 characters/));
  assert.ok(has(GOOD.replace("Look at the case -> b", `${"L".repeat(49)} -> b`), /Choice text is 49 characters/));
  assert.ok(has(GOOD.replace("- Nobody came.", "- Someone was here."), /Duplicate answer/));
  assert.ok(has(GOOD.replace("? RL.1 : What", "What"), /page "b" has no way forward/i) || has(GOOD.replace("? RL.1 : What", "What"), /belongs to a gate|numbered|no way forward/));
  // An anchor written with a grade is normalised, with a warning.
  const r = checkStory(GOOD.replace("? RL.1 :", "? RL.7.1 :"));
  assert.equal(r.story.pages[1].gate!.anchor, "RL.1");
  assert.ok(r.warnings.some((w) => /without the grade/.test(w.message)));
});

test("choices split on the last ->", () => {
  const r = checkStory(GOOD.replace("> Look at the case -> b", '> Say "go -> now" to the guard -> b'));
  assert.equal(r.story.pages[0].choices[0].text, 'Say "go -> now" to the guard');
  assert.equal(r.story.pages[0].choices[0].target, "b");
});

test("choice limits", () => {
  const five = GOOD.replace("> Go home -> lose1", "> Go home -> lose1\n> a -> b\n> b -> b\n> c -> b");
  assert.ok(has(five, /5 choices; the most is 4/));
  assert.ok(has(GOOD.replace("> Go home -> lose1", "> Go home"), /choice looks like/));
});

test("serializer round-trips with the parser", () => {
  const strip = (s: Story) => JSON.parse(JSON.stringify(s, (k, v) => (k === "line" || k === "headerLines" || k === "hintLine" || k === "nextLine" ? undefined : v)));
  for (const text of [GOOD]) {
    const a = parseStory(text).story;
    const out = serializeStory(a);
    const b = parseStory(out).story;
    assert.deepEqual(strip(b), strip(a));
    assert.equal(serializeStory(b), out, "serialize is stable");
  }
});

test("draft (Writer's Desk) round-trips", () => {
  const s = parseStory(GOOD).story;
  const d = draftFromStory(s);
  const text = draftToText(d);
  const again = parseStory(text).story;
  assert.equal(serializeStory(again), serializeStory(s));
  const fresh = newDraft();
  const r = checkStory(draftToText(fresh));
  assert.deepEqual(r.errors.map((e) => e.message), []);
});

test("readability", () => {
  assert.equal(countSyllables("cat"), 1);
  assert.equal(countSyllables("table"), 2);
  assert.equal(countSyllables("library"), 3);
  assert.equal(countSyllables("jumped"), 1);
  const easy = readability("The cat sat. The dog ran. We had fun.");
  const hard = readability("The investigation revealed extraordinary inconsistencies in the testimony, complicating the detective's preliminary conclusions considerably.");
  assert.ok(easy.grade < 2, `easy ${easy.grade}`);
  assert.ok(hard.grade > 12, `hard ${hard.grade}`);
  assert.equal(readability("Mr. Pell ran. Dr. Ko waited... then left.").sentences, 2);
});

test("standards for the player's grade", () => {
  assert.deepEqual(standardFor("RL.3", 4).code, "RL.4.3");
  assert.deepEqual(standardFor("RL.3", 7).code, "RL.7.3");
  assert.deepEqual(standardFor("RL.3", 9).code, "RL.9-10.3");
  assert.deepEqual(standardFor("RL.3", 10).code, "RL.9-10.3");
  assert.deepEqual(standardFor("RL.3", 12).code, "RL.11-12.3");
  assert.deepEqual(standardFor("L.4", 11).code, "L.11-12.4");
  assert.deepEqual(standardFor("RF.4", 5).code, "RF.5.4");
  assert.deepEqual(standardFor("RF.3", 8).code, "L.8.4");
  assert.ok(standardFor("RL.5", 6).skill.length > 3);
});

// ---- Reading session rules (losing depends on the player's grade) ----
const book = parseStory(GOOD).story;
function toGate(run: RunState): RunState {
  return advance(book, run, 0); // a -> b (the multiple-choice gate)
}

test("grade 7: wrong answers cost hearts; 0 hearts = lose, restart at checkpoint", () => {
  let run = toGate(newRun(book, 7));
  assert.equal(run.page, "b");
  assert.equal(run.hearts, 3);
  const g = run.gate!;
  const wrong = g.order.findIndex((i) => !book.pages[1].gate!.answers[i].correct);
  let res = answerMc(book, run, wrong, 7);
  assert.equal(res.result, "wrong");
  assert.equal(res.run.hearts, 2);
  res = answerMc(book, res.run, wrong, 7);
  res = answerMc(book, res.run, wrong, 7);
  assert.equal(res.result, "lose");
  assert.equal(res.run.hearts, 0);
  assert.equal(res.run.checkpoint, "a");
});

test("grade 4: never loses; second miss reveals the answer", () => {
  let run = toGate(newRun(book, 4));
  const g = run.gate!;
  const wrong = g.order.findIndex((i) => !book.pages[1].gate!.answers[i].correct);
  let res = answerMc(book, run, wrong, 4);
  assert.equal(res.result, "wrong");
  res = answerMc(book, res.run, wrong, 4);
  assert.equal(res.result, "reveal");
  assert.equal(res.run.hearts, 3);
  run = res.run;
  assert.equal(run.log[0].correct, false);
});

test("order gate taps", () => {
  let run = toGate(newRun(book, 7));
  const right = run.gate!.order.findIndex((i) => book.pages[1].gate!.answers[i].correct);
  run = answerMc(book, run, right, 7).run;
  assert.equal(run.log[0].correct, true);
  assert.equal(run.log[0].standard, "RL.7.1");
  run = advance(book, run, 0);
  assert.equal(run.page, "c");
  const order = run.gate!.order;
  for (let step = 0; step < 3; step++) {
    const r = tapOrder(book, run, order.indexOf(step), 7);
    run = r.run;
  }
  assert.equal(run.gate!.status, "solved");
  assert.equal(run.log[1].standard, "RL.7.5");
  assert.equal(run.log[1].correct, true);
  run = advance(book, run, 0);
  assert.equal(run.page, "win1");
});

test("roster: zombie, astronaut, frozen mood and cryo-bay scene", () => {
  assert.equal(charByName("Zombie"), "zombie");
  assert.equal(charByName("Astronaut"), "astronaut");
  assert.ok((MOODS as readonly string[]).includes("frozen"));
  assert.ok((SCENES as readonly string[]).includes("cryo-bay"));
  assert.equal(resolveMood("frozen"), "frozen");
  assert.equal(resolveMood("icy"), "frozen");
  const r = checkStory(`${HEAD("6-8")}
=== a
scene: cryo-bay
cast: hero, astronaut:frozen, zombie:happy
checkpoint
Zombie: Mmm... snacks.
end: win W
`);
  assert.deepEqual(r.errors, []);
  assert.deepEqual(r.warnings, []);
});

test("sprites: every character's grid is 16 wide, uses known colours, and freezes", () => {
  for (const c of CHARACTERS) {
    const def = SPRITES[c.id];
    assert.ok(def, c.id);
    const colors = { ...KEYS, ...(def.colors ?? {}) };
    for (const frame of [def.rows, def.alt ?? []]) {
      for (const row of frame) {
        assert.equal(row.length, 16, `${c.id} row "${row}"`);
        for (const k of row) assert.ok(k === "." || k in colors, `${c.id}: unknown colour key "${k}"`);
      }
    }
    for (const mood of MOODS) {
      const rows = faceRows(def, false, mood, false, false);
      assert.equal(rows.length, def.rows.length, `${c.id} ${mood}`);
      for (const row of rows) for (const k of row) assert.ok(k === "." || k in colors, `${c.id} ${mood}: key "${k}"`);
    }
    // Frozen: only ice blues, black outlines and white glints; eyes shut (no black eye pixel).
    const frozen = faceRows(def, true, "frozen", false, true);
    for (const row of frozen) for (const k of row) assert.ok(".KIijW".includes(k), `${c.id} frozen: key "${k}"`);
    const f = def.face;
    if (f) for (const ex of f.ex) assert.notEqual(frozen[f.ey][ex], f.eye ?? "K", `${c.id} frozen eyes should be closed`);
  }
  assert.ok(EMOTES.frozen.rows.length === 5);
});

test("fantasy genre: mentor, agent, sphinx, griffin, minotaur and the new scenes", () => {
  assert.ok((GENRES as readonly string[]).includes("fantasy"));
  for (const [name, id] of [["Mentor", "mentor"], ["Agent", "agent"], ["Sphinx", "sphinx"], ["Griffin", "griffin"], ["Minotaur", "minotaur"]]) {
    assert.equal(charByName(name), id);
    assert.ok(SPRITES[id as keyof typeof SPRITES], `${id} has a sprite`);
  }
  for (const sc of ["academy-hall", "secret-hq", "temple-ruins", "labyrinth"]) {
    assert.ok((SCENES as readonly string[]).includes(sc), sc);
    assert.ok(SCENE_PAINTERS[sc as keyof typeof SCENE_PAINTERS], `${sc} has a painter`);
  }
  const text = `${HEAD("6-8")}
=== a
scene: academy-hall
cast: hero, mentor:happy, griffin:surprised
checkpoint
Mentor: Welcome.
Griffin: Skree!
> Go to the ruins -> b

=== b
scene: temple-ruins
cast: sphinx:thinking, minotaur:scared, agent:frozen
Sphinx: A riddle!
Minotaur: Oh no.
> Into the maze -> c
> To headquarters -> d

=== c
scene: labyrinth
cast: hero, minotaur:happy
Minotaur: Out at last!
end: win W

=== d
scene: secret-hq
cast: hero, agent:angry
Agent: Cover blown.
end: lose L
`.replace("genre: mystery", "genre: fantasy");
  const r = checkStory(text);
  assert.deepEqual(r.errors, []);
  assert.deepEqual(r.warnings, []);
  assert.equal(r.story.genre, "fantasy");
  // the Writer's Desk keeps the genre through a draft round-trip
  const d = draftFromText(text);
  assert.equal(d.header.genre, "fantasy");
  assert.ok(/genre: fantasy/.test(draftToText(d)));
});

test("robots genre: seven robot types, their faces, the new scenes and the Writer's Desk", () => {
  assert.ok((GENRES as readonly string[]).includes("robots"));
  const ROBOTS: [string, string][] = [
    ["Helperbot", "helperbot"], ["Retrobot", "retrobot"], ["Drone", "drone"], ["Rover", "rover"],
    ["Fixbot", "fixbot"], ["Mech", "mech"], ["Robodog", "robodog"],
  ];
  const looks = new Set<string>();
  for (const [name, id] of ROBOTS) {
    assert.equal(charByName(name), id);
    const def = SPRITES[id as keyof typeof SPRITES];
    assert.ok(def, `${id} has a sprite`);
    // Every robot shows moods on its face: eyes and mouth sit on the face's skin colour.
    const f = def.face;
    assert.ok(f && f.mx !== undefined && f.my !== undefined, `${id} has eyes and a mouth`);
    for (const ex of f.ex) for (let x = 0; x < (f.ew ?? 1); x++) assert.equal(def.rows[f.ey][ex + x], f.skin, `${id}: eye at ${ex + x},${f.ey} is on the face`);
    for (const dx of [0, 1]) assert.equal(def.rows[f.my!][f.mx! + dx], f.skin, `${id}: mouth on the face`);
    // Happy, sad and angry faces really differ from each other (the face changes with the mood).
    const frames = (["normal", "happy", "sad", "angry", "surprised"] as const).map((m) => faceRows(def, false, m, false, false).join("/"));
    assert.equal(new Set(frames).size, frames.length, `${id}: every mood draws a different face`);
    // Dark-screen robots draw brows in a colour that shows up on the screen.
    if (f.brow) assert.ok(f.brow in { ...KEYS, ...(def.colors ?? {}) }, `${id}: brow colour exists`);
    looks.add(def.rows.join("/"));
  }
  assert.equal(looks.size, ROBOTS.length, "each robot type has its own design");
  // Two-frame robots (the drone's rotors, the robodog's tail) keep the same size in both frames.
  for (const id of ["drone", "robodog"] as const) assert.equal(SPRITES[id].alt?.length, SPRITES[id].rows.length, `${id} alt frame`);
  const NEW_SCENES = ["robot-workshop", "factory-floor", "robot-arena", "recycling-center", "rooftop-night", "bakery"];
  for (const sc of NEW_SCENES) {
    assert.ok((SCENES as readonly string[]).includes(sc), sc);
    assert.ok(SCENE_PAINTERS[sc as keyof typeof SCENE_PAINTERS], `${sc} has a painter`);
  }
  const text = `${HEAD("6-8")}
=== a
scene: robot-workshop
cast: hero, helperbot:happy, retrobot:thinking
checkpoint
Helperbot: Beep!
Retrobot: GREETINGS.
> To the factory -> b

=== b
scene: factory-floor
cast: drone:surprised, rover:sad, fixbot:angry
Drone: Bzzz!
Rover: Recalculating.
Fixbot: Fix fix!
> To the arena -> c
> To the bakery -> d

=== c
scene: robot-arena
cast: hero, mech:happy, robodog:scared
Mech: THOOM.
Robodog: Bork!
> Recycle -> e
> Rooftop -> f

=== d
scene: bakery
cast: helperbot:frozen, mech:frozen, robodog:frozen
Brr.
end: lose L

=== e
scene: recycling-center
cast: rover:happy
Rover: Sorted.
end: secret S

=== f
scene: rooftop-night
cast: hero, drone:happy
Drone: Stars!
end: win W
`.replace("genre: mystery", "genre: robots");
  const r = checkStory(text);
  assert.deepEqual(r.errors, []);
  assert.deepEqual(r.warnings, []);
  assert.equal(r.story.genre, "robots");
  // the Writer's Desk keeps the genre, the robot cast and the new scenes through a round-trip
  const d = draftFromText(text);
  assert.equal(d.header.genre, "robots");
  const back = draftToText(d);
  assert.ok(/genre: robots/.test(back));
  for (const id of ["helperbot", "retrobot", "drone", "rover", "fixbot", "mech", "robodog"]) assert.ok(new RegExp(`\\b${id}\\b`).test(back), `${id} survives the draft round-trip`);
  for (const sc of NEW_SCENES) assert.ok(back.includes(`scene: ${sc}`), `${sc} survives the draft round-trip`);
  assert.deepEqual(checkStory(back).errors, []);
});


// ---- Subjects: the library's picker, QUIZ gates and transmissions ----

// localStorage for Node (the picker and kit progress persist through it).
const store = new Map<string, string>();
(globalThis as unknown as { localStorage: Storage }).localStorage = {
  getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
  setItem: (k: string, v: string) => void store.set(k, String(v)),
  removeItem: (k: string) => void store.delete(k),
  clear: () => store.clear(),
  key: (i: number) => [...store.keys()][i] ?? null,
  get length() { return store.size; },
} as Storage;

// The kit's written banks, loaded from their files (kit/banks/index.ts uses import.meta.glob, which Node lacks).
const bankDir = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../src/kit/banks");
const BANK: Record<string, Partial<Record<Grade, Question[]>>> = { science: {}, ela: {}, social: {} };
for (const subj of Object.keys(BANK)) {
  for (const f of fs.readdirSync(path.join(bankDir, subj))) {
    const m = /^g(K|\d+)\.ts$/.exec(f);
    if (m) BANK[subj][m[1] as Grade] = ((await import(pathToFileURL(path.join(bankDir, subj, f)).href)) as { default: Question[] }).default;
  }
}
const bankFor: BankSource = (subject, grade) => BANK[subject][grade] ?? [];

const QUIZ_STORY = `${HEAD("6-8")}
=== a
scene: reef
cast: hero, quill, whaleshark:happy
checkpoint
Quill: Before we go on!
? QUIZ : Before we go on, a quick challenge!
next: b

=== b
scene: research-boat
cast: biologist, hammerhead, greatwhite:frozen
checkpoint
Biologist: Two more.
? QUIZ
next: c

=== c
scene: deep-sea
cast: hero
The end.
end: win W
`;

test("QUIZ gates: parse, validate, serialize and the Writer's Desk", () => {
  const r = checkStory(QUIZ_STORY);
  assert.deepEqual(r.errors.map((e) => e.message), []);
  assert.deepEqual(r.warnings.map((e) => e.message), []);
  const g = r.story.pages[0].gate!;
  assert.equal(g.kind, "quiz");
  assert.equal(g.question, "Before we go on, a quick challenge!");
  assert.equal(r.story.pages[1].gate!.question, "", "the lead-in is optional");
  assert.deepEqual(r.stats.gates, { mc: 0, order: 0, quiz: 2 });
  // Written answers, order items or a missing next: are errors; a hint is a warning (unused).
  assert.ok(has(QUIZ_STORY.replace("? QUIZ\n", "? QUIZ\n+ 4\n- 5\n"), /QUIZ gate has no written answers/));
  assert.ok(has(QUIZ_STORY.replace("? QUIZ\n", "? QUIZ\n1 one\n"), /QUIZ gate has no order items/));
  assert.ok(has(QUIZ_STORY.replace("next: b\n", ""), /QUIZ gate needs a "next:"/));
  assert.ok(checkStory(QUIZ_STORY.replace("? QUIZ\n", "? QUIZ\nhint: no\n")).warnings.some((w) => /hint is not used/.test(w.message)));
  // A story gate written as before still parses as a story gate.
  assert.equal(parseStory(GOOD).story.pages[1].gate!.kind, "mc");
  // Round trips: serializer and Writer's Desk draft keep the QUIZ gates.
  const text = serializeStory(r.story);
  assert.ok(text.includes("? QUIZ : Before we go on, a quick challenge!") && /\? QUIZ\nnext: c/.test(text));
  assert.equal(serializeStory(parseStory(text).story), text);
  const d = draftFromText(QUIZ_STORY);
  assert.equal(d.pages[0].gate.kind, "quiz");
  assert.equal(serializeStory(parseStory(draftToText(d)).story), text);
});

test("subject picker: saved per player, ?topic= / ?subject= from the menu", () => {
  store.clear();
  assert.equal(loadSubject(), "mixed", "MIXED is the default");
  saveSubject("science");
  assert.equal(store.get(SUBJECT_KEY), "science");
  assert.equal(SUBJECT_KEY, "arcade.page-quest.subject");
  assert.equal(loadSubject(), "science");
  store.set(SUBJECT_KEY, "nonsense");
  assert.equal(loadSubject(), "mixed", "an unknown stored value is MIXED");
  saveSubject("social");
  assert.deepEqual(initialSubject(""), { subject: "social", fromMenu: false });
  assert.deepEqual(initialSubject("?grade=7&topic=math-mix"), { subject: "math", fromMenu: true });
  assert.equal(subjectFromParams("?topic=science-mix"), "science");
  assert.equal(subjectFromParams("?topic=social-mix"), "social");
  assert.equal(subjectFromParams("?topic=reading"), "reading");
  assert.equal(subjectFromParams("?topic=writing"), "reading");
  assert.equal(subjectFromParams("?subject=ela"), "reading");
  assert.equal(subjectFromParams("?subject=mixed"), "mixed");
  assert.equal(subjectFromParams("?topic=geometry"), null, "topics Page Quest doesn't list are ignored");
  assert.equal(loadSubject(), "social", "a menu topic doesn't overwrite the saved choice");
  assert.deepEqual(subjectsFor("reading"), ["ela"]);
  assert.deepEqual(subjectsFor("mixed"), ["math", "science", "ela", "social"]);
});

test("QUIZ questions come from the chosen subject's bank at the player's grade", () => {
  store.clear();
  store.set("arcade.adaptiveMath", "0"); // adaptive off: math is generated at exactly the player's grade
  for (const grade of ["4", "5", "7", "9", "12"] as Grade[]) {
    for (const [mode, subject] of [["science", "science"], ["social", "social"], ["reading", "ela"], ["math", "math"]] as const) {
      const deck = new SubjectDeck(grade, mode, bankFor, { gameId: "pq-test" });
      const own = new Set((subject === "math" ? [] : bankFor(subject, grade)).map((q) => q.id));
      for (let i = 0; i < 12; i++) {
        const q = deck.draw();
        assert.equal(q.subject, subject, `${mode} at grade ${grade}`);
        assert.equal(q.grade, grade, `${mode} at grade ${grade}: question grade ${q.grade}`);
        if (subject !== "math") assert.ok(own.has(q.id), `${q.id} is from the grade ${grade} ${subject} bank`);
        assert.equal(q.choices.length, 4);
        assert.ok(q.answer >= 0 && q.answer < 4 && q.explanation.length > 0);
      }
    }
  }
  // Written items don't repeat until the pool is used up.
  const deck = new SubjectDeck("6", "science", bankFor, { gameId: "pq-test" });
  const ids = Array.from({ length: 30 }, () => deck.draw().id);
  assert.equal(new Set(ids).size, 30);
  // A grade with too few items borrows from its neighbours (never runs dry).
  const thin: BankSource = (s, g) => (g === "7" ? bankFor(s, g).slice(0, 3) : bankFor(s, g));
  assert.ok(writtenPool(thin, "science", "7").length >= 8);
  // Adaptive math on: the grade follows the player's math level (within 2 grades).
  store.set("arcade.adaptiveMath", "1");
  store.set("arcade.mathLevel.7", "8");
  const adaptive = new SubjectDeck("7", "math", bankFor, { gameId: "pq-test" });
  for (let i = 0; i < 10; i++) assert.equal(adaptive.draw().grade, "8");
  store.clear();
});

test("MIXED rotates subjects across QUIZ gates and transmissions", () => {
  store.clear();
  const deck = new SubjectDeck("7", "mixed", bankFor, { gameId: "pq-test", start: 0 });
  assert.deepEqual(deck.subjects, MIXED_ROTATION);
  // In a read, QUIZ gates and checkpoint transmissions take turns from the same deck.
  const drawn: Subject[] = [];
  for (let i = 0; i < 8; i++) drawn.push(deck.draw().subject);
  assert.deepEqual(drawn, ["math", "science", "ela", "social", "math", "science", "ela", "social"]);
  const later = new SubjectDeck("7", "mixed", bankFor, { gameId: "pq-test", start: 2 });
  assert.equal(later.peek(), "ela");
  assert.deepEqual([later.draw().subject, later.draw().subject, later.draw().subject], ["ela", "social", "math"]);
  // One subject: transmissions use it too (no more ELA-only transmissions).
  const sci = new SubjectDeck("7", "science", bankFor, { gameId: "pq-test" });
  for (let i = 0; i < 5; i++) assert.equal(sci.draw().subject, "science");
});

const FIXED_Q: DealtQuestion = {
  id: "t-1", subject: "science", grade: "7", standard: "LS.7.1.1", skill: "Cells", prompt: "Which is a cell part?",
  choices: ["Nucleus", "Planet", "Comet", "Volcano"], answer: 0, explanation: "The nucleus holds the cell's DNA.",
};

test("QUIZ gates follow the grade rules (hearts for 6-12, gentle for 4-5)", () => {
  const quizBook = parseStory(QUIZ_STORY).story;
  for (const grade of [7, 11]) {
    let run = newRun(quizBook, grade);
    assert.equal(run.gate!.quiz, null, "the question is drawn at play time");
    assert.equal(answerMc(quizBook, run, 0, grade).result, "ignored", "no answers before a question is drawn");
    run = setQuiz(quizBook, run, FIXED_Q);
    assert.equal(setQuiz(quizBook, run, { ...FIXED_Q, id: "other" }).gate!.quiz!.id, "t-1", "drawn once per visit");
    assert.equal(correctIndex(quizBook, run), 0);
    let res = answerMc(quizBook, run, 2, grade);
    assert.equal(res.result, "wrong");
    assert.equal(res.run.hearts, 2, "a wrong subject answer costs a heart at grades 6-12");
    res = answerMc(quizBook, res.run, 0, grade);
    assert.equal(res.result, "right");
    assert.equal(res.run.score, 25);
    assert.deepEqual(res.run.log, [{ standard: "LS.7.1.1", skill: "Cells", correct: false, kind: "quiz", page: "a", subject: "science" }]);
    // Three wrong answers: THE END? (back to the checkpoint with full hearts).
    let r2 = setQuiz(quizBook, newRun(quizBook, grade), FIXED_Q);
    for (const d of [1, 2]) r2 = answerMc(quizBook, r2, d, grade).run;
    assert.equal(answerMc(quizBook, r2, 3, grade).result, "lose");
  }
  for (const grade of [4, 5]) {
    let run = setQuiz(quizBook, newRun(quizBook, grade), FIXED_Q);
    let res = answerMc(quizBook, run, 1, grade);
    assert.equal(res.result, "wrong", "first miss: the explanation as Quill's hint");
    assert.equal(res.run.hearts, 3, "no hearts at grades 4-5");
    res = answerMc(quizBook, res.run, 2, grade);
    assert.equal(res.result, "reveal", "second miss: the answer is shown");
    assert.equal(res.run.log[0].kind, "quiz");
    assert.equal(res.run.log[0].correct, false);
    run = advance(quizBook, res.run, 0);
    assert.equal(run.page, "b", "the story goes on");
    run = setQuiz(quizBook, run, { ...FIXED_Q, id: "t-2" });
    res = answerMc(quizBook, run, 0, grade);
    assert.equal(res.result, "right");
    assert.equal(res.run.score, 100, "right first try +100");
    assert.equal(res.run.log[1].correct, true);
  }
});

test("the shark adventures can be read to a win and a secret ending", () => {
  const dir = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../src/stories");
  for (const band of ["4-5", "6-8", "9-12"]) {
    const r = checkStory(fs.readFileSync(path.join(dir, band, "adventure-sharks.story"), "utf8"));
    assert.deepEqual(r.errors.map((e) => e.message), [], band);
    const story = r.story;
    const byId = new Map(story.pages.map((p) => [p.id, p]));
    // Breadth-first: the path to each ending.
    const prev = new Map<string, string | null>([[story.start, null]]);
    const queue = [story.start];
    while (queue.length) {
      const id = queue.shift()!;
      for (const x of exits(byId.get(id)!)) if (!prev.has(x)) { prev.set(x, id); queue.push(x); }
    }
    for (const type of ["win", "secret", ...(band === "4-5" ? [] : ["lose"])]) {
      const end = story.pages.find((p) => p.end?.type === type && prev.has(p.id));
      assert.ok(end, `${band}: a reachable ${type} ending`);
      const route: string[] = [];
      for (let id: string | null = end!.id; id; id = prev.get(id) ?? null) route.unshift(id);
      // Play the route with the session rules at grade 7, answering every gate right.
      let run = newRun(story, 7);
      for (let i = 1; i < route.length; i++) {
        const p = byId.get(run.page)!;
        if (p.gate) {
          if (p.gate.kind === "quiz") run = setQuiz(story, run, FIXED_Q);
          if (p.gate.kind === "order") for (let k = 0; k < p.gate.items.length; k++) run = tapOrder(story, run, run.gate!.order.indexOf(k), 7).run;
          else run = answerMc(story, run, correctIndex(story, run), 7).run;
          assert.equal(run.gate!.status, "solved", `${band} ${p.id}`);
          run = advance(story, run, 0);
        } else run = advance(story, run, p.choices.findIndex((c) => c.target === route[i]));
        assert.equal(run.page, route[i], `${band}: ${route[i - 1]} -> ${route[i]}`);
      }
      assert.equal(byId.get(run.page)!.end!.type, type);
      assert.equal(run.hearts, 3);
    }
    assert.ok(story.pages.filter((p) => p.gate?.kind === "quiz").length >= 2, `${band}: QUIZ gates`);
  }
});

test("ocean art: reef, research boat and deep sea scenes; sharks and a marine biologist", () => {
  for (const sc of ["reef", "research-boat", "deep-sea"]) {
    assert.ok((SCENES as readonly string[]).includes(sc), sc);
    assert.ok(SCENE_PAINTERS[sc as keyof typeof SCENE_PAINTERS].anim, `${sc} is animated`);
  }
  for (const [name, id] of [["Whaleshark", "whaleshark"], ["Hammerhead", "hammerhead"], ["Greatwhite", "greatwhite"], ["Biologist", "biologist"]] as const) {
    assert.equal(charByName(name), id);
    const def = SPRITES[id];
    assert.ok(def.face && def.face.mx !== undefined, `${id} has a face`);
    const frames = MOODS.map((m) => faceRows(def, false, m, false, false).join("/"));
    assert.equal(new Set(frames).size, frames.length, `${id}: every mood looks different`);
    if (id !== "biologist") {
      assert.ok(def.float && def.alt && def.alt.length === def.rows.length, `${id} swims with a tail swish`);
      assert.ok(Number.isInteger(def.scale) && def.scale! >= 2, `${id} is drawn big`);
    }
  }
});

console.log(`test-story: ${passed} tests passed`);
