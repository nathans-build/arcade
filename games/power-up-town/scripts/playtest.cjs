/*
 * Automated playtest (dev only). Builds nothing: run `npm run build` first. It starts its own small
 * static server on port 8921 (PORT=…) serving dist/ at /power-up-town/ and the arcade's fonts at
 * /fonts/, drives Chromium with the global Playwright, and stops the server when done:
 *   node scripts/playtest.cjs        (SHOT=../../site/img/power-up-town.png saves a 640x400 picture)
 *
 * Grade 2 on a desktop with the mouse (and one drag), grade 5 on a 390x844 phone with taps, and
 * grade 10 on a tablet with taps plus the keyboard:
 *  - the grade badge (no picker with ?grade=), fonts from /fonts/, read-aloud default, the toolbar
 *    tappable over the title and the question overlay, no sideways scroll anywhere;
 *  - building 1 (a circuit): flipping the switch on the unfinished board shows the break (✗) and
 *    lights nothing; placing the parts, then flipping, lights the bulb and sends Sparky round;
 *  - a Science Check answered wrong (explanation, nothing lost), then Sparky's Run to the bulb;
 *  - building 2 (a heat lab): a losing choice loses, the winning one wins; a Science Check right;
 *  - the town shows both buildings lit, and they're still lit after a reload;
 *  - Music and SFX switches persist after a reload; Esc pauses; no console errors, no outside requests.
 * Then the picker: ?grade=10&topic=algebra opens MATH → Algebra and the check asks algebra,
 * ?grade=K&topic=algebra falls back with a note, and the grade picker has no sideways scroll at 360px.
 */
const path = require("path");
const fs = require("fs");
const http = require("http");
const { execSync } = require("child_process");
const { chromium } = require(path.join(execSync("npm root -g").toString().trim(), "playwright"));

const PORT = Number(process.env.PORT || 8921);
const ROOT = path.resolve(__dirname, "..");
const DIST = path.join(ROOT, "dist");
const FONTS = path.resolve(ROOT, "../../site/fonts");
const BASE = `http://127.0.0.1:${PORT}/power-up-town/`;
const ORIGIN = `http://127.0.0.1:${PORT}/`;
const SHOT = process.env.SHOT;
const TYPES = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".woff2": "font/woff2", ".json": "application/json", ".png": "image/png" };

function serve() {
  const server = http.createServer((req, res) => {
    const url = decodeURIComponent(new URL(req.url, ORIGIN).pathname);
    let file = null;
    if (url.startsWith("/power-up-town/")) file = path.join(DIST, url.slice("/power-up-town/".length) || "index.html");
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

const state = (page) => page.evaluate(() => window.__put && window.__put.state());
const noSideways = (page) => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 0.5 && document.body.scrollWidth <= window.innerWidth + 0.5);

/** The toolbar's MUSIC (or SOUND OFF) button is the top element at its own centre: nothing covers it. */
async function toolbarTappable(page) {
  return page.evaluate(() => {
    const bs = [...document.querySelectorAll(".pt-toolbar a, .pt-toolbar button")];
    return bs.length > 0 && bs.every((b) => {
      const r = b.getBoundingClientRect();
      const el = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
      return r.width > 0 && (el === b || b.contains(el));
    });
  });
}

async function press(page, opts, locator) {
  const l = typeof locator === "string" ? page.locator(locator).first() : locator;
  if (opts.touch) await l.tap();
  else await l.click();
}

/** Client coordinates of a board cell's centre. */
async function cellPoint(page, r, c) {
  return page.evaluate(([r, c]) => {
    const g = window.__put.geom();
    const rect = document.querySelector(".pt-canvas").getBoundingClientRect();
    return { x: rect.left + ((g.x0 + c * g.cs + g.cs / 2) / 320) * rect.width, y: rect.top + ((g.y0 + r * g.cs + g.cs / 2) / 200) * rect.height };
  }, [r, c]);
}

async function tapCell(page, opts, r, c) {
  const p = await cellPoint(page, r, c);
  if (opts.touch) await page.touchscreen.tap(p.x, p.y);
  else await page.mouse.click(p.x, p.y);
  await page.waitForTimeout(30);
}

/** Builds the level's stored solution through the real UI (toolbox, taps, turning, taking parts). */
async function buildSolution(page, opts, p) {
  const level = await page.evaluate(() => window.__put.level());
  const key = (t) => [t.kind, t.shape ?? "", t.mat ?? "", t.ohms ?? "", t.volts ?? ""].join("|");
  // 1. take away loose parts that aren't in the solution in the same place
  for (const pre of level.pre || []) {
    const keep = level.solution.find((s) => s.r === pre.r && s.c === pre.c && key(s.tile) === key(pre.tile) && s.tile.rot === pre.tile.rot);
    if (keep) continue;
    await press(page, opts, `.pt-tool[data-tool="take"]`);
    await tapCell(page, opts, pre.r, pre.c);
  }
  // 2. place each solution part
  let dragged = false;
  for (const s of level.solution) {
    const st = await state(page);
    const cur = st.grid[s.r][s.c];
    if (cur && key(cur) === key(s.tile) && cur.rot % (s.tile.kind === "wire" && s.tile.shape === "straight" ? 2 : 4) === s.tile.rot) continue;
    const btn = page.locator(`.pt-tool[data-sig="${key(s.tile)}"]`).first();
    if (!(await btn.count())) {
      p.push(`${level.id}: no toolbox button for ${key(s.tile)}`);
      continue;
    }
    if (opts.drag && !dragged) {
      // Desktop: drag the part from the toolbox onto the board.
      dragged = true;
      const b = await btn.boundingBox();
      const to = await cellPoint(page, s.r, s.c);
      await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2);
      await page.mouse.down();
      await page.mouse.move(to.x, to.y, { steps: 6 });
      await page.mouse.up();
      await page.waitForTimeout(40);
      const after = (await state(page)).grid[s.r][s.c];
      if (!after || key(after) !== key(s.tile)) p.push(`${level.id}: dragging ${key(s.tile)} onto the board didn't place it`);
    } else {
      await press(page, opts, btn);
      await tapCell(page, opts, s.r, s.c);
    }
    // turn it until it matches
    for (let k = 0; k < 4; k++) {
      const t = (await state(page)).grid[s.r][s.c];
      if (!t) break;
      const n = t.kind === "wire" ? (t.shape === "straight" ? 2 : 4) : t.kind === "battery" ? 4 : 2;
      if (t.rot % n === s.tile.rot % n) break;
      // tapping a placed part with a different tool selected would swap it: select its own part first
      await press(page, opts, page.locator(`.pt-tool[data-sig="${key(s.tile)}"]`).first());
      await tapCell(page, opts, s.r, s.c);
    }
  }
}

/** Answers the open Science Check right or wrong and checks what happens. */
async function scienceCheck(page, opts, want, p, label) {
  await page.waitForSelector(".pt-card");
  const s = await page.evaluate(() => {
    const opts = [...document.querySelectorAll(".pt-opt")];
    return { n: opts.length, std: document.querySelector(".pt-card-head .std").textContent };
  });
  if (s.n !== 4) p.push(`${label}: question has ${s.n} choices`);
  // the right choice (the game's state is not exposed for questions: read it through React props via the explanation flow)
  const answerIdx = await page.evaluate(() => {
    // __put exposes nothing about the dealt question; find it from the React fiber of the card.
    const card = document.querySelector(".pt-card");
    const key = Object.keys(card).find((k) => k.startsWith("__reactFiber"));
    let f = card[key];
    while (f && !(f.memoizedProps && f.memoizedProps.q)) f = f.return;
    return f ? f.memoizedProps.q.answer : -1;
  });
  if (answerIdx < 0) {
    p.push(`${label}: couldn't find the question's answer`);
    return null;
  }
  if (opts.phone && !(await toolbarTappable(page))) p.push(`${label}: toolbar covered by the question overlay`);
  if (!(await noSideways(page))) p.push(`${label}: sideways scroll with the question open`);
  const pick = want === "right" ? answerIdx : (answerIdx + 1) % 4;
  if (opts.keys) await page.keyboard.press(String(pick + 1));
  else await press(page, opts, `.pt-opt[data-choice="${pick}"]`);
  await page.waitForSelector(".pt-after");
  const head = await page.locator(".pt-card-head").innerText();
  const explain = await page.locator(".pt-explain").innerText();
  if (want === "right" && !/CORRECT/.test(head)) p.push(`${label}: right answer header "${head}"`);
  if (want === "wrong" && !/NOT QUITE/.test(head)) p.push(`${label}: wrong answer header "${head}"`);
  if (explain.length < 20) p.push(`${label}: no explanation`);
  await press(page, opts, ".pt-after .pt-cta");
  return s.std;
}

/** Drives Sparky to the bulb with arrow keys (desktop) or the on-screen arrows (touch). */
async function sparkyRun(page, opts, p, label) {
  await page.waitForFunction(() => window.__put.state().run);
  const route = await page.evaluate(() => window.__put.route());
  if (!route || !route.length) {
    p.push(`${label}: no route`);
    return;
  }
  const DR = [-1, 0, 1, 0];
  const DC = [0, 1, 0, -1];
  const s0 = (await state(page)).run;
  const tiles = [[s0.r, s0.c]];
  for (const d of route) tiles.push([tiles[tiles.length - 1][0] + DR[d], tiles[tiles.length - 1][1] + DC[d]]);
  const KEYS = ["ArrowUp", "ArrowRight", "ArrowDown", "ArrowLeft"];
  let idx = 0;
  let lastSent = null;
  const t0 = Date.now();
  while (Date.now() - t0 < 90000) {
    const st = await state(page);
    if (st.overlay === "runDone") break;
    const r = st.run;
    if (!r) break;
    while (idx + 1 < tiles.length && tiles[idx + 1][0] === r.r && tiles[idx + 1][1] === r.c) idx++;
    let want = null;
    if (r.t > 0) {
      const nx = route[idx + 1];
      if (nx !== undefined && nx !== ((r.dir + 2) % 4)) want = nx;
    } else if (route[idx] !== undefined) want = route[idx];
    const sendKey = `${idx}:${want}:${r.t > 0 ? 1 : 0}`;
    if (want !== null && sendKey !== lastSent) {
      lastSent = sendKey;
      if (opts.touch) await page.locator(`.pt-pad[data-dir="${want}"]`).dispatchEvent("pointerdown");
      else await page.keyboard.press(KEYS[want]);
    }
    await page.waitForTimeout(8);
  }
  await page.waitForSelector(".pt-stars", { timeout: 5000 }).catch(() => p.push(`${label}: Sparky's Run never finished`));
  const stars = Number(await page.locator(".pt-stars").getAttribute("data-stars").catch(() => "0"));
  const title = await page.locator(".pt-panel .pt-title").innerText().catch(() => "");
  if (!/BULB LIT/.test(title) || stars < 1) p.push(`${label}: run ended "${title}" with ${stars} stars`);
  return stars;
}

async function run(browser, grade, opts, problems) {
  const label = `grade ${grade} ${opts.name}`;
  const ctx = await browser.newContext(opts.context);
  const page = await ctx.newPage();
  const errors = [];
  const external = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  page.on("request", (r) => {
    if (!r.url().startsWith(ORIGIN) && !r.url().startsWith("data:") && !r.url().startsWith("blob:")) external.push(r.url());
  });
  const p = [];
  await page.goto(`${BASE}?grade=${grade}&debug&speed=3`, { waitUntil: "load" });
  await page.waitForFunction(() => !!window.__put);
  const badge = await page.locator(".pt-gradebadge").innerText().catch(() => "");
  if (!badge.includes(grade === "K" ? "KINDERGARTEN" : `GRADE ${grade}`)) p.push(`badge "${badge}"`);
  if ((await page.locator(".pt-grade").count()) !== 0) p.push("grade picker shown although ?grade= was given");
  const fontsOk = await page.evaluate(async () => { await document.fonts.ready; return document.fonts.check('12px "Press Start 2P"'); });
  if (!fontsOk) p.push("Press Start 2P not loaded from /fonts/");
  if (!(await noSideways(page))) p.push("sideways scroll on the title");
  if (!(await toolbarTappable(page))) p.push("toolbar not tappable on the title");
  if ((await page.locator('.pt-subject[aria-checked="true"]').getAttribute("data-subject")) !== "science") p.push("SCIENCE should be the default subject");
  const ra = await page.locator(".pt-read").getAttribute("aria-pressed").catch(() => null);
  if (ra !== null && ra !== (Number(grade) <= 2 ? "true" : "false")) p.push(`read aloud default ${ra}`);

  // Title → town
  await press(page, opts, ".pt-start");
  await page.waitForSelector(".pt-buildings");
  if ((await page.locator(".pt-building:not([disabled])").count()) !== 1) p.push("a new town should have only building 1 open");
  if (!(await noSideways(page))) p.push("sideways scroll on the town map");
  await press(page, opts, ".pt-playnext");
  await page.waitForFunction(() => window.__put.state().screen === "circuit");
  if (!(await noSideways(page))) p.push("sideways scroll on the circuit board");

  // Esc pauses (desktop)
  if (!opts.touch) {
    await page.keyboard.press("Escape");
    if (!(await page.locator(".pt-overlay", { hasText: "PAUSED" }).count())) p.push("Esc should pause");
    await page.keyboard.press("Escape");
    if (await page.locator(".pt-overlay", { hasText: "PAUSED" }).count()) p.push("Esc should resume");
  }

  // A broken circuit shows the break.
  await press(page, opts, ".pt-flip");
  await page.waitForTimeout(80);
  let st = await state(page);
  if (st.win !== false || !(st.breaks > 0 || st.short)) p.push(`unfinished board: win=${st.win} breaks=${st.breaks}`);
  if (st.loads.some((l) => l.on)) p.push("an unfinished circuit lit something");
  if (!(await page.locator(".pt-msg").count())) p.push("no message about the break");
  await press(page, opts, ".pt-flip"); // switch off to edit

  // Build it and flip.
  await buildSolution(page, opts, p);
  await press(page, opts, ".pt-flip");
  await page.waitForTimeout(150);
  st = await state(page);
  if (!st.win) p.push(`${st.levelId}: built solution doesn't win`);
  if (!st.loads.length || !st.loads.filter((l) => l.kind !== "resistor").every((l) => l.on)) p.push(`${st.levelId}: bulb didn't light`);
  if (st.paths < 1) p.push(`${st.levelId}: Sparky isn't running the loop`);
  await page.waitForSelector(".pt-solved", { timeout: 8000 }).catch(() => p.push(`${st.levelId}: no 'has power' panel`));
  if (opts.phone && !(await toolbarTappable(page))) p.push("toolbar covered by the solved overlay");
  await press(page, opts, ".pt-solved .pt-cta");

  // Science Check: wrong (no penalty, explanation), then Sparky's Run to the end.
  await scienceCheck(page, opts, "wrong", p, `${label} check 1`);
  await page.waitForSelector("text=SPARKY'S RUN");
  await press(page, opts, ".pt-panel .pt-cta.big");
  if (!(await noSideways(page))) p.push("sideways scroll in Sparky's Run");
  await sparkyRun(page, opts, p, label);
  await press(page, opts, ".pt-panel .pt-cta.big");
  await page.waitForSelector(".pt-buildings");
  let saved = await page.evaluate(() => JSON.parse(localStorage.getItem("arcade.power-up-town.save.v1") || "{}"));
  const band = Number(grade) <= 2 ? "k2" : Number(grade) <= 5 ? "g35" : Number(grade) <= 8 ? "g68" : "hs";
  if (!saved[band] || !saved[band].solved[0] || !(saved[band].run[0] >= 1)) p.push(`save after building 1: ${JSON.stringify(saved[band])}`);
  if ((await page.locator('.pt-building[data-building="0"]').getAttribute("data-lit")) !== "1") p.push("building 1 not shown lit on the town map");

  // Building 2: a heat lab. A losing choice, then the winning one.
  await press(page, opts, ".pt-playnext");
  await page.waitForFunction(() => window.__put.state().screen === "heat");
  const heat = await page.evaluate(() => window.__put.level());
  if (heat.kind !== "heat") p.push(`building 2 should be a heat lab (got ${heat.kind})`);
  const outcomes = await page.evaluate(() => null);
  void outcomes;
  const lose = { "keep-hot": "metal", "keep-cold": "metal", "heat-up": "126", radiation: "white", conduction: "wood", convection: "high" }[heat.type];
  const win = { "keep-hot": "foam", "keep-cold": "foam", "heat-up": "251", radiation: "black", conduction: "metal", convection: "low" }[heat.type];
  await press(page, opts, `.pt-option[data-option="${lose}"]`);
  await press(page, opts, ".pt-runheat");
  await page.waitForFunction(() => window.__put.state().heatDone, null, { timeout: 10000 });
  st = await state(page);
  if (st.heatWin !== false) p.push(`${heat.id}: ${lose} should lose`);
  if (!(await page.locator(".pt-msg.bad").count())) p.push(`${heat.id}: no feedback after a losing run`);
  await press(page, opts, `.pt-option[data-option="${win}"]`);
  await press(page, opts, ".pt-runheat");
  await page.waitForFunction(() => window.__put.state().heatDone, null, { timeout: 10000 });
  st = await state(page);
  if (st.heatWin !== true) p.push(`${heat.id}: ${win} should win`);
  await page.waitForSelector(".pt-solved", { timeout: 8000 }).catch(() => p.push(`${heat.id}: no 'has power' panel`));
  await press(page, opts, ".pt-solved .pt-cta");
  await scienceCheck(page, { ...opts, keys: !opts.touch }, "right", p, `${label} check 2`);
  await page.waitForSelector("text=SPARKY'S RUN");
  await press(page, opts, ".pt-panel .pt-cta.ghost"); // skip the bonus
  await page.waitForSelector(".pt-buildings");
  await page.waitForTimeout(200);

  // Reload: both buildings still lit.
  await page.goto(`${BASE}?grade=${grade}&debug`, { waitUntil: "load" });
  await press(page, opts, ".pt-start");
  await page.waitForSelector(".pt-buildings");
  const litNow = await page.locator('.pt-building[data-lit="1"]').count();
  if (litNow !== 2) p.push(`after reload ${litNow} buildings lit (want 2)`);
  if (!(await page.locator(".pt-hud", { hasText: "2/12" }).count())) p.push("HUD should say 2/12 lit");

  // Music and SFX switches persist.
  await press(page, opts, ".pt-music");
  await press(page, opts, ".pt-sfx");
  await page.goto(`${BASE}?grade=${grade}&debug`, { waitUntil: "load" });
  const mus = await page.locator(".pt-music").innerText();
  const sfx = await page.locator(".pt-sfx").innerText();
  if (mus !== "MUSIC OFF" || sfx !== "SFX OFF") p.push(`music/sfx after reload: ${mus} / ${sfx}`);
  await press(page, opts, ".pt-music");
  await press(page, opts, ".pt-sfx");
  if ((await page.locator(".pt-music").innerText()) !== "MUSIC ON") p.push("music switch back on");

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
  await page.goto(`${BASE}?grade=10&topic=algebra&debug&speed=3`, { waitUntil: "load" });
  await page.waitForFunction(() => !!window.__put);
  if ((await page.locator('.pt-subject[aria-checked="true"]').getAttribute("data-subject")) !== "math") p.push("?topic=algebra should pick MATH");
  if ((await page.locator('.pt-topic[aria-checked="true"]').getAttribute("data-topic")) !== "algebra") p.push("?topic=algebra should pick Algebra");
  if (!(await noSideways(page))) p.push("sideways scroll at 360px with topics");
  if (!(await toolbarTappable(page))) p.push("toolbar not tappable at 360px");
  // Play building 1 and check the question is algebra.
  await page.locator(".pt-start").tap();
  await page.locator(".pt-playnext").tap();
  await page.waitForFunction(() => window.__put.state().screen === "circuit");
  await buildSolution(page, { touch: true }, p);
  await page.locator(".pt-flip").tap();
  await page.waitForSelector(".pt-solved", { timeout: 8000 });
  await page.locator(".pt-solved .pt-cta").tap();
  const std = await scienceCheck(page, { touch: true, phone: true }, "right", p, "algebra check");
  if (!std || !/ALGEBRA/.test(std) || !/(EE|A-|F-|AF)/.test(std)) p.push(`algebra focus asked "${std}"`);
  await page.goto(`${BASE}?grade=K&topic=algebra&debug`, { waitUntil: "load" });
  const note = await page.locator(".pt-notice").innerText().catch(() => "");
  if (!/Algebra & equations is for Grades 6\+/.test(note)) p.push(`K algebra note "${note}"`);
  if ((await page.locator('.pt-topic[data-topic="algebra"]').getAttribute("disabled")) === null) p.push("algebra should be disabled at K");
  await page.goto(`${BASE}?debug`, { waitUntil: "load" });
  if ((await page.locator(".pt-grade").count()) !== 13) p.push("grade picker should show K-12 without ?grade=");
  if (!(await noSideways(page))) p.push("sideways scroll on the grade picker at 360px");
  if (errors.length) p.push(`console errors: ${errors.slice(0, 3).join(" | ")}`);
  await ctx.close();
  console.log(`${p.length ? "✗" : "✓"} subject/topic picker${p.length ? ": " + p.join("; ") : ""}`);
  problems.push(...p.map((x) => `picker: ${x}`));
}

async function screenshot(browser) {
  // The town map at night, most buildings lit, Sparky hovering over the next dark one.
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();
  await page.goto(`${BASE}?grade=7&debug`, { waitUntil: "load" });
  await page.evaluate(() => {
    const solved = Array(12).fill(false).map((_, i) => i < 9 && i !== 4);
    localStorage.setItem("arcade.power-up-town.save.v1", JSON.stringify({ g68: { solved, run: Array(12).fill(2) } }));
  });
  await page.goto(`${BASE}?grade=7&debug`, { waitUntil: "load" });
  await page.locator(".pt-start").click();
  await page.waitForTimeout(1200);
  const data = await page.evaluate(() => {
    const src = document.querySelector(".pt-canvas");
    const c = document.createElement("canvas");
    c.width = 640;
    c.height = 400;
    const x = c.getContext("2d");
    x.imageSmoothingEnabled = false;
    x.drawImage(src, 0, 0, 640, 400);
    return c.toDataURL("image/png");
  });
  await ctx.close();
  fs.writeFileSync(path.resolve(process.cwd(), SHOT), Buffer.from(data.split(",")[1], "base64"));
  console.log(`saved ${SHOT}`);
}

(async () => {
  const server = await serve();
  const browser = await chromium.launch();
  const problems = [];
  try {
    await run(browser, "2", { name: "desktop mouse", drag: true, context: { viewport: { width: 1280, height: 800 } } }, problems);
    await run(browser, "5", { name: "phone touch", touch: true, phone: true, context: { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 } }, problems);
    await run(browser, "10", { name: "tablet touch", touch: true, context: { viewport: { width: 820, height: 1180 }, hasTouch: true, isMobile: true } }, problems);
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
