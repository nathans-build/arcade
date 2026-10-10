// Sanity checks for site/games.js, run by scripts/build-site.sh before anything is built.
"use strict";
global.window = {};
require("../site/games.js");
const { GAMES, TOPICS } = global.window;
const errors = [];
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
  if (!g.url) continue; // "coming soon" cabinets need no topics
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
console.log(`games.js OK: ${GAMES.length} games, ${Object.keys(topicSubject).length} topics`);
