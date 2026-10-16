// Sanity checks for site/games.js, run by scripts/build-site.sh before anything is built.
"use strict";
global.window = {};
require("../site/games.js");
const { GAMES, TOPICS, STYLES } = global.window;
const LENGTHS = ["quick", "adventure"];
const errors = [];
const styleIds = new Set();
if (!Array.isArray(STYLES) || !STYLES.length) errors.push("window.STYLES is missing");
for (const s of STYLES || []) {
  if (!s || typeof s.id !== "string" || !s.label || !s.icon) errors.push(`bad style entry ${JSON.stringify(s)}`);
  else if (styleIds.has(s.id)) errors.push(`style id "${s.id}" is used twice`);
  else styleIds.add(s.id);
}
const topicSubject = {};
for (const [subject, list] of Object.entries(TOPICS)) {
  for (const t of list) {
    if (topicSubject[t.id]) errors.push(`topic id "${t.id}" is used twice`);
    topicSubject[t.id] = subject;
  }
}
const ids = new Set();
for (const g of GAMES) {
  if (ids.has(g.id)) errors.push(`game id "${g.id}" is used twice`);
  ids.add(g.id);
  if (!g.url) continue; // "coming soon" cabinets need no topics, styles or length
  // Play styles: 1 or 2 known ids (the first is the game's main style).
  if (!Array.isArray(g.styles) || g.styles.length < 1 || g.styles.length > 2) errors.push(`${g.id}: "styles" needs 1 or 2 style ids`);
  else {
    for (const s of g.styles) if (!styleIds.has(s)) errors.push(`${g.id}: unknown style "${s}" (use ${[...styleIds].join(", ")})`);
    if (new Set(g.styles).size !== g.styles.length) errors.push(`${g.id}: a style is listed twice`);
  }
  if (!LENGTHS.includes(g.length)) errors.push(`${g.id}: "length" must be "quick" or "adventure"`);
  if (g.inspiredBy !== undefined && (typeof g.inspiredBy !== "string" || !g.inspiredBy.trim())) errors.push(`${g.id}: "inspiredBy" must be a non-empty string`);
  for (const s of g.subjects || []) {
    if (!TOPICS[s]) errors.push(`${g.id}: unknown subject "${s}"`);
    else if (!(g.topics || []).some((t) => topicSubject[t] === s)) errors.push(`${g.id}: no ${s} topic in "topics"`);
  }
  for (const t of g.topics || []) {
    if (!topicSubject[t]) errors.push(`${g.id}: unknown topic "${t}"`);
    else if (!(g.subjects || []).includes(topicSubject[t])) errors.push(`${g.id}: topic "${t}" is ${topicSubject[t]}, which isn't in its subjects`);
  }
}
if (errors.length) {
  console.error("site/games.js problems:\n  " + errors.join("\n  "));
  process.exit(1);
}
console.log(`games.js OK: ${GAMES.length} games, ${Object.keys(topicSubject).length} topics, ${styleIds.size} styles`);
