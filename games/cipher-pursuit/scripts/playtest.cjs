/*
 * Automated playtest (dev only). Needs the built game served at /cipher-pursuit/ with the
 * arcade fonts at /fonts/, and a global Playwright:
 *   npm run build && (serve dist at http://127.0.0.1:8772/cipher-pursuit/) &
 *   node scripts/playtest.cjs        (SHOT=../../site/img/cipher-pursuit.png saves the cabinet picture)
 *
 * For each grade (default 2 and 7), on a 1280x800 keyboard screen:
 *   start from the title, steer left/right, change speed, fire foam and splat a Smudge car,
 *   drive (for real, in ?god mode so traffic can't end the run) to the first code checkpoint,
 *   answer it by STEERING into the right lane, then the next by NUMBER KEY, then a WRONG one by
 *   LETTER KEY (checks the explanation shows and no car is lost), pause/resume, and finally run
 *   out of cars to see the mission report. Then on a 390x844 phone (touch): no sideways scroll on
 *   the title, while driving and at a checkpoint; touch pads show; FIRE and tapping an answer work.
 * Fails on any console error or page error.
 */
const path = require("path");
const fs = require("fs");
const { execSync } = require("child_process");
const { chromium } = require(path.join(execSync("npm root -g").toString().trim(), "playwright"));

const BASE = process.env.BASE || "http://127.0.0.1:8772/cipher-pursuit/";
const GRADES = (process.env.GRADES || "2,7").split(",");
const SHOT = process.env.SHOT;

const problems = [];
const note = (grade, msg) => problems.push(`[grade ${grade}] ${msg}`);

const sim = (page) =>
  page.evaluate(() => {
    const s = window.__cp();
    return {
      phase: s.phase, x: s.x, dist: s.dist, speed: s.speed, lives: s.lives, score: s.score, splats: s.splats, shots: s.shots.length,
      cleared: s.cleared, correct: s.correctCount, lock: s.cp.lock, answer: s.cp.q ? s.cp.q.answer : null, choices: s.cp.q ? s.cp.q.choices : null,
      prompt: s.cp.q ? s.cp.q.prompt : null, gateIn: s.cp.gateWy - s.dist, shield: s.shield, turbo: s.turbo, smoke: s.smoke,
    };
  });
const laneCenter = (i) => 12 + 74 * (i + 0.5);

async function waitPhase(page, phase, ms = 40000) {
  await page.waitForFunction((p) => window.__cp() && window.__cp().phase === p, phase, { timeout: ms });
}

async function steerTo(page, x) {
  for (let i = 0; i < 60; i++) {
    const s = await sim(page);
    const dx = x - s.x;
    if (Math.abs(dx) < 6) return;
    const key = dx < 0 ? "ArrowLeft" : "ArrowRight";
    await page.keyboard.down(key);
    await page.waitForTimeout(Math.min(250, Math.abs(dx) * 7));
    await page.keyboard.up(key);
  }
}

function watchErrors(page, errors) {
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  page.on("requestfailed", (r) => errors.push(`request failed: ${r.url()}`));
  page.on("request", (r) => {
    if (!r.url().startsWith("http://127.0.0.1")) errors.push(`external request: ${r.url()}`);
  });
}

async function desktop(browser, grade) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();
  const errors = [];
  watchErrors(page, errors);
  await page.goto(`${BASE}?grade=${grade}&debug&god`, { waitUntil: "load" });
  await page.waitForFunction(() => !!window.__cp && !!window.__cp());

  const badge = await page.locator(".cp-gradebadge").innerText().catch(() => "");
  if (!badge.includes(grade === "K" ? "KINDERGARTEN" : `GRADE ${grade}`)) note(grade, `grade badge "${badge}"`);
  if ((await page.locator(".cp-grade").count()) !== 0) note(grade, "grade picker shown although ?grade= was given");
  await page.locator(".cp-cta", { hasText: "How to play" }).click();
  if (!(await page.locator(".cp-help li").count())) note(grade, "How to play didn't open");
  await page.locator(".cp-cta", { hasText: "Start mission" }).click();
  await page.waitForTimeout(400);
  let s = await sim(page);
  if (s.phase !== "drive") note(grade, `after start phase ${s.phase}`);
  if (await page.locator(".cp-controls.show").count()) note(grade, "touch pads shown for keyboard/mouse");

  // Steering
  const x0 = s.x;
  await page.keyboard.down("ArrowLeft");
  await page.waitForTimeout(350);
  await page.keyboard.up("ArrowLeft");
  s = await sim(page);
  if (!(s.x < x0 - 10)) note(grade, `ArrowLeft didn't steer (${x0} → ${s.x})`);
  const x1 = s.x;
  await page.keyboard.down("ArrowRight");
  await page.waitForTimeout(500);
  await page.keyboard.up("ArrowRight");
  s = await sim(page);
  if (!(s.x > x1 + 10)) note(grade, `ArrowRight didn't steer (${x1} → ${s.x})`);
  // Speed
  const v0 = s.speed;
  await page.keyboard.down("ArrowUp");
  await page.waitForTimeout(600);
  await page.keyboard.up("ArrowUp");
  s = await sim(page);
  if (!(s.speed > v0 + 15)) note(grade, `ArrowUp didn't speed up (${v0} → ${s.speed})`);
  await page.keyboard.down("ArrowDown");
  await page.waitForTimeout(400);
  await page.keyboard.up("ArrowDown");
  // A–D must not move the car
  const xa = (await sim(page)).x;
  for (const k of ["a", "d", "A", "D"]) await page.keyboard.press(k);
  await page.waitForTimeout(150);
  if (Math.abs((await sim(page)).x - xa) > 3) note(grade, "A/D moved the car while driving");

  // Fire: put a Smudge car straight ahead and blast it.
  await page.evaluate(() => {
    const s = window.__cp();
    s.enemies.push({ id: 99999, kind: "smudge", off: s.x - s.roadAt(s.dist + 70).cx, wy: s.dist + 70, vy: s.speed, w: 10, h: 15, state: "live", t: 0, boat: false });
  });
  const before = (await sim(page)).splats;
  await page.keyboard.down(" ");
  await page.waitForTimeout(700);
  await page.keyboard.up(" ");
  s = await sim(page);
  if (!(s.splats > before)) note(grade, "foam blaster didn't splat the Smudge car ahead");

  // Drive for real to the first checkpoint (god mode only stops crashes), keeping to the road.
  const t0 = Date.now();
  while ((await sim(page)).phase === "drive" && Date.now() - t0 < 45000) {
    await page.evaluate(() => {
      const s = window.__cp();
      s.input.targetX = s.roadAt(s.dist + 30).cx;
    });
    await page.waitForTimeout(250);
  }
  await page.evaluate(() => (window.__cp().input.targetX = null));
  s = await sim(page);
  if (s.phase !== "approach") {
    note(grade, `never reached a checkpoint by driving (phase ${s.phase})`);
    await ctx.close();
    return errors;
  }
  const drove = ((Date.now() - t0) / 1000).toFixed(1);
  const radioPrompt = await page.locator(".cp-radio .prompt").innerText();
  if (!radioPrompt.includes(s.prompt.slice(0, 20))) note(grade, `radio shows "${radioPrompt}" not the code "${s.prompt}"`);
  const opts = await page.locator(".cp-radio .opt span").allInnerTexts();
  if (JSON.stringify(opts) !== JSON.stringify(s.choices)) note(grade, `answer buttons ${JSON.stringify(opts)} vs ${JSON.stringify(s.choices)}`);
  if (s.choices.some((c) => c.length > 14)) note(grade, `long lane label ${JSON.stringify(s.choices)}`);
  const log = [`drove ${drove}s to checkpoint 1: "${s.prompt}" ${JSON.stringify(s.choices)} → lane ${s.answer + 1}`];

  // 1) Answer by STEERING into the right lane.
  await steerTo(page, laneCenter(s.answer));
  // Hold course while the gates come (a little extra speed with ArrowUp).
  await page.keyboard.down("ArrowUp");
  await waitPhase(page, "debrief");
  await page.keyboard.up("ArrowUp");
  s = await sim(page);
  let head = await page.locator(".cp-radio .head").innerText();
  if (s.correct !== 1 || !head.includes("CODE CRACKED")) note(grade, `steer-to-answer not counted right (correct=${s.correct}, head "${head}")`);
  await page.waitForTimeout(1600);
  const gadgetsOn = await page.evaluate(() => {
    const s = window.__cp();
    return s.shield || s.turbo > 0 || s.smoke > 0;
  });
  if (!gadgetsOn) note(grade, "no gadget after a right answer");
  if (SHOT && grade === GRADES[GRADES.length - 1]) await page.screenshot({ path: SHOT.replace(/\.png$/, "-debrief-full.png") }).catch(() => {});
  await page.keyboard.press("Enter");
  await page.waitForTimeout(200);
  if ((await sim(page)).phase !== "drive") note(grade, "Enter didn't drive on after the debrief");

  // 2) Answer by NUMBER KEY.
  await page.evaluate(() => window.__cp().skipToCheckpoint());
  await waitPhase(page, "approach", 5000);
  s = await sim(page);
  log.push(`checkpoint 2: "${s.prompt}" → key ${s.answer + 1}`);
  await page.keyboard.press(String(s.answer + 1));
  await page.waitForTimeout(150);
  if ((await sim(page)).lock !== s.answer) note(grade, "number key didn't lock the lane");
  await waitPhase(page, "debrief");
  s = await sim(page);
  if (s.correct !== 2) note(grade, `number-key answer not right (correct=${s.correct})`);
  await page.waitForTimeout(1300);
  await page.locator(".cp-radio .cp-cta", { hasText: "Drive on" }).click();
  await page.waitForTimeout(150);

  // 3) A WRONG answer by LETTER KEY: explanation shows, no car lost, game goes on.
  await page.evaluate(() => window.__cp().skipToCheckpoint());
  await waitPhase(page, "approach", 5000);
  s = await sim(page);
  const wrong = (s.answer + 2) % 4;
  const livesBefore = s.lives;
  log.push(`checkpoint 3: "${s.prompt}" → wrong key ${"ABCD"[wrong]}`);
  await page.keyboard.press("abcd"[wrong]);
  await waitPhase(page, "debrief");
  s = await sim(page);
  head = await page.locator(".cp-radio .head").innerText();
  const expl = await page.locator(".cp-radio .prompt").innerText();
  if (!head.includes("WRONG LANE")) note(grade, `wrong answer head "${head}"`);
  if (expl.length < 20) note(grade, "no explanation after a wrong answer");
  if (s.lives !== livesBefore || s.phase === "over") note(grade, "a wrong answer cost a car / ended the game");
  if (s.correct !== 2) note(grade, "wrong answer counted as right");
  log.push(`explanation: ${expl.replace(/\s+/g, " ").slice(0, 120)}`);
  await page.waitForTimeout(1300);
  await page.keyboard.press(" ");
  await page.waitForTimeout(150);

  // Pause / resume
  await page.keyboard.press("p");
  await page.waitForTimeout(150);
  if (!(await page.locator(".cp-title", { hasText: "PAUSED" }).count())) note(grade, "P didn't pause");
  const d0 = (await sim(page)).dist;
  await page.waitForTimeout(300);
  if ((await sim(page)).dist !== d0) note(grade, "game kept moving while paused");
  await page.keyboard.press("Escape");
  await page.waitForTimeout(150);
  if (await page.locator(".cp-title", { hasText: "PAUSED" }).count()) note(grade, "Esc didn't resume");

  // Screenshot material: a 4-lane checkpoint with the gates in view.
  if (SHOT && grade === GRADES[GRADES.length - 1]) {
    await page.evaluate(() => window.__cp().skipToCheckpoint());
    await waitPhase(page, "approach", 5000);
    // Line up with the answer lane early and let the gates scroll into view.
    await page.waitForFunction(() => {
      const s = window.__cp();
      s.input.targetX = 12 + 74 * (s.cp.q.answer + 0.5) - 30;
      return s.cp.gateWy - s.dist < 112;
    }, null, { timeout: 30000 });
    await page.keyboard.press("p");
    await page.waitForTimeout(100);
    const data = await page.evaluate(() => {
      const src = document.querySelector("canvas");
      const c = document.createElement("canvas");
      c.width = 640;
      c.height = 400;
      const g = c.getContext("2d");
      g.imageSmoothingEnabled = false;
      g.drawImage(src, 0, 0, 640, 400);
      return c.toDataURL("image/png");
    });
    fs.writeFileSync(SHOT, Buffer.from(data.split(",")[1], "base64"));
    await page.keyboard.press("p");
    log.push(`screenshot saved to ${SHOT}`);
  }

  // Run out of cars: crashes end the game and show the mission report.
  await page.evaluate(() => {
    const s = window.__cp();
    s.god = false;
  });
  if ((await sim(page)).phase !== "drive") {
    await waitPhase(page, "debrief").catch(() => {});
    await page.evaluate(() => window.__cp().continueDrive());
  }
  for (let k = 0; k < 6 && (await sim(page)).phase !== "over"; k++) {
    await page.evaluate(() => {
      const s = window.__cp();
      if (s.phase !== "drive") return;
      s.invuln = 0;
      s.shield = false;
      s.turbo = 0;
      s.smoke = 0;
      s.enemies.push({ id: 5000 + Math.random(), kind: "smudge", off: s.x - s.roadAt(s.dist).cx, wy: s.dist + 2, vy: 0, w: 10, h: 15, state: "live", t: 0, boat: false });
    });
    await page.waitForTimeout(1800);
  }
  if (!(await page.locator(".cp-h", { hasText: "MISSION OVER" }).count())) note(grade, "no mission report after running out of cars");
  else {
    const rows = await page.locator(".cp-report tbody tr").count();
    if (rows < 1) note(grade, "mission report has no standards");
    log.push(`mission report rows: ${rows}`);
  }
  console.log(`grade ${grade} desktop:\n  ` + log.join("\n  "));
  await ctx.close();
  return errors;
}

async function phone(browser, grade) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 3 });
  const page = await ctx.newPage();
  const errors = [];
  watchErrors(page, errors);
  await page.goto(`${BASE}?grade=${grade}&debug&god`, { waitUntil: "load" });
  await page.waitForFunction(() => !!window.__cp && !!window.__cp());
  const noSideScroll = async (where) => {
    const m = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, bw: document.body.scrollWidth, iw: window.innerWidth }));
    if (m.sw > m.iw || m.bw > m.iw) note(grade, `phone: sideways scroll on ${where} (${m.sw}/${m.bw} > ${m.iw})`);
  };
  await noSideScroll("title");
  await page.locator(".cp-cta", { hasText: "Start mission" }).tap();
  await page.waitForTimeout(400);
  await noSideScroll("driving");
  if (!(await page.locator(".cp-controls.show").count())) note(grade, "phone: touch pads hidden");
  const box = await page.locator("canvas").boundingBox();
  if (!box || box.width < 300 || box.x < 0 || box.x + box.width > 390) note(grade, `phone: canvas box ${JSON.stringify(box)}`);
  // Hold ◀ to steer
  const x0 = (await sim(page)).x;
  const left = page.locator('[aria-label="Steer left"]');
  const lb = await left.boundingBox();
  await page.touchscreen.tap(lb.x + lb.width / 2, lb.y + lb.height / 2);
  await page.dispatchEvent('[aria-label="Steer left"]', "pointerdown");
  await page.waitForTimeout(300);
  await page.dispatchEvent('[aria-label="Steer left"]', "pointerup");
  if (!((await sim(page)).x < x0 - 5)) note(grade, "phone: ◀ button didn't steer");
  // FIRE
  const shotsBefore = await page.evaluate(() => window.__cp().shots.length + window.__cp().splats);
  await page.dispatchEvent('[aria-label="Fire foam"]', "pointerdown");
  await page.waitForTimeout(120);
  const shotsAfter = await page.evaluate(() => window.__cp().shots.length + window.__cp().splats);
  await page.dispatchEvent('[aria-label="Fire foam"]', "pointerup");
  if (!(shotsAfter > shotsBefore)) note(grade, "phone: FIRE didn't fire");
  // Checkpoint: tap the right answer button
  await page.evaluate(() => window.__cp().skipToCheckpoint());
  await waitPhase(page, "approach", 5000);
  await page.waitForTimeout(200);
  await noSideScroll("checkpoint");
  const s = await sim(page);
  await page.locator(".cp-radio .opt").nth(s.answer).tap();
  await page.waitForTimeout(150);
  if ((await sim(page)).lock !== s.answer) note(grade, "phone: tapping an answer didn't lock its lane");
  await waitPhase(page, "debrief");
  if ((await sim(page)).correct !== 1) note(grade, "phone: tapped answer not counted");
  await noSideScroll("debrief");
  await page.screenshot({ path: path.join(process.env.OUT || "/tmp", `cp-phone-g${grade}.png`) });
  await page.locator(".cp-radio .cp-cta", { hasText: "Drive on" }).tap();
  await page.waitForTimeout(200);
  if ((await sim(page)).phase !== "drive") note(grade, "phone: Drive on didn't continue");
  // Drag on the road to steer
  const cb = await page.locator("canvas").boundingBox();
  const x1 = (await sim(page)).x;
  await page.dispatchEvent("canvas", "pointerdown", { clientX: cb.x + cb.width * 0.9, clientY: cb.y + cb.height * 0.7, pointerId: 7 });
  await page.waitForTimeout(500);
  await page.dispatchEvent("canvas", "pointerup", { pointerId: 7 });
  if (!((await sim(page)).x > x1 + 5)) note(grade, "phone: dragging on the road didn't steer");
  console.log(`grade ${grade} phone: ok checks done`);
  await ctx.close();
  return errors;
}

(async () => {
  const browser = await chromium.launch();
  for (const g of GRADES) {
    const errs = [...(await desktop(browser, g)), ...(await phone(browser, g))];
    for (const e of errs) note(g, `console/page error: ${e}`);
  }
  // No ?grade=: the game shows its own grade picker.
  const page = await browser.newPage();
  await page.goto(BASE, { waitUntil: "load" });
  if ((await page.locator(".cp-grade").count()) !== 13) note("-", "grade picker missing without ?grade=");
  await browser.close();
  if (problems.length) {
    console.log("PROBLEMS:\n" + problems.join("\n"));
    process.exit(1);
  }
  console.log("PLAYTEST OK");
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
