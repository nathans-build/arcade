/*
 * Automated playtest (dev only). Needs the built game served at /key-comets/ with the arcade
 * fonts at /fonts/, and a global Playwright (Chromium):
 *   npm run build && (serve dist at http://127.0.0.1:8803/key-comets/, site/fonts at /fonts/) &
 *   node scripts/playtest.cjs      (SHOT=../../site/img/key-comets.png saves the cabinet picture)
 *
 * 1. Grade 1, keyboard (1280x800): title shows Home row open and lesson 2 locked, Practice on.
 *    Types the Home row lesson with REAL key presses (including mistakes), checks the glowing key
 *    and finger hint follow the next letter, Esc pauses (comets freeze, typing ignored) and Esc
 *    resumes, then the results screen shows WPM / accuracy / missed keys, the lesson passes and
 *    unlocks "Home row + E I" (saved in arcade.key-comets.v1, card enabled on the title).
 * 2. Grade 7, Free play words round (shield on): checks the comets are grade 6-8 words/sentences,
 *    types them (with a couple of mistakes, Shift for capitals), checks results and a personal best;
 *    then a round where nobody types ends with the shield down (friendly results, no unlock).
 * 3. Phone 390x844 (touch): "works best with a keyboard" note, Tap mode on by default, no
 *    sideways scroll on the title / while playing / on results (and at 360 px); taps the glowing
 *    key on the on-screen keyboard through a whole grade 2 Home row round.
 * Fails on any console error, page error or request outside 127.0.0.1.
 */
const path = require("path");
const fs = require("fs");
const { execSync } = require("child_process");
const { chromium } = require(path.join(execSync("npm root -g").toString().trim(), "playwright"));

const BASE = process.env.BASE || "http://127.0.0.1:8803/key-comets/";
const SHOT = process.env.SHOT;

const problems = [];
const log = [];
const note = (where, msg) => problems.push(`[${where}] ${msg}`);
const expect = (ok, where, msg) => {
  if (!ok) note(where, msg);
};

function watchErrors(page, errors) {
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  page.on("requestfailed", (r) => errors.push(`request failed: ${r.url()} (${r.failure() && r.failure().errorText})`));
  page.on("request", (r) => {
    if (!r.url().startsWith("http://127.0.0.1") && !r.url().startsWith("data:")) errors.push(`external request: ${r.url()}`);
  });
}

const state = (page) =>
  page.evaluate(() => {
    const k = window.__kc();
    const s = k.sim;
    return {
      screen: k.screen, paused: k.paused, tap: k.tap, save: k.save, result: k.result,
      sim: s && {
        phase: s.phase, next: s.nextKey(), buffer: s.buffer, comets: s.comets.map((c) => ({ text: c.text, y: c.y, waiting: c.waiting })),
        zapped: s.zapped, total: s.total, shield: s.shield, practice: s.practice, items: s.items.map((i) => i.text), stats: s.stats,
      },
    };
  });

/** A key that fits no comet right now (a deliberate mistake). */
const wrongKey = (page) =>
  page.evaluate(() => {
    const s = window.__kc().sim;
    for (const ch of "qzxvbmpwo") if (!s.candidates(s.buffer + ch).length) return ch;
    return null;
  });

async function waitNext(page, ms = 30000) {
  await page.waitForFunction(() => {
    const k = window.__kc();
    return k.screen !== "playing" || (k.sim && k.sim.nextKey() !== null);
  }, null, { timeout: ms });
}

/**
 * Types the round with real key presses until the results screen. `mistakeAt` lists keystroke
 * numbers where a wrong key is pressed first. `onKey` runs before some key presses for extra checks.
 */
async function typeRound(page, { mistakeAt = [], onKey = null, maxKeys = 2000 } = {}) {
  let n = 0;
  for (let i = 0; i < maxKeys; i++) {
    await waitNext(page);
    const st = await page.evaluate(() => {
      const k = window.__kc();
      return { screen: k.screen, next: k.sim && k.sim.nextKey(), paused: k.paused };
    });
    if (st.screen !== "playing") return n;
    if (st.next === null) continue;
    if (mistakeAt.includes(n)) {
      const w = await wrongKey(page);
      if (w) await page.keyboard.press(w);
    }
    if (onKey) await onKey(st.next, n);
    if (st.next === " ") await page.keyboard.press("Space");
    else await page.keyboard.type(st.next);
    n++;
  }
  return n;
}

async function noSideways(page, where) {
  const m = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth, bw: document.body.scrollWidth }));
  expect(m.sw <= m.cw && m.bw <= m.cw, where, `sideways scroll: scrollWidth ${m.sw}/${m.bw} > ${m.cw}`);
}

/* ---------------- 1. grade 1 home row, keyboard ---------------- */
async function gradeOne(browser) {
  const where = "grade 1 home row";
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();
  const errors = [];
  watchErrors(page, errors);
  await page.goto(`${BASE}?grade=1&debug`, { waitUntil: "load" });
  await page.evaluate(() => document.fonts.ready.then(() => localStorage.clear()));
  await page.reload({ waitUntil: "load" });
  await page.waitForFunction(() => !!window.__kc);

  expect((await page.locator(".kc-gradebadge").innerText()).includes("GRADE 1"), where, "grade badge missing");
  expect((await page.locator(".kc-grade").count()) === 0, where, "grade picker shown although ?grade= was given");
  expect(await page.locator('[data-lesson="home"]').isEnabled(), where, "Home row lesson should be open");
  expect(await page.locator('[data-lesson="ei"]').isDisabled(), where, "lesson 2 should be locked at the start");
  expect(await page.locator('[data-lesson="free"]').isEnabled(), where, "Free play should be open");
  expect(await page.locator(".kc-check input").first().isChecked(), where, "Practice should be on by default for grade 1");
  expect((await page.locator(".kc-note").count()) === 0, where, "keyboard note shown on a desktop");
  await page.locator(".kc-cta", { hasText: "How to play" }).click();
  expect((await page.locator(".kc-help li").count()) >= 4, where, "How to play didn't open");
  await page.locator('[data-lesson="home"]').click();
  await page.locator(".kc-cta", { hasText: "Start" }).click();
  await waitNext(page);
  let s = await state(page);
  expect(s.screen === "playing" && s.sim.practice, where, "round should start in Practice");
  expect(s.sim.items.every((t) => t.length === 1 && "asdfjkl;".includes(t)), where, `grade 1 home row comets should be single home-row keys: ${s.sim.items.join(" ")}`);

  // Glowing key + finger hint follow the next key.
  await page.waitForFunction(() => {
    const k = window.__kc();
    const g = document.querySelector(".kc-key.glow");
    return g && g.dataset.key === k.sim.nextKey();
  }, null, { timeout: 3000 }).catch(() => note(where, "glowing key doesn't match the next key"));
  const hint = await page.locator(".kc-hint .txt").innerText();
  const finger = { a: "left pinky", s: "left ring", d: "left middle", f: "left index", j: "right index", k: "right middle", l: "right ring", ";": "right pinky" }[s.sim.next];
  expect(hint.includes(finger), where, `finger hint "${hint}" should say ${finger} for "${s.sim.next}"`);
  expect((await page.locator(".kc-hands i.on").count()) >= 1, where, "hands don't show the finger");

  // A deliberate mistake first: counted against the glowing key, the comet stays.
  const expected = s.sim.next;
  await page.keyboard.press("q");
  s = await state(page);
  expect(s.sim.stats.errors === 1 && s.sim.stats.missed[expected] === 1, where, `mistake should count against "${expected}": ${JSON.stringify(s.sim.stats.missed)}`);
  expect(s.sim.zapped === 0, where, "a mistake zapped a comet");

  // Type a few, then pause with Esc.
  await typeRound(page, { maxKeys: 4 });
  await page.keyboard.press("Escape");
  await page.waitForTimeout(150);
  s = await state(page);
  expect(s.paused && (await page.locator(".kc-pause").isVisible()), where, "Esc didn't pause");
  const before = s.sim.comets.map((c) => c.y).join(",");
  const zBefore = s.sim.zapped;
  if (s.sim.next) await page.keyboard.type(s.sim.next);
  await page.waitForTimeout(600);
  s = await state(page);
  expect(s.sim.comets.map((c) => c.y).join(",") === before, where, "comets moved while paused");
  expect(s.sim.zapped === zBefore, where, "typing while paused zapped a comet");
  await page.keyboard.press("Escape");
  await page.waitForTimeout(150);
  expect(!(await state(page)).paused, where, "Esc didn't resume");

  // Finish the round with real key presses and two more mistakes: 3 misses in 15 letters is under 90%.
  await typeRound(page, { mistakeAt: [3, 7] });
  await page.waitForFunction(() => window.__kc().screen === "over", null, { timeout: 20000 });
  s = await state(page);
  let r = s.result;
  log.push(`${where} (try 1): ${r.zapped}/${r.total} comets, ${r.wpm} WPM, ${r.accuracy}% accuracy, passed=${r.passed}`);
  expect(r.total === 15 && r.zapped === 15 && r.completed, where, "practice round should finish with every comet zapped");
  expect(r.accuracy < 90 && !r.passed, where, `three mistakes should not pass (accuracy ${r.accuracy})`);
  let text = await page.locator(".kc-panel.results").innerText();
  expect(text.includes("To pass: 90% accuracy"), where, "failed round should explain how to pass");
  expect(!(await page.locator(".kc-cta", { hasText: "Next lesson" }).count()), where, "Next lesson offered without passing");
  let saved = await page.evaluate(() => JSON.parse(localStorage.getItem("arcade.key-comets.v1") || "{}"));
  expect(!(saved.passed || []).includes("home"), where, "a failed round was saved as passed");

  // Try again (Play again): one mistake this time, typed at a kid-ish pace.
  await page.locator(".kc-cta", { hasText: "Play again" }).click();
  await waitNext(page);
  await typeRound(page, { mistakeAt: [5], onKey: () => page.waitForTimeout(120) });
  await page.waitForFunction(() => window.__kc().screen === "over", null, { timeout: 20000 });
  s = await state(page);
  r = s.result;
  log.push(`${where} (try 2): ${r.zapped}/${r.total} comets, ${r.wpm} WPM, ${r.accuracy}% accuracy, passed=${r.passed}, missed ${JSON.stringify(r.missed)}`);
  expect(r.accuracy >= 90 && r.accuracy < 100, where, `accuracy ${r.accuracy} should be 90-99 with one mistake`);
  expect(r.passed, where, "round should pass");
  expect(r.wpm > 0 && r.wpm < 200, where, `WPM ${r.wpm} out of range`);
  text = await page.locator(".kc-panel.results").innerText();
  expect(/WPM\s*\n?\s*\d+/.test(text) && /ACCURACY\s*\n?\s*\d+%/.test(text), where, `results don't show WPM and accuracy: ${text.slice(0, 200)}`);
  expect(text.includes("Home row + E I"), where, "results don't announce the unlocked lesson");
  expect(text.includes("Keys to practice"), where, "results don't list missed keys");
  expect(/W\.1\.6/.test(text), where, "results don't show the NC standard tag");
  expect((await page.locator(".kc-cta", { hasText: "Next lesson" }).count()) === 1, where, "Next lesson button missing after passing");
  saved = await page.evaluate(() => JSON.parse(localStorage.getItem("arcade.key-comets.v1") || "{}"));
  expect(saved.passed && saved.passed.includes("home"), where, "pass not saved in arcade.key-comets.v1");
  expect(saved.bests && saved.bests.home && saved.bests.home.wpm > 0, where, "personal best not saved");
  await page.screenshot({ path: path.join(process.env.OUT || "/tmp", "kc-results-g1.png") });


  // Back to the lessons: lesson 2 is now open and selected.
  await page.locator(".kc-cta", { hasText: "Lessons" }).click();
  expect(await page.locator('[data-lesson="ei"]').isEnabled(), where, "lesson 2 still locked after passing");
  expect((await page.locator('[data-lesson="ei"]').getAttribute("aria-checked")) === "true", where, "unlocked lesson should be selected");
  expect(await page.locator('[data-lesson="reach"]').isDisabled(), where, "lesson 3 should still be locked");
  // Reload: progress survives.
  await page.reload({ waitUntil: "load" });
  expect(await page.locator('[data-lesson="ei"]').isEnabled(), where, "unlock lost after reload");
  expect((await page.locator('[data-lesson="home"] .best').count()) === 1, where, "personal best not shown on the lesson card");

  expect(errors.length === 0, where, `console errors: ${errors.join(" | ")}`);
  await ctx.close();
}

/* ---------------- 2. grade 7 free play words ---------------- */
async function gradeSeven(browser) {
  const where = "grade 7 free play";
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();
  const errors = [];
  watchErrors(page, errors);
  await page.goto(`${BASE}?grade=7&debug`, { waitUntil: "load" });
  await page.evaluate(() => document.fonts.ready.then(() => localStorage.clear()));
  await page.reload({ waitUntil: "load" });
  await page.waitForFunction(() => !!window.__kc);
  expect(!(await page.locator(".kc-check input").first().isChecked()), where, "Practice should be off by default for grade 7");
  await page.locator('[data-lesson="free"]').click();
  await page.locator(".kc-cta", { hasText: "Start" }).click();
  await waitNext(page);
  let s = await state(page);
  expect(!s.sim.practice && s.sim.shield === 5, where, "grade 7 should play with a 5-shield");
  expect(s.sim.items.length === 14, where, `round should have 14 comets (got ${s.sim.items.length})`);
  expect(s.sim.items.every((t) => (t.length >= 7 && !t.includes(" ")) || t.split(" ").length >= 4), where, `grade 7 comets should be long words or short sentences: ${s.sim.items.join(" | ")}`);
  const visible = s.sim.comets.length;
  expect(visible >= 1, where, "no comet on screen");

  let capitals = 0;
  const keys = await typeRound(page, {
    mistakeAt: [2, 20],
    onKey: async (ch) => {
      if (/[A-Z]/.test(ch)) capitals++;
      await page.waitForTimeout(25);
    },
  });
  await page.waitForFunction(() => window.__kc().screen === "over", null, { timeout: 20000 });
  s = await state(page);
  const r = s.result;
  log.push(`${where}: ${keys} keys, ${r.zapped}/${r.total} comets, ${r.wpm} WPM (gross ${r.gross}), ${r.accuracy}%, shield ${s.sim.shield}, capitals typed ${capitals}`);
  expect(r.completed && r.zapped === r.total, where, "every comet should be zapped");
  expect(r.wpm > 0 && r.accuracy >= 90 && r.accuracy < 100, where, `WPM ${r.wpm} / accuracy ${r.accuracy} look wrong`);
  const text = await page.locator(".kc-panel.results").innerText();
  expect(text.includes("GROSS WPM") && text.includes("BEST COMBO"), where, "grade 6+ results should show gross WPM and best combo");
  expect(text.includes("NEW PERSONAL BEST"), where, "first finished round should be a personal best");
  expect(text.includes("W.7.6") && text.includes("L.7.2"), where, "standards W.7.6 / L.7.2 not shown");
  expect(!text.includes("unlocked"), where, "free play shouldn't unlock lessons");
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("arcade.key-comets.v1") || "{}"));
  expect(saved.bests && saved.bests["free-7"], where, "free play best not saved per grade");

  // Play again and let the comets through: the shield breaks and the round ends kindly.
  await page.locator(".kc-cta", { hasText: "Play again" }).click();
  await waitNext(page);
  await page.evaluate(() => {
    const sim = window.__kc().sim;
    for (let t = 0; t < 15 * 60000 && sim.phase === "playing"; t += 50) sim.step(50);
  });
  await page.waitForFunction(() => window.__kc().screen === "over", null, { timeout: 5000 });
  const t2 = await page.locator(".kc-panel.results").innerText();
  s = await state(page);
  expect(s.sim.shield === 0 && !s.result.completed && !s.result.passed, where, "untyped round should end with the shield down");
  expect(t2.includes("THE SHIELD IS DOWN"), where, "shield-down headline missing");
  expect(t2.includes("Play again"), where, "Play again missing after a loss");
  // Enter = Play again
  await page.waitForTimeout(1100);
  await page.keyboard.press("Enter");
  await page.waitForFunction(() => window.__kc().screen === "playing", null, { timeout: 3000 }).catch(() => note(where, "Enter didn't start another round"));
  expect(errors.length === 0, where, `console errors: ${errors.join(" | ")}`);
  await ctx.close();
}

/* ---------------- 3. phone tap mode ---------------- */
async function phone(browser) {
  const where = "phone tap mode";
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  const errors = [];
  watchErrors(page, errors);
  await page.goto(`${BASE}?grade=2&debug`, { waitUntil: "load" });
  await page.evaluate(() => document.fonts.ready.then(() => localStorage.clear()));
  await page.reload({ waitUntil: "load" });
  await page.waitForFunction(() => !!window.__kc);
  const noteText = await page.locator(".kc-note").innerText().catch(() => "");
  expect(noteText.includes("Key Comets works best with a keyboard"), where, "touch note missing");
  expect((await state(page)).tap, where, "Tap mode should be on by default on a touch device");
  await noSideways(page, `${where} title`);
  await page.screenshot({ path: path.join(process.env.OUT || "/tmp", "kc-phone-title.png") });
  await page.locator(".kc-cta", { hasText: "Start" }).tap();
  await waitNext(page);
  expect((await page.locator("button.kc-key").count()) >= 40, where, "on-screen keyboard keys aren't tappable buttons");
  await noSideways(page, `${where} playing`);
  let s = await state(page);
  expect(s.sim.practice, where, "tap mode should play in Practice (comets wait)");
  let taps = 0;
  for (let i = 0; i < 400; i++) {
    s = await state(page);
    if (s.screen !== "playing") break;
    if (s.sim.next === null) {
      await page.waitForTimeout(60);
      continue;
    }
    await page.waitForFunction(() => {
      const k = window.__kc();
      const g = document.querySelector("button.kc-key.glow:not(.shiftL):not(.shiftR)");
      return !k.sim.nextKey() || (g && g.dataset.key === k.sim.nextKey());
    }, null, { timeout: 3000 });
    const glow = page.locator("button.kc-key.glow:not(.shiftL):not(.shiftR)");
    if (await glow.count()) {
      await glow.first().tap({ force: true });
      taps++;
    }
  }
  if (taps === 4) await page.screenshot({ path: path.join(process.env.OUT || "/tmp", "kc-phone-play.png") });
  await page.waitForFunction(() => window.__kc().screen === "over", null, { timeout: 10000 }).catch(() => note(where, "tap round didn't finish"));
  s = await state(page);
  log.push(`${where}: ${taps} taps, ${s.result && s.result.zapped}/${s.result && s.result.total} comets, ${s.result && s.result.accuracy}%`);
  expect(s.result && s.result.zapped === s.result.total && s.result.accuracy === 100, where, "tapping the glowing key should zap every comet with 100%");
  await noSideways(page, `${where} results`);
  await page.screenshot({ path: path.join(process.env.OUT || "/tmp", "kc-phone-results.png") });
  await page.setViewportSize({ width: 360, height: 740 });
  await page.locator(".kc-cta", { hasText: "Play again" }).tap();
  await waitNext(page);
  await noSideways(page, `${where} 360px playing`);
  await page.screenshot({ path: path.join(process.env.OUT || "/tmp", "kc-phone-360.png") });
  expect(errors.length === 0, where, `console errors: ${errors.join(" | ")}`);
  await ctx.close();
}

/* ---------------- screenshot for the arcade cabinet ---------------- */
async function cabinetShot(browser) {
  const ctx = await browser.newContext({ viewport: { width: 1100, height: 1000 } });
  const page = await ctx.newPage();
  const errors = [];
  watchErrors(page, errors);
  await page.goto(`${BASE}?grade=8&debug`, { waitUntil: "load" });
  await page.evaluate(() => {
    localStorage.clear();
    localStorage.setItem("arcade.key-comets.v1", JSON.stringify({ passed: ["home", "ei"], bests: {}, lastLesson: "reach", keyboard: true, missed: {} }));
  });
  await page.reload({ waitUntil: "load" });
  await page.waitForFunction(() => !!window.__kc);
  await page.locator('[data-lesson="reach"]').click();
  await page.locator(".kc-cta", { hasText: "Start" }).click();
  // Let four comets into the sky, zap the lowest, and lock on to the next.
  for (let i = 0; i < 600; i++) {
    const st = await page.evaluate(() => {
      const s = window.__kc().sim;
      const ys = s.comets.map((c) => c.y);
      return { ready: ys.length >= 4 && Math.min(...ys) > 40, low: ys.length && Math.max(...ys) > 210 ? s.target().text : null };
    });
    if (st.ready) break;
    // Keep the shield full while waiting: zap any comet that gets low.
    if (st.low) for (const ch of st.low) await page.keyboard.type(ch);
    else await page.waitForTimeout(100);
  }
  await typeRound(page, { maxKeys: 0 });
  const word = await page.evaluate(() => window.__kc().sim.target().text);
  for (const ch of word) await page.keyboard.type(ch);
  await page.waitForTimeout(120);
  const next = await page.evaluate(() => window.__kc().sim.target().text);
  for (const ch of next.slice(0, Math.max(1, Math.floor(next.length / 2)))) await page.keyboard.type(ch);
  await page.waitForTimeout(60);
  const box = await page.evaluate(() => {
    const a = document.querySelector(".kc-hud").getBoundingClientRect();
    const b = document.querySelector(".kc-keyboard").getBoundingClientRect();
    const c = document.querySelector(".kc-screen").getBoundingClientRect();
    return { top: a.top, bottom: b.bottom, left: Math.min(b.left, c.left), right: Math.max(b.right, c.right) };
  });
  let h = box.bottom - box.top + 8;
  let w = h * 1.6;
  const cx = (box.left + box.right) / 2;
  const clip = { x: Math.max(0, cx - w / 2), y: Math.max(0, box.top - 4), width: w, height: h };
  const png = await page.screenshot({ clip });
  // Scale to exactly 640x400 in the browser.
  const out = await page.evaluate(async (b64) => {
    const img = new Image();
    img.src = `data:image/png;base64,${b64}`;
    await img.decode();
    const c = document.createElement("canvas");
    c.width = 640;
    c.height = 400;
    const g = c.getContext("2d");
    g.imageSmoothingQuality = "high";
    g.drawImage(img, 0, 0, 640, 400);
    return c.toDataURL("image/png");
  }, png.toString("base64"));
  fs.writeFileSync(SHOT, Buffer.from(out.split(",")[1], "base64"));
  log.push(`screenshot saved to ${SHOT} (${fs.statSync(SHOT).size} bytes)`);
  expect(errors.length === 0, "screenshot", `console errors: ${errors.join(" | ")}`);
  await ctx.close();
}

(async () => {
  const browser = await chromium.launch();
  try {
    await gradeOne(browser);
    await gradeSeven(browser);
    await phone(browser);
    if (SHOT) await cabinetShot(browser);
  } catch (e) {
    problems.push(`crashed: ${e && e.stack ? e.stack : e}`);
  } finally {
    await browser.close();
  }
  for (const l of log) console.log(l);
  if (problems.length) {
    console.error(`PLAYTEST: ${problems.length} problem(s)`);
    for (const p of problems) console.error(" - " + p);
    process.exit(1);
  }
  console.log("PLAYTEST: all checks passed.");
})();
