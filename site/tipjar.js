// SpiderBen10's Arcade — the tip jar (for grown-ups). Plain JS, no build step.
//
// Every game stays free. The "☕ Tip jar" button sits in the player menu and on the credits page,
// and opens a quick grown-up check (a times-table question) before showing the tip links.
// The arcade never sees any payment details: each link opens the payment provider's own page.
(function () {
  "use strict";

  // Paste the tip links here (public payment-page URLs, never keys or passwords).
  // Until at least one is set, the button is hidden on the real site and shows a
  // "not set up yet" note on the dev site.
  var TIP_LINKS = [
    // { label: "Tip with a card, Apple Pay or Google Pay", url: "https://buy.stripe.com/..." },
    // { label: "Tip with Venmo", url: "https://venmo.com/u/..." },
  ];

  var buttons = document.querySelectorAll(".tip-jar-btn");
  var dev = window.ARCADE_ENV === "dev";
  if (!buttons.length || (!TIP_LINKS.length && !dev)) return;
  Array.prototype.forEach.call(buttons, function (b) {
    b.hidden = false;
    b.addEventListener("click", open);
  });

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }
  function blip() { if (window.ArcadeSound) window.ArcadeSound.blip(); }

  var root = null, box = null, lastFocus = null;

  function open() {
    lastFocus = document.activeElement;
    root = el("div", "modal-root");
    root.appendChild(el("div", "wizard-shade"));
    box = el("div", "wizard tip-jar");
    box.setAttribute("role", "dialog");
    box.setAttribute("aria-modal", "true");
    box.setAttribute("aria-labelledby", "tip-title");
    root.appendChild(box);
    root.addEventListener("click", function (ev) { if (ev.target.classList.contains("wizard-shade")) close(); });
    box.addEventListener("keydown", function (ev) { if (ev.key === "Escape") { ev.preventDefault(); close(); } });
    document.body.appendChild(root);
    document.body.classList.add("modal-open");
    gate();
    blip();
  }
  function close() {
    if (!root) return;
    root.parentNode.removeChild(root);
    root = null;
    document.body.classList.remove("modal-open");
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  function head(title) {
    box.textContent = "";
    var h = el("h2", "wizard-title", title);
    h.id = "tip-title";
    box.appendChild(el("p", "eyebrow", "For grown-ups"));
    box.appendChild(h);
  }
  function closeButton(text) {
    var b = el("button", "adapt-reset", text || "Close");
    b.type = "button";
    b.addEventListener("click", close);
    return b;
  }

  // A quick grown-up check, so kids don't wander into a payment page.
  function gate(wrong) {
    var a = 6 + Math.floor(Math.random() * 4), b = 6 + Math.floor(Math.random() * 4);
    head("☕ Tip jar");
    box.appendChild(el("p", "hint", wrong ? "Not quite. Kids, please ask a grown-up for help!" : "Kids: please ask a grown-up to open this."));
    var form = el("form", "tip-gate");
    var label = el("label", null, "Grown-ups: what is " + a + " × " + b + "?");
    label.setAttribute("for", "tip-answer");
    var input = el("input", "text-input");
    input.id = "tip-answer";
    input.type = "text";
    input.inputMode = "numeric";
    input.autocomplete = "off";
    input.maxLength = 3;
    var go = el("button", "adapt-btn on", "Check ▶");
    go.type = "submit";
    form.appendChild(label); form.appendChild(input); form.appendChild(go);
    form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      if (Number(input.value.trim()) === a * b) { blip(); links(); } else gate(true);
    });
    box.appendChild(form);
    var foot = el("div", "wizard-foot");
    foot.appendChild(closeButton());
    box.appendChild(foot);
    input.focus();
  }

  function links() {
    head("☕ Thanks for supporting the arcade!");
    box.appendChild(el("p", "tip-text", "Every game here is free, with no ads and no tracking. Tips help pay for the website and for new games and stories by SpiderBen10 (NZDO)."));
    var list = el("div", "tip-links");
    if (!TIP_LINKS.length) {
      list.appendChild(el("p", "hint", "(Dev site preview: no tip link has been set up yet. Add one to TIP_LINKS in site/tipjar.js.)"));
    }
    TIP_LINKS.forEach(function (t) {
      var a = el("a", "adapt-btn on tip-link", t.label + " ↗");
      a.href = t.url;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      list.appendChild(a);
    });
    box.appendChild(list);
    box.appendChild(el("p", "fine", "Tips are optional and not tax-deductible. Payments are handled on the provider's own page; this arcade never sees card or account details."));
    var foot = el("div", "wizard-foot");
    foot.appendChild(closeButton("Done"));
    box.appendChild(foot);
    var first = list.querySelector("a") || foot.querySelector("button");
    if (first) first.focus();
  }
})();
