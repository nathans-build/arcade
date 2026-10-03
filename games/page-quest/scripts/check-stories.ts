/*
 * Validates every book in src/stories/**\/*.story (npm test). Prints each book's stats and
 * reading level (Flesch–Kincaid grade) and fails on any error. Also checks that the engine
 * draws every scene and character in the rosters.
 */
import fs from "node:fs";
import path from "node:path";
import { checkStory, formatIssue } from "../src/story/validate";
import { BAND_GRADES, CHAR_IDS, GENRES, SCENES, BANDS, type Band } from "../src/story/roster";
import { SCENE_PAINTERS } from "../src/engine/scenes";
import { SPRITES } from "../src/engine/sprites";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../src/stories");

function walk(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    return e.isDirectory() ? walk(p) : e.name.endsWith(".story") ? [p] : [];
  });
}

let errors = 0;
let warnings = 0;

for (const s of SCENES) if (!SCENE_PAINTERS[s]) { console.log(`ERROR: no painter for scene "${s}"`); errors++; }
for (const c of CHAR_IDS) if (!SPRITES[c]) { console.log(`ERROR: no sprite for character "${c}"`); errors++; }

const files = walk(root).sort();
if (files.length === 0) { console.log("ERROR: no .story files found"); errors++; }
const shelf = new Map<string, string[]>();

for (const file of files) {
  const rel = path.relative(root, file);
  const r = checkStory(fs.readFileSync(file, "utf8"));
  const s = r.story;
  const st = r.stats;
  const folder = rel.split(path.sep)[0];
  console.log(`\n${rel}: "${s.title}" (${s.genre}, band ${s.band}) — ${st.pages} pages, endings win ${st.endings.win} / lose ${st.endings.lose} / secret ${st.endings.secret}, gates ${st.gates.mc} choice + ${st.gates.order} order, ${st.checkpoints} checkpoints`);
  const fk = st.readability.grade;
  let level = `  reading level: Flesch–Kincaid grade ${fk.toFixed(1)} (${st.readability.words} words)`;
  if ((BANDS as readonly string[]).includes(s.band)) {
    const [lo, hi] = BAND_GRADES[s.band as Band];
    level += fk < lo - 2 ? `  — easy for ${s.band}` : fk > hi + 1 ? `  — hard for ${s.band}` : `  — fits ${s.band}`;
  }
  console.log(level);
  if ((BANDS as readonly string[]).includes(folder) && folder !== s.band) {
    console.log(`  warning: file is in ${folder}/ but its header says band ${s.band}; the header wins.`);
    warnings++;
  }
  for (const i of r.issues) console.log(`  ${formatIssue(i)}${i.page ? ` [${i.page}]` : ""}`);
  errors += r.errors.length;
  warnings += r.warnings.length;
  if (folder !== "sample") shelf.set(`${s.genre}/${s.band}`, [...(shelf.get(`${s.genre}/${s.band}`) ?? []), rel]);
}

const missing = GENRES.flatMap((g) => BANDS.map((b) => `${g}/${b}`)).filter((k) => !shelf.has(k));
console.log(`\n${files.length} book file(s). Shelf: ${shelf.size}/${GENRES.length * BANDS.length} genre+band slots filled.${missing.length ? ` Not yet written: ${missing.join(", ")}.` : ""}`);
console.log(`${errors} error(s), ${warnings} warning(s).`);
process.exit(errors ? 1 : 0);
