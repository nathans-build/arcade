// Sets the saved theme on <html> before the page draws, so it never flashes the wrong colors.
// The theme list must match THEMES in marquee.js.
(function () {
  "use strict";
  var themes = ["web", "stick", "armor", "lab", "unicorn", "idol"];
  var t = null;
  try { t = localStorage.getItem("arcade.theme"); } catch (e) { /* ignore */ }
  document.documentElement.setAttribute("data-theme", themes.indexOf(t) >= 0 ? t : "web");
})();
