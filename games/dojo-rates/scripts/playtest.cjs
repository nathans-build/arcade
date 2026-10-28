/*
 * Automated playtest (dev only) for Dojo Tower: Rates & Percents. Needs the built game served at
 * /dojo-rates/ with the arcade's /fonts/ next to it, and a global Playwright (Chromium):
 *   npm run build
 *   (serve a folder holding dojo-rates -> dist and fonts -> ../../site/fonts on port 8811, or set BASE)
 *   node scripts/playtest.cjs        (SHOT=../../site/img/dojo-rates.png saves a 640x400 Paint the Room boss-fight picture)
 * Runs twice: keyboard on a 1280x800 desktop and touch on a 390x844 phone. Each run checks the title
 * (special-edition line, the Practice picker with FULL CLIMB on, no grade picker, fonts, no sideways scroll,
 * MUSIC/SFX tappable above the overlay), starts the climb, walks, punches a ninja (A-D never move),
 * reaches floor 1's master, uses HINT twice (H key / HINT button), answers wrong (blocked, the named-mistake
 * feedback shows, no HP/lives lost) and right until the master is beaten; on floor 3 a COMBO story
 * problem is answered wrong and breaks into steps (story and "work so far" stay on screen, the master
 * hangs on until the last step); floor 7 (Paint the Room) opens with a combo, answered right first try
 * (BIG COMBO), and is beaten; then the results screen (rows by skill tag, hints counted), CSV and JSON
 * export (fields checked), the saved attempt log, and "Redo the ones I missed" (a boss-only round) to its
 * cleared screen. The phone run also picks SECTION D in the Practice picker (remembered after a reload)
 * and checks the floor-5 master asks Section D. No page or console errors, and no outside requests.
 */
const path = require("path");
const fs = require("fs");
const { execSync } = require("child_process");
const { chromium } = require(path.join(execSync("npm root -g").toString().trim(), "playwright"));

const BASE = process.env.BASE || "http://127.0.0.1:8811/dojo-rates/";
const ORIGIN = new URL(BASE).origin + "/";
const SHOT = process.env.SHOT;
const EXPORT_HEADER = "date,game,skill tag,question,answer given,correct answer,correct/incorrect,hints used";

const sim = (page) =>
  page.evaluate(() => {
    const s = window.__dt.sim;
    return { mode: s.mode, floor: s.floor, n: s.info.n, dir: s.dir, x: s.player.x, score: s.score, lives: s.lives, energy: s.energy, hp: s.fight ? s.fight.hp : null, enemies: s.enemies.length };
  });
const quiz = (page) =>
  page.evaluate(() => {
    const z = window.__dtQuiz;
    if (!z) return null;
    return {
      kind: z.kind, answer: z.q.answer, picked: z.picked, tag: z.q.tag, section: z.q.section, prompt: z.q.prompt, feedback: z.q.feedback, choices: z.q.choices,
      hints: z.hints, combo: z.combo ? { phase: z.combo.phase, steps: z.combo.c.steps.length, title: z.combo.c.title } : null, defeated: !!(z.result && z.result.defeated),
    };
  });

async function noSideways(page) {
  return page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth && document.body.scrollWidth <= window.innerWidth);
}

async function openPage(browser, touch) {
  const ctx = await browser.newContext(
    touch ? { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2, acceptDownloads: true } : { viewport: { width: 1280, height: 800 }, acceptDownloads: true },
  );
  const page = await ctx.newPage();
  const errors = [];
  const external = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  page.on("request", (r) => {
    if (!r.url().startsWith(ORIGIN) && !r.url().startsWith("data:") && !r.url().startsWith("blob:")) external.push(r.url());
  });
  return { ctx, page, errors, external };
}

function helpers(page, touch) {
  const tap = (loc) => (touch ? loc.tap() : loc.click());
  const waitOpen = () => page.waitForFunction(() => window.__dtQuiz && window.__dtQuiz.picked === null, null, { timeout: 15000 });
  /** Answers the open question: right (true) or a wrong choice (false). */
  const answer = async (right) => {
    await waitOpen();
    const q = await quiz(page);
    const idx = right ? q.answer : (q.answer + 1) % 4;
    if (touch) await page.locator(".dt-quiz .opt").nth(idx).tap();
    else await page.keyboard.press(String(idx + 1));
    await page.waitForFunction(() => window.__dtQuiz && window.__dtQuiz.picked !== null, null, { timeout: 5000 });
    return { ...q, idx, after: await quiz(page) };
  };
  const next = async () => {
    await page.waitForTimeout(touch ? 900 : 700);
    if (touch) await page.locator(".dt-quiz .feedback .dt-cta").tap();
    else await page.keyboard.press("Enter");
    await page.waitForTimeout(250);
  };
  /** Skip the running part: put the student at the master's arena and walk in. */
  const toBoss = async () => {
    await page.waitForFunction(() => window.__dt.sim.mode === "run", null, { timeout: 8000 });
    await page.evaluate(() => {
      const s = window.__dt.sim;
      s.invincible = true;
      s.warpToBoss();
      s.held[s.dir > 0 ? "right" : "left"] = true;
    });
    await waitOpen();
    await page.evaluate(() => {
      const s = window.__dt.sim;
      s.held.left = s.held.right = false;
    });
  };
  /** Answer right until the master is beaten (then climb on). */
  const beat = async (seen) => {
    for (let i = 0; i < 40; i++) {
      const a = await answer(true);
      if (seen) seen.push(a);
      await next();
      if (a.after.defeated) return true;
    }
    return false;
  };
  const jumpTo = async (floorIdx) => {
    await page.evaluate((f) => window.__dt.sim.startFloor(f), floorIdx);
    await page.waitForTimeout(200);
  };
  return { tap, answer, next, toBoss, beat, jumpTo, waitOpen };
}

async function run(browser, touch) {
  const label = touch ? "phone" : "desktop";
  const { ctx, page, errors, external } = await openPage(browser, touch);
  const problems = [];
  const h = helpers(page, touch);
  await page.goto(`${BASE}?debug`, { waitUntil: "load" });
  await page.waitForFunction(() => !!window.__dt);

  // Title screen
  const title = await page.locator(".dt-panel.title").innerText();
  if (!/SPIDERBEN10'S SPECIAL EDITION · MATH 6 UNIT 3/.test(title)) problems.push(`title text: ${title.slice(0, 160)}`);
  if ((await page.locator("[data-practice]").count()) !== 7) problems.push("practice picker should have FULL CLIMB, A-E and BRIDGE");
  if ((await page.locator('[data-practice="full"][aria-checked="true"]').count()) !== 1) problems.push("FULL CLIMB is not the default");
  if ((await page.locator(".dt-grade").count()) !== 0) problems.push("no grade picker in this edition");
  if ((await page.locator(".dt-floorrow").count()) !== 7) problems.push("title should list 7 floor masters");
  const fontsOk = await page.evaluate(async () => { await document.fonts.ready; return document.fonts.check('12px "Press Start 2P"'); });
  if (!fontsOk) problems.push("Press Start 2P font not loaded from /fonts/");
  if (!(await noSideways(page))) problems.push("sideways scroll on the title screen");
  // MUSIC / SFX stay tappable above the overlay.
  for (const word of ["MUSIC", "SFX"]) {
    const b = page.locator(".dt-tools button", { hasText: word }).first();
    const box = await b.boundingBox();
    const hit = await page.evaluate(([x, y]) => { const el = document.elementFromPoint(x, y); return el ? el.textContent : ""; }, [box.x + box.width / 2, box.y + box.height / 2]);
    if (!hit.includes(word)) problems.push(`${word} button is covered (${hit})`);
  }
  const music = page.locator(".dt-tools button", { hasText: "MUSIC" }).first();
  const m0 = await music.innerText();
  await h.tap(music);
  if ((await music.innerText()) === m0) problems.push("MUSIC button did not toggle");
  await h.tap(music);

  // Start the full climb
  if (touch) await h.tap(page.locator(".dt-cta.big"));
  else {
    await page.locator(".dt-cta.big").focus();
    await page.keyboard.press("Enter");
  }
  await page.waitForTimeout(300);
  if ((await page.locator(".dt-overlay.title").count()) !== 0) problems.push("the climb did not start");
  const pad = await page.locator(".dt-controls.show").count();
  if (touch !== !!pad) problems.push(`touch pad ${pad ? "shown" : "hidden"} on ${label}`);
  await page.waitForFunction(() => window.__dt.sim.mode === "run", null, { timeout: 6000 });
  await page.evaluate(() => { window.__dt.sim.invincible = true; });
  const s0 = await sim(page);
  if (touch) {
    const right = page.locator('[aria-label="Move right"]');
    await right.dispatchEvent("pointerdown", { pointerId: 1, pointerType: "touch", isPrimary: true });
    await page.waitForTimeout(700);
    await right.dispatchEvent("pointerup", { pointerId: 1, pointerType: "touch", isPrimary: true });
  } else {
    await page.keyboard.down("ArrowRight");
    await page.waitForTimeout(700);
    await page.keyboard.up("ArrowRight");
    const before = (await sim(page)).x;
    for (const k of ["a", "b", "c", "d", "1", "2", "h"]) await page.keyboard.press(k);
    await page.waitForTimeout(200);
    if ((await sim(page)).x !== before) problems.push("A-D / 1-4 / H moved the student");
  }
  if (!((await sim(page)).x > s0.x + 20)) problems.push("did not walk");
  await page.evaluate(() => {
    const s = window.__dt.sim;
    s.enemies = [];
    s.player.facing = s.dir;
    const e = s.spawn("ninja", true);
    e.x = s.player.x + s.dir * 15;
    e.speed = 0;
  });
  if (touch) await h.tap(page.locator(".dt-touch.punch"));
  else await page.keyboard.press("z");
  await page.waitForTimeout(400);
  if ((await sim(page)).enemies !== 0) problems.push("punch did not poof the ninja");

  // Floor 1 master: hints, a wrong answer (blocked, named mistake), then right answers.
  await h.toBoss();
  let q = await quiz(page);
  if (q.kind !== "boss" || q.section !== "A" || q.tag !== 1) problems.push(`floor 1 master asked section ${q.section} tag ${q.tag}`);
  if (touch) {
    await h.tap(page.locator(".dt-hintbtn"));
    await h.tap(page.locator(".dt-hintbtn"));
  } else {
    await page.keyboard.press("h");
    await page.keyboard.press("h");
  }
  const hintText = await page.locator(".dt-hints").innerText().catch(() => "");
  if (!/HINT 1:/.test(hintText) || !/HINT 2:/.test(hintText)) problems.push(`hints not shown: "${hintText}"`);
  if ((await quiz(page)).hints !== 2) problems.push("two hint stages recorded");
  if (!(await page.locator(".dt-hintbtn").isDisabled())) problems.push("HINT should stop after stage 2");
  const before = await sim(page);
  const wrong = await h.answer(false);
  await page.waitForTimeout(1000);
  const mistake = await page.locator(".dt-mistake").innerText().catch(() => "");
  if (!mistake || mistake !== wrong.feedback[wrong.idx]) problems.push(`named-mistake feedback "${mistake}" vs "${wrong.feedback[wrong.idx]}"`);
  const afterWrong = await sim(page);
  if (afterWrong.hp !== before.hp || afterWrong.lives !== before.lives || afterWrong.energy !== before.energy) problems.push("a wrong answer changed HP, lives or energy");
  await h.next();
  if (!(await h.beat())) problems.push("floor 1 master not beaten");
  await page.waitForFunction(() => window.__dt.sim.floor === 2, null, { timeout: 8000 }).catch(() => problems.push("did not climb to floor 2"));

  // Floor 3: a COMBO story problem, answered wrong, breaks into steps.
  await h.jumpTo(3);
  await h.toBoss();
  const first = await h.answer(true);
  await h.next();
  if (first.after.defeated) problems.push("floor 3 master fell after one answer");
  await h.waitOpen();
  q = await quiz(page);
  if (!q.combo || q.combo.phase !== -1) problems.push(`floor 3's second question should be a combo (got ${JSON.stringify(q.combo)})`);
  else {
    if (!(await page.locator(".dt-story").isVisible())) problems.push("combo story not shown");
    await h.answer(false);
    await h.next();
    let finished = false;
    for (let k = 0; k < q.combo.steps; k++) {
      const st = await quiz(page);
      if (!st.combo || st.combo.phase !== k) problems.push(`combo step ${k + 1}: phase ${st.combo && st.combo.phase}`);
      if (!(await page.locator(".dt-story").isVisible()) || (await page.locator(".dt-work li").count()) !== q.combo.steps) problems.push(`step ${k + 1}: story / work list missing`);
      const done = await page.locator(".dt-work li.done").count();
      if (done !== k) problems.push(`step ${k + 1}: ${done} finished lines in the work list`);
      const a = await h.answer(true);
      if (k < q.combo.steps - 1 && ((await sim(page)).hp < 1 || a.after.defeated)) problems.push("the master fell before the chain's last step");
      await h.next();
      if (a.after.defeated) {
        finished = true;
        break;
      }
    }
    if (!finished && !(await h.beat())) problems.push("floor 3 master not beaten");
  }

  // Floor 7: Paint the Room, all combos (first try right = BIG COMBO).
  await h.jumpTo(7);
  await h.toBoss();
  q = await quiz(page);
  if (!q.combo || q.combo.title !== "PAINT THE ROOM" || q.tag !== 17) problems.push(`floor 7 should open with a Paint the Room combo (${JSON.stringify(q.combo)}, tag ${q.tag})`);
  if (SHOT && !touch) {
    await page.waitForTimeout(400);
    const data = await page.evaluate(() => document.querySelector(".dt-screen canvas").toDataURL("image/png"));
    fs.writeFileSync(SHOT, Buffer.from(data.split(",")[1], "base64"));
  }
  if (process.env.PAGESHOT) await page.screenshot({ path: `${process.env.PAGESHOT}-${label}-paint.png`, fullPage: true });
  const big = await h.answer(true);
  await page.waitForTimeout(300);
  const verdict = await page.locator(".dt-quiz .verdict").innerText();
  if (!/BIG COMBO/.test(verdict)) problems.push(`first-try combo verdict "${verdict}"`);
  await h.next();
  if (!big.after.defeated && !(await h.beat())) problems.push("painter not beaten");

  // Results screen
  await page.waitForSelector(".dt-report", { timeout: 10000 }).catch(() => problems.push("results screen missing"));
  const report = await page.locator(".dt-report").innerText().catch(() => "");
  if (!/TOWER CLEARED/.test(report)) problems.push(`report title: ${report.slice(0, 80)}`);
  const rows = await page.locator(".dt-report-table tbody tr").count();
  if (rows < 3) problems.push(`results by skill tag: ${rows} rows`);
  if (!(await page.locator('.dt-report-table tr[data-tag="1"]').count())) problems.push("results should list tag 1");
  if (!/Hints\s*2\b/.test(report)) problems.push("the 2 hints used should be counted");
  if (!(await noSideways(page))) problems.push("sideways scroll on the results screen");
  if (process.env.PAGESHOT) await page.screenshot({ path: `${process.env.PAGESHOT}-${label}-results.png`, fullPage: true });
  // Export
  for (const kind of ["csv", "json"]) {
    const [dl] = await Promise.all([page.waitForEvent("download", { timeout: 5000 }), h.tap(page.locator(`[data-export="${kind}"]`))]).catch(() => [null]);
    if (!dl) {
      problems.push(`${kind} export did not download`);
      continue;
    }
    if (!dl.suggestedFilename().endsWith(`.${kind}`)) problems.push(`export name ${dl.suggestedFilename()}`);
    const text = fs.readFileSync(await dl.path(), "utf8");
    if (kind === "csv") {
      const lines = text.trim().split(/\r\n/);
      if (lines[0] !== EXPORT_HEADER || lines.length < 8) problems.push(`CSV: ${lines[0]} (${lines.length} lines)`);
      if (!lines.some((l) => /,incorrect,2$/.test(l))) problems.push("CSV should show the wrong answer with its 2 hints");
    } else {
      const j = JSON.parse(text);
      const keys = Object.keys(j[0] || {}).join(",");
      if (keys !== EXPORT_HEADER || j[0].game !== "dojo-rates") problems.push(`JSON fields ${keys}`);
    }
  }
  const savedN = await page.evaluate(() => JSON.parse(localStorage.getItem("arcade.dojo-rates.log.v1") || "[]").length);
  const m = report.match(/Questions\s*(\d+)\/(\d+)/);
  const expectSaved = (touch ? 1 : 0) + (m ? Number(m[2]) : -1);
  if (!m || savedN < Number(m[2])) problems.push(`saved log ${savedN} vs answered ${m && m[2]} (expected about ${expectSaved})`);

  // Redo the ones I missed: a boss-only round with the missed tags.
  const redo = page.locator(".dt-redo");
  if (!(await redo.count())) problems.push("no 'Redo the ones I missed' button");
  else {
    await h.tap(redo);
    await h.waitOpen();
    const r = await quiz(page);
    const s = await sim(page);
    if (s.n !== 0 || r.kind !== "boss") problems.push(`retry round should start at its master (floor ${s.n}, ${r.kind})`);
    const seen = [];
    if (!(await h.beat(seen))) problems.push("retry round not cleared");
    const missed = new Set([wrong.tag, 8, 4]);
    const tags = [...new Set(seen.map((x) => x.tag))];
    if (!tags.every((t) => missed.has(t)) || !tags.includes(wrong.tag)) problems.push(`retry asked tags ${tags}`);
    await page.waitForSelector(".dt-report", { timeout: 10000 }).catch(() => problems.push("retry results missing"));
    const rr = await page.locator(".dt-report").innerText().catch(() => "");
    if (!/RETRY ROUND CLEARED/.test(rr)) problems.push(`retry report "${rr.slice(0, 60)}"`);
  }

  // Phone: pick SECTION D in the Practice picker; it is remembered and floor 5's master asks Section D.
  if (touch) {
    await h.tap(page.locator(".dt-report .dt-cta.ghost", { hasText: "Title screen" }));
    await h.tap(page.locator('[data-practice="D"]'));
    await page.reload({ waitUntil: "load" });
    await page.waitForFunction(() => !!window.__dt);
    if ((await page.locator('[data-practice="D"][aria-checked="true"]').count()) !== 1) problems.push("practice choice not remembered");
    const names = await page.locator(".dt-floorrow .boss").allInnerTexts();
    if (names.join() !== "THE PER-CENT PANDA,MADAM MARKDOWN") problems.push(`section D masters: ${names}`);
    if (!(await noSideways(page))) problems.push("sideways scroll on the picker (390px)");
    await h.tap(page.locator(".dt-cta.big"));
    await h.toBoss();
    const d = await quiz(page);
    const s = await sim(page);
    if (d.section !== "D" || s.n !== 5) problems.push(`section D practice: floor ${s.n} asked ${d.section}`);
    if (!(await noSideways(page))) problems.push("sideways scroll in the quiz (390px)");
    if (process.env.PAGESHOT) await page.screenshot({ path: `${process.env.PAGESHOT}-phone-sectionD.png`, fullPage: true });
  }

  if (errors.length) problems.push(`console errors: ${errors.join(" | ")}`);
  if (external.length) problems.push(`external requests: ${external.join(", ")}`);
  await ctx.close();
  return problems;
}

(async () => {
  const exe = "/opt/pw-browsers/chromium";
  const browser = await chromium.launch(fs.existsSync(exe) ? { executablePath: exe } : {});
  let bad = 0;
  for (const touch of [false, true]) {
    const label = touch ? "390px phone (touch)" : "1280px desktop (keyboard)";
    let problems;
    try {
      problems = await run(browser, touch);
    } catch (e) {
      problems = [`crashed: ${e && e.stack ? e.stack.split("\n").slice(0, 3).join(" ") : e}`];
    }
    if (problems.length) {
      bad++;
      console.log(`✘ ${label}:\n   - ${problems.join("\n   - ")}`);
    } else console.log(`✔ ${label}`);
  }
  await browser.close();
  if (bad) process.exit(1);
  console.log("Playtest passed.");
})();
