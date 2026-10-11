// GET /api/stats?days=30: the owner's usage report. Locked to the "owner" role in
// site/staticwebapp.config.json, so only invited people can read it.
"use strict";

const { app } = require("@azure/functions");
const { report, dayKey } = require("../lib/metrics");
const { rowsSince } = require("../lib/store");

app.http("stats", {
  methods: ["GET"],
  authLevel: "anonymous", // access is enforced by the Static Web Apps route rule (allowedRoles)
  handler: async (request) => {
    const days = Math.max(1, Math.min(365, parseInt(request.query.get("days") || "30", 10) || 30));
    const from = dayKey(new Date(Date.now() - (days - 1) * 864e5));
    const rows = await rowsSince(from);
    if (rows === null) {
      return { status: 503, jsonBody: { error: "Stats storage isn't set up yet (app setting ANALYTICS_STORAGE)." } };
    }
    return { jsonBody: report(rows, days), headers: { "cache-control": "no-store" } };
  },
});
