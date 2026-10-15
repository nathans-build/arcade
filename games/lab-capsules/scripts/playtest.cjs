/*
 * Automated playtest (dev only). Builds nothing: run `npm run build` first. Starts its own static
 * server on http://127.0.0.1:8842 (dist/ at /lab-capsules/, the arcade fonts at /fonts/), uses the
 * global Playwright + preinstalled Chromium, and stops the server at the end.
 *
 *   node scripts/playtest.cjs                       (grades 1, 4, 8)
 *   SHOT=../../site/img/lab-capsules.png node scripts/playtest.cjs   (also saves the 640×400 cabinet picture)
 *
 * Per grade on a 1280×800 keyboard screen: title (grade badge, How to play), start; ←/→ move,
 * A–D never move, X/Z/↑ rotate, ↓ soft drop, Space hard drop (capsule locks, a new one spawns);
 * a real match by MEANING made with keys (a germ + a matching half + a dropped capsule → cleared,
 * germ count and score change); Esc pauses/resumes; finish the level (debug hook) → LAB CLEAN →
 * Lab Quiz answered RIGHT by number key (+500); next level; finish → quiz answered WRONG by letter
 * key (explanation shows, run continues, next level plays).
 * Phone 390×844 (touch): touch pads show, ◀ ▶ ⟳ ⟲ ▼ DROP work, swipe/tap on the bottle moves and
 * turns, a quiz answered by tapping; no sideways scroll on the title, in play and in the quiz
 * (390 and 360 px). Topics: ?topic=physical at grade 8 preselects SCIENCE and plays the element
 * lab; ?topic=algebra at grade 2 falls back with a note; no ?grade shows the grade picker.
 * Fails on any console error, page error, failed or external request.
 */
const path = require("path");
const fs = require("fs");
const http = require("http");
const { execSync } = require("child_process");
const { chromium } = require(path.join(execSync("npm root -g").toString().trim(), "playwright"));

const PORT = Number(process.env.PORT || 8842);
const ROOT = path.resolve(__dirname, "..");
const SITE = path.resolve(ROOT, "../../site");
const BASE = `http://127.0.0.1:${PORT}/lab-capsules/`;
const GRADES = (process.env.GRADES || "1,4,8").split(",");
const SHOT = process.env.SHOT;

const MIME = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".woff2": "font/woff2", ".woff": "font/woff", ".json": "application/json", ".png": "image/png" };
function serve() {
  const server = http.createServer((req, res) => {
    const u = decodeURIComponent((req.url || "/").split("?")[0]);
    let f = null;
    if (u.startsWith("/lab-capsules/")) f = path.join(ROOT, "dist", u.slice("/lab-capsules/".length) || "index.html");
    else if (u.startsWith("/fonts/")) f = path.join(SITE, u);
    if (f && fs.existsSync(f) && fs.statSync(f).isDirectory()) f = path.join(f, "index.html");
    if (!f || !fs.existsSync(f)) {
      res.writeHead(404);
      return res.end("not found");
    }
    res.writeHead(200, { "content-type": MIME[path.extname(f)] || "application/octet-stream" });
    fs.createReadStream(f).pipe(res);
  });
  return new Promise((resolve) => server.listen(PORT, "127.0.0.1", () => resolve(server)));
}

const problems = [];
const note = (where, msg) => problems.push(`[${where}] ${msg}`);

function watchErrors(page, errors) {
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  page.on("requestfailed", (r) => errors.push(`request failed: ${r.url()}`));
  page.on("request", (r) => {
    if (!r.url().startsWith(`http://127.0.0.1:${PORT}`)) errors.push(`external request: ${r.url()}`);
  });
}

const state = (page) =>
  page.evaluate(() => {
    const s = window.__lc();
    const g = s.game;
    return {
      screen: s.screen,
      paused: s.paused,
      level: s.run ? s.run.level : 0,
      score: s.run ? (s.screen === "play" ? g.score : s.run.score) : 0,
      over: s.run ? s.run.over : false,
      phase: g ? g.phase : null,
      germs: g ? g.germs : 0,
      piece: g && g.piece ? { r: g.piece.r, c: g.piece.c, v: g.piece.vertical } : null,
      capsules: g ? g.capsules : 0,
      set: g ? g.set.id : null,
      quiz: s.run && s.run.quiz ? { answer: s.run.quiz.answer, choices: s.run.quiz.choices, standard: s.run.quiz.standard } : null,
    };
  });

async function waitScreen(page, screen, ms = 8000) {
  await page.waitForFunction((sc) => window.__lc && window.__lc().screen === sc, screen, { timeout: ms });
}

async function noSideScroll(page, where) {
  const { sw, cw } = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));
  if (sw > cw + 1) note(where, `sideways scroll (${sw} > ${cw})`);
}

/** Empties the bottle and builds: germ (kind 0) at the bottom of column 0 with a matching half on it,
 *  another germ (kind 1) in column 7, and a fresh capsule of two kind-0 halves at the top. */
async function setupMatch(page) {
  await page.evaluate(() => {
    const g = window.__lc().game;
    const b = g.bottle;
    for (let r = 0; r < b.grid.length; r++) for (let c = 0; c < b.grid[r].length; c++) b.grid[r][c] = null;
    const rng = Math.random;
    // number tiles all say 1 (no accidental 3 + 7 bonus); everything else keeps its own label
    const t = (tok) => (tok.num === undefined ? tok : { ...tok, num: 1, label: "1", key: "1" });
    b.put(15, 0, t(g.set.germToken(0, rng)), true);
    b.put(14, 0, t(g.set.halfToken(0, rng)));
    b.put(15, 7, t(g.set.germToken(1, rng)), true);
    g.piece = b.spawn(t(g.set.halfToken(0, rng)), t(g.set.halfToken(0, rng)));
  });
}

async function desktop(browser, grade) {
  const where = `grade ${grade} desktop`;
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();
  const errors = [];
  watchErrors(page, errors);
  await page.goto(`${BASE}?grade=${grade}&debug`, { waitUntil: "load" });
  await page.waitForFunction(() => !!window.__lc);
  const badge = await page.locator(".lc-gradebadge").innerText().catch(() => "");
  if (!badge.includes(grade === "K" ? "KINDERGARTEN" : `GRADE ${grade}`)) note(where, `grade badge "${badge}"`);
  if (await page.locator(".lc-grade").count()) note(where, "grade picker shown although ?grade= was given");
  if (!(await page.locator('[data-subject="mixed"][aria-checked="true"]').count())) note(where, "MIXED is not the default subject");
  const ra = await page.locator(".lc-toolbar button", { hasText: "READ ALOUD" }).innerText().catch(() => "");
  if (Number(grade) <= 2 && !ra.includes("ON")) note(where, `read aloud should default ON for K–2 (${ra})`);
  if (Number(grade) >= 3 && !ra.includes("OFF")) note(where, `read aloud should default OFF for grade 3+ (${ra})`);
  await page.locator(".lc-cta", { hasText: "How to play" }).click();
  if (!(await page.locator(".lc-howto li").count())) note(where, "How to play didn't open");
  await page.locator(".lc-cta.big").click();
  await waitScreen(page, "play");
  let s = await state(page);
  if (!s.piece) note(where, "no capsule after start");
  if (await page.locator(".lc-touch.show").count()) note(where, "touch pads shown for keyboard/mouse");
  if ((await page.locator("[data-hud=germs]").innerText()) !== String(s.germs)) note(where, "HUD germs don't match");

  // move
  const c0 = s.piece.c;
  await page.keyboard.press("ArrowLeft");
  s = await state(page);
  if (s.piece.c !== c0 - 1) note(where, `ArrowLeft didn't move (${c0} → ${s.piece.c})`);
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("ArrowRight");
  s = await state(page);
  if (s.piece.c !== c0 + 1) note(where, `ArrowRight didn't move (${s.piece.c})`);
  // A–D never move
  for (const k of ["a", "b", "c", "d", "A", "D"]) await page.keyboard.press(k);
  const s2 = await state(page);
  if (s2.piece.c !== s.piece.c || s2.piece.v !== s.piece.v) note(where, "A–D moved or turned the capsule");
  // rotate
  await page.keyboard.press("x");
  s = await state(page);
  if (!s.piece.v) note(where, "X didn't turn the capsule upright");
  await page.keyboard.press("z");
  s = await state(page);
  if (s.piece.v) note(where, "Z didn't turn it back");
  await page.keyboard.press("ArrowUp");
  s = await state(page);
  if (!s.piece.v) note(where, "ArrowUp didn't turn");
  // soft drop
  const r0 = s.piece.r;
  await page.keyboard.press("ArrowDown");
  s = await state(page);
  if (!(s.piece.r > r0)) note(where, "ArrowDown didn't drop a row");
  // hard drop → locks, a new capsule spawns
  const n0 = s.capsules;
  await page.keyboard.press(" ");
  await page.waitForTimeout(900);
  s = await state(page);
  if (!(s.capsules > n0)) note(where, `Space didn't land the capsule (${n0} → ${s.capsules})`);
  if (s.screen !== "play") note(where, `screen after hard drop: ${s.screen}`);

  // a real match, by meaning, made with the keys
  await setupMatch(page);
  s = await state(page);
  const germsBefore = s.germs;
  const scoreBefore = s.score;
  await page.keyboard.press("x");
  for (let i = 0; i < 4; i++) await page.keyboard.press("ArrowLeft");
  s = await state(page);
  if (!(s.piece && s.piece.c === 0 && s.piece.v)) note(where, `couldn't line the capsule up on column 0 (${JSON.stringify(s.piece)})`);
  await page.keyboard.press("Space");
  await page.waitForTimeout(1200);
  s = await state(page);
  if (s.germs !== germsBefore - 1) note(where, `match didn't clear the germ (${germsBefore} → ${s.germs})`);
  if (!(s.score > scoreBefore)) note(where, "match didn't score");
  const notes = await page.locator(".lc-notes").innerText();
  if (!/(All|in a row)/.test(notes)) note(where, `lab notes didn't explain the match: "${notes.slice(0, 80)}"`);

  // pause
  await page.keyboard.press("Escape");
  s = await state(page);
  if (!s.paused || !(await page.locator(".lc-overlay", { hasText: "PAUSED" }).count())) note(where, "Esc didn't pause");
  const rp = s.piece ? s.piece.r : null;
  await page.waitForTimeout(1300);
  s = await state(page);
  if (s.piece && s.piece.r !== rp) note(where, "capsule fell while paused");
  await page.keyboard.press("Escape");
  s = await state(page);
  if (s.paused) note(where, "Esc didn't resume");

  // finish the level → quiz, answer RIGHT by number key
  await page.evaluate(() => window.__lcDebug.clearGerms());
  await waitScreen(page, "clear", 4000).catch(() => note(where, "no LAB CLEAN banner"));
  await waitScreen(page, "quiz", 5000);
  s = await state(page);
  if (!s.quiz) note(where, "no quiz");
  if (new Set(s.quiz.choices).size !== 4) note(where, `quiz choices not unique: ${s.quiz.choices}`);
  const qs = s.score;
  await page.keyboard.press(String(s.quiz.answer + 1));
  await page.waitForSelector(".lc-result");
  if (!(await page.locator(".lc-result.right").count())) note(where, "right answer not marked right");
  s = await state(page);
  if (s.score !== qs + 500) note(where, `quiz bonus (${qs} → ${s.score})`);
  await page.keyboard.press("Enter");
  await waitScreen(page, "play");
  s = await state(page);
  if (s.level !== 2) note(where, `level after quiz: ${s.level}`);

  // level 2 → quiz answered WRONG by letter key
  await page.evaluate(() => window.__lcDebug.clearGerms());
  await waitScreen(page, "quiz", 6000);
  s = await state(page);
  const wrong = (s.quiz.answer + 1) % 4;
  await page.keyboard.press("abcd"[wrong]);
  await page.waitForSelector(".lc-result");
  if (!(await page.locator(".lc-result.wrong").count())) note(where, "wrong answer not marked");
  const expl = await page.locator(".lc-result").innerText();
  if (expl.length < 30) note(where, "no explanation after a wrong answer");
  s = await state(page);
  if (s.over || s.screen !== "quiz") note(where, "a wrong quiz answer ended the run");
  await page.locator(".lc-cta", { hasText: "Next level" }).click();
  await waitScreen(page, "play");
  s = await state(page);
  if (s.level !== 3 || s.over || !s.piece) note(where, `after a wrong answer the next level didn't start (level ${s.level})`);
  await noSideScroll(page, where);

  if (errors.length) note(where, `errors: ${errors.slice(0, 4).join(" | ")}`);
  await ctx.close();
}

async function phone(browser, grade, width, height) {
  const where = `grade ${grade} phone ${width}`;
  const ctx = await browser.newContext({ viewport: { width, height }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  const errors = [];
  watchErrors(page, errors);
  await page.goto(`${BASE}?grade=${grade}&debug`, { waitUntil: "load" });
  await page.waitForFunction(() => !!window.__lc);
  await noSideScroll(page, `${where} title`);
  await page.locator('[data-subject="science"]').tap();
  await noSideScroll(page, `${where} title + topics`);
  await page.locator('[data-subject="mixed"]').tap();
  await page.locator(".lc-cta.big").tap();
  await waitScreen(page, "play");
  if (!(await page.locator(".lc-touch.show").count())) note(where, "touch pads not shown");
  await noSideScroll(page, `${where} play`);
  // the bottle must fit on screen
  const box = await page.locator("canvas.board").boundingBox();
  if (!box || box.x < 0 || box.x + box.width > width + 1) note(where, `bottle doesn't fit (${JSON.stringify(box)})`);
  const pads = await page.locator(".lc-touch button").evaluateAll((els) => els.map((e) => e.getBoundingClientRect()).map((r) => [r.left, r.right, r.bottom]));
  for (const [l, r, b] of pads) if (l < 0 || r > width + 1 || b > height + 1) note(where, `touch button off screen (${l}, ${r}, ${b})`);

  let s = await state(page);
  const c0 = s.piece.c;
  await page.locator('.lc-touch button[aria-label="Move left"]').tap();
  s = await state(page);
  if (s.piece.c !== c0 - 1) note(where, `◀ didn't move (${c0} → ${s.piece.c})`);
  await page.locator('.lc-touch button[aria-label="Move right"]').tap();
  await page.locator('.lc-touch button[aria-label="Turn right"]').tap();
  s = await state(page);
  if (!s.piece.v) note(where, "⟳ didn't turn");
  await page.locator('.lc-touch button[aria-label="Turn left"]').tap();
  s = await state(page);
  if (s.piece.v) note(where, "⟲ didn't turn back");
  const r0 = s.piece.r;
  await page.locator('.lc-touch button[aria-label="Drop faster"]').tap();
  s = await state(page);
  if (!(s.piece.r > r0)) note(where, "▼ didn't drop");
  // tap on the bottle turns; a sideways swipe moves
  const cb = await page.locator("canvas.board").boundingBox();
  await page.touchscreen.tap(cb.x + cb.width / 2, cb.y + cb.height / 2);
  s = await state(page);
  if (!s.piece.v) note(where, "tapping the bottle didn't turn");
  const cBefore = s.piece.c;
  const cell = cb.width / 8.6;
  // a real touch swipe (Chrome DevTools touch events → pointer events)
  const cdp = await ctx.newCDPSession(page);
  const sx = cb.x + cb.width / 2;
  const sy = cb.y + cb.height / 2;
  await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: sx, y: sy }] });
  for (let i = 1; i <= 8; i++) await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: sx - (cell * 1.8 * i) / 8, y: sy }] });
  await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await page.waitForTimeout(100);
  s = await state(page);
  if (!(s.piece.c < cBefore)) note(where, `swipe left didn't move (${cBefore} → ${s.piece.c})`);
  const n0 = s.capsules;
  await page.locator('.lc-touch button[aria-label="Drop"]').tap();
  await page.waitForTimeout(900);
  s = await state(page);
  if (!(s.capsules > n0)) note(where, "DROP didn't land the capsule");
  // quiz by tapping
  await page.evaluate(() => window.__lcDebug.clearGerms());
  await waitScreen(page, "quiz", 6000);
  await noSideScroll(page, `${where} quiz`);
  s = await state(page);
  await page.locator(`.lc-opt[data-choice="${s.quiz.answer}"]`).tap();
  if (!(await page.locator(".lc-result.right").count())) note(where, "tapped right answer not marked");
  await noSideScroll(page, `${where} quiz answered`);
  await page.locator(".lc-cta", { hasText: "Next level" }).tap();
  await waitScreen(page, "play");
  // pause overlay fits
  await page.locator(".lc-toolbar button", { hasText: "PAUSE" }).tap();
  await noSideScroll(page, `${where} paused`);
  if (errors.length) note(where, `errors: ${errors.slice(0, 4).join(" | ")}`);
  await ctx.close();
}

async function topics(browser) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();
  const errors = [];
  watchErrors(page, errors);
  // ?topic=physical at grade 8
  await page.goto(`${BASE}?grade=8&topic=physical&debug`, { waitUntil: "load" });
  await page.waitForFunction(() => !!window.__lc);
  if (!(await page.locator('[data-subject="science"][aria-checked="true"]').count())) note("topics", "?topic=physical didn't pick SCIENCE");
  if (!(await page.locator('[data-topic="physical"][aria-checked="true"]').count())) note("topics", "?topic=physical didn't pick the topic");
  await page.locator(".lc-cta.big").click();
  await waitScreen(page, "play");
  let s = await state(page);
  if (s.set !== "elements") note("topics", `grade 8 physical plays ${s.set}`);
  // ?topic=numbers at grade 4 → fact lab
  await page.goto(`${BASE}?grade=4&topic=numbers&debug`, { waitUntil: "load" });
  await page.waitForFunction(() => !!window.__lc);
  await page.locator(".lc-cta.big").click();
  await waitScreen(page, "play");
  s = await state(page);
  if (s.set !== "facts") note("topics", `grade 4 numbers plays ${s.set}`);
  // ?topic=algebra at grade 2 → note + ALL MATH
  await page.goto(`${BASE}?grade=2&topic=algebra&debug`, { waitUntil: "load" });
  await page.waitForFunction(() => !!window.__lc);
  if (!(await page.locator(".lc-help.y", { hasText: "ALL MATH" }).count())) note("topics", "?topic=algebra at grade 2 shows no fallback note");
  if (!(await page.locator('[data-topic="algebra"][disabled]').count())) note("topics", "algebra not disabled at grade 2");
  // no ?grade → grade picker; picking a grade and subject is remembered
  await page.goto(`${BASE}?debug`, { waitUntil: "load" });
  await page.waitForFunction(() => !!window.__lc);
  if ((await page.locator(".lc-grade").count()) !== 13) note("topics", "grade picker missing without ?grade=");
  await page.locator(".lc-grade", { hasText: /^11$/ }).click();
  await page.locator('[data-subject="science"]').click();
  await page.locator(".lc-cta.big").click();
  await waitScreen(page, "play");
  s = await state(page);
  if (s.set !== "ions") note("topics", `grade 11 science plays ${s.set}`);
  const saved = await page.evaluate(() => [localStorage.getItem("arcade.lab-capsules.subject"), localStorage.getItem("arcade.lab-capsules.topic")]);
  if (saved[0] !== "science") note("topics", `subject not saved (${saved})`);
  const keys = await page.evaluate(() => Object.keys(localStorage));
  for (const k of keys) if (!k.startsWith("arcade.")) note("topics", `storage key outside arcade.*: ${k}`);
  if (errors.length) note("topics", `errors: ${errors.slice(0, 4).join(" | ")}`);
  await ctx.close();
}

async function screenshot(browser) {
  const ctx = await browser.newContext({ viewport: { width: 640, height: 400 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  await page.addInitScript(() => localStorage.setItem("arcade.muted", "1"));
  await page.goto(`${BASE}?grade=8&topic=physical&debug&level=5`, { waitUntil: "load" });
  await page.waitForFunction(() => !!window.__lc);
  await page.locator(".lc-cta.big").click();
  await waitScreen(page, "play");
  // play a few capsules onto the stack so the bottle looks lived-in
  await page.evaluate(() => {
    const g = window.__lc().game;
    const k = g.set.kinds.length;
    const plan = [[0, 0, 0, true], [7, 1, 2, true], [2, 3, 1, false], [5, 2, 2, false], [1, 1, 3, true]];
    for (const [col, a, b, vert] of plan) {
      g.debugSetPiece(a % k, b % k);
      if (vert) g.rotate(1);
      while (g.piece && g.piece.c > col) g.move(-1);
      while (g.piece && g.piece.c < col) g.move(1);
      g.hardDrop();
      for (let i = 0; i < 60 && g.phase !== "play"; i++) g.update(60);
    }
    for (let i = 0; i < 5; i++) g.update(g.dropMs());
  });
  await page.waitForTimeout(1700); // let the score popups fade
  await page.screenshot({ path: SHOT });
  await ctx.close();
  const size = fs.statSync(SHOT).size;
  console.log(`screenshot ${SHOT}: ${size} bytes`);
  if (size >= 150 * 1024) note("screenshot", `too big (${size} bytes)`);
}

(async () => {
  const server = await serve();
  const browser = await chromium.launch();
  try {
    for (const g of GRADES) await desktop(browser, g);
    await phone(browser, "4", 390, 844);
    await phone(browser, "11", 360, 740);
    await topics(browser);
    if (SHOT) await screenshot(browser);
  } catch (e) {
    problems.push(`crashed: ${e && e.stack ? e.stack : e}`);
  } finally {
    await browser.close();
    await new Promise((r) => server.close(r));
  }
  if (problems.length) {
    console.log(`PLAYTEST: ${problems.length} problem(s)`);
    for (const p of problems) console.log("  ✗ " + p);
    process.exit(1);
  }
  console.log(`PLAYTEST OK: grades ${GRADES.join(", ")} (keyboard), phones 390 and 360 (touch), topics.`);
})();
