// SpiderBen10's Arcade — credits page. Builds the table from games.js. Plain JS, no build step.
(function () {
  "use strict";

  var games = window.GAMES || [];
  var GRADES = ["K", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];

  function validGrade(v) { return typeof v === "string" && GRADES.indexOf(v.toUpperCase()) >= 0 ? v.toUpperCase() : null; }
  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }
  function pad2(n) { return n < 10 ? "0" + n : String(n); }

  // Keep the chosen grade on the way back to the menu.
  var grade = null;
  try { grade = validGrade(new URLSearchParams(window.location.search).get("grade") || ""); } catch (e) { /* ignore */ }
  if (!grade) { try { grade = validGrade(localStorage.getItem("arcade.grade") || ""); } catch (e) { /* ignore */ } }
  if (grade) document.getElementById("back").href = "./?grade=" + encodeURIComponent(grade);

  var credits = document.getElementById("credits");
  games.filter(function (game) { return !!game.url; }).forEach(function (game, i) {
    var tr = el("tr");
    tr.appendChild(el("td", null, pad2(i + 1)));
    tr.appendChild(el("td", null, game.title));
    tr.appendChild(el("td", "creator", "SpiderBen10 (NZDO)"));
    tr.appendChild(el("td", null, String(game.year)));
    credits.appendChild(tr);
  });
  document.getElementById("year").textContent = String(new Date().getFullYear());
})();
