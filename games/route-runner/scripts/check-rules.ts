/*
 * Validates Route Runner's delivery rules for every grade (run: npm test).
 *  - every grade K–12 has at least 2 rules for science, math and ELA
 *  - every rule has ≥ 8 matching and ≥ 8 non-matching labels, no duplicates, no overlaps
 *  - labels are ≤ 10 characters and drawable by the bitmap font
 *  - math rules: the label is computed (parsed and evaluated) and must agree with its list
 *  - explanations exist for every label and have no leftover placeholders
 *  - standard codes look like the kit's NC codes
 *  - streets can be planned for every rule
 */
import { GRADES } from "@/kit/grades";
import type { Subject } from "@/kit";
import { ALL_RULES, explain, rulesFor } from "@/route/rules";
import { canDraw, measure, plainLabel, plainLength } from "@/route/font";
import { isPrime, parseRelation, relationIsFunction, valueOf } from "@/route/rules/expr";
import { housesPerStreet, planStreet, RuleRotation } from "@/route/street";

let failures = 0;
let checks = 0;
const fail = (msg: string) => {
  failures++;
  console.error("✘ " + msg);
};
const ok = (cond: boolean, msg: string) => {
  checks++;
  if (!cond) fail(msg);
};

// ------------------------------------------------------------ expression engine self-test
const approx = (a: number, b: number) => Math.abs(a - b) < 1e-9;
const EXPECT: [string, number][] = [
  ["3+7", 10], ["12−2", 10], ["3×8", 24], ["2/4", 0.5], ["−3×4", -12], ["7×(−1)", -7], ["−2×(−3)", 6],
  ["2{3}", 8], ["64{1/2}", 8], ["4{3/2}", 8], ["16{3/4}", 8], ["(√2){6}", 8], ["2{6}÷2{3}", 8], ["√64", 8],
  ["log 100", 2], ["log[2]8", 3], ["ln e{2}", 2], ["sin 30°", 0.5], ["sin 390°", 0.5], ["sin −30°", -0.5],
  ["2π", 2 * Math.PI], ["−√2", -Math.SQRT2], ["8/2", 4], ["0.501", 0.501],
];
for (const [s, v] of EXPECT) ok(approx(valueOf(s), v), `expr: ${s} should be ${v}, got ${valueOf(s)}`);
ok(approx(parseRelation("x{2}−5x+6=0")({ x: 3, y: 0 }), 0), "expr: x²−5x+6 at 3");
ok(approx(parseRelation("2(x+1)=y")({ x: 2, y: 6 }), 0), "expr: implicit product 2(x+1)");
ok(approx(parseRelation("y=2|x|")({ x: -3, y: 6 }), 0), "expr: 2|x|");
ok(!relationIsFunction("x{2}+y{2}=9") && relationIsFunction("y=x{2}"), "expr: function test");
ok(isPrime(2) && isPrime(37) && !isPrime(1) && !isPrime(91), "expr: primes");

// ------------------------------------------------------------ per-rule checks
const CODE = /^(NC\.(K|[1-8])\.[A-Z]{1,3}\.\d+|NC\.M[1-4]\.[A-Z]{1,2}(-[A-Z]{2,4})?\.\d+(\.\d+)?|(LS|PS|ESS)\.(K|[1-8])\.\d+(\.\d+)?|LS\.Bio\.\d+|PS\.Chm\.\d+|PS\.Phy\.\d+|ESS\.EES\.\d+|(RF|RL|RI|L|W)\.(K|\d+|9-10|11-12)\.\d+)$/;
const ids = new Set<string>();
for (const r of ALL_RULES) {
  const tag = `[${r.id}]`;
  ok(!ids.has(r.id), `${tag} duplicate id`);
  ids.add(r.id);
  ok(r.grades.length > 0 && r.grades.every((g) => GRADES.includes(g)), `${tag} bad grades`);
  ok(CODE.test(r.standard), `${tag} standard "${r.standard}" does not look like an NC code`);
  ok(r.yes.length >= 8, `${tag} only ${r.yes.length} matching labels`);
  ok(r.no.length >= 8, `${tag} only ${r.no.length} non-matching labels`);
  ok(new Set(r.yes).size === r.yes.length, `${tag} duplicate matching labels`);
  ok(new Set(r.no).size === r.no.length, `${tag} duplicate non-matching labels`);
  const overlap = r.yes.filter((l) => r.no.includes(l));
  ok(overlap.length === 0, `${tag} labels in both lists: ${overlap.join(", ")}`);
  // Labels that only differ by markup would look identical on a sign.
  const shown = [...r.yes, ...r.no].map(plainLabel);
  ok(new Set(shown).size === shown.length, `${tag} two labels look the same`);
  ok(r.target.length <= 20 && canDraw(r.target), `${tag} target "${r.target}" too long or not drawable`);
  ok(r.prompt.length > 10 && r.skill.length > 2, `${tag} prompt/skill missing`);
  for (const l of [...r.yes, ...r.no]) {
    ok(plainLength(l) <= 10, `${tag} label "${l}" is longer than 10 characters`);
    ok(canDraw(l), `${tag} label "${l}" has a character the font cannot draw`);
    ok(measure(l, 2) <= 92, `${tag} label "${l}" is too wide for the big sign font (${measure(l, 2)}px)`);
    ok(l.trim() === l && l.length > 0, `${tag} label "${l}" has stray spaces`);
    const e = explain(r, l, plainLabel);
    ok(e.length > 5 && !e.includes("{x}") && !/NaN|undefined|Infinity/.test(e), `${tag} bad explanation for "${l}": ${e}`);
  }
  for (const k of Object.keys(r.notes ?? {})) ok([...r.yes, ...r.no].includes(k), `${tag} note for unknown label "${k}"`);
  if (r.subject === "math") {
    ok(!!r.test, `${tag} math rule has no computed test`);
    if (r.test) {
      for (const l of r.yes) {
        let v = false;
        try { v = r.test(l); } catch (e) { fail(`${tag} "${l}" failed to parse: ${String(e)}`); }
        ok(v, `${tag} "${l}" is listed as matching, but computes as NOT matching`);
      }
      for (const l of r.no) {
        let v = true;
        try { v = r.test(l); } catch (e) { fail(`${tag} "${l}" failed to parse: ${String(e)}`); }
        ok(!v, `${tag} "${l}" is listed as not matching, but computes as matching`);
      }
    }
  }
  for (const g of r.grades) {
    for (let i = 0; i < 30; i++) {
      const houses = planStreet(r, housesPerStreet(g));
      const y = houses.filter((h) => h.match).length;
      ok(houses.length === housesPerStreet(g), `${tag} street has ${houses.length} houses`);
      ok(y >= 3 && houses.length - y >= 3, `${tag} street has ${y} matching of ${houses.length}`);
      ok(new Set(houses.map((h) => h.label)).size === houses.length, `${tag} street repeats a label`);
      ok(houses.every((h) => h.match === r.yes.includes(h.label)), `${tag} street mislabels a house`);
    }
  }
}

// ------------------------------------------------------------ grade coverage
const SUBJECTS: Subject[] = ["science", "math", "ela"];
const table: string[] = [];
for (const g of GRADES) {
  const row: string[] = [];
  for (const s of SUBJECTS) {
    const rs = rulesFor(g, s);
    ok(rs.length >= 2, `grade ${g} ${s}: only ${rs.length} rule(s)`);
    row.push(`${s}: ${rs.map((r) => `${r.target} (${r.standard})`).join(", ")}`);
  }
  const rot = new RuleRotation(g, "mixed");
  const firstThree = [rot.next(), rot.next(), rot.next()].map((r) => r.subject).join(",");
  ok(firstThree === "science,math,ela", `grade ${g} mixed rotation order ${firstThree}`);
  table.push(`  ${g.padEnd(2)} ${row.join(" | ")}`);
}
if (process.argv.includes("--table")) console.log(table.join("\n"));

const labels = ALL_RULES.reduce((n, r) => n + r.yes.length + r.no.length, 0);
if (failures) {
  console.error(`\n${failures} problem(s) in ${checks} checks.`);
  process.exit(1);
}
console.log(`✔ ${ALL_RULES.length} delivery rules, ${labels} house labels, ${checks} checks passed for grades K–12.`);
