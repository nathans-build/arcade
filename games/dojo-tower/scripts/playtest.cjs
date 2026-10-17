/*
 * Automated playtest (dev only). Needs the built game served at /dojo-tower/ with the arcade's
 * /fonts/ next to it, and a global Playwright (Chromium):
 *   npm run build
 *   (serve a folder holding dojo-tower -> dist and fonts -> ../../site/fonts on port 8811, or set BASE)
 *   node scripts/playtest.cjs          (SHOT=../../site/img/dojo-tower.png saves a 640x400 floor-10 boss-fight picture)
 * For each grade: keyboard on a 1280x800 desktop, then touch on a 390x844 phone. It checks the grade
 * badge, starts the game, walks, punches a ninja, ducks, jumps, reaches the floor master, answers wrong
 * (blocked: boss HP, lives and energy unchanged) and right (combo hits) until the master is beaten,
 * climbs to floor 2, checks there is no sideways scrolling and no console errors; on the desktop it skips to
 * floor 10 (debug hook), beats the final master and checks the tower-cleared report.
 * Floor masters: MATH at grade 5 and SCIENCE at grade 8 show that subject's ten masters on the title list and
 * meet that subject's master on floor 1; MIXED keeps its order; Math floor 10 is Empress Infinity and the
 * tower-cleared screen follows; a game over on floor 7 offers "Continue from floor 6".
 * Ink stars: five star-throwers earn the burst (HUD ★ n/5, then a timer bar), S throws, a ninja far ahead
 * poofs, the burst runs out and the counter resets; on a 390px phone the ★ button does the same.
 * The title screen opens scrolled to the top on a desktop and on phones.
 * Then the subject / topic picker: at grade 7 pick MATH -> Ratios & rates with the keyboard and check the
 * scroll and floor-master questions are ratio/rate ones (and the choice is remembered); ?grade=4&topic=civics
 * starts on Social Studies -> Civics; ?grade=2&topic=ratios is ignored with a note; ALL SCIENCE asks only
 * science; and the picker has no sideways scroll on 390px and 360px phones.
 */
const path = require("path");
const fs = require("fs");
const { execSync } = require("child_process");
const { chromium } = require(path.join(execSync("npm root -g").toString().trim(), "playwright"));

const BASE = process.env.BASE || "http://127.0.0.1:8811/dojo-tower/";
const ORIGIN = new URL(BASE).origin + "/";
const GRADES = (process.env.GRADES || "3,8").split(",");
const SHOT = process.env.SHOT;

const sim = (page) =>
  page.evaluate(() => {
    const s = window.__dt.sim;
    return {
      mode: s.mode, floor: s.floor, dir: s.dir, x: s.player.x, y: s.player.y, ducking: s.player.ducking, score: s.score,
      lives: s.lives, energy: s.energy, hp: s.fight ? s.fight.hp : null, enemies: s.enemies.length, meter: s.streak.meter,
    };
  });
const quiz = (page) => page.evaluate(() => (window.__dtQuiz ? { answer: window.__dtQuiz.q.answer, picked: window.__dtQuiz.picked, kind: window.__dtQuiz.kind, prompt: window.__dtQuiz.q.prompt, grade: window.__dtQuiz.q.grade, subject: window.__dtQuiz.q.subject, standard: window.__dtQuiz.q.standard, skill: window.__dtQuiz.q.skill } : null));

async function noSideways(page) {
  return page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth && document.body.scrollWidth <= window.innerWidth);
}

async function run(browser, grade, mode) {
  const touch = mode === "touch";
  const ctx = await browser.newContext(
    touch
      ? { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 }
      : { viewport: { width: 1280, height: 800 } },
  );
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
  await page.goto(`${BASE}?grade=${grade}&debug`, { waitUntil: "load" });
  await page.waitForFunction(() => !!window.__dt);
  const problems = [];
  const tap = async (loc) => (touch ? loc.tap() : loc.click());

  const badge = await page.locator(".dt-gradebadge").innerText().catch(() => "");
  if (!badge.includes(grade === "K" ? "KINDERGARTEN" : `GRADE ${grade}`)) problems.push(`badge "${badge}"`);
  if ((await page.locator(".dt-grade").count()) !== 0) problems.push("grade picker shown although ?grade= was given");
  const fontsOk = await page.evaluate(async () => { await document.fonts.ready; return document.fonts.check('12px "Press Start 2P"'); });
  if (!fontsOk) problems.push("Press Start 2P font not loaded from /fonts/");
  if (!(await noSideways(page))) problems.push("sideways scroll on the title screen");

  // Start
  if (touch) await tap(page.locator(".dt-cta.big"));
  else await page.keyboard.press("Enter");
  await page.waitForTimeout(300);
  const controls = await page.locator(".dt-controls.show").count();
  if (touch && !controls) problems.push("touch controls hidden on a phone");
  if (!touch && controls) problems.push("touch controls shown on desktop");
  await page.waitForFunction(() => window.__dt.sim.mode === "run", null, { timeout: 5000 });
  await page.evaluate(() => { window.__dt.sim.invincible = true; });

  // Walk forward
  let s0 = await sim(page);
  if (touch) {
    const right = page.locator('[aria-label="Move right"]');
    const box = await right.boundingBox();
    await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2); // a tap is a very short hold
    await right.dispatchEvent("pointerdown", { pointerId: 1, pointerType: "touch", isPrimary: true });
    await page.waitForTimeout(700);
    await right.dispatchEvent("pointerup", { pointerId: 1, pointerType: "touch", isPrimary: true });
  } else {
    await page.keyboard.down("ArrowRight");
    await page.waitForTimeout(700);
    await page.keyboard.up("ArrowRight");
  }
  let s1 = await sim(page);
  if (!(s1.x > s0.x + 20)) problems.push(`did not walk: ${s0.x} -> ${s1.x}`);

  // A-D are never movement keys
  if (!touch) {
    const before = (await sim(page)).x;
    for (const k of ["a", "b", "c", "d", "1", "2"]) await page.keyboard.press(k);
    await page.waitForTimeout(200);
    if ((await sim(page)).x !== before) problems.push("A-D / 1-4 moved the student");
  }

  // Punch a ninja placed in front
  await page.evaluate(() => {
    const s = window.__dt.sim;
    s.enemies = [];
    s.player.facing = s.dir;
    const e = s.spawn("ninja", true);
    e.x = s.player.x + s.dir * 15;
    e.speed = 0;
  });
  const scoreBefore = (await sim(page)).score;
  if (touch) await tap(page.locator(".dt-touch.punch"));
  else await page.keyboard.press("z");
  await page.waitForTimeout(400);
  s1 = await sim(page);
  if (s1.enemies !== 0 || s1.score <= scoreBefore) problems.push(`punch did not poof the ninja (enemies ${s1.enemies}, score ${scoreBefore} -> ${s1.score})`);

  // Kick, duck and jump
  if (touch) await tap(page.locator(".dt-touch.kick"));
  else await page.keyboard.press("x");
  await page.waitForTimeout(350);
  if (!touch) {
    await page.keyboard.down("ArrowDown");
    await page.waitForTimeout(150);
    if (!(await sim(page)).ducking) problems.push("ArrowDown did not duck");
    await page.keyboard.up("ArrowDown");
    await page.keyboard.press("ArrowUp");
  } else {
    await tap(page.locator('[aria-label="Jump"]'));
  }
  await page.waitForTimeout(120);
  if (!((await sim(page)).y > 0)) problems.push("jump did not leave the floor");
  await page.waitForTimeout(800);

  // Pause and resume
  if (!touch) {
    await page.keyboard.press("p");
    await page.waitForTimeout(100);
    if (!(await page.locator(".dt-overlay .dt-title", { hasText: "PAUSED" }).count())) problems.push("P did not pause");
    await page.keyboard.press("Escape");
    await page.waitForTimeout(100);
  }

  // Scroll ninja: beat it, answer the quick question
  await page.evaluate(() => {
    const s = window.__dt.sim;
    s.enemies = [];
    s.player.facing = s.dir;
    const e = s.spawn("scroll", true);
    e.x = s.player.x + s.dir * 15;
    e.speed = 0;
  });
  if (touch) await tap(page.locator(".dt-touch.punch"));
  else await page.keyboard.press("z");
  await page.waitForSelector(".dt-quiz.scroll", { timeout: 3000 }).catch(() => problems.push("scroll question did not open"));
  let qz = await quiz(page);
  if (qz) {
    if (qz.subject !== "ela") problems.push(`floor 1 scroll was ${qz.subject}, not ELA`);
    if (touch) await tap(page.locator(".dt-quiz .opt").nth(qz.answer));
    else await page.keyboard.press(String(qz.answer + 1));
    await page.waitForSelector(".dt-quiz .verdict.ok", { timeout: 2000 }).catch(() => problems.push("scroll right answer not shown as right"));
    if (touch) await tap(page.locator(".dt-quiz .dt-cta"));
    else await page.keyboard.press("Enter");
    await page.waitForTimeout(200);
    if ((await sim(page)).mode !== "run") problems.push("did not return to the floor after the scroll");
  }

  // Reach the floor master
  await page.evaluate(() => window.__dt.sim.warpToBoss());
  const dirKey = (await sim(page)).dir > 0 ? "ArrowRight" : "ArrowLeft";
  if (touch) {
    const btn = page.locator('[aria-label="Move right"]');
    await btn.dispatchEvent("pointerdown", { pointerId: 2, pointerType: "touch", isPrimary: true });
    await page.waitForTimeout(400);
    await btn.dispatchEvent("pointerup", { pointerId: 2, pointerType: "touch", isPrimary: true });
  } else {
    await page.keyboard.down(dirKey);
    await page.waitForTimeout(400);
    await page.keyboard.up(dirKey);
  }
  await page.waitForSelector(".dt-quiz.boss", { timeout: 8000 }).catch(() => problems.push("boss question did not appear"));
  const b0 = await sim(page);
  if (b0.mode !== "boss") problems.push(`mode ${b0.mode} at the boss`);
  if (touch && (await page.locator(".dt-controls.show").count())) problems.push("move pad still shown during the boss quiz");
  if (!(await noSideways(page))) problems.push("sideways scroll during the boss quiz");
  qz = await quiz(page);
  if (!qz) {
    problems.push(`no boss question (mode ${b0.mode}, x ${b0.x})`);
    await ctx.close();
    return problems;
  }
  if (qz.subject !== "ela") problems.push(`floor 1 boss asked ${qz.subject}`);

  // Wrong answer: blocked, nothing lost
  const wrong = (qz.answer + 1) % 4;
  if (touch) await tap(page.locator(".dt-quiz .opt").nth(wrong));
  else await page.keyboard.press("ABCD"[wrong].toLowerCase());
  await page.waitForSelector(".dt-quiz .verdict.no", { timeout: 2000 }).catch(() => problems.push("wrong answer verdict missing"));
  const why = await page.locator(".dt-quiz .why").innerText().catch(() => "");
  if (why.length < 10) problems.push("no explanation after a wrong answer");
  await page.waitForTimeout(1000);
  const b1 = await sim(page);
  if (b1.hp !== b0.hp || b1.lives !== b0.lives || b1.energy !== b0.energy) problems.push(`wrong answer changed hp/lives/energy: ${JSON.stringify([b0, b1])}`);

  // Right answers until the master is beaten
  let rounds = 0;
  while (rounds < 12) {
    if (touch) await tap(page.locator(".dt-quiz .dt-cta"));
    else await page.keyboard.press("Enter");
    await page.waitForTimeout(250);
    qz = await quiz(page);
    if (!qz) break;
    if (qz.picked !== null) continue;
    const hpBefore = (await sim(page)).hp;
    if (touch) await tap(page.locator(".dt-quiz .opt").nth(qz.answer));
    else await page.keyboard.press(String(qz.answer + 1));
    await page.waitForTimeout(1700);
    const hpAfter = (await sim(page)).hp;
    if (!(hpAfter < hpBefore)) problems.push(`right answer did not hurt the boss (${hpBefore} -> ${hpAfter})`);
    rounds++;
    if (hpAfter <= 0) {
      if (touch) await tap(page.locator(".dt-quiz .dt-cta"));
      else await page.keyboard.press("Enter");
      break;
    }
  }
  await page.waitForFunction(() => window.__dt.sim.floor === 2 && window.__dt.sim.mode === "intro", null, { timeout: 6000 }).catch(() => problems.push("did not climb to floor 2"));
  await page.waitForTimeout(400);
  const f2 = await sim(page);
  if (f2.dir !== -1) problems.push("floor 2 should run right-to-left");
  const hudFloor = await page.locator(".dt-hud").innerText();
  if (!hudFloor.includes("2/10")) problems.push(`HUD floor: ${hudFloor.replace(/\s+/g, " ")}`);

  // Floor 2 boss uses math; floor 3 civics questions are for this grade band
  for (const [floor, subj] of [[2, "math"], [3, "social"]]) {
    await page.waitForFunction(() => window.__dt.sim.mode === "run", null, { timeout: 5000 });
    await page.evaluate(() => window.__dt.sim.warpToBoss());
    await page.evaluate(() => { const s = window.__dt.sim; s.held[s.dir > 0 ? "right" : "left"] = true; });
    await page.waitForSelector(".dt-quiz.boss", { timeout: 8000 }).catch(() => problems.push(`floor ${floor} boss question missing`));
    await page.evaluate(() => { const s = window.__dt.sim; s.held.left = s.held.right = false; });
    qz = await quiz(page);
    if (!qz || qz.subject !== subj) problems.push(`floor ${floor} asked ${qz && qz.subject}, want ${subj}`);
    if (floor === 3 && qz) {
      const g = qz.grade === "K" ? 0 : Number(qz.grade);
      const n = grade === "K" ? 0 : Number(grade);
      const band = (x) => (x <= 2 ? 0 : x <= 5 ? 1 : x <= 8 ? 2 : 3);
      if (band(g) !== band(n)) problems.push(`civics question grade ${qz.grade} outside the band of grade ${grade}`);
    }
    if (floor === 2) {
      // beat floor 2 quickly through the hook
      for (let i = 0; i < 10; i++) {
        const q = await quiz(page);
        if (!q) break;
        if (q.picked === null) {
          if (touch) await tap(page.locator(".dt-quiz .opt").nth(q.answer));
          else await page.keyboard.press(String(q.answer + 1));
        }
        await page.waitForTimeout(300);
        const done = await page.evaluate(() => window.__dt.sim.fight && window.__dt.sim.fight.hp <= 0);
        if (touch) await tap(page.locator(".dt-quiz .dt-cta"));
        else await page.keyboard.press("Enter");
        await page.waitForTimeout(200);
        if (done) break;
      }
      await page.waitForFunction(() => window.__dt.sim.floor === 3, null, { timeout: 6000 }).catch(() => problems.push("did not reach floor 3"));
    }
  }

  if (!touch) {
    // Tower cleared: jump to floor 10 (debug hook) and beat the MIXED grand final
    await page.evaluate(() => { const s = window.__dt.sim; s.startFloor(10); });
    await page.waitForFunction(() => window.__dt.sim.mode === "run", null, { timeout: 5000 });
    await page.evaluate(() => { const s = window.__dt.sim; s.warpToBoss(); s.held[s.dir > 0 ? "right" : "left"] = true; });
    await page.waitForSelector(".dt-quiz.boss", { timeout: 8000 }).catch(() => problems.push("floor 5 boss question missing"));
    await page.evaluate(() => { const s = window.__dt.sim; s.held.left = s.held.right = false; });
    const head10 = await page.locator(".dt-quiz .head").innerText().catch(() => "");
    if (!head10.includes("GRANDMASTER SKYBRUSH")) problems.push(`floor 10 master: "${head10}"`);
    if (!(await page.locator(".dt-hud").innerText()).includes("10/10")) problems.push("HUD should say floor 10/10");
    for (let i = 0; i < 14; i++) {
      const q = await quiz(page);
      if (!q) break;
      if (q.picked === null) await page.keyboard.press(String(q.answer + 1));
      await page.waitForTimeout(300);
      await page.keyboard.press("Enter");
      await page.waitForTimeout(200);
    }
    await page.waitForSelector(".dt-panel.won", { timeout: 6000 }).catch(() => problems.push("tower-cleared screen missing"));
    const wonText = await page.locator(".dt-panel.won").innerText().catch(() => "");
    if (!wonText.includes("All 10 floors")) problems.push(`won report: "${wonText.slice(0, 200)}"`);
    const rows = await page.locator(".dt-report-table tbody tr").count();
    if (rows < 2) problems.push(`report shows ${rows} standards`);
    // Game over: play again, then lose every life
    await page.locator(".dt-cta", { hasText: "Play again" }).click();
    await page.waitForFunction(() => window.__dt.sim.mode === "run", null, { timeout: 5000 });
    await page.evaluate(() => { const s = window.__dt.sim; s.score = 4321; s.lives = 1; s.energy = 1; s.enemies = []; const e = s.spawn("ninja", true); e.x = s.player.x + 3; e.speed = 0; });
    await page.locator(".dt-panel", { hasText: "OUT OF LIVES" }).waitFor({ timeout: 5000 }).catch(() => problems.push("game-over report missing"));
    await page.locator(".dt-cta", { hasText: "Title screen" }).click();
    await page.waitForSelector(".dt-panel.title", { timeout: 3000 }).catch(() => problems.push("title screen did not come back"));
  }

  if (!(await noSideways(page))) problems.push("sideways scroll at the end");
  if (touch) {
    const w = await page.evaluate(() => document.documentElement.scrollWidth);
    if (w > 390) problems.push(`page is ${w}px wide on a 390px phone`);
  }
  if (errors.length) problems.push(`console errors: ${errors.join(" | ")}`);
  if (external.length) problems.push(`external requests: ${[...new Set(external)].join(", ")}`);
  if (process.env.PAGESHOT) await page.screenshot({ path: `${process.env.PAGESHOT}-g${grade}-${mode}.png` });
  await ctx.close();
  return problems;
}

/* ------------------------------------------------------------ subject / topic picker */

async function newPage(browser, opts) {
  const ctx = await browser.newContext(opts);
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  return { ctx, page, errors };
}

const checked = (page, sel) => page.locator(`${sel}[aria-checked="true"]`).count();
const RATIO = /\.RP\./;

/** From the title screen: start, warp to this floor's master and return its first question. */
async function bossQuestion(page) {
  await page.waitForFunction(() => window.__dt.sim.mode === "run", null, { timeout: 6000 });
  await page.evaluate(() => { const s = window.__dt.sim; s.invincible = true; s.warpToBoss(); s.held[s.dir > 0 ? "right" : "left"] = true; });
  await page.waitForSelector(".dt-quiz.boss", { timeout: 8000 });
  await page.evaluate(() => { const s = window.__dt.sim; s.held.left = s.held.right = false; });
  return quiz(page);
}

/** Answers the open boss fight right until the master falls (then on to the next floor). */
async function beatBoss(page, seen) {
  for (let i = 0; i < 12; i++) {
    const q = await quiz(page);
    if (!q) break;
    if (q.picked === null) {
      seen.push(q);
      await page.keyboard.press(String(q.answer + 1));
    }
    await page.waitForTimeout(300);
    const done = await page.evaluate(() => window.__dt.sim.fight && window.__dt.sim.fight.hp <= 0);
    await page.keyboard.press("Enter");
    await page.waitForTimeout(250);
    if (done) break;
  }
}

async function focusTests(browser) {
  const problems = [];

  // 1. Grade 7: MATH -> Ratios & rates with the keyboard.
  {
    const { ctx, page, errors } = await newPage(browser, { viewport: { width: 1280, height: 800 } });
    await page.goto(`${BASE}?grade=7&debug`, { waitUntil: "load" });
    await page.waitForFunction(() => !!window.__dt);
    if (!(await checked(page, '[data-subject="mixed"]'))) problems.push("MIXED is not the default subject");
    if (await page.locator(".dt-chips.topics").count()) problems.push("topic row shown for MIXED");
    await page.locator('[data-subject="mixed"]').focus();
    await page.keyboard.press("Home"); // first subject: MATH
    if (!(await checked(page, '[data-subject="math"]'))) problems.push("Home in the subject row did not pick MATH");
    const topicIds = await page.locator(".dt-chips.topics button").evaluateAll((bs) => bs.map((b) => b.dataset.topic));
    if (topicIds[0] !== "all" || !(await page.locator('[data-topic="all"]').innerText()).includes("ALL MATH")) problems.push(`first topic should be ALL MATH: ${topicIds}`);
    if (!(await checked(page, '[data-topic="all"]'))) problems.push("ALL MATH not selected after picking MATH");
    await page.locator('[data-topic="all"]').focus();
    for (let i = 0; i < topicIds.indexOf("ratios"); i++) await page.keyboard.press("ArrowRight");
    if (!(await checked(page, '[data-topic="ratios"]'))) problems.push("arrow keys did not reach Ratios & rates");
    const stored = await page.evaluate(() => [localStorage.getItem("arcade.dojo-tower.subject"), localStorage.getItem("arcade.dojo-tower.topic")]);
    if (stored.join() !== "math,ratios") problems.push(`stored ${stored}`);
    const line = await page.locator(".dt-focusline").innerText().catch(() => "");
    if (!line.includes("Ratios & rates")) problems.push(`title does not say every floor asks the topic: "${line}"`);
    await page.locator(".dt-cta.big").click();
    await page.waitForFunction(() => window.__dt.sim.mode === "run", null, { timeout: 6000 });
    // A gold-scroll ninja's question
    await page.evaluate(() => { const s = window.__dt.sim; s.invincible = true; s.enemies = []; s.player.facing = s.dir; const e = s.spawn("scroll", true); e.x = s.player.x + s.dir * 15; e.speed = 0; });
    await page.keyboard.press("z");
    await page.waitForSelector(".dt-quiz.scroll", { timeout: 3000 }).catch(() => problems.push("scroll question did not open"));
    let q = await quiz(page);
    if (!q || !RATIO.test(q.standard)) problems.push(`grade 7 ratios scroll asked ${q && q.standard} "${q && q.prompt}"`);
    if (q) {
      await page.keyboard.press(String(q.answer + 1));
      await page.waitForTimeout(150);
      await page.keyboard.press("Enter");
    }
    const seen = [];
    q = await bossQuestion(page).catch(() => null);
    if (!q) problems.push("grade 7 ratios: no boss question");
    else {
      const head = await page.locator(".dt-quiz .head").innerText();
      if (!head.includes("RATIOS & RATES")) problems.push(`boss header "${head}" should name the topic`);
      console.log(`  grade 7 ratios boss: [${q.standard}] ${q.skill}: ${q.prompt}`);
      await beatBoss(page, seen);
      await page.waitForFunction(() => window.__dt.sim.floor === 2, null, { timeout: 6000 }).catch(() => problems.push("did not reach floor 2"));
      const q2 = await bossQuestion(page).catch(() => null);
      if (q2) seen.push(q2);
      const off = seen.filter((x) => !RATIO.test(x.standard));
      if (off.length) problems.push(`off-topic boss questions: ${off.map((x) => x.standard).join(", ")}`);
      if (new Set(seen.map((x) => x.prompt)).size < seen.length) problems.push("a ratio question repeated within two floors");
    }
    // Remembered on the next visit
    await page.goto(`${BASE}?grade=7&debug`, { waitUntil: "load" });
    await page.waitForFunction(() => !!window.__dt);
    if (!(await checked(page, '[data-topic="ratios"]'))) problems.push("Ratios & rates not remembered");
    if (errors.length) problems.push(`console errors (grade 7): ${errors.join(" | ")}`);
    await ctx.close();
  }

  // 2. ?grade=4&topic=civics starts on Social Studies -> Civics.
  {
    const { ctx, page, errors } = await newPage(browser, { viewport: { width: 1280, height: 800 } });
    await page.goto(`${BASE}?grade=4&topic=civics&debug`, { waitUntil: "load" });
    await page.waitForFunction(() => !!window.__dt);
    if (!(await checked(page, '[data-subject="social"]')) || !(await checked(page, '[data-topic="civics"]'))) problems.push("?topic=civics did not preselect Social Studies -> Civics");
    const stored = await page.evaluate(() => localStorage.getItem("arcade.dojo-tower.topic"));
    if (stored) problems.push("a ?topic= link should not overwrite the saved choice");
    await page.keyboard.press("Enter");
    const q = await bossQuestion(page).catch(() => null);
    if (!q || !q.standard.includes("C&G")) problems.push(`grade 4 civics boss asked ${q && q.standard}`);
    else console.log(`  grade 4 civics boss: [${q.standard}] ${q.prompt}`);
    if (errors.length) problems.push(`console errors (grade 4): ${errors.join(" | ")}`);
    await ctx.close();
  }

  // 3. ?grade=2&topic=ratios: ignored, with a note; the tower plays MIXED. Then ALL SCIENCE.
  {
    const { ctx, page, errors } = await newPage(browser, { viewport: { width: 1280, height: 800 } });
    await page.goto(`${BASE}?grade=2&topic=ratios&debug`, { waitUntil: "load" });
    await page.waitForFunction(() => !!window.__dt);
    if (!(await checked(page, '[data-subject="mixed"]'))) problems.push("grade 2 ?topic=ratios should stay MIXED");
    const note = await page.locator(".dt-focusnote").innerText().catch(() => "");
    if (!/Ratios & rates is for Grades 6–8/.test(note)) problems.push(`grade 2 note: "${note}"`);
    await page.locator('[data-subject="math"]').click();
    const ratios = page.locator('[data-topic="ratios"]');
    if (!(await ratios.isDisabled()) || !(await ratios.innerText()).includes("Grades 6–8")) problems.push("ratios should be disabled at grade 2 with a grades note");
    await page.locator('[data-subject="mixed"]').click();
    await page.locator(".dt-cta.big").click(); // Enter would press the focused subject button
    let q = await bossQuestion(page).catch(() => null);
    if (!q || q.subject !== "ela") problems.push(`grade 2 MIXED floor 1 asked ${q && q.subject}`);
    // ALL SCIENCE
    await page.goto(`${BASE}?grade=5&subject=science&debug`, { waitUntil: "load" });
    await page.waitForFunction(() => !!window.__dt);
    if (!(await checked(page, '[data-topic="all"]'))) problems.push("?subject=science should pick ALL SCIENCE");
    await page.keyboard.press("Enter");
    q = await bossQuestion(page).catch(() => null);
    if (!q || q.subject !== "science") problems.push(`ALL SCIENCE floor 1 asked ${q && q.subject}`);
    if (errors.length) problems.push(`console errors (grade 2/5): ${errors.join(" | ")}`);
    await ctx.close();
  }

  // 4. Phones: the picker fits without sideways scroll, and topics are tappable.
  for (const width of [390, 360]) {
    const { ctx, page, errors } = await newPage(browser, { viewport: { width, height: 800 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
    await page.goto(`${BASE}?grade=7&topic=ratios&debug`, { waitUntil: "load" });
    await page.waitForFunction(() => !!window.__dt);
    await page.locator('[data-topic="fractions"]').tap();
    if (!(await checked(page, '[data-topic="fractions"]'))) problems.push(`${width}px: tapping a topic did not pick it`);
    for (const s of ["science", "ela", "social", "math"]) {
      await page.locator(`[data-subject="${s}"]`).tap();
      if (!(await noSideways(page))) problems.push(`${width}px: sideways scroll with ${s} topics shown`);
    }
    // Back on MATH the topic row starts at ALL MATH again; pick Fractions & decimals.
    if (!(await checked(page, '[data-topic="all"]'))) problems.push(`${width}px: MATH should come back on ALL MATH`);
    await page.locator('[data-topic="fractions"]').tap();
    const w = await page.evaluate(() => document.documentElement.scrollWidth);
    if (w > width) problems.push(`${width}px: page is ${w}px wide`);
    const small = await page.locator(".dt-subject, .dt-chip").evaluateAll((bs) => bs.filter((b) => b.getBoundingClientRect().height < 36).length);
    if (small) problems.push(`${width}px: ${small} picker buttons shorter than 36px`);
    if (process.env.PAGESHOT) await page.screenshot({ path: `${process.env.PAGESHOT}-picker-${width}.png`, fullPage: true });
    await page.locator(".dt-cta.big").tap();
    const q = await bossQuestion(page).catch(() => null);
    if (!q || !/\.(NF|NS|NBT)\./.test(q.standard)) problems.push(`${width}px fractions boss asked ${q && q.standard}`);
    if (!(await noSideways(page))) problems.push(`${width}px: sideways scroll in the boss quiz`);
    if (errors.length) problems.push(`console errors (${width}px): ${errors.join(" | ")}`);
    await ctx.close();
  }
  return problems;
}

/* ------------------------------------------------------------ floor masters, ten floors, ink stars */

const MIXED_ORDER = [
  "MADAME WORDWHIRL", "ABACUS OX", "JUDGE GAVEL-FIST", "DOCTOR MOMENTUM", "THE GRAND INKMASTER",
  "SIR SPELLSALOT", "PROFESSOR PROTRACTOR", "SENATOR SCROLL", "MAJOR MAGNET", "GRANDMASTER SKYBRUSH",
];

/** The title screen's floor list: [{n, boss, subject, hall}] */
const floorList = (page) =>
  page.locator(".dt-floors .dt-floorrow").evaluateAll((rows) =>
    rows.map((r) => ({ n: r.querySelector(".n").textContent, boss: r.querySelector(".boss").textContent, subject: r.dataset.bossSubject, hall: r.querySelector(".hall").textContent })),
  );

/** The title opens scrolled to the top: title visible, nothing scrolled. */
async function titleAtTop(page) {
  return page.evaluate(() => {
    const ov = document.querySelector(".dt-overlay.title");
    const panel = document.querySelector(".dt-panel.title");
    const title = document.querySelector(".dt-panel.title .dt-title");
    if (!ov || !panel || !title) return "no title screen";
    if (ov.scrollTop !== 0 || panel.scrollTop !== 0 || window.scrollY !== 0) return `scrolled: overlay ${ov.scrollTop}, panel ${panel.scrollTop}, window ${window.scrollY}`;
    const r = title.getBoundingClientRect();
    if (r.top < 0 || r.bottom > window.innerHeight) return `title off screen (top ${r.top})`;
    return "";
  });
}

/** Warp to this floor's master (desktop keys) and return the quiz header text. */
async function toBoss(page) {
  await page.waitForFunction(() => window.__dt.sim.mode === "run", null, { timeout: 6000 });
  await page.evaluate(() => { const s = window.__dt.sim; s.invincible = true; s.warpToBoss(); s.held[s.dir > 0 ? "right" : "left"] = true; });
  await page.waitForSelector(".dt-quiz.boss", { timeout: 8000 });
  await page.evaluate(() => { const s = window.__dt.sim; s.held.left = s.held.right = false; });
  return page.locator(".dt-quiz .head").innerText();
}

async function bossTests(browser) {
  const problems = [];
  const subjects = [
    { grade: "5", subject: "math", first: "ABACUS OX", last: "EMPRESS INFINITY", qs: "math" },
    { grade: "8", subject: "science", first: "DOCTOR MOMENTUM", last: "PROFESSOR QUARK", qs: "science" },
  ];
  for (const t of subjects) {
    const { ctx, page, errors } = await newPage(browser, { viewport: { width: 1280, height: 800 } });
    await page.goto(`${BASE}?grade=${t.grade}&debug`, { waitUntil: "load" });
    await page.waitForFunction(() => !!window.__dt);
    const at = await titleAtTop(page);
    if (at) problems.push(`grade ${t.grade} title: ${at}`);
    await page.locator(`[data-subject="${t.subject}"]`).click();
    const rows = await floorList(page);
    if (rows.length !== 10) problems.push(`${t.subject}: title lists ${rows.length} floors`);
    if (rows.some((r) => r.subject !== t.subject)) problems.push(`${t.subject}: title lists other subjects' masters: ${rows.filter((r) => r.subject !== t.subject).map((r) => r.boss)}`);
    if (new Set(rows.map((r) => r.boss)).size !== 10) problems.push(`${t.subject}: masters repeat on the title list`);
    if (rows[0] && rows[0].boss !== t.first) problems.push(`${t.subject}: 1F is ${rows[0] && rows[0].boss}`);
    if (rows[9] && rows[9].boss !== t.last) problems.push(`${t.subject}: 10F is ${rows[9] && rows[9].boss}`);
    if (rows.some((r) => MIXED_ORDER.slice(1, 5).includes(r.boss) && r.subject !== t.subject)) problems.push(`${t.subject}: MIXED masters leak into the list`);
    const line = await page.locator(".dt-focusline").innerText().catch(() => "");
    if (!line.includes("All 10 floor masters")) problems.push(`${t.subject}: focus line "${line}"`);
    // The picker stays visible above the list.
    const pickerTop = await page.locator(".dt-subjects").boundingBox();
    if (!pickerTop || pickerTop.y < 0 || pickerTop.y > 800) problems.push(`${t.subject}: subject picker not visible`);
    console.log(`  ${t.subject} @ grade ${t.grade}: ${rows.map((r) => r.boss).join(", ")}`);
    await page.locator(".dt-cta.big").click();
    await page.waitForFunction(() => window.__dt.sim.mode === "intro" || window.__dt.sim.mode === "run");
    const info = await page.evaluate(() => ({ name: window.__dt.sim.info.boss.name, subject: window.__dt.sim.info.boss.subject, hall: window.__dt.sim.info.hall }));
    if (info.name !== t.first || info.subject !== t.subject) problems.push(`${t.subject}: floor 1 master in the game is ${info.name} (${info.subject})`);
    const head = await toBoss(page).catch(() => "");
    if (!head.includes(`VS ${t.first}`)) problems.push(`${t.subject}: boss header "${head}"`);
    const q = await quiz(page);
    if (!q || q.subject !== t.qs) problems.push(`${t.subject}: floor 1 question was ${q && q.subject}`);
    // Debug skip to floor 10: the grand master, then the tower-cleared screen.
    await page.evaluate(() => { const s = window.__dt.sim; s.fight = null; s.startFloor(10); });
    const head10 = await toBoss(page).catch(() => "");
    if (!head10.includes(`VS ${t.last}`)) problems.push(`${t.subject}: floor 10 header "${head10}"`);
    if (SHOT && t.subject === "math") {
      await page.waitForTimeout(500);
      const data = await page.evaluate(() => document.querySelector(".dt-screen canvas").toDataURL("image/png"));
      fs.writeFileSync(SHOT, Buffer.from(data.split(",")[1], "base64"));
    }
    if (process.env.PAGESHOT) await page.screenshot({ path: `${process.env.PAGESHOT}-${t.subject}-floor10.png` });
    const seen = [];
    await beatBoss(page, seen);
    if (seen.some((x) => x.subject !== t.qs)) problems.push(`${t.subject}: floor 10 asked ${seen.map((x) => x.subject)}`);
    await page.waitForSelector(".dt-panel.won", { timeout: 6000 }).catch(() => problems.push(`${t.subject}: tower-cleared screen missing`));
    const won = await page.locator(".dt-panel.won").innerText().catch(() => "");
    if (!/TOWER CLEARED/.test(won) || !won.includes("All 10 floors") || !won.includes(t.last)) problems.push(`${t.subject}: won report "${won.slice(0, 240).replace(/\s+/g, " ")}"`);
    if (errors.length) problems.push(`console errors (${t.subject}): ${errors.join(" | ")}`);
    await ctx.close();
  }

  // MIXED keeps its order (and the title lists each floor's subject).
  {
    const { ctx, page, errors } = await newPage(browser, { viewport: { width: 1280, height: 800 } });
    await page.goto(`${BASE}?grade=3&subject=mixed&debug`, { waitUntil: "load" });
    await page.waitForFunction(() => !!window.__dt);
    const rows = await floorList(page);
    if (rows.map((r) => r.boss).join() !== MIXED_ORDER.join()) problems.push(`MIXED list: ${rows.map((r) => r.boss)}`);
    if (!rows[0] || !rows[0].hall.startsWith("WORD DOJO")) problems.push(`MIXED 1F hall: ${rows[0] && rows[0].hall}`);
    // Game over on floor 7 offers "Continue from floor 6" (score kept, same masters).
    await page.locator(".dt-cta.big").click();
    await page.waitForFunction(() => window.__dt.sim.mode === "intro" || window.__dt.sim.mode === "run");
    await page.evaluate(() => window.__dt.sim.startFloor(7));
    await page.waitForFunction(() => window.__dt.sim.mode === "run", null, { timeout: 6000 });
    await page.evaluate(() => { const s = window.__dt.sim; s.score = 4321; s.lives = 1; s.energy = 1; s.enemies = []; const e = s.spawn("ninja", true); e.x = s.player.x + 3; e.speed = 0; });
    await page.locator(".dt-panel", { hasText: "OUT OF LIVES" }).waitFor({ timeout: 6000 }).catch(() => problems.push("game-over report missing on floor 7"));
    const cont = page.locator(".dt-cta", { hasText: "Continue from floor 6" });
    if (!(await cont.count())) problems.push("no Continue from floor 6 button after a game over on floor 7");
    else {
      await cont.click();
      await page.waitForFunction(() => window.__dt.sim.floor === 6, null, { timeout: 4000 }).catch(() => problems.push("Continue did not start floor 6"));
      const c = await page.evaluate(() => ({ lives: window.__dt.sim.lives, boss: window.__dt.sim.info.boss.name, score: window.__dt.sim.score }));
      if (c.lives !== 3 || c.boss !== MIXED_ORDER[5] || c.score < 4321) problems.push(`continue: ${JSON.stringify(c)}`);
      if (!(await page.locator(".dt-hud").innerText()).includes("6/10")) problems.push("HUD should say 6/10 after continuing");
    }
    if (errors.length) problems.push(`console errors (MIXED): ${errors.join(" | ")}`);
    await ctx.close();
  }
  return problems;
}

/** Puts a star-throwing ninja in front of the student and poofs it with a punch (key Z or the PUNCH button). */
async function poofThrower(page, touch) {
  await page.evaluate(() => {
    const s = window.__dt.sim;
    s.enemies = [];
    s.shots = [];
    s.player.facing = s.dir;
    const e = s.spawn("thrower", true);
    e.x = s.player.x + s.dir * 15;
    e.speed = 0;
    e.throwT = 99;
  });
  if (touch) await page.locator(".dt-touch.punch").tap();
  else await page.keyboard.press("z");
  await page.waitForTimeout(350);
}

async function starTests(browser) {
  const problems = [];
  // Desktop: keyboard S
  {
    const { ctx, page, errors } = await newPage(browser, { viewport: { width: 1280, height: 800 } });
    await page.goto(`${BASE}?grade=4&debug`, { waitUntil: "load" });
    await page.waitForFunction(() => !!window.__dt);
    await page.locator(".dt-cta.big").click();
    await page.waitForFunction(() => window.__dt.sim.mode === "run", null, { timeout: 6000 });
    await page.evaluate(() => { const s = window.__dt.sim; s.invincible = true; s.spawnT = 1e9; s.scrollsLeft = []; s.enemies = []; });
    const hudStars = () => page.locator(".dt-starhud").innerText();
    if (!(await hudStars()).includes("0/5")) problems.push(`star HUD at start: "${await hudStars()}"`);
    // A plain ninja does not count
    await page.evaluate(() => { const s = window.__dt.sim; s.player.facing = s.dir; const e = s.spawn("ninja", true); e.x = s.player.x + s.dir * 15; e.speed = 0; });
    await page.keyboard.press("z");
    await page.waitForTimeout(350);
    if ((await page.evaluate(() => window.__dt.sim.starCount)) !== 0) problems.push("a plain ninja counted toward the ink stars");
    // S before the burst throws nothing
    await page.keyboard.press("s");
    if ((await page.evaluate(() => window.__dt.sim.stars.length)) !== 0) problems.push("S threw a star before the burst");
    for (let i = 1; i <= 5; i++) {
      await poofThrower(page, false);
      const n = await page.evaluate(() => window.__dt.sim.starCount);
      if (n !== i) problems.push(`after ${i} throwers the count is ${n}`);
      if (i === 3 && !(await hudStars()).includes("3/5")) problems.push(`HUD after 3: "${await hudStars()}"`);
    }
    const burst = await page.evaluate(() => window.__dt.sim.burstT);
    if (!(burst > 6)) problems.push(`no burst after five throwers (${burst})`);
    await page.waitForTimeout(250);
    if (!(await page.locator(".dt-starhud .dt-burstbar").count())) problems.push("no burst timer bar in the HUD");
    // Throw at a ninja far ahead
    const far = await page.evaluate(() => { const s = window.__dt.sim; s.enemies = []; s.player.facing = s.dir; const e = s.spawn("ninja", true); e.x = s.player.x + s.dir * 100; e.speed = 0; return e.id; });
    await page.keyboard.press("s");
    const thrown = await page.evaluate(() => window.__dt.sim.stars.length);
    if (thrown < 1) problems.push("S did not throw an ink star during the burst");
    await page.waitForTimeout(800);
    const alive = await page.evaluate((id) => window.__dt.sim.enemies.some((e) => e.id === id), far);
    if (alive) problems.push("the ink star did not poof the ninja 100px ahead");
    if (process.env.PAGESHOT) await page.screenshot({ path: `${process.env.PAGESHOT}-stars.png` });
    // The burst runs out and the counter resets
    await page.waitForFunction(() => window.__dt.sim.burstT === 0, null, { timeout: 12000 }).catch(() => problems.push("the burst never ran out"));
    await page.waitForTimeout(250);
    if ((await page.evaluate(() => window.__dt.sim.starCount)) !== 0 || !(await hudStars()).includes("0/5")) problems.push(`counter did not reset: "${await hudStars()}"`);
    // S never touches a floor master
    await page.evaluate(() => { const s = window.__dt.sim; s.starCount = 5; s.burstT = 8; });
    await toBoss(page).catch(() => problems.push("boss fight did not start (stars)"));
    const hp0 = await page.evaluate(() => window.__dt.sim.fight.hp);
    await page.keyboard.press("s");
    await page.evaluate(() => window.__dt.press("star"));
    await page.waitForTimeout(500);
    const after = await page.evaluate(() => ({ hp: window.__dt.sim.fight.hp, stars: window.__dt.sim.stars.length }));
    if (after.hp !== hp0 || after.stars !== 0) problems.push(`ink stars touched the floor master: ${JSON.stringify(after)}`);
    if (errors.length) problems.push(`console errors (stars, desktop): ${errors.join(" | ")}`);
    await ctx.close();
  }
  // Phone: the ★ button
  for (const width of [390, 360]) {
    const { ctx, page, errors } = await newPage(browser, { viewport: { width, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
    await page.goto(`${BASE}?grade=2&debug`, { waitUntil: "load" });
    await page.waitForFunction(() => !!window.__dt);
    const at = await titleAtTop(page);
    if (at) problems.push(`${width}px title: ${at}`);
    if (!(await noSideways(page))) problems.push(`${width}px: sideways scroll on the title`);
    const listBox = await page.locator(".dt-floors").boundingBox();
    if (!listBox || listBox.height > 260) problems.push(`${width}px: floor list too tall (${listBox && listBox.height}px)`);
    await page.locator(".dt-cta.big").tap();
    await page.waitForFunction(() => window.__dt.sim.mode === "run", null, { timeout: 6000 });
    await page.evaluate(() => { const s = window.__dt.sim; s.invincible = true; s.spawnT = 1e9; s.scrollsLeft = []; s.enemies = []; s.starCount = 4; });
    const star = page.locator(".dt-touch.star");
    if (!(await star.isVisible())) problems.push(`${width}px: no ★ button`);
    const sb = await star.boundingBox();
    if (!sb || sb.x < 0 || sb.x + sb.width > width) problems.push(`${width}px: ★ button off screen ${JSON.stringify(sb)}`);
    if (await star.evaluate((b) => b.classList.contains("ready"))) problems.push(`${width}px: ★ lit before the burst`);
    await poofThrower(page, true);
    if (!((await page.evaluate(() => window.__dt.sim.burstT)) > 0)) problems.push(`${width}px: the fifth thrower did not start the burst`);
    await page.waitForTimeout(200);
    if (!(await star.evaluate((b) => b.classList.contains("ready")))) problems.push(`${width}px: ★ not lit during the burst`);
    const far = await page.evaluate(() => { const s = window.__dt.sim; s.enemies = []; s.player.facing = s.dir; const e = s.spawn("blob", true); e.x = s.player.x + s.dir * 80; e.speed = 0; return e.id; });
    await star.tap();
    await page.waitForTimeout(800);
    if (await page.evaluate((id) => window.__dt.sim.enemies.some((e) => e.id === id), far)) problems.push(`${width}px: tapping ★ did not poof the ink blob ahead`);
    if (!(await noSideways(page))) problems.push(`${width}px: sideways scroll while playing`);
    const w = await page.evaluate(() => document.documentElement.scrollWidth);
    if (w > width) problems.push(`${width}px: page is ${w}px wide`);
    if (process.env.PAGESHOT) await page.screenshot({ path: `${process.env.PAGESHOT}-stars-${width}.png` });
    if (errors.length) problems.push(`console errors (${width}px stars): ${errors.join(" | ")}`);
    await ctx.close();
  }
  return problems;
}

(async () => {
  const browser = await chromium.launch();
  let bad = 0;
  for (const g of GRADES) {
    for (const mode of ["keys", "touch"]) {
      const p = await run(browser, g, mode);
      console.log(`grade ${g} ${mode}: ${p.length ? "PROBLEMS\n  - " + p.join("\n  - ") : "ok"}`);
      bad += p.length;
    }
  }
  for (const [name, fn] of [["floor masters / ten floors", bossTests], ["ink stars", starTests]]) {
    const p = await fn(browser);
    console.log(`${name}: ${p.length ? "PROBLEMS\n  - " + p.join("\n  - ") : "ok"}`);
    bad += p.length;
  }
  if (process.env.FOCUS !== "0") {
    const p = await focusTests(browser);
    console.log(`subject / topic picker: ${p.length ? "PROBLEMS\n  - " + p.join("\n  - ") : "ok"}`);
    bad += p.length;
  }
  await browser.close();
  process.exit(bad ? 1 : 0);
})();
