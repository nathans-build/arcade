"use strict";
const test = require("node:test");
const assert = require("node:assert");
const path = require("node:path");
const { popular, POPULAR_LIMIT } = require("../src/lib/metrics");

test("popular ranks games by plays and returns only ids and play totals", () => {
  const rows = [
    { partitionKey: "2026-10-10", rowKey: "visits", n: 50 },
    { partitionKey: "2026-10-10", rowKey: "grade|6", n: 9 },
    { partitionKey: "2026-10-10", rowKey: "play|page-quest", n: 3 },
    { partitionKey: "2026-10-11", rowKey: "play|page-quest", n: 4 },
    { partitionKey: "2026-10-11", rowKey: "play|sonar-squad", n: 9 },
    { partitionKey: "2026-10-11", rowKey: "playgrade|sonar-squad|6", n: 9 },
    { partitionKey: "2026-10-11", rowKey: "time|dojo-tower", s: 6000 }, // time only: no plays, left out
    { partitionKey: "2026-10-11", rowKey: "tz|America~New_York", n: 2 },
  ];
  assert.deepStrictEqual(popular(rows), { games: [{ id: "sonar-squad", plays: 9 }, { id: "page-quest", plays: 7 }] });
});

test("popular returns at most 8 games and copes with no rows", () => {
  const rows = [];
  for (let i = 0; i < 12; i++) rows.push({ partitionKey: "2026-10-11", rowKey: `play|game-${i}`, n: 100 - i });
  const r = popular(rows);
  assert.strictEqual(POPULAR_LIMIT, 8);
  assert.strictEqual(r.games.length, 8);
  assert.deepStrictEqual(r.games[0], { id: "game-0", plays: 100 });
  for (const g of r.games) assert.deepStrictEqual(Object.keys(g).sort(), ["id", "plays"]);
  assert.deepStrictEqual(popular([]), { games: [] });
  assert.deepStrictEqual(popular(null), { games: [] });
});

// Loads functions/popular.js with stand-ins for @azure/functions and the table store.
function loadHandler(rowsSince) {
  const fnPath = require.resolve("../src/functions/popular.js");
  const storePath = require.resolve("../src/lib/store.js");
  const azPath = require.resolve("@azure/functions", { paths: [path.dirname(fnPath)] });
  const saved = { fn: require.cache[fnPath], store: require.cache[storePath], az: require.cache[azPath] };
  const registered = {};
  const fake = (p, exports) => ({ id: p, filename: p, loaded: true, exports });
  require.cache[azPath] = fake(azPath, { app: { http: (name, opts) => { registered[name] = opts; } } });
  require.cache[storePath] = fake(storePath, { rowsSince });
  delete require.cache[fnPath];
  try {
    require(fnPath);
  } finally {
    for (const [p, m] of [[fnPath, saved.fn], [storePath, saved.store], [azPath, saved.az]]) {
      if (m) require.cache[p] = m; else delete require.cache[p];
    }
  }
  return registered.popular;
}

test("GET /api/popular is public, cached for 15 minutes and asks for the last 7 days", async () => {
  let from = null;
  const fn = loadHandler(async (f) => { from = f; return [{ partitionKey: "2026-10-11", rowKey: "play|maze-muncher", n: 12 }]; });
  assert.strictEqual(fn.authLevel, "anonymous");
  assert.deepStrictEqual(fn.methods, ["GET"]);
  const res = await fn.handler({}, { warn() {} });
  assert.deepStrictEqual(res.jsonBody, { games: [{ id: "maze-muncher", plays: 12 }] });
  assert.strictEqual(res.headers["cache-control"], "public, max-age=900");
  const want = new Date(Date.now() - 6 * 864e5).toISOString().slice(0, 10);
  assert.strictEqual(from, want);
});

test("GET /api/popular returns an empty list when storage isn't set up or fails", async () => {
  const none = loadHandler(async () => null);
  assert.deepStrictEqual((await none.handler({}, {})).jsonBody, { games: [] });
  const broken = loadHandler(async () => { throw Object.assign(new Error("down"), { statusCode: 500 }); });
  const res = await broken.handler({}, { warn() {} });
  assert.deepStrictEqual(res.jsonBody, { games: [] });
  assert.strictEqual(res.headers["cache-control"], "public, max-age=900");
});
