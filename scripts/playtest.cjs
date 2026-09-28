/*
 * Automated playtest (dev only). Needs a running preview and a global Playwright:
 *   npm run build && npx vite preview --port 4202 --host 127.0.0.1 &
 *   node scripts/playtest.cjs
 * Plays a level per grade with the keyboard (1280x800) and with touch (iPad 1080x810):
 * aims the ship at target rocks, fires with real key presses / taps, checks that every
 * split is correct, answers the transmission, and checks layout fits the viewport.
 */
const path = require("path");
const { execSync } = require("child_process");
const { chromium } = require(path.join(execSync("npm root -g").toString().trim(), "playwright"));

const BASE = process.env.BASE || "http://127.0.0.1:4202/";
const GRADES = (process.env.GRADES || "K,4,7,10").split(",");
const SHOT = process.env.SHOT; // path for a canvas screenshot (grade 7, keyboard run)

function checkNote(note, grade) {
  // "36=4×9", "10=7+3" or "x²+5x+6=(x+2)(x+3)" (polynomials are fuzz-checked by check-splits)
  const [lhs, rhs] = note.split("=");
  if (!rhs) return `bad note ${note}`;
  if (/x/.test(note)) return grade === "K" || Number(grade) < 9 ? `algebra note at grade ${grade}: ${note}` : null;
  const n = Number(lhs);
  if (rhs.includes("+")) {
    const [a, b] = rhs.split("+").map(Number);
    return a + b === n ? null : `${note} does not add up`;
  }
  const ps = rhs.split("×").map(Number);
  return ps.reduce((p, x) => p * x, 1) === n ? null : `${note} does not multiply back`;
}

function labelOk(grade, r) {
  const g = grade === "K" ? 0 : Number(grade);
  if (g <= 2) return r.n !== null && r.n >= 1 && r.n <= (g === 0 ? 10 : 20);
  if (g <= 8) return r.n !== null && r.n >= 2 && r.n <= 400;
  return /x|^\d+$/.test(r.label) && r.poly !== null;
}

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
  await page.goto(`${BASE}?grade=${grade}&debug`, { waitUntil: "load" });
  await page.waitForFunction(() => !!window.__fb);
  const problems = [];

  const picked = await page.locator(".fb-grade.on").innerText();
  if (picked.trim() !== grade) problems.push(`grade picker shows ${picked}, expected ${grade}`);
  const readAloudBtn = await page.locator(".fb-tools button", { hasText: "READ ALOUD" }).innerText().catch(() => "n/a");

  if (touch) await page.locator(".fb-cta", { hasText: "Launch" }).tap();
  else await page.locator(".fb-cta", { hasText: "Launch" }).click();
  await page.waitForTimeout(300);
  const controlsShown = await page.locator(".fb-controls.show").count();
  if (touch && !controlsShown) problems.push("touch controls hidden on coarse pointer");
  if (!touch && controlsShown) problems.push("touch controls shown for mouse/keyboard");

  const state = () =>
    page.evaluate(() => {
      const e = window.__fb;
      return {
        mode: e.mode, level: e.level, score: e.score, lives: e.lives,
        rule: e.rule && e.rule.text,
        rocks: e.rocks.map((r) => ({ id: r.id, x: r.x, y: r.y, r: r.r, label: r.m.label, core: r.m.core, n: r.m.n, poly: r.m.poly, match: !r.m.core && e.rule.test(r.m) })),
        floaters: e.floaters.map((f) => f.text),
      };
    });

  let s = await state();
  const firstLabels = s.rocks.map((r) => r.label);
  const rule1 = s.rule;
  for (const r of s.rocks) if (!labelOk(grade, r)) problems.push(`grade ${grade} rock label ${r.label} not grade-appropriate`);

  const notes = new Set();
  const t0 = Date.now();
  let shots = 0;
  let shotPng = null;
  while (Date.now() - t0 < 60000) {
    s = await state();
    for (const f of s.floaters) if (f.includes("=") && !f.startsWith("COMBO")) notes.add(f);
    if (s.mode === "checkpoint" || s.mode === "clear") break;
    if (s.mode !== "play") {
      await page.waitForTimeout(200);
      continue;
    }
    // Aim at the nearest target rock (or a core); never at decoys.
    const targets = s.rocks.filter((r) => r.match || r.core);
    if (!targets.length) {
      await page.waitForTimeout(100);
      continue;
    }
    await page.evaluate(() => {
      const e = window.__fb;
      e.invuln = 5; // playtest: don't die while aiming
      e.svx = 0;
      e.svy = 0;
      e.sx = 160;
      e.sy = 100;
    });
    const tgt = targets.sort((a, b) => Math.hypot(a.x - 160, a.y - 100) - Math.hypot(b.x - 160, b.y - 100))[0];
    await page.evaluate((id) => {
      // Lead the target: solve for where the rock will be when a 190px/s bullet arrives.
      const e = window.__fb;
      const r = e.rocks.find((q) => q.id === id);
      if (!r) return;
      let t = 0;
      for (let i = 0; i < 4; i++) t = Math.hypot(r.x + r.vx * t - e.sx, r.y + r.vy * t - e.sy) / 190;
      e.angle = Math.atan2(r.x + r.vx * t - e.sx, -(r.y + r.vy * t - e.sy));
    }, tgt.id);
    if (touch) await page.locator(".fb-touch.fire").tap();
    else await page.keyboard.press("Space");
    shots++;
    await page.waitForTimeout(260);
    if (SHOT && grade === "7" && !touch && !shotPng && shots >= 4 && s.rocks.length >= 4 && (await page.evaluate(() => !window.__fb.banner))) {
      await page.evaluate(() => (window.__fb.invuln = 0)); // show the ship steady for the picture
      await page.waitForTimeout(60);
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
    }
  }
  for (const n of notes) {
    const err = checkNote(n, grade);
    if (err) problems.push(err);
  }
  if (notes.size === 0) problems.push("no splits observed");

  // Transmission checkpoint
  await page.waitForSelector('[aria-label="Transmission question"]', { timeout: 8000 }).catch(() => problems.push("checkpoint never appeared"));
  const prompt = await page.locator(".fb-prompt").innerText().catch(() => "");
  const std = await page.locator(".fb-tag.std").innerText().catch(() => "");
  if (touch) await page.locator(".fb-btn").first().tap();
  else await page.keyboard.press("1");
  const verdict = await page.locator(".verdict").innerText().catch(() => "");
  if (touch) await page.locator(".fb-cta", { hasText: "Next level" }).tap();
  else await page.keyboard.press("Enter");
  await page.waitForTimeout(400);
  s = await state();
  if (s.level !== 2 || s.mode !== "play") problems.push(`after checkpoint: level ${s.level}, mode ${s.mode}`);
  const rule2 = s.rule;

  // Layout: no horizontal scroll, everything fits the viewport height
  const layout = await page.evaluate(() => {
    const scr = document.querySelector(".fb-screen").getBoundingClientRect();
    const ctrl = document.querySelector(".fb-controls").getBoundingClientRect();
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
    const e = window.__fb;
    e.lives = 1;
    e.shield = 0;
    e.invuln = 0;
    e.die();
  });
  await page.waitForSelector(".fb-report-table", { timeout: 5000 }).catch(() => problems.push("mission report missing"));
  const reportRows = await page.locator(".fb-report-table tbody tr").allInnerTexts().catch(() => []);

  await ctx.close();
  return {
    grade, mode, problems, errors, readAloudBtn, first: firstLabels.join(" | "), rule1, rule2,
    notes: [...notes].slice(0, 5), shots, prompt: prompt.slice(0, 60), std, verdict: verdict.slice(0, 40), layout, reportRows, shotPng,
  };
}

(async () => {
  const browser = await chromium.launch();
  let bad = 0;
  for (const grade of GRADES) {
    for (const mode of ["keyboard", "touch"]) {
      const r = await run(browser, grade, mode);
      if (r.shotPng && SHOT) {
        require("fs").writeFileSync(SHOT, Buffer.from(r.shotPng.split(",")[1], "base64"));
        console.log(`saved ${SHOT}`);
      }
      delete r.shotPng;
      const ok = r.problems.length === 0 && r.errors.length === 0;
      if (!ok) bad++;
      console.log(`${ok ? "PASS" : "FAIL"} grade ${grade} ${mode}`);
      console.log(JSON.stringify(r, null, 1));
    }
  }
  await browser.close();
  process.exit(bad ? 1 : 0);
})();
