// SpiderBen10's Arcade — menu + animated marquee. Plain JS, no build step.
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

  // Subject tabs
  var tabsBox = document.getElementById("tabs");
  var tabButtons = TABS.map(function (t) {
    var b = el("button", "tab");
    b.type = "button";
    b.appendChild(el("span", "tab-label", t.label));
    b.appendChild(el("span", "tab-count"));
    b.addEventListener("click", function () { setTab(t.id); blip(); });
    tabsBox.appendChild(b);
    return b;
  });
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
      var b = tabButtons[i], on = t.id === tab;
      b.classList.toggle("on", on);
      b.setAttribute("aria-pressed", on ? "true" : "false");
      b.lastChild.textContent = String(n);
      b.setAttribute("aria-label", t.label + ", " + n + " game" + (n === 1 ? "" : "s"));
    });
  }

  // Topic chips under a subject tab (not under "All").
  var topicsBox = document.getElementById("topics");
  var topicButtons = [], topicsFor = null;
  function setTopicValue(id) {
    topic = id;
    save(TOPIC_KEY, id || "");
  }
  function setTopic(id) {
    setTopicValue(topic === id ? null : id);
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
    var list = TOPICS[t.subject] || [];
    topicsBox.hidden = !list.length;
    if (topicsFor !== t.id) { // rebuild only when the subject changes, so focus stays put
      topicsFor = t.id;
      topicsBox.textContent = "";
      topicButtons = [{ id: null, label: "All " + t.label }].concat(list).map(function (x) {
        var b = el("button", "topic");
        b.type = "button";
        b.appendChild(el("span", "tab-label", x.label));
        b.appendChild(el("span", "tab-count"));
        b.addEventListener("click", function () { setTopic(x.id); blip(); });
        b._topic = x;
        topicsBox.appendChild(b);
        return b;
      });
    }
    topicButtons.forEach(function (b) {
      var x = b._topic, on = x.id === topic;
      var n = games.filter(function (g) { return shown(g, t, x.id); }).length;
      b.classList.toggle("on", on);
      b.classList.toggle("empty", n === 0);
      b.setAttribute("aria-pressed", on ? "true" : "false");
      b.lastChild.textContent = String(n);
      b.setAttribute("aria-label", x.label + ", " + n + " game" + (n === 1 ? "" : "s"));
    });
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
    if (a && a.closest && a.closest("#hero-panel")) return; // the hero maker uses normal keys
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

  /* ------------------------------------------------------------------ */
  /* Marquee scene: night city, moon, and the player's stick-figure hero */
  /* ------------------------------------------------------------------ */

  var canvas = document.getElementById("scene");
  var g = canvas.getContext("2d");
  var W = canvas.width, H = canvas.height;
  g.imageSmoothingEnabled = false;

  /* The banner hero: a stick figure with two dot eyes and no mouth. The player designs it in
     the hero maker (colors, hat, cape and how it moves); the design is saved on this device. */
  var HERO_KEY = "arcade.hero";
  var HERO_OPTIONS = {
    color: { label: "Body", type: "swatch", values: ["#ff3b47", "#4a7bff", "#ffd23f", "#3ddc84", "#b06bff", "#ff6ec7", "#ff8c1a", "#7ff3ff", "#f2f4ff"] },
    head: { label: "Head", type: "swatch", values: ["#f2f4ff", "#fff1c1", "#ffd23f", "#7ff3ff", "#ff9ecf", "#b8f5a0", "#1b1e33"] },
    hat: { label: "Hat", type: "pick", values: ["none", "cap", "beanie", "crown", "top hat", "wizard", "headband", "headphones"] },
    cape: { label: "Cape", type: "swatch", values: ["none", "#e3262f", "#2456e8", "#ffd23f", "#2fbf71", "#8a3ffc", "#ff6ec7", "#1b1e33"] },
    move: { label: "Move", type: "pick", values: ["swing", "run", "fly"] },
  };
  var HERO_SCALE = 1.3; // the pose is drawn in small units, then scaled up
  var HERO_DEFAULT = { color: "#ff3b47", head: "#f2f4ff", hat: "none", cape: "#2456e8", move: "swing" };
  var COLOR_NAMES = {
    "#ff3b47": "red", "#4a7bff": "blue", "#ffd23f": "yellow", "#3ddc84": "green", "#b06bff": "purple",
    "#ff6ec7": "pink", "#ff8c1a": "orange", "#7ff3ff": "cyan", "#f2f4ff": "white", "#fff1c1": "cream",
    "#ff9ecf": "pink", "#b8f5a0": "mint", "#1b1e33": "black", "#e3262f": "red", "#2456e8": "blue",
    "#2fbf71": "green", "#8a3ffc": "purple", none: "none",
  };
  var heroLook = (function () {
    var out = {}, saved = {};
    try { saved = JSON.parse(localStorage.getItem(HERO_KEY) || "{}") || {}; } catch (e) { /* ignore */ }
    Object.keys(HERO_OPTIONS).forEach(function (k) {
      out[k] = HERO_OPTIONS[k].values.indexOf(saved[k]) >= 0 ? saved[k] : HERO_DEFAULT[k];
    });
    return out;
  })();
  function saveHero() { try { localStorage.setItem(HERO_KEY, JSON.stringify(heroLook)); } catch (e) { /* ignore */ } }
  function darkColor(hex) {
    var n = parseInt(hex.slice(1), 16);
    return ((n >> 16) * 299 + ((n >> 8) & 255) * 587 + (n & 255) * 114) / 1000 < 90;
  }

  // Stick-figure pose in local units: neck at (0, 0), head above, y grows downward.
  // Returns the joint positions; drawHero() draws them.
  function heroPose(move, t, sway) {
    var p = { head: [0, -6], neck: [0, 0], hip: [0, 12] };
    if (move === "swing") {
      p.handR = [2, -14]; p.elbowR = [2, -6];               // up on the web line
      p.elbowL = [-5, 4]; p.handL = [-9, 2 + Math.sin(t * 3) * 2];
      var k = sway * 4;
      p.kneeL = [-2 + k, 18]; p.footL = [-3 + k * 1.6, 24];
      p.kneeR = [3 + k, 18]; p.footR = [4 + k * 1.6, 23];
    } else if (move === "run") {
      var c = Math.sin(t * 12), d = Math.cos(t * 12);
      p.kneeL = [4 * c, 18]; p.footL = [7 * c - 2, 24 - Math.max(0, d) * 3];
      p.kneeR = [-4 * c, 18]; p.footR = [-7 * c - 2, 24 - Math.max(0, -d) * 3];
      p.elbowL = [-4 * c, 6]; p.handL = [-4 * c + 3, 9];
      p.elbowR = [4 * c, 6]; p.handR = [4 * c + 3, 9];
    } else { // fly: drawn tipped forward, so "up" here points the way it flies
      p.elbowR = [2, -8]; p.handR = [2, -15];
      p.elbowL = [-2, -8]; p.handL = [-2, -15];
      var f = Math.sin(t * 6) * 1.5;
      p.kneeL = [-1, 18]; p.footL = [-1 + f, 24];
      p.kneeR = [1, 18]; p.footR = [1 - f, 24];
    }
    p.shoulder = [0, 3];
    return p;
  }

  function drawHero(x, y, angle, t, sway, flow) {
    var look = heroLook, p = heroPose(look.move, t, sway);
    g.save();
    g.translate(x, y);
    g.rotate(angle);
    g.scale(HERO_SCALE, HERO_SCALE);
    g.lineCap = "round"; g.lineJoin = "round";

    if (look.cape !== "none") { // behind everything, blowing the other way from where the hero goes
      var w = Math.sin(t * 8) * 1.5;
      g.fillStyle = look.cape;
      g.beginPath();
      g.moveTo(-2, 1); g.lineTo(2, 1);
      g.lineTo(2 + flow * 0.4, 16 + w);
      g.lineTo(-3 + flow, 17 - w);
      g.closePath(); g.fill();
    }

    g.strokeStyle = look.color; g.lineWidth = 2;
    g.beginPath();
    g.moveTo(p.neck[0], p.neck[1]); g.lineTo(p.hip[0], p.hip[1]);                  // body
    [["kneeL", "footL"], ["kneeR", "footR"]].forEach(function (leg) {
      g.moveTo(p.hip[0], p.hip[1]); g.lineTo(p[leg[0]][0], p[leg[0]][1]); g.lineTo(p[leg[1]][0], p[leg[1]][1]);
    });
    [["elbowL", "handL"], ["elbowR", "handR"]].forEach(function (arm) {
      g.moveTo(p.shoulder[0], p.shoulder[1]); g.lineTo(p[arm[0]][0], p[arm[0]][1]); g.lineTo(p[arm[1]][0], p[arm[1]][1]);
    });
    g.stroke();

    // Head: a ring in the body color, filled with the head color, two dot eyes, no mouth.
    var hx = p.head[0], hy = p.head[1];
    g.fillStyle = look.color;
    g.beginPath(); g.arc(hx, hy, 5.5, 0, Math.PI * 2); g.fill();
    g.fillStyle = look.head;
    g.beginPath(); g.arc(hx, hy, 4, 0, Math.PI * 2); g.fill();
    var blink = (t % 4) > 3.85;
    g.fillStyle = darkColor(look.head) ? "#ffffff" : "#05060f";
    g.fillRect(hx - 2.5, hy - 1.5, 1.5, blink ? 0.5 : 2);
    g.fillRect(hx + 1, hy - 1.5, 1.5, blink ? 0.5 : 2);

    drawHat(look.hat, hx, hy, t, flow);
    g.restore();
  }

  function drawHat(hat, hx, hy, t, flow) {
    var top = hy - 5.5;
    if (hat === "cap") {
      g.fillStyle = "#e3262f";
      g.beginPath(); g.arc(hx, top + 3, 5.5, Math.PI, 0); g.fill();
      g.fillRect(hx, top + 2, 8, 1.5);                                            // brim
    } else if (hat === "beanie") {
      g.fillStyle = "#3ddc84";
      g.beginPath(); g.arc(hx, top + 3.5, 5.8, Math.PI, 0); g.fill();
      g.fillStyle = "#f2f4ff"; g.fillRect(hx - 6, top + 2.5, 12, 1.5);
      g.beginPath(); g.arc(hx, top - 3, 1.8, 0, Math.PI * 2); g.fill();          // pom-pom
    } else if (hat === "crown") {
      g.fillStyle = "#ffd23f";
      g.beginPath();
      g.moveTo(hx - 5, top + 2); g.lineTo(hx - 5, top - 4); g.lineTo(hx - 2.5, top - 1);
      g.lineTo(hx, top - 5); g.lineTo(hx + 2.5, top - 1); g.lineTo(hx + 5, top - 4); g.lineTo(hx + 5, top + 2);
      g.closePath(); g.fill();
      g.fillStyle = "#ff3b47"; g.fillRect(hx - 0.75, top - 0.5, 1.5, 1.5);
    } else if (hat === "top hat") {
      g.fillStyle = "#3a2d5c"; g.fillRect(hx - 4, top - 8, 8, 9);
      g.fillRect(hx - 6.5, top + 0.5, 13, 1.5);
      g.fillStyle = "#ff3b47"; g.fillRect(hx - 4, top - 2, 8, 1.5);
    } else if (hat === "wizard") {
      g.fillStyle = "#3a5ad8";
      g.beginPath(); g.moveTo(hx - 6.5, top + 2); g.lineTo(hx + 6.5, top + 2); g.lineTo(hx + 2, top - 12); g.closePath(); g.fill();
      g.fillStyle = "#ffd23f"; g.fillRect(hx - 1, top - 3, 1.5, 1.5); g.fillRect(hx + 1.5, top - 7, 1, 1);
    } else if (hat === "headband") {
      g.fillStyle = "#e3262f"; g.fillRect(hx - 5.5, top + 2, 11, 2);
      g.strokeStyle = "#e3262f"; g.lineWidth = 1.2;
      var w = Math.sin(t * 9);
      g.beginPath();
      g.moveTo(hx - 5, top + 3); g.lineTo(hx - 9 + flow * 0.3, top + 3 + w * 1.5);
      g.moveTo(hx - 5, top + 3); g.lineTo(hx - 8 + flow * 0.3, top + 6 - w * 1.5);
      g.stroke();
    } else if (hat === "headphones") {
      g.strokeStyle = "#1b1e33"; g.lineWidth = 1.5;
      g.beginPath(); g.arc(hx, hy, 6.5, Math.PI * 1.05, Math.PI * 1.95); g.stroke();
      g.fillStyle = "#ff6ec7"; g.fillRect(hx - 7.5, hy - 1.5, 2.5, 4); g.fillRect(hx + 5, hy - 1.5, 2.5, 4);
    }
  }

  function hash(n) { var s = Math.sin(n * 127.1) * 43758.5453; return s - Math.floor(s); }

  var stars = [];
  for (var i = 0; i < 60; i++) stars.push({ x: hash(i) * W, y: hash(i + 99) * 70, p: hash(i + 7) });

  function buildings(seed, count, minH, maxH) {
    var out = [], x = 0;
    for (var i = 0; i < count; i++) {
      var w = 10 + Math.floor(hash(seed + i) * 18);
      var h = minH + Math.floor(hash(seed + i * 3.3) * (maxH - minH));
      out.push({ x: x, w: w, h: h, s: seed + i });
      x += w + (hash(seed + i * 7) > 0.7 ? 3 : 0);
    }
    return { list: out, width: x };
  }
  var back = buildings(10, 40, 18, 46);
  var front = buildings(500, 34, 10, 34);

  function drawCity(layer, offset, color, winA, winB, base) {
    var total = layer.width;
    for (var k = -1; k <= 1; k++) {
      layer.list.forEach(function (b) {
        var x = Math.floor(b.x - (offset % total) + k * total);
        if (x > W || x + b.w < 0) return;
        var top = base - b.h;
        g.fillStyle = color;
        g.fillRect(x, top, b.w, b.h);
        for (var wy = top + 3; wy < base - 3; wy += 4) {
          for (var wx = x + 2; wx < x + b.w - 2; wx += 3) {
            var r = hash(b.s * 31 + wx * 0.7 + wy * 1.3);
            if (r > 0.72) { g.fillStyle = r > 0.93 ? winB : winA; g.fillRect(wx, wy, 1, 1); }
          }
        }
        if (hash(b.s + 5) > 0.8) { // rooftop antenna with a red beacon
          g.fillStyle = color; g.fillRect(x + (b.w >> 1), top - 5, 1, 5);
          g.fillStyle = frame % 60 < 30 ? "#ff3040" : "#5a0d14"; g.fillRect(x + (b.w >> 1), top - 6, 1, 1);
        }
      });
    }
  }

  function drawWeb() { // corner web, top-left
    g.strokeStyle = "rgba(159,176,224,0.45)";
    g.lineWidth = 1;
    var spokes = [0.05, 0.3, 0.6, 0.9, 1.25, 1.52];
    g.beginPath();
    spokes.forEach(function (a) { g.moveTo(0.5, 0.5); g.lineTo(0.5 + Math.cos(a) * 60, 0.5 + Math.sin(a) * 60); });
    [14, 28, 42, 56].forEach(function (r) {
      spokes.forEach(function (a, j) {
        var p = [Math.cos(a) * r, Math.sin(a) * r];
        if (j === 0) g.moveTo(p[0], p[1]); else g.lineTo(p[0], p[1]);
      });
    });
    g.stroke();
  }

  var frame = 0;
  var t0 = performance.now();
  function draw(now) {
    var t = (now - t0) / 1000;
    frame++;
    var sky = g.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, "#050818");
    sky.addColorStop(0.7, "#0d1440");
    sky.addColorStop(1, "#2a0c2c");
    g.fillStyle = sky;
    g.fillRect(0, 0, W, H);

    stars.forEach(function (s) {
      var tw = (frame + s.p * 200) % 120 < 6;
      g.fillStyle = s.p > 0.75 && !tw ? "#ffffff" : "#5a6ad0";
      g.fillRect(Math.floor(s.x), Math.floor(s.y), 1, 1);
    });

    // Moon (a nod to Lunar Patrol)
    g.fillStyle = "#fff4c8";
    for (var y = -11; y <= 11; y++) {
      var half = Math.floor(Math.sqrt(121 - y * y));
      g.fillRect(268 - half, 26 + y, half * 2, 1);
    }
    g.fillStyle = "#e8d8a0";
    g.fillRect(262, 20, 3, 3); g.fillRect(271, 29, 4, 3); g.fillRect(266, 33, 2, 2);

    drawWeb();
    drawCity(back, t * 6, "#131d5c", "#3a5ad8", "#7ff3ff", H);
    drawCity(front, t * 14, "#070b24", "#ffd23f", "#ff5a64", H);

    var move = heroLook.move;
    if (move === "swing") { // swinging on a web line; the anchor drifts across the sky
      var span = W + 120;
      var ax = ((t * 22 + 150) % span) - 60; // starts mid-sky so the hero is visible right away
      var ay = -12;
      var ang = Math.sin(t * 1.8) * 0.65;
      var len = 36;
      var hx = ax + Math.sin(ang) * len;
      var hy = ay + Math.cos(ang) * len;
      g.strokeStyle = "#f2f4ff"; g.lineWidth = 1;
      g.beginPath(); g.moveTo(ax, ay); g.lineTo(hx, hy); g.stroke();
      // Hang from the raised hand (local 2, -14), tilted with the swing.
      var tilt = -ang * 0.6, c = Math.cos(tilt), s = Math.sin(tilt);
      var S = HERO_SCALE, ox = hx - S * (2 * c + 14 * s), oy = hy - S * (2 * s - 14 * c);
      drawHero(ox, oy, tilt, t, Math.cos(t * 1.8), -Math.cos(t * 1.8) * 6);
    } else if (move === "run") { // running along a web strand stretched across the sky
      var rx = ((t * 34 + 120) % (W + 60)) - 30;
      var strand = function (x) { var d = (x - rx) / 40; return 50 + 4 * Math.sin(Math.PI * x / W) + 8 * Math.exp(-d * d); };
      g.strokeStyle = "rgba(242,244,255,0.75)"; g.lineWidth = 1;
      g.beginPath(); g.moveTo(0, strand(0));
      for (var sx = 4; sx <= W; sx += 4) g.lineTo(sx, strand(sx));
      g.stroke();
      drawHero(rx, strand(rx) - 24 * HERO_SCALE - Math.abs(Math.sin(t * 12)) * 1.5, 0.12, t, 0, -8);
    } else { // flying across the sky, tipped forward like a superhero
      var fx = ((t * 40 + 120) % (W + 80)) - 40;
      var fy = 44 + Math.sin(t * 1.6) * 14;
      drawHero(fx, fy, Math.PI / 2 - 0.15 + Math.cos(t * 1.6) * 0.1, t, 0, -3);
    }

    if (!reduceMotion) requestAnimationFrame(draw);
  }
  requestAnimationFrame(draw);

  /* ------------------------------------------------------------------ */
  /* Hero maker: pick the banner hero's colors, hat, cape and move.     */
  /* ------------------------------------------------------------------ */

  var heroBtn = document.getElementById("hero-btn");
  var heroPanel = document.getElementById("hero-panel");
  var heroBox = document.getElementById("hero-options");
  var heroChoices = [];

  Object.keys(HERO_OPTIONS).forEach(function (key) {
    var opt = HERO_OPTIONS[key];
    var row = el("div", "hero-group");
    row.setAttribute("role", "group");
    row.setAttribute("aria-label", opt.label);
    row.appendChild(el("span", "hero-group-label", opt.label));
    opt.values.forEach(function (v) {
      var b;
      if (opt.type === "swatch") {
        b = el("button", "swatch" + (v === "none" ? " none" : ""));
        if (v !== "none") b.style.background = v;
        b.setAttribute("aria-label", opt.label + ": " + (COLOR_NAMES[v] || v));
        b.title = COLOR_NAMES[v] || v;
      } else {
        b = el("button", "pick", v);
        b.setAttribute("aria-label", opt.label + ": " + v);
      }
      b.type = "button";
      b.addEventListener("click", function () { heroLook[key] = v; heroChanged(); blip(); });
      heroChoices.push({ key: key, value: v, button: b });
      row.appendChild(b);
    });
    heroBox.appendChild(row);
  });

  function renderHeroChoices() {
    heroChoices.forEach(function (c) { c.button.setAttribute("aria-pressed", heroLook[c.key] === c.value ? "true" : "false"); });
  }
  function heroChanged() {
    saveHero();
    renderHeroChoices();
    if (reduceMotion) requestAnimationFrame(draw); // no animation loop, so draw the new look once
  }
  function openHeroPanel(open) {
    heroPanel.hidden = !open;
    heroBtn.setAttribute("aria-expanded", open ? "true" : "false");
    if (open) {
      var first = heroPanel.querySelector('[aria-pressed="true"]');
      if (first) first.focus();
    } else {
      heroBtn.focus();
    }
  }
  heroBtn.addEventListener("click", function () { openHeroPanel(heroPanel.hidden); blip(); });
  document.getElementById("hero-done").addEventListener("click", function () { openHeroPanel(false); coin(); });
  document.getElementById("hero-reset").addEventListener("click", function () {
    Object.keys(HERO_DEFAULT).forEach(function (k) { heroLook[k] = HERO_DEFAULT[k]; });
    heroChanged(); blip();
  });
  document.getElementById("hero-random").addEventListener("click", function () {
    Object.keys(HERO_OPTIONS).forEach(function (k) {
      var vs = HERO_OPTIONS[k].values;
      heroLook[k] = vs[Math.floor(Math.random() * vs.length)];
    });
    if (heroLook.head === heroLook.color) heroLook.head = HERO_DEFAULT.head; // keep the eyes and ring visible
    heroChanged(); blip();
  });
  heroPanel.addEventListener("keydown", function (ev) {
    if (ev.key === "Escape") { ev.preventDefault(); openHeroPanel(false); }
  });
  renderHeroChoices();
})();
