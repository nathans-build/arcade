// SpiderBen10's Arcade — the animated banner and the theme picker. Plain JS, no build step.
// Each theme has its own banner scene and its own page colors (styles.css, [data-theme=...]).
// Every character here is original art drawn in code.
(function () {
  "use strict";

  var THEMES = [ // keep the ids in sync with theme-boot.js
    { id: "web", name: "Web Slinger", note: "The arcade's own web-swinging hero", dots: ["#e3262f", "#2456e8", "#ffd23f"], bar: "#0a0f2e" },
    { id: "stick", name: "Stick Figure", note: "Black and white, on a white page", dots: ["#111111", "#ffffff", "#9a9a9a"], bar: "#ffffff" },
    { id: "armor", name: "Rocket Armor", note: "A flying hero in rocket-powered armor", dots: ["#c8102e", "#f2b72a", "#7ff3ff"], bar: "#120a0a" },
    { id: "lab", name: "Lab Mice", note: "Two clever lab mice with a big plan", dots: ["#3fbf6f", "#b04cff", "#ffe14a"], bar: "#0e1a14" },
    { id: "unicorn", name: "Unicorn Sky", note: "Rainbows, clouds and a galloping unicorn", dots: ["#ff7ac8", "#b07cff", "#7fd4ff"], bar: "#fff4fb" },
    { id: "idol", name: "Idol Hunters", note: "A pop group that sings away goofy demons", dots: ["#ff2e93", "#3ff4ff", "#6a2cff"], bar: "#0d0420" },
  ];
  var THEME_KEY = "arcade.theme";
  function themeDef(id) { for (var i = 0; i < THEMES.length; i++) if (THEMES[i].id === id) return THEMES[i]; return THEMES[0]; }
  var theme = themeDef(document.documentElement.getAttribute("data-theme")).id;

  var sound = window.ArcadeSound || { blip: function () {}, coin: function () {} };
  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var canvas = document.getElementById("scene");
  if (!canvas) return;
  var g = canvas.getContext("2d");
  var W = canvas.width, H = canvas.height;
  g.imageSmoothingEnabled = false;

  /* ------------------------------------------------------------------ */
  /* Shared helpers                                                      */
  /* ------------------------------------------------------------------ */

  function hash(n) { var s = Math.sin(n * 127.1) * 43758.5453; return s - Math.floor(s); }
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
  function blit(img, x, y, scale, flip) {
    g.save();
    g.translate(Math.round(x), Math.round(y));
    if (flip) g.scale(-1, 1);
    g.drawImage(img, flip ? -img.width * scale : 0, 0, img.width * scale, img.height * scale);
    g.restore();
  }
  function sky(stops) {
    var gr = g.createLinearGradient(0, 0, 0, H);
    stops.forEach(function (s) { gr.addColorStop(s[0], s[1]); });
    g.fillStyle = gr;
    g.fillRect(0, 0, W, H);
  }
  function disc(x, y, r, color) {
    g.fillStyle = color;
    for (var dy = -r; dy <= r; dy++) {
      var half = Math.floor(Math.sqrt(r * r - dy * dy));
      g.fillRect(Math.round(x) - half, Math.round(y) + dy, half * 2, 1);
    }
  }

  var stars = [];
  for (var si = 0; si < 60; si++) stars.push({ x: hash(si) * W, y: hash(si + 99) * 70, p: hash(si + 7) });
  function drawStars(bright, dim) {
    stars.forEach(function (s) {
      var tw = (frame + s.p * 200) % 120 < 6;
      g.fillStyle = s.p > 0.75 && !tw ? bright : dim;
      g.fillRect(Math.floor(s.x), Math.floor(s.y), 1, 1);
    });
  }

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

  function eachBuilding(layer, offset, fn) {
    var total = layer.width;
    for (var k = -1; k <= 1; k++) {
      layer.list.forEach(function (b) {
        var x = Math.floor(b.x - (offset % total) + k * total);
        if (x > W || x + b.w < 0) return;
        fn(b, x, H - b.h);
      });
    }
  }
  function drawCity(layer, offset, color, winA, winB, beacon) {
    eachBuilding(layer, offset, function (b, x, top) {
      g.fillStyle = color;
      g.fillRect(x, top, b.w, b.h);
      for (var wy = top + 3; wy < H - 3; wy += 4) {
        for (var wx = x + 2; wx < x + b.w - 2; wx += 3) {
          var r = hash(b.s * 31 + wx * 0.7 + wy * 1.3);
          if (r > 0.72) { g.fillStyle = r > 0.93 ? winB : winA; g.fillRect(wx, wy, 1, 1); }
        }
      }
      if (beacon && hash(b.s + 5) > 0.8) { // rooftop antenna with a blinking beacon
        g.fillStyle = color; g.fillRect(x + (b.w >> 1), top - 5, 1, 5);
        g.fillStyle = frame % 60 < 30 ? beacon[0] : beacon[1]; g.fillRect(x + (b.w >> 1), top - 6, 1, 1);
      }
    });
  }

  /* ------------------------------------------------------------------ */
  /* Web Slinger: the arcade's original hero swinging over a night city  */
  /* ------------------------------------------------------------------ */

  // Original character "SpiderBen10": red helmet with a single cyan visor stripe,
  // blue suit, yellow diamond emblem. One hand up on the web line.
  var HERO = sprite([
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
  ], { h: "#e3262f", R: "#e3262f", K: "#05060f", V: "#7ff3ff", B: "#2456e8", Y: "#ffd23f" });

  function drawWebCorner(color) {
    g.strokeStyle = color;
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

  function sceneWeb(t) {
    sky([[0, "#050818"], [0.7, "#0d1440"], [1, "#2a0c2c"]]);
    drawStars("#ffffff", "#5a6ad0");
    // Moon (a nod to Lunar Patrol)
    disc(268, 26, 11, "#fff4c8");
    g.fillStyle = "#e8d8a0";
    g.fillRect(262, 20, 3, 3); g.fillRect(271, 29, 4, 3); g.fillRect(266, 33, 2, 2);
    drawWebCorner("rgba(159,176,224,0.45)");
    drawCity(back, t * 6, "#131d5c", "#3a5ad8", "#7ff3ff");
    drawCity(front, t * 14, "#070b24", "#ffd23f", "#ff5a64", ["#ff3040", "#5a0d14"]);

    // Hero swinging on a web line; the anchor drifts across the sky.
    var span = W + 120;
    var ax = ((t * 22 + 150) % span) - 60; // starts mid-sky so the hero is visible right away
    var ay = -12;
    var ang = Math.sin(t * 1.8) * 0.65;
    var hx = ax + Math.sin(ang) * 36, hy = ay + Math.cos(ang) * 36;
    g.strokeStyle = "#f2f4ff"; g.lineWidth = 1;
    g.beginPath(); g.moveTo(ax, ay); g.lineTo(hx, hy); g.stroke();
    g.save();
    g.translate(Math.round(hx), Math.round(hy));
    g.rotate(-ang * 0.6);
    g.drawImage(HERO, -14, -2, HERO.width * 2, HERO.height * 2); // 2x chunky pixels
    g.restore();
  }

  /* ------------------------------------------------------------------ */
  /* Stick Figure: black and white, two dot eyes, no mouth              */
  /* ------------------------------------------------------------------ */

  var INK = "#111111", PAPER = "#ffffff";
  var STICK_KEY = "arcade.hero";
  var STICK_OPTIONS = {
    hat: { label: "Hat", values: ["none", "cap", "beanie", "crown", "top hat", "wizard", "headband", "headphones"] },
    move: { label: "Move", values: ["swing", "run", "fly"] },
  };
  var stick = (function () {
    var saved = {};
    try { saved = JSON.parse(localStorage.getItem(STICK_KEY) || "{}") || {}; } catch (e) { /* ignore */ }
    return {
      hat: STICK_OPTIONS.hat.values.indexOf(saved.hat) >= 0 ? saved.hat : "none",
      move: STICK_OPTIONS.move.values.indexOf(saved.move) >= 0 ? saved.move : "swing",
    };
  })();
  var STICK_SCALE = 1.3;

  // Pose in local units: neck at (0, 0), head above, y grows downward.
  function stickPose(move, t, sway) {
    var p = { head: [0, -6], neck: [0, 0], hip: [0, 12], shoulder: [0, 3] };
    if (move === "swing") {
      p.handR = [2, -14]; p.elbowR = [2, -6]; // up on the web line
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
    } else { // fly: drawn tipped forward, so "up" here is the way it flies
      p.elbowR = [2, -8]; p.handR = [2, -15];
      p.elbowL = [-2, -8]; p.handL = [-2, -15];
      var f = Math.sin(t * 6) * 1.5;
      p.kneeL = [-1, 18]; p.footL = [-1 + f, 24];
      p.kneeR = [1, 18]; p.footR = [1 - f, 24];
    }
    return p;
  }

  function drawStickman(x, y, angle, t, sway, flow) {
    var p = stickPose(stick.move, t, sway);
    g.save();
    g.translate(x, y);
    g.rotate(angle);
    g.scale(STICK_SCALE, STICK_SCALE);
    g.lineCap = "round"; g.lineJoin = "round";
    g.strokeStyle = INK; g.lineWidth = 2;
    g.beginPath();
    g.moveTo(p.neck[0], p.neck[1]); g.lineTo(p.hip[0], p.hip[1]);
    [["kneeL", "footL"], ["kneeR", "footR"]].forEach(function (leg) {
      g.moveTo(p.hip[0], p.hip[1]); g.lineTo(p[leg[0]][0], p[leg[0]][1]); g.lineTo(p[leg[1]][0], p[leg[1]][1]);
    });
    [["elbowL", "handL"], ["elbowR", "handR"]].forEach(function (arm) {
      g.moveTo(p.shoulder[0], p.shoulder[1]); g.lineTo(p[arm[0]][0], p[arm[0]][1]); g.lineTo(p[arm[1]][0], p[arm[1]][1]);
    });
    g.stroke();
    // Head: a black ring around a white face, two dot eyes, no mouth.
    var hx = p.head[0], hy = p.head[1];
    g.fillStyle = INK; g.beginPath(); g.arc(hx, hy, 5.5, 0, Math.PI * 2); g.fill();
    g.fillStyle = PAPER; g.beginPath(); g.arc(hx, hy, 4, 0, Math.PI * 2); g.fill();
    var blink = (t % 4) > 3.85;
    g.fillStyle = INK;
    g.fillRect(hx - 2.5, hy - 1.5, 1.5, blink ? 0.5 : 2);
    g.fillRect(hx + 1, hy - 1.5, 1.5, blink ? 0.5 : 2);
    drawStickHat(stick.hat, hx, hy, t, flow);
    g.restore();
  }

  function drawStickHat(hat, hx, hy, t, flow) {
    var top = hy - 5.5;
    g.fillStyle = INK; g.strokeStyle = INK;
    if (hat === "cap") {
      g.beginPath(); g.arc(hx, top + 3, 5.5, Math.PI, 0); g.fill();
      g.fillRect(hx, top + 2, 8, 1.5);
    } else if (hat === "beanie") {
      g.beginPath(); g.arc(hx, top + 3.5, 5.8, Math.PI, 0); g.fill();
      g.fillStyle = PAPER; g.fillRect(hx - 6, top + 2.5, 12, 1);
      g.fillStyle = INK; g.beginPath(); g.arc(hx, top - 3, 1.8, 0, Math.PI * 2); g.fill();
    } else if (hat === "crown") {
      g.beginPath();
      g.moveTo(hx - 5, top + 2); g.lineTo(hx - 5, top - 4); g.lineTo(hx - 2.5, top - 1);
      g.lineTo(hx, top - 5); g.lineTo(hx + 2.5, top - 1); g.lineTo(hx + 5, top - 4); g.lineTo(hx + 5, top + 2);
      g.closePath(); g.fill();
      g.fillStyle = PAPER; g.fillRect(hx - 0.75, top - 0.5, 1.5, 1.5);
    } else if (hat === "top hat") {
      g.fillRect(hx - 4, top - 8, 8, 9);
      g.fillRect(hx - 6.5, top + 0.5, 13, 1.5);
      g.fillStyle = PAPER; g.fillRect(hx - 4, top - 2, 8, 1);
    } else if (hat === "wizard") {
      g.beginPath(); g.moveTo(hx - 6.5, top + 2); g.lineTo(hx + 6.5, top + 2); g.lineTo(hx + 2, top - 12); g.closePath(); g.fill();
      g.fillStyle = PAPER; g.fillRect(hx - 1, top - 3, 1.5, 1.5); g.fillRect(hx + 1.5, top - 7, 1, 1);
    } else if (hat === "headband") {
      g.fillRect(hx - 5.5, top + 2, 11, 2);
      g.lineWidth = 1.2;
      var w = Math.sin(t * 9);
      g.beginPath();
      g.moveTo(hx - 5, top + 3); g.lineTo(hx - 9 + flow * 0.3, top + 3 + w * 1.5);
      g.moveTo(hx - 5, top + 3); g.lineTo(hx - 8 + flow * 0.3, top + 6 - w * 1.5);
      g.stroke();
    } else if (hat === "headphones") {
      g.lineWidth = 1.5;
      g.beginPath(); g.arc(hx, hy, 6.5, Math.PI * 1.05, Math.PI * 1.95); g.stroke();
      g.fillRect(hx - 7.5, hy - 1.5, 2.5, 4); g.fillRect(hx + 5, hy - 1.5, 2.5, 4);
    }
  }

  function sceneStick(t) {
    g.fillStyle = PAPER; g.fillRect(0, 0, W, H);
    g.strokeStyle = INK; g.lineWidth = 1;
    // sun with slowly turning rays
    g.beginPath(); g.arc(268, 26, 10, 0, Math.PI * 2); g.stroke();
    g.beginPath();
    for (var r = 0; r < 8; r++) {
      var a = r * Math.PI / 4 + t * 0.3;
      g.moveTo(268 + Math.cos(a) * 14, 26 + Math.sin(a) * 14);
      g.lineTo(268 + Math.cos(a) * 18, 26 + Math.sin(a) * 18);
    }
    g.stroke();
    // doodled clouds and birds
    [[40, 22, 0.5], [150, 14, 0.3], [210, 34, 0.4]].forEach(function (c, i) {
      var cx = ((c[0] + t * 6 * c[2]) % (W + 60)) - 30;
      g.beginPath();
      g.arc(cx, c[1], 5, Math.PI * 0.9, Math.PI * 2.05);
      g.arc(cx + 8, c[1] - 2, 6, Math.PI, Math.PI * 2);
      g.arc(cx + 16, c[1], 5, Math.PI * 1.05, Math.PI * 0.1);
      g.lineTo(cx - 4, c[1] + 4.5 - (i % 2));
      g.stroke();
    });
    for (var b = 0; b < 3; b++) {
      var bx = ((100 + b * 22 + t * 12) % (W + 40)) - 20, by = 40 + b * 5, fl = Math.sin(t * 8 + b) * 1.5;
      g.beginPath(); g.moveTo(bx - 3, by - fl); g.lineTo(bx, by); g.lineTo(bx + 3, by - fl); g.stroke();
    }
    // outlined skyline
    eachBuilding(front, t * 10, function (bd, x, top) {
      g.fillStyle = PAPER; g.fillRect(x, top, bd.w, bd.h);
      g.strokeRect(x + 0.5, top + 0.5, bd.w - 1, bd.h);
      g.fillStyle = INK;
      for (var wy = top + 4; wy < H - 3; wy += 6) {
        for (var wx = x + 3; wx < x + bd.w - 3; wx += 5) if (hash(bd.s * 17 + wx + wy) > 0.55) g.fillRect(wx, wy, 2, 2);
      }
    });

    var move = stick.move;
    if (move === "swing") {
      var ax = ((t * 22 + 150) % (W + 120)) - 60, ay = -12;
      var ang = Math.sin(t * 1.8) * 0.65;
      var hx = ax + Math.sin(ang) * 36, hy = ay + Math.cos(ang) * 36;
      g.strokeStyle = INK; g.lineWidth = 1;
      g.beginPath(); g.moveTo(ax, ay); g.lineTo(hx, hy); g.stroke();
      // hang from the raised hand (local 2, -14), tilted with the swing
      var tilt = -ang * 0.6, c = Math.cos(tilt), s = Math.sin(tilt), S = STICK_SCALE;
      drawStickman(hx - S * (2 * c + 14 * s), hy - S * (2 * s - 14 * c), tilt, t, Math.cos(t * 1.8), -Math.cos(t * 1.8) * 6);
    } else if (move === "run") { // running along a rope stretched across the sky
      var rx = ((t * 34 + 120) % (W + 60)) - 30;
      var rope = function (x) { var d = (x - rx) / 40; return 50 + 4 * Math.sin(Math.PI * x / W) + 8 * Math.exp(-d * d); };
      g.strokeStyle = INK; g.lineWidth = 1;
      g.beginPath(); g.moveTo(0, rope(0));
      for (var sx = 4; sx <= W; sx += 4) g.lineTo(sx, rope(sx));
      g.stroke();
      drawStickman(rx, rope(rx) - 24 * STICK_SCALE - Math.abs(Math.sin(t * 12)) * 1.5, 0.12, t, 0, -8);
    } else { // flying, tipped forward
      var fx = ((t * 40 + 120) % (W + 80)) - 40, fy = 44 + Math.sin(t * 1.6) * 14;
      g.strokeStyle = INK; g.lineWidth = 1;
      g.beginPath(); // speed lines
      for (var l = 0; l < 3; l++) { g.moveTo(fx - 30 - l * 4, fy - 4 + l * 4); g.lineTo(fx - 20 - l * 4, fy - 4 + l * 4); }
      g.stroke();
      drawStickman(fx, fy, Math.PI / 2 - 0.15 + Math.cos(t * 1.6) * 0.1, t, 0, -3);
    }
  }

  /* ------------------------------------------------------------------ */
  /* Rocket Armor: an armored hero flying over a sunset city            */
  /* ------------------------------------------------------------------ */

  // Original design: red plates, gold trim, a cyan visor slit and a cyan chest core. Arms up,
  // so it flies "head first" when the canvas turns it on its side.
  var ARMOR = sprite([
    ".C......C.",
    ".G......G.",
    ".R......R.",
    ".R..KK..R.",
    ".R.KRRK.R.",
    ".R.RRRR.R.",
    ".R.GGGG.R.",
    ".R.CGGC.R.",
    ".R.GGGG.R.",
    ".RRRRRRRR.",
    ".RRRGGRRR.",
    ".RRGCCGRR.",
    "..RRGGRR..",
    "..RRRRRR..",
    "..GGGGGG..",
    "..RR..RR..",
    "..RR..RR..",
    "..GG..GG..",
    "..RR..RR..",
    "..DD..DD..",
  ], { R: "#c8102e", D: "#6e0816", G: "#f2b72a", C: "#7ff3ff", K: "#2a0508" });
  var armorTrail = [];

  function sceneArmor(t) {
    sky([[0, "#12030a"], [0.45, "#3a0a1a"], [0.8, "#a8361c"], [1, "#ff8a3a"]]);
    drawStars("#ffe3c0", "#6a2a3a");
    disc(58, 60, 16, "rgba(255,170,80,0.35)"); // low sun glow
    disc(58, 60, 10, "#ffb35c");
    drawCity(back, t * 8, "#3a0e18", "#ff8a3a", "#ffd27a");
    drawCity(front, t * 18, "#14060a", "#f2b72a", "#7ff3ff", ["#7ff3ff", "#123a40"]);

    var x = ((t * 46 + 140) % (W + 60)) - 30;
    var y = 34 + Math.sin(t * 1.4) * 12;
    var ang = Math.PI / 2 + Math.cos(t * 1.4) * 0.12;
    // fading thruster trail
    armorTrail.push({ x: x - 20, y: y + Math.sin(t * 1.4) * 0.5, life: 1 });
    if (armorTrail.length > 26) armorTrail.shift();
    armorTrail.forEach(function (p) {
      p.life -= 0.04;
      if (p.life <= 0 || p.x > x) return;
      g.fillStyle = "rgba(255," + Math.round(140 + p.life * 100) + ",60," + p.life.toFixed(2) + ")";
      g.fillRect(Math.round(p.x), Math.round(p.y), 2, 2);
    });
    g.save();
    g.translate(Math.round(x), Math.round(y));
    g.rotate(ang);
    var sw = ARMOR.width * 2, sh = ARMOR.height * 2;
    g.drawImage(ARMOR, -sw / 2, -sh / 2, sw, sh);
    var flick = frame % 6 < 3; // boot thrusters
    g.fillStyle = flick ? "#ffd23f" : "#ff7a1a";
    g.fillRect(-6, sh / 2, 4, 3 + (flick ? 2 : 0)); g.fillRect(2, sh / 2, 4, 3 + (flick ? 0 : 2));
    g.fillStyle = "rgba(127,243,255,0.5)"; // palm repulsors
    g.fillRect(-8, -sh / 2 - 3, 4, 3); g.fillRect(4, -sh / 2 - 3, 4, 3);
    g.restore();
  }

  /* ------------------------------------------------------------------ */
  /* Lab Mice: two mice cross the lab bench with a big plan             */
  /* ------------------------------------------------------------------ */

  var MOUSE_COLORS = { G: "#b9bccb", D: "#7d8196", P: "#ff9ec4", W: "#ffffff", K: "#15161f" };
  // A small mouse with a big round head, and a tall lanky one. Two walking frames each.
  var BIGHEAD = [
    sprite([
      "..PP.PP.....",
      ".PDDPDDP....",
      ".GGGGGGGG...",
      "GGGGGGGGGG..",
      "GGGGGGWKGG..",
      "GGGGGGGGGGGP",
      ".GGGGGGGGG..",
      "...GGGGG....",
      "P..GGGGG....",
      ".PPGG.GG....",
      "....D..D....",
    ], MOUSE_COLORS),
    sprite([
      "..PP.PP.....",
      ".PDDPDDP....",
      ".GGGGGGGG...",
      "GGGGGGGGGG..",
      "GGGGGGWKGG..",
      "GGGGGGGGGGGP",
      ".GGGGGGGGG..",
      "...GGGGG....",
      "P..GGGGG....",
      ".PPG.GG.....",
      "...D..D.....",
    ], MOUSE_COLORS),
  ];
  var LANKY = [
    sprite([
      "....PP....",
      "...PDDP...",
      "...GGGG...",
      "..GGWKGG..",
      "..GGGGGGGP",
      "...GGGG...",
      "....GG....",
      "...GGGG...",
      "..GGGGGG..",
      "...GGGG...",
      "P..GGGG...",
      ".PPG..G...",
      "...G...G..",
      "...D...D..",
    ], MOUSE_COLORS),
    sprite([
      "....PP....",
      "...PDDP...",
      "...GGGG...",
      "..GGWKGG..",
      "..GGGGGGGP",
      "...GGGG...",
      "....GG....",
      "...GGGG...",
      "..GGGGGG..",
      "...GGGG...",
      "P..GGGG...",
      ".PP.GG....",
      "....GG....",
      "....DD....",
    ], MOUSE_COLORS),
  ];
  var BEAKERS = [[28, "#3fbf6f"], [44, "#b04cff"], [60, "#4ab8ff"], [76, "#ffe14a"], [100, "#ff6e9c"], [116, "#3fbf6f"]];

  function sceneLab(t) {
    g.fillStyle = "#12261b"; g.fillRect(0, 0, W, H);
    g.fillStyle = "#183224"; // wall tiles
    for (var ty = 0; ty < H; ty += 8) g.fillRect(0, ty, W, 1);
    for (var tx = 0; tx < W; tx += 8) g.fillRect(tx, 0, 1, H);
    // night window with the moon
    g.fillStyle = "#2f5a40"; g.fillRect(222, 6, 72, 46);
    g.fillStyle = "#070d2a"; g.fillRect(226, 10, 64, 38);
    disc(272, 22, 7, "#fff4c8");
    for (var s = 0; s < 8; s++) { g.fillStyle = (frame + s * 15) % 90 < 8 ? "#5a6ad0" : "#ffffff"; g.fillRect(228 + hash(s) * 60, 12 + hash(s + 9) * 32, 1, 1); }
    g.fillStyle = "#2f5a40"; g.fillRect(257, 10, 2, 38); g.fillRect(226, 28, 64, 2);
    // shelf with bubbling beakers
    g.fillStyle = "#4a3424"; g.fillRect(20, 34, 112, 3);
    BEAKERS.forEach(function (bk, i) {
      var bx = bk[0], h = 8 + (i % 3) * 3;
      g.fillStyle = "rgba(220,255,240,0.25)"; g.fillRect(bx, 34 - h - 2, 9, h + 2);
      g.fillStyle = bk[1]; g.fillRect(bx + 1, 34 - h + 2, 7, h - 2);
      var by = 34 - h + 2 - ((t * 10 + i * 7) % 12);
      g.fillStyle = "#ffffff"; g.fillRect(bx + 2 + (i % 2) * 3, Math.round(by), 1, 1);
    });
    // blinking control panel
    g.fillStyle = "#1d3b2a"; g.fillRect(150, 12, 56, 30);
    g.fillStyle = "#07120c"; g.fillRect(154, 16, 30, 16);
    g.fillStyle = "#7dffa8";
    for (var wx = 0; wx < 30; wx++) g.fillRect(154 + wx, 24 + Math.round(Math.sin(wx * 0.6 + t * 6) * 5), 1, 1);
    ["#ff3b47", "#ffe14a", "#3fbf6f", "#4ab8ff"].forEach(function (c, i) {
      g.fillStyle = (frame + i * 17) % 50 < 25 ? c : "#24412f"; g.fillRect(190 + (i % 2) * 7, 17 + Math.floor(i / 2) * 8, 4, 4);
    });
    // lab bench
    g.fillStyle = "#5a3b26"; g.fillRect(0, 64, W, 3);
    g.fillStyle = "#2d1d12"; g.fillRect(0, 67, W, H - 67);

    var x = ((t * 22 + 100) % (W + 80)) - 50, step = Math.floor(t * 6) % 2;
    blit(LANKY[step], x, 64 - LANKY[0].height * 2, 2);
    blit(BIGHEAD[1 - step], x + 26, 64 - BIGHEAD[0].height * 2, 2);
    if (t % 9 > 5.5) { // the big-headed mouse dreams of the whole world
      var bx = x + 34, by = 18;
      g.fillStyle = "#ffffff";
      g.beginPath(); g.arc(bx + 10, by, 9, 0, Math.PI * 2); g.fill();
      g.fillRect(bx + 2, by + 9, 2, 2); g.fillRect(bx, by + 13, 1, 1);
      disc(bx + 10, by, 6, "#4ab8ff");
      g.fillStyle = "#3fbf6f"; g.fillRect(bx + 7, by - 3, 3, 3); g.fillRect(bx + 11, by + 1, 3, 2);
    }
  }

  /* ------------------------------------------------------------------ */
  /* Unicorn Sky: a unicorn gallops across the clouds                    */
  /* ------------------------------------------------------------------ */

  var UNI_COLORS = { W: "#ffffff", S: "#f1e4ff", P: "#ff7ac8", U: "#b07cff", B: "#7fd4ff", Y: "#ffd23f", K: "#5b3a78", H: "#c9a6e8" };
  var UNICORN = [
    sprite([
      ".............Y....",
      "............Y.....",
      "..........PPWW....",
      ".........PUWWWW...",
      "........PBWWKWWW..",
      "........PUWWWWWWW.",
      "........BWWWWW....",
      "PPU....SWWWW......",
      "PUBWWWWWWWWW......",
      ".UWWWWWWWWWW......",
      "..WWWWWWWWWS......",
      "..WW.W...WW.......",
      ".WW...W...WW......",
      ".HH...H....HH.....",
    ], UNI_COLORS),
    sprite([
      ".............Y....",
      "............Y.....",
      "..........PPWW....",
      ".........PUWWWW...",
      "........PBWWKWWW..",
      "........PUWWWWWWW.",
      "........BWWWWW....",
      ".PPU...SWWWW......",
      "PUBWWWWWWWWW......",
      "U.WWWWWWWWWW......",
      "..WWWWWWWWWS......",
      "...WW.W.WW........",
      "...W..W.W.W.......",
      "...H..H.H..H......",
    ], UNI_COLORS),
  ];
  var RAINBOW = ["#ff6b8a", "#ffa94d", "#ffe066", "#7be495", "#74c0fc", "#b197fc"];
  var sparkles = [];

  function cloud(x, y, s) {
    g.fillStyle = "#ffffff";
    [[0, 0, 6], [7, -3, 7], [15, 0, 6], [7, 2, 6]].forEach(function (c) {
      g.beginPath(); g.arc(x + c[0] * s, y + c[1] * s, c[2] * s, 0, Math.PI * 2); g.fill();
    });
  }

  function sceneUnicorn(t) {
    sky([[0, "#ffd6ec"], [0.55, "#e6d4ff"], [1, "#fff0d6"]]);
    disc(272, 24, 12, "#fff6b0");
    g.lineWidth = 3;
    RAINBOW.forEach(function (c, i) {
      g.strokeStyle = c; g.globalAlpha = 0.55;
      g.beginPath(); g.arc(150, 118, 92 - i * 3, Math.PI, Math.PI * 2); g.stroke();
    });
    g.globalAlpha = 1;
    for (var s = 0; s < 18; s++) { // twinkling sparkles
      var on = (frame + s * 13) % 70 < 35;
      if (!on) continue;
      var sx = Math.floor(hash(s + 3) * W), sy = Math.floor(hash(s + 40) * 60);
      g.fillStyle = s % 2 ? "#ffffff" : "#ff7ac8";
      g.fillRect(sx, sy - 1, 1, 3); g.fillRect(sx - 1, sy, 3, 1);
    }
    [[20, 20, 0.8, 4], [130, 12, 0.6, 2], [210, 40, 0.9, 5], [300, 26, 0.7, 3]].forEach(function (c) {
      cloud(((c[0] + t * c[3]) % (W + 60)) - 30, c[1], c[2]);
    });
    g.fillStyle = "#c3f0c8"; // pastel hills
    for (var hx = 0; hx < W; hx += 2) g.fillRect(hx, 84 + Math.sin(hx * 0.04 + 1) * 6, 2, H);

    var x = ((t * 38 + 130) % (W + 80)) - 40;
    var y = 34 + Math.abs(Math.sin(t * 5)) * -4 + Math.sin(t * 0.9) * 6;
    sparkles.push({ x: x + 2, y: y + 18, c: RAINBOW[frame % RAINBOW.length], life: 1 });
    if (sparkles.length > 40) sparkles.shift();
    sparkles.forEach(function (p) {
      p.life -= 0.025; p.y += 0.15;
      if (p.life <= 0 || p.x > x + 2) return;
      g.globalAlpha = Math.max(0, p.life);
      g.fillStyle = p.c; g.fillRect(Math.round(p.x), Math.round(p.y), 2, 2);
    });
    g.globalAlpha = 1;
    cloud(x + 4, y + 30, 0.45);
    blit(UNICORN[Math.floor(t * 8) % 2], x, y, 2);
  }

  /* ------------------------------------------------------------------ */
  /* Idol Hunters: a pop trio on stage sings away goofy little demons    */
  /* ------------------------------------------------------------------ */

  function idol(hair, outfit) {
    var c = { H: hair, S: "#f3c9a5", K: "#2a1030", O: outfit, T: "#3ff4ff", M: "#d9d9e6", B: "#ffffff" };
    return [
      sprite([
        "..HHHH..",
        ".HHHHHH.",
        ".HSSSSH.",
        ".HSKSKH.",
        ".HSSSSH.",
        "HH.SS.HH",
        "H.OOOO.H",
        ".SOTTOSM",
        ".S.OO..S",
        "...OO...",
        "..OOOO..",
        ".OOOOOO.",
        "..S..S..",
        "..S..S..",
        "..B..B..",
      ], c),
      sprite([
        "..HHHH.M",
        ".HHHHHHS",
        ".HSSSSHS",
        ".HSKSKHS",
        ".HSSSSH.",
        "HH.SS.HH",
        "H.OOOO.H",
        ".SOTTO..",
        ".S.OO...",
        "...OO...",
        "..OOOO..",
        ".OOOOOO.",
        "..S..S..",
        "..S...S.",
        "..B...B.",
      ], c),
    ];
  }
  var IDOLS = [idol("#ff2e93", "#1b1030"), idol("#8a5cff", "#1b1030"), idol("#3ff4ff", "#1b1030")];
  var DEMON = sprite([
    "Y.......Y",
    ".Y.....Y.",
    "..DDDDD..",
    ".DDWDWDD.",
    ".DDKDKDD.",
    ".DDDDDDD.",
    ".DDMMMDD.",
    "..D.D.D..",
  ], { Y: "#ffe14a", D: "#7a3cff", W: "#ffffff", K: "#160830", M: "#ffffff" });

  function sceneIdol(t) {
    sky([[0, "#0d0420"], [0.6, "#24083f"], [1, "#3a0a4a"]]);
    // LED wall with an equalizer
    g.fillStyle = "#140630"; g.fillRect(70, 6, 180, 30);
    for (var b = 0; b < 30; b++) {
      var h = Math.round(4 + Math.abs(Math.sin(t * 5 + b * 0.7) * Math.cos(t * 2 + b * 0.3)) * 22);
      g.fillStyle = ["#ff2e93", "#8a5cff", "#3ff4ff"][b % 3];
      g.fillRect(74 + b * 6, 34 - h, 4, h);
    }
    // sweeping spotlights
    [["rgba(255,46,147,0.18)", 40, 0.9], ["rgba(63,244,255,0.15)", 160, 1.3], ["rgba(255,216,74,0.13)", 280, 1.1]].forEach(function (L, i) {
      var a = Math.sin(t * L[2] + i) * 0.5;
      var tx = L[1] + Math.sin(a) * 120;
      g.fillStyle = L[0];
      g.beginPath(); g.moveTo(L[1], 0); g.lineTo(tx - 22, 68); g.lineTo(tx + 22, 68); g.closePath(); g.fill();
    });
    // goofy demons drift in and get sung away (they pop into sparkles)
    for (var d = 0; d < 4; d++) {
      var p = (t * 0.18 + d * 0.25) % 1, left = d % 2 === 0;
      var dx = left ? 4 + p * 92 : W - 22 - p * 92, dy = 10 + d * 9 + Math.sin(t * 2 + d) * 4;
      var mic = [160 + (left ? -24 : 24), 40];
      if (p < 0.82) {
        blit(DEMON, dx, dy, 2);
        var q = (p * 4) % 1; // a music note flies from the stage to the demon
        var nx = mic[0] + (dx + 8 - mic[0]) * q, ny = mic[1] + (dy + 8 - mic[1]) * q - Math.sin(q * Math.PI) * 10;
        g.fillStyle = ["#ff2e93", "#3ff4ff", "#ffe14a", "#8a5cff"][d];
        g.fillRect(Math.round(nx), Math.round(ny), 2, 2); g.fillRect(Math.round(nx) + 1, Math.round(ny) - 4, 1, 4); g.fillRect(Math.round(nx) + 2, Math.round(ny) - 4, 2, 1);
      } else {
        var k = (p - 0.82) / 0.18;
        g.fillStyle = k < 0.5 ? "#ffe14a" : "#ff8ac4";
        for (var r = 0; r < 8; r++) {
          var ang = r * Math.PI / 4;
          g.fillRect(Math.round(dx + 8 + Math.cos(ang) * k * 14), Math.round(dy + 8 + Math.sin(ang) * k * 14), 2, 2);
        }
      }
    }
    // stage and the trio
    g.fillStyle = "#ff2e93"; g.fillRect(0, 66, W, 1);
    g.fillStyle = "#1a0830"; g.fillRect(0, 67, W, H - 67);
    IDOLS.forEach(function (fr, i) {
      var beat = Math.floor(t * 4 + i) % 2;
      blit(fr[beat], 136 + i * 24 - 8, 66 - fr[0].height * 2 - (beat ? 1 : 0), 2);
    });
  }

  /* ------------------------------------------------------------------ */
  /* Animation loop                                                      */
  /* ------------------------------------------------------------------ */

  var SCENES = { web: sceneWeb, stick: sceneStick, armor: sceneArmor, lab: sceneLab, unicorn: sceneUnicorn, idol: sceneIdol };
  var frame = 0;
  var t0 = performance.now();
  function draw(now) {
    frame++;
    g.save();
    SCENES[theme](Math.max(0, (now - t0) / 1000)); // the first frame's timestamp can be a hair before t0
    g.restore();
    if (!reduceMotion) requestAnimationFrame(draw);
  }
  requestAnimationFrame(draw);
  function redraw() { if (reduceMotion) requestAnimationFrame(draw); } // no loop, so draw changes once

  /* ------------------------------------------------------------------ */
  /* Theme picker                                                        */
  /* ------------------------------------------------------------------ */

  // The theme cards live in the player menu (profile.js opens and closes it).
  var list = document.getElementById("theme-list");
  if (!list) return;
  var stickBox = document.getElementById("stick-options");
  var themeButtons = [], stickButtons = [];

  THEMES.forEach(function (th) {
    var b = document.createElement("button");
    b.type = "button";
    b.className = "theme-card";
    var dots = document.createElement("span");
    dots.className = "theme-dots";
    th.dots.forEach(function (c) {
      var d = document.createElement("span");
      d.style.background = c;
      dots.appendChild(d);
    });
    var name = document.createElement("span");
    name.className = "theme-name";
    name.textContent = th.name;
    var note = document.createElement("span");
    note.className = "theme-note";
    note.textContent = th.note;
    b.appendChild(dots); b.appendChild(name); b.appendChild(note);
    b.addEventListener("click", function () { setTheme(th.id); sound.blip(); });
    themeButtons.push({ id: th.id, button: b });
    list.appendChild(b);
  });

  Object.keys(STICK_OPTIONS).forEach(function (key) {
    var opt = STICK_OPTIONS[key];
    var row = document.createElement("div");
    row.className = "hero-group";
    row.setAttribute("role", "group");
    row.setAttribute("aria-label", "Stick figure " + opt.label.toLowerCase());
    var label = document.createElement("span");
    label.className = "hero-group-label";
    label.textContent = opt.label;
    row.appendChild(label);
    opt.values.forEach(function (v) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "pick";
      b.textContent = v;
      b.setAttribute("aria-label", opt.label + ": " + v);
      b.addEventListener("click", function () {
        stick[key] = v;
        try { localStorage.setItem(STICK_KEY, JSON.stringify(stick)); } catch (e) { /* ignore */ }
        renderPicker(); redraw(); sound.blip();
      });
      stickButtons.push({ key: key, value: v, button: b });
      row.appendChild(b);
    });
    stickBox.appendChild(row);
  });

  function setTheme(id) {
    theme = themeDef(id).id;
    document.documentElement.setAttribute("data-theme", theme);
    try { localStorage.setItem(THEME_KEY, theme); } catch (e) { /* ignore */ }
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", themeDef(theme).bar);
    armorTrail.length = 0; sparkles.length = 0;
    renderPicker(); redraw();
  }
  function renderPicker() {
    themeButtons.forEach(function (x) { x.button.setAttribute("aria-pressed", x.id === theme ? "true" : "false"); });
    stickButtons.forEach(function (x) { x.button.setAttribute("aria-pressed", stick[x.key] === x.value ? "true" : "false"); });
    stickBox.hidden = theme !== "stick";
  }
  setTheme(theme);
})();
