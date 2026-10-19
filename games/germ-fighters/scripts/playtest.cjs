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
 * Quiz Bots and power-ups (grades 3 and 8): play into a stage, beam a Quiz Bot and answer right (energy up, a
 * power-up chip in the HUD) and wrong (nothing lost, the barrier still goes), use the Phase Cloak (zaps and
 * mini-bots pass through) and Spring Boots (debug hook; a much higher jump onto the sky ledge), clear the last
 * Quiz Bot, walk into the boss arena and reboot the boss; the cleared screen counts the Quiz Bots.
 * Touch on a 390x844 phone (and 360px): the pad shows, ◀ ▶ JUMP BEAM move and fire, a Quiz Bot is beamed and
 * answered by tapping, an answer is tapped, and nothing scrolls sideways. No console errors and no requests
 * leave the site.
 */
const path = require("path");
const fs = require("fs");
const { execSync } = require("child_process");
const { chromium } = require(path.join(execSync("npm root -g").toString().trim(), "playwright"));

const BASE = process.env.BASE || "http://127.0.0.1:8843/robo-masters/";
const ONLY = process.env.ONLY ? process.env.ONLY.split(",") : null;
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
const quiz = (page) => page.evaluate(() => (window.__rmQuiz ? { kind: window.__rmQuiz.kind, n: window.__rmQuiz.n, answer: window.__rmQuiz.q.answer, picked: window.__rmQuiz.picked, subject: window.__rmQuiz.q.subject, standard: window.__rmQuiz.q.standard, prompt: window.__rmQuiz.q.prompt, from: window.__rmQuiz.from } : null));
/** Debug: puts Rivet on the ground a little before Quiz Bot i (or at x on the ground at feet y). */
const placeAt = (page, x, feetY) =>
  page.evaluate(([x, feetY]) => {
    const sim = window.__rm.sim;
    Object.assign(sim.s.p, { x, y: feetY - 20, vx: 0, vy: 0, onMover: -1, inv: 0 });
  }, [x, feetY]);
const toQuizBot = (page, i, back = 70) =>
  page.evaluate(([i, back]) => {
    const sim = window.__rm.sim;
    const q = sim.level.quizBots[i];
    sim.s.enemies.forEach((e) => { if (Math.abs(e.x - q.x) < 260) e.dead = true; });
    Object.assign(sim.s.p, { x: q.barrierX - back, y: q.y + 30 - 20, vx: 0, vy: 0, onMover: -1, facing: 1, inv: 0 });
    return { x: q.x, barrierX: q.barrierX };
  }, [i, back]);
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

/** Quiz Bots, power-ups and the boss at the end of a longer stage. */
async function quizBots(browser, grade) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();
  const w = watch(page);
  const problems = [];
  await page.goto(`${BASE}?grade=${grade}&debug`, { waitUntil: "load" });
  await page.waitForFunction(() => !!window.__rm);
  await page.evaluate(() => localStorage.removeItem("arcade.robo-masters.save.v1"));
  await page.keyboard.press("Enter");
  await page.waitForSelector(".rm-grid");
  await page.locator('.rm-tile[data-stage="splitz"]').click();
  await waitFor(async () => (await sim(page))?.mode === "play", 4000);
  const len = await page.evaluate(() => ({ arena: window.__rm.sim.level.arenaX, qb: window.__rm.sim.level.quizBots.length, cps: window.__rm.sim.level.checkpoints.length }));
  if (len.arena < 3500 || len.qb !== 3 || len.cps < 7) problems.push(`stage shape: ${JSON.stringify(len)}`);
  // Play into the stage with the keys.
  const s0 = await sim(page);
  await page.keyboard.down("ArrowRight");
  for (let i = 0; i < 4; i++) {
    await page.keyboard.press("z");
    await sleep(280);
  }
  await page.keyboard.up("ArrowRight");
  const s1 = await sim(page);
  if (!(s1.x > s0.x + 60)) problems.push(`walking into the stage (${s0.x} -> ${s1.x})`);

  // Quiz Bot 1: answer right.
  await toQuizBot(page, 0);
  await page.evaluate(() => { window.__rm.sim.s.energy = 6; });
  await sleep(100);
  // Walking into the barrier is blocked.
  await page.keyboard.down("ArrowRight");
  await sleep(900);
  await page.keyboard.up("ArrowRight");
  const blocked = await sim(page);
  const qb0 = await page.evaluate(() => window.__rm.sim.level.quizBots[0]);
  if (blocked.x + 12 > qb0.barrierX + 0.5 && !(await quiz(page))) problems.push(`the barrier did not stop Rivet (${blocked.x} vs ${qb0.barrierX})`);
  if (!(await quiz(page))) {
    await page.keyboard.down("z");
    await waitFor(() => quiz(page), 3000, 50);
    await page.keyboard.up("z");
  }
  let q = await quiz(page);
  if (!q || q.kind !== "bot") problems.push(`beaming the Quiz Bot did not ask a Quiz Bot question (${JSON.stringify(q)})`);
  else {
    const head = await page.locator(".rm-quiz .head").innerText();
    if (!head.includes("QUIZ BOT 1/3")) problems.push(`Quiz Bot header "${head}"`);
    if (q.subject !== "math") problems.push(`Splitz's Quiz Bot asked ${q.subject} in MIXED`);
    const e0 = (await sim(page)).energy;
    await page.keyboard.press("ABCD"[q.answer].toLowerCase());
    await sleep(200);
    const v = await page.locator(".rm-quiz .verdict").innerText();
    if (!v.includes("QUIZ BOT REBOOTED") || !v.includes("ENERGY")) problems.push(`Quiz Bot right verdict "${v}"`);
    const e1 = (await sim(page)).energy;
    if (!(e1 >= e0 + 10)) problems.push(`a right Quiz Bot answer should refill energy (${e0} -> ${e1})`);
    await page.keyboard.press("Enter");
    const chip = await waitFor(() => page.locator(".rm-boost").count(), 1500, 50);
    if (!chip) problems.push("no power-up chip in the HUD after the first right Quiz Bot answer");
    else {
      const t = await page.locator(".rm-boost").first().innerText();
      if (!/\d+s/.test(t)) problems.push(`power-up chip has no timer: "${t}"`);
    }
    const b = await page.evaluate(() => Object.entries(window.__rm.sim.s.boosts).filter(([, v]) => v > 0).map(([k]) => k));
    if (b.length !== 1) problems.push(`one power-up should be running: ${b}`);
    await page.keyboard.down("ArrowRight");
    await sleep(700);
    await page.keyboard.up("ArrowRight");
    const past = await sim(page);
    if (!(past.x > qb0.barrierX + 12)) problems.push(`the barrier should be gone (x ${past.x})`);
  }

  // Quiz Bot 2: answer wrong. Nothing lost, the barrier still goes.
  await toQuizBot(page, 1, 50);
  await sleep(100);
  await page.keyboard.down("z");
  await waitFor(() => quiz(page), 3000, 50);
  await page.keyboard.up("z");
  q = await quiz(page);
  if (!q || q.kind !== "bot") problems.push("second Quiz Bot did not ask");
  else {
    const before = await sim(page);
    await page.keyboard.press(String(((q.answer + 1) % 4) + 1));
    await sleep(200);
    const after = await sim(page);
    const v = await page.locator(".rm-quiz .verdict").innerText();
    if (!v.includes("STILL REBOOTS")) problems.push(`Quiz Bot wrong verdict "${v}"`);
    if (after.lives !== before.lives || after.energy < before.energy || after.power < before.power) problems.push(`a wrong Quiz Bot answer cost something ${JSON.stringify(before)} -> ${JSON.stringify(after)}`);
    if (!(await page.locator(".rm-quiz .why").innerText()).length) problems.push("no explanation after a wrong Quiz Bot answer");
    await page.keyboard.press("Enter");
    await sleep(100);
  }

  // Phase Cloak (invisibility): zaps and a mini-bot pass right through.
  await page.evaluate(() => window.__rm.giveBoost("phase"));
  await sleep(150);
  if (!(await page.locator('.rm-boost[data-boost="phase"]').count())) problems.push("Phase Cloak chip not shown");
  const ph0 = await sim(page);
  await page.evaluate(() => {
    const s = window.__rm.sim.s;
    s.enemies.push({ kind: "walker", x: s.p.x, y: s.p.y + 8, w: 14, h: 12, vx: 0, vy: 0, hp: 1, dead: false, t: 0, dir: -1, sx: s.p.x, sy: s.p.y + 8, flash: 0 });
    for (let i = 0; i < 3; i++) s.shots.push({ x: s.p.x + i * 3, y: s.p.y + 4, w: 8, h: 8, vx: 0, vy: 0, grav: 0, life: 40, from: "foe", kind: "zap", delay: 0, floor: "none" });
  });
  await sleep(500);
  const ph1 = await sim(page);
  const hurts = await page.evaluate(() => window.__rm.sim.s.hurts);
  if (ph1.energy < ph0.energy || hurts > 0) problems.push(`Phase Cloak: hurt by a zap/mini-bot (energy ${ph0.energy} -> ${ph1.energy}, hurts ${hurts})`);
  await page.evaluate(() => { const s = window.__rm.sim.s; s.enemies = s.enemies.filter((e) => !(e.kind === "walker" && Math.abs(e.x - s.p.x) < 30)); s.boosts.phase = 0; });

  // Spring Boots: a much higher jump, onto the sky ledge.
  const ledge = await page.evaluate(() => window.__rm.sim.level.skyLedges[0]);
  await placeAt(page, ledge.x - 30, ledge.y + 80);
  await sleep(150);
  const jumpPeak = async () => {
    const y0 = (await sim(page)).y;
    let top = y0;
    await page.keyboard.down("ArrowUp");
    const t0 = Date.now();
    let right = false;
    while (Date.now() - t0 < 1300) {
      const s = await sim(page);
      top = Math.min(top, s.y);
      if (!right && Date.now() - t0 > 60) { await page.keyboard.down("ArrowRight"); right = true; }
      if (right && Date.now() - t0 > 520) { await page.keyboard.up("ArrowRight"); right = null; }
      await sleep(15);
    }
    if (right) await page.keyboard.up("ArrowRight");
    await page.keyboard.up("ArrowUp");
    await sleep(300);
    return y0 - top;
  };
  const plainH = await jumpPeak();
  await placeAt(page, ledge.x - 30, ledge.y + 80);
  await page.evaluate(() => window.__rm.giveBoost("spring"));
  await sleep(150);
  if (!(await page.locator('.rm-boost[data-boost="spring"]').count())) problems.push("Spring Boots chip not shown");
  const springH = await jumpPeak();
  const onLedge = await page.evaluate((ly) => { const p = window.__rm.sim.s.p; return Math.abs(p.y + 20 - ly) < 1 && p.onGround; }, ledge.y);
  if (!(springH > plainH + 30)) problems.push(`Spring Boots jump ${springH.toFixed(0)} px vs normal ${plainH.toFixed(0)} px`);
  if (!onLedge) problems.push("Spring Boots did not land on the sky ledge");

  // Quiz Bot 3, then on to the boss on foot.
  await toQuizBot(page, 2, 50);
  await sleep(100);
  await page.keyboard.down("z");
  await waitFor(() => quiz(page), 3000, 50);
  await page.keyboard.up("z");
  q = await quiz(page);
  if (!q || q.kind !== "bot" || q.n !== 2) problems.push(`third Quiz Bot: ${JSON.stringify(q)}`);
  else {
    await page.locator(".rm-quiz .opt").nth(q.answer).click();
    await sleep(150);
    await page.locator(".rm-quiz .rm-cta").click();
  }
  const door = await page.evaluate(() => ({ x: window.__rm.sim.level.arenaX, y: window.__rm.sim.level.arenaY }));
  await placeAt(page, door.x - 70, door.y);
  await page.keyboard.down("ArrowRight");
  const intro = await waitFor(async () => (await sim(page))?.mode === "bossIntro" || (await sim(page))?.mode === "boss", 4000, 50);
  await page.keyboard.up("ArrowRight");
  if (!intro) problems.push("walking right did not enter the boss arena");
  await waitFor(async () => (await sim(page))?.mode === "boss", 4000);
  let rounds = 0;
  while (rounds++ < 12) {
    const s = await sim(page);
    if (!s || s.mode === "clear" || s.mode === "bossDown") break;
    if (!(await quiz(page))) {
      if (rounds === 1) await openPanel(page, problems, `grade ${grade} quiz-bot stage boss panel`);
      else await page.evaluate(() => window.__rm.forceQuestion());
      await waitFor(() => quiz(page), 2000);
    }
    q = await quiz(page);
    if (!q) break;
    if (q.kind !== "boss") problems.push(`boss panel kind ${q.kind}`);
    await page.keyboard.press(String(q.answer + 1));
    await sleep(120);
    await page.keyboard.press("Enter");
    await sleep(120);
  }
  const cleared = await waitFor(() => page.locator("[data-power]").isVisible().catch(() => false), 6000);
  if (!cleared) problems.push("boss not rebooted");
  else {
    const n = await page.locator("[data-quizbots]").getAttribute("data-quizbots").catch(() => null);
    if (n !== "2") problems.push(`cleared screen Quiz Bots right: ${n} (want 2)`);
  }
  if (!(await noSideways(page))) problems.push("sideways scroll");
  await ctx.close();
  return { problems, errors: w.errors, external: w.external };
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
  // A Quiz Bot, beamed with the touch BEAM button and answered with a tap.
  await toQuizBot(page, 0, 60);
  await sleep(100);
  {
    const el = page.locator('[aria-label="Reboot beam"]');
    await el.dispatchEvent("pointerdown", { pointerId: 8, pointerType: "touch", isPrimary: true });
    await waitFor(() => quiz(page), 3000, 50);
    await el.dispatchEvent("pointerup", { pointerId: 8, pointerType: "touch", isPrimary: true });
  }
  const bq = await quiz(page);
  if (!bq || bq.kind !== "bot") problems.push(`${width}px: BEAM did not open a Quiz Bot question`);
  else {
    await page.locator(".rm-quiz .opt").nth(bq.answer).tap();
    await sleep(150);
    if (!(await page.locator(".rm-quiz .verdict").innerText()).includes("QUIZ BOT REBOOTED")) problems.push(`${width}px: Quiz Bot right verdict`);
    if (!(await noSideways(page))) problems.push(`${width}px: sideways scroll with a Quiz Bot question open`);
    await page.locator(".rm-quiz .rm-cta").tap();
    const chip = await waitFor(() => page.locator(".rm-boost").count(), 1500, 50);
    if (!chip) problems.push(`${width}px: no power-up chip`);
    else {
      const box = await page.locator(".rm-boost").first().boundingBox();
      if (!box || box.x < 0 || box.x + box.width > width + 0.5) problems.push(`${width}px: power-up chip off screen`);
    }
    if (!(await noSideways(page))) problems.push(`${width}px: sideways scroll with a power-up chip`);
  }
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
    const want = (name) => !ONLY || ONLY.some((o) => name.includes(o));
    for (const g of ["3", "8"]) if (want(`desktop grade ${g}`)) results.push([`desktop grade ${g}`, await desktop(browser, g)]);
    for (const g of ["3", "8"]) if (want(`quiz bots grade ${g}`)) results.push([`quiz bots + power-ups grade ${g}`, await quizBots(browser, g)]);
    if (want("MATH only")) results.push(["MATH only", await mathOnly(browser)]);
    if (want("Static Citadel")) results.push(["Static Citadel", await citadel(browser)]);
    if (want("phone 390 grade 3")) results.push(["phone 390 grade 3", await phone(browser, "3", 390)]);
    if (want("phone 390 grade 8")) results.push(["phone 390 grade 8", await phone(browser, "8", 390)]);
    if (want("phone 360 grade 3")) results.push(["phone 360 grade 3", await phone(browser, "3", 360)]);
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
