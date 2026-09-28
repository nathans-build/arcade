/*
 * Automated playtest (dev only). Needs a running preview and a global Playwright:
 *   npm run build && npx vite preview --port 4401 --host 127.0.0.1 &
 *   node scripts/playtest.cjs            # GRADES=K,3,7,11 by default; SHOT=docs/screenshot.png saves a canvas shot
 * For each grade it plays level 1 with the keyboard (1280x800) and with touch (iPad 1080x810):
 * answers every worm with homing picks (keys 1-4 / A-D, strip taps, taps on segments), fires one
 * aimed dart, makes one wrong shot, answers the transmission with a key or a tap, checks the
 * layout fits, then loses all lives and checks the mission report. One extra run without
 * ?grade= checks that the grade picker shows.
 */
const path = require("path");
const fs = require("fs");
const { execSync } = require("child_process");
const { chromium } = require(path.join(execSync("npm root -g").toString().trim(), "playwright"));

const BASE = process.env.BASE || "http://127.0.0.1:4401/";
const GRADES = (process.env.GRADES || "K,3,7,11").split(",");
const SHOT = process.env.SHOT;

const state = (page) =>
  page.evaluate(() => {
    const e = window.__ww;
    const c = e.challenge;
    return {
      mode: e.mode, paused: e.paused, level: e.level, score: e.score, lives: e.lives, shield: e.shield, step: e.step,
      strip: e.strip, wordNo: e.wordNo,
      ch: c && { id: c.id, grade: c.grade, kind: c.kind, prompt: c.prompt, steps: c.steps, word: c.word, standard: c.standard },
      segs: e.worms.flatMap((w) => w.segs.map((s) => ({ id: s.id, label: s.label, x: s.x, y: s.y, w: s.w }))),
    };
  });

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
  await page.waitForFunction(() => !!window.__ww);
  const problems = [];

  // Grade badge vs picker
  const badge = await page.locator(".ww-badge").count();
  const picker = await page.locator(".ww-grades").count();
  if (grade && (!badge || picker)) problems.push(`with ?grade= expected badge, got badge=${badge} picker=${picker}`);
  if (!grade) {
    if (badge || !picker) problems.push(`without ?grade= expected picker, got badge=${badge} picker=${picker}`);
    await page.locator(".ww-grade", { hasText: /^4$/ }).click();
    const on = await page.locator(".ww-grade.on").innerText();
    if (on.trim() !== "4") problems.push(`picker did not select grade 4 (${on})`);
  }
  const badgeText = badge ? await page.locator(".ww-badge").innerText() : "";
  const readAloudBtn = await page.locator(".ww-tools button", { hasText: "READ ALOUD" }).innerText().catch(() => "n/a");
  const expectGrade = grade || "4";

  const start = page.locator(".ww-cta", { hasText: "Start" });
  if (touch) await start.tap();
  else await start.click();
  await page.waitForTimeout(300);
  const controlsShown = await page.locator(".ww-controls.show").count();
  if (touch && !controlsShown) problems.push("touch controls hidden on coarse pointer");
  if (!touch && controlsShown) problems.push("touch controls shown for mouse/keyboard");

  const prompts = new Set();
  const solved = [];
  let picks = 0;
  let wrongTested = false;
  let wrongInfo = "";
  let aimed = "not tried";
  let shotPng = null;
  let useLetters = false; // alternate key styles
  const t0 = Date.now();
  let s = await state(page);

  while (Date.now() - t0 < 90000) {
    s = await state(page);
    if (s.mode === "checkpoint") break;
    await page.evaluate(() => (window.__ww.invuln = 5)); // don't die while testing
    if (s.mode !== "play" || !s.ch) {
      await page.waitForTimeout(150);
      continue;
    }
    prompts.add(`${s.ch.kind}: ${s.ch.prompt}`);
    if (s.ch.grade !== expectGrade) problems.push(`challenge ${s.ch.id} is grade ${s.ch.grade}, expected ${expectGrade}`);
    const need = s.ch.steps[s.step];
    const slot = s.strip.indexOf(need);
    if (slot < 0) {
      problems.push(`strip ${s.strip} lacks ${need}`);
      break;
    }
    const letters = s.strip.every((l) => l.length === 1);

    // One deliberate wrong pick per run: check the reason is shown and the shield drops.
    if (!wrongTested && s.strip.length > 1) {
      wrongTested = true;
      const wrong = s.strip.findIndex((l) => l !== need);
      if (touch) await page.locator(".ww-banner .opt").nth(wrong).tap();
      else await page.keyboard.press(String(wrong + 1));
      await page.waitForTimeout(1600);
      wrongInfo = await page.locator(".ww-banner .info").innerText().catch(() => "");
      const after = await state(page);
      if (after.shield >= s.shield) problems.push("wrong pick didn't cost a shield");
      if (!/.{10,}/.test(wrongInfo)) problems.push("wrong pick gave no reason");
      continue;
    }

    // One aimed dart per run (keyboard: Space; touch: FIRE button), lined up under the target.
    if (aimed === "not tried" && s.step === 0) {
      const tgt = s.segs.filter((g) => g.label === need).find((g) => g.x > 30 && g.x < 290);
      if (!tgt && Date.now() - t0 < 30000) {
        await page.waitForTimeout(300); // wait for the target to crawl on screen
        continue;
      }
      if (tgt) {
        aimed = "missed";
        for (let tries = 0; tries < 6 && aimed === "missed"; tries++) {
          const before = (await state(page)).step;
          await page.evaluate((id) => {
            const e = window.__ww;
            const seg = e.worms.flatMap((w) => w.segs.map((g) => ({ g, w }))).find((o) => o.g.id === id);
            if (!seg) return;
            // Lead the target and clear blots in the dart's column.
            const lead = seg.w.dir * 20 * ((e.hy - seg.g.y) / 300);
            const x = seg.g.x + (Math.abs(seg.g.y - (14 + seg.w.r * 13 + 6.5)) < 1 ? lead : 0);
            e.hx = Math.max(0, Math.min(307, x - 5.5));
            for (const [k, b] of e.blots) if (Math.abs(b.c * 10 + 5 - x) < 8) e.blots.delete(k);
          }, tgt.id);
          if (touch) {
            const fire = page.locator(".ww-touch.fire");
            const box = await fire.boundingBox();
            await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
          } else await page.keyboard.press("Space");
          await page.waitForTimeout(700);
          const after = await state(page);
          if (after.step > before || after.ch?.id !== s.ch.id) aimed = "hit";
        }
        continue;
      }
    }

    // Answer with a homing pick.
    picks++;
    if (touch) {
      const seg = s.segs.find((g) => g.label === need && g.x > 8 && g.x < 312 && g.y > 16);
      if (seg && picks % 2 === 0) {
        const box = await page.locator("canvas").boundingBox();
        await page.touchscreen.tap(box.x + (seg.x / 320) * box.width, box.y + (seg.y / 200) * box.height);
      } else await page.locator(".ww-banner .opt").nth(slot).tap();
    } else {
      useLetters = !useLetters;
      const key = useLetters && !letters ? "abcd"[slot] : String(slot + 1);
      await page.keyboard.press(key);
    }
    await page.waitForTimeout(650);
    const after = await state(page);
    if (after.ch && after.ch.id !== s.ch.id) solved.push(s.ch.word);
    else if (after.mode === "solved") solved.push(s.ch.word);

  }
  if (s.mode !== "checkpoint") problems.push(`level 1 not cleared (mode ${s.mode}, worm ${s.wordNo})`);

  // Transmission checkpoint: key on keyboard, tap on touch
  await page.waitForSelector('[aria-label="Transmission question"]', { timeout: 8000 }).catch(() => problems.push("checkpoint never appeared"));
  const cpPrompt = await page.locator(".ww-prompt").innerText().catch(() => "");
  const cpStd = await page.locator(".ww-tag.std").innerText().catch(() => "");
  if (touch) await page.locator(".ww-btn").nth(1).tap();
  else await page.keyboard.press("b");
  const verdict = await page.locator(".verdict").innerText().catch(() => "");
  if (!verdict) problems.push("checkpoint answer not accepted");
  if (touch) await page.locator(".ww-cta", { hasText: "Next level" }).tap();
  else await page.keyboard.press("Enter");
  await page.waitForTimeout(500);
  s = await state(page);
  if (s.level !== 2 || s.mode !== "play") problems.push(`after checkpoint: level ${s.level}, mode ${s.mode}`);

  // Screenshot (grade 7 keyboard): wait for the level-2 worm to wind well onto the page, then split it once.
  if (SHOT && grade === "7" && !touch) {
    for (let i = 0; i < 120; i++) {
      const st = await state(page);
      await page.evaluate(() => (window.__ww.invuln = 3));
      const onScreen = st.segs.filter((g) => g.x > 6 && g.x < 314).length;
      if (st.mode === "play" && onScreen >= st.segs.length && st.segs.some((g) => g.y > 40)) break;
      await page.waitForTimeout(250);
    }
    const st = await state(page);
    const need = st.ch && st.ch.steps[st.step];
    const slot = st.strip.indexOf(need);
    if (slot >= 0) await page.keyboard.press(String(slot + 1));
    await page.waitForTimeout(450);
    await page.keyboard.down("Space");
    await page.waitForTimeout(120);
    await page.evaluate(
      () =>
        new Promise((res) => {
          const e = window.__ww;
          if (e.pest && Math.abs(e.pest.x - (e.hx + 6)) < 40) e.pest.x = e.hx > 160 ? 30 : 290;
          e.invuln = 0;
          requestAnimationFrame(() => requestAnimationFrame(res));
        }),
    );
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
    await page.keyboard.up("Space");
  }

  // Layout: no horizontal scroll, fits the viewport height
  const layout = await page.evaluate(() => {
    const scr = document.querySelector(".ww-screen").getBoundingClientRect();
    const ctrl = document.querySelector(".ww-controls").getBoundingClientRect();
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

  // Game over -> mission report
  for (let i = 0; i < 20; i++) {
    const m = (await state(page)).mode;
    if (m === "over") break;
    const died = await page.evaluate(() => window.__ww.mode === "play" && (window.__ww.die(), true));
    await page.waitForTimeout(died ? 1900 : 600);
  }
  await page.waitForSelector(".ww-report-table", { timeout: 5000 }).catch(() => problems.push("mission report missing"));
  const reportRows = await page.locator(".ww-report-table tbody tr").allInnerTexts().catch(() => []);
  if (!reportRows.some((r) => /checkpoint|questions/.test(r)) && reportRows.length < 2) problems.push("report lacks rows");

  await ctx.close();
  return {
    grade: grade || "(picker→4)", mode, problems, errors, badgeText, readAloudBtn, prompts: [...prompts].slice(0, 5), solved, aimed,
    wrongInfo: wrongInfo.slice(0, 90), cpPrompt: cpPrompt.slice(0, 70), cpStd, verdict: verdict.slice(0, 50), layout, reportRows, shotPng,
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
