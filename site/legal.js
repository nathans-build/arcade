// Fills the owner and contact email into the Terms and Privacy pages (from site-info.js).
(function () {
  "use strict";
  var info = window.SITE_INFO || {};
  Array.prototype.forEach.call(document.querySelectorAll("[data-site-owner]"), function (el) {
    el.textContent = info.owner || "SpiderBen10's parent";
  });
  Array.prototype.forEach.call(document.querySelectorAll("[data-site-email]"), function (el) {
    if (info.email) {
      var a = document.createElement("a");
      a.href = "mailto:" + info.email;
      a.textContent = info.email;
      el.textContent = "";
      el.appendChild(a);
    } else {
      el.textContent = "(contact email coming soon)";
    }
  });
  try {
    var g = localStorage.getItem("arcade.grade");
    var back = document.getElementById("back");
    if (g && back) back.href = "./?grade=" + encodeURIComponent(g);
  } catch (e) { /* ignore */ }
})();
