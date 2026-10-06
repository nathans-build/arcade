// On the dev (test) site, show a small DEV ribbon and mark the tab, so nobody mistakes it for
// the real arcade at nzdogames.com. Production shows nothing.
(function () {
  "use strict";
  if (window.ARCADE_ENV !== "dev") return;
  document.title = "[DEV] " + document.title;
  function add() {
    var a = document.createElement("a");
    a.className = "dev-ribbon";
    a.href = "https://nzdogames.com/";
    a.textContent = "DEV · test site · real arcade: nzdogames.com";
    a.setAttribute("aria-label", "This is the test site. The real arcade is at nzdogames.com");
    document.body.appendChild(a);
  }
  if (document.body) add();
  else document.addEventListener("DOMContentLoaded", add);
})();
