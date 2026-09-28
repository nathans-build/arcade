// Playwright playtest (not part of the build). Serve first:
//   npm run build && npx vite preview --port 4409 --host 127.0.0.1
// then: node scripts/playtest.cjs            (GRADES=K,3 node scripts/playtest.cjs to narrow)
const path = require("path");
const fs = require("fs");
const { execSync } = require("child_process");
const { chromium } = require(path.join(execSync("npm root -g").toString().trim(), "playwright"));

const BASE = process.env.BASE || "http://127.0.0.1:4409/";
const OUT = path.join(__dirname, "..", ".playtest");
const GRADES = (process.env.GRADES || "K,3,7,11").split(",");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
fs.mkdirSync(OUT, { recursive: true });

const CONFIGS = [
  { name: "desktop", viewport: { width: 1280, height: 800 }, touch: false },
  { name: "ipad", viewport: { width: 1080, height: 810 }, touch: true },
];

async function toPage(page, x, y) {
  const r = await page.locator("canvas").boundingBox();
  return { x: r.x + (x / 320) * r.width, y: r.y + (y / 200) * r.height };
}

const st = (page) =>
  page.evaluate(() => {
    const e = window.__jungleRun.engine;
    return { scene: e.scene.index, kind: e.underground ? "tunnel" : e.scene.kind, x: Math.round(e.hero.x), y: Math.round(e.hero.y), state: e.hero.state,
      lives: e.lives, score: e.score, clock: Math.round(e.clock), challenge: e.challenge ? e.challenge.type : null, over: e.over };
  });

async function layout(page) {
  return page.evaluate(() => {
    const scr = document.querySelector(".jr-screen").getBoundingClientRect();
    return {
      hScroll: document.documentElement.scrollWidth > innerWidth,
      vScroll: document.documentElement.scrollHeight > innerHeight,
      screenBottom: Math.round(scr.bottom), screenW: Math.round(scr.width), vh: innerHeight,
    };
  });
}

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

/** Finds the first scene index of a kind (optionally with a treasure) in this expedition. */
async function findScene(page, kind, withTreasure = false) {
  return page.evaluate(({ kind, withTreasure }) => {
    const e = window.__jungleRun.engine;
    for (let i = 0; i < 60; i++) {
      const s = e.getScene(i);
      if ((kind === "any" || s.kind === kind) && (!withTreasure || s.treasure)) return i;
    }
    return -1;
  }, { kind, withTreasure });
}

/** Drives the explorer across a vine pit inside the page, with frame-accurate timing. */
function crossVine(page) {
  return page.evaluate(() => new Promise((resolve) => {
    const e = window.__jungleRun.engine;
    const s = e.scene;
    e.hero.x = s.pit.l - 9;
    e.hero.invuln = 0;
    let phase = "wait";
    let t0 = performance.now();
    const log = [];
    const tick = () => {
      const h = e.hero;
      const v = s.vine;
      const a = v.amp * Math.sin((2 * Math.PI * e.time) / v.period);
      const tipX = v.px + Math.sin(a) * v.len;
      if (phase === "wait" && a < -v.amp * 0.9 && Math.abs(tipX - (h.x + 5)) < 7) {
        e.setKey("jump", true); setTimeout(() => e.setKey("jump", false), 60);
        phase = "jumped"; log.push("jump");
      } else if (phase === "jumped" && h.state === "vine") {
        phase = "hang"; log.push("grabbed");
      } else if (phase === "jumped" && h.state === "ground") {
        phase = "wait"; log.push("missed, retry");
      } else if (phase === "hang" && a > v.amp * 0.92) {
        if (h.state === "vine") { e.setKey("jump", true); setTimeout(() => e.setKey("jump", false), 60); }
        phase = "released"; log.push("release");
      } else if (phase === "released" && (h.state === "ground" || h.state === "dying")) {
        return resolve({ crossed: h.state === "ground" && h.x > s.pit.r - 5, log, x: Math.round(h.x), pitR: s.pit.r });
      }
      if (performance.now() - t0 > 15000) return resolve({ crossed: false, log: [...log, "timeout"], state: h.state });
      requestAnimationFrame(tick);
    };
    tick();
  }));
}

/** Hops the explorer across a swamp from croc to croc. */
function crossSwamp(page) {
  return page.evaluate(() => new Promise((resolve) => {
    const e = window.__jungleRun.engine;
    const s = e.scene;
    const plats = [...s.crocs].map((c) => c.x).sort((a, b) => a - b);
    e.hero.x = s.pit.l - 11;
    e.hero.invuln = 0;
    let i = 0;
    let phase = "ready";
    const t0 = performance.now();
    const tick = () => {
      const h = e.hero;
      if (h.state === "dying") return resolve({ crossed: false, died: true, at: i });
      if (phase === "ready" && h.state === "ground") {
        e.setKey("right", true); e.setKey("jump", true); setTimeout(() => e.setKey("jump", false), 40);
        phase = "air";
      } else if (phase === "air" && h.state === "ground") {
        e.setKey("right", false);
        if (i >= plats.length) return resolve({ crossed: h.x > s.pit.r - 5, hops: i });
        phase = "walk";
      } else if (phase === "walk") {
        const target = plats[i] + 28 - 7; // walk to the back of this croc, then hop
        if (h.x + 5 < target) e.setKey("right", true);
        else { e.setKey("right", false); i++; phase = "ready"; }
      }
      if (performance.now() - t0 > 15000) return resolve({ crossed: false, timeout: true, hops: i, phase });
      requestAnimationFrame(tick);
    };
    tick();
  }));
}

async function runGrade(browser, cfg, grade) {
  const ctx = await browser.newContext({ viewport: cfg.viewport, hasTouch: cfg.touch, isMobile: cfg.touch, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (m) => { if (m.type() === "error" && !/fonts\.g|ERR_|Failed to load resource/.test(m.text())) errors.push(m.text()); });
  const r = { cfg: cfg.name, grade, notes: [] };
  const tap = async (sel) => (cfg.touch ? page.tap(sel) : page.click(sel));
  const cont = async () => {
    if (cfg.touch) await page.tap(".jr-banner .jr-cta");
    else await page.keyboard.press("Enter");
    await sleep(300);
  };
  try {
    await page.goto(`${BASE}?grade=${grade}&debug=1`);
    await page.waitForSelector(".jr-title");
    r.badge = (await page.textContent(".jr-badge").catch(() => null))?.replace(/\s+/g, " ").trim() ?? null;
    r.pickerShown = await page.isVisible(".jr-grades");
    r.firstSubject = (await page.textContent(".jr-subject >> nth=0")).replace(/\s+/g, " ").trim();
    r.titleLayout = await layout(page);
    await tap(".jr-subject >> nth=0"); // SOCIAL STUDIES
    await page.waitForSelector(".jr-banner");
    await sleep(300);
    const s0 = await st(page);

    // Core movement: run and jump.
    if (cfg.touch) {
      r.controlsVisible = await page.isVisible(".jr-controls.show");
      await page.dispatchEvent('[aria-label="Run right"]', "pointerdown");
      await sleep(400);
      await page.dispatchEvent('[aria-label="Run right"]', "pointerup");
      await page.dispatchEvent('[aria-label="Jump"]', "pointerdown");
      await sleep(120);
      r.jumped = (await st(page)).y < s0.y;
      await page.dispatchEvent('[aria-label="Jump"]', "pointerup");
    } else {
      await page.keyboard.down("ArrowRight");
      await sleep(400);
      await page.keyboard.up("ArrowRight");
      await page.keyboard.press("Space");
      await sleep(120);
      r.jumped = (await st(page)).y < s0.y;
    }
    r.ran = (await st(page)).x > s0.x;
    await sleep(800);

    // Treasure → question.
    const ti = await findScene(page, "any", true);
    await page.evaluate((i) => { const e = window.__jungleRun.engine; e.goTo(i); e.hero.x = e.scene.treasure.x - 16; e.hero.invuln = 2; }, ti);
    if (cfg.touch) await page.dispatchEvent('[aria-label="Run right"]', "pointerdown");
    else await page.keyboard.down("ArrowRight");
    await page.waitForSelector('[aria-label="Treasure question"]', { timeout: 6000 });
    if (cfg.touch) await page.dispatchEvent('[aria-label="Run right"]', "pointerup");
    else await page.keyboard.up("ArrowRight");
    await sleep(300);
    r.treasureQ = (await page.textContent('[aria-label="Treasure question"] .prompt')).trim().slice(0, 90);
    r.treasureStd = (await page.textContent('[aria-label="Treasure question"] .std')).trim();
    if (cfg.touch) await page.tap(".jr-banner .opt >> nth=2");
    else await page.keyboard.press("2");
    await page.waitForSelector(".jr-banner .info.result", { timeout: 4000 });
    r.treasureResult = (await page.textContent(".jr-banner .head span >> nth=0")).trim().slice(0, 50);
    r.treasurePicked = await page.evaluate(() => window.__jungleRun.engine.challenge.picked);
    await page.screenshot({ path: path.join(OUT, `${cfg.name}-${grade}-treasure.png`) });
    await cont();

    // Vine and swamp crossings with the real physics.
    const vi = await findScene(page, "vine");
    if (vi >= 0) {
      await page.evaluate((i) => window.__jungleRun.engine.goTo(i), vi);
      await sleep(900);
      r.vine = await crossVine(page);
      await sleep(200);
    }
    const si = await findScene(page, "swamp");
    if (si >= 0) {
      await page.evaluate((i) => window.__jungleRun.engine.goTo(i), si);
      await sleep(900);
      r.swamp = await crossSwamp(page);
      if (grade === "3" && cfg.name === "desktop") {
        await page.evaluate((i) => { const e = window.__jungleRun.engine; e.goTo(i); }, vi >= 0 ? vi : si);
        await sleep(600);
      }
    }
    r.livesAfterCrossings = (await st(page)).lives;

    // Crossroads map challenge (scene 3).
    await page.evaluate(() => window.__jungleRun.engine.goTo(3));
    await page.waitForSelector('[aria-label="Map challenge"]', { timeout: 4000 });
    await sleep(300);
    r.mapPrompt = (await page.textContent('[aria-label="Map challenge"] .prompt')).trim().slice(0, 90);
    r.mapStd = (await page.textContent('[aria-label="Map challenge"] .std')).trim();
    await sleep(300);
    r.mapLayout = await layout(page);
    await page.screenshot({ path: path.join(OUT, `${cfg.name}-${grade}-map.png`) });
    if (cfg.touch) {
      const sign = await page.evaluate(() => ({ x: 266 + 25, y: 100 + 12 })); // east sign
      const p = await toPage(page, sign.x, sign.y);
      await page.touchscreen.tap(p.x, p.y);
      r.mapAnsweredWith = "tap on the EAST sign";
    } else {
      // Walk to the rope ladder and climb (north).
      await page.evaluate(() => { const e = window.__jungleRun.engine; e.hero.x = 155; });
      await page.keyboard.press("ArrowUp");
      r.mapAnsweredWith = "▲ at the rope ladder (north)";
    }
    await page.waitForSelector(".jr-banner .info.result", { timeout: 4000 });
    r.mapPicked = await page.evaluate(() => { const c = window.__jungleRun.engine.challenge; return `${c.picked} (answer ${c.answer}, ${c.correct ? "right" : "wrong"})`; });
    r.mapExplained = (await page.textContent(".jr-banner .info.result span")).trim().slice(0, 70);
    await cont();
    r.afterMap = (await st(page)).scene;

    // Timeline gate (scene 5): answer in the right order.
    await page.evaluate(() => window.__jungleRun.engine.goTo(5));
    await page.waitForSelector('[aria-label="Timeline gate"]', { timeout: 4000 });
    await sleep(300);
    const order = await page.evaluate(() => {
      const c = window.__jungleRun.engine.challenge;
      const key = (e) => (e.year ?? e.step);
      return c.events.map((e, i) => ({ i, k: key(e) })).sort((a, b) => a.k - b.k).map((x) => x.i);
    });
    r.gateEvents = await page.evaluate(() => window.__jungleRun.engine.challenge.events.map((e) => e.tablet.replace(/\|/g, " ")).join(" / "));
    r.gateLayout = await layout(page);
    await page.screenshot({ path: path.join(OUT, `${cfg.name}-${grade}-gate.png`) });
    for (const i of order) {
      if (cfg.touch) {
        const p = await toPage(page, [14, 84, 154, 224][i] + 30, 125);
        await page.touchscreen.tap(p.x, p.y);
      } else await page.keyboard.press("ABCD"[i].toLowerCase());
      await sleep(150);
    }
    await page.waitForSelector(".jr-banner .info.result", { timeout: 4000 });
    r.gate = await page.evaluate(() => { const c = window.__jungleRun.engine.challenge; return `${c.correct ? "opened in order" : "WRONG"} +${c.bonus}`; });
    await cont();

    // Base camp radio checkpoint (scene 9).
    await page.evaluate(() => { const e = window.__jungleRun.engine; e.goTo(9); e.hero.x = 130; });
    if (cfg.touch) await page.dispatchEvent('[aria-label="Run right"]', "pointerdown");
    else await page.keyboard.down("ArrowRight");
    await page.waitForSelector('[aria-label="Treasure question"]', { timeout: 5000 });
    if (cfg.touch) await page.dispatchEvent('[aria-label="Run right"]', "pointerup");
    else await page.keyboard.up("ArrowRight");
    await sleep(300);
    r.campHead = (await page.textContent(".jr-banner .head span >> nth=0")).trim().slice(0, 50);
    r.campQ = (await page.textContent(".jr-banner .prompt")).trim().slice(0, 80);
    if (cfg.touch) await page.tap(".jr-banner .opt >> nth=0");
    else await page.keyboard.press("a");
    await page.waitForSelector(".jr-banner .info.result", { timeout: 4000 });
    r.campResult = (await page.textContent(".jr-banner .head span >> nth=0")).trim().slice(0, 40);
    await sleep(400);
    r.campLayout = await layout(page);
    await page.screenshot({ path: path.join(OUT, `${cfg.name}-${grade}-camp.png`) });
    await cont();

    // Tunnel shortcut.
    const li = await findScene(page, "ladder");
    if (li >= 0) {
      await page.evaluate((i) => { const e = window.__jungleRun.engine; e.goTo(i); e.hero.x = e.scene.ladderX + 3; e.hero.invuln = 3; }, li);
      await sleep(200);
      if (cfg.touch) { await page.dispatchEvent('[aria-label="Climb down"]', "pointerdown"); await sleep(80); await page.dispatchEvent('[aria-label="Climb down"]', "pointerup"); }
      else await page.keyboard.press("ArrowDown");
      await sleep(800);
      const u = await st(page);
      await page.evaluate(() => { const e = window.__jungleRun.engine; e.hero.x = 290; e.hero.invuln = 3; });
      await sleep(100);
      if (cfg.touch) { await page.dispatchEvent('[aria-label="Climb up"]', "pointerdown"); await sleep(80); await page.dispatchEvent('[aria-label="Climb up"]', "pointerup"); }
      else await page.keyboard.press("ArrowUp");
      await sleep(400);
      const up = await st(page);
      r.tunnel = `scene ${li} → ${u.kind} → up at scene ${up.scene} (${up.kind})`;
    }

    // Time runs out → mission report.
    await page.evaluate(() => { const e = window.__jungleRun.engine; e.goTo(1); e.clock = 0.4; });
    await page.waitForSelector("text=MISSION REPORT", { timeout: 6000 });
    await sleep(300);
    r.report = (await page.textContent(".jr-report-table").catch(() => "(no table)")).replace(/\s+/g, " ").slice(0, 220);
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

async function screenshot(browser) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();
  await page.goto(`${BASE}?grade=3&debug=1`);
  await page.waitForSelector(".jr-title");
  await page.click(".jr-subject >> nth=0");
  await page.waitForSelector(".jr-banner");
  // A vine scene with a treasure on the far side, explorer mid-swing.
  const i = await page.evaluate(() => {
    const e = window.__jungleRun.engine;
    for (let k = 0; k < 60; k++) { const s = e.getScene(k); if (s.kind === "vine" && s.treasure) return k; }
    for (let k = 0; k < 60; k++) if (e.getScene(k).kind === "vine") return k;
    return 1;
  });
  await page.evaluate((k) => window.__jungleRun.engine.goTo(k), i);
  await sleep(700);
  const res = await crossVine(page).catch(() => null);
  void res;
  await page.evaluate((k) => {
    const e = window.__jungleRun.engine;
    e.goTo(k);
    e.hero.x = e.scene.pit.l - 9;
  }, i);
  // wait for the vine to come near, grab it, and take the shot mid-swing
  await page.evaluate(() => new Promise((resolve) => {
    const e = window.__jungleRun.engine;
    const tick = () => {
      if (e.hero.state === "vine") {
        const v = e.scene.vine;
        const a = v.amp * Math.sin((2 * Math.PI * e.time) / v.period);
        if (Math.abs(a) < 0.12) { e.paused = true; return resolve(); }
      } else {
        const v = e.scene.vine;
        const a = v.amp * Math.sin((2 * Math.PI * e.time) / v.period);
        const tipX = v.px + Math.sin(a) * v.len;
        if (e.hero.state === "ground" && a < -v.amp * 0.9 && Math.abs(tipX - (e.hero.x + 5)) < 7) { e.setKey("jump", true); setTimeout(() => e.setKey("jump", false), 50); }
      }
      requestAnimationFrame(tick);
    };
    tick();
  }));
  await sleep(100);
  await saveCanvas640(page, path.join(__dirname, "..", "docs", "screenshot.png"));
  await ctx.close();
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
    await page.waitForSelector(".jr-title");
    const picker = await page.isVisible(".jr-grades");
    const badge = await page.isVisible(".jr-badge");
    await page.click(".jr-grade >> text=5");
    await page.click(".jr-subject >> nth=4"); // MIXED (with social studies)
    await page.waitForSelector(".jr-banner");
    const subjects = await page.evaluate(() => {
      const out = [];
      const e = window.__jungleRun.engine;
      for (let i = 0; i < 8; i++) out.push(e.cb.requestQuestion().subject);
      return out.join(",");
    });
    console.log(JSON.stringify({ cfg: "no-grade", picker, badge, mixedSubjects: subjects, errors }));
    await ctx.close();
  }
  await screenshot(browser);
  await browser.close();
  const bad = results.filter((r) => r.notes.length || r.errors.length);
  console.log(bad.length ? `✘ ${bad.length} run(s) with problems` : "✔ all runs clean");
})();
