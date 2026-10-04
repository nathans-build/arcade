/*
 * Automated playtest (dev only). Needs a running preview and a global Playwright:
 *   npm run build && npx vite preview --port 4646 --host 127.0.0.1 &
 *   node scripts/playtest.cjs            # GRADES=K,3,4,7,11 by default
 *   SHOT=docs/screenshot.png node scripts/playtest.cjs   # also saves a 640x400 canvas shot mid-throw
 *
 * Runs (with ?debug&fast so flights are quick):
 *  - every grade on 1280x800 keyboard, iPad landscape 1080x810 touch and iPad portrait 810x1080 touch:
 *    plays a whole game to the mission report. Shot questions are answered with keys (1-4 / A-D) or taps
 *    (on the answer buttons, and on a target on the canvas for "pick" questions); one answer per run is
 *    deliberately wrong to check the explanation; aiming uses the arrow keys or a drag from the launcher,
 *    then a debug hook sets the known solution so the throw lands; fire with Space or the FIRE button.
 *    Transmissions are answered by key and by tap. Checks a hit, a windy level, the guide line after a
 *    right answer, the report with standards, no page errors, no page scroll, everything inside the viewport.
 *  - pass-and-play at grade 3 (keyboard): the "your turn" card between players and a two-tab report.
 *  - one run without ?grade= checks the grade picker.
 */
const path = require("path");
const fs = require("fs");
const { execSync } = require("child_process");
const { chromium } = require(path.join(execSync("npm root -g").toString().trim(), "playwright"));

const BASE = process.env.BASE || "http://127.0.0.1:4646/";
const GRADES = (process.env.GRADES || "K,3,4,7,11").split(",");
const SHOT = process.env.SHOT;
const LAYOUTS = (process.env.LAYOUTS || "kb,ipad,portrait").split(",");

const ui = (page) =>
  page.evaluate(() => {
    const g = window.__sa;
    const u = g.ui;
    return {
      phase: u.phase,
      level: u.level,
      levels: u.levels,
      seat: u.seat,
      wind: u.wind,
      guide: u.guide,
      angle: u.angle,
      power: u.power,
      q: u.q && { answer: u.q.q.answer, picked: u.q.picked, type: u.q.q.effect.type, gen: u.q.q.gen, std: u.q.q.standard, target: u.q.q.target, diagram: !!u.q.q.diagram },
      trans: u.trans && { answer: u.trans.q.answer, picked: u.trans.picked },
      seats: u.seats.map((s) => ({ score: s.score, hits: s.hits, thrown: s.thrown, log: s.log.length })),
      msg: u.msg.text,
    };
  });

async function layout(page) {
  return page.evaluate(() => {
    const de = document.documentElement;
    const ctl = document.querySelector(".sa-controls");
    const scr = document.querySelector(".sa-screen").getBoundingClientRect();
    return {
      sw: de.scrollWidth,
      sh: de.scrollHeight,
      w: innerWidth,
      h: innerHeight,
      ctlBottom: Math.round(ctl.getBoundingClientRect().bottom),
      screen: [Math.round(scr.width), Math.round(scr.height)],
    };
  });
}

async function waitPhase(page, phases, ms = 15000) {
  await page.waitForFunction((ph) => ph.includes(window.__sa.ui.phase), phases, { timeout: ms });
  return (await ui(page)).phase;
}

async function run(browser, opts) {
  const { grade, input, mode } = opts;
  const touch = input !== "kb";
  const vp = input === "portrait" ? { width: 810, height: 1080 } : input === "ipad" ? { width: 1080, height: 810 } : { width: 1280, height: 800 };
  const ctx = await browser.newContext(touch ? { viewport: vp, hasTouch: true, isMobile: true, deviceScaleFactor: 2 } : { viewport: vp });
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (m) => {
    if (m.type() === "error" && !/fonts\.(googleapis|gstatic)|ERR_|Failed to load resource/.test(m.text())) errors.push(m.text());
  });
  const problems = [];
  const notes = [];
  const url = grade ? `${BASE}?grade=${grade}&debug&fast` : `${BASE}?debug&fast`;
  await page.goto(url, { waitUntil: "load" });
  await page.waitForFunction(() => !!window.__sa);
  const click = async (loc) => (touch ? loc.tap() : loc.click());

  const badge = await page.locator(".sa-badge").count();
  const picker = await page.locator(".sa-grades").count();
  if (grade && (!badge || picker)) problems.push(`with ?grade= expected badge, got badge=${badge} picker=${picker}`);
  if (!grade) {
    if (badge || !picker) problems.push(`without ?grade= expected picker, got badge=${badge} picker=${picker}`);
    await page.locator(".sa-grade", { hasText: /^5$/ }).click();
    const g = await page.evaluate(() => window.__sa.ui.grade);
    if (g !== "5") problems.push(`grade picker did not set grade (got ${g})`);
    notes.push("picker ok");
    await ctx.close();
    return { name: "no ?grade= picker", problems, notes, errors };
  }
  if (mode === "pass") await page.locator(".sa-opt", { hasText: "2 PLAYERS" }).click();
  await click(page.locator(".sa-cta", { hasText: "Start" }));

  let lay = await layout(page);
  const checkLayout = (where) => {
    if (lay.sw > lay.w + 1) problems.push(`horizontal scroll at ${where}: ${lay.sw} > ${lay.w}`);
    if (lay.sh > lay.h + 1) problems.push(`vertical scroll at ${where}: ${lay.sh} > ${lay.h}`);
    if (lay.ctlBottom > lay.h + 1) problems.push(`controls below the viewport at ${where}: ${lay.ctlBottom} > ${lay.h}`);
  };
  checkLayout("start");
  notes.push(`screen ${lay.screen.join("x")}`);

  let n = 0;
  let wrongDone = false;
  let keyAns = 0;
  let tapAns = 0;
  let canvasTap = 0;
  let transKey = 0;
  let transTap = 0;
  let hits = 0;
  let windy = false;
  let guideSeen = false;
  let dragAimed = false;
  let explanationOk = false;
  let passCards = 0;
  let shotTaken = false;
  for (let guard = 0; guard < 400; guard++) {
    const s = await ui(page);
    if (s.phase === "over") break;
    if (s.wind !== 0) windy = true;
    if (s.phase === "pass") {
      passCards++;
      if (touch) await page.locator(".sa-cta", { hasText: "Ready" }).tap();
      else await page.keyboard.press("Enter");
      continue;
    }
    if (s.phase === "question" && s.q && s.q.picked === null) {
      n++;
      // One deliberate wrong answer per run (after the first question), to see the explanation.
      const wrong = !wrongDone && n === 2;
      const pickIdx = wrong ? (s.q.answer + 1) % 4 : s.q.answer;
      const viaKey = !touch && n % 2 === 1;
      if (touch && s.q.type === "pick" && !wrong && canvasTap < 2) {
        // Tap the target itself on the canvas.
        const pos = await page.evaluate((i) => {
          const t = window.__sa.lv.targets[i];
          const c = document.querySelector(".sa-screen canvas").getBoundingClientRect();
          return { x: c.left + (t.x / 320) * c.width, y: c.top + ((t.y - t.h / 2) / 200) * c.height };
        }, pickIdx);
        const dock = await page.evaluate(({ x, y }) => {
          const el = document.elementFromPoint(x, y);
          return el && el.tagName === "CANVAS";
        }, pos);
        if (dock) {
          await page.touchscreen.tap(pos.x, pos.y);
          canvasTap++;
        } else {
          await page.locator(".sa-dock .sa-btn").nth(pickIdx).tap();
          tapAns++;
        }
      } else if (viaKey) {
        await page.keyboard.press(n % 4 === 1 ? String(pickIdx + 1) : "abcd"[pickIdx]);
        keyAns++;
      } else {
        await click(page.locator(".sa-dock .sa-btn").nth(pickIdx));
        if (touch) tapAns++;
        else keyAns += 0;
      }
      const after = await ui(page);
      if (after.q.picked !== pickIdx) problems.push(`answer ${pickIdx} not registered (${s.q.gen})`);
      if (wrong) {
        wrongDone = true;
        const fb = await page.locator(".sa-feedback").innerText();
        if (!/NOT QUITE/.test(fb) || fb.length < 40) problems.push(`wrong answer feedback missing: ${fb.slice(0, 80)}`);
        else explanationOk = true;
        if (s.q.diagram && !(await page.locator(".sa-dock .sa-diagram").count())) problems.push("explanation diagram missing");
        if (after.guide) problems.push("guide line on after a wrong answer");
      } else if (!after.guide) problems.push(`no guide after a right answer (${s.q.gen})`);
      else guideSeen = true;
      lay = await layout(page);
      checkLayout(`question ${s.q.gen}`);
      // Continue to aim.
      if (touch) await page.locator(".sa-dock .sa-cta").tap();
      else await page.keyboard.press("Enter");
      await waitPhase(page, ["aim"]);
      // Adjust a little (arrows / drag), then use the known solution so the level progresses.
      if (touch && !dragAimed) {
        const b = await page.evaluate(() => {
          const lv = window.__sa.lv;
          const c = document.querySelector(".sa-screen canvas").getBoundingClientRect();
          const P = (x, y) => ({ x: c.left + (x / 320) * c.width, y: c.top + (y / 200) * c.height });
          return { a: P(lv.launch.x + 4, lv.launch.y - 4), b: P(lv.launch.x + 40, lv.launch.y - 40) };
        });
        const before = await ui(page);
        await page.mouse.move(b.a.x, b.a.y);
        await page.mouse.down();
        await page.mouse.move(b.b.x, b.b.y, { steps: 4 });
        await page.mouse.up();
        const aft = await ui(page);
        if (Math.abs(aft.angle - 45) <= 2 && aft.power !== before.power) dragAimed = true;
        else problems.push(`drag aim did not set the angle (${aft.angle}°, power ${aft.power})`);
      } else if (!touch) {
        const a0 = (await ui(page)).angle;
        await page.keyboard.press("ArrowLeft");
        await page.keyboard.press("ArrowUp");
        const a1 = (await ui(page)).angle;
        if (a1 !== Math.min(175, a0 + 1)) problems.push(`ArrowLeft did not raise the angle (${a0} → ${a1})`);
      }
      await page.evaluate(() => window.__sa.debugAim());
      // The guide line (when on) must match the real flight.
      const match = await page.evaluate(() => {
        const g = window.__sa;
        const sc = g.scene();
        const full = g.predict();
        if (!sc.guide) return null;
        return sc.guide.every((p, i) => p[0] === full.pts[i][0] && p[1] === full.pts[i][1]);
      });
      if (match === false) problems.push("guide line does not match the predicted flight");
      if (SHOT && !shotTaken && grade === "7" && input === "kb" && !windy) {
        // Fire and grab the canvas mid-throw.
        await page.evaluate(() => (window.__sa.fast = false));
        await page.keyboard.press("Space");
        await page.waitForTimeout(700);
        const data = await page.evaluate(() => {
          const src = document.querySelector(".sa-screen canvas");
          const c = document.createElement("canvas");
          c.width = 640;
          c.height = 400;
          const x = c.getContext("2d");
          x.imageSmoothingEnabled = false;
          x.drawImage(src, 0, 0, 640, 400);
          return c.toDataURL("image/png");
        });
        fs.mkdirSync(path.dirname(SHOT), { recursive: true });
        fs.writeFileSync(SHOT, Buffer.from(data.split(",")[1], "base64"));
        shotTaken = true;
        notes.push(`screenshot → ${SHOT}`);
        await page.evaluate(() => (window.__sa.fast = true));
      } else if (touch) await page.locator(".sa-ctl.fire").tap();
      else await page.keyboard.press("Space");
      await waitPhase(page, ["result", "question", "pass", "transmission", "over"], 20000);
      const r = await ui(page);
      if (/SPLASH|Fizz|Ding|blooms|fills|Ahh|Painted/.test(r.msg) || r.seats.some((x) => x.hits > 0)) hits = r.seats.reduce((a, x) => a + x.hits, 0);
      continue;
    }
    if (s.phase === "transmission" && s.trans && s.trans.picked === null) {
      const useTap = touch || transKey > transTap;
      if (useTap) {
        await click(page.locator(".sa-panel.trans .sa-btn").nth(s.trans.answer));
        transTap++;
      } else {
        await page.keyboard.press(transKey % 2 ? "abcd"[s.trans.answer] : String(s.trans.answer + 1));
        transKey++;
      }
      const t2 = await ui(page);
      if (t2.trans.picked !== s.trans.answer) problems.push("transmission answer not registered");
      lay = await layout(page);
      checkLayout("transmission");
      if (touch) await page.locator(".sa-panel.trans .sa-cta").tap();
      else await page.keyboard.press("Enter");
      continue;
    }
    await page.waitForTimeout(60);
  }
  const fin = await ui(page);
  if (fin.phase !== "over") problems.push(`game did not reach the report (phase ${fin.phase}, level ${fin.level + 1}/${fin.levels})`);
  else {
    const rep = await page.locator(".sa-panel.report").innerText();
    if (!/MISSION REPORT/.test(rep) || !/NC\./.test(rep)) problems.push("report missing standards");
    const rows = await page.locator(".sa-report-table tbody tr").count();
    notes.push(`report rows ${rows}`);
    if (mode === "pass") {
      const tabs = await page.locator(".sa-tabs [role=tab]").count();
      if (tabs !== 2) problems.push(`expected 2 report tabs, got ${tabs}`);
      if (passCards < 3) problems.push(`expected pass cards, saw ${passCards}`);
    }
    lay = await layout(page);
    checkLayout("report");
  }
  if (!hits) problems.push("no target hit");
  if (!windy) problems.push("no windy level reached");
  if (!guideSeen) problems.push("guide line never shown");
  if (!explanationOk) problems.push("no wrong-answer explanation checked");
  if (touch && !(tapAns + canvasTap)) problems.push("no tap answers");
  if (!touch && !keyAns) problems.push("no key answers");
  if (!transKey && !touch) problems.push("no transmission answered by key");
  if (!transTap) problems.push("no transmission answered by tap");
  notes.push(`questions ${n} (key ${keyAns}, tap ${tapAns}, canvas tap ${canvasTap}), transmissions key ${transKey} tap ${transTap}, hits ${hits}, score ${fin.seats.map((x) => x.score).join("/")}`);
  await ctx.close();
  return { name: `grade ${grade} ${input}${mode === "pass" ? " pass-and-play" : ""}`, problems, notes, errors };
}

(async () => {
  const browser = await chromium.launch();
  const runs = [];
  for (const g of GRADES) for (const input of LAYOUTS) runs.push({ grade: g, input });
  if (!process.env.GRADES) {
    runs.push({ grade: "3", input: "kb", mode: "pass" });
    runs.push({ grade: null, input: "kb" });
  }
  let bad = 0;
  for (const r of runs) {
    let res;
    try {
      res = await run(browser, r);
    } catch (e) {
      res = { name: `grade ${r.grade} ${r.input}`, problems: [`crashed: ${e.message.split("\n")[0]}`], notes: [], errors: [] };
    }
    const fail = res.problems.length + res.errors.length;
    bad += fail ? 1 : 0;
    console.log(`${fail ? "FAIL" : "ok  "} ${res.name}: ${res.notes.join("; ")}`);
    for (const p of res.problems) console.log(`     problem: ${p}`);
    for (const e of res.errors) console.log(`     page error: ${e}`);
  }
  await browser.close();
  console.log(bad ? `${bad} run(s) with problems` : "all runs ok");
  process.exit(bad ? 1 : 0);
})();
