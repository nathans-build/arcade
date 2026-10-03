/*
 * Automated playtest (dev only). Needs a running preview and a global Playwright:
 *   npm run build && npx vite preview --port 4431 --host 127.0.0.1 &
 *   node scripts/playtest.cjs        # GRADES=K,3,5,7,11 by default; SHOT=docs/screenshot.png saves a 640x400 canvas shot
 *
 * Runs (all with ?debug&fast so animations are quick):
 *  - for every grade: 1280x800 keyboard and iPad 1080x810 touch, vs the computer, played to a WIN:
 *    every shot question is answered (keys 1-4 / A-D, or taps), aiming with arrow keys / typed
 *    ordered pairs (grade 5+) / taps on the board. Along the way it checks the HUD notation for the
 *    grade, a coordinate challenge, and a power-up (sonar) answered by key and by tap.
 *  - for every grade, keyboard: a LOSS (wrong answers jam the sonar; a debug hook aims the computer).
 *  - pass-and-play at grades 3 (keyboard), 7 (iPad portrait 810x1080 touch) and 11: cover screens
 *    before each placement and each turn, two separate reports.
 *  - one run without ?grade= checks the grade picker.
 * It also checks no page errors, no page scroll, and that the controls fit the viewport.
 */
const path = require("path");
const { execSync } = require("child_process");
const { chromium } = require(path.join(execSync("npm root -g").toString().trim(), "playwright"));

const BASE = process.env.BASE || "http://127.0.0.1:4431/";
const GRADES = (process.env.GRADES || "K,3,5,7,11").split(",");
const SHOT = process.env.SHOT;

const NOTATION = {
  picture: /^(Fish|Crab|Star|Shell|Octopus|Turtle|Whale|Duck|Boat|Anchor) (10|[1-9])$/,
  letters: /^[A-J](10|[1-9])$/,
  q1: /^\([0-9], [0-9]\)$/,
  q4: /^\((−?[0-5]), (−?[0-5])\)$/,
};
const schemeOf = (g) => (g === "K" || +g <= 2 ? "picture" : +g <= 4 ? "letters" : +g === 5 ? "q1" : "q4");

const ui = (page) =>
  page.evaluate(() => {
    const g = window.__ss;
    const u = g.ui;
    return {
      phase: u.phase, mode: u.mode, seat: u.seat, viewer: u.viewer, scheme: u.scheme, size: u.size, turn: u.turn,
      q: u.q && { answer: u.q.q.answer, picked: u.q.picked, purpose: u.q.purpose, willRetry: u.q.willRetry, grade: u.q.q.grade, quick: !!u.q.q.quick, std: u.q.q.standard },
      aim: u.aim, msg: u.msg.text, winner: u.winner, challenge: u.challenge && { target: u.challenge.target, text: u.challenge.text },
      charge: u.charge, need: u.chargeNeeded, stats: u.stats.map((s) => ({ shots: s.shots, hits: s.hits, sunk: s.sunk.length, log: s.log.length, coord: s.log.filter((l) => l.cat === "coord").map((l) => l.correct), power: s.log.filter((l) => l.cat === "power").length })),
    };
  });

async function layout(page) {
  return page.evaluate(() => {
    const de = document.documentElement;
    const ctl = document.querySelector(".ss-controls.show");
    const cb = ctl ? ctl.getBoundingClientRect().bottom : 0;
    const scr = document.querySelector(".ss-screen").getBoundingClientRect();
    return { sw: de.scrollWidth, sh: de.scrollHeight, w: innerWidth, h: innerHeight, ctlBottom: Math.round(cb), screen: [Math.round(scr.width), Math.round(scr.height)] };
  });
}

async function run(browser, opts) {
  const { grade, input, outcome, mode, portrait } = opts;
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
  const url = grade ? `${BASE}?grade=${grade}&debug&fast` : `${BASE}?debug&fast`;
  await page.goto(url, { waitUntil: "load" });
  await page.waitForFunction(() => !!window.__ss);
  const click = async (loc) => (touch ? loc.tap() : loc.click());

  const badge = await page.locator(".ss-badge").count();
  const picker = await page.locator(".ss-grades").count();
  let g = grade;
  if (grade && (!badge || picker)) problems.push(`with ?grade= expected badge, got badge=${badge} picker=${picker}`);
  if (!grade) {
    if (badge || !picker) problems.push(`without ?grade= expected picker, got badge=${badge} picker=${picker}`);
    await page.locator(".ss-grade", { hasText: /^4$/ }).click();
    g = "4";
    const on = (await page.locator(".ss-grade.on").innerText()).trim();
    if (on !== "4") problems.push(`picker did not select grade 4 (${on})`);
  }
  const scheme = schemeOf(g);
  if (mode === "pass") await click(page.locator(".ss-opt", { hasText: "2 PLAYERS" }));
  if (opts.subject) await click(page.locator(".ss-opt", { hasText: opts.subject }));
  await click(page.locator(".ss-cta", { hasText: "Start" }));
  await page.waitForTimeout(200);
  if (outcome === "lose") await page.evaluate(() => (window.__ss.cpuOracle = true));

  const geom = await page.evaluate(() => {
    const u = window.__ss.ui;
    const plane = u.scheme === "q1" || u.scheme === "q4";
    if (!plane) return { x: 22, y: 12, pitch: 17 };
    return { x: 20, y: 5, pitch: u.size === 11 ? 15 : 17 };
  });
  const tapSpot = async (r, c) => {
    const box = await page.locator("canvas").boundingBox();
    const x = box.x + ((geom.x + c * geom.pitch + geom.pitch / 2) / 320) * box.width;
    const y = box.y + ((geom.y + r * geom.pitch + geom.pitch / 2) / 200) * box.height;
    if (touch) await page.touchscreen.tap(x, y);
    else await page.mouse.click(x, y);
  };

  let covers = 0;
  let placements = 0;
  let questions = 0;
  let wrongAnswered = 0;
  let keyAns = 0;
  let tapAns = 0;
  let powerDone = false;
  let challengeDone = false;
  let notationChecked = 0;
  let coverLeak = false;
  let aimMethodTried = { arrows: 0, typed: 0, tap: 0 };
  let ansToggle = 0;
  let missesForHint = 0;
  let hintSeen = false;
  const t0 = Date.now();
  let s = await ui(page);
  let lastFit = null;

  while (Date.now() - t0 < 240000) {
    s = await ui(page);
    if (s.phase === "over") break;
    if (s.phase === "cover") {
      covers++;
      // While covered nothing about the boards may show.
      const leak = await page.evaluate(() => window.__ss.scene().mode !== "cover" || !!document.querySelector(".ss-banner .aim"));
      if (leak) coverLeak = true;
      const txt = await page.locator(".ss-overlay.cover").innerText();
      if (!/PASS TO PLAYER [12]/.test(txt) || !/DON'T PEEK/.test(txt)) problems.push(`cover text: ${txt.slice(0, 60)}`);
      if (touch) await page.locator(".ss-overlay.cover .ss-cta").tap();
      else await page.keyboard.press("Enter");
      await page.waitForTimeout(60);
      continue;
    }
    if (s.phase === "place") {
      placements++;
      if (placements === 1) {
        // Place the first ship by hand (tap / keys), then AUTO the rest.
        if (touch) {
          await tapSpot(2, 1);
          await page.waitForTimeout(50);
        } else {
          await page.keyboard.press("ArrowDown");
          await page.keyboard.press("r");
          await page.keyboard.press("Space");
        }
        const placed = await page.evaluate(() => window.__ss.ui.placing.placed.length);
        if (placed !== 1) problems.push(`manual placement placed ${placed} ships`);
      }
      await click(page.locator(".ss-ctl", { hasText: "AUTO" }));
      await click(page.locator(".ss-ctl", { hasText: "READY" }));
      await page.waitForTimeout(60);
      continue;
    }
    if (s.phase === "question") {
      if (s.q.picked === null) {
        questions++;
        // Shot questions: quick, one grade below (K stays K). Power-up: own grade.
        if (s.q.purpose === "shot" && !s.q.quick) problems.push(`shot question not quick (${s.q.std})`);
        const wantWrong = outcome === "lose";
        const i = wantWrong ? (s.q.answer + 1) % 4 : s.q.answer;
        if (wantWrong) wrongAnswered++;
        const how = ansToggle++ % 3;
        if (touch || how === 2) {
          await click(page.locator(".ss-btn").nth(i));
          tapAns++;
        } else {
          await page.keyboard.press(how === 0 ? String(i + 1) : "abcd"[i]);
          keyAns++;
        }
        await page.waitForTimeout(40);
        const after = await ui(page);
        if (after.phase === "question" && after.q && after.q.picked !== i) problems.push(`answer ${i} not registered (${after.q.picked})`);
      } else {
        if (touch) await page.locator(".ss-feedback .ss-cta").tap().catch(() => {});
        else await page.keyboard.press("Enter");
        await page.waitForTimeout(40);
      }
      continue;
    }
    if (s.phase === "powerpick") {
      if (touch) await page.locator(".ss-power", { hasText: "SONAR" }).tap();
      else await page.keyboard.press("1");
      await page.waitForTimeout(40);
      continue;
    }
    if (s.phase === "sonarAim") {
      const spots = await page.evaluate(() => window.__ss.enemyShipSpots());
      const sp = spots[0];
      if (touch) {
        await tapSpot(sp.r, sp.c);
        await page.waitForTimeout(30);
        await tapSpot(sp.r, sp.c);
      } else {
        const d = await page.evaluate(() => window.__ss.ui.sonarAim);
        for (let k = 0; k < Math.abs(sp.r - d.r); k++) await page.keyboard.press(sp.r > d.r ? "ArrowDown" : "ArrowUp");
        for (let k = 0; k < Math.abs(sp.c - d.c); k++) await page.keyboard.press(sp.c > d.c ? "ArrowRight" : "ArrowLeft");
        await page.keyboard.press("Space");
      }
      await page.waitForTimeout(400);
      const son = await page.evaluate(() => window.__ss.match.sonar[window.__ss.ui.seat].filter((v) => v === 2).length);
      if (son < 4) problems.push(`sonar did not mark contact (${son})`);
      else notes.push(`sonar contact marked ${son} spots`);
      powerDone = true;
      continue;
    }
    if (s.phase === "aim") {
      // HUD notation check
      const aimTxt = (await page.locator(".ss-banner .aim").innerText()).replace(/^(AIM|SONAR)\s*/, "").trim();
      if (!NOTATION[scheme].test(aimTxt)) problems.push(`aim "${aimTxt}" is not ${scheme} notation`);
      else notationChecked++;
      const fireTxt = (await page.locator(".ss-ctl.fire .tgt").innerText()).trim();
      if (fireTxt !== aimTxt) problems.push(`FIRE button "${fireTxt}" != banner "${aimTxt}"`);

      // Power-up once (after the first turn): charge it with the debug hook, open it by key / tap.
      if (!powerDone && s.turn >= 3 && outcome === "win" && s.seat === 0) {
        await page.evaluate(() => {
          const g = window.__ss;
          g.match.charge[g.ui.seat] = g.ui.chargeNeeded[g.ui.seat];
          g.ui.charge = [...g.match.charge];
          g.ui.msg = { ...g.ui.msg };
        });
        await page.waitForTimeout(30);
        if (touch) await page.locator(".ss-ctl.power").tap();
        else await page.keyboard.press("u");
        await page.waitForTimeout(60);
        const ph = (await ui(page)).phase;
        if (ph !== "powerpick") problems.push(`power-up menu did not open (${ph})`);
        continue;
      }
      // Coordinate challenge once.
      let target = null;
      const early = scheme === "picture" && mode !== "pass" && outcome === "win";
      if (!challengeDone && s.turn >= 5 && outcome === "win" && (!early || missesForHint > 3)) {
        const ch = await page.evaluate(() => window.__ss.debugChallenge());
        if (ch) {
          target = ch.target;
          notes.push(`challenge: ${ch.text}`);
          challengeDone = true;
        }
      }
      // K-2 hint glow: after 3 misses in a row a glow marks an area with a ship.
      if (early && missesForHint < 3 && !target) {
        const ships = await page.evaluate(() => window.__ss.enemyShipSpots().map((p) => p.r * 100 + p.c));
        const open = await page.evaluate(() => window.__ss.openSpots());
        target = open.find((p) => !ships.includes(p.r * 100 + p.c));
        missesForHint++;
      } else if (early && missesForHint === 3 && !hintSeen) {
        hintSeen = await page.evaluate(() => !!window.__ss.ui.hint);
        if (!hintSeen) problems.push("no hint glow after 3 misses (K-2)");
        else notes.push("hint glow shown after 3 misses");
        missesForHint++;
      }
      if (!target) {
        if (outcome === "lose") target = (await page.evaluate(() => window.__ss.openSpots()))[0];
        else target = (await page.evaluate(() => window.__ss.enemyShipSpots()))[0];
      }
      const plane = scheme === "q1" || scheme === "q4";
      const method = touch ? "tap" : plane && aimMethodTried.typed <= aimMethodTried.arrows ? "typed" : "arrows";
      aimMethodTried[method]++;
      if (method === "tap") {
        await tapSpot(target.r, target.c);
        await page.waitForTimeout(30);
        if (aimMethodTried.tap % 2) await tapSpot(target.r, target.c);
        else await page.locator(".ss-ctl.fire").tap();
      } else if (method === "typed") {
        const name = await page.evaluate((t) => {
          const u = window.__ss.ui;
          const x = u.scheme === "q4" ? t.c - 5 : t.c;
          const y = u.scheme === "q4" ? 5 - t.r : 9 - t.r;
          return `(${x}, ${y})`;
        }, target);
        await page.keyboard.type(name.slice(1)); // first key focuses the TYPE box and starts "("
        await page.keyboard.press("Enter");
      } else {
        const a = s.aim;
        for (let k = 0; k < Math.abs(target.r - a.r); k++) await page.keyboard.press(target.r > a.r ? "ArrowDown" : "ArrowUp");
        for (let k = 0; k < Math.abs(target.c - a.c); k++) await page.keyboard.press(target.c > a.c ? "ArrowRight" : "ArrowLeft");
        await page.keyboard.press(aimMethodTried.arrows % 2 ? "Space" : "Enter");
      }
      await page.waitForTimeout(80);
      const after = await ui(page);
      if (after.phase === "aim" && after.turn === s.turn && after.stats[s.seat].shots === s.stats[s.seat].shots) {
        problems.push(`shot (${method}) at ${JSON.stringify(target)} did not fire: aim ${JSON.stringify(after.aim)} msg ${after.msg}`);
        break;
      }
      if (!lastFit) {
        lastFit = await layout(page);
        if (SHOT && grade === "7" && input === "keys" && mode !== "pass") {
          // a 640x400 shot of just the canvas, mid-game
          await page.waitForTimeout(300);
        }
      }
      continue;
    }
    await page.waitForTimeout(40);
  }
  s = await ui(page);
  if (s.phase !== "over") problems.push(`game did not finish (phase ${s.phase}, turn ${s.turn})`);
  if (mode !== "pass") {
    if (outcome === "win" && s.winner !== 0) problems.push(`expected a win, winner ${s.winner}`);
    if (outcome === "lose" && s.winner !== 1) problems.push(`expected a loss, winner ${s.winner}`);
  }
  if (outcome === "lose" && scheme === "picture") {
    // K-2: every jammed turn had a second try.
    const turnsHuman = s.stats[0].shots + (await page.evaluate(() => window.__ss.ui.stats[0].jams));
    if (questions < 2 * turnsHuman - 1) problems.push(`K-2 retry missing: ${questions} questions in ${turnsHuman} turns`);
    else notes.push(`K-2 second try on every jammed turn (${questions} questions, ${turnsHuman} turns)`);
  }
  if (outcome === "win" && mode !== "pass") {
    if (!powerDone) problems.push("power-up not tested");
    if (!challengeDone) problems.push("challenge not tested");
    const coord = s.stats[0].coord;
    if (challengeDone && !coord.includes(true)) problems.push(`challenge hit not logged (${coord})`);
    if (s.stats[0].power < 1) problems.push("power-up question not logged");
  }
  if (mode === "pass") {
    if (covers < 4) problems.push(`only ${covers} cover screens`);
    if (coverLeak) problems.push("board info visible during a cover screen");
    const tabs = await page.locator(".ss-tabs .ss-opt").count();
    if (tabs !== 2) problems.push(`pass-and-play report has ${tabs} tabs`);
    await click(page.locator(".ss-tabs .ss-opt").nth(1));
    const rep2 = await page.locator(".ss-panel.report").innerText();
    if (!/Player 2/i.test(rep2)) problems.push("player 2 report not shown");
  }
  const rep = await page.locator(".ss-panel.report").innerText().catch(() => "");
  for (const h of ["MISSION REPORT", "SHOT QUESTIONS", "POWER-UP QUESTIONS", "COORDINATE SKILLS", "Accuracy", "Ships sunk"]) if (!rep.includes(h)) problems.push(`report lacks "${h}"`);
  const fit = lastFit || (await layout(page));
  if (fit.sw > fit.w) problems.push(`horizontal scroll ${fit.sw} > ${fit.w}`);
  if (fit.sh > fit.h) problems.push(`vertical scroll ${fit.sh} > ${fit.h}`);
  if (fit.ctlBottom > fit.h) problems.push(`controls below the fold (${fit.ctlBottom} > ${fit.h})`);
  if (errors.length) problems.push(`errors: ${errors.slice(0, 3).join(" | ")}`);
  const label = `${grade || "(picker)"} ${input}${portrait ? " portrait" : ""} ${mode || "cpu"} ${outcome}`;
  console.log(
    `${problems.length ? "FAIL" : "ok  "} ${label.padEnd(30)} turns=${s.turn} covers=${covers} q=${questions} (keys ${keyAns}, taps ${tapAns}, wrong ${wrongAnswered}) notation✔${notationChecked} aim=${JSON.stringify(aimMethodTried)} screen=${fit.screen.join("x")} ${notes.join("; ")}`,
  );
  problems.forEach((p) => console.log("      - " + p));
  await ctx.close();
  return problems.length;
}

async function screenshot(browser) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();
  await page.goto(`${BASE}?grade=7&debug`, { waitUntil: "load" });
  await page.waitForFunction(() => !!window.__ss);
  await page.locator(".ss-cta", { hasText: "Start" }).click();
  await page.waitForTimeout(200);
  await page.locator(".ss-ctl", { hasText: "AUTO" }).click();
  await page.locator(".ss-ctl", { hasText: "READY" }).click();
  // Play a few turns quickly: answer right, hit ships sometimes, miss sometimes.
  for (let turn = 0; turn < 9; turn++) {
    for (let k = 0; k < 200; k++) {
      const ph = await page.evaluate(() => window.__ss.ui.phase);
      if (ph === "question") {
        const s = await page.evaluate(() => window.__ss.ui.q);
        if (s.picked === null) await page.keyboard.press(String(s.q.answer + 1));
        else await page.keyboard.press("Enter");
      } else if (ph === "aim") break;
      await page.waitForTimeout(50);
    }
    const spot = await page.evaluate((t) => {
      const g = window.__ss;
      const list = t % 3 === 2 ? g.openSpots() : g.enemyShipSpots();
      return list[Math.floor(list.length / 2)];
    }, turn);
    await page.evaluate((sp) => {
      window.__ss.ui.aim = sp;
      window.__ss.fire();
    }, spot);
    await page.waitForTimeout(2600);
  }
  // Wait for our next aim phase, put the cursor somewhere readable.
  for (let k = 0; k < 200; k++) {
    const ph = await page.evaluate(() => window.__ss.ui.phase);
    if (ph === "question") {
      const s = await page.evaluate(() => window.__ss.ui.q);
      if (s.picked === null) await page.keyboard.press(String(s.q.answer + 1));
      else await page.keyboard.press("Enter");
    } else if (ph === "aim") break;
    await page.waitForTimeout(80);
  }
  await page.keyboard.press("ArrowUp");
  await page.keyboard.press("ArrowRight");
  await page.waitForTimeout(400);
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
  require("fs").writeFileSync(SHOT, Buffer.from(data.split(",")[1], "base64"));
  console.log(`saved ${SHOT}`);
  await ctx.close();
}

(async () => {
  const browser = await chromium.launch();
  let bad = 0;
  if (SHOT) await screenshot(browser);
  if (process.env.ONLY_SHOT) {
    await browser.close();
    return;
  }
  for (const grade of GRADES) {
    bad += await run(browser, { grade, input: "keys", outcome: "win" });
    bad += await run(browser, { grade, input: "touch", outcome: "win", subject: grade === "3" ? "MIXED" : undefined });
    bad += await run(browser, { grade, input: "keys", outcome: "lose" });
  }
  bad += await run(browser, { grade: "3", input: "keys", outcome: "win", mode: "pass" });
  bad += await run(browser, { grade: "7", input: "touch", outcome: "win", mode: "pass", portrait: true });
  bad += await run(browser, { grade: "11", input: "keys", outcome: "win", mode: "pass" });
  bad += await run(browser, { grade: "K", input: "touch", outcome: "win", portrait: true, subject: "SOCIAL" });
  bad += await run(browser, { grade: null, input: "keys", outcome: "win" });
  await browser.close();
  console.log(bad ? `${bad} problem(s)` : "all runs passed");
  process.exit(bad ? 1 : 0);
})();
