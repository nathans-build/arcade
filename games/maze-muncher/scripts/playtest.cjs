/*
 * Automated playtest (dev only). Needs a running preview and a global Playwright:
 *   npm run build && npx vite preview --port 4406 --host 127.0.0.1 &
 *   node scripts/playtest.cjs            # GRADES=K,3,7,11 by default; SHOT=docs/screenshot.png saves a canvas shot
 * For each grade it plays with the keyboard (1280x800) and with touch (iPad 1080x810):
 * steers the hero (arrows / D-pad / swipe), answers pellet questions right and wrong with keys
 * (1-4 and A-D), banner taps and taps on the pellet labels in the canvas, walks onto a pellet,
 * clears the maze, answers the transmission with a key or a tap, checks the layout fits, then
 * loses the last life and checks the mission report. One extra run without ?grade= checks
 * that the grade picker shows.
 */
const path = require("path");
const fs = require("fs");
const { execSync } = require("child_process");
const { chromium } = require(path.join(execSync("npm root -g").toString().trim(), "playwright"));

const BASE = process.env.BASE || "http://127.0.0.1:4406/";
const GRADES = (process.env.GRADES || "K,3,7,11").split(",");
const SHOT = process.env.SHOT;
const SUBJECT_FOR = { K: "MATH", 3: "MIXED", 7: "SCIENCE", 11: "ELA", "": "SOCIAL STUDIES" };

const state = (page) =>
  page.evaluate(() => {
    const e = window.__mm;
    const s = e.sim;
    return {
      playing: e.playing, paused: e.paused, phase: s.phase, qPhase: s.qPhase, level: s.level, score: s.score, lives: s.lives,
      hero: { x: s.hero.x, y: s.hero.y, dir: s.hero.dir }, dotsLeft: s.dotsLeft, answerIdx: s.answerIdx, revealIdx: s.revealIdx,
      live: s.pelletLive.slice(), frightened: s.critters.filter((c) => c.frightened).length, critters: s.critters.length,
      maze: { name: s.maze.name, cols: s.maze.cols, rows: s.maze.rows },
      q: e.q && { id: e.q.id, grade: e.q.grade, subject: e.q.subject, prompt: e.q.prompt, choices: e.q.choices, answer: e.q.answer, standard: e.q.standard },
    };
  });

const GRADE_NUM = (g) => (g === "K" ? 0 : Number(g));

async function waitFor(page, fn, arg, ms = 8000) {
  await page.waitForFunction(fn, arg, { timeout: ms });
}

/** Page coordinates of a logical canvas point. */
async function canvasPoint(page, x, y) {
  const r = await page.locator("canvas").boundingBox();
  return { x: r.x + (x / 320) * r.width, y: r.y + (y / 200) * r.height };
}

async function labelCenter(page, i) {
  const box = await page.evaluate((i) => {
    const e = window.__mm;
    const b = e.labels && e.labels.boxes[i];
    return b ? { x: b.x + b.w / 2, y: b.y + b.h / 2 } : null;
  }, i);
  return box && canvasPoint(page, box.x, box.y);
}

async function ensureAsk(page) {
  // Skip any power/rage/gap timers so a fresh question is out.
  await page.evaluate(() => {
    const s = window.__mm.sim;
    if (s.phase === "ready") s.phaseT = 0.01;
    if (s.qPhase !== "ask") s.qT = 0.01;
  });
  await waitFor(page, () => window.__mm.sim.qPhase === "ask" && window.__mm.sim.phase === "play" && !!document.querySelector(".mm-banner .opt:not(:disabled)"));
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
  const url = grade ? `${BASE}?grade=${grade}&debug` : `${BASE}?debug`;
  await page.goto(url, { waitUntil: "load" });
  await page.waitForFunction(() => !!window.__mm);
  const problems = [];
  const notes = [];
  const tap = async (loc) => (touch ? loc.tap() : loc.click());

  // Grade badge vs picker
  const badge = await page.locator(".mm-badge").count();
  const picker = await page.locator(".mm-grades").count();
  if (grade && (!badge || picker)) problems.push(`with ?grade= expected badge, got badge=${badge} picker=${picker}`);
  if (!grade) {
    if (badge || !picker) problems.push(`without ?grade= expected picker, got badge=${badge} picker=${picker}`);
    await page.locator(".mm-grade", { hasText: /^4$/ }).click();
    const on = await page.locator(".mm-grade.on").innerText();
    if (on.trim() !== "4") problems.push(`picker did not select grade 4 (${on})`);
  }
  const expectGrade = grade || "4";
  const readAloudBtn = await page.locator(".mm-tools button", { hasText: "READ ALOUD" }).innerText().catch(() => "n/a");
  const subj = SUBJECT_FOR[grade];
  await tap(page.locator(".mm-subject", { hasText: new RegExp(`^${subj}$`) }));
  const subjOn = (await page.locator(".mm-subject.on").innerText()).trim();
  if (subjOn !== subj) problems.push(`subject picker: expected ${subj}, got ${subjOn}`);

  await tap(page.locator(".mm-cta", { hasText: "Start" }));
  await waitFor(page, () => window.__mm.playing && !!window.__mm.q);
  const controlsShown = await page.locator(".mm-controls.show").count();
  if (touch && !controlsShown) problems.push("touch controls hidden on coarse pointer");
  if (!touch && controlsShown) problems.push("touch controls shown for mouse/keyboard");

  let st = await state(page);
  const questions = [st.q];
  notes.push(`maze ${st.maze.name} ${st.maze.cols}x${st.maze.rows}, ${st.critters} critters`);

  // Layout: fits the viewport, no horizontal scroll.
  const layout = await page.evaluate(() => {
    const c = document.querySelector("canvas").getBoundingClientRect();
    return {
      sw: document.documentElement.scrollWidth, sh: document.documentElement.scrollHeight, iw: innerWidth, ih: innerHeight,
      canvasBottom: c.bottom, canvasW: c.width,
    };
  });
  if (layout.sw > layout.iw) problems.push(`horizontal scroll ${layout.sw} > ${layout.iw}`);
  if (layout.sh > layout.ih + 1) problems.push(`page taller than viewport ${layout.sh} > ${layout.ih}`);
  if (layout.canvasBottom > layout.ih + 1) problems.push(`canvas bottom ${layout.canvasBottom} below viewport ${layout.ih}`);

  // --- Steering: keys (keyboard) or the D-pad and a swipe (touch).
  await page.evaluate(() => (window.__mm.sim.phaseT = 0.01));
  await page.waitForTimeout(100);
  const before = await state(page);
  let travelled = 0;
  let prevHero = before.hero;
  const moves = ["ArrowLeft", "ArrowUp", "ArrowRight", "ArrowDown"];
  for (const k of moves) {
    if (touch) {
      const cls = { ArrowLeft: "left", ArrowUp: "up", ArrowRight: "right", ArrowDown: "down" }[k];
      await page.locator(`.mm-touch.${cls}`).tap();
    } else await page.keyboard.press(k);
    await page.waitForTimeout(350);
    const h = (await state(page)).hero;
    travelled += Math.abs(h.x - prevHero.x) + Math.abs(h.y - prevHero.y);
    prevHero = h;
  }
  if (touch) {
    // Swipe on the maze: left.
    const c = await canvasPoint(page, 160, 100);
    await page.evaluate(({ x, y }) => {
      const cv = document.querySelector("canvas");
      const ev = (type, px) => cv.dispatchEvent(new PointerEvent(type, { clientX: px, clientY: y, bubbles: true, pointerId: 7, pointerType: "touch" }));
      ev("pointerdown", x);
      ev("pointermove", x - 30);
      ev("pointerup", x - 30);
    }, c);
    const want = await page.evaluate(() => window.__mm.sim.hero.want);
    if (want !== 1) problems.push(`swipe left should set want=left, got ${want}`);
  }
  await page.waitForTimeout(300);
  const after = await state(page);
  if (travelled < 2) problems.push(`hero did not move when steered (travelled ${travelled.toFixed(2)} tiles)`);
  if (after.dotsLeft >= before.dotsLeft) problems.push("no dots munched while steering");
  // Letters never move the hero.
  if (!touch) {
    const w0 = await page.evaluate(() => window.__mm.sim.hero.want);
    await page.evaluate(() => { const s = window.__mm.sim; s.pelletLive = [false, false, false, false]; });
    for (const k of ["a", "d", "w", "s"]) await page.keyboard.press(k);
    const w1 = await page.evaluate(() => window.__mm.sim.hero.want);
    if (w0 !== w1) problems.push("letter keys changed the hero's direction");
    await page.evaluate(() => { const s = window.__mm.sim; s.qPhase = "gap"; s.qT = 0.01; });
  }
  // Keep the hero safe for the answer tests.
  const safe = () => page.evaluate(() => { for (const c of window.__mm.sim.critters) { c.state = "pen"; c.releaseIn = 999; } });
  await safe();

  // --- Answer 1: right, with a key (letter) or a banner tap.
  await ensureAsk(page);
  st = await state(page);
  if (touch) await page.locator(".mm-banner .opt").nth(st.answerIdx).tap();
  else await page.keyboard.press("abcd"[st.answerIdx]);
  await page.waitForTimeout(150);
  let s2 = await state(page);
  if (s2.qPhase !== "power") problems.push(`right answer should start power, got ${s2.qPhase}`);
  const okBanner = await page.locator(".mm-banner.correct").count();
  if (!okBanner) problems.push("banner did not show the right answer state");
  const info1 = await page.locator(".mm-banner .info").innerText();
  if (!info1.includes("Correct")) problems.push(`banner info after right answer: ${info1}`);

  // --- Answer 2: wrong, with a number key (keyboard) or a tap on the pellet's label in the canvas (touch).
  await ensureAsk(page);
  st = await state(page);
  questions.push(st.q);
  const wrong = (st.answerIdx + 1) % 4;
  if (touch) {
    const p = await labelCenter(page, wrong);
    await page.touchscreen.tap(p.x, p.y);
  } else await page.keyboard.press(String(wrong + 1));
  await page.waitForTimeout(150);
  s2 = await state(page);
  if (s2.qPhase !== "rage" || s2.revealIdx !== st.answerIdx) problems.push(`wrong answer should reveal ${st.answerIdx}: ${s2.qPhase} reveal=${s2.revealIdx}`);
  const info2 = await page.locator(".mm-banner .info").innerText();
  if (!info2.includes("The answer is")) problems.push(`banner info after wrong answer: ${info2}`);

  // --- Answer 3: every letter reachable: keyboard clicks a label in the canvas; touch taps the pellet itself.
  await ensureAsk(page);
  st = await state(page);
  questions.push(st.q);
  const target = 3 - (st.answerIdx === 3 ? 1 : 0);
  if (touch) {
    const pt = await page.evaluate((i) => {
      const s = window.__mm.sim;
      const m = s.maze;
      const ox = Math.floor((320 - m.cols * 8) / 2);
      const oy = Math.floor((200 - m.rows * 8) / 2);
      return { x: ox + m.pellets[i].x * 8 + 4, y: oy + m.pellets[i].y * 8 + 4 };
    }, target);
    const p = await canvasPoint(page, pt.x, pt.y);
    await page.touchscreen.tap(p.x, p.y);
  } else {
    const p = await labelCenter(page, target);
    await page.mouse.click(p.x, p.y);
  }
  await page.waitForTimeout(150);
  s2 = await state(page);
  if (s2.live.some(Boolean)) problems.push(`tap on pellet/label ${"ABCD"[target]} did not answer`);

  // --- Answer 4: walk onto a pellet.
  await ensureAsk(page);
  st = await state(page);
  questions.push(st.q);
  await page.evaluate(() => {
    const s = window.__mm.sim;
    const p = s.maze.pellets[0];
    s.hero.x = p.x; s.hero.y = p.y + 2; s.hero.dir = 0; s.hero.want = 0;
  });
  await page.waitForTimeout(700);
  s2 = await state(page);
  if (s2.live.some(Boolean)) problems.push("walking onto pellet A did not answer");

  // Screenshot mid-play (dizzy critters out) for the README.
  if (SHOT && grade === "3" && !touch) {
    await page.evaluate(() => {
      const s = window.__mm.sim;
      s.qT = 0.01;
    });
    await ensureAsk(page);
    await page.evaluate(() => {
      const s = window.__mm.sim;
      const r = [[1, 0], [3, 1]];
      s.critters.forEach((c, i) => { c.state = "active"; c.releaseIn = 0; });
      s.critters[0].x = 6; s.critters[0].y = 4;
      s.critters[1].x = 18; s.critters[1].y = 7; s.critters[1].dir = 1;
      s.critters[2].x = 12; s.critters[2].y = 18;
      s.critters[3].x = 5; s.critters[3].y = 15;
      s.hero.x = 9; s.hero.y = 11; s.hero.dir = 3; s.hero.want = 3; s.hero.facing = 3;
      void r;
    });
    await page.waitForTimeout(250);
    await page.evaluate(() => (window.__mm.paused = true));
    const data = await page.evaluate(() => {
      const src = document.querySelector("canvas");
      const c = document.createElement("canvas");
      c.width = 640; c.height = 400;
      const g = c.getContext("2d");
      g.imageSmoothingEnabled = false;
      g.drawImage(src, 0, 0, 640, 400);
      return c.toDataURL("image/png");
    });
    fs.mkdirSync(path.dirname(SHOT), { recursive: true });
    fs.writeFileSync(SHOT, Buffer.from(data.split(",")[1], "base64"));
    await page.evaluate(() => (window.__mm.paused = false));
    await safe();
    notes.push(`screenshot → ${SHOT}`);
  }

  // --- Clear the maze → transmission checkpoint.
  await page.evaluate(() => {
    const s = window.__mm.sim;
    s.dots.fill(0);
    s.dotsLeft = 0;
  });
  await page.waitForSelector(".mm-panel[aria-label='Transmission question']", { timeout: 8000 });
  const cpPrompt = await page.locator(".mm-prompt").innerText();
  const cpTag = await page.locator(".mm-tag.std").innerText();
  const cpAns = await page.evaluate(() => {
    const btns = [...document.querySelectorAll(".mm-choices .mm-btn")];
    return btns.length;
  });
  if (cpAns !== 4) problems.push(`checkpoint has ${cpAns} choices`);
  if (touch) await page.locator(".mm-choices .mm-btn").nth(1).tap();
  else await page.keyboard.press("2");
  await page.waitForSelector(".mm-feedback");
  const fb = await page.locator(".mm-feedback").innerText();
  if (fb.trim().length < 20) problems.push("checkpoint explanation missing");
  if (touch) await page.locator(".mm-cta", { hasText: "Next maze" }).tap();
  else await page.keyboard.press("Enter");
  await waitFor(page, () => window.__mm.sim.level === 2);
  st = await state(page);
  notes.push(`maze 2: ${st.maze.name}`);

  // --- Game over → mission report.
  await page.evaluate(() => {
    const s = window.__mm.sim;
    s.phase = "play";
    s.lives = 1;
    s.qPhase = "ask";
    const c = s.critters[0];
    c.state = "active"; c.frightened = false; c.x = s.hero.x; c.y = s.hero.y;
  });
  await page.waitForSelector(".mm-report-table", { timeout: 8000 });
  const report = await page.locator(".mm-overlay .mm-panel").innerText();
  if (!/MISSION REPORT/.test(report)) problems.push("no mission report");
  if (!/Practice next/.test(report)) problems.push("report has no practice-next line");
  const rows = await page.locator(".mm-report-table tbody tr").count();

  // Grade-appropriate content
  const gradesSeen = questions.filter(Boolean).map((q) => q.grade);
  const off = gradesSeen.filter((g) => Math.abs(GRADE_NUM(g) - GRADE_NUM(expectGrade)) > 2);
  if (off.length) problems.push(`questions from far-off grades: ${off.join(",")}`);
  const subjects = [...new Set(questions.filter(Boolean).map((q) => q.subject))];

  await ctx.close();
  return {
    grade: grade || "(picker→4)",
    mode,
    readAloud: readAloudBtn,
    subjects: subjects.join("+"),
    sample: questions.filter(Boolean).slice(0, 2).map((q) => `[${q.standard}] ${q.prompt} (${q.choices.join(" | ")})`),
    checkpoint: `${cpTag} — ${cpPrompt.slice(0, 80)}`,
    reportRows: rows,
    notes,
    problems,
    errors,
  };
}

/** Other screens: iPad portrait and phones. Start a game and check the fit. */
async function layoutRun(browser, name, viewport) {
  const ctx = await browser.newContext({ viewport, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  await page.goto(`${BASE}?grade=5&debug`, { waitUntil: "load" });
  await page.waitForFunction(() => !!window.__mm);
  await page.locator(".mm-cta", { hasText: "Start" }).tap();
  await page.waitForTimeout(400);
  const problems = [];
  const m = await page.evaluate(() => {
    const c = document.querySelector("canvas").getBoundingClientRect();
    const pads = [...document.querySelectorAll(".mm-touch")].map((b) => b.getBoundingClientRect());
    return {
      sw: document.documentElement.scrollWidth, sh: document.documentElement.scrollHeight, iw: innerWidth, ih: innerHeight,
      c: { top: c.top, bottom: c.bottom, left: c.left, right: c.right, w: c.width },
      padsVisible: pads.every((r) => r.bottom <= innerHeight + 1 && r.right <= innerWidth + 1 && r.width > 30),
      padOverCanvas: pads.some((r) => r.left < c.right - 2 && r.right > c.left + 2 && r.top < c.bottom - 2 && r.bottom > c.top + 2),
    };
  });
  if (m.sw > m.iw) problems.push(`horizontal scroll ${m.sw} > ${m.iw}`);
  if (m.sh > m.ih + 1) problems.push(`page taller than viewport ${m.sh} > ${m.ih}`);
  if (m.c.bottom > m.ih + 1 || m.c.w < 200) problems.push(`canvas not fully visible ${JSON.stringify(m.c)}`);
  if (!m.padsVisible) problems.push("touch pad off screen");
  if (m.padOverCanvas) problems.push("touch pad covers the game screen");
  if (process.env.LAYOUT_SHOTS) await page.screenshot({ path: path.join(process.env.LAYOUT_SHOTS, `layout-${name}.png`) }).catch(() => {});
  await ctx.close();
  return { grade: `5 (${name} ${viewport.width}x${viewport.height})`, mode: "layout", readAloud: "", subjects: "", sample: [], checkpoint: `canvas ${Math.round(m.c.w)}px wide`, reportRows: 0, notes: [], problems, errors };
}

(async () => {
  const browser = await chromium.launch();
  const results = [];
  if (!process.env.NOLAYOUT) {
    results.push(await layoutRun(browser, "ipad-portrait", { width: 810, height: 1080 }));
    results.push(await layoutRun(browser, "phone-landscape", { width: 844, height: 390 }));
    results.push(await layoutRun(browser, "phone-portrait", { width: 390, height: 844 }));
  }
  for (const g of GRADES) for (const mode of ["keys", "touch"]) results.push(await run(browser, g, mode));
  results.push(await run(browser, "", "keys"));
  await browser.close();
  let bad = 0;
  for (const r of results) {
    const ok = r.problems.length === 0 && r.errors.length === 0;
    if (!ok) bad++;
    console.log(`\n== grade ${r.grade} · ${r.mode} · ${ok ? "OK" : "PROBLEMS"}`);
    console.log(`   read-aloud button: ${r.readAloud} · subjects: ${r.subjects} · report rows: ${r.reportRows}`);
    for (const s of r.sample) console.log(`   Q: ${s}`);
    console.log(`   checkpoint: ${r.checkpoint}`);
    for (const n of r.notes) console.log(`   ${n}`);
    for (const p of r.problems) console.log(`   PROBLEM: ${p}`);
    for (const e of r.errors) console.log(`   ERROR: ${e}`);
  }
  console.log(bad ? `\n${bad} run(s) with problems` : "\nAll playtest runs OK");
  process.exit(bad ? 1 : 0);
})();
