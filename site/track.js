// SpiderBen10's Arcade — anonymous usage stats (production only). Plain JS, no build step.
//
// Sends three kinds of tiny events to our own API (/api/track), which only keeps daily totals:
//   visit: the arcade menu was opened (once a day per device it also sends grade, device type,
//          time zone and theme, so we can see who the arcade is for);
//   play:  a game was opened (which game, and the grade);
//   time:  seconds a game was actually on screen (sent when the game is hidden or closed).
// No names, no IDs, no cookies, and the API never reads or stores IP addresses. Browsers that
// send "Global Privacy Control" are not counted at all. Loaded on the menu and, via
// scripts/build-site.sh, on every game page.
(function () {
  "use strict";

  var on = window.ARCADE_ENV === "production";
  try { if (localStorage.getItem("nzdo.trackDev") === "1") on = true; } catch (e) { /* ignore */ } // testing on dev
  if (!on || navigator.globalPrivacyControl === true) return;

  var URL_ = "/api/track";
  var GRADES = ["K", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];

  function send(ev, beacon) {
    var body = JSON.stringify(ev);
    try {
      if (beacon && navigator.sendBeacon) {
        navigator.sendBeacon(URL_, new Blob([body], { type: "application/json" }));
        return;
      }
      fetch(URL_, { method: "POST", body: body, headers: { "content-type": "application/json" }, keepalive: true, credentials: "omit" }).catch(function () {});
    } catch (e) { /* stats are best effort */ }
  }
  function grade() {
    var g = null;
    try { g = new URLSearchParams(location.search).get("grade"); } catch (e) { /* ignore */ }
    if (!g) { try { g = localStorage.getItem("arcade.grade"); } catch (e) { /* ignore */ } }
    g = (g || "").toUpperCase();
    return GRADES.indexOf(g) >= 0 ? g : null;
  }
  function device() {
    var touch = (navigator.maxTouchPoints || 0) > 1, w = Math.min(screen.width, screen.height);
    if (!touch) return "desktop";
    return w < 600 ? "phone" : "tablet";
  }

  // The first path segment is the game ("/page-quest/" -> "page-quest"); "/" is the menu.
  var first = location.pathname.split("/")[1] || "";
  var isMenu = first === "" || first === "index.html";
  var game = /^[a-z0-9-]{2,32}$/.test(first) && first.indexOf(".") < 0 ? first : null;

  if (isMenu) {
    var today = new Date().toISOString().slice(0, 10), firstToday = true;
    try { // device-wide (not per player), so it's outside the arcade.* keys the player menu swaps
      firstToday = localStorage.getItem("nzdo.statsDay") !== today;
      localStorage.setItem("nzdo.statsDay", today);
    } catch (e) { /* ignore */ }
    var ev = { e: "visit", first: firstToday ? 1 : 0 };
    if (firstToday) {
      ev.grade = grade();
      ev.dev = device();
      try { ev.tz = Intl.DateTimeFormat().resolvedOptions().timeZone; } catch (e) { /* ignore */ }
      ev.theme = document.documentElement.getAttribute("data-theme") || null;
    }
    send(ev);
    return;
  }
  if (!game) return;

  send({ e: "play", game: game, grade: grade() });
  // Count only time the game is actually visible; send what's built up whenever it's hidden.
  var since = document.visibilityState === "visible" ? Date.now() : null, total = 0;
  function flush() {
    if (since !== null) { total += Date.now() - since; since = null; }
    var s = Math.round(total / 1000);
    if (s >= 3) { send({ e: "time", game: game, s: s }, true); total = 0; }
  }
  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "hidden") flush();
    else since = Date.now();
  });
  window.addEventListener("pagehide", flush);
})();
