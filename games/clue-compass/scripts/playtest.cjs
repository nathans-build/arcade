/*
 * Automated playtest (dev only). Needs a running preview and a global Playwright:
 *   npm run build && npx vite preview --port 4645 --host 127.0.0.1 &
 *   BASE=http://127.0.0.1:4645/ node scripts/playtest.cjs   # SHOT=1 also saves docs/screenshot.png and docs/world.png
 * Runs keyboard 1280x800, iPad landscape 1080x810 (touch) and iPad portrait 810x1080 (touch) at
 * grades K, 2, 4, 5, 6, 7, 8 and 11 (?grade=, badge not picker; grades 5+ show a small "also try
 * Thread Chasers" note) and once with no ?grade (picker). Each run plays a whole mission: brief →
 * witnesses → one wrong trip with its explanation → the right trips → hideout → transmission (by
 * key or by tap) → next case → report. Grade 11 also taps the 4th witness at a stop with a
 * mixed-up witness and checks the lat/long grid is on. Checks: no page errors, no page scroll, the
 * screen fits, standards in the report.
 */
const path = require("path");
const fs = require("fs");
const { execSync } = require("child_process");
const { chromium } = require(path.join(execSync("npm root -g").toString().trim(), "playwright"));

const BASE = process.env.BASE || "http://127.0.0.1:4645/";
/** The band each grade should get, and the standards prefix its case legs should be reported with. */
const EXPECT = {
  K: ["K", /^K\./], 2: ["1-2", /^2\./], 4: ["4", /^4\./], 5: ["5", /^5\./], 6: ["6", /^6\./], 7: ["7", /^7\./], 8: ["8", /^8\./],
  11: ["9-12", /^(WH|ESS\.EES)\./],
};
const SHOT = !!process.env.SHOT;
const DOCS = path.join(__dirname, "..", "docs");

const DEVICES = {
  keyboard: { viewport: { width: 1280, height: 800 } },
  ipad: { viewport: { width: 1080, height: 810 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 },
  ipadPortrait: { viewport: { width: 810, height: 1080 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 },
};

async function newPage(browser, dev) {
  const ctx = await browser.newContext(DEVICES[dev]);
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (m) => {
    if (m.type() === "error" && !/fonts\.(googleapis|gstatic)|ERR_|Failed to load resource/.test(m.text())) errors.push(m.text());
  });
  return { ctx, page, errors };
}

const S = (page) =>
  page.evaluate(() => {
    const g = window.__cc;
    const u = g.ui;
    const r = u.run;
    return {
      phase: u.phase,
      view: u.view,
      grade: u.grade,
      band: u.band,
      caseIdx: u.caseIdx,
      cases: u.mission.length,
      caseId: r ? r.c.id : null,
      next: r && r.phase === "stop" && r.stop < r.c.stops.length - 1 ? r.next.id : null,
      options: r ? r.options : [],
      tried: r ? [...r.tried] : [],
      witnesses: r ? r.witnesses.length : 0,
      heard: r ? r.witnesses.filter((w) => w.heard).length : 0,
      finalPick: r ? r.finalPick : false,
      q: u.q ? { answer: u.q.q.answer, picked: u.q.picked, std: u.q.q.standard } : null,
      score: u.score,
    };
  });

async function layout(page, problems, where) {
  const l = await page.evaluate(() => {
    const s = document.querySelector(".cc-screen");
    const r = s ? s.getBoundingClientRect() : null;
    return {
      hScroll: document.documentElement.scrollWidth > window.innerWidth,
      vScroll: document.documentElement.scrollHeight > window.innerHeight,
      screenW: r ? Math.round(r.width) : 0,
      screenBottom: r ? Math.round(r.bottom) : 0,
      vh: window.innerHeight,
    };
  });
  if (l.hScroll) problems.push(`${where}: horizontal scroll`);
  if (l.vScroll || l.screenBottom > l.vh) problems.push(`${where}: doesn't fit the height ${JSON.stringify(l)}`);
  if (l.screenW < 400) problems.push(`${where}: game screen small (${l.screenW}px)`);
}

async function waitPhase(page, phases, ms = 4000) {
  const t0 = Date.now();
  for (;;) {
    const s = await S(page);
    if (phases.includes(s.phase)) return s;
    if (Date.now() - t0 > ms) throw new Error(`timeout waiting for ${phases} (phase ${s.phase})`);
    await page.waitForTimeout(60);
  }
}

/** Tap a point of the 320x200 canvas. */
async function tapCanvas(page, x, y) {
  const box = await page.locator(".cc-screen canvas").boundingBox();
  await page.touchscreen.tap(box.x + (x / 320) * box.width, box.y + (y / 200) * box.height);
}

async function saveCanvas(page, file) {
  const data = await page.evaluate(() => {
    const src = document.querySelector(".cc-screen canvas");
    const c = document.createElement("canvas");
    c.width = 640;
    c.height = 400;
    const ctx = c.getContext("2d");
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(src, 0, 0, 640, 400);
    return c.toDataURL("image/png");
  });
  fs.writeFileSync(file, Buffer.from(data.split(",")[1], "base64"));
}

async function playMission(page, dev, log, problems, grade) {
  const touch = dev !== "keyboard";
  const tag = `${dev}`;
  let didWrong = false;
  let didPin = false;
  let didCanvasWitness = false;
  let transmissions = 0;
  for (let guard = 0; guard < 120; guard++) {
    const s = await S(page);
    if (s.phase === "report") break;
    if (s.phase === "brief") {
      await layout(page, problems, `${tag} brief`);
      if (touch) await page.locator(".cc-panel .cc-cta").tap();
      else await page.keyboard.press("Enter");
      await waitPhase(page, ["stop"]);
      continue;
    }
    if (s.phase === "stop") {
      // talk to the first witness (keyboard: Enter on focus; touch: the panel button, once on the canvas sprite)
      if (s.witnesses > 0 && s.heard === 0) {
        if (!touch) await page.keyboard.press("Enter");
        else if (!didCanvasWitness) {
          await tapCanvas(page, 128, 160);
          didCanvasWitness = true;
        } else await page.locator(".cc-witness").first().tap();
        await page.waitForTimeout(80);
        const h = (await S(page)).heard;
        if (h < 1) problems.push(`${tag}: talking to a witness didn't work`);
        const clue = await page.locator(".cc-witness.heard").first().innerText().catch(() => "");
        if (clue.length < 10) problems.push(`${tag}: no clue text shown`);
      }
      const st = await S(page);
      const right = st.options.indexOf(st.next);
      // one wrong trip per mission, with its explanation
      if (!didWrong) {
        const wrong = st.options.findIndex((o) => o !== st.next && !st.tried.includes(o));
        if (touch) await page.locator(".cc-choice").nth(wrong).tap();
        else await page.keyboard.press("abcd"[wrong]);
        const d = await waitPhase(page, ["deadend", "escaped"]);
        if (d.phase === "deadend") {
          const lesson = await page.locator(".cc-lesson").innerText();
          log.push(`${tag} wrong trip → ${lesson.slice(0, 110)}…`);
          if (lesson.length < 30) problems.push(`${tag}: dead end has no explanation`);
          await layout(page, problems, `${tag} dead end`);
          if (touch) await page.locator(".cc-panel .cc-cta").tap();
          else await page.keyboard.press("Enter");
          await waitPhase(page, ["stop"]);
          const back = await S(page);
          if (!back.tried.length) problems.push(`${tag}: wrong option not marked as tried`);
        }
        didWrong = true;
        continue;
      }
      // touch: once, pick the right destination by tapping its pin tag on the map
      if (touch && !didPin) {
        await page.locator(".cc-small").first().tap();
        await page.waitForTimeout(150);
        const rect = await page.evaluate((id) => {
          const sc = window.__cc.screen;
          sc.draw();
          return (sc.tagRects || []).find((r) => r.id === id) || null;
        }, st.next);
        if (!rect) problems.push(`${tag}: no map tag for the right destination`);
        else {
          await tapCanvas(page, rect.x + rect.w / 2, rect.y + rect.h / 2);
          didPin = true;
          log.push(`${tag} picked ${st.next} by tapping its map pin`);
        }
        if (SHOT && dev === "ipad") {
          /* the travel animation is quick in fast mode; the map shot is taken by the keyboard run */
        }
      } else if (touch) await page.locator(".cc-choice").nth(right).tap();
      else await page.keyboard.press(String(right + 1));
      await waitPhase(page, ["stop", "found", "escaped", "deadend"]);
      continue;
    }
    if (s.phase === "found" || s.phase === "escaped") {
      if (s.phase !== "found") problems.push(`${tag}: case ${s.caseId} not solved (${s.phase})`);
      log.push(`${tag} ${s.caseId}: ${s.phase}`);
      await layout(page, problems, `${tag} found`);
      if (touch) await page.locator(".cc-panel .cc-cta").tap();
      else await page.keyboard.press("Enter");
      await waitPhase(page, ["transmission", "report"]);
      continue;
    }
    if (s.phase === "transmission") {
      const dlg = page.locator('[aria-label="Transmission question"]');
      if (!(await dlg.count())) problems.push(`${tag}: no transmission dialog`);
      const pick = (s.q.answer + (transmissions % 2)) % 4; // one right, one wrong
      if (touch) await dlg.locator(".cc-choice").nth(pick).tap();
      else await page.keyboard.press(transmissions % 2 ? String(pick + 1) : "abcd"[pick]);
      await page.waitForTimeout(100);
      const v = await dlg.locator(".verdict").innerText();
      log.push(`${tag} transmission ${s.q.std} (${touch ? "tap" : "key"}): ${v}`);
      transmissions++;
      await layout(page, problems, `${tag} transmission`);
      if (touch) await dlg.locator(".cc-cta").tap();
      else await page.keyboard.press("Enter");
      await waitPhase(page, ["brief"]);
      continue;
    }
    await page.waitForTimeout(60);
  }
  const s = await S(page);
  if (s.phase !== "report") problems.push(`${tag}: mission did not reach the report (${s.phase})`);
  else {
    const rows = await page.locator(".cc-report tbody tr").allInnerTexts();
    log.push(`${tag} report: ${rows.map((r) => r.replace(/\s+/g, " ")).join(" | ")}`);
    if (!rows.length) problems.push(`${tag}: report has no standards`);
    const caseRows = rows.filter((r) => !/transmission|reading/.test(r));
    if (!caseRows.length || !caseRows.every((r) => EXPECT[grade][1].test(r.trim()))) problems.push(`${tag}: report standards don't fit grade ${grade}: ${caseRows.join(" | ")}`);
    if (!transmissions) problems.push(`${tag}: no transmission between cases`);
    await layout(page, problems, `${tag} report`);
  }
}

(async () => {
  const browser = await chromium.launch();
  const problems = [];
  const log = [];
  const runs = [
    ["K", "keyboard"], ["K", "ipad"], ["K", "ipadPortrait"],
    ["2", "keyboard"], ["2", "ipad"], ["2", "ipadPortrait"],
    ["4", "keyboard"], ["4", "ipad"], ["4", "ipadPortrait"],
    ["5", "keyboard"], ["5", "ipad"], ["5", "ipadPortrait"],
    ["6", "keyboard"], ["6", "ipad"], ["6", "ipadPortrait"],
    ["7", "keyboard"], ["7", "ipad"], ["7", "ipadPortrait"],
    ["8", "keyboard"], ["8", "ipad"], ["8", "ipadPortrait"],
    ["11", "keyboard"], ["11", "ipad"], ["11", "ipadPortrait"],
  ];
  for (const [grade, dev] of runs) {
    const { ctx, page, errors } = await newPage(browser, dev);
    const where = `grade ${grade} ${dev}`;
    try {
      await page.goto(`${BASE}?grade=${grade}&debug&fast`);
      await page.waitForTimeout(500);
      if (!(await page.locator(".cc-badge").count())) problems.push(`${where}: no grade badge`);
      if (await page.locator(".cc-grades").count()) problems.push(`${where}: picker shown with ?grade`);
      const also = await page.locator(".cc-also").count();
      if ((Number(grade) >= 5) !== !!also) problems.push(`${where}: "also try Thread Chasers" note ${also ? "shown" : "missing"}`);
      if (await page.locator(".cc-older").count()) problems.push(`${where}: the old "go play Thread Chasers" redirect is still there`);
      const st = await S(page);
      if (st.band !== EXPECT[grade][0]) problems.push(`${where}: band ${st.band}, want ${EXPECT[grade][0]}`);
      log.push(`${where}: band ${st.band}${also ? " (+ Thread Chasers mention)" : ""}`);
      await layout(page, problems, `${where} title`);
      if (dev === "keyboard") await page.keyboard.press("Enter");
      else await page.locator(".cc-start").tap();
      await waitPhase(page, ["brief"]);
      // read-aloud default: on for K–2
      const ra = await page.locator('.cc-tools button[aria-pressed]').getAttribute("aria-pressed").catch(() => null);
      if (ra !== null && (grade === "K" || grade === "2") !== (ra === "true")) problems.push(`${where}: read-aloud default wrong (${ra})`);
      await playMission(page, dev, log, problems, grade);
      if (grade === "11" && dev !== "keyboard") {
        // a stop with a mixed-up witness has 4 witnesses: tap the 4th sprite on the canvas
        await page.evaluate(() => {
          const g = window.__cc;
          g.start("h-logger");
          g.startChase();
          g.chooseId(g.ui.run.next.id); // Singapore → Quito (fast travel)
        });
        await waitPhase(page, ["stop"]);
        const n = await page.evaluate(() => window.__cc.ui.run.witnesses.length);
        if (n !== 4) problems.push(`${where}: expected 4 witnesses at the mixed-up stop, got ${n}`);
        await tapCanvas(page, 250, 160);
        await page.waitForTimeout(100);
        const heard4 = await page.evaluate(() => window.__cc.ui.run.witnesses[3].heard);
        if (!heard4) problems.push(`${where}: tapping the 4th witness didn't work`);
        else log.push(`${where}: tapped the 4th witness at a mixed-up stop`);
        await layout(page, problems, `${where} 4 witnesses`);
        await page.locator(".cc-small").first().tap();
        await page.waitForTimeout(150);
        const grid = await page.evaluate(() => window.__cc.screen.view && window.__cc.screen.view.grid);
        if (!grid) problems.push(`${where}: no lat/long grid on the 9–12 map`);
        if (SHOT && dev === "ipad") {
          await page.waitForTimeout(500);
          await saveCanvas(page, path.join(DOCS, "world.png"));
          log.push("saved docs/world.png");
        }
      }
      if (SHOT && grade === "4" && dev === "keyboard") {
        // a map mid-chase for the README: start a new mission and open the map
        await page.keyboard.press("Enter");
        await waitPhase(page, ["brief"]);
        await page.keyboard.press("Enter");
        await waitPhase(page, ["stop"]);
        await page.keyboard.press("Enter");
        await page.keyboard.press("v");
        await page.waitForTimeout(700);
        fs.mkdirSync(DOCS, { recursive: true });
        await saveCanvas(page, path.join(DOCS, "screenshot.png"));
        await saveCanvas(page, path.join(DOCS, "map.png"));
        await page.keyboard.press("v");
        await page.waitForTimeout(300);
        await saveCanvas(page, path.join(DOCS, "scene.png"));
        log.push("saved docs/screenshot.png");
      }
    } catch (e) {
      problems.push(`${where}: ${e.message}`);
    }
    for (const e of errors) problems.push(`${where}: page error ${e}`);
    await ctx.close();
  }
  // no ?grade: the picker shows and changing the grade changes the case files
  {
    const { ctx, page, errors } = await newPage(browser, "keyboard");
    await page.goto(`${BASE}?debug&fast`);
    await page.waitForTimeout(400);
    if (!(await page.locator(".cc-grades").count())) problems.push("no ?grade: picker missing");
    await page.locator(".cc-grade", { hasText: /^3$/ }).click();
    await page.waitForTimeout(150);
    const b = (await S(page)).band;
    if (b !== "3") problems.push(`picker: grade 3 gave band ${b}`);
    const n = await page.locator(".cc-case").count();
    log.push(`no ?grade: picker shown, grade 3 → band ${b}, ${n} case files`);
    for (const e of errors) problems.push(`picker: page error ${e}`);
    await ctx.close();
  }
  await browser.close();
  for (const l of log) console.log("  " + l);
  if (problems.length) {
    console.error(`\n${problems.length} problem(s):`);
    for (const p of problems) console.error("  ✘ " + p);
    process.exit(1);
  }
  console.log("\nPlaytest passed.");
})();
