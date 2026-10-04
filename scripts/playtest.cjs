/*
 * Automated playtest (dev only). Needs a running preview and a global Playwright:
 *   npm run build && npx vite preview --port 4641 --host 127.0.0.1 &
 *   node scripts/playtest.cjs        # GRADES=3,5,8,11 by default; SHOT=docs/screenshot.png saves a canvas shot
 * Grade 3 must show the "for grades 5 and up" gate. Grades 5, 8 and 11 each play all three v1
 * expeditions to arrival, one per mode: keyboard (1280×800), iPad landscape touch (1080×810) and
 * iPad portrait touch (810×1080). Each run checks the grade badge, the store, a math question, a
 * landmark reading, events, a transmission (answered by key in keyboard runs and by tap in touch
 * runs), a "wintered" calendar stop and its retry from the checkpoint, pause, the mission report,
 * no page errors and no page scroll. One run without ?grade= checks the grade picker.
 * Travel days are advanced through the ?debug hook (window.__tl.game.step()).
 */
const path = require("path");
const fs = require("fs");
const { execSync } = require("child_process");
const { chromium } = require(path.join(execSync("npm root -g").toString().trim(), "playwright"));

const BASE = process.env.BASE || "http://127.0.0.1:4641/";
const GRADES = (process.env.GRADES || "3,5,8,11").split(",");
const SHOT = process.env.SHOT;
const MODES = ["keys", "touch", "portrait"];
const EXPS = ["wagon-road", "westward", "northbound"];
const CODE_FOR = { 5: /^(5\.|NC\.[3-7]\.)/, 8: /^(8\.|NC\.[6-9]\.|NC\.M1)/, 11: /^(AH\.|NC\.(8|M\d)|EPF)/ };

const G = (page, expr) => page.evaluate(new Function(`const g = window.__tl.game; return (${expr});`));

async function layoutOk(page, problems, where) {
  const l = await page.evaluate(() => {
    const c = document.querySelector("canvas").getBoundingClientRect();
    return { sw: document.documentElement.scrollWidth, sh: document.documentElement.scrollHeight, iw: innerWidth, ih: innerHeight, cb: c.bottom, cw: c.width };
  });
  if (l.sw > l.iw) problems.push(`${where}: horizontal scroll ${l.sw} > ${l.iw}`);
  if (l.sh > l.ih + 1) problems.push(`${where}: page taller than viewport ${l.sh} > ${l.ih}`);
  if (l.cb > l.ih + 1) problems.push(`${where}: canvas below the viewport`);
  return l;
}

async function run(browser, grade, mode, expIndex) {
  const touch = mode !== "keys";
  const vp = mode === "portrait" ? { width: 810, height: 1080 } : mode === "touch" ? { width: 1080, height: 810 } : { width: 1280, height: 800 };
  const ctx = await browser.newContext(touch ? { viewport: vp, hasTouch: true, isMobile: true, deviceScaleFactor: 2 } : { viewport: vp });
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (m) => {
    if (m.type() === "error" && !/fonts\.(googleapis|gstatic)|ERR_|Failed to load resource/.test(m.text())) errors.push(m.text());
  });
  await page.goto(grade ? `${BASE}?grade=${grade}&debug` : `${BASE}?debug`, { waitUntil: "load" });
  await page.waitForFunction(() => !!window.__tl);
  const problems = [];
  const notes = [];
  const tap = async (loc) => (touch ? loc.tap() : loc.click());

  // Grade badge vs picker
  const badge = await page.locator(".tl-badge").count();
  const picker = await page.locator(".tl-grades").count();
  if (grade && (!badge || picker)) problems.push(`with ?grade= expected the badge, got badge=${badge} picker=${picker}`);
  if (!grade) {
    if (badge || !picker) problems.push(`without ?grade= expected the picker, got badge=${badge} picker=${picker}`);
    await page.locator(".tl-grade", { hasText: /^3$/ }).click();
    if (!(await page.getByText("Trail Ledger is for grades 5 and up").count())) problems.push("picker grade 3 did not show the gate");
    await page.locator(".tl-grade", { hasText: /^7$/ }).click();
    const on = (await page.locator(".tl-grade.on").innerText()).trim();
    if (on !== "7") problems.push(`picker did not select grade 7 (${on})`);
  }
  const g = grade || "7";
  await layoutOk(page, problems, "title");

  if (Number(g) < 5) {
    const gate = await page.getByText("Trail Ledger is for grades 5 and up").count();
    const link = await page.locator(".tl-young a.tl-cta", { hasText: "ARCADE" }).count();
    const exps = await page.locator(".tl-exp").count();
    if (!gate || !link || exps) problems.push(`gate screen wrong: gate=${gate} link=${link} expeditions=${exps}`);
    else notes.push("gate screen + ◀ ARCADE link");
    if (errors.length) problems.push(...errors.map((e) => `page error: ${e}`));
    await ctx.close();
    return { grade: grade || "(picker)", mode, problems, notes };
  }

  // Locked expeditions
  const locked = await page.locator(".tl-lock").allInnerTexts();
  if (!locked.some((t) => /RACE TO THE DAN/.test(t)) || !locked.some((t) => /ROUTE 66/.test(t)) || !locked.some((t) => /ON THE BUS/.test(t))) problems.push("locked 'coming later' expeditions missing");
  const levelFlags = await page.locator(".tl-exp .flag").count();
  notes.push(`YOUR LEVEL ×${levelFlags}`);

  // Choose the expedition (key or tap)
  const expId = EXPS[expIndex];
  if (touch) await page.locator(".tl-exp").nth(expIndex).tap();
  else await page.keyboard.press(String(expIndex + 1));
  await page.waitForFunction(() => window.__tl.game.phase === "intro");
  if ((await G(page, "g.exp.id")) !== expId) problems.push(`expected ${expId}`);
  if (touch) await tap(page.locator(".tl-cta", { hasText: "Go to the store" }));
  else await page.keyboard.press("Enter");
  await page.waitForFunction(() => window.__tl.game.phase === "outfit");
  // Store: + then − on the first item
  await tap(page.locator(".tl-store .qty button").nth(1));
  await tap(page.locator(".tl-store .qty button").nth(0));
  await page.evaluate(() => document.activeElement && document.activeElement.blur());
  const priceNote = await page.locator(".tl-card").innerText();
  if (!/game numbers/.test(priceNote)) problems.push("store does not say prices are game numbers");
  await layoutOk(page, problems, "store");
  if (touch) await tap(page.locator(".tl-cta", { hasText: "Pay and pack" }));
  else await page.keyboard.press("Enter");
  await page.waitForFunction(() => window.__tl.game.phase === "question");
  const mathStd = await G(page, "g.asking.q.standard");
  if (CODE_FOR[g] && !CODE_FOR[g].test(mathStd)) problems.push(`grade ${g} store math tagged ${mathStd}`);
  notes.push(`store math [${mathStd}]`);

  let keyAnswered = 0, tapAnswered = 0, transKey = 0, transTap = 0, events = 0, landmarks = 0, wintered = false, paused = false, guard = 0;
  const answer = async () => {
    const purpose = await G(page, "g.asking.purpose");
    const right = await G(page, "g.asking.q.answer");
    // Mix right and wrong answers; grade 5 sees a hint after a first wrong answer.
    const want = (keyAnswered + tapAnswered) % 3 === 2 ? (right + 1) % 4 : right;
    if (touch) {
      await page.locator(".tl-choices .tl-btn").nth(want).tap();
      tapAnswered++;
      if (purpose === "transmission") transTap++;
    } else {
      await page.keyboard.press(want % 2 ? "ABCD"[want].toLowerCase() : String(want + 1));
      keyAnswered++;
      if (purpose === "transmission") transKey++;
    }
    await page.waitForTimeout(30);
    if (await G(page, "g.asking && !g.asking.done && g.asking.hintShown")) {
      if (!(await page.locator(".tl-hint").count())) problems.push("grade 5 hint not shown");
      const r = await G(page, "g.asking.q.answer");
      if (touch) await page.locator(".tl-choices .tl-btn").nth(r).tap();
      else await page.keyboard.press(String(r + 1));
    }
    await page.waitForSelector(".tl-feedback");
    const fb = await page.locator(".tl-feedback").innerText();
    if (fb.length < 20) problems.push("question feedback/explanation missing");
    if (purpose === "transmission" && !(await page.locator(".tl-letter").count())) problems.push("transmission letter missing");
    if (touch) await tap(page.locator(".tl-feedback .tl-cta"));
    else await page.keyboard.press("Enter");
  };

  const SEL = { question: ".tl-card.q", landmark: ".tl-card.landmark", event: ".tl-card.event", wintered: ".tl-card.warn", travel: ".tl-card.ledger" };
  while (guard++ < 600) {
    const ph = await G(page, "g.phase");
    if (SEL[ph]) await page.waitForSelector(SEL[ph], { timeout: 5000 }).catch(() => problems.push(`panel for ${ph} not shown`));
    else await page.waitForTimeout(30);
    if (ph === "arrived") break;
    if (ph === "question") await answer();
    else if (ph === "landmark") {
      landmarks++;
      const txt = await page.locator(".tl-read").innerText();
      if (!/Source:/.test(txt)) problems.push("landmark without a source line");
      await layoutOk(page, problems, "landmark");
      if (touch) await tap(page.locator(".tl-cta", { hasText: "Questions" }));
      else await page.keyboard.press("Enter");
    } else if (ph === "event") {
      events++;
      const n = await page.locator(".tl-choices .tl-btn:not([disabled])").count();
      if (n < 1) problems.push("event without an enabled choice");
      const first = await G(page, "g.shown.choices.findIndex((c) => c.enabled)");
      if (touch) await page.locator(".tl-choices .tl-btn").nth(first).tap();
      else await page.keyboard.press("ABCD"[first].toLowerCase());
      await page.waitForFunction(() => window.__tl.game.phase === "outcome", null, { timeout: 4000 }).catch(async () => {
        problems.push(`event choice did not register: ${JSON.stringify(await page.evaluate(() => [window.__tl.game.phase, window.__tl.game.paused, document.activeElement.tagName, document.activeElement.textContent.slice(0, 40)]))}`);
      });
      if ((await G(page, "g.phase")) !== "outcome") break;
      if (touch) await tap(page.locator(".tl-cta"));
      else await page.keyboard.press("Enter");
    } else if (ph === "outcome" || ph === "notice") {
      if (touch) await tap(page.locator(".tl-cta"));
      else await page.keyboard.press("Enter");
    } else if (ph === "fork") {
      // Northbound: go on to New York in keyboard runs, settle in Philadelphia in touch runs.
      if (touch) await page.locator(".tl-choices .tl-btn").nth(0).tap();
      else await page.keyboard.press("2");
    } else if (ph === "wintered") {
      const txt = await page.locator(".tl-card").innerText();
      const label = await G(page, "g.exp.lateLabel");
      if (!txt.includes(label)) problems.push(`winter card missing "${label}"`);
      const want = await G(page, "g.retryPoint().sim.day");
      if (touch) await tap(page.locator(".tl-cta", { hasText: "Retry" }));
      else await page.keyboard.press("Enter");
      await page.waitForFunction(() => window.__tl.game.phase === "travel");
      const day = await G(page, "g.sim.day");
      if (day !== want) problems.push(`retry restored day ${day}, expected ${want}`);
      notes.push(`${label} → retry from day ${day}`);
    } else if (ph === "travel") {
      if (!paused) {
        paused = true;
        await tap(page.locator(".tl-tools button", { hasText: "PAUSE" }));
        if (!(await G(page, "g.paused"))) problems.push("pause did not pause");
        if (await page.locator(".tl-overlay .tl-cta").count()) await page.locator(".tl-overlay .tl-cta").click();
        if (await G(page, "g.paused")) problems.push("resume did not resume");
        // Pace and rations by key / tap
        if (touch) await page.locator(".tl-opts .tl-opt").last().tap();
        else await page.keyboard.press("f");
        await page.evaluate(() => document.activeElement && document.activeElement.blur());
        await layoutOk(page, problems, "travel");
      }
      if (!wintered && (await G(page, "g.sim.leg")) >= 1) {
        wintered = true;
        await page.evaluate(() => { const g = window.__tl.game; g.sim.day = g.exp.deadline[g.band]; g.step(); });
        continue;
      }
      await page.evaluate(() => { const g = window.__tl.game; for (let i = 0; i < 400 && g.phase === "travel"; i++) g.step(); });
    } else {
      problems.push(`unexpected phase ${ph}`);
      break;
    }
  }
  if ((await G(page, "g.phase")) !== "arrived") problems.push(`did not arrive (${await G(page, "g.phase")})`);
  else {
    const end = await G(page, "g.exp.landmarks[g.at].name");
    notes.push(`${expId} → ${end} day ${await G(page, "g.sim.day")}`);
  }
  if (!wintered) problems.push("no winter/retry tested");
  if (touch ? transTap < 1 : transKey < 1) problems.push(`transmission not answered by ${touch ? "tap" : "key"}`);
  notes.push(`${landmarks} landmarks, ${events} events, ${keyAnswered + tapAnswered} answers (${touch ? `tap, ${transTap} transmissions` : `key, ${transKey} transmissions`})`);

  // Report
  if ((await G(page, "g.phase")) !== "arrived") {
    await ctx.close();
    return { grade: grade || "(picker→7)", mode, problems, notes };
  }
  if (touch) await tap(page.locator(".tl-cta", { hasText: "Ledger report" }));
  else await page.keyboard.press("Enter");
  await page.waitForSelector(".tl-card.report");
  const report = await page.locator(".tl-card.report").innerText();
  if (!/MISSION REPORT/.test(report)) problems.push("no mission report");
  if (!/Practice next/.test(report)) problems.push("report has no practice-next line");
  if (!/LEDGER SUMMARY/.test(report) || !/per person per day/.test(report)) problems.push("report has no Ledger summary");
  const rows = await page.locator(".tl-report-table tbody tr").count();
  if (rows < 2) problems.push(`report has ${rows} standards rows`);
  const preview = /preview/.test(report);
  if ((g === "7" || g === "6" || g === "9") !== preview) problems.push(`preview label ${preview} at grade ${g}`);
  notes.push(`report ${rows} rows`);
  await layoutOk(page, problems, "report");

  if (errors.length) problems.push(...errors.map((e) => `page error: ${e}`));
  await ctx.close();
  return { grade: grade || "(picker→7)", mode, problems, notes };
}

async function shot(browser) {
  // A 640×400 copy of just the canvas, mid-journey on the travel strip (Westward Trail, grade 8).
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();
  await page.goto(`${BASE}?grade=8&debug`, { waitUntil: "load" });
  await page.waitForFunction(() => !!window.__tl);
  await page.keyboard.press("2");
  await page.evaluate(() => {
    const g = window.__tl.game;
    g.begin();
    g.finishOutfit();
    for (let n = 0; n < 3000 && !(g.phase === "travel" && g.sim.leg === 2 && g.sim.legMile > 150); n++) {
      if (g.phase === "question") g.asking.done ? g.continueQuestion() : g.answer(g.asking.q.answer);
      else if (g.phase === "landmark") g.continueLandmark();
      else if (g.phase === "event") g.decide(g.shown.choices.findIndex((c) => c.enabled));
      else if (g.phase === "outcome") g.continueOutcome();
      else if (g.phase === "notice") g.continueNotice();
      else if (g.phase === "travel") g.step();
    }
  });
  await page.waitForTimeout(1200);
  const data = await page.evaluate(() => {
    const src = document.querySelector("canvas");
    const c = document.createElement("canvas");
    c.width = 640;
    c.height = 400;
    const x = c.getContext("2d");
    x.imageSmoothingEnabled = false;
    x.drawImage(src, 0, 0, 640, 400);
    return c.toDataURL("image/png").split(",")[1];
  });
  fs.mkdirSync(path.dirname(SHOT), { recursive: true });
  fs.writeFileSync(SHOT, Buffer.from(data, "base64"));
  console.log(`screenshot → ${SHOT}`);
  await ctx.close();
}

(async () => {
  const browser = await chromium.launch();
  let bad = 0;
  if (SHOT) await shot(browser);
  for (const g of GRADES) {
    const modes = Number(g) < 5 ? ["keys", "touch", "portrait"] : MODES;
    for (let m = 0; m < modes.length; m++) {
      const expIndex = (m + GRADES.indexOf(g)) % 3;
      const r = await run(browser, g, modes[m], expIndex).catch((e) => ({ grade: g, mode: modes[m], problems: [`crashed: ${String(e).split("\n")[0]}`], notes: [] }));
      bad += r.problems.length;
      console.log(`${r.problems.length ? "✘" : "✔"} grade ${r.grade} ${r.mode}: ${r.notes.join(" · ")}`);
      r.problems.forEach((p) => console.log(`    PROBLEM: ${p}`));
    }
  }
  const r = await run(browser, "", "keys", 0);
  bad += r.problems.length;
  console.log(`${r.problems.length ? "✘" : "✔"} grade ${r.grade} keys: ${r.notes.join(" · ")}`);
  r.problems.forEach((p) => console.log(`    PROBLEM: ${p}`));
  await browser.close();
  console.log(bad ? `\n${bad} problem(s)` : "\nAll playtests passed.");
  process.exit(bad ? 1 : 0);
})();
