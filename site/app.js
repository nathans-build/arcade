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

  var picker = document.getElementById("grades");
  var gradeNow = document.getElementById("grade-now");
  var gradeButtons = GRADES.map(function (g) {
    var b = el("button", "grade-btn", g);
    b.type = "button";
    b.setAttribute("aria-label", gradeName(g));
    b.addEventListener("click", function () { setGrade(g); blip(); });
    picker.appendChild(b);
    return b;
  });

  function setGrade(g) {
    grade = g;
    try { localStorage.setItem(GRADE_KEY, g); } catch (e) { /* ignore */ }
    gradeButtons.forEach(function (b, i) {
      var on = GRADES[i] === g;
      b.classList.toggle("on", on);
      b.setAttribute("aria-pressed", on ? "true" : "false");
    });
    gradeNow.textContent = gradeName(g);
    renderAdapt();
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
  /* Cabinets                                                            */
  /* ------------------------------------------------------------------ */

  var list = document.getElementById("cabinets");
  var cabinets = [];
  var selected = 0;

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }

  function gameHref(game) {
    return game.url + (game.url.indexOf("?") >= 0 ? "&" : "?") + "grade=" + encodeURIComponent(grade);
  }

  function renderCabinets() {
    list.textContent = "";
    cabinets = [];
    games.forEach(function (game, i) {
      var li = el("li");
      var live = !!game.url;
      var card = el(live ? "a" : "div", "cabinet" + (live ? "" : " soon"));
      if (live) {
        card.href = gameHref(game);
        card.setAttribute("aria-label", "Play " + game.title + ", " + gradeName(grade));
        card.addEventListener("click", function () { coin(); });
        card.addEventListener("focus", function () { select(cabinets.indexOf(card), false); });
      }

      card.appendChild(el("div", "cab-top", "Game " + (i + 1) + (live ? " · Player 1" : " · Coming soon")));
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
      body.appendChild(el("p", null, game.tagline));
      var chips = el("div", "chips");
      var fits = supports(game, grade);
      chips.appendChild(el("span", "chip grade" + (fits ? "" : " off"), fits ? gradeName(grade) : gradesLabel(game)));
      game.subjects.forEach(function (s) { chips.appendChild(el("span", "chip", s)); });
      body.appendChild(chips);
      card.appendChild(body);
      if (live) card.appendChild(el("div", "start", "Press start ▶"));

      li.appendChild(card);
      list.appendChild(li);
      if (live) cabinets.push(card);
    });
    select(Math.min(selected, cabinets.length - 1), false);
  }

  // Credits table
  var credits = document.getElementById("credits");
  games.filter(function (game) { return !!game.url; }).forEach(function (game, i) {
    var tr = el("tr");
    tr.appendChild(el("td", null, String(i + 1).padStart(2, "0")));
    tr.appendChild(el("td", null, game.title));
    tr.appendChild(el("td", "creator", "SpiderBen10 (NZDO)"));
    tr.appendChild(el("td", null, String(game.year)));
    credits.appendChild(tr);
  });
  document.getElementById("year").textContent = String(new Date().getFullYear());

  // Keyboard: arrows move between cabinets, Enter/Space launches, [ and ] change grade.
  function select(i, focus) {
    if (!cabinets.length) return;
    selected = (i + cabinets.length) % cabinets.length;
    cabinets.forEach(function (c, j) { c.classList.toggle("selected", j === selected); });
    if (focus) cabinets[selected].focus();
  }
  document.addEventListener("keydown", function (ev) {
    var k = ev.key;
    if (k === "[" || k === "]") {
      var gi = GRADES.indexOf(grade) + (k === "]" ? 1 : -1);
      if (gi >= 0 && gi < GRADES.length) { setGrade(GRADES[gi]); blip(); }
      return;
    }
    if (!cabinets.length) return;
    if (k === "ArrowRight" || k === "ArrowDown") { ev.preventDefault(); select(selected + 1, true); blip(); }
    else if (k === "ArrowLeft" || k === "ArrowUp") { ev.preventDefault(); select(selected - 1, true); blip(); }
    else if ((k === "Enter" || k === " ") && document.activeElement && document.activeElement.classList.contains("grade-btn")) {
      return; // let the grade button handle it
    } else if ((k === "Enter" || k === " ") && document.activeElement !== cabinets[selected]) {
      ev.preventDefault(); coin(); window.location.href = cabinets[selected].href;
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
  /* Marquee scene: night city, moon, and an original web-swinging hero  */
  /* ------------------------------------------------------------------ */

  var canvas = document.getElementById("scene");
  var g = canvas.getContext("2d");
  var W = canvas.width, H = canvas.height;
  g.imageSmoothingEnabled = false;

  // Original character "SpiderBen10": red helmet with a single cyan visor stripe,
  // blue suit, yellow diamond emblem. One hand up on the web line.
  var HERO = [
    "......hh........",
    "......hh........",
    "......BB........",
    "......BB........",
    ".....KRRRK......",
    "....KRRRRRK.....",
    "....KRRRRRK.....",
    "....KVVVVVK.....",
    "....KRRRRRK.....",
    ".....KRRRK......",
    "....BBRRRBB.....",
    "....BBYYYBBB....",
    "....BBBYBB.BB...",
    "....BBBBBB..hh..",
    ".....RRRRR......",
    ".....BBBBB......",
    ".....BB.BB......",
    "....BB...BB.....",
    "...hh.....hh....",
  ];
  var HERO_COLORS = { h: "#e3262f", R: "#e3262f", K: "#05060f", V: "#7ff3ff", B: "#2456e8", Y: "#ffd23f" };

  function sprite(rows, colors) {
    var c = document.createElement("canvas");
    c.width = rows[0].length; c.height = rows.length;
    var x = c.getContext("2d");
    rows.forEach(function (row, y) {
      for (var i = 0; i < row.length; i++) {
        var col = colors[row[i]];
        if (col) { x.fillStyle = col; x.fillRect(i, y, 1, 1); }
      }
    });
    return c;
  }
  var hero = sprite(HERO, HERO_COLORS);

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

    // Hero swinging on a web line; the anchor drifts across the sky.
    var span = W + 120;
    var ax = ((t * 22 + 150) % span) - 60; // starts mid-sky so the hero is visible right away
    var ay = -12;
    var ang = Math.sin(t * 1.8) * 0.65;
    var len = 36;
    var hx = ax + Math.sin(ang) * len;
    var hy = ay + Math.cos(ang) * len;
    g.strokeStyle = "#f2f4ff";
    g.beginPath(); g.moveTo(ax, ay); g.lineTo(hx, hy); g.stroke();
    g.save();
    g.translate(Math.round(hx), Math.round(hy));
    g.rotate(-ang * 0.6);
    g.drawImage(hero, -14, -2, hero.width * 2, hero.height * 2); // 2x chunky pixels
    g.restore();

    if (!reduceMotion) requestAnimationFrame(draw);
  }
  requestAnimationFrame(draw);
})();
