/*
 * Validates every book in src/stories/**\/*.story (npm test) for SpiderBen10's special edition.
 * Prints each book's stats and reading level and fails on any error. Also checks:
 *  - every scene and character in the rosters has art;
 *  - the Math 6 · Unit 3 books (src/stories/math/): 20–30 pages, 8–12 math gates, at least 3
 *    multi-step chains, a checkpoint, win + secret endings, every ending reachable, a grade 6–8
 *    reading level, and at least 1 in 4 gates two-step (sampled);
 *  - every math gate names a real generator or chain (the validator) and makes questions;
 *  - all 18 skill tags of docs/math6-unit3.md are reachable across the books;
 *  - no out-of-scope topics and no private names anywhere in src/ or the books.
 */
import fs from "node:fs";
import path from "node:path";
import { checkStory, exits, formatIssue } from "../src/story/validate";
import { BAND_GRADES, CHAR_IDS, SCENES, type Band } from "../src/story/roster";
import { SCENE_PAINTERS } from "../src/engine/scenes";
import { SPRITES } from "../src/engine/sprites";
import { makeItem } from "../src/math/play";
import { mulberry32 } from "../src/math/format";
import { SKILL_TAGS, type SkillTag } from "../src/math/types";
import { privateWord } from "./private-words";

const here = path.dirname(new URL(import.meta.url).pathname);
const root = path.resolve(here, "../src/stories");
const src = path.resolve(here, "../src");

function walk(dir: string, ext: RegExp): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    return e.isDirectory() ? walk(p, ext) : ext.test(e.name) ? [p] : [];
  });
}

let errors = 0;
let warnings = 0;
const fail = (msg: string) => {
  console.log(`ERROR: ${msg}`);
  errors++;
};

for (const s of SCENES) if (!SCENE_PAINTERS[s]) fail(`no painter for scene "${s}"`);
for (const c of CHAR_IDS) if (!SPRITES[c]) fail(`no sprite for character "${c}"`);

const files = walk(root, /\.story$/).sort();
if (files.length === 0) fail("no .story files found");
const tagsSeen = new Set<SkillTag>();
let mathBooks = 0;
const rng = mulberry32(2026);

for (const file of files) {
  const rel = path.relative(root, file);
  const r = checkStory(fs.readFileSync(file, "utf8"));
  const s = r.story;
  const st = r.stats;
  const folder = rel.split(path.sep)[0];
  console.log(`\n${rel}: "${s.title}" (${s.genre}, band ${s.band}) — ${st.pages} pages, endings win ${st.endings.win} / lose ${st.endings.lose} / secret ${st.endings.secret}, math gates ${st.gates.math} (${st.gates.chain} chains), other gates ${st.gates.mc + st.gates.order}, ${st.checkpoints} checkpoints`);
  const fk = st.readability.grade;
  const [lo, hi] = BAND_GRADES[(s.band as Band) in BAND_GRADES ? (s.band as Band) : "6-8"];
  console.log(`  reading level: Flesch–Kincaid grade ${fk.toFixed(1)} (${st.readability.words} words)${fk < lo - 2 ? " — easy" : fk > hi + 1 ? " — hard" : " — fits"} for ${s.band}`);
  for (const i of r.issues) console.log(`  ${formatIssue(i)}${i.page ? ` [${i.page}]` : ""}`);
  errors += r.errors.length;
  warnings += r.warnings.length;
  if (r.errors.length) continue;

  // every math gate makes questions; collect skill tags and the two-step share
  let two = 0;
  let total = 0;
  for (const p of s.pages) {
    const g = p.gate;
    if (!g || g.kind !== "math" || !g.math) continue;
    for (let k = 0; k < 60; k++) {
      try {
        const item = makeItem(g.math, rng);
        total++;
        if (item.kind === "single") {
          tagsSeen.add(item.q.tag);
          if (item.q.steps >= 2) two++;
        } else {
          two++;
          tagsSeen.add(item.c.tag);
          for (const q of item.c.steps) tagsSeen.add(q.tag);
        }
      } catch (e) {
        fail(`${rel} page ${p.id}: math gate could not make a question: ${(e as Error).message}`);
        break;
      }
    }
  }

  if (folder === "math") {
    mathBooks++;
    const share = total ? two / total : 0;
    console.log(`  two-step share (sampled): ${(share * 100).toFixed(0)}%`);
    if (st.pages < 20 || st.pages > 30) fail(`${rel}: ${st.pages} pages (want 20–30).`);
    if (st.gates.math < 8 || st.gates.math > 12) fail(`${rel}: ${st.gates.math} math gates (want 8–12).`);
    if (st.gates.chain < 3) fail(`${rel}: only ${st.gates.chain} multi-step chain gates (want 3+).`);
    if (st.checkpoints < 1) fail(`${rel}: needs a checkpoint.`);
    if (st.endings.win < 1 || st.endings.secret < 1) fail(`${rel}: needs a win and a secret ending.`);
    if (fk < lo - 2 || fk > hi + 1) fail(`${rel}: reading level ${fk.toFixed(1)} does not fit grade 6.`);
    if (share < 0.25) fail(`${rel}: only ${(share * 100).toFixed(0)}% two-step items (want at least 1 in 4).`);
    if (st.reachable !== st.pages) fail(`${rel}: some pages are unreachable.`);
    const byId = new Map(s.pages.map((p) => [p.id, p]));
    const seen = new Set<string>();
    const queue = [s.start];
    while (queue.length) {
      const id = queue.shift()!;
      if (seen.has(id) || !byId.has(id)) continue;
      seen.add(id);
      queue.push(...exits(byId.get(id)!));
    }
    for (const p of s.pages) if (p.end && !seen.has(p.id)) fail(`${rel}: ending ${p.id} can't be reached.`);
    for (const p of s.pages) if (p.gate && p.gate.kind !== "math") fail(`${rel}: page ${p.id} has a non-math gate; the special edition's books use math gates.`);
  }
}

if (mathBooks < 3) fail(`only ${mathBooks} math books (want 3).`);
const missing = SKILL_TAGS.filter((t) => !tagsSeen.has(t));
console.log(`\nSkill tags reachable across the books: ${tagsSeen.size}/${SKILL_TAGS.length}${missing.length ? ` — missing: ${missing.join(", ")}` : ""}`);
if (missing.length) fail(`skill tags not covered by any book: ${missing.join(", ")}`);

// ---- privacy and scope: every file in src/ (except the shared kit) and the books ----
const OUT_OF_SCOPE = [/\bnegative\b/i, /\bintegers?\b/i, /\bequations?\b/i, /\bvariables?\b/i, /\bsimple interest\b/i, /\binterest rate\b/i, /\bmarkups?\b/i, /percent (increase|decrease)/i, /constant of proportionality/i, /\bproportional relationship/i];

for (const f of walk(src, /\.(ts|tsx|story|css)$/)) {
  const rel = path.relative(src, f);
  if (rel.startsWith(`kit${path.sep}`)) continue; // the shared arcade kit is a byte-identical copy of kit/
  const text = fs.readFileSync(f, "utf8");
  const priv = privateWord(text);
  if (priv) fail(`${rel}: contains ${priv} (the player is only ever "SpiderBen10").`);
  if (rel.startsWith(`stories${path.sep}`) || rel.startsWith(`math${path.sep}`)) {
    const body = text.replace(/^\s*(\/\/|\*|\/\*|#).*$/gm, "");
    for (const re of OUT_OF_SCOPE) {
      const m = re.exec(body);
      if (m) fail(`${rel}: out-of-scope topic "${m[0]}" (docs/math6-unit3.md section 10).`);
    }
  }
}

for (const f of [...walk(here, /\.(ts|cjs)$/), path.resolve(here, "../README.md"), path.resolve(here, "../index.html")]) {
  const priv = privateWord(fs.readFileSync(f, "utf8"));
  if (priv) fail(`${path.relative(path.resolve(here, ".."), f)}: contains ${priv}.`);
}

console.log(`\n${files.length} book file(s), ${mathBooks} Math 6 · Unit 3 books.`);
console.log(`${errors} error(s), ${warnings} warning(s).`);
process.exit(errors ? 1 : 0);
