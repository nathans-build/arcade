/*
 * Automated playtest (dev only). Needs the built game served at /lost-library/ with the arcade's
 * /fonts/ next to it, and a global Playwright (Chromium):
 *   npm run build
 *   (serve a folder holding lost-library -> dist and fonts -> ../../site/fonts on port 8844, or set BASE)
 *   node scripts/playtest.cjs          (SHOT=../../site/img/lost-library.png saves a 640x400 Math Wing picture)
 *
 * Desktop (1280x800, keyboard), for grade 2 and grade 6, from a fresh save:
 *   title shows the grade badge (no grade picker), the Press Start 2P font loads, read-aloud is on by
 *   default for grade 2 and off for grade 6; Enter starts; the arrow keys walk Pip Lampwick through
 *   Bramblebury Square and the Abacus Orchard into the Math Wing; A-D and 1-4 never move him; in Crate
 *   Corner the crates are pushed onto both switches (keys only) and the small key appears and is picked
 *   up; the Question Door is answered wrong (stays shut, explanation, no heart lost, a new question)
 *   and then right (opens); the wing map is picked up; the key opens the locked door; Z dusts; both
 *   torches are lit with X and the chest gives the Bookmark Boomerang; the page is reloaded and
 *   CONTINUE brings back the same room and progress; then the debug hook skips to the Reading Room,
 *   the Ink Smudge's questions are answered (one wrong, then right) and the ending screen shows.
 * Phone (390x844, touch, grade 2): the touch pad shows, the d-pad walks, DUST and MAP work, a
 * Question Door is answered by tapping; no sideways scroll at 390px and on the title at 360px.
 * Topic links: ?topic=history picks Social Studies -> History, ?topic=math-mix picks ALL MATH, and without
 * ?grade= the title shows its own K-12 grade picker.
 * Choose your quest (desktop, grade 5, keyboard): the picker shows five quest cards (title, live preview,
 * progress, START / CONTINUE / NEW); a Lost Library save is made first; then each new quest is started
 * from its card, Pip walks from the hub through the first wing's gate, bumps its Question Door, answers
 * it wrong (stays shut, no heart lost, a new question of the wing's subject) then right (opens), walks
 * through, and goes back to the picker from the pause menu, where the card now shows CONTINUE. The
 * Lost Library's save is byte-for-byte untouched and CONTINUE brings it back.
 * Choose your quest (phone 390x844, touch, grade 2): MUSIC and SFX toggle by tapping on the picker and
 * while a message covers the game (the toolbar stays on top); each new quest is started by tapping its
 * card, walked with the touch d-pad into its first wing, its Question Door answered by tapping (wrong,
 * then right); no sideways scroll; back to the picker with MAP and "Choose quest".
 * Everywhere: no console errors and no requests outside this server.
 */
const path = require("path");
const fs = require("fs");
const { execSync } = require("child_process");
const { chromium } = require(path.join(execSync("npm root -g").toString().trim(), "playwright"));

const BASE = process.env.BASE || "http://127.0.0.1:8844/lost-library/";
const ORIGIN = new URL(BASE).origin + "/";
const GRADES = (process.env.GRADES || "2,6").split(",");
const SHOT = process.env.SHOT;

const KEY = { up: "ArrowUp", down: "ArrowDown", left: "ArrowLeft", right: "ArrowRight" };

const st = (page) =>
  page.evaluate(() => {
    const g = window.__ll.game;
    if (!g) return null;
    return {
      room: g.s.at.room, area: g.s.at.area, x: g.s.at.x, y: g.s.at.y, facing: g.s.at.facing, hearts: g.s.hearts, max: g.maxHearts,
      keys: { ...g.s.keys }, items: [...g.s.items], opened: [...g.s.opened], solved: [...g.s.solved], maps: [...g.s.maps], books: [...g.s.books],
      lit: [...g.s.lit], taken: [...g.s.taken], sig: g.progSig(), selected: g.s.selected,
    };
  });
const quiz = (page) => page.evaluate(() => (window.__ll.quiz ? { kind: window.__ll.quiz.kind, answer: window.__ll.quiz.q.answer, picked: window.__ll.quiz.picked, prompt: window.__ll.quiz.q.prompt, subject: window.__ll.quiz.q.subject, done: window.__ll.quiz.done } : null));

async function noSideways(page) {
  return page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth && document.body.scrollWidth <= window.innerWidth);
}

/** Waits for the walk animation, then closes any message boxes (never a question). */
async function settle(page) {
  for (let i = 0; i < 40; i++) {
    const o = await page.evaluate(() => ({ ov: !!window.__ll.overlay, t: window.__ll.game ? window.__ll.game.anim.t : 1, q: !!window.__ll.quiz }));
    if (o.q) return;
    if (o.ov) {
      await page.keyboard.press("Enter");
      await page.waitForTimeout(90);
      continue;
    }
    if (o.t < 1) {
      await page.waitForTimeout(30);
      continue;
    }
    return;
  }
}

/** One step with the arrow keys (a short press is one tile). */
async function step(page, dir) {
  await page.keyboard.down(KEY[dir]);
  await page.waitForTimeout(45);
  await page.keyboard.up(KEY[dir]);
  await page.waitForTimeout(20);
  await settle(page);
}

async function walkTo(page, x, y, problems, label) {
  const plan = await page.evaluate(([x, y]) => window.__ll.pathTo(x, y), [x, y]);
  if (!plan) {
    problems.push(`${label}: no path to (${x},${y})`);
    return false;
  }
  for (const d of plan) await step(page, d);
  const s = await st(page);
  if (s.x !== x || s.y !== y) {
    problems.push(`${label}: walked to (${s.x},${s.y}) in ${s.room}, wanted (${x},${y})`);
    return false;
  }
  return true;
}

async function newPage(browser, opts) {
  const ctx = await browser.newContext(opts);
  const page = await ctx.newPage();
  const errors = [];
  const external = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  page.on("request", (r) => {
    if (!r.url().startsWith(ORIGIN) && !r.url().startsWith("data:") && !r.url().startsWith("blob:")) external.push(r.url());
  });
  return { ctx, page, errors, external };
}

async function answerQuiz(page, right) {
  const q = await quiz(page);
  const i = right ? q.answer : (q.answer + 1) % 4;
  // Wrong answers with letters, right ones with numbers: both work.
  await page.keyboard.press(right ? String(i + 1) : "abcd"[i]);
  await page.waitForTimeout(120);
  return q;
}

async function desktop(browser, grade) {
  const { ctx, page, errors, external } = await newPage(browser, { viewport: { width: 1280, height: 800 } });
  const problems = [];
  await page.goto(`${BASE}?grade=${grade}&debug`, { waitUntil: "load" });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: "load" });
  await page.waitForFunction(() => !!window.__ll);

  const badge = await page.locator(".ll-gradebadge").innerText().catch(() => "");
  if (!badge.includes(`GRADE ${grade}`)) problems.push(`badge "${badge}"`);
  if ((await page.locator(".ll-grade").count()) !== 0) problems.push("grade picker shown although ?grade= was given");
  const fontsOk = await page.evaluate(async () => { await document.fonts.ready; return document.fonts.check('12px "Press Start 2P"'); });
  if (!fontsOk) problems.push("Press Start 2P font not loaded from /fonts/");
  const ra = await page.locator(".ll-tools button[aria-pressed]", { hasText: "READ ALOUD" }).first().innerText().catch(() => null);
  if (ra !== null) {
    const want = grade === "2" ? "READ ALOUD ON" : "READ ALOUD OFF";
    if (!ra.includes(want)) problems.push(`read-aloud default "${ra}", want ${want}`);
  }
  if ((await page.locator(".ll-subject").count()) !== 5) problems.push("subject picker should have 5 choices");
  if (!(await page.locator('.ll-subject[data-subject="mixed"].on').count())) problems.push("MIXED is not the default subject");
  if (!(await noSideways(page))) problems.push("sideways scroll on the title screen");

  // Start (Enter), read the intro.
  await page.keyboard.press("Enter");
  await page.waitForFunction(() => window.__ll.screen === "playing" && !!window.__ll.game);
  if (!(await page.locator(".ll-dialog").count())) problems.push("no intro message");
  await settle(page);
  if ((await page.locator(".ll-controls.show").count())) problems.push("touch controls shown on desktop");
  if (!(await page.locator(".ll-hud .hearts").count())) problems.push("no hearts in the HUD");
  let s = await st(page);
  if (s.room !== "h-square") problems.push(`starts in ${s.room}`);

  // A-D and 1-4 are never movement.
  for (const k of ["a", "b", "c", "d", "1", "2"]) await page.keyboard.press(k);
  await page.waitForTimeout(150);
  const s2 = await st(page);
  if (s2.x !== s.x || s2.y !== s.y) problems.push("A-D / 1-4 moved the hero");

  // Walk through town into the Math Wing.
  await walkTo(page, 1, 5, problems, "square");
  await step(page, "left");
  await step(page, "left");
  s = await st(page);
  if (s.room !== "h-math") problems.push(`walking west from the square reached ${s.room}`);
  await walkTo(page, 4, 4, problems, "orchard");
  await step(page, "up");
  s = await st(page);
  if (s.room !== "m1") problems.push(`the Math Wing gate led to ${s.room}`);

  // Counting Hall -> Crate Corner.
  await walkTo(page, 18, 5, problems, "m1");
  await step(page, "right");
  await step(page, "right");
  s = await st(page);
  if (s.room !== "m2") problems.push(`east door of m1 reached ${s.room}`);
  // Push both crates onto the switches (keys only).
  const plan = await page.evaluate(() => window.__ll.blocksPlan());
  if (!plan) problems.push("no crate plan for m2");
  else {
    const before = await page.evaluate(() => window.__ll.game.blocks.map((b) => b.join()).join(";"));
    let shot = !(SHOT && grade === GRADES[GRADES.length - 1]);
    for (let i = 0; i < plan.length; i++) {
      await step(page, plan[i]);
      // The arcade screenshot: Crate Corner at the first push (grade 3+ shows the real ink puddles).
      if (!shot && (await page.evaluate(() => window.__ll.game.blocks.map((b) => b.join()).join(";"))) !== before) {
        shot = true;
        await saveShot(page, SHOT);
      }
    }
    const after = await page.evaluate(() => window.__ll.game.blocks.map((b) => b.join()).join(";"));
    s = await st(page);
    if (before === after) problems.push("crates did not move");
    if (!s.solved.includes("m2")) problems.push("crates are not on the switches");
  }
  // The small key appeared at (10,8): pick it up.
  await walkTo(page, 10, 8, problems, "m2 key");
  s = await st(page);
  if (s.keys.math !== 1) problems.push(`small key not picked up (keys ${s.keys.math})`);

  // The Question Door (north): wrong, then right.
  await walkTo(page, 9, 1, problems, "m2 door");
  await page.keyboard.down("ArrowUp");
  await page.waitForTimeout(60);
  await page.keyboard.up("ArrowUp");
  await page.waitForFunction(() => !!window.__ll.quiz, null, { timeout: 3000 }).catch(() => problems.push("Question Door did not ask"));
  if (await quiz(page)) {
    if (!(await page.locator(".ll-quiz.door").count())) problems.push("question panel not shown");
    const heartsBefore = (await st(page)).hearts;
    const q1 = await answerQuiz(page, false);
    const after = await quiz(page);
    s = await st(page);
    if (s.opened.includes("m2-m4")) problems.push("a wrong answer opened the door");
    if (s.hearts !== heartsBefore) problems.push("a wrong answer cost a heart");
    if (!(await page.locator(".ll-quiz .verdict.no").count())) problems.push("no 'not quite' verdict");
    if (!((await page.locator(".ll-quiz .why").innerText()).length > 5)) problems.push("no explanation after a wrong answer");
    if (after.picked === null) problems.push("wrong answer not recorded");
    await page.keyboard.press("Enter");
    await page.waitForTimeout(120);
    const q2 = await quiz(page);
    if (!q2 || q2.picked !== null) problems.push("no new question after a wrong answer");
    else if (q2.subject !== "math") problems.push(`Math Wing asked ${q2.subject} (MIXED)`);
    void q1;
    await answerQuiz(page, true);
    s = await st(page);
    if (!s.opened.includes("m2-m4")) problems.push("a right answer did not open the door");
    if (!(await page.locator(".ll-quiz .verdict.ok").count())) problems.push("no 'correct' verdict");
    await page.keyboard.press("Enter");
    await page.waitForTimeout(120);
    if (await quiz(page)) problems.push("question panel still open after the door opened");
  }
  await step(page, "up");
  await step(page, "up");
  s = await st(page);
  if (s.room !== "m4") problems.push(`through the Question Door reached ${s.room}`);
  await page.evaluate(() => { window.__ll.game.opts.invincible = true; });

  // Wing map, then the locked door west.
  await walkTo(page, 9, 5, problems, "m4 map");
  await step(page, "up");
  s = await st(page);
  if (!s.maps.includes("math")) problems.push("wing map not picked up");
  await walkTo(page, 1, 5, problems, "m4 west");
  await step(page, "left");
  s = await st(page);
  if (!s.opened.includes("m4-m3") || s.keys.math !== 0) problems.push("the small key did not open the locked door");
  await step(page, "left");
  await step(page, "left");
  s = await st(page);
  if (s.room !== "m3") problems.push(`through the locked door reached ${s.room}`);

  // Z swings the duster.
  await page.keyboard.press("z");
  await page.waitForTimeout(40);
  if (!(await page.evaluate(() => window.__ll.game.fx.some((f) => f.kind === "swing")))) problems.push("Z did not swing the duster");

  // Light both torches (face each and press X), then open the chest with Enter.
  for (const [tx, ty] of [[4, 3], [13, 3]]) {
    await walkTo(page, tx, ty, problems, "m3 torch");
    await step(page, "up");
    await page.keyboard.press("x");
    await page.waitForTimeout(80);
    await settle(page);
  }
  s = await st(page);
  if (s.lit.filter((l) => l.startsWith("m3:")).length !== 2) problems.push(`torches lit: ${s.lit}`);
  if (!s.solved.includes("m3")) problems.push("lighting both torches did not solve m3");
  await walkTo(page, 9, 5, problems, "m3 chest");
  await step(page, "down");
  await page.keyboard.press("Enter");
  await page.waitForTimeout(120);
  if (!(await page.locator(".ll-card.item").count())) problems.push("no item card from the chest");
  await settle(page);
  s = await st(page);
  if (!s.items.includes("boomerang") || s.selected !== "boomerang") problems.push(`item not picked up: ${s.items}`);
  if (!(await page.locator(".ll-hud .item").innerText()).includes("BOOMERANG")) problems.push("HUD does not show the boomerang");

  // Esc shows the map.
  await page.keyboard.press("Escape");
  await page.waitForTimeout(120);
  if (!(await page.locator(".ll-map .ll-maproom.here").count())) problems.push("Esc did not show the map");
  if ((await page.locator(".ll-map .ll-maproom.unknown").count()) !== 0) problems.push("the wing map should reveal every room");
  await page.keyboard.press("Escape");
  await page.waitForTimeout(100);

  // Save and reload keeps progress.
  const before = await st(page);
  await page.waitForTimeout(150);
  await page.reload({ waitUntil: "load" });
  await page.waitForFunction(() => !!window.__ll);
  const keys = await page.evaluate(() => Object.keys(localStorage));
  if (!keys.includes("arcade.lost-library.save.v1")) problems.push(`no save key: ${keys}`);
  if (!(await page.locator(".ll-start .ll-cta", { hasText: "Continue" }).count())) problems.push("no CONTINUE after reload");
  const shelfBefore = await page.locator(".ll-spine.on").count();
  await page.keyboard.press("Enter");
  await page.waitForFunction(() => window.__ll.screen === "playing" && !!window.__ll.game);
  await settle(page);
  const back = await st(page);
  if (back.room !== before.room || back.x !== before.x || back.y !== before.y || back.sig !== before.sig) {
    problems.push(`reload lost progress: ${JSON.stringify([before.room, before.x, before.y, before.sig])} -> ${JSON.stringify([back.room, back.x, back.y, back.sig])}`);
  }
  if (shelfBefore !== before.books.length) problems.push(`bookshelf shows ${shelfBefore} books, save has ${before.books.length}`);

  // Debug: skip to the Reading Room and finish.
  await page.evaluate(() => window.__ll.toReadingRoom());
  await page.waitForTimeout(100);
  await settle(page);
  s = await st(page);
  if (s.room !== "rr") problems.push(`toReadingRoom went to ${s.room}`);
  await walkTo(page, 9, 5, problems, "reading room");
  await step(page, "up");
  await page.keyboard.press("Enter");
  await page.waitForTimeout(150);
  const intro = await page.evaluate(() => (window.__ll.overlay ? window.__ll.overlay.title || "" : ""));
  if (!intro.includes("INK SMUDGE")) problems.push(`no Ink Smudge intro (${intro})`);
  await page.keyboard.press("Enter");
  await page.waitForFunction(() => !!window.__ll.quiz, null, { timeout: 3000 }).catch(() => problems.push("the Ink Smudge asked nothing"));
  const subjects = new Set();
  for (let i = 0; i < 12; i++) {
    const q = await quiz(page);
    if (!q) break;
    subjects.add(q.subject);
    await answerQuiz(page, i !== 0);
    const after = await quiz(page);
    await page.keyboard.press("Enter");
    await page.waitForTimeout(150);
    if (after && after.done) break;
  }
  await settle(page);
  await page.waitForFunction(() => window.__ll.screen === "ending", null, { timeout: 4000 }).catch(() => problems.push("no ending screen"));
  const ending = await page.locator(".ll-panel.won").innerText().catch(() => "");
  if (!ending.includes("THE LOST LIBRARY IS FOUND")) problems.push("ending text missing");
  if (subjects.size < 3) problems.push(`the Reading Room asked only ${[...subjects]}`);
  s = await st(page);
  if (!s.books.includes("reading")) problems.push("final book not returned");
  if (!(await noSideways(page))) problems.push("sideways scroll on the ending");

  if (errors.length) problems.push(`console errors: ${errors.join(" | ")}`);
  if (external.length) problems.push(`external requests: ${external.join(", ")}`);
  await ctx.close();
  return problems;
}

async function phone(browser, grade) {
  const { ctx, page, errors, external } = await newPage(browser, { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
  const problems = [];
  await page.goto(`${BASE}?grade=${grade}&debug`, { waitUntil: "load" });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: "load" });
  await page.waitForFunction(() => !!window.__ll);
  if (!(await noSideways(page))) problems.push("390px: sideways scroll on the title");
  await page.locator(".ll-start .ll-cta").first().tap();
  await page.waitForFunction(() => window.__ll.screen === "playing");
  // Close the intro by tapping the message.
  for (let i = 0; i < 4 && (await page.locator(".ll-dialog").count()); i++) {
    await page.locator(".ll-dialog").tap();
    await page.waitForTimeout(120);
  }
  if (!(await page.locator(".ll-controls.show").count())) problems.push("touch controls hidden on a phone");
  if (!(await noSideways(page))) problems.push("390px: sideways scroll while playing");
  const box = await page.locator(".ll-screen").boundingBox();
  if (!box || box.width < 300) problems.push(`game screen too small on a phone: ${box && box.width}`);
  const pad = await page.locator(".ll-controls").boundingBox();
  if (!pad || pad.x < 0 || pad.x + pad.width > 390) problems.push("touch pad does not fit 390px");

  // Hold the d-pad left.
  const s0 = await st(page);
  const left = page.locator('[aria-label="Move left"]');
  await left.dispatchEvent("pointerdown", { pointerId: 1, pointerType: "touch", isPrimary: true });
  await page.waitForTimeout(450);
  await left.dispatchEvent("pointerup", { pointerId: 1, pointerType: "touch", isPrimary: true });
  await page.waitForTimeout(250);
  const s1 = await st(page);
  if (!(s1.x <= s0.x - 2)) problems.push(`d-pad did not walk: ${s0.x} -> ${s1.x}`);
  const up = page.locator('[aria-label="Move up"]');
  await up.dispatchEvent("pointerdown", { pointerId: 2, pointerType: "touch", isPrimary: true });
  await page.waitForTimeout(200);
  await up.dispatchEvent("pointerup", { pointerId: 2, pointerType: "touch", isPrimary: true });
  await page.waitForTimeout(250);
  if ((await st(page)).facing !== "up") problems.push("d-pad up did not turn the hero");

  // DUST and MAP buttons.
  await page.locator('[aria-label="Dust (Z)"]').dispatchEvent("pointerdown", { pointerId: 3, pointerType: "touch", isPrimary: true });
  await page.waitForTimeout(40);
  if (!(await page.evaluate(() => window.__ll.game.fx.some((f) => f.kind === "swing")))) problems.push("DUST did not swing");
  await page.locator('[aria-label="Map (Esc)"]').dispatchEvent("pointerdown", { pointerId: 4, pointerType: "touch", isPrimary: true });
  await page.waitForTimeout(150);
  if (!(await page.locator(".ll-map").count())) problems.push("MAP did not open the map");
  if (!(await noSideways(page))) problems.push("390px: sideways scroll on the map");
  await page.locator(".ll-pause .ll-cta", { hasText: "Resume" }).tap();
  await page.waitForTimeout(120);

  // A Question Door, answered by tapping.
  await page.evaluate(() => { const g = window.__ll.game; g.enterRoom("s1", 9, 1, "up"); g.takeEvents(); });
  await up.dispatchEvent("pointerdown", { pointerId: 5, pointerType: "touch", isPrimary: true });
  await page.waitForTimeout(120);
  await up.dispatchEvent("pointerup", { pointerId: 5, pointerType: "touch", isPrimary: true });
  await page.waitForFunction(() => !!window.__ll.quiz, null, { timeout: 3000 }).catch(() => problems.push("phone: Question Door did not ask"));
  const q = await quiz(page);
  if (q) {
    if (q.subject !== "science") problems.push(`Science Wing asked ${q.subject}`);
    if ((await page.locator(".ll-controls.show").count())) problems.push("touch pad still showing during a question");
    if (!(await noSideways(page))) problems.push("390px: sideways scroll with a question open");
    await page.locator(".ll-quiz .opt").nth(q.answer).tap();
    await page.waitForTimeout(150);
    if (!(await st(page)).opened.includes("s1-s3")) problems.push("phone: tapping the right answer did not open the door");
    await page.locator(".ll-quiz .ll-cta").tap();
    await page.waitForTimeout(150);
    if (await quiz(page)) problems.push("phone: question panel did not close");
  }

  // Title at 360px: the subject/topic picker fits.
  await page.setViewportSize({ width: 360, height: 740 });
  await page.goto(`${BASE}?grade=${grade}&debug`, { waitUntil: "load" });
  await page.waitForFunction(() => !!window.__ll);
  await page.locator('.ll-subject[data-subject="social"]').tap();
  await page.waitForTimeout(100);
  if (!(await page.locator(".ll-chip").count())) problems.push("no topic chips after picking SOCIAL STUDIES");
  if (!(await noSideways(page))) problems.push("360px: sideways scroll on the title / picker");
  await page.locator('.ll-subject[data-subject="mixed"]').tap();

  if (errors.length) problems.push(`console errors: ${errors.join(" | ")}`);
  if (external.length) problems.push(`external requests: ${external.join(", ")}`);
  await ctx.close();
  return problems;
}

/** ?topic= from the arcade menu preselects the subject and topic. */
async function topicLink(browser) {
  const { ctx, page, errors } = await newPage(browser, { viewport: { width: 1280, height: 800 } });
  const problems = [];
  await page.goto(`${BASE}?grade=4&topic=history&debug`, { waitUntil: "load" });
  await page.waitForFunction(() => !!window.__ll);
  if (!(await page.locator('.ll-subject[data-subject="social"].on').count())) problems.push("?topic=history did not pick SOCIAL STUDIES");
  if (!(await page.locator('.ll-chip[data-topic="history"].on').count())) problems.push("?topic=history did not pick History");
  await page.goto(`${BASE}?grade=6&topic=math-mix&debug`, { waitUntil: "load" });
  await page.waitForFunction(() => !!window.__ll);
  if (!(await page.locator('.ll-chip[data-topic="all"].on').count()) || !(await page.locator('.ll-subject[data-subject="math"].on').count())) problems.push("?topic=math-mix did not pick ALL MATH");
  // Opened without ?grade=: the title has its own grade picker (K-12).
  await page.goto(`${BASE}?debug`, { waitUntil: "load" });
  await page.waitForFunction(() => !!window.__ll);
  if ((await page.locator(".ll-grade").count()) !== 13) problems.push("no K-12 grade picker without ?grade=");
  await page.locator(".ll-grade", { hasText: /^1$/ }).click();
  if (!(await page.locator(".ll-grade.on", { hasText: /^1$/ }).count())) problems.push("grade picker did not pick grade 1");
  if (errors.length) problems.push(`console errors: ${errors.join(" | ")}`);
  await ctx.close();
  return problems;
}

const NEW_QUESTS = ["lighthouse", "clockwork", "volcano", "museum"];

/** What the playtest needs to know about the running quest. */
const questInfo = (page) =>
  page.evaluate(() => {
    const g = window.__ll.game;
    const q = g.q;
    const w = q.wings[0];
    const qd = q.areas[w].doors.find((d) => d.kind === "question");
    return { id: q.id, wing: w, subject: q.areas[w].subject, gate: q.gateFront[w], start: q.areas[w].start, door: qd.id, doorTo: qd.b, hubStart: q.areas[q.hub].start };
  });

/** Is the element's centre really on top (not covered by an overlay)? */
const onTop = (loc) =>
  loc.evaluate((el) => {
    const r = el.getBoundingClientRect();
    const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    return !!hit && (hit === el || el.contains(hit));
  });

async function questsDesktop(browser) {
  const { ctx, page, errors, external } = await newPage(browser, { viewport: { width: 1280, height: 800 } });
  const problems = [];
  await page.goto(`${BASE}?grade=5&debug`, { waitUntil: "load" });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: "load" });
  await page.waitForFunction(() => !!window.__ll);
  const cards = page.locator(".ll-quest");
  if ((await cards.count()) !== 5) problems.push(`quest picker shows ${await cards.count()} quests, want 5`);
  const ids = await page.evaluate(() => window.__ll.quests);
  if (ids.join() !== ["library", ...NEW_QUESTS].join()) problems.push(`quest order ${ids}`);
  for (let i = 0; i < 5; i++) {
    const card = cards.nth(i);
    const title = await card.locator(".ll-qtitle").innerText();
    if (title.length < 8) problems.push(`card ${i}: no title`);
    if ((await card.locator("canvas.ll-qpreview").count()) !== 1) problems.push(`card ${i}: no preview`);
    if (!(await card.locator(".ll-qprog").innerText()).toLowerCase().includes("not started")) problems.push(`card ${i}: progress should say not started`);
    if (!(await card.locator(".ll-qbtns .ll-cta", { hasText: "Start" }).count())) problems.push(`card ${i}: no START button`);
  }
  // The previews draw something (not a blank canvas).
  const blank = await page.evaluate(() => [...document.querySelectorAll("canvas.ll-qpreview")].filter((c) => {
    const d = c.getContext("2d").getImageData(0, 60, 320, 1).data;
    return d.every((v, i) => i % 4 === 3 || v === d[i % 4]);
  }).length);
  if (blank) problems.push(`${blank} blank quest previews`);
  // Arrow keys move between the quest cards.
  await cards.nth(0).locator(".ll-questpick").focus();
  await page.keyboard.press("ArrowRight");
  if ((await page.evaluate(() => window.__ll.pick)) !== "lighthouse") problems.push("ArrowRight did not pick quest 2");
  await page.keyboard.press("ArrowLeft");
  if ((await page.evaluate(() => window.__ll.pick)) !== "library") problems.push("ArrowLeft did not pick quest 1");

  // A Lost Library save first (Enter on a focused card starts it).
  await page.keyboard.press("Enter");
  await page.waitForFunction(() => window.__ll.screen === "playing" && window.__ll.game.q.id === "library");
  await settle(page);
  await step(page, "left");
  await step(page, "left");
  await page.waitForTimeout(150);
  await page.evaluate(() => window.__ll.toTitle());
  await page.waitForFunction(() => window.__ll.screen === "title");
  const libSave = await page.evaluate(() => localStorage.getItem("arcade.lost-library.save.v1"));
  if (!libSave) problems.push("no Lost Library save");

  for (const id of NEW_QUESTS) {
    const label = `desktop ${id}`;
    await page.locator(`.ll-quest[data-quest="${id}"] .ll-qbtns .ll-cta`, { hasText: "Start" }).click();
    await page.waitForFunction((id) => window.__ll.screen === "playing" && window.__ll.game && window.__ll.game.q.id === id, id);
    if (!(await page.locator(".ll-dialog").count())) problems.push(`${label}: no story intro`);
    await settle(page);
    const info = await questInfo(page);
    let s = await st(page);
    if (s.room !== info.hubStart.room) problems.push(`${label}: starts in ${s.room}`);
    // Hub -> the first wing's gate -> its entrance.
    await walkTo(page, info.gate.x, info.gate.y, problems, `${label} hub`);
    await step(page, "up");
    s = await st(page);
    if (s.area !== info.wing || s.room !== info.start.room) problems.push(`${label}: gate led to ${s.room}`);
    // The Question Door (north of the entrance): wrong, then right.
    await walkTo(page, 9, 1, problems, `${label} entrance`);
    await page.keyboard.down("ArrowUp");
    await page.waitForTimeout(60);
    await page.keyboard.up("ArrowUp");
    await page.waitForFunction(() => !!window.__ll.quiz, null, { timeout: 3000 }).catch(() => problems.push(`${label}: Question Door did not ask`));
    if (await quiz(page)) {
      const hearts = (await st(page)).hearts;
      await answerQuiz(page, false);
      s = await st(page);
      if (s.opened.includes(info.door)) problems.push(`${label}: a wrong answer opened the door`);
      if (s.hearts !== hearts) problems.push(`${label}: a wrong answer cost a heart`);
      if (!(await page.locator(".ll-quiz .verdict.no").count())) problems.push(`${label}: no 'not quite' verdict`);
      await page.keyboard.press("Enter");
      await page.waitForTimeout(120);
      const q2 = await quiz(page);
      if (!q2 || q2.picked !== null) problems.push(`${label}: no new question after a wrong answer`);
      else if (q2.subject !== info.subject) problems.push(`${label}: the ${info.wing} wing asked ${q2.subject}, want ${info.subject} (MIXED)`);
      await answerQuiz(page, true);
      if (!(await st(page)).opened.includes(info.door)) problems.push(`${label}: a right answer did not open the door`);
      await page.keyboard.press("Enter");
      await page.waitForTimeout(120);
      if (await quiz(page)) problems.push(`${label}: question panel still open`);
    }
    await step(page, "up");
    await step(page, "up");
    s = await st(page);
    if (s.room !== info.doorTo) problems.push(`${label}: through the Question Door reached ${s.room}`);
    // Back to the quest picker from the pause menu.
    await page.keyboard.press("Escape");
    await page.waitForTimeout(120);
    if (!(await page.locator(".ll-map .ll-maproom.here").count())) problems.push(`${label}: no map`);
    await page.locator(".ll-pause .ll-cta", { hasText: "Choose quest" }).click();
    await page.waitForFunction(() => window.__ll.screen === "title");
    if (!(await page.locator(`.ll-quest[data-quest="${id}"] .ll-qbtns .ll-cta`, { hasText: "Continue" }).count())) problems.push(`${label}: card has no CONTINUE after playing`);
    const key = `arcade.lost-library.save.${id}.v1`;
    if (!(await page.evaluate((k) => !!localStorage.getItem(k), key))) problems.push(`${label}: no save under ${key}`);
  }
  // Quest 1's save is untouched, and CONTINUE brings it back.
  const libAfter = await page.evaluate(() => localStorage.getItem("arcade.lost-library.save.v1"));
  if (libAfter !== libSave) problems.push("the Lost Library save changed while playing other quests");
  const before = JSON.parse(libSave);
  await page.locator('.ll-quest[data-quest="library"] .ll-qbtns .ll-cta', { hasText: "Continue" }).click();
  await page.waitForFunction(() => window.__ll.screen === "playing" && window.__ll.game.q.id === "library");
  await settle(page);
  const back = await st(page);
  if (back.room !== before.at.room || back.x !== before.at.x || back.y !== before.at.y) problems.push(`Lost Library CONTINUE went to ${back.room} (${back.x},${back.y})`);
  if (!(await noSideways(page))) problems.push("sideways scroll");
  if (errors.length) problems.push(`console errors: ${errors.join(" | ")}`);
  if (external.length) problems.push(`external requests: ${external.join(", ")}`);
  await ctx.close();
  return problems;
}

async function tap(page, loc, id) {
  await loc.dispatchEvent("pointerdown", { pointerId: id, pointerType: "touch", isPrimary: true });
  await page.waitForTimeout(60);
  await loc.dispatchEvent("pointerup", { pointerId: id, pointerType: "touch", isPrimary: true });
  await page.waitForTimeout(20);
}

/** One step with the touch d-pad. */
let pid = 100;
async function touchStep(page, dir) {
  await tap(page, page.locator(`[aria-label="Move ${dir}"]`), pid++);
  for (let i = 0; i < 30; i++) {
    const t = await page.evaluate(() => (window.__ll.game ? window.__ll.game.anim.t : 1));
    if (t >= 1) break;
    await page.waitForTimeout(30);
  }
  // Close any message by tapping it.
  for (let i = 0; i < 6 && (await page.locator(".ll-dialog").count()) && !(await quiz(page)); i++) {
    await page.locator(".ll-dialog").tap();
    await page.waitForTimeout(100);
  }
}

async function touchWalkTo(page, x, y, problems, label) {
  const plan = await page.evaluate(([x, y]) => window.__ll.pathTo(x, y), [x, y]);
  if (!plan) {
    problems.push(`${label}: no path to (${x},${y})`);
    return;
  }
  for (const d of plan) await touchStep(page, d);
  const s = await st(page);
  if (s.x !== x || s.y !== y) problems.push(`${label}: touch-walked to (${s.x},${s.y}), wanted (${x},${y})`);
}

async function toggles(page, problems, where) {
  for (const name of ["MUSIC", "SFX"]) {
    const btn = page.locator(".ll-tools button", { hasText: name }).first();
    if (!(await btn.count())) {
      problems.push(`${where}: no ${name} button`);
      continue;
    }
    if (!(await onTop(btn))) problems.push(`${where}: the ${name} button is covered`);
    const before = await btn.innerText();
    await btn.tap();
    await page.waitForTimeout(80);
    const after = await page.locator(".ll-tools button", { hasText: name }).first().innerText();
    if (after === before) problems.push(`${where}: tapping ${name} did nothing (${before})`);
    await page.locator(".ll-tools button", { hasText: name }).first().tap();
    await page.waitForTimeout(80);
  }
}

async function questsPhone(browser) {
  const { ctx, page, errors, external } = await newPage(browser, { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
  const problems = [];
  await page.goto(`${BASE}?grade=2&debug`, { waitUntil: "load" });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: "load" });
  await page.waitForFunction(() => !!window.__ll);
  if ((await page.locator(".ll-quest").count()) !== 5) problems.push("phone: quest picker should show 5 quests");
  if (!(await noSideways(page))) problems.push("390px: sideways scroll on the quest picker");
  await toggles(page, problems, "phone picker");
  for (const id of NEW_QUESTS) {
    const label = `phone ${id}`;
    const start = page.locator(`.ll-quest[data-quest="${id}"] .ll-qbtns .ll-cta`, { hasText: "Start" });
    await start.scrollIntoViewIfNeeded();
    await start.tap();
    await page.waitForFunction((id) => window.__ll.screen === "playing" && window.__ll.game && window.__ll.game.q.id === id, id);
    // MUSIC / SFX stay tappable while the story message covers the screen.
    if (await page.locator(".ll-dialog").count()) await toggles(page, problems, `${label} message`);
    for (let i = 0; i < 6 && (await page.locator(".ll-dialog").count()); i++) {
      await page.locator(".ll-dialog").tap();
      await page.waitForTimeout(120);
    }
    if (!(await page.locator(".ll-controls.show").count())) problems.push(`${label}: touch controls hidden`);
    if (!(await noSideways(page))) problems.push(`${label}: sideways scroll while playing`);
    const info = await questInfo(page);
    await touchWalkTo(page, info.gate.x, info.gate.y, problems, `${label} hub`);
    await touchStep(page, "up");
    let s = await st(page);
    if (s.room !== info.start.room) problems.push(`${label}: the gate led to ${s.room}`);
    await touchWalkTo(page, 9, 1, problems, `${label} entrance`);
    await tap(page, page.locator('[aria-label="Move up"]'), pid++);
    await page.waitForFunction(() => !!window.__ll.quiz, null, { timeout: 3000 }).catch(() => problems.push(`${label}: Question Door did not ask`));
    const q = await quiz(page);
    if (q) {
      if (q.subject !== info.subject) problems.push(`${label}: asked ${q.subject}, want ${info.subject}`);
      if (await page.locator(".ll-controls.show").count()) problems.push(`${label}: touch pad showing during a question`);
      const hearts = (await st(page)).hearts;
      await page.locator(".ll-quiz .opt").nth((q.answer + 1) % 4).tap();
      await page.waitForTimeout(150);
      s = await st(page);
      if (s.opened.includes(info.door) || s.hearts !== hearts) problems.push(`${label}: a wrong tap opened the door or cost a heart`);
      await page.locator(".ll-quiz .ll-cta").tap();
      await page.waitForTimeout(150);
      const q2 = await quiz(page);
      if (!q2 || q2.picked !== null) problems.push(`${label}: no new question after a wrong answer`);
      else {
        await page.locator(".ll-quiz .opt").nth(q2.answer).tap();
        await page.waitForTimeout(150);
        if (!(await st(page)).opened.includes(info.door)) problems.push(`${label}: tapping the right answer did not open the door`);
        await page.locator(".ll-quiz .ll-cta").tap();
        await page.waitForTimeout(150);
      }
      if (!(await noSideways(page))) problems.push(`${label}: sideways scroll after a question`);
    }
    await touchStep(page, "up");
    await touchStep(page, "up");
    s = await st(page);
    if (s.room !== info.doorTo) problems.push(`${label}: through the Question Door reached ${s.room}`);
    await tap(page, page.locator('[aria-label="Map (Esc)"]'), pid++);
    await page.waitForTimeout(150);
    await toggles(page, problems, `${label} pause`);
    await page.locator(".ll-pause .ll-cta", { hasText: "Choose quest" }).tap();
    await page.waitForFunction(() => window.__ll.screen === "title");
  }
  if (errors.length) problems.push(`console errors: ${errors.join(" | ")}`);
  if (external.length) problems.push(`external requests: ${external.join(", ")}`);
  await ctx.close();
  return problems;
}

async function saveShot(page, file) {
  // The canvas itself, scaled 2x with hard pixels: exactly 640 x 400.
  await page.waitForTimeout(400);
  const data = await page.evaluate(() => {
    const src = document.querySelector(".ll-screen canvas");
    const c = document.createElement("canvas");
    c.width = 640;
    c.height = 400;
    const x = c.getContext("2d");
    x.imageSmoothingEnabled = false;
    x.drawImage(src, 0, 0, 640, 400);
    return c.toDataURL("image/png");
  });
  fs.writeFileSync(path.resolve(file), Buffer.from(data.split(",")[1], "base64"));
  console.log(`Saved ${file} (${fs.statSync(path.resolve(file)).size} bytes)`);
}

(async () => {
  const browser = await chromium.launch();
  let failed = 0;
  try {
    for (const g of GRADES) {
      const p = await desktop(browser, g);
      console.log(`Desktop grade ${g}: ${p.length ? "FAIL\n  - " + p.join("\n  - ") : "ok"}`);
      failed += p.length;
    }
    const ph = await phone(browser, "2");
    console.log(`Phone grade 2: ${ph.length ? "FAIL\n  - " + ph.join("\n  - ") : "ok"}`);
    failed += ph.length;
    const tl = await topicLink(browser);
    console.log(`Topic links: ${tl.length ? "FAIL\n  - " + tl.join("\n  - ") : "ok"}`);
    failed += tl.length;
    const qd = await questsDesktop(browser);
    console.log(`Quests, desktop: ${qd.length ? "FAIL\n  - " + qd.join("\n  - ") : "ok"}`);
    failed += qd.length;
    const qp = await questsPhone(browser);
    console.log(`Quests, phone 390px: ${qp.length ? "FAIL\n  - " + qp.join("\n  - ") : "ok"}`);
    failed += qp.length;
  } finally {
    await browser.close();
  }
  if (failed) {
    console.log(`${failed} problem(s)`);
    process.exit(1);
  }
  console.log("Playtest passed.");
})();
