/*
 * Validates every book in src/stories/**\/*.story (npm test). Prints each book's stats and
 * reading level (Flesch–Kincaid grade) and fails on any error. Also checks that the engine
 * draws every scene and character in the rosters.
 */
import fs from "node:fs";
import path from "node:path";
import { checkStory, formatIssue } from "../src/story/validate";
import { ANCHORS, BAND_GRADES, CHAR_IDS, GENRES, SCENES, BANDS, type Band } from "../src/story/roster";
import { exits } from "../src/story/validate";
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

/*
 * Robots shelf: the main characters' names in each robot book. A name must not appear in any
 * other book (earlier books had to be renamed when two stories shared a character name).
 */
const ROBOT_BOOK_NAMES: Record<string, string[]> = {
  "4-5/robots.story": ["Dumpling", "Whirligig", "Widget", "Marigold", "Butterbell", "Higgleby"],
  "4-5/robots-2.story": ["Sprocket", "Billie", "Ashgrove", "Hoist"],
  "6-8/robots.story": ["Skitter", "Clatterbox", "Yumi", "Haddad", "Dez", "Achterberg", "Liesl", "Villanueva", "Imelda", "Annika", "Rasmussen", "Bulwark"],
  "6-8/robots-2.story": ["Tumble", "Zephyr", "Fumiko", "Bellweather", "Dunleavy"],
  "9-12/robots.story": ["Halyard", "Petrel", "Noor", "Halvorsen", "Augusta", "Treloar", "Bertrand", "Szabo", "Hamish", "Quarrie", "Sunniva", "Brekke"],
  "9-12/robots-2.story": ["Tess", "Ifeoma", "Barrow", "Ferraro", "Okonjo", "Delphine", "Kask", "Jun", "Takahara"],
};
/*
 * Shark adventures (ADVENTURE shelf, one per band): their main names must be unique too, and each
 * book needs a shark, an ocean scene, story gates, 2-3 QUIZ gates and reachable win + secret endings.
 */
const SHARK_BOOK_NAMES: Record<string, string[]> = {
  "4-5/adventure-sharks.story": ["Speckle", "Lani", "Kahale", "Benny", "Seaglass", "Turtle Rock", "Little Comet"],
  "6-8/adventure-sharks.story": ["Clementine", "Yara", "Holloway", "Dolores", "Quint", "Rafi", "Wavecrest", "Saltby", "Dorado"],
  "9-12/adventure-sharks.story": ["Mireille", "Okoro", "Haakon", "Wendt", "Matteo", "Lindqvist", "Emeka", "Sorensen", "Kealoha", "Corvina", "Meridian", "Ardent Star"],
};
const SHARKS = ["whaleshark", "hammerhead", "greatwhite"];
const OCEAN_SCENES = ["reef", "research-boat", "deep-sea"];

/** Page ids reachable from the start page. */
function reachable(s: { start: string; pages: Parameters<typeof exits>[0][] }): Set<string> {
  const byId = new Map(s.pages.map((p) => [p.id, p]));
  const seen = new Set<string>();
  const queue = [s.start];
  while (queue.length) {
    const id = queue.shift()!;
    if (seen.has(id) || !byId.has(id)) continue;
    seen.add(id);
    queue.push(...exits(byId.get(id)!));
  }
  return seen;
}

const ROBOT_TYPES = ["helperbot", "retrobot", "drone", "rover", "fixbot", "mech", "robodog"];
const ROBOT_SCENES = ["robot-workshop", "factory-floor", "robot-arena", "recycling-center", "rooftop-night", "bakery"];
const robotErr = (rel: string, msg: string) => {
  console.log(`ERROR: ${rel}: ${msg}`);
  errors++;
};

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
  console.log(`\n${rel}: "${s.title}" (${s.genre}, band ${s.band}) — ${st.pages} pages, endings win ${st.endings.win} / lose ${st.endings.lose} / secret ${st.endings.secret}, gates ${st.gates.mc} choice + ${st.gates.order} order + ${st.gates.quiz} QUIZ, ${st.checkpoints} checkpoints`);
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
  // Every shelf book has 2-3 QUIZ gates (subject questions from the player's subject); the HOW TO PLAY book has one.
  const wantQuiz = folder === "sample" ? [1, 1] : [2, 3];
  if (st.gates.quiz < wantQuiz[0] || st.gates.quiz > wantQuiz[1]) {
    console.log(`  ERROR: ${st.gates.quiz} QUIZ gates; want ${wantQuiz[0] === wantQuiz[1] ? wantQuiz[0] : `${wantQuiz[0]}–${wantQuiz[1]}`}.`);
    errors++;
  }
  if (folder !== "sample") shelf.set(`${s.genre}/${s.band}`, [...(shelf.get(`${s.genre}/${s.band}`) ?? []), rel]);

  // ---- Extra checks for the shark adventures ----
  const relKey = rel.split(path.sep).join("/");
  if (SHARK_BOOK_NAMES[relKey]) {
    const sharkErr = (msg: string) => robotErr(rel, `(shark book) ${msg}`);
    const [lo, hi] = BAND_GRADES[s.band as Band];
    if (s.genre !== "adventure") sharkErr("should be on the ADVENTURE shelf.");
    if (fk < lo - 2 || fk > hi + 1) sharkErr(`reading level ${fk.toFixed(1)} does not fit band ${s.band}.`);
    if (st.pages < 20 || st.pages > 34) sharkErr(`${st.pages} pages (want about 20-30).`);
    if (st.gates.mc + st.gates.order < 8) sharkErr(`only ${st.gates.mc + st.gates.order} story gates (want 8+).`);
    if (st.gates.quiz < 2 || st.gates.quiz > 3) sharkErr(`${st.gates.quiz} QUIZ gates (want 2-3).`);
    if (st.checkpoints < 3) sharkErr("needs a checkpoint at the start of each chapter.");
    if (st.endings.win < 1 || st.endings.secret < 1) sharkErr("needs a win and a secret ending.");
    if (s.band === "4-5" ? st.endings.lose !== 0 : st.endings.lose < 1) sharkErr(`band ${s.band} lose endings: ${st.endings.lose}.`);
    const cast = new Set(s.pages.flatMap((p) => p.cast.map((c) => c.id)));
    if (!SHARKS.some((c) => cast.has(c))) sharkErr("no shark in the cast.");
    if (!s.pages.some((p) => OCEAN_SCENES.includes(p.scene))) sharkErr("uses none of the ocean scenes.");
    const seen = reachable(s);
    for (const p of s.pages) if (p.end && !seen.has(p.id)) sharkErr(`ending ${p.id} can't be reached.`);
    for (const p of s.pages) {
      const g = p.gate;
      if (!g || g.kind === "quiz") continue;
      if (g.anchor.startsWith("RF.")) sharkErr(`page ${p.id}: use a reading/language anchor.`);
      if (g.kind === "mc" && (g.answers.length !== 4 || new Set(g.answers.map((a) => a.text.toLowerCase())).size !== 4)) sharkErr(`page ${p.id}: multiple-choice gates need 4 different answers.`);
    }
  }

  // ---- Extra checks for the Robots shelf ----
  if (s.genre === "robots") {
    const key = rel.split(path.sep).join("/");
    if (!ROBOT_BOOK_NAMES[key]) robotErr(rel, "robot book has no entry in ROBOT_BOOK_NAMES (list its main characters' names).");
    const [lo, hi] = BAND_GRADES[s.band as Band];
    if (fk < lo - 2 || fk > hi + 1) robotErr(rel, `reading level ${fk.toFixed(1)} does not fit band ${s.band}.`);
    if (st.endings.win < 1 || st.endings.secret < 1) robotErr(rel, "needs at least one win and one secret ending.");
    if (s.band === "4-5" ? st.endings.lose !== 0 : st.endings.lose < 1) robotErr(rel, `band ${s.band} lose endings: ${st.endings.lose}.`);
    if (st.checkpoints < 3) robotErr(rel, "needs a checkpoint at the start of each of its 3 chapters.");
    if (st.gates.mc + st.gates.order < 10) robotErr(rel, `only ${st.gates.mc + st.gates.order} gates (want 10+).`);
    if (st.reachable !== st.pages) robotErr(rel, "some pages are unreachable.");
    for (const p of s.pages) {
      const g = p.gate;
      if (!g || g.kind === "quiz") continue;
      if (!(g.anchor in ANCHORS) || g.anchor.startsWith("RF.")) robotErr(rel, `page ${p.id}: anchor ${g.anchor} is not a reading/language standard.`);
      if (!g.hint.trim() || g.hint.length < 20) robotErr(rel, `page ${p.id}: gate needs an explaining hint.`);
      if (g.kind === "mc") {
        const texts = new Set(g.answers.map((a) => a.text.toLowerCase()));
        if (g.answers.length !== 4 || texts.size !== 4) robotErr(rel, `page ${p.id}: multiple-choice gates need 4 different answers.`);
        if (g.answers.filter((a) => a.correct).length !== 1) robotErr(rel, `page ${p.id}: exactly one right answer.`);
      }
    }
    const used = new Set(s.pages.flatMap((p) => p.cast.map((c) => c.id)));
    if (!ROBOT_TYPES.some((r) => used.has(r))) robotErr(rel, "uses none of the robot characters.");
    if (!s.pages.some((p) => ROBOT_SCENES.includes(p.scene))) robotErr(rel, "uses none of the robot scenes.");
    // every ending can actually be reached from the start
    const byId = new Map(s.pages.map((p) => [p.id, p]));
    const seen = new Set<string>();
    const queue = [s.start];
    while (queue.length) {
      const id = queue.shift()!;
      if (seen.has(id) || !byId.has(id)) continue;
      seen.add(id);
      queue.push(...exits(byId.get(id)!));
    }
    for (const p of s.pages) if (p.end && !seen.has(p.id)) robotErr(rel, `ending ${p.id} can't be reached.`);
  }
}

// ---- No character name is shared between a robot book and any other book ----
const texts = new Map(files.map((f) => [path.relative(root, f).split(path.sep).join("/"), fs.readFileSync(f, "utf8")]));
for (const [book, names] of Object.entries({ ...ROBOT_BOOK_NAMES, ...SHARK_BOOK_NAMES })) {
  if (!texts.has(book)) robotErr(book, "listed in ROBOT_BOOK_NAMES but the file is missing.");
  for (const name of names) {
    const re = new RegExp(`\\b${name}\\b`);
    if (!re.test(texts.get(book) ?? "")) robotErr(book, `name "${name}" is listed but never used.`);
    for (const [other, text] of texts) if (other !== book && re.test(text)) robotErr(book, `character name "${name}" is also used in ${other}.`);
  }
}
const robotBands = BANDS.map((b) => [...texts.entries()].filter(([, t]) => /^genre:\s*robots\s*$/m.test(t) && new RegExp(`^band:\\s*${b}\\s*$`, "m").test(t)).length);
BANDS.forEach((b, i) => {
  if (robotBands[i] < 2) robotErr(`robots/${b}`, `only ${robotBands[i]} robot book(s); want 2 per band.`);
});
const sharkBands = BANDS.filter((b) => texts.has(`${b}/adventure-sharks.story`));
if (sharkBands.length !== BANDS.length) robotErr("adventure-sharks", `shark adventures for ${sharkBands.join(", ")} only; want one per band.`);
console.log(`\nShark adventures: ${sharkBands.length} books (${sharkBands.join(", ")}), names checked against every other book.`);
console.log(`\nRobots shelf: ${robotBands.reduce((a, b) => a + b, 0)} books (${BANDS.map((b, i) => `${b}: ${robotBands[i]}`).join(", ")}), names checked against every other book.`);

const missing = GENRES.flatMap((g) => BANDS.map((b) => `${g}/${b}`)).filter((k) => !shelf.has(k));
console.log(`\n${files.length} book file(s). Shelf: ${shelf.size}/${GENRES.length * BANDS.length} genre+band slots filled.${missing.length ? ` Not yet written: ${missing.join(", ")}.` : ""}`);
console.log(`${errors} error(s), ${warnings} warning(s).`);
process.exit(errors ? 1 : 0);
