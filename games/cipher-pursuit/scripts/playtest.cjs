/*
 * Automated playtest (dev only). Needs the built game served at /cipher-pursuit/ with the
 * arcade fonts at /fonts/, and a global Playwright:
 *   npm run build && (serve dist at http://127.0.0.1:8782/cipher-pursuit/) &
 *   node scripts/playtest.cjs        (SHOT=../../site/img/cipher-pursuit.png saves the cabinet picture)
 *
 * For each grade (default 2 and 7), on a 1280x800 keyboard screen:
 *   start from the title, steer left/right, change speed, fire foam and splat a Smudge car,
 *   drive (for real, in ?god mode so traffic can't end the run) to the first code checkpoint,
 *   answer it by STEERING into the right lane, then the next by NUMBER KEY, then a WRONG one by
 *   LETTER KEY (checks the explanation shows and no car is lost), pause/resume, and finally run
 *   out of cars to see the mission report. Then on a 390x844 phone (touch): no sideways scroll on
 *   the title, while driving and at a checkpoint; touch pads show; FIRE and tapping an answer work.
 * Subject + topic: MIXED is the default; at grade 7 pick MATH (keyboard, arrows in the subject row)
 *   then Ratios & rates, drive to the first checkpoint and check it is a rate/ratio question, the
 *   radio shows the topic, the choice is saved (arcade.cipher-pursuit.subject / .topic) and the
 *   mission report names it; ?grade=5&topic=codes starts on MATH · Secret codes with an easy cipher;
 *   ?grade=1&topic=ratios falls back to ALL MATH with a note; the picker has no sideways scroll at
 *   390 and 360 px.
 * Timing: RELAXED is the default; at grade 2 drive to a checkpoint, wait 60 s without answering
 *   and check the car is still waiting at the gates (no result, no car lost, "take your time"
 *   shown), then answer. At grade 7 pick NORMAL: the time bar shows, the timer is at least the
 *   floor (25 s ciphers / story problems, 15 s facts) and the gate doesn't come before it runs out.
 *   SPEEDY can be picked, is remembered (arcade.cipher-pursuit.timing) and has a shorter timer.
 *   The timing picker and time bar have no sideways scroll on a 390 px phone.
 * Fails on any console error or page error.
 */
const path = require("path");
const fs = require("fs");
const { execSync } = require("child_process");
const { chromium } = require(path.join(execSync("npm root -g").toString().trim(), "playwright"));

const BASE = process.env.BASE || "http://127.0.0.1:8782/cipher-pursuit/";
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
  const timingOver = await page.evaluate(() => [...document.querySelectorAll(".cp-timings button")].filter((b) => {
    const r = b.getBoundingClientRect();
    return r.left < -0.5 || r.right > window.innerWidth + 0.5;
  }).length);
  if ((await page.locator(".cp-timings button").count()) !== 3 || timingOver) note(grade, `phone: timing picker overflows (${timingOver})`);
  await page.locator('.cp-timing[data-timing="normal"]').tap();
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
  if (!(await page.locator(".cp-timebar.timed").isVisible())) note(grade, "phone: NORMAL time bar not visible at a checkpoint");
  const tb = await page.locator(".cp-timebar").boundingBox();
  if (!tb || tb.x < 0 || tb.x + tb.width > 390.5) note(grade, `phone: time bar box ${JSON.stringify(tb)}`);
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

const WORDY = ["drt", "rate", "ratio", "pctof", "pctchange", "fracrate", "mpg", "slope", "rateTable", "chase", "lineq", "lineParam", "avgRate", "multWord", "bigMult", "addSub"];
const clock = (page) =>
  page.evaluate(() => {
    const s = window.__cp();
    const c = s.cp;
    return {
      phase: s.phase, timing: s.timing, total: c.timeTotal === Infinity ? "inf" : c.timeTotal, left: c.timeLeft === Infinity ? "inf" : c.timeLeft,
      voice: c.voiceWait, waiting: s.waiting, released: c.released, gateIn: c.gateWy - s.dist, speed: s.speed, lives: s.lives,
      cleared: s.cleared, correct: s.correctCount, answer: c.q ? c.q.answer : null, family: c.q ? c.q.family : null, prompt: c.q ? c.q.prompt : null,
      live: s.enemies.filter((e) => e.state === "live").length,
    };
  });

/** Grade 2, RELAXED (the default): the gate waits a whole minute for an answer, then the answer drives on. */
async function relaxedWait(browser) {
  const g = "2";
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();
  const errors = [];
  watchErrors(page, errors);
  await page.goto(`${BASE}?grade=${g}&debug&god`, { waitUntil: "load" });
  await page.waitForFunction(() => !!window.__cp && !!window.__cp());
  const log = [];
  const picks = await page.locator(".cp-timing").allInnerTexts();
  if (picks.length !== 3 || !/RELAXED/.test(picks[0]) || !/NORMAL/.test(picks[1]) || !/SPEEDY/.test(picks[2])) note(g, `timing picker ${JSON.stringify(picks)}`);
  if ((await page.locator('.cp-timing[data-timing="relaxed"]').getAttribute("aria-checked")) !== "true") note(g, "timing: RELAXED isn't the default");
  await page.locator(".cp-cta.big").click();
  await page.waitForTimeout(300);
  // Drive (for real, a few seconds) then hop to the checkpoint.
  await page.waitForTimeout(2000);
  await page.evaluate(() => window.__cp().skipToCheckpoint());
  await waitPhase(page, "approach", 5000);
  let c = await clock(page);
  if (c.timing !== "relaxed" || c.total !== "inf") note(g, `relaxed: sim timing ${c.timing} total ${c.total}`);
  log.push(`checkpoint: [${c.family}] "${c.prompt}"`);
  const t0 = Date.now();
  const lives = c.lives;
  const cleared = c.cleared;
  // Hands off for 60 s, checking along the way.
  let minGate = Infinity;
  let hazards = 0;
  while (Date.now() - t0 < 60000) {
    await page.waitForTimeout(5000);
    c = await clock(page);
    minGate = Math.min(minGate, c.gateIn);
    hazards = Math.max(hazards, c.live);
    if (c.phase !== "approach") break;
  }
  const waited = ((Date.now() - t0) / 1000).toFixed(1);
  if (c.phase !== "approach" || !c.waiting || c.released) note(g, `relaxed: after ${waited}s phase ${c.phase}, waiting ${c.waiting}`);
  if (c.cleared !== cleared || c.lives !== lives) note(g, "relaxed: waiting changed cars / cleared");
  if (hazards) note(g, `relaxed: ${hazards} hazards while waiting`);
  if (!(Math.abs(c.gateIn - 56) < 1 && c.speed === 0)) note(g, `relaxed: car not stopped before the gate (gap ${c.gateIn}, speed ${c.speed})`);
  const bar = await page.locator(".cp-timebar").innerText();
  if (!/TAKE YOUR TIME/.test(bar)) note(g, `relaxed: no "take your time" note ("${bar}")`);
  const head = await page.locator(".cp-radio .head").innerText();
  if (!/TAKE YOUR TIME/.test(head)) note(g, `relaxed: radio head "${head}"`);
  if (await page.locator(".cp-timebar.timed").count()) note(g, "relaxed: a countdown bar is showing");
  log.push(`waited ${waited}s hands-off: still ${c.phase}, stopped ${c.gateIn.toFixed(0)}px before the gate, "${bar}"`);
  await page.screenshot({ path: path.join(process.env.OUT || "/tmp", "cp-relaxed-wait.png") });
  // Now answer (key) and drive on.
  await page.keyboard.press(String(c.answer + 1));
  await waitPhase(page, "debrief", 8000).catch(() => note(g, "relaxed: answering didn't reach the gate"));
  c = await clock(page);
  if (c.correct !== 1) note(g, `relaxed: answer after waiting not counted (correct=${c.correct})`);
  log.push(`answered after the wait → ${c.phase}, codes cracked ${c.correct}`);
  console.log("relaxed grade 2:\n  " + log.join("\n  "));
  await ctx.close();
  return errors;
}

/** Grade 7: NORMAL shows a time bar with at least the floor; SPEEDY is remembered and quicker. */
async function timedModes(browser) {
  const g = "7";
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();
  const errors = [];
  watchErrors(page, errors);
  await page.goto(`${BASE}?grade=${g}&debug&god`, { waitUntil: "load" });
  await page.waitForFunction(() => !!window.__cp && !!window.__cp());
  const log = [];
  await page.locator('.cp-timing[data-timing="normal"]').click();
  if ((await page.evaluate(() => localStorage.getItem("arcade.cipher-pursuit.timing"))) !== "normal") note(g, "timing: NORMAL not saved");
  await page.locator(".cp-cta.big").click();
  await page.waitForTimeout(300);
  const normals = [];
  for (let k = 0; k < 2; k++) {
    await page.evaluate(() => window.__cp().skipToCheckpoint());
    await waitPhase(page, "approach", 5000);
    await page.waitForTimeout(300);
    let c = await clock(page);
    const floor = c.family.startsWith("cipher") || WORDY.includes(c.family) ? 25 : 15;
    if (c.timing !== "normal" || !(c.total >= floor)) note(g, `normal: [${c.family}] timer ${c.total}s < ${floor}s`);
    const bar = page.locator(".cp-timebar.timed");
    if (!(await bar.isVisible())) note(g, "normal: time bar not visible");
    const w0 = await bar.locator(".bar i").evaluate((el) => el.getBoundingClientRect().width);
    const label = await bar.locator(".lbl").innerText();
    await page.waitForTimeout(2500);
    const w1 = await bar.locator(".bar i").evaluate((el) => el.getBoundingClientRect().width);
    if (!(w1 < w0)) note(g, `normal: time bar didn't shrink (${w0} → ${w1})`);
    // Hands off: the gate must not come before the timer runs out.
    const t0 = Date.now();
    const left0 = (await clock(page)).left;
    await waitPhase(page, "debrief", (c.total + 15) * 1000).catch(() => note(g, "normal: the gate never came after the timer"));
    const took = (Date.now() - t0) / 1000;
    if (took < left0 - 1) note(g, `normal: gate came after ${took.toFixed(1)}s with ${left0.toFixed(1)}s left`);
    c = await clock(page);
    if (c.lives !== 3) note(g, "normal: time running out cost a car");
    normals.push(c.total);
    log.push(`NORMAL checkpoint ${k + 1}: [${c.family}] "${c.prompt}" timer ${c.total}s (floor ${floor}s), bar "${label}" ${w0.toFixed(0)}→${w1.toFixed(0)}px, ${left0.toFixed(1)}s left after 2.8s → gate ${took.toFixed(1)}s later`);
    await page.waitForTimeout(1300);
    await page.keyboard.press("Enter");
    await page.waitForTimeout(150);
  }
  // SPEEDY: pick it on the title, reload: still picked.
  await page.goto(`${BASE}?grade=${g}&debug&god`, { waitUntil: "load" });
  await page.waitForFunction(() => !!window.__cp && !!window.__cp());
  if ((await page.locator('.cp-timing[data-timing="normal"]').getAttribute("aria-checked")) !== "true") note(g, "timing: NORMAL not remembered");
  await page.locator('.cp-timing[data-timing="speedy"]').click();
  await page.reload({ waitUntil: "load" });
  await page.waitForFunction(() => !!window.__cp && !!window.__cp());
  if ((await page.locator('.cp-timing[data-timing="speedy"]').getAttribute("aria-checked")) !== "true") note(g, "timing: SPEEDY not remembered after reload");
  await page.locator(".cp-cta.big").click();
  await page.waitForTimeout(300);
  await page.evaluate(() => window.__cp().skipToCheckpoint());
  await waitPhase(page, "approach", 5000);
  await page.waitForTimeout(300);
  const c = await clock(page);
  if (c.timing !== "speedy" || !(c.total >= 8)) note(g, `speedy: timer ${c.total}s`);
  // Faster than NORMAL: under NORMAL's floor for the same kind of question.
  const nFloor = c.family.startsWith("cipher") || WORDY.includes(c.family) ? 25 : 15;
  if (!(c.total < nFloor)) note(g, `speedy: [${c.family}] timer ${c.total}s not under NORMAL's ${nFloor}s floor`);
  if (!(await page.locator(".cp-timebar.timed").isVisible())) note(g, "speedy: time bar not visible");
  log.push(`SPEEDY checkpoint: [${c.family}] "${c.prompt}" timer ${c.total}s (NORMAL timers seen: ${normals.join(", ")}s)`);
  const t0 = Date.now();
  await waitPhase(page, "debrief", (c.total + 15) * 1000).catch(() => note(g, "speedy: the gate never came"));
  log.push(`SPEEDY gate after ${((Date.now() - t0) / 1000 + 0.3).toFixed(1)}s`);
  console.log("timing grade 7:\n  " + log.join("\n  "));
  await ctx.close();
  return errors;
}

const RATIO_FAMILIES = ["drt", "rate", "ratio", "pctof", "pctchange", "fracrate", "mpg"];
const qInfo = (page) =>
  page.evaluate(() => {
    const q = window.__cp().cp.q;
    return q && { family: q.family, standard: q.standard, prompt: q.prompt, meta: q.meta, choices: q.choices };
  });

async function focusDesktop(browser) {
  const g = "7";
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();
  const errors = [];
  watchErrors(page, errors);
  await page.goto(`${BASE}?grade=${g}&debug&god`, { waitUntil: "load" });
  await page.waitForFunction(() => !!window.__cp && !!window.__cp());
  const log = [];
  // MIXED is the default (no topic row); the subject row works from the keyboard.
  const mixed = page.locator('.cp-subject[data-subject="mixed"]');
  if ((await mixed.getAttribute("aria-checked")) !== "true") note(g, "focus: MIXED isn't the default");
  if ((await page.locator(".cp-topic").count()) !== 0) note(g, "focus: topics shown for MIXED");
  const subjects = (await page.locator(".cp-subject .cp-pixel").allInnerTexts()).join(" · ");
  if (subjects !== "MATH · ELA · MIXED") note(g, `focus: subject row "${subjects}"`);
  await mixed.focus();
  await page.keyboard.press("ArrowLeft");
  await page.keyboard.press("ArrowLeft");
  await page.keyboard.press("Enter");
  await page.waitForTimeout(100);
  if ((await page.locator('.cp-subject[data-subject="math"]').getAttribute("aria-checked")) !== "true") note(g, "focus: keyboard didn't pick MATH");
  if ((await page.locator('.cp-topic[data-topic="all"]').getAttribute("aria-checked")) !== "true") note(g, "focus: ALL MATH isn't preselected");
  // ELA: ALL ELA + Grammar; phonics disabled at grade 7. Then back to MATH and pick Ratios.
  await page.locator('.cp-subject[data-subject="ela"]').click();
  const elaTopics = await page.locator(".cp-topic").allInnerTexts();
  if (!elaTopics[0].includes("ALL ELA") || !elaTopics.some((t) => t.includes("Grammar & words"))) note(g, `focus: ELA topics ${JSON.stringify(elaTopics)}`);
  if (!(await page.locator('.cp-topic[data-topic="phonics"]').isDisabled())) note(g, "focus: phonics should be disabled at grade 7");
  await page.locator('.cp-subject[data-subject="math"]').click();
  const disabled = await page.locator(".cp-topic:disabled").allInnerTexts();
  log.push(`grade 7 math topics disabled: ${disabled.map((t) => t.replace(/\s+/g, " ")).join(" | ")}`);
  await page.locator('.cp-topic[data-topic="ratios"]').click();
  if ((await page.locator('.cp-topic[data-topic="ratios"]').getAttribute("aria-checked")) !== "true") note(g, "focus: ratios not selected");
  const saved = await page.evaluate(() => [localStorage.getItem("arcade.cipher-pursuit.subject"), localStorage.getItem("arcade.cipher-pursuit.topic")].join("/"));
  if (saved !== "math/ratios") note(g, `focus: not saved (${saved})`);
  const startText = await page.locator(".cp-cta.big").innerText();
  if (!/ratios/i.test(startText)) note(g, `focus: start button "${startText}"`);
  await page.locator(".cp-cta.big").click();
  await page.waitForTimeout(300);
  const idleHead = await page.locator(".cp-radio .head").innerText();
  if (!/RATIOS/.test(idleHead)) note(g, `focus: radio head doesn't show the topic: "${idleHead}"`);
  // Drive for real to the first checkpoint.
  const t0 = Date.now();
  while ((await sim(page)).phase === "drive" && Date.now() - t0 < 45000) {
    await page.evaluate(() => {
      const s = window.__cp();
      s.input.targetX = s.roadAt(s.dist + 30).cx;
    });
    await page.waitForTimeout(250);
  }
  await page.evaluate(() => (window.__cp().input.targetX = null));
  if ((await sim(page)).phase !== "approach") note(g, "focus: never reached a checkpoint");
  else {
    const q = await qInfo(page);
    const isRate = RATIO_FAMILIES.includes(q.family) || /\.RP\./.test(q.standard);
    if (!isRate) note(g, `focus: first checkpoint isn't a rate/ratio: ${q.family} ${q.standard} "${q.prompt}"`);
    const head = await page.locator(".cp-radio .head").innerText();
    if (!/RATIOS/.test(head)) note(g, `focus: question header "${head}"`);
    log.push(`focus ratios checkpoint 1 (drove ${((Date.now() - t0) / 1000).toFixed(1)}s): [${q.family} ${q.standard}] "${q.prompt}" ${JSON.stringify(q.choices)}`);
    // Two more checkpoints: still ratios.
    for (let k = 0; k < 2; k++) {
      const s = await sim(page);
      await page.keyboard.press(String(s.answer + 1));
      await waitPhase(page, "debrief");
      await page.waitForTimeout(1300);
      await page.keyboard.press("Enter");
      await page.evaluate(() => window.__cp().skipToCheckpoint());
      await waitPhase(page, "approach", 5000);
      const q2 = await qInfo(page);
      if (!(RATIO_FAMILIES.includes(q2.family) || /\.RP\./.test(q2.standard))) note(g, `focus: checkpoint ${k + 2} off topic: ${q2.family} ${q2.standard}`);
      log.push(`focus ratios checkpoint ${k + 2}: [${q2.family} ${q2.standard}] "${q2.prompt}"`);
    }
  }
  // Run out of cars: the mission report names the focus topic.
  await page.evaluate(() => {
    const s = window.__cp();
    s.god = false;
  });
  const s1 = await sim(page);
  if (s1.phase === "approach") {
    await page.keyboard.press(String(s1.answer + 1));
    await waitPhase(page, "debrief");
  }
  if ((await sim(page)).phase === "debrief") await page.evaluate(() => window.__cp().continueDrive());
  for (let k = 0; k < 6 && (await sim(page)).phase !== "over"; k++) {
    await page.evaluate(() => {
      const s = window.__cp();
      if (s.phase !== "drive") return;
      Object.assign(s, { invuln: 0, shield: false, turbo: 0, smoke: 0 });
      s.enemies.push({ id: 7000 + Math.random(), kind: "smudge", off: s.x - s.roadAt(s.dist).cx, wy: s.dist + 2, vy: 0, w: 10, h: 15, state: "live", t: 0, boat: false });
    });
    await page.waitForTimeout(1800);
  }
  const rep = await page.locator(".cp-reportfocus").innerText().catch(() => "");
  if (!rep.includes("Ratios & rates")) note(g, `focus: mission report doesn't name the topic ("${rep}")`);
  log.push(`report: ${rep}`);
  // Reload without ?topic=: the saved FOCUS ratios comes back.
  await page.goto(`${BASE}?grade=${g}&debug`, { waitUntil: "load" });
  await page.waitForFunction(() => !!window.__cp && !!window.__cp());
  if ((await page.locator('.cp-topic[data-topic="ratios"]').getAttribute("aria-checked").catch(() => null)) !== "true") note(g, "focus: saved choice not restored");
  // A grade with no ratios (no ?grade=, picker shown): the saved topic falls back to ALL MATH.
  await page.goto(`${BASE}?debug`, { waitUntil: "load" });
  await page.locator(".cp-grade", { hasText: /^2$/ }).click();
  const fb = await page.locator(".cp-topic.on").getAttribute("data-topic").catch(() => null);
  if (fb !== "all") note(g, `focus: grade 2 fallback topic ${fb}`);
  await page.locator(".cp-grade", { hasText: /^7$/ }).click();
  if ((await page.locator(".cp-topic.on").getAttribute("data-topic").catch(() => null)) !== "ratios") note(g, "focus: back at grade 7 the saved ratios should return");
  console.log("focus desktop:\n  " + log.join("\n  "));
  await ctx.close();
  return errors;
}

async function focusLinks(browser) {
  const errors = [];
  const log = [];
  // ?grade=5&topic=codes → FOCUS: Secret codes, easy cipher.
  {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await ctx.newPage();
    watchErrors(page, errors);
    await page.goto(`${BASE}?grade=5&topic=codes&debug&god`, { waitUntil: "load" });
    await page.waitForFunction(() => !!window.__cp && !!window.__cp());
    if ((await page.locator('.cp-subject[data-subject="math"]').getAttribute("aria-checked")) !== "true") note("5", "?topic=codes didn't pick MATH");
    if ((await page.locator('.cp-topic[data-topic="codes"]').getAttribute("aria-checked")) !== "true") note("5", "?topic=codes not selected");
    const saved = await page.evaluate(() => localStorage.getItem("arcade.cipher-pursuit.subject") || localStorage.getItem("arcade.cipher-pursuit.topic"));
    if (saved) note("5", `?topic= override should not be saved (${saved})`);
    await page.locator(".cp-cta.big").click();
    await page.waitForTimeout(300);
    for (let k = 0; k < 3; k++) {
      await page.evaluate(() => window.__cp().skipToCheckpoint());
      await waitPhase(page, "approach", 5000);
      const q = await qInfo(page);
      const m = q.meta;
      if (!q.family.startsWith("cipher")) note("5", `codes checkpoint ${k + 1}: ${q.family}`);
      const shift = m.shift !== undefined ? m.shift : null;
      if (shift !== null && shift > 3) note("5", `codes: shift ${shift} too big for grade 5`);
      if (m.kind === "cipher" && m.input.length > 4) note("5", `codes: word ${m.input} too long for grade 5`);
      if (!(await page.locator(".cp-radio .decoder").count())) note("5", "codes: A–Z strip not shown");
      const head = await page.locator(".cp-radio .head").innerText();
      if (!/SECRET CODES/.test(head)) note("5", `codes: header "${head}"`);
      log.push(`grade 5 codes ${k + 1}: [${q.family} ${q.standard}] "${q.prompt}" ${JSON.stringify(q.choices)}`);
      const s = await sim(page);
      await page.keyboard.press(String(s.answer + 1));
      await waitPhase(page, "debrief");
      await page.waitForTimeout(1300);
      await page.keyboard.press("Enter");
    }
    await ctx.close();
  }
  // ?grade=1&topic=ratios → not offered: a note, ALL MATH, the game still starts.
  {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await ctx.newPage();
    watchErrors(page, errors);
    await page.goto(`${BASE}?grade=1&topic=ratios&debug&god`, { waitUntil: "load" });
    await page.waitForFunction(() => !!window.__cp && !!window.__cp());
    const notice = await page.locator(".cp-notice").innerText().catch(() => "");
    if (!/grades 6–8/.test(notice)) note("1", `?topic=ratios at grade 1: notice "${notice}"`);
    if ((await page.locator('.cp-subject[data-subject="math"]').getAttribute("aria-checked")) !== "true") note("1", "?topic=ratios at grade 1 should pick MATH");
    if ((await page.locator('.cp-topic[data-topic="all"]').getAttribute("aria-checked")) !== "true") note("1", "?topic=ratios at grade 1 should fall back to ALL MATH");
    const ratios = page.locator('.cp-topic[data-topic="ratios"]');
    if (!(await ratios.isDisabled())) note("1", "ratios should be disabled at grade 1");
    if (!(await ratios.innerText()).includes("Grades 6–8")) note("1", `ratios note "${await ratios.innerText()}"`);
    await page.locator(".cp-cta.big").click();
    const head1 = await page.locator(".cp-radio .head").innerText();
    if (!/ALL MATH/.test(head1)) note("1", `ALL MATH radio head "${head1}"`);
    await page.evaluate(() => window.__cp().skipToCheckpoint());
    await waitPhase(page, "approach", 5000);
    const q = await page.evaluate(() => window.__cp().cp.q);
    if (q.subject !== "math") note("1", `ALL MATH checkpoint is ${q.subject}`);
    log.push(`grade 1 ?topic=ratios → "${notice}" · ALL MATH checkpoint: [${q.family} ${q.standard}] "${q.prompt}"`);
    await ctx.close();
  }
  // Phones: the FOCUS picker has no sideways scroll.
  for (const width of [390, 360]) {
    const ctx = await browser.newContext({ viewport: { width, height: 800 }, hasTouch: true, isMobile: true, deviceScaleFactor: 3 });
    const page = await ctx.newPage();
    watchErrors(page, errors);
    await page.goto(`${BASE}?grade=6&topic=ratios&debug`, { waitUntil: "load" });
    await page.waitForFunction(() => !!window.__cp && !!window.__cp());
    for (const subj of ["math", "ela", "mixed", "math"]) {
      await page.locator(`.cp-subject[data-subject="${subj}"]`).tap();
      await page.waitForTimeout(100);
      const m = await page.evaluate(() => {
        const over = [...document.querySelectorAll(".cp-focus button, .cp-cta")].filter((b) => {
          const r = b.getBoundingClientRect();
          return r.left < -0.5 || r.right > window.innerWidth + 0.5;
        }).length;
        return { sw: document.documentElement.scrollWidth, bw: document.body.scrollWidth, iw: window.innerWidth, over };
      });
      if (m.sw > m.iw || m.bw > m.iw || m.over) note("6", `phone ${width}px ${subj}: sideways overflow ${JSON.stringify(m)}`);
    }
    // Tap a topic and start: the radio shows it.
    await page.locator('.cp-topic[data-topic="fractions"]').tap();
    await page.locator(".cp-cta.big").tap();
    await page.waitForTimeout(300);
    const head = await page.locator(".cp-radio .head").innerText();
    if (!/FRACTIONS/.test(head)) note("6", `phone ${width}px: radio head "${head}"`);
    const m2 = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, iw: window.innerWidth }));
    if (m2.sw > m2.iw) note("6", `phone ${width}px: sideways scroll while driving`);
    await page.screenshot({ path: path.join(process.env.OUT || "/tmp", `cp-focus-phone-${width}.png`) });
    log.push(`phone ${width}px: picker ok`);
    await ctx.close();
  }
  console.log("focus links:\n  " + log.join("\n  "));
  return errors;
}

(async () => {
  const browser = await chromium.launch();
  if (process.env.FOCUS_ONLY !== "1") {
  for (const g of GRADES) {
    const errs = [...(await desktop(browser, g)), ...(await phone(browser, g))];
    for (const e of errs) note(g, `console/page error: ${e}`);
  }
  }
  if (process.env.FOCUS_ONLY !== "1") {
    for (const e of [...(await relaxedWait(browser)), ...(await timedModes(browser))]) note("timing", `console/page error: ${e}`);
  }
  if (process.env.TIMING_ONLY !== "1") {
    for (const e of [...(await focusDesktop(browser)), ...(await focusLinks(browser))]) note("focus", `console/page error: ${e}`);
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
