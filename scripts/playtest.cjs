// Playwright playtest (not part of the build). Serve first:
//   npm run build && npx vite preview --port 4402 --host 127.0.0.1
// then: node scripts/playtest.cjs            (GRADES=K,3,7,11 by default)
const path = require("path");
const fs = require("fs");
const { execSync } = require("child_process");
const { chromium } = require(path.join(execSync("npm root -g").toString().trim(), "playwright"));

const BASE = process.env.BASE || "http://127.0.0.1:4402/";
const OUT = path.join(__dirname, "..", ".playtest");
const GRADES = (process.env.GRADES || "K,3,7,11").split(",");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
fs.mkdirSync(OUT, { recursive: true });

const CONFIGS = [
  { name: "desktop", viewport: { width: 1280, height: 800 }, touch: false },
  { name: "ipad", viewport: { width: 1080, height: 810 }, touch: true },
];

const eng = (page, fn, arg) => page.evaluate(([f, a]) => new Function("e", "a", f)(window.__rockDriller.engine, a), [fn, arg]);

async function hold(page, cfg, key, label, ms) {
  if (cfg.touch) {
    await page.dispatchEvent(`[aria-label="${label}"]`, "pointerdown");
    await sleep(ms);
    await page.dispatchEvent(`[aria-label="${label}"]`, "pointerup");
  } else {
    await page.keyboard.down(key);
    await sleep(ms);
    await page.keyboard.up(key);
  }
}

async function layout(page) {
  return page.evaluate(() => {
    const scr = document.querySelector(".rd-screen").getBoundingClientRect();
    const ctl = document.querySelector(".rd-controls");
    return {
      hScroll: document.documentElement.scrollWidth > innerWidth,
      vScroll: document.documentElement.scrollHeight > innerHeight,
      screenBottom: Math.round(scr.bottom), screenW: Math.round(scr.width), vh: innerHeight,
      controlsShown: ctl.classList.contains("show"), controlsBottom: Math.round(ctl.getBoundingClientRect().bottom),
    };
  });
}

(async () => {
  const browser = await chromium.launch();
  const results = [];
  for (const cfg of CONFIGS) {
    for (const grade of GRADES) {
      const ctx = await browser.newContext({ viewport: cfg.viewport, hasTouch: cfg.touch, isMobile: cfg.touch, deviceScaleFactor: 1 });
      const page = await ctx.newPage();
      const errors = [];
      page.on("pageerror", (e) => errors.push(String(e)));
      page.on("console", (m) => { if (m.type() === "error" && !/fonts\.g|ERR_|Failed to load resource/.test(m.text())) errors.push(m.text()); });
      const r = { cfg: cfg.name, grade, notes: [] };
      const tap = async (sel) => (cfg.touch ? page.tap(sel) : page.click(sel));
      try {
        await page.goto(`${BASE}?grade=${grade}&debug=1`);
        await page.waitForSelector("text=ROCK DRILLER");
        r.badge = await page.isVisible("text=CHANGE GRADE IN THE ARCADE");
        r.picker = await page.isVisible(".rd-grades");
        r.learn = (await page.textContent(".rd-learn")).replace(/\s+/g, " ").slice(0, 90);
        if (cfg.touch) await page.tap("text=Start drilling ▶"); else await page.keyboard.press("Enter");
        await sleep(3000);
        r.level = await eng(page, "return { mode: e.mode, site: e.data.site.name, goal: e.data.goal.text }");
        await eng(page, "e.godMode = true");

        // drill down and sideways
        const y0 = await eng(page, "return e.hy");
        await hold(page, cfg, "ArrowDown", "Drill down", 900);
        await hold(page, cfg, "ArrowRight", "Drill right", 500);
        const y1 = await eng(page, "return e.hy");
        r.drilled = y1 > y0;
        if (cfg.touch) { await page.dispatchEvent('[aria-label="Foam blaster"]', "pointerdown"); await sleep(150); await page.dispatchEvent('[aria-label="Foam blaster"]', "pointerup"); }
        else await page.keyboard.press("Space");
        r.layout = await layout(page);
        await page.locator("canvas[aria-label]").screenshot({ path: path.join(OUT, `${cfg.name}-${grade}-play.png`) });

        // gem question: stand above a buried gem and drill into it
        const gem = await eng(page, `const g = e.data.gems.find((g) => g.state === "buried" && g.row > 2 && !e.data.gems.some((h) => h.state === "buried" && h.col === g.col && h.row === g.row - 1) && !e.boulders.some((b) => b.col === g.col && b.row === g.row - 1));
          if (!g) return null; e.debugTeleport(g.col, g.row - 1); return { col: g.col, row: g.row, sp: g.specimen, target: g.target };`);
        r.gem = gem;
        await sleep(100);
        await hold(page, cfg, "ArrowDown", "Drill down", 150);
        await page.waitForSelector('[aria-label="Gem question"]', { timeout: 4000 });
        r.gemHead = (await page.textContent('[aria-label="Gem question"] .rd-h')).trim();
        r.gemQ = (await page.textContent('[aria-label="Gem question"] .rd-prompt')).trim().slice(0, 70);
        if (cfg.touch) await page.tap('[aria-label="Gem question"] .rd-btn >> nth=0'); else await page.keyboard.press("1");
        r.gemVerdict = (await page.textContent('[aria-label="Gem question"] .verdict')).trim();
        await page.screenshot({ path: path.join(OUT, `${cfg.name}-${grade}-gem.png`) });
        if (cfg.touch) await page.tap("text=Keep drilling ▶"); else await page.keyboard.press("Enter");
        await sleep(200);
        r.afterGem = await eng(page, "return { mode: e.mode, have: e.have }");

        // field challenge
        await eng(page, "e.debugChallenge()");
        await page.waitForSelector(".rd-banner.challenge", { timeout: 4000 });
        const ch = await eng(page, "const c = e.challenge; return { kind: c.kind, prompt: c.q.prompt, choices: c.q.choices, answer: c.q.answer, markers: c.markers, std: c.q.standard }");
        r.challenge = `${ch.std} ${ch.kind}: ${ch.prompt} [${ch.choices.join(" | ")}] ans ${ch.answer + 1}`;
        if (!cfg.touch && grade === (process.env.SHOT_GRADE || "7")) {
          // README screenshot: the canvas at 640×400, nearest-neighbour
          await sleep(400);
          const url = await page.evaluate(() => {
            const src = document.querySelector("canvas[aria-label]");
            const c = document.createElement("canvas");
            c.width = 640; c.height = 400;
            const g = c.getContext("2d");
            g.imageSmoothingEnabled = false;
            g.drawImage(src, 0, 0, 640, 400);
            return c.toDataURL("image/png");
          });
          fs.writeFileSync(path.join(__dirname, "..", "docs", "screenshot.png"), Buffer.from(url.split(",")[1], "base64"));
        }
        await page.screenshot({ path: path.join(OUT, `${cfg.name}-${grade}-challenge.png`) });
        if (cfg.touch) {
          await page.dispatchEvent(".rd-banner .opt >> nth=" + ch.answer, "pointerdown");
        } else {
          // drill into the right marker from the tile beside it
          const [mc, mr] = ch.markers[ch.answer];
          const from = mc > 0 ? [mc - 1, mr, "ArrowRight"] : [mc + 1, mr, "ArrowLeft"];
          await eng(page, "e.debugTeleport(a[0], a[1])", from);
          await page.keyboard.down(from[2]);
          await sleep(120);
          await page.keyboard.up(from[2]);
        }
        await page.waitForSelector(".rd-banner.correct, .rd-banner.wrong", { timeout: 3000 });
        r.challengeResult = (await page.textContent(".rd-banner .head span")).trim();
        // a second challenge answered with a letter key (desktop) or a tap on a wrong choice (touch)
        await page.waitForSelector(".rd-banner.challenge", { state: "detached", timeout: 8000 });
        await eng(page, "e.debugChallenge()");
        await page.waitForSelector(".rd-banner.challenge", { timeout: 4000 });
        if (cfg.touch) await page.dispatchEvent(".rd-banner .opt >> nth=3", "pointerdown");
        else await page.keyboard.press("b");
        await page.waitForSelector(".rd-banner.correct, .rd-banner.wrong", { timeout: 3000 });
        r.challenge2 = (await page.textContent(".rd-banner .head span")).trim();

        // level clear → transmission
        await eng(page, "e.debugFinishGoal()");
        await page.waitForSelector('[aria-label="Transmission question"]', { timeout: 6000 });
        r.transmission = (await page.textContent('[aria-label="Transmission question"] .rd-prompt')).trim().slice(0, 70);
        r.transmissionStd = (await page.textContent('[aria-label="Transmission question"] .std')).trim();
        if (cfg.touch) await page.tap('[aria-label="Transmission question"] .rd-btn >> nth=1'); else await page.keyboard.press("2");
        r.tVerdict = (await page.textContent('[aria-label="Transmission question"] .verdict')).trim();
        await page.screenshot({ path: path.join(OUT, `${cfg.name}-${grade}-transmission.png`) });
        if (cfg.touch) await page.tap("text=Next level ▶"); else await page.keyboard.press("Enter");
        await sleep(300);
        r.level2 = await eng(page, "return { level: e.level, mode: e.mode, site: e.data.site.name, goal: e.data.goal.text }");
        await sleep(2600);
        r.layout2 = await layout(page);

        // lose the last life → mission report
        await eng(page, "e.godMode = false; e.lives = 1; e.mode = 'play'; e.die('OUCH!')");
        await page.waitForSelector("text=MISSION REPORT", { timeout: 6000 });
        r.report = (await page.textContent(".rd-report-table")).replace(/\s+/g, " ").slice(0, 200);
        r.practice = await page.isVisible("text=Practice next:");
        await page.screenshot({ path: path.join(OUT, `${cfg.name}-${grade}-report.png`) });
      } catch (e) {
        r.notes.push("ERROR " + String(e).slice(0, 300));
        await page.screenshot({ path: path.join(OUT, `${cfg.name}-${grade}-error.png`) }).catch(() => {});
      }
      r.errors = errors;
      results.push(r);
      console.log(JSON.stringify(r));
      await ctx.close();
    }
  }

  // Opened directly (no ?grade=): the game shows its own picker.
  {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await ctx.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(String(e)));
    await page.goto(BASE);
    await page.waitForSelector("text=ROCK DRILLER");
    const picker = await page.isVisible(".rd-grades");
    const badge = await page.isVisible("text=CHANGE GRADE IN THE ARCADE");
    await page.click(".rd-grade >> text=7");
    const on = await page.textContent(".rd-grade.on");
    const learn = (await page.textContent(".rd-learn")).replace(/\s+/g, " ").slice(0, 80);
    console.log(JSON.stringify({ cfg: "no-grade", picker, badge, picked: on, learn, errors }));
    await ctx.close();
  }
  await browser.close();
})();
