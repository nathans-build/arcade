/*
 * Automated playtest (dev only). Needs a running preview and a global Playwright:
 *   npm run build && npx vite preview --port 4407 --host 127.0.0.1 &
 *   node scripts/playtest.cjs            # GRADES=K,3,7,11 by default; SHOT=docs/screenshot.png saves a canvas shot
 * For each grade it plays level 1 with the keyboard (1280x800) and with touch (iPad 1080x810):
 * picks a subject, walks the chef across a slab (it must drop a girder), climbs a ladder, sprays
 * spice, drops one slab out of order (it must bounce with a reason), finishes the stack with picks
 * (keys 1-4 / A-D, strip taps, taps on slabs), answers the transmission with a key or a tap,
 * checks the layout fits, then loses all lives and checks the mission report. One extra run
 * without ?grade= checks that the grade picker shows.
 */
const path = require("path");
const fs = require("fs");
const { execSync } = require("child_process");
const { chromium } = require(path.join(execSync("npm root -g").toString().trim(), "playwright"));

const BASE = process.env.BASE || "http://127.0.0.1:4407/";
const GRADES = (process.env.GRADES || "K,3,7,11").split(",");
const SHOT = process.env.SHOT;
const SUBJECT = { K: "SCIENCE", 3: "MATH", 7: "ELA", 11: "MIXED", 4: "MATH" };
const BAND_STEPS = (g) => (g === "K" || +g <= 2 ? [3, 3] : +g <= 5 ? [4, 4] : [4, 5]);

const state = (page) =>
  page.evaluate(() => {
    const e = window.__sc;
    const s = e.seq;
    return {
      mode: e.mode, paused: e.paused, level: e.level, score: e.score, lives: e.lives, spice: e.spice, wrongs: e.wrongs,
      cx: e.cx, cy: e.cy, cFloor: e.cFloor, onLadder: !!e.cLadder, busy: e.busy, canPick: e.canPick(),
      stack: e.stack.length,
      seq: s && { id: s.id, grades: s.grades, title: s.title, steps: s.steps, standard: s.standard, subject: s.subject },
      strip: e.strip.map((it) => ({ slot: it.slot, label: it.label, id: it.slabId })),
      slabs: e.slabs.map((sl) => ({ id: sl.id, idx: sl.idx, label: sl.label, state: sl.state, floor: sl.floor, col: sl.col, x: sl.x, y: sl.y })),
      floorY: e.layout.floorY,
      ladders: e.layout.ladders,
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
  await page.waitForFunction(() => !!window.__sc);
  const problems = [];
  const tapOrClick = async (loc) => (touch ? loc.tap() : loc.click());

  // Grade badge vs picker
  const badge = await page.locator(".sc-badge").count();
  const picker = await page.locator(".sc-grades").count();
  if (grade && (!badge || picker)) problems.push(`with ?grade= expected badge, got badge=${badge} picker=${picker}`);
  if (!grade) {
    if (badge || !picker) problems.push(`without ?grade= expected picker, got badge=${badge} picker=${picker}`);
    await page.locator(".sc-grade", { hasText: /^4$/ }).click();
    const on = await page.locator(".sc-grade.on").innerText();
    if (on.trim() !== "4") problems.push(`picker did not select grade 4 (${on})`);
  }
  const badgeText = badge ? await page.locator(".sc-badge").innerText() : "";
  const readAloudBtn = await page.locator(".sc-tools button", { hasText: "READ ALOUD" }).innerText().catch(() => "n/a");
  const expectGrade = grade || "4";
  const subject = SUBJECT[expectGrade];
  await tapOrClick(page.locator(".sc-subject", { hasText: subject }));
  const subjOn = await page.locator(".sc-subject.on").innerText();
  if (subjOn.trim() !== subject) problems.push(`subject picker shows ${subjOn}`);

  await tapOrClick(page.locator(".sc-cta", { hasText: "Start" }));
  await page.waitForTimeout(400);
  const controlsShown = await page.locator(".sc-controls.show").count();
  if (touch && !controlsShown) problems.push("touch controls hidden on coarse pointer");
  if (!touch && controlsShown) problems.push("touch controls shown for mouse/keyboard");

  let s = await state(page);
  const seqs = [];
  const checkSeq = (st) => {
    if (!st.seq) return;
    if (!seqs.some((q) => q.id === st.seq.id)) seqs.push(st.seq);
    if (!st.seq.grades.includes(expectGrade)) problems.push(`sequence ${st.seq.id} is for ${st.seq.grades}, expected ${expectGrade}`);
    const [lo, hi] = BAND_STEPS(expectGrade);
    if (st.seq.steps.length < lo || st.seq.steps.length > hi) problems.push(`sequence ${st.seq.id} has ${st.seq.steps.length} slabs`);
    const want = { SCIENCE: "science", MATH: "math", ELA: "ela" }[subject];
    if (want && st.seq.subject !== want) problems.push(`subject ${st.seq.subject}, picked ${subject}`);
  };
  checkSeq(s);
  await page.evaluate(() => (window.__sc.invuln = 999));

  // 1. Walk: put the chef at the left end of a slab's girder and walk right across it.
  const hold = async (action, ms) => {
    if (touch) {
      const label = { left: "Move left", right: "Move right", up: "Climb up", down: "Climb down" }[action];
      const box = await page.locator(`[aria-label="${label}"]`).boundingBox();
      // Touch-hold: pointerdown ... pointerup on the button.
      await page.locator(`[aria-label="${label}"]`).dispatchEvent("pointerdown");
      await page.waitForTimeout(ms);
      await page.locator(`[aria-label="${label}"]`).dispatchEvent("pointerup");
      return box;
    }
    const key = { left: "ArrowLeft", right: "ArrowRight", up: "ArrowUp", down: "ArrowDown" }[action];
    await page.keyboard.down(key);
    await page.waitForTimeout(ms);
    await page.keyboard.up(key);
  };
  let walk = "not tried";
  {
    const target = s.slabs.find((sl) => sl.state === "rest");
    const moved = await page.evaluate((id) => {
      const e = window.__sc;
      const sl = e.slabs.find((x) => x.id === id);
      const w = { k2: 75, 35: 54, 68: 54, hs: 54 }[e.band];
      e.cFloor = sl.floor;
      e.cLadder = null;
      e.cy = e.layout.floorY[sl.floor];
      e.cx = Math.max(6, sl.x - w / 2 - 4);
      return { floor: sl.floor, x: e.cx };
    }, target.id);
    await hold("right", 1900);
    const after = await state(page);
    const sl = after.slabs.find((x) => x.id === target.id);
    walk = sl.state !== "rest" || sl.floor !== moved.floor ? `dropped (${sl.state}, floor ${moved.floor}→${sl.floor})` : "did not drop";
    if (walk === "did not drop") problems.push(`walking across ${target.label} did not drop it`);
  }
  // 2. Climb: stand at the foot of a ladder and hold up.
  let climb = "not tried";
  {
    const lad = s.ladders[0];
    await page.evaluate((l) => {
      const e = window.__sc;
      e.cFloor = l.bottom;
      e.cLadder = null;
      e.cy = e.layout.floorY[l.bottom];
      e.cx = l.x + 5;
    }, lad);
    await hold("up", 1500);
    const after = await state(page);
    climb = after.onLadder || after.cFloor < lad.bottom ? `climbed (floor ${lad.bottom}→${after.cFloor}${after.onLadder ? ", on ladder" : ""})` : "stuck";
    if (climb === "stuck") problems.push("could not climb a ladder");
  }
  // 3. Spice
  {
    const before = (await state(page)).spice;
    if (touch) await page.locator(".sc-touch.fire").dispatchEvent("pointerdown"), await page.locator(".sc-touch.fire").dispatchEvent("pointerup");
    else await page.keyboard.press("Space");
    await page.waitForTimeout(250);
    const after = (await state(page)).spice;
    if (after !== before - 1) problems.push(`spice ${before} → ${after}`);
  }

  // Wait until nothing is in flight.
  const settle = async () => {
    for (let i = 0; i < 60; i++) {
      const st = await state(page);
      if (st.mode !== "play" || st.canPick) return st;
      await page.waitForTimeout(150);
    }
    return state(page);
  };

  // 4. One deliberate wrong pick: it bounces back with a reason.
  let wrongInfo = "";
  s = await settle();
  {
    const wrongItem = s.strip.find((it) => s.slabs.find((sl) => sl.id === it.id).idx !== s.stack);
    if (wrongItem) {
      if (touch) await page.locator(".sc-banner .opt").nth(wrongItem.slot).tap();
      else await page.keyboard.press(String(wrongItem.slot + 1));
      await page.waitForTimeout(600);
      await settle();
      wrongInfo = await page.locator(".sc-banner .info").innerText().catch(() => "");
      const after = await state(page);
      if (after.wrongs < 1) problems.push("wrong slab was not bounced");
      if (!/before|greater|less|already/.test(wrongInfo)) problems.push(`wrong drop gave no reason: ${wrongInfo}`);
      const back = after.slabs.find((sl) => sl.id === wrongItem.id);
      if (back.state !== "rest") problems.push(`bounced slab is ${back.state}, not back on a girder`);
    }
  }

  // 5. Finish the stack with picks: keys (alternating 1-4 and A-D), strip taps and slab taps.
  let picks = 0;
  const pickWays = new Set();
  const t0 = Date.now();
  while (Date.now() - t0 < 60000) {
    s = await settle();
    checkSeq(s);
    if (s.mode !== "play") break;
    const needSlab = s.slabs.find((sl) => sl.idx === s.stack && sl.state === "rest");
    const item = needSlab && s.strip.find((it) => it.id === needSlab.id);
    if (!item) {
      await page.waitForTimeout(200);
      continue;
    }
    picks++;
    if (touch) {
      if (picks % 2 === 0) {
        const box = await page.locator("canvas").boundingBox();
        await page.touchscreen.tap(box.x + (needSlab.x / 320) * box.width, box.y + ((needSlab.y - 3) / 200) * box.height);
        pickWays.add("tap slab");
      } else {
        await page.locator(".sc-banner .opt").nth(item.slot).tap();
        pickWays.add("tap strip");
      }
    } else {
      const key = picks % 2 === 0 ? "abcd"[item.slot] : String(item.slot + 1);
      pickWays.add(/\d/.test(key) ? "digit key" : "letter key");
      await page.keyboard.press(key);
    }
    await page.waitForTimeout(500);
  }
  s = await state(page);
  if (!["done", "checkpoint"].includes(s.mode)) problems.push(`level 1 not finished (mode ${s.mode}, stack ${s.stack})`);
  const doneInfo = await page.locator(".sc-banner .info").innerText().catch(() => "");

  // Transmission checkpoint: key on keyboard, tap on touch
  await page.waitForSelector('[aria-label="Transmission question"]', { timeout: 8000 }).catch(() => problems.push("checkpoint never appeared"));
  const cpPrompt = await page.locator(".sc-prompt").innerText().catch(() => "");
  const cpStd = await page.locator(".sc-tag.std").innerText().catch(() => "");
  if (touch) await page.locator(".sc-btn").nth(1).tap();
  else await page.keyboard.press("b");
  const verdict = await page.locator(".verdict").innerText().catch(() => "");
  if (!verdict) problems.push("checkpoint answer not accepted");
  if (touch) await page.locator(".sc-cta", { hasText: "Next level" }).tap();
  else await page.keyboard.press("Enter");
  await page.waitForTimeout(500);
  s = await state(page);
  checkSeq(s);
  if (s.level !== 2 || s.mode !== "play") problems.push(`after checkpoint: level ${s.level}, mode ${s.mode}`);

  // Screenshot (grade 7 keyboard): level 2 mid-play, one slab stacked, one sagging under the chef.
  let shotPng = null;
  if (SHOT && grade === "7" && !touch) {
    await page.waitForTimeout(2600); // let the level banner clear
    s = await settle();
    const need = s.slabs.find((sl) => sl.idx === 0);
    const it = s.strip.find((x) => x.id === need.id);
    if (it) await page.keyboard.press(String(it.slot + 1));
    await page.waitForTimeout(2200);
    s = await state(page);
    const other = s.slabs.find((sl) => sl.state === "rest" && sl.floor > 0);
    await page.evaluate((id) => {
      const e = window.__sc;
      const sl = e.slabs.find((x) => x.id === id);
      e.cFloor = sl.floor;
      e.cy = e.layout.floorY[sl.floor];
      e.cx = sl.x - 6;
      sl.stepped = [true, true, false, false];
      e.invuln = 0;
      const c = e.critters.find((k) => k.away <= 0);
      if (c) c.stun = 3;
    }, other.id);
    await page.keyboard.down("Space");
    await page.waitForTimeout(160);
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
    await page.evaluate(() => (window.__sc.invuln = 999));
  }

  // Layout: no horizontal scroll, fits the viewport height
  const layout = await page.evaluate(() => {
    const scr = document.querySelector(".sc-screen").getBoundingClientRect();
    const ctrl = document.querySelector(".sc-controls").getBoundingClientRect();
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
    const died = await page.evaluate(() => window.__sc.mode === "play" && (window.__sc.debugDie(), true));
    await page.waitForTimeout(died ? 1900 : 600);
  }
  await page.waitForSelector(".sc-report-table", { timeout: 5000 }).catch(() => problems.push("mission report missing"));
  const reportRows = await page.locator(".sc-report-table tbody tr").allInnerTexts().catch(() => []);
  // One row per standard (a stack and a question can share a standard).
  if (reportRows.length < 1) problems.push("report lacks rows");
  const practice = await page.locator(".sc-panel .sc-help", { hasText: "Practice next" }).count();

  await ctx.close();
  return {
    grade: grade || "(picker→4)", mode, subject, problems, errors, badgeText, readAloudBtn,
    stacks: seqs.map((q) => `${q.title} [${q.standard}]: ${q.steps.join(" → ")}`), walk, climb, picks, pickWays: [...pickWays],
    wrongInfo: wrongInfo.slice(0, 110), doneInfo: doneInfo.slice(0, 110), cpPrompt: cpPrompt.slice(0, 70), cpStd, verdict: verdict.slice(0, 50),
    layout, reportRows, practiceNext: practice > 0, shotPng,
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
