// Playwright playtest (not part of the build). Serve first:
//   npm run build && npx vite preview --port 4405 --host 127.0.0.1
// then: node scripts/playtest.cjs            (GRADES=K,3 node scripts/playtest.cjs to narrow)
const path = require("path");
const fs = require("fs");
const { execSync } = require("child_process");
const { chromium } = require(path.join(execSync("npm root -g").toString().trim(), "playwright"));

const BASE = process.env.BASE || "http://127.0.0.1:4405/";
const OUT = path.join(__dirname, "..", ".playtest");
const GRADES = (process.env.GRADES || "K,3,7,11").split(",");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
fs.mkdirSync(OUT, { recursive: true });

const CONFIGS = [
  { name: "desktop", viewport: { width: 1280, height: 800 }, touch: false },
  { name: "ipad", viewport: { width: 1080, height: 810 }, touch: true },
];

/** Logical (320×200) canvas point → page coordinates. */
async function toPage(page, x, y) {
  const r = await page.locator("canvas").boundingBox();
  return { x: r.x + (x / 320) * r.width, y: r.y + (y / 200) * r.height };
}

const engineState = (page) =>
  page.evaluate(() => {
    const e = window.__routeRunner.engine;
    return {
      phase: e.phase, street: e.street, score: e.score, lives: e.lives, packets: e.packets, dist: Math.round(e.dist),
      rule: `${e.rule.target} (${e.rule.standard})`, subject: e.rule.subject,
      houses: e.houses.map((h) => `${h.label}${h.match ? "+" : "-"}`).join(" "),
      states: e.houses.map((h) => h.state), bx: Math.round(e.bx),
    };
  });

async function layout(page) {
  return page.evaluate(() => {
    const scr = document.querySelector(".rr-screen").getBoundingClientRect();
    return {
      hScroll: document.documentElement.scrollWidth > innerWidth,
      vScroll: document.documentElement.scrollHeight > innerHeight,
      screenBottom: Math.round(scr.bottom), screenW: Math.round(scr.width), vh: innerHeight,
    };
  });
}

/** Save the canvas scaled to exactly 640×400 with nearest-neighbour. */
async function saveCanvas640(page, file) {
  const data = await page.evaluate(() => {
    const src = document.querySelector("canvas");
    const c = document.createElement("canvas");
    c.width = 640;
    c.height = 400;
    const g = c.getContext("2d");
    g.imageSmoothingEnabled = false;
    g.drawImage(src, 0, 0, 640, 400);
    return c.toDataURL("image/png").split(",")[1];
  });
  fs.writeFileSync(file, Buffer.from(data, "base64"));
}

async function runGrade(browser, cfg, grade) {
  const ctx = await browser.newContext({ viewport: cfg.viewport, hasTouch: cfg.touch, isMobile: cfg.touch, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (m) => { if (m.type() === "error" && !/fonts\.g|ERR_|Failed to load resource/.test(m.text())) errors.push(m.text()); });
  const r = { cfg: cfg.name, grade, notes: [] };
  const tap = async (sel) => (cfg.touch ? page.tap(sel) : page.click(sel));
  try {
    await page.goto(`${BASE}?grade=${grade}&debug=1`);
    await page.waitForSelector(".rr-title");
    r.badge = (await page.textContent(".rr-badge").catch(() => null))?.replace(/\s+/g, " ").trim() ?? null;
    r.pickerShown = await page.isVisible(".rr-grades");
    r.scienceNote = (await page.textContent(".rr-subject >> nth=0")).replace(/\s+/g, " ").trim();
    await tap(".rr-subject >> nth=0"); // SCIENCE (science first)
    await page.waitForSelector(".rr-banner");
    await sleep(400);
    const s0 = await engineState(page);
    r.rule = s0.rule;
    r.houses = s0.houses;
    r.banner = (await page.textContent(".rr-banner .rule")).trim();
    // steering
    if (cfg.touch) {
      r.coarse = await page.evaluate(() => matchMedia("(pointer: coarse)").matches);
      r.controlsVisible = await page.isVisible(".rr-controls.show");
      await page.dispatchEvent('[aria-label="Steer left"]', "pointerdown");
      await sleep(350);
      await page.dispatchEvent('[aria-label="Steer left"]', "pointerup");
    } else {
      await page.keyboard.down("ArrowLeft");
      await sleep(350);
      await page.keyboard.up("ArrowLeft");
    }
    r.steered = (await engineState(page)).bx < s0.bx;
    // ride until a house is in reach, then throw (key on desktop, tap on the house on iPad)
    let thrown = false;
    for (let i = 0; i < 80 && !thrown; i++) {
      await sleep(150);
      const t = await page.evaluate(() => {
        const e = window.__routeRunner.engine;
        const h = e.currentTarget();
        return h ? { label: h.label, match: h.match, top: e.slotTop(h) } : null;
      });
      if (!t) continue;
      if (cfg.touch) {
        const p = await toPage(page, 50, t.top + 30);
        await page.touchscreen.tap(p.x, p.y);
      } else {
        await page.keyboard.press("Space");
      }
      r.threwAt = `${t.label} (${t.match ? "matches" : "does not match"})`;
      thrown = true;
    }
    await sleep(900);
    r.feedback = (await page.textContent(".rr-banner .info")).slice(0, 110);
    const s1 = await engineState(page);
    r.packetsAfterThrow = `${s0.packets}→${s1.packets}`;
    r.houseStates = s1.states.filter((x) => x !== "open").join(",");
    if (grade === "3" && cfg.name === "desktop") {
      await sleep(1200);
      await saveCanvas640(page, path.join(__dirname, "..", "docs", "screenshot.png"));
    }
    await page.locator("canvas").screenshot({ path: path.join(OUT, `${cfg.name}-${grade}-play.png`) });
    r.layout = await layout(page);
    // bonus yard checkpoint
    await page.evaluate(() => { const e = window.__routeRunner.engine; e.autoplay = true; e.skipToYard(); });
    await page.waitForSelector('[aria-label="Bonus yard question"]', { timeout: 20000 });
    await sleep(300);
    r.question = (await page.textContent('[aria-label="Bonus yard question"] .prompt')).trim().slice(0, 80);
    r.qStandard = (await page.textContent('[aria-label="Bonus yard question"] .std')).trim();
    r.yardLayout = await layout(page);
    await page.screenshot({ path: path.join(OUT, `${cfg.name}-${grade}-yard.png`) });
    if (cfg.touch) {
      // tap target C on the canvas
      const ty = await page.evaluate(() => { const e = window.__routeRunner.engine; return e.sy(e.yardD + 92); });
      const p = await toPage(page, 198, ty);
      await page.touchscreen.tap(p.x, p.y);
      r.answeredWith = "tap on target C";
    } else {
      await page.keyboard.press("1");
      r.answeredWith = "key 1";
    }
    await page.waitForSelector(".rr-banner .info.result", { timeout: 5000 });
    r.verdict = (await page.textContent(".rr-banner .head")).trim().slice(0, 60);
    r.picked = await page.evaluate(() => window.__routeRunner.engine.yard.picked);
    if (cfg.touch) await page.tap("text=Next street ▶"); else await page.keyboard.press("Enter");
    await sleep(500);
    const s2 = await engineState(page);
    r.street2 = `${s2.street}: ${s2.rule}`;
    // second yard: answer by tapping/clicking a banner option (B)
    await page.evaluate(() => window.__routeRunner.engine.skipToYard());
    await page.waitForSelector('[aria-label="Bonus yard question"]', { timeout: 20000 });
    await sleep(300);
    if (cfg.touch) await page.tap(".rr-banner .opt >> nth=1");
    else await page.keyboard.press("d");
    await page.waitForSelector(".rr-banner .info.result", { timeout: 5000 });
    r.verdict2 = (await page.textContent(".rr-banner .head")).trim().slice(0, 40);
    r.picked2 = await page.evaluate(() => window.__routeRunner.engine.yard.picked);
    if (cfg.touch) await page.tap("text=Next street ▶"); else await page.keyboard.press("Space");
    await sleep(400);
    // game over → mission report
    await page.evaluate(() => { const e = window.__routeRunner.engine; e.autoplay = false; e.lives = 1; e.crash("a traffic cone"); });
    await page.waitForSelector("text=MISSION REPORT", { timeout: 8000 });
    await sleep(300);
    r.report = (await page.textContent(".rr-report-table").catch(() => "(no table)")).replace(/\s+/g, " ").slice(0, 200);
    r.practice = await page.isVisible("text=Practice next:");
    r.reportLayout = await layout(page);
    await page.screenshot({ path: path.join(OUT, `${cfg.name}-${grade}-report.png`) });
  } catch (e) {
    r.notes.push("ERROR " + String(e).slice(0, 300));
    await page.screenshot({ path: path.join(OUT, `${cfg.name}-${grade}-error.png`) }).catch(() => {});
  }
  r.errors = errors;
  await ctx.close();
  return r;
}

(async () => {
  const browser = await chromium.launch();
  const results = [];
  for (const cfg of CONFIGS) for (const g of GRADES) {
    const r = await runGrade(browser, cfg, g);
    results.push(r);
    console.log(JSON.stringify(r));
  }
  // No ?grade= → the picker shows and choosing a grade works.
  {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await ctx.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(String(e)));
    await page.goto(`${BASE}?debug=1`);
    await page.waitForSelector(".rr-title");
    const picker = await page.isVisible(".rr-grades");
    const badge = await page.isVisible(".rr-badge");
    await page.click(".rr-grade >> text=5");
    const note = (await page.textContent(".rr-subject >> nth=1")).replace(/\s+/g, " ");
    await page.click(".rr-subject >> nth=3"); // MIXED
    await page.waitForSelector(".rr-banner");
    const rule = await page.evaluate(() => `${window.__routeRunner.engine.rule.subject}: ${window.__routeRunner.engine.rule.target}`);
    await page.screenshot({ path: path.join(OUT, "nograde-play.png") });
    console.log(JSON.stringify({ cfg: "no-grade", picker, badge, grade5MathNote: note, mixedFirstRule: rule, errors }));
    await ctx.close();
  }
  await browser.close();
  const bad = results.filter((r) => r.notes.length || r.errors.length);
  console.log(bad.length ? `✘ ${bad.length} run(s) with problems` : "✔ all runs clean");
})();
