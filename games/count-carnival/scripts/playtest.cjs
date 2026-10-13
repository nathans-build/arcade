/*
 * Automated playtest of the BUILT game (dev only):   npm run build && node scripts/playtest.cjs
 *
 * Starts its own static server on http://127.0.0.1:8802 (PORT=...) serving dist/ at /count-carnival/
 * and the arcade fonts (../../site/fonts) at /fonts/, then stops it at the end. Needs a global
 * Playwright with Chromium (it does not install browsers).
 *
 * For grades K, 1 and 2 (taps/clicks on a 390x844 touch phone; grade 1 also on a 1024x768 tablet):
 *   title -> grade picker (no ?grade) or the arcade's grade (?grade=) -> PLAY -> the midway ->
 *   every booth: for each of the 5 items tap one or two WRONG answers first (checks: the item stays,
 *   a hint shows, after 2 wrong taps the right answer glows, nothing ends the game), then the right
 *   answer (checks: ticket counter goes up, NEXT appears), and at the end the "Hooray" screen with
 *   tickets. Keyboard 1-4 / A-D is tried once. Then the prize booth: buy the cheapest prize, check it
 *   is saved under arcade.count-carnival.* and still there after a reload.
 * Also: ?grade=5 plays grade-2 content; no sideways scroll at 360/390 px and 1024x768 on every
 * screen; no console errors, page errors or requests to other hosts.
 *   SHOT=../../site/img/count-carnival.png  saves the 640x400 cabinet screenshot.
 *   SHOTS=<dir>  saves a screenshot of each screen for a look.
 */
const path = require("path");
const fs = require("fs");
const http = require("http");
const { execSync } = require("child_process");
const { chromium } = require(path.join(execSync("npm root -g").toString().trim(), "playwright"));

const PORT = Number(process.env.PORT || 8802);
const BASE = `http://127.0.0.1:${PORT}/count-carnival/`;
const DIST = path.resolve(__dirname, "../dist");
const FONTS = path.resolve(__dirname, "../../../site/fonts");
const SHOT = process.env.SHOT;
const SHOTS = process.env.SHOTS;
const BOOTHS = ["balloons", "tightrope", "ducks", "shapes"];

const TYPES = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".json": "application/json", ".woff2": "font/woff2", ".png": "image/png" };
function startServer() {
  const server = http.createServer((req, res) => {
    const url = decodeURIComponent(req.url.split("?")[0]);
    let file = null;
    if (url.startsWith("/count-carnival/")) file = path.join(DIST, url.slice("/count-carnival/".length) || "index.html");
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

const problems = [];
let checks = 0;
function ok(cond, msg) {
  checks++;
  if (!cond) problems.push(msg);
}

function watchErrors(page, errors) {
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  page.on("requestfailed", (r) => errors.push(`request failed: ${r.url()}`));
  page.on("request", (r) => {
    if (!r.url().startsWith(`http://127.0.0.1:${PORT}`) && !r.url().startsWith("data:")) errors.push(`external request: ${r.url()}`);
  });
}

const state = (page) => page.evaluate(() => window.__cc());
async function noSideScroll(page, where) {
  const w = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));
  ok(w.sw <= w.cw, `${where}: sideways scroll (${w.sw} > ${w.cw})`);
}
async function shot(page, name) {
  if (!SHOTS) return;
  fs.mkdirSync(SHOTS, { recursive: true });
  await page.screenshot({ path: path.join(SHOTS, `${name}.png`) });
}
async function tap(page, locator, touch) {
  // force: the PLAY/NEXT buttons pulse, which Playwright would otherwise wait out as "not stable".
  if (touch) await locator.tap({ force: true });
  else await locator.click({ force: true });
}
/** Taps targets must be at least ~64px (the answer buttons, tents, next, icons). */
async function bigEnough(page, selector, where, min = 60) {
  const sizes = await page.$$eval(selector, (els) => els.map((e) => { const r = e.getBoundingClientRect(); return [Math.round(r.width), Math.round(r.height)]; }));
  ok(sizes.length > 0, `${where}: no ${selector}`);
  for (const [w, h] of sizes) ok(w >= min && h >= min, `${where}: ${selector} is ${w}x${h}, smaller than ${min}px`);
}

async function playBooth(page, booth, grade, touch, opts = {}) {
  const tag = `[grade ${grade} ${booth} ${touch ? "touch" : "mouse"}]`;
  await tap(page, page.locator(`.cc-tent-${booth}`), touch);
  await page.waitForSelector(".cc-booth");
  let s = await state(page);
  ok(s.screen === "booth" && s.booth === booth, `${tag} did not open the booth`);
  const startTickets = s.tickets;
  await bigEnough(page, ".cc-choice", tag);
  await bigEnough(page, ".cc-icon-btn", tag);
  await noSideScroll(page, `${tag} booth`);
  if (opts.shotName) await shot(page, `${opts.shotName}-q`);
  const content = playGradeOf(grade);
  for (let q = 0; q < 5; q++) {
    s = await state(page);
    ok(s.round.idx === q && !s.round.solved, `${tag} item ${q + 1}: unexpected round state ${JSON.stringify(s.round)}`);
    ok(s.round.standard.startsWith(`NC.${content}.`), `${tag} standard ${s.round.standard} not grade ${content}`);
    const ans = s.round.answer;
    const wrongs = [0, 1, 2, 3].filter((i) => i !== ans);
    const nWrong = q % 3; // 0, 1 or 2 wrong taps
    for (let k = 0; k < nWrong; k++) {
      await tap(page, page.locator(".cc-choice").nth(wrongs[k]), touch);
      await page.waitForTimeout(80);
      const after = await state(page);
      ok(after.screen === "booth" && !after.round.solved && after.round.idx === q, `${tag} wrong tap changed the item or left the booth`);
      ok(await page.locator(".cc-msg.hint").count() === 1, `${tag} no hint after a wrong tap`);
      ok(await page.locator(".cc-choice.faded").count() === k + 1, `${tag} wrong answer not faded`);
    }
    if (nWrong === 2) {
      ok(await page.locator(`.cc-choice.glow`).count() === 1, `${tag} right answer should glow after 2 wrong taps`);
      if (opts.shotName && q === 2) await shot(page, `${opts.shotName}-hint`);
    }
    const before = Number(await page.locator(".cc-tickets b").innerText());
    if (opts.keyboard && q === 0) await page.keyboard.press(String(ans + 1));
    else if (opts.keyboard && q === 1) await page.keyboard.press("abcd"[ans]);
    else await tap(page, page.locator(".cc-choice").nth(ans), touch);
    await page.waitForSelector(".cc-next");
    s = await state(page);
    ok(s.round.solved, `${tag} right answer not accepted`);
    const afterT = Number(await page.locator(".cc-tickets b").innerText());
    ok(afterT === before + (nWrong === 0 ? 2 : 1), `${tag} tickets ${before} -> ${afterT} (wrong taps ${nWrong})`);
    ok(await page.locator(".cc-msg.good").count() === 1, `${tag} no celebration message`);
    await bigEnough(page, ".cc-next", tag);
    if (opts.shotName && q === 0) await shot(page, `${opts.shotName}-right`);
    await noSideScroll(page, `${tag} solved`);
    if (opts.keyboard && q === 3) await page.keyboard.press("Enter");
    else await tap(page, page.locator(".cc-next"), touch);
    await page.waitForTimeout(60);
  }
  await page.waitForSelector(".cc-done");
  s = await state(page);
  ok(s.screen === "done", `${tag} no Hooray screen`);
  ok(s.tickets > startTickets, `${tag} tickets not saved (${startTickets} -> ${s.tickets})`);
  ok((await page.locator(".cc-won").innerText()).includes("tickets"), `${tag} no tickets shown`);
  await noSideScroll(page, `${tag} done`);
  if (opts.shotName) await shot(page, `${opts.shotName}-done`);
  await tap(page, page.locator(".cc-big-btn.home"), touch);
  await page.waitForSelector(".cc-hub");
}

const playGradeOf = (g) => (g === "K" || g === "1" || g === "2" ? g : "2");

async function session(browser, grade, { touch, viewport, viaPicker, keyboard, shots }) {
  const ctx = await browser.newContext({ viewport, hasTouch: touch, isMobile: touch, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  const errors = [];
  watchErrors(page, errors);
  await page.goto(viaPicker ? BASE : `${BASE}?grade=${grade}`, { waitUntil: "load" });
  await page.waitForFunction(() => !!window.__cc);
  const tag = `[grade ${grade} ${viewport.width}x${viewport.height}]`;
  await noSideScroll(page, `${tag} title`);
  if (shots) await shot(page, `${shots}-title`);
  if (viaPicker) {
    ok(await page.locator(".cc-gradepick button").count() === 3, `${tag} grade picker should show K, 1, 2 without ?grade`);
    await bigEnough(page, ".cc-gradepick button", tag);
    await tap(page, page.locator(".cc-gradepick button", { hasText: grade === "K" ? "Kinder" : `Grade ${grade}` }), touch);
  } else {
    ok(await page.locator(".cc-gradepick").count() === 0, `${tag} grade picker shown although ?grade was given`);
  }
  await tap(page, page.locator(".cc-play"), touch);
  await page.waitForSelector(".cc-hub");
  const s = await state(page);
  ok(s.grade === grade, `${tag} grade is ${s.grade}`);
  await bigEnough(page, ".cc-tent", tag);
  await noSideScroll(page, `${tag} hub`);
  if (shots) await shot(page, `${shots}-hub`);
  for (const b of BOOTHS) await playBooth(page, b, grade, touch, { keyboard: keyboard && b === "balloons", shotName: shots ? `${shots}-${b}` : null });

  // Prize booth: buy the cheapest prize.
  await tap(page, page.locator(".cc-tent-prizes"), touch);
  await page.waitForSelector(".cc-prizes");
  await noSideScroll(page, `${tag} prizes`);
  await bigEnough(page, ".cc-prize", tag);
  const before = await state(page);
  ok(before.tickets >= 6, `${tag} not enough tickets for a prize after 4 rounds (${before.tickets})`);
  await tap(page, page.locator(".cc-prize").first(), touch);
  await page.waitForTimeout(100);
  const after = await state(page);
  ok(after.prizes.includes("pinwheel") && after.tickets === before.tickets - 6, `${tag} buying the pinwheel failed`);
  ok(await page.locator(".cc-prize.owned").count() === 1, `${tag} prize not shown as owned`);
  if (shots) await shot(page, `${shots}-prizes`);
  const saved = await page.evaluate(() => Object.keys(localStorage).filter((k) => k.startsWith("arcade.count-carnival.")));
  ok(saved.includes("arcade.count-carnival.save.v1"), `${tag} save key missing (${saved})`);
  ok(saved.includes("arcade.count-carnival.progress.v1"), `${tag} kit progress key missing (${saved})`);
  await page.reload({ waitUntil: "load" });
  await page.waitForFunction(() => !!window.__cc);
  const re = await state(page);
  ok(re.tickets === after.tickets && re.prizes.includes("pinwheel"), `${tag} tickets/prizes not kept after reload`);
  ok(errors.length === 0, `${tag} errors: ${errors.join(" | ")}`);
  await ctx.close();
}

async function narrowChecks(browser) {
  // 360 px wide phone: every booth's first item at every grade, no sideways scroll.
  const ctx = await browser.newContext({ viewport: { width: 360, height: 740 }, hasTouch: true, isMobile: true });
  const page = await ctx.newPage();
  const errors = [];
  watchErrors(page, errors);
  // Leaving a booth mid-round keeps the tickets already won.
  await page.goto(`${BASE}?grade=K`, { waitUntil: "load" });
  await page.waitForFunction(() => !!window.__cc);
  await page.locator(".cc-play").tap({ force: true });
  await page.locator(".cc-tent-ducks").tap({ force: true });
  const t0 = (await state(page)).tickets;
  await page.locator(".cc-choice").nth((await state(page)).round.answer).tap({ force: true });
  await page.locator(".cc-top .cc-icon-btn").first().tap({ force: true });
  await page.waitForSelector(".cc-hub");
  ok((await state(page)).tickets === t0 + 2, `[360] leaving a booth early lost tickets (${t0} -> ${(await state(page)).tickets})`);
  for (const g of ["K", "1", "2", "5"]) {
    await page.goto(`${BASE}?grade=${g}`, { waitUntil: "load" });
    await page.waitForFunction(() => !!window.__cc);
    await noSideScroll(page, `[360 grade ${g}] title`);
    await page.locator(".cc-play").tap({ force: true });
    await page.waitForSelector(".cc-hub");
    await noSideScroll(page, `[360 grade ${g}] hub`);
    for (const b of BOOTHS) {
      for (let t = 0; t < 3; t++) {
        await page.locator(`.cc-tent-${b}`).tap({ force: true });
        await page.waitForSelector(".cc-booth");
        const s = await state(page);
        ok(s.round.standard.startsWith(`NC.${playGradeOf(g)}.`), `[360 grade ${g}] ${b} standard ${s.round.standard}`);
        await noSideScroll(page, `[360 grade ${g}] ${b}`);
        // Walk through the round quickly to see later (bigger) items too.
        for (let q = 0; q < 5; q++) {
          const st = await state(page);
          await page.locator(".cc-choice").nth((st.round.answer + 1) % 4).tap({ force: true });
          await page.locator(".cc-choice").nth(st.round.answer).tap({ force: true });
          await noSideScroll(page, `[360 grade ${g}] ${b} item ${q + 1}`);
          await page.locator(".cc-next").tap({ force: true });
        }
        await page.waitForSelector(".cc-done");
        await page.locator(".cc-big-btn.home").tap({ force: true });
        await page.waitForSelector(".cc-hub");
      }
    }
  }
  ok(errors.length === 0, `[360] errors: ${errors.join(" | ")}`);
  await ctx.close();
}

async function cabinetShot(browser) {
  const ctx = await browser.newContext({ viewport: { width: 640, height: 400 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  await page.goto(`${BASE}?grade=K`, { waitUntil: "load" });
  await page.evaluate(() => document.fonts.ready);
  await page.locator(".cc-play").click({ force: true });
  await page.waitForSelector(".cc-hub");
  // Find a Balloon Count round whose first item shows a nice handful of balloons.
  for (let t = 0; t < 40; t++) {
    await page.locator(".cc-tent-balloons").click({ force: true });
    await page.waitForSelector(".cc-booth");
    const n = await page.locator(".cc-scene .cc-obj").count();
    const sprite = await page.locator(".cc-prompt").innerText();
    if (n >= 7 && n <= 9 && /balloons/.test(sprite)) break;
    await page.locator(".cc-icon-btn").first().click({ force: true });
    await page.waitForSelector(".cc-hub");
  }
  // One wrong tap so the counting hint shows the badges.
  const s = await state(page);
  await page.locator(".cc-choice").nth((s.round.answer + 1) % 4).click({ force: true });
  await page.waitForFunction(() => document.querySelectorAll(".cc-scene .cc-obj.lit").length === document.querySelectorAll(".cc-scene .cc-obj").length, null, { timeout: 15000 });
  await page.waitForTimeout(400);
  await page.evaluate(() => window.speechSynthesis && window.speechSynthesis.cancel());
  await page.screenshot({ path: SHOT });
  await ctx.close();
  const size = fs.statSync(SHOT).size;
  ok(size < 150 * 1024, `cabinet screenshot is ${Math.round(size / 1024)} KB (must be < 150 KB)`);
  console.log(`saved ${SHOT} (${Math.round(size / 1024)} KB)`);
}

(async () => {
  const server = await startServer();
  const browser = await chromium.launch();
  try {
    await session(browser, "K", { touch: true, viewport: { width: 390, height: 844 }, viaPicker: true, shots: "k-phone" });
    await session(browser, "1", { touch: true, viewport: { width: 390, height: 844 }, viaPicker: false, shots: "g1-phone" });
    await session(browser, "2", { touch: true, viewport: { width: 390, height: 844 }, viaPicker: true, shots: "g2-phone" });
    await session(browser, "1", { touch: false, viewport: { width: 1024, height: 768 }, viaPicker: false, keyboard: true, shots: "g1-tablet" });
    await session(browser, "K", { touch: true, viewport: { width: 1024, height: 768 }, viaPicker: false, shots: "k-tablet" });
    await session(browser, "2", { touch: false, viewport: { width: 768, height: 1024 }, viaPicker: false, shots: "g2-portrait" });
    await session(browser, "5", { touch: true, viewport: { width: 844, height: 390 }, viaPicker: false, shots: "g5-landscape" });
    await narrowChecks(browser);
    if (SHOT) await cabinetShot(browser);
  } catch (e) {
    problems.push(`crashed: ${e && e.stack ? e.stack : e}`);
  } finally {
    await browser.close();
    await new Promise((r) => server.close(r));
  }
  console.log(`${checks} checks`);
  if (problems.length) {
    console.log(`PROBLEMS (${problems.length}):`);
    for (const p of problems.slice(0, 80)) console.log(" -", p);
    process.exit(1);
  }
  console.log("Playtest passed.");
})();
