// SpiderBen10's Arcade — the first-visit setup wizard and the quick tour. Plain JS, no build step.
//
// Wizard (new players only): 1) name  2) age, which suggests a grade  3) a theme, or "Surprise me".
// Skip keeps the defaults; everything can be changed later in the player menu.
// Tour (once per player, and again from the player menu): four tips that point at the
// player button, the search box (with Surprise me, subjects, topics and play styles), the favorite
// star and a game cabinet.
(function () {
  "use strict";

  var root = document.getElementById("wizard-root");
  var players = window.ArcadePlayers, themes = window.ArcadeThemes;
  if (!root || !players || !themes) return;

  var TOUR_KEY = "arcade.tourDone"; // per player (profile.js swaps every arcade.* key)
  var GRADES = ["K", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];
  var sound = {
    blip: function () { if (window.ArcadeSound) window.ArcadeSound.blip(); },
    coin: function () { if (window.ArcadeSound) window.ArcadeSound.coin(); },
  };

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }
  function button(cls, text, onClick) {
    var b = el("button", cls, text);
    b.type = "button";
    b.addEventListener("click", onClick);
    return b;
  }
  function gradeName(g) { return g === "K" ? "Kindergarten" : "Grade " + g; }
  /** NC kindergarten starts at 5, so a 9-year-old is usually in grade 4 (grade = age - 5). */
  function gradeForAge(age) { return GRADES[Math.max(0, Math.min(12, age - 5))]; }
  function setGrade(g) {
    var sel = document.getElementById("grade-select");
    if (!sel || sel.value === g) return;
    sel.value = g;
    sel.dispatchEvent(new Event("change"));
  }
  function currentGrade() { var sel = document.getElementById("grade-select"); return sel ? sel.value : "6"; }
  function modal(on) { document.body.classList.toggle("modal-open", on); }

  /* ------------------------------------------------------------------ */
  /* Setup wizard                                                        */
  /* ------------------------------------------------------------------ */

  var step = 0, age = null, lastFocus = null;
  var box, body, dots, back, next;

  function startWizard() {
    players.closeMenu();
    lastFocus = document.activeElement;
    root.textContent = "";
    root.hidden = false;
    modal(true);
    var shade = el("div", "wizard-shade");
    box = el("div", "wizard");
    box.setAttribute("role", "dialog");
    box.setAttribute("aria-modal", "true");
    box.setAttribute("aria-labelledby", "wizard-title");
    var head = el("div", "wizard-head");
    head.appendChild(el("p", "eyebrow", "New player · Setup"));
    dots = el("div", "wizard-dots");
    for (var i = 0; i < 3; i++) dots.appendChild(el("span"));
    head.appendChild(dots);
    box.appendChild(head);
    body = el("div", "wizard-body");
    box.appendChild(body);
    var foot = el("div", "wizard-foot");
    foot.appendChild(button("adapt-reset", "Skip setup", function () { finish(true); }));
    var spacer = el("span"); spacer.style.flex = "1"; foot.appendChild(spacer);
    back = button("adapt-reset", "◀ Back", function () { go(step - 1); });
    next = button("adapt-btn on", "Next ▶", function () { go(step + 1); });
    foot.appendChild(back); foot.appendChild(next);
    box.appendChild(foot);
    root.appendChild(shade); root.appendChild(box);
    box.addEventListener("keydown", onWizardKey);
    go(0);
  }

  function onWizardKey(ev) {
    if (ev.key === "Escape") { ev.preventDefault(); finish(true); return; }
    if (ev.key === "Enter" && ev.target.tagName === "INPUT") { ev.preventDefault(); go(step + 1); return; }
    if (ev.key === "Tab") { // keep focus inside the dialog
      var f = box.querySelectorAll("button, input, select");
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (ev.shiftKey && document.activeElement === first) { ev.preventDefault(); last.focus(); }
      else if (!ev.shiftKey && document.activeElement === last) { ev.preventDefault(); first.focus(); }
    }
  }

  function go(n) {
    if (n > 2) { finish(false); return; }
    if (n < 0) return;
    step = n;
    sound.blip();
    Array.prototype.forEach.call(dots.children, function (d, i) { d.className = i === step ? "on" : i < step ? "done" : ""; });
    back.hidden = step === 0;
    next.textContent = step === 2 ? "Let's play! ▶" : "Next ▶";
    body.textContent = "";
    [stepName, stepAge, stepTheme][step]();
  }

  function stepName() {
    body.appendChild(el("h2", "wizard-title", "Hi! What's your name?")).id = "wizard-title";
    body.appendChild(el("p", "hint", "It goes on your arcade, like \"Nathan's Arcade\". A nickname is great."));
    var input = el("input", "text-input wide");
    input.type = "text"; input.maxLength = 20; input.autocomplete = "off"; input.spellcheck = false;
    input.setAttribute("aria-label", "Your name");
    var cur = players.name();
    input.value = /^Player \d+$/.test(cur) ? "" : cur;
    input.placeholder = "Your name";
    input.addEventListener("input", function () { if (input.value.trim()) players.setName(input.value.trim()); });
    body.appendChild(input);
    input.focus();
  }

  function stepAge() {
    body.appendChild(el("h2", "wizard-title", "How old are you?")).id = "wizard-title";
    body.appendChild(el("p", "hint", "We'll pick a grade to match. You can change it."));
    var grid = el("div", "age-grid");
    grid.setAttribute("role", "group");
    grid.setAttribute("aria-label", "Age");
    var note = el("p", "wizard-note");
    var sel = el("select", "grade-select");
    sel.setAttribute("aria-label", "Grade");
    GRADES.forEach(function (g) { var o = el("option", null, gradeName(g)); o.value = g; sel.appendChild(o); });
    sel.value = currentGrade();
    sel.addEventListener("change", function () { setGrade(sel.value); sound.blip(); });
    function pick(a, b) {
      age = a;
      Array.prototype.forEach.call(grid.children, function (x) { x.setAttribute("aria-pressed", x === b ? "true" : "false"); });
      var g = gradeForAge(a === "18+" ? 17 : a);
      setGrade(g);
      sel.value = g;
      note.textContent = "Most " + (a === "18+" ? "grown-ups pick a grade to practice, so" : a + "-year-olds are in " + gradeName(g).toLowerCase() + ", so") + " we picked:";
      sound.blip();
    }
    for (var a = 5; a <= 17; a++) (function (a) {
      var b = button("pick age-btn", String(a), function () { pick(a, b); });
      b.setAttribute("aria-pressed", age === a ? "true" : "false");
      grid.appendChild(b);
    })(a);
    var grown = button("pick age-btn wide", "18+", function () { pick("18+", grown); });
    grown.setAttribute("aria-label", "18 or older");
    grown.setAttribute("aria-pressed", age === "18+" ? "true" : "false");
    grid.appendChild(grown);
    body.appendChild(grid);
    note.textContent = age === null ? "Your grade:" : "We picked:";
    var row = el("div", "wizard-grade");
    row.appendChild(note); row.appendChild(sel);
    body.appendChild(row);
    var on = grid.querySelector('[aria-pressed="true"]') || grid.firstChild;
    on.focus();
  }

  function stepTheme() {
    body.appendChild(el("h2", "wizard-title", "Pick your look")).id = "wizard-title";
    body.appendChild(el("p", "hint", "It changes the banner and the colors. Watch the banner change!"));
    var list = el("div", "wizard-themes");
    list.setAttribute("role", "group");
    list.setAttribute("aria-label", "Themes");
    var buttons = [];
    function mark() { buttons.forEach(function (x) { x.b.setAttribute("aria-pressed", x.id === themes.current() ? "true" : "false"); }); }
    themes.list.forEach(function (t) {
      var b = button("theme-card", null, function () { themes.set(t.id); mark(); sound.blip(); });
      var d = el("span", "theme-dots");
      t.dots.forEach(function (c) { var s = el("span"); s.style.background = c; d.appendChild(s); });
      b.appendChild(d);
      b.appendChild(el("span", "theme-name", t.name));
      b.appendChild(el("span", "theme-note", t.note));
      buttons.push({ id: t.id, b: b });
      list.appendChild(b);
    });
    body.appendChild(list);
    var surprise = button("adapt-btn surprise", "🎲 Surprise me", function () {
      var others = themes.list.filter(function (t) { return t.id !== themes.current(); });
      themes.set(others[Math.floor(Math.random() * others.length)].id);
      mark(); sound.coin();
    });
    body.appendChild(surprise);
    mark();
    surprise.focus();
  }

  function finish(skipped) {
    root.hidden = true;
    root.textContent = "";
    modal(false);
    if (!skipped) sound.coin();
    if (lastFocus && lastFocus.focus) lastFocus.focus();
    window.scrollTo(0, 0);
    startTour();
  }

  /* ------------------------------------------------------------------ */
  /* Tour                                                                */
  /* ------------------------------------------------------------------ */

  var STOPS = [
    { sel: "#profile-btn", title: "Your player menu", text: "Change your grade, name and theme here, or switch players." },
    { sel: "#search-row", title: "Find a game", text: "Type to search (press / on a keyboard), or pick a subject, topic or play style below. Can't choose? Tap 🎲 Surprise me!" },
    { sel: "#shelves .fav", title: "Favorites", text: "Tap the ☆ to make a game a favorite. Favorites stay at the top." },
    { sel: "#shelves a.cabinet", title: "Press start!", text: "Tap a game to play. Your grade goes with you into every game." },
  ];
  var tip = null, stop = 0, target = null;

  function startTour() {
    stop = 0;
    if (!tip) {
      tip = el("div", "tour-tip");
      tip.setAttribute("role", "dialog");
      tip.setAttribute("aria-live", "polite");
      tip.addEventListener("keydown", function (ev) { if (ev.key === "Escape") { ev.preventDefault(); endTour(); } });
      window.addEventListener("resize", place);
      window.addEventListener("scroll", place, { passive: true });
    }
    document.body.appendChild(tip);
    show();
  }
  function show() {
    if (target) target.classList.remove("tour-target");
    var s = STOPS[stop];
    target = document.querySelector(s.sel);
    if (!target) { if (stop < STOPS.length - 1) { stop++; show(); } else endTour(); return; }
    target.classList.add("tour-target");
    if (target.scrollIntoView) target.scrollIntoView({ block: "center" });
    tip.textContent = "";
    tip.appendChild(el("p", "tour-count", "Tip " + (stop + 1) + " of " + STOPS.length));
    tip.appendChild(el("p", "tour-title", s.title));
    tip.appendChild(el("p", "tour-text", s.text));
    var row = el("div", "tour-buttons");
    row.appendChild(button("adapt-reset", "Skip tour", endTour));
    var last = stop === STOPS.length - 1;
    var nx = button("adapt-btn on", last ? "Got it! ✓" : "Next ▶", function () {
      sound.blip();
      if (last) endTour(); else { stop++; show(); }
    });
    row.appendChild(nx);
    tip.appendChild(row);
    place();
    nx.focus({ preventScroll: true });
  }
  function place() {
    if (!tip || !target || !tip.parentNode) return;
    var r = target.getBoundingClientRect(), tw = tip.offsetWidth, th = tip.offsetHeight, m = 12;
    var below = r.bottom + m + th < window.innerHeight || r.top - m - th < 0;
    var top = below ? r.bottom + m : r.top - m - th;
    var left = Math.max(8, Math.min(window.innerWidth - tw - 8, r.left + r.width / 2 - tw / 2));
    tip.style.top = Math.round(Math.max(8, top)) + "px";
    tip.style.left = Math.round(left) + "px";
    tip.classList.toggle("above", !below);
    tip.style.setProperty("--arrow-x", Math.round(Math.max(16, Math.min(tw - 16, r.left + r.width / 2 - left))) + "px");
  }
  function endTour() {
    try { localStorage.setItem(TOUR_KEY, "1"); } catch (e) { /* ignore */ }
    if (target) target.classList.remove("tour-target");
    target = null;
    if (tip && tip.parentNode) tip.parentNode.removeChild(tip);
    sound.coin();
    window.scrollTo(0, 0);
  }

  var again = document.getElementById("tour-again");
  if (again) again.addEventListener("click", function () { players.closeMenu(); window.scrollTo(0, 0); startTour(); });

  /* ------------------------------------------------------------------ */
  /* Start                                                               */
  /* ------------------------------------------------------------------ */

  var tourDone = false;
  try { tourDone = localStorage.getItem(TOUR_KEY) === "1"; } catch (e) { tourDone = true; }
  if (players.needsWelcome) startWizard();
  else if (!tourDone) setTimeout(startTour, 600); // existing players see the tour once
})();
