// SpiderBen10's Arcade — the support page: a quick grown-up check, then two separate ways to
// help: tip the arcade, or give straight to a children's charity. Links come from support-config.js.
(function () {
  "use strict";

  var cfg = window.SUPPORT || {};
  var tips = cfg.tips || [];
  var charity = cfg.charity;
  var main = document.getElementById("support");

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }
  function linkButton(label, url) {
    var a = el("a", "adapt-btn on support-link", label + " ↗");
    a.href = url;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    return a;
  }

  // Keep the grade on the way back to the arcade.
  try {
    var g = localStorage.getItem("arcade.grade");
    if (g) document.getElementById("back").href = "./?grade=" + encodeURIComponent(g);
  } catch (e) { /* ignore */ }

  // A quick grown-up check, so kids don't wander into payment pages.
  function gate(wrong) {
    var a = 6 + Math.floor(Math.random() * 4), b = 6 + Math.floor(Math.random() * 4);
    main.textContent = "";
    var sec = el("section", "support-card");
    sec.appendChild(el("h2", null, "Grown-ups only"));
    sec.appendChild(el("p", "hint", wrong ? "Not quite. Kids, please ask a grown-up for help!" : "Kids: please ask a grown-up to open this page."));
    var form = el("form", "tip-gate");
    var label = el("label", null, "Grown-ups: what is " + a + " × " + b + "?");
    label.setAttribute("for", "gate-answer");
    var input = el("input", "text-input");
    input.id = "gate-answer";
    input.type = "text";
    input.inputMode = "numeric";
    input.autocomplete = "off";
    input.maxLength = 3;
    var go = el("button", "adapt-btn on", "Continue ▶");
    go.type = "submit";
    form.appendChild(label); form.appendChild(input); form.appendChild(go);
    form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      if (Number(input.value.trim()) === a * b) show(); else gate(true);
    });
    sec.appendChild(form);
    main.appendChild(sec);
    input.focus();
  }

  function show() {
    main.textContent = "";
    var grid = el("div", "support-grid");

    var tip = el("section", "support-card");
    tip.appendChild(el("h2", null, "☕ Tip the arcade"));
    tip.appendChild(el("p", null, "Tips help pay for the website and for new games and stories by SpiderBen10 (NZDO). They're optional and not tax-deductible."));
    if (tips.length) tips.forEach(function (t) { tip.appendChild(linkButton(t.label, t.url)); });
    else tip.appendChild(el("p", "hint", "Tip links are coming soon."));
    grid.appendChild(tip);

    var give = el("section", "support-card");
    give.appendChild(el("h2", null, "💛 Give to a children's charity"));
    if (charity) {
      give.appendChild(el("p", null, (charity.about ? charity.about + " " : "") + "Your gift goes straight to " + charity.name + ", not to the arcade, and may be tax-deductible (see their page)."));
      give.appendChild(linkButton("Give to " + charity.name, charity.url));
    } else {
      give.appendChild(el("p", "hint", "We're choosing a children's charity. Check back soon!"));
    }
    grid.appendChild(give);
    main.appendChild(grid);

    var priv = el("section", "support-card");
    priv.id = "privacy";
    priv.appendChild(el("h2", null, "What we measure"));
    priv.appendChild(el("p", null, "To learn which games kids enjoy, the arcade counts anonymous daily totals: which games are played and for how long, plus grade, device type (phone, tablet or computer), time zone and theme. We don't collect names, emails, IP addresses or cookies, and nothing is shared or sold. Browsers that send Global Privacy Control aren't counted."));
    main.appendChild(priv);

    var first = main.querySelector("a.support-link");
    if (first) first.focus();
  }

  gate(false);
})();
