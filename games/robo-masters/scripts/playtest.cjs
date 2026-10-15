/*
 * Automated playtest (dev only). Needs the built game served at /robo-masters/ with the arcade's
 * /fonts/ next to it, and a global Playwright (Chromium):
 *   npm run build
 *   (serve a folder holding robo-masters -> dist and fonts -> ../../site/fonts on port 8843, or set BASE)
 *   node scripts/playtest.cjs        (SHOT=../../site/img/robo-masters.png saves a 640x400 boss-fight picture)
 * For grades 3 and 8 on a 1280x800 desktop with the keyboard: the title (grade badge, font, no sideways
 * scroll), stage select (8 Robo Masters + the locked citadel, arrow keys), a stage played with the keys
 * (walk, jump, beam), the boss (reached with the ?debug hook), its reboot panel opened by beaming, a wrong
 * answer (blocked: boss HP, lives and energy unchanged) and right answers (HP goes down) until the robot is
 * rebooted, the power-earned screen, the power on stage select and in the save, and the power used in the
 * next stage. MATH only: every tile and every question is math (an ELA robot asks math).
 * Static Citadel: with all eight rebooted it opens, Lord Static mixes subjects, and the victory screen shows.
 * Touch on a 390x844 phone (and 360px): the pad shows, ◀ ▶ JUMP BEAM move and fire, an answer is tapped,
 * and nothing scrolls sideways. No console errors and no requests leave the site.
 */
const path = require("path");
const fs = require("fs");
const { execSync } = require("child_process");
const { chromium } = require(path.join(execSync("npm root -g").toString().trim(), "playwright"));

const BASE = process.env.BASE || "http://127.0.0.1:8843/robo-masters/";
const ORIGIN = new URL(BASE).origin + "/";
const SHOT = process.env.SHOT;

const sim = (page) =>
  page.evaluate(() => {
    const s = window.__rm && window.__rm.sim && window.__rm.sim.s;
    if (!s) return null;
    return {
      mode: s.mode, x: s.p.x, y: s.p.y, lives: s.lives, energy: s.energy, power: s.power, powers: s.powers, shots: s.shots.filter((x) => x.from === "hero").length,
      hp: s.fight ? s.fight.hp : null, panel: s.boss ? s.boss.panel : null, sel: window.__rm.sim.selectedPower,
    };
  });
const quiz = (page) => page.evaluate(() => (window.__rmQuiz ? { answer: window.__rmQuiz.q.answer, picked: window.__rmQuiz.picked, subject: window.__rmQuiz.q.subject, standard: window.__rmQuiz.q.standard, prompt: window.__rmQuiz.q.prompt, from: window.__rmQuiz.from } : null));
const noSideways = (page) => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth && document.body.scrollWidth <= window.innerWidth);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function waitFor(fn, ms = 8000, step = 100) {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    const v = await fn();
    if (v) return v;
    await sleep(step);
  }
  return null;
}

function watch(page) {
  const errors = [];
  const external = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  page.on("request", (r) => {
    if (!r.url().startsWith(ORIGIN) && !r.url().startsWith("data:")) external.push(r.url());
  });
  return { errors, external };
}

/** Beams the boss until its panel opens (falls back to the debug hook after a while). */
async function openPanel(page, problems, label) {
  const end = Date.now() + 9000;
  let opened = false;
  while (Date.now() < end) {
    if (await quiz(page)) {
      opened = true;
      break;
    }
    const s = await sim(page);
    if (s && s.mode === "boss") {
      const b = await page.evaluate(() => window.__rm.sim.s.boss.x);
      const key = b > s.x ? "ArrowRight" : "ArrowLeft";
      await page.keyboard.down(key);
      await sleep(60);
      await page.keyboard.up(key);
      await page.keyboard.down("z");
      await sleep(250);
      await page.keyboard.up("z");
    } else await sleep(150);
  }
  if (!opened) {
    problems.push(`${label}: beaming did not open the reboot panel; used the debug hook`);
    await page.evaluate(() => window.__rm.forceQuestion());
    await waitFor(() => quiz(page), 3000);
  }
  return opened;
}

async function desktop(browser, grade) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();
  const w = watch(page);
  const problems = [];
  await page.goto(`${BASE}?grade=${grade}&debug`, { waitUntil: "load" });
  await page.waitForFunction(() => !!window.__rm);
  const badge = await page.locator(".rm-gradebadge").innerText().catch(() => "");
  if (!badge.includes(`GRADE ${grade}`)) problems.push(`badge "${badge}"`);
  if ((await page.locator(".rm-grade").count()) !== 0) problems.push("grade picker shown although ?grade= was given");
  const fontsOk = await page.evaluate(async () => { await document.fonts.ready; return document.fonts.check('12px "Press Start 2P"'); });
  if (!fontsOk) problems.push("Press Start 2P font not loaded from /fonts/");
  if (!(await noSideways(page))) problems.push("sideways scroll on the title");

  // Stage select
  await page.keyboard.press("Enter");
  await page.waitForSelector(".rm-grid");
  const tiles = await page.locator(".rm-tile").count();
  if (tiles !== 9) problems.push(`stage select has ${tiles} tiles`);
  const robots = await page.locator(".rm-tile[data-beaten]").count();
  if (robots !== 8) problems.push(`stage select has ${robots} Robo Masters`);
  if ((await page.locator('.rm-tile.center.locked').count()) !== 1) problems.push("the citadel should start locked");
  const subjText = await page.locator('.rm-tile[data-stage="syntaxor"] .subj').innerText();
  if (!subjText.includes("ELA")) problems.push(`Syntaxor should ask ELA in MIXED: "${subjText}"`);
  // Arrow keys: from SPLITZ one step right is IGNEOUS REX.
  await page.keyboard.press("ArrowRight");
  const focused = await page.evaluate(() => document.activeElement && document.activeElement.getAttribute("data-stage"));
  if (focused !== "igneous") problems.push(`arrow right focused ${focused}`);
  await page.keyboard.press("Enter");
  await waitFor(async () => (await sim(page))?.mode === "play", 4000);

  // Play a little with the keys.
  await sleep(300);
  const s0 = await sim(page);
  await page.keyboard.down("ArrowUp");
  const jumped = await waitFor(async () => (await sim(page)).y < s0.y - 8, 600, 20);
  await page.keyboard.up("ArrowUp");
  if (!jumped) problems.push("jump did not leave the ground");
  await sleep(700);
  await page.keyboard.press("z");
  const fired = await waitFor(async () => (await sim(page)).shots > 0, 300, 15);
  if (!fired) problems.push("Z did not fire the reboot beam");
  await page.keyboard.down("ArrowRight");
  await sleep(1200);
  await page.keyboard.up("ArrowRight");
  const s1 = await sim(page);
  if (!(s1.x > s0.x + 40)) problems.push(`walking right did not move (${s0.x} -> ${s1.x})`);
  if (!(await noSideways(page))) problems.push("sideways scroll while playing");

  // The boss (debug hook to skip the run).
  await page.evaluate(() => window.__rm.warpToBoss());
  const say = await waitFor(() => page.locator(".rm-say").isVisible().catch(() => false), 3000);
  if (!say) problems.push("no boss intro line");
  await waitFor(async () => (await sim(page))?.mode === "boss", 4000);
  const before = await sim(page);
  await openPanel(page, problems, `grade ${grade} first panel`);
  let q = await quiz(page);
  if (!q) {
    problems.push("no question");
  } else {
    if (q.subject !== "science") problems.push(`Igneous Rex asked ${q.subject} in MIXED`);
    // Wrong answer with a number key: blocked, nothing lost.
    const wrong = (q.answer + 1) % 4;
    await page.keyboard.press(String(wrong + 1));
    await sleep(200);
    const after = await sim(page);
    const verdict = await page.locator(".rm-quiz .verdict").innerText().catch(() => "");
    if (!verdict.includes("BLOCKED")) problems.push(`wrong verdict "${verdict}"`);
    if (after.hp !== before.hp || after.lives !== before.lives) problems.push(`a wrong answer changed hp/lives ${before.hp}/${before.lives} -> ${after.hp}/${after.lives}`);
    if (!(await page.locator(".rm-quiz .why").innerText()).length) problems.push("no explanation after a wrong answer");
    await page.keyboard.press("Enter");
    await sleep(200);
    // Right answers with letter keys until rebooted.
    let rounds = 0;
    while (rounds++ < 12) {
      const s = await sim(page);
      if (!s || s.mode === "clear" || s.mode === "bossDown") break;
      if (!(await quiz(page))) {
        if (rounds === 1) await openPanel(page, problems, `grade ${grade} second panel`);
        else await page.evaluate(() => window.__rm.forceQuestion());
        await waitFor(() => quiz(page), 2000);
      }
      q = await quiz(page);
      if (!q) break;
      const hp0 = (await sim(page)).hp;
      await page.keyboard.press("ABCD"[q.answer].toLowerCase());
      await sleep(150);
      const hp1 = (await sim(page)).hp;
      if (!(hp1 < hp0)) problems.push(`a right answer did not lower HP (${hp0} -> ${hp1})`);
      const v = await page.locator(".rm-quiz .verdict").innerText().catch(() => "");
      if (!v.includes("✔")) problems.push(`right verdict "${v}"`);
      await page.keyboard.press("Enter");
      await sleep(150);
    }
  }
  const cleared = await waitFor(() => page.locator("[data-power]").isVisible().catch(() => false), 6000);
  if (!cleared) problems.push("no power-earned screen after the reboot");
  else {
    const t = await page.locator("[data-power]").innerText();
    if (!t.includes("MAGMA HOP")) problems.push(`earned "${t}"`);
  }
  if (!(await noSideways(page))) problems.push("sideways scroll on the power screen");
  await page.keyboard.press("Enter");
  await page.waitForSelector(".rm-grid");
  const tile = page.locator('.rm-tile[data-stage="igneous"]');
  if ((await tile.getAttribute("data-beaten")) !== "1") problems.push("Igneous Rex not marked rebooted on stage select");
  if (!(await tile.innerText()).includes("Magma Hop")) problems.push("Magma Hop not shown on stage select");
  const saved = await page.evaluate(() => localStorage.getItem("arcade.robo-masters.save.v1"));
  if (!saved || !saved.includes("igneous")) problems.push(`save: ${saved}`);
  const keys = await page.evaluate(() => Object.keys(localStorage));
  const strays = keys.filter((k) => !k.startsWith("arcade."));
  if (strays.length) problems.push(`storage keys outside arcade.*: ${strays}`);

  // The power works in another stage; it survives a reload.
  await page.reload({ waitUntil: "load" });
  await page.waitForFunction(() => !!window.__rm);
  await page.keyboard.press("Enter");
  await page.waitForSelector(".rm-grid");
  if ((await page.locator('.rm-tile[data-stage="igneous"]').getAttribute("data-beaten")) !== "1") problems.push("the save did not survive a reload");
  await page.locator('.rm-tile[data-stage="splitz"]').click();
  await waitFor(async () => (await sim(page))?.mode === "play", 4000);
  await sleep(300);
  const p0 = await sim(page);
  if (p0.sel !== "magma") problems.push(`selected power in the next stage: ${p0.sel}`);
  const hudPower = await page.locator(".rm-hudpower .val").innerText();
  if (!hudPower.toLowerCase().includes("magma hop")) problems.push(`HUD power "${hudPower}"`);
  await page.keyboard.press("x");
  await sleep(150);
  const p1 = await sim(page);
  if (!(p1.power < p0.power) || !(p1.y < p0.y - 10)) problems.push(`X did not use Magma Hop (power ${p0.power}->${p1.power}, y ${p0.y}->${p1.y})`);

  // Pause with Esc
  await sleep(600);
  await page.keyboard.press("Escape");
  if (!(await page.locator("text=PAUSED").isVisible())) problems.push("Esc did not pause");
  await page.keyboard.press("Escape");

  if (SHOT && grade === "8") await screenshot(page);
  await ctx.close();
  return { problems, errors: w.errors, external: w.external };
}

/** 640x400 picture of a boss fight (the canvas itself is 640x400): Rivet fires the Fraction Splitter at Splitz. */
async function screenshot(page) {
  await page.evaluate(() => window.__rm.engine.startStage("splitz", "g68", ["splitter", "magma"]));
  await sleep(300);
  await page.evaluate(() => window.__rm.sim.warpToBoss());
  await waitFor(async () => (await sim(page))?.mode === "boss", 4000);
  await page.keyboard.down("ArrowRight");
  await sleep(350);
  await page.keyboard.up("ArrowRight");
  await page.keyboard.press("z");
  await sleep(120);
  await page.keyboard.down("ArrowUp");
  await sleep(200);
  await page.keyboard.press("x");
  await sleep(260);
  await page.keyboard.up("ArrowUp");
  const data = await page.evaluate(() => document.querySelector("canvas").toDataURL("image/png"));
  fs.writeFileSync(SHOT, Buffer.from(data.split(",")[1], "base64"));
  console.log(`saved ${SHOT} (${fs.statSync(SHOT).size} bytes)`);
}

async function mathOnly(browser) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();
  const w = watch(page);
  const problems = [];
  await page.goto(`${BASE}?grade=5&debug`, { waitUntil: "load" });
  await page.waitForFunction(() => !!window.__rm);
  await page.locator('[data-subject="math"]').click();
  if (!(await page.locator(".rm-focusline").innerText()).includes("Math")) problems.push("MATH line missing");
  await page.locator(".rm-cta.big").click();
  await page.waitForSelector(".rm-grid");
  const subj = await page.locator(".rm-tile[data-beaten] .subj").allInnerTexts();
  if (subj.length !== 8 || !subj.every((t) => t.startsWith("MATH"))) problems.push(`MATH-only tiles: ${subj.join(" | ")}`);
  const distinct = new Set(subj).size;
  if (distinct < 2) problems.push("MATH-only robots should spread over math topics");
  await page.locator('.rm-tile[data-stage="syntaxor"]').click();
  await waitFor(async () => (await sim(page))?.mode === "play", 4000);
  await page.evaluate(() => window.__rm.warpToBoss());
  await waitFor(async () => (await sim(page))?.mode === "boss", 4000);
  for (let i = 0; i < 3; i++) {
    await page.evaluate(() => window.__rm.forceQuestion());
    const q = await waitFor(() => quiz(page), 2000);
    if (!q || q.subject !== "math") problems.push(`MATH-only Syntaxor asked ${q && q.subject} (${q && q.standard})`);
    if (!q) break;
    await page.keyboard.press(String(((q.answer + 1) % 4) + 1));
    await sleep(100);
    await page.keyboard.press("Enter");
    await sleep(100);
  }
  const saved = await page.evaluate(() => localStorage.getItem("arcade.robo-masters.subject"));
  if (saved !== "math") problems.push(`subject not saved: ${saved}`);
  // ?topic= deep link
  await page.goto(`${BASE}?grade=4&topic=fractions&debug`, { waitUntil: "load" });
  await page.waitForFunction(() => !!window.__rm);
  if ((await page.locator('[data-topic="fractions"][aria-checked="true"]').count()) !== 1) problems.push("?topic=fractions not preselected");
  await ctx.close();
  return { problems, errors: w.errors, external: w.external };
}

/** All eight rebooted: the citadel opens, Lord Static asks every robot's subject, and the victory screen shows. */
async function citadel(browser) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();
  const w = watch(page);
  const problems = [];
  await page.goto(`${BASE}?grade=6&debug`, { waitUntil: "load" });
  await page.evaluate(() => localStorage.setItem("arcade.robo-masters.save.v1", JSON.stringify({ beaten: ["splitz", "igneous", "syntaxor", "meridian", "cumulo", "polarix", "chlorophil", "clio"], fortress: false })));
  await page.reload({ waitUntil: "load" });
  await page.waitForFunction(() => !!window.__rm);
  await page.keyboard.press("Enter");
  await page.waitForSelector(".rm-grid");
  if ((await page.locator(".rm-tile.center.open").count()) !== 1) problems.push("the citadel did not open after eight reboots");
  await page.locator('.rm-tile[data-stage="fortress"]').click();
  await waitFor(async () => (await sim(page))?.mode === "play", 4000);
  const p = await sim(page);
  if (p.powers.length !== 8) problems.push(`all eight powers should come along (${p.powers})`);
  await page.evaluate(() => window.__rm.warpToBoss());
  await waitFor(async () => (await sim(page))?.mode === "boss", 4000);
  const subjects = new Set();
  for (let i = 0; i < 20; i++) {
    const s = await sim(page);
    if (!s || s.mode === "bossDown" || s.mode === "clear") break;
    await page.evaluate(() => window.__rm.forceQuestion());
    const q = await waitFor(() => quiz(page), 2000);
    if (!q) break;
    subjects.add(q.subject);
    await page.keyboard.press(String(q.answer + 1));
    await sleep(100);
    await page.keyboard.press("Enter");
    await sleep(100);
  }
  if (subjects.size < 3) problems.push(`Lord Static should mix subjects, asked ${[...subjects]}`);
  const won = await waitFor(() => page.locator("text=THE STATIC CITADEL IS CLEARED!").isVisible().catch(() => false), 6000);
  if (!won) problems.push("no victory screen");
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("arcade.robo-masters.save.v1")).fortress);
  if (saved !== true) problems.push("citadel clear not saved");
  await ctx.close();
  return { problems, errors: w.errors, external: w.external };
}

async function phone(browser, grade, width) {
  const ctx = await browser.newContext({ viewport: { width, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  const w = watch(page);
  const problems = [];
  await page.goto(`${BASE}?grade=${grade}&debug`, { waitUntil: "load" });
  await page.waitForFunction(() => !!window.__rm);
  if (!(await noSideways(page))) problems.push(`${width}px: sideways scroll on the title`);
  await page.locator(".rm-cta.big").tap();
  await page.waitForSelector(".rm-grid");
  if (!(await noSideways(page))) problems.push(`${width}px: sideways scroll on stage select`);
  await page.locator('.rm-tile[data-stage="meridian"]').tap();
  await waitFor(async () => (await sim(page))?.mode === "play", 4000);
  await sleep(200);
  if ((await page.locator(".rm-controls.show").count()) !== 1) problems.push(`${width}px: touch pad not shown`);
  for (const sel of ['[aria-label="Move left"]', '[aria-label="Move right"]', '[aria-label="Jump"]', '[aria-label="Reboot beam"]', '[aria-label="Use power"]']) {
    const box = await page.locator(sel).boundingBox();
    if (!box || box.x < 0 || box.x + box.width > width + 0.5) problems.push(`${width}px: ${sel} off screen`);
  }
  const hold = async (label, ms) => {
    const el = page.locator(`[aria-label="${label}"]`);
    await el.dispatchEvent("pointerdown", { pointerId: 7, pointerType: "touch", isPrimary: true });
    await sleep(ms);
    await el.dispatchEvent("pointerup", { pointerId: 7, pointerType: "touch", isPrimary: true });
  };
  const s0 = await sim(page);
  await hold("Move right", 900);
  const s1 = await sim(page);
  if (!(s1.x > s0.x + 30)) problems.push(`${width}px: ▶ did not move (${s0.x} -> ${s1.x})`);
  const jumpP = hold("Jump", 250);
  const up = await waitFor(async () => (await sim(page)).y < s1.y - 5, 600, 30);
  await jumpP;
  if (!up) problems.push(`${width}px: JUMP did not jump`);
  await hold("Reboot beam", 120);
  await sleep(30);
  if (!((await sim(page)).shots > 0) && !(await waitFor(async () => (await sim(page)).shots > 0, 300, 20))) problems.push(`${width}px: BEAM did not fire`);
  if (!(await noSideways(page))) problems.push(`${width}px: sideways scroll while playing`);
  await page.evaluate(() => window.__rm.warpToBoss());
  await waitFor(async () => (await sim(page))?.mode === "boss", 4000);
  await page.evaluate(() => window.__rm.forceQuestion());
  const q = await waitFor(() => quiz(page), 2000);
  if (!q) problems.push(`${width}px: no question`);
  else {
    if ((await page.locator(".rm-controls.show").count()) !== 0) problems.push(`${width}px: pad should hide during a question`);
    await page.locator(".rm-quiz .opt").nth(q.answer).tap();
    await sleep(150);
    if (!(await page.locator(".rm-quiz .verdict").innerText()).includes("✔")) problems.push(`${width}px: tapping the right answer`);
    if (!(await noSideways(page))) problems.push(`${width}px: sideways scroll with the question open`);
    await page.locator(".rm-quiz .rm-cta").tap();
    await sleep(150);
    if (await quiz(page)) problems.push(`${width}px: Next did not close the question`);
  }
  await ctx.close();
  return { problems, errors: w.errors, external: w.external };
}

(async () => {
  const browser = await chromium.launch();
  const results = [];
  try {
    for (const g of ["3", "8"]) results.push([`desktop grade ${g}`, await desktop(browser, g)]);
    results.push(["MATH only", await mathOnly(browser)]);
    results.push(["Static Citadel", await citadel(browser)]);
    results.push(["phone 390 grade 3", await phone(browser, "3", 390)]);
    results.push(["phone 390 grade 8", await phone(browser, "8", 390)]);
    results.push(["phone 360 grade 3", await phone(browser, "3", 360)]);
  } finally {
    await browser.close();
  }
  let bad = 0;
  for (const [name, r] of results) {
    const issues = [...r.problems, ...r.errors.map((e) => `console: ${e}`), ...r.external.map((u) => `external request: ${u}`)];
    console.log(`${issues.length ? "✘" : "✔"} ${name}${issues.length ? "\n   - " + issues.join("\n   - ") : ""}`);
    bad += issues.length;
  }
  if (bad) {
    console.error(`${bad} problem(s)`);
    process.exit(1);
  }
  console.log("Playtest passed.");
})();
