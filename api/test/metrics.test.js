"use strict";
const test = require("node:test");
const assert = require("node:assert");
const { countersFor, report, safeKey, MAX_SECONDS } = require("../src/lib/metrics");

test("a first visit of the day counts the device and its dimensions", () => {
  const c = countersFor({ e: "visit", first: 1, grade: "6", dev: "tablet", tz: "America/New_York", theme: "unicorn" });
  assert.deepStrictEqual(c, [
    ["visits", "n", 1], ["devices", "n", 1], ["grade|6", "n", 1], ["dev|tablet", "n", 1],
    ["tz|America~New_York", "n", 1], ["theme|unicorn", "n", 1],
  ]);
});

test("a repeat visit only counts the visit", () => {
  assert.deepStrictEqual(countersFor({ e: "visit", first: 0, grade: "6", dev: "phone" }), [["visits", "n", 1]]);
});

test("plays and time are counted per game; time is capped", () => {
  assert.deepStrictEqual(countersFor({ e: "play", game: "page-quest", grade: "5" }), [["play|page-quest", "n", 1], ["playgrade|page-quest|5", "n", 1]]);
  assert.deepStrictEqual(countersFor({ e: "time", game: "sonar-squad", s: 95.4 }), [["time|sonar-squad", "s", 95]]);
  assert.deepStrictEqual(countersFor({ e: "time", game: "sonar-squad", s: 999999 }), [["time|sonar-squad", "s", MAX_SECONDS]]);
});

test("bad input is dropped", () => {
  for (const ev of [null, "x", {}, { e: "play", game: "../etc" }, { e: "play", game: "A" }, { e: "time", game: "x-y", s: 1 },
    { e: "time", game: "x-y", s: "lots" }, { e: "hack" }, { e: "play", game: "a".repeat(40) }]) {
    assert.deepStrictEqual(countersFor(ev), [], JSON.stringify(ev));
  }
  // bad dimensions are dropped but the visit still counts
  assert.deepStrictEqual(countersFor({ e: "visit", first: 1, grade: "13", dev: "toaster", tz: "<script>", theme: "Bad Theme!" }), [["visits", "n", 1], ["devices", "n", 1]]);
});

test("row keys never contain characters Table Storage rejects", () => {
  assert.strictEqual(safeKey("America/Argentina/Buenos_Aires"), "America~Argentina~Buenos_Aires");
});

test("report rolls days up and ranks games", () => {
  const rows = [
    { partitionKey: "2026-10-10", rowKey: "visits", n: 5 },
    { partitionKey: "2026-10-10", rowKey: "devices", n: 2 },
    { partitionKey: "2026-10-10", rowKey: "play|page-quest", n: 3 },
    { partitionKey: "2026-10-11", rowKey: "play|page-quest", n: 1 },
    { partitionKey: "2026-10-11", rowKey: "play|sonar-squad", n: 2 },
    { partitionKey: "2026-10-11", rowKey: "time|page-quest", s: 1200 },
    { partitionKey: "2026-10-11", rowKey: "tz|America~New_York", n: 2 },
  ];
  const r = report(rows, 7);
  assert.strictEqual(r.totals.visits, 5);
  assert.strictEqual(r.totals.plays, 6);
  assert.strictEqual(r.games[0].game, "page-quest");
  assert.strictEqual(r.games[0].plays, 4);
  assert.strictEqual(r.games[0].minutes, 20);
  assert.strictEqual(r.games[0].avgMinutes, 5);
  assert.deepStrictEqual(r.timeZones, [["America/New_York", 2]]);
  assert.strictEqual(r.byDay.length, 2);
});
