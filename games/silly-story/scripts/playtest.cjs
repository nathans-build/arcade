/*
 * Automated playtest (dev only) of the BUILT game. Starts its own little static server on port 8804
 * (dist at /silly-story/, the arcade fonts at /fonts/), runs, then stops it. Needs a global Playwright:
 *   npm run build && node scripts/playtest.cjs        (SHOT=../../site/img/silly-story.png saves the cabinet picture)
 *
 * 1. Grade 1, cards only (no typing box): a wrong card gets a Grammar Coach note and isn't accepted, a card
 *    is picked with a number key, the rest by tapping; the reveal reads the story aloud and shows the scene.
 * 2. Grade 4 typing "Space Lunch": a wrong part of speech gets a hint and "Keep it anyway", a singular for a
 *    plural gets "Use tacos", a rude word is swapped for "banana", the scene shows the chosen modifiers
 *    (giant dancing alien, 4 green pizzas), "Save as picture" downloads a PNG, and the Story Shelf keeps it.
 * 3. Grade 8 typing "The Cafeteria Talent Show" with a pronoun-case hint.
 * 4. Write your own (grade 5): insert blanks with buttons, save, play it, and find it again after a reload.
 * 5. 390px and 360px phones: no sideways scroll on any screen, the word box stays on screen.
 * 6. Story length, grade 1: the K-2 picker offers All/Short/Medium (no Long); Medium shows only Medium stories
 *    and is remembered after a reload; a Medium story is filled with picture cards ("BLANK 1 OF 12").
 * 7. Story length, grade 7: Long is chosen and remembered; a Long story is typed all the way to the reveal
 *    (progress "BLANK n OF N", "Change my last word" goes back one); the reveal scrolls inside the story box;
 *    "Save as picture" makes a PNG tall enough for the whole story; the saved Long choice falls back to All on
 *    the K-2 tab; 9-12 Short shows its own Short story (no borrowing).
 * 8. A Long story on a 390px phone: no sideways scroll while picking, filling or reading it.
 * Fails on any console error, page error or request that leaves this machine.
 */
const path = require("path");
const fs = require("fs");
const http = require("http");
const { execSync } = require("child_process");
const { chromium } = require(path.join(execSync("npm root -g").toString().trim(), "playwright"));

const PORT = 8804;
const ROOT = path.resolve(__dirname, "..");
const DIST = path.join(ROOT, "dist");
const FONTS = path.resolve(ROOT, "../../site/fonts");
const BASE = `http://127.0.0.1:${PORT}/silly-story/`;
const SHOT = process.env.SHOT;

const TYPES = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".woff2": "font/woff2", ".json": "application/json", ".png": "image/png" };

function serve() {
  const server = http.createServer((req, res) => {
    const url = decodeURIComponent(req.url.split("?")[0]);
    let file = null;
    if (url.startsWith("/silly-story/")) file = path.join(DIST, url.slice("/silly-story/".length) || "index.html");
    else if (url.startsWith("/fonts/")) file = path.join(FONTS, url.slice("/fonts/".length));
    if (file && fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, "index.html");
    if (!file || !fs.existsSync(file)) {
      res.writeHead(url === "/favicon.ico" ? 204 : 404);
      return res.end();
    }
    res.writeHead(200, { "content-type": TYPES[path.extname(file)] || "application/octet-stream" });
    fs.createReadStream(file).pipe(res);
  });
  return new Promise((resolve) => server.listen(PORT, "127.0.0.1", () => resolve(server)));
}

const problems = [];
const note = (where, msg) => problems.push(`[${where}] ${msg}`);
const rot13 = (s) => s.replace(/[a-z]/g, (c) => String.fromCharCode(((c.charCodeAt(0) - 97 + 13) % 26) + 97));

function watch(page, errors) {
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  page.on("requestfailed", (r) => errors.push(`request failed: ${r.url()}`));
  page.on("request", (r) => {
    const u = r.url();
    if (!u.startsWith(`http://127.0.0.1:${PORT}`) && !u.startsWith("data:") && !u.startsWith("blob:")) errors.push(`external request: ${u}`);
  });
}

async function newPage(browser, opts = {}) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, acceptDownloads: true, ...opts });
  await ctx.addInitScript(() => {
    window.__spoken = [];
    if (window.speechSynthesis) {
      window.speechSynthesis.speak = (u) => window.__spoken.push(u.text);
      window.speechSynthesis.cancel = () => {};
    }
  });
  const page = await ctx.newPage();
  const errors = [];
  watch(page, errors);
  return { ctx, page, errors };
}

const noSideways = (page) => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 0.5);
const state = (page) => page.evaluate(() => window.__ss);
const spoken = (page) => page.evaluate(() => window.__spoken.join(" | "));

async function blankType(page) {
  return page.locator(".ss-fill").getAttribute("data-blank-type");
}

/** Taps through every blank with cards. */
async function fillWithCards(page, where, { keyFirst = false, wrongFirst = false } = {}) {
  let n = 0;
  let sawWrong = false;
  for (let guard = 0; guard < 20; guard++) {
    if (!(await page.locator(".ss-fill").count())) break;
    if (await page.locator(".ss-input").count()) note(where, "a typing box was shown in card mode");
    const cards = page.locator(".ss-cardbtn");
    const count = await cards.count();
    if (count < 3) note(where, `only ${count} cards`);
    if (wrongFirst && !sawWrong) {
      const bad = page.locator('.ss-cardbtn[data-fits="false"]');
      if (await bad.count()) {
        const before = (await state(page)).words.length;
        await bad.first().click();
        await page.waitForTimeout(150);
        if (!(await page.locator(".ss-coach").count())) note(where, "wrong card gave no Grammar Coach note");
        if ((await state(page)).words.length !== before) note(where, "a wrong card was accepted");
        sawWrong = true;
        await page.locator(".ss-coach .ss-btn").click();
      }
    }
    const good = page.locator('.ss-cardbtn[data-fits="true"]');
    if (keyFirst && n === 0) {
      const label = await good.first().getAttribute("aria-label");
      await page.keyboard.press(label.split(":")[0]);
    } else await good.first().click();
    n++;
    await page.waitForTimeout(120);
  }
  if (wrongFirst && !sawWrong) note(where, "never got to test a wrong card");
  return n;
}

/** Types the given words for each blank type (falls back to a generic word). */
async function fillTyped(page, where, wordFor) {
  let n = 0;
  for (let guard = 0; guard < 25; guard++) {
    if (!(await page.locator(".ss-fill").count())) break;
    const t = await blankType(page);
    const st = await state(page);
    const w = wordFor(t, n, st);
    const input = page.locator(".ss-input");
    if (!(await input.isVisible())) note(where, "typing box not visible");
    await input.fill(w);
    await input.press("Enter");
    await page.waitForTimeout(120);
    if (await page.locator(".ss-coach").count()) {
      // A precise-vocabulary blank may (rightly) ask for a more exact word than our sample.
      if (t !== "vocab") note(where, `unexpected coach hint for “${w}” (${t}): ${await page.locator(".ss-coach p").innerText()}`);
      await page.locator(".ss-coach .ss-btn", { hasText: "Keep it anyway" }).click();
    }
    n++;
  }
  return n;
}

const GOOD = {
  noun: "castle", "plural-noun": "pickles", verb: "dance", "verb-past": "jumped", "verb-ing": "spinning", adjective: "sparkly", color: "green",
  number: "three", adverb: "loudly", "pronoun-subject": "she", "pronoun-object": "them", preposition: "under", comparative: "sillier",
  superlative: "biggest", sound: "kaboom", simile: "like a rocket", vocab: "ambled",
};

async function grade1(browser) {
  const where = "grade 1 cards";
  const { ctx, page, errors } = await newPage(browser);
  await page.goto(`${BASE}?grade=1&debug`);
  await page.waitForSelector(".ss-title");
  if (!(await page.locator(".ss-gradebadge").innerText()).includes("GRADE 1")) note(where, "grade badge missing");
  if (await page.locator(".ss-grade").count()) note(where, "grade picker shown although ?grade= was given");
  if (!(await page.locator(".ss-tool", { hasText: "READ ON" }).count())) note(where, "read-aloud should default ON for K-2");
  if (await page.locator(".ss-btn", { hasText: "Write your own" }).count()) note(where, "write-your-own shown below grade 3");
  await page.locator(".ss-btn", { hasText: "How to play" }).click();
  if (!(await page.locator(".ss-help li").count())) note(where, "How to play didn't open");
  await page.locator(".ss-btn", { hasText: "Pick a story" }).click();
  if (!(await page.locator('.ss-tab[aria-selected="true"]').innerText()).includes("K")) note(where, "K-2 tab not selected");
  await page.locator('.ss-story[data-story="zoo-day"]').click();
  await page.waitForSelector(".ss-fill");
  await page.waitForTimeout(100);
  if (!(await spoken(page)).includes("Pick")) note(where, "prompt wasn't read aloud");
  await page.locator(".ss-hear").first().click();
  const n = await fillWithCards(page, where, { keyFirst: true, wrongFirst: true });
  await page.waitForSelector(".ss-reveal");
  const st = await state(page);
  if (st.words.length !== 9 || n !== 9) note(where, `filled ${st.words.length} words in ${n} picks`);
  const said = await spoken(page);
  if (!said.includes("A Day at the Zoo.") || !said.includes(st.words[1])) note(where, "the finished story wasn't read aloud");
  const scene = await page.evaluate(() => window.__ssScene);
  if (scene.actors.length < 3) note(where, `scene has ${scene.actors.length} characters`);
  const marks = await page.locator(".ss-storytext mark").count();
  if (marks !== 9) note(where, `${marks} highlighted words`);
  if (!(await noSideways(page))) note(where, "sideways scroll on reveal");
  await page.waitForTimeout(1500);
  if (errors.length) note(where, `errors: ${errors.join(" ; ")}`);
  await ctx.close();
}

async function grade4(browser) {
  const where = "grade 4 typing";
  const { ctx, page, errors } = await newPage(browser);
  await page.goto(`${BASE}?grade=4&debug`);
  if (await page.locator(".ss-tool", { hasText: "READ ON" }).count()) note(where, "read-aloud should default OFF above grade 2");
  await page.locator(".ss-btn", { hasText: "Pick a story" }).click();
  await page.locator('.ss-story[data-story="space-lunch"]').click();
  await page.waitForSelector(".ss-fill");
  if (!(await page.locator(".ss-cardbtn").count())) note(where, "grades 3-5 should also offer cards");
  const input = page.locator(".ss-input");
  // 1) noun blank: an adverb gets a hint; keep it anyway.
  if ((await blankType(page)) !== "noun") note(where, "first blank should be a noun");
  await input.fill("quickly");
  await input.press("Enter");
  await page.waitForSelector(".ss-coach");
  const msg = await page.locator(".ss-coach p").innerText();
  if (!/ADVERB/.test(msg) || !/noun/i.test(msg)) note(where, `coach message: ${msg}`);
  await page.locator(".ss-btn", { hasText: "Keep it anyway" }).click();
  // 2) plural noun: singular gets "Use tacos".
  await page.waitForTimeout(100);
  if ((await blankType(page)) !== "plural-noun") note(where, "second blank should be a plural noun");
  await input.fill("taco");
  await input.press("Enter");
  await page.waitForSelector(".ss-coach");
  await page.locator(".ss-btn", { hasText: "Use “tacos”" }).click();
  // 3) a rude word is quietly swapped (typed from the filter's encoded list).
  await page.waitForTimeout(100);
  await input.fill(rot13("penc") + "py");
  await input.press("Enter");
  await page.waitForTimeout(100);
  // Max length and allowed characters.
  await input.fill("abcdefghijklmnopqrstuvwxyz<>");
  const typed = await input.inputValue();
  if (typed.length > 20 || /[<>]/.test(typed)) note(where, `input allowed “${typed}”`);
  await input.fill("");
  const words = { "verb-past": ["zoomed", "danced"], adjective: ["giant"], adverb: ["slowly", "happily"], number: ["4"], color: ["green"], "plural-noun": ["pizzas"], "verb-ing": ["giggling"] };
  const used = {};
  await fillTyped(page, where, (t) => {
    used[t] = (used[t] || 0) + 1;
    return (words[t] && words[t][used[t] - 1]) || GOOD[t];
  });
  await page.waitForSelector(".ss-reveal");
  const st = await state(page);
  if (st.words[0] !== "quickly") note(where, "kept word missing");
  if (st.words[1] !== "tacos") note(where, "suggested plural not used");
  if (st.words[2] !== "banana") note(where, `rude word not swapped (got ${st.words[2]})`);
  const scene = await page.evaluate(() => window.__ssScene);
  const alien = scene.actors.find((a) => a.sprite.id === "alien");
  if (!alien || alien.anim !== "dance" || !(alien.scale > 1.2)) note(where, `alien should be giant and dancing: ${JSON.stringify(alien && { anim: alien.anim, scale: alien.scale })}`);
  const pizzas = scene.actors.find((a) => a.sprite.id === "pizza");
  if (!pizzas || pizzas.count !== 4 || pizzas.color !== "#3fbf4f" || pizzas.anim !== "laugh") note(where, `pizzas should be 4, green, giggling: ${JSON.stringify(pizzas && { count: pizzas.count, color: pizzas.color, anim: pizzas.anim })}`);
  const legend = await page.locator(".ss-legend").innerText();
  if (!/GIANT/.test(legend) || !/turned it green/.test(legend) || !/dancing/.test(legend)) note(where, "legend doesn't explain the modifiers");
  const read = page.locator(".ss-btn", { hasText: "Read it to me" });
  await read.click();
  if (!(await spoken(page)).includes("Space Lunch")) note(where, "Read it to me didn't speak");
  // Save as picture → PNG download.
  const [dl] = await Promise.all([page.waitForEvent("download", { timeout: 10000 }), page.locator(".ss-btn", { hasText: "Save as picture" }).click()]);
  const file = await dl.path();
  const buf = fs.readFileSync(file);
  if (!dl.suggestedFilename().endsWith(".png") || buf.slice(1, 4).toString() !== "PNG" || buf.length < 5000) note(where, `bad picture download ${dl.suggestedFilename()} (${buf.length} bytes)`);
  // Story Shelf.
  await page.locator(".ss-btn", { hasText: "Save to Story Shelf" }).click();
  if (!(await page.locator(".ss-btn", { hasText: "On your shelf" }).count())) note(where, "shelf save didn't confirm");
  const shelf = await page.evaluate(() => JSON.parse(localStorage.getItem("arcade.silly-story.shelf.v1") || "[]"));
  if (shelf.length !== 1 || shelf[0].words[1] !== "tacos") note(where, "shelf not saved under arcade.silly-story.");
  await page.locator(".ss-btn", { hasText: "Title screen" }).click();
  await page.locator(".ss-btn", { hasText: "Story Shelf (1)" }).click();
  await page.locator(".ss-list .ss-btn", { hasText: "Open" }).click();
  await page.waitForSelector(".ss-reveal");
  if (!(await page.locator(".ss-storytext").innerText()).includes("tacos")) note(where, "shelf story didn't reopen");
  if (SHOT) {
    await page.waitForTimeout(2200);
    const data = await page.evaluate(() => {
      const src = document.querySelector(".ss-scene");
      const cv = document.createElement("canvas");
      cv.width = 640;
      cv.height = 400;
      const c = cv.getContext("2d");
      c.imageSmoothingEnabled = false;
      c.drawImage(src, 0, 0, 640, 400);
      return cv.toDataURL("image/png");
    });
    fs.writeFileSync(path.resolve(ROOT, SHOT), Buffer.from(data.split(",")[1], "base64"));
  }
  if (errors.length) note(where, `errors: ${errors.join(" ; ")}`);
  await ctx.close();
}

async function grade8(browser) {
  const where = "grade 8 typing";
  const { ctx, page, errors } = await newPage(browser);
  await page.goto(`${BASE}?grade=8&debug`);
  await page.locator(".ss-btn", { hasText: "Pick a story" }).click();
  if (!(await page.locator('.ss-tab[aria-selected="true"]').innerText()).includes("6")) note(where, "6-8 tab not selected");
  await page.locator('.ss-story[data-story="talent-show"]').click();
  await page.waitForSelector(".ss-fill");
  if (await page.locator(".ss-cardbtn").count()) note(where, "grade 8 should type, not tap cards");
  let pronounHint = false;
  for (let guard = 0; guard < 20; guard++) {
    if (!(await page.locator(".ss-fill").count())) break;
    const t = await blankType(page);
    const std = await page.locator(".ss-std").innerText();
    if (!/L\.(6|8)\.1/.test(std)) note(where, `standard tag “${std}”`);
    const input = page.locator(".ss-input");
    if (t === "pronoun-subject" && !pronounHint) {
      await input.fill("him");
      await input.press("Enter");
      await page.waitForSelector(".ss-coach");
      await page.locator(".ss-btn", { hasText: "Use “he”" }).click();
      pronounHint = true;
    } else {
      await input.fill(GOOD[t]);
      await input.press("Enter");
    }
    await page.waitForTimeout(100);
    if (await page.locator(".ss-coach").count()) {
      note(where, `unexpected hint for ${t}`);
      await page.locator(".ss-btn", { hasText: "Keep it anyway" }).click();
    }
  }
  await page.waitForSelector(".ss-reveal");
  if (!pronounHint) note(where, "no pronoun blank");
  const text = await page.locator(".ss-storytext").innerText();
  if (!text.includes("He promised")) note(where, "pronoun not capitalized at sentence start");
  if (errors.length) note(where, `errors: ${errors.join(" ; ")}`);
  await ctx.close();
}

async function writeYourOwn(browser) {
  const where = "write your own";
  const { ctx, page, errors } = await newPage(browser);
  await page.goto(`${BASE}?grade=5&debug`);
  await page.locator(".ss-btn", { hasText: "Write your own" }).click();
  await page.locator(".ss-label input").fill("Test Tale");
  await page.locator(".ss-label select").selectOption("beach");
  const ta = page.locator(".ss-textarea");
  await ta.fill("The ");
  await ta.press("End");
  await page.locator('.ss-chip[data-token="[adjective]"]').click();
  await page.locator('.ss-chip[data-token="[noun:animal]"]').click();
  await ta.press("End");
  await ta.type(" likes to");
  await page.locator('.ss-chip[data-token="[verb]"]').click();
  await ta.press("End");
  await ta.type(".");
  const tpl = await ta.inputValue();
  if (tpl !== "The [adjective] [noun:animal] likes to [verb].") note(where, `template built as “${tpl}”`);
  if (!(await page.locator(".ss-check.ok").count())) note(where, "template check not OK");
  await page.locator(".ss-btn", { hasText: "Save" }).first().click();
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("arcade.silly-story.custom.v1") || "[]"));
  if (saved.length !== 1 || saved[0].title !== "Test Tale") note(where, "story not saved on the device");
  await page.locator(".ss-btn", { hasText: "Pass to a friend" }).click();
  await page.locator(".ss-btn", { hasText: "I'm the friend" }).click();
  await fillTyped(page, where, (t) => ({ adjective: "spotted", noun: "giraffe", verb: "spin" })[t] || GOOD[t]);
  await page.waitForSelector(".ss-reveal");
  const text = await page.locator(".ss-storytext").innerText();
  if (text.trim() !== "The spotted giraffe likes to spin.") note(where, `reveal text “${text}”`);
  const scene = await page.evaluate(() => window.__ssScene);
  if (scene.bg !== "beach" || scene.actors[0].sprite.id !== "giraffe" || !scene.actors[0].spotted || scene.actors[0].anim !== "spin") note(where, "custom scene doesn't match");
  await page.reload();
  await page.locator(".ss-btn", { hasText: "Pick a story" }).click();
  if (!(await page.locator(".ss-story.mine", { hasText: "Test Tale" }).count())) note(where, "saved story not listed after reload");
  if (errors.length) note(where, `errors: ${errors.join(" ; ")}`);
  await ctx.close();
}

async function phone(browser, width, grade) {
  const where = `${width}px phone grade ${grade}`;
  const { ctx, page, errors } = await newPage(browser, { viewport: { width, height: 760 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
  await page.goto(`${BASE}?grade=${grade}&debug`);
  await page.waitForSelector(".ss-title");
  const check = async (what) => {
    if (!(await noSideways(page))) note(where, `sideways scroll on ${what}`);
  };
  await check("title");
  await page.locator(".ss-btn", { hasText: "Pick a story" }).tap();
  await check("story list");
  await page.locator(".ss-story").first().tap();
  await page.waitForSelector(".ss-fill");
  await check("fill");
  if (Number(grade) >= 3) {
    const input = page.locator(".ss-input");
    await input.tap();
    await page.waitForTimeout(400);
    const box = await input.boundingBox();
    if (!box || box.y < 0 || box.y + box.height > 760 * 0.55) note(where, `word box sits at y=${box && Math.round(box.y)} (the keyboard would cover it)`);
    await fillTyped(page, where, (t) => GOOD[t]);
  } else {
    const card = await page.locator(".ss-cardbtn").first().boundingBox();
    if (!card || card.height < 90 || card.width < 120) note(where, `cards too small for little fingers (${card && Math.round(card.width)}×${card && Math.round(card.height)})`);
    for (let guard = 0; guard < 20 && (await page.locator(".ss-fill").count()); guard++) {
      await page.locator('.ss-cardbtn[data-fits="true"]').first().tap();
      await page.waitForTimeout(100);
    }
  }
  await page.waitForSelector(".ss-reveal");
  await page.waitForTimeout(1500);
  await check("reveal");
  if (Number(grade) >= 3) {
    await page.goto(`${BASE}?grade=${grade}&debug`);
    await page.locator(".ss-btn", { hasText: "Write your own" }).tap();
    await check("write your own");
  }
  if (errors.length) note(where, `errors: ${errors.join(" ; ")}`);
  await ctx.close();
}


/** Reads width and height from a PNG file's header. */
function pngSize(buf) {
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}

async function lengthChips(page) {
  return page.locator(".ss-len").evaluateAll((els) => els.map((e) => `${e.getAttribute("data-length")}${e.getAttribute("aria-checked") === "true" ? "*" : ""}`).join(","));
}

async function grade1Medium(browser) {
  const where = "grade 1 medium";
  const { ctx, page, errors } = await newPage(browser);
  await page.goto(`${BASE}?grade=1&debug`);
  await page.locator(".ss-btn", { hasText: "Pick a story" }).click();
  let chips = await lengthChips(page);
  if (chips !== "all*,short,medium") note(where, `K-2 length chips “${chips}” (want All/Short/Medium, All on)`);
  await page.locator('.ss-len[data-length="medium"]').click();
  const lens = await page.locator(".ss-story").evaluateAll((els) => els.map((e) => e.getAttribute("data-length")));
  if (lens.length < 2 || lens.some((l) => l !== "medium")) note(where, `Medium filter shows ${lens.join(",")}`);
  const saved = await page.evaluate(() => localStorage.getItem("arcade.silly-story.length.v1"));
  if (saved !== "medium") note(where, `length not saved (got ${saved})`);
  await page.reload();
  await page.locator(".ss-btn", { hasText: "Pick a story" }).click();
  chips = await lengthChips(page);
  if (chips !== "all,short,medium*") note(where, `Medium not remembered after reload (${chips})`);
  await page.locator('.ss-story[data-story="bubble-bath"]').click();
  await page.waitForSelector(".ss-fill");
  const prog = await page.locator(".ss-progress").innerText();
  if (!/BLANK 1 OF 12/.test(prog)) note(where, `progress reads “${prog}”`);
  const n = await fillWithCards(page, where, { wrongFirst: true });
  await page.waitForSelector(".ss-reveal");
  const st = await state(page);
  if (st.words.length !== 12 || n !== 12) note(where, `filled ${st.words.length} words in ${n} picks`);
  if ((await page.locator(".ss-storytext mark").count()) !== 12) note(where, "not every word highlighted");
  const scene = await page.evaluate(() => window.__ssScene);
  if (scene.bg !== "bathroom" || !scene.actors.some((a) => a.sprite.id === "rubberduck")) note(where, "bubble bath scene missing its duck");
  await page.waitForTimeout(1200);
  if (errors.length) note(where, `errors: ${errors.join(" ; ")}`);
  await ctx.close();
}

async function grade7Long(browser) {
  const where = "grade 7 long";
  const { ctx, page, errors } = await newPage(browser);
  await page.goto(`${BASE}?grade=7&debug`);
  await page.locator(".ss-btn", { hasText: "Pick a story" }).click();
  if ((await lengthChips(page)) !== "all*,short,medium,long") note(where, `6-8 chips “${await lengthChips(page)}”`);
  await page.locator('.ss-len[data-length="long"]').click();
  const ids = await page.locator(".ss-story").evaluateAll((els) => els.map((e) => `${e.getAttribute("data-story")}:${e.getAttribute("data-length")}`));
  if (ids.length < 2 || ids.some((x) => !x.endsWith(":long"))) note(where, `Long filter shows ${ids.join(",")}`);
  await page.locator('.ss-story[data-story="robot-referee"]').click();
  await page.waitForSelector(".ss-fill");
  const total = (await state(page)).play.parsed.blanks.length;
  if (total < 15 || total > 22) note(where, `Long story has ${total} blanks`);
  if (await page.locator(".ss-cardbtn").count()) note(where, "grade 7 should type, not tap cards");
  let undone = false;
  let sawProgress = false;
  for (let guard = 0; guard < 40; guard++) {
    if (!(await page.locator(".ss-fill").count())) break;
    const i = Number(await page.locator(".ss-progress").getAttribute("aria-valuenow")) - 1;
    const prog = await page.locator(".ss-progress").innerText();
    if (!prog.includes(`BLANK ${i + 1} OF ${total}`)) note(where, `progress “${prog}” at blank ${i + 1}`);
    if (i === 6) sawProgress = true;
    if (!(await page.locator(".ss-progress .bar").count())) note(where, "long story should show a progress bar");
    const t = await blankType(page);
    const input = page.locator(".ss-input");
    if (i === 3 && !undone) {
      // Type a word, then change it.
      await input.fill("oops");
      await input.press("Enter");
      await page.waitForTimeout(120);
      if (await page.locator(".ss-coach").count()) await page.locator(".ss-btn", { hasText: "Keep it anyway" }).click();
      await page.waitForTimeout(80);
      await page.locator(".ss-undo").click();
      await page.waitForTimeout(80);
      if (!(await page.locator(".ss-progress").innerText()).includes(`BLANK 4 OF ${total}`)) note(where, "Change my last word didn't go back one blank");
      undone = true;
      continue;
    }
    await input.fill(GOOD[t]);
    await input.press("Enter");
    await page.waitForTimeout(90);
    if (await page.locator(".ss-coach").count()) {
      note(where, `unexpected hint for ${t}`);
      await page.locator(".ss-btn", { hasText: "Keep it anyway" }).click();
    }
  }
  await page.waitForSelector(".ss-reveal");
  if (!sawProgress) note(where, "never reached blank 7");
  const st = await state(page);
  if (st.words.length !== total || st.words.includes("oops")) note(where, `reveal has ${st.words.length}/${total} words (${st.words.join(",")})`);
  if ((await page.locator(".ss-storytext mark").count()) !== total) note(where, "not every word highlighted");
  const box = await page.locator(".ss-storytext").evaluate((el) => ({ long: el.classList.contains("long"), sh: el.scrollHeight, ch: el.clientHeight, ov: getComputedStyle(el).overflowY }));
  if (!box.long || box.ov !== "auto") note(where, `story box isn't a scrolling panel ${JSON.stringify(box)}`);
  await page.setViewportSize({ width: 1280, height: 600 });
  await page.waitForTimeout(100);
  const box2 = await page.locator(".ss-storytext").evaluate((el) => ({ sh: el.scrollHeight, ch: el.clientHeight }));
  if (!(box2.sh > box2.ch)) note(where, `long story should scroll inside its box (${box2.sh} vs ${box2.ch})`);
  await page.locator(".ss-storytext").evaluate((el) => el.scrollTo(0, el.scrollHeight));
  if (!(await noSideways(page))) note(where, "sideways scroll on reveal");
  const read = page.locator(".ss-btn", { hasText: "Read it to me" });
  await read.click();
  const said = await spoken(page);
  if (!said.includes("Robot Referee") || !said.includes("Wombats won")) note(where, "Read it to me didn't read the whole long story");
  const [dl] = await Promise.all([page.waitForEvent("download", { timeout: 10000 }), page.locator(".ss-btn", { hasText: "Save as picture" }).click()]);
  const buf = fs.readFileSync(await dl.path());
  const size = buf.slice(1, 4).toString() === "PNG" ? pngSize(buf) : null;
  if (!dl.suggestedFilename().endsWith(".png") || !size) note(where, `bad picture download ${dl.suggestedFilename()}`);
  const comic = await page.evaluate(() => window.__ssComic);
  if (!comic || !size || comic.height !== size.height || size.width !== 688) note(where, `picture size mismatch ${JSON.stringify({ comic, size })}`);
  // Taller than a short story's picture, a smaller font, and room below the text for every line.
  else if (comic.fontPx >= 26 || comic.lines < 14 || size.height < comic.textTop + comic.lines * comic.lineH + 24) note(where, `long-story picture doesn't fit its text ${JSON.stringify(comic)}`);
  // The choice is remembered; the K-2 tab falls back to All; 9-12 Short borrows 6-8 Short stories.
  await page.goto(`${BASE}?grade=7&debug`);
  await page.locator(".ss-btn", { hasText: "Pick a story" }).click();
  if ((await lengthChips(page)) !== "all,short,medium,long*") note(where, `Long not remembered (${await lengthChips(page)})`);
  await page.locator(".ss-tab", { hasText: "K–2" }).click();
  if ((await lengthChips(page)) !== "all*,short,medium") note(where, `K-2 tab should fall back to All (${await lengthChips(page)})`);
  await page.locator(".ss-tab", { hasText: "9–12" }).click();
  if ((await lengthChips(page)) !== "all,short,medium,long*") note(where, "9-12 tab should use the saved Long");
  await page.locator('.ss-len[data-length="short"]').click();
  if (await page.locator(".ss-borrow").count()) note(where, "9-12 Short should have its own story, not borrow");
  const shorts = await page.locator(".ss-story").evaluateAll((els) => els.map((e) => `${e.getAttribute("data-story")}:${e.getAttribute("data-length")}`));
  if (shorts.join(",") !== "pet-rock-audition:short") note(where, `9-12 Short list ${shorts.join(",")}`);
  const savedNow = await page.evaluate(() => localStorage.getItem("arcade.silly-story.length.v1"));
  if (savedNow !== "short") note(where, "length choice not saved");
  if (errors.length) note(where, `errors: ${errors.join(" ; ")}`);
  await ctx.close();
}

async function phoneLong(browser) {
  const where = "390px phone long story";
  const { ctx, page, errors } = await newPage(browser, { viewport: { width: 390, height: 760 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
  await page.goto(`${BASE}?grade=10&debug`);
  await page.locator(".ss-btn", { hasText: "Pick a story" }).tap();
  await page.locator('.ss-len[data-length="long"]').tap();
  if (!(await noSideways(page))) note(where, "sideways scroll on the story list");
  await page.locator('.ss-story[data-story="lighthouse-week"]').tap();
  await page.waitForSelector(".ss-fill");
  if (!(await noSideways(page))) note(where, "sideways scroll while filling");
  await fillTyped(page, where, (t) => GOOD[t]);
  await page.waitForSelector(".ss-reveal");
  await page.waitForTimeout(800);
  if (!(await noSideways(page))) note(where, "sideways scroll on the reveal");
  const box = await page.locator(".ss-storytext").evaluate((el) => ({ sh: el.scrollHeight, ch: el.clientHeight, w: el.getBoundingClientRect().right }));
  if (!(box.sh > box.ch) || box.w > 390) note(where, `story box ${JSON.stringify(box)}`);
  if (errors.length) note(where, `errors: ${errors.join(" ; ")}`);
  await ctx.close();
}

(async () => {
  if (!fs.existsSync(path.join(DIST, "index.html"))) throw new Error("Run npm run build first.");
  const server = await serve();
  const browser = await chromium.launch();
  try {
    await grade1(browser);
    await grade4(browser);
    await grade8(browser);
    await writeYourOwn(browser);
    await phone(browser, 390, "1");
    await phone(browser, 390, "6");
    await phone(browser, 360, "4");
    await phone(browser, 360, "10");
    await grade1Medium(browser);
    await grade7Long(browser);
    await phoneLong(browser);
  } catch (e) {
    problems.push(`crashed: ${e && e.stack ? e.stack : e}`);
  } finally {
    await browser.close();
    await new Promise((r) => server.close(r));
  }
  if (problems.length) {
    console.error(problems.map((p) => `PROBLEM ${p}`).join("\n"));
    process.exit(1);
  }
  console.log(`Playtest passed${SHOT ? ` (saved ${SHOT})` : ""}.`);
})();
