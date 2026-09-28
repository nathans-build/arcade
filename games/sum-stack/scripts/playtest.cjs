// Playwright playtest (not part of the build). Serve first:
//   npm run build && npx vite preview --port 4203 --host 127.0.0.1
// then: node scripts/playtest.cjs
const path = require("path");
const { execSync } = require("child_process");
const { chromium } = require(path.join(execSync("npm root -g").toString().trim(), "playwright"));

const BASE = process.env.BASE || "http://127.0.0.1:4203/";
const OUT = path.join(__dirname, "..", ".playtest");
const GRADES = (process.env.GRADES || "K,3,5,7,11").split(",");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const CONFIGS = [
  { name: "desktop", viewport: { width: 1280, height: 800 }, touch: false },
  { name: "ipad", viewport: { width: 1080, height: 810 }, touch: true },
];

(async () => {
  const browser = await chromium.launch();
  const results = [];
  for (const cfg of CONFIGS) {
    for (const grade of GRADES) {
      const ctx = await browser.newContext({ viewport: cfg.viewport, hasTouch: cfg.touch, isMobile: cfg.touch, deviceScaleFactor: 1 });
      const page = await ctx.newPage();
      const errors = [];
      page.on("pageerror", (e) => errors.push(String(e)));
      page.on("console", (m) => { if (m.type() === "error" && !/fonts\.g/.test(m.text()) && !/ERR_/.test(m.text())) errors.push(m.text()); });
      const r = { cfg: cfg.name, grade, notes: [] };
      try {
        await page.goto(`${BASE}?grade=${grade}&debug=1`);
        await page.waitForSelector(".ss-grade.on");
        r.picked = await page.textContent(".ss-grade.on");
        r.titleRule = (await page.textContent(".ss-rulebox")).replace(/\s+/g, " ").trim();
        const tap = async (sel) => (cfg.touch ? page.tap(sel) : page.click(sel));
        if (cfg.touch) await page.tap("text=Start ▶"); else await page.keyboard.press("Enter");
        await sleep(2600); // level banner
        const st = () => page.evaluate(() => {
          const e = window.__sumStack.engine;
          return { mode: e.mode, score: e.score, level: e.level, perfects: e.perfects, lines: e.lines, rule: e.rule.title, ctx: e.rule.context,
            piece: e.piece && e.piece.vals.map((v) => v.label), next: e.next && e.next.vals.map((v) => v.label), totalLines: e.totalLines };
        });
        const s0 = await st();
        r.rule = `${s0.rule} ${s0.ctx.join(" ")}`;
        r.pieceVals = s0.piece;
        // manual controls
        const x0 = await page.evaluate(() => window.__sumStack.engine.piece.x);
        if (cfg.touch) {
          r.coarse = await page.evaluate(() => matchMedia("(pointer: coarse)").matches);
          r.controlsVisible = await page.isVisible(".ss-controls.show");
          await page.dispatchEvent('[aria-label="Move left"]', "pointerdown");
          await page.dispatchEvent('[aria-label="Move left"]', "pointerup");
          await page.dispatchEvent(".ss-touch.rot", "pointerdown");
          await page.dispatchEvent(".ss-touch.rot", "pointerup");
        } else {
          await page.keyboard.press("ArrowLeft");
          await page.keyboard.press("ArrowUp");
        }
        const p1 = await page.evaluate(() => ({ x: window.__sumStack.engine.piece.x, rot: window.__sumStack.engine.piece.rot }));
        r.moved = p1.x !== x0 || p1.rot !== 0;
        if (cfg.touch) { await page.dispatchEvent(".ss-touch.drop", "pointerdown"); await page.dispatchEvent(".ss-touch.drop", "pointerup"); }
        else await page.keyboard.press("Space");
        await sleep(300);
        r.dropScore = (await st()).score;
        await sleep(1200);
        // mid-play canvas screenshot
        await page.locator("canvas").screenshot({ path: path.join(OUT, `${cfg.name}-${grade}-play.png`) });
        // layout checks
        r.layout = await page.evaluate(() => {
          const scr = document.querySelector(".ss-screen").getBoundingClientRect();
          const ctl = document.querySelector(".ss-controls");
          const cr = ctl.getBoundingClientRect();
          return {
            hScroll: document.documentElement.scrollWidth > innerWidth,
            vScroll: document.documentElement.scrollHeight > innerHeight,
            screenBottom: Math.round(scr.bottom), screenW: Math.round(scr.width), vh: innerHeight,
            controlsBottom: Math.round(cr.bottom),
          };
        });
        // bot plays until a perfect row and the checkpoint
        await page.evaluate(() => { window.__sumStack.engine.autoplay = true; });
        await page.waitForSelector('[aria-label="Transmission question"]', { timeout: 90000 });
        const s1 = await st();
        r.perfectsAtCheckpoint = s1.perfects;
        r.linesCleared = s1.totalLines;
        r.question = (await page.textContent(".ss-prompt")).slice(0, 70);
        await page.screenshot({ path: path.join(OUT, `${cfg.name}-${grade}-checkpoint.png`) });
        if (cfg.touch) await page.tap(".ss-btn >> nth=0"); else await page.keyboard.press("1");
        r.verdict = (await page.textContent(".ss-feedback .verdict")).trim();
        if (cfg.touch) await page.tap("text=Next level ▶"); else await page.keyboard.press("Enter");
        await sleep(300);
        const s2 = await st();
        r.levelAfter = s2.level;
        r.rule2 = `${s2.rule} ${s2.ctx.join(" ")}`;
        // top out: stop the bot and stack pieces in one column
        await page.evaluate(() => { window.__sumStack.engine.autoplay = false; });
        await sleep(2400);
        for (let i = 0; i < 200; i++) {
          const over = await page.isVisible("text=MISSION REPORT");
          if (over) break;
          if (await page.isVisible('[aria-label="Transmission question"]')) {
            await page.keyboard.press("2");
            await page.keyboard.press("Enter");
            await sleep(2400);
            continue;
          }
          if (cfg.touch) { await page.dispatchEvent(".ss-touch.drop", "pointerdown"); await page.dispatchEvent(".ss-touch.drop", "pointerup"); }
          else await page.keyboard.press("Space");
          await sleep(60);
        }
        await page.waitForSelector("text=MISSION REPORT", { timeout: 10000 });
        await sleep(300);
        r.report = (await page.textContent(".ss-report-table")).replace(/\s+/g, " ").slice(0, 160);
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
  await browser.close();
})();
