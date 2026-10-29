/*
 * Automated playtest for subjects, QUIZ gates and the shark adventures (dev only).
 * Needs a running preview and a global Playwright (Chromium):
 *   npm run build && npx vite preview --port 8915 --host 127.0.0.1 &
 *   node scripts/playtest-subjects.cjs        # BASE=http://127.0.0.1:8915/ by default
 * Runs at desktop (1280x800, keyboard) and phone (390x844, touch):
 *  - grade 7: picks SCIENCE in the library (saved, survives a reload), reads "The Tracker Before
 *    the Storm" (6-8 shark book) to an ending: story gates, a QUIZ gate answered wrong (−1 heart,
 *    the bank item's explanation as Quill's hint) then right, checkpoint transmissions, all SCIENCE
 *    at grade 7; the mission report lists the quick challenges and transmissions
 *  - grade 4: picks MATH and reads "Speckle and the Reef Rescue" (4-5 shark book) to an ending:
 *    QUIZ gates are MATH, a double miss reveals the answer (no hearts)
 *  - ?topic=science-mix from the menu preselects SCIENCE for the visit
 *  - phone: MUSIC and SFX buttons toggle by tap; no horizontal scroll; no page errors anywhere
 */
const path = require("path");
const fs = require("fs");
const { execSync } = require("child_process");
const { chromium } = require(path.join(execSync("npm root -g").toString().trim(), "playwright"));

const BASE = process.env.BASE || "http://127.0.0.1:8915/";
const STORIES = path.join(__dirname, "..", "src", "stories");

/** Right answers per page from a .story file: mc → the "+" answer, order → items in order. */
function answersOf(file) {
  const out = {};
  let page = null;
  let inGate = false;
  for (const raw of fs.readFileSync(path.join(STORIES, file), "utf8").split(/\r?\n/)) {
    const line = raw.trim();
    const pm = /^===\s*(\S+)/.exec(line);
    if (pm) { page = pm[1]; inGate = false; continue; }
    if (/^\?\s*QUIZ/i.test(line)) { out[page] = { kind: "quiz" }; inGate = true; continue; }
    const gm = /^\?\s*\S+\s*(order)?\s*:/.exec(line);
    if (gm) { out[page] = gm[1] ? { kind: "order", items: [] } : { kind: "mc", right: "" }; inGate = true; continue; }
    if (!inGate) continue;
    if (out[page].kind === "mc" && line.startsWith("+")) out[page].right = line.slice(1).trim();
    const om = /^\d+[.)]?\s+(.+)$/.exec(line);
    if (out[page].kind === "order" && om) out[page].items.push(om[1].trim());
  }
  return out;
}

async function newPage(browser, phone) {
  const ctx = await browser.newContext(
    phone ? { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 } : { viewport: { width: 1280, height: 800 } },
  );
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (m) => {
    if (m.type() === "error" && !/fonts\.(googleapis|gstatic)|ERR_|Failed to load resource/.test(m.text())) errors.push(m.text());
  });
  return { ctx, page, errors };
}

const R = (page) =>
  page.evaluate(() => {
    const r = document.querySelector(".pq-reader");
    if (!r) return null;
    const d = r.dataset;
    return { page: d.page, hearts: Number(d.hearts), gate: d.gate, kind: d.gateKind, revealed: d.revealed === "1", subject: d.subject, qSubject: d.quizSubject, qGrade: d.quizGrade, qAnswer: d.quizAnswer === undefined ? -1 : Number(d.quizAnswer) };
  });

async function tap(page, phone, locator) {
  if (phone) await locator.tap();
  else await locator.click();
  await page.waitForTimeout(180);
}

async function reveal(page, phone) {
  for (let i = 0; i < 4; i++) {
    const r = await R(page);
    if (!r || r.revealed) return;
    if (phone) await page.locator(".pq-screen canvas").tap();
    else await page.keyboard.press("Space");
    await page.waitForTimeout(120);
  }
}

async function noHScroll(page, problems, where) {
  const h = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
  if (h) problems.push(`${where}: horizontal scroll`);
}

/** Library: pick a subject (click/tap), check it's saved. */
async function pickSubject(page, phone, id, label, problems) {
  await tap(page, phone, page.locator(`.pq-subject[data-subject="${id}"]`));
  const on = await page.locator(`.pq-subject[data-subject="${id}"]`).getAttribute("aria-checked");
  const saved = await page.evaluate(() => localStorage.getItem("arcade.page-quest.subject"));
  if (on !== "true") problems.push(`${label} not selected`);
  if (saved !== id) problems.push(`subject saved as ${saved}, expected ${id}`);
}

async function openBook(page, phone, title, problems) {
  await tap(page, phone, page.locator(".pq-tab", { hasText: "ADVENTURE" }));
  const spine = page.locator(".pq-spine", { hasText: title });
  if (!(await spine.count())) {
    problems.push(`no spine "${title}"`);
    return false;
  }
  await tap(page, phone, spine);
  await tap(page, phone, page.locator(".pq-detail .pq-cta").first());
  await page.waitForTimeout(400);
  return !!(await R(page));
}

/**
 * Reads the open book to an ending. `route` picks choices by page id (default: the first choice).
 * `quizPlan(n)` says how to answer the n-th QUIZ gate: "right", "wrong-right" or "reveal".
 */
async function readToEnd(page, phone, answers, route, quizPlan, want, problems, notes) {
  let quizN = 0;
  let transmissions = 0;
  for (let step = 0; step < 150; step++) {
    if (await page.locator('[aria-label="Ending and mission report"]').count()) break;
    const tdlg = page.locator('[aria-label="Transmission question"]');
    if (await tdlg.count()) {
      const tag = await tdlg.locator(".pq-tag.subj").innerText();
      if (tag !== want.tag) problems.push(`transmission tag ${tag}, expected ${want.tag}`);
      await tap(page, phone, tdlg.locator(".pq-choice").first());
      const verdict = await tdlg.locator(".verdict").innerText().catch(() => "");
      const std = await tdlg.locator(".pq-tag.std").innerText();
      notes.push(`transmission ${tag} ${std}: ${verdict}`);
      transmissions++;
      if (phone) await tdlg.locator(".pq-cta").tap();
      else await page.keyboard.press("Enter");
      await page.waitForTimeout(250);
      continue;
    }
    if (await page.locator('[aria-label="The end?"]').count()) {
      problems.push("lost all hearts");
      return { quizN, transmissions };
    }
    await reveal(page, phone);
    let r = await R(page);
    if (!r) return { quizN, transmissions };
    if (r.kind === "quiz") {
      for (let w = 0; w < 10 && r.qAnswer < 0; w++) {
        await page.waitForTimeout(100);
        r = await R(page);
      }
      if (r.qSubject !== want.subject) problems.push(`${r.page}: QUIZ subject ${r.qSubject}, expected ${want.subject}`);
      if (!want.grades.includes(r.qGrade)) problems.push(`${r.page}: QUIZ grade ${r.qGrade}, expected ${want.grades.join("/")}`);
      const tag = await page.locator(".pq-gate.quiz .pq-tag.subj").innerText().catch(() => "");
      if (tag !== want.tag) problems.push(`${r.page}: QUIZ tag ${tag}`);
      const plan = quizPlan(quizN++);
      const btn = (i) => page.locator(".pq-gate.quiz .pq-answers .pq-choice").nth(i);
      const press = async (i) => {
        if (phone) await btn(i).tap();
        else await page.keyboard.press(i % 2 ? "abcd"[i] : String(i + 1));
        await page.waitForTimeout(200);
      };
      if (plan === "wrong-right" || plan === "reveal") {
        const before = r.hearts;
        await press((r.qAnswer + 1) % 4);
        const fb = await page.locator(".pq-gate .pq-feedback").innerText().catch(() => "");
        const after = await R(page);
        notes.push(`${r.page}: QUIZ ${tag} wrong → hearts ${before}→${after.hearts}; "${fb.slice(0, 70)}"`);
        if (!/Not quite/.test(fb) || !/Quill:/.test(fb)) problems.push(`${r.page}: wrong-answer feedback "${fb}"`);
        if (want.hearts && after.hearts !== before - 1) problems.push(`${r.page}: hearts ${before}→${after.hearts} (expected −1)`);
        if (!want.hearts && after.hearts !== before) problems.push(`${r.page}: hearts changed at grade 4`);
        if (plan === "reveal") {
          await press((r.qAnswer + 2) % 4);
          const rr = await R(page);
          if (rr.gate !== "reveal") problems.push(`${r.page}: expected reveal after 2 misses, got ${rr.gate}`);
          notes.push(`${r.page}: second miss → ${rr.gate}`);
        } else await press(r.qAnswer);
      } else await press(r.qAnswer);
      r = await R(page);
      if (r.gate !== "solved" && r.gate !== "reveal") problems.push(`${r.page}: QUIZ gate ${r.gate}`);
      await tap(page, phone, page.locator(".pq-gate .pq-cta"));
      continue;
    }
    if (r.kind === "mc") {
      const right = answers[r.page] && answers[r.page].right;
      const texts = await page.locator(".pq-gate .pq-answers .pq-choice").allInnerTexts();
      const i = texts.findIndex((t) => t.replace(/^[A-D]\s*/, "").trim() === right);
      if (i < 0) {
        problems.push(`${r.page}: right answer not found`);
        return { quizN, transmissions };
      }
      if (phone) await page.locator(".pq-gate .pq-answers .pq-choice").nth(i).tap();
      else await page.keyboard.press("abcd"[i]);
      await page.waitForTimeout(200);
      notes.push(`${r.page}: story gate ${await page.locator(".pq-gate .pq-tag.std").innerText()}`);
      await tap(page, phone, page.locator(".pq-gate .pq-cta"));
      continue;
    }
    if (r.kind === "order") {
      for (const it of answers[r.page].items) {
        const texts = await page.locator(".pq-gate .pq-tiles .pq-choice").allInnerTexts();
        const i = texts.findIndex((t) => t.includes(it));
        await tap(page, phone, page.locator(".pq-gate .pq-tiles .pq-choice").nth(i));
      }
      notes.push(`${r.page}: order gate ${(await R(page)).gate}`);
      await tap(page, phone, page.locator(".pq-gate .pq-cta"));
      continue;
    }
    const choices = page.locator(".pq-choices .pq-choice");
    if (await choices.count()) {
      const i = route[r.page] ?? 0;
      if (phone) await choices.nth(i).tap();
      else await page.keyboard.press(String(i + 1));
      await page.waitForTimeout(220);
      continue;
    }
    const end = page.locator(".pq-after .pq-cta");
    if (await end.count()) {
      await tap(page, phone, end);
      await page.waitForTimeout(300);
    }
  }
  return { quizN, transmissions };
}

async function report(page, problems, notes, wantRows) {
  const dlg = page.locator('[aria-label="Ending and mission report"]');
  if (!(await dlg.count())) {
    problems.push("no ending screen");
    return;
  }
  const name = await dlg.locator(".pq-endname").innerText();
  const rows = (await dlg.locator(".pq-report tbody tr").allInnerTexts()).map((x) => x.replace(/\s+/g, " "));
  notes.push(`ending ${name.replace(/\s+/g, " ")}`);
  notes.push(`report: ${rows.join(" | ")}`);
  for (const re of wantRows) if (!rows.some((x) => re.test(x))) problems.push(`mission report has no row like ${re}`);
}

async function run(browser, phone) {
  const label = phone ? "phone 390px" : "desktop";
  const { ctx, page, errors } = await newPage(browser, phone);
  const problems = [];
  const notes = [];

  // ---- grade 7, SCIENCE, the 6-8 shark book ----
  await page.goto(`${BASE}?grade=7&debug`);
  await page.waitForTimeout(700);
  if ((await page.locator(".pq-subject.on").innerText()) !== "MIXED") problems.push("MIXED is not the default");
  await pickSubject(page, phone, "science", "SCIENCE", problems);
  await page.reload();
  await page.waitForTimeout(600);
  if ((await page.locator(".pq-subject.on").innerText()) !== "SCIENCE") problems.push("SCIENCE not kept after reload");
  await noHScroll(page, problems, "library");
  if (phone) {
    // MUSIC / SFX are tappable on a phone.
    for (const [on, off] of [["MUSIC ON", "MUSIC OFF"], ["SFX ON", "SFX OFF"]]) {
      await page.locator(".pq-toolbar button", { hasText: on }).tap();
      await page.waitForTimeout(150);
      if (!(await page.locator(".pq-toolbar button", { hasText: off }).count())) problems.push(`${on} didn't toggle by tap`);
      await page.locator(".pq-toolbar button", { hasText: off }).tap();
      await page.waitForTimeout(150);
      if (!(await page.locator(".pq-toolbar button", { hasText: on }).count())) problems.push(`${off} didn't toggle back`);
    }
    notes.push("MUSIC and SFX toggled by tap");
  }
  if (await openBook(page, phone, "The Tracker Before the Storm", problems)) {
    const r0 = await R(page);
    if (r0.subject !== "science") problems.push(`reader subject ${r0.subject}`);
    const res = await readToEnd(
      page, phone, answersOf("6-8/adventure-sharks.story"),
      { ch2: 1, beacon: 1, "data-choice": 1 },
      (n) => (n === 0 ? "wrong-right" : "right"),
      { subject: "science", tag: "SCIENCE", grades: ["7"], hearts: true },
      problems, notes,
    );
    notes.push(`6-8: ${res.quizN} QUIZ gates, ${res.transmissions} transmissions`);
    if (res.quizN < 2) problems.push(`only ${res.quizN} QUIZ gates on the route`);
    if (res.transmissions < 1) problems.push("no checkpoint transmission");
    await noHScroll(page, problems, "reader");
    await report(page, problems, notes, [/quick challenges/, /transmissions/, /story gates/, /^(PS|LS|ESS)\.7\./]);
  }

  // ---- grade 4, MATH, the 4-5 shark book ----
  await page.goto(`${BASE}?grade=4&debug`);
  await page.waitForTimeout(700);
  await pickSubject(page, phone, "math", "MATH", problems);
  if (await openBook(page, phone, "Speckle and the Reef Rescue", problems)) {
    if (await page.locator(".pq-readhead .hearts").count()) problems.push("hearts shown at grade 4");
    const res = await readToEnd(
      page, phone, answersOf("4-5/adventure-sharks.story"),
      { start: 1, ch2: 1, "drop-off": 1, "net-haul": 1, follow: 0 },
      (n) => (n === 0 ? "reveal" : "right"),
      { subject: "math", tag: "MATH", grades: ["2", "3", "4", "5", "6"], hearts: false },
      problems, notes,
    );
    notes.push(`4-5: ${res.quizN} QUIZ gates, ${res.transmissions} transmissions`);
    if (res.quizN < 2) problems.push(`only ${res.quizN} QUIZ gates on the 4-5 route`);
    await report(page, problems, notes, [/quick challenges/, /^NC\.\d\./]);
  }

  // ---- the menu's ?topic= preselects a subject for the visit ----
  await page.goto(`${BASE}?grade=6&topic=science-mix&debug`);
  await page.waitForTimeout(600);
  const pre = await page.locator(".pq-subject.on").innerText();
  if (pre !== "SCIENCE") problems.push(`?topic=science-mix selected ${pre}`);
  notes.push(`?topic=science-mix → ${pre}`);

  if (errors.length) problems.push(...errors.map((e) => `page error: ${e}`));
  await ctx.close();
  console.log(`${problems.length ? "FAIL" : "PASS"} ${label}`);
  for (const n of notes) console.log(`   · ${n}`);
  for (const p of problems) console.log(`   ✘ ${p}`);
  return problems.length;
}

(async () => {
  let browser;
  try {
    browser = await chromium.launch();
  } catch {
    browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
  }
  let bad = 0;
  bad += await run(browser, false);
  bad += await run(browser, true);
  await browser.close();
  process.exit(bad ? 1 : 0);
})();
