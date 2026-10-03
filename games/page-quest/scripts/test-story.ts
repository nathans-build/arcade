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
import { draftFromStory, draftToText, newDraft } from "../src/writer/draft";
import { advance, answerMc, newRun, tapOrder, type RunState } from "../src/play/session";
import { CHARACTERS, MOODS, SCENES, charByName } from "../src/story/roster";
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

console.log(`test-story: ${passed} tests passed`);
