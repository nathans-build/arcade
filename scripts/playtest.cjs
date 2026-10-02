/*
 * Automated playtest (dev only). Needs a running preview and a global Playwright:
 *   npm run build && npx vite preview --port 4417 --host 127.0.0.1 &
 *   node scripts/playtest.cjs        # GRADES=K,3,7,11 by default; SHOT=docs/screenshot.png saves a canvas shot
 * For each grade it plays with the keyboard (1280x800), with touch on an iPad in landscape
 * (1080x810) and in portrait (810x1080): checks the grade badge, catches sunlight (cursor or tap),
 * watches photosynthesis turn light + water + CO2 into glucose, unlocks a defender by answering its
 * question (key, click or tap), plants it, starts a wave, lets an undead reach the gnome cart and
 * the greenhouse, clears the wave, answers the transmission (key or tap), then loses the last
 * heart and checks the mission report. One run without ?grade= checks the grade picker.
 */
const path = require("path");
const fs = require("fs");
const { execSync } = require("child_process");
const { chromium } = require(path.join(execSync("npm root -g").toString().trim(), "playwright"));

const BASE = process.env.BASE || "http://127.0.0.1:4417/";
const GRADES = (process.env.GRADES || "K,3,7,11").split(",");
const SHOT = process.env.SHOT;
const CODE_FOR = { K: /^LS\.K\./, 3: /^LS\.3\./, 4: /^LS\.4\./, 7: /^LS\.[67]\./, 11: /^(LS\.Bio|PS\.Chm)/ };

const cellX = (c) => 30 + c * 30;
const cellY = (r) => 22 + r * 35;

async function waitFor(page, fn, arg, ms = 8000) {
  await page.waitForFunction(fn, arg, { timeout: ms });
}

async function canvasPoint(page, x, y) {
  const r = await page.locator("canvas").boundingBox();
  return { x: r.x + (x / 320) * r.width, y: r.y + (y / 200) * r.height };
}

const sim = (page, expr) => page.evaluate(new Function(`const e = window.__pvu, s = e.sim; return (${expr});`));

async function run(browser, grade, mode) {
  const touch = mode !== "keys";
  const vp = mode === "portrait" ? { width: 810, height: 1080 } : mode === "touch" ? { width: 1080, height: 810 } : { width: 1280, height: 800 };
  const ctx = await browser.newContext(touch ? { viewport: vp, hasTouch: true, isMobile: true, deviceScaleFactor: 2 } : { viewport: vp });
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (m) => {
    if (m.type() === "error" && !/fonts\.(googleapis|gstatic)|ERR_|Failed to load resource/.test(m.text())) errors.push(m.text());
  });
  const url = grade ? `${BASE}?grade=${grade}&debug` : `${BASE}?debug`;
  await page.goto(url, { waitUntil: "load" });
  await page.waitForFunction(() => !!window.__pvu);
  const problems = [];
  const notes = [];
  const tap = async (loc) => (touch ? loc.tap() : loc.click());
  const tapCanvas = async (x, y) => {
    const p = await canvasPoint(page, x, y);
    if (touch) await page.touchscreen.tap(p.x, p.y);
    else await page.mouse.click(p.x, p.y);
  };

  // Grade badge vs picker
  const badge = await page.locator(".pvu-badge").count();
  const picker = await page.locator(".pvu-grades").count();
  if (grade && (!badge || picker)) problems.push(`with ?grade= expected badge, got badge=${badge} picker=${picker}`);
  if (!grade) {
    if (badge || !picker) problems.push(`without ?grade= expected picker, got badge=${badge} picker=${picker}`);
    await page.locator(".pvu-grade", { hasText: /^4$/ }).click();
    const on = await page.locator(".pvu-grade.on").innerText();
    if (on.trim() !== "4") problems.push(`picker did not select grade 4 (${on})`);
  }
  const g = grade || "4";
  const readAloud = await page.locator(".pvu-tools button", { hasText: "READ ALOUD" }).innerText().catch(() => "n/a");
  notes.push(readAloud.trim());

  await tap(page.locator(".pvu-cta", { hasText: "Start" }));
  await waitFor(page, () => window.__pvu.playing);
  const lanes = await sim(page, "s.lanes.length");
  if ((g === "K" ? 3 : 5) !== lanes) problems.push(`expected ${g === "K" ? 3 : 5} lanes, got ${lanes}`);

  // Layout: fits the viewport, no scroll.
  const layout = await page.evaluate(() => {
    const c = document.querySelector("canvas").getBoundingClientRect();
    const tip = document.querySelector(".pvu-tip").getBoundingClientRect();
    return { sw: document.documentElement.scrollWidth, sh: document.documentElement.scrollHeight, iw: innerWidth, ih: innerHeight, cb: c.bottom, cw: c.width, tb: tip.bottom };
  });
  if (layout.sw > layout.iw) problems.push(`horizontal scroll ${layout.sw} > ${layout.iw}`);
  if (layout.sh > layout.ih + 1) problems.push(`page taller than viewport ${layout.sh} > ${layout.ih}`);
  if (layout.cb > layout.ih + 1 || layout.tb > layout.ih + 1) problems.push(`canvas/tip below viewport (${layout.cb}, ${layout.tb} > ${layout.ih})`);
  notes.push(`canvas ${Math.round(layout.cw)}px wide`);

  // --- Catch sunlight
  const row = await sim(page, "s.lanes[1]");
  const light0 = await sim(page, "s.store.light");
  const col = touch ? 5 : 3;
  await page.evaluate(({ x, y }) => window.__pvu.sim.motes.push({ id: 7777, kind: "light", x, y, vx: 0, vy: 0, landY: y, life: 30, value: 1 }), { x: cellX(col) + 15, y: cellY(row) + 17 });
  if (touch) await tapCanvas(cellX(col) + 15, cellY(row) + 17);
  else {
    // cursor starts at (2, 2): first press shows it; move to the mote's cell
    await page.keyboard.press("ArrowRight");
    const cur = await sim(page, "e.cursor");
    for (let i = cur.row; i < row; i++) await page.keyboard.press("ArrowDown");
    for (let i = cur.row; i > row; i--) await page.keyboard.press("ArrowUp");
    for (let i = cur.col; i < col; i++) await page.keyboard.press("ArrowRight");
  }
  await page.waitForTimeout(100);
  const caught = await sim(page, "!s.motes.some((m) => m.id === 7777) && s.stats.light");
  if (!caught) problems.push("sunlight mote was not caught");
  else notes.push(`caught sunlight (light ${light0} → ${await sim(page, "s.store.light")})`);

  // --- Photosynthesis makes glucose
  const made0 = await sim(page, "s.stats.glucoseMade");
  const glu0 = await sim(page, "s.glucose");
  await page.evaluate(() => { const s = window.__pvu.sim; s.store.light = Math.max(1, s.store.light); s.store.water = Math.max(1, s.store.water); s.store.co2 = Math.max(1, s.store.co2); });
  await page.waitForTimeout(1500);
  const made1 = await sim(page, "s.stats.glucoseMade");
  const glu1 = await sim(page, "s.glucose");
  if (made1 <= made0 || glu1 <= glu0) problems.push(`glucose did not rise (${glu0} → ${glu1})`);
  else notes.push(`glucose ${glu0} → ${glu1}`);
  const hudGlucose = Number((await page.locator(".pvu-hud .val.y").innerText()).trim());
  if (Math.abs(hudGlucose - glu1) > 30) problems.push(`HUD glucose ${hudGlucose} vs sim ${glu1}`);

  // --- Unlock a defender with its question
  if (touch) await page.locator(".pvu-card", { hasText: g === "K" ? "Leaf" : "Sunleaf" }).first().tap();
  else await page.keyboard.press("q");
  await waitFor(page, () => !!document.querySelector(".pvu-panel.card"));
  const cardStd = (await page.locator(".pvu-panel.card .pvu-tag.std").innerText()).split(" · ")[0].trim();
  if (CODE_FOR[g] && !CODE_FOR[g].test(cardStd)) problems.push(`grade ${g} card question has standard ${cardStd}`);
  const prompt = await page.locator(".pvu-panel.card .pvu-prompt").innerText();
  notes.push(`card Q [${cardStd}] "${prompt.slice(0, 50)}"`);
  const ans = await page.evaluate(() => {
    const btns = [...document.querySelectorAll(".pvu-panel .pvu-btn")];
    return btns.length;
  });
  if (ans !== 4) problems.push(`card question shows ${ans} answers`);
  // Find the right answer from the engine-less DOM: try key for keyboard (we don't know which is right; pick A then check)
  if (touch) await page.locator(".pvu-panel .pvu-btn").nth(1).tap();
  else await page.keyboard.press("2");
  await waitFor(page, () => !!document.querySelector(".pvu-feedback"));
  const verdict = await page.locator(".pvu-feedback .verdict").innerText();
  notes.push(`card answer: ${verdict.slice(0, 22)}`);
  if (touch) await page.locator(".pvu-panel .pvu-cta").tap();
  else await page.keyboard.press("Enter");
  await waitFor(page, () => !document.querySelector(".pvu-panel.card") && window.__pvu.sim.learned.has("sunleaf"));
  // Second card by letter key (keyboard) or tap, answered with a letter / a click
  if (!touch) {
    await page.keyboard.press("w");
    await waitFor(page, () => !!document.querySelector(".pvu-panel.card"));
    await page.keyboard.press("c");
    await waitFor(page, () => !!document.querySelector(".pvu-feedback"));
    await page.locator(".pvu-panel .pvu-cta").click();
    await page.keyboard.press("e");
    await waitFor(page, () => !!document.querySelector(".pvu-panel.card"));
    await page.locator(".pvu-panel .pvu-btn").nth(3).click();
    await waitFor(page, () => !!document.querySelector(".pvu-feedback"));
    await page.keyboard.press(" ");
    await waitFor(page, () => !document.querySelector(".pvu-panel.card"));
    const learned = await sim(page, "s.learned.size");
    if (learned !== 3) problems.push(`expected 3 learned cards, got ${learned}`);
  }

  // --- Plant it
  await page.evaluate(() => { const s = window.__pvu.sim; s.glucose = Math.max(s.glucose, 400); s.cooldown = {}; });
  const plants0 = await sim(page, "s.plants.length");
  if (touch) {
    // After the question the card is already picked; tapping it again would put it back.
    if ((await sim(page, "e.tool")) !== "sunleaf") await page.locator(".pvu-card", { hasText: g === "K" ? "Leaf" : "Sunleaf" }).first().tap();
    await tapCanvas(cellX(0) + 15, cellY(row) + 17);
  } else {
    await page.keyboard.press("q");
    for (let i = 0; i < 9; i++) await page.keyboard.press("ArrowLeft");
    await page.keyboard.press(" ");
    await page.keyboard.press("w");
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("Enter");
  }
  await page.waitForTimeout(100);
  const planted = (await sim(page, "s.plants.length")) - plants0;
  if (planted < 1) problems.push("could not plant a defender");
  else notes.push(`planted ${planted}`);
  // Dig up (keyboard X) / shovel card (touch)
  if (!touch) {
    await page.keyboard.press("x");
    const after = await sim(page, "s.plants.length");
    if (after !== plants0 + planted - 1) problems.push("X did not dig up the plant under the cursor");
    await page.keyboard.press("w");
    await page.keyboard.press(" ");
  }

  // --- A wave: undead walk in; one reaches the cart, one the greenhouse
  await page.evaluate(() => { const s = window.__pvu.sim; s.phaseT = 0.05; });
  await waitFor(page, () => window.__pvu.sim.phase === "wave");
  const lane = await sim(page, "s.lanes[0]");
  const hearts0 = await sim(page, "s.hearts");
  await page.evaluate((lane) => { const s = window.__pvu.sim; s.spawn("grumbones", lane, 27); }, lane);
  await page.waitForTimeout(400);
  const cart = await sim(page, `s.carts.find((c) => c.row === ${lane}).state`);
  if (cart === "ready") problems.push("gnome cart did not roll");
  await page.waitForTimeout(1200);
  await page.evaluate((lane) => { const s = window.__pvu.sim; s.spawn("rotling", lane, 6); }, lane);
  await waitFor(page, (h) => window.__pvu.sim.hearts < h, hearts0);
  notes.push(`cart ${cart}; hearts ${hearts0} → ${await sim(page, "s.hearts")}`);
  // Let real undead walk a bit, then clear the wave.
  await page.evaluate(() => (window.__pvu.timeScale = 6));
  await waitFor(page, () => window.__pvu.sim.spawned > 0, null, 15000);
  await page.waitForTimeout(800);
  await page.evaluate(() => { window.__pvu.timeScale = 1; window.__pvu.sim.debugClearWave(); });
  await waitFor(page, () => !!document.querySelector(".pvu-panel.checkpoint"));
  const cpStd = (await page.locator(".pvu-panel.checkpoint .pvu-tag.std").innerText()).split(" · ")[0].trim();
  notes.push(`checkpoint [${cpStd}]`);
  if (touch) await page.locator(".pvu-panel .pvu-btn").nth(0).tap();
  else await page.keyboard.press("a");
  await waitFor(page, () => !!document.querySelector(".pvu-feedback"));
  const cpText = await page.locator(".pvu-feedback").innerText();
  if (cpText.length < 20) problems.push("checkpoint explanation missing");
  if (touch) await page.locator(".pvu-panel .pvu-cta").tap();
  else await page.keyboard.press("Enter");
  await waitFor(page, () => !document.querySelector(".pvu-panel.checkpoint") && window.__pvu.sim.phase === "prewave");
  notes.push(`wave ${await sim(page, "s.wave")} next`);

  // Pause / resume via toolbar
  await tap(page.locator(".pvu-tools button", { hasText: "PAUSE" }));
  if (!(await sim(page, "e.paused"))) problems.push("pause did not pause");
  await tap(page.locator(".pvu-tools button", { hasText: "RESUME" }));

  // Layout again with the game running
  const l2 = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, sh: document.documentElement.scrollHeight, iw: innerWidth, ih: innerHeight }));
  if (l2.sw > l2.iw || l2.sh > l2.ih + 1) problems.push(`scroll during play ${l2.sw}x${l2.sh} vs ${l2.iw}x${l2.ih}`);

  // --- Lose the last heart: mission report
  await page.evaluate(() => {
    const s = window.__pvu.sim;
    s.hearts = 1;
    s.carts.forEach((c) => (c.state = "gone"));
    s.spawn("grumbones", s.lanes[0], 5);
  });
  await waitFor(page, () => !!document.querySelector(".pvu-report") || /MISSION REPORT/.test(document.body.innerText));
  const report = await page.locator(".pvu-panel").innerText();
  if (!/MISSION REPORT/.test(report)) problems.push("no mission report");
  if (!/Practice next/.test(report)) problems.push("report has no practice-next line");
  if (!/Photosynthesis made/.test(report)) problems.push("report has no photosynthesis summary");
  const rows = await page.locator(".pvu-report tbody tr").count();
  if (rows < 1) problems.push("report has no standards rows");
  notes.push(`report rows ${rows}`);
  await tap(page.locator(".pvu-cta", { hasText: "Play again" }));
  await waitFor(page, () => window.__pvu.playing && window.__pvu.sim.level === 1);

  if (errors.length) problems.push(...errors.map((e) => `page error: ${e}`));
  await ctx.close();
  return { grade: grade || "(picker→4)", mode, problems, notes };
}

async function screenshot(browser) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();
  await page.goto(`${BASE}?grade=3&debug`, { waitUntil: "load" });
  await page.waitForFunction(() => !!window.__pvu);
  await page.locator(".pvu-cta", { hasText: "Start" }).click();
  await page.evaluate(() => {
    const e = window.__pvu, s = e.sim;
    s.newGame(1, 42);
    s.available = ["sunleaf", "slinger", "rootknot", "thorn", "stem", "pollen", "berry", "frond", "stoma", "chloro"];
    s.glucose = 9999;
    for (const k of s.available) s.learn(k, true);
    const put = (k, c, r) => { s.cooldown[k] = 0; s.plant(k, c, r); };
    put("sunleaf", 0, 0); put("slinger", 1, 0); put("slinger", 2, 0);
    put("sunleaf", 0, 1); put("stem", 1, 1); put("slinger", 2, 1); put("rootknot", 4, 1);
    put("chloro", 0, 2); put("pollen", 1, 2); put("slinger", 2, 2); put("thorn", 5, 2);
    put("sunleaf", 0, 3); put("frond", 1, 3); put("berry", 5, 3);
    put("stoma", 0, 4); put("slinger", 1, 4); put("rootknot", 3, 4);
    s.glucose = 175;
    s.store = { light: 2, water: 3, co2: 2 };
    s.phase = "wave"; s.queue = [{ t: 999, kind: "grumbones", row: 0 }]; s.waveTotal = 12; s.spawned = 6;
    s.spawn("grumbones", 0, 222); s.spawn("rotling", 1, 262); s.spawn("stump", 2, 236); s.spawn("frostwraith", 3, 252);
    s.spawn("blightbug", 4, 268); s.spawn("blightbug", 4, 280); s.spawn("shade", 1, 300); s.spawn("grumbones", 4, 296);
    for (const u of s.undead) u.speed *= 0.4;
    s.motes.push({ id: 5001, kind: "light", x: 128, y: 70, vx: 0, vy: 0, landY: 70, life: 99, value: 1 });
    s.motes.push({ id: 5002, kind: "co2", x: 170, y: 150, vx: -2, vy: 0, landY: NaN, life: 99, value: 2 });
  });
  await page.waitForTimeout(2200);
  await page.evaluate(() => (window.__pvu.banner = null));
  await page.waitForTimeout(50);
  const data = await page.evaluate(() => {
    const src = document.querySelector("canvas");
    const c = document.createElement("canvas");
    c.width = 640; c.height = 400;
    const g = c.getContext("2d");
    g.imageSmoothingEnabled = false;
    g.drawImage(src, 0, 0, 640, 400);
    return c.toDataURL("image/png").split(",")[1];
  });
  fs.mkdirSync(path.dirname(SHOT), { recursive: true });
  fs.writeFileSync(SHOT, Buffer.from(data, "base64"));
  await ctx.close();
  console.log(`screenshot → ${SHOT}`);
}

(async () => {
  const browser = await chromium.launch();
  let bad = 0;
  if (SHOT) await screenshot(browser);
  for (const g of GRADES) {
    for (const mode of ["keys", "touch", "portrait"]) {
      const r = await run(browser, g, mode);
      bad += r.problems.length;
      console.log(`${r.problems.length ? "✘" : "✔"} grade ${r.grade} ${mode}: ${r.notes.join(" · ")}`);
      r.problems.forEach((p) => console.log(`    PROBLEM: ${p}`));
    }
  }
  const r = await run(browser, "", "keys");
  bad += r.problems.length;
  console.log(`${r.problems.length ? "✘" : "✔"} grade ${r.grade} keys: ${r.notes.join(" · ")}`);
  r.problems.forEach((p) => console.log(`    PROBLEM: ${p}`));
  await browser.close();
  console.log(bad ? `\n${bad} problem(s)` : "\nAll playtests passed.");
  process.exit(bad ? 1 : 0);
})();
