// SpiderBen10's Arcade — the "Support the arcade" button (player menu and credits page).
// It opens support.html, which starts with a quick grown-up check. Hidden on the real site
// until site/support-config.js has a tip link or a charity.
(function () {
  "use strict";
  var cfg = window.SUPPORT || {};
  var ready = (cfg.tips && cfg.tips.length) || cfg.charity;
  if (!ready && window.ARCADE_ENV !== "dev") return;
  Array.prototype.forEach.call(document.querySelectorAll(".tip-jar-btn"), function (b) {
    b.hidden = false;
    b.addEventListener("click", function () { window.location.href = "support.html"; });
  });
})();
