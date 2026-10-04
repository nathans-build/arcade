/*
 * Automated playtest (dev only). Needs a running preview and a global Playwright:
 *   npm run build && npx vite preview --port 4642 --host 127.0.0.1 &
 *   node scripts/playtest.cjs            # SHOT=docs/screenshot.png also saves a 640x400 canvas shot of the map
 *
 * Runs:
 *  - grade 3 via ?grade=3: the friendly "for grades 5 and up" gate with ◀ ARCADE and the grade badge (no picker)
 *  - no ?grade=: the K-12 picker shows; picking 4 shows the gate, picking 6 shows the title
 *  - grades 5, 7 and 11, each on 1280x800 keyboard, iPad landscape 1080x810 touch and iPad portrait 810x1080 touch:
 *    a full case played to the mission report: plaque + witness at every bead (keys / canvas taps), one dead end on
 *    purpose (and its explanation), a refuel (answered by key on keyboard runs, by tap on touch runs), source checks,
 *    the chrono-map (pins by key / canvas tap; the split dial at grade 11), the re-weave, the transmission and the report.
 * Checks no page errors, no page scroll, the canvas and panel inside the viewport, and grade-appropriate content.
 */
const path = require("path");
const fs = require("fs");
const { execSync } = require("child_process");
const { chromium } = require(path.join(execSync("npm root -g").toString().trim(), "playwright"));

const BASE = process.env.BASE || "http://127.0.0.1:4642/";
const SHOT = process.env.SHOT;
const results = [];

const ui = (page) =>
  page.evaluate(() => {
    const g = window.__tc.game;
    const u = g.ui;
    return {
      phase: u.phase, band: u.band, grade: u.grade, beadIx: u.beadIx, chain: u.chain.length, lantern: u.lantern, max: u.lanternMax,
      talkers: u.talkers.length, kinds: u.talkers.map((t) => t.kind), asked: u.asked.length, heard: u.heard.length, plaque: u.plaqueRead,
      q: u.q && { answer: u.q.q.answer, picked: u.q.picked, purpose: u.q.purpose, std: u.q.q.standard, passage: !!u.q.q.passage },
      map: u.map && { dial: !!u.map.dial, step: u.map.dial && u.map.dial.step, pins: u.map.pins.length, view: u.map.view.id, selected: u.map.selected },
      cases: g.caseList.map((c) => c.id), sensitive: u.sensitive, dead: u.deadEnd && u.deadEnd.why, score: u.score, refueled: u.refueled,
      canRefuel: g.canRefuel(), sourcePending: u.sourcePending, log: u.log.length, misses: u.misses.length,
    };
  });

async function layout(page) {
  return page.evaluate(() => {
    const de = document.documentElement;
    const scr = document.querySelector(".tc-screen").getBoundingClientRect();
    const pan = document.querySelector(".tc-panel").getBoundingClientRect();
    return { sw: de.scrollWidth, sh: de.scrollHeight, w: innerWidth, h: innerHeight, screen: [scr.left, scr.top, scr.right, scr.bottom].map(Math.round), panel: [pan.left, pan.top, pan.right, pan.bottom].map(Math.round) };
  });
}

/** Canvas point (logical 320x200) to page coordinates. */
async function canvasPoint(page, x, y) {
  return page.evaluate(([x, y]) => {
    const r = document.querySelector("canvas").getBoundingClientRect();
    return [r.left + (x / 320) * r.width, r.top + (y / 200) * r.height];
  }, [x, y]);
}

async function run(browser, { grade, input, portrait }) {
  const touch = input === "touch";
  const vp = portrait ? { width: 810, height: 1080 } : touch ? { width: 1080, height: 810 } : { width: 1280, height: 800 };
  const ctx = await browser.newContext(touch ? { viewport: vp, hasTouch: true, isMobile: true, deviceScaleFactor: 2 } : { viewport: vp });
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (m) => {
    if (m.type() === "error" && !/fonts\.(googleapis|gstatic)|ERR_|Failed to load resource/.test(m.text())) errors.push(m.text());
  });
  const problems = [];
  const notes = [];
  const label = `grade ${grade} ${portrait ? "iPad portrait 810x1080" : touch ? "iPad 1080x810" : "1280x800"} ${input}`;
  await page.goto(`${BASE}?grade=${grade}&debug`, { waitUntil: "load" });
  await page.waitForFunction(() => !!window.__tc);
  const tapEl = async (loc) => (touch ? loc.tap() : loc.click());
  const tapCanvas = async (x, y) => {
    const [px, py] = await canvasPoint(page, x, y);
    if (touch) await page.touchscreen.tap(px, py);
    else await page.mouse.click(px, py);
  };
  const press = (k) => page.keyboard.press(k);
  const settle = () => page.waitForTimeout(60);
  const checkLayout = async (where) => {
    const l = await layout(page);
    if (l.sw > l.w || l.sh > l.h) problems.push(`${where}: page scrolls (${l.sw}x${l.sh} in ${l.w}x${l.h})`);
    if (l.screen[3] > l.h + 1 || l.screen[2] > l.w + 1 || l.screen[0] < -1) problems.push(`${where}: canvas outside viewport ${l.screen}`);
    if (l.panel[3] > l.h + 1 || l.panel[2] > l.w + 1) problems.push(`${where}: panel outside viewport ${l.panel}`);
  };

  // Badge, not picker
  const badge = await page.locator(".tc-badge").count();
  const picker = await page.locator(".tc-grades").count();
  if (!badge || picker) problems.push(`expected badge (badge=${badge} picker=${picker})`);

  if (Number(grade) < 5) {
    const txt = await page.locator(".tc-young").innerText();
    if (!/for grades 5 and up/i.test(txt)) problems.push("gate text missing");
    if (!(await page.locator(".tc-young a.tc-cta", { hasText: "ARCADE" }).count())) problems.push("gate has no ◀ ARCADE button");
    await press("Enter");
    if ((await ui(page)).phase !== "title") problems.push("gate: Enter started the game");
    await checkLayout("gate");
    notes.push("gate screen shown");
    await ctx.close();
    return { label, problems, errors, notes };
  }

  await checkLayout("title");
  // Start
  if (touch) await tapEl(page.locator(".tc-cta", { hasText: "Start" }));
  else await press("Enter");
  let s = await ui(page);
  if (s.phase !== "cases") problems.push(`start -> ${s.phase}`);
  const expectBand = grade === "5" ? "b5" : Number(grade) <= 8 ? "b68" : "b912";
  if (s.band !== expectBand) problems.push(`band ${s.band}, expected ${expectBand}`);
  if (grade === "5" && s.cases.join(",") !== "paper,gold,exchange") problems.push(`grade 5 cases ${s.cases}`);
  notes.push(`cases: ${s.cases.join(", ")}`);
  await checkLayout("cases");

  // Choose a case: keyboard picks the first; touch taps the 2nd one.
  const caseIx = touch ? 1 : 0;
  if (touch) await tapEl(page.locator(".tc-case").nth(caseIx));
  else await press("Enter");
  s = await ui(page);
  if (s.phase !== "brief") problems.push(`case -> ${s.phase}`);
  if (touch) await tapEl(page.locator(".tc-cta", { hasText: "Start the chase" }));
  else await press("Enter");
  s = await ui(page);
  notes.push(`case ${s.cases[caseIx]}: ${s.chain} beads, lantern ${s.max}h`);
  const expectLantern = { b5: 14, b68: 12, b912: 10 }[expectBand];
  if (s.max !== expectLantern) problems.push(`lantern ${s.max}, expected ${expectLantern}`);

  let deadDone = false;
  let refuelDone = false;
  let guard = 0;
  let shotTaken = false;
  while (guard++ < 200) {
    s = await ui(page);
    if (s.phase === "bead") {
      await checkLayout(`bead ${s.beadIx}`);
      const expectTalkers = expectBand === "b5" ? 2 : 3;
      if (s.beadIx < s.chain - 1 && s.talkers !== expectTalkers) problems.push(`bead ${s.beadIx}: ${s.talkers} witnesses, expected ${expectTalkers}`);
      if (expectBand === "b68" && s.talkers === 3 && !s.kinds.includes("herring")) problems.push("6-8: no red herring");
      if (expectBand === "b912" && s.talkers === 3 && !s.kinds.includes("unreliable")) problems.push("9-12: no unreliable witness");
      // refuel once (needs the lantern below max: after the first witness)
      if (s.beadIx < s.chain - 1 && !s.plaque) {
        // plaque: keyboard = arrows to the plaque + Enter; touch = tap the plaque on the canvas
        if (touch) {
          const xs = await page.evaluate(() => window.__tc.screen.itemXs());
          await tapCanvas(xs[s.talkers], 130);
        } else {
          for (let i = 0; i < s.talkers; i++) await press("ArrowRight");
          await press("Enter");
          await press("ArrowLeft");
          for (let i = 1; i < s.talkers; i++) await press("ArrowLeft");
        }
        await settle();
        if (!(await ui(page)).plaque) problems.push(`bead ${s.beadIx}: plaque not read`);
        continue;
      }
      if (s.beadIx < s.chain - 1 && s.asked === 0) {
        if (touch) {
          const xs = await page.evaluate(() => window.__tc.screen.itemXs());
          await tapCanvas(xs[0], 130);
        } else await press("Enter");
        await settle();
        const a = await ui(page);
        if (a.asked !== 1) problems.push(`bead ${s.beadIx}: witness not asked (${a.phase})`);
        if (!a.sensitive && a.lantern !== s.lantern - 1 && a.phase === "bead") problems.push(`witness cost ${s.lantern - a.lantern}h`);
        if (a.sensitive && a.lantern !== s.lantern) problems.push("witness cost lantern on a sensitive bead");
        continue;
      }
      if (!refuelDone && s.canRefuel) {
        if (touch) await tapEl(page.locator(".tc-act.refuel"));
        else await press("f");
        const r = await ui(page);
        if (r.phase !== "question" || r.q.purpose !== "refuel") problems.push(`refuel -> ${r.phase}`);
        else {
          if (touch) await tapEl(page.locator(".tc-choice").nth(r.q.answer));
          else await press("abcd"[r.q.answer]);
          const r2 = await ui(page);
          if (r2.lantern !== r.lantern + 1) problems.push(`refuel right answer: lantern ${r.lantern} -> ${r2.lantern}`);
          notes.push(`refuel answered by ${touch ? "tap" : "key"} (${r.q.std})`);
          if (touch) await tapEl(page.locator(".tc-cta", { hasText: "Continue" }));
          else await press("Enter");
          refuelDone = true;
        }
        continue;
      }
      // open the map (G or tap the gate)
      if (touch) await tapEl(page.locator(".tc-act.go"));
      else await press("g");
      await settle();
      continue;
    }
    if (s.phase === "question") {
      const q = s.q;
      if (q.picked === null) {
        if (q.purpose === "source" && !q.passage) problems.push("source check without a passage");
        // answer: keyboard -> number keys 1-4; touch -> tap the choice
        if (touch) await tapEl(page.locator(".tc-choice").nth(q.answer));
        else await press("1234"[q.answer]);
        const a = await ui(page);
        if (a.q.picked !== q.answer) problems.push(`${q.purpose}: answer not taken`);
        if (q.purpose === "transmission") notes.push(`transmission answered by ${touch ? "tap" : "key"} (${q.std})`);
        if (q.purpose === "source") notes.push(`source check (${q.std})`);
      } else {
        if (touch) await tapEl(page.locator(".tc-cta", { hasText: "Continue" }));
        else await press("Enter");
      }
      continue;
    }
    if (s.phase === "map") {
      if (!s.map) {
        problems.push("map phase without map");
        break;
      }
      await checkLayout("map");
      if (expectBand === "b912" && !s.map.dial) problems.push("9-12 should use the split dial");
      if (expectBand !== "b912" && (s.map.dial || s.map.pins !== 4)) problems.push(`pins: ${s.map.pins}`);
      if (SHOT && !shotTaken && grade === "7" && !touch && s.beadIx >= 1 && deadDone) {
        await page.waitForTimeout(300);
        const data = await page.evaluate(() => {
          const src = document.querySelector("canvas");
          const c = document.createElement("canvas");
          c.width = 640;
          c.height = 400;
          const x = c.getContext("2d");
          x.imageSmoothingEnabled = false;
          x.drawImage(src, 0, 0, 640, 400);
          return c.toDataURL("image/png");
        });
        fs.writeFileSync(path.resolve(SHOT), Buffer.from(data.split(",")[1], "base64"));
        shotTaken = true;
        notes.push(`screenshot saved: ${SHOT}`);
      }
      const want = deadDone ? await page.evaluate(() => window.__tc.game.debugRightPin()) : await page.evaluate(() => window.__tc.game.debugWrongPin());
      const before = s.lantern;
      const pickIt = async () => {
        if (touch) {
          const step = (await ui(page)).map;
          if (step.dial && step.step === "era") await tapCanvas(16 + want * 74 + 35, 155);
          else {
            const sp = await page.evaluate((i) => window.__tc.game.ui.map.spots[i], want);
            await tapCanvas(16 + sp.x, 12 + sp.y - 7);
          }
        } else await press("abcd"[want]);
      };
      await pickIt();
      let a = await ui(page);
      if (a.phase === "map" && expectBand === "b68" && a.map.selected === want) {
        // grades 6-8: the first pick reveals the era; confirm with Enter or the JUMP button
        if (touch) await tapEl(page.locator(".tc-cta", { hasText: "Jump to" }));
        else await press("Enter");
        a = await ui(page);
      }
      if (a.phase === "map" && a.map && a.map.dial && a.map.step === "era" && !deadDone) {
        // 9-12 picked the right place on purpose? (wrong pin may have been the place) - handled below
      }
      if (!deadDone) {
        if (a.phase !== "deadend") {
          problems.push(`wrong pin did not dead-end (${a.phase})`);
          deadDone = true;
          continue;
        }
        if (!a.dead || a.dead.length < 20) problems.push("dead end without explanation");
        if (!a.sensitive && a.lantern !== before - 2) problems.push(`dead end cost ${before - a.lantern}h`);
        notes.push(`dead end: "${a.dead.slice(0, 70)}…"`);
        if (touch) await tapEl(page.locator(".tc-cta", { hasText: "Back to" }));
        else await press("Enter");
        deadDone = true;
      }
      continue;
    }
    if (s.phase === "deadend") {
      if (touch) await tapEl(page.locator(".tc-cta", { hasText: "Back to" }));
      else await press("Enter");
      continue;
    }
    if (s.phase === "slip") {
      notes.push("the thread slipped (lantern out)");
      await press("Enter");
      continue;
    }
    if (s.phase === "solved") {
      notes.push(`case solved, score ${s.score}`);
      if (touch) await tapEl(page.locator(".tc-cta", { hasText: "transmission" }));
      else await press("Enter");
      continue;
    }
    if (s.phase === "report") {
      await checkLayout("report");
      const rows = await page.locator(".tc-report tbody tr").count();
      const text = await page.locator(".tc-scroll").innerText();
      if (rows < 3) problems.push(`report has ${rows} standard rows`);
      if (!/MISSION REPORT/.test(text)) problems.push("no report heading");
      if (!/DEAD ENDS/.test(text)) problems.push("report lists no dead ends");
      const codes = await page.locator(".tc-report td.c").allInnerTexts();
      notes.push(`report: ${rows} rows (${[...new Set(codes)].join(", ")})`);
      if (grade === "5" && codes.some((c) => !/^5\.G\.1\.[23]$/.test(c) && !/^5\./.test(c))) problems.push(`grade 5 report codes ${codes}`);
      break;
    }
    if (s.phase === "brief" || s.phase === "cases") {
      problems.push(`unexpected ${s.phase}`);
      break;
    }
  }
  if (guard >= 200) problems.push("playtest loop did not finish");
  if (!deadDone) problems.push("no dead end tested");
  if (!refuelDone) problems.push("no refuel tested");
  await ctx.close();
  return { label, problems, errors, notes };
}

async function pickerRun(browser) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();
  const errors = [];
  const problems = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  await page.goto(`${BASE}?debug`, { waitUntil: "load" });
  await page.waitForFunction(() => !!window.__tc);
  if (!(await page.locator(".tc-grades").count()) || (await page.locator(".tc-badge").count())) problems.push("no picker without ?grade=");
  await page.locator(".tc-grade", { hasText: /^4$/ }).click();
  if (!(await page.locator(".tc-young").count())) problems.push("grade 4 should show the gate");
  await page.locator(".tc-grade", { hasText: /^6$/ }).click();
  if (!(await page.locator(".tc-cta", { hasText: "Start" }).count())) problems.push("grade 6 should show the title");
  const s = await ui(page);
  if (s.band !== "b68") problems.push(`picked 6 -> band ${s.band}`);
  await ctx.close();
  return { label: "no ?grade= (picker)", problems, errors, notes: ["picker shown; 4 -> gate; 6 -> title"] };
}

(async () => {
  const browser = await chromium.launch();
  const runs = [
    { grade: "3", input: "keys" },
    { grade: "3", input: "touch" },
    { grade: "5", input: "keys" },
    { grade: "5", input: "touch" },
    { grade: "5", input: "touch", portrait: true },
    { grade: "7", input: "keys" },
    { grade: "7", input: "touch" },
    { grade: "7", input: "touch", portrait: true },
    { grade: "11", input: "keys" },
    { grade: "11", input: "touch" },
    { grade: "11", input: "touch", portrait: true },
  ];
  results.push(await pickerRun(browser));
  for (const r of runs) results.push(await run(browser, r));
  await browser.close();
  let bad = 0;
  for (const r of results) {
    const ok = !r.problems.length && !r.errors.length;
    if (!ok) bad++;
    console.log(`${ok ? "PASS" : "FAIL"}  ${r.label}`);
    for (const n of r.notes) console.log(`      · ${n}`);
    for (const p of r.problems) console.log(`      ✘ ${p}`);
    for (const e of r.errors) console.log(`      ✘ page error: ${e}`);
  }
  console.log(bad ? `\n${bad} run(s) failed` : "\nAll playtests passed.");
  process.exit(bad ? 1 : 0);
})();
