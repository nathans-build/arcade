/*
 * Dojo Tower: Rates & Percents checks:   npm test   (npx tsx scripts/check-rules.ts)
 * 1. The Math 6 · Unit 3 question generators (src/dojo/unit3.ts), thousands of questions per section:
 *    every answer recomputed independently from the question's inputs; 4 unique choices with the right
 *    one present; feedback that names a mistake for every wrong choice; two-stage hints; the 18 skill
 *    tags (exact names) all produced; money always with 2 decimals; no negative numbers; nothing out of
 *    scope (docs/math6-unit3.md section 10); percents include 6/12/35 and over 100%; fractions in batch
 *    items; at least 1 in 4 two-step items in a full climb; conversions both directions about equally.
 * 2. COMBO story problems: every chain's steps recompute to its final answer, the last step asks the
 *    final answer again, each step keeps its own skill tag, and the final question's wrong choices
 *    include every intermediate step value (Paint the Room: every intermediate in dollars, plus the
 *    cheap-per-gallon trap; its area and gallon steps are in other units).
 * 3. The boss-quiz rules (wrong answers never hurt, BIG COMBO, the master hangs on until a combo's last step).
 * 4. The simulation, played headlessly (from Dojo Tower): punches, kicks, ducks, jumps, scrolls, Thunder
 *    Kick, lives, every floor of the full climb, ink stars; plus the practice plans and the retry round.
 * 5. Floors and masters, the attempt log (cap, CSV/JSON export fields) and a privacy scan of src/.
 */
import * as fs from "fs";
import * as path from "path";
import {
  CHAINS, CLEAN_SPEEDS, COMBO_KINDS, COST_ITEMS, FACTS, FRAC_FACTS, KIND_IDS, KIND_META, NAMES, PAINT_STEPS, SKILL_TAGS, UNIT_PAIRS,
  cheapestBuy, fmtNum, gallonsNeeded, generate, kindsForTag, makeCombo, money, newRoom, niceRate, paintArea, roundDiv, stats, tagName, wallArea,
  type Combo, type KindId, type Room, type U3Question,
} from "../src/dojo/unit3";
import { U3Deck } from "../src/dojo/u3deck";
import { ALL_BOSSES, FLOORS_ALL, PRACTICES, practicePlan, retryPlan, type FloorPlan } from "../src/dojo/bosses";
import { THEMES } from "../src/dojo/floors";
import { ATTEMPT_LOG_MAX, EXPORT_FIELDS, LOG_KEY, PRACTICE_KEY, loadAttempts, loadPractice, saveAttempts, savePractice, tagRows, toCSV, toJSON, type Attempt } from "../src/dojo/attempts";
import { type Band } from "../src/dojo/qmake";
import {
  COMBO_BONUS, FLOORS, METER_MAX, STAR_BURST, STAR_COOLDOWN, STAR_GOAL, applyAnswer, newFight, newStreak, onThrowerDefeated, resolveBossAnswer, spendThunder,
} from "../src/dojo/rules";
import { DojoSim, GROUND, MAX_ENERGY, START_LIVES, type SimEvent } from "../src/dojo/sim";

/** Words that must never appear (the player's real first name and a school program name), built from char codes so this file passes its own scan. */
const BANNED_NAME = String.fromCharCode(78, 97, 116, 104, 97, 110);
const BANNED_WORD = String.fromCharCode(65, 73, 77);
const BANNED_IN_TEXT = new RegExp(`\\b(Andre|Lin|${BANNED_NAME})\\b|\\b${BANNED_WORD}\\b`);

let failures = 0;
let checks = 0;
function check(cond: boolean, msg: () => string) {
  checks++;
  if (!cond) {
    failures++;
    if (failures <= 80 || process.env.ALLFAILS) console.error("FAIL:", msg());
  }
}

let seed = 12345;
const rand = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);

/* ------------------------------------------------------------ 1. generators */

const BANDS: Band[] = ["k2", "g35", "g68", "hs"];
const unitName = (u: string, v: number) => (u === "cups" && v === 1 ? "cup" : u);
const near = (a: number, b: number) => Math.abs(a - b) < 1e-6;

/** Independent answer for each kind, from the question's inputs only. */
function expected(q: U3Question): string {
  const d = q.data as Record<string, number> & Record<string, string>;
  const N = (k: string) => Number(d[k]);
  switch (q.kind) {
    case "washTime": return `${fmtNum((N("N") / N("w")) * N("m"))} min`;
    case "washHours": return `${fmtNum(((N("N") / N("w")) * N("m")) / 60)} hours`;
    case "towerHeight": return `${fmtNum(N("F") * N("h"))} m`;
    case "elevator": return `${fmtNum(800 / N("r"))} seconds`;
    case "crewCost": return money((N("N") / N("k")) * N("c") * 100);
    case "stairs": return `${fmtNum((N("H") * 100) / N("s"))} steps`;
    case "unitAnchor": {
      const ANS: Record<string, string> = {
        "About how wide is your thumb?": "1 inch", "About how wide is a classroom door?": "1 meter", "About how heavy is a 1-liter bottle of water?": "1 kilogram",
        "About how much does the big jug of milk at the store hold?": "1 gallon", "About how long is a school bus?": "12 meters", "About how heavy is a paper clip?": "1 gram",
        "About how far can you walk in 20 minutes?": "1 mile", "Which unit fits the length of a pencil?": "centimeters", "Which unit fits the distance to the next town?": "kilometers",
        "Which unit fits the weight of a large dog?": "pounds", "Which unit fits the water in a bathtub?": "gallons",
      };
      return ANS[q.prompt] ?? "?";
    }
    case "biggerNumber": return `The number of ${UNIT_PAIRS[N("pair")][0]}`;
    case "moreOrFewer": {
      const F = [[3, "ft"], [12, "in"], [100, "cm"], [16, "oz"], [4, "qt"]][N("pair")] as [number, string];
      return `More: ${fmtNum(N("n") * F[0])} ${F[1]}`;
    }
    case "convert": {
      const F = FACTS[N("fact")];
      if (q.dir === "toSmaller") { const v = N("v") * F.f; return `${fmtNum(v)} ${unitName(F.small, v)}`; }
      const v = N("s") / F.f;
      return `${fmtNum(v)} ${unitName(F.big, v)}`;
    }
    case "convert2": {
      const C = CHAINS[N("chain")];
      if (q.dir === "toSmaller") { const v = N("v") * C.f1 * C.f2; return `${fmtNum(v)} ${unitName(C.small, v)}`; }
      return `${fmtNum(N("s") / (C.f1 * C.f2))} ${C.big}`;
    }
    case "convertFrac": {
      const F = FRAC_FACTS[N("fact")];
      if (q.dir === "toSmaller") { const v = (N("num") * F.f) / N("den"); return `${fmtNum(v)} ${unitName(F.small, v)}`; }
      return `${niceRate(N("num"), N("den"))} ${F.big}`;
    }
    case "unitCost": {
      const I = COST_ITEMS[N("item")];
      return q.dir === "toSmaller" ? money(N("n") * I.f * N("p")) : money(Math.round((N("s") / I.f) * N("p")));
    }
    case "whoFaster": {
      const a = N("d1") / N("t1"), b = N("d2") / N("t2");
      return near(a, b) ? "They're the same speed" : a > b ? d.A : d.B;
    }
    case "betterDeal": {
      const a = N("p1") / N("s1"), b = N("p2") / N("s2");
      return near(a, b) ? "Same price per ounce" : a < b ? `${N("s1")} oz for ${money(N("p1"))}` : `${N("s2")} oz for ${money(N("p2"))}`;
    }
    case "unitPriceRound": return money(Math.round(N("P") / N("n") + 1e-9));
    case "twoRates": {
      if (d.style === "money") return d.ask === "ab" ? `${money(N("uC"))} per lb` : `${niceRate(100, N("uC"))} lb`;
      const [n, m] = d.ask === "ab" ? [N("a"), N("b")] : [N("b"), N("a")];
      const lbl = d.style === "recipe" ? (d.ask === "ab" ? "cups of flour" : "cups of sugar") : d.ask === "ab" ? "laps" : "minutes";
      return `${niceRate(n, m)} ${lbl}`;
    }
    case "sameRate": {
      const r1 = N("a") / N("b"), r2 = N("c") / N("d");
      return near(r1, r2) ? "Yes, it's the same rate" : r1 > r2 ? "No: the first" : "No: the second";
    }
    case "paceCompare": {
      const pb = 60 / N("s");
      return near(pb, N("p")) ? "Same speed" : pb < N("p") ? d.B : d.A;
    }
    case "speedToPace": return `${fmtNum(60 / N("s"))} min per mile`;
    case "paceToSpeed": return `${fmtNum(60 / N("p"))} mph`;
    case "fastestPace": return `${fmtNum(Math.min(...String(d.ps).split(",").map(Number)))} min per mile`;
    case "unitThenTotal": return money((N("P") / N("n")) * N("m"));
    case "roundAtEnd": return money(Math.round((N("P") * N("m")) / N("n") + 1e-9));
    case "timeForDistance": return `${fmtNum(N("D") / (N("d") / N("t")))} hours`;
    case "recipeBatch": return `${fmtNum((N("c") * N("num")) / N("den"))} `;
    case "cookieScale": return `${niceRate(N("c") * N("K"), N("kk"))} cups`;
    case "gasOp": return `${fmtNum(N("D") / (N("d") / N("g")))} gal`;
    case "percentMeaning": return `${N("P")} for every 100`;
    case "ticketPercent": return money((N("w") * 100 * N("P")) / 100);
    case "outOf": return `${fmtNum((N("a") / N("b")) * 100)}%`;
    case "dnlPart": { const v = (N("W") * N("P")) / 100; return d.u === "$" ? money(v * 100) : `${fmtNum(v)} ${d.u}`; }
    case "dnlWhole": return `${fmtNum((N("part") * 100) / N("P"))} ${d.u}`;
    case "tapeWhole": return `${fmtNum((N("part") * 100) / N("P"))} `;
    case "tapePart": return fmtNum((N("W") * N("P")) / 100);
    case "benchmark": return fmtNum((N("W") * N("P")) / 100);
    case "findPart": return N("money") ? money(Math.round((N("Wc") * N("P")) / 100 + 1e-9)) : fmtNum((N("W") * N("P")) / 100);
    case "findWhole": { const v = (N("part") * 100) / N("P"); return N("money") ? money(v * 100) : fmtNum(v); }
    case "findPercent": return `${fmtNum((N("a") / N("b")) * 100)}%`;
    case "discount": return money(N("price") - Math.round((N("price") * N("P")) / 100 + 1e-9));
    case "tax": case "tip": return money(N("price") + Math.round((N("price") * N("P")) / 100 + 1e-9));
    case "paintWalls": return `${fmtNum(2 * (N("L") + N("W")) * N("H"))} sq ft`;
    case "paintSubtract": return `${fmtNum(2 * (N("L") + N("W")) * N("H") - N("doorW") * N("doorH") - N("windows") * N("winW") * N("winH"))} sq ft`;
    case "paintGallons": return `${indepGallons(d)} gallons`;
    case "paintBuy": { const G = indepGallons(d); return `${G} cans for ${money(G * N("canC"))}`; }
    case "paintTax": case "comboPaint": { const T = indepGallons(d) * N("canC"); return money(T + Math.round((T * N("taxP")) / 100 + 1e-9)); }
    case "copier": return `${fmtNum((N("len") * N("P")) / 100)} cm`;
    case "enlargedBy": return `${fmtNum((N("w") * (100 + N("p"))) / 100)} cm`;
    case "areaScale": return `${fmtNum(N("A") * (N("P") / 100) ** 2)} sq in`;
    case "reverseCopy": return `${fmtNum((N("c") * 100) / N("P"))} cm`;
    case "scaleRatio": return `1 : ${12 * N("n")}`;
    case "comboDeal": return money(Math.min(N("P1") / N("n1"), N("P2") / N("n2")) * N("m"));
    case "comboRunner": return `${fmtNum(Math.abs(N("p") * N("d") - (60 / N("s")) * N("d")))} min`;
    case "comboTank": { const whole = (N("part") * 100) / N("P"); return `${fmtNum(whole - N("part"))} `; }
    case "comboShop": {
      const cost = (N("P") / N("n")) * N("m");
      const sale = cost - Math.round((cost * N("D")) / 100 + 1e-9);
      return money(sale + Math.round((sale * N("T")) / 100 + 1e-9));
    }
  }
}

function indepGallons(d: Record<string, number | string>): number {
  const n = (k: string) => Number(d[k]);
  const area = 2 * (n("L") + n("W")) * n("H") - n("doorW") * n("doorH") - n("windows") * n("winW") * n("winH");
  return Math.ceil((area * n("coats")) / n("cover"));
}

function matches(q: U3Question, ans: string, exp: string): boolean {
  return q.kind === "sameRate" ? ans.startsWith(exp) : ans === exp || (exp.endsWith(" ") && ans.startsWith(exp));
}

const OUT_OF_SCOPE = /\bnegative\b|\binteger|\bvariable|equation|\bx\s*=|=\s*x\b|percent (increase|decrease)|interest|markup|mark-up|proportional relationship|constant of proportionality|\bk\s*=/i;
const MONEY_STRICT = /\$\d{1,3}(,\d{3})*\.\d{2}(?![\d])/;
const MONEY_ANY = /\$[\d,]*\.?\d*/g;

function allText(q: U3Question): string[] {
  return [q.prompt, ...q.choices, ...q.hints, ...q.feedback, q.explanation];
}

const seenTags = new Set<number>();
let twoStepFromKinds = 0;
const percentsSeen = new Set<number>();
let fractionBatch = 0;

function checkQuestion(q: U3Question, where: string, opts: { comboStep?: boolean } = {}) {
  const w = () => `${where} [${q.kind}] "${q.prompt.slice(0, 70)}"`;
  check(Array.isArray(q.choices) && q.choices.length === 4, () => `${w()}: needs 4 choices`);
  check(new Set(q.choices.map((c) => c.toLowerCase())).size === 4, () => `${w()}: choices not unique: ${q.choices.join(" | ")}`);
  check(q.choices.every((c) => c.trim().length > 0 && c === c.trim()), () => `${w()}: empty choice`);
  check(Number.isInteger(q.answer) && q.answer >= 0 && q.answer < 4, () => `${w()}: bad answer index`);
  check(q.feedback.length === 4 && q.feedback.every((f, i) => (i === q.answer ? f === "" : f.trim().length >= 12)), () => `${w()}: every wrong choice needs feedback naming the mistake`);
  check(q.hints.length === 2 && q.hints.every((h) => h.trim().length >= 10) && q.hints[0] !== q.hints[1], () => `${w()}: two different hint stages`);
  const ans = q.choices[q.answer];
  const ansRe = new RegExp(`(^|[^\\d.,$])${ans.replace(/[.*+?^${}()|[\]\\$]/g, "\\$&")}(?![\\d])`);
  if (ans.length >= 4 && /\d/.test(ans)) check(!q.hints.some((h) => ansRe.test(h)), () => `${w()}: a hint gives away the answer "${ans}"`);
  check(q.explanation.trim().length >= 15, () => `${w()}: explanation`);
  check(q.tag >= 1 && q.tag <= 18 && q.skill === SKILL_TAGS[q.tag - 1], () => `${w()}: skill tag ${q.tag} "${q.skill}"`);
  if (!opts.comboStep) check(q.tag === KIND_META[q.kind].tag, () => `${w()}: tag ${q.tag} vs kind tag ${KIND_META[q.kind].tag}`);
  check(q.subject === "math" && q.grade === "6" && /^NC\.(6\.RP\.[23]|7\.G\.1)$/.test(q.standard), () => `${w()}: standard ${q.standard}`);
  seenTags.add(q.tag);
  // Independent recomputation (combo steps are checked against their chain below).
  if (!opts.comboStep) {
    const exp = expected(q);
    const ok = matches(q, ans, exp);
    check(ok, () => `${w()}: answer "${ans}" but recomputed "${exp}"`);
  }
  for (const t of allText(q)) {
    check(!/(^|[\s(=])[-−]\$?\d/.test(t), () => `${w()}: negative number in "${t}"`);
    check(!/NaN|Infinity|undefined|\[object/.test(t), () => `${w()}: broken text "${t}"`);
    check(!OUT_OF_SCOPE.test(t), () => `${w()}: out-of-scope wording in "${t}"`);
    check(!BANNED_IN_TEXT.test(t), () => `${w()}: name not allowed in "${t}"`);
  }
  for (const t of [q.prompt, ...q.choices]) {
    for (const m of t.match(MONEY_ANY) ?? []) if (m.length > 1) check(MONEY_STRICT.test(m), () => `${w()}: money "${m}" must have 2 decimals in "${t}"`);
  }
  for (const t of [...q.hints, ...q.feedback, q.explanation]) {
    for (const m of t.match(MONEY_ANY) ?? []) if (m.length > 1) check(/^\$\d{1,3}(,\d{3})*\.\d{2,}$/.test(m.replace(/\.$/, "")), () => `${w()}: money "${m}" in "${t}"`);
  }
  for (const m of q.prompt.matchAll(/(\d+)%/g)) percentsSeen.add(Number(m[1]));
}

const PER_KIND = 1200;
const perSection: Record<string, number> = {};
for (const k of KIND_IDS) {
  for (let i = 0; i < PER_KIND; i++) {
    const q = generate(k, rand);
    checkQuestion(q, `gen#${i}`);
    perSection[q.section] = (perSection[q.section] ?? 0) + 1;
    if (q.twoStep) twoStepFromKinds++;
    if ((k === "recipeBatch" || k === "cookieScale" || k === "convertFrac") && /[½⅓⅔¼¾]/.test(q.prompt + q.choices[q.answer])) fractionBatch++;
  }
}
check(Object.values(perSection).every((n) => n >= 2400), () => `thousands of questions per section: ${JSON.stringify(perSection)}`);
console.log(`  generated ${KIND_IDS.length * PER_KIND} questions (${JSON.stringify(perSection)}); filler wrong choices used ${stats.filler} times`);
check(stats.filler < KIND_IDS.length * PER_KIND * 0.002, () => `wrong choices should come from real mistakes (filler used ${stats.filler} times)`);
for (let t = 1; t <= 18; t++) check(seenTags.has(t), () => `skill tag ${t} (${tagName(t)}) never produced`);
check(SKILL_TAGS.length === 18 && SKILL_TAGS[0] === "Estimating with rates" && SKILL_TAGS[15] === "Discounts, tax, and tips (two-step)" && SKILL_TAGS[17] === "Bridge: scale factors", () => "skill tag names");
for (const t of [6, 12, 35, 125, 150, 200]) check(percentsSeen.has(t), () => `percent ${t}% never used`);
check(fractionBatch > 500, () => `batch/rate items with ½ ⅓ ¼ ⅔ 1½: ${fractionBatch}`);
for (let t = 1; t <= 18; t++) check(kindsForTag(t).length > 0, () => `no single-question kind for tag ${t}`);

// Money with rounding to the cent shows up (prompts that ask to round, answers that are not exact).
{
  let rounding = 0;
  for (let i = 0; i < 2000; i++) for (const k of ["unitPriceRound", "roundAtEnd", "findPart", "discount", "tax", "tip"] as KindId[]) if (/round/i.test(generate(k, rand).prompt)) rounding++;
  check(rounding > 3000, () => `round-to-the-cent items: ${rounding}`);
  const u = generate("unitPriceRound", () => 0);
  check(u.choices[u.answer].startsWith("$") && /\.\d\d$/.test(u.choices[u.answer]), () => "unit price rounded to the cent");
}

// Distractors built from real mistakes: step-one answers are offered on two-step items.
{
  let stepOne = 0;
  let n = 0;
  for (const k of KIND_IDS.filter((k) => KIND_META[k].twoStep && !k.startsWith("combo"))) {
    for (let i = 0; i < 200; i++) {
      const q = generate(k, rand);
      n++;
      if (q.feedback.some((f) => /step one|step 1|That's the (discount|tax|tip)|just the|the price of ONE|That's the number of|perimeter|the speed|That's ONE|is the number of|unrounded|isn't enough/i.test(f))) stepOne++;
    }
  }
  check(stepOne / n > 0.8, () => `two-step items should offer the step-one answer as a named mistake (${stepOne}/${n})`);
  const disc = generate("discount", rand);
  check(disc.feedback.includes("That's the discount — what does the customer pay?"), () => "the discount mistake is named");
}

// The deck: a full climb's mix has at least 1 in 4 two-step items; conversions go both ways equally.
{
  const deck = new U3Deck(rand);
  let total = 0, two = 0, combos = 0;
  const full = practicePlan("full");
  for (let run = 0; run < 400; run++) {
    for (const f of full) {
      for (let asked = 0; asked < 4; asked++) {
        const it = deck.boss(f, asked);
        total++;
        if (it.type === "combo") { two++; combos++; } else if (it.q.twoStep) two++;
      }
      total++;
      if (deck.scroll(f).twoStep) two++;
    }
  }
  check(two / total >= 0.25, () => `two-step share ${(two / total).toFixed(2)} should be at least 0.25`);
  console.log(`  full-climb mix: ${(100 * two / total).toFixed(0)}% two-step or more (${combos} combos in ${total} items)`);
  // Floor 2 conversions
  const dirs = { toSmaller: 0, toBigger: 0 };
  const deck2 = new U3Deck(rand);
  for (let i = 0; i < 6000; i++) {
    const q = deck2.draw(FLOORS_ALL[1].kinds);
    if (q.dir) dirs[q.dir]++;
  }
  const share = dirs.toSmaller / (dirs.toSmaller + dirs.toBigger);
  check(share > 0.45 && share < 0.55, () => `conversions both ways: ${JSON.stringify(dirs)}`);
  console.log(`  conversions: ${dirs.toSmaller} to smaller units, ${dirs.toBigger} to bigger units`);
  // Never the same kind twice in a row on a floor with a choice.
  const deck3 = new U3Deck(rand);
  let last = "";
  let repeats = 0;
  for (let i = 0; i < 2000; i++) {
    const q = deck3.draw(FLOORS_ALL[i % 6].kinds);
    if (q.kind === last) repeats++;
    last = q.kind;
  }
  check(repeats === 0, () => `${repeats} back-to-back repeats`);
  // Combos: floors 3-6 ask one on the second question; floor 7 is all combos; 1-2 and the bridge none.
  for (const f of FLOORS_ALL) {
    const kinds = [0, 1, 2, 3].map((a) => deck.boss(f, a).type);
    const want = f.n >= 3 && f.n <= 6 ? "single,combo,single,single" : f.n === 7 ? "combo,combo,combo,combo" : "single,single,single,single";
    check(kinds.join() === want, () => `floor ${f.n} combos: ${kinds.join()}`);
  }
  // Retry rounds cycle through the missed tags only.
  const r = retryPlan([3, 16, 17]);
  const deck4 = new U3Deck(rand);
  const tags = new Set<number>();
  for (let i = 0; i < 30; i++) {
    const it = deck4.boss(r[0], i);
    check(it.type === "single", () => "retry rounds ask single questions");
    if (it.type === "single") tags.add(it.q.tag);
  }
  check([...tags].sort((a, b) => a - b).join() === "3,16,17", () => `retry tags ${[...tags]}`);
}

/* ------------------------------------------------------------ 2. COMBO story problems */

function checkCombo(c: Combo, i: number) {
  const where = `${c.kind}#${i}`;
  checkQuestion(c.final, `${where} final`);
  check(c.final.tag === c.tag && [8, 11, 16, 17].includes(c.tag), () => `${where}: chain tag ${c.tag}`);
  check(c.final.twoStep, () => `${where}: combos are multi-step`);
  check(c.steps.length >= 3 && c.steps.length <= 5, () => `${where}: ${c.steps.length} steps (2-4 steps after the setup, Paint the Room 5)`);
  check(c.story.length > 40 && c.final.prompt.startsWith(c.story), () => `${where}: story first`);
  const finalAns = c.final.choices[c.final.answer];
  check(matches(c.final, finalAns, expected(c.final)), () => `${where}: final "${finalAns}" vs recomputed "${expected(c.final)}"`);
  c.steps.forEach((s, k) => {
    checkQuestion(s.q, `${where} step ${k + 1}`, { comboStep: true });
    const a = s.q.choices[s.q.answer];
    const want = s.unit === "$" ? money(s.value) : fmtNum(s.value);
    check(a.includes(want), () => `${where} step ${k + 1}: answer "${a}" should show its value ${want}`);
    check(s.result.includes(want), () => `${where} step ${k + 1}: work line "${s.result}" should show ${want}`);
  });
  const last = c.steps[c.steps.length - 1];
  check(last.q.choices[last.q.answer] === finalAns && last.value === c.finalValue, () => `${where}: the last step must ask the final answer again (${last.q.choices[last.q.answer]} vs ${finalAns})`);
  // Every intermediate step value (in the final's units) is one of the final's wrong choices, named as "only step k".
  const wrong = c.final.choices.filter((_, j) => j !== c.final.answer);
  for (const s of c.steps.slice(0, -1)) {
    if (s.unit !== c.finalUnit) continue;
    const t = s.unit === "$" ? money(s.value) : fmtNum(s.value);
    const j = c.final.choices.findIndex((ch, jj) => jj !== c.final.answer && (ch === t || ch.startsWith(`${t} `)));
    check(j >= 0, () => `${where}: intermediate ${t} missing from final choices ${c.final.choices.join(" | ")}`);
    if (j >= 0) check(/only step|step \d/i.test(c.final.feedback[j]), () => `${where}: "${c.final.feedback[j]}" should say it's only a step`);
  }
  check(wrong.length === 3, () => `${where}: 3 wrong choices`);
}

{
  const stepTags = new Set<number>();
  for (const k of COMBO_KINDS) {
    for (let i = 0; i < 800; i++) {
      const c = makeCombo(k, rand);
      checkCombo(c, i);
      for (const s of c.steps) stepTags.add(s.q.tag);
    }
  }
  check([4, 5, 7, 8, 11, 14, 16, 17].every((t) => stepTags.has(t)), () => `combo steps keep their own tags: ${[...stepTags]}`);
  // Recompute every chain step by step (independently) for the shop and runner stories.
  for (let i = 0; i < 300; i++) {
    const c = makeCombo("comboShop", rand);
    const { n, P, m, D, T } = c.data as Record<string, number>;
    const u = P / n, cost = u * m, sale = cost - Math.round((cost * D) / 100 + 1e-9), total = sale + Math.round((sale * T) / 100 + 1e-9);
    check([u, cost, sale, total].join() === c.steps.map((s) => s.value).join(), () => `comboShop steps ${c.steps.map((s) => s.value)} vs ${[u, cost, sale, total]}`);
    const r = makeCombo("comboRunner", rand);
    const { p, s, d } = r.data as Record<string, number>;
    const vals = [p * d, 60 / s, (60 / s) * d, Math.abs(p * d - (60 / s) * d)];
    check(vals.every((v, j) => near(v, r.steps[j].value)), () => `comboRunner steps ${r.steps.map((x) => x.value)} vs ${vals}`);
    const pt = makeCombo("comboPaint", rand);
    const room = pt.data as unknown as Room;
    const G = gallonsNeeded(room);
    const pv = [wallArea(room), paintArea(room), G, G * room.canC, pt.finalValue];
    check(pv.every((v, j) => near(v, pt.steps[j].value)), () => `comboPaint steps ${pt.steps.map((x) => x.value)} vs ${pv}`);
    check(pt.final.feedback.some((f) => /cheaper per gallon/.test(f)), () => "Paint the Room final offers the cheap-per-gallon trap");
  }
  console.log(`  checked ${COMBO_KINDS.length * 800} combo story problems`);
}

// Paint the Room: gallons always rounded UP; the cheap-per-gallon bucket never holds enough alone and never wins.
for (let i = 0; i < 3000; i++) {
  const r = newRoom(rand);
  const exact = (paintArea(r) * r.coats) / r.cover;
  const G = gallonsNeeded(r);
  check(G === Math.ceil(exact) && G > exact && G >= 2 && G <= 4, () => `gallons ${G} for ${exact}`);
  check(r.bucketC / r.bucketGal < r.canC && r.bucketGal < G, () => "the bucket is cheaper per gallon but not enough on its own");
  // Independent exhaustive search over cans and buckets.
  let best = Infinity, bestB = -1;
  for (let b = 0; b <= 5; b++) for (let c = 0; c <= 6; c++) if (c + b * r.bucketGal >= G && c * r.canC + b * r.bucketC < best) { best = c * r.canC + b * r.bucketC; bestB = b; }
  check(bestB === 0 && best === G * r.canC, () => `cheapest is ${G} cans (got ${bestB} buckets, ${best})`);
  check(cheapestBuy(G, r.canC, r.bucketGal, r.bucketC)[0][2] === best, () => "cheapestBuy agrees");
  check(PAINT_STEPS.every((k) => KIND_META[k].section === "E"), () => "paint kinds are section E");
}

// Names: original only.
check(!NAMES.some((n) => ["Andre", "Lin", BANNED_NAME].includes(n)), () => "names list");
check(CLEAN_SPEEDS.every((s) => Number.isInteger((60 / s) * 100)), () => "clean speeds give clean paces");

/* ------------------------------------------------------------ 3. rules */

{
  let s = newStreak();
  for (let i = 1; i <= 5; i++) {
    const r = applyAnswer(s, true);
    check(r.streak.streak === i && r.streak.meter === Math.min(METER_MAX, i) && r.filled === (i === METER_MAX), () => `streak/meter after ${i} right`);
    s = r.streak;
  }
  check(spendThunder(s)?.meter === 0 && spendThunder({ ...s, meter: 1 }) === null, () => "thunder spends only a full meter");
  const w = applyAnswer(s, false);
  check(w.streak.streak === 0 && w.streak.meter === 0 && w.streak.best === 5, () => "a wrong answer resets streak and meter but keeps best");
}
{
  // Boss: right = 1 damage, every METER_MAX-th right in a row = Thunder Kick (+1), wrong = blocked.
  let fight = newFight(3);
  let st = newStreak();
  let r = resolveBossAnswer(fight, st, false, 1);
  check(r.result.blocked && r.result.damage === 0 && r.fight.hp === 3 && !r.result.defeated && !r.result.big, () => "wrong answer is blocked with no damage");
  r = resolveBossAnswer(r.fight, r.streak, true, 1);
  check(r.result.damage === 1 && r.fight.hp === 2 && !r.result.thunder, () => "right answer deals 1");
  // BIG COMBO: power 2 plus bonus points.
  const big = resolveBossAnswer(newFight(4), newStreak(), true, 3, { power: 2 });
  const plain = resolveBossAnswer(newFight(4), newStreak(), true, 3);
  check(big.result.big && big.result.damage === 2 && big.fight.hp === 2 && big.result.points === plain.result.points + COMBO_BONUS, () => `BIG COMBO: damage ${big.result.damage}, points ${big.result.points}`);
  // Hang on: a combo step can't beat the master before the chain's last step.
  const hold = resolveBossAnswer(newFight(1), newStreak(), true, 7, { holdOn: true });
  check(hold.fight.hp === 1 && hold.result.damage === 0 && !hold.result.defeated && hold.result.points > 0, () => "the master hangs on at 1 HP until the last step");
  const lastStep = resolveBossAnswer(hold.fight, hold.streak, true, 7, { holdOn: false });
  check(lastStep.result.defeated, () => "the last step can finish the master");
  // Property test: random answer sequences, random combos; HP never rises, wrong never hurts, every fight is won.
  for (let trial = 0; trial < 3000; trial++) {
    let f = newFight(3 + (trial % 4));
    let s = newStreak();
    const p = 0.1 + rand() * 0.9;
    let n = 0;
    while (f.hp > 0 && n < 5000) {
      // A combo: final first, then (if wrong) 3-5 steps, holding on until the last.
      const steps = 3 + (trial % 3);
      const ok = rand() < p;
      let out = resolveBossAnswer(f, s, ok, 5, { power: 2 });
      check(out.fight.hp <= f.hp, () => "boss HP never goes up");
      if (!ok) check(out.fight.hp === f.hp && out.result.points === 0, () => "wrong answers never deal damage or points");
      f = out.fight;
      s = out.streak;
      if (!ok) {
        for (let k = 0; k < steps; k++) {
          const ok2 = rand() < p;
          const before = f.hp;
          out = resolveBossAnswer(f, s, ok2, 5, { holdOn: k < steps - 1 });
          if (k < steps - 1) check(out.fight.hp >= 1, () => "never beaten mid-chain");
          if (!ok2) check(out.fight.hp === before, () => "a wrong step never hurts");
          f = out.fight;
          s = out.streak;
        }
      }
      n++;
    }
    check(f.hp === 0, () => `fight ${trial} did not finish`);
  }
}

/* ------------------------------------------------------------ 4. simulation (from Dojo Tower) */

function run(sim: DojoSim, seconds: number, until?: () => boolean): SimEvent[] {
  const evs: SimEvent[] = [];
  for (let t = 0; t < seconds; t += 1 / 60) {
    sim.update(1 / 60);
    evs.push(...sim.events);
    sim.events = [];
    if (until?.()) break;
  }
  return evs;
}
const toRun = (sim: DojoSim) => run(sim, 5, () => sim.mode === "run");
const quiet = (sim: DojoSim) => {
  // Freeze spawning for a controlled test.
  (sim as unknown as { spawnT: number }).spawnT = 1e9;
  (sim as unknown as { scrollsLeft: number[] }).scrollsLeft = [];
};
function placeEnemy(sim: DojoSim, kind: "ninja" | "blob" | "thrower" | "scroll", dx: number) {
  const e = sim.spawn(kind, true);
  e.x = sim.player.x + dx;
  e.speed = 0;
  return e;
}

{
  // Punch and kick poof ninjas in reach
  const sim = new DojoSim("g35", { rng: () => 0.5 });
  toRun(sim);
  check(sim.mode === "run", () => `intro should end in run, got ${sim.mode}`);
  quiet(sim);
  sim.player.facing = 1;
  const e = placeEnemy(sim, "ninja", 16);
  const score0 = sim.score;
  sim.press("punch");
  run(sim, 0.3);
  check(!sim.enemies.includes(e), () => "punch should poof a ninja 16px ahead");
  check(sim.score > score0, () => "poofing a ninja scores");
  const e2 = placeEnemy(sim, "ninja", 24);
  sim.press("kick");
  run(sim, 0.35);
  check(!sim.enemies.includes(e2), () => "kick should reach a ninja 24px ahead");
  const e3 = placeEnemy(sim, "ninja", -16);
  sim.press("punch");
  run(sim, 0.3);
  check(sim.enemies.includes(e3), () => "a punch to the front does not hit a ninja behind");
  sim.enemies = [];

  // Blobs: standing punch misses, ducking punch hits
  const b = placeEnemy(sim, "blob", 14);
  b.t = 0;
  sim.press("punch");
  run(sim, 0.05);
  b.y = 0;
  run(sim, 0.25);
  check(sim.enemies.includes(b), () => "a standing punch should pass over an ink blob");
  sim.enemies = [];
  sim.player.invuln = 5;
  const b2 = placeEnemy(sim, "blob", 14);
  sim.held.down = true;
  run(sim, 1 / 60);
  sim.press("punch");
  run(sim, 0.3);
  sim.held.down = false;
  check(!sim.enemies.includes(b2), () => "a ducking punch should poof an ink blob");
}

{
  // Ink stars: duck under high ones, jump over low ones, standing still gets hit
  const mk = (high: boolean, stance: "stand" | "duck" | "jump") => {
    const sim = new DojoSim("g68", { rng: () => 0.5 });
    toRun(sim);
    quiet(sim);
    const p = sim.player;
    sim.shots.push({ id: 999, x: p.x + 40, y: high ? 22 : 4, vx: -90, high });
    if (stance === "duck") sim.held.down = true;
    const e0 = sim.energy;
    if (stance === "jump") {
      run(sim, 0.2);
      sim.press("jump");
    }
    run(sim, 1);
    return sim.energy < e0;
  };
  check(mk(true, "stand"), () => "a high ink star should hit a standing student");
  check(!mk(true, "duck"), () => "ducking should dodge a high ink star");
  check(mk(false, "stand"), () => "a low ink star should hit a standing student");
  check(!mk(false, "jump"), () => "jumping should clear a low ink star");
}

{
  // Bumps cost 1 energy with a grace period; empty energy costs a life; no lives = game over
  const sim = new DojoSim("g35", { rng: () => 0.5 });
  toRun(sim);
  quiet(sim);
  placeEnemy(sim, "ninja", 4);
  run(sim, 0.1);
  check(sim.energy === MAX_ENERGY - 1, () => `one bump = one energy (energy ${sim.energy})`);
  run(sim, 0.4);
  check(sim.energy === MAX_ENERGY - 1, () => "no second hit during the grace period");
  for (let life = START_LIVES; life >= 1; life--) {
    sim.energy = 1;
    sim.player.invuln = 0;
    sim.enemies = [];
    placeEnemy(sim, "ninja", 3);
    run(sim, 0.1);
    check(sim.mode === "dying", () => `energy 0 should start dying (mode ${sim.mode})`);
    const evs = run(sim, 2.5, () => sim.mode !== "dying");
    if (life > 1) {
      check(sim.mode === "run" && sim.lives === life - 1 && sim.energy === MAX_ENERGY, () => `life lost: mode ${sim.mode} lives ${sim.lives}`);
      check(evs.some((e) => e.type === "lifeLost"), () => "lifeLost event");
    } else {
      check(sim.mode === "over" && evs.some((e) => e.type === "gameOver"), () => "last life lost = game over");
    }
  }
}

{
  // Scroll ninjas open a question; answers never hurt
  const sim = new DojoSim("k2", { rng: () => 0.5 });
  toRun(sim);
  quiet(sim);
  sim.energy = 5;
  sim.player.facing = 1;
  placeEnemy(sim, "scroll", 16);
  sim.press("punch");
  const evs = run(sim, 0.3, () => sim.mode === "scroll");
  check(sim.mode === "scroll" && evs.some((e) => e.type === "scroll"), () => "beating a scroll ninja opens a question");
  const frozen = sim.player.x;
  sim.held.right = true;
  run(sim, 0.5);
  sim.held.right = false;
  check(sim.player.x === frozen, () => "action is frozen while the question is open");
  sim.answerScroll(false);
  check(sim.mode === "run" && sim.energy === 5 && sim.lives === START_LIVES, () => "a wrong scroll answer costs nothing");
  placeEnemy(sim, "scroll", 16);
  sim.press("punch");
  run(sim, 0.3, () => sim.mode === "scroll");
  sim.answerScroll(true);
  check(sim.energy === 7 && sim.streak.streak === 1, () => `a right scroll answer gives energy (energy ${sim.energy})`);

  // Thunder Kick needs a full meter, then clears the screen
  placeEnemy(sim, "ninja", 60);
  placeEnemy(sim, "ninja", 90);
  sim.press("thunder");
  run(sim, 1 / 60);
  check(sim.enemies.length === 2, () => "no Thunder Kick without a full meter");
  sim.streak = { streak: 3, best: 3, meter: METER_MAX };
  sim.press("thunder");
  run(sim, 1 / 60);
  check(sim.enemies.length === 0 && sim.streak.meter === 0, () => "Thunder Kick clears the screen and empties the meter");
}

{
  // Boss fights: wrong answers are blocked forever without cost; right answers win; all 5 floors
  for (const band of BANDS) {
    const sim = new DojoSim(band, { rng: () => 0.3 });
    let towerEv = false;
    for (let floor = 1; floor <= FLOORS; floor++) {
      check(sim.floor === floor, () => `${band}: expected floor ${floor}, got ${sim.floor}`);
      check(sim.dir === (floor % 2 ? 1 : -1), () => `${band}: floor ${floor} direction`);
      toRun(sim);
      sim.warpToBoss();
      sim.held[sim.dir > 0 ? "right" : "left"] = true;
      const evs = run(sim, 8, () => sim.mode === "boss");
      sim.held.left = sim.held.right = false;
      check(sim.mode === "boss" && evs.some((e) => e.type === "bossStart"), () => `${band} floor ${floor}: boss fight should start (mode ${sim.mode})`);
      check(sim.enemies.length === 0, () => "ninjas leave when the floor master arrives");
      const hp0 = sim.fight!.hp;
      const lives0 = sim.lives;
      const energy0 = sim.energy;
      for (let i = 0; i < 12; i++) {
        const r = sim.answerBoss(false)!;
        check(!!r && r.blocked && !r.defeated, () => "wrong answer blocked");
        run(sim, 1);
      }
      check(sim.mode === "boss" && sim.fight!.hp === hp0 && sim.lives === lives0 && sim.energy === energy0, () => `${band} floor ${floor}: wrong answers must not change anything (hp ${sim.fight!.hp}, lives ${sim.lives}, energy ${sim.energy})`);
      let answers = 0;
      while (sim.fight!.hp > 0 && answers < 20) {
        sim.answerBoss(true);
        run(sim, 1.6);
        answers++;
      }
      check(answers <= hp0, () => `${band} floor ${floor}: took ${answers} right answers for ${hp0} HP`);
      const downEvs = run(sim, 2, () => sim.mode === "bossDown");
      check(sim.mode === "bossDown" || downEvs.some((e) => e.type === "bossDown"), () => `${band} floor ${floor}: boss should go down (mode ${sim.mode})`);
      sim.finishFloor();
      const after = run(sim, 3, () => sim.mode === "intro" || sim.mode === "won");
      if (after.some((e) => e.type === "towerCleared")) towerEv = true;
    }
    check(sim.mode === "won" && towerEv, () => `${band}: the tower should be cleared after floor ${FLOORS} (mode ${sim.mode})`);
    check(sim.floor === FLOORS, () => `${band}: the climb should end on floor ${FLOORS}`);
    check(sim.lives === START_LIVES, () => `${band}: boss quizzes never cost lives`);
  }
}

{
  // A natural floor with spawning: enemies come and the student can walk to the boss
  const sim = new DojoSim("g35");
  sim.invincible = true;
  toRun(sim);
  sim.held.right = true;
  let sawEnemy = false;
  let sawScroll = false;
  for (let t = 0; t < 60 && sim.mode !== "boss"; t += 1 / 60) {
    sim.update(1 / 60);
    if (sim.enemies.length) sawEnemy = true;
    if (sim.mode === "scroll") {
      sawScroll = true;
      sim.answerScroll(true);
    }
    // swat anything close
    if (sim.enemies.some((e) => Math.abs(e.x - sim.player.x) < 22)) sim.press(sim.enemies[0].kind === "blob" ? "kick" : "punch");
    sim.events = [];
  }
  check(sawEnemy, () => "enemies should spawn on a floor");
  check(sawScroll || sim.mode === "boss", () => "the run should reach the floor master");
  check(sim.player.y >= 0 && GROUND > 0, () => "student stays on or above the floor");
}

{
  // Walk every floor for real (no warps) in every band: a simple bot punches, kicks, ducks, throws ink stars,
  // answers scrolls and floor masters right, and climbs all ten floors.
  for (const band of BANDS) {
    let seed = 11;
    const rand = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);
    const sim = new DojoSim(band, { rng: rand });
    sim.invincible = true;
    const floorsSeen = new Set<number>();
    let bursts = 0;
    let starsThrown = 0;
    let t = 0;
    for (; t < 1500 && sim.mode !== "won"; t += 1 / 60) {
      floorsSeen.add(sim.floor);
      if (sim.mode === "run") {
        sim.held.right = sim.dir > 0;
        sim.held.left = sim.dir < 0;
        const near = sim.enemies.find((e) => Math.abs(e.x - sim.player.x) < 24);
        sim.held.down = !!near && near.kind === "blob";
        if (near) {
          sim.player.facing = (near.x > sim.player.x ? 1 : -1) as 1 | -1;
          sim.press(near.kind === "blob" ? "punch" : t % 2 < 1 ? "punch" : "kick");
        }
        if (sim.burstT > 0 && sim.enemies.some((e) => (e.x - sim.player.x) * sim.dir > 0)) {
          const n = sim.stars.length;
          sim.press("star");
          if (sim.stars.length > n) starsThrown++;
        }
      }
      if (sim.mode === "scroll") sim.answerScroll(true);
      if (sim.mode === "boss" && !sim.bossAnim) sim.answerBoss(true);
      if (sim.mode === "bossDown") sim.finishFloor();
      sim.update(1 / 60);
      if (sim.events.some((e) => e.type === "starBurst")) bursts++;
      sim.events = [];
    }
    check(sim.mode === "won", () => `${band}: the bot should walk and clear all ${FLOORS} floors (stuck on floor ${sim.floor}, mode ${sim.mode}, ${t.toFixed(0)} s)`);
    check(floorsSeen.size === FLOORS, () => `${band}: visited floors ${[...floorsSeen]}`);
    console.log(`  ${band}: walked all ${FLOORS} floors in ${t.toFixed(0)} s of game time, score ${sim.score}, ${bursts} ink-star bursts, ${starsThrown} stars thrown`);
  }
}


{
  // Ink stars (rules): only throwers count, the burst comes at STAR_GOAL, nothing counts during a burst.
  let n = 0;
  for (let i = 1; i < STAR_GOAL; i++) {
    const r = onThrowerDefeated(n, false);
    check(r.count === i && !r.burst, () => `thrower ${i}: ${JSON.stringify(r)}`);
    n = r.count;
  }
  const r5 = onThrowerDefeated(n, false);
  check(r5.count === STAR_GOAL && r5.burst, () => "the fifth thrower grants the burst");
  check(onThrowerDefeated(STAR_GOAL, true).burst === false && onThrowerDefeated(2, true).count === 2, () => "no counting during a burst");
  check(STAR_GOAL === 5 && STAR_BURST >= 6 && STAR_BURST <= 10 && STAR_COOLDOWN > 0 && STAR_COOLDOWN < 1, () => "star constants");
}

{
  // Ink stars (simulation)
  const sim = new DojoSim("g35", { rng: () => 0.5 });
  toRun(sim);
  quiet(sim);
  sim.invincible = true;
  sim.player.facing = 1;
  const poke = (kind: "ninja" | "blob" | "thrower", dx = 16) => {
    const e = placeEnemy(sim, kind, dx);
    if (kind === "blob") {
      sim.held.down = true;
      run(sim, 1 / 60);
    }
    sim.press("punch");
    run(sim, 0.3);
    sim.held.down = false;
    run(sim, 0.1);
    return !sim.enemies.includes(e);
  };
  check(poke("ninja") && poke("blob"), () => "set-up: punches poof ninjas and blobs");
  check(sim.starCount === 0, () => `ninjas and blobs must not count toward the burst (${sim.starCount})`);
  // Without a burst, S does nothing but a hint.
  sim.press("star");
  run(sim, 1 / 60);
  check(sim.stars.length === 0, () => "no ink stars before the burst");
  // A gold-scroll ninja does not count either.
  placeEnemy(sim, "scroll", 16);
  sim.press("punch");
  run(sim, 0.3, () => sim.mode === "scroll");
  sim.answerScroll(true);
  check(sim.starCount === 0, () => "scroll ninjas do not count");
  let burstEv = false;
  for (let i = 1; i <= STAR_GOAL; i++) {
    sim.enemies = [];
    check(poke("thrower"), () => `thrower ${i} should poof`);
    const evs = sim.events;
    if (i < STAR_GOAL) check(sim.starCount === i && sim.burstT === 0, () => `after ${i} throwers: count ${sim.starCount}, burst ${sim.burstT}`);
    void evs;
  }
  check(sim.starCount === STAR_GOAL && sim.burstT > STAR_BURST - 0.6, () => `five throwers grant the burst (count ${sim.starCount}, burst ${sim.burstT})`);
  // Thunder-kicked throwers count too, but nothing counts during the burst.
  check(poke("thrower") && sim.starCount === STAR_GOAL, () => "no counting during the burst");
  // Throw: one star, then a cooldown.
  sim.enemies = [];
  sim.shots = [];
  sim.player.facing = 1;
  const evs1 = run(sim, 0);
  void evs1;
  sim.press("star");
  sim.press("star");
  check(sim.stars.length === 1, () => `cooldown: ${sim.stars.length} stars from two quick presses`);
  check(sim.stars[0].vx > 0, () => "stars fly the way the student faces");
  run(sim, STAR_COOLDOWN + 0.05);
  sim.press("star");
  check(sim.stars.length >= 1, () => "a second star after the cooldown");
  sim.stars = [];
  // Stars poof a ninja and a blob far ahead (out of punch reach), and knock down an incoming ink star.
  const far = placeEnemy(sim, "ninja", 90);
  run(sim, STAR_COOLDOWN + 0.05);
  sim.press("star");
  run(sim, 0.6);
  check(!sim.enemies.includes(far), () => "an ink star should poof a ninja 90px ahead");
  const blob = placeEnemy(sim, "blob", 70);
  run(sim, STAR_COOLDOWN + 0.05);
  sim.press("star");
  run(sim, 0.6);
  check(!sim.enemies.includes(blob), () => "an ink star should poof an ink blob ahead");
  sim.shots.push({ id: 777, x: sim.player.x + 80, y: 4, vx: -60, high: false });
  run(sim, STAR_COOLDOWN + 0.05);
  sim.press("star");
  run(sim, 0.3);
  check(!sim.shots.some((x) => x.id === 777), () => "an ink star should knock a low ink star out of the air");
  // The burst does not drain while a question is open.
  placeEnemy(sim, "scroll", 16);
  sim.press("punch");
  run(sim, 0.3, () => sim.mode === "scroll");
  const frozen = sim.burstT;
  run(sim, 2);
  check(sim.mode === "scroll" && sim.burstT === frozen, () => `burst should pause during a question (${frozen} -> ${sim.burstT})`);
  sim.answerScroll(true);
  // The burst runs out; the counter resets; S does nothing again.
  const evs = run(sim, STAR_BURST + 0.5);
  check(sim.burstT === 0 && sim.starCount === 0 && evs.some((e) => e.type === "burstEnd"), () => `burst should expire and reset (burst ${sim.burstT}, count ${sim.starCount})`);
  run(sim, 1);
  sim.press("star");
  check(sim.stars.length === 0, () => "no stars after the burst");
  poke("thrower");
  check(sim.starCount === 1, () => `the count starts again from zero (${sim.starCount})`);
}

{
  // Ink stars never touch a floor master: they vanish when the master arrives, and S does nothing in a boss fight.
  const sim = new DojoSim("g68", { rng: () => 0.5 });
  toRun(sim);
  sim.starCount = STAR_GOAL;
  sim.burstT = STAR_BURST;
  sim.warpToBoss();
  quiet(sim);
  sim.press("star");
  check(sim.stars.length === 1, () => "a star thrown just before the arena");
  sim.held.right = true;
  run(sim, 8, () => sim.mode === "boss");
  sim.held.right = false;
  check(sim.mode === "boss" && sim.stars.length === 0, () => `stars are cleared when the master arrives (mode ${sim.mode}, ${sim.stars.length} stars)`);
  const hp = sim.fight!.hp;
  const burstAtBoss = sim.burstT;
  check(burstAtBoss > 0, () => "the burst is still on when the fight starts");
  for (let i = 0; i < 10; i++) {
    sim.press("star");
    run(sim, 0.4);
  }
  check(sim.stars.length === 0 && sim.fight!.hp === hp, () => "S in a boss fight throws nothing and deals no damage");
  check(sim.burstT === burstAtBoss, () => "the burst waits (it only drains while running a floor)");
  // Only right answers beat the master.
  let k = 0;
  while (sim.fight!.hp > 0 && k++ < 20) {
    sim.answerBoss(true);
    run(sim, 1.6);
  }
  check(sim.fight!.hp === 0, () => "right answers still beat the master");
}

{
  // Shorter floors (a full climb in about 10-15 minutes): the first floor is about two-thirds of Dojo Tower's
  // grade 6-8 floor, and floors still get a little longer, quicker and busier as you climb.
  const at = (n: number) => new DojoSim("g68", { floor: n, rng: () => 0.5 });
  check(at(1).len <= 900 && at(1).len >= 700, () => `floor 1 length ${at(1).len}`);
  for (let n = 2; n <= FLOORS; n++) {
    check(at(n).len >= at(n - 1).len && at(n).enemySpeed >= at(n - 1).enemySpeed && at(n).spawnGap(0.5) <= at(n - 1).spawnGap(0.5), () => `floor ${n} should not get easier`);
  }
  // Continue keeps the score.
  const c = new DojoSim("g68", { floor: 4, score: 12340 });
  check(c.floor === 4 && c.lives === START_LIVES && c.score === 12340 && c.mode === "intro", () => "continue keeps the score");
  // Practice plans: one section's floors; difficulty follows the tower floor.
  const sc = new DojoSim("g68", { plan: practicePlan("C"), rng: () => 0.5 });
  check(sc.floors === 2 && sc.info.n === 3 && sc.tf === 3, () => `practice C starts on tower floor 3 (got ${sc.info.n})`);
  check(sc.enemySpeed === at(3).enemySpeed, () => "difficulty follows the tower floor");
  // Retry round: starts at the master (no running part, no scrolls).
  const r = new DojoSim("g68", { plan: retryPlan([3, 13]), rng: () => 0.5 });
  const evs = run(r, 8, () => r.mode === "boss");
  check(r.mode === "boss" && evs.some((e) => e.type === "bossStart"), () => `retry round reaches the master by itself (mode ${r.mode})`);
  check(r.fight!.maxHp === 4, () => `retry HP = 2 per missed tag (${r.fight!.maxHp})`);
  // Every practice choice can be cleared, with combos breaking into steps (the chain always completes).
  for (const p of PRACTICES) {
    const sim = new DojoSim("g68", { plan: practicePlan(p.id), rng: () => 0.4 });
    let towerEv = false;
    for (let f = 1; f <= sim.floors; f++) {
      toRun(sim);
      sim.warpToBoss();
      sim.held[sim.dir > 0 ? "right" : "left"] = true;
      run(sim, 8, () => sim.mode === "boss");
      sim.held.left = sim.held.right = false;
      check(sim.fight!.maxHp === sim.info.hp, () => `${p.id} floor ${f}: HP from the plan`);
      let guard = 0;
      while (sim.fight!.hp > 0 && guard++ < 40) {
        // A combo answered wrong, then its 4 steps (wrong, right, right, right).
        sim.answerBoss(false, { power: 2 }); run(sim, 1.6);
        sim.answerBoss(false, { holdOn: true }); run(sim, 1.6);
        sim.answerBoss(true, { holdOn: true }); run(sim, 1.6);
        sim.answerBoss(true, { holdOn: true }); run(sim, 1.6);
        if (sim.fight!.hp > 0) check(sim.mode === "boss", () => "still fighting mid-chain");
        sim.answerBoss(true, { holdOn: false }); run(sim, 1.6);
      }
      run(sim, 2, () => sim.mode === "bossDown");
      sim.finishFloor();
      if (run(sim, 3, () => sim.mode === "intro" || sim.mode === "won").some((e) => e.type === "towerCleared")) towerEv = true;
    }
    check(sim.mode === "won" && towerEv && sim.lives === START_LIVES, () => `practice ${p.id}: should clear (mode ${sim.mode})`);
  }
}

/* ------------------------------------------------------------ 5. floors, masters, attempt log, privacy */

{
  check(FLOORS === 7 && practicePlan("full").length === 7 && FLOORS_ALL.length === 8, () => "7 floors + the bonus bridge floor");
  check(practicePlan("full").map((f) => f.section).join("") === "ABCCDDE", () => "floors follow the unit");
  check(PRACTICES.map((p) => p.id).join() === "full,A,B,C,D,E,X", () => "practice picker");
  check(["A", "B", "C", "D", "E", "X"].map((p) => practicePlan(p as never).map((f) => f.n).join("")).join() === "1,2,34,56,7,8", () => "practice floors");
  const names = new Set(ALL_BOSSES.map((b) => b.name));
  check(names.size === ALL_BOSSES.length && ALL_BOSSES.length === 9, () => "nine different masters");
  check(new Set(FLOORS_ALL.map((f) => f.boss.id)).size === 8, () => "a different master on every floor");
  for (const b of ALL_BOSSES) check(b.intro.length > 5 && b.block.length >= 2 && b.hit.length >= 2 && b.defeat.length >= 2 && b.hall.length > 3, () => `${b.name}: lines`);
  check(FLOORS_ALL[6].boss.look.prop === "brush" && FLOORS_ALL[6].combo.mode === "all", () => "the painter grand master asks Paint the Room combos");
  check(FLOORS_ALL[2].boss.look.prop === "coin" && FLOORS_ALL[3].boss.look.prop === "hourglass", () => "a merchant for prices, a racer for speed and pace");
  check(FLOORS_ALL.every((f) => f.hp >= 3 && f.hp <= 4), () => "boss HP 3-4");
  check(new Set(Object.values(THEMES).map((t) => t.scene)).size === Object.keys(THEMES).length, () => "every floor has its own scenery");
  // Every floor's kinds belong to its section (scrolls on floor 7 may be bridge bonus).
  for (const f of FLOORS_ALL) for (const [k] of f.kinds) check(KIND_META[k].section === f.section, () => `floor ${f.n}: ${k} is section ${KIND_META[k].section}`);
}

{
  // The attempt log, in an in-memory localStorage.
  const mem = new Map<string, string>();
  (globalThis as unknown as { localStorage: Storage }).localStorage = {
    getItem: (k: string) => mem.get(k) ?? null, setItem: (k: string, v: string) => void mem.set(k, v), removeItem: (k: string) => void mem.delete(k),
    clear: () => mem.clear(), key: () => null, length: 0,
  } as Storage;
  check(LOG_KEY === "arcade.dojo-rates.log.v1" && PRACTICE_KEY === "arcade.dojo-rates.practice", () => "storage keys");
  check(loadPractice() === "full", () => "FULL CLIMB is the default");
  savePractice("D");
  check(loadPractice() === "D", () => "practice choice saved");
  mem.set(PRACTICE_KEY, "Z");
  check(loadPractice() === "full", () => "bad saved practice falls back");
  const mk = (i: number, ok: boolean, tag = 13, hints = 0): Attempt => ({
    date: "2026-10-28T12:00:00.000Z", game: "dojo-rates", tag, skill: tagName(tag), question: `What is 6% of $45.00? #${i}, "quoted"`, given: "$27.00", correct: "$2.70", ok, hints, kind: "boss", part: "",
  });
  saveAttempts(Array.from({ length: 620 }, (_, i) => mk(i, i % 3 === 0)));
  const back = loadAttempts();
  check(back.length === ATTEMPT_LOG_MAX && back[back.length - 1].question.includes("#619"), () => `log capped at ${ATTEMPT_LOG_MAX} (newest kept): ${back.length}`);
  const csv = toCSV([mk(1, true, 16, 2), mk(2, false, 3, 1)]);
  const lines = csv.trim().split(/\r\n/);
  check(lines[0] === "date,game,skill tag,question,answer given,correct answer,correct/incorrect,hints used", () => `CSV header ${lines[0]}`);
  check(lines.length === 3 && lines[1].includes('"What is 6% of $45.00? #1, ""quoted"""') && lines[1].endsWith(",correct,2") && lines[2].endsWith(",incorrect,1"), () => `CSV rows ${lines.slice(1)}`);
  const json = JSON.parse(toJSON([mk(1, true, 16, 2)]));
  check(Object.keys(json[0]).join() === EXPORT_FIELDS.join() && json[0]["skill tag"] === "16. Discounts, tax, and tips (two-step)" && json[0]["hints used"] === 2 && json[0]["correct/incorrect"] === "correct", () => `JSON ${JSON.stringify(json[0])}`);
  const rows = tagRows([mk(1, true, 3, 1), mk(2, false, 3, 2), mk(3, true, 1)]);
  check(rows.length === 2 && rows[0].tag === 1 && rows[1].n === 2 && rows[1].c === 1 && rows[1].hints === 3, () => `results by tag ${JSON.stringify(rows)}`);
}

{
  // Privacy and scope scan of the game's own source (src/, scripts/, index.html, README; src/kit/ is the shared kit).
  const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
  const files: string[] = [];
  const walk = (d: string) => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) { if (e.name !== "kit" && e.name !== "node_modules") walk(p); } else files.push(p);
    }
  };
  walk(path.join(root, "src"));
  walk(path.join(root, "scripts"));
  files.push(path.join(root, "index.html"), path.join(root, "README.md"));
  for (const f of files) {
    const text = fs.readFileSync(f, "utf8");
    check(!new RegExp(BANNED_NAME, "i").test(text), () => `${path.relative(root, f)} mentions the real name`);
    check(!new RegExp(`\\b${BANNED_WORD}\\b`).test(text), () => `${path.relative(root, f)} uses a banned program name`);
  }
  check(files.length > 10, () => "privacy scan found the files");
}

console.log(`${checks - failures}/${checks} checks passed`);
if (failures) {
  console.error(`${failures} FAILED`);
  process.exit(1);
}
