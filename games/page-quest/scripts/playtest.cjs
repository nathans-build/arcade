/*
 * Automated playtest (dev only). Needs a running preview and a global Playwright:
 *   npm run build && npx vite preview --port 4417 --host 127.0.0.1 &
 *   node scripts/playtest.cjs              # SHOT=1 also saves docs/screenshot.png + docs/scene.png
 * Runs (keyboard 1280x800 and iPad touch 1080x810):
 *  - grades K and 3: the "grades 4 and up" screen; no ?grade: the picker
 *  - grades 4, 7, 11: plays the sample book (HOW TO PLAY) to BOTH endings (win + secret),
 *    answers the gates with keys or taps, checks the transmission, the clue journal, hearts
 *    (grade 7: lose by hearts → back to the checkpoint; grade 4: never loses, answer revealed),
 *    the standard codes, the endings gallery and the mission report
 *  - grade 7 and 4: a lose ending from an inline 6-8 story (TRY AGAIN FROM CHECKPOINT / detour)
 *  - Writer's Desk: builds a 3-page book, playtests it, exports it and re-imports the file
 *  - layout: no horizontal scroll, fits the viewport height; no page errors
 */
const path = require("path");
const fs = require("fs");
const os = require("os");
const { execSync } = require("child_process");
const { chromium } = require(path.join(execSync("npm root -g").toString().trim(), "playwright"));

const BASE = process.env.BASE || "http://127.0.0.1:4417/";
const SHOT = !!process.env.SHOT;
const DOCS = path.join(__dirname, "..", "docs");

const LOSE_STORY = `title: Lose Test
author: Test
genre: mystery
band: 6-8
cover: city-street
blurb: A tiny book with a lose ending.
start: a

=== a
scene: city-street
cast: hero, detective
checkpoint
The street is quiet. The detective points two ways.
> Follow the stranger -> bad
> Check the diner -> good

=== bad
scene: city-street
cast: stranger:angry
The stranger slips away into the fog, and the case goes cold.
end: lose The Cold Trail

=== good
scene: city-street
cast: hero, detective:happy
You find the missing watch under the diner counter.
end: win Case Closed
`;

async function newPage(browser, touch) {
  const ctx = await browser.newContext(
    touch ? { viewport: { width: 1080, height: 810 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2, acceptDownloads: true } : { viewport: { width: 1280, height: 800 }, acceptDownloads: true },
  );
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (m) => {
    if (m.type() === "error" && !/fonts\.(googleapis|gstatic)|ERR_|Failed to load resource/.test(m.text())) errors.push(m.text());
  });
  page.on("dialog", (d) => d.accept());
  return { ctx, page, errors };
}

const R = (page) =>
  page.evaluate(() => {
    const r = document.querySelector(".pq-reader");
    return r ? { page: r.dataset.page, hearts: Number(r.dataset.hearts), gate: r.dataset.gate, score: Number(r.dataset.score), revealed: r.dataset.revealed === "1" } : null;
  });

async function layout(page, problems, where) {
  const l = await page.evaluate(() => {
    const s = document.querySelector(".pq-screen");
    const r = s ? s.getBoundingClientRect() : null;
    return {
      hScroll: document.documentElement.scrollWidth > window.innerWidth,
      vScroll: document.documentElement.scrollHeight > window.innerHeight,
      screenW: r && r.width ? Math.round(r.width) : null,
      screenBottom: r ? Math.round(r.bottom) : 0,
      vh: window.innerHeight,
    };
  });
  if (l.hScroll) problems.push(`${where}: horizontal scroll`);
  if (l.vScroll || l.screenBottom > l.vh) problems.push(`${where}: doesn't fit the height ${JSON.stringify(l)}`);
  if (l.screenW !== null && l.screenW < 400) problems.push(`${where}: game screen small (${l.screenW}px)`);
  return l;
}

/** Reveal the page text: Space (keyboard) or a tap on the scene (touch). */
async function reveal(page, touch) {
  for (let i = 0; i < 3; i++) {
    const r = await R(page);
    if (!r || r.revealed) return;
    if (touch) await page.locator(".pq-screen canvas").tap();
    else await page.keyboard.press("Space");
    await page.waitForTimeout(120);
  }
}

async function choose(page, touch, i, useLetter) {
  await reveal(page, touch);
  if (touch) await page.locator(".pq-choices .pq-choice").nth(i).tap();
  else await page.keyboard.press(useLetter ? "abcd"[i] : String(i + 1));
  await page.waitForTimeout(200);
}

async function transmission(page, touch, log) {
  const dlg = page.locator('[aria-label="Transmission question"]');
  if (!(await dlg.count())) return false;
  const std = await page.locator('[aria-label="Transmission question"] .pq-tag.std').innerText();
  if (touch) await page.locator('[aria-label="Transmission question"] .pq-choice').nth(1).tap();
  else await page.keyboard.press("b");
  await page.waitForTimeout(150);
  const verdict = await page.locator('[aria-label="Transmission question"] .verdict').innerText().catch(() => "");
  log.push(`transmission ${std}: ${verdict}`);
  if (touch) await page.locator('[aria-label="Transmission question"] .pq-cta').tap();
  else await page.keyboard.press("Enter");
  await page.waitForTimeout(200);
  return true;
}

/** Display index of the gate answer whose text matches. */
async function answerIndex(page, re) {
  const texts = await page.locator(".pq-gate .pq-answers .pq-choice").allInnerTexts();
  return texts.findIndex((t) => re.test(t));
}

async function answerMc(page, touch, i) {
  if (touch) await page.locator(".pq-gate .pq-answers .pq-choice").nth(i).tap();
  else await page.keyboard.press(i % 2 ? "abcd"[i] : String(i + 1));
  await page.waitForTimeout(200);
}

async function solveOrder(page, touch, items) {
  for (const it of items) {
    const texts = await page.locator(".pq-gate .pq-tiles .pq-choice").allInnerTexts();
    const i = texts.findIndex((t) => t.includes(it));
    if (i < 0) throw new Error(`order tile "${it}" not found in ${texts}`);
    if (touch) await page.locator(".pq-gate .pq-tiles .pq-choice").nth(i).tap();
    else await page.keyboard.press("abcde"[i]);
    await page.waitForTimeout(150);
  }
}

async function continueGate(page, touch) {
  if (touch) await page.locator(".pq-gate .pq-cta").tap();
  else await page.keyboard.press("Enter");
  await page.waitForTimeout(200);
}

async function finish(page, touch) {
  await reveal(page, touch);
  if (touch) await page.locator(".pq-after .pq-cta").tap();
  else await page.keyboard.press("Enter");
  await page.waitForTimeout(300);
}

/** Plays the sample book once. path "secret" or "win". Returns notes. */
async function playSample(page, touch, grade, route, problems, notes) {
  const g = Number(grade);
  // welcome → tip (journal) → dock
  let r = await R(page);
  if (r.page !== "welcome") problems.push(`sample starts at ${r.page}`);
  if (route === "secret") {
    await choose(page, touch, 1, true); // tip
    await reveal(page, touch);
    if (touch) await page.locator(".pq-readhead button", { hasText: "JOURNAL" }).tap();
    else await page.keyboard.press("j");
    await page.waitForTimeout(150);
    const clue = await page.locator('[aria-label="Clue Journal"] li').first().innerText().catch(() => "");
    if (!/look back/.test(clue)) problems.push(`journal clue missing (${clue})`);
    if (touch) await page.locator('[aria-label="Clue Journal"] .pq-cta').tap();
    else await page.keyboard.press("j");
    await page.waitForTimeout(150);
    await choose(page, touch, 0);
  } else await choose(page, touch, 0);
  r = await R(page);
  if (r.page !== "dock") problems.push(`expected dock, at ${r.page}`);
  if (route === "secret") {
    await choose(page, touch, 1); // under-dock
    await choose(page, touch, 0); // jungle
  } else await choose(page, touch, 0);
  await page.waitForTimeout(200);
  const tr = await transmission(page, touch, notes);
  r = await R(page);
  if (r.page !== "jungle") problems.push(`expected jungle, at ${r.page}`);
  if (route === "win" && !tr && !notes.some((n) => n.startsWith("transmission"))) problems.push("no transmission at the jungle checkpoint");
  await reveal(page, touch);

  // Multiple-choice gate
  const std = await page.locator(".pq-gate .pq-tag.std").innerText();
  const code = g >= 11 ? "RL.11-12.3" : g >= 9 ? "RL.9-10.3" : `RL.${g}.3`;
  if (!std.includes(code)) problems.push(`gate standard ${std}, expected ${code}`);
  const right = await answerIndex(page, /shiny treasure/);
  const wrong = right === 0 ? 1 : 0;
  if (route === "secret") {
    if (g >= 6) {
      // Lose by hearts: three wrong answers → THE END? → back to the checkpoint with full hearts.
      for (let k = 0; k < 3; k++) await answerMc(page, touch, wrong);
      const loseShown = await page.locator('[aria-label="The end?"]').count();
      r = await R(page);
      notes.push(`hearts after 3 misses: ${r.hearts}, lose screen: ${loseShown}`);
      if (!loseShown) problems.push("no THE END? screen at 0 hearts");
      const hudHearts = await page.locator(".pq-readhead .hearts .on").count();
      if (hudHearts !== 0) problems.push(`HUD hearts ${hudHearts} at lose`);
      if (touch) await page.locator('[aria-label="The end?"] .pq-cta').tap();
      else await page.keyboard.press("Enter");
      await page.waitForTimeout(250);
      r = await R(page);
      if (r.page !== "jungle" || r.hearts !== 3) problems.push(`after lose: page ${r.page}, hearts ${r.hearts} (expected jungle, 3)`);
      notes.push(`restarted at checkpoint ${r.page} with ${r.hearts} hearts`);
      await reveal(page, touch);
      // One wrong (−1 heart, hint) then right.
      await answerMc(page, touch, await answerIndex(page, /nest/));
      const fb = await page.locator(".pq-gate .pq-feedback").innerText().catch(() => "");
      if (!/Quill:/.test(fb) || !/♥/.test(fb)) problems.push(`wrong answer feedback: ${fb}`);
      r = await R(page);
      if (r.hearts !== 2) problems.push(`hearts after one miss ${r.hearts}`);
      await answerMc(page, touch, await answerIndex(page, /shiny treasure/));
    } else {
      // Grades 4-5 never lose: two misses → Quill reveals the answer.
      if (await page.locator(".pq-readhead .hearts").count()) problems.push("hearts shown for grade 4-5");
      await answerMc(page, touch, wrong);
      await answerMc(page, touch, (await answerIndex(page, /nest/)) === wrong ? await answerIndex(page, /wind/) : await answerIndex(page, /nest/));
      r = await R(page);
      const fb = await page.locator(".pq-gate .pq-feedback").innerText().catch(() => "");
      notes.push(`grade ${grade} after 2 misses: gate ${r.gate}; "${fb.slice(0, 60)}"`);
      if (r.gate !== "reveal") problems.push(`grade ${grade}: expected reveal after 2 misses, got ${r.gate}`);
      if (await page.locator('[aria-label="The end?"]').count()) problems.push("grade 4-5 saw a lose screen");
    }
  } else {
    await answerMc(page, touch, right);
  }
  r = await R(page);
  if (r.gate !== "solved" && r.gate !== "reveal") problems.push(`jungle gate not done (${r.gate})`);
  await continueGate(page, touch);

  // Order gate
  r = await R(page);
  if (r.page !== "pieces") problems.push(`expected pieces, at ${r.page}`);
  await reveal(page, touch);
  await solveOrder(page, touch, ["palm tree", "rope bridge", "red rock"]);
  r = await R(page);
  if (r.gate !== "solved") problems.push(`order gate ${r.gate}`);
  await continueGate(page, touch);

  // Fork and ending
  await choose(page, touch, route === "secret" ? 1 : 0);
  r = await R(page);
  if (r.page !== (route === "secret" ? "parrot-hoard" : "treasure")) problems.push(`expected ending page, at ${r.page}`);
  await finish(page, touch);
  const dlg = page.locator('[aria-label="Ending and mission report"]');
  if (!(await dlg.count())) {
    problems.push("ending screen missing");
    return;
  }
  const title = await dlg.locator(".pq-title").innerText();
  const gallery = await dlg.locator(".pq-h", { hasText: "ENDINGS FOUND" }).innerText();
  const rows = await dlg.locator(".pq-report tbody tr").allInnerTexts();
  const practice = await dlg.locator("p", { hasText: /Practice next|Great reading/ }).innerText().catch(() => "");
  notes.push(`${route}: "${title}" · ${gallery} · report ${rows.map((x) => x.replace(/\s+/g, " ")).join(" | ")} · ${practice.slice(0, 60)}`);
  if (route === "secret" && !/SECRET/.test(title)) problems.push(`secret ending title ${title}`);
  if (route === "win" && !/THE END/.test(title)) problems.push(`win ending title ${title}`);
  if (!rows.length) problems.push("mission report has no rows");
}

async function youngRun(browser, grade, touch) {
  const { ctx, page, errors } = await newPage(browser, touch);
  const problems = [];
  await page.goto(`${BASE}?grade=${grade}&debug`);
  await page.waitForTimeout(500);
  const txt = await page.locator(".pq-young").innerText().catch(() => "");
  if (!/grades 4 and up/i.test(txt)) problems.push("no 'grades 4 and up' screen");
  if (!(await page.locator(".pq-young a", { hasText: "ARCADE" }).count())) problems.push("no ARCADE link");
  if (await page.locator(".pq-shelf").count()) problems.push("shelf shown to a K-3 player");
  if (!(await page.locator(".pq-badge").count())) problems.push("grade badge missing");
  await layout(page, problems, "young");
  await ctx.close();
  return { run: `grade ${grade} ${touch ? "touch" : "keyboard"} (4+ screen)`, problems, errors, notes: [txt.split("\n").find((l) => /4 and up/i.test(l)) || ""] };
}

async function pickerRun(browser) {
  const { ctx, page, errors } = await newPage(browser, false);
  const problems = [];
  await page.goto(`${BASE}?debug`);
  await page.waitForTimeout(400);
  if (await page.locator(".pq-badge").count()) problems.push("badge shown without ?grade=");
  await page.locator(".pq-grade", { hasText: /^2$/ }).first().click();
  await page.waitForTimeout(200);
  if (!(await page.locator(".pq-young").count())) problems.push("grade 2 did not show the 4+ screen");
  await page.locator(".pq-grade", { hasText: /^5$/ }).first().click();
  await page.waitForTimeout(200);
  if (!(await page.locator(".pq-shelf").count())) problems.push("grade 5 did not show the shelf");
  const tags = await page.locator(".pq-spine .tag").allInnerTexts();
  await ctx.close();
  return { run: "no ?grade= (picker)", problems, errors, notes: [`shelf tags at grade 5: ${tags.join(", ")}`] };
}

async function readRun(browser, grade, touch) {
  const { ctx, page, errors } = await newPage(browser, touch);
  const problems = [];
  const notes = [];
  await page.goto(`${BASE}?grade=${grade}&debug`);
  await page.waitForTimeout(500);
  const badge = await page.locator(".pq-badge").innerText().catch(() => "");
  if (!badge || (await page.locator(".pq-grades").count())) problems.push("expected the grade badge, not a picker");
  const spines = await page.locator(".pq-spine").allInnerTexts();
  const picked = await page.locator(".pq-spine.on").innerText().catch(() => "");
  notes.push(`badge "${badge.replace(/\s+/g, " ")}", mystery shelf: ${spines.map((s) => s.replace(/\s+/g, " ")).join(" / ")}; selected: ${picked.replace(/\s+/g, " ")}`);
  const band = Number(grade) <= 5 ? "4-5" : Number(grade) <= 8 ? "6-8" : "9-12";
  if (spines.some((s) => s.length) && !/YOUR LEVEL/.test(picked) && spines.some((s) => /YOUR LEVEL/.test(s))) problems.push("YOUR LEVEL book not selected by default");
  notes.push(`band ${band}`);
  await layout(page, problems, "library");

  // Sample book, secret route (with the losing / hint checks), then the win route.
  const htp = page.locator(".pq-librow .pq-cta", { hasText: "How to play" });
  if (touch) await htp.tap();
  else await htp.click();
  await page.waitForTimeout(400);
  await layout(page, problems, "reading");
  await playSample(page, touch, grade, "secret", problems, notes);
  const again = page.locator('[aria-label="Ending and mission report"] .pq-cta', { hasText: "Read again" });
  if (touch) await again.tap();
  else await again.click();
  await page.waitForTimeout(300);
  await playSample(page, touch, grade, "win", problems, notes);
  const gallery = await page.locator('[aria-label="Ending and mission report"] .pq-h', { hasText: "ENDINGS FOUND" }).innerText().catch(() => "");
  if (!/2 \/ 2/.test(gallery)) problems.push(`gallery after both endings: ${gallery}`);

  // Screenshot (grade 7 keyboard): a scene with characters and story text.
  if (SHOT && grade === "7" && !touch) {
    await page.locator('[aria-label="Ending and mission report"] .pq-cta', { hasText: "Read again" }).click();
    await page.waitForTimeout(300);
    await choose(page, false, 0);
    await page.waitForTimeout(1500);
    await page.keyboard.press("Space");
    await page.waitForTimeout(700);
    const main = await page.locator(".pq-main").boundingBox();
    await page.screenshot({ path: path.join(DOCS, "screenshot.png"), clip: main });
    const png = await page.evaluate(() => {
      const src = document.querySelector(".pq-screen canvas");
      const c = document.createElement("canvas");
      c.width = 640;
      c.height = 400;
      const g = c.getContext("2d");
      g.imageSmoothingEnabled = false;
      g.drawImage(src, 0, 0, 640, 400);
      return c.toDataURL("image/png");
    });
    fs.writeFileSync(path.join(DOCS, "scene.png"), Buffer.from(png.split(",")[1], "base64"));
    notes.push("saved docs/screenshot.png and docs/scene.png");
  }

  // Lose ending from a 6-8 story: TRY AGAIN FROM CHECKPOINT (grade >= 6) or a detour (grades 4-5).
  await page.evaluate((t) => window.__pq.playText(t), LOSE_STORY);
  await page.waitForTimeout(400);
  await choose(page, touch, 0);
  await finish(page, touch);
  if (Number(grade) >= 6) {
    const dlg = page.locator('[aria-label="Ending and mission report"]');
    const title = await dlg.locator(".pq-title").innerText().catch(() => "");
    const btn = dlg.locator(".pq-cta", { hasText: /Try again from checkpoint/i });
    if (!/THE END\?/.test(title) || !(await btn.count())) problems.push(`lose ending screen: "${title}"`);
    if (touch) await btn.tap();
    else await btn.click();
  } else {
    const dlg = page.locator('[aria-label="Detour"]');
    if (!(await dlg.count())) problems.push("grade 4-5 lose ending did not show the detour");
    if (touch) await dlg.locator(".pq-cta").tap();
    else await page.keyboard.press("Enter");
  }
  await page.waitForTimeout(300);
  const r = await R(page);
  notes.push(`lose ending → back at "${r.page}"`);
  if (r.page !== "a") problems.push(`after the lose ending: page ${r.page}, expected checkpoint a`);

  // Continue: read a page into the YOUR LEVEL book, go back; the library offers CONTINUE there.
  await page.goto(`${BASE}?grade=${grade}&debug`);
  await page.waitForTimeout(400);
  const read = page.locator(".pq-detail .pq-cta", { hasText: "Read" });
  await (touch ? read.tap() : read.click());
  await page.waitForTimeout(300);
  await transmission(page, touch, notes);
  await choose(page, touch, 0);
  await transmission(page, touch, notes);
  const at = (await R(page)).page;
  const back = page.locator(".pq-readhead button", { hasText: "LIBRARY" });
  await (touch ? back.tap() : back.click());
  await page.waitForTimeout(300);
  const cont = page.locator(".pq-detail .pq-cta", { hasText: "Continue" });
  if (!(await cont.count())) problems.push("no CONTINUE after leaving a book");
  else {
    await (touch ? cont.tap() : cont.click());
    await page.waitForTimeout(300);
    const again = (await R(page)).page;
    notes.push(`CONTINUE: left at "${at}", resumed at "${again}"`);
    if (again !== at) problems.push(`CONTINUE resumed at ${again}, expected ${at}`);
    await (touch ? back.tap() : back.click());
    await page.waitForTimeout(300);
  }
  await page.locator(".pq-tab", { hasText: "ADVENTURE" }).click();
  await page.waitForTimeout(200);
  const advSpines = await page.locator(".pq-spine").allInnerTexts();
  notes.push(`adventure shelf: ${advSpines.map((s) => s.replace(/\s+/g, " ")).join(" / ")}`);
  if (advSpines.some((s) => /Practice Quest/.test(s))) problems.push("sample shown in ADVENTURE although real books exist");
  await layout(page, problems, "library (again)");

  await ctx.close();
  return { run: `grade ${grade} ${touch ? "touch" : "keyboard"}`, problems, errors, notes };
}

async function writerRun(browser, touch) {
  const { ctx, page, errors } = await newPage(browser, touch);
  const problems = [];
  const notes = [];
  const tap = async (loc) => (touch ? loc.tap() : loc.click());
  await page.goto(`${BASE}?grade=7&debug`);
  await page.waitForTimeout(400);
  await tap(page.locator(".pq-cta", { hasText: "Writer's Desk" }));
  await page.waitForTimeout(300);
  if (!(await page.locator(".pq-desk").count())) {
    problems.push("Writer's Desk did not open");
    await ctx.close();
    return { run: "writer", problems, errors, notes };
  }
  const col = page.locator(".pq-col.left");
  await col.locator("label", { hasText: "Title" }).locator("input").fill("The Cave of Echoes");
  // Page 1 (start): body + two choices, each to a brand-new page.
  const mid = page.locator(".pq-col.mid");
  await mid.locator("textarea.body").fill("You find a dark cave by the sea. A cold wind whispers.\nQuill: Should we go in, or look at the beach?");
  // Typing A-D in a field must not do anything else.
  await mid.locator("textarea.body").press("End");
  await mid.locator("textarea.body").type(" abcd 1234");
  await tap(mid.locator(".pq-endkind button", { hasText: "CHOICES" }));
  await tap(mid.locator("button", { hasText: "+ ADD CHOICE" }));
  await mid.locator('input[aria-label="Choice 1 text"]').fill("Go into the cave");
  await mid.locator('select[aria-label="Choice 1 goes to"]').selectOption("__new__");
  await tap(mid.locator("button", { hasText: "+ ADD CHOICE" }));
  await mid.locator('input[aria-label="Choice 2 text"]').fill("Walk on the beach");
  await mid.locator('select[aria-label="Choice 2 goes to"]').selectOption("__new__");
  const bodyVal = await mid.locator("textarea.body").inputValue();
  if (!bodyVal.includes("abcd 1234")) problems.push("typing in the body lost keys");
  // Page 2: cave ending
  await tap(page.locator(".pq-pagelist button", { hasText: "page-2" }));
  await mid.locator("label", { hasText: "Scene" }).locator("select").selectOption("cave");
  await mid.locator('select[aria-label="Cast 2"]').selectOption("ghost");
  await mid.locator('select[aria-label="Mood 2"]').selectOption("happy");
  await mid.locator("textarea.body").fill("Inside, a friendly ghost sings. The cave echoes with music.\nGhost: Welcome, brave reader!");
  await mid.locator("label", { hasText: "Ending name" }).locator("input").fill("The Singing Cave");
  // Page 3: beach, secret ending
  await tap(page.locator(".pq-pagelist button", { hasText: "page-3" }));
  await mid.locator("label", { hasText: "Scene" }).locator("select").selectOption("beach");
  await mid.locator("textarea.body").fill("On the beach you find a bottle with a map inside.");
  await mid.locator("label", { hasText: "Ending type" }).locator("select").selectOption("secret");
  await mid.locator("label", { hasText: "Ending name" }).locator("input").fill("The Bottle Map");
  await page.waitForTimeout(200);
  const status = await page.locator(".pq-col.right h3", { hasText: "CHECK" }).innerText();
  const level = await page.locator(".pq-meter .lbl").innerText();
  notes.push(`validator: ${status.replace(/\s+/g, " ")}; ${level.replace(/\s+/g, " ")}`);
  if (!/READY/.test(status)) {
    const issues = await page.locator(".pq-issues li").allInnerTexts();
    problems.push(`draft not ready: ${issues.join(" | ")}`);
  }
  // Break it on purpose: a choice with no target shows an error, then fix it.
  await tap(page.locator(".pq-pagelist button").first());
  await tap(mid.locator("button", { hasText: "+ ADD CHOICE" }));
  await page.waitForTimeout(150);
  const broken = await page.locator(".pq-issues .error").allInnerTexts();
  if (!broken.length) problems.push("validator did not flag an unfinished choice");
  notes.push(`unfinished choice → "${(broken[0] || "").slice(0, 70)}"`);
  await tap(mid.locator('button[aria-label="Remove choice"]').nth(2));

  // Playtest from the start and reach the cave ending.
  await tap(page.locator(".pq-cta", { hasText: "From start" }));
  await page.waitForTimeout(400);
  let r = await R(page);
  if (!r || r.page !== "start") problems.push(`playtest did not start at "start" (${r && r.page})`);
  await choose(page, touch, 0);
  r = await R(page);
  if (r.page !== "page-2") problems.push(`playtest choice went to ${r.page}`);
  await finish(page, touch);
  const endTitle = await page.locator('[aria-label="Ending and mission report"] .pq-endname').innerText().catch(() => "");
  notes.push(`playtest ending: ${endTitle}`);
  if (!/Singing Cave/.test(endTitle)) problems.push("playtest ending missing");
  await tap(page.locator('[aria-label="Ending and mission report"] .pq-cta', { hasText: "desk" }));
  await page.waitForTimeout(300);
  if (!(await page.locator(".pq-desk").count())) problems.push("did not return to the desk");

  // Export, then import the downloaded file.
  const [dl] = await Promise.all([page.waitForEvent("download"), tap(page.locator(".pq-deskbar button", { hasText: "EXPORT" }))]);
  const file = path.join(os.tmpdir(), `pq-export-${Date.now()}.story`);
  await dl.saveAs(file);
  const text = fs.readFileSync(file, "utf8");
  notes.push(`exported ${dl.suggestedFilename()} (${text.split("\n").length} lines)`);
  if (!/=== page-3/.test(text) || !/end: secret The Bottle Map/.test(text)) problems.push("export text incomplete");
  await page.locator('.pq-deskbar input[type="file"]').setInputFiles(file);
  await page.waitForTimeout(300);
  const drafts = await page.locator('.pq-deskbar select[aria-label="Draft"] option').allInnerTexts();
  const msg = await page.locator(".pq-deskmsg").innerText().catch(() => "");
  notes.push(`after import: drafts ${drafts.join(", ")}; ${msg}`);
  if (drafts.length !== 2 || !/3 pages, 0 errors/.test(msg)) problems.push("re-import failed");
  const pages = await page.locator(".pq-pagelist li").count();
  if (pages !== 3) problems.push(`imported draft has ${pages} pages`);
  await layout(page, problems, "writer");

  // The drafts are on the shelf under MY BOOKS.
  await tap(page.locator(".pq-deskbar button", { hasText: "LIBRARY" }));
  await page.waitForTimeout(300);
  await tap(page.locator(".pq-tab", { hasText: "MY BOOKS" }));
  await page.waitForTimeout(200);
  const label = await page.locator(".pq-shelf-label").innerText().catch(() => "");
  const mine = await page.locator(".pq-spine").allInnerTexts();
  notes.push(`${label}: ${mine.map((s) => s.replace(/\s+/g, " ")).join(" / ")}`);
  if (!/by SpiderBen10/.test(label) || !mine.some((s) => /Cave of Echoes/.test(s))) problems.push("drafts not on the shelf");
  fs.unlinkSync(file);
  await ctx.close();
  return { run: `writer's desk ${touch ? "touch" : "keyboard"}`, problems, errors, notes };
}

(async () => {
  const browser = await chromium.launch();
  const runs = [];
  for (const touch of [false, true]) {
    runs.push(() => youngRun(browser, "K", touch));
    runs.push(() => youngRun(browser, "3", touch));
    for (const g of ["4", "7", "11"]) runs.push(() => readRun(browser, g, touch));
  }
  runs.push(() => pickerRun(browser));
  runs.push(() => writerRun(browser, false));
  runs.push(() => writerRun(browser, true));
  let bad = 0;
  for (const f of runs) {
    let r;
    try {
      r = await f();
    } catch (e) {
      r = { run: "?", problems: [String(e).slice(0, 400)], errors: [], notes: [] };
    }
    const ok = !r.problems.length && !r.errors.length;
    if (!ok) bad++;
    console.log(`${ok ? "PASS" : "FAIL"} ${r.run}`);
    for (const n of r.notes) console.log(`   · ${n}`);
    for (const p of r.problems) console.log(`   ✘ ${p}`);
    for (const e of r.errors) console.log(`   ! ${e}`);
  }
  await browser.close();
  process.exit(bad ? 1 : 0);
})();
