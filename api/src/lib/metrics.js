// Usage stats: turns one small event from the browser into counters to add to today's totals.
// Only daily totals are stored. Nothing personal: no IP address (the API never reads it),
// no user agent, no names, no cookies, no IDs. Pure functions, tested in test/metrics.test.js.
"use strict";

const GAME_RE = /^[a-z0-9-]{2,32}$/;
const TZ_RE = /^[A-Za-z]+(?:\/[A-Za-z0-9_+-]+){1,2}$/;
const GRADES = ["K", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];
const DEVICES = ["phone", "tablet", "desktop"];
const THEME_RE = /^[a-z]{2,12}$/;
/** Longest single stretch of play we count (stops a tab left open overnight from skewing averages). */
const MAX_SECONDS = 2 * 60 * 60;

/** Table Storage row keys can't contain / \ # ? (time zones like America/New_York have a /). */
function safeKey(s) {
  return String(s).replace(/[\/\\#?]/g, "~");
}

/** UTC date, e.g. "2026-10-11": the partition each day's totals live in. */
function dayKey(d = new Date()) {
  return d.toISOString().slice(0, 10);
}

/**
 * Validates an event and returns the counters it adds, as [rowKey, field, amount] triples,
 * or [] for anything unexpected (bad input is dropped, never stored).
 */
function countersFor(ev) {
  if (!ev || typeof ev !== "object") return [];
  const out = [];
  if (ev.e === "visit") {
    out.push(["visits", "n", 1]);
    if (ev.first === 1 || ev.first === true) {
      // Dimensions are counted once per device per day, so they add up to "devices".
      out.push(["devices", "n", 1]);
      if (GRADES.includes(ev.grade)) out.push([`grade|${ev.grade}`, "n", 1]);
      if (DEVICES.includes(ev.dev)) out.push([`dev|${ev.dev}`, "n", 1]);
      if (typeof ev.tz === "string" && ev.tz.length <= 40 && TZ_RE.test(ev.tz)) out.push([`tz|${safeKey(ev.tz)}`, "n", 1]);
      if (typeof ev.theme === "string" && THEME_RE.test(ev.theme)) out.push([`theme|${ev.theme}`, "n", 1]);
    }
    return out;
  }
  if (ev.e === "play" && typeof ev.game === "string" && GAME_RE.test(ev.game)) {
    out.push([`play|${ev.game}`, "n", 1]);
    if (GRADES.includes(ev.grade)) out.push([`playgrade|${ev.game}|${ev.grade}`, "n", 1]);
    return out;
  }
  if (ev.e === "time" && typeof ev.game === "string" && GAME_RE.test(ev.game)) {
    const s = Math.round(Number(ev.s));
    if (!Number.isFinite(s) || s < 3) return [];
    out.push([`time|${ev.game}`, "s", Math.min(s, MAX_SECONDS)]);
    return out;
  }
  return [];
}

/** Rolls stored rows (one per day per counter) up into the stats page's report. */
function report(rows, days) {
  const byDay = new Map();
  const sum = (map, k, v) => map.set(k, (map.get(k) || 0) + v);
  const plays = new Map(), seconds = new Map(), grade = new Map(), dev = new Map(), tz = new Map(), theme = new Map(), playGrade = new Map();
  for (const r of rows) {
    const day = r.partitionKey, key = r.rowKey, n = Number(r.n || 0), s = Number(r.s || 0);
    if (!byDay.has(day)) byDay.set(day, { date: day, visits: 0, devices: 0, plays: 0, minutes: 0 });
    const d = byDay.get(day);
    if (key === "visits") d.visits += n;
    else if (key === "devices") d.devices += n;
    else if (key.startsWith("play|")) { sum(plays, key.slice(5), n); d.plays += n; }
    else if (key.startsWith("time|")) { sum(seconds, key.slice(5), s); d.minutes += s / 60; }
    else if (key.startsWith("grade|")) sum(grade, key.slice(6), n);
    else if (key.startsWith("dev|")) sum(dev, key.slice(4), n);
    else if (key.startsWith("tz|")) sum(tz, key.slice(3).replace(/~/g, "/"), n);
    else if (key.startsWith("theme|")) sum(theme, key.slice(6), n);
    else if (key.startsWith("playgrade|")) sum(playGrade, key.slice(10), n);
  }
  const sorted = (m) => [...m.entries()].sort((a, b) => b[1] - a[1]);
  const games = [...new Set([...plays.keys(), ...seconds.keys()])].map((g) => {
    const p = plays.get(g) || 0, s = seconds.get(g) || 0;
    return { game: g, plays: p, minutes: Math.round(s / 60), avgMinutes: p ? Math.round((s / 60 / p) * 10) / 10 : 0 };
  }).sort((a, b) => b.plays - a.plays || b.minutes - a.minutes);
  const daysList = [...byDay.values()].sort((a, b) => a.date.localeCompare(b.date)).map((d) => ({ ...d, minutes: Math.round(d.minutes) }));
  return {
    days,
    totals: daysList.reduce((t, d) => ({ visits: t.visits + d.visits, devices: t.devices + d.devices, plays: t.plays + d.plays, minutes: t.minutes + d.minutes }), { visits: 0, devices: 0, plays: 0, minutes: 0 }),
    byDay: daysList,
    games,
    grades: sorted(grade),
    devices: sorted(dev),
    timeZones: sorted(tz).slice(0, 25),
    themes: sorted(theme),
    gameGrades: sorted(playGrade).slice(0, 60),
  };
}

/** How many games GET /api/popular returns, and over how many days. */
const POPULAR_LIMIT = 8;
const POPULAR_DAYS = 7;

/**
 * The public "most played this week" list: only each game's total plays, from the same rows and
 * report() ranking as the stats page. Nothing else (no grades, devices, time zones or times).
 */
function popular(rows, limit = POPULAR_LIMIT) {
  return {
    games: report(rows || [], POPULAR_DAYS).games
      .filter((g) => g.plays > 0 && GAME_RE.test(g.game))
      .slice(0, limit)
      .map((g) => ({ id: g.game, plays: g.plays })),
  };
}

module.exports = { countersFor, report, popular, dayKey, safeKey, MAX_SECONDS, POPULAR_LIMIT, POPULAR_DAYS };
