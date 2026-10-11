/*
 * Automated playtest (dev only). Needs the built game served at /dojo-tower/ with the arcade's
 * /fonts/ next to it, and a global Playwright (Chromium):
 *   npm run build
 *   (serve a folder holding dojo-tower -> dist and fonts -> ../../site/fonts on port 8771)
 *   node scripts/playtest.cjs          (SHOT=../../site/img/dojo-tower.png saves a 640x400 boss-fight picture)
 * For each grade: keyboard on a 1280x800 desktop, then touch on a 390x844 phone. It checks the grade
 * badge, starts the game, walks, punches a ninja, ducks, jumps, reaches the floor master, answers wrong
 * (blocked: boss HP, lives and energy unchanged) and right (combo hits) until the master is beaten,
 * climbs to floor 2, checks there is no sideways scrolling and no console errors.
 */
const path = require("path");
const fs = require("fs");
const { execSync } = require("child_process");
const { chromium } = require(path.join(execSync("npm root -g").toString().trim(), "playwright"));

const BASE = process.env.BASE || "http://127.0.0.1:8771/dojo-tower/";
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
const quiz = (page) => page.evaluate(() => (window.__dtQuiz ? { answer: window.__dtQuiz.q.answer, picked: window.__dtQuiz.picked, kind: window.__dtQuiz.kind, prompt: window.__dtQuiz.q.prompt, grade: window.__dtQuiz.q.grade, subject: window.__dtQuiz.q.subject } : null));

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
    if (!r.url().startsWith("http://127.0.0.1:8771/") && !r.url().startsWith("data:")) external.push(r.url());
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
  let shotSaved = false;
  while (rounds < 12) {
    if (touch) await tap(page.locator(".dt-quiz .dt-cta"));
    else await page.keyboard.press("Enter");
    await page.waitForTimeout(250);
    qz = await quiz(page);
    if (!qz) break;
    if (qz.picked !== null) continue;
    if (SHOT && !touch && !shotSaved && rounds === 1) {
      await page.waitForTimeout(300);
      const data = await page.evaluate(() => document.querySelector(".dt-screen canvas").toDataURL("image/png"));
      fs.writeFileSync(SHOT, Buffer.from(data.split(",")[1], "base64"));
      shotSaved = true;
    }
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
  if (!hudFloor.includes("2/5")) problems.push(`HUD floor: ${hudFloor.replace(/\s+/g, " ")}`);

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
    // Tower cleared: jump to floor 5 and beat the Grand Inkmaster
    await page.evaluate(() => { const s = window.__dt.sim; s.startFloor(5); });
    await page.waitForFunction(() => window.__dt.sim.mode === "run", null, { timeout: 5000 });
    await page.evaluate(() => { const s = window.__dt.sim; s.warpToBoss(); s.held[s.dir > 0 ? "right" : "left"] = true; });
    await page.waitForSelector(".dt-quiz.boss", { timeout: 8000 }).catch(() => problems.push("floor 5 boss question missing"));
    await page.evaluate(() => { const s = window.__dt.sim; s.held.left = s.held.right = false; });
    for (let i = 0; i < 12; i++) {
      const q = await quiz(page);
      if (!q) break;
      if (q.picked === null) await page.keyboard.press(String(q.answer + 1));
      await page.waitForTimeout(300);
      await page.keyboard.press("Enter");
      await page.waitForTimeout(200);
    }
    await page.waitForSelector(".dt-panel.won", { timeout: 6000 }).catch(() => problems.push("tower-cleared screen missing"));
    const rows = await page.locator(".dt-report-table tbody tr").count();
    if (rows < 2) problems.push(`report shows ${rows} standards`);
    // Game over: play again, then lose every life
    await page.locator(".dt-cta", { hasText: "Play again" }).click();
    await page.waitForFunction(() => window.__dt.sim.mode === "run", null, { timeout: 5000 });
    await page.evaluate(() => { const s = window.__dt.sim; s.lives = 1; s.energy = 1; s.enemies = []; const e = s.spawn("ninja", true); e.x = s.player.x + 3; e.speed = 0; });
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
  await browser.close();
  process.exit(bad ? 1 : 0);
})();
