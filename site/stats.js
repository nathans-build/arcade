// SpiderBen10's Arcade — the owner's stats page (reads /api/stats; locked to the "owner" role).
(function () {
  "use strict";

  var box = document.getElementById("report");
  var status = document.getElementById("status");
  var sel = document.getElementById("days");
  var titles = {};
  (window.GAMES || []).forEach(function (g) { titles[g.id] = g.title; });

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }
  function fmtMin(m) { return m >= 90 ? (m / 60).toFixed(1) + " h" : Math.round(m) + " min"; }

  function tiles(t) {
    var row = el("div", "stat-tiles");
    [["Visits", t.visits], ["Devices", t.devices], ["Games played", t.plays], ["Play time", fmtMin(t.minutes)]].forEach(function (x) {
      var d = el("div", "stat-tile");
      d.appendChild(el("span", "stat-num", String(x[1])));
      d.appendChild(el("span", "stat-label", x[0]));
      row.appendChild(d);
    });
    return row;
  }
  /** A table with a bar in the first number column. rows: [[label, value, ...extra]] */
  function table(title, head, rows, barCol) {
    var sec = el("section", "scores stat-section");
    sec.appendChild(el("h2", null, title));
    if (!rows.length) { sec.appendChild(el("p", "hint", "Nothing yet.")); return sec; }
    var wrap = el("div", "table-wrap"), t = el("table"), thead = el("tr");
    head.forEach(function (h) { thead.appendChild(el("th", null, h)); });
    t.appendChild(thead);
    var max = Math.max.apply(null, rows.map(function (r) { return Number(r[barCol]) || 0; })) || 1;
    rows.forEach(function (r) {
      var tr = el("tr");
      r.forEach(function (v, i) {
        var td = el("td", null, String(v));
        if (i === barCol) {
          var bar = el("span", "stat-bar");
          bar.style.width = Math.max(2, Math.round((Number(v) / max) * 100)) + "%";
          td.appendChild(bar);
        }
        tr.appendChild(td);
      });
      t.appendChild(tr);
    });
    wrap.appendChild(t);
    sec.appendChild(wrap);
    return sec;
  }

  function render(r) {
    box.textContent = "";
    box.appendChild(tiles(r.totals));
    box.appendChild(table("Most played games", ["Game", "Plays", "Total time", "Avg per play"],
      r.games.map(function (g) { return [titles[g.game] || g.game, g.plays, fmtMin(g.minutes), g.avgMinutes + " min"]; }), 1));
    box.appendChild(table("By day", ["Day", "Visits", "Devices", "Plays", "Play time"],
      r.byDay.slice().reverse().map(function (d) { return [d.date, d.visits, d.devices, d.plays, fmtMin(d.minutes)]; }), 1));
    box.appendChild(table("Grades (devices per day)", ["Grade", "Devices"], r.grades.map(function (x) { return [x[0] === "K" ? "Kindergarten" : "Grade " + x[0], x[1]]; }), 1));
    box.appendChild(table("Devices", ["Type", "Devices"], r.devices, 1));
    box.appendChild(table("Where (time zone)", ["Time zone", "Devices"], r.timeZones, 1));
    box.appendChild(table("Themes", ["Theme", "Devices"], r.themes, 1));
  }

  function load() {
    status.textContent = "Loading…";
    fetch("/api/stats?days=" + sel.value, { credentials: "same-origin" })
      .then(function (res) {
        return res.json().catch(function () { return {}; }).then(function (j) { return { ok: res.ok, code: res.status, body: j }; });
      })
      .then(function (x) {
        if (!x.ok) {
          status.textContent = x.body.error || (x.code === 401 || x.code === 403 ? "You need the owner role to see stats." : "Couldn't load stats (" + x.code + ").");
          box.textContent = "";
          return;
        }
        status.textContent = "Updated " + new Date().toLocaleTimeString() + ".";
        render(x.body);
      })
      .catch(function () { status.textContent = "Couldn't reach the stats API."; });
  }
  sel.addEventListener("change", load);
  load();
  window.__renderStats = render; // used by the test page only
})();
