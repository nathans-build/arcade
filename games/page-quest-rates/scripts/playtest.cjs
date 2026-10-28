/*
 * Automated playtest for Page Quest: Rate & Percent Mysteries (dev only). Needs a running preview
 * and a global Playwright (Chromium):
 *   npm run build && npx vite preview --port 8911 --host 127.0.0.1 &
 *   node scripts/playtest.cjs        # SHOT=1 also saves docs/screenshot.png, docs/scene.png
 *                                    # and ../../site/img/page-quest-rates.png (640x400 scene)
 * Runs at desktop (1280x800, keyboard) and phone (390x844, touch):
 *  - the library shows only the math shelf, "SpiderBen10's special edition · Math 6 Unit 3", no Writer's Desk
 *  - reads The Mall Rush Mystery to its win ending: a math gate answered WRONG then right with
 *    both hint stages (H / HINT), a chain missed first (it breaks into steps with "work so far"),
 *    chains solved first try (bonus points), and the gentle rules (no hearts lost, nothing ends)
 *  - the ending's skill report, Export CSV + JSON (downloads checked), and the redo round
 *  - The Needle of the Dunes and Paint the Room, Robot Crew! read straight through to an ending
 *  - the MUSIC/SFX toolbar stays tappable above the ending overlay; no horizontal scroll; no page errors
 */
const path = require("path");
const fs = require("fs");
const { execSync } = require("child_process");
const { chromium } = require(path.join(execSync("npm root -g").toString().trim(), "playwright"));

const BASE = process.env.BASE || "http://127.0.0.1:8911/";
const SHOT = !!process.env.SHOT;
const DOCS = path.join(__dirname, "..", "docs");
const SITE_IMG = path.join(__dirname, "..", "..", "..", "site", "img", "page-quest-rates.png");

/** Which choice to take on each page of the mall book (default: the first). */
const PLAN = { entrance: 0, "depot-2": 0, "scarf-2": 1, "security-2": 1, "tech-2": 0, "office-3": 0 };

async function newPage(browser, phone) {
  const ctx = await browser.newContext(
    phone
      ? { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2, acceptDownloads: true }
      : { viewport: { width: 1280, height: 800 }, acceptDownloads: true },
  );
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (m) => {
    if (m.type() === "error" && !/fonts|ERR_|Failed to load resource/.test(m.text())) errors.push(m.text());
  });
  return { ctx, page, errors };
}

const R = (page) =>
  page.evaluate(() => {
    const r = document.querySelector(".pq-reader");
    return r ? { page: r.dataset.page, hearts: Number(r.dataset.hearts), gate: r.dataset.gate, score: Number(r.dataset.score), revealed: r.dataset.revealed === "1" } : null;
  });

async function tap(page, phone, locator) {
  if (phone) await locator.tap();
  else await locator.click();
  await page.waitForTimeout(120);
}

/** Checkpoints bring Quill's reading transmission (an ELA question): answer it and go back to the story. */
async function transmission(page, phone, log) {
  const dlg = page.locator('[aria-label="Transmission question"]');
  if (!(await dlg.count())) return;
  await tap(page, phone, dlg.locator(".pq-choice").first());
  log.push(`transmission: ${(await dlg.locator(".verdict").innerText().catch(() => "?")).slice(0, 40)}`);
  await tap(page, phone, dlg.locator(".pq-cta"));
  await page.waitForTimeout(150);
}

async function reveal(page, phone) {
  for (let i = 0; i < 4; i++) {
    const r = await R(page);
    if (!r || r.revealed) return;
    if (phone) await page.locator(".pq-screen canvas").tap();
    else await page.keyboard.press("Space");
    await page.waitForTimeout(120);
  }
}

const mathInfo = (page) =>
  page.evaluate(() => {
    const g = document.querySelector(".pq-math");
    if (!g) return null;
    return { phase: g.dataset.mathPhase, step: Number(g.dataset.step), tag: g.dataset.tag, answer: Number(g.dataset.answer) };
  });

async function pick(page, phone, d) {
  if (phone) await page.locator(".pq-math .pq-answers .pq-choice").nth(d).tap();
  else await page.keyboard.press(String(d + 1));
  await page.waitForTimeout(150);
}

/**
 * Solve the math gate on screen. mode "wrong-hints": a wrong answer, both hints, then right.
 * mode "miss-chain": miss the chain's final answer, then walk through every step.
 * mode "right": right on the first try.
 */
async function solveGate(page, phone, mode, log, problems) {
  let info = await mathInfo(page);
  if (!info) return;
  const where = `${(await R(page)).page} (${info.tag})`;
  if (mode === "wrong-hints" || mode === "miss-chain") {
    const hearts0 = (await R(page)).hearts;
    const wrong = [0, 1, 2, 3].find((d) => d !== info.answer);
    await pick(page, phone, wrong);
    const fb = await page.locator(".pq-math .pq-feedback.no").innerText().catch(() => "");
    if (!/Quill:/.test(fb) || fb.length < 20) problems.push(`${where}: no named-mistake feedback after a wrong answer ("${fb}")`);
    else log.push(`wrong answer -> ${fb.slice(0, 100)}`);
    if ((await R(page)).hearts !== hearts0) problems.push(`${where}: a wrong answer changed the hearts`);
    if (await page.locator(".pq-overlay").count()) problems.push(`${where}: a wrong answer opened an overlay`);
    if (mode === "wrong-hints") {
      for (let k = 0; k < 2; k++) {
        if (phone) await tap(page, phone, page.locator(".pq-hintbtn"));
        else await page.keyboard.press("h");
        await page.waitForTimeout(100);
      }
      const hints = await page.locator(".pq-hints > div").count();
      if (hints !== 2) problems.push(`${where}: expected 2 hint stages, saw ${hints}`);
      else log.push(`both hint stages: ${(await page.locator(".pq-hints").innerText()).replace(/\s+/g, " ").slice(0, 110)}`);
    }
    info = await mathInfo(page);
    if (mode === "miss-chain") {
      if (info.phase !== "steps") problems.push(`${where}: missing a chain should break it into steps (phase ${info.phase})`);
      let steps = 0;
      while (info && info.phase === "steps" && steps < 6) {
        await pick(page, phone, info.answer);
        steps++;
        info = await mathInfo(page);
      }
      const work = await page.locator(".pq-work li").count();
      log.push(`chain "${where}" broken into ${steps} steps; work-so-far list has ${work} lines`);
      if (work !== steps) problems.push(`${where}: work-so-far shows ${work} lines after ${steps} steps`);
    }
  }
  info = await mathInfo(page);
  if (info && info.phase !== "done") await pick(page, phone, info.answer);
  info = await mathInfo(page);
  if (!info || info.phase !== "done") problems.push(`${where}: gate not solved`);
  if (phone) await page.locator(".pq-math .pq-cta").tap();
  else await page.keyboard.press("Enter");
  await page.waitForTimeout(250);
}

async function layout(page, problems, where) {
  const l = await page.evaluate(() => ({
    hScroll: document.documentElement.scrollWidth > window.innerWidth + 1,
    small: [...document.querySelectorAll(".pq-choice, .pq-cta")]
      .filter((b) => b.offsetParent)
      .map((b) => b.getBoundingClientRect())
      .filter((r) => r.height < 36 || r.width < 40).length,
  }));
  if (l.hScroll) problems.push(`${where}: horizontal scroll`);
  if (l.small) problems.push(`${where}: ${l.small} tap targets smaller than 36px`);
}

async function toolbarTappable(page, problems, where) {
  const ok = await page.evaluate(() => {
    const b = [...document.querySelectorAll(".pq-toolbar button")].find((x) => /MUSIC|SFX|SOUND/.test(x.textContent || ""));
    if (!b) return "no music button";
    const r = b.getBoundingClientRect();
    const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    return hit === b || b.contains(hit) ? "ok" : `covered by ${hit && hit.className}`;
  });
  if (ok !== "ok") problems.push(`${where}: MUSIC/SFX toolbar not tappable (${ok})`);
}

async function run(browser, phone) {
  const label = phone ? "phone 390x844 (touch)" : "desktop 1280x800 (keyboard)";
  const { ctx, page, errors } = await newPage(browser, phone);
  const problems = [];
  const log = [];
  await page.goto(`${BASE}?grade=6&debug`);
  await page.waitForTimeout(600);

  // ---- library ----
  const head = await page.locator(".pq-libhead").innerText();
  if (!/SpiderBen10's special edition · Math 6 Unit 3/.test(head)) problems.push(`library header: ${head}`);
  const spines = await page.locator(".pq-spine").allInnerTexts();
  log.push(`shelf: ${spines.map((s) => s.split("\n")[0]).join(" | ")}`);
  if (spines.length !== 3) problems.push(`shelf has ${spines.length} books (want the 3 math books)`);
  if (await page.locator("text=Writer's Desk").count()) problems.push("Writer's Desk is visible");
  await layout(page, problems, "library");
  await toolbarTappable(page, problems, "library");
  const musicBtn = page.locator(".pq-toolbar button", { hasText: /MUSIC/ });
  const before = await musicBtn.innerText();
  await tap(page, phone, musicBtn);
  if (before === (await musicBtn.innerText())) problems.push("MUSIC button did not toggle");
  await tap(page, phone, musicBtn);

  // ---- read the mall book ----
  await tap(page, phone, page.locator(".pq-spine", { hasText: "Mall Rush" }));
  await tap(page, phone, page.locator(".pq-detail .pq-cta").first());
  await page.waitForTimeout(300);
  let chainMissed = false;
  let gates = 0;
  let pagesRead = 0;
  for (let i = 0; i < 60; i++) {
    const r = await R(page);
    if (!r) break;
    pagesRead++;
    await transmission(page, phone, log);
    await reveal(page, phone);
    if (await page.locator(".pq-math").count()) {
      const isChain = /STORY PROBLEM/.test(await page.locator(".pq-math .pq-tag").first().innerText());
      const m = gates === 0 ? "wrong-hints" : isChain && !chainMissed ? "miss-chain" : "right";
      if (m === "miss-chain") chainMissed = true;
      if (gates === 0) {
        await layout(page, problems, `math gate on ${r.page}`);
        if (await page.locator(".pq-model").count()) log.push(`model shown: ${await page.locator(".pq-model .cap").innerText()}`);
      }
      const scoreBefore = r.score;
      await solveGate(page, phone, m, log, problems);
      gates++;
      if (m === "right" && isChain) log.push(`chain on ${r.page} solved first try: +${(await R(page)).score - scoreBefore} points`);
      continue;
    }
    const end = page.locator(".pq-after .pq-cta", { hasText: /The end/ });
    if (await end.count()) {
      await tap(page, phone, end);
      await page.waitForTimeout(400);
      break;
    }
    const choice = PLAN[r.page] ?? 0;
    if (phone) await page.locator(".pq-choices .pq-choice").nth(choice).tap();
    else await page.keyboard.press("abcd"[choice]);
    await page.waitForTimeout(250);
  }
  log.push(`read ${pagesRead} pages, ${gates} math gates`);
  if (gates < 8) problems.push(`only ${gates} math gates on the path`);

  // ---- ending + report ----
  const report = page.locator('[aria-label="Ending and mission report"]');
  if (!(await report.count())) problems.push("no ending report");
  else {
    log.push(`ending: ${(await report.locator(".pq-endname").innerText()).replace(/\s+/g, " ")}`);
    const rows = await report.locator(".pq-report tbody tr").allInnerTexts();
    log.push(`skill report: ${rows.length} skills, e.g. ${rows.slice(0, 3).map((x) => x.replace(/\s+/g, " ")).join(" / ")}`);
    if (rows.length < 4) problems.push(`skill report has only ${rows.length} rows`);
    if (!rows.every((x) => /\d+\/\d+/.test(x))) problems.push("skill report rows need first-try counts");
    await toolbarTappable(page, problems, "ending overlay");
    await layout(page, problems, "ending report");
    for (const ext of ["CSV", "JSON"]) {
      const [dl] = await Promise.all([page.waitForEvent("download"), tap(page, phone, report.locator(".pq-small", { hasText: `EXPORT ${ext}` }))]);
      const text = fs.readFileSync(await dl.path(), "utf8");
      if (ext === "CSV") {
        const header = text.split("\n")[0];
        if (header !== "date,game,book,skill tag,standard,question,answer given,correct answer,correct/incorrect,hints used") problems.push(`CSV header: ${header}`);
        log.push(`CSV export: ${dl.suggestedFilename()} with ${text.trim().split("\n").length - 1} answers`);
        if (!/,incorrect,/.test(text) || !/,correct,/.test(text)) problems.push("CSV should have correct and incorrect rows");
      } else {
        const rowsJ = JSON.parse(text);
        log.push(`JSON export: ${dl.suggestedFilename()} with ${rowsJ.length} answers`);
        if (!rowsJ.some((x) => x.hintsUsed > 0)) problems.push("JSON export should record the hints used");
      }
    }
    // ---- redo round ----
    const redo = report.locator(".pq-cta", { hasText: "Redo the ones I missed" });
    if (!(await redo.count())) problems.push("no Redo button after missing questions");
    else {
      await tap(page, phone, redo);
      await page.waitForTimeout(400);
      let n = 0;
      for (; n < 15; n++) {
        const info = await mathInfo(page);
        if (!info) break;
        await pick(page, phone, info.answer);
        if (phone) await page.locator(".pq-math .pq-cta").tap();
        else await page.keyboard.press("Enter");
        await page.waitForTimeout(200);
      }
      const done = await page.locator(".pq-redo-done").innerText().catch(() => "");
      log.push(`redo round in the library: ${n} fresh questions; ${done.split("\n").slice(0, 2).join(" ")}`);
      if (!/REDO RESULTS/.test(done) || n < 1) problems.push("redo round did not finish");
      await tap(page, phone, page.locator(".pq-redo-done .pq-cta", { hasText: "Back to library" }));
      await page.waitForTimeout(300);
      log.push(`back in the library; redo button ${(await page.locator(".pq-redo-btn").count()) ? "still shown" : "gone (all mastered)"}`);
    }
  }

  // ---- the other two books, read straight through (right answers), to an ending ----
  for (const title of ["Needle of the Dunes", "Paint the Room"]) {
    await page.goto(`${BASE}?grade=6&debug`);
    await page.waitForTimeout(500);
    await tap(page, phone, page.locator(".pq-spine", { hasText: title }));
    await tap(page, phone, page.locator(".pq-detail .pq-cta").first());
    await page.waitForTimeout(300);
    let g = 0;
    for (let i = 0; i < 60; i++) {
      const r = await R(page);
      if (!r) break;
      await transmission(page, phone, []);
      await reveal(page, phone);
      if (await page.locator(".pq-math").count()) {
        if (g === 0 && (await page.locator(".pq-math").count())) await layout(page, problems, `${title} first gate`);
        await solveGate(page, phone, "right", [], problems);
        g++;
        continue;
      }
      const end = page.locator(".pq-after .pq-cta", { hasText: /The end/ });
      if (await end.count()) {
        await tap(page, phone, end);
        await page.waitForTimeout(400);
        break;
      }
      if (phone) await page.locator(".pq-choices .pq-choice").first().tap();
      else await page.keyboard.press("a");
      await page.waitForTimeout(200);
    }
    const name = await page.locator('[aria-label="Ending and mission report"] .pq-endname').innerText().catch(() => "");
    log.push(`${title}: ${g} math gates, ending ${name.replace(/\s+/g, " ")}`);
    if (!name) problems.push(`${title}: no ending reached`);
  }

  if (SHOT && !phone) {
    // Screenshot: the mall, mid-story, with Quill's math gate on screen.
    await page.evaluate(() => localStorage.clear());
    await page.goto(`${BASE}?grade=6`);
    await page.waitForTimeout(500);
    await page.locator(".pq-spine", { hasText: "Mall Rush" }).click();
    await page.locator(".pq-detail .pq-cta").first().click();
    await page.waitForTimeout(400);
    await page.keyboard.press("Space");
    await page.waitForTimeout(200);
    await page.keyboard.press("a");
    await page.waitForTimeout(1600);
    await page.keyboard.press("Space");
    await page.waitForTimeout(800);
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
    fs.writeFileSync(SITE_IMG, Buffer.from(png.split(",")[1], "base64"));
    log.push("saved docs/screenshot.png, docs/scene.png and site/img/page-quest-rates.png");
  }

  if (errors.length) problems.push(...errors.map((e) => `page error: ${e}`));
  await ctx.close();
  console.log(`\n== ${label}`);
  for (const l of log) console.log(`  ${l}`);
  for (const p of problems) console.log(`  PROBLEM: ${p}`);
  return problems.length;
}

(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROME || undefined });
  let bad = 0;
  bad += await run(browser, false);
  bad += await run(browser, true);
  await browser.close();
  console.log(bad ? `\n${bad} problem(s).` : "\nPlaytest OK.");
  process.exit(bad ? 1 : 0);
})();
