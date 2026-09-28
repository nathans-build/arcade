/*
 * Automated playtest (dev only). Needs a running preview and a global Playwright:
 *   npm run build && npx vite preview --port 4408 --host 127.0.0.1 &
 *   node scripts/playtest.cjs            # GRADES=K,3,7,11 by default; SHOT=docs/screenshot.png saves a canvas shot
 *                                        # MODE=MATH / SCIENCE / MIXED picks the subject (ELA by default)
 * For each grade it plays level 1 (two rounds) with the keyboard (1280x800) and with touch
 * (iPad 1080x810): one manual diagonal hop (arrow key / touch pad), one deliberate wrong pick
 * (checks the shield drops and a reason shows), then answers every step with auto-hop picks
 * (keys 1-4 and A-D, option taps, taps on cubes). It answers the transmission with a key or
 * a tap, checks the layout fits, then loses all lives and checks the mission report. One
 * extra run without ?grade= checks the grade picker and the subject picker (Mixed).
 */
const path = require("path");
const fs = require("fs");
const { execSync } = require("child_process");
const { chromium } = require(path.join(execSync("npm root -g").toString().trim(), "playwright"));

const BASE = process.env.BASE || "http://127.0.0.1:4408/";
const GRADES = (process.env.GRADES || "K,3,7,11").split(",");
const SHOT = process.env.SHOT;

const state = (page) =>
  page.evaluate(() => {
    const e = window.__ch;
    const r = e.round;
    const spec = r && r.spec;
    return {
      mode: e.mode, paused: e.paused, level: e.level, score: e.score, lives: e.lives, shield: e.shield, roundNo: e.roundNo,
      hero: { from: e.hero.from, to: e.hero.to, auto: e.hero.auto, path: e.hero.path.length, fall: !!e.hero.fall, ride: !!e.hero.ride },
      options: e.options.map((o) => ({ label: o.label, key: o.key })),
      targets: r ? r.targets().map((c) => `${c.r},${c.c}`) : [],
      wrongKeys: r ? [...r.cubes.values()].filter((c) => c.state === "label" && !c.good).map((c) => `${c.r},${c.c}`) : [],
      spec: spec && {
        kind: spec.kind, subject: spec.subject,
        id: spec.kind === "build" ? spec.item.id : spec.rule.id,
        grades: spec.kind === "build" ? spec.item.grades : spec.rule.grades,
        prompt: spec.kind === "build" ? spec.item.prompt : spec.rule.prompt,
        standard: spec.kind === "build" ? spec.item.standard : spec.rule.standard,
      },
      built: r ? r.built : [], found: r ? r.found : 0, total: r ? r.total : 0,
      geom: { w: e.geom.w, top: e.geom.top, dy: e.geom.dy, rows: e.geom.rows },
    };
  });

const idle = (s) => !s.hero.to && !s.hero.auto && s.hero.path === 0 && !s.hero.fall && !s.hero.ride;

async function waitIdle(page, ms = 4000) {
  const t0 = Date.now();
  let s = await state(page);
  while (Date.now() - t0 < ms) {
    s = await state(page);
    if (s.mode !== "play" || idle(s)) return s;
    await page.waitForTimeout(60);
  }
  return s;
}

const BAND = { K: ["K", "1", "2"], 1: ["K", "1", "2"], 2: ["K", "1", "2"], 3: ["3", "4", "5"], 4: ["3", "4", "5"], 5: ["3", "4", "5"], 6: ["6", "7", "8"], 7: ["6", "7", "8"], 8: ["6", "7", "8"], 9: ["9", "10", "11", "12"], 10: ["9", "10", "11", "12"], 11: ["9", "10", "11", "12"], 12: ["9", "10", "11", "12"] };

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
  const url = grade ? `${BASE}?grade=${grade}&debug` : `${BASE}?debug`;
  await page.goto(url, { waitUntil: "load" });
  await page.waitForFunction(() => !!window.__ch);
  const problems = [];
  const click = async (loc) => (touch ? loc.tap() : loc.click());

  // Grade badge vs picker
  const badge = await page.locator(".ch-badge").count();
  const picker = await page.locator(".ch-grades").count();
  if (grade && (!badge || picker)) problems.push(`with ?grade= expected badge, got badge=${badge} picker=${picker}`);
  if (!grade) {
    if (badge || !picker) problems.push(`without ?grade= expected picker, got badge=${badge} picker=${picker}`);
    await page.locator(".ch-grade", { hasText: /^5$/ }).click();
    const on = await page.locator(".ch-grade.on").innerText();
    if (on.trim() !== "5") problems.push(`picker did not select grade 5 (${on})`);
    await page.locator(".ch-subject", { hasText: "MIXED" }).click();
  }
  if (grade && process.env.MODE) await page.locator(".ch-subject", { hasText: process.env.MODE }).click();
  const badgeText = badge ? await page.locator(".ch-badge").innerText() : "";
  const readAloudBtn = await page.locator(".ch-tools button", { hasText: "READ ALOUD" }).innerText().catch(() => "n/a");
  const expectGrade = grade || "5";

  await click(page.locator(".ch-cta", { hasText: "Start" }));
  await page.waitForTimeout(400);
  const controlsShown = await page.locator(".ch-controls.show").count();
  if (touch && !controlsShown) problems.push("touch controls hidden on coarse pointer");
  if (!touch && controlsShown) problems.push("touch controls shown for mouse/keyboard");

  const prompts = [];
  const subjects = new Set();
  let manual = "not tried";
  let wrongInfo = "";
  let wrongTested = false;
  let picks = 0;
  let steps = 0;
  const t0 = Date.now();
  let s = await state(page);

  while (Date.now() - t0 < 120000) {
    s = await state(page);
    if (s.mode === "checkpoint") break;
    await page.evaluate(() => {
      const e = window.__ch;
      e.invuln = 5; // don't die while testing the answer flow
    });
    if (s.mode !== "play" || !s.spec || !idle(s)) {
      await page.waitForTimeout(120);
      continue;
    }
    const tag = `${s.spec.subject} ${s.spec.kind}: ${s.spec.prompt}`;
    if (!prompts.includes(tag)) {
      prompts.push(tag);
      subjects.add(s.spec.subject);
      const okGrade = s.spec.grades.includes(expectGrade) || s.spec.grades.some((g) => BAND[expectGrade].includes(g));
      if (!okGrade) problems.push(`round ${s.spec.id} is for grades ${s.spec.grades}, expected ${expectGrade}`);
    }

    // One manual hop: from the top cube, down-left (ArrowDown / ↙ pad) lands on (1,0).
    if (manual === "not tried" && s.hero.from.r === 0) {
      const before = s.hero.from;
      if (touch) await page.locator('.ch-touch[aria-label="Hop down-left"]').tap();
      else await page.keyboard.press("ArrowDown");
      await page.waitForTimeout(600);
      const after = await state(page);
      manual = after.hero.from.r === before.r + 1 && after.hero.from.c === before.c ? "ok" : `hero at ${JSON.stringify(after.hero.from)}`;
      if (manual !== "ok") problems.push(`manual hop failed: ${manual}`);
      continue;
    }

    const right = s.options.findIndex((o) => s.targets.includes(o.key));
    if (right < 0) {
      problems.push(`options ${s.options.map((o) => o.label)} lack a right answer`);
      break;
    }
    // One deliberate wrong pick per run: a distractor cube costs a shield and shows a reason.
    const wrong = s.options.findIndex((o) => s.wrongKeys.includes(o.key));
    if (!wrongTested && wrong >= 0) {
      wrongTested = true;
      if (touch) await page.locator(".ch-banner .opt").nth(wrong).tap();
      else await page.keyboard.press(String(wrong + 1));
      await waitIdle(page);
      await page.waitForTimeout(300);
      wrongInfo = await page.locator(".ch-banner .info").innerText().catch(() => "");
      const after = await state(page);
      if (after.shield >= s.shield) problems.push("wrong pick didn't cost a shield");
      if (!/.{15,}/.test(wrongInfo)) problems.push("wrong pick gave no reason");
      continue;
    }

    // Answer: keyboard alternates 1-4 and A-D; touch alternates option taps and cube taps.
    picks++;
    const before = s.built.length + s.found;
    if (touch) {
      if (picks % 2 === 0) {
        const [r, c] = s.options[right].key.split(",").map(Number);
        const box = await page.locator("canvas").boundingBox();
        const x = 160 + (c - r / 2) * s.geom.w, y = s.geom.top + r * s.geom.dy;
        await page.touchscreen.tap(box.x + (x / 320) * box.width, box.y + (y / 200) * box.height);
      } else await page.locator(".ch-banner .opt").nth(right).tap();
    } else {
      await page.keyboard.press(picks % 2 ? String(right + 1) : "abcd"[right]);
    }
    await waitIdle(page);
    const after = await state(page);
    if (after.built.length + after.found > before || after.mode !== "play" || after.spec?.id !== s.spec.id) steps++;
    else problems.push(`pick ${s.options[right].label} did not count (${after.mode})`);
    if (problems.length > 6) break;
  }
  if (s.mode !== "checkpoint") problems.push(`level 1 not cleared (mode ${s.mode}, round ${s.roundNo})`);

  // Transmission checkpoint: key on keyboard, tap on touch
  await page.waitForSelector('[aria-label="Transmission question"]', { timeout: 8000 }).catch(() => problems.push("checkpoint never appeared"));
  const cpPrompt = await page.locator(".ch-prompt").innerText().catch(() => "");
  const cpStd = await page.locator(".ch-tag.std").innerText().catch(() => "");
  if (touch) await page.locator(".ch-btn").nth(1).tap();
  else await page.keyboard.press("b");
  const verdict = await page.locator(".verdict").innerText().catch(() => "");
  if (!verdict) problems.push("checkpoint answer not accepted");
  if (touch) await page.locator(".ch-cta", { hasText: "Next level" }).tap();
  else await page.keyboard.press("Enter");
  await page.waitForTimeout(500);
  s = await state(page);
  if (s.level !== 2 || s.mode !== "play") problems.push(`after checkpoint: level ${s.level}, mode ${s.mode}`);

  // Layout: no horizontal scroll, fits the viewport height
  const layout = await page.evaluate(() => {
    const scr = document.querySelector(".ch-screen").getBoundingClientRect();
    const ctrl = document.querySelector(".ch-controls").getBoundingClientRect();
    return {
      hScroll: document.documentElement.scrollWidth > window.innerWidth,
      vScroll: document.documentElement.scrollHeight > window.innerHeight,
      screenBottom: Math.round(scr.bottom),
      screenW: Math.round(scr.width),
      ctrlBottom: Math.round(ctrl.bottom),
      vh: window.innerHeight,
    };
  });
  if (layout.hScroll) problems.push("horizontal scroll");
  if (layout.vScroll || layout.screenBottom > layout.vh || layout.ctrlBottom > layout.vh) problems.push(`doesn't fit height ${JSON.stringify(layout)}`);
  if (layout.screenW < 480) problems.push(`game screen small (${layout.screenW}px)`);

  // Screenshot (grade 7 keyboard): level 2, a couple of answers in, hazards on the pyramid.
  let shotPng = null;
  if (SHOT && grade === "7" && !touch) {
    for (let i = 0; i < 2; i++) {
      const st = await waitIdle(page);
      const right = st.options.findIndex((o) => st.targets.includes(o.key));
      if (right >= 0) await page.keyboard.press(String(right + 1));
      await waitIdle(page);
    }
    await page.evaluate(() => {
      const e = window.__ch;
      e.invuln = 0;
      // Stage the hazards for the picture: a zap-ball mid-pyramid and the Glitch a few cubes away.
      e.balls = [{ from: { r: 3, c: 2 }, to: { r: 4, c: 3 }, t: 0.4, dur: 0.35, wait: 1, drop: 0 }];
      e.glitch = { from: { r: 5, c: 1 }, to: null, t: 0, dur: 0.3, wait: 3, stun: 0, frame: 0 };
    });
    await page.waitForTimeout(250);
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

  // Hazards: a real hit with shields up costs a shield, not a life.
  const hit = await page.evaluate(async () => {
    const e = window.__ch;
    e.invuln = 0;
    e.hero.path = [];
    e.hero.auto = false;
    const at = e.hero.to ?? e.hero.from;
    const before = { shield: e.shield, lives: e.lives };
    e.balls = [{ from: at, to: null, t: 0, dur: 0.35, wait: 5, drop: 0 }];
    await new Promise((r) => setTimeout(r, 200));
    return { before, after: { shield: e.shield, lives: e.lives } };
  });
  if (hit.before.shield > 0 && !(hit.after.shield === hit.before.shield - 1 && hit.after.lives === hit.before.lives))
    problems.push(`zap-ball hit: ${JSON.stringify(hit)}`);

  // Game over -> mission report
  for (let i = 0; i < 20; i++) {
    const m = (await state(page)).mode;
    if (m === "over") break;
    const died = await page.evaluate(() => window.__ch.mode === "play" && (window.__ch.die(), true));
    await page.waitForTimeout(died ? 1800 : 600);
  }
  await page.waitForSelector(".ch-report-table", { timeout: 5000 }).catch(() => problems.push("mission report missing"));
  const reportRows = await page.locator(".ch-report-table tbody tr").allInnerTexts().catch(() => []);
  if (reportRows.length < 2) problems.push("report lacks rows");
  const practice = await page.locator(".ch-panel .y", { hasText: "Practice next" }).count();

  await ctx.close();
  return {
    grade: grade || "(picker→5, mixed)", mode, problems, errors, badgeText, readAloudBtn, prompts, subjects: [...subjects], manual, steps,
    wrongInfo: wrongInfo.slice(0, 110), cpPrompt: cpPrompt.slice(0, 70), cpStd, verdict: verdict.slice(0, 50), layout, reportRows, practice, shotPng,
  };
}

(async () => {
  const browser = await chromium.launch();
  let bad = 0;
  const runs = [];
  for (const grade of GRADES) for (const mode of ["keyboard", "touch"]) runs.push([grade, mode]);
  if (!process.env.GRADES) runs.push([null, "keyboard"]);
  for (const [grade, mode] of runs) {
    const r = await run(browser, grade, mode);
    if (r.shotPng && SHOT) {
      fs.writeFileSync(SHOT, Buffer.from(r.shotPng.split(",")[1], "base64"));
      console.log(`saved ${SHOT}`);
    }
    delete r.shotPng;
    const ok = r.problems.length === 0 && r.errors.length === 0;
    if (!ok) bad++;
    console.log(`${ok ? "PASS" : "FAIL"} grade ${r.grade} ${mode}`);
    console.log(JSON.stringify(r, null, 1));
  }
  await browser.close();
  process.exit(bad ? 1 : 0);
})();
