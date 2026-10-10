// SpiderBen10's Arcade — the menu. The banner and themes are in marquee.js. Plain JS, no build step.
(function () {
  "use strict";

  var games = window.GAMES || [];
  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ------------------------------------------------------------------ */
  /* Grade picker (K-12). The choice rides along to every game as        */
  /* ?grade=, and games link back with it, so it sticks across the arcade.*/
  /* ------------------------------------------------------------------ */

  var GRADES = ["K", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];
  var GRADE_KEY = "arcade.grade";

  function validGrade(v) { return typeof v === "string" && GRADES.indexOf(v.toUpperCase()) >= 0 ? v.toUpperCase() : null; }
  function gradeName(g) { return g === "K" ? "Kindergarten" : "Grade " + g; }
  function supports(game, g) { return !game.grades || game.grades.indexOf(g) >= 0; }
  function gradesLabel(game) {
    var gs = game.grades, n = gs.length;
    var run = n > 2 && GRADES.indexOf(gs[n - 1]) - GRADES.indexOf(gs[0]) === n - 1;
    return run ? "Grades " + gs[0] + "–" + gs[n - 1] + " only" : "Grade " + gs.join(", ") + " only";
  }

  var grade = (function () {
    try {
      var q = validGrade(new URLSearchParams(window.location.search).get("grade") || "");
      if (q) return q;
    } catch (e) { /* ignore */ }
    try {
      var s = validGrade(localStorage.getItem(GRADE_KEY) || "");
      if (s) return s;
    } catch (e) { /* ignore */ }
    return "6";
  })();

  var picker = document.getElementById("grade-select");
  var gradeNow = document.getElementById("grade-now");
  GRADES.forEach(function (g) {
    var o = el("option", null, gradeName(g));
    o.value = g;
    picker.appendChild(o);
  });
  picker.addEventListener("change", function () { setGrade(picker.value); blip(); });

  function setGrade(g) {
    grade = g;
    try { localStorage.setItem(GRADE_KEY, g); } catch (e) { /* ignore */ }
    picker.value = g;
    gradeNow.textContent = gradeName(g);
    renderAdapt();
    updateGradeLinks();
    renderCabinets();
  }

  /* Adaptive math (kit/adaptive.ts reads the same keys): the math level rises after right
     answers and falls after wrong ones, up to 2 grades either side of the chosen grade. */
  var ADAPT_KEY = "arcade.adaptiveMath";
  var adaptBtn = document.getElementById("adapt-btn");
  var adaptNote = document.getElementById("adapt-note");
  var adaptReset = document.getElementById("adapt-reset");
  function adaptOn() { try { return localStorage.getItem(ADAPT_KEY) !== "0"; } catch (e) { return true; } }
  function mathLevel() {
    try {
      var raw = localStorage.getItem("arcade.mathLevel." + grade);
      var v = raw === null ? NaN : Number(raw);
      if (isFinite(v)) return v;
    } catch (e) { /* ignore */ }
    return GRADES.indexOf(grade);
  }
  function levelName(v) {
    var lo = Math.floor(v + 0.001), name = lo === 0 ? "K" : String(lo);
    var part = v - lo;
    return part < 0.1 ? "Now at grade " + name : "Now between grade " + name + " and " + GRADES[Math.min(12, lo + 1)];
  }
  function renderAdapt() {
    var on = adaptOn();
    adaptBtn.innerHTML = "Adaptive math: <strong>" + (on ? "ON" : "OFF") + "</strong>";
    adaptBtn.setAttribute("aria-pressed", on ? "true" : "false");
    adaptBtn.classList.toggle("on", on);
    var v = mathLevel(), base = GRADES.indexOf(grade);
    adaptNote.textContent = on
      ? "Math gets harder when you're right and easier when you miss. " + levelName(v) + "."
      : "Math questions stay at " + gradeName(grade).toLowerCase() + ".";
    adaptReset.hidden = !on || Math.abs(v - base) < 0.05;
  }
  adaptBtn.addEventListener("click", function () {
    try { localStorage.setItem(ADAPT_KEY, adaptOn() ? "0" : "1"); } catch (e) { /* ignore */ }
    renderAdapt();
    blip();
  });
  adaptReset.addEventListener("click", function () {
    try { localStorage.removeItem("arcade.mathLevel." + grade); } catch (e) { /* ignore */ }
    renderAdapt();
    blip();
  });

  /* ------------------------------------------------------------------ */
  /* Menu: subject tabs, "fits my grade" filter, favorites / recently    */
  /* played / new shelves, and the cabinet grid (a compact list on phones)*/
  /* ------------------------------------------------------------------ */

  var TAB_KEY = "arcade.tab", TOPIC_KEY = "arcade.topic", FIT_KEY = "arcade.fitsGrade", RECENT_KEY = "arcade.recent", FAV_KEY = "arcade.favorites";
  var RECENT_MAX = 4, NEW_DAYS = 30;
  var TABS = [
    { id: "all", label: "All", subject: null },
    { id: "math", label: "Math", subject: "Math" },
    { id: "science", label: "Science", subject: "Science" },
    { id: "ela", label: "Reading & Writing", subject: "ELA" },
    { id: "social", label: "Social Studies", subject: "Social Studies" },
  ];
  var SUBJECT_NAMES = { ELA: "Reading & Writing" };
  var TOPICS = window.TOPICS || {};

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }
  function load(key) { try { return localStorage.getItem(key); } catch (e) { return null; } }
  function save(key, v) { try { localStorage.setItem(key, v); } catch (e) { /* ignore */ } }
  function loadIds(key) {
    try {
      var v = JSON.parse(load(key) || "[]");
      return Array.isArray(v) ? v.filter(function (id) { return typeof id === "string"; }) : [];
    } catch (e) { return []; }
  }
  function byId(id) { for (var i = 0; i < games.length; i++) if (games[i].id === id) return games[i]; return null; }

  var tab = (function () {
    var t = load(TAB_KEY);
    for (var i = 0; i < TABS.length; i++) if (TABS[i].id === t) return t;
    return "all";
  })();
  var topic = topicDef(tab, load(TOPIC_KEY)) ? load(TOPIC_KEY) : null; // null = every topic
  var fitsOnly = load(FIT_KEY) !== "0";
  var favorites = loadIds(FAV_KEY);
  var recent = loadIds(RECENT_KEY);

  function tabDef(id) { for (var i = 0; i < TABS.length; i++) if (TABS[i].id === id) return TABS[i]; return TABS[0]; }
  function topicDef(tabId, id) {
    var list = TOPICS[tabDef(tabId).subject] || [];
    for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
    return null;
  }
  function inTab(game, t) { return !t.subject || (game.subjects || []).indexOf(t.subject) >= 0; }
  function inTopic(game, tp) { return !tp || (game.topics || []).indexOf(tp) >= 0; }
  // tp: a topic id, or undefined for the current topic, or null for every topic.
  function shown(game, t, tp) {
    return inTab(game, t) && inTopic(game, tp === undefined ? topic : tp) && (!fitsOnly || supports(game, grade));
  }
  function isNew(game) {
    if (game.new === true) return true;
    if (!game.added) return false;
    var t = Date.parse(game.added + "T00:00:00");
    var age = (Date.now() - t) / 864e5;
    return isFinite(age) && age >= -1 && age < NEW_DAYS;
  }

  // Subject and topic dropdowns. The topic dropdown only shows once a subject is picked.
  var subjectSelect = document.getElementById("subject-select");
  var topicSelect = document.getElementById("topic-select");
  var topicField = document.getElementById("topic-field");
  TABS.forEach(function (t) {
    var o = el("option");
    o.value = t.id;
    subjectSelect.appendChild(o);
  });
  subjectSelect.addEventListener("change", function () { setTab(subjectSelect.value); blip(); });
  topicSelect.addEventListener("change", function () { setTopic(topicSelect.value || null); blip(); });

  function countLabel(label, n) { return label + " (" + n + ")"; }
  function setTab(id) {
    var changed = tabDef(id).id !== tab;
    tab = tabDef(id).id;
    save(TAB_KEY, tab);
    if (changed) setTopicValue(null);
    selectedKey = null;
    renderCabinets();
  }
  function stepTab(d) {
    var i = TABS.indexOf(tabDef(tab)) + d;
    setTab(TABS[(i + TABS.length) % TABS.length].id);
    blip();
  }
  function renderTabs() {
    TABS.forEach(function (t, i) {
      var n = games.filter(function (g) { return shown(g, t, null); }).length;
      subjectSelect.options[i].textContent = countLabel(t.id === "all" ? "All subjects" : t.label, n);
    });
    subjectSelect.value = tab;
  }

  var topicsFor = null;
  function setTopicValue(id) {
    topic = id;
    save(TOPIC_KEY, id || "");
  }
  function setTopic(id) {
    setTopicValue(id);
    selectedKey = null;
    renderCabinets();
  }
  function topicChoices() { return [null].concat((TOPICS[tabDef(tab).subject] || []).map(function (x) { return x.id; })); }
  function stepTopic(d) {
    var list = topicChoices();
    if (list.length < 2) return;
    var i = list.indexOf(topic) + d;
    setTopicValue(list[(i + list.length) % list.length]);
    selectedKey = null;
    renderCabinets();
    blip();
  }
  function renderTopics() {
    var t = tabDef(tab);
    var list = [{ id: "", label: "All " + t.label + " topics" }].concat(TOPICS[t.subject] || []);
    topicField.hidden = list.length < 2;
    if (topicsFor !== t.id) { // rebuild only when the subject changes
      topicsFor = t.id;
      topicSelect.textContent = "";
      list.forEach(function (x) {
        var o = el("option");
        o.value = x.id;
        o._label = x.label;
        topicSelect.appendChild(o);
      });
    }
    Array.prototype.forEach.call(topicSelect.options, function (o) {
      var n = games.filter(function (g) { return shown(g, t, o.value || null); }).length;
      o.textContent = countLabel(o._label, n);
    });
    topicSelect.value = topic || "";
  }

  // "Fits my grade" filter
  var fitBtn = document.getElementById("fit-btn");
  var fitNote = document.getElementById("fit-note");
  fitBtn.addEventListener("click", function () {
    fitsOnly = !fitsOnly;
    save(FIT_KEY, fitsOnly ? "1" : "0");
    renderCabinets();
    blip();
  });
  function renderFit() {
    fitBtn.innerHTML = "Fits my grade: <strong>" + (fitsOnly ? "ON" : "OFF") + "</strong>";
    fitBtn.setAttribute("aria-pressed", fitsOnly ? "true" : "false");
    fitBtn.classList.toggle("on", fitsOnly);
    var hidden = games.filter(function (g) { return inTab(g, tabDef(tab)) && inTopic(g, topic) && !supports(g, grade); }).length;
    fitNote.textContent = fitsOnly
      ? (hidden ? hidden + " game" + (hidden === 1 ? "" : "s") + " for other grades hidden." : "Every game here fits " + gradeName(grade).toLowerCase() + ".")
      : "Showing every game. Ones for other grades are greyed out.";
  }

  function toggleFavorite(id) {
    var i = favorites.indexOf(id);
    if (i >= 0) favorites.splice(i, 1); else favorites.push(id);
    save(FAV_KEY, JSON.stringify(favorites));
  }
  function recordLaunch(id) {
    recent = [id].concat(recent.filter(function (r) { return r !== id; })).slice(0, RECENT_MAX);
    save(RECENT_KEY, JSON.stringify(recent));
  }
  function launch(card) {
    recordLaunch(card.getAttribute("data-game"));
    coin();
    window.location.href = card.href;
  }

  var shelvesBox = document.getElementById("shelves");
  var emptyNote = document.getElementById("empty");
  var cabinets = [];
  var selected = 0;
  var selectedKey = null; // "shelf:gameId", so the highlight survives re-renders

  function gameHref(game) {
    return game.url + (game.url.indexOf("?") >= 0 ? "&" : "?") + "grade=" + encodeURIComponent(grade);
  }
  function updateGradeLinks() {
    var links = document.querySelectorAll("a[data-keep-grade]");
    for (var i = 0; i < links.length; i++) links[i].href = "credits.html?grade=" + encodeURIComponent(grade);
  }

  function cabinetItem(game, shelf, mini) {
    var li = el("li");
    var live = !!game.url;
    var fits = supports(game, grade);
    var card = el(live ? "a" : "div", "cabinet" + (live ? "" : " soon") + (fits ? "" : " off-grade"));
    card.setAttribute("data-game", game.id);
    card.setAttribute("data-shelf", shelf);
    if (live) {
      card.href = gameHref(game);
      card.setAttribute("aria-label", "Play " + game.title + ", " + gradeName(grade) + (fits ? "" : " (" + gradesLabel(game) + ")"));
      card.addEventListener("click", function (ev) {
        if (ev.ctrlKey || ev.metaKey || ev.shiftKey || ev.button) return; // opened elsewhere
        recordLaunch(game.id);
        coin();
      });
      card.addEventListener("focus", function () { select(cabinets.indexOf(card), false); });
    }

    var n = games.indexOf(game) + 1;
    card.appendChild(el("div", "cab-top", "Game " + n + (live ? " · Player 1" : " · Coming soon")));
    var screen = el("div", "screen");
    if (game.image) {
      var img = el("img");
      img.src = game.image;
      img.alt = game.title + " gameplay";
      img.loading = "lazy";
      screen.appendChild(img);
    } else {
      screen.appendChild(el("span", null, "Now building…"));
    }
    card.appendChild(screen);

    var body = el("div", "body");
    body.appendChild(el("h3", null, game.title));
    if (!mini) body.appendChild(el("p", "tagline", game.tagline));
    var chips = el("div", "chips");
    chips.appendChild(el("span", "chip grade" + (fits ? "" : " off"), fits ? gradeName(grade) : gradesLabel(game)));
    if (isNew(game)) chips.appendChild(el("span", "chip new", "New"));
    if (window.ARCADE_ENV === "dev" && live && !game.prod) chips.appendChild(el("span", "chip dev", "Dev only"));
    (game.subjects || []).forEach(function (s) { chips.appendChild(el("span", "chip", SUBJECT_NAMES[s] || s)); });
    body.appendChild(chips);
    card.appendChild(body);
    if (live) card.appendChild(el("div", "start", "Press start ▶"));
    li.appendChild(card);

    var fav = favorites.indexOf(game.id) >= 0;
    var star = el("button", "fav" + (fav ? " on" : ""), fav ? "★" : "☆");
    star.type = "button";
    star.setAttribute("aria-pressed", fav ? "true" : "false");
    star.setAttribute("aria-label", "Favorite " + game.title);
    star.title = fav ? "Remove from favorites (F)" : "Add to favorites (F)";
    star.setAttribute("data-game", game.id);
    star.setAttribute("data-shelf", shelf);
    star.addEventListener("click", function () {
      toggleFavorite(game.id);
      renderCabinets();
      var again = shelvesBox.querySelector('.fav[data-shelf="' + shelf + '"][data-game="' + game.id + '"]') ||
        shelvesBox.querySelector('.fav[data-game="' + game.id + '"]');
      if (again) again.focus();
      blip();
    });
    li.appendChild(star);
    return li;
  }

  function shelf(id, title, list, mini) {
    if (!list.length) return;
    var sec = el("section", "shelf shelf-" + id);
    sec.setAttribute("aria-label", title);
    var head = el("h3", "shelf-title", title);
    head.appendChild(el("span", "shelf-count", " " + list.length));
    sec.appendChild(head);
    var ul = el("ul", "cabinets" + (mini ? " mini" : ""));
    ul.setAttribute("role", "list");
    list.forEach(function (game) { ul.appendChild(cabinetItem(game, id, mini)); });
    sec.appendChild(ul);
    shelvesBox.appendChild(sec);
  }

  function renderCabinets() {
    var t = tabDef(tab);
    var keep = selectedKey;
    renderTabs();
    renderTopics();
    renderFit();
    shelvesBox.textContent = "";
    function pick(ids) {
      return ids.map(byId).filter(function (g) { return g && shown(g, t); });
    }
    shelf("favorites", "★ Favorites", pick(favorites), true);
    shelf("recent", "Recently played", pick(recent), true);
    shelf("new", "New", games.filter(function (g) { return isNew(g) && shown(g, t); }), true);
    var main = games.filter(function (g) { return shown(g, t); });
    var tp = topicDef(tab, topic);
    shelf("all", tp ? tp.label + " games" : t.subject ? t.label + " games" : "All games", main, false);
    emptyNote.hidden = main.length > 0;

    cabinets = Array.prototype.slice.call(shelvesBox.querySelectorAll("a.cabinet"));
    var idx = -1;
    if (keep) cabinets.forEach(function (c, j) { if (idx < 0 && keyOf(c) === keep) idx = j; });
    if (idx < 0 && keep) { // the same game on another shelf, else the first
      var gid = keep.split(":")[1];
      cabinets.forEach(function (c, j) { if (idx < 0 && c.getAttribute("data-game") === gid) idx = j; });
    }
    select(idx < 0 ? Math.max(0, Math.min(selected, cabinets.length - 1)) : idx, false);
  }
  function keyOf(c) { return c.getAttribute("data-shelf") + ":" + c.getAttribute("data-game"); }

  document.getElementById("year").textContent = String(new Date().getFullYear());

  // Keyboard: arrows move between the visible cabinets, Enter/Space launches,
  // [ and ] change grade, , and . (or < and >) change subject, ; and ' change topic, F stars the
  // selected game. Tab / Shift+Tab keep their normal focus behavior.
  function select(i, focus) {
    if (!cabinets.length) { selectedKey = null; return; }
    selected = ((i % cabinets.length) + cabinets.length) % cabinets.length;
    cabinets.forEach(function (c, j) { c.classList.toggle("selected", j === selected); });
    selectedKey = keyOf(cabinets[selected]);
    if (focus) {
      cabinets[selected].focus();
      if (cabinets[selected].scrollIntoView) cabinets[selected].scrollIntoView({ block: "nearest" });
    }
  }
  document.addEventListener("keydown", function (ev) {
    if (ev.ctrlKey || ev.metaKey || ev.altKey) return;
    var k = ev.key;
    var a = document.activeElement;
    var typing = a && (a.tagName === "INPUT" || a.tagName === "TEXTAREA" || a.tagName === "SELECT" || a.isContentEditable);
    if (typing) return;
    if (a && a.closest && a.closest("#profile-panel")) return; // the player menu uses normal keys
    if (k === "[" || k === "]") {
      var gi = GRADES.indexOf(grade) + (k === "]" ? 1 : -1);
      if (gi >= 0 && gi < GRADES.length) { setGrade(GRADES[gi]); blip(); }
      return;
    }
    if (k === "," || k === "<") { ev.preventDefault(); stepTab(-1); return; }
    if (k === "." || k === ">") { ev.preventDefault(); stepTab(1); return; }
    if (k === ";") { ev.preventDefault(); stepTopic(-1); return; }
    if (k === "'") { ev.preventDefault(); stepTopic(1); return; }
    if (!cabinets.length) return;
    if (k === "f" || k === "F") {
      var cur = cabinets[selected];
      var refocus = a === cur;
      toggleFavorite(cur.getAttribute("data-game"));
      renderCabinets();
      if (refocus && cabinets[selected]) cabinets[selected].focus();
      blip();
      return;
    }
    if (k === "ArrowRight" || k === "ArrowDown") { ev.preventDefault(); select(selected + 1, true); blip(); }
    else if (k === "ArrowLeft" || k === "ArrowUp") { ev.preventDefault(); select(selected - 1, true); blip(); }
    else if (k === "Enter" || k === " ") {
      // Buttons (grade, tabs, stars, switches) and focused links handle their own Enter/Space.
      if (a && a.classList && a.classList.contains("cabinet")) {
        if (k === " ") { ev.preventDefault(); launch(a); }
        return; // Enter follows the focused link itself
      }
      if (a && a !== document.body && (a.tagName === "BUTTON" || a.tagName === "A")) return;
      ev.preventDefault();
      launch(cabinets[selected]);
    }
  });

  setGrade(grade);

  /* ------------------------------------------------------------------ */
  /* Sounds (only after the player interacts)                            */
  /* ------------------------------------------------------------------ */

  var actx = null;
  function tone(f, t0, dur, vol) {
    try {
      if (!actx) actx = new (window.AudioContext || window.webkitAudioContext)();
      var o = actx.createOscillator(), g = actx.createGain();
      o.type = "square"; o.frequency.value = f;
      g.gain.setValueAtTime(vol, actx.currentTime + t0);
      g.gain.exponentialRampToValueAtTime(0.001, actx.currentTime + t0 + dur);
      o.connect(g).connect(actx.destination);
      o.start(actx.currentTime + t0); o.stop(actx.currentTime + t0 + dur + 0.02);
    } catch (e) { /* audio unavailable */ }
  }
  function blip() { tone(880, 0, 0.05, 0.05); }
  function coin() { tone(988, 0, 0.08, 0.08); tone(1319, 0.08, 0.25, 0.08); }
  window.ArcadeSound = { blip: blip, coin: coin }; // marquee.js uses these too
})();
