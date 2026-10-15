/*
 * Automated playtest (dev only). Builds nothing: run `npm run build` first. It starts its own small
 * static server on port 8841 (PORT=…) serving dist/ at /kitchen-cafe/ and the arcade's fonts at
 * /fonts/, drives Chromium with the global Playwright, and stops the server when done:
 *   node scripts/playtest.cjs            (SHOT=../../site/img/kitchen-cafe.png saves a 640x400 in-game picture)
 *
 * Grade 1 on a 1280x800 desktop with the keyboard, grade 7 on a 390x844 phone with taps:
 *  - the grade badge (no picker when ?grade= is given), fonts from /fonts/, no sideways scroll;
 *  - start, walk to the ticket's stations, cook (grade 7 stops the meter in the green), and play
 *    a Science Check wrong (explanation shown, no stars lost, the café keeps going) and right (+1★);
 *  - serve every order of kitchen 1, see the summary unlock kitchen 2, and open kitchen 2;
 *  - no console errors and no requests leave the page's own server.
 * Then the picker: ?grade=7&topic=fractions opens MATH → Fractions, a SCIENCE shift asks only
 * science, ?grade=K&topic=money falls back with a note, and the title has no sideways scroll at 360px.
 */
const path = require("path");
const fs = require("fs");
const http = require("http");
const { execSync } = require("child_process");
const { chromium } = require(path.join(execSync("npm root -g").toString().trim(), "playwright"));

const PORT = Number(process.env.PORT || 8841);
const ROOT = path.resolve(__dirname, "..");
const DIST = path.join(ROOT, "dist");
const FONTS = path.resolve(ROOT, "../../site/fonts");
const BASE = `http://127.0.0.1:${PORT}/kitchen-cafe/`;
const ORIGIN = `http://127.0.0.1:${PORT}/`;
const SHOT = process.env.SHOT;

const TYPES = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".woff2": "font/woff2", ".json": "application/json", ".png": "image/png" };

function serve() {
  const server = http.createServer((req, res) => {
    const url = decodeURIComponent(new URL(req.url, ORIGIN).pathname);
    let file = null;
    if (url.startsWith("/kitchen-cafe/")) file = path.join(DIST, url.slice("/kitchen-cafe/".length) || "index.html");
    else if (url.startsWith("/fonts/")) file = path.join(FONTS, url.slice("/fonts/".length));
    if (file && !file.startsWith(DIST) && !file.startsWith(FONTS)) file = null;
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

const state = (page) =>
  page.evaluate(() => {
    const s = window.__kc && window.__kc.sim();
    if (!s) return null;
    return {
      phase: s.phase, chef: s.chef, next: s.nextStation, kitchen: s.kitchen.id, stars: s.stars, served: s.served, orders: s.orders.length,
      order: s.orderIdx, flash: s.flashT > 0, progress: s.work ? s.work.progress : null, answer: s.question ? s.question.answer : null, answered: !!s.answered,
      subject: s.question ? s.question.subject : null, topic: s.question ? s.question.topic : null, gen: s.question ? s.question.gen : null,
    };
  });

async function noSideways(page) {
  return page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 0.5 && document.body.scrollWidth <= window.innerWidth + 0.5);
}

const STATION_IDS = ["board", "bowl", "stove", "oven", "freezer"];

/**
 * Plays until the shift summary. `answerPlan(n)` returns "right" or "wrong" for the n-th question.
 * Returns what happened for checks.
 */
async function playShift(page, touch, answerPlan, problems, opts = {}) {
  const seen = { wrongOk: false, rightOk: false, asks: 0, subjects: new Set(), topics: new Set(), shot: false };
  const t0 = Date.now();
  while (Date.now() - t0 < 120000) {
    if (await page.locator(".kc-panel .kc-report, .kc-panel .kc-unlock").count()) break;
    if ((await page.locator("text=CLOSED FOR THE DAY").count()) || (await page.locator("text=CAFÉ CHAMPION").count())) break;
    const s = await state(page);
    if (!s) {
      await page.waitForTimeout(50);
      continue;
    }
    if (s.phase === "done") {
      await page.waitForTimeout(100);
      continue;
    }
    if (s.phase === "ask" && !s.answered) {
      await page.waitForSelector(".kc-card");
      const n = seen.asks++;
      seen.subjects.add(s.subject);
      seen.topics.add(s.topic);
      const want = answerPlan(n);
      const pickI = want === "right" ? s.answer : (s.answer + 1) % 4;
      const before = s.stars;
      if (touch) await page.locator(`.kc-opt[data-choice="${pickI}"]`).tap();
      else await page.keyboard.press(n % 2 ? "ABCD"[pickI].toLowerCase() : String(pickI + 1));
      await page.waitForSelector(".kc-card .kc-after");
      const after = await state(page);
      const head = await page.locator(".kc-card-head").innerText();
      const explain = await page.locator(".kc-explain").innerText();
      if (want === "wrong") {
        if (after.stars !== before) problems.push(`wrong answer changed stars ${before} -> ${after.stars}`);
        if (!/NOT QUITE/.test(head)) problems.push(`wrong answer header "${head}"`);
        if (explain.length < 20) problems.push("no explanation after a wrong answer");
        if (after.phase !== "ask") problems.push("a wrong answer ended the shift");
        if (s.subject === "science") seen.wrongOk = true;
      } else {
        if (after.stars !== before + 1) problems.push(`right answer should add a star (${before} -> ${after.stars})`);
        if (!/CORRECT/.test(head)) problems.push(`right answer header "${head}"`);
        if (s.subject === "science") seen.rightOk = true;
      }
      if (opts.checkPhone && !(await noSideways(page))) problems.push("sideways scroll with the question card open");
      if (touch) await page.locator(".kc-after .kc-cta").tap();
      else await page.keyboard.press("Enter");
      await page.waitForTimeout(30);
      continue;
    }
    if (s.phase === "cook" && s.next !== null) {
      if (touch) {
        await page.locator(`.kc-station[data-station="${STATION_IDS[s.next]}"]`).tap();
      } else if (s.chef !== s.next) {
        await page.keyboard.press(s.next > s.chef ? "ArrowRight" : "ArrowLeft");
      } else {
        await page.keyboard.press("Space");
      }
      await page.waitForTimeout(20);
      continue;
    }
    if (s.phase === "work") {
      if (opts.onWork && !seen.shot) seen.shot = await opts.onWork(s);
      if (s.progress >= 0.66 && s.progress <= 0.82 && !opts.k2) {
        if (touch) await page.locator(`.kc-station.working`).tap();
        else await page.keyboard.press("Space");
      }
      await page.waitForTimeout(15);
      continue;
    }
    await page.waitForTimeout(40);
  }
  return seen;
}

async function run(browser, grade, touch, problems) {
  const label = `grade ${grade} ${touch ? "phone" : "desktop"}`;
  const ctx = await browser.newContext(
    touch ? { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 } : { viewport: { width: 1280, height: 800 } },
  );
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
  const p = [];
  await page.goto(`${BASE}?grade=${grade}&debug&speed=4`, { waitUntil: "load" });
  await page.waitForFunction(() => !!window.__kc);
  const badge = await page.locator(".kc-gradebadge").innerText().catch(() => "");
  if (!badge.includes(grade === "K" ? "KINDERGARTEN" : `GRADE ${grade}`)) p.push(`badge "${badge}"`);
  if ((await page.locator(".kc-grade").count()) !== 0) p.push("grade picker shown although ?grade= was given");
  const fontsOk = await page.evaluate(async () => { await document.fonts.ready; return document.fonts.check('12px "Press Start 2P"'); });
  if (!fontsOk) p.push("Press Start 2P font not loaded from /fonts/");
  if (!(await noSideways(page))) p.push("sideways scroll on the title screen");
  if ((await page.locator('.kc-subject[aria-checked="true"]').getAttribute("data-subject")) !== "mixed") p.push("MIXED should be the default subject");
  if ((await page.locator(".kc-kitchen:not([disabled])").count()) !== 1) p.push("a new player should have only kitchen 1 open");
  const readAloudDefault = await page.evaluate(() => document.querySelector(".kc-toolbar button[aria-pressed]")?.getAttribute("aria-pressed"));
  if (readAloudDefault !== null && readAloudDefault !== (Number(grade) <= 2 ? "true" : "false")) p.push(`read aloud default ${readAloudDefault}`);

  // Start
  if (touch) await page.locator(".kc-cta.big").tap();
  else await page.keyboard.press("Enter");
  await page.waitForFunction(() => window.__kc.sim() && window.__kc.sim().phase !== undefined);
  if (!(await noSideways(page))) p.push("sideways scroll in the kitchen");
  const s0 = await state(page);
  if (s0.kitchen !== 1) p.push(`started in kitchen ${s0.kitchen}`);
  if (!touch) {
    // Esc pauses (the café freezes), Esc again resumes; M mutes and unmutes.
    await page.keyboard.press("Escape");
    if (!(await page.locator(".kc-overlay", { hasText: "PAUSED" }).count())) p.push("Esc should pause");
    const t1 = await page.evaluate(() => window.__kc.sim().phaseT);
    await page.waitForTimeout(300);
    const t2 = await page.evaluate(() => window.__kc.sim().phaseT);
    if (t1 !== t2) p.push("the café keeps running while paused");
    await page.keyboard.press("Escape");
    if (await page.locator(".kc-overlay", { hasText: "PAUSED" }).count()) p.push("Esc should resume");
    const m0 = await page.locator(".kc-toolbar button", { hasText: "SOUND" }).innerText();
    await page.keyboard.press("m");
    const m1 = await page.locator(".kc-toolbar button", { hasText: "SOUND" }).innerText();
    if (m0 === m1) p.push("M should toggle sound");
    await page.keyboard.press("m");
  } else if (!(await page.locator(".kc-stations .kc-station").count())) p.push("station buttons missing on the phone");

  // Kitchen 1: first question wrong, second right, then a mix.
  const seen = await playShift(page, touch, (n) => (n === 0 ? "wrong" : n === 1 ? "right" : n % 3 ? "right" : "wrong"), p, { checkPhone: touch, k2: Number(grade) <= 2 });
  if (seen.asks < 4) p.push(`only ${seen.asks} questions in a shift`);
  if (!seen.subjects.has("science") || !seen.subjects.has("math")) p.push(`MIXED shift should ask science and math (got ${[...seen.subjects]})`);
  await page.waitForSelector("text=NEW KITCHEN OPEN", { timeout: 10000 }).catch(() => p.push("summary did not announce kitchen 2"));
  if (!(await noSideways(page))) p.push("sideways scroll on the summary");
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("arcade.kitchen-cafe.save.v1") || "{}"));
  if (saved.unlocked !== 2) p.push(`save should unlock kitchen 2 (got ${JSON.stringify(saved)})`);
  // Science checks were played both ways somewhere (MIXED alternates; a science one may land right or wrong).
  if (!seen.wrongOk && !seen.rightOk) p.push("no Science Check came up");

  // Kitchen 2
  const next = page.locator(".kc-cta", { hasText: "Next kitchen" });
  if (touch) await next.tap();
  else await next.click();
  await page.waitForTimeout(200);
  const s2 = await state(page);
  if (!s2 || s2.kitchen !== 2) p.push(`next kitchen should be 2 (got ${s2 && s2.kitchen})`);
  if (!(await noSideways(page))) p.push("sideways scroll in kitchen 2");

  // Make sure a Science Check is played wrong and right (keep going in kitchen 2 until both happened).
  if (!(seen.wrongOk && seen.rightOk)) {
    let n2 = 0;
    const more = await playShift(page, touch, () => (n2++ % 2 ? "right" : "wrong"), p, { k2: Number(grade) <= 2 });
    if (!(more.wrongOk || seen.wrongOk) || !(more.rightOk || seen.rightOk)) p.push("did not play a Science Check both right and wrong");
  }

  // Reload: kitchen 2 is still open.
  await page.goto(`${BASE}?grade=${grade}&debug`, { waitUntil: "load" });
  if ((await page.locator(".kc-kitchen:not([disabled])").count()) < 2) p.push("kitchen 2 not open after reload");

  if (errors.length) p.push(`console errors: ${errors.slice(0, 3).join(" | ")}`);
  if (external.length) p.push(`external requests: ${external.slice(0, 3).join(", ")}`);
  await ctx.close();
  console.log(`${p.length ? "✗" : "✓"} ${label}${p.length ? ": " + p.join("; ") : ""}`);
  problems.push(...p.map((x) => `${label}: ${x}`));
}

async function picker(browser, problems) {
  const p = [];
  const ctx = await browser.newContext({ viewport: { width: 360, height: 740 }, hasTouch: true, isMobile: true });
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));

  await page.goto(`${BASE}?grade=7&topic=fractions&debug&speed=4`, { waitUntil: "load" });
  await page.waitForFunction(() => !!window.__kc);
  if ((await page.locator('.kc-subject[aria-checked="true"]').getAttribute("data-subject")) !== "math") p.push("?topic=fractions should pick MATH");
  if ((await page.locator('.kc-topic[aria-checked="true"]').getAttribute("data-topic")) !== "fractions") p.push("?topic=fractions should pick Fractions");
  if (!(await noSideways(page))) p.push("sideways scroll on the 360px title with topics open");
  await page.locator(".kc-cta.big").tap();
  const seen = await playShiftQuick(page, 3);
  if ([...seen.topics].some((t) => t !== "fractions")) p.push(`fractions focus asked ${[...seen.topics]}`);

  await page.goto(`${BASE}?grade=7&debug&speed=4`, { waitUntil: "load" });
  await page.waitForFunction(() => !!window.__kc);
  await page.locator('.kc-subject[data-subject="science"]').tap();
  if (!(await page.locator('.kc-topic[data-topic="physical"]').count())) p.push("SCIENCE should list Physical science");
  await page.locator('.kc-topic[data-topic="physical"]').tap();
  const remembered = await page.evaluate(() => localStorage.getItem("arcade.kitchen-cafe.focus"));
  if (!remembered || !remembered.includes("physical")) p.push(`focus not saved (${remembered})`);
  await page.locator(".kc-cta.big").tap();
  const sci = await playShiftQuick(page, 3);
  if ([...sci.subjects].some((s) => s !== "science")) p.push(`SCIENCE shift asked ${[...sci.subjects]}`);

  await page.goto(`${BASE}?grade=K&topic=money&debug`, { waitUntil: "load" });
  await page.waitForFunction(() => !!window.__kc);
  const note = await page.locator(".kc-notice").innerText().catch(() => "");
  if (!/Money is for Grades 2\+/.test(note)) p.push(`K money note "${note}"`);
  if ((await page.locator('.kc-topic[data-topic="money"]').getAttribute("disabled")) === null) p.push("money should be disabled at K");
  if (!(await noSideways(page))) p.push("sideways scroll at 360px (K)");

  await page.goto(`${BASE}?debug`, { waitUntil: "load" });
  if ((await page.locator(".kc-grade").count()) !== 13) p.push("grade picker should show K-12 without ?grade=");
  if (!(await noSideways(page))) p.push("sideways scroll on the grade picker at 360px");
  if (errors.length) p.push(`console errors: ${errors.slice(0, 3).join(" | ")}`);
  await ctx.close();
  console.log(`${p.length ? "✗" : "✓"} subject/topic picker${p.length ? ": " + p.join("; ") : ""}`);
  problems.push(...p.map((x) => `picker: ${x}`));
}

/** Answers `count` questions (all right) by touch and reports their subjects and topics. */
async function playShiftQuick(page, count) {
  const seen = { subjects: new Set(), topics: new Set() };
  let n = 0;
  const t0 = Date.now();
  while (n < count && Date.now() - t0 < 60000) {
    const s = await state(page);
    if (!s) { await page.waitForTimeout(50); continue; }
    if (s.phase === "ask" && !s.answered) {
      seen.subjects.add(s.subject);
      seen.topics.add(s.topic);
      await page.locator(`.kc-opt[data-choice="${s.answer}"]`).tap();
      await page.locator(".kc-after .kc-cta").tap();
      n++;
      continue;
    }
    if (s.phase === "cook" && s.next !== null) await page.locator(`.kc-station[data-station="${STATION_IDS[s.next]}"]`).tap();
    else if (s.phase === "work" && s.progress >= 0.66 && s.progress <= 0.82) await page.locator(".kc-station.working").tap();
    await page.waitForTimeout(20);
  }
  return seen;
}

async function screenshot(browser) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();
  await page.goto(`${BASE}?grade=5&debug&kitchen=2`, { waitUntil: "load" });
  await page.evaluate(() => localStorage.setItem("arcade.kitchen-cafe.save.v1", JSON.stringify({ unlocked: 2, best: [14, 0, 0, 0], cleared: [true, false, false, false] })));
  await page.goto(`${BASE}?grade=5&debug&kitchen=2`, { waitUntil: "load" });
  await page.waitForFunction(() => !!window.__kc);
  await page.evaluate(() => window.__kc.start(2));
  // Cook until a station is mid-way through a bake, then grab the canvas.
  const t0 = Date.now();
  let data = null;
  while (!data && Date.now() - t0 < 60000) {
    const s = await state(page);
    if (s && s.phase === "ask" && !s.answered) {
      await page.locator(`.kc-opt[data-choice="${s.answer}"]`).click();
      await page.locator(".kc-after .kc-cta").click();
    } else if (s && s.phase === "cook" && s.next !== null && !s.flash) {
      await page.locator(`.kc-station[data-station="${STATION_IDS[s.next]}"]`).click();
    } else if (s && s.phase === "work" && s.next !== 3 && s.progress >= 0.7 && s.progress <= 0.8) {
      await page.locator(".kc-station.working").click();
    } else if (s && s.phase === "work" && s.next === 3 && s.order >= 1 && s.progress > 0.45 && s.progress < 0.6) {
      data = await page.evaluate(() => {
        const src = document.querySelector(".kc-screen canvas");
        const c = document.createElement("canvas");
        c.width = 640;
        c.height = 400;
        const x = c.getContext("2d");
        x.imageSmoothingEnabled = false;
        x.drawImage(src, 0, 0, 640, 400);
        return c.toDataURL("image/png");
      });
    }
    await page.waitForTimeout(15);
  }
  await ctx.close();
  if (!data) throw new Error("no screenshot moment found");
  fs.writeFileSync(path.resolve(process.cwd(), SHOT), Buffer.from(data.split(",")[1], "base64"));
  console.log(`saved ${SHOT}`);
}

(async () => {
  const server = await serve();
  const browser = await chromium.launch();
  const problems = [];
  try {
    await run(browser, "1", false, problems);
    await run(browser, "7", true, problems);
    await picker(browser, problems);
    if (SHOT) await screenshot(browser);
  } catch (e) {
    problems.push(String(e && e.stack ? e.stack : e));
  } finally {
    await browser.close();
    await new Promise((r) => server.close(r));
  }
  if (problems.length) {
    console.error(`\n${problems.length} problem(s):\n- ${problems.join("\n- ")}`);
    process.exit(1);
  }
  console.log("\nPlaytest OK");
})();
