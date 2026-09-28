/*
 * Automated playtest (dev only). Needs a running preview and a global Playwright:
 *   npm run build && npx vite preview --port 4403 --host 127.0.0.1 &
 *   node scripts/playtest.cjs            (SHOT=docs/screenshot.png to save a canvas picture)
 * For each grade it plays a level with the keyboard (1280x800) and with touch (iPad 1080x810):
 * hops across the road (traffic collisions switched off through the ?debug hook), crosses the
 * river only on logs that follow the rule (one deliberate rule-breaker checks the sinking + shield),
 * picks a wrong home once and then the right one (keys A-D / taps), answers the transmission
 * (key / tap), checks the next level starts, the layout fits, and the mission report appears.
 * Also checks that the grade picker shows when there is no ?grade= in the link.
 */
const path = require("path");
const fs = require("fs");
const { execSync } = require("child_process");
const { chromium } = require(path.join(execSync("npm root -g").toString().trim(), "playwright"));

const BASE = process.env.BASE || "http://127.0.0.1:4403/";
const GRADES = (process.env.GRADES || "K,3,7,11").split(",");
const SHOT = process.env.SHOT;

const state = (page) =>
  page.evaluate(() => {
    const e = window.__ll;
    const rows = e.rows.map((r) => ({
      kind: r.kind,
      objs: r.objs.map((o) => ({ x: o.x, w: o.w, state: o.state, label: o.item && o.item.label, match: o.item && o.item.match })),
      dir: r.dir,
      speed: r.speed,
    }));
    return {
      mode: e.mode, level: e.level, score: e.score, lives: e.lives, shields: e.shields, heroRow: e.heroRow, heroX: e.heroX,
      hop: !!e.hop, rows, slots: [...e.slots], answer: e.q && e.q.answer, choices: e.q && e.q.choices,
      rule: e.rule && { id: e.rule.id, grade: e.rule.grade, subject: e.rule.subject, text: e.rule.text },
    };
  });

/** Is there a log of the wanted kind under x in row r, with some margin, soon? */
function logUnder(row, x, wantMatch) {
  return row.objs.find((o) => o.label && o.state !== "gone" && o.state !== "sinking" && (wantMatch === null || o.match === wantMatch) && x >= o.x + 4 && x <= o.x + o.w - 4);
}

async function run(browser, grade, mode, opts = {}) {
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
  await page.waitForFunction(() => !!window.__ll);
  const problems = [];
  const tap = async (loc) => (touch ? loc.tap() : loc.click());

  // Grade badge instead of a picker
  const badge = await page.locator(".ll-gradebadge").innerText().catch(() => "");
  const pickers = await page.locator(".ll-grade").count();
  const want = grade === "K" ? "KINDERGARTEN" : `GRADE ${grade}`;
  if (!badge.includes(want) || !badge.includes("CHANGE GRADE IN THE ARCADE")) problems.push(`badge "${badge}"`);
  if (pickers !== 0) problems.push("grade picker shown although ?grade= was given");
  const readAloudBtn = await page.locator(".ll-tools button", { hasText: "READ ALOUD" }).innerText().catch(() => "n/a");

  await tap(page.locator(".ll-subject", { hasText: opts.subject || "MIXED" }));
  await page.waitForTimeout(300);
  const controlsShown = await page.locator(".ll-controls.show").count();
  if (touch && !controlsShown) problems.push("touch controls hidden on coarse pointer");
  if (!touch && controlsShown) problems.push("touch controls shown for mouse/keyboard");

  let s = await state(page);
  const rule1 = s.rule;
  if (!rule1 || rule1.grade !== grade) problems.push(`rule ${JSON.stringify(rule1)} is not for grade ${grade}`);
  const ruleBar = await page.locator(".ll-rule .txt").innerText().catch(() => "");
  if (ruleBar !== rule1.text) problems.push(`rule bar "${ruleBar}" vs ${rule1.text}`);
  const homeQ = await page.locator(".ll-banner .prompt").innerText().catch(() => "");
  const labels = s.rows.flatMap((r) => r.objs.map((o) => o.label).filter(Boolean));

  // Traffic off for the test (the river and the rule still apply).
  await page.evaluate(() => {
    const e = window.__ll;
    e.timeLeft = 999;
    Object.defineProperty(e, "invuln", { get: () => 99, set: () => {}, configurable: true });
  });
  const up = async () => {
    if (touch) await page.locator(".ll-touch.up").tap();
    else await page.keyboard.press("ArrowUp");
  };

  let goodLandings = 0;
  let sinkChecked = false;
  let messages = [];
  let shotPng = null;
  const t0 = Date.now();
  while (Date.now() - t0 < 120000) {
    s = await state(page);
    if (s.mode === "intro") {
      await up(); // skips the intro and hops
      continue;
    }
    if (s.mode !== "play" || s.hop) {
      await page.waitForTimeout(40);
      continue;
    }
    const cur = s.rows[s.heroRow];
    const next = s.rows[s.heroRow + 1];
    if (cur.kind === "bank") break;
    if (next.kind === "river") {
      const x = s.heroX + (cur.kind === "river" ? cur.dir * cur.speed * 0.15 : 0);
      // One deliberate rule-breaker on the first river lane checks sinking + the shield.
      const wantMatch = !sinkChecked && cur.kind === "median" ? false : true;
      if (!logUnder(next, x, wantMatch)) {
        await page.waitForTimeout(30);
        continue;
      }
      const before = s;
      await up();
      await page.waitForTimeout(260);
      const after = await state(page);
      const msg = await page.locator(".ll-rule .msg").innerText().catch(() => "");
      messages.push(msg);
      if (!wantMatch) {
        sinkChecked = true;
        if (!(after.mode === "rescue" || after.mode === "dying" || after.heroRow <= before.heroRow + 1)) problems.push("rule-breaker didn't sink");
        if (after.shields !== before.shields - 1) problems.push(`shield not used (${before.shields} → ${after.shields})`);
        if (!msg.startsWith("✘")) problems.push(`no reason shown for the rule-breaker: "${msg}"`);
        await page.waitForTimeout(1100);
      } else {
        if (after.mode === "play" && after.heroRow === before.heroRow + 1) goodLandings++;
        if (!msg.startsWith("✔")) problems.push(`no ✔ reason after a good landing: "${msg}"`);
      }
      if (SHOT && grade === "7" && !touch && !shotPng && goodLandings >= 1) {
        await page.evaluate(() => { delete window.__ll.invuln; window.__ll.invuln = 0; });
        await page.waitForTimeout(80);
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
        await page.evaluate(() => Object.defineProperty(window.__ll, "invuln", { get: () => 99, set: () => {}, configurable: true }));
      }
      continue;
    }
    await up();
    await page.waitForTimeout(170);
  }
  s = await state(page);
  if (s.rows[s.heroRow].kind !== "bank") problems.push(`never reached the bank (row ${s.heroRow}, mode ${s.mode})`);
  if (goodLandings < 1) problems.push("no good landings");
  if (!sinkChecked) problems.push("sinking never checked");

  // Homes: first a wrong one, then the right one (keys for keyboard, taps for touch).
  const wrong = [0, 1, 2, 3].find((i) => i !== s.answer);
  if (touch) await page.locator(".ll-banner .opt").nth(wrong).tap();
  else await page.keyboard.press("ABCD"[wrong].toLowerCase());
  await page.waitForTimeout(900);
  let st = await state(page);
  if (st.slots[wrong] !== "wrong") problems.push(`wrong home ${wrong} not marked (${st.slots})`);
  const wrongMsg = await page.locator(".ll-rule .msg").innerText().catch(() => "");
  if (!wrongMsg.startsWith("✘")) problems.push(`wrong-home message "${wrongMsg}"`);
  // Choose the right home now (from the start): it is locked in, then cross again.
  await page.waitForTimeout(900);
  if (touch) {
    // Tap the home doorway on the canvas itself.
    const box = await page.locator("canvas").boundingBox();
    const cx = box.x + ((8 + st.answer * 80 + 32) / 320) * box.width;
    const cy = box.y + (18 / 200) * box.height;
    await page.touchscreen.tap(cx, cy);
  } else await page.keyboard.press(String(st.answer + 1));
  await page.waitForTimeout(200);
  const lockHead = await page.locator(".ll-banner .head").innerText().catch(() => "");
  // Cross again with the answer locked: the hero leaps in from the bank.
  const t1 = Date.now();
  while (Date.now() - t1 < 120000) {
    s = await state(page);
    if (s.mode === "clear" || s.mode === "checkpoint") break;
    if (s.mode !== "play" || s.hop) {
      await page.waitForTimeout(40);
      continue;
    }
    const cur = s.rows[s.heroRow];
    const next = s.rows[s.heroRow + 1];
    if (next && next.kind === "river") {
      const x = s.heroX + (cur.kind === "river" ? cur.dir * cur.speed * 0.15 : 0);
      if (!logUnder(next, x, true)) {
        await page.waitForTimeout(30);
        continue;
      }
    }
    await up();
    await page.waitForTimeout(180);
  }

  // Transmission checkpoint
  await page.waitForSelector('[aria-label="Transmission question"]', { timeout: 8000 }).catch(() => problems.push("checkpoint never appeared"));
  const prompt = await page.locator(".ll-prompt").innerText().catch(() => "");
  const std = await page.locator(".ll-tag.std").innerText().catch(() => "");
  if (touch) await page.locator(".ll-btn").nth(2).tap();
  else await page.keyboard.press("c");
  const verdict = await page.locator(".verdict").innerText().catch(() => "");
  if (!verdict) problems.push("no checkpoint verdict");
  if (touch) await page.locator(".ll-cta", { hasText: "Next level" }).tap();
  else await page.keyboard.press("Enter");
  await page.waitForTimeout(500);
  st = await state(page);
  if (st.level !== 2 || !["intro", "play"].includes(st.mode)) problems.push(`after checkpoint: level ${st.level}, mode ${st.mode}`);
  const rule2 = st.rule;

  // Layout: no horizontal scroll, everything fits the viewport height
  const layout = await page.evaluate(() => {
    const scr = document.querySelector(".ll-screen").getBoundingClientRect();
    const ctrl = document.querySelector(".ll-controls").getBoundingClientRect();
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

  // Game over -> mission report
  await page.evaluate(() => {
    const e = window.__ll;
    delete e.invuln;
    e.invuln = 0;
    e.lives = 1;
    e.mode = "play";
    e.die("test", "splat");
  });
  await page.waitForSelector(".ll-report-table", { timeout: 5000 }).catch(() => problems.push("mission report missing"));
  const reportRows = await page.locator(".ll-report-table tbody tr").allInnerTexts().catch(() => []);
  if (reportRows.length === 0) problems.push("empty report");

  await ctx.close();
  return {
    grade, mode, problems, errors, readAloudBtn, rule1: rule1 && rule1.text, rule2: rule2 && rule2.text, sample: labels.slice(0, 6).join(" | "),
    homeQ: homeQ.slice(0, 60), goodLandings, messages: messages.slice(0, 3), lockHead, prompt: prompt.slice(0, 60), std, verdict: verdict.slice(0, 50),
    layout, reportRows: reportRows.slice(0, 4), shotPng,
  };
}

async function pickerRun(browser) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  await page.goto(`${BASE}?debug`, { waitUntil: "load" });
  await page.waitForFunction(() => !!window.__ll);
  const problems = [];
  const n = await page.locator(".ll-grade").count();
  if (n !== 13) problems.push(`picker has ${n} grades`);
  if (await page.locator(".ll-gradebadge").count()) problems.push("badge shown without ?grade=");
  await page.locator(".ll-grade", { hasText: /^5$/ }).click();
  await page.locator(".ll-subject", { hasText: "SCIENCE" }).click();
  await page.waitForTimeout(300);
  const r = await page.evaluate(() => window.__ll.rule);
  if (r.grade !== "5" || r.subject !== "science") problems.push(`picked grade 5 science, got ${r.grade} ${r.subject}`);
  await ctx.close();
  return { run: "no ?grade= (picker)", problems, errors, rule: r.text };
}

(async () => {
  const browser = await chromium.launch();
  let bad = 0;
  for (const grade of GRADES) {
    for (const mode of ["keyboard", "touch"]) {
      const r = await run(browser, grade, mode);
      if (r.shotPng && SHOT) {
        fs.writeFileSync(SHOT, Buffer.from(r.shotPng.split(",")[1], "base64"));
        console.log(`saved ${SHOT}`);
      }
      delete r.shotPng;
      const ok = r.problems.length === 0 && r.errors.length === 0;
      if (!ok) bad++;
      console.log(`${ok ? "PASS" : "FAIL"} grade ${grade} ${mode}`);
      console.log(JSON.stringify(r, null, 1));
    }
  }
  const p = await pickerRun(browser);
  const ok = p.problems.length === 0 && p.errors.length === 0;
  if (!ok) bad++;
  console.log(`${ok ? "PASS" : "FAIL"} picker`);
  console.log(JSON.stringify(p, null, 1));
  await browser.close();
  process.exit(bad ? 1 : 0);
})();
