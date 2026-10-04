/*
 * Automated playtest (dev only). Needs a running preview and a global Playwright:
 *   npm run build && npx vite preview --port 4647 --host 127.0.0.1 &
 *   node scripts/playtest.cjs            # GRADES=K,3,7,11 by default
 *   SHOT=docs/screenshot.png node scripts/playtest.cjs   # also saves a 640×400 canvas shot mid-rush
 * Each grade plays a whole week three ways: keyboard (1280×800), iPad landscape touch (1080×810)
 * and iPad portrait touch (810×1080). Every run checks the grade badge, read-aloud default
 * (on for K–2), planning the day (keys or taps), serving customers (arrow keys + Space, or tapping
 * items and lanes), making change by key or tap, one deliberately wrong change with its kind
 * correction and explanation, the evening ledger, an upgrade, transmissions, the mission report,
 * grade-appropriate standard codes, no page errors and no page scroll. One run without ?grade=
 * checks the grade picker. The page's ?debug hook (window.__st) is only read to decide what to
 * press; every action is a real key press or tap.
 */
const path = require("path");
const fs = require("fs");
const { execSync } = require("child_process");
const { chromium } = require(path.join(execSync("npm root -g").toString().trim(), "playwright"));

const BASE = process.env.BASE || "http://127.0.0.1:4647/";
const GRADES = (process.env.GRADES || "K,3,7,11").split(",");
const MODES = (process.env.MODES || "keys,touch,portrait").split(",");
const SHOT = process.env.SHOT;
// Codes a grade's questions may carry (adaptive math moves ±2 grades; high school reviews down to 7).
const CODE_FOR = {
  K: /^(NC\.K\.|K\.|NC\.[12]\.|[12]\.)/,
  3: /^(NC\.[1-5]\.|[1-5]\.)/,
  7: /^(NC\.[5-9]\.|[5-9]\.|NC\.M1)/,
  11: /^(NC\.[7-8]\.|NC\.M\d|WH\.|CL\.|AH\.|EPF\.)/,
};

const S = (page, expr) => page.evaluate(new Function(`const g = window.__st; return (${expr});`));

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

async function run(browser, grade, mode) {
  const touch = mode !== "keys";
  const vp = mode === "portrait" ? { width: 810, height: 1080 } : mode === "touch" ? { width: 1080, height: 810 } : { width: 1280, height: 800 };
  const ctx = await browser.newContext(touch ? { viewport: vp, hasTouch: true, isMobile: true, deviceScaleFactor: 2 } : { viewport: vp });
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (m) => {
    if (m.type() === "error" && !/fonts\.(googleapis|gstatic)|ERR_|Failed to load resource/.test(m.text())) errors.push(m.text());
  });
  await page.goto(grade ? `${BASE}?grade=${grade}&debug&fast` : `${BASE}?debug&fast`, { waitUntil: "load" });
  await page.waitForFunction(() => !!window.__st);
  const problems = [];
  const notes = new Set();
  const tap = async (loc) => (touch ? loc.tap() : loc.click());

  // Grade badge vs picker
  const badge = await page.locator(".st-badge").count();
  const picker = await page.locator(".st-grades").count();
  if (grade && (!badge || picker)) problems.push(`with ?grade= expected the badge, got badge=${badge} picker=${picker}`);
  let g = grade;
  if (!grade) {
    if (badge || !picker) problems.push(`without ?grade= expected the picker, got badge=${badge} picker=${picker}`);
    await tap(page.locator(".st-grade", { hasText: /^5$/ }));
    const on = (await page.locator(".st-grade.on").innerText()).trim();
    if (on !== "5") problems.push(`picker did not select grade 5 (${on})`);
    g = "5";
    notes.add("picker shows and selects grade 5");
  }
  const ra = (await page.locator(".st-tools button", { hasText: "READ ALOUD" }).innerText()).trim();
  const early = g === "K" || g === "1" || g === "2";
  if (early !== (ra === "READ ALOUD ON")) problems.push(`read-aloud default wrong for grade ${g}: ${ra}`);
  else notes.add(`read-aloud ${early ? "on" : "off"} by default`);
  await layoutOk(page, problems, "title");

  // Start
  // After choosing a grade on the picker, focus sits on that grade button, so click Start.
  if (touch || !grade) await tap(page.locator(".st-cta", { hasText: "Start" }));
  else await page.keyboard.press("Enter");
  await page.waitForTimeout(150);
  if ((await S(page, "g.phase")) !== "plan") problems.push(`start did not open the plan (${await S(page, "g.phase")})`);

  let wrongDone = false;
  let shotDone = false;
  let pays = 0;
  let served = 0;
  let upgradeBought = false;
  let transKey = 0;
  let transTap = 0;
  const codes = new Set();
  let guard = 0;
  let maxPhaseLoops = 0;
  let stuckConts = 0;
  console.error(`run grade ${grade} ${mode}`);

  const answerQ = async (pick, kind) => {
    // pick = index to choose
    const btn = page.locator(".st-btn").nth(pick);
    if (touch) await tap(btn);
    else await page.keyboard.press(Math.random() < 0.5 ? String(pick + 1) : "abcd"[pick]);
    await page.waitForTimeout(60);
    const picked = await S(page, "g.q && g.q.picked");
    if (picked !== pick) problems.push(`${kind}: answer ${pick} not registered (${picked})`);
    const fb = await page.locator(".st-feedback").count();
    if (!fb) problems.push(`${kind}: no explanation shown`);
  };
  const cont = async () => {
    if (touch) await tap(page.locator(".st-feedback .st-cta"));
    else await page.keyboard.press("Enter");
    await page.waitForTimeout(60);
  };

  while (guard++ < 6000) {
    const st = await S(page, "({ phase: g.phase, rescue: g.rescue, q: g.q ? { a: g.q.q.answer, picked: g.q.picked, std: g.q.q.standard, purpose: g.q.purpose } : null, day: g.day, days: g.days })");
    if (st.phase === "over") break;
    if (st.q && st.q.picked === null) codes.add(st.q.std);
    if (st.q && st.q.picked !== null) {
      // An answered question whose Continue did not land yet.
      stuckConts++;
      await cont();
      continue;
    }
    switch (st.phase) {
      case "plan": {
        await layoutOk(page, problems, `plan day ${st.day}`);
        if (st.rescue) {
          await tap(page.locator(".st-cta", { hasText: /loan|Fresh/i }));
          notes.add("rescue offered");
          break;
        }
        const before = await S(page, "g.cartCost()");
        if (touch) {
          await tap(page.locator(".st-cta", { hasText: "Help me plan" }));
          await tap(page.locator(".st-step[aria-label='More Cups']"));
        } else {
          await page.keyboard.press("h");
          await page.keyboard.press("ArrowDown");
          await page.keyboard.press("ArrowDown");
          await page.keyboard.press("ArrowRight"); // one more ice
        }
        const after = await S(page, "g.cartCost()");
        if (!(after > before)) problems.push(`plan day ${st.day}: buying did not change the cost`);
        notes.add(touch ? "planned by tapping" : "planned with keys (H, arrows)");
        if (touch) await tap(page.locator(".st-cta", { hasText: "Open the stand" }));
        else await page.keyboard.press("Enter");
        await page.waitForTimeout(80);
        break;
      }
      case "planQ":
        await answerQ(st.q.a, "plan question");
        await cont();
        notes.add("planning check answered");
        break;
      case "pay": {
        pays++;
        if (!shotDone && SHOT) {
          // canvas shot is taken during the rush, below
        }
        const wrong = !wrongDone;
        const pick = wrong ? (st.q.a + 1) % 4 : st.q.a;
        await answerQ(pick, "pay");
        if (wrong) {
          const txt = await page.locator(".st-feedback").innerText();
          if (!/KINDLY CORRECTS/i.test(txt)) problems.push(`wrong change: no kind correction (${txt.slice(0, 80)})`);
          const expl = await S(page, "g.q.q.explanation");
          if (!txt.includes(expl.slice(0, 20))) problems.push("wrong change: explanation missing");
          wrongDone = true;
          notes.add("wrong change → kind correction + explanation");
        }
        await cont();
        break;
      }
      case "rush": {
        maxPhaseLoops++;
        // Decide whom to serve
        const plan = await S(
          page,
          `(() => { if (g.closing >= 0) return null; let best = null; const flying = new Set(g.slides.filter(s => s.dir === 1).map(s => s.lane));
            for (let l = 0; l < g.lanes; l++) { const f = g.front(l); if (!f || flying.has(l) || f.x > 250) continue;
              const it = g.remaining(f).find(x => g.canMake(x) > 0); if (it && (!best || f.x < best.x)) best = { lane: l, item: it, x: f.x }; }
            return best ? { ...best, hero: g.heroLane, held: g.held, lanes: g.lanes, items: ["juice","fruit","snack"] } : null; })()`,
        );
        if (SHOT && !shotDone && grade === "3" && mode === "keys" && (await S(page, "g.customers.length")) >= 4) {
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
          fs.mkdirSync(path.dirname(SHOT), { recursive: true });
          fs.writeFileSync(SHOT, Buffer.from(data.split(",")[1], "base64"));
          shotDone = true;
          notes.add(`screenshot saved to ${SHOT}`);
        }
        if (plan) {
          if (touch) {
            // The rush can end (or a customer can start paying) between reading and tapping.
            if (plan.item !== plan.held) await page.locator(".st-ctl.item").nth(plan.items.indexOf(plan.item)).tap({ timeout: 1500 }).catch(() => {});
            if ((await S(page, "g.phase")) !== "rush") break;
            const box = await page.locator("canvas").boundingBox();
            const ly = await S(page, `(() => { const h = (198 - 56) / g.lanes; return 56 + h * (${plan.lane} + 0.5); })()`);
            await page.touchscreen.tap(box.x + box.width * (200 / 320), box.y + box.height * (ly / 200));
          } else {
            for (let i = plan.hero; i < plan.lane; i++) await page.keyboard.press("ArrowDown");
            for (let i = plan.hero; i > plan.lane; i--) await page.keyboard.press("ArrowUp");
            let held = await S(page, "g.held");
            for (let k = 0; k < 3 && held !== plan.item; k++) {
              await page.keyboard.press("ArrowRight");
              held = await S(page, "g.held");
            }
            await page.keyboard.press("Space");
          }
          served++;
        }
        await page.waitForTimeout(90);
        break;
      }
      case "ledger": {
        const book = await page.locator(".st-book").innerText();
        if (!/REVENUE/.test(book) || !/COSTS/.test(book) || !/(PROFIT|LOSS)/.test(book)) problems.push("ledger book incomplete");
        await layoutOk(page, problems, "ledger");
        await answerQ(st.q.a, "reflect");
        await cont();
        notes.add("evening ledger + reflection");
        break;
      }
      case "upgrade": {
        if (!upgradeBought && st.day < st.days) {
          const cash = await S(page, "g.cash");
          const costs = await S(page, "['sign','umbrella','counter','cooler'].map(u => g.upgradeCost(u))");
          const i = costs.findIndex((c) => c <= cash);
          if (i >= 0) {
            if (touch) await tap(page.locator(".st-up").nth(i));
            else await page.keyboard.press(String(i + 1));
            const own = await S(page, "g.upgrades.size");
            if (own < 1) problems.push("upgrade purchase failed");
            else {
              upgradeBought = true;
              notes.add(`bought an upgrade by ${touch ? "tap" : "key"}`);
            }
          }
        }
        if (touch) await tap(page.locator(".st-panel .st-cta"));
        else await page.keyboard.press("Enter");
        await page.waitForTimeout(80);
        break;
      }
      case "transmission": {
        await answerQ(st.q.a, "transmission");
        if (touch) transTap++;
        else transKey++;
        await cont();
        break;
      }
      default:
        await page.waitForTimeout(80);
    }
  }
  const phase = await S(page, "g.phase");
  if (phase !== "over") problems.push(`did not reach the report (phase ${phase})`);
  else {
    const rep = page.locator(".st-panel.report");
    const txt = await rep.innerText();
    if (!/RESULTS BY STANDARD/.test(txt) || !/Practice next/.test(txt)) problems.push("report missing standards or practice next");
    const rows = await rep.locator("table").nth(1).locator("tbody tr").count();
    if (rows < 2) problems.push(`report has only ${rows} standard rows`);
    notes.add(`report: ${rows} standards`);
    await layoutOk(page, problems, "report");
  }
  if (stuckConts > 3) problems.push(`Continue needed ${stuckConts} retries`);
  if (pays < 3) problems.push(`only ${pays} pay questions`);
  if (!wrongDone) problems.push("never tried a wrong change");
  if (!upgradeBought) notes.add("(no upgrade affordable)");
  if (transKey + transTap < 1) problems.push("no transmission answered");
  const re = CODE_FOR[g] || /./;
  const bad = [...codes].filter((c) => !re.test(c));
  if (bad.length) problems.push(`codes off-grade for ${g}: ${bad.join(", ")}`);
  notes.add(`${pays} customers paid · ${served} serves · transmissions ${transKey ? `${transKey} by key` : `${transTap} by tap`}`);
  notes.add(`codes: ${[...codes].sort().join(" ")}`);
  if (errors.length) problems.push(...errors.map((e) => `page error: ${e}`));
  await ctx.close();
  return { grade: grade || "(picker)", mode, problems, notes: [...notes] };
}

(async () => {
  const browser = await chromium.launch();
  const results = [];
  for (const grade of GRADES) for (const mode of MODES) results.push(await run(browser, grade, mode));
  if (!process.env.GRADES) results.push(await run(browser, null, "keys"));
  await browser.close();
  let bad = 0;
  for (const r of results) {
    console.log(`\n== grade ${r.grade} · ${r.mode}: ${r.problems.length ? "PROBLEMS" : "OK"}`);
    for (const n of r.notes) console.log("   · " + n);
    for (const p of r.problems) console.log("   ✘ " + p);
    bad += r.problems.length;
  }
  console.log(`\n${results.length} runs, ${bad} problems`);
  process.exit(bad ? 1 : 0);
})();
