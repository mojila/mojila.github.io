/* Client-side entry lock for mojila.github.io.
   Not real access control: static hosting cannot authenticate. It keeps casual
   visitors out of the rendered pages; anyone can still fetch the raw HTML. */
(function () {
  "use strict";

  var KEY = "insights-unlocked";
  var SALT = "mojila-insights-v1:";
  // SHA-256 of SALT + the entry password. The plaintext is not stored here.
  var EXPECTED = "bc6759720b4e987a5073bc5143157d856f5b1a10e655a33aa907a8fa4a21b02b";

  var root = document.documentElement;

  function unlocked() {
    try { return sessionStorage.getItem(KEY) === EXPECTED; } catch (e) { return false; }
  }

  function unlock() {
    try { sessionStorage.setItem(KEY, EXPECTED); } catch (e) { /* private mode */ }
    root.classList.remove("gate-locked");
    var gate = document.getElementById("gate");
    if (gate) gate.remove();
    document.body.style.visibility = "";
  }

  async function sha256(text) {
    var data = new TextEncoder().encode(text);
    var digest = await crypto.subtle.digest("SHA-256", data);
    return Array.from(new Uint8Array(digest))
      .map(function (b) { return b.toString(16).padStart(2, "0"); })
      .join("");
  }

  if (unlocked()) return;

  root.classList.add("gate-locked");

  var css = document.createElement("style");
  css.textContent = [
    "html.gate-locked body{visibility:hidden!important}",
    "html.gate-locked{overflow:hidden}",
    "#gate{position:fixed;inset:0;z-index:2147483647;display:grid;place-items:center;",
    "padding:24px;background:#fbfaf7;color:#15171b;",
    'font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Inter,Helvetica,Arial,sans-serif;',
    "-webkit-font-smoothing:antialiased;visibility:visible!important}",
    "#gate *{box-sizing:border-box}",
    "#gate .gate-card{width:100%;max-width:384px;background:#fff;border:1px solid #cfc9bb;",
    "padding:36px 34px 28px;border-radius:3px}",
    "#gate .gate-brand{font-family:ui-monospace,'SF Mono',Menlo,Consolas,monospace;",
    "font-size:10px;letter-spacing:.16em;text-transform:uppercase;color:#0b6b4f;margin-bottom:16px}",
    "#gate h1{font-family:'Iowan Old Style','Palatino Linotype',Palatino,Georgia,serif;",
    "font-weight:normal;font-size:34px;line-height:1.1;margin:0 0 10px;letter-spacing:-.01em}",
    "#gate .gate-sub{font-size:13.5px;line-height:1.55;color:#6b7078;margin:0 0 24px}",
    "#gate label{display:block;font-family:ui-monospace,'SF Mono',Menlo,Consolas,monospace;",
    "font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:#6b7078;margin-bottom:7px}",
    "#gate .gate-row{display:flex;gap:8px}",
    "#gate input{flex:1;min-width:0;font:inherit;font-size:14px;padding:10px 12px;",
    "border:1px solid #cfc9bb;border-radius:2px;background:#fbfaf7;color:#15171b}",
    "#gate input:focus{outline:2px solid #0b6b4f;outline-offset:-1px;background:#fff}",
    "#gate button{font:inherit;font-size:13px;font-weight:600;padding:10px 16px;cursor:pointer;",
    "border:1px solid #0b6b4f;border-radius:2px;background:#0b6b4f;color:#fff}",
    "#gate button:hover{background:#09553f;border-color:#09553f}",
    "#gate button:disabled{opacity:.55;cursor:wait}",
    "#gate .gate-error{min-height:18px;margin:10px 0 0;font-size:12.5px;color:#a02c2c}",
    "#gate .gate-foot{margin:18px 0 0;padding-top:14px;border-top:1px solid #e2ded4;",
    "font-size:11px;color:#9aa0a8;line-height:1.5}",
    "#gate .gate-shake{animation:gate-shake .28s ease}",
    "@keyframes gate-shake{0%,100%{transform:translateX(0)}25%{transform:translateX(-5px)}",
    "75%{transform:translateX(5px)}}",
    "@media (prefers-reduced-motion:reduce){#gate .gate-shake{animation:none}}"
  ].join("");
  document.head.appendChild(css);

  document.addEventListener("DOMContentLoaded", function () {
    if (unlocked()) return;

    var gate = document.createElement("div");
    gate.id = "gate";
    gate.setAttribute("role", "dialog");
    gate.setAttribute("aria-modal", "true");
    gate.setAttribute("aria-labelledby", "gate-title");
    gate.innerHTML =
      '<form class="gate-card" novalidate>' +
        '<div class="gate-brand">Mojila · Income Desk</div>' +
        '<h1 id="gate-title">Insights</h1>' +
        '<p class="gate-sub">This workspace is private. Enter the password to continue.</p>' +
        '<label for="gate-pass">Password</label>' +
        '<div class="gate-row">' +
          '<input id="gate-pass" type="password" name="password" autocomplete="current-password" ' +
            'spellcheck="false" required aria-describedby="gate-error">' +
          '<button type="submit">Enter</button>' +
        '</div>' +
        '<p class="gate-error" id="gate-error" role="alert" aria-live="polite"></p>' +
        '<p class="gate-foot">Session-only client-side lock. Close the tab to relock.</p>' +
      "</form>";
    root.appendChild(gate);

    var form = gate.querySelector("form");
    var input = gate.querySelector("#gate-pass");
    var button = gate.querySelector("button");
    var error = gate.querySelector("#gate-error");
    var card = gate.querySelector(".gate-card");

    input.focus();

    form.addEventListener("submit", async function (event) {
      event.preventDefault();
      error.textContent = "";

      var value = input.value;
      if (!value) {
        error.textContent = "Enter the password.";
        return;
      }
      if (!(window.crypto && crypto.subtle)) {
        error.textContent = "This lock needs a secure (https) page.";
        return;
      }

      button.disabled = true;
      try {
        var hash = await sha256(SALT + value);
        if (hash === EXPECTED) {
          unlock();
        } else {
          error.textContent = "That password is not right.";
          card.classList.remove("gate-shake");
          void card.offsetWidth;
          card.classList.add("gate-shake");
          input.select();
        }
      } catch (e) {
        error.textContent = "Could not verify the password. Try again.";
      } finally {
        button.disabled = false;
      }
    });
  });
})();
