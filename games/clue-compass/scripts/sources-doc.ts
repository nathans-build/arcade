/*
 * Regenerates the "Sources and the facts that cite them" list at the end of docs/sources.md from
 * the facts table (run: npx tsx scripts/sources-doc.ts). The hand-written notes above it are kept.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { ALL_PLACES } from "../src/data/bands";
import { SOURCES } from "../src/data/sources";

const file = new URL("../docs/sources.md", import.meta.url);
const HEAD = "## Sources and the facts that cite them";
const doc = readFileSync(file, "utf8");
const at = doc.indexOf(HEAD);
if (at < 0) throw new Error("sources.md has no sources heading");
const lines: string[] = [HEAD, ""];
for (const [id, s] of Object.entries(SOURCES)) {
  const facts = ALL_PLACES.flatMap((p) => p.facts.filter((f) => f.src === id).map((f) => `${p.name}: ${f.v}`));
  lines.push(`- **${id}** — ${s.title}${s.url ? ` <${s.url}>` : ""}`);
  if (facts.length) lines.push(`  - Facts: ${facts.join("; ")}`);
}
writeFileSync(file, doc.slice(0, at) + lines.join("\n") + "\n");
console.log(`docs/sources.md: ${Object.keys(SOURCES).length} sources`);
