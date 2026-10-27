// GET /api/popular: the arcade menu's "🔥 Most played this week" row. Public (anonymous), and it
// only returns aggregate totals: the top games by plays over the last 7 days, as
// { games: [{ id, plays }] }. With ?all=1 it lists every played game (up to 100), which the
// menu's Game spotlight uses to favour less played games. Without storage (ANALYTICS_STORAGE
// unset) it returns { games: [] }.
"use strict";

const { app } = require("@azure/functions");
const { popular, dayKey, POPULAR_DAYS, POPULAR_LIMIT, POPULAR_ALL_LIMIT } = require("../lib/metrics");
const { rowsSince } = require("../lib/store");

const HEADERS = { "cache-control": "public, max-age=900" };

function wantsAll(request) {
  try { return !!(request && request.query && request.query.get("all") === "1"); } catch (e) { return false; }
}

async function handler(request, context) {
  const limit = wantsAll(request) ? POPULAR_ALL_LIMIT : POPULAR_LIMIT;
  let rows = null;
  try {
    rows = await rowsSince(dayKey(new Date(Date.now() - (POPULAR_DAYS - 1) * 864e5)));
  } catch (e) {
    if (context && context.warn) context.warn(`popular: could not read (${e.statusCode || e.message})`);
    rows = null;
  }
  return { jsonBody: rows === null ? { games: [] } : popular(rows, limit), headers: HEADERS };
}

app.http("popular", {
  methods: ["GET"],
  authLevel: "anonymous",
  handler,
});

module.exports = { handler };
