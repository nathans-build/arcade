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
  /* Menu: search, play-style chips, subject/topic/length/sort filters,  */
  /* "fits my grade", the top shelves (New, Favorites, Recently played,  */
  /* Try next, Most played this week), one row per play style, and the   */
  /* cabinets (a compact list on phones).                                 */
  /* ------------------------------------------------------------------ */

  // Every key here is per player: profile.js swaps all arcade.* keys when players switch.
  var TAB_KEY = "arcade.tab", TOPIC_KEY = "arcade.topic", FIT_KEY = "arcade.fitsGrade", RECENT_KEY = "arcade.recent", FAV_KEY = "arcade.favorites";
  var STYLE_KEY = "arcade.style", LENGTH_KEY = "arcade.length", SORT_KEY = "arcade.sort";
  var PLAYED_KEY = "arcade.played", SURPRISE_KEY = "arcade.lastSurprise", SPOTLIGHT_KEY = "arcade.lastSpotlight";
  var RECENT_MAX = 4, NEW_DAYS = 30;
  var ROW_PHONE_MAX = 4;   // phones show this many games per style row, then "See all"
  var TRY_MAX = 6, TRY_MIN = 3;
  var POPULAR_MAX = 5, POPULAR_MIN = 3, POPULAR_TINY = 5, POPULAR_TIMEOUT = 4000;
  var TABS = [
    { id: "all", label: "All", subject: null },
    { id: "math", label: "Math", subject: "Math" },
    { id: "science", label: "Science", subject: "Science" },
    { id: "ela", label: "Reading & Writing", subject: "ELA" },
    { id: "social", label: "Social Studies", subject: "Social Studies" },
  ];
  var SUBJECT_NAMES = { ELA: "Reading & Writing" };
  var TOPICS = window.TOPICS || {};
  var STYLES = window.STYLES || [];
  var LENGTHS = { quick: { icon: "⏱️", label: "Quick" }, adventure: { icon: "💾", label: "Adventure" } };
  var SORTS = ["recommended", "az", "newest", "recent"];

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
  var orderOf = {};
  games.forEach(function (g, i) { orderOf[g.id] = i; });

  var tab = (function () {
    var t = load(TAB_KEY);
    for (var i = 0; i < TABS.length; i++) if (TABS[i].id === t) return t;
    return "all";
  })();
  var topic = topicDef(tab, load(TOPIC_KEY)) ? load(TOPIC_KEY) : null; // null = every topic
  var fitsOnly = load(FIT_KEY) !== "0";
  var favorites = loadIds(FAV_KEY);
  var recent = loadIds(RECENT_KEY);
  var style = styleDef(load(STYLE_KEY)) ? load(STYLE_KEY) : "";      // "" = all styles
  var lengthF = LENGTHS[load(LENGTH_KEY) || ""] ? load(LENGTH_KEY) : ""; // "" = any length
  var sortBy = SORTS.indexOf(load(SORT_KEY)) >= 0 ? load(SORT_KEY) : "recommended";
  var query = "", searchAll = false;

  // Launch history: { gameId: { n: launches, t: last launch time } }, on this device only.
  // It drives "Recently played" sorting, Surprise me (prefers unplayed games) and Try next.
  var played = (function () {
    var out = {};
    try {
      var v = JSON.parse(load(PLAYED_KEY) || "{}");
      if (v && typeof v === "object" && !Array.isArray(v)) {
        Object.keys(v).forEach(function (id) {
          var x = v[id];
          if (x && isFinite(x.t)) out[id] = { n: Math.max(1, Number(x.n) || 1), t: Number(x.t) };
        });
      }
    } catch (e) { /* ignore */ }
    // Players from before the history existed: start it from their recently played list.
    recent.forEach(function (id, i) { if (!out[id]) out[id] = { n: 1, t: Date.now() - (i + 1) * 60000 }; });
    return out;
  })();
  function hasPlayed(id) { return !!played[id] || recent.indexOf(id) >= 0; }
  function lastPlayed(g) { return played[g.id] ? played[g.id].t : 0; }

  function tabDef(id) { for (var i = 0; i < TABS.length; i++) if (TABS[i].id === id) return TABS[i]; return TABS[0]; }
  function topicDef(tabId, id) {
    var list = TOPICS[tabDef(tabId).subject] || [];
    for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
    return null;
  }
  function styleDef(id) { for (var i = 0; i < STYLES.length; i++) if (STYLES[i].id === id) return STYLES[i]; return null; }
  function inTab(game, t) { return !t.subject || (game.subjects || []).indexOf(t.subject) >= 0; }
  function inTopic(game, tp) { return !tp || (game.topics || []).indexOf(tp) >= 0; }
  function inStyle(game, s) { return !s || (game.styles || []).indexOf(s) >= 0; }
  function inLength(game, l) { return !l || game.length === l; }
  // Subject, topic, style and length filters (not the grade).
  function inFilters(game, t, tp) {
    return inTab(game, t) && inTopic(game, tp === undefined ? topic : tp) && inStyle(game, style) && inLength(game, lengthF);
  }
  // tp: a topic id, or undefined for the current topic, or null for every topic.
  function shown(game, t, tp) {
    return inFilters(game, t, tp) && (!fitsOnly || supports(game, grade));
  }
  // "New" = the latest batch: added in the last NEW_DAYS days AND within BATCH_DAYS of the newest
  // game, so an older game drops off the New row as soon as a newer batch arrives.
  var BATCH_DAYS = 7;
  var newestAdded = games.reduce(function (m, g) {
    var t = g.url && g.added ? Date.parse(g.added + "T00:00:00") : NaN;
    return isFinite(t) && t > m ? t : m;
  }, 0);
  function isNew(game) {
    if (game.new === true) return true;
    if (!game.added) return false;
    var t = Date.parse(game.added + "T00:00:00");
    var age = (Date.now() - t) / 864e5;
    return isFinite(age) && age >= -1 && age < NEW_DAYS && (newestAdded - t) / 864e5 <= BATCH_DAYS;
  }

  /** Sort menu: Recommended (games.js order), A–Z, Newest (by `added`, then order), Recently played. */
  function sortGames(list) {
    var cmp = function () { return 0; };
    if (sortBy === "az") cmp = function (a, b) { return a.title.localeCompare(b.title, undefined, { sensitivity: "base" }); };
    else if (sortBy === "newest") cmp = function (a, b) { return (b.added || "").localeCompare(a.added || ""); };
    else if (sortBy === "recent") cmp = function (a, b) { return lastPlayed(b) - lastPlayed(a); };
    return list.slice().sort(function (a, b) { return cmp(a, b) || orderOf[a.id] - orderOf[b.id]; });
  }

  var phoneMQ = window.matchMedia ? window.matchMedia("(max-width: 599.98px)") : null;
  function isPhone() { return !!(phoneMQ && phoneMQ.matches); }

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

  // Length (⏱️ Quick / 💾 Adventure) and sort dropdowns
  var lengthSelect = document.getElementById("length-select");
  var sortSelect = document.getElementById("sort-select");
  var LENGTH_NAMES = { "": "Any length", quick: "⏱️ Quick", adventure: "💾 Adventure" };
  lengthSelect.addEventListener("change", function () {
    lengthF = LENGTHS[lengthSelect.value] ? lengthSelect.value : "";
    save(LENGTH_KEY, lengthF);
    selectedKey = null;
    renderCabinets();
    blip();
  });
  sortSelect.addEventListener("change", function () {
    sortBy = SORTS.indexOf(sortSelect.value) >= 0 ? sortSelect.value : "recommended";
    save(SORT_KEY, sortBy);
    renderCabinets();
    blip();
  });
  function renderLengthSort() {
    var t = tabDef(tab);
    Array.prototype.forEach.call(lengthSelect.options, function (o) {
      var n = games.filter(function (g) {
        return inTab(g, t) && inTopic(g, topic) && inStyle(g, style) && inLength(g, o.value) && (!fitsOnly || supports(g, grade));
      }).length;
      o.textContent = countLabel(LENGTH_NAMES[o.value], n);
    });
    lengthSelect.value = lengthF;
    sortSelect.value = sortBy;
  }

  // Play-style chips: "All styles" plus one per style; one at a time.
  var chipsBox = document.getElementById("style-chips");
  var styleCurrent = document.getElementById("style-current");
  var styleChips = [{ id: "", icon: "🎮", label: "All styles" }].concat(STYLES).map(function (s) {
    // Icon-only button: the name shows as a tooltip on hover/focus, and the selected style's name
    // is spelled out next to the bar (touch screens can't hover).
    var b = el("button", "style-chip");
    b.type = "button";
    b.setAttribute("data-style", s.id);
    b.setAttribute("data-tip", s.label);
    var icon = el("span", "style-icon", s.icon);
    icon.setAttribute("aria-hidden", "true");
    b.appendChild(icon);
    b.appendChild(el("span", "style-label sr-only", s.label));
    var count = el("span", "style-count");
    b.appendChild(count);
    b.addEventListener("click", function () { setStyle(s.id); blip(); });
    chipsBox.appendChild(b);
    return { def: s, b: b, count: count };
  });
  function setStyle(id, scrollToGrid) {
    style = styleDef(id) ? id : "";
    save(STYLE_KEY, style);
    selectedKey = null;
    renderCabinets();
    if (!scrollToGrid) return;
    var sec = shelvesBox.querySelector(".shelf-style");
    if (sec) {
      sec.scrollIntoView({ block: "start", behavior: reduceMotion ? "auto" : "smooth" });
      var first = sec.querySelector("a.cabinet");
      if (first) first.focus({ preventScroll: true });
    }
  }
  function renderStyleChips() {
    var t = tabDef(tab);
    styleChips.forEach(function (c) {
      var n = games.filter(function (g) {
        return inTab(g, t) && inTopic(g, topic) && inLength(g, lengthF) && inStyle(g, c.def.id) && (!fitsOnly || supports(g, grade));
      }).length;
      var on = style === c.def.id;
      c.b.setAttribute("aria-pressed", on ? "true" : "false");
      c.b.classList.toggle("empty", !n && !on);
      c.count.textContent = String(n);
      c.b.setAttribute("aria-label", c.def.label + ", " + n + " game" + (n === 1 ? "" : "s"));
      if (on) styleCurrent.textContent = c.def.icon + " " + c.def.label + " · " + n + " game" + (n === 1 ? "" : "s");
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
    var hidden = games.filter(function (g) { return inFilters(g, tabDef(tab)) && !supports(g, grade); }).length;
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
    played[id] = { n: (played[id] ? played[id].n : 0) + 1, t: Date.now() };
    save(PLAYED_KEY, JSON.stringify(played));
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
    var href = game.url + (game.url.indexOf("?") >= 0 ? "&" : "?") + "grade=" + encodeURIComponent(grade);
    // Games with a Focus mode (focus: true) open focused on the topic picked in the menu.
    if (game.focus && topic && inTopic(game, topic)) href += "&topic=" + encodeURIComponent(topic);
    return href;
  }
  function updateGradeLinks() {
    var links = document.querySelectorAll("a[data-keep-grade]");
    for (var i = 0; i < links.length; i++) links[i].href = "credits.html?grade=" + encodeURIComponent(grade);
  }
  function lengthChip(game) {
    var l = LENGTHS[game.length];
    return l ? el("span", "chip len len-" + game.length, l.icon + " " + l.label) : null;
  }

  function cabinetItem(game, shelf, mini, rank) {
    var li = el("li");
    var live = !!game.url;
    var fits = supports(game, grade);
    var fresh = live && isNew(game);
    var card = el(live ? "a" : "div", "cabinet" + (live ? "" : " soon") + (fits ? "" : " off-grade") + (fresh ? " is-new" : ""));
    card.setAttribute("data-game", game.id);
    card.setAttribute("data-shelf", shelf);
    if (live) {
      card.href = gameHref(game);
      card.setAttribute("aria-label", "Play " + game.title + ", " + gradeName(grade) + (fits ? "" : " (" + gradesLabel(game) + ")") +
        (LENGTHS[game.length] ? ", " + LENGTHS[game.length].label.toLowerCase() : ""));
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
    if (fresh) screen.appendChild(el("span", "new-ribbon", "New!"));
    card.appendChild(screen);

    var body = el("div", "body");
    body.appendChild(el("h3", null, game.title));
    if (!mini) body.appendChild(el("p", "tagline", game.tagline));
    var chips = el("div", "chips");
    if (rank) chips.appendChild(el("span", "chip hot", "🔥 #" + rank));
    chips.appendChild(el("span", "chip grade" + (fits ? "" : " off"), fits ? gradeName(grade) : gradesLabel(game)));
    if (isNew(game)) chips.appendChild(el("span", "chip new", "New"));
    if (window.ARCADE_ENV === "dev" && live && !game.prod) chips.appendChild(el("span", "chip dev", "Dev only"));
    var lc = lengthChip(game);
    if (lc) chips.appendChild(lc);
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

  function shelfButton(cls, text, label, onClick) {
    var b = el("button", cls, text);
    b.type = "button";
    if (label) b.setAttribute("aria-label", label);
    b.addEventListener("click", onClick);
    return b;
  }
  // opt: mini (small cabinets), strip (a horizontal scroll row), limit (show only the first n),
  // seeAll (a style id: adds "See all ▶"), back (adds "◀ All styles"), rank (numbers the games).
  function shelf(id, title, list, opt) {
    opt = opt || {};
    if (!list.length) return null;
    var total = list.length;
    if (opt.limit && list.length > opt.limit) list = list.slice(0, opt.limit);
    var sec = el("section", "shelf shelf-" + id + (opt.strip ? " shelf-row" : "") + (opt.cls ? " " + opt.cls : ""));
    sec.setAttribute("aria-label", title);
    var headRow = el("div", "shelf-head");
    var head = el("h3", "shelf-title", title);
    head.appendChild(el("span", "shelf-count", " " + total));
    headRow.appendChild(head);
    var tools = el("div", "shelf-tools");
    var ul = el("ul", "cabinets" + (opt.mini ? " mini" : "") + (opt.strip ? " strip" : ""));
    ul.setAttribute("role", "list");
    if (opt.strip) {
      var step = function (d) {
        ul.scrollBy({ left: d * Math.max(200, ul.clientWidth * 0.8), behavior: reduceMotion ? "auto" : "smooth" });
      };
      tools.appendChild(shelfButton("row-btn row-prev", "◀", "Scroll " + title + " left", function () { step(-1); blip(); }));
      tools.appendChild(shelfButton("row-btn row-next", "▶", "Scroll " + title + " right", function () { step(1); blip(); }));
      ul.addEventListener("scroll", function () { updateRowButtons(sec); }, { passive: true });
    }
    if (opt.seeAll) {
      tools.appendChild(shelfButton("see-all", "See all" + (opt.limit && total > opt.limit ? " " + total : "") + " ▶",
        "See all " + total + " " + title + " games", function () { setStyle(opt.seeAll, true); blip(); }));
    }
    if (opt.back) tools.appendChild(shelfButton("see-all", "◀ All styles", "Back to all styles", function () { setStyle("", false); blip(); var c = chipsBox.querySelector('[data-style=""]'); if (c) c.focus(); }));
    if (tools.firstChild) headRow.appendChild(tools);
    sec.appendChild(headRow);
    list.forEach(function (game, i) { ul.appendChild(cabinetItem(game, id, opt.mini, opt.rank ? i + 1 : 0)); });
    sec.appendChild(ul);
    shelvesBox.appendChild(sec);
    return sec;
  }
  // Strip rows: hide the ◀ ▶ buttons when the row fits, and grey out the end you're at.
  function updateRowButtons(sec) {
    var ul = sec.querySelector(".strip");
    if (!ul) return;
    var max = ul.scrollWidth - ul.clientWidth;
    var prev = sec.querySelector(".row-prev"), next = sec.querySelector(".row-next");
    prev.hidden = next.hidden = max <= 2;
    prev.disabled = ul.scrollLeft <= 6;
    next.disabled = ul.scrollLeft >= max - 6;
  }
  function updateAllRows() { Array.prototype.forEach.call(shelvesBox.querySelectorAll(".shelf-row"), updateRowButtons); }
  var rowsQueued = false;
  window.addEventListener("resize", function () {
    if (rowsQueued) return;
    rowsQueued = true;
    requestAnimationFrame(function () { rowsQueued = false; updateAllRows(); });
  });

  /* ------------------------------------------------------------------ */
  /* Search: live, case- and accent-insensitive, over the title, styles, */
  /* subjects, topics, length, `inspiredBy` and the tagline.              */
  /* ------------------------------------------------------------------ */

  var searchInput = document.getElementById("search-input");
  var searchClear = document.getElementById("search-clear");
  var searchHidden = document.getElementById("search-hidden");
  var searchEmpty = document.getElementById("search-empty");
  var searchEmptyText = document.getElementById("search-empty-text");
  var resultsStatus = document.getElementById("results-status");

  function norm(s) {
    var t = String(s || "");
    if (t.normalize) t = t.normalize("NFD");
    return t.replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  }
  function prep(s) { var n = norm(s); return { text: " " + n, compact: n.replace(/ /g, "") }; }
  var topicLabels = {};
  Object.keys(TOPICS).forEach(function (s) { TOPICS[s].forEach(function (t) { topicLabels[t.id] = t.label; }); });
  // Three tiers, best first: the title; style / subject / topic / length / classic; the tagline.
  var searchIndex = games.map(function (g) {
    var middle = []
      .concat((g.styles || []).map(function (id) { var d = styleDef(id); return d ? d.label + " " + d.id : id; }))
      .concat((g.subjects || []).map(function (s) { return s + " " + (SUBJECT_NAMES[s] || ""); }))
      .concat((g.topics || []).map(function (id) { return topicLabels[id] || ""; }))
      .concat([LENGTHS[g.length] ? LENGTHS[g.length].label : "", g.inspiredBy || ""]);
    return { game: g, fields: [prep(g.title), prep(middle.join(" ")), prep(g.tagline)] };
  });
  function searchTokens() { return norm(query).split(" ").filter(Boolean); }
  // Lower is better; -1 = no match. Every word typed must match somewhere: at the start of a word
  // (best) or anywhere inside one (also across spaces, so "qbert" finds "Q*bert").
  function matchScore(entry, tokens) {
    var total = 0;
    for (var i = 0; i < tokens.length; i++) {
      var tok = tokens[i], best = -1;
      for (var tier = 0; tier < entry.fields.length; tier++) {
        var f = entry.fields[tier], s = -1;
        if (f.text.indexOf(" " + tok) >= 0) s = tier * 2;
        else if (f.text.indexOf(tok) >= 0 || f.compact.indexOf(tok) >= 0) s = tier * 2 + 1;
        if (s >= 0 && (best < 0 || s < best)) best = s;
      }
      if (best < 0) return -1;
      total += best;
    }
    return total;
  }
  function searchResults() {
    var tokens = searchTokens(), t = tabDef(tab);
    var hits = [], hiddenGrade = 0, hiddenFilter = 0;
    searchIndex.forEach(function (e) {
      var sc = matchScore(e, tokens);
      if (sc < 0) return;
      var g = e.game, okFilters = inFilters(g, t), okGrade = !fitsOnly || supports(g, grade);
      if (searchAll || (okFilters && okGrade)) hits.push({ g: g, sc: sc });
      else if (!okFilters) hiddenFilter++;
      else hiddenGrade++;
    });
    var sorted = sortGames(hits.map(function (h) { return h.g; }));
    var score = {};
    hits.forEach(function (h) { score[h.g.id] = h.sc; });
    sorted.sort(function (a, b) { return score[a.id] - score[b.id]; }); // stable: keeps the sort order within a tier
    return { list: sorted, hiddenGrade: hiddenGrade, hiddenFilter: hiddenFilter };
  }
  function plural(n, one, many) { return n + " " + (n === 1 ? one : many); }
  function renderSearchHint(r) {
    searchHidden.textContent = "";
    var parts = [];
    if (r.hiddenGrade) parts.push(r.hiddenGrade + " more for other grades");
    if (r.hiddenFilter) parts.push(r.hiddenFilter + " more outside your subject, topic, style or length");
    if (searchAll) {
      searchHidden.appendChild(document.createTextNode("Showing matches from every grade, subject and style. "));
      searchHidden.appendChild(shelfButton("adapt-reset", "Use my filters", null, function () { searchAll = false; renderCabinets(); blip(); searchInput.focus(); }));
    } else if (parts.length) {
      searchHidden.appendChild(document.createTextNode(parts.join(" and ") + " — "));
      searchHidden.appendChild(shelfButton("adapt-reset", "show them", "Show the hidden matches", function () { searchAll = true; renderCabinets(); blip(); searchInput.focus(); }));
    }
    searchHidden.hidden = !searchHidden.firstChild;
  }
  function setQuery(v) {
    query = v;
    if (!searchTokens().length) searchAll = false;
    selectedKey = null;
    selected = 0;
    renderCabinets();
  }
  function clearSearch(focusInput) {
    searchInput.value = "";
    setQuery("");
    if (focusInput) searchInput.focus();
  }
  searchInput.addEventListener("input", function () { setQuery(searchInput.value); });
  searchInput.addEventListener("keydown", function (ev) {
    if (ev.key === "Escape") {
      ev.preventDefault();
      if (searchInput.value) clearSearch(true); else searchInput.blur();
    } else if ((ev.key === "Enter" || ev.key === "ArrowDown") && cabinets.length && searchTokens().length) {
      ev.preventDefault(); // jump to the first result (Enter on it then plays)
      select(0, true);
    }
  });
  searchClear.addEventListener("click", function () { clearSearch(true); blip(); });
  document.getElementById("search-empty-clear").addEventListener("click", function () { clearSearch(true); blip(); });

  /* ------------------------------------------------------------------ */
  /* Try next: private, on-device suggestions from this player's history */
  /* ------------------------------------------------------------------ */

  function shared(a, b) { var n = 0; (a || []).forEach(function (x) { if ((b || []).indexOf(x) >= 0) n++; }); return n; }
  function tryNext() {
    var seedIds = [];
    recent.concat(favorites, Object.keys(played)).forEach(function (id) { if (seedIds.indexOf(id) < 0 && byId(id)) seedIds.push(id); });
    if (!seedIds.length) return []; // nothing played or starred yet
    var t = tabDef(tab);
    var pool = games.filter(function (g) {
      return g.url && supports(g, grade) && shown(g, t) && !hasPlayed(g.id) && favorites.indexOf(g.id) < 0;
    });
    var scored = pool.map(function (g) {
      var s = 0;
      seedIds.forEach(function (id) {
        var seed = byId(id), w = (favorites.indexOf(id) >= 0 ? 1.5 : 1) * (recent.indexOf(id) >= 0 ? 1.5 : 1);
        s += w * (2 * shared(g.styles, seed.styles) + shared(g.subjects, seed.subjects));
      });
      return { g: g, s: s };
    }).filter(function (x) { return x.s > 0; });
    scored.sort(function (a, b) { return b.s - a.s || orderOf[a.g.id] - orderOf[b.g.id]; });
    var out = scored.slice(0, TRY_MAX).map(function (x) { return x.g; });
    // Not enough alike? Top up with unplayed picks in the arcade's recommended order.
    for (var i = 0; i < pool.length && out.length < TRY_MIN; i++) if (out.indexOf(pool[i]) < 0) out.push(pool[i]);
    return out;
  }

  /* ------------------------------------------------------------------ */
  /* 🔥 Most played this week (anonymous totals from /api/popular)        */
  /* ------------------------------------------------------------------ */

  var popular = null; // [{ id, plays }] once loaded
  function popularOn() {
    if (window.ARCADE_ENV === "production") return true;
    try { return localStorage.getItem("nzdo.trackDev") === "1"; } catch (e) { return false; } // testing on dev, like track.js
  }
  function fetchPopular() {
    if (!popularOn() || !window.fetch) return;
    var ctl = window.AbortController ? new AbortController() : null;
    var timer = setTimeout(function () { if (ctl) ctl.abort(); }, POPULAR_TIMEOUT);
    var done = false;
    fetch("/api/popular", { credentials: "omit", headers: { accept: "application/json" }, signal: ctl ? ctl.signal : undefined })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) {
        clearTimeout(timer);
        if (done || !d || !Array.isArray(d.games)) return;
        done = true;
        popular = d.games.filter(function (x) {
          return x && typeof x.id === "string" && typeof x.plays === "number" && isFinite(x.plays);
        }).map(function (x) { return { id: x.id, plays: x.plays }; });
        renderCabinets();
      })
      .catch(function () { clearTimeout(timer); }); // quietly no row
  }
  function popularList() {
    if (!popular) return [];
    var t = tabDef(tab), out = [];
    popular.forEach(function (p) {
      var g = byId(p.id); // unknown ids, and games not on this site (non-prod on production), are skipped
      if (g && g.url && shown(g, t) && out.length < POPULAR_MAX) out.push(p);
    });
    if (out.length < POPULAR_MIN || out.every(function (p) { return p.plays < POPULAR_TINY; })) return [];
    return out.map(function (p) { return byId(p.id); });
  }

  /* ------------------------------------------------------------------ */
  /* Rendering                                                            */
  /* ------------------------------------------------------------------ */

  function rowsFor(main) {
    var phone = isPhone();
    STYLES.forEach(function (s) {
      var list = main.filter(function (g) { return inStyle(g, s.id); });
      // Recommended order lists games whose main (first) style is this one before the others.
      if (sortBy === "recommended") {
        list = list.filter(function (g) { return g.styles[0] === s.id; }).concat(list.filter(function (g) { return g.styles[0] !== s.id; }));
      }
      shelf("style-" + s.id, s.icon + " " + s.label, list, { strip: !phone, limit: phone ? ROW_PHONE_MAX : 0, seeAll: s.id, cls: "shelf-styled" });
    });
    var other = main.filter(function (g) { return !(g.styles || []).some(styleDef); });
    shelf("more", "More games", other, {});
  }

  function renderCabinets() {
    var t = tabDef(tab);
    var keep = selectedKey;
    // Keep keyboard focus on the same game (or star) through a re-render.
    var a = document.activeElement, refocus = null;
    if (a && shelvesBox.contains(a) && a.getAttribute("data-game")) {
      refocus = { cls: a.classList.contains("fav") ? ".fav" : "a.cabinet", shelf: a.getAttribute("data-shelf"), game: a.getAttribute("data-game") };
    }
    renderTabs();
    renderTopics();
    renderLengthSort();
    renderStyleChips();
    renderFit();
    shelvesBox.textContent = "";
    searchClear.hidden = !query;
    var status = "";
    var searching = searchTokens().length > 0;
    searchEmpty.hidden = true;
    searchHidden.hidden = true;
    document.body.classList.toggle("is-searching", searching);
    if (searching) {
      var r = searchResults();
      shelf("results", "🔍 Results", r.list, {});
      var q = query.trim();
      status = r.list.length ? plural(r.list.length, "game matches", "games match") + " “" + q + "”" : "No games match “" + q + "”";
      searchEmptyText.textContent = "No games match “" + q + "”" + (r.hiddenGrade || r.hiddenFilter ? " with your filters." : ".");
      searchEmpty.hidden = r.list.length > 0;
      renderSearchHint(r);
      emptyNote.hidden = true;
    } else {
      var pick = function (ids) { return ids.map(byId).filter(function (g) { return g && shown(g, t); }); };
      // New games come first, as full-size cabinets, so they're easy to spot.
      shelf("new", "✨ New games", games.filter(function (g) { return g.url && isNew(g) && shown(g, t); }), {});
      shelf("favorites", "★ Favorites", pick(favorites), { mini: true });
      shelf("recent", "Recently played", pick(recent), { mini: true });
      shelf("trynext", "👉 Try next", tryNext(), { mini: true });
      shelf("popular", "🔥 Most played this week", popularList(), { mini: true, rank: true });
      var main = sortGames(games.filter(function (g) { return shown(g, t); }));
      var sd = styleDef(style), tp = topicDef(tab, topic);
      if (sd) {
        shelf("style", sd.icon + " " + sd.label + " games", main, { back: true });
      } else {
        rowsFor(main);
      }
      emptyNote.hidden = main.length > 0;
      var what = [sd ? sd.label : "", lengthF ? LENGTHS[lengthF].label : "", tp ? tp.label : t.subject ? t.label : ""].filter(Boolean).join(" · ");
      status = plural(main.length, "game", "games") + (what ? " · " + what : "") + (sd ? "" : main.length ? " · by play style" : "");
    }
    if (resultsStatus.textContent !== status) resultsStatus.textContent = status;
    renderNewBanner();
    renderSpotlight(searching);
    updateAllRows();

    cabinets = Array.prototype.slice.call(shelvesBox.querySelectorAll("a.cabinet"));
    var idx = -1;
    if (keep) cabinets.forEach(function (c, j) { if (idx < 0 && keyOf(c) === keep) idx = j; });
    if (idx < 0 && keep) { // the same game on another shelf, else the first
      var gid = keep.split(":")[1];
      cabinets.forEach(function (c, j) { if (idx < 0 && c.getAttribute("data-game") === gid) idx = j; });
    }
    select(idx < 0 ? Math.max(0, Math.min(selected, cabinets.length - 1)) : idx, false);
    if (refocus) {
      var again = shelvesBox.querySelector(refocus.cls + '[data-shelf="' + refocus.shelf + '"][data-game="' + refocus.game + '"]') ||
        shelvesBox.querySelector(refocus.cls + '[data-game="' + refocus.game + '"]');
      if (again) again.focus({ preventScroll: true });
    }
  }
  function keyOf(c) { return c.getAttribute("data-shelf") + ":" + c.getAttribute("data-game"); }
  if (phoneMQ) {
    var onPhoneChange = function () { renderCabinets(); };
    if (phoneMQ.addEventListener) phoneMQ.addEventListener("change", onPhoneChange); else if (phoneMQ.addListener) phoneMQ.addListener(onPhoneChange);
  }

  /* ------------------------------------------------------------------ */
  /* 🎲 Surprise me: a random live game that fits the player's grade and */
  /* the subject/topic/style/length filters, preferring unplayed games,  */
  /* never the same game twice in a row.                                  */
  /* ------------------------------------------------------------------ */

  var surpriseBtn = document.getElementById("surprise-btn");
  var surpriseBox = document.getElementById("surprise");
  var lastSurprise = load(SURPRISE_KEY) || "";
  function surprisePool() {
    var t = tabDef(tab);
    return games.filter(function (g) { return g.url && supports(g, grade) && inFilters(g, t); });
  }
  function closeSurprise(restoreFocus) {
    surpriseBox.hidden = true;
    surpriseBox.textContent = "";
    if (restoreFocus) surpriseBtn.focus();
  }
  function surprise(focusAnother) {
    var pool = surprisePool();
    surpriseBox.textContent = "";
    surpriseBox.hidden = false;
    if (!pool.length) {
      var none = el("div", "surprise-card none");
      none.appendChild(el("p", null, "No game fits " + gradeName(grade).toLowerCase() + " with these filters. Try All subjects or All styles."));
      none.appendChild(shelfButton("adapt-reset surprise-close", "✕", "Close", function () { closeSurprise(true); }));
      surpriseBox.appendChild(none);
      none.querySelector("button").focus();
      return;
    }
    var choices = pool.filter(function (g) { return g.id !== lastSurprise; });
    if (!choices.length) choices = pool; // only one game fits
    var fresh = choices.filter(function (g) { return !hasPlayed(g.id); });
    var from = fresh.length ? fresh : choices;
    var g = from[Math.floor(Math.random() * from.length)];
    lastSurprise = g.id;
    save(SURPRISE_KEY, g.id);

    var card = el("div", "surprise-card" + (reduceMotion ? "" : " rolling"));
    var scr = el("div", "surprise-screen");
    if (g.image) { var img = el("img"); img.src = g.image; img.alt = ""; scr.appendChild(img); }
    card.appendChild(scr);
    var body = el("div", "surprise-body");
    body.appendChild(el("p", "surprise-eyebrow", "🎲 Surprise! Try this one"));
    body.appendChild(el("h3", null, g.title));
    body.appendChild(el("p", "tagline", g.tagline));
    var chips = el("div", "chips");
    chips.appendChild(el("span", "chip grade", gradeName(grade)));
    var lc = lengthChip(g);
    if (lc) chips.appendChild(lc);
    if (!hasPlayed(g.id)) chips.appendChild(el("span", "chip new", "Not played yet"));
    body.appendChild(chips);
    var actions = el("div", "surprise-actions");
    var play = el("a", "surprise-play", "Play ▶");
    play.href = gameHref(g);
    play.setAttribute("aria-label", "Play " + g.title);
    play.setAttribute("data-surprise", g.id);
    play.addEventListener("click", function (ev) {
      if (ev.ctrlKey || ev.metaKey || ev.shiftKey || ev.button) return;
      recordLaunch(g.id);
      coin();
    });
    actions.appendChild(play);
    var another = null;
    if (pool.length > 1) {
      another = shelfButton("adapt-btn on surprise-again", "Another 🎲", "Pick another game", function () { surprise(true); coin(); });
      actions.appendChild(another);
    } else {
      actions.appendChild(el("span", "hint", "It's the only game that fits right now."));
    }
    body.appendChild(actions);
    card.appendChild(body);
    card.appendChild(shelfButton("adapt-reset surprise-close", "✕", "Close the surprise pick", function () { closeSurprise(true); blip(); }));
    surpriseBox.appendChild(card);
    var live = el("p", "sr-only", "Surprise pick: " + g.title + ".");
    live.setAttribute("role", "status");
    surpriseBox.appendChild(live);

    // Highlight the game on the shelves too.
    Array.prototype.forEach.call(shelvesBox.querySelectorAll(".surprise-flash"), function (c) { c.classList.remove("surprise-flash"); });
    var cab = shelvesBox.querySelector('a.cabinet[data-game="' + g.id + '"]');
    if (cab) {
      select(cabinets.indexOf(cab), false);
      cab.classList.add("surprise-flash");
      setTimeout(function () { cab.classList.remove("surprise-flash"); }, 1800);
    }
    if (surpriseBox.scrollIntoView) surpriseBox.scrollIntoView({ block: "nearest", behavior: reduceMotion ? "auto" : "smooth" });
    (focusAnother && another ? another : play).focus({ preventScroll: true });
  }
  surpriseBtn.addEventListener("click", function () { surprise(false); coin(); });
  surpriseBox.addEventListener("keydown", function (ev) {
    if (ev.key === "Escape") { ev.preventDefault(); ev.stopPropagation(); closeSurprise(true); }
  });

  /* ------------------------------------------------------------------ */
  /* ⭐ Game spotlight: a random live game that fits the player's grade,  */
  /* picked fresh on every visit and refresh (never the same game twice  */
  /* in a row). Hidden while searching or after the player closes it.    */
  /* ------------------------------------------------------------------ */

  var spotlightId = "", spotlightClosed = false;
  function pickSpotlight() {
    var pool = games.filter(function (g) { return g.url && supports(g, grade); });
    if (!pool.length) return "";
    var last = load(SPOTLIGHT_KEY) || "";
    var choices = pool.filter(function (g) { return g.id !== last; });
    if (!choices.length) choices = pool; // only one game fits
    var g = choices[Math.floor(Math.random() * choices.length)];
    save(SPOTLIGHT_KEY, g.id);
    return g.id;
  }
  function renderSpotlight(searching) {
    var box = document.getElementById("spotlight");
    if (!box) return;
    // Pick once per page load; pick again only if a grade change rules the game out.
    var cur = byId(spotlightId);
    if (!cur || !supports(cur, grade)) { spotlightId = pickSpotlight(); cur = byId(spotlightId); }
    box.textContent = "";
    box.hidden = !cur || spotlightClosed || searching;
    if (box.hidden) return;
    var g = cur;
    var card = el("div", "surprise-card spotlight-card");
    var scr = el("div", "surprise-screen");
    if (g.image) { var img = el("img"); img.src = g.image; img.alt = ""; scr.appendChild(img); }
    card.appendChild(scr);
    var body = el("div", "surprise-body");
    body.appendChild(el("p", "surprise-eyebrow", "⭐ Game spotlight"));
    body.appendChild(el("h3", null, g.title));
    body.appendChild(el("p", "tagline", g.tagline));
    var chips = el("div", "chips");
    chips.appendChild(el("span", "chip grade", gradeName(grade)));
    var lc = lengthChip(g);
    if (lc) chips.appendChild(lc);
    if (isNew(g)) chips.appendChild(el("span", "chip new", "New!"));
    body.appendChild(chips);
    var actions = el("div", "surprise-actions");
    var play = el("a", "surprise-play", "Play ▶");
    play.href = gameHref(g);
    play.setAttribute("aria-label", "Play " + g.title);
    play.addEventListener("click", function (ev) {
      if (ev.ctrlKey || ev.metaKey || ev.shiftKey || ev.button) return;
      recordLaunch(g.id);
      coin();
    });
    actions.appendChild(play);
    body.appendChild(actions);
    card.appendChild(body);
    card.appendChild(shelfButton("adapt-reset surprise-close", "✕", "Hide the spotlight", function () {
      spotlightClosed = true;
      box.hidden = true;
      box.textContent = "";
      blip();
    }));
    box.appendChild(card);
  }

  // "New games just landed!" banner. Hidden for a player once they dismiss it or tap See them,
  // until a game newer than the ones they've seen is added (arcade.newSeen = newest date seen).
  var NEW_SEEN_KEY = "arcade.newSeen";
  var newBanner = document.getElementById("new-banner");
  function newestNew() {
    var list = games.filter(function (g) { return g.url && isNew(g) && (!fitsOnly || supports(g, grade)); });
    var newest = "";
    list.forEach(function (g) { if ((g.added || "") > newest) newest = g.added || ""; });
    return { list: list, newest: newest };
  }
  function renderNewBanner() {
    if (!newBanner) return;
    var n = newestNew();
    var seen = load(NEW_SEEN_KEY) || "";
    newBanner.hidden = !n.list.length || (n.newest !== "" && seen >= n.newest);
    if (newBanner.hidden) return;
    document.getElementById("new-banner-text").textContent =
      n.list.length === 1 ? "A new game just landed: " + n.list[0].title + "!" : n.list.length + " new games just landed!";
  }
  function dismissNewBanner() {
    save(NEW_SEEN_KEY, newestNew().newest || "seen");
    newBanner.hidden = true;
  }
  if (newBanner) {
    document.getElementById("new-banner-go").addEventListener("click", function () {
      dismissNewBanner();
      // Clear whatever is hiding the New row: the search first, then style/length, then the subject.
      if (!shelvesBox.querySelector(".shelf-new") && query) { searchInput.value = ""; query = ""; searchAll = false; renderCabinets(); }
      if (!shelvesBox.querySelector(".shelf-new") && (style || lengthF)) {
        style = ""; lengthF = ""; save(STYLE_KEY, ""); save(LENGTH_KEY, ""); renderCabinets();
      }
      if (!shelvesBox.querySelector(".shelf-new")) setTab("all");
      var sec = shelvesBox.querySelector(".shelf-new");
      if (sec) {
        sec.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
        var first = sec.querySelector("a.cabinet");
        if (first) first.focus({ preventScroll: true });
      }
      coin();
    });
    document.getElementById("new-banner-close").addEventListener("click", function () { dismissNewBanner(); blip(); });
  }

  document.getElementById("year").textContent = String(new Date().getFullYear());

  // Keyboard: ◀ ▶ move along a row (and on to the next one), ▲ ▼ move to the row above or below,
  // Enter/Space launches, / searches (Esc clears), [ and ] change grade, , and . (or < and >)
  // change subject, ; and ' change topic, F stars the selected game. Tab / Shift+Tab keep their
  // normal focus behavior.
  function select(i, focus) {
    if (!cabinets.length) { selectedKey = null; return; }
    selected = ((i % cabinets.length) + cabinets.length) % cabinets.length;
    cabinets.forEach(function (c, j) { c.classList.toggle("selected", j === selected); });
    selectedKey = keyOf(cabinets[selected]);
    if (focus) {
      cabinets[selected].focus({ preventScroll: true });
      if (cabinets[selected].scrollIntoView) cabinets[selected].scrollIntoView({ block: "nearest", inline: "nearest" });
    }
  }
  // The nearest cabinet in the next visual line above (dir -1) or below (dir 1): rows of a grid,
  // the next shelf, or the next style row. In a scrolled row, the closest visible game wins.
  function verticalNeighbor(i, dir) {
    var cur = cabinets[i].getBoundingClientRect();
    var cy = cur.top + cur.height / 2, cx = cur.left + cur.width / 2;
    var best = -1, bestDy = Infinity, bestDx = Infinity;
    cabinets.forEach(function (c, j) {
      if (j === i) return;
      var r = c.getBoundingClientRect();
      if (!r.width) return;
      var y = r.top + r.height / 2, dy = (y - cy) * dir;
      if (dy < 12) return; // not in that direction
      var dx = Math.abs(r.left + r.width / 2 - cx);
      if (dy < bestDy - 12 || (Math.abs(dy - bestDy) <= 12 && dx < bestDx)) { best = j; bestDy = dy; bestDx = dx; }
    });
    return best;
  }
  document.addEventListener("keydown", function (ev) {
    if (ev.ctrlKey || ev.metaKey || ev.altKey) return;
    var k = ev.key;
    var a = document.activeElement;
    var typing = a && (a.tagName === "INPUT" || a.tagName === "TEXTAREA" || a.tagName === "SELECT" || a.isContentEditable);
    if (typing) return;
    if (a && a.closest && a.closest("#profile-panel, .tour-tip")) return; // the player menu and tour use normal keys
    if (document.body.classList.contains("modal-open")) return; // the setup wizard is open
    if (k === "/") { ev.preventDefault(); searchInput.focus(); searchInput.select(); return; }
    if (k === "Escape") {
      if (!surpriseBox.hidden) { closeSurprise(false); return; }
      if (query) { clearSearch(false); return; }
      return;
    }
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
    var onCab = a && a.classList && a.classList.contains("cabinet");
    if (k === "ArrowRight") { ev.preventDefault(); select(selected + 1, true); blip(); }
    else if (k === "ArrowLeft") { ev.preventDefault(); select(selected - 1, true); blip(); }
    else if (k === "ArrowDown" || k === "ArrowUp") {
      ev.preventDefault();
      var j = verticalNeighbor(selected, k === "ArrowDown" ? 1 : -1);
      if (j >= 0) { select(j, true); blip(); }
    }
    else if (k === "Enter" || k === " ") {
      // Buttons (grade, tabs, stars, switches) and focused links handle their own Enter/Space.
      if (onCab) {
        if (k === " ") { ev.preventDefault(); launch(a); }
        return; // Enter follows the focused link itself
      }
      if (a && a !== document.body && (a.tagName === "BUTTON" || a.tagName === "A")) return;
      ev.preventDefault();
      launch(cabinets[selected]);
    }
  });

  setGrade(grade);
  fetchPopular();

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
