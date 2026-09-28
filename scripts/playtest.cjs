/*
 * Automated playtest (dev only). Needs a running preview and a global Playwright:
 *   npm run build && npx vite preview --port 4404 --host 127.0.0.1 &
 *   node scripts/playtest.cjs            (SHOT=docs/screenshot.png to save a canvas picture)
 * For each grade, plays a wave with the keyboard (1280x800) and with touch (iPad 1080x810):
 * auto-targets the live missiles with A-D keys / taps (on the missile and on the A-D buttons),
 * fires a crosshair shot, checks every missile label against the target, answers the
 * transmission with a key and with a tap, reaches the mission report, and checks the layout.
 * Also opens the game with no ?grade= to check the grade picker appears.
 */
const path = require("path");
const { execSync } = require("child_process");
const { chromium } = require(path.join(execSync("npm root -g").toString().trim(), "playwright"));

const BASE = process.env.BASE || "http://127.0.0.1:4404/";
const GRADES = (process.env.GRADES || "K,3,7,11").split(",");
const SHOT = process.env.SHOT;

const numOk = {
  K: (l) => (l.match(/\d+/g) || []).every((n) => Number(n) <= 10) && !/[×÷x]/.test(l),
  3: (l) => /[×÷]/.test(l) && (l.match(/\d+/g) || []).every((n) => Number(n) <= 100),
  7: (l) => /−|-/.test(l),
  11: (l) => /log|sin|cos|tan/.test(l),
};

async function layoutProblems(page, problems) {
  const layout = await page.evaluate(() => {
    const scr = document.querySelector(".cs-screen").getBoundingClientRect();
    const thr = document.querySelector(".cs-threats").getBoundingClientRect();
    return {
      hScroll: document.documentElement.scrollWidth > window.innerWidth,
      vScroll: document.documentElement.scrollHeight > window.innerHeight,
      screenBottom: Math.round(scr.bottom),
      screenW: Math.round(scr.width),
      threatsBottom: Math.round(thr.bottom),
      vh: window.innerHeight,
    };
  });
  if (layout.hScroll) problems.push("horizontal scroll");
  if (layout.vScroll || layout.screenBottom > layout.vh || layout.threatsBottom > layout.vh) problems.push(`doesn't fit height ${JSON.stringify(layout)}`);
  return layout;
}

async function run(browser, grade, mode) {
  const touch = mode === "touch";
  const ctx = await browser.newContext(
    touch
      ? { viewport: { width: 1080, height: 810 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 }
      : { viewport: { width: 1280, height: 800 } },
  );
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (m) => {
    if (m.type() === "error" && !/fonts\.(googleapis|gstatic)|ERR_|Failed to load resource/.test(m.text())) errors.push(m.text());
  });
  await page.goto(`${BASE}?grade=${grade}&debug`, { waitUntil: "load" });
  await page.waitForFunction(() => !!window.__cs);
  const problems = [];

  // Grade comes from the arcade: a badge, not a picker.
  const badge = await page.locator(".cs-sub.badge").innerText().catch(() => "");
  if (!badge.includes(grade === "K" ? "KINDERGARTEN" : `GRADE ${grade}`)) problems.push(`grade badge shows "${badge}"`);
  if (await page.locator(".cs-grades").count()) problems.push("grade picker shown although ?grade= was given");
  const readAloudBtn = await page.locator(".cs-tools button", { hasText: "READ ALOUD" }).innerText().catch(() => "n/a");

  const cta = page.locator(".cs-cta", { hasText: "Defend" });
  if (touch) await cta.tap();
  else await cta.click();
  await page.waitForTimeout(300);

  const state = () =>
    page.evaluate(() => {
      const e = window.__cs;
      return {
        mode: e.mode, wave: e.wave, score: e.score, cities: e.cities.filter(Boolean).length,
        round: e.round && { mode: e.round.mode, target: e.round.targetText, std: e.round.standard, context: e.round.context || "" },
        missiles: e.missiles.filter((m) => m.alive).map((m) => ({ id: m.id, x: m.x, y: m.y, label: m.math.label, danger: m.math.danger, letter: m.letter, locked: m.lockedBy !== null })),
        interceptors: e.interceptors.length,
        floaters: e.floaters.map((f) => f.text),
      };
    });

  let s = await state();
  const round1 = s.round;
  // Keep the wave short, and make missiles fall fast enough for a test.
  await page.evaluate(() => {
    const e = window.__cs;
    e.queue = e.queue.slice(0, 6);
    e.spawnT = 0;
  });

  const labels = new Set();
  const notes = new Set();
  let autoShots = 0;
  let tapShots = 0;
  let crosshairShot = false;
  let stoppedBefore = 0;
  let shotPng = null;
  const t0 = Date.now();
  while (Date.now() - t0 < 60000) {
    s = await state();
    s.floaters.forEach((f) => notes.add(f));
    if (s.mode === "checkpoint" || s.mode === "tally") break;
    if (s.mode !== "play") {
      await page.waitForTimeout(200);
      continue;
    }
    for (const m of s.missiles) labels.add(`${m.danger ? "LIVE" : "safe"} ${m.label}`);
    // Speed up the fall (test only).
    await page.evaluate(() => {
      for (const m of window.__cs.missiles) if (!m.fast) { m.vx *= 4; m.vy *= 4; m.fast = true; }
      window.__cs.spawnT = Math.min(window.__cs.spawnT, 0.4);
    });
    if (SHOT && grade === "7" && !touch && !shotPng && s.missiles.length >= 3 && s.missiles.every((m) => m.y > 40)) {
      shotPng = await page.evaluate(() => {
        const src = document.querySelector("canvas");
        const c = document.createElement("canvas");
        c.width = 640;
        c.height = 400;
        const g = c.getContext("2d");
        g.imageSmoothingEnabled = false;
        g.drawImage(src, 0, 0, 640, 400);
        return c.toDataURL("image/png");
      });
    }
    if (!crosshairShot && s.missiles.length) {
      // A plain shot at the crosshair, into empty sky low on the screen.
      if (touch) {
        const box = await page.locator("canvas").boundingBox();
        await page.touchscreen.tap(box.x + box.width * 0.05, box.y + box.height * 0.8);
      } else {
        await page.keyboard.down("ArrowLeft");
        await page.waitForTimeout(250);
        await page.keyboard.up("ArrowLeft");
        await page.keyboard.press("Space");
      }
      crosshairShot = (await page.evaluate(() => window.__cs.interceptors.length)) > 0;
      if (!crosshairShot) problems.push("crosshair shot didn't launch");
      crosshairShot = true;
    }
    const target = s.missiles.find((m) => m.danger && m.letter && !m.locked && m.y > 45);
    if (target) {
      const i = "ABCD".indexOf(target.letter);
      if (touch) {
        if (tapShots % 2 === 0) {
          // Tap the missile itself on the canvas.
          const box = await page.locator("canvas").boundingBox();
          const cur = await page.evaluate((id) => {
            const m = window.__cs.missiles.find((q) => q.id === id);
            return m ? { x: m.x, y: m.y } : null;
          }, target.id);
          if (cur) await page.touchscreen.tap(box.x + (cur.x / 320) * box.width, box.y + (cur.y / 200) * box.height);
        } else {
          await page.locator(".cs-threat").nth(i).tap();
        }
        tapShots++;
      } else {
        await page.keyboard.press(autoShots % 2 ? String(i + 1) : "abcd"[i]);
      }
      autoShots++;
      await page.waitForTimeout(120);
      const locked = await page.evaluate((id) => {
        const m = window.__cs.missiles.find((q) => q.id === id);
        return !m || m.lockedBy !== null;
      }, target.id);
      if (!locked) problems.push(`auto-target ${target.letter} (${target.label}) didn't lock`);
    }
    await page.waitForTimeout(150);
  }
  s = await state();
  const decisions = await page.evaluate(() => window.__cs.stats);
  stoppedBefore = decisions.stopped;
  if (autoShots === 0) problems.push("never auto-targeted a live missile");
  if (decisions.stopped === 0) problems.push("no live missile was stopped");
  for (const l of labels) {
    const label = l.slice(5);
    const f = numOk[grade];
    if (f && !f(label) && !(round1 && round1.mode === "wrong")) problems.push(`label ${label} doesn't look like grade ${grade} math`);
  }
  if (round1.target.length === 0) problems.push("empty target");

  // Transmission
  await page.waitForSelector('[aria-label="Transmission question"]', { timeout: 10000 }).catch(() => problems.push("checkpoint never appeared"));
  const prompt = await page.locator(".cs-prompt").innerText().catch(() => "");
  const std = await page.locator(".cs-tag.std").innerText().catch(() => "");
  if (touch) await page.locator(".cs-btn").nth(1).tap();
  else await page.keyboard.press("B");
  const verdict = await page.locator(".verdict").innerText().catch(() => "");
  if (!verdict) problems.push("no verdict after answering the checkpoint");
  if (touch) await page.locator(".cs-cta", { hasText: "Next wave" }).tap();
  else await page.keyboard.press("Enter");
  await page.waitForTimeout(400);
  s = await state();
  if (s.wave !== 2 || s.mode !== "play") problems.push(`after checkpoint: wave ${s.wave}, mode ${s.mode}`);
  const round2 = s.round;

  const layout = await layoutProblems(page, problems);

  // Pause and resume
  if (touch) await page.locator(".cs-tools button", { hasText: "PAUSE" }).tap();
  else await page.keyboard.press("p");
  const paused = await page.evaluate(() => window.__cs.paused);
  if (!paused) problems.push("pause didn't pause");
  if (touch) await page.locator(".cs-tools button", { hasText: "RESUME" }).tap();
  else await page.keyboard.press("p");

  // Game over -> mission report
  await page.evaluate(() => {
    const e = window.__cs;
    e.cities = e.cities.map(() => false);
  });
  await page.waitForSelector(".cs-report-table", { timeout: 8000 }).catch(() => problems.push("mission report missing"));
  const reportRows = await page.locator(".cs-report-table tbody tr").allInnerTexts().catch(() => []);
  const practice = await page.locator(".cs-panel .cs-help", { hasText: "Practice next" }).count();
  if (!practice) problems.push("no practice-next line");

  await ctx.close();
  return {
    grade, mode, problems, errors, readAloudBtn, round1, round2, autoShots, stopped: stoppedBefore,
    labels: [...labels].slice(0, 8), notes: [...notes].slice(0, 5), prompt: prompt.slice(0, 70), std, verdict: verdict.slice(0, 50), layout, reportRows, shotPng,
  };
}

async function pickerRun(browser) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  await page.goto(`${BASE}`, { waitUntil: "load" });
  await page.waitForTimeout(400);
  const problems = [];
  const n = await page.locator(".cs-grade").count();
  if (n !== 13) problems.push(`grade picker has ${n} buttons`);
  if (await page.locator(".cs-sub.badge").count()) problems.push("arcade badge shown without ?grade=");
  await page.locator(".cs-grade", { hasText: /^8$/ }).click();
  const on = await page.locator(".cs-grade.on").innerText();
  if (on.trim() !== "8") problems.push(`picked 8 but ${on} is on`);
  const help = await page.locator(".cs-help.center").innerText();
  if (!help.includes("NC.8.EE")) problems.push(`grade 8 blurb: ${help}`);
  await layoutProblems(page, problems);
  await ctx.close();
  return { grade: "(none)", mode: "picker", problems, errors, help: help.slice(0, 100) };
}

(async () => {
  const browser = await chromium.launch();
  let bad = 0;
  const results = [await pickerRun(browser)];
  for (const grade of GRADES) for (const mode of ["keyboard", "touch"]) results.push(await run(browser, grade, mode));
  for (const r of results) {
    if (r.shotPng && SHOT) {
      require("fs").writeFileSync(SHOT, Buffer.from(r.shotPng.split(",")[1], "base64"));
      console.log(`saved ${SHOT}`);
    }
    delete r.shotPng;
    const ok = r.problems.length === 0 && r.errors.length === 0;
    if (!ok) bad++;
    console.log(`${ok ? "PASS" : "FAIL"} grade ${r.grade} ${r.mode}`);
    console.log(JSON.stringify(r));
  }
  await browser.close();
  process.exit(bad ? 1 : 0);
})();
