/*
 * Automated playtest (dev only). Needs the built game served at /germ-fighters/ with the arcade's /fonts/ next to
 * it, and a global Playwright (Chromium):
 *   npm run build
 *   (serve a folder holding germ-fighters -> dist and fonts -> ../../site/fonts on port 8911, or set BASE)
 *   node scripts/playtest.cjs        (SHOT=../../site/img/germ-fighters.png saves a 640x400 Major Virus fight)
 * Grades 2 and 7 on a 1280x800 desktop with the keyboard: the title (grade badge, font, default SCIENCE · Life &
 * health, toolbar on top, no sideways scroll), music only after a gesture, Music/SFX toggles that persist across a
 * reload, the body map (8 zones + the locked Lymph Node, arrow keys), a zone played with the keys (walk, jump,
 * Granule Blast), an Antigen Clue answered right (energy up, a power-up chip) and one answered wrong (nothing lost, the
 * wall still goes), power-ups used (Mucus Shield catches shots, Lymph Leap jumps higher), the stage germ beaten
 * (a wrong answer is blocked, right answers lower HP) with the new-skill screen and the save; then the debug skip
 * to the Major Virus rush: the Rhinovirus card and facts, its own fact questions, beating it, and Influenza
 * dropping in next with its card. Touch on a 390x844 phone (grades 2 and 7) and 360px: the toolbar taps above
 * the title overlay, the pad shows, ◀ ▶ JUMP BLAST work, a clue is hit with a granule and answered by tapping, a boss answer is
 * tapped, and nothing scrolls sideways. No console errors and no requests leave the site.
 */
const path = require("path");
const fs = require("fs");
const { execSync } = require("child_process");
const { chromium } = require(path.join(execSync("npm root -g").toString().trim(), "playwright"));

const BASE = process.env.BASE || "http://127.0.0.1:8911/germ-fighters/";
const ONLY = process.env.ONLY ? process.env.ONLY.split(",") : null;
const ORIGIN = new URL(BASE).origin + "/";
const SHOT = process.env.SHOT;

const sim = (page) =>
  page.evaluate(() => {
    const g = window.__gf && window.__gf.sim;
    const s = g && g.s;
    if (!s) return null;
    return {
      mode: s.mode, x: s.p.x, y: s.p.y, lives: s.lives, energy: s.energy, power: s.power, powers: s.powers, shots: s.shots.filter((x) => x.from === "hero").length,
      hp: s.fight ? s.fight.hp : null, panel: s.boss ? s.boss.panel : null, sel: g.selectedPower, boss: g.bossKey, rushIdx: s.rushIdx, stuck: s.stuck, hurts: s.hurts,
    };
  });
const quiz = (page) => page.evaluate(() => (window.__gfQuiz ? { kind: window.__gfQuiz.kind, n: window.__gfQuiz.n, answer: window.__gfQuiz.q.answer, picked: window.__gfQuiz.picked, subject: window.__gfQuiz.q.subject, standard: window.__gfQuiz.q.standard, id: window.__gfQuiz.q.id, slot: window.__gfQuiz.slot } : null));
const placeAt = (page, x, feetY) =>
  page.evaluate(([x, feetY]) => {
    Object.assign(window.__gf.sim.s.p, { x, y: feetY - 20, vx: 0, vy: 0, onMover: -1, inv: 0 });
  }, [x, feetY]);
/** Debug: puts Cyto on the ground a little before Antigen Clue i (germs nearby cleared). */
const toClue = (page, i, back = 70) =>
  page.evaluate(([i, back]) => {
    const g = window.__gf.sim;
    const q = g.level.clues[i];
    g.s.enemies.forEach((e) => { if (Math.abs(e.x - q.x) < 260) e.dead = true; });
    Object.assign(g.s.p, { x: q.barrierX - back, y: q.y + 30 - 20, vx: 0, vy: 0, onMover: -1, facing: 1, inv: 0 });
    return { x: q.x, barrierX: q.barrierX };
  }, [i, back]);
const noSideways = (page) => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth && document.body.scrollWidth <= window.innerWidth);
/** True when the element is the one actually under its own centre (nothing covers it). */
const onTop = (page, sel) =>
  page.evaluate((sel) => {
    const el = document.querySelector(sel);
    if (!el) return false;
    const b = el.getBoundingClientRect();
    const hit = document.elementFromPoint(b.left + b.width / 2, b.top + b.height / 2);
    return !!hit && (hit === el || el.contains(hit));
  }, sel);
const music = (page) => page.evaluate(() => {
  const a = window.__music && window.__music.audio;
  if (!a) return null;
  return { ctx: !!a.context, state: a.context ? a.context.state : null, notes: a.stats.notes, song: a.currentSong, history: a.history.slice(), musicOn: a.musicOn, sfxOn: a.sfxOn };
});
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

/** Hits the boss with granules until its antigen panel opens (falls back to the debug hook after a while). */
async function openPanel(page, problems, label) {
  const end = Date.now() + 9000;
  while (Date.now() < end) {
    if (await quiz(page)) return true;
    const s = await sim(page);
    if (s && s.mode === "boss") {
      const b = await page.evaluate(() => window.__gf.sim.s.boss.x);
      const key = b > s.x ? "ArrowRight" : "ArrowLeft";
      // Walk closer when far away, then just turn to face the germ.
      await page.keyboard.down(key);
      await sleep(Math.abs(b - s.x) > 80 ? 350 : 60);
      await page.keyboard.up(key);
      // Jump and blast (some germs float above a standing granule).
      await page.keyboard.down("ArrowUp");
      await sleep(180);
      await page.keyboard.down("z");
      await sleep(250);
      await page.keyboard.up("z");
      await page.keyboard.up("ArrowUp");
      await sleep(250);
    } else await sleep(150);
  }
  problems.push(`${label}: granules did not open the antigen panel; used the debug hook`);
  await page.evaluate(() => window.__gf.forceQuestion());
  await waitFor(() => quiz(page), 3000);
  return false;
}

/** Answers boss panels right until the boss (or the current Major Virus) is identified. */
async function beatBoss(page, problems, label, firstByZap) {
  let rounds = 0;
  const start = (await sim(page)).boss;
  while (rounds++ < 14) {
    const s = await sim(page);
    if (!s || s.mode === "clear" || s.mode === "bossDown" || s.boss !== start) break;
    if (!(await quiz(page))) {
      if (rounds === 1 && firstByZap) await openPanel(page, problems, label);
      else await page.evaluate(() => window.__gf.forceQuestion());
      await waitFor(() => quiz(page), 2000);
    }
    const q = await quiz(page);
    if (!q) break;
    if (q.kind !== "boss") problems.push(`${label}: panel kind ${q.kind}`);
    const hp0 = (await sim(page)).hp;
    await page.keyboard.press("ABCD"[q.answer].toLowerCase());
    await sleep(150);
    const hp1 = (await sim(page)).hp;
    if (!(hp1 < hp0)) problems.push(`${label}: a right answer did not lower HP (${hp0} -> ${hp1})`);
    const v = await page.locator(".gf-quiz .verdict").innerText().catch(() => "");
    if (!v.includes("✔")) problems.push(`${label}: right verdict "${v}"`);
    await page.keyboard.press("Enter");
    await sleep(150);
  }
}

async function desktop(browser, grade) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();
  const w = watch(page);
  const problems = [];
  await page.goto(`${BASE}?grade=${grade}&debug`, { waitUntil: "load" });
  await page.waitForFunction(() => !!window.__gf && !!window.__music);
  const badge = await page.locator(".gf-gradebadge").innerText().catch(() => "");
  if (!badge.includes(`GRADE ${grade}`)) problems.push(`badge "${badge}"`);
  const fontsOk = await page.evaluate(async () => { await document.fonts.ready; return document.fonts.check('12px "Press Start 2P"'); });
  if (!fontsOk) problems.push("Press Start 2P font not loaded from /fonts/");
  if (!(await noSideways(page))) problems.push("sideways scroll on the title");
  if ((await page.locator('[data-subject="science"][aria-checked="true"]').count()) !== 1 || (await page.locator('[data-topic="life"][aria-checked="true"]').count()) !== 1) problems.push("the default should be SCIENCE · Life science & health");
  const title = await page.locator(".gf-title").first().innerText();
  if (title.trim() !== "GERM FIGHTERS") problems.push(`title "${title}"`);
  for (const sel of [".gf-music", ".gf-sfx", ".gf-toolbar a"]) if (!(await onTop(page, sel))) problems.push(`toolbar ${sel} is covered on the title`);
  // Music waits for a gesture.
  const m0 = await music(page);
  if (!m0 || m0.ctx || m0.notes > 0) problems.push(`music started before a gesture (${JSON.stringify(m0)})`);

  // Body map (the Enter key is the gesture)
  await page.keyboard.press("Enter");
  await page.waitForSelector(".gf-grid");
  const m1 = await waitFor(async () => { const m = await music(page); return m && m.notes > 0 && m.state === "running" ? m : null; }, 3000);
  if (!m1) problems.push(`music did not start after the gesture (${JSON.stringify(await music(page))})`);
  else if (m1.song !== "Body Map") problems.push(`body map song "${m1.song}"`);
  if ((await page.locator(".gf-tile").count()) !== 9) problems.push("body map should have 9 tiles");
  if ((await page.locator(".gf-tile[data-beaten]").count()) !== 8) problems.push("body map should have 8 zones");
  if ((await page.locator(".gf-tile.center.locked").count()) !== 1) problems.push("the Lymph Node should start locked");
  const subj = await page.locator('.gf-tile[data-stage="nose"] .subj').innerText();
  if (!subj.includes("LIFE & HEALTH")) problems.push(`nose tile source "${subj}"`);
  // Music / SFX toggles persist across a reload.
  await page.locator(".gf-music").click();
  await page.locator(".gf-sfx").click();
  const flags = await page.evaluate(() => [localStorage.getItem("arcade.musicOff"), localStorage.getItem("arcade.sfxOff")]);
  if (flags.join() !== "1,1") problems.push(`toggles not saved: ${flags}`);
  await page.reload({ waitUntil: "load" });
  await page.waitForFunction(() => !!window.__gf);
  const texts = [await page.locator(".gf-music").innerText(), await page.locator(".gf-sfx").innerText()];
  if (texts.join() !== "MUSIC OFF,SFX OFF") problems.push(`toggles after reload: ${texts}`);
  await page.locator(".gf-music").click();
  await page.locator(".gf-sfx").click();
  if ((await page.locator(".gf-music").innerText()) !== "MUSIC ON" || (await music(page)).musicOn !== true) problems.push("music did not turn back on");
  await page.locator(".gf-cta.big").click();
  await page.waitForSelector(".gf-grid");
  // Arrow keys: from NOSE one step right is THROAT.
  await page.keyboard.press("ArrowRight");
  const focused = await page.evaluate(() => document.activeElement && document.activeElement.getAttribute("data-stage"));
  if (focused !== "throat") problems.push(`arrow right focused ${focused}`);
  await page.keyboard.press("Enter");
  await waitFor(async () => (await sim(page))?.mode === "play", 4000);
  const m2 = await waitFor(async () => ((await music(page)).song === "Throat & Tonsils" ? true : null), 2000);
  if (!m2) problems.push(`zone song: ${(await music(page)).song}`);

  // Play a little with the keys.
  await sleep(300);
  const s0 = await sim(page);
  await page.keyboard.down("ArrowUp");
  const jumped = await waitFor(async () => (await sim(page)).y < s0.y - 8, 600, 20);
  await page.keyboard.up("ArrowUp");
  if (!jumped) problems.push("jump did not leave the ground");
  await sleep(700);
  await page.keyboard.press("z");
  if (!(await waitFor(async () => (await sim(page)).shots > 0, 300, 15))) problems.push("Z did not launch a granule");
  await page.keyboard.down("ArrowRight");
  for (let i = 0; i < 4; i++) {
    await page.keyboard.press("z");
    await sleep(280);
  }
  await page.keyboard.up("ArrowRight");
  const s1 = await sim(page);
  if (!(s1.x > s0.x + 40)) problems.push(`walking right did not move (${s0.x} -> ${s1.x})`);
  if (!(await noSideways(page))) problems.push("sideways scroll while playing");

  // Antigen Clue 1: answer right.
  await toClue(page, 0);
  await page.evaluate(() => { window.__gf.sim.s.energy = 6; });
  await sleep(100);
  await page.keyboard.down("ArrowRight");
  await sleep(900);
  await page.keyboard.up("ArrowRight");
  const qb0 = await page.evaluate(() => window.__gf.sim.level.clues[0]);
  const blocked = await sim(page);
  if (blocked.x + 12 > qb0.barrierX + 0.5 && !(await quiz(page))) problems.push("the biofilm wall did not stop Cyto");
  if (!(await quiz(page))) {
    await page.keyboard.down("z");
    await waitFor(() => quiz(page), 3000, 50);
    await page.keyboard.up("z");
  }
  let q = await quiz(page);
  if (!q || q.kind !== "clue") problems.push(`a granule on the Antigen Clue did not ask (${JSON.stringify(q)})`);
  else {
    const head = await page.locator(".gf-quiz .head").innerText();
    if (!head.includes("ANTIGEN CLUE 1/3")) problems.push(`clue header "${head}"`);
    if (q.subject !== "science") problems.push(`default clue asked ${q.subject}`);
    const e0 = (await sim(page)).energy;
    await page.keyboard.press("ABCD"[q.answer].toLowerCase());
    await sleep(200);
    const v = await page.locator(".gf-quiz .verdict").innerText();
    if (!v.includes("ANTIGEN IDENTIFIED") || !v.includes("ENERGY")) problems.push(`clue right verdict "${v}"`);
    if (!((await sim(page)).energy >= e0 + 10)) problems.push("a right clue answer should refill energy");
    await page.keyboard.press("Enter");
    const chip = await waitFor(() => page.locator(".gf-boost").count(), 1500, 50);
    if (!chip) problems.push("no power-up chip after the first right clue answer");
    else if (!/\d+s/.test(await page.locator(".gf-boost").first().innerText())) problems.push("power-up chip has no timer");
  }
  // Antigen Clue 2: answer wrong. Nothing lost, the wall still goes.
  await toClue(page, 1, 50);
  await sleep(100);
  await page.keyboard.down("z");
  await waitFor(() => quiz(page), 3000, 50);
  await page.keyboard.up("z");
  q = await quiz(page);
  if (!q || q.kind !== "clue") problems.push("second clue did not ask");
  else {
    const before = await sim(page);
    await page.keyboard.press(String(((q.answer + 1) % 4) + 1));
    await sleep(200);
    const after = await sim(page);
    const v = await page.locator(".gf-quiz .verdict").innerText();
    if (!v.includes("STILL CRACKS")) problems.push(`clue wrong verdict "${v}"`);
    if (after.lives !== before.lives || after.energy < before.energy || after.power < before.power) problems.push("a wrong clue answer cost something");
    if (!(await page.locator(".gf-quiz .why").innerText()).length) problems.push("no explanation after a wrong clue answer");
    await page.keyboard.press("Enter");
    await sleep(150);
    await page.keyboard.down("ArrowRight");
    await sleep(700);
    await page.keyboard.up("ArrowRight");
    const qb1 = await page.evaluate(() => window.__gf.sim.level.clues[1]);
    if (!((await sim(page)).x > qb1.barrierX + 12)) problems.push("the second wall should be gone after a wrong answer");
  }
  // Power-ups: Mucus Shield catches germ shots; Lymph Leap jumps much higher.
  await page.evaluate(() => window.__gf.giveBoost("mucus"));
  await sleep(150);
  if (!(await page.locator('.gf-boost[data-boost="mucus"]').count())) problems.push("Mucus Shield chip not shown");
  const mu0 = await sim(page);
  await page.evaluate(() => {
    const s = window.__gf.sim.s;
    for (let i = 0; i < 3; i++) s.shots.push({ x: s.p.x + i * 3, y: s.p.y + 4, w: 8, h: 8, vx: 0, vy: 0, grav: 0, life: 40, from: "foe", kind: "toxin", delay: 0, floor: "none" });
  });
  await sleep(300);
  const mu1 = await sim(page);
  if (mu1.energy < mu0.energy || mu1.stuck < mu0.stuck + 3) problems.push(`Mucus Shield: energy ${mu0.energy} -> ${mu1.energy}, stuck ${mu0.stuck} -> ${mu1.stuck}`);
  const ledge = await page.evaluate(() => window.__gf.sim.level.skyLedges[0]);
  const jumpPeak = async () => {
    const y0 = (await sim(page)).y;
    let top = y0;
    await page.keyboard.down("ArrowUp");
    const t0 = Date.now();
    while (Date.now() - t0 < 900) {
      top = Math.min(top, (await sim(page)).y);
      await sleep(15);
    }
    await page.keyboard.up("ArrowUp");
    await sleep(400);
    return y0 - top;
  };
  await placeAt(page, ledge.x - 60, ledge.y + 80);
  await sleep(150);
  const plainH = await jumpPeak();
  await placeAt(page, ledge.x - 60, ledge.y + 80);
  await page.evaluate(() => window.__gf.giveBoost("leap"));
  await sleep(150);
  const leapH = await jumpPeak();
  if (!(leapH > plainH + 30)) problems.push(`Lymph Leap jump ${leapH.toFixed(0)} px vs normal ${plainH.toFixed(0)} px`);

  // The stage germ (debug hook to skip the rest of the run). Lymph Leap would jump right over this germ's shots.
  await page.evaluate(() => { window.__gf.sim.s.boosts.leap = 0; window.__gf.warpToBoss(); });
  if (!(await waitFor(() => page.locator(".gf-say").isVisible().catch(() => false), 3000))) problems.push("no boss intro line");
  else if ((await page.locator(".gf-say b").innerText()) !== "STREPTOCOCCUS") problems.push(`boss intro should name STREPTOCOCCUS (${await page.locator(".gf-say b").innerText()})`);
  await waitFor(async () => (await sim(page))?.mode === "boss", 4000);
  const before = await sim(page);
  await openPanel(page, problems, `grade ${grade} first panel`);
  q = await quiz(page);
  if (!q) problems.push("no boss question");
  else {
    const wrong = (q.answer + 1) % 4;
    await page.keyboard.press(String(wrong + 1));
    await sleep(200);
    const after = await sim(page);
    const verdict = await page.locator(".gf-quiz .verdict").innerText().catch(() => "");
    if (!verdict.includes("BLOCKED")) problems.push(`wrong verdict "${verdict}"`);
    if (after.hp !== before.hp || after.lives !== before.lives) problems.push("a wrong boss answer changed hp/lives");
    await page.keyboard.press("Enter");
    await sleep(200);
    await beatBoss(page, problems, `grade ${grade} STREPTOCOCCUS`, false);
  }
  const cleared = await waitFor(() => page.locator("[data-power]").isVisible().catch(() => false), 6000);
  if (!cleared) problems.push("no new-skill screen after the stage germ");
  else if (!(await page.locator("[data-power]").innerText()).includes("COUGH DASH")) problems.push("earned the wrong skill");
  if (cleared && !(await page.locator(".gf-panel.won .gf-h").first().innerText()).includes("STREPTOCOCCUS IDENTIFIED")) problems.push("the new-skill screen should name STREPTOCOCCUS");
  if (cleared && (await page.locator("[data-full-name]").getAttribute("data-full-name")) !== "Streptococcus pyogenes (Strep A)") problems.push("the new-skill screen should show the full name");
  if ((await page.locator("[data-clues]").getAttribute("data-clues").catch(() => null)) === null) problems.push("cleared screen should count the clues");
  const saved = await page.evaluate(() => localStorage.getItem("arcade.germ-fighters.save.v1"));
  if (!saved || !saved.includes("throat")) problems.push(`save: ${saved}`);
  const strays = (await page.evaluate(() => Object.keys(localStorage))).filter((k) => !k.startsWith("arcade."));
  if (strays.length) problems.push(`storage keys outside arcade.*: ${strays}`);
  if (!(await noSideways(page))) problems.push("sideways scroll on the new-skill screen");
  await page.keyboard.press("Enter");
  await page.waitForSelector(".gf-grid");

  // The Major Virus rush (debug skip): Rhinovirus with its card and own facts, then Influenza.
  await page.evaluate(() => window.__gf.skipToRush(0));
  await waitFor(async () => (await sim(page))?.mode === "boss", 5000);
  const card = await waitFor(() => page.locator('[data-virus-card="RHINOVIRUS"]').isVisible().catch(() => false), 3000);
  if (!card) problems.push("no Rhinovirus fact card");
  else if (!/common colds/i.test(await page.locator(".gf-card").innerText())) problems.push("the Rhinovirus card should explain colds");
  if (!(await waitFor(async () => (await music(page)).history.includes("song:Major Virus Rush"), 4000))) problems.push(`rush music: ${(await music(page)).history.slice(-4)}`);
  await page.evaluate(() => window.__gf.forceQuestion());
  q = await waitFor(() => quiz(page), 2000);
  if (!q) problems.push("no rush question");
  else {
    const head = await page.locator(".gf-quiz .head").innerText();
    if (!head.includes("MAJOR VIRUS 1/6") || !head.includes("RHINOVIRUS")) problems.push(`rush header "${head}"`);
    if (!q.id.startsWith("gf-rhino")) problems.push(`Rhinovirus should ask its own facts first (${q.id})`);
    await beatBoss(page, problems, `grade ${grade} RHINOVIRUS`, false);
  }
  const next = await waitFor(async () => ((await sim(page))?.boss === "flu" ? true : null), 6000);
  if (!next) problems.push(`Influenza did not drop in (${JSON.stringify(await sim(page))})`);
  else if (!(await waitFor(() => page.locator('[data-virus-card="INFLUENZA"]').isVisible().catch(() => false), 3000))) problems.push("no Influenza card");
  const vs = await page.evaluate(() => JSON.parse(localStorage.getItem("arcade.germ-fighters.save.v1")).viruses);
  if (!vs || !vs.includes("rhino")) problems.push(`virus card not saved: ${vs}`);
  if (!(await noSideways(page))) problems.push("sideways scroll in the rush");
  if (SHOT && grade === "7") await screenshot(page);
  await ctx.close();
  return { problems, errors: w.errors, external: w.external };
}

/** 640x400 picture of a Major Virus fight with Cyto launching granules (the canvas itself is 640x400). */
async function screenshot(page) {
  await page.evaluate(() => window.__gf.skipToRush(1));
  await waitFor(async () => (await sim(page))?.mode === "boss", 5000);
  await sleep(2400);
  await page.keyboard.down("ArrowRight");
  await sleep(250);
  await page.keyboard.up("ArrowRight");
  await page.keyboard.down("ArrowUp");
  await sleep(120);
  for (let i = 0; i < 3; i++) {
    await page.keyboard.press("z");
    await sleep(80);
  }
  await page.keyboard.up("ArrowUp");
  const data = await page.evaluate(() => document.querySelector("canvas").toDataURL("image/png"));
  fs.writeFileSync(SHOT, Buffer.from(data.split(",")[1], "base64"));
  console.log(`saved ${SHOT} (${fs.statSync(SHOT).size} bytes)`);
}

async function phone(browser, grade, width) {
  const ctx = await browser.newContext({ viewport: { width, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  const w = watch(page);
  const problems = [];
  await page.goto(`${BASE}?grade=${grade}&debug`, { waitUntil: "load" });
  await page.waitForFunction(() => !!window.__gf);
  if (!(await noSideways(page))) problems.push(`${width}px: sideways scroll on the title`);
  // The toolbar stays tappable above the full-screen title overlay.
  for (const sel of [".gf-music", ".gf-sfx", ".gf-toolbar a"]) if (!(await onTop(page, sel))) problems.push(`${width}px: toolbar ${sel} is covered on the title`);
  await page.locator(".gf-music").tap();
  if ((await page.locator(".gf-music").innerText()) !== "MUSIC OFF") problems.push(`${width}px: tapping MUSIC on the title did nothing`);
  await page.locator(".gf-music").tap();
  if ((await page.locator(".gf-music").innerText()) !== "MUSIC ON") problems.push(`${width}px: MUSIC did not turn back on`);
  await page.locator(".gf-cta.big").tap();
  await page.waitForSelector(".gf-grid");
  if (!(await noSideways(page))) problems.push(`${width}px: sideways scroll on the body map`);
  if (!(await onTop(page, ".gf-sfx"))) problems.push(`${width}px: toolbar covered on the body map`);
  await page.locator('.gf-tile[data-stage="blood"]').tap();
  await waitFor(async () => (await sim(page))?.mode === "play", 4000);
  await sleep(200);
  if ((await page.locator(".gf-controls.show").count()) !== 1) problems.push(`${width}px: touch pad not shown`);
  for (const sel of ['[aria-label="Move left"]', '[aria-label="Move right"]', '[aria-label="Jump"]', '[aria-label="Granule Blast"]', '[aria-label="Use skill"]']) {
    const box = await page.locator(sel).boundingBox();
    if (!box || box.x < 0 || box.x + box.width > width + 0.5 || box.y + box.height > 844 + 0.5) problems.push(`${width}px: ${sel} off screen`);
  }
  const hold = async (label, ms, id = 7) => {
    const el = page.locator(`[aria-label="${label}"]`);
    await el.dispatchEvent("pointerdown", { pointerId: id, pointerType: "touch", isPrimary: true });
    await sleep(ms);
    await el.dispatchEvent("pointerup", { pointerId: id, pointerType: "touch", isPrimary: true });
  };
  const s0 = await sim(page);
  await hold("Move right", 900);
  const s1 = await sim(page);
  if (!(s1.x > s0.x + 30)) problems.push(`${width}px: ▶ did not move (${s0.x} -> ${s1.x})`);
  const jumpP = hold("Jump", 250);
  const up = await waitFor(async () => (await sim(page)).y < s1.y - 5, 600, 30);
  await jumpP;
  if (!up) problems.push(`${width}px: JUMP did not jump`);
  await hold("Granule Blast", 120);
  await sleep(30);
  if (!((await sim(page)).shots > 0) && !(await waitFor(async () => (await sim(page)).shots > 0, 300, 20))) problems.push(`${width}px: BLAST did not launch a granule`);
  if (!(await noSideways(page))) problems.push(`${width}px: sideways scroll while playing`);
  // An Antigen Clue, hit with the touch BLAST button and answered with a tap.
  await toClue(page, 0, 60);
  await sleep(100);
  {
    const el = page.locator('[aria-label="Granule Blast"]');
    await el.dispatchEvent("pointerdown", { pointerId: 8, pointerType: "touch", isPrimary: true });
    await waitFor(() => quiz(page), 3000, 50);
    await el.dispatchEvent("pointerup", { pointerId: 8, pointerType: "touch", isPrimary: true });
  }
  const bq = await quiz(page);
  if (!bq || bq.kind !== "clue") problems.push(`${width}px: BLAST did not open an Antigen Clue`);
  else {
    await page.locator(".gf-quiz .opt").nth(bq.answer).tap();
    await sleep(150);
    if (!(await page.locator(".gf-quiz .verdict").innerText()).includes("ANTIGEN IDENTIFIED")) problems.push(`${width}px: clue right verdict`);
    if (!(await noSideways(page))) problems.push(`${width}px: sideways scroll with a clue open`);
    await page.locator(".gf-quiz .gf-cta").tap();
    const chip = await waitFor(() => page.locator(".gf-boost").count(), 1500, 50);
    if (!chip) problems.push(`${width}px: no power-up chip`);
    else {
      const box = await page.locator(".gf-boost").first().boundingBox();
      if (!box || box.x < 0 || box.x + box.width > width + 0.5) problems.push(`${width}px: power-up chip off screen`);
    }
  }
  await page.evaluate(() => window.__gf.warpToBoss());
  await waitFor(async () => (await sim(page))?.mode === "boss", 4000);
  await page.evaluate(() => window.__gf.forceQuestion());
  const q = await waitFor(() => quiz(page), 2000);
  if (!q) problems.push(`${width}px: no question`);
  else {
    if ((await page.locator(".gf-controls.show").count()) !== 0) problems.push(`${width}px: pad should hide during a question`);
    await page.locator(".gf-quiz .opt").nth(q.answer).tap();
    await sleep(150);
    if (!(await page.locator(".gf-quiz .verdict").innerText()).includes("✔")) problems.push(`${width}px: tapping the right answer`);
    if (!(await noSideways(page))) problems.push(`${width}px: sideways scroll with the question open`);
    await page.locator(".gf-quiz .gf-cta").tap();
    await sleep(150);
    if (await quiz(page)) problems.push(`${width}px: Next did not close the question`);
  }
  // Pause overlay: the toolbar is still on top.
  await page.locator(".gf-toolbar button", { hasText: "PAUSE" }).tap();
  await sleep(100);
  if (!(await onTop(page, ".gf-music"))) problems.push(`${width}px: toolbar covered by the pause overlay`);
  await ctx.close();
  return { problems, errors: w.errors, external: w.external };
}

(async () => {
  const browser = await chromium.launch();
  const results = [];
  try {
    const want = (name) => !ONLY || ONLY.some((o) => name.includes(o));
    for (const g of ["2", "7"]) if (want(`desktop grade ${g}`)) results.push([`desktop grade ${g}`, await desktop(browser, g)]);
    if (want("phone 390 grade 2")) results.push(["phone 390 grade 2", await phone(browser, "2", 390)]);
    if (want("phone 390 grade 7")) results.push(["phone 390 grade 7", await phone(browser, "7", 390)]);
    if (want("phone 360 grade 2")) results.push(["phone 360 grade 2", await phone(browser, "2", 360)]);
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
