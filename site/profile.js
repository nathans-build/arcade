// SpiderBen10's Arcade — players on this device. Plain JS, no build step.
//
// Each player has a name and an arcade name ("Nathan's Arcade"). Everything else a player
// owns is ordinary localStorage that the menu and the games already use: grade, theme,
// adaptive math, read aloud, favorites, and every game's progress, scores and saves.
// Those keys always hold the *active* player's values. Switching players files the current
// values away under the old player and puts the new player's back, then reloads the menu.
// Nothing leaves the device.
(function () {
  "use strict";

  var STORE_KEY = "arcade.profiles";
  var DEVICE_KEYS = [STORE_KEY, "arcade.muted"]; // shared by everyone on the device
  var MAX_PLAYERS = 6;
  var DEFAULT_ARCADE = "SpiderBen10's Arcade";

  function owned(k) {
    if (DEVICE_KEYS.indexOf(k) >= 0) return false;
    return k.indexOf("arcade.") === 0 || k.indexOf("pageQuest.") === 0 || k.indexOf("lunarPatrol.") === 0;
  }
  function liveKeys() {
    var out = [];
    try { for (var i = 0; i < localStorage.length; i++) { var k = localStorage.key(i); if (k && owned(k)) out.push(k); } } catch (e) { /* ignore */ }
    return out;
  }
  function snapshot() {
    var d = {};
    liveKeys().forEach(function (k) { try { d[k] = localStorage.getItem(k); } catch (e) { /* ignore */ } });
    return d;
  }
  function clearLive() { liveKeys().forEach(function (k) { try { localStorage.removeItem(k); } catch (e) { /* ignore */ } }); }
  function restore(d) { Object.keys(d || {}).forEach(function (k) { if (owned(k)) try { localStorage.setItem(k, d[k]); } catch (e) { /* ignore */ } }); }
  function newId() { return "p" + Date.now().toString(36) + Math.floor(Math.random() * 1e4).toString(36); }

  var storageOk = true;
  var store = (function () {
    var s = null;
    try { s = JSON.parse(localStorage.getItem(STORE_KEY) || "null"); } catch (e) { storageOk = false; }
    if (s && Array.isArray(s.list) && s.list.length) {
      s.data = s.data || {};
      if (!s.list.some(function (p) { return p.id === s.active; })) s.active = s.list[0].id;
      return s;
    }
    // First visit (or the first visit since players were added): one player keeps whatever
    // is already saved on this device.
    var first = { id: newId(), name: "Player 1", arcadeName: DEFAULT_ARCADE, autoArcade: true };
    return { v: 1, active: first.id, list: [first], data: {}, fresh: liveKeys().length === 0 };
  })();
  var isNewDevice = !!store.fresh;
  delete store.fresh;
  function save() { try { localStorage.setItem(STORE_KEY, JSON.stringify(store)); } catch (e) { /* ignore */ } }
  save();

  function active() { for (var i = 0; i < store.list.length; i++) if (store.list[i].id === store.active) return store.list[i]; return store.list[0]; }
  function arcadeNameFor(name) { return name ? name + "'s Arcade" : DEFAULT_ARCADE; }
  function reloadMenu(extra) { window.location.href = window.location.pathname + (extra || ""); }

  function switchTo(id) {
    if (id === store.active) return;
    store.data[store.active] = snapshot();
    clearLive();
    restore(store.data[id]);
    delete store.data[id];
    store.active = id;
    save();
    reloadMenu();
  }
  function addPlayer() {
    if (store.list.length >= MAX_PLAYERS) return;
    store.data[store.active] = snapshot();
    clearLive();
    var p = { id: newId(), name: "Player " + (store.list.length + 1), arcadeName: DEFAULT_ARCADE, autoArcade: true };
    store.list.push(p);
    store.active = p.id;
    save();
    reloadMenu("?welcome=1");
  }
  function deletePlayer() {
    if (store.list.length < 2) return;
    var p = active();
    if (!window.confirm("Delete " + p.name + "? Their grade, theme, favorites and game progress on this device will be erased.")) return;
    clearLive();
    store.list = store.list.filter(function (x) { return x.id !== p.id; });
    delete store.data[p.id];
    var next = store.list[0];
    restore(store.data[next.id]);
    delete store.data[next.id];
    store.active = next.id;
    save();
    reloadMenu();
  }

  /* ------------------------------------------------------------------ */
  /* Arcade name in the banner and tab                                    */
  /* ------------------------------------------------------------------ */

  function renderName() {
    var p = active();
    var title = p.arcadeName || DEFAULT_ARCADE;
    document.title = (window.ARCADE_ENV === "dev" ? "[DEV] " : "") + title;
    var h1 = document.getElementById("arcade-title");
    if (h1) {
      var words = title.trim().split(/\s+/);
      var last = words.length > 1 ? words.pop() : "";
      h1.textContent = "";
      var a = document.createElement("span"); a.className = "h-red"; a.textContent = words.join(" ");
      h1.appendChild(a);
      if (last) {
        h1.appendChild(document.createTextNode(" "));
        var b = document.createElement("span"); b.className = "h-blue"; b.textContent = last;
        h1.appendChild(b);
      }
    }
    var label = document.getElementById("profile-name");
    if (label) label.textContent = p.name;
    var who = document.getElementById("player-name");
    if (who) who.textContent = p.name;
  }
  renderName();

  /* ------------------------------------------------------------------ */
  /* The player menu                                                     */
  /* ------------------------------------------------------------------ */

  // app.js loads after this file and provides the sounds, so look them up when needed.
  var sound = {
    blip: function () { if (window.ArcadeSound) window.ArcadeSound.blip(); },
    coin: function () { if (window.ArcadeSound) window.ArcadeSound.coin(); },
  };
  var btn = document.getElementById("profile-btn");
  var panel = document.getElementById("profile-panel");
  if (!btn || !panel) return;
  var playersBox = document.getElementById("players");
  var nameInput = document.getElementById("player-name-input");
  var arcadeInput = document.getElementById("arcade-name-input");
  var welcome = document.getElementById("profile-welcome");
  var delBtn = document.getElementById("player-delete");

  function renderPlayers() {
    playersBox.textContent = "";
    store.list.forEach(function (p) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "pick player-chip";
      b.textContent = p.name;
      b.setAttribute("aria-pressed", p.id === store.active ? "true" : "false");
      b.setAttribute("aria-label", p.id === store.active ? p.name + " (playing now)" : "Switch to " + p.name);
      b.addEventListener("click", function () { if (p.id !== store.active) { sound.coin(); switchTo(p.id); } });
      playersBox.appendChild(b);
    });
    if (store.list.length < MAX_PLAYERS) {
      var add = document.createElement("button");
      add.type = "button";
      add.className = "pick player-add";
      add.textContent = "+ New player";
      add.addEventListener("click", function () { sound.blip(); addPlayer(); });
      playersBox.appendChild(add);
    }
    delBtn.hidden = store.list.length < 2;
    delBtn.textContent = "Delete " + active().name;
  }

  nameInput.value = active().name;
  arcadeInput.value = active().arcadeName;
  nameInput.addEventListener("input", function () {
    var p = active();
    p.name = nameInput.value.trim().slice(0, 20) || "Player";
    if (p.autoArcade) { p.arcadeName = arcadeNameFor(nameInput.value.trim().slice(0, 20)); arcadeInput.value = p.arcadeName; }
    save(); renderName(); renderPlayers();
  });
  arcadeInput.addEventListener("input", function () {
    var p = active();
    p.arcadeName = arcadeInput.value.trim().slice(0, 30) || DEFAULT_ARCADE;
    p.autoArcade = arcadeInput.value.trim() === "";
    save(); renderName();
  });
  delBtn.addEventListener("click", deletePlayer);

  // Read aloud: AUTO lets each game decide (on for early readers), or force it on or off.
  var READ_KEY = "arcade.readAloud";
  var readBtn = document.getElementById("read-btn");
  var readNote = document.getElementById("read-note");
  function readMode() { var v = null; try { v = localStorage.getItem(READ_KEY); } catch (e) { /* ignore */ } return v === "1" ? "ON" : v === "0" ? "OFF" : "AUTO"; }
  function renderRead() {
    var m = readMode();
    readBtn.innerHTML = "Read aloud: <strong>" + m + "</strong>";
    readBtn.classList.toggle("on", m !== "OFF");
    readNote.textContent = m === "AUTO" ? "On for grades K–2, off for older grades." : m === "ON" ? "Games read questions out loud." : "Games stay quiet unless you turn it on in a game.";
  }
  readBtn.addEventListener("click", function () {
    var m = readMode();
    try {
      if (m === "AUTO") localStorage.setItem(READ_KEY, "1");
      else if (m === "ON") localStorage.setItem(READ_KEY, "0");
      else localStorage.removeItem(READ_KEY);
    } catch (e) { /* ignore */ }
    renderRead(); sound.blip();
  });
  renderRead();

  function openPanel(open, focusName) {
    panel.hidden = !open;
    btn.setAttribute("aria-expanded", open ? "true" : "false");
    if (open) {
      renderPlayers();
      if (focusName) { nameInput.focus(); nameInput.select(); }
      else { var cur = playersBox.querySelector('[aria-pressed="true"]'); if (cur) cur.focus(); }
      if (panel.scrollIntoView) panel.scrollIntoView({ block: "start", behavior: "smooth" });
    } else {
      welcome.hidden = true;
      btn.focus();
    }
  }
  btn.addEventListener("click", function () { openPanel(panel.hidden, false); sound.blip(); });
  var change = document.getElementById("player-change");
  if (change) change.addEventListener("click", function () { openPanel(true, false); sound.blip(); });
  document.getElementById("profile-done").addEventListener("click", function () { openPanel(false); sound.coin(); });
  panel.addEventListener("keydown", function (ev) {
    if (ev.key === "Escape") { ev.preventDefault(); openPanel(false); }
    if (ev.key === "Enter" && (ev.target === nameInput || ev.target === arcadeInput)) { ev.preventDefault(); openPanel(false); sound.coin(); }
  });

  function setName(name) {
    nameInput.value = name;
    nameInput.dispatchEvent(new Event("input"));
  }

  // A new player (a brand-new device, or "+ New player") gets the setup wizard (welcome.js).
  var params = new URLSearchParams(window.location.search);
  var needsWelcome = storageOk && (isNewDevice || params.has("welcome"));
  if (params.has("welcome") && window.history.replaceState) window.history.replaceState(null, "", window.location.pathname);
  window.ArcadePlayers = {
    needsWelcome: needsWelcome,
    name: function () { return active().name; },
    setName: setName,
    openMenu: function () { openPanel(true, false); },
    closeMenu: function () { if (!panel.hidden) openPanel(false); },
  };
  if (needsWelcome && !document.getElementById("wizard-root")) { // no wizard on this page: fall back to the menu
    welcome.hidden = false;
    openPanel(true, true);
  }
})();
