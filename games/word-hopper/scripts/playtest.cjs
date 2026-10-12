/*
 * Automated playtest (dev only) of the built game, with a global Playwright (Chromium):
 *   npm run build
 *   node scripts/playtest.cjs            (SHOT=../../site/img/word-hopper.png saves a 640x400 Word Builder picture)
 * It serves dist/ at /word-hopper/ and the arcade's fonts at /fonts/ on port 8801 (PORT to change) and stops
 * the server when done.
 * For grades K, 1 and 2, on a 390x844 phone (taps) and a 1024x768 tablet (clicks, plus keys and mouse drags):
 * the grade badge, PLAY, the word garden, then every mini-game (Letter Match, Word Builder, Rhyme Time, Sound
 * Sort, Sight Words) for a full round: wrong answers wiggle, give a spoken hint, never end the game and light up
 * the right answer after two misses; right answers move on; five items earn a sticker and the book fills.
 * Contexts use reduced motion (the pulsing buttons otherwise never count as "stable" to Playwright).
 * Speech is captured to check that every prompt is read aloud. Also: no grade picker when ?grade= is given,
 * a K/1/2 picker without it, grade 5 plays grade 2 words, saved keys all start with arcade., no sideways scroll
 * (390px, 360px, 1024px, phone landscape), no console errors and no requests leaving the page's own server.
 */
const path = require("path");
const fs = require("fs");
const http = require("http");
const { execSync } = require("child_process");
const { chromium } = require(path.join(execSync("npm root -g").toString().trim(), "playwright"));

const PORT = Number(process.env.PORT || 8801);
const ROOT = path.resolve(__dirname, "..");
const DIST = path.join(ROOT, "dist");
const FONTS = path.resolve(ROOT, "../../site/fonts");
const BASE = `http://127.0.0.1:${PORT}/word-hopper/`;
const ORIGIN = `http://127.0.0.1:${PORT}/`;
const SHOT = process.env.SHOT;
const ACTS = ["letters", "builder", "rhyme", "sort", "sight"];

const TYPES = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".json": "application/json", ".woff2": "font/woff2", ".png": "image/png" };

function serve() {
  const server = http.createServer((req, res) => {
    const url = decodeURIComponent(req.url.split("?")[0]);
    let file = null;
    if (url.startsWith("/word-hopper/")) file = path.join(DIST, url.slice("/word-hopper/".length) || "index.html");
    else if (url.startsWith("/fonts/")) file = path.join(FONTS, url.slice("/fonts/".length));
    if (file && fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, "index.html");
    if (!file || !fs.existsSync(file)) {
      res.writeHead(404);
      res.end("not found");
      return;
    }
    res.writeHead(200, { "content-type": TYPES[path.extname(file)] || "application/octet-stream" });
    fs.createReadStream(file).pipe(res);
  });
  return new Promise((resolve) => server.listen(PORT, "127.0.0.1", () => resolve(server)));
}

const state = (page) => page.evaluate(() => window.__wh);

async function noSideways(page) {
  return page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1 && document.body.scrollWidth <= window.innerWidth + 1);
}

async function newPage(browser, mode, query) {
  const touch = mode === "phone";
  const ctx = await browser.newContext(
    touch
      ? { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2, reducedMotion: "reduce" }
      : { viewport: { width: 1024, height: 768 }, reducedMotion: "reduce" },
  );
  // Capture speech instead of playing it.
  await ctx.addInitScript(() => {
    window.__spoken = [];
    try {
      const s = window.speechSynthesis;
      s.speak = (u) => window.__spoken.push(u.text);
      s.cancel = () => {};
    } catch {
      // no speech in this browser
    }
  });
  const page = await ctx.newPage();
  const errors = [];
  const external = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  page.on("request", (r) => {
    if (!r.url().startsWith(ORIGIN) && !r.url().startsWith("data:")) external.push(r.url());
  });
  await page.goto(`${BASE}?${query}`, { waitUntil: "load" });
  await page.waitForFunction(() => !!window.__wh);
  return { ctx, page, errors, external, touch };
}

const spoken = (page) => page.evaluate(() => window.__spoken.join(" | "));
const clearSpoken = (page) => page.evaluate(() => (window.__spoken = []));

async function waitItem(page, idx) {
  await page.waitForFunction((i) => window.__wh.screen === "play" && window.__wh.idx === i && !window.__wh.solved, idx, { timeout: 5000 });
}

/** Drag the element `from` onto `to` with real pointer moves (mouse on the tablet, touch-style pointer on the phone). */
async function drag(page, from, to, touch) {
  const a = await from.boundingBox();
  const b = await to.boundingBox();
  const ax = a.x + a.width / 2, ay = a.y + a.height / 2, bx = b.x + b.width / 2, by = b.y + b.height / 2;
  if (!touch) {
    await page.mouse.move(ax, ay);
    await page.mouse.down();
    for (let i = 1; i <= 8; i++) await page.mouse.move(ax + ((bx - ax) * i) / 8, ay + ((by - ay) * i) / 8);
    await page.mouse.up();
  } else {
    const opts = (x, y) => ({ pointerId: 7, pointerType: "touch", isPrimary: true, clientX: x, clientY: y, button: 0, buttons: 1, bubbles: true });
    await from.dispatchEvent("pointerdown", opts(ax, ay));
    for (let i = 1; i <= 8; i++) await from.dispatchEvent("pointermove", opts(ax + ((bx - ax) * i) / 8, ay + ((by - ay) * i) / 8));
    await from.dispatchEvent("pointerup", { ...opts(bx, by), buttons: 0 });
  }
}

/** Play one full round of `act`. Returns problems found. */
async function playRound(page, act, touch, opts = {}) {
  const problems = [];
  const tap = (loc) => (touch ? loc.tap() : loc.click());
  await clearSpoken(page);
  await tap(page.locator(`.wh-lily[data-activity=${act}]`));
  await page.waitForFunction((a) => window.__wh.screen === "play" && window.__wh.activity === a, act);
  if (!(await noSideways(page))) problems.push(`${act}: sideways scroll`);
  const first = await state(page);
  const firstSay = first.item.say;
  if (!(await spoken(page)).includes(firstSay)) problems.push(`${act}: first prompt not read aloud (${firstSay})`);
  const level = first.level;

  for (let idx = 0; idx < 5; idx++) {
    await waitItem(page, idx);
    const s = await state(page);
    const item = s.item;
    if (item.activity !== act) problems.push(`${act}: item activity ${item.activity}`);
    // Wrong tries on the first two items (two misses on item 0, one on item 1); a hint appears after two.
    const misses = idx === 0 ? 2 : idx === 1 ? 1 : 0;
    if (item.type === "choice") {
      const wrongIdx = item.choices.map((_, i) => i).filter((i) => i !== item.answer);
      for (let m = 0; m < misses; m++) {
        await clearSpoken(page);
        const w = wrongIdx[m];
        if (opts.keys && m === 0) await page.keyboard.press(String(w + 1));
        else await tap(page.locator(`.wh-choice[data-choice="${w}"]`));
        await page.waitForTimeout(80);
        const t = await state(page);
        if (t.screen !== "play" || t.solved || t.tries !== m + 1) problems.push(`${act}#${idx}: wrong answer changed screen/state ${t.screen} tries ${t.tries}`);
        if (!(await page.locator(`.wh-choice[data-choice="${w}"]`).getAttribute("class")).includes("tried")) problems.push(`${act}#${idx}: wrong choice not marked`);
        if (!(await spoken(page)).includes(item.whyWrong[w])) problems.push(`${act}#${idx}: wrong-answer hint not spoken`);
        // Tapping the same wrong choice again does nothing.
        const again = page.locator(`.wh-choice[data-choice="${w}"]`);
        await (touch ? again.tap({ force: true }) : again.click({ force: true }));
        if ((await state(page)).tries !== m + 1) problems.push(`${act}#${idx}: repeated wrong tap counted`);
      }
      if (misses >= 2 && !(await page.locator(`.wh-choice[data-choice="${item.answer}"]`).getAttribute("class")).includes("glow")) problems.push(`${act}#${idx}: no hint glow after two misses`);
      await clearSpoken(page);
      if (opts.keys && idx === 2) await page.keyboard.press("abcd"[item.answer]);
      else await tap(page.locator(`.wh-choice[data-choice="${item.answer}"]`));
    } else if (item.type === "build") {
      // A wrong tile first (a spare one), then the right tiles in order; one tile by dragging.
      const used = new Set();
      if (misses) {
        const spare = item.tiles.findIndex((t) => !item.units.includes(t));
        await clearSpoken(page);
        await tap(page.locator(`[data-tile="${spare}"]`));
        await page.waitForTimeout(60);
        const t = await state(page);
        if (t.tries !== 1 || t.solved) problems.push(`${act}#${idx}: wrong tile not handled`);
        if (!(await spoken(page)).includes(item.whyWrong)) problems.push(`${act}#${idx}: wrong-tile hint not spoken`);
      }
      for (let u = item.given; u < item.units.length; u++) {
        const ti = item.tiles.findIndex((t, i) => t === item.units[u] && !used.has(i));
        used.add(ti);
        const tile = page.locator(`[data-tile="${ti}"]`);
        if (idx === 1 && u === item.units.length - 1) {
          await drag(page, tile, page.locator(`.wh-slot[data-drop="${u}"]`), touch);
        } else if (opts.keys && idx === 2) {
          await page.keyboard.press(String(ti + 1));
        } else await tap(tile);
        await page.waitForTimeout(40);
      }
    } else {
      // Sound Sort: a wrong basket first (only one: then the tried basket is greyed out), then the right one
      // (dragging the card on item 1).
      for (let m = 0; m < Math.min(misses, 1); m++) {
        await clearSpoken(page);
        await tap(page.locator(`.wh-basket[data-basket="${1 - item.answer}"]`));
        await page.waitForTimeout(60);
        const t = await state(page);
        if (t.tries !== 1 || t.solved) problems.push(`${act}#${idx}: wrong basket not handled (tries ${t.tries})`);
        if (!(await spoken(page)).includes(item.whyWrong)) problems.push(`${act}#${idx}: wrong-basket hint not spoken`);
        await tap(page.locator(`.wh-basket[data-basket="${1 - item.answer}"]`));
        if ((await state(page)).tries !== 1) problems.push(`${act}#${idx}: tried basket counted twice`);
      }
      if (idx === 1) await drag(page, page.locator(".wh-sortcard"), page.locator(`.wh-basket[data-basket="${item.answer}"]`), touch);
      else if (opts.keys && idx === 2) await page.keyboard.press(String(item.answer + 1));
      else await tap(page.locator(`.wh-basket[data-basket="${item.answer}"]`));
    }
    await page.waitForFunction(() => window.__wh.solved || window.__wh.screen === "reward", null, { timeout: 3000 }).catch(() => problems.push(`${act}#${idx}: right answer not accepted`));
    if (idx < 4) {
      await waitItem(page, idx + 1).catch(() => problems.push(`${act}#${idx}: did not move on`));
      const said = await spoken(page);
      const nextSay = (await state(page)).item.say;
      if (!said.includes(nextSay)) problems.push(`${act}#${idx + 1}: next prompt not read aloud`);
      if (!said.includes(item.praise)) problems.push(`${act}#${idx}: no spoken praise`);
    }
  }
  await page.waitForFunction(() => window.__wh.screen === "reward", null, { timeout: 5000 }).catch(() => problems.push(`${act}: no sticker screen`));
  const r = await state(page);
  if (!r.reward || !(await page.locator(".wh-reward-sticker").isVisible())) problems.push(`${act}: no sticker shown`);
  if (!(await spoken(page)).includes("sticker")) problems.push(`${act}: sticker not announced`);
  if (!(await noSideways(page))) problems.push(`${act}: sideways scroll on the sticker screen`);
  if (level !== r.level) problems.push(`${act}: level changed`);
  await tap(page.locator(".wh-big-btn", { hasText: "GARDEN" }));
  await page.waitForFunction(() => window.__wh.screen === "hub");
  return problems;
}

async function runGrade(browser, grade, mode) {
  const { ctx, page, errors, external, touch } = await newPage(browser, mode, `grade=${grade}&debug&fast&seed=${grade === "K" ? 11 : Number(grade) * 17 + 3}`);
  const problems = [];
  const tap = (loc) => (touch ? loc.tap() : loc.click());
  const badge = await page.locator(".wh-gradebadge").innerText().catch(() => "");
  if (!badge.includes(grade === "K" ? "KINDERGARTEN" : `GRADE ${grade}`)) problems.push(`badge "${badge}"`);
  if ((await page.locator(".wh-grade").count()) !== 0) problems.push("grade picker shown although ?grade= was given");
  const fontsOk = await page.evaluate(async () => {
    await document.fonts.ready;
    return document.fonts.check('12px "Press Start 2P"');
  });
  if (!fontsOk) problems.push("Press Start 2P font not loaded from /fonts/");
  if (!(await noSideways(page))) problems.push("sideways scroll on the title");
  await tap(page.locator(".wh-play-btn"));
  await page.waitForFunction(() => window.__wh.screen === "hub");
  if (!(await spoken(page)).includes("Tadwin")) problems.push("hub greeting not spoken");
  if ((await page.locator(".wh-lily").count()) !== 6) problems.push("garden should have 5 games + sticker book");
  if (!(await noSideways(page))) problems.push("sideways scroll in the garden");
  // Tap targets are big.
  const small = await page.evaluate(() =>
    [...document.querySelectorAll("button, a")].filter((b) => b.offsetParent && (b.getBoundingClientRect().width < 56 || b.getBoundingClientRect().height < 56)).map((b) => b.className),
  );
  if (small.length) problems.push(`small tap targets: ${small.join(", ")}`);

  for (const act of ACTS) problems.push(...(await playRound(page, act, touch, { keys: !touch })));

  const s = await state(page);
  if (s.book.earned.length !== 5) problems.push(`stickers earned ${s.book.earned.length}, want 5`);
  await tap(page.locator('.wh-lily[data-activity="book"]'));
  await page.waitForFunction(() => window.__wh.screen === "book");
  const got = await page.locator(".wh-book-slot.got").count();
  if (got !== 5) problems.push(`sticker book shows ${got}`);
  if (!(await noSideways(page))) problems.push("sideways scroll in the sticker book");
  const keys = await page.evaluate(() => Object.keys(localStorage));
  if (keys.some((k) => !k.startsWith("arcade."))) problems.push(`stray storage keys ${keys}`);
  if (!keys.includes("arcade.word-hopper.stickers.v1") || !keys.includes("arcade.word-hopper.progress.v1")) problems.push(`missing saved keys ${keys}`);
  const prog = await page.evaluate(() => JSON.parse(localStorage.getItem("arcade.word-hopper.progress.v1")));
  if (!Object.keys(prog.standards).length) problems.push("no per-standard progress saved");

  // Escape returns to the garden from the book (keyboard is optional).
  if (!touch) {
    await page.keyboard.press("Escape");
    await page.waitForFunction(() => window.__wh.screen === "hub").catch(() => problems.push("Escape did not go back"));
  }
  if (errors.length) problems.push(`console errors: ${errors.join(" / ")}`);
  if (external.length) problems.push(`external requests: ${external.join(", ")}`);
  await ctx.close();
  return problems;
}

async function extras(browser) {
  const problems = [];
  // No ?grade: a K/1/2 picker on the title.
  {
    const { ctx, page, errors } = await newPage(browser, "tablet", "debug&fast");
    const n = await page.locator(".wh-grade").count();
    if (n !== 3) problems.push(`picker shows ${n} grades`);
    await page.locator(".wh-grade", { hasText: "1" }).click();
    if ((await state(page)).level !== "1") problems.push("picking grade 1 did not set level 1");
    await page.locator(".wh-play-btn").click();
    await page.waitForFunction(() => window.__wh.screen === "hub");
    await page.locator('.wh-lily[data-activity="builder"]').click();
    await page.waitForFunction(() => window.__wh.screen === "play");
    if ((await state(page)).item.level !== "1") problems.push("picker grade 1 not used");
    if (errors.length) problems.push(`console errors: ${errors.join(" / ")}`);
    await ctx.close();
  }
  // Grade 5 from the arcade plays grade 2 words.
  {
    const { ctx, page } = await newPage(browser, "tablet", "grade=5&debug&fast");
    const badge = await page.locator(".wh-gradebadge").innerText();
    if (!/GRADE 5/i.test(badge) || !/grade 2 words/i.test(badge)) problems.push(`grade 5 badge "${badge}"`);
    await page.locator(".wh-play-btn").click();
    await page.locator('.wh-lily[data-activity="rhyme"]').click();
    await page.waitForFunction(() => window.__wh.screen === "play");
    if ((await state(page)).item.level !== "2") problems.push("grade 5 does not play grade 2 words");
    await ctx.close();
  }
  // 360px phone and a phone on its side: no sideways scroll on every screen type.
  for (const vp of [{ width: 360, height: 740 }, { width: 844, height: 390 }]) {
    const ctx = await browser.newContext({ viewport: vp, hasTouch: true, isMobile: true, reducedMotion: "reduce" });
    const page = await ctx.newPage();
    await page.goto(`${BASE}?grade=2&debug&fast&seed=5`, { waitUntil: "load" });
    await page.waitForFunction(() => !!window.__wh);
    await page.locator(".wh-play-btn").tap();
    for (const act of ACTS) {
      await page.locator(`.wh-lily[data-activity=${act}]`).tap();
      await page.waitForFunction(() => window.__wh.screen === "play");
      if (!(await noSideways(page))) problems.push(`${vp.width}px: sideways scroll in ${act}`);
      const off = await page.evaluate(() => [...document.querySelectorAll(".wh-choice, .wh-tile, .wh-basket, .wh-slot")].some((e) => e.getBoundingClientRect().right > window.innerWidth + 1));
      if (off) problems.push(`${vp.width}px: ${act} has targets off screen`);
      await page.locator(".wh-bar .wh-btn").first().tap();
      await page.waitForFunction(() => window.__wh.screen === "hub");
    }
    await ctx.close();
  }
  return problems;
}

async function screenshot(browser) {
  const ctx = await browser.newContext({ viewport: { width: 960, height: 600 }, deviceScaleFactor: 2 / 3, reducedMotion: "reduce" });
  const page = await ctx.newPage();
  await page.goto(`${BASE}?grade=1&debug&seed=21`, { waitUntil: "load" });
  await page.waitForFunction(() => !!window.__wh);
  await page.evaluate(async () => {
    await document.fonts.ready;
  });
  await page.locator(".wh-play-btn").click();
  await page.locator('.wh-lily[data-activity="builder"]').click();
  await page.waitForFunction(() => window.__wh.screen === "play");
  // Place all but the last tile, so the picture shows the conveyor at work.
  const item = (await state(page)).item;
  const used = new Set();
  for (let u = item.given; u < item.units.length - 1; u++) {
    const ti = item.tiles.findIndex((t, i) => t === item.units[u] && !used.has(i));
    used.add(ti);
    await page.locator(`[data-tile="${ti}"]`).click();
  }
  await page.waitForTimeout(700);
  await page.screenshot({ path: SHOT, type: "png" });
  await ctx.close();
}

(async () => {
  const server = await serve();
  const browser = await chromium.launch();
  let failed = 0;
  try {
    for (const grade of (process.env.GRADES || "K,1,2").split(",")) {
      for (const mode of ["phone", "tablet"]) {
        const p = await runGrade(browser, grade, mode);
        console.log(`${p.length ? "FAIL" : "ok  "} grade ${grade} ${mode}${p.length ? ":\n  - " + p.join("\n  - ") : ""}`);
        failed += p.length;
      }
    }
    const p = await extras(browser);
    console.log(`${p.length ? "FAIL" : "ok  "} picker, grade 5, 360px and landscape${p.length ? ":\n  - " + p.join("\n  - ") : ""}`);
    failed += p.length;
    if (SHOT) {
      await screenshot(browser);
      console.log(`saved ${SHOT}`);
    }
  } catch (e) {
    console.log("FAIL (crashed):", e);
    failed++;
  } finally {
    await browser.close();
    server.close();
  }
  console.log(failed ? `${failed} problems` : "playtest passed");
  process.exit(failed ? 1 : 0);
})();
