// POST /api/track: one small usage event from the arcade (a menu visit, a game started, or
// minutes played). Adds it to today's totals. Never reads or stores the IP address.
"use strict";

const { app } = require("@azure/functions");
const { countersFor, dayKey } = require("../lib/metrics");
const { increment } = require("../lib/store");

app.http("track", {
  methods: ["POST"],
  authLevel: "anonymous",
  handler: async (request, context) => {
    let ev = null;
    try {
      const text = await request.text();
      if (text.length <= 1000) ev = JSON.parse(text);
    } catch (e) { /* ignore bad bodies */ }
    const counters = countersFor(ev);
    if (counters.length) {
      const day = dayKey();
      try {
        await Promise.all(counters.map(([key, field, amount]) => increment(day, key, field, amount)));
      } catch (e) {
        context.warn(`track: could not save (${e.statusCode || e.message})`);
      }
    }
    return { status: 204 };
  },
});
